// CLAWBYTE — synthesized audio: SFX + original cinematic OST (no assets, all code)
let AC = null, MUTED = false, MUSIC_ON = true, AUD_UNLOCKED = false;
function audioOn() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (!AC) return;
  if (AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
  if (!AUD_UNLOCKED) {
    // iOS/Safari unlock: play a 1-sample silent buffer inside the user gesture
    try {
      const b = AC.createBuffer(1, 1, 22050);
      const s = AC.createBufferSource();
      s.buffer = b; s.connect(AC.destination); s.start(0);
      AUD_UNLOCKED = true;
    } catch (e) {}
  }
  if (typeof loadMedia === 'function') loadMedia();
  // A track that was START-ED while the page was still silent is sitting there
  // paused, because no browser will play audio nobody asked for. This gesture
  // is the permission it was waiting on — take it now, not on the next 2.5s
  // watchdog tick, or the opening plays its first seconds mute.
  musKick();
}
// Is the score being held back by the autoplay policy? True when a recorded
// track has been asked for and the element is still paused — which is exactly
// the state that should be showing the player a way to turn the sound on.
function soundLocked() {
  if (MUTED || !MUSIC_ON) return false;
  const n = RECNODE;
  // A track the browser cannot decode at all is not "waiting for a tap" — no
  // tap will ever start it, so promising the player sound would be a lie.
  if (!n || !n.el || n.el.error) return false;
  return !!n.el.paused;
}
// ---------- recorded-sample playback (CC0 assets, synth fallback) ----------
// ---------------------------------------------------------------------------
// MUSIC STREAMS. It used to be pulled down whole, decoded with decodeAudioData
// and held as raw float PCM for the entire session — two tracks came to about
// SIXTY MEGABYTES resident, which on a phone is the most expensive thing the
// game did by a wide margin, and it happened whether or not you ever heard them.
//
// An <audio> element streams: the browser buffers a few seconds, plays, and
// throws the rest away. Memory goes from tens of megabytes to roughly nothing,
// playback starts sooner because it does not wait for the whole file, and it
// costs nothing anywhere else because music never needed sample-accurate
// scheduling — only the little SFX do, and those still decode.
// ---------------------------------------------------------------------------
let RECNODE = null;
// Where each track was when something took it off. Crossing a zone border used
// to restart the score from bar one, so walking back and forth across a border
// — which is most of how this game is played — meant hearing the same opening
// eight bars over and over and never the rest of the piece. A kingdom's theme
// now picks up where it left off. Fights and fanfares are excluded: those are
// meant to start at the top every time.
const MUS_POS = {};
const MUS_RESTART = /^(boss|mus_boss|mus_null|mus_talon|mus_furnace|mus_glaciere|mus_prism|mus_mother|mus_title|mus_intro|mus_ending|ambient$)/;
// EVERY MUSIC ELEMENT EVER MADE, so exactly one of them can be playing. A
// stream that was asked for while the page was still silent is not playing and
// not stopped — it is pending, and the tap that finally unlocks audio can wake
// several at once. That is how two scores end up over each other. One place
// now decides which single element is allowed to make sound.
const MUS_ALL = [];
function musSolo(keep) {
  for (const el of MUS_ALL) {
    // An element in a deliberate fade-out is the OTHER half of a cross-fade and
    // must be left alone — cutting it is the hard music change this game goes
    // out of its way not to make. Anything else playing is not meant to be.
    if (el === keep || el._fading) continue;
    try { if (!el.paused) el.pause(); el.volume = 0; } catch (e) {}
  }
}
function musKill(el) {
  try { el.pause(); el.volume = 0; el.src = ''; el.load(); } catch (e) {}
  const i = MUS_ALL.indexOf(el);
  if (i >= 0) MUS_ALL.splice(i, 1);
}
function stopRecorded() {
  const n = RECNODE;
  RECNODE = null;
  if (!n) return;
  try { if (!MUS_RESTART.test(n.key)) MUS_POS[n.key] = n.el.currentTime || 0; } catch (e) {}
  // A stream that never actually started has nothing to fade — and fading it
  // leaves it alive for another second, which is exactly long enough for a
  // gesture to arrive and start it underneath its replacement.
  try { if (n.el.paused) { musKill(n.el); return; } } catch (e) {}
  // fade the outgoing stream rather than cutting it dead mid-note
  n.el._fading = true;
  let v = 0;
  try { v = n.el.volume; } catch (e) {}
  // Long enough to hear as a CROSS-FADE. At a third of a second the old track
  // is simply gone before the new one arrives, which is a cut with extra steps
  // — and the moment this matters most is walking into a guardian's chamber.
  const iv = setInterval(() => {
    v -= 0.045;
    try {
      if (v <= 0.01) { musKill(n.el); clearInterval(iv); }
      else n.el.volume = Math.max(0, Math.min(1, v));
    } catch (e) { clearInterval(iv); }
  }, 40);
}
// A streamed track stops for reasons that have nothing to do with the game: the
// network stalls, the phone pauses audio when the app goes to the background or
// a call arrives, or the loop simply fails to come round. None of it raises an
// error anybody was listening for — the music just ends, mid-level, and stays
// ended. Anything that leaves the current track paused gets it started again.
function musKick() {
  const n = RECNODE;
  if (!n || MUTED || !MUSIC_ON) return;
  try {
    if (n.el.paused && n.el.src) {
      const pr = n.el.play();
      if (pr && pr.catch) pr.catch(() => {});
    }
    musSolo(n.el);
  } catch (e) {}
}
if (typeof addEventListener === 'function') {
  addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(musKick, 200); });
  setInterval(musKick, 2500);
}
// THE DUCK. While a trial is open the stream steps back to a third of its
// volume, because the trial's notes ARE the interface — the memory game is
// unreadable by ear with music over it. The game loop sets MUS_DUCK from
// G.state every frame (see updateMusic's caller); this interval eases the
// element toward target*duck from wherever the fade-in left it. It leaves a
// stream that is fading OUT alone — that fade owns the element until it dies.
let MUS_DUCK = 1;
if (typeof setInterval === 'function') {
  setInterval(() => {
    const n = RECNODE;
    if (!n || n.el._fading) return;
    try {
      const want = Math.max(0, Math.min(1, n.target * MUS_DUCK));
      const v = n.el.volume;
      if (Math.abs(v - want) > 0.025) n.el.volume = v + Math.sign(want - v) * 0.05;
      else if (v !== want) n.el.volume = want;
    } catch (e) {}
  }, 90);
}
function playRecorded(key, gain) {
  stopRecorded();
  const src = MEDIA_SRC.stream && MEDIA_SRC.stream[key];
  if (!src) return false;
  try {
    const el = new Audio();
    el.src = src; el.loop = true; el.preload = 'auto';
    const target = Math.max(0, Math.min(1, gain));
    const node = { el, key, target };
    el.volume = 0;                                   // faded in below
    const pos = MUS_POS[key] || 0;
    if (pos > 0) {
      const seek = () => { try { el.currentTime = pos; } catch (e) {} };
      seek();
      el.addEventListener('loadedmetadata', seek, { once: true });
    }
    ['pause', 'stalled', 'suspend', 'waiting', 'ended'].forEach(ev =>
      el.addEventListener(ev, () => setTimeout(musKick, 150)));
    RECNODE = node;
    MUS_ALL.push(el);
    musSolo(el);
    let v = 0;
    const iv = setInterval(() => {
      if (RECNODE !== node) { clearInterval(iv); return; }
      v += 0.05;
      try { el.volume = Math.max(0, Math.min(1, Math.min(target * MUS_DUCK, v))); } catch (e) {}
      if (v >= target) clearInterval(iv);
    }, 40);
    const pr = el.play();
    if (pr && pr.then) pr.then(() => musSolo(el), () => {});
    return true;
  } catch (e) { return false; }
}
// THE MACHINE IN HER THROAT (owner: "a minimal echo for the character's voice
// to make it a little more mechanic"). Every recorded take of HER voice runs
// through one short metallic slapback on top of the dry signal: a single
// 55 ms feedback comb — the classic Schroeder comb stage, the same unit
// freeverb-family reverbs are built from — band-limited around 1.9 kHz so
// the repeats ring like a small steel chamber rather than a canyon. Wet sits
// at about a fifth of the dry level: the voice stays the recorded take, the
// room it speaks in becomes the machine. One shared chain, built lazily and
// rebuilt if the AudioContext is ever replaced; overlapping barks share it,
// which is both cheaper and how a real room behaves.
let VOXMECH = null;
function voxMech() {
  if (!AC) return null;
  if (VOXMECH && VOXMECH.ac === AC) return VOXMECH;
  const f = AC.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 1.1;
  const d = AC.createDelay(0.3); d.delayTime.value = 0.055;
  const fb = AC.createGain(); fb.gain.value = 0.30;
  const wet = AC.createGain(); wet.gain.value = 0.22;
  f.connect(d); d.connect(fb); fb.connect(d);
  d.connect(wet); wet.connect(AC.destination);
  VOXMECH = { ac: AC, in: f };
  return VOXMECH;
}
function playBuf(key, vol, rate) {
  if (!AC || MUTED) return false;
  // a sound in the second wave that is asked for early jumps the queue. This
  // call misses once — sfx() falls through to the synthesised version, which is
  // what it does for a sound that has not arrived for any other reason — and
  // every call after it is the real take.
  if (!MBUF[key]) { if (typeof mediaAudio === 'function') mediaAudio(key); return false; }
  const s = AC.createBufferSource(), g = AC.createGain();
  s.buffer = MBUF[key];
  if (rate) s.playbackRate.value = rate;
  g.gain.value = vol;
  s.connect(g); g.connect(AC.destination);
  if (key.indexOf('hzd_') === 0) {
    const m = voxMech();
    if (m) g.connect(m.in);
  }
  s.start();
  return true;
}
// unlock on ANY first interaction, not just canvas/keyboard
['pointerdown', 'touchstart', 'touchend', 'mousedown', 'keydown', 'click'].forEach(ev =>
  addEventListener(ev, audioOn, { passive: true }));
function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }

// ---------- low-level voices ----------
function tone(freq, dur, type, vol, slideTo, delay) {
  if (!AC || MUTED) return;
  const t0 = AC.currentTime + (delay || 0);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(28, slideTo), t0 + dur);
  g.gain.value = vol || 0.07;
  g.gain.setValueAtTime(vol || 0.07, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(AC.destination);
  o.start(t0); o.stop(t0 + dur + 0.03);
}
function noiseBuf(dur) {
  const n = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, n, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  return buf;
}
function hiss(dur, vol, delay) {
  if (!AC || MUTED) return;
  const t0 = AC.currentTime + (delay || 0);
  const src = AC.createBufferSource(), g = AC.createGain();
  src.buffer = noiseBuf(dur);
  g.gain.value = vol || 0.1;                       // see note below on delays
  g.gain.setValueAtTime(vol || 0.1, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(g).connect(AC.destination);
  src.start(t0);
}
function whoosh(dur, f0, f1, vol, delay) {
  if (!AC || MUTED) return;
  const t0 = AC.currentTime + (delay || 0);
  const src = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  src.buffer = noiseBuf(dur);
  f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(f0, t0);
  f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.value = vol;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(AC.destination);
  src.start(t0);
}

// ---------------------------------------------------------------------------
// HER CLAWS, NOT A SWORDSMAN'S ARM. The attack used to fire a recorded battle
// shout — a person yelling as they swing — under a broad airy whoosh. That is
// the sound of a human fighting, and she is neither: she is a small machine
// with three steel claws on a servo arm, and what you should hear is the arm
// moving and the claws passing, not somebody's effort.
//
// So it is built from what is actually happening: the servo turns first, then
// three (four on the heavy third hit) narrow, bright shears sweep DOWNWARD a
// few milliseconds apart — a blade going past your ear, not a bat swinging
// through open air — and the metal rings for an instant after the pass. The
// third hit of the string adds the weight behind it and a small electrical
// crackle off the strike.
//
// Synthesized rather than sampled because this sound has to land on the frame
// the paw does: no file to fetch, no decode, no latency, and every swing can be
// a few percent different so a long fight never turns into one clip repeating.
// ---------------------------------------------------------------------------
function clawShear(f0, f1, dur, vol, delay, q) {
  if (!AC || MUTED) return;
  const t0 = AC.currentTime + (delay || 0);
  const src = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  src.buffer = noiseBuf(dur);
  // narrow, so it reads as an EDGE going past rather than a gust of air
  f.type = 'bandpass'; f.Q.value = q || 7.5;
  f.frequency.setValueAtTime(f0, t0);
  f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.value = 0.0001;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.004);   // instant, but not a click
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(AC.destination);
  src.start(t0);
}
// ===========================================================================
// THREE WEAPONS, THREE VOICES. The swing is the sound the player hears more
// than any other in the game, and one whoosh serving all three weapons would
// make the crystal an upgrade you cannot HEAR. The owner's spec, verbatim:
// the claw's whoosh, the single crystal's, and the reunited double's are three
// different sounds — and the claw itself needed body, not just claws.
//
//   CLAW      air first, then three shears. The old mix was shears-only —
//             precise but THIN, all click and no cut, which on a phone speaker
//             is why it read as "basic". A broad low air-cut now moves under
//             the passes, so the arm displaces air before the claws split it.
//   CRYSTAL   one clean pass. Less noise, more tone: a rising cut with a
//             GLASS RING that hangs after it — two detuned high partials, the
//             crystal still singing after the arm has stopped. Nothing else in
//             the vocabulary sustains above 1.8 kHz, which is what makes it
//             measurable (tests/slashsnd.cjs).
//   DOUBLE    both ends pass. TWO overlapping cuts ~55 ms apart, centred
//             lower, with the ring an octave down plus its fifth — a heavier,
//             turning sound, because the weapon is now rotating mass.
//
// Which one plays is read from the save, so the moment tasks #79/#80 set the
// flags the audio follows with no further wiring. Until then: claw.
function wielded() {
  // while the thrown blade is out she fights bare-clawed, and the sound
  // agrees with the hand: claw whoosh until the catch
  if (typeof G !== 'undefined' && G.boomer) return 'claw';
  const f = (typeof G !== 'undefined' && G.save && G.save.flags) || {};
  return f.crystal2 ? 'crystal2' : (f.crystal ? 'crystal1' : 'claw');
}
function crystalSlash(beat) {
  if (!AC || MUTED) return;
  const heavy = beat >= 2;
  const j = () => 0.97 + Math.random() * 0.06;
  // the cut: cleaner and more tonal than the claw — less Q on the noise,
  // rising, one single pass
  whoosh(heavy ? 0.20 : 0.14, 600 * j(), heavy ? 3600 : 3200, heavy ? 0.10 : 0.08);
  // the ring: the crystal keeps singing after the pass. Two detuned partials a
  // few cents apart beat gently against each other — glass, not steel.
  tone(1976 * j(), heavy ? 0.42 : 0.34, 'sine', 0.030, 1976 * j(), 0.03);
  tone(2093 * j(), heavy ? 0.38 : 0.30, 'sine', 0.024, 2093 * j(), 0.045);
  if (heavy) {                                  // the third hit lands with light
    tone(988, 0.30, 'triangle', 0.030, 988, 0.02);
    tone(74, 0.10, 'square', 0.07, 40, 0.015);
  }
}
function crystalSlash2(beat) {
  if (!AC || MUTED) return;
  const heavy = beat >= 2;
  const j = () => 0.97 + Math.random() * 0.06;
  // both ends pass: two cuts, offset, centred lower than the single's
  whoosh(0.16, 350 * j(), 1700, 0.09);
  whoosh(0.16, 480 * j(), 2200, 0.085, 0.055);
  if (heavy) whoosh(0.18, 420 * j(), 2600, 0.09, 0.11);   // the third end of a spin
  // the ring, an octave down plus its fifth — a bigger piece of crystal
  tone(988 * j(), 0.40, 'sine', 0.032, 988 * j(), 0.04);
  tone(1480 * j(), 0.34, 'sine', 0.024, 1480 * j(), 0.06);
  if (heavy) { tone(494, 0.34, 'triangle', 0.034, 494, 0.03); tone(66, 0.12, 'square', 0.08, 36, 0.02); }
}
// THE JOIN — the sound of the two halves locking, for the reunion moment
// (task #80): a glass glissando climbing into a settled two-note chord, over
// one deep confirmation. Not a fanfare; a mechanism completing.
function crystalJoin() {
  if (!AC || MUTED) return;
  for (let i = 0; i < 6; i++) tone(660 * Math.pow(1.335, i), 0.16, 'sine', 0.028, 660 * Math.pow(1.335, i), i * 0.055);
  tone(988, 0.9, 'sine', 0.034, 988, 0.36);
  tone(1480, 0.8, 'sine', 0.026, 1480, 0.40);
  tone(110, 0.30, 'triangle', 0.07, 74, 0.34);
}
// THE SWIRL — the two-hand dance. This deliberately does NOT reuse 'chargedHit',
// which is a shove: a low sawtooth thud under a hiss, all of it over in an
// instant. The swirl is 640 ms the player is meant to WATCH, and a move that
// looks like a dance and sounds like a punch reads as a reskin.
//
// So the cue is built on the move's own clock: four whooshes and four rising
// notes at SWIRL_STEP (160 ms), which is the same spacing as the damage passes.
// The ear therefore COUNTS the passes — you can hear that the fourth is still
// coming, which is exactly the information the greedy trade needs (stay for it,
// or leave). The figure is a rising pentatonic run, light and glassy rather than
// heavy, and it settles on the same 988/1480 pair the JOIN ends on, so the two
// halves being in her paws is audibly the same instrument as the two halves
// locking together.
function crystalSwirl() {
  if (!AC || MUTED) return;
  const j = () => 0.97 + Math.random() * 0.06;
  // the lift — she leaves the floor, and the low end goes UP with her rather
  // than down as it would on an impact
  tone(240, 0.45, 'triangle', 0.030, 620);
  hiss(0.12, 0.035);
  // four turns, four notes, on the pass clock
  const NOTE = [784, 988, 1175, 1568];                 // G5 B5 D6 G6
  for (let i = 0; i < 4; i++) {
    const t = i * 0.16;
    whoosh(0.15, 520 * j(), 2400 + i * 400, 0.055 - i * 0.004, t);
    tone(NOTE[i] * j(), 0.20, 'sine', 0.036, NOTE[i] * j(), t);
    // the sparkle is a FIFTH above, not an octave: 784 doubled is 1568, which is
    // the fourth note of the run, and a harmonic sitting exactly on a later note
    // makes the phrase unreadable — to a listener and to the harness alike
    tone(NOTE[i] * 1.5 * j(), 0.14, 'triangle', 0.018, null, t + 0.02);
    chink(0.016, t + 0.01);
  }
  // and it settles where the JOIN settles — AFTER the last pass (0.64), so the
  // held pair reads as her landing rather than as a fifth turn
  tone(988, 0.55, 'sine', 0.030, 988, 0.66);
  tone(1480, 0.48, 'sine', 0.022, 1480, 0.69);
}
function clawSlash(beat) {
  if (!AC || MUTED) return;
  const heavy = beat >= 2;
  const j = () => 0.96 + Math.random() * 0.08;            // never twice the same
  // 0. THE AIR — the whole arm displaces air before the claws split it. This
  // is the body the mix was missing: broad, low, under everything.
  whoosh(heavy ? 0.16 : 0.12, 260 * j(), heavy ? 1500 : 1300, heavy ? 0.085 : 0.07);
  // 1. THE SERVO — the arm moves before the claws do
  tone(heavy ? 150 : 190, 0.05, 'sawtooth', heavy ? 0.038 : 0.028, heavy ? 520 : 620);
  chink(0.012, 0.034);
  // 2. THE CLAWS — three passes, four when she puts both paws in
  const n = heavy ? 4 : 3;
  for (let i = 0; i < n; i++) {
    const f0 = (heavy ? 4300 : 5200) * j() + i * 780;
    clawShear(f0, f0 * 0.4, heavy ? 0.045 : 0.034, heavy ? 0.30 : 0.34, i * 0.017, heavy ? 6.5 : 8);
  }
  // 3. THE EDGE SINGS for an instant after the pass
  tone((heavy ? 2150 : 2700) * j(), heavy ? 0.13 : 0.09, 'triangle', 0.034, 1450, 0.028);
  // 4. THE HEAVY ONE lands with weight, and something shorts out on the strike
  if (heavy) {
    tone(96, 0.13, 'square', 0.095, 46, 0.02);
    hiss(0.05, 0.055, 0.05);
    tone(1180, 0.24, 'triangle', 0.038, 760, 0.055);
  }
}

// ---------------------------------------------------------------------------
// THE MOTOR. A chainsaw is a sound before it is a shape — you hear it in the
// next room and you know what is in this one. One node for the whole room, not
// one per saw, with its gain following the NEAREST blade and its pitch
// following how hard that blade is working. It exists only while a room has a
// saw in it, so nothing hums in a room that has none.
// ---------------------------------------------------------------------------
let SAWN = null;
function sawHum(dt) {
  const list = (typeof G !== 'undefined' && G.saws) || null;
  const on = list && list.length && AC && AC.state === 'running' && !MUTED;
  if (!on) {
    if (SAWN) { try { SAWN.g.gain.value = 0; SAWN.osc.stop(); SAWN.n.stop(); } catch (e) {} SAWN = null; }
    return;
  }
  if (!SAWN) {
    try {
      const g = AC.createGain(); g.gain.value = 0; g.connect(AC.destination);
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      lp.connect(g);
      const osc = AC.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 88;
      const og = AC.createGain(); og.gain.value = 0.5; osc.connect(og); og.connect(lp);
      // the ragged edge of the chain, not a clean tone
      const nb = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      const d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
      const n = AC.createBufferSource(); n.buffer = nb; n.loop = true;
      const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.1;
      const ng = AC.createGain(); ng.gain.value = 0.5;
      n.connect(bp); bp.connect(ng); ng.connect(lp);
      osc.start(); n.start();
      SAWN = { g, osc, n, lp };
    } catch (e) { SAWN = null; return; }
  }
  let near = 1e9, work = 0;
  for (const sw of list) {
    const dx = sw.x - (player ? player.x : 0), dy = sw.y - (player ? player.y : 0);
    const d2 = Math.hypot(dx, dy);
    if (d2 < near) { near = d2; work = sw.sp; }
  }
  const k = clamp(1 - (near - 60) / 460, 0, 1);
  const want = k * k * 0.055;
  try {
    const g = SAWN.g.gain;
    g.value += (want - g.value) * Math.min(1, dt * 6);
    SAWN.osc.frequency.value = 84 + clamp(work / 300, 0, 1) * 34;
    SAWN.lp.frequency.value = 1500 + clamp(work / 300, 0, 1) * 2600;
  } catch (e) {}
}
// ---------- NPC proximity voices ------------------------------------------
// Every NPC sings its presence into the room: a looping voice whose volume
// swells as you draw near and blooms while it speaks with you. A recorded
// loop in MBUF ('hum_<id>') takes over automatically; otherwise each
// character gets a signature synth voice.
const NPCVOX = {};
function npcVoxBuild(id) {
  if (!AC) return null;
  const g = AC.createGain(); g.gain.value = 0; g.connect(AC.destination);
  const nodes = [];
  if (MBUF['hum_' + id]) {
    const s = AC.createBufferSource();
    s.buffer = MBUF['hum_' + id]; s.loop = true;
    s.connect(g); s.start(); nodes.push(s);
    return { g, nodes };
  }
  const osc = (f, type, vol, wobF, wobA) => {
    const o = AC.createOscillator(), og = AC.createGain();
    o.type = type; o.frequency.value = f; og.gain.value = vol;
    if (wobF) {
      const l = AC.createOscillator(), lg = AC.createGain();
      l.frequency.value = wobF; lg.gain.value = wobA || 2;
      l.connect(lg).connect(o.frequency); l.start(); nodes.push(l);
    }
    o.connect(og).connect(g); o.start(); nodes.push(o);
  };
  const nz = (vol, f0, q) => {
    const s = AC.createBufferSource();
    const n = Math.floor(AC.sampleRate * 1.2);
    const buf = AC.createBuffer(1, n, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    s.buffer = buf; s.loop = true;
    const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = f0; f.Q.value = q || 1;
    const ng = AC.createGain(); ng.gain.value = vol;
    s.connect(f).connect(ng).connect(g); s.start(); nodes.push(s);
  };
  switch (id) {
    case 'servo':   osc(84, 'sine', 0.5, 0.4, 3); osc(168, 'sine', 0.12); break;            // an old warm motor
    case 'ratchet': osc(62, 'sawtooth', 0.06); nz(0.1, 900, 2); osc(124, 'sine', 0.2, 5, 4); break; // shop generator + lamp fizz
    case 'mono':    osc(120, 'sine', 0.35, 0.25, 8); osc(2093, 'sine', 0.018); break;       // CRT hum + a thin whine
    case 'sage':    osc(440, 'sine', 0.12); osc(554.4, 'sine', 0.1); osc(659.3, 'sine', 0.08, 0.3, 2); break; // a held chord, almost song
    case 'patch':   nz(0.22, 2400, 0.8); osc(96, 'square', 0.05, 7, 5); break;              // tools and tiny arcs
    case 'lumen':   osc(880, 'sine', 0.1, 1.7, 12); osc(1318.5, 'sine', 0.05, 2.3, 9); break; // wandering shimmer
    // THE LURE (owner, 2026-08-23: "it should emit a sound from within that
    // attracts me to go there"). Not a machine and not a person — a HOLE:
    // a sub-bass the room breathes through, a hollow throat resonance an
    // octave and a fifth above it, and a thin wandering shimmer that is the
    // only part with a melody. It is deliberately the lowest voice in the
    // game, because low is what carries through rock and what a player walks
    // toward without being told to. Upgrades itself the moment a fired
    // 'hum_cave' loop lands in MBUF (see the head of this block).
    case 'cave':
      osc(38, 'sine', 0.62, 0.13, 2);
      osc(57, 'sine', 0.2, 0.09, 1.5);
      nz(0.09, 150, 6);
      nz(0.05, 620, 9);
      osc(494, 'sine', 0.028, 0.21, 7);
      break;
    default:        osc(110, 'sine', 0.3);
  }
  return { g, nodes };
}
function npcVoxTick(id, target) {
  if (!AC || MUTED || !AUD_UNLOCKED) return;
  let v = NPCVOX[id];
  if (!v) { v = npcVoxBuild(id); if (!v) return; NPCVOX[id] = v; }
  v.g.gain.setTargetAtTime(target, AC.currentTime, 0.18);
}
function npcVoxQuietAll() {
  if (!AC) return;
  for (const id in NPCVOX) NPCVOX[id].g.gain.setTargetAtTime(0, AC.currentTime, 0.12);
}
function npcVoxStopAll() {
  for (const id in NPCVOX) {
    const v = NPCVOX[id];
    try { v.g.gain.setTargetAtTime(0, AC.currentTime, 0.08); } catch (e) {}
    setTimeout(() => { try { v.nodes.forEach(n => n.stop()); v.g.disconnect(); } catch (e) {} }, 400);
    delete NPCVOX[id];
  }
}
// ---------- ODYSSEY audio skin (per ODYSSEY_AUDIO_DESIGN) -----------------
// The hero theme trades the machine's ceramic/pneumatic/digital voice for
// steel, leather, chainmail, breath and bronze bells — and every big sound
// carries a stone-hall echo, because kingdoms reverberate and corridors don't.
function bellToll(f, vol, delay) {
  // a bronze bell is a fundamental plus stretched inharmonic partials
  tone(f, 1.3, 'sine', vol, null, delay);
  tone(f * 2.76, 0.7, 'sine', vol * 0.35, null, delay);
  tone(f * 5.4, 0.28, 'sine', vol * 0.14, null, delay);
  hiss(0.05, vol * 0.3, delay);
}
function chink(vol, delay) {
  // one chainmail link against another
  const f = 1200 + Math.random() * 600;
  tone(f, 0.035, 'square', vol || 0.028, f * 0.7, delay);
  hiss(0.025, (vol || 0.028) * 0.8, delay);
}
function heroEcho(fn) {
  // cathedral tail: the same gesture again, twice, quieter and farther away
  fn(1, 0);
  fn(0.38, 0.22);
  fn(0.16, 0.44);
}
function heroSfx(n) {
  switch (n) {
    case 'step': {
      // chainmail chink + leather creak, pitch wandering ±5%
      const p = 0.95 + Math.random() * 0.1;
      chink(0.022);
      tone(430 * p, 0.04, 'triangle', 0.02, 300 * p);
      return true;
    }
    case 'stepice':   // boots on ice: a glassy crunch under the chainmail
      hiss(0.05, 0.03); chink(0.018, 0.01);
      tone(2100 + Math.random() * 400, 0.05, 'triangle', 0.02, 1200);
      return true;
    case 'jump':      // leather creak + chainmail shift + "hup" of breath
      tone(180, 0.1, 'sawtooth', 0.04, 260); chink(0.03, 0.02);
      hiss(0.09, 0.035); tone(90, 0.08, 'sine', 0.04, 140);
      return true;
    case 'djump':     // the harder push-off
      tone(200, 0.12, 'sawtooth', 0.05, 320); chink(0.035, 0.02); hiss(0.11, 0.045);
      return true;
    case 'land':      // plate CLANK + dust
      heroEcho((k, d) => {
        tone(310, 0.12, 'square', 0.07 * k, 150, d);
        tone(920, 0.07, 'triangle', 0.03 * k, 460, d);
      });
      hiss(0.06, 0.04); chink(0.03, 0.03);
      return true;
    case 'dash':      // dodge roll: chainmail shhh-shhh
      whoosh(0.2, 500, 1500, 0.07); chink(0.03, 0.03); chink(0.026, 0.1);
      return true;
    case 'swing': case 'atk': // steel SHWING + air cut
      whoosh(0.12, 900, 2700, 0.09);
      tone(1750, 0.13, 'triangle', 0.035, 2600);
      return true;
    case 'hit':       // impact + steel ring
      hiss(0.06, 0.09); tone(1150, 0.18, 'triangle', 0.05, 850);
      tone(170, 0.07, 'square', 0.05, 90);
      return true;
    case 'bosshit':   // full CLANG off heavy plate
      heroEcho((k, d) => tone(680, 0.22, 'square', 0.08 * k, 300, d));
      tone(1360, 0.18, 'triangle', 0.04); hiss(0.08, 0.1);
      return true;
    case 'hurt':      // chainmail chink + plate dent + grunt
      tone(115, 0.22, 'sawtooth', 0.09, 55);
      tone(520, 0.11, 'square', 0.05, 240); chink(0.035, 0.03);
      return true;
    case 'ui':        // parchment rustle + quill scratch
      hiss(0.055, 0.03); tone(2300, 0.03, 'triangle', 0.014, 1600);
      return true;
    case 'ok':        // wax-seal stamp
      tone(175, 0.09, 'sine', 0.075, 85); hiss(0.04, 0.02);
      return true;
    case 'pick':      // item "shhhink" + chime
      tone(1150, 0.07, 'triangle', 0.045, 1900);
      tone(2300, 0.12, 'sine', 0.02, null, 0.04);
      return true;
    case 'chest':     // wood creak + hinge + treasure shimmer
      tone(150, 0.28, 'sawtooth', 0.03, 85);
      [1350, 1700, 2150].forEach((f, i) => tone(f, 0.14, 'sine', 0.035, null, 0.12 + i * 0.07));
      return true;
    case 'bench':     // the bonfire: crackle, settle, sheathed steel
      for (let i = 0; i < 6; i++) hiss(0.03, 0.025, Math.random() * 0.7);
      tone(140, 0.5, 'sine', 0.03, 110);
      tone(700, 0.1, 'triangle', 0.025, 350, 0.3); chink(0.024, 0.45);
      return true;
    case 'heal':      // potion: glass clink, gulp, magic fizz
      tone(1800, 0.05, 'triangle', 0.04);
      tone(300, 0.09, 'sine', 0.05, 170, 0.12);
      hiss(0.18, 0.02, 0.2);
      return true;
    case 'cast':      // ancient words + magic circle hum
      hiss(0.2, 0.03);
      tone(150, 0.45, 'sine', 0.05, 300);
      tone(452, 0.3, 'sine', 0.022, 604, 0.12);
      return true;
    case 'boss':      // the boss bar: bell tolls, echoing down the nave
      bellToll(98, 0.09, 0); bellToll(98, 0.06, 0.55); bellToll(98, 0.04, 1.1);
      return true;
    case 'dieSting':  // death: one great toll + wind + a whispering hall
      bellToll(73.4, 0.11, 0);
      whoosh(1.2, 300, 90, 0.05, 0.3);
      bellToll(73.4, 0.05, 0.9);
      return true;
    case 'win':       // solo trumpet, triumphant but sad
      [523, 659, 784, 659, 880].forEach((f, i) =>
        tone(f, i === 4 ? 0.6 : 0.22, 'sawtooth', 0.045, null, i * 0.18));
      hiss(0.04, 0.02);
      return true;
    case 'pogo':      // the downward strike rings like a struck shield
      tone(1500, 0.12, 'triangle', 0.05, 750); chink(0.02, 0.02);
      return true;
  }
  return false;   // everything else keeps the shared voice
}
// ---------------------------------------------------------------------------
// THE LITTLE MELODIES. Every small cue in her world — jumping, landing,
// dashing, picking something up, getting hurt — used to be a recorded voice
// noise or a single beep. Recorded breaths made her sound like a person, and
// single beeps sound like a prototype. What makes the sounds of a great
// platformer feel COMPOSED rather than assembled is that they are all played by
// the same instrument, in the same scale, so the whole game hums together.
//
// So there is one alphabet here and everything is spelled with it:
//
//   THE SCALE   C D E G A — a pentatonic, which has no wrong notes in it, and
//               which sits inside the D minor the score is written in, so a cue
//               never fights the music playing behind it.
//   THE SHAPES  good things rise, bad things fall. A rising fourth is "yes"
//               (jump), a rising fifth is "have it" (pick up), a falling minor
//               third is "ouch" (hurt).
//   THE VOICE   two slightly detuned square oscillators with a triangle an
//               octave above — chip-bright, but the detune gives it warmth and
//               keeps it from sounding like a 1980s test tone.
//
// Original melodies, not borrowed ones: the shapes are the common language of
// the genre, the phrases are this game's own.
// ---------------------------------------------------------------------------
function blip(midi, dur, vol, delay, kind) {
  if (!AC || MUTED) return;
  const t0 = AC.currentTime + (delay || 0);
  const f = mf(midi);
  const g = AC.createGain();
  // fast but not instant: 4 ms of attack is the difference between a note and
  // a click, and a click is what a cheap game sounds like
  g.gain.value = 0.0001;                           // a delayed note must not
  g.gain.setValueAtTime(0.0001, t0);               // open at full gain first
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(AC.destination);
  const soft = kind === 'soft', bell = kind === 'bell';
  const mk = (type, mult, lvl, cents) => {
    const o = AC.createOscillator(), og = AC.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f * mult * Math.pow(2, (cents || 0) / 1200), t0);
    og.gain.value = lvl;
    o.connect(og).connect(g);
    o.start(t0); o.stop(t0 + dur + 0.02);
  };
  if (soft) { mk('sine', 1, 0.9); mk('triangle', 2, 0.22, 4); }
  else if (bell) { mk('triangle', 1, 0.8); mk('sine', 2, 0.45); mk('sine', 4, 0.12); }
  else { mk('square', 1, 0.55, -6); mk('square', 1, 0.4, 7); mk('triangle', 2, 0.3); }
}
// a phrase: [midi, startMs, lengthMs] ...
function motif(notes, vol, kind, spread) {
  const k = spread == null ? 1 : spread;
  for (const n of notes) blip(n[0], n[2] / 1000, vol * (n[3] || 1), n[1] * k / 1000, kind);
}
// THE PHRASES. Written on the scale above, two to five notes each, and short
// enough to fire again before the last one has finished — which is what
// actually happens when a player is jumping across a room.
//   C5 72  D5 74  E5 76  G5 79  A5 81  C6 84  D6 86  E6 88  G6 91  A6 93
const CUE = {
  // UP A FOURTH: the "yes" of the whole game, and the one she does most
  jump: () => {
    motif([[79, 0, 90], [84, 48, 130]], 0.075);
    whoosh(0.07, 320, 900, 0.022);
  },
  // the second jump is the spiral, so it is the same idea with a flourish on
  // top — three notes, higher, faster, and a servo tick under the turn
  djump: () => {
    motif([[84, 0, 80], [88, 42, 80], [91, 84, 150]], 0.062);
    chink(0.012, 0.02);
  },
  // coming down: the phrase inverts and settles, with the weight underneath
  land: () => {
    motif([[76, 0, 80], [72, 55, 150]], 0.05);
    tone(120, 0.09, 'square', 0.028, 74);
    hiss(0.05, 0.03);
  },
  // a run up the scale, as fast as her feet
  dash: () => {
    motif([[74, 0, 70], [76, 30, 70], [79, 60, 70], [81, 90, 130]], 0.058);
    whoosh(0.15, 1500, 3800, 0.03);
  },
  // UP A FIFTH, on a bell: bigger interval than the jump so it can never be
  // mistaken for one, and the brightest voice in the set so it cuts through a
  // fight — you always hear that you got the thing
  pick: () => motif([[81, 0, 90], [88, 55, 200]], 0.085, 'bell'),
  // a soft climb; healing should feel like being put back together
  heal: () => motif([[72, 0, 140], [76, 70, 140], [79, 140, 140], [84, 210, 320]], 0.065, 'soft'),
  // the reward fanfare: the same climb, but it does not stop where you expect,
  // and the last note is held and answered an octave up
  chest: () => {
    motif([[72, 0, 120], [76, 70, 120], [79, 140, 120], [81, 210, 120], [84, 280, 380]], 0.09);
    motif([[91, 320, 300, 0.5]], 0.09, 'bell');
  },
  // DOWN A MINOR THIRD and then away: comic rather than grim — she is a robot
  // cat taking a knock, not a soldier dying
  hurt: () => {
    motif([[76, 0, 90], [72, 60, 90], [69, 120, 200]], 0.07);
    tone(150, 0.2, 'sawtooth', 0.05, 62, 0.03);
  },
  // something small comes apart: the scale falls over and pops
  edie: () => {
    motif([[81, 0, 70], [79, 34, 70], [76, 68, 70], [72, 102, 170]], 0.058);
    hiss(0.14, 0.04, 0.07);
  },
};
// ---------- sound effects ----------
// ---------------------------------------------------------------------------
// THE VOICE LAYER. HZD-99 and the guardians now have recorded voices, and they
// take precedence over the synth for the events they cover. Everything not in
// this table still plays the synthesised cue, which is deliberate: several of
// her small chirps could not be generated convincingly and the synth versions
// are better than a bad sample. Nothing here is required — a missing file
// leaves playBuf falsy and the switch below answers instead.
//
// Hero-world sounds never reach this: heroSfx returns above.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// HER VOICE, AND WHERE IT GOES.
//
// HZD-99 speaks in sounds, never in words: sharp exhales when she swings, a cry
// when she is hit, a sigh when she patches herself, a purr when she is safe.
// That is the Silksong register — a character you hear rather than one who
// talks — and it is also the only design that survives five languages.
//
// It rides ON TOP of the mechanical layer rather than replacing it. The claw
// still carries the combo escalation (that was moved out of the voice on
// purpose, and moving it back would flatten both); the voice is the animal
// inside the machine, mixed under the impact so it colours the hit rather than
// competing with it.
const HZDVOX = {
  // 0.30 was inaudible on a phone speaker under the synth impact — the barks
  // were reported as simply not playing. They ride clearly on top now.
  atk: [['hzd_atk1', 0.5], ['hzd_atk2', 0.52], ['hzd_atk3', 0.6]],
  jump: [['hzd_jump', 0.42]],
  hurt: [['hzd_hurt', 0.55]], hurtbad: [['hzd_hurtbad', 0.68]],
  die: [['hzd_die', 0.7]], dash: [['hzd_dash', 0.30]],
  djump: [['hzd_djump', 0.30]], land: [['hzd_land', 0.26]],
  heal: [['hzd_heal', 0.5]], evo: [['hzd_evo', 0.6]],
  win: [['hzd_win', 0.6]], purr: [['hzd_purr', 0.45]],
  // THE CHARGE, and it is a different KIND of vocal from everything above it.
  // Every other bark is an event — one syllable on one frame. This one is a
  // STATE: she holds a note for as long as she holds the button, and the note
  // is the thing that tells you the move is still building. `charge` is the
  // held vowel, `release` is what she spends it on.
  charge: [['hzd_charge', 0.42]],
  release: [['hzd_release', 0.55]],
};
// One gate for the whole voice: two barks on the same frame is a stutter, and
// a bark every frame of a held dash is a nuisance. 90 ms is shorter than any
// take and longer than any single input.
let HZDT = 0;
function hzdSay(key, gapMs) {
  const set = HZDVOX[key];
  if (!set || !AC) return false;
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (now - HZDT < (gapMs == null ? 90 : gapMs)) return false;
  const pick = set[(Math.random() * set.length) | 0];
  if (!playBuf(pick[0], pick[1], 0.96 + Math.random() * 0.08)) return false;
  HZDT = now;
  return true;
}
const VOX = {
  // her own takes first; the originals stay as the fallback
  purr: ['hzd_purr', 0.45], win: ['hzd_win', 0.6],
  roar_beast: ['vox_roar_beast', 0.75], roar_eagle: ['vox_roar_eagle', 0.75],
  roar_glc: ['vox_roar_glc', 0.75], roar_drg: ['vox_roar_drg', 0.8],
  roar_prism: ['vox_roar_prism', 0.75],
};
function sfx(n) {
  if (!AC || MUTED) return;
  if (typeof isHero === 'function' && isHero() && heroSfx(n)) return;
  // HER KIAI, ON THE RIGHT BEAT. The three-hit string escalates, so the shout
  // does too: the combo index the player is actually on picks the take, and the
  // heavy third one is the one with the metal in its tail.
  if (n === 'atk' || n === 'swing') {
    // the string still escalates — the third hit is the heavy one — but it
    // escalates in her CLAWS. Her voice goes on top of that, picked by the same
    // combo index so the shout and the steel escalate together, and mixed low
    // enough that it is the animal inside the swing rather than a second swing.
    const cb = (typeof player !== 'undefined' && player && player.combo) | 0;
    const w = wielded();
    if (w === 'crystal2') crystalSlash2(cb);
    else if (w === 'crystal1') crystalSlash(cb);
    else clawSlash(cb);
    // the big open-throat take (hzd_atk3) is OUT of the normal rotation — the
    // owner: "it keeps saying the yaaa! voice with normal hit sequence when it
    // was supposed to be for the supercharged one." Normal hits rotate the two
    // short barks; the third hit repeats the first a shade louder, and the big
    // shout belongs to the charged burst alone (hzd_release).
    const seq = [0, 1, 0][Math.min(2, cb)];
    const take = HZDVOX.atk[seq] &&
      [HZDVOX.atk[seq][0], HZDVOX.atk[seq][1] + (cb >= 2 ? 0.06 : 0)];
    if (take && AC) {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (now - HZDT >= 90 && playBuf(take[0], take[1], 0.96 + Math.random() * 0.08)) HZDT = now;
    }
    return;
  }
  // ...and the rest of her, before any of the synth alphabet: these are the
  // moments the player is looking straight at her.
  // THE JUMP SPEAKS TOO — a little Hup that RIDES ON the synth jump rather
  // than replacing it (no return): the spring sound is the physics, the voice
  // is her. Reported missing because it genuinely did not exist.
  if (n === 'jump') hzdSay('jump', 200);
  if (n === 'hurt' && hzdSay(player && player.cores <= 1 ? 'hurtbad' : 'hurt', 260)) return;
  if (n === 'die' && hzdSay('die', 0)) return;
  if (n === 'dash' && hzdSay('dash', 200)) return;
  if (n === 'djump' && hzdSay('djump', 160)) return;
  if (n === 'heal' && hzdSay('heal', 0)) return;
  if (n === 'chargeReady' && hzdSay('evo', 400)) return;
  if (n === 'crystalJoin') { crystalJoin(); return; }
  if (n === 'crystalSwirl') { crystalSwirl(); return; }
  // HER LITTLE MELODIES — see the alphabet above. These come before any
  // sample, because the whole point is that they are all the same instrument.
  if (CUE[n]) { CUE[n](); return; }
  const v = VOX[n];
  if (v && playBuf(v[0], v[1], 0.97 + Math.random() * 0.06)) return;
  // recorded samples first (loaded from the CC0 library), synth fallback below
  if (n === 'hit' && playBuf(Math.random() < 0.5 ? 'hit1' : 'hit2', 0.45, 0.9 + Math.random() * 0.2)) return;
  if (n === 'bosshit' && playBuf('metal', 0.5, 0.85 + Math.random() * 0.15)) return;
  if (n === 'boom' && playBuf('explosion', 0.55)) return;
  if (n === 'shoot' && playBuf('laser', 0.28)) return;
  if (n === 'cast' && playBuf('zap', 0.4)) return;
  switch (n) {
    case 'jump': tone(230, 0.13, 'square', 0.065, 470); whoosh(0.08, 300, 900, 0.03); break;
    case 'djump': tone(340, 0.13, 'square', 0.05, 700); break;
    case 'dash': whoosh(0.16, 500, 2600, 0.09); tone(620, 0.13, 'sawtooth', 0.035, 190); break;
    case 'swing': case 'atk': whoosh(0.11, 800, 2600, 0.09); tone(520, 0.06, 'sawtooth', 0.03, 260); break;
    case 'chargeReady': tone(880, 0.14, 'sine', 0.07, 1760); tone(1320, 0.2, 'sine', 0.05, null, 0.06); break;
    case 'chargedHit':
      hiss(0.5, 0.18); tone(70, 0.45, 'sawtooth', 0.14, 30);
      whoosh(0.3, 400, 3600, 0.12);
      [880, 1175, 1760].forEach((f, i) => tone(f, 0.3, 'triangle', 0.06, null, i * 0.05));
      break;
    case 'wave': whoosh(0.16, 1200, 3400, 0.06); tone(900, 0.14, 'sine', 0.045, 1800); break;
    case 'hit': hiss(0.06, 0.09); tone(170, 0.08, 'square', 0.06, 90); break;
    case 'bosshit': hiss(0.09, 0.11); tone(92, 0.13, 'square', 0.1, 44); break;
    case 'hurt': tone(120, 0.28, 'sawtooth', 0.12, 50); hiss(0.2, 0.08); break;
    case 'pick': tone(880, 0.07, 'sine', 0.05, 1370); break;
    case 'heal': tone(520, 0.3, 'sine', 0.05, 1040); break;
    case 'shoot': tone(980, 0.1, 'square', 0.04, 340); break;
    case 'phit': tone(300, 0.08, 'square', 0.05, 120); break;
    case 'boom': hiss(0.45, 0.16); tone(90, 0.4, 'sawtooth', 0.12, 34); break;
    case 'edie': hiss(0.22, 0.11); tone(150, 0.2, 'sawtooth', 0.08, 42); tone(500, 0.12, 'square', 0.04, 120); break;
    case 'break': hiss(0.2, 0.12); tone(200, 0.15, 'square', 0.07, 70); break;
    // steel meeting steel and not liking it: a bright scrape that falls away,
    // a bite of low thud under it, and one ringing partial off the housing
    // THE WARNING. A short rising pair — rising, so it encodes time REMAINING
    // rather than merely "something is happening", and pitched above the music
    // bed so it survives a boss theme. Deliberately not a hit sound: this is
    // the only cue in the game that means "it is about to".
    case 'tell':
      tone(560, 0.09, 'triangle', 0.05, 900);
      tone(840, 0.12, 'triangle', 0.038, 1280, 0.07);
      chink(0.014, 0.03);
      break;
    case 'grind':
      whoosh(0.16, 5200, 1400, 0.075);
      hiss(0.07, 0.06);
      tone(2050 * (0.94 + Math.random() * 0.12), 0.14, 'sawtooth', 0.035, 900);
      tone(150, 0.1, 'square', 0.05, 72);
      break;
    case 'vent':      // Ratchet blowing off heat: pressure out, then the rack ringing
      whoosh(0.5, 2200, 380, 0.055);
      hiss(0.34, 0.05);
      tone(74, 0.26, 'sine', 0.045, 38);
      tone(320, 0.2, 'triangle', 0.012, 140, 0.28);
      break;
    // THE BURIED MOUTH. Two halves of one event, and they are different
    // sounds on purpose: a blade into a rock pile is DRY and small — it tells
    // her the wall answers — and the pile giving way is the biggest low sound
    // in the room, with the tunnel's own held air let out behind it.
    case 'rock':
      chink(0.02, 0.05);
      tone(128 * (0.9 + Math.random() * 0.2), 0.16, 'square', 0.075, 58);
      hiss(0.26, 0.055);
      tone(2600 * (0.85 + Math.random() * 0.3), 0.07, 'triangle', 0.02, 1400, 0.02);
      break;
    case 'collapse':
      tone(52, 0.9, 'sawtooth', 0.15, 26);
      tone(104, 0.6, 'square', 0.07, 38);
      hiss(0.8, 0.09);
      chink(0.05, 0.16);
      whoosh(0.75, 900, 170, 0.05, 0.1);
      break;
    case 'bench': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'sine', 0.05, null, i * 0.1)); break;
    case 'boss': case 'roar': tone(55, 0.9, 'sawtooth', 0.14, 30); tone(110, 0.7, 'square', 0.055, 45); hiss(0.6, 0.06); break;
    // each guardian wakes with its OWN voice — pitched to the machine it is
    case 'roar_beast':   // NULLFANG: a ripping sub-growl that ends in teeth
      tone(46, 1.2, 'sawtooth', 0.17, 26); tone(92, 0.9, 'square', 0.07, 38);
      tone(23, 1.2, 'sine', 0.1, 20); hiss(0.9, 0.09); break;
    case 'roar_eagle':   // TALONHOST: a metal screech climbing off the cable
      tone(950, 0.55, 'square', 0.07, 2300); tone(1900, 0.45, 'sawtooth', 0.05, 700, 0.1);
      tone(140, 0.5, 'square', 0.05, 90, 0.05); hiss(0.5, 0.07); break;
    case 'roar_glc':     // GLACIERE: a crystalline shriek over a cold sub
      tone(660, 0.8, 'triangle', 0.07, 1056); tone(990, 0.8, 'triangle', 0.05, 1584, 0.06);
      tone(1485, 0.7, 'triangle', 0.04, 2376, 0.12);
      whoosh(0.9, 2400, 700, 0.05); tone(84, 0.9, 'sine', 0.08, 60); break;
    case 'roar_drg':     // FURNACE CHOIR: a foundry horn, all mass
      tone(62, 1.4, 'square', 0.15, 56); tone(124, 1.1, 'sawtooth', 0.09, 100);
      tone(31, 1.4, 'sine', 0.1, 28); whoosh(0.8, 300, 900, 0.05); break;
    case 'roar_prism':   // PRISM PROWLER: an electric yowl, up then spat out
      tone(520, 0.75, 'sawtooth', 0.08, 1100); tone(780, 0.6, 'square', 0.045, 390, 0.12);
      hiss(0.3, 0.05); break;
    case 'phase': tone(82, 0.5, 'sawtooth', 0.12, 48); hiss(0.32, 0.08); break;
    case 'win': [523, 659, 784, 988, 1319].forEach((f, i) => tone(f, 0.4, 'triangle', 0.06, null, i * 0.16)); break;
    case 'ui': tone(540, 0.05, 'square', 0.035); break;
    // THE PURR. A low triangle wobbling under a soft warm third — the point is
    // that it is the only sound in the game with no attack transient at all.
    // Everything else in a factory this loud starts with a hit; affection does
    // not, and the ear notices that before the player does.
    case 'purr':
      tone(66, 0.5, 'triangle', 0.05, 58);
      tone(99, 0.42, 'triangle', 0.028, 88, 0.03);
      tone(330, 0.18, 'sine', 0.02, 396, 0.06);
      break;
    case 'whiff':     // the blade cutting air — breathy, no metal, no pitch centre
      hiss(0.075, 0.02);
      tone(300, 0.07, 'sine', 0.012, 120);
      break;
    case 'chirp':     // the eagle, pleased with itself
      tone(880, 0.07, 'sine', 0.035, 1320);
      tone(1320, 0.09, 'sine', 0.025, 1046, 0.07);
      break;
    case 'ok': tone(660, 0.09, 'square', 0.045, 990); break;
    case 'no': tone(130, 0.12, 'square', 0.06, 80); break;
    case 'pogo': tone(420, 0.09, 'square', 0.05, 840); break;
    case 'cast': tone(200, 0.2, 'sawtooth', 0.07, 900); hiss(0.1, 0.05); break;
    case 'step': hiss(0.025, 0.016); tone(170, 0.03, 'sine', 0.02, 120); break;
    case 'stepice': hiss(0.04, 0.02); tone(1900 + Math.random() * 400, 0.04, 'triangle', 0.018, 1100); break;
    case 'land': tone(130, 0.09, 'sine', 0.06, 62); hiss(0.05, 0.03); break;
    case 'chest': [660, 830, 1050, 1320].forEach((f, i) => tone(f, 0.14, 'sine', 0.05, null, i * 0.06)); break;
    case 'buy': tone(1180, 0.06, 'square', 0.045); tone(1570, 0.09, 'square', 0.045, null, 0.07); break;
    case 'dieSting':
      [57, 53, 50, 45].forEach((m, i) => tone(mf(m), 0.4, 'sawtooth', 0.08, null, i * 0.26));
      hiss(0.5, 0.05, 0.9);
      break;
  }
}
// rising charge whine while holding the attack button
function sfxChargeTick(k) {
  if (!AC || MUTED) return;
  tone(280 + k * 520, 0.09, 'sawtooth', 0.03 + k * 0.02);
}
// ECHO GLYPHS: one note per node, so the sequence is a little tune.
//
// Every step used to make the same sound, which throws away the whole reason
// audio helps a memory game: a rising-falling four-note figure is far easier to
// hold in your head than four identical beeps, and it lets the player HEAR that
// their reply matches. The reply is played a fifth up and softer, so the two
// passes are obviously the same shape said by two different voices.
//
// The register is a PHONE decision, not a musical one: the first table sat on
// A3-A4 (220-440 Hz) and the owner heard nothing — a phone speaker rolls off
// hard below ~500 Hz, and the music stream was playing over the top at full
// volume besides (see MUS_DUCK). One octave up keeps the chord shape and puts
// every note where small speakers actually speak.
const MEM_NOTES = [69, 74, 78, 81];               // A4 D5 F#5 A5 — an open chord
function sfxMemNote(i, reply) {
  if (!AC || MUTED) return;
  blip(MEM_NOTES[i % 4] + (reply ? 7 : 0), reply ? 0.2 : 0.3, reply ? 0.08 : 0.115, 0, 'bell');
}
// wrong answer: the same note bent flat under itself
function sfxMemWrong() {
  if (!AC || MUTED) return;
  tone(300, 0.3, 'sawtooth', 0.05, 120);
}
// soft rising hum while repairing
function sfxHealTick(k) {
  if (!AC || MUTED) return;
  tone(360 + k * 430, 0.13, 'sine', 0.032);
}
// per-character voice chirps for dialogue
const NPC_VOICE = {
  servo: [170, 'sawtooth'], ratchet: [330, 'square'], mono: [240, 'sine'],
  sage: [140, 'sine'], patch: [430, 'square'], lumen: [540, 'sine'],
};
function sfxVoice(id) {
  if (!AC || MUTED) return;
  const v = NPC_VOICE[id] || [300, 'square'];
  for (let i = 0; i < 3; i++)
    tone(v[0] * (0.9 + Math.random() * 0.25), 0.07, v[1], 0.04, null, i * 0.07);
}
// ---------------------------------------------------------------------------
// THE MACHINE FOLK, SPEAKING. Their lines are recorded per character and per
// line — servo0, sage2 — and STREAMED rather than decoded: eighteen lines of
// speech held as raw PCM would cost more memory than every sound effect in the
// game put together, for audio that plays once and is never heard again in that
// room. A line with no recording, or a language the cast was never recorded in,
// falls back to the character's synthesized voice, which is what every line
// used to be.
// ---------------------------------------------------------------------------
let NPCNODE = null;
function npcSay(id, idx) {
  const files = (typeof window !== 'undefined' && window.VOX_FILES) || null;
  const src = files && LANG === 'en' && files[id + idx];
  if (!src || MUTED) { sfxVoice(id); return; }
  try {
    if (NPCNODE) { NPCNODE.pause(); NPCNODE.src = ''; }
  } catch (e) {}
  try {
    const el = new Audio();
    el.src = src; el.volume = 0.85; el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    NPCNODE = el;
    npcVoiceChain(el, id);
    const pr = el.play();
    // autoplay refused, or the file is not really there: the character still
    // has to make a sound, so fall back rather than opening a silent mouth
    if (pr && pr.catch) pr.catch(() => sfxVoice(id));
    el.addEventListener('error', () => sfxVoice(id), { once: true });
  } catch (e) { sfxVoice(id); }
}
// ---------------------------------------------------------------------------
// THE MACHINE IN THEIR VOICES. The lines were recorded straight and played
// straight, so the machine folk sounded like people in a booth — the one place
// in the game where the illusion admitted what it was made of. Each line now
// runs through a small chain that puts them back inside a chassis:
//
//   a RING MODULATOR at a few dozen hertz, which is what has made a voice
//     sound synthetic since the 1960s, mixed under the dry voice rather than
//     over it so the words stay easy to understand;
//   a COMB DELAY of a few milliseconds, the sound of a voice in a metal tube;
//   a BAND LIMIT at 210 Hz and 6.5 kHz, because it is coming out of a small
//     speaker in somebody's chest, not a studio monitor.
//
// Each character gets its own ring frequency and band, so a servo and a sage
// are still two different machines rather than one effect applied twice.
//
// If the audio engine is not running the line plays raw instead: routing it
// through a suspended graph would replace a slightly wrong voice with silence.
// ---------------------------------------------------------------------------
// Per character: how fast the chassis oscillator runs, how much of it to mix
// in, the band its little speaker can reproduce, the length of the tube the
// voice comes out of, and the size of the machine (rate shifts pitch, so a
// courier is small and bright and the sage is big and slow).
const NPC_CHASSIS = {
  servo:   { ring: 47, mix: 0.34, lo: 240, hi: 5200, comb: 0.0075, rate: 1.06 },
  ratchet: { ring: 31, mix: 0.38, lo: 190, hi: 4200, comb: 0.011,  rate: 0.93 },
  mono:    { ring: 62, mix: 0.30, lo: 300, hi: 6500, comb: 0.005,  rate: 1.11 },
  sage:    { ring: 23, mix: 0.26, lo: 170, hi: 5600, comb: 0.014,  rate: 0.88 },
  patch:   { ring: 88, mix: 0.36, lo: 260, hi: 6000, comb: 0.004,  rate: 1.04 },
  lumen:   { ring: 71, mix: 0.24, lo: 360, hi: 7000, comb: 0.0034, rate: 1.0 },
};
// The chain itself, built from any source node in any context — which is what
// lets it be rendered offline and MEASURED rather than trusted. The first
// version of this was trusted, and it turned out to be doing almost nothing
// except pushing the sum to a peak of 1.28, which is distortion.
//
// Gain staging is the whole job here. Three parallel paths summed at full
// level are louder than the voice that fed them and clip the output; and the
// ring modulator RE-CREATES content outside the band the filters just cleared,
// because multiplying 240 Hz by 47 Hz puts energy at 193 Hz. So the band limit
// is applied again AFTER the effects, and the sum is trimmed back to where it
// started.
function npcChainBuild(ctx, src, id) {
  const V = NPC_CHASSIS[id] || NPC_CHASSIS.servo;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = V.lo; hp.Q.value = 0.7;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = V.hi; lp.Q.value = 0.7;
  src.connect(hp); hp.connect(lp);
  const sum = ctx.createGain(); sum.gain.value = 1;
  // the voice itself, still the loudest thing in the mix so the words win
  const dry = ctx.createGain(); dry.gain.value = 1 - V.mix * 0.6;
  lp.connect(dry); dry.connect(sum);
  // the chassis oscillator, multiplied INTO the voice
  const ring = ctx.createGain(); ring.gain.value = 0;
  const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = V.ring;
  const depth = ctx.createGain(); depth.gain.value = V.mix;
  osc.connect(depth); depth.connect(ring.gain);
  lp.connect(ring); ring.connect(sum);
  // the tube it comes out of — quiet, or it smears the consonants
  const dl = ctx.createDelay(0.05); dl.delayTime.value = V.comb;
  const fb = ctx.createGain(); fb.gain.value = 0.25;
  const cw = ctx.createGain(); cw.gain.value = 0.22;
  lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(cw); cw.connect(sum);
  // Clear the band again, because the ring modulator puts energy back OUTSIDE
  // it: multiplying a 260 Hz vowel by an 88 Hz carrier lands a tone at 172 Hz,
  // under the speaker this voice is supposed to be coming out of. One filter
  // stage was not enough to catch it — a 12 dB/octave slope still passes most
  // of something half an octave down, which is why the brightest chassis was
  // measured GAINING low end. Two stages, and it goes.
  const hp2 = ctx.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = V.lo * 0.9;
  const hp3 = ctx.createBiquadFilter(); hp3.type = 'highpass'; hp3.frequency.value = V.lo * 0.9;
  const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = V.hi;
  const trim = ctx.createGain(); trim.gain.value = 0.7;
  sum.connect(hp2); hp2.connect(hp3); hp3.connect(lp2); lp2.connect(trim);
  try { osc.start(); } catch (e) {}
  return { out: trim, osc };
}
// ---------------------------------------------------------------------------
// THE MACHINE IN THEIR VOICES. The lines were recorded straight and played
// straight, so the machine folk sounded like people in a booth — the one place
// in the game where the illusion admitted what it was made of.
//
// If the audio engine is not running the line plays raw instead: routing it
// through a suspended graph would replace a slightly wrong voice with silence.
// ---------------------------------------------------------------------------
function npcVoiceChain(el, id) {
  const V = NPC_CHASSIS[id] || NPC_CHASSIS.servo;
  // size of the machine, which the browser will give us for free as long as it
  // is told not to "helpfully" correct the pitch back
  try { el.preservesPitch = false; el.mozPreservesPitch = false; el.webkitPreservesPitch = false; } catch (e) {}
  try { el.playbackRate = V.rate; } catch (e) {}
  if (!AC || AC.state !== 'running') return false;
  try {
    const src = AC.createMediaElementSource(el);
    const ch = npcChainBuild(AC, src, id);
    ch.out.connect(AC.destination);
    el.addEventListener('ended', () => { try { ch.osc.stop(); } catch (e) {} }, { once: true });
    return true;
  } catch (e) { return false; }   // already routed, or no graph: play it raw
}
function npcHush() {
  try { if (NPCNODE) { NPCNODE.pause(); NPCNODE.src = ''; } } catch (e) {}
  NPCNODE = null;
}

// ==================================================================
// ORIGINAL CINEMATIC OST — 16th-note sequencer through a hall-reverb
// + compressor bus. Every piece composed for this game.
// ==================================================================
let MG = null, MCOMP = null, MVERB = null;
function musicGain() {
  if (!MG && AC) {
    MCOMP = AC.createDynamicsCompressor();
    MCOMP.threshold.value = -20; MCOMP.knee.value = 14; MCOMP.ratio.value = 7;
    MCOMP.attack.value = 0.004; MCOMP.release.value = 0.2;
    MCOMP.connect(AC.destination);
    MG = AC.createGain(); MG.gain.value = 0.55; MG.connect(MCOMP);
    // generated concert-hall impulse response
    MVERB = AC.createConvolver();
    // shorter IR on touch devices — 2.4s stereo convolution is a mobile CPU hog
    // and starves the audio thread (the "glitching"); 1.3s keeps the hall feel
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const len = Math.floor(AC.sampleRate * (isTouch ? 1.3 : 2.4));
    const ir = AC.createBuffer(2, len, AC.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.7);
    }
    MVERB.buffer = ir;
    const vg = AC.createGain(); vg.gain.value = 0.7;
    MVERB.connect(vg); vg.connect(MCOMP);
  }
  return MG;
}
function vSend(node, amt) {
  const g = AC.createGain(); g.gain.value = amt;
  node.connect(g); g.connect(MVERB);
}
function vEnv(g, t, a, peak, dur) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.05));
}
// deep sub-bass: sine an octave down + soft saw body
function iSub(m, t, d) {
  const g = AC.createGain(), f = AC.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 240;
  g.connect(f); f.connect(musicGain());
  vEnv(g, t, 0.02, 0.2, d);
  const o1 = AC.createOscillator(); o1.type = 'sine'; o1.frequency.value = mf(m - 12);
  const o2 = AC.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = mf(m);
  o1.connect(g); o2.connect(g);
  o1.start(t); o1.stop(t + d + 0.1); o2.start(t); o2.stop(t + d + 0.1);
}
// heroic brass: detuned saw stack + octave-down body, filter blip
function iBrass(m, t, d) {
  const g = AC.createGain(), f = AC.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(500, t);
  f.frequency.linearRampToValueAtTime(2300, t + 0.07);
  f.frequency.linearRampToValueAtTime(950, t + Math.max(0.2, d));
  g.connect(f); f.connect(musicGain()); vSend(f, 0.35);
  vEnv(g, t, 0.03, 0.055, d);
  for (const det of [-12, 0, 11]) {
    const o = AC.createOscillator(); o.type = 'sawtooth';
    o.frequency.value = mf(m); o.detune.value = det;
    o.connect(g); o.start(t); o.stop(t + d + 0.1);
  }
  const ob = AC.createOscillator(); ob.type = 'sawtooth'; ob.frequency.value = mf(m - 12);
  const gb = AC.createGain(); vEnv(gb, t, 0.03, 0.03, d);
  ob.connect(gb); gb.connect(f); ob.start(t); ob.stop(t + d + 0.1);
}
// soaring super-saw lead with vibrato + echo
function iLeadX(m, t, d) {
  const mk = (tt, peak) => {
    const g = AC.createGain(), f = AC.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 2600;
    g.connect(f); f.connect(musicGain()); vSend(f, 0.4);
    vEnv(g, tt, 0.03, peak, d);
    const lfo = AC.createOscillator(), lg = AC.createGain();
    lfo.frequency.value = 5.2; lg.gain.value = 6;
    lfo.connect(lg);
    for (const det of [-14, 0, 14]) {
      const o = AC.createOscillator(); o.type = 'sawtooth';
      o.frequency.value = mf(m); o.detune.value = det;
      lg.connect(o.frequency);
      o.connect(g); o.start(tt); o.stop(tt + d + 0.1);
    }
    lfo.start(tt); lfo.stop(tt + d + 0.1);
  };
  mk(t, 0.036);
  mk(t + 0.21, 0.014);
}
// choir "ahh": soft sine/triangle stack, slow bloom, drowned in reverb
function iChoir(notes, t, d) {
  const f = AC.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 0.4;
  f.connect(musicGain()); vSend(f, 0.9);
  for (const m of notes) {
    const g = AC.createGain(); g.connect(f);
    vEnv(g, t, Math.min(0.7, d * 0.4), 0.05, d);
    const lfo = AC.createOscillator(), lg = AC.createGain();
    lfo.frequency.value = 4.6; lg.gain.value = 3.5; lfo.connect(lg);
    for (const spec of [['sine', m, 1], ['triangle', m, 0.5], ['sine', m + 12, 0.22]]) {
      const o = AC.createOscillator(); o.type = spec[0];
      o.frequency.value = mf(spec[1]); o.detune.value = rnd(-8, 8);
      lg.connect(o.frequency);
      const og = AC.createGain(); og.gain.value = spec[2];
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + d + 0.2);
    }
    lfo.start(t); lfo.stop(t + d + 0.2);
  }
}
// staccato string ostinato note
function iOst(m, t) {
  const g = AC.createGain(), f = AC.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 1700;
  g.connect(f); f.connect(musicGain()); vSend(f, 0.25);
  vEnv(g, t, 0.012, 0.045, 0.13);
  for (const det of [-8, 8]) {
    const o = AC.createOscillator(); o.type = 'sawtooth';
    o.frequency.value = mf(m); o.detune.value = det;
    o.connect(g); o.start(t); o.stop(t + 0.2);
  }
}
function iPluck(m, t, d) {
  const g = AC.createGain(); g.connect(musicGain()); vSend(g, 0.5);
  vEnv(g, t, 0.006, 0.055, Math.min(d, 0.45));
  const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = mf(m);
  o.connect(g); o.start(t); o.stop(t + d + 0.05);
}
function iBell(m, t) {
  const g = AC.createGain(); g.connect(musicGain()); vSend(g, 0.7);
  vEnv(g, t, 0.005, 0.045, 1.3);
  const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = mf(m);
  o.connect(g); o.start(t); o.stop(t + 1.4);
  const g2 = AC.createGain(); g2.connect(musicGain());
  vEnv(g2, t, 0.005, 0.014, 0.8);
  const o2 = AC.createOscillator(); o2.type = 'sine'; o2.frequency.value = mf(m) * 2.76;
  o2.connect(g2); o2.start(t); o2.stop(t + 0.9);
}
function iBass(m, t, d) { iSub(m + 12, t, d); }
// timpani hit
function dTimp(m, t) {
  const g = AC.createGain(); g.connect(musicGain()); vSend(g, 0.45);
  vEnv(g, t, 0.004, 0.34, 0.5);
  const o = AC.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(mf(m), t);
  o.frequency.exponentialRampToValueAtTime(mf(m) * 0.55, t + 0.3);
  o.connect(g); o.start(t); o.stop(t + 0.55);
  const src = AC.createBufferSource(), ng = AC.createGain(), nf = AC.createBiquadFilter();
  src.buffer = noiseBuf(0.1); nf.type = 'lowpass'; nf.frequency.value = 320;
  vEnv(ng, t, 0.002, 0.14, 0.09);
  src.connect(nf); nf.connect(ng); ng.connect(musicGain());
  src.start(t);
}
function dCrash(t) {
  const src = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  src.buffer = noiseBuf(1.5);
  f.type = 'highpass'; f.frequency.value = 4200;
  g.gain.setValueAtTime(0.11, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
  src.connect(f); f.connect(g); g.connect(musicGain()); vSend(g, 0.8);
  src.start(t);
}
function dKick(t) {
  const g = AC.createGain(); g.connect(musicGain());
  vEnv(g, t, 0.003, 0.42, 0.14);
  const o = AC.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
  o.connect(g); o.start(t); o.stop(t + 0.2);
}
function dHat(t) {
  const src = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  src.buffer = noiseBuf(0.05);
  f.type = 'highpass'; f.frequency.value = 6500;
  vEnv(g, t, 0.002, 0.028, 0.05);
  src.connect(f); f.connect(g); g.connect(musicGain());
  src.start(t);
}
function dSnare(t) {
  const src = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  src.buffer = noiseBuf(0.14);
  f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.8;
  vEnv(g, t, 0.002, 0.1, 0.13);
  src.connect(f); f.connect(g); g.connect(musicGain()); vSend(g, 0.3);
  src.start(t);
  const g2 = AC.createGain(); g2.connect(musicGain());
  vEnv(g2, t, 0.002, 0.05, 0.08);
  const o = AC.createOscillator(); o.type = 'triangle'; o.frequency.value = 190;
  o.connect(g2); o.start(t); o.stop(t + 0.1);
}

// ---- composition helpers (build repeated figures) ----
function reps(bars, per, fn) { const a = []; for (let b = 0; b < bars; b++) fn(a, b * per, b); return a; }

// ---- the OST ----
// fields: bpm, steps, once, lead[[s,m,len]], brass[[s,m,len]], choir[[s,[m..],len]],
// sub[[s,m,len]], ost[[start,root,len,[offsets]]], bells[[s,m]], timp[[s,m]],
// crash[steps], bassPulse[[s,m,len]], arp[[s,[m..],len]]+arpRate, drums{k,h,s}
const TRACKS = {
  // "Whiskers in the Dark" — title: slow choir dirge that blooms into a theme
  title: {
    bpm: 76, steps: 128,
    choir: [[0, [57, 60, 64], 32], [32, [53, 57, 60], 32], [64, [48, 52, 55, 60], 32], [96, [55, 59, 62], 32]],
    sub: [[0, 33, 30], [32, 29, 30], [64, 36, 30], [96, 31, 30]],
    timp: reps(4, 32, (a, o) => { a.push([o, 45], [o + 6, 45], [o + 16, 45], [o + 22, 45]); }),
    lead: [[64, 69, 6], [72, 72, 6], [80, 76, 12], [92, 74, 4], [96, 77, 12], [110, 76, 6], [116, 71, 12]],
    bells: [[12, 81], [44, 84], [76, 88], [108, 83]],
    crash: [64],
  },
  // "Rust & Dandelions" — Scrap Meadows: heroic ostinato adventure
  A: {
    bpm: 100, steps: 128,
    ost: reps(8, 16, (a, o, b) => { a.push([o, [60, 58, 53, 60, 60, 58, 53, 55][b], 16, [0, 12, 7, 12, 4, 12, 7, 12]]); }),
    brass: [[0, 67, 8], [12, 64, 4], [16, 65, 6], [24, 62, 4], [32, 60, 12], [48, 67, 6], [56, 70, 6], [64, 72, 12], [80, 70, 4], [84, 67, 6], [96, 65, 8], [108, 62, 4], [112, 67, 14]],
    sub: reps(8, 16, (a, o, b) => { a.push([o, [36, 34, 29, 36, 36, 34, 29, 31][b], 14]); }),
    choir: [[64, [60, 64, 67], 32], [96, [58, 62, 65], 16], [112, [55, 59, 62, 67], 16]],
    timp: reps(8, 16, (a, o, b) => { if (b % 2 === 0) a.push([o, 36]); }),
    drums: { k: [0, 8], h: [0, 2, 4, 6, 8, 10, 12, 14], s: [4, 12] },
    crash: [0, 64],
  },
  // "Packet Storm" — Data Conduits: driving synthwave pulse
  B: {
    bpm: 112, steps: 64,
    ost: [[0, 64, 16, [0, 12, 7, 15]], [16, 60, 16, [0, 12, 7, 16]], [32, 67, 16, [0, 12, 7, 16]], [48, 62, 16, [0, 12, 7, 15]]],
    lead: [[0, 76, 4], [8, 79, 3], [16, 74, 6], [28, 71, 3], [32, 79, 6], [44, 83, 3], [48, 78, 4], [56, 74, 6]],
    choir: [[0, [52, 59, 64], 32], [32, [48, 55, 62], 32]],
    bassPulse: [[0, 40, 16], [16, 36, 16], [32, 43, 16], [48, 38, 16]],
    drums: { k: [0, 4, 8, 12], h: [0, 2, 4, 6, 8, 10, 12, 14], s: [4, 12] },
    crash: [0],
  },
  // "Hammerfall Protocol" — Foundry: war drums + low brass
  C: {
    bpm: 96, steps: 128,
    brass: [[0, 50, 3], [4, 50, 3], [8, 53, 3], [12, 49, 4], [32, 50, 3], [36, 50, 3], [40, 56, 3], [44, 55, 4], [64, 50, 3], [68, 50, 3], [72, 53, 3], [76, 57, 4], [96, 58, 6], [104, 56, 6], [112, 53, 8], [120, 49, 8]],
    sub: reps(8, 16, (a, o, b) => { a.push([o, [38, 38, 36, 38, 38, 38, 41, 37][b], 14]); }),
    choir: [[32, [50, 53, 56], 32], [96, [49, 53, 58], 32]],
    timp: reps(8, 16, (a, o) => { a.push([o, 38], [o + 3, 38], [o + 8, 38], [o + 11, 45], [o + 14, 44]); }),
    drums: { k: [0, 6, 8], h: [2, 10, 14], s: [4, 12] },
    crash: [0, 64],
  },
  // "Music Box for a Frozen Library" — Archives: choir + bells, vast and cold
  D: {
    bpm: 80, steps: 64,
    bells: [[0, 74], [4, 78], [8, 81], [12, 78], [16, 73], [20, 76], [24, 81], [28, 76], [32, 74], [36, 78], [40, 83], [44, 81], [48, 78], [56, 73]],
    choir: [[0, [59, 62, 66, 71], 32], [32, [55, 59, 62, 67], 32]],
    sub: [[0, 35, 30], [32, 31, 30]],
    timp: [[0, 35], [32, 31]],
  },
  // "Something Grows in the Wires" — Virus Nest: tritone dread
  E: {
    bpm: 100, steps: 64,
    ost: [[0, 65, 32, [0, 0, 6, 0, 0, 0, 6, 7]], [32, 68, 16, [0, 0, 6, 0, 0, 0, 6, 5]], [48, 70, 16, [0, 0, 5, 0, 0, 0, 6, 0]]],
    choir: [[0, [53, 59, 62], 32], [32, [56, 62, 65], 32]],
    lead: [[8, 72, 4], [24, 71, 6], [40, 74, 4], [52, 68, 8]],
    sub: [[0, 41, 30], [32, 44, 14], [48, 47, 8], [56, 46, 8]],
    timp: reps(4, 16, (a, o) => { a.push([o, 41], [o + 3, 41]); }),
    crash: [32],
  },
  // "Prism Waltz" — Crystal Cache: harp shimmer + lydian choir
  X: {
    bpm: 108, steps: 64,
    arp: [[0, [55, 62, 66, 73], 16], [16, [57, 64, 69, 76], 16], [32, [59, 66, 71, 78], 16], [48, [55, 64, 71, 74], 16]], arpRate: 1,
    choir: [[0, [55, 62, 66, 71], 32], [32, [57, 64, 69, 74], 32]],
    bells: [[0, 86], [16, 88], [32, 90], [48, 85]],
    sub: [[0, 31, 14], [16, 33, 14], [32, 35, 14], [48, 31, 14]],
  },
  // "Claws Out" — boss battle: racing strings, brass war-calls, B-section lift
  boss: {
    bpm: 150, steps: 128,
    ost: reps(8, 16, (a, o, b) => { a.push([o, [57, 57, 53, 55, 53, 55, 57, 57][b], 16, [0, 12, 0, 12, 7, 12, 0, 12]]); }),
    brass: [[0, 45, 3], [8, 45, 3], [16, 41, 4], [24, 43, 4], [32, 45, 3], [40, 47, 3], [48, 48, 6], [56, 50, 6], [64, 53, 8], [80, 55, 8], [96, 57, 12], [112, 55, 6], [120, 52, 6]],
    lead: [[64, 77, 6], [72, 76, 4], [80, 79, 8], [96, 81, 12], [112, 79, 6], [120, 74, 6]],
    sub: reps(8, 16, (a, o, b) => { a.push([o, [33, 33, 29, 31, 29, 31, 33, 33][b], 15]); }),
    timp: reps(8, 16, (a, o) => { a.push([o, 33], [o + 10, 33]); }),
    drums: { k: [0, 4, 8, 12], h: [0, 2, 4, 6, 8, 10, 12, 14], s: [4, 12] },
    crash: [0, 64],
  },
  // "NULL / VOID" — MOTHER-V: half-step menace, relentless war machine
  mother: {
    bpm: 156, steps: 128,
    ost: reps(8, 16, (a, o, b) => { a.push([o, [59, 59, 58, 59, 59, 60, 58, 56][b], 16, [0, 12, 1, 12, 0, 12, 1, 12]]); }),
    brass: [[0, 47, 6], [16, 46, 6], [32, 47, 6], [48, 52, 6], [64, 47, 8], [80, 53, 8], [96, 54, 10], [112, 50, 12]],
    choir: [[0, [59, 62, 65], 64], [64, [58, 61, 64, 67], 64]],
    sub: reps(8, 16, (a, o, b) => { a.push([o, [35, 34, 35, 40, 35, 41, 42, 38][b], 15]); }),
    timp: reps(8, 16, (a, o) => { a.push([o, 35], [o + 6, 35], [o + 12, 35]); }),
    drums: { k: [0, 4, 8, 10, 12], h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], s: [4, 12] },
    crash: [0, 32, 64, 96],
  },
  // "Sunlight on Rusted Fur" — victory fanfare
  winTheme: {
    bpm: 110, steps: 64, once: true,
    brass: [[0, 60, 4], [6, 64, 4], [12, 67, 6], [20, 72, 12], [32, 71, 6], [40, 72, 20]],
    choir: [[0, [60, 64, 67], 32], [32, [60, 65, 69], 16], [48, [60, 64, 67, 72], 16]],
    bells: [[12, 88], [24, 91], [40, 96], [52, 84]],
    timp: [[0, 36], [32, 41], [48, 36]],
    crash: [0, 32],
  },
};

const MUS = { cur: null, name: null, step: 0, nextT: 0 };
// THE SCORE, SLOT BY SLOT. Each entry names a file in assets/music/ and the
// level to play it at. A slot whose file is not on disk simply loses, and the
// synth score for that slot plays instead — so the game is never silent while
// the album is being written, and every finished track turns itself on.
//
// Boss slots are per guardian and fall back to the shared 'boss' slot, which is
// why every fight already has music even though only one recording exists.
// Each slot lists its candidates best-first, so a new score displaces the
// placeholder it replaces and nothing loses the music it already had.
// THE WHOLE SCORE IS ONE SET NOW, mastered by role rather than balanced by
// guesswork here: the opening and the ending at -14 LUFS, fights at -15, the
// rooms you live in at -16.5, the safe room quietest of all. Because the files
// themselves carry that hierarchy, these numbers no longer need to differ much
// — a per-track gain that fights the master is how a library drifts out of
// balance every time one file is replaced.
const RECORDED_TRACKS = {
  title: [['mus_title', 0.55], ['ambient', 0.5]],
  intro: [['mus_intro', 0.75], ['ambient', 0.5]],
  A: [['mus_meadows', 0.55]], B: [['mus_conduits', 0.55]], C: [['mus_foundry', 0.55]],
  D: [['mus_archives', 0.55]], E: [['mus_nest', 0.55]], X: [['mus_cache', 0.55]],
  // THE FIGHTS GET THE ORCHESTRA.
  //
  // `epic_combat` — a real recorded combat track, credited and cleared in
  // assets/CREDITS.md — was listed LAST in the shared `boss` slot, behind a
  // generated placeholder that always loads. pickRecorded takes the first
  // candidate that plays, so the one genuinely epic recording in the library
  // has never been heard in a boss fight: every guardian was scored by a
  // generated stand-in, and next to the opening they sound exactly like what
  // they are.
  //
  // It goes first now, for all six. This is a deliberate trade: every fight
  // shares one theme instead of each carrying its own, and one strong theme
  // beats six weak ones by a distance. The per-guardian tracks stay directly
  // behind it as the fallback, so the moment a real score exists for a
  // specific guardian it only has to move up one line.
  boss_glitch: [['boss', 0.62], ['mus_nullfang', 0.6], ['mus_boss', 0.6]],
  boss_brood: [['boss', 0.62], ['mus_talonhost', 0.6], ['mus_boss', 0.6]],
  boss_atlas: [['boss', 0.62], ['mus_furnace', 0.6], ['mus_boss', 0.6]],
  boss_zero: [['boss', 0.62], ['mus_glaciere', 0.6], ['mus_boss', 0.6]],
  boss_prism: [['boss', 0.62], ['mus_prism', 0.6], ['mus_boss', 0.6]],
  // MOTHER-V keeps her own, and only she does: the last fight is the one place
  // a shared theme costs more than it gives.
  boss_mother: [['mus_mother', 0.64], ['boss', 0.6], ['mus_boss', 0.6]],
  // the Eye's constructs share the general boss score. They are not
  // guardians and do not get a name theme; five bespoke cues for five
  // side fights is a lot of music spent on the part of the game the player
  // chose to go and find.
  boss_mini: [['mus_eye', 0.6], ['boss', 0.62], ['mus_boss', 0.6]],
  // THE PACK ALPHA gets its own theme, and it is the only mini-boss that does.
  // It is the first real boss the player meets and the only one in the game
  // that is TAMED rather than destroyed, so it earns a name cue the way a
  // guardian does — and it earns a second one for the moment it yields, which
  // is not a victory fanfare but a truce: the same hunting-horn call, broken
  // and alone, resolving from C minor into C major as the pack accepts her.
  boss_alpha: [['mus_alpha', 0.62], ['boss', 0.6], ['mus_boss', 0.6]],
  alphaTame: [['mus_alphatame', 0.6], ['ambient', 0.45]],
  boss: [['boss', 0.62], ['mus_boss', 0.6]], mother: [['mus_mother', 0.64], ['mus_boss', 0.6]],
  // the one that plays over the ending, after the last blow has been swung
  winTheme: [['mus_ending', 0.6], ['ambient', 0.45]],
};
function pickRecorded(name) {
  const cand = RECORDED_TRACKS[name]; if (!cand) return false;
  for (const c of cand) if (playRecorded(c[0], c[1])) return true;
  return false;
}
// when a per-guardian slot has neither a recording nor a synth track of its own
const MUS_FALL = {
  boss_glitch: 'boss', boss_brood: 'boss', boss_atlas: 'boss',
  boss_zero: 'boss', boss_prism: 'boss', boss_mother: 'mother', boss_mini: 'boss', boss_alpha: 'boss', alphaTame: 'ambient',
  // the sage duel has its OWN slot now: drop mus_sage.m4a into assets/music
  // (ART_QUEUE brief) and every chamber picks it up; until then the duels
  // borrow the guardian track through this fallback
  sage: 'boss',
  intro: 'title',
};
function setMusic(name) {
  if (MUS.name === name) return;
  stopRecorded();
  MUS.name = name;
  const back = MUS_FALL[name];
  if (MUSIC_ON && !MUTED && (pickRecorded(name) || (back && pickRecorded(back)))) {
    MUS.cur = null; return;
  }
  MUS.cur = TRACKS[name] || (back && TRACKS[back]) || null;
  MUS.step = 0; MUS.nextT = 0;
}
function stopMusic() { stopRecorded(); MUS.name = null; MUS.cur = null; }
function schedStep(tr, s, t, spb) {
  if (tr.lead) for (const ev of tr.lead) if (ev[0] === s) iLeadX(ev[1], t, ev[2] * spb);
  if (tr.brass) for (const ev of tr.brass) if (ev[0] === s) iBrass(ev[1], t, ev[2] * spb);
  if (tr.choir) for (const ev of tr.choir) if (ev[0] === s) iChoir(ev[1], t, ev[2] * spb);
  if (tr.sub) for (const ev of tr.sub) if (ev[0] === s) iSub(ev[1], t, ev[2] * spb);
  if (tr.bass) for (const ev of tr.bass) if (ev[0] === s) iBass(ev[1], t, ev[2] * spb);
  if (tr.bells) for (const ev of tr.bells) if (ev[0] === s) iBell(ev[1], t);
  if (tr.timp) for (const ev of tr.timp) if (ev[0] === s) dTimp(ev[1], t);
  if (tr.crash && tr.crash.indexOf(s) >= 0) dCrash(t);
  if (tr.ost) for (const seg of tr.ost) {
    if (s >= seg[0] && s < seg[0] + seg[2]) {
      const off = seg[3][(s - seg[0]) % seg[3].length];
      if (off != null) iOst(seg[1] + off, t);
    }
  }
  if (tr.arp) {
    const rate = tr.arpRate || 2;
    for (const seg of tr.arp) {
      if (s >= seg[0] && s < seg[0] + seg[2] && (s - seg[0]) % rate === 0)
        iPluck(seg[1][((s - seg[0]) / rate) % seg[1].length], t, spb * rate * 1.6);
    }
  }
  if (tr.bassPulse) {
    for (const seg of tr.bassPulse) {
      if (s >= seg[0] && s < seg[0] + seg[2] && (s - seg[0]) % 2 === 0)
        iSub(seg[1], t, spb * 1.7);
    }
  }
  if (tr.drums) {
    const b = s % 16;
    if (tr.drums.k && tr.drums.k.indexOf(b) >= 0) dKick(t);
    if (tr.drums.h && tr.drums.h.indexOf(b) >= 0) dHat(t);
    if (tr.drums.s && tr.drums.s.indexOf(b) >= 0) dSnare(t);
  }
}
setInterval(() => {
  if (AC && AC.state === 'suspended' && AUD_UNLOCKED) { try { AC.resume(); } catch (e) {} }
  if (!AC || AC.state !== 'running' || !MUS.cur || MUTED || !MUSIC_ON) return;
  musicGain();
  const tr = MUS.cur, spb = 60 / tr.bpm / 4;
  // if the main thread stalled (mobile), resync without scheduling a huge burst
  if (MUS.nextT < AC.currentTime) MUS.nextT = AC.currentTime + 0.08;
  // wider lookahead (0.35s) so audio survives render hitches without glitching
  let guard = 0;
  while (MUS.nextT < AC.currentTime + 0.35 && guard++ < 40) {
    schedStep(tr, MUS.step, MUS.nextT, spb);
    MUS.step++;
    if (MUS.step >= tr.steps) {
      if (tr.once) { stopMusic(); break; }
      MUS.step = 0;
    }
    MUS.nextT += spb;
  }
}, 40);
// legacy shims (old drone API)
function setDrone(z) { setMusic(z); }
function stopDrone() { stopMusic(); }
