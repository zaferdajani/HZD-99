// THE ARROW LEADS ON, NEVER BACK (owner, 2026-11-20: "In the quest for the
// marble, it directs me to the gate that goes to the marble cave. Once I reach
// the gate and go inside, the arrow keeps directing me back to the gate
// entrance instead of through the cave to the actual place of the marble").
// The marble's goal named the room under the hatch as its destination, so
// every cave room routed back out. For each chapter-one goal, a player in any
// room on the way is pointed at a room that is nearer the goal's real place,
// and every goal the goal line names has a place to point at.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };
  const R = await p.evaluate(() => {
    const base = { woke: 1, gateOpened: 1, tut: 1, ratchetRepaired: 1, 'on_A0B|ratchet': 1, opTold: 1, heal: 1, servoMet: 1 };
    const cases = [
      ['the marble (before the meeting: east, to the crest)', {}, ['A0', 'A1'], 'pg_goal_cross'],
      ['the marble, down the hatch and through the caves', { nfMeet: 1 }, ['A2', 'A5', 'CV1', 'CV1B', 'CV2'], 'pg_goal_marble'],
      ['the agent, past the quarry', { nfMeet: 1, crystal: 1 }, ['A0B', 'A0', 'A1', 'A2', 'A5', 'CV1', 'CV2', 'CV3', 'GA1T'], 'pg_goal_sage'],
    ];
    const dist = (from, to) => { const seen = { [from]: 0 }, q = [from]; while (q.length) { const id = q.shift(); if (id === to) return seen[id]; for (const e of pgRouteEdges(id)) if (seen[e.to] === undefined) { seen[e.to] = seen[id] + 1; q.push(e.to); } } return Infinity; };
    const out = [];
    for (const [name, flags, rooms, goalKey] of cases) {
      const res = [];
      for (const room of rooms) {
        const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, base, flags);
        sv.quests = { ratchet_forge: 'active' }; sv.visited = { A0: 1, A1: 1, A2: 1 };
        startGame(sv); loadRoom(room); G.state = 'PLAY'; PG_ROUTE.key = null;
        const goal = progressGoal(), want = pgGoalRoom(goal, G.save.flags), st = pgRouteStep();
        const ok = goal === goalKey && want && st && dist(st.to, want) < dist(room, want);
        res.push({ room, goal, want, to: st && st.to, ok: !!ok });
      }
      out.push({ name, res });
    }
    // every goal the line can name, after the opening, has a place to point at
    const named = ['pg_goal_cross', 'pg_goal_marble', 'pg_goal_quarry', 'pg_goal_gravehorn', 'pg_goal_return', 'pg_goal_sage', 'pg_goal_chime', 'pg_goal_lion', 'pg_goal_up'];
    const placeless = named.filter(k => !pgGoalRoom(k, {}));
    return { out, placeless, marbleAt: pgGoalRoom('pg_goal_marble', {}) };
  });
  for (const c of R.out) check('on ' + c.name + ', every room points one room nearer, never back', c.res.every(q => q.ok), JSON.stringify(c.res.filter(q => !q.ok).length ? c.res.filter(q => !q.ok) : c.res.map(q => q.room + '>' + q.to)));
  check('the marble\'s place is the quarry where it stands, not the room under the hatch', R.marbleAt === 'CV3', R.marbleAt);
  check('every goal the line can name has a place for the arrow to point at', R.placeless.length === 0, R.placeless.join(','));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the arrow leads on');
})().catch(e => { console.error(e); process.exit(1); });
