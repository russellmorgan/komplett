const { contextBridge, ipcRenderer } = require("electron");

// The page tells the window which colors to paint its native buttons (see syncTitleBarOverlay in theme.ts).
contextBridge.exposeInMainWorld("komplett", {
  setTitleBarOverlay: (color, symbolColor) =>
    ipcRenderer.send("title-bar-overlay", color, symbolColor),
});
