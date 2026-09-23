const { app, BrowserWindow } = require("electron");
const path = require("node:path");

// The web app's dist/ build lives one level up in dev, and as a packaged extraResource
// once electron-builder bundles it (see package.json's "build.extraResources").
function indexPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "dist/index.html")
    : path.join(__dirname, "../dist/index.html");
}

function createWindow() {
  const win = new BrowserWindow({ width: 1200, height: 800 });
  win.loadFile(indexPath());
}

// Windows groups notifications/taskbar by this id; without it, toasts show as "Electron".
app.setAppUserModelId("app.komplett.desktop");

app.whenReady().then(createWindow);

// macOS convention: closing the window doesn't quit the app (it stays in the dock).
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
