// CLAWBYTE — elements, boss suits and the Song.
// The full design rationale lives in BESTIARY.md; this file is only the rules.
//
// Mega Man X's loop: every boss drops a suit, every suit carries one arm, and
// every arm devastates exactly one other boss. Nothing is locked behind a suit —
// you may fight any boss at any time. The right suit just turns a wall into a door.

const ELEM = {
  skarn: { col: '#c87a3c', glow: '#ffb069' },
  vann:  { col: '#3fb8e0', glow: '#8ce4ff' },
  hott:  { col: '#ff7a34', glow: '#ffc077' },
  glazz: { col: '#a8e4f4', glow: '#e6fbff' },
  zizt:  { col: '#b48cff', glow: '#dcc6ff' },
  vizrr: { col: '#ff4d4d', glow: '#ff9a9a' },   // only the infected glow red
  murr:  { col: '#37ffd0', glow: '#c6fff0' },   // the Song — no enemy carries it
};

// attacker -> the one element it devastates. A closed ring of five, plus the
// canon entry: cold is the one thing the broadcast cannot cross (STORY.md).
const BEATS = { zizt: 'vann', vann: 'hott', hott: 'glazz', glazz: 'skarn', skarn: 'zizt' };
const EXTRA_BEATS = { glazz: ['skarn', 'vizrr'] };

const BOSS_EL = { glitch: 'skarn', brood: 'vann', atlas: 'hott', zero: 'glazz', prism: 'zizt', mother: 'vizrr' };
// the five mimic frames, typed by the job each was built to do
const MIMIC_EL = {
  crawler: 'skarn',   // a hauler that read the word "hound" and did its best
  hopper:  'vann',    // a leak-seeker; it copied HZD-99's own frame
  blob:    'hott',    // foundry spillage that cooled into legs
  flier:   'zizt',    // a survey lens that hovers and discharges
  turret:  'zizt',    // a fixed emplacement running on the same arc supply
  surge:   'zizt',    // a line breaker venting the same arc supply down its rail
};

// suits, in the order they are offered on the wheel
const ARMS = [
  { id: 'shard',   el: 'skarn', from: 'glitch', cost: 8,  cd: 0.30 },
  { id: 'jet',     el: 'vann',  from: 'brood',  cost: 6,  cd: 0.16 },
  { id: 'slag',    el: 'hott',  from: 'atlas',  cost: 12, cd: 0.52 },
  { id: 'frost',   el: 'glazz', from: 'zero',   cost: 14, cd: 0.60 },
  { id: 'arc',     el: 'zizt',  from: 'prism',  cost: 10, cd: 0.42 },
];
const ARM_BY_BOSS = {}; for (const a of ARMS) ARM_BY_BOSS[a.from] = a.id;
function armDef(id) { return ARMS.find(a => a.id === id); }

// ---------------------------------------------------------------------------
// THE PLATING CHAIN. Every boss past the first is armored, and its plating
// shorts only to the arm taken from the boss before it — beat NULLFANG, wear
// its arm against TALONHOST, and so on up the chain. While plated, hits do a
// fraction; short the plating (or catch a vulnerable window: the Song's
// stagger, TALONHOST's rest) and it takes damage for real. Each boss is also
// natively faster and more relentless than the one before.
// ---------------------------------------------------------------------------
const BOSS_GATE = { brood: 'shard', atlas: 'jet', zero: 'slag', prism: 'frost', mother: 'arc' };
const BOSS_AGGRO = { glitch: 1, brood: 1.12, atlas: 1.22, zero: 1.32, prism: 1.42, mother: 1.55 };
function bossGateOpen(b) {
  if (!BOSS_GATE[b.kind]) return true;
  if ((b.shieldT || 0) > 0) return true;
  if ((b.stagT || 0) > 0) return true;                       // the Song opens all
  if (b.kind === 'brood' && (b.st === 'restlow' || b.st === 'rest')) return true;
  return false;
}

function ownedArms() { return ARMS.filter(a => ((G.save && G.save.arms) || []).includes(a.id)); }
// slot 0 is deliberately empty: the plain bolt stays on the wheel, so acquiring a
// suit never takes an option away from you.
function armSlots() { return [null].concat(ownedArms()); }
function activeArm() {
  const sl = armSlots();
  return sl[((G.save && G.save.armIdx) || 0) % sl.length] || null;
}
function cycleArm(dir) {
  const sl = armSlots(); if (sl.length < 2) return false;
  G.save.armIdx = ((((G.save.armIdx || 0) + (dir || 1)) % sl.length) + sl.length) % sl.length;
  return true;
}
function armEl() { const a = activeArm(); return a ? a.el : null; }

// each suit fires differently — that is the point of wearing it
function fireArm(p, a) {
  const x = p.x + p.w / 2 + p.face * 16, y = p.y + p.h / 2 - 4;
  const E = ELEM[a.el], base = DF().pdmg;
  const mk = (vx, vy, dmg, r, grav, life) => {
    const pr = new Proj(x, y, vx, vy, true, Math.round(dmg * base), r, E.col, grav || 0, life || 3);
    pr.el = a.el; G.projs.push(pr); return pr;
  };
  if (a.id === 'shard') {                       // wide cone of ferrous shrapnel
    for (let i = -2; i <= 2; i++) mk(p.face * (430 + Math.abs(i) * 30), i * 105, 11, 5, 260, 0.5);
    sfx('shoot');
  } else if (a.id === 'jet') {                  // continuous shove
    mk(p.face * (520 + rnd(-40, 40)), rnd(-40, 40), 6, 7, 0, 0.32);
    sfx('shoot');
  } else if (a.id === 'slag') {                 // lobbed, and it pools where it lands
    const pr = mk(p.face * 380, -240, 26, 10, 900, 2.2);
    pr.pool = true; sfx('cast');
  } else if (a.id === 'frost') {                // freezes what it touches solid
    const pr = mk(p.face * 470, 0, 20, 9, 0, 1.4);
    pr.freeze = true; sfx('cast');
  } else {                                      // arc: chains to a second target
    const pr = mk(p.face * 660, 0, 17, 8, 0, 1.1);
    pr.chain = 2; sfx('cast');
  }
}

// element carried by any target
function elOf(e) {
  if (!e) return null;
  if (typeof Boss !== 'undefined' && e instanceof Boss) return BOSS_EL[e.kind] || 'skarn';
  return MIMIC_EL[e.kind] || 'skarn';
}
// how hard `atk` lands on `def`
function elemMul(atk, def) {
  if (!atk || !def) return 1;
  const wins = EXTRA_BEATS[atk] || (BEATS[atk] ? [BEATS[atk]] : []);
  if (wins.includes(def)) return 2.6;
  if (atk === def) return 0.5;
  return 1;
}

// One damage funnel so melee, arms and the Song all obey the chart and all
// produce the same read on screen.
// ---------------------------------------------------------------------------
// THE BODY YOU SEE IS THE BODY YOU CAN HIT. The new boss art draws far beyond
// the old movement boxes, so player attacks test against a visual-sized
// hurtbox. Movement and contact damage keep the tight box — the fight gets
// fairer for the player, never harsher.
// ---------------------------------------------------------------------------
function hurtBoxOf(e) {
  const cx2 = e.x + e.w / 2;
  if (e.kind === 'glitch') {            // NULLFANG: long low body, bottom-anchored
    const w = e.w * 2.6, h = e.h * 2.1;
    return { x: cx2 - w / 2, y: e.y + e.h - h, w, h };
  }
  if (e.kind === 'brood') {             // TALONHOST: wings and tail, centred
    const w = e.w * 2.4, h = e.h * 2.2;
    return { x: cx2 - w / 2, y: e.y + e.h / 2 - h / 2, w, h };
  }
  if (e.kind === 'flier') {             // mini TALONHOST wingspan
    const w = e.w * 2.0, h = e.h * 1.7;
    return { x: cx2 - w / 2, y: e.y + e.h / 2 - h / 2, w, h };
  }
  if (e.kind === 'zero') {              // GLACIERE: the drawn unicorn, horn to tail
    const w = e.w * 1.5, h = e.h * 1.9;
    return { x: cx2 - w / 2, y: e.y + e.h - h, w, h };
  }
  if (typeof G !== 'undefined' && G.roomDef && G.roomDef.zone === 'A'
      && (e.kind === 'crawler' || e.kind === 'hopper')) {
    const w = e.w * 1.8, h = e.h * 1.45; // whelps drawn bigger than their box
    return { x: cx2 - w / 2, y: e.y + e.h - h, w, h };
  }
  return e;
}

// How long a hit stays "recent" for the purposes of grouping, and what the
// window is worth once it opens. 1.1 s is a little over three swings of a
// three-hit combo at her cadence, so a committed player groups without having
// to frame-count, and a player poking from range never does.
const DAZE_WINDOW = 1.1, DAZE_MUL = 1.6;

function dealDmg(e, dm, atkEl, x, y, noPenalty) {
  // THE SAGE IS NEVER KILLED. Every strike on one routes through its own
  // law (js/entities.js sageStruck): claws break it down to the floor and
  // no further; the crystal purifies. docs/combat/SAGE.md.
  if (e.kind === 'sage' && typeof sageStruck === 'function') return sageStruck(e, dm, x, y);
  // NEVER PUNISH AFFECTION — and never let a mis-swing undo an hour of the run.
  // A wolf that has changed sides cannot be hurt by her, at all: the swing
  // lands as a hand on a flank instead (js/pets.js has the same law for the
  // freed guardians). Without this, the reward for taming the Alpha would be a
  // roomful of friends the player can accidentally delete.
  if (typeof isWolf === 'function' && isWolf(e) && typeof packTamed === 'function' && packTamed()) {
    burst(x, y, 5, '#9ffcff', 150, 0.3, 0, 2, true);
    if (typeof sfx === 'function') sfx('pick');
    return 0;
  }
  // THE GUARD'S PLATE. Up by default, down only while it is winded from its
  // own lunge — so the answer is not "hit it more", it is "hit it THEN".
  // Deliberately not immunity: a player who keeps swinging still makes very
  // slow progress and is never hard-stuck, they are simply being taught that
  // there is a better moment.
  if (e.guard) {
    burst(x, y, 7, '#cfe0f0', 190, 0.3, 60, 2.2, true);
    if (typeof sfx === 'function') sfx('bosshit');
    e.hurtT = 0.12;
    e.hp -= Math.max(1, Math.round(dm * 0.12));
    if (e.hp <= 0 && !e.dead) e.die(Math.sign(x - (e.x + e.w / 2)) || 1, -0.3);
    return 0;
  }
  // ARC OVERLOAD: hiding inside the lightning — nothing lands until it ends
  if ((e.stormT || 0) > 0) {
    burst(x, y, 6, '#8ff6ff', 200, 0.3, 0, 2.5, true);
    G.elemPop = { t: 0.4, x, y, el: null };
    return 0;
  }
  // plating chain: the key element SHORTS the shield; anything else clinks
  if (BOSS_GATE[e.kind] && e.hpMax) {
    const key = armDef(BOSS_GATE[e.kind]);
    if (atkEl && key && atkEl === key.el && (e.shieldT || 0) <= 0) {
      e.shieldT = 6;
      burst(x, y, 26, ELEM[atkEl].glow, 380, 0.6, 120, 4, true);
      cam.shake = Math.max(cam.shake, 8); G.hitStop = Math.max(G.hitStop, 0.1);
      sfx('phase');
    } else if (!bossGateOpen(e)) {
      // WRONG ARM USED TO MEAN 6.7x THE FIGHT. The design promises you may take
      // the guardians in any order; this line then punished exactly that. The
      // finale is gated behind an arm that drops from an OPTIONAL secret boss,
      // so a player who never found it fought 750 HP at 7.3 damage a second —
      // a hundred and three seconds of unbroken contact. It is still a strong
      // reason to go and find the counter; it is no longer a wall in front of
      // somebody who did not know there was one.
      dm = Math.max(1, Math.round(dm * 0.40));
      G.elemPop = { t: 0.4, x, y, el: null };
    }
  }
  const def = elOf(e);
  let mul = elemMul(atkEl, def);
  if (noPenalty && mul < 1) mul = 1;   // the blade never gets worse for the suit worn
  if (e.hypnoT > 0) mul *= 1.5;            // charmed things do not brace
  // ---------------------------------------------------------------------
  // THE HIT GROUP. A guardian that only ever loses HP gives the player no
  // reason to press an advantage — every hit is worth the same, so trading
  // one at a time from max range is optimal play and the fight goes quiet.
  //
  // So a run of hits landed CLOSE TOGETHER breaks it: the counter is on a
  // rolling window, and it only counts because the window has not lapsed.
  // Opting in is per-boss (`dazeAt`), the state change is REQUESTED here and
  // taken by the boss's own update — damage code must not reach into a state
  // machine, or the boss can be yanked out of a committed move mid-frame.
  if (e.dazeAt && !e.dead && (e.dazeCD || 0) <= 0 && e.st !== 'daze') {
    e.dazeHits = ((e.dazeWin || 0) > 0 ? (e.dazeHits || 0) : 0) + 1;
    e.dazeWin = DAZE_WINDOW;
    if (e.dazeHits >= e.dazeAt) { e.dazeReq = true; e.dazeHits = 0; }
  }
  // and while it IS broken open, hits land harder — the window has to be worth
  // taking, or it is just a pause in the fight
  if (e.st === 'daze') mul *= DAZE_MUL;
  const out = Math.max(1, Math.round(dm * mul));
  e.hp -= out; e.hurtT = 0.15;
  if (mul >= 2) {
    e.stagT = Math.max(e.stagT || 0, 0.32);
    burst(x, y, 16, ELEM[atkEl] ? ELEM[atkEl].glow : '#ffffff', 360, 0.45, 120, 4, true);
    cam.shake = Math.max(cam.shake, 6);
    G.hitStop = Math.max(G.hitStop, 0.07);
    G.elemPop = { t: 0.5, x, y, el: atkEl };
    sfx('bosshit');
  } else if (mul < 1) {
    G.elemPop = { t: 0.4, x, y, el: null };
  }
  return out;
}

// ---------------------------------------------------------------------------
// The Song. HZD-99 is a repair unit, so her signature is a diagnostic tool: the
// fabricators were tuned by tone, and mimics have no idea what music is.
// Costs volts, exactly as RUSTSONG.md specified:
//   "Nikk, volk klin gavt, murr gross takk." — give a little energy, take back
//   great music.
// ---------------------------------------------------------------------------
const SONG_COST = 26, SONG_RANGE = 210, SONG_HOLD = 3.0;

function playSong() {
  const px = player.x + player.w / 2, py = player.y + player.h / 2;
  player.volts -= SONG_COST;
  player.songT = 0.55;
  G.songWave = { t: 0.7, x: px, y: py };
  sfx('powerUp');
  let charmed = 0;
  // the Husk listens too — calming it is how you get your charge back
  const targets = G.enemies
    .concat(G.pickups.filter(o => o && o.kind === 'husk'))
    .concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
  for (const e of targets) {
    if (e.dead) continue;
    if (Math.hypot(e.x + e.w / 2 - px, e.y + e.h / 2 - py) > SONG_RANGE) continue;
    if (typeof Boss !== 'undefined' && e instanceof Boss) {
      e.stagT = Math.max(e.stagT || 0, 0.85);   // too large to charm — but it can miss
      e.t = Math.max(e.t, 0.9);
      G.elemPop = { t: 0.5, x: e.cx(), y: e.y - 10, el: 'murr' };
    } else {
      e.hypnoT = SONG_HOLD; e.vx = 0; charmed++;
      burst(e.x + e.w / 2, e.y, 8, ELEM.murr.glow, 150, 0.5, -40, 3, true);
    }
  }
  return charmed;
}

// ---------------------------------------------------------------------------
// Graphics. Each suit gets a badge built the same way as the portraits: a lit
// form with a hue-shifted ramp, never a flat primitive.
// ---------------------------------------------------------------------------
function drawArmBadge(c, id, r, lit) {
  const a = armDef(id); if (!a) return;
  const E = ELEM[a.el];
  c.save();
  // socket
  const g = c.createLinearGradient(-r, -r, r * 0.7, r);
  g.addColorStop(0, lit ? '#2b4a5c' : '#16232e'); g.addColorStop(1, '#0a1420');
  c.fillStyle = g;
  c.beginPath();
  for (let i = 0; i < 6; i++) {                 // hex bezel: reads as machined
    const an = i / 6 * Math.PI * 2 - Math.PI / 2;
    c[i ? 'lineTo' : 'moveTo'](Math.cos(an) * r, Math.sin(an) * r);
  }
  c.closePath(); c.fill();
  c.strokeStyle = lit ? E.glow : 'rgba(120,150,170,0.45)';
  c.lineWidth = lit ? 2.2 : 1.4; c.stroke();

  c.save(); c.scale(r / 16, r / 16);
  c.fillStyle = E.col;
  if (lit) { c.shadowColor = E.glow; c.shadowBlur = 10; }
  if (a.el === 'skarn') {              // shrapnel: three angular shards
    for (const [dx, dy, s] of [[-5, 2, 1], [3, -4, 0.8], [5, 5, 0.6]]) {
      c.beginPath(); c.moveTo(dx, dy - 6 * s); c.lineTo(dx + 5 * s, dy + 3 * s);
      c.lineTo(dx - 4 * s, dy + 4 * s); c.closePath(); c.fill();
    }
  } else if (a.el === 'vann') {        // droplet under pressure
    c.beginPath(); c.moveTo(0, -9); c.quadraticCurveTo(7, 0, 7, 4);
    c.quadraticCurveTo(7, 10, 0, 10); c.quadraticCurveTo(-7, 10, -7, 4);
    c.quadraticCurveTo(-7, 0, 0, -9); c.closePath(); c.fill();
  } else if (a.el === 'hott') {        // slag: a flame with a heavy base
    c.beginPath(); c.moveTo(0, -10); c.quadraticCurveTo(6, -2, 5, 3);
    c.quadraticCurveTo(9, 1, 8, 7); c.quadraticCurveTo(4, 11, 0, 11);
    c.quadraticCurveTo(-8, 11, -8, 4); c.quadraticCurveTo(-8, -2, 0, -10);
    c.closePath(); c.fill();
  } else if (a.el === 'glazz') {       // frost lattice: six spokes, barbed
    c.strokeStyle = E.col; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const an = i / 6 * Math.PI * 2;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(an) * 9, Math.sin(an) * 9); c.stroke();
      c.beginPath();
      c.moveTo(Math.cos(an) * 5, Math.sin(an) * 5);
      c.lineTo(Math.cos(an + 0.7) * 8, Math.sin(an + 0.7) * 8); c.stroke();
    }
  } else {                             // arc: a chaining bolt
    c.beginPath(); c.moveTo(2, -10); c.lineTo(-6, 1); c.lineTo(-1, 1);
    c.lineTo(-3, 10); c.lineTo(6, -2); c.lineTo(1, -2); c.closePath(); c.fill();
  }
  c.shadowBlur = 0; c.restore();
  c.restore();
}

// the keytar HZD-99 carries — drawn in the player's local space while playing
function drawKeytar(c, face, t) {
  c.save(); c.scale(face, 1);
  c.fillStyle = '#1b2b36';
  c.beginPath(); c.moveTo(-2, -4); c.lineTo(20, -8); c.lineTo(21, 0); c.lineTo(-1, 3); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(190,235,230,0.5)'; c.lineWidth = 1; c.stroke();
  for (let i = 0; i < 7; i++) {                    // keys, one lighting per beat
    const on = (Math.floor(t * 14) % 7) === i;
    c.fillStyle = on ? ELEM.murr.glow : '#cfe0e4';
    c.fillRect(0.5 + i * 2.8, -6.6 + i * 0.25, 2.1, 4.4);
  }
  c.restore();
}


// ---------------------------------------------------------------------------
// SHURIKEN — zizt-charged throwing stars. A ninja without stars is not a ninja.
//
// The restock loop is a repair unit's, not a soldier's: she does not find ammo,
// she gets her own back. A thrown star sticks where it lands and can be picked up
// again, so the stars are a resource you manage in space rather than a magazine
// you refill. Killing something with one returns it instantly — a clean kill
// costs nothing. Benches re-forge the full set.
// ---------------------------------------------------------------------------
const STAR_MAX_BASE = 6, STAR_CD = 0.17, STAR_SPD = 720;
// the suit condenses ambient static back into a star while you fight on
const STAR_REGEN_T = 8;

function starMax() { return STAR_MAX_BASE + (((G.save && G.save.arms) || []).length >= 3 ? 2 : 0); }
function starCount() { return G.save ? (G.save.stars == null ? starMax() : G.save.stars) : 0; }
function starSet(n) { if (G.save) G.save.stars = clamp(n, 0, starMax()); }
function starRestock() { starSet(starMax()); }

function throwStar(p) {
  if (starCount() <= 0) { sfx('lowDown'); G.toast(t('star_none')); return false; }
  starSet(starCount() - 1);
  const up = inD('UP'), dn = inD('DOWN') && !p.on;
  const vy = up ? -STAR_SPD : dn ? STAR_SPD : 0;
  const vx = (up || dn) ? p.face * 90 : p.face * STAR_SPD;
  G.projs.push(new Star(p.x + p.w / 2 + p.face * 12, p.y + p.h / 2 - 4, vx, vy));
  p.starCD = STAR_CD; sfx('shoot');
  return true;
}

class Star {
  constructor(x, y, vx, vy) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.r = 7; this.w = 14; this.h = 14;
    this.spin = 0; this.life = 4; this.dead = false;
    this.stuck = false; this.stuckT = 0; this.hits = 0;
    this.el = 'zizt'; this.dmg = Math.round(15 * DF().pdmg);
    this.friendly = true;
    this.color = ELEM.zizt.col;   // drawLights() reads .color off every projectile
  }
  box() { return { x: this.x - 7, y: this.y - 7, w: 14, h: 14 }; }
  update(dt) {
    this.spin += dt * (this.stuck ? 1.2 : 26);
    if (this.stuck) {
      // sitting in a wall, waiting to be collected
      this.stuckT += dt;
      if (!player.dead && aabb(this.box(), player)) {
        this.dead = true; starSet(starCount() + 1);
        sfx('pick'); burst(this.x, this.y, 8, MAT.cyan.lit, 160, 0.35, 0, 3, true);
      }
      if (this.stuckT > 26) { this.dead = true; }   // eventually it corrodes
      return;
    }
    this.life -= dt;
    if (this.life <= 0) { this.dropAsPickup(); return; }
    this.vy += 320 * dt;                            // a little drop, so it arcs
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (solidAt(Math.floor(this.x / TILE), Math.floor(this.y / TILE))) {
      this.stuck = true; this.vx = this.vy = 0;
      sfx('metal'); burst(this.x, this.y, 5, MAT.cyan.mid, 120, 0.25, 0, 2, true);
      return;
    }
    const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
    for (const e of targets) {
      if (e.dead || (this.seen && this.seen.has(e))) continue;
      if (!aabb(this.box(), hurtBoxOf(e))) continue;
      if (!this.seen) this.seen = new Set();
      this.seen.add(e);
      dealDmg(e, this.dmg, 'zizt', this.x, this.y);
      burst(this.x, this.y, 9, ELEM.zizt.glow, 220, 0.3, 0, 3, true);
      if (e.hp <= 0) {
        e.die(Math.sign(this.vx) || 1, -0.3);
        // a clean kill hands the star straight back
        this.dead = true; starSet(starCount() + 1);
        sfx('pick');
        return;
      }
      this.hits++;
      if (this.hits >= 2) { this.dropAsPickup(); return; }   // pierces two, then falls
      this.vx *= 0.75;
    }
  }
  dropAsPickup() {
    this.dead = true;
    G.pickups.push(new StarPickup(this.x, this.y));
  }
  draw(c) {
    c.save(); c.translate(this.x, this.y); c.rotate(this.spin);
    if (!this.stuck) {                               // charge trail
      c.strokeStyle = 'rgba(63,216,238,0.35)'; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, 10, 0, 7); c.stroke();
    }
    c.shadowColor = ELEM.zizt.col; c.shadowBlur = this.stuck ? 6 : 12;
    c.fillStyle = ramp(c, MAT.steel, -7, -7, 7, 7);
    c.beginPath();
    for (let i = 0; i < 4; i++) {                    // four-point star, notched
      const a = i / 4 * Math.PI * 2;
      c.lineTo(Math.cos(a) * 7.5, Math.sin(a) * 7.5);
      c.lineTo(Math.cos(a + 0.39) * 2.6, Math.sin(a + 0.39) * 2.6);
    }
    c.closePath(); c.fill();
    c.fillStyle = ELEM.zizt.glow;
    c.beginPath(); c.arc(0, 0, 1.9, 0, 7); c.fill();
    c.shadowBlur = 0; c.restore();
  }
}

// a star lying on the ground, waiting to be walked over
class StarPickup {
  constructor(x, y) {
    this.x = x - 7; this.y = y - 7; this.w = 14; this.h = 14;
    this.vx = rnd(-40, 40); this.vy = -90; this.t = 0; this.dead = false;
  }
  update(dt) {
    this.t += dt; this.vy += 900 * dt;
    const col = moveEnt(this, dt);
    if (col.d) { this.vy = 0; this.vx *= 0.8; }
    if (this.t > 1.0 && !player.dead && dist2(this.x, this.y, player.x, player.y) < 300 * 300) {
      const dx = player.x + 12 - this.x, dy = player.y + 18 - this.y, d = Math.hypot(dx, dy) || 1;
      this.x += dx / d * 280 * dt; this.y += dy / d * 280 * dt;   // never unreachable
    }
    if (!player.dead && aabb(this, player)) {
      this.dead = true; starSet(starCount() + 1);
      sfx('pick'); burst(this.x + 7, this.y + 7, 8, MAT.cyan.lit, 160, 0.35, 0, 3, true);
    }
  }
  draw(c) {
    c.save(); c.translate(this.x + 7, this.y + 7); c.rotate(this.t * 1.6);
    c.shadowColor = ELEM.zizt.col; c.shadowBlur = 8 + Math.sin(this.t * 5) * 4;
    c.fillStyle = MAT.steel.mid;
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2;
      c.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
      c.lineTo(Math.cos(a + 0.39) * 2.4, Math.sin(a + 0.39) * 2.4);
    }
    c.closePath(); c.fill();
    c.shadowBlur = 0; c.restore();
  }
}
