// GLOW IS THE MOST EXPENSIVE THING THIS GAME DRAWS, AND NOTHING WAS COUNTING IT.
//
// Canvas2D shadowBlur is a real gaussian per draw call with no batching behind
// it — the same fact that made six hundred glowing particles cost a whole frame
// on a phone (see js/engine.js drawParts). Everywhere else in the renderer that
// cost is deliberate and budgeted. In the HUD it was not: the core row redrew
// five identical icons at three blurred fills each, every frame, in every room,
// forever. Measured in the trader's den it was FIFTEEN of the room's thirty
// blurred draws, and the den only issues about a hundred draws in total — so
// more than a quarter of everything that room drew was the same five pictures
// being re-blurred.
//
// That is invisible in a screenshot and invisible in a profile that only looks
// at frame time on a fast machine, which is exactly why it survived. So it is
// counted here instead: the 2D context is wrapped, every draw that carries a
// non-zero shadowBlur is attributed to its call site, and the per-frame totals
// are held to a ceiling.
//
// The ceilings are deliberately loose. This is not a pixel budget and it must
// not fail on a machine that schedules a frame differently — it exists to catch
// a REGRESSION IN KIND: somebody putting a per-frame blur back into the HUD, or
// letting an outdoor effect run indoors again. A number that doubles is the
// signal; a number that moves by two is noise.
//
//   node tests/glowcost.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── glowcost — the most expensive thing the renderer does, counted\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const out = {};
    for (const room of ['A0B', 'A0', 'A1']) {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
      startGame(sv); loadRoom(room);
      await new Promise(r2 => setTimeout(r2, 800));
      const ctx = c, sites = {};
      const OPS = ['fill', 'stroke', 'fillRect', 'strokeRect', 'drawImage', 'fillText', 'arc'];
      const orig = {};
      let blurred = 0, total = 0;
      for (const op of OPS) {
        if (typeof ctx[op] !== 'function') continue;
        orig[op] = ctx[op].bind(ctx);
        ctx[op] = function (...a) {
          total++;
          if ((ctx.shadowBlur || 0) > 0) {
            blurred++;
            const st = new Error().stack.split('\n');
            let name = '?';
            for (let i = 1; i < st.length; i++) {
              const m = st[i].match(/at (\w+)/);
              if (m && m[1] !== 'ctx' && m[1] !== 'Object') { name = m[1]; break; }
            }
            sites[name] = (sites[name] || 0) + 1;
          }
          return orig[op](...a);
        };
      }
      let frames = 0;
      await new Promise(res => {
        const step = () => { frames++; if (frames >= 24) return res(); requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
      for (const op of OPS) if (orig[op]) ctx[op] = orig[op];
      out[room] = {
        blurred: Math.round(blurred / frames),
        total: Math.round(total / frames),
        sites: Object.fromEntries(Object.entries(sites)
          .map(([k, v]) => [k, +(v / frames).toFixed(1)])
          .filter(([, v]) => v >= 0.5).sort((a, b) => b[1] - a[1])),
      };
    }
    return out;
  });

  for (const [room, v] of Object.entries(r))
    console.log(`     ${room}: ${v.blurred} blurred of ${v.total} draws/frame   `
      + Object.entries(v.sites).map(([k, n]) => `${k}:${n}`).join(' '));
  console.log('');

  // THE HUD DOES NOT BLUR PER FRAME. Its resting icons are baked (heartIcon);
  // only a FLASHING core draws live, and at most one flashes at a time. Three
  // is the allowance for that one plus the volt gauge and the element pip.
  const hud = Math.max(...Object.values(r).map(v => v.sites.drawHUD || 0));
  check('the HUD is not re-blurring its icons every frame', hud <= 4,
    'worst room: ' + hud + ' blurred HUD draws/frame');

  // AN INDOOR ROOM RUNS NO OUTDOOR WEATHER. The Meadows drip condensation off a
  // roof the den does not have; it cost five blurred draws a frame of an effect
  // belonging to a place she is not standing in.
  check('no outdoor ceiling weather inside the den',
    !(r.A0B.sites.drawCeilWeather > 0),
    'A0B drawCeilWeather: ' + (r.A0B.sites.drawCeilWeather || 0));

  // and the totals stay in the range the bake brought them to
  for (const [room, cap] of [['A0B', 24], ['A0', 26], ['A1', 30]])
    check(`${room} stays under ${cap} blurred draws a frame`, r[room].blurred <= cap,
      r[room].blurred + ' / ' + cap);

  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILED\n  ' + fails.join('\n  ')
    : 'OK — the glow is budgeted, and the HUD pays once instead of every frame'));
  process.exit(fails.length ? 1 : 0);
})();
