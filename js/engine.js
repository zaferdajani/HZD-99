// CLAWBYTE — input, camera, particles, helpers
const KEYB = {
  LEFT: ['ArrowLeft', 'KeyA', 'VL'], RIGHT: ['ArrowRight', 'KeyD', 'VR'],
  UP: ['ArrowUp', 'KeyW', 'VU'], DOWN: ['ArrowDown', 'KeyS', 'VD'],
  JUMP: ['KeyZ', 'Space', 'VJUMP'], ATK: ['KeyX', 'KeyJ', 'VATK'],
  DASH: ['KeyC', 'ShiftLeft', 'ShiftRight', 'VDASH'], CAST: ['KeyV', 'KeyK', 'VCAST'],
  HEAL: ['KeyF', 'KeyH', 'VHEAL'], INT: ['KeyE', 'VINT'],
  MAP: ['Tab', 'KeyM', 'VMAP'], CREST: ['KeyI', 'VCREST'], SKILL: ['KeyT', 'VSKILL'],
  PAUSE: ['Escape', 'KeyP', 'VPAUSE'],
  OK: ['Enter', 'KeyZ', 'Space', 'VOK'], BACK: ['Escape', 'VBACK'],
};
const keys = {}, keysP = {};
addEventListener('keydown', e => {
  if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!e.repeat) { keys[e.code] = 1; keysP[e.code] = 1; }
  audioOn();
});
addEventListener('keyup', e => { keys[e.code] = 0; });
addEventListener('blur', () => { for (const k in keys) keys[k] = 0; });
function inD(n) { return KEYB[n].some(c => keys[c]); }
function inP(n) { return KEYB[n].some(c => keysP[c]); }
function clearP() { for (const k in keysP) keysP[k] = 0; }

const cam = { x: 0, y: 0, shake: 0 };
function updateCam(px, py, rw, rh, dt) {
  // look-ahead in the facing direction; snappier horizontally than vertically
  const lead = (typeof player !== 'undefined' && player && !player.dead) ? player.face * 65 : 0;
  const tx = clamp(px - 480 + lead, 0, Math.max(0, rw - 960));
  const ty = clamp(py - 300, 0, Math.max(0, rh - 540));
  cam.x = lerp(cam.x, tx, 1 - Math.pow(0.0002, dt));
  cam.y = lerp(cam.y, ty, 1 - Math.pow(0.0035, dt));
  cam.shake = Math.max(0, cam.shake - dt * 22);
}
function camSX() { return cam.x + (cam.shake > 0 ? rnd(-cam.shake, cam.shake) : 0); }
function camSY() { return cam.y + (cam.shake > 0 ? rnd(-cam.shake, cam.shake) : 0); }

let parts = [];
function addPart(x, y, vx, vy, life, color, size, grav, glow) {
  if (parts.length > 600) return;
  parts.push({ x, y, vx, vy, life, life0: life, color, size: size || 3, grav: grav == null ? 600 : grav, glow: !!glow });
}
function burst(x, y, n, color, sp, life, grav, size, glow) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), s = rnd(sp * 0.3, sp);
    addPart(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd((life || 0.6) * 0.5, life || 0.6), color, rnd(1.5, size || 4), grav, glow);
  }
}
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
}
function drawParts(c) {
  for (const p of parts) {
    c.globalAlpha = Math.max(0, p.life / p.life0);
    if (p.glow) { c.shadowColor = p.color; c.shadowBlur = 10; }
    c.fillStyle = p.color;
    c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    c.shadowBlur = 0;
  }
  c.globalAlpha = 1;
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, k) { return a + (b - a) * k; }
function rnd(a, b) { return a + Math.random() * (b - a); }
function irnd(a, b) { return Math.floor(rnd(a, b + 1)); }
function chance(p) { return Math.random() < p; }
function hash2(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
