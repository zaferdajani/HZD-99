// GRAVEHORN'S PARTS: the design plate and the body/heads sheet -> ten rig plates + their anchor rows.
//
// The rig (js/gravehorn.js) draws each part "contained in its box, pivot pinned" (ghPart). So a part
// is finished when three things are true of its plate: it is cut clean, it is turned the way the rig's
// own stand-in is turned (a leg runs straight DOWN from its joint, a horn stands up off its collar),
// and its pivot is where the rig's joint is. All three are done here, from named points on the
// masters, and the anchor row each part needs is PRINTED — no number in GH_BOX is typed by eye.
//
//   node tools/ghparts.cjs [srcDir] [outDir]
//     srcDir  assets/source/gravehorn   (design.webp, sheet_a.webp)
//     outDir  assets/characters/gravehorn
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SRC = process.argv[2] || path.join(__dirname, '..', 'assets', 'source', 'gravehorn');
const OUT = process.argv[3] || path.join(__dirname, '..', 'assets', 'characters', 'gravehorn');
const PX = 4;                       // plate pixels per rig unit
// Each part: which master, the region that is the part (a polygon and/or circles, in master px),
// its PIVOT, and how it is scaled and turned:
//   axis: [toX, toY, units]  the master point that must end up `units` straight below the pivot (legs,
//                            tail) or, with `up`, straight above it leaning as the stand-in leans
//   pin:  two master points and the rig coordinates they must land on (the head: its two sockets)
//   fit:  uniform scale so the cut is `w` rig units wide, centred on a rig point (the body)
const PARTS = {
  body: { src: 'sheet_a', rect: [60, 400, 1290, 1120], fit: { w: 183, cx: 1.5, cy: -9 } },
  head: { src: 'sheet_a', rect: [1362, 547, 1934, 1047], pin: { a: [1445, 718], b: [1602, 645], A: [-72, -12], B: [-50, -24] }, mark: { eye: [1654, 744] } },
  head_roar: { src: 'sheet_a', rect: [2053, 548, 2626, 1185], pin: { a: [2136, 718], b: [2293, 645], A: [-72, -12], B: [-50, -24] }, mark: { eye: [2342, 741] } },
  horn_big: { src: 'design', poly: [[33, 216], [56, 236], [132, 292], [250, 400], [402, 548], [440, 560], [464, 600], [456, 642], [345, 716], [268, 750], [245, 706], [163, 546], [95, 405], [40, 290]], pivot: [352, 668], axis: [33, 222, 61.5], lean: -18.4 },
  horn_small: { src: 'design', poly: [[370, 298], [388, 312], [458, 372], [522, 442], [548, 445], [556, 486], [445, 530], [430, 478], [392, 380]], pivot: [492, 498], axis: [372, 302, 31], lean: -14.9 },
  // (the near foreleg is whole and in front of everything in the design; the hind leg stands behind
  // the far one there and cannot be cut clean — and it is the same machined leg, so it is the same plate)
  fleg_up: { src: 'design', circles: [[1085, 700, 112]], poly: [[1037, 760], [1182, 836], [1180, 1002], [1112, 1052], [1032, 1040], [962, 1056], [906, 1042], [864, 990], [950, 810]], pivot: [1085, 700], axis: [1035, 1105, 42] },
  fleg_low: { src: 'design', circles: [[1035, 1105, 87]], poly: [[878, 1150], [1000, 1105], [1128, 1105], [1140, 1300], [1130, 1350], [985, 1348], [858, 1336], [850, 1256]], pivot: [1035, 1105], axis: [1000, 1424, 40] },
  hleg_up: { src: 'design', circles: [[1085, 700, 112]], poly: [[1037, 760], [1182, 836], [1180, 1002], [1112, 1052], [1032, 1040], [962, 1056], [906, 1042], [864, 990], [950, 810]], pivot: [1085, 700], axis: [1035, 1105, 42], wide: 1.12 },
  hleg_low: { src: 'design', circles: [[1035, 1105, 87]], poly: [[878, 1150], [1000, 1105], [1128, 1105], [1140, 1300], [1130, 1350], [985, 1348], [858, 1336], [850, 1256]], pivot: [1035, 1105], axis: [1000, 1424, 40] },
  // THE HOOF IS ITS OWN PLATE: the rig plants it level on the floor while the shin above it swings
  // (drawGravehorn), and a hoof baked onto the shin would stand on its toes at every stride
  hoof: { src: 'design', poly: [[735, 1466], [735, 1384], [800, 1332], [858, 1330], [985, 1342], [1130, 1344], [1144, 1400], [1144, 1466]], pivot: [1000, 1424], fixed: 0.1246 },
  tail: { src: 'design', poly: [[2332, 502], [2366, 464], [2442, 478], [2502, 558], [2518, 624], [2562, 660], [2550, 774], [2518, 778], [2455, 708], [2440, 642], [2392, 562], [2342, 524]], pivot: [2352, 486], axis: [2538, 770, 32] },
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const data = {}; for (const k of ['design', 'sheet_a']) data[k] = fs.readFileSync(path.join(SRC, k + '.webp')).toString('base64');
  const R = await p.evaluate(async ({ data, PARTS, PX }) => {
    const img = {}; for (const k in data) { const i = new Image(); i.src = 'data:image/webp;base64,' + data[k]; await i.decode(); img[k] = i; }
    const out = {};
    for (const name in PARTS) {
      const P = PARTS[name], im = img[P.src];
      // 1. the cut, in master px, on its own canvas
      const cut = Object.assign(document.createElement('canvas'), { width: im.naturalWidth, height: im.naturalHeight }), cx = cut.getContext('2d');
      cx.beginPath();
      if (P.rect) cx.rect(P.rect[0], P.rect[1], P.rect[2] - P.rect[0], P.rect[3] - P.rect[1]);
      if (P.poly) { cx.moveTo(P.poly[0][0], P.poly[0][1]); for (const q of P.poly.slice(1)) cx.lineTo(q[0], q[1]); cx.closePath(); }
      for (const ci of (P.circles || [])) { cx.moveTo(ci[0] + ci[2], ci[1]); cx.arc(ci[0], ci[1], ci[2], 0, 7); }
      cx.clip('nonzero'); cx.drawImage(im, 0, 0);
      // 2. scale (rig units per master px), rotation, and the pivot in master px
      let s, rot = 0, piv, at = [0, 0];
      if (P.fit) {
        const d = cx.getImageData(0, 0, cut.width, cut.height).data; let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0;
        for (let y = P.rect[1]; y < P.rect[3]; y++) for (let x = P.rect[0]; x < P.rect[2]; x++) if (d[(y * cut.width + x) * 4 + 3] > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        s = P.fit.w / (x1 - x0 + 1); piv = [(x0 + x1) / 2, (y0 + y1) / 2]; at = [P.fit.cx, P.fit.cy];
      } else if (P.pin) {
        const v = [P.pin.b[0] - P.pin.a[0], P.pin.b[1] - P.pin.a[1]], V = [P.pin.B[0] - P.pin.A[0], P.pin.B[1] - P.pin.A[1]];
        s = Math.hypot(V[0], V[1]) / Math.hypot(v[0], v[1]); rot = Math.atan2(V[1], V[0]) - Math.atan2(v[1], v[0]); piv = P.pin.a; at = P.pin.A;
      } else if (P.fixed) { s = P.fixed; piv = P.pivot;
      } else {
        const v = [P.axis[0] - P.pivot[0], P.axis[1] - P.pivot[1]];
        s = P.axis[2] / Math.hypot(v[0], v[1]); piv = P.pivot;
        // legs and the tail hang straight DOWN from the joint; a horn stands UP, leaning as its stand-in does
        const want = P.lean != null ? (-Math.PI / 2 + P.lean * Math.PI / 180) : Math.PI / 2;
        rot = want - Math.atan2(v[1], v[0]);
      }
      // 3. drawn into rig space at PX px per unit, the pivot's rig point at a known canvas spot
      const M = 300 * PX, cv = Object.assign(document.createElement('canvas'), { width: M * 2, height: M * 2 }), x = cv.getContext('2d');
      x.imageSmoothingQuality = 'high';
      x.translate(M + at[0] * PX, M + at[1] * PX); if (P.wide) x.scale(P.wide, 1); x.rotate(rot); x.scale(s * PX, s * PX); x.translate(-piv[0], -piv[1]);
      x.drawImage(cut, 0, 0);
      const d = x.getImageData(0, 0, cv.width, cv.height).data; let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0;
      for (let y = 0; y < cv.height; y++) for (let xx = 0; xx < cv.width; xx++) if (d[(y * cv.width + xx) * 4 + 3] > 24) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const w = x1 - x0 + 1, h = y1 - y0 + 1, o = Object.assign(document.createElement('canvas'), { width: w, height: h });
      o.getContext('2d').drawImage(cv, -x0, -y0);
      const box = { x: +((x0 - M) / PX).toFixed(1), y: +((y0 - M) / PX).toFixed(1), w: +(w / PX).toFixed(1), h: +(h / PX).toFixed(1) };
      box.ax = +(-box.x / box.w).toFixed(4); box.ay = +(-box.y / box.h).toFixed(4);
      const marks = {};
      for (const mk in (P.mark || {})) { const q = P.mark[mk], dx = (q[0] - piv[0]) * s, dy = (q[1] - piv[1]) * s;
        marks[mk] = [+(at[0] + dx * Math.cos(rot) - dy * Math.sin(rot)).toFixed(1), +(at[1] + dx * Math.sin(rot) + dy * Math.cos(rot)).toFixed(1)]; }
      out[name] = { box, marks, deg: +(rot * 180 / Math.PI).toFixed(1), scale: +s.toFixed(4), url: o.toDataURL('image/webp', 0.92) };
    }
    return out;
  }, { data, PARTS, PX });
  fs.mkdirSync(OUT, { recursive: true });
  for (const k in R) { fs.writeFileSync(path.join(OUT, k + '.webp'), Buffer.from(R[k].url.split(',')[1], 'base64'));
    console.log('  ' + k + ': ' + JSON.stringify(R[k].box).replace(/"/g, '') + ',' + '   // turned ' + R[k].deg + '°, ' + R[k].scale + ' units/px' + (Object.keys(R[k].marks).length ? ', ' + JSON.stringify(R[k].marks) : '')); }
  await b.close();
})();
