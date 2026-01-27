use image::{ImageFormat, ImageReader};
use std::path::Path;

fn main() {
    // Only run on Windows
    #[cfg(target_os = "windows")]
    {
        // Convert PNG to ICO if it doesn't exist
        let icon_png = Path::new("assets/icon.png");
        let icon_ico = Path::new("assets/icon.ico");

        if !icon_ico.exists() && icon_png.exists() {
            // Load the PNG image and resize to 16x16 (standard tray icon size)
            let img = ImageReader::open(icon_png)
                .expect("Failed to open icon.png")
                .decode()
                .expect("Failed to decode icon.png");

            // Resize to 16x16 for system tray (prevents blurriness)
            let resized = img.resize_exact(16, 16, image::imageops::FilterType::Lanczos3);

            // Save as ICO format
            resized
                .save_with_format(icon_ico, ImageFormat::Ico)
                .expect("Failed to save icon.ico");
        }

        // Embed the icon in the executable
        if icon_ico.exists() {
            let mut res = winres::WindowsResource::new();
            res.set_icon(icon_ico.to_str().unwrap());

            // Set application metadata
            res.set("ProductName", "Tick");
            res.set("FileDescription", "Tick Time Tracker");
            res.set("CompanyName", "SnK");
            res.set("LegalCopyright", "Copyright (C) 2026");
            res.set("ProductVersion", "0.1.0");
            res.set("FileVersion", "0.1.0");

            res.compile().expect("Failed to compile Windows resources");
        }

        // Copy icon.ico to the same directory as the executable
        if icon_ico.exists() {
            if let Ok(out_dir) = std::env::var("OUT_DIR") {
                 let out_path = std::path::PathBuf::from(out_dir);
                 // Walk up from OUT_DIR to find the target directory (e.g., target/debug)
                 // Layout: target/debug/build/<pkg>/out
                 if let Some(target_dir) = out_path.ancestors().nth(3) {
                     let dest_path = target_dir.join("icon.ico");
                     // Copy if it doesn't exist or is different? For now just copy.
                     let _ = std::fs::copy(icon_ico, &dest_path);
                 }
            }
        }
    }

    println!("cargo:rerun-if-changed=assets/icon.png");
    println!("cargo:rerun-if-changed=assets/icon.ico");
}
