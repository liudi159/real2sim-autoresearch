// State-machine checks for teaching players; no browser or simulation dependencies.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(base, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const stages = JSON.parse(fs.readFileSync(path.join(base, 'docs/tool-map.json'), 'utf8')).stages;
class Element {
  constructor() {
    this.attrs = {}; this.events = {}; this.children = []; this.textContent = '';
    this.hidden = false; this.disabled = false; this.value = '';
    this.classes = new Set();
    this.classList = {toggle:(name, on) => on ? this.classes.add(name) : this.classes.delete(name)};
    this.dataset = {};
  }
  setAttribute(k,v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(k,fn) { (this.events[k] ||= []).push(fn); }
  fire(k) { if (k === 'click' && this.disabled) return; (this.events[k] || []).forEach(fn => fn({target:this})); }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children.push(...children); }
}
function fixture(reduce = false) {
  const elements = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(m => [m[1], new Element()]));
  const get = id => { assert.ok(elements.has(id), `DOM element ${id} exists`); return elements.get(id); };
  const flowButtons = stages.map(() => new Element());
  const pipetteButtons = [0,1,2].map(() => new Element());
  get('tool-flow').querySelectorAll = () => flowButtons;
  get('pipette-motion').querySelectorAll = () => pipetteButtons;
  get('flow-route').value = 'calibration'; get('flow-speed').value = '3200';
  const scheduled = new Map(), frames = new Map(), observers = new Map(); let sequence = 0;
  const document = new Element(); document.hidden = false; document.createElement = () => new Element();
  const media = new Element(); media.matches = reduce;
  const context = {
    window:{matchMedia:() => media, IntersectionObserver:true}, document,
    toolStages:stages, $:get, text:(id,value) => {get(id).textContent = value;},
    setTimeout:fn => { const id = ++sequence; scheduled.set(id,fn); return id; },
    clearTimeout:id => scheduled.delete(id),
    requestAnimationFrame:fn => {const id = ++sequence; frames.set(id,fn); return id;},
    cancelAnimationFrame:id => frames.delete(id),
    IntersectionObserver:class {constructor(fn){this.fn=fn;} observe(el){observers.set(el,this.fn);}}
  };
  vm.runInNewContext(app.slice(app.indexOf('const reducedMotion =')), context);
  const flush = (map,time) => {const jobs = [...map.values()]; map.clear(); jobs.forEach(fn => fn(time));};
  return {get, flowButtons, pipetteButtons, scheduled, frames, document, media,
    advance:() => flush(scheduled), frame:time => flush(frames,time),
    offscreen:id => observers.get(get(id))([{isIntersecting:false}])};
}
test('tool flow starts paused, advances, pauses, and ends without another timer', () => {
  const f = fixture(); assert.equal(f.scheduled.size,0); assert.equal(f.frames.size,0);
  f.get('flow-play').fire('click'); assert.equal(f.scheduled.size,1);
  f.advance(); assert.match(f.get('flow-counter').textContent,/02 \/ 09/);
  f.get('flow-play').fire('click'); assert.equal(f.scheduled.size,0);
  f.flowButtons[7].fire('click'); f.get('flow-play').fire('click'); f.advance();
  assert.match(f.get('flow-counter').textContent,/09 \/ 09/);
  assert.equal(f.scheduled.size,0); assert.equal(f.get('flow-play').getAttribute('aria-pressed'),'false');
});
test('measurement and revision paths stop before fitting or claiming an accepted patch', () => {
  const f=fixture();
  for (const route of ['measurement','revision']) {
    f.get('flow-route').value=route; f.get('flow-route').fire('change');
    f.flowButtons[4].fire('click');
    assert.equal(f.get('flow-next').disabled,true); assert.equal(f.flowButtons[5].disabled,true);
    assert.match(f.get('flow-limit').textContent,route==='measurement'?/不把计划或预测写成真实观测/:/没有已通过的补丁/);
    f.get('flow-detail-link').fire('click'); assert.equal(f.get('tools-design').open,true);
  }
});
test('pipette holds compression through immersion and only shows liquid during release', () => {
  const f=fixture(); f.pipetteButtons[0].fire('click');
  assert.equal(f.get('live-liquid').getAttribute('d'),'M0 0');
  assert.match(f.get('pipette-progress').getAttribute('aria-valuetext'),/32%，压缩/);
  f.pipetteButtons[1].fire('click'); assert.equal(f.get('live-liquid').getAttribute('d'),'M0 0');
  assert.equal(f.get('live-compression').getAttribute('opacity'),'1');
  f.pipetteButtons[2].fire('click'); assert.notEqual(f.get('live-liquid').getAttribute('d'),'M0 0');
  assert.equal(f.get('live-compression').getAttribute('opacity'),'0');
  f.get('pipette-reset').fire('click'); assert.equal(f.get('pipette-progress-label').textContent,'0%');
});
test('scrubbing cancels motion; offscreen and background states pause active players', () => {
  const f=fixture();f.get('pipette-play').fire('click');f.frame(0);f.frame(1200);
  assert.equal(f.get('pipette-progress-label').textContent,'10%');
  f.get('pipette-progress').value='75';f.get('pipette-progress').fire('input');
  assert.equal(f.frames.size,0);assert.equal(f.get('pipette-progress-label').textContent,'75%');
  f.get('pipette-play').fire('click');f.offscreen('pipette-motion');assert.equal(f.frames.size,0);
  f.get('flow-play').fire('click');f.offscreen('tool-flow');assert.equal(f.scheduled.size,0);
  f.get('flow-play').fire('click');f.get('pipette-play').fire('click');
  f.document.hidden=true;f.document.fire('visibilitychange');assert.equal(f.frames.size,0);assert.equal(f.scheduled.size,0);
});
test('reduced motion uses manual stepping and cancels an animation when preference changes', () => {
  const f=fixture(true);f.get('flow-play').fire('click');f.get('pipette-play').fire('click');
  assert.equal(f.scheduled.size,0);assert.equal(f.frames.size,0);
  assert.match(f.get('flow-counter').textContent,/02 \/ 09/);
  assert.match(f.get('pipette-progress').getAttribute('aria-valuetext'),/60%，浸入/);
  f.media.matches=false;f.media.fire('change');f.get('pipette-play').fire('click');assert.equal(f.frames.size,1);
  f.media.matches=true;f.media.fire('change');assert.equal(f.frames.size,0);
});
