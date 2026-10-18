// Run only after the full audit: CHROMIUM_PATH=/path/to/browser node <this-file>
// Replicates combat-impact-input's staged arena and real keyboard timing.
// Diagnostics do not change runtime source, clocks, inputs, assertion thresholds,
// or the original test. Frame/key listeners only read state into a separate log.
const fs = require('node:fs');
const path = require('node:path');
const { performance: nodeClock } = require('node:perf_hooks');
const { chromium } = require('playwright');
const { createServer } = require('http-server');
const repo = path.resolve(__dirname, '../../../..');
const out = process.env.CHARGE_DIAGNOSTIC_OUT || path.join(__dirname, 'charge-diagnostic-result.json');

(async () => {
  const result = {
    scope: 'STAGED arena; actual keyboard and normal game loop; not a campaign or physical device',
    startedUTC: new Date().toISOString(),
    originalTest: 'tests/combat-impact-input.cjs',
    timingsMs: { bootSettle: 1000, afterTap: 350, heldAttack: 950, afterRelease: 350, expiry: 900 },
    limitation: 'Read-only observer callbacks/evaluations add small instrumentation overhead; no original assertion is changed. A separate unmodified test rerun is required.',
    commands: [], errors: [],
  };
  let server, browser, page;
  const mark = label => result.commands.push({ label, nodeWallMs: nodeClock.now(), utc: new Date().toISOString() });
  try {
    server = createServer({ root: repo, cache: -1, showDir: false });
    await new Promise((resolve, reject) => {
      server.server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const url = 'http://127.0.0.1:' + server.server.address().port + '/index.html';
    result.localURL = url;
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
    page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', error => result.errors.push(String(error)));
    await page.goto(url);
    await page.waitForFunction(() => typeof startGame === 'function');
    await page.evaluate(() => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = sv.flags.heal = 1;
      startGame(sv); loadRoom('A1');
      G.dialog = G.wake = G.cut = G.meet = G.bossEntry = null;
      G.state = 'PLAY'; G.enemies = []; G.boss = null; G.statics = []; G.tut = null;
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.__sounds = []; const orig = sfx;
      window.sfx = function(id, ...args) { __sounds.push(id); return orig(id, ...args); };
      window.__home = { x: player.x, y: player.y };
      window.__stage = () => {
        G.state = 'PLAY'; G.dialog = G.wake = G.cut = G.meet = G.bossEntry = null;
        G.hitStop = 0; G.boomer = null; COMBAT_LOG = []; parts.length = 0;
        Object.assign(player, { ...__home, vx: 0, vy: 0, on: true, face: 1, faceVis: 1,
          swing: null, swingVis: null, atkCD: 0, atkBuf: 0, combo: 0, comboT: 0,
          chargeT: 0, swirlT: 0, volts: 99, iT: 999, grap: null, dashT: 0,
          healT: 0, guardT: 0, stunT: 0 });
        const e = new Enemy('crawler', player.x + player.w + 4, player.y + player.h - 24);
        e.y = player.y + player.h - e.h; e.hp = e.hpMax = 1000; e.update = () => {};
        G.enemies = [e]; window.__target = e;
      };
      __stage();
      const D = window.__chargeDiagnostic = { frames: 0, samples: [], keyEvents: [], active: true };
      D.read = label => ({ label, wallMs: performance.now(), frames: D.frames,
        simClock: G.simClock ?? null, gameTime: G.time ?? null, saveTime: G.save?.time ?? null,
        chargeT: player.chargeT, hitStop: G.hitStop, state: G.state,
        attackDown: inD('ATK'), rawKeyX: !!keys.KeyX, attackBinding: Array.from(KEYB.ATK || []),
        playerDead: !!player.dead, dashT: player.dashT, swirlT: player.swirlT,
        boomer: !!G.boomer, burstUnlocked: typeof burstUnlocked === 'function' ? burstUnlocked() : null,
        volts: player.volts, chargeOK: player.chargeOk, visibility: document.visibilityState });
      const observeFrame = () => {
        if (!D.active) return;
        D.frames++;
        if (D.samples.length < 600) D.samples.push(D.read('frame'));
        requestAnimationFrame(observeFrame);
      };
      requestAnimationFrame(observeFrame);
      for (const type of ['keydown', 'keyup']) window.addEventListener(type, event => {
        if (D.active && event.code === 'KeyX') D.keyEvents.push({ ...D.read(type), repeat: event.repeat });
      });
    });
    const sample = label => page.evaluate(label => __chargeDiagnostic.read(label), label);
    result.beforeTap = await sample('beforeTap'); mark('tap');
    await page.keyboard.press('KeyX'); await page.waitForTimeout(350);
    result.normal = await page.evaluate(() => ({ events: COMBAT_LOG.slice(), sounds: __sounds.slice(), enemyVx: __target.vx }));
    result.afterTap = await sample('afterTap350');
    await page.evaluate(() => { __stage(); __sounds = []; });
    result.beforeHold = await sample('beforeHold'); mark('keydown-before');
    await page.keyboard.down('KeyX'); mark('keydown-return');
    await page.waitForTimeout(950);
    result.heldAt950 = await sample('heldAt950'); mark('hold-sample-return');
    await page.keyboard.up('KeyX'); mark('keyup-return');
    await page.waitForTimeout(350);
    result.afterRelease350 = await sample('afterRelease350');
    result.special = await page.evaluate(() => ({ events: COMBAT_LOG.slice(), sounds: __sounds.slice(), enemyVx: __target.vx, build: BUILD_ID }));
    await page.waitForTimeout(900);
    result.expired = await page.evaluate(() => parts.filter(part => part.metal).length);
    result.observer = await page.evaluate(() => {
      __chargeDiagnostic.active = false;
      return { frames: __chargeDiagnostic.frames, samples: __chargeDiagnostic.samples, keyEvents: __chargeDiagnostic.keyEvents };
    });
    const delta = key => result.heldAt950[key] - result.beforeHold[key];
    result.holdDelta = { wallMs: delta('wallMs'), simSeconds: delta('simClock'),
      saveSeconds: delta('saveTime'), frames: delta('frames'), chargeSeconds: delta('chargeT') };
    result.originalConditions = {
      normalClaw12: result.normal.events.some(event => event.move === 'slash' && event.lost === 12),
      normalKnockback: result.normal.enemyVx > 0,
      chargeThreshold: result.heldAt950.chargeT >= 0.6,
      chargedDamage38: result.special.events.some(event => event.move === 'burst' && event.lost === 38),
      releaseAndContactAudio: result.special.sounds.includes('chargedHit') && result.special.sounds.includes('bosshit'),
      particlesExpired: result.expired === 0, noPageErrors: result.errors.length === 0,
    };
    result.diagnosticCompleted = true;
  } catch (error) {
    result.infrastructureError = String(error?.stack || error);
    process.exitCode = 1;
  } finally {
    result.finishedUTC = new Date().toISOString();
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ output: out, build: result.special?.build,
      holdDelta: result.holdDelta, originalConditions: result.originalConditions,
      infrastructureError: result.infrastructureError, errors: result.errors }, null, 2));
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.server.close(resolve));
  }
})();
