# Real2Sim AutoResearch：完整研究方案

Di Liu · 2026-10-04 · v2

本文件与研究博客 v2 对应。内容为拟议系统与实验协议，尚未接入仿真后端或真实实验数据。

01

THE RESEARCH QUESTION

## 当仿真与现实不一致，
下一步究竟该改什么？

一条轨迹没有对齐，可能来自相机尺度、控制时延、摩擦、形变机制或观测误差。直接调整全部参数，容易得到一个能拟合片段、却无法预测新交互的模型。

### 研究对象，是模型如何变得可信。

给定物体、真实交互记录和有限实验预算，我们希望得到一个显式物理模型：它能重放已知动作，也能预测未参与拟合的动作；对无法唯一确定的属性，保留候选范围，并提出下一次应做的测量。

研究 Agent 负责选择问题和实验，物理求解器负责产生预测，数值方法负责参数搜索。模型的结构、参数及证据都成为可以检查和修订的对象。

WORKING HYPOTHESIS

能够区分错误来源的实验，
比更多次盲目调参
*更值得计算。*

待通过等预算对照与消融检验。

### H₁ · 先诊断，再优化

将误差划分为观测对齐、参数偏差与模型缺失，能否减少错误参数补偿？比较分层诊断与直接联合优化的跨动作预测。

### H₂ · 选择更有信息的动作

在相同真实交互预算下，主动选择能区分候选的动作，能否比随机采集更快缩小预测分歧？

### H₃ · 保留可迁移的修订

将通过验证的建模与诊断程序存为技能，能否在新资产上减少无效仿真？用有、无经验库的系统进行比较。

**预期贡献**

以“错误归因—实验选择—模型修订”为核心的研究控制器；带证据与有效范围的资产表示；保留失败分支的实验谱系。这些是拟验证的设计，贡献边界取决于最终基线比较与实验结果。

02

ANATOMY OF THE SYSTEM

## 一张框架图，读懂三个闭环。

数据与场景提供研究起点。研究外循环选择假设；辨识内循环估计参数；证据循环安排补测。点击模块，查看具体输入、处理过程和交付物。

REAL2SIM RESEARCH ARCHITECTURE拟议系统

**准备层**建立共同的研究起点

 经过检查的场景、动作与观测进入同一实验接口

**研究外循环**决定“为什么错”和“下一步做什么”

 **辨识内循环**θ 候选 → 同动作仿真 → 残差 → 更新 θ

 **证据循环**难以区分 → 设计真实补测 → 新数据版本 → 重评

 反馈至 04：下一轮诊断

**候选冻结 → 独立测试**测试结果不反馈给本轮模型选择

MODULE 01 · EVIDENCE

### 整理真实证据

把真实交互转成可比较的 episode，并显式记录缺失和不可靠观测。

#### 输入

带时间戳的视频、可选深度与动作日志；相机参数、实测尺寸及可选力信号。

#### 具体怎么做

- 按对象身份跟踪位姿、轮廓和关键事件。

- 用已知尺寸确定尺度，标记遮挡与估计误差。

- 保留原始数据，建立可重放的动作和观测版本。

#### 输出与失败处理

输出 episode、质量标记与测量来源。动作或尺度缺失时进入补测分支，不推断唯一材料参数。

### 研究 Agent

读证据、列解释、选实验、决定补测或停止。

### 数值优化器

在指定参数、边界与预算内搜索，并报告诊断。

### Coding Agent

实现缺失技能或机制；产出可回滚的候选补丁。

### 独立评估器

固定观测、指标与接受规则，输出可审计判定。

03

ONE ITERATION, END TO END

## 把一个研究想法，
变成一次可复查的实验。

以“物体在仿真中滑得过远”为例。Agent 的输出应是具体实验协议，而不只是一句“增大摩擦系数”。

01

观察残差

### 先看误差发生在哪里

对齐之后比较运动开始、接触、加速、减速与停止事件。区分全程平移的时间偏差、停止距离偏差和接触瞬间的局部异常。

 产物：按阶段分解的 residual_report 

02

竞争解释

### 写下什么证据会推翻假设

H₁：摩擦偏低；H₂：执行器实际输入滞后；H₃：碰撞几何改变了接触点。每个解释都附“支持证据、相反证据、下一次观测”。

 产物：可证伪的 hypothesis_record 

03

最小实验

### 每次只改变有研究意义的因素

先用空载动作校准时延，再在同一表面改变初速度。固定质量、几何、相机与初始姿态；初速度使用实测值和误差范围。

 产物：experiment_spec + frozen_fields 

04

执行与拟合

### 先排除实现错误，再估计参数

先做单位、接触与数值稳定性检查。通过后才搜索摩擦；每次候选使用同一动作输入，记录仿真版本、种子、参数和失败日志。

 产物：candidate + run_manifest 

05

开发评估

### 用未用于拟合的 episode 做选择

检查轨迹误差、停止时间、接触事件和跨初速度表现。拟合改善但开发集退化时拒绝；多组候选无法区分时补测。

 产物：decision + evidence_links 

06

继承与停止

### 保留有效修改，也保留失败原因

通过规则的候选成为新基线。若预算耗尽、改进低于测量分辨率，或参数仍不可辨识，则输出当前模型、有效范围和测量请求。

 产物：lineage_node + next_action 

RESEARCH CONTROLLER

### 保留基线，检验变体，
让证据决定继承。

外循环选择研究方向；内循环运行有限次仿真。需要真实补测时，生成测量请求并等待数据，不把预测当成观测。

```text
model = initialize(episodes, asset_spec)
protocol = freeze(splits, metrics, budget)
awaiting_measurement = False

while budget.remaining():
    evidence = evaluate_dev(model, protocol)
    hypothesis = diagnose(evidence, memory)
    experiment = design(hypothesis, constraints)
    if experiment.needs_real_measurement:
        request_measurement(experiment)
        awaiting_measurement = True
        save_checkpoint(model, experiment)
        break
    candidate = execute_and_fit(experiment, model)
    decision = compare(candidate, model, protocol)
    record(hypothesis, experiment, decision)
    model = accept_or_keep(model, candidate, decision)

if not awaiting_measurement and ready_to_freeze(model):
    freeze_candidate(model)
    final_test(model, sealed_episodes)
```

04

ASSETS & REPRESENTATIONS

## 资产不只有外形，
还应有物理含义与证据来源。

使用同一个 object_id 连接视觉外形、碰撞代理、动力学模型和真实观测。以下是建模规范与图标图册，不是已经制作完成的三维资产。

RIGID + DEFORMABLE + FLUID

### 胶头滴管

玻璃管、胶头和气腔分别建模；以装配关系连接，不能把一个视觉网格直接当成完整物理模型。

**表示**：玻璃刚体；胶头先用经验证的低阶模型，需要局部形变时再选壳 / 体模型；气腔与管路单独建模。

**测量**：内外径、胶头壁厚或体积、压缩位移、回弹轨迹、液面；按辨识目标补充力 / 压力。

**验收**：开口与内腔保留、胶头装配和持管支撑正确、无穿透；形变与吸液分别验证。

### 视觉表示

用于物体分割、轮廓匹配与相机观测。透明、反光、遮挡区域单独标注不确定性。

### 碰撞表示

保留杯口、瓶颈和可达内腔；按接触尺度选择凸分解或后端支持的凹几何。

### 动力学表示

刚体、关节、杆、壳或实体依据任务选择；简化模型必须通过目标交互的预测检验。

### 建立资产时，先锁定哪些量？

| 层级 | 具体工作 | 交付与检查 |
| --- | --- | --- |
| 坐标与尺度 | 声明单位、世界竖直方向、桌面平面、相机—世界—机器人变换；实测关键长度。 | 变换矩阵与标定误差；已知长度投影复核。 |
| 几何与装配 | 物体分部件重建；确定局部原点、质心先验、接触面、关节轴与开口。 | 视觉 / 碰撞 / 物理对象一一对应；无意外初始穿透。 |
| 边界与控制 | 显式区分固定、支撑、夹持、自由运动；声明位置 / 速度 / 力输入。 | 空载动作回放与静置检查；动作不可从目标轨迹直接替代。 |
| 初值与物性 | 测量可直接测得的质量和尺寸；其余建立有来源的边界和候选分布。 | 值、单位、来源、时间、置信范围及接触对；未知值不伪装成真值。 |
| 求解器配置 | 选择后端并固定积分步长、约束算法和碰撞容差；用步长细化检查数值收敛。 | 数值误差小于研究要分辨的差异；求解器设置不作为任意拟合旋钮。 |

PARAMETER PROVENANCE
measured直接测量

identified具备辨识证据

effective特定模型的有效参数

assumed尚待验证的假设

05

SYSTEM IDENTIFICATION

## 参数该怎么匹配，
匹配到什么程度才有意义？

先约束观测与动作，再辨识动力学。参数搜索要回答误差是否下降，也要回答现有数据能否区分这些参数。

EXPLICIT WORLD MODEL
ŷ = Hη( SM, θ(x₀, uη) )

**M**：模型结构　**θ**：物理参数　**η**：相机、尺度与时间等观测 / 输入辅助参数
**x₀**：初始状态　**uη**：记录动作经标定后的有效输入　**H**：从仿真状态映射到可观测量

A

### 约束 η：建立共同参照

用已知长度、静态标定和空载机器人运动估计尺度、坐标与时延。先独立约束辅助参数；后续只能在其测量误差范围内联合细化，并记录相关性。

B

### 估计 θ：同动作下比较

给定模型结构，对摩擦、阻尼、惯量或柔性参数做有界优化。参数使用物理单位，正值参数可对数化；初态误差纳入范围，避免用物性吸收误差。

C

### 检验 M：是否缺少机制

当可行参数范围内仍有跨动作的结构性残差，才比较新的接触或材料机制。先排除观测和数值问题，再让 Coding Agent 实现最小修订。

### 损失函数要对应真实可观测量。

Lfit = Σe Σj ∈ Oₑ wej ρ( rej / σj ) + λ R(θ)

e 表示 episode，Oₑ 是该片段实际可用的时刻与观测项，r 为仿真与真实观测之差；ρ 为稳健损失（如 Huber），R 为先验或正则项，其形式与强度预先登记。

残差覆盖位姿、轮廓 / 深度、力、形变、事件时间，以及案例中的液面或体积。σ 来自测量误差或预先确定的尺度；按 episode 和可用通道归一化，权重在比较前冻结。

缺失观测从目标中掩码处理，不当成零误差。接触切换可使用分阶段残差；渲染仅在需要图像残差时启用，物理轨迹比较不依赖照片级渲染。

#### 优化器如何选择？

低维且评估昂贵：考虑贝叶斯优化；不光滑接触：考虑 CMA-ES 等无梯度搜索；导数可靠：使用可微优化。先做参数扫描和多起点基线，选择由问题决定。

搜索预算含失败运行；不能只比较成功评估次数。

### 一次低误差拟合，还不能证明参数唯一。

| 待估量 | 能提供辨识信息的实验 | 常见歧义与处理 |
| --- | --- | --- |
| 接触摩擦 μ | 同一接触对下改变初速度或受控载荷，记录完整滑动与停止过程。 | 区分滑动 / 滚动与初速度误差；摩擦属于接触对，不是孤立资产的单一常数。 |
| 质量、质心与惯量 | 称量；已知力 / 力矩的运动；足够激励的机器人携物轨迹。 | 自由落体轨迹本身不能辨识质量；仅有位移视频时不强行输出唯一惯量。 |
| 胶头弹性与黏弹性 | 不同压缩幅度、加载速度和保持时间；结合力—位移与回弹曲线。 | 壁厚、刚度和边界条件耦合；无力观测时可能只能估计有效形变模型。 |
| 流阻与密封 | 不同压缩与浸入条件下的液面、体积，必要时增加气腔压力或密封检查。 | 胶头回弹、气体顺应性、流阻及泄漏可能产生相似吸液曲线。 |

**诊断与报告**

用有限差分或可靠导数计算归一化敏感性，检查近共线的参数影响；以多起点、剖面损失或按 episode 重采样评估稳定性。多组解都可行时报告参数族与预测范围。只有经过校准的概率推断才报告后验区间，候选集合的离散程度不自动等于统计置信区间。

ACTIVE EXPERIMENT DESIGN

### 从“再拍一段视频”，
变成“拍哪一段最有用”。

枚举可执行的动作，如不同压缩深度、释放速度或接触方向。预测各候选模型的输出，优先选择分歧大、观测可靠、成本可接受的动作。

u* = arg maxu ∈ U [ Dnoise-scaled(ŷ₁(u), …, ŷₖ(u)) − λ C(u) ]

这是可实现的候选分歧启发式，不等同于精确的信息增益。先由粗仿真筛选，再用选定求解精度确认；真实补测完成后建立新数据版本，同时重评基线与候选。

06

THE RESEARCH LINEAGE

## 展示研究如何分叉，
也展示为什么不继续某条路。

下面以“滴管吸液慢于仿真”为例，浏览一个预设的研究分支。每个节点都展开假设、实验、接受条件与失败后的去向。

**吸液过程的模型辨识**RESEARCH EXPLORER
预设研究路径 · 非运行记录

选中节点 研究节点 条件分支
01 / 08

BASELINE · 起点

### 建立最小可检验模型

**研究问题**：现有几何、夹持边界和动作输入，能否解释压缩、回弹和吸液的先后顺序？

**具体实验**：检查装配与持管支撑；先回放压缩动作，再单独比较空载回弹和吸液阶段。

**判定依据**：结构与输入检查通过后进入参数辨识；若事件顺序错误，优先修正协议或模型边界。

**后续分支**：分别检验时间对齐、有效流阻和胶头回弹三类解释。

EXPERIMENT SPECIFICATION

### 一个节点，绑定一份实验规范。

动作、观测、冻结项、搜索参数和否证条件在运行前登记。仿真失败也是结果，需要区分数值发散、错误输入与机制不适用。

**目标**：区分流阻过大与胶头回弹过慢。

**干预**：控制压缩深度和释放时程；浸入深度固定。

**观测**：胶头位移与液面同步视频；必要时补气腔压力。

**冻结**：几何、密封装配、动作标定、数据划分与指标。

**否证**：不同速度下仍存在同方向系统残差，且无法由观测误差解释。

```text
experiment_id: pipette.disambiguate.v1
status: planned
parent_model: baseline.v0
input: measured_release_trajectory
vary: [compression_depth, release_rate]
observe: [bulb_displacement, liquid_height]
optional: [chamber_pressure]
fit_only: train_episodes
compare_on: development_episodes
sealed_test_access: false
acceptance: frozen_protocol
on_missing_evidence: request_measurement
```

### 接受

满足预先设定的开发指标，关键行为不退化，计算成本在预算内，且检查与回归通过。

### 拒绝 / 回滚

只改善拟合集、引入新穿透或不稳定，或复杂模型的收益小于新增成本。保留失败记录。

### 证据不足

预测差异小于观测噪声，参数仍高度耦合，或必要信号缺失。保留候选并提出补测。

**记录可追溯，而不是只记一个分数**

每次决策连接原始观测、动作版本、候选补丁、环境锁定信息、逐 episode 误差和成本。评估器异常先修复基础设施，再同时重评所有候选；不将这种变化计为模型提升。

07

CASE STUDY · PIPETTE

## 胶头滴管：从一次吸液，
拆出可以逐层验证的物理问题。

目标是在记录的压缩、浸入和释放动作下，预测胶头回弹、液面随时间变化与最终吸液量；再检验模型能否迁移到新的动作条件。

胶头滴管刚体 × 柔性 × 气腔 × 流动

START WITH AN OBSERVABLE QUESTION

### 为什么液面上升得比模型预测更慢？

胶头回弹慢、管路阻力大、气腔泄漏、动作时序错误，都可能产生类似曲线。先设计能够区分它们的实验，再决定增加什么模型复杂度。

01 · COMPRESS

### 空气中压缩

在管尖未浸液时挤压胶头，记录真实位移；保持压缩状态。

02 · IMMERSE

### 保持压缩并浸入

管尖进入已知深度；玻璃管由夹持或约束支撑，胶头压缩不提前释放。

03 · RELEASE

### 释放胶头并吸液

卸去胶头压缩，同时保持持管支撑。测量回弹与液面，检查气泡与泄漏。

STAGE A · GEOMETRY

### 先让每个边界条件有物理对应。

从视频恢复部件和装配关系，用实测补齐透明表面、壁厚与内部容积。坐标、单位、接触位置和管尖开口统一登记。

#### 怎么做

- 分别建立玻璃管、胶头、烧杯与夹持支撑。

- 测量管径、管长、浸入深度；跟踪胶头压缩量。

- 检查支撑、密封连接、碰撞开口和动作时序。

**进入下一阶段：**结构与动作回放通过检查；未测内部几何保留范围，不借调材料参数补偿。

### 先建立低阶机理模型，再按残差升级。

REDUCED MODEL · ASSUMPTIONS FIRST
pg Vg = nRT
Q = (patm − pg − ρgΔz − Δpcap) / Rh

第一式是近似等温的气体关系；密封时 n 不变，泄漏模型需要 n(t)。第二式是忽略流体惯性的有效压降关系：Δz 为内外液面高差，Δpcap 为带符号的毛细项，Rh 表示工作范围内的有效流阻。

气腔体积同时受胶头形变与管内液面影响：Vg = Vbulb(x) + Vtube,air(h)。因此不能把胶头位移、压力和液面当作互不相关的三个拟合目标。

先用已测动作驱动低阶弹性 / 黏弹性与流动模型。若局部屈曲、接触迁移或强非线性导致稳定残差，再引入壳 / 体模型或更完整的流体求解；升级本身需要新增辨识证据。

以上为拟议建模起点，适用性需实验确认，不能视为已验证的滴管求解器。

### 什么实验能把几个解释分开？

| 竞争解释 | 区分性操作 | 关键观测 | 何时需要更多证据 |
| --- | --- | --- | --- |
| 输入时序偏差 | 同视野记录压缩解除与液面开始运动；使用清晰触发事件。 | 动作时间戳、胶头位移、液面起点。 | 无法同步时先校时；不能用流阻抵消时间偏移。 |
| 胶头回弹过慢 | 先测无吸液条件下的压缩—保持—释放，再改变释放速度。 | 位移、形状；需要材料常数时增加力和几何测量。 | 边界与壁厚不确定时，先报告有效回弹模型。 |
| 管路流阻过大 | 在可复现胶头输入下改变压差 / 浸入条件，比较多种工况。 | 压力—流量或压力—液面变化。 | 只有液面而无压力时，流阻与顺应性可能不可分。 |
| 密封或泄漏 | 单独检查胶头—玻璃连接；在已知封闭边界下观察压力保持。 | 压降、气泡与连接状态。 | 压力损失也可能来自材料松弛；需与机械回弹实验联合解释。 |

**只有现有视频时，先交付什么？**

可以先建立几何、动作阶段、胶头轮廓与液面轨迹，检查相对时序，并拟合限定条件下的有效模型。绝对尺度、真实输入力、壁厚或压力缺失时，输出缺测列表与候选范围；后续实测再升级辨识结论。

08

EVALUATION BEFORE CLAIMS

## 让实验回答：
这套研究方式真的更好吗？

评价同时覆盖物理预测、辨识可靠性和研究成本。先建立有真值的合成测试，再用独立真实交互检查外部有效性。

FIT

### 拟合集

优化参数与学习必要的测量映射；同一 episode 的相邻帧不跨集合泄漏。

DEVELOP

### 开发验证集

选择模型、比较假设与调研究策略；由于会被重复使用，保留选择记录。

SEALED TEST

### 封存测试集

候选与协议冻结后仅作最终评估。若据此修改模型，需要新的独立测试协议。

### 三组实验，逐层推进。

| 实验组 | 研究设置 | 必须报告的结果 |
| --- | --- | --- |
| E1 · 有真值的受控辨识 | 使用已知参数的合成数据，分别加入尺度 / 时间偏差、观测噪声和结构缺失。 | 参数误差、错误归因、失败率；验证系统是否能识别不可辨识情形。 |
| E2 · 真实刚体与柔性 | 从滑动、夹持与压缩开始；按物体、动作或采集批次划分 episode。 | 多步轨迹 / 力 / 形变误差、事件时序、未见动作预测与数值稳定性。 |
| E3 · 滴管耦合与迁移 | 先单部件后耦合；留出压缩深度、释放速度和浸入条件。 | 液面曲线误差、吸液体积、胶头回弹误差；插值与外推分开报告。 |

### 用等预算基线与消融定位收益来源。

BASELINES

#### 比较对象

- 固定模型 + 随机 / 网格搜索。

- 固定模型 + 数值优化。

- LLM 直接提参 + 仿真反馈。

- 完整的假设、补测与模型修订系统。

ABLATIONS

#### 逐项移除

- 去掉误差归因与辅助参数校准。

- 主动补测替换为随机动作。

- 禁止模型结构修订。

- 移除技能 / 失败经验记忆。

FAIR COMPARISON

#### 对齐资源

- 相同真实数据、初始资产与后端。

- 相同仿真预算与真实交互次数。

- 额外记录墙钟时间、Token 与人工成本。

- 跨 episode / 种子重复，报告分布与失败。

### Sim-ready

单位、碰撞、支撑和重放接口通过检查；证明场景可以运行。

### Predictively aligned

冻结后对未见动作作多步预测；证明在声明范围内有预测能力。

### Physically identified

参数得到独立测量、敏感性与可辨识证据；注明模型依赖与不确定性。

如果只有预测误差改善，就报告预测改善；材料属性没有独立依据时，保持 effective / assumed 标记。

09

FROM PROPOSAL TO IMPLEMENTATION

## 实现顺序：先打通证据闭环，
再增加模型能力。

各阶段都有明确产物和进入下一阶段的条件。优先完成一个可复查案例，再扩展到多种资产与复杂耦合。

PHASE 01

### 固定模型的 Real2Sim

episode 数据接口、坐标标定、资产检查、同动作重放、残差计算。

**完成条件**

一个刚体案例可以重复运行；观测与仿真在同一时间与坐标下比较。

PHASE 02

### 可辨识的参数闭环

有界优化、敏感性、参数来源、开发 / 测试划分与报告。

**完成条件**

在已知真值的测试中恢复可辨识参数，并能报告歧义。

PHASE 03

### 研究 Agent 与修订

假设登记、实验计划、候选补丁、失败记忆与受控继承。

**完成条件**

等预算下验证诊断、补测或经验复用的实际收益。

PHASE 04

### 滴管与耦合扩展

胶头力学、气腔与流动模块、区分性补测及跨条件检验。

**完成条件**

单模块和耦合预测分别通过独立实验，交付适用范围。

### 工程接口与技能包：每个模块具体交接什么？

| 接口 / 记录 | 最小字段 | 约束 |
| --- | --- | --- |
| Episode | object_id、原始观测索引、timestamp、动作、初态、camera、quality_mask、split | 原始文件只读；派生标定版本单独记录。 |
| AssetSpec | visual、collision、dynamics、units、transforms、parameters、provenance | 每个后端参数必须可追溯到物理含义或有效近似。 |
| ExperimentSpec | hypothesis、controlled_variables、free_parameters、bounds、budget、stop_rule | 运行前登记；评价阈值不可由候选自行修改。 |
| SkillPackage | 前置条件、输入输出、程序、依赖、失败模式、局部检查、回归记录 | 跨新资产先检查适用条件，不直接继承未经验证的参数。 |
| RunManifest | parent、data_version、code_version、backend、seed、cost、logs、metrics | 记录失败与取消；基线和候选使用同一评估版本。 |
| TwinPackage | 场景、资产、模型、参数证据、重放、环境锁定、报告与适用范围 | 包含已知失败条件，能够从原始证据重新执行。 |

### Coding Agent 什么时候介入，怎样避免错误继承？

#### 触发

已有技能不能表达实验，或跨工况残差支持缺失机制时介入。普通连续参数优化由数值方法执行。

#### 检查

候选补丁先过接口、单位、极限工况、数值收敛与回归，再进入开发比较。所有改动绑定父版本。

#### 继承

只继承通过协议的代码、参数和适用条件。禁止改写真实观测或接受阈值来获得提升；无收益时回滚。

THE RESEARCH OUTPUT

### 交付的不只是一个参数文件。
*还应能回答：为什么相信它？*

可执行场景 + 物理模型 + 参数证据 + 实验谱系 + 独立验证 + 适用范围

下载完整研究方案 

10

RELATED WORK & READING

## 文献如何连接到这套研究思路。

下表说明可借鉴的方法能力。后续接口与组合方式属于本方案的设计，不表示已接入、复现或获得相关研究的性能。

| 研究入口 | 原工作提供的能力 | 本方案关注的边界 |
| --- | --- | --- |
| [LLMPhy ↗](https://proceedings.mlr.press/v300/cherian26a.html) | 用 LLM 与物理引擎进行参数估计和场景布局推理，利用重建误差迭代。 | 将直接提参作为基线，单独评估诊断、补测与结构选择的收益。 |
| [TwinAligner ↗](https://arxiv.org/abs/2512.19390) | 视觉与动力学对齐，从机器人—物体交互辨识刚体物理。 | 将观测 / 输入标定与动力学误差分开登记，控制相互补偿。 |
| [PhysTwin ↗](https://arxiv.org/abs/2503.17973) | 通过稀疏交互视频、多阶段逆建模与物理表示构建可变形数字孪生。 | 研究柔性表示与新交互预测；滴管气液耦合需另外建立和验证。 |
| [Scalable Real2Sim ↗](https://arxiv.org/abs/2503.00370) | 使用机器人关节力矩传感器与外部相机，自动提取几何和惯性等属性。 | 为主动测量提供依据；所需观测不能用外观猜测替代。 |
| [PhysicalRSI ↗](https://mmlab.hk/research/PhysicalRSI) | 展示基于具身反馈修订执行程序、选择候选与继承技能的研究思路。 | 本方案将修订对象设为建模 / 辨识技能；最终按物理预测与证据评估。 |
| [RoboScientist Gallery ↗](https://mate-robot.cn/research/RoboScientist/gallery/#/snapshot/experiment%3Agep-20260916%402026-09-16T05%3A09%3A35.085Z) | 通过研究快照展示演进节点、实验运行和评估记录。 | 借鉴研究谱系与证据浏览方式；本页展示预设协议，不借用其运行结果。 |

### 完整阅读清单

26 项论文与项目下载标题与链接 

26 项文献与项目

### Fysics-AI / Fysiverse 系列核心研究4 项 / 展开

- Fysiverse-3D-Vision Technical Report: Generating Executable 3D Worlds from Images through Unified Spatial Reasoning

[论文](https://arxiv.org/abs/2609.25741)

- Fysiverse-3D-SimReady Technical Report: Agentic Physical Simulation for Pragmatic 3D World Reconstruction

[论文](https://arxiv.org/abs/2609.31715)[代码](https://github.com/Fysics-AI/Fysiverse-3D-SimReady)[项目](https://fysics-ai.github.io/Fysiverse-3D-project-page/)

- OmniFysics-Nano-V2 Technical Report: Understanding the Physical World Across Modalities

[论文](https://arxiv.org/abs/2609.25738)[模型](https://huggingface.co/Fysics-AI/OmniFysics-Nano-V2)

- OmniFysics-Captioner Technical Report: Grounding Omni-Modal Understanding in the Physical World for Better Captioning

[论文](https://arxiv.org/abs/2609.31714)[模型](https://huggingface.co/Fysics-AI/OmniFysics-Captioner)

### Agent 场景构建、检查与修正7 项 / 展开

- AWSM — Agentic World Simulation and Mapping（项目）

[代码与项目说明](https://github.com/wentingw/AWSM)

名称与链接沿用整理记录；尚未核验官方仓库内容。

- AHa-3D: Agentic Tool Use for Real2Sim with GPT-6 Astra（项目）

[项目与技术说明](https://kevinxu02.github.io/real2sim-indoor-site/)[Measurement 专节](https://kevinxu02.github.io/real2sim-indoor-site/#measurement)

- CoDimRecon: Agentic Reconstruction of Sim-Ready 3D Scenes with Deformable Curves, Surfaces, and Volumes

[论文](https://arxiv.org/abs/2609.36024)[项目](https://shuzhaoxie.github.io/CoDimRecon/)

- Agentic Real2Sim: Physics-based World Modeling with Vision-Language Agents

[论文](https://arxiv.org/abs/2607.19190)[项目](https://agentic-real2sim.github.io/)[代码](https://github.com/agentic-real2sim/agentic_real2sim)

- GS-Agent: Creating 4D Physical Worlds With Generative Simulation

[论文](https://arxiv.org/abs/2607.21522)[项目](https://umass-embodied-agi.github.io/gs-agent/)[代码](https://github.com/UMass-Embodied-AGI/gs-agent)

- SceneSmith: Agentic Generation of Simulation-Ready Indoor Scenes

[论文](https://arxiv.org/abs/2602.09153)[项目](https://scenesmith.github.io/)[代码](https://github.com/nepfaff/scenesmith)

- SimuScene: Simulation-Ready Compositional 3D Scene Reconstruction from a Single Image

[论文](https://arxiv.org/abs/2606.03994)

### 真实观测、物理参数辨识与 Real2Sim 对齐6 项 / 展开

- LLMPhy: Parameter-Identifiable Physical Reasoning Combining Large Language Models and Physics Engines

[正式论文](https://proceedings.mlr.press/v300/cherian26a.html)[预印本](https://arxiv.org/abs/2411.08027)[代码](https://github.com/merlresearch/llmphy)

- TwinAligner: Visual-Dynamic Alignment Empowers Physics-aware Real2Sim2Real for Robotic Manipulation

[论文](https://arxiv.org/abs/2512.19390)[代码](https://github.com/TwinAligner/TwinAligner)

- PhysTwin: Physics-Informed Reconstruction and Simulation of Deformable Objects from Videos

[论文](https://arxiv.org/abs/2503.17973)[项目](https://jianghanxiao.github.io/phystwin-web/)[代码](https://github.com/Jianghanxiao/PhysTwin)

- Scalable Real2Sim: Physics-Aware Asset Generation Via Robotic Pick-and-Place Setups

[论文](https://arxiv.org/abs/2503.00370)[项目](https://scalable-real2sim.github.io/)[代码](https://github.com/nepfaff/scalable-real2sim)

- RealSimLoop: Online Real-to-Sim Adaptation via Differentiable Reduced-Order Simulation with Vision Feedback

[论文](https://arxiv.org/abs/2609.09828)

- Real2Sim via Active Perception with Behavior Trees Automatically Generated by VLMs

[论文](https://arxiv.org/abs/2601.08454)

### Agent 自动建模、实验与仿真校准8 项 / 展开

- EMPIRIC: Experiment-Driven Learning of Residual World Models for Robot Planning

[论文](https://arxiv.org/abs/2609.35047)[项目](https://basisresearch.github.io/empiric/)[作者项目页所链接的代码仓库](https://github.com/BasisResearch/predicators)

- CP-Agent: A Harness-Engineered Agent for Crystal Plasticity Simulation Workflows

[论文](https://arxiv.org/abs/2609.31790)[代码](https://github.com/samoalfred/harness-cp-agents)

- Agentic TCAD Calibration Workflow for Oxide Semiconductor Transistors

[论文](https://arxiv.org/abs/2609.12184)[作者工作流介绍](https://gyulab.github.io/blog/2026/agentic-workflow-tcad/)

- Battery-Sim-Agent: Leveraging LLM-Agent for Inverse Battery Parameter Estimation

[论文](https://arxiv.org/abs/2605.29560)[代码](https://github.com/opqrst-chen/Battery-Sim-Agent)

- Agentic Calibration of Grey-Box Simulation Models: An LLM-Driven Alternative

[论文](https://arxiv.org/abs/2607.18308)

- HydroAgent: Closing the Gap Between Frontier LLMs and Human Experts in Hydrologic Model Calibration via Simulator-Grounded RL

[论文](https://arxiv.org/abs/2605.17792)[项目](https://chrimerss.github.io/HydroAgent/)[代码](https://github.com/chrimerss/HydroAgent)

- ASIA: an Autonomous System Identification Agent

[论文](https://arxiv.org/abs/2605.10480)[代码](https://github.com/dariopi/ASIA)

- SimulCost: A Cost-Aware Benchmark and Toolkit for Automating Physics Simulations with LLMs

[正式论文](https://proceedings.mlr.press/v306/cao26g.html)[预印本](https://arxiv.org/abs/2603.20253)[代码](https://github.com/Rose-STL-Lab/SimulCost-Bench)

### 物理语言与视频世界模型1 项 / 展开

- Physis-Lang: Self-Evolving Language as a Physical Representation for Video World Model

[论文](https://arxiv.org/abs/2609.40358)[项目](https://physis-intelligence.github.io/physis-lang-web/)[你提供的 PDF](https://physis-intelligence.github.io/physis-lang-web/assets/Physis-Lang.pdf?v=20260929-r2)

完整清单保留前期整理的条目与核验说明。PhysicalRSI 和 RoboScientist 的页面链接见上表；它们也为本次页面的信息组织提供了参考。



## 附录 A：完整架构模块说明

### 整理真实证据

把真实交互转成可比较的 episode，并显式记录缺失和不可靠观测。

**输入**：带时间戳的视频、可选深度与动作日志；相机参数、实测尺寸及可选力信号。

1. 按对象身份跟踪位姿、轮廓和关键事件。
2. 用已知尺寸确定尺度，标记遮挡与估计误差。
3. 保留原始数据，建立可重放的动作和观测版本。

**输出与失败处理**：输出 episode、质量标记与测量来源。动作或尺度缺失时进入补测分支，不推断唯一材料参数。

### 建立可执行场景

把视觉对象变成具有明确单位、接触、支撑与动力学表示的仿真对象。

**输入**：对象级几何、实测尺寸、装配与支撑关系；已知机器人结构与动作类型。

1. 为每个 object_id 分配视觉、碰撞、物理表示和统一坐标。
2. 选择刚体、关节、杆、壳或体模型；将开口与内腔保留在碰撞代理中。
3. 执行静置、无碰撞运动、接触和步长细化检查。

**输出与失败处理**：输出 scene v0、AssetSpec 和检查日志。穿透或不稳定时先修几何、边界与求解器；不直接进入参数拟合。

### 冻结实验协议

让所有候选在相同的观测、指标、资源与接受条件下比较。

**输入**：按 episode 分组的数据、目标可观测量、噪声估计、实验与计算预算。

1. 按物体、动作或采集批次划分拟合、开发与封存测试集。
2. 确定残差归一化、权重、关键失败指标和停止规则。
3. 锁定评估器与环境版本，隔离最终测试访问。

**输出与失败处理**：输出 protocol 与 evaluator。必要协议修订必须版本化，并用新协议同时重评基线和候选。

### 诊断并提出可证伪假设

利用误差发生的时间、部位和条件，区分观测问题、参数偏差与缺失机制。

**输入**：逐阶段残差、接触事件、失败日志、已有搜索记录和资产测量证据。

1. 检查坐标、尺度、同步、初态与实际输入，排除明显观测问题。
2. 保留少量竞争解释，逐一列出支持、反对证据和适用条件。
3. 按需要检索文献与技能，写出能够推翻解释的具体观测。

**输出与失败处理**：输出 hypothesis_record 与优先级。证据不足时给出补测建议，不将语言模型判断当作物理真值。

### 选择能区分解释的实验

在可执行动作与有限预算内，选择最可能改变研究判断的下一步。

**输入**：竞争模型、参数候选集合、动作约束、传感器噪声与采集成本。

1. 列出可改变的动作因素，固定其余控制变量。
2. 用噪声归一化的预测分歧筛选动作，并检查可观测性与可执行性。
3. 登记干预、观测、参数边界、预算和否证条件。

**输出与失败处理**：输出 ExperimentSpec 或真实测量请求。补测后创建新数据版本，基线与候选共同重评，封存测试保持隔离。

### 同动作仿真与有界参数辨识

在明确的模型、输入与参数范围内，迭代求解数值估计问题。

**输入**：冻结的 experiment、模型 M、参数范围 θ、已约束的辅助参数 η 与拟合 episode。

1. 对参数做量纲与边界检查，在固定输入下运行仿真。
2. 计算可用观测残差，按预算选择有界无梯度或可微优化。
3. 检查敏感性、参数耦合、多起点结果与数值收敛。

**输出与失败处理**：输出候选参数、预测范围、成本和辨识诊断。搜索失败先定位实现或模型问题；多组解等价时保留参数族。

### 开发验证、比较与选择

检查一次改动是否带来可复现的预测收益，并明确接受、拒绝或证据不足。

**输入**：当前基线、候选模型、冻结的开发协议、逐 episode 预测和运行成本。

1. 在相同开发动作上重放新旧模型，核查关键行为与约束。
2. 同时比较预测误差、失败率、复杂度和计算成本。
3. 按预先约定的规则作出判定，绑定具体证据与版本。

**输出与失败处理**：输出 decision_record。拟合改善但开发退化则回滚；无区分力则安排补测。此阶段不读取封存测试。

### 继承模型、代码与适用条件

让研究积累为可复查的模型谱系和可复用技能，而不是仅积累对话。

**输入**：假设、实验规范、补丁、运行记录、评估判定、物体与接触条件。

1. 成功候选成为新基线，失败候选保留原因与反例。
2. 将通过回归的建模 / 诊断程序封装为带前置条件的技能。
3. 新资产调用前检查适用范围；模型冻结后另行安排独立测试。

**输出与失败处理**：输出 lineage、SkillPackage 与 TwinPackage。继承的是经过验证的程序及条件，不是无条件通用的物理参数。


## 附录 B：研究谱系节点

### 建立最小可检验模型

**研究问题**：现有几何、夹持边界和动作输入，能否解释压缩、回弹和吸液的先后顺序？

**具体实验**：检查装配与持管支撑；先回放压缩动作，再单独比较空载回弹和吸液阶段。

**判定依据**：结构与输入检查通过后进入参数辨识；若事件顺序错误，优先修正协议或模型边界。

**后续分支**：分别检验时间对齐、有效流阻和胶头回弹三类解释。

### 液面变化是否只是时间没有对齐？

**研究问题**：如果把真实动作的开始时间对齐，残差形状是否明显改变？

**具体实验**：在同视野记录夹爪释放、胶头回弹与液面起点；固定物性，估计同步与执行器时延。

**判定依据**：修订必须落在独立同步测量支持的范围；不能用自由时间变形掩盖动力学误差。

**后续分支**：若对齐后仍存在幅度或速度相关的偏差，进入流阻与回弹分支。

### 有效流阻是否能够解释吸液过慢？

**研究问题**：在胶头输入已约束时，改变流阻能否同时解释不同压差下的液面曲线？

**具体实验**：固定胶头模型与几何，搜索有界流阻；使用多个释放 / 浸入条件，必要时同步测压。

**判定依据**：候选需改善未拟合工况的开发预测；只有单条曲线改善时证据不充分。

**后续分支**：若流阻与气腔顺应性高度耦合，进入主动补测；若跨速度偏差仍在，比较模型机制。

### 弹性近似是否遗漏了胶头的时间效应？

**研究问题**：同样的压缩深度，在不同加载速度或保持时间下是否出现系统性不同的回弹？

**具体实验**：先做无吸液的机械实验。比较低阶弹性与黏弹性候选，必要时让 Coding Agent 实现最小机制补丁。

**判定依据**：新模型需通过单位、极限条件、稳定性与回归；开发预测收益必须覆盖复杂度和计算成本。

**后续分支**：没有收益则保留简单模型；若力和壁厚缺失，报告有效模型，不宣称材料常数已辨识。

### 安排最能区分候选的下一次实验

**研究问题**：现有候选对哪些可执行动作预测分歧最大，且差异高于观测噪声？

**具体实验**：枚举压缩深度、释放速度和浸入条件；必要时增加气腔压力观测。先仿真筛选，再提交真实测量请求。

**判定依据**：选择有可测分歧、成本合适的动作；真实采集完成前不将预测写入观测。

**后续分支**：新数据建立版本，同时重评基线与候选；封存测试不进入补测或选择循环。

### 在同一协议下比较候选

**研究问题**：候选改善的是跨动作预测，还是只对拟合数据更灵活？

**具体实验**：以相同开发 episode、环境、动作和指标比较新旧模型；报告逐 episode 误差、失败和成本。

**判定依据**：符合预先登记的接受条件才保留。无提升则拒绝；噪声范围内无法区分则保留歧义。

**后续分支**：需要进一步研究时返回假设或补测节点；预算结束或满足停止条件时冻结候选。

### 冻结选定模型与结论范围

**研究问题**：读者能否用相同数据、代码与环境得到同一候选？

**具体实验**：打包 scene、参数来源、代码提交、环境锁、重放动作、开发报告和已知失败条件。

**判定依据**：模型、观测处理和评价协议均有版本；缺测与不可辨识量已明确列出。

**后续分支**：开启最终独立测试。若尚待关键测量，状态保持“证据不足”，不自动升级结论。

### 检验新动作上的预测

**研究问题**：冻结模型对新的压缩、释放与浸入条件，是否仍能预测回弹、液面和吸液量？

**具体实验**：在封存 episode 上执行开放式多步预测，分别报告插值、外推、跨物体和失败案例。

**判定依据**：最终结论仅覆盖已测试条件；预测能力与参数辨识结论分开表述。

**后续分支**：发布验证报告。若根据测试失败继续改模型，启动新的研究周期并准备新的独立测试。


## 附录 C：资产与滴管研究阶段

### 胶头滴管

玻璃管、胶头和气腔分别建模；以装配关系连接，不能把一个视觉网格直接当成完整物理模型。

**表示**：玻璃刚体；胶头先用经验证的低阶模型，需要局部形变时再选壳 / 体模型；气腔与管路单独建模。

**测量**：内外径、胶头壁厚或体积、压缩位移、回弹轨迹、液面；按辨识目标补充力 / 压力。

**验收**：开口与内腔保留、胶头装配和持管支撑正确、无穿透；形变与吸液分别验证。

### 烧杯

烧杯的内腔和杯口决定可达空间；外观相似的封闭碰撞体无法支持插入、接触和倒液研究。

**表示**：视觉薄壁几何与保留凹部的刚体碰撞代理分开；液体使用另一个物理模块。

**测量**：杯口、内外径、壁厚、底部与质量；透明区域优先用已知尺寸和多视角约束。

**验收**：静置稳定；管尖和玻璃棒能进入内腔；外壁与内壁接触分别检查。

### 试管

先用刚体近似玻璃试管，明确圆底、内腔和开口，再研究夹持、倾倒与容器间接触。

**表示**：分段凹腔碰撞；视觉几何独立；需要液体时加入体积与流动关系。

**测量**：管长、内外径、圆底曲率、空管质量；抓取和放置的真实位姿。

**验收**：不能用实心凸包封住管口；检查滚动、倾倒、夹持接触与支撑。

### 玻璃棒

细长轴的长度和姿态会影响接触与惯量；搅拌中的阻力来自流体，不能全部归因于固体摩擦。

**表示**：细长刚体及合适的碰撞几何；只有观察到弯曲时才添加柔性表示。

**测量**：长度、直径、质量、持握位置与运动轨迹；搅拌时补充流体条件。

**验收**：轴向与质心正确；小尺度接触不穿透；固体接触和流体阻力分开评估。

### 锥形瓶

窄颈和内部空间决定滴管的插入与摆放，内外接触应共用一致的尺度和装配定义。

**表示**：瓶颈、瓶身、底部的组合碰撞表示；保留进入路径与实际内腔。

**测量**：瓶口、瓶颈、底面、内部尺寸与质量；滴管摆放时的接触与支撑点。

**验收**：验证入口可达、内壁接触和桌面稳定性；不把悬空状态默认为支撑。

### 两指夹爪

先约束驱动与输入，再估计接触。控制误差和指垫形变可能被物体材料参数错误吸收。

**表示**：关节链、驱动器、指垫碰撞；按实际接触形变选择柔性或有效顺应模型。

**测量**：开口零位、位置 / 速度响应、时延、夹持力和指垫表面；动作以实测为准。

**验收**：先检查空载轨迹和限位，再测夹持与接触；释放胶头时仍需要明确持管支撑。

### 先让每个边界条件有物理对应。

从视频恢复部件和装配关系，用实测补齐透明表面、壁厚与内部容积。坐标、单位、接触位置和管尖开口统一登记。

1. 分别建立玻璃管、胶头、烧杯与夹持支撑。
2. 测量管径、管长、浸入深度；跟踪胶头压缩量。
3. 检查支撑、密封连接、碰撞开口和动作时序。

**阶段条件**：结构与动作回放通过检查；未测内部几何保留范围，不借调材料参数补偿。

### 先解释压缩与回弹，再连接吸液。

在无吸液条件下记录胶头的加载、保持与释放。用不同幅度和速度区分弹性、黏弹性及边界误差。

1. 使用多个压缩深度与加载速度，记录真实位移。
2. 有力传感时比较力—位移、迟滞和松弛；无力时限制参数结论。
3. 先拟合低阶模型；局部屈曲或接触迁移明显时，再比较壳 / 体模型。

**阶段条件**：未参与拟合的压缩 / 释放动作预测通过协议；材料参数与壁厚、边界的耦合已经报告。

### 让气腔、管路与胶头共享状态。

连接胶头体积变化、气腔压力、液面和流量；密封、毛细与流阻是需要检验的假设，而不是固定常识填空。

1. 先确认压缩—浸入—释放的动作顺序和持管支撑。
2. 用液面轨迹与最终体积拟合有效模型；必要时补充压力观测。
3. 比较流阻、回弹与泄漏对曲线的影响，主动选择预测分歧最大的可执行工况。

**阶段条件**：多种输入条件下预测一致；无法区分流阻与顺应性时输出参数族和压力测量请求。

### 冻结模型，在新条件下检验。

预先留出压缩深度、释放速度与浸入条件，并将插值、外推和新物体分别报告。

1. 冻结代码、几何、参数、动作处理和评价器版本。
2. 开放式预测完整回弹和液面过程，不逐帧用真实状态纠正仿真。
3. 记录液面曲线、体积、回弹误差与失败；必要时给出超出适用范围的判定。

**阶段条件**：以独立 episode 作最终报告；若利用测试结果继续修改模型，需要新的独立测试协议。
