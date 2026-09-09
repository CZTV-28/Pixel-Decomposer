"use strict";

const $ = (selector) => document.querySelector(selector);
const paintCanvas = $("#paintCanvas");
const paintContext = paintCanvas.getContext("2d", { willReadFrequently: true });
const previewCanvas = $("#paintPreview");
const previewContext = previewCanvas.getContext("2d");
const defaults = ["#2dd5c3", "#b4db5d", "#f0a25a", "#e77d76", "#e7f1eb", "#1d2924"];
const MAX_PALETTE_COLORS = 48;
const PALETTE_MEMORY_KEY = "pixel-decomposer-palette-v1";
const state = { projectName: "未命名像素工程", source: { name: "", data: "" }, regions: [], frames: [], palette: [...defaults], paletteSelected: 0, selected: 0, selectedFrames: new Set(), multiSelecting: false, color: "#2dd5c3", brush: 1, tool: "pencil", zoom: 8, zoomTarget: 8, zoomFrame: 0, drawing: false, lastPoint: null, touchPoints: new Map(), gesture: null, panMode: false, panning: null, frameActionHistory: [], frameActionFuture: [], dirty: false, sourceEditFrameId: null, sourceEditOriginalSize: null };

async function init() {
  bindEvents();
  if (new URLSearchParams(window.location.search).has("from") && await loadDraft()) refreshUI();
  else { state.palette = mergePaletteColors(readPaletteMemory(), defaults); createBlankFrame(false); }
  savePaletteMemory();
  refreshUI();
  PixelProjectLifecycle?.setup({ isDirty: () => state.dirty, save: saveProject, toast });
  window.setTimeout(() => window.lucide?.createIcons(), 30);
}

function bindEvents() {
  $("#backToSplitButton").addEventListener("click", returnToSplit);
  $(".brand").addEventListener("click", (event) => { event.preventDefault(); void returnToSplit(); });
  $("#openEditorProject").addEventListener("click", () => $("#editorProjectInput").click());
  $("#saveEditorProject").addEventListener("click", saveProject);
  $("#openSettingsButton").addEventListener("click", () => { void goToSettings(); });
  $("#editorProjectInput").addEventListener("change", (event) => { const [file] = event.target.files; if (file) openProject(file); event.target.value = ""; });
  $("#goGifFromEditor").addEventListener("click", goToGif);
  $("#goGifSideEditor").addEventListener("click", goToGif);
  $("#paintColor").addEventListener("input", (event) => setCurrentColor(event.target.value));
  $("#mobilePaintColor").addEventListener("input", (event) => setCurrentColor(event.target.value));
  $("#paintHex").addEventListener("change", updateColorFromHex);
  $("#paintHex").addEventListener("keydown", (event) => { if (event.key === "Enter") event.currentTarget.blur(); });
  $("#mobilePaintHex").addEventListener("change", updateColorFromHex);
  $("#mobilePaintHex").addEventListener("keydown", (event) => { if (event.key === "Enter") event.currentTarget.blur(); });
  $("#brushSize").addEventListener("input", (event) => { state.brush = Number(event.target.value); $("#brushReadout").value = `${state.brush} px`; });
  document.querySelectorAll(".paint-tool, .mobile-paint-tool").forEach((button) => button.addEventListener("click", () => setTool(button.dataset.tool)));
  $("#addPaletteColor").addEventListener("click", addPaletteColor);
  $("#removePaletteColor").addEventListener("click", removePaletteColor);
  $("#resetPaletteColor").addEventListener("click", resetPalette);
  $("#addMobilePaletteColor").addEventListener("click", addPaletteColor);
  $("#removeMobilePaletteColor").addEventListener("click", removePaletteColor);
  $("#resetMobilePaletteColor").addEventListener("click", resetPalette);
  $("#importPaletteColor").addEventListener("click", () => $("#paletteInput").click());
  $("#exportPaletteColor").addEventListener("click", exportPalette);
  $("#mobileImportPaletteColor").addEventListener("click", () => $("#paletteInput").click());
  $("#mobileExportPaletteColor").addEventListener("click", exportPalette);
  $("#paletteInput").addEventListener("change", (event) => { const [file] = event.target.files; if (file) importPalette(file); event.target.value = ""; });
  $("#mobilePaletteToggle").addEventListener("click", toggleMobilePalette);
  $("#undoPaint").addEventListener("click", undo);
  $("#mobilePaintUndo").addEventListener("click", undo);
  $("#redoPaint").addEventListener("click", redo);
  $("#mobilePaintRedo").addEventListener("click", redo);
  $("#paintZoomIn").addEventListener("click", () => setZoom(state.zoomTarget + .25));
  $("#paintZoomOut").addEventListener("click", () => setZoom(state.zoomTarget - .25));
  $("#paintZoomReset").addEventListener("change", updatePaintZoomFromField);
  $("#paintZoomReset").addEventListener("keydown", (event) => { if (event.key === "Enter") event.currentTarget.blur(); });
  $("#paintPanButton").addEventListener("click", () => setPaintPanMode(!state.panMode));
  $("#mobilePaintPan").addEventListener("click", () => setPaintPanMode(!state.panMode));
  $("#newPaintFrame").addEventListener("click", createBlankFrame);
  $("#duplicatePaintFrame").addEventListener("click", duplicateFrame);
  $("#toggleFrameSelection").addEventListener("click", toggleFrameSelection);
  $("#deletePaintFrame").addEventListener("click", deleteFrame);
  $("#undoFrameAction").addEventListener("click", undoFrameAction);
  $("#redoFrameAction").addEventListener("click", redoFrameAction);
  $("#paintFrameName").addEventListener("input", () => { const frame = currentFrame(); if (frame) { frame.name = $("#paintFrameName").value.trim() || "untitled_frame"; markDirty(); renderFrameStrip(); } });
  $("#editorProjectName").addEventListener("input", markDirty);
  $("#resizePaintFrame").addEventListener("click", resizeFrame);
  $("#exportEditedPng").addEventListener("click", exportPng);
  $("#exportEditedPngMobile").addEventListener("click", exportPng);
  $("#mobilePaintExport").addEventListener("click", exportPng);
  const stage = $("#paintStage");
  stage.addEventListener("pointerdown", beginPaint);
  stage.addEventListener("pointermove", paintMove);
  stage.addEventListener("pointermove", showPointer);
  stage.addEventListener("pointerup", endPaint);
  stage.addEventListener("pointercancel", endPaint);
  stage.addEventListener("pointerleave", (event) => { if (state.drawing) endPaint(event); });
  stage.addEventListener("wheel", zoomPaintWithWheel, { passive: false });
  document.addEventListener("keydown", (event) => { if (event.target.matches("input")) return; if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); } if (event.key.toLowerCase() === "b") setTool("pencil"); if (event.key.toLowerCase() === "e") setTool("eraser"); if (event.key.toLowerCase() === "g") setTool("fill"); if (event.key.toLowerCase() === "i") setTool("eyedropper"); });
}

async function loadDraft() {
  try { const project = await takeWorkspaceDraft("pixel-decomposer-editor-draft"); if (!project) return false; applyProject(project); return true; } catch { return false; }
}

function applyProject(project) {
  state.projectName = project.name || "未命名像素工程";
  state.source = project.source || { name: "", data: "" };
  state.sourceEditFrameId = project.editorMode === "source" ? project.sourceEditFrameId || project.frames?.[0]?.id || null : null;
  state.sourceEditOriginalSize = project.editorMode === "source" ? project.sourceEditOriginalSize || null : null;
  state.regions = Array.isArray(project.regions) ? project.regions : [];
  state.frames = Array.isArray(project.frames) ? project.frames.map((frame, index) => ({ id: frame.id || `${Date.now()}-${index}`, name: frame.name || `frame_${index + 1}`, data: frame.data, width: frame.width, height: frame.height, history: [], future: [] })) : [];
  state.palette = mergePaletteColors(project.palette, readPaletteMemory(), defaults);
  state.paletteSelected = 0;
  state.color = state.palette[0];
  state.selected = state.frames.length ? 0 : -1;
  state.selectedFrames = state.selected >= 0 ? new Set([state.selected]) : new Set();
  state.multiSelecting = false;
  state.frameActionHistory = [];
  state.frameActionFuture = [];
  state.dirty = Boolean(project._transientDirty);
  $("#editorProjectName").value = state.projectName;
  savePaletteMemory();
  if (!state.frames.length) createBlankFrame();
}

function openProject(file) {
  const reader = new FileReader();
  reader.onload = () => { try { const project = JSON.parse(reader.result); if (project.format !== "PixelDecomposer") throw new Error("invalid"); applyProject(project); refreshUI(); toast(`已打开工程，共 ${state.frames.length} 帧。`); } catch { toast("这不是可读取的 Pixel Decomposer 工程文件。", "error"); } };
  reader.readAsText(file);
}

function createBlankFrame(recordAction = true) {
  if (recordAction) pushFrameActionHistory();
  const current = currentFrame();
  const width = current?.width || 64, height = current?.height || 64;
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const frame = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: `frame_${String(state.frames.length + 1).padStart(2, "0")}`, data: canvas.toDataURL("image/png"), width, height, history: [], future: [] };
  const insertion = Math.min(state.frames.length, Math.max(0, state.selected + 1));
  state.frames.splice(insertion, 0, frame);
  state.selected = insertion;
  state.selectedFrames = new Set([state.selected]);
  state.multiSelecting = false;
  refreshUI();
  if (recordAction) markDirty();
}

function currentFrame() { return state.frames[state.selected]; }
function selectFrame(index, event = {}) {
  const multi = state.multiSelecting || event.ctrlKey || event.metaKey;
  if (event.shiftKey && state.selected >= 0) {
    const start = Math.min(state.selected, index), end = Math.max(state.selected, index);
    state.selectedFrames = new Set(Array.from({ length: end - start + 1 }, (_, offset) => start + offset));
    state.multiSelecting = true;
  } else if (multi) {
    const next = new Set(state.selectedFrames);
    if (next.has(index) && next.size > 1) next.delete(index); else next.add(index);
    state.selectedFrames = next;
  } else {
    state.selectedFrames = new Set([index]);
  }
  state.selected = state.selectedFrames.has(index) ? index : [...state.selectedFrames][0];
  refreshUI();
}
function toggleFrameSelection() {
  state.multiSelecting = !state.multiSelecting;
  if (!state.multiSelecting && state.selected >= 0) state.selectedFrames = new Set([state.selected]);
  refreshUI();
}

function renderCurrentFrame() {
  const frame = currentFrame();
  if (!frame) return;
  const image = new Image();
  image.onload = () => {
    paintCanvas.width = frame.width; paintCanvas.height = frame.height;
    paintContext.imageSmoothingEnabled = false;
    paintContext.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
    paintContext.drawImage(image, 0, 0);
    applyZoom(); renderPreview();
  };
  image.src = frame.data;
}

function refreshUI() {
  const sourceMode = Boolean(state.sourceEditFrameId);
  $("#editorProjectName").value = state.projectName;
  $("#backToSplitButton span").textContent = sourceMode ? "转到拆分" : "贴图拆分";
  $("#exportEditedPng b").textContent = sourceMode ? "整张透明 PNG" : "透明 PNG";
  $("#exportEditedPng small").textContent = sourceMode ? "不拆分，导出当前透明画面" : "导出当前编辑帧";
  renderCurrentFrame();
  renderFrameStrip();
  renderPalette();
  renderInspector();
  syncFrameActionControls();
  $("#toggleFrameSelection").classList.toggle("active", state.multiSelecting);
  $("#toggleFrameSelection").setAttribute("aria-pressed", String(state.multiSelecting));
}

function renderFrameStrip() {
  const strip = $("#paintFrameStrip"); strip.innerHTML = "";
  $("#paintFrameTitle").textContent = state.selectedFrames.size > 1 ? `${state.frames.length} 个帧 · 已选择 ${state.selectedFrames.size}` : `${state.frames.length} 个帧`;
  state.frames.forEach((frame, index) => {
    const button = document.createElement("button"); button.type = "button"; button.className = `frame-card ${state.selectedFrames.has(index) ? "active" : ""}`;
    const number = document.createElement("span"); number.className = "frame-index"; number.textContent = String(index + 1).padStart(2, "0");
    const canvas = document.createElement("canvas"); drawThumbnail(canvas, frame);
    const name = document.createElement("span"); name.textContent = frame.name;
    const size = document.createElement("small"); size.textContent = `${frame.width} × ${frame.height}`;
    button.append(number, canvas, name, size); button.addEventListener("click", (event) => selectFrame(index, event)); strip.append(button);
  });
}

function drawThumbnail(canvas, frame) {
  canvas.width = 78; canvas.height = 65;
  const context = canvas.getContext("2d"); context.imageSmoothingEnabled = false;
  const image = new Image(); image.onload = () => { const scale = Math.min(78 / frame.width, 65 / frame.height), width = Math.max(1, Math.floor(frame.width * scale)), height = Math.max(1, Math.floor(frame.height * scale)); context.drawImage(image, Math.floor((78 - width) / 2), Math.floor((65 - height) / 2), width, height); }; image.src = frame.data;
}

function renderPalette() {
  $("#paletteCount").textContent = `${state.palette.length} / ${MAX_PALETTE_COLORS}`;
  $("#mobilePaletteCount").textContent = `${state.palette.length} / ${MAX_PALETTE_COLORS}`;
  $("#paintColor").value = state.color;
  $("#mobilePaintColor").value = state.color;
  $("#paintHex").value = state.color.toUpperCase();
  $("#mobilePaintHex").value = state.color.toUpperCase();
  renderPaletteGrid($("#paletteGrid"));
  renderPaletteGrid($("#mobilePaletteGrid"));
}

function renderPaletteGrid(grid) {
  grid.innerHTML = "";
  state.palette.forEach((color, index) => {
    const swatch = document.createElement("button"); swatch.type = "button"; swatch.className = `palette-swatch ${index === state.paletteSelected ? "active" : ""}`; swatch.style.backgroundColor = color; swatch.setAttribute("aria-label", `使用颜色 ${color}`); swatch.setAttribute("data-tip", color.toUpperCase());
    swatch.addEventListener("click", () => setCurrentColor(color, index));
    grid.append(swatch);
  });
}

function renderInspector() {
  const frame = currentFrame();
  if (!frame) return;
  $("#paintFrameBadge").textContent = `${String(state.selected + 1).padStart(2, "0")} / ${String(state.frames.length).padStart(2, "0")}`;
  $("#paintFrameName").value = frame.name;
  $("#paintWidth").value = frame.width;
  $("#paintHeight").value = frame.height;
}

function renderPreview() {
  const frame = currentFrame(); if (!frame) return;
  previewCanvas.width = 144; previewCanvas.height = 144; previewContext.clearRect(0, 0, 144, 144);
  const scale = Math.min(144 / frame.width, 144 / frame.height), width = Math.max(1, Math.floor(frame.width * scale)), height = Math.max(1, Math.floor(frame.height * scale));
  previewContext.imageSmoothingEnabled = false; previewContext.drawImage(paintCanvas, Math.floor((144 - width) / 2), Math.floor((144 - height) / 2), width, height);
}

function setTool(tool) {
  if (state.panMode) setPaintPanMode(false);
  state.tool = tool;
  document.querySelectorAll(".paint-tool, .mobile-paint-tool").forEach((button) => { const active = button.dataset.tool === tool; button.classList.toggle("active", active); button.setAttribute("aria-pressed", active); });
  paintCanvas.style.cursor = tool === "eyedropper" ? "copy" : tool === "fill" ? "cell" : "crosshair";
}
function setPaintPanMode(enabled) {
  state.panMode = enabled;
  state.panning = null;
  $("#paintPanButton").classList.toggle("active", enabled);
  $("#paintPanButton").setAttribute("aria-pressed", String(enabled));
  $("#mobilePaintPan").classList.toggle("active", enabled);
  $("#mobilePaintPan").setAttribute("aria-pressed", String(enabled));
  paintCanvas.style.cursor = enabled ? "grab" : state.tool === "eyedropper" ? "copy" : state.tool === "fill" ? "cell" : "crosshair";
}

function setCurrentColor(color, selected = state.palette.indexOf(color)) {
  const normalized = normalizeColor(color);
  if (!normalized) return;
  state.color = normalized;
  state.paletteSelected = selected >= 0 && state.palette[selected] === normalized ? selected : state.palette.indexOf(normalized);
  renderPalette();
}
function updateColorFromHex(event) {
  const color = normalizeColor(event.currentTarget.value);
  if (!color) { event.currentTarget.value = state.color.toUpperCase(); toast("请输入 6 位 HEX 颜色，例如 #2DD5C3。", "error"); return; }
  setCurrentColor(color);
}
function toggleMobilePalette() { const drawer = $("#mobilePaletteDrawer"); drawer.hidden = !drawer.hidden; $("#mobilePaletteToggle").setAttribute("aria-expanded", String(!drawer.hidden)); }
document.addEventListener("pixel-decomposer-language", () => { const toggle = $("#mobilePaletteToggle"); if (toggle) { toggle.querySelector("span").textContent = PixelI18n.t("色卡"); toggle.setAttribute("aria-label", PixelI18n.t("色卡")); } });

function canvasPoint(event) {
  const box = paintCanvas.getBoundingClientRect();
  return { x: Math.max(0, Math.min(paintCanvas.width - 1, Math.floor((event.clientX - box.left) * paintCanvas.width / box.width))), y: Math.max(0, Math.min(paintCanvas.height - 1, Math.floor((event.clientY - box.top) * paintCanvas.height / box.height))) };
}

function beginPaint(event) {
  if (event.button !== 0 || !currentFrame()) return;
  const point = canvasPoint(event);
  if (event.pointerType === "touch") {
    state.touchPoints.set(event.pointerId, point);
    if (state.touchPoints.size === 2) {
      if (state.drawing) { state.drawing = false; state.lastPoint = null; commitCanvas(); }
      state.panning = null;
      $("#paintStage").classList.remove("is-panning-active");
      beginPaintGesture();
      event.preventDefault();
      return;
    }
  }
  if (state.panMode) { beginPaintPan(event); return; }
  $("#paintStage").setPointerCapture(event.pointerId);
  if (state.tool === "eyedropper") { pickColor(point); return; }
  pushHistory();
  if (state.tool === "fill") { floodFill(point); commitCanvas(); return; }
  state.drawing = true; state.lastPoint = point; paintPoint(point.x, point.y); event.preventDefault();
}
function paintMove(event) { const point = canvasPoint(event); if (event.pointerType === "touch") { state.touchPoints.set(event.pointerId, point); if (state.gesture) { updatePaintGesture(); event.preventDefault(); return; } } if (state.panning?.pointerId === event.pointerId) { updatePaintPan(event); event.preventDefault(); return; } if (!state.drawing) return; drawLine(state.lastPoint, point); state.lastPoint = point; event.preventDefault(); }
function endPaint(event) { if (event.pointerType === "touch") { state.touchPoints.delete(event.pointerId); if (state.gesture || state.touchPoints.size) { state.gesture = null; state.drawing = false; state.lastPoint = null; releasePaintPointer(event.pointerId); return; } } if (state.panning?.pointerId === event.pointerId) { state.panning = null; $("#paintStage").classList.remove("is-panning-active"); releasePaintPointer(event.pointerId); return; } if (!state.drawing) { releasePaintPointer(event.pointerId); return; } state.drawing = false; state.lastPoint = null; commitCanvas(); releasePaintPointer(event.pointerId); }
function showPointer(event) { const point = canvasPoint(event); $("#paintPointer").textContent = `x: ${String(point.x).padStart(2, "0")}  y: ${String(point.y).padStart(2, "0")}`; }
function paintPoint(x, y) { const offset = Math.floor(state.brush / 2); if (state.tool === "eraser") paintContext.clearRect(x - offset, y - offset, state.brush, state.brush); else { paintContext.fillStyle = state.color; paintContext.fillRect(x - offset, y - offset, state.brush, state.brush); } }
function drawLine(from, to) { let x0 = from.x, y0 = from.y; const x1 = to.x, y1 = to.y, dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1; let error = dx + dy; while (true) { paintPoint(x0, y0); if (x0 === x1 && y0 === y1) break; const twice = 2 * error; if (twice >= dy) { error += dy; x0 += sx; } if (twice <= dx) { error += dx; y0 += sy; } } }
function pickColor(point) { const pixel = paintContext.getImageData(point.x, point.y, 1, 1).data; if (!pixel[3]) { toast("这个像素是透明的。", "error"); return; } setCurrentColor(rgbToHex(pixel[0], pixel[1], pixel[2])); }
function floodFill(point) { const width = paintCanvas.width, height = paintCanvas.height, image = paintContext.getImageData(0, 0, width, height), data = image.data, start = (point.y * width + point.x) * 4, target = [data[start], data[start + 1], data[start + 2], data[start + 3]], fill = hexToRgb(state.color).concat(255); if (target.every((value, index) => value === fill[index])) return; const stack = [[point.x, point.y]]; while (stack.length) { const [x, y] = stack.pop(); if (x < 0 || y < 0 || x >= width || y >= height) continue; const index = (y * width + x) * 4; if (target.some((value, channel) => data[index + channel] !== value)) continue; data.set(fill, index); stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); } paintContext.putImageData(image, 0, 0); }
function paintSnapshot(frame) { return { data: frame.data, width: frame.width, height: frame.height }; }
function applyPaintSnapshot(frame, snapshot) { const restored = typeof snapshot === "string" ? { data: snapshot, width: frame.width, height: frame.height } : snapshot; frame.data = restored.data; frame.width = restored.width; frame.height = restored.height; }
function pushHistory() { const frame = currentFrame(); frame.history.push(paintSnapshot(frame)); if (frame.history.length > 24) frame.history.shift(); frame.future = []; }
function commitCanvas() { const frame = currentFrame(); frame.data = paintCanvas.toDataURL("image/png"); frame.width = paintCanvas.width; frame.height = paintCanvas.height; markDirty(); renderPreview(); renderFrameStrip(); renderInspector(); }
function undo() { const frame = currentFrame(); if (!frame?.history.length) { toast("当前帧没有可撤销的绘制或尺寸调整。", "error"); return; } frame.future = frame.future || []; frame.future.push(paintSnapshot(frame)); applyPaintSnapshot(frame, frame.history.pop()); markDirty(); refreshUI(); }
function redo() { const frame = currentFrame(); if (!frame?.future?.length) { toast("当前帧没有可重做的绘制或尺寸调整。", "error"); return; } frame.history.push(paintSnapshot(frame)); applyPaintSnapshot(frame, frame.future.pop()); markDirty(); refreshUI(); }

function addPaletteColor() {
  const existing = state.palette.indexOf(state.color);
  if (existing >= 0) { state.paletteSelected = existing; renderPalette(); toast("该颜色已在色卡中。 "); return; }
  if (state.palette.length >= MAX_PALETTE_COLORS) { toast("色卡最多保存 48 个颜色。", "error"); return; }
  state.palette.push(state.color); state.paletteSelected = state.palette.length - 1; savePaletteMemory(); markDirty(); renderPalette(); toast(`已保存 ${state.color.toUpperCase()} 到色卡。`);
}
function removePaletteColor() {
  if (state.paletteSelected < 0) { toast("请先点击色卡中的一个颜色，再删除。", "error"); return; }
  const removed = state.palette[state.paletteSelected];
  state.palette.splice(state.paletteSelected, 1);
  state.paletteSelected = Math.min(state.paletteSelected, state.palette.length - 1);
  if (state.paletteSelected >= 0) state.color = state.palette[state.paletteSelected];
  savePaletteMemory(); markDirty(); renderPalette(); toast(`已从色卡移除 ${removed.toUpperCase()}。`);
}
function resetPalette() {
  state.palette = [...defaults]; state.paletteSelected = 0; state.color = state.palette[0];
  savePaletteMemory(); markDirty(); renderPalette(); toast("已恢复默认色卡并更新本机记忆。 ");
}
function normalizeColor(color) {
  const value = String(color || "").trim().toLowerCase();
  const expanded = /^#([0-9a-f]{3})$/.exec(value);
  if (expanded) return `#${expanded[1].split("").map((channel) => channel + channel).join("")}`;
  return /^#[0-9a-f]{6}$/.test(value) ? value : null;
}
function normalizedPaletteColors(colors) {
  return Array.isArray(colors) ? colors.map(normalizeColor).filter(Boolean) : [];
}
function mergePaletteColors(...sources) {
  return [...new Set(sources.flatMap(normalizedPaletteColors))].slice(0, MAX_PALETTE_COLORS);
}
function readPaletteMemory() {
  try {
    const saved = JSON.parse(localStorage.getItem(PALETTE_MEMORY_KEY) || "{}");
    return normalizedPaletteColors(saved.colors);
  } catch { return []; }
}
function savePaletteMemory() {
  try { localStorage.setItem(PALETTE_MEMORY_KEY, JSON.stringify({ format: "PixelDecomposerPalette", version: 1, colors: state.palette.slice(0, MAX_PALETTE_COLORS) })); } catch { /* The project file still retains the current palette. */ }
}
async function exportPalette() {
  const palette = { format: "PixelDecomposerPalette", version: 1, colors: state.palette.slice(0, MAX_PALETTE_COLORS) };
  try {
    const destination = await downloadBlob(new Blob([JSON.stringify(palette, null, 2)], { type: "application/json" }), `${safeName($("#editorProjectName").value)}_palette.pdpalette.json`);
    toast(destination === "downloads" ? "色卡已保存到下载目录。" : "色卡已导出。 ");
  } catch { toast("色卡导出失败，请确认设备存储空间和权限。", "error"); }
}
function importPalette(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const raw = String(reader.result);
      let palette;
      try { palette = JSON.parse(raw); } catch { palette = raw; }
      const colors = extractPaletteColors(palette);
      if (!colors.length) throw new Error("invalid");
      state.palette = mergePaletteColors(state.palette, colors);
      state.paletteSelected = Math.max(0, state.palette.indexOf(colors[0]));
      state.color = state.palette[state.paletteSelected];
      savePaletteMemory();
      markDirty();
      renderPalette();
      toast(`已导入色卡，共 ${state.palette.length} 色。`);
    } catch { toast("这不是可读取的 Pixel Decomposer 色卡文件。", "error"); }
  };
  reader.readAsText(file);
}
function extractPaletteColors(palette) {
  if (Array.isArray(palette)) return normalizedPaletteColors(palette);
  if (typeof palette === "string") return palette.match(/#[0-9a-f]{3,6}\b/gi)?.map(normalizeColor).filter(Boolean) || [];
  if (!palette || typeof palette !== "object") return [];
  return normalizedPaletteColors(palette.colors || palette.palette || palette.swatches || palette.values || []);
}

function setZoom(value, animated = false) {
  state.zoomTarget = Math.max(2, Math.min(24, value));
  if (!animated) {
    if (state.zoomFrame) window.cancelAnimationFrame(state.zoomFrame);
    state.zoomFrame = 0;
    state.zoom = state.zoomTarget;
    applyZoom();
    return;
  }
  if (state.zoomFrame) return;
  const animate = () => {
    const remaining = state.zoomTarget - state.zoom;
    if (Math.abs(remaining) < .004) {
      state.zoom = state.zoomTarget;
      state.zoomFrame = 0;
      applyZoom();
      return;
    }
    state.zoom += remaining * .28;
    applyZoom();
    state.zoomFrame = window.requestAnimationFrame(animate);
  };
  state.zoomFrame = window.requestAnimationFrame(animate);
}
function applyZoom() { paintCanvas.style.width = `${paintCanvas.width * state.zoom}px`; paintCanvas.style.height = `${paintCanvas.height * state.zoom}px`; $("#paintStage").style.width = paintCanvas.style.width; $("#paintStage").style.height = paintCanvas.style.height; $("#paintZoomReset").value = String(Math.round(state.zoom * 100)); }
function updatePaintZoomFromField(event) { setZoom((Number(event.currentTarget.value) || 800) / 100); }
function beginPaintGesture() { const [first, second] = [...state.touchPoints.values()]; const workspace = $("#paintStage").closest(".workspace"); state.gesture = { distance: pointDistance(first, second), zoom: state.zoomTarget, center: pointCenter(first, second), scrollLeft: workspace.scrollLeft, scrollTop: workspace.scrollTop }; }
function updatePaintGesture() { const [first, second] = [...state.touchPoints.values()]; if (!first || !second || !state.gesture) return; const center = pointCenter(first, second); const nextZoom = state.gesture.zoom * Math.pow(pointDistance(first, second) / state.gesture.distance, .45); setZoom(nextZoom, true); const workspace = $("#paintStage").closest(".workspace"); workspace.scrollLeft = state.gesture.scrollLeft - (center.x - state.gesture.center.x) * state.zoomTarget; workspace.scrollTop = state.gesture.scrollTop - (center.y - state.gesture.center.y) * state.zoomTarget; }
function pointDistance(first, second) { return Math.hypot(second.x - first.x, second.y - first.y) || 1; }
function pointCenter(first, second) { return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }; }
function beginPaintPan(event) { const workspace = $("#paintStage").closest(".workspace"); state.panning = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, scrollLeft: workspace.scrollLeft, scrollTop: workspace.scrollTop }; $("#paintStage").setPointerCapture(event.pointerId); $("#paintStage").classList.add("is-panning-active"); event.preventDefault(); }
function updatePaintPan(event) { const pan = state.panning; if (!pan) return; const workspace = $("#paintStage").closest(".workspace"); workspace.scrollLeft = pan.scrollLeft - (event.clientX - pan.x); workspace.scrollTop = pan.scrollTop - (event.clientY - pan.y); }
function releasePaintPointer(pointerId) { const stage = $("#paintStage"); if (stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId); }
function zoomPaintWithWheel(event) { if (!event.deltaY) return; event.preventDefault(); setZoom(state.zoomTarget * Math.exp(-normalizedWheelDelta(event) * .00022), true); }
function normalizedWheelDelta(event) { const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? 240 : 1; return Math.max(-120, Math.min(120, event.deltaY * unit)); }
function resizeFrame() { const frame = currentFrame(); const width = Math.max(1, Math.min(4096, Number($("#paintWidth").value) || frame.width)), height = Math.max(1, Math.min(4096, Number($("#paintHeight").value) || frame.height)); if (width === frame.width && height === frame.height) return; pushHistory(); const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; const context = canvas.getContext("2d"); context.imageSmoothingEnabled = false; context.drawImage(paintCanvas, 0, 0); frame.width = width; frame.height = height; frame.data = canvas.toDataURL("image/png"); markDirty(); refreshUI(); }
function frameActionSnapshot() { return { frames: state.frames.map(({ id, name, data, width, height }) => ({ id, name, data, width, height })), selected: state.selected, selectedFrames: [...state.selectedFrames], multiSelecting: state.multiSelecting }; }
function pushFrameActionHistory() { state.frameActionHistory.push(frameActionSnapshot()); if (state.frameActionHistory.length > 30) state.frameActionHistory.shift(); state.frameActionFuture = []; }
function restoreFrameActionSnapshot(snapshot) {
  state.frames = snapshot.frames.map((frame) => ({ ...frame, history: [], future: [] }));
  state.selected = state.frames.length ? Math.max(0, Math.min(snapshot.selected, state.frames.length - 1)) : -1;
  state.selectedFrames = new Set((snapshot.selectedFrames || [state.selected]).filter((index) => index >= 0 && index < state.frames.length));
  if (!state.selectedFrames.size && state.selected >= 0) state.selectedFrames.add(state.selected);
  state.multiSelecting = Boolean(snapshot.multiSelecting);
  refreshUI();
}
function undoFrameAction() { if (!state.frameActionHistory.length) { toast("没有可撤销的帧操作。", "error"); return; } state.frameActionFuture.push(frameActionSnapshot()); restoreFrameActionSnapshot(state.frameActionHistory.pop()); markDirty(); toast("已撤销帧操作。"); }
function redoFrameAction() { if (!state.frameActionFuture.length) { toast("没有可重做的帧操作。", "error"); return; } state.frameActionHistory.push(frameActionSnapshot()); restoreFrameActionSnapshot(state.frameActionFuture.pop()); markDirty(); toast("已重做帧操作。"); }
function syncFrameActionControls() { $("#undoFrameAction").disabled = !state.frameActionHistory.length; $("#redoFrameAction").disabled = !state.frameActionFuture.length; }
function duplicateFrame() { const frame = currentFrame(); if (!frame) return; pushFrameActionHistory(); const copy = { id: `${Date.now()}-copy`, name: `${frame.name}_copy`, data: frame.data, width: frame.width, height: frame.height, history: [], future: [] }; state.frames.splice(state.selected + 1, 0, copy); state.selected += 1; state.selectedFrames = new Set([state.selected]); state.multiSelecting = false; markDirty(); refreshUI(); }
function deleteFrame() {
  if (!state.frames.length) return;
  const selected = state.selectedFrames.size ? [...state.selectedFrames] : [state.selected];
  pushFrameActionHistory();
  const firstSelected = Math.min(...selected);
  const selectedSet = new Set(selected);
  state.frames = state.frames.filter((_, index) => !selectedSet.has(index));
  if (!state.frames.length) {
    state.selected = -1;
    state.selectedFrames = new Set();
    createBlankFrame(false);
  } else {
    state.selected = Math.min(firstSelected, state.frames.length - 1);
    state.selectedFrames = new Set([state.selected]);
    state.multiSelecting = false;
    refreshUI();
  }
  markDirty();
}

function projectData() { return { format: "PixelDecomposer", version: 3, name: $("#editorProjectName").value.trim() || state.projectName, source: state.source, regions: state.regions, palette: state.palette, frames: state.frames.map(({ id, name, data, width, height }) => ({ id, name, data, width, height })), editorMode: state.sourceEditFrameId ? "source" : undefined, sourceEditFrameId: state.sourceEditFrameId || undefined, sourceEditOriginalSize: state.sourceEditOriginalSize || undefined }; }
function materializeSourceProject(project) {
  if (!state.sourceEditFrameId) return project;
  const sourceFrame = state.frames.find((frame) => frame.id === state.sourceEditFrameId) || currentFrame();
  if (!sourceFrame) throw new Error("Missing source editing frame");
  const result = { ...project, source: { name: state.source.name || `${safeName(sourceFrame.name)}.png`, data: sourceFrame.data }, frames: [], alignment: null };
  const original = state.sourceEditOriginalSize;
  if (original && (sourceFrame.width !== original.width || sourceFrame.height !== original.height)) result.regions = [];
  delete result.editorMode; delete result.sourceEditFrameId; delete result.sourceEditOriginalSize;
  return result;
}
async function saveProject() {
  const project = materializeSourceProject(projectData());
  try {
    const destination = await downloadBlob(new Blob([JSON.stringify(project)], { type: "application/json" }), `${safeName(project.name)}.pdec`);
    state.dirty = false;
    toast(destination === "downloads" ? "工程文件已保存到下载目录。" : "工程文件已保存，包含编辑后的帧与最多 48 色的色卡。 ");
    return true;
  } catch {
    toast("工程文件导出失败，请确认设备存储空间和权限。", "error");
    return false;
  }
}
async function returnToSplit() {
  try {
    const draft = materializeSourceProject(projectData());
    await saveWorkspaceDraft("pixel-decomposer-editor-return", { ...draft, _transientDirty: state.dirty });
    PixelProjectLifecycle?.allowNavigation?.();
    window.location.href = "index.html?from=editor";
  } catch { toast("无法返回拆分页，请先保存工程文件。", "error"); }
}
async function goToGif() { try { const project = projectData(); await saveWorkspaceDraft("pixel-decomposer-gif-draft", { ...project, frames: [], gifSourceFrames: project.frames, gifSelectionRequired: true, _transientDirty: state.dirty }); PixelProjectLifecycle?.allowNavigation?.(); window.location.href = "gif.html?from=editor"; } catch { toast("无法传递帧数据，请先保存工程文件。", "error"); } }
async function goToSettings() { try { await saveWorkspaceDraft("pixel-decomposer-editor-draft", { ...projectData(), _transientDirty: state.dirty }); PixelProjectLifecycle?.allowNavigation?.(); window.location.href = "settings.html?return=editor"; } catch { toast("无法保留当前工程，请先保存工程文件。", "error"); } }
async function saveWorkspaceDraft(key, project) {
  if (window.PixelWorkspaceTransfer) {
    try { await window.PixelWorkspaceTransfer.save(key, project); sessionStorage.removeItem(key); return; }
    catch { /* Fall back to Web Storage for older browser engines. */ }
  }
  sessionStorage.setItem(key, JSON.stringify(project));
}
async function takeWorkspaceDraft(key) {
  if (window.PixelWorkspaceTransfer) {
    try { const project = await window.PixelWorkspaceTransfer.take(key); if (project) return typeof project === "string" ? JSON.parse(project) : project; }
    catch { /* Read the legacy fallback below. */ }
  }
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  sessionStorage.removeItem(key);
  return JSON.parse(raw);
}
async function exportPng() {
  const frame = currentFrame();
  if (!frame) return;
  try {
    const destination = await downloadBlob(dataUrlToBlob(frame.data), `${safeName(frame.name)}.png`);
    toast(destination === "gallery" ? "透明 PNG 已保存到相册。" : "透明 PNG 已开始下载。 ");
  } catch {
    toast("PNG 导出失败，请确认设备存储空间和权限。", "error");
  }
}
function hexToRgb(hex) { const value = hex.replace("#", ""); return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)]; }
function rgbToHex(r, g, b) { return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`; }
function safeName(value) { return (value || "pixel-art").replace(/[\\/:*?\"<>|]/g, "_").trim() || "pixel-art"; }
function dataUrlToBlob(dataUrl) {
  const [header, encoded] = dataUrl.split(",", 2);
  const mimeType = /data:([^;]+)/.exec(header)?.[1] || "image/png";
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1]);
    reader.onerror = () => reject(reader.error || new Error("blob read failed"));
    reader.readAsDataURL(blob);
  });
}
async function downloadBlob(blob, name) {
  const exporter = window.Capacitor?.Plugins?.PixelExporter;
  if (exporter) return (await exporter.saveFile({ data: await blobToBase64(blob), filename: name, mimeType: blob.type || "application/octet-stream" })).destination;
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "browser";
}
function toast(message, kind = "normal") { const element = $("#toast"); element.textContent = message; element.className = `toast visible ${kind === "error" ? "error" : ""}`; window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => element.classList.remove("visible"), 2700); }
function markDirty() { state.dirty = true; }

init();
