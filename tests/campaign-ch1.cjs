// CHAPTER ONE, PLAYED (studio audit QA-03, 2026-10-10).
//
// One uninterrupted normal-input playthrough of chapter one, from a cleared
// browser, through the real title and difficulty menus, to the chapter-two
// teaser:
//
//   wake → move/jump → city gate → Ratchet's booth → letter → drawer battery →
//   repair board → explanation → pod → Volt Pack → heal/strike/burst → monument
//   → meadow & Old Servo → A2 landmark → quarry A5 → CV1 → CV1B → CV2 → CV3 →
//   raw marble → Ratchet forges the Purifier → maintenance passage → GA1T →
//   the first Sage cleansed (GA1D) → CHIME (A8 → A9) → NULLFANG (A3 → A4)
//   cleansed → the climb above the camp → the chapter-two teaser.
//
// THE EVIDENCE RULES, and why they are the whole point of this file. Every
// other chapter-one harness STAGES its beat: it writes the save to the moment
// before, or calls doInteract/loadRoom/startGame itself. This one may not.
//
//   - Input is ONLY Playwright keyboard events (page.keyboard) — the keys a
//     player presses. No mouse, no touch, no synthetic DOM events.
//   - It never writes game state: no G.save/flags/inventory/quest writes, no
//     player.x/y, no boss hp, no calls into startGame/loadRoom/doInteract or
//     any strike/rest function, no time-skips, no invincibility, no running the
//     loop faster than real time.
//   - It READS state every frame — room, position, the objective line, the
//     lesson chip, dialogue, enemies, the boss — because that is the bot's eyes:
//     it decides which key to press from what a player could see.
//   - Assists are the game's own, chosen through its own menus with keys, and
//     disclosed in the log (CAMPAIGN_DIFF picks the difficulty row).
//
// Where the bot needs MAP knowledge (which exit leads where) it reads the room
// table the in-game map is drawn from; what the game TOLD the player at each
// step (objective, chip, toasts, dialogue) is logged beside it, so the doc can
// say where the communication and the route disagreed.
//
// The run is real-time and long. It records a 1280x720 video of the whole run
// and logs every step to <out>/campaign.log:
//
//   node tests/campaign-ch1.cjs                         # the full chapter
//   CAMPAIGN_OUT=/some/dir node tests/campaign-ch1.cjs  # where video/log/frames go
//   CAMPAIGN_SEGMENT=path/to/save.json                  # continue a segment from the
//                                                       # localStorage the GAME wrote at a pod
//   CAMPAIGN_STOP=<mission id>                          # stop after a mission (dev)
//   CAMPAIGN_MAX_MIN=90                                 # wall-clock budget
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const OUT = process.env.CAMPAIGN_OUT || path.join(__dirname, 'out', 'campaign-ch1');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });
const LOGF = path.join(OUT, 'campaign.log');
fs.writeFileSync(LOGF, '');
const MAX_MS = (+process.env.CAMPAIGN_MAX_MIN || 55) * 60000;   // inside run.cjs's 60-minute budget
// 0 = the easiest preset (most cores, softest machines); disclosed in the log
const DIFF = process.env.CAMPAIGN_DIFF == null ? 0 : +process.env.CAMPAIGN_DIFF;
const SEGMENT = process.env.CAMPAIGN_SEGMENT || null;
const STOP_AT = process.env.CAMPAIGN_STOP || null;
const VIDEO = process.env.CAMPAIGN_VIDEO !== '0';
const DEBUG = process.env.CAMPAIGN_DEBUG === '1';

const T0 = Date.now();
const stamp = () => {
  const s = Math.floor((Date.now() - T0) / 1000);
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};
const LOG = [];
function log(msg) {
  const line = '[' + stamp() + '] ' + msg;
  LOG.push(line);
  console.log(line);
  fs.appendFileSync(LOGF, line + '\n');
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ===========================================================================
// THE PLANNER. A platformer bot that walks by guesswork gets stuck on the
// first ledge; this one plans with the game's own movement numbers
// (js/entities.js Player.update and moveEnt: 340 px/s, accel 3000, friction
// 2900, jump 920 with a 150 float band, cut to 280 on release, gravity
// 2150 rising / 3050 falling, 24x36 body, tile collision with one-way '='),
// simulating every jump it might make from every standable tile, and then
// executes the plan closed-loop: before each takeoff it re-simulates from the
// ACTUAL position and speed, and only jumps when the jump lands where the plan
// wanted. The heightfield (the drawn curve) is not modelled; replanning on
// every landing absorbs the difference.
// ===========================================================================
const TL = 32, PW = 24, PH = 36;
// the physics step the game is actually taking: 1/60 on a healthy frame, 1/30
// (SIM_STEP) when frames are slow — measured at boot and every minute
let DT = 1 / 60;
let RATE = 1;
let FRAME_S = 1 / 60;   // wall seconds per rendered frame, measured   // game seconds per wall second, measured from the snapshots
const SOLID = c => c === '#' || c === 'B';
const SPIKE = c => c === '^' || c === 'v';
function roomModel(info) {
  const { w, h, rows } = info;
  const at = (x, y) => (y < 0 || y >= h || x < 0 || x >= w) ? '.' : rows[y][x];
  const solid = (x, y) => SOLID(at(x, y));
  const stand = (x, y) => x >= 0 && x < w && y >= 0 && y < h && !solid(x, y) && !solid(x, y - 1) && !SPIKE(at(x, y))
    && (solid(x, y + 1) || at(x, y + 1) === '=');
  const M = { info, w, h, at, solid, stand, nodes: [], idx: new Map(), edges: [], W: w * TL, H: h * TL };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (stand(x, y)) { M.idx.set(x + ',' + y, M.nodes.length); M.nodes.push({ x, y }); }
  M.cellOf = (px, py) => {
    // px,py = the body's top-left; feet may ride a mound up to ~16 px above the tile
    const cx = px + PW / 2, feet = py + PH;
    const tx = Math.floor(cx / TL);
    // the stand tile is the one whose floor is at or just under the feet (a
    // cave's drawn surface can lift her more than a tile above it)
    const f0 = Math.floor((feet + 2) / TL) - 1;
    let best = -1, bs = 60;
    for (const ty of [f0 - 1, f0, f0 + 1, f0 + 2]) {
      for (const dx of [0, -1, 1]) {
        const k = M.idx.get((tx + dx) + ',' + ty);
        if (k == null) continue;
        // the stand tile whose (drawn) floor is nearest her feet, her own column first
        const sc = Math.abs(nodeFeet(M, M.nodes[k], cx) - feet) + (dx ? 18 : 0);
        if (sc < bs) { bs = sc; best = k; }
      }
    }
    return best;
  };
  buildEdges(M);
  return M;
}
// one physics step of the hero, as js/entities.js has it
function simStep(M, s, dir, jumpEdge, jumpHeld) {
  if (dir) {
    const turn = Math.sign(s.vx) === -dir ? 1.6 : 1;
    s.vx = clamp(s.vx + dir * 3000 * turn * DT, -340, 340);
  } else { const sg = Math.sign(s.vx); s.vx -= sg * 2900 * DT; if (Math.sign(s.vx) !== sg) s.vx = 0; }
  let grav = s.vy < 0 ? 2150 : 3050;
  if (!s.on && Math.abs(s.vy) < 150) grav *= 0.55;
  s.vy = Math.min(s.vy + grav * DT, 1020);
  if (jumpEdge) s.jb = 0.12;
  if (s.jb > 0) { if (s.on || s.coy > 0) { s.vy = -905;  /* 920 in the game; planned a little short so a marginal ledge is not chosen */ s.on = false; s.coy = 0; s.jb = 0; s.jumped = true; } else s.jb -= DT; }
  if (!jumpHeld && s.vy < -280) s.vy = -280;
  // moveEnt, x then y
  s.x += s.vx * DT;
  const t0 = Math.floor(s.y / TL), t1 = Math.floor((s.y + PH - 1) / TL);
  if (s.vx > 0) { const tx = Math.floor((s.x + PW) / TL); for (let ty = t0; ty <= t1; ty++) if (M.solid(tx, ty)) { s.x = tx * TL - PW - 0.01; s.vx = 0; break; } }
  else if (s.vx < 0) { const tx = Math.floor(s.x / TL); for (let ty = t0; ty <= t1; ty++) if (M.solid(tx, ty)) { s.x = (tx + 1) * TL + 0.01; s.vx = 0; break; } }
  const prevB = s.y + PH;
  s.y += s.vy * DT;
  const x0 = Math.floor(s.x / TL), x1 = Math.floor((s.x + PW - 1) / TL);
  let d = false;
  if (s.vy >= 0) {
    const ty = Math.floor((s.y + PH) / TL);
    for (let tx = x0; tx <= x1; tx++) { const c = M.at(tx, ty); if (SOLID(c) || (c === '=' && prevB <= ty * TL + 1)) { s.y = ty * TL - PH - 0.01; s.vy = 0; d = true; break; } }
  } else {
    const ty = Math.floor(s.y / TL);
    let bonk = false;
    for (let tx = x0; tx <= x1; tx++) if (M.solid(tx, ty)) { bonk = true; break; }
    if (bonk) {
      const clearAt = nx => { const a0 = Math.floor(nx / TL), a1 = Math.floor((nx + PW - 1) / TL); for (let tx = a0; tx <= a1; tx++) if (M.solid(tx, ty)) return false; return true; };
      const dxR = (Math.floor(s.x / TL) + 1) * TL + 0.01 - s.x, dxL = s.x + PW - Math.floor((s.x + PW - 1) / TL) * TL + 0.01;
      if (dxR > 0 && dxR <= 8 && clearAt(s.x + dxR)) { s.x += dxR; bonk = false; }
      else if (dxL > 0 && dxL <= 8 && clearAt(s.x - dxL)) { s.x -= dxL; bonk = false; }
    }
    if (bonk) { s.y = (ty + 1) * TL + 0.01; s.vy = 0; }
  }
  // THE HEIGHTFIELD, exactly as moveEnt applies it
  const hf = M.info.hf;
  if (hf && s.vy >= 0) {
    const i = Math.min(hf.n - 1, Math.max(0, Math.round((s.x + PW / 2) / hf.step)));
    const gy = hf.y[i], gTop = hf.t[i];
    if (gy != null && gTop != null && gy < gTop) {
      const feet = s.y + PH;
      if (feet > gy - 0.5 && feet <= gTop + 1.5) { s.y = gy - PH - 0.01; s.vy = 0; d = true; }
      else if (s.on && feet <= gy && gy - feet <= 10 + Math.abs(s.vx) * DT * 1.6) { s.y = gy - PH - 0.01; s.vy = 0; d = true; }
    }
  }
  if (d) { s.on = true; s.coy = 0.1; } else { s.on = false; s.coy -= DT; }
  // spikes, as onSpike reads them
  const sx0 = Math.floor((s.x + 5) / TL), sx1 = Math.floor((s.x + PW - 5) / TL);
  const sy0 = Math.floor((s.y + 6) / TL), sy1 = Math.floor((s.y + PH - 2) / TL);
  for (let ty = sy0; ty <= sy1; ty++) for (let tx = sx0; tx <= sx1; tx++) if (SPIKE(M.at(tx, ty))) s.spike = true;
}
// prog: { dir, hold (s of jump held; 0 = no jump), d0, d1 (window dir is held), vx0 }
function simulate(M, start, prog, maxT = 3) {
  const s = { x: start.x, y: start.y, vx: start.vx, vy: start.vy || 0, on: start.on !== false, coy: start.on !== false ? 0.1 : 0, jb: 0 };
  let t = 0, air = false;
  for (let i = 0; i < maxT / DT; i++) {
    const dir = (t >= prog.d0 && t < prog.d1) ? prog.dir : 0;
    simStep(M, s, dir, i === 0 && prog.hold > 0, prog.hold > 0 && t < prog.hold);
    t += DT;
    if (s.spike) return { fail: 'spike', t };
    const cx = s.x + PW / 2;
    if (cx < -2 && M.info.exits.L) return { exit: 'L', t };
    if (cx > M.W + 2 && M.info.exits.R) return { exit: 'R', t };
    if (s.y + PH < -2 && M.info.exits.T) {
      const gap = M.info.tGap;
      if (!gap || (cx >= gap[0] * TL - 8 && cx <= (gap[1] + 1) * TL + 8)) return { exit: 'T', t };
    }
    if (s.y > M.H + 40) return M.info.exits.B ? { exit: 'B', t } : { fail: 'pit', t };
    if (!s.on) air = true;
    if (air && s.on) {
      const k = M.cellOf(s.x, s.y);
      return k < 0 ? { fail: 'edge', t, x: s.x, y: s.y } : { node: k, t, x: s.x, y: s.y };
    }
    if (!air && prog.hold === 0 && t > 0.6) return { fail: 'noair', t };
  }
  return { fail: 'time', t };
}
const PROGS = [];
for (const dir of [-1, 1]) for (const hold of [0.12, 0.2, 0.3, 2]) for (const run of [0, 1])
  for (const [d0, d1] of [[0, 9], [0.18, 9], [0, 0.22], [0, 0.4]]) PROGS.push({ dir, hold, d0, d1, vx0: run ? dir * 340 : 0 });
for (const hold of [0.12, 2]) PROGS.push({ dir: 0, hold, d0: 0, d1: 0, vx0: 0 });
const WALKOFF = [];
for (const dir of [-1, 1]) for (const d1 of [0.05, 0.15, 0.3, 9]) WALKOFF.push({ dir, hold: 0, d0: 0, d1, vx0: dir * 340, walkoff: 1 });
// where her feet rest on a stand tile at world column cx (the drawn curve may lift them)
function nodeFeet(M, n, cx) {
  let feet = (n.y + 1) * TL;
  const hf = M.info.hf;
  if (hf) {
    const i = Math.min(hf.n - 1, Math.max(0, Math.round(cx / hf.step)));
    if (hf.y[i] != null && hf.t[i] != null && Math.abs(hf.t[i] - feet) < 2 && hf.y[i] < feet) feet = hf.y[i];
  }
  return feet;
}
function nodeStart(M, n, vx) {
  const x = n.x * TL + (TL - PW) / 2;
  return { x, y: nodeFeet(M, n, x + PW / 2) - PH - 0.01, vx, vy: 0, on: true };
}
function buildEdges(M) {
  const E = M.edges = M.nodes.map(() => []);
  M.nodes.forEach((n, i) => {
    for (const dir of [-1, 1]) {
      const k = M.idx.get((n.x + dir) + ',' + n.y);
      if (k != null) E[i].push({ to: k, cost: TL / 340, walk: dir });
      else if (n.x + dir < 0 && M.info.exits.L && dir < 0) E[i].push({ exit: 'L', cost: 0.2, walk: -1 });
      else if (n.x + dir >= M.w && M.info.exits.R && dir > 0) E[i].push({ exit: 'R', cost: 0.2, walk: 1 });
    }
    const seen = new Set();
    const add = (prog, r) => {
      if (r.fail) return;
      const key = r.exit ? 'X' + r.exit : r.node;
      if (r.node === i) return;
      const cost = r.t + (prog.hold ? (prog.hold >= 2 ? 0.15 : 0.35) : 0.05) + (prog.vx0 ? 0.1 : 0);
      const prev = E[i].find(e => (e.exit ? 'X' + e.exit : e.to) === key);
      if (prev && prev.cost <= cost) return;
      if (prev && prev.walk) return;
      if (prev) E[i].splice(E[i].indexOf(prev), 1);
      E[i].push(r.exit ? { exit: r.exit, cost, prog } : { to: r.node, cost, prog });
      seen.add(key);
    };
    for (const p of WALKOFF) {
      const ahead = M.idx.get((n.x + p.dir) + ',' + n.y);
      if (ahead != null) continue;
      add(p, simulate(M, nodeStart(M, n, p.vx0), p));
    }
    for (const p of PROGS) {
      if (p.vx0) { const back = M.idx.get((n.x - p.dir) + ',' + n.y); if (back == null) continue; }
      add(p, simulate(M, nodeStart(M, n, p.vx0), p));
    }
  });
}
// distances TO the goal set (reverse Dijkstra). goal: { exit } | { test(node) }
function distTo(M, goal) {
  const D = new Float64Array(M.nodes.length).fill(Infinity);
  const rev = M.nodes.map(() => []);
  const pq = [];
  M.edges.forEach((es, i) => es.forEach(e => {
    const pen = (M.pen && M.pen.get(i + '>' + (e.exit || e.to))) || 0;
    if (e.exit) { if (goal.exit === e.exit) { const c = e.cost + pen; if (c < D[i]) { D[i] = c; pq.push(i); } } }
    else rev[e.to].push({ from: i, cost: e.cost + pen });
  }));
  if (goal.test) M.nodes.forEach((n, i) => { if (goal.test(n)) { D[i] = 0; pq.push(i); } });
  // simple Dijkstra with a sorted frontier (rooms are small)
  const done = new Uint8Array(M.nodes.length);
  while (pq.length) {
    let bi = 0; for (let k = 1; k < pq.length; k++) if (D[pq[k]] < D[pq[bi]]) bi = k;
    const u = pq.splice(bi, 1)[0];
    if (done[u]) continue; done[u] = 1;
    for (const r of rev[u]) { const nd = D[u] + r.cost; if (nd < D[r.from]) { D[r.from] = nd; pq.push(r.from); } }
  }
  return D;
}

// ===========================================================================
// THE PLAYER'S HANDS: the only way this file touches the game.
// ===========================================================================
let page = null;
const HELD = new Set();
async function hold(keyList) {
  const want = new Set(keyList.filter(Boolean));
  for (const k of [...HELD]) if (!want.has(k)) { HELD.delete(k); await page.keyboard.up(k); }
  for (const k of want) if (!HELD.has(k)) { HELD.add(k); await page.keyboard.down(k); }
}
async function tap(key, ms = 60) {
  if (HELD.has(key)) { HELD.delete(key); await page.keyboard.up(key); }
  // a direction is read as HELD during a frame (inD), so a tap shorter than a
  // frame is a press the game never sees; edges (attack, interact) are kept
  if (/^Arrow/.test(key)) ms = Math.max(ms, Math.round(FRAME_S * 1000 * 1.6));
  await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key);
}

// ===========================================================================
// THE BOT'S EYES: one read of what is on screen. Read-only — nothing here
// assigns to the game.
// ===========================================================================
async function snap() {
  return page.evaluate(() => {
    const f = (G.save && G.save.flags) || {};
    const st = G.tut && !f.tut && typeof TUT_STEPS !== 'undefined' && TUT_STEPS[G.tut.i];
    let tp = null;
    try { tp = st && G.state === 'PLAY' && !G.dialog ? tutPrompt(st) : null; } catch (e) { tp = null; }
    const P = typeof player !== 'undefined' && player;
    const en = (G.enemies || []).filter(e => e && !e.dead).map(e => ({ k: e.kind || (e.constructor && e.constructor.name), x: Math.round(e.x), y: Math.round(e.y), w: e.w, h: e.h, hp: e.hp, mech: e.mechanism || null,
      calm: !!(e.tame || e.friendly || e.freed || e.calm || e.disabled || e.ally), st: e.st || e.state || null, wt: e.windT || 0,
      sg: e.kind === 'sage' ? { coil: e.coilT || 0, lunge: e.lungeT || 0, winded: e.windedT || 0, gather: e.gatherT || 0, ring: e.ringR == null ? null : e.ringR, locked: !!e.locked, tame: !!e.tame, pure: e.pureM || 0, vx: e.vx || 0 } : null }));
    const projs = (G.projs || []).filter(q => q && !q.dead && !q.friendly).slice(0, 24).map(q => ({ x: Math.round(q.x), y: Math.round(q.y), vx: Math.round(q.vx || 0), vy: Math.round(q.vy || 0) }));
    const B = G.boss;
    let goal = null; try { goal = typeof opGoalKey === 'function' && opGoalKey() ? ctlFill(t(opGoalKey())) : null; } catch (e) { }
    let doors = [];
    try { doors = (typeof gateDoors === 'function' ? gateDoors() : []).map(d => ({ to: d.to, wx: gateWorldX(d), buried: !!(typeof rubbleFor === 'function' && rubbleFor(d)), style: d.style || null })); } catch (e) { }
    const rub = (G.rubbles || []).filter(r => r.hp > 0).map(r => { let b = null; try { b = rubbleBox(r); } catch (e) { } return { flag: r.flag, hp: r.hp, x: b && b.x, w: b && b.w, y: b && b.y, h: b && b.h }; });
    return {
      t: Date.now(), sim: G.simClock || 0, state: G.state, room: G.roomId,
      w: G.roomDef ? G.roomDef.w : 0, h: G.grid ? G.grid.length : 0,
      menu: G.state === 'MENU' && typeof menuOptions === 'function' ? { opts: menuOptions(), i: G.menuIdx } : null,
      diffIdx: G.diffIdx,
      p: P ? { x: P.x, y: P.y, vx: P.vx, vy: P.vy, on: !!P.on, face: P.face, cores: P.cores, max: P.maxCores ? P.maxCores() : 0, volts: P.volts, dead: !!P.dead, iT: P.iT || 0,
        healT: P.healT || 0, chargeT: P.chargeT || 0, swing: !!P.swing, stun: P.stunT || 0, dashCD: P.dashCD || 0 } : null,
      flags: Object.keys(f).filter(k => f[k]), bag: Object.keys((G.save && G.save.bag) || {}).filter(k => G.save.bag[k]),
      items: (G.save && G.save.items) || {}, scrap: G.save ? G.save.scrap : 0, iq: G.save ? G.save.iq | 0 : 0,
      bench: G.save && G.save.bench ? G.save.bench.room : null, deaths: G.save ? G.save.deaths | 0 : 0,
      weapon: typeof weaponMode === 'function' && G.save ? weaponMode() : null,
      canHeal: typeof healUnlocked === 'function' && G.save ? healUnlocked() : false,
      canBurst: typeof burstUnlocked === 'function' && G.save ? burstUnlocked() : false,
      burstVolts: typeof BURST_VOLTS === 'number' ? BURST_VOLTS : 66, healCost: P && P.healCost ? P.healCost() : 33,
      dialog: G.dialog ? { name: G.dialog.name || '', line: G.dialog.lines[G.dialog.i] || '', i: G.dialog.i, n: G.dialog.lines.length, art: G.dialog.art || null, demo: G.dialog.demo || null } : null,
      tut: st ? { id: st.id, i: G.tut.i, hold: G.tut.hold || 0, action: tp && tp.action, tx: tp && tp.target && tp.target.x, hint: tp ? ctlFill(t(tp.hint)) : '', label: tp && tp.label ? t(tp.label) : '' } : null,
      goal, toasts: (G.toasts || []).map(q => q.text),
      near: G.near ? { type: G.near.type, extra: G.near.extra || null } : null,
      en, boss: B ? { k: B.kind, x: Math.round(B.x), y: Math.round(B.y), w: B.w, h: B.h, hp: B.hp, max: B.maxHp || B.hp0 || null, st: B.st, dead: !!B.dead, tame: !!B.tame, meet: !!B.meet, face: B.face, t: B.t, wind: B.windT || 0, cx: B.cx ? B.cx() : B.x + B.w / 2, cy: B.cy ? B.cy() : B.y + B.h / 2, vx: B.vx || 0, vy: B.vy || 0, on: !!B.on, purified: !!(B.purified || B.freed) } : null, projs,
      doors, rub,
      busy: { trans: !!G.trans, gate: !!G.gateWalk, wake: !!G.wake, cut: !!G.cut, entry: !!G.bossEntry, meet: G.meet ? { ph: G.meet.ph, inter: !!G.meet.interactive } : null, brk: G.break ? G.break.ph || 1 : null, rech: !!G.recharge, finish: !!G.finish, hitStop: G.hitStop || 0 },
      panels: G.state === 'PANELS',
      lesson: G.lesson && !(G.lesson.hold > 0) ? G.lesson.id : null,
      pan: G.state === 'PANELS' && G.panels && G.panels.seq ? { id: G.panels.seq.id, i: G.panels.i, n: (G.panels.list || []).length } : null,
      repair: G.state === 'REPAIR' ? (() => { const r = document.getElementById('ratchet-repair'); const a = document.activeElement; return { hint: (r && r.querySelector('#repair-hint') || {}).textContent || '', prog: (r && r.querySelector('.repair-progress') || {}).textContent || '', focus: a && a.dataset ? (a.dataset.piece ? 'piece:' + a.dataset.piece : a.dataset.target ? 'target:' + a.dataset.target : a.classList.contains('repair-power') ? 'power' : (a.textContent || '').slice(0, 20)) : null, focusLabel: a ? (a.getAttribute('aria-label') || a.textContent || '') : '', targets: r ? [...r.querySelectorAll('[data-target]')].map(b => ({ name: b.dataset.target, label: b.getAttribute('aria-label') || b.textContent || '' })) : [], selected: !!(r && r.querySelector('.selected')) }; })() : null,
      trial: G.state === 'TRIAL' && typeof TRI !== 'undefined' ? { game: TRI.game, phase: TRI.memPhase, seq: TRI.memSeq ? TRI.memSeq.slice() : null, st: TRI.st } : null,
      shop: G.state === 'SHOP' && typeof SHOP !== 'undefined' ? { idx: G.shopIdx, n: SHOP.length, type: SHOP[G.shopIdx] && SHOP[G.shopIdx].type } : null,
    };
  });
}
async function roomInfo() {
  return page.evaluate(() => {
    const w = G.roomDef.w, h = G.grid.length, rows = [];
    for (let y = 0; y < h; y++) { let r = ''; for (let x = 0; x < w; x++) r += (tileAt(x, y) || '.'); rows.push(r); }
    const ex = G.roomDef.exits || {}, exits = {};
    for (const k of ['L', 'R', 'T', 'B']) if (ex[k]) exits[k] = typeof ex[k] === 'object' ? { to: ex[k].to, open: typeof exitOpen === 'function' ? !!exitOpen(ex[k]) : true } : { to: ex[k], open: true };
    const statics = (G.statics || []).map(q => ({ type: q.type, extra: q.extra || null, x: q.x, y: q.y, w: q.w, h: q.h, opened: !!q.opened }));
    // the drawn surface she really stands on (js/game.js groundColumnAt)
    let hf = null;
    try { const cur = typeof surfaceCurve === 'function' ? surfaceCurve() : null; if (cur) hf = { step: SURF_STEP, n: cur.N, y: Array.from(cur.y, v => isNaN(v) ? null : v), t: Array.from(cur.raw, v => isNaN(v) ? null : v) }; } catch (e) { }
    return { id: G.roomId, w, h, rows, exits, tGap: G.grid.tGap || null, statics, sky: !!G.roomDef.sky, hf };
  });
}
// THE MAP: room adjacency, as the map screen knows it (ROOMS exits + doors)
async function worldGraph() {
  return page.evaluate(() => {
    const out = {};
    for (const id of Object.keys(ROOMS)) {
      const d = ROOMS[id], ex = d.exits || {}, links = [];
      for (const k of ['L', 'R', 'T', 'B']) if (ex[k]) links.push({ via: k, to: typeof ex[k] === 'object' ? ex[k].to : ex[k], flag: typeof ex[k] === 'object' ? (ex[k].flag || null) : null, or: typeof ex[k] === 'object' ? (ex[k].or || null) : null });
      let ds = []; try { ds = gateDoorsAll(id); } catch (e) { }
      for (const g of ds) links.push({ via: 'door', to: g.to, need: g.need || null, at: g.at });
      out[id] = links;
    }
    return out;
  });
}

// ===========================================================================
// THE RUN
// ===========================================================================
const R = { deaths: 0, rooms: [], interactions: [], defects: [], missions: [] };
let S = null, prevS = null;
let model = null, modelKey = '', info = null;
let lastGoal = null, lastChip = null, lastToasts = '', lastDialog = '', lastRoom = null, lastState = null;
let flagsSeen = new Set();

function diffLog(s) {
  if (s.room !== lastRoom) { log('ROOM ' + (lastRoom || '-') + ' -> ' + s.room + (s.p ? '  at x=' + Math.round(s.p.x) : '')); R.rooms.push(s.room); lastRoom = s.room; }
  if (s.state !== lastState) { log('STATE ' + lastState + ' -> ' + s.state); lastState = s.state; }
  if (s.pan && (s.pan.id + s.pan.i) !== R.lastPan) { R.lastPan = s.pan.id + s.pan.i; log('MANHWA ' + s.pan.id + ' panel ' + (s.pan.i + 1) + '/' + s.pan.n); R.pansSeen = R.pansSeen || new Set(); R.pansSeen.add(s.pan.id); if (s.pan.id === 'ch2' || /teaser/.test(s.pan.id)) R.teaserSeen = 1; }
  if (s.goal !== lastGoal) { log('OBJECTIVE "' + s.goal + '"'); lastGoal = s.goal; }
  const chip = s.tut ? s.tut.id + ' | ' + (s.tut.label || '') + ' | ' + (s.tut.hint || '') : null;
  if (chip !== lastChip) { log('CHIP ' + (chip || '(none)')); lastChip = chip; }
  const tt = s.toasts.join(' / ');
  if (tt && tt !== lastToasts) log('TOAST ' + tt);
  lastToasts = tt;
  for (const f of s.flags) if (!flagsSeen.has(f)) { if (flagsSeen.size || !SEGMENT) log('FLAG +' + f); flagsSeen.add(f); }
  if (s.dialog) {
    const dk = s.dialog.name + '|' + s.dialog.i + '|' + s.dialog.line;
    if (dk !== lastDialog) { log('SAY ' + (s.dialog.name ? s.dialog.name + ': ' : '') + JSON.stringify(s.dialog.line) + (s.dialog.art ? ' [card ' + s.dialog.art + ']' : '')); lastDialog = dk; }
  }
  if (prevS && prevS.p && s.p && s.deaths > prevS.deaths) { R.deaths++; log('DEATH #' + R.deaths + ' in ' + s.room + ' (save deaths ' + s.deaths + ')'); }
  if (prevS && prevS.p && s.p && s.p.cores < prevS.p.cores && prevS.room === s.room) {
    const px = s.p.x + 12, py = s.p.y + 18;
    const near = s.en.concat(s.boss ? [{ k: s.boss.k, x: s.boss.x, y: s.boss.y, w: s.boss.w, h: s.boss.h, st: s.boss.st }] : []).map(e => ({ e, d: Math.hypot(e.x + e.w / 2 - px, e.y + e.h / 2 - py) })).sort((a, b) => a.d - b.d)[0];
    const pj = s.projs.map(q => Math.hypot(q.x - px, q.y - py)).sort((a, b) => a - b)[0];
    log('HURT ' + prevS.p.cores + ' -> ' + s.p.cores + ' in ' + s.room + (near ? ' (nearest ' + near.e.k + (near.e.st ? '/' + near.e.st : '') + ' at ' + Math.round(near.d) + ' px)' : '') + (pj != null && pj < 60 ? ' (a shot ' + Math.round(pj) + ' px away)' : ''));
  }
  if (prevS && prevS.scrap !== s.scrap) log('SCRAP ' + prevS.scrap + ' -> ' + s.scrap);
  if (prevS && JSON.stringify(prevS.items) !== JSON.stringify(s.items)) log('ITEMS ' + JSON.stringify(s.items));
  if (prevS && prevS.bag.join() !== s.bag.join()) log('BAG ' + s.bag.join(','));
  if (prevS && prevS.bench !== s.bench) log('SAVEPOINT ' + prevS.bench + ' -> ' + s.bench);
  if (prevS && prevS.weapon !== s.weapon) log('WEAPON ' + prevS.weapon + ' -> ' + s.weapon);
}

let frameN = 0;
async function frame(name) {
  const f = path.join(OUT, 'frames', String(frameN++).padStart(3, '0') + '-' + name + '.png');
  try { await page.screenshot({ path: f }); log('FRAME ' + path.basename(f)); } catch (e) { }
}

// ---------------- menus and readers ----------------
let lastPress = 0;
async function readerPress(key = 'KeyE') {
  // a reader's pace (js/overlay.js): a press inside 0.22 s of the last is a mash
  // (and a human one: about 0.6 s between presses, so the video can be read too)
  if (Date.now() - lastPress < (+process.env.CAMPAIGN_READ_MS || 600)) return;
  lastPress = Date.now();
  await tap(key, 50);
}
async function handleMenus(s) {
  if (s.state === 'MENU') {
    await hold([]);
    const want = SEGMENT ? 'continue' : 'newgame';
    const i = s.menu.opts.indexOf(want);
    if (i < 0) { log('MENU has no ' + want + ': ' + s.menu.opts.join(',')); await sleep(500); return true; }
    if (s.menu.i !== i) { await tap('ArrowDown'); await sleep(150); return true; }
    log('MENU choose "' + want + '"'); await tap('Enter'); await sleep(400); return true;
  }
  if (s.state === 'CUT' || s.state === 'CINE') {
    await hold([]);
    // CAMPAIGN_SKIPFILM=1: the player's own skip (Escape) for quick dev runs
    if (process.env.CAMPAIGN_SKIPFILM === '1' && !R.filmSkipLogged) { R.filmSkipLogged = 1; log('FILM skipped with Escape (player option)'); await tap('Escape'); await sleep(300); return true; }
    await readerPress('Enter'); await sleep(120); return true;
  }
  if (s.state === 'DIFF') {
    await hold([]);
    if (s.diffIdx !== DIFF) { await tap(s.diffIdx > DIFF ? 'ArrowUp' : 'ArrowDown'); await sleep(200); return true; }
    log('DIFFICULTY row ' + DIFF + ' chosen through the menu' + (DIFF === 0 ? ' (the easiest preset — disclosed assist)' : ''));
    await frame('difficulty');
    await tap('Enter'); await sleep(500); return true;
  }
  if (s.state === 'WHO') { await tap('Enter'); await sleep(300); return true; }
  if (s.state === 'DIALOG') { await hold([]); await readerPress('KeyE'); await sleep(60); return true; }
  if (s.state === 'PANELS') { await hold([]); await readerPress('Enter'); await sleep(80); return true; }
  if (s.state === 'COMICS') { await hold([]); await tap('Escape'); await sleep(200); return true; }
  if (s.state === 'OFFER') { await hold([]); log('OFFER on screen'); await readerPress('Enter'); await sleep(200); return true; }
  if (s.state === 'DEAD') { await hold([]); await sleep(150); return true; }
  if (s.state === 'GAMEOVER') { log('GAME OVER screen'); throw new Error('game over'); }
  if (s.state === 'PAUSE' || s.state === 'MAP' || s.state === 'BAG') { log('closing ' + s.state); await tap('Escape'); await sleep(250); return true; }
  if (s.state === 'REPAIR') { await doRepair(s); return true; }
  if (s.state === 'SHOP') { await doShop(s); return true; }
  if (s.state === 'TRIAL') { await doTrial(s); return true; }
  return false;
}
// THE REPAIR BOARD, BY KEYBOARD. Focus starts on the piece the board wants; the
// hint names where it goes. Arrows move focus, Enter takes and places.
let repairTried = new Set();
async function doRepair(s) {
  await hold([]);
  const r = s.repair;
  if (!R.repairShot) { R.repairShot = 1; await frame('repair-board'); log('REPAIR board: "' + r.hint + '" ' + r.prog + ' focus=' + r.focus); }
  if (r.focus === 'power') { log('REPAIR power'); await tap('Enter'); await sleep(600); return; }
  if (r.focus && r.focus.startsWith('piece:') && !r.selected) { log('REPAIR take ' + r.focus + ' ("' + r.hint + '")'); await tap('Enter'); await sleep(250); return; }
  if (r.selected) {
    // WHERE DOES IT GO? The hint names the target in the board's own words
    // ("...to the + terminal"); the labels are all on screen. A full label in
    // the hint wins; otherwise the one label word no other target shares.
    if (!/try|wrong|again/i.test(r.hint)) R.repairHint = r.hint;
    const hint = (R.repairHint || r.hint || '').toLowerCase();
    const labs = r.targets.map(q => ({ name: q.name, lab: q.label.toLowerCase().trim() }));
    let want = labs.find(q => q.lab && hint.includes(q.lab));
    if (!want) {
      const words = q => q.lab.split(/\s+/).filter(w => w.length > 2);
      want = labs.find(q => words(q).some(w => hint.includes(w) && !labs.some(o => o !== q && words(o).includes(w))));
    }
    const wantFocus = want ? 'target:' + want.name : null;
    if (wantFocus && r.focus === wantFocus) { log('REPAIR place on ' + r.focus + ' (the hint names "' + want.lab + '")'); await tap('Enter'); await sleep(300); return; }
    if (!wantFocus && r.focus && r.focus.startsWith('target:') && !repairTried.has(r.prog + '|' + r.focus)) {
      repairTried.add(r.prog + '|' + r.focus); log('REPAIR the hint names no label; trying ' + r.focus); await tap('Enter'); await sleep(300); return;
    }
    await tap('ArrowRight'); await sleep(120); return;
  }
  await tap('ArrowRight'); await sleep(120);
}
async function doShop(s) {
  await hold([]);
  if (!R.shopShot) { R.shopShot = 1; await sleep(400); await frame('counter'); }
  if (s.flags.includes('heal')) { log('SHOP leave'); await tap('Escape'); await sleep(300); return; }
  if (s.shop.type !== 'cell') { await tap('ArrowDown'); await sleep(200); return; }
  log('SHOP buy the marked row (' + s.shop.type + ') with ' + s.scrap + ' scrap'); await tap('Enter'); await sleep(400);
}
async function doTrial(s) {
  await hold([]);
  const tr = s.trial;
  if (tr && tr.game === 'mem' && tr.phase === 'input' && tr.st !== 'pre') {
    if (!R.trialShot) { R.trialShot = 1; await frame('monument-puzzle'); }
    log('PUZZLE memory: the monument played ' + tr.seq.length + ' notes; answering');
    const KEY = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'];
    for (const k of tr.seq) { await tap(KEY[k], 40); await sleep(110); }
    await sleep(400);
  } else if (tr && tr.game !== 'mem') { log('PUZZLE kind ' + tr.game + ' (no solver yet)'); await sleep(500); }
  else await sleep(120);
}

// ---------------- the opening: follow the chip ----------------
async function followChip(s) {
  const tt = s.tut;
  if (!tt) return false;
  if (tt.hold > 0 || s.busy.rech || s.busy.wake || s.busy.gate || s.busy.trans) { await hold([]); await sleep(80); return true; }
  const x = s.p.x + 12;
  const a = tt.action;
  if (a === 'MOVE' || !a) {
    const right = ['out', 'go', 'move'].includes(tt.id) || tt.tx == null || tt.tx > x + 6;
    if (tt.tx != null && Math.abs(tt.tx - x) < 70 && !['out', 'go', 'move'].includes(tt.id)) {
      await hold([]); await tap(right ? 'ArrowRight' : 'ArrowLeft', 45); await sleep(150);
    } else { await hold([right ? 'ArrowRight' : 'ArrowLeft']); await sleep(70); }
    // a step in the road: the planner would see it, the chip does not say JUMP
    if (prevS && prevS.p && Math.abs(prevS.p.x - s.p.x) < 0.5 && s.p.on && HELD.size) { await tap('Space', 200); }
  } else if (a === 'JUMP') { await hold(['ArrowRight']); await tap('Space', 220); await sleep(80); }
  else if (a === 'UP') { await hold([]); await tap('ArrowUp', 80); await sleep(220); }
  else if (a === 'INT') { await hold([]); await tap('KeyE', 60); await sleep(220); }
  else if (a === 'ATK' && tt.id === 'burst') { await hold([]); log('BURST: holding attack'); await page.keyboard.down('KeyX'); await sleep(950); await page.keyboard.up('KeyX'); await sleep(400); }
  else if (a === 'ATK') { await hold([]); await tap('KeyX', 50); await sleep(260); }
  else if (a === 'HEAL') { await hold([]); log('HEAL: holding heal'); await page.keyboard.down('KeyF'); await sleep(1600); await page.keyboard.up('KeyF'); await sleep(200); }
  else { await hold([]); await sleep(90); }
  return true;
}

// ---------------- moving with the planner ----------------
let flight = null;       // the jump in the air: { prog, t0 }
let stall = { k: -1, since: 0, best: Infinity };
async function ensureModel() {
  const sig = await page.evaluate(() => G.roomId + '|' + Object.keys(G.save.broken || {}).length + '|' + (G.grid && G.grid.length));
  if (sig === modelKey && model) return;
  info = await roomInfo();
  // exits the room will actually let her through right now
  const exits = {};
  for (const k of Object.keys(info.exits)) if (info.exits[k].open) exits[k] = info.exits[k].to;
  const t0 = Date.now();
  model = roomModel({ ...info, exits });
  model.pen = new Map();
  modelKey = sig;
  log('PLAN room ' + info.id + ': ' + model.nodes.length + ' standable tiles, ' + model.edges.reduce((a, e) => a + e.length, 0) + ' moves (' + (Date.now() - t0) + ' ms)');
}
// goal: { exit:'L'|'R'|'T'|'B' } | { x, tol, y? }   (world px)
let curGoalKey = '', curD = null;
function goalTest(goal) {
  if (goal.exit) return { exit: goal.exit };
  return { test: n => Math.abs(n.x * TL + 16 - goal.x) <= Math.max(17, goal.tol || 20) && (goal.y == null || Math.abs((n.y + 1) * TL - goal.y) <= (goal.ytol || 48)) };
}
// one decision of the walker; returns 'arrived' | 'moving' | 'stuck'
async function walkTo(s, goal) {
  await ensureModel();
  const gk = modelKey + '|' + JSON.stringify(goal) + '|' + model.pen.size;
  if (gk !== curGoalKey) { curD = distTo(model, goalTest(goal)); if (gk.split('|')[0] !== curGoalKey.split('|')[0] || !curGoalKey.includes(JSON.stringify(goal))) stall = { k: -1, since: Date.now(), best: Infinity }; curGoalKey = gk; }
  const p = s.p;
  if (flight) {
    // GAME time, not wall time: on a slow machine the world runs below real
    // time (SIM_MAX), and a jump held for 0.3 wall seconds is held longer in it
    // (extrapolated between snapshots, which arrive about one slow frame late)
    const t = Math.max(s.sim - flight.t0, (Date.now() - flight.w0) / 1000 * RATE);
    const pr = flight.prog;
    // landed = seen in the air, then seen on the ground again (the first
    // snapshots after the press still show her standing: the press lands late)
    if (!p.on) flight.air = true;
    if (!flight.air && t > flight.lead + 0.45) { if (DEBUG) log("  jump never left the ground"); flight = null; }
    else if (flight.air && p.on) {
      const k = model.cellOf(p.x, p.y);
      if (flight.want != null && k !== flight.want && k >= 0) {
        if (DEBUG) log("  landed " + JSON.stringify(model.nodes[k]) + " wanted " + JSON.stringify(model.nodes[flight.want]) + " at x=" + Math.round(p.x) + " y=" + Math.round(p.y));
        const key = flight.from + '>' + flight.want;
        model.pen.set(key, (model.pen.get(key) || 0) + 0.6);
      }
      flight = null;
    } else if (t > 3.5) flight = null;
    else {
      // program time begins when the game sees the press (one lead later);
      // the run is let go as the sim says she touches down, so she does not
      // carry on off a narrow ledge while the next snapshot is on its way
      const tp = t - flight.lead;
      const dir = (tp >= pr.d0 && tp < pr.d1 && tp < flight.landT - flight.lead * 0.5) ? pr.dir : 0;
      await hold([dir < 0 ? 'ArrowLeft' : dir > 0 ? 'ArrowRight' : null, pr.hold > 0 && tp < pr.hold ? 'Space' : null]);
      return 'moving';
    }
  }
  if (goal.exit === undefined && Math.abs(p.x + 12 - goal.x) <= (goal.tol || 20) && (goal.y == null || Math.abs(p.y + PH - goal.y) <= (goal.ytol || 48)) && p.on) { await hold([]); return 'arrived'; }
  if (!p.on) { await hold(HELD.has('ArrowLeft') ? ['ArrowLeft'] : HELD.has('ArrowRight') ? ['ArrowRight'] : []); return 'moving'; }
  const cur = model.cellOf(p.x, p.y);
  if (cur < 0) { await hold([p.face > 0 ? 'ArrowRight' : 'ArrowLeft']); return 'moving'; }
  if (!goal.exit && curD[cur] === 0) {
    // on a goal tile: settle on the exact x
    const dx = goal.x - (p.x + 12);
    if (Math.abs(dx) <= (goal.tol || 20)) { await hold([]); return 'arrived'; }
    if (Math.abs(dx) < 48) { await hold([]); if (Math.abs(p.vx) < 30) await tap(dx > 0 ? 'ArrowRight' : 'ArrowLeft', 35); return 'moving'; }
    await hold([dx > 0 ? 'ArrowRight' : 'ArrowLeft']); return 'moving';
  }
  // stall watch: progress is the distance dropping
  if (curD[cur] < stall.best - 0.05) { stall.best = curD[cur]; stall.since = Date.now(); }
  if (Date.now() - stall.since > 9000) { stall.best = Infinity; stall.since = Date.now(); return 'stuck'; }
  let best = null, bc = Infinity;
  for (const e of model.edges[cur]) {
    const pen = model.pen.get(cur + '>' + (e.exit || e.to)) || 0;
    const c = e.cost + pen + (e.exit ? (goal.exit === e.exit ? 0 : Infinity) : curD[e.to]);
    if (c < bc) { bc = c; best = e; }
  }
  if (!best || !isFinite(bc)) return 'stuck';
  if (DEBUG && Date.now() - (R.dbgT || 0) > 1500) { R.dbgT = Date.now(); log("  at " + JSON.stringify(model.nodes[cur]) + " D=" + curD[cur].toFixed(2) + " next " + (best.walk ? "walk " + best.walk : (best.exit || JSON.stringify(model.nodes[best.to])) + " " + JSON.stringify(best.prog)) + " x=" + Math.round(p.x) + " y=" + Math.round(p.y)); }
  if (best.walk) {
    // follow the walk chain to where the next jump (or the goal) is, and slow
    // for it: at a dozen frames a second a held key overruns a 3-tile ledge
    let k = cur, steps = 0, endsInJump = false;
    while (steps++ < 60) {
      let nb = null, nc = Infinity;
      for (const e of model.edges[k]) { const pen = model.pen.get(k + '>' + (e.exit || e.to)) || 0; const c = e.cost + pen + (e.exit ? (goal.exit === e.exit ? 0 : Infinity) : curD[e.to]); if (c < nc) { nc = c; nb = e; } }
      if (!nb || !nb.walk || nb.exit || curD[k] === 0) {
        endsInJump = !!(nb && !nb.walk);
        // a RUNNING jump the same way is taken at speed: no slowing for it
        if (nb && nb.prog && nb.prog.vx0 && Math.sign(nb.prog.vx0) === best.walk) endsInJump = 'run';
        break;
      }
      k = nb.to;
    }
    const tx = model.nodes[k].x * TL + (TL - PW) / 2;
    const ddx = tx - p.x;
    const room2 = Math.abs(ddx), brake = (p.vx * p.vx) / (2 * 2900) + Math.abs(p.vx) * FRAME_S * RATE * 1.5;
    const ledge = !model.stand(model.nodes[k].x + Math.sign(ddx || best.walk), model.nodes[k].y);
    if (endsInJump === 'run' || !(endsInJump || ledge) || room2 > brake + 24) { await hold([best.walk < 0 ? 'ArrowLeft' : 'ArrowRight']); return 'moving'; }
    await hold([]);
    if (Math.abs(p.vx) < 40 && room2 > 6) await tap(ddx > 0 ? 'ArrowRight' : 'ArrowLeft', room2 > 20 ? 60 : 30);
    return 'moving';
  }
  const pr = best.prog;
  const n = model.nodes[cur];
  const x0 = n.x * TL + (TL - PW) / 2;
  // does the planned move work from where she ACTUALLY is?
  // THE KEYS LAND LATE: the snapshot is about a frame old and the press is
  // seen a frame later, so she keeps doing what she is doing for LEAD game
  // seconds before the jump begins. Predict that, then test the jump.
  const heldDir = HELD.has('ArrowRight') ? 1 : HELD.has('ArrowLeft') ? -1 : 0;
  const lead = clamp(1.5 * FRAME_S * RATE, 0.02, 0.2);
  const st0 = { x: p.x, y: p.y, vx: p.vx, vy: 0, on: true, coy: 0.1, jb: 0 };
  for (let tt = 0; tt < lead; tt += DT) simStep(model, st0, heldDir, false, false);
  const standing = !pr.vx0;
  const r = st0.on ? simulate(model, st0, pr) : { fail: 'air' };
  const okSpeed = standing ? Math.abs(p.vx) < 60 : p.vx * pr.dir > 240;
  const ok = okSpeed && (r.exit ? r.exit === best.exit : (r.node != null && (r.node === best.to || curD[r.node] < curD[cur] - 0.15)));
  if (ok) {
    flight = { prog: pr, t0: s.sim, w0: Date.now(), from: cur, want: best.exit ? null : best.to, lead, landT: r.exit ? 99 : r.t };
    if (DEBUG) log("  jump " + JSON.stringify(model.nodes[cur]) + " -> " + (best.exit || JSON.stringify(model.nodes[best.to])) + " prog " + JSON.stringify(pr) + " from x=" + Math.round(p.x) + " y=" + Math.round(p.y) + " vx=" + Math.round(p.vx));
    const dir = pr.dir && pr.d0 === 0 ? pr.dir : 0;
    // a jump is an EDGE: a Space still held from the last landing must come up first
    if (pr.hold > 0 && HELD.has('Space')) { HELD.delete('Space'); await page.keyboard.up('Space'); await sleep(Math.round(FRAME_S * 1000 * 1.2)); }
    await hold([dir < 0 ? 'ArrowLeft' : dir > 0 ? 'ArrowRight' : null, pr.hold > 0 ? 'Space' : null]);
    return 'moving';
  }
  if (pr.vx0) {
    // a running jump: get behind the takeoff and run through it
    const rel = (p.x - x0) * pr.dir;
    if (rel > -24 || (flight === null && Math.abs(p.vx) < 200 && rel > -56)) { await hold([pr.dir > 0 ? 'ArrowLeft' : 'ArrowRight']); return 'moving'; }
    await hold([pr.dir > 0 ? 'ArrowRight' : 'ArrowLeft']); return 'moving';
  }
  // a standing jump: stop on the takeoff (any spot where the jump tests good will do)
  const dx = x0 - p.x;
  const brake = (p.vx * p.vx) / (2 * 2900) + Math.abs(p.vx) * FRAME_S * RATE;
  if (Math.abs(dx) > 40 && !(Math.sign(dx) === Math.sign(p.vx) && Math.abs(dx) < brake)) { await hold([dx > 0 ? 'ArrowRight' : 'ArrowLeft']); return 'moving'; }
  await hold([]);
  if (Math.abs(p.vx) > 30) return 'moving';
  if (Math.abs(dx) > 4) { await tap(dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.abs(dx) > 16 ? 60 : 30); await sleep(40); return 'moving'; }
  // aligned and it still does not land: the plan is wrong here; learn it
  const key = cur + '>' + (best.exit || best.to);
  model.pen.set(key, (model.pen.get(key) || 0) + 1);
  return 'moving';
}

// ---------------- the missions ----------------
// Each mission is a goal the objective line (or the story) has given her;
// done() reads the save; step() decides the next key.
let G_GRAPH = null;
function roomPath(from, to, flags) {
  const q = [[from]], seen = new Set([from]);
  while (q.length) {
    const pth = q.shift(), cur = pth[pth.length - 1];
    if (cur === to) return pth;
    for (const l of (G_GRAPH[cur] || [])) {
      if (l.need && !flags.includes(l.need)) continue;
      if (l.flag && !flags.includes(l.flag) && !(l.or || []).some(f => flags.includes(f))) continue;
      if (seen.has(l.to)) continue;
      seen.add(l.to); q.push(pth.concat([l.to]));
    }
  }
  return null;
}
// leave the current room toward `next`
async function leaveToward(s, next) {
  const links = (G_GRAPH[s.room] || []).filter(l => l.to === next);
  const door = links.find(l => l.via === 'door');
  const edge = links.find(l => l.via !== 'door');
  if (edge && (!door || true)) {
    await ensureModel();
    if (model.info.exits[edge.via]) {
      const r = await walkTo(s, { exit: edge.via });
      if (r === 'stuck') await unstick(s, 'exit ' + edge.via + ' toward ' + next);
      return;
    }
  }
  if (door) {
    const d = s.doors.find(q => q.to === next);
    if (!d) { log('door to ' + next + ' is not built here yet'); await sleep(300); return; }
    if (Math.abs(s.p.x + 12 - d.wx) <= 40 && s.p.on) {
      if (d.buried) { await strikeRubble(s, d); return; }
      await hold([]); log('DOOR up at ' + Math.round(d.wx) + ' -> ' + next); await tap('ArrowUp', 90); await sleep(400); return;
    }
    const r = await walkTo(s, { x: d.wx, tol: 30, y: (s.h - 2) * TL, ytol: 200 });
    if (r === 'stuck') await unstick(s, 'door to ' + next);
    return;
  }
  log('no way from ' + s.room + ' to ' + next); await sleep(500);
}
async function strikeRubble(s, d) {
  const rb = s.rub[0];
  if (!rb) { await tap('ArrowUp', 90); return; }
  const cx = rb.x + rb.w / 2, px = s.p.x + 12;
  const dir = cx > px ? 1 : -1;
  if (Math.abs(cx - px) > rb.w / 2 + 30) { await hold([dir > 0 ? 'ArrowRight' : 'ArrowLeft']); await sleep(60); return; }
  await hold([]);
  if (s.p.face !== dir) { await tap(dir > 0 ? 'ArrowRight' : 'ArrowLeft', 30); }
  log('RUBBLE strike (hp ' + rb.hp + ')');
  await tap('KeyX', 50); await sleep(300);
}
async function unstick(s, what) {
  log('STUCK trying to reach ' + what + ' in ' + s.room + ' at x=' + Math.round(s.p.x) + ',y=' + Math.round(s.p.y));
  R.stuck = (R.stuck || 0) + 1;
  await frame('stuck-' + s.room);
  await hold([]);
  await tap('Space', 300);
  await hold([Math.random() < 0.5 ? 'ArrowLeft' : 'ArrowRight']); await sleep(400); await hold([]);
}
async function goRoom(s, target) {
  if (s.room === target) return true;
  const pth = roomPath(s.room, target, s.flags);
  if (!pth) { log('no known path ' + s.room + ' -> ' + target); await sleep(1000); return false; }
  await leaveToward(s, pth[1]);
  return false;
}
async function talkTo(s, extra, why) {
  await ensureModel();
  const npc = info && info.statics.find(q => q.type === 'npc' && q.extra === extra);
  if (!npc) { log('no ' + extra + ' in ' + s.room); await sleep(400); return false; }
  if (s.near && s.near.extra === extra) {
    await hold([]); log('INTERACT ' + extra + (why ? ' (' + why + ')' : '')); R.interactions.push(s.room + ':' + extra);
    await tap('KeyE', 60); await sleep(350); return true;
  }
  const r = await walkTo(s, { x: npc.x + npc.w / 2, tol: 24, y: npc.y + npc.h, ytol: 60 });
  if (r === 'arrived') { await hold([]); await tap(npc.x + npc.w / 2 > s.p.x + 12 ? 'ArrowRight' : 'ArrowLeft', 40); await sleep(120); }
  return false;
}

// ---- combat: the few machines that stand in the road ----
function threat(s) {
  if (!s.p) return null;
  const px = s.p.x + 12, py = s.p.y + PH / 2;
  let best = null, bd = 1e9;
  for (const e of s.en) {
    if (e.calm || e.mech === 'winch' || e.k === 'sage') continue;
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
    const dx = Math.abs(ex - px), dy = Math.abs(ey - py);
    const reach = /crawler|hopper|wolf/.test(e.k) ? 200 : 150;
    if (dx < reach && dy < (e.k === 'flier' || e.k === 'bat' ? 140 : 80) && dx < bd) { bd = dx; best = e; }
  }
  return best;
}
async function fight(s, e) {
  const px = s.p.x + 12, ex = e.x + e.w / 2;
  const dir = ex > px ? 1 : -1;
  const dist = Math.abs(ex - px) - e.w / 2;
  // a wind-up (the amber tell) at close range: step out of it, come back after
  if ((e.wt > 0 || /warn/.test(e.st || '')) && dist < 90) { await hold([dir > 0 ? 'ArrowLeft' : 'ArrowRight']); await sleep(180); await hold([]); return; }
  if (!R.fightLog || R.fightLog.k !== e.k || Date.now() - R.fightLog.t > 4000) { R.fightLog = { k: e.k, t: Date.now() }; log('FIGHT ' + e.k + ' (hp ' + Math.round(e.hp) + ') in ' + s.room); }
  // something OVER her (a diving flier): jump and strike upward
  const ey = e.y + e.h / 2, py = s.p.y + PH / 2;
  if (ey < py - 22 && Math.abs(ex - px) < 80 && s.p.on) {
    await hold([dir > 0 ? 'ArrowRight' : 'ArrowLeft', 'Space', 'ArrowUp']); await sleep(Math.round(0.18 / Math.max(0.3, RATE) * 1000));
    await tap('KeyX', 40); await sleep(90); await tap('KeyX', 40); await hold([]); await sleep(120); return;
  }
  if (s.p.face !== dir) { await hold([dir > 0 ? 'ArrowRight' : 'ArrowLeft']); await sleep(30); }
  if (dist > 40) { if (pitAhead(s, dir)) { await hold([]); await sleep(60); return; } await hold([dir > 0 ? 'ArrowRight' : 'ArrowLeft']); await sleep(50); return; }
  await hold([]);
  await tap('KeyX', 40); await sleep(170);
}
async function maybeHeal(s) {
  if (!s.canHeal || !s.p) return false;
  // keep a burst in hand while the marble still has to be freed
  const reserve = (!s.bag.includes("cshard") && !s.flags.includes("crystal")) ? s.burstVolts : 0;
  // in a duel, mend only out of its reach or while it cannot act
  const sg = s.en.find(e => e.k === 'sage' && !e.sg.tame);
  if (sg && !(sg.sg.locked || sg.sg.winded > 0.4 || Math.abs(sg.x + sg.w / 2 - s.p.x - 12) > 220)) return false;
  if (s.boss && !s.boss.dead && Math.abs(s.boss.cx - s.p.x - 12) < 260 && !/rest|dorm|stagger/.test(s.boss.st || '')) return false;
  if ((s.p.cores <= 2 || (s.p.cores <= s.p.max - 3 && s.p.volts >= s.healCost + reserve)) && s.p.volts >= s.healCost && !threat(s) && s.p.on) {
    log('HEAL (cores ' + s.p.cores + '/' + s.p.max + ', volts ' + Math.round(s.p.volts) + ')');
    await hold([]); await page.keyboard.down('KeyF'); await sleep(1500); await page.keyboard.up('KeyF'); await sleep(150);
    return true;
  }
  return false;
}

const MISSIONS = [];
function mission(id, done, step) { MISSIONS.push({ id, done, step }); }
// 1. THE OPENING — the lesson chain, followed chip by chip
mission('opening', s => s.flags.includes('tut'), async s => {
  if (await followChip(s)) return;
  if (s.room === 'A0') { await walkTo(s, { exit: 'R' }); return; }
  await hold([]); await sleep(100);
});
// 2. OLD SERVO — the Power Cell from Ratchet wakes him; he offers the coil
mission('servo', s => s.flags.includes('servoMet'), async s => {
  if (s.room !== 'A1') { await goRoom(s, 'A1'); return; }
  await talkTo(s, 'servo', 'wake him with the spare Power Cell');
});
// 3. THE RAW MARBLE — under the meadow, through the hub's loose floor, the
// quarry's buried mouths, to the white pillar in CV3; claws glance, the burst frees it
mission('marble', s => s.bag.includes('cshard') || s.flags.includes('crystal'), async s => {
  // the quarry's own road: CV1 -> the pod chamber CV1B (it saves, recharges
  // and charts the quarry) -> CV2 -> CV3. A burst needs charge; the pod gives it.
  if (!s.flags.includes('pgSurvey') || (R.needCharge && s.p && s.p.volts < s.burstVolts)) {
    if (s.room !== 'CV1B') { await travel(s, 'CV1B'); return; }
    await restAt(s); if (s.p.volts >= s.burstVolts) R.needCharge = 0; return;
  }
  if (s.room === 'CV3') { await quarryPillar(s); return; }
  await travel(s, 'CV3');
});
// the pod/bench in this room: walk in, press E, wait out the rest
async function restAt(s) {
  await ensureModel();
  const b = info.statics.find(q => q.type === 'bench');
  if (!b) { log('no pod in ' + s.room); await sleep(400); return; }
  if (s.busy.rech) { await hold([]); await sleep(150); return; }
  if (s.near && s.near.type === 'bench') {
    if (Date.now() - (R.restT || 0) < 4000) { await hold([]); await sleep(200); return; }
    R.restT = Date.now();
    await hold([]); log('REST at the pod in ' + s.room + ' (cores ' + s.p.cores + '/' + s.p.max + ', volts ' + Math.round(s.p.volts) + ')');
    R.interactions.push(s.room + ':pod'); await tap('KeyE', 60); await sleep(600); return;
  }
  const r = await walkTo(s, { x: b.x + b.w / 2, tol: 14, y: b.y + b.h, ytol: 50 });
  if (r === 'stuck') await unstick(s, 'the pod in ' + s.room);
}
// 4. THE FORGE — carry it home; Ratchet shapes the Purifier
mission('forge', s => s.flags.includes('crystal'), async s => {
  if (s.room !== 'A0B') { await travel(s, 'A0B'); return; }
  await talkTo(s, 'ratchet', 'hand over the raw marble');
});
// 5. THE FIRST SAGE — the maintenance passage beside the quarry, GA1T, GA1D
// before a fight, a player low on cores tops up at the last pod on the way
// (the game says it: "This pod saves your progress and recharges you")
async function readyFor(s, pod, bossRoom) {
  if (s.room === bossRoom) { R.readied = null; return true; }
  if (R.readied === bossRoom) return true;
  // ready = the pod on the way is the save point (a death comes back here, not
  // three rooms away) and the cores are nearly full
  if (s.bench === pod && s.p.cores >= s.p.max - 1) { R.readied = bossRoom; return true; }
  if (!R.restLogged || R.restLogged !== bossRoom) { R.restLogged = bossRoom; log('READY: before ' + bossRoom + ' (cores ' + s.p.cores + '/' + s.p.max + ', save point ' + s.bench + ') — resting at the pod in ' + pod + ' first'); }
  if (s.room !== pod) { await travel(s, pod); return false; }
  await restAt(s);
  return false;
}
mission('sage', s => s.flags.includes('sageTame_GA1D'), async s => {
  if (!(await readyFor(s, 'CV1B', 'GA1D'))) return;
  if (s.room !== 'GA1D') { await travel(s, 'GA1D'); return; }
  await bossFight(s);
});
// 6. CHIME — the bell on the climb above the meadow (A8 -> A9)
mission('chime', s => s.flags.includes('bossChime'), async s => {
  // NULLFANG's break plays on the road (A2 west / A3 east): watch it, and its pages
  if (s.flags.includes('nfBreak') && (s.room === 'A2' || s.room === 'A3') && !(R.pansSeen && R.pansSeen.has('break'))) { await linger(s, 'break', 20000); return; }
  if (!(await readyFor(s, 'A3', 'A9'))) return;
  if (s.room !== 'A9') { await travel(s, 'A9'); return; }
  await bossFight(s);
});
// 7. NULLFANG — in his enclosure past the camp (A3 -> A4)
// a story beat's manhwa opens once the room is calm: a player stays to watch
async function linger(s, seqId, maxMs) {
  if (R.pansSeen && R.pansSeen.has(seqId)) return true;
  R.lingerT = R.lingerT || {};
  if (!R.lingerT[seqId]) { R.lingerT[seqId] = Date.now(); log('LINGER for the ' + seqId + ' panels in ' + s.room); }
  if (Date.now() - R.lingerT[seqId] > maxMs) { log('LINGER ' + seqId + ': the panels did not open within ' + Math.round(maxMs / 1000) + ' s'); R.pansSeen = R.pansSeen || new Set(); R.pansSeen.add(seqId); R.pansMissed = (R.pansMissed || []).concat([seqId]); return true; }
  const e = threat(s);
  if (e) { await fight(s, e); return false; }
  await hold([]); await sleep(150); return false;
}
mission('lion', s => s.flags.includes('bossGlitch') && (R.pansSeen && R.pansSeen.has('free') || s.room !== 'A4'), async s => {
  if (s.flags.includes('bossGlitch')) { await linger(s, 'free', 25000); return; }
  if (!(await readyFor(s, 'A3', 'A4'))) return;
  if (s.room !== 'A4') { await travel(s, 'A4'); return; }
  await bossFight(s);
});
// 8. THE CLIMB ABOVE THE CAMP — the chapter-two teaser
mission('teaser', s => (R.teaserSeen || (R.pansMissed || []).includes('ch2')) && s.state === 'PLAY', async s => {
  if (s.room !== 'A3') { await travel(s, 'A3'); return; }
  // the climb is the camp's ledges, tiles 17-29; up them until the story speaks
  const r = await walkTo(s, { x: 20.5 * TL, tol: 40, y: 6 * TL, ytol: 8 });
  if (r === 'stuck') await unstick(s, 'the climb above the camp');
  if (r === 'arrived') await linger(s, 'ch2', 40000);
});

// travel between rooms, with the few things on the road that are not walking
async function travel(s, target) {
  // a pod on the way is used when she is low: it saves and recharges
  if (s.p && s.p.cores <= 2 && !s.canHeal) { }
  const pth = roomPath(s.room, target, s.flags);
  if (!pth) { log('no known path ' + s.room + ' -> ' + target); await sleep(1000); return; }
  const next = pth[1];
  // THE LANDMARK: the hub's loose floor down to the quarry is broken from above
  if (s.room === 'A2' && next === 'A5') {
    await ensureModel();
    if (model.info.rows[15].slice(12, 15).includes('B') || model.info.rows[16].slice(12, 15).includes('B')) { await breakFloor(s, 12, 14); return; }
  }
  await leaveToward(s, next);
}
// a down-strike: over the tiles, jump, hold DOWN, strike on the way down
async function breakFloor(s, x0, x1) {
  const cx = (x0 + x1 + 1) / 2 * TL;
  const px = s.p.x + 12;
  if (!s.p.on) { await hold(['ArrowDown']); if (s.p.vy > 0) { await tap('KeyX', 40); } await sleep(40); return; }
  if (Math.abs(px - cx) > 14) { const r = await walkTo(s, { x: cx, tol: 12 }); if (r === 'stuck') await unstick(s, 'the loose floor'); return; }
  log('DOWN-STRIKE at the loose floor (tiles ' + x0 + '-' + x1 + ')');
  await hold([]);
  await page.keyboard.down('Space'); await sleep(260); await page.keyboard.up('Space');
  await page.keyboard.down('ArrowDown');
  for (let i = 0; i < 10; i++) { await sleep(70); await tap('KeyX', 40); }
  await page.keyboard.up('ArrowDown');
}
// the white pillar: claws glance off it (the game says so), the Volt Burst frees it
async function quarryPillar(s) {
  await ensureModel();
  const pil = info.statics.find(q => q.type === 'pillar');
  if (!pil) { log('no pillar in CV3'); await sleep(500); return; }
  const px = s.p.x + 12, cx = pil.x + pil.w / 2;
  const side = px < cx ? -1 : 1;
  const stand = cx + side * (pil.w / 2 + 22);
  if (Math.abs(px - stand) > 14 || !s.p.on) { const r = await walkTo(s, { x: stand, tol: 12, y: pil.y + pil.h, ytol: 40 }); if (r === 'stuck') await unstick(s, 'the marble pillar'); return; }
  await hold([]);
  if (s.p.face !== -side) await tap(side < 0 ? 'ArrowRight' : 'ArrowLeft', 30);
  if (!R.pillarClaw) { R.pillarClaw = 1; log('PILLAR: a plain strike first'); await tap('KeyX', 50); await sleep(500); await frame('pillar-claws'); return; }
  if (s.p.volts < s.burstVolts) { log('PILLAR: not enough charge for a burst (' + Math.round(s.p.volts) + '/' + s.burstVolts + ')'); R.needCharge = 1; await sleep(400); return; }
  log('PILLAR: Volt Burst (hold attack, release)');
  await page.keyboard.down('KeyX'); await sleep(1000); await page.keyboard.up('KeyX'); await sleep(700);
}

// ---- the fights that are the chapter's beats ----
// close the distance to a fighter: the planner when far (pits, ledges), a held
// key when near — but never a step into a column with no floor
async function approach(s, tx, near = 140) {
  const px = s.p.x + 12;
  if (Math.abs(tx - px) > near) { const r = await walkTo(s, { x: tx, tol: near - 20 }); if (r === 'stuck') await unstick(s, 'the fight'); return; }
  const dir = tx > px ? 1 : -1;
  if (pitAhead(s, dir)) { await hold([]); await sleep(40); return; }
  await hold([dir > 0 ? 'ArrowRight' : 'ArrowLeft']); await sleep(40);
}
function pitAhead(s, dir) {
  if (!model || !s.p.on) return false;
  const cx = s.p.x + 12 + dir * 28, tx = Math.floor(cx / TL);
  const feetRow = Math.floor((s.p.y + PH + 8) / TL);
  for (let y = feetRow; y < Math.min(model.h, feetRow + 4); y++) if (model.solid(tx, y) || model.at(tx, y) === '=') return false;
  return true;
}
async function backOff(s, dir, ms = 80) {   // dir = the way AWAY
  if (pitAhead(s, dir)) { await hold(['Space', dir > 0 ? 'ArrowRight' : 'ArrowLeft']); await sleep(ms); return; }
  await hold([dir > 0 ? 'ArrowRight' : 'ArrowLeft']); await sleep(ms);
}
const bLog = (s, msg) => { if (!R.bossLog || Date.now() - R.bossLog > 3000) { R.bossLog = Date.now(); log(msg + ' | cores ' + s.p.cores + '/' + s.p.max + ' volts ' + Math.round(s.p.volts)); } };
async function bossFight(s) {
  // the Sage is a duelist in the chamber's enemy list, not a G.boss
  const sage = s.en.find(e => e.k === 'sage');
  // WATCHDOG: a fight that has not moved in 25 s (no hp, no purity) gets a
  // fresh approach from a few steps away — and the log says it happened
  const sig = sage ? Math.round(sage.hp) + '/' + sage.sg.pure : s.boss ? Math.round(s.boss.hp) : '';
  if (sig !== (R.fightSig || {}).v) R.fightSig = { v: sig, t: Date.now() };
  else if (Date.now() - R.fightSig.t > 25000) {
    R.fightSig.t = Date.now(); log('FIGHT WATCHDOG: no progress in 25 s — stepping back to come in again');
    const tx = sage ? sage.x + sage.w / 2 : s.boss ? s.boss.cx : s.p.x;
    await backOff(s, tx > s.p.x + 12 ? -1 : 1, 450); await hold([]); return;
  }
  if (s.room === 'GA1D' && sage) { await sageFight(s, sage); return; }
  if (s.boss && s.boss.k === 'chime') { await chimeFight(s, s.boss); return; }
  if (s.boss && s.boss.k === 'glitch') { await lionFight(s, s.boss); return; }
  await genericBoss(s);
}
// THE SAGE (docs/combat/SAGE.md): coil -> lunge -> lunge -> EXHALE (the
// opening); gather -> a grounded EMBER RING (jump it). At 30% it song-locks;
// then only the sword's strikes fill its purity.
async function sageFight(s, e) {
  const g = e.sg, px = s.p.x + 12, feet = s.p.y + PH;
  const cx = e.x + e.w / 2, dir = cx > px ? 1 : -1, dist = Math.abs(cx - px) - e.w / 2;
  bLog(s, 'SAGE hp=' + e.hp + (g.locked ? ' SONG-LOCKED purity=' + g.pure.toFixed(2) : '') + (g.winded > 0 ? ' exhale' : g.coil > 0 ? ' coil' : g.lunge > 0 ? ' lunge' : g.gather > 0 ? ' gather' : '') + (g.ring != null ? ' ring=' + Math.round(g.ring) : '') + ' dist=' + Math.round(dist));
  const face = async () => { if (s.p.face !== dir) await tap(dir > 0 ? 'ArrowRight' : 'ArrowLeft', 25); };
  // A STRIKE NEEDS A GAP: overlapping its body, a turn-to-face tap walks her
  // through it and flips which side it is on, forever. Step out to a small
  // gap, walk back in (she faces where she walks), then strike.
  const strike = async () => {
    if (dist < 6) { await backOff(s, -dir, 90); await hold([]); return; }
    if (s.p.face !== dir) { await backOff(s, -dir, 70); await hold([dir > 0 ? 'ArrowRight' : 'ArrowLeft']); await sleep(60); await hold([]); return; }
    await hold([]); await tap('KeyX', 40); await sleep(140);
  };
  if (g.tame) { await hold([]); await sleep(200); return; }
  // the ring rolls along the floor: be in the air as it passes
  if (g.ring != null && s.p.on) {
    const d = Math.hypot(px - cx, feet - (e.y + e.h));
    if (d - g.ring > -4 && d - g.ring < 52) { log('SAGE ring: jump'); await hold([]); await tap('Space', 260); return; }
  }
  if (g.locked) {
    if (dist > 30) { await approach(s, cx); return; }
    await strike(); return;
  }
  if (g.winded > 0) {
    if (dist > 30) { await approach(s, cx); return; }
    await strike(); return;
  }
  if (g.lunge > 0 && dist < 110) { await hold([]); await tap('Space', 300); return; }
  if (g.coil > 0) { if (dist < 140) await backOff(s, -dir, 60); else { await hold([]); await sleep(40); } return; }
  if (g.gather > 0) { await hold([]); await sleep(40); return; }
  // neutral: it keeps 70-160 px; stand just outside its lunge and wait for the
  // sentence — or take the free hit when it drifts close
  if (dist < 34) { await strike(); return; }
  if (dist > 150) { await approach(s, cx); return; }
  await hold([]); await face(); await sleep(50);
}
// CHIME: a flying construct that hovers above and beside her and sings notes.
// Get under it, jump, strike upward; step out of its aimed fan.
async function chimeFight(s, b) {
  const px = s.p.x + 12, py = s.p.y + PH / 2;
  const dx = b.cx - px, dy = b.cy - py, dir = dx > 0 ? 1 : -1;
  const reach = 165 + Math.max(b.w, b.h) / 2 - 12, d = Math.hypot(dx, dy);
  bLog(s, 'CHIME st=' + b.st + ' hp=' + b.hp + ' dx=' + Math.round(dx) + ' dy=' + Math.round(dy));
  if (b.st === 'dorm') { await approach(s, b.cx); return; }
  // a note close and coming at her: hop it
  const near = s.projs.find(q => Math.hypot(q.x - px, q.y - py) < 70 && ((q.x - px) * q.vx < 0 || (q.y - py) * q.vy < 0));
  if (near && s.p.on) { if (pitAhead(s, -dir)) { await hold(['Space']); } else await hold([dir > 0 ? 'ArrowLeft' : 'ArrowRight', 'Space']); await sleep(220); await hold([]); return; }
  if (!s.p.on) { await hold([]); await sleep(30); return; }
  // IT HOVERS OUT OF CLAW REACH, AND THE VOLT BURST REACHES 165 PX: when it
  // drifts inside that circle, charge and let go (the pack's own lesson)
  if (s.canBurst && s.p.volts >= s.burstVolts && d < reach) {
    log('CHIME in burst range (' + Math.round(d) + ' px): Volt Burst');
    await hold([]); await page.keyboard.down('KeyX'); await sleep(Math.round(0.68 / Math.max(0.3, RATE) * 1000)); await page.keyboard.up('KeyX'); await sleep(150);
    return;
  }
  // otherwise a running jump at it, striking at the top
  if (Math.abs(dx) < 170 && dy > -215) {
    await hold([dir > 0 ? 'ArrowRight' : 'ArrowLeft', 'Space']);
    await sleep(Math.round(0.26 / Math.max(0.3, RATE) * 1000)); await tap('KeyX', 40);
    await sleep(Math.round(0.12 / Math.max(0.3, RATE) * 1000)); await tap('KeyX', 40);
    await hold([]); await sleep(120); return;
  }
  await approach(s, b.cx - dir * 110, 160);
}
// NULLFANG (docs/combat/BOSS_NULLFANG.md): swipewarn -> swipe (step out of
// 108 px, punish the recovery), crouch -> pounce (move laterally), roar (be
// past 250 px), perch -> dive (move). The Purifier frees him at zero.
async function lionFight(s, b) {
  const px = s.p.x + 12, bx = b.cx, dir = bx > px ? 1 : -1, dist = Math.abs(bx - px) - b.w / 2;
  const st = b.st || '';
  bLog(s, 'NULLFANG st=' + st + ' hp=' + b.hp + ' dist=' + Math.round(dist));
  const away = dir > 0 ? 'ArrowLeft' : 'ArrowRight', toward = dir > 0 ? 'ArrowRight' : 'ArrowLeft';
  if (/swipewarn/.test(st)) { if (dist < 120) await backOff(s, -dir); else { await hold([]); await sleep(40); } return; }
  if (/crouch|perch/.test(st)) { await hold([away, 'Space']); await sleep(260); await hold([toward]); await sleep(120); await hold([]); return; }
  if (/pounce|dive/.test(st)) { await backOff(s, -dir, 60); return; }
  if (/roar|nullcharge/.test(st)) { if (dist < 260) await backOff(s, -dir); else { await hold([]); await sleep(40); } return; }
  // after a swipe, or idle/stalking: close in and strike twice, then leave
  if (dist > 34) { await approach(s, bx); return; }
  await hold([]);
  if (s.p.face !== dir) await tap(toward, 25);
  await tap('KeyX', 40); await sleep(150); await tap('KeyX', 40); await sleep(150);
  await hold([away]); await sleep(180); await hold([]);
}
async function genericBoss(s) {
  const b = s.boss;
  if (!b || b.dead || b.tame) { await hold([]); await sleep(200); return; }
  const px = s.p.x + 12, bx = b.x + b.w / 2;
  const dir = bx > px ? 1 : -1, dist = Math.abs(bx - px) - b.w / 2;
  if (!R.bossLog || Date.now() - R.bossLog > 3000) { R.bossLog = Date.now(); log('BOSS ' + b.k + ' st=' + b.st + ' hp=' + b.hp + (b.max ? '/' + b.max : '') + ' dist=' + Math.round(dist) + ' cores=' + s.p.cores); }
  if (dist > 36) { await hold([dir > 0 ? 'ArrowRight' : 'ArrowLeft']); await sleep(50); return; }
  await hold([]);
  if (s.p.face !== dir) await tap(dir > 0 ? 'ArrowRight' : 'ArrowLeft', 25);
  await tap('KeyX', 40); await sleep(160);
}

// the localStorage exactly as the game wrote it (never edited) — for a segmented run
async function dumpSave(name) {
  try {
    const blob = await page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
    fs.writeFileSync(path.join(OUT, name), JSON.stringify(blob));
  } catch (e) { }
}
async function runMissions(s) {
  for (const m of MISSIONS) {
    if (R.missions.includes(m.id)) continue;
    if (m.done(s)) { if (!R.missions.includes(m.id)) { R.missions.push(m.id); log('MISSION DONE ' + m.id); await frame('done-' + m.id); await dumpSave('save-after-' + m.id + '.json'); if (STOP_AT === m.id) return 'stop'; } continue; }
    if (R.curMission !== m.id) { R.curMission = m.id; log('MISSION ' + m.id + ' (objective: "' + s.goal + '")'); flight = null; stall = { k: -1, since: Date.now(), best: Infinity }; }
    if (s.p && s.state === 'PLAY') {
      if (await maybeHeal(s)) return;
      const e = threat(s);
      if (e && !s.tut) { stall.since = Date.now(); await fight(s, e); return; }
    }
    await m.step(s);
    return;
  }
  return 'complete';
}

if (require.main !== module) module.exports = { roomModel, distTo, simulate, PROGS, nodeStart, nodeFeet };
else (async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...(VIDEO ? { recordVideo: { dir: OUT, size: { width: 1280, height: 720 } } } : {}) });
  page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => { errors.push(String(e)); log('PAGE ERROR ' + String(e).slice(0, 300)); });
  // a cleared browser, or the save the game itself wrote at a pod
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.evaluate(seg => {
    localStorage.clear();
    if (seg) for (const [k, v] of Object.entries(seg)) localStorage.setItem(k, v);
  }, SEGMENT ? JSON.parse(fs.readFileSync(SEGMENT, 'utf8')) : null);
  await page.reload();
  await page.waitForFunction(() => typeof G !== 'undefined' && G.state === 'MENU', null, { timeout: 60000 });
  log('BOOT ' + (SEGMENT ? 'continuing from the game\'s own pod save ' + SEGMENT : 'cleared browser storage') + '; difficulty row ' + DIFF + '; video ' + (VIDEO ? 'on' : 'off'));
  G_GRAPH = await worldGraph();
  // the window has to have been clicked once for audio; a keypress counts too
  let result = 'timeout';
  let lastSave = 0, fpsT = Date.now(), fpsSim = 0;
  while (Date.now() - T0 < MAX_MS) {
    let s;
    try { s = await snap(); } catch (e) {
      log('snap failed: ' + e.message);
      if (/closed|crash/i.test(e.message)) { result = 'browser closed'; break; }
      await sleep(500); continue;
    }
    S = s;
    // the map changes as the story does (doors are built by flags): re-read it per room
    if (s.room && s.room !== lastRoom) { try { G_GRAPH = await worldGraph(); } catch (e) { } }
    diffLog(s);
    // health of the run: the world clock against the wall clock
    if (s.p && Date.now() - (R.statusT || 0) > 8000) {
      R.statusT = Date.now();
      log('  . ' + s.room + ' x=' + Math.round(s.p.x) + ' y=' + Math.round(s.p.y) + ' vx=' + Math.round(s.p.vx) + (s.p.on ? ' on' : ' air') + ' cores=' + s.p.cores + '/' + s.p.max + ' volts=' + Math.round(s.p.volts)
        + (s.tut ? ' tut=' + s.tut.id + '/' + s.tut.action + '@' + Math.round(s.tut.tx || -1) : '') + ' mission=' + R.curMission + ' held=' + [...HELD].join('+') + (threat(s) ? ' threat=' + JSON.stringify(threat(s)) : '') + (s.near ? ' near=' + s.near.type + ':' + s.near.extra : ''));
    }
    if (prevS && s.state === 'PLAY' && prevS.state === 'PLAY' && s.t > prevS.t) RATE = clamp(RATE * 0.9 + 0.1 * ((s.sim - prevS.sim) / ((s.t - prevS.t) / 1000)), 0.2, 1.2);
    if (Date.now() - fpsT > 60000 || !R.dtMeasured) {
      R.dtMeasured = 1;
      const fms = await page.evaluate(() => new Promise(res => { const ts = []; const f = t => { ts.push(t); if (ts.length < 12) requestAnimationFrame(f); else { const d = []; for (let i = 1; i < ts.length; i++) d.push(ts[i] - ts[i - 1]); d.sort((a, b) => a - b); res(d[d.length >> 1]); } }; requestAnimationFrame(f); }));
      FRAME_S = fms / 1000;
      const nd = fms > 25 ? 1 / 30 : 1 / 60;
      if (nd !== DT) { DT = nd; modelKey = ''; }
      log('FRAMES median ' + fms.toFixed(0) + ' ms -> planner step 1/' + Math.round(1 / DT) + ', game time ' + RATE.toFixed(2) + 'x wall');
    }
    if (Date.now() - fpsT > 60000) { log('PACE sim ' + (s.sim - fpsSim).toFixed(1) + ' s per 60 s wall (pace dial / slow frames)'); fpsT = Date.now(); fpsSim = s.sim; }
    // keep the game's own save after every pod rest, for a segmented run
    if (prevS && prevS.bench !== s.bench || (Date.now() - lastSave > 120000 && s.state === 'PLAY')) {
      lastSave = Date.now();
      const blob = await page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
      fs.writeFileSync(path.join(OUT, 'save-latest.json'), JSON.stringify(blob));
      if (prevS && prevS.bench !== s.bench) fs.writeFileSync(path.join(OUT, 'save-pod-' + s.room + '-' + stamp().replace(':', '') + '.json'), JSON.stringify(blob));
    }
    try {
      if (await handleMenus(s)) { prevS = s; continue; }
      if (s.state !== 'PLAY' || !s.p) { await hold([]); await sleep(100); prevS = s; continue; }
      if (s.busy.brk && !R.brkLogged) { R.brkLogged = 1; log('BEAT NULLFANG\'s break plays in ' + s.room + ' — watching'); await frame('nullfang-break'); }
      if (s.busy.trans || s.busy.gate || s.busy.wake || s.busy.cut || s.busy.entry || s.busy.brk || (s.busy.meet && !s.busy.meet.inter)) { if (!flight) await hold([]); await sleep(60); prevS = s; continue; }
      // THE FIRST MEETING (A2): the lion drops in and winds a swipe; she can
      // step out of its reach (the interactive version), so she does
      if (s.busy.meet && s.busy.meet.inter && s.boss && /land|wind/.test(s.busy.meet.ph)) {
        if (!R.meetLogged) { R.meetLogged = 1; log('MEET NULLFANG drops in (' + s.room + '): stepping out of the swipe'); await frame('nullfang-meet'); }
        await hold([s.boss.cx > s.p.x + 12 ? 'ArrowLeft' : 'ArrowRight']); await sleep(80); prevS = s; continue;
      }
      // A NEW POWER'S CHIP (the dash jets after the lion): it waits until she
      // has done it once, so she does it — the chip names the key
      if (s.lesson && s.p.on) {
        if (R.lessonLogged !== s.lesson) { R.lessonLogged = s.lesson; log('LESSON chip: ' + s.lesson + ' — doing it'); await frame('lesson-' + s.lesson); }
        if (s.lesson === 'dash') { await hold([pitAhead(s, s.p.face) ? (s.p.face > 0 ? 'ArrowLeft' : 'ArrowRight') : null]); await tap('KeyC', 60); await sleep(300); await hold([]); prevS = s; continue; }
      }
      const r = await runMissions(s);
      if (r === 'stop') { result = 'stopped at ' + STOP_AT; break; }
      if (r === 'complete') { result = 'complete'; break; }
    } catch (e) { log('ERROR ' + e.stack); if (/game over/.test(e.message)) { result = 'game over'; break; } await sleep(300); }
    prevS = s;
    await sleep(15);
  }
  if (result === 'complete' && !R.teaserSeen) result = 'complete-without-teaser-panels';
  await hold([]);
  await frame('end');
  log('MANHWA seen: ' + [...(R.pansSeen || [])].join(', ') + (R.pansMissed ? '  (did not open: ' + R.pansMissed.join(', ') + ')' : ''));
  log('RESULT ' + result + '  wall ' + stamp() + '  deaths ' + R.deaths + '  missions ' + R.missions.join(',') + '  stuck ' + (R.stuck || 0) + '  page errors ' + errors.length);
  const vid = page.video();
  await ctx.close();
  if (vid) { const vp = await vid.path(); const dst = path.join(OUT, 'campaign-ch1.webm'); try { fs.renameSync(vp, dst); log('VIDEO ' + dst); } catch (e) { log('VIDEO ' + vp); } }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ result, wall: stamp(), deaths: R.deaths, missions: R.missions, rooms: R.rooms, panelsSeen: [...(R.pansSeen || [])], panelsMissed: R.pansMissed || [], difficulty: DIFF, segment: SEGMENT, errors }, null, 1));
  if (result !== 'complete') process.exitCode = 1;
})().catch(e => { log('FATAL ' + e.stack); process.exit(1); });
