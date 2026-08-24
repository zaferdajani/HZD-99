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

// HOW A WIND-UP IS IDENTIFIED, and why not by its name.
//
// The first version of this harness matched state names against a wider list of
// wind-up-sounding words. It caught NULLFANG's 'roar' and 'perch' and then
// missed TALONHOST's 'volley' — 900 ms of hauling to centre-top with the wings
// loading before a seven-feather fan — because "volley" is not a word anybody
// puts on a list of wind-ups. A lexical rule cannot find these. It can only find
// the ones somebody already thought of, which are exactly the ones already fixed.
//
// So the rule is structural: a state that sets `windT` IS the engine declaring
// "I am winding up" — that field exists for nothing else, and it is what drives
// the wind-up pose. Any state that declares it and earns no audio cue is a
// one-channel telegraph BY CONSTRUCTION, whatever it happens to be called.
// The structural signal alone is not enough either: some bosses telegraph with a
// named state and no windT at all (MOTHER-V's nwcharge, ringcharge, grabwarn).
// So a state is a wind-up if EITHER signal says so — structural catches the ones
// nobody would think to name, lexical catches the ones that never set the field.
// Neither list is a superset of the other, which is why both are here.
const WINDUP_WORDS = /warn|charge|crouch|coil|lock|prep|spin|gather|roar|perch|wind|tell|aim|rear|raise|summon|volley|call/i;
const isWindup = (s) => s.wind || WINDUP_WORDS.test(s.st);
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
  const hooked = /TELL_ST\.test\(this\.st \|\| ''\)\) sfx\(/.test(
    require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8'));
  console.log('central cue hook present: ' + hooked);
  // ...and that the sound it fires is SIZED. The hook used to name one cue
  // literally, so matching the literal was proof enough. It is not any more:
  // the warning is one sound at three sizes and the size tracks the guardian,
  // which shipped once wired to 'tellbig' for every boss — a hook that fires
  // is not a hook that says anything. Both halves are asserted.
  const sizes = await p.evaluate((kinds) => {
    const out = {};
    for (const k of kinds) { const b = new Boss(k, 300, 300); out[k] = b.tellCue(); }
    return out;
  }, BOSSES);
  const cues = Object.values(sizes);
  const legal = cues.every(c => c === 'tell' || c === 'tellmid' || c === 'tellbig');
  const varied = new Set(cues).size >= 2;
  console.log('warning size per guardian: ' +
    Object.entries(sizes).map(([k, c]) => k + '=' + c).join('  '));

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
      const seen = new Map();     // state -> {count, wind}
      let prev = bo.st;
      // Drive it long enough to cycle its whole moveset, twice, and through the
      // phase-two threshold so phase-only moves are reached too.
      for (let i = 0; i < 4200; i++) {
        if (i === 2100) { bo.hp = bo.hpMax * 0.3; bo.phase = 2; }
        if (bo.dead) { bo.dead = false; bo.hp = bo.hpMax; }
        // SWEEP THE DISTANCE. Holding the player at one range pins a boss in
        // whichever move that range gates: FURNACE CHOIR sat in `slamwarn` for
        // four thousand steps and its `forgebell` and `hymn` — both real
        // telegraphs, both one-channel — were never reached, so the harness
        // reported it clean. A fight is a function of distance; drive it as one.
        const phase = (i % 600) / 600;
        const far = 90 + phase * 460;
        player.x = bo.cx() + (i % 1200 < 600 ? -far : far); player.y = bo.y;
        // ATTRIBUTING windT IS THE WHOLE DIFFICULTY. A step that changes state is
        // ambiguous in both directions: 'idle' can set windT for the warn state
        // it is entering (blaming idle), and 'swipewarn' can set windT on the
        // same step it hands over to 'swipe' (blaming swipe). Both readings
        // produce a page of false positives, and I got each of them in turn.
        // So transition steps are simply not used for this: a wind-up lasts
        // 300-1100 ms, which is 9 to 33 steps, and the steady ones are
        // unambiguous. Counting is unaffected.
        const stBefore = bo.st;
        bo.windT = 0;                       // so windT seen after the step is THIS step's
        try { bo.update(1 / 30); } catch (e) { /* a state that needs art we did not load */ }
        const r = seen.get(bo.st) || { count: 0, wind: false };
        if (bo.st === stBefore && bo.windT > 0) r.wind = true;
        if (bo.st !== prev) { r.count++; prev = bo.st; }
        seen.set(bo.st, r);
      }
      return [...seen.entries()].map(([st, r]) => ({ st, count: r.count, wind: r.wind, cued: TELL_ST.test(st) }));
    }, { kind, room: ROOMS[kind] });
  }
  await b.close();

  const fails = [];
  for (const kind of BOSSES) {
    const states = out[kind] || [];
    const windups = states.filter(isWindup);
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
  if (!legal) fails.push('a guardian asks for a warning that is not one of the three sizes: ' + JSON.stringify(sizes));
  if (!varied) fails.push('every guardian makes the SAME warning — the three sizes are decoration, not information');
  if (errs.length) fails.push('page errors: ' + errs.slice(0, 3).join(' | '));
  if (fails.length) { console.log('\nFAIL\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('\nOK — every wind-up reached carries both channels');
})();
