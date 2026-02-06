# Tick Dashboard

The centralized dashboard for the Tick time tracking ecosystem. A modern, high-performance web application built with Next.js, featuring real-time analytics, user management, and detailed time tracking reports.

## ✨ Features

- **Analytics**: Beautiful charts and data visualizations using Recharts.
- **Real-time Updates**: Powered by TanStack Query for efficient data fetching and caching.
- **Modern UI**: Built with Tailwind CSS 4, Framer Motion, and Base UI for a premium look and feel.
- **Full-stack Architecture**: Next.js App Router combined with Elysia for high-performance API endpoints.
- **Database**: Drizzle ORM with PostgreSQL for type-safe database interactions.

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/)
- PostgreSQL database

### Installation

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up environment variables:
   Create a `.env.local` file based on the project requirements (DB URL, Auth secrets, etc.).

3. Database Migrations:
   ```bash
   bun x drizzle-kit push
   ```

### Development

Run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production

Build the application:

```bash
bun run build
```

Start the production server:

```bash
bun run start
```

## 🛠️ Technology Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router)
- **API**: [Elysia](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/), [TanStack Query](https://tanstack.com/query)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📁 Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components.
- `lib/`: Shared utilities and core logic.
- `drizzle/`: Database schema and migrations.
- `hooks/`: Custom React hooks.
- `store/`: Zustand stores.
