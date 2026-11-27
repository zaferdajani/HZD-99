// ===========================================================================
// A NEW ARM TEACHES ITSELF (owner, 2026-11-27: "it wasn't easy to actually use
// the skill of the wolf ... I needed to try my gaming skill to find it. There
// isn't a direct way that tells me how to switch between these skills I have.
// There's no walkthrough, there's no help from the system." · "I don't know
// how to throw my ninja stars using controller." · "Whenever I get a new skill
// from killing a boss or freeing a boss, there should be a teaching on how to
// actually using the new skill.").
//
// The arm used to arrive as one line on its card — "V or K fires it, G changes
// suit" — in keyboard letters whatever she was holding, and the card closed.
// Now every arm she gains (the Alpha's pack, GRAVEHORN's horn-star, each
// guardian's suit after them) and the ride she buys is a short lesson in the
// grammar of the opening's chips (game.js tutCard): the ONE control, in her own
// scheme (ctlName: the key, the pad's button, the phone's wheel seat), and two
// words; it waits for her to do it once, ticks, and goes on.
//
//   The arm comes out of its card WORN (armWear), so the lesson starts where
//   she is:
//   1. USE IT    the cast control (CAST). The first cast is paid for: the
//                lesson tops her volts up to the arm's price, so a lesson is
//                never stuck behind a gauge she has not filled.
//   2. SWITCH    the switch control (ARM): one press, and the wheel turns.
//   A lesson owed from a reload where something else is worn runs the other
//   way round — WEAR IT (the wheel is turned to the seat before it, so the one
//   press she is asked for is the press that wears it), then USE IT.
//   (the ride: call him with CAST, then get on with INT)
//
// It waits its turn: never over a card, a film, the opening, another lesson, a
// door or a live fight, and a lesson not finished is still owed after a reload
// (G.save.armLes). Done is `les_arm_<id>` in the save's flags.
// tests/arm-lesson.cjs
// ===========================================================================
const ARM_LES = { hold: 1.1, minT: 0.35 };
// the phone's control for an action: the wheel seat, through the wheel button
const AL_TOUCH_SEAT = { ARM: 'VARM', CAST: 'VCAST' };
function alName(id) {
  if (id === 'alride') return t('pk_n_alride');
  if (id === 'star') return t('pa_STAR');
  return String(t('arm_' + id)).split(' — ')[0];
}
function alOwned(id) {
  if (id === 'star') return true;
  if (id === 'alride') return typeof ptHas === 'function' && ptHas('alride');
  return !!(G.save && G.save.arms && G.save.arms.includes(id));
}
// what each lesson asks, in order
function alSteps(id, L) {
  const worn = (a) => { const w = typeof activeArm === 'function' && activeArm(); return !!(w && w.id === a); };
  const cast = (a) => () => ((G.armCast && G.armCast[a]) | 0) > ((G.armLesson && G.armLesson.c0) | 0);
  if (id === 'alride') return [
    { act: 'ARM', label: 'al_pick', arm: 'pack', wear: 1, done: () => worn('pack'), skip: () => worn('pack') },
    { act: 'CAST', label: 'al_call', arm: 'pack', done: () => !!(G.packWolf && G.packWolf.alpha), skip: () => !!(G.packWolf && G.packWolf.alpha) },
    { act: 'INT', label: 'al_ride', done: () => typeof wmRiding === 'function' && wmRiding() },
  ];
  // THE NINJA STARS ON A PAD ("I don't know how to throw my ninja stars using
  // controller"): hers from the start, on the stick click — owed the first time
  // she plays on a pad, one step
  if (id === 'star') return [{ act: 'STAR', label: 'al_throw', done: () => (G.starN | 0) > ((G.armLesson && G.armLesson.c0) | 0) }];
  const use = { act: 'CAST', label: 'al_cast', arm: id, done: cast(id) };
  if (L && L.worn0) return [use, { act: 'ARM', label: 'al_swap', swap: 1, done: () => ((G.save.armIdx || 0) % armSlots().length) !== L.idx0 }];
  return [{ act: 'ARM', label: 'al_pick', arm: id, wear: 1, done: () => worn(id) }, use];
}
// owed: called where the arm (or the ride) is handed over
function armLessonStart(id) {
  if (!G.save || (typeof isHero === 'function' && isHero())) return;
  const f = G.save.flags || (G.save.flags = {});
  if (f['les_arm_' + id]) return;
  const q = G.save.armLes || [];
  if (q.indexOf(id) < 0) q.push(id);
  G.save.armLes = q;
}
// nothing else is asking for her eyes or her hands
function alBusy() {
  if (G.state !== 'PLAY' || !player || player.dead) return true;
  if (G.dialog || G.cut || G.wake || G.meet || G.trans || G.gateWalk || G.lesson || G.brDelta || G.recharge || G.finish || G.climb || G.bossEntry) return true;
  if (G.tut && !(G.save.flags && G.save.flags.tut)) return true;
  const b = G.boss;
  if (b && (b.bowT > 0)) return true;          // the Alpha's bow plays out first
  if (b && !b.dead && !b.purified && !b.meet && b.st !== 'dorm' && b.st !== 'yield' && b.st !== 'purified') return true;
  if (G.mount && !(G.armLesson && G.armLesson.id === 'alride')) return true;
  return false;
}
function alBegin(id) {
  const w = typeof activeArm === 'function' && activeArm();
  const L = { id, i: 0, t: 0, hold: 0, c0: 0, worn0: id !== 'alride' && !!(w && w.id === id) };
  G.armLesson = L;
  alEnter(L);
}
// a step opens: set the world up so the one press she is asked for is the one that works
function alEnter(L) {
  const st = alSteps(L.id, L)[L.i];
  L.t = 0; L.hold = 0;
  if (!st) return;
  if (st.skip && st.skip()) { L.i++; return alEnter(L); }
  if (st.swap) L.idx0 = (G.save.armIdx || 0) % armSlots().length;
  if (st.act === 'ARM' && st.wear && st.arm) {
    // the wheel one notch back: one press of the switch wears it
    const sl = armSlots(), k = sl.findIndex(a => a && a.id === st.arm);
    if (k > 0) G.save.armIdx = k - 1;
  }
  if (st.act === 'STAR') { L.c0 = G.starN | 0; if (typeof starCount === 'function' && starCount() <= 0 && typeof starSet === 'function') starSet(1); }
  if (st.act === 'CAST' && st.arm) {
    const a = armDef(st.arm);
    if (a) { player.volts = Math.max(player.volts, a.cost); player.armCD = Math.min(player.armCD || 0, 0); }   // the press she is asked for goes off
    L.c0 = (G.armCast && G.armCast[st.arm]) | 0;
  }
}
function alFinish(L) {
  const f = G.save.flags || (G.save.flags = {});
  f['les_arm_' + L.id] = 1;
  G.save.armLes = (G.save.armLes || []).filter(x => x !== L.id);
  G.armLesson = null;
  if (typeof TOUCH !== 'undefined' && TOUCH) { TOUCH.hi = null; TOUCH.hiSeat = null; }
  if (typeof persist === 'function') persist();
}
function updateArmLesson(dt) {
  if (!G.save || (typeof isHero === 'function' && isHero())) { G.armLesson = null; return; }
  let L = G.armLesson;
  if (!L) {
    // the stars are owed their lesson the first time she plays on a pad
    const fl = G.save.flags || {};
    // — at a moment a star is for: a machine in front of her within a throw
    if (typeof PAD !== 'undefined' && PAD && PAD.on && fl.tut && !fl.les_arm_star && !(G.save.armLes || []).includes('star') && alTarget()) armLessonStart('star');
    const q = G.save.armLes;
    // (and it opens on a clear screen: not under a pop-up or a room's name)
    if (!q || !q.length || alBusy() || (G.toasts && G.toasts.length) || G.zoneToast) return;
    const id = q[0];
    if (!alOwned(id) || (G.save.flags && G.save.flags['les_arm_' + id])) { G.save.armLes = q.slice(1); return; }
    alBegin(id); L = G.armLesson;
    if (!L) return;
  }
  if (!alOwned(L.id)) { G.armLesson = null; return; }
  const steps = alSteps(L.id, L), st = steps[L.i];
  if (!st) { alFinish(L); return; }
  if (alBusy() && !L.hold) return;             // it waits behind whatever came up
  // the phone: ring the button (and the wheel's seat) under her thumb
  if (typeof TOUCH !== 'undefined' && TOUCH && TOUCH.enabled) {
    const seat = AL_TOUCH_SEAT[st.act];
    TOUCH.hi = seat ? 'VWHEEL' : 'V' + st.act; TOUCH.hiSeat = seat || null;
  }
  L.t += dt;
  if (L.hold > 0) {
    L.hold -= dt;
    if (L.hold <= 0) { L.i++; if (L.i >= steps.length) alFinish(L); else alEnter(L); }
    return;
  }
  // she wore something else in the middle of USE IT: WEAR IT first, then USE IT
  if (st.act === 'CAST' && st.arm && L.id !== 'alride') {
    const w = typeof activeArm === 'function' && activeArm();
    if (!(w && w.id === st.arm)) { L.worn0 = false; L.i = 0; alEnter(L); return; }
  }
  let ok = false;
  try { ok = st.done(); } catch (e) { ok = false; }
  if (ok && L.t > ARM_LES.minT * (st.act === 'ARM' ? 0 : 1)) {
    L.hold = ARM_LES.hold;
    if (typeof sfx === 'function') sfx('pick');
    if (typeof burst === 'function') burst(player.x + player.w / 2, player.y + 4, 14, '#37ffd0', 200, 0.5, 220, 3, true);
  }
}
// a hostile machine on her level within a throw (the moment the stars are taught)
function alTarget() {
  if (!player) return null;
  const px = player.x + player.w / 2, py = player.y + player.h / 2;
  return (G.enemies || []).find(e => e && !e.dead && !e.disabled && !e.calm && !e.tame && !e.rescued
    && !(typeof isPet === 'function' && isPet(e)) && !(typeof isWolf === 'function' && isWolf(e) && typeof packTamed === 'function' && packTamed())
    && Math.abs(e.x + e.w / 2 - px) < 520 && Math.abs(e.y + e.h / 2 - py) < 120) || null;
}
// the control, as this player's hands know it
function alCtl(act) {
  return typeof ctlName === 'function' ? ctlName(act) : act;
}
function drawArmLesson() {
  const L = G.armLesson;
  if (!L || !player || G.state !== 'PLAY' || G.lesson || G.dialog) return;
  const st = alSteps(L.id, L)[L.i];
  if (!st || typeof tutCard !== 'function') return;
  if (alBusy() && !L.hold) return;
  const px = typeof worldScreenX === 'function' ? worldScreenX(player.x + player.w / 2) : player.x + player.w / 2 - cam.x;
  const py = typeof worldScreenY === 'function' ? worldScreenY(player.y - 12) : player.y - cam.y;
  // (the switch is said on its own: it is not this arm's, it is the wheel's)
  const label = st.swap ? t(st.label) : alName(st.arm || L.id) + ' — ' + t(st.label);
  tutCard(px, py, alCtl(st.act), label, '', L.hold > 0, L.hold / ARM_LES.hold);
  G.armLessonChip = { key: alCtl(st.act), label, act: st.act, step: L.i, id: L.id };
}
