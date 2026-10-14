# STICK SOMETHING · 「贴点什么」

以中国街头小广告为视觉来源的极简贴纸编辑器。Fatty Games · v0.2.1-beta.1，本地浏览器内测版。

内测操作见 TEST_GUIDE.md，GitHub 与打包说明见 RELEASE_GUIDE.md，版本变化见 CHANGELOG.md。

## 直接使用

双击 `dist/STICK-SOMETHING.html`，用 Edge 或 Chrome 打开即可。所有脚本、图标、品牌字体已包含在文件里，可以离线使用，无需安装依赖或启动服务器。

这是可编辑内测版本。

## 开发与 HTTP 预览

需要 Node.js 20 或以上，没有运行时第三方依赖。双击 `start-local.cmd` 或在本目录运行：

```powershell
node scripts/serve.mjs
```

打开 http://127.0.0.1:4173 。服务器只监听本机，关闭终端或按 Ctrl+C 即停止。端口占用时可设置 `PORT`。

```powershell
node --test tests/*.test.mjs
node scripts/build.mjs
```

也提供 `npm run dev`、`npm test`、`npm run build`。构建生成 `dist/index.html`（HTTP 网站）和 `dist/STICK-SOMETHING.html`（完整离线单文件）。发布静态网页时上传 `dist/index.html`、`dist/src` 与 `dist/assets`；单文件版本可直接发给别人。

## 操作

- **新建**：红黄样例、黑底宣言、蓝白便条、彩色条带、空白画布；矩形或椭圆，宽高 32–4096 px。
- **选择**：点击区域；上方路径可以选择包含子区的父区域。
- **分区**：上下或左右切分 2–64 块，子区域可再切分。拖动分隔线调比例；选中分隔线后也可用方向键微调。
- **文字**：输入多行文字、横排／竖排、字体、字重、字号、适配方式、对齐、字距、行距和内边距。菜单提供 8 种中文、12 种英文／拉丁系统字体（如等线、仿宋、幼圆、隶书、Arial、Impact、Georgia、Consolas、Courier New），按语言分组；也能自定义字体名称。未安装的字体使用替代字体，不重新分发系统字体文件。
- **填充**：确认颜色后，点击其他区域涂色。右键只选择和打开菜单。
- **取色器**：在选色面板点击滴管，然后点击成品画布的背景或文字取色。取到的颜色只预览；点击面板下方的大颜色圆圈正式采用。Esc、取消或点击面板外恢复原色。取色过程中 Esc 取消，椭圆外的透明处不能取色。
- **删除**：右键菜单、属性面板按钮或 Delete。删除父区时包含整个子树，剩余相邻区域按原比例放大；只剩一个子区时自动折叠父区，保留子区内部排版。画布不能删除。输入文字或中文输入法组合时 Delete 不删区。
- **清空文字**保留布局和样式。撤销／重做最多保留 30 次实际作品变化；仅点击、聚焦、不改变比例的拖拽不计入记录，恢复原内容的连续编辑也不留下空记录。Ctrl+Z／Ctrl+Shift+Z，输入框内优先使用原生文字撤销。新建或打开项目从该项目的初始状态重新计数；历史耗尽后按钮变灰。
- **画布**按钮：编辑过程中更改宽高、形状，可锁定宽高比；分区比例保留，文字重新适配。
- **保存**：工具栏最左侧软盘按钮或 Ctrl+S。首次保存需选择文件；以后覆盖同一个 JSON 文件，不再重复下载。通过原生“打开”选中的项目也保留文件关联，保存时更新它。界面区分“未保存文件”“未保存更改”“已保存”。
- **另存为**：保存按钮右键菜单、小箭头菜单或 Ctrl+Shift+S，打开系统保存窗口，可以改名称或位置；成功后后续保存改用新文件，取消则保留旧关联。首次设置默认文件夹时选择一个父目录，应用在其中创建 `STICK SOMETHING/Projects`，并记住它；新文件默认从这里选择保存位置。
- **重命名**：双击文档标签中的 `xxx.something`，或聚焦标签后按 Enter／F2，弹窗修改项目名称，支持撤销。项目名称与磁盘文件名分别处理；修改磁盘文件名使用“另存为”，保留原文件。
- **打开**：Ctrl+O。原生打开保留文件句柄；兼容的文件导入只导入内容，下次需首次保存。新建 Ctrl+N。
- **下载副本**：兼容性选项，会使用浏览器下载目录，不建立原文件关联；它与“保存”明确分开。
- **导出**：PNG 或 SVG，按画布像素尺寸生成，椭圆外透明，不含选择框和分隔线。SVG 保留文字，需要查看设备具有相同字体；PNG 固定当前字体外观。

## 本地保存与界面设置

作品恢复副本自动保存在当前浏览器的 localStorage 中，刷新时恢复最后一个作品；语言和主题独立保存。它用于意外刷新后的恢复，不等于 JSON 磁盘文件已经更新。磁盘更新通过“保存”执行。未确认的预览颜色不进入恢复副本、项目文件或导出。

支持的浏览器用 IndexedDB 记住授权文件句柄和默认文件夹，刷新后可继续保存同一个文件。浏览器可能要求重新授权；权限失效或写入失败时保留文件关联，并提示重新选择或另存为。清理站点数据会清除恢复副本和关联。离线文件与 HTTP 地址的记录各自独立；在它们之间用项目文件迁移作品。

直接读写使用浏览器 [File System Access 保存接口](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker)。请在支持接口的 Edge／Chrome 独立窗口中使用离线版或 localhost 版；不支持的浏览器、受限制的嵌入预览不能提供原文件覆盖，会明确提供“下载副本”。浏览器不会让网页在未选择和授权的磁盘位置自行创建目录。

默认简体中文与 Dark；支持 English、繁體中文、Deutsch、Français、Light 和 JSON 主题导入。语言只修改界面，主题只修改编辑器，不改变作品文字和配色。主题样例 `design/themes/paper.json`（构建后也在 `dist/themes/paper.json`）。主题只接收九个六位十六进制颜色字段，不执行脚本。

## 源码

| 文件 | 用途 |
| --- | --- |
| `index.html`、`src/styles.css` | 工作台与样式 |
| `src/app.mjs` | 编辑工具、撤销、颜色事务、画布取色 |
| `src/model.mjs` | 区域树、预设、删除规则、导入校验 |
| `src/renderer.mjs` | 预览与导出共用的 SVG 排版、PNG 渲染 |
| `src/files.mjs`、`src/i18n.mjs`、`src/fonts.mjs` | 原文件读写、路径记忆、五种语言、字体目录 |
| `scripts/` | HTTP 服务与离线构建 |
| `tests/` | 数据和真实浏览器交互检查 |
| `PROJECT_PLAN.md`、`UI_DESIGN.md`、`RESEARCH.md` | 范围、交互规则、文化背景 |

浏览器检查需要可用的 Playwright，使用 `node tests/browser.mjs` 检查离线／HTTP 编辑与下载兼容分支；使用 `node tests/editor-files.browser.mjs` 检查原文件保存、句柄关联、重命名和撤销。后者在 HTTP 地址运行，替换系统选择窗口的选择结果，使用真实浏览器文件句柄、隔离文件存储和 IndexedDB；不自动操纵 Windows 原生选择窗口。可通过 `PLAYWRIGHT_MODULE` 指定安装路径、`BROWSER_EXE` 指定浏览器、`BASE_URL` 指定预览地址。数据测试不需要额外依赖。GitHub Actions 已配置数据测试与构建，尚未创建或推送远程仓库。

## 字体与图标

品牌英文使用 [Inter](https://github.com/rsms/inter) 可变字体，中文使用 [思源黑体](https://github.com/adobe-fonts/source-han-sans)简体中文 Bold。二者均按各自 SIL Open Font License 随应用提供，许可在 `assets/fonts/`。Lucide 图标及其许可在 `assets/vendor/`。品牌字体不影响画布文字的字体设置。

Fatty Games 标志来自用户提供的原图，采用 SVG／CSS 蒙版随界面文字色适配 Light、Dark 与自定义主题，不加入导出的作品。品牌素材说明在 assets/branding/README.md。

首版专注平面排版。褪色、撕裂、胶痕、字体文件导入和 Windows EXE 包装留待后续版本。当前没有账号、上传或服务端存储；所有编辑、取色和导出在本机浏览器完成。
