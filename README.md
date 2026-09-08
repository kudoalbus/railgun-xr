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

拇指扣住食指侧面，另外四指握拳或自然弯曲，保持 180ms 后在拇指上出现直立的硬币。接着竖起拇指（不要求速度），确认约 45ms 后向手掌前方发射，另外四指可以放松。再次扣回拇指才会重新装填。追踪丢失或帧间断超过 150ms 会取消装填。

页面的姿态识别阈值越低越容易识别竖拇指。手部尺寸以腕到中指掌指关节距离归一化；识别在手掌局部坐标进行。真机遮挡与预测位姿仍可能影响识别，需测试。

V2 雷电：蓝白主干、三层蓝色光晕、10 处分叉与细支电弧，24Hz 动态变化。弹丸视觉速度 22m/s，雷电伸展至 18m，残留 4.6 秒后淡出，分支横向扩散约 0.5–1.15m。同时最多 8 道，每道用 3 个实例化网格，适用于双眼立体渲染。

## 文件

- src/coin.js：双面 SVG 路径，SVGLoader 转为真实 ExtrudeGeometry 浮雕，非照片贴图；网页底部可下载双面 SVG。
- src/gesture.js：无渲染依赖的手势状态机。
- src/main.js：WebXR 生命周期、关节可视化、射击与闪电。
- test/gesture.test.js：装填、弹射、冷却、慢速释放、张手取消及追踪重置测试。

## 真机验收（尚未在设备上执行）

1. 两款头显分别验证允许/拒绝手部权限，以及退出后重新进入。
2. 左右手各连续装填/弹射 20 次，调整姿态阈值。
3. 握拳整体移动、转腕、张手以及手出视野，不应发射；装填后竖起拇指应发射一次。
4. 走动、侧身、低头检查 6DOF、硬币贴合位置；Quest 验证透视背景。
5. 连续发射检查帧率、温度及图形负载。当前同时最多 8 道雷电，每道不超过 160 段。

## 参考

- https://developers.meta.com/horizon/documentation/web/webxr-hands/
- https://webkit.org/blog/15162/introducing-natural-input-for-webxr-in-apple-vision-pro/
- https://webkit.org/blog/15865/webkit-features-in-safari-18-0/
- https://developer.apple.com/videos/play/wwdc2024/10066/
- https://toaru-project.com/railgun_t/chara/mikoto.html

浏览器接口兼容性依据以上官方资料；不等于已经通过 Quest 3 / Vision Pro 真机测试。
