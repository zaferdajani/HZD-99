// A RING IS WOKEN, NOT POPPED IN — and it leads somewhere new.
// Owner, 2026-11-16: "if you're going to show doors, at least make the sage or
// the lion... conjure it... Or... make it like a dormant door without the
// greenish circles... while the sage will activate it for me after I defeat it.
// ...So you will take over the gameplay to do that"; "why am I seeing it right
// now after defeating Nilfang?... The door should take me somewhere new".
//   A  before the fight the ring STANDS there, dark, and refuses her
//   B  with the fight won it is woken once, in front of her: her controls are
//      held, the field comes up, and the save remembers
//   C  the next visit finds it simply awake — no second ceremony
//   D  a ring to a keeper's chamber she has already finished is not offered
//   E  the comic that replayed the purification after its film is library-only
const { chromium } = require("playwright");
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? "ok   " : "FAIL ") + n + (d != null ? "  " + (typeof d === "string" ? d : JSON.stringify(d)) : "")); if (!ok) bad++; };
const open = async () => { const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" }); const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: "block" }); const errs = []; page.on("pageerror", e => errs.push(String(e)));
  await page.goto("http://127.0.0.1:" + PORT + "/index.html", { waitUntil: "domcontentloaded" }); await page.waitForFunction(() => typeof startGame === "function", { timeout: 20000 }); return { browser, page, errs }; };

(async () => { const { browser, page, errs } = await open();
  const R = await page.evaluate(async () => { window.requestAnimationFrame = () => 0; const out = {};
    const fresh = (fl) => { const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, crystal: 1 }, fl || {}); startGame(sv); };
    const quiet = () => { if (G.dialog) { let n = 0; while (G.dialog && n++ < 9) dialogClose(G.dialog); } if (G.state !== 'PLAY') G.state = 'PLAY'; };
    const enter = (id) => { loadRoom(id); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.bossEntry = null; G.boss = null; G.enemies = []; };
    const stand = (x) => { player.x = x; const g = groundColumnAt(x + player.w / 2); if (g) player.y = Math.min.apply(null, g) - player.h - 1; player.vx = player.vy = 0; };
    fresh(); enter('A4'); await new Promise(r => setTimeout(r, 600));
    let d = gateDoors().find(q => q.to === 'GA1'); out.A = { stands: !!d, ring: d ? !!ringGateFor(d) : false, locked: d ? gateLocked(d) : null };
    if (d) { stand(gateWorldX(d) - player.w / 2); for (let i = 0; i < 20; i++) { quiet(); update(1 / 60); } stand(gateWorldX(d) - player.w / 2); const acc = gateEnter(); out.A.accepted = !!acc; out.A.room = G.roomId; quiet(); out.A.wake = !!G.ringWake; }
    // B: the fight is won
    G.save.flags.bossGlitch = 1; stand(gateWorldX(d) + 160); for (let i = 0; i < 20; i++) update(1 / 60);
    const B = { held: 0, frames: 0, moved: 0, lvl: [] }; const x0 = player.x; let started = -1;
    for (let i = 0; i < 400; i++) { for (const k in keys) keys[k] = 0; keys.ArrowLeft = 1; quiet(); update(1 / 60);
      if (G.ringWake) { if (started < 0) { started = i; B.x0 = player.x; } B.frames++; if ((player.stunT || 0) > 0) B.held++; B.lvl.push(+ringWakeLevel(d).toFixed(2)); B.moved = Math.max(B.moved, Math.abs(player.x - B.x0)); }
      else if (started >= 0) break; }
    keys.ArrowLeft = 0; B.started = started; B.flag = G.save.flags[ringWakeKey(d)] || 0; B.asleep = ringAsleep(d); B.lvl0 = B.lvl[0]; B.lvl1 = B.lvl[B.lvl.length - 1]; B.rises = B.lvl.every((v, i) => i === 0 || v >= B.lvl[i - 1]); delete B.lvl; out.B = B;
    // C: again
    enter('A4'); d = gateDoors().find(q => q.to === 'GA1'); stand(gateWorldX(d) + 120); let again = 0; for (let i = 0; i < 120; i++) { quiet(); update(1 / 60); if (G.ringWake) again++; }
    stand(gateWorldX(d) - player.w / 2); for (let i = 0; i < 5; i++) update(1 / 60); const acc2 = gateEnter(); for (let i = 0; i < 400 && G.gateWalk; i++) updateGateWalk(1 / 60);
    out.C = { again, accepted: !!acc2, room: G.roomId };
    // D: the keeper's chamber is finished
    fresh({ bossGlitch: 1, sageTame_GA1D: 1 }); enter('A4'); out.D = { a4: gateDoors().filter(q => q.to === 'GA1').length }; enter('GA1'); out.D.ga1 = gateDoors().filter(q => q.to === 'A4').length;
    fresh({ bossGlitch: 1 }); enter('A4'); out.D.open = gateDoors().filter(q => q.to === 'GA1').length;
    // E: the comic
    const fr = PANEL_SEQ.find(q => q.id === 'free'); out.E = { manual: fr ? !!fr.manual : null, keys: PANEL_SEQ.length };
    return out; });
  console.log('── ring-wake  — a ring a fight opens stands dark, is woken once in front of her, and never leads back to a finished chamber');
  check('A  before the fight the ring stands there, dark', R.A.stands && R.A.ring && R.A.locked === true, R.A);
  check('   ...and refuses her', R.A.accepted === false && R.A.room === 'A4', R.A);
  check('B  with the fight won it is woken in front of her', R.B.started >= 0 && R.B.frames > 120, R.B);
  check('   ...her controls are held while it happens', R.B.held > R.B.frames * 0.7 && R.B.moved < 30, { held: R.B.held, of: R.B.frames, moved: Math.round(R.B.moved) });
  check('   ...the field comes UP, it does not appear', R.B.lvl0 === 0 && R.B.lvl1 === 1 && R.B.rises, { from: R.B.lvl0, to: R.B.lvl1 });
  check('   ...and the save remembers it', R.B.flag === 1 && R.B.asleep === false);
  check('C  the next visit has no second ceremony, and the ring carries her', R.C.again === 0 && R.C.accepted && R.C.room === 'GA1', R.C);
  check("D  a finished keeper's chamber is not offered again", R.D.a4 === 0 && R.D.ga1 === 0 && R.D.open === 1, R.D);
  check('E  the comic that replayed the purification is library-only', R.E.manual === true, R.E);
  check('no page errors', errs.length === 0, errs.slice(0, 2));
  await browser.close(); console.log(bad ? '\nFAILED: ' + bad : '\nOK — rings are woken, once, and lead somewhere new'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
