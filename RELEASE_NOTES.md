# Pixel Decomposer V0.1.4 — 修正版 / Revision 2 / 修正版2

## 中文

本次修正版解决 V0.1.4 新功能入口不明显、提示被面板遮挡的问题。安装后，请在绘画画布上方点击「绘画工具」，在 GIF 页面点击「画布 / 部件动画」。

- 绘画页面增加常驻文字入口，直线、矩形、椭圆、选区/移动可直接选择；更多工具包含实心图形、镜像、不透明度、复制粘贴、翻转、旋转与像素网格。
- GIF 页面提供明确的「导入图片」及「画布 / 部件动画」入口，无需先拆图。部件动画支持自定义画布、多部件同帧合成、独立关键帧、缓动/贝塞尔插值、手绘运动路径，以及生成帧到 GIF 时间线。
- 提示文字使用独立浮层，避免被上方工具栏或面板裁切。
- 补齐部件动画面板的中文、英文和日文说明；检查三语下绘画工具与部件动画入口均可打开。
- Android 保持版本名称 0.1.4，内部版本号提升至 11，使用正式签名，可覆盖同签名旧版。更新前建议保存工程并导出色卡备份。

本地验证：直接加载 Windows 打包后的页面，在 1440×920、390×844、844×390 下完成两页面×三语言共 18 组入口检查；绘画与撤销/重做通过；纯色背景去除保留封闭内部同色像素；10 帧合成验证身体静止、头部移动及透明背景。核对 Windows 与 APK 中 12 个核心文件一致；APK v1/v2 签名通过。

验证范围：移动端布局在本地浏览器内核中验证，未连接安卓真机；Windows 安装器未作发布者数字签名。当前不是完整专业绘画套件，独立绘画图层尚未实现，其他旧页面的翻译仍需继续完善。支持 Windows x64 与 Android，暂不提供 iOS、macOS、Linux 安装包。

## English

This revision makes the V0.1.4 features easier to find and fixes tooltips being clipped by panels. Open **Drawing tools** above the drawing canvas, or **Canvas / Parts Animation** on the GIF page.

- Added persistent, labeled drawing controls for lines, rectangles, ellipses and selection/movement. The tool panel includes filled shapes, symmetry, opacity, copy/paste, flips, rotation and a pixel grid.
- Added clear image-import and parts-animation entries on the GIF page. No splitting is required first. Parts animation supports a custom canvas, multiple parts in one frame, independent keyframes, easing/Bézier interpolation, hand-drawn motion paths and baking frames into the GIF timeline.
- Tooltips now use a separate overlay so toolbars and panels cannot clip them.
- Completed Chinese, English and Japanese instructions for the parts-animation panel and checked both feature entries in all three languages.
- Android versionName remains 0.1.4; versionCode is now 11. The release-signed APK can update earlier versions signed with the same key. Save projects and export a palette backup before updating.

Local validation: 18 packaged-page checks across two pages, three languages and three viewport sizes (1440×920, 390×844, 844×390); drawing/undo/redo; background removal preserving enclosed pixels of the same color; a 10-frame composite with a stationary body, moving head and transparent background. Twelve core files match between the Windows bundle and APK. APK v1/v2 signatures verified.

Scope: mobile layouts were checked in a local browser engine, not on an Android device. The Windows installer has no publisher digital signature. This is not a complete professional painting suite: independent painting layers are not implemented, and translations on older pages still need work. Windows x64 and Android only; no iOS, macOS or Linux packages yet.

## 日本語

V0.1.4 の新機能を見つけやすくし、ツールチップがパネルに隠れる問題を修正しました。描画画面の「描画ツール」、または GIF 画面の「キャンバス / パーツアニメーション」から開けます。

- 直線・矩形・楕円・選択/移動を、文字付きの常設ボタンから選択できるようにしました。ツールパネルには塗りつぶし図形、対称描画、不透明度、コピー/貼り付け、反転、回転、ピクセルグリッドがあります。
- GIF 画面に画像読み込みとパーツアニメーションの入口を明示しました。事前の画像分割は不要です。キャンバスサイズの指定、複数パーツの同一フレームへの合成、個別キーフレーム、イージング/ベジェ補間、手描き移動パス、GIF タイムラインへのフレーム生成に対応します。
- ツールチップを独立した表示レイヤーに変更し、ツールバーやパネルによる切り取りを防ぎました。
- パーツアニメーションパネルの中国語・英語・日本語の説明を補完し、3言語で両機能を開けることを確認しました。
- Android の表示バージョンは 0.1.4、内部バージョン番号は 11 です。正式署名の APK で、同じ鍵で署名された旧版を更新できます。更新前にプロジェクトの保存とパレットのバックアップをお勧めします。

ローカル検証：Windows パッケージ内の2画面を、3言語・3画面サイズ（1440×920、390×844、844×390）の計18条件で確認しました。描画と元に戻す/やり直す、囲まれた同色ピクセルを保持する背景除去、胴体が静止して頭だけが動く透明背景の10フレーム合成を検証しました。Windows と APK の主要12ファイルの一致、および APK の v1/v2 署名を確認しました。

検証範囲：モバイルレイアウトはローカルのブラウザーエンジンで確認しており、Android 実機では未確認です。Windows インストーラーには発行元のデジタル署名がありません。完全な業務用描画ソフトではなく、独立した描画レイヤーは未実装です。旧画面の翻訳には改善の余地があります。対応環境は Windows x64 と Android のみで、iOS・macOS・Linux のインストーラーはまだ提供していません。
