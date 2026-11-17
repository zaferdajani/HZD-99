// A POD NEVER STANDS IN A DOOR (owner, 2026-11-17: "some pods are existing superimposed on
// doors which makes it hard to choose enter or rest").
// A door answers UP (and takes her) within 90 px of its stand spot; a pod answers INTERACT
// within 46 px of its middle. Where the two reaches meet, one spot means two things.
//   A  in every room of both builds, every pod is clear of every door that can EVER exist
//      there (gateDoorsAll — a door that has not been built yet still gets its room)
//   B  and of every other thing she can interact with: one prompt to a spot
//   C  the two the sweep found: the Alpha's road and the Oracle's corridor
//   D  standing at the pod, the game offers REST and no door; standing at the door, the door and no pod
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  console.log('── pod-door — a save pod and a door are never the same spot');
  for (const pg of ['index.html', 'odyssey.html']) {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto('http://127.0.0.1:' + PORT + '/' + pg, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
    const R = await page.evaluate(() => { window.requestAnimationFrame = () => 0; const out = { pods: 0, doors: [], things: [], at: {} };
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1 }); startGame(sv);
      const DOOR_REACH = 90, POD_REACH = 46;
      for (const id of Object.keys(ROOMS)) { try { loadRoom(id); } catch (e) { continue; }
        const pods = G.statics.filter(s => s.type === 'bench');
        for (const pd of pods) { out.pods++; const pc = pd.x + pd.w / 2;
          for (const d of gateDoorsAll(id)) { const dx = Math.abs(pc - gateWorldX(d)); if (dx < DOOR_REACH + POD_REACH + 14) out.doors.push(id + ': pod ' + Math.round(pc) + ' / door to ' + d.to + ' ' + Math.round(gateWorldX(d)) + ' (' + Math.round(dx) + ' px)'); }
          for (const s of G.statics) { if (s === pd) continue; const reach = s.type === 'npc' && typeof npcReach === 'function' ? npcReach(s) : 46;
            const dx = Math.abs(pc - (s.x + s.w / 2)), dy = Math.abs(pd.y + pd.h / 2 - (s.y + s.h / 2)); if (dx < POD_REACH + reach && dy < 60) out.things.push(id + ': pod ' + Math.round(pc) + ' / ' + s.type + ' ' + Math.round(s.x + s.w / 2)); } } }
      // D: the two rooms, played
      for (const id of ['A10R', 'B3']) { loadRoom(id); G.state = 'PLAY'; G.wake = G.dialog = G.cut = null; const pd = G.statics.find(s => s.type === 'bench');
        const stand = (x) => { player.x = x - player.w / 2; player.y = pd.y + pd.h - player.h; player.on = true; return { near: (findNear() || {}).type || null, gate: (gateHere() || {}).to || null }; };
        const door = gateDoorsAll(id).reduce((a, d) => Math.abs(gateWorldX(d) - pd.x) < Math.abs(gateWorldX(a) - pd.x) ? d : a);
        out.at[id] = { pod: stand(pd.x + pd.w / 2), door: stand(gateWorldX(door)), gap: Math.round(Math.abs(pd.x + pd.w / 2 - gateWorldX(door))) }; }
      return out; });
    const tag = pg === 'index.html' ? 'CLAWBYTE' : 'NOSTOS';
    check(tag + '  A  every pod is clear of every door its room can ever have', R.pods >= 15 && R.doors.length === 0, R.doors.length ? R.doors : R.pods + ' pods');
    check(tag + '  B  ...and of everything else she can interact with', R.things.length === 0, R.things.length ? R.things : null);
    for (const id of ['A10R', 'B3']) { const a = R.at[id];
      check(tag + '  C  ' + id + ': the pod stands well back from the door', a.gap >= 150, a.gap + ' px');
      check(tag + '  D  ' + id + ': at the pod she is offered REST and no door; at the door, the door and no pod', a.pod.near === 'bench' && a.pod.gate === null && a.door.gate && a.door.near !== 'bench', a); }
    check(tag + '  no page errors', errs.length === 0, errs.slice(0, 2));
    await page.close(); }
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — rest and enter are two places');
})().catch(e => { console.error(e); process.exit(1); });
