// NOSTOS — The Trials of Wisdom: four animated Oracle mini-games.
// Stations stand along the road (Themis' statue, the mason's stones, the
// Oracle's tablet, the Sirens' lyre); the temple console in the Cyclops'
// island shrine hosts the Full Trial of all four labors.
// Mechanics: 45-second rounds · difficulty ramps per correct answer ·
// streak bonuses · full trial (4 labors) vs single-labor play.
// Metis is earned by SURPASSING your previous finest measure (no farming).
// All art drawn in code; all text original (en+ar in i18n.js).

const TR_GAMES = ['stones', 'scales', 'numbers', 'song'];
const TR_ROUND_TIME = 45;
const TR = {
  mode: null,          // 'menu' | 'ready' | 'play' | 'between' | 'result'
  list: [],            // labors queued (1 for single, 4 for full trial)
  li: 0,               // index into list
  full: false,
  game: null,          // current game id
  time: 0, score: 0, streak: 0, diff: 0,
  total: 0,            // full-trial accumulated score
  menuIdx: 0, sel: 0,
  fb: null,            // feedback flash {ok, t}
  anim: 0, readyT: 0,
  q: null,             // current question state (per game)
  reward: 0,
};

function trSave() {
  if (!G.save.trials) G.save.trials = { best: {}, fullBest: 0 };
  return G.save.trials;
}
function trOpenTemple() {
  trSave();
  TR.mode = 'menu'; TR.menuIdx = 0; TR.anim = 0;
  G.state = 'TRIALS';
}
function trOpenSingle(game) {
  trSave();
  TR.full = false; TR.list = [game]; TR.li = 0; TR.total = 0;
  trStartLabor();
  G.state = 'TRIALS';
}
function trStartFull() {
  TR.full = true; TR.list = TR_GAMES.slice(); TR.li = 0; TR.total = 0;
  trStartLabor();
}
function trStartLabor() {
  TR.game = TR.list[TR.li];
  TR.mode = 'ready'; TR.readyT = 1.6; TR.anim = 0;
  TR.time = TR_ROUND_TIME; TR.score = 0; TR.streak = 0; TR.diff = 0;
  TR.fb = null; TR.q = null;
}
function trNewQuestion() {
  TR.sel = 0;
  if (TR.game === 'stones') trqStones();
  else if (TR.game === 'scales') trqScales();
  else if (TR.game === 'numbers') trqNumbers();
  else if (TR.game === 'song') trqSong();
}
function trAnswer(ok) {
  TR.fb = { ok, t: 0.55 };
  if (ok) {
    TR.streak++; TR.diff++;
    TR.score += 50 + Math.min(TR.streak - 1, 8) * 10;
    sfx('ok');
  } else {
    TR.streak = 0;
    sfx('no'); cam.shake = 3;
  }
}
function trEndLabor() {
  TR.total += TR.score;
  const tr = trSave();
  // single-labor best (full-trial labors do not touch single bests)
  if (!TR.full) {
    const old = tr.best[TR.game] || 0;
    TR.reward = TR.score > old ? Math.round((TR.score - old) / 40) : 0;
    if (TR.score > old) tr.best[TR.game] = TR.score;
    if (TR.reward > 0) { G.save.iq += TR.reward; G.firstSeen('metis', 'fu_metis'); sfx('win'); }
    persist();
    TR.mode = 'result'; TR.anim = 0;
    return;
  }
  if (TR.li < TR.list.length - 1) { TR.mode = 'between'; TR.readyT = 1.6; return; }
  const old = tr.fullBest || 0;
  TR.reward = TR.total > old ? Math.round((TR.total - old) / 40) : 0;
  if (TR.total > old) tr.fullBest = TR.total;
  if (TR.reward > 0) { G.save.iq += TR.reward; sfx('win'); }
  persist();
  TR.mode = 'result'; TR.anim = 0;
}

// ==================== question generators ====================
function trqStones() {
  // build a believable stack layer by layer, then drop the blocks in
  const d = TR.diff;
  const n = 4 + Math.min(10, d) + irnd(0, Math.min(6, 2 + d));
  const cols = 4 + Math.min(3, Math.floor(d / 3));    // footprint columns (x)
  const rows = 2 + Math.min(2, Math.floor(d / 4));    // footprint depth (z)
  const heights = [];
  for (let x = 0; x < cols; x++) { heights.push([]); for (let z = 0; z < rows; z++) heights[x].push(0); }
  const blocks = [];
  let placed = 0, guard = 0;
  while (placed < n && guard++ < 500) {
    const x = irnd(0, cols - 1), z = irnd(0, rows - 1);
    const y = heights[x][z];
    if (y > 0 && chance(0.35)) continue;              // prefer ground spread
    if (y >= 4) continue;
    heights[x][z] = y + 1;
    blocks.push({ x, y, z, drop: placed * 0.14 + rnd(0, 0.08), fall: 1, cracked: chance(0.4), fluted: chance(0.35) });
    placed++;
  }
  // sort for painter's algo: back-to-front, bottom-to-top
  blocks.sort((a, b) => (a.z - b.z) || (a.x - b.x) || (a.y - b.y));
  const opts = trNumOptions(placed);
  TR.q = { blocks, count: placed, opts, t: 0, answered: false };
}
function trNumOptions(correct) {
  const set = new Set([correct]);
  while (set.size < 4) {
    const v = correct + irnd(-3, 3);
    if (v > 0) set.add(v);
  }
  const arr = [...set];
  for (let i = arr.length - 1; i > 0; i--) { const j = irnd(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr.map(v => ({ v, correct: v === correct }));
}
const TR_ITEMS = [
  { kind: 'amphora', min: 2, max: 9 },
  { kind: 'helmet', min: 3, max: 12 },
  { kind: 'wreath', min: 1, max: 6 },
];
function trqScales() {
  const d = TR.diff;
  const nL = 1 + Math.min(3, Math.floor(d / 2) + irnd(0, 1));
  const nR = 1 + Math.min(3, Math.floor(d / 2) + irnd(0, 1));
  const mk = n => {
    const a = [];
    for (let i = 0; i < n; i++) {
      const it = TR_ITEMS[irnd(0, 2)];
      a.push({ kind: it.kind, w: irnd(it.min, it.max), drop: i * 0.22 + rnd(0, 0.1), fall: 1 });
    }
    return a;
  };
  let L = mk(nL), R = mk(nR);
  // sometimes force balance (harder to spot)
  if (chance(0.22)) {
    R = L.map((it, i) => ({ kind: TR_ITEMS[irnd(0, 2)].kind, w: it.w, drop: i * 0.22 + rnd(0, 0.1), fall: 1 }));
  }
  const sumL = L.reduce((s2, i) => s2 + i.w, 0), sumR = R.reduce((s2, i) => s2 + i.w, 0);
  const correct = sumL > sumR ? 0 : sumR > sumL ? 1 : 2;
  TR.q = { L, R, sumL, sumR, correct, t: 0, tilt: 0, tiltV: 0, reveal: false };
}
function trqNumbers() {
  const d = TR.diff;
  const hi = 8 + d * 3;
  let a2, b2, res, op, missing;
  const ops = d < 2 ? ['+'] : d < 4 ? ['+', '−'] : ['+', '−', '×'];
  op = ops[irnd(0, ops.length - 1)];
  if (op === '+') { a2 = irnd(2, hi); b2 = irnd(2, hi); res = a2 + b2; }
  else if (op === '−') { a2 = irnd(4, hi + 6); b2 = irnd(2, a2 - 1); res = a2 - b2; }
  else { a2 = irnd(2, 4 + Math.min(8, d)); b2 = irnd(2, 9); res = a2 * b2; }
  missing = d >= 5 && chance(0.45) ? irnd(0, 1) : 2;   // later: hide an operand
  const correct = missing === 0 ? a2 : missing === 1 ? b2 : res;
  TR.q = { a: a2, b: b2, res, op, missing, opts: trNumOptions(correct), t: 0, carve: 0 };
}
const TR_NOTES = [62, 65, 69, 74];   // the four lyre strings (α β γ δ)
function trqSong() {
  const len = 3 + Math.min(6, TR.diff);
  const seq = [];
  for (let i = 0; i < len; i++) {
    let v = irnd(0, 3);
    if (i && v === seq[i - 1] && chance(0.5)) v = (v + irnd(1, 3)) % 4;
    seq.push(v);
  }
  TR.q = { seq, phase: 'listen', pi: -1, pt: 0.5, input: [], vib: [0, 0, 0, 0], t: 0 };
}

// ==================== update ====================
function updateTrials(dt) {
  TR.anim += dt;
  if (TR.fb) { TR.fb.t -= dt; if (TR.fb.t <= 0) TR.fb = null; }
  if (TR.mode === 'menu') {
    const n = 5; // full + 4 practice
    if (inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
    if (inP('DOWN')) { TR.menuIdx = (TR.menuIdx + 1) % n; sfx('ui'); }
    if (inP('UP')) { TR.menuIdx = (TR.menuIdx + n - 1) % n; sfx('ui'); }
    if (inP('OK')) {
      sfx('ok');
      if (TR.menuIdx === 0) trStartFull();
      else { TR.full = false; TR.list = [TR_GAMES[TR.menuIdx - 1]]; TR.li = 0; TR.total = 0; trStartLabor(); }
    }
    return;
  }
  if (TR.mode === 'ready' || TR.mode === 'between') {
    TR.readyT -= dt;
    if (inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
    if (TR.readyT <= 0 || inP('OK')) {
      if (TR.mode === 'between') { TR.li++; trStartLabor(); TR.mode = 'play'; trNewQuestion(); }
      else { TR.mode = 'play'; trNewQuestion(); }
    }
    return;
  }
  if (TR.mode === 'result') {
    if (inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
    if (inP('OK') && TR.anim > 0.6) {
      // play again from the result stone
      if (TR.full) trStartFull(); else { TR.li = 0; trStartLabor(); }
    }
    return;
  }
  // ---- play ----
  if (inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
  TR.time -= dt;
  if (TR.time <= 0) { TR.time = 0; trEndLabor(); return; }
  const q = TR.q;
  if (!q) { trNewQuestion(); return; }
  q.t += dt;
  if (TR.game === 'stones' || TR.game === 'numbers') {
    if (TR.game === 'stones') for (const b of q.blocks) b.fall = clamp((q.t - b.drop) / 0.35, 0, 1);
    else q.carve = clamp(q.t / 0.6, 0, 1);
    const n = q.opts.length;
    if (inP('LEFT') || inP('UP')) { TR.sel = (TR.sel + n - 1) % n; sfx('ui'); }
    if (inP('RIGHT') || inP('DOWN')) { TR.sel = (TR.sel + 1) % n; sfx('ui'); }
    if (inP('OK')) {
      trAnswer(q.opts[TR.sel].correct);
      trNewQuestion();
    }
  } else if (TR.game === 'scales') {
    for (const it of q.L) it.fall = clamp((q.t - it.drop) / 0.4, 0, 1);
    for (const it of q.R) it.fall = clamp((q.t - it.drop) / 0.4, 0, 1);
    // the beam hangs level while you judge; springs to truth on reveal
    const target = q.reveal ? clamp((q.sumR - q.sumL) * 0.022, -0.3, 0.3) : Math.sin(TR.anim * 1.1) * 0.012;
    q.tiltV += (target - q.tilt) * 14 * dt;
    q.tiltV *= Math.pow(0.02, dt);
    q.tilt += q.tiltV * dt * 10;
    if (!q.reveal) {
      if (inP('LEFT') || inP('UP')) { TR.sel = (TR.sel + 2) % 3; sfx('ui'); }
      if (inP('RIGHT') || inP('DOWN')) { TR.sel = (TR.sel + 1) % 3; sfx('ui'); }
      if (inP('OK')) {
        q.reveal = true; q.revT = 0.9;
        trAnswer(TR.sel === q.correct);
      }
    } else {
      q.revT -= dt;
      if (q.revT <= 0) trNewQuestion();
    }
  } else if (TR.game === 'song') {
    for (let i = 0; i < 4; i++) q.vib[i] = Math.max(0, q.vib[i] - dt * 2.2);
    if (q.phase === 'listen') {
      q.pt -= dt;
      if (q.pt <= 0) {
        q.pi++;
        if (q.pi >= q.seq.length) { q.phase = 'echo'; TR.sel = 0; }
        else {
          const st = q.seq[q.pi];
          q.vib[st] = 1; sfxPluck(TR_NOTES[st], 0.15);
          q.pt = 0.52;
        }
      }
    } else {
      if (inP('LEFT')) { TR.sel = (TR.sel + 3) % 4; sfx('ui'); }
      if (inP('RIGHT')) { TR.sel = (TR.sel + 1) % 4; sfx('ui'); }
      if (inP('OK')) {
        q.vib[TR.sel] = 1; sfxPluck(TR_NOTES[TR.sel], 0.16);
        q.input.push(TR.sel);
        const i = q.input.length - 1;
        if (q.input[i] !== q.seq[i]) {
          trAnswer(false);
          setTimeout(() => {}, 0);
          trNewQuestion();
        } else if (q.input.length === q.seq.length) {
          trAnswer(true);
          trNewQuestion();
        }
      }
    }
  }
}

// ==================== drawing ====================
// weathered marble block, isometric — used by station + game
function trMarbleBlock(cx2, cy2, sz, opt) {
  const w = sz, h = sz * 0.52, dep = sz * 0.62;
  const warm = opt && opt.warm ? 1 : 0;
  const topC = warm ? '#f0e2c4' : '#e2dcc8', leftC = warm ? '#c9b48e' : '#b8ad92', rightC = warm ? '#a08a62' : '#8f8468';
  // top
  c.fillStyle = topC;
  c.beginPath(); c.moveTo(cx2, cy2 - h / 2); c.lineTo(cx2 + w / 2, cy2); c.lineTo(cx2, cy2 + h / 2); c.lineTo(cx2 - w / 2, cy2); c.closePath(); c.fill();
  // left face
  c.fillStyle = leftC;
  c.beginPath(); c.moveTo(cx2 - w / 2, cy2); c.lineTo(cx2, cy2 + h / 2); c.lineTo(cx2, cy2 + h / 2 + dep); c.lineTo(cx2 - w / 2, cy2 + dep); c.closePath(); c.fill();
  // right face
  c.fillStyle = rightC;
  c.beginPath(); c.moveTo(cx2 + w / 2, cy2); c.lineTo(cx2, cy2 + h / 2); c.lineTo(cx2, cy2 + h / 2 + dep); c.lineTo(cx2 + w / 2, cy2 + dep); c.closePath(); c.fill();
  // column-drum flutes on the left face
  if (opt && opt.fluted) {
    c.strokeStyle = 'rgba(90,75,50,0.35)'; c.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
      c.beginPath();
      c.moveTo(cx2 - w / 2 + (w / 2) * k / 4, cy2 + (h / 2) * k / 4);
      c.lineTo(cx2 - w / 2 + (w / 2) * k / 4, cy2 + (h / 2) * k / 4 + dep);
      c.stroke();
    }
  }
  // weathering crack
  if (opt && opt.cracked) {
    c.strokeStyle = 'rgba(70,58,40,0.5)'; c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(cx2 + w * 0.1, cy2 + h * 0.2);
    c.lineTo(cx2 + w * 0.22, cy2 + h * 0.2 + dep * 0.4);
    c.lineTo(cx2 + w * 0.12, cy2 + h * 0.2 + dep * 0.75);
    c.stroke();
  }
  c.strokeStyle = 'rgba(60,50,34,0.4)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(cx2 - w / 2, cy2); c.lineTo(cx2, cy2 + h / 2); c.lineTo(cx2 + w / 2, cy2); c.stroke();
}
// scale-pan items
function trItem(kind, x, y, sc) {
  c.save(); c.translate(x, y); c.scale(sc, sc);
  if (kind === 'amphora') {
    c.fillStyle = '#a8543a';
    c.beginPath(); c.ellipse(0, 0, 8, 11, 0, 0, 7); c.fill();
    c.fillRect(-3.4, -15, 6.8, 5);
    c.strokeStyle = '#7a3826'; c.lineWidth = 2;
    c.beginPath(); c.arc(-8, -8, 4, 1.2, 4.4); c.stroke();
    c.beginPath(); c.arc(8, -8, 4, -1.2, 2); c.stroke();
    c.strokeStyle = '#3a2216'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-6, -2); c.quadraticCurveTo(0, 2, 6, -2); c.stroke();
  } else if (kind === 'helmet') {
    c.fillStyle = '#c8963c';
    c.beginPath(); c.moveTo(-9, 8); c.quadraticCurveTo(-10, -8, 0, -9);
    c.quadraticCurveTo(10, -8, 9, 8); c.lineTo(5, 8); c.lineTo(4, 1);
    c.lineTo(-4, 1); c.lineTo(-5, 8); c.closePath(); c.fill();
    c.fillStyle = '#a83a34';
    c.beginPath(); c.moveTo(-8, -7); c.quadraticCurveTo(0, -16, 9, -7);
    c.quadraticCurveTo(1, -11, -7, -5); c.closePath(); c.fill();
  } else {
    c.strokeStyle = '#6a9a3c'; c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, 8, 0.5, Math.PI * 2 - 0.5); c.stroke();
    c.fillStyle = '#86b84e';
    for (let k = 0; k < 8; k++) {
      const aa = 0.7 + k / 8 * 4.9;
      c.save(); c.translate(Math.cos(aa) * 8, Math.sin(aa) * 8); c.rotate(aa + 1.57);
      c.beginPath(); c.ellipse(0, 0, 2, 4.5, 0, 0, 7); c.fill();
      c.restore();
    }
  }
  c.restore();
}
// Themis with her golden beam — statue for both the station and the game frame
function trThemis(x, y, sc, tilt, big) {
  c.save(); c.translate(x, y); c.scale(sc, sc);
  // robed figure
  const rg = c.createLinearGradient(0, -120, 0, 0);
  rg.addColorStop(0, '#e8e0cc'); rg.addColorStop(1, '#b0a284');
  c.fillStyle = rg;
  c.beginPath(); c.moveTo(-26, 0); c.quadraticCurveTo(-20, -70, -12, -96);
  c.lineTo(-8, -104) ; c.lineTo(8, -104); c.lineTo(12, -96);
  c.quadraticCurveTo(20, -70, 26, 0); c.closePath(); c.fill();
  // drape folds
  c.strokeStyle = 'rgba(90,78,54,0.4)'; c.lineWidth = 1.4;
  for (const fx of [-12, -4, 5, 13]) {
    c.beginPath(); c.moveTo(fx * 0.5, -90); c.quadraticCurveTo(fx, -40, fx * 1.6, 0); c.stroke();
  }
  // head, blindfolded (Justice sees no faces)
  c.fillStyle = '#e0d6bc'; c.beginPath(); c.arc(0, -112, 10, 0, 7); c.fill();
  c.fillStyle = '#8a7a5c'; c.fillRect(-10, -115, 20, 5);
  c.fillStyle = '#b0a284';
  c.beginPath(); c.arc(0, -117, 10, Math.PI, 0); c.fill();     // hair crown
  // raised arm holding the beam
  c.strokeStyle = '#d8ceb4'; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -80); c.lineTo(0, -132); c.stroke();
  // the golden beam + chains + pans (tilt in radians)
  c.save(); c.translate(0, -134); c.rotate(tilt || 0);
  c.strokeStyle = '#e8c26a'; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-big, 0); c.lineTo(big, 0); c.stroke();
  c.fillStyle = '#e8c26a'; c.beginPath(); c.arc(0, 0, 5, 0, 7); c.fill();
  for (const side of [-1, 1]) {
    const bx = side * big;
    c.strokeStyle = 'rgba(232,194,106,0.85)'; c.lineWidth = 1.6;
    for (const dx of [-14, 14]) {
      c.beginPath(); c.moveTo(bx, 0); c.lineTo(bx + dx, 34); c.stroke();
    }
    c.strokeStyle = '#e8c26a'; c.lineWidth = 4;
    c.beginPath(); c.arc(bx, 36, 20, 0.15, Math.PI - 0.15); c.stroke();
  }
  c.restore();
  c.restore();
}

// ---------- in-world station sprites ----------
function drawTrialStation(s, P) {
  const g = s.extra;
  const pu = 0.5 + Math.sin(performance.now() / 500 + s.t) * 0.3;
  c.save();
  if (g === 'scales') {
    trThemis(s.x + s.w / 2, s.y + s.h, 0.42, Math.sin(performance.now() / 900) * 0.08, 46);
  } else if (g === 'stones') {
    // half-built marble course with a mason's lifting pole
    trMarbleBlock(s.x + 12, s.y + 44, 20, { warm: true, fluted: true });
    trMarbleBlock(s.x + 32, s.y + 44, 20, { warm: true, cracked: true });
    trMarbleBlock(s.x + 22, s.y + 30, 20, { warm: true });
    c.strokeStyle = '#6b4a2a'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(s.x + 40, s.y + 52); c.lineTo(s.x + 20, s.y - 2); c.stroke();
    c.strokeStyle = 'rgba(200,180,140,0.8)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(s.x + 20, s.y - 2); c.lineTo(s.x + 24, s.y + 22); c.stroke();
  } else if (g === 'numbers') {
    // carved stele
    c.fillStyle = '#7d6c54'; c.fillRect(s.x + 16, s.y + 48, 14, 16);
    c.fillStyle = '#9a8a6c'; rr(c, s.x + 6, s.y, 34, 50, 4); c.fill();
    c.strokeStyle = '#5c5244'; c.lineWidth = 1.4; rr(c, s.x + 6, s.y, 34, 50, 4); c.stroke();
    drawMeander(c, s.x + 9, s.y + 4, 28, 4, '#5c5244', 0.8);
    c.fillStyle = '#4a4234';
    ftxt('Δ + Γ', s.x + 23, s.y + 20, 10, '#4a4234');
    ftxt('= Ζ', s.x + 23, s.y + 33, 10, '#4a4234');
  } else if (g === 'song') {
    // standing lyre: tortoise-shell bowl, two curved horns, four strings
    c.fillStyle = '#8a5a30';
    c.beginPath(); c.ellipse(s.x + 23, s.y + 52, 16, 11, 0, 0, Math.PI); c.fill();
    c.strokeStyle = '#a8743c'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(s.x + 9, s.y + 50); c.quadraticCurveTo(s.x + 2, s.y + 18, s.x + 12, s.y + 4); c.stroke();
    c.beginPath(); c.moveTo(s.x + 37, s.y + 50); c.quadraticCurveTo(s.x + 44, s.y + 18, s.x + 34, s.y + 4); c.stroke();
    c.strokeStyle = '#c8963c'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(s.x + 10, s.y + 6); c.lineTo(s.x + 36, s.y + 6); c.stroke();
    for (let k = 0; k < 4; k++) {
      const sx2 = s.x + 15 + k * 5.4;
      const vib = Math.sin(performance.now() / 60 + k * 2) * (0.5 + pu);
      c.strokeStyle = 'rgba(255,240,200,0.9)'; c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(sx2, s.y + 8);
      c.quadraticCurveTo(sx2 + vib, s.y + 30, sx2, s.y + 48); c.stroke();
    }
    if (chance(0.03)) addPart(s.x + 23 + rnd(-10, 10), s.y + 8, rnd(-8, 8), rnd(-40, -20), 0.8, '#ffd76a', 2, -30, true);
  }
  // soft oracle shimmer
  c.globalAlpha = 0.25 + pu * 0.2;
  c.fillStyle = P.glow;
  c.beginPath(); c.arc(s.x + s.w / 2, s.y + 6, 3, 0, 7); c.fill();
  c.restore(); c.globalAlpha = 1;
}
function drawTempleConsole(s, P) {
  // marble temple console: two columns, architrave, glowing omphalos stone
  const mx = s.x + s.w / 2;
  const pu = 0.5 + Math.sin(performance.now() / 600 + s.t) * 0.3;
  c.fillStyle = '#9a8a6c'; rr(c, s.x - 4, s.y + s.h - 8, s.w + 8, 8, 2); c.fill();
  c.fillStyle = '#b0a284';
  for (const cx3 of [s.x + 6, s.x + s.w - 12]) {
    c.fillRect(cx3, s.y + 10, 8, s.h - 18);
    c.fillRect(cx3 - 2, s.y + 8, 12, 4);
    c.strokeStyle = 'rgba(90,78,54,0.4)'; c.lineWidth = 1;
    for (let k = 1; k < 3; k++) { c.beginPath(); c.moveTo(cx3 + k * 2.6, s.y + 12); c.lineTo(cx3 + k * 2.6, s.y + s.h - 10); c.stroke(); }
  }
  c.fillStyle = '#c0b294'; rr(c, s.x - 2, s.y + 2, s.w + 4, 9, 2); c.fill();
  c.beginPath(); c.moveTo(s.x - 4, s.y + 2); c.lineTo(mx, s.y - 10); c.lineTo(s.x + s.w + 4, s.y + 2); c.closePath(); c.fill();
  drawMeander(c, s.x + 2, s.y + 4, s.w - 4, 4, '#5c5244', 0.7);
  // the omphalos (navel-stone of the Oracle) between the columns
  c.fillStyle = '#e0d6bc';
  c.beginPath(); c.moveTo(mx - 10, s.y + s.h - 8);
  c.quadraticCurveTo(mx - 11, s.y + 26, mx, s.y + 22);
  c.quadraticCurveTo(mx + 11, s.y + 26, mx + 10, s.y + s.h - 8); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(122,110,80,0.6)'; c.lineWidth = 1;
  for (let k = 0; k < 3; k++) {
    c.beginPath(); c.moveTo(mx - 9 + k, s.y + 30 + k * 8);
    c.quadraticCurveTo(mx, s.y + 34 + k * 8, mx + 9 - k, s.y + 30 + k * 8); c.stroke();
  }
  c.fillStyle = P.glow; c.globalAlpha = 0.3 + pu * 0.4;
  c.shadowColor = P.glow; c.shadowBlur = 14;
  c.beginPath(); c.arc(mx, s.y + 30, 4, 0, 7); c.fill();
  c.shadowBlur = 0; c.globalAlpha = 1;
  if (chance(0.05)) addPart(mx + rnd(-12, 12), s.y + rnd(16, 40), rnd(-8, 8), rnd(-26, -8), 0.7, '#c8a2ff', 1.8, -14, true);
}

// ---------- full-screen trial scenes ----------
function trHud() {
  // timer as a draining water-clock arc + score + streak
  ftxt(t('tr_time') + '  ' + Math.ceil(TR.time), 130, 62, 16, TR.time < 8 ? '#ff8f7d' : '#eef3fa', 'left');
  ftxt(t('tr_score') + '  ' + TR.score, 130, 88, 14, '#ffd76a', 'left');
  if (TR.streak > 1) ftxt(t('tr_streak') + ' ×' + TR.streak, 830, 62, 15, '#aef7d8', 'right');
  c.strokeStyle = 'rgba(232,194,106,0.5)'; c.lineWidth = 5;
  c.beginPath(); c.arc(96, 72, 20, -Math.PI / 2, -Math.PI / 2 + (TR.time / TR_ROUND_TIME) * Math.PI * 2); c.stroke();
  if (TR.fb) {
    c.globalAlpha = Math.min(1, TR.fb.t * 3);
    ftxt(TR.fb.ok ? '✓' : '✕', 480, 96, 40, TR.fb.ok ? '#7de8a0' : '#ff6a5a', 'center', TR.fb.ok ? '#7de8a0' : '#ff6a5a');
    c.globalAlpha = 1;
  }
  if (TR.full) ftxt((TR.li + 1) + ' / 4', 830, 88, 13, '#8aa2b5', 'right');
}
function trScene() {
  // dim the world; warm temple-interior wash
  c.fillStyle = 'rgba(10,7,4,0.9)'; c.fillRect(0, 0, 960, 540);
  const wg = c.createLinearGradient(0, 0, 0, 540);
  wg.addColorStop(0, 'rgba(60,40,20,0.4)'); wg.addColorStop(1, 'rgba(20,12,8,0.1)');
  c.fillStyle = wg; c.fillRect(0, 0, 960, 540);
  drawMeander(c, 20, 16, 920, 8, 'rgba(232,194,106,0.5)', 0.5);
  drawMeander(c, 20, 516, 920, 8, 'rgba(232,194,106,0.5)', 0.5);
}
function trOptButtons(opts, y, fmt) {
  const n = opts.length, w = 130, gap = 30;
  const x0 = 480 - (n * w + (n - 1) * gap) / 2 + w / 2;
  opts.forEach((o, i) => {
    const x = x0 + i * (w + gap), sel = i === TR.sel;
    c.fillStyle = sel ? 'rgba(232,194,106,0.18)' : 'rgba(40,32,20,0.7)';
    rr(c, x - w / 2, y - 24, w, 48, 9); c.fill();
    c.strokeStyle = sel ? '#ffcf6a' : 'rgba(140,120,80,0.6)'; c.lineWidth = sel ? 2.5 : 1.5;
    rr(c, x - w / 2, y - 24, w, 48, 9); c.stroke();
    ftxt(fmt(o), x, y, 21, sel ? '#fff2d0' : '#c0b294');
  });
}
function drawTrials() {
  trScene();
  if (TR.mode === 'menu') {
    ftxt(t('tr_title'), 480, 74, 34, '#eef3fa', 'center', '#ffcf6a');
    drawGlyphText(c, 'ΓΝΩΘΙ ΣΑΥΤΟΝ', 480, 108, 12, 'rgba(232,194,106,0.7)');  // "know thyself"
    ftxt(t('tr_sub'), 480, 136, 15, '#9ab0c2');
    const rows = [t('tr_full')].concat(TR_GAMES.map(g => t('tr_g_' + g)));
    rows.forEach((label, i) => {
      const sel = i === TR.menuIdx, y = 190 + i * 52;
      if (sel) { c.fillStyle = 'rgba(232,194,106,0.1)'; rr(c, 230, y - 20, 500, 40, 9); c.fill(); }
      ftxt((sel ? '▸ ' : '') + label, 480, y, 20, sel ? '#fff2d0' : '#9ab0c2');
      if (i > 0) {
        const best = trSave().best[TR_GAMES[i - 1]] || 0;
        if (best) ftxt(t('tr_best') + ' ' + best, 700, y, 12, '#8a7a5c', 'left');
      }
    });
    const fb = trSave().fullBest || 0;
    if (fb) ftxt(t('tr_best') + ' — ' + t('tr_full') + ': ' + fb, 480, 462, 13, '#8a7a5c');
    ftxt(t('tr_esc'), 480, 500, 13, '#7d93a8');
    return;
  }
  if (TR.mode === 'ready' || TR.mode === 'between') {
    ftxt(TR.mode === 'between' ? t('tr_next') : t('tr_ready'), 480, 200, 20, '#9ab0c2');
    const g = TR.mode === 'between' ? TR.list[TR.li + 1] : TR.game;
    ftxt(t('tr_g_' + g), 480, 258, 34, '#fff2d0', 'center', '#ffcf6a');
    ftxt(t('tr_g_' + g + 'd'), 480, 306, 17, '#c0b294');
    if (TR.readyT < 0.6) ftxt(t('tr_go'), 480, 380, 28, '#7de8a0', 'center', '#7de8a0');
    return;
  }
  if (TR.mode === 'result') { trDrawResult(); return; }
  trHud();
  const q = TR.q; if (!q) return;
  if (TR.game === 'stones') trDrawStones(q);
  else if (TR.game === 'scales') trDrawScales(q);
  else if (TR.game === 'numbers') trDrawNumbers(q);
  else trDrawSong(q);
}
function trDrawStones(q) {
  ftxt(t('tr_h_stones'), 480, 140, 19, '#eef3fa');
  const sz = 46, ox = 480, oy = 300;
  for (const b of q.blocks) {
    if (b.fall <= 0) continue;
    const ix = (b.x - 1.5) * (sz * 0.62) + b.z * (sz * 0.3);
    const iy = b.z * (sz * 0.34) - b.y * (sz * 0.64);
    const ease = 1 - Math.pow(1 - b.fall, 3);
    const dropY = (1 - ease) * -300;
    // settle dust
    if (b.fall > 0.92 && b.fall < 1 && chance(0.5))
      addPart(ox + ix + rnd(-16, 16), oy + iy + sz * 0.6, rnd(-40, 40), rnd(-30, -5), 0.3, '#d8ccae', 2, 300);
    trMarbleBlock(ox + ix, oy + iy + dropY, sz, { warm: true, cracked: b.cracked, fluted: b.fluted });
  }
  trOptButtons(q.opts, 470, o => greekNum(o.v) + '  ·  ' + o.v);
}
function trDrawScales(q) {
  ftxt(t('tr_h_scales'), 480, 130, 19, '#eef3fa');
  // Themis herself frames the scene, huge, holding the living beam
  trThemis(480, 520, 1.35, q.tilt, 150);
  // items resting on the pans (world coords of pans depend on tilt)
  for (const side of [-1, 1]) {
    const items = side < 0 ? q.L : q.R;
    const bx = 480 + Math.cos(q.tilt) * 150 * 1.35 * side;
    const by = 520 - 134 * 1.35 + Math.sin(q.tilt) * 150 * 1.35 * side + 40;
    items.forEach((it, i) => {
      if (it.fall <= 0) return;
      const ease = 1 - Math.pow(1 - it.fall, 3);
      const dy = (1 - ease) * -260;
      const px2 = bx + (i - (items.length - 1) / 2) * 30;
      trItem(it.kind, px2, by + dy - 12, 1.25);
      c.fillStyle = '#fff2d0';
      ftxt(String(it.w), px2, by + dy + 12, 15, '#fff2d0', 'center', 'rgba(0,0,0,0.8)');
    });
  }
  if (q.reveal) {
    ftxt(q.sumL + '   ·   ' + q.sumR, 480, 180, 22, '#ffd76a');
  }
  trOptButtons([{ k: 'tr_left' }, { k: 'tr_right' }, { k: 'tr_equal' }], 480, o => t(o.k));
}
function trDrawNumbers(q) {
  ftxt(t('tr_h_numbers'), 480, 130, 19, '#eef3fa');
  // the stone tablet
  c.save();
  c.fillStyle = '#9a8a6c'; rr(c, 300, 170, 360, 190, 8); c.fill();
  c.strokeStyle = '#5c5244'; c.lineWidth = 3; rr(c, 300, 170, 360, 190, 8); c.stroke();
  drawMeander(c, 316, 182, 328, 7, '#5c5244', 0.8);
  const carveN = Math.floor(q.carve * 5);
  const parts = [
    q.missing === 0 ? '□' : String(q.a),
    q.op,
    q.missing === 1 ? '□' : String(q.b),
    '=',
    q.missing === 2 ? '□' : String(q.res),
  ];
  let shown = '';
  for (let i = 0; i < parts.length; i++) {
    if (i < carveN) shown += parts[i] + ' ';
    else if (i === carveN) {
      // chisel dust at the carving point
      if (chance(0.6)) addPart(480 + (i - 2) * 52 + rnd(-8, 8), 268 + rnd(-10, 10), rnd(-30, 30), rnd(-40, 0), 0.3, '#d8ccae', 2, 400);
    }
  }
  // recessed carved digits
  c.font = '700 46px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(30,24,14,0.7)'; c.fillText(shown.trim(), 480, 269);
  c.fillStyle = '#4a4234'; c.fillText(shown.trim(), 480, 265);
  c.restore();
  if (q.carve >= 1) trOptButtons(q.opts, 440, o => greekNum(o.v) + '  ·  ' + o.v);
}
function trDrawSong(q) {
  ftxt(t('tr_h_song'), 480, 120, 19, '#eef3fa');
  ftxt(q.phase === 'listen' ? t('tr_listen') : t('tr_echo'), 480, 156, 15, q.phase === 'listen' ? '#c8a2ff' : '#aef7d8');
  // the great lyre
  c.save(); c.translate(480, 200);
  c.fillStyle = '#8a5a30';
  c.beginPath(); c.ellipse(0, 220, 130, 60, 0, 0, Math.PI); c.fill();
  c.fillStyle = '#6b4525';
  c.beginPath(); c.ellipse(0, 220, 104, 42, 0, 0, Math.PI); c.fill();
  c.strokeStyle = '#a8743c'; c.lineWidth = 14; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-118, 212); c.quadraticCurveTo(-160, 60, -104, -10); c.stroke();
  c.beginPath(); c.moveTo(118, 212); c.quadraticCurveTo(160, 60, 104, -10); c.stroke();
  c.strokeStyle = '#c8963c'; c.lineWidth = 9;
  c.beginPath(); c.moveTo(-110, -4); c.lineTo(110, -4); c.stroke();
  // four strings α β γ δ
  for (let i = 0; i < 4; i++) {
    const sx2 = -75 + i * 50;
    const sel = q.phase === 'echo' && i === TR.sel;
    const vib = q.vib[i];
    const glowC = ['#ffd76a', '#7ad4ff', '#aef7d8', '#c8a2ff'][i];
    if (sel || vib > 0) {
      c.shadowColor = glowC; c.shadowBlur = 10 + vib * 16;
    }
    c.strokeStyle = vib > 0 ? '#ffffff' : sel ? glowC : 'rgba(240,228,200,0.85)';
    c.lineWidth = vib > 0 ? 2.6 : 1.8;
    c.beginPath(); c.moveTo(sx2, 2);
    // vibrating string: superposed sine wobble
    const amp = vib * 9;
    for (let yy = 0; yy <= 210; yy += 6) {
      const wob = Math.sin(yy / 30 + performance.now() / 24) * amp * Math.sin(Math.PI * yy / 210);
      c.lineTo(sx2 + wob, 2 + yy);
    }
    c.stroke(); c.shadowBlur = 0;
    // Greek letter label on the crossbar
    ftxt(GREEK_ALPHA[i], sx2, -24, 24, sel ? glowC : '#e0d6bc', 'center', sel ? glowC : null);
    if (sel) {
      c.fillStyle = glowC;
      c.beginPath(); c.moveTo(sx2 - 7, 236); c.lineTo(sx2, 224); c.lineTo(sx2 + 7, 236); c.closePath(); c.fill();
    }
  }
  c.restore();
  // progress dots of the melody
  const total = q.seq.length;
  for (let i = 0; i < total; i++) {
    const done = q.phase === 'listen' ? i <= q.pi : i < q.input.length;
    c.fillStyle = done ? '#ffd76a' : 'rgba(140,120,80,0.5)';
    c.beginPath(); c.arc(480 - (total - 1) * 11 + i * 22, 480, 5, 0, 7); c.fill();
  }
}
function trDrawResult() {
  const score = TR.full ? TR.total : TR.score;
  ftxt(t('tr_result'), 480, 80, 30, '#eef3fa', 'center', '#ffcf6a');
  // the marble bust of cunning — more laureled the higher the measure
  const rank = score >= 2600 ? 4 : score >= 1800 ? 3 : score >= 1100 ? 2 : score >= 500 ? 1 : 0;
  const grow = Math.min(1, TR.anim / 0.8);
  c.save(); c.translate(480, 300); c.scale(0.8 + grow * 0.2 + rank * 0.04, 0.8 + grow * 0.2 + rank * 0.04);
  // plinth
  c.fillStyle = '#7d6c54'; rr(c, -54, 58, 108, 22, 4); c.fill();
  drawMeander(c, -48, 62, 96, 6, '#4a4234', 0.8);
  // shoulders + head in marble
  const mg = c.createLinearGradient(0, -80, 0, 60);
  mg.addColorStop(0, '#efe8d4'); mg.addColorStop(1, '#b8ac90');
  c.fillStyle = mg;
  c.beginPath(); c.moveTo(-52, 58); c.quadraticCurveTo(-46, 24, -18, 16);
  c.lineTo(-12, 2); c.quadraticCurveTo(-26, -18, -20, -44);
  c.quadraticCurveTo(-12, -74, 0, -74);
  c.quadraticCurveTo(24, -72, 26, -40);
  c.quadraticCurveTo(28, -16, 14, 0); c.lineTo(18, 16);
  c.quadraticCurveTo(46, 24, 52, 58); c.closePath(); c.fill();
  // face hints
  c.strokeStyle = 'rgba(110,96,66,0.6)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(20, -46); c.quadraticCurveTo(28, -38, 22, -30); c.stroke(); // nose
  c.beginPath(); c.moveTo(6, -50); c.lineTo(16, -50); c.stroke();                    // eye
  c.beginPath(); c.moveTo(10, -20); c.quadraticCurveTo(18, -16, 22, -20); c.stroke(); // mouth/beard line
  // laurel wreath: leaves grow with rank
  const leaves = 2 + rank * 3;
  c.fillStyle = '#6a9a3c';
  for (let sdir = -1; sdir <= 1; sdir += 2) {
    for (let i = 0; i < leaves; i++) {
      const aa = Math.PI * 1.5 + sdir * (0.35 + i * 0.16);
      const lx = Math.cos(aa) * 26, ly = -44 + Math.sin(aa) * 30;
      const la = Math.min(1, Math.max(0, TR.anim * 1.6 - i * 0.12));
      if (la <= 0) continue;
      c.save(); c.translate(lx, ly); c.rotate(aa + Math.PI / 2); c.scale(la, la);
      c.beginPath(); c.ellipse(0, 0, 3.4, 8, 0, 0, 7); c.fill();
      c.restore();
    }
  }
  if (rank >= 4) { // golden band for POLYMETIS
    c.strokeStyle = '#ffd76a'; c.lineWidth = 3; c.shadowColor = '#ffd76a'; c.shadowBlur = 10;
    c.beginPath(); c.arc(0, -48, 27, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); c.shadowBlur = 0;
  }
  c.restore();
  ftxt(t('tr_metis') + ' — ' + score, 480, 412, 24, '#ffd76a', 'center', '#ffd76a');
  ftxt(t('tr_rank' + rank), 480, 446, 18, rank >= 4 ? '#fff2d0' : '#c0b294', 'center', rank >= 4 ? '#ffd76a' : null);
  if (TR.reward > 0) ftxt('+' + TR.reward + ' ' + t('sk_iq') + ' — ' + t('tr_reward'), 480, 478, 15, '#aef7d8');
  else ftxt(t('tr_noreward'), 480, 478, 13, '#8aa2b5');
  ftxt(t('tr_again'), 480, 508, 12, '#7d93a8');
}
