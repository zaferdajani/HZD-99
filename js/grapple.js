// ---------------------------------------------------------------------------
// THE GRAPPLING CLAW — CLAWBYTE's answer to Silksong's Clawline.
//
// Fire the claw (U / Digit3, touch: the wheel's seventh seat, pad: bind "Grapple Claw"
// in Controls) and it flies
// straight out — forward, straight up, or up-and-forward while UP is held — up
// to eleven tiles. What it bites decides what happens:
//   * a wall, floor or ceiling tile: she is reeled to it, fast, and arrives with
//     a fresh air jump and her dash ready; hold or tap JUMP during the reel and
//     she vaults off the anchor instead of stopping on it
//   * an enemy or a guardian: the claw bites (a small hit), reels her in, and
//     she lands the arrival strike and bounces off it like a pogo
//   * nothing: the claw comes back, she keeps moving
// DASH during the reel cancels straight into her dash. Two uses in the air
// before she has to touch ground or a wall again. She is untouchable for the
// instant she arrives on an enemy, never during the wall reel.
//
// Numbers come from Silksong's own Clawline and were scaled to CLAWBYTE's
// world: reach ~11 tiles (TILE = 32), reel ~1150 px/s, arrival ~0.8x slash
// damage, bite ~0.35x. Everything is in GRAP so it is tuned in one place.
//
// Integration (all small, see PROMPT.md "Grappling claw" for the exact diff):
//   1. js/engine.js: KEYB.GRAPPLE (KeyU, Digit3), GP_CODES 'GP_GRAPPLE', PAD_ACTIONS + PAD_DEFAULT (-1)
//   2. js/i18n.js / js/theme.js: pa_GRAPPLE, grap_on, m_grapple, m_grappled in every language
//   3. Player.update: `if (grapUpdate(this, dt)) {} else if (this.dashT > 0) {`
//   4. Player.heroState: the reel draws her dash plate (`if (this.grap && this.grap.st === 'pull') return 'dash';`)
//   5. Player.draw: `grapDraw(c, this);` right after the death check
//   6. Player.hurt: `this.grap = null;` after the i-frame early return
//   7. js/game.js drawPadCfg: a 31 px row pitch once the list needs nine rows
//   8. js/touch.js: the weapon wheel's seventh seat (VGRAPPLE), shown once unlocked
//   9. source-files.json: "grapple" just before "entities"
// Unlock: the save's abil.grapple, or (until the world has its own pickup)
// whenever she has the dash. Uses only the game's existing helpers: inP/inD,
// solidAt/tileAt/TILE, hurtBoxOf, dealDmg, armEl, burst/addPart, sfx, cam,
// padRumble, PAL, G, hasMod/hasSkill, FLIP_DUR, Boss.
// ---------------------------------------------------------------------------
const GRAP = {
  range: 360,      // px the claw can fly (11 tiles)
  speed: 2400,     // px/s claw flight
  pull: 1150,      // px/s reel speed
  pullMax: 0.5,    // s: the longest a reel may take before it lets go
  cd: 0.38,        // s between grapples
  airUses: 2,      // grapples allowed before she touches ground or a wall
  biteK: 0.35,     // damage on the bite, x her slash damage
  hitK: 0.8,       // damage on arrival, x her slash damage
};
function grapUnlocked() {
  return !!(typeof G !== 'undefined' && G.save && G.save.abil && (G.save.abil.grapple || G.save.abil.dash));
}
function grapTxt(k, en) { const v = typeof t === 'function' ? t(k) : k; return (v == null || v === k) ? en : v; }
function grapTargets() {
  const b = G.boss;
  const bossOk = b && !b.dead && b.st !== 'intro' && b.st !== 'dorm' && !(typeof isPet === 'function' && isPet(b));
  return G.enemies.concat(bossOk ? [b] : []);
}
function grapGlow() {
  const hero = typeof isHero === 'function' && isHero();
  return hero ? '#ffd76a' : ((PAL[G.roomDef.zone] && PAL[G.roomDef.zone].glow) || '#8ff6ff');
}
// Returns true while the claw owns her motion (throw and reel); false otherwise.
function grapUpdate(p, dt) {
  p.grapCD = Math.max(0, (p.grapCD || 0) - dt);
  if (p.on || p.wallSlide) p.grapAir = 0;
  if (grapUnlocked() && G.save.flags && !G.save.flags.grapSeen) {
    G.save.flags.grapSeen = 1;
    if (G.toast) G.toast(grapTxt('grap_on', 'GRAPPLE CLAW online: press U to fire it'));
  }
  const g = p.grap;
  if (g && g.room !== G.roomId) { p.grap = null; return false; }
  if (!g) {
    // the same holds that freeze her controls everywhere else (Player.update's `held`), plus
    // the stun, the brace and a charge in progress: none of them may be escaped by a claw
    const held = !!G.bossEntry || !!G.wake || !!G.gateWalk || !!(G.meet && !G.meet.interactive);
    if (!inP('GRAPPLE') || !grapUnlocked() || held || p.healT > 0 || (p.rechargeT || 0) > 0 || (p.stunT || 0) > 0
        || (p.guardT || 0) > 0 || p.grapCD > 0) return false;
    if (!p.on && (p.grapAir || 0) >= GRAP.airUses) return false;
    let ax = (inD('RIGHT') ? 1 : 0) - (inD('LEFT') ? 1 : 0);
    const ay = inD('UP') ? -1 : 0;
    if (!ax && !ay) ax = p.face;
    if (ax) p.face = ax;
    const n = Math.hypot(ax, ay) || 1;
    let dx = ax / n, dy = ay / n;
    const ox = p.x + p.w / 2 + dx * 10, oy = p.y + p.h * 0.42;
    const lock = grapAssist(ox, oy, dx, dy);              // a foe near the line pulls the throw onto it
    if (lock) { dx = lock.dx; dy = lock.dy; }
    p.grap = { st: 'throw', t: 0, dx, dy, ox, oy, tx: ox, ty: oy, len: 0, room: G.roomId, foe: null, vault: false };
    p.dashT = 0; p.swing = null;
    if (!p.on) p.grapAir = (p.grapAir || 0) + 1;
    sfx('dash');
    return true;
  }
  g.t += dt;
  g.ox = p.x + p.w / 2 + g.dx * 10; g.oy = p.y + p.h * 0.42;   // the cable leaves from her paw
  if (g.st === 'throw') {
    // she hangs in the air for the instant the claw is out
    p.vx *= Math.pow(0.02, dt);
    p.vy = Math.min(p.vy * Math.pow(0.05, dt), 90);
    const step = GRAP.speed * dt, sub = Math.max(1, Math.ceil(step / 8));
    for (let i = 0; i < sub; i++) {
      g.len += step / sub;
      g.tx = g.ox + g.dx * g.len; g.ty = g.oy + g.dy * g.len;
      for (const e of grapTargets()) {
        if (e.dead) continue;
        const hb = hurtBoxOf(e);
        if (g.tx >= hb.x - 6 && g.tx <= hb.x + hb.w + 6 && g.ty >= hb.y - 6 && g.ty <= hb.y + hb.h + 6) {
          g.st = 'pull'; g.t = 0; g.foe = e;
          grapBite(p, e, g, GRAP.biteK, false);
          return true;
        }
      }
      const tx = Math.floor(g.tx / TILE), ty = Math.floor(g.ty / TILE);
      if (solidAt(tx, ty)) {
        g.tx -= g.dx * 4; g.ty -= g.dy * 4;              // sit the hook on the surface, not inside it
        g.st = 'pull'; g.t = 0; g.foe = null;
        sfx('hit');
        burst(g.tx, g.ty, 9, grapGlow(), 200, 0.3, 300, 2.4, true);
        cam.shake = Math.max(cam.shake, 2);
        if (typeof padRumble === 'function') padRumble(0.2, 0.35, 60);
        return true;
      }
      if (g.len >= GRAP.range) { g.st = 'back'; g.t = 0; p.grapCD = GRAP.cd * 0.6; return false; }
    }
    return true;
  }
  if (g.st === 'pull') {
    if (g.foe) {
      if (g.foe.dead) { grapEnd(p, false); return false; }
      const hb = hurtBoxOf(g.foe); g.tx = hb.x + hb.w / 2; g.ty = hb.y + hb.h / 2;
    }
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    const ddx = g.tx - cx, ddy = g.ty - cy, d = Math.hypot(ddx, ddy) || 1;
    p.vx = ddx / d * GRAP.pull; p.vy = ddy / d * GRAP.pull;
    if (inP('JUMP')) g.vault = true;
    if (inP('DASH')) { grapEnd(p, true); return false; }   // cancel straight into her dash
    const reach = g.foe ? (hurtBoxOf(g.foe).w / 2 + p.w / 2 + 6) : 22;
    if (g.lastD != null && g.lastD - d < GRAP.pull * dt * 0.25) g.stall = (g.stall || 0) + dt; else g.stall = 0;
    g.lastD = d;
    if (d <= reach || g.t > GRAP.pullMax || g.stall > 0.06) {
      if (g.foe) grapBite(p, g.foe, g, GRAP.hitK, true);
      grapEnd(p, false);
      return false;
    }
    if (chance(0.6)) addPart(cx, cy, -p.vx * 0.1, -p.vy * 0.1, 0.25, grapGlow(), 2, 0, true);
    return true;
  }
  if (g.st === 'back') {
    g.len -= GRAP.speed * 1.4 * dt;
    g.tx = g.ox + g.dx * Math.max(0, g.len); g.ty = g.oy + g.dy * Math.max(0, g.len);
    if (g.len <= 0) p.grap = null;
  }
  return false;
}
// AIM ASSIST. A claw thrown level from a step sails a hand's width over a
// crawler on the floor below, and the player reads that as the claw missing.
// Any foe within reach, inside a 40-degree cone of the aim and in plain sight
// (no solid tile on the line) takes the throw instead; the closest, best-lined
// one wins. Walls are never assisted: aiming at architecture stays exact.
const GRAP_CONE = Math.cos(40 * Math.PI / 180);   // 28 degrees missed a crawler one step down (tested)
function grapAssist(ox, oy, dx, dy) {
  let best = null, bestScore = Infinity;
  for (const e of grapTargets()) {
    if (e.dead) continue;
    const hb = hurtBoxOf(e);
    const cx = hb.x + hb.w / 2, cy = hb.y + hb.h / 2;
    const vx = cx - ox, vy = cy - oy, d = Math.hypot(vx, vy);
    if (d < 1 || d > GRAP.range) continue;
    const cos = (vx * dx + vy * dy) / d;
    if (cos < GRAP_CONE) continue;
    let clear = true;
    for (let s = 8; s < d - 8; s += 8) {
      if (solidAt(Math.floor((ox + vx / d * s) / TILE), Math.floor((oy + vy / d * s) / TILE))) { clear = false; break; }
    }
    if (!clear) continue;
    const score = d * (2 - cos);
    if (score < bestScore) { bestScore = score; best = { dx: vx / d, dy: vy / d }; }
  }
  return best;
}
function grapBite(p, e, g, k, arrive) {
  let dm = Math.max(1, Math.round(p.dmg() * k));
  dm = dealDmg(e, dm, armEl(), g.tx, g.ty, true);
  if (arrive && !(e instanceof Boss) && e.kind !== 'turret') {
    e.kbT = 0.26; e.vx += g.dx * 260; e.vy = Math.min(e.vy, 0) - 160;
  }
  p.gainVolts(arrive ? 8 : 4);
  sfx(e instanceof Boss ? 'bosshit' : 'hit');
  burst(g.tx, g.ty, arrive ? 14 : 8, '#ffffff', arrive ? 300 : 200, 0.35, 200, 3, true);
  cam.shake = Math.max(cam.shake, arrive ? 4 : 2);
  G.hitStop = Math.max(G.hitStop || 0, arrive ? 0.07 : 0.035);
  if (typeof padRumble === 'function') padRumble(arrive ? 0.45 : 0.25, arrive ? 0.7 : 0.4, arrive ? 110 : 60);
  if (arrive) { p.vx = -g.dx * 220; p.vy = -560; p.iT = Math.max(p.iT, 0.25); }   // bounce off it, like a pogo
}
function grapEnd(p, toDash) {
  const g = p.grap; if (!g) return;
  p.grapCD = GRAP.cd;
  p.airJumps = hasMod('djump') ? (hasSkill('triple') ? 2 : 1) : 0;   // a fresh air for whatever comes next
  p.dashCD = Math.min(p.dashCD, 0.05);
  if (!g.foe && !toDash) {
    if (g.vault || inD('JUMP')) {
      p.vy = -720; p.vx = clamp(p.vx, -380, 380); p.jetT = 0.25; p.flipT = FLIP_DUR;
      sfx('djump');
      burst(p.x + p.w / 2, p.y + p.h, 10, '#8ff6ff', 160, 0.35, 500, 3, true);
    } else { p.vx *= 0.35; p.vy = Math.min(p.vy * 0.35, -120); }
  }
  g.st = 'back'; g.len = Math.hypot(g.tx - g.ox, g.ty - g.oy); g.t = 0; g.foe = null;
}
// The cable and the claw head, drawn in world space behind her body.
function grapDraw(c, p) {
  const g = p.grap; if (!g) return;
  const ox = g.ox, oy = g.oy, tx = g.tx, ty = g.ty;
  const len = Math.hypot(tx - ox, ty - oy); if (len < 2) return;
  const col = grapGlow();
  const sag = g.st === 'back' ? Math.min(18, len * 0.08) : (g.st === 'throw' ? 4 : 0);
  const mx = (ox + tx) / 2, my = (oy + ty) / 2 + sag;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = col; c.globalAlpha = 0.35; c.lineWidth = 5;
  c.beginPath(); c.moveTo(ox, oy); c.quadraticCurveTo(mx, my, tx, ty); c.stroke();
  c.globalAlpha = 1; c.lineWidth = 1.6; c.strokeStyle = '#ffffff';
  c.beginPath(); c.moveTo(ox, oy); c.quadraticCurveTo(mx, my, tx, ty); c.stroke();
  c.fillStyle = col;
  const nb = Math.floor(len / 14);
  for (let i = 1; i < nb; i++) {                       // beads: the cable reads as linked segments
    const u = i / nb;
    const bx = (1 - u) * (1 - u) * ox + 2 * (1 - u) * u * mx + u * u * tx;
    const by = (1 - u) * (1 - u) * oy + 2 * (1 - u) * u * my + u * u * ty;
    c.beginPath(); c.arc(bx, by, 1.6, 0, 7); c.fill();
  }
  c.globalCompositeOperation = 'source-over';
  const ang = Math.atan2(ty - oy, tx - ox), open = g.st === 'throw' ? 0.65 : 0.28;
  c.translate(tx, ty); c.rotate(ang);
  c.fillStyle = '#dfe8f2'; c.strokeStyle = col; c.lineWidth = 1.4;
  rr(c, -7, -3.5, 9, 7, 2.5); c.fill(); c.stroke();
  for (const k of [-1, 0, 1]) {                       // three talons: open in flight, shut when they bite
    c.save(); c.rotate(k * open);
    c.beginPath(); c.moveTo(1, -1.4); c.quadraticCurveTo(9, -1.5, 12, 3); c.lineTo(9, 2.5); c.quadraticCurveTo(7, 0.6, 1, 1.4);
    c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
  c.restore();
}
