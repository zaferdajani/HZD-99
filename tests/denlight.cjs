// THE INTERIORS, LIT THE WAY A STRONG PHONE LIGHTS THEM.
//
// The owner sent three screenshots from his phone (2026-09-03): the trader's
// den under a yellow disc the size of the room, Ratchet a ghost inside it, the
// shelves gone. "It went away then came back when I got to the scrapbox."
//
// It was the interior lamp pass (drawCaveDark, indoor branch) at full
// strength, and it had NEVER BEEN SEEN at full strength by anyone tuning it.
// The additive glow rides `richK`, the dial that fades the luxuries out when
// the frame rate slips — and on the software rasteriser every harness in this
// repo runs on, richK is at zero within a couple of seconds of any room
// loading. So every headless screenshot of a den, ever, was the glow-OFF
// picture: "dull and dark", exactly the complaint the pass was written to
// answer, which is how INT_ADD climbed to 0.95 — the lamps were being turned
// up to compensate for lamps that were not being drawn. On his phone the dial
// sat at one, the lamps came on at 0.95 over a painting that was already lit,
// and three quarters of the pixels around the keeper clipped. Measured at that
// setting: 73% clipped around the NPC, 12-16% of the whole frame, in all six
// interiors. And "went away then came back" is the dial dropping under load
// and recovering — the on/off he saw was richK, not the chest.
//
// So this harness does the one thing nothing had done: it PINS richK AT ONE
// and looks at the room a good device shows. For every indoor room —
//
//   the frame keeps its picture: at most a few per cent of pixels clipped;
//   the keeper is lit, not erased: the region around the NPC is not a white
//     (or yellow) hole;
//   ...and the lamps are still LAMPS: the same region is markedly brighter
//     with the glow than with it switched off, or the pass is doing nothing
//     and the room is back to the complaint it was built to fix.
//
// INT_ADD is `let`, like the background grade knobs, so this can sweep it and
// so the shipped value is read off the game rather than repeated here.
//
//   node tests/denlight.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

// THE LAWS. Clipping is measured as the share of pixels with a channel at 250+
// — the painting's own lamps contribute a little of that on their own (0-2%
// with the glow off), so the floors sit above that and well below a disc.
const FRAME_CLIP_MAX = 0.03;   // the room survives its own lamps
const NPC_CLIP_MAX = 0.12;     // the keeper is lit, not dissolved
const GLOW_LIFT_MIN = 25;      // ...and the lamps are visibly on (mean 0-255 around the NPC)

(async () => {
  console.log('── denlight — the interiors at full glow, the way a strong phone shows them\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const rooms = await page.evaluate(() => Object.keys(ROOMS).filter((id) => ROOMS[id].indoor));
  const shipped = await page.evaluate(() => INT_ADD);
  console.log('  interiors: ' + rooms.join(', ') + '   INT_ADD as shipped: ' + shipped + '\n');

  for (const room of rooms) {
    await page.evaluate(async (room) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
      startGame(sv); loadRoom(room); G.dialog = null; G.state = 'PLAY'; G.toasts = []; G.wake = null;
      const n = G.statics.find((s) => s.type === 'npc');
      player.x = (n ? n.x : 12 * TILE) - 200; player.y = (G.roomDef.h - 2) * TILE - player.h;
    }, room);
    // THE PLATES ARE LAZY, AND THE PICTURE HAS TO BE THE FINISHED ONE. A
    // fixed wait was enough alone and not enough behind a harness that had
    // just walked every room: a plate landing between the pin and the read is
    // a different picture, measured as a different room. So the art is DRAINED
    // — every fetch this page has started, to its full tier (MEDIA_LOW 3; the
    // quarter-scale stand-in fills MEDIA_RAW first and does not count) — the
    // same drain tests/kingdom.cjs uses for the same reason.
    await page.waitForTimeout(600);
    await page.waitForFunction(() => Object.keys(MEDIA_PEND).every((k) => MEDIA_LOW[k] === 3), { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(300);
    const r = await page.evaluate(({ shipped }) => {
      const shot = (add) => {
        // ONE FRAME, DRAWN BY HAND, WITH THE DIAL PINNED. draw() is called
        // directly so the loop cannot decay richK between the pin and the
        // read, and the strong-device configuration is stated rather than
        // hoped for: glow dial open, bloom on.
        INT_ADD = add; QUAL.bloom = true; richK = 1;
        draw(performance.now());
        const W = c.canvas.width, H = c.canvas.height, k = W / 960;
        const n = G.statics.find((s) => s.type === 'npc');
        const nx = n ? (n.x + n.w / 2 - camSX()) * k : W / 2;
        const ny = n ? (n.y + n.h * 0.4 - camSY()) * k : H / 2;
        const box = (x0, y0, w, h) => {
          const d = c.getImageData(Math.max(0, x0 | 0), Math.max(0, y0 | 0), w | 0, h | 0).data;
          let s = 0, clip = 0;
          for (let i = 0; i < d.length; i += 4) {
            s += d[i] + d[i + 1] + d[i + 2];
            if (Math.max(d[i], d[i + 1], d[i + 2]) >= 250) clip++;
          }
          return { mean: s / (d.length / 4) / 3, clip: clip / (d.length / 4) };
        };
        return { npc: box(nx - 80 * k, ny - 60 * k, 160 * k, 120 * k), frame: box(0, 0, W, H), hasNpc: !!n };
      };
      const on = shot(shipped), off = shot(0);
      INT_ADD = shipped;
      return { on, off };
    }, { shipped });
    const tag = room + ' @' + shipped;
    check(tag + ': the frame survives its own lamps', r.on.frame.clip <= FRAME_CLIP_MAX,
          (r.on.frame.clip * 100).toFixed(1) + '% clipped (max ' + FRAME_CLIP_MAX * 100 + '%)');
    if (r.on.hasNpc) {
      check(tag + ': the keeper is lit, not dissolved', r.on.npc.clip <= NPC_CLIP_MAX,
            (r.on.npc.clip * 100).toFixed(1) + '% clipped around the NPC (max ' + NPC_CLIP_MAX * 100 + '%)');
      const lift = r.on.npc.mean - r.off.npc.mean;
      check(tag + ': ...and the lamps are on', lift >= GLOW_LIFT_MIN,
            'mean ' + r.on.npc.mean.toFixed(0) + ' lit vs ' + r.off.npc.mean.toFixed(0) + ' dark (+' + lift.toFixed(0) + ', min +' + GLOW_LIFT_MIN + ')');
    }
  }

  check('no page errors', errs.length === 0, errs[0]);
  await browser.close();
  if (fails.length) { console.log('\n' + fails.length + ' FAILED:\n' + fails.map((f) => '  ' + f).join('\n')); process.exit(1); }
  console.log('\nOK — six lamplit rooms, none of them a disc');
})();
