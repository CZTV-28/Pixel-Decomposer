"use strict";

const $ = (selector) => document.querySelector(selector);
const sourceCanvas = $("#sourceCanvas");
const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
const sourceView = $("#sourceViewCanvas");
const sourceViewContext = sourceView.getContext("2d");
const selectionCanvas = $("#selectionCanvas");
const selectionContext = selectionCanvas.getContext("2d");
const previewCanvas = $("#selectionPreview");
const previewContext = previewCanvas.getContext("2d");

const state = {
  sourceName: "未导入源贴图",
  sourceData: "",
  regions: [],
  frames: [],
  selectedRegion: 0,
  selectedFrame: -1,
  sliceMode: "auto",
  zoom: 1,
  zoomTarget: 1,
  zoomFrame: 0,
  drawing: false,
  start: null,
  draft: null,
  resizing: null,
  panMode: false,
  panning: null,
  touchPoints: new Map(),
  gesture: null,
  palette: [],
  alignment: null,
  attachedFragments: 0,
  dirty: false,
  canvasSetupForDrawing: false,
  regionHistory: [],
  regionFuture: []
};

async function init() {
  bindEvents();
  const returningFromWorkspace = new URLSearchParams(window.location.search).has("from") && await restoreEditorReturn();
  if (!returningFromWorkspace) {
    await clearLaunchDrafts();
    initializeBlankSource();
    showProjectStartDialog();
  }
  PixelProjectLifecycle?.setup({ isDirty: () => state.dirty, save: saveProject, toast });
  window.setTimeout(() => window.lucide?.createIcons(), 30);
  if (window.matchMedia?.('(max-width: 840px)').matches && !localStorage.getItem('pixel-decomposer-mobile-help-seen')) { toast('手机操作：点按工具进行绘制；双指移动画布，双指捏合缩放；底部“色卡”打开颜色面板。'); localStorage.setItem('pixel-decomposer-mobile-help-seen','1'); }
}

async function clearLaunchDrafts() {
  const keys = ["pixel-decomposer-editor-return", "pixel-decomposer-editor-draft", "pixel-decomposer-gif-draft"];
  try {
    keys.forEach((key) => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  } catch { /* The blank workspace remains usable when browser storage is disabled. */ }
  try { await window.PixelWorkspaceTransfer?.remove(keys); } catch { /* Legacy storage was already cleared above. */ }
}

function initializeBlankSource() {
  sourceCanvas.width = 64;
  sourceCanvas.height = 64;
  sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
  state.sourceName = "未导入源贴图";
  state.sourceData = "";
  state.alignment = null;
  state.regions = [];
  state.frames = [];
  state.selectedRegion = -1;
  state.selectedFrame = -1;
  state.dirty = false;
  state.regionHistory = [];
  state.regionFuture = [];
  if (state.zoomFrame) window.cancelAnimationFrame(state.zoomFrame);
  state.zoomFrame = 0;
  state.zoom = 1;
  state.zoomTarget = 1;
  state.panMode = false;
  state.panning = null;
  refreshUI();
}

function bindEvents() {
  $("#startNewProject").addEventListener("click", () => { state.canvasSetupForDrawing = false; $("#projectStartDialog").hidden = true; $("#canvasSetupDialog").hidden = false; $("#newCanvasWidth").focus(); });
  $("#startOpenProject").addEventListener("click", () => $("#projectInput").click());
  $("#cancelCanvasSetup").addEventListener("click", () => { state.canvasSetupForDrawing = false; $("#canvasSetupDialog").hidden = true; $("#projectStartDialog").hidden = false; });
  $("#createCanvasProject").addEventListener("click", () => { void createCanvasProject(true); });
  $("#createCanvasAndDraw").addEventListener("click", () => { void createCanvasProject(false); });
  $("#importIntoNewProject").addEventListener("click", () => { void startImageImport(); });
  $("#importButton").addEventListener("click", () => $("#imageInput").click());
  const emptyPrompt = $("#emptyCanvasPrompt");
  ["pointerdown", "pointermove", "pointerup"].forEach((type) => emptyPrompt.addEventListener(type, (event) => event.stopPropagation()));
  $("#emptyImportButton").addEventListener("click", (event) => { event.preventDefault(); $("#imageInput").click(); });
  $("#openProjectButton").addEventListener("click", () => $("#projectInput").click());
  $("#saveProjectButton").addEventListener("click", saveProject);
  $("#openSettingsButton").addEventListener("click", () => { void goToSettings(); });
  $("#goEditorButton").addEventListener("click", goToEditor);
  $("#editFrameButton").addEventListener("click", goToEditor);
  $("#goGifButton").addEventListener("click", goToGif);
  $("#goGifSideButton").addEventListener("click", goToGif);
  $("#clearSource").addEventListener("click", clearSource);
  $("#imageInput").addEventListener("change", (event) => { const [file] = event.target.files; if (file) importImage(file); event.target.value = ""; });
  $("#projectInput").addEventListener("change", (event) => { const [file] = event.target.files; if (file) importProject(file); event.target.value = ""; });
  $("#autoMode").addEventListener("click", () => setSliceMode("auto"));
  $("#gridMode").addEventListener("click", () => setSliceMode("grid"));
  $("#detectButton").addEventListener("click", detectRegions);
  $("#minArea").addEventListener("input", (event) => { $("#minAreaValue").value = event.target.value; });
  $("#clearRegionsButton").addEventListener("click", clearRegions);
  $("#deleteRegionButton").addEventListener("click", deleteSelectedRegion);
  $("#undoSplit").addEventListener("click", undoRegions);
  $("#redoSplit").addEventListener("click", redoRegions);
  $("#zoomIn").addEventListener("click", () => setZoom(state.zoomTarget + .1));
  $("#zoomOut").addEventListener("click", () => setZoom(state.zoomTarget - .1));
  $("#zoomReset").addEventListener("change", updateZoomFromField);
  $("#zoomReset").addEventListener("keydown", (event) => { if (event.key === "Enter") event.currentTarget.blur(); });
  $("#splitAllButton").addEventListener("click", splitAllRegions);
  $("#splitAllMobile").addEventListener("click", splitAllRegions);
  $("#splitAllMobileDock").addEventListener("click", splitAllRegions);
  $("#pngExportButton").addEventListener("click", exportSelectedPng);
  $("#pngExportMobile").addEventListener("click", exportSelectedPng);
  $("#zipExportButton").addEventListener("click", exportZip);
  $("#zipExportMobile").addEventListener("click", exportZip);
  $("#editFrameMobile").addEventListener("click", goToEditor);
  $("#mobileImportButton").addEventListener("click", () => $("#imageInput").click());
  $("#mobileAutoDetect").addEventListener("click", () => { setSliceMode("auto"); detectRegions(); });
  $("#mobileGridDetect").addEventListener("click", () => { setSliceMode("grid"); detectRegions(); });
  $("#mobileClearRegions").addEventListener("click", clearRegions);
  $("#mobileUndoSplit").addEventListener("click", undoRegions);
  $("#mobileRedoSplit").addEventListener("click", redoRegions);
  $("#mobileExportZip").addEventListener("click", exportZip);
  $("#panCanvasButton").addEventListener("click", () => setPanMode(!state.panMode));
  $("#mobilePanCanvas").addEventListener("click", () => setPanMode(!state.panMode));
  $("#setAlignmentReference").addEventListener("click", setAlignmentReference);
  $("#splitAlignedFrames").addEventListener("click", splitAllRegions);
  $("#mobileAlignmentButton").addEventListener("click", openAlignmentDialog);
  $("#cancelAlignmentDialog").addEventListener("click", () => { $("#alignmentDialog").hidden = true; });
  $("#mobileSetAlignmentReference").addEventListener("click", () => setAlignmentReference(true));
  $("#mobileSplitAlignedFrames").addEventListener("click", () => { $("#alignmentDialog").hidden = true; splitAllRegions(); });
  $("#pngScale").addEventListener("change", syncScaleSelectors);
  $("#mobilePngScale").addEventListener("change", syncScaleSelectors);
  $("#itemName").addEventListener("input", updateItemName);
  $("#projectName").addEventListener("input", markDirty);
  ["#regionX", "#regionY", "#regionWidth", "#regionHeight"].forEach((selector) => $(selector).addEventListener("change", updateRegionFromFields));
  const stage = $("#canvasStage");
  stage.addEventListener("pointerdown", beginManualRegion);
  stage.addEventListener("pointermove", drawManualRegion);
  stage.addEventListener("pointermove", showPointer);
  stage.addEventListener("pointerup", commitManualRegion);
  stage.addEventListener("pointerleave", (event) => { if (state.drawing || state.resizing) commitManualRegion(event); });
  stage.addEventListener("pointercancel", commitManualRegion);
  stage.addEventListener("wheel", zoomSourceWithWheel, { passive: false });
  ["dragenter", "dragover"].forEach((type) => stage.addEventListener(type, (event) => { event.preventDefault(); stage.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((type) => stage.addEventListener(type, (event) => { event.preventDefault(); stage.classList.remove("dragging"); }));
  stage.addEventListener("drop", (event) => { const [file] = event.dataTransfer.files; if (file?.type.startsWith("image/")) importImage(file); else toast("请拖入 PNG、WebP、GIF 或 JPEG 图片。", "error"); });
  document.addEventListener("keydown", (event) => { if (event.target.matches("input,select")) return; if (event.key.toLowerCase() === "a") detectRegions(); if (event.key === "Delete") deleteSelectedRegion(); });
}

function showProjectStartDialog() {
  $("#projectStartDialog").hidden = false;
  $("#canvasSetupDialog").hidden = true;
}
function dismissProjectStartDialogs() {
  $("#projectStartDialog").hidden = true;
  $("#canvasSetupDialog").hidden = true;
}
async function createCanvasProject(openDrawing = true) {
  const width = Math.max(1, Math.min(4096, Number($("#newCanvasWidth").value) || 64));
  const height = Math.max(1, Math.min(4096, Number($("#newCanvasHeight").value) || 64));
  await clearLaunchDrafts();
  initializeBlankSource();
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  sourceContext.clearRect(0, 0, width, height);
  state.sourceName = `空白画布 ${width} x ${height}`;
  state.sourceData = sourceCanvas.toDataURL("image/png");
  $("#projectName").value = "未命名贴图工程";
  markDirty();
  state.canvasSetupForDrawing = false;
  dismissProjectStartDialogs();
  refreshUI();
  if (openDrawing) { await goToEditor(true); return; }
  toast(`已创建 ${width} x ${height} 透明画布。导入贴图时会自动匹配图片尺寸。`);
}
async function startImageImport() {
  await clearLaunchDrafts();
  initializeBlankSource();
  $("#projectName").value = "未命名贴图工程";
  dismissProjectStartDialogs();
  $("#imageInput").click();
}
function alignmentDimensions(useMobile = false) {
  const widthField = useMobile ? "#mobileAlignmentWidth" : "#alignmentWidth";
  const heightField = useMobile ? "#mobileAlignmentHeight" : "#alignmentHeight";
  return {
    width: Math.max(1, Math.min(4096, Number($(widthField).value) || 240)),
    height: Math.max(1, Math.min(4096, Number($(heightField).value) || 240))
  };
}
function openAlignmentDialog() {
  const dimensions = state.alignment || alignmentDimensions();
  $("#mobileAlignmentWidth").value = dimensions.width;
  $("#mobileAlignmentHeight").value = dimensions.height;
  $("#alignmentDialog").hidden = false;
}
function setAlignmentReference(useMobile = false) {
  const region = selectedRegion();
  if (!region || selectedFrame()) { toast("请先在原图上选中完整立绘的候选框，再设为基准。", "error"); return; }
  const { width, height } = alignmentDimensions(useMobile);
  state.alignment = { referenceRegionId: region.id, width, height };
  $("#alignmentWidth").value = width;
  $("#alignmentHeight").value = height;
  $("#alignmentDialog").hidden = true;
  markDirty();
  refreshUI();
  toast(`已将 ${region.name} 设为基准，拆出时会对齐到 ${width} x ${height} 画布。`);
}

function drawDemoSource() {
  sourceCanvas.width = 288;
  sourceCanvas.height = 176;
  sourceContext.clearRect(0, 0, 288, 176);
  ["#18c7b5", "#b5df5b", "#f0a25a", "#e77d76"].forEach((color, index) => drawDemoSprite(sourceContext, 24 + index * 67, 54, color, index));
  state.sourceData = sourceCanvas.toDataURL("image/png");
}

function drawDemoSprite(ctx, x, y, mainColor, pose) {
  const outline = "#182824", shade = "#38605b", light = "#f1f7ed", foot = pose % 2 ? 4 : 0;
  ctx.fillStyle = outline;
  ctx.fillRect(x + 12, y, 24, 5); ctx.fillRect(x + 8, y + 5, 32, 27); ctx.fillRect(x + 12, y + 32, 24, 24);
  ctx.fillRect(x + 3, y + 34, 9, 16); ctx.fillRect(x + 36, y + 34, 9, 16); ctx.fillRect(x + 14 - foot, y + 56, 10, 10); ctx.fillRect(x + 28 + foot, y + 56, 10, 10);
  ctx.fillStyle = mainColor;
  ctx.fillRect(x + 13, y + 5, 21, 20); ctx.fillRect(x + 12, y + 29, 24, 23); ctx.fillRect(x + 5, y + 37, 7, 9); ctx.fillRect(x + 36, y + 37, 7, 9);
  ctx.fillStyle = shade; ctx.fillRect(x + 12, y + 45, 24, 7); ctx.fillRect(x + 13, y + 9, 5, 16);
  ctx.fillStyle = light; ctx.fillRect(x + 24, y + 10, 5, 5); ctx.fillRect(x + 30, y + 10, 3, 3); ctx.fillRect(x + 19, y + 34, 10, 4);
  ctx.fillStyle = outline; ctx.fillRect(x + 14 - foot, y + 63, 13, 3); ctx.fillRect(x + 27 + foot, y + 63, 13, 3);
}

function importImage(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => { setSourceImage(image, file.name); refreshUI(); toast(`已导入 ${file.name}。可直接整张编辑，或在拆分页手动框选、自动识别后再拆出。`); };
    image.onerror = () => toast("无法读取该图片。", "error");
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function setSourceImage(image, name) {
  sourceCanvas.width = image.naturalWidth || image.width;
  sourceCanvas.height = image.naturalHeight || image.height;
  sourceContext.imageSmoothingEnabled = false;
  sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
  sourceContext.drawImage(image, 0, 0);
  state.sourceName = name;
  state.sourceData = sourceCanvas.toDataURL("image/png");
  if (state.zoomFrame) window.cancelAnimationFrame(state.zoomFrame);
  state.zoomFrame = 0;
  state.zoom = 1;
  state.zoomTarget = 1;
  state.frames = [];
  state.selectedFrame = -1;
  state.regions = [];
  state.selectedRegion = -1;
  state.alignment = null;
  state.regionHistory = [];
  state.regionFuture = [];
  markDirty();
}

function clearSource() {
  sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
  state.sourceName = "未导入源贴图";
  state.sourceData = "";
  state.regions = [];
  state.frames = [];
  state.selectedRegion = -1;
  state.selectedFrame = -1;
  state.alignment = null;
  state.regionHistory = [];
  state.regionFuture = [];
  markDirty();
  refreshUI();
}

function setSliceMode(mode) {
  state.sliceMode = mode;
  $("#autoMode").classList.toggle("active", mode === "auto");
  $("#autoMode").setAttribute("aria-pressed", mode === "auto");
  $("#gridMode").classList.toggle("active", mode === "grid");
  $("#gridMode").setAttribute("aria-pressed", mode === "grid");
  $("#autoControls").classList.toggle("is-hidden", mode !== "auto");
  $("#gridControls").classList.toggle("is-hidden", mode !== "grid");
}

function syncScaleSelectors(event) {
  const value = event.target.value;
  $("#pngScale").value = value;
  $("#mobilePngScale").value = value;
}

function detectRegions() {
  if (!state.sourceData) { toast("请先导入待拆贴图。", "error"); return; }
  if (!sourceCanvas.width || !sourceCanvas.height) return;
  state.attachedFragments = 0;
  pushRegionHistory();
  state.regions = state.sliceMode === "grid" ? detectGrid() : detectComponents();
  state.selectedRegion = state.regions.length ? 0 : -1;
  state.frames = [];
  state.selectedFrame = -1;
  state.alignment = null;
  markDirty();
  refreshUI();
  const fragments = state.attachedFragments ? `，已合并 ${state.attachedFragments} 个邻近碎片` : "";
  toast(state.regions.length ? `已识别 ${state.regions.length} 个候选区域${fragments}。请继续人工精修候选框。` : "没有检测到可拆分区域。", state.regions.length ? "normal" : "error");
}

function detectComponents() {
  const { width, height } = sourceCanvas;
  const pixels = sourceContext.getImageData(0, 0, width, height).data;
  const visited = new Uint8Array(width * height);
  const regions = [];
  const minArea = Number($("#minArea").value);
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const start = y * width + x;
    if (visited[start] || pixels[start * 4 + 3] < 16) continue;
    const queue = [start];
    visited[start] = 1;
    let head = 0, minX = x, maxX = x, minY = y, maxY = y, count = 0;
    while (head < queue.length) {
      const point = queue[head++], px = point % width, py = Math.floor(point / width);
      count += 1; minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py);
      directions.forEach(([dx, dy]) => {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
        const next = ny * width + nx;
        if (!visited[next] && pixels[next * 4 + 3] >= 16) { visited[next] = 1; queue.push(next); }
      });
    }
    if (count >= minArea) regions.push({ ...makeRegion(minX, minY, maxX - minX + 1, maxY - minY + 1, "smart"), pixelCount: count });
  }
  const merged = $("#mergeNearbyEffects").checked ? mergeNearbyFragments(regions, minArea) : { regions, attached: 0 };
  state.attachedFragments = merged.attached;
  return merged.regions.sort((a, b) => (a.y - b.y) || (a.x - b.x)).map((region, index) => ({ ...region, name: frameName(index), pixelCount: undefined }));
}

function mergeNearbyFragments(regions, minArea) {
  const majorThreshold = Math.max(minArea * 3, 96);
  const initialMajor = regions.filter((region) => region.pixelCount >= majorThreshold).map((region) => ({ ...region }));
  const overlayResult = $("#mergeOverlappingBodies").checked ? mergeOverlappingBodies(initialMajor) : { regions: initialMajor, merged: 0 };
  const major = overlayResult.regions;
  const fragments = regions.filter((region) => region.pixelCount < majorThreshold).sort((a, b) => a.pixelCount - b.pixelCount);
  const standalone = [];
  let attached = overlayResult.merged;
  for (const fragment of fragments) {
    let closest = null;
    for (const candidate of major) {
      if (fragment.pixelCount > candidate.pixelCount * .35) continue;
      const gap = rectangleGap(fragment, candidate);
      const allowance = Math.max(4, Math.min(16, Math.round(Math.sqrt(candidate.pixelCount) * .18)));
      if (gap <= allowance && (!closest || gap < closest.gap)) closest = { candidate, gap };
    }
    if (!closest) { standalone.push(fragment); continue; }
    const target = closest.candidate;
    const right = Math.max(target.x + target.width, fragment.x + fragment.width);
    const bottom = Math.max(target.y + target.height, fragment.y + fragment.height);
    target.x = Math.min(target.x, fragment.x);
    target.y = Math.min(target.y, fragment.y);
    target.width = right - target.x;
    target.height = bottom - target.y;
    target.pixelCount += fragment.pixelCount;
    attached += 1;
  }
  return { regions: [...major, ...standalone], attached };
}
function mergeOverlappingBodies(regions) {
  const bodies = regions.map((region) => ({ ...region }));
  let merged = 0;
  let didMerge = true;
  while (didMerge) {
    didMerge = false;
    outer: for (let first = 0; first < bodies.length; first += 1) for (let second = first + 1; second < bodies.length; second += 1) {
      if (!overlappingBodyParts(bodies[first], bodies[second])) continue;
      const a = bodies[first], b = bodies[second];
      const right = Math.max(a.x + a.width, b.x + b.width);
      const bottom = Math.max(a.y + a.height, b.y + b.height);
      a.x = Math.min(a.x, b.x); a.y = Math.min(a.y, b.y);
      a.width = right - a.x; a.height = bottom - a.y; a.pixelCount += b.pixelCount;
      bodies.splice(second, 1);
      merged += 1;
      didMerge = true;
      break outer;
    }
  }
  return { regions: bodies, merged };
}
function overlappingBodyParts(first, second) {
  const horizontal = Math.max(0, Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x));
  const vertical = Math.max(0, Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y));
  if (horizontal > 0 && vertical > 0) return true;
  const gap = rectangleGap(first, second);
  const horizontalRatio = horizontal / Math.max(1, Math.min(first.width, second.width));
  const verticalRatio = vertical / Math.max(1, Math.min(first.height, second.height));
  return gap <= 2 && (horizontalRatio >= .65 || verticalRatio >= .65);
}
function rectangleGap(first, second) {
  const horizontal = Math.max(0, first.x - (second.x + second.width), second.x - (first.x + first.width));
  const vertical = Math.max(0, first.y - (second.y + second.height), second.y - (first.y + first.height));
  return Math.hypot(horizontal, vertical);
}

function detectGrid() {
  const columns = Math.max(1, Number($("#gridCols").value));
  const rows = Math.max(1, Number($("#gridRows").value));
  const width = Math.floor(sourceCanvas.width / columns);
  const height = Math.floor(sourceCanvas.height / rows);
  const pixels = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
  const regions = [];
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
    const region = makeRegion(column * width, row * height, width, height, "grid");
    if (hasPixels(region, pixels)) regions.push(region);
  }
  return regions.map((region, index) => ({ ...region, name: frameName(index) }));
}

function hasPixels(region, pixels) {
  for (let y = region.y; y < region.y + region.height; y += 1) for (let x = region.x; x < region.x + region.width; x += 1) if (pixels[(y * sourceCanvas.width + x) * 4 + 3] >= 16) return true;
  return false;
}

function makeRegion(x, y, width, height, origin = "manual") { return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: frameName(state.regions.length), x, y, width, height, origin }; }
function frameName(index) { return `frame_${String(index + 1).padStart(2, "0")}`; }

function beginManualRegion(event) {
  if (event.button !== 0) return;
  const point = sourcePoint(event);
  if (event.pointerType === "touch") {
    state.touchPoints.set(event.pointerId, point);
    if (state.touchPoints.size === 2) {
      state.drawing = false;
      state.draft = null;
      state.resizing = null;
      state.panning = null;
      $("#canvasStage").classList.remove("is-panning-active");
      beginSourceGesture();
      event.preventDefault();
      return;
    }
  }
  if (state.panMode) {
    beginSourcePan(event);
    return;
  }
  const resizeHandle = resizeHandleAt(point);
  if (resizeHandle) {
    const region = selectedRegion();
    state.resizing = { pointerId: event.pointerId, handle: resizeHandle, start: point, region: { ...region }, historyRecorded: false };
    $("#canvasStage").setPointerCapture(event.pointerId);
    event.preventDefault();
    return;
  }
  const hitIndex = event.shiftKey ? -1 : state.regions.map((region, index) => ({ region, index })).reverse().find(({ region }) => point.x >= region.x && point.x < region.x + region.width && point.y >= region.y && point.y < region.y + region.height)?.index;
  if (hitIndex !== undefined && hitIndex >= 0) { state.selectedRegion = hitIndex; state.selectedFrame = -1; refreshUI(); return; }
  state.drawing = true;
  state.start = point;
  state.draft = { x: point.x, y: point.y, width: 1, height: 1 };
  $("#canvasStage").setPointerCapture(event.pointerId);
  renderOverlay();
}

function drawManualRegion(event) {
  const point = sourcePoint(event);
  if (event.pointerType === "touch") {
    state.touchPoints.set(event.pointerId, point);
    if (state.gesture) {
      updateSourceGesture();
      event.preventDefault();
      return;
    }
  }
  if (state.panning?.pointerId === event.pointerId) {
    updateSourcePan(event);
    event.preventDefault();
    return;
  }
  if (state.resizing) {
    resizeSelectedRegion(point);
    event.preventDefault();
    return;
  }
  if (state.drawing) { state.draft = normalizedRect(state.start, point); renderOverlay(); }
}
function commitManualRegion(event) {
  if (event.pointerType === "touch") {
    state.touchPoints.delete(event.pointerId);
    if (state.gesture || state.touchPoints.size) {
      state.gesture = null;
      state.drawing = false;
      state.draft = null;
      renderOverlay();
      if ($("#canvasStage").hasPointerCapture(event.pointerId)) $("#canvasStage").releasePointerCapture(event.pointerId);
      return;
    }
  }
  if (state.panning?.pointerId === event.pointerId) {
    state.panning = null;
    $("#canvasStage").classList.remove("is-panning-active");
    if ($("#canvasStage").hasPointerCapture(event.pointerId)) $("#canvasStage").releasePointerCapture(event.pointerId);
    return;
  }
  if (state.resizing) {
    state.resizing = null;
    refreshUI();
    if ($("#canvasStage").hasPointerCapture(event.pointerId)) $("#canvasStage").releasePointerCapture(event.pointerId);
    return;
  }
  if (!state.drawing) return;
  state.drawing = false;
  const region = clampRegion(state.draft);
  state.draft = null;
  if (region.width > 1 && region.height > 1) {
    pushRegionHistory();
    state.regions.push({ ...makeRegion(region.x, region.y, region.width, region.height, "manual"), name: frameName(state.regions.length) });
    state.selectedRegion = state.regions.length - 1;
    state.selectedFrame = -1;
    state.frames = [];
    markDirty();
    toast("已添加手动选区。可在右侧精确修改像素坐标。", "normal");
  }
  renderOverlay();
  refreshUI();
  if ($("#canvasStage").hasPointerCapture(event.pointerId)) $("#canvasStage").releasePointerCapture(event.pointerId);
}
function normalizedRect(start, end) { return { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x) + 1, height: Math.abs(end.y - start.y) + 1 }; }
function setPanMode(enabled) {
  state.panMode = enabled;
  state.panning = null;
  $("#panCanvasButton").classList.toggle("active", enabled);
  $("#panCanvasButton").setAttribute("aria-pressed", String(enabled));
  $("#mobilePanCanvas").classList.toggle("active", enabled);
  $("#mobilePanCanvas").setAttribute("aria-pressed", String(enabled));
  selectionCanvas.style.cursor = enabled ? "grab" : "crosshair";
}
function beginSourcePan(event) {
  const workspace = $("#workspace");
  state.panning = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, scrollLeft: workspace.scrollLeft, scrollTop: workspace.scrollTop };
  $("#canvasStage").setPointerCapture(event.pointerId);
  $("#canvasStage").classList.add("is-panning-active");
  event.preventDefault();
}
function updateSourcePan(event) {
  const pan = state.panning;
  if (!pan) return;
  const workspace = $("#workspace");
  workspace.scrollLeft = pan.scrollLeft - (event.clientX - pan.x);
  workspace.scrollTop = pan.scrollTop - (event.clientY - pan.y);
}
function sourcePoint(event) { const box = sourceView.getBoundingClientRect(); return { x: Math.max(0, Math.min(sourceCanvas.width - 1, Math.floor((event.clientX - box.left) * sourceCanvas.width / box.width))), y: Math.max(0, Math.min(sourceCanvas.height - 1, Math.floor((event.clientY - box.top) * sourceCanvas.height / box.height))) }; }
function resizeHandleAt(point) {
  const region = selectedRegion();
  if (!region || selectedFrame()) return null;
  const radius = Math.max(2, Math.ceil(8 / state.zoom));
  const corners = { nw: [region.x, region.y], ne: [region.x + region.width - 1, region.y], se: [region.x + region.width - 1, region.y + region.height - 1], sw: [region.x, region.y + region.height - 1] };
  return Object.entries(corners).find(([, [x, y]]) => Math.abs(point.x - x) <= radius && Math.abs(point.y - y) <= radius)?.[0] || null;
}
function resizeSelectedRegion(point) {
  const resize = state.resizing;
  if (!resize) return;
  const original = resize.region;
  let left = original.x, top = original.y, right = original.x + original.width - 1, bottom = original.y + original.height - 1;
  if (resize.handle.includes("w")) left = Math.max(0, Math.min(right - 1, point.x));
  if (resize.handle.includes("e")) right = Math.min(sourceCanvas.width - 1, Math.max(left + 1, point.x));
  if (resize.handle.includes("n")) top = Math.max(0, Math.min(bottom - 1, point.y));
  if (resize.handle.includes("s")) bottom = Math.min(sourceCanvas.height - 1, Math.max(top + 1, point.y));
  const next = { ...original, x: left, y: top, width: right - left + 1, height: bottom - top + 1, origin: "manual" };
  const changed = next.x !== selectedRegion().x || next.y !== selectedRegion().y || next.width !== selectedRegion().width || next.height !== selectedRegion().height;
  if (!changed) return;
  if (!resize.historyRecorded) { pushRegionHistory(); resize.historyRecorded = true; }
  state.regions[state.selectedRegion] = next;
  state.frames = [];
  state.selectedFrame = -1;
  markDirty();
  refreshUI();
}
function showPointer(event) {
  const point = sourcePoint(event);
  $("#pointerReadout").textContent = `x: ${String(point.x).padStart(3, "0")}  y: ${String(point.y).padStart(3, "0")}`;
  const handle = resizeHandleAt(point);
  selectionCanvas.style.cursor = handle === "nw" || handle === "se" ? "nwse-resize" : handle ? "nesw-resize" : "crosshair";
}
function clampRegion(region) { const x = Math.max(0, Math.min(sourceCanvas.width - 1, Math.round(region.x))); const y = Math.max(0, Math.min(sourceCanvas.height - 1, Math.round(region.y))); return { ...region, x, y, width: Math.max(1, Math.min(sourceCanvas.width - x, Math.round(region.width))), height: Math.max(1, Math.min(sourceCanvas.height - y, Math.round(region.height))) }; }

function beginSourceGesture() {
  const [first, second] = [...state.touchPoints.values()];
  const workspace = $("#workspace");
  state.gesture = { distance: pointDistance(first, second), zoom: state.zoomTarget, center: pointCenter(first, second), scrollLeft: workspace.scrollLeft, scrollTop: workspace.scrollTop };
}
function updateSourceGesture() {
  const [first, second] = [...state.touchPoints.values()];
  if (!first || !second || !state.gesture) return;
  const distance = pointDistance(first, second);
  const center = pointCenter(first, second);
  const nextZoom = state.gesture.zoom * Math.pow(distance / state.gesture.distance, .45);
  setZoom(nextZoom, true);
  const workspace = $("#workspace");
  workspace.scrollLeft = state.gesture.scrollLeft - (center.x - state.gesture.center.x) * state.zoomTarget;
  workspace.scrollTop = state.gesture.scrollTop - (center.y - state.gesture.center.y) * state.zoomTarget;
}
function pointDistance(first, second) { return Math.hypot(second.x - first.x, second.y - first.y) || 1; }
function pointCenter(first, second) { return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }; }
function zoomSourceWithWheel(event) {
  if (!event.deltaY) return;
  event.preventDefault();
  setZoom(state.zoomTarget * Math.exp(-normalizedWheelDelta(event) * .00022), true);
}
function normalizedWheelDelta(event) {
  const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? 240 : 1;
  return Math.max(-120, Math.min(120, event.deltaY * unit));
}

function renderSource() {
  sourceView.width = sourceCanvas.width || 1;
  sourceView.height = sourceCanvas.height || 1;
  selectionCanvas.width = sourceView.width;
  selectionCanvas.height = sourceView.height;
  sourceViewContext.imageSmoothingEnabled = false;
  sourceViewContext.clearRect(0, 0, sourceView.width, sourceView.height);
  sourceViewContext.drawImage(sourceCanvas, 0, 0);
  const cssWidth = `${sourceView.width * state.zoom}px`;
  const cssHeight = `${sourceView.height * state.zoom}px`;
  $("#canvasStage").style.width = cssWidth;
  $("#canvasStage").style.height = cssHeight;
  sourceView.style.width = cssWidth;
  sourceView.style.height = cssHeight;
  selectionCanvas.style.width = cssWidth;
  selectionCanvas.style.height = cssHeight;
  $("#zoomReset").value = String(Math.round(state.zoom * 100));
  $("#emptyCanvasPrompt").hidden = Boolean(state.sourceData);
  renderOverlay();
}

function renderOverlay() {
  selectionContext.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
  state.regions.forEach((region, index) => {
    const selected = index === state.selectedRegion;
    drawRegion(region, selected, index);
    if (selected && !selectedFrame()) drawResizeHandles(region);
  });
  if (state.draft) drawRegion(state.draft, true, null, true);
}
function drawRegion(region, selected, index, isDraft = false) {
  const scale = 1 / state.zoom;
  selectionContext.save();
  selectionContext.lineWidth = Math.max(.6, scale);
  selectionContext.setLineDash(isDraft ? [3 * scale, 2 * scale] : []);
  selectionContext.strokeStyle = selected ? "#18c8b4" : region.origin === "smart" ? "#b4db5d" : "#f0a25a";
  selectionContext.fillStyle = selected ? "#18c8b422" : "#b4db5d14";
  selectionContext.fillRect(region.x, region.y, region.width, region.height);
  selectionContext.strokeRect(region.x + scale / 2, region.y + scale / 2, Math.max(0, region.width - scale), Math.max(0, region.height - scale));
  selectionContext.restore();
}
function drawResizeHandles(region) {
  const size = Math.max(2, Math.ceil(8 / state.zoom));
  const offset = size / 2;
  const corners = [[region.x, region.y], [region.x + region.width - 1, region.y], [region.x + region.width - 1, region.y + region.height - 1], [region.x, region.y + region.height - 1]];
  selectionContext.save();
  selectionContext.fillStyle = "#eafff7";
  selectionContext.strokeStyle = "#18c8b4";
  selectionContext.lineWidth = Math.max(.75, 1 / state.zoom);
  corners.forEach(([x, y]) => { selectionContext.fillRect(x - offset, y - offset, size, size); selectionContext.strokeRect(x - offset, y - offset, size, size); });
  selectionContext.restore();
}

function refreshUI() {
  $("#sourceFileName").textContent = state.sourceName;
  $("#sourceSize").textContent = `${sourceCanvas.width || 0} × ${sourceCanvas.height || 0} px`;
  $("#regionCount").textContent = `${state.regions.length} 个待确认选区`;
  $("#resultsTitle").textContent = `${state.frames.length} 个独立帧`;
  renderSource();
  renderFrames();
  renderInspector();
  updateAlignmentUI();
  syncRegionHistoryUI();
  updateSaveState();
}
function updateAlignmentUI() {
  const reference = state.regions.find((region) => region.id === state.alignment?.referenceRegionId);
  if (state.alignment && reference) {
    $("#alignmentWidth").value = state.alignment.width;
    $("#alignmentHeight").value = state.alignment.height;
    $("#alignmentStatus").textContent = `基准：${reference.name}。拆出时透明内容会对齐到 ${state.alignment.width} x ${state.alignment.height} 画布。`;
  } else {
    $("#alignmentStatus").textContent = "不设置基准时按原选区尺寸切割。选中完整立绘后可填写任意基准画布大小。";
  }
}

function renderFrames() {
  const strip = $("#frameStrip");
  strip.innerHTML = "";
  if (!state.frames.length) { const empty = document.createElement("div"); empty.className = "empty-frames"; empty.textContent = "确认选区后，点击“全部拆出”生成独立透明帧"; strip.append(empty); return; }
  state.frames.forEach((frame, index) => {
    const button = document.createElement("button");
    button.className = `frame-card ${index === state.selectedFrame ? "active" : ""}`;
    button.type = "button";
    const label = document.createElement("span"); label.className = "frame-index"; label.textContent = String(index + 1).padStart(2, "0");
    const canvas = document.createElement("canvas"); drawThumbnail(canvas, frame);
    const name = document.createElement("span"); name.textContent = frame.name;
    const size = document.createElement("small"); size.textContent = `${frame.width} × ${frame.height}`;
    button.append(label, canvas, name, size);
    button.addEventListener("click", () => { state.selectedFrame = index; refreshUI(); });
    strip.append(button);
  });
}

function drawThumbnail(canvas, frame) {
  canvas.width = 78; canvas.height = 65;
  const context = canvas.getContext("2d"); context.imageSmoothingEnabled = false;
  const image = new Image();
  image.onload = () => { const ratio = Math.min(canvas.width / frame.width, canvas.height / frame.height), width = Math.max(1, Math.floor(frame.width * ratio)), height = Math.max(1, Math.floor(frame.height * ratio)); context.drawImage(image, Math.floor((canvas.width - width) / 2), Math.floor((canvas.height - height) / 2), width, height); };
  image.src = frame.data;
}

function selectedRegion() { return state.regions[state.selectedRegion]; }
function selectedFrame() { return state.frames[state.selectedFrame]; }

function renderInspector() {
  const frame = selectedFrame(), region = selectedRegion(), useFrame = Boolean(frame);
  $("#inspectorTitle").textContent = useFrame ? "独立帧" : "选区属性";
  $("#regionFields").classList.toggle("is-hidden", useFrame || !region);
  if (!frame && !region) {
    $("#itemBadge").textContent = "--";
    $("#itemName").value = "";
    $("#itemName").disabled = true;
    $("#itemMeta").textContent = "请在原图上拖动，或先运行自动识别。";
    previewContext.clearRect(0, 0, 144, 144);
    return;
  }
  const item = frame || region;
  $("#itemBadge").textContent = useFrame ? `${String(state.selectedFrame + 1).padStart(2, "0")} / ${String(state.frames.length).padStart(2, "0")}` : `${String(state.selectedRegion + 1).padStart(2, "0")} / ${String(state.regions.length).padStart(2, "0")}`;
  $("#itemName").disabled = false;
  $("#itemName").value = item.name;
  if (region && !useFrame) {
    $("#regionX").value = region.x; $("#regionY").value = region.y; $("#regionWidth").value = region.width; $("#regionHeight").value = region.height;
    $("#itemMeta").textContent = `${originLabel(region.origin)}，${region.width} × ${region.height} px。`;
    drawRegionPreview(region);
  } else {
    $("#itemMeta").textContent = `透明独立帧，${frame.width} × ${frame.height} px。`;
    drawFramePreview(frame);
  }
}

function originLabel(origin) { return origin === "smart" ? "智能识别候选框" : origin === "grid" ? "网格识别候选框" : "手动矩形选区"; }
function drawRegionPreview(region) {
  previewCanvas.width = 144; previewCanvas.height = 144; previewContext.clearRect(0, 0, 144, 144); previewContext.imageSmoothingEnabled = false;
  const scale = Math.min(144 / region.width, 144 / region.height), width = Math.max(1, Math.floor(region.width * scale)), height = Math.max(1, Math.floor(region.height * scale));
  previewContext.drawImage(sourceCanvas, region.x, region.y, region.width, region.height, Math.floor((144 - width) / 2), Math.floor((144 - height) / 2), width, height);
}
function drawFramePreview(frame) {
  const image = new Image();
  image.onload = () => { previewCanvas.width = 144; previewCanvas.height = 144; previewContext.clearRect(0, 0, 144, 144); const scale = Math.min(144 / frame.width, 144 / frame.height), width = Math.max(1, Math.floor(frame.width * scale)), height = Math.max(1, Math.floor(frame.height * scale)); previewContext.imageSmoothingEnabled = false; previewContext.drawImage(image, Math.floor((144 - width) / 2), Math.floor((144 - height) / 2), width, height); };
  image.src = frame.data;
}

function updateItemName() { const item = selectedFrame() || selectedRegion(); if (!item) return; item.name = $("#itemName").value.trim() || "untitled_frame"; markDirty(); renderFrames(); }
function updateRegionFromFields() {
  const region = selectedRegion();
  if (!region || selectedFrame()) return;
  pushRegionHistory();
  Object.assign(region, clampRegion({ ...region, x: Number($("#regionX").value), y: Number($("#regionY").value), width: Number($("#regionWidth").value), height: Number($("#regionHeight").value) }));
  state.frames = [];
  state.selectedFrame = -1;
  markDirty();
  refreshUI();
}
function clearRegions() { if (!state.regions.length) return; pushRegionHistory(); state.regions = []; state.selectedRegion = -1; state.frames = []; state.selectedFrame = -1; state.alignment = null; markDirty(); refreshUI(); }
function deleteSelectedRegion() { if (selectedFrame() || state.selectedRegion < 0) return; const removed = selectedRegion(); pushRegionHistory(); state.regions.splice(state.selectedRegion, 1); if (removed?.id === state.alignment?.referenceRegionId) state.alignment = null; state.selectedRegion = Math.min(state.selectedRegion, state.regions.length - 1); state.frames = []; markDirty(); refreshUI(); }
function regionSnapshot() { return { regions: state.regions.map((region) => ({ ...region })), selectedRegion: state.selectedRegion }; }
function pushRegionHistory() {
  state.regionHistory.push(regionSnapshot());
  if (state.regionHistory.length > 30) state.regionHistory.shift();
  state.regionFuture = [];
}
function restoreRegionSnapshot(snapshot) {
  state.regions = snapshot.regions.map((region) => ({ ...region }));
  state.selectedRegion = snapshot.selectedRegion >= 0 ? Math.min(snapshot.selectedRegion, state.regions.length - 1) : -1;
  state.frames = [];
  state.selectedFrame = -1;
  markDirty();
  refreshUI();
}
function undoRegions() {
  if (!state.regionHistory.length) { toast("没有可撤销的选区操作。", "error"); return; }
  state.regionFuture.push(regionSnapshot());
  restoreRegionSnapshot(state.regionHistory.pop());
  toast("已撤销选区操作。");
}
function redoRegions() {
  if (!state.regionFuture.length) { toast("没有可重做的选区操作。", "error"); return; }
  state.regionHistory.push(regionSnapshot());
  restoreRegionSnapshot(state.regionFuture.pop());
  toast("已重做选区操作。");
}
function syncRegionHistoryUI() {
  ["#undoSplit", "#mobileUndoSplit"].forEach((selector) => { $(selector).disabled = !state.regionHistory.length; });
  ["#redoSplit", "#mobileRedoSplit"].forEach((selector) => { $(selector).disabled = !state.regionFuture.length; });
}
function setZoom(value, animated = false) {
  state.zoomTarget = Math.max(.25, Math.min(8, value));
  if (!animated) {
    if (state.zoomFrame) window.cancelAnimationFrame(state.zoomFrame);
    state.zoomFrame = 0;
    state.zoom = state.zoomTarget;
    renderSource();
    return;
  }
  if (state.zoomFrame) return;
  const animate = () => {
    const remaining = state.zoomTarget - state.zoom;
    if (Math.abs(remaining) < .004) {
      state.zoom = state.zoomTarget;
      state.zoomFrame = 0;
      renderSource();
      return;
    }
    state.zoom += remaining * .28;
    renderSource();
    state.zoomFrame = window.requestAnimationFrame(animate);
  };
  state.zoomFrame = window.requestAnimationFrame(animate);
}
function updateZoomFromField(event) {
  setZoom((Number(event.currentTarget.value) || 100) / 100);
}

function splitAllRegions() {
  if (!state.regions.length) { toast("请先在原图上添加或识别至少一个选区。", "error"); return false; }
  state.frames = state.regions.map((region, index) => frameFromRegion(region, index));
  state.selectedFrame = 0;
  markDirty();
  refreshUI();
  toast(state.alignment ? `已按基准对齐拆出 ${state.frames.length} 个 ${state.alignment.width} x ${state.alignment.height} 透明 PNG 帧。` : `已从原图无损拆出 ${state.frames.length} 个透明 PNG 帧。`);
  return true;
}
function frameFromRegion(region, index) {
  const alignment = alignmentSettings();
  const canvas = document.createElement("canvas");
  canvas.width = alignment?.width || region.width; canvas.height = alignment?.height || region.height;
  const context = canvas.getContext("2d"); context.imageSmoothingEnabled = false;
  if (!alignment) context.drawImage(sourceCanvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
  else {
    const referenceBounds = opaqueBounds(alignment.reference);
    const regionBounds = opaqueBounds(region);
    const targetX = Math.floor((canvas.width - referenceBounds.width) / 2);
    const targetY = Math.floor((canvas.height - referenceBounds.height) / 2);
    context.drawImage(sourceCanvas, region.x, region.y, region.width, region.height, targetX - regionBounds.x, targetY - regionBounds.y, region.width, region.height);
  }
  return { id: region.id, name: region.name || frameName(index), data: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
}
function alignmentSettings() {
  if (!state.alignment) return null;
  const reference = state.regions.find((region) => region.id === state.alignment.referenceRegionId);
  return reference ? { ...state.alignment, reference } : null;
}
function opaqueBounds(region) {
  const pixels = sourceContext.getImageData(region.x, region.y, region.width, region.height).data;
  let minX = region.width, minY = region.height, maxX = -1, maxY = -1;
  for (let y = 0; y < region.height; y += 1) for (let x = 0; x < region.width; x += 1) {
    if (pixels[(y * region.width + x) * 4 + 3] < 16) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return maxX < 0 ? { x: 0, y: 0, width: region.width, height: region.height } : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}
function ensureFrames() { return state.frames.length || splitAllRegions(); }

async function exportSelectedPng() {
  if (!state.frames.length || !selectedFrame()) { toast("请先点击“全部拆出”，再从下方选择要导出的帧。", "error"); return; }
  const scale = Number($("#pngScale").value);
  const canvas = await frameCanvas(selectedFrame(), scale);
  try {
    const destination = await downloadBlob(await canvasToBlob(canvas), `${safeName(selectedFrame().name)}_x${scale}.png`);
    toast(destination === "gallery" ? `透明 PNG X${scale} 已保存到相册。` : `透明 PNG X${scale} 已开始下载。`);
  } catch {
    toast("PNG 导出失败，请确认设备存储空间和权限。", "error");
  }
}
async function exportZip() {
  if (!ensureFrames()) return;
  if (!window.JSZip) { toast("压缩组件仍在加载，请稍后重试。", "error"); return; }
  const scale = Number($("#pngScale").value);
  toast(`正在压缩 X${scale} PNG 素材包...`);
  const zip = new JSZip();
  for (const [index, frame] of state.frames.entries()) {
    const canvas = await frameCanvas(frame, scale);
    zip.file(`${String(index + 1).padStart(2, "0")}_${safeName(frame.name)}_x${scale}.png`, canvas.toDataURL("image/png").split(",")[1], { base64: true });
  }
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  try {
    const destination = await downloadBlob(blob, `${safeName($("#projectName").value)}_x${scale}_frames.zip`);
    toast(destination === "downloads" ? "PNG 素材包已保存到下载目录。" : "PNG 素材包已准备完成。");
  } catch {
    toast("素材包导出失败，请确认设备存储空间和权限。", "error");
  }
}

function frameCanvas(frame, scale = 1) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => { const canvas = document.createElement("canvas"); canvas.width = frame.width * scale; canvas.height = frame.height * scale; const context = canvas.getContext("2d"); context.imageSmoothingEnabled = false; context.drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas); };
    image.src = frame.data;
  });
}

function projectData() { return { format: "PixelDecomposer", version: 3, name: $("#projectName").value.trim() || "未命名贴图工程", source: { name: state.sourceName, data: state.sourceData }, regions: state.regions, frames: state.frames, palette: state.palette, alignment: state.alignment }; }
async function saveProject() {
  const project = projectData();
  try {
    const destination = await downloadBlob(new Blob([JSON.stringify(project)], { type: "application/json" }), `${safeName(project.name)}.pdec`);
    state.dirty = false;
    updateSaveState();
    toast(destination === "downloads" ? "工程文件已保存到下载目录。" : "工程文件已保存，包含原图、选区和已拆出的帧。 ");
    return true;
  } catch {
    toast("工程文件导出失败，请确认设备存储空间和权限。", "error");
    return false;
  }
}
function importProject(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const project = JSON.parse(reader.result);
      if (project.format !== "PixelDecomposer") throw new Error("invalid");
      applyProjectData(project, () => { dismissProjectStartDialogs(); toast("工程已打开，可继续调整选区或进入 GIF 页面。 "); });
    } catch { toast("这不是可读取的 Pixel Decomposer 工程文件。", "error"); }
  };
  reader.readAsText(file);
}
async function goToGif() {
  try { const project = projectData(); await saveWorkspaceDraft("pixel-decomposer-gif-draft", { ...project, frames: [], gifSourceFrames: project.frames, gifSelectionRequired: true, _transientDirty: state.dirty }); PixelProjectLifecycle?.allowNavigation?.(); window.location.href = "gif.html?from=split"; }
  catch { toast("无法在本地传递帧数据，请先保存工程文件后在 GIF 页面打开。", "error"); }
}

async function goToEditor(forceSourceMode = false) {
  const editSource = forceSourceMode || !state.frames.length;
  if (editSource && !state.sourceData) {
    state.canvasSetupForDrawing = true;
    $("#projectStartDialog").hidden = true;
    $("#canvasSetupDialog").hidden = false;
    $("#createCanvasAndDraw").focus();
    return;
  }
  const project = projectData();
  if (editSource) {
    const sourceFrameId = `source-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    project.editorMode = "source";
    project.sourceEditFrameId = sourceFrameId;
    project.sourceEditOriginalSize = { width: sourceCanvas.width, height: sourceCanvas.height };
    project.frames = [{ id: sourceFrameId, name: state.sourceName.replace(/\.[^.]+$/, "") || "source_canvas", data: state.sourceData, width: sourceCanvas.width, height: sourceCanvas.height }];
  }
  try { await saveWorkspaceDraft("pixel-decomposer-editor-draft", { ...project, _transientDirty: state.dirty }); PixelProjectLifecycle?.allowNavigation?.(); window.location.href = "editor.html?from=split"; }
  catch { toast("无法在本地传递帧数据，请先保存工程文件后在编辑页面打开。", "error"); }
}

async function goToSettings() {
  try {
    await saveWorkspaceDraft("pixel-decomposer-editor-return", { ...projectData(), _transientDirty: state.dirty });
    PixelProjectLifecycle?.allowNavigation?.();
    window.location.href = "settings.html?return=split";
  } catch { toast("无法保留当前工程，请先保存工程文件。", "error"); }
}

async function restoreEditorReturn() {
  try {
    const project = await takeWorkspaceDraft("pixel-decomposer-editor-return");
    if (!project) return false;
    applyProjectData(project, () => { dismissProjectStartDialogs(); toast("已载入当前工程。", "normal"); }, true);
    return true;
  } catch { return false; }
}

async function saveWorkspaceDraft(key, project) {
  if (window.PixelWorkspaceTransfer) {
    try { await window.PixelWorkspaceTransfer.save(key, project); sessionStorage.removeItem(key); localStorage.removeItem(key); return; }
    catch { /* Fall back to Web Storage for browsers without IndexedDB. */ }
  }
  sessionStorage.setItem(key, JSON.stringify(project));
}
async function takeWorkspaceDraft(key) {
  if (window.PixelWorkspaceTransfer) {
    try {
      const project = await window.PixelWorkspaceTransfer.take(key);
      if (project) { sessionStorage.removeItem(key); localStorage.removeItem(key); return typeof project === "string" ? JSON.parse(project) : project; }
    } catch { /* Read the legacy fallback below. */ }
  }
  const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
  if (!raw) return null;
  sessionStorage.removeItem(key); localStorage.removeItem(key);
  return JSON.parse(raw);
}

function applyProjectData(project, complete, preserveDirty = false) {
  state.sourceName = project.source?.name || "未命名源贴图";
  state.sourceData = project.source?.data || "";
  state.regions = Array.isArray(project.regions) ? project.regions : [];
  state.frames = Array.isArray(project.frames) ? project.frames : [];
  state.palette = Array.isArray(project.palette) ? project.palette.slice(0, 48) : [];
  state.alignment = project.alignment || null;
  state.selectedRegion = state.regions.length ? 0 : -1;
  state.selectedFrame = state.frames.length ? 0 : -1;
  $("#projectName").value = project.name || "未命名贴图工程";
  if (!state.sourceData) {
    sourceCanvas.width = 64; sourceCanvas.height = 64; sourceContext.clearRect(0, 0, 64, 64);
    state.dirty = preserveDirty ? Boolean(project._transientDirty) : false;
    refreshUI(); complete?.();
    return;
  }
  const image = new Image();
  image.onload = () => { sourceCanvas.width = image.width; sourceCanvas.height = image.height; sourceContext.clearRect(0, 0, image.width, image.height); sourceContext.drawImage(image, 0, 0); if (state.zoomFrame) window.cancelAnimationFrame(state.zoomFrame); state.zoomFrame = 0; state.zoom = 1; state.zoomTarget = 1; state.dirty = preserveDirty ? Boolean(project._transientDirty) : false; refreshUI(); complete?.(); };
  image.onerror = () => { sourceCanvas.width = 1; sourceCanvas.height = 1; refreshUI(); toast("工程内的源贴图无法读取。", "error"); };
  image.src = state.sourceData;
}

function markDirty() { state.dirty = true; updateSaveState(); }
function updateSaveState() { $("#saveState").textContent = state.dirty ? "有未保存更改" : "已保存"; }
function canvasToBlob(canvas) { return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("canvas export failed")), "image/png")); }
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
function safeName(value) { return (value || "pixel-art").replace(/[\\/:*?\"<>|]/g, "_").trim() || "pixel-art"; }
function toast(message, kind = "normal") { const element = $("#toast"); element.textContent = message; element.className = `toast visible ${kind === "error" ? "error" : ""}`; window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => element.classList.remove("visible"), 2700); }

init();
