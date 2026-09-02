// THE INTAKE GATE — nothing enters this game's art without passing here.
//
// The owner, after finding it himself in a contact sheet: "create a pipeline to
// check all artwork that lands from Higgsfield to make sure they do not have
// this type of error given again. It should check all the artwork, make sure
// every single image is different, create an error-free prompt to generate such
// an image, and refuse anything less than that."
//
// The defect it exists for was invisible from inside the game and cost a week:
// a take that LOOKS like a movement and is mostly the same picture. Measured
// after the fact, nineteen of one strip's twenty-four cells were the drawing
// before them. The frames were paid for, keyed, shipped, and played as a
// stutter.
//
// Everything here is a REFUSAL, not a warning. A take that fails exits non-zero
// and prints the brief to re-fire it with — because the other half of the
// owner's instruction is that a rejection has to come with the corrected
// prompt, or it is just a complaint.
//
//   node tools/intake.cjs <clip.mp4|webm> [--from S] [--to S] [--want N]
//   node tools/intake.cjs <a.png> <b.png> ...        (a set of stills)
//   node tools/intake.cjs --dir <folder>             (everything in a folder)
//   ...a set of stills needs --cutout or --bg. A character on a flat field and
//   a full-frame backdrop fail in opposite ways, and the tool will not guess.
//
// Exit 0 = keyable. Exit 1 = refused, with reasons and a re-fire brief.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

// ---------------------------------------------------------------------------
// THE BAR. Every number here was set by a defect that actually shipped, and
// each one names it, so a future reader can tell a measured threshold from a
// preference.
// ---------------------------------------------------------------------------
const BAR = {
  // Two cells are the SAME PICTURE below this, as a percentage of the union
  // silhouette that changed. 2.5 is the level at which a 60px-tall sprite shows
  // no visible difference between two frames — measured on the strips that
  // shipped as stutters.
  same: 2.5,
  // A take must hold at least this many distinct pictures to be a MOVEMENT. Six
  // was the old cell count and it was too few to read as motion; nine is what
  // the weakest take that still reads (the finisher) actually contains.
  minDistinct: 9,
  // ...found without dropping the selector below this. A take that needs a
  // lower threshold to reach the count is a take whose "motion" is noise.
  minThreshold: 3.0,
  // The subject must not be cut off by the frame: a plate whose silhouette
  // touches the border loses a paw the moment it is keyed and centred.
  edgeSlack: 4,
  // ...and it has to BE in the frame. Under this fraction of the picture the
  // character is a speck and the strip will be mostly empty cell.
  minCover: 0.04,
  // The field has to be keyable: a background this uniform can be flood-filled
  // from the border. Higher means the generator painted a scene behind her.
  fieldSd: 26,

  // A BACKDROP FAILS DIFFERENTLY. It is SUPPOSED to fill the frame and touch
  // every border, so the three cutout checks above are meaningless against one
  // — the first run of this tool refused five perfectly good wallpapers for
  // being wallpapers. What a backdrop can actually be is FLAT: no staged
  // depth, nothing for a character to separate from. That is the owner's
  // "background is toooooo dark and faded", turned into a measurement.
  //
  // These three numbers are set from the plates themselves. Across the six
  // gates as shipped and the six repainted in the house style:
  //
  //   shipped    range 58-152   median 26-80   sat 20-42
  //   repainted  range 92-205   median 35-76   sat 19-57
  //
  // so the bar sits in the gap: it passes every plate painted to the style and
  // refuses four of the six the owner complained about.
  bgRange: 90,    // p95 - p5 of luminance. Three value bands clear this easily.
  bgMedian: 32,   // a plate already this dark has nothing left after the grade.
  bgSat: 18,      // a floor against grey mush, not a style rule — a deliberately
                  // cold scene (the conduits gate reads 19) still passes.
};

// the correction the generator actually responds to. NAMING A THING FORBIDS
// NOTHING is the standing lesson of this pipeline — "no held poses" produces
// held poses — so every line here describes what the picture IS.
function refireBrief(kind, faults) {
  const L = [];
  L.push('── RE-FIRE BRIEF ' + '─'.repeat(56));
  L.push('');
  if (kind === 'plates') {
    L.push('Keep every word of the original brief that names WHAT IS IN the room');
    L.push('and where each thing sits. Replace the STAGING sentence with this:');
  } else {
    L.push('Keep every word of the original brief that describes WHO she is and');
    L.push('what the field behind her is. Replace the ACTION sentence with this:');
  }
  L.push('');
  if (faults.includes('distinct') || faults.includes('threshold')) {
    L.push('  "She performs the move ONCE, slowly and completely, filling the');
    L.push('   whole clip with it. Every moment of the clip is a different');
    L.push('   position of her body: she is travelling through the movement from');
    L.push('   the first frame to the last, the way a diver is in a different');
    L.push('   shape at every instant of a dive. Her limbs sweep through wide');
    L.push('   arcs and her whole body carries the motion — shoulders, hips and');
    L.push('   tail turning with it. The camera is locked and she stays the same');
    L.push('   size in frame."');
    L.push('');
    L.push('  WHY: the take that failed spends most of its length with the body');
    L.push('  parked. Asking for the move to fill the clip is what turns a');
    L.push('  photograph with a wobble into a sequence.');
  }
  if (faults.includes('field')) {
    L.push('  "...alone on a pure flat black field. Nothing else is in the');
    L.push('   picture: no floor, no horizon line, no shadow cast on anything,');
    L.push('   no room around her. The black is empty space, edge to edge."');
    L.push('');
    L.push('  WHY: the key that cuts her out floods in from the border, and it');
    L.push('  cannot cross a drawn horizon or a painted floor.');
  }
  if (faults.includes('flat') || faults.includes('dark') || faults.includes('grey')) {
    L.push('  "...staged in three clear depth bands that a character can stand');
    L.push('   against: a near-black foreground band along the bottom edge, the');
    L.push('   subject of the room in a warm mid tone, and a pale hazy far layer');
    L.push('   behind it. One key light with a bright core, and a cool');
    L.push('   complementary fill in every shadow so the darks carry colour.');
    L.push('   Bold poster-clear shapes, high contrast, the whole composition');
    L.push('   readable at a glance and at thumbnail size."');
    L.push('');
    L.push('  WHY: the game grades this plate down and then stands a character');
    L.push('  on top of it. A plate that is already dark, or already one flat');
    L.push('  band of value, has nothing left to give — the character sinks into');
    L.push('  it and the room reads as fog. Depth has to be painted IN, not left');
    L.push('  for the engine to find.');
  }
  if (faults.includes('edge') || faults.includes('cover')) {
    L.push('  "...framed so her whole body including her ears, her tail, her');
    L.push('   cape and both paws stays well inside the picture with clear space');
    L.push('   all around her, and she fills about half the height of the frame."');
    L.push('');
    L.push('  WHY: a silhouette that touches the border loses whatever crossed');
    L.push('  it the moment the plate is cut out and centred.');
  }
  L.push('');
  L.push('Then measure the result with this tool again before keying it.');
  L.push('─'.repeat(72));
  return L.join('\n');
}

const SIG = 40;
const pageScript = () => {
  // A SIGNATURE, AND THE THING IT IS MEASURED AGAINST.
  //
  // Change has to be read relative to HOW MUCH SUBJECT THERE IS, not to the
  // size of the picture. A character on a black field occupies a quarter of the
  // frame, so normalising by the frame divides every difference by four and a
  // lively take reports as still — this tool's first run called a clip that
  // holds twenty-four distinct pictures "3, and 100% still", and disagreed with
  // the cutter that had just cut twenty-four out of it. Two tools measuring the
  // same thing must agree or neither can be trusted, and the cutter was right.
  //
  // `cov` is what counts as subject: the ALPHA where a plate has one, and the
  // VALUE where a video frame does not (she is lit, the field is black).
  window.__sigOf = (d, W, H) => {
    const a = new Float32Array(SIG * SIG), v = new Float32Array(SIG * SIG);
    const bx = W / SIG, by = H / SIG;
    let alphaVaries = false;
    for (let y = 0; y < SIG; y++) for (let x = 0; x < SIG; x++) {
      let sa = 0, sv = 0, cnt = 0;
      for (let yy = Math.floor(y * by); yy < Math.floor((y + 1) * by); yy += 3)
        for (let xx = Math.floor(x * bx); xx < Math.floor((x + 1) * bx); xx += 3) {
          const j = ((yy * W + xx) << 2);
          const al = d[j + 3] / 255;
          if (al < 0.97) alphaVaries = true;
          sa += al;
          sv += (0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) / 255 * (al || 1);
          cnt++;
        }
      a[y * SIG + x] = cnt ? sa / cnt : 0;
      v[y * SIG + x] = cnt ? sv / cnt : 0;
    }
    return { a, v, keyed: alphaVaries };
  };
  window.__dist = (p, q) => {
    const keyed = p.keyed && q.keyed;
    let d2 = 0, on = 0;
    for (let i = 0; i < SIG * SIG; i++) {
      const cov = keyed ? Math.max(p.a[i], q.a[i]) : Math.max(p.v[i], q.v[i]);
      if (cov < 0.02) continue;                 // black field on both: not subject
      d2 += (keyed ? Math.abs(p.a[i] - q.a[i]) * 0.5 : 0) + Math.abs(p.v[i] - q.v[i]);
      on += cov;
    }
    return on ? (d2 / on) * 100 : 0;
  };
};

(async () => {
  const argv = process.argv.slice(2);
  let MODE = 'auto', KIND = 'stills';
  let FROM = null, TO = null, WANT = 12, KEY = 12, files = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--from') FROM = parseFloat(argv[++i]);
    else if (argv[i] === '--to') TO = parseFloat(argv[++i]);
    else if (argv[i] === '--want') WANT = parseInt(argv[++i], 10);
    // --key N: the luminance distance (percent) that separates her from the
    // field, i.e. the same key tools/vidstrip.cjs will cut with (its thr/2.55).
    // A generator that paints a near-black floor under her is keyed above it,
    // and the gate must measure the take with the key that will actually cut it.
    else if (argv[i] === '--key') KEY = parseFloat(argv[++i]);
    else if (argv[i] === '--bg') MODE = 'bg';
    else if (argv[i] === '--cutout') MODE = 'cutout';
    else if (argv[i] === '--dir') {
      const d = argv[++i];
      files.push(...fs.readdirSync(d).filter(f => /\.(png|jpe?g|webp|mp4|webm)$/i.test(f))
        .map(f => path.join(d, f)));
    } else files.push(argv[i]);
  }
  if (!files.length) {
    console.error('usage: intake.cjs <clip|images...> [--from S --to S --want N --key PCT] [--dir folder]');
    process.exit(2);
  }
  const isVid = /\.(mp4|webm)$/i.test(files[0]);

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));
  await page.addInitScript(`const SIG=${SIG};(${pageScript})()`);
  await page.goto('http://127.0.0.1:8220/');
  await page.evaluate(`const SIG=${SIG};(${pageScript})()`);

  console.log('── intake — nothing is keyed until it passes\n');
  const faults = [];
  let verdictLines = [];

  if (isVid) {
    // the clip is served from the repo root, same arrangement vidstrip uses
    const base = path.basename(files[0]);
    const tmp = path.join(process.cwd(), base);
    let copied = false;
    if (!fs.existsSync(tmp)) { fs.copyFileSync(files[0], tmp); copied = true; }
    const r = await page.evaluate(async ({ src, FROM, TO, WANT, BAR, KEY }) => {
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.src = src;
      await new Promise((ok, no) => { v.onloadeddata = ok; v.onerror = () => no(new Error('cannot decode')); });
      const W = v.videoWidth, H = v.videoHeight, D = v.duration;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d', { willReadFrequently: true });
      const seek = (t) => new Promise(ok => { v.onseeked = ok; v.currentTime = t; });
      const t0 = FROM === null ? 0 : FROM, t1 = TO === null ? D : Math.min(TO, D);
      const STEP = 1 / 48;
      const cand = [];
      let field = null, cover = 0, edge = false;
      for (let t = t0; t <= t1 + 1e-6; t += STEP) {
        await seek(Math.min(D - 0.02, t));
        c.clearRect(0, 0, W, H); c.drawImage(v, 0, 0, W, H);
        const d = c.getImageData(0, 0, W, H).data;
        cand.push({ t, sig: window.__sigOf(d, W, H) });
        if (field === null) {
          // the border, as the key will see it
          const bl = [];
          for (let x = 0; x < W; x += 5) for (const y of [0, H - 1]) {
            const j = ((y * W + x) << 2);
            bl.push((0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) / 2.55);
          }
          for (let y = 0; y < H; y += 5) for (const x of [0, W - 1]) {
            const j = ((y * W + x) << 2);
            bl.push((0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) / 2.55);
          }
          const m = bl.reduce((a, b) => a + b, 0) / bl.length;
          field = { lum: +m.toFixed(1), sd: +Math.sqrt(bl.reduce((a, b) => a + (b - m) ** 2, 0) / bl.length).toFixed(1) };
          // and how much of the picture she is, plus whether she touches the rim
          // THE SUBJECT IS WHAT DIFFERS FROM THE FIELD, IN EITHER DIRECTION.
          // Testing for "brighter than the border" assumes a black field, and
          // the first clip this tool was pointed at came back on a WHITE one —
          // so it reported a character filling a quarter of the frame as 0.1%
          // of it, and would have refused a good take for the wrong reason.
          let on = 0;
          const lit = (x, y) => { const j = ((y * W + x) << 2);
            return Math.abs((0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) / 2.55 - m) > KEY; };
          for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (lit(x, y)) on++;
          cover = on / ((W / 3) * (H / 3));
          for (let x = 0; x < W; x += 3)
            if (lit(x, 2) || lit(x, H - 3)) edge = true;
          for (let y = 0; y < H; y += 3)
            if (lit(2, y) || lit(W - 3, y)) edge = true;
        }
      }
      // greedy content selection at a falling threshold, exactly as the cutter does
      let best = { n: 0, thr: 0 };
      for (let thr = 6; thr >= 1; thr -= 0.5) {
        let n = 1, last = cand[0].sig;
        for (let i = 1; i < cand.length; i++)
          if (window.__dist(last, cand[i].sig) >= thr) { n++; last = cand[i].sig; }
        if (n >= WANT) { best = { n, thr }; break; }
        if (n > best.n) best = { n, thr };
      }
      // ...and how much of the clip is actually still
      let still = 0;
      for (let i = 1; i < cand.length; i++)
        if (window.__dist(cand[i - 1].sig, cand[i].sig) < BAR.same) still++;
      return { W, H, D: +D.toFixed(2), window: [t0, +t1.toFixed(2)],
               distinct: best.n, thr: best.thr,
               stillPct: +(still / (cand.length - 1) * 100).toFixed(0),
               field, cover: +cover.toFixed(3), edge, steps: cand.length };
    }, { src: 'http://127.0.0.1:8220/' + base, FROM, TO, WANT, BAR, KEY });
    if (copied) fs.unlinkSync(tmp);

    console.log('  clip        ' + path.basename(files[0]) + '   ' + r.W + 'x' + r.H + '  ' + r.D + 's');
    console.log('  window      ' + r.window[0] + ' – ' + r.window[1] + 's   (' + r.steps + ' moments looked at)');
    console.log('  DISTINCT    ' + r.distinct + ' different pictures, found at a ' + r.thr + '% selector');
    console.log('  still       ' + r.stillPct + '% of the clip is the same picture as the moment before it');
    console.log('  field       border luminance ' + r.field.lum + ', variation ' + r.field.sd + (KEY !== 12 ? '   (keyed at ' + KEY + '%)' : ''));
    console.log('  subject     ' + (r.cover * 100).toFixed(1) + '% of frame' + (r.edge ? '   TOUCHES THE BORDER' : ''));
    console.log('');
    if (r.distinct < BAR.minDistinct) faults.push('distinct');
    if (r.thr < BAR.minThreshold) faults.push('threshold');
    if (r.field.sd > BAR.fieldSd) faults.push('field');
    if (r.edge) faults.push('edge');
    if (r.cover < BAR.minCover) faults.push('cover');
    verdictLines = [
      (r.distinct >= BAR.minDistinct ? 'ok  ' : 'FAIL') + ' holds at least ' + BAR.minDistinct + ' different pictures  (' + r.distinct + ')',
      (r.thr >= BAR.minThreshold ? 'ok  ' : 'FAIL') + ' ...without lowering the selector under ' + BAR.minThreshold + '%  (' + r.thr + ')',
      (r.field.sd <= BAR.fieldSd ? 'ok  ' : 'FAIL') + ' the field behind her is flat enough to key  (variation ' + r.field.sd + ')',
      (!r.edge ? 'ok  ' : 'FAIL') + ' her silhouette does not touch the border',
      (r.cover >= BAR.minCover ? 'ok  ' : 'FAIL') + ' she is big enough in frame  (' + (r.cover * 100).toFixed(1) + '%)',
    ];
  } else {
    // A SET OF STILLS: every one has to differ from every OTHER, not just from
    // its neighbour — a batch that came back with two near-identical poses is
    // the same defect wearing a different hat.
    const r = await page.evaluate(async ({ files, BAR, KEY }) => {
      const sigs = [], meta = [];
      for (const f of files) {
        const im = new Image();
        const ext = f.split('.').pop().toLowerCase();
        im.src = 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + await window.bytes(f);
        await im.decode();
        const W = im.naturalWidth, H = im.naturalHeight;
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const c = cv.getContext('2d', { willReadFrequently: true });
        c.drawImage(im, 0, 0);
        const d = c.getImageData(0, 0, W, H).data;
        sigs.push(window.__sigOf(d, W, H));
        const bl = [];
        for (let x = 0; x < W; x += 5) for (const y of [0, H - 1]) {
          const j = ((y * W + x) << 2);
          bl.push((0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) / 2.55);
        }
        const m = bl.reduce((a, b) => a + b, 0) / bl.length;
        const sd = Math.sqrt(bl.reduce((a, b) => a + (b - m) ** 2, 0) / bl.length);
        let on = 0, edge = false;
        // either direction: see the note in the clip branch
        const lit = (x, y) => { const j = ((y * W + x) << 2);
          return Math.abs((0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) / 2.55 - m) > KEY; };
        for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (lit(x, y)) on++;
        for (let x = 0; x < W; x += 3) if (lit(x, 2) || lit(x, H - 3)) edge = true;
        for (let y = 0; y < H; y += 3) if (lit(2, y) || lit(W - 3, y)) edge = true;
        // ...and the three numbers a BACKDROP is judged on. Sampled on a grid
        // rather than every pixel: at this resolution the percentiles move by
        // less than a unit and the whole set measures in under a second.
        const lum = [];
        let satSum = 0, satN = 0;
        for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) {
          const j = ((y * W + x) << 2), R = d[j], G = d[j + 1], B = d[j + 2];
          lum.push(0.299 * R + 0.587 * G + 0.114 * B);
          const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
          satSum += mx ? (mx - mn) / mx * 100 : 0; satN++;
        }
        lum.sort((a, b) => a - b);
        const q = t => lum[Math.floor(t * (lum.length - 1))];
        meta.push({ W, H, fieldSd: +sd.toFixed(1), fieldLum: +m.toFixed(1),
                    cover: +(on / ((W / 3) * (H / 3))).toFixed(3), edge,
                    range: Math.round(q(0.95) - q(0.05)), median: Math.round(q(0.5)),
                    sat: Math.round(satSum / satN) });
      }
      const pairs = [];
      for (let i = 0; i < sigs.length; i++)
        for (let j = i + 1; j < sigs.length; j++)
          pairs.push({ i, j, d: +window.__dist(sigs[i], sigs[j]).toFixed(1) });
      pairs.sort((a, b) => a.d - b.d);
      return { meta, pairs: pairs.slice(0, 6), worst: pairs[0] };
    }, { files: files.map(f => path.resolve(f)), BAR, KEY });

    // WHICH KIND OF PICTURE IS THIS, and why the caller has to say.
    //
    // A cutout is a subject on a keyable field with clear space around it; a
    // backdrop fills the frame and has no field at all. They fail in opposite
    // ways — touching the border is fatal to one and definitional to the other
    // — so the wrong mode produces a confident wrong verdict, which is the one
    // thing a gate must never do.
    //
    // The first attempt inferred it, and inferred it wrong: these backdrops are
    // painted dark at the edges, so their borders measure as flat and keyable
    // (fieldSd 3.4 to 8.9) and every one of them read as a cutout. There is no
    // measurement here that separates "dark vignette" from "black field"
    // reliably, so the tool does not pretend there is. It asks, once, in one
    // word, and then it is certain.
    if (MODE === 'auto') {
      console.log('  Say which kind of picture these are — the two are judged on');
      console.log('  opposite rules and guessing wrong gives a confident wrong answer:');
      console.log('');
      console.log('    --cutout   a character or object on a flat field, to be keyed out');
      console.log('    --bg       a full-frame backdrop or wallpaper');
      console.log('');
      await browser.close();
      process.exit(2);
    }
    const bg = MODE === 'bg';
    console.log('  reading these as ' + (bg
      ? 'BACKDROPS — they fill the frame, so they are judged on staged depth'
      : 'CUTOUTS — a subject on a keyable field'));
    console.log('');

    files.forEach((f, i) => {
      const m = r.meta[i];
      console.log('  ' + path.basename(f).padEnd(28) + m.W + 'x' + m.H + (bg
        ? '  range ' + String(m.range).padStart(4) + '  median ' + String(m.median).padStart(4)
          + '  colour ' + String(m.sat).padStart(3) + '%'
        : '  field ' + String(m.fieldLum).padStart(5) + '/' + String(m.fieldSd).padStart(5)
          + '  subject ' + (m.cover * 100).toFixed(1) + '%' + (m.edge ? '  TOUCHES BORDER' : '')));
    });
    console.log('');
    console.log('  closest pairs (% different):');
    for (const p of r.pairs)
      console.log('    ' + path.basename(files[p.i]) + '  vs  ' + path.basename(files[p.j]) + '   ' + p.d + '%');
    console.log('');
    const dup = r.worst && r.worst.d < BAR.same * 2;
    if (dup) faults.push('distinct');
    const some = (k, f) => r.meta.some(m => f(m[k]));
    if (bg) {
      if (some('range', v => v < BAR.bgRange)) faults.push('flat');
      if (some('median', v => v < BAR.bgMedian)) faults.push('dark');
      if (some('sat', v => v < BAR.bgSat)) faults.push('grey');
      verdictLines = [
        (!dup ? 'ok  ' : 'FAIL') + ' every plate differs from every other  (closest '
          + (r.worst ? r.worst.d : '—') + '%)',
        (!some('range', v => v < BAR.bgRange) ? 'ok  ' : 'FAIL')
          + ' every plate is staged in depth  (needs range ' + BAR.bgRange + ')',
        (!some('median', v => v < BAR.bgMedian) ? 'ok  ' : 'FAIL')
          + ' none is already too dark to grade  (needs median ' + BAR.bgMedian + ')',
        (!some('sat', v => v < BAR.bgSat) ? 'ok  ' : 'FAIL')
          + ' none has faded to grey  (needs colour ' + BAR.bgSat + '%)',
      ];
    } else {
      if (some('fieldSd', v => v > BAR.fieldSd)) faults.push('field');
      if (some('edge', v => v)) faults.push('edge');
      if (some('cover', v => v < BAR.minCover)) faults.push('cover');
      verdictLines = [
        (!dup ? 'ok  ' : 'FAIL') + ' every image differs from every other  (closest '
          + (r.worst ? r.worst.d : '—') + '%)',
        (!some('fieldSd', v => v > BAR.fieldSd) ? 'ok  ' : 'FAIL') + ' every field is flat enough to key',
        (!some('edge', v => v) ? 'ok  ' : 'FAIL') + ' no silhouette touches the border',
        (!some('cover', v => v < BAR.minCover) ? 'ok  ' : 'FAIL') + ' every subject is big enough in frame',
      ];
    }
    KIND = bg ? 'plates' : 'stills';
  }

  for (const l of verdictLines) console.log('  ' + l);
  console.log('');
  await browser.close();

  if (faults.length) {
    console.log('REFUSED — this does not go into the game.\n');
    console.log(refireBrief(isVid ? 'clip' : KIND, faults));
    process.exit(1);
  }
  console.log('ACCEPTED — measured clean. Cut it with tools/vidstrip.cjs auto:N and');
  console.log('re-measure the strip with tools/framedupe.cjs before keying.');
})();
