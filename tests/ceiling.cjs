// The roof, and the quality dial that decides how much of it you get.
//
// Two things this catches that reading cannot: a ceiling plate that never
// resolves (the art is registered but the file is missing, so drawCeiling
// silently returns every frame and the room has no top), and a quality tier
// that claims to change something and does not — the knobs are only worth
// having if the expensive work actually stops when they are turned down.
const { chromium } = require('playwright');

const BOOT = `
  const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv);
`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  await p.evaluate(BOOT);
  await p.waitForTimeout(1500);

  // 1. every zone's plate resolves to a real texture
  const rooms = { A: 'A1', B: 'B1', C: 'C1', D: 'D1', E: 'E1', X: 'X1' };
  const tex = {};
  for (const [z, room] of Object.entries(rooms)) {
    tex[z] = await p.evaluate(async (r) => {
      loadRoom(r);
      // the art is lazy: touch it, then give the decode a moment
      MEDIA_IMG[CEIL[G.roomDef.zone]];
      for (let i = 0; i < 60; i++) {
        await new Promise(r2 => requestAnimationFrame(r2));
        if (ceilTex(G.roomDef.zone)) break;
      }
      const t2 = ceilTex(G.roomDef.zone);
      return t2 ? t2.width + 'x' + t2.height : 'MISSING';
    }, room);
  }
  const missing = Object.entries(tex).filter(([, v]) => v === 'MISSING');
  console.log('ceiling plates: ' + Object.entries(tex).map(([z, v]) => z + '=' + v).join('  '));

  // 2. the roof is DOING something — weather accumulates on its own clock
  // NOT the count at the end — a Foundry drip that beads, falls and bursts
  // inside eight seconds is the effect working, and leaves nothing behind.
  // What matters is that the roof kept producing, and that each kingdom
  // produces its OWN thing rather than one shared snow.
  const wx = await p.evaluate(async () => {
    const seen = (room, zone) => {
      loadRoom(room); ceilReset();
      const kinds = new Set(); let peak = 0;
      for (let i = 0; i < 300; i++) {
        ceilWeather(1 / 30, zone);
        for (const o of CEILFX) kinds.add(o.k);
        peak = Math.max(peak, CEILFX.length);
      }
      return { kinds: [...kinds], peak };
    };
    return { C: seen('C1', 'C'), D: seen('D1', 'D'), B: seen('B1', 'B'), E: seen('E1', 'E') };
  });
  for (const [z, v] of Object.entries(wx))
    console.log('weather ' + z + ': peak ' + v.peak + '  sheds [' + v.kinds.join(', ') + ']');

  // 3. a room change clears the last room's roof
  const cleared = await p.evaluate(() => { loadRoom('A1'); return CEILFX.length; });
  console.log('cleared on room change: ' + cleared);

  // 4. the quality dial actually moves the machine
  const q = await p.evaluate(() => {
    const out = {};
    out.device = DEVICE.form + ' cores=' + DEVICE.cores + ' dpr=' + DEVICE.dpr;
    out.guess = QNAME;
    const cv = document.getElementById('cv');
    qualSet('low', false);   out.low = { w: cv.width, h: cv.height, bloom: QUAL.bloom, ceil: QUAL.ceil, parts: QUAL.parts };
    qualSet('high', false);  out.high = { w: cv.width, h: cv.height, bloom: QUAL.bloom, ceil: QUAL.ceil, parts: QUAL.parts };
    // and the particle budget is enforced, not merely declared
    qualSet('low', false);
    parts.length = 0;
    for (let i = 0; i < 2000; i++) addPart(0, 0, 0, 0, 9, '#fff', 2, 0, false);
    out.lowParts = parts.length;
    qualSet('high', false);
    parts.length = 0;
    for (let i = 0; i < 2000; i++) addPart(0, 0, 0, 0, 9, '#fff', 2, 0, false);
    out.highParts = parts.length;
    parts.length = 0;
    return out;
  });
  console.log('device: ' + q.device + '  ->  guessed tier ' + q.guess);
  console.log('low : backbuffer ' + q.low.w + 'x' + q.low.h + '  bloom=' + q.low.bloom + ' ceil=' + q.low.ceil + '  particles capped at ' + q.lowParts);
  console.log('high: backbuffer ' + q.high.w + 'x' + q.high.h + '  bloom=' + q.high.bloom + ' ceil=' + q.high.ceil + '  particles capped at ' + q.highParts);

  // 5. and the picture still draws at a reduced backbuffer
  const drew = await p.evaluate(async () => {
    qualSet('low', false);
    loadRoom('C1');
    for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
    const cv = document.getElementById('cv');
    const x = cv.getContext('2d');
    const d = x.getImageData(0, 0, cv.width, cv.height).data;
    let lit = 0;
    for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 8) lit++;
    return lit;
  });
  console.log('frame at low tier: ' + drew + ' sampled pixels drawn');

  await b.close();
  const fails = [];
  if (missing.length) fails.push('ceiling art missing for zone(s): ' + missing.map(m => m[0]).join(','));
  // B's arcs last a fifth of a second, so one alive at a time IS the effect
  for (const [z, v] of Object.entries(wx)) if (v.peak < 1) fails.push('zone ' + z + ' roof sheds nothing');
  if (!wx.C.kinds.includes('melt')) fails.push('the Foundry roof does not drip molten metal');
  if (!wx.D.kinds.includes('snow')) fails.push('the Archives roof does not shed snow');
  if (String(wx.C.kinds) === String(wx.D.kinds)) fails.push('every kingdom sheds the same thing');
  if (cleared !== 0) fails.push('roof weather survived a room change (' + cleared + ' left)');
  if (!(q.low.w < q.high.w)) fails.push('low tier did not shrink the backbuffer');
  if (q.low.bloom !== false) fails.push('low tier kept the bloom pass');
  if (!(q.lowParts < q.highParts)) fails.push('the particle budget is not enforced per tier');
  if (drew < 20) fails.push('nothing drew at the reduced backbuffer');
  if (errs.length) fails.push('page errors: ' + errs.slice(0, 3).join(' | '));
  if (fails.length) { console.log('\nFAIL\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('\nOK');
})();
