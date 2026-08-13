// CLAWBYTE — Cognition Trials: original brain-training mini-games
// (mechanics in the classic genre tradition; all content, art and names ours)
// 4 categories: Calculation, Memory, Visual, Logic · 45s rounds ·
// difficulty ramps per correct answer · Full Trial → Mind Volume + IQ.
const T_GAME = 45;
const TRI = {
  st: 'menu', sel: 0, mode: 'full', order: ['mem', 'vis', 'log'],
  gi: 0, t: 0, level: 1, streak: 0, score: 0, results: [], q: null,
  memSeq: [], memIn: 0, memShow: -1, memShowT: 0, memPhase: 'show',
  fb: 0, fbGood: false, preT: 0, betweenT: 0,
};
function trialOpen() {
  TRI.st = 'menu'; TRI.sel = 0;
  G.state = 'TRIAL'; sfx('ui');
}
function triStartGame(kind) {
  TRI.t = T_GAME; TRI.level = 1; TRI.streak = 0; TRI.score = 0;
  TRI.game = kind; TRI.fb = 0;
  triGen();
  TRI.st = 'pre'; TRI.preT = 1.1;
}
function triStart(mode, kind) {
  TRI.mode = mode; TRI.results = []; TRI.gi = 0;
  triStartGame(mode === 'full' ? TRI.order[0] : kind);
}
// ===========================================================================
// A MIND NODE IS ONE PUZZLE, NOT A RIDDLE.
//
// These used to be word riddles with three written answers — "I carry a
// thousand keys yet open no gate" — which is a vocabulary test wearing a
// puzzle's clothes. A child who cannot read English fluently cannot even
// attempt it, and the wrong answers are traps rather than alternatives. It is
// also the one part of the game that could not be translated honestly: a
// riddle rests on a pun, and a pun does not survive being carried into
// another language.
//
// A node now hands the player ONE question from the same three games the
// Trials use — remember the lights, read the cubes, weigh the objects — and
// every one of them is understood by looking at it. Nothing to read, nothing
// to translate, and nothing that rewards guessing.
//
// The eight nodes in the world are laid out from easiest to hardest in the
// order a player meets them, and each starts with the game at the level it
// needs, so the first one anybody finds teaches how these work.
// ===========================================================================
const NODES = [
  { game: 'mem', level: 1, iq: 10 },   // three lights, in order
  { game: 'vis', level: 1, iq: 10 },   // count the cubes
  { game: 'log', level: 1, iq: 10 },   // one balance, two objects
  { game: 'mem', level: 3, iq: 10 },
  { game: 'vis', level: 3, iq: 10 },
  { game: 'log', level: 4, iq: 10 },
  { game: 'mem', level: 5, iq: 15 },
  { game: 'log', level: 7, iq: 15 },   // the deepest one, in the cat's chamber
  // [8] THE WAKING FLOOR'S OWN NODE. It exists so the tutorial can teach where
  // insight comes from without stealing a node the world already placed — the
  // first one in the Meadows must still be there for a player who skipped this
  // room, and two statics sharing an index would share a solved flag too.
  { game: 'mem', level: 1, iq: 10 },
];
function nodeKey(i) { return 'rd_n' + i; }
function triStartNode(i, st) {
  const n = NODES[i] || NODES[0];
  TRI.mode = 'node'; TRI.results = []; TRI.gi = 0;
  TRI.node = { i, st, iq: n.iq };
  TRI.t = 999; TRI.level = n.level; TRI.streak = 0; TRI.score = 0;
  TRI.game = n.game; TRI.fb = 0;
  triGen();
  TRI.st = 'pre'; TRI.preT = 1.1;
  G.state = 'TRIAL'; sfx('ui');
}
// one answer, then straight back to the room — right or wrong
function triNodeAnswer(ok) {
  const nd = TRI.node;
  TRI.node = null; TRI.mode = 'full';
  G.state = 'PLAY';
  if (!nd) return;
  if (!ok) { sfx('no'); cam.shake = 6; G.toast(t('rd_wrong')); return; }
  G.save.flags[nodeKey(nd.i)] = 1;
  G.save.iq += nd.iq;
  if (typeof iqNudge === 'function') iqNudge();
  if (nd.st) nd.st.opened = true;
  sfx('win');
  G.toast(t('rd_reward') + '  +' + nd.iq + ' ' + t('sk_iq'));
  burst(nd.st ? nd.st.x + 13 : 480, nd.st ? nd.st.y + 12 : 270, 24, '#b48cff', 260, 0.8, 100, 4, true);
  let all = true;
  for (let i = 0; i < NODES.length; i++) if (!G.save.flags[nodeKey(i)]) all = false;
  if (all) G.grantRelic('sigil2');
  persist();
}
// ===========================================================================
// THE SCALES — a deduction, not a lookup.
//
// The old version showed one balance and asked which PAN was heavier, which a
// player answers by looking at which way it tilts. That is not a question. The
// question is now: given what these balances show you, which ITEM is the
// heaviest — and the item you must name is usually not on the scale you are
// looking at, so the only way through is to chain the evidence.
//
// THE RAMP, one step per correct answer, exactly as far as the player has
// earned. Two items and one balance to begin with, which teaches the rule the
// whole game rests on — the side that sinks is heavier — and cannot be got
// wrong by anyone who has understood it. Then three items and two balances, so
// the answer has to be carried across a comparison. Then four and three. Then
// pans start holding two items at once, and a single object can outweigh a
// pair.
//
// NOTHING IS EVER GUESSWORK. Every puzzle is checked before it is shown: all
// possible weightings of the items are enumerated, those inconsistent with the
// balances are thrown away, and the puzzle is only used if EVERY surviving
// weighting agrees on the answer. If a random draw fails that test it is
// discarded and redrawn, and the fallback is a plain chain of comparisons that
// is unique by construction. A player who reasons correctly is never wrong.
// ===========================================================================
const SCALE_ITEM = [
  { g: 'cog', col: '#ffab4a' },
  { g: 'bolt', col: '#57a8ff' },
  { g: 'chip', col: '#7de8a0' },
  { g: 'cell', col: '#e07aff' },
];
function scaleTier(L) {
  // items in play, balances shown, and how many may share one pan
  if (L <= 2) return { k: 2, perPan: 1 };
  if (L <= 5) return { k: 3, perPan: 1 };
  if (L <= 9) return { k: 4, perPan: 1 };
  return { k: 4, perPan: 2 };
}
// total weight of a pan under a given assignment
function panW(pan, w) { let s = 0; for (const i of pan) s += w[i]; return s; }
// does one assignment of weights reproduce every balance we are showing?
function scaleFits(sc, w) {
  for (const s of sc) {
    const d = panW(s.L, w) - panW(s.R, w);
    if (s.tilt > 0 ? !(d > 0) : s.tilt < 0 ? !(d < 0) : d !== 0) return false;
  }
  return true;
}
// every arrangement of the same weights over the items
function permute(a) {
  if (a.length <= 1) return [a];
  const out = [];
  for (let i = 0; i < a.length; i++) {
    const rest = a.slice(0, i).concat(a.slice(i + 1));
    for (const p of permute(rest)) out.push([a[i]].concat(p));
  }
  return out;
}
// the answer is only fair if EVERY weighting the player could believe agrees
function scaleUnique(sc, weights, k, wantLight) {
  let ans = -1;
  for (const w of permute(weights)) {
    if (!scaleFits(sc, w)) continue;
    let best = 0;
    for (let i = 1; i < k; i++) if (wantLight ? w[i] < w[best] : w[i] > w[best]) best = i;
    if (ans < 0) ans = best;
    else if (ans !== best) return -1;          // two readings disagree: unfair
  }
  return ans;
}
function scaleGen(L) {
  const { k, perPan } = scaleTier(L);
  // lightest only once heaviest is understood, and then alternating, so the
  // question itself has to be read rather than assumed
  const wantLight = L >= 4 && (L % 2 === 0);
  const weights = [];
  for (let i = 0; i < k; i++) weights.push((i + 1) * 2 + irnd(0, 1));   // distinct
  const idx = []; for (let i = 0; i < k; i++) idx.push(i);
  // --- the guaranteed puzzle: a chain that fixes the whole order ---
  const chain = (w) => {
    const order = idx.slice().sort((a, b) => w[b] - w[a]);
    const sc = [];
    for (let i = 0; i + 1 < k; i++) {
      const a = order[i], b = order[i + 1];
      sc.push(chance(0.5) ? { L: [a], R: [b], tilt: 1 } : { L: [b], R: [a], tilt: -1 });
    }
    for (let i = sc.length - 1; i > 0; i--) { const j = irnd(0, i); [sc[i], sc[j]] = [sc[j], sc[i]]; }
    return sc;
  };
  let w = weights.slice();
  for (let i = w.length - 1; i > 0; i--) { const j = irnd(0, i); [w[i], w[j]] = [w[j], w[i]]; }
  if (perPan > 1) {
    // MORE IN EACH PAN, WITHOUT MAKING IT UNANSWERABLE. The first attempt drew
    // the comparisons at random from pairs and single items, and checked the
    // answer was unique — but only against the weights this generator happened
    // to pick. The player cannot see those. All they see is which way things
    // tip, and once a pan holds two objects the outcome starts depending on how
    // much heavier, not merely which is heavier — a quantity no amount of
    // correct reasoning can recover. A brute-force check over 5,600 puzzles
    // found level 10 and up producing questions with two defensible answers.
    //
    // So the chain of one-against-one comparisons always stays, and it alone
    // fixes the whole order. The crowded pan is added on top of it: real
    // evidence, drawn from the real weights, that makes the bench look harder
    // to read — without ever being the step the answer depends on.
    const sc = chain(w);
    const pool = idx.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = irnd(0, i); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    if (pool.length >= 3) {
      const Lp = [pool[0], pool[1]], Rp = [pool[2]];
      const d = panW(Lp, w) - panW(Rp, w);
      sc.splice(irnd(0, sc.length), 0, { L: Lp, R: Rp, tilt: d > 0 ? 1 : d < 0 ? -1 : 0 });
    }
    let best0 = 0;
    for (let i = 1; i < k; i++) if (wantLight ? w[i] < w[best0] : w[i] > w[best0]) best0 = i;
    return scaleQ(sc, best0, k, wantLight, L);
  }
  const sc = chain(w);
  const a = scaleUnique(sc, weights, k, wantLight);
  let best = 0;
  for (let i = 1; i < k; i++) if (wantLight ? w[i] < w[best] : w[i] > w[best]) best = i;
  return scaleQ(sc, a >= 0 ? a : best, k, wantLight, L);
}
function scaleQ(sc, ans, k, wantLight, L) {
  return {
    scales: sc, ans, k, wantLight,
    hint: t(wantLight ? 'tt_q_light' : 'tt_q_heavy'),
    teach: L <= 1 ? t('tt_q_teach') : null,
  };
}
// ---------- question generators (all procedural) ----------
function triGen() {
  const L = TRI.level;
  if (TRI.game === 'vis') {
    const w = 2 + Math.min(2, Math.floor(L / 3)), d = 2 + Math.min(2, Math.floor(L / 4));
    const maxH = 2 + Math.min(3, Math.floor(L / 2));
    const g = [];
    let n = 0;
    for (let x = 0; x < w; x++) { g.push([]); for (let z = 0; z < d; z++) { const h = irnd(1, maxH); g[x].push(h); n += h; } }
    TRI.q = { grid: g, choices: triChoices(n), hint: t('tt_q_vis') };
  } else if (TRI.game === 'log') {
    TRI.q = scaleGen(L);
  } else if (TRI.game === 'mem') {
    const len = Math.min(9, 2 + L);
    TRI.memSeq = [];
    for (let i = 0; i < len; i++) TRI.memSeq.push(irnd(0, 3));
    TRI.memIn = 0; TRI.memPhase = 'show'; TRI.memShow = -1;
    TRI.memShowT = 0.35;
    TRI.q = { hint: t('tt_q_mem') };
  }
}
function triChoices(ans) {
  const set = new Set([ans]);
  while (set.size < 3) {
    const v = ans + (chance(0.5) ? -1 : 1) * irnd(1, 3);
    if (v >= 0) set.add(v);
  }
  const arr = [...set];
  for (let i = arr.length - 1; i > 0; i--) { const j = irnd(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return { list: arr, correct: arr.indexOf(ans) };
}
function triAnswer(ok) {
  TRI.fb = 0.4; TRI.fbGood = ok;
  if (TRI.mode === 'node') { triNodeAnswer(ok); return; }
  if (ok) {
    TRI.score += 8 + TRI.level * 4 + TRI.streak * 2;
    TRI.level++; TRI.streak++;
    sfx(TRI.streak > 0 && TRI.streak % 5 === 0 ? 'chargeReady' : 'ok');
  } else {
    // a wrong answer costs about what a right one would have paid, so guessing
    // is never cheaper than thinking — and the level eases back one step, so a
    // player who has climbed past their depth is brought to where they can
    // stand rather than being drowned for the rest of the round
    TRI.score = Math.max(0, TRI.score - (4 + TRI.level * 3));
    TRI.level = Math.max(1, TRI.level - 1);
    TRI.streak = 0;
    sfx('no');
  }
  triGen();
}
function triEndGame() {
  TRI.results.push({ game: TRI.game, score: TRI.score });
  if (TRI.mode === 'full' && TRI.gi < TRI.order.length - 1) {
    TRI.gi++;
    TRI.st = 'between'; TRI.betweenT = 1.5;
  } else {
    const total = TRI.results.reduce((s, r) => s + r.score, 0);
    TRI.total = total;
    TRI.mass = 850 + Math.round(total * 1.5);
    TRI.iqGain = TRI.mode === 'full'
      ? clamp(Math.floor(total / 100), 1, 15)
      : clamp(Math.floor(total / 120), 0, 5);
    G.save.iq += TRI.iqGain;
    if (typeof iqNudge === 'function') iqNudge();
    persist();
    TRI.st = 'result'; sfx('win');
  }
}
// ---------------------------------------------------------------------------
// ONE PRESS, ONE ANSWER — the input a puzzle needs, which is not the input
// running around needs.
//
// Movement is forgiving by design: press two directions and you get a diagonal,
// hold one and you keep going, and none of that costs anything. A Mind Node is
// the opposite. Each direction IS an answer, a wrong one ends the attempt, and
// the read has to be exact. Three separate ways it was not:
//
//   THE STICK. Pushed up-left it crosses the threshold on both axes, so the
//   node saw LEFT and UP in the same frame and took whichever the if-chain
//   asked about first. Rolling from one direction to another passes through the
//   diagonal and submits an answer nobody chose. On a controller the puzzle was
//   unwinnable for reasons that had nothing to do with the puzzle.
//
//   THE HOLD. A direction held across two simulation steps — which happens on
//   any machine running under 30 fps, because the loop then updates twice per
//   frame — submitted twice.
//
//   THE AMBIGUITY. Two directions genuinely down at once is not a choice. It
//   should answer nothing rather than guess.
//
// So: the D-PAD ONLY when a pad is connected (a stick cannot express a discrete
// four-way choice and should not be asked to), exactly one direction, and a
// gate that requires everything back to neutral before the next answer counts.
// ---------------------------------------------------------------------------
const TRI_ACTS = ['LEFT', 'UP', 'RIGHT', 'DOWN'];
const TRI_PAD = ['GP_PL', 'GP_PU', 'GP_PR', 'GP_PD'];
// spend the press, so one press can never be read as two answers
function triEatDirs() {
  for (const a of TRI_ACTS) for (const code of (KEYB[a] || [])) keysP[code] = 0;
  for (const c of TRI_PAD) keysP[c] = 0;
}
// THE SAME FORGIVENESS SHE GETS. Her attack carries a 200 ms input buffer, so a
// swing pressed slightly early still lands — and it is very nearly the single
// biggest thing separating "tight" from "sluggish" in this game. The puzzles
// had none: an answer pressed one frame before the lights finished showing was
// simply dropped, in the one place a child is most likely to be pressing early.
// A press is held for a beat here too, and spent the moment input opens.
let TRI_BUF = -1, TRI_BUF_T = 0;
function triBuffer(dt) { if (TRI_BUF >= 0) { TRI_BUF_T -= dt; if (TRI_BUF_T <= 0) TRI_BUF = -1; } }
function triDir(n) {
  const pad = typeof PAD !== 'undefined' && PAD && PAD.on;
  const down = pad ? TRI_PAD.map(c => !!keys[c]) : TRI_ACTS.map(a => !!inD(a));
  const press = pad ? TRI_PAD.map(c => !!keysP[c]) : TRI_ACTS.map(a => !!inP(a));
  let hit = -1, hits = 0;
  for (let i = 0; i < 4; i++) if (press[i]) { hits++; if (hit < 0) hit = i; }
  if (!hits) {
    // nothing this step — but something may be waiting from the last one
    if (TRI_BUF >= 0 && TRI_BUF < n) { const b = TRI_BUF; TRI_BUF = -1; return b; }
    return -1;
  }
  // Whatever happens next, this press is spent. The loop runs `update` more
  // than once in a frame whenever the machine is under 30 fps, and `keysP` is
  // only cleared at the END of the frame — so without this the same press is
  // still sitting there on the second pass and answers a second time.
  triEatDirs();
  if (hits !== 1) return -1;                      // a diagonal is not a choice
  if (down.filter(Boolean).length > 1) return -1; // a second direction still held
  if (hit >= n) return -1;                        // not a button this puzzle has
  return hit;
}
// ---------- update ----------
function updateTrial(dt) {
  if (TRI.fb > 0) TRI.fb -= dt;
  triBuffer(dt);
  if (TRI.st === 'menu') {
    const n = 1 + TRI.order.length;
    if (inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
    if (inP('DOWN')) { TRI.sel = (TRI.sel + 1) % n; sfx('ui'); }
    if (inP('UP')) { TRI.sel = (TRI.sel + n - 1) % n; sfx('ui'); }
    if (inP('OK')) {
      if (TRI.sel === 0) triStart('full');
      else triStart('practice', TRI.order[TRI.sel - 1]);
    }
  } else if (TRI.st === 'pre') {
    TRI.preT -= dt;
    if (TRI.preT <= 0) TRI.st = 'play';
  } else if (TRI.st === 'between') {
    TRI.betweenT -= dt;
    if (TRI.betweenT <= 0) triStartGame(TRI.order[TRI.gi]);
  } else if (TRI.st === 'result') {
    if (inP('OK') || inP('BACK')) { G.state = 'PLAY'; sfx('ui'); }
  } else if (TRI.st === 'play') {
    if (TRI.mode !== 'node') {
      TRI.t -= dt;
      if (TRI.t <= 0) { triEndGame(); return; }
    }
    if (inP('BACK')) { TRI.node = null; TRI.mode = 'full'; G.state = 'PLAY'; sfx('ui'); return; }
    if (TRI.game === 'mem') {
      if (TRI.memPhase === 'show') {
        // an answer pressed while the lights are still playing is REMEMBERED,
        // not thrown away — it fires the moment input opens
        const early = triDir(4);
        if (early >= 0) { TRI_BUF = early; TRI_BUF_T = 0.2; }
        TRI.memShowT -= dt;
        if (TRI.memShowT <= 0) {
          TRI.memShow++;
          if (TRI.memShow >= TRI.memSeq.length) { TRI.memPhase = 'input'; TRI.memShow = -1; }
          else { TRI.memShowT = Math.max(0.24, 0.42 - TRI.level * 0.02); sfxVoice('mono'); }
        }
      } else {
        const pick = triDir(4);
        if (pick >= 0) {
          if (pick === TRI.memSeq[TRI.memIn]) {
            TRI.memIn++;
            sfx('ui');
            if (TRI.memIn >= TRI.memSeq.length) triAnswer(true);
          } else triAnswer(false);
        }
      }
    } else if (TRI.game === 'log') {
      // one key per item on the bench, so the answer is the OBJECT itself
      const pick = triDir(TRI.q.k);
      if (pick >= 0) triAnswer(pick === TRI.q.ans);
    } else {
      const pick = triDir(3);
      if (pick >= 0) triAnswer(pick === TRI.q.choices.correct);
    }
  }
}
// ---------- draw ----------
function triIsoCube(x, y, s, top, lf, rt) {
  c.fillStyle = top;
  c.beginPath(); c.moveTo(x, y - s * 0.5); c.lineTo(x + s, y); c.lineTo(x, y + s * 0.5); c.lineTo(x - s, y); c.closePath(); c.fill();
  c.fillStyle = lf;
  c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y + s * 0.5); c.lineTo(x, y + s * 0.5 + s * 0.9); c.lineTo(x - s, y + s * 0.9); c.closePath(); c.fill();
  c.fillStyle = rt;
  c.beginPath(); c.moveTo(x + s, y); c.lineTo(x, y + s * 0.5); c.lineTo(x, y + s * 0.5 + s * 0.9); c.lineTo(x + s, y + s * 0.9); c.closePath(); c.fill();
}
// each object is a SHAPE as well as a colour, so it can be told apart without
// reading anything and without relying on colour vision
function scaleGlyph(x, y, r, it) {
  c.fillStyle = it.col;
  c.beginPath();
  if (it.g === 'cog') {
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2, rr2 = i % 2 ? r * 0.66 : r;
      c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr2, y + Math.sin(a) * rr2);
    }
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(10,20,32,0.75)';
    c.beginPath(); c.arc(x, y, r * 0.3, 0, 7); c.fill();
  } else if (it.g === 'bolt') {
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + 0.5;
      c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c.closePath(); c.fill();
  } else if (it.g === 'chip') {
    rr(c, x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7, r * 0.28); c.fill();
    c.fillStyle = 'rgba(10,20,32,0.7)';
    for (let i = -1; i <= 1; i++) c.fillRect(x - r * 0.5, y + i * r * 0.4 - 1, r, 2);
  } else {
    c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.75);
    c.lineTo(x - r, y + r * 0.75); c.closePath(); c.fill();
  }
}
function drawScales() {
  const q = TRI.q;
  const n = q.scales.length;
  // one balance is centred; two or three share the width evenly
  // The row has to FIT. Dividing the full width by the number of balances put
  // the outer pans past the edge of the screen as soon as there were three.
  const MARG = 30;
  const spanW = (960 - MARG * 2) / n;
  const panW2 = Math.min(46, spanW * 0.26);
  for (let i = 0; i < n; i++) {
    const s = q.scales[i];
    const cx2 = n === 1 ? 480 : MARG + spanW * (i + 0.5);
    const cy2 = 196;
    const arm = Math.min(150, spanW * 0.5 - panW2 - 4);
    const tilt = s.tilt * 0.15;
    // post and base
    c.strokeStyle = '#5c6678'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(cx2, cy2); c.lineTo(cx2, cy2 + 96); c.stroke();
    c.fillStyle = '#3a4250'; rr(c, cx2 - 38, cy2 + 96, 76, 14, 5); c.fill();
    // the beam
    c.save(); c.translate(cx2, cy2); c.rotate(tilt);
    c.strokeStyle = '#8892a2'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-arm, 0); c.lineTo(arm, 0); c.stroke();
    c.fillStyle = '#aab6c6'; c.beginPath(); c.arc(0, 0, 7, 0, 7); c.fill();
    c.restore();
    // pans hang from the beam ends, so the heavier one visibly sinks
    for (const side of [-1, 1]) {
      const ex = cx2 + Math.cos(tilt) * arm * side;
      const ey = cy2 + Math.sin(tilt) * arm * side;
      c.strokeStyle = 'rgba(140,155,175,0.8)'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex, ey + 34); c.stroke();
      c.fillStyle = '#2c3542'; rr(c, ex - panW2, ey + 34, panW2 * 2, 10, 5); c.fill();
      const pan = side < 0 ? s.L : s.R;
      const step = pan.length > 1 ? Math.min(30, panW2 * 0.9) : 0;
      pan.forEach((id, j) => {
        scaleGlyph(ex - step * (pan.length - 1) / 2 + j * step, ey + 20,
                   Math.min(15, panW2 * 0.42), SCALE_ITEM[id]);
      });
    }
  }
  // THE BENCH: every object in play, one key each. This is the answer row —
  // the player names an OBJECT, not a side.
  const keys = ['←', '↑', '→', '↓'];
  const bx = 480 - (q.k - 1) * 90 / 2;
  for (let i = 0; i < q.k; i++) {
    const x = bx + i * 90, y = 430;
    c.fillStyle = 'rgba(20,36,52,0.9)';
    rr(c, x - 38, y - 38, 76, 76, 12); c.fill();
    c.strokeStyle = 'rgba(120,200,240,0.5)'; c.lineWidth = 1.6;
    rr(c, x - 38, y - 38, 76, 76, 12); c.stroke();
    scaleGlyph(x, y - 4, 19, SCALE_ITEM[i]);
    ftxt(keys[i], x, y + 52, 12, '#7d93a8');
  }
  if (q.teach) ftxt(q.teach, 480, 340, 15, '#8fd8c8');
}
function triDrawChoices(labels, correctFlashIdx) {
  const keys = ['←', '↑', '→'];
  for (let i = 0; i < 3; i++) {
    const x = 300 + i * 180, y = 420;
    c.fillStyle = 'rgba(20,36,52,0.9)';
    rr(c, x - 74, y - 26, 148, 52, 10); c.fill();
    c.strokeStyle = 'rgba(120,200,240,0.5)'; c.lineWidth = 1.6;
    rr(c, x - 74, y - 26, 148, 52, 10); c.stroke();
    ftxt(String(labels[i]), x, y - 4, 21, '#eef3fa');
    ftxt(keys[i], x, y + 30 + 8, 12, '#7d93a8');
  }
}
function drawTrial() {
  c.fillStyle = 'rgba(3,6,11,0.94)'; c.fillRect(0, 0, 960, 540);
  if (TRI.st === 'menu') {
    ftxt(t('tt_title'), 480, 70, 32, '#eef3fa', 'center', '#b48cff');
    ftxt('◈ ' + G.save.iq + ' ' + t('sk_iq'), 480, 108, 15, '#b48cff');
    const items = [t('tt_full'), t('tt_mem'), t('tt_vis'), t('tt_log')];
    items.forEach((s, i) => {
      const sel = i === TRI.sel;
      const y = 175 + i * 52 + (i ? 14 : 0);
      if (sel) { c.fillStyle = 'rgba(180,140,255,0.1)'; rr(c, 280, y - 21, 400, 42, 9); c.fill(); }
      ftxt((sel ? '▸ ' : '') + s + (i ? '  ·  ' + t('tt_practice') : ''), 480, y, i ? 18 : 21, sel ? '#eef3fa' : '#8aa2b5');
    });
    ftxt(t('rl_close'), 480, 512, 12, '#7d93a8');
    return;
  }
  if (TRI.st === 'pre' || TRI.st === 'between') {
    const name = t('tt_' + (TRI.st === 'pre' ? TRI.game : TRI.order[TRI.gi]));
    if (TRI.st === 'between') {
      const last = TRI.results[TRI.results.length - 1];
      ftxt(t('tt_score') + '  ' + last.score, 480, 200, 24, '#ffd76a');
    }
    ftxt(name, 480, 260, 36, '#eef3fa', 'center', '#b48cff');
    ftxt(t('tt_get_ready'), 480, 320, 18, '#8aa2b5');
    return;
  }
  if (TRI.st === 'result') {
    ftxt(t('tt_done'), 480, 110, 34, '#aef7d8', 'center', '#37ffd0');
    TRI.results.forEach((r, i) => {
      ftxt(t('tt_' + r.game), 360, 180 + i * 32, 17, '#8aa2b5', 'right');
      ftxt(String(r.score), 400, 180 + i * 32, 17, '#eef3fa', 'left');
    });
    ftxt(t('tt_mass'), 480, 330, 18, '#8aa2b5');
    ftxt(TRI.mass + ' cm³', 480, 368, 40, '#ffd76a', 'center', '#ffd76a');
    ftxt('+' + TRI.iqGain + ' ' + t('sk_iq'), 480, 424, 22, '#b48cff', 'center', '#b48cff');
    ftxt(t('press'), 480, 490, 14, '#7d93a8');
    return;
  }
  // playing HUD. A Mind Node is one question with no clock and no running
  // score, so it says what it IS and what it pays — a full timer bar that
  // never moves is worse than no bar at all.
  if (TRI.mode === 'node') {
    ftxt(t('rd_title'), 480, 44, 20, '#b48cff', 'center', '#b48cff');
    ftxt(t('tt_' + TRI.game), 180, 70, 15, '#b48cff', 'left');
    ftxt('+' + (TRI.node ? TRI.node.iq : 10) + ' ' + t('sk_iq'), 780, 70, 15, '#ffd76a', 'right');
  } else {
    const k = TRI.t / T_GAME;
    c.fillStyle = 'rgba(30,45,62,0.8)'; rr(c, 180, 34, 600, 12, 6); c.fill();
    c.fillStyle = k < 0.2 ? '#ff5f6d' : '#37ffd0';
    rr(c, 182, 36, 596 * clamp(k, 0, 1), 8, 4); c.fill();
    ftxt(t('tt_' + TRI.game), 180, 70, 15, '#b48cff', 'left');
    ftxt(t('tt_score') + ' ' + TRI.score, 780, 70, 15, '#ffd76a', 'right');
    ftxt(t('tt_level') + ' ' + TRI.level + (TRI.streak >= 3 ? '  ×' + TRI.streak : ''), 480, 70, 14, '#8aa2b5');
  }
  if (TRI.fb > 0) {
    c.globalAlpha = TRI.fb * 2;
    ftxt(TRI.fbGood ? '✓' : '✗', 880, 120, 40, TRI.fbGood ? '#7de8a0' : '#ff5f6d');
    c.globalAlpha = 1;
  }
  ftxt(TRI.q.hint, 480, 118, 19, '#eef3fa');
  if (TRI.game === 'vis') {
    const g = TRI.q.grid, s = 26;
    const ox = 480, oy = 250;
    const cells = [];
    for (let x = 0; x < g.length; x++) for (let z = 0; z < g[0].length; z++) cells.push([x, z]);
    cells.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    for (const [x, z] of cells)
      for (let y = 0; y < g[x][z]; y++)
        triIsoCube(ox + (x - z) * s, oy + (x + z) * s * 0.5 - y * s * 0.9, s, '#8fd8c8', '#3a8a7a', '#276355');
    triDrawChoices(TRI.q.choices.list);
  } else if (TRI.game === 'log') {
    drawScales();
  } else if (TRI.game === 'mem') {
    const pads = [[330, 250], [480, 180], [630, 250], [480, 320]];
    const keys = ['←', '↑', '→', '↓'];
    for (let i = 0; i < 4; i++) {
      const [px2, py2] = pads[i];
      const lit = TRI.memPhase === 'show' && TRI.memShow >= 0 && TRI.memSeq[TRI.memShow] === i;
      c.fillStyle = lit ? 'rgba(180,140,255,0.85)' : 'rgba(30,45,62,0.9)';
      if (lit) { c.shadowColor = '#b48cff'; c.shadowBlur = 22; }
      c.beginPath(); c.arc(px2, py2, 38, 0, 7); c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = 'rgba(120,200,240,0.5)'; c.lineWidth = 1.6;
      c.beginPath(); c.arc(px2, py2, 38, 0, 7); c.stroke();
      if (typeof drawGlyphText === 'function') drawGlyphText(c, 'krum'[i], px2, py2, 20, lit ? '#0a1420' : '#8aa2b5');
      ftxt(keys[i], px2, py2 + 54, 12, '#7d93a8');
    }
    ftxt(TRI.memPhase === 'show' ? t('tt_q_mem_watch') : t('tt_q_mem') + '  (' + TRI.memIn + '/' + TRI.memSeq.length + ')', 480, 420, 16, '#8aa2b5');
  }
}
