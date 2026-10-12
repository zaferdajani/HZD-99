// CRESTS THAT CHANGE HOW SHE FIGHTS (handoff Part 2 C1), against the real build.
//
// The owner, 2026-10-12: "expensive crests should change how she fights, give
// her something tangible that helps in the game... applicable for all weapons,
// whether it's claw, sword, double sword, etc." Every seal of two or more
// sockets carries an attack block (CREST_ATTACK, js/game.js). This swings
// every block with every weapon form — bare claws, single sword, twin blades,
// the joined blade — through the real input at a real dummy and measures, each
// against the same weapon with no seal:
//
//   1. the swing's active window and her recovery (the stated t and cd)
//   2. the cut's reach (its far edge) and width (the stated R and half), off the box,
//      and PROVEN at the edge: a dummy just inside the seal's reach is struck
//      and one just outside it is not
//   3. the knockback and hit-stop the blow gives (the stated kb and freeze)
//   4. the step into each beat and her own recoil (phantom's lunge, ground's
//      planted feet), the two-beat string (nine), the diagonal pogo (plate)
//   5. that the drawn cut changes: the seal's edge is on the slash layer, its
//      rim lands at the cut's reach, it wears the seal's tint, and it is drawn
//      by the real game frame — and no edge at all without a seal
//   6. ONE STYLE AT A TIME: two seals worn, the rule stated in Gear holds
//   7. the words: every line in all five languages, on the item card, the
//      Gear screen (with the style note) and the shop
//   8. the numbers in docs/CRESTS.md are the numbers in the code, and every
//      tint stays clear of the registry's reserved hues (ΔE > 30)
//   9. NOSTOS's hero swings through the same block
//
//   node tests/crestfight.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

let bad = 0;
const check = (name, ok, note) => { console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (note ? '  ' + note : '')); if (!ok) bad++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// ΔE (CIE76), as tests/loadout.cjs measures the registry
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function lab([r, g, b]) {
  const f = v => { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; };
  r = f(r); g = f(g); b = f(b);
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, y = r * 0.2126 + g * 0.7152 + b * 0.0722, z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const q = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  x = q(x); y = q(y); z = q(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const dE = (a, b) => { const A = lab(hex(a)), B = lab(hex(b)); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };

const MODES = ['claws', 'single', 'dual', 'joined'];

(async () => {
  console.log('── crestfight — the expensive seals change how she fights, with every weapon, and she can see it\n');
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function' && typeof CREST_ATTACK !== 'undefined', { timeout: 30000 });

  const r = await p.evaluate(async (MODES) => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.flags.heal = 1;
    sv.abil = { dash: 1 }; G.save = sv; startGame(sv); loadRoom('A1');
    await new Promise(k => setTimeout(k, 1500));
    const DT = 1 / 60;
    const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyX', 'KeyU', 'ShiftLeft'];
    const clear = () => { for (const k of KEYS) { keys[k] = 0; keysP[k] = 0; } };
    clear();
    for (let i = 0; i < 90; i++) { update(DT); G.dialog = null; G.state = 'PLAY'; }
    const home = { x: player.x, y: player.y };
    const BLOCKS = JSON.parse(JSON.stringify(CREST_ATTACK));
    const SEALS = Object.keys(BLOCKS);

    const reset = (c) => {
      clear();
      const s = G.save;
      s.diff = 1; s.equip = (c.crests || []).slice(); s.relics = []; s.skills = []; s.flags.resolve = 0;
      const m = c.mode || 'claws';
      s.flags.crystal = m !== 'claws' ? 1 : 0;
      s.flags.crystal2 = (m === 'dual' || m === 'joined') ? 1 : 0;
      s.flags.connector = m === 'joined' ? 1 : 0;
      s.weaponMode = m;
      Object.assign(player, { x: home.x, y: c.y != null ? c.y : home.y, vx: 0, vy: 0, on: !c.air,
        face: 1, faceVis: 1, swing: null, swingVis: null, atkCD: 0, atkBuf: 0, combo: 0, comboT: 0, chargeT: 0,
        swirlT: 0, swirlTick: 0, swirlHits: 0, clawT: 0, volts: 99, iT: 999, grap: null, grapCD: 0, grapAir: 0,
        dashT: 0, pogoT: 0, downBuf: 0, healT: 0, guardT: 0, stunT: 0, dizzyT: 0, scratchWake: null });
      G.boomer = null; G.enemies.length = 0; G.projs.length = 0; G.hitStop = 0;
    };
    // a dummy whose HURT box sits at (hx, hy) with size w x h
    const dummy = (hx, hy, w, h) => {
      const e = new Enemy('crawler', 0, 0);
      e.hp = e.hpMax = 99999; e.vx = 0; e.vy = 0; e.update = function () {};
      e.w = w || e.w; e.h = h || e.h;
      const hb = hurtBoxOf(e); const ox = hb.x - e.x, oy = hb.y - e.y;
      e.x = hx - ox; e.y = hy - oy;
      G.enemies.push(e); return e;
    };
    const pcx = () => player.x + player.w / 2, pcy = () => player.y + player.h / 2;
    const press = (down) => { keys.KeyX = 1; keysP.KeyX = 1; if (down) keys.ArrowDown = 1; };
    const release = () => { keysP.KeyX = 0; keys.KeyX = 0; };

    // ---- one swing, measured ------------------------------------------------
    const swingStats = (c) => {
      reset(c);
      if (c.combo) { player.combo = c.combo - 1; player.comboT = 0.5; }
      // no dummy first: the bare numbers of the beat
      press(); player.update(DT); release();
      const s = player.swing;
      const out = { crest: s && s.crest || null, combo: s && s.combo, atkCD: +player.atkCD.toFixed(4),
        t0: s ? s.t0 : 0, step: +player.vx.toFixed(2) };
      const hb = player.hitbox();
      out.R = +hb.R.toFixed(3); out.half = +hb.half.toFixed(3);
      out.reach = +(hb.x + hb.w - pcx()).toFixed(2); out.width = +hb.h.toFixed(2);
      out.shape = swingShapeId(s);
      // the active window, counted in steps of the real update
      let n = 1; while (player.swing && player.swing.t > 0 && n < 60) { player.update(DT); n++; }
      out.active = +(n * DT).toFixed(4);
      // ...the cut it drew, captured mid-swing on a clean canvas (below)
      return out;
    };
    // the blow: knockback, hit-stop and her own recoil on contact
    const blowStats = (c) => {
      reset(c);
      if (c.combo) { player.combo = c.combo - 1; player.comboT = 0.5; }
      const e = dummy(player.x + player.w + 2, pcy() - 10, 12, 20);
      press(); G.hitStop = 0;
      player.update(DT); release();
      const hit = e.hp < 99999;
      return { hit, kb: +e.vx.toFixed(2), hs: +(G.hitStop || 0).toFixed(4), vx: +player.vx.toFixed(2) };
    };
    // reach at the edge: a thin dummy on the aim line at `dx` past her centre;
    // she is pinned so a lunge cannot walk the edge onto it
    // (placed once the swing has begun, against her body where the first step
    // left it: the step into the beat is part of the beat, not of the reach)
    const probe = (c, dx) => {
      reset(c);
      press(); player.update(DT); release();
      const x0 = player.x; player.vx = 0;
      const e = dummy(pcx() + dx - 2, pcy() - 3, 4, 6);
      for (let i = 0; i < 20; i++) { if (!player.swing || player.swing.t <= 0) break; player.update(DT); player.x = x0; player.vx = 0; }
      return e.hp < 99999;
    };
    // the drawn cut: the slash layer for one swing, mid-cut, on a clean canvas
    const cutStats = (c) => {
      reset(c);
      press(); player.update(DT); release();
      for (let i = 0; i < 4; i++) player.update(DT);
      // only the slash layer's own work: no body pass ran, so nothing else is queued
      player._slashScratch = false; player._slashMarks = null;
      const cv = document.createElement('canvas'); cv.width = 520; cv.height = 360;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#000'; cx.fillRect(0, 0, 520, 360);
      const ox = 260 - pcx(), oy = 180 - pcy();
      cx.save(); cx.translate(ox, oy);
      G.slashPasses = null; QUAL.glow = false;
      drawSlashLayer(cx, player);
      cx.restore();
      const passes = (G.slashPasses || []).slice();
      const ang = player.swingVis ? player.swingVis.ang : 0, ux = Math.cos(ang), uy = Math.sin(ang);
      const read = () => {
        const d = cx.getImageData(0, 0, 520, 360).data;
        let n = 0, far = 0, sr = 0, sg = 0, sb = 0;
        for (let y = 0; y < 360; y++) for (let x = 0; x < 520; x++) {
          const i = (y * 520 + x) * 4, v = d[i] + d[i + 1] + d[i + 2];
          if (v < 60) continue;
          n++; sr += d[i]; sg += d[i + 1]; sb += d[i + 2];
          const along = (x + 0.5 - 260) * ux + (y + 0.5 - 180) * uy;
          if (along > far) far = along;
        }
        return { n, far: +far.toFixed(1), rgb: n ? [sr / n, sg / n, sb / n].map(v => +v.toFixed(1)) : null };
      };
      const base = read();
      // ...and with the glow copy: a halo round the stroke, never a second rim past the reach
      cx.fillStyle = '#000'; cx.fillRect(0, 0, 520, 360);
      cx.save(); cx.translate(ox, oy); QUAL.glow = true;
      if (player.swingVis) { player._slashScratch = false; player._slashMarks = null; drawSlashLayer(cx, player); }
      cx.restore();
      const lit = read();
      return { passes: passes.filter(q => q.layer === 'crest').length, n: base.n, far: base.far, rgb: base.rgb,
        glowN: lit.n, glowFar: lit.far, reach: player.swingVis && player.swingVis.reach };
    };

    const out = { blocks: BLOCKS, seals: SEALS, cases: [] };
    for (const mode of MODES) {
      const base = { swing: [0, 1, 2].map(k => swingStats({ mode, combo: k })), blow: [0, 2].map(k => blowStats({ mode, combo: k })),
        cut: cutStats({ mode }) };
      for (const id of SEALS) {
        const c = { mode, crests: [id] };
        const rec = { mode, id, base,
          swing: [0, 1, 2].map(k => swingStats(Object.assign({ combo: k }, c))),
          blow: [0, 2].map(k => blowStats(Object.assign({ combo: k }, c))),
          cut: cutStats(c) };
        // reach at the edge, for the opener
        const edge = rec.swing[0].reach, edge0 = base.swing[0].reach;
        rec.probe = { inSeal: probe(c, edge - 3), outSeal: probe(c, edge + 3),
          baseAtSealIn: probe({ mode }, edge - 3), baseAtSealOut: probe({ mode }, edge + 3), edge, edge0 };
        out.cases.push(rec);
      }
    }

    // ---- the string: jab, jab, finisher — or the two-beat ---------------------
    const chain = (c) => {
      reset(c);
      const seq = [];
      for (let k = 0; k < 4; k++) {
        press(); player.update(DT); release();
        seq.push(player.swing ? player.swing.combo : -1);
        for (let i = 0; i < 60 && player.atkCD > 0; i++) player.update(DT);
      }
      return seq;
    };
    out.chain = {};
    for (const mode of MODES) out.chain[mode] = { base: chain({ mode }), nine: chain({ mode, crests: ['nine'] }) };

    // ---- the plunge: straight down, or the plate's diagonal pogo -----------------
    const plunge = (c) => {
      reset(Object.assign({ air: true, y: home.y - 90 }, c));
      // a dummy below her and AHEAD: where a 45-degree strike lands and a
      // straight-down one does not
      const e = dummy(pcx() + 60, player.y + player.h + 24, 18, 18);
      keys.ArrowDown = 1;
      let s0 = null, pogo = false, fwd = 0;
      for (let i = 0; i < 10; i++) {
        if (i === 0) { keys.KeyX = 1; keysP.KeyX = 1; }
        player.update(DT); keysP.KeyX = 0; keys.KeyX = 0;
        if (!s0 && player.swing) s0 = { ax: player.swing.ax, ay: player.swing.ay, shape: swingShapeId(player.swing) };
        if (player.vy < -500) { pogo = true; fwd = Math.max(fwd, player.vx); }
      }
      clear();
      return { s0, hit: e.hp < 99999, pogo, fwd: +fwd.toFixed(1) };
    };
    out.plunge = {};
    for (const mode of MODES) out.plunge[mode] = { base: plunge({ mode }), plate: plunge({ mode, crests: ['plate'] }) };

    // ---- one style at a time ------------------------------------------------------
    const PAIRS = [['claws', 'nine'], ['plate', 'claws'], ['claws', 'plate'], ['sprint', 'claws'], ['siphon', 'sprint'], ['over', 'ground', 'nine']];
    out.pairs = PAIRS.map(eq => {
      const st = swingStats({ mode: 'claws', crests: eq });
      return { eq, crest: st.crest, far: st.reach, rule: crestStyle({ equip: eq }) };
    });

    // ---- the drawn cut through the REAL frame (the game loop, real key events) ---
    const frames = async n => { for (let i = 0; i < n; i++) await new Promise(k => requestAnimationFrame(k)); };
    out.live = {};
    for (const mode of MODES) {
      for (const crests of [[], ['plate']]) {
        reset({ mode, crests }); G.state = 'PLAY'; await frames(6);
        player.atkCD = 0; player.comboT = 0;
        dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' })); await frames(1);
        dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyX' }));
        let crestPasses = 0, framesCut = 0;
        for (let i = 0; i < 16; i++) {
          G.slashPasses = null; await frames(1);
          if (G.slashPasses && G.slashPasses.length) { framesCut++; crestPasses += G.slashPasses.filter(q => q.layer === 'crest').length; }
        }
        out.live[mode + (crests.length ? '+plate' : '')] = { framesCut, crestPasses };
        await frames(20);
      }
    }
    G.state = 'PLAY';

    // ---- the words ------------------------------------------------------------------
    const LANGS5 = ['en', 'ar', 'tr', 'zh', 'ru'];
    const keep = LANG;
    out.words = {};
    for (const L of LANGS5) {
      LANG = L;
      const w = {};
      for (const id of SEALS) w[id] = { line: t('cf_' + id), short: t('cfs_' + id), card: crestCardText(id) };
      w._style = t('cf_style'); w._active = t('cf_active'); w._held = t('cf_held');
      out.words[L] = w;
    }
    // the Gear screen, drawn: the selected seal's line and the style note on its row
    const spyDraw = (fn) => {
      const seen = [], o = window.ftxt;
      window.ftxt = function (s, ...a) { seen.push(String(s)); return o.call(this, s, ...a); };
      try { fn(); } finally { window.ftxt = o; }
      return seen;
    };
    out.gear = {};
    for (const L of LANGS5) {
      LANG = L;
      G.save.crests = ['claws', 'plate', 'sprint']; G.save.equip = ['claws', 'plate'];
      const rows = gearRows(G.save);
      G.crestIdx = rows.findIndex(x => x.id === 'plate');
      const seen = spyDraw(() => drawGear());
      const fight = t('cf_plate'), firstWord = fight.slice(0, 12);
      out.gear[L] = {
        fightShown: seen.some(s => s.indexOf(firstWord) >= 0),
        active: seen.some(s => s.indexOf(t('cf_active')) >= 0),
        held: seen.some(s => s.indexOf(t('cf_held').replace('%s', t(crestNameKey('claws')))) >= 0),
        widest: Math.max(...seen.map(s => { c.font = '700 14px "Segoe UI", Tahoma, sans-serif'; return c.measureText(s).width; })),
      };
      // the shop line names the style
      const shop = spyDraw(() => drawShop());
      out.gear[L].shop = shop.some(s => s.indexOf(t('cfs_plate')) >= 0 && s.indexOf(t('cf_style')) >= 0);
    }
    LANG = keep;
    // the item card that hands a seal over
    G.dialog = null; G.state = 'PLAY';
    if (typeof overlayRequest === 'function') { /* the card may queue: read it from showItem */ }
    const oShow = window.showItem; let cardDesc = null;
    window.showItem = function (name, desc, ...a) { cardDesc = desc; return oShow.call(this, name, desc, ...a); };
    try { grantCrest('plate'); } finally { window.showItem = oShow; }
    out.card = { desc: cardDesc, want: t('cf_plate') };
    G.dialog = null; G.state = 'PLAY';

    // ---- hit shapes stay inside their boxes ---------------------------------------------
    out.shapes = [];
    for (const id of SEALS) for (const mode of MODES) for (const combo of [0, 2]) for (const [ax, ay] of [[1, 0], [-1, 0], [0, -1], [1, 1]]) {
      const w = mode === 'joined' ? 2 : mode === 'claws' ? 0 : 1;
      player.swing = { ax, ay, combo, wield: w, twin: mode === 'dual', t: 0.1, set: new Set(), crest: id };
      const hb = player.hitbox(), poly = swingShape(player.swing, hb);
      const inside = poly.every(([x, y]) => x >= hb.x - 0.01 && x <= hb.x + hb.w + 0.01 && y >= hb.y - 0.01 && y <= hb.y + hb.h + 0.01);
      const area = Math.abs(poly.reduce((a, q, i) => { const z = poly[(i + 1) % poly.length]; return a + q[0] * z[1] - z[0] * q[1]; }, 0) / 2);
      out.shapes.push({ id, mode, combo, ax, ay, inside, fill: +(area / (hb.w * hb.h)).toFixed(3), shape: swingShapeId(player.swing) });
    }
    player.swing = null;
    reset({}); clear();
    return out;
  }, MODES);

  const B = r.blocks;
  console.log('  seals with an attack block (2+ sockets): ' + r.seals.join(', '));

  // ---- 1-3. per seal, per weapon --------------------------------------------------------
  console.log('\n  AS PLAYED  (opener, vs the same weapon with no seal)');
  console.log('  ' + 'seal'.padEnd(8) + 'weapon'.padEnd(8) + 'active'.padStart(8) + 'recov'.padStart(8) + 'reach'.padStart(8) + 'width'.padStart(8)
    + 'kb'.padStart(8) + 'stop'.padStart(8) + 'step'.padStart(8) + 'cut px'.padStart(8) + 'rim'.padStart(7));
  for (const mode of MODES) {
    const base = r.cases.find(x => x.mode === mode).base;
    const s0 = base.swing[0], b0 = base.blow[0];
    console.log('  ' + '-'.padEnd(8) + mode.padEnd(8) + String(s0.active).padStart(8) + String(s0.atkCD).padStart(8) + String(s0.reach).padStart(8)
      + String(s0.width).padStart(8) + String(b0.kb).padStart(8) + String(b0.hs).padStart(8) + String(s0.step).padStart(8) + String(base.cut.n).padStart(8) + '-'.padStart(7));
  }
  const failsBy = {};
  const note = (id, mode, what) => { (failsBy[id + ' ' + mode] = failsBy[id + ' ' + mode] || []).push(what); };
  for (const x of r.cases) {
    const k = B[x.id], s0 = x.swing[0], b0 = x.blow[0];
    console.log('  ' + x.id.padEnd(8) + x.mode.padEnd(8) + String(s0.active).padStart(8) + String(s0.atkCD).padStart(8) + String(s0.reach).padStart(8)
      + String(s0.width).padStart(8) + String(b0.kb).padStart(8) + String(b0.hs).padStart(8) + String(s0.step).padStart(8) + String(x.cut.n).padStart(8) + String(x.cut.far).padStart(7));
    const over = x.id === 'over' ? 0.7 : 1;     // Overclock's own passive, kept
    for (let i = 0; i < 3; i++) {
      const s = x.swing[i], bs = x.base.swing[i];
      if (s.crest !== x.id) note(x.id, x.mode, 'beat ' + i + ' swung as ' + s.crest);
      if (!near(s.t0, 0.15 * k.t, 1e-6)) note(x.id, x.mode, 'active window ' + s.t0 + ' != ' + 0.15 * k.t);
      if (!near(s.active, s.t0, 1 / 60 + 1e-3)) note(x.id, x.mode, 'measured active ' + s.active + ' vs its window ' + s.t0);
      // recovery follows the beat the seal actually swung (the two-beat seal jumps to the finisher)
      const want = [0.26, 0.23, 0.33][s.combo] * over * k.cd;
      if (!near(s.atkCD, want, 1e-3)) note(x.id, x.mode, 'beat ' + i + ' recovery ' + s.atkCD + ' != ' + want.toFixed(4));
      if (s.combo === bs.combo) {
        // reach is the FAR EDGE (R + half): where the cut stops
        const fe = (s.R + s.half) / (bs.R + bs.half);
        if (!near(fe, k.R, 1e-3)) note(x.id, x.mode, 'beat ' + i + ' reach (far edge) x' + fe.toFixed(3) + ' != ' + k.R);
        if (!near(s.half / bs.half, k.half, 1e-3)) note(x.id, x.mode, 'beat ' + i + ' width x' + (s.half / bs.half).toFixed(3) + ' != ' + k.half);
        const wantShape = (k.shape && k.shape[bs.shape]) || bs.shape;
        if (s.shape !== wantShape) note(x.id, x.mode, 'beat ' + i + ' shape ' + s.shape + ' != ' + wantShape);
      }
    }
    // knockback, hit-stop and recoil on the opener and the finisher
    for (let i = 0; i < 2; i++) {
      const bl = x.blow[i], bb = x.base.blow[i];
      if (!bl.hit || !bb.hit) { note(x.id, x.mode, 'blow ' + i + ' did not land'); continue; }
      if (x.id !== 'nine' || i === 0) {
        if (!near(bl.kb / bb.kb, k.kb, 0.01)) note(x.id, x.mode, 'blow ' + i + ' kb x' + (bl.kb / bb.kb).toFixed(3) + ' != ' + k.kb);
        if (!near(bl.hs / bb.hs, k.freeze, 0.01)) note(x.id, x.mode, 'blow ' + i + ' hit-stop x' + (bl.hs / bb.hs).toFixed(3) + ' != ' + k.freeze);
      }
    }
    // the step into the beat (on the ground, level) and the recoil on contact
    const st = x.swing[0].step, bst = x.base.swing[0].step;
    if (!near(st, bst * k.step, 0.05)) note(x.id, x.mode, 'step ' + st + ' != ' + bst + ' x ' + k.step);
    const recoil = x.swing[0].step - x.blow[0].vx, recoil0 = x.base.swing[0].step - x.base.blow[0].vx;
    if (!near(recoil, recoil0 * k.recoil, 0.05)) note(x.id, x.mode, 'recoil ' + recoil.toFixed(2) + ' != ' + recoil0.toFixed(2) + ' x ' + k.recoil);
    // reach at the edge, through real input
    const pr = x.probe;
    if (!pr.inSeal) note(x.id, x.mode, 'a dummy 3 px inside the seal\'s reach (' + pr.edge + ') was missed');
    if (pr.outSeal) note(x.id, x.mode, 'a dummy 3 px outside the seal\'s reach (' + pr.edge + ') was struck');
    if (pr.edge > pr.edge0 + 6 && pr.baseAtSealIn) note(x.id, x.mode, 'without the seal the same far dummy was struck too');
    if (pr.edge < pr.edge0 - 6 && !pr.baseAtSealOut) note(x.id, x.mode, 'without the seal the dummy past the short edge was missed too');
    // the drawn cut
    const cut = x.cut, tint = hex(k.tint);
    if (!cut.passes || cut.n < 40) note(x.id, x.mode, 'no seal edge on the slash layer (' + cut.passes + ' passes, ' + cut.n + ' px)');
    else {
      if (!near(cut.far, cut.reach, 4)) note(x.id, x.mode, 'the edge\'s rim at ' + cut.far + ', the cut reaches ' + cut.reach);
      if (!(cut.glowN > cut.n && cut.glowFar <= cut.reach + 12)) note(x.id, x.mode, 'the glow copy: ' + cut.glowN + ' px (base ' + cut.n + '), rim ' + cut.glowFar + ' vs reach ' + cut.reach);
      const nv = v => { const m = Math.hypot(...v); return v.map(q => q / m); };
      const cos = nv(cut.rgb).reduce((a, q, i) => a + q * nv(tint)[i], 0);
      if (cos < 0.985) note(x.id, x.mode, 'the edge is not in its tint ' + k.tint + ' (mean ' + cut.rgb.join(',') + ', cos ' + cos.toFixed(3) + ')');
    }
  }
  const baseCuts = MODES.map(m => r.cases.find(x => x.mode === m).base.cut);
  for (const id of r.seals) for (const mode of MODES) {
    const f = failsBy[id + ' ' + mode];
    check(id + ' x ' + mode + ': active, recovery, reach, width, shape, knockback, hit-stop, step, recoil, edge probe and drawn cut as stated',
      !f, f ? f.slice(0, 3).join('; ') + (f.length > 3 ? ' (+' + (f.length - 3) + ')' : '') : '');
  }
  check('without a seal no edge is drawn (the cut is the weapon\'s own)', baseCuts.every(cu => cu.passes === 0), baseCuts.map(cu => cu.passes).join('/'));
  // every block is a trade: something gained, something paid
  for (const id of r.seals) {
    const k = B[id];
    const gain = k.R > 1 || k.half > 1 || k.kb > 1 || k.t < 1 || k.step > 1 || k.recoil < 1 || k.chain === 2 || k.down === 'diag';
    const cost = k.R < 1 || k.half < 1 || k.kb < 1 || k.cd > 1 || k.t > 1 || k.step < 1 || k.chain === 2;
    check(id + ' is a trade, not a pure upgrade (gains and pays)', gain && cost, JSON.stringify(k));
  }
  // the edge's size follows the cut: longest for the long reach, shortest for the quick swipes
  for (const mode of MODES) {
    const far = id => r.cases.find(x => x.mode === mode && x.id === id).cut.far;
    const px = id => r.cases.find(x => x.mode === mode && x.id === id).cut.n;
    check(mode + ': the drawn edge is longest for the long reach and shortest for the quick swipes; the slam is the heaviest',
      far('claws') > far('nine') && far('nine') > far('over') && px('plate') > px('over'),
      'rim claws ' + far('claws') + ' / plain ' + far('nine') + ' / over ' + far('over') + '; px plate ' + px('plate') + ' / over ' + px('over'));
  }

  // ---- 4. the string, the plunge -----------------------------------------------------------
  for (const mode of MODES) {
    const ch = r.chain[mode];
    check(mode + ': the plain string is jab, jab, finisher; the two-beat seal goes jab, finisher', ch.base.join() === '0,1,2,0' && ch.nine.join() === '0,2,0,2',
      'base ' + ch.base.join(' ') + ', nine ' + ch.nine.join(' '));
    const pl = r.plunge[mode];
    check(mode + ': the plate\'s down-strike is the diagonal pogo (45 degrees forward, strikes ahead-below, rebounds forward); plain is straight down',
      pl.base.s0 && pl.base.s0.ax === 0 && pl.base.s0.ay === 1 && !pl.base.hit
        && pl.plate.s0 && pl.plate.s0.ax === 1 && pl.plate.s0.ay === 1 && pl.plate.s0.shape === 'diag' && pl.plate.hit && pl.plate.pogo && pl.plate.fwd > 200,
      JSON.stringify(pl));
  }

  // ---- 6. one style at a time ------------------------------------------------------------
  const want = { 'claws,nine': 'nine', 'plate,claws': 'plate', 'claws,plate': 'claws', 'sprint,claws': 'claws', 'siphon,sprint': null, 'over,ground,nine': 'nine' };
  const pairBad = r.pairs.filter(x => x.crest !== want[x.eq.join()] || x.rule !== want[x.eq.join()]);
  check('two seals worn: the one taking the most power sets the style; between equals the one seated first; one-socket seals never do',
    pairBad.length === 0, r.pairs.map(x => x.eq.join('+') + '→' + x.crest).join('  '));
  const rc = r.pairs.find(x => x.eq.join() === 'plate,claws'), rc2 = r.pairs.find(x => x.eq.join() === 'claws,plate');
  check('...and the swing really is that seal\'s (claws+plate reaches further than plate+claws)', rc && rc2 && rc2.far > rc.far, 'far edge ' + (rc && rc.far) + ' vs ' + (rc2 && rc2.far));

  // ---- 5. the real frame -------------------------------------------------------------------
  for (const mode of MODES) {
    const a = r.live[mode], p2 = r.live[mode + '+plate'];
    check(mode + ': in the running game the seal\'s edge is drawn on the slash layer, and not without one',
      p2.crestPasses > 0 && a.crestPasses === 0, 'with plate ' + p2.crestPasses + ' passes over ' + p2.framesCut + ' frames; plain ' + a.crestPasses);
  }

  // ---- 7. the words ---------------------------------------------------------------------------
  const LANGS5 = ['en', 'ar', 'tr', 'zh', 'ru'];
  const missing = [];
  for (const L of LANGS5) for (const id of r.seals) {
    const w = r.words[L][id];
    if (!w.line || w.line === 'cf_' + id) missing.push(L + ':cf_' + id);
    if (!w.short || w.short === 'cfs_' + id) missing.push(L + ':cfs_' + id);
    if (L !== 'en' && w.line === r.words.en[id].line) missing.push(L + ':cf_' + id + ' untranslated');
    if (w.card.indexOf(w.line) < 0) missing.push(L + ': card for ' + id + ' lacks its line');
  }
  for (const L of LANGS5) for (const k of ['_style', '_active', '_held']) if (!r.words[L][k] || /^cf_/.test(r.words[L][k]) || (L !== 'en' && r.words[L][k] === r.words.en[k])) missing.push(L + ':' + k);
  check('every seal\'s fighting line, style name and the style notes exist and are translated in all five languages', missing.length === 0, missing.slice(0, 4).join(', '));
  // the numbers in the words are the numbers in the table
  const pct = v => Math.round(Math.abs(v - 1) * 100);
  const numBad = [];
  for (const id of r.seals) {
    const k = B[id], line = r.words.en[id].line;
    for (const [f, v] of [['R', k.R], ['half', k.half], ['kb', k.kb], ['cd', k.cd], ['t', k.t]]) if (v !== 1 && !(id === 'plate' && (f === 't' || f === 'cd')) && !(id === 'nine')) {
      if (line.indexOf(pct(v) + '%') < 0) numBad.push(id + '.' + f + ' ' + pct(v) + '%');
    }
  }
  check('the English line names each percentage the block applies', numBad.length === 0, numBad.join(', '));
  for (const L of LANGS5) {
    const g = r.gear[L];
    check('Gear [' + L + ']: the selected seal shows its fighting line, its row says it sets the style, the overruled one says which does, the shop names it',
      g.fightShown && g.active && g.held && g.shop, JSON.stringify(g));
  }
  check('the item card that hands a seal over says what it does to her attacks', r.card.desc && r.card.desc.indexOf(r.card.want) >= 0, String(r.card.desc).slice(0, 90));

  // ---- shapes ---------------------------------------------------------------------------------
  const sbad = r.shapes.filter(x => !x.inside || x.fill < 0.8 || x.fill >= 1);
  check('every seal\'s cut (4 aims x 2 beats x 4 weapons) keeps its shape inside its box, 80-100% of it', sbad.length === 0,
    sbad.length ? JSON.stringify(sbad[0]) : r.shapes.length + ' shapes; ' + Array.from(new Set(r.shapes.map(x => x.shape + ':' + x.fill))).join(' '));

  // ---- 8. the docs and the registry --------------------------------------------------------
  const doc = fs.readFileSync(path.join(ROOT, 'docs/CRESTS.md'), 'utf8');
  const docBad = [];
  for (const id of r.seals) {
    const m = doc.match(new RegExp('^\\|\\s*`' + id + '`\\s*\\|([^\\n]+)$', 'm'));
    if (!m) { docBad.push(id + ' missing'); continue; }
    const cells = m[1].split('|').map(s => s.trim());
    const k = B[id];
    // | `id` | sockets | t | cd | R | half | kb | freeze | step | recoil | chain | down | tint |
    const nums = cells.slice(1, 10).map(Number);
    const exp = [k.t, k.cd, k.R, k.half, k.kb, k.freeze, k.step, k.recoil, k.chain];
    if (nums.some((v, i) => v !== exp[i]) || cells[10] !== k.down || cells[11].indexOf(k.tint) < 0) docBad.push(id + ': ' + cells.slice(0, 12).join(' '));
  }
  check('docs/CRESTS.md carries the attack-block table with the numbers in the code', docBad.length === 0, docBad.slice(0, 2).join('; '));
  const reg = fs.readFileSync(path.join(ROOT, 'docs/combat/GLOBAL_REGISTRY.md'), 'utf8');
  // every hue §2 registers — the combat hues and the UI loadout's — up to the
  // seals' own block, which is what is being measured
  const s2 = reg.slice(reg.indexOf('## 2.'), reg.indexOf('### Crest cuts'));
  const reserved = {};
  for (const m of s2.matchAll(/^\|\s*([^|]+?)\s*\|[^\n]*?`(#[0-9a-fA-F]{6})`/gm)) reserved[m[1]] = m[2].toLowerCase();
  const tintBad = [];
  for (const id of r.seals) for (const [n, h] of Object.entries(reserved)) if (h !== B[id].tint.toLowerCase() && dE(B[id].tint, h) <= 30) tintBad.push(id + ' ~ ' + n + ' ΔE ' + dE(B[id].tint, h).toFixed(0));
  for (let i = 0; i < r.seals.length; i++) for (let j = i + 1; j < r.seals.length; j++) {
    const d = dE(B[r.seals[i]].tint, B[r.seals[j]].tint);
    if (d <= 25) tintBad.push(r.seals[i] + '/' + r.seals[j] + ' ΔE ' + d.toFixed(0));
  }
  check('every seal\'s tint is clear of the ' + Object.keys(reserved).length + ' registered hues (ΔE > 30) and of each other (ΔE > 25)', tintBad.length === 0 && Object.keys(reserved).length >= 11, tintBad.join(', '));
  const crestBlock = reg.indexOf('### Crest cuts') >= 0 ? reg.slice(reg.indexOf('### Crest cuts'), reg.indexOf('\n---\n', reg.indexOf('### Crest cuts'))) : '';
  check('the registry records the seals\' attack blocks and their tints (§2, Crest cuts)', /CREST_ATTACK/.test(crestBlock) && r.seals.every(id => crestBlock.toLowerCase().indexOf(B[id].tint.toLowerCase()) >= 0));
  const lime = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f !== 'parry.js' && /\.js$/.test(f) && /#c6ff1a/i.test(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')));
  check('parry lime stays in js/parry.js alone', lime.length === 0, lime.join(', '));

  // ---- 9. NOSTOS --------------------------------------------------------------------------
  await p.goto('http://127.0.0.1:8220/odyssey.html');
  await p.waitForFunction(() => typeof startGame === 'function' && typeof CREST_ATTACK !== 'undefined', { timeout: 30000 });
  const h = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.flags.heal = 1;
    G.save = sv; startGame(sv); loadRoom('A1');
    await new Promise(k => setTimeout(k, 1200));
    for (let i = 0; i < 60; i++) { update(1 / 60); G.dialog = null; G.state = 'PLAY'; }
    const one = (eq) => {
      G.save.equip = eq; Object.assign(player, { swing: null, swingVis: null, atkCD: 0, atkBuf: 0, combo: 0, comboT: 0, vx: 0, on: true, face: 1 });
      keys.KeyX = 1; keysP.KeyX = 1; player.update(1 / 60); keys.KeyX = 0; keysP.KeyX = 0;
      const hb = player.hitbox();
      return { crest: player.swing.crest, half: hb.half, atkCD: player.atkCD, line: t('cf_plate'), name: t('c_plate') };
    };
    return { isHero: isHero(), base: one([]), plate: one(['plate']) };
  });
  check('NOSTOS: the hero swings through the same block (the plate widens his cut and slows his recovery)',
    h.isHero && h.plate.crest === 'plate' && near(h.plate.half / h.base.half, B.plate.half, 1e-3) && near(h.plate.atkCD / h.base.atkCD, B.plate.cd, 1e-3) && h.plate.line.indexOf('%') > 0,
    JSON.stringify(h));

  check('no page errors', !errs.length, errs[0] || '');
  await b.close();
  if (bad) { console.log('\n' + bad + ' crestfight check(s) failed'); process.exit(1); }
  console.log('\nOK — every expensive seal changes how she fights, the same way with every weapon, and she can see which');
})().catch(e => { console.error(e); process.exit(1); });
