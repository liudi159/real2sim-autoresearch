'use strict';
const modules={
observe:{num:'01',label:'自动标注',title:'观测事实与物理属性先验 / Observation & Prior',input:'多视角图像、物体掩码、尺度与已有网格；可选动态视频和音频。',process:'定位对象和部件，识别可见材料线索，生成属性候选、区间和待验证问题。',output:'结构化属性先验；没有实例证据的质量或摩擦只标为估计，不能升级成实测标签。'},
knowledge:{num:'02',label:'知识校验',title:'硬约束与软先验校验 / Constraint Verification',input:'初始属性候选，以及带来源、条件和测量方法的物理知识记录。',process:'硬约束检查数值、单位与公式前提；软先验检查材料范围。冲突进入诊断队列，检查结构、装载状态或新材料。',output:'通过检查的弱标签 + 冲突记录。知识匹配不是实际测量，也不是独立真值。'},
assets:{num:'03',label:'证据资产库',title:'属性级证据溯源 / Property-level Provenance',input:'几何、参数先验、同步交互，以及经过独立验证的辨识结果。',process:'按对象、部件、状态和接触双方组织属性；保留旧值、新值、条件、证据与方法；构建版本固定的数据快照。',output:'可查询资产、可重放交互与训练快照。实测与推断分别标记，训练与测试按物体家族隔离。'},
sft:{num:'04',label:'监督微调 SFT',title:'结构化标注与证据修订 / Annotation & Revision',input:'按质量加权的弱标签、小批量标定测量、历史回放，以及交互前后的修订样本。',process:'对齐视觉、音频、触觉与力／动作编码；学习属性、事件、预测、证据引用、不确定性和测量请求。',output:'初始领域 VLM。先训练投影层，再做参数高效微调；分别检查不同模态组合，防止接触后信息泄漏。'},
grpo:{num:'05',label:'可验证 GRPO',title:'候选回答的可验证奖励 / Verifiable Reward',input:'同一观测的多组回答、独立测量的训练参考或可重放真实轨迹，以及预先固定的评分协议。',process:'按属性、物理预测、置信区间、事件和证据评分；计算组内相对优势。答案优化与高层动作优化分别训练。',output:'候选标注模型。验证未见资产、校准与遗忘；一组全错时回到难例采集或 SFT，不能自行编造奖励。'},
probe:{num:'06',label:'主动接触与辨识',title:'信息驱动的实验设计 / Active Experimental Design',input:'待验证属性、候选参数分布、可执行测量技能，以及时间和接触预算。',process:'先选择资产，再比较换视角、提起、滑动或按压的预计信息收益。同步采集触觉、力与动作；辨识参数并用新实验检查。',output:'参数后验、残差、有效范围或不可辨识说明。回写资产库并形成纠错样本，供下一批训练使用。'}
};
const moduleButtons=[...document.querySelectorAll('[data-module]')];
moduleButtons.forEach(button=>button.addEventListener('click',()=>{
 const d=modules[button.dataset.module]; moduleButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.querySelector('#module-detail').innerHTML=`<p class="eyebrow">${d.num} / ${d.label}</p><h3>${d.title}</h3><div class="detail-columns"><div><h4>输入</h4><p>${d.input}</p></div><div><h4>具体处理</h4><p>${d.process}</p></div><div><h4>输出与检查</h4><p>${d.output}</p></div></div>`;
}));
const probes={
view:{label:'ACTIVE VISION',title:'主动视觉观测 / Active Visual Observation',body:'查看底部、遮挡区域和反光变化，检查部件、支撑与材质假设。它可能减少几何不确定性，但不能保证识别封闭盒子的内部填充和质量。',evidence:'直接证据：新视角图像 / 深度',unknown:'仍待验证：质量与内部结构'},
press:{label:'CONTROLLED INDENTATION',title:'接触刚度辨识 / Contact Stiffness Identification',body:'在指定位置分级按压，记录力—位移和卸载曲线。先扣除夹具与触觉胶体形变，再估计该位置、该加载方式下的有效刚度；不能直接把它等同于材料杨氏模量。',evidence:'直接证据：形变 / 力 / 接触区域',unknown:'仍待验证：全局质量与材料本构'},
lift:{label:'QUASI-STATIC LIFT',title:'准静态质量辨识 / Quasi-static Mass Identification',body:'在稳定抓取、低加速度条件下读取净载荷，扣除工具自重和传感器偏置后估计质量。如果触觉发现滑移，先判断该段数据是否有效，再进行质量估计。',evidence:'直接证据：净载荷 / 抓取稳定性',unknown:'仍待验证：填充材料的化学种类'},
slide:{label:'CONTROLLED SLIDING',title:'条件化摩擦辨识 / Conditional Friction Identification',body:'指定盒子底面和测试表面，控制法向载荷与滑动速度，比较切向力。记录静止到滑动的变化，并区分静、动摩擦。仅看自由滑动距离，通常不能唯一确定质量。',evidence:'直接证据：切向力 / 法向力 / 滑移',unknown:'仍待验证：其他表面或载荷下的摩擦'}
};
const probeButtons=[...document.querySelectorAll('[data-probe]')];
probeButtons.forEach(button=>button.addEventListener('click',()=>{
 const d=probes[button.dataset.probe];probeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.querySelector('#probe-detail').innerHTML=`<p class="eyebrow">${d.label}</p><h3>${d.title}</h3><p>${d.body}</p><div class="probe-result"><span>${d.evidence}</span><span>${d.unknown}</span></div>`;
}));
const cases=[
{label:'视觉先验',title:'视觉属性先验 / Visual Property Prior',body:'模型识别出外壳形状、可见材料与抓取区域。内部不可见，因此质量保持宽先验，不输出一个假装测过的精确值。',items:['可见事实：黑色、封闭、规则外壳。','未知项：空壳还是有填充物。','输出：质量待验证；建议获取载荷证据。'],version:'v0',code:'mass.value: null\nmass.source: visual_prior\ninterior: unknown\nnext_probe: quasi_static_lift'},
{label:'知识库检查',title:'材料与结构先验 / Material & Structural Priors',body:'知识库检查尺寸与材料是否合理，但盒子的填充状态未知。它可以保留“空壳”和“有填充物”两个解释，不能把常见空盒质量直接写成真值。',items:['检查单位、尺寸和部件关系。','记录候选结构与知识来源。','提出能区分两种解释的动作。'],version:'v1',code:'mass.value: null\nevidence_level: kb_checked\nhypotheses:\n  - empty_shell\n  - filled_shell\nneed_evidence: net_load'},
{label:'真实接触 · 教学示意',title:'标定载荷测量 / Calibrated Load Measurement',body:'假设有效片段中净载荷约为 2.16 N，在准静态条件下，m ≈ F/g ≈ 0.22 kg。触觉用于检查是否稳定接触；质量信息主要来自经过标定的载荷。',items:['扣除工具自重与力传感器偏置。','排除加速、碰撞和明显滑移片段。','重复测量，按噪声与标定误差估计区间。'],version:'v2 · 示例',code:'net_load_N: 2.16  # 示例\nacceleration: near_zero\ncontact: stable\nmass_estimate_kg: 0.22\nevidence: lift_episode_03'},
{label:'更新与独立检查',title:'属性后验更新 / Property Posterior Update',body:'使用独立称重或另一组有效测量检查质量估计。通过检查后，升级“质量”这条属性的证据等级，保留原预测与修改原因；摩擦和内部材料仍保留未知状态。',items:['质量：记录 0.22 kg 示例值与测量区间。','证据：关联载荷片段、标定和独立检查。','未知项：摩擦、填充材质和其他装载状态。'],version:'v3 · 示例',code:'mass.value_kg: 0.22  # 示例\ninterval: from_repeat_measurements\nsource: interaction_inferred\nvalidation: independent_weighing\nfriction: unknown\nfill_material: unknown'},
{label:'回流训练',title:'证据回流与持续学习 / Evidence-driven Continual Learning',body:'生成接触前的合理不确定样本，以及接触后的证据修订样本。积累一个批次后做 SFT 和 GRPO，再用未见盒子评价；不在每次接触后立即改权重。',items:['保存旧标签、新标签和同步输入。','混合新证据与历史回放，降低遗忘。','在新物体上检查准确度、校准与测量成本。'],version:'dataset snapshot',code:'sample_A: pre_contact_uncertainty\nsample_B: post_contact_revision\ntrain: SFT_then_GRPO\nreplay: historical_evidence\nevaluate: unseen_asset_families'}
];
const tabs=[...document.querySelectorAll('[data-step]')];
function chooseStep(index,focus=false){
 const d=cases[index];tabs.forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;});
 const panel=document.querySelector('#case-panel');panel.setAttribute('aria-labelledby',`case-tab-${index}`);
 panel.innerHTML=`<div class="case-copy"><span class="eyebrow">${d.label}</span><h3>${d.title}</h3><p>${d.body}</p><ul>${d.items.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="case-record"><span>ASSET RECORD / ${d.version}</span><pre><code></code></pre></div>`;
 panel.querySelector('code').textContent=d.code;if(focus)tabs[index].focus();
}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>chooseStep(index));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();chooseStep(next,true);}});});
const sections=[...document.querySelectorAll('.chapter')],tocLinks=[...document.querySelectorAll('.toc nav a')];
let queued=false;
function updateReading(){queued=false;const pos=window.scrollY+150;let active=sections[0];for(const section of sections){if(section.offsetTop<=pos)active=section;}tocLinks.forEach(link=>{const selected=link.hash===`#${active.id}`;link.classList.toggle('active',selected);if(selected)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});const article=document.querySelector('#article');const range=Math.max(1,article.offsetHeight-window.innerHeight+140);const progress=Math.round(Math.min(100,Math.max(0,(window.scrollY-article.offsetTop+140)/range*100)));document.querySelector('#reading-progress').style.width=`${progress}%`;document.querySelector('#reading-label').textContent=`阅读进度 ${progress}%`;}
window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateReading);}},{passive:true});window.addEventListener('resize',updateReading);updateReading();
