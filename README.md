# Pixel Decomposer

面向 Windows 与 Android 的像素素材拆分、绘制与 GIF 制作工具。当前版本：**V0.1.4**。

## 功能

- 透明贴图自动识别、网格拆分及手动矩形选区调整。
- 纯色背景转透明，支持边缘连通去色、颜色容差和原图恢复。
- 像素绘制、填充、取色、48 色色卡记忆与导入导出。
- 直线、矩形、椭圆、镜像笔刷、选区移动、复制粘贴、翻转及旋转。
- 独立 GIF 时间线，支持重复帧、顺序调整及 0.01 秒时长设置。
- 自定义动画画布、部件图层拼接、关键帧插值和手绘运动路径。
- PNG、ZIP、GIF 导出及包含素材的 `.pdec` 工程保存。

绘画工具面板位于编辑页面顶部。部件图层属于 GIF 动画工作区，绘画编辑器尚不支持独立绘画图层。

## 本地运行

安装 Node.js 与 npm 后执行：

```sh
npm ci
npm start
```

## 构建

Windows 安装包：`npm run build:win`。

Android：安装 JDK 21 和 Android SDK，配置 SDK 路径。使用本机环境变量设置 `PIXEL_DECOMPOSER_KEYSTORE`、`PIXEL_DECOMPOSER_STORE_PASSWORD`、`PIXEL_DECOMPOSER_KEY_ALIAS`、`PIXEL_DECOMPOSER_KEY_PASSWORD`，再执行 `npm run build:apk`。请使用自己的签名证书；仓库不包含发行签名私钥。

安装包通过 GitHub Releases 分发。Windows 安装包未配置发布者代码签名。Android 发行包使用发行证书签名。

## 验证与限制

V0.1.4 已验证直线绘制、撤销和重做；去底色与部件动画基础流程有 Electron 运行验证。安卓仍需覆盖不同设备的触摸及横竖屏验证。

依赖包及相关素材保留各自的许可证；本仓库暂未指定项目源码许可证。
