import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig(({ command, mode }) => {
  // A production build without the Firebase config ships a blank page (auth/invalid-api-key).
  if (command === "build" && !loadEnv(mode, process.cwd()).VITE_FIREBASE_API_KEY)
    throw new Error("VITE_FIREBASE_* missing: copy .env.example to .env and fill it in.");
  return {
    // Relative base so dist/ also works over file:// in the Electron shell.
    base: "./",
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Komplett",
          short_name: "Komplett",
          description: "Personal to-do, pomodoro, and accountability app.",
          theme_color: "#dbd7cb",
          background_color: "#dbd7cb",
          display: "standalone",
          start_url: "./",
          icons: [
            { src: "icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "icon-maskable-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "icon-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
          navigateFallback: "index.html",
        },
      }),
    ],
    test: { include: ["src/**/*.test.ts", "electron/**/*.test.mjs"] },
  };
});
