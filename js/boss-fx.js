// ===========================================================================
// EVERY GUARDIAN'S BLOW HAS LIGHT ON IT (owner, 2026-11-15: "improve the
// fights for all the sages and the microbosses").
//
// The shader layer (js/fxgl.js) was built for NULLFANG and, until today, only
// NULLFANG used it: its coil gathers light, its claw draws an arc, its landing
// runs a wave through the terrain and cracks it. The other five sages and the
// seven micro-bosses wound up, struck and landed with a burst of sparks each.
// This is the same three beats for all of them, from ONE rule rather than
// twelve hand-written ones — so a guardian added later gets them by being a
// guardian:
//
//   THE WIND-UP GATHERS. Entering any state TELL_ST calls a wind-up (the same
//     test that gives it the warning sound and the amber) with at least 0.3 s
//     to run pulls light in toward the body for exactly as long as the tell
//     lasts — re-read every frame, because a tell's length is not final when
//     it begins (the motion pass and the fairness pass both lengthen some). It is the tell's own amber, so it can only make a warning easier
//     to see; it is cut the moment a wind-up is broken off.
//   THE STRIKE LANDS WITH LIGHT. Leaving a wind-up into the blow fires one
//     effect AT THE BODY — an arc in front of it for a blow named like a
//     claw, a ring for one named like a roar, a flash for the rest. It never
//     claims a reach: nothing here is drawn further out than the body's own
//     size, because an effect that shows a radius the blow does not have is a
//     lie about where it is safe to stand.
//   THE LANDING GOES THROUGH THE GROUND. A guardian that walks, coming down
//     hard, sends a wave along the terrain it landed on and cracks it — the
//     same terrain-following effect the lion's landing has.
//
// NULLFANG and the Alpha keep their own hand-placed effects and are skipped.
// Ground-anchored light respects G.artProbe, like all of it.
// ===========================================================================
const BOSS_FX_OWN = { glitch: 1, alpha: 1 };
// [the effect's colour, its hot core] — each guardian's own light. The Eye's
// constructs share the Eye's violet.
const BOSS_FX_COL = {
  brood: ['#ffd27a', '#fff6df'], atlas: ['#ff7a2a', '#fff0d8'], zero: ['#8fdcff', '#ffffff'],
  prism: ['#c69bff', '#ffffff'], mother: ['#ff5fa2', '#ffe9f2'], horn: ['#ffb15a', '#fff6df'],
};
const BOSS_FX_EYE = ['#b06aff', '#f4e6ff'];
const BOSS_FX_ARC = /swipe|claw|slash|rake|gore|toss|lance|stab|peck|talon|bite|kick|horn|cut|rend/i;
const BOSS_FX_RING = /nova|ring|pulse|roar|hymn|bell|song|scream|quake|stomp|slam|burst|wave/i;
const BOSS_FX_MIN_TELL = 0.3;
function bossFxTell(st) { return typeof TELL_ST !== 'undefined' && TELL_ST.test(String(st || '')); }
function bossFxStep(b, dt, old) {
  if (!b || BOSS_FX_OWN[b.kind] || typeof fx !== 'function' || !old) return;
  if (b.dead || b.purified || b.meet || b.st === 'dorm' || b.st === 'intro') { bossFxCut(b); return; }
  const was = old.st, now = b.st;
  const col = BOSS_FX_COL[b.kind] || BOSS_FX_EYE;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  if (was !== now) {
    const wasTell = bossFxTell(was), isTell = bossFxTell(now);
    if (wasTell) {
      // THE STRIKE — whatever the next state is called. Several guardians' own
      // active states carry a wind-up's name (a 'charge' that IS the dash, a
      // 'volley' that is the shots), so the blow is read from the tell having
      // RUN ITS LENGTH, not from what follows it. One broken off — a stagger,
      // a daze — did not run its length, and strikes nothing.
      // (how much of it was still to run on the last frame it was seen in)
      const ran = (b._fxT0 || 0) > 0 ? 1 - (b._fxLeft || 0) / b._fxT0 : 1;
      b._fxT0 = 0; b._fxLeft = 0;
      bossFxCut(b);
      if (ran > 0.8) {
        const f = b.face || (b.vx < 0 ? -1 : 1), s = Math.max(b.w, b.h);
        const open = typeof BOSS_OPEN_STATES !== 'undefined' && BOSS_OPEN_STATES.test(String(now));
        const name = open ? String(was) : String(now);
        if (BOSS_FX_ARC.test(name))
          fx('slash', cx + f * b.w * 0.45, cy, { rx: clamp(s * 0.9, 70, 150), ry: clamp(s * 0.8, 62, 130), dur: 0.28, flip: f < 0, power: 3.2, col: col[0], hot: col[1] });
        else if (BOSS_FX_RING.test(name))
          fx('shock', cx, cy, { rx: clamp(s * 1.25, 90, 190), ry: clamp(s * 1.25, 90, 190), dur: 0.42, col: col[0], hot: col[1], power: 1.1 });
        else
          fx('flash', cx + f * b.w * 0.3, cy, { rx: clamp(s * 0.8, 70, 150), ry: clamp(s * 0.8, 70, 150), dur: 0.2, col: col[0], hot: col[1], power: 1.05 });
        b._fxStrikes = (b._fxStrikes || 0) + 1;
      }
    }
    if (isTell && (b.t || 0) >= BOSS_FX_MIN_TELL) {
      // THE WIND-UP GATHERS, for as long as the tell runs
      b._fxGather = fx('gather', cx, cy, { rx: Math.max(130, b.w * 1.5), ry: Math.max(110, b.h * 1.3), dur: b.t, col: TELL_COL, hot: '#fff6df', follow: b, power: 0.8 });
    }
  }
  // ...and the light lasts exactly as long as the wind-up still has to run
  // (never less than a beat ahead: a few wind-ups end on an EVENT, not on
  // their clock, and run on past it — the light stays until the state does)
  if (bossFxTell(now)) {
    b._fxT0 = Math.max(b._fxT0 || 0, b.t || 0); b._fxLeft = Math.max(0, b.t || 0);
    if (b._fxGather) b._fxGather.dur = b._fxGather.t + Math.max(0.12, b.t || 0);
  }
  // THE LANDING. The same reading the squash uses (bossMotionEnd): it was
  // falling hard at the start of the frame and is standing at the end of it.
  if (!(typeof bossFlies === 'function' && bossFlies(b)) && old.vy > 260 && Math.abs(b.vy || 0) < 24 && !G.artProbe) {
    const fy = b.y + b.h;
    fx('ground', cx, fy - 2, { rx: 110 + b.w, ry: 32, dur: 0.5, col: col[0], hot: col[1], power: 1.15 });
    fx('cracks', cx, fy + 3, { rx: 70 + b.w * 0.6, ry: 22, dur: 1.3, col: col[0], hot: col[1], power: 1.0 });
    b._fxLands = (b._fxLands || 0) + 1;
  }
}
// a wind-up that ends early takes its light with it
function bossFxCut(b) {
  if (b._fxGather) { b._fxGather.dur = Math.min(b._fxGather.dur, b._fxGather.t + 0.06); b._fxGather = null; }
}
