// THE DAMAGE LOG, AS A CHECK (js/dmglog.js, handoff Part 2 A6).
//
// "Any single attack above about 40% of damage taken has a telegraph
// problem" was a comment. This measures the check: cores lost are recorded
// by source per room (blocked and parried blows cost nothing and record
// nothing), a source over 40% is flagged once there is enough damage to mean
// it, the record starts again in a new room, and the Forge's DAMAGE overlay
// draws it — only in the Forge, only when on.
//
//   node tests/dmglog.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── dmglog — what costs her cores, by source, per room, with the 40% flag\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof dmgReport === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const frames = async n => { for (let i = 0; i < n; i++) await new Promise(k => requestAnimationFrame(k)); };
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.coresMax = 20;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null; G.meet = null;
    await frames(20);
    const p = player, out = {};
    const hit = (src, n) => { for (let i = 0; i < n; i++) { p.iT = 0; p.guardT = 0; p.cores = 20; p.hurt(1, p.x - 40, src); } };
    hit('crawler.lunge', 2); hit('horn.toss', 4); hit('turret.shot', 1);
    // a held brace from the front: costs nothing, so records nothing
    p.iT = 0; p.cores = 20; p.guardT = 1; p.guardHeat = 0; p.on = true; p.face = -1; p.faceVis = -1;
    p.hurt(1, p.x - 40, 'blocked.blow'); p.guardT = 0;
    out.rep = dmgReport().map(x => ({ src: x.src, lost: x.lost, share: +x.share.toFixed(2), flag: x.flag }));
    out.total = G.dmgFight.total;
    // too little damage to mean anything: no flag even at 100%
    loadRoom('A2'); G.enemies = []; await frames(5);
    out.fresh = dmgReport().length;
    hit('bat.glint', 2);
    out.small = dmgReport().map(x => ({ src: x.src, share: +x.share.toFixed(2), flag: x.flag }));
    // the overlay: drawn when on, not when off
    const count = (on) => {
      G.showDmg = on;
      const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const c = cv.getContext('2d');
      drawDmgOverlay(c);
      const d = c.getImageData(700, 60, 260, 120).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
      return n;
    };
    out.drawOn = count(true); out.drawOff = count(false);
    return out;
  });

  const top = r.rep[0] || {};
  check('cores lost are recorded by source, most damaging first', top.src === 'horn.toss' && top.lost === 4 && r.total === 7, JSON.stringify(r.rep));
  check('the source over 40% of the damage is flagged, the others are not',
    top.flag === true && r.rep.slice(1).every(x => !x.flag), JSON.stringify(r.rep));
  check('a held brace costs nothing and records nothing', !r.rep.some(x => x.src === 'blocked.blow'), JSON.stringify(r.rep));
  check('a new room starts a new record', r.fresh === 0, String(r.fresh));
  check('...and with too little damage to mean anything, nothing is flagged', r.small.length === 1 && !r.small[0].flag, JSON.stringify(r.small));
  check('the overlay draws when on, and nothing when off', r.drawOn > 1000 && r.drawOff === 0, 'on ' + r.drawOn + ', off ' + r.drawOff);
  const forge = fs.readFileSync(path.join(__dirname, '..', 'forge.html'), 'utf8');
  const game = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  check('the Forge has the DAMAGE toggle (button and F4); the game pages do not', /forgeDmg/.test(forge) && /'F4'/.test(forge) && !/forgeDmg/.test(game));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
