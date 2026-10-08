// Ratchet's physical repair. Only durable placements are saved; the callback,
// pointer capture and focus belong to this particular visit, never to a save.
let repairSession = null;
const REPAIR_PARTS = ['cell', 'positive', 'negative', 'bridge'];
const REPAIR_TARGETS = ['socket', 'plus', 'minus', 'relay'];
const REPAIR_POS = [[16,43],[57,23],[57,73],[16,78],[38,43],[84,23],[84,73],[72,48]];
function repairClearInput() {
  if (typeof releaseInput === 'function') releaseInput();
  for (const k in keys) delete keys[k];
  for (const k in keysP) delete keysP[k];
  if (player) { player.vx = 0; player.atkBuf = player.jbuf = player.chargeT = 0; }
}
function repairClose(resume = true) {
  const s = repairSession;
  if (!s) return;
  repairSession = null;
  s.cleanup(); s.root.remove(); repairClearInput();
  // A room/restart closes with resume=false, but cannot leave an orphaned
  // REPAIR state behind. Preserve any state already chosen by the caller.
  if (G.state === 'REPAIR') G.state = 'PLAY';
  if (s.focus && s.focus.isConnected) s.focus.focus({preventScroll:true});
}
// DOM events can arrive between simulation ticks after a room/save change.
// Validate before every mutation, not just when power is first pressed.
function repairValid(s = repairSession) {
  return !!s && s === repairSession && G.state === 'REPAIR' &&
    s.room === G.roomId && s.save === G.save && !npcLive(s.npc) &&
    invCount(npcCellItem(s.npc)) > 0;
}
function repairOpen(npc, onComplete) {
  if (repairSession || npcLive(npc) || invCount(npcCellItem(npc)) < 1) return;
  const saved = G.save.repairRatchet;
  // A prefix only: corrupted/future data cannot connect wires without a cell.
  let step = 0;
  while (step < 4 && Array.isArray(saved) && saved[step] === REPAIR_PARTS[step]) step++;
  const root = document.createElement('section'); root.id = 'ratchet-repair';
  root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true');
  root.setAttribute('aria-labelledby','repair-title'); root.dir = LANG === 'ar' ? 'rtl' : 'ltr';
  root.innerHTML = `<style>
    #ratchet-repair{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(3,7,11,.94);color:#ecf3ef;font:16px system-ui,sans-serif;touch-action:none;overscroll-behavior:contain}
    #ratchet-repair *{box-sizing:border-box}#ratchet-repair .repair-card{width:min(1000px,96vw);max-height:98dvh;overflow:auto;padding:18px;border:1px solid #776044;border-radius:20px;background:linear-gradient(130deg,#182128,#0c1117);box-shadow:0 20px 90px #000}
    #ratchet-repair header{display:flex;justify-content:space-between;gap:16px;align-items:center}#ratchet-repair h2{font-size:clamp(18px,2.6vw,27px);margin:0 0 5px}#ratchet-repair .repair-kicker{font-size:11px;letter-spacing:.14em;color:#c7a778;margin-bottom:5px}
    #ratchet-repair button{font:inherit;color:inherit;cursor:pointer;border:1px solid #62727a;background:#192630;border-radius:12px;min-height:44px;padding:8px 14px;touch-action:none}
    #ratchet-repair button:focus-visible,#ratchet-repair button.selected{outline:3px solid #ffe4a3;outline-offset:3px}#ratchet-repair button:disabled{opacity:.42;cursor:default}
    #ratchet-repair .repair-board{position:relative;direction:ltr;aspect-ratio:2.48;margin:12px 0;background:#111920 url('assets/characters/gear/repair_panel.webp') center/100% 100%;border-radius:15px;overflow:hidden;border:1px solid #6e5b43}
    #ratchet-repair .repair-node{position:absolute;transform:translate(-50%,-50%);width:12%;min-width:48px;height:21%;min-height:44px;padding:2px;font-size:clamp(11px,1.65vw,17px);font-weight:700;border:2px solid #83918d;background:rgba(12,21,27,.93);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px}
    #ratchet-repair .repair-node[hidden]{display:none}#ratchet-repair .repair-node small{font-size:clamp(9px,1.1vw,12px);font-weight:500}#ratchet-repair [data-piece=cell],#ratchet-repair [data-target=socket]{width:18%;height:29%}
    #ratchet-repair .repair-cell{width:100%;height:68%;object-fit:contain;pointer-events:none}#ratchet-repair .repair-node.placed{border-color:#79ddc5;background:#16382e}#ratchet-repair .repair-node.waiting{border-style:dashed}
    #ratchet-repair svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}#ratchet-repair .repair-footer{display:flex;gap:14px;align-items:center;justify-content:space-between}#ratchet-repair .repair-footer p{margin:3px 0;color:#b5c4cc;font-size:13px}#ratchet-repair #repair-hint{min-height:2.5em;line-height:1.35;margin:10px 0 0}#ratchet-repair .repair-power{white-space:nowrap;background:#254b42;border-color:#7bd9be}
    #ratchet-repair [data-piece=positive],#ratchet-repair [data-target=plus]{border-color:#efb35d}#ratchet-repair [data-piece=negative],#ratchet-repair [data-target=minus]{border-color:#75c9f0}#ratchet-repair .repair-progress{direction:ltr;color:#92e4ce;font-size:12px;letter-spacing:.09em}#ratchet-repair .repair-ghost{position:fixed;z-index:10001;pointer-events:none;transform:translate(-50%,-50%);padding:12px;background:#19342e;border:2px solid #a2ecd4;border-radius:12px}
    @media(max-width:600px){#ratchet-repair .repair-card{padding:10px}#ratchet-repair .repair-board{aspect-ratio:1.45}#ratchet-repair .repair-node{height:19%;font-size:12px}#ratchet-repair .repair-footer{align-items:flex-start}#ratchet-repair .repair-footer p{font-size:11px}#ratchet-repair header button{font-size:12px;padding:6px}#ratchet-repair .repair-node small{font-size:9px}}
    @media(max-height:460px){#ratchet-repair .repair-card{width:min(850px,94vw);padding:8px}#ratchet-repair .repair-board{aspect-ratio:3.2;margin:6px 0}#ratchet-repair h2{font-size:18px}#ratchet-repair #repair-hint{min-height:0;margin:2px 0;font-size:13px}#ratchet-repair .repair-kicker,#ratchet-repair .repair-footer p{display:none}}
  </style><div class="repair-card"><header><div><div class="repair-kicker"></div><h2 id="repair-title"></h2><div class="repair-progress"></div></div><button data-repair-close></button></header><p id="repair-hint" role="status" aria-live="polite"></p><div class="repair-board"><svg viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true"></svg></div><div class="repair-footer"><div><p class="repair-help"></p><p class="repair-safe"></p></div><button class="repair-power"></button></div></div>`;
  document.body.appendChild(root);
  const interrupt = () => repairClose();
  const visibility = () => { if (document.hidden) interrupt(); };
  repairSession = {root,npc,onComplete,step,selected:null,room:G.roomId,save:G.save,focus:document.activeElement,t:0,boot:0,
    cleanup: () => {
      endDrag();
      removeEventListener('blur', interrupt);
      document.removeEventListener('visibilitychange', visibility);
    }};
  addEventListener('blur', interrupt);
  document.addEventListener('visibilitychange', visibility);
  G.dialog = null; G.state = 'REPAIR'; repairClearInput(); npcHush();
  root.querySelector('.repair-kicker').textContent = t('repair_kicker');
  root.querySelector('h2').textContent = t('repair_title');
  root.querySelector('[data-repair-close]').textContent = t('repair_close');
  root.querySelector('.repair-help').textContent = t('repair_help');
  root.querySelector('.repair-safe').textContent = t('repair_safe');
  root.querySelector('.repair-power').textContent = t('repair_power');
  const board = root.querySelector('.repair-board');
  REPAIR_PARTS.concat(REPAIR_TARGETS).forEach((name,i)=>{
    const b=document.createElement('button'); b.className='repair-node';
    b.setAttribute(i<4?'data-piece':'data-target',name);
    b.style.left=REPAIR_POS[i][0]+'%'; b.style.top=REPAIR_POS[i][1]+'%';
    b.setAttribute('aria-label',t('repair_'+name));
    if(name==='cell') {const im=document.createElement('img');im.src='assets/characters/gear/repair_battery.webp';im.alt='';im.draggable=false;im.className='repair-cell';b.appendChild(im);}
    const label=document.createElement('span');label.textContent=t('repair_'+name);b.appendChild(label);board.appendChild(b);
    b.addEventListener('click',()=>repairActivate(name,i<4));
  });
  root.querySelector('[data-repair-close]').onclick=()=>repairClose();
  root.querySelector('.repair-power').onclick=repairPower;
  let drag=null;
  root.addEventListener('pointerdown',e=>{
    if(e.button!==0 || !repairValid() || repairSession.boot) return;
    const b=e.target.closest('[data-piece]');if(!b || b.disabled)return;
    repairActivate(b.dataset.piece,true); b.setPointerCapture(e.pointerId);
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,node:b,ghost:null};
  });
  root.addEventListener('pointermove',e=>{
    if(!drag || e.pointerId!==drag.id)return;
    if(!drag.ghost && Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){drag.ghost=document.createElement('div');drag.ghost.className='repair-ghost';drag.ghost.textContent=t('repair_'+drag.node.dataset.piece);root.appendChild(drag.ghost);}
    if(drag.ghost){drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';}
  });
  const endDrag=e=>{
    if(!drag || e && e.pointerId!==drag.id)return;
    const d=drag;drag=null;
    if(d.node.hasPointerCapture(d.id))d.node.releasePointerCapture(d.id);
    if(d.ghost){d.ghost.remove();if(e && e.type!=='pointercancel'){const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-target]');if(hit && root.contains(hit))repairActivate(hit.dataset.target,false);}}
  };
  root.addEventListener('pointerup',endDrag);root.addEventListener('pointercancel',endDrag);
  // Existing touch controls and browser scrolling must not receive board taps.
  for(const name of ['touchstart','touchmove','touchend','mousedown','mouseup','click'])root.addEventListener(name,e=>e.stopPropagation());
  root.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.code==='Escape'){e.preventDefault();repairClose();return;}
    if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Tab'].includes(e.code)){
      e.preventDefault();repairFocus((e.shiftKey||['ArrowLeft','ArrowUp'].includes(e.code))?-1:1);
    } else if(e.code==='Enter'||e.code==='Space'){e.preventDefault();if(!e.repeat)document.activeElement?.click();}
  });
  repairRender(); root.querySelector('[data-piece="'+REPAIR_PARTS[Math.min(step,3)]+'"]').focus();
  if(step===4)root.querySelector('.repair-power').focus();
}
function repairFocus(dir) {
  if(!repairSession)return;
  const list=[...repairSession.root.querySelectorAll('button:not(:disabled)')].filter(x=>!x.hidden);
  const i=list.indexOf(document.activeElement);list[(i+dir+list.length)%list.length]?.focus();
}
function repairActivate(name,source) {
  const s=repairSession;if(!s)return;
  if(!repairValid(s)){repairClose();return;}
  if(s.boot)return;
  if(source){if(name!==REPAIR_PARTS[s.step])return;s.selected=name;sfx('ui');repairRender();return;}
  if(!s.selected)return;
  if(name!==REPAIR_TARGETS[s.step]) {sfx('ui');repairRender(t('repair_retry'));return;}
  s.step++;s.selected=null;G.save.repairRatchet=REPAIR_PARTS.slice(0,s.step);persist();
  sfx('metal');if(typeof padRumble==='function')padRumble(.12,.18,55);
  repairRender();
  const next=s.step<4?s.root.querySelector('[data-piece="'+REPAIR_PARTS[s.step]+'"]'):s.root.querySelector('.repair-power');next.focus();
}
function repairPower() {
  const s=repairSession;
  if(!repairValid(s)){repairClose();return;}
  if(s.step!==4 || s.boot)return;
  s.boot=.001;sfx('powerUp');repairRender(t('repair_boot'));
}
function repairRender(message) {
  const s=repairSession;if(!s)return;
  s.root.querySelector('#repair-hint').textContent=message||t('repair_step'+s.step);
  s.root.querySelector('.repair-progress').textContent=s.step+' / 4';
  for(let i=0;i<4;i++){
    const b=s.root.querySelector('[data-piece="'+REPAIR_PARTS[i]+'"]'),q=s.root.querySelector('[data-target="'+REPAIR_TARGETS[i]+'"]');
    b.disabled=i!==s.step||!!s.boot;b.hidden=i<s.step;b.classList.toggle('selected',s.selected===REPAIR_PARTS[i]);
    q.classList.toggle('placed',i<s.step);q.classList.toggle('waiting',i>=s.step);q.disabled=!!s.boot;
    if(i===0&&s.step>0&&!q.querySelector('img')){const im=b.querySelector('img').cloneNode();q.prepend(im);}
  }
  s.root.querySelector('.repair-power').disabled=s.step!==4||!!s.boot;
  s.root.querySelector('[data-repair-close]').disabled=!!s.boot;
  const svg=s.root.querySelector('svg');
  svg.innerHTML=`<path d="M380 172 L470 172 L470 92 L570 92 M380 172 L470 172 L470 292 L570 292 M840 92 L910 92 L910 192 L720 192 M840 292 L910 292 L910 192" fill="none" stroke="#465957" stroke-width="8"/>`+
    (s.step>1?'<path d="M570 92 C650 42 730 42 840 92" fill="none" stroke="#f3b166" stroke-width="9"/>':'')+
    (s.step>2?'<path d="M570 292 C650 342 730 342 840 292" fill="none" stroke="#89d6ff" stroke-width="9"/>':'')+
    (s.step>3?'<path d="M685 192 H755" stroke="#bce9d6" stroke-width="12"/>':'');
}
function updateRepair(dt) {
  const s=repairSession;
  if(!s){if(G.state==='REPAIR')G.state='PLAY';return;}
  if(!repairValid(s)){repairClose();return;}
  s.t+=dt;
  if(s.boot){
    s.boot+=dt;
    s.root.querySelector('.repair-board').style.boxShadow='inset 0 0 '+Math.round(12+Math.min(1,s.boot)*40)+'px #79dfbd55';
    if(s.boot>=1.3){const done=s.onComplete;repairClose();done();}
    return;
  }
  if(inP('BACK')||inP('PAUSE'))repairClose();
  else if(inP('RIGHT')||inP('DOWN'))repairFocus(1);
  else if(inP('LEFT')||inP('UP'))repairFocus(-1);
  else if(inP('OK')||inP('INT'))document.activeElement?.click();
}

// The fault is on the same camera plane as the cradle, so the electrical
// cause remains visible even on a narrow display. Additive light is an effect;
// the physical fixture and cradle remain authored artwork.
function drawWakeCircuit() {
  if(isHero()||G.roomId!=='W1')return;
  mediaFetch('wakeLamp');
  const p=ROOM_PROP.W1,fx=G.roomDef.w*TILE*p.x,fy=15*TILE;
  const lamp=MEDIA_IMG.wakeLamp, x=fx+88,y=fy-148;
  c.save();c.translate(camSX()*(1-p.par),camSY()*(1-p.par));
  if(lamp&&lamp.naturalWidth)c.drawImage(lamp,x-52,y-22,104,44);
  if(G.wake&&G.wake.fault){
    const e=G.wake.total-G.wake.t, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pulse=e<.85?(reduced?.35:.35+.3*Math.sin(e*19)):e<1.2?.85:.22;
    c.globalCompositeOperation='lighter';c.strokeStyle='rgba(170,226,255,'+pulse+')';c.lineWidth=3;
    c.beginPath();c.moveTo(x,y);c.lineTo(x+24,y+28);c.lineTo(x+24,fy-30);c.lineTo(fx+22,fy-30);c.stroke();
    if(e>.85&&e<2.2){const k=clamp((e-.85)/1.35,0,1);c.fillStyle='#dcfaff';c.beginPath();c.arc(x+24+(fx-x-2)*k,fy-30,4,0,7);c.fill();}
    c.globalAlpha=pulse;c.fillStyle='#d7f2ff';c.fillRect(x-33,y-3,65,5);
  }
  c.restore();
}

