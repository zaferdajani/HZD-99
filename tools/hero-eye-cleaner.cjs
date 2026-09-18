async function cleanHeroEyes({b64,EYE,NAMES,PAD=1.35}) {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const N = NAMES.length, CW = im.naturalWidth / N, CH = im.naturalHeight;
    const cv = document.createElement('canvas');
    cv.width = im.naturalWidth; cv.height = CH;
    const c = cv.getContext('2d');
    c.drawImage(im, 0, 0);
    const img = c.getImageData(0, 0, cv.width, CH), d = img.data;
    const W = cv.width;
    const at = (x, y) => ((y * W + x) << 2);
    const report = [];

    for (let i = 0; i < N; i++) {
      const E = EYE[NAMES[i]]; if (!E) continue;
      const x0 = i * CW;
      // the two eyes, in cell pixels
      const eyes = [[E.lx, E.ly], [E.rx, E.ry]].map(([nx, ny]) => ({
        cx: x0 + nx * CW, cy: ny * CH,
        rx: (E.ew * CW * 0.5) * PAD, ry: (E.eh * CH * 0.5) * PAD,
      }));
      // sample the visor's own dark from an annulus just outside both eyes,
      // ignoring anything still bright (that would be the other eye)
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (const e of eyes) {
        for (let a = 0; a < 32; a++) {
          const th = a / 32 * Math.PI * 2;
          const px = Math.round(e.cx + Math.cos(th) * e.rx * 1.45);
          const py = Math.round(e.cy + Math.sin(th) * e.ry * 1.45);
          if (px < x0 || px >= x0 + CW || py < 0 || py >= CH) continue;
          const q = at(px, py);
          if (d[q + 3] < 200) continue;
          const lum = d[q] * 0.3 + d[q + 1] * 0.59 + d[q + 2] * 0.11;
          if (lum > 90) continue;                  // still an eye-light, skip
          sr += d[q]; sg += d[q + 1]; sb += d[q + 2]; n++;
        }
      }
      const fill = n > 6 ? [sr / n, sg / n, sb / n] : [26, 24, 30];
      let painted = 0;
      for (const e of eyes) {
        const ax = Math.ceil(e.rx), ay = Math.ceil(e.ry);
        for (let y = Math.floor(e.cy - ay); y <= e.cy + ay; y++) {
          for (let x = Math.floor(e.cx - ax); x <= e.cx + ax; x++) {
            if (x < x0 || x >= x0 + CW || y < 0 || y >= CH) continue;
            const dx = (x - e.cx) / e.rx, dy = (y - e.cy) / e.ry;
            const r2 = dx * dx + dy * dy;
            if (r2 > 1) continue;
            const q = at(x, y);
            if (d[q + 3] < 8) continue;            // never paint into the cut-out
            // feather the last 20% so the patch has no hard rim
            const t = r2 < 0.64 ? 1 : (1 - r2) / 0.36;
            d[q]     = d[q]     * (1 - t) + fill[0] * t;
            d[q + 1] = d[q + 1] * (1 - t) + fill[1] * t;
            d[q + 2] = d[q + 2] * (1 - t) + fill[2] * t;
            painted++;
          }
        }
      }
      report.push({ name: NAMES[i], painted, fill: fill.map(v => Math.round(v)) });
    }
    c.putImageData(img, 0, 0);
    return { png: cv.toDataURL('image/png'), webp: cv.toDataURL('image/webp', .95), report };
}
module.exports={cleanHeroEyes};
