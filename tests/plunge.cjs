// THE WAY DOWN (owner, 2026-11-15: "before going to the sage... it is asking
// me to bring the sword, but the sword should be below the meadow. But I cannot
// access it because it's not easy to find, or it's not actually accessing
// beneath... you need to improve the down hitting mechanism. It's not easy,
// and the hit is actually super fast that sometimes it does not allow me to hit
// the floor. It finishes before actually reaching the floor." Then, of the
// picture: "going down should be with a claw, not just a fist... with an after
// effect of the same blue... radiating blue going upward... just like a meteor
// coming down, but blue with a claw. Also create the same motion... for swords",
// and "the 3 lines you created is working with a slash, not with going down.
// The going down should be different. Create its own VFX.")
//
// All of it was real. A down-strike was live for 0.15 s and reaches 60 px under
// her feet; a jump is 184 px high; so one thrown in the first two thirds of a
// jump was over before she came down and the hatch never felt it. Nothing in
// the room said where the hatch was. And the dive drew the claw rake's three
// crescents under her, which is a slash's mark.
//
// This plays it:
//   A  a down-strike thrown at ANY point of a jump over the hatch breaks it;
//   B  standing on the hatch, DOWN + ATTACK alone is enough (she hops);
//   C  ...and only there: on ordinary floor the same press does not hop her;
//   D  bouncing off a machine still ends the strike (the pogo is unchanged);
//   E  before NULLFANG has sent her, the hatch is floor: no strike opens it;
//   F  the room points at the hatch while it is the errand, and only then;
//   G  through the hatch is A5, its buried mouth breaks, and behind it is CV1;
//   H  the dive is drawn as the dive — the claws' strip or the carried blade's,
//      the blue meteor while she falls, the blue back up where she lands, and
//      never the slash's rake.
//
//   node tests/plunge.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    console.log('── plunge — a down-strike that reaches the floor, a hatch she can find and open, and a dive drawn as a dive');
    const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      for (const k of ['swingDown', 'swingDownSingle', 'swingDownDual', 'swingDownJoined', 'swingAir', 'swingClawJab']) mediaFetch(k, 1);
      const t0 = Date.now();
      while (Date.now() - t0 < 8000 && !['swingDown', 'swingDownSingle', 'swingDownDual', 'swingDownJoined'].every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth)) await new Promise(r => setTimeout(r, 100));
      // one stage for every part: the meadow, the opening behind her
      window.__stage = (o) => { o = o || {};
        const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; if (!o.sealed) sv.flags.nfMeet = 1;
        Object.assign(sv.flags, o.flags || {}); if (o.mode) sv.weaponMode = o.mode;
        startGame(sv); loadRoom('A2');
        G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = null; G.enemies = []; G.toasts = [];
        for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0;
        const hatch = !o.plain;
        // "plain" is open meadow: nothing brittle and nothing sharp within four
        // tiles (the twin blades' box is wide enough to bounce off a spike two
        // tiles away, which is the game working and not what is measured here)
        if (window.__plainX == null) { const gr = G.grid;
          for (let tx = PG_HUB.tx1 + 6; tx < gr[0].length - 6 && window.__plainX == null; tx++) { let ok = true;
            for (let x = tx - 4; x <= tx + 4 && ok; x++) for (let y = 0; y < gr.length; y++) { const q = gr[y][x]; if (q === 'B' || q === '^' || q === 'v') { ok = false; break; } }
            const gc = groundColumnAt(tx * TILE + 16); if (ok && gc && gc.length === 2 && Math.abs(groundColumnAt(tx * TILE - 40)[0] - gc[0]) < 6 && Math.abs(groundColumnAt(tx * TILE + 70)[0] - gc[0]) < 6) window.__plainX = tx * TILE; } }
        player.x = hatch ? (PG_HUB.tx0 + 1.5) * TILE - player.w / 2 : window.__plainX;
        const g = groundColumnAt(player.x + player.w / 2); player.y = (hatch ? PG_HUB.ty * TILE : g[0]) - player.h - 1; player.vx = player.vy = 0;
        for (let i = 0; i < 40; i++) { player.iT = 9; update(1 / 60); G.hitStop = 0; }
      };
      // one frame of real input
      window.__step = (o) => { o = o || {};
        if (o.jump) { keysP.Space = 1; keys.Space = 1; } if (o.atk) { keysP.KeyX = 1; keys.KeyX = 1; }
        if (o.down != null) keys.ArrowDown = o.down ? 1 : 0;
        player.iT = 9; update(1 / 60); G.hitStop = 0; keysP.Space = 0; keysP.KeyX = 0; if (o.release) { keys.Space = 0; keys.KeyX = 0; } };
    });

    // ---- A: any timing ----
    const A = await page.evaluate(() => {
      const out = [];
      for (let at = 2; at <= 41; at += 3) {
        __stage();
        let broke = -1, below = -1;
        __step({ jump: 1 });
        for (let i = 1; i < 130 && broke < 0; i++) {
          __step({ atk: i === at, down: i >= at && i < at + 16, release: i > 12 });
          if (pgHubBroken()) broke = i;
        }
        // ...and ONE strike is the whole way: she is in the room below without touching anything again
        for (let i = 0; i < 360 && broke > 0 && below < 0; i++) { __step({ down: 0, release: 1 }); if (G.roomId === 'A5' && !G.trans) below = i; }
        out.push({ at, broke, below });
      }
      return out;
    });
    check('A  a down-strike thrown at any point of a jump over the hatch breaks it', A.every(r => r.broke > 0), A.map(r => r.at + ':' + (r.broke > 0 ? 'f' + r.broke : 'NO')).join(' '));
    check('A  ...and that one strike is the whole way down: she lands in the room below', A.every(r => r.below >= 0), A.map(r => r.at + ':' + (r.below >= 0 ? '+' + r.below : 'STUCK')).join(' '));

    // ---- B: the one-press hop ----
    const B = await page.evaluate(() => {
      __stage(); let broke = -1;
      for (let i = 0; i < 120 && broke < 0; i++) { __step({ atk: i === 2, down: i < 30, release: i > 6 }); if (pgHubBroken()) broke = i; }
      let below = -1; for (let i = 0; i < 360 && broke > 0 && below < 0; i++) { __step({ down: 0, release: 1 }); if (G.roomId === 'A5' && !G.trans) below = i; }
      return { broke, below };
    });
    check('B  standing on the hatch, DOWN + ATTACK alone opens it', B.broke > 0 && B.below >= 0, 'it breaks on frame ' + B.broke + (B.below >= 0 ? ' and she is below ' + B.below + ' frames later' : ' and she is STUCK above'));

    // ---- C: nowhere else ----
    const C = await page.evaluate(() => {
      __stage({ plain: 1 }); let air = 0, down = 0; const y0 = player.y;
      for (let i = 0; i < 50; i++) { __step({ atk: i === 2, down: i < 30, release: i > 6 }); if (!player.on) air++; if (player.swingVis && player.swingVis.ay > 0.5) down++; }
      return { air, down, dy: Math.round(Math.abs(player.y - y0)) };
    });
    check('C  ...and only there: on ordinary floor the same press is the swing it always was', C.air === 0 && C.down === 0, 'frames off the ground ' + C.air + ', frames drawn as a dive ' + C.down);

    // ---- D: the pogo ----
    const D = await page.evaluate(() => {
      __stage({ plain: 1 });
      const g = groundColumnAt(player.x + player.w / 2)[0];
      const e = new Enemy('blob', player.x, g - 30); e.y = g - e.h; e.hp = e.maxHp = 999; G.enemies = [e];
      for (let i = 0; i < 20; i++) { e.vx = 0; e.x = player.x + player.w / 2 - e.w / 2; e.y = g - e.h; }
      player.y = e.y - player.h - 70; player.vy = 120; player.on = false;
      const lands0 = G.plungeLands | 0; let bounced = -1, over = -1, held = 0, minVy = 0;
      for (let i = 0; i < 70; i++) {
        e.vx = 0; e.x = player.x + player.w / 2 - e.w / 2; e.y = g - e.h; e.iT = 0;
        __step({ atk: i === 1, down: i < 20, release: i > 4 });
        minVy = Math.min(minVy, player.vy);
        if (bounced < 0 && player.vy < -120) bounced = i;
        if (bounced >= 0 && over < 0 && (!player.swing || player.swing.t <= 0)) over = i;
        if (bounced >= 0 && player.swing && player.swing.heldT) held = Math.max(held, player.swing.heldT);
      }
      return { bounced, over, minVy: Math.round(minVy), lands: (G.plungeLands | 0) - lands0, hp: e.hp };
    });
    check('D  a strike that bounces her off a machine still ends there (the pogo is unchanged)', D.bounced > 0 && D.over > 0 && D.over - D.bounced <= 12 && D.hp < 999, 'bounced on frame ' + D.bounced + ' (vy ' + D.minVy + '), strike over ' + (D.over - D.bounced) + ' frames later; machine hp ' + D.hp);

    // ---- E: sealed ----
    const E = await page.evaluate(() => {
      const out = { sealed: 0, jump: [], hop: 0 };
      for (const at of [6, 18, 30]) {
        __stage({ sealed: 1 }); out.sealed += pgHubSealed(G.save.flags) ? 1 : 0;
        __step({ jump: 1 });
        for (let i = 1; i < 110; i++) __step({ atk: i === at, down: i >= at && i < at + 16, release: i > 12 });
        out.jump.push(pgHubBroken() ? 1 : 0);
      }
      __stage({ sealed: 1 }); let air = 0;
      for (let i = 0; i < 60; i++) { __step({ atk: i === 2, down: i < 30, release: i > 6 }); if (!player.on) air++; }
      out.hop = air; out.broke = pgHubBroken() ? 1 : 0; out.room = G.roomId;
      return out;
    });
    check('E  before NULLFANG has sent her, the hatch is floor: no strike opens it and she does not hop on it', E.sealed === 3 && E.jump.every(v => !v) && !E.broke && E.hop === 0 && E.room === 'A2', 'sealed ' + E.sealed + '/3; broke ' + E.jump.join(',') + '; hop frames ' + E.hop);

    // ---- F: the pointer ----
    const F = await page.evaluate(() => {
      const count = (o, far) => { __stage(o); if (far != null) { player.x = far; const g = groundColumnAt(player.x + player.w / 2); if (g) player.y = g[0] - player.h; for (let i = 0; i < 90; i++) __step({}); }
        G.hatchPointer = 0; for (let i = 0; i < 3; i++) draw(performance.now()); return G.hatchPointer | 0; };
      const far = (PG_HUB.tx1 + 40) * TILE;
      const out = { near: count({ plain: 1 }), far: count({ plain: 1 }, far), sealed: count({ sealed: 1, plain: 1 }, far), have: count({ plain: 1, flags: { crystal: 1 } }, far) };
      // and once it is cut
      __stage(); __step({ jump: 1 }); for (let i = 1; i < 60 && !pgHubBroken(); i++) __step({ atk: i === 8, down: i >= 8 && i < 24, release: i > 12 });
      const broke = pgHubBroken(); G.hatchPointer = 0; if (G.roomId === 'A2') for (let i = 0; i < 3; i++) draw(performance.now());
      out.cut = broke ? (G.hatchPointer | 0) : -1;
      return out;
    });
    check('F  the room points at the hatch while the marble is the errand — in view and out of it', F.near === 3 && F.far === 3, 'drawn ' + F.near + '/3 near it, ' + F.far + '/3 forty tiles away');
    check('F  ...and not before she is sent, not once it is cut, not once she has the blade', F.sealed === 0 && F.cut === 0 && F.have === 0, 'sealed ' + F.sealed + ', cut ' + F.cut + ', holding the blade ' + F.have);

    // ---- G: the route ----
    const G1 = await page.evaluate(() => {
      __stage(); __step({ jump: 1 });
      for (let i = 1; i < 60 && !pgHubBroken(); i++) __step({ atk: i === 8, down: i >= 8 && i < 24, release: i > 12 });
      let fell = -1;
      for (let i = 0; i < 420 && fell < 0; i++) { __step({ down: 0, release: 1 }); if (G.trans) { /* a room crossing in progress */ } if (G.roomId === 'A5' && !G.trans) fell = i; }
      const out = { fell, room: G.roomId };
      if (G.roomId !== 'A5') return out;
      for (let i = 0; i < 60; i++) __step({});
      const r = (G.rubbles || [])[0];
      out.rubble = r ? { flag: r.flag, hp: r.hp } : null;
      if (!r) return out;
      // walk to the pile and cut it open with real swings
      const b = rubbleBox(r);
      player.x = b.x - player.w - 6; const g = groundColumnAt(player.x + player.w / 2); if (g) player.y = g[0] - player.h; player.vx = player.vy = 0;
      let swings = 0;
      for (let k = 0; k < 40 && !G.save.flags[r.flag]; k++) { swings++;
        for (let i = 0; i < 26; i++) { keys.ArrowRight = i < 3 ? 1 : 0; __step({ atk: i === 4, release: i > 7 }); if (player.x + player.w > b.x - 2) player.x = b.x - player.w - 2; } }
      keys.ArrowRight = 0;
      out.swings = swings; out.open = !!G.save.flags[r.flag];
      // then walk in
      let inCave = -1;
      for (let i = 0; i < 600 && inCave < 0; i++) {
        keys.ArrowRight = (player.x + player.w / 2 < r.x - 4) ? 1 : 0; keys.ArrowLeft = (player.x + player.w / 2 > r.x + 4) ? 1 : 0;
        keys.ArrowUp = 1; if (i % 20 === 5) keysP.ArrowUp = 1;
        __step({}); keysP.ArrowUp = 0;
        if (G.roomId === 'CV1') inCave = i;
      }
      keys.ArrowUp = keys.ArrowRight = keys.ArrowLeft = 0;
      out.inCave = inCave; out.end = G.roomId;
      return out;
    });
    check('G  through the hatch is the room under the meadow', G1.room === 'A5' || G1.end === 'CV1', 'she is in ' + G1.room + ' ' + G1.fell + ' frames after the floor gave');
    check('G  ...its buried mouth breaks under her claws', !!(G1.rubble && G1.open), G1.rubble ? G1.swings + ' swings at a pile of ' + G1.rubble.hp : 'no pile in the room');
    check('G  ...and behind it is the cave that leads to the marble', G1.end === 'CV1', 'she ends in ' + G1.end);

    // ---- H: the picture ----
    const H = await page.evaluate(() => {
      const KEY = { claws: 'swingDown', single: 'swingDownSingle', dual: 'swingDownDual', joined: 'swingDownJoined' };
      const FL = { claws: {}, single: { crystal: 1 }, dual: { crystal: 1, crystal2: 1 }, joined: { crystal: 1, crystal2: 1, connector: 1 } };
      const out = [];
      for (const mode of ['claws', 'single', 'dual', 'joined']) {
        __stage({ plain: 1, mode, flags: FL[mode] });
        const r = { mode, got: weaponMode(G.save), strips: {}, air: [], land: [], kMax: 0, kRise: 1, front: 0, back: 0, impact: 0, rake0: G.rakeFallback | 0, passes: 0, lands0: G.plungeLands | 0 };
        __step({ jump: 1 });
        for (let i = 1; i < 100; i++) {
          __step({ atk: i === 14, down: i >= 14 && i < 30, release: i > 12 });
          G.plungeMeteor = null; G.plungeImpact = null; G.slashPasses = null; G.lastStrip = null;
          draw(performance.now());
          const sv = player.swingVis;
          if (!sv || !(sv.ay > 0.5)) continue;
          const [key, cell] = String(G.lastStrip || ':').split(':');
          r.strips[key] = (r.strips[key] | 0) + 1;
          (player.on ? r.land : r.air).push(+cell);
          if (G.plungeMeteor) { if (player.vy > 300) r.kMax = Math.max(r.kMax, G.plungeMeteor.k); if (player.vy < -60) r.kRise = Math.min(r.kRise, G.plungeMeteor.k); r.front++; }
          if (G.plungeImpact) r.impact++;
          if (G.slashPasses && G.slashPasses.length) r.passes++;
        }
        r.rake = (G.rakeFallback | 0) - r.rake0; r.lands = (G.plungeLands | 0) - r.lands0; r.want = KEY[mode];
        out.push(r);
      }
      // a sideways slash wears none of it
      __stage({ plain: 1 }); let met = 0;
      for (let i = 0; i < 30; i++) { __step({ atk: i === 2, release: i > 5 }); G.plungeMeteor = null; draw(performance.now()); if (G.plungeMeteor) met++; }
      // and under the art probe the dive is her body alone
      __stage({ plain: 1 }); let probe = 0; __step({ jump: 1 });
      for (let i = 1; i < 70; i++) { __step({ atk: i === 14, down: i >= 14 && i < 30, release: i > 12 }); G.artProbe = 1; G.plungeMeteor = null; G.plungeImpact = null; draw(performance.now()); if (G.plungeMeteor || G.plungeImpact) probe++; G.artProbe = 0; }
      return { modes: out, slashMeteor: met, probe };
    });
    for (const r of H.modes) {
      const only = Object.keys(r.strips);
      check('H  ' + r.mode + ': the dive is drawn from its own strip, flying then landed', r.got === r.mode && only.length === 1 && only[0] === r.want && r.air.length > 6 && r.air.every(c => c <= 3) && r.land.length > 6 && r.land.every(c => c >= 4),
        only.join(',') + ' — air cells ' + [...new Set(r.air)].join('') + ', landed cells ' + [...new Set(r.land)].join(''));
      check('H  ' + r.mode + ': she falls in blue — faint as she rises, full as she comes down — and it comes back up where she lands', r.kMax >= 0.95 && r.kRise <= 0.35 && r.impact >= 6 && r.lands === 1,
        'meteor ' + r.kRise.toFixed(2) + ' rising, ' + r.kMax.toFixed(2) + ' falling; landing light on ' + r.impact + ' frames; landings ' + r.lands);
      check('H  ' + r.mode + ": ...and never the slash's rake or scratch", r.rake === 0 && r.passes === 0, 'rake frames ' + r.rake + ', slash-layer frames ' + r.passes);
    }
    check('H  a sideways slash wears no meteor', H.slashMeteor === 0, H.slashMeteor + ' frames');
    check('H  under the art probe the dive is her body alone', H.probe === 0, H.probe + ' frames');
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
    await ctx.close();
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nplunge: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
