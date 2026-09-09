"use strict";

const $ = (selector) => document.querySelector(selector);
const previewCanvas = $("#gifPreviewCanvas");
const previewContext = previewCanvas.getContext("2d");
const state = { projectName: "未命名动作工程", project: null, frames: [], availableFrames: [], selected: 0, playing: false, playbackTimer: null, dragIndex: null, dirty: false };

async function init() {
  if (new URLSearchParams(window.location.search).has("from")) await loadDraft();
  bindEvents();
  refreshUI();
  if (state.project?.gifSelectionRequired && state.availableFrames.length) openGifSourceDialog();
  PixelProjectLifecycle?.setup({ isDirty: () => state.dirty, save: saveProject, toast });
  window.setTimeout(() => window.lucide?.createIcons(), 30);
}

function bindEvents() {
  $("#backToSplitButton").addEventListener("click", returnToSplit);
  $(".brand").addEventListener("click", (event) => { event.preventDefault(); void returnToSplit(); });
  $("#openGifProjectButton").addEventListener("click", () => $("#gifProjectInput").click());
  $("#saveGifProjectButton").addEventListener("click", saveProject);
  $("#openSettingsButton").addEventListener("click", () => { void goToSettings(); });
  $("#gifProjectName").addEventListener("input", (event) => { state.projectName = event.target.value.trim() || "未命名动作工程"; markDirty(); });
  $("#openGifProjectSideButton").addEventListener("click", () => $("#gifProjectInput").click());
  $("#gifProjectInput").addEventListener("change", (event) => { const [file] = event.target.files; if (file) openProject(file); event.target.value = ""; });
  $("#gifImageInput").addEventListener("change", (event) => { const files = [...event.target.files]; if (files.length) void importGifImages(files); event.target.value = ""; });
  $("#selectSplitFrames").addEventListener("click", openGifSourceDialog);
  $("#importGifImages").addEventListener("click", () => $("#gifImageInput").click());
  $("#importGifImagesDialog").addEventListener("click", () => $("#gifImageInput").click());
  $("#closeGifSourceDialog").addEventListener("click", closeGifSourceDialog);
  $("#addSelectedSplitFrames").addEventListener("click", addSelectedSplitFrames);
  $("#playGifButton").addEventListener("click", togglePlay);
  $("#stopGifButton").addEventListener("click", stopPlayback);
  $("#nextGifFrame").addEventListener("click", () => { if (!state.frames.length) return; state.selected = (state.selected + 1) % state.frames.length; refreshUI(); });
  $("#setUniformDuration").addEventListener("click", () => { state.frames.forEach((frame) => frame.duration = .12); markDirty(); persistDraft(); refreshUI(); toast("所有帧已设为 0.12 秒，可继续分别调整。 "); });
  $("#gifExportButton").addEventListener("click", exportGif);
  $("#gifExportSideButton").addEventListener("click", exportGif);
  $("#gifScale").addEventListener("change", renderStats);
  document.addEventListener("keydown", (event) => { if (event.key === "Delete" && !event.target.matches("input,textarea,select")) { event.preventDefault(); deleteFrame(state.selected); } });
}

async function loadDraft() {
  try { const project = await takeWorkspaceDraft("pixel-decomposer-gif-draft"); if (project) applyProject(project); }
  catch { /* User can load a .pdec file instead. */ }
}

function openProject(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const project = JSON.parse(reader.result);
      if (project.format !== "PixelDecomposer" || !Array.isArray(project.frames)) throw new Error("invalid");
      applyProject(project);
      refreshUI();
      toast(`已载入 ${state.frames.length} 帧。`);
    } catch { toast("这不是可用于 GIF 编排的 Pixel Decomposer 工程。", "error"); }
  };
  reader.readAsText(file);
}

function applyProject(project) {
  state.projectName = project.name || "未命名动作工程";
  state.project = { ...project };
  state.availableFrames = normalizeFrames(project.gifSourceFrames || []);
  state.frames = normalizeFrames(project.frames || []);
  state.selected = state.frames.length ? 0 : -1;
  state.dirty = Boolean(project._transientDirty);
  $("#gifProjectName").value = state.projectName;
  stopPlayback();
}

function normalizeFrames(frames) {
  return frames.filter((frame) => frame?.data && Number(frame.width) > 0 && Number(frame.height) > 0).map((frame, index) => ({ id: frame.id || `${Date.now()}-${index}`, name: frame.name || `frame_${index + 1}`, data: frame.data, width: Number(frame.width), height: Number(frame.height), duration: normalizeDuration(frame.duration) }));
}

function normalizeDuration(value) {
  const numeric = Number(value);
  const seconds = numeric > 10 ? numeric / 1000 : numeric;
  return Math.max(.01, Math.round((seconds || .12) * 100) / 100);
}

function refreshUI() {
  $("#gifFrameCount").textContent = `${state.frames.length} 帧`;
  renderFrameList();
  renderPreview();
  renderStats();
}

function renderFrameList() {
  const list = $("#gifFrameList");
  list.innerHTML = "";
  if (!state.frames.length) { const empty = document.createElement("div"); empty.className = "empty-gif"; empty.textContent = "选择拆分帧，或导入图片作为 GIF 帧。"; list.append(empty); return; }
  state.frames.forEach((frame, index) => {
    const row = document.createElement("div");
    row.className = `gif-row ${index === state.selected ? "selected" : ""}`;
    row.draggable = true;
    const handle = document.createElement("i"); handle.className = "drag-handle"; handle.dataset.lucide = "grip-vertical"; handle.setAttribute("aria-hidden", "true");
    const thumb = document.createElement("canvas"); thumb.className = "gif-thumb"; drawThumb(thumb, frame);
    const main = document.createElement("div"); main.className = "gif-row-main"; const title = document.createElement("b"); title.textContent = frame.name; const position = document.createElement("small"); position.textContent = `第 ${String(index + 1).padStart(2, "0")} 帧`; main.append(title, position);
    const duration = document.createElement("label"); duration.className = "duration-field"; const input = document.createElement("input"); input.type = "number"; input.min = ".01"; input.max = "60"; input.step = ".01"; input.value = frame.duration.toFixed(2); input.setAttribute("aria-label", `${frame.name} 的时长，秒`); const unit = document.createElement("span"); unit.textContent = "s"; duration.append(input, unit);
    input.addEventListener("change", () => { frame.duration = Math.max(.01, Math.min(60, Math.round(Number(input.value || .12) * 100) / 100)); input.value = frame.duration.toFixed(2); markDirty(); persistDraft(); renderPreview(); renderStats(); });
    const actions = document.createElement("div"); actions.className = "gif-row-actions"; const duplicate = orderButton("copy", "复制此帧", () => duplicateFrame(index)); duplicate.classList.add("duplicate-frame-button"); const remove = orderButton("trash-2", "删除此帧", () => deleteFrame(index)); remove.classList.add("delete-frame-button"); actions.append(duplicate, remove); const order = document.createElement("div"); order.className = "order-buttons"; order.append(orderButton("chevron-up", "上移", () => moveFrame(index, -1)), orderButton("chevron-down", "下移", () => moveFrame(index, 1))); actions.append(order);
    row.append(handle, thumb, main, duration, actions);
    row.addEventListener("click", (event) => { if (!event.target.matches("input,button,svg,path")) { state.selected = index; refreshUI(); } });
    row.addEventListener("dragstart", () => { state.dragIndex = index; row.classList.add("dragging"); });
    row.addEventListener("dragend", () => { state.dragIndex = null; row.classList.remove("dragging"); });
    row.addEventListener("dragover", (event) => event.preventDefault());
    row.addEventListener("drop", (event) => { event.preventDefault(); if (state.dragIndex === null || state.dragIndex === index) return; const [moved] = state.frames.splice(state.dragIndex, 1); state.frames.splice(index, 0, moved); state.selected = index; markDirty(); persistDraft(); refreshUI(); });
    list.append(row);
  });
  window.lucide?.createIcons();
}

function drawThumb(canvas, frame) {
  canvas.width = 44; canvas.height = 44;
  const context = canvas.getContext("2d"); context.imageSmoothingEnabled = false;
  const image = new Image();
  image.onload = () => { const scale = Math.min(44 / frame.width, 44 / frame.height), width = Math.max(1, Math.floor(frame.width * scale)), height = Math.max(1, Math.floor(frame.height * scale)); context.drawImage(image, Math.floor((44 - width) / 2), Math.floor((44 - height) / 2), width, height); };
  image.src = frame.data;
}

function orderButton(icon, label, action) { const button = document.createElement("button"); button.type = "button"; button.className = "order-button"; button.setAttribute("aria-label", PixelI18n.t(label)); button.dataset.tip=label; button.innerHTML = `<i data-lucide="${icon}" aria-hidden="true"></i>`; button.addEventListener("click", action); return button; }
function moveFrame(index, direction) { const target = index + direction; if (target < 0 || target >= state.frames.length) return; [state.frames[index], state.frames[target]] = [state.frames[target], state.frames[index]]; state.selected = target; markDirty(); persistDraft(); refreshUI(); }
function duplicateFrame(index) { const frame = state.frames[index]; if (!frame) return; state.frames.splice(index + 1, 0, { ...frame, id: `gif-copy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: `${frame.name}_copy` }); state.selected = index + 1; markDirty(); persistDraft(); refreshUI(); toast("已复制此帧，可单独调整时长与顺序。"); }
function deleteFrame(index) { if (index < 0 || index >= state.frames.length) return; const [removed] = state.frames.splice(index, 1); state.selected = state.frames.length ? Math.min(index, state.frames.length - 1) : -1; markDirty(); persistDraft(); refreshUI(); toast(`已删除 ${removed.name}。`); }

function openGifSourceDialog() {
  if (!state.availableFrames.length) { toast("当前工程没有可选的拆分帧，请导入图片作为 GIF 帧。", "error"); return; }
  renderSplitFramePicker();
  $("#gifSourceDialog").hidden = false;
  window.lucide?.createIcons();
}
function closeGifSourceDialog() { $("#gifSourceDialog").hidden = true; }
function renderSplitFramePicker() {
  const picker = $("#gifSplitFramePicker"); picker.innerHTML = "";
  state.availableFrames.forEach((frame, index) => {
    const option = document.createElement("label"); option.className = "gif-split-frame-option";
    const check = document.createElement("input"); check.type = "checkbox"; check.value = String(index); check.setAttribute("aria-label", `选择 ${frame.name}`);
    const thumb = document.createElement("canvas"); thumb.className = "gif-thumb"; drawThumb(thumb, frame);
    const name = document.createElement("span"); name.textContent = frame.name;
    option.append(check, thumb, name); picker.append(option);
  });
}
function addSelectedSplitFrames() {
  const selected = [...document.querySelectorAll("#gifSplitFramePicker input:checked")].map((input) => state.availableFrames[Number(input.value)]).filter(Boolean);
  if (!selected.length) { toast("请至少选择一个拆分帧。", "error"); return; }
  const start = state.frames.length;
  state.frames.push(...selected.map((frame, index) => ({ ...frame, id: `gif-source-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}` })));
  state.selected = start;
  state.project.gifSelectionRequired = false;
  markDirty(); persistDraft(); closeGifSourceDialog(); refreshUI();
  toast(`已添加 ${selected.length} 帧；可再次选择同一素材。`);
}
async function importGifImages(files) {
  try {
    const imported = await Promise.all(files.map((file, index) => imageFileToFrame(file, index)));
    const start = state.frames.length;
    state.frames.push(...imported);
    state.selected = start;
    state.project = { ...(state.project || {}), gifSelectionRequired: false };
    markDirty(); persistDraft(); closeGifSourceDialog(); refreshUI();
    toast(`已导入 ${imported.length} 张图片作为 GIF 帧。`);
  } catch { toast("图片导入失败，请使用 PNG、WebP、GIF 或 JPEG 图片。", "error"); }
}
function imageFileToFrame(file, index) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("read failed"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("image load failed"));
      image.onload = () => resolve({ id: `gif-import-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`, name: file.name.replace(/\.[^.]+$/, "") || `import_${index + 1}`, data: String(reader.result), width: image.naturalWidth, height: image.naturalHeight, duration: .12 });
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function renderPreview() {
  const frame = state.frames[state.selected];
  previewCanvas.width = 256; previewCanvas.height = 256; previewContext.clearRect(0, 0, 256, 256);
  if (!frame) { $("#previewIndex").textContent = "-- / --"; $("#previewName").textContent = "尚未加载帧"; $("#previewDuration").textContent = "从贴图拆分页面带入帧"; return; }
  const image = new Image();
  image.onload = () => { const scale = Math.min(256 / frame.width, 256 / frame.height), width = Math.max(1, Math.floor(frame.width * scale)), height = Math.max(1, Math.floor(frame.height * scale)); previewContext.imageSmoothingEnabled = false; previewContext.drawImage(image, Math.floor((256 - width) / 2), Math.floor((256 - height) / 2), width, height); };
  image.src = frame.data;
  $("#previewIndex").textContent = `${String(state.selected + 1).padStart(2, "0")} / ${String(state.frames.length).padStart(2, "0")}`;
  $("#previewName").textContent = frame.name;
  $("#previewDuration").textContent = `${frame.duration.toFixed(2)} 秒`;
}

function renderStats() {
  const total = state.frames.reduce((sum, frame) => sum + frame.duration, 0);
  const multiplier = Number($("#gifScale").value);
  const maxWidth = Math.max(0, ...state.frames.map((frame) => frame.width)) * multiplier;
  const maxHeight = Math.max(0, ...state.frames.map((frame) => frame.height)) * multiplier;
  $("#totalDuration").textContent = `${total.toFixed(2)} s`;
  $("#totalDurationSmall").textContent = `${total.toFixed(2)} 秒`;
  $("#averageFps").textContent = total ? `${(state.frames.length / total).toFixed(1)} FPS` : "0.0 FPS";
  $("#gifDimensions").textContent = maxWidth ? `${maxWidth} × ${maxHeight}` : "--";
}

function togglePlay() { if (state.playing) stopPlayback(); else startPlayback(); }
function startPlayback() {
  if (!state.frames.length) return;
  state.playing = true;
  $("#playGifButton").classList.add("active");
  const playNext = () => {
    renderPreview();
    const delay = state.frames[state.selected].duration * 1000;
    state.playbackTimer = window.setTimeout(() => {
      state.selected += 1;
      if (state.selected >= state.frames.length) { if ($("#loopGif").checked) state.selected = 0; else { stopPlayback(); return; } }
      renderFrameList();
      playNext();
    }, delay);
  };
  playNext();
}
function stopPlayback() { if (state.playbackTimer) window.clearTimeout(state.playbackTimer); state.playbackTimer = null; state.playing = false; $("#playGifButton")?.classList.remove("active"); }

function projectData() {
  const { _transientDirty, ...project } = state.project || {};
  const name = $("#gifProjectName").value.trim() || state.projectName;
  state.projectName = name;
  return { ...project, format: "PixelDecomposer", version: 3, name, gifSourceFrames: state.availableFrames.map(({ id, name: frameName, data, width, height }) => ({ id, name: frameName, data, width, height })), frames: state.frames.map(({ id, name: frameName, data, width, height, duration }) => ({ id, name: frameName, data, width, height, duration })) };
}
function persistDraft() {
  void saveWorkspaceDraft("pixel-decomposer-gif-draft", { ...projectData(), _transientDirty: state.dirty });
}
async function saveProject() {
  const project = projectData();
  try {
    const destination = await downloadBlob(new Blob([JSON.stringify(project)], { type: "application/json" }), `${safeName(project.name)}.pdec`);
    state.dirty = false;
    persistDraft();
    toast(destination === "downloads" ? "GIF 工程已保存到下载目录。" : "GIF 顺序与逐帧时长已保存到工程文件。 ");
    return true;
  } catch {
    toast("GIF 工程导出失败，请确认设备存储空间和权限。", "error");
    return false;
  }
}

async function returnToSplit() {
  try {
    await saveWorkspaceDraft("pixel-decomposer-editor-return", { ...projectData(), _transientDirty: state.dirty });
    PixelProjectLifecycle?.allowNavigation?.();
    window.location.href = "index.html?from=gif";
  } catch { toast("无法返回拆分页，请先保存工程文件。", "error"); }
}
async function goToSettings() { try { await saveWorkspaceDraft("pixel-decomposer-gif-draft", { ...projectData(), _transientDirty: state.dirty }); PixelProjectLifecycle?.allowNavigation?.(); window.location.href = "settings.html?return=gif"; } catch { toast("无法保留当前工程，请先保存工程文件。", "error"); } }
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

async function exportGif() {
  if (!state.frames.length) { toast("请先选择拆分帧或导入图片。", "error"); return; }
  if (!window.GIF) { toast("GIF 编码器仍在加载，请稍后重试。", "error"); return; }
  const multiplier = Number($("#gifScale").value);
  const maxWidth = Math.max(...state.frames.map((frame) => frame.width)) * multiplier;
  const maxHeight = Math.max(...state.frames.map((frame) => frame.height)) * multiplier;
  toast(`正在编码 X${multiplier} GIF，请保持页面打开...`);
  const bundledWorker = window.location.protocol === "file:" || Boolean(window.Capacitor);
  const gif = new window.GIF({ workers: 2, quality: 10, width: maxWidth, height: maxHeight, transparent: 0x000000, workerScript: bundledWorker ? "vendor/gif.worker.js" : "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js" });
  for (const frame of state.frames) {
    const canvas = await frameCanvas(frame, multiplier);
    const padded = document.createElement("canvas"); padded.width = maxWidth; padded.height = maxHeight;
    padded.getContext("2d").drawImage(canvas, Math.floor((maxWidth - canvas.width) / 2), Math.floor((maxHeight - canvas.height) / 2));
    gif.addFrame(padded, { copy: true, delay: Math.round(frame.duration * 1000) });
  }
  gif.on("progress", (progress) => toast(`正在编码 GIF：${Math.round(progress * 100)}%`));
  gif.on("finished", async (blob) => {
    try {
      const destination = await downloadBlob(blob, `${safeName(state.projectName)}_x${multiplier}.gif`);
      toast(destination === "gallery" ? "GIF 动作已保存到相册。" : "GIF 动作已准备完成。 ");
    } catch {
      toast("GIF 导出失败，请确认设备存储空间和权限。", "error");
    }
  });
  gif.render();
}

function frameCanvas(frame, multiplier) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => { const canvas = document.createElement("canvas"); canvas.width = frame.width * multiplier; canvas.height = frame.height * multiplier; const context = canvas.getContext("2d"); context.imageSmoothingEnabled = false; context.drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas); };
    image.src = frame.data;
  });
}
function safeName(value) { return (value || "pixel-action").replace(/[\\/:*?\"<>|]/g, "_").trim() || "pixel-action"; }
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
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "browser";
}
function toast(message, kind = "normal") { const element = $("#toast"); element.textContent = message; element.className = `toast visible ${kind === "error" ? "error" : ""}`; window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => element.classList.remove("visible"), 2700); }
function markDirty() { state.dirty = true; }

init();
