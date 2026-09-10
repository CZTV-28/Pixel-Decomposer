"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const returnView = new URLSearchParams(window.location.search).get("return");
  const destination = returnView === "editor" ? "editor.html?from=settings" : returnView === "gif" ? "gif.html?from=settings" : "index.html?from=settings";
  document.querySelectorAll("[data-settings-return]").forEach((link) => { link.href = destination; });
  const select = document.querySelector("#languageSelect");
  const appearance=PixelAppearance.get();
  for(const [id,key] of [['themeSelect','theme'],['fontSelect','font']]){const field=document.getElementById(id);field.value=appearance[key];field.onchange=()=>PixelAppearance.set({[key]:field.value});}
  const glass=document.getElementById('glassToggle');glass.checked=appearance.glass;glass.onchange=()=>PixelAppearance.set({glass:glass.checked});
  select.value = window.PixelI18n?.language() || "zh-CN";
  select.addEventListener("change", () => window.PixelI18n?.setLanguage(select.value));
  document.addEventListener("pixel-decomposer-language", (event) => { select.value = event.detail; });
  window.setTimeout(() => window.lucide?.createIcons(), 30);
});
