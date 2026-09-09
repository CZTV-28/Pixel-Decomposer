"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const returnView = new URLSearchParams(window.location.search).get("return");
  const destination = returnView === "editor" ? "editor.html?from=settings" : returnView === "gif" ? "gif.html?from=settings" : "index.html?from=settings";
  document.querySelectorAll("[data-settings-return]").forEach((link) => { link.href = destination; });
  const select = document.querySelector("#languageSelect");
  select.value = window.PixelI18n?.language() || "zh-CN";
  select.addEventListener("change", () => window.PixelI18n?.setLanguage(select.value));
  document.addEventListener("pixel-decomposer-language", (event) => { select.value = event.detail; });
  window.setTimeout(() => window.lucide?.createIcons(), 30);
});
