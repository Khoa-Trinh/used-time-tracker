#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use active_win_pos_rs::get_active_window;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::OnceLock, thread};
use tokio::sync::mpsc;
use tray_icon::{
    menu::{IconMenuItem, Menu, MenuEvent, MenuItem, PredefinedMenuItem, Icon as MenuIcon},
    Icon as TrayIcon, TrayIconBuilder,
};
use windows::{
    core::PCWSTR,
    Win32::{
        Foundation::{GetLastError, ERROR_ALREADY_EXISTS, HWND},
        System::Threading::CreateMutexW,
        UI::{
            Accessibility::{SetWinEventHook, HWINEVENTHOOK},
            WindowsAndMessaging::{
                DispatchMessageW, GetMessageW, TranslateMessage, EVENT_SYSTEM_FOREGROUND, MSG,
                WINEVENT_OUTOFCONTEXT,
            },
        },
    },
};

// --- Models ---

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    pub server_url: String,
    pub api_key: Option<String>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server_url: "http://localhost:3000/api/log-session".to_string(),
            api_key: None,
        }
    }
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct SessionPayload {
    device_id: String,
    device_platform: String,
    app_name: String,
    start_time: String, // ISO 8601
    end_time: String,   // ISO 8601
    time_zone: String,
}

#[derive(Debug, Clone)]
enum AppEvent {
    FocusChange,
    Shutdown,
    TrayExit,
    TrayConfig,
}

// --- Globals ---

static EVENT_CHANNEL: OnceLock<mpsc::UnboundedSender<AppEvent>> = OnceLock::new();

// --- Platform Logic ---

unsafe extern "system" fn hook_proc(
    _h_win_event_hook: HWINEVENTHOOK,
    event: u32,
    _hwnd: HWND,
    _id_object: i32,
    _id_child: i32,
    _id_event_thread: u32,
    _dw_ms_event_time: u32,
) {
    if event == EVENT_SYSTEM_FOREGROUND {
        if let Some(tx) = EVENT_CHANNEL.get() {
            let _ = tx.send(AppEvent::FocusChange);
        }
    }
}

fn check_single_instance() {
    unsafe {
        let name_utf16: Vec<u16> = "TimeTrackerSingleInstanceLock\0"
            .encode_utf16()
            .collect();
        let _mutex = CreateMutexW(None, true, PCWSTR(name_utf16.as_ptr()));

        if GetLastError() == ERROR_ALREADY_EXISTS {
            std::process::exit(1);
        }
    }
}

// --- Tracker Application ---

struct TrackerApp {
    config: Config,
    device_id: String,
    time_zone: String,
    client: reqwest::Client,
    current_app: Option<String>,
    start_time: Option<DateTime<Utc>>,
}

impl TrackerApp {
    fn new(config: Config) -> Self {
        let device_id = format!(
            "{}-{}",
            whoami::hostname().expect("Failed to get hostname"),
            whoami::username().expect("Failed to get username")
        );
        let time_zone = iana_time_zone::get_timezone().unwrap_or_else(|_| "UTC".to_string());
        let client = reqwest::Client::new();

        Self {
            config,
            device_id,
            time_zone,
            client,
            current_app: None,
            start_time: None,
        }
    }

    async fn handle_event(&mut self, event: AppEvent) -> bool {
        match event {
            AppEvent::TrayConfig => {
                self.launch_configure();
                return true; // Stop tracker to allow reconfiguration
            }
            AppEvent::Shutdown | AppEvent::TrayExit => {
                println!("Shutting down tracker...");
                self.flush_session(true).await;
                return true; // Exit loop
            }
            AppEvent::FocusChange => {
                self.check_focus().await;
            }
        }
        false
    }

    async fn check_focus(&mut self) {
        if let Ok(window) = get_active_window() {
            if self.current_app.as_ref() != Some(&window.app_name) {
                self.flush_session(false).await;
                
                let now = Utc::now();
                println!("Switched to: {}", window.app_name);
                self.current_app = Some(window.app_name);
                self.start_time = Some(now);
            }
        }
    }

    async fn flush_session(&mut self, is_shutting_down: bool) {
        if let (Some(app_name), Some(start)) = (self.current_app.take(), self.start_time.take()) {
            let now = Utc::now();
            let duration = now.signed_duration_since(start);

            // Log if duration is meaningful
            if duration.num_seconds() > 0 {
                println!("Logged: {} ({}s)", app_name, duration.num_seconds());

                let payload = SessionPayload {
                    device_id: self.device_id.clone(),
                    device_platform: "windows".to_string(),
                    app_name,
                    start_time: start.to_rfc3339(),
                    end_time: now.to_rfc3339(),
                    time_zone: self.time_zone.clone(),
                };

                let server_url = self.config.server_url.clone();
                let api_key = self.config.api_key.clone();
                let client = self.client.clone();

                let req_future = async move {
                    let mut req = client.post(&server_url);
                    if let Some(key) = api_key {
                        req = req.header("Authorization", format!("Bearer {}", key));
                    }
                    
                    match req.json(&payload).send().await {
                        Ok(res) => {
                            if !res.status().is_success() {
                                println!("Server returned error: {}", res.status());
                            }
                        }
                        Err(e) => println!("Network error: {}", e),
                    }
                };

                if is_shutting_down {
                    req_future.await; // Block on shutdown to ensure delivery
                } else {
                    tokio::spawn(req_future);
                }
            }
        }
    }

    fn launch_configure(&self) {
        let exe_path = std::env::current_exe().expect("Failed to get current executable path");
        let exe_dir = exe_path.parent().expect("Failed to get executable directory");
        let configure_exe = exe_dir.join("configure.exe");

        if configure_exe.exists() {
            println!("Launching configure.exe...");
            let _ = std::process::Command::new(configure_exe).spawn();
        }
    }
}

// --- Main Entry ---

#[tokio::main]
async fn main() {
    check_single_instance();

    let exe_path = std::env::current_exe().expect("Failed to get current executable path");
    let exe_dir = exe_path.parent().expect("Failed to get executable directory");
    let config_path = exe_dir.join("config.json");

    // Load Configuration
    let config = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_else(|_| Config::default()),
        Err(_) => {
            println!("Config not found, launching setup...");
            let setup_exe = exe_dir.join("configure.exe");
            if setup_exe.exists() {
                let _ = std::process::Command::new(setup_exe).spawn();
            }
            return;
        }
    };

    println!("Starting Tick Time Tracker...");

    let (tx, mut rx) = mpsc::unbounded_channel();
    EVENT_CHANNEL
        .set(tx.clone())
        .expect("Failed to set event channel");

    // Unified System Tray and Win32 Hook Thread
    let (tx_menu_ids, rx_menu_ids) = std::sync::mpsc::channel();
    let exe_dir_clone = exe_dir.to_path_buf();

    thread::spawn(move || unsafe {
        let tray_menu = Menu::new();

        // Menu Icons
        let settings_icon = create_settings_icon();
        let exit_icon = create_exit_icon();

        // Menu Items
        let title_item = MenuItem::new("Tick Time Tracker", false, None);
        let version_item = MenuItem::new("v0.1.0", false, None);
        let config_item = IconMenuItem::new("Configure...", true, Some(settings_icon), None);
        let exit_item = IconMenuItem::new("Exit", true, Some(exit_icon), None);

        let config_id = config_item.id().clone();
        let exit_id = exit_item.id().clone();
        let _ = tx_menu_ids.send((config_id, exit_id));

        // Assemble Menu
        let _ = tray_menu.append(&title_item);
        let _ = tray_menu.append(&version_item);
        let _ = tray_menu.append(&PredefinedMenuItem::separator());
        let _ = tray_menu.append(&config_item);
        let _ = tray_menu.append(&exit_item);

        // Load Main Icon
        let icon_path = exe_dir_clone.join("icon.ico");
        let icon = if icon_path.exists() {
            load_icon_from_path(icon_path)
        } else {
            create_default_icon()
        };

        let tray_icon = TrayIconBuilder::new()
            .with_menu(Box::new(tray_menu))
            .with_tooltip("Tick Time Tracker")
            .with_icon(icon)
            .build()
            .expect("Failed to create tray icon");

        // Win32 Hook
        let _hook = SetWinEventHook(
            EVENT_SYSTEM_FOREGROUND,
            EVENT_SYSTEM_FOREGROUND,
            None,
            Some(hook_proc),
            0,
            0,
            WINEVENT_OUTOFCONTEXT,
        );

        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).0 > 0 {
            let _ = TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }

        drop(tray_icon);
    });

    let (config_id, exit_id) = rx_menu_ids.recv().expect("Failed to receive menu IDs");

    // Signal Listeners
    let tx_ctrlc = tx.clone();
    ctrlc::set_handler(move || {
        let _ = tx_ctrlc.send(AppEvent::Shutdown);
    })
    .expect("Error setting Ctrl-C handler");

    // Tray Menu Listener
    let menu_rx = MenuEvent::receiver();
    let tx_menu = tx.clone();
    thread::spawn(move || {
        while let Ok(event) = menu_rx.recv() {
            if event.id == exit_id {
                let _ = tx_menu.send(AppEvent::TrayExit);
                break;
            } else if event.id == config_id {
                let _ = tx_menu.send(AppEvent::TrayConfig);
            }
        }
    });

    // Main App Loop
    let mut app = TrackerApp::new(config);
    
    // Initial check
    let _ = tx.send(AppEvent::FocusChange);

    while let Some(event) = rx.recv().await {
        if app.handle_event(event).await {
            break;
        }
    }

    println!("Goodbye!");
}

// --- Icons ---

fn load_icon_from_path(path: PathBuf) -> TrayIcon {
    let image = image::open(&path)
        .expect("Failed to open icon file")
        .into_rgba8();
    let (width, height) = image.dimensions();
    let rgba = image.into_raw();
    TrayIcon::from_rgba(rgba, width, height).expect("Failed to create icon")
}

fn create_default_icon() -> TrayIcon {
    let size = 16u32;
    let mut rgba = Vec::with_capacity((size * size * 4) as usize);
    let center = size as f32 / 2.0;
    let radius = size as f32 / 2.5;

    for y in 0..size {
        for x in 0..size {
            let dx = x as f32 - center;
            let dy = y as f32 - center;
            let distance = (dx * dx + dy * dy).sqrt();

            if distance < radius {
                let factor = distance / radius;
                rgba.push((200.0 * (1.0 - factor) + 139.0 * factor) as u8); // R
                rgba.push((50.0 * (1.0 - factor) + 92.0 * factor) as u8);  // G
                rgba.push((200.0 * (1.0 - factor) + 246.0 * factor) as u8); // B
                rgba.push(255);
            } else {
                rgba.extend_from_slice(&[0, 0, 0, 0]);
            }
        }
    }
    TrayIcon::from_rgba(rgba, size, size).expect("Failed to create fallback icon")
}

fn create_settings_icon() -> MenuIcon {
    let size = 16u32;
    let mut rgba = Vec::with_capacity((size * size * 4) as usize);
    let center = size as f32 / 2.0;
    let radius = size as f32 / 2.5;

    for y in 0..size {
        for x in 0..size {
            let dx = x as f32 - center;
            let dy = y as f32 - center;
            let distance = (dx * dx + dy * dy).sqrt();

            if distance < radius {
                let factor = distance / radius;
                // Blue/Cyan gradient
                rgba.push((30.0 * (1.0 - factor) + 59.0 * factor) as u8);  // R
                rgba.push((100.0 * (1.0 - factor) + 130.0 * factor) as u8); // G
                rgba.push((230.0 * (1.0 - factor) + 246.0 * factor) as u8); // B
                rgba.push(255);
            } else {
                rgba.extend_from_slice(&[0, 0, 0, 0]);
            }
        }
    }
    MenuIcon::from_rgba(rgba, size, size).expect("Failed to create settings icon")
}

fn create_exit_icon() -> MenuIcon {
    let size = 16u32;
    let mut rgba = Vec::with_capacity((size * size * 4) as usize);
    let center = size as f32 / 2.0;
    let radius = size as f32 / 2.5;

    for y in 0..size {
        for x in 0..size {
            let dx = x as f32 - center;
            let dy = y as f32 - center;
            let distance = (dx * dx + dy * dy).sqrt();

            if distance < radius {
                let factor = distance / radius;
                // Red/Orange gradient
                rgba.push((239.0 * (1.0 - factor) + 248.0 * factor) as u8); // R
                rgba.push((68.0 * (1.0 - factor) + 113.0 * factor) as u8);  // G
                rgba.push((68.0 * (1.0 - factor) + 113.0 * factor) as u8);  // B
                rgba.push(255);
            } else {
                rgba.extend_from_slice(&[0, 0, 0, 0]);
            }
        }
    }
    MenuIcon::from_rgba(rgba, size, size).expect("Failed to create exit icon")
}

