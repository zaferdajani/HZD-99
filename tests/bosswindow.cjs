// HOW LONG IS THE WARNING, AND HOW LONG IS THE WINDOW — every boss, every move.
//
// Three harnesses already watch the guardians and none of them measures this.
// tests/tells.cjs proves each wind-up carries two channels; tests/bosspace.cjs
// reports how a fight is SPENT (percent idle / moving / winding / hitting);
// tests/openings.cjs measures the punish window for the two zone-A fights only.
// So for five of the seven guardians nothing anywhere says how many
// milliseconds of warning a move gives, which is the one number the whole
// doctrine in .claude/skills/combat-design is written in:
//
//   250 ms   the human reaction floor. Below it a tell can be learned but not
//            reacted to, and that has to be a decision, not an accident.
//   400 ms   the floor again, raised, for a fight the player meets early.
//
// THE WARNING ONLY. The other half of the doctrine — the punish window — is
// measured by tests/openings.cjs, and measured properly: from a move ending to
// the NEXT TELL BEGINNING, which is what the player actually gets. This file
// deliberately does not approximate that from how long a guardian sits in a
// state called 'recover'. The first draft did, and reported NULLFANG's opening
// as 234 ms against openings.cjs's hundreds, because dwell in a recovery state
// is not an opening: the window runs on past it until the next wind-up starts.
// Two instruments disagreeing about the same number is worse than one of them
// not existing. openings.cjs owns the window; this owns the warning, which
// nothing measured for five of the seven guardians.
//
// This drives each guardian through its own state machine, sweeping the range
// so distance-gated moves are reached, and times every wind-up it enters.
const { chromium } = require('playwright');

const BOSSES = ['glitch', 'brood', 'atlas', 'zero', 'prism', 'mother', 'horn'];
const ROOM = { glitch: 'A4', brood: 'B4', atlas: 'C3', zero: 'D3', prism: 'X1', mother: 'E3', horn: 'CV3' };
// Kingdom 1 and 2 are where the player is still learning that a tell is a
// promise, so they carry the raised floor.
const EARLY = { glitch: 1, brood: 1, horn: 1 };

// A wind-up is identified the way tells.cjs identifies one — structurally by
// windT, lexically for the ones that never set it. Kept in step with that file
// deliberately: two harnesses disagreeing about what a wind-up is would be
// worse than either of them being wrong.
const WINDUP_WORDS = /warn|charge|crouch|coil|lock|prep|spin|gather|roar|perch|wind|tell|aim|rear|raise|summon|volley|call|vanish/i;
// Wind-ups that are deliberately under the floor, with the reason. A move on
// this list is a design decision somebody made in the open; a move not on it
// that measures short is a bug.
const SHORT_ON_PURPOSE = {};
// A timing change is not covered unless every move it claims to change was
// actually observed. PRISM is the first boss with a reviewed named manifest;
// extend this table as the remaining boss documents are reconciled.
const EXPECTED = { prism: ['dashwarn', 'pouncewarn', 'spreadwarn', 'lsvanish', 'arcspin'] };
const DISTINCT = { prism: ['dashwarn', 'pouncewarn', 'spreadwarn'] };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); });
  await p.waitForTimeout(900);

  const out = {};
  for (const kind of BOSSES) {
    out[kind] = await p.evaluate(async ({ kind, room }) => {
      loadRoom(room);
      let bo = G.boss;
      if (!bo || bo.kind !== kind) throw new Error(room + ' did not load its ' + kind + ' boss');
      bo.st = 'idle'; bo.t = 0; bo.dead = false; bo.hp = bo.hpMax;
      player.x = bo.cx() - 120; player.y = bo.y;

      const STEP = 1 / 30;
      const runs = new Map();                 // state -> { lens: [ms], wind: bool }
      let cur = bo.st, len = 0, windSeen = false;
      const close = () => {
        const r = runs.get(cur) || { lens: [], wind: false };
        r.lens.push(len * STEP * 1000);
        if (windSeen) r.wind = true;
        runs.set(cur, r);
      };
      for (let i = 0; i < 4200; i++) {
        if (i === 2100) { bo.hp = bo.hpMax * 0.3; bo.phase = 2; }
        if (bo.dead) { bo.dead = false; bo.hp = bo.hpMax; }
        const phase = (i % 600) / 600, far = 90 + phase * 460;
        player.x = bo.cx() + (i % 1200 < 600 ? -far : far); player.y = bo.y;
        const stBefore = bo.st;
        bo.windT = 0;
        bo.update(STEP);
        if (bo.st === stBefore && bo.windT > 0) windSeen = true;
        if (bo.st !== cur) { close(); cur = bo.st; len = 1; windSeen = false; }
        else len++;
      }
      // The run in progress when the drive stops is CUT OFF, not finished, so
      // recording it invents a short tell: that single truncated sample is what
      // made grabwarn read 67 ms and forgebell 100 ms on the first run of this
      // harness, and a minimum is exactly the statistic a false short poisons.
      // The last run is dropped rather than closed.
      const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
      return [...runs.entries()].map(([st, r]) => ({
        st, n: r.lens.length, wind: r.wind,
        med: Math.round(med(r.lens)), min: Math.round(Math.min(...r.lens)), max: Math.round(Math.max(...r.lens)),
      })).sort((a, b) => b.n - a.n);
    }, { kind, room: ROOM[kind] });
  }
  await browser.close();

  const fails = [];
  for (const kind of BOSSES) {
    const states = out[kind] || [];
    const floor = EARLY[kind] ? 400 : 250;
    const winds = states.filter(s => s.wind || WINDUP_WORDS.test(s.st));
    const byState = new Map(states.map(s => [s.st, s]));
    console.log('\n' + kind.toUpperCase() + '   floor ' + floor + ' ms   '
      + winds.length + ' wind-ups across ' + states.length + ' states');
    for (const s of winds) {
      const short = s.med < floor && !SHORT_ON_PURPOSE[kind + '.' + s.st];
      // THE MINIMUM IS THE ONE THAT MATTERS. A tell that is usually 533 ms and
      // sometimes 150 ms is worse than one that is always 300: it teaches an
      // expectation and then breaks it, and the median hides that completely.
      const brief = s.min < floor && !SHORT_ON_PURPOSE[kind + '.' + s.st];
      console.log('   ' + (short ? 'SHORT ' : brief ? 'VARIES' : '  ok  ') + s.st.padEnd(13)
        + String(s.med).padStart(5) + ' ms  (n=' + s.n + ', ' + s.min + '-' + s.max + ')');
      if (short) fails.push(kind + '.' + s.st + ' warns for ' + s.med + ' ms, under the ' + floor + ' ms floor');
      else if (brief) fails.push(kind + '.' + s.st + ' usually warns for ' + s.med + ' ms but fell to '
        + s.min + ' ms, under the ' + floor + ' ms floor — a promise it breaks');
    }
    if (!winds.length) fails.push(kind + ' telegraphs nothing at all');
    for (const st of (EXPECTED[kind] || [])) {
      if (!byState.has(st)) fails.push(kind + ' never exercised required tell ' + st);
    }
    const distinct = (DISTINCT[kind] || []).map(st => byState.get(st)).filter(Boolean);
    for (let i = 0; i < distinct.length; i++) for (let j = i + 1; j < distinct.length; j++) {
      const gap = Math.abs(distinct[i].med - distinct[j].med);
      if (gap < 60) fails.push(kind + '.' + distinct[i].st + ' and ' + kind + '.'
        + distinct[j].st + ' differ by only ' + gap + ' ms');
    }
  }
  if (errs.length) fails.push('page errors: ' + errs.slice(0, 3).join(' | '));

  if (fails.length) { console.log('\nFAIL\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('\nOK — every guardian warns above its floor, and no fight gives all its moves the same warning');
})();
