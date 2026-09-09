"use strict";

(() => {
  const storageKey = "pixel-decomposer-language";
  const supported = new Set(["zh-CN", "ja", "en"]);
  const originalTitle = document.title;
  const dictionary = {
    "zh-CN": {},
    ja: {
      "设置": "設定", "界面语言": "表示言語", "中文": "中国語", "日文": "日本語", "英文": "英語", "选择 Pixel Decomposer 的显示语言": "Pixel Decomposerの表示言語を選択",
      "Pixel Decomposer - 贴图拆分": "Pixel Decomposer - スプライト分割", "Pixel Decomposer - 像素绘制": "Pixel Decomposer - ピクセル描画", "Pixel Decomposer - GIF 动作": "Pixel Decomposer - GIFアニメーション", "Pixel Decomposer - 设置": "Pixel Decomposer - 設定",
      "贴图拆分": "スプライト分割", "返回贴图拆分": "スプライト分割に戻る", "打开工程": "プロジェクトを開く", "保存工程": "プロジェクトを保存", "保存编排": "並びを保存",
      "编辑贴图": "スプライトを編集", "GIF 动作": "GIFアニメーション", "导出 GIF": "GIFを書き出す", "源贴图": "元スプライト", "导入贴图": "スプライトを読み込む",
      "尚未导入贴图": "スプライト未読み込み", "原图未修改": "元画像は変更されません", "候选帧识别": "フレーム検出", "智能识别": "自動検出", "网格识别": "グリッド検出",
      "最小像素面积": "最小ピクセル面積", "列": "列", "行": "行", "识别可拆分结构": "分割候補を検出", "手动优化": "手動調整", "清空全部选区": "選択範囲をすべて消去",
      "矩形选区": "矩形選択", "删除当前选区": "現在の範囲を削除", "撤销选区操作": "範囲操作を元に戻す", "重做选区操作": "範囲操作をやり直す", "全部拆出": "すべて分割",
      "拆分结果": "分割結果", "选区属性": "選択範囲", "名称": "名前", "左": "左", "上": "上", "宽": "幅", "高": "高さ", "交付素材": "書き出し",
      "像素倍率": "ピクセル倍率", "透明 PNG": "透過PNG", "PNG 素材包": "PNG素材パック", "GIF 动作编排": "GIFアニメーション編集", "播放预览": "プレビュー再生", "停止预览": "停止",
      "像素绘制": "ピクセル描画", "绘制工具": "描画ツール", "铅笔": "ペン", "橡皮": "消しゴム", "填充": "塗りつぶし", "取色": "スポイト", "自定义色卡": "カスタムパレット",
      "独立帧": "独立フレーム", "新建透明帧": "透明フレームを追加", "复制当前帧": "現在のフレームを複製", "删除选中帧": "選択フレームを削除", "多选帧": "複数選択",
      "撤销帧操作": "フレーム操作を元に戻す", "重做帧操作": "フレーム操作をやり直す", "导出透明 PNG": "透過PNGを書き出す", "帧顺序": "フレーム順", "统一设为 0.12 秒": "すべて0.12秒に設定",
      "循环": "ループ", "精度 0.01 秒": "精度 0.01秒", "动作节奏": "アニメーション設定", "总时长": "合計時間", "平均帧率": "平均フレームレート", "输出尺寸": "出力サイズ",
      "逐帧控制": "フレームごとの制御", "打开 .pdec 工程": ".pdecプロジェクトを開く", "GIF 像素倍率": "GIFピクセル倍率", "选择图片": "画像を選択", "工程名称": "プロジェクト名",
      "清除源贴图": "元スプライトを消去", "缩小": "縮小", "放大": "拡大", "重置缩放": "ズームをリセット", "下一帧": "次のフレーム", "设置": "設定", "色卡": "パレット", "移动": "移動", "导出": "書き出し", "画布 / 部件动画": "キャンバス / パーツアニメーション", "去除底色": "背景色を透明化", "导入图片帧": "画像フレームを読み込む", "选择拆分帧": "分割フレームを選択", "复制此帧": "このフレームを複製", "删除此帧": "このフレームを削除", "手绘运动路径：关": "手描きモーション：オフ", "手绘运动路径：开": "手描きモーション：オン"
    },
    en: {
      "设置": "Settings", "界面语言": "Interface language", "中文": "Chinese", "日文": "Japanese", "英文": "English", "选择 Pixel Decomposer 的显示语言": "Choose the display language for Pixel Decomposer",
      "Pixel Decomposer - 贴图拆分": "Pixel Decomposer - Sprite Split", "Pixel Decomposer - 像素绘制": "Pixel Decomposer - Pixel Drawing", "Pixel Decomposer - GIF 动作": "Pixel Decomposer - GIF Animation", "Pixel Decomposer - 设置": "Pixel Decomposer - Settings",
      "贴图拆分": "Sprite Split", "返回贴图拆分": "Back to Sprite Split", "打开工程": "Open Project", "保存工程": "Save Project", "保存编排": "Save Sequence",
      "编辑贴图": "Edit Sprite", "GIF 动作": "GIF Animation", "导出 GIF": "Export GIF", "源贴图": "Source Sprite", "导入贴图": "Import Sprite",
      "尚未导入贴图": "No sprite imported", "原图未修改": "Source remains unchanged", "候选帧识别": "Frame Detection", "智能识别": "Auto Detect", "网格识别": "Grid Detect",
      "最小像素面积": "Minimum pixel area", "列": "Columns", "行": "Rows", "识别可拆分结构": "Detect Split Areas", "手动优化": "Manual Refinement", "清空全部选区": "Clear All Areas",
      "矩形选区": "Rectangle Select", "删除当前选区": "Delete Current Area", "撤销选区操作": "Undo Area Change", "重做选区操作": "Redo Area Change", "全部拆出": "Split All",
      "拆分结果": "Split Results", "选区属性": "Area Properties", "名称": "Name", "左": "Left", "上": "Top", "宽": "Width", "高": "Height", "交付素材": "Export Assets",
      "像素倍率": "Pixel Scale", "透明 PNG": "Transparent PNG", "PNG 素材包": "PNG Asset Pack", "GIF 动作编排": "GIF Timeline", "播放预览": "Play Preview", "停止预览": "Stop Preview",
      "像素绘制": "Pixel Drawing", "绘制工具": "Drawing Tools", "铅笔": "Pencil", "橡皮": "Eraser", "填充": "Fill", "取色": "Eyedropper", "自定义色卡": "Custom Palette",
      "独立帧": "Individual Frames", "新建透明帧": "New Transparent Frame", "复制当前帧": "Duplicate Current Frame", "删除选中帧": "Delete Selected Frames", "多选帧": "Multi-select Frames",
      "撤销帧操作": "Undo Frame Change", "重做帧操作": "Redo Frame Change", "导出透明 PNG": "Export Transparent PNG", "帧顺序": "Frame Order", "统一设为 0.12 秒": "Set All to 0.12 Seconds",
      "循环": "Loop", "精度 0.01 秒": "0.01 Second Precision", "动作节奏": "Animation Timing", "总时长": "Total Duration", "平均帧率": "Average Frame Rate", "输出尺寸": "Output Size",
      "逐帧控制": "Per-frame Control", "打开 .pdec 工程": "Open .pdec Project", "GIF 像素倍率": "GIF Pixel Scale", "选择图片": "Choose Image", "工程名称": "Project Name",
      "清除源贴图": "Clear Source Sprite", "缩小": "Zoom Out", "放大": "Zoom In", "重置缩放": "Reset Zoom", "下一帧": "Next Frame", "色卡": "Palette", "移动": "Pan", "导出": "Export", "画布 / 部件动画": "Canvas / Part Animation", "去除底色": "Remove Background", "导入图片帧": "Import Image Frames", "选择拆分帧": "Choose Split Frames", "复制此帧": "Duplicate Frame", "删除此帧": "Delete Frame", "手绘运动路径：关": "Draw Motion Path: Off", "手绘运动路径：开": "Draw Motion Path: On"
    }
  };
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();

  function language() {
    try {
      const value = localStorage.getItem(storageKey);
      return supported.has(value) ? value : "zh-CN";
    } catch { return "zh-CN"; }
  }

  function translate(value, locale = language()) {
    return dictionary[locale]?.[value] || value;
  }

  function translateTextNode(node, locale) {
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const source = originalText.get(node);
    const leading = source.match(/^\s*/)[0], trailing = source.match(/\s*$/)[0];
    const key = source.trim();
    if (key) node.nodeValue = `${leading}${translate(key, locale)}${trailing}`;
  }

  function translateAttributes(element, locale) {
    const names = ["aria-label", "data-tip", "placeholder", "title"];
    if (!originalAttributes.has(element)) originalAttributes.set(element, new Map());
    const sources = originalAttributes.get(element);
    names.forEach((name) => {
      if (!element.hasAttribute(name)) return;
      if (!sources.has(name)) sources.set(name, element.getAttribute(name));
      element.setAttribute(name, translate(sources.get(name), locale));
    });
  }

  function apply(locale = language()) {
    document.documentElement.lang = locale;
    document.title = translate(originalTitle, locale);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) { return /^(SCRIPT|STYLE)$/i.test(node.parentElement?.tagName || "") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => translateTextNode(node, locale));
    document.querySelectorAll("*").forEach((element) => translateAttributes(element, locale));
  }

  function setLanguage(locale) {
    const next = supported.has(locale) ? locale : "zh-CN";
    try { localStorage.setItem(storageKey, next); } catch { /* The current page still updates. */ }
    apply(next);
    document.dispatchEvent(new CustomEvent("pixel-decomposer-language", { detail: next }));
  }

  window.PixelI18n = { language, setLanguage, t: translate, apply };
  document.addEventListener("DOMContentLoaded", () => apply());
})();
