// The opening yard's machine uses the supplied modular artwork. Its housing
// remains intact when the motor is isolated; no severed-belt drawing exists.
const YARD_WINCH = Object.freeze({ scale: 192 / 1191, armScale: 0.62,
  floor: [630,879], mount: [575,385], pivot: [1140,648], tip: [84,703],
  cable: [1140,544], lens: [[663,442],[742,451],[742,503],[663,494]] });

class YardWinch extends Enemy {
  constructor(x,y) {
    super('turret',x,y);
    const floor=y+this.h, cx=x+this.w/2;
    this.w=120; this.h=78; this.x=cx-this.w/2; this.y=floor-this.h;
    this.mechanism='winch'; this.actorRole='empty-construct';
    this.hp=this.hpMax0=38; this.traits=[]; this.moves=[];
    this.armAngle=-0.25; this.phase='idle'; this.phaseT=0;
    this.face=-1; this.sweepHit=false; this.motorEnabled=true;
    this.vx=this.vy=0;
    if(typeof mediaFetch==='function') { mediaFetch('yardWinchBase'); mediaFetch('yardWinchArm'); }
  }
  point(p) {
    const a=YARD_WINCH, s=a.scale;
    return {x:this.x+this.w/2+this.face*(p[0]-a.floor[0])*s,
      y:this.y+this.h+(p[1]-a.floor[1])*s};
  }
  armPoint(p=YARD_WINCH.tip) {
    const a=YARD_WINCH, m=this.point(a.mount), k=a.scale*a.armScale;
    const dx=-(p[0]-a.pivot[0])*k,dy=(p[1]-a.pivot[1])*k;
    return {x:m.x+this.face*(dx*Math.cos(this.armAngle)-dy*Math.sin(this.armAngle)),
      y:m.y+dx*Math.sin(this.armAngle)+dy*Math.cos(this.armAngle)};
  }
  update(dt) {
    this.anim+=dt; this.hurtT=Math.max(0,this.hurtT-dt);
    this.vx=0; this.vy+=900*dt; moveEnt(this,dt);
    if(this.disabled) {
      this.motorEnabled=false;
      if(Number.isFinite(G.save.winchArmAngle))this.armAngle=G.save.winchArmAngle;
      if(this.cleanseT>0) {
        const near=player&&!player.dead&&Math.abs(player.x+player.w/2-this.x-this.w/2)<46
          &&Math.abs(player.y+player.h/2-this.y-this.h/2)<60;
        if(!near||player.cores!==this.cleanseHP||G.state!=='PLAY')this.cleanseT=0;
        else {this.cleanseT-=dt;if(this.cleanseT<=0)this.finishCleanse();}
      }
      return;
    }
    if(this.rescued) {
      this.motorEnabled=true;
      this.armAngle+=clamp(-0.25-this.armAngle,-dt*0.35,dt*0.35);
      this.phase='safe'; return;
    }
    if(player.dead||G.state!=='PLAY')return;
    // CALM IS JAMMED, NOT SWINGING. While the opening teaches (updateTutor
    // keeps it calm) it is the strike and burst lessons' target: the arm hangs
    // across the road and judders against its own jam — it reads as stuck
    // machinery, and it never sweeps a harmless arm through her body.
    if(this.calm) {
      this.phase='idle';this.phaseT=0;this.sweepHit=false;
      this.armAngle=-0.25+0.035*Math.sin(this.anim*9)*Math.max(0,Math.sin(this.anim*1.3));
      return;
    }
    this.phaseT+=dt;
    if(this.phase==='idle') {
      this.armAngle=-0.25;
      if(this.phaseT>=1.2&&Math.abs(player.x+player.w/2-this.x-this.w/2)<250) {
        this.phase='tell';this.phaseT=0;this.sweepHit=false;sfx('tell');
      }
    } else if(this.phase==='tell') {
      this.armAngle=-0.25-0.3*Math.min(1,this.phaseT/0.65);
      if(this.phaseT>=0.65){this.phase='sweep';this.phaseT=0;sfx('swing');}
    } else if(this.phase==='sweep') {
      const previous=this.armPoint();
      this.armAngle=-0.55+1.2*Math.min(1,this.phaseT/0.32);
      const tip=this.armPoint(), cx=player.x+player.w/2,cy=player.y+player.h/2;
      const dx=tip.x-previous.x,dy=tip.y-previous.y;
      const u=clamp(((cx-previous.x)*dx+(cy-previous.y)*dy)/(dx*dx+dy*dy||1),0,1);
      const hit=Math.hypot(cx-previous.x-u*dx,cy-previous.y-u*dy)<player.w/2+13;
      if(hit&&!this.sweepHit&&player.iT<=0) {
        this.sweepHit=true;
        // The opening teaching target cannot take the player's final core.
        if(!this.calm&&player.cores>1)player.hurt(1,tip.x,'yard-winch');
        burst(tip.x,tip.y,6,'#ffd38b',110,0.25,140,2,true);
      }
      if(this.phaseT>=0.32){this.phase='recover';this.phaseT=0;}
    } else if(this.phase==='recover') {
      this.armAngle=0.65-0.9*Math.min(1,this.phaseT/1.1);
      if(this.phaseT>=1.1){this.phase='idle';this.phaseT=0;}
    }
  }
  die() {
    if(this.disabled||this.rescued||this.dead)return;
    // JAMMED, NOT BROKEN, while the opening teaches: claws dent it and it holds
    // on one point — the Volt Burst is what stops it (js/opening.js sets
    // burstOK on the release that lands). Without this a player still mashing
    // the strike lesson broke the burst lesson's target before it began.
    if(this.calm&&!this.burstOK&&typeof opTeaching==='function'&&opTeaching()){this.hp=Math.max(1,this.hp);return;}
    this.disabled=true;this.motorEnabled=false;this.hp=1;this.vx=this.vy=0;this.cleanseT=0;
    this.phase='disabled';
    const states=G.save.rescues||(G.save.rescues={});
    if(this.storyKey&&states[this.storyKey]!=='disabled') {
      states[this.storyKey]='disabled';bankScrap(12);player.gainVolts(8);G.save.flags.sawScrap=1;
    }
    G.save.winchArmAngle=this.armAngle;
    burst(this.x+this.w/2,this.y+this.h/2,10,'#ffc886',120,0.35,200,2,true);
    sfx('break');persist();
  }
  finishCleanse() {
    if(!this.disabled||!this.storyKey||!G.save.flags.crystal)return;
    const states=G.save.rescues||(G.save.rescues={});
    if(states[this.storyKey]==='rescued')return;
    states[this.storyKey]='rescued';this.disabled=false;this.rescued=this.calm=true;
    this.cleanseT=0;this.hp=this.hpMax0;this.phase='safe';this.motorEnabled=true;
    const p=this.point(YARD_WINCH.lens[0]);
    burst(p.x,p.y,9,'#7eeaff',90,0.55,-25,2,true);sfx('pick');
    G.toast(t('story_winch_clean'));persist();
  }
  draw(c) {
    const a=YARD_WINCH,s=a.scale,base=MEDIA_IMG.yardWinchBase,arm=MEDIA_IMG.yardWinchArm;
    if(!base||!base.complete||!base.naturalWidth||!arm||!arm.complete||!arm.naturalWidth)return;
    c.save();c.translate(this.x+this.w/2,this.y+this.h);c.scale(this.face,1);
    const pt=p=>({x:(p[0]-a.floor[0])*s,y:(p[1]-a.floor[1])*s});
    const cable=pt(a.cable),mount=pt(a.mount),k=s*a.armScale;
    c.lineCap='round';c.beginPath();c.moveTo(cable.x,cable.y);
    c.bezierCurveTo(cable.x+35,cable.y+32,cable.x+64,-3,cable.x+95,-2);
    c.strokeStyle='#1d1b1a';c.lineWidth=3;c.stroke();c.strokeStyle='#ab9876';c.lineWidth=1;c.stroke();
    c.save();c.translate(mount.x,mount.y);c.rotate(this.armAngle);c.scale(-k,k);
    c.drawImage(arm,-a.pivot[0],-a.pivot[1]);c.restore();
    c.drawImage(base,-a.floor[0]*s,-a.floor[1]*s,base.naturalWidth*s,base.naturalHeight*s);
    c.save();c.beginPath();a.lens.forEach((p,i)=>{const q=pt(p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y)});c.closePath();c.clip();
    const p0=pt(a.lens[0]),p2=pt(a.lens[2]);
    c.fillStyle=this.rescued?'#073f49':'#610909';c.fillRect(p0.x-2,p0.y-2,p2.x-p0.x+4,p2.y-p0.y+4);
    c.globalAlpha=this.disabled||this.rescued?0.95:0.75+0.2*Math.sin(this.anim*6);
    c.fillStyle=this.rescued?'#59efff':'#ff3927';c.fillRect(p0.x+1,p0.y+1,p2.x-p0.x-2,p2.y-p0.y-2);c.restore();
    infEyeMark(c,(p0.x+p2.x)/2,(p0.y+p2.y)/2);   // its one eye, for the infection (a rescued winch reports none)
    c.restore();
    // The warning follows the same pivot and tip used by the damaging sweep.
    if(this.phase==='tell') {const p=this.armPoint();c.save();c.strokeStyle='#ffc24a';c.lineWidth=2;
      c.beginPath();c.arc(p.x,p.y,15+3*Math.sin(this.anim*12),0,Math.PI*2);c.stroke();c.restore();}
    if(this.cleanseT>0){c.fillStyle='#9fefff';c.fillRect(this.x+this.w/2-14,this.y-6,28*(1-this.cleanseT/0.65),3);}
  }
}
