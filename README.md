# RAILGUN / 电磁实验室

基于 Three.js 的 WebXR 手部追踪实验。含桌面预览、双手独立装填、6DOF、蓝色闪电弹射、Quest 透视入口，以及按提供照片重新描绘的双面矢量浮雕硬币。图像文字不清晰，细小铭文为近似纹饰，并非精确复刻。

## 运行

需要 Node.js 20.19+。

```sh
npm install
npm run dev
npm test
npm run build
```

桌面访问终端输出的 localhost 地址。将构建后的 dist 上传到支持 HTTPS 的静态托管服务即可供头显访问。局域网 http://电脑IP:5173 不满足 WebXR 安全上下文要求；请用有效证书的 HTTPS 域名或可信开发证书。代码和依赖本地打包，字体加载失败时会使用系统字体。

## 头显

- Quest 3：在 Meta Quest Browser 打开 HTTPS 页面，开启手部追踪、放下控制器，选择沉浸模式；设备支持时可选透视模式。
- Vision Pro：使用支持 WebXR 的 Safari（visionOS 2 或更新版本），选择沉浸模式并允许手部追踪。使用 immersive-vr；不依赖 immersive-ar 或 gaze/pinch 输入。
- 会话强制要求 hand-tracking；缺失支持或拒绝权限会显示错误，不会偷偷改成捏合手势。
- 使用 local 参考空间，头部位姿由 WebXR 驱动，支持平移和旋转；无人工移动或镜头震动。
- 退出使用头显系统的结束沉浸体验操作。

## 手势

中指、无名指、小指弯曲；拇指靠近食指第二指节（index-finger-phalanx-intermediate）保持 220ms，拇指上出现 24mm 硬币。向手指前方快速弹拇指发射。左右手分别检测，发射后 650ms 冷却。速度阈值默认 0.5m/s，可在进入前调整，数值越低越灵敏。

判断使用随手掌旋转的局部坐标，减少手腕平移/旋转误触。追踪丢失立即取消装填。遮挡时浏览器可能提供预测位姿，真机仍需校准。视觉速度 14m/s，便于观察尾迹，不模拟真实超音速弹丸。

## 文件

- src/coin.js：双面 SVG 路径，SVGLoader 转为真实 ExtrudeGeometry 浮雕，非照片贴图；网页底部可下载双面 SVG。
- src/gesture.js：无渲染依赖的手势状态机。
- src/main.js：WebXR 生命周期、关节可视化、射击与闪电。
- test/gesture.test.js：装填、弹射、冷却、慢速释放、张手取消及追踪重置测试。

## 真机验收（尚未在设备上执行）

1. 两款头显分别验证允许/拒绝手部权限，以及退出后重新进入。
2. 左右手各连续装填/弹射 20 次，调整速度阈值和 contact 距离系数。
3. 握拳整体移动、转腕、张手以及手出视野，不应发射；快速向前弹拇指应发射一次。
4. 走动、侧身、低头检查 6DOF、硬币贴合位置；Quest 验证透视背景。
5. 连续发射检查帧率、温度及图形负载。当前同时最多 12 枚弹丸、每条尾迹 48 点。

## 参考

- https://developers.meta.com/horizon/documentation/web/webxr-hands/
- https://webkit.org/blog/15162/introducing-natural-input-for-webxr-in-apple-vision-pro/
- https://webkit.org/blog/15865/webkit-features-in-safari-18-0/
- https://developer.apple.com/videos/play/wwdc2024/10066/
- https://toaru-project.com/railgun_t/chara/mikoto.html

浏览器接口兼容性依据以上官方资料；不等于已经通过 Quest 3 / Vision Pro 真机测试。
