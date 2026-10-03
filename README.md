# Real2Sim AutoResearch — Research Blog

以图片为主的中文研究博客，介绍真实观测、场景重建、假设驱动实验、参数辨识和独立验证。

## 内容

- 5 张原创 AI 生成图片：主视觉、框架、资产图册、表示对齐、滴管实验。
- 三种研究循环的切换说明；六类资产说明。
- 三个竞争假设 × 三个阶段的研究决策演示。
- 26 项文献与项目链接，以及可下载的研究框架。
- 响应式页面、键盘操作和图片放大。

本仓库是研究方案网页。没有物理仿真后端、真实机器人连接或已测得的性能结果。生成图不是实测记录，也不是可下载的三维资产。

## 本地查看

网页不需要安装依赖。直接打开 `index.html`，或：

```sh
python3 -m http.server 8000
```

然后打开 http://localhost:8000 。

## GitHub Pages

仓库：`liudi159/real2sim-autoresearch`。

1. 将本目录的文件上传到仓库根目录。
2. 在 Settings → Pages 中选择 GitHub Actions 作为发布源。
3. 内置的 `Deploy research blog` 工作流会发布静态文件；也可手动运行 workflow_dispatch。
4. 若仓库名为 `real2sim-autoresearch`，预期访问路径为 `https://liudi159.github.io/real2sim-autoresearch/`。发布状态以 GitHub Pages 和 Actions 为准。

当前页头链接指向项目仓库。所有站内资源使用相对路径，适用于 GitHub Pages 的项目子路径。

## 图片与来源

`assets/`：原始生成 PNG。`docs/image-prompts.json`：完整生成提示词与图像说明。图片通过内置 image_gen 生成，一图一请求。

`docs/references.txt`：文献标题和链接。`docs/research-blueprint.md`：网页研究方案。

页面版式参考了用户提供的 [stiff-physics 项目页](https://haoxiangntu.github.io/stiff-physics/#gui) 的分节阅读方式；页面代码、文字组织及图片均重新制作，没有复制其实验图、视频或性能数据。
