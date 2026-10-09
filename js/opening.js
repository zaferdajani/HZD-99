// ===========================================================================
// THE OPENING'S PEOPLE — Ratchet and Old Servo, told in the order she walks.
//
// The owner, 2026-10-09: "Rebuild the opening as a clear, forward-moving
// tutorial … Do not overlap dialogue, item cards, shop windows, tutorials,
// quest offers and cinematics." TUT_STEPS (game.js) is what the player is
// asked to DO; this file is what she is TOLD between those steps, and it
// tells it in short pages, one overlay at a time, each one opening only when
// the one before it has closed (every beat chains on onEnd — nothing here
// ever opens a window over another).
//
// The four things the old den blurred together are kept apart by name, art
// and purpose, and each is introduced before or as it is handed over:
//   RATCHET'S BATTERY   his own, in his drawer; the repair board installs it
//   SPARE POWER CELL    handed over after the repair, for Old Servo
//   VOLT PACK           bought once, permanent: healing and the Volt Burst
//   VOLT REFILL         the same counter row afterwards, a consumable
//
// Ratchet's waking explanation carries the marble (owner's order, item 4):
// the song infected, the marble slowed it, the battery pulled, the cat asleep
// for recharging, the raw deposit under the meadow, the white sword.
// ===========================================================================
const OP = { later: [], podBanner: 0, resting: false, burstVis: false, servoWake: 0, coilJoy: 0 };

function opOn() {
  return typeof isHero === 'function' && !isHero() && !!G.save && G.save.storyVersion >= 2;
}
// the walk is running and she is in one of its rooms
function opTeaching() {
  return !!(G.save && G.tut && !(G.save.flags && G.save.flags.tut) && TUT_ROOMS[G.roomId] !== undefined);
}
function opStepId() {
  if (!opTeaching()) return null;
  const s = TUT_STEPS[G.tut.i];
  return s ? s.id : null;
}
function opFill(line) { return typeof ctlFill === 'function' ? ctlFill(line) : line; }
// one dialogue window; `keys` may name arrays (a page each) or single lines
function opSay(name, keys, npc, onEnd) {
  const lines = [];
  for (const k of keys) lines.push(...[].concat(t(k)));
  G.dialog = { name, lines: lines.map(opFill), i: 0, npc: npc || undefined, onEnd: onEnd || null };
  G.state = 'DIALOG';
  if (npc && typeof npcSay === 'function') npcSay(npc, 0); else sfx('ui');
}
// one item card — name, picture, what it is for — and what happens after it
function opCard(nameKey, descKey, art, demo, onEnd) {
  showItem(t(nameKey), opFill(t(descKey)), art || null, demo || null);
  if (G.dialog) G.dialog.onEnd = onEnd || null;
  else if (onEnd) onEnd();
}
// a beat that waits for the screen to be free (no window open) and a moment
function opLater(sec, fn) { OP.later.push({ t: sec, fn }); }

// ---------------------------------------------------------------------------
// WHO SPEAKS. Called first thing from doInteract's NPC branch; returns true
// when the opening has said something, false to hand back to the ordinary
// conversation (standing line, errand, shop).
function openingTalk(s) {
  if (!opOn() || !s || s.type !== 'npc') return false;
  if (s.extra === 'ratchet' && G.roomId === 'A0B') return opRatchet(s);
  if (s.extra === 'servo') return opServo(s);
  return false;
}

// ---- RATCHET -------------------------------------------------------------
function opRatchet(s) {
  const f = G.save.flags;
  if (!npcLive(s)) {
    // THE LETTER FIRST, always — it is what says there is a battery and where
    // it is. Read on the dark body, the way the den has always told it.
    if (invCount('ratchetCell') <= 0) {
      opSay(t('op_letter'), ['op_letter1', 'op_letter2', 'op_letter3'], null, () => {
        if (!f.opNote) { f.opNote = 1; persist(); }
      });
      return true;
    }
    // ...his battery in hand: one line, then the board (story-repair.js)
    f.opNote = 1;
    opSay(t('n_ratchet'), ['op_seat'], null, () => {
      if (typeof repairOpen === 'function') repairOpen(s, () => opRatchetRestored(s));
    });
    return true;
  }
  // the explanation is the errand's ask: a save that already holds the errand
  // (an older opening gave it) has heard its story and is not told it twice
  if (!f.opTold && ((typeof qState === 'function' && qState('ratchet_forge') !== 'none') || f.crystal)) {
    f.opTold = 1; persist();
  }
  if (!f.opTold) { opExplain(s); return true; }
  // (a save whose walk is already behind her is not sent back to the pod)
  if (!f.opPod && !f.tut) { opSay(t('n_ratchet'), ['op_r_pod'], 'ratchet'); return true; }
  if (!f.heal) { opPackTalk(s); return true; }
  // the lessons the pack bought are still running: he points at the next one
  // and keeps his counter shut — the shop is not a place to stand mid-lesson
  if (opTeaching()) {
    const id = opStepId();
    const k = id === 'heal' ? 'op_r_heal' : id === 'node' ? 'op_r_node' : id === 'go' ? 'op_r_go' : 'op_r_winch';
    opSay(t('n_ratchet'), [k], 'ratchet');
    return true;
  }
  return false;
}
// the repair board's power came up: his battery is in, and he wakes
function opRatchetRestored(s) {
  const f = G.save.flags;
  if (!invTake('ratchetCell')) return;
  npcCharge(s);
  f.ratchetRepaired = 1; persist();
  const go = () => opExplain(s);
  // THE MEMORY FILM, when it is on disk — and skipping it skips nothing: the
  // explanation below plays either way, so the errand is never film-only.
  if (typeof PURIFY_VID !== 'undefined' && PURIFY_VID.memory && typeof startPurifyCut === 'function') {
    if (typeof purifyPreload === 'function') purifyPreload('memory');
    if (startPurifyCut('memory')) { G.cutEnd = go; return; }
  }
  go();
}
// FIVE SHORT PAGES, then the spare cell, then the pod. Not the nine-line
// dump the old waking read out with the shop already opening behind it.
function opExplain(s) {
  const f = G.save.flags;
  opSay(t('n_ratchet'), ['op_r1', 'op_r2', 'op_r3', 'op_r4', 'op_r5'], 'ratchet', () => {
    f.opTold = 1;
    // the errand is given here, so the goal line names it from now on
    if (typeof qState === 'function' && qState('ratchet_forge') === 'none') qSet('ratchet_forge', 'active');
    persist();
    const pod = () => opSay(t('n_ratchet'), ['op_r_pod'], 'ratchet');
    if (!f.ratchetSpareGiven) {
      f.ratchetSpareGiven = 1;
      invAdd('batt');
      opCard('op_spare', 'op_spared', opArt('cell'), null, pod);
    } else pod();
  });
}
// THE VOLT PACK, pitched before it is sold: what it does, why she needs it,
// what it costs — and then the scrap to pay with, handed over for the repair,
// so the purchase can never wait on grinding or lock her out.
function opPackTalk(s) {
  const f = G.save.flags;
  const pages = ['op_p1', 'op_p2', 'op_p3'];
  const owed = !f.opScrap;
  if (owed || G.save.scrap < 12) pages.push('op_p4');
  opSay(t('n_ratchet'), pages, 'ratchet', () => {
    const open = () => opOpenShop();
    if (owed) {
      f.opScrap = 1; f.sawScrap = 1;          // scrap is explained here, by him
      G.save.scrap += 12;
      persist();
      opCard('op_scrap', 'op_scrapd', opArt('scrap'), null, open);
    } else {
      if (G.save.scrap < 12) { G.save.scrap = 12; persist(); }
      open();
    }
  });
}
function opOpenShop() {
  G.state = 'SHOP';
  G.shopIdx = Math.max(0, SHOP.findIndex(q => q.type === 'cell'));
}
// the card the purchase shows: the player's own controls, and the demo of the
// two verbs (ABILITY_DEMO.pack below) in the picture column
function opPackCard() {
  if (!opOn()) return showItem(t('i_pack'), t('i_packd'));
  return showItem(t('i_pack'), opFill(t('i_packd')), null, 'pack');
}
// THE COUNTER ROW. Before the pack: the pack, permanent, marked, the one
// thing on the list she can buy. After: the refill.
function opShopRow(it, y, sel) {
  if (!opOn()) return null;
  const f = G.save.flags;
  if (it.type === 'cell') {
    if (f.heal) return { name: t('op_s_refill'), desc: t('op_s_refilld') };
    // the mark: a breathing gold frame and a tag, so the item is found by eye
    const pu = 0.5 + Math.sin(performance.now() / 260) * 0.5;
    c.save();
    c.strokeStyle = 'rgba(255,215,106,' + (0.45 + pu * 0.45).toFixed(3) + ')'; c.lineWidth = 2;
    rr(c, 158, y - 21, 644, 44, 9); c.stroke();
    c.restore();
    ftxt(t('op_s_tag'), LANG === 'ar' ? 780 : 180, y - 26, 11, '#ffd76a', LANG === 'ar' ? 'right' : 'left', null, '700');
    return { name: t('op_s_pack'), desc: t('op_s_packd') };
  }
  if (!f.heal) return { name: it.type === 'crest' ? t('c_' + it.id) : t('s_' + it.id),
    desc: t('op_s_later'), locked: true };
  return null;
}

// ---- OLD SERVO -----------------------------------------------------------
// He is a person with a job, not a prop: dark until she seats the spare cell
// Ratchet sent for him, then awake with something to say about where she is
// going and something to ask of her, and a different line every time after.
function opServo(s) {
  const f = G.save.flags;
  if (!npcLive(s)) {
    if (invCount('batt') <= 0) { opSay(t('n_servo'), ['op_sv_dark'], null); return true; }
    opSay(t('n_servo'), ['op_sv_seat'], null, () => {
      if (!invTake('batt')) return;
      npcCharge(s);
      f.servoIntro = 1;                      // his first say is owed (survives a reload)
      persist();
      OP.servoWake = 1.6;
      // nothing lands on her while she watches him come back
      if (player) player.iT = Math.max(player.iT || 0, 1.8);
      // the waking is SEEN before he speaks: eyes, sparks, the drum lamp
      opLater(1.2, () => { if (f.servoIntro) opServoIntro(); });
    });
    return true;
  }
  // (a Servo woken under an older opening has had his first say: from here
  // the ordinary conversation leads, standing line first)
  if (f.servoIntro) { opServoIntro(); return true; }
  if (!f.servoMet) { f.servoMet = 1; persist(); }
  return false;
}
function opServoIntro() {
  G.save.flags.servoIntro = 0;
  opSay(t('n_servo'), ['op_sv1', 'op_sv2', 'op_sv3'], 'servo', () => {
    G.save.flags.servoMet = 1; persist();
    if (typeof qState === 'function' && qState('servo_coil') === 'none') {
      qSet('servo_coil', 'active'); G.toast(t('q_taken')); sfx('ok');
    }
  });
}

// ---------------------------------------------------------------------------
// THE TICK: scheduled beats, the pod's confirmation, the burst's payoff, and
// Servo's visible answers. Runs in PLAY, beside updateTutor.
function openingTick(dt) {
  if (!opOn() || !player) return;
  const f = G.save.flags;
  // the faces in the dialogue are fetched before anyone speaks
  if (typeof mediaFetch === 'function') {
    if (G.roomId === 'A0B') mediaFetch('bustRatchet');
    else if (G.roomId === 'A1') mediaFetch('bustServo');
  }
  // SERVO'S YARD IS HIS until he has had his say. She arrives carrying the
  // cell Ratchet sent for him, and the meadow's machines do not come into the
  // winding house's corner while she wakes him and hears him out: a waking
  // and a first conversation are not interrupted by a bite. After that the
  // meadow is the meadow again.
  if (G.roomId === 'A1' && f.ratchetSpareGiven && !f.servoMet) {
    const edge = 13 * TILE;
    for (const e of G.enemies || []) {
      // (the room's own machines — loadRoom stamps them with a storyKey — not
      // anything a script or a harness puts down beside her)
      if (!e || e.dead || e.disabled || e.rescued || !e.storyKey || !(e instanceof Enemy) || e instanceof Boss) continue;
      if (e.x < edge) { e.x = edge; if (e.vx < 0) e.vx = Math.abs(e.vx) * 0.5; }
    }
  }
  for (let i = OP.later.length - 1; i >= 0; i--) {
    const L = OP.later[i];
    L.t -= dt;
    if (L.t <= 0 && G.state === 'PLAY' && !G.dialog && !G.cut) { OP.later.splice(i, 1); L.fn(); }
  }
  // THE POD: a rest that finished in the den is a save that happened — said
  // big, in the middle of the screen, before anything else is introduced
  if (G.recharge && G.roomId === 'A0B') OP.resting = true;
  else if (OP.resting && !G.recharge) {
    OP.resting = false;
    if (G.roomId === 'A0B' && G.save.bench && G.save.bench.room === 'A0B') {
      const first = !f.opPod;
      f.opPod = 1; persist();
      OP.podBanner = first ? 2.4 : 1.5;
      G.toasts = (G.toasts || []).filter(q => q.text !== t('rested'));
    }
  }
  if (OP.podBanner > 0) OP.podBanner = Math.max(0, OP.podBanner - dt);
  // the skill nudge the monument earned, held until the walk was over
  // (and not over Old Servo's waking: after he has had his say)
  if (f.tut && G.iqNudgeLater && (f.servoMet || G.roomId !== 'A1' || !f.ratchetSpareGiven)) {
    G.iqNudgeLater = 0; opLater(2, () => { if (typeof iqNudge === 'function') iqNudge(); });
  }
  // THE BURST'S PAYOFF: the release that lands on the jammed winch stops it.
  // (It disables, never kills — the blade can cleanse it later: winch.js.)
  const vis = !!(player.swingVis && player.swingVis.charged);
  if (vis && !OP.burstVis && G.roomId === 'A0') {
    f.opBurst = 1;
    const cx = player.x + player.w / 2, cy = player.y + player.h / 2;
    for (const e of G.enemies || []) {
      if (!e || e.dead || e.disabled || e.rescued || e.mechanism !== 'winch') continue;
      if (Math.hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy) > 165 + Math.max(e.w, e.h) / 2) continue;
      e.burstOK = true;
      if (typeof e.die === 'function') e.die();
      G.toast(t('op_winch_down'));
    }
    persist();
  }
  OP.burstVis = vis;
  if (OP.servoWake > 0) OP.servoWake = Math.max(0, OP.servoWake - dt);
  // SERVO'S COIL, home: the drum turns true again (drawWinchHouse reads it)
  if (G.roomId === 'A1' && typeof qState === 'function' && qState('servo_coil') === 'done' && !f.opCoilJoy) {
    f.opCoilJoy = 1; persist();
    OP.coilJoy = 3;
    sfx('powerUp');
  }
  if (OP.coilJoy > 0) OP.coilJoy = Math.max(0, OP.coilJoy - dt);
}
// the pod step is only finished once its confirmation has been read
function opPodSettled() { return !(OP.podBanner > 0); }

// ---------------------------------------------------------------------------
// THE GOAL LINE. One sentence, always the next thing chapter one wants from
// her, read off the story's own flags — never a list, never the backlog.
function opGoalKey() {
  if (!opOn()) return null;
  const f = G.save.flags, bag = G.save.bag || {};
  const zone = G.roomDef && G.roomDef.zone;
  if (!f.tut) {
    if (G.roomId === 'W1' || G.roomId === 'W2') return 'op_o_gate';
    if (!f.ratchetRepaired) return G.roomId === 'A0B' ? 'op_o_wake' : 'op_o_booth';
    if (!f.opPod) return 'op_o_pod';
    if (!f.heal) return 'op_o_pack';
    const id = opStepId();
    if (id === 'node') return 'op_o_node';
    if (id === 'go') return 'op_o_meadow';
    return 'op_o_lessons';
  }
  if (zone && zone !== 'A' && f.bossGlitch) return null;   // chapter one is behind her
  if (!f.crystal && !bag.cshard) return 'op_o_marble';
  if (!f.crystal) return 'op_o_return';
  if (!f.sageTame_GA1D) return 'op_o_sage';
  if (!f.bossChime) return 'op_o_chime';
  if (!f.bossGlitch) return 'op_o_lion';
  return 'op_o_conduits';
}
function opGoalRect(w) {
  // top-left, under the cores, the volt ring and the purse
  let x = 14, y = 124;
  const h = 24;
  const hit = (r) => r && x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y;
  // never under the lesson chip
  const chip = G.tutChip;
  if (chip && chip.at === (G.simClock || 0) && hit(chip)) y = chip.y + chip.h + 8;
  // ...and never under a notice: step below the stack instead
  const toastY = 146;
  (G.toasts || []).forEach((tt, i) => {
    c.font = '700 15px "Segoe UI", Tahoma, sans-serif';
    const tw = Math.min(880, c.measureText(tt.text).width + 34);
    const r = { x: 480 - tw / 2, y: toastY + i * 30 - 14, w: tw, h: 28 };
    if (hit(r)) y = r.y + r.h + 6;
  });
  return { x, y, w, h };
}
function drawOpeningHUD() {
  if (!opOn() || !player || G.state !== 'PLAY' || G.gateWalk || G.wake || G.bossEntry || G.meet) return;
  const k = opGoalKey();
  if (k) {
    const text = opFill(t(k));
    c.save();
    c.font = '600 13px "Segoe UI", Tahoma, sans-serif';
    const w = Math.min(420, c.measureText(text).width + 40);
    const r = opGoalRect(w);
    c.fillStyle = 'rgba(6,12,18,0.78)'; rr(c, r.x, r.y, r.w, r.h, 7); c.fill();
    c.strokeStyle = 'rgba(255,215,106,0.45)'; c.lineWidth = 1; rr(c, r.x, r.y, r.w, r.h, 7); c.stroke();
    const rtl = LANG === 'ar';
    ftxt('◆', rtl ? r.x + r.w - 14 : r.x + 14, r.y + r.h / 2 + 1, 11, '#ffd76a', 'center');
    const maxW = r.w - 36;
    const sz = Math.min(13, 13 * maxW / Math.max(1, c.measureText(text).width));
    ftxt(text, rtl ? r.x + r.w - 26 : r.x + 26, r.y + r.h / 2 + 1, sz, '#f1e7c8', rtl ? 'right' : 'left', null, '600');
    c.restore();
  }
  // THE POD'S CONFIRMATION, centre screen: it saved, and it recharged her
  if (OP.podBanner > 0) {
    const a = Math.min(1, OP.podBanner / 0.4, (2.4 - OP.podBanner) / 0.2 + 0.2);
    c.save(); c.globalAlpha = Math.max(0, Math.min(1, a));
    const t1 = t('op_saved'), t2 = t('op_saved_h');
    c.font = '700 24px "Segoe UI", Tahoma, sans-serif';
    const w = Math.max(c.measureText(t1).width, 280) + 70;
    const x = 480 - w / 2, y = 222;
    c.fillStyle = 'rgba(6,16,22,0.93)'; rr(c, x, y, w, 78, 12); c.fill();
    c.strokeStyle = '#8ff6ff'; c.lineWidth = 2; rr(c, x, y, w, 78, 12); c.stroke();
    ftxt('✓ ' + t1, 480, y + 32, 24, '#dffcff', 'center', '#37ffd0', '700');
    ftxt(t2, 480, y + 58, 14, '#9fc7d2', 'center');
    c.restore();
  }
}

// ---------------------------------------------------------------------------
// IN THE WORLD: Servo's cue and his visible answers (drawn in world space,
// from drawStatics, before the interact label).
function drawOpeningWorld() {
  if (!opOn() || G.roomId !== 'A1' || !player) return;
  const s = (G.statics || []).find(q => q.type === 'npc' && q.extra === 'servo');
  if (!s) return;
  const live = npcLive(s);
  const A = typeof atlasOf === 'function' && atlasOf('servo');
  const kk = (A && A.sub.servo && A.sub.servo.k) || 1.4;
  const headY = s.y + s.h - s.h * kk;
  const cx = s.x + s.w / 2;
  const near = Math.abs(player.x + player.w / 2 - cx) < 230;
  // INACTIVE, AND WHAT WOULD CHANGE THAT — said over him, not left to guess
  if (!live && near && G.state === 'PLAY' && G.near !== s) {
    const has = invCount('batt') > 0;
    const pu = 0.6 + Math.sin(performance.now() / 300) * 0.4;
    c.save(); c.globalAlpha = 0.75 + pu * 0.25;
    ftxt(opFill(t(has ? 'op_sv_cue_wake' : 'op_sv_cue_dark')), cx, headY - (has ? 46 : 14), 12,
      has ? '#ffe7a8' : '#c9d3dc', 'center', has ? 'rgba(255,200,90,0.8)' : 'rgba(90,110,130,0.8)', '700');
    c.restore();
  }
  // THE WAKING: power climbing him, the eyes coming up amber
  if (OP.servoWake > 0) {
    const k = OP.servoWake / 1.6;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(cx, s.y + s.h * 0.4, 2, cx, s.y + s.h * 0.4, 70);
    g.addColorStop(0, 'rgba(255,214,120,' + (0.45 * k).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,190,100,0)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, s.y + s.h * 0.4, 70, 0, 7); c.fill();
    c.restore();
    if (chance(0.5)) addPart(cx + rnd(-26, 26), s.y + s.h - rnd(0, s.h * kk), rnd(-20, 20), rnd(-90, -30), 0.5, '#ffd76a', 2, 60, true);
  }
  // THE COIL HOME: sparks off the drum while it spins up
  if (OP.coilJoy > 0 && chance(0.4)) {
    const wx = 3 * TILE + 16 + 2, wy = 15 * TILE - 44;
    addPart(wx + rnd(-18, 18), wy + rnd(-18, 18), rnd(-60, 60), rnd(-90, -10), 0.45, chance(0.5) ? '#ffe08a' : '#8ff6ff', 2, 200, true);
  }
}
// what pressing the interact control at this NPC will do, when it is not
// simply "talk" — read by drawStatics' interact label
function opNearLabel(s) {
  if (!opOn() || !s || s.type !== 'npc' || s.extra !== 'servo' || npcLive(s)) return null;
  return t(invCount('batt') > 0 ? 'op_sv_cue_wake' : 'op_sv_cue_dark');
}
// the drum's speed: barely turning while he is dark, turning when he is awake,
// and turning TRUE once his coil is home
function opDrumSpin(now) {
  if (!opOn()) return Math.sin(now / 2600) * 0.2;
  if (G.save.quests && G.save.quests.servo_coil === 'done') return now / 700;
  return Math.sin(now / 2600) * 0.2;
}

// ---------------------------------------------------------------------------
// THE PICTURES on the opening's cards. Ratchet's battery uses its authored
// art (repair_battery.webp, the board's own). The spare cell and the scrap
// have no fired plate yet — these are wiring stand-ins in the game's own
// style, drawn once to a canvas, until the art session fires them
// (subject list in the opening workstream's report).
const OP_ART = {};
function opArt(kind) {
  const key = 'opArt_' + kind;
  if (typeof MEDIA_IMG === 'undefined') return null;
  if (MEDIA_IMG[key]) return key;
  let cv2;
  try { cv2 = document.createElement('canvas'); } catch (e) { return null; }
  cv2.width = 96; cv2.height = 96;
  const x = cv2.getContext('2d');
  if (kind === 'cell') {
    // a squat steel cell with a GOLD charge window and a bolt — the colour
    // of the ⚡ the world puts over a machine a cell can wake, and nothing like
    // the tall brass, cyan-glassed battery that is Ratchet's own
    x.fillStyle = '#2b3946'; x.beginPath(); x.ellipse(48, 22, 20, 7, 0, 0, 7); x.fill();
    const g = x.createLinearGradient(28, 0, 68, 0);
    g.addColorStop(0, '#3c4c5a'); g.addColorStop(0.5, '#8aa0b0'); g.addColorStop(1, '#34424e');
    x.fillStyle = g; x.fillRect(28, 22, 40, 52);
    x.fillStyle = '#2b3946'; x.beginPath(); x.ellipse(48, 74, 20, 7, 0, 0, 7); x.fill();
    x.fillStyle = '#ffd76a'; x.shadowColor = '#ffe9a8'; x.shadowBlur = 12; x.fillRect(31, 36, 34, 20);
    x.shadowBlur = 0; x.fillStyle = '#3a2706';
    x.beginPath(); x.moveTo(50, 38); x.lineTo(41, 48); x.lineTo(48, 48); x.lineTo(45, 55); x.lineTo(56, 44); x.lineTo(49, 44); x.closePath(); x.fill();
    x.fillStyle = '#c9d6df'; x.fillRect(42, 12, 12, 7);
  } else {
    // a handful of scrap: bent plate, a nut, a gear tooth — gold, like the purse
    const bits = [[34, 58, 0.4, 18], [58, 62, -0.5, 14], [46, 40, 0.9, 12], [64, 42, 0.2, 10], [30, 36, -0.8, 9]];
    for (const [bx, by, a, r] of bits) {
      x.save(); x.translate(bx, by); x.rotate(a);
      x.fillStyle = '#b8862e'; x.strokeStyle = '#ffe08a'; x.lineWidth = 2;
      x.beginPath();
      for (let i = 0; i < 6; i++) { const q = i / 6 * Math.PI * 2; x.lineTo(Math.cos(q) * r, Math.sin(q) * r * 0.8); }
      x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#3a2a10'; x.beginPath(); x.arc(0, 0, r * 0.3, 0, 7); x.fill();
      x.restore();
    }
  }
  cv2.naturalWidth = cv2.width; cv2.naturalHeight = cv2.height;
  MEDIA_IMG[key] = cv2;
  return key;
}
// THE PACK'S CARD MOVES: hurt, mend, charge, burst — the two verbs it wires,
// in the same demo window the skill tree and the boss rewards use.
if (typeof ABILITY_DEMO !== 'undefined') {
  ABILITY_DEMO.pack = [
    ['hurt', 0.3],
    ['idle', 0.9, (c2, cx, base, h, k) => {
      demoGlow(c2, cx, base - h * 0.45, h * (0.25 + k * 0.3), '#aef7d8', (1 - k * 0.6) * 0.8);
    }],
    ['charge', 0.7, (c2, cx, base, h, k) => {
      demoRing(c2, cx, base - h * 0.45, h * (0.7 - k * 0.45), '#8ff6ff', 2, 0.8);
    }],
    ['burst', 0.8, (c2, cx, base, h, k) => {
      demoRing(c2, cx, base - h * 0.45, h * (0.2 + k * 1.1), '#ffffff', 4 * (1 - k), (1 - k) * 0.95);
    }],
  ];
}
