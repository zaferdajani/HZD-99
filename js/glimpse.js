// ===========================================================================
// THE GLIMPSE — NULLFANG, seen before he is met (owner's order, 2026-11-14,
// hook review item 3: "show NULLFANG early. A shadow or roar in the first two
// minutes raises the question; the meeting on the crest then answers it").
//
// The meeting on the A2 crest is the chapter's strongest beat and it arrives
// after the booth, the meadow and Old Servo — a long time to have been promised
// nothing. So the first thing past the city gates is him: a dark shape standing
// in the road beyond the booth, watching her come in. He roars once and bounds
// away east, the way she is going.
//
// What this is NOT: a fight, a cutscene, or an entity. She keeps her controls
// the whole time; nothing can be hit and nothing hits; the lesson chips carry
// on underneath. It is drawn with his own strips (idle, roar, gallop — no new
// art) under every body, darkened, because at this distance in this light he
// is a shape with a question attached, not yet a character. Walk at him and he
// goes sooner. Once per save (flags.nfGlimpse), never after the real meeting.
// ===========================================================================
const GLIMPSE = { on: false, t: 0, ph: '', x: 0, y: 0, roared: false };
// WHERE HE STANDS: past the jammed winch (tile 20), on the far side of the one
// thing blocking the road — so what the frame holds as she comes through the
// gates is his HEAD AND SHOULDERS at its right edge, eyes lit, and the rest of
// him is out of the picture. At his full size (he is the height of the booth)
// the whole animal in the middle of the screen was not a glimpse, it was the
// meeting, twenty minutes early and standing still. The winch is drawn over
// his feet, which is also the truth: she cannot get to him.
const GLIMPSE_AT = 22.5;
const GLIMPSE_KEYS = ['beastStudioIdle', 'beastStudioRoar', 'beastGallop'];
const GLIMPSE_DARK = 'brightness(0.22) saturate(0.6)';
function glimpseReady() {
  return typeof MEDIA_RAW !== 'undefined' && GLIMPSE_KEYS.every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth);
}
function glimpseTick(dt) {
  if (typeof opOn !== 'function' || !opOn() || !player || !G.save) return;
  const f = G.save.flags;
  // his art is asked for a room early, so it has landed by the time she is through the gates
  if (!f.nfGlimpse && !f.nfMeet && (G.roomId === 'W2' || G.roomId === 'A0') && typeof mediaFetch === 'function')
    for (const k of GLIMPSE_KEYS) mediaFetch(k, 1);
  if (!GLIMPSE.on) {
    if (G.roomId !== 'A0' || f.nfGlimpse || f.nfMeet || f.ratchetRepaired) return;
    if (G.state !== 'PLAY' || G.dialog || G.cut || G.gateWalk || G.wake || !player.on) return;
    // just inside the gates, with the road ahead of her on screen — and his art here
    if (player.x > 8 * TILE || !glimpseReady()) return;
    const gx = GLIMPSE_AT * TILE;
    const gc = typeof groundColumnAt === 'function' ? groundColumnAt(gx) : null;
    Object.assign(GLIMPSE, { on: true, t: 0, ph: 'watch', x: gx, roared: false,
      y: gc ? Math.min(gc[0], gc[1]) : (G.roomDef.h - 2) * TILE });
    f.nfGlimpse = 1;
    if (typeof persist === 'function') persist();
    return;
  }
  if (G.roomId !== 'A0') { GLIMPSE.on = false; return; }
  GLIMPSE.t += dt;
  const near = Math.abs(player.x + player.w / 2 - GLIMPSE.x) < 190;
  if (GLIMPSE.ph === 'watch' && (GLIMPSE.t > 1.7 || near)) { GLIMPSE.ph = 'roar'; GLIMPSE.t = 0; }
  if (GLIMPSE.ph === 'roar') {
    // the sound lands on the frame his head goes back, not on the cut
    if (!GLIMPSE.roared && GLIMPSE.t > 0.28) {
      GLIMPSE.roared = true;
      if (typeof beastSound === 'function') beastSound('roar');
      cam.shake = Math.max(cam.shake, 5);
    }
    if (GLIMPSE.t > 1.15 || (near && GLIMPSE.t > 0.5)) { GLIMPSE.ph = 'leave'; GLIMPSE.t = 0; if (typeof beastSound === 'function') beastSound('leap'); }
  }
  if (GLIMPSE.ph === 'leave') {
    // off the mark fast and faster: gone east, the way the road runs
    GLIMPSE.x += (380 + GLIMPSE.t * 520) * dt;
    if (GLIMPSE.x > cam.x + 960 + 420 || GLIMPSE.t > 3) GLIMPSE.on = false;
  }
}
// drawn in WORLD space on the ground layer: under her, the booth's people and the winch
function drawGlimpse(c) {
  if (!GLIMPSE.on || G.roomId !== 'A0' || typeof drawStripCell !== 'function') return;
  const H = 256 * (typeof BEAST_STRIP_PX === 'number' ? BEAST_STRIP_PX : 1.33);
  const g = GLIMPSE, canFilter = typeof c.filter === 'string';
  c.save();
  if (canFilter) c.filter = GLIMPSE_DARK;
  // he fades up out of the dark of the road rather than popping into it
  c.globalAlpha = g.ph === 'watch' ? Math.min(1, g.t / 0.45) : 1;
  if (typeof contactShadow === 'function' && !(G.artProbe)) contactShadow(c, g.x, g.y, 110, 0.45);
  if (g.ph === 'watch') {
    drawStripCell(c, 'beastStudioIdle', Math.floor(g.t * 8) % 6, 24, g.x, g.y, H, false);       // his strips face LEFT: at her
  } else if (g.ph === 'roar') {
    drawStripCell(c, 'beastStudioRoar', Math.min(29, 4 + Math.floor(g.t * 22)), 30, g.x, g.y, H, false);
  } else {
    drawStripCell(c, 'beastGallop', Math.floor(g.t * 26) % 24, 24, g.x, g.y, H, true);          // flipped: away east
  }
  c.restore();
  // the one thing that is not dark: his eyes, while he is looking at her
  if (g.ph !== 'leave' && !G.artProbe) {
    const k = 0.55 + Math.sin(performance.now() / 180) * 0.25;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, g.t / 0.5 + (g.ph === 'roar' ? 1 : 0)) * k;
    // (measured off the idle and roar cells: the near eye, facing left)
    const ex = g.x - H * 0.54, ey = g.y - H * 0.41;
    const gr = c.createRadialGradient(ex, ey, 0, ex, ey, 9);
    gr.addColorStop(0, 'rgba(255,120,150,0.95)'); gr.addColorStop(1, 'rgba(255,60,110,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fill();
    c.restore();
  }
}
