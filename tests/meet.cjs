// THE FIRST MEETING, MEASURED — the beat the underdog arc hangs on
// (.claude/skills/underdog-arc §2.1): early in zone A something swats her
// aside and walks away, and she survives it by being outclassed, not by dying.
//
// A staged sequence is the kind of thing that rots silently: a phase that
// never advances, a hit that kills at one core, a hold that never lets go, a
// flag that re-fires every visit. So this walks her onto the A2 crest and
// watches the whole thing happen:
//
//   it comes, it hits ONCE, it costs her exactly one core and never the last;
//   she is thrown the length of the mound; her controls are held and returned;
//   it leaves; the flag holds; it never happens twice;
//   and A4 knows: the same slam on the guardian's wake, the rematch toast.
//
//   node tests/meet.cjs
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── meet — it swats her aside and walks away, and she is still standing');

  const run = (cores) => page.evaluate(async ({ cores }) => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.abil = { dash: 1 };
    startGame(sv); loadRoom('A2');
    G.dialog = null; G.state = 'PLAY'; G.toasts = []; G.enemies = [];
    const DT = 1 / 60;
    player.x = 56 * TILE; player.y = (G.roomDef.h - 2) * TILE - player.h; player.vx = 0; player.vy = 0;
    player.cores = cores;
    const out = { phases: [], sounds: [], music: [] };
    const sfx0 = window.sfx; window.sfx = (k) => { out.sounds.push(k); return sfx0(k); };
    const sm0 = window.setMusic; window.setMusic = (k) => { out.music.push('set:' + k); return sm0(k); };
    const st0 = window.stopMusic; window.stopMusic = () => { out.music.push('stop'); return st0(); };
    let f = 0, held = 0, xAtHit = null, minX = 1e9, lastPh = null, coresAtHit = null;
    keys.ArrowRight = 1;
    while (f < 60 * 14) {
      update(DT); f++;
      if (G.meet) {
        if (G.meet.ph !== lastPh) { out.phases.push(G.meet.ph + '@' + (f / 60).toFixed(2)); lastPh = G.meet.ph; }
        // pushing right the whole time: if the hold works she does not go right
        if (G.meet.ph === 'land' && player.vx <= 0) held++;
        if (G.meet.hit && xAtHit == null) { xAtHit = player.x; coresAtHit = player.cores; }
        if (xAtHit != null) minX = Math.min(minX, player.x);
      }
      if (out.phases.length && !G.meet && !G.boss) { out.endF = f; break; }
    }
    keys.ArrowRight = 0;
    window.sfx = sfx0; window.setMusic = sm0; window.stopMusic = st0;
    out.thrown = xAtHit != null ? xAtHit - minX : 0;
    out.held = held; out.cores = player.cores; out.dead = player.dead; out.flag = !!G.save.flags.nfMeet;
    out.bossGone = !G.boss; out.meetGone = !G.meet; out.room = G.roomId;
    out.marks = (braid().marks || {});
    // controls come back: walk right for a second
    const x0 = player.x; keys.ArrowRight = 1;
    for (let i = 0; i < 60; i++) update(DT);
    keys.ArrowRight = 0; out.walked = player.x - x0;
    // never twice: cross the line again
    player.x = 56 * TILE; player.vx = 0;
    for (let i = 0; i < 120; i++) { keys.ArrowRight = 1; update(DT); }
    keys.ArrowRight = 0;
    out.again = !!G.meet;
    return out;
  }, { cores });

  const r = await run(5);
  check('it happens on the crest of A2', r.phases.length > 0 && r.room === 'A2', r.phases.join(' '));
  check('every beat plays: fall, land, wind, swipe, watch, coil, leave',
    ['fall', 'land', 'wind', 'swipe', 'watch', 'coil', 'leave'].every(p => r.phases.some(q => q.startsWith(p + '@'))));
  check('...and it is over inside ten seconds', r.endF && r.endF < 60 * 10, r.endF ? (r.endF / 60).toFixed(1) + ' s' : 'never ended');
  check('the music drops out for it and comes back', r.music[0] === 'stop' && r.music.some(m => m.startsWith('set:')), r.music.join(','));
  check('it announces itself: the slam, the tell, the hit', ['slam', 'tellbig', 'hit'].every(k => r.sounds.includes(k)), r.sounds.filter(k => /slam|tellbig|hit|dash/.test(k)).join(','));
  check('it costs her exactly one core', r.cores === 4 && !r.dead, r.cores + (r.dead ? ' dead' : ''));
  check('she is thrown the length of the mound (> 200 px west)', r.thrown > 200, Math.round(r.thrown) + ' px');
  check('her controls are held while it walks up', r.held > 20, r.held + ' frames');
  check('it leaves, and the sequence ends', r.bossGone && r.meetGone);
  check('...and gives her controls back', r.walked > 60, Math.round(r.walked) + ' px in a second');
  check('the flag holds and the Braid marks it', r.flag && r.marks.meet === 'A2');
  check('it never happens twice', !r.again);

  const r1 = await run(1);
  check('at one core it never kills: a survival, not a scripted death', !r1.dead && r1.cores === 1, r1.cores + (r1.dead ? ' dead' : ''));

  const a4 = await page.evaluate(() => {
    G.save.flags.nfMeet = 1; loadRoom('A4'); G.dialog = null; G.state = 'PLAY'; G.toasts = [];
    const b = G.boss; const out = { sounds: [], toast: null };
    const sfx0 = window.sfx; window.sfx = (k) => { out.sounds.push(k); return sfx0(k); };
    player.x = b.cx() - 200; player.y = b.y;
    for (let i = 0; i < 30; i++) update(1 / 60);
    window.sfx = sfx0;
    out.intro = b.st === 'intro';
    out.toast = (G.toasts || []).map(t => t.text || t.msg || JSON.stringify(t)).join('|');
    out.marks = braid().marks || {};
    return out;
  });
  check('A4 wakes as the rematch: the same slam', a4.intro && a4.sounds.includes('slam'), a4.sounds.join(','));
  check('...says it remembers', /remembers|corridor|الممرّ/i.test(a4.toast), a4.toast);
  check('...and the Braid marks the rematch', a4.marks.rematch === 'A4');
  check('no page errors', errs.length === 0, errs.join(' | '));
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
  console.log('\nOK — she met it, it cost her, she is still standing, and the arena knows her');
})();
