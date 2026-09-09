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
  const studioLabels = [
    ['在画布上拖动选中的部件。身体不需要动？不要给身体设置起点和终点。','Drag the selected part on the canvas. To keep the body still, leave its start and end positions unset.','選択したパーツをキャンバス上でドラッグします。胴体を静止させる場合は始点と終点を設定しないでください。'],
    ['1 · 添加素材','1 · Add artwork','1 · 素材を追加'],
    ['设置导出画面大小，再导入头、身体等部件。只拼接现成图片？返回 GIF 页面直接导入图片即可。','Set the output canvas size, then import parts such as a head and body. For complete images, return to the GIF page and import them directly.','出力サイズを設定し、頭や胴体などのパーツを読み込みます。完成した画像を並べるだけなら、GIF画面で直接読み込めます。'],
    ['2 · 摆放部件','2 · Arrange parts','2 · パーツを配置'],
    ['从列表选择部件，再拖动画布中的部件调整位置。','Select a part from the list, then drag it on the canvas to position it.','リストからパーツを選び、キャンバス上でドラッグして配置します。'],
    ['3 · 让部件动起来','3 · Animate a part','3 · パーツを動かす'],
    ['先点击“编辑起点”并摆放部件，再点击“编辑终点”并移动部件。软件会自动生成中间动作。','Choose Edit start and position the part. Then choose Edit end and move it. The app generates the movement between them.','「始点を編集」で開始位置を決め、「終点を編集」で終了位置に移動します。間の動きは自動で生成されます。'],
    ['编辑起点','Edit start','始点を編集'],['编辑终点','Edit end','終点を編集'],
    ['高级调整 · 关键帧、曲线与路径','Advanced · Keyframes, curves and paths','詳細設定 · キーフレーム・曲線・パス'],
    ['图片做 GIF：① 导入图片或选择拆分帧　② 排列顺序、设置每帧秒数　③ 播放预览并导出 GIF。','Image GIF: ① Import images or choose split frames. ② Arrange them and set each frame’s duration. ③ Preview and export GIF.','画像からGIF：① 画像または分割フレームを追加　② 順序と各フレームの秒数を設定　③ プレビューしてGIFを書き出し。'],
    ['导入图片','Import images','画像を読み込む'],
    ['部件动画工作区','Parts animation workspace','パーツアニメーション編集'],
    ['导入身体、头部等图层，在画面上拖动拼接。每个图层独立记录关键帧，未设关键帧的身体保持不动。','Import body, head or other parts as layers and drag them into place. Each layer has its own keyframes; layers without keyframes stay still.','胴体や頭などをレイヤーとして読み込み、ドラッグして配置します。レイヤーごとにキーフレームを設定でき、未設定のレイヤーは静止します。'],
    ['画布宽','Canvas width','キャンバスの幅'],['画布高','Canvas height','キャンバスの高さ'],
    ['动作秒数','Duration (seconds)','再生時間（秒）'],['帧间隔秒','Frame interval (seconds)','フレーム間隔（秒）'],
    ['导入部件图层','Import part layers','パーツレイヤーを読み込む'],['添加所选素材为图层','Add selected asset as layer','選択素材をレイヤーに追加'],
    ['可用素材','Available assets','使用できる素材'],['当前时间','Current time','現在の時間'],['播放 / 停止','Play / Stop','再生 / 停止'],
    ['记录 / 更新关键帧','Record / Update keyframe','キーフレームを記録 / 更新'],['删除当前时间关键帧','Delete keyframe at current time','現在のキーフレームを削除'],
    ['清除运动路径','Clear motion path','移動パスを消去'],['图层（后面的在上层）','Layers (later entries appear on top)','レイヤー（下の項目ほど前面）'],
    ['复制图层','Duplicate layer','レイヤーを複製'],['删除图层','Delete layer','レイヤーを削除'],['上移一层','Bring forward','一つ前面へ'],['下移一层','Send backward','一つ背面へ'],
    ['旋转角度','Rotation (degrees)','回転角度'],['缩放','Scale','拡大率'],['不透明度','Opacity','不透明度'],
    ['关键帧插值','Keyframe interpolation','キーフレーム補間'],['线性','Linear','線形'],['平滑缓入缓出','Ease in / out','イーズイン / アウト'],
    ['正弦缓动','Sine easing','サイン補間'],['保持（表情切换）','Hold (expression changes)','保持（表情の切り替え）'],['自定义三次贝塞尔','Custom cubic Bézier','カスタム三次ベジェ'],
    ['控制点 1 X','Control point 1 X','制御点 1 X'],['控制点 1 Y','Control point 1 Y','制御点 1 Y'],['控制点 2 X','Control point 2 X','制御点 2 X'],['控制点 2 Y','Control point 2 Y','制御点 2 Y'],
    ['关键帧：','Keyframes:','キーフレーム：'],
    ['手绘路径作用于当前图层中心，在整段动作内播放；位置路径优先于位置关键帧。旋转、缩放、不透明度仍由关键帧控制。画布外内容会被裁切。','A drawn path moves the selected layer’s center over the full duration and overrides position keyframes. Rotation, scale and opacity still follow keyframes. Content outside the canvas is cropped.','手描きパスは選択レイヤーの中心を全再生時間にわたって移動させ、位置キーフレームより優先されます。回転・拡大率・不透明度はキーフレームに従います。キャンバス外は切り取られます。'],
    ['生成并追加到 GIF 时间线','Generate and append to GIF timeline','生成してGIFタイムラインに追加'],['完成，返回 GIF','Done, return to GIF','完了してGIFに戻る'],
    ['请先添加部件图层。','Add a part layer first.','先にパーツレイヤーを追加してください。'],['部件导入失败。','Could not import the part.','パーツを読み込めませんでした。'],
    ['动作过大，请减小画布或提高帧间隔（最多 600 帧）。','Animation is too large. Reduce the canvas size or increase the frame interval (maximum 600 frames).','アニメーションが大きすぎます。キャンバスを小さくするか、フレーム間隔を長くしてください（最大600フレーム）。']
  ];
  studioLabels.forEach(([zh,en,ja])=>{dictionary.en[zh]=en;dictionary.ja[zh]=ja;});
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
  document.addEventListener("DOMContentLoaded", () => {
    apply();
    const tip=document.createElement('div');tip.id='global-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
    const hide=()=>{tip.hidden=true;};
    document.addEventListener('pointerover',event=>{const target=event.target.closest('[data-tip]');if(!target)return;tip.textContent=translate(target.getAttribute('data-tip'));tip.hidden=false;const b=target.getBoundingClientRect();tip.style.left=Math.max(8,Math.min(innerWidth-tip.offsetWidth-8,b.left))+'px';tip.style.top=(b.top>tip.offsetHeight+12?b.top-tip.offsetHeight-8:Math.min(innerHeight-tip.offsetHeight-8,b.bottom+8))+'px';});
    document.addEventListener('pointerout',hide);document.addEventListener('pointerdown',hide);document.addEventListener('scroll',hide,true);
  });
})();
