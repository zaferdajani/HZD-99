// bake3d: any authored GLB comes out as a game-legal turnaround sheet.
//
// The fixture is a two-box "creature" built as a real binary glTF here in the
// harness — deep in Z with a head offset forward, deliberately asymmetric so a
// bake that mirrors or flips instead of ROTATING cannot pass. What is measured
// is the art bible, not the tool's opinion of itself:
//
//   - all 8 cells populated (a declared angle that renders nothing is §2)
//   - feet on the same row in every cell, exactly (§3.4 ground truth)
//   - profile vs front silhouette IoU under the §3.3 ceiling of 0.86
//   - col 0 vs col 4 differ: a rotation reads differently left and right;
//     a mirror flip would make them identical and re-flatten the volume
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

function fixtureGLB(out) {
  const pos = [], nrm = [], idx = [];
  function box(cx, cy, cz, sx, sy, sz) {
    const base = pos.length / 3;
    const faces = [
      [[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]],
      [[-1, 0, 0], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]]],
      [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]],
      [[0, -1, 0], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]]],
      [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]],
      [[0, 0, -1], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]]],
    ];
    faces.forEach(([n, corners], f) => {
      const b = base + f * 4;
      corners.forEach(([x, y, z]) => {
        pos.push(cx + x * sx / 2, cy + y * sy / 2, cz + z * sz / 2);
        nrm.push(n[0], n[1], n[2]);
      });
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
  }
  box(0, 0.4, 0, 0.6, 0.8, 1.6);
  box(0, 1.0, 0.9, 0.5, 0.5, 0.5);
  const posArr = new Float32Array(pos), nrmArr = new Float32Array(nrm), idxArr = new Uint16Array(idx);
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) {
    mn[a] = Math.min(mn[a], pos[i + a]); mx[a] = Math.max(mx[a], pos[i + a]);
  }
  const pad4z = (b) => Buffer.concat([b, Buffer.alloc((4 - b.length % 4) % 4)]);
  const bufPos = Buffer.from(posArr.buffer), bufNrm = Buffer.from(nrmArr.buffer), bufIdx = pad4z(Buffer.from(idxArr.buffer));
  // ...AND ONE ANIMATION, so the clip mode has something to measure: over one
  // second the creature travels two units in X (root motion, which the bake
  // must strip) and bobs 0.3 up and back (vertical, which it must keep)
  const tArr = new Float32Array([0, 0.5, 1.0]);
  const vArr = new Float32Array([0, 0, 0, 1, 0.3, 0, 2, 0, 0]);
  const bufT = Buffer.from(tArr.buffer), bufV = Buffer.from(vArr.buffer);
  const bin = Buffer.concat([bufPos, bufNrm, bufIdx, bufT, bufV]);
  const json = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: 'root' }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.75, 0.45, 0.2, 1], metallicFactor: 0.3, roughnessFactor: 0.55 } }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: bufPos.length },
      { buffer: 0, byteOffset: bufPos.length, byteLength: bufNrm.length },
      { buffer: 0, byteOffset: bufPos.length + bufNrm.length, byteLength: bufIdx.length },
      { buffer: 0, byteOffset: bufPos.length + bufNrm.length + bufIdx.length, byteLength: bufT.length },
      { buffer: 0, byteOffset: bufPos.length + bufNrm.length + bufIdx.length + bufT.length, byteLength: bufV.length },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: posArr.length / 3, type: 'VEC3', min: mn, max: mx },
      { bufferView: 1, componentType: 5126, count: nrmArr.length / 3, type: 'VEC3' },
      { bufferView: 2, componentType: 5123, count: idxArr.length, type: 'SCALAR' },
      { bufferView: 3, componentType: 5126, count: 3, type: 'SCALAR', min: [0], max: [1.0] },
      { bufferView: 4, componentType: 5126, count: 3, type: 'VEC3' },
    ],
    animations: [{
      name: 'bob_and_travel',
      samplers: [{ input: 3, output: 4, interpolation: 'LINEAR' }],
      channels: [{ sampler: 0, target: { node: 0, path: 'translation' } }],
    }],
  };
  const jraw = Buffer.from(JSON.stringify(json));
  // the glTF spec pads the JSON chunk with SPACES; zero bytes break parsers
  const jbuf = Buffer.concat([jraw, Buffer.alloc((4 - jraw.length % 4) % 4, 0x20)]);
  const hdr = Buffer.alloc(12), jc = Buffer.alloc(8), bc = Buffer.alloc(8);
  hdr.writeUInt32LE(0x46546c67, 0); hdr.writeUInt32LE(2, 4);
  hdr.writeUInt32LE(12 + 8 + jbuf.length + 8 + bin.length, 8);
  jc.writeUInt32LE(jbuf.length, 0); jc.writeUInt32LE(0x4e4f534a, 4);
  bc.writeUInt32LE(bin.length, 0); bc.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(out, Buffer.concat([hdr, jc, jbuf, bc, bin]));
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bake3d-'));
  const glb = path.join(dir, 'fixture.glb');
  fixtureGLB(glb);
  execFileSync('node', [path.join(__dirname, '..', 'tools', 'bake3d.cjs'),
    glb, 'fixture', '--cell=256', '--out=' + dir], { stdio: 'inherit', timeout: 240000 });

  const sheet = fs.readFileSync(path.join(dir, 'fixture_8yaw.png'));
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await br.newPage();
  const m = await p.evaluate(async (b64) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const W = im.naturalWidth, H = im.naturalHeight, cw = W / 8;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const cells = [];
    for (let c = 0; c < 8; c++) {
      const d = x.getImageData(c * cw, 0, cw, H).data;
      let n = 0, foot = -1;
      const mask = new Uint8Array(cw * H);
      for (let y = 0; y < H; y++) for (let px = 0; px < cw; px++) {
        if (d[(y * cw + px) * 4 + 3] > 40) { n++; mask[y * cw + px] = 1; if (y > foot) foot = y; }
      }
      cells.push({ n, foot, mask });
    }
    const iou = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; } return i / u; };
    return {
      px: cells.map((c) => c.n), feet: cells.map((c) => c.foot),
      iou02: iou(cells[0].mask, cells[2].mask),
      iou04: iou(cells[0].mask, cells[4].mask),
    };
  }, sheet.toString('base64'));
  // ---- CLIP MODE: the animation becomes a strip, on the spot, with its bob ----
  // The fixture's clip walks two units sideways and bobs 0.3 up. What comes
  // out must hold its horizontal centre (root motion stripped), move its feet
  // (vertical kept), and be a sequence rather than one picture repeated.
  execFileSync('node', [path.join(__dirname, '..', 'tools', 'bake3d.cjs'),
    glb, 'fixture', '--clip=bob_and_travel', '--frames=6', '--cell=192', '--fps=12', '--out=' + dir],
    { stdio: 'inherit', timeout: 240000 });
  const strip = fs.readFileSync(path.join(dir, 'fixture_bob_and_travel_6.png'));
  const hasVideo = fs.existsSync(path.join(dir, 'fixture_bob_and_travel_12fps.webm'))
    && fs.statSync(path.join(dir, 'fixture_bob_and_travel_12fps.webm')).size > 2000;
  const s = await p.evaluate(async (b64) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const W = im.naturalWidth, H = im.naturalHeight, cw = W / 6;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const cells = [];
    for (let c = 0; c < 6; c++) {
      const d = x.getImageData(c * cw, 0, cw, H).data;
      let n = 0, foot = -1, sx = 0;
      const mask = new Uint8Array(cw * H);
      for (let y = 0; y < H; y++) for (let px = 0; px < cw; px++) {
        if (d[(y * cw + px) * 4 + 3] > 40) { n++; sx += px; mask[y * cw + px] = 1; if (y > foot) foot = y; }
      }
      cells.push({ n, foot, cx: n ? sx / n : -1, mask });
    }
    const iou = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; } return i / u; };
    return { px: cells.map((c) => c.n), feet: cells.map((c) => c.foot), cx: cells.map((c) => +c.cx.toFixed(1)),
             iou03: iou(cells[0].mask, cells[3].mask), cellW: cw };
  }, strip.toString('base64'));
  await br.close();
  fs.rmSync(dir, { recursive: true, force: true });

  const fails = [];
  const ok = (cond, what) => { console.log((cond ? '  ok  ' : '  FAIL ') + what); if (!cond) fails.push(what); };
  ok(m.px.every((n) => n > 500), 'all 8 yaw cells populated  [' + m.px.join(' ') + ']');
  ok(m.feet.every((f) => f === m.feet[0]), 'feet on one row in every cell  [' + m.feet.join(' ') + ']');
  ok(m.iou02 <= 0.86, 'profile vs front is a different silhouette  IoU ' + m.iou02.toFixed(3) + ' <= 0.86');
  ok(m.iou04 < 0.98, 'col 0 vs col 4 is a rotation, not a mirror  IoU ' + m.iou04.toFixed(3));
  const cxSpread = Math.max(...s.cx) - Math.min(...s.cx);
  const feetSpread = Math.max(...s.feet) - Math.min(...s.feet);
  ok(s.px.every((n) => n > 300), 'clip: all 6 cells populated  [' + s.px.join(' ') + ']');
  ok(cxSpread <= s.cellW * 0.02, 'clip: root motion stripped — horizontal centre holds  spread ' + cxSpread.toFixed(1) + ' px  [' + s.cx.join(' ') + ']');
  ok(feetSpread >= 4, 'clip: the vertical bob is kept — the feet move  spread ' + feetSpread + ' px  [' + s.feet.join(' ') + ']');
  ok(s.iou03 < 0.98, 'clip: cell 0 vs cell 3 is a different picture  IoU ' + s.iou03.toFixed(3));
  ok(hasVideo, 'clip: a driving video was written');
  if (fails.length) { console.log('FAILED: ' + fails.join(' | ')); process.exit(1); }
  console.log('bake3d: a mesh goes in, a game-legal turnaround comes out, measured');
})();
