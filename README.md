# Real2Sim AutoResearch

以研究思路为主线的中文研究博客：从真实观测构建可检验的物理模型，组织参数辨识、主动测量与模型修订。

在线地址：https://liudi159.github.io/real2sim-autoresearch/

## v2 内容

- 10 个章节：研究问题、总体框架、单轮实验、资产建模、参数辨识、研究谱系、滴管案例、实验验证、实现路线、相关文献。
- 统一的 SVG 线性图标；8 个可查看详细输入、步骤、输出的架构模块。
- 8 个可点击研究节点，以及实验规范、证据判定视图。
- 6 类资产的表示、测量与验收规范；滴管的 4 个研究阶段。
- 显式模型与损失函数、参数可辨识性、主动实验策略、基线与消融。
- 26 项前期文献及项目，支持搜索；完整研究方案可下载。
- 响应式布局、键盘标签导航、减少动态效果支持。

本仓库是研究方案网页，尚未连接仿真后端或真实机器人。研究谱系展示预设的假设和实验协议，不是实际运行记录，也没有虚构性能或实验结果。

## 文件

- index.html：完整静态正文、图标定义和交互结构。
- styles.css：白底、深绿与细线风格的响应式样式。
- app.js：架构、资产、研究节点、案例阶段与文献搜索。
- docs/research-blueprint.md：完整正文和交互内容附录。
- docs/references.txt：前期整理的文献标题与链接。
- assets/、docs/image-prompts.json：v1 生成图存档；v2 页面不加载这些图。

## 查看与部署

无构建依赖。可直接打开 index.html，或在此目录运行 python3 -m http.server 8000。

GitHub Actions 工作流会在 main 更新后发布到 GitHub Pages。资源路径兼容项目子目录。

## 设计参考与研究边界

本次改版按用户要求参考了以下页面的研究信息组织：
- https://mate-robot.cn/research/RoboScientist/gallery/#/snapshot/experiment%3Agep-20260916%402026-09-16T05%3A09%3A35.085Z
- https://mmlab.hk/research/PhysicalRSI

图标、布局、交互和研究文字为本页重新制作，没有复制参考页面的代码、实验视频、数据或性能结论。文献与方案之间的对应及研究边界在页面末尾说明。

