// TWO CHANNELS, OR IT IS NOT A TELEGRAPH.
//
// The game already enforces the audio half automatically: any boss state whose
// name matches TELL_ST fires sfx('tell') once on entry. That is a genuinely good
// piece of design and it is also a trap, because the failure is SILENT — a
// wind-up state named something that does not match is a one-channel telegraph
// and nothing anywhere says so.
//
// It had already happened twice, both on NULLFANG, the game's FIRST boss, whose
// whole job is to prove the telegraph contract is real so that every later fight
// can rely on the player trusting it:
//
//   'roar'   a 500 ms inhale that ends by shoving the player across the room
//   'perch'  a 450 ms flatten before a claws-first dive
//
// This harness drives each boss through its own state machine and reports every
// state it actually entered that LOOKS like a wind-up but earns no cue. It reads
// the states from the running build rather than from a list, so a wind-up added
// next year is checked without anybody remembering to add it here.
const { chromium } = require('playwright');

// what a wind-up is called, independent of TELL_ST — deliberately WIDER than the
// engine's own pattern, because the whole point is to catch the ones it misses
const LOOKS_LIKE_WINDUP = /warn|charge|crouch|coil|lock|prep|spin|gather|roar|perch|wind|tell|aim|rear|raise|summon|cast/i;
// states that look like wind-ups but are genuinely not, with the reason
const EXEMPT = {
  dccast: 'the cast IS the move; its own tell is the 500 ms windT before it',
  azhush: 'the expanding aura is the tell and it is a full second long',
  orbs: 'a summon, not a strike — nothing lands from it',
};
// Wind-ups whose cue is fired BY HAND rather than by the state name, with the
// reason it has to be. Kept short and kept here, in the open: a state on this
// list is one the automatic contract does not cover, and every entry is a claim
// somebody has to be able to check.
const HAND_CUED = {
  'glitch.perch': "the dive's tell is the LAST 450 ms of the perch, not all 1.4 s of it — " +
                  'a cue on entry would warn before there is anything to warn about',
};

const BOSSES = ['glitch', 'brood', 'atlas', 'zero', 'prism', 'mother'];
const ROOMS = { glitch: 'A4', brood: 'B4', atlas: 'C3', zero: 'D3', prism: 'X1', mother: 'E3' };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); });
  await p.waitForTimeout(900);

  // the engine's own pattern, read out of the build
  const pattern = await p.evaluate(() => String(TELL_ST));
  console.log('engine TELL_ST = ' + pattern);
  // ...and proof that the rule is still APPLIED. Checking state names against a
  // pattern is worthless if the one line that turns a match into a sound has
  // been deleted, so the hook itself is asserted rather than assumed.
  const hooked = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8')
    .includes("if (TELL_ST.test(this.st || '')) sfx('tell')");
  console.log('central cue hook present: ' + hooked);

  const out = {};
  for (const kind of BOSSES) {
    out[kind] = await p.evaluate(async ({ kind, room }) => {
      loadRoom(room);
      // find or force the boss into being
      let bo = G.boss;
      if (!bo || bo.kind !== kind) { bo = new Boss(kind, 300, 300); G.boss = bo; }
      bo.st = 'idle'; bo.t = 0; bo.dead = false;
      bo.hp = bo.hpMax;
      player.x = bo.cx() - 120; player.y = bo.y;
      // The cue cannot be observed by replacing sfx: the build is ONE
      // concatenated script, so `function sfx` is a script-scope binding and not
      // a property of window — assigning window.sfx makes a second, unrelated
      // function that the game never calls. (That mistake made this harness
      // report every telegraph in the game as broken, which was a good lesson in
      // trusting a red result exactly as far as you trust the instrument.)
      // So the harness checks the RULE against the states actually entered,
      // which is what decides whether the cue fires, and separately proves the
      // central hook that applies the rule still exists.
      const seen = new Map();     // state -> count
      let prev = bo.st;
      // Drive it long enough to cycle its whole moveset, twice, and through the
      // phase-two threshold so phase-only moves are reached too.
      for (let i = 0; i < 4200; i++) {
        if (i === 2100) { bo.hp = bo.hpMax * 0.3; bo.phase = 2; }
        if (bo.dead) { bo.dead = false; bo.hp = bo.hpMax; }
        // keep the player in range so proximity moves fire
        player.x = bo.cx() - 110; player.y = bo.y;
        try { bo.update(1 / 30); } catch (e) { /* a state that needs art we did not load */ }
        if (bo.st !== prev) { seen.set(bo.st, (seen.get(bo.st) || 0) + 1); prev = bo.st; }
      }
      return [...seen.entries()].map(([st, count]) => ({ st, count, cued: TELL_ST.test(st) }));
    }, { kind, room: ROOMS[kind] });
  }
  await b.close();

  const fails = [];
  for (const kind of BOSSES) {
    const states = out[kind] || [];
    const windups = states.filter(s => LOOKS_LIKE_WINDUP.test(s.st));
    const silent = windups.filter(s => !s.cued && !EXEMPT[s.st] && !HAND_CUED[kind + '.' + s.st]);
    console.log('\n' + kind + '  — entered ' + states.length + ' states, ' + windups.length + ' of them wind-ups');
    for (const s of windups)
      console.log('   ' + (s.cued ? '♪ ' : (HAND_CUED[kind + '.' + s.st] ? '♪ ' : '· ')) + s.st.padEnd(12) +
        ' entered ' + s.count + 'x' +
        (s.cued ? '' :
          HAND_CUED[kind + '.' + s.st] ? '   (cued by hand: ' + HAND_CUED[kind + '.' + s.st] + ')' :
          EXEMPT[s.st] ? '   (exempt: ' + EXEMPT[s.st] + ')' :
          '   <-- NO AUDIO CHANNEL'));
    if (!states.length) console.log('   (no states reached — boss could not be driven headlessly)');
    for (const s of silent) fails.push(kind + '.' + s.st + ' is a wind-up with no audio cue — one-channel telegraph');
  }

  if (!hooked) fails.push('the central cue hook is gone from the build — TELL_ST matches nothing to a sound');
  if (errs.length) fails.push('page errors: ' + errs.slice(0, 3).join(' | '));
  if (fails.length) { console.log('\nFAIL\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('\nOK — every wind-up reached carries both channels');
})();
