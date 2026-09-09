const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pixelDecomposerDesktop", {
  onCloseRequest(callback) {
    const listener = () => callback();
    ipcRenderer.on("pixel-decomposer-request-close", listener);
    return () => ipcRenderer.removeListener("pixel-decomposer-request-close", listener);
  },
  close() {
    ipcRenderer.send("pixel-decomposer-close-approved");
  }
});
