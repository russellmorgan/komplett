import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./tokens.css";
import "./app.css";
import { completeMagicLinkIfPresent } from "./data/auth";

completeMagicLinkIfPresent().finally(() => {
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
