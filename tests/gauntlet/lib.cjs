// THE GAUNTLET — one recorder for every boss fight, so the players' numbers mean the same thing.
// (Written 2026-11-24 for five player agents who played every chapter-one boss against the rhino;
//  tests/boss-ladder.cjs runs their bots, kept in tests/gauntlet/bots/.)
//
//   const { fight } = require('<this dir>/lib.cjs');
//   const r = await fight({ boss: 'horn', seed: 1, bot: BOT_SOURCE, secs: 150, url, video: false });
//
// boss: 'horn' (GRAVEHORN, CV3) | 'tally' (the agent TALLYMAN, GA1D) | 'glitch' (NULLFANG, A4)
//       | 'alpha' (the Wolf King, A10) | 'chime' (CHIME, A9)
// bot:  the SOURCE of a function (bo, P, ctx) run in the page once per frame before update(1/60).
//       bo = the boss body, P = player. It drives her by setting keys[...] (held) and keysP[...]
//       (pressed this frame); every key is released before it is called. Keys: ArrowLeft ArrowRight
//       ArrowUp ArrowDown, Space (jump), KeyX (attack), KeyZ (dash) — check js/engine.js KEYMAP if
//       unsure. ctx is a scratch object that persists across frames, plus ctx.frame, ctx.dt.
//       Read the boss's state from bo.st, bo.t, bo.x/y/w/h, bo.cx(), bo.face, bo.vx …; read
//       projectiles from G.projs and the boss's own lists (e.g. bo.missiles, bo.rocks, bo.shocks).
// FAIR PLAY: a strong human reacts in about 250 ms. ctx.seen is the boss as it was 15 frames ago
//   ({ st, t, x, y, w, h, cx, vx, vy, face, on }); a bot may DECIDE only on ctx.seen for the boss's
//   state and position. Her own body (P), the room, and projectiles in flight may be read live.
//   (o.react overrides the 15 frames: 0 is a superhuman, for exploit hunting only, and must be said.)
// Returns the SAME metrics for every boss:
//   won, died, secs (from the fight starting to its end), coresLost, hurtBy {source: n}
//   blows: every blow of hers that reached the boss — { full, turned, nothing } where full = dealt
//          at least 90% of what it would on an open body, turned = less, nothing = 0
//   THE AGENT (tally) is not killed: claws break it down to 30% and it LOCKS — that is the fight
//   won; the crystal's purification after it is a ritual. It has no bo.st: the recorder names its
//   move with agentRigMove (stand walk coil lunge gather exhale lock pure).
//   hits = blows that took hp off it (full + turned): the hits-to-kill of a won fight
//   fullBlowRate = full / all blows; dps = boss hp lost per second; bossHp '{hp}/{max}'
//   openShare = share of fight frames in which a blow would land whole (probe, see below)
//   moves: { state: times entered } ; distinct: number of distinct non-idle states
//   tells: { state: mean seconds } for states the boss marks as wind-ups (windT or name)
// THE PROBE: every 3rd frame the recorder asks "would a full blow land whole right now?" without
// hitting anything: not protected, not story-protected, hideK absent or >= 1, not evading, and
// for the agent, sageVulnerable-style laws via its own fields (see AGENT below). openShare is the
// share of frames it says yes. It ignores whether she could REACH it — that is what the bot is for.
const { chromium } = require('playwright');
const ROOMS = { horn: 'CV3', tally: 'GA1D', glitch: 'A4', alpha: 'A10', chime: 'A9' };
const ENTRY = { chime: 'L' };   // A9's default spawn is its floor shaft, which drops her into A8
async function fight(o) {
  const browser = o.browser || await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(o.url || ('http://127.0.0.1:' + (process.env.TEST_PORT || 8220) + '/index.html'), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const r = await page.evaluate(({ boss, room, entry, seed, bot, secs, flags, react }) => {
    window.requestAnimationFrame = () => 0;
    let h = (seed || 1) * 2654435761 >>> 0; Math.random = () => ((h = Math.imul(h ^ (h >>> 15), 2246822519) + 0x9e3779b9 >>> 0) % 100000) / 100000;
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2;
    Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, rubbleA5: 1, rubbleCV1B: 1, crystal: 1, pl_cshard: 1, beacon: 1, bossHorn: 1, ghMet: 1, ghWon: 1, gateOpened: 1, bossGlitch: 0 }, flags || {});
    if (boss === 'horn') { delete sv.flags.bossHorn; delete sv.flags.ghWon; delete sv.flags.crystal; delete sv.flags.pl_cshard; }
    if (boss === 'glitch') { delete sv.flags.bossGlitch; }
    startGame(sv); if (entry) loadRoom(room, entry); else loadRoom(room);
    const clear = () => { if (G.dialog || G.cut || G.panels || G.meet || G.state !== 'PLAY') { G.dialog = G.cut = G.panels = G.meet = G.wake = null; G.state = 'PLAY'; } };
    const B = () => boss === 'tally' ? G.enemies.find(e => e.kind === 'sage') : (G.boss || G.enemies.find(e => e.kind === boss));
    const hurtBy = {}; const h0 = player.hurt.bind(player);
    player.hurt = function (d, fx2, src, foe) { const c0 = player.cores; const rr = h0(d, fx2, src, foe); if (player.cores < c0) hurtBy[src || '?'] = (hurtBy[src || '?'] || 0) + (c0 - player.cores); return rr; };
    // every blow that reaches the boss: what it would have been, what it was
    const blows = { full: 0, turned: 0, nothing: 0 }; const D0 = window.dealDmg;
    window.dealDmg = function (e, dm, ...rest) { const exp = (typeof combatDamage === 'function' && typeof combatDefense === 'function') ? combatDamage(dm, combatDefense(e)) : dm; const t0 = e && e.turnedT; if (e) e.turnedT = 0; const out = D0.call(this, e, dm, ...rest); if (e === B() && dm > 0) { const k = out / Math.max(1, exp); if (out <= 0) blows.nothing++; else if ((e.turnedT || 0) > 0.2 || k < 0.9) blows.turned++; else blows.full++; } return out; };   // (whole = what an OPEN body takes after its armour value; turned = its plate (turnedT) or less)
    const open = () => { const e = B(); if (!e) return false; if (typeof combatProtected === 'function' && combatProtected(e)) return false; if (typeof storyProtected === 'function' && storyProtected(e)) return false;
      if (e.hideK != null && e.hideK < 1 && e.st !== 'daze') return false; if ((e.evadeT || 0) > 0 || (e.stormT || 0) > 0) return false;
      if (e.kind === 'sage' && (e.locked || e.tame)) return false; return true; };
    const fn = new Function('bo', 'P', 'ctx', 'return (' + bot + ')(bo, P, ctx);');
    const ctx = { dt: 1 / 60, frame: 0 }, hist = [], REACT = react == null ? 15 : react; const moves = {}, tellT = {}, tellN = {}; let last = '', enteredAt = 0, t0 = -1, frames = 0, probes = 0, opens = 0, died = false, hpStart = null;
    const START = { dorm: 1, intro: 1, ghwake: 1, ghspeak: 1, ghbellow: 1 };
    for (; frames < 60 * (secs || 150); frames++) {
      clear(); const bo = B(); if (!bo) { update(1 / 60); continue; }
      if (!bo.cx) bo.cx = function () { return this.x + this.w / 2; };
      if (bo.kind === 'sage') bo.st = typeof agentRigMove === 'function' ? agentRigMove(bo) : 'stand';
      if (t0 < 0 && !START[bo.st]) { t0 = frames; hpStart = bo.hp; }
      if (bo.st !== last) { const dur = (frames - enteredAt) / 60;
        if (last && (/warn|prep|coil|crouch|gather|tell|wind|charge|aim|rear|raise|perch|lock/i.test(last))) { tellT[last] = (tellT[last] || 0) + dur; tellN[last] = (tellN[last] || 0) + 1; }
        moves[bo.st] = (moves[bo.st] || 0) + 1; last = bo.st; enteredAt = frames; }
      if (bo.dead || bo.hp <= 0 || bo.purified || bo.tamed || bo.tame || bo.locked || (G.save.flags && G.save.flags.ghWon && boss === 'horn')) break;
      for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0;
      // A HUMAN'S EYES: what she can react to is the boss as it was REACT frames ago (250 ms)
      hist.push({ st: bo.st, t: bo.t, x: bo.x, y: bo.y, w: bo.w, h: bo.h, cx: bo.cx(), vx: bo.vx || 0, vy: bo.vy || 0, face: bo.face || bo.dir || 0, on: bo.on });
      if (hist.length > 120) hist.shift();
      ctx.seen = hist[Math.max(0, hist.length - 1 - REACT)];
      ctx.frame = frames; try { fn(bo, player, ctx); } catch (e) { ctx.err = String(e); }
      if (t0 >= 0 && frames % 3 === 0) { probes++; if (open()) opens++; }
      update(1 / 60);
      if (player.dead) { died = true; break; }
    }
    const bo = B(); const secsF = (frames - Math.max(0, t0)) / 60;
    const all = blows.full + blows.turned + blows.nothing, lost = hpStart != null && bo ? hpStart - Math.max(0, bo.hp) : 0;   // (the agent: down to its floor, 30%: that is its fight)
    const tells = {}; for (const k in tellT) tells[k] = +(tellT[k] / tellN[k]).toFixed(2);
    const idle = /^(idle|rest|walk|dorm|intro|stand|ghwake|ghspeak|ghbellow)$/;
    return { boss, room: G.roomId, seed, won: !!(bo && (bo.dead || bo.hp <= 0 || bo.purified || bo.tamed || bo.tame || bo.locked)) || !!(boss === 'horn' && G.save.flags.ghWon), died,
      secs: +secsF.toFixed(1), coresLost: 5 - Math.max(0, player.cores), hurtBy, blows, hits: blows.full + blows.turned, fullBlowRate: all ? +(blows.full / all).toFixed(2) : 0,
      dps: secsF > 0 ? +(lost / secsF).toFixed(2) : 0, bossHp: bo ? Math.round(Math.max(0, bo.hp)) + '/' + Math.round(bo.hpMax || bo.hpMax0 || 0) + (bo.kind === 'sage' ? ' (broken at ' + Math.round((bo.hpMax0 || 0) * 0.3) + ')' : '') : '?',
      openShare: probes ? +(opens / probes).toFixed(3) : 0, moves, distinct: Object.keys(moves).filter(k => !idle.test(k)).length, tells, botError: ctx.err || null };
  }, { boss: o.boss, room: ROOMS[o.boss], entry: ENTRY[o.boss] || null, seed: o.seed || 1, bot: o.bot, secs: o.secs || 150, flags: o.flags || null, react: o.react });
  r.pageErrors = errs.slice(0, 3);
  await page.close(); if (!o.browser) await browser.close();
  return r;
}
module.exports = { fight, ROOMS };
if (require.main === module) (async () => {
  // smoke: a bot that only walks at it and swings
  const bot = `(bo, P) => { const dx = bo.cx() - (P.x + P.w/2); keys[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = Math.abs(dx) > 70 ? 1 : 0; if (Math.abs(dx) < 110) keysP.KeyX = 1; }`;
  for (const b of (process.argv[2] || 'horn,tally,glitch,alpha,chime').split(',')) console.log(JSON.stringify(await fight({ boss: b, bot, secs: 60 })));
})();
