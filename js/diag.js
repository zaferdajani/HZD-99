// THE INSTRUMENT FOR A SCREEN I CANNOT SEE — `?diag=1`
//
// This exists because three faults in a row were reported off a phone and
// could not be reproduced here: a shop washed out in light that measures
// rock-steady in this container (mean luminance span 1.3 over 900 frames), a
// picture "flipping like a movie" on a build whose LIFT_K does not move, and a
// figure that appeared twice on a body whose drawn left edge does not shift by
// a pixel across its whole work loop. Every one of those was answered with a
// guess about a device, and guessing cost an evening and shipped a regression.
//
// So: the game says what it is doing, on the machine it is doing it on. One
// screenshot of this overlay answers in ten seconds what a day of emulation
// could not — which quality tier the phone actually chose, how big the
// backbuffer really is, where the adaptive lift has settled, and, for the room
// on screen, whether every plate is the full sheet or still the quarter-scale
// stand-in that reads as "blurry and full of light".
//
// It is OFF unless the URL says otherwise, it draws after everything else, it
// allocates nothing per frame beyond the strings it prints, and it is never
// reachable by a player who did not type it. `?diag=1` for the panel; add
// `&diag=2` for the per-key art list, which is long.
let DIAG = 0;
try { DIAG = +(new URLSearchParams(location.search).get('diag') || 0) | 0; } catch (e) { DIAG = 0; }
// a rolling window of frame times and frame luminance: "is it flickering" is a
// question about a SEQUENCE, and a single number cannot answer it
const DIAG_N = 120;
const diagMs = [], diagLum = [];
let diagCv = null, diagLast = 0, diagNext = 0;
function diagSample() {
  const now = performance.now();
  if (diagLast) { diagMs.push(now - diagLast); if (diagMs.length > DIAG_N) diagMs.shift(); }
  diagLast = now;
  // the luminance probe is the same trick liftProbe uses and costs the same:
  // one small readback, four times a second, never once per frame
  if (now < diagNext) return;
  diagNext = now + 250;
  try {
    if (!diagCv) { diagCv = document.createElement('canvas'); diagCv.width = 32; diagCv.height = 18; }
    const x = diagCv.getContext('2d', { willReadFrequently: true });
    x.drawImage(c.canvas, 0, 0, 32, 18);
    const d = x.getImageData(0, 0, 32, 18).data;
    let L = 0;
    for (let i = 0; i < d.length; i += 4) L += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    diagLum.push(L / (32 * 18));
    if (diagLum.length > 48) diagLum.shift();
  } catch (e) { /* a tainted canvas: the rest of the panel still reports */ }
}
// what the lazy map has for a key, in the words the reader needs: a plate that
// is still the small copy is the whole of the "blurry" complaint
function diagTier(k) {
  const low = (typeof MEDIA_LOW !== 'undefined' && MEDIA_LOW[k]) | 0;
  if (low === 3) return 'full';
  if (low === 2) return 'LOW';                 // the quarter-scale stand-in is on screen
  if (typeof MEDIA_PEND !== 'undefined' && MEDIA_PEND[k]) return 'wait';
  if (typeof MEDIA_RAW !== 'undefined' && MEDIA_RAW[k]) return 'full';
  return 'none';
}
function drawDiag() {
  if (!DIAG) return;
  diagSample();
  const cvEl = document.getElementById('cv');
  const ms = diagMs.length ? diagMs.reduce((a, b) => a + b, 0) / diagMs.length : 0;
  const worst = diagMs.length ? Math.max.apply(null, diagMs) : 0;
  const lo = diagLum.length ? Math.min.apply(null, diagLum) : 0;
  const hi = diagLum.length ? Math.max.apply(null, diagLum) : 0;
  const rows = [
    'BUILD ' + ((typeof window !== 'undefined' && window.BUILD_ID) || '?') + '   ' + G.roomId,
    'tier ' + ((typeof QUAL !== 'undefined' && QUAL.name) || '?')
      + '  bloom ' + ((typeof QUAL !== 'undefined' && QUAL.bloom) ? 'on' : 'off')
      + '  glow ' + ((typeof QUAL !== 'undefined' && QUAL.glow) ? 'on' : 'off')
      + '  RS ' + ((typeof RS === 'number') ? RS.toFixed(2) : '?'),
    'backbuffer ' + (cvEl ? cvEl.width + 'x' + cvEl.height : '?')
      + '  box ' + (cvEl && cvEl.style.width ? cvEl.style.width : 'auto')
      + '  dpr ' + (window.devicePixelRatio || 1),
    'frame ' + ms.toFixed(1) + 'ms avg, ' + worst.toFixed(0) + 'ms worst',
    // THE FLICKER LINE. A picture that "flips like a movie" is a luminance
    // SPAN over time, so the span is what is printed — a steady room reads
    // under 2 and the shop measured 1.3 here.
    'frame light ' + lo.toFixed(0) + '-' + hi.toFixed(0) + '  span ' + (hi - lo).toFixed(1)
      + '   LIFT_K ' + ((typeof LIFT_K === 'number') ? LIFT_K.toFixed(2) : '?')
      + '  bright ' + ((typeof BRIGHT_SET === 'number') ? BRIGHT_SET : '?'),
  ];
  // the room's own art, and whether any of it is still the stand-in
  const M = (typeof window !== 'undefined' && window.ROOM_ASSETS) || null;
  const keys = (M && M.rooms && M.rooms[G.roomId] && M.rooms[G.roomId].keys) || [];
  if (keys.length) {
    const lowOnes = keys.filter(k => diagTier(k) === 'LOW');
    const waiting = keys.filter(k => diagTier(k) === 'wait' || diagTier(k) === 'none');
    rows.push('room art ' + keys.length + ' keys   still small: ' + (lowOnes.length || 'none')
      + '   not here: ' + (waiting.length || 'none'));
    if (lowOnes.length) rows.push('  LOW: ' + lowOnes.slice(0, 6).join(' '));
    if (waiting.length) rows.push('  MISSING: ' + waiting.slice(0, 6).join(' '));
    if (DIAG > 1) for (const k of keys.slice(0, 18)) rows.push('  ' + diagTier(k).padEnd(5) + k);
  } else {
    rows.push('room art: manifest has no entry for this room');
  }
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.font = '600 11px ui-monospace, Menlo, Consolas, monospace';
  let w = 0;
  for (const r of rows) w = Math.max(w, c.measureText(r).width);
  const H = rows.length * 14 + 12;
  c.fillStyle = 'rgba(4,8,14,0.86)';
  c.fillRect(6, 6, w + 16, H);
  c.strokeStyle = 'rgba(120,200,255,0.5)'; c.lineWidth = 1;
  c.strokeRect(6.5, 6.5, w + 15, H - 1);
  c.textAlign = 'left'; c.textBaseline = 'top';
  for (let i = 0; i < rows.length; i++) {
    // the two lines a reader is looking for are coloured: a stand-in still on
    // screen, and a frame whose light is moving
    const r = rows[i];
    c.fillStyle = /LOW|MISSING|still small: [1-9]/.test(r) ? '#ffd76a'
      : /span ([2-9]|\d\d)/.test(r) ? '#ff8a5c' : '#cfe3ef';
    c.fillText(r, 14, 12 + i * 14);
  }
  c.restore();
}
