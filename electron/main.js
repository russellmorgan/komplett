const path = require("node:path");
const { app, BrowserWindow, dialog } = require("electron");
const { createServer } = require("./serve");

// A fixed port keeps the origin stable across launches, so the signed-in session, localStorage
// timer and Firestore's IndexedDB cache survive a restart. The single-instance lock below is
// what stops a second launch fighting over it.
const PORT = 41847;
const ORIGIN = `http://localhost:${PORT}`;

// dist/ sits one level up in dev, and is copied in as a packaged extraResource by
// electron-builder (see package.json's "build.extraResources").
const distDir = app.isPackaged
  ? path.join(process.resourcesPath, "dist")
  : path.join(__dirname, "../dist");

function createWindow() {
  new BrowserWindow({ width: 1200, height: 800 }).loadURL(ORIGIN);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // Re-launching focuses the running app instead of starting a second one.
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    } else {
      createWindow();
    }
  });

  // Windows groups notifications/taskbar by this id; without it, toasts show as "Electron".
  app.setAppUserModelId("app.komplett.desktop");

  app.whenReady().then(() => {
    createServer(distDir)
      .on("error", (err) => {
        dialog.showErrorBox("Komplett can't start", `Port ${PORT} is unavailable: ${err.message}`);
        app.quit();
      })
      .listen(PORT, "localhost", createWindow);
  });

  // macOS convention: closing the window doesn't quit the app (it stays in the dock).
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}
