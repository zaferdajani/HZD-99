// ---------------------------------------------------------------------------
// FXGL — the fight effects, drawn by shaders.
//
// The owner put this game's fights next to Mandible's and called these effects
// dull, and the reason is in the two renderers rather than in the taste. A
// Mandible burst is a fragment shader: a pressure band with a soft gaussian
// body and a thin hot core, broken up by noise so no two degrees of it are the
// same, a wake behind it, ground that cracks alight as the wave passes and
// cools, and a flash with a fast attack and a shaped decay. What this game had
// was ctx.arc with a lineWidth: a hoop of one thickness and one brightness all
// the way round, which is what "flat" means.
//
// Canvas 2D cannot shade per pixel, so this is one small WebGL canvas that
// draws ONLY the effects and is composited into the world at the point the old
// rings were drawn — under the HUD, over the cast. Nothing else in the frame
// moves to the GPU, the game's art pipeline is untouched, and:
//
//   - THE SIMULATION STILL OWNS EVERY CLOCK. Each effect is a record with a
//     `t` that fxglUpdate(dt) advances from update(); drawing reads it and
//     changes nothing (tests/drawclock.cjs). The legacy rings (G.rings) and roar
//     waves (ROARFX) are not replaced as STATE — they are drawn here FROM their
//     existing state, so every caller in every kingdom gets the new picture.
//   - NO GPU, NO PROBLEM. If a context cannot be made (or is lost) fxglOn() is
//     false and the Canvas rings draw exactly as they did. Same game either way.
//   - G.artProbe hides it, like every ground effect, so a harness measuring a
//     body never measures the wave under it.
//
// Output is PREMULTIPLIED: rgb carries the light, alpha carries how much of the
// scene it covers. Alpha 0 is pure additive light; a little alpha gives a hot
// core enough body to read over a bright sky. One blend state does both.
// ---------------------------------------------------------------------------
const FXGL = { cv: null, gl: null, ok: null, list: [], max: 40, drawn: 0, loc: null };
const FX_KIND = { shock: 0, ground: 1, cracks: 2, slash: 3, flash: 4, pillar: 5, cone: 6, gather: 7 };
const FXGL_VS = `
attribute vec2 a_pos;
uniform vec2 u_res, u_c, u_h; uniform float u_rot;
// u_strip = (u0, u1, yl, yr): this quad is the slice u0..u1 of the effect, its
// left edge dropped yl pixels and its right edge yr — a column standing on its
// own piece of ground. (-1, 1, 0, 0) is the whole effect, unmoved.
uniform vec4 u_strip;
varying vec2 v_uv;
void main() {
  float sx = a_pos.x * 0.5 + 0.5;
  v_uv = vec2(mix(u_strip.x, u_strip.y, sx), a_pos.y);
  vec2 p = v_uv * u_h; float s = sin(u_rot), c = cos(u_rot);
  p = vec2(p.x * c - p.y * s, p.x * s + p.y * c) + u_c;
  p.y += mix(u_strip.z, u_strip.w, sx);
  gl_Position = vec4(p.x / u_res.x * 2.0 - 1.0, 1.0 - p.y / u_res.y * 2.0, 0.0, 1.0);
}`;
const FXGL_FS = `
precision mediump float;
varying vec2 v_uv;
uniform float u_k, u_t, u_seed, u_power, u_flip; uniform int u_kind;
uniform vec3 u_col, u_hot;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
// angular noise that does not seam at +-pi: sample on the circle, not on the angle
float ring(float ang, float f, float z) { return fbm(vec2(cos(ang), sin(ang)) * f + z); }
void main() {
  vec2 uv = vec2(v_uv.x * u_flip, v_uv.y);
  float r = length(uv), ang = atan(uv.y, uv.x), k = u_k;
  vec3 col = u_col; float a = 0.0, body = 0.0;
  if (u_kind == 1) {
    // THE GROUND WAVE, SEEN FROM THE SIDE (owner, 2026-11-14: "cracking floor
    // looks fake and not blended with terrain"). It was an ellipse — a ring
    // lying on a floor plane this game does not have, hung at one height over a
    // meadow that rises and dips. From the side a ground wave is two FRONTS
    // racing apart ALONG THE SURFACE: a low crest of pressure and thrown dust
    // standing on the ground, a hot line where it touches, a skin of light on
    // the soil behind it. uv.x runs along the ground (0 the blow, 1 the reach);
    // uv.y is height: 0 is the surface under this column, negative is air.
    float ax = abs(uv.x), up = -uv.y;
    float front = 0.06 + 0.94 * (1.0 - pow(1.0 - k, 2.6));
    float w = 0.030 + 0.050 * k;
    float band = exp(-pow((ax - front) / w, 2.0));
    float core = exp(-pow((ax - front) / (w * 0.4), 2.0));
    float n = fbm(vec2(uv.x * 9.0 + u_seed, up * 3.0 - k * 4.0));
    // the crest stands tallest as it leaves and sinks as it runs out
    float tall = (0.50 + 0.55 * n) * (1.0 - 0.6 * k);
    float crest = band * smoothstep(tall, tall * 0.2, up);
    float eat = smoothstep(0.28, 0.62, fbm(vec2(uv.x * 6.0 + u_seed + 4.0, up * 5.0 - k * 3.0))) * 1.05 + 0.2;
    // the contact line, and the soil still lit behind the front
    float skin = exp(-pow(up / 0.07, 2.0));
    float behind = smoothstep(front, front - 0.45, ax) * smoothstep(0.0, 0.08, ax);
    float dust = fbm(vec2(uv.x * 11.0 - sign(uv.x) * k * 2.0 + u_seed, up * 6.0 - k * 5.0)) * exp(-max(up, 0.0) * 5.0) * 0.55;
    float fade = (1.0 - k) * (1.0 - k);
    // nothing of it is under the ground: it stands ON the surface
    float above = smoothstep(-0.10, -0.01, up);
    a = (crest * eat * 1.25 + core * skin * 1.3 + behind * (skin * 0.55 + dust) * (1.0 - k)) * fade * above;
    a *= smoothstep(1.0, 0.9, ax);
    col = mix(u_col, u_hot, clamp(core * skin * 1.4 + crest * 0.25, 0.0, 1.0));
    body = core * skin * fade * 0.3;
  } else if (u_kind == 0) {
    // THE PRESSURE WAVE: an eased front, a gaussian body, a thin hot core, the
    // whole band eaten by noise, and a wake of thinning light behind it.
    float front = 0.10 + 0.90 * (1.0 - pow(1.0 - k, 2.6));
    float w = 0.03 + 0.07 * k;
    float band = exp(-pow((r - front) / w, 2.0));
    float core = exp(-pow((r - front) / (w * 0.32), 2.0));
    // torn, not dimmed: whole arcs of the band go missing and the gaps travel
    float eat = smoothstep(0.30, 0.62, ring(ang, 2.4, u_seed + r * 2.0 - k * 3.0)) * 1.25 + 0.12;
    float wake = smoothstep(front, front - 0.5, r) * smoothstep(0.0, front, r) * 0.34 * (1.0 - k);
    // an echo: a second, thinner band a beat behind the first
    float echo = exp(-pow((r - front * 0.78) / (w * 0.7), 2.0)) * 0.45 * smoothstep(0.34, 0.7, ring(ang, 4.0, u_seed + 9.0 + k * 2.0));
    float fade = (1.0 - k) * (1.0 - k);
    a = (band * eat * 1.3 + core * eat * 0.9 + echo + wake * (0.3 + 1.3 * ring(ang, 6.0, u_seed + r * 4.0))) * fade;
    col = mix(u_col, u_hot, clamp(core * 1.3 + band * 0.25, 0.0, 1.0));
    a *= smoothstep(1.0, 0.9, r);
    body = core * fade * 0.35;
  } else if (u_kind == 2) {
    // GROUND THAT CRACKS — IN THE GROUND. The same correction: the fracture is
    // not a glowing web on an ellipse above the grass, it is fissures running
    // DOWN from the surface into the soil under each column, deepest under the
    // blow and a scratch at its reach. uv.y is depth here: 0 the surface,
    // positive into the ground. Each fissure is a DARK gap (alpha, so the soil
    // it opens in goes dark) with a hot seam of the virus's light down it; the
    // light cools first and the scar closes after, so it ends as a mark on the
    // terrain rather than switching off.
    float ax = abs(uv.x), d = uv.y;
    float reach = 0.10 + 0.90 * smoothstep(0.0, 0.22, k);
    float lit = smoothstep(reach, reach - 0.12, ax) * smoothstep(1.0, 0.82, ax);
    float maxd = 0.95 * pow(max(0.0, 1.0 - ax), 0.75) * (0.7 + 0.6 * noise(vec2(uv.x * 7.0 + u_seed, 3.1)));
    // cells stretched down the depth, so their edges run into the ground
    vec2 q = vec2(uv.x * 6.5 + 0.35 * noise(vec2(d * 5.0, u_seed)), d * 2.0 + 0.6), g = floor(q), f = fract(q);
    float d1 = 9.0, d2 = 9.0;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y));
      vec2 h = vec2(hash(g + o + u_seed), hash(g + o + u_seed + 17.3));
      vec2 c = o + h - f; float dd = dot(c, c);
      if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) { d2 = dd; }
    }
    float gap = sqrt(d2) - sqrt(d1);
    // a fissure is widest at the surface and closes to a hair at its foot
    float taper = 1.0 - smoothstep(0.0, max(0.05, maxd), d) * 0.75;
    float edge = 1.0 - smoothstep(0.0, 0.24 * taper, gap);
    float seam = 1.0 - smoothstep(0.0, 0.10 * taper, gap);     // the hot line down each crack
    float inGround = smoothstep(-0.03, 0.02, d) * smoothstep(maxd, maxd * 0.5, d);
    // the broken lip of the surface itself
    float lip = exp(-pow(d / 0.05, 2.0)) * (0.45 + 0.55 * noise(vec2(uv.x * 26.0 + u_seed, 1.7)));
    float glow = smoothstep(0.0, 0.05, k) * (1.0 - smoothstep(0.18, 0.8, k));
    float scar = smoothstep(0.0, 0.06, k) * (1.0 - smoothstep(0.7, 1.0, k));
    float flick = 0.86 + 0.14 * sin(u_t * 31.0 + u_seed);
    // light welling up under the blow while it is hottest, a little of it
    // spilling above the surface — nothing else of this is in the air
    float well = exp(-ax * ax * 6.0) * (1.0 - smoothstep(0.0, 0.4, k)) * smoothstep(0.0, 0.04, k);
    float under = well * (d > 0.0 ? exp(-pow(d / 0.55, 2.0)) * 0.45 : exp(d * 9.0) * 0.4);
    a = ((edge * 0.55 + seam * 1.25) * inGround + lip * 0.8) * lit * glow * flick + under;
    col = mix(u_col, u_hot, clamp(seam * (1.2 - k) + lip * 0.5 * (1.0 - k) + well * 0.3, 0.0, 1.0));
    body = edge * inGround * lit * scar * 0.6 + lip * lit * scar * 0.2;
  } else if (u_kind == 3) {
    // THE CLAW: a crescent that is swept, not stamped — a head that leads, a
    // tail that thins and erodes behind it, and (u_power lanes) one arc per
    // claw, because one wide swoosh is a sword and four is a hand.
    float a0 = -1.15, a1 = 1.05, hotm = 0.0;
    float sweep = 1.0 - pow(1.0 - clamp(k * 2.4, 0.0, 1.0), 3.0);
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      if (fi < u_power) {
        float R = u_power > 1.5 ? 0.40 + fi * 0.155 : 0.70;
        // each claw leaves a hair after the one inside it
        float head = mix(a0, a1, clamp(sweep * 1.1 - fi * 0.035, 0.0, 1.0));
        float s = (ang - a0) / max(1e-3, head - a0);
        float on = step(0.0, s) * step(s, 1.0);
        float sc = clamp(s, 0.0, 1.0);
        // tapered to nothing at both ends, heaviest just behind the head
        float prof = pow(sin(3.14159 * sc), 0.55) * (0.3 + 0.7 * sc);
        float th = (u_power > 1.5 ? 0.042 : 0.13) * prof + 0.003;
        float d = (r - R) / th;
        // the tail erodes as the cut ages
        float eat = smoothstep(k * 1.1 - 0.25, k * 1.1 + 0.2, sc + 0.35 * noise(vec2(ang * 9.0 + fi * 3.0 + u_seed, r * 12.0)));
        a += exp(-d * d) * on * prof * eat;
        hotm += exp(-d * d * 6.0) * on * prof * eat;
      }
    }
    float fade = pow(1.0 - k, 1.5);
    a *= fade * 1.25;
    col = mix(u_col, u_hot, clamp(hotm * 1.3, 0.0, 1.0));
    body = hotm * fade * 0.55;
  } else if (u_kind == 4) {
    // THE HIT: a light with a fast attack and a shaped decay — a core, a halo
    // that falls off like light does, a thin horizontal streak, a few rays.
    float env = k < 0.12 ? k / 0.12 : pow(1.0 - (k - 0.12) / 0.88, 2.4);
    float core = exp(-r * r * 30.0);
    float halo = 0.26 / (1.0 + r * r * 16.0) * smoothstep(1.0, 0.45, r);
    float streak = exp(-uv.y * uv.y * 1100.0) * exp(-uv.x * uv.x * 3.2) * 0.9;
    float rays = pow(max(0.0, ring(ang, 3.0, u_seed) * 1.7 - 0.62), 2.0) * exp(-r * 3.2) * 2.2;
    a = (core * 1.5 + halo + streak + rays) * env;
    col = mix(u_col, u_hot, clamp(core * 1.4 + streak * 0.8, 0.0, 1.0));
    body = core * env * 0.5;
  } else if (u_kind == 5) {
    // THE COLUMN: brightest down its centre, streaks climbing it, a head that
    // rises in the first fifth, soft at the foot and thinning into the sky.
    float h = (1.0 - uv.y) * 0.5, x = uv.x;
    float core = exp(-x * x * 22.0), sheath = exp(-x * x * 3.5) * 0.28;
    float rise = smoothstep(0.0, 0.2, k);
    float top = smoothstep(rise + 0.02, rise - 0.18, h);
    float streak = 0.62 + 0.38 * sin(x * 16.0 + h * 38.0 - u_t * 9.0) * sin(x * 5.0 - h * 13.0 - u_t * 5.0);
    float life = smoothstep(0.0, 0.06, k) * (1.0 - smoothstep(0.55, 1.0, k));
    a = (core + sheath) * streak * top * life * (1.0 - 0.8 * smoothstep(0.35, 1.0, h)) * smoothstep(0.0, 0.05, h);
    col = mix(u_col, u_hot, clamp(core * core, 0.0, 1.0));
    body = core * a * 0.3;
  } else if (u_kind == 6) {
    // THE ROAR, AS PRESSURE: arcs racing out of the throat inside a cone, each
    // one torn by the same noise, the cone's edges soft.
    float cone = smoothstep(0.85, 0.3, abs(ang));
    float ph = r * 5.0 - k * 7.0;
    float arcs = pow(0.5 + 0.5 * sin(ph * 6.2832), 7.0);
    float tear = 0.4 + 0.9 * fbm(vec2(ang * 5.0 + u_seed, r * 4.0 - k * 5.0));
    a = cone * arcs * tear * smoothstep(0.02, 0.2, r) * smoothstep(1.0, 0.55, r) * (1.0 - k) * 1.1;
    a += exp(-r * r * 34.0) * (1.0 - k) * (1.0 - k) * 0.8;
    col = mix(u_col, u_hot, clamp(arcs * (1.0 - r) * 0.9, 0.0, 1.0));
  } else {
    // THE GATHER: light pulled INWARD along streaks to a core that swells —
    // a charge reads as storing only if nothing in it is venting.
    float streak = pow(ring(ang, 7.0, u_seed + r * 2.2 + u_t * 5.5), 3.0) * 5.0;
    float mask = smoothstep(1.0, 0.25, r) * smoothstep(0.04, 0.3, r);
    float core = exp(-r * r * (60.0 - 38.0 * k)) * (0.25 + 0.95 * k);
    float life = smoothstep(0.0, 0.12, k) * (1.0 - smoothstep(0.92, 1.0, k));
    a = (streak * mask * (0.25 + 0.75 * k) + core * 1.4) * life;
    col = mix(u_col, u_hot, clamp(core * 1.2, 0.0, 1.0));
    body = core * life * 0.3;
  }
  a = clamp(a * u_power, 0.0, 1.6);
  gl_FragColor = vec4(col * a, clamp(body * u_power, 0.0, 0.8));
}`;
function fxglInit() {
  if (FXGL.ok != null) return FXGL.ok;
  FXGL.ok = false;
  try {
    const cvs = document.createElement('canvas');
    // A SOFTWARE GPU IS NO GPU. With no graphics hardware the browser will
    // still hand out a WebGL context — rasterised on the CPU, and copied back
    // to the 2D canvas the slow way — and measured in the test browser that
    // cost enough per frame to slow the whole game while an effect was up
    // (tests/combat-impact-input.cjs: 0.9 s of real time no longer cleared a
    // 0.65 s particle). So the context is asked for on the condition that it
    // is fast; where it is not, this is the no-GPU case and the Canvas rings
    // draw. FXGL_FORCE lifts the condition for the harness and the film tool,
    // which need to see the layer on a machine that has no graphics card.
    const opts = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false };
    if (!(typeof window !== 'undefined' && window.FXGL_FORCE)) opts.failIfMajorPerformanceCaveat = true;
    const gl = cvs.getContext('webgl', opts);
    if (!gl) return false;
    // ...and Chromium's own software rasteriser does not count itself as a
    // caveat, so it is asked by name as well.
    if (opts.failIfMajorPerformanceCaveat) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const who = String((dbg && gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '');
      FXGL.renderer = who;
      if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(who)) { FXGL.err = 'software renderer: ' + who; return false; }
    }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, FXGL_VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FXGL_FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(pr, 'a_pos'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
    const loc = {};
    for (const n of ['u_res', 'u_c', 'u_h', 'u_rot', 'u_strip', 'u_k', 'u_t', 'u_seed', 'u_power', 'u_flip', 'u_kind', 'u_col', 'u_hot']) loc[n] = gl.getUniformLocation(pr, n);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);
    // a lost context is the no-GPU case arriving late: fall back, and try
    // again only when the browser says the context is back
    cvs.addEventListener('webglcontextlost', (e) => { e.preventDefault(); FXGL.ok = false; });
    cvs.addEventListener('webglcontextrestored', () => { FXGL.ok = null; FXGL.gl = null; });
    FXGL.cv = cvs; FXGL.gl = gl; FXGL.loc = loc; FXGL.ok = true;
  } catch (e) { FXGL.err = String(e && e.message || e); FXGL.ok = false; }
  return FXGL.ok;
}
// Is the shader layer drawing this frame? The legacy Canvas rings ask this and
// stand down when it is; G.fxLegacy forces them back (the harness diffs the two).
function fxglOn() { return !(typeof G !== 'undefined' && G.fxLegacy) && fxglInit(); }
const FX_RGB = {};
function fxRGB(c) {
  if (typeof c !== 'string') return c || [1, 1, 1];
  let v = FX_RGB[c];
  if (!v) {
    let m = /^#([0-9a-f]{6})$/i.exec(c), n;
    if (m) { n = parseInt(m[1], 16); v = [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
    else if ((m = /^#([0-9a-f]{3})$/i.exec(c))) { n = parseInt(m[1], 16); v = [((n >> 8) & 15) / 15, ((n >> 4) & 15) / 15, (n & 15) / 15]; }
    else if ((m = /rgba?\(([^)]+)\)/.exec(c))) { const p = m[1].split(',').map(Number); v = [p[0] / 255, p[1] / 255, p[2] / 255]; }
    else v = [1, 1, 1];
    FX_RGB[c] = v;
  }
  return v;
}
// fx('ground', x, y, { rx, ry, dur, col, hot, power, delay, flip, rot, follow })
// World units. `follow` is an entity whose centre the effect rides (a charge
// gathered by a body that is knocked back stays on the body).
function fx(kind, x, y, o) {
  if (FX_KIND[kind] == null) return null;
  if (typeof FOE_READ !== 'undefined' && FOE_READ.sil) return null;
  if (FXGL.list.length >= FXGL.max) FXGL.list.shift();
  const e = { kind: FX_KIND[kind], name: kind, x, y, t: 0, dur: 0.6, rx: 120, ry: 120, col: '#b06aff', hot: '#ffffff',
    seed: ((x * 7.3 + y * 13.1) % 61 + 61) % 61, rot: 0, power: 1, delay: 0, flip: false, follow: null, dx: 0, dy: 0 };
  if (o) for (const k2 in o) e[k2] = o[k2];
  if (e.follow) { e.dx = x - e.follow.x; e.dy = y - e.follow.y; }
  if (e.kind === 1 || e.kind === 2) fxProfile(e);
  FXGL.list.push(e); return e;
}
// THE GROUND UNDER A GROUND EFFECT. A wave or a fracture is laid on the terrain
// the room actually has: FX_SEG + 1 surface heights across its reach (a column
// every 7-9 px: a mound's face is steep, and at half as many the chord between
// two samples cut 20 px under it), read once when it is born (terrain does not
// move during a second of light).
//
// fxSurfaceY is the surface nearest a height in one column. Every tile top in
// reach is a candidate, and a top the room's heightfield rides on
// (groundColumnAt: [surface, the tile top under it]) is taken at the LIFTED
// surface — a mound is material added above its tile, and the first version of
// this took the tile top and drew the effect buried inside the hill. NaN when
// the column has no ground in reach.
//
// fxWalk follows that surface outward from the blow, each column looked up
// from its neighbour's height: the wave climbs a hill of any size the way it
// would run, and STOPS at a drop or a wall taller than a stride — everything
// beyond a cliff is NaN, so an effect ends at a ledge's edge instead of hanging
// off it in the air or pouring down its face.
const FX_SEG = 64;
function fxSurfaceY(wx, y0, reach) {
  if (typeof tileAt !== 'function' || typeof TILE === 'undefined') return NaN;
  const R = reach || 44;
  const gc = (typeof groundColumnAt === 'function') ? groundColumnAt(wx) : null;
  const tx = Math.floor(wx / TILE), solid = (ty) => { const ch = tileAt(tx, ty); return ch === '#' || ch === 'B' || ch === '='; };
  let best = NaN;
  // a lifted surface can stand up to a tile and a half over its tile top
  for (let ty = Math.floor((y0 - R) / TILE); ty <= Math.floor((y0 + R + TILE * 1.5) / TILE) + 1; ty++) {
    if (!solid(ty) || solid(ty - 1)) continue;
    // (the heightfield is sampled every few px and rounds to the nearer sample,
    // so in the last pixels before a step its tile top is the NEIGHBOUR's: a
    // match within one tile, not an exact one, or the surface drops a notch at
    // every step)
    const top = ty * TILE, y = gc && Math.abs(gc[1] - top) <= TILE + 2 && gc[0] <= top + 8 && gc[0] >= top - TILE * 1.6 ? gc[0] : top;
    if (Math.abs(y - y0) <= R && (isNaN(best) || Math.abs(y - y0) < Math.abs(best - y0))) best = y;
  }
  return best;
}
// out[0..n] = the surface from x - half to x + half, walked out from the centre
function fxWalk(x, y, half, n, out) {
  const c = n >> 1, stride = Math.max(18, 2 * half / n * 1.7);
  out[c] = fxSurfaceY(x - half + 2 * half * c / n, y, 56);
  for (const dir of [1, -1]) {
    let prev = out[c];
    for (let i = c + dir; i >= 0 && i <= n; i += dir) {
      out[i] = isNaN(prev) ? NaN : fxSurfaceY(x - half + 2 * half * i / n, prev, stride);
      prev = out[i];
    }
  }
  return !isNaN(out[c]);
}
function fxProfile(e) {
  const p = new Float32Array(FX_SEG + 1);
  // no terrain to read (a harness with no room, a blow in mid air): flat, as it was
  if (!(typeof G !== 'undefined' && G.grid && fxWalk(e.x, e.y, e.rx, FX_SEG, p))) for (let i = 0; i <= FX_SEG; i++) p[i] = e.y;
  e.prof = p;
}
// THE FLOOR UNDER A WIND-UP TAKES ITS LIGHT — the floor that is there. Every
// guardian's tell used to stroke an ELLIPSE at its foot line: the same ring on
// an imaginary floor plane, hung over the dips and through the mounds, and in
// mid air under a guardian that flies. This is the same amber laid along the
// real surface under the body: found by dropping from its feet (up to `drop`
// px, fainter the further the light has to fall), then followed left and right
// across the terrain, ending where the ground ends. Canvas, not the shader
// layer: it is part of the telegraph and has to exist with no GPU.
const TELL_FLOOR = new Float32Array(98);
function tellFloorLight(c, x, y, half, e) {
  if (typeof tileAt !== 'function' || typeof TILE === 'undefined') return;
  let yc = fxSurfaceY(x, y), fall = 0;
  if (isNaN(yc)) {
    const drop = 230, tx = Math.floor(x / TILE);
    for (let ty = Math.floor(y / TILE); ty * TILE <= y + drop; ty++) {
      const ch = tileAt(tx, ty);
      if (ch === '#' || ch === 'B' || ch === '=') { yc = fxSurfaceY(x, ty * TILE); if (isNaN(yc)) yc = ty * TILE; break; }
    }
    if (isNaN(yc)) return;                              // nothing under it to light
    fall = clamp((yc - y) / drop, 0, 1);
  }
  const n = Math.min(96, Math.max(6, Math.ceil(half * 2 / 7))) & ~1;
  if (!fxWalk(x, yc, half, n, TELL_FLOOR)) return;
  const a = (0.22 + e * 0.5) * (1 - fall * 0.55);
  const g = c.createLinearGradient(x - half, 0, x + half, 0);
  g.addColorStop(0, 'rgba(255,206,116,0)'); g.addColorStop(0.22, 'rgba(255,206,116,' + a + ')');
  g.addColorStop(0.5, 'rgba(255,236,184,' + Math.min(1, a * 1.25) + ')');
  g.addColorStop(0.78, 'rgba(255,206,116,' + a + ')'); g.addColorStop(1, 'rgba(255,206,116,0)');
  c.strokeStyle = g; c.lineCap = 'round'; c.lineJoin = 'round';
  // a wide soft pass sunk a little into the soil, then the lit lip of the surface
  for (let pass = 0; pass < 2; pass++) {
    c.globalAlpha = pass ? 1 : 0.32; c.lineWidth = pass ? 2 + e * 3 : 8 + e * 10;
    const dy = pass ? 0 : 3;
    c.beginPath();
    let pen = false;
    for (let i = 0; i <= n; i++) {
      const sy = TELL_FLOOR[i];
      if (isNaN(sy)) { pen = false; continue; }
      const wx = x - half + 2 * half * i / n;
      if (pen) c.lineTo(wx, sy + dy); else { c.moveTo(wx, sy + dy); pen = true; }
    }
    c.stroke();
  }
  c.globalAlpha = 1;
}
// one ground effect, as FX_SEG columns each standing on its own ground
function fxglStrip(gl, loc, m, e, k, W, H) {
  const p = e.prof, cx = m.a * e.x + m.e, cy = m.d * e.y + m.f;
  const hx = Math.abs(e.rx * m.a), hy = Math.abs(e.ry * (e.kind === 2 ? 1.5 : 1) * m.d);
  if (cx + hx < 0 || cx - hx > W || cy + hy + 90 < 0 || cy - hy - 90 > H) return;
  const col = fxRGB(e.col), hot = fxRGB(e.hot);
  gl.uniform2f(loc.u_c, cx, cy); gl.uniform2f(loc.u_h, hx, hy); gl.uniform1f(loc.u_rot, 0);
  gl.uniform1f(loc.u_k, k); gl.uniform1f(loc.u_t, e.t); gl.uniform1f(loc.u_seed, e.seed); gl.uniform1f(loc.u_power, e.power);
  gl.uniform1f(loc.u_flip, 1); gl.uniform1i(loc.u_kind, e.kind);
  gl.uniform3f(loc.u_col, col[0], col[1], col[2]); gl.uniform3f(loc.u_hot, hot[0], hot[1], hot[2]);
  for (let i = 0; i < FX_SEG; i++) {
    const yl = p[i], yr = p[i + 1];
    if (isNaN(yl) || isNaN(yr)) continue;               // no ground under this column
    gl.uniform4f(loc.u_strip, -1 + 2 * i / FX_SEG, -1 + 2 * (i + 1) / FX_SEG, (yl - e.y) * m.d, (yr - e.y) * m.d);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  FXGL.drawn++;
}
function fxglUpdate(dt) {
  const L = FXGL.list;
  for (let i = L.length - 1; i >= 0; i--) {
    const e = L[i]; e.t += dt;
    if (e.follow) { if (e.follow.dead) e.follow = null; else { e.x = e.follow.x + e.dx; e.y = e.follow.y + e.dy; } }
    if (e.t - e.delay >= e.dur || e.cut) L.splice(i, 1);
  }
}
function fxglQuad(gl, loc, m, kind, x, y, rx, ry, k, t, seed, col, hot, power, flip, rot, W, H) {
  const cx = m.a * x + m.e, cy = m.d * y + m.f, hx = Math.abs(rx * m.a), hy = Math.abs(ry * m.d);
  const ext = Math.max(hx, hy);
  if (cx + ext < 0 || cx - ext > W || cy + ext < 0 || cy - ext > H) return;
  gl.uniform2f(loc.u_c, cx, cy); gl.uniform2f(loc.u_h, hx, hy); gl.uniform1f(loc.u_rot, rot || 0);
  gl.uniform4f(loc.u_strip, -1, 1, 0, 0);
  gl.uniform1f(loc.u_k, k); gl.uniform1f(loc.u_t, t); gl.uniform1f(loc.u_seed, seed); gl.uniform1f(loc.u_power, power);
  gl.uniform1f(loc.u_flip, flip ? -1 : 1); gl.uniform1i(loc.u_kind, kind);
  gl.uniform3f(loc.u_col, col[0], col[1], col[2]); gl.uniform3f(loc.u_hot, hot[0], hot[1], hot[2]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); FXGL.drawn++;
}
// Called from drawWorldFrame with the WORLD transform on `c`.
function fxglDraw(c) {
  FXGL.drawn = 0;
  if (typeof G === 'undefined' || G.artProbe || !fxglOn()) return;
  const rings = G.rings || [], roars = typeof ROARFX !== 'undefined' ? ROARFX : [];
  if (!FXGL.list.length && !rings.length && !roars.length) return;
  const gl = FXGL.gl, cvs = FXGL.cv, loc = FXGL.loc, W = c.canvas.width, H = c.canvas.height;
  if (cvs.width !== W || cvs.height !== H) { cvs.width = W; cvs.height = H; }
  const m = c.getTransform();
  gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(loc.u_res, W, H);
  const zone = (typeof PAL !== 'undefined' && PAL[G.roomDef && G.roomDef.zone]) || null;
  const zoneGlow = fxRGB(zone ? zone.glow : '#7de8ff'), white = [1, 1, 1];
  // the legacy rings, from their own state: r is the radius update() grew, a
  // the alpha it decayed. The wave is drawn at that radius, in a quad a
  // quarter again as wide so its wake and breakup have room.
  for (const r of rings) {
    const k = 1 - clamp(r.a / (r.a0 || 0.85), 0, 1), R = Math.max(24, r.r);
    // shader front = 0.10 + 0.90*(1-(1-k)^2.6) of the quad's half-size
    const front = 0.10 + 0.90 * (1 - Math.pow(1 - k, 2.6));
    fxglQuad(gl, loc, m, 0, r.x, r.y, R / front, R / front, k, k, (r.seed | 0) % 61, r.col ? fxRGB(r.col) : zoneGlow, white, 1.15, false, 0, W, H);
  }
  for (const r of roars) {
    if (r.t < 0) continue;
    const col = fxRGB(r.col), halo = fxRGB(r.halo || r.col);
    if (r.flash) fxglQuad(gl, loc, m, 4, r.x, r.y, 170, 170, clamp(r.t / 0.24, 0, 1), r.t, 3, halo, white, 1.2, false, 0, W, H);
    else fxglQuad(gl, loc, m, 0, r.x, r.y, 330, 330, clamp(r.t / 0.9, 0, 1), r.t, r.seed || 1, halo, col[0] + col[1] + col[2] > 2.6 ? white : mixRGB(col, white, 0.6), 1.1, false, 0, W, H);
  }
  for (const e of FXGL.list) {
    const tt = e.t - e.delay; if (tt < 0) continue;
    if (e.prof) fxglStrip(gl, loc, m, e, clamp(tt / e.dur, 0, 1), W, H);
    else fxglQuad(gl, loc, m, e.kind, e.x, e.y, e.rx, e.ry, clamp(tt / e.dur, 0, 1), e.t, e.seed, fxRGB(e.col), fxRGB(e.hot), e.power, e.flip, e.rot, W, H);
  }
  if (!FXGL.drawn) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.drawImage(cvs, 0, 0); c.restore();
}
function mixRGB(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
