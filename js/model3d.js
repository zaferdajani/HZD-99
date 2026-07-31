// CLAWBYTE — real 3D characters.
//
// This is not a sprite pretending. The Driller here is an actual mesh — ceramic
// drum, bronze bore-head, four articulated legs — lit by a real directional key
// light that casts a real shadow onto a catcher plane, rendered live in WebGL
// and composited into the 2D scene. Facing is a genuine rotation in Y, so the
// body turns smoothly through every angle; the legs stride and the drill spins
// because their transforms animate, not because frames swap.
//
// Surface detail comes from painted texture maps (panel seams, rivets, hazard
// chevrons, grime, the spiral drill thread) plus an environment cube so the
// bronze and steel pick up real warm/cool reflections instead of going grey.
//
// Fallback chain stays intact: real 3D -> animation sheet -> procedural paint.
const M3D = { ok: null, r: null, scene: null, cam: null, rigs: {}, tex: {} };

function m3dEnvMap() {
  // six tiny gradient faces: cool sky above, warm rusted floor below, a bright
  // band on the key-light side. Metals reflect this, which is what keeps them
  // colorful instead of flat grey.
  const face = (top, bot, band) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    if (band) { x.fillStyle = 'rgba(255,242,216,0.85)'; x.fillRect(0, 8, 64, 12); }
    return cv;
  };
  const side = (band) => face('#7290aa', '#4a3826', band);
  const t = new THREE.CubeTexture([
    side(false), side(true),                      // +x, -x (key light sits at -x)
    face('#a2bed6', '#7290aa', false),            // +y sky
    face('#38291a', '#1e1710', false),            // -y floor
    side(true), side(false),                      // +z, -z
  ]);
  t.needsUpdate = true;
  return t;
}

function m3dInit() {
  if (M3D.ok !== null) return M3D.ok;
  try {
    if (typeof THREE === 'undefined') { M3D.ok = false; return false; }
    const cv = document.createElement('canvas');
    const r = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    r.setSize(512, 512, false);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.98;
    M3D.r = r;
    const sc = new THREE.Scene();
    sc.environment = m3dEnvMap();
    // the game's key light: upper-left, warm white — same as the sheets
    const key = new THREE.DirectionalLight(0xffeeda, 1.35);
    key.position.set(-30, 46, 34);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -40; key.shadow.camera.right = 40;
    key.shadow.camera.top = 40; key.shadow.camera.bottom = -40;
    sc.add(key);
    // hemisphere instead of flat ambient: cool from above, warm bounce below
    sc.add(new THREE.HemisphereLight(0xa9c4dc, 0x5c452c, 0.5));
    const fill = new THREE.DirectionalLight(0x9fb4c8, 0.25);
    fill.position.set(24, 6, 18); sc.add(fill);
    const rim = new THREE.DirectionalLight(0x37ffd0, 0.3);
    rim.position.set(26, 10, -30);
    sc.add(rim);
    // shadow catcher: invisible plane that shows only the shadow cast on it
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.ShadowMaterial({ opacity: 0.42 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    sc.add(ground);
    // orthographic side camera, 10 degrees above the horizon like the sheets
    const cam = new THREE.OrthographicCamera(-24, 24, 34, -14, 1, 300);
    cam.position.set(0, 14, 80);
    cam.lookAt(0, 10, 0);
    M3D.scene = sc; M3D.cam = cam;
    M3D.ok = true;
  } catch (e) { M3D.ok = false; }
  return M3D.ok;
}

// ---------------------------------------------------------------------------
// Painted texture maps. Cylinder UVs: u wraps the circumference (canvas x),
// v runs along the axis (canvas y, v=1 at the drill end after the Z rotation).
// ---------------------------------------------------------------------------
function m3dTexDrum() {
  if (M3D.tex.drum) return M3D.tex.drum;
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256;
  const x = cv.getContext('2d');
  // ivory ceramic base, darker toward the tail
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#e7dfcb'); g.addColorStop(0.55, '#d9cdb2'); g.addColorStop(1, '#c4b593');
  x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  // mottle / casting variance
  for (let i = 0; i < 420; i++) {
    x.fillStyle = 'rgba(' + (100 + Math.random() * 50 | 0) + ',' + (82 + Math.random() * 44 | 0) + ',52,' + (Math.random() * 0.1).toFixed(3) + ')';
    const s = 4 + Math.random() * 28;
    x.fillRect(Math.random() * 512, Math.random() * 256, s, s * 0.5);
  }
  // longitudinal panel seams (lines running the length of the drum)
  for (const u of [64, 192, 320, 448]) {
    x.fillStyle = 'rgba(58,46,30,0.75)'; x.fillRect(u - 1.5, 34, 3, 222);
    x.fillStyle = 'rgba(255,250,238,0.4)'; x.fillRect(u + 2, 34, 1.5, 222);
  }
  // hazard chevrons at the drill end
  x.save(); x.beginPath(); x.rect(0, 4, 512, 30); x.clip();
  for (let u = -40; u < 560; u += 40) {
    x.fillStyle = u / 40 % 2 ? '#241f18' : '#c08a26';
    x.beginPath(); x.moveTo(u, 34); x.lineTo(u + 20, 4); x.lineTo(u + 40, 4); x.lineTo(u + 20, 34); x.fill();
  }
  x.restore();
  // segment seams (rings around the drum) with rivet rows and worn highlights
  for (const f of [0.22, 0.52, 0.84]) {
    const y = f * 256;
    x.fillStyle = 'rgba(48,38,24,0.95)'; x.fillRect(0, y - 3, 512, 6);
    x.fillStyle = 'rgba(255,251,240,0.6)'; x.fillRect(0, y + 3, 512, 2.5);
    x.fillStyle = '#4e3f26';
    for (let u = 10; u < 512; u += 30) { x.beginPath(); x.arc(u, y - 12, 4.2, 0, 7); x.fill(); }
    x.fillStyle = 'rgba(255,248,232,0.6)';
    for (let u = 10; u < 512; u += 30) { x.beginPath(); x.arc(u - 1.4, y - 13.4, 1.7, 0, 7); x.fill(); }
  }
  // service hatch + crimson unit glyph
  x.fillStyle = '#b3a684'; x.fillRect(300, 120, 74, 52);
  x.strokeStyle = 'rgba(48,38,24,0.95)'; x.lineWidth = 4; x.strokeRect(300, 120, 74, 52);
  x.fillStyle = '#8f2318'; x.fillRect(96, 126, 38, 38);
  x.strokeStyle = 'rgba(48,38,24,0.9)'; x.lineWidth = 3; x.strokeRect(96, 126, 38, 38);
  x.fillStyle = '#e8dfc8'; x.font = 'bold 30px monospace'; x.fillText('0', 106, 156);
  // oil / rust streaks bleeding back from the seams
  for (let i = 0; i < 70; i++) {
    const u = Math.random() * 512, y0 = [0.22, 0.52, 0.84][i % 3] * 256;
    const grd = x.createLinearGradient(0, y0, 0, y0 + 26 + Math.random() * 40);
    grd.addColorStop(0, 'rgba(84,52,22,' + (0.16 + Math.random() * 0.3).toFixed(2) + ')');
    grd.addColorStop(1, 'rgba(84,52,22,0)');
    x.fillStyle = grd; x.fillRect(u, y0, 2 + Math.random() * 5, 26 + Math.random() * 40);
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  M3D.tex.drum = t;
  return t;
}

function m3dTexDrill() {
  if (M3D.tex.drill) return M3D.tex.drill;
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#3a2a0e'); g.addColorStop(0.5, '#6d5020'); g.addColorStop(1, '#4c3812');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  // spiral thread: slanted grooves that wrap; they advance when the cone spins
  x.lineCap = 'butt';
  for (let i = 0; i < 5; i++) {
    for (const off of [-256, 0, 256]) {
      const u0 = i / 5 * 256 + off;
      x.strokeStyle = '#1c1204'; x.lineWidth = 18;
      x.beginPath(); x.moveTo(u0, 276); x.lineTo(u0 + 300, -20); x.stroke();
      x.strokeStyle = 'rgba(232,190,110,0.75)'; x.lineWidth = 5;
      x.beginPath(); x.moveTo(u0 + 14, 276); x.lineTo(u0 + 314, -20); x.stroke();
    }
  }
  // bite wear at the tip
  for (let i = 0; i < 70; i++) {
    x.fillStyle = 'rgba(238,214,166,' + (Math.random() * 0.3).toFixed(2) + ')';
    x.fillRect(Math.random() * 256, 200 + Math.random() * 56, 3, 3);
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  M3D.tex.drill = t;
  return t;
}

// ---------------------------------------------------------------------------
// The Driller as geometry. Proportions from the design sheet: segmented drum on
// four hydraulic legs, fluted spiral bore forward, pipe cluster + hopper dorsal.
// ---------------------------------------------------------------------------
function m3dMat(hex, rough, metal, emissive) {
  const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
  m.envMapIntensity = 0.5;
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 1.4; }
  return m;
}
function m3dBuildDriller() {
  const CER = () => m3dMat(0xddd2b8, 0.55, 0.05);
  const STE = () => m3dMat(0x3e454d, 0.42, 0.6);
  const BRZ = () => m3dMat(0x7a5620, 0.38, 0.6);
  const DKB = () => m3dMat(0x35260c, 0.5, 0.55);
  const g = new THREE.Group();
  const cast = (m) => { m.castShadow = true; return m; };

  // drum body, axis along X, wrapped in the painted panel texture
  const drumMat = new THREE.MeshStandardMaterial({
    map: m3dTexDrum(), bumpMap: m3dTexDrum(), bumpScale: 0.5,
    roughness: 0.55, metalness: 0.05, envMapIntensity: 0.5,
  });
  const body = cast(new THREE.Mesh(new THREE.CylinderGeometry(7.4, 7.4, 16, 24), drumMat));
  body.rotation.z = Math.PI / 2; body.position.y = 12;
  g.add(body);
  // tail cap + bronze girdle band with rivet ring
  const capT = cast(new THREE.Mesh(new THREE.SphereGeometry(7.35, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), m3dMat(0xcfc2a4, 0.5, 0.06)));
  capT.rotation.z = -Math.PI / 2; capT.position.set(8, 12, 0); capT.scale.x = 0.55;
  g.add(capT);
  const tailRing = cast(new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.55, 8, 20), DKB()));
  tailRing.rotation.y = Math.PI / 2; tailRing.position.set(9.9, 12, 0);
  g.add(tailRing);
  const vent = cast(new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.4, 2, 14), STE()));
  vent.rotation.z = Math.PI / 2; vent.position.set(11.6, 12, 0); g.add(vent);
  const ventCap = new THREE.Mesh(new THREE.CircleGeometry(1.7, 14), m3dMat(0x17120c, 0.85, 0.2));
  ventCap.rotation.y = Math.PI / 2; ventCap.position.set(12.65, 12, 0); g.add(ventCap);
  const band = cast(new THREE.Mesh(new THREE.CylinderGeometry(7.7, 7.7, 2.2, 24), BRZ()));
  band.rotation.z = Math.PI / 2; band.position.set(2.2, 12, 0);
  g.add(band);
  for (let i = 0; i < 10; i++) {
    const rv = cast(new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), DKB()));
    const a = i / 10 * Math.PI * 2;
    rv.position.set(2.2, 12 + Math.cos(a) * 7.75, Math.sin(a) * 7.75);
    g.add(rv);
  }
  // dorsal hopper + pipe cluster + boiler tank — the busy skyline off the sheet
  const hop = cast(new THREE.Mesh(new THREE.BoxGeometry(8.2, 4.2, 7.2), CER()));
  hop.position.set(3.2, 20.8, 0); g.add(hop);
  const hopLip = cast(new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.9, 7.8), DKB()));
  hopLip.position.set(3.2, 23, 0); g.add(hopLip);
  const tank = cast(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 5.6, 12), BRZ()));
  tank.rotation.z = Math.PI / 2; tank.position.set(-1.6, 20.4, -3.4); g.add(tank);
  const PIPES = [[6.2, 4.8, -2, 0.75], [7.2, 6.4, 0.2, 0.85], [5.4, 5.6, 2, 0.62], [8, 3.4, 1.6, 0.5]];
  for (const [px, ph, pz, pr] of PIPES) {
    const st = cast(new THREE.Mesh(new THREE.CylinderGeometry(pr, pr * 1.15, ph, 10), STE()));
    st.position.set(px, 19 + ph / 2, pz); g.add(st);
    const tip = cast(new THREE.Mesh(new THREE.CylinderGeometry(pr * 1.2, pr * 1.2, 0.7, 10), m3dMat(0x26221c, 0.6, 0.4)));
    tip.position.set(px, 19 + ph + 0.35, pz); g.add(tip);
  }
  // marker lights on the hopper lip
  for (const z of [-3.2, 3.2]) {
    const mk = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), m3dMat(0x552f08, 0.4, 0.1, 0xffa03a));
    mk.position.set(-0.6, 23.3, z); g.add(mk);
  }
  // sensor: crimson lens in a steel housing on the drum cheek
  const eyeH = cast(new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.42, 8, 16), STE()));
  eyeH.position.set(-5.6, 15.2, 6.6); eyeH.rotation.x = -0.4; eyeH.rotation.y = -0.5;
  g.add(eyeH);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 14), m3dMat(0x2a0407, 0.3, 0.1, 0xe8101f));
  eye.material.emissiveIntensity = 1.1;
  eye.position.set(-5.7, 15.2, 6.4);
  g.add(eye);

  // bore-head: steel collar ring, then the spiral-threaded cone, forward on -X
  const drill = new THREE.Group();
  const collarRing = cast(new THREE.Mesh(new THREE.TorusGeometry(4, 0.9, 10, 18), DKB()));
  collarRing.rotation.y = Math.PI / 2; collarRing.position.x = 1.2; drill.add(collarRing);
  const collar = cast(new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.9, 3.2, 16), STE()));
  collar.rotation.z = Math.PI / 2; drill.add(collar);
  const coneMat = new THREE.MeshStandardMaterial({
    map: m3dTexDrill(), bumpMap: m3dTexDrill(), bumpScale: 0.6,
    roughness: 0.4, metalness: 0.55, envMapIntensity: 0.5,
  });
  const cone = cast(new THREE.Mesh(new THREE.ConeGeometry(3.3, 10.5, 18), coneMat));
  cone.rotation.z = Math.PI / 2; cone.position.x = -6.6; drill.add(cone);
  drill.position.set(-10.5, 12, 0);
  g.add(drill);

  // four legs: bronze hip gland, steel piston thigh, ceramic shin guard, clawed foot
  const legs = [];
  for (const [lx, lz] of [[-5.5, 4.4], [5.5, 4.4], [-5.5, -4.4], [5.5, -4.4]]) {
    const leg = new THREE.Group();
    const hip = cast(new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 12), BRZ()));
    leg.add(hip);
    const gland = cast(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 1.4, 10), DKB()));
    gland.position.y = -1.4; leg.add(gland);
    const thigh = cast(new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.8, 6, 10), STE()));
    thigh.position.y = -3.4; leg.add(thigh);
    const knee = cast(new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), BRZ()));
    knee.position.y = -5.6; leg.add(knee);
    const shin = cast(new THREE.Mesh(new THREE.BoxGeometry(2, 5.6, 2), m3dMat(0xc2b394, 0.55, 0.05)));
    shin.position.y = -8.5; leg.add(shin);
    const shinTrim = cast(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 2.2), DKB()));
    shinTrim.position.y = -6.2; leg.add(shinTrim);
    const foot = cast(new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 2.7), STE()));
    foot.position.y = -11.6; leg.add(foot);
    for (const tz of [-0.8, 0.8]) {
      const toe = cast(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.8), DKB()));
      toe.position.set(lx < 0 ? -1.9 : 1.9, -11.7, tz); leg.add(toe);
    }
    leg.position.set(lx, 12, lz);
    g.add(leg); legs.push(leg);
  }
  return { root: g, drill, legs, eye };
}

// pose + render one frame into the offscreen WebGL canvas
function m3dRenderDriller(b) {
  if (!m3dInit()) return null;
  let rig = M3D.rigs.driller;
  if (!rig) {
    rig = m3dBuildDriller();
    M3D.rigs.driller = rig;
    M3D.scene.add(rig.root);
  }
  const t = b.anim, fv = b.faceVis == null ? -1 : b.faceVis;
  // REAL rotation: facing is yaw. -1 = nose left, +1 = nose right, 0 = at camera.
  rig.root.rotation.y = (fv + 1) * Math.PI / 2;
  // drill spins for real
  rig.drill.rotation.x = t * (b.st === 'charge' || b.st === 'bore' ? 22 : 6);
  // stride: diagonal leg pairs in counterphase while moving
  const moving = b.st === 'charge' || Math.abs(b.vx) > 40;
  const gph = t * (b.st === 'charge' ? 13 : 8);
  rig.legs.forEach((leg, i) => {
    const ph = (i === 0 || i === 3) ? 0 : Math.PI;
    leg.rotation.z = moving ? Math.sin(gph + ph) * 0.42 : Math.sin(t * 1.6 + i) * 0.05;
  });
  // bore: rear up and drive the head down
  if (b.st === 'bore') {
    const k = clamp(1 - (b.t || 0) / 1.1, 0, 1);
    rig.root.rotation.z = Math.sin(Math.min(k * 1.6, 1) * Math.PI) * -0.55;
  } else rig.root.rotation.z = 0;
  // idle breath
  rig.root.position.y = Math.sin(t * 2.2) * 0.35;
  rig.eye.material.emissiveIntensity = 1.05 + Math.sin(t * 6) * 0.35;

  M3D.r.render(M3D.scene, M3D.cam);
  return M3D.r.domElement;
}

// draw into the 2D scene at the boss rect. Returns false so callers fall back.
function drawDriller3D(c, b) {
  try {
    const cv = m3dRenderDriller(b);
    if (!cv) return false;
    // camera frustum: x [-24,24], y [-14,34] -> foot line y=0 sits at 34/48 down
    const cx = b.x + b.w / 2, footY = b.y + b.h;
    const scale = (b.h * 2.9) / 48 * (48 / 34);       // model ~34 units tall on screen
    const dw = 48 * scale, dh = 48 * scale;
    const gy = footY - dh * (34 / 48);                 // model y=0 at the hitbox floor
    if (b.hurtT > 0) c.globalAlpha = 0.75;
    c.drawImage(cv, cx - dw / 2, gy, dw, dh);
    c.globalAlpha = 1;
    return true;
  } catch (e) { return false; }
}
