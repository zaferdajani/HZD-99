// CLAWBYTE — the shared material sheet and sensor ladder.
//
// Taken straight off the boss design sheets, which specify both. Every machine in
// the Depths is built from the same five materials, and every one of them carries
// the same four-state sensor: cyan while it is still itself, crimson once the Null
// Signal has it. That is what makes the faction read as one faction, and it is
// also the fix for the old art's real problem — one flat gradient smeared over
// every surface regardless of what the surface was made of or which way it faced.

const MAT = {
  // white ceramic: warm off-white, chipped and stained. The armour material.
  ceramic: { lit: '#fdfbf6', mid: '#e2dcd0', dark: '#9a9488', deep: '#4a463e' },
  // brushed steel: cool, mid-value, low specular. Frames and pistons.
  steel:   { lit: '#a8b2bc', mid: '#5f6a75', dark: '#333b43', deep: '#1b2127' },
  // oxidized bronze: warm, dirty gold. Joints, collars, fittings.
  bronze:  { lit: '#dcb268', mid: '#9a7638', dark: '#5c4520', deep: '#332711' },
  // cyan light: uncorrupted power. Never on an infected sensor.
  cyan:    { lit: '#c9fbff', mid: '#3fd8ee', dark: '#1b7d92' },
  // crimson corruption: the broadcast. Only ever this.
  crimson: { lit: '#ff8a90', mid: '#ff2f43', dark: '#7e1018' },
  // molten metal: the Foundry only.
  molten:  { lit: '#ffe0a8', mid: '#ff7a22', dark: '#8a2c08' },
  // frosted glass: the Archives only.
  frost:   { lit: '#f0fbff', mid: '#c2dee8', dark: '#6d8b98' },
};

// A ramp whose axis you choose, so a surface facing away from the light can be
// shaded differently from one facing into it. Pass the light direction per part.
function ramp(c, m, x0, y0, x1, y1, k) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  const s = k == null ? 1 : k;               // k<1 dims the whole part (facing away)
  const mix = (a, b, t) => {
    const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const A = p(a), B = p(b);
    return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')';
  };
  g.addColorStop(0, s >= 1 ? m.lit : mix(m.lit, m.dark, 1 - s));
  g.addColorStop(0.5, s >= 1 ? m.mid : mix(m.mid, m.dark, 1 - s));
  g.addColorStop(1, s >= 1 ? m.dark : mix(m.dark, m.deep, 1 - s));
  return g;
}

// contact/occlusion shadow between two parts. Its absence is what made the old
// art read as pieces pasted onto each other.
function occl(c, x, y, w, h, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, Math.max(w, h));
  g.addColorStop(0, 'rgba(6,10,14,' + (a == null ? 0.55 : a) + ')');
  g.addColorStop(1, 'rgba(6,10,14,0)');
  c.save(); c.fillStyle = g;
  c.beginPath(); c.ellipse(x, y, w, h, 0, 0, 7); c.fill();
  c.restore();
}

// ---------------------------------------------------------------------------
// The sensor ladder: IDLE -> ALERT -> LOCKED -> OVERDRIVE.
// Cyan means the machine is still running its own orders. Crimson means the
// broadcast is driving. The state IS the telegraph, so a player can read what a
// boss is about to do from its eye alone.
// ---------------------------------------------------------------------------
const SENSOR = {
  idle:      { m: MAT.cyan,    blur: 6,  rings: 1, spin: 0.4, pulse: 0.10 },
  alert:     { m: MAT.cyan,    blur: 11, rings: 2, spin: 1.6, pulse: 0.30 },
  locked:    { m: MAT.crimson, blur: 14, rings: 2, spin: 3.0, pulse: 0.45 },
  overdrive: { m: MAT.crimson, blur: 22, rings: 3, spin: 6.0, pulse: 0.75 },
};
function sensorState(e) {
  if (!e) return 'idle';
  if (e.overdriveT > 0 || e.phase >= 2) return 'overdrive';
  if (e.windT > 0 || e.stagT > 0) return 'locked';
  if (e.st && e.st !== 'dorm' && e.st !== 'intro') return 'alert';
  return 'idle';
}
// one eye, drawn the same way everywhere, so the whole faction speaks one language
function drawSensor(c, x, y, r, state, t) {
  const S = SENSOR[state] || SENSOR.idle, m = S.m;
  const p = 1 + Math.sin(t * (2 + S.spin)) * S.pulse;
  c.save(); c.translate(x, y);
  // recessed housing, so the lens sits IN the plate rather than on it
  c.fillStyle = MAT.steel.deep;
  c.beginPath(); c.arc(0, 0, r * 1.5, 0, 7); c.fill();
  occl(c, 0, 0, r * 1.7, r * 1.7, 0.5);
  c.fillStyle = m.dark;
  c.beginPath(); c.arc(0, 0, r * 1.15, 0, 7); c.fill();
  // the light
  c.shadowColor = m.mid; c.shadowBlur = S.blur * p;
  c.fillStyle = m.mid;
  c.beginPath(); c.arc(0, 0, r * p, 0, 7); c.fill();
  c.fillStyle = m.lit;
  c.beginPath(); c.arc(0, 0, r * 0.44 * p, 0, 7); c.fill();
  c.shadowBlur = 0;
  // targeting rings — they multiply and spin as it escalates
  c.strokeStyle = m.mid; c.lineWidth = Math.max(0.6, r * 0.13);
  for (let i = 0; i < S.rings; i++) {
    const rr2 = r * (1.5 + i * 0.55), a0 = t * S.spin + i * 1.1;
    c.beginPath(); c.arc(0, 0, rr2, a0, a0 + 1.5); c.stroke();
    c.beginPath(); c.arc(0, 0, rr2, a0 + Math.PI, a0 + Math.PI + 1.5); c.stroke();
  }
  c.restore();
}

// crimson tendrils — the corruption overlay the sheets show on every overdrive
// state. Drawn from an anchor, so it reads as growing OUT of the machine.
function tendrils(c, n, len, t, seed, alpha) {
  c.save();
  c.globalAlpha = alpha == null ? 0.9 : alpha;
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const base = (seed || 0) + i * 2.399;
    const a = base + Math.sin(t * 1.7 + i) * 0.5;
    c.strokeStyle = i % 3 ? MAT.crimson.mid : MAT.crimson.lit;
    c.shadowColor = MAT.crimson.mid; c.shadowBlur = 8;
    c.lineWidth = 2.2 - (i % 3) * 0.5;
    c.beginPath(); c.moveTo(0, 0);
    let px = 0, py = 0;
    for (let k = 1; k <= 3; k++) {
      const kk = k / 3, aa = a + Math.sin(t * 2.3 + i + k) * 0.55 * kk;
      px += Math.cos(aa) * len * 0.34; py += Math.sin(aa) * len * 0.34;
      c.lineTo(px, py);
    }
    c.stroke();
  }
  c.shadowBlur = 0; c.restore();
}

// chipped-edge wear: ceramic in the Depths is never clean. Cheap, and it is the
// difference between "moulded plastic" and "a thing that has been working for a
// century".
function wear(c, pts, seed) {
  c.save(); c.fillStyle = 'rgba(58,55,48,0.5)';
  for (let i = 0; i < pts.length; i++) {
    const [x, y, s] = pts[i];
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + s, y + s * 0.6); c.lineTo(x + s * 0.3, y + s); c.closePath(); c.fill();
  }
  c.restore();
}
