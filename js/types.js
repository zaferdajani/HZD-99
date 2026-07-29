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
  hopper:  'vann',    // a leak-seeker; it copied NYA-9's own frame
  blob:    'hott',    // foundry spillage that cooled into legs
  flier:   'zizt',    // a survey lens that hovers and discharges
  turret:  'zizt',    // a fixed emplacement running on the same arc supply
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
function dealDmg(e, dm, atkEl, x, y, noPenalty) {
  const def = elOf(e);
  let mul = elemMul(atkEl, def);
  if (noPenalty && mul < 1) mul = 1;   // the blade never gets worse for the suit worn
  if (e.hypnoT > 0) mul *= 1.5;            // charmed things do not brace
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
// The Song. NYA-9 is a repair unit, so her signature is a diagnostic tool: the
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

// the keytar NYA-9 carries — drawn in the player's local space while playing
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
