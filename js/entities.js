// CLAWBYTE — player, enemies, bosses, projectiles, pickups
const DIFFS = [
  { cores: 7, edmg: 1, ehp: 0.75, pdmg: 1.25, espd: 1, lives: 0 },
  { cores: 5, edmg: 1, ehp: 1, pdmg: 1, espd: 1, lives: 0 },
  { cores: 5, edmg: 2, ehp: 1.15, pdmg: 1, espd: 1.2, lives: 9 },
];
function DF() { return DIFFS[G.save.diff]; }
function hasCrest(id) { return G.save.equip.indexOf(id) >= 0; }
function hasMod(id) { return !!G.save.abil[id]; }
function hasSkill(id) { return G.save.skills && G.save.skills.indexOf(id) >= 0; }
// evolution: power milestones make the character visibly bigger and better-geared
function evoPts() {
  const s = G.save; if (!s) return 0;
  const bosses = ['Glitch', 'Brood', 'Atlas', 'Zero', 'Prism', 'Mother'].filter(b => s.flags && s.flags['boss' + b]).length;
  return Object.keys(s.abil || {}).length * 2 + (s.skills || []).length * 2 + bosses * 3 + (s.relics || []).length;
}
function evoTier() { const p = evoPts(); return p >= 26 ? 3 : p >= 14 ? 2 : p >= 5 ? 1 : 0; }
function relicHas(id) { return G.save.relics && G.save.relics.indexOf(id) >= 0; }

// ---- tile queries against the live room ----
function tileAt(tx, ty) {
  const g = G.grid;
  if (ty < 0 || ty >= g.length || tx < 0 || tx >= g[0].length) return '.';
  if (G.roomId === 'D3' && !G.save.flags.bossZero && ty >= 15 && tx >= 15 && tx <= 17) return '#';
  const c = g[ty][tx];
  if (c === 'B' && G.save.broken[G.roomId + ':' + tx + ',' + ty]) return '.';
  return c;
}
function solidAt(tx, ty) { const c = tileAt(tx, ty); return c === '#' || c === 'B'; }
// ---- sprite-sheet helpers (real hand-animated art; see assets/CREDITS.md) ----
function sheetReady(key) { return typeof MEDIA_IMG !== 'undefined' && !!MEDIA_IMG[key]; }
// draw one frame of a uniform sheet, standing on the local origin (feet at 0,0)
function drawSheet(c, key, n, cw, ch, frame, scale, yOff) {
  const img = MEDIA_IMG[key]; if (!img) return false;
  const f = clamp(frame | 0, 0, n - 1);
  const dw = cw * scale, dh = ch * scale;
  c.imageSmoothingEnabled = false;
  c.drawImage(img, f * cw, 0, cw, ch, -dw / 2, -dh + (yOff || 0), dw, dh);
  c.imageSmoothingEnabled = true;
  return true;
}
// soft contact shadow — the cheapest, strongest "grounded / lit scene" cue
function contactShadow(c, cx, feetY, w, alpha) {
  c.save();
  const g = c.createRadialGradient(cx, feetY, 1, cx, feetY, w);
  g.addColorStop(0, 'rgba(0,0,0,' + (alpha || 0.4) + ')');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.beginPath(); c.ellipse(cx, feetY, w, w * 0.32, 0, 0, 7); c.fill();
  c.restore();
}
function moveEnt(e, dt) {
  const col = { l: 0, r: 0, u: 0, d: 0 };
  e.x += e.vx * dt;
  const t0 = Math.floor(e.y / TILE), t1 = Math.floor((e.y + e.h - 1) / TILE);
  if (e.vx > 0) {
    const tx = Math.floor((e.x + e.w) / TILE);
    for (let ty = t0; ty <= t1; ty++) if (solidAt(tx, ty)) { e.x = tx * TILE - e.w - 0.01; e.vx = 0; col.r = 1; break; }
  } else if (e.vx < 0) {
    const tx = Math.floor(e.x / TILE);
    for (let ty = t0; ty <= t1; ty++) if (solidAt(tx, ty)) { e.x = (tx + 1) * TILE + 0.01; e.vx = 0; col.l = 1; break; }
  }
  const prevB = e.y + e.h;
  e.y += e.vy * dt;
  const x0 = Math.floor(e.x / TILE), x1 = Math.floor((e.x + e.w - 1) / TILE);
  if (e.vy >= 0) {
    const ty = Math.floor((e.y + e.h) / TILE);
    for (let tx = x0; tx <= x1; tx++) {
      const c = tileAt(tx, ty);
      if (c === '#' || c === 'B' || (c === '=' && prevB <= ty * TILE + 1)) { e.y = ty * TILE - e.h - 0.01; e.vy = 0; col.d = 1; break; }
    }
  } else {
    const ty = Math.floor(e.y / TILE);
    for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) { e.y = (ty + 1) * TILE + 0.01; e.vy = 0; col.u = 1; break; }
  }
  return col;
}
function onSpike(e) {
  const x0 = Math.floor((e.x + 5) / TILE), x1 = Math.floor((e.x + e.w - 5) / TILE);
  const y0 = Math.floor((e.y + 6) / TILE), y1 = Math.floor((e.y + e.h - 2) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileAt(tx, ty) === '^') return true;
  return false;
}
function groundAhead(e, dir) {
  const tx = Math.floor((dir > 0 ? e.x + e.w + 3 : e.x - 3) / TILE);
  const ty = Math.floor((e.y + e.h + 4) / TILE);
  const c = tileAt(tx, ty);
  return c === '#' || c === 'B' || c === '=';
}
function touchingWall(e, dir) {
  const tx = Math.floor((dir > 0 ? e.x + e.w + 2 : e.x - 2) / TILE);
  const t0 = Math.floor((e.y + 4) / TILE), t1 = Math.floor((e.y + e.h - 4) / TILE);
  for (let ty = t0; ty <= t1; ty++) if (solidAt(tx, ty)) return true;
  return false;
}

// ================= PLAYER =================
class Player {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 24; this.h = 36;
    this.vx = 0; this.vy = 0; this.face = 1; this.on = false;
    this.cores = 5; this.volts = 33;
    this.coyote = 0; this.jbuf = 0; this.airJumps = 0;
    this.dashT = 0; this.dashCD = 0; this.iT = 0; this.atkCD = 0;
    this.swing = null; this.healT = 0; this.castCD = 0;
    this.dead = false; this.wallSlide = 0; this.trail = [];
    this.lastSafe = { x, y }; this.anim = 0; this.landT = 0;
    this.lean = 0; this.flipT = 0; this.jetT = 0; this.skidT = 0;
    this.combo = 0; this.comboT = 0; this.dashVX = 0; this.dashVY = 0; this.rechargeT = 0;
    this.chargeT = 0; this.chargeTick = 0; this.healTick = 0;
    this.clawT = 0; this.clawCD = 0; this.pounceT = 0;   // FERAL CLAWS (robo-cat)
    this.armCD = 0; this.songT = 0; this.songCD = 0; this.starCD = 0;
    this.downBuf = 0; this.pogoT = 0;
  }
  maxCores() { return G.save.coresMax + (hasCrest('plate') ? 1 : 0) + (relicHas('silent') ? 1 : 0); }
  speed() { return 340 * (hasCrest('sprint') ? 1.15 : 1) * (relicHas('shard') ? 1.04 : 1); }
  dmg() { return Math.round(12 * (hasCrest('claws') ? 1.25 : 1) * (1 + (relicHas('fang') ? 0.08 : 0) + (relicHas('whisker') ? 0.06 : 0)) * DF().pdmg); }
  voltMax() { return relicHas('collar') ? 110 : 99; }
  healCost() { return relicHas('coolant') ? 28 : 33; }
  gainVolts(n) { this.volts = clamp(this.volts + Math.round(n * (hasCrest('siphon') ? 1.5 : 1)) + (relicHas('silk') ? 2 : 0), 0, this.voltMax()); }
  update(dt) {
    if (this.dead) return;
    if (this.rechargeT > 0) {
      this.rechargeT -= dt; this.anim += dt;
      this.vx = 0; this.vy = Math.min(this.vy + 2300 * dt, 980);
      moveEnt(this, dt);
      return;
    }
    this.anim += dt;
    this.dashCD -= dt; this.atkCD -= dt; this.iT -= dt; this.castCD -= dt;
    this.jbuf -= dt; this.landT -= dt; this.comboT -= dt;
    const ice = !!G.roomDef.ice;
    const dir = (inD('RIGHT') ? 1 : 0) - (inD('LEFT') ? 1 : 0);
    const healing = this.healT > 0;

    if (this.dashT > 0) {
      this.dashT -= dt;
      this.vx = this.dashVX; this.vy = this.dashVY;
      if (this.dashT <= 0) { if (this.dashVY < 0) this.vy = -240; else this.vy = Math.min(this.vy, 320); }
      this.trail.push({ x: this.x, y: this.y, face: this.face, t: 0.25 });
    } else {
      // horizontal — crisp starts and stops
      const acc = (ice ? 1000 : 3000), fric = ice ? 260 : 2900;
      if (dir !== 0 && !healing) {
        this.vx += dir * acc * dt;
        this.vx = clamp(this.vx, -this.speed(), this.speed());
        this.face = dir;
      } else {
        const s = Math.sign(this.vx);
        this.vx -= s * fric * dt;
        if (Math.sign(this.vx) !== s) this.vx = 0;
      }
      // asymmetric gravity: quick rise, floaty apex hang, heavier fall
      let grav = this.vy < 0 ? 2150 : 3050;
      if (!this.on && Math.abs(this.vy) < 90) grav *= 0.55;
      this.vy = Math.min(this.vy + grav * dt, 1020);
      this.wallSlide = 0;
      if (hasMod('wall') && !this.on && this.vy > 0 && dir !== 0 && touchingWall(this, dir)) {
        this.vy = Math.min(this.vy, 150); this.wallSlide = dir;
        if (chance(0.3)) addPart(dir > 0 ? this.x + this.w : this.x, this.y + this.h * 0.7, -dir * 40, rnd(-20, 60), 0.3, PAL[G.roomDef.zone].glow, 2, 300, true);
      }
      // jumping
      if (inP('JUMP')) this.jbuf = 0.12;
      if (this.jbuf > 0) {
        if (this.on || this.coyote > 0) {
          this.vy = -770 * (relicHas('spring') ? 1.045 : 1);
          this.on = false; this.coyote = 0; this.jbuf = 0; this.jetT = 0.2; sfx('jump');
        } else if (this.wallSlide !== 0) {
          this.vy = -700; this.vx = -this.wallSlide * 430; this.face = -this.wallSlide; this.jbuf = 0;
          this.jetT = 0.22; this.flipT = 0.5; sfx('jump');
          burst(this.wallSlide > 0 ? this.x + this.w : this.x, this.y + this.h / 2, 6, PAL[G.roomDef.zone].glow, 140, 0.3, 400, 3, true);
        } else if (this.airJumps > 0) {
          this.vy = -680; this.airJumps--; this.jbuf = 0;
          this.jetT = 0.3; this.flipT = 0.5; sfx('djump');
          burst(this.x + this.w / 2, this.y + this.h, 10, '#8ff6ff', 160, 0.35, 500, 3, true);
        }
      }
      if (!inD('JUMP') && this.vy < -240) this.vy = -240;
      // omnidirectional dash — travels at the angle you hold
      if (inP('DASH') && hasMod('dash') && this.dashCD <= 0) {
        let ddx = (inD('RIGHT') ? 1 : 0) - (inD('LEFT') ? 1 : 0);
        let ddy = (inD('UP') ? -1 : 0) + (inD('DOWN') && !this.on ? 1 : 0);
        if (!ddx && !ddy) ddx = this.face;
        if (ddx) this.face = ddx;
        const dn = Math.hypot(ddx, ddy) || 1;
        this.dashVX = ddx / dn * 940;
        this.dashVY = ddy / dn * 880;
        this.dashT = 0.16 * (hasCrest('sprint') ? 1.2 : 1);
        this.dashCD = 0.45; this.vx = this.dashVX; this.vy = this.dashVY;
        this.healT = 0; sfx('dash');
      }
    }
    // pose state (ninja/robot animation)
    const leanT = clamp(this.vx * this.face / this.speed(), -1, 1) * 0.15
      + (!this.on && this.dashT <= 0 ? clamp(this.vy / 1800, -0.1, 0.16) : 0);
    this.lean = lerp(this.lean, leanT, 1 - Math.pow(0.002, dt));
    this.flipT = Math.max(0, this.flipT - dt);
    this.jetT = Math.max(0, this.jetT - dt);
    this.skidT = Math.max(0, this.skidT - dt);
    if (this.on && dir !== 0 && Math.sign(this.vx) === -dir && Math.abs(this.vx) > 200) {
      this.skidT = 0.14;
      if (chance(0.5)) addPart(this.x + this.w / 2 + dir * 10, this.y + this.h, dir * rnd(40, 110), rnd(-80, -20), 0.35, '#9fb8c8', 2.5, 600);
    }
    if (this.on && Math.abs(this.vx) > 280 && chance(0.1))
      addPart(this.x + this.w / 2 - this.face * 10, this.y + this.h - 2, -this.face * rnd(20, 60), rnd(-40, -10), 0.3, '#8fa3b5', 2, 500);
    // ---- FERAL CLAWS: the robo-cat's signature power ----
    // the volt-blade dissolves into twin purple energy claws, a halo of light
    // wraps the frame, and every strike becomes a raking claw hit
    this.clawT = Math.max(0, this.clawT - dt);
    this.clawCD = Math.max(0, this.clawCD - dt);
    this.pounceT = Math.max(0, this.pounceT - dt);
    const heroP = typeof isHero === 'function' && isHero();
    if (inP('CLAW') && this.clawCD <= 0 && this.clawT <= 0 && this.volts >= 30) {
      this.volts -= 30;
      this.clawT = 7; this.clawCD = 11;
      sfx('chargeReady'); sfx('cast');
      G.flash = Math.max(G.flash, heroP ? 0.42 : 0.3);
      cam.shake = Math.max(cam.shake, heroP ? 7 : 5);
      G.addRing(this.x + this.w / 2, this.y + this.h / 2);
      const c1 = heroP ? '#ffd76a' : '#b06aff';
      burst(this.x + this.w / 2, this.y + this.h / 2, 26, c1, 300, 0.7, 60, 3, true);
      burst(this.x + this.w / 2, this.y + this.h / 2, 12, '#ffffff', 200, 0.5, 20, 2, true);
      if (heroP) {
        // the sky answers: a bolt from Olympus strikes the hero as he is blessed
        G.bolt = { x: this.x + this.w / 2, y: this.y + this.h / 2, t: 0.35, t0: 0.35 };
        burst(this.x + this.w / 2, this.y, 18, '#fff6c0', 260, 0.6, -60, 3, true);
      }
      G.toast(t(heroP ? 'wrath_on' : 'claw_on'));
    }
    if (this.clawT > 0 && chance(0.5))
      addPart(this.x + rnd(-6, this.w + 6), this.y + rnd(0, this.h), rnd(-18, 18), rnd(-42, -12), 0.5,
        heroP ? (chance(0.5) ? '#ffd76a' : '#fff6c0') : (chance(0.5) ? '#b06aff' : '#e0a0ff'), 2.2, -40, true);
    // Down is buffered: players press DOWN and ATK together, and whichever lands
    // first used to decide the swing. Holding the intent for a beat fixes that.
    if (inD('DOWN')) this.downBuf = 0.16; else this.downBuf -= dt;
    this.pogoT -= dt;
    // attack — aim in 8 directions, 3-hit ninja combo
    if (inP('ATK') && this.atkCD <= 0) {
      this.atkCD = 0.36 * (hasCrest('over') ? 0.7 : 1);
      let ax = (inD('RIGHT') ? 1 : 0) - (inD('LEFT') ? 1 : 0);
      let ay = (inD('UP') ? -1 : 0) + (this.downBuf > 0 && !this.on ? 1 : 0);
      // a down-attack goes straight down. Diagonal aim used to push the hitbox
      // forward of whatever you were standing over, which is why it kept missing.
      if (ay > 0) ax = 0;
      if (!ax && !ay) ax = this.face;
      if (ax) this.face = ax;
      this.combo = this.comboT > 0 ? (this.combo + 1) % 3 : 0;
      this.comboT = 0.9;
      const ang = Math.atan2(ay, ax);
      this.swing = { t: 0.12, ax, ay, ang, combo: this.combo, set: new Set() };
      this.swingVis = { t: 0.24, t0: 0.24, ang, combo: this.combo };
      if (hasSkill('wave')) {
        const wn = Math.hypot(ax, ay) || 1;
        G.projs.push(new Proj(this.x + this.w / 2 + ax / wn * 22, this.y + this.h / 2 - 2 + ay / wn * 22,
          ax / wn * 430, ay / wn * 430, true, Math.round(8 * DF().pdmg), 7, PAL[G.roomDef.zone].glow, 0, 0.34));
      }
      if (this.combo === 2 && this.on && !ay) this.vx += ax * 210;
      // PAW PUNCH — in claw mode the finisher becomes a pouncing strike:
      // she launches at the target like a cat, claws first
      if (this.clawT > 0 && this.combo === 2) {
        if (heroP) {
          // THUNDERFALL — Zeus answers the strike: a bolt falls from the sky
          const tx2 = this.x + this.w / 2 + ax * 46, ty2 = this.y + this.h / 2 + ay * 20;
          G.bolt = { x: tx2, y: ty2, t: 0.4, t0: 0.4 };
          G.flash = Math.max(G.flash, 0.5);
          cam.shake = Math.max(cam.shake, 9);
          G.addRing(tx2, ty2);
          sfx('boom');
          burst(tx2, ty2, 22, '#fff6c0', 320, 0.6, 120, 4, true);
          // the bolt itself wounds anything beneath it
          for (const e of G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'dorm' && G.boss.st !== 'intro' ? [G.boss] : [])) {
            if (e.dead) continue;
            if (Math.abs((e.x + e.w / 2) - tx2) < 46 && Math.abs((e.y + e.h / 2) - ty2) < 120) {
              e.hp -= Math.round(this.dmg() * 1.6); e.hurtT = 0.15;
              if (!(e instanceof Boss) && e.kind !== 'turret') { e.kbT = 0.3; e.vy -= 180; }
              if (e.hp <= 0) e.die(Math.sign(ax) || 1, -0.5);
            }
          }
        } else {
          this.pounceT = 0.22;
          this.vx += ax * 320;
          if (!this.on) this.vy = Math.min(this.vy, -80);
          cam.shake = Math.max(cam.shake, 5);
          sfx('wave');
          burst(this.x + this.w / 2 + ax * 18, this.y + this.h / 2 + ay * 18, 14, '#b06aff', 260, 0.4, 60, 3, true);
        }
      }
      this.healT = 0; sfx('atk');
    }
    // hold attack to charge the volt-burst
    if (inD('ATK') && this.dashT <= 0) {
      this.chargeT += dt;
      if (this.chargeT > 0.25) {
        this.chargeTick -= dt;
        if (this.chargeTick <= 0) { this.chargeTick = 0.11; sfxChargeTick(Math.min(1, this.chargeT / 0.6)); }
        if (chance(0.55)) addPart(this.x + rnd(-16, 40), this.y + rnd(-12, 48), 0, 0, 0.25,
          this.chargeT >= 0.6 ? '#ffffff' : PAL[G.roomDef.zone].glow, 2.5, -170, true);
        if (this.chargeT >= 0.6 && this.chargeT - dt < 0.6) sfx('chargeReady');
      }
    } else {
      if (this.chargeT >= 0.6) this.releaseCharged();
      this.chargeT = 0;
    }
    if (this.swingVis) { this.swingVis.t -= dt; if (this.swingVis.t <= 0) this.swingVis = null; }
    // heal
    if (inD('HEAL') && this.on && this.dashT <= 0 && this.volts >= this.healCost() && this.cores < this.maxCores()) {
      this.healT += dt; this.vx = 0;
      if (chance(0.5)) addPart(this.x + rnd(0, this.w), this.y + this.h, rnd(-20, 20), rnd(-120, -60), 0.5, '#aef7d8', 2.5, -50, true);
      this.healTick -= dt;
      if (this.healTick <= 0) { this.healTick = 0.16; sfxHealTick(this.healT / 0.85); }
      if (this.healT >= 0.85) {
        this.healT = 0; this.volts -= this.healCost(); this.cores++;
        G.coreFlash = { i: this.cores - 1, t: 0.5 };
        if (this.cores >= this.maxCores()) G.coresFullT = 0.8;
        sfx('heal'); burst(this.x + this.w / 2, this.y + this.h / 2, 16, '#aef7d8', 180, 0.5, 100, 3, true);
      }
    } else this.healT = 0;
    this.armCD -= dt; this.songT -= dt; this.songCD -= dt; this.starCD -= dt;
    // shuriken — hers from the start, aimed with UP or DOWN
    if (inP('STAR') && this.starCD <= 0) throwStar(this);
    // cycle the suit wheel (slot 0 is the plain bolt, so EMP is never lost)
    if (inP('ARM') && cycleArm(1)) {
      const a = activeArm();
      sfx('ui'); G.toast(a ? t('arm_' + a.id) : t('arm_none'));
    }
    // CAST fires whichever suit is worn; with none worn it is the old EMP bolt
    const arm = (typeof activeArm === 'function') ? activeArm() : null;
    const empCost = hasSkill('router') ? 18 : 26;
    if (inP('CAST') && arm && this.armCD <= 0 && this.volts >= arm.cost) {
      this.volts -= arm.cost; this.armCD = arm.cd;
      fireArm(this, arm);
    } else if (inP('CAST') && !arm && hasMod('emp') && this.castCD <= 0 && this.volts >= empCost) {
      this.volts -= empCost; this.castCD = 0.5; sfx('cast');
      G.projs.push(new Proj(this.x + this.w / 2 + this.face * 16, this.y + this.h / 2 - 4, this.face * 540, 0, true, Math.round(22 * DF().pdmg), 11, '#7df3ff'));
    }
    // the Song — quiets the orders without touching the body
    if (inP('SONG') && this.songCD <= 0 && this.volts >= SONG_COST) {
      this.songCD = 1.1;
      const n = playSong();
      if (n) G.toast(t('song_hit').replace('%s', n));
    }
    // resolve movement
    const wasFalling = this.vy;
    const col = moveEnt(this, dt);
    if (col.d) {
      if (!this.on && wasFalling > 420) {
        this.landT = wasFalling > 700 ? 0.22 : 0.12; sfx('land');
        burst(this.x + this.w / 2, this.y + this.h, wasFalling > 700 ? 14 : 6, '#9fb8c8', wasFalling > 700 ? 150 : 90, 0.35, 500, 2);
      }
      this.on = true; this.coyote = 0.1;
      this.airJumps = hasMod('djump') ? (hasSkill('triple') ? 2 : 1) : 0;
    } else { this.on = false; this.coyote -= dt; }
    if (this.on && Math.abs(this.vx) > 150 && this.dashT <= 0) {
      this.stepT = (this.stepT || 0) - dt;
      if (this.stepT <= 0) { this.stepT = 0.27; sfx('step'); }
    } else this.stepT = 0.1;
    // hazard tiles
    if (onSpike(this)) {
      this.hurt(1, this.x - this.vx);
      if (!this.dead) { this.x = this.lastSafe.x; this.y = this.lastSafe.y; this.vx = 0; this.vy = 0; }
    } else if (this.on && this.vy === 0) {
      // remember a safe spot (solid, non-hazard footing)
      const bx = Math.floor((this.x + this.w / 2) / TILE), by = Math.floor((this.y + this.h + 4) / TILE);
      if (solidAt(bx, by) && tileAt(bx, by - 1) !== '^' && tileAt(bx - 1, by) !== '^' && tileAt(bx + 1, by) !== '^')
        this.lastSafe = { x: this.x, y: this.y };
    }
    // swing hits
    if (this.swing && this.swing.t > 0) {
      // …and the other order too: ATK first, DOWN a frame later. Within the first
      // 60ms the swing is still re-aimable.
      if (this.swing.t > 0.06 && this.swing.ay <= 0 && !this.on && inD('DOWN')) {
        this.swing.ax = 0; this.swing.ay = 1; this.swing.ang = Math.PI / 2;
      }
      this.swing.t -= dt;
      const hb = this.hitbox();
      let pogo = false;
      const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
      const n0 = Math.hypot(this.swing.ax, this.swing.ay) || 1;
      const kx = this.swing.ax / n0 || this.face, ky = this.swing.ay / n0;
      for (const e of targets) {
        if (e.dead || this.swing.set.has(e)) continue;
        if (aabb(hb, e)) {
          this.swing.set.add(e);
          let dm = Math.round(this.dmg() * (this.swing.combo === 2 ? (hasSkill('calc') ? 1.55 : 1.35) : 1)
                              * (this.clawT > 0 ? 1.45 : 1));   // claws rake deeper
          if (relicHas('lens') && chance(0.1)) {
            dm *= 2;
            burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 10, '#ffffff', 340, 0.4, 100, 4, true);
          }
          dm = dealDmg(e, dm, armEl(), hb.x + hb.w / 2, hb.y + hb.h / 2, true);
          if (!(e instanceof Boss) && e.kind !== 'turret') {
            e.kbT = 0.26;
            e.vx += kx * 310;
            e.vy = Math.min(e.vy, 0) + ky * 220 - 120;
          }
          this.gainVolts(11);
          sfx(e instanceof Boss ? 'bosshit' : 'hit'); cam.shake = Math.max(cam.shake, 2.5);
          G.hitStop = Math.max(G.hitStop, 0.045);
          burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 14, '#fff2a8', 280, 0.35, 300, 3, true);
          burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 6, '#ffffff', 160, 0.2, 100, 2, true);
          if (this.swing.combo === 2) G.impact = { t: 0.12, t0: 0.12, x: hb.x + hb.w / 2, y: hb.y + hb.h / 2 };
          if (this.swing.ay > 0) pogo = true;
          if (e.hp <= 0) e.die(kx, ky);
        }
      }
      // hostile projectiles can be swatted
      for (const p of G.projs) if (!p.friendly && !p.dead && aabb(hb, p.box())) { p.dead = true; burst(p.x, p.y, 6, p.color, 150, 0.25, 300, 2, true); }
      // breakable + spike tiles in swing range
      const x0 = Math.floor(hb.x / TILE), x1 = Math.floor((hb.x + hb.w) / TILE);
      const y0 = Math.floor(hb.y / TILE), y1 = Math.floor((hb.y + hb.h) / TILE);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const c = tileAt(tx, ty);
        if (c === 'B') {
          // floor blocks (at/below the feet) only break with a DOWN-attack
          // (jump, hold down, hit); side/ceiling secret walls break normally
          const floorBlock = ty * TILE >= this.y + this.h - 6;
          if (this.swing.ay > 0 || !floorBlock) {
            G.breakTile(tx, ty);
            if (this.swing.ay > 0) pogo = true;
          }
        } else if (c === '^' && this.swing.ay > 0) pogo = true;
      }
      if (pogo && this.swing.ay > 0) {
        // A short, crisp rebound rather than a free jump — hold JUMP to get the
        // taller one. Either way you leave the enemy instead of falling into it.
        this.vy = inD('JUMP') ? -620 : -470;
        if (this.dashT > 0 && this.dashVY > 0) { this.dashT = 0; this.dashVY = 0; }
        this.iT = Math.max(this.iT, 0.18);   // no contact damage from what you just hit
        this.pogoT = 0.18;
        this.airJumps = hasMod('djump') ? (hasSkill('triple') ? 2 : 1) : 0;
        this.dashCD = Math.min(this.dashCD, 0); this.swing.t = 0; sfx('pogo');
        cam.shake = Math.max(cam.shake, 4);
        G.hitStop = Math.max(G.hitStop, 0.05);
        burst(this.x + this.w / 2, this.y + this.h + 4, 10, '#cfe8ff', 220, 0.3, 260, 3, true);
      }
    }
    for (let i = this.trail.length - 1; i >= 0; i--) { this.trail[i].t -= dt; if (this.trail[i].t <= 0) this.trail.splice(i, 1); }
  }
  releaseCharged() {
    this.chargeT = 0;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    sfx('chargedHit');
    cam.shake = 13; G.hitStop = Math.max(G.hitStop, 0.09);
    G.flash = Math.max(G.flash, 0.55);
    G.impact = { t: 0.16, t0: 0.16, x: cx, y: cy };
    G.addRing(cx, cy); G.addRing(cx, cy, 55);
    this.swingVis = { t: 0.32, t0: 0.32, ang: 0, combo: 3 };
    burst(cx, cy, 34, '#ffffff', 400, 0.6, 200, 4, true);
    burst(cx, cy, 20, PAL[G.roomDef.zone].glow, 300, 0.8, 100, 4, true);
    const R = 128, dm = Math.round(this.dmg() * 2.6);
    const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
    for (const e of targets) {
      if (e.dead) continue;
      const ex = e.x + e.w / 2 - cx, ey = e.y + e.h / 2 - cy;
      const d = Math.hypot(ex, ey);
      if (d > R + Math.max(e.w, e.h) / 2) continue;
      e.hp -= dm; e.hurtT = 0.2;
      const n = d || 1;
      if (!(e instanceof Boss) && e.kind !== 'turret') {
        e.kbT = 0.3; e.vx += ex / n * 420; e.vy = Math.min(e.vy, 0) + ey / n * 200 - 180;
      }
      this.gainVolts(11);
      if (e.hp <= 0) e.die(ex / n, ey / n);
    }
    // shatter breakables caught in the burst
    const t0x = Math.floor((cx - R) / TILE), t1x = Math.floor((cx + R) / TILE);
    const t0y = Math.floor((cy - R) / TILE), t1y = Math.floor((cy + R) / TILE);
    for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++)
      if (tileAt(tx, ty) === 'B') G.breakTile(tx, ty);
    if (hasSkill('wave')) {
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2;
        G.projs.push(new Proj(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24,
          Math.cos(a) * 430, Math.sin(a) * 430, true, Math.round(8 * DF().pdmg), 7, PAL[G.roomDef.zone].glow, 0, 0.34));
      }
      sfx('wave');
    }
  }
  hitbox() {
    const s = this.swing;
    const n = Math.hypot(s.ax, s.ay) || 1;
    const down = s.ay > 0 && !s.ax;
    // the down box starts at the feet and is wider than it is deep, so landing on
    // something slightly to one side still rebounds
    const R = down ? 46 : (s.combo === 2 ? 50 : 44);
    const half = down ? 32 : (s.combo === 2 ? 35 : 30);
    const cx = this.x + this.w / 2 + s.ax / n * R;
    const cy = this.y + this.h / 2 + s.ay / n * R;
    return { x: cx - half, y: cy - half, w: half * 2, h: half * 2 };
  }
  hurt(d, fromX) {
    if (this.dead || this.iT > 0) return;
    if (this.dashT > 0 && hasCrest('phantom')) return;
    if (relicHas('aegis') && !G.save.usedAegis) {
      G.save.usedAegis = true;
      this.iT = 1.2;
      sfx('chargeReady');
      G.addRing(this.x + this.w / 2, this.y + this.h / 2);
      G.toast(t('rl_aegis'));
      burst(this.x + this.w / 2, this.y + this.h / 2, 16, '#ffd76a', 240, 0.5, 200, 3, true);
      return;
    }
    this.cores -= d; this.iT = hasSkill('reflex') ? 1.65 : 1.3; this.healT = 0;
    cam.shake = 9; sfx('hurt');
    G.flash = Math.max(G.flash, 0.4); G.addRing(this.x + this.w / 2, this.y + this.h / 2);
    G.impact = { t: 0.09, t0: 0.09, x: this.x + this.w / 2, y: this.y + this.h / 2 };
    burst(this.x + this.w / 2, this.y + this.h / 2, 14, '#ff5f6d', 260, 0.5, 500, 3, true);
    const kbm = relicHas('ember') ? 0.5 : 1;
    this.vx = (Math.sign(this.x + this.w / 2 - fromX) * 250 || 250) * kbm; this.vy = -240 * kbm;
    if (this.cores <= 0 && hasCrest('nine') && !G.save.usedNine) {
      G.save.usedNine = true; this.cores = 3; this.iT = 2.2;
      sfx('win'); G.toast(t('c_nine'));
      burst(this.x + this.w / 2, this.y + this.h / 2, 26, '#ffd76a', 300, 0.8, 100, 4, true);
      return;
    }
    if (this.cores <= 0) this.die();
  }
  die() {
    if (this.dead) return;
    this.dead = true; sfx('boom');
    burst(this.x + this.w / 2, this.y + this.h / 2, 40, '#8ff6ff', 340, 0.9, 300, 4, true);
    G.onPlayerDeath();
  }
  // Odyssey hero — real hand-animated character art (CC0, ansimuz), with the
  // code-drawn rig kept as an automatic fallback until the sheets decode.
  drawHeroSprite(c, run, evo) {
    if (typeof MEDIA_IMG === 'undefined' || !MEDIA_IMG.heroIdle || !MEDIA_IMG.heroRun
        || !MEDIA_IMG.heroJump || !MEDIA_IMG.heroAtk) return false;
    // sheet, frame count, cell size (uniform grids measured from the art)
    let key, n, cw, ch, fps, fr;
    if (this.swingVis) {
      key = 'heroAtk'; n = 6; cw = 96; ch = 48;
      const p = clamp(1 - this.swingVis.t / this.swingVis.t0, 0, 0.999);
      fr = Math.floor(p * n);
    } else if (!this.on) {
      key = 'heroJump'; n = 5; cw = 61; ch = 77;
      fr = this.vy < -220 ? 1 : this.vy < 60 ? 2 : this.vy < 420 ? 3 : 4;
    } else if (run) {
      key = 'heroRun'; n = 12; cw = 66; ch = 48; fps = 16;
      fr = Math.floor(this.anim * fps) % n;
    } else {
      key = 'heroIdle'; n = 4; cw = 38; ch = 48; fps = 7;
      fr = Math.floor(this.anim * fps) % n;
    }
    fr = clamp(fr | 0, 0, n - 1);
    const img = MEDIA_IMG[key];
    // draw standing on the feet (local origin), scaled to the play size
    const s = 1.2, dw = cw * s, dh = ch * s;
    c.imageSmoothingEnabled = false;
    // grounded frames sit on the floor; the jump sheet is taller, keep feet aligned
    c.drawImage(img, fr * cw, 0, cw, ch, -dw / 2, -dh + 3, dw, dh);
    c.imageSmoothingEnabled = true;
    if (evo >= 3) {                       // apex halo stays, drawn over the art
      c.strokeStyle = '#c8ffa0'; c.shadowColor = '#c8ffa0'; c.shadowBlur = 9; c.lineWidth = 2;
      c.beginPath(); c.arc(0, -dh + 16, 13, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      c.shadowBlur = 0;
    }
    return true;
  }
  drawHeroRig(c, P, bob, run, ph, spdK, evo) {
    if (this.drawHeroSprite(c, run, evo)) return;
    const gold = evo >= 3 ? '#e6c56f' : '#c79a4e', goldD = '#8a6f38';
    const crim = '#b23140', crimD = '#7c2430', skin = '#d9a97a', skinD = '#b8895f';
    const b4 = bob * 0.4;
    // --- flowing crimson cloak behind ---
    const cw = Math.sin(this.anim * 5) * (2 + spdK * 4) + (this.on ? 0 : 5);
    c.fillStyle = crimD;
    c.beginPath(); c.moveTo(-3, -30 + bob);
    c.quadraticCurveTo(-16 - spdK * 14, -18 + cw, -14 - spdK * 18, 0 + cw);
    c.quadraticCurveTo(-6, -6, -3, -14 + bob); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,150,120,0.22)'; c.lineWidth = 1.4; c.stroke();
    // --- legs (human, two-segment, bronze greaves + sandals) ---
    const legH = (hipX, phase, front) => {
      const hipY = -15 + bob * 0.3; let footX, footY, lift = 0;
      if (run) { footX = hipX + Math.sin(phase) * 8; lift = Math.max(0, -Math.cos(phase)) * 5; footY = -lift; }
      else if (!this.on) { footX = hipX + 3; footY = -3; }
      else { footX = hipX + 1; footY = 0; }
      const kx = (hipX + footX) / 2 + (front ? 2 : -1), ky = (hipY + footY) / 2;
      c.strokeStyle = front ? skin : skinD; c.lineWidth = 5; c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath(); c.moveTo(hipX, hipY); c.lineTo(kx, ky); c.lineTo(footX, footY - 1); c.stroke();
      c.strokeStyle = front ? gold : goldD; c.lineWidth = 3;
      c.beginPath(); c.moveTo(kx, ky); c.lineTo(footX, footY - 1); c.stroke();
      c.fillStyle = goldD; c.fillRect(footX - 3, footY - 1, 8, 3);
    };
    legH(-5, ph + Math.PI, false); legH(5, ph, true);
    // --- pteruges (leather war-skirt strips) ---
    for (let i = -2; i <= 2; i++) {
      const sway = Math.sin(this.anim * 6 + i) * 1.5 + (run ? Math.sin(ph * 2) * 1 : 0);
      c.fillStyle = i % 2 ? '#8a5a34' : '#9c6a3e';
      c.beginPath(); c.moveTo(i * 4 - 2, -16 + b4); c.lineTo(i * 4 + 2, -16 + b4);
      c.lineTo(i * 4 + 2 + sway, -7); c.lineTo(i * 4 - 2 + sway, -7); c.closePath(); c.fill();
    }
    // --- back arm holding a round hoplite shield (hidden mid-swing) ---
    if (!this.swingVis) {
      c.fillStyle = gold;
      c.beginPath(); c.arc(-9, -19 + b4, 7.5, 0, 7); c.fill();
      c.strokeStyle = goldD; c.lineWidth = 1.5; c.beginPath(); c.arc(-9, -19 + b4, 7.5, 0, 7); c.stroke();
      c.fillStyle = crim; c.beginPath(); c.arc(-9, -19 + b4, 3, 0, 7); c.fill();
      c.fillStyle = goldD; c.beginPath(); c.arc(-9, -19 + b4, 1.2, 0, 7); c.fill();
    }
    // --- torso: crimson tunic under a shaded bronze breastplate ---
    const tg = c.createLinearGradient(0, -30, 0, -13);
    tg.addColorStop(0, crim); tg.addColorStop(1, crimD);
    c.fillStyle = tg; rr(c, -10, -30 + b4, 20, 18, 5); c.fill();
    const bpg = c.createLinearGradient(0, -30, 0, -15);
    bpg.addColorStop(0, '#f0dca0'); bpg.addColorStop(0.5, gold); bpg.addColorStop(1, goldD);
    c.fillStyle = bpg;
    c.beginPath(); c.moveTo(-9, -29 + b4); c.lineTo(9, -29 + b4); c.lineTo(8, -17 + b4);
    c.quadraticCurveTo(0, -13 + b4, -8, -17 + b4); c.closePath(); c.fill();
    c.strokeStyle = goldD; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -27 + b4); c.lineTo(0, -16 + b4); c.stroke();
    c.fillStyle = gold; c.beginPath(); c.arc(-8, -28 + b4, 4, 0, 7); c.arc(8, -28 + b4, 4, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,245,210,0.5)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-8, -28.5 + b4); c.lineTo(8, -28.5 + b4); c.stroke();
    // --- head: skin, helmet dome, nose-guard, flowing plume, an eye (emotion) ---
    const hy = -34 + bob;
    c.fillStyle = skin; c.fillRect(-2, -32 + b4, 6, 4);           // neck
    c.fillStyle = skin; rr(c, -1, hy - 8, 14, 13, 5); c.fill();   // face
    c.fillStyle = '#2a1e14'; c.fillRect(6, hy - 2, 3, 3);          // eye
    c.strokeStyle = '#2a1e14'; c.lineWidth = 1; c.beginPath(); c.moveTo(4.5, hy - 4); c.lineTo(9, hy - 3); c.stroke(); // brow
    c.fillStyle = gold; c.beginPath(); c.arc(6, hy - 3, 9, Math.PI, 0); c.fill(); // helmet dome
    c.fillRect(-3, hy - 4, 18, 3);
    c.fillStyle = goldD; c.fillRect(11, hy - 4, 2, 7);            // nose guard
    const pv = Math.sin(this.anim * 7) * 2 + (run ? Math.sin(ph * 2) * 1.5 : 0);
    c.fillStyle = crim;
    c.beginPath(); c.moveTo(3, hy - 11); c.quadraticCurveTo(-7, hy - 17, -11 - spdK * 4, hy - 7 + pv);
    c.quadraticCurveTo(-4, hy - 11, 3, hy - 8); c.closePath(); c.fill();
    if (evo >= 3) {
      c.strokeStyle = '#c8ffa0'; c.shadowColor = '#c8ffa0'; c.shadowBlur = 8; c.lineWidth = 2;
      c.beginPath(); c.arc(6, hy - 2, 11, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.shadowBlur = 0;
    }
    // --- front arm + LIVE SWORD (windup → sweep → follow-through on attack) ---
    let swAng;
    if (this.swingVis) {
      const sv = this.swingVis, p = 1 - sv.t / sv.t0;
      if (sv.combo === 2) swAng = -1.5 + p * 2.7;        // overhead finisher
      else if (sv.combo === 1) swAng = 1.0 - p * 1.9;    // rising cut
      else swAng = -0.9 + p * 1.9;                       // descending cut
    } else {
      swAng = -1.05 + Math.sin(this.anim * 2) * 0.07;    // ready stance, breathing
    }
    const shX = 6, shY = -26 + b4;
    const handX = shX + Math.cos(swAng) * 8, handY = shY + 6 + Math.sin(swAng) * 8;
    c.strokeStyle = skin; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(shX, shY); c.lineTo(handX, handY); c.stroke();
    c.strokeStyle = gold; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo((shX + handX) / 2, (shY + handY) / 2); c.lineTo(handX, handY); c.stroke();
    c.save(); c.translate(handX, handY); c.rotate(swAng + Math.PI / 2);
    c.fillStyle = goldD; c.fillRect(-1.6, -2, 3.2, 6); c.fillRect(-4.5, -2, 9, 2);  // hilt + guard
    const bl = 27, blg = c.createLinearGradient(0, -2, 0, -bl);
    blg.addColorStop(0, '#9aa7b8'); blg.addColorStop(0.5, '#eef3fa'); blg.addColorStop(1, '#ffffff');
    c.fillStyle = blg; c.shadowColor = this.swingVis ? '#ffffff' : 'rgba(0,0,0,0)'; c.shadowBlur = this.swingVis ? 8 : 0;
    c.beginPath(); c.moveTo(-2, -2); c.lineTo(-1.5, -bl + 3); c.lineTo(0, -bl); c.lineTo(1.5, -bl + 3); c.lineTo(2, -2); c.closePath(); c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(-0.4, -4); c.lineTo(0, -bl + 3); c.stroke();
    c.restore();
  }
  draw(c) {
    if (this.dead) return;
    if (this.iT > 0 && Math.floor(this.iT * 18) % 2 === 0) return;
    const P = PAL[G.roomDef.zone];
    for (const tr of this.trail) {
      c.save(); c.globalAlpha = tr.t * 1.5;
      c.translate(tr.x + this.w / 2, tr.y + this.h / 2);
      c.scale(tr.face, 1); c.fillStyle = P.glow;
      rr(c, -13, -6, 26, 18, 7); c.fill();
      c.beginPath(); c.arc(8, -12, 8, 0, 7); c.fill();
      c.beginPath(); c.moveTo(2, -16); c.lineTo(5, -25); c.lineTo(10, -17); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(11, -17); c.lineTo(15, -24); c.lineTo(17, -15); c.closePath(); c.fill();
      c.restore();
    }
    // contact shadow — tightens and darkens as the hero nears the ground
    {
      let gy = this.y + this.h, probe = 0;
      while (probe < 240 && !solidAt(Math.floor((this.x + this.w / 2) / TILE), Math.floor((gy + probe) / TILE))) probe += 8;
      const air = clamp(probe / 200, 0, 1);
      contactShadow(c, this.x + this.w / 2, gy + probe, this.w * (0.6 - air * 0.25), 0.45 * (1 - air * 0.7));
    }
    c.save();
    c.translate(this.x + this.w / 2, this.y + this.h);
    c.scale(this.face, 1);
    const run = this.on && Math.abs(this.vx) > 40 && this.dashT <= 0;
    const sprintK = clamp((Math.abs(this.vx) - 120) / 240, 0, 1);   // 0→1 into a full sprint
    // ninja stride: the faster she moves, the quicker and longer the cycle
    const ph = this.anim * (13 + sprintK * 7);
    const bob = run ? Math.sin(ph * 2) * (1.4 - sprintK * 0.9) : Math.sin(this.anim * 2.4) * 0.9;
    const heavy = this.landT > 0.14;
    const cr = this.landT > 0 ? (heavy ? 0.3 : 0.15) : (this.skidT > 0 ? 0.2 : (this.wallSlide !== 0 ? 0.1 : 0))
             + (run ? sprintK * 0.12 : 0);                          // low, coiled sprint carriage
    c.rotate(this.lean + (this.skidT > 0 ? -0.14 : 0) + (this.wallSlide !== 0 ? 0.1 : 0)
             + (run ? sprintK * 0.3 : 0));                          // pitched forward, chasing the ground
    if (this.flipT > 0) c.rotate(-(1 - this.flipT / 0.5) * Math.PI * 2);
    c.scale(1, 1 - cr);
    // evolution: the frame grows with each power milestone (visual only — hitbox unchanged)
    const evo = typeof evoTier === 'function' ? evoTier() : 0;
    c.scale(1 + evo * 0.07, 1 + evo * 0.07);
    const hero = typeof isHero === 'function' && isHero();
    const spdK = Math.min(1, Math.abs(this.vx) / 360);
    if (evo >= 3) {
      // apex aura — raw power radiating off the body
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.14 + Math.sin(this.anim * 3.2) * 0.05;
      const ag = c.createRadialGradient(0, -16, 6, 0, -16, 42);
      ag.addColorStop(0, hero ? '#ffd98a' : P.glow); ag.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = ag; c.beginPath(); c.arc(0, -16, 42, 0, 7); c.fill();
      c.restore(); c.globalAlpha = 1;
    }
    if (hero) {
      this.drawHeroRig(c, P, bob, run, ph, spdK, evo);
    } else {
    if (hero && evo >= 2) {
      // crimson war-cloak flowing behind
      const cwv = Math.sin(this.anim * 5) * (2 + spdK * 4);
      c.fillStyle = evo >= 3 ? '#8a1f2e' : '#7c2430';
      c.beginPath(); c.moveTo(-2, -27 + bob);
      c.quadraticCurveTo(-18 - spdK * 12, -20 + cwv, -16 - spdK * 16, -2 + cwv);
      c.quadraticCurveTo(-8, -8, -4, -12 + bob);
      c.closePath(); c.fill();
      if (!this.swingVis) {
        // round shield slung on the back
        c.fillStyle = evo >= 3 ? '#e6c56f' : '#b8934c';
        c.beginPath(); c.arc(-10, -18 + bob * 0.4, 8, 0, 7); c.fill();
        c.strokeStyle = '#8a6f38'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(-10, -18 + bob * 0.4, 8, 0, 7); c.stroke();
        c.fillStyle = '#8a6f38'; c.beginPath(); c.arc(-10, -18 + bob * 0.4, 2.5, 0, 7); c.fill();
      }
    }
    for (let i = 0; i < 2; i++) {
      const fl = Math.sin(this.anim * 9 + i * 1.9) * (2.5 + spdK * 5);
      const len = 14 + spdK * 16 + (this.on ? 0 : 6);
      c.strokeStyle = i ? '#a63740' : '#e0484f';
      c.lineWidth = 4 - i * 1.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(1, -24 + bob);
      c.quadraticCurveTo(-9 - len * 0.5, -27 + fl * 0.5 + i * 2 + bob, -13 - len, -22 + fl + i * 3 + bob);
      c.stroke();
    }
    if (!hero) {
      // tail — energy conduit
      c.strokeStyle = '#cfd8e6'; c.lineWidth = 3.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-11, -10);
      const tw = Math.sin(this.anim * 6) * 6;
      c.quadraticCurveTo(-24, -18 + tw, -21, -30 + tw * 1.4); c.stroke();
      c.strokeStyle = P.glow; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(-12.5, -12.5); c.quadraticCurveTo(-22, -19 + tw, -20.5, -28 + tw * 1.3); c.stroke();
      c.fillStyle = P.glow; c.beginPath(); c.arc(-21, -30 + tw * 1.4, 2.6, 0, 7); c.fill();
    }
    // segmented digitigrade legs with glowing joints
    const leg = (hipX, phase, front) => {
      const hipY = -9 + bob * 0.3;
      let fx, fy, lift = 0, knee = 0;
      if (run) {
        // stride reaches further and the knee drives higher the faster she goes
        const reach = 7.5 + sprintK * 7;
        fx = hipX + Math.sin(phase) * reach;
        lift = Math.max(0, -Math.cos(phase)) * (4.5 + sprintK * 7);
        fy = -lift;
        knee = Math.max(0, -Math.cos(phase)) * sprintK * 5;   // tucked knee on recovery
      } else if (!this.on) { fx = hipX + 2.5; fy = -4; }
      else { fx = hipX + 1; fy = 0; }
      const kx = (hipX + fx) / 2 - 3.5 - lift * 0.3 + knee, ky = (hipY + fy) / 2 - 1 - knee * 0.5;
      c.strokeStyle = front ? '#aab6c6' : '#7f8b9c'; c.lineWidth = 3.4; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(hipX, hipY); c.lineTo(kx, ky); c.lineTo(fx, fy - 1); c.stroke();
      c.fillStyle = front ? '#cfd8e6' : '#93a0b2';
      // the foot points on push-off instead of staying flat
      c.save(); c.translate(fx, fy - 1); c.rotate(run ? Math.cos(phase) * 0.5 * sprintK : 0);
      c.fillRect(-2.5, -1, 6, 2.6); c.restore();
      c.fillStyle = P.glow;
      c.beginPath(); c.arc(hipX, hipY, 1.9, 0, 7); c.arc(kx, ky, 1.5, 0, 7); c.fill();
      // dust kicks off the back foot at full tilt
      if (run && sprintK > 0.4 && front && Math.cos(phase) > 0.85 && chance(0.5))
        addPart(this.x + this.w / 2 - this.face * 8, this.y + this.h - 1,
                -this.face * rnd(50, 130), rnd(-60, -14), 0.32, '#9fb8c8', 2.4, 500);
    };
    // rear arm streams back too — both arms trailing is the ninja-run silhouette
    if (run && sprintK > 0.25) {
      const bAng = 1.3 + sprintK * 1.6 - Math.sin(ph) * 0.12;
      const bx2 = -4, by2 = -19 + bob * 0.4;
      c.strokeStyle = '#7f8b9c'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(bx2, by2);
      c.lineTo(bx2 + Math.cos(bAng) * 11, by2 + Math.sin(bAng) * 11);
      c.stroke();
    }
    // speed smear behind her at full sprint
    if (run && sprintK > 0.5) {
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.1 * sprintK;
      c.fillStyle = P.glow;
      for (let k = 1; k <= 2; k++) rr(c, -13 - k * 7, -24 + bob * 0.4, 26, 20, 7), c.fill();
      c.restore(); c.globalAlpha = 1;
    }
    leg(-7, ph + Math.PI, false); leg(6, ph, true);
    // EMPOWERED halo — violet Feral Claws (cat) / golden Wrath of Olympus (hero)
    if (this.clawT > 0) {
      const divine = hero;
      c.save(); c.globalCompositeOperation = 'lighter';
      const pulse = 0.7 + Math.sin(this.anim * 7) * 0.3;
      const fade = Math.min(1, this.clawT / 1.2);              // dims as it expires
      const hg = c.createRadialGradient(0, -16, 4, 0, -16, 40);
      if (divine) {
        hg.addColorStop(0, 'rgba(255,225,140,0.5)');
        hg.addColorStop(0.5, 'rgba(255,180,60,0.3)');
        hg.addColorStop(1, 'rgba(255,180,60,0)');
      } else {
        hg.addColorStop(0, 'rgba(160,80,255,0.45)');
        hg.addColorStop(0.5, 'rgba(122,31,208,0.3)');
        hg.addColorStop(1, 'rgba(122,31,208,0)');
      }
      c.globalAlpha = (0.5 + pulse * 0.4) * fade;
      c.fillStyle = hg; c.beginPath(); c.arc(0, -16, 40, 0, 7); c.fill();
      // orbiting halo ring — a crown of light / a laurel of divine favour
      c.globalAlpha = (0.45 + pulse * 0.35) * fade;
      c.strokeStyle = divine ? '#ffd76a' : '#e0a0ff'; c.lineWidth = 2.2;
      c.beginPath(); c.ellipse(0, -34, 17, 5.5, Math.sin(this.anim * 1.6) * 0.25, 0, 7); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(0, -34, 17, 5.5, Math.sin(this.anim * 1.6) * 0.25, 0.6, 3.1); c.stroke();
      if (divine) {
        // static arcs crawling over the champion — the storm clings to him
        c.globalAlpha = fade * (0.5 + Math.sin(this.anim * 19) * 0.4);
        c.strokeStyle = '#fff6c0'; c.lineWidth = 1.3; c.lineCap = 'round';
        for (let k = 0; k < 2; k++) {
          const sx2 = rnd(-11, 11), sy2 = rnd(-32, -6);
          c.beginPath(); c.moveTo(sx2, sy2);
          c.lineTo(sx2 + rnd(-6, 6), sy2 + rnd(5, 11));
          c.lineTo(sx2 + rnd(-8, 8), sy2 + rnd(12, 20));
          c.stroke();
        }
      }
      c.restore(); c.globalAlpha = 1;
    }
    // volt-blade sheathed on the back (hidden mid-swing — it's in the paw)
    if (!this.swingVis && this.clawT <= 0) {
      c.save(); c.translate(-9, -22 + bob * 0.4); c.rotate(-0.85);
      c.fillStyle = '#8892a2'; c.fillRect(-2, 0, 4, 8);
      c.fillStyle = '#5c6678'; c.fillRect(-4.5, -1, 9, 3);
      const bg = c.createLinearGradient(0, -26, 0, 0);
      bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, P.glow);
      c.fillStyle = bg; c.shadowColor = P.glow; c.shadowBlur = 9;
      c.beginPath(); c.moveTo(-1.8, -2); c.lineTo(-1.8, -22); c.lineTo(0, -27); c.lineTo(1.8, -22); c.lineTo(1.8, -2); c.closePath(); c.fill();
      c.shadowBlur = 0; c.restore();
      if (!hero && evo >= 2) {
        // second volt-blade — crossed sheaths, war-ready
        c.save(); c.translate(-3, -21 + bob * 0.4); c.rotate(-1.3);
        c.fillStyle = '#8892a2'; c.fillRect(-1.6, 0, 3.2, 6);
        c.fillStyle = '#5c6678'; c.fillRect(-3.5, -1, 7, 2.6);
        c.fillStyle = evo >= 3 ? '#ffd76a' : P.glow; c.shadowColor = c.fillStyle; c.shadowBlur = 7;
        c.beginPath(); c.moveTo(-1.4, -2); c.lineTo(-1.4, -17); c.lineTo(0, -21); c.lineTo(1.4, -17); c.lineTo(1.4, -2); c.closePath(); c.fill();
        c.shadowBlur = 0; c.restore();
      }
    }
    // body — rounded chassis with top light, shadowed underside and a rim edge
    const by0 = -24 + bob * 0.4;
    const grad = c.createLinearGradient(0, by0 - 4, 0, by0 + 20);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.3, '#e8eef6');
    grad.addColorStop(0.72, '#b9c4d4'); grad.addColorStop(1, '#8b98ab');
    c.fillStyle = grad;
    rr(c, -13, by0, 26, 20, 7); c.fill();
    // ambient occlusion under the chest
    const ao2 = c.createLinearGradient(0, by0 + 9, 0, by0 + 20);
    ao2.addColorStop(0, 'rgba(60,75,95,0)'); ao2.addColorStop(1, 'rgba(45,58,75,0.5)');
    c.fillStyle = ao2; rr(c, -13, by0, 26, 20, 7); c.fill();
    // specular rim along the top-left of the shell
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-9, by0 + 2.5); c.quadraticCurveTo(-12.5, by0 + 3, -12.5, by0 + 8); c.stroke();
    c.strokeStyle = '#7d8a9c'; c.lineWidth = 1; rr(c, -13, by0, 26, 20, 7); c.stroke();
    // evolution gear on the torso
    if (!hero && evo >= 1) {
      // shoulder pauldron
      c.fillStyle = evo >= 3 ? '#4a5668' : '#68758a';
      rr(c, 0, -28 + bob * 0.4, 13, 7, 3); c.fill();
      c.strokeStyle = evo >= 3 ? '#ffd76a' : '#93a0b2'; c.lineWidth = 1;
      rr(c, 0, -28 + bob * 0.4, 13, 7, 3); c.stroke();
    }
    if (!hero && evo >= 2) {
      // armored chest plate
      c.fillStyle = 'rgba(90,104,124,0.85)';
      rr(c, -12, -23 + bob * 0.4, 15, 9, 4); c.fill();
      c.strokeStyle = evo >= 3 ? '#ffd76a' : 'rgba(150,165,185,0.8)'; c.lineWidth = 1;
      rr(c, -12, -23 + bob * 0.4, 15, 9, 4); c.stroke();
    }
    if (hero && evo >= 1) {
      // hammered bronze breastplate (gold at apex)
      c.fillStyle = evo >= 3 ? '#e6c56f' : '#b8934c';
      rr(c, -11, -23 + bob * 0.4, 21, 12, 5); c.fill();
      c.strokeStyle = '#8a6f38'; c.lineWidth = 1;
      rr(c, -11, -23 + bob * 0.4, 21, 12, 5); c.stroke();
      c.beginPath(); c.moveTo(-1, -21 + bob * 0.4); c.lineTo(-1, -13 + bob * 0.4); c.stroke();
    }
    // chest light
    c.fillStyle = P.glow; c.shadowColor = P.glow; c.shadowBlur = 8;
    c.beginPath(); c.arc(6, -15 + bob * 0.4, 2.6, 0, 7); c.fill(); c.shadowBlur = 0;
    // head — domed helm shading so it reads as a rounded 3D form
    const hy = -30 + bob;
    const hgd = c.createLinearGradient(0, hy - 10, 0, hy + 7);
    hgd.addColorStop(0, '#ffffff'); hgd.addColorStop(0.45, '#eef3fa'); hgd.addColorStop(1, '#a9b6c8');
    c.fillStyle = hgd;
    rr(c, -4, hy - 10, 20, 17, 6); c.fill();
    c.strokeStyle = '#7d8a9c'; rr(c, -4, hy - 10, 20, 17, 6); c.stroke();
    // cheek/jaw shadow + top specular
    c.fillStyle = 'rgba(70,88,110,0.28)';
    rr(c, -4, hy + 1, 20, 6, 4); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(0, hy - 8.5); c.lineTo(9, hy - 9); c.stroke();
    if (hero) {
      // bronze helmet with crimson crest (gold at apex)
      c.fillStyle = evo >= 3 ? '#e6c56f' : '#b8934c';
      c.beginPath(); c.arc(6, hy - 6, 11, Math.PI, 0); c.fill();
      c.fillRect(-5, hy - 7, 22, 3);
      c.strokeStyle = '#e0484f'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.arc(4, hy - 8, 13, Math.PI * 1.15, Math.PI * 1.8); c.stroke();
      if (evo >= 3) {
        // divine laurel glow
        c.strokeStyle = '#c8ffa0'; c.shadowColor = '#c8ffa0'; c.shadowBlur = 8; c.lineWidth = 2.5;
        c.beginPath(); c.arc(6, hy - 5, 12.5, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
        c.shadowBlur = 0;
      }
    } else {
      // ears
      c.fillStyle = '#dfe6f0';
      c.beginPath(); c.moveTo(-2, hy - 8); c.lineTo(1, hy - 18); c.lineTo(6, hy - 9); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(8, hy - 9); c.lineTo(12, hy - 18); c.lineTo(15, hy - 7); c.closePath(); c.fill();
      c.fillStyle = P.glow;
      c.beginPath(); c.moveTo(0, hy - 9.5); c.lineTo(1.5, hy - 15); c.lineTo(4.5, hy - 10); c.closePath(); c.fill();
      if (evo >= 3) {
        // apex antennae with glowing tips
        c.strokeStyle = '#ffd76a'; c.lineWidth = 1.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-1, hy - 12); c.lineTo(-4, hy - 21); c.moveTo(13, hy - 12); c.lineTo(16, hy - 21); c.stroke();
        c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 6;
        c.beginPath(); c.arc(-4, hy - 21, 1.6, 0, 7); c.arc(16, hy - 21, 1.6, 0, 7); c.fill();
        c.shadowBlur = 0;
      }
    }
    // visor eyes
    c.fillStyle = hero ? '#2a1e10' : '#0a1420'; rr(c, 1, hy - 6, 15, 7, 3); c.fill();
    c.fillStyle = this.healT > 0 ? '#aef7d8' : P.glow;
    c.shadowColor = c.fillStyle; c.shadowBlur = 7;
    c.fillRect(4, hy - 4.5, 4, 4); c.fillRect(10.5, hy - 4.5, 4, 4);
    c.shadowBlur = 0;
    if (!hero) {
      // whisker antennae
      c.strokeStyle = 'rgba(200,220,240,0.7)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(16, hy - 2); c.lineTo(21, hy - 4); c.moveTo(16, hy); c.lineTo(21, hy + 1); c.stroke();
    }
    // visor scan sweep
    const scn = this.anim % 2.6;
    if (scn < 0.45) {
      c.fillStyle = 'rgba(255,255,255,0.75)';
      c.fillRect(2 + (scn / 0.45) * 11, hy - 5.5, 2.4, 5.6);
    }
    // panel seam + vents on torso
    c.strokeStyle = 'rgba(70,85,105,0.55)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-9, -16 + bob * 0.4); c.lineTo(7, -16 + bob * 0.4); c.stroke();
    c.fillStyle = (this.dashT > 0 || this.healT > 0) ? P.glow : 'rgba(70,85,105,0.6)';
    for (let k = 0; k < 3; k++) c.fillRect(-10 + k * 3, -12 + bob * 0.4, 1.6, 4);
    // --- front arm that actually GRIPS the volt-blade and swings it ---
    {
      const shX = 6, shY = -20 + bob * 0.4;
      let ang, reach = 12;
      if (this.swingVis) {
        // the paw carries the blade through the whole arc of each combo
        const sv = this.swingVis, pr = clamp(1 - sv.t / sv.t0, 0, 1);
        const aim = sv.ang * (this.face < 0 ? -1 : 1);   // local space (already flipped)
        if (sv.combo === 2) ang = aim - 1.5 + pr * 2.8;  // overhead cross-slash
        else if (sv.combo === 1) ang = aim + 1.15 - pr * 2.2; // rising counter-cut
        else ang = aim - 1.0 + pr * 2.1;                 // descending cut
        reach = 13 + Math.sin(pr * Math.PI) * 4;         // extends through the strike
      } else if (run && sprintK > 0.25) {
        // NINJA SPRINT: blade arm sweeps back behind the body, trailing the run
        ang = 1.15 + sprintK * 1.55 + Math.sin(ph) * 0.12;
        reach = 12 + sprintK * 3;
      } else {
        const armSw = run ? Math.sin(ph + Math.PI) * 4 : 0;
        ang = 1.15 + armSw * 0.05 + Math.sin(this.anim * 2) * 0.05; // relaxed guard
      }
      const hx = shX + Math.cos(ang) * reach, hy = shY + Math.sin(ang) * reach;
      const ex = shX + Math.cos(ang - 0.5) * reach * 0.55, ey = shY + Math.sin(ang - 0.5) * reach * 0.55;
      // upper + fore arm
      c.strokeStyle = '#9aa7b8'; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(shX, shY); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
      c.fillStyle = '#cfd8e6'; c.beginPath(); c.arc(hx, hy, 2.4, 0, 7); c.fill();  // paw/grip
      c.fillStyle = P.glow; c.beginPath(); c.arc(shX, shY, 1.7, 0, 7); c.arc(ex, ey, 1.3, 0, 7); c.fill();
      // FERAL CLAWS: three purple energy talons splay from the paw
      if (this.clawT > 0) {
        c.save(); c.translate(hx, hy); c.rotate(ang);
        const flick = 0.85 + Math.sin(this.anim * 22) * 0.15;
        for (let k = -1; k <= 1; k++) {
          const len = (15 + Math.abs(k) * -3) * flick, spread = k * 0.34;
          c.save(); c.rotate(spread);
          const cg2 = c.createLinearGradient(0, 0, len, 0);
          cg2.addColorStop(0, 'rgba(255,255,255,0.95)');
          cg2.addColorStop(0.45, '#e0a0ff'); cg2.addColorStop(1, 'rgba(176,106,255,0)');
          c.fillStyle = cg2; c.shadowColor = '#b06aff'; c.shadowBlur = 12;
          c.beginPath(); c.moveTo(0, -2.2); c.quadraticCurveTo(len * 0.6, -1.6, len, 0);
          c.quadraticCurveTo(len * 0.6, 1.6, 0, 2.2); c.closePath(); c.fill();
          c.shadowBlur = 0; c.restore();
        }
        c.restore();
      }
      // the blade, held IN the paw — travels and rotates with the swing
      if (this.swingVis && this.clawT <= 0) {
        c.save(); c.translate(hx, hy); c.rotate(ang + Math.PI / 2);
        c.fillStyle = '#5c6678'; c.fillRect(-1.8, 0, 3.6, 7);        // grip
        c.fillStyle = '#8892a2'; c.fillRect(-4.5, -1.5, 9, 3);       // guard
        const bl = 30;
        const bg2 = c.createLinearGradient(0, -bl, 0, 0);
        bg2.addColorStop(0, '#ffffff'); bg2.addColorStop(0.55, '#eaf6ff'); bg2.addColorStop(1, P.glow);
        c.fillStyle = bg2; c.shadowColor = P.glow; c.shadowBlur = 12;
        c.beginPath(); c.moveTo(-2, -2); c.lineTo(-1.6, -bl + 4); c.lineTo(0, -bl);
        c.lineTo(1.6, -bl + 4); c.lineTo(2, -2); c.closePath(); c.fill();
        c.shadowBlur = 0;
        c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 0.9;
        c.beginPath(); c.moveTo(-0.4, -5); c.lineTo(0, -bl + 4); c.stroke();   // edge highlight
        c.restore();
      }
    }
    // thruster jets
    if (this.jetT > 0 || (!this.on && this.vy < -140 && this.dashT <= 0)) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const px of (this.flipT > 0 ? [-7, 6] : [-8])) {
        const L = rnd(8, 15) + (this.jetT > 0 ? 5 : 0);
        const jg = c.createLinearGradient(px, -6, px - 5, -6 + L + 8);
        jg.addColorStop(0, '#ffffff'); jg.addColorStop(0.4, '#8ff6ff'); jg.addColorStop(1, 'rgba(60,180,255,0)');
        c.fillStyle = jg;
        c.beginPath(); c.moveTo(px - 2.4, -6); c.lineTo(px + 2.4, -6); c.lineTo(px - 4, -6 + L + 8); c.closePath(); c.fill();
      }
      c.restore();
    }
    }
    c.restore();
    // volt-blade slashes — sharp tapered anime CUTS through space, not rings
    if (this.swingVis) {
      const sv = this.swingVis;
      const p = 1 - sv.t / sv.t0;
      const ease = p * p * (3 - 2 * p);
      const gcol = PAL[G.roomDef.zone].glow;
      const empowered = this.clawT > 0;
      const divineHit = empowered && typeof isHero === 'function' && isHero();
      const clawed = empowered && !divineHit;
      const col = divineHit ? '#ffd76a' : clawed ? '#b06aff' : (sv.combo === 2 ? '#ffd76a' : gcol);
      // WRATH OF OLYMPUS: the cut lands as a forked thunderbolt
      const boltCut = (len, wid, alpha) => {
        const hl = len / 2;
        c.save();
        for (let pass = 0; pass < 2; pass++) {
          c.globalAlpha = alpha * (pass ? 1 : 0.85);
          c.strokeStyle = pass ? '#ffffff' : '#ffb43c';
          c.lineWidth = pass ? 2.4 : 6.5; c.lineCap = 'round'; c.lineJoin = 'round';
          c.shadowColor = '#ffd76a'; c.shadowBlur = pass ? 12 : 24;
          c.beginPath(); c.moveTo(-hl, 6);
          for (let s2 = 1; s2 <= 4; s2++)
            c.lineTo(-hl + (len * s2) / 5 + rnd(-4, 4), -wid * 0.55 * Math.sin((s2 / 5) * Math.PI) + rnd(-5, 5));
          c.lineTo(hl, 2); c.stroke();
          // a forked branch splitting off the main arc
          c.lineWidth = pass ? 1.4 : 3.4;
          c.beginPath(); c.moveTo(0, -wid * 0.4);
          c.lineTo(hl * 0.35 + rnd(-4, 4), -wid * 0.15); c.lineTo(hl * 0.55, wid * 0.35);
          c.stroke();
        }
        c.shadowBlur = 0; c.restore(); c.globalAlpha = 1;
      };
      // in claw mode a strike is a RAKE: three parallel talon streaks
      const cut = divineHit ? boltCut : clawed ? (len, wid, alpha) => {
        const hl = len / 2;
        c.save();
        for (let k = -1; k <= 1; k++) {
          const off = k * wid * 0.34, thin = 3.4 - Math.abs(k) * 1.1;
          c.globalAlpha = alpha * (1 - Math.abs(k) * 0.18);
          // deep violet body so the rake stays purple through the bloom pass
          c.strokeStyle = '#8a2be2'; c.shadowColor = '#7a1fd0'; c.shadowBlur = 10;
          c.lineWidth = thin * 1.5; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(-hl * 0.95, 5 + off);
          c.quadraticCurveTo(0, -wid * 0.7 + off, hl * 0.95, 1 + off);
          c.stroke();
          c.strokeStyle = '#c77dff'; c.lineWidth = thin * 0.75; c.shadowBlur = 6;
          c.beginPath();
          c.moveTo(-hl * 0.95, 5 + off);
          c.quadraticCurveTo(0, -wid * 0.7 + off, hl * 0.95, 1 + off);
          c.stroke();
          c.shadowBlur = 0;
          c.strokeStyle = 'rgba(255,240,255,' + (alpha * 0.55) + ')'; c.lineWidth = thin * 0.22;
          c.beginPath();
          c.moveTo(-hl * 0.9, 5 + off);
          c.quadraticCurveTo(0, -wid * 0.7 + off, hl * 0.9, 1 + off);
          c.stroke();
        }
        c.restore(); c.globalAlpha = 1;
      } : (len, wid, alpha) => {
        const hl = len / 2;
        c.globalAlpha = alpha;
        // glow pass
        c.shadowColor = col; c.shadowBlur = 20;
        const gr = c.createLinearGradient(-hl, 0, hl, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.5, col);
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = gr;
        c.beginPath();
        c.moveTo(-hl, 6);
        c.quadraticCurveTo(0, -wid, hl, 2);
        c.quadraticCurveTo(0, -wid * 0.3, -hl, 6);
        c.closePath(); c.fill();
        c.shadowBlur = 0;
        // razor-white core edge
        c.strokeStyle = 'rgba(255,255,255,' + alpha + ')';
        c.lineWidth = 2.2; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-hl * 0.92, 4);
        c.quadraticCurveTo(0, -wid * 0.72, hl * 0.94, 1);
        c.stroke();
        // faint echo streak trailing the cut
        c.globalAlpha = alpha * 0.4;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(-hl * 0.7, 12);
        c.quadraticCurveTo(0, -wid * 0.35 + 10, hl * 0.75, 8);
        c.stroke();
        c.globalAlpha = 1;
      };
      if (sv.combo === 3) {
        // charged volt-burst: expanding ring blade with four radial cuts
        const cbx = this.x + this.w / 2, cby = this.y + this.h / 2;
        const R2 = 34 + ease * 104;
        c.save();
        c.translate(cbx, cby);
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = Math.min(1, (1 - p) * 1.7);
        c.strokeStyle = '#ffffff'; c.shadowColor = PAL[G.roomDef.zone].glow; c.shadowBlur = 26;
        c.lineWidth = 7 * (1 - p * 0.6);
        c.beginPath(); c.arc(0, 0, R2, 0, 7); c.stroke();
        c.lineWidth = 2.4;
        c.strokeStyle = PAL[G.roomDef.zone].glow;
        c.beginPath(); c.arc(0, 0, R2 * 0.72, 0, 7); c.stroke();
        c.rotate(ease * 1.2);
        c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineCap = 'round';
        for (let k = 0; k < 4; k++) {
          c.rotate(Math.PI / 2);
          c.beginPath(); c.moveTo(R2 * 0.4, 0); c.lineTo(R2 + 14, 0); c.stroke();
        }
        c.restore();
        c.globalAlpha = 1;
      } else {
      c.save();
      // the cut lives IN FRONT of the cat, along the aim direction
      const n2 = Math.hypot(Math.cos(sv.ang), Math.sin(sv.ang)) || 1;
      c.translate(
        this.x + this.w / 2 + Math.cos(sv.ang) * 38,
        this.y + this.h / 2 - 2 + Math.sin(sv.ang) * 38
      );
      c.globalCompositeOperation = 'lighter';
      const grow = 0.55 + ease * 0.65;         // the cut extends as it lands
      const drift = (1 - ease) * 0.22;         // slight rotation as it settles
      if (sv.combo === 0) {
        c.rotate(sv.ang - 0.38 + drift);       // descending diagonal cut
        c.scale(grow, 1);
        cut(118, 34, Math.min(1, (1 - p) * 1.7));
      } else if (sv.combo === 1) {
        c.rotate(sv.ang + 0.38 - drift);       // rising counter-cut
        c.scale(grow, -1);
        cut(118, 34, Math.min(1, (1 - p) * 1.7));
      } else {
        // finisher: golden X — two crossing cuts
        c.rotate(sv.ang - 0.5 + drift); c.scale(grow, 1);
        cut(142, 40, Math.min(1, (1 - p) * 1.7));
        c.rotate(1.0); c.scale(1, -1);
        cut(142, 40, Math.min(1, (1 - p) * 1.4));
      }
      c.restore();
      c.globalAlpha = 1;
      }
    }
    // charging aura on the blade
    if (this.chargeT > 0.25) {
      const ck = Math.min(1, this.chargeT / 0.6);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.25 + ck * 0.35 + Math.sin(performance.now() / 90) * 0.12;
      const cg = c.createRadialGradient(this.x + 12, this.y + 14, 4, this.x + 12, this.y + 14, 30 + ck * 22);
      cg.addColorStop(0, ck >= 1 ? '#ffffff' : PAL[G.roomDef.zone].glow);
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = cg;
      c.beginPath(); c.arc(this.x + 12, this.y + 14, 30 + ck * 22, 0, 7); c.fill();
      c.restore(); c.globalAlpha = 1;
    }
    // FIREDASH — combustion-engine exhaust: white-hot core at the feet,
    // conical flame body fading behind, shock diamonds and shine flashes
    if (this.dashT > 0) {
      const dvx = this.dashVX || this.face * 900, dvy = this.dashVY || 0;
      const dn = Math.hypot(dvx, dvy) || 1;
      const ex = -dvx / dn, ey = -dvy / dn;          // exhaust direction (backwards)
      const pxn = -ey, pyn = ex;                     // perpendicular
      const now = performance.now();
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const foot of [-3.5, 3.5]) {              // twin nozzles, one per foot
        const bx = this.x + this.w / 2 + ex * 8 + pxn * foot;
        const by = this.y + this.h - 7 + ey * 6 + pyn * foot;
        const flick = 0.82 + Math.sin(now / 22 + foot) * 0.18;
        // layered cone: wide orange body → golden mid → white-hot core at the shoe
        for (const [len, wid, col, al] of [[62, 12, '#ff7a2e', 0.42], [42, 8, '#ffd76a', 0.6], [24, 5, '#ffffff', 0.9]]) {
          const L2 = len * flick;
          const tx = bx + ex * L2, ty = by + ey * L2;
          const g2 = c.createLinearGradient(bx, by, tx, ty);
          g2.addColorStop(0, col); g2.addColorStop(1, 'rgba(255,110,30,0)');
          c.fillStyle = g2; c.globalAlpha = al;
          c.beginPath();
          c.moveTo(bx + pxn * wid, by + pyn * wid);
          c.lineTo(bx - pxn * wid, by - pyn * wid);
          c.lineTo(tx, ty);
          c.closePath(); c.fill();
        }
        // shock diamonds along the plume — the jet-engine signature
        c.fillStyle = '#ffffff';
        for (let k = 1; k <= 3; k++) {
          const dd = (10 + k * 11) * flick, ds = (4 - k) * 1.5;
          const dx2 = bx + ex * dd, dy2 = by + ey * dd;
          c.globalAlpha = 0.75 - k * 0.18;
          c.beginPath();
          c.moveTo(dx2 + ex * ds * 1.6, dy2 + ey * ds * 1.6);
          c.lineTo(dx2 + pxn * ds, dy2 + pyn * ds);
          c.lineTo(dx2 - ex * ds * 1.6, dy2 - ey * ds * 1.6);
          c.lineTo(dx2 - pxn * ds, dy2 - pyn * ds);
          c.closePath(); c.fill();
        }
        // stray shine sparks flying off the plume
        for (let k = 0; k < 3; k++) {
          const sd = rnd(16, 58), sw = rnd(-9, 9);
          c.globalAlpha = rnd(0.3, 0.8);
          c.fillRect(bx + ex * sd + pxn * sw - 1, by + ey * sd + pyn * sw - 1, 2, 2);
        }
        // nozzle glow at the shoe
        const ng = c.createRadialGradient(bx, by, 1, bx, by, 9);
        ng.addColorStop(0, '#ffffff'); ng.addColorStop(1, 'rgba(255,160,60,0)');
        c.globalAlpha = 0.95; c.fillStyle = ng;
        c.beginPath(); c.arc(bx, by, 9, 0, 7); c.fill();
      }
      c.restore(); c.globalAlpha = 1;
    }
    // heal ring
    if (this.healT > 0) {
      c.strokeStyle = '#aef7d8'; c.globalAlpha = 0.7; c.lineWidth = 2;
      c.beginPath(); c.arc(this.x + this.w / 2, this.y + this.h / 2, 26 - this.healT * 18, 0, 7); c.stroke();
      c.globalAlpha = 1;
    }
  }
}

// ================= PROJECTILES =================
class Proj {
  constructor(x, y, vx, vy, friendly, dmg, r, color, grav, life) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.friendly = friendly; this.dmg = dmg; this.r = r; this.color = color;
    this.grav = grav || 0; this.life = life || 3; this.dead = false; this.el = null;
  }
  box() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
  update(dt) {
    this.life -= dt; if (this.life <= 0) { this.dead = true; return; }
    this.vy += this.grav * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (solidAt(Math.floor(this.x / TILE), Math.floor(this.y / TILE))) {
      this.dead = true; burst(this.x, this.y, 6, this.color, 130, 0.3, 400, 2, true); return;
    }
    if (this.friendly) {
      const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
      for (const e of targets) {
        if (e.dead) continue;
        if (aabb(this.box(), e)) {
          dealDmg(e, this.dmg, this.el || armEl(), this.x, this.y); this.dead = true;
          if (this.freeze) {                       // HALT: holds a target still
            e.stagT = Math.max(e.stagT || 0, 2.0);
            burst(this.x, this.y, 14, ELEM.glazz.glow, 200, 0.6, 40, 3, true);
          }
          if (this.pool) {                         // FORGE: splash where it lands
            for (const o of targets) {
              if (o === e || o.dead) continue;
              if (Math.hypot(o.x + o.w / 2 - this.x, o.y + o.h / 2 - this.y) < 78)
                dealDmg(o, Math.round(this.dmg * 0.6), 'hott', o.x + o.w / 2, o.y);
            }
            burst(this.x, this.y, 18, ELEM.hott.glow, 260, 0.7, 260, 4, true);
          }
          if (this.chain > 0) {                    // ARCLIGHT: jumps onward
            let best = null, bd = 190;
            for (const o of targets) {
              if (o === e || o.dead) continue;
              const d = Math.hypot(o.x + o.w / 2 - this.x, o.y + o.h / 2 - this.y);
              if (d < bd) { bd = d; best = o; }
            }
            if (best) {
              const nx = best.x + best.w / 2, ny = best.y + best.h / 2;
              const j = new Proj(this.x, this.y, (nx - this.x) * 4, (ny - this.y) * 4, true,
                                 Math.round(this.dmg * 0.75), this.r, this.color, 0, 0.3);
              j.el = this.el; j.chain = this.chain - 1; G.projs.push(j);
            }
          }
          if (!(e instanceof Boss) && e.kind !== 'turret') {
            e.kbT = 0.22; e.vx += Math.sign(this.vx) * 260; e.vy -= 120;
          }
          sfx('hit'); burst(this.x, this.y, 10, this.color, 200, 0.35, 200, 3, true);
          if (e.hp <= 0) e.die(Math.sign(this.vx), -0.3);
          return;
        }
      }
    } else if (!player.dead && aabb(this.box(), player)) {
      this.dead = true;
      player.hurt(DF().edmg, this.x);
    }
  }
  draw(c) {
    c.shadowColor = this.color; c.shadowBlur = 12; c.fillStyle = this.color;
    c.beginPath(); c.arc(this.x, this.y, this.r, 0, 7); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath(); c.arc(this.x, this.y, this.r * 0.4, 0, 7); c.fill();
  }
}

// ================= PICKUPS =================
class Scrap {
  constructor(x, y, val) {
    this.x = x; this.y = y; this.w = 10; this.h = 10; this.val = val;
    this.vx = rnd(-130, 130); this.vy = rnd(-320, -120); this.t = rnd(0, 9);
    this.dead = false;
  }
  update(dt) {
    this.t += dt;
    if (this.rest === undefined) this.rest = 0;
    // A shard that lands in spikes, or on a ledge you cannot stand on, used to be
    // gone for good. After a moment at rest it drifts to you instead.
    const settled = this.rest > 1.2;
    if (settled && !player.dead && dist2(this.x, this.y, player.x, player.y) < 320 * 320) {
      const dx = player.x + 12 - this.x, dy = player.y + 18 - this.y, d = Math.hypot(dx, dy) || 1;
      this.x += dx / d * 300 * dt; this.y += dy / d * 300 * dt;
      this.vx = 0; this.vy = 0;
      if (chance(dt * 8)) addPart(this.x, this.y, 0, -30, 0.4, '#ffd76a', 1.6, 0, true);
      if (aabb(this, player)) { this.dead = true; G.save.scrap += this.val; sfx('pick'); }
      return;
    }
    if (hasCrest('magnet') && !player.dead && dist2(this.x, this.y, player.x, player.y) < 210 * 210) {
      const dx = player.x + 12 - this.x, dy = player.y + 18 - this.y, d = Math.hypot(dx, dy) || 1;
      this.vx += dx / d * 1900 * dt; this.vy += dy / d * 1900 * dt;
    } else this.vy += 900 * dt;
    const pv = this.vy;
    const col = moveEnt(this, dt);
    if (col.d) { this.vy = pv < -50 ? 0 : -pv * 0.35; this.vx *= 0.82; }
    if (col.l || col.r) this.vx = 0;
    this.rest = (col.d && Math.abs(this.vy) < 30 && Math.abs(this.vx) < 20) ? this.rest + dt : 0;
    if (!player.dead && aabb(this, player)) {
      this.dead = true; G.save.scrap += this.val; sfx('pick');
      addPart(this.x, this.y, 0, -60, 0.4, '#ffd76a', 3, 0, true);
    }
  }
  draw(c) {
    const s = this.val >= 15 ? 6 : 4;
    c.save(); c.translate(this.x + 5, this.y + 5); c.rotate(this.t * 3);
    c.shadowColor = '#ffd76a'; c.shadowBlur = 8; c.fillStyle = '#ffd76a';
    c.fillRect(-s / 2, -s / 2, s, s);
    c.restore(); c.shadowBlur = 0;
  }
}
// THE HUSK — what is left standing where NYA-9 fell.
// Hollow Knight leaves a shade you must fight. A repair unit leaves something
// worse and more personal: her own previous chassis, still upright, still running
// the last orders she gave it, with the broadcast already behind its eyes. It
// holds the scrap and the charge she was carrying.
// Two ways to take it back, and they are not equal — walk into it and it gives up
// the scrap, or play the Song first and it remembers itself, releasing the charge
// as well. The recovery uses the one power that is hers.
class Pouch {
  constructor(x, y, amount) {
    this.x = x; this.y = y; this.w = 22; this.h = 30; this.amount = amount;
    this.vy = 0; this.vx = 0; this.dead = false; this.t = 0;
    this.calmed = false;                 // has the Song reached it
    this.volts = (G.save.pouchVolts || 0);
    this.drift = chance(0.5) ? 1 : -1;
    this.hypnoT = 0; this.stagT = 0; this.kind = 'husk';
  }
  update(dt) {
    this.t += dt;
    // the Song calms it — the same call that charms mimics
    if (!this.calmed && this.hypnoT > 0) {
      this.calmed = true;
      burst(this.x + 11, this.y + 12, 22, ELEM.murr.glow, 240, 0.8, -40, 3, true);
      sfx('powerUp'); G.toast(t('husk_calm'));
    }
    // it paces where it fell until it is calmed, then waits for her
    if (!this.calmed) {
      this.vx = this.drift * 22 * (0.6 + Math.sin(this.t * 1.6) * 0.4);
      if (!groundAhead(this, this.drift)) this.drift *= -1;
    } else this.vx = 0;
    this.vy += 900 * dt;
    const col = moveEnt(this, dt);
    if (col.l || col.r) this.drift *= -1;
    if (!player.dead && aabb(this, player)) {
      this.dead = true;
      G.save.scrap += this.amount;
      let msg = t('pouch_back') + '  +' + this.amount;
      if (this.calmed && this.volts > 0) {
        player.gainVolts(this.volts);
        msg += '  ·  +' + this.volts + '⚡';
      }
      G.save.pouch = null; G.save.pouchVolts = 0;
      sfx('bench'); G.toast(msg);
      burst(this.x + 11, this.y + 14, 26, this.calmed ? ELEM.murr.glow : '#ffd76a', 300, 0.7, 60, 4, true);
    }
  }
  draw(c) {
    const cx = this.x + 11, sway = Math.sin(this.t * (this.calmed ? 1.4 : 3.4)) * (this.calmed ? 1 : 2.2);
    contactShadow(c, cx, this.y + this.h, 11, 0.4);
    c.save(); c.translate(cx + sway * 0.3, this.y + this.h);
    // hollow chassis: her outline, emptied out
    const g = c.createLinearGradient(-9, -28, 8, 2);
    g.addColorStop(0, this.calmed ? '#6f8f96' : '#4a5560');
    g.addColorStop(1, '#151c24');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-8, 0); c.lineTo(-9, -16);
    c.quadraticCurveTo(-9, -26, 0, -26);
    c.quadraticCurveTo(9, -26, 9, -16); c.lineTo(8, 0);
    c.closePath(); c.fill();
    // ears, so it is unmistakably her shape
    c.beginPath(); c.moveTo(-7, -22); c.lineTo(-9, -31); c.lineTo(-2, -24); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(7, -22); c.lineTo(9, -31); c.lineTo(2, -24); c.closePath(); c.fill();
    // the eyes are the whole point: red while the broadcast still has it,
    // her own teal once the Song has reached it
    const col = this.calmed ? ELEM.murr.col : '#ff2f4f';
    c.fillStyle = col; c.shadowColor = col;
    c.shadowBlur = 10 + Math.sin(this.t * 5) * 5;
    c.fillRect(-6, -20, 4.2, 2.6); c.fillRect(1.8, -20, 4.2, 2.6);
    c.shadowBlur = 0;
    // the scrap it is holding, visible in the chest cavity
    c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 8;
    c.fillRect(-2.4, -13, 4.8, 4.8);
    c.shadowBlur = 0;
    c.restore();
    if (this.calmed) {   // it hums back
      c.save(); c.globalAlpha = 0.5 + Math.sin(this.t * 4) * 0.3;
      ftxt('♪', cx + 12, this.y - 4, 12, ELEM.murr.glow);
      c.restore(); c.globalAlpha = 1;
    }
  }
}

// glowing relic drop — grab it before you forget it
class RelicPickup {
  constructor(x, y, id) {
    this.x = x; this.y = y; this.w = 20; this.h = 20; this.id = id;
    this.vx = rnd(-60, 60); this.vy = -280; this.t = 0; this.dead = false;
  }
  update(dt) {
    this.t += dt;
    this.vy += 700 * dt;
    const col = moveEnt(this, dt);
    if (col.d) { this.vy = 0; this.vx *= 0.8; }
    if (chance(0.25)) addPart(this.x + 10, this.y + 10, rnd(-25, 25), rnd(-50, -10), 0.4, '#ffd76a', 2, 0, true);
    if (!player.dead && aabb(this, player)) {
      this.dead = true;
      G.grantRelic(this.id);
    }
  }
  draw(c) {
    const bob = Math.sin(this.t * 4) * 3;
    c.save(); c.translate(this.x + 10, this.y + 10 + bob);
    c.shadowColor = '#ffd76a'; c.shadowBlur = 14;
    c.fillStyle = '#2c2517'; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill();
    c.strokeStyle = '#ffd76a'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.stroke();
    c.shadowBlur = 0;
    c.font = '700 11px "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#ffd76a'; c.fillText(RELIC_ICONS[this.id] || '◆', 0, 1);
    c.restore();
  }
}
// ================= ENEMIES =================
const EKIND = {
  crawler: { w: 28, h: 20, hp: 30, spd: 62 },
  flier: { w: 26, h: 22, hp: 24, spd: 120 },
  turret: { w: 28, h: 30, hp: 45, spd: 0 },
  hopper: { w: 26, h: 24, hp: 36, spd: 180 },
  blob: { w: 34, h: 26, hp: 52, spd: 30 },
};
class Enemy {
  constructor(kind, x, y) {
    const k = EKIND[kind];
    this.kind = kind; this.x = x; this.y = y; this.w = k.w; this.h = k.h;
    this.hypnoT = 0; this.stagT = 0;
    this.hp = Math.round(k.hp * DF().ehp); this.spd = k.spd * DF().espd;
    this.vx = 0; this.vy = 0; this.dir = chance(0.5) ? 1 : -1;
    this.t = rnd(0.5, 2); this.sx = x; this.sy = y; this.hurtT = 0; this.dead = false; this.anim = rnd(0, 9);
    this.kbT = 0; this.tr = [];
  }
  update(dt) {
    this.anim += dt; this.hurtT -= dt;
    // charmed by the Song: it keeps the body and quiets the orders
    if (this.hypnoT > 0) {
      this.hypnoT -= dt; this.stagT = 0;
      this.vx = 0; this.vy += 900 * dt;
      moveEnt(this, dt);
      if (Math.random() < dt * 6) burst(this.x + this.w / 2, this.y - 4, 1, ELEM.murr.glow, 40, 0.6, -30, 2, true);
      return;
    }
    if (this.stagT > 0) { this.stagT -= dt; this.vx = 0; return; }
    // light trail — infected machines smear glowing red light as they move
    const mx = this.x + this.w / 2, my = this.y + this.h / 2;
    if (!this.tr.length || Math.hypot(mx - this.tr[0].x, my - this.tr[0].y) > 3) {
      this.tr.unshift({ x: mx, y: my });
      if (this.tr.length > 9) this.tr.pop();
      if ((Math.abs(this.vx) > 30 || Math.abs(this.vy) > 30) && chance(0.3))
        addPart(mx + rnd(-4, 4), my + rnd(-4, 4), -this.vx * 0.12, -this.vy * 0.12 - 14, 0.4, '#ff4f6d', 2.2, 0, true);
    } else if (this.tr.length > 1 && chance(0.25)) this.tr.pop();
    // knocked back: physics only — can be launched into spikes or off ledges
    if (this.kbT > 0) {
      this.kbT -= dt;
      this.vy += 2000 * dt;
      moveEnt(this, dt);
      this.vx *= Math.pow(0.02, dt);
      if (onSpike(this)) { this.die(Math.sign(this.vx) || 1, -0.4); return; }
      if (this.y > G.roomDef.h * TILE + 40) { this.die(0, 1); return; }
      if (!player.dead && aabb(this, player)) player.hurt(DF().edmg, this.x + this.w / 2);
      return;
    }
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    switch (this.kind) {
      case 'crawler': case 'blob': {
        this.vx = this.dir * this.spd * (this.kind === 'blob' ? (0.6 + Math.sin(this.anim * 4) * 0.4) : 1);
        this.vy += 2000 * dt;
        const col = moveEnt(this, dt);
        if (col.l) this.dir = 1; else if (col.r) this.dir = -1;
        else if (col.d && !groundAhead(this, this.dir)) this.dir *= -1;
        break;
      }
      case 'flier': {
        const near = dist2(cx, cy, px, py) < 300 * 300 && !player.dead;
        if (near) {
          const d = Math.hypot(px - cx, py - cy) || 1;
          this.vx += (px - cx) / d * 260 * dt; this.vy += (py - cy) / d * 260 * dt;
          const s = Math.hypot(this.vx, this.vy);
          if (s > this.spd) { this.vx *= this.spd / s; this.vy *= this.spd / s; }
        } else {
          this.vx = lerp(this.vx, Math.sin(this.anim * 1.3) * 40, 0.05);
          this.vy = lerp(this.vy, (this.sy - this.y) * 1.2 + Math.cos(this.anim * 1.7) * 30, 0.05);
        }
        moveEnt(this, dt);
        break;
      }
      case 'turret': {
        this.t -= dt;
        if (this.t <= 0 && !player.dead && dist2(cx, cy, px, py) < 440 * 440) {
          this.t = 2.2 / DF().espd;
          const d = Math.hypot(px - cx, py - cy) || 1;
          G.projs.push(new Proj(cx, cy - 6, (px - cx) / d * 270, (py - cy) / d * 270, false, 1, 6, PAL[G.roomDef.zone].glow));
          sfx('shoot');
        }
        break;
      }
      case 'hopper': {
        this.vy += 2000 * dt;
        const col = moveEnt(this, dt);
        if (col.d) {
          this.vx = 0; this.t -= dt;
          if (this.t <= 0 && !player.dead && Math.abs(px - cx) < 380) {
            this.t = rnd(1.1, 1.9);
            this.vy = -560; this.vx = Math.sign(px - cx) * this.spd;
            sfx('jump');
          }
        }
        break;
      }
    }
    // touch damage
    if (!player.dead && aabb(this, player)) player.hurt(DF().edmg, cx);
  }
  die(kx, ky) {
    if (this.dead) return;
    this.dead = true;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    sfx('edie');
    player.gainVolts(8);
    burst(cx, cy, 10, PAL[G.roomDef.zone].glow, 200, 0.4, 400, 3, true);
    G.wrecks.push(new Wreck(this, kx || 0, ky || 0));
  }
  draw(c) {
    const P = PAL[G.roomDef.zone];
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    // light trail — glowing red smear behind the moving machine
    if (this.tr.length > 2) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let i = 1; i < this.tr.length; i++) {
        const a = (1 - i / this.tr.length) * 0.28;
        c.strokeStyle = 'rgba(255,79,109,' + a.toFixed(3) + ')';
        c.lineWidth = Math.max(1, 6 * (1 - i / this.tr.length));
        c.beginPath(); c.moveTo(this.tr[i - 1].x, this.tr[i - 1].y); c.lineTo(this.tr[i].x, this.tr[i].y); c.stroke();
      }
      c.restore();
    }
    const flipS = (this.kind === 'flier' ? Math.sign(this.vx) || 1 : this.dir);
    // grounded creatures cast a contact shadow (lighting pass)
    if (this.kind !== 'flier') contactShadow(c, cx, this.y + this.h, this.w * 0.55, 0.38);
    // ---- hero world: real hand-animated creatures ----
    if (typeof isHero === 'function' && isHero()) {
      const SPR = {
        crawler: () => {
          const moving = Math.abs(this.vx) > 12;
          return moving ? ['houndRun', 5, 67, 32, Math.floor(this.anim * 14)]
                        : ['houndIdle', 6, 64, 32, Math.floor(this.anim * 7)];
        },
        flier: () => ['ghost', 7, 64, 80, Math.floor(this.anim * 8)],
        hopper: () => ['skull', 12, 64, 112, Math.floor(this.anim * 12)],
      };
      const pick = SPR[this.kind] && SPR[this.kind]();
      if (pick && sheetReady(pick[0])) {
        const [key, n, cw, ch, fr] = pick;
        c.save();
        if (this.hurtT > 0) c.globalAlpha = 0.6;
        c.translate(cx, this.y + this.h);
        c.scale(flipS, 1);
        // fit the art to the hitbox height, a touch larger for presence
        const sc = (this.h * 1.5) / ch;
        drawSheet(c, key, n, cw, ch, fr % n, sc, this.kind === 'flier' ? 6 : 2);
        c.restore();
        return;
      }
    }
    c.save();
    if (this.hurtT > 0) { c.globalAlpha = 0.6; }
    c.translate(cx, cy);
    // virus glitch — the infection makes the body stutter
    if (chance(0.04)) c.translate(rnd(-1.5, 1.5), rnd(-1.5, 1.5));
    const flip = flipS;
    c.scale(flip, 1);
    // always-on RED eyes: the infection marker — friendlies never have these
    // one recessed sensor, not two flat red squares. A charmed mimic goes cyan,
    // because the Song has quieted its orders for a moment.
    const eyes = (x, y, s) => {
      const st = this.hypnoT > 0 ? 'alert' : (this.stagT > 0 ? 'overdrive' : 'locked');
      drawSensor(c, x + s * 0.9, y + s * 0.6, s * 0.62, st, this.anim);
    };
    // shaded metal body gradient (top-lit → dark belly) for dimensionality
    const eg = c.createLinearGradient(0, -12, 0, 14);
    eg.addColorStop(0, '#616e82'); eg.addColorStop(0.55, '#454f60'); eg.addColorStop(1, '#28303c');
    // ---- one faction, five species ------------------------------------------
    // These are 26-34px tall in play, so they are designed AT that size: the
    // silhouette carries the recognition and detail is spent only where it
    // separates one machine from another. Each still reads as the job it used to
    // do (STORY.md: a mimic keeps its work, it only stops caring what the work
    // does to you), and each owns a distinct base geometry so no two share an
    // outline: crawler = long low wedge, hopper = teardrop on springs,
    // blob = sagging dome, flier = pure circle, turret = rooted trapezoid.
    const EL = (typeof ELEM !== 'undefined' && typeof MIMIC_EL !== 'undefined' && ELEM[MIMIC_EL[this.kind]]) || { col: '#8aa2b5', glow: '#cfe3ef' };
    // Derived from the NULL-SEEKER DRILLER that rules Zone A: the minions are
    // built out of the same materials as the boss, so a room reads as one family.
    // Ceramic is the armour, steel the frame, bronze the joints — and each part
    // gets its own light axis instead of one gradient over everything.
    const plate = (path, y0, y1, k) => { c.fillStyle = ramp(c, MAT.ceramic, -8, y0, 8, y1, k); path(); c.fill(); };
    const frame = (path, y0, y1, k) => { c.fillStyle = ramp(c, MAT.steel, -8, y0, 8, y1, k); path(); c.fill(); };
    const joint = (jx, jy, jr) => {
      c.fillStyle = ramp(c, MAT.bronze, jx - jr, jy - jr, jx + jr, jy + jr);
      c.beginPath(); c.arc(jx, jy, jr, 0, 7); c.fill();
      occl(c, jx, jy + jr * 0.6, jr * 1.4, jr * 0.8, 0.4);
    };
    const seam = (x0, y0, x1, y1, a) => {   // additive panel line, never black
      c.strokeStyle = 'rgba(190,214,235,' + (a || 0.22) + ')'; c.lineWidth = 0.7;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    };
    const accent = (fn, glow) => {          // element tell: material, not eyes
      c.fillStyle = EL.col;
      if (glow) { c.shadowColor = EL.col; c.shadowBlur = 5; }
      fn(); c.shadowBlur = 0;
    };
    switch (this.kind) {
      case 'crawler': {
        // DRAKK — a yard hauler that read the word "hound". Long low wedge with
        // a cargo hopper on its back: the back attachment is what makes it
        // unmistakable in silhouette, from the front and the side alike.
        const ph = this.anim * 12;
        const leg = (hx, phase, len, thick) => {
          const step = Math.sin(phase) * 3.2, lift = Math.max(0, -Math.cos(phase)) * 2.2;
          c.strokeStyle = MAT.steel.dark; c.lineWidth = thick; c.lineCap = 'round';
          c.beginPath(); c.moveTo(hx, 1);
          c.lineTo(hx + step * 0.5, 5 - lift);
          c.lineTo(hx + step, 9 - lift * 0.4);          // visible knee, not a peg
          c.stroke();
          joint(hx + step * 0.5, 5 - lift, 1.5);
          c.fillStyle = MAT.steel.deep;                  // a foot, so it stands
          c.fillRect(hx + step - 1.6, 8.4 - lift * 0.4, 3.4, 1.8);
        };
        leg(-7, ph, 9, 2.6); leg(-3.5, ph + 2.4, 9, 2.2);
        leg(4, ph + 1.1, 9, 3);  leg(8, ph + 3.6, 9, 2.4);
        // cargo hopper (back attachment)
        plate(() => {
          c.beginPath(); c.moveTo(-1, -6); c.lineTo(11, -8); c.lineTo(12, -1); c.lineTo(0, -1);
          c.closePath();
        }, -9, -1);
        accent(() => {                                   // rust bleeding from the bin
          c.globalAlpha = 0.55;
          c.fillRect(2, -2.4, 8, 1.4); c.globalAlpha = 1;
        });
        c.fillStyle = ramp(c, MAT.bronze, -2, -8, 11, -5);   // bronze rim of the open bin
        c.beginPath(); c.moveTo(-1.4, -6.2); c.lineTo(11.4, -8.4); c.lineTo(11.6, -7); c.lineTo(-1.2, -4.8);
        c.closePath(); c.fill();
        seam(1, -4.2, 10.4, -6, 0.24);
        // chassis: a long wedge, nose lower than tail
        plate(() => {
          c.beginPath(); c.moveTo(-13, -1.5); c.lineTo(-9, -4.5); c.lineTo(9, -4.5);
          c.lineTo(12.5, -0.5); c.lineTo(10, 2.5); c.lineTo(-11, 2.5); c.closePath();
        }, -5, 3);
        seam(-9, -1.2, 8, -1.2, 0.2);
        // head: a blunt tow-coupling thrust forward on a stub neck
        plate(() => {
          c.beginPath(); c.moveTo(-18, -1); c.lineTo(-13, -5); c.lineTo(-10, -5);
          c.lineTo(-10, 1.5); c.lineTo(-16, 2); c.closePath();
        }, -5, 2);
        // a bore-head scaled down from the Driller's: conical, fluted, bronze
        const bh = this.anim * 26;
        c.save(); c.translate(-16.5, 0.6); c.rotate(-0.12);
        c.fillStyle = ramp(c, MAT.bronze, -5, -3, 3, 3);
        c.beginPath(); c.moveTo(-6.5, 0); c.lineTo(2, -2.6); c.lineTo(2, 2.6); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(20,16,10,0.55)'; c.lineWidth = 0.6;
        for (let i = 0; i < 3; i++) {                    // flutes, turning
          const o = ((bh + i * 2.1) % 6) - 3;
          c.beginPath(); c.moveTo(o * 0.9 - 2, -2.2); c.lineTo(o * 0.9 - 0.6, 2.2); c.stroke();
        }
        c.restore();
        occl(c, -13, 1, 5, 3, 0.5);
        seam(-13.4, -4.2, -10.6, -4.2, 0.3);
        eyes(-16.8, -3.6, 1.9);
        break;
      }
      case 'hopper': {
        // NIKK — a leak-seeker that copied NYA-9's own frame. It is the only
        // mimic with ears, and it has them because it was imitating her.
        const ph = this.anim * 9;
        const squash = 1 + Math.sin(ph) * 0.06;
        // coiled spring legs — the species signature, visible at 1x
        c.strokeStyle = MAT.steel.mid; c.lineWidth = 1.5; c.lineCap = 'round';
        for (const sx of [-4.5, 4.5]) {
          c.beginPath();
          for (let i = 0; i <= 8; i++) {
            const yy = 4 + i * 0.9, xx = sx + (i % 2 ? 1.7 : -1.7) * (1 - i / 14);
            i ? c.lineTo(xx, yy) : c.moveTo(sx, yy);
          }
          c.stroke();
          c.fillStyle = MAT.steel.deep; c.fillRect(sx - 2.6, 11, 5.2, 1.8);
        }
        // coolant tank on the back
        plate(() => { c.beginPath(); c.ellipse(6, -2, 3.4, 4.6, 0.25, 0, 7); c.closePath(); }, -7, 3);
        accent(() => { c.beginPath(); c.ellipse(6.6, -2.6, 1.1, 2.1, 0.25, 0, 7); c.fill(); }, true);
        // teardrop body
        plate(() => {
          c.beginPath(); c.moveTo(0, -11);
          c.bezierCurveTo(7, -10, 9, -3, 8, 2);
          c.bezierCurveTo(6, 6, -6, 6, -8, 2);
          c.bezierCurveTo(-9, -3, -7, -10, 0, -11);
          c.closePath();
        }, -12 * squash, 6);
        seam(-6.5, -3, 6.5, -3, 0.22);
        // ears — the head-area element that makes it recognisable
        c.fillStyle = ramp(c, MAT.ceramic, -8, -15, 8, -8, 0.92);
        for (const [ex, tx] of [[-5.4, -7.6], [4.4, 6.8]]) {
          c.beginPath(); c.moveTo(ex, -8.6); c.quadraticCurveTo(tx, -14.5, ex + (tx - ex) * 0.55, -8);
          c.closePath(); c.fill();
        }
        // probe snout with a hanging drip
        c.fillStyle = ramp(c, MAT.bronze, -12, -1, -8, 2);
        c.beginPath(); c.moveTo(-8, -1); c.lineTo(-12.5, 0.6); c.lineTo(-8, 2.2); c.closePath(); c.fill();
        accent(() => { c.beginPath(); c.arc(-12.4, 2.4 + Math.sin(ph * 0.7) * 0.6, 0.9, 0, 7); c.fill(); }, true);
        eyes(-5.2, -6.4, 2);
        break;
      }
      case 'blob': {
        // BRUT — foundry spillage that cooled into something with legs. The only
        // asymmetric mimic: it sags, and it has three stubby legs, not four.
        const ph = this.anim * 5;
        const pulse = 0.55 + Math.sin(ph) * 0.45;
        c.strokeStyle = MAT.steel.dark; c.lineWidth = 2.4; c.lineCap = 'round';
        for (const [lx, lp] of [[-8, 0], [-1, 2.1], [7.5, 4.2]]) {
          const lift = Math.max(0, Math.sin(ph * 1.6 + lp)) * 1.4;
          c.beginPath(); c.moveTo(lx, 6); c.lineTo(lx + 0.6, 11 - lift); c.stroke();
        }
        // the mass: wide, low, and deliberately lopsided
        plate(() => {
          c.beginPath(); c.moveTo(-16, 6);
          c.bezierCurveTo(-17, -4, -9, -11, 1, -11);
          c.bezierCurveTo(10, -11, 16, -6, 15, 1);
          c.bezierCurveTo(14.4, 5, 12, 7, 8, 7);
          c.bezierCurveTo(4, 9, -12, 9, -16, 6);
          c.closePath();
        }, -12, 8);
        // molten underglow first — the heat is INSIDE, the crust sits over it
        c.save(); c.globalAlpha = 0.5 + pulse * 0.3;
        const ug = c.createRadialGradient(-1, 3, 1, -1, 3, 15);
        ug.addColorStop(0, EL.col); ug.addColorStop(1, 'rgba(255,122,52,0)');
        c.fillStyle = ug; c.beginPath(); c.ellipse(-1, 3, 14, 6, 0, 0, 7); c.fill();
        c.restore();
        // cooled crust: several DARK irregular plates, so the gaps between them
        // are what glows. Plates lighter than the body read as planks taped on.
        c.fillStyle = MAT.steel.deep;
        const crust = [
          [[-14, 3], [-11, -5], [-4, -8], [-3, -1], [-8, 4]],
          [[-1.5, -9], [5, -9.5], [7, -3.5], [0.5, -2.5]],
          [[8.5, -6], [14, -2], [13, 3], [8, 2]],
          [[-2, 0], [6, -1], [7.5, 5], [-1, 6]],
        ];
        for (const poly of crust) {
          c.beginPath(); poly.forEach((pt, i) => i ? c.lineTo(pt[0], pt[1]) : c.moveTo(pt[0], pt[1]));
          c.closePath(); c.fill();
        }
        // a few short hot flecks where the crust has not closed
        c.save(); c.globalAlpha = pulse;
        c.fillStyle = '#ffd9a0'; c.shadowColor = EL.col; c.shadowBlur = 4;
        c.fillRect(-3.4, -6, 0.9, 2.2); c.fillRect(7.4, -2.6, 0.8, 2.6);
        c.fillRect(-1.2, 5.4, 2.4, 0.8);
        c.shadowBlur = 0; c.restore();
        eyes(-3, -6, 2.2);
        break;
      }
      case 'flier': {
        // OKK — a survey lens that never landed. The lens IS the big shape, and
        // it is the only mimic with a single eye, so it never reads as the others.
        const ph = this.anim * 6, bob = Math.sin(ph) * 0.8;
        c.save(); c.translate(0, bob);
        // housing ring behind the lens
        c.strokeStyle = ramp(c, MAT.bronze, -10, -10, 10, 10); c.lineWidth = 2.4;
        c.beginPath(); c.arc(0, 0, 10.5, 0, 7); c.stroke();
        c.strokeStyle = MAT.steel.mid; c.lineWidth = 1;
        for (let i = 0; i < 3; i++) {                    // mounting struts
          const a = ph * 0.6 + i / 3 * Math.PI * 2;
          c.beginPath(); c.moveTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5);
          c.lineTo(Math.cos(a) * 10.5, Math.sin(a) * 10.5); c.stroke();
        }
        // the lens body
        plate(() => { c.beginPath(); c.arc(0, 0, 7, 0, 7); c.closePath(); }, -8, 7);
        // single red iris — infection marker, one not two
        drawSensor(c, -1.2, 0, 2.5, this.hypnoT > 0 ? 'alert' : 'locked', this.anim);
        c.fillStyle = 'rgba(255,255,255,0.4)';   // specular, so the lens reads as glass
        c.beginPath(); c.ellipse(-3.4, -2.4, 1.8, 1, -0.5, 0, 7); c.fill();
        // arc emitters underneath
        accent(() => {
          for (const ex of [-5, 5]) { c.beginPath(); c.arc(ex, 8.4, 1.3, 0, 7); c.fill(); }
        }, true);
        c.strokeStyle = MAT.bronze.mid; c.lineWidth = 1;
        c.beginPath(); c.moveTo(0, -10.5); c.lineTo(0.6, -14); c.stroke();
        c.restore();
        break;
      }
      default: {
        // VAKT — bolted down, still guarding a door that leads nowhere. Rooted
        // trapezoid: the only mimic with no legs and a horizontal base.
        const ph = this.anim * 3;
        const aim = Math.sin(ph * 0.5) * 0.22;
        // base, wider at the floor, with visible anchor bolts
        plate(() => {
          c.beginPath(); c.moveTo(-13, 15); c.lineTo(-8, 2); c.lineTo(8, 2); c.lineTo(13, 15); c.closePath();
        }, 0, 15);
        for (const bx of [-9.5, 9.5]) joint(bx, 12.4, 1.6);
        seam(-8.6, 6, 8.6, 6, 0.2);
        // shoulder collar — head-area mass, where recognition lives
        plate(() => {
          c.beginPath(); c.moveTo(-9, 2); c.lineTo(-7.5, -3); c.lineTo(7.5, -3); c.lineTo(9, 2); c.closePath();
        }, -4, 3);
        c.save(); c.rotate(aim);
        // turret head + barrel
        plate(() => {
          c.beginPath(); c.moveTo(-6.5, -3); c.lineTo(-5, -10); c.lineTo(5, -10); c.lineTo(6.5, -3); c.closePath();
        }, -11, -2);
        c.fillStyle = ramp(c, MAT.steel, -13, -9, -5, -5); c.fillRect(-13, -8.4, 8, 3.4);   // barrel
        accent(() => {                                                // arc coils
          for (let i = 0; i < 3; i++) c.fillRect(-12 + i * 2.4, -8.8, 1, 4.2);
        }, true);
        eyes(-3.4, -8, 2);
        c.restore();
        break;
      }
    }
    c.restore();
  }
}

// tumbling burning wreck — the dramatic enemy death
class Wreck {
  constructor(e, kx, ky) {
    this.x = e.x; this.y = e.y; this.w = e.w; this.h = e.h; this.kind = e.kind;
    const n = Math.hypot(kx, ky) || 1;
    this.vx = (kx / n) * rnd(240, 380) + rnd(-40, 40);
    this.vy = (ky / n) * 220 - rnd(180, 320);
    this.rot = 0; this.vr = rnd(-9, 9) || 6;
    this.t = rnd(0.7, 1); this.dead = false; this.bounced = 0;
  }
  update(dt) {
    this.t -= dt; this.rot += this.vr * dt;
    this.vy += 1900 * dt;
    const pv = this.vy;
    const col = moveEnt(this, dt);
    if (col.d && pv > 120) {
      this.vy = -pv * 0.45; this.vx *= 0.7; this.vr *= 0.8; this.bounced++;
      sfx('phit');
      burst(this.x + this.w / 2, this.y + this.h, 5, '#9fb8c8', 100, 0.3, 500, 2);
    }
    if (col.l || col.r) this.vx *= -0.5;
    if (chance(0.4)) addPart(this.x + rnd(0, this.w), this.y + rnd(0, this.h), rnd(-40, 40), rnd(-90, 0), 0.35, chance(0.5) ? '#ffd76a' : '#ff8a5c', 2.5, 500, true);
    if (this.t <= 0 || this.bounced >= 3 || onSpike(this) || this.y > G.roomDef.h * TILE + 60) this.explode();
  }
  explode() {
    if (this.dead) return;
    this.dead = true;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    sfx('boom'); cam.shake = Math.max(cam.shake, 4);
    burst(cx, cy, 22, PAL[G.roomDef.zone].glow, 300, 0.6, 400, 4, true);
    burst(cx, cy, 10, '#ffd76a', 240, 0.5, 600, 3, true);
    G.addRing(cx, cy);
    G.dropScrap(cx, cy, irnd(4, 9));
    G.maybeDropRelic(cx, cy);
  }
  draw(c) {
    c.save();
    c.translate(this.x + this.w / 2, this.y + this.h / 2);
    c.rotate(this.rot);
    c.fillStyle = '#39424f';
    rr(c, -this.w / 2, -this.h / 2 + 3, this.w, this.h - 6, 5); c.fill();
    c.fillStyle = '#20262f';
    c.fillRect(-this.w / 2 + 3, -3, this.w * 0.4, 5);
    c.fillStyle = 'rgba(255,138,92,0.9)'; c.shadowColor = '#ff8a5c'; c.shadowBlur = 8;
    c.beginPath(); c.arc(this.w * 0.15, -2, 2.5, 0, 7); c.fill();
    c.shadowBlur = 0;
    c.restore();
  }
}

// ================= BOSSES =================
const BSTAT = {
  glitch: { w: 76, h: 52, hp: 220 },
  brood: { w: 66, h: 58, hp: 320 },
  atlas: { w: 62, h: 74, hp: 460 },
  zero: { w: 44, h: 56, hp: 500 },
  prism: { w: 50, h: 34, hp: 520 },
  mother: { w: 120, h: 120, hp: 750 },
};
class Boss {
  constructor(kind, x, y) {
    const s = BSTAT[kind];
    this.kind = kind; this.w = s.w; this.h = s.h;
    this.x = x - s.w / 2; this.y = y - s.h;
    this.hpMax = Math.round(s.hp * DF().ehp); this.hp = this.hpMax;
    this.vx = 0; this.vy = 0; this.st = 'dorm'; this.t = 1.4; this.phase = 1;
    this.hurtT = 0; this.dead = false; this.anim = 0; this.face = -1;
    this.cycle = 0; this.marks = []; this.beam = null;
    this.hypnoT = 0; this.stagT = 0;
    if (kind === 'brood') { this.y = 60; this.homeY = 60; }
    if (kind === 'zero') this.y -= 90;
    if (kind === 'mother') { this.y = 110; this.x = G.roomDef.w * TILE / 2 - s.w / 2; }
    // recorded AFTER the per-kind placement, or the flyers get sent back to a
    // position they never actually occupied
    this.spawnX = this.x; this.spawnY = this.y;
  }
  cx() { return this.x + this.w / 2; }
  cy() { return this.y + this.h / 2; }
  shoot(vx, vy, r, grav, life) {
    G.projs.push(new Proj(this.cx(), this.cy(), vx, vy, false, 1, r || 7, PAL[G.roomDef.zone].glow, grav || 0, life || 4));
  }
  ring(n, speed, off) {
    for (let i = 0; i < n; i++) {
      const a = off + i / n * Math.PI * 2;
      this.shoot(Math.cos(a) * speed, Math.sin(a) * speed, 6);
    }
    sfx('shoot');
  }
  update(dt) {
    this.anim += dt; this.hurtT -= dt;
    if (this.dead) return;
    if (this.stagT > 0) { this.stagT -= dt; return; }   // Song / weakness stagger
    if (this.st === 'dorm') {
      if (!player.dead && Math.abs(player.x + player.w / 2 - this.cx()) < 380) {
        this.st = 'intro'; this.t = 1.4; sfx('roar');
        setMusic(this.kind === 'mother' ? 'mother' : 'boss');
      }
      return;
    }
    if (this.st === 'intro') { this.t -= dt; if (this.t <= 0) { this.st = 'idle'; this.t = 0.8; } return; }
    if (this.hp <= 0) { this.die(); return; }
    if (this.phase === 1 && this.hp < this.hpMax / 2) {
      this.phase = 2; this.t = 1;
      burst(this.cx(), this.cy(), 30, '#ffffff', 320, 0.7, 200, 4, true);
      cam.shake = 12; sfx('phase');
    }
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    const spd = DF().espd;
    switch (this.kind) {
      // ---- GLITCH.EXE: charging corrupted hound ----
      case 'glitch': {
        this.vy += 2100 * dt;
        if (this.st === 'idle') {
          this.vx = 0; this.t -= dt;
          this.face = Math.sign(px - this.cx()) || 1;
          if (this.t <= 0) { this.st = this.cycle++ % 3 === 2 ? 'leap' : 'charge'; this.t = 3; if (this.st === 'leap') { this.vy = -680; this.vx = this.face * 280 * spd; } }
        } else if (this.st === 'charge') {
          this.vx = this.face * (this.phase === 2 ? 560 : 420) * spd;
          if (chance(0.4)) addPart(this.cx() - this.face * 24, this.y + this.h, -this.face * 60, rnd(-60, 0), 0.3, PAL.A.glow, 3, 300, true);
          this.t -= dt;
        }
        const col = moveEnt(this, dt);
        const hitEdge = this.x <= 0 || this.x >= G.roomDef.w * TILE - this.w;
        if (this.st === 'charge' && (col.l || col.r || hitEdge || this.t <= 0)) {
          this.st = 'idle'; this.t = rnd(0.5, 0.9); cam.shake = 6; sfx('phit');
          burst(this.cx() + this.face * this.w / 2, this.y + this.h * 0.6, 14, PAL[G.roomDef.zone].glow, 240, 0.5, 200, 3, true);
        }
        if (this.st === 'leap' && col.d) {
          this.st = 'idle'; this.t = rnd(0.5, 0.8); cam.shake = 7;
          if (this.phase === 2) { this.shoot(-220, -320, 6, 900); this.shoot(220, -320, 6, 900); sfx('shoot'); }
        }
        break;
      }
      // ---- Broodmother: hangs above, spawns and slams ----
      case 'brood': {
        if (this.st === 'idle') {
          this.y = this.homeY + Math.sin(this.anim * 1.6) * 12;
          this.x += Math.sin(this.anim * 0.9) * 30 * dt;
          this.t -= dt;
          if (this.t <= 0) {
            this.t = this.phase === 2 ? 1.8 : 2.6;
            const which = this.cycle++ % (this.phase === 2 ? 3 : 4);
            if (which === 0 && G.enemies.filter(e => !e.dead && e.kind === 'flier').length < 3) {
              const f = new Enemy('flier', this.cx() - 13, this.y + this.h);
              G.enemies.push(f); sfx('shoot');
              burst(this.cx(), this.y + this.h, 10, PAL.B.glow, 180, 0.4, 300, 3, true);
            } else if (which === 3) { this.st = 'slamwarn'; this.t = 0.6; this.tx = px; }
            else {
              for (let i = -1; i <= 1; i++) this.shoot(i * 110, 240, 7, 200);
              sfx('shoot');
            }
          }
        } else if (this.st === 'slamwarn') {
          this.t -= dt; this.x = lerp(this.x, this.tx - this.w / 2, 0.1);
          if (this.t <= 0) { this.st = 'slam'; this.vy = 700; }
        } else if (this.st === 'slam') {
          this.y += this.vy * dt;
          if (this.y + this.h >= 15 * TILE) {
            this.y = 15 * TILE - this.h; this.st = 'rise'; this.t = 0.9;
            cam.shake = 10; sfx('boom');
            this.shoot(-260, -140, 6); this.shoot(260, -140, 6);
          }
        } else if (this.st === 'rise') {
          this.t -= dt; this.y = lerp(this.y, this.homeY, 0.06);
          if (this.t <= 0) this.st = 'idle';
        }
        break;
      }
      // ---- ATLAS-7: slow walker, slams and lobs ----
      case 'atlas': {
        this.vy += 2100 * dt;
        this.face = Math.sign(px - this.cx()) || 1;
        if (this.st === 'idle') {
          this.vx = this.face * 62 * spd;
          this.t -= dt;
          if (Math.abs(px - this.cx()) < 100 && this.t < 2) { this.st = 'slamwarn'; this.t = 0.55; this.vx = 0; }
          else if (this.t <= 0) {
            this.t = this.phase === 2 ? 2.2 : 3.2;
            const d = px - this.cx();
            this.shoot(clamp(d * 1.1, -300, 300), -460, 8, 900); sfx('shoot');
          }
        } else if (this.st === 'slamwarn') {
          this.vx = 0; this.t -= dt;
          if (this.t <= 0) {
            this.st = 'idle'; this.t = 3;
            cam.shake = 11; sfx('boom');
            const gy = this.y + this.h - 8;
            G.projs.push(new Proj(this.cx() - 40, gy, -340, 0, false, 1, 8, PAL.C.glow, 0, 1.6));
            G.projs.push(new Proj(this.cx() + 40, gy, 340, 0, false, 1, 8, PAL.C.glow, 0, 1.6));
          }
        }
        if (this.phase === 2) {
          this.embT = (this.embT || 0) - dt;
          if (this.embT <= 0) { this.embT = 1.1; G.projs.push(new Proj(px + rnd(-130, 130), 40, 0, 300, false, 1, 6, '#ff9430', 100, 3)); }
        }
        moveEnt(this, dt);
        break;
      }
      // ---- Archivist Zero: teleporting caster ----
      case 'zero': {
        this.y += Math.sin(this.anim * 2) * 14 * dt;
        if (this.st === 'idle') {
          this.t -= dt;
          if (this.t <= 0) { this.st = 'blink'; this.t = 0.45; this.tx = clamp(px + rnd(-160, 160), 60, G.roomDef.w * TILE - 100); this.ty = clamp(py - rnd(70, 150), 60, 380); }
        } else if (this.st === 'blink') {
          this.t -= dt;
          if (this.t <= 0) {
            burst(this.cx(), this.cy(), 14, PAL.D.glow, 220, 0.4, 0, 3, true);
            this.x = this.tx - this.w / 2; this.y = this.ty - this.h / 2;
            burst(this.cx(), this.cy(), 14, PAL.D.glow, 220, 0.4, 0, 3, true);
            const alt = this.cycle++ % 2 === 0;
            if (alt) this.ring(this.phase === 2 ? 10 : 8, 240 * spd, this.anim);
            else {
              this.marks = [];
              for (let k = -1; k <= (this.phase === 2 ? 2 : 1); k++) this.marks.push({ x: px + k * 80, t: 0.7 });
            }
            this.st = 'idle'; this.t = this.phase === 2 ? 1.7 : 2.4;
          }
        }
        for (let i = this.marks.length - 1; i >= 0; i--) {
          const m = this.marks[i]; m.t -= dt;
          if (m.t <= 0) {
            G.projs.push(new Proj(m.x, 15 * TILE - 6, 0, -520, false, 1, 8, '#eefcff', 0, 0.9));
            sfx('shoot'); this.marks.splice(i, 1);
          }
        }
        break;
      }
      // ---- Prism Prowler: rival robo-cat ----
      case 'prism': {
        this.vy += 2100 * dt;
        if (this.st === 'idle') {
          this.vx = 0; this.t -= dt;
          this.face = Math.sign(px - this.cx()) || 1;
          if (this.t <= 0) {
            const pick = this.cycle++ % 3;
            if (pick === 0) { this.st = 'dashslash'; this.t = 0.42; this.vx = this.face * 720 * spd; }
            else if (pick === 1) { this.st = 'pounce'; this.vy = -600; this.vx = this.face * 380 * spd; }
            else {
              this.vy = -480;
              for (let k = -1; k <= 1; k++) {
                const a = Math.atan2(py - this.cy(), px - this.cx()) + k * 0.3;
                this.shoot(Math.cos(a) * 300, Math.sin(a) * 300, 6);
              }
              this.st = 'rest'; this.t = this.phase === 2 ? 0.6 : 0.95;
            }
          }
        } else if (this.st === 'dashslash') {
          this.t -= dt;
          this.trailT = (this.trailT || 0) - dt;
          if (this.trailT <= 0) { this.trailT = 0.03; addPart(this.cx(), this.cy(), 0, 0, 0.3, PAL.X.glow, 5, 0, true); }
          if (this.t <= 0) { this.st = 'rest'; this.t = this.phase === 2 ? 0.5 : 0.85; this.vx = 0; }
        } else if (this.st === 'pounce') {
          if (this.vy > 0 && this.y + this.h > 14 * TILE) { this.st = 'rest'; this.t = 0.7; this.vx = 0; cam.shake = 6; }
        } else if (this.st === 'rest') {
          this.vx = 0; this.t -= dt;
          if (this.t <= 0) { this.st = 'idle'; this.t = rnd(0.3, 0.7); }
        }
        const col = moveEnt(this, dt);
        if (this.st === 'dashslash' && (col.l || col.r)) { this.st = 'rest'; this.t = 0.8; }
        break;
      }
      // ---- MOTHER-V: the Null Core ----
      case 'mother': {
        this.y = 110 + Math.sin(this.anim * 1.1) * 16;
        this.t -= dt;
        if (this.beam) {
          this.beam.t -= dt;
          if (this.beam.warn && this.beam.t <= 0) { this.beam.warn = false; this.beam.t = 0.5; sfx('boom'); cam.shake = 8; }
          else if (!this.beam.warn) {
            if (!player.dead && aabb(this.beam, player)) player.hurt(DF().edmg, this.beam.x + this.beam.w / 2);
            if (this.beam.t <= 0) this.beam = null;
          }
        }
        if (this.t <= 0) {
          const p2 = this.phase === 2;
          this.t = p2 ? 1.7 : 2.4;
          const which = this.cycle++ % (p2 ? 3 : 4);
          if (which === 0) this.ring(p2 ? 14 : 10, 230 * spd, this.anim);
          else if (which === 1 && G.enemies.filter(e => !e.dead).length < 2) {
            const b = new Enemy('blob', this.cx() - 17, this.y + this.h);
            G.enemies.push(b);
            burst(this.cx(), this.y + this.h, 12, PAL.E.glow, 200, 0.5, 300, 3, true);
          } else {
            const horiz = p2 ? chance(0.5) : true;
            this.beam = horiz
              ? { x: 0, y: py - 34, w: G.roomDef.w * TILE, h: 68, t: 0.8, warn: true }
              : { x: px - 34, y: 0, w: 68, h: G.roomDef.h * TILE, t: 0.8, warn: true };
            sfx('cast');
          }
        }
        break;
      }
    }
    // arena guard: a boss can never leave the room (out-of-bounds tiles read as
    // empty, so a charge through a doorway would escape and fall into the void)
    const maxX = G.roomDef.w * TILE - this.w;
    if (this.x < 0) { this.x = 0; if (this.vx < 0) this.vx = 0; this.atEdge = 1; }
    else if (this.x > maxX) { this.x = maxX; if (this.vx > 0) this.vx = 0; this.atEdge = 1; }
    else this.atEdge = 0;
    // falling out used to park the boss on the room's bottom edge, which is often
    // inside solid tile — hence a boss stuck in the floor. Send it home instead.
    if (this.y > G.roomDef.h * TILE + 20) {
      this.x = this.spawnX; this.y = this.spawnY; this.vx = 0; this.vy = 0;
      burst(this.cx(), this.cy(), 14, '#ffffff', 200, 0.5, 0, 3, true);
    }
    if (!player.dead && aabb(this, player) && this.st !== 'intro') player.hurt(DF().edmg, this.cx());
  }
  die() {
    if (this.dead) return;
    this.dead = true;
    burst(this.cx(), this.cy(), 60, '#ffffff', 420, 1.1, 200, 5, true);
    burst(this.cx(), this.cy(), 40, PAL[G.roomDef.zone].glow, 300, 1.4, 100, 4, true);
    cam.shake = 16; sfx('boom'); sfx('win');
    G.hitStop = Math.max(G.hitStop, 0.14); G.flash = Math.max(G.flash, 0.7);
    G.addRing(this.cx(), this.cy()); G.addRing(this.cx(), this.cy(), 60);
    G.impact = { t: 0.24, t0: 0.24, x: this.cx(), y: this.cy() };
    if (this.kind !== 'mother') setMusic(G.roomDef.zone); else stopMusic();
    G.dropScrap(this.cx(), this.cy(), 30);
    G.onBossDead(this.kind);
  }
  draw(c) {
    if (this.dead) return;
    const P = PAL[G.roomDef.zone];
    const a = this.st === 'intro' ? clamp(1 - this.t / 1.4, 0, 1) : 1;
    c.save(); c.globalAlpha = a * (this.hurtT > 0 ? 0.6 : 1);
    const cx = this.cx(), cy = this.cy();
    // telegraphs
    if (this.kind === 'zero') for (const m of this.marks) {
      c.fillStyle = 'rgba(238,252,255,0.35)';
      c.fillRect(m.x - 10, 12 * TILE, 20, 3 * TILE);
    }
    if (this.kind === 'mother' && this.beam) {
      c.fillStyle = this.beam.warn ? 'rgba(255,90,220,0.22)' : 'rgba(255,120,240,0.6)';
      c.fillRect(this.beam.x, this.beam.y, this.beam.w, this.beam.h);
    }
    // bosses get a heavy contact shadow too (grounded ones)
    if (this.kind === 'glitch' || this.kind === 'atlas' || this.kind === 'prism')
      contactShadow(c, cx, this.y + this.h, this.w * 0.6, 0.45);
    // ---- hero world: real hand-animated boss beasts ----
    if (typeof isHero === 'function' && isHero()) {
      const BSPR = {
        glitch: ['beast', 6, 55, 67, 12, 1.25],   // the Bronze Boar
        atlas: ['demon', 6, 160, 144, 7, 1.7],    // Talos, the Forge-Giant
        zero: ['ghost', 7, 64, 80, 8, 1.4],       // the Judge of the Dead
      };
      const s = BSPR[this.kind];
      if (s && sheetReady(s[0])) {
        const [key, n, cw, ch, fps, mult] = s;
        c.save();
        if (this.hurtT > 0) c.globalAlpha = 0.65;
        c.translate(cx, this.y + this.h);
        c.scale(this.face || 1, 1);
        if (this.st === 'slamwarn' || this.st === 'charge') {   // menace tell
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28;
          const wg = c.createRadialGradient(0, -this.h / 2, 4, 0, -this.h / 2, this.w);
          wg.addColorStop(0, '#ff6a3c'); wg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = wg; c.beginPath(); c.arc(0, -this.h / 2, this.w, 0, 7); c.fill();
          c.restore();
        }
        drawSheet(c, key, n, cw, ch, Math.floor(this.anim * fps) % n, (this.h * 1.55 * mult) / ch, 4);
        c.restore();
        c.restore();
        return;
      }
    }
    c.translate(cx, cy);
    switch (this.kind) {
      case 'glitch': {
        // GLITCH.EXE — an armoured, virus-corrupted war-hound
        const charging = this.st === 'charge';
        const p2 = this.phase === 2;
        const tt = this.anim;
        const neon = P.glow;
        const cor = charging ? '#ff2f4f' : (p2 ? '#ff5a6d' : '#ff4f6d');
        // ---------- orbiting energy halo + corruption drones (accessory) ----------
        c.save(); c.globalCompositeOperation = 'lighter';
        const haloR = 58 + Math.sin(tt * 3) * 3;
        c.globalAlpha = charging ? 0.4 : 0.22;
        c.strokeStyle = cor; c.lineWidth = 2.4;
        c.beginPath(); c.ellipse(0, -6, haloR, haloR * 0.4, 0, 0, 7); c.stroke();
        c.globalAlpha = 0.14; c.strokeStyle = neon; c.lineWidth = 1.4;
        c.beginPath(); c.ellipse(0, -6, haloR - 6, haloR * 0.36, 0, 0, 7); c.stroke();
        c.globalAlpha = 1;
        for (let i = 0; i < 3; i++) {
          const aa = tt * 2.1 + i / 3 * Math.PI * 2;
          const ox = Math.cos(aa) * haloR, oy = Math.sin(aa) * haloR * 0.4 - 6;
          const dep = (Math.sin(aa) + 1) / 2, sz = 3 + dep * 3.5;
          c.save(); c.translate(ox, oy); c.rotate(aa * 2);
          const dg = c.createRadialGradient(0, 0, 0, 0, 0, sz * 2.4);
          dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.4, i === 1 ? neon : cor); dg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = dg; c.beginPath(); c.arc(0, 0, sz * 2.4, 0, 7); c.fill();
          c.fillStyle = '#1a2028'; c.fillRect(-sz * 0.6, -sz * 0.6, sz * 1.2, sz * 1.2);
          c.fillStyle = i === 1 ? neon : cor; c.fillRect(-sz * 0.3, -sz * 0.3, sz * 0.6, sz * 0.6);
          c.restore();
        }
        c.restore();
        // ---------- charge windup aura ----------
        if (charging) {
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 + Math.sin(tt * 30) * 0.1;
          const ag = c.createRadialGradient(0, 0, 8, 0, 0, 60);
          ag.addColorStop(0, cor); ag.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = ag; c.beginPath(); c.arc(0, 0, 60, 0, 7); c.fill();
          c.restore(); c.globalAlpha = 1;
        }
        c.scale(this.face || 1, 1);
        const gj = charging ? rnd(-1.6, 1.6) : 0;
        c.translate(gj, gj * 0.5);
        // ---------- motion smear when charging ----------
        if (charging) {
          for (let k = 1; k <= 3; k++) {
            c.globalAlpha = 0.12 * (4 - k);
            c.fillStyle = '#20303e';
            rr(c, -36 - k * 9, -14, 60, 30, 11); c.fill();
          }
          c.globalAlpha = 1;
        }
        // ---------- 4 articulated legs (behind body) ----------
        const legPhase = tt * (charging ? 22 : 13);
        const drawLeg = (hx, phase, back) => {
          const step = Math.sin(phase) * 6, lift = Math.max(0, -Math.cos(phase)) * 5;
          const fx = hx + step, fy = 26 - lift;
          const kx = (hx + fx) / 2 + 3, ky = (6 + fy) / 2;
          c.strokeStyle = back ? '#2a333f' : '#46596e'; c.lineWidth = back ? 5 : 6; c.lineJoin = 'round'; c.lineCap = 'round';
          c.beginPath(); c.moveTo(hx, 6); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
          c.fillStyle = back ? '#1c242e' : '#5a6d84'; c.fillRect(fx - 3, fy - 2, 7, 4);
          c.fillStyle = neon; c.shadowColor = neon; c.shadowBlur = 5;
          c.beginPath(); c.arc(kx, ky, 1.8, 0, 7); c.fill(); c.shadowBlur = 0;
        };
        drawLeg(-24, legPhase + Math.PI, true); drawLeg(8, legPhase, true);
        // ---------- main torso: cylindrical metal gradient ----------
        const bg = c.createLinearGradient(0, -22, 0, 28);
        bg.addColorStop(0, '#7d8ea6'); bg.addColorStop(0.35, '#46536a'); bg.addColorStop(0.7, '#2a323f'); bg.addColorStop(1, '#12171f');
        c.fillStyle = bg; rr(c, -36, -14, 62, 30, 12); c.fill();
        // belly ambient occlusion
        const ao = c.createLinearGradient(0, 4, 0, 16);
        ao.addColorStop(0, 'rgba(0,0,0,0)'); ao.addColorStop(1, 'rgba(0,0,0,0.55)');
        c.fillStyle = ao; rr(c, -36, -14, 62, 30, 12); c.fill();
        // ---------- hunched shoulder / neck ----------
        const sg = c.createLinearGradient(0, -30, 0, -2);
        sg.addColorStop(0, '#8fa0b8'); sg.addColorStop(0.5, '#4b5a70'); sg.addColorStop(1, '#232c38');
        c.fillStyle = sg; c.beginPath();
        c.moveTo(-6, -8); c.quadraticCurveTo(2, -30, 22, -24); c.quadraticCurveTo(30, -20, 28, -4);
        c.lineTo(-6, -8); c.closePath(); c.fill();
        // ---------- back armour plates w/ neon edges + rim light ----------
        const plate = (px, py, w, h, sk) => {
          c.save(); c.translate(px, py); c.rotate(sk);
          const pg = c.createLinearGradient(0, -h / 2, 0, h / 2);
          pg.addColorStop(0, '#5f7188'); pg.addColorStop(0.55, '#394456'); pg.addColorStop(1, '#1b222c');
          c.fillStyle = pg; rr(c, -w / 2, -h / 2, w, h, 3); c.fill();
          c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.4;
          c.beginPath(); c.moveTo(-w / 2 + 2, -h / 2 + 1); c.lineTo(w / 2 - 2, -h / 2 + 1); c.stroke(); // rim light
          c.strokeStyle = neon; c.shadowColor = neon; c.shadowBlur = 6; c.lineWidth = 1.2;
          c.strokeRect(-w / 2, -h / 2, w, h); c.shadowBlur = 0;
          c.restore();
        };
        plate(-22, -12, 16, 12, -0.15); plate(-6, -15, 16, 12, -0.05); plate(9, -14, 15, 12, 0.05);
        // ---------- spiky back blades (weapon shine) ----------
        const blade = (bx, by, len, lean) => {
          c.save(); c.translate(bx, by); c.rotate(lean);
          const blg = c.createLinearGradient(0, 0, 0, -len);
          blg.addColorStop(0, '#3a4656'); blg.addColorStop(0.6, '#8ea3bd'); blg.addColorStop(1, '#eaf3ff');
          c.fillStyle = blg;
          c.beginPath(); c.moveTo(-4, 0); c.lineTo(0, -len); c.lineTo(4, 0); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(-1, -2); c.lineTo(0, -len); c.stroke(); // specular edge
          c.restore();
        };
        blade(-20, -14, 16, -0.25); blade(-8, -18, 20, -0.12); blade(6, -17, 17, 0.05);
        // ---------- corruption veins (neon, flicker) ----------
        c.save(); c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.6 + Math.sin(tt * 12) * 0.25;
        c.strokeStyle = cor; c.shadowColor = cor; c.shadowBlur = 8; c.lineWidth = 1.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-30, 2); c.lineTo(-20, -4); c.lineTo(-12, 4); c.lineTo(-2, -2); c.stroke();
        c.beginPath(); c.moveTo(-16, 8); c.lineTo(-8, 2); c.lineTo(2, 8); c.stroke();
        c.restore(); c.globalAlpha = 1; c.shadowBlur = 0;
        // ---------- head ----------
        c.save(); c.translate(26, -12);
        const hg = c.createLinearGradient(0, -14, 0, 12);
        hg.addColorStop(0, '#6b7d95'); hg.addColorStop(0.5, '#3a4557'); hg.addColorStop(1, '#171d26');
        c.fillStyle = hg;
        c.beginPath(); c.moveTo(-8, -12); c.lineTo(16, -8); c.lineTo(22, 2); c.lineTo(14, 12); c.lineTo(-8, 10); c.quadraticCurveTo(-14, -1, -8, -12); c.closePath(); c.fill();
        // horns
        c.fillStyle = '#c9d4e2';
        c.beginPath(); c.moveTo(-4, -10); c.lineTo(-14, -26); c.lineTo(2, -12); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(6, -9); c.lineTo(2, -24); c.lineTo(12, -10); c.closePath(); c.fill();
        // jaw
        c.fillStyle = '#2a323d'; c.beginPath(); c.moveTo(2, 8); c.lineTo(20, 4); c.lineTo(18, 12); c.lineTo(4, 13); c.closePath(); c.fill();
        c.fillStyle = '#e8eef6';
        for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(6 + i * 3.5, 8); c.lineTo(7.5 + i * 3.5, 12); c.lineTo(9 + i * 3.5, 8); c.closePath(); c.fill(); }
        // neon visor eye w/ bloom
        const ev = charging ? 1 : 0.6 + Math.sin(tt * 6) * 0.3;
        c.save(); c.globalCompositeOperation = 'lighter';
        const eg = c.createRadialGradient(6, -2, 1, 6, -2, 16);
        eg.addColorStop(0, '#ffffff'); eg.addColorStop(0.4, cor); eg.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = ev; c.fillStyle = eg; c.beginPath(); c.arc(6, -2, 16, 0, 7); c.fill();
        c.restore(); c.globalAlpha = 1;
        c.fillStyle = charging ? '#ffffff' : cor; c.shadowColor = cor; c.shadowBlur = 12;
        c.beginPath(); c.moveTo(-2, -4); c.lineTo(14, -1); c.lineTo(12, 3); c.lineTo(-2, 1); c.closePath(); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = '#ffffff'; c.fillRect(8, -2, 3, 2);
        c.restore();
        // ---------- glitch scanline artifacts ----------
        if (chance(0.18)) {
          c.save(); c.globalCompositeOperation = 'lighter';
          c.fillStyle = chance(0.5) ? cor : neon; c.globalAlpha = 0.4;
          c.fillRect(rnd(-36, 24), rnd(-22, 14), rnd(8, 22), 2);
          c.restore(); c.globalAlpha = 1;
        }
        // front legs (over body)
        drawLeg(-14, legPhase, false); drawLeg(18, legPhase + Math.PI, false);
        break;
      }
      case 'brood': {
        c.strokeStyle = '#2b323d'; c.lineWidth = 6;
        c.beginPath(); c.moveTo(0, -this.h / 2); c.lineTo(0, -cy); c.stroke(); // hanging cable
        const puls = 1 + Math.sin(this.anim * 3) * 0.05;
        c.scale(puls, puls);
        const brg = c.createRadialGradient(-8, -12, 4, 0, 0, 36);
        brg.addColorStop(0, '#6b7789'); brg.addColorStop(0.55, '#39424f'); brg.addColorStop(1, '#1a212b');
        c.fillStyle = brg; c.beginPath(); c.ellipse(0, 0, 33, 29, 0, 0, 7); c.fill();
        c.strokeStyle = 'rgba(180,200,225,0.35)'; c.lineWidth = 1.5;
        c.beginPath(); c.ellipse(-3, -6, 26, 20, 0, Math.PI * 1.15, Math.PI * 1.9); c.stroke(); // rim light
        c.fillStyle = P.glow; c.globalAlpha = 0.85 * a;
        c.beginPath(); c.ellipse(0, 6, 24, 18, 0, 0, 7); c.fill();
        c.globalAlpha = a;
        c.fillStyle = '#0a1420';
        for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-12 + i * 12, 4, 4.5, 0, 7); c.fill(); } // brood sacs
        c.fillStyle = '#ff4f6d'; c.shadowColor = '#ff4f6d'; c.shadowBlur = 12;
        c.beginPath(); c.arc(0, -12, 6, 0, 7); c.fill(); c.shadowBlur = 0;
        c.strokeStyle = P.glow; c.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const wob = Math.sin(this.anim * 4 + i) * 8;
          c.beginPath(); c.moveTo(-24 + i * 16, 24); c.quadraticCurveTo(-24 + i * 16 + wob, 40, -24 + i * 16 - wob, 52); c.stroke();
        }
        break;
      }
      case 'atlas': {
        c.scale(this.face || 1, 1);
        const warn = this.st === 'slamwarn';
        // molten forge-iron torso with a hot vertical gradient + cracked-lava seams
        const atg = c.createLinearGradient(0, -34, 0, 18);
        atg.addColorStop(0, warn ? '#c47020' : '#7a5220'); atg.addColorStop(0.5, warn ? '#7a3c10' : '#4a2e0d');
        atg.addColorStop(1, '#221306');
        c.fillStyle = atg; rr(c, -28, -34, 56, 52, 9); c.fill();
        c.strokeStyle = warn ? 'rgba(255,180,90,0.9)' : 'rgba(255,148,48,0.5)'; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(-16, -20); c.lineTo(-6, -8); c.lineTo(-12, 6);
        c.moveTo(12, -24); c.lineTo(6, -6); c.lineTo(14, 8); c.stroke();
        c.strokeStyle = 'rgba(255,225,170,0.4)'; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(-24, -30); c.lineTo(24, -30); c.stroke(); // rim light
        const ahg = c.createLinearGradient(0, -46, 0, -28);
        ahg.addColorStop(0, '#5a3c14'); ahg.addColorStop(1, '#2c1c08');
        c.fillStyle = ahg; rr(c, -18, -46, 36, 18, 6); c.fill();          // head
        c.fillStyle = warn ? '#fff2a8' : '#ff9430'; c.shadowColor = '#ff9430'; c.shadowBlur = 12;
        c.fillRect(-10, -41, 20, 6); c.shadowBlur = 0;
        const armg = c.createLinearGradient(-40, 0, -27, 0);
        armg.addColorStop(0, '#4a3210'); armg.addColorStop(1, '#2c1c08');
        c.fillStyle = armg; rr(c, -40, -26, 13, 40, 5); c.fill();
        c.fillStyle = '#3a2810'; rr(c, 27, -26, 13, 40, 5); c.fill();     // arms
        c.fillStyle = '#241706'; c.fillRect(-22, 18, 14, 18); c.fillRect(8, 18, 14, 18); // legs
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9 * a;
        const fcg = c.createRadialGradient(0, -6, 1, 0, -6, 12 + Math.sin(this.anim * 5) * 2);
        fcg.addColorStop(0, '#fff2c0'); fcg.addColorStop(0.5, '#ff9430'); fcg.addColorStop(1, 'rgba(255,80,20,0)');
        c.fillStyle = fcg; c.beginPath(); c.arc(0, -6, 12 + Math.sin(this.anim * 5) * 2, 0, 7); c.fill(); // furnace core
        c.restore(); c.globalAlpha = a;
        break;
      }
      case 'zero': {
        const fl = Math.sin(this.anim * 2.4) * 4;
        c.translate(0, fl);
        // spectral robe with a cold vertical gradient fading to nothing at the hem
        const zrg = c.createLinearGradient(0, -28, 0, 30);
        zrg.addColorStop(0, 'rgba(120,180,220,0.6)'); zrg.addColorStop(0.6, 'rgba(58,113,156,0.5)');
        zrg.addColorStop(1, 'rgba(40,80,111,0.05)');
        c.fillStyle = zrg;
        c.beginPath(); c.moveTo(-22, -28); c.lineTo(22, -28); c.lineTo(14, 30);
        c.quadraticCurveTo(0, 34 + Math.sin(this.anim * 3) * 3, -14, 30); c.closePath(); c.fill();
        const zhg = c.createLinearGradient(0, -30, 0, -8);
        zhg.addColorStop(0, '#3d6b8f'); zhg.addColorStop(1, '#1c3a52');
        c.fillStyle = zhg; rr(c, -14, -30, 28, 22, 8); c.fill();  // hood
        c.strokeStyle = 'rgba(200,240,255,0.4)'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(-13, -26); c.quadraticCurveTo(0, -33, 13, -26); c.stroke(); // rim
        c.fillStyle = '#eefcff'; c.shadowColor = '#9fe8ff'; c.shadowBlur = 14;
        c.fillRect(-8, -22, 6, 5); c.fillRect(3, -22, 6, 5); c.shadowBlur = 0;
        c.strokeStyle = '#9fe8ff'; c.lineWidth = 2; c.globalAlpha = 0.6 * a;
        for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, 34 + i * 8 + Math.sin(this.anim * 3 + i) * 3, 0, 7); c.stroke(); }
        c.globalAlpha = a;
        break;
      }
      case 'prism': {
        c.scale(this.face || 1, 1);
        const prg = c.createLinearGradient(0, -12, 0, 10);
        prg.addColorStop(0, '#4a3a55'); prg.addColorStop(0.5, '#2e2333'); prg.addColorStop(1, '#160f1c');
        c.fillStyle = prg; rr(c, -24, -12, 46, 22, 8); c.fill();  // sleek body
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 + Math.sin(this.anim * 4) * 0.15;
        c.strokeStyle = P.glow; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-20, -9); c.lineTo(16, -9); c.stroke(); // iridescent sheen
        c.restore(); c.globalAlpha = a;
        const phg = c.createLinearGradient(0, -24, 0, -8);
        phg.addColorStop(0, '#3a2a42'); phg.addColorStop(1, '#1a1220');
        c.fillStyle = phg; rr(c, 10, -24, 18, 16, 6); c.fill();   // head
        c.beginPath(); c.moveTo(12, -22); c.lineTo(15, -32); c.lineTo(19, -23); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(21, -23); c.lineTo(25, -31); c.lineTo(27, -21); c.closePath(); c.fill();
        c.fillStyle = P.glow; c.shadowColor = P.glow; c.shadowBlur = 12;
        c.fillRect(15, -19, 4, 4); c.fillRect(21.5, -19, 4, 4); c.shadowBlur = 0;
        c.strokeStyle = P.glow; c.lineWidth = 3; c.lineCap = 'round';
        const tw2 = Math.sin(this.anim * 7) * 7;
        c.beginPath(); c.moveTo(-22, -6); c.quadraticCurveTo(-36, -14 + tw2, -34, -28 + tw2); c.stroke();
        // crystal shards on back
        c.fillStyle = 'rgba(255,122,209,0.8)';
        c.beginPath(); c.moveTo(-14, -12); c.lineTo(-10, -26); c.lineTo(-5, -12); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(-4, -12); c.lineTo(1, -22); c.lineTo(5, -12); c.closePath(); c.fill();
        break;
      }
      case 'mother': {
        const p2 = this.phase === 2;
        c.strokeStyle = 'rgba(107,37,150,0.8)'; c.lineWidth = 10;
        for (let i = 0; i < 6; i++) {
          const aa = i / 6 * Math.PI * 2 + this.anim * 0.3;
          const wob = Math.sin(this.anim * 2 + i * 2) * 20;
          c.beginPath(); c.moveTo(0, 0);
          c.quadraticCurveTo(Math.cos(aa) * 90, Math.sin(aa) * 90 + wob, Math.cos(aa) * 150, Math.sin(aa) * 150 - wob);
          c.stroke();
        }
        const puls = 1 + Math.sin(this.anim * (p2 ? 6 : 3)) * 0.06;
        c.scale(puls, puls);
        const mrg = c.createRadialGradient(-16, -18, 6, 0, 0, 62);
        mrg.addColorStop(0, '#6b7789'); mrg.addColorStop(0.5, '#39424f'); mrg.addColorStop(1, '#141922');
        c.fillStyle = mrg; c.beginPath(); c.arc(0, 0, 58, 0, 7); c.fill();
        c.strokeStyle = 'rgba(190,150,230,0.4)'; c.lineWidth = 2;
        c.beginPath(); c.arc(0, 0, 56, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); // rim light
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8 * a;
        const mcg = c.createRadialGradient(0, 0, 8, 0, 0, 46);
        mcg.addColorStop(0, p2 ? '#ff8a9c' : '#e0a0ff'); mcg.addColorStop(1, 'rgba(60,20,90,0)');
        c.fillStyle = mcg; c.beginPath(); c.arc(0, 0, 46, 0, 7); c.fill(); c.restore(); c.globalAlpha = a;
        c.fillStyle = '#0a0512'; c.beginPath(); c.arc(0, 0, 30, 0, 7); c.fill();
        // the eye
        c.fillStyle = p2 ? '#ff4f6d' : '#e05aff'; c.shadowColor = c.fillStyle; c.shadowBlur = 24;
        const look = Math.atan2(player.y - cy, player.x - cx);
        c.beginPath(); c.arc(Math.cos(look) * 10, Math.sin(look) * 10, 13, 0, 7); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = '#0a0512'; c.beginPath(); c.arc(Math.cos(look) * 12, Math.sin(look) * 12, 5, 0, 7); c.fill();
        break;
      }
    }
    c.restore();
  }
}
