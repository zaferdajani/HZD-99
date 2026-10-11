// THE BRACE IS REAL, AND IT SURVIVED A MERGE.
//
// The guard arrived on the integration branch while this branch was replacing
// most of the hero's art, and the two lines of work collided in exactly the
// table the guard lives in (HERO_TRANS). Resolving that by hand is how a
// feature quietly disappears: keep the wrong side of one conflict hunk and the
// mechanic is still in the input map, still in the media manifest, still has
// its plate on disk — and never draws, because the one line that indexes it is
// gone. Nothing in the suite would have said so.
//
// So this measures the whole chain rather than the pose: the input raises the
// timer, the timer names the state, the state draws the guard plate, and a hit
// taken while braced shoves her far less than the same hit taken open.
//
//   node tests/guard.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── guard — she braces, bracing costs the hit its push, and a brace in the instant turns it\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null;
    mediaFetch('hzdGuard', 1);
    for (let i = 0; i < 90; i++) await new Promise(k => requestAnimationFrame(k));
    const out = { declared: (HERO_TRANS.guard && HERO_TRANS.guard.key) || null };

    for (let i = 0; i < 10; i++) { keys['KeyL'] = 1; await new Promise(k => requestAnimationFrame(k)); }
    out.guardT = player.guardT;
    out.state = player.heroState(false);
    draw(performance.now());
    out.drawn = G.heroDrawn || G.lastStrip || null;

    // the same hit, braced and open, with iT cleared so neither is ignored
    player.iT = 0; player.vx = 0;
    player.hurt(1, player.x - 40, player.y);
    out.kbGuarded = Math.abs(player.vx);

    delete keys['KeyL'];
    for (let i = 0; i < 8; i++) await new Promise(k => requestAnimationFrame(k));
    out.released = player.guardT;
    player.iT = 0; player.vx = 0;
    player.hurt(1, player.x - 40, player.y);
    out.kbOpen = Math.abs(player.vx);
    return out;
  });

  check('the guard is still wired into the transition table', r.declared === 'hzdGuard', String(r.declared));
  check('holding GUARD raises the timer', r.guardT > 0, 'guardT ' + r.guardT);
  check('...and the timer names the state', r.state === 'guard', r.state);
  check('...and the state draws the guard plate', r.drawn === 'hzdGuard:0', String(r.drawn));
  check('letting go drops it', r.released === 0, 'guardT ' + r.released);
  check('a braced hit shoves her far less than an open one',
    r.kbOpen > 0 && r.kbGuarded < r.kbOpen * 0.6,
    'guarded ' + Math.round(r.kbGuarded) + ' vs open ' + Math.round(r.kbOpen));

  // ---------------------------------------------------------------------------
  // THE PARRY (handoff Part 2 A4, js/parry.js). Driven through the real loop:
  // the machine lunges on its own AI, the brace is raised by the held key at
  // a measured distance from contact, and the counter is a real ATTACK press.
  const P = await page.evaluate(async () => {
    const frame = () => new Promise(k => requestAnimationFrame(k));
    const frames = async n => { for (let i = 0; i < n; i++) await frame(); };
    const reset = async () => {
      delete keys['KeyL']; delete keys['KeyX'];
      loadRoom('A1'); G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null; G.meet = null;
      player.cores = player.maxCores(); player.iT = 0; player.guardHeat = 0; player.guardBreakT = 0;
      player.counterT = 0; player.counterFoe = null; player.counterAct = null; player.parries = 0;
      player.vx = 0; player.face = 1; player.faceVis = 1;
      await frames(30);
    };
    // one lunge at her from the right. `brace`: 'perfect' raises it when the
    // gap closes to `gap` px, 'late' holds it from the start, 'mash' raises,
    // drops and re-raises 0.1 s before contact
    const lunge = async (kind, brace, gap = 14) => {
      await reset();
      const fy = player.y + player.h;
      const e = new Enemy(kind, player.x + player.w + 34, fy - EKIND[kind].h);
      e.dir = -1; e.iq = 0.2; e.iqT = 99; e.windedT = 0; e.coilT = 0.12; e.lungeT = 0; e.atkCD = 9;
      G.enemies = [e];
      const c0 = player.cores, hp0 = e.hp;
      let glint = false, raisedAt = null, contactAt = null, n = 0, lungeMash = false, finalAt = null;
      if (brace === 'late') keys['KeyL'] = 1;
      for (; n < 90; n++) {
        const hb = hurtBoxOf(e), d = hb.x - (player.x + player.w);
        if (e.parryable) glint = true;
        if (brace === 'perfect' && raisedAt == null && e.lungeT > 0 && d <= gap) { keys['KeyL'] = 1; raisedAt = n; finalAt = n; }
        // the masher: up early (too early to count), dropped as the blow
        // closes and snapped back up at the perfect instant — inside the lock
        if (brace === 'mash' && e.lungeT > 0) {
          if (raisedAt == null && d <= 60) { keys['KeyL'] = 1; raisedAt = n; }
          else if (raisedAt != null && !lungeMash && d <= 20) { delete keys['KeyL']; await frame(); keys['KeyL'] = 1; lungeMash = true; finalAt = n; }
        }
        if (contactAt == null && aabb(e, player)) contactAt = n;
        if (player.parries || player.cores < c0 || (contactAt != null && n > contactAt + 4)) break;
        await frame();
      }
      const pressedFirst = brace === 'late' || (finalAt != null && (contactAt == null || contactAt > finalAt) && (brace !== 'mash' || lungeMash));
      const out = { kind, brace, pressedFirst, mashed: lungeMash, lost: c0 - player.cores, parries: player.parries | 0, glint,
        winded: +(e.windedT || 0).toFixed(2), counterOpen: player.counterT > 0, heat: +(player.guardHeat || 0).toFixed(2),
        how: G.parryLog && G.parryLog.length ? G.parryLog[G.parryLog.length - 1].how : null, e, hp0 };
      return out;
    };
    // A loaded machine renders a frame in 100 ms, and the lunge closes 20 px
    // in that: the press can land on the far side of contact. That run did not
    // test the parry at all, so it is run again — at most four times — rather
    // than counted; the press must be BEFORE contact for the case to exist.
    const lungeTimed = async (kind, brace) => {
      let r0;
      for (let a = 0; a < 4; a++) {
        r0 = await lunge(kind, brace); r0.tries = a + 1;
        if (r0.pressedFirst) break;
        delete keys['KeyL'];
      }
      return r0;
    };
    const res = {};
    const A = await lungeTimed('guard', 'perfect');
    // THE COUNTER: a real ATTACK press inside the window, sampled for i-frames
    const hpBefore = A.e.hp;
    let invulnAll = true, sawAct = false;
    const pre = { counterT: +player.counterT.toFixed(3), foe: !!player.counterFoe, hitStop: G.hitStop, src: INPUT_SRC || 'keys' };
    keysP['KeyX'] = 1; keys['KeyX'] = 1;
    for (let i = 0; i < 30; i++) {
      await frame();
      if (i === 1) delete keys['KeyX'];
      if (player.counterAct) { sawAct = true; if (!(player.iT > 0)) invulnAll = false; }
      else if (sawAct) break;
    }
    res.counter = { pre, sawAct, invulnAll, dealt: G.lastCounter ? G.lastCounter.dealt : null, hpLost: hpBefore - A.e.hp, fixed: 36 };   // written out, not read from ATTACKS.counter
    delete keys['KeyL'];
    res.perfect = Object.assign({}, A, { e: undefined });
    for (const [k, kind, br] of [['late', 'guard', 'late'], ['plain', 'crawler', 'perfect'], ['mash', 'guard', 'mash']]) {
      const r0 = await lungeTimed(kind, br); r0.e = undefined; res[k] = r0; delete keys['KeyL'];
    }
    // THE GLINT IS ACTUALLY DRAWN: one parryable machine through drawParryTells
    // onto a clean canvas, counting the pixels of its colour round the point
    {
      await reset();
      const e = new Enemy('guard', 200, 200); e.parryable = true; G.enemies = [e];
      const cv = document.createElement('canvas'); cv.width = 400; cv.height = 400;
      const c = cv.getContext('2d');
      drawParryTells(c);
      const pt = parryPoint(e);
      const img = c.getImageData(Math.round(pt[0]) - 20, Math.round(pt[1]) - 20, 40, 40).data;
      let lime = 0;
      for (let i = 0; i < img.length; i += 4) if (img[i + 3] > 120 && img[i + 1] > 200 && img[i] > 150 && img[i + 2] < 90) lime++;
      e.parryable = false;
      const c2 = document.createElement('canvas').getContext('2d'); c2.canvas.width = 400; c2.canvas.height = 400;
      drawParryTells(c2);
      const img2 = c2.getImageData(Math.round(pt[0]) - 20, Math.round(pt[1]) - 20, 40, 40).data;
      let lime2 = 0; for (let i = 3; i < img2.length; i += 4) if (img2[i] > 0) lime2++;
      res.glint = { lime, offPixels: lime2 };
      G.enemies = [];
    }
    return res;
  });
  const fsx = require('fs'), pathx = require('path');
  const jsDir = pathx.join(__dirname, '..', 'js');
  const holders = fsx.readdirSync(jsDir).filter(f => f.endsWith('.js') && /#c6ff1a/i.test(fsx.readFileSync(pathx.join(jsDir, f), 'utf8')));
  const pf = P.perfect;
  check('PARRY: a brace raised as the guard\'s lunge lands turns it — no core, the machine winded, the counter open',
    pf.parries === 1 && pf.lost === 0 && pf.winded >= 0.5 && pf.counterOpen && pf.how === 'guard', JSON.stringify(pf));
  check('...and a turned blow is not a held one: no guard heat', pf.heat === 0, 'heat ' + pf.heat);
  check('the lunge wore the parry glint before it landed', pf.glint);
  check('the counter: one ATTACK press answers, invulnerable for all of it',
    P.counter.sawAct && P.counter.invulnAll, JSON.stringify(P.counter));
  check('...for fixed damage (' + P.counter.fixed + '), not her scaled slash',
    P.counter.dealt === P.counter.fixed && P.counter.hpLost >= P.counter.fixed, JSON.stringify(P.counter));
  check('a brace held from early is just the brace: blocked, heated, not parried',
    P.late.parries === 0 && P.late.lost === 0 && P.late.heat > 0 && !P.late.counterOpen, JSON.stringify(P.late));
  check('an attack without the glint cannot be parried, even at perfect timing',
    !P.plain.glint && P.plain.parries === 0 && !P.plain.counterOpen, JSON.stringify(P.plain));
  check('mashing GUARD buys no window: a re-raise inside the lock is a plain brace',
    P.mash.mashed && P.mash.parries === 0 && !P.mash.counterOpen, JSON.stringify(P.mash));
  check('the glint is drawn in its colour where the blow comes from, and not when nothing is parryable',
    P.glint.lime >= 20 && P.glint.offPixels === 0, JSON.stringify(P.glint));
  check('the parry colour is used by nothing else in the game (only js/parry.js names it)',
    holders.length === 1 && holders[0] === 'parry.js', holders.join(', '));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
