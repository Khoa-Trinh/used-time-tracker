#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use eframe::egui;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::time::{Duration, Instant};

// --- Models & Types ---

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

#[derive(Clone, Copy)]
enum StatusType {
    Info,
    Success,
    Error,
}

// --- Styles & Constants ---

struct AppStyle {
    bg_fill: egui::Color32,
    card_bg: egui::Color32,
    card_stroke: egui::Color32,
    text_primary: egui::Color32,
    text_secondary: egui::Color32,
    accent_color: egui::Color32,
    accent_gradient_start: egui::Color32,
    accent_gradient_end: egui::Color32,
    input_bg: egui::Color32,
    input_border: egui::Color32,
    input_text: egui::Color32,
    input_hint: egui::Color32,
}

impl AppStyle {
    fn from_theme(theme: Theme) -> Self {
        match theme {
            Theme::Dark => Self {
                bg_fill: egui::Color32::from_rgb(8, 8, 10),
                card_bg: egui::Color32::from_rgba_premultiplied(20, 20, 25, 200), // Semi-transparent
                card_stroke: egui::Color32::from_rgba_premultiplied(255, 255, 255, 20),
                text_primary: egui::Color32::from_rgb(255, 255, 255),
                text_secondary: egui::Color32::from_rgb(161, 161, 170),
                accent_color: egui::Color32::from_rgb(99, 102, 241), // Indigo 500
                accent_gradient_start: egui::Color32::from_rgb(99, 102, 241),
                accent_gradient_end: egui::Color32::from_rgb(168, 85, 247), // Purple 500
                input_bg: egui::Color32::from_rgba_premultiplied(30, 30, 35, 180),
                input_border: egui::Color32::from_rgba_premultiplied(255, 255, 255, 15),
                input_text: egui::Color32::from_rgb(228, 228, 231),
                input_hint: egui::Color32::from_rgb(82, 82, 91),
            },
            Theme::Light => Self {
                bg_fill: egui::Color32::from_rgb(245, 245, 250),
                card_bg: egui::Color32::from_rgba_premultiplied(255, 255, 255, 220),
                card_stroke: egui::Color32::from_rgba_premultiplied(0, 0, 0, 15),
                text_primary: egui::Color32::from_rgb(15, 23, 42),
                text_secondary: egui::Color32::from_rgb(71, 85, 105),
                accent_color: egui::Color32::from_rgb(79, 70, 229), // Indigo 600
                accent_gradient_start: egui::Color32::from_rgb(79, 70, 229),
                accent_gradient_end: egui::Color32::from_rgb(147, 51, 234), // Purple 600
                input_bg: egui::Color32::from_rgba_premultiplied(240, 240, 245, 200),
                input_border: egui::Color32::from_rgba_premultiplied(0, 0, 0, 10),
                input_text: egui::Color32::from_rgb(15, 23, 42),
                input_hint: egui::Color32::from_rgb(148, 163, 184),
            },
        }
    }
}

// --- UI Components ---

fn modern_input(ui: &mut egui::Ui, label: &str, value: &mut String, hint: &str, password: bool, style: &AppStyle) -> bool {
    ui.vertical(|ui| {
        ui.label(egui::RichText::new(label).size(13.0).strong().color(style.text_primary));
        ui.add_space(6.0);
        
        let mut changed = false;
        egui::Frame::none()
            .fill(style.input_bg)
            .rounding(10.0)
            .stroke(egui::Stroke::new(1.0, style.input_border))
            .inner_margin(egui::Margin::symmetric(14.0, 12.0))
            .show(ui, |ui| {
                ui.set_width(ui.available_width());
                let response = ui.add(
                    egui::TextEdit::singleline(value)
                        .hint_text(egui::RichText::new(hint).color(style.input_hint))
                        .password(password)
                        .frame(false)
                        .desired_width(f32::INFINITY)
                        .text_color(style.input_text),
                );
                if response.changed() {
                    changed = true;
                }
            });
        ui.add_space(18.0);
        changed
    }).inner
}

fn draw_backdrop(ui: &mut egui::Ui, theme: Theme) {
    let rect = ui.max_rect();
    let painter = ui.painter();
    
    // Base Background
    painter.rect_filled(rect, 0.0, match theme {
        Theme::Dark => egui::Color32::from_rgb(10, 10, 15),
        Theme::Light => egui::Color32::from_rgb(240, 242, 248),
    });

    // Soft Blobs for Glass Effect
    let (c1, c2, c3) = match theme {
        Theme::Dark => (
            egui::Color32::from_rgba_premultiplied(67, 56, 202, 30), // Indigo
            egui::Color32::from_rgba_premultiplied(126, 34, 206, 25), // Purple
            egui::Color32::from_rgba_premultiplied(29, 78, 216, 20), // Blue
        ),
        Theme::Light => (
            egui::Color32::from_rgba_premultiplied(199, 210, 254, 80),
            egui::Color32::from_rgba_premultiplied(233, 213, 255, 70),
            egui::Color32::from_rgba_premultiplied(191, 219, 254, 60),
        ),
    };

    painter.circle_filled(rect.left_top() + egui::vec2(50.0, 50.0), 180.0, c1);
    painter.circle_filled(rect.right_bottom() + egui::vec2(-80.0, -100.0), 220.0, c2);
    painter.circle_filled(rect.center() + egui::vec2(-100.0, 150.0), 150.0, c3);
}

// --- Application Core ---

struct SetupApp {
    config: Config,
    config_path: PathBuf,
    status_message: Option<String>,
    status_type: StatusType,
    successfully_saved_at: Option<Instant>,
    tracker_launched: bool,
    current_theme: Theme,
}

impl SetupApp {
    fn new(cc: &eframe::CreationContext) -> Self {
        let exe_path = std::env::current_exe().expect("Failed to get current executable path");
        let exe_dir = exe_path.parent().expect("Failed to get executable directory");
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

        // Custom Fonts
        let mut fonts = egui::FontDefinitions::default();
        if let Ok(font_data) = fs::read("C:\\Windows\\Fonts\\segoeui.ttf") {
            fonts.font_data.insert("segoe".to_owned(), egui::FontData::from_owned(font_data));
            fonts.families.get_mut(&egui::FontFamily::Proportional).unwrap().insert(0, "segoe".to_owned());
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

        app.apply_visuals(&cc.egui_ctx);
        app
    }

    fn apply_visuals(&self, ctx: &egui::Context) {
        let mut visuals = match self.current_theme {
            Theme::Dark => egui::Visuals::dark(),
            Theme::Light => egui::Visuals::light(),
        };
        visuals.window_rounding = egui::Rounding::same(20.0);
        visuals.widgets.noninteractive.bg_stroke = egui::Stroke::new(1.0, egui::Color32::from_rgba_premultiplied(255, 255, 255, 10));
        ctx.set_visuals(visuals);
    }

    fn toggle_theme(&mut self, ctx: &egui::Context) {
        self.current_theme = match self.current_theme {
            Theme::Light => Theme::Dark,
            Theme::Dark => Theme::Light,
        };
        self.config.theme = self.current_theme.to_str().to_string();
        self.apply_visuals(ctx);
        ctx.request_repaint();
    }

    fn save(&mut self) {
        if self.config.server_url.trim().is_empty() {
            self.status_message = Some("Endpoint cannot be empty".to_string());
            self.status_type = StatusType::Error;
            return;
        }

        self.config.theme = self.current_theme.to_str().to_string();
        let json = serde_json::to_string_pretty(&self.config).expect("Serialization failed");
        
        if let Err(e) = fs::write(&self.config_path, json) {
            self.status_message = Some(format!("Error: {}", e));
            self.status_type = StatusType::Error;
        } else {
            self.status_message = Some("Settings synced! Launching...".to_string());
            self.status_type = StatusType::Success;
            self.successfully_saved_at = Some(Instant::now());
            self.tracker_launched = false;
        }
    }

    fn launch_tracker(&self) {
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                let tracker_exe = exe_dir.join("tracker.exe");
                if tracker_exe.exists() {
                    let _ = Command::new(tracker_exe).spawn();
                }
            }
        }
    }
}

impl eframe::App for SetupApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        if let Some(saved_at) = self.successfully_saved_at {
            if saved_at.elapsed() >= Duration::from_secs(2) {
                if !self.tracker_launched {
                    self.launch_tracker();
                    self.tracker_launched = true;
                }
                ctx.send_viewport_cmd(egui::ViewportCommand::Close);
                return;
            }
            ctx.request_repaint();
        }

        let style = AppStyle::from_theme(self.current_theme);

        egui::CentralPanel::default()
            .frame(egui::Frame::none())
            .show(ctx, |ui| {
                draw_backdrop(ui, self.current_theme);

                egui::Frame::none().inner_margin(28.0).show(ui, |ui| {
                    // --- Header ---
                    ui.horizontal(|ui| {
                        let (rect, _) = ui.allocate_at_least(egui::vec2(32.0, 32.0), egui::Sense::hover());
                        let painter = ui.painter();
                        painter.rect_filled(rect, 8.0, style.accent_color);
                        painter.text(
                            rect.center(),
                            egui::Align2::CENTER_CENTER,
                            "T",
                            egui::FontId::proportional(18.0),
                            egui::Color32::WHITE,
                        );
                        
                        ui.add_space(8.0);
                        ui.label(egui::RichText::new("Tick").size(22.0).strong().color(style.text_primary));

                        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                            let icon = if self.current_theme == Theme::Light { "🌙" } else { "☀" };
                            
                            let (rect, response) = ui.allocate_at_least(egui::vec2(32.0, 32.0), egui::Sense::click());
                            if response.hovered() {
                                ui.painter().circle_filled(
                                    rect.center(),
                                    16.0,
                                    egui::Color32::from_rgba_premultiplied(128, 128, 128, 30),
                                );
                            }
                            
                            ui.painter().text(
                                rect.center(),
                                egui::Align2::CENTER_CENTER,
                                icon,
                                egui::FontId::proportional(20.0),
                                style.text_primary,
                            );

                            if response.clicked() {
                                self.toggle_theme(ctx);
                            }
                        });
                    });

                    ui.add_space(44.0);

                    // --- Hero Text ---
                    ui.vertical_centered(|ui| {
                        ui.heading(egui::RichText::new("Time Tracking").size(34.0).strong().color(style.text_primary));
                        ui.add_space(6.0);
                        ui.label(egui::RichText::new("Configure your workspace environment.").size(16.0).color(style.text_secondary));
                    });

                    ui.add_space(36.0);

                    // --- Glass Card ---
                    egui::Frame::none()
                        .fill(style.card_bg)
                        .stroke(egui::Stroke::new(1.0, style.card_stroke))
                        .rounding(24.0)
                        .inner_margin(32.0)
                        .show(ui, |ui| {
                            if modern_input(ui, "Server Endpoint", &mut self.config.server_url, "https://api.tick.ai", false, &style) {
                                self.status_message = None;
                            }

                            let mut api_key_str = self.config.api_key.clone().unwrap_or_default();
                            if modern_input(ui, "Access token", &mut api_key_str, "••••••••••••••••", true, &style) {
                                self.config.api_key = if api_key_str.is_empty() { None } else { Some(api_key_str) };
                                self.status_message = None;
                            }

                            ui.add_space(12.0);

                            // Gradient-like Button
                            let (rect, response) = ui.allocate_at_least(egui::vec2(ui.available_width(), 48.0), egui::Sense::click());
                            let painter = ui.painter();
                            let bg_color = if response.hovered() { style.accent_gradient_end } else { style.accent_gradient_start };
                            painter.rect_filled(rect, 12.0, bg_color);
                            painter.text(
                                rect.center(),
                                egui::Align2::CENTER_CENTER,
                                "Initialize Client",
                                egui::FontId::proportional(16.0),
                                egui::Color32::WHITE,
                            );

                            if response.clicked() {
                                self.save();
                            }
                        });

                    // --- Status Notification ---
                    if let Some(msg) = &self.status_message {
                        ui.add_space(28.0);
                        let color = match self.status_type {
                            StatusType::Success => egui::Color32::from_rgb(52, 211, 153),
                            StatusType::Error => egui::Color32::from_rgb(248, 113, 113),
                            StatusType::Info => style.text_secondary,
                        };
                        ui.vertical_centered(|ui| {
                            ui.label(egui::RichText::new(format!("• {}", msg)).color(color).size(14.0).strong());
                        });
                    }
                });
            });
    }
}

// --- Main Entry ---

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: eframe::egui::ViewportBuilder::default()
            .with_inner_size([480.0, 640.0])
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
