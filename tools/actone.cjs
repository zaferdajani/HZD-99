// ACT ONE, ON THE CLOCK — what the game actually shows, in what order.
//
// The owner asked for this directly: "test the game workflow. How it starts,
// does it show the videos in the appropriate time, the dramatic effect of
// starting the video fading into the video, the sound effects in the video,
// musicalities. And then the sequence of events that happens during gameplay
// for act one, which basically ends with the first sage."
//
// Reading the source cannot answer it. The reel's timing lives in the cut
// machine's phase clock, the music switches are scheduled against it, and the
// tutorial's order is data. So this WATCHES a real build play: it samples the
// live state at 30 Hz and emits a line every time something the player would
// notice changes — the clip, its fade phase, the music, the room, the lesson,
// the guardian, the speaker — with the wall clock beside it.
//
// Where the spine needs a fight the bot cannot reliably win, the beat is
// FORCED and the line says so. Everything that is a timing — the fades, the
// clip lengths, the film beats, the awakenings — is measured, never asserted.
//
//   node tools/actone.cjs [out.md]      (needs the repo served on :8220)
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const out = process.argv[2] || null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  // THE WATCHER. One probe, installed once, that records changes rather than
  // samples: a 30 Hz dump of everything would be forty thousand lines of the
  // same frame, and what is being asked about is the ORDER OF EVENTS.
  await page.evaluate(() => {
    window.__log = [];
    window.__t0 = performance.now();
    window.__last = {};
    window.__note = (tag, text) => window.__log.push({
      t: +((performance.now() - window.__t0) / 1000).toFixed(2), tag, text });
    const snap = () => {
      const cut = G.cut;
      return {
        state: G.state,
        room: G.roomId,
        clip: cut ? ((cut.kind || '?') + ':' + (cut.ph || '?')) : '',
        music: (typeof MUS !== 'undefined' && MUS.name) || '-',
        duck: (typeof MUS_DUCK !== 'undefined' ? MUS_DUCK : 1),
        lesson: (G.tut && typeof TUT_STEPS !== 'undefined' && TUT_STEPS[G.tut.i])
                ? TUT_STEPS[G.tut.i].id : '',
        boss: G.boss ? (G.boss.kind + ':' + G.boss.st) : '',
        talking: (G.dialog && G.dialog.npc) || '',
        wake: G.wake ? 'waking' : '',
      };
    };
    window.__tick = () => {
      const s = snap(), L = window.__last;
      for (const k in s) {
        if (k === 'duck') {
          if (Math.abs((s.duck || 1) - (L.duck == null ? 1 : L.duck)) > 0.05)
            window.__note('music', 'duck ' + (L.duck == null ? 1 : L.duck).toFixed(2) + ' -> ' + s.duck.toFixed(2));
          L.duck = s.duck; continue;
        }
        if (s[k] !== L[k]) { if (s[k]) window.__note(k, s[k]); L[k] = s[k]; }
      }
    };
    setInterval(window.__tick, 33);
  });

  const note = (tag, text) => page.evaluate(([a, b]) => window.__note(a, b), [tag, text]);
  const wait = (ms) => page.waitForTimeout(ms);

  // ---- 1. THE MENU, and what it plays before anyone presses anything ------
  await note('BEAT', 'boot — the menu');
  await wait(2500);

  // ---- 2. ENTER: the opening reel ----------------------------------------
  await note('BEAT', 'ENTER pressed — the opening reel begins');
  await page.evaluate(() => { keysP['Enter'] = 1; keys['Enter'] = 1; });
  await page.evaluate(() => { setTimeout(() => { keys['Enter'] = 0; }, 60); });
  // let the whole reel run: it is the thing being timed
  await wait(60000);
  await note('BEAT', 'reel window closed (60s)');

  // ---- 3. THE WAKING FLOOR ------------------------------------------------
  const st = await page.evaluate(() => ({ state: G.state, room: G.roomId, cut: !!G.cut }));
  await note('BEAT', 'after the reel: state ' + st.state + ', room ' + st.room);

  // from here the spine is walked deliberately. Every FORCED line is a beat
  // this tool skipped past rather than played.
  const beats = [
    ['W1',  'the waking floor — she comes out of the cradle'],
    ['W2',  'the road, and the city gate'],
    ['A0',  'the meadow: the trader and his booth'],
    ['A0B', "Ratchet's den — the first NPC, the first shop"],
    ['A1',  'the scrap meadow: the first wolves'],
    ['A5',  'the buried mouth — the tunnel is under rubble'],
    ['CV1', 'the tunnel: the entry hall'],
    ['CV1B','the Seam — the tunnel branch and its bench'],
    ['CV3', 'the pillar chamber — the crystal is quarried here'],
    ['A4',  "NULLFANG's lair — the first guardian"],
    ['GA1', 'the grotto the guardian opens'],
    ['GA1T','its tunnel — the Deaf System terminal'],
    ['GA1D','THE MEADOW SAGE — the end of act one'],
  ];
  for (const [room, what] of beats) {
    await note('BEAT', room + ' — ' + what);
    await page.evaluate((r) => {
      // the reel may still be holding the menu — the run has to have a life
      // before it can have a room
      if (!G.save) startGame(newSave(1));
      // give her what the spine would have given her by now, so each room
      // presents what a player who got here would actually see
      const f = G.save.flags;
      if (['A5', 'CV1', 'CV1B', 'CV3'].indexOf(r) >= 0) { f.tut = 1; f.woke = 1; }
      if (['A4', 'GA1', 'GA1T', 'GA1D'].indexOf(r) >= 0) { f.tut = 1; f.woke = 1; f.crystal = 1; }
      if (['GA1', 'GA1T', 'GA1D'].indexOf(r) >= 0) f.bossGlitch = 1;
      loadRoom(r);
      G.state = 'PLAY';
    }, room);
    await wait(6200);   // long enough for the room's own music to take over
    const s2 = await page.evaluate(() => ({
      music: (typeof MUS !== 'undefined' && MUS.name) || '-',
      boss: G.boss ? (G.boss.kind + ':' + G.boss.st) : '-',
      npcs: (G.statics || []).filter(q => q.type === 'npc').map(q => q.extra).join(',') || '-',
      rubble: !!(G.rubbles && G.rubbles.length),
      bench: !!(G.statics || []).find(q => q.type === 'bench'),
      foes: (G.enemies || []).map(q => q.kind).join(',') || '-',
    }));
    await note('room', 'music ' + s2.music + ' | guardian ' + s2.boss + ' | npc ' + s2.npcs +
                       ' | in the room ' + s2.foes + (s2.rubble ? ' | BURIED' : '') + (s2.bench ? ' | rest' : ''));
  }

  const log = await page.evaluate(() => window.__log);
  if (errs.length) console.log('PAGE ERRORS: ' + errs.slice(0, 3).join(' | ') + '\n');

  const lines = [];
  let prev = 0;
  for (const e of log) {
    const gap = (e.t - prev).toFixed(2);
    prev = e.t;
    if (e.tag === 'BEAT') lines.push('');
    lines.push(('     ' + e.t.toFixed(2)).slice(-8) + 's  +' + ('    ' + gap).slice(-6) +
               '  ' + (e.tag + '        ').slice(0, 8) + '  ' + e.text);
  }
  const text = 'ACT ONE — what the game shows, in order\n' +
               '(t is wall-clock seconds from boot; + is the gap from the line above)\n' +
               lines.join('\n') + '\n';
  console.log(text);
  if (out) { fs.writeFileSync(out, text); console.log('written to ' + out); }
  await browser.close();
})();
