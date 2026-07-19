// CLAWBYTE — Rustsong (Mrr-Koda), the constructed language of the Machine Depths.
// Fully invented for this game. Complete spec: clawbyte/RUSTSONG.md
// Grammar: SOV order · plural = reduplicated first syllable · past -ta · future -su
// negation nu- · "va" = of · base-8 numbers.
const RS_LEX = {
  // a taste of the lexicon (full table in RUSTSONG.md)
  mrrka: 'cat', tekk: 'machine', vizrr: 'virus', korv: 'core', zolt: 'light',
  shurk: 'dark', skarn: 'scrap', karrn: 'claw', dunvo: 'the Depths', gorrt: 'gate',
  kivt: 'key', sommk: 'sleep', nurrk: 'death', havk: 'life', vak: 'go',
  sirr: 'see', karv: 'fight', zuvak: 'purge', orrv: 'wake', krant: 'break',
  tavk: 'make', kodav: 'speak', murrn: 'remember', shuk: 'seal', mi: 'I',
  tu: 'you', za: 'it', vorn: 'old', nir: 'new', muk: 'strange', hulk: 'cold',
  nul: '0', ka: '1', zu: '2', mir: '3', tov: '4', hesh: '5', rin: '6', sav: '7', okta: '8',
};
// Rustsong originals of the three lore terminals (translations shown below them in-game)
const RS_TERM = {
  1: 'zakk nota hesh okta sav — dun gorrt shukta — signa muk sirrta — hej tu za sirr, nu os kodav za',
  2: 'arkiv pett, surn zu nul zu zu — vizrr nu krant — vizrr os tavk — zat vor nurrku',
  3: 'hulk skarn nota — prizmrr sav va krest skratta — za krizt dunvo vakta',
};
const RS_TITLE = 'karrn va tekk';   // "claw of the machine"

// ---- glyph script: stable, angular circuit-marks, one glyph per letter ----
const rsCache = {};
function rsStrokes(ch) {
  if (rsCache[ch]) return rsCache[ch];
  const n = ch.charCodeAt(0);
  const gx = i => Math.floor(hash2(n, i * 3.7) * 3) / 2;          // 0, .5, 1
  const gy = i => Math.floor(hash2(n, i * 5.3 + 40) * 4) / 3;     // 0, 1/3, 2/3, 1
  const pts = [];
  for (let i = 0; i < 4; i++) {
    let p = [gx(i), gy(i)];
    if (pts.length && p[0] === pts[pts.length - 1][0] && p[1] === pts[pts.length - 1][1])
      p = [(p[0] + 0.5) % 1.001, p[1]];
    pts.push(p);
  }
  const s = { pts, dot: hash2(n, 99) > 0.55, vowel: 'aiou'.indexOf(ch) >= 0 };
  rsCache[ch] = s;
  return s;
}
function drawGlyphText(c, str, x, y, size, color, glow) {
  const cw = size * 0.82, gap = size * 0.42;
  const tw = str.split('').reduce((w, ch) => w + (ch === ' ' ? gap * 1.6 : cw), 0);
  let px = x - tw / 2;
  c.save();
  c.strokeStyle = color; c.fillStyle = color;
  c.lineWidth = Math.max(1.2, size * 0.13); c.lineCap = 'round'; c.lineJoin = 'round';
  if (glow) { c.shadowColor = glow; c.shadowBlur = 8; }
  for (const ch of str) {
    if (ch === ' ') { px += gap * 1.6; continue; }
    const g = rsStrokes(ch.toLowerCase());
    c.beginPath();
    g.pts.forEach((p, i) => {
      const X = px + p[0] * (cw - gap * 0.4), Y = y - size / 2 + p[1] * size;
      if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
    });
    c.stroke();
    if (g.dot) {
      c.beginPath(); c.arc(px + cw * 0.5, y - size * 0.62, size * 0.09, 0, 7); c.fill();
    }
    if (g.vowel) {
      c.beginPath(); c.moveTo(px, y + size * 0.62); c.lineTo(px + cw - gap * 0.4, y + size * 0.62); c.stroke();
    }
    px += cw;
  }
  c.restore();
}
