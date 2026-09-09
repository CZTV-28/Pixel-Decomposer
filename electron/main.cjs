const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 650,
    backgroundColor: "#151918",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.__allowClose = false;
  window.on("close", (event) => {
    if (window.__allowClose || window.webContents.isLoadingMainFrame()) return;
    event.preventDefault();
    window.webContents.send("pixel-decomposer-request-close");
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  window.loadFile(path.join(__dirname, "..", "www", "index.html"));
}

ipcMain.on("pixel-decomposer-close-approved", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;
  window.__allowClose = true;
  window.close();
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
