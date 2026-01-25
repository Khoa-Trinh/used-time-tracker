import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: "Used Time Tracker",
    description: "Track active tab usage and sync data to your private server. Privacy-focused and open-source.",
    permissions: [
      "tabs",
      "storage",
      "webNavigation"
    ],
    host_permissions: [
      "http://localhost:3000/*",
      "https://used-time-tracker.vercel.app/*",
      "https://*.vercel.app/*"
    ],
  }
});
