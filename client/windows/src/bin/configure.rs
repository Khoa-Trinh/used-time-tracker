#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use eframe::egui;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::time::{Duration, Instant};

#[derive(Serialize, Deserialize, Default, Clone)]
struct Config {
    server_url: String,
    api_key: Option<String>,
}

struct SetupApp {
    config: Config,
    config_path: PathBuf,
    status_message: Option<String>,
    status_type: StatusType,
    successfully_saved_at: Option<Instant>,
    tracker_launched: bool,
}

enum StatusType {
    Info,
    Success,
    Error,
}

impl SetupApp {
    fn new(cc: &eframe::CreationContext) -> Self {
        let exe_path = std::env::current_exe().expect("Failed to get current executable path");
        let exe_dir = exe_path
            .parent()
            .expect("Failed to get executable directory");
        let config_path = exe_dir.join("config.json");

        let config = match fs::read_to_string(&config_path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => Config {
                server_url: "http://localhost:3000/api/log-session".to_string(),
                api_key: None,
            },
        };

        // --- Custom Fonts (Segoe UI) ---
        let mut fonts = egui::FontDefinitions::default();

        // Attempt to load Segoe UI from system
        if let Ok(font_data) = fs::read("C:\\Windows\\Fonts\\segoeui.ttf") {
            fonts
                .font_data
                .insert("segoe_ui".to_owned(), egui::FontData::from_owned(font_data));

            // Put Segoe UI first for Proportional
            if let Some(family) = fonts.families.get_mut(&egui::FontFamily::Proportional) {
                family.insert(0, "segoe_ui".to_owned());
            }
        }

        cc.egui_ctx.set_fonts(fonts);

        // --- Custom Visuals ---
        let mut visuals = egui::Visuals::dark();
        visuals.window_rounding = egui::Rounding::same(12.0);
        visuals.widgets.noninteractive.bg_fill = egui::Color32::from_rgb(24, 24, 27); // Zinc 900

        // Colors
        let blue_600 = egui::Color32::from_rgb(37, 99, 235);

        visuals.selection.bg_fill = blue_600;

        cc.egui_ctx.set_visuals(visuals);

        // Styles
        let mut style = (*cc.egui_ctx.style()).clone();
        style.text_styles = [
            (
                egui::TextStyle::Heading,
                egui::FontId::new(24.0, egui::FontFamily::Proportional),
            ),
            (
                egui::TextStyle::Body,
                egui::FontId::new(14.0, egui::FontFamily::Proportional),
            ),
            (
                egui::TextStyle::Button,
                egui::FontId::new(14.0, egui::FontFamily::Proportional),
            ),
            (
                egui::TextStyle::Small,
                egui::FontId::new(12.0, egui::FontFamily::Proportional),
            ),
        ]
        .into();
        cc.egui_ctx.set_style(style);

        Self {
            config,
            config_path,
            status_message: None,
            status_type: StatusType::Info,
            successfully_saved_at: None,
            tracker_launched: false,
        }
    }

    fn save(&mut self) {
        if self.config.server_url.trim().is_empty() {
            self.status_message = Some("Please enter a Server URL.".to_string());
            self.status_type = StatusType::Error;
            return;
        }

        if let Some(key) = &self.config.api_key {
            if key.trim().is_empty() {
                self.config.api_key = None;
            }
        }

        let json = serde_json::to_string_pretty(&self.config).expect("Failed to serialize config");
        if let Err(e) = fs::write(&self.config_path, json) {
            self.status_message = Some(format!("Error saving: {}", e));
            self.status_type = StatusType::Error;
        } else {
            self.status_message = Some("Settings saved successfully.".to_string());
            self.status_type = StatusType::Success;
            self.successfully_saved_at = Some(Instant::now());
            self.tracker_launched = false; // Reset on new save
        }
    }

    fn launch_tracker(&self) {
        let exe_path = std::env::current_exe().expect("Failed to get current executable path");
        let exe_dir = exe_path
            .parent()
            .expect("Failed to get executable directory");
        let tracker_exe = exe_dir.join("tracker.exe");

        if tracker_exe.exists() {
            let _ = Command::new(tracker_exe).spawn();
        } else {
            eprintln!("tracker.exe not found!");
        }
    }
}

// Free function to avoid borrow checker issues with `self`
fn styled_input(ui: &mut egui::Ui, value: &mut String, hint: &str, password: bool) -> bool {
    let mut changed = false;

    egui::Frame::none()
        .fill(egui::Color32::from_rgb(39, 39, 42)) // Zinc 800
        .rounding(8.0)
        .stroke(egui::Stroke::new(1.0, egui::Color32::from_rgb(82, 82, 91))) // Zinc 600
        .inner_margin(12.0) // This defines the "Padding" inside the box
        .show(ui, |ui| {
            ui.set_width(ui.available_width()); // Expand width
            let response = ui.add(
                egui::TextEdit::singleline(value)
                    .hint_text(hint)
                    .password(password)
                    .frame(false) // Disable default frame to use our custom one
                    .desired_width(f32::INFINITY)
                    .text_color(egui::Color32::WHITE),
            );
            if response.changed() {
                changed = true;
            }
        });

    changed
}

impl eframe::App for SetupApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Handle Auto-Close / Countdown
        if let Some(saved_at) = self.successfully_saved_at {
            let elapsed = saved_at.elapsed();
            let remaining = if elapsed.as_secs() > 5 {
                0
            } else {
                5 - elapsed.as_secs()
            };

            if elapsed >= Duration::from_secs(5) {
                if !self.tracker_launched {
                    self.launch_tracker();
                    self.tracker_launched = true;
                }
                ctx.send_viewport_cmd(egui::ViewportCommand::Close);
                return;
            }

            // Request repaint to update countdown
            ctx.request_repaint();

            self.status_message = Some(format!("Saved! Launching tracker in {}s...", remaining));
        }

        egui::CentralPanel::default().show(ctx, |ui| {
            // Main Container with padding
            egui::Frame::none().inner_margin(32.0).show(ui, |ui| {
                // Header
                ui.vertical_centered(|ui| {
                    ui.heading(
                        egui::RichText::new("⚙ Time Tracker Setup")
                            .strong()
                            .color(egui::Color32::WHITE),
                    );
                    ui.add_space(8.0);
                    ui.label(
                        egui::RichText::new("Configure your local tracker client.")
                            .color(egui::Color32::from_rgb(161, 161, 170)),
                    );
                });

                ui.add_space(32.0);

                // Form Container
                // Clone style to avoid immutable borrow of `ui` during mutable block
                let style = ui.style().clone();
                egui::Frame::group(&style)
                    .fill(egui::Color32::from_rgb(24, 24, 27)) // Match bg (or slightly different)
                    .stroke(egui::Stroke::NONE)
                    .inner_margin(0.0) // Let elements handle their spacing
                    .show(ui, |ui| {
                        // SERVER URL
                        ui.label(
                            egui::RichText::new("🔗 Server URL")
                                .strong()
                                .color(egui::Color32::from_rgb(228, 228, 231)),
                        );
                        ui.add_space(8.0);

                        if styled_input(
                            ui,
                            &mut self.config.server_url,
                            "http://localhost:3000/api/log-session",
                            false,
                        ) {
                            self.status_message = None;
                            self.successfully_saved_at = None; // Reset timer on change
                        }

                        ui.add_space(4.0);
                        ui.label(
                            egui::RichText::new("The API endpoint to send tracking data to.")
                                .size(12.0)
                                .color(egui::Color32::from_rgb(113, 113, 122)),
                        ); // Zinc 500

                        ui.add_space(24.0);

                        // API KEY
                        ui.label(
                            egui::RichText::new("🔑 API Key")
                                .strong()
                                .color(egui::Color32::from_rgb(228, 228, 231)),
                        );
                        ui.add_space(8.0);

                        let mut api_key_str = self.config.api_key.clone().unwrap_or_default();
                        if styled_input(
                            ui,
                            &mut api_key_str,
                            "sk_... (Leave empty for Local Mode)",
                            true,
                        ) {
                            self.config.api_key = Some(api_key_str);
                            self.status_message = None;
                            self.successfully_saved_at = None; // Reset timer on change
                        }

                        ui.add_space(4.0);
                        ui.label(
                            egui::RichText::new("Only required if your server is in Hosted Mode.")
                                .size(12.0)
                                .color(egui::Color32::from_rgb(113, 113, 122)),
                        );
                    });

                ui.add_space(32.0);

                // Save Button
                let save_btn = ui.add_sized(
                    [ui.available_width(), 48.0],
                    egui::Button::new(
                        egui::RichText::new("💾 Save Configuration")
                            .size(16.0)
                            .strong(),
                    )
                    .fill(egui::Color32::from_rgb(37, 99, 235)) // Blue 600
                    .rounding(8.0),
                );

                if save_btn.clicked() {
                    self.save();
                }

                // Status Message
                if let Some(msg) = &self.status_message {
                    ui.add_space(20.0);
                    ui.vertical_centered(|ui| {
                        let color = if self.successfully_saved_at.is_some() {
                            egui::Color32::from_rgb(74, 222, 128) // Green
                        } else {
                            match self.status_type {
                                StatusType::Success => egui::Color32::from_rgb(74, 222, 128), // Green
                                StatusType::Error => egui::Color32::from_rgb(248, 113, 113),  // Red
                                StatusType::Info => egui::Color32::LIGHT_BLUE,
                            }
                        };
                        ui.label(egui::RichText::new(msg).color(color).strong());
                    });
                }
            });
        });
    }
}

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: eframe::egui::ViewportBuilder::default()
            .with_inner_size([540.0, 620.0])
            .with_resizable(false)
            .with_title("Time Tracker Setup"),
        ..Default::default()
    };
    eframe::run_native(
        "Time Tracker Setup",
        options,
        Box::new(|cc| Ok(Box::new(SetupApp::new(cc)))),
    )
}
