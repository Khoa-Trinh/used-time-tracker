use active_win_pos_rs::get_active_window;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::{Arc, OnceLock};
use std::thread;
use tokio::sync::mpsc;
use windows::Win32::Foundation::HWND;
use windows::Win32::UI::Accessibility::{
    SetWinEventHook, HWINEVENTHOOK,
};
use windows::Win32::UI::WindowsAndMessaging::{
    DispatchMessageW, GetMessageW, TranslateMessage, MSG, EVENT_SYSTEM_FOREGROUND, WINEVENT_OUTOFCONTEXT,
};

#[derive(Serialize, Deserialize, Debug)]
struct Config {
    server_url: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server_url: "http://127.0.0.1:3000/api/log-session".to_string(),
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

static EVENT_CHANNEL: OnceLock<mpsc::UnboundedSender<()>> = OnceLock::new();

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
            let _ = tx.send(());
        }
    }
}

#[tokio::main]
async fn main() {
    // 1. Load Configuration
    let config_path = "config.json";
    let config = match fs::read_to_string(config_path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_else(|_| Config::default()),
        Err(_) => {
            let default_config = Config::default();
            let json = serde_json::to_string_pretty(&default_config).unwrap();
            let _ = fs::write(config_path, json);
            default_config
        }
    };
    
    // Wrap in Arc to share across threads/tasks if needed (though cloning String is cheap enough here)
    let server_url = Arc::new(config.server_url);

    let device_id = format!(
        "{}-{}",
        whoami::hostname().expect("Failed to get hostname"),
        whoami::username().expect("Failed to get username")
    );
    let client = reqwest::Client::new();
    
    // Get IANA Timezone or default to UTC
    let time_zone = iana_time_zone::get_timezone().unwrap_or_else(|_| "UTC".to_string());

    println!("Starting Time Tracker Client (Event Driven)...");
    println!("Device ID: {}", device_id);
    println!("Timezone: {}", time_zone);
    println!("Server URL: {}", server_url);

    let (tx, mut rx) = mpsc::unbounded_channel();
    EVENT_CHANNEL.set(tx).expect("Failed to set event channel");

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
        // GetMessage returns 0 on WM_QUIT, -1 on error, >0 on message
        while GetMessageW(&mut msg, None, 0, 0).0 > 0 {
            let _ = TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
    });

    let mut current_app: Option<String> = None;
    let mut start_time: Option<DateTime<Utc>> = None;

    // Trigger initial check
    if let Some(tx) = EVENT_CHANNEL.get() {
        let _ = tx.send(());
    }

    while rx.recv().await.is_some() {
        match get_active_window() {
            Ok(window) => {
                let app_name = window.app_name;

                 // Check if app changed
                 if current_app.as_ref() != Some(&app_name) {
                    let now = Utc::now();

                    // If we had a previous app, log it
                    if let (Some(prev_app), Some(start)) = (current_app.take(), start_time.take()) {
                        let duration = now.signed_duration_since(start);
                        if duration.num_seconds() > 1 {
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
                            
                            tokio::spawn(async move {
                                match client_ref.post(url_ref.as_str())
                                    .json(&payload)
                                    .send()
                                    .await 
                                {
                                    Ok(res) => {
                                        if !res.status().is_success() {
                                            println!("Failed to log session: {}", res.status());
                                            if let Ok(text) = res.text().await {
                                                 println!("Error: {}", text);
                                            }
                                        }
                                    },
                                    Err(e) => println!("Network error: {}", e),
                                }
                            });
                        }
                    }

                    // Start tracking new app
                    current_app = Some(app_name.clone());
                    start_time = Some(now);
                    println!("Switched to: {}", app_name);
                }
            }
            Err(_) => {
                // Ignore error (e.g. locked screen)
            }
        }
    }
}
