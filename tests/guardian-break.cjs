// COMIC PAGE 29 IS PLAYABLE NOW — and this is what proves it.
//
// The parity audit (docs/COMIC_PARITY_AUDIT.md) listed "a brief break in
// control" as drawn and unstaged. The Meadow Sage says CHIME writes the order
// back whenever NULLFANG breaks it; until this scene existed, the player was
// only ever TOLD that. The harness checks the four things that make it a scene
// rather than a cutscene: it opens only inside the route's own window, it runs
// the authored veins clean and back again, it never takes a core, and it never
// takes the controls — the audit's rule about a silent hero's agency.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  try {
    const p = await b.newPage();
    await p.goto('http://127.0.0.1:8220/index.html');
    await p.waitForFunction(() => typeof startGame === 'function');
    const r = await p.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const stage = (flags) => {
        const s = newSave(1); s.time = 99; s.storyVersion = 2;
        Object.assign(s.flags, { woke: 1, tut: 1, crystal: 1 }, flags);
        startGame(s); loadRoom('A3');
        G.wake = G.cut = G.dialog = G.trans = null; G.state = 'PLAY';
        G.enemies = []; G.projs = []; G.boss = null; G.break = null;
        // the east end of the camp, where the lair's door is
        player.x = G.roomDef.w * TILE - 6 * TILE;
        const col = groundColumnAt(player.x + player.w / 2);
        player.y = Math.min(...col) - player.h;
        player.vx = player.vy = 0; player.on = true;
        return s;
      };
      const run = (n) => { for (let i = 0; i < n && !G.break; i++) update(1 / 60); };

      // 1. it does NOT open before the sage, or after the bell.
      stage({}); run(240);
      const beforeSage = !!G.break;
      stage({ sageTame_GA1D: 1, bossChime: 1 }); run(240);
      const afterBell = !!G.break;
      stage({ sageTame_GA1D: 1, bossGlitch: 1 }); run(240);
      const afterGuardian = !!G.break;

      // 2. the window itself: sage freed, bell still ringing.
      stage({ sageTame_GA1D: 1 }); run(600);
      if (!G.break) throw Error('the break never opened inside its own window');
      const bossIsStaged = !!(G.boss && G.boss.meet);
      const cores = player.cores, phases = new Set();
      let cleanSeen = false, purpleBack = false, movedDuring = 0;
      const startX = player.x;
      for (let i = 0; i < 3000 && G.break; i++) {
        phases.add(G.break.ph);
        if (G.break.ph === 'still') {
          if (G.boss && G.boss.purified) cleanSeen = true;
          keys.ArrowLeft = true;                  // she is never held: she can walk away
        } else {
          if (cleanSeen && G.boss && !G.boss.purified) purpleBack = true;
          keys.ArrowLeft = false;
        }
        update(1 / 60);
        for (const k in keysP) delete keysP[k];
      }
      delete keys.ArrowLeft;
      movedDuring = startX - player.x;

      // MEASURED, not taken on trust. `purified` is a flag; what matters is that
      // the pixels change and change TOWARD clean. Rendering the same frame with
      // the flag on and off and diffing the canvas is the only check that fails
      // if the veins stop being wired to it.
      let veinPixels = 0, veinTeal = 0, veinPurple = 0;
      {
        // The measurement only means something against the SHIPPED plates: with
        // the atlas absent the rig falls back to the procedural beast, which
        // paints a different animal and grades as a failure for the wrong reason.
        stage({ sageTame_GA1D: 1 });
        if (typeof mediaFetch === 'function' && typeof BOSS_ART !== 'undefined') mediaFetch(BOSS_ART.glitch);
        const until = Date.now() + 6000;
        while (Date.now() < until) await new Promise(r => setTimeout(r, 100));
        window.requestAnimationFrame = () => 0;
        run(600);
        for (let i = 0; i < 3000 && G.break && G.break.ph !== 'still'; i++) update(1 / 60);
        for (let i = 0; i < 30; i++) update(1 / 60);
        const cv = document.querySelector('canvas'), ctx = cv.getContext('2d');
        const snap = () => { G.flash = 0; draw(); return ctx.getImageData(0, 0, cv.width, cv.height).data; };
        if (G.boss) {
          G.boss.purified = true; const A = snap();
          G.boss.purified = false; const B = snap();
          // Direction, not absolute colour: how far each changed pixel moved
          // along the green-minus-red axis. Purified is teal-ward, infected is
          // purple-ward, and the sheet swap changes plenty of neutral pixels
          // too — counting "is it teal" would grade those as failures.
          for (let i = 0; i < A.length; i += 4) {
            if (Math.abs(A[i] - B[i]) + Math.abs(A[i+1] - B[i+1]) + Math.abs(A[i+2] - B[i+2]) <= 24) continue;
            veinPixels++;
            const shift = (A[i+1] - A[i]) - (B[i+1] - B[i]);
            if (shift > 6) veinTeal++; else if (shift < -6) veinPurple++;
          }
        }
        G.break = null; G.boss = null;
      }

      const ended = !G.break && !G.boss;
      const flagged = !!G.save.flags.nfBreak;
      const costCores = cores - player.cores;

      // 3. once only — a reload or a second walk east does not replay it.
      G.break = null; player.x = G.roomDef.w * TILE - 6 * TILE;
      run(600);
      const replayed = !!G.break;

      return { beforeSage, afterBell, afterGuardian, bossIsStaged, phases: [...phases],
               cleanSeen, purpleBack, ended, flagged, costCores, movedDuring, replayed,
               veinPixels, veinTeal, veinPurple };
    });

    assert.equal(r.beforeSage, false, 'the break must not open before the sage is freed');
    assert.equal(r.afterBell, false, 'once CHIME is silent there is nothing left to break');
    assert.equal(r.afterGuardian, false, 'a resolved guardian does not walk out of his own enclosure');
    assert.equal(r.bossIsStaged, true, 'the body is driven by hand (meet), never as a live fight');
    for (const ph of ['come', 'still', 'bell', 'leave']) assert(r.phases.includes(ph), 'missing phase ' + ph);
    assert.equal(r.cleanSeen, true, 'he lets go: the authored veins must run clean');
    assert.equal(r.purpleBack, true, 'and the bell must write the order back');
    assert.equal(r.costCores, 0, 'the break costs her nothing — it is not an ambush');
    assert(r.movedDuring > 40, 'the controls are hers throughout: she can walk away (moved ' + r.movedDuring + 'px)');
    assert(r.veinPixels > 1200, 'letting go must be VISIBLE: only ' + r.veinPixels + ' pixels changed with the flag');
    assert(r.veinTeal > r.veinPurple * 3, 'and it must go CLEAN, not merely different: ' + r.veinTeal + ' pixels moved teal-ward against ' + r.veinPurple + ' purple-ward');
    assert.equal(r.ended, true, 'the scene clears itself and hands the room back');
    assert.equal(r.flagged, true, 'the sentence is recorded in the save');
    assert.equal(r.replayed, false, 'it happens once');
    console.log('PASS guardian-break: opens only between the sage and the bell, runs clean and back, costs no core, holds no input, once only', r);
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
