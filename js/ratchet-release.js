// Owner-supplied four-pose wrist release, staged in the actual repaired den.
// It follows the existing waking film and precedes the existing explanation.
// No injury, new upgrade, involuntary reward, replacement voice or combat rule.
const RATCHET_RELEASE_ART = Object.freeze({key:'ratchetWristRelease',cells:4,
  sourceFloor:355.5,sourceCenter:180,hand:[264,227],heightK:3.3,
  heroWrist:[207,62],durations:[.22,.36,.36,.38],loadingLimit:1.5});
// var, not let: warp.js (earlier in source-files.json) loads a room at boot, and
// loadRoom calls ratchetReleaseFinish before this line has run. A let would be in
// its temporal dead zone there and throw; a var is merely undefined, i.e. no session.
var ratchetReleaseSession=null;
TEXT_LAYERS.push({robo:true,
 en:{rr_waking:'Easy… he is waking.',rr_continue:'Continue'},
 ar:{rr_waking:'على مهل… إنّه يستيقظ.',rr_continue:'متابعة'},
 tr:{rr_waking:'Yavaş… uyanıyor.',rr_continue:'Devam'},
 zh:{rr_waking:'慢一点……他正在苏醒。',rr_continue:'继续'},
 ru:{rr_waking:'Тише… он просыпается.',rr_continue:'Продолжить'}
});
function ratchetReleaseImage() {
  const im=MEDIA_RAW[RATCHET_RELEASE_ART.key];
  return im&&im.complete&&im.naturalWidth===im.naturalHeight*4?im:null;
}
function ratchetReleaseGeometry(s,side) {
  const a=RATCHET_RELEASE_ART,k=s.h*a.heightK/360;
  const foot={x:s.x+s.w/2,y:s.y+s.h};
  const hand={x:foot.x+side*(a.hand[0]-a.sourceCenter)*k,
    y:foot.y+2+(a.hand[1]-360)*k};
  const heroK=HERO_DH*HERO_DELIVERY_K/320,heroReach=(a.heroWrist[0]-160)*heroK;
  return {foot,hand,k,heroK,heroX:hand.x+side*heroReach-player.w/2,side};
}
function ratchetReleaseClearInput() {
  if(typeof releaseInput==='function')releaseInput();
  for(const k in keys)delete keys[k];for(const k in keysP)delete keysP[k];
  if(player){player.vx=0;player.atkBuf=player.jbuf=player.chargeT=0;}
}
function ratchetReleaseStart(npc,onEnd) {
  const f=G.save&&G.save.flags;
  if(ratchetReleaseSession||isHero()||G.roomId!=='A0B'||!f||!f.ratchetRepaired||
      f.ratchetReleased||!npc||npc.extra!=='ratchet'||!npcLive(npc)||!player||player.dead)return false;
  // No teleport from a remote harness, door, ledge or interrupted conversation.
  const side=player.x+player.w/2<npc.x+npc.w/2?-1:1;
  const geometry=ratchetReleaseGeometry(npc,side);
  if(Math.abs(player.x-geometry.heroX)>64||Math.abs(player.y+player.h-geometry.foot.y)>28)return false;
  if(G.dialog||G.trans||G.gateWalk||G.meet||G.bossEntry)return false;
  const focus=document.activeElement;
  const root=document.createElement('div');root.id='ratchet-release-controls';
  root.setAttribute('role','group');root.setAttribute('aria-label',t('rr_waking'));
  root.style.cssText='position:fixed;z-index:45;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);max-width:85vw;display:flex;align-items:center;gap:14px;padding:10px 14px;background:#0b1725ed;border:1px solid #8dcdbf;border-radius:8px;color:#e4f3ee;font:16px system-ui';
  const text=document.createElement('span');text.textContent=t('rr_waking');text.setAttribute('aria-live','polite');root.appendChild(text);
  const button=document.createElement('button');button.textContent=t('rr_continue');button.type='button';
  button.style.cssText='font:inherit;min-height:44px;padding:8px 16px;background:#163c36;color:#e9fff8;border:1px solid #8dcdbf;border-radius:5px;cursor:pointer';
  root.appendChild(button);document.body.appendChild(root);
  ratchetReleaseSession={npc,save:G.save,room:G.roomId,hero:player,onEnd,root,focus,
    geometry,startX:player.x,t:0,loading:0,started:false,frame:0,paused:false};
  const session=ratchetReleaseSession;
  const click=()=>{if(ratchetReleaseSession===session)ratchetReleaseFinish(true);};
  const key=e=>{if(ratchetReleaseSession===session&&['Escape','Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();ratchetReleaseFinish(true);}};
  button.addEventListener('click',click,{once:true});
  root.addEventListener('keydown',key);Object.assign(session,{key,click,button});
  G.state='RATCHET_RELEASE';f.ratchetReleasePending=1;ratchetReleaseClearInput();
  mediaFetch(RATCHET_RELEASE_ART.key,true);mediaFetch('swingUppercut',true);button.focus({preventScroll:true});persist();return true;
}
function ratchetReleaseFinish(advance=false) {
  const s=ratchetReleaseSession;if(!s)return;
  ratchetReleaseSession=null;s.root.removeEventListener('keydown',s.key);s.button.removeEventListener('click',s.click);s.root.remove();
  const valid=s.save===G.save&&s.room===G.roomId&&s.hero===player;
  if(G.state==='RATCHET_RELEASE')G.state='PLAY';
  ratchetReleaseClearInput();
  if(s.focus&&s.focus.isConnected)s.focus.focus({preventScroll:true});
  if(!advance||!valid)return;
  G.save.flags.ratchetReleased=1;delete G.save.flags.ratchetReleasePending;persist();
  // Retire callbacks BEFORE calling them: double taps and stale DOM events are inert.
  if(typeof s.onEnd==='function')s.onEnd();
}
function ratchetReleaseUpdate(dt) {
  const s=ratchetReleaseSession;if(!s)return false;
  if(s.save!==G.save||s.room!==G.roomId||s.hero!==player||player.dead){ratchetReleaseFinish(false);return false;}
  if(G.state==='PAUSE'){s.paused=true;s.root.style.display='none';return false;}
  if(s.paused&&G.state==='PLAY'){s.paused=false;s.root.style.display='flex';G.state='RATCHET_RELEASE';}
  if(G.state!=='RATCHET_RELEASE'){ratchetReleaseFinish(false);return false;}
  if(inP('BACK')||inP('PAUSE')||inP('OK')||inP('INT')){ratchetReleaseFinish(true);return true;}
  if(document.hidden||inputSuspended)return true;
  const im=ratchetReleaseImage(),heroArt=MEDIA_RAW.swingUppercut;
  if(!im||!heroArt||!heroArt.complete||!heroArt.naturalWidth){s.loading+=dt;mediaFetch(RATCHET_RELEASE_ART.key,true);if(s.loading>=RATCHET_RELEASE_ART.loadingLimit)ratchetReleaseFinish(true);return true;}
  s.started=true;s.t+=Math.min(.05,Math.max(0,dt));
  const a=RATCHET_RELEASE_ART;let t0=0,frame=3;
  for(let i=0;i<a.durations.length;i++){t0+=a.durations[i];if(s.t<t0){frame=i;break;}}
  s.frame=frame;
  // This is a short in-place reaction, not a new walk cycle or a damage event.
  // Allow at most the nearby interaction's small contact adjustment, eased out.
  const q=clamp(s.t/.22,0,1),ease=q*q*(3-2*q);
  player.x=s.startX+(s.geometry.heroX-s.startX)*ease;
  player.vx=player.vy=0;player.on=true;player.face=player.faceVis=-s.geometry.side;
  player.anim+=dt;
  if(s.t>=a.durations.reduce((sum,v)=>sum+v,0))ratchetReleaseFinish(true);
  return true;
}
function drawRatchetRelease(ctx,npc) {
  const s=ratchetReleaseSession,im=ratchetReleaseImage();
  if(!s||s.npc!==npc||s.room!==G.roomId||!s.started||!im)return false;
  const a=RATCHET_RELEASE_ART,height=npc.h*a.heightK,foot=s.geometry.foot;
  const ok=drawStripCell(ctx,a.key,s.frame,a.cells,foot.x,foot.y+2,height,s.geometry.side<0);
  if(ok){G.tinkerFrame='wrist-release:'+s.frame;G.ratchetContact={hand:s.geometry.hand,heroCenter:player.x+player.w/2,frame:s.frame};}
  return ok;
}

// Reuse the approved hero's overhead reach and lowering poses ONLY here. No
// attack is created, no physics/Player methods are replaced, and no effects
// from the uppercut are emitted. The two bodies share a measured hand point.
function drawRatchetReleaseHero(ctx) {
  const s=ratchetReleaseSession;
  if(!s||s.hero!==player||!s.started||!(s.frame===1||s.frame===2))return false;
  const clip=MEDIA_RAW.swingUppercut;if(!clip||!clip.complete||!clip.naturalWidth)return false;
  const frame=s.frame===1?3:4,k=s.geometry.heroK;
  const cx=player.x+player.w/2,fy=player.y+player.h,face=-s.geometry.side;
  const ok=drawStripCell(ctx,'swingUppercut',frame,6,cx,fy+HERO_FLOOR,HERO_DH*HERO_DELIVERY_K,face<0);
  if(ok){
    const hw=RATCHET_RELEASE_ART.heroWrist;
    const wrist={x:cx+face*(hw[0]-160)*k,y:fy+HERO_FLOOR+(hw[1]-320)*k};
    G.heroDrawn='ratchet-reaction:'+frame;
    if(s.frame===1)G.ratchetWristContact={npc:s.geometry.hand,hero:wrist,error:Math.hypot(wrist.x-s.geometry.hand.x,wrist.y-s.geometry.hand.y)};
  }
  return ok;
}
