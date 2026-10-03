'use strict';

const loopContent = {
  research: {tag:'REASON → TEST → DECIDE', title:'先解释误差，再决定改什么。', text:'读取残差和失败记录，提出最多三个竞争解释。检索能够改变实验决策的证据，调用已验证技能，在冻结的开发协议下接受、拒绝或保留候选。', chips:['竞争假设','实验预算','保留 / 回滚']},
  calibrate: {tag:'SIMULATE → COMPARE → UPDATE', title:'在明确边界内，估计参数与不确定性。', text:'固定相机、时间和控制协议，使用相同动作输入运行仿真。根据轨迹、力或形变残差优化物理参数，同时检查敏感性与参数耦合。优化结果保留其来源和有效范围。', chips:['相同动作输入','敏感性诊断','参数联合不确定性']},
  evidence: {tag:'PROBE → MEASURE → REMEMBER', title:'让新的观测，区分旧的解释。', text:'当多组参数都能解释现有数据时，选择最能放大预测差异的可执行动作。记录新数据版本、采集成本和失败案例，再用相同协议重评基线；封存测试保持独立。', chips:['主动测量','数据版本','证据记忆']}
};
const assetContent = {
  pipette:{tag:'RIGID + DEFORMABLE + FLUID',title:'胶头滴管',text:'玻璃管与柔性胶头分开建模；吸液过程还需要压力、容积与流量关系。',fields:['刚体玻璃 + 胶头壳 / 体模型','几何尺寸、压缩位移、回弹与吸液量','密封、边界固定、开口与接触位置']},
  beaker:{tag:'OPEN CONTAINER / RIGID BODY',title:'烧杯',text:'视觉网格与碰撞几何都要保留容器开口和内部空间，避免用封闭凸包填满容器。',fields:['刚体 + 保留凹部的碰撞部件','杯口、壁厚、底部尺寸与空杯质量','开口可达性、壁面接触、桌面支撑']},
  tube:{tag:'THIN GLASS / RIGID BODY',title:'试管',text:'以刚体作为第一层近似，分别检查外部接触与内部容积。透明外观不能提供可靠的厚度真值。',fields:['薄壁刚体 + 分解后的碰撞几何','长度、内外径、圆底形状与质量','开口保留、夹持接触、滚动与倾倒']},
  rod:{tag:'SLENDER OBJECT / RIGID BODY',title:'玻璃棒',text:'细长轴对尺度和惯量敏感。搅拌涉及流体阻力，单独的刚体接触不能解释全部行为。',fields:['细长刚体；有形变证据时再扩展','长度、直径、质量与持握位置','轴向对齐、惯量与容器碰撞']},
  flask:{tag:'CONCAVE GEOMETRY / RIGID BODY',title:'锥形瓶',text:'窄颈与内部空腔决定滴管的插入和摆放方式，碰撞代理必须保留这些结构。',fields:['刚体 + 颈部 / 瓶身分段碰撞','瓶口、瓶颈、底面和内部几何','滴管入口、支撑稳定性与内壁接触']},
  gripper:{tag:'ARTICULATED SYSTEM / CONTACT',title:'两指夹爪',text:'先明确输入是位置、速度还是力，再区分驱动误差、指垫接触与物体材料造成的偏差。',fields:['关节链 + 指垫碰撞；按需增加柔性','开口、零位、时延、夹持力与表面','关节限位、执行器响应和接触摩擦']}
};
const hypotheses = {
  friction:[
    ['定义可证伪解释','摩擦偏低，是否足以解释过长滑移？','先固定已校准的尺度、时间与初始状态。比较不同接触摩擦下的减速度形状，检查残差是否对该参数敏感。','需要的证据','同一接触表面上的完整滑动轨迹，以及可靠的初速度与时间戳。'],
    ['安排辨识实验','改变初速度，保留相同接触表面。','选择多个可测的初速度，比较候选摩擦参数对停止时间和滑移距离的预测。数值优化只使用拟合集。','冻结项','物体几何、已约束的初始状态、相机尺度、动作输入和开发验收指标。'],
    ['决定接受或补测','未见动作也改善，才保留候选。','用冻结的开发验证轨迹评估多步预测。如果摩擦与其他参数仍高度耦合，保留不确定性并安排额外测量。','最终验证','候选冻结后再运行封存测试；只有获得辨识证据的参数才标记为已辨识。']
  ],
  timing:[
    ['定义可证伪解释','相同形状的轨迹，是否只是错开了时间？','比较动作触发与运动起点的时间关系，检查残差是否主要表现为相位偏差，避免让摩擦吸收同步错误。','需要的证据','视频时间戳、动作日志、可对齐事件，以及时间同步的测量误差。'],
    ['安排辨识实验','用清晰的触发事件约束时间偏移。','采用记录完整的短动作，在固定物理参数时单独评估时间偏移和执行器时延。明确可观测的事件定义。','冻结项','接触模型、摩擦与几何；时间修订产生新的派生数据版本。'],
    ['决定接受或补测','先纠正对齐，再重新评估动力学。','若对齐修订改善了开发验证，重评依赖时间的测量与辨识结果。对齐仍不可靠时，不报告确定的材料参数。','后续动作','使用新版本同时重评基线与候选；保持最终测试隔离。']
  ],
  model:[
    ['定义可证伪解释','调遍参数后，误差形状为什么还在？','检查不同速度或载荷下是否存在一致的结构性残差。区分参数范围不足、观测问题和确实缺失的物理机制。','需要的证据','跨动作残差、参数搜索记录、接触状态与模型适用条件。'],
    ['安排辨识实验','设计能区分两种接触模型的动作。','比较模型在多种速度或载荷下的预测分歧。Coding Agent 在独立候选中实现必要机制，先验证单位、因果性和数值稳定性。','修改边界','可以修订已登记的模型机制；不修改真实观测、评估器与验收阈值。'],
    ['决定接受或补测','预测收益要抵得上新增复杂度。','以相同高保真开发协议评估新旧模型，并记录额外计算成本。局部拟合改善而未见动作退化时拒绝候选。','保留记录','接受、拒绝或证据不足都有版本与理由；失败补丁保留，工作基线可回滚。']
  ]
};

function replaceChildrenWithText(parent, tag, values, className='') {
  parent.replaceChildren(...values.map(value=>{const el=document.createElement(tag);el.className=className;el.textContent=value;return el;}));
}
function bindTabs(selector, key, panel, render) {
  const buttons=[...document.querySelectorAll(selector)];
  const activate=button=>{
    buttons.forEach(b=>{const chosen=b===button;b.setAttribute('aria-selected',String(chosen));b.tabIndex=chosen?0:-1;});
    panel.setAttribute('aria-labelledby',button.id);
    render(button.dataset[key]);
  };
  buttons.forEach((button,index)=>{
    button.addEventListener('click',()=>activate(button));
    button.addEventListener('keydown',event=>{
      let next=index;
      if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%buttons.length;
      else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index-1+buttons.length)%buttons.length;
      else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;
      event.preventDefault();activate(buttons[next]);buttons[next].focus();
    });
  });
}
const loopPanel=document.getElementById('loop-panel');
bindTabs('[data-loop]','loop',loopPanel,key=>{
  const entry=loopContent[key];
  loopPanel.querySelector('.eyebrow').textContent=entry.tag;
  loopPanel.querySelector('h3').textContent=entry.title;
  loopPanel.querySelector('p').textContent=entry.text;
  replaceChildrenWithText(loopPanel.querySelector('.token-row'),'span',entry.chips);
});
const assetPanel=document.getElementById('asset-detail');
bindTabs('[data-asset]','asset',assetPanel,key=>{
  const entry=assetContent[key];
  assetPanel.querySelector('.eyebrow').textContent=entry.tag;
  assetPanel.querySelector('h3').textContent=entry.title;
  assetPanel.querySelector('p').textContent=entry.text;
  assetPanel.querySelectorAll('dd').forEach((element,i)=>element.textContent=entry.fields[i]);
});

let hypothesis='friction',stage=0;
function renderExperiment(){
  const entry=hypotheses[hypothesis][stage];
  document.getElementById('stage-count').textContent=`阶段 ${stage+1} / 3`;
  ['stage-label','experiment-title','experiment-description','evidence-label','evidence-text'].forEach((id,i)=>document.getElementById(id).textContent=entry[i]);
  document.getElementById('next-stage').textContent=['查看实验设计','查看更新条件','回到假设'][stage];
}
document.querySelectorAll('[data-hypothesis]').forEach(button=>button.addEventListener('click',()=>{
  hypothesis=button.dataset.hypothesis;stage=0;
  document.querySelectorAll('[data-hypothesis]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  renderExperiment();
}));
document.getElementById('next-stage').addEventListener('click',()=>{stage=(stage+1)%3;renderExperiment();});
document.getElementById('reset-demo').addEventListener('click',()=>{stage=0;renderExperiment();});

const dialog=document.getElementById('image-dialog');
let imageTrigger=null;
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{
  imageTrigger=button;
  const img=document.getElementById('dialog-image');
  img.src=button.querySelector('img').currentSrc || button.dataset.image;img.alt=button.querySelector('img').alt;
  document.getElementById('dialog-caption').textContent='AI 生成概念示意 · 可按 Esc 关闭';
  dialog.showModal();
}));
document.getElementById('close-image').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>imageTrigger?.focus());

if('IntersectionObserver' in window){
  const navLinks=[...document.querySelectorAll('.site-header nav a')];
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){navLinks.forEach(link=>{const active=link.hash==='#'+entry.target.id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}});
  },{rootMargin:'-15% 0px -60% 0px',threshold:0});
  document.querySelectorAll('main section[id]:not(#top)').forEach(s=>observer.observe(s));
}
