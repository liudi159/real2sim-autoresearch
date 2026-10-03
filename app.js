'use strict';
const $ = id => document.getElementById(id);
const text = (id, value) => { $(id).textContent = value; };
function list(id, values) {
  $(id).replaceChildren(...values.map(value => {
    const li = document.createElement('li'); li.textContent = value; return li;
  }));
}
function tabs(selector, key, render, panelId) {
  const items = [...document.querySelectorAll(selector)];
  const activate = button => {
    items.forEach(item => {
      const active = item === button;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    if (panelId) $(panelId).setAttribute('aria-labelledby', button.id);
    render(button.dataset[key]);
  };
  items.forEach((button, index) => {
    button.addEventListener('click', () => activate(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % items.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = items.length - 1;
      else return;
      event.preventDefault(); activate(items[next]); items[next].focus();
    });
  });
}
const modules = {
evidence: {
  kicker:'MODULE 01 · EVIDENCE',title:'整理真实证据',
  description:'把真实交互转成可比较的 episode，并显式记录缺失和不可靠观测。',
  input:'带时间戳的视频、可选深度与动作日志；相机参数、实测尺寸及可选力信号。',
  steps:['按对象身份跟踪位姿、轮廓和关键事件。','用已知尺寸确定尺度，标记遮挡与估计误差。','保留原始数据，建立可重放的动作和观测版本。'],
  output:'输出 episode、质量标记与测量来源。动作或尺度缺失时进入补测分支，不推断唯一材料参数。'
},
scene: {
  kicker:'MODULE 02 · SCENE',title:'建立可执行场景',
  description:'把视觉对象变成具有明确单位、接触、支撑与动力学表示的仿真对象。',
  input:'对象级几何、实测尺寸、装配与支撑关系；已知机器人结构与动作类型。',
  steps:['为每个 object_id 分配视觉、碰撞、物理表示和统一坐标。','选择刚体、关节、杆、壳或体模型；将开口与内腔保留在碰撞代理中。','执行静置、无碰撞运动、接触和步长细化检查。'],
  output:'输出 scene v0、AssetSpec 和检查日志。穿透或不稳定时先修几何、边界与求解器；不直接进入参数拟合。'
},
contract: {
  kicker:'MODULE 03 · PROTOCOL',title:'冻结实验协议',
  description:'让所有候选在相同的观测、指标、资源与接受条件下比较。',
  input:'按 episode 分组的数据、目标可观测量、噪声估计、实验与计算预算。',
  steps:['按物体、动作或采集批次划分拟合、开发与封存测试集。','确定残差归一化、权重、关键失败指标和停止规则。','锁定评估器与环境版本，隔离最终测试访问。'],
  output:'输出 protocol 与 evaluator。必要协议修订必须版本化，并用新协议同时重评基线和候选。'
},
diagnose: {
  kicker:'MODULE 04 · DIAGNOSE',title:'诊断并提出可证伪假设',
  description:'利用误差发生的时间、部位和条件，区分观测问题、参数偏差与缺失机制。',
  input:'逐阶段残差、接触事件、失败日志、已有搜索记录和资产测量证据。',
  steps:['检查坐标、尺度、同步、初态与实际输入，排除明显观测问题。','保留少量竞争解释，逐一列出支持、反对证据和适用条件。','按需要检索文献与技能，写出能够推翻解释的具体观测。'],
  output:'输出 hypothesis_record 与优先级。证据不足时给出补测建议，不将语言模型判断当作物理真值。'
},
design: {
  kicker:'MODULE 05 · DESIGN',title:'选择能区分解释的实验',
  description:'在可执行动作与有限预算内，选择最可能改变研究判断的下一步。',
  input:'竞争模型、参数候选集合、动作约束、传感器噪声与采集成本。',
  steps:['列出可改变的动作因素，固定其余控制变量。','用噪声归一化的预测分歧筛选动作，并检查可观测性与可执行性。','登记干预、观测、参数边界、预算和否证条件。'],
  output:'输出 ExperimentSpec 或真实测量请求。补测后创建新数据版本，基线与候选共同重评，封存测试保持隔离。'
},
identify: {
  kicker:'MODULE 06 · IDENTIFY',title:'同动作仿真与有界参数辨识',
  description:'在明确的模型、输入与参数范围内，迭代求解数值估计问题。',
  input:'冻结的 experiment、模型 M、参数范围 θ、已约束的辅助参数 η 与拟合 episode。',
  steps:['对参数做量纲与边界检查，在固定输入下运行仿真。','计算可用观测残差，按预算选择有界无梯度或可微优化。','检查敏感性、参数耦合、多起点结果与数值收敛。'],
  output:'输出候选参数、预测范围、成本和辨识诊断。搜索失败先定位实现或模型问题；多组解等价时保留参数族。'
},
review: {
  kicker:'MODULE 07 · REVIEW',title:'开发验证、比较与选择',
  description:'检查一次改动是否带来可复现的预测收益，并明确接受、拒绝或证据不足。',
  input:'当前基线、候选模型、冻结的开发协议、逐 episode 预测和运行成本。',
  steps:['在相同开发动作上重放新旧模型，核查关键行为与约束。','同时比较预测误差、失败率、复杂度和计算成本。','按预先约定的规则作出判定，绑定具体证据与版本。'],
  output:'输出 decision_record。拟合改善但开发退化则回滚；无区分力则安排补测。此阶段不读取封存测试。'
},
memory: {
  kicker:'MODULE 08 · INHERIT',title:'继承模型、代码与适用条件',
  description:'让研究积累为可复查的模型谱系和可复用技能，而不是仅积累对话。',
  input:'假设、实验规范、补丁、运行记录、评估判定、物体与接触条件。',
  steps:['成功候选成为新基线，失败候选保留原因与反例。','将通过回归的建模 / 诊断程序封装为带前置条件的技能。','新资产调用前检查适用范围；模型冻结后另行安排独立测试。'],
  output:'输出 lineage、SkillPackage 与 TwinPackage。继承的是经过验证的程序及条件，不是无条件通用的物理参数。'
}
};
document.querySelectorAll('[data-module]').forEach(button => {
  button.addEventListener('click', () => {
    const value = modules[button.dataset.module];
    document.querySelectorAll('[data-module]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    ['kicker','title','description','input','output'].forEach(key => text('module-' + key, value[key]));
    list('module-steps', value.steps);
  });
});
const assets = {
pipette:['RIGID + DEFORMABLE + FLUID','胶头滴管','玻璃管、胶头和气腔分别建模；以装配关系连接，不能把一个视觉网格直接当成完整物理模型。','玻璃刚体；胶头先用经验证的低阶模型，需要局部形变时再选壳 / 体模型；气腔与管路单独建模。','内外径、胶头壁厚或体积、压缩位移、回弹轨迹、液面；按辨识目标补充力 / 压力。','开口与内腔保留、胶头装配和持管支撑正确、无穿透；形变与吸液分别验证。'],
beaker:['OPEN CONTAINER · RIGID','烧杯','烧杯的内腔和杯口决定可达空间；外观相似的封闭碰撞体无法支持插入、接触和倒液研究。','视觉薄壁几何与保留凹部的刚体碰撞代理分开；液体使用另一个物理模块。','杯口、内外径、壁厚、底部与质量；透明区域优先用已知尺寸和多视角约束。','静置稳定；管尖和玻璃棒能进入内腔；外壁与内壁接触分别检查。'],
tube:['THIN-WALLED VESSEL · RIGID','试管','先用刚体近似玻璃试管，明确圆底、内腔和开口，再研究夹持、倾倒与容器间接触。','分段凹腔碰撞；视觉几何独立；需要液体时加入体积与流动关系。','管长、内外径、圆底曲率、空管质量；抓取和放置的真实位姿。','不能用实心凸包封住管口；检查滚动、倾倒、夹持接触与支撑。'],
rod:['SLENDER OBJECT · RIGID','玻璃棒','细长轴的长度和姿态会影响接触与惯量；搅拌中的阻力来自流体，不能全部归因于固体摩擦。','细长刚体及合适的碰撞几何；只有观察到弯曲时才添加柔性表示。','长度、直径、质量、持握位置与运动轨迹；搅拌时补充流体条件。','轴向与质心正确；小尺度接触不穿透；固体接触和流体阻力分开评估。'],
flask:['CONCAVE VESSEL · RIGID','锥形瓶','窄颈和内部空间决定滴管的插入与摆放，内外接触应共用一致的尺度和装配定义。','瓶颈、瓶身、底部的组合碰撞表示；保留进入路径与实际内腔。','瓶口、瓶颈、底面、内部尺寸与质量；滴管摆放时的接触与支撑点。','验证入口可达、内壁接触和桌面稳定性；不把悬空状态默认为支撑。'],
gripper:['ACTUATOR + ARTICULATION + CONTACT','两指夹爪','先约束驱动与输入，再估计接触。控制误差和指垫形变可能被物体材料参数错误吸收。','关节链、驱动器、指垫碰撞；按实际接触形变选择柔性或有效顺应模型。','开口零位、位置 / 速度响应、时延、夹持力和指垫表面；动作以实测为准。','先检查空载轨迹和限位，再测夹持与接触；释放胶头时仍需要明确持管支撑。']
};
tabs('[data-asset]','asset',key => {
  ['tag','name','description','representation','measurement','validation'].forEach((field,i) => text('asset-'+field,assets[key][i]));
},'asset-detail');

const cases = {
geometry:['STAGE A · GEOMETRY','先让每个边界条件有物理对应。','从视频恢复部件和装配关系，用实测补齐透明表面、壁厚与内部容积。坐标、单位、接触位置和管尖开口统一登记。',['分别建立玻璃管、胶头、烧杯与夹持支撑。','测量管径、管长、浸入深度；跟踪胶头压缩量。','检查支撑、密封连接、碰撞开口和动作时序。'],'结构与动作回放通过检查；未测内部几何保留范围，不借调材料参数补偿。'],
mechanics:['STAGE B · MECHANICS','先解释压缩与回弹，再连接吸液。','在无吸液条件下记录胶头的加载、保持与释放。用不同幅度和速度区分弹性、黏弹性及边界误差。',['使用多个压缩深度与加载速度，记录真实位移。','有力传感时比较力—位移、迟滞和松弛；无力时限制参数结论。','先拟合低阶模型；局部屈曲或接触迁移明显时，再比较壳 / 体模型。'],'未参与拟合的压缩 / 释放动作预测通过协议；材料参数与壁厚、边界的耦合已经报告。'],
flow:['STAGE C · COUPLING','让气腔、管路与胶头共享状态。','连接胶头体积变化、气腔压力、液面和流量；密封、毛细与流阻是需要检验的假设，而不是固定常识填空。',['先确认压缩—浸入—释放的动作顺序和持管支撑。','用液面轨迹与最终体积拟合有效模型；必要时补充压力观测。','比较流阻、回弹与泄漏对曲线的影响，主动选择预测分歧最大的可执行工况。'],'多种输入条件下预测一致；无法区分流阻与顺应性时输出参数族和压力测量请求。'],
transfer:['STAGE D · TRANSFER','冻结模型，在新条件下检验。','预先留出压缩深度、释放速度与浸入条件，并将插值、外推和新物体分别报告。',['冻结代码、几何、参数、动作处理和评价器版本。','开放式预测完整回弹和液面过程，不逐帧用真实状态纠正仿真。','记录液面曲线、体积、回弹误差与失败；必要时给出超出适用范围的判定。'],'以独立 episode 作最终报告；若利用测试结果继续修改模型，需要新的独立测试协议。']
};
tabs('[data-case]','case',key => {
  const value=cases[key];
  ['kicker','title','description'].forEach((field,i)=>text('case-'+field,value[i]));
  list('case-actions',value[3]);text('case-gate',value[4]);
},'case-panel');

tabs('[data-view]','view',key=>{
  ['lineage','experiment','decision'].forEach(view=>{$('view-'+view).hidden=view!==key;});
});
const lineage={
baseline:['BASELINE · 起点','建立最小可检验模型','现有几何、夹持边界和动作输入，能否解释压缩、回弹和吸液的先后顺序？','检查装配与持管支撑；先回放压缩动作，再单独比较空载回弹和吸液阶段。','结构与输入检查通过后进入参数辨识；若事件顺序错误，优先修正协议或模型边界。','分别检验时间对齐、有效流阻和胶头回弹三类解释。'],
alignment:['HYPOTHESIS η · 辅助参数','液面变化是否只是时间没有对齐？','如果把真实动作的开始时间对齐，残差形状是否明显改变？','在同视野记录夹爪释放、胶头回弹与液面起点；固定物性，估计同步与执行器时延。','修订必须落在独立同步测量支持的范围；不能用自由时间变形掩盖动力学误差。','若对齐后仍存在幅度或速度相关的偏差，进入流阻与回弹分支。'],
resistance:['HYPOTHESIS θ · 参数','有效流阻是否能够解释吸液过慢？','在胶头输入已约束时，改变流阻能否同时解释不同压差下的液面曲线？','固定胶头模型与几何，搜索有界流阻；使用多个释放 / 浸入条件，必要时同步测压。','候选需改善未拟合工况的开发预测；只有单条曲线改善时证据不充分。','若流阻与气腔顺应性高度耦合，进入主动补测；若跨速度偏差仍在，比较模型机制。'],
viscoelastic:['HYPOTHESIS M · 模型结构','弹性近似是否遗漏了胶头的时间效应？','同样的压缩深度，在不同加载速度或保持时间下是否出现系统性不同的回弹？','先做无吸液的机械实验。比较低阶弹性与黏弹性候选，必要时让 Coding Agent 实现最小机制补丁。','新模型需通过单位、极限条件、稳定性与回归；开发预测收益必须覆盖复杂度和计算成本。','没有收益则保留简单模型；若力和壁厚缺失，报告有效模型，不宣称材料常数已辨识。'],
probe:['ACTIVE MEASUREMENT · 证据','安排最能区分候选的下一次实验','现有候选对哪些可执行动作预测分歧最大，且差异高于观测噪声？','枚举压缩深度、释放速度和浸入条件；必要时增加气腔压力观测。先仿真筛选，再提交真实测量请求。','选择有可测分歧、成本合适的动作；真实采集完成前不将预测写入观测。','新数据建立版本，同时重评基线与候选；封存测试不进入补测或选择循环。'],
compare:['DEVELOPMENT · 判定','在同一协议下比较候选','候选改善的是跨动作预测，还是只对拟合数据更灵活？','以相同开发 episode、环境、动作和指标比较新旧模型；报告逐 episode 误差、失败和成本。','符合预先登记的接受条件才保留。无提升则拒绝；噪声范围内无法区分则保留歧义。','需要进一步研究时返回假设或补测节点；预算结束或满足停止条件时冻结候选。'],
freeze:['FREEZE · 版本','冻结选定模型与结论范围','读者能否用相同数据、代码与环境得到同一候选？','打包 scene、参数来源、代码提交、环境锁、重放动作、开发报告和已知失败条件。','模型、观测处理和评价协议均有版本；缺测与不可辨识量已明确列出。','开启最终独立测试。若尚待关键测量，状态保持“证据不足”，不自动升级结论。'],
heldout:['HELD-OUT · 独立检验','检验新动作上的预测','冻结模型对新的压缩、释放与浸入条件，是否仍能预测回弹、液面和吸液量？','在封存 episode 上执行开放式多步预测，分别报告插值、外推、跨物体和失败案例。','最终结论仅覆盖已测试条件；预测能力与参数辨识结论分开表述。','发布验证报告。若根据测试失败继续改模型，启动新的研究周期并准备新的独立测试。']
};
const nodes=[...document.querySelectorAll('[data-node]')];
let nodeIndex=0;
function selectNode(index){
  nodeIndex=Math.max(0,Math.min(nodes.length-1,index));
  const selected=nodes[nodeIndex];
  nodes.forEach(node=>node.setAttribute('aria-pressed',String(node===selected)));
  const value=lineage[selected.dataset.node];
  ['kind','title','question','experiment','rule','next'].forEach((field,i)=>text('lineage-'+field,value[i]));
  text('node-count',String(nodeIndex+1).padStart(2,'0')+' / 08');
  $('prev-node').disabled=nodeIndex===0;
  $('next-node').disabled=nodeIndex===nodes.length-1;
}
nodes.forEach((node,index)=>node.addEventListener('click',()=>selectNode(index)));
$('prev-node').addEventListener('click',()=>selectNode(nodeIndex-1));
$('next-node').addEventListener('click',()=>selectNode(nodeIndex+1));
selectNode(0);

const refGroups=[...document.querySelectorAll('.reference-group')];
const initialOpen=refGroups.map(group=>group.open);
$('reference-search').addEventListener('input',event=>{
  const query=event.target.value.trim().toLocaleLowerCase();
  let count=0;
  refGroups.forEach((group,index)=>{
    let matches=0;
    group.querySelectorAll('li').forEach(item=>{
      const visible=!query||item.textContent.toLocaleLowerCase().includes(query);
      item.hidden=!visible;if(visible){count++;matches++;}
    });
    group.hidden=matches===0;
    group.open=query?matches>0:initialOpen[index];
  });
  text('reference-count',query?count+' 项匹配结果'+(count?'':'；请尝试其他关键词。'):'26 项文献与项目');
});

const navLinks=[...document.querySelectorAll('.site-header nav a')];
const sections=[...document.querySelectorAll('main section[id]')];
let scrollScheduled=false;
function updateScroll(){
  const threshold=160;
  const active=sections.filter(section=>section.getBoundingClientRect().top<=threshold).at(-1);
  navLinks.forEach(link=>{
    const selected=active&&link.hash==='#'+active.id;
    link.classList.toggle('active',!!selected);
    if(selected)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
  });
  $('back-top').classList.toggle('visible',window.scrollY>600);
  scrollScheduled=false;
}
window.addEventListener('scroll',()=>{if(!scrollScheduled){requestAnimationFrame(updateScroll);scrollScheduled=true;}},{passive:true});
$('back-top').addEventListener('click',()=>{$('top').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
updateScroll();

