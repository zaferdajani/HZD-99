// ART IS DECODED BEFORE IT IS DRAWN (owner, 2026-11-15, playing the APK: "the
// screen was not very smooth when it moved. Some frames felt like it's not
// glitching but lagging to point of a second").
//
// A loaded sheet is a file; its pixels are made the first time a canvas draws
// it, on the main thread, in that frame — 50 to 190 ms a sheet on a desktop
// CPU, several times that on a phone, and the packaged app has no quarter-size
// copies to soften it. js/media.js now makes every sheet's pixels ahead of
// time, off the main thread (createImageBitmap of a Blob — the one route that
// measured as doing both), under a memory ceiling. This measures that:
//
//   A  a sheet something asks for has its pixels a moment after it loads, and
//      its first draw then costs a fraction of a cold sheet's;
//   B  making them does not stall the main thread;
//   C  what is drawn is the same picture, pixel for pixel;
//   D  a sheet prefetched for a far room is published as before, and gets its
//      pixels when she comes within a door of it;
//   E  the ceiling holds, what is closed is the least recently drawn, and a
//      closed sheet still draws;
//   F  in the app's own configuration, a room's art has its pixels within
//      moments of her entering;
//   G  the brightness probe reads the canvas back a sixth as often;
//   H  the decode is on a WORKER (so it is off the main thread on an iPhone's
//      WebKit too, which could not be run here), and an engine that is not
//      Chromium and cannot have the worker is left exactly as it was.
//
//   node tests/decode-ahead.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  const open = async (app) => {
    const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
    if (app) await page.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android' }; });
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function' && typeof ART_BM !== 'undefined');
    return { ctx, page, errors };
  };
  try {
    console.log('── decode-ahead — a sheet\'s pixels are made off the frame, before the frame that draws it');
    {
      const { ctx, page, errors } = await open(false);
      const R = await page.evaluate(async () => {
        window.requestAnimationFrame = () => 0; PRE.on = false;
        const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const c = cv.getContext('2d', { willReadFrequently: true });
        const firstDraw = (o) => { const t = performance.now(); c.drawImage(o, 0, 0, 960, 540); c.getImageData(0, 0, 1, 1); return performance.now() - t; };
        const cold = (k) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = MEDIA_SRC.images[k] + (MEDIA_SRC.images[k].indexOf('?') < 0 ? '?' : '&') + 'cold=' + Math.random(); });
        const until = async (f, ms) => { const t0 = performance.now(); while (!f() && performance.now() - t0 < ms) await new Promise(r => setTimeout(r, 20)); return f(); };
        // the main thread's longest silence while something happens
        const stall = async (fn) => { let last = performance.now(), worst = 0, on = true; const ch = new MessageChannel();
          ch.port1.onmessage = () => { const n = performance.now(); worst = Math.max(worst, n - last); last = n; if (on) ch.port2.postMessage(0); }; ch.port2.postMessage(0);
          await fn(); on = false; return worst; };
        // (the page's own boot work — the roster's cleanup among it — is let finish
        // first: it is the main thread being busy with something else)
        await new Promise(r => setTimeout(r, 3500));
        const out = { off: ART_BM.off, rows: [] };
        // ---- A, B: big sheets nothing has asked for yet ----
        const big = ['beastStudioRoar', 'beastStudioLeap', 'beastStudioTurn', 'heroStates', 'beastGallop'].filter(k => MEDIA_SRC.images[k] && !MEDIA_RAW[k] && !MEDIA_PEND[k]);
        for (const k of big) {
          let pubMs = -1; const tp = performance.now();
          const st = await stall(async () => { mediaFetch(k, 1); await until(() => MEDIA_RAW[k] && MEDIA_LOW[k] === 3, 8000); pubMs = performance.now() - tp; await until(() => MEDIA_RAW[k] && MEDIA_RAW[k].__bm, 6000); });
          const im = MEDIA_RAW[k]; const has = !!(im && im.__bm);
          const warm = im ? firstDraw(im) : -1;
          const cim = await cold(k); const coldMs = firstDraw(cim);
          out.rows.push({ k, px: cim.naturalWidth + 'x' + cim.naturalHeight, has, warm: +warm.toFixed(1), cold: +coldMs.toFixed(1), stall: +st.toFixed(1), pub: Math.round(pubMs), bmAt: Math.round(performance.now() - tp) });
        }
        // ---- C: the same picture ----
        { const k = 'heroStates', im = MEDIA_RAW[k]; const px = (o) => { c.clearRect(0, 0, 960, 540); c.drawImage(o, 0, 0, 960, 320, 0, 0, 960, 320); return c.getImageData(0, 0, 960, 320).data; };
          const a = px(im); const bm = im.__bm; im.__bm = null; const b = px(im); im.__bm = bm;
          let diff = 0, max = 0; for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d) { diff++; if (d > max) max = d; } }
          out.same = { diff, max, n: a.length, w: im.naturalWidth, bw: bm ? bm.width : 0, bh: bm ? bm.height : 0, h: im.naturalHeight }; }
        // ---- D: far, then near ----
        { const k = ['beastStudioStalk', 'beastStudioIdle', 'beastStudioSwipe'].find(q => MEDIA_SRC.images[q] && !MEDIA_RAW[q] && !MEDIA_PEND[q]);
          mediaFetch(k, 0, 0, true); await until(() => MEDIA_RAW[k], 8000); await new Promise(r => setTimeout(r, 300));
          const farHas = !!(MEDIA_RAW[k] && MEDIA_RAW[k].__bm), farHere = !!MEDIA_RAW[k];
          artBmNear([k]); const t0 = performance.now();
          await until(() => { artBmTick(); return MEDIA_RAW[k].__bm; }, 6000);
          out.far = { k, farHere, farHas, nearHas: !!MEDIA_RAW[k].__bm, ms: Math.round(performance.now() - t0) }; }
        // ---- E: the ceiling ----
        { const all = ART_BM.items.filter(im => im.__bm); const before = { bytes: ART_BM.bytes, n: all.length };
          // draw one of them "now" and name one as near; the rest are fair game
          ART_BM.t += 1000; const fresh = all[0], kept = all[1]; firstDraw(fresh); ART_BM.near = { [kept.__k]: 1 };
          const cap0 = ART_BM.cap; ART_BM.cap = (fresh.__bmB || 0) + (kept.__bmB || 0) + 1024;
          const k = ['beastStudioIdle', 'beastStudioSwipe', 'beastRearSwipe'].find(q => MEDIA_SRC.images[q] && !MEDIA_RAW[q] && !MEDIA_PEND[q]);
          mediaFetch(k, 1); await until(() => MEDIA_RAW[k] && MEDIA_LOW[k] === 3, 8000); await new Promise(r => setTimeout(r, 600));
          const closed = all.filter(im => !im.__bm);
          let drew = true, lit = 0; try { c.clearRect(0, 0, 960, 540); c.drawImage(closed[0], 0, 0, 960, 540); const d = c.getImageData(0, 0, 960, 540).data; for (let i = 3; i < d.length; i += 4) if (d[i]) lit++; } catch (e) { drew = false; }
          out.cap = { before, capMB: +(ART_BM.cap / 1048576).toFixed(1), bytesMB: +(ART_BM.bytes / 1048576).toFixed(1), under: ART_BM.bytes <= ART_BM.cap, closed: closed.length,
            freshKept: !!fresh.__bm, nearKept: !!kept.__bm, newHas: !!(MEDIA_RAW[k] && MEDIA_RAW[k].__bm), newHere: !!MEDIA_RAW[k], drew, lit, evict: ART_BM.evict };
          ART_BM.cap = cap0; }
        out.worker = { is: typeof Worker !== 'undefined' && ART_BM.worker instanceof Worker, onWorker: ART_BM.onWorker, onPage: ART_BM.onPage, made: ART_BM.made, failed: ART_BM.failed };
        // ---- H: an engine that is not Chromium, with no worker to be had ----
        { const k = Object.keys(MEDIA_SRC.images).find(q => /^assets\/characters\/beast\//.test(MEDIA_SRC.images[q]) && !MEDIA_RAW[q] && !MEDIA_PEND[q]);
          const w0 = ART_BM.worker, c0 = ART_BM.chromium, made0 = ART_BM.made; ART_BM.worker = false; ART_BM.chromium = false;
          mediaFetch(k, 1); await until(() => MEDIA_RAW[k] && MEDIA_LOW[k] === 3, 8000); await new Promise(r => setTimeout(r, 500));
          let drew = true; try { c.clearRect(0, 0, 960, 540); c.drawImage(MEDIA_RAW[k], 0, 0, 960, 540); } catch (e) { drew = false; }
          out.noWorker = { k, here: !!MEDIA_RAW[k], bm: !!(MEDIA_RAW[k] && MEDIA_RAW[k].__bm), off: ART_BM.off, made: ART_BM.made - made0, drew };
          ART_BM.worker = w0; ART_BM.chromium = c0; ART_BM.off = false; }
        return out;
      });
      check('the browser can do it at all (bitmaps from blobs)', !R.off);
      check('the decode runs in a worker — off the main thread in every engine, the iPhone\'s included', R.worker.is && R.worker.onWorker >= 4 && R.worker.onPage === 0 && R.worker.failed === 0, R.worker.onWorker + ' bitmaps made on the worker, ' + R.worker.onPage + ' on the page, ' + R.worker.failed + ' failed');
      check('H  an engine that is not Chromium and has no worker gets no page-side decode: the scheme turns itself off and the sheet draws the old way', R.noWorker.here && !R.noWorker.bm && R.noWorker.off && R.noWorker.made === 0 && R.noWorker.drew, JSON.stringify(R.noWorker));
      for (const r of R.rows) {
        check('A  ' + r.k + ' (' + r.px + ') has its pixels a moment after it loads, and its first draw is a fraction of a cold one', r.has && r.warm < r.cold * 0.4 && r.warm < 30, 'first draw ' + r.warm + ' ms; the same file cold ' + r.cold + ' ms (published at ' + r.pub + ' ms, pixels ready by ' + r.bmAt + ' ms)');
      }
      // (the title screen behind this is not idle — a timer or a collection can
      // land in any one of these windows — so it is the typical sheet that is
      // held to the number, and no more than one may be an outlier)
      { const st = R.rows.map(r => r.stall).sort((a, b) => a - b), med = st[Math.floor(st.length / 2)], over = R.rows.filter(r => r.stall >= r.cold * 0.6).length;
        check('B  making them does not hold the main thread: the decode is on another thread', med < 8 && over <= 1, 'longest main-thread silence while each was made: ' + R.rows.map(r => r.stall).join(', ') + ' ms (their cold draws: ' + R.rows.map(r => r.cold).join(', ') + ' ms)'); }
      check('A  (five big sheets were there to measure)', R.rows.length >= 4, R.rows.length + ' sheets');
      check('C  the bitmap is the same picture, pixel for pixel, at the same size', R.same.diff === 0 && R.same.bw === R.same.w && R.same.bh === R.same.h, R.same.diff + ' of ' + R.same.n + ' channel values differ (worst by ' + R.same.max + '); ' + R.same.bw + 'x' + R.same.bh + ' against ' + R.same.w + 'x' + R.same.h);
      check('D  a sheet prefetched for a far room is published as it always was, undecoded', R.far.farHere && !R.far.farHas, R.far.k);
      check('D  ...and has its pixels once she is within a door of it', R.far.nearHas, R.far.ms + ' ms after the room said so');
      check('E  the ceiling holds', R.cap.under && R.cap.closed > 0, R.cap.bytesMB + ' MB held under a ' + R.cap.capMB + ' MB ceiling; ' + R.cap.closed + ' closed to get there (from ' + (R.cap.before.bytes / 1048576).toFixed(0) + ' MB in ' + R.cap.before.n + ')');
      check('E  ...what she has just drawn and what is within a door of her are kept', R.cap.freshKept && R.cap.nearKept);
      check('E  ...a sheet that does not fit is still published, and a closed sheet still draws', R.cap.newHere && R.cap.drew && R.cap.lit > 1000, 'new sheet here ' + R.cap.newHere + ' (bitmap ' + R.cap.newHas + '); a closed one drew ' + R.cap.lit + ' lit pixels');
      check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
      await ctx.close();
    }
    // ---- F, G: the app, playing ----
    {
      const { ctx, page, errors } = await open(true);
      await page.waitForTimeout(1500);
      const R = await page.evaluate(async () => {
        const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; startGame(sv); G.wake = G.dialog = G.cut = null; G.state = 'PLAY'; loadRoom('A2');
        const pol = preloadPolicy();
        const near = () => Object.keys(ART_BM.near).filter(k => MEDIA_SRC.images[k]);
        const t0 = performance.now(); let ready = -1;
        const tm = setInterval(() => { if (typeof player !== 'undefined' && player) player.iT = 9; }, 100);
        while (performance.now() - t0 < 20000) { await new Promise(r => setTimeout(r, 200));
          const ks = near(); const here = ks.filter(k => MEDIA_RAW[k] && MEDIA_LOW[k] === 3); const dec = here.filter(k => MEDIA_RAW[k].__bm);
          if (ks.length && here.length === ks.length && (dec.length === here.length || ART_BM.bytes > artBmCap() * 0.85)) { ready = performance.now() - t0; break; } }
        const ks = near(), here = ks.filter(k => MEDIA_RAW[k] && MEDIA_LOW[k] === 3), dec = here.filter(k => MEDIA_RAW[k].__bm);
        const looks0 = G.liftLooks | 0, l0 = performance.now();
        await new Promise(r => setTimeout(r, 9000));
        clearInterval(tm);
        return { pol, near: ks.length, here: here.length, dec: dec.length, ready: Math.round(ready), mb: +(ART_BM.bytes / 1048576).toFixed(0), cap: +(artBmCap() / 1048576).toFixed(0), n: ART_BM.n,
          looks: (G.liftLooks | 0) - looks0, secs: +((performance.now() - l0) / 1000).toFixed(1), failed: ART_BM.failed, room: G.roomId };
      });
      check('F  (this is the packaged app\'s policy: everything fetched, no quarter-size copies)', R.pol.far && !R.pol.lowAll, JSON.stringify(R.pol));
      check('F  in the app, the art within a door of her has its pixels moments after she enters', R.ready >= 0 && R.dec >= R.here * 0.9 && R.here === R.near, R.dec + ' of ' + R.near + ' sheets decoded ' + (R.ready / 1000).toFixed(1) + ' s after the room loaded; ' + R.mb + ' MB of a ' + R.cap + ' MB ceiling');
      check('F  ...and none of them failed to decode', R.failed === 0, R.failed + ' failed');
      check('G  standing in one room, the brightness probe reads the canvas back once every three seconds, not twice a second', R.looks >= 2 && R.looks <= 5, R.looks + ' looks in ' + R.secs + ' s (it was ' + Math.round(R.secs * 2) + ')');
      check('no page errors (app)', errors.length === 0, errors.slice(0, 2).join(' | '));
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\ndecode-ahead: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
