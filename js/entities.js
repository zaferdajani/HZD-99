// NOSTOS — Odysseus, foes, guardians, projectiles, pickups
const DIFFS = [
  { cores: 7, edmg: 1, ehp: 0.75, pdmg: 1.25, espd: 1, lives: 0 },
  { cores: 5, edmg: 1, ehp: 1, pdmg: 1, espd: 1, lives: 0 },
  { cores: 5, edmg: 2, ehp: 1.15, pdmg: 1, espd: 1.2, lives: 9 },
];
function DF() { return DIFFS[G.save.diff]; }
function hasCrest(id) { return G.save.equip.indexOf(id) >= 0; }
function hasMod(id) { return !!G.save.abil[id]; }
function hasSkill(id) { return G.save.skills && G.save.skills.indexOf(id) >= 0; }
function relicHas(id) { return G.save.relics && G.save.relics.indexOf(id) >= 0; }

// ---- tile queries against the live room ----
function tileAt(tx, ty) {
  const g = G.grid;
  if (ty < 0 || ty >= g.length || tx < 0 || tx >= g[0].length) return '.';
  if (G.roomId === 'D3' && !G.save.flags.bossBrood && ty >= 15 && tx >= 15 && tx <= 17) return '#';
  const c = g[ty][tx];
  if (c === 'B' && G.save.broken[G.roomId + ':' + tx + ',' + ty]) return '.';
  return c;
}
function solidAt(tx, ty) { const c = tileAt(tx, ty); return c === '#' || c === 'B'; }
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
    // attack — aim in 8 directions, 3-hit ninja combo
    if (inP('ATK') && this.atkCD <= 0) {
      this.atkCD = 0.36 * (hasCrest('over') ? 0.7 : 1);
      let ax = (inD('RIGHT') ? 1 : 0) - (inD('LEFT') ? 1 : 0);
      let ay = (inD('UP') ? -1 : 0) + (inD('DOWN') && !this.on ? 1 : 0);
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
    // EMP cast
    const empCost = hasSkill('router') ? 18 : 26;
    if (inP('CAST') && hasMod('emp') && this.castCD <= 0 && this.volts >= empCost) {
      this.volts -= empCost; this.castCD = 0.5; sfx('cast');
      G.projs.push(new Proj(this.x + this.w / 2 + this.face * 16, this.y + this.h / 2 - 4, this.face * 540, 0, true, Math.round(22 * DF().pdmg), 11, '#7df3ff'));
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
          let dm = Math.round(this.dmg() * (this.swing.combo === 2 ? (hasSkill('calc') ? 1.55 : 1.35) : 1));
          if (relicHas('lens') && chance(0.1)) {
            dm *= 2;
            burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 10, '#ffffff', 340, 0.4, 100, 4, true);
          }
          e.hp -= dm; e.hurtT = 0.15;
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
        if (c === 'B') { G.breakTile(tx, ty); if (this.swing.ay > 0) pogo = true; }
        else if (c === '^' && this.swing.ay > 0) pogo = true;
      }
      if (pogo && this.swing.ay > 0) {
        this.vy = -640;
        this.airJumps = hasMod('djump') ? (hasSkill('triple') ? 2 : 1) : 0;
        this.dashCD = Math.min(this.dashCD, 0); this.swing.t = 0; sfx('pogo');
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
    const R = s.combo === 2 ? 50 : 44;
    const half = s.combo === 2 ? 35 : 30;
    const cx = this.x + this.w / 2 + s.ax / n * R;
    const cy = this.y + this.h / 2 + s.ay / n * R;
    return { x: cx - half, y: cy - half, w: half * 2, h: half * 2 };
  }
  hurt(d, fromX) {
    if (this.dead || this.iT > 0) return;
    if (this.dashT > 0 && hasCrest('phantom')) return;
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
  draw(c) {
    if (this.dead) return;
    if (this.iT > 0 && Math.floor(this.iT * 18) % 2 === 0) return;
    const P = PAL[G.roomDef.zone];
    for (const tr of this.trail) {
      c.save(); c.globalAlpha = tr.t * 1.5;
      c.translate(tr.x + this.w / 2, tr.y + this.h / 2);
      c.scale(tr.face, 1); c.fillStyle = P.glow;
      rr(c, -11, -6, 22, 20, 7); c.fill();               // torso ghost
      c.beginPath(); c.arc(4, -13, 8, 0, 7); c.fill();   // helmed head
      c.beginPath(); c.moveTo(-2, -19); c.quadraticCurveTo(4, -30, 12, -19); c.closePath(); c.fill(); // crest
      c.restore();
    }
    c.save();
    c.translate(this.x + this.w / 2, this.y + this.h);
    c.scale(this.face, 1);
    const run = this.on && Math.abs(this.vx) > 40 && this.dashT <= 0;
    const ph = this.anim * 13;
    const bob = run ? Math.sin(ph * 2) * 1.4 : Math.sin(this.anim * 2.4) * 0.9;
    const heavy = this.landT > 0.14;
    const cr = this.landT > 0 ? (heavy ? 0.3 : 0.15) : (this.skidT > 0 ? 0.2 : (this.wallSlide !== 0 ? 0.1 : 0));
    c.rotate(this.lean + (this.skidT > 0 ? -0.14 : 0) + (this.wallSlide !== 0 ? 0.1 : 0));
    if (this.flipT > 0) c.rotate(-(1 - this.flipT / 0.5) * Math.PI * 2);
    c.scale(1, 1 - cr);
    // ninja scarf, flowing with speed
    const spdK = Math.min(1, Math.abs(this.vx) / 360);
    for (let i = 0; i < 2; i++) {
      const fl = Math.sin(this.anim * 9 + i * 1.9) * (2.5 + spdK * 5);
      const len = 14 + spdK * 16 + (this.on ? 0 : 6);
      c.strokeStyle = i ? '#a63740' : '#e0484f';
      c.lineWidth = 4 - i * 1.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(1, -24 + bob);
      c.quadraticCurveTo(-9 - len * 0.5, -27 + fl * 0.5 + i * 2 + bob, -13 - len, -22 + fl + i * 3 + bob);
      c.stroke();
    }
    // lower cloak hem drifting behind the hero
    const tw = Math.sin(this.anim * 6) * 4;
    c.strokeStyle = '#8f2f38'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-10, -12);
    c.quadraticCurveTo(-19, -6 + tw * 0.4, -17, 0 + tw * 0.6); c.stroke();
    // segmented digitigrade legs with glowing joints
    const leg = (hipX, phase, front) => {
      const hipY = -9 + bob * 0.3;
      let fx, fy, lift = 0;
      if (run) { fx = hipX + Math.sin(phase) * 7.5; lift = Math.max(0, -Math.cos(phase)) * 4.5; fy = -lift; }
      else if (!this.on) { fx = hipX + 2.5; fy = -4; }
      else { fx = hipX + 1; fy = 0; }
      const kx = (hipX + fx) / 2 - 3.5 - lift * 0.3, ky = (hipY + fy) / 2 - 1;
      c.strokeStyle = front ? '#e0a877' : '#b0805a'; c.lineWidth = 3.4; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(hipX, hipY); c.lineTo(kx, ky); c.lineTo(fx, fy - 1); c.stroke();
      c.strokeStyle = front ? '#d8b25a' : '#a8853f'; c.lineWidth = 2;      // bronze greave
      c.beginPath(); c.moveTo(kx, ky + 1); c.lineTo(fx, fy - 2); c.stroke();
      c.fillStyle = front ? '#8a5a30' : '#6b4525';                          // sandal
      c.fillRect(fx - 2.5, fy - 2, 6, 2.6);
    };
    leg(-7, ph + Math.PI, false); leg(6, ph, true);
    // volt-blade sheathed on the back (hidden mid-swing — it's in the paw)
    if (!this.swingVis) {
      c.save(); c.translate(-9, -22 + bob * 0.4); c.rotate(-0.85);
      c.fillStyle = '#6b4a2a'; c.fillRect(-2, 0, 4, 8);          // leather grip
      c.fillStyle = '#c8963c'; c.fillRect(-4.5, -1, 9, 3);       // bronze cross-guard
      const bg = c.createLinearGradient(0, -26, 0, 0);
      bg.addColorStop(0, '#fff2c8'); bg.addColorStop(1, '#d8b25a');
      c.fillStyle = bg; c.shadowColor = '#ffd76a'; c.shadowBlur = 9;
      c.beginPath(); c.moveTo(-1.8, -2); c.lineTo(-2.6, -14); c.lineTo(0, -26); c.lineTo(2.6, -14); c.lineTo(1.8, -2); c.closePath(); c.fill();
      c.shadowBlur = 0; c.restore();
    }
    // body — white chiton with a leather baldric
    const grad = c.createLinearGradient(0, -26, 0, 0);
    grad.addColorStop(0, '#f6f1e4'); grad.addColorStop(1, '#cfc4a8');
    c.fillStyle = grad;
    rr(c, -13, -24 + bob * 0.4, 26, 20, 7); c.fill();
    c.strokeStyle = '#8a7a5c'; c.lineWidth = 1; rr(c, -13, -24 + bob * 0.4, 26, 20, 7); c.stroke();
    c.strokeStyle = '#6b4a2a'; c.lineWidth = 3;                            // baldric strap
    c.beginPath(); c.moveTo(-9, -23 + bob * 0.4); c.lineTo(9, -8 + bob * 0.4); c.stroke();
    // golden brooch of Ithaca
    c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 8;
    c.beginPath(); c.arc(6, -15 + bob * 0.4, 2.6, 0, 7); c.fill(); c.shadowBlur = 0;
    // head — tanned face, dark beard, bronze Corinthian helmet, red plume
    const hy = -30 + bob;
    c.fillStyle = '#e0a877';
    rr(c, -2, hy - 8, 17, 15, 5); c.fill();                                 // face
    c.fillStyle = '#3a2a1c';
    rr(c, 3, hy + 1, 12, 6, 3); c.fill();                                   // beard
    const hg = c.createLinearGradient(0, hy - 14, 0, hy - 2);
    hg.addColorStop(0, '#e8c26a'); hg.addColorStop(1, '#b08a3a');
    c.fillStyle = hg;                                                       // helmet dome + cheek guards
    c.beginPath(); c.moveTo(-4, hy - 2); c.quadraticCurveTo(-4, hy - 13, 7, hy - 13);
    c.quadraticCurveTo(17, hy - 13, 17, hy - 3); c.lineTo(17, hy + 2); c.lineTo(14, hy + 2);
    c.lineTo(14, hy - 2); c.lineTo(11, hy - 3); c.lineTo(2, hy - 3); c.lineTo(-1, hy + 2);
    c.lineTo(-4, hy + 2); c.closePath(); c.fill();
    c.strokeStyle = '#8a6a28'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-4, hy - 2); c.quadraticCurveTo(-4, hy - 13, 7, hy - 13);
    c.quadraticCurveTo(17, hy - 13, 17, hy - 3); c.stroke();
    // eyes in the helmet's shadow
    c.fillStyle = '#241a10';
    c.fillRect(4, hy - 2.5, 3.4, 2.6); c.fillRect(10.5, hy - 2.5, 3.4, 2.6);
    // horsehair plume, streaming with speed
    const plF = Math.sin(this.anim * 8) * 2 + Math.min(6, Math.abs(this.vx) / 60);
    c.fillStyle = '#c0303a';
    c.beginPath();
    c.moveTo(-1, hy - 11);
    c.quadraticCurveTo(6, hy - 22, 15, hy - 12);
    c.quadraticCurveTo(8, hy - 17 - plF * 0.3, -6 - plF, hy - 6 + plF * 0.4);
    c.closePath(); c.fill();
    // leather belt on torso
    c.strokeStyle = 'rgba(107,74,42,0.9)'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-11, -7 + bob * 0.4); c.lineTo(11, -7 + bob * 0.4); c.stroke();
    // front arm (two-segment, tanned)
    const armSw = run ? Math.sin(ph + Math.PI) * 4 : 0;
    c.strokeStyle = '#e0a877'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(6, -20 + bob * 0.4); c.lineTo(9 + armSw * 0.4, -14 + bob * 0.4); c.lineTo(11 + armSw, -8); c.stroke();
    c.fillStyle = '#c8963c'; c.beginPath(); c.arc(6, -20 + bob * 0.4, 1.9, 0, 7); c.fill(); // shoulder clasp
    // winged sandals of Hermes — white wing-beats when leaping in air
    if (this.jetT > 0 || (!this.on && this.vy < -140 && this.dashT <= 0)) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const wb = Math.sin(this.anim * 30) * 4;
      for (const wpx of [-8, 7]) {
        c.fillStyle = 'rgba(255,252,240,0.85)';
        c.beginPath();
        c.moveTo(wpx, -3);
        c.quadraticCurveTo(wpx - 9, -9 - wb, wpx - 14, -2 - wb);
        c.quadraticCurveTo(wpx - 8, -1, wpx, 0);
        c.closePath(); c.fill();
      }
      c.restore();
    }
    c.restore();
    // volt-blade slashes — sharp tapered anime CUTS through space, not rings
    if (this.swingVis) {
      const sv = this.swingVis;
      const p = 1 - sv.t / sv.t0;
      const ease = p * p * (3 - 2 * p);
      const gcol = PAL[G.roomDef.zone].glow;
      const col = sv.combo === 2 ? '#ffd76a' : gcol;
      // a single tapered cut: sliver with sharp tips, curved like a blade trail
      const cut = (len, wid, alpha) => {
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
    // dash speed-lines
    if (this.dashT > 0) {
      c.save(); c.globalAlpha = 0.5; c.strokeStyle = '#cfeaff'; c.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        const ly = this.y + 6 + k * 12;
        c.beginPath(); c.moveTo(this.x + this.w / 2 - this.face * 20, ly);
        c.lineTo(this.x + this.w / 2 - this.face * (52 + k * 14), ly); c.stroke();
      }
      c.restore();
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
    this.grav = grav || 0; this.life = life || 3; this.dead = false;
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
          e.hp -= this.dmg; e.hurtT = 0.15; this.dead = true;
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
    if (hasCrest('magnet') && !player.dead && dist2(this.x, this.y, player.x, player.y) < 210 * 210) {
      const dx = player.x + 12 - this.x, dy = player.y + 18 - this.y, d = Math.hypot(dx, dy) || 1;
      this.vx += dx / d * 1900 * dt; this.vy += dy / d * 1900 * dt;
    } else this.vy += 900 * dt;
    const pv = this.vy;
    const col = moveEnt(this, dt);
    if (col.d) { this.vy = pv < -50 ? 0 : -pv * 0.35; this.vx *= 0.82; }
    if (col.l || col.r) this.vx = 0;
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
class Pouch {
  constructor(x, y, amount) { this.x = x; this.y = y; this.w = 18; this.h = 18; this.amount = amount; this.vy = 0; this.vx = 0; this.dead = false; this.t = 0; }
  update(dt) {
    this.t += dt; this.vy += 900 * dt; moveEnt(this, dt);
    if (!player.dead && aabb(this, player)) {
      this.dead = true; G.save.scrap += this.amount; G.save.pouch = null;
      sfx('bench'); G.toast(t('pouch_back') + '  +' + this.amount);
    }
  }
  draw(c) {
    c.shadowColor = '#ffd76a'; c.shadowBlur = 14 + Math.sin(this.t * 5) * 6;
    c.fillStyle = '#c9992e'; rr(c, this.x, this.y + 4, 18, 14, 5); c.fill();
    c.fillStyle = '#ffd76a'; c.fillRect(this.x + 6, this.y, 6, 6);
    c.shadowBlur = 0;
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
    this.hp = Math.round(k.hp * DF().ehp); this.spd = k.spd * DF().espd;
    this.vx = 0; this.vy = 0; this.dir = chance(0.5) ? 1 : -1;
    this.t = rnd(0.5, 2); this.sx = x; this.sy = y; this.hurtT = 0; this.dead = false; this.anim = rnd(0, 9);
    this.kbT = 0;
  }
  update(dt) {
    this.anim += dt; this.hurtT -= dt;
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
    c.save();
    if (this.hurtT > 0) { c.globalAlpha = 0.6; }
    c.translate(cx, cy);
    const flip = (this.kind === 'flier' ? Math.sign(this.vx) || 1 : this.dir);
    c.scale(flip, 1);
    // infected chassis base
    c.fillStyle = '#3a4250';
    switch (this.kind) {
      case 'crawler':
        rr(c, -14, -8, 28, 16, 5); c.fill();
        c.fillStyle = '#2a303c';
        const leg = Math.sin(this.anim * 16) * 3;
        c.fillRect(-11, 6, 4, 4 + leg); c.fillRect(-3, 6, 4, 4 - leg); c.fillRect(6, 6, 4, 4 + leg);
        c.fillStyle = '#ff4f6d'; c.shadowColor = '#ff4f6d'; c.shadowBlur = 8;
        c.fillRect(4, -5, 6, 4); c.shadowBlur = 0;
        // virus growths
        c.fillStyle = P.glow; c.beginPath(); c.arc(-8, -9, 3, 0, 7); c.arc(-2, -10, 2.4, 0, 7); c.fill();
        break;
      case 'flier': {
        const wing = Math.sin(this.anim * 24) * 7;
        c.fillStyle = 'rgba(160,200,255,0.35)';
        c.beginPath(); c.ellipse(-4, -8 - wing, 11, 4, -0.4, 0, 7); c.fill();
        c.beginPath(); c.ellipse(-4, -8 + wing, 11, 4, 0.4, 0, 7); c.fill();
        c.fillStyle = '#3a4250'; c.beginPath(); c.ellipse(0, 0, 12, 9, 0, 0, 7); c.fill();
        c.fillStyle = '#ff4f6d'; c.shadowColor = '#ff4f6d'; c.shadowBlur = 8;
        c.beginPath(); c.arc(6, -1, 3.4, 0, 7); c.fill(); c.shadowBlur = 0;
        c.fillStyle = P.glow; c.beginPath(); c.arc(-7, 5, 2.6, 0, 7); c.fill();
        break;
      }
      case 'turret': {
        c.fillStyle = '#2a303c'; rr(c, -14, 2, 28, 13, 3); c.fill();
        c.fillStyle = '#3a4250'; rr(c, -9, -14, 18, 18, 5); c.fill();
        const a = player.dead ? 0 : Math.atan2(player.y + 18 - cy, (player.x - cx) * flip);
        c.save(); c.rotate(clamp(a, -1, 1));
        c.fillStyle = '#556075'; c.fillRect(2, -3.5, 16, 7);
        c.restore();
        c.fillStyle = '#ff4f6d'; c.shadowColor = '#ff4f6d'; c.shadowBlur = 8;
        c.beginPath(); c.arc(0, -6, 3.4, 0, 7); c.fill(); c.shadowBlur = 0;
        c.fillStyle = P.glow; c.beginPath(); c.arc(-10, -2, 2.6, 0, 7); c.fill();
        break;
      }
      case 'hopper': {
        const crouch = this.vy === 0 ? Math.max(0, Math.sin(this.anim * 6)) * 2 : -2;
        c.fillStyle = '#3a4250'; rr(c, -12, -9 + crouch, 24, 17 - crouch, 6); c.fill();
        c.strokeStyle = '#2a303c'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(-8, 7); c.lineTo(-12, 12); c.moveTo(8, 7); c.lineTo(12, 12); c.stroke();
        c.fillStyle = '#ff4f6d'; c.shadowColor = '#ff4f6d'; c.shadowBlur = 8;
        c.fillRect(2, -5 + crouch, 7, 3.4); c.shadowBlur = 0;
        c.fillStyle = P.glow; c.beginPath(); c.arc(-6, -11 + crouch, 3, 0, 7); c.fill();
        break;
      }
      case 'blob': {
        const sq = Math.sin(this.anim * 5) * 3;
        c.fillStyle = P.glow; c.globalAlpha = 0.85;
        c.beginPath(); c.ellipse(0, 3 - sq / 2, 17, 10 + sq, 0, 0, 7); c.fill();
        c.globalAlpha = 1;
        c.fillStyle = '#2a303c';
        c.beginPath(); c.arc(-4, 0, 5, 0, 7); c.fill(); // consumed part
        c.fillStyle = '#ff4f6d'; c.shadowColor = '#ff4f6d'; c.shadowBlur = 8;
        c.beginPath(); c.arc(5, -2, 3, 0, 7); c.arc(-1, -6, 2.2, 0, 7); c.fill(); c.shadowBlur = 0;
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
  glitch: { w: 62, h: 42, hp: 220 },
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
    if (kind === 'brood') { this.y = 60; this.homeY = 60; }
    if (kind === 'zero') this.y -= 90;
    if (kind === 'mother') { this.y = 110; this.x = G.roomDef.w * TILE / 2 - s.w / 2; }
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
    if (this.st === 'dorm') {
      if (!player.dead && Math.abs(player.x + player.w / 2 - this.cx()) < 380) {
        // manga-style reveal the first time this guardian is met
        if (typeof CX_START === 'function' && COMIC_BOOK[this.kind] && !G.save.flags['cx_' + this.kind]) {
          G.save.flags['cx_' + this.kind] = 1; persist();
          CX_START(this.kind);
          return;
        }
        this.st = 'intro'; this.t = 1.4; sfx('roar');
        setMusic(this.kind === 'mother' ? 'mother' : 'boss');
      }
      return;
    }
    if (this.st === 'intro') { this.t -= dt; if (this.t <= 0) { this.st = 'idle'; this.t = 0.8; } return; }
    if (this.hp <= 0) { this.die(); return; }
    const phN = this.kind === 'mother' ? 3 : 2;
    const want = 1 + Math.min(phN - 1, Math.floor((1 - this.hp / this.hpMax) * phN));
    if (want > this.phase) {
      this.phase = want; this.t = 1;
      burst(this.cx(), this.cy(), 30, '#ffffff', 320, 0.7, 200, 4, true);
      cam.shake = 12; sfx('phase');
    }
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    const spd = DF().espd;
    switch (this.kind) {
      // ---- Charybdis: the surging maelstrom ----
      case 'glitch': {
        this.vy += 2100 * dt;
        if (this.st === 'idle') {
          this.vx = 0; this.t -= dt;
          this.face = Math.sign(px - this.cx()) || 1;
          // phase 2: the whirlpool drags the hero toward her maw
          if (this.phase === 2 && !player.dead && player.on)
            player.vx -= Math.sign(px - this.cx()) * 150 * dt * 60 * 0.016;
          if (this.t <= 0) { this.st = this.cycle++ % 3 === 2 ? 'leap' : 'charge'; this.t = 3; if (this.st === 'leap') { this.vy = -680; this.vx = this.face * 280 * spd; } }
        } else if (this.st === 'charge') {
          this.vx = this.face * (this.phase === 2 ? 560 : 420) * spd;
          if (chance(0.4)) addPart(this.cx() - this.face * 24, this.y + this.h, -this.face * 60, rnd(-60, 0), 0.3, PAL.A.glow, 3, 300, true);
          this.t -= dt;
        }
        const col = moveEnt(this, dt);
        if (this.st === 'charge' && (col.l || col.r || this.t <= 0)) { this.st = 'idle'; this.t = rnd(0.5, 0.9); cam.shake = 6; sfx('phit'); }
        if (this.st === 'leap' && col.d) {
          this.st = 'idle'; this.t = rnd(0.5, 0.8); cam.shake = 7;
          if (this.phase === 2) { this.shoot(-220, -320, 6, 900); this.shoot(220, -320, 6, 900); sfx('shoot'); }
        }
        break;
      }
      // ---- Scylla: hangs from her cave, snatches and spawns ----
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
              const nspit = this.phase === 2 ? 2 : 1;
              for (let i = -nspit; i <= nspit; i++) this.shoot(i * 110, 240, 7, 200);
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
      // ---- Polyphemus: slow giant, slams and hurls boulders ----
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
            this.shoot(clamp(d * 1.1, -300, 300), -460, 8, 900);
            if (this.phase === 2) this.shoot(clamp(d * 1.35, -360, 360), -560, 10, 900);
            sfx('shoot');
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
      // ---- Circe: blinking enchantress ----
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
            if (this.phase === 2) {
              const aa = Math.atan2(py - this.cy(), px - this.cx());
              this.shoot(Math.cos(aa - 0.18) * 210, Math.sin(aa - 0.18) * 210, 9);
              this.shoot(Math.cos(aa + 0.18) * 210, Math.sin(aa + 0.18) * 210, 9);
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
      // ---- The Siren Queen: swooping duelist of the strait ----
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
          if (this.vy > 0 && this.y + this.h > 14 * TILE) {
            this.st = 'rest'; this.t = 0.7; this.vx = 0; cam.shake = 6;
            if (this.phase === 2) this.ring(8, 200 * spd, this.anim);
          }
        } else if (this.st === 'rest') {
          this.vx = 0; this.t -= dt;
          if (this.t <= 0) { this.st = 'idle'; this.t = rnd(0.3, 0.7); }
        }
        const col = moveEnt(this, dt);
        if (this.st === 'dashslash' && (col.l || col.r)) { this.st = 'rest'; this.t = 0.8; }
        break;
      }
      // ---- Antinous: champion of the suitors (3 phases) ----
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
        if (this.beam2) {
          this.beam2.t -= dt;
          if (this.beam2.warn && this.beam2.t <= 0) { this.beam2.warn = false; this.beam2.t = 0.5; sfx('boom'); cam.shake = 8; }
          else if (!this.beam2.warn) {
            if (!player.dead && aabb(this.beam2, player)) player.hurt(DF().edmg, this.beam2.x + this.beam2.w / 2);
            if (this.beam2.t <= 0) this.beam2 = null;
          }
        }
        if (this.t <= 0) {
          const p2 = this.phase >= 2, p3 = this.phase >= 3;
          this.t = p3 ? 1.3 : p2 ? 1.7 : 2.4;
          const which = this.cycle++ % (p2 ? 3 : 4);
          if (which === 0) {
            this.ring(p3 ? 16 : p2 ? 14 : 10, 230 * spd, this.anim);
            if (p3) this.ring(10, 160 * spd, this.anim + 0.3);
          }
          else if (which === 1 && G.enemies.filter(e => !e.dead).length < (p3 ? 3 : 2)) {
            const b = new Enemy(p3 ? 'hopper' : 'blob', this.cx() - 17, this.y + this.h);
            G.enemies.push(b);
            burst(this.cx(), this.y + this.h, 12, PAL.E.glow, 200, 0.5, 300, 3, true);
          } else {
            const horiz = p2 ? chance(0.5) : true;
            this.beam = horiz
              ? { x: 0, y: py - 34, w: G.roomDef.w * TILE, h: 68, t: 0.8, warn: true }
              : { x: px - 34, y: 0, w: 68, h: G.roomDef.h * TILE, t: 0.8, warn: true };
            if (p3) this.beam2 = horiz
              ? { x: px - 34, y: 0, w: 68, h: G.roomDef.h * TILE, t: 1.1, warn: true }
              : { x: 0, y: py - 34, w: G.roomDef.w * TILE, h: 68, t: 1.1, warn: true };
            sfx('cast');
          }
        }
        break;
      }
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
      c.fillStyle = this.beam.warn ? 'rgba(255,190,90,0.22)' : 'rgba(255,210,120,0.6)';
      c.fillRect(this.beam.x, this.beam.y, this.beam.w, this.beam.h);
    }
    if (this.kind === 'mother' && this.beam2) {
      c.fillStyle = this.beam2.warn ? 'rgba(255,190,90,0.22)' : 'rgba(255,210,120,0.6)';
      c.fillRect(this.beam2.x, this.beam2.y, this.beam2.w, this.beam2.h);
    }
    c.translate(cx, cy);
    switch (this.kind) {
      case 'glitch': {   // CHARYBDIS — the living whirlpool
        c.scale(this.face || 1, 1);
        const gj = this.st === 'charge' ? rnd(-2, 2) : 0;
        c.translate(gj, gj * 0.5);
        // churning water body: layered rotating swirl arcs
        for (let ring2 = 3; ring2 >= 0; ring2--) {
          const rr2 = 10 + ring2 * 7;
          c.strokeStyle = ring2 % 2 ? '#2e7d8a' : '#4dd0c0';
          c.globalAlpha = a * (0.5 + ring2 * 0.12);
          c.lineWidth = 5 - ring2;
          c.beginPath();
          c.arc(0, 0, rr2, this.anim * (2 + ring2 * 0.7), this.anim * (2 + ring2 * 0.7) + 4.6);
          c.stroke();
        }
        c.globalAlpha = a;
        // gaping maw
        c.fillStyle = '#06222a'; c.beginPath(); c.ellipse(6, 2, 15, 11, 0, 0, 7); c.fill();
        c.fillStyle = '#eefcff';                                            // triple tooth rows
        for (let k = 0; k < 5; k++) {
          c.beginPath(); c.moveTo(-6 + k * 5, -8); c.lineTo(-4 + k * 5, -2); c.lineTo(-2 + k * 5, -8); c.closePath(); c.fill();
          c.beginPath(); c.moveTo(-5 + k * 5, 12); c.lineTo(-3 + k * 5, 6); c.lineTo(-1 + k * 5, 12); c.closePath(); c.fill();
        }
        // the hungry eye deep in the throat
        c.fillStyle = '#ff9c4a'; c.shadowColor = '#ff9c4a'; c.shadowBlur = 12;
        c.beginPath(); c.arc(10, 1, 4, 0, 7); c.fill(); c.shadowBlur = 0;
        // spray foam
        if (chance(0.5)) addPart(this.cx() + rnd(-26, 26), this.y + rnd(-6, 10), rnd(-60, 60), rnd(-160, -60), 0.4, '#d8f4f8', 2.5, 500);
        break;
      }
      case 'brood': {   // SCYLLA — six necks writhing from her cave
        c.strokeStyle = '#24343f'; c.lineWidth = 12;
        c.beginPath(); c.moveTo(0, -this.h / 2); c.lineTo(0, -cy); c.stroke(); // rock stalk to the roof
        const puls = 1 + Math.sin(this.anim * 3) * 0.05;
        c.scale(puls, puls);
        // central mass — scaled hide
        c.fillStyle = '#3a4a52'; c.beginPath(); c.ellipse(0, 0, 33, 27, 0, 0, 7); c.fill();
        c.fillStyle = '#54707d'; c.globalAlpha = 0.8 * a;
        c.beginPath(); c.ellipse(0, 5, 24, 16, 0, 0, 7); c.fill();
        c.globalAlpha = a;
        // six serpent necks ending in fanged heads
        for (let i = 0; i < 6; i++) {
          const wob = Math.sin(this.anim * 4 + i * 1.7) * 9;
          const nx = -25 + i * 10;
          const hx = nx - wob, hyy = 52 + Math.sin(this.anim * 3 + i) * 6;
          c.strokeStyle = '#46606b'; c.lineWidth = 5;
          c.beginPath(); c.moveTo(nx, 20); c.quadraticCurveTo(nx + wob, 38, hx, hyy); c.stroke();
          // head
          c.fillStyle = '#33454e';
          c.beginPath(); c.ellipse(hx, hyy + 3, 6, 4.5, wob * 0.02, 0, 7); c.fill();
          c.fillStyle = '#ff6a5a'; c.shadowColor = '#ff6a5a'; c.shadowBlur = 6;
          c.beginPath(); c.arc(hx + 2, hyy + 2, 1.6, 0, 7); c.fill(); c.shadowBlur = 0;
          c.fillStyle = '#eefcff';
          c.beginPath(); c.moveTo(hx - 3, hyy + 6); c.lineTo(hx - 1.5, hyy + 9); c.lineTo(hx, hyy + 6); c.closePath(); c.fill();
        }
        // her cold central eyes
        c.fillStyle = '#c8e8e8'; c.shadowColor = '#7deac8'; c.shadowBlur = 12;
        c.beginPath(); c.arc(-7, -10, 4, 0, 7); c.arc(7, -10, 4, 0, 7); c.fill(); c.shadowBlur = 0;
        break;
      }
      case 'atlas': {   // POLYPHEMUS — the one-eyed shepherd giant
        c.scale(this.face || 1, 1);
        const warn = this.st === 'slamwarn';
        // hulking tanned torso
        const tg = c.createLinearGradient(0, -34, 0, 18);
        tg.addColorStop(0, '#c08a58'); tg.addColorStop(1, '#8a5f3a');
        c.fillStyle = tg; rr(c, -28, -34, 56, 52, 12); c.fill();
        // ragged goat-hide loincloth
        c.fillStyle = '#5c4326';
        c.beginPath(); c.moveTo(-26, 8); c.lineTo(26, 8); c.lineTo(20, 24); c.lineTo(12, 16);
        c.lineTo(2, 26); c.lineTo(-8, 16); c.lineTo(-18, 25); c.closePath(); c.fill();
        // heavy arms; the near one drags a club
        c.fillStyle = '#a8744a';
        rr(c, -40, -26, 13, 44, 6); c.fill(); rr(c, 27, -26, 13, 44, 6); c.fill();
        c.fillStyle = '#6b4a2a';
        c.save(); c.translate(36, 16); c.rotate(0.5);
        rr(c, -4, 0, 9, 26, 4); c.fill(); c.restore();                      // olive-wood club
        // legs
        c.fillStyle = '#8a5f3a'; c.fillRect(-22, 18, 14, 18); c.fillRect(8, 18, 14, 18);
        // head with matted hair and heavy brow
        c.fillStyle = '#b07c4e'; rr(c, -16, -50, 34, 22, 8); c.fill();
        c.fillStyle = '#4a3018';
        c.beginPath(); c.moveTo(-16, -48); c.quadraticCurveTo(0, -58, 18, -48);
        c.lineTo(18, -42); c.quadraticCurveTo(0, -50, -16, -42); c.closePath(); c.fill();
        // THE eye — huge, tracking, whitens before the slam
        c.fillStyle = warn ? '#fff2a8' : '#ffe9c8'; c.shadowColor = '#ff9c4a'; c.shadowBlur = 14;
        c.beginPath(); c.arc(1, -39, 8, 0, 7); c.fill(); c.shadowBlur = 0;
        c.fillStyle = '#3a2210';
        const lk = player.dead ? 0 : clamp((player.x + 12 - cx) * (this.face || 1) * 0.01, -3, 3);
        c.beginPath(); c.arc(1 + lk, -39, 3.4, 0, 7); c.fill();
        // beard
        c.fillStyle = '#4a3018'; rr(c, -8, -32, 20, 8, 4); c.fill();
        break;
      }
      case 'zero': {   // CIRCE — enchantress of Aiaia
        const fl = Math.sin(this.anim * 2.4) * 4;
        c.translate(0, fl);
        // flowing violet gown
        const rg = c.createLinearGradient(0, -28, 0, 30);
        rg.addColorStop(0, 'rgba(120,74,160,0.9)'); rg.addColorStop(1, 'rgba(70,42,110,0.55)');
        c.fillStyle = rg;
        c.beginPath(); c.moveTo(-16, -24); c.lineTo(16, -24);
        c.quadraticCurveTo(22, 6, 16 + Math.sin(this.anim * 2) * 4, 30);
        c.lineTo(-16 - Math.sin(this.anim * 2) * 4, 30);
        c.quadraticCurveTo(-22, 6, -16, -24); c.closePath(); c.fill();
        // face and long dark hair
        c.fillStyle = '#e8b890'; c.beginPath(); c.arc(0, -30, 9, 0, 7); c.fill();
        c.fillStyle = '#2a1a30';
        c.beginPath(); c.moveTo(-9, -36); c.quadraticCurveTo(0, -44, 9, -36);
        c.quadraticCurveTo(13, -20, 10, -6); c.lineTo(6, -8); c.quadraticCurveTo(9, -24, 5, -34);
        c.lineTo(-5, -34); c.quadraticCurveTo(-9, -24, -6, -8); c.lineTo(-10, -6);
        c.quadraticCurveTo(-13, -20, -9, -36); c.closePath(); c.fill();
        // golden diadem + glowing eyes
        c.strokeStyle = '#ffd76a'; c.lineWidth = 2;
        c.beginPath(); c.arc(0, -31, 8.4, -2.6, -0.5); c.stroke();
        c.fillStyle = '#b46aff'; c.shadowColor = '#b46aff'; c.shadowBlur = 10;
        c.fillRect(-5, -31, 3.4, 2.6); c.fillRect(2, -31, 3.4, 2.6); c.shadowBlur = 0;
        // the wand, raised — its tip burns
        c.strokeStyle = '#8a6a28'; c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(12, -18); c.lineTo(26, -34); c.stroke();
        c.fillStyle = '#6aff9e'; c.shadowColor = '#6aff9e'; c.shadowBlur = 12 + Math.sin(this.anim * 6) * 5;
        c.beginPath(); c.arc(27, -35, 3.4, 0, 7); c.fill(); c.shadowBlur = 0;
        // enchantment circles
        c.strokeStyle = '#b46aff'; c.lineWidth = 2; c.globalAlpha = 0.5 * a;
        for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, 34 + i * 8 + Math.sin(this.anim * 3 + i) * 3, 0, 7); c.stroke(); }
        c.globalAlpha = a;
        break;
      }
      case 'prism': {   // THE SIREN QUEEN — the voice of the strait
        c.scale(this.face || 1, 1);
        // great wings, beating
        const wb2 = Math.sin(this.anim * 9) * 10;
        for (const wdir of [-1, 1]) {
          c.fillStyle = wdir < 0 ? 'rgba(168,228,255,0.55)' : 'rgba(200,240,255,0.7)';
          c.beginPath();
          c.moveTo(-6, -8);
          c.quadraticCurveTo(-24 * wdir - 6, -30 - wb2 * wdir, -40 * wdir - 4, -12 - wb2);
          c.quadraticCurveTo(-26 * wdir - 4, -4, -6, 0);
          c.closePath(); c.fill();
        }
        // feathered body
        c.fillStyle = '#2e4a5c'; rr(c, -20, -12, 40, 22, 10); c.fill();
        c.fillStyle = '#3c617a';
        for (let k = 0; k < 4; k++) {
          c.beginPath(); c.moveTo(-16 + k * 9, 10); c.lineTo(-12 + k * 9, 18); c.lineTo(-8 + k * 9, 10); c.closePath(); c.fill();
        }
        // pale face with golden hair, mouth open in song
        c.fillStyle = '#f0dcc8'; c.beginPath(); c.arc(12, -18, 8, 0, 7); c.fill();
        c.fillStyle = '#ffd76a';
        c.beginPath(); c.moveTo(4, -22); c.quadraticCurveTo(12, -30, 20, -22);
        c.quadraticCurveTo(22, -12, 18, -6); c.lineTo(15, -10); c.quadraticCurveTo(18, -18, 12, -24);
        c.quadraticCurveTo(6, -18, 8, -10); c.lineTo(5, -8); c.quadraticCurveTo(2, -14, 4, -22);
        c.closePath(); c.fill();
        c.fillStyle = '#7ad4ff'; c.shadowColor = '#7ad4ff'; c.shadowBlur = 10;
        c.fillRect(8.5, -20, 3, 2.6); c.fillRect(14, -20, 3, 2.6); c.shadowBlur = 0;
        c.fillStyle = '#3a2a30'; c.beginPath(); c.ellipse(12, -13.5, 2, 3, 0, 0, 7); c.fill(); // the song
        // song-notes rising while she sings
        if (chance(0.2)) addPart(this.cx() + rnd(-6, 18) * (this.face || 1), this.y - 20, rnd(-15, 15), rnd(-60, -30), 0.8, '#ffd76a', 2.4, -40, true);
        // talons
        c.strokeStyle = '#c8a25a'; c.lineWidth = 2.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-6, 10); c.lineTo(-8, 18); c.moveTo(2, 10); c.lineTo(2, 18); c.stroke();
        break;
      }
      case 'mother': {   // ANTINOUS — armored champion, borne up by arrogance
        const p2 = this.phase >= 2, p3 = this.phase >= 3;
        // six wine-red banners of the occupied hall stream around him
        c.strokeStyle = p3 ? 'rgba(224,90,74,0.85)' : 'rgba(140,44,36,0.8)'; c.lineWidth = 9;
        for (let i = 0; i < 6; i++) {
          const aa = i / 6 * Math.PI * 2 + this.anim * 0.3;
          const wob = Math.sin(this.anim * 2 + i * 2) * 20;
          c.beginPath(); c.moveTo(0, 0);
          c.quadraticCurveTo(Math.cos(aa) * 90, Math.sin(aa) * 90 + wob, Math.cos(aa) * 150, Math.sin(aa) * 150 - wob);
          c.stroke();
        }
        const puls = 1 + Math.sin(this.anim * (p2 ? 6 : 3)) * 0.04;
        c.scale(puls, puls);
        const look = Math.atan2(player.y - cy, player.x - cx);
        // the great round shield (aspis) with a meander rim — his guard
        c.fillStyle = '#8a5530'; c.beginPath(); c.arc(0, 6, 52, 0, 7); c.fill();
        c.fillStyle = '#c8963c'; c.beginPath(); c.arc(0, 6, 44, 0, 7); c.fill();
        c.strokeStyle = '#6b4520'; c.lineWidth = 3;
        c.beginPath(); c.arc(0, 6, 48, 0, 7); c.stroke();
        c.fillStyle = '#8a5530'; c.beginPath(); c.arc(0, 6, 14, 0, 7); c.fill(); // shield boss
        // torso + crested helm rising over the shield rim
        c.fillStyle = '#b0805a'; rr(c, -14, -52, 28, 26, 8); c.fill();          // shoulders
        const hg2 = c.createLinearGradient(0, -74, 0, -46);
        hg2.addColorStop(0, '#e8c26a'); hg2.addColorStop(1, '#a8853f');
        c.fillStyle = hg2;
        c.beginPath(); c.moveTo(-12, -46); c.quadraticCurveTo(-12, -70, 0, -70);
        c.quadraticCurveTo(12, -70, 12, -46); c.closePath(); c.fill();          // helm
        c.fillStyle = p3 ? '#ff5a4a' : '#c0303a';
        c.beginPath(); c.moveTo(-14, -66); c.quadraticCurveTo(0, -84 - Math.sin(this.anim * 4) * 4, 16, -64);
        c.quadraticCurveTo(4, -72, -14, -60); c.closePath(); c.fill();          // tall crest
        // eye-slit glare tracks the hero
        c.fillStyle = p2 ? '#ff5a4a' : '#ffd76a'; c.shadowColor = c.fillStyle; c.shadowBlur = 16;
        c.fillRect(-7 + clamp(Math.cos(look) * 3, -3, 3), -58, 14, 3.4);
        c.shadowBlur = 0;
        // his long spear, levelled at the hero
        c.save(); c.rotate(look);
        c.strokeStyle = '#6b4a2a'; c.lineWidth = 4;
        c.beginPath(); c.moveTo(20, 0); c.lineTo(86, 0); c.stroke();
        c.fillStyle = '#e8e2d0';
        c.beginPath(); c.moveTo(86, -5); c.lineTo(102, 0); c.lineTo(86, 5); c.closePath(); c.fill();
        c.restore();
        break;
      }
    }
    c.restore();
  }
}
