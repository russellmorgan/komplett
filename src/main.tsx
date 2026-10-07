import { registerSW } from "virtual:pwa-register";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./tokens.css";
import "./app.css";
import { completeMagicLinkIfPresent } from "./data/auth";
import { applyAppearance } from "./data/theme";

registerSW({ immediate: true });
if (navigator.userAgent.includes("Electron")) document.documentElement.dataset.shell = "electron";
applyAppearance();
// "System" mode flips with the OS without any click in the app.
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyAppearance());

completeMagicLinkIfPresent().finally(() => {
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
