# 盛乐青年 · 刮刮乐 H5

移动端互动画像。选择状态、生活搭子和态度，决定是否加入照片，再刮开五色海报之一。工程包含 Vite、Vue 3、Vue Router、Vant 4、GSAP、lottie-web 和 html2canvas。

## 运行

在已解压的 `shengle-h5` 目录内运行。建议使用 Node.js 22 LTS 或更新版本。

```sh
npm ci
npm run dev
```

`npm run build` 生成 `dist/`。`npm run preview` 在本地预览生产版本。压缩包里附带已构建的 `dist/`，也可以用静态 HTTP 服务直接托管这个目录。路由使用 Hash，支持部署到子目录。

## 页面路由

| 页面 | 路径 | 组件 | 交互 |
| --- | --- | --- | --- |
| 封面 | `/#/` | `CoverPage.vue` | 定制你的画像 |
| P1 状态 | `/#/quiz/status` | `QuizPage.vue` | 原词云拆成 15 枚独立按钮 |
| P2 搭子 | `/#/quiz/partner` | `QuizPage.vue` | 选择一件生活物品 |
| P3 态度 | `/#/quiz/attitude` | `QuizPage.vue` | 选择一句态度标签 |
| P4 照片 | `/#/photo` | `PhotoPage.vue` | 默认插画，可开启本地照片、预览和换图 |
| P5 加载 | `/#/loading` | `LoadingPage.vue` | 拼图动效，等待海报与照片解码，再进入 P6 |
| P6 揭晓 | `/#/result` | `ResultPage.vue` | 刮开、逐字显示、长按保存或下载 PNG |

`src/router.js` 定义页面和前置条件。刷新或直接打开后续链接时，守卫会回到第一道待答的题目或照片确认页。当前标签页使用 `sessionStorage` 保存答案、裁好的照片和揭晓状态。选择「再测一次」清空本轮数据。

## 改文案和匹配规则

- `src/core/content.js` 包含问题、P3 文案、五套结果标题、口号与配色。
- `src/core/words.json` 包含 P1 词组的文字、坐标和主题。P1 按钮沿用词图的手绘字形，改词时同时替换对应的 `public/assets/art/word-*.png`。`src/core/options.js` 定义 P2 物品和各题选项。
- 默认每题单选。点选后有 400 ms 可以改选，计时以最后一项为准。回到已经答过的题目时，可以直接按「下一步」。
- 三个答案分别给自己的主题计一票，得票最高者决定结果。三方同票优先采用 P3 态度。映射和示例文案均可替换，逻辑在 `src/core/session.js`。
- Figma 节点 `47:2` 提供封面、三张题页、加载页和五张结果画板。P4 按给定图层树延伸设计，P3 可选态度和结果归类采用本工程的示例配置。部分插画使用从 Figma 导出的图层，部分使用与其配套的预览图。

## 动效参数

`src/core/motion.js` 集中维护 GSAP 参数。下表单位为毫秒，代码使用秒。

| 动作 | 时长或间隔 | Ease | 实现 |
| --- | --- | --- | --- |
| 页面圆形扩散 | 600 | `power3.inOut` | `PageTransition.vue` 给外层固定 `clip-path: circle()`，外层缩放、内层倒数缩放，上一页留在底层 |
| 选项浮入 | 每项 380，错开 80 | `power2.out` | 由下方 22 px 回到原位并显现 |
| 选项悬浮 | 极值间 1600，首次半程 800；随机延迟 0–850 | `sine.inOut` | 各项在 ±6 px 之间循环 |
| 选中回弹 | 放大 140，复位 180 | `power2.out` / `power2.inOut` | 1 → 1.15 → 1；其余项在 160 ms 内降至 0.35，`power1.out` |
| 收拢后翻页 | 选完等待 400，收拢 280 | 等待 / `power3.in` | 按每个按钮的实际中心计算偏移 |
| 进度条 | 480 | `back.out(1.7)` | 固定宽度，只更新 `scaleX` |
| P4 照片开关 | 180 | `cubic-bezier(.3, 1.05, .4, 1.05)` | Vant 滑块使用 `translate3d` 平移 |
| P4 → P5 三枚菱形 | 合拢 320，放大 280，共 600 | `power3.in` / `power3.out` | 量取 P4 三个起点和 P5 菱形终点，与圆形转场同一时间轴 |
| 加载圆点 | 单程 640，错开 120，往返循环 | `sine.inOut` | `translateY` 变化；普通模式为加载画面预留至少 1100 ms |
| 剩余遮罩碎片 | 每片 480，总错开 100 | `power2.in` | 把实际残留像素切为 4 × 5 片，向下旋转飞出 |
| 海报回弹 | 440 | `back.out(1.4)` | 0.9 → 1，与门框第一笔同时开始 |
| SVG 门框描边 | 4 段 × 200，共 800 | `none` | 每段固定 `pathLength` 和 `stroke-dasharray`，围绕笔画起点沿轴缩放 |
| 标签打字 | 门框完成后每字 50 | 离散显示 | 预排全部字形，依次切换每字透明度，维持行宽 |
| 随包预览 Lottie | 30 fps，73 帧；动画关键帧位于 0 / 36 / 72 | `cubic-bezier(.58, 0, .42, 1)` | 替换资产后按正式 JSON 的帧率、时长及曲线播放 |

圆形和虚线参数在动效开始前设置。动画中的 HTML/SVG 元素只更新 transform 或 opacity。Canvas 负责逐像素擦除，Lottie 按资产帧渲染。系统开启「减少动态效果」时，页面直接显示终态、跳过刮卡等待，Lottie 停在末帧。运行中变更系统偏好也会生效。

## 替换动画资产

随包的 9 个 JSON 是可运行的预览动效。将正式导出件放入 `public/assets/animations/`，覆盖以下同名文件。外链图片按 JSON 内的 `u` 和 `p` 保留相对目录，内嵌 data URL 也可以使用。

| 文件名 | 使用位置 |
| --- | --- |
| `bench-couple.json` | 封面长椅人物 |
| `item-pool.json` | P2 搭子物品插画 |
| `hanging-decor.json` | P3 悬挂装饰 |
| `walking-couple.json` | P5 人物插画 |
| `result-pink.json`、`result-yellow.json`、`result-purple.json`、`result-blue.json`、`result-green.json` | P6 五种海报底图，按 640 × 1136 的比例合成 |

`LottieArt.vue` 用 IntersectionObserver 建立和回收实例。入屏后加载并播放，切到后台时暂停，离屏后暂停并调用 `destroy()`，再次入屏时重建。减少动态效果时 `autoplay: false` 并调用 `goToAndStop()`。P6 从实际动画读取末帧，和文字、照片一起导出。替换底图后，可同步更新 `public/assets/art/poster-颜色.png` 作为加载失败时的静态画面。

## 照片、刮卡与导出

- `PhotoPage.vue` 和 `core/photo.js` 处理 Vant Uploader、开关、文件大小与解码错误。JPG、PNG、WebP 上限 10 MB，照片在浏览器里居中裁为 640 × 640。关闭开关会清除已选照片。
- `ScratchMask.vue` 同时支持触摸、鼠标和触笔。Canvas 使用 `destination-out`，按实际像素剩余 alpha 计算擦除面积，超过 60% 时触发。键盘用户也可按「直接揭晓」。
- `PosterCard.vue` 管理 SVG 描边、标签逐字显示和头像叠加。`core/exportPoster.js` 只截取一份固定尺寸的终态海报，等图片解码、字体加载后再调用 html2canvas。导出的 PNG 为 960 × 1704，包含角色、头像或插画、口号和三个标签。
- 「保存海报」会打开可长按的图片，也提供 PNG 下载。不同手机浏览器和内置浏览器的长按菜单由系统提供。

## 验证范围

生产构建已在 Chromium 的 390 × 844 移动视口下验证。覆盖连续改选、返回时取消自动翻页、无图和有图两条路径、刷新恢复、损坏图片提示、手指与鼠标刮擦、五种结果 PNG、导出失败重试，以及减少动态效果。面积测试中，恰好 60% 的遮罩保持可刮，60.3125% 触发碎片。Lottie 也验证了离屏销毁、重新入屏重建和减少动态效果下停止播放。

