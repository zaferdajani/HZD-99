// CLAWBYTE — input, camera, particles, helpers
const KEYB = {
  LEFT: ['ArrowLeft', 'KeyA', 'VL', 'GP_L'], RIGHT: ['ArrowRight', 'KeyD', 'VR', 'GP_R'],
  UP: ['ArrowUp', 'KeyW', 'VU', 'GP_U'], DOWN: ['ArrowDown', 'KeyS', 'VD', 'GP_D'],
  JUMP: ['KeyZ', 'Space', 'VJUMP', 'GP_JUMP'], ATK: ['KeyX', 'KeyJ', 'VATK', 'GP_ATK'],
  DASH: ['KeyC', 'ShiftLeft', 'ShiftRight', 'VDASH', 'GP_DASH'], CAST: ['KeyV', 'KeyK', 'VCAST', 'GP_CAST'],
  HEAL: ['KeyF', 'KeyH', 'VHEAL', 'GP_HEAL'], INT: ['KeyE', 'VINT', 'GP_INT'],
  // GUARD (owner sheet, 2026-09-15: BLOCK/GUARD row). Every real gamepad
  // button (0-11) already has a home — see PAD_DEFAULT — so like SKILL and
  // CREST before it, it ships unbound (-1) and remappable rather than
  // stealing someone else's slot.
  GUARD: ['KeyL', 'VGUARD', 'GP_GUARD'],
  CLAW: ['KeyQ', 'VCLAW', 'GP_CLAW'],
  // THE GRAPPLING CLAW (js/grapple.js). L went to GUARD; U sits beside I (Crests) and is free.
  GRAPPLE: ['KeyU', 'Digit3', 'VGRAPPLE', 'GP_GRAPPLE'],
  ARM: ['KeyG', 'Digit1', 'VARM', 'GP_ARM'], SONG: ['KeyB', 'KeyN', 'VSONG', 'GP_SONG'],
  STAR: ['KeyR', 'Digit2', 'VSTAR', 'GP_STAR'],
  MAP: ['Tab', 'KeyM', 'VMAP', 'GP_MAP'], BRAID: ['KeyY', 'VBRAID', 'GP_BRAID'], CREST: ['KeyI', 'VCREST', 'GP_CREST'], SKILL: ['KeyT', 'VSKILL', 'GP_SKILL'],
  PAUSE: ['Escape', 'KeyP', 'VPAUSE', 'GP_PAUSE'],
  OK: ['Enter', 'KeyZ', 'Space', 'VOK', 'GP_OK'], BACK: ['Escape', 'VBACK', 'GP_BACK'],
  // RUN is a pad verb only. A key has no magnitude and always asks for
  // everything, and the touch stick's push IS its speed; the pad is the one
  // control where "moving" and "running" are different decisions — see the
  // walk cap in Player.update.
  RUN: ['GP_RUN'],
};
const keys = {}, keysP = {};
let inputSuspended = false, padNeedsNeutral = false;
let LIFE = null;   // the app's background/inactive state — see installLifecycle below
// ---------------------------------------------------------------------------
// Gamepad. A Bluetooth pad on a phone should turn the game into a console: the
// touch gutters disappear, the picture grows to fill the screen, and every
// action moves onto a real button. Detection is automatic on first input.
// ---------------------------------------------------------------------------
const GP_CODES = ['GP_L', 'GP_R', 'GP_U', 'GP_D', 'GP_JUMP', 'GP_ATK', 'GP_DASH', 'GP_CAST', 'GP_HEAL', 'GP_INT', 'GP_MAP', 'GP_PAUSE', 'GP_OK', 'GP_BACK', 'GP_CLAW', 'GP_ARM', 'GP_SONG', 'GP_SKILL', 'GP_CREST', 'GP_STAR', 'GP_RUN', 'GP_GUARD', 'GP_GRAPPLE',
  // the d-pad alone, edge-detected like everything else — see pollGamepad
  'GP_PL', 'GP_PR', 'GP_PU', 'GP_PD',
  // the left stick as ONE of four directions, latched — see padStick4
  'GP_SL', 'GP_SR', 'GP_SU', 'GP_SD'];
const GP_PREV = {};
// the sideways push at which a stick stops walking and runs: past the walk's
// 0.4 threshold by a wide margin, short of the rim so a worn stick still gets there
const PAD_RUN_PUSH = 0.82;

// Standard-mapping button indices, which every DualShock 4 / DualSense reports.
//
// THE FACE BUTTONS ARE THEIR SHAPES, NOT THE NAMES OF THEIR SHAPES (owner,
// 2026-11-14: "instead of saying the name of the shape like triangle or circle,
// show me the actual circle and triangle"). The button has no word printed on
// it, so a prompt that says "Triangle" asks the player to translate; these are
// the marks themselves, from the Geometric Shapes block every system font
// carries — the same block the touch prompts already draw ▲ ▼ ◀ ▶ from. Every
// prompt, toast, chip and the config screen reads through padLabel, so this one
// table is the whole change. The d-pad is its arrow for the same reason.
const PAD_BTN = {
  0: '✕', 1: '○', 2: '□', 3: '△',
  4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2',
  8: 'Share', 9: 'Options', 10: 'L3', 11: 'R3',
  12: 'D-pad ▲', 13: 'D-pad ▼', 14: 'D-pad ◀', 15: 'D-pad ▶', 16: 'PS',
};
const PAD_BTN_XB = {
  0: 'A', 1: 'B', 2: 'X', 3: 'Y', 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
  8: 'View', 9: 'Menu', 10: 'LS', 11: 'RS',
  12: 'D-pad ▲', 13: 'D-pad ▼', 14: 'D-pad ◀', 15: 'D-pad ▶', 16: 'Guide',
};
// every action that lives on a face/shoulder button, in the order the config
// screen lists them. Movement stays on the stick + d-pad and is not remappable.
const PAD_ACTIONS = ['JUMP', 'ATK', 'RUN', 'STAR', 'DASH', 'CAST', 'ARM', 'SONG', 'CLAW', 'HEAL', 'INT', 'MAP', 'SKILL', 'CREST', 'PAUSE', 'GUARD', 'GRAPPLE'];
const PAD_DEFAULT = {
  JUMP: 0, ATK: 2, INT: 1, HEAL: 3,
  DASH: 5,        // R1
  CAST: 7,        // R2 — fire the suit
  ARM: 4,         // L1 — change suit
  SONG: 6,        // L2 — the Song
  STAR: 11,       // R3 — throw a shuriken
  // RUN ON THE STICK CLICK (owner, 2026-09-05: "running on a controller
  // should happen when I press the L3 while moving instead of just moving").
  // The stick walks; clicking it in while she is walking breaks into the run,
  // and the run holds until the stick is let go. That is the console idiom
  // (every third-person kit since the DualShock had a click), and it is the
  // one thing a pad can do that a keyboard cannot: two speeds on one thumb.
  RUN: 10,        // L3
  // The claws moved to View/Share to make room. The map lost its button: it
  // has always been one row inside the pause menu, which is the route the
  // config screen already prints for anything without a button of its own.
  CLAW: 8,        // Share / View
  // THE NEURAL TREE WAS ON THE GUIDE BUTTON, WHICH IS NOT OURS TO USE.
  //
  // Button 16 is the PS / Xbox Guide button. Windows, Steam and the Game Bar
  // all grab it before a page ever sees it, and the Gamepad spec does not even
  // require a pad to report it — so on a controller the skill tree was not
  // "hard to find", it was UNREACHABLE, and the game still cheerfully told the
  // player to go and open it.
  //
  // Every real button is spoken for (four faces, four shoulders, two sticks,
  // View, Options), so rather than steal one from combat this is honestly
  // unbound and the route is Options ▸ Skills — which has always worked. It
  // stays remappable for anyone who would rather give up a button for it, and
  // padHowTo() below makes sure the game says the right thing either way.
  SKILL: -1,
  CREST: -1,      // unbound by default; remap it if you want it on the pad
  // GUARD: every real button is ALSO spoken for by the time this shipped —
  // same honest-unbound treatment as SKILL above, routed to Options ▸
  // Controls (tests/platform.cjs VIA.GUARD) instead of stealing a slot.
  GUARD: -1,
  // GRAPPLE: no real button is left either; unbound and remappable like GUARD.
  GRAPPLE: -1,
  PAUSE: 9,       // Options
};
const PAD = {
  on: false, id: '', kind: 'generic', idx: -1,
  map: Object.assign({}, PAD_DEFAULT),
  down: {},          // live button state, for the config screen
  lastPress: -1,     // most recent button index, for "press to bind"
  listen: null,      // action currently awaiting a button
  run: false,        // the stick has been clicked in: full speed until it centres (pollInput)
  seen: false,
};
function padLabel(i) {
  if (i == null || i < 0) return '—';
  return (PAD.kind === 'xbox' ? PAD_BTN_XB[i] : PAD_BTN[i]) || ('B' + i);
}
// HOW DO I OPEN THIS? — answered for whatever the player is actually holding.
//
// The game knew four different ways to reach a screen and told the player none
// of them. Worse, it told everyone the KEYBOARD way: "open SKILLS" is useless
// advice on a controller, and the controller had no button for it at all.
//
// One function, asked wherever the game gives directions, so a prompt can never
// again describe a control the player does not have. Screens that no longer sit
// on a button of their own name their route through the pause menu instead,
// which is a real answer rather than a shrug.
function howToOpen(action, viaPause) {
  if (typeof PAD !== 'undefined' && PAD && PAD.on) {
    const b = PAD.map[action];
    if (b != null && b >= 0) return padLabel(b);
    return padLabel(PAD.map.PAUSE) + ' ▸ ' + (viaPause || action);
  }
  if (typeof TOUCH !== 'undefined' && TOUCH && TOUCH.enabled)
    return '☰ ▸ ' + (viaPause || action);
  const codes = KEYB[action] || [];
  const k = codes.find(c => /^Key|^Tab$|^Escape$|^Enter$/.test(c));
  return k ? k.replace(/^Key/, '') : (viaPause || action);
}
// The same answer, phrased as an instruction rather than as a key. howToOpen
// returns the bare button — "T" — which is what the HUD was printing, and a
// letter on its own is a puzzle, not a prompt: the player who reported this had
// been carrying IQ for an hour without ever finding the Neural Tree. Say the
// button AND the door it opens. When the action has no button of its own the
// answer is already a route ("Start ▸ Skills") and naming it twice is worse.
function howToOpenNamed(action, name) {
  const how = howToOpen(action, name);
  return how.indexOf(name) >= 0 ? how : how + ' — ' + name;
}
function padKindOf(id) {
  const s = (id || '').toLowerCase();
  if (/dualshock|dualsense|playstation|054c|wireless controller/.test(s)) return 'ps';
  if (/xbox|xinput|045e/.test(s)) return 'xbox';
  return 'generic';
}
function padSave() {
  try { localStorage.setItem('cb_padmap', JSON.stringify(PAD.map)); } catch (e) {}
}
function padLoad() {
  try {
    const v = JSON.parse(localStorage.getItem('cb_padmap') || 'null');
    if (v && typeof v === 'object') {
      PAD.map = Object.assign({}, PAD_DEFAULT, v);
      // A MAP SAVED BEFORE RUN EXISTED STILL HAS THE CLAWS ON L3, and merging
      // the new default over it puts two verbs on one click. The newcomer
      // keeps the button it was given; whatever the old map had there goes to
      // its own current default, or to no button if that one is taken too.
      if (v.RUN == null) for (const a of PAD_ACTIONS) {
        if (a === 'RUN' || PAD.map[a] !== PAD.map.RUN) continue;
        const d = PAD_DEFAULT[a];
        const free = d != null && !PAD_ACTIONS.some(b2 => b2 !== a && PAD.map[b2] === d);
        PAD.map[a] = free ? d : -1;
      }
    }
  } catch (e) {}
}
padLoad();
function padReset() { PAD.map = Object.assign({}, PAD_DEFAULT); padSave(); }
// bind an action, clearing whatever else held that button so two moves can
// never share one key by accident
function padBind(action, btn) {
  for (const a of PAD_ACTIONS) if (a !== action && PAD.map[a] === btn) PAD.map[a] = -1;
  PAD.map[action] = btn; padSave();
}

function padConnected(on, gp) {
  if (on === PAD.on) return;
  PAD.on = on;
  if (on) { PAD.id = (gp && gp.id) || ''; PAD.kind = padKindOf(PAD.id); }
  // the whole point: with a pad attached the touch gutters go away and the
  // picture takes the space they were using
  if (typeof TOUCH !== 'undefined') {
    if (typeof tcResize === 'function') tcResize();
    if (typeof tc !== 'undefined' && tc) {
      tc.style.display = on ? 'none' : 'block';
      tc.style.pointerEvents = on ? 'none' : 'auto';
    }
  }
  if (typeof G !== 'undefined' && G.toast && typeof t === 'function')
    G.toast(on ? t('pad_on') : t('pad_off'));
}
addEventListener('gamepadconnected', e => {
  try { audioOn(); } catch (er) {}
  try { purifyGesture(); } catch (er) {}
  padConnected(true, e.gamepad);
});
addEventListener('gamepaddisconnected', () => padConnected(false, null));

// WHY A CONTROLLER CAN BE PLUGGED IN AND STILL NOT EXIST.
//
// Chromium does not hand a page its gamepads until the page has been
// interacted with — the same user-activation gate that keeps audio silent. On
// the web that gate is always satisfied early, because the "tap for sound"
// badge makes the player click before they get anywhere. In the desktop shell
// we deliberately removed the need to click (the score starts with the
// picture), and the unintended consequence was that a player who only ever
// touches a controller never grants activation, so navigator.getGamepads()
// keeps returning an empty rack and the game truthfully reports no pad. The
// shell now grants that activation itself on load; this records what was
// actually seen so the failure is never invisible again.
const PAD_DIAG = { api: !!navigator.getGamepads, slots: 0, live: 0, seen: '' };
function padDiag() {
  if (!PAD_DIAG.api) return 'no gamepad API in this browser';
  if (PAD_DIAG.live) return '';
  return PAD_DIAG.seen
    ? 'last seen: ' + PAD_DIAG.seen + ' — press a button on it'
    : 'no controller detected (' + PAD_DIAG.slots + ' slots) — press a button on it';
}
// IS THIS PAD ALIVE, OR IS IT A CORPSE THE BROWSER HAS NOT BURIED?
//
// After a disconnect Chromium can leave a dead object in the rack: `connected`
// is false, `buttons` is still a full array of seventeen entries, and nothing
// in it will ever move again. This test used to be "has buttons" — written to
// survive Bluetooth stacks that flap `connected` on a pad that is plainly
// working — and the cost of that was a disconnect/reconnect leaving PAD.on
// stuck TRUE against the corpse. Which meant, all at once: the touch controls
// hidden (they are hidden BECAUSE a pad is attached), no pad input arriving,
// and the Mind Nodes reading pad-only codes that could never fire. The game was
// unplayable and there was no way out of it from inside the game.
//
// So `connected` is believed when it is true, and when it is false the pad has
// to PROVE it is alive: a pressed button, a deflected stick, or a timestamp
// that is still advancing. A corpse proves none of those and is dropped.
const PAD_STAMP = {};
function padAlive(pd) {
  if (!pd) return false;
  const k = pd.index == null ? 'x' : pd.index;
  const ts = pd.timestamp || 0;
  const moved = PAD_STAMP[k] != null && ts > PAD_STAMP[k];
  PAD_STAMP[k] = ts;
  if (pd.connected) return true;
  if (pd.buttons && pd.buttons.some(bt => bt && (bt.pressed || bt.value > 0.4))) return true;
  if (pd.axes && pd.axes.some(a => Math.abs(a) > 0.4)) return true;
  return moved;
}
// THE WAY BACK, which has to exist whatever else is wrong. If the game ever
// believes in a controller that is not there, the player's own hand on the
// screen is the correction — and it must work even though the touch layer is
// deliberately pointer-transparent in pad mode, which is why this listens on
// the window and captures. A pad genuinely in use keeps its mode: only silence
// for three seconds lets a touch take it back.
addEventListener('touchstart', () => {
  if (typeof PAD === 'undefined' || !PAD.on) return;
  if (performance.now() - (PAD.lastInput || 0) < 3000) return;
  padConnected(false, null);
}, { passive: true, capture: true });
// THE STICK AS A FOUR-WAY CHOICE (owner, 2026-11-14, of the Mind Nodes: "it is
// hard to play it with the controller. It slips").
//
// The puzzles were taken OFF the stick for a good reason — read as two raw
// thresholds it fires diagonals and answers nobody chose (see GP_PL above) —
// and the cost was that the thumb every pad player actually has on the stick
// did nothing at all in them, and the d-pad's own diagonals dropped presses.
// The reason was the reading, not the stick. Read like this it cannot slip:
//   - it must be pushed FAR (0.62 of the way) to choose anything;
//   - one axis must clearly win (1.7x the other) — a diagonal chooses nothing;
//   - once it has chosen it is LATCHED: rolling round the rim changes nothing,
//     and it has to come back to the middle (under 0.3) before it can choose
//     again. One push, one answer, however sloppy the release.
// Returns 0 left, 1 up, 2 right, 3 down, or -1. Same order as TRI_ACTS.
let PAD_S4 = -1;
function padStick4(x, y) {
  const m = Math.hypot(x, y);
  if (PAD_S4 >= 0) { if (m < 0.3) PAD_S4 = -1; return PAD_S4; }
  if (m < 0.62) return -1;
  const ax = Math.abs(x), ay = Math.abs(y);
  if (ax > ay * 1.7) PAD_S4 = x < 0 ? 0 : 2;
  else if (ay > ax * 1.7) PAD_S4 = y < 0 ? 1 : 3;
  return PAD_S4;
}
function pollGamepad() {
  if (inputSuspended || !navigator.getGamepads) return;
  let gp = null;
  const rack = navigator.getGamepads();
  PAD_DIAG.slots = rack.length; PAD_DIAG.live = 0;
  for (const pd of rack) if (pd) PAD_DIAG.live++;
  for (const pd of rack) if (padAlive(pd)) { gp = pd; break; }
  if (gp && gp.id) PAD_DIAG.seen = gp.id.length > 40 ? gp.id.slice(0, 40) + '…' : gp.id;
  if (gp && !PAD.on) padConnected(true, gp);
  else if (!gp && PAD.on) padConnected(false, null);
  // the connect event does not always carry the pad (and some browsers fire a
  // bare event), so learn the identity from the poll the moment it is available
  if (gp && gp.id && PAD.id !== gp.id) { PAD.id = gp.id; PAD.kind = padKindOf(gp.id); }
  PAD.gp = gp;                       // live handle for rumble
  if (!gp) { PAD.ax = 0; PAD.dpx = false; PAD_S4 = -1; }
  const st = {};
  // Returning to the window must not turn a held controller button into a
  // new attack, menu confirmation or film skip. Release the pad first.
  if (padNeedsNeutral) {
    const active = gp && ((gp.buttons || []).some(b => b && (b.pressed || b.value > 0.4))
      || (gp.axes || []).some(a => Math.abs(a) > 0.4));
    if (active) return;
    padNeedsNeutral = false;
  }
  if (gp) {
    const b = gp.buttons, ax = gp.axes || [];
    const P = i => i >= 0 && b[i] && (b[i].pressed || b[i].value > 0.4);
    const A0 = ax[0] || 0, A1 = ax[1] || 0;
    // movement: left stick and d-pad both, always
    st.GP_L = P(14) || A0 < -0.4; st.GP_R = P(15) || A0 > 0.4;
    st.GP_U = P(12) || A1 < -0.4; st.GP_D = P(13) || A1 > 0.4;
    // ...and the D-PAD ON ITS OWN, because a stick is not a d-pad.
    //
    // For running around, merging them is right: nobody cares which they used.
    // For picking one of four answers it is wrong, and the Mind Nodes are where
    // it showed. A stick pushed up-left crosses the 0.4 threshold on BOTH axes,
    // so the puzzle sees LEFT and UP together and answers with whichever the
    // if-chain tests first; rolling from one direction to the next passes
    // through the diagonal and fires an answer nobody chose. In a memory
    // sequence a wrong answer costs the attempt, so the fight the player was
    // having was with the hardware.
    st.GP_PL = P(14); st.GP_PR = P(15); st.GP_PU = P(12); st.GP_PD = P(13);
    // how hard the stick is pushed sideways, and whether the d-pad is what is
    // moving her — pollInput turns these into walk or run (see PAD_RUN_PUSH)
    PAD.ax = Math.abs(A0); PAD.dpx = !!(P(14) || P(15));
    const s4 = padStick4(A0, A1);
    st.GP_SL = s4 === 0; st.GP_SU = s4 === 1; st.GP_SR = s4 === 2; st.GP_SD = s4 === 3;
    // live state + edge capture, so the config screen can show presses and bind
    PAD.lastPress = -1;
    for (let i = 0; i < b.length; i++) {
      const on = P(i);
      if (on && !PAD.down[i]) PAD.lastPress = i;
      PAD.down[i] = on;
    }
    // everything else comes from the (remappable) table
    for (const a of PAD_ACTIONS) st['GP_' + a] = P(PAD.map[a]);
    st.GP_OK = st.GP_JUMP; st.GP_BACK = st.GP_INT;
    // while rebinding, swallow the actions so a bind press does not also fire
    if (PAD.listen) for (const c of GP_CODES) st[c] = false;
  }
  let fresh = false;
  for (const code of GP_CODES) {
    const on = !!st[code];
    if (on) { keys[code] = 1; if (!GP_PREV[code]) { keysP[code] = 1; fresh = true; } }
    else keys[code] = 0;
    GP_PREV[code] = on;
  }
  // A PAD PRESS IS NOT A USER GESTURE, and that is a browser rule we cannot
  // argue with: audio stays locked until a click, tap or keypress. Somebody
  // playing entirely on a controller therefore got a silent game and no way to
  // fix it, because the "tap for sound" badge was only ever drawn over the
  // opening film — by the time they were playing there was nothing on screen
  // saying what was wrong. Two halves to the answer: try anyway (it costs
  // nothing, and it DOES work once the page has any activation at all, which is
  // common — clicking the window to focus it is enough), and keep the badge up
  // during play so the one tap that is needed is asked for. See drawSoundChip.
  // when the pad last did anything at all — the touch escape hatch above needs
  // to tell "in use" from "listed but gone"
  if (fresh) PAD.lastInput = performance.now();
  if (fresh && typeof audioOn === 'function') audioOn();
}
addEventListener('keydown', e => {
  if (inputSuspended) return;
  if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!e.repeat) { keys[e.code] = 1; keysP[e.code] = 1; }
  audioOn();
  try { purifyGesture(); } catch (er) {}
});
addEventListener('keyup', e => { keys[e.code] = 0; });
function releaseInput() {
  for (const k in keys) keys[k] = 0;
  for (const k in keysP) keysP[k] = 0;
  for (const k in GP_PREV) GP_PREV[k] = false;
  PAD.down = {}; PAD.lastPress = -1;
  padNeedsNeutral = true;
  if (typeof tCancelAll === 'function') tCancelAll();
}
function suspendInput() { inputSuspended = true; releaseInput(); }
function resumeInput() { inputSuspended = false; }
// ---------------------------------------------------------------------------
// GOING AWAY AND COMING BACK, OWNED IN ONE PLACE (MobilePlatform.Lifecycle).
//
// This was three listeners that each recomputed the same thing: blur suspends,
// focus un-suspends unless hidden, visibilitychange suspends unless focused.
// They were right, and they were still only half the job — nothing ever
// SUSPENDED THE AUDIO. The context was created once and left running through
// every backgrounding for the life of the tab, which on iOS is the documented
// way to get a context back in a state that will not play, and audio.js has
// only ever known how to resume one.
//
// Lifecycle is the same two states this file already tracked — BACKGROUNDED
// (hidden, pagehide) and INACTIVE (blur: the app switcher, Control Centre, a
// call) — held as a pair that cannot resume without having paused, which the
// three listeners could not promise on a page that LOADS hidden or unfocused.
//
// The loop is deliberately not gated on it. rAF already stops when the tab is
// hidden and SIM_MAX already bounds the catch-up, and pausing the picture
// because a desktop player clicked another window would be a change to how the
// game feels, which adding a touch layer is not a licence to make.
//
// It is installed from boot.js, because js/mobile-platform.js is concatenated
// AFTER this file and a top-level `new` here would run before it exists. If it
// is missing for any reason the old listeners go back in: a generated file that
// failed to load must never be able to take the input with it.
function installLifecycle() {
  if (installLifecycle.done) return;
  installLifecycle.done = true;
  if (typeof MobilePlatform === 'undefined' || !MobilePlatform.Lifecycle) {
    addEventListener('blur', suspendInput);
    addEventListener('focus', () => { inputSuspended = !!document.hidden; });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) suspendInput();
      else inputSuspended = !document.hasFocus();
    });
    return;
  }
  LIFE = new MobilePlatform.Lifecycle({
    // releaseInput is the game's own one — every held key, every pad button,
    // every finger — so there is one way to let go of the controls, not two.
    inputToReset: { reset: releaseInput },
    onPause() {
      inputSuspended = true;
      if (typeof AC !== 'undefined' && AC && AC.state === 'running') {
        try { const r = AC.suspend(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
      }
    },
    onResume() {
      resumeInput();
      // audio.js owns waking the stream back up; it already listens for the
      // visibility change and re-kicks the element. The context is ours.
      if (typeof AC !== 'undefined' && AC && AC.state === 'suspended' && typeof AUD_UNLOCKED !== 'undefined' && AUD_UNLOCKED) {
        try { const r = AC.resume(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
      }
    },
  });
}
// THE ANDROID BACK BUTTON. In an app it is a real button on the device, and
// its default behaviour is to close the app — which, mid-boss, is not a back
// button, it is a quit button. It now means what BACK means everywhere else in
// this game: leave the screen you are on, and pause the game if you are in it.
if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins
    && window.Capacitor.Plugins.App) {
  try {
    window.Capacitor.Plugins.App.addListener('backButton', () => {
      if (typeof G === 'undefined') return;
      if (G.state === 'PLAY') { G.state = 'PAUSE'; G.pauseIdx = 0; if (typeof sfx === 'function') sfx('ui'); }
      else if (G.state === 'MENU') { /* the title screen is the floor: stay */ }
      else { keys.VBACK = 1; keysP.VBACK = 1; setTimeout(() => { keys.VBACK = 0; }, 60); }
    });
  } catch (e) {}
}
// The tutorial gate lives INSIDE the read, not at every call site: during the
// waking rooms a verb that has not been taught reads as not pressed, whatever
// the finger did. See TUT_UNLOCK in game.js (function hoisting makes it
// callable from here despite file order).
// ---------------------------------------------------------------------------
// THE INPUT CONTRACT. One struct the game reads; three devices that write it.
//
// The action layer was already shared — KEYB maps an action to the codes that
// can produce it, and keyboard, pad and touch all write codes — but two things
// had leaked past it into the simulation. Player.update read TOUCH.axis to find
// out how hard a thumb was pushing, and it read the raw GP_L / GP_R codes to
// decide whether a pad was walking or running. The physics therefore knew which
// device was live, which is the one thing an input layer exists to prevent: it
// means a fourth device cannot be added without editing the movement resolver,
// and it means nothing can drive this game that is not a real finger.
//
// PI is that fourth thing. It carries what the actions cannot:
//
//   moveX / moveY  direction WITH MAGNITUDE. A key has none and reads +-1; the
//                  touch stick's push IS its speed and reads 0.34..1 (see
//                  tApplyJoy). The pad deliberately has none either — on a pad
//                  full speed is a DECISION (owner, 2026-09-05: click L3 while
//                  moving), not a tilt, so reading its tilt here would quietly
//                  replace that decision with a dial.
//   run            "give me this device's full speed". A keyboard always wants
//                  it; a thumb on a stick expresses it through magnitude; a pad
//                  wants it once the stick has been clicked in, and gives it up
//                  when the stick centres. That latch is a PAD IDIOM and now
//                  lives with the pad instead of on the player.
//   down/pressed   the same answers inD/inP give, per action, as data.
//
// AND IT IS A SEAM, not a cache. setInputSource() replaces the devices with any
// function that returns one of these structs — a test, a recorded run, an
// agent — and the game cannot tell the difference, because from the resolver
// down there is nothing left that knows what a finger is. That is the half of
// replay determinism that was missing; see docs/MOBILE_PLATFORM.md.
//
// inD/inP DISPATCH rather than always reading PI, and deliberately: with no
// source installed they are the same two expressions they have always been, so
// the device path keeps its exact semantics and its exact cost in the hottest
// accessor in the game, and nothing has to have called update() first for a
// key to be visible (tests/input-focus.cjs reads inP straight after a keydown).
const PI = { moveX: 0, moveY: 0, run: true, down: {}, pressed: {} };
let INPUT_SRC = null;
function setInputSource(fn) {
  INPUT_SRC = typeof fn === 'function' ? fn : null;
  releaseInput();                       // nothing a real finger left behind survives the handover
  pollInput();
}
function pollInput() {
  if (INPUT_SRC) {
    const s = INPUT_SRC() || {};
    PI.moveX = +s.moveX || 0; PI.moveY = +s.moveY || 0;
    PI.run = s.run !== false;
    const d = s.down || {}, pr = s.pressed || {};
    for (const n in KEYB) { PI.down[n] = !!d[n]; PI.pressed[n] = !!pr[n]; }
    return PI;
  }
  for (const n in KEYB) {
    PI.down[n] = KEYB[n].some(c => keys[c]);
    PI.pressed[n] = KEYB[n].some(c => keysP[c]);
  }
  const x = (PI.down.RIGHT ? 1 : 0) - (PI.down.LEFT ? 1 : 0);
  const push = (typeof TOUCH !== 'undefined' && TOUCH && TOUCH.axis) || 1;
  PI.moveX = x * push;
  PI.moveY = (PI.down.DOWN ? 1 : 0) - (PI.down.UP ? 1 : 0);
  // THE PAD'S RUN, armed by the click while she is already moving and given up
  // the moment the stick comes back to centre — which is what makes the click a
  // decision rather than a toggle. Read off the raw GP codes rather than PAD.on
  // so a pad left plugged in beside a keyboard cannot slow the keyboard down.
  //
  // AND THE STICK ITSELF RUNS (owner, 2026-11-14: "in the controller I don't
  // know how to run. It's only walking"). The click was the ONLY way to run and
  // nothing on screen said so, so a pad player walked the whole game. A stick
  // has a magnitude: pushed all the way it is asking for everything, exactly as
  // the touch stick does, and a gentle push is still the walk the click was
  // invented to protect. The d-pad has no magnitude, so like a key it runs.
  // The click still works — it is how you run on a worn stick that no longer
  // reaches the rim.
  const padMove = !!(keys.GP_L || keys.GP_R);
  if (!padMove) PAD.run = false;
  else if (inP('RUN')) PAD.run = true;
  const padFull = padMove && (!!PAD.dpx || (PAD.ax || 0) >= PAD_RUN_PUSH);
  PI.run = !padMove || !!PAD.run || padFull;
  return PI;
}
function inD(n) {
  if (typeof tutAllows === 'function' && !tutAllows(n)) return false;
  return INPUT_SRC ? !!PI.down[n] : KEYB[n].some(c => keys[c]);
}
function inP(n) {
  if (typeof tutAllows === 'function' && !tutAllows(n)) return false;
  return INPUT_SRC ? !!PI.pressed[n] : KEYB[n].some(c => keysP[c]);
}
function clearP() {
  for (const k in keysP) keysP[k] = 0;
  // ...and release the touch taps queued this frame — a tap is not a hold
  if (typeof TOUCH !== 'undefined' && TOUCH && TOUCH.tapRel && TOUCH.tapRel.length) {
    for (const c2 of TOUCH.tapRel) keys[c2] = 0;
    TOUCH.tapRel.length = 0;
  }
}

// ---------- gamepad rumble -------------------------------------------------
// Dual-rumble haptics (Chrome/Edge vibrationActuator; hapticActuators pulse
// as the fallback). Newer effects simply replace older ones.
// ---------------------------------------------------------------------------
// ROAR SHOCKWAVES: the sound of a roar made visible — expanding rings of
// pressure with sound-ticks riding them and a core flash at the throat.
// The caller sustains the tremble (cam.shake + rumble) while these fly.
// ---------------------------------------------------------------------------
const ROARFX = [];
// `halo` is the colour the wave GLOWS in; `col` stays the colour of its edge.
// A roar passes one colour and gets a halo of the same; the supercharge passes
// a white edge over the kingdom's own light, so the same wave reads as hers in
// every zone without the callers each inventing a palette.
function roarWave(x, y, col, halo) {
  for (let i = 0; i < 3; i++) ROARFX.push({ x, y, t: -i * 0.12, col, halo: halo || col, seed: (i * 5 + 3) });
  ROARFX.push({ x, y, t: 0, col, halo: halo || col, flash: true });
}
function updateRoarFX(dt) {
  for (let i = ROARFX.length - 1; i >= 0; i--) {
    ROARFX[i].t += dt;
    if (ROARFX[i].t > (ROARFX[i].flash ? 0.24 : 0.9)) ROARFX.splice(i, 1);
  }
}
function drawRoarFX(c) {
  // drawn by the shader layer, from this same state, when there is one (js/fxgl.js)
  if (typeof fxglOn === 'function' && fxglOn()) return;
  for (const r of ROARFX) {
    if (r.t < 0) continue;
    c.save(); c.globalCompositeOperation = 'lighter';
    if (r.flash) {
      // the throat flash: one hard pulse of the roar's own color
      const k = r.t / 0.24;
      c.globalAlpha = (1 - k) * 0.5;
      const g = c.createRadialGradient(r.x, r.y, 2, r.x, r.y, 26 + k * 110);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, r.col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(r.x, r.y, 26 + k * 110, 0, 7); c.fill();
    } else {
      // A PRESSURE RING (owner, 2026-09-18, from a screenshot of the
      // supercharge: "these surrounding effect circles needs to be more vfx and
      // animated in more details and shine"). It was one flat stroke and twelve
      // equal ticks. It is now a wave with a body, in four layers, all driven
      // by r.t so a frozen clock freezes it and nothing is allocated per frame:
      //   1. a wide soft halo in the wave's own light, brightest at birth
      //   2. a segmented inner wave a beat behind, whose dash offset is a
      //      function of the radius, so it turns as the wave expands
      //   3. sparks on the rim — two rings of them, uneven in length, spinning
      //      against each other — instead of twelve identical ticks
      //   4. a hot crisp edge on top, with real glow where the tier can pay
      // The radius eases out — a blast leaves fast and slows — where the old
      // ring inflated at one speed like a hoop. Same 0.9s, same reach.
      const k = r.t / 0.9, e = 1 - (1 - k) * (1 - k), rad = 26 + e * 640, fade = Math.pow(1 - k, 1.3);
      const sq = 0.8, halo = r.halo || r.col, seed = r.seed | 0;
      // 1. halo
      c.strokeStyle = halo;
      c.globalAlpha = 0.22 * fade; c.lineWidth = 22 * (0.5 + 0.5 * fade);
      c.beginPath(); c.ellipse(r.x, r.y, rad, rad * sq, 0, 0, 7); c.stroke();
      c.globalAlpha = 0.38 * fade; c.lineWidth = 8;
      c.beginPath(); c.ellipse(r.x, r.y, rad, rad * sq, 0, 0, 7); c.stroke();
      // 2. the segmented wave behind the edge
      const ri = Math.max(4, rad - 18 - 40 * e);
      c.setLineDash([12, 16]); c.lineDashOffset = -rad * 1.4;
      c.globalAlpha = 0.55 * fade; c.lineWidth = 2.4;
      c.beginPath(); c.ellipse(r.x, r.y, ri, ri * sq, 0, 0, 7); c.stroke();
      c.setLineDash([]);
      // 3. sparks: a coarse ring spinning one way, a fine ring the other
      c.strokeStyle = '#ffffff';
      c.globalAlpha = 0.95 * fade; c.lineWidth = 1.8;
      c.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2 + e * 1.6 + ((seed >> (i % 5)) & 1) * 0.1;
        const len = (7 + 12 * fade) * (0.55 + 0.45 * (((seed + 2) * (i + 1)) % 4) / 3);
        const ca = Math.cos(a), sa = Math.sin(a);
        c.moveTo(r.x + ca * (rad - 2), r.y + sa * (rad - 2) * sq);
        c.lineTo(r.x + ca * (rad + len), r.y + sa * (rad + len) * sq);
      }
      c.stroke();
      c.globalAlpha = 0.6 * fade; c.lineWidth = 1;
      c.beginPath();
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * Math.PI * 2 - e * 2.4;
        const ca = Math.cos(a), sa = Math.sin(a);
        c.moveTo(r.x + ca * (rad - 6), r.y + sa * (rad - 6) * sq);
        c.lineTo(r.x + ca * (rad + 3), r.y + sa * (rad + 3) * sq);
      }
      c.stroke();
      // 4. the hot edge. NO shadowBlur here, and that is measured, not taste:
      // with it the roar cost +12.4 ms/frame on the harness machine and
      // without it +2.4 — the blur was 80% of the wave and pushed NULLFANG's
      // bosspace idle read from 36% over the 40% bar, because a boss that
      // roars is a boss drawing three of these at once. The shine comes from
      // one more additive pass in the halo colour, which costs a stroke.
      c.globalAlpha = 0.5 * fade; c.strokeStyle = halo; c.lineWidth = 5 + fade * 6;
      c.beginPath(); c.ellipse(r.x, r.y, rad, rad * sq, 0, 0, 7); c.stroke();
      c.globalAlpha = Math.min(1, 0.9 * Math.sqrt(fade)); c.strokeStyle = r.col;
      c.lineWidth = 2 + fade * 5;
      c.beginPath(); c.ellipse(r.x, r.y, rad, rad * sq, 0, 0, 7); c.stroke();
    }
    c.restore();
  }
}

let lastFeedbackPulse = -Infinity;
let lastFeedbackStrength = 0;
function padRumble(strong, weak, ms) {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  // A hit and its camera kick can arrive together. Do not restart the motors.
  const strength = clamp(Math.max(strong, weak), 0, 1);
  if (now - lastFeedbackPulse < 40 && strength <= lastFeedbackStrength) return;
  lastFeedbackPulse = now;
  lastFeedbackStrength = strength;
  const duration = Math.min(1000, Math.max(1, ms || 100));
  const settle = result => { if (result && typeof result.catch === 'function') result.catch(() => {}); };
  try {
    const act = PAD.on && PAD.gp && (PAD.gp.vibrationActuator || (PAD.gp.hapticActuators && PAD.gp.hapticActuators[0]));
    if (act && act.playEffect) {
      settle(act.playEffect('dual-rumble', { duration,
        strongMagnitude: clamp(strong, 0, 1), weakMagnitude: clamp(weak, 0, 1) }));
      return;
    }
    if (act && act.pulse) { settle(act.pulse(clamp(Math.max(strong, weak), 0, 1), duration)); return; }
    // Use the existing native/mobile adapter for gameplay events as well as taps.
    if (typeof TOUCH !== 'undefined' && TOUCH.enabled && typeof tBuzz === 'function') tBuzz(duration);
  } catch (e) {}
}
const cam = { x:0, y:0, shake:0, zoom:1, lead:0, shakeX:0, shakeY:0, room:null, look:0, lookHold:0, lookDir:0, extUp:0, extDn:0, soft:0 };
// the look: seconds of standing still on UP/DOWN before the frame pans, and
// how far it pans as a fraction of the visible height
const LOOK_HOLD = 0.35, LOOK_SPAN = 0.32;
let prevShake = 0;
// how close her head may come to the top of the frame, in screen px, before a
// free jump starts to lift it
const CAM_TOP = 46;
// Is she off the ground in the plain sense — a jump or a fall — rather than
// climbing or flying? See the note in updateCam.
function camJumping(p) {
  if (p.wallSlide || (p.wallT || 0) > 0) return false;
  if ((p.glideT || 0) > 0 || p.grap || p.soar || p.flungT > 0) return false;
  if (typeof G !== 'undefined' && G && (G.gateWalk || G.cut || G.wake || G.bossEntry)) return false;
  // under an opening into the room above, she is on her way somewhere
  if (p.y < 4 * (typeof TILE === 'number' ? TILE : 32) && typeof vlinkSeamless === 'function' && vlinkSeamless('T')) return false;
  if ((cam.extUp || 0) > 0 || (cam.extDn || 0) > 0) return false;
  return true;
}
function updateCam(px, py, rw, rh, dt) {
  const robo = !(typeof isHero === 'function' && isHero()) && !(typeof window !== 'undefined' && window.EDITOR);
  const baseZoom = robo && typeof PRESENTATION !== 'undefined' ? PRESENTATION.explorationZoom : 1;
  let wantZoom = baseZoom;
  const p = typeof player !== 'undefined' && player && !player.dead ? player : null;
  const boss = typeof G !== 'undefined' && G.boss && !G.boss.dead && !['dorm','intro'].includes(G.boss.st) ? G.boss : null;
  // A close exploration camera must not crop the tell of a much larger foe.
  // Fit both bodies during real encounters, and settle back after the fight.
  if (robo && p && boss && typeof boss.cx === 'function') {
    const dx=Math.abs(boss.cx()-px), dy=Math.abs(boss.cy()-py);
    wantZoom=Math.max(1.05,Math.min(baseZoom,760/(dx+boss.w/2+100),400/(dy+boss.h/2+90)));
    if (!(G.meet && (G.meet.ph==='watch'||G.meet.ph==='coil'))) {
      px = px*.65 + boss.cx()*.35;
      py = py*.75 + boss.cy()*.25;
    }
  }
  const snap=dt>=.5 || cam.room!==(typeof G!=='undefined'?G.roomId:null);
  const step=Math.max(0,Math.min(dt,.1));
  cam.zoom = snap ? wantZoom : lerp(cam.zoom||wantZoom,wantZoom,1-Math.exp(-step*4));
  cam.room = typeof G!=='undefined'?G.roomId:null;
  const z=cam.zoom, ox=480*(1-1/z), oy=270*(1-1/z);
  const facing=p ? p.face : 0, speed=p ? Math.abs(p.vx) : 0;
  const lead=facing*(robo ? 25+23*Math.min(1,speed/340) : 65);
  cam.lead=snap?lead:lerp(cam.lead||0,lead,1-Math.exp(-step*18));
  const boundX=v=>rw<960/z?(rw-960)/2:clamp(v,-ox,rw-960+ox);
  // past the top or bottom only toward a room drawn there (game.js vlinkCam):
  // a vertical pair is one shaft, and the frame follows her through it
  const eu=cam.extUp||0, ed=cam.extDn||0;
  const boundY=v=>rh<540/z?(rh-540)/2:clamp(v,-oy-eu,rh-540+oy+ed);
  // A JUMP DOES NOT MOVE THE FRAME (owner, 2026-11-14: "jumping with the cat is
  // moving the camera with it upward, which is preventing me from seeing the
  // ground when I try to hit it when I go down... the camera should not follow
  // the cat. The cat should float into the space freely until it reaches the
  // upper limit of the screen, and then you follow it with the camera.
  // Otherwise, the camera stays still").
  //
  // The frame is aimed at THE GROUND SHE LAST STOOD ON (cam.gy), not at her
  // body. Off the ground and above that line the aim does not move, so the
  // floor she jumped from — the crust she is about to plunge on — stays exactly
  // where it was. Three things still move it:
  //   - she lands somewhere: the aim becomes that ground, and the frame eases to it;
  //   - she drops BELOW the line (a ledge, a pit): the aim follows her down, a
  //     fall has to show where it is going;
  //   - she nears the top edge: the band below lifts the frame just enough to
  //     keep her in it (CAM_TOP), which is the owner's "upper limit".
  // And three things are not jumps, and keep the old body-follow: a wall she is
  // climbing, a flight verb (glide, grapple, the soar), and the mouth of a room
  // that continues upward — she has to see where she is going in all of them.
  const free=!!(p&&!boss&&!p.on&&!snap&&camJumping(p));
  if(p&&(!free||cam.gy==null||py>cam.gy)) cam.gy=py;
  const aimY=free?cam.gy:py;
  const fall=p ? clamp(p.vy/980,free?0:-1,1)*20*(free&&py<cam.gy-4?0:1) : 0;
  // LOOKING UP AND DOWN (owner, 2026-09-27: "looking down should move the
  // screen down or show me part of the down area; looking up does the same").
  // Hold UP or DOWN while standing still and, after a beat, the frame pans a
  // third of a screen that way; let go and it comes back. The beat is what
  // keeps it off every other use of the stick: a tap, an up-attack, a door,
  // a drop through a ledge or a walk never lasts that long standing still.
  const vdir=(typeof inD==='function'&&p&&p.on&&!boss&&typeof G!=='undefined'&&G.state==='PLAY'
    &&Math.abs(p.vx)<40&&!p.swing&&!(p.dashT>0)&&!inD('LEFT')&&!inD('RIGHT'))
    ? (inD('DOWN')?1:0)-(inD('UP')?1:0) : 0;
  cam.lookHold=vdir&&vdir===cam.lookDir?(cam.lookHold||0)+step:0;
  cam.lookDir=vdir;
  const lookWant=snap?0:(cam.lookHold>=LOOK_HOLD?vdir*LOOK_SPAN*540/z:0);
  cam.look=snap?0:lerp(cam.look||0,lookWant,1-Math.exp(-step*(lookWant?4.5:7)));
  const tx=boundX(px-480+cam.lead);
  const ty=boundY(aimY-(robo?270+112/z:300)+fall+cam.look);
  cam.x=snap?tx:lerp(cam.x,tx,1-Math.exp(-step*11));
  cam.y=snap?ty:lerp(cam.y,ty,1-Math.exp(-step*9));
  // Keep the character within a safe vertical band even during a fast drop.
  // Room bounds win at the roof/floor; they are never exchanged for black void.
  if (p && robo && !boss) {
    const centre=p.y+p.h/2;
    // ...a band that travels with the look, or the look is clamped straight off
    const lk=cam.look||0;
    // in a free jump the band's top is the top of the frame itself: she may rise
    // until her head is CAM_TOP from the edge before anything moves
    const hi=free?Math.max(centre-270+120/z,p.y-oy-CAM_TOP/z):centre-270+120/z;
    const banded=boundY(clamp(cam.y,centre-270-155/z+Math.min(0,lk),hi+Math.max(0,lk)));
    // A SILENT ROOM CHANGE (game.js vlinkHandover) can leave her outside the
    // band for a moment — the old room's floor held the frame while she fell
    // past it. Snapping to the band there would be the very cut the handover
    // exists to remove, so for a beat the band is approached, not imposed.
    if((cam.soft||0)>0){cam.soft=Math.max(0,cam.soft-step);cam.y=lerp(cam.y,banded,1-Math.exp(-step*10));}
    else cam.y=banded;
  }
  if (cam.shake > prevShake+2.5)
    padRumble(clamp(cam.shake/13,.15,1),clamp(cam.shake/9,.2,1),60+cam.shake*16);
  prevShake=cam.shake;
  cam.shake=Math.max(0,cam.shake-step*22);
  cam.shakeTime=(cam.shakeTime||0)+step;
  const amplitude=Math.min(8,cam.shake)/z;
  // Every layer samples the SAME shake in a frame. Independent random
  // offsets for the tile plane, character and fringe used to tear the scene.
  cam.shakeX=Math.sin(cam.shakeTime*91)*amplitude;
  cam.shakeY=Math.sin(cam.shakeTime*113+.8)*amplitude*.6;
}
function camSX() { return cam.x+(cam.shakeX||0); }
function camSY() { return cam.y+(cam.shakeY||0); }

let parts = [];
function addPart(x, y, vx, vy, life, color, size, grav, glow) {
  if (typeof FOE_READ !== 'undefined' && FOE_READ.sil) return;   // a rim's stencil pass lays nothing (js/foeread.js)
  // the budget is the device's, not the effect's — every burst in the game asks
  // for as many as it wants and gets as many as this machine can draw
  if (parts.length >= (typeof QUAL !== 'undefined' ? QUAL.parts : 600)) return;
  const p = { x, y, vx, vy, life, life0: life, color, size: size || 3, grav: grav == null ? 600 : grav, glow: !!glow };
  parts.push(p); return p;
}
// Tiny cosmetic hardware, never pickups or lost robot limbs. Shares the
// existing particle budget, room cleanup and clock; no new unbounded emitter.
// `away` (optional, +1/-1): the side the blow came through to. Scrap leaves a
// struck plate the way the blow was going — three pieces in four — and the
// rest kicks back toward the striker, which is what makes it read as a hit and
// not as a leak.
function metalBurst(x, y, count, heavy, away) {
  let available = Math.max(0, 80 - parts.filter(p => p.metal).length);
  for (let i = 0; i < Math.min(count, available); i++) {
    const side = away ? (i % 4 === 3 ? -away * 0.5 : away) : 0;
    const vx = side ? side * rnd(0.25, 1) * (heavy ? 320 : 230) : rnd(-1, 1) * (heavy ? 210 : 130);
    const p = addPart(x, y, vx, rnd(-260, -70),
      rnd(0.32, 0.65), i % 2 ? '#aeb9c8' : '#e6edf4', away ? rnd(3, 5.5) : rnd(2, 4), 680, false);
    if (p) Object.assign(p, { metal: i % 2 ? 'shard' : 'screw', angle: rnd(0, Math.PI), spin: rnd(-14, 14), bounced: false });
  }
}
function burst(x, y, n, color, sp, life, grav, size, glow) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), s = rnd(sp * 0.3, sp);
    addPart(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd((life || 0.6) * 0.5, life || 0.6), color, rnd(1.5, size || 4), grav, glow);
  }
}
function updateParts(dt) {
  // the shader effects ride the particles' clock: wherever the simulation
  // advances its sparks (and slows them, through a hit-stop), it advances these
  if (typeof fxglUpdate === 'function') fxglUpdate(dt);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    const oldY = p.y;
    p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.metal) {
      p.angle += p.spin * dt;
      if (!p.bounced && p.vy > 0 && typeof solidAt === 'function' && typeof G !== 'undefined' && G.grid) {
        const tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE);
        if (oldY <= ty * TILE && solidAt(tx, ty)) { p.y = ty * TILE - 1; p.vy *= -0.3; p.vx *= 0.55; p.bounced = true; }
      }
    }
  }
}
function drawParts(c) {
  // Canvas2D shadowBlur is a per-draw blur with no batching. Six hundred glowing
  // particles is six hundred blurs, and on a phone that alone is the frame.
  const glowOK = typeof QUAL === 'undefined' || QUAL.glow;
  for (const p of parts) {
    c.globalAlpha = Math.max(0, p.life / p.life0);
    // A SPARK IS A STREAK. A glowing particle was a square with a shadowBlur:
    // a blurred dot that looks the same at any speed, and one Canvas blur each.
    // It is drawn along its own velocity now — a hot white core inside a tail
    // of its colour, additive, as long as it is fast — which is what a thrown
    // spark looks like and costs two strokes and no blur.
    if (p.glow && !p.metal) {
      const sp = Math.hypot(p.vx, p.vy), k = Math.max(0, p.life / p.life0);
      const len = Math.min(26, 2 + sp * 0.035), ux = sp > 1 ? p.vx / sp : 0, uy = sp > 1 ? p.vy / sp : 1;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      c.strokeStyle = p.color; c.lineWidth = p.size * (0.7 + 0.5 * k);
      c.beginPath(); c.moveTo(p.x - ux * len, p.y - uy * len); c.lineTo(p.x, p.y); c.stroke();
      c.strokeStyle = '#ffffff'; c.globalAlpha *= 0.85; c.lineWidth = Math.max(0.8, p.size * 0.34);
      c.beginPath(); c.moveTo(p.x - ux * len * 0.45, p.y - uy * len * 0.45); c.lineTo(p.x, p.y); c.stroke();
      c.restore();
      continue;
    }
    if (p.glow && glowOK) { c.shadowColor = p.color; c.shadowBlur = 10; }
    c.fillStyle = p.color;
    if (p.metal) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.angle);
      if (p.metal === 'screw') {
        c.fillRect(-p.size * 0.25, -p.size, p.size * 0.5, p.size * 2);
        c.fillRect(-p.size * 0.7, -p.size, p.size * 1.4, p.size * 0.55);
      } else { c.beginPath(); c.moveTo(-p.size, p.size * 0.5); c.lineTo(0, -p.size); c.lineTo(p.size, 0); c.closePath(); c.fill(); }
      c.restore();
    } else c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
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
