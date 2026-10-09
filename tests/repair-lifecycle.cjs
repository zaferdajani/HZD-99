// Production repair + NPC/quest/persistence functions, with an inert DOM.
// This exercises state and durable effects; it does not claim browser rendering.
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const game = fs.readFileSync('js/game.js','utf8');
function fn(name) {
  const start=game.indexOf('function '+name+'('); assert(start>=0,name);
  const line=game.slice(start,game.indexOf('\n',start));
  return line.endsWith('}')?line:game.slice(start,game.indexOf('\n}',start)+2);
}
function events(obj={}) {
  const handlers={};
  return Object.assign(obj,{
    addEventListener(k,f){(handlers[k] ||= new Set()).add(f);},
    removeEventListener(k,f){handlers[k]?.delete(f);},
    emit(k,e={}){for(const f of [...handlers[k]||[]])f(e);},
    count(k){return handlers[k]?.size||0;}
  });
}
const document=events({hidden:false,activeElement:null});
class Node {
  constructor(tag='div'){this.tag=tag;this.children=[];this.style={};this.dataset={};this.classList={toggle(){}};this.isConnected=true;events(this);}
  setAttribute(k,v){if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;}
  appendChild(n){this.children.push(n);n.parent=this;return n;}
  prepend(n){this.children.unshift(n);n.parent=this;}
  remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
  focus(){if(!this.disabled&&!this.hidden)document.activeElement=this;}
  cloneNode(){return new Node(this.tag);}
  contains(n){return n===this||this.children.some(c=>c.contains(n));}
  setPointerCapture(id){this.capture=id;}
  hasPointerCapture(id){return this.capture===id;}
  releasePointerCapture(){delete this.capture;}
  closest(q){return this.matches(q)?this:this.parent?.closest(q);}
  matches(q){const m=q.match(/^\[data-(piece|target)(?:="([^"]+)")?\]$/);return m?this.dataset[m[1]]!==undefined&&(!m[2]||this.dataset[m[1]]===m[2]):this.tag===q;}
  querySelector(q){return this.fixed?.[q]||this.children.find(c=>c.matches(q))||this.children.map(c=>c.querySelector(q)).find(Boolean)||null;}
  querySelectorAll(){const all=[];const visit=n=>{if(n.tag==='button'&&!n.disabled)all.push(n);n.children.forEach(visit);};visit(this);return all;}
  set innerHTML(html){
    if(this.tag!=='section')return;
    this.fixed={};
    for(const q of ['.repair-kicker','h2','[data-repair-close]','.repair-help','.repair-safe','.repair-power','.repair-board','#repair-hint','.repair-progress','svg']){
      const n=new Node(q.includes('close')||q==='.repair-power'?'button':'div');this.fixed[q]=n;this.appendChild(n);
    }
  }
  click(){if(this.disabled)return;this.onclick?.();this.emit('click');}
}
document.createElement=tag=>new Node(tag);document.body=new Node('body');document.activeElement=new Node('canvas');
const window=events();const storage=new Map();const noop=()=>{};
const ctx=vm.createContext({console,document,addEventListener:window.addEventListener,removeEventListener:window.removeEventListener,
  LANG:'en',isHero:()=>false,keys:{},keysP:{},releaseInput:noop,npcHush:noop,npcSay:noop,sfx:noop,burst:noop,narrativeAudioTick:noop,
  inP:()=>false,cam:{shake:0},PURIFY_VID:{},NPC_AWAKE:new Set(),SAVE_KEY:'test',performance:{now:()=>0},
  localStorage:{setItem:(k,v)=>storage.set(k,v)},standingTier:()=>0,t:k=>k.startsWith('d_')?['greeting']:k,
  player:{vx:9,atkBuf:1,jbuf:1,chargeT:1},G:{roomId:'A0B',state:'PLAY',save:null,toast:noop}});
const run=s=>vm.runInContext(s,ctx);
for(const name of ['weapons','quests','story-opening','story-repair'])run(fs.readFileSync('js/'+name+'.js','utf8'));
for(const name of ['saveKeyFor','persist','invCount','invAdd','invTake','npcKey','npcCellItem','npcLive','npcCharge','doInteract','forgeCrystal','update'])run(fn(name));
run(game.slice(game.indexOf('const NPC_GIFT ='),game.indexOf('\n};',game.indexOf('const NPC_GIFT ='))+3));
ctx.showItem=(name,desc)=>{ctx.G.state='DIALOG';ctx.G.dialog={name,lines:[desc],onEnd:null};};
const npc={type:'npc',room:'A0B',extra:'ratchet',x:0,y:0,w:20,h:20};
const save=()=>({theme:'robo',storyVersion:2,flags:{},items:{ratchetCell:1},quests:{},bag:{},weaponVersion:1,weaponMode:'claws',scrap:0,iq:0});
function reset(){ctx.repairClose();ctx.G.save=save();ctx.G.roomId='A0B';ctx.G.state='PLAY';}
function finishDialog(){const cb=ctx.G.dialog?.onEnd;ctx.G.dialog=null;ctx.G.state='PLAY';cb?.();}
function open(){ctx.doInteract(npc);finishDialog();assert.equal(ctx.G.state,'REPAIR');}
function place(i){ctx.repairActivate(['cell','positive','negative','bridge'][i],true);ctx.repairActivate(['socket','plus','minus','relay'][i],false);}
function persisted(){return JSON.parse(storage.get('test_robo'));}
reset();open();ctx.repairPower();assert.equal(run('repairSession.boot'),0,'cannot power incomplete circuit');
ctx.repairActivate('positive',true);ctx.repairActivate('plus',false);assert.equal(run('repairSession.step'),0);
ctx.repairActivate('cell',true);ctx.repairActivate('minus',false);assert.equal(run('repairSession.step'),0);
place(0);place(1);assert.deepEqual(persisted().repairRatchet,['cell','positive']);
ctx.repairClose();assert.equal(ctx.G.state,'PLAY');assert.equal(ctx.invCount('ratchetCell'),1);assert(!ctx.npcLive(npc));
ctx.G.save=persisted();open();assert.equal(run('repairSession.step'),2,'resume saved prefix');place(2);place(3);
ctx.repairPower();ctx.updateRepair(.6);window.emit('blur');ctx.updateRepair(2);
assert(!ctx.npcLive(npc),'interrupted boot does not consume or reward');assert.equal(ctx.invCount('ratchetCell'),1);assert.equal(ctx.G.state,'PLAY');
open();assert.equal(run('repairSession.step'),4);ctx.repairPower();for(let i=0;i<90&&ctx.G.state==='REPAIR';i++)ctx.update(1/60);
assert(ctx.npcLive(npc));assert.equal(ctx.invCount('ratchetCell'),0);assert.equal(ctx.invCount('batt'),1);assert.equal(ctx.invCount('kit'),1);
assert.equal(persisted().flags.ratchetRepaired,1);assert.equal(ctx.G.state,'DIALOG','existing gift story resumes');
for(let i=0;i<12&&ctx.G.state==='DIALOG';i++)finishDialog();
assert.equal(ctx.qState('ratchet_forge'),'active');assert(!ctx.weaponOwned('single'));assert(!ctx.G.save.flags.alpha,'repair does not complete Alpha');
ctx.G.save=persisted();ctx.G.state='PLAY';ctx.doInteract(npc);assert.notEqual(ctx.G.state,'REPAIR');assert.equal(ctx.invCount('kit'),1);
reset();open();place(0);ctx.G.roomId='A1';ctx.repairActivate('positive',true);assert.equal(run('repairSession'),null);assert.equal(ctx.G.state,'PLAY');
reset();open();const old=ctx.G.save;ctx.G.save=save();ctx.repairActivate('cell',true);assert.equal(ctx.G.save.repairRatchet,undefined);assert.equal(old.repairRatchet,undefined);
reset();open();for(let i=0;i<4;i++)place(i);ctx.repairPower();delete ctx.G.save.items.ratchetCell;ctx.updateRepair(2);assert(!ctx.npcLive(npc));assert.equal(ctx.G.state,'PLAY');
reset();ctx.G.save.repairRatchet=['positive','cell'];open();assert.equal(run('repairSession.step'),0);ctx.G.state='MENU';ctx.updateRepair(1);assert.equal(ctx.G.state,'MENU');assert.equal(run('repairSession'),null);
reset();open();document.hidden=true;document.emit('visibilitychange');document.hidden=false;assert.equal(ctx.G.state,'PLAY');
assert.equal(window.count('blur'),0);assert.equal(document.count('visibilitychange'),0);
ctx.G.state='REPAIR';ctx.updateRepair(.1);assert.equal(ctx.G.state,'PLAY','orphaned state recovers');
reset();ctx.G.save.storyVersion=1;ctx.G.save.items={batt:1};ctx.doInteract(npc);finishDialog();assert(ctx.npcLive(npc),'legacy immediate restore remains supported');
const manifest=JSON.parse(fs.readFileSync('source-files.json'));
assert.equal(manifest.filter(n=>n==='story-repair').length,1);assert(manifest.indexOf('story-repair')<manifest.indexOf('game'));
const dev=fs.readFileSync('dev.html','utf8');assert(dev.indexOf('js/story-repair.js')<dev.indexOf('js/game.js'));
assert.match(fn('update'),/updateRepair\(dt\)/);assert.match(fn('loadRoom'),/repairClose\(false\)/);
reset();open();ctx.repairClose(false);assert.equal(ctx.G.state,'PLAY','room/restart close cannot strand REPAIR');
reset();open();for(let i=0;i<4;i++)place(i);ctx.repairPower();
assert.equal(document.activeElement,run("repairSession.root.querySelector('[data-repair-close]')"),'boot retains keyboard focus on enabled Close');
ctx.inP=k=>k==='BACK';ctx.updateRepair(.2);ctx.inP=()=>false;
assert.equal(ctx.G.state,'PLAY');assert(!ctx.npcLive(npc),'controller Back cancels boot without rewarding');
console.log('PASS repair lifecycle: ordered puzzle, wrong inputs, prefix reload, boot interruption, once-only NPC rewards, forge quest, stale room/save events, lost cell, menu preservation, visibility cleanup, orphan recovery, legacy save and both loading paths');
