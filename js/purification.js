// Owner-directed guardian rescue, 2026-10-16. A deliberate hold, never a kill.
const PURIFICATION_KINDS = ['glitch', 'brood', 'atlas', 'zero', 'prism'];
const PURIFICATION_HOLD = 1.6;
// A missing film uses the same extraction choreography in-engine, never another
// guardian's movie. Populate only after a generated film is reviewed and shipped.
const PURIFICATION_MOVIES = {glitch:'assets/video/purify_glitch_ritual.mp4'};
if(!isHero()) Object.assign(PURIFY_VID,PURIFICATION_MOVIES);
const PURIFICATION_WORDS = {
 en: ['Purify the guardian', 'Release, then hold E / Interact or this button', 'Gathering pure light…', 'The sword draws out the corrupted song.', 'The guardian is purified.'],
 ar: ['طهّر الحارس', 'اترك الزر ثم اضغط مطوّلاً على E أو زر التفاعل', 'نجمع النور النقي…', 'السيف يسحب اللحن الفاسد.', 'تطهّر الحارس.'],
 tr: ['Muhafızı arındır', 'Bırak, sonra E / Etkileşim veya bu düğmeyi basılı tut', 'Saf ışık toplanıyor…', 'Kılıç bozulmuş şarkıyı çekiyor.', 'Muhafız arındı.'],
 zh: ['净化守护者', '松开后按住 E / 互动键或此按钮', '正在汇聚纯净之光…', '剑正在吸收被污染的歌声。', '守护者已被净化。'],
 ru: ['Очистите стража', 'Отпустите, затем удерживайте E / Взаимодействие или эту кнопку', 'Собирается чистый свет…', 'Меч вытягивает заражённую песню.', 'Страж очищен.']
};
function purificationPortrait() { return typeof TOUCH !== 'undefined' && TOUCH.enabled && window.innerHeight > window.innerWidth; }
function purificationText(i) { return (PURIFICATION_WORDS[LANG] || PURIFICATION_WORDS.en)[i]; }
let purificationButton = null, purificationPointer = false;
function purificationButtonHide() { if (purificationButton) purificationButton.hidden = true; purificationPointer = false; }
function purificationCancel() {
 const p = G.purification;
 if (p && p.b && !p.committed) { p.b.forkAsked = false; p.b.hp = Math.max(1,p.b.hp); }
 G.purification = null; purificationButtonHide();
}
function purificationEnsureButton() {
 if (purificationButton) return;
 const b = document.createElement('button'); b.type = 'button'; b.hidden = true;
 b.id = 'purification-hold'; b.style.cssText = 'position:fixed;z-index:10000;border:2px solid #fff3ba;border-radius:16px;background:#172431;color:#fffbe5;font:600 16px sans-serif;touch-action:none;user-select:none;box-shadow:0 0 24px #f9e4a755;';
 b.setAttribute('aria-label', purificationText(1));
 b.addEventListener('pointerdown', e => { if (!G.purification || G.purification.phase !== 'hold') return; e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} purificationPointer = true; });
 for (const ev of ['pointerup','pointercancel','lostpointercapture']) b.addEventListener(ev, () => { purificationPointer = false; });
 b.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); purificationPointer = true; } });
 b.addEventListener('keyup', () => { purificationPointer = false; });
 b.addEventListener('blur', () => { purificationPointer = false; });
 window.addEventListener('blur', () => { purificationPointer = false; if (G.purification) { G.purification.armed = false; G.purification.hold = 0; player.chargeT = 0; } });
 document.addEventListener('visibilitychange', () => { if (document.hidden) { purificationPointer = false; if (G.purification) { G.purification.armed = false; G.purification.hold = 0; player.chargeT = 0; } } });
 document.body.appendChild(b); purificationButton = b;
}
function purificationBegin(b) {
 if (!b || b.dead || b.meet || !PURIFICATION_KINDS.includes(b.kind) || b.purificationDone || isHero()) return false;
 if (brNeedsBlade(b)) return true;
 if (G.purification) return true;
 purificationEnsureButton();
 b.hp = 1; b.forkAsked = true; b.vx = b.vy = 0; b.st = 'winded'; b.stagT = 0;
 player.vx = player.vy = 0;
 // SHE IS NOT STILL REELING (owner, 2026-11-21, the purify scene): her update stops in
 // this state, so a blow taken just before he fell held her in the hurt picture,
 // blinking white, for the whole scene. The fight is over; she stands clean.
 player.hurtPoseT = 0; player.iT = 0; player.flinchT = 0;
 // die() may be called inside the active swing loop. Keep that frame's
 // object alive until it returns; expire it and clear on the next ritual tick.
 if(player.swing) player.swing.t=0;
 player.swingVis = null; player.atkBuf = 0; player.chargeT = 0;
 player.face = player.faceVis = Math.sign(b.cx() - player.x - player.w/2) || 1;
 G.projs = []; G.boomer = null; G.hitStop = 0;
 // SHE IS WALKED TO HIM, AND HE IS ON THE GROUND, BEFORE SHE IS ASKED (owner,
 // 2026-11-16: "when I freed it, you asked me to press. You should have at
 // least adjusted my stand to make it logical, where I stand and where I
 // purify it... take over the controller and walk it to the direction to the
 // lion... Make the lion at least down"). The prompt used to open over
 // wherever the last blow happened to leave the two of them — her mid-jump,
 // him on his ledge or halfway through a leap, sometimes hanging in the rock.
 // The `stage` phase comes first now: he comes down to the floor under him and
 // is still; she is walked, on her own feet, to a blade's length from his head
 // and turned to him; only then does the hold open.
 const side = Math.sign(player.x + player.w/2 - b.cx()) || -1;
 const Wpx = G.roomDef.w * TILE, clampX = (x) => Math.max(TILE + 6, Math.min(Wpx - TILE - player.w - 6, x));
 // (a blade's length from his DRAWN head, not his hit-box: the picture of a lion reaches
 // far past the box, and at the box's edge she stood inside his face)
 const gap = b.w/2 + 128;
 let tx = clampX(b.cx() + side * gap - player.w/2);
 // (no room on her side of him — a wall: the other side, then)
 if (Math.abs(tx + player.w/2 - b.cx()) < gap - 40) tx = clampX(b.cx() - side * gap - player.w/2);
 G.purification = { b, room:G.roomId, phase:'stage', hold:0, t:0, clock:0, armed:false, committed:false, motes:[], stage:{ tx, T:0, walked:0 } };
 const span=Math.abs(b.cx()-player.x)+b.w+180;
 // (its own close framing — the two of them — not the fight's wide arena frame it comes out of: js/engine.js bossFit)
 cam.zoom=purificationZoom(span);
 cam.x=(b.cx()+player.x+player.w/2)/2-480;cam.y=(b.cy()+player.y)/2-270;purificationCamClamp();
 G.state = 'PURIFY'; purificationPointer = false; releaseInput();
 return true;
}
// THE FRAME STAYS IN THE ROOM (owner, 2026-11-21, of the purify scene: "the screen is
// glitched"). The stage set the camera by hand with no bound, so pulling in on the two
// of them by a wall showed past the room's edge: the wall's lit end as a bar down the
// frame and whatever lies beyond. The same bound updateCam keeps (js/engine.js).
function purificationZoom(span) {
  if ((typeof isHero === 'function' && isHero()) || (typeof window !== 'undefined' && window.EDITOR)) return 1;
  const base = typeof PRESENTATION !== 'undefined' ? PRESENTATION.explorationZoom : 1;
  return Math.max(1.05, Math.min(base, 760 / span));
}
function purificationCamClamp() {
 const z=cam.zoom||1, ox=480*(1-1/z), oy=270*(1-1/z), rw=G.roomDef.w*TILE, rh=G.roomDef.h*TILE;
 cam.x = rw<960/z ? (rw-960)/2 : clamp(cam.x,-ox,rw-960+ox);
 cam.y = rh<540/z ? (rh-540)/2 : clamp(cam.y,-oy,rh-540+oy);
}
function purificationRestoreStage() {
 G.impact=null;G.flash=0;G.hitStop=0;cam.shake=0;
 if(G.boss){G.boss.impactUntil=0;infEyeClearOwner(G.boss);}
}
function purificationFinish(p) {
 if (p.committed) return; p.committed = true;
 const b=p.b; b.purificationDone=true; b.restoredGold=true; b.stagT=0;
 b.skipPurifyFilm = !PURIFICATION_MOVIES[b.kind];
 if (!b.skipPurifyFilm) PURIFY_VID[b.kind]=PURIFICATION_MOVIES[b.kind];
 G.purification=null; purificationButtonHide(); player.chargeT=0; G.hitStop=0; releaseInput();
 G.state='PLAY';
 if(p.recovery){if(b.rewardPend){b.rewardPend=false;G.onBossDead(b.kind);}G.purificationReturn=.65;purificationRestoreStage();return;}
 G.forkBoss=b;
 brOffer(b.kind==='glitch'?'firstboss':'boss');
 // brOffer owns the single existing reward/ledger path. No duplicate reward.
 if (G.state==='CUT' && G.cut) G.cut.purificationRitual=true;
 else {
  // The cinematic has already shown cleansing. Settle before queued dialogue
  // can pause the old cleansing timer; rewardPend prevents duplicate payment.
  if(b.rewardPend){b.rewardPend=false;G.onBossDead(b.kind);}
  G.purificationReturn=0.65;purificationRestoreStage();
 }
}
function updatePurification(dt) {
 const p=G.purification;if(!p){G.state='PLAY';purificationButtonHide();return;}
 if (G.roomId!==p.room || player.dead) { purificationCancel();G.state='PLAY';return; }
 player.swing=null;dt=Math.min(dt,0.05);
 // Hidden tabs cannot complete a hold or leap through the choreography.
 if(document.hidden || purificationPortrait()){p.hold=0;p.armed=false;purificationPointer=false;player.chargeT=0;return;}
 p.clock+=dt;p.t+=dt;infEyeUpdate(dt);
 if(p.phase==='stage'){
  const b=p.b,s=p.stage; s.T+=dt;
  // (the hold is armed by a key that has been LET GO since the last blow — here as in the hold itself)
  if(!(purificationPointer || inD('INT'))) p.armed=true;
  // the floor under a body: the first surface at or below its feet
  const floorUnder=(cx,feet)=>{const g=typeof groundColumnAt==='function'?groundColumnAt(cx):null; if(!g||!g.length) return null;
   const below=g.filter(y=>y>=feet-10); return below.length?Math.min.apply(null,below):Math.max.apply(null,g);};
  // HE COMES DOWN and lies still
  const gb=floorUnder(b.cx(),b.y+b.h); let bDown=true;
  if(gb!=null){ if(b.y+b.h<gb-1){ b.y=Math.min(gb-b.h,b.y+760*dt); bDown=b.y+b.h>=gb-1; } else b.y=gb-b.h; }
  b.vx=b.vy=0;
  // HE TURNS TO HER FIRST (owner, 2026-11-21: "The lion is giving me its back"). She is
  // walked up on her own side of him, and a blow can leave him facing away: he plays his
  // filmed turn (beast.js BEAST_TURN, faceVis is its clock) toward her, and only then
  // goes low. The hold does not open until he faces her.
  const toward=Math.sign(player.x+player.w/2-b.cx())||b.face||1;
  if(!s.turned){
   b.face=toward; const fv=b.faceVis==null?toward:b.faceVis;
   if(Math.abs(fv-toward)>0.02){ b.st='idle'; b.stagT=0; b.faceVis=fv+clamp(toward-fv,-dt*3.8,dt*3.8); }
   else { b.faceVis=toward; s.turned=true; }
  }
  if(s.turned){ b.face=toward; b.st='winded'; b.stagT=Math.max(b.stagT||0,0.6); }   // (stagT > 0 is his cowering-low plate: beast.js)
  // SHE WALKS to him — falls first, if the last blow was struck in the air
  const gp=floorUnder(player.x+player.w/2,player.y+player.h); let pDown=true;
  if(gp!=null){ if(player.y+player.h<gp-1){ player.y=Math.min(gp-player.h,player.y+760*dt); pDown=player.y+player.h>=gp-1; } else player.y=gp-player.h; }
  player.on=pDown; player.vy=0;
  const dx=s.tx-player.x;
  if(pDown && Math.abs(dx)>3 && s.T<3.4){
   const dir=Math.sign(dx), step=Math.min(Math.abs(dx),150*dt);
   player.x+=dir*step; s.walked+=step; player.vx=dir*150; player.face=player.faceVis=dir;
   if(typeof heroStepLen==='function') player.stridePh=(player.stridePh||0)+dt*clamp(150/heroStepLen(150),0,11);
  }else if(pDown){
   player.vx=0; player.face=player.faceVis=Math.sign(b.cx()-player.x-player.w/2)||1;
   if(bDown && s.turned && s.T>0.45){ p.phase='hold'; p.t=0; p.hold=0; }
  }
  // the frame follows the two of them in
  const span=Math.abs(b.cx()-player.x)+b.w+180, z=purificationZoom(span), k=Math.min(1,dt*5);
  cam.zoom+=(z-cam.zoom)*k; cam.x+=((b.cx()+player.x+player.w/2)/2-480-cam.x)*k; cam.y+=((b.cy()+player.y)/2-270-cam.y)*k;
  purificationCamClamp();
  return;
 }
 if(p.phase==='hold'){
  const down=purificationPointer || inD('INT');
  if(!down){p.armed=true;p.hold=0;player.chargeT=0;}
  else if(p.armed){p.hold=Math.min(PURIFICATION_HOLD,p.hold+dt);player.chargeT=0.6*p.hold/PURIFICATION_HOLD;}
  if(p.hold>=PURIFICATION_HOLD){p.phase='slash';p.t=0;purificationButtonHide();sfx('chargedHit');if(typeof padRumble==='function')padRumble(.35,.5,160);}
 }else if(p.phase==='slash' && p.t>=.48){
  p.phase='impact';p.t=0;p.b.impactUntil=performance.now()+90;
  sfx('bosshit');if(!infEyeReduced())cam.shake=Math.max(cam.shake,7);
 }else if(p.phase==='impact' && p.t>=.14){p.phase='black';p.t=0;}
 else if(p.phase==='black' && p.t>=.5){
  if(PURIFICATION_MOVIES[p.b.kind]) purificationFinish(p);
  else {p.phase='film';p.t=0;player.chargeT=.6;sfx('cast');}
 }else if(p.phase==='film' && p.t>=8.5){p.phase='return';p.t=0;p.b.restoredGold=true;}
 else if(p.phase==='return' && p.t>=.65)purificationFinish(p);
}
// World-space light choreography. Fixed counts and analytic paths need no
// persistent particles and leave no trails after the scene ends.
function drawPurificationWorld(ctx) {
 const p=G.purification;if(!p)return;
 const h=player,b=p.b,x=h.x+h.w/2+h.face*9,y=h.y-20,ratio=p.phase==='hold'?p.hold/PURIFICATION_HOLD:1;
 if(p.phase==='hold'&&!p.hold)return;
 ctx.save();ctx.globalCompositeOperation='lighter';
 const n=infEyeReduced()?18:64;
 for(let i=0;i<n;i++){
  const a=i*2.39996+p.clock*.3,k=(i/n+p.clock*.5)%1,r=(1-k)*145;
  const xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.7;
  ctx.globalAlpha=k*ratio*.85;ctx.fillStyle='#ffffef';ctx.fillRect(xx,yy,1.8,1.8);
 }
 // (NO SWORD DRAWN HERE. A white line up from her hip with a gold bar across it stood in
 // for the blade — a cross over her, owner 2026-11-21: "the sword looks like a cross". Her
 // own sword is in her own picture: player.chargeT holds her charge pose, blade and all.)
 ctx.globalAlpha=1;
 if(p.phase==='slash'){
  const t=Math.min(1,p.t/.48),ex=b.cx(),ey=b.cy();ctx.globalAlpha=Math.sin(t*Math.PI);ctx.lineWidth=3+12*Math.sin(t*Math.PI);
  ctx.strokeStyle='#fffef4';ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo((x+ex)/2,y-70,ex+35,ey+45);ctx.stroke();
 }
 ctx.restore();
}
function drawPurificationFilm(p) {
 // Authored in-engine fallback, explicitly distinct from a generated video.
 const ctx=c,t=p.t;ctx.fillStyle='#080c15';ctx.fillRect(0,0,960,540);
 const glow=ctx.createRadialGradient(500,330,10,500,330,500);glow.addColorStop(0,'#283545');glow.addColorStop(1,'#05070d');ctx.fillStyle=glow;ctx.fillRect(0,0,960,540);
 const b=p.b,h=player,old={x:h.x,y:h.y,face:h.face,faceVis:h.faceVis,bx:b.x,by:b.y,pure:b.purified};
 ctx.save();ctx.translate(150,100);ctx.scale(1.6,1.6);
 h.x=90;h.y=190-h.h;h.face=h.faceVis=1;b.x=330;b.y=190-b.h;b.purified=t>6.5;
 h.draw(ctx);ctx.save();if(t>6.5)ctx.filter='sepia(1) saturate(1.8) brightness(1.08)';b.draw(ctx);ctx.restore();
 const sx=h.x+h.w/2+9,sy=h.y-26;
 // (no drawn blade over her: her own charge pose holds the sword)
 if(t<2){for(let i=0;i<48;i++){const a=i*2.4,k=(i/48+t*.6)%1,r=130*(1-k);ctx.fillStyle='#fffdeb';ctx.fillRect(sx+Math.cos(a)*r,sy+Math.sin(a)*r,2,2);}}
 if(t>=2&&t<2.6){ctx.strokeStyle='#fff';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(230,15,b.x+b.w,b.y+b.h);ctx.stroke();}
 for(let i=0;i<36;i++){
  const k=(i/36+t*.38)%1,fromX=b.x+b.w/2+Math.sin(i*2.4)*b.w*.5,fromY=b.y+b.h*.4+Math.cos(i*3.1)*b.h*.5;
  if(t>=2.6 && t<6.5){const xx=fromX+(sx-fromX)*k,yy=fromY+(sy-fromY)*k+Math.sin(k*Math.PI)*-45;ctx.fillStyle=k>.87?'#ffffed':'#4b071a';ctx.shadowColor=k>.87?'#fff1bd':'#ff2946';ctx.shadowBlur=infEyeReduced()?0:10;ctx.beginPath();ctx.arc(xx,yy,2+3*(1-k),0,Math.PI*2);ctx.fill();}
 }
 ctx.restore();Object.assign(h,{x:old.x,y:old.y,face:old.face,faceVis:old.faceVis});Object.assign(b,{x:old.bx,y:old.by,purified:old.pure});
 if(t<.4){ctx.fillStyle='rgba(0,0,0,'+(1-t/.4)+')';ctx.fillRect(0,0,960,540);}
 ctx.fillStyle='#000';ctx.fillRect(0,0,960,48);ctx.fillRect(0,468,960,72);
 const text=purificationText(t>6.5?4:t>=2.6?3:2),shown=text.slice(0,Math.floor(Math.max(0,t-(t>6.5?6.5:t>=2.6?2.6:0))*38));ftxt(shown,480,507,18,'#fff5d6');
}
function drawPurification() {
 const p=G.purification;if(!p)return;
 if(purificationPortrait()){purificationButtonHide();return;}
 if(p.phase==='film'||p.phase==='return'){drawPurificationFilm(p.phase==='return'?{...p,t:8.5}:p);if(p.phase==='return'){c.fillStyle='rgba(0,0,0,'+Math.min(1,p.t/.5)+')';c.fillRect(0,0,960,540);}return;}
 drawWorldFrame();
 c.fillStyle='#04060a';c.fillRect(0,0,960,44);c.fillRect(0,452,960,88);   // cinema bars: solid, not a smear over the world
 if(p.phase==='hold'){
  const r=cv.getBoundingClientRect(),btn=purificationButton;
  btn.hidden=false;btn.style.left=(r.left+r.width*.30)+'px';btn.style.top=(r.top+r.height*.845)+'px';btn.style.width=(r.width*.40)+'px';btn.style.height=Math.max(48,r.height*.12)+'px';
  btn.textContent=purificationText(p.hold?2:0)+' '+Math.round(p.hold/PURIFICATION_HOLD*100)+'%';btn.setAttribute('aria-label',purificationText(1));
  // (in the top bar, never over the two of them: the floor sits low in these rooms)
  ftxt(purificationText(1),480,24,15,'#fff3c9');
  c.fillStyle='#d8c484';c.fillRect(290,38,380*p.hold/PURIFICATION_HOLD,3);
 }
 if(p.phase==='impact'&&!infEyeReduced()){c.fillStyle='rgba(255,255,244,.75)';c.fillRect(0,0,960,540);}
 if(p.phase==='black'||p.phase==='return'){c.fillStyle='rgba(0,0,0,'+Math.min(1,p.t/.5)+')';c.fillRect(0,0,960,540);}
}
