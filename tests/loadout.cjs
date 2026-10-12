// COLOUR-CODED LOADOUT (js/loadout.js, handoff Part 2 C2), against the real build.
//
// Arms, crests and relics used to be lines of text on every screen. Each now
// owns one hue and one frame shape. This measures the promise rather than the
// code: the three hues are pairwise distinct and none is a reserved combat hue
// (read from docs/combat/GLOBAL_REGISTRY.md, not from a copy), the hex lives in
// one file, and on every screen that lists a system — the shop, the Gear
// screen, NOSTOS's token screen, the relic case, the pause rows, the item card
// and the HUD — the pixels at an entry's drawn frame are that system's colour
// and not another's. Tapping the drawn frame selects its own row, and the
// Arabic layout mirrors the frames with the text.
//
//   node tests/loadout.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};
const ROOT = path.join(__dirname, '..');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgbD = (a, b) => { const A = hex(a), B = hex(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
function lab([r, g, b]) {
  const f = v => { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; };
  r = f(r); g = f(g); b = f(b);
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, y = r * 0.2126 + g * 0.7152 + b * 0.0722, z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const q = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  x = q(x); y = q(y); z = q(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const dE = (a, b) => { const A = lab(hex(a)), B = lab(hex(b)); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };

// IN-PAGE: count the pixels in a 960x540-space rect within `tol` of each hue
const COUNT = `(rect, cols, tol) => {
  const cvs = document.getElementById('cv'), k = cvs.width / 960;
  const x0 = Math.max(0, Math.floor(rect.x * k)), y0 = Math.max(0, Math.floor(rect.y * k));
  const w = Math.max(1, Math.min(cvs.width - x0, Math.ceil(rect.w * k))), h = Math.max(1, Math.min(cvs.height - y0, Math.ceil(rect.h * k)));
  const d = cvs.getContext('2d').getImageData(x0, y0, w, h).data;
  const want = cols.map(cc => [1, 3, 5].map(i => parseInt(cc.slice(i, i + 2), 16)));
  const n = cols.map(() => 0);
  for (let i = 0; i < d.length; i += 4) for (let j = 0; j < want.length; j++) {
    const W = want[j];
    if (Math.hypot(d[i] - W[0], d[i + 1] - W[1], d[i + 2] - W[2]) <= tol) n[j]++;
  }
  return n;
}`;

(async () => {
  console.log('── loadout — arms, crests and relics each wear their own hue and frame, on every screen\n');

  // ---- 1. the hues: registry, distances, one definition ------------------
  const reg = fs.readFileSync(path.join(ROOT, 'docs/combat/GLOBAL_REGISTRY.md'), 'utf8');
  const s2 = reg.slice(reg.indexOf('## 2.'), reg.indexOf('### UI loadout'));
  const reserved = {};
  for (const m of s2.matchAll(/^\|\s*([^|]+?)\s*\|\s*`(#[0-9a-fA-F]{6})`\s*\|/gm)) reserved[m[1]] = m[2].toLowerCase();
  const loBlock = reg.slice(reg.indexOf('### UI loadout'), reg.indexOf('\n---\n', reg.indexOf('### UI loadout')));
  const src = fs.readFileSync(path.join(ROOT, 'js/loadout.js'), 'utf8');
  const def = src.match(/const LOADOUT_COL = Object\.freeze\(\{([^}]*)\}\)/);
  const LO = {};
  if (def) for (const m of def[1].matchAll(/(\w+):\s*'(#[0-9a-fA-F]{6})'/g)) LO[m[1]] = m[2].toLowerCase();
  check('LOADOUT_COL defines arm, crest and relic', ['arm', 'crest', 'relic'].every(k => LO[k]), JSON.stringify(LO));
  check('the registry reserves at least the eight combat hues', Object.keys(reserved).length >= 8, Object.keys(reserved).join(', '));
  check('the registry\'s UI loadout block names the same three hexes', ['arm', 'crest', 'relic'].every(k => LO[k] && loBlock.toLowerCase().includes('`' + LO[k] + '`')));
  for (const k of Object.keys(LO)) {
    let worst = null;
    for (const [n, h] of Object.entries(reserved)) {
      const d = { n, rgb: rgbD(LO[k], h), de: dE(LO[k], h) };
      if (!worst || d.de < worst.de) worst = d;
    }
    check(k + ' ' + LO[k] + ' is none of the reserved hues (RGB > 60, ΔE > 30)',
      worst && worst.rgb > 60 && worst.de > 30, 'nearest ' + worst.n + ': RGB ' + worst.rgb.toFixed(0) + ', ΔE ' + worst.de.toFixed(0));
  }
  const ks = Object.keys(LO);
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++)
    check(ks[i] + ' / ' + ks[j] + ' are pairwise distinct (RGB > 120, ΔE > 50)',
      rgbD(LO[ks[i]], LO[ks[j]]) > 120 && dE(LO[ks[i]], LO[ks[j]]) > 50,
      'RGB ' + rgbD(LO[ks[i]], LO[ks[j]]).toFixed(0) + ', ΔE ' + dE(LO[ks[i]], LO[ks[j]]).toFixed(0));
  // never repeated at a call site: the hex appears in one file of the game
  const leaks = [];
  for (const f of JSON.parse(fs.readFileSync(path.join(ROOT, 'source-files.json'), 'utf8'))) {
    if (f === 'loadout') continue;
    const body = fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8').toLowerCase();
    for (const k of ks) if (body.includes(LO[k])) leaks.push(f + ':' + k);
  }
  check('the loadout hexes are written only in js/loadout.js', !leaks.length, leaks.join(' '));
  check('the frame art is queued (ART_QUEUE §2bm)', /## 2bm\. THE LOADOUT FRAMES/.test(fs.readFileSync(path.join(ROOT, 'docs/ART_QUEUE.md'), 'utf8')));

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const errs = [];
  const open = async (page) => {
    const pg = await browser.newPage({ viewport: { width: 960, height: 540 } });
    pg.on('pageerror', e => errs.push(page + ': ' + String(e)));
    await pg.goto('http://127.0.0.1:8220/' + page);
    await pg.waitForFunction(() => typeof startGame === 'function' && typeof drawLoadoutFrame === 'function', { timeout: 20000 });
    await pg.evaluate(() => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.flags.heal = 1; sv.flags.pack = 1;
      sv.scrap = 0;
      sv.arms = ['shard', 'jet']; sv.armIdx = 1;
      sv.crests = ['claws', 'plate', 'siphon']; sv.equip = ['claws', 'siphon']; sv.slots = 4;
      // icons that are glyphs, not colour emoji: an emoji ignores fillStyle
      sv.relics = ['lens', 'fang', 'coin'];
      sv.shop = {};
      startGame(sv); loadRoom('A1');
      G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null; G.meet = null; G.tut = null;
      if (typeof qualSet === 'function') qualSet('high');
    });
    await pg.waitForTimeout(400);
    return pg;
  };
  // draw a state, let the real loop paint it twice, then measure in the page
  const shot = (pg, setup, measure) => pg.evaluate(async ([setup, measure, COUNT]) => {
    const count = eval(COUNT);
    const frames = async n => { for (let i = 0; i < n; i++) await new Promise(k => requestAnimationFrame(k)); };
    eval('(' + setup + ')')();
    await frames(3);
    return eval('(' + measure + ')')(count);
  }, [setup.toString(), measure.toString(), COUNT]);

  const pg = await open('index.html');
  const L = await pg.evaluate(() => LOADOUT_COL);
  const C3 = [L.arm, L.crest, L.relic];
  const TOL = 48;
  // `own` must reach `min`; the other two systems' hues must stay out
  const frameCheck = (name, n, kind, min) => {
    const idx = { arm: 0, crest: 1, relic: 2 }[kind];
    const others = n.filter((_, j) => j !== idx);
    check(name, n[idx] >= min && others.every(v => v <= 3), 'own ' + n[idx] + ' (≥' + min + '), others ' + others.join('/'));
  };

  // ---- 2. the shop -------------------------------------------------------
  for (const lang of ['en', 'ar']) {
    const r = await shot(pg, `() => { LANG = '${lang}'; G.state = 'SHOP'; G.shopIdx = 1; }`, `(count) => {
      const ar = LANG === 'ar';
      return SHOP.map((it, i) => ({ type: it.type, lo: loadoutKindOf(it.type, it.id),
        n: count({ x: (ar ? 774 : 186) - 16, y: 130 + i * 46 - 16, w: 32, h: 32 }, ${JSON.stringify(C3)}, ${TOL}) }));
    }`);
    for (const row of r) {
      if (row.lo) frameCheck('shop [' + lang + ']: the ' + row.type + ' row wears the ' + row.lo + ' frame', row.n, row.lo, 25);
      else check('shop [' + lang + ']: the ' + row.type + ' row carries no loadout hue', row.n.every(v => v <= 3), row.n.join('/'));
    }
  }
  // tap the drawn frame: it selects its own row (and nothing is bought)
  {
    const r = await pg.evaluate(() => {
      LANG = 'en'; G.state = 'SHOP';
      const scrap = G.save.scrap = 0, out = [];
      for (let i = 0; i < SHOP.length; i++) {
        G.shopIdx = -1; tapMenu(186, 130 + i * 46);
        out.push(G.shopIdx);
        for (const k in keysP) keysP[k] = 0; for (const k in keys) keys[k] = 0;
        if (TOUCH.tapRel) TOUCH.tapRel.length = 0;
      }
      G.state = 'PLAY';
      return { out, n: SHOP.length };
    });
    check('shop: tapping a row\'s frame selects that row', JSON.stringify(r.out) === JSON.stringify(Array.from({ length: r.n }, (_, i) => i)), JSON.stringify(r.out));
  }

  // ---- 3. the Gear screen (CLAWBYTE's crests) ----------------------------
  for (const lang of ['en', 'ar']) {
    const r = await shot(pg, `() => {
      LANG = '${lang}'; G.state = 'CREST';
      G.crestIdx = gearRows(G.save).findIndex(r => r.id === 'claws');
    }`, `(count) => {
      const l = gearLayout(), ar = LANG === 'ar';
      return l.visible.map((row, i) => ({ id: row.id, lo: loadoutKindOf('gear', row.id), st: row.installed ? 'filled' : row.acquired ? 'empty' : 'locked',
        n: count({ x: (ar ? 890 : 500) - 14, y: l.y + i * l.step - 14, w: 28, h: 28 }, ${JSON.stringify(C3)}, ${TOL}) }));
    }`);
    const crestRows = r.filter(x => x.lo === 'crest');
    check('gear [' + lang + ']: crest rows are on screen', crestRows.length >= 2, r.map(x => x.id).join(','));
    for (const row of r) {
      if (row.lo && row.st !== 'locked') frameCheck('gear [' + lang + ']: ' + row.id + ' (' + row.st + ') wears the crest diamond', row.n, 'crest', 18);
      else if (!row.lo) check('gear [' + lang + ']: ' + row.id + ' is not a loadout row and carries no loadout hue', row.n.every(v => v <= 3), row.n.join('/'));
    }
  }
  {
    const r = await pg.evaluate(() => {
      LANG = 'en'; G.state = 'CREST';
      G.crestIdx = gearRows(G.save).findIndex(r => r.id === 'claws');
      const l = gearLayout(), out = [];
      for (let i = 0; i < l.visible.length; i++) {
        G.crestIdx = l.index; gearTouch(500, l.y + i * l.step);
        out.push(G.crestIdx === l.start + i);
        for (const k in keysP) keysP[k] = 0; for (const k in keys) keys[k] = 0;
        if (TOUCH.tapRel) TOUCH.tapRel.length = 0;
      }
      G.state = 'PLAY';
      return out;
    });
    check('gear: tapping a row\'s frame selects that row', r.every(Boolean), JSON.stringify(r));
  }

  // ---- 4. the relic case -------------------------------------------------
  for (const lang of ['en', 'ar']) {
    const r = await shot(pg, `() => { LANG = '${lang}'; G.state = 'RELICS'; }`, `(count) => {
      const L = relicsLayout();
      return { rtl: L.rtl, pos: L.owned.map((id, i) => L.pos(i)), n: L.owned.map((id, i) => { const P = L.pos(i);
        return count({ x: P.x - 20, y: P.y - 20, w: 40, h: 40 }, ${JSON.stringify(C3)}, ${TOL}); }) };
    }`);
    r.n.forEach((n, i) => frameCheck('relics [' + lang + ']: relic ' + i + ' sits in the relic seal', n, 'relic', 40));
    if (lang === 'ar') check('relics [ar]: the first relic is top-right, read first', r.pos[0].x > r.pos[1].x, JSON.stringify(r.pos.slice(0, 2)));
  }

  // ---- 5. the pause rows -------------------------------------------------
  for (const lang of ['en', 'ar']) {
    const r = await shot(pg, `() => { LANG = '${lang}'; G.state = 'PAUSE'; G.pauseIdx = 0; G.pauseConfirm = null; }`, `(count) => {
      const PL = pauseLayout(), out = {};
      PL.items.forEach((it, i) => { if (!['crests', 'relics', 'bag', 'map'].includes(it.id)) return;
        const P = PL.pos(i);
        out[it.id] = count({ x: P.x - PL.colW / 2, y: P.y - PL.step * 0.45, w: PL.colW, h: PL.step * 0.9 }, ${JSON.stringify(C3)}, ${TOL}); });
      return out;
    }`);
    frameCheck('pause [' + lang + ']: the crests row carries the crest diamond', r.crests, 'crest', 10);
    frameCheck('pause [' + lang + ']: the relics row carries the relic seal', r.relics, 'relic', 10);
    check('pause [' + lang + ']: rows that are not loadout carry no loadout hue', r.bag.concat(r.map).every(v => v <= 3), r.bag.concat(r.map).join('/'));
  }

  // ---- 6. the HUD: the worn arm's hex, the worn crests, the relic seal ----
  {
    const r = await shot(pg, `() => { LANG = 'en'; G.state = 'PLAY'; G.dialog = null; G.toasts = []; G.save.armIdx = 1; }`, `(count) => {
      const sl = armSlots(), cur = G.save.armIdx % sl.length, out = { badges: [] };
      for (let i = 1; i < sl.length; i++) {
        const bx = 44 + (i - 1) * 42;
        out.badges.push({ on: i === cur, n: count({ x: bx - 19, y: 118 - 19, w: 38, h: 38 }, ${JSON.stringify(C3)}, ${TOL}) });
      }
      const H = loadoutHudLayout();
      out.crests = H.crests.map(k => count({ x: k.x - 10, y: k.y - 10, w: 20, h: 20 }, ${JSON.stringify(C3)}, ${TOL}));
      out.relic = H.relic ? count({ x: H.relic.x - 10, y: H.relic.y - 10, w: 20, h: 20 }, ${JSON.stringify(C3)}, ${TOL}) : null;
      out.row = loadoutHudRow();
      return out;
    }`);
    const on = r.badges.find(b => b.on), off = r.badges.find(b => !b.on);
    check('HUD: the suit wheel is up with two suits', r.badges.length === 2, JSON.stringify(r.badges));
    if (on) frameCheck('HUD: the worn arm sits in the rose hex', on.n, 'arm', 40);
    if (on && off) check('HUD: the worn arm\'s frame outweighs an unworn one', on.n[0] > off.n[0] * 2, on.n[0] + ' vs ' + off.n[0]);
    check('HUD: one crest diamond per worn crest', r.crests.length === 2, String(r.crests.length));
    r.crests.forEach((n, i) => frameCheck('HUD: worn crest ' + i + ' is a cobalt diamond', n, 'crest', 18));
    if (r.relic) frameCheck('HUD: the relic seal is trail green', r.relic, 'relic', 18);
    else check('HUD: the relic seal is drawn', false);
  }
  // ...and the HUD's opening goal line steps off the loadout row
  {
    const r = await pg.evaluate(() => {
      const keep = G.save.arms; G.save.arms = []; G.save.armIdx = 0;
      const row = loadoutHudRow(), rect = typeof opGoalRect === 'function' ? opGoalRect(200) : null;
      const H = loadoutHudLayout();
      G.save.arms = keep; G.save.armIdx = 1;
      return { row, rect, top: H.y + 9 };
    });
    check('HUD: with crests but no suit, the goal line starts below the loadout row', r.row && (!r.rect || r.rect.y >= r.top), JSON.stringify(r));
  }

  // ---- 7. the item cards: the thing she was handed shows its system -----
  const card = async (name, grant, kind) => {
    const r = await shot(pg, `() => {
      LANG = 'en'; G.dialog = null; G.state = 'PLAY'; if (typeof overlayClear === 'function') overlayClear();
      ${grant};
    }`, `(count) => {
      const d = G.dialog;
      const rtl = isRTL(), px = rtl ? 744 : 152;
      return { lo: d && d.lo, st: G.state, n: count({ x: px - 8, y: 240, w: 84, h: 264 }, ${JSON.stringify(C3)}, ${TOL}) };
    }`);
    check('card: ' + name + ' is tagged ' + kind, r.lo === kind && r.st === 'DIALOG', JSON.stringify({ lo: r.lo, st: r.st }));
    frameCheck('card: ' + name + ' shows the ' + kind + ' frame', r.n, kind, 60);
    await pg.evaluate(() => { G.dialog = null; G.state = 'PLAY'; if (typeof overlayClear === 'function') overlayClear(); });
  };
  await card('a relic', "G.save.relics = G.save.relics.filter(x => x !== 'spring'); G.grantRelic('spring')", 'relic');
  await card('a crest', "G.save.crests = G.save.crests.filter(x => x !== 'over'); grantCrest('over')", 'crest');
  // the arm's card is raised inside onBossDead; its line is the same call
  await card('an arm', "loadoutTagCard(showItem(t('arm_slag'), t('arm_slagd')), 'arm', 'slag')", 'arm');
  {
    const gsrc = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
    check('card: the boss\'s arm handover is tagged in onBossDead', /loadoutTagCard\(showItem\(t\('arm_' \+ arm\)[^\n]*'arm', arm\)/.test(gsrc));
  }

  // ---- 8. the touch wheel's suit seat wears the arm hue ------------------
  {
    const r = await pg.evaluate(() => { const w = WHEEL.find(x => x.code === 'VARM'); return w && w.tint ? w.tint.ring : null; });
    check('touch wheel: the change-suit seat is tinted the arm hue', r === L.arm, String(r));
  }

  // ---- 9. five languages: the arm's system name exists in each ----------
  {
    const r = await pg.evaluate(() => {
      const out = {};
      for (const l of ['en', 'ar', 'tr', 'zh', 'ru']) { LANG = l; out[l] = [loadoutLabel('arm'), loadoutLabel('crest'), loadoutLabel('relic')]; }
      LANG = 'en';
      return out;
    });
    const bad = Object.entries(r).filter(([l, v]) => v.some(s => !s || /^(lo_|pm_)/.test(s)));
    check('every language names all three systems', !bad.length, JSON.stringify(r));
    check('the arm label is translated (not English) outside en', ['ar', 'tr', 'zh', 'ru'].every(l => r[l][0] !== r.en[0]), JSON.stringify(Object.fromEntries(Object.entries(r).map(([l, v]) => [l, v[0]]))));
  }
  await pg.close();

  // ---- 10. NOSTOS: the token (crest) screen and its sockets --------------
  const hp = await open('odyssey.html');
  for (const lang of ['en', 'ar']) {
    const r = await shot(hp, `() => { LANG = '${lang}'; G.state = 'CREST'; G.crestIdx = 0; }`, `(count) => {
      const ar = LANG === 'ar';
      const rows = G.save.crests.map((id, i) => ({ id, eq: G.save.equip.includes(id),
        n: count({ x: (ar ? 592 : 198) - 14, y: 170 + i * 40 - 14, w: 28, h: 28 }, ${JSON.stringify(C3)}, ${TOL}) }));
      const sockets = count({ x: 480 - effSlots() * 14 - 12, y: 92 - 12, w: effSlots() * 28 + 24, h: 24 }, ${JSON.stringify(C3)}, ${TOL});
      return { rows, sockets };
    }`);
    r.rows.forEach(row => frameCheck('tokens [' + lang + ']: ' + row.id + ' (' + (row.eq ? 'seated' : 'unseated') + ') wears the crest diamond', row.n, 'crest', 18));
    frameCheck('tokens [' + lang + ']: the port\'s sockets are crest diamonds', r.sockets, 'crest', 60);
  }
  {
    const r = await hp.evaluate(() => {
      LANG = 'en'; G.state = 'CREST'; const out = [];
      for (let i = 0; i < G.save.crests.length; i++) {
        G.crestIdx = -1; tapMenu(198, 170 + i * 40); out.push(G.crestIdx);
        for (const k in keysP) keysP[k] = 0; for (const k in keys) keys[k] = 0;
        if (TOUCH.tapRel) TOUCH.tapRel.length = 0;
      }
      G.state = 'PLAY';
      return out;
    });
    check('tokens: tapping a row\'s frame selects that row', JSON.stringify(r) === JSON.stringify(r.map((_, i) => i)), JSON.stringify(r));
  }
  await hp.close();

  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fails.length ? '\n  ' + fails.length + ' FAILED' : '\n  all loadout checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
