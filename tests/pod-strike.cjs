// HITTING GIVES HER ENERGY — owner, 2026-11-27: "Why isn't hitting the pods give me any energy that
// helps me to recharge?"
// Two readings, both held here:
//   (a) her blows fill the volt ring (Ratchet: "her hits fill it"). Every kind of ordinary machine in
//       the robot world, struck once by real input, pays volts.
//   (b) a SAVE POD she strikes is a pod she uses: the blade used to pass through it and nothing
//       happened (js/entities.js, A STRUCK POD IS A USED POD).
//   A  hits fill volts: every machine kind measured, each struck once from an empty ring, pays >= 8
//   B  in every room of both builds, a pod struck by real input (one press of attack beside it) rests
//      her: cores full, volts full, the save point is that pod, and the pod's own "rested" line shows
//   C  not as a trap: with a hostile body beside the pod the strike does not dock her (the pod answers
//      with a spark and a refusal), and a swing that strikes a machine beside a pod does not dock her
//   D  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── pod-strike — her hits fill volts, and a pod she strikes recharges her');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const errs = [];
  const open = async (pg) => {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    page.on('pageerror', e => errs.push(pg + ': ' + String(e)));
    await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
    await page.goto('http://127.0.0.1:' + PORT + '/' + (pg === 'index.html' && process.env.PAGE ? process.env.PAGE : pg), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
    await page.evaluate(() => {
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2;
      Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, opDone: 1 });
      startGame(sv);
      window.__swing = (n) => {
        for (const k in keys) keys[k] = 0;
        keysP.KeyX = 1; keys.KeyX = 1; update(1 / 60); keysP.KeyX = 0; keys.KeyX = 0;
        for (let i = 0; i < (n || 20); i++) { update(1 / 60); G.hitStop = 0; if (G.state === 'DIALOG' && !G.recharge) { G.dialog = null; G.state = 'PLAY'; } }
      };
      window.__play = (id) => { loadRoom(id); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.lesson = null; G.toasts = []; G.panels = null; };
    });
    return page;
  };
  // A — hits fill volts
  const pa = await open('index.html');
  const A = await pa.evaluate(() => {
    const out = { kinds: {}, nohit: [] };
    for (const room of Object.keys(ROOMS)) {
      try { __play(room); } catch (e) { continue; }
      if (G.roomId !== room) continue;
      const foes = G.enemies.filter(e => !e.dead && !e.disabled && !(typeof isPet === 'function' && isPet(e)));
      for (const e of foes) {
        const kind = e.kind || e.type; if (out.kinds[kind]) continue;
        G.enemies = [e]; G.boss = null;
        player.x = e.x - player.w - 6; player.y = e.y + e.h - player.h; player.face = 1; player.vx = player.vy = 0; player.volts = 0; player.iT = 0;
        const hp0 = e.hp; let v = 0;
        for (const k in keys) keys[k] = 0;
        keysP.KeyX = 1; keys.KeyX = 1; update(1 / 60); keysP.KeyX = 0; keys.KeyX = 0;
        for (let i = 0; i < 20; i++) { update(1 / 60); G.hitStop = 0; G.dialog = null; G.state = 'PLAY'; v = Math.max(v, player.volts); }
        if (e.hp < hp0) out.kinds[kind] = { room, volts: v };
      }
    }
    return out;
  });
  const kinds = Object.entries(A.kinds);
  check('A  her blows fill the volt ring: every machine kind struck pays volts (>= 8)', kinds.length >= 10 && kinds.every(([, r]) => r.volts >= 8),
    Object.fromEntries(kinds.map(([k, r]) => [k, r.volts])));
  await pa.close();
  // B, C — the pods, in both builds
  const B = {}, Cr = {};
  for (const pg of ['index.html', 'odyssey.html']) {
    const page = await open(pg);
    const R = await page.evaluate(() => {
      const out = { pods: [], hunted: null, mixed: null };
      const stand = (pd) => {
        player.x = pd.x + pd.w / 2 - 40 - player.w / 2; player.y = pd.y + pd.h - player.h; player.face = 1; player.vx = player.vy = 0; player.on = true;
        for (let i = 0; i < 6; i++) { update(1 / 60); G.state = 'PLAY'; G.dialog = null; }
        player.face = 1;
      };
      const rooms = Object.keys(ROOMS);
      for (const id of rooms) {
        try { __play(id); } catch (e) { continue; }
        if (G.roomId !== id) continue;
        const pd = G.statics.find(s => s.type === 'bench'); if (!pd) continue;
        G.enemies = []; G.boss = null; G.save.bench = null;
        stand(pd);
        player.cores = 1; player.volts = 0;
        __swing(10);
        for (let i = 0; i < 400 && G.recharge; i++) { update(1 / 60); G.hitStop = 0; }
        const rested = { id, rest: !!(G.save.bench && G.save.bench.room === id), full: player.cores === player.maxCores(), volts: player.volts,
          said: G.toasts.some(q => q.text === t('rested').trim()) };
        // (her body leaves the pod's hold a beat after the pod lets go: the next room's strike waits for it)
        for (let i = 0; i < 200 && player.rechargeT > 0; i++) { update(1 / 60); G.hitStop = 0; }
        for (let i = 0; i < 30; i++) update(1 / 60);
        out.pods.push(rested);
      }
      // C: a hostile body beside the pod
      __play('A0B'); const pd = G.statics.find(s => s.type === 'bench');
      const foe = new Enemy('crawler', pd.x + pd.w / 2 + 70, pd.y + pd.h - 30); G.enemies = [foe]; G.boss = null; G.save.bench = null;
      stand(pd); player.cores = 1; player.volts = 0; foe.x = pd.x + pd.w / 2 + 120;
      __swing(10);
      out.hunted = { docked: !!G.recharge || !!(G.save.bench && G.save.bench.room === 'A0B') };
      // a swing that strikes a machine standing at the pod
      __play('A0B'); const pd2 = G.statics.find(s => s.type === 'bench'); G.boss = null; G.save.bench = null;
      stand(pd2); player.cores = 1;
      const foe2 = new Enemy('crawler', player.x + player.w + 4, pd2.y + pd2.h - 30); foe2.y = pd2.y + pd2.h - foe2.h; G.enemies = [foe2];
      const hp0 = foe2.hp; __swing(10);
      out.mixed = { struck: foe2.hp < hp0, docked: !!G.recharge || !!(G.save.bench && G.save.bench.room === 'A0B') };
      return out;
    });
    B[pg] = R.pods; Cr[pg] = { hunted: R.hunted, mixed: R.mixed };
    await page.close();
  }
  const all = Object.entries(B).flatMap(([pg, L]) => L.map(r => Object.assign({ pg }, r)));
  const badPods = all.filter(r => !(r.rest && r.full && r.volts >= 99 && r.said));
  check('B  every pod in both builds, struck once, rests her: cores and volts full, saved there, "rested" shown', all.length >= 20 && !badPods.length,
    { pods: Object.fromEntries(Object.entries(B).map(([k, L]) => [k, L.length])), failing: badPods.slice(0, 6) });
  check('C  not a trap: a hostile beside the pod keeps the strike from docking her; a blow that lands on a machine there does not dock her', Object.values(Cr).every(c => !c.hunted.docked && c.mixed.struck && !c.mixed.docked), Cr);
  check('D  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — blows pay volts, and a struck pod recharges her');
})().catch(e => { console.error(e); process.exit(1); });
