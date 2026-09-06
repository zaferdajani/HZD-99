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
// ---- CLIP MODE: a rigged model's animation becomes a strip and a driving video
//
//   node tools/bake3d.cjs <rigged.glb> <subject> --clip=<name|index> [--frames=12] [--yaw=30] [--fps=24] [--out=dir]
//
// The owner's ruling (2026-09-05) after the movement study: her walk, run and
// attacks are fired one still at a time, so the frames between poses never
// existed and every plate chose its own camera. Higgsfield's generate_3d
// rigs a model and applies a clip from its 678-action library, and this mode
// is the other half — the clip is played here, from the HOUSE camera (the
// three-quarter profile of walk_a, facing screen-right), and cut two ways:
//
//   - a strip of N even samples, ready for HERO_GAIT / SWING_STRIP / HERO_TRANS
//   - a driving video of the whole clip at --fps, for motion-control video
//     generation with her canon plate as the subject: the rig supplies the
//     exact motion and camera, the video model supplies the painted look
//
// ROOT MOTION IS STRIPPED. A walk clip carries the body forward; a game plate
// runs on the spot and the physics moves it. Every node an animation track
// translates is pinned to its frame-0 X and Z, so the body treadmills while
// its VERTICAL travel — the bob of a walk, the flight of a run — is kept,
// because that is the part the stills never had.
const CLIP = flag('clip', null);
const FRAMES = parseInt(flag('frames', '12'), 10);
const YAW = parseFloat(flag('yaw', '30'));          // degrees from profile toward the camera
const FPS = parseInt(flag('fps', '24'), 10);
const MARGIN = parseFloat(flag('margin', '1.12'));   // frame headroom over the rest pose; raise it for a jump clip
const COLS = cls === 'npc' ? 6 : 8;
const ROOT = path.join(__dirname, '..');

(async () => {
  const glb = fs.readFileSync(glbPath);
  const three = fs.readFileSync(path.join(ROOT, 'js', 'vendor-three.js'), 'utf8');
  const gltf = fs.readFileSync(path.join(ROOT, 'tools', 'vendor-gltf.js'), 'utf8');

  const br = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    // the bake must not silently fall back to a software rasterizer with no
    // antialiasing — swiftshader is fine, but ask for GL explicitly
    args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
  });
  const NCOL = CLIP != null ? FRAMES : COLS;
  const p = await br.newPage({ viewport: { width: CELL * NCOL, height: CELL } });
  p.on('pageerror', (e) => { console.error('page: ' + e); });
  await p.setContent('<canvas id="out" width="' + (CELL * NCOL) + '" height="' + CELL + '"></canvas>');
  await p.addScriptTag({ content: three });
  await p.addScriptTag({ content: gltf });

  const dataURL = await p.evaluate(async ({ glbB64, COLS, CELL, PITCH, CLIP, FRAMES, YAW, FPS, MARGIN }) => {
    const bin = Uint8Array.from(atob(glbB64), (c) => c.charCodeAt(0)).buffer;
    const gltf = await new Promise((res, rej) =>
      new THREE.GLTFLoader().parse(bin, '', res, rej));
    const model = gltf.scene;
    // the clip, by name or index, before anything is framed: framing is done
    // at rest so the whole loop shares one scale and one floor line
    let clip = null, mixer = null, pinned = [];
    if (CLIP != null) {
      const clips = gltf.animations || [];
      clip = clips.find((k) => k.name === CLIP) || clips[parseInt(CLIP, 10)];
      if (!clip) throw new Error('no clip "' + CLIP + '" — the file has: ' + (clips.map((k) => k.name).join(', ') || 'none'));
      mixer = new THREE.AnimationMixer(model);
      mixer.clipAction(clip).play();
      mixer.setTime(0);
      model.updateMatrixWorld(true);
      // every node a track TRANSLATES is a root-motion candidate: remember
      // where it stands at t=0 and hold it there in X and Z for every frame
      for (const tr of clip.tracks) {
        if (!/\.position$/.test(tr.name)) continue;
        const nm = tr.name.replace(/\.position$/, '').replace(/^.*[\/]/, '');
        const node = model.getObjectByName(nm) || model.getObjectByProperty('uuid', nm);
        if (node) pinned.push({ node, x: node.position.x, z: node.position.z });
      }
    }

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
    // A RIGGED MESH IS NOT WHERE ITS GEOMETRY SAYS. Meshy's rigged GLBs keep
    // the mesh in metres under an Armature scaled 0.01 with the bones in
    // centimetres: the geometry's own box is a centimetre tall, the skinned
    // body it renders is a metre. Box3.setFromObject reads the geometry, so
    // the first clip bake framed a 1 cm box and every cell was a close-up of
    // a cape. For skinned meshes the box is taken from the SKINNED vertices
    // (boneTransform, then the mesh's world matrix), posed as they stand now.
    const box = new THREE.Box3();
    let skinned = 0;
    model.traverse((o) => {
      if (!o.isSkinnedMesh) return;
      skinned++;
      o.skeleton.update();
      const pos = o.geometry.attributes.position, n = pos.count;
      const step = Math.max(1, Math.floor(n / 6000)), v = new THREE.Vector3();
      const xf = o.applyBoneTransform ? 'applyBoneTransform' : 'boneTransform';
      for (let i = 0; i < n; i += step) {
        // boneTransform takes the vertex IN the vector and skins it in place
        v.fromBufferAttribute(pos, i);
        o[xf](i, v);                                  // skinned, in the mesh's local space
        v.applyMatrix4(o.matrixWorld);
        box.expandByPoint(v);
      }
    });
    if (!skinned) box.setFromObject(model);
    const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    model.position.sub(c);                       // spin about the volume center
    const spinR = Math.hypot(sz.x, sz.z) / 2;    // worst-case half-width in yaw
    const margin = MARGIN;                     // --margin: a jump clip leaves the rest-pose box
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
    if (clip) {
      // the house camera: profile faces screen-right at rotY 90° (atlas col
      // 0), and the three-quarter turns it YAW degrees toward the lens
      model.rotation.y = THREE.MathUtils.degToRad(90 - YAW);
      const pose = (t) => {
        mixer.setTime(t);
        for (const q of pinned) { q.node.position.x = q.x; q.node.position.z = q.z; }
        model.updateMatrixWorld(true);
      };
      // the strip: N even samples over the loop, the last one short of the
      // wrap so a loop's first and last cells are not the same picture
      for (let i = 0; i < FRAMES; i++) {
        pose((i / FRAMES) * clip.duration);
        r.render(scene, cam);
        x2d.drawImage(r.domElement, i * CELL, 0, CELL, CELL);
      }
      const strip = sheet.toDataURL('image/png');
      // the driving video: the whole clip at FPS, recorded off a canvas the
      // renderer draws into frame by frame (no encoder on the box; the page
      // has one). webm/vp8 — Higgsfield's media import takes it as video.
      let video = null, vidErr = null;
      try {
        const vc = document.createElement('canvas'); vc.width = CELL; vc.height = CELL;
        const vx = vc.getContext('2d');
        const stream = vc.captureStream(0);
        const track = stream.getVideoTracks()[0];
        const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 6e6 });
        const chunks = [];
        rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        const done = new Promise((res) => { rec.onstop = res; });
        rec.start();
        const n = Math.max(2, Math.round(clip.duration * FPS));
        for (let i = 0; i <= n; i++) {
          pose(Math.min(clip.duration, i / FPS));
          r.render(scene, cam);
          vx.fillStyle = '#000'; vx.fillRect(0, 0, CELL, CELL);   // black field: the keyer's norm
          vx.drawImage(r.domElement, 0, 0);
          if (track.requestFrame) track.requestFrame();
          await new Promise((k) => setTimeout(k, 1000 / FPS));
        }
        rec.stop(); await done;
        const blob = new Blob(chunks, { type: 'video/webm' });
        video = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
      } catch (e) { vidErr = String(e); }
      return { strip, video, vidErr, clipName: clip.name, duration: clip.duration, tracks: clip.tracks.length, pinned: pinned.length };
    }
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
  }, { glbB64: glb.toString('base64'), COLS, CELL, PITCH, CLIP, FRAMES, YAW, FPS, MARGIN });

  await br.close();

  if (CLIP != null) {
    const R = dataURL;
    const outDir = flag('out', null) || path.join(ROOT, 'assets', 'source', subject, 'clips');
    fs.mkdirSync(outDir, { recursive: true });
    const tag = subject + '_' + String(R.clipName || CLIP).replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    const stripPath = path.join(outDir, tag + '_' + FRAMES + '.png');
    fs.writeFileSync(stripPath, Buffer.from(R.strip.split(',')[1], 'base64'));
    console.log(stripPath + '  ' + FRAMES + ' cells @ ' + CELL + 'px   clip "' + R.clipName + '" ' + R.duration.toFixed(2) + 's, '
      + R.tracks + ' tracks, ' + R.pinned + ' node(s) pinned against root motion, yaw ' + YAW + '°');
    if (R.video) {
      const vp = path.join(outDir, tag + '_' + FPS + 'fps.webm');
      fs.writeFileSync(vp, Buffer.from(R.video.split(',')[1], 'base64'));
      console.log(vp + '  driving video for motion control');
    } else console.log('no driving video: ' + R.vidErr);
    console.log('\nnext: the art session fires motion control with her canon plate over the driving video,');
    console.log('      then tools/vidstrip.cjs auto:N cuts the take and tools/swingk.cjs measures k.');
    return;
  }

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
