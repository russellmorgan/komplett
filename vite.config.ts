import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig(({ command, mode }) => {
  // A production build without the Firebase config ships a blank page (auth/invalid-api-key).
  if (command === "build" && !loadEnv(mode, process.cwd()).VITE_FIREBASE_API_KEY)
    throw new Error("VITE_FIREBASE_* missing: copy .env.example to .env and fill it in.");
  return {
    // Absolute base: with "./" a reload on /list/:id asks for /list/assets/*, which the SPA
    // rewrite answers with index.html. Electron serves dist/ over http at /, so it's fine too.
    base: "/",
    build: {
      // One bundle was ~950 kB (Firebase alone is most of it), which tripped Vite's 500 kB chunk
      // warning. Manual chunks by library: the app's own code then redeploys without making users
      // re-download the rarely-changing vendors, and no single chunk crosses the warning limit.
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              // Firestore is the heavyweight; keep it out of the rest of Firebase. First match
              // wins, so this more specific group comes before the catch-all Firebase one.
              // maxSize splits its prebundled modules into chunks that each stay under Vite's
              // 500 kB warning limit.
              {
                name: "firestore",
                test: /node_modules[\\/](@firebase[\\/]firestore|firebase[\\/]firestore)[\\/]/,
                maxSize: 480 * 1024,
              },
              { name: "firebase", test: /node_modules[\\/](firebase|@firebase)[\\/]/ },
              { name: "vendor", test: /node_modules/ },
            ],
          },
        },
      },
    },
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
          start_url: "/",
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
          globPatterns: ["**/*.{js,css,html,svg,png,ico,m4a}"],
          navigateFallback: "index.html",
        },
      }),
    ],
    test: { include: ["src/**/*.test.ts", "electron/**/*.test.mjs"] },
  };
});
