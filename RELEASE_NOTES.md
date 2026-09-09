# Pixel Decomposer V0.1.5

## 中文

- GIF 简单制作：按「导入图片或选择拆分帧 → 排列顺序与每帧时长 → 预览并导出」操作，页面直接显示步骤说明，无需先学习部件动画。
- 部件动画重新分组为添加素材、摆放部件、制作运动三个步骤。新增「编辑起点 / 编辑终点」，自动记录关键帧并生成中间动作；未设置关键帧的部件保持静止。
- 高级关键帧、曲线和手绘路径默认折叠，贝塞尔控制点仅在选择对应曲线时显示。生成与返回按钮固定在面板底部，适配手机纵向布局。
- 新增说明提供中日英三语；GIF 帧操作补充悬浮提示。
- 包含绘画缩放修复：像素棋盘格与实际像素同步缩放、鼠标指针位置缩放、双指中心缩放，以及完整显示缩放百分比。支持输入 25%–2400%，100% 为原始像素比例。

本地验证：Windows 打包页面通过两页面×三语言×三尺寸的18组界面检查；生成/返回按钮未超出视口；绘画落点、鼠标与双指缩放、撤销重做、去底色和新手起终点合成通过。合成验证身体静止、头部移动和透明背景。Android versionName 0.1.5，versionCode 13，正式签名。

支持 Windows x64 和 Android。本轮未连接安卓真机，移动布局使用本地浏览器内核验证。独立绘画图层仍未实现，旧页面翻译仍有待完善。更新前请保存工程并备份色卡。

## English

- A simple GIF workflow now explains each step: import images or select split frames, arrange them and set durations, then preview and export. Parts animation is optional.
- The parts workspace is organized into adding artwork, arranging parts and animating. New **Edit start / Edit end** buttons record keyframes and generate intermediate movement. Parts without keyframes stay still.
- Advanced keyframes, curves and drawn paths start collapsed. Bézier controls appear only for that curve type. Generate and return buttons stay in the footer, with a vertical layout on phones.
- New instructions support Chinese, Japanese and English. GIF frame actions now have tooltips.
- Includes drawing zoom fixes: the checkerboard follows actual pixel size, wheel zoom stays under the cursor, pinch zoom follows its center, and the full percentage is visible. Enter 25%–2400%; 100% means original pixel scale.

Local validation: 18 packaged UI cases across two pages, three languages and three viewport sizes; footer visibility; drawing coordinates, mouse/pinch zoom, undo/redo, background removal and the beginner start/end workflow. The composite keeps the body stationary while the head moves on a transparent canvas. Android versionName 0.1.5, versionCode 13, release signed.

Windows x64 and Android only. No Android device was connected; mobile layouts were checked in a local browser engine. Independent painting layers remain unimplemented, and older pages still need translation improvements. Save projects and back up palettes before updating.

## 日本語

- GIF の基本手順を画面に表示しました。画像または分割フレームを追加し、順序と表示時間を設定して、プレビュー後に書き出せます。パーツアニメーションは任意です。
- パーツ編集を「素材追加・配置・動きの設定」の3段階に整理しました。「始点を編集 / 終点を編集」でキーフレームを記録し、中間の動きを自動生成します。キーフレーム未設定のパーツは静止します。
- 詳細なキーフレーム・曲線・手描きパスは初期状態で折りたたみます。ベジェ制御点は該当する曲線を選んだ場合のみ表示します。生成・戻るボタンは下部に固定し、スマートフォンでは縦配置に対応しました。
- 新しい説明は中国語・日本語・英語に対応し、GIF フレーム操作にもツールチップを追加しました。
- 描画ズームを修正しました。市松模様が実際のピクセルに合わせて拡大し、マウス位置またはピンチの中心を保ってズームします。倍率の末尾も表示されます。25%～2400%を入力でき、100%が元のピクセル比率です。

ローカル検証：パッケージ内の2画面・3言語・3画面サイズの計18条件、下部ボタンの表示、描画位置、マウス/ピンチズーム、元に戻す/やり直す、背景除去、始点/終点による合成を確認しました。透明背景上で胴体が静止し、頭だけが移動することを検証しました。Android は versionName 0.1.5、versionCode 13、正式署名です。

Windows x64 と Android に対応します。Android 実機は未接続で、モバイル配置はローカルのブラウザーエンジンで確認しました。独立した描画レイヤーは未実装で、旧画面の翻訳には改善の余地があります。更新前にプロジェクトとパレットを保存してください。
