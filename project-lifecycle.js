"use strict";

(() => {
  const lifecycle = {};

  function setup({ isDirty, save, toast }) {
    const dialog = document.querySelector("#projectCloseDialog");
    const cancel = dialog?.querySelector("[data-project-close-cancel]");
    const discard = dialog?.querySelector("[data-project-close-discard]");
    const saveAndClose = dialog?.querySelector("[data-project-close-save]");
    let completing = false;
    let navigatingInternally = false;

    const dismiss = () => { if (dialog) dialog.hidden = true; };
    const finish = async () => {
      if (completing) return;
      completing = true;
      dismiss();
      try {
        if (window.pixelDecomposerDesktop?.close) {
          window.pixelDecomposerDesktop.close();
          return;
        }
        const exporter = window.Capacitor?.Plugins?.PixelExporter;
        if (exporter?.exitApp) {
          await exporter.exitApp();
          return;
        }
        window.close();
        toast?.("工程已处理完成，可以关闭此页面。");
      } finally {
        window.setTimeout(() => { completing = false; }, 200);
      }
    };

    const requestClose = () => {
      if (completing) return;
      if (!isDirty()) { finish(); return; }
      if (dialog) { dialog.hidden = false; dialog.querySelector("[data-project-close-save]")?.focus(); }
    };
    const allowNavigation = () => { navigatingInternally = true; };
    lifecycle.allowNavigation = allowNavigation;

    cancel?.addEventListener("click", dismiss);
    discard?.addEventListener("click", finish);
    saveAndClose?.addEventListener("click", async () => {
      saveAndClose.disabled = true;
      const saved = await save();
      saveAndClose.disabled = false;
      if (saved) finish();
    });

    window.addEventListener("pixel-decomposer-request-close", requestClose);
    window.pixelDecomposerDesktop?.onCloseRequest?.(requestClose);
    window.addEventListener("beforeunload", (event) => {
      if (!isDirty() || completing || navigatingInternally) return;
      event.preventDefault();
      event.returnValue = "";
    });
    return { requestClose, allowNavigation };
  }

  lifecycle.setup = setup;
  window.PixelProjectLifecycle = lifecycle;
})();
