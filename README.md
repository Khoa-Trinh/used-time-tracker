# Used Time Tracker

A comprehensive, privacy-focused time tracking ecosystem designed to give you ownership of your data. It tracks your activity across your Windows desktop and browser, providing detailed insights via a modern dashboard.

## 🏗 Project Structure

- **`server`**: High-performance backend built with [Bun](https://bun.sh) and [ElysiaJS](https://elysiajs.com). Handles data storage and synchronization.
- **`client/windows`**: Native Windows agent written in **Rust**. Efficiently tracks active window titles and process names with minimal resource usage.
- **`client/dashboard`**: Modern web dashboard built with **Next.js**, **Tailwind CSS**, and **Shadcn/UI**. Visualizes your daily activity, top apps, and chronotypes.
- **`client/browser`**: Cross-browser extension built with **WXT**. Tracks detailed usage within the browser (specific URLs and titles) for granular web insights.

---

## 🚀 Getting Started

### 1. Server (Backend)

The server acts as the central hub for your data.

```bash
cd server
bun install
bun run src/index.ts
```

The server runs on `http://localhost:3000` by default.

### 2. Dashboard (Frontend)

The interface to view your time tracking stats.

```bash
cd client/dashboard
bun install
bun run dev
```

Open `http://localhost:3001` (or the port shown in your terminal).

### 3. Windows Client

The desktop agent that runs in the background.

**Prerequisites**: [Rust & Cargo](https://rustup.rs/)

```bash
cd client/windows

# 1. Configure the client (Server URL, Theme)
cargo run --bin configure

# 2. Run the tracker
cargo run --bin tracker
```

*Note: In production, `configure.exe` will launch `tracker.exe` automatically.*

### 4. Browser Extension

Detailed web usage tracking.

```bash
cd client/browser
bun install
bun run dev
```

This will load the extension in a temporary Chrome/Firefox instance. To build for production installation:

```bash
bun run build
```

Then load the `dist` folder as an "Unpacked Extension" in your browser's developer mode.

---

## 🔒 Privacy & Auth

- **Local Mode**: By default, the system can run entirely locally without authentication.
- **Hosted Mode**: Can be configured to require API keys or Authentication via Better-Auth (GitHub/Email) if you deploy the server publicly.

## 🛠 Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript, Rust
- **Frameworks**: Next.js, ElysiaJS, WXT, Egui (Rust)
- **Database**: Drizzle ORM (SQLite/PostgreSQL)
- **Styling**: Tailwind CSS
