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
    #[serde(default)]
    theme: String,
}

#[derive(Clone, Copy, PartialEq)]
enum Theme {
    Light,
    Dark,
}

impl Default for Theme {
    fn default() -> Self {
        Theme::Dark
    }
}

impl Theme {
    fn from_str(s: &str) -> Self {
        match s {
            "light" => Theme::Light,
            _ => Theme::Dark,
        }
    }

    fn to_str(&self) -> &'static str {
        match self {
            Theme::Light => "light",
            Theme::Dark => "dark",
        }
    }
}

struct SetupApp {
    config: Config,
    config_path: PathBuf,
    status_message: Option<String>,
    status_type: StatusType,
    successfully_saved_at: Option<Instant>,
    tracker_launched: bool,
    current_theme: Theme,
}

#[derive(Clone, Copy)]
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

        let config: Config = match fs::read_to_string(&config_path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => Config {
                server_url: "http://localhost:3000/api/log-session".to_string(),
                api_key: None,
                theme: "dark".to_string(),
            },
        };

        let current_theme = Theme::from_str(&config.theme);

        // --- Custom Fonts (Segoe UI) ---
        let mut fonts = egui::FontDefinitions::default();
        if let Ok(font_data) = fs::read("C:\\Windows\\Fonts\\segoeui.ttf") {
            fonts
                .font_data
                .insert("segoe_ui".to_owned(), egui::FontData::from_owned(font_data));
            if let Some(family) = fonts.families.get_mut(&egui::FontFamily::Proportional) {
                family.insert(0, "segoe_ui".to_owned());
            }
        }
        cc.egui_ctx.set_fonts(fonts);

        let mut app = Self {
            config,
            config_path,
            status_message: None,
            status_type: StatusType::Info,
            successfully_saved_at: None,
            tracker_launched: false,
            current_theme,
        };
        
        app.apply_theme(&cc.egui_ctx);
        app
    }

    fn apply_theme(&self, ctx: &egui::Context) {
        let visuals = match self.current_theme {
            Theme::Dark => {
                let mut v = egui::Visuals::dark();
                v.window_rounding = egui::Rounding::same(12.0);
                v.widgets.noninteractive.bg_fill = egui::Color32::from_rgb(24, 24, 27); // Zinc 900
                v.widgets.noninteractive.fg_stroke = egui::Stroke::new(1.0, egui::Color32::from_rgb(228, 228, 231)); // Zinc 200
                v.selection.bg_fill = egui::Color32::from_rgb(37, 99, 235); // Blue 600
                v
            }
            Theme::Light => {
                let mut v = egui::Visuals::light();
                v.window_rounding = egui::Rounding::same(12.0);
                v.widgets.noninteractive.bg_fill = egui::Color32::from_rgb(255, 255, 255); // White
                v.widgets.noninteractive.fg_stroke = egui::Stroke::new(1.0, egui::Color32::from_rgb(24, 24, 27)); // Zinc 900
                v.selection.bg_fill = egui::Color32::from_rgb(59, 130, 246); // Blue 500
                v
            }
        };
        ctx.set_visuals(visuals);
    }
    
    fn toggle_theme(&mut self, ctx: &egui::Context) {
        self.current_theme = match self.current_theme {
            Theme::Light => Theme::Dark,
            Theme::Dark => Theme::Light,
        };
        self.config.theme = self.current_theme.to_str().to_string();
        self.apply_theme(ctx);
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
        
        // Ensure theme is synced
        self.config.theme = self.current_theme.to_str().to_string();

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
             // eprintln!("tracker.exe not found!");
        }
    }
}

// Minimal Input Field
fn minimal_input(ui: &mut egui::Ui, value: &mut String, hint: &str, password: bool, theme: Theme) -> bool {
    let mut changed = false;
    let (bg_color, border_color, text_color, placeholder_color) = match theme {
        Theme::Dark => (
            egui::Color32::from_rgb(39, 39, 42), // Zinc 800
            egui::Color32::from_rgb(63, 63, 70), // Zinc 700
            egui::Color32::WHITE,
            egui::Color32::from_gray(120),
        ),
        Theme::Light => (
             egui::Color32::from_rgb(244, 244, 245), // Zinc 100
             egui::Color32::from_rgb(228, 228, 231), // Zinc 200
             egui::Color32::BLACK,
             egui::Color32::from_gray(140),
        ),
    };

    egui::Frame::none()
        .fill(bg_color)
        .rounding(8.0)
        .stroke(egui::Stroke::new(1.0, border_color))
        .inner_margin(12.0)
        .show(ui, |ui| {
            ui.set_width(ui.available_width());
            let response = ui.add(
                egui::TextEdit::singleline(value)
                    .hint_text(egui::RichText::new(hint).color(placeholder_color))
                    .password(password)
                    .frame(false)
                    .desired_width(f32::INFINITY)
                    .text_color(text_color),
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
            let remaining = if elapsed.as_secs() > 3 { // Faster autoclose
                0
            } else {
                3 - elapsed.as_secs()
            };

            if elapsed >= Duration::from_secs(3) {
                if !self.tracker_launched {
                    self.launch_tracker();
                    self.tracker_launched = true;
                }
                ctx.send_viewport_cmd(egui::ViewportCommand::Close);
                return;
            }
            ctx.request_repaint();
            self.status_message = Some(format!("Saved! Launching tracker in {}s...", remaining));
        }
        
        let (bg_fill, text_color, subtext_color) = match self.current_theme {
            Theme::Dark => (
                egui::Color32::from_rgb(9, 9, 11), // Zinc 950
                egui::Color32::WHITE,
                egui::Color32::from_rgb(161, 161, 170), // Zinc 400
            ),
            Theme::Light => (
                egui::Color32::WHITE,
                egui::Color32::BLACK,
                egui::Color32::from_rgb(82, 82, 91), // Zinc 600
            ),
        };

        egui::CentralPanel::default().frame(egui::Frame::none().fill(bg_fill)).show(ctx, |ui| {
            // Padding
            egui::Frame::none().inner_margin(32.0).show(ui, |ui| {
                // Top Bar (Theme Toggle)
                ui.horizontal(|ui| {
                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        let icon = match self.current_theme {
                            Theme::Light => "🌙",
                            Theme::Dark => "☀",
                        };
                         if ui.add(egui::Button::new(icon).frame(false)).clicked() {
                             self.toggle_theme(ctx);
                         }
                    });
                });

                // Header
                ui.vertical_centered(|ui| {
                    ui.heading(
                        egui::RichText::new("Tick Setup")
                            .size(32.0)
                            .strong()
                            .color(text_color),
                    );
                    ui.add_space(8.0);
                    ui.label(
                        egui::RichText::new("Configure your local tracker client.")
                            .size(14.0)
                            .color(subtext_color),
                    );
                });

                ui.add_space(48.0);

                // Form
                ui.label(egui::RichText::new("Server URL").strong().color(text_color));
                ui.add_space(6.0);
                if minimal_input(ui, &mut self.config.server_url, "http://localhost:3000/api/log-session", false, self.current_theme) {
                    self.status_message = None;
                    self.successfully_saved_at = None;
                }
                
                ui.add_space(24.0);
                
                ui.label(egui::RichText::new("API Key (Optional)").strong().color(text_color));
                 ui.add_space(6.0);
                let mut api_key_str = self.config.api_key.clone().unwrap_or_default();
                if minimal_input(ui, &mut api_key_str, "sk_...", true, self.current_theme) {
                    self.config.api_key = Some(api_key_str);
                     self.status_message = None;
                    self.successfully_saved_at = None;
                }
                
                ui.add_space(48.0);

                // Save Button
                let btn_fill = match self.current_theme {
                    Theme::Dark => egui::Color32::WHITE,
                    Theme::Light => egui::Color32::BLACK,
                };
                let btn_text = match self.current_theme {
                    Theme::Dark => egui::Color32::BLACK,
                    Theme::Light => egui::Color32::WHITE,
                };

                let save_btn = ui.add_sized(
                    [ui.available_width(), 48.0],
                    egui::Button::new(
                        egui::RichText::new("Save & Launch")
                            .size(16.0)
                            .strong()
                            .color(btn_text),
                    )
                    .fill(btn_fill)
                    .rounding(12.0),
                );

                if save_btn.clicked() {
                    self.save();
                }

                 // Status Message
                if let Some(msg) = &self.status_message {
                    ui.add_space(20.0);
                    ui.vertical_centered(|ui| {
                        let color = match self.status_type {
                            StatusType::Success => egui::Color32::from_rgb(16, 185, 129), // Emerald 500
                            StatusType::Error => egui::Color32::from_rgb(239, 68, 68),  // Red 500
                            StatusType::Info => subtext_color,
                        };
                        ui.label(egui::RichText::new(msg).color(color));
                    });
                }
            });
        });
    }
}

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: eframe::egui::ViewportBuilder::default()
            .with_inner_size([480.0, 600.0])
            .with_resizable(false)
            .with_title("Tick Setup"),
        ..Default::default()
    };
    eframe::run_native(
        "Tick Setup",
        options,
        Box::new(|cc| Ok(Box::new(SetupApp::new(cc)))),
    )
}
