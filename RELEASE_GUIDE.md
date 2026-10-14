# 发布与 GitHub 准备

当前建议：v0.2.1-beta.1，先邀请少量朋友内测，再根据反馈决定正式版。

## 生成发布文件

在项目根目录运行（Node 20+，不需要安装依赖）：

```powershell
node --test tests/*.test.mjs
node scripts/build.mjs
node scripts/package-release.mjs
```

也可运行 `npm run release`，它负责构建和打包；发布前仍需先检查测试结果。

输出在 `releases/v0.2.1-beta.1/`：

| 文件 | 给谁／用途 |
| --- | --- |
| `*-offline-beta.zip` | 发给朋友，含离线编辑器、内测说明、主题样例和第三方许可 |
| `*-github-source.zip` | 源码、素材、测试、构建／打包脚本与文档，可解压后上传仓库 |
| `SHA256SUMS.txt` | 两个 ZIP 的 SHA-256 校验值 |
| `release-manifest.json` | 版本、文件大小与打包记录 |

ZIP 不包含个人项目文件、测试输出、开发暂存文件、旧聊天预览或 Git 元数据。打包不会删除这些本地文件。

## 上传 GitHub

本次只准备本地文件，尚未创建远程仓库或上传。

1. 解压源码 ZIP，进入里面的项目目录。
2. 创建或选择你的 GitHub 仓库，将这一层的文件上传。README、package.json、src、assets 等应在仓库根目录。
3. 使用仓库的 Releases 创建 `v0.2.1-beta.1`，标记为预发布，附上离线内测 ZIP 和校验文件。
4. 描述可使用 CHANGELOG 的本版本条目，并说明浏览器版、推荐 Edge／Chrome 独立窗口、尚无 EXE。

源码包保留第三方字体／图标许可。原创源码尚未指定公开开源许可证；本次不替你选择。Fatty Games 品牌素材单独说明在 assets/branding/README.md。

GitHub Actions 已准备基础测试与构建。无需把 dist、releases、.work、test-results 上传进源码仓库；构建与内测 ZIP 可放到 Releases 附件中。

## 内测通过标准

优先确认：真实文件路径选择和原文件更新、取消另存为、重启浏览器后的授权、撤销／重做、导出结果和主题对比度。修复会导致作品丢失或错误覆盖的问题后，再考虑稳定版。
