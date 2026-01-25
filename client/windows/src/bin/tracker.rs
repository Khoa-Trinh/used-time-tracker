use active_win_pos_rs::get_active_window;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::{Arc, OnceLock};
use std::thread;
use tokio::sync::mpsc;
use windows::core::PCWSTR;
use windows::Win32::Foundation::{GetLastError, ERROR_ALREADY_EXISTS, HWND};
use windows::Win32::System::Threading::CreateMutexW;
use windows::Win32::UI::Accessibility::{
    SetWinEventHook, HWINEVENTHOOK,
};
use windows::Win32::UI::WindowsAndMessaging::{
    DispatchMessageW, GetMessageW, TranslateMessage, MSG, EVENT_SYSTEM_FOREGROUND, WINEVENT_OUTOFCONTEXT,
};

#[derive(Serialize, Deserialize, Debug)]
struct Config {
    server_url: String,
    api_key: Option<String>,
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

// Enum to handle different types of events
enum AppEvent {
    FocusChange,
    Shutdown,
}

static EVENT_CHANNEL: OnceLock<mpsc::UnboundedSender<AppEvent>> = OnceLock::new();

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
        // "Global\" prefix ensures visibility across sessions if needed, 
        // but "Local\" is safer for per-user. Using default (Local) by omitting prefix implies per-session.
        // Let's use specific unique name.
        let name_utf16: Vec<u16> = "TimeTrackerSingleInstanceLock\0".encode_utf16().collect();
        let _mutex = CreateMutexW(None, true, PCWSTR(name_utf16.as_ptr()));
        
        if GetLastError() == ERROR_ALREADY_EXISTS {
            eprintln!("Another instance of Time Tracker is already running. Exiting.");
            std::process::exit(1);
        }
    }
}

#[tokio::main]
async fn main() {
    // 0. Ensure Single Instance
    check_single_instance();

    // 1. Load Configuration
    // Resolve config path relative to the executable location
    let exe_path = std::env::current_exe().expect("Failed to get current executable path");
    let exe_dir = exe_path.parent().expect("Failed to get executable directory");
    let config_path = exe_dir.join("config.json");

    println!("Loading config from: {:?}", config_path);

    let config = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_else(|_| Config::default()),
        Err(_) => {
            println!("Config file not found. Launching Configure Tool...");
            // Try to run configure.exe in the same directory
            let setup_exe = exe_dir.join("configure.exe");
            if setup_exe.exists() {
                let _ = std::process::Command::new(setup_exe).spawn();
            } else {
                eprintln!("configure.exe not found! Please create config.json manually.");
            }
            return;
        }
    };
    
    // Wrap in Arc to share across threads
    let server_url = Arc::new(config.server_url);
    let api_key = Arc::new(config.api_key);

    let device_id = format!(
        "{}-{}",
        whoami::hostname().expect("Failed to get hostname"),
        whoami::username().expect("Failed to get username")
    );
    let client = reqwest::Client::new();
    
    // Get IANA Timezone or default to UTC
    let time_zone = iana_time_zone::get_timezone().unwrap_or_else(|_| "UTC".to_string());

    println!("Starting Time Tracker Client (Event Driven)...");
    println!("Process ID: {}", std::process::id());
    println!("Device ID: {}", device_id);
    println!("Timezone: {}", time_zone);
    println!("Server URL: {}", server_url);

    let (tx, mut rx) = mpsc::unbounded_channel();
    let tx_clone = tx.clone();
    EVENT_CHANNEL.set(tx).expect("Failed to set event channel");

    // Handle Ctrl+C (Graceful Shutdown)
    ctrlc::set_handler(move || {
        println!("\nReceived shutdown signal...");
        let _ = tx_clone.send(AppEvent::Shutdown);
    }).expect("Error setting Ctrl-C handler");

    // Spawn Windows Event Hook Thread
    thread::spawn(|| unsafe {
        let hook = SetWinEventHook(
            EVENT_SYSTEM_FOREGROUND,
            EVENT_SYSTEM_FOREGROUND,
            None,
            Some(hook_proc),
            0,
            0,
            WINEVENT_OUTOFCONTEXT,
        );

        if hook.0.is_null() {
            eprintln!("Failed to set window hook");
            return;
        }

        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).0 > 0 {
            let _ = TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
    });

    let mut current_app: Option<String> = None;
    let mut start_time: Option<DateTime<Utc>> = None;

    // Trigger initial check
    if let Some(tx) = EVENT_CHANNEL.get() {
        let _ = tx.send(AppEvent::FocusChange);
    }

    // Main Event Loop
    while let Some(event) = rx.recv().await {
        
        let should_exit = matches!(event, AppEvent::Shutdown);
        let mut app_changed = false;
        let mut new_app_name = String::new();

        if should_exit {
             println!("Shutting down. Flushing data...");
        } else {
            // Check active window
             match get_active_window() {
                Ok(window) => {
                    new_app_name = window.app_name;
                    if current_app.as_ref() != Some(&new_app_name) {
                        app_changed = true;
                    }
                }
                Err(_) => { /* Ignore */ }
            }
        }

        // Logic to flush data if app changed OR we are shutting down
        if app_changed || should_exit {
            let now = Utc::now();

            // Log previous session
            if let (Some(prev_app), Some(start)) = (current_app.take(), start_time.take()) {
                let duration = now.signed_duration_since(start);
                
                // If shutting down, save even small durations. Otherwise, keep 1s threshold.
                if duration.num_seconds() > 0 {
                    println!("Logged: {} ({}s)", prev_app, duration.num_seconds());
                        
                    let payload = SessionPayload {
                        device_id: device_id.clone(),
                        device_platform: "windows".to_string(),
                        app_name: prev_app,
                        start_time: start.to_rfc3339(),
                        end_time: now.to_rfc3339(),
                        time_zone: time_zone.clone(),
                    };

                    let client_ref = client.clone();
                    let url_ref = server_url.clone();
                    let key_ref = api_key.clone();
                    
                    // We must await this if shutting down!
                    let req_future = async move {
                        let mut req = client_ref.post(url_ref.as_str());
                        if let Some(key) = key_ref.as_ref() {
                            req = req.header("Authorization", format!("Bearer {}", key));
                        }
                        match req.json(&payload).send().await {
                            Ok(res) => if !res.status().is_success() { println!("Error: {}", res.status()); },
                            Err(e) => println!("Network error: {}", e),
                        }
                    };

                    if should_exit {
                        req_future.await; // BLOCKING wait on shutdown
                    } else {
                        tokio::spawn(req_future);
                    }
                }
            }

            if should_exit {
                break; // Exit loop
            }

            // Start tracking new app
            current_app = Some(new_app_name.clone());
            start_time = Some(now);
            println!("Switched to: {}", new_app_name);
        }
    }
    println!("Goodbye!");
}

