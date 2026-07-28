// CLAWBYTE — Cognition Trials: original brain-training mini-games
// (mechanics in the classic genre tradition; all content, art and names ours)
// 4 categories: Calculation, Memory, Visual, Logic · 45s rounds ·
// difficulty ramps per correct answer · Full Trial → Mind Volume + IQ.
const T_GAME = 45;
const TRI = {
  st: 'menu', sel: 0, mode: 'full', order: ['calc', 'mem', 'vis', 'log'],
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
// ---------- question generators (all procedural) ----------
function triGen() {
  const L = TRI.level;
  if (TRI.game === 'calc') {
    let a, b, c, txt, ans;
    const big = 8 + L * 4;
    if (L >= 6 && chance(0.5)) {
      a = irnd(3, big); b = irnd(2, 12); const d = irnd(1, a + b - 1);
      ans = a + b - d;
      txt = a + ' + ' + b + ' − ? = ' + d;
    } else if (L >= 3 && chance(0.5)) {
      a = irnd(2, 4 + Math.min(8, L)); ans = irnd(2, 4 + Math.min(8, L)); c = a * ans;
      txt = a + ' × ? = ' + c;
    } else if (chance(0.5)) {
      a = irnd(2, big); ans = irnd(1, a - 1);
      txt = a + ' − ? = ' + (a - ans);
    } else {
      a = irnd(1, big); ans = irnd(1, big);
      txt = a + ' + ? = ' + (a + ans);
    }
    TRI.q = { txt, choices: triChoices(ans), hint: t('tt_q_calc') };
  } else if (TRI.game === 'vis') {
    const w = 2 + Math.min(2, Math.floor(L / 3)), d = 2 + Math.min(2, Math.floor(L / 4));
    const maxH = 2 + Math.min(3, Math.floor(L / 2));
    const g = [];
    let n = 0;
    for (let x = 0; x < w; x++) { g.push([]); for (let z = 0; z < d; z++) { const h = irnd(1, maxH); g[x].push(h); n += h; } }
    TRI.q = { grid: g, choices: triChoices(n), hint: t('tt_q_vis') };
  } else if (TRI.game === 'log') {
    const W = { gear: 5, bolt: 3, chip: 1 };
    const mk = nMax => {
      const s = { gear: irnd(0, nMax), bolt: irnd(0, nMax), chip: irnd(0, nMax) };
      if (!s.gear && !s.bolt && !s.chip) s.chip = 1;
      return s;
    };
    const nMax = 2 + Math.min(3, Math.floor(L / 2));
    let left, right, dl, dr, tries = 0;
    do {
      left = mk(nMax); right = mk(nMax);
      dl = left.gear * W.gear + left.bolt * W.bolt + left.chip * W.chip;
      dr = right.gear * W.gear + right.bolt * W.bolt + right.chip * W.chip;
      tries++;
    } while (tries < 20 && Math.abs(dl - dr) > Math.max(2, 9 - L));
    const ans = dl > dr ? 0 : (dl < dr ? 2 : 1);
    TRI.q = { left, right, W, ans, labels: [t('tt_left'), t('tt_equal'), t('tt_right')], hint: t('tt_q_log') };
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
  if (ok) {
    TRI.score += 8 + TRI.level * 4 + TRI.streak * 2;
    TRI.level++; TRI.streak++;
    sfx(TRI.streak > 0 && TRI.streak % 5 === 0 ? 'chargeReady' : 'ok');
  } else {
    TRI.score = Math.max(0, TRI.score - 6);
    TRI.streak = 0;
    sfx('no');
  }
  triGen();
}
function triEndGame() {
  TRI.results.push({ game: TRI.game, score: TRI.score });
  if (TRI.mode === 'full' && TRI.gi < 3) {
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
    persist();
    TRI.st = 'result'; sfx('win');
  }
}
// ---------- update ----------
function updateTrial(dt) {
  if (TRI.fb > 0) TRI.fb -= dt;
  if (TRI.st === 'menu') {
    const n = 5;
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
    TRI.t -= dt;
    if (TRI.t <= 0) { triEndGame(); return; }
    if (inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
    if (TRI.game === 'mem') {
      if (TRI.memPhase === 'show') {
        TRI.memShowT -= dt;
        if (TRI.memShowT <= 0) {
          TRI.memShow++;
          if (TRI.memShow >= TRI.memSeq.length) { TRI.memPhase = 'input'; TRI.memShow = -1; }
          else { TRI.memShowT = Math.max(0.24, 0.42 - TRI.level * 0.02); sfxVoice('mono'); }
        }
      } else {
        let pick = -1;
        if (inP('LEFT')) pick = 0; else if (inP('UP')) pick = 1;
        else if (inP('RIGHT')) pick = 2; else if (inP('DOWN')) pick = 3;
        if (pick >= 0) {
          if (pick === TRI.memSeq[TRI.memIn]) {
            TRI.memIn++;
            sfx('ui');
            if (TRI.memIn >= TRI.memSeq.length) triAnswer(true);
          } else triAnswer(false);
        }
      }
    } else {
      let pick = -1;
      if (inP('LEFT')) pick = 0; else if (inP('UP')) pick = 1; else if (inP('RIGHT')) pick = 2;
      if (pick >= 0) {
        const correct = TRI.game === 'log' ? TRI.q.ans : TRI.q.choices.correct;
        triAnswer(pick === correct);
      }
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
    const items = [t('tt_full'), t('tt_calc'), t('tt_mem'), t('tt_vis'), t('tt_log')];
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
  // playing HUD
  const k = TRI.t / T_GAME;
  c.fillStyle = 'rgba(30,45,62,0.8)'; rr(c, 180, 34, 600, 12, 6); c.fill();
  c.fillStyle = k < 0.2 ? '#ff5f6d' : '#37ffd0';
  rr(c, 182, 36, 596 * clamp(k, 0, 1), 8, 4); c.fill();
  ftxt(t('tt_' + TRI.game), 180, 70, 15, '#b48cff', 'left');
  ftxt(t('tt_score') + ' ' + TRI.score, 780, 70, 15, '#ffd76a', 'right');
  ftxt(t('tt_level') + ' ' + TRI.level + (TRI.streak >= 3 ? '  ×' + TRI.streak : ''), 480, 70, 14, '#8aa2b5');
  if (TRI.fb > 0) {
    c.globalAlpha = TRI.fb * 2;
    ftxt(TRI.fbGood ? '✓' : '✗', 880, 120, 40, TRI.fbGood ? '#7de8a0' : '#ff5f6d');
    c.globalAlpha = 1;
  }
  ftxt(TRI.q.hint, 480, 118, 19, '#eef3fa');
  if (TRI.game === 'calc') {
    ftxt(TRI.q.txt, 480, 240, 52, '#eef3fa', 'center', '#4db8ff');
    triDrawChoices(TRI.q.choices.list);
  } else if (TRI.game === 'vis') {
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
    const q = TRI.q;
    const dl = q.left.gear * 5 + q.left.bolt * 3 + q.left.chip;
    const dr = q.right.gear * 5 + q.right.bolt * 3 + q.right.chip;
    const tilt = clamp((dr - dl) * 0.015, -0.12, 0.12);
    c.save(); c.translate(480, 210); c.rotate(tilt);
    c.strokeStyle = '#8892a2'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-190, 0); c.lineTo(190, 0); c.stroke();
    c.restore();
    c.strokeStyle = '#5c6678'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(480, 210); c.lineTo(480, 300); c.stroke();
    c.fillStyle = '#3a4250'; rr(c, 440, 300, 80, 16, 5); c.fill();
    const pan = (cx2, side) => {
      const py = 210 + Math.sin(tilt) * (side === 'l' ? 190 : -190) * -1 + 40;
      c.fillStyle = '#2c3542'; rr(c, cx2 - 85, py, 170, 14, 6); c.fill();
      const s2 = side === 'l' ? TRI.q.left : TRI.q.right;
      let ix = cx2 - 70;
      const item = (n, color, r2, wtxt) => {
        for (let i = 0; i < n; i++) {
          c.fillStyle = color; c.beginPath(); c.arc(ix + 10, py - r2, r2, 0, 7); c.fill();
          ftxt(wtxt, ix + 10, py - r2 + 1, 9, '#0a1420');
          ix += r2 * 2 + 6;
        }
      };
      item(s2.gear, '#ffab4a', 13, '5');
      item(s2.bolt, '#57a8ff', 10, '3');
      item(s2.chip, '#7de8a0', 7, '1');
    };
    pan(290, 'l'); pan(670, 'r');
    triDrawChoices(TRI.q.labels);
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
