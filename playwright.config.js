import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4174",
    viewport: { width: 1280, height: 900 },
    launchOptions: {
      executablePath: process.env.ROUTELAB_BROWSER || undefined,
    },
  },
  webServer: {
    command: "node server.js",
    url: "http://127.0.0.1:4174",
    env: { PORT: "4174" },
  },
});
