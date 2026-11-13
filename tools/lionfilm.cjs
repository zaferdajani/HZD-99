// NULLFANG'S FIGHT, FILMED AS IT IS FOUGHT.
//
// A staged capture forces a state and photographs it, which proves the state
// draws. It cannot show how the fight READS — the cuts between poses, a turn
// that happens in the air, a paw that slides while its picture is planted —
// because those only exist when the lion's own decisions string the states
// together. This films the real loop: update(1/60) with the lion choosing on
// seeded dice, the camera and light pass as shipped, against a scripted player
// who does the three things a player does to it: stands in its face, backs off
// to pounce range, and CROSSES BEHIND IT while it is winding up.
//
//   node tools/lionfilm.cjs <outdir> [--html <index.html to film instead>]
//                           [--seconds N] [--phase 2] [--attack] [--bodies-only] [--every N]
//
// Emits frames/NNNN.png (960x540, one per simulated 1/60 s), film.mp4 at 60 fps
// (normal speed), bodies/NNNN.png + bodies.png (the lion alone on a neutral
// card every 4th frame, the light pass removed so the ARTWORK can be judged)
// and receipt.json: state, clock, facing, position, velocity and the strip cell
// drawn, for every frame. The same seed is given to every build filmed, so a
// baseline and a candidate are handed the identical fight until they diverge.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const out = args[0] || 'release-evidence/lion-film';
const opt = (name, d) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : d; };
const html = opt('--html', null), seconds = +opt('--seconds', 26), phase = +opt('--phase', 1);
const every = +opt('--every', 4), noFrames = args.includes('--bodies-only'), attack = args.includes('--attack');   // --bodies-only: the fast pass, no screenshots and no film

(async () => {
  fs.mkdirSync(path.join(out, 'frames'), { recursive: true });
  fs.mkdirSync(path.join(out, 'bodies'), { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  try {
    const p = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const errors = []; p.on('pageerror', e => errors.push(e.message));
    const url = process.env.GAME_URL || 'http://127.0.0.1:8220/index.html';
    if (html) await p.route(url, r => r.fulfill({ status: 200, contentType: 'text/html', body: fs.readFileSync(html, 'utf8') }));
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => typeof startGame === 'function');
    // every strip the lion can ask for, resident before the first frame: a film
    // of the parts-rig fallback would be a film of a different animal
    // this machine has no graphics card; the shader effects layer is what is being filmed (js/fxgl.js fxglInit)
    await p.evaluate(() => { window.FXGL_FORCE = 1; if (typeof FXGL !== 'undefined') FXGL.ok = null; window.requestAnimationFrame = () => 0; for (const k of [...BEAST_STRIPS, 'beastStudioIdle']) { try { mediaFetch(k, true); } catch (e) {} } beastImg(); });
    await p.waitForFunction(() => BEAST_STRIPS.every(k => MEDIA_RAW[k] && MEDIA_RAW[k].complete && MEDIA_RAW[k].naturalWidth) && beastImg() && beastImg().naturalWidth, null, { timeout: 60000 });
    await p.evaluate((phase) => {
      let s = 0x51f0c0de; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; sv.flags.nfMeet = 1;
      startGame(sv); loadRoom('A4');
      G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = G.bossEntry = null; G.zoneToast = null; G.toasts = [];
      const b = G.boss; window.__lion = b; G.enemies = G.enemies.filter(e => e === b);
      b.st = 'idle'; b.t = 0.5; b.meet = null; b.face = b.faceVis = -1;
      if (phase === 2) { b.phase = 2; b.hp = b.hpMax * 0.45; b.nullUsed = true; }
      b.roarCD = 99; b.ambushCD = 99;        // the script releases these in turn
      player.x = b.cx() - 110 - player.w / 2; player.y = b.y + b.h - player.h; player.vx = player.vy = 0; player.on = true;
      window.__script = { side: -1, dist: 110, crossed: {}, n: {} };
      for (let i = 0; i < 40; i++) updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1 / 60);
    }, phase);
    const N = Math.round(seconds * 60), frames = [];
    for (let f = 0; f < N; f++) {
      const rec = await p.evaluate(([f, every, ATTACK]) => {
        const b = __lion, S = __script, t = f / 60;
        // ── THE SCRIPTED PLAYER ──────────────────────────────────────────
        // 0-9 s   in its face (the swipe); crosses behind on the 2nd wind-up
        // 9-19 s  at pounce range; crosses under it late in the 2nd coil
        // 19 s+   the roar and the perch are released
        const prev = S.st; S.st = b.st;
        if (prev !== b.st) S.n[b.st] = (S.n[b.st] || 0) + 1;
        if (t < 9) S.dist = ATTACK ? 74 : 110; else S.dist = 330;       // inside her claw's reach when she is fighting back
        if (t > 19) { if (b.roarCD > 50) b.roarCD = 0.2; }
        if (t > 22) { if (b.ambushCD > 50) b.ambushCD = 0.2; }
        if (b.st === 'swipewarn' && S.n.swipewarn === 2 && !S.crossed.swipe && b.t < 0.30) { S.crossed.swipe = 1; S.side = -S.side; }
        if (b.st === 'crouch' && S.n.crouch === 2 && !S.crossed.coil && b.t < 0.55) { S.crossed.coil = 1; S.side = -S.side; S.dist = 200; }
        const want = b.cx() + S.side * S.dist, px = player.x + player.w / 2;
        for (const k of ['ArrowLeft', 'ArrowRight']) keys[k] = 0;
        if (Math.abs(want - px) > 14) keys[want > px ? 'ArrowRight' : 'ArrowLeft'] = 1;
        // ...and she FIGHTS BACK in its openings (--attack): a claw when it is
        // standing or settling inside her reach, so the film shows a landed
        // blow — the step back, the double flash, the scrap — and not only a
        // lion performing at a spectator.
        if (ATTACK && Math.abs(player.x + player.w / 2 - b.cx()) < 96 && /^(idle|recover|daze)$/.test(b.st) && f % 16 === 0) {
          player.face = Math.sign(b.cx() - (player.x + player.w / 2)) || player.face;
          keysP.KeyX = 1; keys.KeyX = 1;
        } else keys.KeyX = 0;
        // keep her inside the arena rather than pinned on a wall
        const W = G.roomDef.w * TILE;
        if (want < 70 || want > W - 70) S.side = -S.side;
        player.iT = 9; player.cores = 5; if (b.hp < b.hpMax * (b.phase === 2 ? 0.2 : 0.6)) b.hp = b.hpMax * (b.phase === 2 ? 0.2 : 0.6);
        update(1 / 60);
        for (const k in keysP) keysP[k] = 0;
        cam.shake = 0;
        draw(f * 1000 / 60);
        let body = null;
        if (f % every === 0) {
          const c2 = document.createElement('canvas'); c2.width = 300; c2.height = 220;
          const x = c2.getContext('2d');
          x.fillStyle = '#6f7480'; x.fillRect(0, 0, 300, 220); x.fillStyle = '#4b4f58'; x.fillRect(0, 190, 300, 30);
          x.setTransform(1, 0, 0, 1, 150 - b.x - b.w / 2, 190 - b.y - b.h);
          const probe = G.artProbe; G.artProbe = 1;
          try { drawBeast(x, b); } catch (err) {}
          G.artProbe = probe;
          x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#fff'; x.font = '10px monospace';
          x.fillText(f + ' ' + b.st, 4, 12);
          body = c2.toDataURL('image/png');
        }
        const sp = b._stripPose || {};
        return { f, st: b.st, t: +(b.t || 0).toFixed(3), face: b.face, faceVis: +(b.faceVis || 0).toFixed(3),
          x: +b.x.toFixed(1), y: +b.y.toFixed(1), vx: +(b.vx || 0).toFixed(1), vy: +(b.vy || 0).toFixed(1),
          strip: sp.key || null, cell: sp.cell == null ? null : sp.cell, px: +(player.x + player.w / 2 - b.cx()).toFixed(1),
          hurt: player.hurtT > 0 ? 1 : 0, hp: Math.round(b.hp), body };
      }, [f, every, attack]);
      if (rec.body) fs.writeFileSync(path.join(out, 'bodies', String(f).padStart(4, '0') + '.png'), Buffer.from(rec.body.split(',')[1], 'base64'));
      delete rec.body; frames.push(rec);
      if (!noFrames) await p.screenshot({ path: path.join(out, 'frames', String(f).padStart(4, '0') + '.png') });
    }
    const build = await p.evaluate(() => BUILD_ID);
    fs.writeFileSync(path.join(out, 'receipt.json'), JSON.stringify({ build, seconds, fps: 60, phase, errors, frames,
      scope: 'The real A4 loop at 60 simulated fps, NULLFANG choosing its own moves on seeded dice, scripted invulnerable player. Not a campaign clear.' }, null, 1));
    if (!noFrames) execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '60', '-i', path.join(out, 'frames', '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', path.join(out, 'film.mp4')]);
    const nb = Math.ceil(N / every);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '15', '-pattern_type', 'glob', '-i', path.join(out, 'bodies', '*.png'), '-vf', 'tile=10x' + Math.ceil(nb / 10), '-frames:v', '1', path.join(out, 'bodies.png')]);
    console.log('filmed ' + N + ' frames of build ' + build + ' -> ' + out + (errors.length ? '   PAGE ERRORS: ' + errors.slice(0, 2).join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
