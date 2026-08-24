// CLAWBYTE — the Neural Tree (IQ → skills) and the relic table.
//
// The word riddles that used to live here are gone. They asked the player to
// solve a pun in English — a vocabulary test wearing a puzzle's clothes, which
// a young player or a player reading the Arabic could not attempt at all, and
// which could not be translated honestly because a pun does not survive the
// journey. Mind Nodes now hand out one interactive puzzle each (NODES in
// trials.js): remember the lights, read the cubes, weigh the objects.
// Neural Tree — skills unlocked with accumulated IQ
const SKILLS = [
  { id: 'mind', cost: 10, tier: 0 },    // +1 crest socket
  { id: 'calc', cost: 20, tier: 0 },    // stronger combo finisher
  { id: 'reflex', cost: 30, tier: 1 },  // longer invincibility after hits
  { id: 'router', cost: 40, tier: 1 },  // cheaper EMP
  { id: 'reach', cost: 50, tier: 1 },   // the finisher becomes the long rake
  { id: 'triple', cost: 60, tier: 2 },  // third jump
  { id: 'wave', cost: 80, tier: 2 },    // slashes fire an energy wave
  // ---- THE PURIFIER BRANCH -----------------------------------------------
  // A new tree grows when the crystal does (the owner's ruling: the sword is
  // "a new fighting skill, a new finding mood... a new tree will appear in
  // the skills"). `need` names the save flag that makes a node EXIST — not
  // merely locked but absent, so a player without the crystal never sees a
  // tree for a weapon they have not met. The teaching order follows
  // combat-education §5: each node is a verb, and no verb is required the
  // room after it is learned.
  { id: 'purity', cost: 30, tier: 1, need: 'crystal' },    // slashes cleanse the infected
  { id: 'risecut', cost: 45, tier: 1, need: 'crystal' },   // the up-slash becomes a launcher
  { id: 'plunge', cost: 60, tier: 2, need: 'crystal' },    // the down-slash lands a shockwave
  { id: 'boomer', cost: 90, tier: 2, need: 'crystal2' },   // the joined blade flies and returns
];
// The tree as SHE sees it: only nodes whose weapon she holds. Every reader of
// SKILLS — the screen, the HUD nudge, the affordable/next pair — goes through
// here, so the four can never disagree about what exists.
function skillPool() {
  const f = (typeof G !== 'undefined' && G.save && G.save.flags) || {};
  return SKILLS.filter(sk => !sk.need || f[sk.need]);
}
function tierOpen(tier, unlocked) { return tier === 0 || (tier === 1 && unlocked >= 1) || (tier === 2 && unlocked >= 3); }

// Relics — bonus items: 'drop' from enemy wrecks, boss trophies, or hidden glimmers
const RELIC_DROPS = ['bell', 'lens', 'coolant', 'spring'];
const RELIC_TROPHY = { glitch: 'fang', brood: 'silk', atlas: 'ember', zero: 'shard', prism: 'whisker', mother: 'silent' };
const RELIC_ICONS = { bell: '🔔', lens: '◐', coolant: '🧪', spring: '〰', fang: '⟅', silk: '❋', ember: '🔥', shard: '❆', whisker: '⌇', silent: '●', collar: '◍', coin: '◎', star: '✦', sigil1: '⚿', sigil2: '⚿', sigil3: '⚿', aegis: '⛨' };

// ---------------------------------------------------------------------------
// THE MINI STAGE — what a skill LOOKS LIKE, before you spend on it.
//
// The owner: "when I choose the skill from the tree, it should open a window
// next to it showing me the character doing it in a mini screen showing the
// character doing it to describe what's gonna happen. And the same goes with
// the upgrades I would get when beating the bosses."
//
// He is right, and the reason he is right is that this tree sells VERBS. A node
// called "wave" with a line of description under it is a purchase made on
// faith; a small window with her in it, swinging, and a crescent leaving the
// blade, is a purchase made on sight. Every game that asks you to spend a
// currency on a move shows you the move.
//
// It is drawn from HER OWN SHEET — the same cells the game draws her with, in
// the same order the move plays them — so what the window promises is exactly
// what arrives. The effects beside her are the game's own vocabulary of light,
// which is the one part of the look that is ours to draw (ART_BIBLE §0.0).
//
// A script is a list of [pose, seconds, fx] and the stage loops it forever.
// `fx` gets (c, cx, base, h, k) where k is 0..1 through THAT beat, so an
// effect can travel, grow or fade across its own step rather than blinking.
// ---------------------------------------------------------------------------
const DEMO_LOOP_GAP = 0.55;          // a beat of stillness so the loop reads

// one cell of the state sheet, drawn on a stage floor rather than in a room
function demoCell(c, st, cx, base, h, flip) {
  const im = (typeof MEDIA_IMG !== 'undefined') && MEDIA_IMG.heroStates;
  if (!im || !im.width) return false;
  const cw = im.width / HERO_CELLS, ch = im.height;
  const col = HERO_CELL[st] != null ? HERO_CELL[st] : 0;
  const dh = h * ((typeof HERO_POSE_K !== 'undefined' && HERO_POSE_K[st]) || 1);
  const dw = dh * (cw / ch);
  // airborne cells are centred in their cell; grounded ones stand on its floor
  const air = (typeof HERO_AIR !== 'undefined') && HERO_AIR[st];
  const dy = air ? -dh * 0.5 - h * 0.28 : -dh;
  c.save();
  c.translate(cx, base);
  if (flip) c.scale(-1, 1);
  c.drawImage(im, col * cw, 0, cw, ch, -dw / 2, dy, dw, dh);
  c.restore();
  return true;
}

// --- the vocabulary of light the scripts draw with -------------------------
function demoGlow(c, x, y, r, col, a) {
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
  const g = c.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.restore(); c.globalAlpha = 1;
}
function demoArc(c, x, y, r, a0, a1, col, w, a) {
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.arc(x, y, r, a0, a1); c.stroke();
  c.restore(); c.globalAlpha = 1;
}
function demoRing(c, x, y, r, col, w, a) {
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
  c.strokeStyle = col; c.lineWidth = w;
  c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
  c.restore(); c.globalAlpha = 1;
}

// --- one script per verb ---------------------------------------------------
// Each entry is the move, in the poses the game itself would play, with the
// thing the skill ADDS drawn beside her. Anything without a script falls back
// to her standing there, which is honest: a node with nothing to show is a
// node whose demo has not been written, not a lie about what it does.
const SKILL_DEMO = {
  // +1 crest socket — the sockets themselves are the subject
  mind: [['idle', 1.6, (c, cx, base, h, k) => {
    for (let i = 0; i < 3; i++) {
      const on = k > 0.35 + i * 0.16;
      const x = cx - 22 + i * 22, y = base - h - 12;
      c.save(); c.translate(x, y); c.rotate(Math.PI / 4);
      c.fillStyle = on ? '#37ffd0' : 'rgba(90,110,130,0.45)';
      if (on) { c.shadowColor = '#37ffd0'; c.shadowBlur = 8; }
      c.fillRect(-5, -5, 10, 10); c.restore(); c.shadowBlur = 0;
    }
  }]],
  // a stronger finisher: the three-hit chain, with the last one landing hard
  calc: [['claw_1', 0.24], ['claw_2', 0.24], ['finisher', 0.5, (c, cx, base, h, k) => {
    demoGlow(c, cx + h * 0.42, base - h * 0.45, h * (0.3 + k * 0.5), '#ffd76a', (1 - k) * 0.8);
  }]],
  // longer invincibility: she is hit, and the shield holds
  reflex: [['hurt', 0.35], ['idle', 1.3, (c, cx, base, h, k) => {
    demoRing(c, cx, base - h * 0.45, h * 0.46, '#8ff6ff', 2, (0.35 + Math.sin(k * 18) * 0.2) * (1 - k * 0.4));
  }]],
  // cheaper EMP: the pulse goes out and the cost bar barely moves
  router: [['idle', 1.5, (c, cx, base, h, k) => {
    const r = h * 0.2 + k * h * 0.7;
    demoRing(c, cx, base - h * 0.45, r, '#b48cff', 3 * (1 - k), 0.8 * (1 - k));
    c.save(); c.globalAlpha = 0.9; c.fillStyle = 'rgba(60,72,90,0.9)';
    c.fillRect(cx - 26, base + 10, 52, 5);
    c.fillStyle = '#b48cff'; c.fillRect(cx - 26, base + 10, 52 * 0.82, 5);
    c.restore(); c.globalAlpha = 1;
  }]],
  // the long rake: the finisher, reaching much further than the combo did
  reach: [['claw_2', 0.22], ['finisher', 0.9, (c, cx, base, h, k) => {
    const rr2 = h * (0.35 + k * 0.85);
    demoArc(c, cx, base - h * 0.45, rr2, -0.8, 0.8, '#ffffff', 3 * (1 - k * 0.6), (1 - k) * 0.9);
  }]],
  // the third jump: up, up, and up again
  triple: [['rise', 0.3, (c, cx, base, h) => demoGlow(c, cx, base - h * 0.05, h * 0.3, '#8ff6ff', 0.5)],
           ['apex', 0.16],
           ['rise', 0.3, (c, cx, base, h) => demoGlow(c, cx, base - h * 0.05, h * 0.3, '#8ff6ff', 0.6)],
           ['apex', 0.16],
           ['rise', 0.3, (c, cx, base, h) => demoGlow(c, cx, base - h * 0.05, h * 0.34, '#ffffff', 0.8)],
           ['apex', 0.3], ['fall', 0.3], ['land', 0.2]],
  // the wave: a slash that leaves the blade and travels
  wave: [['claw_1', 0.22], ['claw_2', 0.9, (c, cx, base, h, k) => {
    const x = cx + h * (0.3 + k * 1.1);
    demoArc(c, x, base - h * 0.45, h * 0.3, -1.1, 1.1, '#8ff6ff', 4, (1 - k) * 0.95);
  }]],
  // the purifier branch
  purity: [['claw_1', 0.9, (c, cx, base, h, k) => {
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2 + k * 3;
      const r = h * (0.25 + k * 0.5);
      demoGlow(c, cx + Math.cos(a) * r, base - h * 0.45 + Math.sin(a) * r * 0.7,
               5, '#dff7e6', (1 - k) * 0.9);
    }
  }]],
  risecut: [['claw_2', 0.2], ['rise', 0.9, (c, cx, base, h, k) => {
    demoArc(c, cx, base - h * (0.4 + k * 0.9), h * 0.34, -2.6, -0.5, '#eaf6ff', 4, (1 - k) * 0.95);
  }]],
  plunge: [['fall', 0.4], ['land', 1.0, (c, cx, base, h, k) => {
    demoRing(c, cx, base - 4, h * (0.15 + k * 1.0), '#ffd76a', 4 * (1 - k), (1 - k) * 0.9);
  }]],
  boomer: [['claw_2', 0.25], ['idle', 1.3, (c, cx, base, h, k) => {
    // out and back, which is the whole point of the move
    const s = Math.sin(k * Math.PI);
    const x = cx + h * 1.25 * s;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.95;
    c.translate(x, base - h * 0.45); c.rotate(k * 26);
    c.strokeStyle = '#eaf6ff'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-h * 0.22, 0); c.lineTo(h * 0.22, 0); c.stroke();
    c.restore(); c.globalAlpha = 1;
  }]],
};

// The same window, for the powers the BOSSES hand over — the owner asked for
// both in one breath, and they are the same question: what am I getting?
const ABILITY_DEMO = {
  dash: [['idle', 0.25], ['dash', 0.9, (c, cx, base, h, k) => {
    for (let i = 0; i < 4; i++)
      demoArc(c, cx - h * (0.2 + i * 0.22 + k * 0.5), base - h * (0.3 + i * 0.08),
              h * 0.1, -0.4, 0.4, '#ff9a4a', 3, (1 - k) * 0.6);
  }]],
  djump: [['rise', 0.28], ['apex', 0.18], ['djump_jet', 0.8, (c, cx, base, h, k) => {
    demoGlow(c, cx, base - h * 0.06, h * (0.2 + k * 0.34), '#8ff6ff', (1 - k * 0.5) * 0.85);
  }], ['fall', 0.3]],
  wall: [['wall_cling', 0.7], ['rise', 0.7, (c, cx, base, h, k) => {
    demoGlow(c, cx - h * 0.3, base - h * (0.3 + k * 0.4), h * 0.16, '#8ff6ff', (1 - k) * 0.7);
  }]],
  glide: [['fall', 0.3], ['apex', 1.1, (c, cx, base, h, k) => {
    demoArc(c, cx, base - h * 0.5, h * 0.5, 3.5 + k, 5.6 + k, '#dfefff', 2, 0.55);
  }]],
  pulse: [['charge', 0.7, (c, cx, base, h, k) => {
    demoRing(c, cx, base - h * 0.45, h * (0.7 - k * 0.45), '#b48cff', 2, 0.8);
  }], ['burst', 0.8, (c, cx, base, h, k) => {
    demoRing(c, cx, base - h * 0.45, h * (0.2 + k * 1.1), '#ffffff', 4 * (1 - k), (1 - k) * 0.95);
  }]],
  crystal: [['idle', 0.35], ['claw_1', 0.25], ['finisher', 0.9, (c, cx, base, h, k) => {
    demoArc(c, cx, base - h * 0.45, h * (0.4 + k * 0.7), -1.0, 1.0, '#eaf6ff', 4, (1 - k) * 0.95);
  }]],
};

// Which script, and how long it runs for
function demoScript(id) { return SKILL_DEMO[id] || ABILITY_DEMO[id] || null; }
function demoDur(sc) {
  let d = DEMO_LOOP_GAP;
  for (const b of sc) d += b[1];
  return d;
}

// THE WINDOW. Drawn wherever the caller wants it, at whatever size; everything
// inside is derived from the box so one component serves a tree node's popout
// and a boss reward card without either knowing about the other.
function drawSkillDemo(c2, x, y, w, h2, id, tSec) {
  const sc = demoScript(id);
  c2.save();
  // the stage: a panel with a floor, so she is standing somewhere
  c2.fillStyle = 'rgba(8,13,20,0.92)';
  rr(c2, x, y, w, h2, 10); c2.fill();
  c2.strokeStyle = 'rgba(180,140,255,0.45)'; c2.lineWidth = 1.5;
  rr(c2, x, y, w, h2, 10); c2.stroke();
  // clip, so an effect that travels cannot escape into the tree behind it
  c2.beginPath(); rr(c2, x + 1, y + 1, w - 2, h2 - 2, 9); c2.clip();
  const base = y + h2 - Math.round(h2 * 0.18);
  const cx = x + w * 0.42;
  const bodyH = Math.round(h2 * 0.52);
  // the floor she stands on: a soft pool rather than a drawn line, because a
  // drawn line here is a 90-degree horizon in a game that does not have one
  demoGlow(c2, cx, base + 4, w * 0.42, 'rgba(120,150,190,0.5)', 0.5);
  if (!sc) {
    demoCell(c2, 'idle', cx, base, bodyH, false);
    c2.restore();
    return;
  }
  // where in the loop are we
  const dur = demoDur(sc);
  let t = ((tSec % dur) + dur) % dur;
  let pose = sc[sc.length - 1][0], fx = null, k = 1;
  for (const b of sc) {
    if (t < b[1]) { pose = b[0]; fx = b[2] || null; k = b[1] > 0 ? t / b[1] : 1; break; }
    t -= b[1];
  }
  demoCell(c2, pose, cx, base, bodyH, false);
  if (fx) { try { fx(c2, cx, base, bodyH, k); } catch (e) {} }
  c2.restore();
}
