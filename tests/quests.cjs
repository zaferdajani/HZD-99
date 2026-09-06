// A kingdom you can be sent into. Each errand must be offerable, trackable,
// completable, payable, and then over — and the wings they send you to must
// exist and be reachable.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); });
  await p.waitForTimeout(500);
  console.log(await p.evaluate(() => {
    const out = { errands: [], wings: {}, flow: {} };
    for (const q of QUESTS) out.errands.push({ id: q.id, npc: q.npc, kind: q.kind, asks: qText(q) });
    // the wings exist, are built, and lead back
    for (const id of ['A6', 'A7']) {
      const r = ROOMS[id], g = buildRoom(id);
      out.wings[id] = { size: r.w + 'x' + r.h, exits: Object.keys(r.exits).join(''),
                        ents: r.ents.length, solidRows: g.filter(row => row.indexOf('#') >= 0).length };
    }
    // and one errand, all the way through
    const q = questById('servo_coil');
    const log = [];
    log.push('before: ' + qState(q.id));
    qSet(q.id, 'active');
    log.push('progress ' + qProgress(q) + '/' + qGoal(q) + ' done=' + qDone(q));
    questTake('coil');
    log.push('after finding it: ' + qProgress(q) + '/' + qGoal(q) + ' done=' + qDone(q));
    const scrap0 = G.save.scrap, iq0 = G.save.iq;
    questPay(q);
    log.push('paid: +' + (G.save.scrap - scrap0) + ' scrap, +' + (G.save.iq - iq0) + ' IQ, state=' + qState(q.id));
    log.push('offered again? ' + (questFor('servo') ? questFor('servo').id : 'no'));
    out.flow = log;
    // and the cull counter
    G.save.culls = {}; qSet('servo_swarm', 'active');
    for (let i = 0; i < 6; i++) questKill('crawler');
    out.cull = qProgress(questById('servo_swarm')) + '/6 done=' + qDone(questById('servo_swarm'));
    return out;
  }));
  console.log('pageerrors:', errs.length ? errs.slice(0, 3) : 'none');
  await b.close();
})();
