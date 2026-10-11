// THE PARRY (handoff Part 2 A4). A brace raised in the instant the blow
// arrives does not cut it: it TURNS it. The blow is negated, steel rings, the
// game holds still for a beat, and for a moment after she may answer with a
// counter strike that the attacker cannot interrupt (Silksong's Cross Stitch:
// fixed damage, invulnerable throughout).
//
// ONE COLOUR, ONE MEANING. Only an attack that is drawn with the parry glint
// can be parried — everywhere, no exceptions — and nothing else in the game
// draws that colour. Amber still says "this will hit you"; the glint says
// "...and this one can be turned". It is lime because every other free hue is
// taken by a meaning or a kingdom: pink is Kingdom X's own glow, violet is the
// purifier and Kingdom E, red is area denial (docs/combat/GLOBAL_REGISTRY.md
// §2). A glint the colour of the room it is in is not a signal.
//
// What keeps it from replacing the dodge: the window is 0.14 s from the
// PRESS, a brace dropped and re-raised inside PARRY_LOCK gets no fresh window
// (mashing GUARD does nothing), and a mistimed press is just the brace —
// which heats and breaks exactly as before (Player.hurt).
const PARRY_COL = '#c6ff1a';
const PARRY_WIN = 0.14;       // s from the press: a brace this fresh meets the blow
const PARRY_LOCK = 0.3;       // a brace dropped this recently re-raises with no window
const PARRY_LEAD = 0.15;      // a parryable wind-up opens its window this long before it fires
const PARRY_FREEZE = 0.14;    // the clash's hit-stop
const PARRY_STAGGER = 0.9;    // what a turned blow costs a common machine
const COUNTER_WIN = 0.6;      // s after the clash in which ATTACK answers
const COUNTER_DMG = 36;       // FIXED, three plain slashes: upgrades do not scale it
const COUNTER_T = 0.3;        // the counter's own length, invulnerable throughout
const COUNTER_REACH = 96;     // px from her centre to the foe's hurt box

// Player.update, right after guardT is decided for the frame.
function parryGuardStep(p, dt, wasGuard) {
  p.parryLockT = Math.max(0, (p.parryLockT || 0) - dt);
  parryFxStep(dt);
  if (p.guardT > 0 && !wasGuard) { p.guardAge = 0; p.guardFresh = p.parryLockT <= 0; }
  else if (p.guardT > 0) p.guardAge = (p.guardAge || 0) + dt;
  else if (wasGuard) p.parryLockT = PARRY_LOCK;
  if (p.counterT > 0) { p.counterT = Math.max(0, p.counterT - dt); if (p.counterT <= 0) p.counterFoe = null; }
  const k = p.counterAct;
  if (k) {
    k.t -= dt;
    p.iT = Math.max(p.iT, 0.05);
    const foe = k.foe;
    if (!k.hit && foe && !foe.dead) {
      const hb = hurtBoxOf(foe), pcx = p.x + p.w / 2;
      const gap = pcx < hb.x ? hb.x - pcx : pcx > hb.x + hb.w ? pcx - hb.x - hb.w : 0;
      if (gap <= COUNTER_REACH && Math.abs((p.y + p.h / 2) - (hb.y + hb.h / 2)) < hb.h / 2 + 60) parryCounterHit(p, k);
      else p.vx = k.dir * 520;
    }
    if (k.hit) p.vx *= Math.pow(0.01, dt);
    if (k.t <= 0) p.counterAct = null;
  }
}

function parryOpen(p) { return p.guardT > 0 && !!p.guardFresh && (p.guardAge || 0) <= PARRY_WIN; }

// Player.hurt, before anything else is spent: true if the blow was turned.
function parryTry(p, foe, fromX) {
  if (!foe || !foe.parryable || foe.dead || !parryOpen(p)) return false;
  const pcx = p.x + p.w / 2, faceDir = p.faceVis || p.face || 1;
  if ((Math.sign(fromX - pcx) || faceDir) !== faceDir) return false;   // the plate is on one side
  parryClash(p, foe, 'guard');
  return true;
}

function parryPoint(foe) {
  if (foe && typeof foe.parryAt === 'function') return foe.parryAt();
  const dir = (foe && (foe.dir || foe.face)) || 1;
  return [foe.x + foe.w / 2 + dir * foe.w * 0.55, foe.y + foe.h * 0.45];
}

// The clash itself, shared by every way a blow can be turned (the brace here,
// GRAVEHORN's strike on his horn in js/gravehorn.js).
function parryClash(p, foe, how) {
  const pcx = p.x + p.w / 2, pcy = p.y + p.h * 0.42;
  const fp = parryPoint(foe), sx = (fp[0] + pcx) / 2, sy = (fp[1] + pcy) / 2;
  G.hitStop = Math.max(G.hitStop || 0, PARRY_FREEZE);
  cam.shake = Math.max(cam.shake, 6);
  sfx('block'); sfx('crack');
  if (typeof padRumble === 'function') padRumble(0.6, 0.6, 160);
  burst(sx, sy, 18, PARRY_COL, 360, 0.4, 160, 3, true);
  burst(sx, sy, 10, '#ffffff', 280, 0.3, 120, 2.4, true);
  if (typeof G.addRing === 'function') G.addRing(sx, sy);
  G.parryFx = { t: 0.32, t0: 0.32, x: sx, y: sy };
  p.iT = Math.max(p.iT, 0.4);
  p.guardHeat = 0;                       // a turned blow is not a held one
  p.hurtPoseT = 0; p.healT = 0;
  p.counterT = COUNTER_WIN; p.counterFoe = foe;
  p.parries = (p.parries || 0) + 1;
  G.parryLog = G.parryLog || [];
  G.parryLog.push({ how, kind: foe.kind || '?', t: G.time || 0 });
  foe.parryable = false;
  if (typeof foe.onParried === 'function') foe.onParried(p, how);
  else {
    // a common machine is thrown off its line and winded: for a guard this
    // also drops the plate (its `guard` is only up while windedT is spent)
    const away = Math.sign((foe.x + foe.w / 2) - pcx) || 1;
    foe.windedT = Math.max(foe.windedT || 0, PARRY_STAGGER);
    foe.lungeT = 0; foe.coilT = 0; foe.kbT = 0.2; foe.vx = away * 220;
  }
  if (G.save && G.save.flags && !G.save.flags.parryTold) { G.save.flags.parryTold = 1; if (G.toast) G.toast(t('parry_told')); }
}

// The ATTACK press while the counter is open. Returns true if it took the press
// (Player.update then does not also start a swing with it).
function parryCounter(p) {
  if (!(p.counterT > 0) || p.counterAct) return false;
  const foe = p.counterFoe;
  p.counterT = 0; p.counterFoe = null;
  if (!foe || foe.dead) return false;
  const dir = Math.sign((foe.x + foe.w / 2) - (p.x + p.w / 2)) || p.face || 1;
  p.face = dir;
  p.counterAct = { t: COUNTER_T, t0: COUNTER_T, foe, dir, hit: false };
  p.iT = Math.max(p.iT, COUNTER_T + 0.08);
  p.atkCD = Math.max(p.atkCD || 0, COUNTER_T);
  p.dashT = 0; p.swing = null;
  sfx('dash');
  return true;
}

function parryCounterHit(p, k) {
  const foe = k.foe, hb = hurtBoxOf(foe);
  k.hit = true;
  const x = hb.x + hb.w / 2, y = hb.y + hb.h / 2;
  const dm = dealDmg(foe, COUNTER_DMG, null, x, y, true);
  k.dealt = dm; G.lastCounter = { dealt: dm, kind: foe.kind };
  const big = typeof Boss !== 'undefined' && foe instanceof Boss;
  sfx(big ? 'bosshit' : 'hit'); sfx('crack');
  G.hitStop = Math.max(G.hitStop || 0, 0.09);
  cam.shake = Math.max(cam.shake, 6);
  burst(x, y, 20, PARRY_COL, 340, 0.4, 200, 3, true);
  burst(x, y, 12, '#ffffff', 260, 0.3, 120, 2.6, true);
  if (typeof p.gainVolts === 'function') p.gainVolts(11);
  if (!big && foe.kind !== 'turret') { foe.kbT = 0.3; foe.vx += k.dir * 360; foe.vy = Math.min(foe.vy || 0, 0) - 160; }
  if (foe.hp <= 0 && typeof foe.die === 'function') foe.die(k.dir, -0.4);
}

// game.js, after the enemies and the guardian are drawn: the glint on every
// attack that may be parried right now. One code path for all of them, so the
// rule "drawn in the colour = parryable" cannot drift per enemy.
function drawParryTells(c) {
  const list = G.boss ? G.enemies.concat([G.boss]) : G.enemies;
  const now = (G.time || 0);
  for (const e of list) {
    if (!e || e.dead || !e.parryable) continue;
    const pt = parryPoint(e), pulse = 0.75 + 0.25 * Math.sin(now * 40);
    const r = 11 * pulse;
    c.save();
    c.translate(pt[0], pt[1]);
    c.shadowColor = PARRY_COL; c.shadowBlur = 14;
    c.fillStyle = PARRY_COL;
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + now * 3, rr = i % 2 ? r * 0.28 : r;
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath(); c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = PARRY_COL; c.lineWidth = 1.6; c.globalAlpha = 0.7;
    c.beginPath(); c.arc(0, 0, r * 1.7, 0, Math.PI * 2); c.stroke();
    c.restore();
  }
}

// game.js, after she is drawn: the counter's cross-cut, and the clash flare.
function drawParryFx(c, p) {
  const f = G.parryFx;
  if (f && f.t > 0) {
    const k = f.t / f.t0;
    c.save(); c.globalAlpha = k; c.strokeStyle = PARRY_COL; c.lineWidth = 3 * k + 1;
    c.beginPath(); c.arc(f.x, f.y, 10 + (1 - k) * 34, 0, Math.PI * 2); c.stroke(); c.restore();
  }
  const a = p && p.counterAct;
  if (a) {
    const k = clamp(1 - a.t / a.t0, 0, 1), cx = p.x + p.w / 2 + a.dir * 22, cy = p.y + p.h * 0.45;
    c.save(); c.lineCap = 'round';
    for (let s = -1; s <= 1; s += 2) {
      const a0 = s * 0.8 - 0.6 + Math.PI * (a.dir < 0 ? 1 : 0), sweep = 1.6 * Math.min(1, k * 2.2);
      c.strokeStyle = '#10140a'; c.lineWidth = 6; c.globalAlpha = 0.8 * (1 - k * 0.6);
      c.beginPath(); c.arc(cx, cy, 26, a0, a0 + sweep * (a.dir || 1)); c.stroke();
      c.strokeStyle = PARRY_COL; c.lineWidth = 3;
      c.beginPath(); c.arc(cx, cy, 26, a0, a0 + sweep * (a.dir || 1)); c.stroke();
    }
    c.restore();
  } else if (p && p.counterT > 0) {
    // the answer is open: a spark at her paw says so
    const px = p.x + p.w / 2 + (p.face || 1) * 12, py = p.y + p.h * 0.42;
    c.save(); c.fillStyle = PARRY_COL; c.shadowColor = PARRY_COL; c.shadowBlur = 10;
    c.globalAlpha = 0.6 + 0.4 * Math.sin((G.time || 0) * 30);
    c.beginPath(); c.arc(px, py, 3.2, 0, Math.PI * 2); c.fill(); c.restore();
  }
}
function parryFxStep(dt) { if (G.parryFx && (G.parryFx.t -= dt) <= 0) G.parryFx = null; }

TEXT_LAYERS.push({
  robo: true,
  en: { parry_told: 'PARRY! A lime glint can be turned: raise the guard as it lands, then strike back.' },
  ar: { parry_told: 'صدّ! الوميض الأخضر الليموني يمكن ردّه: ارفعي الحماية لحظة وصوله، ثم اضربي.' },
  tr: { parry_told: 'SAVUŞTURMA! Limon yeşili parıltı geri çevrilebilir: tam vururken siperi kaldır, sonra karşılık ver.' },
  zh: { parry_told: '弹反！青柠色闪光的攻击可以弹开：在它命中的一瞬举起格挡，然后反击。' },
  ru: { parry_told: 'ПАРИРОВАНИЕ! Лаймовую вспышку можно отбить: поднимите блок в момент удара — и бейте в ответ.' },
});
// NOSTOS shares the engine and the parry; its hero is addressed as he is
TEXT_LAYERS.push({
  en: { parry_told: 'PARRY! A lime glint can be turned: raise the guard as it lands, then strike back.' },
  ar: { parry_told: 'صدّ! الوميض الأخضر الليموني يمكن ردّه: ارفع الحماية لحظة وصوله، ثم اضرب.' },
  tr: { parry_told: 'SAVUŞTURMA! Limon yeşili parıltı geri çevrilebilir: tam vururken siperi kaldır, sonra karşılık ver.' },
  zh: { parry_told: '弹反！青柠色闪光的攻击可以弹开：在它命中的一瞬举起格挡，然后反击。' },
  ru: { parry_told: 'ПАРИРОВАНИЕ! Лаймовую вспышку можно отбить: поднимите блок в момент удара — и бейте в ответ.' },
});
