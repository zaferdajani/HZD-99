// The opening yard's machine uses the supplied modular artwork. Its housing
// remains intact when the motor is isolated; no severed-belt drawing exists.
const YARD_WINCH = Object.freeze({ scale: 192 / 1191, armScale: 0.62,
  floor: [630,879], mount: [575,385], pivot: [1140,648], tip: [84,703],
  cable: [1140,544], lens: [[663,442],[742,451],[742,503],[663,494]] });
// THE ARM IS THE REASON TO HIT IT (owner, 2026-10-11: "Either I hit the winch
// to get something out of it, or I hit an enemy, but not just hitting for the
// sake of hitting"). While the infection holds it, the arm is jammed DOWN
// across the road — its end a shin's height off the ground, west of the
// housing, between her and the monument — and it is a real barrier, not a
// picture of one. Every strike knocks scrap out of the housing onto the road
// (a few pieces, capped and saved, so it cannot be farmed); the Volt Burst
// stops the motor, and the arm swings up clear of the road and stays there.
// Angles are the arm's rotation about its pivot (armPoint): JAM puts the tip
// 15 px above the road 75 px west of the base's centre, RAISED stands it
// steeply up out of the way.
const WINCH_JAM = 0.6, WINCH_RAISED = -1.05, WINCH_LIFT = 2.4, WINCH_FRONT = -0.6;
const WINCH_KNOCKS = 4, WINCH_KNOCK_SCRAP = 3;
// the barrier stands while the opening teaches and the burst has not landed,
// and nowhere else: never in NOSTOS (no winch there, and its tutorial differs),
// never in a save whose burst is behind her
function winchBlocking(e) {
  return !!(e && e.mechanism === 'winch' && !e.dead && !e.disabled && !e.rescued && e.calm
    && !(typeof isHero === 'function' && isHero())
    && G.save && G.save.flags && !G.save.flags.burstDone
    && typeof opTeaching === 'function' && opTeaching());
}

class YardWinch extends Enemy {
  constructor(x,y) {
    super('turret',x,y);
    const floor=y+this.h, cx=x+this.w/2;
    this.w=120; this.h=78; this.x=cx-this.w/2; this.y=floor-this.h;
    this.mechanism='winch'; this.actorRole='empty-construct';
    this.hp=this.hpMax0=38; this.traits=[]; this.moves=[];
    this.armAngle=-0.25; this.phase='idle'; this.phaseT=0;
    this.face=-1; this.sweepHit=false; this.motorEnabled=true;
    this.vx=this.vy=0; this.liftLive=false; this.pushT=0; this.toldT=0;
    if(typeof mediaFetch==='function') { mediaFetch('yardWinchBase'); mediaFetch('yardWinchArm'); }
  }
  point(p) {
    const a=YARD_WINCH, s=a.scale;
    return {x:this.x+this.w/2+this.face*(p[0]-a.floor[0])*s,
      y:this.y+this.h+(p[1]-a.floor[1])*s};
  }
  armPoint(p=YARD_WINCH.tip, ang=this.armAngle) {
    const a=YARD_WINCH, m=this.point(a.mount), k=a.scale*a.armScale;
    const dx=-(p[0]-a.pivot[0])*k,dy=(p[1]-a.pivot[1])*k;
    return {x:m.x+this.face*(dx*Math.cos(ang)-dy*Math.sin(ang)),
      y:m.y+dx*Math.sin(ang)+dy*Math.cos(ang)};
  }
  // THE BARRIER: the jammed arm's end, on the side she comes from (face -1:
  // the arm reaches west, toward the gates and the booth). She is stopped only
  // while she is on that side — a body already past the base's centre (a
  // harness, a teleport) is never pulled back through it — so she cannot be
  // trapped on the wrong side of it.
  barrier() {
    const tip=this.armPoint(YARD_WINCH.tip,WINCH_JAM), cx=this.x+this.w/2;
    const pc=player.x+player.w/2;
    if(this.face<0) {
      const lim=tip.x-1;
      if(pc>=cx||player.x+player.w<=lim||player.y+player.h<this.y+this.h-260)return;
      player.x=lim-player.w; if(player.vx>0)player.vx=0;
      if(inD('RIGHT'))this.pushed();
    } else {
      const lim=tip.x+1;
      if(pc<=cx||player.x>=lim||player.y+player.h<this.y+this.h-260)return;
      player.x=lim; if(player.vx<0)player.vx=0;
      if(inD('LEFT'))this.pushed();
    }
  }
  // pushing on it answers: the arm judders against its jam, and — outside the
  // two lessons whose chip already says it — one line says why the road is shut
  pushed() {
    if(this.pushT<=0)sfx('block');
    this.pushT=0.35;
    if(this.toldT<=0) {
      this.toldT=5;
      const id=typeof opStepId==='function'?opStepId():null;
      if(id!=='atk'&&id!=='burst')G.toast(t('op_winch_block'));
    }
  }
  // SCRAP OUT OF THE HOUSING, on every strike the lesson lands (dealDmg calls
  // this after the damage): a piece pops from the housing's face and arcs onto
  // the road on HER side of the arm, where it is an ordinary pickup. Capped
  // per save (flags.winchKnock) — the burst's own salvage is paid in die().
  onStruck() {
    if(!this.calm||this.disabled||this.rescued||this.dead)return;
    if(typeof isHero==='function'&&isHero())return;
    const f=G.save&&G.save.flags; if(!f||f.burstDone)return;
    if(typeof opTeaching!=='function'||!opTeaching())return;
    const n=f.winchKnock|0; if(n>=WINCH_KNOCKS)return;
    f.winchKnock=n+1;
    const side=this.face<0?-1:1, hx=this.x+this.w/2+side*(this.w/2-14), hy=this.y+this.h*0.35;
    const s=new Scrap(hx-5,hy-5,WINCH_KNOCK_SCRAP);
    s.vx=side*rnd(90,150); s.vy=rnd(-330,-270);
    s.size=7;   // (drawn a size up: a phone has to see it come out)
    G.pickups.push(s);
    burst(hx,hy,8,'#ffd76a',170,0.4,260,2.2,true);
    sfx('hollow'); this.pushT=0.25;
    persist();
  }
  update(dt) {
    this.anim+=dt; this.hurtT=Math.max(0,this.hurtT-dt);
    this.vx=0; this.vy+=900*dt; moveEnt(this,dt);
    this.pushT=Math.max(0,this.pushT-dt); this.toldT=Math.max(0,this.toldT-dt);
    if(this.disabled) {
      this.motorEnabled=false;
      // THE ARM LIFTS CLEAR when the burst stops the motor (die() sets
      // liftLive), and a winch loaded already stopped is simply up.
      if(!this.liftLive)this.armAngle=WINCH_RAISED;
      else if(this.armAngle!==WINCH_RAISED) {
        const d=WINCH_RAISED-this.armAngle;
        this.armAngle=Math.abs(d)<=dt*WINCH_LIFT?WINCH_RAISED:this.armAngle+Math.sign(d)*dt*WINCH_LIFT;
        if(this.armAngle===WINCH_RAISED) {
          sfx('land'); const tp=this.armPoint();
          burst(tp.x,tp.y,6,'#ffd38b',90,0.3,160,2,true);
        }
      }
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
      // ...and the jam is DOWN across the road (WINCH_JAM), straining harder
      // while she pushes on it or strikes it. It stays down through the
      // frames between the burst landing and the motor stopping (burstNear,
      // js/opening.js) rather than jumping; a calm winch with no lesson
      // running — an older save's — keeps the old held pose over her head,
      // since nothing stops her there.
      const jam=winchBlocking(this)||!!this.burstNear, strain=0.035+0.05*Math.min(1,this.pushT/0.25);
      this.armAngle=(jam?WINCH_JAM:-0.25)+strain*Math.sin(this.anim*9)*Math.max(jam?0.35:0,Math.sin(this.anim*1.3));
      if(jam&&winchBlocking(this))this.barrier();
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
    this.liftLive=true; G.save.winchArmAngle=WINCH_RAISED;
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
  drawArm(c,arm,mount,k) {
    c.save();c.translate(mount.x,mount.y);c.rotate(this.armAngle);c.scale(-k,k);
    c.drawImage(arm,-YARD_WINCH.pivot[0],-YARD_WINCH.pivot[1]);c.restore();
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
    // THE JAMMED ARM IS IN FRONT OF THE HOUSING. Lowered across the road it
    // would otherwise sit behind the drum, and the thing in her way would be
    // the one thing she cannot see; it goes back behind the housing once the
    // lift has carried it up over the top (WINCH_FRONT).
    const front=this.armAngle>WINCH_FRONT&&(this.disabled?this.liftLive:(this.calm&&!this.rescued&&this.armAngle>0.2));
    if(!front)this.drawArm(c,arm,mount,k);
    c.drawImage(base,-a.floor[0]*s,-a.floor[1]*s,base.naturalWidth*s,base.naturalHeight*s);
    if(front)this.drawArm(c,arm,mount,k);
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
