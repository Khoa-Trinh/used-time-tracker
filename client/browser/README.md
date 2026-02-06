# Tick Browser Extension

A cross-browser extension for the Tick time tracking ecosystem. Built with [WXT](https://wxt.dev/) and React, it allows users to track time directly from their browser and manage settings on the fly.

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js

### Development

To start development with live-reloading:

```bash
# Chrome
bun run dev

# Firefox
bun run dev:firefox
```

### Building

To build the extension for production:

```bash
# Chrome
bun run build

# Firefox
bun run build:firefox
```

### Packaging

To create a zip file for distribution:

```bash
# Chrome
bun run zip

# Firefox
bun run zip:firefox
```

## 🛠️ Technology Stack

- **Framework**: [WXT](https://wxt.dev/)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 📁 Project Structure

- `entrypoints/`: Contains the extension entry points (background, popup, content scripts).
- `assets/`: Static assets like icons.
- `public/`: Publicly accessible files.
- `wxt.config.ts`: WXT configuration.

## ⚙️ Configuration

The extension communicates with the Tick server. Ensure your server endpoint is correctly configured in the extension settings popup.
