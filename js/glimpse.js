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
const GLIMPSE = { on: false, t: 0, ph: '', x: 0, y: 0, roared: false, lift: 0, leapt: false };
// WHERE HE STANDS: past the jammed winch (tile 20), on the far side of the one
// thing blocking the road — so what the frame holds as she comes through the
// gates is his HEAD AND SHOULDERS at its right edge, eyes lit, and the rest of
// him is out of the picture. At his full size (he is the height of the booth)
// the whole animal in the middle of the screen was not a glimpse, it was the
// meeting, twenty minutes early and standing still. The winch is drawn over
// his feet, which is also the truth: she cannot get to him.
const GLIMPSE_AT = 22.5;
const GLIMPSE_KEYS = ['beastStudioIdle', 'beastStudioRoar', 'beastGallop'];
// HE TURNS AND LEAPS AWAY (owner, 2026-11-19: "when NULLFANG first shows and
// jumps back, it's jumping backward instead of an actual realistic jump back").
// The leave used to be one frame of facing her, then the next frame his run
// cycle mirrored and sliding east on the flat — at the frame's edge, where only
// his head and shoulders were in the picture, the head vanished and his
// hindquarters slid away: an animal that snapped round and went backwards. A
// lion leaves the way the fight's own lion does: the filmed TURN (head first,
// spine after, hind feet walking the arc), the filmed SPRING off the haunches
// with real height under it, the landing, and only then the run.
// Asked for with the others; the leave falls back to the run alone if they are
// somehow not here yet, so a slow phone still sees him go.
const GLIMPSE_LEAVE_KEYS = ['beastStudioTurn', 'beastStudioLeap'];
const GLIMPSE_TURN_T = 0.55;     // the turn, seconds
const GLIMPSE_LEAP_T = 0.8;      // crouch, spring, flight, landing
const GLIMPSE_LEAP_DX = 340;     // the ground the spring covers, world px
const GLIMPSE_LEAP_UP = 92;      // the height of the arc at its top, world px
// where the STANDING animal stands in each take's cells (strip px right of the
// cell centre, the art facing LEFT) — beast.js BEAST_STRIP / BEAST_TURN, the
// takes' own anchors. Drawing every take at the same spot without these is
// what made him hop sideways at each change of take.
const GLIMPSE_AX = { beastStudioRoar: 3.1, beastStudioTurn: 0.7, beastStudioLeap: 25.7, beastGallop: 8.2 };
const GLIMPSE_DARK = 'brightness(0.22) saturate(0.6)';
function glimpseReady() {
  // ALL of him, the turn and the spring included: the leave without them is the
  // backwards slide the owner refused, so he does not appear until he can go
  // properly (the art is asked for a room early, in W2)
  return typeof MEDIA_RAW !== 'undefined' && GLIMPSE_KEYS.concat(GLIMPSE_LEAVE_KEYS).every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth);
}
function glimpseTick(dt) {
  if (typeof opOn !== 'function' || !opOn() || !player || !G.save) return;
  const f = G.save.flags;
  // his art is asked for a room early, so it has landed by the time she is through the gates
  if (!f.nfGlimpse && !f.nfMeet && (G.roomId === 'W2' || G.roomId === 'A0') && typeof mediaFetch === 'function')
    for (const k of GLIMPSE_KEYS.concat(GLIMPSE_LEAVE_KEYS)) mediaFetch(k, 1);
  if (!GLIMPSE.on) {
    if (G.roomId !== 'A0' || f.nfGlimpse || f.nfMeet || f.ratchetRepaired) return;
    if (G.state !== 'PLAY' || G.dialog || G.cut || G.gateWalk || G.wake || !player.on) return;
    // just inside the gates, with the road ahead of her on screen — and his art here
    if (player.x > 8 * TILE || !glimpseReady()) return;
    const gx = GLIMPSE_AT * TILE;
    const gc = typeof groundColumnAt === 'function' ? groundColumnAt(gx) : null;
    Object.assign(GLIMPSE, { on: true, t: 0, ph: 'watch', x: gx, roared: false, lift: 0, leapt: false,
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
    if (GLIMPSE.t > 1.15 || (near && GLIMPSE.t > 0.5)) {
      GLIMPSE.ph = 'leave'; GLIMPSE.t = 0; GLIMPSE.lift = 0; GLIMPSE.leapt = false;
      // the turn and the spring are filmed; without them (a slow phone, the
      // files not here yet) he goes straight to the run, as he always did
      GLIMPSE.full = GLIMPSE_LEAVE_KEYS.every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth);
      GLIMPSE.x0 = GLIMPSE.x;
      if (!GLIMPSE.full && typeof beastSound === 'function') beastSound('leap');
    }
  }
  if (GLIMPSE.ph === 'leave') {
    const T = GLIMPSE.t, turnEnd = GLIMPSE.full ? GLIMPSE_TURN_T : 0, leapEnd = turnEnd + (GLIMPSE.full ? GLIMPSE_LEAP_T : 0);
    GLIMPSE.lift = 0;
    if (T < turnEnd) {
      // the turn is on the spot: the paws walk the arc, the body does not slide
    } else if (T < leapEnd) {
      // the crouch is the first fifth (on the ground, loading the haunches),
      // then the flight: forward at an even pace, and UP and down on a true arc
      const u = (T - turnEnd) / GLIMPSE_LEAP_T, fl = clamp((u - 0.2) / 0.72, 0, 1);
      if (u >= 0.2 && !GLIMPSE.leapt) { GLIMPSE.leapt = true; if (typeof beastSound === 'function') beastSound('leap'); }
      GLIMPSE.x = GLIMPSE.x0 + GLIMPSE_LEAP_DX * fl;
      GLIMPSE.lift = GLIMPSE_LEAP_UP * 4 * fl * (1 - fl);
    } else {
      // landed running, faster and faster: gone east, the way the road runs
      const r = T - leapEnd;
      GLIMPSE.x += (430 + r * 520) * dt;
    }
    if (GLIMPSE.x > cam.x + 960 + 420 || T > leapEnd + 3) GLIMPSE.on = false;
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
  // the shadow stays on the ground and shrinks as he rises off it
  const lifted = clamp(1 - g.lift / (GLIMPSE_LEAP_UP * 1.6), 0.35, 1);
  if (typeof contactShadow === 'function' && !(G.artProbe)) contactShadow(c, g.x, g.y, 110 * lifted, 0.45 * lifted);
  if (g.ph === 'watch') {
    drawStripCell(c, 'beastStudioIdle', Math.floor(g.t * 8) % 6, 24, g.x, g.y, H, false);       // his strips face LEFT: at her
  } else if (g.ph === 'roar') {
    drawStripCell(c, 'beastStudioRoar', Math.min(29, 4 + Math.floor(g.t * 22)), 30, g.x, g.y, H, false);
  } else {
    // every take is drawn with its own standing spot on the animal's spot, so
    // the cut from one take to the next does not shove him sideways
    // (the roar is drawn on g.x as it always was, so the animal stands where
    // the roar's take puts him, and every later take is put on that spot)
    const px = H / 256, spot = g.x + GLIMPSE_AX.beastStudioRoar * px;
    const at = (key, flip, root) => spot + (flip ? 1 : -1) * ((GLIMPSE_AX[key] || 0) - (root || 0)) * px;
    const T = g.t, turnEnd = g.full ? GLIMPSE_TURN_T : 0, leapEnd = turnEnd + (g.full ? GLIMPSE_LEAP_T : 0);
    if (T < turnEnd) {
      // filmed LEFT to RIGHT: from facing her to facing east, unmirrored
      drawStripCell(c, 'beastStudioTurn', Math.min(23, Math.floor(T / GLIMPSE_TURN_T * 24)), 24, at('beastStudioTurn', false), g.y, H, false);
    } else if (T < leapEnd) {
      // the pounce take from the end of its crouch through its landing,
      // mirrored to face east; `root` is the take's own drift forward
      const u = (T - turnEnd) / GLIMPSE_LEAP_T, cell = Math.min(27, 7 + Math.floor(u * 21));
      const root = 17 * clamp((cell - 10) / 14, 0, 1);
      drawStripCell(c, 'beastStudioLeap', cell, 30, at('beastStudioLeap', true, root), g.y - g.lift, H, true);
    } else {
      drawStripCell(c, 'beastGallop', Math.floor((T - leapEnd) * 26) % 24, 24, at('beastGallop', true), g.y, H, true);   // flipped: away east
    }
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
