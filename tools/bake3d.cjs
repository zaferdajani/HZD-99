// bake3d — ANY authored 3D model becomes a game-legal turnaround sheet.
//
//   node tools/bake3d.cjs <model.glb> <subject> [--class atlas|npc] [--cell 512]
//
// This is RULE ZERO applied to characters: the master is a real mesh (made in
// Higgsfield via generate_3d, or authored in any 3D tool the owner uses) and
// everything the game ships is DERIVED from it by this script. It generalizes
// what js/model3d.js did once, by hand, for the Driller — vendor-three.js and
// tools/vendor-gltf.js load the GLB in a headless page and render it exactly
// the way the roster atlas was rendered:
//
//   - locked ORTHOGRAPHIC camera, key light fixed to the WORLD, so a turn
//     reads as a volume rotating and never as a picture flipping (js/atlas.js)
//   - the SUBJECT rotates under the light, one yaw per column:
//       class atlas -> 8 columns, col 0 = 0° facing screen-right,
//                      col 2 = facing camera, col 4 = facing left, 5-7 = back
//       class npc   -> 6 columns, the ATLAS2 half-turn layout
//   - every cell is the same subject at the same scale from the same camera,
//     feet grounded on the cell floor (ART_BIBLE §3.4 — measured, not hoped)
//
// It emits assets/characters/<subject>_<n>yaw.png, archives the master GLB
// under assets/source/<subject>/ (§7: if it is not in that directory, it did
// not happen), and prints the wiring the integrator adds — the ATLAS.sub
// entry, the crush, the lowres tier. It does not wire anything itself: baking
// is mechanical, wiring is a decision.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flag = (name, dflt) => {
  const hit = process.argv.find((a) => a.startsWith('--' + name + '='));
  return hit ? hit.split('=')[1] : dflt;
};
const [glbPath, subject] = args;
if (!glbPath || !subject || !/^[a-z0-9_]+$/.test(subject)) {
  console.error('usage: node tools/bake3d.cjs <model.glb> <subject> [--class=atlas|npc] [--cell=512] [--pitch=0]');
  process.exit(1);
}
const cls = flag('class', 'atlas');
const CELL = parseInt(flag('cell', '512'), 10);
const PITCH = parseFloat(flag('pitch', '0'));       // camera tilt in degrees, if the subject wants one
const COLS = cls === 'npc' ? 6 : 8;
const ROOT = path.join(__dirname, '..');

(async () => {
  const glb = fs.readFileSync(glbPath);
  const three = fs.readFileSync(path.join(ROOT, 'js', 'vendor-three.js'), 'utf8');
  const gltf = fs.readFileSync(path.join(ROOT, 'tools', 'vendor-gltf.js'), 'utf8');

  const br = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    // the bake must not silently fall back to a software rasterizer with no
    // antialiasing — swiftshader is fine, but ask for GL explicitly
    args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
  });
  const p = await br.newPage({ viewport: { width: CELL * COLS, height: CELL } });
  p.on('pageerror', (e) => { console.error('page: ' + e); });
  await p.setContent('<canvas id="out" width="' + (CELL * COLS) + '" height="' + CELL + '"></canvas>');
  await p.addScriptTag({ content: three });
  await p.addScriptTag({ content: gltf });

  const dataURL = await p.evaluate(async ({ glbB64, COLS, CELL, PITCH }) => {
    const bin = Uint8Array.from(atob(glbB64), (c) => c.charCodeAt(0)).buffer;
    const gltf = await new Promise((res, rej) =>
      new THREE.GLTFLoader().parse(bin, '', res, rej));
    const model = gltf.scene;

    const scene = new THREE.Scene();
    scene.add(model);
    // the roster's light logic: ONE key, fixed to the world, from the upper
    // screen-left front (the game's key sits at -x — js/model3d.js), plus a
    // cool hemisphere fill so the shadow side keeps its color
    const key = new THREE.DirectionalLight(0xfff2d8, 2.4);
    key.position.set(-2.2, 3.0, 2.4);
    scene.add(key);
    scene.add(new THREE.HemisphereLight(0xa2bed6, 0x38291a, 0.9));

    // frame ONCE for all yaws: the widest the model gets while spinning is its
    // XZ diagonal, so a bounding sphere around the box gives one scale that
    // holds every column — same subject, same scale, same camera, per §4
    const box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    model.position.sub(c);                       // spin about the volume center
    const spinR = Math.hypot(sz.x, sz.z) / 2;    // worst-case half-width in yaw
    const margin = 1.12;
    const halfH = Math.max(sz.y / 2, spinR * 0.6) * margin;
    const halfW = Math.max(spinR, sz.y / 2 * 0.6) * margin;
    const half = Math.max(halfH, halfW);

    const cam = new THREE.OrthographicCamera(-half, half, half, -half, 0.01, 100);
    const pr = THREE.MathUtils.degToRad(PITCH);
    cam.position.set(0, Math.sin(pr) * 10, Math.cos(pr) * 10);
    cam.lookAt(0, 0, 0);
    // ground truth: feet on the cell floor. The model's min-Y sits a fixed
    // margin above the frame bottom in EVERY cell, so the game's foot line
    // (drawAtlas grounds at the cell floor) is the model's real feet
    const footPad = half * 0.06;
    model.position.y += (-half + footPad) - (box.min.y - c.y);

    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setSize(CELL, CELL);
    r.setClearColor(0x000000, 0);
    r.outputEncoding = THREE.sRGBEncoding;

    const sheet = document.getElementById('out');
    const x2d = sheet.getContext('2d');
    for (let col = 0; col < COLS; col++) {
      // atlas convention (js/atlas.js): column angle = col*45°, where 0° faces
      // screen-right and 90° faces the camera. glTF models author forward as
      // +Z (toward the camera at rotY 0), so rotY = 90° − col*45°. The npc
      // sheet is the same first six columns of the same convention.
      model.rotation.y = THREE.MathUtils.degToRad(90 - col * 45);
      r.render(scene, cam);
      x2d.drawImage(r.domElement, col * CELL, 0, CELL, CELL);
    }
    return sheet.toDataURL('image/png');
  }, { glbB64: glb.toString('base64'), COLS, CELL, PITCH });

  await br.close();

  const png = Buffer.from(dataURL.split(',')[1], 'base64');
  // --out=<dir> bakes somewhere else (the test harness uses it) and then the
  // archive step is skipped too: a bake outside assets/ is a rehearsal
  const outDir = flag('out', null);
  const outRel = outDir
    ? path.join(outDir, subject + '_' + COLS + 'yaw.png')
    : path.join('assets', 'characters', subject + '_' + COLS + 'yaw.png');
  fs.mkdirSync(path.dirname(outDir ? outRel : path.join(ROOT, outRel)), { recursive: true });
  fs.writeFileSync(outDir ? outRel : path.join(ROOT, outRel), png);

  if (!outDir) {
    // §7 — the archive rule: the master mesh lands in assets/source/ in the
    // same commit as the sheet derived from it, or the bake did not happen
    const srcDir = path.join(ROOT, 'assets', 'source', subject);
    fs.mkdirSync(srcDir, { recursive: true });
    fs.copyFileSync(glbPath, path.join(srcDir, subject + '.glb'));
  }

  const kb = (n) => (n / 1024).toFixed(0) + ' KB';
  console.log(outRel + '  ' + COLS + ' x 1 @ ' + CELL + 'px  ' + kb(png.length));
  if (!outDir) console.log('assets/source/' + subject + '/' + subject + '.glb archived  ' + kb(glb.length));
  console.log('\nwiring (the integrator adds, per ART_BIBLE §' + (cls === 'npc' ? '5' : '4') + '):');
  console.log('  1. add the row to the ' + (cls === 'npc' ? 'npcs' : 'roster') + " sheet, or register the sheet in js/media.js and declare it in ATLAS with sub: { " + subject + ": { row: 0, k: <hitbox-heights>, yOff: 0 } }");
  console.log('  2. node tools/img-crush.cjs on the source copy; node tools/lowres.cjs && node build.cjs');
  console.log('  3. node tests/run.cjs artbible lowres — declared art must be drawn, and sliced-by-pixel sheets get no small copy');
})();
