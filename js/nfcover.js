// ===========================================================================
// NULLFANG'S COVER — the metal banana clumps of his arena (A4).
//
// The owner, 2026-11-25: "create structures like green structure, leaves, or maybe banana
// leaves ... converted into metallic ... a place where the lion goes inside and hide and then
// comes attacking. These banana leaves can be distributed in the background but not faded as
// objects in the room of the fight. The lion can go inside, and the indication of the place it
// comes from is by watching the leaves moves."
//
// The art is generated (Higgsfield, 2026-11-25; masters in assets/source/nfcover/, cut by
// tools/nfcover.py): one clump plate per variant and six single leaves. A clump IN the room is
// the plate plus four of the leaves hung in front of its trunks, and every one of them is on a
// spring — the leaves are bent along their length band by band (a chain, so a leaf CURVES and
// whips back, it never turns as a stiff card), and the plate sways from its foot, more at its
// crown than at its roots. What moves them:
//   - the meadow's air, always, a little, never two leaves in step;
//   - whoever walks through: she brushes them aside, and so does he;
//   - HIS ENTRY: they part round him as he goes in and close behind him, swinging;
//   - THE TELL (js/nullfang-duel.js lurkwarn): the clump he is in thrashes, harder as it builds;
//   - HIS BURST: thrown open, the way he came out.
// The clumps in the room are drawn after the frame's grade, at full strength, between the
// bodies and her: he goes INTO them and she walks in front of them. They stand on the ground
// under their foot. A few more stand behind the level, on parallax, as the meadow beyond.
// No light, rim or outline round any of it (ledger); the plates passed tools/defringe.cjs.
// The springs are stepped where they are drawn, on the frame clock, like the grass
// (js/grass.js): nothing in the fight reads them — the fight's state (which clump, when) is
// the boss's, and this only draws it.
// ===========================================================================
const NF_COVER = Object.freeze({
  W: 290,                                        // a clump's width at scale 1, world px
  plate: { a: ['coverClumpA', 539 / 760], b: ['coverClumpB', 522 / 760] },
  // the six cut leaves: the stalk foot as a fraction of the cut's width, and its aspect
  leaf: [{ key: 'coverLeaf0', fx: 0.5065, ar: 102 / 360 }, { key: 'coverLeaf1', fx: 0.4789, ar: 91 / 360 },
         { key: 'coverLeaf2', fx: 0.1992, ar: 146 / 360 }, { key: 'coverLeaf3', fx: 0.1607, ar: 211 / 360 },
         { key: 'coverLeaf4', fx: 0.351, ar: 80 / 360 }, { key: 'coverLeaf5', fx: 0.4697, ar: 132 / 360 }],
  // the leaves hung in front of a clump's trunks, back to front: which leaf, its foot (x as a
  // fraction of the width from the centre, y as a fraction of the height above the foot), its
  // lean (rad, + = toward +x), its length (fraction of the height), mirrored or not
  slots: [[0, -0.03, 0.30, 0.28, 0.80, 0], [5, 0.02, 0.22, -0.12, 0.74, 0],
          [3, -0.06, 0.34, -0.62, 0.92, 1], [2, 0.07, 0.31, 0.56, 0.88, 0]],
  bands: 14, leafBands: 8,
  // springs: angle and bend of a leaf, the plate's sway (px at the crown)
  kA: 55, dA: 5.5, kB: 40, dB: 4.2, kS: 30, dS: 4,
});
const NFC = { room: null, list: [], back: [], last: 0, t: 0, rustleSnd: 0 };
function nfCoverOn() { return !(typeof isHero === 'function' && isHero()) && !!(G.roomDef && G.roomDef.cover); }
function nfCoverGround(x) {
  const gc = typeof groundColumnAt === 'function' ? groundColumnAt(x) : null;
  if (gc) return Math.min(gc[0], gc[1]);
  return (G.roomDef.h - 2) * TILE;
}
function nfCoverBuild() {
  NFC.room = G.roomId; NFC.list = []; NFC.back = [];
  if (!nfCoverOn()) return;
  const mk = (row, back) => {
    const [tx, s, pk, flip, par] = row, P = NF_COVER.plate[pk] || NF_COVER.plate.a, x = tx * TILE, w = NF_COVER.W * s, h = w * P[1];
    // its foot is the ground under it — the lowest of its middle, so no part of the heap floats
    let gy = -1e9;
    for (let q = -0.3; q <= 0.3001; q += 0.05) gy = Math.max(gy, nfCoverGround(x + q * w));
    return { x, gy, s, w, h, key: P[0], flip: !!flip, par: par || 1, ph: tx * 1.37,
             sw: 0, sv: 0, rust: 0, rustT: 0, rust0: 0,
             leaves: back ? [] : NF_COVER.slots.map((q, i) => ({ q, th: 0, tv: 0, be: 0, bv: 0, ph: tx + i * 2.1 })) };
  };
  for (const row of G.roomDef.cover || []) NFC.list.push(mk(row, false));
  for (const row of G.roomDef.coverBack || []) NFC.back.push(mk(row, true));
  if (typeof mediaFetch === 'function') {
    for (const k of ['coverClumpA', 'coverClumpB']) mediaFetch(k, true);
    for (const L of NF_COVER.leaf) mediaFetch(L.key, true);
  }
}
// the clumps standing in this room (rebuilt when the room changes)
function nfCoverList() {
  if (typeof G === 'undefined' || !G.roomDef) return [];
  if (NFC.room !== G.roomId) nfCoverBuild();
  return NFC.list;
}
// ---- what the fight asks of them (js/nullfang-duel.js) ------------------------------------
// the leaves give round a body going in: outward from where it enters, k of a full part
function nfCoverPart(cl, dir, k, delay) {
  for (const L of cl.leaves) {
    const side = Math.sign(L.q[3] + L.q[1] * 2) || 1;
    L.tv += side * 4.2 * k; L.bv += side * 5 * k - dir * 1.5 * k;
  }
  cl.sv += dir * 160 * k;
}
// THE TELL: thrash for `secs`, harder as it builds
function nfCoverRustle(cl, secs) { cl.rustT = secs; cl.rust0 = secs; }
// HIS BURST: thrown open, the way he went
function nfCoverBurst(cl, dir) {
  cl.rustT = 0;
  for (const L of cl.leaves) {
    const side = Math.sign(L.q[3] + L.q[1] * 2) || 1;
    L.tv += side * 6.5 + dir * 3; L.bv += side * 7 + dir * 4;
  }
  cl.sv += dir * 420;
  nfCoverRustleSound(1);
}
// the meadow's own recordings, scraped fast and layered: a clump of metal leaves shaking
function nfCoverRustleSound(v) {
  if (typeof playBuf !== 'function') return;
  playBuf(Math.random() < 0.5 ? 'hz_stepgrass1' : 'hz_stepgrass2', 0.42 * v, 0.85 + Math.random() * 0.5);
}
// ---- the springs, stepped on the frame clock ---------------------------------------------
function nfCoverStep(dt) {
  const C = NF_COVER, t = (NFC.t += dt);
  const b = G.boss && !G.boss.dead ? G.boss : null;
  // the bodies that brush through: hers, and his while he is drawn
  const bodies = [];
  if (typeof player !== 'undefined' && player && !player.dead) bodies.push(player);
  if (b && b.kind === 'glitch' && !(typeof nfHidden === 'function' && nfHidden(b))) bodies.push(b);
  for (const cl of NFC.list) {
    // the tell, read off the fight: the clump he is in, while he winds it up
    const telling = b && b.st === 'lurkwarn' && b.coverAt != null && NFC.list[b.coverAt] === cl;
    if (!telling) cl.rustT = 0;
    const amp = telling ? 0.55 + 0.45 * (1 - Math.max(0, b.t) / (cl.rust0 || 0.5)) : 0;
    cl.rust = amp;
    const wind = 0.6 * Math.sin(t * 0.7 + cl.ph) + 0.4 * Math.sin(t * 1.9 + cl.ph * 1.7);
    cl.sv += (-(cl.sw - wind * 4) * C.kS - cl.sv * C.dS) * dt;
    cl.sw += cl.sv * dt;
    if (amp > 0) cl.sv += (Math.random() - 0.5) * 1400 * amp * dt * 6;
    for (const L of cl.leaves) {
      const w = 0.035 * Math.sin(t * 0.8 + L.ph) + 0.02 * Math.sin(t * 2.3 + L.ph * 1.3);
      L.tv += (-(L.th - w) * C.kA - L.tv * C.dA) * dt;
      L.bv += (-(L.be - w * 0.8) * C.kB - L.bv * C.dB) * dt;
      if (amp > 0) { L.tv += (Math.random() - 0.5) * 55 * amp * dt * 4; L.bv += (Math.random() - 0.5) * 70 * amp * dt * 4; }
      // a body in the leaves pushes them aside, harder the faster it goes
      const lx = cl.x + L.q[1] * cl.w;
      for (const e of bodies) {
        const ex = e.x + e.w / 2;
        if (Math.abs(ex - cl.x) > cl.w * 0.5 || e.y > cl.gy || e.y + e.h < cl.gy - cl.h * 0.9) continue;
        const sp = Math.min(1, Math.abs(e.vx || 0) / 300) + 0.15;
        L.tv += Math.sign(lx - ex || 1) * sp * 9 * dt; L.bv += Math.sign(lx - ex || 1) * sp * 7 * dt;
      }
      L.th += L.tv * dt; L.be += L.bv * dt;
      L.th = clamp(L.th, -0.9, 0.9); L.be = clamp(L.be, -1.2, 1.2);
    }
    if (telling) {
      NFC.rustleSnd -= dt;
      if (NFC.rustleSnd <= 0) { NFC.rustleSnd = 0.11 - 0.05 * amp; nfCoverRustleSound(0.5 + 0.5 * amp); }
    }
  }
}
// ---- drawing ------------------------------------------------------------------------------
// the plate, in bands: each band shifted by the sway at its height (the roots stay put)
function nfCoverPlate(c, im, cl, jitter) {
  const C = NF_COVER, n = C.bands, iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
  const x0 = cl.x - cl.w / 2, y0 = cl.gy - cl.h, bh = cl.h / n, sh = ih / n, t = NFC.t;
  c.save();
  if (cl.flip) { c.translate(cl.x * 2, 0); c.scale(-1, 1); }
  const sgn = cl.flip ? -1 : 1;
  for (let i = 0; i < n; i++) {
    const u = 1 - (i + 0.5) / n;                       // height above the foot, 0..1
    let off = cl.sw * Math.pow(u, 1.6);
    // the shake is the whole crown at once, a little later the higher it is (a bend running
    // up the stems) — never each band on its own, which tears the picture
    if (jitter > 0) off += Math.sin(t * 34 - i * 0.22 + cl.ph) * 6 * jitter * Math.pow(u, 1.2);
    c.drawImage(im, 0, i * sh, iw, sh + 0.5, x0 + off * sgn, y0 + i * bh, cl.w, bh + 0.8);
  }
  c.restore();
}
// one leaf, as a chain of bands from its foot to its tip, each turned a little more (the bend)
function nfCoverLeaf(c, cl, L) {
  const C = NF_COVER, [li, fxr, fyr, lean, lenr, flip] = L.q, D = C.leaf[li];
  const im = typeof MEDIA_IMG !== 'undefined' ? MEDIA_IMG[D.key] : null;
  if (!im || !im.naturalWidth) return;
  const n = C.leafBands, iw = im.naturalWidth, ih = im.naturalHeight;
  const len = lenr * cl.h, wd = len * D.ar, seg = len / n, sh = ih / n;
  const sx = (flip ? -1 : 1) * (cl.flip ? -1 : 1);
  const crown = Math.pow(fyr, 1) * cl.sw * 0.8;                // the plate's sway carries its foot
  c.save();
  c.translate(cl.x + fxr * cl.w * (cl.flip ? -1 : 1) + crown * (cl.flip ? -1 : 1), cl.gy - fyr * cl.h);
  c.scale(sx, 1);
  // in the mirrored frame a lean to world +x is a lean to local -x
  let th = (lean * (cl.flip ? -1 : 1) + L.th) * sx;
  const db = L.be * sx / n;
  for (let i = 0; i < n; i++) {
    c.save(); c.rotate(th);
    c.drawImage(im, 0, ih - (i + 1) * sh, iw, sh + 0.5, -D.fx * wd, -seg - 0.9, wd, seg + 1.8);
    c.restore();
    c.translate(Math.sin(th) * seg, -Math.cos(th) * seg);
    th += db;
  }
  c.restore();
}
function nfCoverClock() {
  const now = performance.now() / 1000;
  const dt = Math.min(0.05, Math.max(0, now - (NFC.last || now))); NFC.last = now;
  return dt;
}
// the clumps IN the room: after the grade, before her (js/game.js drawWorldFrame)
function nfCoverDrawFront(c) {
  if (!nfCoverList().length) return;
  nfCoverStep(nfCoverClock());
  for (const cl of NFC.list) {
    const im = MEDIA_IMG[cl.key];
    if (!im || !im.naturalWidth) continue;
    nfCoverPlate(c, im, cl, cl.rust);
    for (const L of cl.leaves) nfCoverLeaf(c, cl, L);
  }
}
// ...and the meadow beyond, behind the level on parallax (js/game.js, after the flora)
function nfCoverDrawBack(c) {
  if (!nfCoverList().length && !NFC.back.length) return;
  const far = (typeof PAL !== 'undefined' && PAL[G.roomDef.zone] && PAL[G.roomDef.zone].far) || '#0b0d11';
  for (const cl of NFC.back) {
    const im0 = MEDIA_IMG[cl.key];
    if (!im0 || !im0.naturalWidth) continue;
    const im = typeof sceneryTint === 'function' ? sceneryTint(im0, far, 0.16) : im0;
    cl.sw = 3 * Math.sin(NFC.t * 0.6 + cl.ph);
    c.save();
    c.translate(camSX() * (1 - cl.par), camSY() * (1 - cl.par));
    nfCoverPlate(c, im, cl, 0);
    c.restore();
  }
}
// ---- THE CAMERA (js/engine.js updateCam) -----------------------------------------------------
// His fight is framed wider than every other (the encounter camera holds 1.05-1.52): the whole
// height of the room at 1.0, out to 0.88 when the two of them are far apart. Eased by the
// camera's own lerp, so it pulls out as the fight starts and back in after it — never a cut.
// Her body at 1.0 is two-thirds of its exploration size, and the HUD is drawn in screen space.
const NF_CAM = Object.freeze({ zoom: 1.0, far: 0.88, span: 1120 });
function nfCamZoom(b, dx) {
  if (!b || b.kind !== 'glitch' || typeof nfDuelOn !== 'function' || !nfDuelOn(b)) return 0;
  return clamp(NF_CAM.span / (dx + b.w / 2 + 300), NF_CAM.far, NF_CAM.zoom);
}
