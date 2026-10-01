import type { CapacitorConfig } from "@capacitor/cli";

// Android serves dist/ from https://localhost, which Firebase Auth trusts by default.
const config: CapacitorConfig = {
  appId: "app.komplett.mobile",
  appName: "Komplett",
  webDir: "dist",
};

export default config;
