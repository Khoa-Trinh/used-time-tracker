# Tick Client (Windows)

A premium, high-performance time tracking client for Windows. Features a modern glassmorphic interface for configuration and a silent background tracker that integrates directly into your system tray.

## ✨ Features

- **Modern UI**: Setup wizard built with `egui` featuring a glassmorphic aesthetic, dynamic background effects, and dark/light mode support.
- **Silent Tracking**: The core tracker runs efficiently in the background, logging active window sessions to your configured server.
- **Tray Integration**: Quick access to controls and status via the Windows System Tray.
- **Auto-Launch**: Automatically opens the tracker after initial configuration.
- **Zero-Config Onboarding**: Intuitive wizard to sync your API keys and server endpoints.

## 🏗️ Project Structure

- `src/bin/configure.rs`: The Setup Wizard / Configuration UI (`configure.exe`).
- `src/bin/tracker.rs`: The Background Tracking Engine (`tracker.exe`).
- `assets/`: High-resolution icons and branding assets.
- `build.rs`: Windows resource compilation (icons, version info).

## 🚀 Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Bun](https://bun.sh/) (for building the installer)

### Running Locally

To launch the configuration wizard:
```powershell
cargo run --bin configure
```

To launch the background tracker:
```powershell
cargo run --bin tracker
```

## 🛠️ Building & Packaging

### 1. Build Executables
Compile the binaries in release mode for maximum performance:
```powershell
cargo build --release
```

### 2. Generate Installer (Inno Setup)
This project uses `innosetup-compiler` managed via Bun. To build the Windows installer:
```powershell
bunx innosetup-compiler setup.iss
```

## ⚙️ Configuration

Settings are stored in `config.json` next to the executable:

| Property | Description |
| :--- | :--- |
| `server_url` | REST endpoint where logs are sent. |
| `api_key` | Optional authentication token for your server. |
| `theme` | UI preference (`dark` or `light`). |

## 🎨 Aesthetic Design
The client uses a custom **Zinc-based design system** with layered translucency and organic blob animations to provide a premium user experience consistent with modern Windows 11 aesthetics.
