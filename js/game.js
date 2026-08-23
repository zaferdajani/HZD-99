// CLAWBYTE — main loop, states, HUD, menus, save
const cv = document.getElementById('cv');
let c = cv.getContext('2d');
const mainCtx = c;
const SAVE_KEY = 'clawbyte_save', META_KEY = 'clawbyte_meta';
const GAME_VERSION = 'CLAWBYTE v4.3';
// ---- update checker ----
// The page re-fetches its own source bypassing the cache and compares the
// build stamp, so a stale home-screen copy is told a newer one exists.
function checkForUpdate() {
  if (G.updateReady) return;
  try {
    fetch(location.href.split('?')[0], { cache: 'reload' })
      .then(r => r.ok ? r.text() : null)
      .then(txt => {
        if (!txt) return;
        // the build id is injected by build.cjs on every build; dev.html has
        // none, so the dev page never self-refreshes
        const m = txt.match(/BUILD_ID\s*=\s*["']([^"']+)["']/);
        const mine = (typeof window !== 'undefined' && window.BUILD_ID) || null;
        if (m && mine && m[1] !== mine) {
          G.updateReady = (txt.match(/GAME_VERSION\s*=\s*'([^']+)'/) || [0, 'update'])[1];
          G.updateStamp = Date.now();
        }
      })
      .catch(() => {});
  } catch (e) {}
}
// The home-screen copy updates itself: re-check when the app is resumed from the
// home screen and every ten minutes while open; when an update exists and you
// are on the title screen — nothing to lose — it applies on its own.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkForUpdate();
  });
  setInterval(checkForUpdate, 10 * 60 * 1000);
  setTimeout(checkForUpdate, 4000);
}
function applyUpdate() {
  try {
    const base = location.href.split('#')[0].replace(/[?&]_v=\d+/, '');
    location.replace(base + (base.indexOf('?') >= 0 ? '&' : '?') + '_v=' + (G.updateStamp || 1));
  } catch (e) { location.reload(); }
}

const CRESTS = { claws: 2, over: 2, plate: 2, magnet: 1, siphon: 1, phantom: 2, sprint: 1, ground: 2, nine: 3 };
const SHOP = [
  // SOMETHING SHE CAN ACTUALLY AFFORD. Every other line on this list costs more
  // than a whole kingdom's scrap, which meant a new player met the shop, read
  // seven prices they could not pay, and learned that money is a number that
  // goes up. The cell is deliberately cheap, deliberately repeatable, and
  // deliberately the thing HEALING runs on — so one purchase teaches the whole
  // economy: scratch a machine, take its scrap, turn it into volts, spend the
  // volts on a core.
  { id: 'cell', type: 'cell', cost: 12 },
  { id: 'claws', type: 'crest', cost: 220 }, { id: 'over', type: 'crest', cost: 240 },
  { id: 'plate', type: 'crest', cost: 300 }, { id: 'siphon', type: 'crest', cost: 200 },
  { id: 'sprint', type: 'crest', cost: 180 },
  { id: 'slot', type: 'slot', cost: 400 }, { id: 'core', type: 'core', cost: 500 },
];
const BENCH_ROOMS = ['A3', 'B3', 'D1', 'E2'];

const G = {
  state: 'MENU', save: null, grid: null, roomId: '', roomDef: null,
  enemies: [], projs: [], pickups: [], statics: [], boss: null,
  trans: null, fade: 0, toasts: [], zoneToast: null, lastZone: '',
  menuIdx: 0, diffIdx: 1, pauseIdx: 0, crestIdx: 0, shopIdx: 0,
  dialog: null, deadT: 0, winT: 0, near: null, time: 0,
  hitStop: 0, flash: 0, rings: [], wrecks: [],
  recharge: null, coreFlash: null, coresFullT: 0, healToasted: false, bolt: null,
  updateReady: null, updateStamp: 0,
  addRing(x, y, r0) { this.rings.push({ x, y, r: r0 || 12, a: 0.85 }); },
  toast(text) { this.toasts.push({ text, t: 3 }); },
  breakTile(tx, ty) {
    this.save.broken[this.roomId + ':' + tx + ',' + ty] = 1;
    // the lesson is learned the first time it works. From here the seam stops
    // being announced and every remaining one is on the player to spot.
    if (!this.save.flags.taughtBreak) { this.save.flags.taughtBreak = 1; persist(); }
    tileDirty = true;
    sfx('break'); cam.shake = Math.max(cam.shake, 4);
    burst(tx * TILE + 16, ty * TILE + 16, 14, PAL[this.roomDef.zone].solid, 220, 0.6, 600, 4);
    burst(tx * TILE + 16, ty * TILE + 16, 6, PAL[this.roomDef.zone].glow, 160, 0.4, 300, 3, true);
  },
  dropScrap(x, y, total) {
    let left = total;
    while (left > 0) { const v = Math.min(left, irnd(2, 5)); left -= v; this.pickups.push(new Scrap(x, y, v)); }
  },
  onPlayerDeath() {
    this.save.deaths++;
    if (this.save.diff === 2) this.save.lives++;
    if (this.save.scrap > 0 || player.volts > 8) {
      this.save.pouch = { room: this.roomId, x: clamp(player.x, 40, this.roomDef.w * TILE - 60), y: Math.min(player.y, 13 * TILE), amount: this.save.scrap };
      this.save.pouchVolts = Math.round(player.volts);   // the charge stays with it too
      this.save.scrap = 0;
    }
    persist();
    stopMusic(); sfx('dieSting');
    this.state = 'DEAD'; this.deadT = 1.8;
  },
  grantRelic(id) {
    if (!this.save.relics) this.save.relics = [];
    if (this.save.relics.indexOf(id) >= 0) return;
    this.save.relics.push(id);
    persist(); sfx('win');
    showItem(t('rl_' + id), t('rl_' + id + 'd'));
  },
  maybeDropRelic(x, y) {
    const pool = RELIC_DROPS.filter(id => !(this.save.relics || []).includes(id));
    if (!pool.length) return;
    if (Math.random() < 0.04 * (this.save.relics && this.save.relics.includes('star') ? 2 : 1))
      this.pickups.push(new RelicPickup(x - 10, y - 10, pool[Math.floor(Math.random() * pool.length)]));
  },
  onBossDead(kind) {
    const cap = kind.charAt(0).toUpperCase() + kind.slice(1);
    this.save.flags['boss' + cap] = 1;
    // THE RULE: every guardian resolved — felled or tamed — REVEALS A CAVE.
    // The lair grows a depth door (GATE_ROOM `need` flags), the map grows the
    // cave sign, and the player is told the ground moved so the reveal is an
    // event, not a secret. What waits inside each grotto is its own story.
    {
      const opened = kind === 'alpha' ? 'alpha' : 'boss' + cap;
      for (const rid in (typeof GATE_ROOM !== 'undefined' ? GATE_ROOM : {})) {
        if (!gateDoorsAll(rid).some(d => d.need === opened)) continue;
        G.toast(t('cave_open'));
        sfx('chargeReady');
        break;
      }
    }
    // THE EYE'S CONSTRUCTS pay a cell and nothing else. No ability, no arm, no
    // trophy relic — they were built around the cell and there is nothing else
    // in them. Returning here keeps the guardians' whole reward chain (which
    // assumes a creature that had a life before the Song) off a thing that
    // never did.
    // THE ALPHA. It is not a guardian and it is not one of the Eye's things, so
    // it pays in the one currency neither of them can: THE PACK CHANGES SIDES.
    // Every wolf in the game, in every room, from this moment — including the
    // ones standing in rooms she cleared an hour ago, because the flag is read
    // at draw time rather than baked into a spawn.
    if (kind === 'alpha') {
      this.save.flags.alpha = 1;
      invAdd('batt');
      showItem(t('alpha_won'), t('alpha_wond'));
      this.save.scrap += 60;
      // its own cue, and it is the only one in the game that resolves major
      if (typeof setMusic === 'function') setMusic('alphaTame');
      persist();
      return;
    }
    if (typeof MINIS !== 'undefined' && MINIS[kind]) {
      invAdd('batt');
      showItem(t('i_batt'), t('i_battd'));
      this.save.scrap += 40;
      // 'room' was never a real track key — resolve to the zone's own theme,
      // which is exactly what loadRoom plays for a non-boss room
      if (typeof setMusic === 'function') setMusic(G.roomDef ? G.roomDef.zone : 'A');
      return;
    }
    const grants = { glitch: 'dash', brood: 'djump', atlas: 'emp', zero: 'key' };
    if (grants[kind]) grantMod(grants[kind]);
    // THE CELL. Every guardian was built around one, and it comes out when the
    // guardian stops. NULLFANG's is the one that opens the shop — which is why
    // the trader is standing in the room next door and why he has been dark
    // since you walked past him.
    invAdd('batt');
    showItem(t('i_batt'), t('i_battd'));
    // …and the suit it was wearing. This is the Mega Man X loop: the thing that
    // beat you becomes the thing that beats the next one.
    const arm = ARM_BY_BOSS[kind];
    if (arm) {
      if (!this.save.arms) this.save.arms = [];
      if (!this.save.arms.includes(arm)) {
        this.save.arms.push(arm);
        this.save.armIdx = this.save.arms.length;   // wear it immediately
        showItem(t('arm_' + arm), t('arm_' + arm + 'd') + '  —  ' + t('arm_how'));
      }
    }
    const tr = RELIC_TROPHY[kind];
    if (tr && !(this.save.relics || []).includes(tr)) {
      if (!this.save.relics) this.save.relics = [];
      this.save.relics.push(tr);
      this.toast(t('rl_' + tr) + ' — ' + t('rl_' + tr + 'd'));
    }
    if (kind === 'prism') this.grantRelic('sigil1');
    if (kind === 'prism') {
      const def = ROOMS.X1.ents.find(e => e[0] === 'chest');
      spawnStatic('chest', def[1], def[2], def[3], 'ch_X1_' + ROOMS.X1.ents.indexOf(def));
    }
    if (kind === 'mother') { this.save.won = true; this.winT = 2.6; }
    persist();
  },
};
let player = null;

// ---------- persistence ----------
// one save slot PER character, so the robo-cat and the hero playthroughs coexist
function saveKeyFor(theme) { return SAVE_KEY + '_' + (theme || 'robo'); }
function persist() { try { localStorage.setItem(saveKeyFor(G.save.theme), JSON.stringify(G.save)); } catch (e) {} }
function loadStored(theme) {
  try {
    const v = localStorage.getItem(saveKeyFor(theme));
    if (v) return JSON.parse(v);
  } catch (e) {}
  return null;
}
function anySave() { return !!(loadStored('robo') || loadStored('hero')); }
function wipeSave(theme) { try { localStorage.removeItem(saveKeyFor(theme)); localStorage.removeItem(SAVE_KEY); } catch (e) {} }
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify({ lang: LANG, muted: MUTED, music: MUSIC_ON, bright: BRIGHT_SET })); } catch (e) {} }
function loadMeta() {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY));
    if (m) {
      LANG = m.lang || 'en'; MUTED = !!m.muted; MUSIC_ON = m.music !== false;
      // a screen setting belongs to the SCREEN, so it rides in meta with the
      // language and the mute rather than in the save — it must survive a new
      // game, and it must not travel to a different device with one
      if (typeof m.bright === 'number') BRIGHT_SET = m.bright;
      return true;
    }
  } catch (e) {}
  return false;
}
function newSave(diff) {
  return {
    v: 1, diff, scrap: 0, coresMax: DIFFS[diff].cores, abil: {}, crests: [], equip: [], arms: [], armIdx: 0, stars: 6,
    slots: 3, iq: 0, skills: [], relics: [], flags: {}, broken: {}, visited: {}, shop: {},
    // SHE STARTS IN THE CRADLE, not on the meadow floor. W1 is the room the
    // opening film hands her to; A0 is where the game's economy starts, two
    // rooms and two learned verbs later.
    bench: { room: 'W1', x: 96, y: 412 }, deaths: 0, lives: 0, time: 0,
    pouch: null, usedNine: false, won: false, evo: 0, pace: 0, quests: {}, culls: {}, bag: {},
    // SHE STARTS WITH ONE CELL, AND ONLY ONE. See INV/npcCharge below: the
    // machine folk were offline when the Song went out, so nothing infected
    // them — and nothing charged them either. That single cell is the first
    // decision in the game and the reason the second NPC matters.
    items: { batt: 1 },
  };
}
// ===========================================================================
// THE INVENTORY, and the arc it exists for.
//
// The story the world never told: every NPC in the Depths was POWERED DOWN on
// the night the Song went out. That is why they are still themselves — the
// broadcast could not reach a machine that was not listening. It is also why
// they are standing there dark: nobody has charged them since.
//
// So a Power Cell is the game's real currency of progress. She starts with one.
// NULLFANG carries one. Every mini-boss the Eye made is sitting on another. The
// supply is exactly the demand — there is no cell to waste and none to hoard,
// which is what makes "who do I wake first" a question rather than a formality.
//
// `bag` already existed for quest fetch-items and is boolean; this is counted,
// and the inventory screen shows both.
const INV = {
  batt: { icon: '⚡', col: '#ffd76a' },
  kit:  { icon: '✚', col: '#7dff9a' },
  coil: { icon: '◎', col: '#57a8ff' },
  cshard: { icon: '◆', col: '#dff2ff' },
};
function invCount(id) { return (G.save.items && G.save.items[id]) || 0; }
function invAdd(id, n) {
  G.save.items = G.save.items || {};
  G.save.items[id] = invCount(id) + (n == null ? 1 : n);
  persist();
}
function invTake(id, n) {
  const need = n == null ? 1 : n;
  if (invCount(id) < need) return false;
  G.save.items[id] -= need;
  if (G.save.items[id] <= 0) delete G.save.items[id];
  persist();
  return true;
}
// A PLACEMENT, NOT A SUBJECT. `ratchet` stands in two rooms — the waking floor
// and the camp by NULLFANG's door — and they are two different meetings with
// the same trader. Keying the charge on the subject alone would wake both at
// once and hand you the shop before you had earned it, so the key is the room
// as well.
function npcKey(s) { return (s.room || G.roomId) + '|' + s.extra; }

// ---------------------------------------------------------------------------
// RATCHET, THE ONE WHO NEVER FINISHED (owner, 2026-08-21: "give it a
// character... give it, like, uncontrollable tick... keeps happening while
// working or while talking. And maybe smoke coming out of it... just keep it
// busy until I talk to it").
//
// THE CHARACTER, because the animation is only legible if the story under it
// is. He was mid-reach for a tool when the Song fell. That instruction never
// completed — and it still fires: the arm goes out, the fingers open, there is
// nothing there. That is the tic, and it is not a twitch bolted on for
// flavour, it is the one thing that broke and never got repaired. His coolant
// regulator did not come back either, so he runs hot and blows it off through
// the canister rack on his back. And what he is building, endlessly, out of
// salvage that does not fit, is a replacement regulator — which is why he is
// always busy, always hot, never finished, and why he wants her scrap.
//
// WHY THIS IS NOT AN ATLAS ROW. Class D (ART_BIBLE §1) is one 6-yaw sheet and
// a breathe cycle: it can turn and it can bob, and that is the whole
// vocabulary. None of the above fits in it. So Ratchet changes class — he is a
// PLATE SET now, seven authored poses of one body, and the code's job is to
// choose which one and when.
//
// THE SMOKE IS CODE, DELIBERATELY. art-prompts §0: additive glow handed to a
// generator comes back as a beautifully lit SOLID OBJECT, because the model
// renders a thing and the compositor wanted light. So the plates were fired
// with "no smoke, no steam, no vapour" in every negative, and the vent is
// particles drawn over them — which also means it can react to the beat
// instead of being baked into one frame of it.
const TINKER_PLATE = {
  work1: 'ratchetWork1', work2: 'ratchetWork2', tic: 'ratchetTic',
  notice: 'ratchetNotice', talk1: 'ratchetTalk1', talk2: 'ratchetTalk2',
  vent: 'ratchetVent',
};
// how long each beat holds, in seconds. The tic is SHORT — a spasm the length
// of a real one — and the work beats are uneven so the loop does not tick like
// a metronome.
const TINKER_HOLD = {
  work1: 1.15, work2: 1.55, tic: 0.42, notice: 1.0,
  talk1: 1.6, talk2: 1.35, vent: 1.1,
};
function tinkerRig(s) {
  if (!s._tk) {
    s._tk = { pose: 'work1', t: 0.6, last: 0, tic: rnd(3, 7), vent: rnd(9, 16), blew: false,
              // the task machine — see tinkerTask()
              job: 'shape', jt: rnd(5, 8), ph: rnd(0, 12),
              play: 0, hold: 0, fps: 10, dir: 1 };
    // his den is the only room that plays the whole set; at the booth he is
    // standing and talking, so the three work plates are never asked for and
    // must not be fetched.
    const all = npcKey(s) === 'A0B|ratchet';
    for (const k in TINKER_PLATE) {
      if (all || k === 'talk1' || k === 'talk2' || k === 'notice' || k === 'tic') mediaFetch(TINKER_PLATE[k]);
    }
  }
  return s._tk;
}
// ---------------------------------------------------------------------------
// AND THE REST OF THE FOLK HAVE JOBS TOO (owner, 2026-08-22, on Ratchet: "some
// work that does not look repeated... doing something instead").
//
// The same complaint applies to every other machine-person in the game, and
// they had it worse: Ratchet was at least looping, they were a standing
// turnaround cell with a 1.8 Hz breath on it. Furniture that says a line.
//
// They have more vocabulary than anyone used. The turntable is SIX authored
// angles, `drawAtlas` cross-fades between the two nearest, and facing only ever
// asks for 0..4 — so column 5, the one where the body is turned away into its
// own work, has never been drawn in this game. Its own comment says so: "a
// turntable renderer that cannot be asked for a specific angle is a turntable
// renderer with a hole in it."
//
// So each of them gets a JOB in the same shape as the tinker's: a short list of
// beats, each a place to be looking and a spread of how long to look there,
// with the TURN BETWEEN THEM EASED so the turn is itself the motion. The order
// is walked with a skip, the holds are re-rolled every beat, and the arc is
// nobody's multiple of anybody else's — so no two of them fall into step, which
// is the failure mode a shared idle always has.
//
// It stops the moment she is near or talking: then they face her, exactly as
// before. Turning your back on someone who is standing in front of you is worse
// than standing still, and being interrupted at work is the read that made the
// tinker's den feel like a room somebody lives in.
const NPC_JOB = {
  // Old Servo runs the winding house: he is turned INTO the winch most of the
  // time, and what he turns back for is to look at what came off it
  servo: [{ col: 5, t: [3.0, 5.5], work: 1 }, { col: 1, t: [1.6, 2.8] },
          { col: 4, t: [2.2, 4.0], work: 1 }, { col: 0, t: [1.2, 2.2] }],
  // the Oracle hangs from her cables in front of a wall of dead monitors. She
  // does not work; she WATCHES, and the beats are which screen still has
  // something on it. Long holds — she is patient in a way the others are not.
  mono:  [{ col: 2, t: [3.5, 6.5], work: 1 }, { col: 4, t: [3.0, 5.0] },
          { col: 1, t: [2.5, 4.5], work: 1 }],
  // Patch-7 at the quench: quick, fussy, always turning between the fire and
  // the bench. The shortest holds of anyone here.
  patch: [{ col: 5, t: [1.4, 2.6], work: 1 }, { col: 2, t: [0.9, 1.8] },
          { col: 4, t: [1.3, 2.4], work: 1 }, { col: 0, t: [0.8, 1.6] }],
  // the Nymph drifts. Her beats are barely a job at all — she turns the way
  // something growing turns, slowly and without a reason you can see.
  lumen: [{ col: 1, t: [4.0, 7.0], work: 1 }, { col: 3, t: [3.5, 6.0] },
          { col: 5, t: [3.0, 5.5], work: 1 }],
  // the Sage is the still one, and stillness has to be AUTHORED or it reads as a
  // bug. The first pass gave him two angles one step apart and he measured as
  // frozen — which is the difference between a person being still and a picture
  // being still. A person at rest shifts: three angles, long holds, and one of
  // them further round than the others so the shift is occasionally visible.
  sage:  [{ col: 2, t: [6.0, 10.0], work: 1 }, { col: 3, t: [5.0, 9.0] }, { col: 1, t: [4.0, 7.5] }],
  // Ratchet AT THE BOOTH — not in the den, where drawTinker owns him. A
  // shopkeeper turns to his stock and back to the road.
  ratchet: [{ col: 0, t: [2.0, 3.6] }, { col: 5, t: [2.4, 4.2] },
            { col: 1, t: [1.6, 3.0] }],
};
// She is standing over them: the same radius the tinker uses, so the whole cast
// reacts to being approached on one rule rather than five.
function nearNpc(s) {
  return !!(player && Math.abs((player.x + player.w / 2) - (s.x + s.w / 2)) < 140);
}
// Per-body wall clock. The draw path has no dt of its own, and this is
// presentation, so it takes one from the frame — clamped, because a tabbed-out
// page must not hand it four seconds and spin the whole cast round.
function npcDt(s) {
  const now = performance.now() / 1000;
  const dt = s._jt ? Math.min(0.1, now - s._jt) : 0;
  s._jt = now;
  return dt;
}
// THE WORK STRIPS, fired by the art session against the §2v brief. Each is
// twelve frames of that machine doing its own job, and each is wired the way
// the tinker's is: a `work` beat PLAYS it, in bursts, at a tempo re-rolled per
// burst, with the phase carried across beats — while every other beat is the
// turntable angle. media.js's entry says "wired through NPC_LOOP in
// js/game.js", which is this; the keys landed a commit before the wiring did,
// and declared-but-never-drawn is the exact failure ART_BIBLE §7 exists for.
const NPC_LOOP = {
  servo: 'servoLoop', mono: 'monoLoop', patch: 'patchLoop',
  sage: 'sageLoop', lumen: 'lumenLoop',
};
// how long a work beat plays for and how fast, per body — the same shape as
// the tinker's TINKER_JOB, and per-character for the same reason: the warden
// reading a console and the tinker welding do not move at one speed.
const NPC_WORK = {
  servo: { fps: [6, 9],  run: [10, 30], hold: [0.30, 0.90] },
  mono:  { fps: [4, 6],  run: [6, 18],  hold: [0.60, 1.60] },
  patch: { fps: [9, 14], run: [14, 40], hold: [0.18, 0.55] },
  sage:  { fps: [3, 5],  run: [5, 14],  hold: [1.00, 2.40] },
  lumen: { fps: [4, 7],  run: [8, 20],  hold: [0.50, 1.40] },
};
// how fast a body turns, in authored columns per second. Slow enough to be a
// turn and not a cut; the cross-fade in drawAtlas does the rest.
const NPC_TURN = 1.6;
function npcJobCol(s, dt) {
  const list = NPC_JOB[s.extra];
  if (!list) return null;
  let j = s._job;
  if (!j) {
    // start each of them on a different beat and a different part of it, so a
    // room with two people in it does not have them moving together
    const i = Math.floor(rnd(0, list.length));
    // play/hold/ph/fps/dir must exist as NUMBERS from the first frame: the
    // burst test is `j.play <= 0`, and `undefined <= 0` is false, so an
    // uninitialised body never starts a burst, never sets an fps, and drives
    // its phase to NaN on the first work beat. It measured as a strip that
    // played and never moved.
    j = s._job = { i, t: rnd(list[i].t[0], list[i].t[1]) * rnd(0.2, 1), col: list[i].col,
                   work: false, ph: rnd(0, 12), play: 0, hold: 0, fps: 8, dir: 1 };
  }
  j.t -= dt;
  if (j.t <= 0) {
    // walk the list with an occasional skip: a fixed cycle of four beats is a
    // four-beat loop, which is the thing this exists to not be
    j.i = (j.i + (chance(0.28) ? 2 : 1)) % list.length;
    const b = list[j.i];
    j.t = rnd(b.t[0], b.t[1]);
    // what he decided to do and for how long — tests/folk.cjs reads the BEATS,
    // because a body holding one angle for eight seconds autocorrelates at 89%
    // by standing still, and standing still is not a loop
    j.beat = b.col + '@' + j.t.toFixed(1);
    j.beats = (j.beats || 0) + 1;
  }
  const want = list[j.i].col;
  // ease toward the beat's angle rather than snapping to it — the TURN is the
  // motion, and on a six-angle turntable it is most of the motion available
  const d = want - j.col;
  const step = NPC_TURN * dt;
  j.col += Math.abs(d) <= step ? d : Math.sign(d) * step;
  // ...and if this beat is WORK and this body has a strip, run it: the same
  // bursts, tempo and holds the tinker gets, because the reason his stopped
  // reading as a loop was the cadence and not the frame count
  j.work = !!(list[j.i].work && NPC_LOOP[s.extra]);
  if (j.work) {
    const W = NPC_WORK[s.extra] || NPC_WORK.servo;
    if (j.hold > 0) j.hold -= dt;
    else {
      if (j.play <= 0) {
        j.play = rnd(W.run[0], W.run[1]);
        j.fps = rnd(W.fps[0], W.fps[1]);
        j.dir = chance(0.3) ? -1 : 1;
      }
      const st = j.fps * dt;
      j.ph = (j.ph || 0) + st * j.dir;
      j.play -= st;
      if (j.play <= 0) j.hold = rnd(W.hold[0], W.hold[1]);
    }
  }
  return j.col;
}

// ---------------------------------------------------------------------------
// THE TASK, NOT THE LOOP (owner, 2026-08-22: "the loop where I see the NPC
// working is somewhat short... make it not repeat, doing something instead of
// actually naturally doing something").
//
// He was right and the number says why: twelve cells at a fixed 10 fps is a
// 1.2-SECOND CYCLE, played continuously, forever. Nothing about that is a
// craftsman — it is a spinning gear. And the fix is not more frames, because
// any fixed-rate cycle of any length eventually reads as a cycle; a 3-second
// loop is a loop you notice four seconds later instead of two.
//
// What stops reading as a loop is that a person at a bench is not performing a
// motion, they are DOING A JOB, and a job has shape:
//
//   SHAPE   he works the part — bursts of strokes, 2 to 5 at a time, then a
//           beat with the hammer up while he looks at what he did
//   CHECK   he folds over it and turns it in his hands (the work_2 plate, a
//           genuinely different silhouette, held — an ACT wants a held frame)
//   FIT     he offers it up to the rack — slower, fewer strokes, longer pauses
//   REJECT  it does not fit. He goes still. Then he runs hot, or he starts again
//
// ...and then he starts over, which is his whole character (§2t): he is building
// a replacement regulator out of salvage that does not fit, so the job is MEANT
// to fail and restart. The loop the player sees is the story.
//
// FIVE THINGS BREAK THE PERIOD, and they compound:
//   1. BURSTS, not a continuous cycle. The single loudest tell is a motion that
//      never stops; irregular pauses destroy the beat by themselves.
//   2. TEMPO PER BURST. 8-13 fps while shaping, 5-7 while fitting. The eye
//      reads cadence long before it reads pose, and a fixed rate is metronomic.
//   3. THE PHASE NEVER RESETS and each burst starts wherever the last one
//      stopped, so a given cell never lands on the same beat twice.
//   4. PING-PONG. Some bursts run the strip forward and back — a stroke and a
//      return — which also doubles what twelve cells can say.
//   5. THE ARC IS 14-26 SECONDS and re-rolled every time, and the tic and the
//      vent interrupt it on their own unrelated timers, so the compound period
//      is not a period at all.
//
// Measured rather than asserted: tests/tinker.cjs autocorrelates the sequence of
// frames he actually draws over half a minute and fails if any lag under five
// seconds is a strong match — the same test grammar.cjs runs on tile repeats.
const TINKER_JOB = {
  //        how long the stage runs   fps range    burst length, in cells
  shape:  { t: [4.5, 8.0],  fps: [8, 13], run: [14, 60], hold: [0.22, 0.70] },
  fit:    { t: [2.5, 4.5],  fps: [5, 7],  run: [8, 22],  hold: [0.45, 1.10] },
  check:  { t: [1.1, 2.1] },                       // a held plate, no strip
  reject: { t: [0.5, 1.0] },                       // one frozen cell
};
// the order is fixed because a JOB has an order — what varies is how long each
// stage lasts, how it is played, and whether the reject vents
const TINKER_NEXT = { shape: 'check', check: 'fit', fit: 'reject', reject: 'shape' };
function tinkerTask(r, dt) {
  const R = (a) => rnd(a[0], a[1]);
  r.jt -= dt;
  if (r.jt <= 0) {
    r.job = TINKER_NEXT[r.job] || 'shape';
    r.jt = R(TINKER_JOB[r.job].t);
    r.play = 0; r.hold = 0;                        // a new stage starts fresh
    // the reject is where he runs hot: half the time it goes straight into the
    // vent rather than waiting for the vent's own timer to come round
    if (r.job === 'reject' && chance(0.5)) r.vent = 0;
  }
  const J = TINKER_JOB[r.job];
  if (!J.fps) return;                              // check / reject hold a frame
  if (r.hold > 0) { r.hold -= dt; return; }        // frozen mid-stroke
  if (r.play <= 0) {                               // start a burst
    r.play = R(J.run);
    r.fps = R(J.fps);
    r.dir = chance(0.35) ? -1 : 1;                 // some strokes run back
  }
  const step = r.fps * dt;
  r.ph += step * r.dir;
  r.play -= step;
  if (r.play <= 0) r.hold = R(J.hold);             // ...and rest on this frame
}

// Returns true once it has drawn him — false means the plates are not here yet
// and the caller should fall through to the atlas, exactly as every other
// authored renderer in this file degrades.
function drawTinker(c, s, talking) {
  if (typeof isHero === 'function' && isHero()) return false;   // NOSTOS has its own trader
  const r = tinkerRig(s);
  const now = performance.now() / 1000;
  const dt = r.last ? Math.min(0.1, now - r.last) : 0;   // clamped: a tabbed-out
  r.last = now;                                          // page must not fire ten tics at once
  const inDen = npcKey(s) === 'A0B|ratchet';
  const near = player && Math.abs((player.x + player.w / 2) - (s.x + s.w / 2)) < 140;
  // he works while she is not standing over him. The moment she is close he
  // has looked up — which is what makes walking into the den feel like
  // interrupting somebody rather than approaching a shop fixture.
  const working = inDen && !talking && !near;
  r.t -= dt; r.tic -= dt;
  // the job's own clock, and it only runs while he is working: a task that
  // keeps advancing behind a tic comes back mid-stroke in the wrong stage
  if (working) tinkerTask(r, dt);
  if (working) r.vent -= dt;                             // he only cooks while he works
  const locked = r.pose === 'tic' || r.pose === 'vent';  // these two run to the end
  if (locked) {
    if (r.t <= 0) { r.pose = talking ? 'talk1' : (working ? 'work1' : 'notice'); r.t = TINKER_HOLD[r.pose]; }
  } else if (r.tic <= 0) {
    r.pose = 'tic'; r.t = TINKER_HOLD.tic; r.tic = rnd(5.5, 11);
  } else if (r.vent <= 0 && working) {
    r.pose = 'vent'; r.t = TINKER_HOLD.vent; r.vent = rnd(14, 24); r.blew = false;
  } else if (r.t <= 0) {
    if (talking) r.pose = (r.pose === 'talk1') ? 'talk2' : 'talk1';
    else if (working) r.pose = 'work1';   // the JOB decides what shows — see tinkerTask
    else r.pose = near ? 'notice' : 'talk1';             // at the booth, talk1 IS his standing idle
    r.t = TINKER_HOLD[r.pose];
  }
  // ONE SCALE FOR THE WHOLE SET (see drawSetPlate). work_1 is the reference:
  // it is sized to the room, and every other pose is registered to it by
  // silhouette area, so the crouch stays a crouch instead of being stretched
  // up to standing height and the tic does not grow an arm's worth of body.
  const bodyH = s.h * 2.6;                               // the owner's den ruling, unchanged
  const box = (typeof plateBox === 'function') && plateBox('ratchetWork1');
  const frameH = (box && box.h) ? bodyH / box.h : bodyH * 1.12;
  const cx = s.x + s.w / 2, base = s.y + s.h;
  // the plates were fired facing frame-right, which is the way he faces his
  // bench. Turning is therefore only for the talking poses.
  const face = working ? 1 : ((player && player.x + 12 < s.x) ? -1 : 1);
  // THE WORK BEATS ARE A LOOP, NOT TWO STILLS. work1 and work2 were two plates
  // held 1.15 s and 1.55 s — a cut every second and a bit, which is what the
  // owner read as a slide show. They are replaced by twelve frames of a clip of
  // this same body working, run at 10 fps off one clock so the phase does not
  // reset when the pose does. The other four beats keep their plates: the tic,
  // the vent, the notice and the talk are ACTS, and an act wants a held frame.
  //
  // Falls back to the stills whenever the strip has not landed, which is the
  // same deal every other sheet in this file has.
  let drew = false;
  if (working && (r.pose === 'work1' || r.pose === 'work2')) {
    // CHECK is the one stage that is a PLATE: he folds over the piece and turns
    // it, which is a different silhouette rather than a different frame of the
    // same swing, and an act wants a held frame (§3.3 is the same law).
    if (r.job === 'check') {
      drew = drawSetPlate(c, TINKER_PLATE.work2, cx, base, frameH, face < 0, 'ratchetWork1');
      if (drew) G.tinkerFrame = 'check';
    }
    if (!drew) {
      const cell = ((Math.floor(r.ph || 0) % 12) + 12) % 12;
      drew = drawStripCell(c, 'ratchetLoop', cell, 12, cx, base, s.h * 2.6, face < 0);
      // what he actually drew, for tests/tinker.cjs — "it does not repeat" is
      // only a claim if the frames it draws can be read from outside
      if (drew) G.tinkerFrame = r.job + ':' + cell;
    }
  }
  if (!drew) {
    drew = drawSetPlate(c, TINKER_PLATE[r.pose], cx, base, frameH, face < 0, 'ratchetWork1');
    if (drew) G.tinkerFrame = r.pose;
  }
  if (!drew) return false;
  // THE STACK, in the frame he was just drawn at: up over the far shoulder.
  // Measured off the plate rather than guessed — the rack tops out at about
  // 0.72 of the drawn height and sits a fifth of it behind his centre line.
  const vx = cx - face * frameH * 0.20, vy = base - frameH * 0.72;
  if (r.pose === 'vent' && !r.blew) {
    r.blew = true;
    for (let i = 0; i < 16; i++) {
      addPart(vx + rnd(-7, 7), vy + rnd(-5, 5), rnd(-45, 45) - face * 24, rnd(-80, -30),
              rnd(0.9, 1.8), 'rgba(152,154,164,0.55)', rnd(4, 8), -20);
    }
    if (typeof sfx === 'function') sfx('vent');
  } else if (working && chance(0.10)) {
    // the idle curl: one wisp every few frames, so the rack is never quite
    // still even in the frames where his body is
    addPart(vx + rnd(-3, 3), vy, rnd(-9, 9) - face * 7, rnd(-27, -14),
            1.5, 'rgba(142,144,154,0.38)', rnd(3, 5), -13);
  }
  return true;
}
// ONE ENGINE, TWO WORLDS. The cells are a CLAWBYTE story — machines that were
// switched off when the broadcast went out. NOSTOS's people are people; they
// are not waiting for a battery, and gating a Greek elder behind one would be
// the theme bleed this codebase has had to fix twice already.
// HEALING IS EARNED, NOT INNATE (owner's design): Ratchet's first gift for
// the battery. NOSTOS's hero keeps it from the start — people are people.
function healUnlocked() {
  if (typeof isHero === 'function' && isHero()) return true;
  return !!(G.save && G.save.flags && G.save.flags.heal);
}
function npcLive(s) {
  if (typeof isHero === 'function' && isHero()) return true;
  return !!G.save.flags['on_' + npcKey(s)];
}
function npcCharge(s) {
  G.save.flags['on_' + npcKey(s)] = 1;
  persist();
  const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
  sfx('powerUp'); sfx('chargeReady');
  G.flash = Math.max(G.flash || 0, 0.22);
  cam.shake = Math.max(cam.shake, 5);
  if (typeof padRumble === 'function') padRumble(0.6, 0.5, 260);
  burst(cx, cy, 26, '#ffd76a', 260, 0.7, 60, 3, true);
  burst(cx, cy, 14, '#ffffff', 150, 0.5, -40, 2, true);
  if (typeof roarWave === 'function') roarWave(cx, s.y + s.h, '#ffd76a');
}
// evolution fanfare: when a power milestone pushes the tier up, the character
// visibly grows and gains gear (drawn in entities.js) — announce it
function checkEvo() {
  const tv = evoTier();
  if (G.save.evo == null) { G.save.evo = tv; return; } // old saves: adopt silently
  if (tv > G.save.evo) {
    G.save.evo = tv;
    sfx('chargeReady');
    G.flash = Math.max(G.flash, 0.35);
    G.impact = { t: 0.22, t0: 0.22, x: player.x + player.w / 2, y: player.y + player.h / 2 };
    burst(player.x + player.w / 2, player.y + player.h / 2, 30, '#ffd76a', 280, 0.8, 40, 3, true);
    burst(player.x + player.w / 2, player.y + player.h / 2, 18, '#ffffff', 160, 0.6, -60, 2, true);
    showItem(t('evo' + tv), t('evo' + tv + 'd'));
  }
}
// THE GEAR HAS A PICTURE OF ITSELF. Two cold plates were fired for the hardware
// that explains her movement — jetpack.png for the double jump, boots_idle.png
// for the dash — and both were keyed in media.js and drawn by NOTHING. They are
// not rig parts: they are the object, square-on, lit, with no exhaust and no
// motion. There is exactly one moment in the game that wants that picture, and
// it is the moment she is HANDED the thing. Until now that moment was a line of
// text. (bootsFire is the other half and is already worn — drawThrustBoots
// aligns it to the dash vector; this is its portrait, not its rig.)
const MOD_ART = { djump: 'jetpack', dash: 'bootsIdle' };
// The powered-down look, as ONE named string. It is a constant rather than a
// literal at the draw site because tests/battery.cjs measures it: this exact
// filter has now been got wrong twice, and a test that repeats the string in
// its own source would keep passing while the game changed underneath it.
const NPC_DARK_FILTER = 'grayscale(0.8) brightness(0.8) contrast(1.25)';
function grantMod(id) {
  G.save.abil[id] = 1;
  if (MOD_ART[id] && typeof mediaFetch === 'function') mediaFetch(MOD_ART[id], 1);
  showItem(t('m_' + id), t('m_' + id + 'd'), MOD_ART[id]);
  lessonStart(id);                                  // and then teach it
}
function grantCrest(id) {
  if (G.save.crests.indexOf(id) < 0) G.save.crests.push(id);
  showItem(t('c_' + id), t('c_' + id + 'd'));
}
function showItem(name, desc, art) {
  sfx('win');
  G.dialog = { name: t('got'), lines: [name + ' — ' + desc], i: 0, onEnd: null, art: art || null };
  G.state = 'DIALOG';
  persist();
}

// ---------- room loading ----------
function spawnStatic(type, tx, ty, extra, flagKey) {
  // npc was 32x40 — a head shorter than the player's own 60px plate, and the
  // owner's read of the first one he ever met was "very small, easy to miss".
  // The machine folk stand at her scale now.
  const sizes = { item: [26, 26], bench: [44, 52], chest: [30, 24], mod: [24, 24], term: [26, 32], npc: [40, 56], riddle: [26, 36], secret: [24, 24], trial: [34, 44], vault: [40, 52], pillar: [46, 96] };
  const [w, h] = sizes[type];
  // `room` is stamped at spawn rather than read from G.roomId at use time,
  // because npcKey() must stay stable for a static that outlives a room change
  // (the pet follows, the reward queue drains a room late) — and because a key
  // that depends on when you ask it is not a key.
  G.statics.push({ type, room: G.roomId, x: tx * TILE + (TILE - w) / 2, y: ty * TILE - h, w, h, extra, flagKey, opened: !!(flagKey && G.save.flags[flagKey]), t: rnd(0, 9) });
}
function loadRoom(id) {
  if (G.boss && G.boss.dead && G.boss.rewardPend) {
    G.boss.rewardPend = false; G.onBossDead(G.boss.kind);
  }
  if (typeof npcVoxStopAll === 'function') npcVoxStopAll();   // voices stay in their rooms
  G.roomId = id; G.roomDef = ROOMS[id]; G.grid = buildRoom(id);
  surfCurve = null; surfRoom = null;   // the surface curve belongs to the room
  // re-aim the prefetcher: the art for the rooms she can now REACH
  if (typeof preloadRoom === 'function') { try { preloadRoom(id); } catch (e) {} }
  G.enemies = []; G.projs = []; G.pickups = []; G.statics = []; G.boss = null;
  G.boomer = null;   // a thrown blade never crosses a room line — it is back in her paw
  G.wrecks = []; G.recharge = null; G.plats = []; G.saws = []; G.pools = []; G.x1Bridge = false; G.x1T = 0;
  ceilReset();                       // the roof of the last room does not follow you
  fringeMark();                      // and neither does what grew on its edges
  // a scripted finishing blow belongs to the room it was swung in; carrying one
  // across a door would leave her driven by a boss that no longer exists
  G.finish = null; G.offer = null; G.forkBoss = null;
  // stream the room's guardian the moment the room exists, so its body is ready
  // long before it stirs — the silhouette is a safety net, not a plan
  setTimeout(() => {
    if (G.boss && typeof BOSS_ART !== 'undefined' && BOSS_ART[G.boss.kind]
        && typeof mediaFetch === 'function') mediaFetch(BOSS_ART[G.boss.kind]);
  }, 0);
  parts.length = 0;
  const def = ROOMS[id];
  def.ents.forEach((d, i) => {
    const [kind, tx, ty, extra, cond] = d;
    if (cond && !G.save.flags[cond]) return;
    if (EKIND[kind]) {
      const k = EKIND[kind];
      // THE BRAID decides who is even here. A kingdom you have cured wakes fewer
      // machines and wakes some of them calm; a HOLLOW world barely wakes at all.
      const U = typeof universe === 'function' ? universe() : null;
      if (U) {
        const zi = U.inf[def.zone] != null ? U.inf[def.zone] : 1;
        // Infection feeds the population, but only somewhat — a cured kingdom
        // should read as PEACEFUL, not as empty. Most of what survives mercy is
        // still there; it has simply stopped wanting to kill her.
        const keep = clamp((0.66 + zi * 0.34) * U.foeK, 0.2, 1.6);
        // a SAGE is never culled by the Braid — it is a story, not population
        if (kind !== 'sage' && keep < 1 && ((i * 2654435761) % 1000) / 1000 > keep) return;
      }
      const en = new Enemy(kind, tx * TILE + (TILE - k.w) / 2, ty * TILE - k.h);
      // a purified sage STAYS purified: the tame is a save fact, re-applied
      // at spawn, so leaving the chamber never re-infects it
      if (kind === 'sage' && G.save.flags['sageTame_' + id]) { en.tame = 1; en.calm = true; en.pureM = 1; }
      if (U) {
        const zi = U.inf[def.zone] != null ? U.inf[def.zone] : 1;
        en.spd *= U.spdK * (0.82 + zi * 0.32);
        // CURED GROUND. Below a quarter infection the machines start coming back
        // to themselves: they wake calm, wander, and will not hurt her. This is
        // the reward for mercy that the player can actually see.
        const calmC = clamp((0.28 - zi) * 2.4 + U.calmK, 0, 0.9);
        if (calmC > 0 && ((i * 40503 + 17) % 1000) / 1000 < calmC) { en.calm = true; en.hypnoT = 1e9; }
      }
      G.enemies.push(en);
    } else if (kind === 'scrap') {
      const fk = 'sc_' + id + '_' + i;
      if (!G.save.flags[fk]) {
        const uL = typeof universe === 'function' ? universe().lootK : 1;
        const s = new Scrap(tx * TILE + 10, ty * TILE - 20, Math.round((extra || 10) * uL));
        s.vx = 0; s.vy = 0; s.flagKey = fk;
        G.pickups.push(s);
      }
    } else if (kind === 'plat') {
      G.plats.push(new MovingPlat(tx, ty, extra));
    } else if (kind === 'saw') {
      // the same call the rail grinders make: the hero's world runs on stone
      // and rope, and a powered blade on a rail does not belong in it
      if (!(typeof isHero === 'function' && isHero())) G.saws.push(new SawRig(tx, ty, extra));
    } else if (kind === 'boss') {
      if (!G.save.flags['boss' + extra.charAt(0).toUpperCase() + extra.slice(1)])
        G.boss = new Boss(extra, tx * TILE, ty * TILE);
    } else if (kind === 'chest') {
      spawnStatic('chest', tx, ty, extra, 'ch_' + id + '_' + i);
    } else if (kind === 'mod') {
      if (!G.save.abil[extra]) spawnStatic('mod', tx, ty, extra);
    } else if (kind === 'item') {
      // an errand's object. It exists in exactly one place in the world, and
      // once it is in the bag it does not come back.
      if (!(G.save.bag && G.save.bag[extra])) spawnStatic('item', tx, ty, extra, null);
    } else if (kind === 'riddle') {
      spawnStatic('riddle', tx, ty, extra, nodeKey(extra));
    } else if (kind === 'secret') {
      if (!G.save.flags['sr_' + extra]) spawnStatic('secret', tx, ty, extra);
    } else if (kind === 'pillar') {
      // the crystal pillar is quarried once per save — the shard in the bag
      // IS the pillar now, and a pillar that regrew would un-tell the story
      if (!G.save.flags['pl_' + (extra || 'cshard')]) spawnStatic('pillar', tx, ty, extra || 'cshard');
    } else {
      spawnStatic(kind, tx, ty, extra, kind === 'term' ? null : null);
    }
  });
  // the freed guardians stay home: every purified boss lives on in its
  // old arena as her pet, forever
  const PET_HOMES = { A4: ['glitch', 20], B4: ['brood', 15], C3: ['atlas', 15], D3: ['zero', 15], X1: ['prism', 20],
                      A10: ['alpha', 20] };
  const ph2 = PET_HOMES[id];
  if (ph2 && G.save.flags['boss' + ph2[0].charAt(0).toUpperCase() + ph2[0].slice(1)] && !G.boss
      && !(G.save.flags.killed && G.save.flags.killed[ph2[0]])) {
    const pb = new Boss(ph2[0], ph2[1] * TILE, 15 * TILE);
    pb.dead = true; pb.purified = true; pb.pureT = 5;
    pb.deathFxT = 0; pb.deathFinale = true; pb.rewardPend = false; pb.hp = 0;
    pb.st = ph2[0] === 'brood' ? 'restlow' : ph2[0] === 'prism' ? 'dorm' : 'idle';
    if (ph2[0] === 'brood') pb.y = 15 * TILE - pb.h + 4;
    G.boss = pb;
  }
  if (G.save.pouch && G.save.pouch.room === id) {
    const p = new Pouch(G.save.pouch.x, G.save.pouch.y, G.save.pouch.amount);
    G.pickups.push(p);
  }
  // THE GRINDERS. Every horizontal run of hazard rail long enough to patrol
  // gets a wheel. The Foundry is the exception: down there the hazard is not a
  // machine at all, it is the melt, and nothing rolls on it.
  // NOT cleared here: the list already holds any rig this room placed by hand,
  // and clearing it after the entity pass is what silently deleted them.
  if (typeof SawWheel === 'function' && def.zone !== 'C' && !(typeof isHero === 'function' && isHero())) {
    const gg = G.grid;
    for (let ty = 0; ty < gg.length; ty++) {
      let run = -1;
      for (let tx = 0; tx <= gg[0].length; tx++) {
        const isH = tx < gg[0].length && tileAt(tx, ty) === '^';
        if (isH && run < 0) run = tx;
        else if (!isH && run >= 0) {
          if (tx - run >= 3) G.saws.push(new SawWheel(run * TILE, tx * TILE, ty));
          run = -1;
        }
      }
    }
  }
  if (typeof purifyPreloadNear === 'function') purifyPreloadNear(id);
  // the kingdom's own flora, fetched on arrival rather than at boot — twelve
  // plates nobody in zone A will ever look at is twelve plates a phone should
  // not be downloading to get to the first room
  if (typeof floraPreload === 'function') floraPreload(ROOMS[id] && ROOMS[id].zone);
  if (typeof beastPreload === 'function') beastPreload(ROOMS[id] && ROOMS[id].zone);
  // the machine lets go of her the first time she stands in the room it kept
  // her in, and never again
  if (id === 'W1' && typeof wakeStart === 'function') wakeStart();
  if (player) player.oathUsed = false;      // the lion owes her once per room
  G.save.visited[id] = 1;
  rubbleInit();          // the buried mouth, if this room has one
  tileDirty = true;
  // ---- WALKING INTO A GUARDIAN'S CHAMBER --------------------------------
  // It used to be a doorway like any other: full brightness, the kingdom's
  // theme still playing, and a boss-sized shape asleep in the corner. The room
  // is held DARK for a beat and brought up — she is standing in a chamber where
  // something has been sleeping, and the light finds it — while the theme
  // cross-fades underneath. Her controls are hers again the moment the lights
  // are up; the hold is short enough to read as staging, not as a cutscene.
  G.bossEntry = null;
  if (G.boss && !G.boss.dead && G.boss.st === 'dorm') {
    G.bossEntry = { t: 0, dur: 2.3 };
    setMusic('boss_' + G.boss.kind);
  } else {
    setMusic(def.zone);
  }
  if (def.zone !== G.lastZone) { G.zoneToast = { text: t('z_' + def.zone), t: 2.6 }; G.lastZone = def.zone; }
  cam.x = 0; cam.y = 0;
  persist();
}
// ---------------------------------------------------------------------------
// WHAT THE POINTS ARE FOR. IQ is earned in the Trials and spent on skills, and
// nothing in the game ever said so — a player could finish every trial, watch a
// number climb, and never learn it buys anything. The moment they can actually
// afford something, they are told once, by name: what is affordable, and which
// button opens the place to spend it. Once per skill, so it is a nudge and not
// a nag.
// ---------------------------------------------------------------------------
// The cheapest thing she could learn RIGHT NOW, or null. One answer, read by
// the one-off toast and by the standing HUD prompt, so the two can never
// disagree about whether there is anything to spend on.
function skillAffordable() {
  if (!G.save || typeof SKILLS === 'undefined') return null;
  const own = G.save.skills || [];
  const unlocked = own.length;
  let best = null;
  for (const sk of skillPool()) {
    if (own.indexOf(sk.id) >= 0) continue;
    if (typeof tierOpen === 'function' && !tierOpen(sk.tier, unlocked)) continue;
    if ((G.save.iq || 0) < sk.cost) continue;
    if (!best || sk.cost < best.cost) best = sk;
  }
  return best;
}
// The cheapest thing she is SAVING for — reachable in the tree, not yet
// affordable. The standing prompt shows its price, so the counter has a target
// instead of being a number that goes up.
function skillNext() {
  if (!G.save || typeof SKILLS === 'undefined') return null;
  const own = G.save.skills || [], unlocked = own.length;
  let best = null;
  for (const sk of skillPool()) {
    if (own.indexOf(sk.id) >= 0) continue;
    if (typeof tierOpen === 'function' && !tierOpen(sk.tier, unlocked)) continue;
    if (!best || sk.cost < best.cost) best = sk;
  }
  return best;
}
function iqNudge() {
  const best = skillAffordable();
  if (!best) return;
  G.save.iqTold = G.save.iqTold || {};
  if (G.save.iqTold[best.id]) return;
  G.save.iqTold[best.id] = 1;
  // "open SKILLS" is not an instruction, it is a noun. Say the button AND the
  // door — the bare key on its own was the reported failure.
  G.toast(t('tt_iq_ready').replace('%s', howToOpenNamed('SKILL', t('pm_skills')))
    + ': ' + t('sk_' + best.id));
  sfx('chargeReady');
}
function applyTheme() {
  PAL = (typeof THEMES !== 'undefined' && THEMES[themeId()].pal) || PAL_ROBO;
  for (const k in miniCache) delete miniCache[k];
  for (const k in bgTintCache) delete bgTintCache[k];
  for (const k in silCache) delete silCache[k];
  tileDirty = true;
}
function startGame(save) {
  save.iq = save.iq || 0; save.skills = save.skills || []; save.relics = save.relics || [];
  G.save = save;
  if (typeof qualRestore === 'function') qualRestore();  // the player's own call outranks the guess
  applyTheme();
  loadRoom(save.bench.room);
  player = new Player(save.bench.x, save.bench.y);
  player.cores = player.maxCores(); player.volts = 33;
  updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
  // No card, no crawl. The film has just told this story; repeating it in text
  // is asking the player to read the thing they were watching a second ago.
  G.state = 'PLAY';
}
function respawn() {
  if (G.save.diff === 2 && G.save.lives >= 9) { G.state = 'GAMEOVER'; return; }
  loadRoom(G.save.bench.room);
  player = new Player(G.save.bench.x, G.save.bench.y);
  player.cores = player.maxCores(); player.volts = 33;
  updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
  // SHE COMES BACK SAD, and only if she actually lost something. Waking at the
  // bench with your scrap lying somewhere else in the world is the one moment
  // the game is unkind to her, so it is the one moment her eyes are — for two
  // seconds, then she is herself again. Without the pouch test she would mope
  // after a death that cost her nothing, which is sulking, not grief.
  if (G.save.pouch && player.moodSet) player.moodSet('sad', 2.0);
  if (G.save.pouch) G.toast(t('pouch') + '  (' + t('z_' + ROOMS[G.save.pouch.room].zone) + ')');
  G.state = 'PLAY';
}
function bossActive() { return G.boss && !G.boss.dead && G.boss.st !== 'dorm'; }

// ===========================================================================
// THE DEMO BOUNDARY — where the free version stops, and says so properly.
//
// THE SHAPE OF THE DECISION. The free web build is the shop window: it opens
// on any phone from any maker with no download and no account, which is the one
// distribution advantage this game has and the app stores cannot match. What it
// is NOT is the place anyone can be charged. So the free version ends, and the
// end has to feel like a chapter closing rather than the game breaking.
//
// WHERE IT ENDS is derived, never listed. Any exit that leaves DEMO_ZONE is the
// boundary — which today is exactly one door, A3 going up into B1, and which
// stays correct if the world is ever re-plumbed. A hard-coded room id would be
// a second copy of the map that somebody has to remember to update.
//
// The player gets the whole first kingdom to that point: waking in the cradle,
// the walk to the gates, the first machine folk, the purifier, the Alpha and
// its pack, and NULLFANG. Two boss fights and an ending, which is what makes
// this a chapter and not a wall. Stopping mid-corridor would read as a fault.
//
// ONE BUILD STILL, and that is deliberate (RULE ONE). This is not a demo BUILD;
// it is the same file everywhere, deciding at run time. A packaged app — the
// Steam shell, the phone app — is by definition the bought copy and is never
// the demo. The web page is, until a save says otherwise.
//
// `G.save.full` is the hook the Steam link will hang off later: whatever proves
// a purchase eventually sets that flag and the same page becomes the whole
// game. Nothing here needs to change when it does.
//
// AND IT IS OFF UNTIL THE OWNER SWITCHES IT ON. Flipping DEMO_OFFER to true is
// a product decision with a store page behind it, not a code change, so the
// default cannot be the one that quietly truncates a game that is already live.
const DEMO_ZONE = 'A';
const DEMO_OFFER = false;
// Where the full game is sold. Empty until there is a page to point at — the
// screen then says the game continues without offering a link that 404s.
const DEMO_URL = '';
function demoOn() {
  if (!DEMO_OFFER) return false;
  const packaged = (typeof window !== 'undefined') &&
    (!!window.Capacitor || location.protocol === 'file:' || location.protocol === 'capacitor:');
  if (packaged) return false;
  if (G.save && G.save.full) return false;
  return true;
}
// Does stepping through this door leave the free chapter?
function demoWall(destId) {
  if (!demoOn()) return false;
  const a = ROOMS[G.roomId], b = ROOMS[destId];
  return !!(a && b && a.zone === DEMO_ZONE && b.zone !== DEMO_ZONE);
}
// She is standing in the doorway when this fires, which means she is OUTSIDE
// the room bounds — put her back inside first or the moment the screen closes
// the same door fires again and she is stuck in a loop of her own ending.
function demoStop(side) {
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  if (side === 'T') { player.y = 6; player.vy = 90; }
  else if (side === 'B') { player.y = H - player.h - 8; player.vy = 0; }
  else if (side === 'L') { player.x = 8; player.vx = 40; }
  else { player.x = W - player.w - 8; player.vx = -40; }
  player.lastSafe = { x: player.x, y: player.y };
  G.state = 'MORE'; G.moreIdx = 0;
  sfx('ui');
}
// ONE GEOMETRY, used by the drawing AND by touch. Written out separately they
// drift, and a screen whose buttons are somewhere other than where they are
// painted is the exact failure tests/tap.cjs exists for.
function moreLayout() {
  const rows = [DEMO_URL ? 'demo_get' : 'demo_soon', 'demo_stay'];
  return { rows, y0: 372, step: 54, w: 420, h: 44 };
}

// ---------- transitions ----------
function checkTransitions() {
  if (G.trans) return;
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  const ex = G.roomDef.exits || {};
  // The out-of-bounds rescue has to run even mid-boss. It used to sit behind an
  // early `if (bossActive()) return`, so falling into an arena pit during a boss
  // fight dropped you out of the world with nothing to catch you — no floor, no
  // reset, no death. That is the softlock.
  const inBoss = bossActive();
  if (player.y > H + 40 && (inBoss || !ex.B)) {
    player.hurt(1, player.x);
    player.x = player.lastSafe.x; player.y = player.lastSafe.y;
    player.vx = 0; player.vy = 0;
    return;
  }
  if (inBoss) {
    // and keep you inside the arena while it lives, or you can walk off the edge
    // into the same void sideways
    player.x = clamp(player.x, 2, W - player.w - 2);
    if (player.y + player.h < -200) { player.y = 0; player.vy = 0; }
    return;
  }
  let side = null;
  if (player.x + player.w < -2 && ex.L) side = 'L';
  else if (player.x > W + 2 && ex.R) side = 'R';
  else if (player.y + player.h < -2 && ex.T) side = 'T';
  else if (player.y > H + 40 && ex.B) side = 'B';
  if (!side) {
    player.x = clamp(player.x, ex.L ? -60 : 2, ex.R ? W + 60 : W - player.w - 2);
    if (player.y > H + 40 && !ex.B) { player.hurt(1, player.x); player.x = player.lastSafe.x; player.y = player.lastSafe.y; player.vy = 0; }
    return;
  }
  let dest = ex[side];
  if (typeof dest === 'object') {
    if (!G.save.flags[dest.flag]) return;
    dest = dest.to;
  }
  if (demoWall(dest)) { demoStop(side); return; }
  G.trans = { t: 0.28, to: dest, side, half: false };
}
function applyTransition() {
  const tr = G.trans, from = { x: player.x, y: player.y, vx: player.vx, vy: player.vy };
  loadRoom(tr.to);
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  if (tr.side === 'L') { player.x = W - player.w - 10; player.y = from.y; }
  else if (tr.side === 'R') { player.x = 10; player.y = from.y; }
  else if (tr.side === 'T') { player.x = clamp(from.x, 40, W - 60); player.y = H - player.h - 6; player.vy = Math.min(from.vy, -620); }
  else { player.x = clamp(from.x, 40, W - 60); player.y = 4; player.vy = Math.max(from.vy, 80); }
  player.vx = from.vx; player.lastSafe = { x: player.x, y: player.y };
  // THE CACHE MOUTH: she climbs up through the opening, and the hardlight
  // bridge closes beneath her the instant she is through — so the way in is
  // never a pit that spits her straight back down the shaft she came up.
  if (G.roomId === 'X1' && tr.side === 'T' && G.boss && !G.boss.dead) {
    G.x1Bridge = true;
    player.y = 15 * TILE - player.h; player.vy = 0;
    player.lastSafe = { x: player.x, y: player.y };
    sfx('cast'); cam.shake = Math.max(cam.shake, 3);
    for (let i = 0; i < 12; i++)
      addPart(6 * TILE + rnd(0, 3 * TILE), 15 * TILE + rnd(-3, 3),
        rnd(-50, 50), rnd(-60, 20), 0.5, '#37ffd0', 2.4, 200, true);
  }
  updateCam(player.x, player.y, W, H, 1);
}

// ---------- interaction ----------
function findNear() {
  if (!player || player.dead) return null;
  let best = null, bestD = 1e9;
  for (const s of G.statics) {
    if ((s.type === 'chest' || s.type === 'riddle') && s.opened) continue;
    const dx = (player.x + player.w / 2) - (s.x + s.w / 2);
    const dy = (player.y + player.h / 2) - (s.y + s.h / 2);
    if (Math.abs(dx) < 46 && Math.abs(dy) < 60) {
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = s; }
    }
  }
  return best;
}
// ---------------------------------------------------------------------------
// HOW THE WORLD SEES HER, AND WHETHER IT SAYS SO.
//
// The machinery for an underdog run was almost all here — a chassis that
// evolves, a tree, a Braid that remembers, guardians that can be spared — and
// one thing was missing that no mechanic can supply: nobody's opinion of her
// ever changed. Servo called her "little frame" in the first hour and called
// her "little frame" in the fifth, after she had put five guardians on their
// knees. Growth you can measure is a number; growth somebody REMARKS ON is a
// story, and it costs eighteen strings.
//
// Three tiers, because the shift has to be legible: nobody / one or two / most
// of them. And the line has to be SPECIFIC, never flattering — "you are still
// alive" carries the arc, "you are amazing" kills it.
function guardiansFelled() {
  const f = (G.save && G.save.flags) || {};
  return ['Glitch', 'Brood', 'Atlas', 'Zero', 'Prism', 'Mother']
    .filter(b => f['boss' + b]).length;
}
function standingTier() { const n = guardiansFelled(); return n >= 3 ? 2 : n >= 1 ? 1 : 0; }
// WHAT EACH ONE REPAYS THE CELL WITH, by placement. Keyed on room|subject for
// the reason npcKey exists: the trader on the waking floor and the trader at
// the camp are two meetings, and only the second one opens a shop.
const NPC_GIFT = {
  // the first unit she ever wakes, on the waking floor: a repair kit. The
  // crystal is NOT handed over any more — the owner's story is that Ratchet
  // FORGES it, and forging needs raw crystal she has to quarry herself (the
  // ratchet_forge errand in quests.js; forgeCrystal below is the payoff).
  // What Ratchet gives on waking is the practical thing and his story: he
  // survived the corrupted song because the small crystal on his chest burned
  // it out of him — too small, so it faded, and he pulled his own plug before
  // the song could creep back. Her cell is what woke him. All of that is the
  // errand's ASK text, delivered in dialogue where lore belongs.
  // THE FIRST WAKING PAYS TWICE (owner's design): the repair kit, and the
  // HEAL PROTOCOL itself — healing is not a button she was born with, it is
  // Ratchet's first gift for the battery, with his pod lesson around it.
  'A0B|ratchet': () => {
    invAdd('kit');
    if (G.save && G.save.flags) { G.save.flags.heal = 1; persist(); }
    showItem(t('i_heal'), t('i_heald'));
  },
  // and the trader at the camp by NULLFANG's door — this is the shop, and it
  // does not exist until the lion's cell has paid for it
  'A3|ratchet': () => { G.toast(t('npc_shop_open')); },
  'A1|servo':  () => { invAdd('kit'); showItem(t('i_kit'), t('i_kitd')); },
  '*': () => { G.save.scrap += 25; G.toast(t('npc_thanks_scrap')); },
};
// THE FORGING — the payoff of the game's first quest. She brings the pillar
// shard back to Ratchet; he makes the PURIFIER out of it. The cartoonish
// forging cinematic is queued in ART_QUEUE (§1d, Higgsfield); this function
// is its code hook — when the film asset lands it plays from here, and until
// then the moment is the flash, the sting and the card. The grant itself
// never waits on the art.
function forgeCrystal() {
  G.save.flags.crystal = 1;
  persist();
  sfx('chargeReady');
  G.flash = Math.max(G.flash, 0.6);
  if (typeof cam !== 'undefined') cam.shake = Math.max(cam.shake, 6);
  if (player) {
    burst(player.x + player.w / 2, player.y + player.h / 2, 30, '#ffffff', 320, 0.9, 60, 3, true);
    burst(player.x + player.w / 2, player.y + player.h / 2, 16, '#bfe9ff', 240, 1.1, 20, 2.6, true);
  }
  // THE FORGING CINEMATIC — §1d, fired by the sister session against the
  // canon element. It plays through the purify-cut player; the card is the
  // fallback when the clip cannot run, so the grant never waits on a codec.
  if (PURIFY_VID.gift) {
    purifyPreload('gift');
    if (startPurifyCut('gift')) return;
  }
  showItem(t('i_crystal'), t('i_crystald'));
}
function doInteract(s) {
  if (s.type === 'npc') {
    // THEY WANT SOMETHING NOW. Talking twice used to give you the same three
    // lines forever; a character who cannot ask you for anything is scenery
    // with a mouth. The errand comes first when there is one, and what they
    // say depends on whether you have done it yet.
    // ---- DARK, AND WHY -------------------------------------------------
    // Nothing here works until it has been charged. A dark unit has no quest,
    // no shop and no trial: it is a body standing in a room. That is the whole
    // point of the arc — the world is full of people who are not gone, just
    // switched off, and you are the one carrying the cells.
    if (!npcLive(s)) {
      const key = npcKey(s);
      // THE NOTE (owner, 2026-08-16). Ratchet is not like the other dark
      // units: nothing drained him and nothing infected him. He pulled his
      // OWN cell when the broadcast took the city — the one sane move left —
      // and he left a note on his chest for whoever came after. So in the
      // den she does not stare at a silent body wondering; she READS, and
      // the note itself is the ask: put the cell back when it is safe. (It
      // even tells her where he hid it — the chest across the room.)
      const note = key === 'A0B|ratchet'
        ? [t('sl_note1'), t('sl_note2'), t('sl_note3')] : null;
      if (invCount('batt') <= 0) {
        // no cell: it says nothing, because it cannot. The line is HERS —
        // unless there is a note, in which case the note speaks for him.
        G.dialog = {
          name: t('n_' + s.extra),
          lines: note ? note.concat([t('npc_need')]) : [t('npc_dark'), t('npc_need')],
          i: 0, npc: s.extra, onEnd: null,
        };
        G.state = 'DIALOG'; sfx('ui');
        return;
      }
      G.dialog = {
        name: t('n_' + s.extra),
        lines: note ? note.concat([t('npc_give')]) : [t('npc_dark'), t('npc_give')],
        i: 0, npc: s.extra,
        onEnd: () => {
          if (!invTake('batt')) return;
          npcCharge(s);
          G.toast(t('npc_woke').replace('%s', t('n_' + s.extra)));
          // WHAT IT GIVES BACK. Every unit repays the cell, because a hand-off
          // that buys nothing is a fetch quest wearing a story. The first one
          // she ever wakes gives her a repair kit — the thing she needs most,
          // from the person who needed her most, which is the whole game in
          // one exchange.
          const gift = NPC_GIFT[key] || NPC_GIFT['*'];
          if (gift) gift();
          // THE STORY RIDES THE WAKING. A unit that just came back has the
          // most to say of its whole life, and making the player guess to
          // press E a second time is how the first story beat got missed
          // ("it doesn't have a story"). When the gift card closes, the
          // conversation reopens itself — straight into the errand ask,
          // which for Ratchet IS the backstory: the song, the chest
          // crystal, the sword he can forge.
          //
          // ...and in the DEN, the waking teaches the two survival systems
          // first (owner's design): the pod in the corner — how saving and
          // recharging work — and the heal protocol he just handed over,
          // including that the volt ring starts empty. THEN the errand talk.
          if (G.dialog && !G.dialog.onEnd) {
            if (key === 'A0B|ratchet') {
              G.dialog.onEnd = () => {
                const lesson = () => {
                  G.dialog = {
                    name: t('n_' + s.extra),
                    lines: [t('sl_pod_lesson'), t('sl_heal_gift'), t('sl_heal_how')],
                    i: 0, npc: s.extra,
                    onEnd: () => doInteract(s),
                  };
                  G.state = 'DIALOG'; sfx('ui'); npcSay(s.extra, 0);
                };
                // THE MEMORY (owner): the first thing he does with his cell
                // back in is TELL — the fired film of the city falling and
                // the necklace that saved him. When the clip is not on disk
                // yet the wake flows straight on to the lessons.
                if (PURIFY_VID.memory) {
                  purifyPreload('memory');
                  if (startPurifyCut('memory')) { G.cutEnd = lesson; return; }
                }
                lesson();
              };
            } else G.dialog.onEnd = () => doInteract(s);
          }
        },
      };
      G.state = 'DIALOG'; sfx('ui'); npcSay(s.extra, 0);
      return;
    }
    const q = typeof questFor === 'function' ? questFor(s.extra) : null;
    let lines = t('d_' + s.extra).slice();
    // WHAT THIS PERSON IS FOR. The trader trades; the Oracle opens the Trials.
    // That is their job and an errand does not replace it — which is exactly
    // what the errand system did when it landed: the moment the trader had a
    // job outstanding, `after` was overwritten and talking to him did NOTHING,
    // forever, until you finished it. He stopped being a shop because he had
    // asked you for a favour. Worse in the tutorial, where the trader IS the
    // shop lesson and his errand hid it.
    const base = s.extra === 'ratchet' ? () => { G.state = 'SHOP'; G.shopIdx = 0; }
      : s.extra === 'mono' ? () => trialOpen() : null;
    let after = base;
    if (q) {
      const st = qState(q.id);
      let qAct = null;
      if (st === 'none') {
        // AN ASK MAY BE SEVERAL SHORT BEATS. It used to be one string, so the
        // only way to tell a story here was to write a paragraph into a speech
        // bubble — and the owner read one: 'npc words are long and repeated'.
        // concat takes either, so a line stays a line and a story is a list.
        lines = [].concat(t('q_ask_' + q.id) || t('q_ask'), qText(q));
        qAct = () => { qSet(q.id, 'active'); G.toast(t('q_taken')); sfx('ok'); };
      } else if (qDone(q)) {
        lines = [t('q_thanks_' + q.id) || t('q_thanks')];
        qAct = () => questPay(q);
      } else {
        lines = [qText(q), t('q_wait')];
      }
      after = () => {
        if (qAct) qAct();
        // ...and then they go back to being themselves. Guarded on the state
        // still being PLAY, because a hand-in can hand over a relic, and that
        // opens a card the shop must not slam shut.
        if (base && G.state === 'PLAY') base();
      };
    }
    // ...and the first thing out of their mouth is what they make of her NOW.
    // AFTER the errand branch, not before it: an NPC with a job outstanding
    // replaces `lines` wholesale, so a greeting written above it is thrown away
    // — which is every conversation in zone A, where all six have errands.
    // It leads rather than trails, because it is the line the greeting used to
    // be, and because a player who skips the rest still hears it.
    {
      // THE KINGDOM'S OWN MILESTONES OUTRANK THE WAR'S. The tier lines count
      // fallen guardians — the whole game's arc — but the trader's opinion of
      // her should move on HIS arc first: the sword he forged, and what it
      // did in the deep chamber under this kingdom. Two overrides, in story
      // order, both specific per the standing-line law (what changed, never
      // how great she is): the forge line points the blade at the sage it
      // was made for, and the sage line is the kingdom's ending heard from
      // the mouth of the machine that made it possible.
      let k = 'sl_' + s.extra + '_' + standingTier();
      if (s.extra === 'ratchet') {
        if (G.save.flags['sageTame_GA1D']) k = 'sl_ratchet_sage';
        else if (G.save.flags.crystal) k = 'sl_ratchet_forged';
      }
      // ...AND HE SAYS IT ONCE. This line is what the NPC makes of her now, so
      // it leads every conversation — which meant that between two guardians
      // falling, every single approach opened with the same sentence, and the
      // player learned to skip past the top of the dialog to reach the part
      // that changes. Skipping the top is how the errand gets missed.
      //
      // It is keyed on the LINE, not on the NPC: when the tier moves, or the
      // trader's own arc moves, the key changes and he says the new one.
      const sl = t(k);
      const said = G.save.flags.said || (G.save.flags.said = {});
      if (sl && sl !== k && !said[k]) {
        said[k] = 1;
        if (typeof persist === 'function') persist();
        lines = [sl].concat(lines);
      }
    }
    // THE STORY COMES IN FRAGMENTS (owner: "give us fragments of the story
    // with every advancement"). The memory film is the whole of what happened
    // to the city; these are the shards he can only say out loud once she has
    // proven she can carry them — one new fragment each time a guardian's
    // fork has been answered, told the next time she comes home to the den.
    if (s.extra === 'ratchet') {
      const forks = ((typeof braid === 'function' && braid()) || {}).forks || 0;
      const told = G.save.flags.rfrag || 0;
      if (forks > told && told < 5) {
        const fl = t('sl_rfrag' + (told + 1));
        if (fl && fl.indexOf('sl_rfrag') !== 0) {
          lines = [fl].concat(lines);
          G.save.flags.rfrag = told + 1;
          if (typeof persist === 'function') persist();
        }
      }
    }
    G.dialog = { name: t('n_' + s.extra), lines, i: 0, npc: s.extra, onEnd: after };
    G.state = 'DIALOG'; npcSay(s.extra, 0);
  } else if (s.type === 'term') {
    G.dialog = { name: '…', lines: t('t' + s.extra).slice(), i: 0, onEnd: null, rs: RS_TERM[s.extra] };
    G.state = 'DIALOG'; sfx('ui');
  } else if (s.type === 'bench') {
    G.save.bench = { room: G.roomId, x: s.x, y: s.y + s.h - 38 };
    G.save.usedNine = false; G.save.usedAegis = false;
    starRestock(); persist(); sfx('bench');
    // A rest used to raise the fork too. It is a checkpoint — the place you go
    // to stop thinking for a moment — and putting the game's heaviest question
    // there, every single time, is what turned it into furniture.
    const dur = Math.max(1.4, (player.maxCores() - player.cores) * 0.2 + 1.4);
    const dock = 0.55;
    // dock phase: walk to the centre, then charge (robot: cables+surge / hero: drink)
    G.recharge = {
      t: dur, dur: dur, tick: 0.4, x: s.x + s.w / 2, y: s.y + 14,
      podTop: s.y, podH: s.h, phase: 'dock', dockT: dock, dock0: dock,
    };
    player.rechargeT = dur + dock;
    player.face = 1;
    player.volts = 99;
    burst(s.x + s.w / 2, s.y + 8, 14, '#8ff6ff', 180, 0.6, 100, 3, true);
  } else if (s.type === 'chest') {
    s.opened = true;
    if (s.flagKey) G.save.flags[s.flagKey] = 1;
    sfx('chest');
    if (s.extra === 'slot') { G.save.slots++; showItem(t('s_slot'), t('s_slotd')); }
    else if (s.extra.indexOf('rl:') === 0) G.grantRelic(s.extra.slice(3));
    else if (s.extra.indexOf('it:') === 0) {
      // an inventory item kept in a chest — the booth's spare power cell
      const it = s.extra.slice(3);
      invAdd(it);
      showItem(t('i_' + it), t('i_' + it + 'd'));
    }
    else grantCrest(s.extra);
  } else if (s.type === 'mod') {
    G.statics.splice(G.statics.indexOf(s), 1);
    grantMod(s.extra);
  } else if (s.type === 'item') {
    G.statics.splice(G.statics.indexOf(s), 1);
    questTake(s.extra);
    burst(s.x + 13, s.y + 13, 22, '#ffd76a', 260, 0.8, 100, 4, true);
  } else if (s.type === 'riddle') {
    // a MIND NODE is one interactive puzzle now — see NODES in trials.js
    triStartNode(s.extra | 0, s);
  } else if (s.type === 'secret') {
    G.save.flags['sr_' + s.extra] = 1;
    G.statics.splice(G.statics.indexOf(s), 1);
    burst(s.x + 12, s.y + 12, 26, '#ffd76a', 280, 0.8, 100, 4, true);
    // THE OTHER END. Buried in the Crystal Cache — the one secret that is not
    // a relic. The two halves were made for each other and the join says so
    // out loud: the reunion sting (audio.js crystalJoin) fires here and
    // nowhere else in the game.
    if (s.extra === 'crystal2') {
      G.save.flags.crystal2 = 1; persist();
      sfx('crystalJoin');
      G.flash = Math.max(G.flash, 0.5);
      burst(s.x + 12, s.y + 12, 34, '#ffffff', 320, 1.0, 40, 4, true);
      showItem(t('i_crystal2'), t('i_crystal2d'));
      return;
    }
    G.grantRelic(s.extra);
  } else if (s.type === 'trial') {
    trialOpen();
  } else if (s.type === 'vault') {
    const have = ['sigil1', 'sigil2', 'sigil3'].filter(id => relicHas(id)).length;
    if (G.save.flags.vaultOpen || have >= 3) {
      if (!G.save.flags.vaultOpen) {
        G.save.flags.vaultOpen = 1; persist();
        sfx('chest'); G.toast(t('vault_open'));
        burst(s.x + s.w / 2, s.y + 20, 30, '#ffd76a', 300, 0.9, 100, 4, true);
      }
      G.trans = { t: 0.28, to: 'V1', side: 'R', half: false };
    } else {
      G.toast(t('vault_locked') + '  ' + have + '/3');
      sfx('no');
    }
  }
}

// ---------- update ----------
function fxDecay(dt) {
  G.flash = Math.max(0, G.flash - dt * 2.4);
  G.lowGravT = Math.max(0, (G.lowGravT || 0) - dt);   // NULL GRAVITY field
  G.iceT = Math.max(0, (G.iceT || 0) - dt);           // COOLANT FREEZE floor
  G.hudGlitchT = Math.max(0, (G.hudGlitchT || 0) - dt); // DATA CORRUPTION
  G.revT = Math.max(0, (G.revT || 0) - dt);           // MOTHER'S SONG reversal
  G.songLockT = Math.max(0, (G.songLockT || 0) - dt); // Song jammed
  G.darkT = Math.max(0, (G.darkT || 0) - dt);         // TOTAL NULL darkness
  G.revealT = Math.max(0, (G.revealT || 0) - dt);     // Song reveal in the dark
  for (const r of G.rings) { r.r += 560 * dt; r.a -= dt * 2; }
  G.rings = G.rings.filter(r => r.a > 0);
  if (G.coreFlash) { G.coreFlash.t -= dt; if (G.coreFlash.t <= 0) G.coreFlash = null; }
  G.coresFullT = Math.max(0, G.coresFullT - dt);
  if (G.impact) { G.impact.t -= dt; if (G.impact.t <= 0) G.impact = null; }
  if (G.bolt) { G.bolt.t -= dt; if (G.bolt.t <= 0) G.bolt = null; }
}
function tickNPCVox() {
  // proximity mixing: each NPC's voice swells as she draws near, and blooms
  // while it is actually speaking with her
  if (typeof npcVoxTick !== 'function' || !G.statics) return;
  for (const s of G.statics) {
    if (s.type !== 'npc') continue;
    const d = Math.hypot(player.x + player.w / 2 - (s.x + s.w / 2),
                         player.y + player.h / 2 - (s.y + s.h / 2));
    const talking = G.state === 'DIALOG' && G.dialog && G.dialog.npc === s.extra;
    const k = clamp(1 - d / 320, 0, 1);
    npcVoxTick(s.extra, (talking ? 0.85 : k * k) * 0.6);
  }
}
function update(dt) {
  if (G.state === 'PLAY' || G.state === 'DIALOG') { tickNPCVox(); tickCaveLure(); }
  else if (typeof npcVoxQuietAll === 'function') npcVoxQuietAll();
  if (G.state === 'PLAY') {
    G.save.time += dt;
    fxDecay(dt);
    rubbleTick(dt);
    if (G.hitStop > 0) { G.hitStop -= dt; updateParts(dt * 0.25); return; }
    if (G.trans) {
      G.trans.t -= dt;
      if (!G.trans.half && G.trans.t < 0.14) { G.trans.half = true; applyTransition(); }
      if (G.trans.t <= 0) G.trans = null;
    } else {
      // the chamber hold: the world keeps breathing, she does not move
      if (G.bossEntry) {
        G.bossEntry.t += dt;
        if (G.bossEntry.t >= G.bossEntry.dur || !G.boss || G.boss.st !== 'dorm') G.bossEntry = null;
        else if (player) player.vx = 0;
      }
      if (typeof updateRoarFX === 'function') updateRoarFX(dt);
      // THE CACHE GATE: the floor entrance stays open until she is truly
      // inside — on her feet, clear of the hole — and only then does the
      // hardlight bridge snap across behind her and seal the arena
      if (G.roomId === 'X1' && !G.x1Bridge && G.boss && !G.boss.dead) {
        const hx0 = 6 * TILE;
        // backstop: any other way in seals the moment she clears the floor
        if (!player.dead && player.y + player.h <= 15 * TILE - 2) {
          G.x1Bridge = true;
          sfx('cast'); cam.shake = Math.max(cam.shake, 3);
          for (let i = 0; i < 10; i++)
            addPart(hx0 + rnd(0, 3 * TILE), 15 * TILE + rnd(-3, 3),
              rnd(-40, 40), rnd(-50, 20), 0.5, '#37ffd0', 2.4, 200, true);
        }
      }
      // WHAT THE BLOB LEAVES BEHIND. It spreads for a moment, sits, and dries
      // — and standing in it costs a core. It is the only thing in the game
      // that makes NOT moving the mistake.
      if (G.pools && G.pools.length) {
        for (let i = G.pools.length - 1; i >= 0; i--) {
          const q = G.pools[i];
          q.t -= dt;
          if (q.t <= 0) { G.pools.splice(i, 1); continue; }
          q.r = Math.min(26, q.r + 34 * dt);
          if (!player.dead && player.iT <= 0 && player.on
              && Math.abs(player.x + player.w / 2 - q.x) < q.r
              && Math.abs(player.y + player.h - q.y) < 16) player.hurt(DF().edmg, q.x, 'blob.pool');
        }
      }
      if (G.plats) for (const pl of G.plats) pl.update(dt);
      if (!(typeof isHero === 'function' && isHero())) ceilWeather(dt, G.roomDef.zone);
      sawHum(dt);
      updateTutor(dt);
      updateLesson(dt);
      // during a finishing blow she is driven, not steered — the choice was the
      // input, and nothing the player does now can fumble it
      if (G.finish && typeof updateFinisher === 'function') updateFinisher(dt);
      else player.update(dt);
      if (typeof platRide === 'function') platRide(player);
      checkEvo();
      // shuriken regen: the suit condenses static into a fresh star over time,
      // so running dry is a lull, never a dead end
      if (starCount() < starMax()) {
        G.starRegenT = (G.starRegenT || 0) + dt;
        if (G.starRegenT >= STAR_REGEN_T) {
          G.starRegenT = 0; starSet(starCount() + 1);
          sfx('pick');
          burst(player.x + player.w / 2, player.y + 10, 8, ELEM.zizt.glow, 160, 0.35, 60, 2, true);
        }
      } else G.starRegenT = 0;
      if (bossActive()) player.x = clamp(player.x, 4, G.roomDef.w * TILE - player.w - 4);
      for (const e of G.enemies) if (!e.dead) e.update(dt);
      if (G.saws) for (const sw of G.saws) sw.update(dt);
      if (typeof updatePets === 'function') updatePets(dt);
      if (typeof updateBrDelta === 'function') updateBrDelta(dt);
      if (typeof updateSpoilQ === 'function') updateSpoilQ(dt);
      if (typeof updateWake === 'function') updateWake(dt);
      if (typeof updateGateWalk === 'function') updateGateWalk(dt);
      G.enemies = G.enemies.filter(e => !e.dead);
      if (G.boss) G.boss.update(dt);
      for (const p of G.projs) if (!p.dead) p.update(dt);
      G.projs = G.projs.filter(p => !p.dead);
      for (const w of G.wrecks) if (!w.dead) w.update(dt);
      G.wrecks = G.wrecks.filter(w => !w.dead);
      // recharge-pod sequence: robot slides in, cables hook on, cores refill
      if (G.recharge) {
        const rc = G.recharge;
        if (rc.phase === 'dock') {
          // slide the robot to the pod centre and settle it in
          rc.dockT -= dt;
          player.x = lerp(player.x, rc.x - player.w / 2, Math.min(1, dt * 13));
          if (chance(0.3)) addPart(rc.x + rnd(-14, 14), rc.y + rnd(-4, 26), rnd(-10, 10), rnd(-30, 10), 0.3, '#8ff6ff', 2, 0, true);
          if (rc.dockT <= 0) {
            // clamp in, cables snap on, surge begins
            rc.phase = 'charge';
            player.x = rc.x - player.w / 2;
            sfx('cast'); G.flash = Math.max(G.flash, 0.16);
            burst(rc.x, rc.y + 8, 16, '#8ff6ff', 220, 0.5, 60, 3, true);
          }
        } else {
          rc.t -= dt; rc.tick -= dt;
          player.x = rc.x - player.w / 2;
          if (rc.tick <= 0 && player.cores < player.maxCores()) {
            rc.tick = 0.18;
            player.cores++;
            G.coreFlash = { i: player.cores - 1, t: 0.5 };
            G.flash = Math.max(G.flash, 0.12);
            sfx('heal');
            burst(player.x + 12, player.y + 18, 10, '#aef7d8', 180, 0.4, 100, 3, true);
          }
          if (chance(0.6)) addPart(rc.x + rnd(-16, 16), rc.y + rnd(-36, 4), rnd(-30, 30), rnd(-70, 20), 0.3, '#8ff6ff', 2.5, 0, true);
          if (rc.t <= 0) {
            G.recharge = null;
            if (player.cores >= player.maxCores()) G.coresFullT = 0.9;
            G.toast(t('rested'));
          }
        }
      }
      for (const p of G.pickups) if (!p.dead) p.update(dt);
      for (const p of G.pickups) if (p.dead && p.flagKey) G.save.flags[p.flagKey] = 1;
      G.pickups = G.pickups.filter(p => !p.dead);
      G.near = findNear();
      // UP AT THE GATES WALKS HER IN. Checked before the ordinary interact, and
      // only when she is standing on the ground in front of them — pressing up
      // anywhere else in the room does what it always did.
      if (player.on && inP('UP') && typeof gateEnter === 'function' && gateEnter()) { /* she is going */ }
      else if (G.near && (inP('INT') || (inP('UP') && player.on))) doInteract(G.near);
      checkTransitions();
      if (G.winT > 0) {
        G.winT -= dt;
        // the reel plays in the gap the win screen was already waiting through
        if (G.winT <= 0 && !(typeof startEndingReel === 'function' && startEndingReel())) {
          G.state = 'WIN'; setMusic('winTheme');
        }
      }
      if (G.state === 'PLAY') {
        if (inP('MAP')) { G.state = 'MAP'; sfx('ui'); }
        if (inP('BRAID')) { G.state = 'BRAID'; braidView.ready = false; sfx('ui'); }
        else if (inP('CREST')) { G.state = 'CREST'; G.crestIdx = 0; sfx('ui'); }
        else if (inP('SKILL')) { G.state = 'SKILLS'; G.skillIdx = 0; sfx('ui'); }
        else if (inP('PAUSE')) { G.state = 'PAUSE'; G.pauseIdx = 0; sfx('ui'); }
      }
    }
    updateCam(player.x + player.w / 2, player.y + player.h / 2, G.roomDef.w * TILE, G.roomDef.h * TILE, dt);
    updateParts(dt);
    for (const tt of G.toasts) tt.t -= dt;
    G.toasts = G.toasts.filter(tt => tt.t > 0);
    if (G.zoneToast) { G.zoneToast.t -= dt; if (G.zoneToast.t <= 0) G.zoneToast = null; }
  }
  else if (G.state === 'DEAD') {
    updateParts(dt); fxDecay(dt);
    G.deadT -= dt;
    if (G.deadT <= 0) respawn();
  }
  else if (G.state === 'DIALOG') {
    if (inP('OK') || inP('INT') || inP('ATK')) {
      G.dialog.i++;
      if (G.dialog.i >= G.dialog.lines.length) {
        const cb = G.dialog.onEnd; G.dialog = null; G.state = 'PLAY';
        npcHush();                      // cut the line short with the box
        if (cb) cb();
      } else if (G.dialog.npc) npcSay(G.dialog.npc, G.dialog.i);
      else sfx('ui');
    }
  }
  else if (G.state === 'OFFER') updateOffer(dt);
  else if (G.state === 'BRAID') {
    if (inP('BRAID') || inP('BACK') || inP('PAUSE')) { G.state = 'PLAY'; braidView.ready = false; sfx('ui'); }
    else updateBraidView(dt);
  }
  else if (G.state === 'MAP') {
    if (G.mapBtnNew > 0) G.mapBtnNew = 0;
    if (inP('MAP') || inP('BACK') || inP('PAUSE')) { G.state = 'PLAY'; mapView.ready = false; sfx('ui'); }
    else updateMap(dt);
  }
  else if (G.state === 'BAG') updateBag();
  else if (G.state === 'CREST') updateCrest();
  else if (G.state === 'SHOP') updateShop();
  else if (G.state === 'SKILLS') updateSkills();
  else if (G.state === 'RELICS') updateRelics();
  else if (G.state === 'TRIAL') updateTrial(dt);
  else if (G.state === 'PAUSE') updatePause();
  else if (G.state === 'TCFG') updateTouchCfg();
  else if (G.state === 'CINE') updateCine(dt);
  else if (G.state === 'CUT') updateCut(dt);
  else if (G.state === 'MENU') updateMenu();
  else if (G.state === 'LANGSEL') updateLangSel();
  else if (G.state === 'DIFF') updateDiff();
  else if (G.state === 'WHO') updateWho();
  else if (G.state === 'CTRL') updateCtrl();
  else if (G.state === 'INTRO') {
    G.introT += dt;
    if (inP('OK') || inP('ATK') || inP('BACK') || G.introT > 12.4) { G.state = 'PLAY'; sfx('ok'); }
  }
  else if (G.state === 'MORE') updateMore();
  else if (G.state === 'WIN') { if (inP('OK')) { G.state = 'MENU'; G.menuIdx = 0; setMusic('title'); } }
  else if (G.state === 'GAMEOVER') {
    if (inP('OK')) { wipeSave(G.save && G.save.theme); G.save = null; G.state = 'MENU'; G.menuIdx = 0; setMusic('title'); }
  }
}
function updateMore() {
  const L = moreLayout();
  if (inP('UP')) { G.moreIdx = (G.moreIdx + L.rows.length - 1) % L.rows.length; sfx('ui'); }
  if (inP('DOWN')) { G.moreIdx = (G.moreIdx + 1) % L.rows.length; sfx('ui'); }
  // BACK always just returns her to the room. A player who wants to keep
  // playing the part they have must never have to go through the sales pitch
  // to get there, and the pad's cancel button is where they will look first.
  if (inP('BACK') || inP('PAUSE')) { G.state = 'PLAY'; sfx('ui'); return; }
  if (inP('OK') || inP('ATK') || inP('JUMP')) {
    if (L.rows[G.moreIdx] === 'demo_get' && DEMO_URL) {
      try { window.open(DEMO_URL, '_blank', 'noopener'); } catch (e) {}
    }
    G.state = 'PLAY'; sfx('ok');
  }
}
function menuOptions() {
  // "Play" always leads to the Who-are-you chooser (per-character saves) —
  // unless this build is LOCKED to one game, where the menu speaks plainly:
  // Continue (if that game has a save) and New Game (story from the top)
  const lk = gameLock();
  if (lk) {
    const opts = [];
    if (loadStored(lk)) opts.push('continue');
    opts.push('newgame');
    // THE OPENING, ON DEMAND. It played once, on the first boot ever, and after
    // that a returning player never saw it again — which is most boots, for the
    // person who has been testing the game all week. It is a piece of the game,
    // not a one-time gate: it belongs on the menu like everything else.
    if (lk !== 'hero') opts.push('film');
    return opts.concat(['controls', 'lang', 'bright', 'sound', 'music']);
  }
  return ['play', 'controls', 'lang', 'bright', 'sound', 'music'];
}
// ---------------------------------------------------------------------------
// SCREEN BRIGHTNESS — a real setting, because a game this dark cannot be
// mastered on one screen and shipped to another.
//
// MEASURED, over eight rooms: mean frame luminance 13-22 out of 255, and in
// SEVEN of the eight the MEDIAN PIXEL IS ZERO — between 62% and 80% of every
// screen is within a hair of black. On a desktop monitor in a dim room that is
// atmosphere. On a phone, which is where this game is actually played and often
// in daylight, it is a black rectangle with a cat in it. The owner's word for
// it, three times: "all so dark".
//
// The lift is a SCREEN composite, not a brightness multiply, and that choice is
// the whole point: multiplying a black pixel by anything leaves it black, which
// is why a CSS brightness filter does nothing for a frame that is 70% black.
// screen(dst, g) = 1-(1-dst)(1-g) raises the floor to g and leaves a white
// highlight white — it lifts exactly the region that is missing and nothing
// else. One fillRect a frame, so it costs nothing on the phone it is for.
//
// It is a SETTING and not a new constant because I cannot see his screen, and
// the last three attempts to guess a number from here were all still too dark.
const BRIGHT_STEPS = [0, 16, 30, 46, 66];      // the black floor each step lifts to
const BRIGHT_NAMES = ['bright_0', 'bright_1', 'bright_2', 'bright_3', 'bright_4'];
function brightIdx() {
  const v = (typeof BRIGHT_SET === 'number') ? BRIGHT_SET : 2;
  return Math.max(0, Math.min(BRIGHT_STEPS.length - 1, v));
}
// Default 3, not the middle. The middle is a compromise between a screen I can
// see and one I cannot, and the one I cannot is the one being played on.
let BRIGHT_SET = 3;
function drawScreenLift() {
  const g = BRIGHT_STEPS[brightIdx()];
  if (!g) return;
  c.save();
  c.globalCompositeOperation = 'screen';
  c.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
  c.fillRect(0, 0, 960, 540);
  c.restore();
}
function gameLock() { return (typeof window !== 'undefined' && window.GAME_LOCK) || null; }
function updateMenu() {
  const opts = menuOptions();
  // U (or the on-screen banner) takes the newer build
  if (G.updateReady && inP('CLAW')) { sfx('ok'); applyUpdate(); return; }
  if (G.updateReady) {
    // on the title screen there is nothing to lose: count down and refresh
    G.autoUpdT = (G.autoUpdT == null ? 3.5 : G.autoUpdT - 1 / 60);
    if (G.autoUpdT <= 0) { applyUpdate(); return; }
  }
  if (inP('DOWN')) { G.menuIdx = (G.menuIdx + 1) % opts.length; sfx('ui'); }
  if (inP('UP')) { G.menuIdx = (G.menuIdx + opts.length - 1) % opts.length; sfx('ui'); }
  if (inP('OK')) {
    const o = opts[G.menuIdx]; sfx('ok');
    if (o === 'play') { G.whoIdx = 0; G.state = 'WHO'; }
    else if (o === 'continue') {
      const s2 = loadStored(gameLock());
      if (s2) { G.pendTheme = gameLock(); startGame(s2); }
    } else if (o === 'newgame') {
      // a truly new game: the old save goes, the story plays again, and
      // only then does the difficulty screen hand over the controls
      const lk2 = gameLock();
      G.pendTheme = lk2; wipeSave(lk2); G.diffIdx = 1;
      if (lk2 !== 'hero') {
        try { localStorage.removeItem('cb_intro_seen'); } catch (e) {}
        G.afterCine = 'DIFF'; startCine();
      } else G.state = 'DIFF';
    }
    else if (o === 'film') { G.afterCine = null; startCine(); }
    else if (o === 'controls') { G.ctrlBack = 'MENU'; G.state = 'CTRL'; }
    else if (o === 'lang') { openLangSel('MENU'); }
    else if (o === 'bright') {
      // steps round, like every other toggle on this menu — and it applies the
      // moment it changes, with the menu itself lit by it, so the choice is
      // made by LOOKING rather than by reading a number
      BRIGHT_SET = (brightIdx() + 1) % BRIGHT_STEPS.length; saveMeta();
    }
    else if (o === 'sound') { MUTED = !MUTED; saveMeta(); }
    else if (o === 'music') {
      MUSIC_ON = !MUSIC_ON; saveMeta();
      const nm = MUS.name;
      if (!MUSIC_ON) stopRecorded();
      else if (nm) { MUS.name = null; setMusic(nm); }
    }
  }
}
// language picker — a clear list, live preview, easy to change back (works like a toggle)
function openLangSel(back) {
  G.langBack = back || 'MENU';
  G.langIdx = Math.max(0, LANGS.findIndex(l => l.id === LANG));
  G.state = 'LANGSEL';
}
function updateLangSel() {
  if (inP('DOWN')) { G.langIdx = (G.langIdx + 1) % LANGS.length; LANG = LANGS[G.langIdx].id; saveMeta(); sfx('ui'); }
  if (inP('UP')) { G.langIdx = (G.langIdx + LANGS.length - 1) % LANGS.length; LANG = LANGS[G.langIdx].id; saveMeta(); sfx('ui'); }
  if (inP('OK') || inP('BACK')) { sfx('ok'); saveMeta(); G.state = G.langBack || 'MENU'; }
}
function updateDiff() {
  if (inP('DOWN')) { G.diffIdx = (G.diffIdx + 1) % 3; sfx('ui'); }
  if (inP('UP')) { G.diffIdx = (G.diffIdx + 2) % 3; sfx('ui'); }
  if (inP('BACK')) { G.state = gameLock() ? 'MENU' : 'WHO'; sfx('ui'); return; }
  if (inP('OK')) {
    sfx('ok');
    const s = newSave(G.diffIdx);
    s.theme = G.pendTheme || 'robo';
    startGame(s);
  }
}
function updateWho() {
  if (inP('LEFT') || inP('RIGHT')) { G.whoIdx = 1 - G.whoIdx; sfx('ui'); }
  if (inP('BACK')) { G.state = 'MENU'; sfx('ui'); return; }
  if (inP('OK')) {
    sfx('ok');
    G.pendTheme = G.whoIdx ? 'hero' : 'robo';
    const stored = loadStored(G.pendTheme);
    if (stored) startGame(stored);            // continue this character's voyage
    else { G.diffIdx = 1; G.state = 'DIFF'; }  // fresh voyage → pick difficulty
  }
}
function pauseHasTouch() { return typeof TOUCH !== 'undefined' && TOUCH.enabled; }
// ===========================================================================
// THE PACE DIAL. The one assist that matters most for the player this game is
// actually for, and the cheapest: one multiplier on dt slows every telegraph
// in the game at once — including the ones nobody has tuned yet — without
// touching a single enemy constant or making anybody invincible.
//
// It is SEPARATE from the difficulty presets on purpose. Kitten bundles seven
// cores, weak enemies and a quarter of the damage into one switch, so a child
// who needs nothing but more time to react has to accept being nearly
// unkillable, and loses the achievement along with the challenge. Celeste's
// designer found the assists that matter are the in-between ones — 20% slower,
// one extra dash — the ones that let a player tune rather than trivialise.
//
// It is worded without judgement, it says what it does, and it is reachable
// mid-fight from the pause menu rather than buried in a new-game choice.
// ===========================================================================
const PACE_STEPS = [1, 0.9, 0.8, 0.7];
function paceK() {
  const i = (G.save && G.save.pace) | 0;
  return PACE_STEPS[clamp(i, 0, PACE_STEPS.length - 1)] || 1;
}
function paceLabel() { return Math.round(paceK() * 100) + '%'; }
// ONE LIST, READ BY BOTH THE DRAWING AND THE KEYS.
//
// It used to be two: a literal array in the draw and a chain of index
// comparisons in the update, plus the row count written down a third time as
// `pauseHasTouch() ? 10 : 9`. Adding a row meant editing eight numbers in three
// places and getting all of them right — which is why no row was ever added,
// and why there was no way to restart a run.
function pauseItems() {
  const it = [
    { id: 'resume', label: t('resume') },
    { id: 'map', label: t('pm_map') },
    { id: 'bag', label: t('pm_bag') },
    { id: 'crests', label: t('pm_crests') },
    { id: 'skills', label: t('pm_skills') },
    { id: 'relics', label: t('pm_relics') },
    { id: 'ctrl', label: t('ctl_title') },
    { id: 'pace', label: t('pace') + ':  ' + paceLabel() + '   ◂ ▸', arrows: 1, hint: t('pace_d') },
    { id: 'qual', label: t('qual') + ':  ' + qualLabel() + '   ◂ ▸', arrows: 1, hint: t('qual_d').replace('%s', DEVICE.form) },
  ];
  if (pauseHasTouch()) it.push({ id: 'touch', label: t('tl_title') });
  it.push({ id: 'restart', label: t('pm_restart'), icon: '↻', warn: 1, hint: t('pm_restart_d') });
  it.push({ id: 'quit', label: t('to_menu'), icon: '⏻', warn: 1, out: 1 });
  return it;
}
// ...and one geometry, read by the drawing AND by the tap targets. They used to
// be written out separately, which is how the touch hit-boxes ended up testing
// for seven rows at a 40 px pitch against a menu that had ten at a different
// one: on a phone the pause menu selected the wrong line.
function pauseLayout() {
  const items = pauseItems();
  const step = Math.min(40, Math.floor(322 / items.length));
  return { items: items, step: step, y0: 322 - (items.length - 1) * step / 2 };
}
function updatePause() {
  const pm = pauseLayout().items, n = pm.length;
  if (inP('DOWN')) { G.pauseIdx = (G.pauseIdx + 1) % n; G.pauseConfirm = null; sfx('ui'); }
  if (inP('UP')) { G.pauseIdx = (G.pauseIdx + n - 1) % n; G.pauseConfirm = null; sfx('ui'); }
  if (inP('PAUSE')) { G.pauseConfirm = null; G.state = 'PLAY'; return; }
  const cur = pm[G.pauseIdx] || pm[0];
  if (cur.id === 'pace' && (inP('LEFT') || inP('RIGHT'))) {
    const d = inP('RIGHT') ? 1 : -1, n2 = PACE_STEPS.length;
    G.save.pace = ((((G.save.pace | 0) + d) % n2) + n2) % n2;
    sfx('ui'); persist();
  }
  if (cur.id === 'qual' && (inP('LEFT') || inP('RIGHT'))) { qualCycle(); sfx('ui'); }
  if (inP('OK')) {
    // THROWING A RUN AWAY TAKES TWO PRESSES. Restart and Quit sit at the bottom
    // of a list the player scrolls through with the same key that confirms, and
    // one of them cannot be undone.
    if (cur.warn && G.pauseConfirm !== cur.id) { G.pauseConfirm = cur.id; sfx('ui'); return; }
    G.pauseConfirm = null;
    sfx('ok');
    if (cur.id === 'resume') G.state = 'PLAY';
    else if (cur.id === 'map') G.state = 'MAP';
    else if (cur.id === 'bag') { G.state = 'BAG'; G.bagIdx = 0; }
    else if (cur.id === 'crests') { G.state = 'CREST'; G.crestIdx = 0; }
    else if (cur.id === 'skills') { G.state = 'SKILLS'; G.skillIdx = 0; }
    else if (cur.id === 'relics') G.state = 'RELICS';
    else if (cur.id === 'ctrl') { G.ctrlBack = 'PAUSE'; G.state = 'CTRL'; }
    else if (cur.id === 'pace') {
      G.save.pace = (((G.save.pace | 0) + 1) % PACE_STEPS.length);
      G.toast(t('pace') + '  ' + paceLabel()); persist();
    }
    else if (cur.id === 'qual') { qualCycle(); G.toast(t('qual') + '  ' + qualLabel()); }
    else if (cur.id === 'touch') G.state = 'TCFG';
    else if (cur.id === 'restart') {
      // same difficulty, same world, nothing carried — the run starts over
      const d = (G.save && G.save.diff) || 1;
      startGame(newSave(d));
    }
    else if (cur.id === 'quit') { persist(); setMusic('title'); G.state = 'MENU'; G.menuIdx = 0; }
  }
}
function updateTouchCfg() {
  if (inP('BACK') || inP('PAUSE') || inP('OK')) {
    if (typeof tLayoutSave === 'function') tLayoutSave();
    G.state = 'PAUSE'; sfx('ui');
  }
}
function updateRelics() {
  if (inP('OK') || inP('BACK')) { G.state = 'PLAY'; sfx('ui'); }
}
function drawRelics() {
  c.fillStyle = 'rgba(4,7,12,0.88)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('rl_title'), 480, 46, 28, '#eef3fa', 'center', '#ffd76a');
  const owned = G.save.relics || [];
  if (!owned.length) {
    wrapText(t('rl_none'), 620, 17).forEach((ln, i) => ftxt(ln, 480, 250 + i * 26, 17, '#8aa2b5'));
  } else {
    owned.forEach((id, i) => {
      const x = 250 + (i % 2) * 400, y = 120 + Math.floor(i / 2) * 62;
      c.shadowColor = '#ffd76a'; c.shadowBlur = 10;
      c.fillStyle = '#2c2517'; c.beginPath(); c.arc(x, y, 17, 0, 7); c.fill();
      c.strokeStyle = '#ffd76a'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 17, 0, 7); c.stroke();
      c.shadowBlur = 0;
      ftxt(RELIC_ICONS[id] || '◆', x, y + 1, 14, '#ffd76a');
      ftxt(t('rl_' + id), x + 30, y - 9, 16, '#eef3fa', 'left');
      ftxt(t('rl_' + id + 'd'), x + 30, y + 11, 12, '#8aa2b5', 'left', null, '600');
    });
  }
  ftxt(t('rl_close'), 480, 516, 12, '#7d93a8');
}
// ===========================================================================
// THE BAG. Asked for by name: "there should be an inventory for the hero so we
// can check it out."
//
// It lists two things that were previously invisible — the counted items the
// battery arc runs on, and the quest fetch-items that `bag` has silently held
// since errands landed. A player carrying a Power Cell had no way to know it,
// which made the one decision the arc is built around unreadable.
//
// Usable items are used from here. The kit is the only one so far, and it is
// deliberately not bound to a key: a heal you can fire by reflex is a heal that
// gets wasted, and this one is rare.
function bagList() {
  const out = [];
  for (const id in (G.save.items || {})) {
    if (invCount(id) > 0) out.push({ id, n: invCount(id), use: id === 'kit' });
  }
  for (const id in (G.save.bag || {})) if (G.save.bag[id]) out.push({ id, n: 1, quest: 1 });
  return out;
}
function updateBag() {
  const list = bagList();
  if (inP('BACK') || inP('CREST')) { G.state = 'PLAY'; sfx('ui'); return; }
  if (!list.length) return;
  G.bagIdx = Math.min(G.bagIdx || 0, list.length - 1);
  if (inP('DOWN')) { G.bagIdx = (G.bagIdx + 1) % list.length; sfx('ui'); }
  if (inP('UP')) { G.bagIdx = (G.bagIdx + list.length - 1) % list.length; sfx('ui'); }
  if (inP('OK')) {
    const it = list[G.bagIdx];
    if (it && it.use && player && player.cores < player.maxCores()) {
      invTake(it.id);
      player.cores = Math.min(player.maxCores(), player.cores + 2);
      sfx('heal'); G.toast(t('i_kit_used'));
      G.state = 'PLAY';
    } else sfx('no');
  }
}
function drawBag() {
  c.fillStyle = 'rgba(4,7,12,0.85)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('bag_title'), 480, 50, 28, '#eef3fa', 'center', '#ffd76a');
  ftxt(t('bag_sub'), 480, 82, 13, '#8aa2b5');
  const list = bagList();
  if (!list.length) { ftxt(t('bag_none'), 480, 280, 17, '#7d93a8'); ftxt(t('rl_close'), 480, 516, 12, '#7d93a8'); return; }
  const rtl = LANG === 'ar';
  list.forEach((it, i) => {
    const sel = i === (G.bagIdx || 0);
    const y = 140 + i * 44;
    if (sel) { c.fillStyle = 'rgba(255,215,106,0.09)'; rr(c, 170, y - 19, 620, 38, 8); c.fill(); }
    const meta = INV[it.id] || { icon: '◆', col: '#8aa2b5' };
    const x0 = rtl ? 770 : 190, al = rtl ? 'right' : 'left';
    ftxt(meta.icon, rtl ? 782 : 178, y + 1, 19, meta.col, 'center');
    const nm = t('i_' + it.id);
    ftxt(nm + (it.n > 1 ? '  ×' + it.n : ''), x0 + (rtl ? -22 : 22), y - 6, 17,
         sel ? '#eef3fa' : '#a9bccd', al);
    ftxt(t('i_' + it.id + 'd'), x0 + (rtl ? -22 : 22), y + 12, 12, '#7d93a8', al);
    if (it.use) ftxt(t('i_use'), rtl ? 190 : 770, y, 12, sel ? '#7dff9a' : '#5d7a8f', rtl ? 'left' : 'right');
  });
  ftxt(t('rl_close'), 480, 516, 12, '#7d93a8');
}
function updateCrest() {
  const list = G.save.crests;
  if (inP('CREST') || inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
  if (!list.length) return;
  if (inP('DOWN')) { G.crestIdx = (G.crestIdx + 1) % list.length; sfx('ui'); }
  if (inP('UP')) { G.crestIdx = (G.crestIdx + list.length - 1) % list.length; sfx('ui'); }
  if (inP('OK')) {
    const id = list[G.crestIdx];
    const eq = G.save.equip;
    const used = eq.reduce((s, x) => s + CRESTS[x], 0);
    if (eq.indexOf(id) >= 0) { eq.splice(eq.indexOf(id), 1); sfx('ui'); }
    else if (used + CRESTS[id] <= effSlots()) { eq.push(id); sfx('ok'); }
    else { G.toast(t('crest_full')); sfx('no'); }
    player.cores = Math.min(player.cores, player.maxCores());
    persist();
  }
}
function updateShop() {
  if (inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
  if (inP('DOWN')) { G.shopIdx = (G.shopIdx + 1) % SHOP.length; sfx('ui'); }
  if (inP('UP')) { G.shopIdx = (G.shopIdx + SHOP.length - 1) % SHOP.length; sfx('ui'); }
  if (inP('OK')) {
    const it = SHOP[G.shopIdx];
    if (shopSold(it)) { sfx('no'); return; }
    const cost = Math.floor(it.cost * (relicHas('coin') ? 0.9 : 1));
    if (G.save.scrap < cost) { G.toast(t('poor')); sfx('no'); return; }
    G.save.scrap -= cost; sfx('buy');
    if (it.type === 'cell') {
      // consumable, so it never leaves the list and never stops being useful
      player.volts = player.voltMax();
      G.save.flags.tutBuy = 1;
      G.toast(t('s_cell') + '  ⚡ ' + player.volts);
      burst(player.x + player.w / 2, player.y + 6, 16, '#ffd76a', 200, 0.6, 120, 3, true);
      persist();
      return;
    }
    if (it.type === 'crest') { G.save.crests.push(it.id); showItem(t('c_' + it.id), t('c_' + it.id + 'd')); }
    else if (it.type === 'slot') { G.save.slots++; G.save.shop[it.id] = 1; showItem(t('s_slot'), t('s_slotd')); }
    else { G.save.coresMax++; player.cores++; G.save.shop[it.id] = 1; showItem(t('s_core'), t('s_cored')); }
  }
}
function shopSold(it) {
  if (it.type === 'cell') return false;          // a consumable is never sold out
  return it.type === 'crest' ? G.save.crests.indexOf(it.id) >= 0 : !!G.save.shop[it.id];
}
function effSlots() { return G.save.slots + (G.save.skills && G.save.skills.indexOf('mind') >= 0 ? 1 : 0); }
function updateSkills() {
  if (inP('SKILL') || inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
  const pool = skillPool(), n = pool.length;
  G.skillIdx = Math.min(G.skillIdx, n - 1);
  if (inP('DOWN') || inP('RIGHT')) { G.skillIdx = (G.skillIdx + 1) % n; sfx('ui'); }
  if (inP('UP') || inP('LEFT')) { G.skillIdx = (G.skillIdx + n - 1) % n; sfx('ui'); }
  if (inP('OK')) {
    const sk = pool[G.skillIdx];
    if (G.save.skills.indexOf(sk.id) >= 0) { sfx('no'); return; }
    if (!tierOpen(sk.tier, G.save.skills.length)) { G.toast(t('sk_locked')); sfx('no'); return; }
    if (G.save.iq < sk.cost) { G.toast(t('sk_poor')); sfx('no'); return; }
    G.save.iq -= sk.cost; G.save.skills.push(sk.id);
    sfx('win'); persist();
    showItem(t('sk_' + sk.id), t('sk_' + sk.id + 'd'));
  }
}
function drawSkills() {
  c.fillStyle = 'rgba(4,7,12,0.88)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('sk_title'), 480, 46, 28, '#eef3fa', 'center', '#b48cff');
  ftxt(t('sk_iq') + '  ' + G.save.iq, 480, 82, 17, '#b48cff');
  // the tree BREATHES when the crystal branch appears: two columns while she
  // is claws-only (the layout every save so far has known), three once the
  // pool outgrows it, with the rows squeezed to keep the description clear
  const pool = skillPool();
  const cols = pool.length > 8 ? 3 : 2;
  const pos = cols === 2
    ? i => ({ x: 330 + (i % 2) * 300, y: 150 + Math.floor(i / 2) * 105 })
    : i => ({ x: 240 + (i % 3) * 240, y: 138 + Math.floor(i / 3) * 88 });
  c.strokeStyle = 'rgba(180,140,255,0.3)'; c.lineWidth = 2;
  for (let i = cols; i < pool.length; i++) {
    const a = pos(i - cols), b = pos(i);
    c.beginPath(); c.moveTo(a.x, a.y + 26); c.lineTo(b.x, b.y - 26); c.stroke();
  }
  pool.forEach((sk, i) => {
    const p2 = pos(i), owned = G.save.skills.indexOf(sk.id) >= 0;
    const open = tierOpen(sk.tier, G.save.skills.length);
    const afford = open && !owned && G.save.iq >= sk.cost;
    const sel = i === G.skillIdx;
    const cry = !!sk.need;   // the purifier branch shows its colour
    c.beginPath(); c.arc(p2.x, p2.y, 26, 0, 7);
    c.fillStyle = owned ? 'rgba(125,232,160,0.25)'
      : afford ? (cry ? 'rgba(235,245,255,' : 'rgba(180,140,255,') + (0.16 + Math.sin(performance.now() / 300) * 0.08) + ')'
      : 'rgba(40,50,66,0.6)';
    c.fill();
    c.lineWidth = sel ? 3 : 1.5;
    c.strokeStyle = sel ? '#ffffff' : owned ? '#7de8a0' : afford ? (cry ? '#e8f4ff' : '#b48cff') : '#44586b';
    c.stroke();
    ftxt(owned ? '✓' : (open ? String(sk.cost) : '🔒'), p2.x, p2.y, owned ? 18 : 13, owned ? '#7de8a0' : open ? '#dbe7f2' : '#607386');
    ftxt(t('sk_' + sk.id), p2.x, p2.y + 44, 14, sel ? '#eef3fa' : '#8aa2b5');
  });
  const cur = pool[Math.min(G.skillIdx, pool.length - 1)];
  wrapText(t('sk_' + cur.id + 'd'), 520, 14).forEach((ln, i) => ftxt(ln, 480, 474 + i * 19, 14, '#9fb8c8'));
  ftxt(t('sk_hint'), 480, 518, 12, '#7d93a8');
}

// ---------- drawing ----------
let scanCv = null;
function scanOverlay() {
  if (!scanCv) {
    scanCv = document.createElement('canvas'); scanCv.width = 960; scanCv.height = 540;
    const s = scanCv.getContext('2d');
    s.fillStyle = 'rgba(0,0,0,0.05)';
    for (let y = 0; y < 540; y += 4) s.fillRect(0, y, 960, 1);
    const v = s.createRadialGradient(480, 270, 240, 480, 270, 620);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.42)');
    s.fillStyle = v; s.fillRect(0, 0, 960, 540);
  }
  c.drawImage(scanCv, 0, 0);
}
// EVERY STRING IN THE GAME COMES THROUGH HERE, so this is where the writing
// direction belongs. Canvas defaults to a left-to-right paragraph: an Arabic
// string still SHAPES and joins correctly inside it, which is why the intro
// looked broadly right — but the base direction governs where neutral
// characters land, so full stops, dashes and digits were being placed at the
// wrong end of the sentence. The language knows which way it reads; the canvas
// simply was never told.
function ftxt(str, x, y, size, color, align, glow, weight) {
  c.font = (weight || '700') + ' ' + size + 'px "Segoe UI", Tahoma, sans-serif';
  c.textAlign = align || 'center'; c.textBaseline = 'middle';
  const rtl = typeof isRTL === 'function' && isRTL();
  if (rtl) c.direction = 'rtl';
  if (glow) { c.shadowColor = glow; c.shadowBlur = 14; }
  c.fillStyle = color; c.fillText(str, x, y); c.shadowBlur = 0;
  if (rtl) c.direction = 'ltr';
}
function wrapText(str, maxW, size) {
  c.font = '600 ' + size + 'px "Segoe UI", Tahoma, sans-serif';
  const words = String(str).split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}
// CC0 industrial parallax skylines (ansimuz, CC0) — colourised per zone so the
// same art fits all 6 zones + both worlds. see assets/CREDITS.md
const silCache = {};
function silTint(key, zone, mode) {
  const ck = key + zone + (mode || '');
  if (silCache[ck]) return silCache[ck];
  if (typeof MEDIA_IMG === 'undefined' || !MEDIA_IMG[key]) return null;
  const im = MEDIA_IMG[key];
  const cv2 = document.createElement('canvas');
  cv2.width = im.width; cv2.height = im.height;
  const x = cv2.getContext('2d');
  x.drawImage(im, 0, 0);
  const P = PAL[zone];
  if (mode === 'atop') {
    // keep the lit-window detail, just shift the hue toward the zone
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.5;
    x.fillStyle = P.mid; x.fillRect(0, 0, im.width, im.height);
    x.globalAlpha = 0.25; x.fillStyle = P.glow;
    x.fillRect(0, im.height * 0.55, im.width, im.height * 0.45);
  } else {
    // pure silhouette → vertical zone gradient
    x.globalCompositeOperation = 'source-in';
    const g = x.createLinearGradient(0, 0, 0, im.height);
    g.addColorStop(0, P.far); g.addColorStop(1, P.mid);
    x.fillStyle = g; x.fillRect(0, 0, im.width, im.height);
  }
  silCache[ck] = cv2;
  return cv2;
}
function drawParallaxArt(key, zone, px, speed, targetH, baseY, alpha, mode) {
  const cv2 = silTint(key, zone, mode); if (!cv2) return;
  const scale = targetH / cv2.height, w = cv2.width * scale;
  const off = ((px * speed) % w + w) % w;
  c.globalAlpha = alpha;
  for (let x = -off; x < 960 + w; x += w) c.drawImage(cv2, x, baseY - targetH, w, targetH);
  c.globalAlpha = 1;
}
const bgTintCache = {};
function tintedBG(zone) {
  if (bgTintCache[zone]) return bgTintCache[zone];
  if (typeof MEDIA_IMG === 'undefined' || !MEDIA_IMG.bgFar) return null;
  const cv3 = document.createElement('canvas');
  cv3.width = 960; cv3.height = 580;
  const x = cv3.getContext('2d');
  x.drawImage(MEDIA_IMG.bgFar, 0, 0, 960, 580);
  x.globalCompositeOperation = 'multiply';
  x.globalAlpha = 0.85;
  x.fillStyle = PAL[zone].sky[1];
  x.fillRect(0, 0, 960, 580);
  bgTintCache[zone] = cv3;
  return cv3;
}
// ======================= THE ODYSSEY: GREEK SCENERY =======================
// Hand-built layered vistas — marble temples, sailing ships, the underworld —
// each drawn at its own parallax depth so the world slides past in 3D.
function gkTemple(x, base, w, h, front, back, roof, cols) {
  const n = cols || 6, cw = w / (n + 1);
  // stepped stylobate
  c.fillStyle = back; c.fillRect(x - 5, base - 6, w + 10, 6);
  c.fillStyle = front; c.fillRect(x - 2, base - 10, w + 4, 5);
  // fluted columns, lit face + shaded side
  for (let i = 0; i < n; i++) {
    const cx2 = x + cw * (i + 0.5) + cw * 0.25;
    c.fillStyle = front; c.fillRect(cx2, base - 10 - h, cw * 0.5, h);
    c.fillStyle = back; c.fillRect(cx2 + cw * 0.34, base - 10 - h, cw * 0.16, h);
    c.fillStyle = front; c.fillRect(cx2 - 1.5, base - 12 - h, cw * 0.5 + 3, 4);   // capital
  }
  // architrave + pediment
  c.fillStyle = front; c.fillRect(x - 4, base - 18 - h, w + 8, 8);
  c.fillStyle = roof;
  c.beginPath(); c.moveTo(x - 8, base - 18 - h);
  c.lineTo(x + w / 2, base - 18 - h - h * 0.42);
  c.lineTo(x + w + 8, base - 18 - h); c.closePath(); c.fill();
  c.fillStyle = back;
  c.beginPath(); c.moveTo(x + w / 2, base - 18 - h - h * 0.42);
  c.lineTo(x + w + 8, base - 18 - h); c.lineTo(x + w / 2, base - 18 - h); c.closePath(); c.fill();
}
function gkShip(x, y, s, hull, sail, sailSh) {
  c.save(); c.translate(x, y + Math.sin(performance.now() / 1400 + x) * 2.2 * s); c.scale(s, s);
  c.fillStyle = hull;                                  // curved black hull
  c.beginPath(); c.moveTo(-26, 0); c.quadraticCurveTo(0, 13, 26, 0);
  c.quadraticCurveTo(20, 5, -26, 0); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-26, 0); c.lineTo(-31, -9); c.lineTo(-23, -2); c.closePath(); c.fill(); // stern post
  c.strokeStyle = hull; c.lineWidth = 2.4;             // mast
  c.beginPath(); c.moveTo(0, 1); c.lineTo(0, -30); c.stroke();
  const bl = Math.sin(performance.now() / 900 + x) * 2;
  c.fillStyle = sail;                                  // billowing square sail
  c.beginPath(); c.moveTo(-1, -28); c.quadraticCurveTo(19 + bl, -19, -1, -6);
  c.closePath(); c.fill();
  c.fillStyle = sailSh;
  c.beginPath(); c.moveTo(-1, -28); c.quadraticCurveTo(9 + bl, -20, -1, -6); c.closePath(); c.fill();
  c.strokeStyle = hull; c.lineWidth = 1.4;             // oars
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 6, 2); c.lineTo(i * 6 - 3, 9); c.stroke(); }
  c.restore();
}
function gkMountain(x, base, w, h, col, snow) {
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x, base);
  c.lineTo(x + w * 0.32, base - h * 0.82); c.lineTo(x + w * 0.5, base - h);
  c.lineTo(x + w * 0.68, base - h * 0.78); c.lineTo(x + w, base); c.closePath(); c.fill();
  if (snow) {
    c.fillStyle = snow;
    c.beginPath(); c.moveTo(x + w * 0.5, base - h);
    c.lineTo(x + w * 0.62, base - h * 0.8); c.lineTo(x + w * 0.55, base - h * 0.82);
    c.lineTo(x + w * 0.47, base - h * 0.86); c.lineTo(x + w * 0.4, base - h * 0.79); c.closePath(); c.fill();
  }
}
function drawGreekBG(P, px, py, horizon) {
  const zone = G.roomDef.zone, now = performance.now();
  const rep = (span, speed, fn) => {            // repeat a layer across the sky
    const off = ((px * speed) % span + span) % span;
    for (let i = -1; i < 3; i++) fn(i * span - off, i);
  };
  const sea = (yTop, c1, c2, glint) => {
    const sg = c.createLinearGradient(0, yTop, 0, 540);
    sg.addColorStop(0, c1); sg.addColorStop(1, c2);
    c.fillStyle = sg; c.fillRect(0, yTop, 960, 540 - yTop);
    c.strokeStyle = glint; c.lineWidth = 1.6;
    for (let r = 0; r < 9; r++) {
      const yy = yTop + 8 + r * ((540 - yTop) / 9);
      const ph2 = now / 1100 + r * 0.9;
      c.globalAlpha = 0.06 + r * 0.02;
      c.beginPath();
      for (let x = -40; x < 1000; x += 40)
        c.lineTo(x, yy + Math.sin((x + px * (0.1 + r * 0.03)) / 60 + ph2) * (1.4 + r * 0.35));
      c.stroke();
    }
    c.globalAlpha = 1;
  };
  if (zone === 'A' || zone === 'E') {
    // ---- SHORES OF ITHACA / STRAIT OF THE SIRENS: sea, islands, ships ----
    const dusk = zone === 'E';
    const sky = c.createLinearGradient(0, 0, 0, 540);
    if (dusk) { sky.addColorStop(0, '#1a1436'); sky.addColorStop(0.45, '#4a2a5e'); sky.addColorStop(0.75, '#a8577a'); sky.addColorStop(1, '#2a2350'); }
    else { sky.addColorStop(0, '#12325e'); sky.addColorStop(0.4, '#4b86b4'); sky.addColorStop(0.72, '#f0c07a'); sky.addColorStop(1, '#7fb3c8'); }
    c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
    // sun / moon low over the water
    const sunX = 700 - px * 0.02, sunY = horizon - 46;
    c.save(); c.globalCompositeOperation = 'lighter';
    const sg2 = c.createRadialGradient(sunX, sunY, 4, sunX, sunY, 120);
    sg2.addColorStop(0, dusk ? 'rgba(255,235,220,0.9)' : 'rgba(255,240,190,0.95)');
    sg2.addColorStop(0.25, dusk ? 'rgba(255,170,190,0.35)' : 'rgba(255,190,110,0.4)');
    sg2.addColorStop(1, 'rgba(255,180,120,0)');
    c.fillStyle = sg2; c.beginPath(); c.arc(sunX, sunY, 120, 0, 7); c.fill();
    c.fillStyle = dusk ? '#f6e6ee' : '#fff3c8';
    c.beginPath(); c.arc(sunX, sunY, dusk ? 16 : 22, 0, 7); c.fill();
    c.restore();
    // far islands
    rep(620, 0.05, (x) => {
      gkMountain(x + 40, horizon + 6, 300, 92, dusk ? '#2e2450' : '#5c7fa0', null);
      gkMountain(x + 300, horizon + 6, 220, 62, dusk ? '#392c5e' : '#6d90ad', null);
    });
    // headland temple, catching the light
    rep(880, 0.11, (x) => {
      const b = horizon + 10;
      c.fillStyle = dusk ? '#3b2f5f' : '#6f8b6a';
      c.beginPath(); c.moveTo(x + 90, b); c.lineTo(x + 150, b - 46); c.lineTo(x + 250, b - 40); c.lineTo(x + 320, b); c.closePath(); c.fill();
      gkTemple(x + 160, b - 40, 96, 44, dusk ? '#c8b7d8' : '#f2e7cf', dusk ? '#8d7ba8' : '#c9b48c', dusk ? '#e8d9f0' : '#fff6e2', 6);
    });
    sea(horizon + 8, dusk ? '#2b2a63' : '#2f6f96', dusk ? '#140f33' : '#0d3a55',
        dusk ? 'rgba(255,200,220,0.5)' : 'rgba(255,240,200,0.55)');
    // ships sailing the strait
    rep(700, 0.19, (x, i) => {
      gkShip(x + 120, horizon + 54 + (i % 2) * 26, 0.85 + (i % 2) * 0.25,
             dusk ? '#160f2a' : '#2a1c12', dusk ? '#d8c2e8' : '#fdf3dd', dusk ? '#a98cc4' : '#dcc79c');
    });
    rep(520, 0.32, (x) => gkShip(x + 260, horizon + 118, 1.35, dusk ? '#0d0820' : '#1d130c', dusk ? '#c3a8db' : '#f6e6c6', dusk ? '#8f72ad' : '#cbb188'));
  } else if (zone === 'D') {
    // ---- HALLS OF THE DEAD: Hades, the Styx, drifting souls ----
    const sky = c.createLinearGradient(0, 0, 0, 540);
    sky.addColorStop(0, '#05060b'); sky.addColorStop(0.5, '#101828'); sky.addColorStop(1, '#1b2b3a');
    c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
    // vast cavern columns receding into the dark
    rep(760, 0.04, (x) => {
      c.fillStyle = '#141d2c';
      for (let k = 0; k < 4; k++) c.fillRect(x + 60 + k * 180, 0, 46, horizon + 40);
    });
    // the gates of the underworld
    rep(1100, 0.1, (x) => {
      const b = horizon + 20;
      c.fillStyle = '#1d2a3b'; c.fillRect(x + 240, b - 200, 34, 200); c.fillRect(x + 470, b - 200, 34, 200);
      c.fillStyle = '#26374d'; c.fillRect(x + 232, b - 214, 50, 16); c.fillRect(x + 462, b - 214, 50, 16);
      c.fillStyle = '#16212f'; c.fillRect(x + 274, b - 196, 196, 14);
      c.strokeStyle = 'rgba(120,220,190,0.35)'; c.lineWidth = 2;   // cold underworld glow
      c.beginPath(); c.moveTo(x + 274, b - 182); c.lineTo(x + 470, b - 182); c.stroke();
      gkTemple(x + 620, b, 130, 74, '#2c3d52', '#1a2634', '#38506b', 7);
    });
    // the river Styx
    sea(horizon + 30, '#123033', '#050d12', 'rgba(120,255,210,0.4)');
    // souls drifting up out of the water
    for (let i = 0; i < 14; i++) {
      const sx = ((i * 137 - px * 0.16) % 1000 + 1000) % 1000 - 20;
      const sy = horizon + 60 + ((now / 22 + i * 90) % 220);
      const a = 0.5 - ((sy - horizon - 60) / 220) * 0.45;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, a);
      const sg3 = c.createRadialGradient(sx, sy, 0, sx, sy, 12);
      sg3.addColorStop(0, '#b7ffe6'); sg3.addColorStop(1, 'rgba(120,255,210,0)');
      c.fillStyle = sg3; c.beginPath(); c.arc(sx, sy, 12, 0, 7); c.fill();
      c.restore();
    }
    c.globalAlpha = 1;
  } else if (zone === 'C') {
    // ---- FORGE OF THE CYCLOPES: volcano, lava, the great anvils ----
    const sky = c.createLinearGradient(0, 0, 0, 540);
    sky.addColorStop(0, '#1b0a06'); sky.addColorStop(0.45, '#4a1608'); sky.addColorStop(0.8, '#a8390d'); sky.addColorStop(1, '#5e1c07');
    c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
    rep(700, 0.05, (x) => { gkMountain(x + 30, horizon + 10, 380, 150, '#2a1008', null); });
    // erupting cone with a glowing throat
    rep(1000, 0.08, (x) => {
      gkMountain(x + 420, horizon + 10, 300, 190, '#33130a', null);
      c.save(); c.globalCompositeOperation = 'lighter';
      const lg = c.createRadialGradient(x + 570, horizon - 172, 3, x + 570, horizon - 172, 90);
      lg.addColorStop(0, 'rgba(255,220,140,0.85)'); lg.addColorStop(0.4, 'rgba(255,110,30,0.4)');
      lg.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = lg; c.beginPath(); c.arc(x + 570, horizon - 172, 90, 0, 7); c.fill();
      c.restore();
    });
    // colossal forge pillars + anvil silhouettes
    rep(620, 0.16, (x) => {
      c.fillStyle = '#3d1a0c';
      c.fillRect(x + 80, horizon - 120, 40, 160); c.fillRect(x + 380, horizon - 150, 46, 190);
      c.fillStyle = '#5a2a12';
      c.fillRect(x + 70, horizon - 132, 60, 14); c.fillRect(x + 368, horizon - 162, 70, 14);
      c.fillStyle = '#2a1109';
      c.beginPath(); c.moveTo(x + 210, horizon + 20); c.lineTo(x + 226, horizon - 22);
      c.lineTo(x + 300, horizon - 22); c.lineTo(x + 316, horizon + 20); c.closePath(); c.fill();
    });
    // rivers of lava
    sea(horizon + 26, '#e8571a', '#5c1403', 'rgba(255,220,140,0.6)');
    for (let i = 0; i < 12; i++) {
      const ex = ((i * 151 - px * 0.2) % 1010 + 1010) % 1010 - 20;
      const ey = horizon + 30 - ((now / 14 + i * 120) % 300);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.max(0, 0.5 - (horizon + 30 - ey) / 300 * 0.5);
      c.fillStyle = '#ffca6a'; c.beginPath(); c.arc(ex, ey, 2.4, 0, 7); c.fill();
      c.restore();
    }
    c.globalAlpha = 1;
  } else {
    // ---- GROTTO OF CURRENTS / TREASURY OF THE GODS: marble halls ----
    const gold = zone === 'X';
    const sky = c.createLinearGradient(0, 0, 0, 540);
    if (gold) { sky.addColorStop(0, '#241a05'); sky.addColorStop(0.5, '#5c440f'); sky.addColorStop(1, '#8a6a1c'); }
    else { sky.addColorStop(0, '#061426'); sky.addColorStop(0.5, '#0e2f4c'); sky.addColorStop(1, '#155070'); }
    c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
    // deep colonnade receding — three ranks at different depths
    const rank = (span, speed, colF, colB, hgt, yb) => rep(span, speed, (x) => {
      for (let k = 0; k < 5; k++) {
        const cx2 = x + k * (span / 5);
        c.fillStyle = colF; c.fillRect(cx2, yb - hgt, 26, hgt);
        c.fillStyle = colB; c.fillRect(cx2 + 18, yb - hgt, 8, hgt);
        c.fillStyle = colF; c.fillRect(cx2 - 4, yb - hgt - 8, 34, 8);
        c.fillRect(cx2 - 4, yb - 8, 34, 8);
      }
    });
    rank(560, 0.05, gold ? '#6b5316' : '#173d59', gold ? '#4a390e' : '#102b40', 210, horizon + 60);
    rank(460, 0.12, gold ? '#8f6f1e' : '#1f5075', gold ? '#66500f' : '#163a56', 250, horizon + 90);
    rep(700, 0.2, (x) => gkTemple(x + 150, horizon + 110, 190, 120,
        gold ? '#e8c56a' : '#3d7ea8', gold ? '#a8842e' : '#255a80', gold ? '#fff0b8' : '#5aa0c8', 7));
    // shafts of light through the roof
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const bx = ((i * 300 - px * 0.14) % 1300 + 1300) % 1300 - 200;
      const g2 = c.createLinearGradient(bx, 0, bx + 120, 540);
      g2.addColorStop(0, gold ? 'rgba(255,225,140,0.5)' : 'rgba(150,220,255,0.4)');
      g2.addColorStop(1, 'rgba(255,255,255,0)');
      c.globalAlpha = 0.1 + 0.04 * Math.sin(now / 1800 + i);
      c.fillStyle = g2;
      c.beginPath(); c.moveTo(bx, 0); c.lineTo(bx + 80, 0);
      c.lineTo(bx + 210, 540); c.lineTo(bx + 60, 540); c.closePath(); c.fill();
    }
    c.restore(); c.globalAlpha = 1;
  }
  // unified haze so the near playfield separates from the vista
  const haze = c.createLinearGradient(0, horizon - 30, 0, 540);
  haze.addColorStop(0, 'rgba(0,0,0,0)');
  haze.addColorStop(1, P.dark);
  c.globalAlpha = 0.35; c.fillStyle = haze; c.fillRect(0, horizon - 30, 960, 540 - horizon + 30);
  c.globalAlpha = 1;
}
// ================= THE MACHINE DEPTHS: story-built scenery =================
// Every zone shows its own history (see STORY.md): the yards where dead units
// were stripped, the network the virus travelled, the foundry still building
// bodies, the cold archive, the Core's overgrown nest.
function mchCrane(x, base, s, col, dark, swing) {
  c.save(); c.translate(x, base); c.scale(s, s);
  c.fillStyle = dark; c.fillRect(-6, -150, 12, 150);                 // tower
  c.strokeStyle = col; c.lineWidth = 2;
  for (let y = -146; y < -6; y += 18) {                              // lattice
    c.beginPath(); c.moveTo(-6, y); c.lineTo(6, y + 12); c.moveTo(6, y); c.lineTo(-6, y + 12); c.stroke();
  }
  c.save(); c.translate(0, -150); c.rotate(Math.sin(swing) * 0.09);
  c.fillStyle = col; c.fillRect(-20, -6, 96, 7);                     // jib
  c.fillStyle = dark; c.fillRect(-34, -6, 16, 7);                    // counterweight
  c.strokeStyle = dark; c.lineWidth = 1.6;
  const hook = 40 + Math.sin(swing * 0.7) * 16;
  c.beginPath(); c.moveTo(62, 1); c.lineTo(62, hook); c.stroke();
  c.fillStyle = dark; c.fillRect(57, hook, 11, 9);                   // a hull, still being sorted
  c.restore(); c.restore();
}
function mchHull(x, base, s, body, dark, eye) {
  c.save(); c.translate(x, base); c.scale(s, s);
  c.fillStyle = dark;                                                // half-buried torso
  c.beginPath(); c.moveTo(-24, 0); c.quadraticCurveTo(-20, -22, 0, -24);
  c.quadraticCurveTo(22, -22, 26, 0); c.closePath(); c.fill();
  c.fillStyle = body; c.fillRect(-14, -34, 26, 14);                  // head block
  c.fillStyle = dark; c.fillRect(-30, -14, 12, 6); c.fillRect(20, -18, 14, 6); // broken limbs
  if (eye) { c.fillStyle = eye; c.shadowColor = eye; c.shadowBlur = 8; c.fillRect(-6, -30, 10, 4); c.shadowBlur = 0; }
  c.restore();
}
// zone -> cell in the rendered vista atlas (2 cols x 3 rows)
const ZONE_CELL = { A: [0, 0], B: [1, 0], C: [0, 1], D: [1, 1], E: [0, 2], X: [1, 2] };
// zones with a dedicated full-frame vista use it; the gloomy atlas cells stay
// wired underneath for the later stages
const ZONE_VISTA = { A: 'vistaCity', B: 'vistaCrystal' };
// ...and a few rooms own the whole horizon rather than borrowing the kingdom's.
//
// THE GATES WERE A RECTANGLE. They were drawn as a PROP — a full-frame 16:9
// render pasted into the room — so the room had a hard vertical seam down it
// and the backdrop stopped a third of the way from the right, which is exactly
// what it looked like: a photograph laid on the scene rather than the scene
// continuing. A full-frame painting is a BACKDROP. It goes where the backdrop
// goes: behind everything, full bleed, panning with the camera, with no edges.
const ROOM_VISTA = {
  W2: 'gateCity',
  // the crystal cave (quest 1): the mouth in the kingdom's rock, and the view
  // back out of the dark. Both paintings are queued in ART_QUEUE §2c; until
  // they land the rooms borrow their zone's atlas cell, and the depth doors
  // work either way — the walk aims at whatever backdrop is actually there.
  A5: 'caveMouth',
  CV1: 'caveExit',
  // the trader's den (§2g): the one-room workshop painting. Until it lands
  // the room borrows the zone atlas cell like every other unfired vista.
  A0B: 'denInterior',
  // the Oracle's parlor (§2h): mono's data-den behind the cable shrine in B3.
  // Unfired — the room borrows the zone-B atlas cell until the plate lands.
  B3B: 'oracleInterior',
  // the Tinker's forge (§2k): Patch-7's smithy behind the quench hood in C5.
  // Unfired — the room borrows the zone-C atlas cell until the plate lands.
  C5B: 'forgeInterior',
  // the Sage's carrel (§2m): the Nine-Lives Sage's reading den behind the
  // leaning shelf-stacks in D1. Unfired — the room borrows the zone-D atlas
  // cell until the plate lands.
  D1B: 'carrelInterior',
  // the Nymph's hollow (§2o): Lumen's den inside the burst cocoon-pod in E1.
  // Unfired — the room borrows the zone-E atlas cell until the plate lands.
  E1B: 'hollowInterior',
};

// ===========================================================================
// THE POUR — the Foundry's molten iron, running continuously behind the play.
// Not a looping video and not a neon stripe: three ladles tip somewhere up in
// the dark and the metal FALLS. Each stream necks and swells the way a real
// pour does, its skin scrolls downward, drips tear loose at the lip and
// stretch as they accelerate, and the whole thing lands in a churning pool
// that throws light back up the walls. Every phase is a modulo of the clock,
// so it never restarts and never repeats visibly.
// ===========================================================================
const POURS = [
  { x: 160, w: 9, top: -30, len: 296, rate: 0.62, hue: 0 },
  { x: 620, w: 13, top: -30, len: 344, rate: 0.44, hue: 1 },
  { x: 1080, w: 7, top: -30, len: 268, rate: 0.78, hue: 0 },
  { x: 1520, w: 11, top: -30, len: 318, rate: 0.53, hue: 1 },
];
// layered sines: smooth, endlessly varying, and perfectly periodic
function pourWob(a) {
  return Math.sin(a) * 0.55 + Math.sin(a * 2.27 + 1.7) * 0.28 + Math.sin(a * 4.13 + 0.4) * 0.17;
}
function drawLavaFalls(px, py) {
  const t = performance.now() / 1000;
  const PARA = 0.24;                                  // sits deep, behind everything
  c.save();
  // it is FAR AWAY: the pour lights the hall, it does not compete with the
  // fight happening in front of it
  c.globalAlpha = 0.5;
  for (const p of POURS) {
    const sx = p.x - px * PARA;
    if (sx < -140 || sx > 1100) continue;
    const y0 = p.top - py * 0.04, y1 = y0 + p.len;
    // ---- the ladle lip it pours from: a dark spout against the dark ----
    c.fillStyle = 'rgba(14,9,7,0.85)';
    rr(c, sx - p.w * 1.9, y0 - 16, p.w * 3.8, 20, 5); c.fill();
    c.fillStyle = 'rgba(60,32,20,0.7)';
    rr(c, sx - p.w * 1.9, y0 - 16, p.w * 3.8, 5, 3); c.fill();

    // ---- the falling column ----
    // width follows the fall: metal NECKS as it speeds up, then the stream
    // swells again where a fresh surge catches up with it
    const N = 26;
    const L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const q = i / N, yy = y0 + p.len * q;
      const surge = 1 + 0.34 * pourWob(t * 1.15 * p.rate * 6 - q * 5.2 + p.hue * 2.1);
      const neck = 1 / (1 + q * 1.55);                // gravity thins the ribbon
      const w = p.w * neck * surge;
      const cx2 = sx + pourWob(t * 0.5 + q * 2.4 + p.hue) * (5 + q * 13);
      L.push([cx2 - w, yy]); R.push([cx2 + w, yy]);
    }
    const ribbon = () => {
      c.beginPath();
      c.moveTo(L[0][0], L[0][1]);
      for (let i = 1; i <= N; i++) c.lineTo(L[i][0], L[i][1]);
      for (let i = N; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
      c.closePath();
    };
    // dark crust first — the skin that cools on the outside of the stream
    c.globalCompositeOperation = 'source-over';
    ribbon();
    const cg = c.createLinearGradient(0, y0, 0, y1);
    cg.addColorStop(0, 'rgba(120,44,14,0.95)');
    cg.addColorStop(0.5, 'rgba(96,30,10,0.9)');
    cg.addColorStop(1, 'rgba(70,20,8,0.85)');
    c.fillStyle = cg; c.fill();
    // the glowing body, inset so the crust survives at the edges
    c.globalCompositeOperation = 'lighter';
    c.save();
    ribbon(); c.clip();
    const bg2 = c.createLinearGradient(0, y0, 0, y1);
    bg2.addColorStop(0, 'rgba(255,238,190,0.95)');
    bg2.addColorStop(0.28, 'rgba(255,168,60,0.85)');
    bg2.addColorStop(0.72, 'rgba(255,104,26,0.7)');
    bg2.addColorStop(1, 'rgba(206,54,14,0.55)');
    c.fillStyle = bg2;
    c.fillRect(sx - 90, y0, 180, p.len);
    // the skin SCROLLS: bright striations running down the column forever
    c.globalAlpha = 0.5;
    for (let s = 0; s < 9; s++) {
      const ph = ((t * (150 + s * 11) * p.rate + s * 97) % (p.len + 90)) - 45;
      const q = clamp(ph / p.len, 0, 1);
      const w2 = p.w * (1 / (1 + q * 1.55)) * 1.5;
      c.fillStyle = 'rgba(255,246,214,' + (0.16 + 0.2 * (1 - q)) + ')';
      const cx2 = sx + pourWob(t * 0.5 + q * 2.4 + p.hue) * (5 + q * 13);
      rr(c, cx2 - w2 * 0.42, y0 + ph, w2 * 0.84, 12 + q * 26, 6); c.fill();
    }
    c.globalAlpha = 0.5;
    c.restore();

    // ---- drips: they tear off the lip, stretch as they accelerate, and
    // hit the pool. Three staggered so there is always one in the air.
    for (let k = 0; k < 3; k++) {
      const ph = ((t * p.rate * 0.85 + k * 0.37 + p.hue * 0.19) % 1);
      const q = ph * ph;                              // acceleration
      const dy = y0 + 26 + q * (p.len - 26);
      const dx = sx + pourWob(t * 0.5 + q * 2.4 + p.hue) * (5 + q * 13);
      const stretch = 1 + q * 3.6, rad = p.w * 0.42 * (1 - q * 0.35);
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(255,190,90,0.7)';
      c.beginPath(); c.ellipse(dx, dy, rad, rad * stretch, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,246,214,0.75)';
      c.beginPath(); c.ellipse(dx, dy - rad * stretch * 0.25, rad * 0.45, rad * stretch * 0.5, 0, 0, 7); c.fill();
    }

    // ---- the pool it lands in, and the light it throws back ----
    const pw = p.w * 4.2;
    c.globalCompositeOperation = 'lighter';
    const pg2 = c.createRadialGradient(sx, y1, 3, sx, y1, pw);
    pg2.addColorStop(0, 'rgba(255,244,206,0.5)');
    pg2.addColorStop(0.35, 'rgba(255,140,40,0.24)');
    pg2.addColorStop(1, 'rgba(180,40,10,0)');
    c.fillStyle = pg2;
    c.beginPath(); c.ellipse(sx, y1, pw, pw * 0.4, 0, 0, 7); c.fill();
    // ripples rolling out of the impact, endlessly
    for (let r2 = 0; r2 < 3; r2++) {
      const rp = ((t * 0.75 * p.rate + r2 / 3) % 1);
      c.globalAlpha = (1 - rp) * 0.26;
      c.strokeStyle = 'rgba(255,196,110,0.9)'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(sx, y1 + 3, 10 + rp * pw, (10 + rp * pw) * 0.32, 0, 0, 7); c.stroke();
    }
    c.globalAlpha = 0.5;
    // spatter: a few embers kicked up on every impact beat
    for (let s = 0; s < 5; s++) {
      const sp = ((t * 1.5 * p.rate + s * 0.21) % 1);
      const a = -Math.PI / 2 + (s - 2) * 0.42;
      const dist = sp * pw * 0.85;
      c.globalAlpha = (1 - sp) * 0.5;
      c.fillStyle = 'rgba(255,214,140,1)';
      c.fillRect(sx + Math.cos(a) * dist, y1 + Math.sin(a) * dist * 0.7 + sp * sp * 26, 2.5, 2.5);
    }
    c.globalAlpha = 0.5;
    // heat haze standing over the pool — the air itself bending
    c.globalCompositeOperation = 'lighter';
    for (let h = 0; h < 4; h++) {
      const hp = ((t * 0.42 + h * 0.25) % 1);
      c.globalAlpha = (1 - hp) * 0.07;
      const hx = sx + pourWob(t * 1.3 + h * 2) * 22;
      c.fillStyle = 'rgba(255,170,90,1)';
      c.beginPath();
      c.ellipse(hx, y1 - hp * 120, pw * 0.4 * (1 - hp * 0.4), 26 + hp * 40, 0, 0, 7);
      c.fill();
    }
    c.globalAlpha = 0.5;
  }
  c.restore();
  c.globalCompositeOperation = 'source-over';
}
// ---------------------------------------------------------------------------
// THE STRATA BAND — the owner's painted scene strips, hung as a mid-depth
// layer between the vista and the playfield so the kingdoms read as built
// places with real material behind them instead of a flat wash.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// GROUND STRATA. The kingdoms' floors and walls were flat palette fills — one
// colour, one line, all the way across. They are now cut from the owner's
// painted scenes: forge rubble and cooling slag underfoot in the Foundry,
// rimed ice and frozen racks in the Archives. The texture is baked into a
// tile-aligned sheet once, then sampled by WORLD position, so seams never
// show and the same wall never repeats where the eye can catch it.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// THE ROCK. Every solid tile in the game — floor, wall, ceiling — is cut from
// one baked slab per kingdom. Before this, only three zones had any surface at
// all: the other three (including the two you start in) fell through to a flat
// colour with a little noise on it, which is why the ground read as a painted
// rectangle you happened to be standing on.
//
// It is built the way stone actually looks: broken into masses that catch the
// light on their upper faces and fall into shadow underneath, with aggregate,
// fissures and pitting over the top. Baked once per zone, tiled on both axes.
//
// It also gives the hidden blocks somewhere to hide. A secret has to be made of
// the same material as the wall around it or it is not a secret — so the
// breakables below are cut from this same slab, and carry only a hairline tell.
// ---------------------------------------------------------------------------
const ROCK_TW = 256, ROCK_TH = 128;     // both multiples of TILE
const rockCache = {};
const rkHx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function rkMix(a, b, t2) {
  const A = rkHx(a), B = rkHx(b);
  const p = (i) => Math.round(A[i] + (B[i] - A[i]) * t2).toString(16).padStart(2, '0');
  return '#' + p(0) + p(1) + p(2);
}
// THE DRAWN ROCK. One slab per kingdom, and because every solid tile is cut
// from it, six files change the floor, the walls and the ceiling of the whole
// game at once. The bake below stays exactly where it is: art is lazy, so the
// procedural slab is what is on screen until the plate lands, and it is what
// stays on screen if the plate never does (RULE ZERO — the engine never assumes
// it has the good version).
const ROCK_ART = { A: 'rockA', B: 'rockB', C: 'rockC', D: 'rockD', E: 'rockE', X: 'rockX' };

// ---------------------------------------------------------------------------
// A ROOM WITH A ROOF IS NOT THE FIELD OUTSIDE IT (owner, 2026-08-21: "why is
// the terrain inside tent same as outside!").
//
// It was, exactly, and for a reason worth writing down: EVERY ground decision
// in this engine was keyed on the room's ZONE, and an interior room keeps its
// kingdom's zone because it belongs to that kingdom. So Ratchet's workshop —
// walls, roof, bench, hanging lamp — was floored with Scrap Meadows: the
// zone's rock slab, the zone's strata plate, and wire-grass tufts sprouting
// along the boards in the kingdom's own teal. Alien flora was planted in it
// too, by the same rule. Three separate systems all asking the zone and none
// of them asking whether the room has a roof.
//
// The floor is now a property of the ROOM. `indoor` on the room def (js/world.js)
// switches the material to that interior's own — which is the mimic rule the
// owner already set for elevations, applied to the ground they stand on: a
// workshop floor is the workshop's boards, a data-den's is deck plate.
//
// THE PLATES ARE HIGGSFIELD'S. Every key below is queued in ART_QUEUE §2u and
// UNFIRED; floorBake() underneath is the wiring stand-in, and it is deliberately
// a plain worn floor rather than an attempt at art. The keys light up the moment
// the plates are keyed into media.js — nothing else has to change.
const INDOOR_ART = {
  A0B: 'floorDen',        // the Tinker's workshop: oiled boards, swarf, burn marks
  B3B: 'floorParlor',     // the Oracle's data-den: deck plate, cable gutters
  C5B: 'floorForge',      // Patch-7's smithy: slag-crusted plate, quench stains
  D1B: 'floorCarrel',     // the Sage's carrel: dry boards, drifted paper dust
  E1B: 'floorHollow',     // Lumen's hollow: grown chitin, soft and shell-like
};
// The interior's palette, in the same three roles the zone palettes use. Named
// here rather than derived from the zone, because the whole point is that the
// room is not its zone.
// ...and the LIGHT, which turned out to be the loudest half of the complaint.
// The tile layer is finished with a screen wash in ZONE_LIGHT — aerial
// perspective, §9.1, and correct outdoors. Zone A's is [120,190,175]: dead
// teal daylight. Sprayed over the den it neutralised the boards to the same
// grey-green as the meadow AND lit the crest along the whole floor in mint,
// which is the glowing ribbon in the owner's screenshot. A room with a roof is
// not lit by the sky over the kingdom; it is lit by whatever is burning in the
// room, and in Ratchet's case that is one hanging lamp.
const INDOOR_PAL = {
  floorDen:    { base: '#3b3128', join: '#241d16', lit: '#6d5c46', wash: [210, 155, 90],  k: 0.10 },
  floorParlor: { base: '#26303a', join: '#161d25', lit: '#4a5c6e', wash: [110, 150, 210], k: 0.12 },
  floorForge:  { base: '#3a2f2a', join: '#211913', lit: '#6b4f38', wash: [255, 150, 70],  k: 0.14 },
  floorCarrel: { base: '#37312a', join: '#201c17', lit: '#645846', wash: [205, 175, 125], k: 0.10 },
  floorHollow: { base: '#2f3a30', join: '#1a221b', lit: '#586b56', wash: [150, 210, 150], k: 0.12 },
};
function indoorKey() {
  return (G.roomDef && G.roomDef.indoor) ? (INDOOR_ART[G.roomId] || 'floorDen') : null;
}
const floorCache = {};
function floorTex(key) {
  const had = floorCache[key];
  if (had && had._final) return had;
  // the authored plate, IF it has been keyed — asking for a key that media.js
  // does not carry would name a file that is not on disk, which is the one
  // thing the manifest rule forbids
  const named = (typeof MEDIA_SRC !== 'undefined') && MEDIA_SRC.images && MEDIA_SRC.images[key];
  if (named && typeof mediaHas === 'function') {
    if (!mediaHas(key)) { if (typeof mediaFetch === 'function') mediaFetch(key); }
    else {
      const im = MEDIA_IMG[key];
      if (im && (im.naturalWidth || im.width)) {
        if (had && had._img === im) return had;
        const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
        const pv = document.createElement('canvas');
        pv.width = w; pv.height = h;
        pv.getContext('2d').drawImage(im, 0, 0);
        pv._img = im;
        pv._final = (typeof MEDIA_LOW !== 'undefined' && MEDIA_LOW[key] === 3);
        return (floorCache[key] = pv);
      }
    }
  }
  if (had) return had;
  return (floorCache[key] = floorBake(key));
}
// THE STAND-IN. Boards, not rock: bands that run with the floor, joins that
// wander rather than rule (the no-right-angles order holds indoors too), and
// wear pooled where feet and work would put it. One bake per interior, cached.
function floorBake(key) {
  const P = INDOOR_PAL[key] || INDOOR_PAL.floorDen;
  const cv = document.createElement('canvas');
  cv.width = ROCK_TW; cv.height = ROCK_TH;
  const x = cv.getContext('2d');
  let s = 0;
  for (let i = 0; i < key.length; i++) s = (s * 31 + key.charCodeAt(i)) % 99991;
  const rr2 = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  x.fillStyle = P.base; x.fillRect(0, 0, ROCK_TW, ROCK_TH);
  // the boards: horizontal courses of slightly different tone, so the floor
  // reads as laid rather than poured
  const courses = 4;
  for (let i = 0; i < courses; i++) {
    const y = (i * ROCK_TH) / courses;
    x.globalAlpha = 0.10 + rr2() * 0.16;
    x.fillStyle = rr2() > 0.5 ? P.lit : P.join;
    x.fillRect(0, y, ROCK_TW, ROCK_TH / courses);
    // the join between courses WANDERS — a ruled line across a room is the
    // thing the grammar harness keeps finding and the owner keeps seeing
    x.globalAlpha = 0.5;
    x.strokeStyle = P.join; x.lineWidth = 1.2;
    x.beginPath();
    for (let px = 0; px <= ROCK_TW; px += 8) {
      const wy = y + (typeof fbm1 === 'function' ? (fbm1(px * 0.9 + i * 40, 91) - 0.5) * 3 : 0);
      if (px === 0) x.moveTo(px, wy); else x.lineTo(px, wy);
    }
    x.stroke();
  }
  // wear and spills: soft dark pools, then a few bright scratches across them
  x.globalAlpha = 1;
  for (let i = 0; i < 14; i++) {
    const cx2 = rr2() * ROCK_TW, cy2 = rr2() * ROCK_TH, r = 6 + rr2() * 26;
    const gd = x.createRadialGradient(cx2, cy2, 1, cx2, cy2, r);
    gd.addColorStop(0, 'rgba(0,0,0,0.30)');
    gd.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gd;
    x.beginPath(); x.arc(cx2, cy2, r, 0, 7); x.fill();
  }
  for (let i = 0; i < 22; i++) {
    const sx2 = rr2() * ROCK_TW, sy2 = rr2() * ROCK_TH, len = 4 + rr2() * 22;
    x.globalAlpha = 0.10 + rr2() * 0.18;
    x.strokeStyle = P.lit; x.lineWidth = 0.8 + rr2();
    x.beginPath(); x.moveTo(sx2, sy2);
    x.lineTo(sx2 + len, sy2 + (rr2() - 0.5) * 3);
    x.stroke();
  }
  x.globalAlpha = 1;
  cv._final = true;                                   // a bake never improves
  return cv;
}
function rockPlate(zone) {
  const k = ROCK_ART[zone];
  if (!k || typeof mediaHas !== 'function') return null;
  // asking must not be what fetches — see mediaHas in media.js — so the request
  // is made explicitly, once, and the answer is "not yet" until it lands
  if (!mediaHas(k)) { if (typeof mediaFetch === 'function') mediaFetch(k); return null; }
  // NOT through softArt: that pass exists to feather the edge of a CUTOUT so
  // it does not read as a sticker, and a slab has no edge — it is a texture
  // that must join itself. Running it here bought a full extra copy of every
  // slab and 22 ms of work for no visible difference.
  const im = MEDIA_IMG[k];
  return (im && (im.naturalWidth || im.width)) ? im : null;
}

function rockTex(zone) {
  // THE CACHE IS CHECKED FIRST, and that is a hot path, not tidiness: this is
  // called once per solid tile inside drawTiles, so several hundred times per
  // bake. Reaching rockPlate() first meant a mediaHas — and, before the plate
  // landed, a mediaFetch — on every one of them.
  //
  // `_final` means the cache was built from the FULL-SIZE plate, after which
  // nothing can change and the question never has to be asked again.
  const had = rockCache[zone];
  if (had && had._final) return had;
  const plate = rockPlate(zone);
  // Otherwise the cache remembers WHICH IMAGE made it, not merely that an image
  // did: the low-resolution tier lands first and is a real image, so a cache
  // keyed on "art or not" would hold the 128px stand-in for the rest of the
  // session and the full slab would never be drawn.
  if (had && had._img === plate) return had;
  if (plate) {
    const w = plate.naturalWidth || plate.width, h = plate.naturalHeight || plate.height;
    const pv = document.createElement('canvas');
    pv.width = w; pv.height = h;
    pv.getContext('2d').drawImage(plate, 0, 0);
    pv._src = 'art'; pv._img = plate;
    pv._final = (typeof MEDIA_LOW !== 'undefined' && MEDIA_LOW[ROCK_ART[zone]] === 3);
    rockCache[zone] = pv;
    return pv;
  }
  const P = PAL[zone]; if (!P) return null;
  const cv = document.createElement('canvas');
  cv.width = ROCK_TW; cv.height = ROCK_TH;
  const x = cv.getContext('2d');
  let s = zone.charCodeAt(0) * 7919 + 13;
  const R = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  // wrap on BOTH axes: walls repeat vertically, and a mass clipped at the top
  // edge has to come back round at the bottom or the repeat shows up as a hard
  // line across every wall in the game
  const wrap = (fn) => {
    for (const oy of [-ROCK_TH, 0, ROCK_TH]) for (const ox of [-ROCK_TW, 0, ROCK_TW]) {
      x.save(); x.translate(ox, oy); fn(); x.restore();
    }
  };
  const deep = rkMix(P.dark, '#000000', 0.55);      // the shadow it sits in
  const lit = rkMix(P.solid, P.edge, 0.22);         // a face turned to the light
  x.fillStyle = deep; x.fillRect(0, 0, ROCK_TW, ROCK_TH);

  // hewn masses, from a jittered grid so the joints never line up into brick
  const COLS = 6, ROWS = 4, CWx = ROCK_TW / COLS, CHy = ROCK_TH / ROWS;
  const blocks = [];
  for (let r = 0; r < ROWS; r++) for (let ci = 0; ci < COLS; ci++) {
    const bx = (ci + 0.5) * CWx + (R() - 0.5) * CWx * 0.5;
    const by = (r + 0.5) * CHy + (R() - 0.5) * CHy * 0.45;
    const n = 6 + Math.floor(R() * 3), pts = [];
    for (let a = 0; a < n; a++) {
      const ang = (a / n) * Math.PI * 2 + R() * 0.35, rad = 0.56 + R() * 0.5;
      pts.push([bx + Math.cos(ang) * CWx * rad * 1.15, by + Math.sin(ang) * CHy * rad * 1.2]);
    }
    blocks.push({ pts, cy: by, tone: R() });
  }
  for (const b of blocks) {
    const top = Math.min(...b.pts.map(p => p[1])), bot = Math.max(...b.pts.map(p => p[1]));
    wrap(() => {
      x.beginPath();
      b.pts.forEach((p, j) => j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]));
      x.closePath();
      const g = x.createLinearGradient(0, top, 0, bot);
      const base = b.tone > 0.66 ? P.solid : b.tone > 0.33 ? P.mid : P.dark;
      g.addColorStop(0, rkMix(base, lit, 0.5));
      g.addColorStop(0.45, base);
      g.addColorStop(1, rkMix(base, deep, 0.72));
      x.fillStyle = g; x.fill();
      x.strokeStyle = deep; x.globalAlpha = 0.6; x.lineWidth = 1.3; x.stroke();
      x.globalAlpha = 1;
    });
  }
  for (const b of blocks) wrap(() => {          // the lit lip along each upper face
    x.strokeStyle = rkMix(P.edge, '#ffffff', 0.15); x.globalAlpha = 0.16; x.lineWidth = 1.1;
    x.beginPath();
    b.pts.filter(p => p[1] < b.cy).forEach((p, j) => j ? x.lineTo(p[0], p[1] + 1) : x.moveTo(p[0], p[1] + 1));
    x.stroke(); x.globalAlpha = 1;
  });
  for (let i = 0; i < 520; i++) {               // aggregate
    const gx = R() * ROCK_TW, gy = R() * ROCK_TH, gr = 0.9 + R() * 3.1, k = R();
    x.fillStyle = k > 0.86 ? rkMix(P.edge, '#ffffff', 0.3) : k > 0.58 ? rkMix(P.mid, lit, 0.4) : deep;
    x.globalAlpha = k > 0.86 ? 0.16 + R() * 0.2 : 0.2 + R() * 0.38;
    wrap(() => {
      x.beginPath();
      const n = 3 + (i % 3);
      for (let a = 0; a < n; a++) {
        const ang = (a / n) * Math.PI * 2 + i, rad = gr * (0.55 + ((i * 7 + a * 13) % 10) / 13);
        const px = gx + Math.cos(ang) * rad, py = gy + Math.sin(ang) * rad * 0.8;
        a ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.closePath(); x.fill();
    });
  }
  x.globalAlpha = 1;
  for (let i = 0; i < 7; i++) {                 // fissures
    const pts = [[R() * ROCK_TW, R() * ROCK_TH]];
    let ang = (R() - 0.5) + (R() > 0.5 ? 0 : Math.PI);
    for (let k = 0; k < 5 + R() * 4; k++) {
      ang += (R() - 0.5) * 1.25;
      const L = 6 + R() * 17, p0 = pts[pts.length - 1];
      pts.push([p0[0] + Math.cos(ang) * L, p0[1] + Math.sin(ang) * L * 0.6]);
    }
    wrap(() => {
      x.strokeStyle = deep; x.globalAlpha = 0.8; x.lineWidth = 1.1 + R() * 1.7;
      x.beginPath(); pts.forEach((p, j) => j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
      x.strokeStyle = rkMix(P.mid, lit, 0.5); x.globalAlpha = 0.24; x.lineWidth = 0.9;
      x.beginPath(); pts.forEach((p, j) => j ? x.lineTo(p[0] + 1, p[1] - 1.3) : x.moveTo(p[0] + 1, p[1] - 1.3)); x.stroke();
    });
  }
  x.globalAlpha = 1;
  for (let i = 0; i < 110; i++) {               // pitting
    const px = R() * ROCK_TW, py = R() * ROCK_TH, pr = 1.5 + R() * 4.6;
    wrap(() => {
      x.fillStyle = deep; x.globalAlpha = 0.26 + R() * 0.26;
      x.beginPath(); x.ellipse(px, py, pr, pr * 0.74, R() * 3, 0, 7); x.fill();
      x.fillStyle = rkMix(P.mid, lit, 0.55); x.globalAlpha = 0.2;
      x.beginPath(); x.ellipse(px, py - pr * 0.55, pr * 0.72, pr * 0.32, 0, 0, 7); x.fill();
    });
  }
  // Ground should sit UNDER the cast, not compete with it. The kingdom palettes
  // are saturated by design — the Cache is hot magenta, the Foundry is orange —
  // and at full strength the floor read as a bright band rather than as stone.
  // One quiet pass down, so the colour still says which kingdom you are in
  // while the value says "this is rock, the character is what matters".
  x.globalAlpha = 0.14; x.fillStyle = '#000'; x.fillRect(0, 0, ROCK_TW, ROCK_TH);
  x.globalAlpha = 1;
  cv._src = 'proc'; cv._img = null;
  rockCache[zone] = cv;
  return cv;
}

// ===========================================================================
// THE CEILING. The floors have been authored for a while; above her head there
// was nothing at all — the top of every room was the same flat tile as the
// walls, in every kingdom, which is why the rooms read as cross-sections
// rather than as places. A room you are INSIDE has something over you, and it
// is doing something.
//
// Two halves, deliberately:
//
//   THE PLATE   an authored strip per kingdom, hung from the top, drawn at two
//               depths — a dark far layer that barely moves and a near layer on
//               full parallax — so the ceiling has thickness rather than being
//               a sticker.
//   THE WEATHER what that ceiling DOES, drawn procedurally over it and
//               different in every kingdom: the Foundry beads and drips molten
//               metal that falls and cools on the floor, the Archives grow
//               icicles and shed snow, the Conduits arc and flicker, the
//               Meadows drip condensation and their little service robots twitch
//               on their clamps, the Nest breathes spores. It is the same
//               principle as the enemy tells — a place is alive if it is
//               DOING something on its own clock, not if it is merely detailed.
// ===========================================================================
const CEIL = { A: 'ceilA', B: 'ceilB', C: 'ceilC', D: 'ceilD', E: 'ceilE', X: 'ceilX' };
const CEIL_TW = 512, CEIL_TH = 152;
const ceilCache = {};
function ceilTex(zone) {
  const key = CEIL[zone];
  if (!key) return null;
  if (ceilCache[zone] !== undefined) return ceilCache[zone];
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[key];
  if (!im || !im.naturalWidth) return null;         // retry next frame
  const cv = document.createElement('canvas');
  cv.width = CEIL_TW; cv.height = CEIL_TH;
  const x = cv.getContext('2d');
  x.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight, 0, 0, CEIL_TW, CEIL_TH);
  // mirror-blend the right edge into the left so the horizontal wrap is seamless
  x.save();
  x.globalCompositeOperation = 'source-over';
  const gx = x.createLinearGradient(CEIL_TW - 90, 0, CEIL_TW, 0);
  gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out';
  x.fillStyle = gx; x.fillRect(CEIL_TW - 90, 0, 90, CEIL_TH);
  x.globalCompositeOperation = 'source-over';
  x.save(); x.scale(-1, 1);
  x.drawImage(cv, 0, 0, 90, CEIL_TH, -CEIL_TW, 0, 90, CEIL_TH);
  x.restore();
  // and fade the underside so it sits into the room instead of ending in a line
  x.globalCompositeOperation = 'destination-out';
  const gy = x.createLinearGradient(0, CEIL_TH - 54, 0, CEIL_TH);
  gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(1, 'rgba(0,0,0,1)');
  x.fillStyle = gy; x.fillRect(0, CEIL_TH - 54, CEIL_TW, 54);
  x.restore();
  ceilCache[zone] = cv;
  return cv;
}
function drawCeiling(zone) {
  const tex = ceilTex(zone);
  if (!tex) return;
  const P = PAL[zone];
  const tier = typeof QUAL !== 'undefined' ? QUAL.ceil : 2;
  if (tier <= 0) return;
  // FAR: slow, dark, and wide — the thickness of the roof
  if (tier >= 2) {
    c.save();
    c.globalAlpha = 0.55;
    const fx = -((cam.x * 0.35) % CEIL_TW), fy = -cam.y * 0.22 - 26;
    for (let x0 = fx - CEIL_TW; x0 < 960 + CEIL_TW; x0 += CEIL_TW)
      c.drawImage(tex, x0, fy, CEIL_TW, CEIL_TH * 1.18);
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, 960, CEIL_TH * 1.18 + fy);
    c.restore();
  }
  // NEAR: on the room's own parallax, so it belongs to the geometry
  c.save();
  const nx = -((cam.x * 0.92) % CEIL_TW), ny = -cam.y * 0.92 - 8;
  for (let x0 = nx - CEIL_TW; x0 < 960 + CEIL_TW; x0 += CEIL_TW)
    c.drawImage(tex, x0, ny, CEIL_TW, CEIL_TH);
  // the kingdom's own light spilling down off it
  c.globalCompositeOperation = 'lighter';
  const g2 = c.createLinearGradient(0, ny + CEIL_TH * 0.55, 0, ny + CEIL_TH + 40);
  g2.addColorStop(0, 'rgba(0,0,0,0)');
  g2.addColorStop(0.6, (P && P.glow ? P.glow : '#37ffd0') + '22');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g2; c.fillRect(0, ny + CEIL_TH * 0.55, 960, CEIL_TH * 0.5 + 40);
  c.restore();
}
// ---------------------------------------------------------------------------
// WHAT THE ROOF IS DOING. One list per room, refilled as things land, drawn
// under the near ceiling plate so drips emerge from inside it. Everything here
// is cosmetic on purpose — a place that can kill you from above is a hazard,
// and hazards are designed, placed and telegraphed. This is weather.
// ---------------------------------------------------------------------------
let CEILFX = [], ceilT = 0, ceilRobot = 0;
function ceilReset() { CEILFX = []; ceilT = 0; }
function ceilWeather(dt, zone) {
  if (!PAL[zone]) return;
  ceilT += dt; ceilRobot += dt;
  const W = G.roomDef.w * TILE;
  const cap = typeof QUAL !== 'undefined' ? QUAL.weather : 90;
  if (cap <= 0) return;
  const push = (o) => { if (CEILFX.length < cap) CEILFX.push(o); };
  const spawnX = () => cam.x + rnd(-80, 1040);
  // ---- each kingdom sheds something different ----
  if (zone === 'C' && chance(dt * 2.2)) {
    // the Foundry beads, hangs, stretches, and lets go
    push({ k: 'melt', x: spawnX(), y: 0, vy: 0, t: 0, hang: rnd(0.5, 1.4), r: rnd(2.4, 4.2) });
  } else if (zone === 'D' && chance(dt * 3.2)) {
    // the Archives shed: snow that drifts, and once in a while a whole icicle
    push(chance(0.12)
      ? { k: 'icicle', x: spawnX(), y: 0, vy: 0, t: 0, hang: rnd(0.8, 2.2), len: rnd(14, 30) }
      : { k: 'snow', x: spawnX(), y: rnd(-20, 40), vy: rnd(26, 54), vx: rnd(-16, 16), t: 0, r: rnd(1.2, 2.6) });
  } else if (zone === 'B' && chance(dt * 1.6)) {
    // the Conduits arc between cable bundles
    push({ k: 'arc', x: spawnX(), y: rnd(10, 46), t: 0, life: rnd(0.12, 0.26), w: rnd(30, 90) });
  } else if (zone === 'A' && chance(dt * 1.5)) {
    // the Meadows drip condensation off the vines
    push({ k: 'drip', x: spawnX(), y: 0, vy: 0, t: 0, hang: rnd(0.4, 1.6), r: rnd(1.6, 2.6) });
  } else if (zone === 'E' && chance(dt * 2.6)) {
    // the Nest breathes
    push({ k: 'spore', x: spawnX(), y: rnd(20, 70), vy: rnd(-6, 16), vx: rnd(-10, 10), t: 0, r: rnd(1.6, 3.4) });
  } else if (zone === 'X' && chance(dt * 1.1)) {
    push({ k: 'glint', x: spawnX(), y: rnd(14, 60), t: 0, life: rnd(0.5, 1.1) });
  }
  const floorY = (G.roomDef.h - 2) * TILE;
  for (let i = CEILFX.length - 1; i >= 0; i--) {
    const o = CEILFX[i];
    o.t += dt;
    if (o.k === 'melt' || o.k === 'drip' || o.k === 'icicle') {
      if (o.hang > 0) { o.hang -= dt; }            // gathering, still attached
      else { o.vy += 1500 * dt; o.y += o.vy * dt; }
      if (o.y > floorY - CEIL_TH + 40) {
        // it lands, and what it does when it lands is the point
        if (o.k === 'melt') {
          for (let q = 0; q < 5; q++)
            addPart(o.x + rnd(-6, 6), o.y + CEIL_TH - 20, rnd(-70, 70), rnd(-120, -30), 0.4, '#ff9a4a', 2.2, 900, true);
        } else if (o.k === 'icicle') {
          for (let q = 0; q < 7; q++)
            addPart(o.x + rnd(-8, 8), o.y + CEIL_TH - 20, rnd(-110, 110), rnd(-90, -20), 0.45, '#dff4ff', 2.4, 800, true);
          if (typeof sfx === 'function' && Math.abs(o.x - (player ? player.x : 0)) < 420) sfx('edie');
        } else {
          for (let q = 0; q < 3; q++)
            addPart(o.x + rnd(-3, 3), o.y + CEIL_TH - 20, rnd(-40, 40), rnd(-60, -10), 0.3, '#9fe8ff', 1.6, 700, true);
        }
        CEILFX.splice(i, 1); continue;
      }
    } else if (o.k === 'snow' || o.k === 'spore') {
      o.y += o.vy * dt; o.x += o.vx * dt + Math.sin(ceilT * 1.4 + o.x) * 6 * dt;
      if (o.y > 300 || o.t > 9) { CEILFX.splice(i, 1); continue; }
    } else if (o.t > (o.life || 1)) { CEILFX.splice(i, 1); continue; }
  }
}
function drawCeilWeather(zone) {
  if (!CEILFX.length) return;
  c.save();
  for (const o of CEILFX) {
    const x = o.x - cam.x, yTop = -cam.y * 0.92 - 8;
    if (o.k === 'melt' || o.k === 'drip') {
      const hot = o.k === 'melt';
      const y = yTop + CEIL_TH - 34 + (o.hang > 0 ? 0 : o.y);
      const stretch = o.hang > 0 ? 1 + (1 - clamp(o.hang, 0, 1)) * 2.2 : 2.6;
      c.fillStyle = hot ? '#ffb257' : '#9fe8ff';
      c.shadowColor = hot ? '#ff7a2a' : '#6fd0ff'; c.shadowBlur = hot ? 10 : 5;
      c.beginPath(); c.ellipse(x, y, o.r, o.r * stretch, 0, 0, 7); c.fill();
      c.shadowBlur = 0;
    } else if (o.k === 'icicle') {
      const y = yTop + CEIL_TH - 40 + (o.hang > 0 ? 0 : o.y);
      c.fillStyle = 'rgba(223,244,255,0.85)';
      c.beginPath(); c.moveTo(x - 3.5, y); c.lineTo(x + 3.5, y); c.lineTo(x, y + o.len); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 0.8; c.stroke();
    } else if (o.k === 'snow') {
      c.globalAlpha = 0.75; c.fillStyle = '#eaf6ff';
      c.beginPath(); c.arc(x, yTop + CEIL_TH - 30 + o.y, o.r, 0, 7); c.fill();
      c.globalAlpha = 1;
    } else if (o.k === 'spore') {
      c.globalAlpha = 0.55 + Math.sin(ceilT * 3 + o.x) * 0.25;
      c.fillStyle = '#e08aff'; c.shadowColor = '#d94aff'; c.shadowBlur = 8;
      c.beginPath(); c.arc(x, yTop + CEIL_TH - 30 + o.y, o.r, 0, 7); c.fill();
      c.shadowBlur = 0; c.globalAlpha = 1;
    } else if (o.k === 'arc') {
      const a = 1 - o.t / (o.life || 1);
      c.globalAlpha = a; c.strokeStyle = '#9fd8ff'; c.lineWidth = 1.6;
      c.shadowColor = '#4db8ff'; c.shadowBlur = 12;
      c.beginPath();
      let px2 = x, py2 = yTop + o.y;
      c.moveTo(px2, py2);
      for (let k = 0; k < 4; k++) { px2 += o.w / 4; py2 += rnd(-9, 9); c.lineTo(px2, py2); }
      c.stroke(); c.shadowBlur = 0; c.globalAlpha = 1;
    } else if (o.k === 'glint') {
      const a = Math.sin(o.t / (o.life || 1) * Math.PI);
      c.globalAlpha = a * 0.9; c.fillStyle = '#ffd0ee';
      c.shadowColor = '#ff5ec8'; c.shadowBlur = 14;
      c.beginPath(); c.arc(x, yTop + o.y + 30, 2.2, 0, 7); c.fill();
      c.shadowBlur = 0; c.globalAlpha = 1;
    }
  }
  c.restore();
}
// ===========================================================================
// THE FRINGE — what grows on the edge of the world, and why it is drawn LAST.
//
// A tile grid ends in perfectly straight lines: every floor is a ruler, every
// ledge a machined step, and the eye reads the whole room as a diagram of
// rectangles because that is exactly what it is. No amount of texture INSIDE a
// tile fixes that, because the giveaway is not the surface, it is the boundary.
//
// So the boundary gets something growing out of it — grass and vine on the
// Meadows, cable ends in the Conduits, slag crust in the Foundry, frost teeth
// in the Archives, fronds in the Nest, shards in the Crystal. Deterministic
// per tile (hash2 on the tile coordinate), so it is stable across frames and
// across visits, and built once per room into an offscreen layer that is then
// a single blit.
//
// AND IT IS DRAWN OVER THE CHARACTER. That is the whole trick and it is worth
// being explicit about: the fringe rises above the floor line, she stands ON
// the floor line, so the last few pixels of her feet pass BEHIND it. Nothing
// about her movement changes — she is not standing in anything, there is no
// collision here at all — but the eye stops reading her as a sticker laid on
// top of a diagram and starts reading the floor as having a near edge and a
// far one. Depth for the price of a draw order.
//
// It is deliberately kept off hazards: a spike whose tip is dressed in grass is
// a spike that killed you unfairly.
// ===========================================================================
const FRINGE_UP = 13;                    // how far above a tile top it may reach
const FRINGE_KIND = { A: 'grass', B: 'cable', C: 'slag', D: 'frost', E: 'frond', X: 'shard' };
// ===========================================================================
// EVERY KINGDOM OWNS ITS OWN ROCK (owner's terrain spec, 2026-08-17).
//
// The §10 grammar shipped as ONE grammar: the same wave, the same crest, the
// same hang, in all six kingdoms. That is the defect the spec names — the
// silhouette stopped being straight everywhere at once, and in doing so it
// became uniform, which is its own kind of flat. A kingdom is told by what
// its edges are MADE of, so the numbers and the decoration are per zone:
//
//   rough  how far the fBm wave sinks the silhouette (§10.1's "4-12px")
//   lip    crest depth in px (§10.3 wants irregular, not thin)
//   skirt  under-hang reach (§10.3's 8-24)
//   crack  fracture density on exposed faces
//   edge   what grows ON the crest      — the kingdom's signature at eye level
//   hang   what the under-hang is MADE of
//
// Values are the spec's, with two deliberate departures recorded where they
// are made: the crack test is hashed rather than Math.random (a per-frame
// random would flicker the cached layer on every re-render — the exact bug
// the seed exists to prevent), and the decoration is painted into the cached
// tile canvas rather than per frame, so none of it costs anything at 60fps.
// ===========================================================================
const TERRAIN_THEME = {
  A: { rough: 6,  lip: 4, skirt: 12, crack: 0.30, edge: 'glow',    hang: 'plates'   },
  B: { rough: 8,  lip: 5, skirt: 18, crack: 0.50, edge: 'crystal', hang: 'roots'    },
  C: { rough: 10, lip: 6, skirt: 20, crack: 0.40, edge: 'molten',  hang: 'slag'     },
  D: { rough: 7,  lip: 5, skirt: 16, crack: 0.20, edge: 'ice',     hang: 'frost'    },
  // E AND X WERE SWAPPED, inherited from a brief written without this repo in
  // front of it. That brief's zone list belongs to another game — it has E as a
  // prism facility and X as a void. Here E is THE VIRUS NEST (ZONE_LIGHT:
  // "infection red") and X is the CRYSTAL CACHE ("prism glow"), so the table
  // was giving the Nest cracked glass panels and the Cache hanging flesh.
  // The owner's own standing instruction is to preserve existing lore, names
  // and zone themes; these two now match the world they are drawing.
  E: { rough: 12, lip: 4, skirt: 24, crack: 0.80, edge: 'flesh',   hang: 'tendrils' },
  X: { rough: 5,  lip: 3, skirt: 10, crack: 0.15, edge: 'prism',   hang: 'glass'    },
};
// AN INTERIOR IS NOT A LANDSCAPE (owner, 2026-08-21: "why is the terrain inside
// tent same as outside!"). The material was already the painting's own floor —
// drawInteriorFloor lays the den's boards over the tile layer — so what he was
// reading as "the same" is the SHAPE, and the shape came from this table.
//
// Every number here is per ZONE, and an interior room keeps its kingdom's zone
// because it belongs to that kingdom. So Ratchet's workshop got the Scrap
// Meadows' terrain grammar: a 6px eroded ridge, a 4px scalloped crest, and 12px
// of material hanging off the underside — a rock outcrop, drawn under a roof,
// beside a workbench. The floor of a room is not weathered by anything. It is
// swept, it is worn where feet fall, and its edge is a skirting rather than a
// crest, so all four numbers go down and nothing grows on it.
//
// It does NOT go to zero: the no-right-angles order is global, and a floor
// ruled straight across a room is exactly what that order forbids. Two pixels
// of wander is a laid floor; six is a cliff.
const TERRAIN_INDOOR = {
  rough: 2, lip: 2, skirt: 0, crack: 0.10, edge: 'none', hang: 'plates',
  // ...and the lip does not GLOW. Outdoors that two-pixel fringe into the air
  // above the crest is doing real work — it is how the walk line reads at a
  // glance in the dark rooms without the light pass having to shout. Indoors it
  // is a strip light buried in the floorboards, and it traced the workshop's
  // ground in the kingdom's own teal, following the terrain contour: the single
  // loudest reason the den read as the meadow with a roof on it.
  noGlow: 1,
};
function terrainTheme() {
  if (G.roomDef && G.roomDef.indoor) return TERRAIN_INDOOR;
  return TERRAIN_THEME[G.roomDef && G.roomDef.zone] || TERRAIN_THEME.A;
}
let fringeCv = null, fringeDirty = true;
function fringeMark() { fringeDirty = true; }
function buildFringe() {
  const g = G.grid; if (!g || !g[0]) return;
  const W = g[0].length * TILE, H = g.length * TILE;
  if (!fringeCv || fringeCv.width !== W || fringeCv.height !== H) {
    fringeCv = document.createElement('canvas'); fringeCv.width = W; fringeCv.height = H;
  }
  const x = fringeCv.getContext('2d');
  x.clearRect(0, 0, W, H);
  const zone = G.roomDef.zone, P = PAL[zone] || PAL.A;
  // no lawn indoors (owner, 2026-08-16): a workshop floor grows shavings and
  // dropped scrap, not grass — the interior rooms swap to the scrap kind
  const kind = (typeof interiorVista === 'function' && interiorVista())
    ? 'scrap' : (FRINGE_KIND[zone] || 'grass');
  // fewer blades on a machine that is already struggling; the silhouette break
  // survives at three, the lushness does not
  const per = (typeof QUAL !== 'undefined' && !QUAL.glow) ? 3 : 5;
  // THE COASTLINE THE BLADES GROW ON IS THE ONE THAT IS DRAWN. The surface
  // curve lifts the painted silhouette as much as 46px above the tile line;
  // rooting the fringe on the tile line instead put every snow crust and every
  // blade on a second horizon BELOW the visible one, so the picture had two
  // ground lines — a rolling one made of rock and a ruled one made of snow.
  // The straight one is the one the eye finds. Reading the curve here costs
  // nothing: it is cached per room and this canvas is cached too.
  const cur = (typeof surfaceCurve === 'function') ? surfaceCurve() : null;
  const curveY = (wx) => {
    if (!cur) return null;
    const i = Math.round(wx / SURF_STEP);
    if (i < 0 || i >= cur.N) return null;
    const v = cur.y[i];
    return isNaN(v) ? null : v;
  };
  const solid = ch => ch === '#' || ch === '=' || ch === 'B';
  for (let ty = 0; ty < g.length; ty++) for (let tx = 0; tx < g[0].length; tx++) {
    const ch = tileAt(tx, ty);
    if (!solid(ch)) continue;
    const up = tileAt(tx, ty - 1);
    if (solid(up) || up === '^' || up === 'v') continue;   // buried, or wearing a hazard
    const X = tx * TILE, Y = ty * TILE;
    for (let i = 0; i < per; i++) {
      const r1 = hash2(tx * 7 + i, ty * 13 + 1), r2 = hash2(tx * 3 + i, ty * 11 + 5);
      const bx = X + (i + 0.5) * (TILE / per) + (r1 - 0.5) * (TILE / per) * 0.8;
      const hgt = 4 + r2 * (FRINGE_UP - 4);
      const lean = (r1 - 0.5) * 6;
      // the fringe grows out of the ERODED surface, not the tile line: the
      // same wave the erosion pass sinks the silhouette with (seed 641), so
      // every blade root and crust pool rides the terrain's actual coastline.
      // A shared flat baseline was the last ruler the floor had — hundreds of
      // crust bottoms all sitting on Y+3 add up to one straight line.
      // the curve owns the ground; a floating deck is nowhere near it, so a
      // sample that lands more than a tile and a half away is not this tile's
      // surface and the tile line stays the fallback.
      const cy = curveY(bx);
      const gY = (cy != null && Math.abs(cy - Y) < TILE * 1.5) ? cy + 2
        : Y + (typeof fbm1 === 'function' ? Math.round(fbm1(bx, 641) * 10) : 0);
      // NOT A LAWN. One species at one height on even spacing reads as a comb,
      // and the eye flags a perfect fringe as fake in well under a second — the
      // same failure the tile repeats had, one scale down. A verge is clumps
      // and gaps, so a sixth of the blades simply never grew here.
      const r3 = hash2(tx * 5 + i * 3, ty * 7 + 2);
      if (r3 < 0.16) continue;
      x.save();
      if (kind === 'grass' || kind === 'frond') {
        // a few greens, not one: the hue walks blade to blade, and a rare tuft
        // stands half again as tall as its neighbours
        const greens = ['#527c40', '#5e8f4a', '#6da054'];
        x.strokeStyle = kind === 'frond' ? (r3 < 0.5 ? '#8f4fb0' : '#7d44a0')
          : greens[Math.floor(r3 * 5.9) % 3];
        x.globalAlpha = 0.55 + r2 * 0.4;
        x.lineWidth = 1.6 + r1 * 1.2; x.lineCap = 'round';
        const hgt2 = hgt * (r2 > 0.86 ? 1.5 : 1);
        x.beginPath(); x.moveTo(bx, gY + 3);
        x.quadraticCurveTo(bx + lean * 0.5, gY - hgt2 * 0.6, bx + lean, gY - hgt2);
        x.stroke();
        if (r1 > 0.72) {                       // a seed head / spore pod
          x.fillStyle = kind === 'frond' ? '#e08aff' : '#b8d86a';
          x.beginPath(); x.arc(bx + lean, gY - hgt2, 1.6 + r2, 0, 7); x.fill();
        }
      } else if (kind === 'cable') {
        x.strokeStyle = '#1a2b38'; x.globalAlpha = 0.85;
        x.lineWidth = 2 + r1 * 1.6; x.lineCap = 'round';
        x.beginPath(); x.moveTo(bx, gY + 4);
        x.quadraticCurveTo(bx + lean, gY - hgt * 0.5, bx + lean * 1.6, gY - hgt * 0.7);
        x.stroke();
        if (r2 > 0.66) {                       // a live end, still lit
          x.fillStyle = P.glow; x.globalAlpha = 0.7;
          x.beginPath(); x.arc(bx + lean * 1.6, gY - hgt * 0.7, 1.4, 0, 7); x.fill();
        }
      } else if (kind === 'slag') {
        x.fillStyle = r2 > 0.8 ? '#ff8a3a' : '#3a2418';
        x.globalAlpha = 0.8;
        x.beginPath();                          // a crust lump, not a blade
        x.moveTo(bx - 3 - r1 * 3, gY + 2);
        x.quadraticCurveTo(bx, gY - hgt * 0.7, bx + 3 + r2 * 3, gY + 2);
        x.closePath(); x.fill();
      } else if (kind === 'frost') {
        // NOT TEETH. The first version drew rime as upward triangles in almost
        // exactly the spike palette, on a floor that elsewhere carries real
        // spike strips — a decoration that impersonates a hazard, which is the
        // one thing scenery must never do. Rime is a rounded crust that pools
        // and sags; it is drawn as such, and low.
        // rime POOLS — it does not carpet. A crust drawn at every blade slot
        // merges into one continuous bright mass whose coastline the grammar
        // harness (and the eye) reads as a line; real rime collects where the
        // surface dips and leaves bare rock between. The same wave that sinks
        // the silhouette decides where it pools, so the gaps land in the
        // hollows' shoulders.
        if (typeof fbm1 === 'function' && fbm1(bx, 651) < 0.35) { x.restore(); continue; }
        const hh = Math.min(hgt, 8);
        x.fillStyle = '#dff0fb'; x.globalAlpha = 0.5 + r2 * 0.3;
        x.beginPath();
        x.moveTo(bx - 4 - r1 * 3, gY + 3);
        x.quadraticCurveTo(bx + lean * 0.3, gY - hh, bx + 4 + r2 * 3, gY + 3);
        x.closePath(); x.fill();
        if (r1 > 0.8) {                         // and a bead of melt hanging off
          x.globalAlpha = 0.4;
          x.beginPath(); x.ellipse(bx + lean * 0.3, gY + 5, 1.4, 2.6, 0, 0, 7); x.fill();
        }
      } else if (kind === 'scrap') {
        // indoors: shavings and dropped bits, sparse and low — floor clutter
        // a tinker actually makes, not vegetation
        if (r2 < 0.55) { x.restore(); continue; }
        const hh = Math.min(hgt * 0.5, 5);
        x.fillStyle = r1 > 0.85 ? '#8a6a3a' : '#241c14';
        x.globalAlpha = 0.55 + r2 * 0.3;
        x.beginPath();                          // a curl of swarf / a dropped nut
        x.moveTo(bx - 2 - r1 * 2.5, gY + 2);
        x.quadraticCurveTo(bx + lean * 0.4, gY - hh, bx + 2 + r2 * 2.5, gY + 2);
        x.closePath(); x.fill();
        if (r1 > 0.9) {                         // one glint of brass in the dark
          x.fillStyle = '#c8a04a'; x.globalAlpha = 0.5;
          x.beginPath(); x.arc(bx + lean * 0.4, gY - 1, 1.1, 0, 7); x.fill();
        }
      } else {                                  // shard — same rule: never a spike
        const hh = Math.min(hgt, 9);
        x.fillStyle = '#ffb0e6'; x.globalAlpha = 0.28 + r2 * 0.3;
        x.beginPath();                          // a leaning splinter, not a cone
        x.moveTo(bx - 2.6, gY + 2);
        x.lineTo(bx + lean * 1.4 - 1, gY - hh);
        x.lineTo(bx + lean * 1.4 + 1.6, gY - hh * 0.72);
        x.lineTo(bx + 2.2, gY + 2);
        x.closePath(); x.fill();
      }
      x.restore();
    }
    // and the horizontal line itself, chipped: a few pixels of the tile's own
    // top edge bitten away so the ruler stops being a ruler
    x.save();
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 3; i++) {
      const r = hash2(tx * 5 + i, ty * 17 + 3);
      if (r < 0.45) continue;
      x.beginPath(); x.arc(X + r * TILE, Y + 1, 1.2 + r * 1.6, 0, 7); x.fill();
    }
    x.restore();
  }
  fringeDirty = false;
}
function drawFringe() {
  if (typeof QUAL !== 'undefined' && QUAL.ceil <= 0) return;
  if (fringeDirty) buildFringe();
  if (fringeCv) c.drawImage(fringeCv, 0, 0);
}
const STRATA = { C: 'strataLava', D: 'strataIceB', E: 'strataRubble' };
const STRATA_TW = 512, STRATA_TH = 160;         // both multiples of TILE
const strataCache = {};
function strataTex(zone) {
  const key = STRATA[zone];
  if (!key) return null;
  if (strataCache[zone] !== undefined) return strataCache[zone];
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[key];
  if (!im || !im.naturalWidth) return null;       // retry next frame
  const cv = document.createElement('canvas');
  cv.width = STRATA_TW; cv.height = STRATA_TH;
  const x = cv.getContext('2d');
  x.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight, 0, 0, STRATA_TW, STRATA_TH);
  // mirror-blend the right edge into the left so the horizontal wrap is seamless
  x.save();
  const g2 = x.createLinearGradient(STRATA_TW - 96, 0, STRATA_TW, 0);
  g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out';
  x.fillStyle = g2; x.fillRect(STRATA_TW - 96, 0, 96, STRATA_TH);
  x.globalCompositeOperation = 'destination-over';
  x.translate(STRATA_TW, 0); x.scale(-1, 1);
  x.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight, 0, 0, STRATA_TW, STRATA_TH);
  x.restore();
  strataCache[zone] = cv;
  return cv;
}


// ===========================================================================
// PURIFICATION CUTSCENES. Some guardians do not blow apart when they lose —
// they get an authored film instead. The final blow freezes the room, the
// clip plays, and when it fades the creature is standing there freed, moving
// around as your pet. No smoke, no wreckage: the film IS the death.
// A hard timeout and an error path guarantee this can never trap the player.
// ===========================================================================
const PURIFY_VID = {
  // THE FORGING — §1d's film: Ratchet at his anvil, the shard, the chest
  // crystal, ending on the same white flare the grant flashes. It supersedes
  // sword_gift.mp4 (the tight handover close-up), which stays on disk as good
  // work but is no longer the moment the quest pays off on.
  // THE MEMORY — the den wake already asks for this film by name and has
  // done since the wake was written; it just had no file. It is what he
  // tells her the moment his cell is back in: the workshop floor, the Song
  // taking every machine in the room, his chest crystal burning it out of
  // him, and the cable he pulled himself. It replaced 687 characters of
  // speech bubble, which is the owner's own instruction — 'npc story should
  // be short generated video'.
  memory: 'assets/video/memory.mp4',
  gift: 'assets/video/sword_forge.mp4',
  glitch: 'assets/video/purify_glitch.mp4', // NULLFANG      - the lion
  brood: 'assets/video/purify_brood.mp4',   // TALONHOST     - the eagle
  zero: 'assets/video/purify_zero.mp4',     // GLACIERE      - the unicorn
  atlas: 'assets/video/purify_atlas.mp4',   // FURNACE CHOIR - the dragon
  prism: 'assets/video/purify_prism.mp4',   // PRISM PROWLER - the cat
};
// ---------------------------------------------------------------------------
// THE TRUE ENDING, CUT TO WHAT THE PLAYER ACTUALLY DID.
//
// One wide shot of everybody happy is a lie in a game where you were asked,
// five times, whether a creature gets to live. So the ending is not a film —
// it is a REEL. An opener and a closer that always play, and one short solo
// vignette per guardian that plays only if that guardian is still alive.
//
// Every vignette is the same meadow at the same hour, shot as a slow left-to-
// right dolly at the same height and speed, with no other guardian and no HZD-99
// in frame. That is what makes them cuttable: any subset, in order, joins into
// one continuous travelling move. A player who spared nobody gets the same
// sunrise and the same last frame over an emptier field — which is the honest
// version of what they chose, not a punishment.
// ---------------------------------------------------------------------------
// The order they cut in. Only the clips actually present in assets/video/ get
// registered — the build scans the directory and hands the list over — so a
// reel can never name a file that is not there and park the ending on black
// while a watchdog counts down.
// end_mother opens the reel: she is the last thing the player fights, and her
// switching off is what turns the lights back on across the whole world — so
// the ending starts on her and travels outward from there.
const END_ORDER = ['end_mother', 'end_open', 'end_folk', 'end_glitch', 'end_brood',
  'end_zero', 'end_atlas', 'end_prism', 'end_close'];
const ENDING_VID = {};
{
  const have = (typeof window !== 'undefined' && window.VID_FILES) || null;
  for (const k of END_ORDER) {
    const src = have ? have[k] : 'assets/video/' + k + '.mp4';
    if (src) ENDING_VID[k] = src;
  }
}
Object.assign(PURIFY_VID, ENDING_VID);
// The opening film's shots go in the same table — it is what every film in the
// game is played through, so a clip the build found on disk but never
// registered here is a clip that silently does not exist.
{
  const have = (typeof window !== 'undefined' && window.VID_FILES) || null;
  if (have) for (const k in have) if (k.indexOf('intro') === 0) PURIFY_VID[k] = have[k];
  // THE MEMORY FILM (owner, 2026-08-16): the moment his cell goes back in,
  // Ratchet tells what happened to the city — the necklace, the red flicker,
  // the crystal turning his eyes back blue, and his own hands opening his
  // chest. §3n on THE FIRING LIST. Registered only when the fired clip is
  // actually on disk, so until it lands the wake goes straight to the gift
  // and never waits on black.
  if (have && have.ratchet_memory) PURIFY_VID.memory = have.ratchet_memory;
}
function endingReel() {
  const killed = (G.save && G.save.flags && G.save.flags.killed) || {};
  const out = [];
  for (const k of END_ORDER) {
    if (!PURIFY_VID[k]) continue;                 // no such clip in this build
    const guardian = k.slice(4);
    // open, folk and close are unconditional; a guardian shows up iff it lives
    if (guardian !== 'open' && guardian !== 'folk' && guardian !== 'close'
      && guardian !== 'mother' && killed[guardian]) continue;
    out.push(k);
  }
  return out;
}
const purifyPre = {};
// Start pulling the film down long before it is needed, and — critically —
// PRIME it inside a real user gesture: browsers will not hand you a decoded
// first frame until the element has been allowed to play once. Priming is
// play-then-pause-then-rewind, which unlocks the element and decodes frame 0,
// so the final blow starts it instantly instead of stuttering.
// The second copy of every clip, in the codec the first one is not. Offering
// both is the difference between a film that plays everywhere and a film that
// plays on the machine it was tested on.
const PURIFY_ALT = (typeof window !== 'undefined' && window.VID_ALT) || {};
const PURIFY_LIGHT = (typeof window !== 'undefined' && window.VID_LIGHT) || {};
// WHO GETS THE LIGHT FILMS. The same shape of decision preloadPolicy() makes
// about art, and for the same reason: a data plan is somebody's money.
//
// A packaged app never takes it — the files are already on the device, so a
// smaller copy buys nothing and costs picture. Everywhere else it is the
// connection that decides, and Save-Data is an explicit yes.
function videoLight() {
  if (!PURIFY_LIGHT || !Object.keys(PURIFY_LIGHT).length) return false;
  const packaged = (typeof window !== 'undefined') &&
    (!!window.Capacitor || location.protocol === 'file:' || location.protocol === 'capacitor:');
  if (packaged) return false;
  const c = (typeof navigator !== 'undefined') &&
    (navigator.connection || navigator.mozConnection || navigator.webkitConnection);
  if (!c) return false;                       // unknown: assume a desk, give it the master
  if (c.saveData) return true;
  const t = c.effectiveType || '4g';
  return t === 'slow-2g' || t === '2g' || t === '3g';
}
function purifyPreload(kind) {
  const s = PURIFY_VID[kind];
  if (!s || purifyPre[kind]) return;
  const v = document.createElement('video');
  v.preload = 'auto'; v.muted = true; v.defaultMuted = true; v.playsInline = true;
  v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
  v.setAttribute('webkit-playsinline', '');
  v.crossOrigin = 'anonymous';
  // sources rather than a src: the browser picks the first one it can decode,
  // and only reports an error once it has failed at ALL of them
  const add = (url, type) => {
    if (!url) return;
    const so = document.createElement('source');
    so.src = url; so.type = type;
    v.appendChild(so);
  };
  // THE LIGHT TIER FIRST, WHERE IT IS WORTH IT. Browsers that take webm already
  // have a cheap option — the webm set is 13.4 MB against the mp4 set's 33 —
  // so it is iOS Safari, which takes mp4 and nothing else, that pays full price
  // for every film. On a metered or slow connection it gets the light mp4
  // instead: the same 960x540 picture, encoded at about half the bytes, which
  // frame-for-frame comparison could not tell from the master.
  //
  // Ordered rather than switched: the browser walks the <source> list and takes
  // the FIRST one it can decode, so putting the light copy in front costs a
  // device that cannot play it nothing at all.
  // the manifests are keyed by file basename (sword_forge, purify_glitch…),
  // not by the cut's kind (gift, glitch…) — looking up by kind alone made the
  // light and webm tiers silently never attach
  const vb = (s.split('/').pop() || '').replace(/\.\w+$/, '');
  if (videoLight()) add(PURIFY_LIGHT[kind] || PURIFY_LIGHT[vb], 'video/mp4');
  add(s, /\.webm$/i.test(s) ? 'video/webm' : 'video/mp4');
  add(PURIFY_ALT[kind] || PURIFY_ALT[vb], 'video/webm');
  try { v.load(); } catch (e) {}
  purifyPre[kind] = v;
  if (VID_GESTURE) purifyPrime(v);
}
// THE ROLLING WINDOW, and why a reel must not be fetched as a reel.
//
// The opening is eight shots. Preloading all eight put 4.4 MB of webm — or
// 13.1 MB of mp4, which is what iOS Safari takes — on the wire 900 ms after the
// page loaded, every session, INCLUDING the sessions where the player presses
// Continue and never sees a frame of it. On mobile data that was the single
// most expensive thing the boot did, and it was competing with the room art the
// player was actually about to need.
//
// A reel is a QUEUE. Each shot runs about fifteen seconds, so shot n+1 has a
// quarter of a minute to arrive while shot n is on screen — an eternity on any
// connection that can play video at all. Two ahead is the whole cushion needed,
// and it makes the boot cost one clip (0.93 MB) instead of eight.
const FILM_AHEAD = 2;
function filmAhead(list, n) {
  if (!list) return;
  for (let i = 0; i < Math.min(n == null ? FILM_AHEAD : n, list.length); i++) purifyPreload(list[i]);
}
function purifyPrime(v) {
  if (!v || v._primed) return;
  v._primed = true;
  const pr = v.play();
  // THE PRIME MUST NOT PAUSE THE FILM THAT IS ACTUALLY PLAYING.
  //
  // Priming is a play() followed by a pause() — the only way to unlock a video
  // element for later. play() returns a PROMISE, so the pause lands a beat
  // after the call, and the opening primes all eight clips on the same tap
  // that then starts the first one. The settle for clip one therefore arrived
  // AFTER it had begun: pause, rewind to zero. On screen that is a glimpse of
  // the film and then a stall, and a stalled clip is dropped — which is how
  // pressing New Game showed a moment of video and went straight to the
  // difficulty screen.
  const settle = () => {
    if (G.cut && G.cut.v === v) return;      // it is the live cut. Leave it alone.
    try { v.pause(); v.currentTime = 0; } catch (e) {}
  };
  if (pr && pr.then) pr.then(settle, () => { v._primed = false; });
  else settle();
}
// ready enough that play() will not stall: the browser says it can run to
// the end, or at least has future frames buffered
function purifyReady(kind) {
  const v = purifyPre[kind];
  return !!(v && (v.readyState >= 4 || (v.readyState >= 3 && v._primed)));
}
// every film in the game gets unlocked by the first real input
let VID_GESTURE = false;
function purifyGesture() {
  if (VID_GESTURE) return;
  VID_GESTURE = true;
  for (const k in purifyPre) purifyPrime(purifyPre[k]);
}
// preload the whole neighbourhood: any boss room one door away is fetched
// now, so a fight is never the first time the file is touched
function purifyPreloadNear(id) {
  const seen = {};
  const scan = (rid) => {
    const r = ROOMS[rid];
    if (!r || seen[rid]) return; seen[rid] = 1;
    for (const e of r.ents || [])
      if (e[0] === 'boss' && PURIFY_VID[e[3]]) purifyPreload(e[3]);
  };
  scan(id);
  const ex = (ROOMS[id] && ROOMS[id].exits) || {};
  for (const k in ex) {
    const d = ex[k];
    scan(typeof d === 'object' ? d.to : d);
  }
}
function startPurifyCut(kind) {
  if (!PURIFY_VID[kind]) return false;
  let v = purifyPre[kind];
  if (!v) { purifyPreload(kind); v = purifyPre[kind]; }
  if (!v) return false;
  // freeze the last live frame so the room can dim away under the film
  let snap = null;
  try {
    snap = document.createElement('canvas');
    snap.width = cv.width; snap.height = cv.height;
    snap.getContext('2d').drawImage(cv, 0, 0);
  } catch (e) { snap = null; }
  G.cut = { kind, v, snap, t: 0, ph: 'in', hint: 0, failed: false, held: 0 };
  try { v.currentTime = 0; } catch (e) {}
  G.state = 'CUT';
  return true;
}
// Start the ending reel. Returns false when there is nothing to play — no
// clips shipped yet, or none of them decodable — so the caller can fall
// straight through to the win screen instead of staring at black.
function startEndingReel() {
  const reel = endingReel();
  while (reel.length) {
    const k = reel.shift();
    purifyPreload(k);
    if (startPurifyCut(k)) { G.reel = reel; return true; }
  }
  G.reel = null;
  return false;
}
function endPurifyCut() {
  const ct = G.cut;
  if (!ct) { G.state = 'PLAY'; return; }
  try { ct.v.pause(); } catch (e) {}
  G.cut = null;
  // MID-REEL: hand straight to the next clip rather than back to the game, so
  // the vignettes read as one move instead of eight separate cutscenes.
  if (G.reel) {
    // One skip skips the ending. And if a clip never ran a single frame, this
    // browser cannot decode the reel at all — trying the other seven would be
    // fifty seconds of black, so the first failure ends it.
    if (ct.skipped || !ct.ran) { G.reel = []; G.reelCap = null; }
    while (G.reel.length) {
      const k = G.reel.shift();
      const cap = G.reelCap ? G.reelCap.shift() : null;
      if (startPurifyCut(k)) {
        if (cap) { G.cut.cap = cap; G.cut.patient = true; }
        // and top the window back up: this shot is playing, the next two are
        // arriving behind it
        filmAhead(G.reel);
        // straight into the next shot, over the frame the last one ended on
        if (purifyReady(k)) {
          G.cut.ph = 'play'; G.cut.t = 0; G.cut.diss = 0.5;
          const pr = G.cut.v.play();
          if (pr && pr.catch) pr.catch(() => { if (G.cut) G.cut.failed = true; });
        }
        return;
      }
    }
    G.reel = null; G.reelCap = null;
    // the opening film hands over to the comic's own ending — the title card
    // and whatever was waiting behind it — rather than to the win screen
    if (G.reelEnd === 'CINE') {
      G.reelEnd = null;
      // Only a film that COULD NOT PLAY falls back to the comic. Someone who
      // skipped it is telling us they do not want the opening at all — handing
      // them the comic version to skip a second time is not a fallback, it is
      // a second obstacle.
      if (!ct.ran && !ct.skipped) { G.state = 'CINE'; return; }
      cineEnd();
      return;
    }
    G.state = 'WIN';
    if (typeof setMusic === 'function') setMusic('winTheme');
    return;
  }
  G.state = 'PLAY';
  const b = G.boss;
  if (b && b.purified) {
    // the film already showed the rise, so he is simply awake and friendly
    b.pureT = Math.max(b.pureT || 0, 1.2);
    if (b.rewardPend) { b.rewardPend = false; G.onBossDead(b.kind); }
  }
  // a film chained out of a conversation hands BACK to it (the memory film
  // plays inside the wake sequence): one-shot, cleared before it runs so a
  // callback that starts another cut cannot re-fire itself.
  const chain = G.cutEnd;
  if (chain) { G.cutEnd = null; chain(); }
}
// THE FIRST TAP BUYS SOUND, NOT A SKIP. The badge asks the player to touch the
// screen so the score can start; if that same touch also skipped the opening,
// the game would answer "yes, music please" by throwing the film away. So while
// the sound is still locked, the first press is spent unlocking it and nothing
// else. Every press after that means what it says.
function introSoundTap() {
  if (G.introTapped) return false;
  if (typeof soundLocked !== 'function' || !soundLocked()) return false;
  G.introTapped = true;
  try { audioOn(); } catch (e) {}
  try { musKick(); } catch (e) {}
  return true;
}
function updateCut(dt) {
  const ct = G.cut;
  if (!ct) { G.state = 'PLAY'; return; }
  ct.t += dt; ct.hint += dt;
  const v = ct.v;
  const skip = inP('OK') || inP('JUMP') || inP('ATK') || inP('PAUSE') || inP('BACK');
  if (skip && ct.patient && introSoundTap()) return;
  if (skip && ct.ph !== 'out') { ct.ph = 'out'; ct.t = 0; ct.skipped = true; return; }
  if (ct.ph === 'in') {
    if (ct.t >= 0.34) { ct.ph = 'hold'; ct.t = 0; }
    return;
  }
  if (ct.ph === 'hold') {
    // black. If the film still is not ready, we simply wait here — the dark
    // reads as the moment before a memory surfaces, never as a stall.
    ct.held += dt;
    if (purifyReady(ct.kind) || ct.held > (ct.patient ? 14 : 4)) {
      // REWIND ON THE FRAME IT STARTS, not when the cut was created. The seek
      // requested in startPurifyCut is asynchronous and needs metadata; on a
      // clip that has been played before, `currentTime` can still be sitting at
      // the end when play() is called — and the very next check reads
      // `currentTime >= duration` as "this film is over" and throws it away.
      try { if (v.currentTime > 0.05) v.currentTime = 0; } catch (e) {}
      const pr = v.play();
      if (pr && pr.catch) pr.catch(() => { if (G.cut) G.cut.failed = true; });
      ct.ph = 'play'; ct.t = 0;
    }
    return;
  }
  if (ct.ph === 'play') {
    // stall watch: if the frame clock has not moved after a beat and a half,
    // this browser cannot decode the film. Bail immediately rather than make
    // her stand in the dark — the fight resumes as if the memory never came.
    if (v.currentTime > (ct.lastCT || 0) + 0.01) { ct.lastCT = v.currentTime; ct.stall = 0; ct.ran = true; }
    else ct.stall = (ct.stall || 0) + dt;
    // A CLIP CANNOT BE OVER IN ITS FIRST QUARTER SECOND. `ended` and the
    // duration check are both true for a video element parked at the end of a
    // previous playthrough, and both are read on the frame play() was called —
    // before the rewind has necessarily taken effect. Giving the clip a beat to
    // actually start costs nothing and removes a whole class of "the film
    // played for one frame".
    const started = ct.t > 0.25;
    const dead = ct.failed || (v.error != null)
      || (started && v.ended === true)
      || (started && v.duration && v.currentTime >= v.duration - 0.05);
    // hard ceiling: a film that never loads or never ends still hands back
    const cap = (v.duration && isFinite(v.duration)) ? v.duration + 2.5 : 12;
    // A STALL IS NOT A VERDICT during the opening. Mid-fight, a film that will
    // not decode has to get out of the way fast. The opening has nothing to get
    // out of the way of — and on a phone on mobile data the first seconds of the
    // first clip stall routinely, which used to throw away all eight of them and
    // hand the player the fallback. Here we go back to waiting instead.
    // Patience is not infinite: a browser that truly cannot decode this file
    // would wait forever, so three returns to the dark is the limit, and a clip
    // that has never shown one frame only gets one.
    if (!dead && ct.patient && ct.stall > 1.5 && ct.t < cap
        && (ct.waits || 0) < (ct.ran ? 3 : 1)) {
      ct.waits = (ct.waits || 0) + 1;
      ct.ph = 'hold'; ct.t = 0; ct.stall = 0; ct.held = Math.max(0, (ct.held || 0) - 4);
      return;
    }
    if (dead || ct.stall > 1.5 || ct.t > cap) {
      ct.ph = 'out'; ct.t = 0;
      // mid-reel the outgoing shot barely dips: the next one is already coming
      ct.quick = !!(G.reel && G.reel.length);
    }
    return;
  }
  if (ct.t >= (ct.quick ? 0.16 : 0.65)) endPurifyCut();
}
function drawCut() {
  const ct = G.cut;
  if (!ct) return;
  c.fillStyle = '#000'; c.fillRect(0, 0, 960, 540);
  if (ct.ph === 'in') {
    if (ct.snap) {
      c.save(); c.globalAlpha = 1 - clamp(ct.t / 0.34, 0, 1);
      c.drawImage(ct.snap, 0, 0, 960, 540);
      c.restore();
    }
    return;
  }
  if (ct.ph === 'hold') {
    // the dark before a memory: one slow breath of light in the middle of
    // the frame, so the wait never reads as the game having stopped
    const pu = 0.5 + Math.sin(ct.held * 2.4) * 0.5;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(480, 270, 4, 480, 270, 240);
    g.addColorStop(0, 'rgba(55,255,208,' + (0.05 + pu * 0.05) + ')');
    g.addColorStop(1, 'rgba(55,255,208,0)');
    c.fillStyle = g; c.fillRect(0, 0, 960, 540);
    c.restore();
    return;
  }
  const fadeIn = ct.diss ? ct.diss : 0.45;
  const a = ct.ph === 'out' ? 1 - clamp(ct.t / (ct.quick ? 0.16 : 0.65), 0, 1) : clamp(ct.t / fadeIn, 0, 1);
  // THE SHOT BEFORE THIS ONE, still there, going out as this one comes in.
  // Without it the reel fades to black between every shot, and eight shots
  // separated by black is a slideshow no matter how good the shots are.
  if (ct.snap && ct.ph === 'play' && ct.t < fadeIn) {
    c.save(); c.globalAlpha = 1 - ct.t / fadeIn;
    try { c.drawImage(ct.snap, 0, 0, 960, 540); } catch (e) {}
    c.restore();
  }
  const v = ct.v;
  if (v && v.videoWidth) {
    // letterbox the film inside the frame — never crop the authored art
    const k = Math.min(960 / v.videoWidth, 540 / v.videoHeight);
    const w = v.videoWidth * k, h = v.videoHeight * k;
    const x0 = (960 - w) / 2, y0 = (540 - h) / 2;
    c.save(); c.globalAlpha = a;
    try { c.drawImage(v, x0, y0, w, h); } catch (e) {}
    c.restore();
    // THE MEMORY REVEAL: it does not cut in, it surfaces — a bloom of its own
    // light over the first half second, then a soft vignette holds it there
    if (ct.ph === 'play' && ct.t < 0.5) {
      const b = 1 - ct.t / 0.5;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = b * 0.5;
      try { c.drawImage(v, x0 - w * 0.012 * b, y0 - h * 0.012 * b, w * (1 + 0.024 * b), h * (1 + 0.024 * b)); } catch (e) {}
      c.restore();
    }
    c.save();
    const vg = c.createRadialGradient(480, 270, 200, 480, 270, 560);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = vg; c.fillRect(0, 0, 960, 540);
    c.restore();
  }
  // THE CAPTION. The opening film carries the same lines the comic's panels
  // carried, one per shot — without them the footage is atmosphere and the
  // story is gone. Fades in over the first beat and sits on a soft plate so it
  // stays readable over whatever the shot happens to be doing underneath.
  if (ct.cap && ct.ph === 'play') {
    const a = clamp(ct.t / 0.6, 0, 1) * clamp((ct.dur ? ct.dur - ct.t : 9) / 0.5, 0, 1);
    if (a > 0.01) {
      c.save();
      c.globalAlpha = a;
      const txt = t(ct.cap);
      c.font = '600 17px "Segoe UI", Tahoma, sans-serif';
      const w2 = Math.min(880, c.measureText(txt).width + 40);
      const g2 = c.createLinearGradient(0, 432, 0, 500);
      g2.addColorStop(0, 'rgba(4,8,12,0)'); g2.addColorStop(0.5, 'rgba(4,8,12,0.72)');
      g2.addColorStop(1, 'rgba(4,8,12,0)');
      c.fillStyle = g2; c.fillRect(480 - w2 / 2 - 30, 432, w2 + 60, 68);
      ftxt(txt, 480, 468, 17, '#eaf4ff', 'center', 'rgba(0,0,0,0.85)', '600');
      c.restore();
      c.globalAlpha = 1;
    }
  }
  if (ct.ph === 'play' && ct.hint > 1.6) {
    c.save();
    c.globalAlpha = 0.35 + Math.sin(performance.now() / 420) * 0.12;
    ftxt(t('cut_skip'), 480, 516, 13, '#9fb8c8', 'center');
    c.restore();
  }
  if (typeof drawSoundChip === 'function') drawSoundChip(performance.now() / 1000);
}

// One reused offscreen layer for the near depth plate, and one gradient built
// once. Both are allocated on first use and never again — a depth pass that
// allocated per frame would cost more than the depth is worth.
const VNEAR_Y = 196, VNEAR_H = 344;      // the band the near depth lives in
const VNEAR_K = 0.5;                     // and the resolution it is drawn at
let _vsc = null, _vmask = null;
function vistaScratch() {
  if (_vsc === null) {
    try {
      const cv4 = document.createElement('canvas');
      // Only as tall as the band it feeds — a full-frame scratch spent a third
      // of its fill rate on rows the mask throws away — and only half as wide
      // and tall again. The near depth is the layer the eye is NOT focused on;
      // rendering it soft costs a quarter of the pixels and reads as the
      // shallow focus a real camera would have there anyway.
      cv4.width = 960 * VNEAR_K; cv4.height = VNEAR_H * VNEAR_K;
      _vsc = cv4.getContext('2d');
      _vsc.setTransform(VNEAR_K, 0, 0, VNEAR_K, 0, 0);   // author in full-frame units
    } catch (e) { _vsc = false; }
  }
  return _vsc || null;
}
function vistaMask(x2) {
  if (!_vmask) {
    _vmask = x2.createLinearGradient(0, 0, 0, VNEAR_H * 0.68);
    _vmask.addColorStop(0, 'rgba(0,0,0,0)');
    _vmask.addColorStop(0.55, 'rgba(0,0,0,0.72)');
    _vmask.addColorStop(1, 'rgba(0,0,0,1)');
  }
  return _vmask;
}
// Airborne particulate at two depths. Nothing in a still painting tells you
// the air between you and it has volume; a little of it drifting at two
// different rates does, for almost nothing.
const MOTES = [];
for (let i = 0; i < 26; i++) {
  MOTES.push({
    x: hash2(i, 71) * 1400, y: hash2(i, 72) * 460 + 40,
    d: 0.3 + hash2(i, 73) * 0.8,               // depth: drift rate and size
    r: 0.5 + hash2(i, 74) * 1.5,
    ph: hash2(i, 75) * 7,
  });
}
function drawMotes(px, py, t3) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const m of MOTES) {
    const sx = ((m.x - px * m.d * 0.5 + Math.sin(t3 * 0.23 + m.ph) * 16) % 1400 + 1400) % 1400 - 220;
    if (sx < -20 || sx > 980) continue;
    const sy = m.y - py * m.d * 0.08 + Math.sin(t3 * 0.4 + m.ph * 2) * 9;
    c.globalAlpha = 0.05 + m.d * 0.07;
    c.fillStyle = '#cfe6f5';
    c.beginPath(); c.arc(sx, sy, m.r * (0.6 + m.d), 0, 7); c.fill();
  }
  c.restore();
  c.globalAlpha = 1;
}
// THE INTERIOR FIT (owner, in the den: "make room smaller in a fade into
// black surrounding until npc looks like sitting next to table"). An interior
// painting stretched to fill the screen makes its workbench a building; drawn
// SMALLER — bottom on the floor line, feathered edges dying into darkness —
// the same painting becomes a lamplit room whose table stands beside the
// sitting npc. The number is the fraction of the full-bleed cover scale.
const INTERIOR_FIT = { denInterior: 0.62, oracleInterior: 0.68 };
// which rooms ARE a painting: their vista key names an interior plate
function interiorVista() {
  const own = G.roomId && ROOM_VISTA[G.roomId];
  return own && /Interior$/.test(own) ? own : null;
}
// ===========================================================================
// THE INTERIOR FLOOR (owner, 2026-08-16: "the table on the floor looks very
// bad — it's all because you refuse to create floor texture instead of the
// straight line"). In a room that IS a painting, the walkable strip cannot be
// the zone's soil band wearing a ruler edge and a lawn: it has to be the
// painting's OWN ground, carried forward to where she walks. So the band
// from the walk surface down is re-surfaced with the plate's bottom strip —
// its actual floor — and the seam where it meets the room is eaten into an
// irregular edge (bites in, lumps of its own texture pushed up past the
// line), per NO RIGHT ANGLES. Built once per room into an offscreen layer.
// ===========================================================================
let INT_FLOOR = null;                       // { key, cv, top[] }
function interiorFloorCv() {
  const own = interiorVista();
  if (!own) return null;
  const ck = own + ':' + G.roomId;
  if (INT_FLOOR && INT_FLOOR.key === ck) return INT_FLOOR.cv;
  if (typeof mediaFetch === 'function') mediaFetch(own);
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[own];
  if (!im || !im.naturalWidth) return null;
  const g = G.grid; if (!g || !g[0]) return null;
  const W = g[0].length * TILE, H = g.length * TILE;
  const solid = ch => ch === '#' || ch === 'B';
  // the walk surface, per column — interiors are flat but nothing here
  // assumes it: the strip follows whatever the room actually built
  let floorY = H;
  for (let ty = g.length - 1; ty >= 0; ty--) {
    const ch = g[ty][Math.floor(g[0].length / 2)];
    if (solid(ch) && ty > 0 && !solid(g[ty - 1][Math.floor(g[0].length / 2)])) { floorY = ty * TILE; break; }
  }
  if (floorY >= H) return null;
  const UP = 9;                             // how far the lumps may rise
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = (H - floorY) + UP;
  const x = cv.getContext('2d');
  // the painting's own floor: its bottom strip, stretched across the room.
  // Texture, not geometry — a stretch reads as ground where a tile never will.
  const sy = im.naturalHeight * 0.86, sh = im.naturalHeight * 0.14;
  x.drawImage(im, 0, sy, im.naturalWidth, sh, 0, UP, W, cv.height - UP);
  // settle it into the room's dark: a touch of shade toward the bottom
  const shade = x.createLinearGradient(0, UP, 0, cv.height);
  shade.addColorStop(0, 'rgba(3,6,8,0)'); shade.addColorStop(1, 'rgba(3,6,8,0.55)');
  x.fillStyle = shade; x.fillRect(0, UP, W, cv.height - UP);
  // the seam: lumps of the floor's own texture pushed UP past the line first
  // (they copy clean pixels), then bites eaten INTO the edge — same grammar
  // as erodeCaveEdges, so the line stops being a line
  for (let bx = 0; bx < W; bx += 7) {
    const r = hash2(bx * 3 + 1, floorY), r2 = hash2(bx, floorY * 7 + 5);
    if (r > 0.4) {
      const lw = 4 + r2 * 8, lh = 2 + r * (UP - 2);
      x.drawImage(cv, bx, UP + 1, lw, lh, bx - 1, UP - lh + 2, lw + 2, lh);
    }
  }
  x.globalCompositeOperation = 'destination-out';
  for (let bx = 0; bx < W; bx += 5) {
    const r = hash2(bx * 5 + 3, floorY + 11);
    if (r < 0.35) continue;
    x.beginPath(); x.arc(bx + r * 5, UP + (r - 0.5) * 3, 1.2 + r * 3.4, 0, 7); x.fill();
  }
  x.globalCompositeOperation = 'source-over';
  INT_FLOOR = { key: ck, cv, y: floorY - UP };
  return cv;
}
function drawInteriorFloor() {
  const cv = interiorFloorCv();
  if (cv) c.drawImage(cv, 0, INT_FLOOR.y);
}
function drawZoneVista(P, zone, px, py) {
  const own = ROOM_VISTA[G.roomId];
  if (own && typeof mediaFetch === 'function') mediaFetch(own);
  if (own && INTERIOR_FIT[own] && typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[own]
      && typeof scenePlate === 'function') {
    const fim = scenePlate(own);            // the feathered copy — edges fade out
    if (fim) {
      // the room floats in the dark of the larger structure it is dug into
      c.fillStyle = '#030608'; c.fillRect(0, 0, 960, 540);
      const im0 = MEDIA_IMG[own];
      const cover = Math.max(540 / im0.naturalHeight, 960 / im0.naturalWidth) * 1.12;
      const dh2 = im0.naturalHeight * cover * INTERIOR_FIT[own];
      const dw2 = dh2 * (fim.naturalWidth / fim.naturalHeight);
      // bottom on the play floor, drifting gently with her progress
      const roomW2 = G.roomDef.w * TILE;
      const pcx2 = (typeof player !== 'undefined' && player) ? player.x + player.w / 2 : 480;
      const fxp = clamp(pcx2 / Math.max(1, roomW2), 0, 1);
      const x0 = 480 - dw2 / 2 - (fxp - 0.5) * Math.max(0, dw2 - 960) * 0.5;
      const y0 = G.roomDef.h * TILE - 20 - (py || 0) - dh2;
      c.drawImage(fim, x0, y0, dw2, dh2);
      // a breath of the lamp's warmth bleeding past the plate edge
      c.save(); c.globalCompositeOperation = 'lighter';
      const wg = c.createRadialGradient(480, y0 + dh2 * 0.4, 40, 480, y0 + dh2 * 0.4, dw2 * 0.62);
      wg.addColorStop(0, 'rgba(120,100,60,0.06)'); wg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = wg; c.fillRect(0, 0, 960, 540);
      c.restore();
      G._vista = { x: x0, y: y0, w: dw2, h: dh2 }; G._vistaRoom = G.roomId;
      return true;
    }
  }
  const solo = (own && typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[own])
    || (ZONE_VISTA[zone] && typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[ZONE_VISTA[zone]]);
  const im = solo || (typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.zones);
  const cell = solo ? [0, 0] : ZONE_CELL[zone];
  if (!im || !cell) return false;
  const CW = solo ? im.naturalWidth : im.naturalWidth / 2;
  const CH = solo ? im.naturalHeight : im.naturalHeight / 3;
  // scale the painting past the screen and pan across the excess as the camera
  // crosses the room — a single painting, so it pans rather than tiles. Wide
  // solo paintings are width-bound so there is always horizontal travel.
  // NO per-room zoom (tried and reverted the same day): zooming a painting
  // whose furniture is already too big makes the furniture BIGGER. When an
  // interior's furniture towers over the characters ("the table in the
  // background is bigger than the npc") the fault is the painting's own
  // composition, and the fix is a re-fire with the scale contract in
  // ART_QUEUE §2g — a standing character reaches 40% of frame height, a
  // workbench top meets that character's waist, nothing on a table is
  // bigger than their head.
  const sc = Math.max((540 / CH) * 1.12, (960 / CW) * 1.16);
  const dw = CW * sc, dh = CH * sc;
  const roomW = G.roomDef.w * TILE;
  // THE PAINTING FOLLOWS HER, NOT THE CAMERA (owner: "it stays still, and it
  // moves when the character passes the middle... instead of smoothly
  // following"). The camera clamps at the room edges and cannot move at all
  // in a one-screen room, so a vista panned by the camera holds still and
  // then lurches. Panned by her PROGRESS through the room instead, the
  // backdrop drifts continuously from the first step to the last, in every
  // room, at every width.
  const pcx = (typeof player !== 'undefined' && player) ? player.x + player.w / 2 : px + 480;
  const fx = clamp(pcx / Math.max(1, roomW), 0, 1);
  // ---- DEPTH. One painting, drawn twice, at two different distances. ----
  // A single plate panned as one plane is a backdrop: everything in it, the
  // far skyline and the wreck ten metres away, slides at exactly one rate,
  // which is the giveaway that there is no space behind the player. The plate
  // is now drawn again, larger and travelling faster, feathered in over the
  // lower half where the near ground actually is. Both copies are the same
  // art — nothing is redrawn, nothing is restyled, the scene is identical —
  // but the bottom of the frame now moves past faster than the top, which is
  // the whole of what the eye uses to judge distance.
  const t3 = performance.now() / 1000;
  const breathe = 1 + Math.sin(t3 * 0.21) * 0.011;         // a live camera, never still
  const plate = (x2, mul, travel, vert, sway, yOff) => {
    const s2 = sc * mul * breathe;
    const w2 = CW * s2, h2 = CH * s2;
    const cx2 = -(w2 - 960) * (0.5 + (fx - 0.5) * travel) + Math.sin(t3 * 0.17 + sway) * 3.5 * travel;
    const cy2 = -(h2 - 540) * 0.6 - py * vert - (yOff || 0);
    // WHERE THE PAINTING ACTUALLY LANDED ON SCREEN. Anything that has to line
    // up with something IN the backdrop — the gap between the city gates, for
    // one — cannot guess: the plate is scaled to overfill and panned by the
    // camera, so its rect is only known here. Recorded from the FAR copy,
    // which is the one the architecture belongs to. Stamped with the room, so
    // a stale rect from the previous room can never place this room's door.
    if (mul <= 1.001) { G._vista = { x: cx2, y: cy2, w: w2, h: h2 }; G._vistaRoom = G.roomId; }
    x2.drawImage(im, cell[0] * CW, cell[1] * CH, CW, CH, cx2, cy2, w2, h2);
  };
  // when the far plate is the only one, it carries the full travel — the
  // depth pass must not cost the scene its pan
  // ...and only when the frame budget can carry it (see mainLoop)
  const wide = roomW > 980 && richBG;
  plate(c, 1, wide ? 0.62 : 1, 0.035, 0);                   // far: the horizon barely moves
  // The near copy, masked into the lower frame. A room exactly one screen wide
  // cannot pan at all, so there is no parallax to separate and the second plate
  // would be pure cost — most rooms in the game are that size.
  const near = wide && vistaScratch();
  if (near) {
    // no clear: the plate is opaque and covers the band edge to edge, so the
    // previous frame is fully overwritten by the draw that follows
    plate(near, 1.13, 1, 0.115, 2.1, VNEAR_Y);
    near.globalCompositeOperation = 'destination-in';
    near.fillStyle = vistaMask(near);
    near.fillRect(0, 0, 960, VNEAR_H);
    near.globalCompositeOperation = 'source-over';
    c.drawImage(near.canvas, 0, 0, 960 * VNEAR_K, VNEAR_H * VNEAR_K, 0, VNEAR_Y, 960, VNEAR_H);
  }
  // aerial perspective: haze sits BETWEEN the two depths conceptually and is
  // painted over the far one, so the near ground reads as being in front of air
  const air = c.createLinearGradient(0, 120, 0, 430);
  air.addColorStop(0, 'rgba(120,150,175,0.10)');
  air.addColorStop(1, 'rgba(120,150,175,0)');
  c.fillStyle = air; c.fillRect(0, 0, 960, 540);
  // seat the playfield: darken the lower third and cool the whole frame slightly
  // toward the zone palette so gameplay reads against the painting
  const hz = c.createLinearGradient(0, 250, 0, 540);
  hz.addColorStop(0, 'rgba(5,9,14,0)'); hz.addColorStop(1, 'rgba(5,9,14,0.62)');
  c.fillStyle = hz; c.fillRect(0, 0, 960, 540);
  c.fillStyle = 'rgba(5,9,14,0.14)'; c.fillRect(0, 0, 960, 540);
  drawMotes(px, py, t3);
  if (zone === 'C') drawLavaFalls(px, py);
  // rooms narrower than the screen: the painting must stop at the walls
  if (roomW < 958) {
    const edge = roomW - px;
    if (edge < 960) { c.fillStyle = 'rgba(4,7,11,0.9)'; c.fillRect(edge, 0, 960 - edge, 540); }
    if (-px > 0) { c.fillStyle = 'rgba(4,7,11,0.9)'; c.fillRect(0, 0, -px, 540); }
  }
  return true;
}
function drawMachineBG(P, px, py, horizon) {
  const zone = G.roomDef.zone, now = performance.now();
  if (drawZoneVista(P, zone, px, py)) { if (typeof drawGateDoors === 'function') drawGateDoors(P); return; }
  const rep = (span, speed, fn) => {
    const off = ((px * speed) % span + span) % span;
    for (let i = -1; i < 3; i++) fn(i * span - off, i);
  };
  // sky: a sunless basin lit by whatever the machines are burning
  const sky = c.createLinearGradient(0, 0, 0, 540);
  sky.addColorStop(0, P.sky[0]); sky.addColorStop(0.5, P.sky[1]); sky.addColorStop(1, P.far);
  c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
  if (zone === 'A') {
    // ---- SCRAP MEADOWS: the yards where the dead were laid out ----
    c.save(); c.globalCompositeOperation = 'lighter';                // dead sun through smog
    const sg = c.createRadialGradient(250 - px * 0.015, 120, 8, 250 - px * 0.015, 120, 150);
    sg.addColorStop(0, 'rgba(190,210,190,0.4)'); sg.addColorStop(1, 'rgba(120,160,140,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(250 - px * 0.015, 120, 150, 0, 7); c.fill();
    c.restore();
    rep(760, 0.05, (x) => {                                          // infected city on the skyline
      c.fillStyle = P.far;
      for (let k = 0; k < 6; k++) {
        const bw = 60 + hash2(k, 3) * 70, bh = 90 + hash2(k, 8) * 150;
        c.fillRect(x + k * 130, horizon - bh, bw, bh);
        c.fillStyle = '#ff4f6d'; c.globalAlpha = 0.35 + 0.3 * Math.sin(now / 900 + k);
        c.fillRect(x + k * 130 + bw * 0.35, horizon - bh + 16, 5, 5); // red windows
        c.globalAlpha = 1; c.fillStyle = P.far;
      }
    });
    rep(620, 0.11, (x) => {                                          // sorting cranes still working
      mchCrane(x + 120, horizon + 26, 0.85, P.mid, P.dark, now / 1300 + x);
      mchCrane(x + 430, horizon + 26, 0.6, P.mid, P.dark, now / 1600 + x);
    });
    rep(520, 0.2, (x) => {                                           // heaps of stripped hulls
      c.fillStyle = P.dark;
      c.beginPath(); c.moveTo(x, horizon + 60); c.lineTo(x + 90, horizon + 6);
      c.lineTo(x + 200, horizon + 60); c.closePath(); c.fill();
      mchHull(x + 96, horizon + 58, 0.8, P.mid, P.dark, chance(0.5) ? '#ff4f6d' : null);
      mchHull(x + 300, horizon + 60, 0.6, P.mid, P.dark, null);
    });
  } else if (zone === 'B') {
    // ---- DATA CONDUITS: the road the virus travelled ----
    rep(400, 0.06, (x) => {                                          // canyon walls of servers
      c.fillStyle = P.far;
      c.fillRect(x, 0, 150, horizon + 40); c.fillRect(x + 230, 0, 120, horizon + 20);
      c.fillStyle = P.mid; c.globalAlpha = 0.5;
      for (let r = 0; r < 14; r++) {                                 // rack rows
        c.fillRect(x + 8, 14 + r * 26, 134, 10);
        if (r < 12) c.fillRect(x + 238, 22 + r * 26, 104, 10);
      }
      c.globalAlpha = 1;
      for (let r = 0; r < 14; r++) {                                 // status lights
        c.globalAlpha = 0.25 + 0.5 * ((Math.sin(now / 400 + r * 2 + x) + 1) / 2);
        c.fillStyle = r % 4 === 0 ? '#ff4f6d' : P.glow;
        c.fillRect(x + 130, 17 + r * 26, 5, 4);
      }
      c.globalAlpha = 1;
    });
    // rivers of corrupted data pouring down the canyon
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const sx = ((i * 143 - px * 0.16) % 1060 + 1060) % 1060 - 50;
      const g2 = c.createLinearGradient(sx, 0, sx, 540);
      g2.addColorStop(0, 'rgba(0,0,0,0)');
      g2.addColorStop(0.5, i % 3 === 0 ? 'rgba(255,79,109,0.5)' : 'rgba(87,168,255,0.45)');
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = 0.4; c.fillStyle = g2; c.fillRect(sx, 0, 7, 540);
      for (let k = 0; k < 5; k++) {                                  // packets travelling
        const yy = ((now / 3 + i * 200 + k * 130) % 620) - 40;
        c.globalAlpha = 0.8; c.fillStyle = i % 3 === 0 ? '#ff8aa0' : '#bfe3ff';
        c.fillRect(sx - 1, yy, 9, 16);
      }
    }
    c.restore(); c.globalAlpha = 1;
  } else if (zone === 'C') {
    // ---- THE FOUNDRY: it never stopped building bodies ----
    rep(660, 0.05, (x) => {                                          // furnace stacks
      c.fillStyle = P.far;
      c.fillRect(x + 40, horizon - 210, 54, 210); c.fillRect(x + 320, horizon - 170, 46, 170);
      c.save(); c.globalCompositeOperation = 'lighter';              // furnace mouths
      const fg = c.createRadialGradient(x + 67, horizon - 30, 3, x + 67, horizon - 30, 70);
      fg.addColorStop(0, 'rgba(255,190,90,0.55)'); fg.addColorStop(1, 'rgba(255,120,30,0)');
      c.fillStyle = fg; c.beginPath(); c.arc(x + 67, horizon - 30, 70, 0, 7); c.fill();
      c.restore();
    });
    rep(540, 0.13, (x) => {                                          // gantries + welding arms
      c.fillStyle = P.mid; c.fillRect(x, horizon - 96, 300, 12);
      c.fillStyle = P.dark; c.fillRect(x + 30, horizon - 84, 10, 60); c.fillRect(x + 240, horizon - 84, 10, 60);
      for (let k = 0; k < 3; k++) {                                  // arms, still assembling
        const ax2 = x + 70 + k * 80, sw = Math.sin(now / 500 + k + x) * 0.5;
        c.save(); c.translate(ax2, horizon - 84); c.rotate(0.5 + sw);
        c.strokeStyle = P.mid; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(22, 16); c.lineTo(40, 34); c.stroke();
        if (chance(0.25)) {                                          // weld flash
          c.save(); c.globalCompositeOperation = 'lighter';
          c.fillStyle = '#ffe6a8'; c.shadowColor = '#ffb43c'; c.shadowBlur = 14;
          c.beginPath(); c.arc(40, 34, 4, 0, 7); c.fill(); c.restore();
        }
        c.restore();
      }
    });
    rep(420, 0.24, (x) => {                                          // moulds on the line
      c.fillStyle = P.dark;
      for (let k = 0; k < 3; k++) c.fillRect(x + k * 140, horizon + 4, 74, 30);
    });
  } else if (zone === 'D') {
    // ---- FROZEN ARCHIVES: the last clean memory, kept cold ----
    rep(430, 0.05, (x) => {                                          // cryo rack halls
      c.fillStyle = P.far; c.fillRect(x, 0, 190, horizon + 60);
      c.fillStyle = P.mid; c.globalAlpha = 0.45;
      for (let r = 0; r < 8; r++) c.fillRect(x + 12, 30 + r * 44, 166, 30);
      c.globalAlpha = 1;
      for (let r = 0; r < 8; r++) {                                  // dormant units in the racks
        mchHull(x + 60 + (r % 2) * 70, 58 + r * 44, 0.42, P.mid, P.dark, null);
        c.globalAlpha = 0.15 + 0.1 * Math.sin(now / 1500 + r);
        c.fillStyle = P.glow; c.fillRect(x + 12, 30 + r * 44, 166, 30);
        c.globalAlpha = 1;
      }
    });
    // frost creeping over everything + falling ice motes
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.1;
    const fg2 = c.createLinearGradient(0, 0, 0, 540);
    fg2.addColorStop(0, '#eefcff'); fg2.addColorStop(1, 'rgba(238,252,255,0)');
    c.fillStyle = fg2; c.fillRect(0, 0, 960, 540);
    c.restore(); c.globalAlpha = 1;
    for (let i = 0; i < 26; i++) {
      const fx = ((i * 97 - px * 0.08) % 1000 + 1000) % 1000;
      const fy = ((now / 26 + i * 60) % 560) - 20;
      c.globalAlpha = 0.35; c.fillStyle = '#eefcff';
      c.fillRect(fx, fy, 2, 2);
    }
    c.globalAlpha = 1;
  } else if (zone === 'E') {
    // ---- THE VIRUS NEST: the machine world's closest thing to flesh ----
    rep(520, 0.05, (x) => {                                          // overgrown chamber walls
      c.fillStyle = P.far; c.fillRect(x, 0, 260, horizon + 80);
      c.fillStyle = P.mid; c.globalAlpha = 0.5;
      for (let k = 0; k < 5; k++) {                                  // tissue of cable and coolant
        c.beginPath();
        c.moveTo(x + 20 + k * 50, 0);
        c.quadraticCurveTo(x + 60 + k * 50 + Math.sin(now / 2000 + k) * 18, horizon * 0.5, x + 10 + k * 50, horizon + 80);
        c.lineTo(x + 46 + k * 50, horizon + 80);
        c.quadraticCurveTo(x + 96 + k * 50, horizon * 0.5, x + 56 + k * 50, 0);
        c.closePath(); c.fill();
      }
      c.globalAlpha = 1;
    });
    // pulsing infection veins
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const vx = ((i * 121 - px * 0.13) % 1040 + 1040) % 1040 - 40;
      const pulse = (Math.sin(now / 500 + i * 1.3) + 1) / 2;
      c.globalAlpha = 0.18 + pulse * 0.4;
      c.strokeStyle = i % 2 ? '#ff4f6d' : '#e05aff';
      c.shadowColor = c.strokeStyle; c.shadowBlur = 12; c.lineWidth = 2 + pulse * 2;
      c.beginPath(); c.moveTo(vx, 0);
      for (let y = 60; y < 560; y += 90) c.lineTo(vx + Math.sin(y / 70 + i) * 26, y);
      c.stroke();
    }
    c.shadowBlur = 0; c.restore(); c.globalAlpha = 1;
    // the Core's glow bleeding up from below
    c.save(); c.globalCompositeOperation = 'lighter';
    const cg2 = c.createLinearGradient(0, 540, 0, horizon);
    cg2.addColorStop(0, 'rgba(224,90,255,0.35)'); cg2.addColorStop(1, 'rgba(224,90,255,0)');
    c.globalAlpha = 0.5 + 0.2 * Math.sin(now / 700);
    c.fillStyle = cg2; c.fillRect(0, horizon, 960, 540 - horizon);
    c.restore(); c.globalAlpha = 1;
  } else {
    // ---- CRYSTAL CACHE: never indexed, therefore never infected ----
    rep(480, 0.06, (x) => {
      c.fillStyle = P.far;
      for (let k = 0; k < 6; k++) {
        const h = 120 + hash2(k, 5) * 190, w = 40 + hash2(k, 9) * 40;
        c.beginPath(); c.moveTo(x + k * 90, horizon + 40);
        c.lineTo(x + k * 90 + w * 0.5, horizon + 40 - h);
        c.lineTo(x + k * 90 + w, horizon + 40); c.closePath(); c.fill();
      }
    });
    rep(360, 0.15, (x) => {                                          // crystal seams catching light
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 4; k++) {
        const h = 90 + hash2(k, 2) * 120;
        c.globalAlpha = 0.3 + 0.2 * Math.sin(now / 1200 + k + x);
        const g3 = c.createLinearGradient(x + k * 100, horizon + 40 - h, x + k * 100, horizon + 40);
        g3.addColorStop(0, P.glow); g3.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g3;
        c.beginPath(); c.moveTo(x + k * 100, horizon + 40);
        c.lineTo(x + k * 100 + 22, horizon + 40 - h);
        c.lineTo(x + k * 100 + 44, horizon + 40); c.closePath(); c.fill();
      }
      c.restore(); c.globalAlpha = 1;
    });
  }
  // basin haze so the playfield separates from the vista
  const haze = c.createLinearGradient(0, horizon - 40, 0, 540);
  haze.addColorStop(0, 'rgba(0,0,0,0)'); haze.addColorStop(1, P.dark);
  c.globalAlpha = 0.4; c.fillStyle = haze; c.fillRect(0, horizon - 40, 960, 540 - horizon + 40);
  c.globalAlpha = 1;
}
function drawBG(P, px, py) {
  py = py || 0;
  // THE BACKDROP NEVER HOLDS STILL WHILE SHE WALKS. The camera clamps at the
  // room edges — and in a one-screen room it cannot move at all — so every
  // parallax layer fed by the camera freezes exactly when she is nearest a
  // wall, then lurches when the camera unpins. Half of the travel the camera
  // refuses is handed to the background instead: mid-room in a wide room the
  // drift is zero (the camera is doing the work), and at the pinned ranges
  // the layers keep drifting with her at parallax fractions of half speed —
  // the slight, continuous follow the owner asked for.
  if (typeof player !== 'undefined' && player && G.roomDef) {
    const span = Math.max(0, G.roomDef.w * TILE - 960);
    const ideal = player.x + player.w / 2 - 480;
    px += (ideal - clamp(ideal, 0, span)) * 0.5;
  }
  const horiz0 = 285 - (py || 0) * 0.18;
  // each world gets its own story-built scenery
  if (typeof isHero === 'function' && isHero()) { drawGreekBG(P, px, py, horiz0); return; }
  drawMachineBG(P, px, py, horiz0);
  return;
  const sky = c.createLinearGradient(0, 0, 0, 540);
  sky.addColorStop(0, P.sky[0]); sky.addColorStop(0.55, P.sky[1]); sky.addColorStop(1, P.far);
  c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
  // real corridor artwork as the deepest layer, pre-tinted per zone (cached)
  const tinted = tintedBG(G.roomDef.zone);
  if (tinted) {
    const off = ((px * 0.12) % 960 + 960) % 960;
    c.globalAlpha = 0.42;
    c.drawImage(tinted, -off, -20 - py * 0.05);
    c.drawImage(tinted, 960 - off, -20 - py * 0.05);
    c.globalAlpha = 1;
  }
  // ---- the deep reality behind the screen: perspective machine-hall ----
  const horizon = 285 - py * 0.18;
  // converging floor grid, sliding with the camera
  c.save();
  c.strokeStyle = P.glow; c.lineWidth = 1;
  for (let k = -9; k <= 9; k++) {
    const spread = k * 44 + ((px * 0.35) % 44);
    c.globalAlpha = 0.05 + 0.03 * (Math.abs(k) % 2);
    c.beginPath(); c.moveTo(480 + spread * 0.25, horizon); c.lineTo(480 + spread * 7, 560); c.stroke();
  }
  for (let r2 = 1; r2 <= 6; r2++) {
    const q = r2 / 6, yy = horizon + (540 - horizon) * q * q;
    c.globalAlpha = 0.04 + q * 0.05;
    c.strokeStyle = r2 % 2 ? P.glow : P.acc2;
    c.beginPath(); c.moveTo(0, yy); c.lineTo(960, yy); c.stroke();
  }
  c.globalAlpha = 1; c.restore();
  // real hand-drawn industrial skylines (CC0), colourised per zone, 3 parallax depths
  const zone = G.roomDef.zone;
  const artOK = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.indFg;
  if (artOK) {
    drawParallaxArt('indFar', zone, px, 0.06, 150, horizon + 44 - py * 0.04, 0.32);
    drawParallaxArt('indMid', zone, px, 0.11, 128, horizon + 72 - py * 0.04, 0.5);
    drawParallaxArt('indFg', zone, px, 0.2, 168, horizon + 150 - py * 0.05, 0.72, 'atop');
  } else {
    // procedural fallback (multi-file build before art decodes)
    for (const [z, alpha] of [[5, 0.3], [3.2, 0.5], [2.1, 0.75]]) {
      const s = 1 / z, span = 620;
      const off = ((px * s * 0.9) % span + span) % span;
      for (let i = -1; i < 3; i++) {
        const bx = i * span - off + hash2(i + z * 7, 50) * 120;
        const w = (140 + hash2(i, z) * 160) * s * 2.2;
        const h = (260 + hash2(i, z + 1) * 380) * s * 2.2;
        const by = horizon + 46 * s * 2;
        c.globalAlpha = alpha; c.fillStyle = P.far;
        c.fillRect(bx, by - h, w, h);
        c.globalAlpha = 1;
      }
    }
  }
  // horizon glow band
  const hb = c.createLinearGradient(0, horizon - 40, 0, horizon + 60);
  hb.addColorStop(0, 'rgba(0,0,0,0)');
  hb.addColorStop(0.5, P.glow);
  hb.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = 0.1; c.fillStyle = hb; c.fillRect(0, horizon - 40, 960, 100); c.globalAlpha = 1;
  // god-ray light shafts
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const bx = ((i * 430 - px * 0.35) % 1400 + 1400) % 1400 - 220;
    const sway = Math.sin(performance.now() / 3200 + i * 2.1) * 34;
    const g = c.createLinearGradient(bx, 0, bx + 150, 540);
    g.addColorStop(0, P.glow); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = 0.045 + 0.02 * Math.sin(performance.now() / 1700 + i * 2);
    c.beginPath();
    c.moveTo(bx, 0); c.lineTo(bx + 95, 0);
    c.lineTo(bx + 240 + sway, 540); c.lineTo(bx + 70 + sway, 540);
    c.closePath(); c.fillStyle = g; c.fill();
  }
  c.restore(); c.globalAlpha = 1;
  const now = performance.now();
  // layer 0 — farthest megastructures, barely darker than the sky (atmospheric depth)
  c.globalAlpha = 0.5; c.fillStyle = P.far;
  for (let i = 0; i < 7; i++) {
    const h = 200 + hash2(i, 21) * 280;
    const xx = ((i * 300 - px * 0.1) % 1600 + 1600) % 1600 - 260;
    const w = 180 + hash2(i, 22) * 160;
    c.fillRect(xx, 540 - h, w, h);
    if (hash2(i, 23) > 0.5) c.fillRect(xx + w / 2 - 3, 540 - h - 46, 6, 46); // antenna mast
  }
  c.globalAlpha = 1;
  // haze band separating far layers
  const hz = c.createLinearGradient(0, 180, 0, 540);
  hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(1, P.sky[1]);
  c.globalAlpha = 0.45; c.fillStyle = hz; c.fillRect(0, 180, 960, 360); c.globalAlpha = 1;
  // layer 1 — far towers with window lights
  c.fillStyle = P.far;
  for (let i = 0; i < 12; i++) {
    const h = 120 + hash2(i, 1) * 240;
    const xx = ((i * 173 - px * 0.24) % 1400 + 1400) % 1400 - 200;
    const w = 90 + hash2(i, 2) * 70;
    c.fillRect(xx, 540 - h, w, h);
    if (hash2(i, 24) > 0.6) c.fillRect(xx + w - 8, 540 - h - 26, 4, 26);
    if (hash2(i, 3) > 0.4) {
      c.fillStyle = P.glow;
      for (let k = 0; k < 4; k++) {
        const blink = hash2(i, 30 + k) > 0.85 ? (Math.sin(now / 700 + i + k) > 0 ? 1 : 0.1) : 1;
        c.globalAlpha = 0.16 * blink;
        c.fillRect(xx + 14 + (k % 2) * 30, 560 - h + 24 + Math.floor(k / 2) * 40, 8, 12);
      }
      c.globalAlpha = 1; c.fillStyle = P.far;
    }
  }
  // drifting fog sheets
  for (let i = 0; i < 4; i++) {
    const fx = ((i * 380 + now * (0.006 + i * 0.002) - px * 0.32) % 1500 + 1500) % 1500 - 280;
    const fy = 250 + hash2(i, 40) * 220;
    c.globalAlpha = 0.07;
    c.fillStyle = P.sky[1];
    c.beginPath(); c.ellipse(fx, fy, 240, 46 + hash2(i, 41) * 30, 0, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
  // layer 2 — mid pipes and gears, slowly turning
  c.fillStyle = P.mid;
  for (let i = 0; i < 9; i++) {
    const xx = ((i * 231 - px * 0.5) % 1500 + 1500) % 1500 - 220;
    const yy = 90 + hash2(i, 5) * 300;
    c.fillRect(xx, yy, 150 + hash2(i, 6) * 90, 14);
    c.save();
    c.translate(xx + 40, yy + 7);
    c.rotate(now / 4000 * (hash2(i, 8) > 0.5 ? 1 : -1));
    const gr2 = 20 + hash2(i, 7) * 14;
    c.beginPath(); c.arc(0, 0, gr2, 0, 7); c.fill();
    c.fillStyle = P.far;
    for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.fillRect(gr2 - 4, -3, 8, 6); }
    c.fillStyle = P.mid;
    c.restore();
  }
  // ground-level ambience glow that blends the backdrop into the playfield
  const gl = c.createLinearGradient(0, 380, 0, 540);
  gl.addColorStop(0, 'rgba(0,0,0,0)'); gl.addColorStop(1, P.mid);
  c.globalAlpha = 0.3; c.fillStyle = gl; c.fillRect(0, 380, 960, 160); c.globalAlpha = 1;
}
// What a hazard rail is MADE OF, per kingdom. The machine is the same in every
// zone; the metal it was cast from, the livery painted on it and what has grown
// over it since are not. `dress` is the weathering pass drawn over the finished
// trench — rime in the cold, growth in the hatchery, crystal in the seam.
const TRAP_SKIN = {
  A: { dark: '#141a22', mid: '#4d5a66', lit: '#9fadba', hazA: '#c8ce18', hazB: '#1a1d24', dress: null },
  B: { dark: '#101828', mid: '#3f4d70', lit: '#8fa3cc', hazA: '#38e6ff', hazB: '#121a2c', dress: null },
  C: { dark: '#1c1310', mid: '#6a4a38', lit: '#c09070', hazA: '#ffa032', hazB: '#241511', dress: null },
  D: { dark: '#131c26', mid: '#4a6070', lit: '#a8c6d8', hazA: '#bfe8ff', hazB: '#16222e', dress: 'rime' },
  E: { dark: '#141c14', mid: '#4a5c46', lit: '#9fb894', hazA: '#b6e84a', hazB: '#16201a', dress: 'growth' },
  X: { dark: '#1a1226', mid: '#544070', lit: '#b49ad8', hazA: '#d24bff', hazB: '#1e1430', dress: 'crystal' },
};
function drawTiles(P) {
  const g = G.grid, W = g[0].length, H = g.length;
  const x0 = 0, x1 = W - 1, y0 = 0, y1 = H - 1;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const ch = tileAt(tx, ty), X = tx * TILE, Y = ty * TILE;
    if (ch === '#') {
      const up = tileAt(tx, ty - 1);
      const exposed = up !== '#' && up !== 'B';
      // INDOORS THE FLOOR IS THE ROOM'S, NOT THE KINGDOM'S — see INDOOR_ART.
      // The strata plate is a geology plate; a workshop has no geology, so it
      // is skipped rather than tinted, which is what made the boards read as
      // meadow with a roof over them.
      const inKey = indoorKey();
      const rock = (typeof isHero === 'function' && isHero()) ? null
        : (inKey ? floorTex(inKey) : rockTex(G.roomDef.zone));
      const tex = inKey ? null : strataTex(G.roomDef.zone);
      if (rock) {
        // the material itself, sampled where this tile sits in the world so
        // neighbouring tiles are continuous rock rather than repeated stamps
        // sampled by the slab's own size, not by the constant: the drawn slab
        // is larger than the procedural bake and both have to tile correctly
        c.drawImage(rock, X % rock.width, Y % rock.height, TILE, TILE, X, Y, TILE, TILE);
        // the painted kingdom plate, where one exists, laid over the rock as
        // colour and grime rather than as the surface itself
        if (tex) {
          // BREAK THE PLATE'S EXACT PERIOD. The rock and the kingdom plate are
          // both sampled at world position modulo their own width, which is
          // continuous — the right property — and also exactly periodic, which
          // is the one the autocorrelation test in tests/grammar.cjs keeps
          // finding: a patch of C3's floor matched another patch most of a
          // screen away to within 2.7 luminance units. The plate is an OVERLAY
          // at a third alpha, so its phase can be shifted per block and its
          // strength modulated per column without any seam appearing: nothing
          // structural moves, only how much of which part of the picture lands
          // where. The rock underneath stays continuous.
          const ph = (typeof fbm1 === 'function')
            ? Math.floor(fbm1(Math.floor(X / 128) * 53, 733) * 8) * TILE : 0;
          c.globalAlpha = (typeof fbm1 === 'function')
            ? 0.22 + fbm1(X * 0.7 + Y * 0.31, 739) * 0.17 : 0.3;
          c.drawImage(tex, (X + ph) % STRATA_TW, Y % STRATA_TH, TILE, TILE, X, Y, TILE, TILE);
          c.globalAlpha = 1;
        }
        // depth: tiles buried under other tiles sit further from the light.
        // The shade used to start exactly on the tile line under the whole
        // floor — the grammar harness measured it as an 800px ruled double
        // line. On the first buried row the shade's upper boundary now
        // wanders on fBm (2px column strips, smooth alpha), so the darkening
        // arrives the way light actually gives out: unevenly.
        if (!exposed) {
          c.fillStyle = P.dark;
          const upSolid = tileAt(tx, ty - 1) === '#' || tileAt(tx, ty - 1) === 'B';
          const up2 = tileAt(tx, ty - 2);
          const firstBuried = upSolid && up2 !== '#' && up2 !== 'B';
          if (firstBuried && typeof fbm1 === 'function') {
            for (let sx = 0; sx < TILE; sx += 2) {
              const off = Math.round(fbm1(X + sx, 553) * 14) - 4;   // -4..+10
              c.globalAlpha = 0.08 + fbm1(X + sx, 557) * 0.15;
              c.fillRect(X + sx, Y + off, 2, TILE - off);
            }
          } else {
            c.globalAlpha = 0.1 + hash2(tx * 3, ty * 7) * 0.13;
            c.fillRect(X, Y, TILE, TILE);
          }
          c.globalAlpha = 1;
        }
      } else {
      // body with per-tile tonal variation
      c.fillStyle = P.solid; c.fillRect(X, Y, TILE, TILE);
      c.globalAlpha = 0.1 + hash2(tx * 3, ty * 7) * 0.22;
      c.fillStyle = P.dark; c.fillRect(X, Y, TILE, TILE);
      c.globalAlpha = 1;
      }
      if (!exposed) {
        // interior: plate seams, rivets, polychrome mottling. The rock already
        // carries its own surface, so this only dresses the flat fallback.
        if (!rock) {
          if (hash2(tx, ty) > 0.72) { c.fillStyle = P.dark; c.fillRect(X + 8, Y + 10, 5, 5); c.fillRect(X + 20, Y + 20, 4, 4); }
          if (hash2(tx * 7, ty) > 0.6) { c.fillStyle = 'rgba(0,0,0,0.14)'; c.fillRect(X, Y + 15, TILE, 2); }
          for (let k = 0; k < 2; k++) {
            const mv = hash2(tx * 11 + k * 5, ty * 13);
            if (mv > 0.45) {
              c.fillStyle = k ? P.acc2 : P.mid;
              c.globalAlpha = 0.05 + mv * 0.08;
              rr(c, X + mv * 14, Y + hash2(ty, k) * 18, 13, 9, 4); c.fill();
              c.globalAlpha = 1;
            }
          }
        }
      } else if (rock) {
        // THE WALKING SURFACE. A floor drawn as a straight bright bar across
        // the top of every tile is what makes a level read as a ruled line.
        // This cuts a broken skyline instead: each tile gets its own chipped
        // profile, keyed off its position so it is identical every visit, and
        // the ground under it is bitten away to match. The deviation stays
        // inside a few pixels — the collision is still a square, and the art
        // is never allowed to lie about where the floor is.
        const px = [];
        for (let k = 0; k <= 4; k++) {
          const hh = hash2(tx * 5 + k * 17, ty * 3);
          px.push([X + (TILE / 4) * k, Y + 1 + hh * 4.5 - (k === 2 ? 1.5 : 0)]);
        }
        c.beginPath();
        c.moveTo(X, Y + 12);
        px.forEach(p => c.lineTo(p[0], p[1]));
        c.lineTo(X + TILE, Y + 12); c.closePath();
        c.save(); c.clip();
        c.fillStyle = P.edge; c.globalAlpha = 0.85; c.fillRect(X, Y, TILE, 4);
        c.globalAlpha = 0.3; c.fillRect(X, Y + 3, TILE, 4);
        c.globalAlpha = 0.12; c.fillRect(X, Y + 6, TILE, 6);
        c.globalAlpha = 1; c.restore();
        // loose chips sitting on the lip, so the edge has thickness
        for (let k = 0; k < 3; k++) {
          const cb = hash2(tx * 13 + k * 7, ty + k);
          if (cb > 0.52) {
            c.fillStyle = P.edge; c.globalAlpha = 0.5 + cb * 0.3;
            rr(c, X + 1 + cb * 22, Y - 1 + hash2(tx, k) * 2, 3 + cb * 5, 3, 1.5); c.fill();
            c.globalAlpha = 1;
          }
        }
      } else {
        // natural walking surface: irregular lit lip, nubs
        c.fillStyle = P.edge; c.globalAlpha = 0.9; c.fillRect(X, Y, TILE, 3);
        c.globalAlpha = 0.35; c.fillRect(X, Y + 3, TILE, 3);
        c.globalAlpha = 0.14; c.fillRect(X, Y + 6, TILE, 5);
        c.globalAlpha = 1;
        // raised nubs breaking the straight line
        for (let k = 0; k < 2; k++) {
          const nb = hash2(tx * 9 + k, ty);
          if (nb > 0.35) {
            const bx = X + 2 + nb * 24, bw = 4 + hash2(tx, k) * 5;
            c.fillStyle = P.edge; c.globalAlpha = 0.8;
            rr(c, bx, Y - 2.5, bw, 4, 2); c.fill();
            c.globalAlpha = 1;
          }
        }
      }
      // what grows on the walking surface belongs to the kingdom, not to the
      // renderer that drew the lip — it runs for the rock and the fallback both
      if (exposed) {
        if (G.roomDef.zone === 'D') {
          // snow cap
          c.fillStyle = '#eefcff'; c.globalAlpha = 0.85;
          rr(c, X - 1, Y - 3, TILE + 2, 6, 3); c.fill();
          c.globalAlpha = 1;
        } else if (G.roomDef.zone === 'X') {
          // crystal chips
          if (hash2(tx, 5) > 0.5) {
            const bx = X + 4 + hash2(tx, 6) * 20;
            c.fillStyle = P.spike; c.globalAlpha = 0.9;
            c.beginPath(); c.moveTo(bx, Y); c.lineTo(bx + 3, Y - 6 - hash2(tx, 7) * 5); c.lineTo(bx + 6, Y); c.closePath(); c.fill();
            c.globalAlpha = 1;
          }
        } else if (G.roomDef.indoor) {
          // NOTHING GROWS ON A WORKSHOP FLOOR. This branch used to fall through
          // to the wire-grass below and sprout the kingdom's own teal along the
          // boards inside Ratchet's den, which is what the owner saw. What a
          // swept floor has instead is what got dropped on it: swarf, filings,
          // the odd offcut, in the room's own metal rather than in a plant hue.
          const P2 = INDOOR_PAL[indoorKey()] || INDOOR_PAL.floorDen;
          for (let k = 0; k < 2; k++) {
            if (hash2(tx * 7 + k, ty * 5) < 0.55) continue;
            const dx2 = X + 3 + hash2(tx * 5 + k, ty * 3) * 24;
            const dw2 = 1.5 + hash2(tx, k + 5) * 3.5;
            c.fillStyle = k ? P2.lit : P2.join;
            c.globalAlpha = 0.35 + hash2(tx, k + 9) * 0.35;
            c.fillRect(dx2, Y - 1, dw2, 1.6);
            c.globalAlpha = 1;
          }
        } else {
          // wire-grass tufts in two hues
          for (let k = 0; k < 2; k++) {
            const gx2 = X + 3 + hash2(tx * 5 + k, ty * 3) * 24;
            if (hash2(gx2, k) < 0.4) continue;
            const gh = 3 + hash2(tx, k + 3) * 6;
            c.strokeStyle = k ? P.acc2 : P.glow;
            c.globalAlpha = 0.65; c.lineWidth = 1.4;
            c.beginPath(); c.moveTo(gx2, Y);
            c.quadraticCurveTo(gx2 + 1, Y - gh * 0.6, gx2 + (hash2(tx, k) - 0.5) * 5, Y - gh);
            c.stroke(); c.globalAlpha = 1;
          }
          if (G.roomDef.zone === 'C' && hash2(tx, 9) > 0.7) {
            c.fillStyle = '#ff9430'; c.shadowColor = '#ff9430'; c.shadowBlur = 6;
            c.fillRect(X + 6 + hash2(tx, 10) * 18, Y + 1, 2.5, 2.5); c.shadowBlur = 0;
          }
        }
      }
      // ===================================================================
      // THE SIDES AND THE UNDERSIDE — the half of the terrain that was never
      // drawn, and the reason the floor read as flat next to the backdrop.
      //
      // A raised block and a hole in the ground were both a texture cut with a
      // ruler: perfectly vertical, perfectly straight, no lip, no crumble, no
      // shadow, nothing hanging off it. The eye reads that as a cut-out, and
      // no amount of depth in the SKY fixes it, because the plane the player
      // is standing on is the one they are actually looking at.
      //
      // Three treatments, all derived from the tile's own position so they are
      // stable frame to frame and continuous between neighbours:
      //
      //   THE BITE     an irregular silhouette on every exposed vertical face,
      //                so the edge is broken rock rather than a straight line
      //   THE LIP      a lit rim on the outer few pixels of that face, and a
      //                dark band just inside it, which is what gives a vertical
      //                surface its roundness
      //   THE HANG     teeth and roots dropping off every OVERHANG, plus the
      //                occlusion under it. This is the single loudest depth cue
      //                in the reference and the game had none of it.
      // ===================================================================
      {
        const L = tileAt(tx - 1, ty), R2 = tileAt(tx + 1, ty), D = tileAt(tx, ty + 1);
        const solid2 = (q) => q === '#' || q === 'B';
        const side = (dir) => {                       // dir -1 = left face
          const fx = dir < 0 ? X : X + TILE;
          c.save();
          // the bite: shave a few pixels off in an irregular profile, using the
          // rock behind it as the colour so the cut never shows a flat edge
          c.globalCompositeOperation = 'destination-out';
          c.beginPath(); c.moveTo(fx, Y);
          for (let q = 0; q <= 4; q++) {
            const yy = Y + (TILE / 4) * q;
            const bite = hash2(tx * 11 + q, ty * 13) * 3.2;
            c.lineTo(fx + dir * -bite, yy);
          }
          c.lineTo(fx, Y + TILE); c.lineTo(fx - dir * 4, Y + TILE); c.lineTo(fx - dir * 4, Y);
          c.closePath(); c.fill();
          c.restore();
          // the dark band inside the face, then the lit rim on it
          const gg2 = c.createLinearGradient(fx, 0, fx - dir * 9, 0);
          gg2.addColorStop(0, 'rgba(0,0,0,0.42)');
          gg2.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = gg2; c.fillRect(dir < 0 ? X : X + TILE - 9, Y, 9, TILE);
          c.globalAlpha = exposed ? 0.5 : 0.28;
          c.fillStyle = P.edge;
          c.fillRect(dir < 0 ? X : X + TILE - 1.6, Y, 1.6, TILE);
          c.globalAlpha = 1;
        };
        if (!solid2(L)) side(-1);
        if (!solid2(R2)) side(1);
        if (!solid2(D)) {
          // THE HANG. Occlusion first, so what drops off the lip is lit against
          // its own shadow rather than against the room behind it.
          const og = c.createLinearGradient(0, Y + TILE, 0, Y + TILE + 22);
          og.addColorStop(0, 'rgba(0,0,0,0.5)'); og.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = og; c.fillRect(X - 2, Y + TILE, TILE + 4, 22);
          // ...and the teeth: three per tile, each a tapering root of the same
          // material, length driven by the tile so a run of them reads as one
          // ragged edge instead of a repeated stamp
          const rock2 = (typeof isHero === 'function' && isHero()) ? null : rockTex(G.roomDef.zone);
          for (let q = 0; q < 3; q++) {
            const hx = X + 4 + q * 11 + hash2(tx * 7 + q, ty * 5) * 5;
            const hl = 5 + hash2(tx * 3 + q, ty * 9) * (exposed ? 13 : 7);
            const hw = 3.4 + hash2(tx + q, ty) * 2.6;
            c.save();
            c.beginPath();
            c.moveTo(hx - hw / 2, Y + TILE - 1);
            c.lineTo(hx + hw / 2, Y + TILE - 1);
            c.lineTo(hx + (hash2(tx, q) - 0.5) * 3, Y + TILE + hl);
            c.closePath();
            c.clip();
            if (rock2) c.drawImage(rock2, X % rock2.width, Y % rock2.height, TILE, TILE, X, Y + TILE - TILE + 2, TILE, TILE + hl);
            else { c.fillStyle = P.solid; c.fillRect(X - 4, Y + TILE - 4, TILE + 8, hl + 8); }
            // and darken as it hangs — the tip is furthest from the light
            const tg = c.createLinearGradient(0, Y + TILE, 0, Y + TILE + hl);
            tg.addColorStop(0, 'rgba(0,0,0,0)'); tg.addColorStop(1, 'rgba(0,0,0,0.55)');
            c.fillStyle = tg; c.fillRect(X - 4, Y + TILE - 2, TILE + 8, hl + 4);
            c.restore();
          }
        }
      }
    } else if (ch === '=') {
      // the authored deck is drawn per RUN after this loop; this flat bar is
      // only the fallback for before the sheet lands (or if it never does)
      if (!platReady()) {
        c.fillStyle = P.dark; c.fillRect(X, Y + 2, TILE, 7);
        c.fillStyle = P.edge; c.fillRect(X, Y, TILE, 3);
        c.globalAlpha = 0.5; c.fillRect(X + 4, Y + 9, 2.5, 4); c.fillRect(X + 25, Y + 9, 2.5, 4); c.globalAlpha = 1;
      }
    } else if (ch === '^' || ch === 'v') {
      // -----------------------------------------------------------------
      // THE HAZARD RAIL. Cones were the wrong idea twice over: a triangle
      // sitting still reads as a warning sign rather than a threat, and you
      // route around it once and never think about it again.
      //
      // Outside the Foundry this is now a MACHINED TRENCH — a recessed
      // channel with a live rail down it and hazard chevrons on the lip —
      // and a bolted saw wheel patrols every run of it long enough to walk.
      // The trench is the track; the wheel is the danger, and it has to be
      // read and timed instead of merely avoided.
      //
      // In the Foundry there is no machine at all. The floor is simply open
      // to the melt, and the melt takes whatever falls in it — hers or
      // theirs, it does not distinguish.
      // -----------------------------------------------------------------
      c.save();
      if (G.roomDef.zone === 'C' && !(typeof isHero === 'function' && isHero())) {
        // ---- THE MELT ----
        //
        // IT LOOKED LIKE A PLATFORM, and everything about the old drawing said
        // so: a dead-level top edge, a hard bright line along it, and three
        // rounded plates laid out in a row that read as BRICKS. Nothing moved.
        // A still orange rectangle with a straight lip and a masonry pattern is
        // a platform — that is what a platform is — and no amount of colour was
        // going to argue the player out of standing on it.
        //
        // Lava is a LIQUID and it is HOT, and the two things that say so are
        // motion and bloom. The surface is a moving wave rather than an edge,
        // the crust drifts along it instead of sitting in courses, bubbles rise
        // and burst, and the heat is thrown upward into the air above. The
        // straight line is gone entirely — there is nothing left in it that
        // resembles a place to stand.
        const lt = performance.now() / 1000;
        const cr = rkMix(P.dark, '#000000', 0.55);
        c.fillStyle = cr; c.fillRect(X, Y, TILE, TILE);
        // the surface, as a wave: two slow sines out of phase, sampled across
        // the tile, so neighbouring tiles join into one continuous swell
        const wav = (wx) => Math.sin(wx * 0.042 + lt * 1.15) * 3.6
                          + Math.sin(wx * 0.017 - lt * 0.7) * 2.4;
        const top = (wx) => Y + 5.5 + wav(wx);
        c.save();
        c.beginPath();
        c.moveTo(X, Y + TILE);
        for (let s = 0; s <= TILE; s += 4) c.lineTo(X + s, top(X + s));
        c.lineTo(X + TILE, Y + TILE); c.closePath();
        c.clip();
        // molten body, hottest at the surface
        const lg = c.createLinearGradient(0, Y + 2, 0, Y + TILE);
        lg.addColorStop(0, '#fffdf0'); lg.addColorStop(0.13, '#ffd070');
        lg.addColorStop(0.42, '#ff7a12'); lg.addColorStop(1, '#8a1a04');
        c.fillStyle = lg; c.fillRect(X, Y, TILE, TILE);
        // CRUST THAT FLOATS. Irregular slabs carried along by the current, their
        // position driven by time so the river is visibly running; they are torn
        // shapes, never the tidy rounded rectangles that made courses of brick.
        for (let k = 0; k < 2; k++) {
          // THE SEED MUST CARRY tx. Without it every tile in the run drew the
          // same slab at the same offset, and a row of identical dark blocks at
          // even spacing is a course of BRICKS — which is precisely what made
          // the melt read as masonry rather than liquid. The tile column is in
          // the hash and in the drift phase, so no two rafts agree.
          const seed = hash2(tx * 17 + k * 31 + 7, ty * 5 + k);
          if (seed < 0.72) continue;      // sparse: a raft, never a course of brick
          const drift = ((seed * 97 + tx * 11 + lt * 7.5) % (TILE * 3)) - TILE;
          const cx0 = X + drift, cy0 = Y + 7 + seed * 13;
          const cw = 7 + seed * 11, chh = 3 + seed * 2.4;
          c.fillStyle = 'rgba(30,9,6,0.86)';
          c.beginPath();
          c.moveTo(cx0, cy0);
          c.lineTo(cx0 + cw * 0.35, cy0 - chh * 0.75);
          c.lineTo(cx0 + cw, cy0 - chh * 0.2);
          c.lineTo(cx0 + cw * 0.7, cy0 + chh);
          c.lineTo(cx0 + cw * 0.2, cy0 + chh * 0.6);
          c.closePath(); c.fill();
          c.fillStyle = 'rgba(255,158,64,0.4)';                 // hot rim on the leading edge
          c.beginPath();
          c.moveTo(cx0, cy0); c.lineTo(cx0 + cw * 0.35, cy0 - chh * 0.75);
          c.lineTo(cx0 + cw * 0.33, cy0 - chh * 0.4); c.lineTo(cx0 + cw * 0.05, cy0 + 0.4);
          c.closePath(); c.fill();
        }
        // BUBBLES: gas coming up through it and breaking. Two per tile on their
        // own cycles, swelling as they rise and flaring white as they burst.
        for (let k = 0; k < 2; k++) {
          const bs = hash2(tx * 13 + k * 41, ty * 7 + 3);
          const ph2 = ((lt * (0.42 + bs * 0.35) + bs) % 1);
          const bx = X + 4 + bs * 24;
          const byy = Y + TILE - 3 - ph2 * (TILE - 7);
          const br = (0.9 + bs * 1.5) * (0.45 + ph2);
          c.fillStyle = ph2 > 0.86 ? 'rgba(255,246,214,0.9)' : 'rgba(255,196,96,0.5)';
          c.beginPath(); c.arc(bx, byy, br * (ph2 > 0.86 ? 1.7 : 1), 0, 7); c.fill();
        }
        c.restore();
        // the lip where the melt laps the rock — traced along the SAME wave, so
        // there is no straight line anywhere in it
        c.strokeStyle = 'rgba(255,240,196,0.85)'; c.lineWidth = 1.7;
        c.beginPath();
        for (let s = 0; s <= TILE; s += 4) {
          const wy = top(X + s);
          if (s === 0) c.moveTo(X + s, wy); else c.lineTo(X + s, wy);
        }
        c.stroke();
        // and the heat it throws into the air above it
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9;
        const hg = c.createLinearGradient(0, Y - 22, 0, Y + 12);
        hg.addColorStop(0, 'rgba(255,110,24,0)');
        hg.addColorStop(0.5, 'rgba(255,140,40,0.34)');
        hg.addColorStop(1, 'rgba(255,190,96,1)');
        c.fillStyle = hg; c.fillRect(X, Y - 22, TILE, 34);
        // and the melt lights itself: the body is re-added over the grade so the
        // room's darkening pass cannot turn a river of iron into brown paint
        c.globalAlpha = 0.5;
        c.fillStyle = 'rgba(255,120,30,0.55)';
        c.fillRect(X, Y + 6, TILE, TILE - 6);
      } else {
        // ---- THE TRENCH ----
        // A TRAP BELONGS TO THE ROOM IT IS IN. This was one machined grey
        // channel with black-and-yellow chevrons, dropped unchanged into a
        // frozen archive and a crystal seam — construction-site livery in a
        // place that has never seen a construction site. It read as imported,
        // and anything that reads as imported reads as a game object rather
        // than a thing that lives there.
        //
        // Same machine everywhere, because it IS the same machine — but built
        // of what the kingdom is built of, and weathered by what that kingdom
        // does to metal. The ice zone rimes it over, the hatchery grows on it,
        // the crystal seam grows through it.
        const SK = TRAP_SKIN[G.roomDef.zone] || TRAP_SKIN.A;
        const steelD = SK.dark;
        const steelM = rkMix(SK.mid, P.edge, 0.1);
        const steelL = rkMix(SK.lit, P.edge, 0.16);
        // recess: the floor is cut away, and you can see it is cut away
        c.fillStyle = rkMix(P.dark, '#000000', 0.78); c.fillRect(X, Y, TILE, TILE);
        c.fillStyle = steelD; c.fillRect(X, Y + 2, TILE, TILE - 2);
        // the lip on either side, machined and bolted
        c.fillStyle = steelM; c.fillRect(X, Y, TILE, 4);
        c.fillStyle = steelL; c.fillRect(X, Y, TILE, 1.4);
        for (let k = 0; k < 2; k++) {
          c.fillStyle = steelD;
          c.beginPath(); c.arc(X + 8 + k * 16, Y + 2.2, 1.3, 0, 7); c.fill();
        }
        // hazard chevrons, the universal "machinery runs here"
        c.globalAlpha = 0.55;
        for (let k = -1; k < 3; k++) {
          c.fillStyle = k % 2 ? SK.hazA : SK.hazB;
          c.beginPath();
          const cx0 = X + k * 11 + 4;
          c.moveTo(cx0, Y + 4); c.lineTo(cx0 + 6, Y + 4);
          c.lineTo(cx0 + 12, Y + 10); c.lineTo(cx0 + 6, Y + 10);
          c.closePath(); c.fill();
        }
        c.globalAlpha = 1;
        // the live rail the wheels run on, sunk at the bottom
        c.fillStyle = steelM; c.fillRect(X, Y + TILE - 8, TILE, 8);
        c.fillStyle = steelD; c.fillRect(X, Y + TILE - 8, TILE, 1.6);
        c.save();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45;
        const rg = c.createLinearGradient(0, Y + TILE - 8, 0, Y + TILE - 1);
        if (ch === 'v') { rg.addColorStop(0, 'rgba(90,220,255,0)'); rg.addColorStop(1, 'rgba(120,232,255,0.95)'); }
        else { rg.addColorStop(0, 'rgba(255,40,70,0)'); rg.addColorStop(1, 'rgba(255,46,74,0.9)'); }
        c.fillStyle = rg; c.fillRect(X, Y + TILE - 8, TILE, 7);
        c.restore();
        // THE BRITTLE STRETCH. Same rail, same teeth — but the housing is
        // cracked and its current runs cyan instead of crimson, because this
        // length of it is not earthed. Nothing announces what that means; a
        // player only learns it by standing on it, which they cannot survive
        // until they are carrying the Grounding Crest.
        if (ch === 'v') {
          c.strokeStyle = '#9fe8ff'; c.globalAlpha = 0.5; c.lineWidth = 1.2;
          for (let k = 0; k < 3; k++) {
            const h3 = hash2(tx * 3 + k, ty * 9);
            c.beginPath();
            c.moveTo(X + 3 + k * 10, Y + 5);
            c.lineTo(X + 6 + k * 10 + (h3 - 0.5) * 5, Y + 12 + h3 * 5);
            c.lineTo(X + 3 + k * 10 + (h3 - 0.5) * 7, Y + TILE - 9);
            c.stroke();
          }
          c.globalAlpha = 1;
        }
        // and a low bed of hardened teeth, so the trench itself still bites
        c.fillStyle = steelL;
        for (let k = 0; k < 4; k++) {
          const h2 = hash2(tx * 5 + k * 23, ty * 7);
          const bx = X + 4 + k * 8;
          c.beginPath();
          c.moveTo(bx - 3, Y + TILE - 7);
          c.lineTo(bx, Y + TILE - 13 - h2 * 3);
          c.lineTo(bx + 3, Y + TILE - 7);
          c.closePath(); c.fill();
        }
        // ---- WHAT THE KINGDOM HAS DONE TO IT SINCE ----
        // The weathering is what actually welds a machine into a room: clean
        // steel anywhere reads as newly installed, and nothing in these depths
        // is newly installed.
        if (SK.dress === 'rime') {
          // ice: rime crusted along the lip, and a fringe hanging into the cut
          c.fillStyle = 'rgba(226,244,255,0.75)';
          for (let k = 0; k < 5; k++) {
            const h3 = hash2(tx * 9 + k * 13, ty * 3);
            if (h3 < 0.3) continue;
            c.beginPath();
            c.ellipse(X + 3 + k * 7, Y + 1.5, 2.4 + h3 * 2.6, 1.3 + h3 * 1.1, 0, 0, 7);
            c.fill();
            c.beginPath();                                   // a short icicle
            c.moveTo(X + 1.6 + k * 7, Y + 2.4);
            c.lineTo(X + 3 + k * 7, Y + 5.5 + h3 * 4.5);
            c.lineTo(X + 4.4 + k * 7, Y + 2.4);
            c.closePath(); c.fill();
          }
        } else if (SK.dress === 'growth') {
          // hatchery: the machine has been colonised — moss in the seams and
          // pale stalks leaning out of the trench
          for (let k = 0; k < 4; k++) {
            const h3 = hash2(tx * 7 + k * 19, ty * 11);
            if (h3 < 0.35) continue;
            c.fillStyle = 'rgba(122,168,86,0.6)';
            c.beginPath();
            c.ellipse(X + 4 + k * 8, Y + 3.2, 3 + h3 * 3, 1.6, 0, 0, 7); c.fill();
            c.strokeStyle = 'rgba(186,232,138,0.65)'; c.lineWidth = 1;
            c.beginPath();
            c.moveTo(X + 4 + k * 8, Y + 3);
            c.quadraticCurveTo(X + 5 + k * 8 + (h3 - 0.5) * 5, Y - 2,
                               X + 4 + k * 8 + (h3 - 0.5) * 8, Y - 5 - h3 * 3);
            c.stroke();
          }
        } else if (SK.dress === 'crystal') {
          // the seam: it is growing THROUGH the machine, not sitting on it
          for (let k = 0; k < 4; k++) {
            const h3 = hash2(tx * 11 + k * 29, ty * 5);
            if (h3 < 0.42) continue;
            const gx = X + 3 + k * 8, gh = 5 + h3 * 7;
            const cg3 = c.createLinearGradient(gx, Y + 4, gx, Y + 4 - gh);
            cg3.addColorStop(0, 'rgba(150,90,220,0.85)');
            cg3.addColorStop(1, 'rgba(236,200,255,0.55)');
            c.fillStyle = cg3;
            c.beginPath();
            c.moveTo(gx - 2.2 - h3, Y + 5);
            c.lineTo(gx + (h3 - 0.5) * 3, Y + 5 - gh);
            c.lineTo(gx + 2.2 + h3, Y + 5);
            c.closePath(); c.fill();
          }
        }
      }
      c.restore();
    } else if (ch === 'B') {
      // ---------------------------------------------------------------------
      // THE LOOSE ROCK. A secret has to be made of the same stuff as the wall
      // around it, or it is not a secret — it is a button. So this is cut from
      // the same slab as the wall, and betrays itself only twice: its grain does
      // not line up with the rock around it, and a hairline FRACTURE runs the
      // perimeter of the mass, broken the way a real seam is, with a little
      // spill of grit where it has been quietly settling.
      //
      // That tell is the same everywhere in the game. Learn it once on the rock
      // that opens the floor in Zone A, and from then on you read every wall in
      // the factory differently — which is the whole point of teaching it.
      // ---------------------------------------------------------------------
      const rockB = (typeof isHero === 'function' && isHero()) ? null : rockTex(G.roomDef.zone);
      if (rockB) {
        // Same slab, deliberately sampled at a different offset. The joints in
        // the surrounding wall run continuously; the joints inside a loose mass
        // do not line up with them. That mismatch is the real tell — it is a
        // property of the stone rather than a mark drawn on it, it survives
        // every palette in the game, and once you have caught it once you
        // cannot stop seeing it. The fracture below just confirms what the
        // grain already said.
        const OX = 101, OY = 53;
        c.drawImage(rockB, (X + OX) % rockB.width, (Y + OY) % rockB.height, TILE, TILE, X, Y, TILE, TILE);
        const texB = strataTex(G.roomDef.zone);
        if (texB) {
          c.globalAlpha = 0.3;
          c.drawImage(texB, X % STRATA_TW, Y % STRATA_TH, TILE, TILE, X, Y, TILE, TILE);
          c.globalAlpha = 1;
        }
      } else {
        c.fillStyle = P.solid; c.fillRect(X, Y, TILE, TILE);
        c.globalAlpha = 0.16; c.fillStyle = P.dark; c.fillRect(X, Y, TILE, TILE); c.globalAlpha = 1;
      }
      // until you have broken your first one, the tell is drawn plainly enough
      // to notice. After that it drops back to a whisper and stays there.
      const taught = !!(G.save && G.save.flags && G.save.flags.taughtBreak);
      const dk = taught ? 0.72 : 0.95, lk = taught ? 0.2 : 0.34;
      const IN = 3;
      // The fracture traces the PERIMETER of the whole loose mass, never the
      // individual tiles — a boulder has one crack around it, not a grid of
      // boxes. Any edge facing another breakable is skipped, and edges that
      // meet one run out to the full tile bound so the line stays unbroken
      // across the cluster.
      const nbB = (dx, dy) => tileAt(tx + dx, ty + dy) === 'B';
      const l = nbB(-1, 0), r = nbB(1, 0), u = nbB(0, -1), d = nbB(0, 1);
      const x0 = l ? X : X + IN, x1 = r ? X + TILE : X + TILE - IN;
      const y0 = u ? Y : Y + IN, y1 = d ? Y + TILE : Y + TILE - IN;
      const edges = [];
      if (!u) edges.push([x0, Y + IN, x1, Y + IN, 0]);
      if (!d) edges.push([x0, Y + TILE - IN, x1, Y + TILE - IN, 1]);
      if (!l) edges.push([X + IN, y0, X + IN, y1, 2]);
      if (!r) edges.push([X + TILE - IN, y0, X + TILE - IN, y1, 3]);
      for (const [ax, ay, bx, by, si] of edges) {
        const dx2 = bx - ax, dy2 = by - ay, len = Math.hypot(dx2, dy2) || 1;
        const nx = -dy2 / len, ny = dx2 / len;      // edge normal, for the wander
        const N = 5;
        // one segment of the run is missing: stone never parts cleanly all round
        const skip = 1 + Math.floor(hash2(tx * 3 + si, ty * 5) * (N - 2));
        for (let k = 0; k < N; k++) {
          if (k === skip) continue;
          const t0 = k / N, t1b = (k + 1) / N;
          // the wander has to be worth several pixels or a crack spanning three
          // tiles comes out as a ruled rectangle
          const j0 = (hash2(tx * 7 + si * 13 + k, ty * 11) - 0.5) * 5;
          const j1 = (hash2(tx * 7 + si * 13 + k + 1, ty * 11) - 0.5) * 5;
          const px0 = ax + dx2 * t0 + nx * j0, py0 = ay + dy2 * t0 + ny * j0;
          const px1 = ax + dx2 * t1b + nx * j1, py1 = ay + dy2 * t1b + ny * j1;
          // the gap itself — dark, because you are seeing past the stone
          c.strokeStyle = '#000'; c.globalAlpha = dk; c.lineWidth = taught ? 1.4 : 2;
          c.beginPath(); c.moveTo(px0, py0); c.lineTo(px1, py1); c.stroke();
          // and the lip the light catches on the near side of it, which is what
          // actually makes a crack read as a crack rather than a drawn line
          c.strokeStyle = P.edge; c.globalAlpha = lk; c.lineWidth = taught ? 0.8 : 1.2;
          c.beginPath(); c.moveTo(px0 + 0.9, py0 - 1.1); c.lineTo(px1 + 0.9, py1 - 1.1); c.stroke();
        }
      }
      c.globalAlpha = 1;
      // grit trickled out of the seam — only along the bottom of the mass, and
      // only where there is open air under it to have fallen through
      if (!d) for (let k = 0; k < 4; k++) {
        const gv = hash2(tx * 17 + k, ty * 5);
        if (gv < 0.35) continue;
        c.fillStyle = P.edge; c.globalAlpha = (taught ? 0.13 : 0.24) * (0.5 + gv * 0.5);
        c.fillRect(X + 5 + gv * 21, Y + TILE - IN + 1.5 + hash2(k, tx) * 2, 1.3 + gv, 1.1);
      }
      c.globalAlpha = 1;
    }
  }
  drawPlatformRuns();
}
// ---------------------------------------------------------------------------
// AUTHORED STRATA DECKS. The one-way platforms used to be flat two-tone bars —
// a straight line across every kingdom. They are now the owner's painted decks,
// three-sliced so any run length keeps its sculpted end caps and only the
// middle band repeats: forge iron in the Foundry, rimed ice in the Archives,
// virus-grown plate in the Nest, clean steel everywhere else.
// ---------------------------------------------------------------------------
const PLAT_SLOT = {
  clean: { x: 73, y: 0, w: 366, h: 104 },
  virus: { x: 77, y: 104, w: 358, h: 104 },
  fire: { x: 61, y: 208, w: 390, h: 104 },
  ice: { x: 61, y: 312, w: 390, h: 104 },
};
function platReady() {
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.platforms;
  return !!(im && im.naturalWidth);
}
function platVariant() {
  if (typeof isHero === 'function' && isHero()) return 'clean';
  return { C: 'fire', D: 'ice', E: 'virus' }[G.roomDef.zone] || 'clean';
}
// one deck, three-sliced into an arbitrary span
function drawDeck(cx2, X, Y, RW, DH, variant) {
  if (!platReady()) return false;
  const im = MEDIA_IMG.platforms, S = PLAT_SLOT[variant] || PLAT_SLOT.clean;
  const capS = Math.round(S.w * 0.27), midS = S.w - capS * 2;
  const capD = Math.round(DH * (capS / S.h) * 1.35);
  const cw = Math.min(capD, Math.floor(RW / 2));
  cx2.save();
  cx2.drawImage(im, S.x, S.y, capS, S.h, X, Y, cw, DH);
  const midW = RW - cw * 2;
  if (midW > 0) {
    const step = Math.max(24, Math.round(capD * 1.4));
    let dx = X + cw;
    while (dx < X + cw + midW) {
      const w2 = Math.min(step, X + cw + midW - dx);
      cx2.drawImage(im, S.x + capS, S.y, Math.round(midS * (w2 / step)), S.h, dx, Y, w2, DH);
      dx += w2;
    }
  }
  cx2.save(); cx2.translate(X + RW, 0); cx2.scale(-1, 1);
  cx2.drawImage(im, S.x, S.y, capS, S.h, 0, Y, cw, DH);
  cx2.restore();
  cx2.restore();
  return true;
}
// THE DECK IS CACHED AND ERODED NOW. The honest failure the owner called
// out: the NO RIGHT ANGLES pass ran on the tile layer, but the platform
// decks draw per-frame ON TOP of it — so the squarest thing on screen was
// the one thing the erosion never touched. The runs render once into an
// offscreen canvas, the same scallop treatment bites their top and bottom
// edges, and the frame blits the result.
let platCv = null, platCvKey = '';
function drawPlatformRuns() {
  if (!platReady()) return;
  const key = G.roomId + '|' + platVariant();
  const W2px = G.roomDef.w * TILE, H2px = G.roomDef.h * TILE;
  if (platCvKey !== key || !platCv || platCv.width !== W2px) {
    platCvKey = key;
    platCv = document.createElement('canvas'); platCv.width = W2px; platCv.height = H2px;
    const p2 = platCv.getContext('2d');
    const im = MEDIA_IMG.platforms, S = PLAT_SLOT[platVariant()];
    const g = G.grid, W = g[0].length, H = g.length;
    const DH = 30, LIFT = 5;
    const capS = Math.round(S.w * 0.27);          // sculpted end, in sheet px
    const midS = S.w - capS * 2;
    const capD = Math.round(DH * (capS / S.h) * 1.35);
    let h2 = 2166136261 >>> 0;
    for (const ch of key) { h2 ^= ch.charCodeAt(0); h2 = Math.imul(h2, 16777619); }
    const prnd = () => (((h2 = Math.imul(h2 ^ (h2 >>> 15), 2246822519) >>> 0)) % 1000) / 1000;
    for (let ty = 0; ty < H; ty++) {
      let tx = 0;
      while (tx < W) {
        if (tileAt(tx, ty) !== '=') { tx++; continue; }
        let e = tx;
        while (e + 1 < W && tileAt(e + 1, ty) === '=') e++;
        const X = tx * TILE, RW = (e - tx + 1) * TILE, Y = ty * TILE - LIFT;
        const cw = Math.min(capD, Math.floor(RW / 2));
        // a short run gets the caps squeezed rather than a stretched middle
        p2.drawImage(im, S.x, S.y, capS, S.h, X, Y, cw, DH);
        const midW = RW - cw * 2;
        if (midW > 0) {
          const step = Math.max(24, Math.round(capD * 1.4));
          let dx = X + cw;
          while (dx < X + cw + midW) {
            const w2 = Math.min(step, X + cw + midW - dx);
            // per-slice source jitter (§10.7): two decks built from the same
            // slice of the same plate ARE each other, and the repeat detector
            // proved it — every mid slice now samples a wandering window of
            // the plate, so no two runs (and no two slices) match.
            const sj = Math.round(prnd() * midS * 0.35);
            p2.drawImage(im, S.x + capS + sj, S.y,
              Math.max(8, Math.round(midS * (w2 / step)) - sj), S.h, dx, Y, w2, DH);
            dx += w2;
          }
        }
        p2.save(); p2.translate(X + RW, 0); p2.scale(-1, 1);
        p2.drawImage(im, S.x, S.y, capS, S.h, 0, Y, cw, DH);
        p2.restore();
        // THE BITE — and both long edges ride the low-frequency wave now,
        // not just per-spot nibbles: white-noise nibbles average back into
        // the straight line they were meant to break (the same measured
        // lesson as the crest — see fbm1).
        p2.save(); p2.globalCompositeOperation = 'destination-out';
        const nib = (nx, ny, r) => { p2.beginPath(); p2.arc(nx, ny, r, 0, 7); p2.fill(); };
        for (let sx = 0; sx < RW; sx += 2) {
          const dTop = fbm1(X + sx + ty * 977, 661) * 5;
          if (dTop > 0.5) p2.fillRect(X + sx, Y - 1, 2, dTop + 1);
          const dBot = fbm1(X + sx + ty * 977, 663) * 6;
          if (dBot > 0.5) p2.fillRect(X + sx, Y + DH - dBot, 2, dBot + 8);
        }
        for (let nx = X + 4; nx < X + RW - 4; nx += 7 + prnd() * 9) {
          if (prnd() < 0.6) nib(nx, Y - 0.5, 1.2 + prnd() * 2.2);          // top lip
        }
        nib(X + 1, Y + DH - 2 - prnd() * 5, 3 + prnd() * 3);               // end corners
        nib(X + RW - 1, Y + DH - 2 - prnd() * 5, 3 + prnd() * 3);
        nib(X + 1 + prnd() * 3, Y + 2, 2 + prnd() * 2);
        nib(X + RW - 1 - prnd() * 3, Y + 2, 2 + prnd() * 2);
        p2.restore();
        // THE SKIRT (§10.3), grown AFTER the bite so nothing erases it:
        // tags of the deck's own bottom material stretched down 3-16px (on
        // the ice plate those pixels are icicle; on fire, slag). A platform's
        // flat underside was the one §10.3 failure erosion could never fix,
        // because erosion only removes.
        for (let nx = X + 3; nx < X + RW - 6; nx += 5 + prnd() * 8) {
          const hang = prnd() < 0.3 ? 6 + prnd() * 10 : 2 + prnd() * 5;
          const sw3 = 3 + prnd() * 3;
          p2.drawImage(im, S.x + capS + prnd() * midS * 0.6, S.y + S.h - 9, 6, 8,
            nx, Y + DH - 4 - prnd() * 4, sw3, hang + 5);
        }
        tx = e + 1;
      }
    }
  }
  c.drawImage(platCv, 0, 0);
}
// tile layer cache — tiles are static per room, so render once and blit
let tileCv = null, tileDirty = true;
// DO NOT BAKE A FLOOR YOU ARE ABOUT TO THROW AWAY.
//
// Baking the tile layer for a large room measures at about 940 ms, and the rock
// slab it is cut from is lazy like all art here. Bake first and the slab lands a
// moment later, the bake is discarded and paid for again: two seconds of stalled
// frames in the first three seconds of play. tests/memnote.cjs is what found it
// — a stalled loop plays one note of a three-note trial — and the frame counter
// agreed afterwards: 16 frames in 2.6 s against 37 before.
//
// So the bake WAITS for the slab, briefly, and does nothing else. A frame or two
// with no tile layer costs nothing; a wasted second costs the opening. The wait
// is bounded and per room: if the slab does not arrive the procedural bake runs
// and the floor is quieter, which is the same fallback everything else here has.
let rockWaitRoom = null, rockWaitT0 = 0;
const ROCK_WAIT_MS = 1200;
function rockBakeReady(zone) {
  if (typeof isHero === 'function' && isHero()) return true;
  const k = ROCK_ART[zone];
  if (!k || typeof mediaHas !== 'function' || !MEDIA_SRC || !MEDIA_SRC.images[k]) return true;
  // ...and it waits for the FULL slab, not for the first thing that answers.
  // Both tiers dirty the bake, so accepting the quarter-scale stand-in here
  // bakes the room twice over: once from the stand-in and once from the plate.
  if (typeof MEDIA_LOW !== 'undefined' && MEDIA_LOW[k] === 3) return true;
  if (typeof mediaFetch === 'function') mediaFetch(k, true);   // and ask, once asking matters
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (rockWaitRoom !== G.roomId) { rockWaitRoom = G.roomId; rockWaitT0 = now; }
  return now - rockWaitT0 > ROCK_WAIT_MS;
}

function renderTileLayer(P) {
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  // THE CANVAS IS MADE FIRST, ALWAYS. The wait below returns without baking,
  // and the draw path composites this layer unconditionally — returning before
  // the canvas existed handed drawImage a null and threw once per frame, which
  // is not "a frame or two with no tile layer", it is a dead game.
  if (!tileCv || tileCv.width !== W || tileCv.height !== H) {
    tileCv = document.createElement('canvas'); tileCv.width = W; tileCv.height = H;
  }
  // tileDirty is deliberately left set: this is "not yet", not "done"
  if (!rockBakeReady(G.roomDef.zone)) return;
  const tctx = tileCv.getContext('2d');
  tctx.clearRect(0, 0, W, H);
  const main = c; c = tctx;
  drawTiles(P);
  c = main;
  // THE CAVE SHAPE RULE, AT THE PIXEL. The carve killed the straight lines
  // in the tile GRID; this kills them in the tile FACES — the owner's
  // report after the carve shipped was "still seeing straight lines walls
  // and floors!", and the ruler that remained was the edge of the tile art
  // itself. Cave rooms get an erosion pass over the finished layer: deep
  // hash-driven scallops bitten INTO every exposed face (tops, undersides,
  // and the vertical walls, which had never been touched), and lumps of the
  // rock's own texture pushed OUTWARD past the line. Runs once per room
  // render, on the cached canvas — free at frame time.
  // ...and the pass is GLOBAL now. The owner's rule graduated from caves to
  // the whole game — "no 90 degree elevation or walls in all game!!" — so
  // every room's exposed tile faces get the erosion: scallops bitten into
  // tops, undersides and verticals, texture lumps pushed past the line. The
  // collision grid stays square; the SILHOUETTE never is.
  if (G.roomDef) erodeCaveEdges(tctx);
  // ART_BIBLE §10.3 — THE THREE-PART EDGE, after the erosion and for a
  // different reason. Erosion answers "is the silhouette straight"; this
  // answers "is the edge BARE", which is the thing the reference actually
  // never ships. tests/grammar.cjs measured 12 of 12 long edges in this game
  // with neither a lit crest nor a broken underside — a flat top and a flat
  // bottom, which is a rectangle however wobbly you make its outline.
  if (G.roomDef) organicSilhouettePass(tctx);
  if (G.roomDef) slabSilhouettePass(tctx);  // §10.3 — the other three sides
  if (G.roomDef) surfaceCurvePass(tctx);   // §10.1 — the surface stops being cells
  if (G.roomDef) edgeGrammarPass(tctx);
  // §9.1 — and lift the whole plane. Pushing the background down is only half
  // of aerial perspective; measured after the background pass alone, B4's
  // terrain still sat 9 points off its backdrop where the law asks for 10.
  // A screen wash in the zone's light lifts the face without touching hue.
  {
    // INDOORS THE LIGHT IS THE ROOM'S — see INDOOR_PAL. This wash is the last
    // thing that touches the floor, so whatever colour it is, is the colour the
    // floor is: the den's boards were baked warm and came out the same grey-
    // green as the meadow because zone A's dead teal daylight was screened over
    // them afterwards, and the same wash lit the crest in mint along the whole
    // room. Both symptoms, one line.
    const ik = (typeof indoorKey === 'function') && indoorKey();
    const L = ik ? (INDOOR_PAL[ik] || INDOOR_PAL.floorDen) : ZONE_LIGHT[G.roomDef.zone];
    if (L) {
      tctx.save();
      tctx.globalCompositeOperation = 'screen';
      tctx.globalAlpha = ik ? (L.k || 0.10) : 0.14;
      tctx.fillStyle = 'rgb(' + L.wash[0] + ',' + L.wash[1] + ',' + L.wash[2] + ')';
      tctx.fillRect(0, 0, tileCv.width, tileCv.height);
      tctx.restore();
    }
  }
  tileDirty = false;
}
// 1D fractal value noise (fBm) on the hash2 lattice: three octaves of
// smoothly interpolated values. This exists because of a measured lesson —
// the crest below first varied its height with PER-PIXEL hash noise, and the
// grammar harness still caught the crest-to-face boundary as a ruled line
// hundreds of px long. White noise has a flat mean: jitter every pixel ±3px
// and the STATISTICAL edge is still exactly straight, and so is what the eye
// reads at a glance. What breaks a line is low-frequency wander — swells over
// tens of px with detail on top — which is fBm (the construction every noise
// library ships: FastNoiseLite, Red Blob's terrain-from-noise; re-derived
// here in ten lines because the game takes no packages, see
// docs/TERRAIN_SOURCES.md).
function fbm1(x, seed) {
  let v = 0, amp = 1, freq = 1 / 61, tot = 0;
  for (let o = 0; o < 3; o++) {
    const px = x * freq, i0 = Math.floor(px), f = px - i0;
    const s = f * f * (3 - 2 * f);                 // smoothstep between lattice values
    const a = hash2(i0, seed + o * 97), b = hash2(i0 + 1, seed + o * 97);
    v += (a + (b - a) * s) * amp; tot += amp;
    amp *= 0.5; freq *= 2.3;                       // 2.3, not 2: octaves never phase-lock
  }
  // contrast-stretched: summed octaves bunch around 0.5 (they are an average),
  // and a wave that mostly whispers ±1px of its mean is a ruler with fuzz —
  // the same measured failure the per-pixel hash had. Stretch ×2.1 about the
  // centre so the output genuinely visits its whole range, clamped.
  const q = (v / tot - 0.5) * 2.1 + 0.5;
  return q < 0 ? 0 : q > 1 ? 1 : q;
}
// The lip and the skirt. Runs once per room render on the cached layer, so it
// costs nothing at frame time — the same deal erodeCaveEdges takes.
//
// Both colours are SAMPLED from the tile face rather than chosen, because this
// pass has to work over every zone's material and over authored tile art it
// has never seen. Lighten what is there for the crest, darken it for the
// hang; the material stays whatever the room said it was.
// ART_BIBLE §10.1 — THE VISUAL MESH. erodeCaveEdges bites scallops out of the
// raster edge; this replaces the tile's OUTLINE with a curved polygon, which is
// the difference between a wobbly rectangle and a shape that was never square.
//
// IT ERASES ONLY INSIDE EACH TILE'S OWN RECT, and that bound is the entire
// design rather than a detail. The first attempt built one path over every
// solid tile and applied destination-in to the finished layer — which keeps the
// destination ONLY where the path covers, so every pixel drawn OUTSIDE a solid
// tile went with it. That is most of the room's dressing: the grass standing
// above the floor, the props, the flora. It photographed as a deleted floor
// under grass that was floating in mid-air. Per-tile, rect-bounded, the worst a
// bug in here can do is shave a corner.
//
// Vertices are shared per GRID CORNER, not per tile, so the four tiles meeting
// at a corner agree on where it moved and interior seams stay watertight. And
// every vertex moves INWARD only: outward would need paint outside the rect
// this erase is bounded by, and the outward bulge is the wall pass's job.
//
// hash2 rather than a new noise function: it is already in this file, already
// deterministic, and this layer is CACHED to tileCv and redrawn only when
// tileDirty — so anything seeded on time or Math.random would give a room
// different edges on every render.
// ART_BIBLE §10.1 — THE SURFACE CURVE. This is the piece that was missing, and
// its absence is why every previous pass decorated a staircase instead of
// removing one.
//
// The unit stops being the cell. One continuous polyline is computed across the
// whole room at sub-tile resolution, the grid's 32px steps are RAMPED rather
// than stepped, and noise is added at an amplitude LARGER THAN A TILE IS TALL.
// The old pass bounded every vertex inside its own tile rect and moved it
// inward only — a safety rule adopted after an earlier attempt erased the room,
// and one that mathematically caps deviation at ~9px on a 32px cell. It made
// the fix impossible. This one is bounded per COLUMN to the band around the
// surface instead, which is just as safe and does not cap the shape.
//
// The collider never learns about any of this. She walks the same squares.
let surfCurve = null, surfRoom = null, surfSnapCv = null;
const SURF_STEP = 4;                 // horizontal sampling, well under a tile

function buildSurfaceCurve() {
  const g = G.grid;
  if (!g || !g.length || !g[0]) return null;
  const Wt = g[0].length, Ht = g.length;
  const solidAt = (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= Wt || ty >= Ht) return false;
    const ch = g[ty][tx];
    return ch === '#' || ch === 'B';
  };
  const platAt = (tx, ty) =>
    tx >= 0 && ty >= 0 && tx < Wt && ty < Ht && g[ty][tx] === '=';
  const W = Wt * TILE, N = Math.ceil(W / SURF_STEP);
  const raw = new Float32Array(N).fill(NaN);
  const soft = new Float32Array(N);          // 1 where the surface is a platform
  // A FLOATING DECK IS NOT THIS COLUMN'S GROUND, and mistaking one for the
  // other is what photographed as "flat boxes on the floor". The surface used
  // to be "first solid OR platform below the ceiling", so every column under a
  // mid-air '=' run reported its ground at the DECK's height. The ramp then
  // blended that height into the real floor on both sides, and the fill pass
  // duly built the ramp as material — two solid legs sloping from the deck's
  // ends down to the floor, with an untouched rectangle of backdrop between
  // them. A table. It is in no collision grid, she walks straight through it,
  // and its inner faces are the straightest verticals in the room.
  //
  // A platform counts as this column's surface only when it is a LIP ON THE
  // TERRAIN — ground within a tile underneath it — which is the case the
  // 'soft' branch below was written for. A deck in mid-air is drawn by
  // drawPlatformRuns, which owns its own crest and skirt; the ground curve
  // walks underneath it and never sees it.
  const surfaceOf = (tx) => {
    let ty = 0;
    while (ty < Ht && solidAt(tx, ty)) ty++;              // skip the ceiling
    while (ty < Ht) {
      while (ty < Ht && !solidAt(tx, ty) && !platAt(tx, ty)) ty++;
      if (ty >= Ht) return null;
      if (solidAt(tx, ty)) return { ty, soft: 0 };
      let k = ty + 1, gap = 0;                             // air under the deck
      while (k < Ht && !solidAt(tx, k)) { gap++; k++; }
      if (gap <= 1) return { ty, soft: 1 };
      ty++;                                                // walk past the deck
    }
    return null;
  };
  for (let i = 0; i < N; i++) {
    const s = surfaceOf(Math.floor((i * SURF_STEP) / TILE));
    if (!s) continue;
    raw[i] = s.ty * TILE;
    soft[i] = s.soft;
  }
  // RAMP the steps. A one-tile step is a 32px vertical jump; spreading it over
  // ~1.5 tiles is the single operation that kills the staircase, and it is why
  // the curve has to be computed across the span rather than per tile.
  const N2 = new Float32Array(N), RAD = Math.round((TILE * 1.5) / SURF_STEP);
  for (let i = 0; i < N; i++) {
    let acc = 0, wsum = 0;
    for (let k = -RAD; k <= RAD; k++) {
      const j = i + k; if (j < 0 || j >= N || isNaN(raw[j])) continue;
      const w = 1 - Math.abs(k) / (RAD + 1);
      acc += raw[j] * w; wsum += w;
    }
    N2[i] = wsum ? acc / wsum : NaN;
  }
  const h1 = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  const vn = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return h1(i) * (1 - u) + h1(i + 1) * u; };
  const fbm = (x) => vn(x) * 0.55 + vn(x * 2.3 + 11) * 0.28 + vn(x * 4.7 + 31) * 0.17;

  const AMP = 26;
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    if (isNaN(N2[i])) { out[i] = NaN; continue; }
    const x = (i * SURF_STEP) / TILE;
    // PLATFORMS KEEP A FLATTER CREST. A rounded mound tells the player "walk
    // up" where a ledge says "jump onto"; rolling a platform as hard as the
    // ground would quietly change what the level is asking of her.
    const amp = AMP * (soft[i] ? 0.35 : 1);
    // THE ROLL IS BIASED UPWARD, and the measurement is why. Symmetric noise
    // puts half its travel below the grid, where the cut cap immediately throws
    // it away — the surface came out deviating 8px on average, barely more than
    // the per-cell inset this whole pass exists to replace. Riding ABOVE the
    // grid line costs nothing and can never remove ground she stands on, so the
    // grid becomes the FLOOR of the range rather than its centre.
    const rise = fbm(x * 0.55) * amp + fbm(x * 1.9 + 7) * amp * 0.45;
    let y = N2[i] - rise;
    // FRACTURES. Smooth noise reads as landscape; this world is a fallen city,
    // so the curve carries occasional hard breaks — a slab dropped a few px
    // against its neighbour — instead of only rolling.
    const fseed = Math.floor(x * 0.7);
    if (h1(fseed * 3.7) > 0.72) y += (h1(fseed * 9.1) - 0.5) * 16;
    // ADD FREELY, CUT CONSERVATIVELY — and this asymmetry is the whole rule.
    // Smoothing a one-tile step produces a ramp that lies BELOW the platform's
    // own top for most of its length, and cutting to that ramp erased 40px of
    // real platform: the mound came out as a hollow arch. Rising above the grid
    // invents new material and is free; falling below destroys material she is
    // meant to stand on, so it is capped at a few px of erosion.
    // CLAMP AGAINST THE SMOOTHED PROFILE, NEVER THE RAW GRID. Clamping to
    // raw[i] re-quantised the curve onto the staircase it had just finished
    // ramping: raw jumps a full tile between adjacent columns at a step, so a
    // ±6px cut cap measured against it forces the surface back into a square
    // shoulder. The floor rolled everywhere except at steps — the one place it
    // matters. N2 is the ramped profile, so bounding deviation against it keeps
    // the ramp and still stops the surface sinking away from her feet.
    // ...but a PLATFORM clamps against its own raw top, not the ramp. Ground
    // and platforms want opposite things here: ground should ramp through its
    // steps, while a platform has a defined top the player reads as "jump onto"
    // — clamping it to the ramp too dissolved it into a dome and quietly
    // changed what the level was asking of her.
    const t = soft[i] ? raw[i] : N2[i];
    if (!isNaN(t)) y = Math.max(t - (soft[i] ? 14 : 46), Math.min(y, t + 8));
    out[i] = y;
  }
  // THE PASS AND THE COLLIDER MUST BOTH MEASURE AGAINST THE SURFACE THIS CURVE
  // WAS BUILT FROM. surfaceCurvePass used to recompute its own 'top' with a
  // different definition of solid, so the two disagreed about every platform in
  // the game and the sign of their difference — add material or cut it — was
  // decided by the mismatch. Both names are exported for the same array: 'raw'
  // is what the collision side calls it, 'top' is what the paint side does.
  return { y: out, raw, top: raw, N, W };
}
function surfaceCurve() {
  if (surfCurve && surfRoom === G.roomId) return surfCurve;
  surfCurve = buildSurfaceCurve();
  surfRoom = G.roomId;
  return surfCurve;
}

// Redraw the terrain's top surface to the curve: ADD material where the curve
// rises above the grid line, REMOVE it where the curve falls below, then lay
// the lit crest along the result. Bounded per column to the band around the
// surface, so the worst a bug can do is roughen one strip of ground.
// The curve owns the TOP surface. This owns the other three sides.
//
// Six rooms side by side made it obvious that fixing only the top was fixing
// the half nobody was complaining about in half the game: in the Conduits, the
// Archives and the Cache the floating slabs ARE the terrain the player looks
// at, and they were still rectangles with straight vertical faces and a flat
// underside — a rolling top edge on a box is still a box.
//
// Same asymmetry as the surface curve, for the same reason: material is ADDED
// outward and downward freely, because inventing silhouette can never remove
// ground she stands on, while cutting inward is capped hard.
// THE CURVE AS GROUND, not as a picture of ground.
//
// Everything before this treated the surface curve as decoration and kept the
// collider square, on the reasoning that gameplay must not change. The owner's
// correction is that this made the rule unfixable: "the curves are not about
// drawing lines as much as an actual terrain structure that allows character to
// jump on or move on instead of a straight line." A drawn hill she walks
// through is worse than no hill.
//
// So the curve becomes a HEIGHTFIELD the body stands on. It is only ever used
// where it sits ABOVE the tile top — real material was added there, so standing
// on it is standing on something that exists. Where the curve dips below the
// tile the collider still wins, because letting a body sink into drawn ground
// is how a floor stops being trustworthy.
// Returns [surfaceY, tileTopY] for a column, or null. Both are needed: the
// surface is where she stands, the tile top is the proof that something solid
// is under it. Testing for solid material half a tile BELOW the surface — the
// first version — fails on exactly the terrain this exists for, because half a
// tile below a 46px mound is still air, so she only ever got 16px of the lift.
function groundColumnAt(worldX) {
  const cur = (typeof surfaceCurve === 'function') ? surfaceCurve() : null;
  if (!cur) return null;
  // CLAMP, DO NOT REFUSE — and this was the intermittent skip.
  //
  // The curve holds N samples spaced SURF_STEP apart, so it describes
  // x = 0 .. (N-1)*SURF_STEP. A room 32 tiles wide is 1024 px and its last
  // sample sits at 1020, so for the final three pixels of EVERY room this
  // returned null: the ground snap had nothing to hold her with and she fell
  // through a floor that was plainly there — measured at x 1023 with solid tile
  // directly under her feet, vy jumping to 102 the next frame.
  //
  // It is why raising the snap distance did nothing. The answer was never "the
  // ground is too far below", it was "I do not know where the ground is", and
  // no distance fixes a missing number. The surface against the wall is the
  // surface at the last sample.
  const i = Math.min(cur.N - 1, Math.max(0, Math.round(worldX / SURF_STEP)));
  const y = cur.y[i], t = cur.raw[i];
  if (isNaN(y) || isNaN(t)) return null;
  return [y, t];
}

function slabSilhouettePass(x) {
  const g = G.grid;
  if (!g || !g.length || !g[0]) return;
  const Wt = g[0].length, Ht = g.length;
  const sol = (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= Wt || ty >= Ht) return false;
    const ch = g[ty][tx]; return ch === '#' || ch === 'B' || ch === '=';
  };
  const P = PAL[G.roomDef.zone] || PAL.A;
  const th = (typeof terrainTheme === 'function') ? terrainTheme() : null;
  const HANG = th ? Math.min(22, th.skirt) : 16;
  const h1 = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  const vn = (v) => { const i = Math.floor(v), f = v - i, u = f * f * (3 - 2 * f); return h1(i) * (1 - u) + h1(i + 1) * u; };

  // ---- UNDERSIDES: hang material off every exposed bottom ------------------
  for (let ty = 0; ty < Ht; ty++) {
    let tx = 0;
    while (tx < Wt) {
      if (!(sol(tx, ty) && !sol(tx, ty + 1))) { tx++; continue; }
      let tx2 = tx;
      while (tx2 + 1 < Wt && sol(tx2 + 1, ty) && !sol(tx2 + 1, ty + 1)) tx2++;
      const X0 = tx * TILE, X1 = (tx2 + 1) * TILE, YB = (ty + 1) * TILE;
      x.save();
      x.beginPath();
      x.moveTo(X0, YB - 1);
      for (let X = X0; X <= X1; X += 4) {
        // most columns hang short and a few hang long, so the line BREAKS
        // rather than merely wobbling — a uniform fringe is another ruler
        const n = vn(X / 26 + ty * 3.1);
        const hang = n > 0.66 ? HANG * (0.5 + n * 0.5) : HANG * 0.18 * n;
        x.lineTo(X, YB + hang);
      }
      x.lineTo(X1, YB - 1);
      x.closePath();
      x.fillStyle = P.solid; x.fill();
      x.globalAlpha = 0.62; x.fillStyle = P.dark; x.fill();
      x.restore();
      tx = tx2 + 1;
    }
  }

  // ---- VERTICAL FACES: add an irregular skin so the wall is not a ruler ----
  for (let tx = 0; tx < Wt; tx++) {
    for (const dir of [-1, 1]) {
      let ty = 0;
      while (ty < Ht) {
        if (!(sol(tx, ty) && !sol(tx + dir, ty))) { ty++; continue; }
        let ty2 = ty;
        while (ty2 + 1 < Ht && sol(tx, ty2 + 1) && !sol(tx + dir, ty2 + 1)) ty2++;
        const XE = dir < 0 ? tx * TILE : (tx + 1) * TILE;
        const Y0 = ty * TILE, Y1 = (ty2 + 1) * TILE;
        x.save();
        x.beginPath();
        x.moveTo(XE, Y0);
        for (let Y = Y0; Y <= Y1; Y += 4) {
          const n = vn(Y / 23 + tx * 5.7 + (dir < 0 ? 0 : 41));
          x.lineTo(XE + dir * n * 9, Y);         // outward only: never eats the slab
        }
        x.lineTo(XE, Y1);
        x.closePath();
        x.fillStyle = P.solid; x.fill();
        x.globalAlpha = 0.5; x.fillStyle = P.dark; x.fill();
        x.restore();
        ty = ty2 + 1;
      }
    }
  }
}

function surfaceCurvePass(x) {
  const cur = surfaceCurve();
  if (!cur) return;
  const g = G.grid, Wt = g[0].length, Ht = g.length;
  const sol = (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= Wt || ty >= Ht) return false;
    const ch = g[ty][tx]; return ch === '#' || ch === 'B' || ch === '=';
  };
  const P = PAL[G.roomDef.zone] || PAL.A;
  const rock = (typeof isHero === 'function' && isHero()) ? null
             : (typeof rockTex === 'function' ? rockTex(G.roomDef.zone) : null);
  const W = Wt * TILE, H = Ht * TILE;

  // a copy of the finished tile layer, so material can be read while the layer
  // itself is being written
  // REUSED, not reallocated. This pass ran a fresh full-room canvas allocation
  // plus a full-canvas draw on every room render, and tests/tutor.cjs — which
  // walks the whole opening under a time budget — failed only when the suite
  // was running everything else alongside it, three times for three alone.
  // That is the signature of a load-sensitive cost, not a broken step.
  if (!surfSnapCv) surfSnapCv = document.createElement('canvas');
  if (surfSnapCv.width !== W || surfSnapCv.height !== H) { surfSnapCv.width = W; surfSnapCv.height = H; }
  const surfSnap = surfSnapCv;
  const surfSnapCtx = surfSnap.getContext('2d', { willReadFrequently: true });
  surfSnapCtx.clearRect(0, 0, W, H);
  surfSnapCtx.drawImage(tileCv, 0, 0);

  // the grid's own surface height per sample — taken FROM the curve, which
  // computed it, so the two can never drift apart again
  const top = cur.top;

  // Walk the samples in runs of the same SIGN — curve above the grid, or below —
  // and treat each run as ONE REGION. Painting per 4px column instead left the
  // added mass hollow and the crest stippled, because neighbouring columns at
  // different heights never joined up.
  const regions = [];
  let i0 = 0;
  const sign = (i) => (isNaN(cur.y[i]) || isNaN(top[i])) ? 0
                    : (cur.y[i] < top[i] - 0.5 ? 1 : cur.y[i] > top[i] + 0.5 ? -1 : 0);
  while (i0 < cur.N) {
    const sg = sign(i0);
    let i1 = i0;
    while (i1 + 1 < cur.N && sign(i1 + 1) === sg) i1++;
    if (sg !== 0 && i1 > i0) regions.push({ a: i0, b: i1, sg });
    i0 = i1 + 1;
  }

  // THE ADDED MASS HAS TO SWALLOW THE TILE'S OWN LIP, and this 'over' is the
  // whole of it. drawTiles paints a lit band down the first 12px of every
  // exposed tile — the walking surface. Filling only as far as the tile line
  // left that band showing UNDER the new crest, so the floor grew a second,
  // ruler-straight highlight a few px below the rolling one: exactly the
  // double horizon this pass exists to remove, moved down by a tile. Painting
  // 16px past the line covers it, and everything under that line is solid
  // material anyway, so there is nothing there to damage. The cut branch
  // passes 0: erasing past the line would take ground she stands on.
  const regionPath = (r, over) => {
    const ov = over || 0;
    x.beginPath();
    x.moveTo(r.a * SURF_STEP, cur.y[r.a]);
    for (let i = r.a + 1; i <= r.b; i++) x.lineTo(i * SURF_STEP, cur.y[i]);
    for (let i = r.b; i >= r.a; i--) x.lineTo(i * SURF_STEP, top[i] + ov);
    x.closePath();
  };
  const OVER = 16;

  for (const r of regions) {
    if (r.sg > 0) {
      // EXTEND THE REAL MATERIAL UPWARD, do not repaint a lookalike. Filling
      // the added band with P.solid + P.dark + a rock overlay produced a tone
      // that did not match the tiles below it, so the old straight tile edge
      // came back as a SEAM: a rolling ridge sitting on a flat shelf, which is
      // worse than the flat shelf alone. Copying the drawn pixels from just
      // under the grid line and tiling them upward cannot mismatch, because it
      // is the same material.
      // FILL THE POLYGON, and take the colour FROM the material rather than
      // guessing it. Two things were learned the hard way here: drawing through
      // a clip on this path renders nothing, while filling the same path works
      // — so the fill is the mechanism; and painting the band in palette
      // colours produced a tone that did not match the tiles, which brought the
      // old straight tile edge back as a visible SEAM. A ridge sitting on a
      // flat shelf is worse than the shelf alone. Sampling the drawn material
      // just under the grid line cannot mismatch it.
      const rx = r.a * SURF_STEP, rw = (r.b - r.a + 1) * SURF_STEP;
      let lo = Infinity, hi = -Infinity;
      for (let i = r.a; i <= r.b; i++) { lo = Math.min(lo, cur.y[i]); hi = Math.max(hi, top[i]); }
      let cr = 0, cg = 0, cb = 0, cn = 0;
      try {
        // 18px DOWN, not 2. The passes before this one paint a lit crest and a
        // shadow step in the first few px under the tile top, so sampling there
        // reads the highlight instead of the material and the added mass came
        // out pale — a bright shelf instead of an invisible join.
        const sy = Math.max(0, Math.min(H - 6, hi + 18));
        const sd = surfSnapCtx.getImageData(Math.max(0, rx), sy, Math.max(1, Math.min(rw, W - rx)), 5).data;
        for (let q = 0; q < sd.length; q += 16) {
          if (sd[q + 3] < 60) continue;
          cr += sd[q]; cg += sd[q + 1]; cb += sd[q + 2]; cn++;
        }
      } catch (e) { /* fall through to the palette */ }
      regionPath(r, OVER);
      x.fillStyle = cn ? 'rgb(' + Math.round(cr / cn) + ',' + Math.round(cg / cn) + ',' +
                                  Math.round(cb / cn) + ')' : P.solid;
      x.fill();
      // ...and then GIVE IT THE FLOOR'S GRAIN. A mean colour is the right base
      // — it can never mismatch the tone — but a band of one flat colour reads
      // as a shadow lying on the ground rather than as ground, which is what
      // photographed as a dark shape sitting above a straight snow line. The
      // material is re-stamped from the finished layer 24px under the grid
      // line, tiled upward through the region, so the grain is literally the
      // same rock: same texture, same zone plate, same erosion.
      x.save();
      regionPath(r, OVER); x.clip();
      const srcY = Math.max(0, Math.min(H - 8, hi + 24));
      const bandH = Math.min(TILE, H - srcY);
      if (bandH > 4) {
        x.globalAlpha = 0.62;
        for (let yy = hi + bandH; yy > lo - bandH; yy -= bandH)
          x.drawImage(surfSnap, rx, srcY, rw, bandH, rx, yy - bandH, rw, bandH);
        x.globalAlpha = 1;
      }
      x.restore();
      // a touch of depth so the added mass is not a flat plate of one colour —
      // and it FADES TO NOTHING at the join. Running the darkening to full
      // strength at the bottom of the region put a 22% black step exactly on
      // the tile line, where the untouched body below it carried none: the
      // added mass read as a shadow lying on the floor rather than as the
      // floor, and the seam between them was the straightest line in the room.
      // Depth belongs under the crest, where the light actually falls off.
      x.save();
      regionPath(r, OVER); x.clip();
      const gg = x.createLinearGradient(0, lo, 0, hi + OVER);
      gg.addColorStop(0, 'rgba(255,255,255,0.05)');
      gg.addColorStop(0.35, 'rgba(0,0,0,0.12)');
      gg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gg; x.fillRect(rx, lo, rw, hi - lo + OVER + 2);
      x.restore();
    } else {
      // the curve sits BELOW: cut the grid's square shoulder away
      x.save();
      x.globalCompositeOperation = 'destination-out';
      regionPath(r);
      x.fillStyle = '#000'; x.fill();
      x.restore();
    }
  }

  // THE CREST, as one continuous stroked polyline rather than per-column rects.
  // Stroking is also what lets it follow a slope without stair-stepping.
  const strokeCurve = (col, wdt, off, alpha) => {
    x.save();
    x.globalAlpha = alpha;
    x.strokeStyle = col; x.lineWidth = wdt;
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.beginPath();
    let started = false;
    for (let i = 0; i < cur.N; i++) {
      if (isNaN(cur.y[i])) { started = false; continue; }
      const X = i * SURF_STEP, Y = cur.y[i] + off;
      if (!started) { x.moveTo(X, Y); started = true; } else x.lineTo(X, Y);
    }
    x.stroke();
    x.restore();
  };
  // THE CREST IS THE KINGDOM'S OUTSIDE AND THE ROOM'S INSIDE. P.edge is zone
  // A's bright rim, stroked 3px wide at 0.8 along the whole surface: outdoors
  // that is the walk line reading at a glance across a dark meadow, and it is
  // right. Indoors it is a lit strip following the workshop floor in the
  // kingdom's own colour — traced, continuous, and the single most visible
  // reason the den read as the field outside it. A floor still needs an edge,
  // so it keeps one, in the room's own material and quietly.
  const ik2 = (typeof indoorKey === 'function') && indoorKey();
  const IP = ik2 && (INDOOR_PAL[ik2] || INDOOR_PAL.floorDen);
  strokeCurve(IP ? IP.join : P.dark, 7, 6, IP ? 0.26 : 0.34);   // the shadow step
  strokeCurve(IP ? IP.lit  : P.edge, 2, 1, IP ? 0.40 : 0.8);    // the lit crest
}

function organicSilhouettePass(x) {
  const g = G.grid;
  if (!g || !g.length || !g[0]) return;
  const Ht = g.length, Wt = g[0].length;
  const th = (typeof terrainTheme === 'function' ? terrainTheme() : null);
  const R = Math.min(9, th ? th.rough * 0.75 : 5);
  // '=' is terrain too. The first version's solid test was copied from
  // erodeCaveEdges and knew only '#' and 'B', so it treated every floating
  // platform as air and left them out of the mesh entirely.
  const sol = (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= Wt || ty >= Ht) return false;
    const ch = g[ty][tx];
    return ch === '#' || ch === 'B' || ch === '=';
  };
  // per-corner inset, 0..R, stable for a given room
  // A TOP FACE ROLLS, a side face only roughens. The floor reading as a box is
  // not a lighting problem — the surface LINE is flat, and no crest fixes that.
  // Top insets run 2..ROLL px and are keyed on the grid corner alone, so the
  // two tiles sharing a corner get the same height and the surface is
  // continuous across the whole run rather than stepping per tile.
  const ROLL = 9;
  const insTop = (cx) => 2 + hash2(cx * 3.1 + 23, 7) * (ROLL - 2);
  const ins = (cx, cy) => hash2(cx * 2.3 + 17, cy * 2.3 + 41) * R;
  const mid = (a, b) => hash2(a * 1.9 + 71, b * 1.9 + 13) * R;

  for (let ty = 0; ty < Ht; ty++) {
    for (let tx = 0; tx < Wt; tx++) {
      if (!sol(tx, ty)) continue;
      const up = !sol(tx, ty - 1), dn = !sol(tx, ty + 1);
      const lf = !sol(tx - 1, ty), rt = !sol(tx + 1, ty);
      if (!up && !dn && !lf && !rt) continue;      // buried: it stays square
      const X = tx * TILE, Y = ty * TILE;

      const tlx = X + (lf ? ins(tx, ty) : 0),               tly = Y + (up ? insTop(tx) : 0);
      const trx = X + TILE - (rt ? ins(tx + 1, ty) : 0),    try_ = Y + (up ? insTop(tx + 1) : 0);
      const brx = X + TILE - (rt ? ins(tx + 1, ty + 1) : 0), bry = Y + TILE - (dn ? ins(tx + 1, ty + 1) : 0);
      const blx = X + (lf ? ins(tx, ty + 1) : 0),           bly = Y + TILE - (dn ? ins(tx, ty + 1) : 0);

      x.save();
      x.beginPath();
      x.rect(X, Y, TILE, TILE);                    // outer: the tile
      x.moveTo(tlx, tly);                          // inner: the shape kept
      if (up) x.quadraticCurveTo(X + TILE / 2, Y + (insTop(tx) + insTop(tx + 1)) * 0.5 + mid(tx, ty) * 0.8, trx, try_);
      else x.lineTo(trx, try_);
      if (rt) x.quadraticCurveTo(X + TILE - mid(tx + 1, ty) * 1.5, Y + TILE / 2, brx, bry);
      else x.lineTo(brx, bry);
      if (dn) x.quadraticCurveTo(X + TILE / 2, Y + TILE - mid(tx, ty + 1) * 1.5, blx, bly);
      else x.lineTo(blx, bly);
      if (lf) x.quadraticCurveTo(X + mid(tx, ty + 2) * 1.5, Y + TILE / 2, tlx, tly);
      else x.lineTo(tlx, tly);
      x.closePath();
      x.globalCompositeOperation = 'destination-out';
      x.fillStyle = '#000';
      x.fill('evenodd');                           // the rim between the two
      x.restore();
    }
  }
}
function edgeGrammarPass(x) {
  const g = buildRoom(G.roomId);
  const TH = typeof terrainTheme === 'function' ? terrainTheme() : { rough: 10, lip: 4, skirt: 16, crack: 0.3, edge: 'glow', hang: 'plates' };
  const Wt = G.roomDef.w, Ht = G.roomDef.h;
  const solid = (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= Wt || ty >= Ht) return false;
    const ch = g[ty][tx];
    return ch === '#' || ch === 'B';
  };
  const W = Wt * TILE;
  const img = x.getImageData(0, 0, W, Ht * TILE), d = img.data;
  const px = (X, Y) => { const i = ((Y * W + X) << 2); return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };

  // ---- 1. THE LIP: a bright, irregular crest on every top face -------------
  for (let ty = 0; ty < Ht; ty++) {
    for (let tx = 0; tx < Wt; tx++) {
      if (!solid(tx, ty) || solid(tx, ty - 1)) continue;
      const y0 = ty * TILE;
      for (let X = tx * TILE; X < tx * TILE + TILE; X++) {
        // find the true top of the drawn material in this column — erosion has
        // already moved it off the tile line, and a crest painted on the tile
        // line instead of on the ROCK is exactly the pasted-on look we are
        // removing.
        // START ABOVE THE ROLL, not above the tile line. This search used to
        // begin 6px up, which was generous when the only thing above the line
        // was an erosion lump — and wrong the moment the surface roll began
        // lifting ground by up to ~13px. On a raised column the walk found
        // rock at once and painted the crest six pixels INSIDE the mass,
        // where nothing can see it: the grammar harness read those stretches
        // as ground with no lit lip, and it was right. 28px clears the
        // deepest roll any kingdom asks for.
        let Y = y0 - 28;
        while (Y < y0 + TILE && (px(X, Math.max(0, Y))[3] < 40)) Y++;
        if (Y >= y0 + TILE) continue;
        const [r, gg, b] = px(X, Math.min(Ht * TILE - 1, Y + 3));
        // §10.3 asks for irregular — and irregular means fBm, not per-pixel
        // hash: the harness measured the old per-pixel crest's lower boundary
        // as a ruled line, because white noise averages straight. The crest
        // now swells 2-9px on low-frequency wander with a ±1px chip on top,
        // so the crest-to-face transition genuinely meanders.
        const h = 2 + Math.round(fbm1(X, 917) * TH.lip * 1.6 + (hash2(X, 919) - 0.5) * 2);
        for (let k = 0; k < h; k++) {
          const i = (((Y + k) * W + X) << 2);
          if (d[i + 3] < 40) continue;
          const t = 1 - k / h;                    // brightest at the very crest
          d[i]     = Math.min(255, r  + 70 * t);
          d[i + 1] = Math.min(255, gg + 68 * t);
          d[i + 2] = Math.min(255, b  + 60 * t);
        }
        // AND THE SHADOW UNDER IT. Lifting the crest alone does nothing on a
        // material that is already near-white — D3's ice floor clamped at 255
        // and the edge stayed invisible. A lit lip is a STEP, so the band just
        // beneath it is pushed down; that reads as an edge at any base value,
        // and it is what the eye actually uses to find the top of a solid.
        // ...and the step is DEEPER the brighter the material, because on a
        // near-white face the lift has nowhere to go. The Archives' ice floor
        // clamps at 255, so a fixed 30% shadow left one stretch of ground in
        // three frames with no readable crest at all (grammar: "129px@y479
        // NO-LIP"). The darkening now scales with the crest's own luminance —
        // dark rock keeps its gentle 30%, white ice gets up to 48% — so the
        // STEP survives at any base value, which was always the point of
        // having a step rather than a highlight.
        const crestL = (0.2126 * r + 0.7152 * gg + 0.0722 * b) / 255;
        const dark = 0.30 + 0.18 * Math.max(0, Math.min(1, (crestL - 0.45) / 0.45));
        for (let k = h; k < h + 6; k++) {
          const i = (((Y + k) * W + X) << 2);
          if (d[i + 3] < 40) continue;
          const t = 1 - (k - h) / 6;
          const m = 1 - dark * t;
          d[i]     = Math.round(d[i]     * m);
          d[i + 1] = Math.round(d[i + 1] * m);
          d[i + 2] = Math.round(d[i + 2] * m);
        }
        // ...and the lip GLOWS (owner's mesh spec): a soft two-pixel fringe
        // into the air above the crest, so the walk line reads at a glance in
        // the dark rooms without lightPass having to shout for it.
        for (let k = 1; k <= 2 && !TH.noGlow; k++) {
          if (Y - k < 0) break;
          const gi = (((Y - k) * W + X) << 2);
          if (d[gi + 3] >= 40) continue;          // air only — never over rock
          d[gi]     = Math.min(255, Math.round(r * 0.7) + 70);
          d[gi + 1] = Math.min(255, Math.round(gg * 0.7) + 70);
          d[gi + 2] = Math.min(255, Math.round(b * 0.7) + 62);
          d[gi + 3] = Math.max(d[gi + 3], k === 1 ? 88 : 44);
        }
        // WHAT GROWS ON THIS KINGDOM'S CREST. The signature the player reads
        // at eye level while walking: crystal teeth in the catacombs, molten
        // seams in the Foundry, icicles in the Archives, a breathing red in
        // the Deep. Hashed, never random — this is baked into the cached
        // layer, so a per-frame random would boil the whole floor.
        const eh = hash2(X, 887);
        if (TH.edge === 'crystal' && eh > 0.90) {
          for (let k = 1; k <= 4; k++) {           // a tooth standing up
            const gy2 = Y - k;
            if (gy2 < 0) break;
            const i2 = ((gy2 * W + X) << 2);
            const t2 = 1 - k / 5;
            d[i2]     = Math.min(255, 150 + 90 * t2);
            d[i2 + 1] = Math.min(255, 190 + 60 * t2);
            d[i2 + 2] = 255;
            d[i2 + 3] = Math.max(d[i2 + 3], Math.round(210 * t2 + 40));
          }
        } else if (TH.edge === 'molten' && eh > 0.55) {
          for (let k = 0; k < 2; k++) {            // a seam still cooling
            const i2 = (((Y + k) * W + X) << 2);
            if (d[i2 + 3] < 40) continue;
            d[i2]     = 255;
            d[i2 + 1] = Math.min(255, Math.round(d[i2 + 1] * 0.4) + 130);
            d[i2 + 2] = Math.round(d[i2 + 2] * 0.35);
          }
        } else if (TH.edge === 'ice' && eh > 0.86) {
          const ln = 3 + Math.floor(hash2(X, 889) * 5);
          for (let k = 1; k <= ln; k++) {          // an icicle hanging in air
            const gy2 = Y + h + k;
            if (gy2 >= Ht * TILE) break;
            const i2 = ((gy2 * W + X) << 2);
            if (d[i2 + 3] > 40) continue;
            const t2 = 1 - k / (ln + 1);
            d[i2] = 200; d[i2 + 1] = 232; d[i2 + 2] = 255;
            d[i2 + 3] = Math.round(200 * t2);
          }
        } else if (TH.edge === 'flesh' && eh > 0.5) {
          for (let k = 0; k < 2; k++) {            // infected, and it shows
            const i2 = (((Y + k) * W + X) << 2);
            if (d[i2 + 3] < 40) continue;
            d[i2]     = Math.min(255, d[i2] + 60);
            d[i2 + 1] = Math.round(d[i2 + 1] * 0.6);
            d[i2 + 2] = Math.round(d[i2 + 2] * 0.7);
          }
        } else if (TH.edge === 'prism' && eh > 0.80) {
          const i2 = ((Y * W + X) << 2);            // one faceted glint
          d[i2] = Math.min(255, d[i2] + 40);
          d[i2 + 1] = Math.min(255, d[i2 + 1] + 20);
          d[i2 + 2] = 255;
        }
      }
    }
  }

  // ---- 2. THE SKIRT: a broken under-hang on every bottom face --------------
  // This is also the answer to the owner's standing note that a platform
  // hanging in mid-air needs something holding it. A skirt that drips and
  // trails reads as structure; a flat underside reads as a floating slab.
  for (let ty = 0; ty < Ht; ty++) {
    for (let tx = 0; tx < Wt; tx++) {
      if (!solid(tx, ty) || solid(tx, ty + 1)) continue;
      const yb = (ty + 1) * TILE;
      for (let X = tx * TILE; X < tx * TILE + TILE; X++) {
        let Y = yb + 6;
        while (Y > yb - TILE && px(X, Math.max(0, Math.min(Ht * TILE - 1, Y)))[3] < 40) Y--;
        if (Y <= yb - TILE) continue;
        const [r, gg, b] = px(X, Math.max(0, Y - 3));
        // strands of varying length — §10.3 wants 8-24px, and wants it broken,
        // so most columns hang short and a few hang long.
        const n = hash2(X, 331);
        // per-kingdom reach: the Deep trails 24px of tendril, the arc
        // facility's glass panels barely lip over their frame at 10.
        const long2 = Math.round(TH.skirt * 0.75), short2 = Math.round(TH.skirt * 0.3);
        const len = n > 0.82 ? long2 + Math.floor(hash2(X, 332) * TH.skirt * 0.5)
                  : n > 0.55 ? short2 + Math.floor(hash2(X, 333) * TH.skirt * 0.3)
                  : 0;
        // ...and what it is MADE of. Same silhouette law, six materials: the
        // hang is dark and mineral by default, tinted and lit where the
        // kingdom's own stuff hangs off it.
        const HG = TH.hang;
        for (let k = 1; k <= len; k++) {
          const YY = Y + k;
          if (YY >= Ht * TILE) break;
          const i = ((YY * W + X) << 2);
          if (d[i + 3] > 40) continue;            // never paint over real tile
          const t = 1 - k / (len + 2);
          if (HG === 'roots') {                   // living veins off the rock
            d[i]     = Math.round(r * 0.30) + 26;
            d[i + 1] = Math.round(gg * 0.22);
            d[i + 2] = Math.round(b * 0.40) + 34;
          } else if (HG === 'slag') {             // it is still hot down there
            d[i]     = Math.round(r * 0.42) + 40;
            d[i + 1] = Math.round(gg * 0.26) + 14;
            d[i + 2] = Math.round(b * 0.20);
          } else if (HG === 'frost') {            // rime, pale even in shadow
            d[i]     = Math.round(r * 0.44) + 44;
            d[i + 1] = Math.round(gg * 0.50) + 52;
            d[i + 2] = Math.round(b * 0.54) + 60;
          } else if (HG === 'tendrils') {         // the Deep grows downward
            d[i]     = Math.round(r * 0.40) + 32;
            d[i + 1] = Math.round(gg * 0.18);
            d[i + 2] = Math.round(b * 0.46) + 26;
          } else {                                // plates / glass: mineral
            d[i]     = Math.round(r  * 0.34);
            d[i + 1] = Math.round(gg * 0.34);
            d[i + 2] = Math.round(b  * 0.36);
          }
          d[i + 3] = Math.round(235 * t);
        }
      }
    }
  }
  // ---- 3. THE ANTI-TILING PASS (§10.7) ------------------------------------
  // B4 and C3 autocorrelated at exactly 32px — the tile pitch — which is the
  // signature of every tile drawing itself identically. §10.7 asks for four
  // variants, random flips and decals; all three are ways of saying "make the
  // pitch stop being findable", and per-tile variation does it without needing
  // four hand-authored sheets for a renderer that is procedural anyway.
  //
  // Deliberately subtle. This runs over the finished face, so a heavy hand
  // reads as dirt rather than as material — the target is to break the
  // correlation, not to decorate.
  for (let ty = 0; ty < Ht; ty++) {
    for (let tx = 0; tx < Wt; tx++) {
      if (!solid(tx, ty)) continue;
      // one variant per tile, four of them, plus a per-tile value offset
      const v = Math.floor(hash2(tx * 7 + 1, ty * 13 + 3) * 4);
      const k = 0.90 + hash2(tx + 41, ty + 97) * 0.20;      // 0.90 .. 1.10
      const x0 = tx * TILE, y0 = ty * TILE;
      for (let Y = y0; Y < y0 + TILE; Y++) {
        for (let X = x0; X < x0 + TILE; X++) {
          const i = ((Y * W + X) << 2);
          if (d[i + 3] < 40) continue;
          // the variant rotates WHICH sub-band of the tile gets lifted, so two
          // tiles with the same k still differ in where the light sits
          const lx = (X - x0), ly = (Y - y0);
          const band = ((v === 0 ? ly : v === 1 ? lx : v === 2 ? lx + ly : lx - ly + TILE) >> 3) & 3;
          const kk = k * (1 + (band - 1.5) * 0.028);
          d[i]     = Math.max(0, Math.min(255, Math.round(d[i]     * kk)));
          d[i + 1] = Math.max(0, Math.min(255, Math.round(d[i + 1] * kk)));
          d[i + 2] = Math.max(0, Math.min(255, Math.round(d[i + 2] * kk)));
        }
      }
      // FRACTURES, at this kingdom's density (the spec's crackDensity). A
      // hairline running down an exposed face, hashed per tile so it is the
      // same crack every time the room renders — the spec's Math.random()
      // would have re-cracked the whole world on every cache rebuild.
      if (!solid(tx, ty - 1) && hash2(tx + 613, ty + 727) < TH.crack) {
        const cx0 = tx * TILE + 4 + Math.floor(hash2(tx, ty) * (TILE - 8));
        const clen = 8 + Math.floor(hash2(tx + 3, ty + 3) * (TILE - 8));
        for (let k = 0; k < clen; k++) {
          const cyy = ty * TILE + 3 + k;
          const cxx = cx0 + Math.round(fbm1(cyy * 3 + tx * 37, 733) * 5 - 2.5);
          if (cyy >= Ht * TILE || cxx < 0 || cxx >= W) break;
          const i = ((cyy * W + cxx) << 2);
          if (d[i + 3] < 40) continue;
          const t = 1 - k / clen;
          d[i]     = Math.round(d[i]     * (1 - 0.55 * t));
          d[i + 1] = Math.round(d[i + 1] * (1 - 0.55 * t));
          d[i + 2] = Math.round(d[i + 2] * (1 - 0.50 * t));
        }
      }
      // ...and a decal on some tiles — §10.7 wants 20-40% density
      if (hash2(tx + 211, ty + 307) < 0.32) {
        const cxp = x0 + 4 + hash2(tx, ty + 5) * (TILE - 8);
        const cyp = y0 + 4 + hash2(tx + 5, ty) * (TILE - 8);
        const rad = 3 + hash2(tx + 9, ty + 9) * 6;
        const dark = hash2(tx + 17, ty + 17) < 0.5;
        for (let Y = Math.max(0, cyp - rad) | 0; Y < Math.min(Ht * TILE, cyp + rad); Y++) {
          for (let X = Math.max(0, cxp - rad) | 0; X < Math.min(W, cxp + rad); X++) {
            const dx = X - cxp, dy = Y - cyp;
            const q = 1 - (dx * dx + dy * dy) / (rad * rad);
            if (q <= 0) continue;
            const i = ((Y * W + X) << 2);
            if (d[i + 3] < 40) continue;
            const m = 1 + (dark ? -0.20 : 0.16) * q;
            d[i]     = Math.max(0, Math.min(255, Math.round(d[i]     * m)));
            d[i + 1] = Math.max(0, Math.min(255, Math.round(d[i + 1] * m)));
            d[i + 2] = Math.max(0, Math.min(255, Math.round(d[i + 2] * m)));
          }
        }
      }
    }
  }

  // ---- 3. THE WALL EDGE: the same grammar, rotated 90° ---------------------
  // The harness found the room-border walls as bare vertical rules hundreds
  // of px tall — the lip/skirt passes only ever looked at tops and bottoms.
  // A vertical exposed face gets a narrow lit edge whose depth wanders on the
  // same fBm the crest uses, so neither the face line nor its lit band is
  // straight. Left faces are lit, right faces get the dark version — one
  // world light direction, per the sacred-ground-plane law.
  for (let ty = 0; ty < Ht; ty++) {
    for (let tx = 0; tx < Wt; tx++) {
      if (!solid(tx, ty)) continue;
      for (const [side, lit] of [[-1, true], [1, false]]) {
        if (solid(tx + side, ty)) continue;
        const xf = side < 0 ? tx * TILE : tx * TILE + TILE - 1;
        const inward = -side;                     // from the air into the rock
        for (let Y = ty * TILE; Y < ty * TILE + TILE; Y++) {
          // walk in from 6px out in the air to the drawn material — erosion
          // has already moved the true surface off the tile line
          let X = xf + side * 6, steps = 0;
          while (steps < TILE && px(Math.max(0, Math.min(W - 1, X)), Y)[3] < 40) { X += inward; steps++; }
          if (steps >= TILE) continue;
          const wdepth = 1 + Math.round(fbm1(Y, lit ? 421 : 431) * 3 + (hash2(Y, 433) - 0.5));
          for (let k = 0; k < wdepth; k++) {
            const XX = X + inward * k;
            const i = ((Y * W + Math.max(0, Math.min(W - 1, XX))) << 2);
            if (d[i + 3] < 40) continue;
            const t = 1 - k / (wdepth + 0.5);
            if (lit) {
              d[i]     = Math.min(255, d[i]     + 44 * t);
              d[i + 1] = Math.min(255, d[i + 1] + 42 * t);
              d[i + 2] = Math.min(255, d[i + 2] + 38 * t);
            } else {
              d[i]     = Math.round(d[i]     * (1 - 0.30 * t));
              d[i + 1] = Math.round(d[i + 1] * (1 - 0.30 * t));
              d[i + 2] = Math.round(d[i + 2] * (1 - 0.28 * t));
            }
          }
        }
      }
    }
  }
  x.putImageData(img, 0, 0);
}
function erodeCaveEdges(x) {
  const g = buildRoom(G.roomId);
  const Wt = G.roomDef.w, Ht = G.roomDef.h;
  const solid = (tx2, ty2) => {
    if (tx2 < 0 || ty2 < 0 || tx2 >= Wt || ty2 >= Ht) return true;
    const ch = g[ty2][tx2];
    return ch === '#' || ch === 'B';
  };
  // outward lumps (they copy clean face pixels), erosion second
  for (let ty = 0; ty < Ht; ty++) for (let tx = 0; tx < Wt; tx++) {
    if (!solid(tx, ty)) continue;
    const X = tx * TILE, Y = ty * TILE;
    // [edge, air-check, lump src rect + dst offset]
    const edges = [];
    if (!solid(tx, ty - 1)) edges.push('T');
    if (!solid(tx, ty + 1)) edges.push('B');
    if (!solid(tx - 1, ty)) edges.push('L');
    if (!solid(tx + 1, ty)) edges.push('R');
    for (const ed of edges) {
      const r0 = hash2(tx * 11 + ed.charCodeAt(0), ty * 19 + 7);
      // a lump of the face itself, shoved past the line
      if (r0 > 0.35) {
        const u = 3 + hash2(tx * 5, ty * 3 + r0 * 9) * (TILE - 14);
        const lw = 7 + r0 * 9, lh = 4 + r0 * 4;
        try {
          if (ed === 'T') x.drawImage(tileCv, X + u, Y + 2, lw, lh, X + u - 1, Y - lh + 2, lw, lh);
          if (ed === 'B') x.drawImage(tileCv, X + u, Y + TILE - 2 - lh, lw, lh, X + u + 1, Y + TILE - 2, lw, lh);
          if (ed === 'L') x.drawImage(tileCv, X + 2, Y + u, lh, lw, X - lh + 2, Y + u + 1, lh, lw);
          if (ed === 'R') x.drawImage(tileCv, X + TILE - 2 - lh, Y + u, lh, lw, X + TILE - 2, Y + u - 1, lh, lw);
        } catch (e) {}
      }
    }
  }
  x.save();
  x.globalCompositeOperation = 'destination-out';
  for (let ty = 0; ty < Ht; ty++) for (let tx = 0; tx < Wt; tx++) {
    if (!solid(tx, ty)) continue;
    const X = tx * TILE, Y = ty * TILE;
    const bite = (ex, ey, big) => {
      x.beginPath(); x.arc(ex, ey, big, 0, 7); x.fill();
    };
    // one large scallop and a few small ones per exposed face; positions and
    // depths off the tile coordinate so the coastline is stable every frame
    const face = (ed) => {
      for (let i = 0; i < 4; i++) {
        const rA = hash2(tx * 13 + ed * 3 + i, ty * 23 + 2 + i * 7);
        const u1 = rA * TILE;
        const rad = i < 2 ? 3.5 + rA * 5 : 1.5 + rA * 2.2;   // two big, two small
        if (i < 2 && rA < 0.25) continue;                    // some faces keep a big edge
        if (ed === 1) bite(X + u1, Y - 0.5, rad);
        if (ed === 2) bite(X + u1, Y + TILE + 0.5, rad);
        if (ed === 3) bite(X - 0.5, Y + u1, rad);
        if (ed === 4) bite(X + TILE + 0.5, Y + u1, rad);
      }
    };
    if (!solid(tx, ty - 1)) face(1);
    if (!solid(tx, ty + 1)) face(2);
    if (!solid(tx - 1, ty)) face(3);
    if (!solid(tx + 1, ty)) face(4);
    // THE LOW-FREQUENCY WAVE — §10.1's "4-12px rougher", finally measured in.
    // Scallops and lumps roughen the line LOCALLY, but their mean stays on
    // the tile line, so a long floor still reads — and the grammar harness
    // still measures — as a rule with fuzz on it. A slow fBm wave now sinks
    // the whole silhouette 0-10px on ~30-140px wavelengths (the technique
    // every terrain-noise source reduces to: low-frequency swell, detail on
    // top — docs/TERRAIN_SOURCES.md). The crest pass walks down to whatever
    // surface it finds, so the lit lip rides the wave for free, and the
    // collider never moves: this is layer (b) work only.
    if (typeof fbm1 === 'function') {
      // per-kingdom amplitude: the Foundry and the Deep are savaged, the arc
      // facility is machined and barely moves. Same wave, six materials.
      const TH = typeof terrainTheme === 'function' ? terrainTheme() : { rough: 10 };
      if (!solid(tx, ty - 1)) {
        for (let sx = 0; sx < TILE; sx += 2) {
          const dep = fbm1(X + sx, 641) * TH.rough;
          if (dep > 0.5) x.fillRect(X + sx, Y - 0.5, 2, dep + 0.5);
        }
      }
      if (!solid(tx - 1, ty)) {
        for (let sy = 0; sy < TILE; sy += 2) {
          const dep = fbm1(Y + sy, 643) * TH.rough * 0.8;
          if (dep > 0.5) x.fillRect(X - 0.5, Y + sy, dep + 0.5, 2);
        }
      }
      if (!solid(tx + 1, ty)) {
        for (let sy = 0; sy < TILE; sy += 2) {
          const dep = fbm1(Y + sy, 647) * TH.rough * 0.8;
          if (dep > 0.5) x.fillRect(X + TILE - dep, Y + sy, dep + 0.5, 2);
        }
      }
    }
  }
  x.restore();
  // ---- THE SURFACE ROLL, and why it BUILDS UP rather than digging down ----
  // The owner's floor report, measured before it was believed: A1 sd 3.7px,
  // C3 sd 4.7px — and D3 sd 1.28px with a 96px stretch at one exact height.
  // The Archives floor genuinely was a bar.
  //
  // The obvious fix — deepen the erosion wave — is WRONG, and the spec that
  // asks for it does not know why. Erosion only REMOVES: sink the drawn
  // surface 10px into a dip and the collider stays where it was, so the
  // player walks across the dip standing 10px above the floor she can see.
  // That is not organic ground, it is a floating character.
  //
  // So the roll is built UPWARD from the collision line instead. Each exposed
  // top column copies a strip of the tile's own face up by an fBm height, and
  // the collision line becomes the FLOOR of the roll rather than its middle —
  // the player is never above the drawn surface, at worst slightly bedded
  // into it, which is exactly how a real figure stands on real ground. This
  // is ART_BIBLE §10.1's two-mesh separation used in the direction that is
  // safe for gameplay, and it is why no collider changes.
  const THr = (typeof terrainTheme === 'function' ? terrainTheme() : { rough: 8 }).rough;
  for (let ty = 0; ty < Ht; ty++) for (let tx = 0; tx < Wt; tx++) {
    if (!solid(tx, ty) || solid(tx, ty - 1)) continue;
    const X = tx * TILE, Y = ty * TILE;
    for (let sx = 0; sx < TILE; sx += 2) {
      // WAVELENGTH IS THE WHOLE FIGHT, and it was measured: at fbm1's base
      // period (~61px) a smooth wave is nearly level for tens of pixels
      // around each crest and trough, which is precisely the 67-96px dead-flat
      // stretches the floor profiler found. Sampling ~2.4x faster puts a full
      // rise-and-fall inside ~25px, so no part of the surface can hold one
      // height long enough to read as a bar — and a second, slower term keeps
      // the ground from becoming corrugated instead of rolling.
      const rise = Math.round((fbm1((X + sx) * 2.4, 601) * 0.7
                             + fbm1((X + sx) * 0.5, 607) * 0.3) * THr * 1.8);
      if (rise < 1) continue;
      try {
        // the strip is the tile's own top material, so the roll is made of
        // whatever this kingdom's rock actually is
        x.drawImage(tileCv, X + sx, Y + 1, 2, Math.min(TILE - 2, rise + 3),
                            X + sx, Y + 1 - rise, 2, Math.min(TILE - 2, rise + 3));
      } catch (e) {}
    }
  }
}
// ===========================================================================
// THE LAIR. Every guardian was already asleep when you walked in — `dorm` poses
// and per-boss wake roars — but it was asleep on the FLOOR, in an empty room,
// which says nothing about what it is. A creature is told by where it lives:
// the eagle has a nest, the unicorn stands on ice over frozen water, the dragon
// sleeps in the crucible it was cast in.
//
// So each arena now contains one authored prop, and the boss starts IN it. It
// is not a cutscene — it is scenery the animal is standing on, and the wake is
// the same movement it always was, just performed somewhere that means
// something. The prop stays after the fight starts; it is the room, not an
// intro.
//
// IT IS BACKGROUND, NOT FURNITURE. The first cut drew the lairs in the entity
// layer at full strength and the den alone was 560 px of a 960 px room — a
// large opaque object standing in the middle of an arena you have to fight in,
// which is worse than an empty room, because now the floor you can use is
// hidden behind a picture you cannot.
//
// So it goes BEHIND the tile layer, at parallax, dimmed into the room's own
// air. The level's real geometry — floor, platforms, the ground she stands and
// fights on — draws over the top of it, which means the prop can never take a
// pixel of playable space and never lies about where a surface is. What is left
// is what was wanted: the animal is asleep on something, and the something
// recedes into the room instead of occupying it.
//
// Anchoring: `ax`/`ay` are where the boss's SPAWN FOOT sits inside the plate,
// in plate-fractions. That is the only sane way to place these — measuring from
// a corner means every plate needs its own offset re-guessed whenever the art
// is regenerated, and the art will be regenerated.
//   par  — parallax factor: how much of the camera's motion it takes. < 1 puts
//          it behind the room without needing a second scene graph.
//   dim  — how far it sinks into the room's air. Kept high; a lair that reads
//          as strongly as the boss is competing with the boss.
const LAIR = {
  glitch: { key: 'lairDen',    w: 360, ax: 0.50, ay: 0.62, par: 0.86, dim: 0.38 },
  brood:  { key: 'lairNest',   w: 250, ax: 0.50, ay: 0.50, par: 0.86, dim: 0.36 },
  atlas:  { key: 'lairForge',  w: 340, ax: 0.50, ay: 0.70, par: 0.86, dim: 0.34 },
  zero:   { key: 'lairPeak',   w: 210, ax: 0.46, ay: 0.30, par: 0.88, dim: 0.36 },
  prism:  { key: 'lairVault',  w: 210, ax: 0.46, ay: 0.70, par: 0.88, dim: 0.36 },
  mother: { key: 'lairCradle', w: 230, ax: 0.50, ay: 0.60, par: 0.88, dim: 0.36 },
};
function drawLair() {
  const b = G.boss;
  if (!b || (typeof isHero === 'function' && isHero())) return;
  const L = LAIR[b.kind];
  if (!L) return;
  const im = MEDIA_IMG[L.key];
  if (!im || !im.naturalWidth) return;
  // the SPAWN position, not the live one — the whole point is that the lair
  // stays where the animal was sleeping while the animal walks away from it
  const fx = (b.spawnX != null ? b.spawnX : b.x) + b.w / 2;
  const fy = (b.spawnY != null ? b.spawnY : b.y) + b.h;
  const w = L.w, h = w * im.naturalHeight / im.naturalWidth;
  const x0 = fx - w * L.ax, y0 = fy - h * L.ay;
  c.save();
  // parallax about the camera's centre: the caller has already translated by
  // -cam, so shifting by (1 - par) x the camera offset slides it back
  c.translate(camSX() * (1 - L.par), camSY() * (1 - L.par));
  c.globalAlpha = 1 - L.dim;
  c.drawImage(im, x0, y0, w, h);
  // ...and a veil of the room's own colour over it, so it sits IN the air
  // rather than behind a sheet of grey. Multiply-ish via the zone glow at low
  // alpha keeps it the room's picture and not a decal.
  c.globalAlpha = L.dim * 0.5;
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = (PAL[G.roomDef.zone] || {}).far || '#0b0d11';
  c.fillRect(x0 - 4, y0 - 4, w + 8, h + 8);
  c.restore();
}
// ===========================================================================
// THE FLORA — what actually grows in each kingdom.
//
// Every room in the game was mineral: tiles, girders, spikes, a vista behind
// it. Nothing LIVED in the world except the things trying to kill you, which
// is what makes a corridor read as a corridor rather than as a place. Each
// kingdom now has two species of its own, generated in 3D on the same terms as
// the bestiary (ART_BIBLE.md §3.2) and rooted along the floor.
//
// They are DRESSING, not level geometry: no collision, no damage, nothing to
// learn. That is deliberate — a plant that can hurt you is a trap, and traps
// belong to the trap system where the player can be taught about them. These
// are here to answer "where am I", and the answer is different in every zone.
//
//   k   — how many TILES tall the plant stands
//   par — parallax factor; under 1 it sits behind the play plane and drifts
//   dim — how far it is pushed back into the room's own colour
const FLORA = {
  A: [{ key: 'floraA1', k: 3.4, par: 0.94, dim: 0.30 },   // scrap-meadow bloom
      { key: 'floraA2', k: 1.7, par: 0.97, dim: 0.22 }],  // cable creeper
  B: [{ key: 'floraB1', k: 3.8, par: 0.94, dim: 0.32 },   // conduit reed
      { key: 'floraB2', k: 1.8, par: 0.97, dim: 0.24 }],  // conduit fan
  C: [{ key: 'floraC1', k: 2.9, par: 0.94, dim: 0.28 },   // foundry torch
      { key: 'floraC2', k: 1.9, par: 0.97, dim: 0.22 }],  // ember-grass
  D: [{ key: 'floraD1', k: 3.2, par: 0.94, dim: 0.30 },   // archive frond
      { key: 'floraD2', k: 2.4, par: 0.97, dim: 0.24 }],  // ice spindle
  E: [{ key: 'floraE1', k: 3.4, par: 0.94, dim: 0.32 },   // deep lantern
      { key: 'floraE2', k: 2.2, par: 0.97, dim: 0.26 }],  // deep coral
  X: [{ key: 'floraX1', k: 3.0, par: 0.94, dim: 0.28 },   // prism lily
      { key: 'floraX2', k: 1.8, par: 0.97, dim: 0.22 }],  // prism thicket
};
// WHERE THEY GROW, decided once per room and never again.
//
// Hashed off the room id rather than rolled: a plant that moves when you walk
// back through a door is worse than no plant at all, and Math.random() in a
// draw call would do exactly that. Same room, same garden, every visit, on
// every platform — which is also the only version of this that RULE ONE can be
// true of, since the phone and the web page must draw the same picture.
const FLORA_CACHE = {};
function floraPlan(id) {
  if (FLORA_CACHE[id]) return FLORA_CACHE[id];
  const def = ROOMS[id], set = FLORA[def && def.zone];
  const out = [];
  if (!def || !set) return (FLORA_CACHE[id] = out);
  // ...and no garden grows inside a room either. The planter walks the zone's
  // species list over every room the zone owns, and an interior is one of them,
  // so cable creeper was rooted in the Tinker's floorboards.
  if (def.indoor) return (FLORA_CACHE[id] = out);
  const g = buildRoom(id);
  // a cheap deterministic stream seeded on the room's name
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rnd2 = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  // one plant per stretch of floor, spaced so they never overlap each other
  const W = def.w;
  for (let x = 2; x < W - 2; x += 3 + Math.floor(rnd2() * 4)) {
    if (rnd2() > 0.42) continue;                       // most gaps stay empty
    // find the topmost solid tile in this column that has open air above it —
    // a plant rooted in a ceiling, or buried inside a girder, is the tell that
    // this was placed by arithmetic and not by a gardener
    let gy = -1;
    for (let y = 1; y < def.h - 1; y++) {
      const here = g[y] && g[y][x], above = g[y - 1] && g[y - 1][x];
      if ((here === '#' || here === '=') && (above === '.' || above === undefined)) { gy = y; break; }
    }
    if (gy < 2) continue;
    const s = set[rnd2() < 0.42 ? 0 : 1];              // the tall one is rarer
    out.push({ s, x: (x + 0.5) * TILE, y: gy * TILE,
               flip: rnd2() < 0.5, sc: 0.68 + rnd2() * 0.62,
               lean: (rnd2() - 0.5) * 0.14, ph: rnd2() * 6.283 });
  }
  return (FLORA_CACHE[id] = out);
}
// ===========================================================================
// THE TWO ROOMS IN FRONT OF THE MEADOW, and the props that make them places.
//
// W1 is the cradle she was hooked into. W2 is the road to the city, with the
// gates standing open at the end of it. Both are drawn in the same pass as the
// lair — behind the tile layer, on parallax — so she walks IN the room rather
// than in front of a picture of it.
//
//   x    — where it sits, as a fraction of the room's width
//   k    — how many TILES tall it stands
//   par  — parallax factor
//   dim  — how far it is pushed back into the room's own colour
const ROOM_PROP = {
  W1: { key: 'cradle', alt: 'cradleOpen', x: 0.16, k: 6.2, par: 0.90, dim: 0.20 },
  // W2's gates are NOT here. They are a full-frame painting, and a full-frame
  // painting drawn as a prop is a rectangle with a seam down the room — see
  // ROOM_VISTA, where they belong.
};
// ===========================================================================
// THE FRONTIER — the last room of a kingdom can SEE the next one.
//
// WHY THIS EXISTS. The free chapter ends at the door out of the Scrap Meadows,
// and the screen there asks the player to want five more kingdoms. Until now
// they had no reason to: every room in the game shares its kingdom's horizon,
// so a player reaching that door had seen exactly one kind of place and was
// being asked to imagine the rest. A promise is weaker than a glimpse.
//
// WHAT IT IS NOT. Not a painting pasted into the room — this codebase has
// already learned that lesson twice (see ROOM_VISTA on the city gates: a
// full-frame render dropped in as a prop reads as a photograph laid on the
// scene, with a hard seam down it). And not the next kingdom's backdrop swapped
// in behind this one, which would just look like the room got the wrong art.
//
// What it is: LIGHT FROM SOMEWHERE ELSE. A3's build already cuts an opening in
// its ceiling — `rect(g, 25, 0, 28, 0, '.')`, the hole she climbs through to
// reach B1 — and the Data Conduits are lit in a cold cyan (PAL.B.glow, #5fc8e8)
// that nothing in the warm scrap-yellow Meadows uses. So the hole is bright
// with a colour this kingdom does not own, and a shaft of it falls the full
// height of the room. It says "there is somewhere else up there, and it is not
// like here" without contradicting a single thing about where she is standing.
//
// The colour is read from the destination zone's own palette rather than typed
// in, so a kingdom re-themed later re-lights its own frontier for free.
const FRONTIER = {
  // room: the ceiling opening in tiles, and which kingdom is on the other side
  A3: { tx0: 25, tx1: 29, zone: 'B' },
};
function drawFrontier() {
  if (typeof isHero === 'function' && isHero()) return;
  const F = FRONTIER[G.roomId];
  if (!F) return;
  const col = ((typeof PAL !== 'undefined' && PAL[F.zone]) || {}).glow || '#5fc8e8';
  const x0 = F.tx0 * TILE, x1 = F.tx1 * TILE, w = x1 - x0, cx = (x0 + x1) / 2;
  const H = G.roomDef.h * TILE;
  const drop = H * 0.86;                       // how far the light reaches down
  const spread = 1.7;                          // and how much it opens out
  const t = performance.now() / 1000;
  // a live shaft, not a decal: the intensity breathes and the edges waver, the
  // way light through a gap does when there is air moving in it
  const breathe = 0.86 + Math.sin(t * 0.55) * 0.10 + Math.sin(t * 1.7) * 0.04;
  c.save();
  c.globalCompositeOperation = 'lighter';
  // THE NUMBERS ARE MEASURED, NOT CHOSEN. The first pass of this used the
  // alphas a subtle background effect would use — 0.20 on the shaft, 0.55 on
  // the mouth — and pixel-probing the live frame showed it adding about 14/33/46
  // to a floor already sitting near 68/59/47. Technically present, and on a
  // phone in daylight completely invisible. This is the one moment in the free
  // chapter whose whole job is to be noticed, so it is lit like a set piece:
  // roughly three times that, in two layers, with a near-white core.
  // 1. THE SHAFT — a soft trapezoid opening downward, fading as it falls
  const shaft = (widen, a, top) => {
    const g1 = c.createLinearGradient(0, 0, 0, drop);
    g1.addColorStop(0, top); g1.addColorStop(0.30, col); g1.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = a * breathe;
    c.fillStyle = g1;
    c.beginPath();
    c.moveTo(cx - w * 0.5 * (widen > 1 ? 1 : 0.55), 0);
    c.lineTo(cx + w * 0.5 * (widen > 1 ? 1 : 0.55), 0);
    c.lineTo(cx + w * widen / 2, drop); c.lineTo(cx - w * widen / 2, drop);
    c.closePath(); c.fill();
  };
  shaft(spread, 0.30, col);                    // the body of the beam
  shaft(spread * 0.5, 0.34, '#ffffff');        // and the hot core inside it
  // 2. THE HALO — light does not stop at the edge of the hole it came through
  const g0 = c.createRadialGradient(cx, TILE * 0.4, 0, cx, TILE * 0.4, w * 1.5);
  g0.addColorStop(0, col); g0.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = 0.42 * breathe;
  c.fillStyle = g0;
  c.beginPath(); c.arc(cx, TILE * 0.4, w * 1.5, 0, 7); c.fill();
  // 3. THE MOUTH — the opening itself, blown out. Drawn from y=0 rather than
  // above it: the camera sits within a few pixels of the room's top edge here,
  // so anything painted off the top of the room is simply never seen.
  c.globalAlpha = 0.95 * breathe;
  const g2 = c.createLinearGradient(0, 0, 0, TILE * 2.6);
  g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.35, col); g2.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g2;
  c.fillRect(x0 - 6, 0, w + 12, TILE * 2.6);
  // 3. WHAT DRIFTS IN IT. Dust only exists where light is, which is the oldest
  // trick there is for making a beam read as volume rather than as a gradient.
  const mote = (typeof QUAL !== 'undefined' && !QUAL.glow) ? 0 : 22;
  c.globalAlpha = 0.5;
  c.fillStyle = col;
  for (let i = 0; i < mote; i++) {
    // deterministic per-speck, so nothing is allocated and nothing flickers
    const ph = i * 2.399;
    const k = ((t * (0.05 + (i % 5) * 0.012) + i * 0.137) % 1);
    const y = k * drop;
    const wide = w * (1 + (spread - 1) * (y / drop));
    const x = cx + Math.sin(ph + t * 0.3 + k * 4) * wide * 0.42;
    const a = Math.sin(k * Math.PI);           // born and dies inside the beam
    c.globalAlpha = 0.7 * a * breathe;
    c.beginPath(); c.arc(x, y, 1.1 + (i % 3) * 0.5, 0, 7); c.fill();
  }
  // 4. WHERE IT LANDS. Ground-anchored, so it obeys the art harness's probe —
  // tests/artbible.cjs measures her FEET against the floor and a glow pooled
  // under them is exactly the decoration G.artProbe exists to switch off.
  if (!G.artProbe) {
    const fy = drop;
    const g3 = c.createRadialGradient(cx, fy, 0, cx, fy, w * spread * 0.6);
    g3.addColorStop(0, col); g3.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = 0.30 * breathe;
    c.fillStyle = g3;
    c.beginPath(); c.ellipse(cx, fy, w * spread * 0.6, TILE * 0.9, 0, 0, 7); c.fill();
  }
  c.restore();
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}
function drawRoomProp() {
  if (typeof isHero === 'function' && isHero()) return;
  const P = ROOM_PROP[G.roomId];
  if (!P) return;
  if (typeof mediaFetch === 'function') { mediaFetch(P.key); if (P.alt) mediaFetch(P.alt); }
  // the cradle swaps to its RELEASED plate the instant it lets her go, and
  // stays there for the rest of the run — the room remembers being left
  const released = P.alt && !(G.wake && G.wake.t > 0.55);
  const im = MEDIA_IMG[released ? P.alt : P.key];
  if (!im || !im.naturalWidth) return;
  const h = P.k * TILE, w = h * (im.naturalWidth / im.naturalHeight);
  const fx = G.roomDef.w * TILE * P.x, fy = 15 * TILE;
  c.save();
  c.translate(camSX() * (1 - P.par), camSY() * (1 - P.par));
  c.globalAlpha = 1 - P.dim;
  c.drawImage(im, fx - w / 2, fy - h, w, h);
  c.globalAlpha = P.dim * 0.5;
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = (PAL[G.roomDef.zone] || {}).far || '#0b0d11';
  c.fillRect(fx - w / 2 - 4, fy - h - 4, w + 8, h + 8);
  c.restore();
  // the moment itself: coolant vapour off the disconnecting umbilicals
  if (G.roomId === 'W1' && G.wake && chance(0.6))
    addPart(fx + rnd(-w * 0.2, w * 0.2), fy - rnd(20, h * 0.7),
      rnd(-18, 18), rnd(-40, -12), 0.9, '#aef7d8', 2, -30, true);
}
// ===========================================================================
// WALKING INTO THE CITY.
//
// The gates are the destination of the whole opening, and until now arriving
// meant sliding off the right-hand edge of the room like any other doorway —
// which is the one thing that would not do, because the gates are the picture
// the walk was built toward. You press UP at them and she GOES IN: turns her
// back on the camera, walks into the gap between the doors, and gets smaller.
//
// IT IS HER. NOT A SHEET OF HER.
//
// The first cut of this drew the walk-away from `roster_8yaw.png` row 0 — an
// eight-angle turnaround of a robot cat that has sat in the repo unused since
// the beginning. It has a back view, which is what this moment wants, and it
// is A DIFFERENT CHARACTER: a different build, a different palette, a staff she
// does not carry. Putting it on screen swapped the protagonist for a stranger
// for two seconds, and the owner spotted it instantly and asked what had
// happened to his hero. Nothing had; I had drawn somebody else.
//
// So this draws HER — the live, procedural, IK-solved body with the simulated
// scarf, exactly the one that walks around every other room — positioned in
// screen space and scaled down as she goes. Her gait is driven for the shot
// (she is held, so her own velocity is zero) and restored immediately after.
// If she is ever to be seen from behind it will be authored FOR her, from her,
// and not borrowed off an old sheet.
// `gx`/`gy` are where the gap between the doors sits INSIDE the painting, as a
// fraction of it — so the vanishing point follows the backdrop wherever the
// camera has panned it to, instead of being a screen position that only lines
// up from one spot in the room.
// ---------------------------------------------------------------------------
// THE DEPTH DOOR — the one mechanic for walking INTO the background, and the
// owner's ruling is that it is load-bearing: "we will keep using it." So it is
// a TABLE, not a special case. Each entry is a doorway standing in a room's
// backdrop; UP in front of it walks her in (the authored back-walk), the room
// changes under the fade, and she arrives at a stated fraction of the target
// room rather than at a hard-coded pixel.
//
//   at  — where the door stands, as a fraction of the room's width
//   to  — the room the walk arrives in
//   gx/gy — the vanishing point inside the backdrop painting (vista-relative)
//   ax  — arrival x in the TARGET room, as a fraction of ITS width.
//         Omitted = x=40, the original city-gate behaviour.
//
// Two doors may face each other (A5 <-> CV1, the crystal cave) and the pair is
// a two-way passage; a door may also be one-way by simply having no partner
// (W2 -> A0, the opening — the city gates close behind her). tests/crystal.cjs
// drives a full round trip; tests/deadend.cjs carries these as graph edges.
// A door may carry `need`: the save flag that makes it EXIST. Until the flag
// is set there is no door — no prompt, no walk — which is how the guardian
// grottoes appear: every boss or sage resolved reveals its lair's cave
// (world.js GROTTOES; the owner's rule).
const GATE_ROOM = {
  // 0.50 stands the monument OVER the backdrop's own painted gates — at 0.85
  // the two read as TWO different gates ("why two gates?"). The painting is
  // scenery behind the structure; one spot, one gate. The massed wall at
  // 37-39 stays the kingdom's outer boundary behind both.
  W2:  { at: 0.50, to: 'A0',  gx: 0.472, gy: 0.93 },
  // the trader's booth on the waking floor, and the way back out of it
  A0:  { at: 0.765, to: 'A0B', ax: 0.12, style: 'booth' },
  A0B: { at: 0.12,  to: 'A0',  ax: 0.765, style: 'booth' },
  // 0.68 is measured off the fired plate (§2c): the painted opening's centre
  // sits at gx 0.68, and aiming the walk at the old 0.64 sent her into rock
  // a shoulder's width left of the hole
  // BURIED (owner, 2026-08-23: "the first cave or tunnel that I face needs to
  // be covered with rubbles, and it should emit a sound from within that
  // attracts me to go there... I have to go and hit the rubble to go inside").
  // `rubble` names the save flag that records it opened. Until then the mouth
  // refuses the walk-in and takes hits instead — see rubbleHit().
  A5:  { at: 0.72, to: 'CV1', gx: 0.68,  gy: 0.62, ax: 0.10, rubble: 'rubbleA5' },
  // TWO DOORS, and the first row in the table to carry an array. The way back
  // out to the meadow, and — buried, like the mouth she broke to get in here —
  // the side passage into THE SEAM. This row is the proof that a room can hold
  // more than one way inward; adding a third is adding a comma.
  CV1: [
    { at: 0.10, to: 'A5',  gx: 0.516, gy: 0.563, ax: 0.72 },
    { at: 0.62, to: 'CV1B', ax: 0.12, rubble: 'rubbleCV1B' },
  ],
  CV1B: { at: 0.12, to: 'CV1', ax: 0.62 },
  // the Oracle's parlor off B3 — the booth pattern again, but its OWN style:
  // Ratchet's fired kiosk plate must never stand in the Conduits, so the
  // Oracle's shrine draws its own stand-in (drawOracleBooth) until its plate
  // lands (ART_QUEUE §2h)
  B3:  { at: 0.50, to: 'B3B', ax: 0.12, style: 'oracle' },
  B3B: { at: 0.12, to: 'B3',  ax: 0.50, style: 'oracle' },
  // the Tinker's forge off C5 — the booth pattern a third time, its OWN
  // style again: neither the trader's kiosk nor the Oracle's shrine may
  // stand in the Foundry, so the quench hood draws its own stand-in
  // (drawTinkerForge) until its plate lands (ART_QUEUE §2k). It stands at
  // the right end of the Pour Gallery, under the platform the second gun
  // holds — the errand's targets are the guns outside his own door.
  C5:  { at: 0.8125, to: 'C5B', ax: 0.12, style: 'forge' },
  C5B: { at: 0.12, to: 'C5',  ax: 0.8125, style: 'forge' },
  // the Sage's carrel off D1 — the booth pattern a fourth time, its OWN
  // style again: no other kingdom's shrine may stand in the Archives, so
  // the leaning shelf-stacks draw their own stand-in (drawSageCarrel) until
  // the plate lands (ART_QUEUE §2m). It stands where the sage used to
  // hover — between the bench and the terminal, a door's width from both.
  D1:  { at: 0.40, to: 'D1B', ax: 0.12, style: 'carrel' },
  D1B: { at: 0.12, to: 'D1',  ax: 0.40, style: 'carrel' },
  // the Nymph's hollow off E1 — the booth pattern a fifth time, its OWN
  // style again: no other kingdom's shrine may stand in the Nest, so the
  // burst cocoon-pod draws its own stand-in (drawLumenHollow) until the
  // plate lands (ART_QUEUE §2o). It stands where Lumen used to stand —
  // between the riddle and the way east, lit with her own leaf-green.
  E1:  { at: 0.42, to: 'E1B', ax: 0.12, style: 'hollow' },
  E1B: { at: 0.12, to: 'E1',  ax: 0.42, style: 'hollow' },
  // the grottoes — one per guardian, opened by its fall or taming
  A4:  { at: 0.14, to: 'GA1', gx: 0.50, gy: 0.86, ax: 0.06, need: 'bossGlitch' },
  A10: { at: 0.12, to: 'GA2', gx: 0.50, gy: 0.86, ax: 0.06, need: 'alpha' },
  B4:  { at: 0.86, to: 'GB1', gx: 0.50, gy: 0.86, ax: 0.06, need: 'bossBrood' },
  C3:  { at: 0.12, to: 'GC1', gx: 0.50, gy: 0.86, ax: 0.06, need: 'bossAtlas' },
  D3:  { at: 0.86, to: 'GD1', gx: 0.50, gy: 0.86, ax: 0.06, need: 'bossZero' },
  X1:  { at: 0.45, to: 'GX1', gx: 0.50, gy: 0.86, ax: 0.06, need: 'bossPrism' },
  E3:  { at: 0.86, to: 'GE1', gx: 0.50, gy: 0.86, ax: 0.06, need: 'bossMother' },
  GA1: { at: 0.06, to: 'A4',  gx: 0.50, gy: 0.86, ax: 0.14 },
  GA2: { at: 0.06, to: 'A10', gx: 0.50, gy: 0.86, ax: 0.12 },
  GB1: { at: 0.06, to: 'B4',  gx: 0.50, gy: 0.86, ax: 0.86 },
  GC1: { at: 0.06, to: 'C3',  gx: 0.50, gy: 0.86, ax: 0.12 },
  GD1: { at: 0.06, to: 'D3',  gx: 0.50, gy: 0.86, ax: 0.86 },
  GX1: { at: 0.06, to: 'X1',  gx: 0.50, gy: 0.86, ax: 0.45 },
  GE1: { at: 0.06, to: 'E3',  gx: 0.50, gy: 0.86, ax: 0.86 },
};
// THE DOOR STANDS STILL. It used to be anchored to the painted backdrop,
// which pans at parallax speed — so as the player walked, the whole gate
// structure slid against the world. The owner, in a cave: "the gate is
// moving with me in the background... making me hard to locate the actual
// gate." A door is a place; places do not follow you. The gate now lives at
// a fixed WORLD x (the stand spot in the table), the painted gap behind it
// stays pure scenery, and the prompt, the trigger, the structure and the
// walk-in all agree on the one spot.
function gateWorldX(G2) { return G.roomDef.w * TILE * G2.at; }
// the vanishing point of the walk-in, in screen space: the middle of the
// gap, lifted off the floor so she recedes INTO the doorway instead of
// sliding along the ground (the owner's exact complaint)
function gateTarget(G2) {
  return { x: gateWorldX(G2) - camSX(), y: (G.roomDef.h - 2) * TILE - camSY() - 46 };
}
// ---------------------------------------------------------------------------
// THE DOOR HAS A BODY NOW (owner: "create 3D structures looking like a huge
// door on top of the background door, but still in the background —
// multilayers that open dynamically when you press up"). Two layers of
// architecture stand over the painted gap: a colossal dim arch glued to the
// backdrop, and a nearer frame with two massive leaves that drift with their
// own parallax — the drift IS the depth. The leaves crack when she stands
// close (anticipation) and slide wide while the walk carries her through,
// light spilling out of the opening. Screen-space, drawn with the backdrop,
// under everything that plays. Authored door plates can replace the leaf
// faces later; the mechanism stays.
// A CAVE HAS A MOUTH, NOT A DOOR (owner, 2026-08-15: "caves should look
// like a cave opening, not a door"). Any gate touching a cave — the room it
// stands in or the room it leads to — draws as an irregular rock opening:
// a seeded jagged rim, hanging teeth, no straight edge anywhere (the NO
// RIGHT ANGLES rule). The "doors opening" read becomes the inner glow
// swelling as she approaches and walks in. Authored mouth plates (ART_QUEUE
// §2f) will replace this at the same anchor.
// A FIRED SCENE PLATE, STOOD IN THE ROOM. The §2f gates and cave mouths are
// full-frame paintings, and a full-frame painting drawn as a rectangle is a
// photograph laid on the scene — the exact fault the vista rework fixed. So
// each plate is masked once into a cached canvas: edges feathered away on all
// four sides, harder at the sides and the sky, a whisper at the ground line
// where it has to sit on the floor. What draws is a standing formation, not a
// card. Cached at most 1100px wide — the draw is ~300 world-px tall, so full
// 2K residency would buy nothing but memory.
const SCENE_PLATE = {};
function scenePlate(key) {
  if (SCENE_PLATE[key]) return SCENE_PLATE[key];
  if (typeof mediaFetch === 'function') mediaFetch(key);
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[key];
  if (!im || !im.naturalWidth) return null;
  const scl = Math.min(1, 1100 / im.naturalWidth);
  const W = Math.round(im.naturalWidth * scl), H = Math.round(im.naturalHeight * scl);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.drawImage(im, 0, 0, W, H);
  x.globalCompositeOperation = 'destination-out';
  const fade = (x0, y0, x1, y1) => {
    const g = x.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  };
  fade(0, 0, W * 0.16, 0);
  fade(W, 0, W - W * 0.16, 0);
  fade(0, 0, 0, H * 0.20);
  fade(0, H, 0, H - H * 0.06);
  cv.naturalWidth = W; cv.naturalHeight = H;
  SCENE_PLATE[key] = cv;
  return cv;
}
// THE WORK TABLE (§2r stand-in). The owner's build order for the den: "the
// table behind it, even though it's part of the image, you should create an
// object in the same shape, the same size, put it in front of it as an
// extension to it" — the crystal sword is forged HERE. So the object IS the
// painting's own lamplit workbench: cropped to the bench silhouette
// (backboard, top, drawer, legs — not the wall around it), every cut edge
// feathered so it reads as furniture standing in the room and not a pasted
// card. The top-left of that crop is bare wall above the bench's left
// surface; a diagonal corner fade removes it, which no rectangular crop can.
let WORK_TABLE = null;
function workTablePlate() {
  if (WORK_TABLE) return WORK_TABLE;
  if (typeof mediaFetch === 'function') mediaFetch('denInterior');
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.denInterior;
  if (!im || !im.naturalWidth) return null;
  const sx = im.naturalWidth * 0.520, sy = im.naturalHeight * 0.435;
  const sw = im.naturalWidth * 0.450, sh = im.naturalHeight * 0.460;
  const W = 420, H = Math.round(W * sh / sw);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.drawImage(im, sx, sy, sw, sh, 0, 0, W, H);
  x.globalCompositeOperation = 'destination-out';
  const fade = (x0, y0, x1, y1) => {
    const g = x.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  };
  fade(0, 0, W * 0.13, 0);
  fade(W, 0, W - W * 0.10, 0);
  fade(0, 0, 0, H * 0.16);
  fade(0, H, 0, H - H * 0.10);
  fade(0, 0, W * 0.34, H * 0.44);   // the wall triangle over the left surface
  cv.naturalWidth = W; cv.naturalHeight = H;
  WORK_TABLE = cv;
  return cv;
}
// the per-zone mapping the §2f wiring note asks for: which fired doorway
// stands at a depth door in each kingdom. W is absent on purpose — the CITY
// gate is the procedural monument and gate_city.jpg, the one epic gate.
const GATE_PLATE_BY_ZONE = { B: 'gateConduits', C: 'gateFoundry', D: 'gateArchives', E: 'gateNest', X: 'gateDeep' };
// ...and which rock family a cave mouth wears. X borrows E's — the Deep's
// pale-flesh-and-violet material IS its family.
const MOUTH_PLATE_BY_ZONE = { A: 'caveMouthA', B: 'caveMouthB', C: 'caveMouthC', D: 'caveMouthD', E: 'caveMouthE', X: 'caveMouthE' };
// THE PILE, drawn as a STAND-IN. Structures are Higgsfield's (the owner's
// standing order) and the fired plate set is briefed in ART_QUEUE §2w — three
// states, because a pile that only ever fades out is not a pile coming down.
// Until it lands this draws boulders, and it obeys the same rule the terrain
// does: no straight edge anywhere, and the material is the material the room
// is made of, so the heap reads as the mouth's own roof having fallen in.
function rubbleShape(r) {
  if (r._sh) return r._sh;
  let h = r.seed >>> 0;
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0) % 10000) / 10000;
  const list = [];
  // pack a dome over the opening: six courses, heaviest at the base, every
  // stone jittered off its slot and sized independently, because a heap of
  // one stone size is a pattern and a pattern is not rock
  const ROWS = [7, 6, 6, 5, 4, 3], H = 152;   // courses OVERLAP: a heap is a mass, not a stack
  for (let ri = 0; ri < ROWS.length; ri++) {
    const n = ROWS[ri];
    const yy = -6 - (ri + 0.5) * (H / ROWS.length);
    const span = 152 * (1 - ri * 0.115);
    for (let i = 0; i < n; i++) {
      const xx = -span / 2 + (i + 0.5) * (span / n) + (rnd() - 0.5) * 20;
      const rad = 14 + rnd() * rnd() * 24;                 // squared: many chips, few boulders
      // aspect per stone, not per pile: a heap of one proportion reads as a
      // bag of the same pebble, which is what the first pass looked like
      const asp = 0.72 + rnd() * 0.62;
      const pts = [], N = 9 + Math.floor(rnd() * 4);
      for (let a2 = 0; a2 < N; a2++) {
        const th = (a2 / N) * Math.PI * 2 + (rnd() - 0.5) * 0.22;
        // let the radius DIP as well as swell. Purely convex blobs came back
        // looking like balloons; a rock's outline goes in as often as it goes out.
        const rr = rad * (a2 % 3 === 1 ? 0.58 + rnd() * 0.24 : 0.84 + rnd() * 0.34);
        pts.push([Math.cos(th) * rr, Math.sin(th) * rr * asp]);
      }
      // two or three fracture lines per stone, in its own local frame. This is
      // the single thing that separates rock from a soft grey shape.
      const fr = [];
      for (let f = 0; f < 2 + Math.floor(rnd() * 2); f++)
        fr.push([(rnd() - 0.5) * rad * 1.5, (rnd() - 0.5) * rad * asp * 1.4,
                 (rnd() - 0.5) * rad * 1.5, (rnd() - 0.5) * rad * asp * 1.4]);
      list.push({ x: xx, y: yy + (rnd() - 0.5) * 12, r: rad, asp, pts, fr,
                  tone: 0.5 + rnd() * 0.62, rot: (rnd() - 0.5) * 0.8,
                  scrap: rnd() < 0.2, pri: ri + rnd() * 0.8 });
    }
  }
  // she brings the TOP down first, so the top is what disappears first
  list.sort((a2, b2) => b2.pri - a2.pri);
  // ...and removal is metered by MASS, not by count. Counting stones made one
  // blow take three chips off the crown (a 94% silhouette match — a wall that
  // ate a hit) and another take two boulders. Every blow now removes the same
  // share of the heap's area, whatever that happens to be in stones.
  let tot = 0;
  for (const b of list) { b.area = Math.PI * b.r * b.r * b.asp; tot += b.area; }
  let acc = 0;
  for (const b of list) { acc += b.area; b.cum = acc / tot; }
  return (r._sh = list);
}
// one closed ERODED outline through the stone's points. Quadratics anchored at
// the midpoints, control points on the points themselves: the curve never
// touches a vertex, so nothing in the silhouette is a straight run and nothing
// is a corner — the owner's rule, applied to the smallest object that has one.
function rubbleOutline(pts) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let m = mid(pts[n - 1], pts[0]);
  c.beginPath();
  c.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) {
    const nx = mid(pts[i], pts[(i + 1) % n]);
    c.quadraticCurveTo(pts[i][0], pts[i][1], nx[0], nx[1]);
  }
  c.closePath();
}
function drawRubble(r, cx2, gy, P) {
  if (!r || (r.hp <= 0 && r.fall == null)) return;
  const list = rubbleShape(r);
  // FRONT-LOADED on purpose. Linear removal took three small stones off the
  // crown for the first blow — a 94% silhouette match, which is a wall that
  // ate a hit. The curve makes the first blow the one that visibly opens it,
  // and the last blows the ones that clear the shoulders.
  // FRONT-LOADED on purpose: the first blow is the one that visibly opens it,
  // the last ones clear the shoulders.
  const want = Math.pow(1 - r.hp / r.max, 0.78) * 0.9;
  let gone = 0;
  while (gone < list.length && list[gone].cum <= want) gone++;
  const open = 1 - r.hp / r.max;
  const now = performance.now() / 1000;
  const jx = r.shake > 0 ? (Math.random() - 0.5) * r.shake * 9 : 0;
  const jy = r.shake > 0 ? (Math.random() - 0.5) * r.shake * 6 : 0;
  c.save();
  c.translate(cx2 + jx, gy + jy);
  // IT SETTLES. Removing stones alone was not enough to change the silhouette
  // every blow — the ones that went were often behind ones that stayed, and two
  // states measured 89% identical. A heap that loses a course also SLUMPS, and
  // the slump is what the eye reads as "it moved". Compressed toward the floor,
  // because that is the direction gravity works in.
  c.scale(1, 1 - (1 - r.hp / r.max) * 0.2);
  // 1 — THE LIGHT FROM INSIDE, before any rock, so the stones occlude it. It
  // breathes on the lure's own period: what she hears and what leaks out are
  // the same thing arriving through two senses.
  const br = 0.28 + Math.sin(now * 1.15) * 0.08 + open * 0.42;
  c.globalCompositeOperation = 'lighter';
  const lg = c.createRadialGradient(0, -92, 4, 0, -92, 78 + open * 44);
  lg.addColorStop(0, 'rgba(140,196,220,' + (0.26 * br).toFixed(3) + ')');
  lg.addColorStop(0.45, 'rgba(84,142,184,' + (0.12 * br).toFixed(3) + ')');
  lg.addColorStop(1, 'rgba(64,112,164,0)');
  c.fillStyle = lg;
  c.beginPath(); c.ellipse(0, -92, 78 + open * 44, 94 + open * 30, 0, 0, 7); c.fill();
  c.globalCompositeOperation = 'source-over';
  // 2 — the stones. The room is dark, so the material is a dark cool rock with
  // ONE lit crest each: mass comes from the light being on top of every stone
  // and nowhere else, not from an outline, which only ever reads as a cartoon.
  // the collapse: every remaining stone drops out of the frame on its own
  // curve, spinning, fading — 0.6s of the pile getting out of the way
  const fk = r.fall != null ? 1 - Math.max(0, r.fall) / 0.6 : 0;
  for (let i = gone; i < list.length; i++) {
    const b = list[i];
    c.save();
    if (fk > 0) {
      const sp = 0.4 + ((i * 37) % 100) / 100;
      c.globalAlpha = Math.max(0, 1 - fk * 1.25);
      c.translate(b.x + (b.x * 0.5) * fk * sp, b.y + 250 * fk * fk * sp);
      c.rotate(b.rot + fk * sp * 2.2 * (b.x < 0 ? -1 : 1));
    } else {
      c.translate(b.x, b.y);
      c.rotate(b.rot);
    }
    rubbleOutline(b.pts);
    const g2 = c.createLinearGradient(0, -b.r, 0, b.r);
    if (b.scrap) {
      g2.addColorStop(0, 'rgba(' + Math.round(78 * b.tone) + ',' + Math.round(84 * b.tone) + ',' + Math.round(92 * b.tone) + ',1)');
      g2.addColorStop(0.5, 'rgba(40,45,52,1)');
      g2.addColorStop(1, 'rgba(15,18,22,1)');
    } else {
      g2.addColorStop(0, 'rgba(' + Math.round(74 * b.tone) + ',' + Math.round(70 * b.tone) + ',' + Math.round(64 * b.tone) + ',1)');
      g2.addColorStop(0.5, 'rgba(38,36,33,1)');
      g2.addColorStop(1, 'rgba(14,13,12,1)');
    }
    c.fillStyle = g2; c.fill();
    c.save();
    c.clip();
    // the light on top: a soft pool, not a rim. A stroked rim gave every stone
    // the same drawn edge and the pile came back looking like beans on a plate.
    const tp = c.createRadialGradient(-b.r * 0.2, -b.r * b.asp * 0.66, 1,
                                      -b.r * 0.2, -b.r * b.asp * 0.66, b.r * 0.62);
    tp.addColorStop(0, 'rgba(198,192,178,' + (0.12 + b.tone * 0.13).toFixed(3) + ')');
    tp.addColorStop(1, 'rgba(198,192,178,0)');
    c.fillStyle = tp;
    c.fillRect(-b.r * 1.4, -b.r * 1.4, b.r * 2.8, b.r * 2.8);
    // the shadow the stone above casts into it, which is what packs a heap
    const sh2 = c.createLinearGradient(0, -b.r * b.asp, 0, b.r * b.asp * 0.15);
    sh2.addColorStop(0, 'rgba(6,7,9,0.62)');
    sh2.addColorStop(1, 'rgba(6,7,9,0)');
    c.fillStyle = sh2;
    c.fillRect(-b.r * 1.4, -b.r * 1.4, b.r * 2.8, b.r * 1.55);
    // ...and the bottom goes to nearly nothing, so the stone below reads as
    // being IN FRONT rather than merely overlapping
    const sh3 = c.createLinearGradient(0, b.r * b.asp * 0.1, 0, b.r * b.asp);
    sh3.addColorStop(0, 'rgba(5,6,8,0)');
    sh3.addColorStop(1, 'rgba(5,6,8,0.7)');
    c.fillStyle = sh3;
    c.fillRect(-b.r * 1.4, 0, b.r * 2.8, b.r * 1.5);
    // the fractures
    c.lineWidth = 1.2;
    c.strokeStyle = 'rgba(10,10,11,0.5)';
    for (const f of b.fr) { c.beginPath(); c.moveTo(f[0], f[1]); c.lineTo(f[2], f[3]); c.stroke(); }
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(180,176,164,0.13)';
    for (const f of b.fr) { c.beginPath(); c.moveTo(f[0], f[1] - 1.2); c.lineTo(f[2], f[3] - 1.2); c.stroke(); }
    c.restore();
    c.restore();
  }
  // 3 — the seams glow as the pile loosens. Held BELOW the stones' own value so
  // it reads as light escaping between them rather than as the heap turning on.
  if (open > 0.05) {
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = Math.min(0.55, 0.08 + open * 0.5);
    for (let i = gone; i < Math.min(list.length, gone + 6); i++) {
      const b = list[i];
      const sg = c.createRadialGradient(b.x, b.y - b.r * 0.3, 1, b.x, b.y - b.r * 0.3, b.r * 1.35);
      sg.addColorStop(0, 'rgba(158,206,230,0.42)');
      sg.addColorStop(1, 'rgba(110,168,210,0)');
      c.fillStyle = sg;
      c.beginPath(); c.arc(b.x, b.y - b.r * 0.3, b.r * 1.35, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }
  // 4 — chips and grit at the foot: the heap has been shedding since it fell,
  // and a pile that meets the floor on a clean line is a cut-out
  c.fillStyle = 'rgba(30,27,24,0.95)';
  const hg = (n) => { const v = Math.sin(n * 91.3 + r.seed * 0.017) * 24634.6345; return v - Math.floor(v); };
  for (let i = 0; i < 11; i++) {
    const a2 = hg(i * 2.3), a3 = hg(i * 5.9 + 17);
    const dx = (a2 - 0.5) * 210, rr = 3 + a3 * 7;
    c.beginPath(); c.ellipse(dx, -2 - a3 * 5, rr, rr * 0.55, a3, 0, 7); c.fill();
  }
  // 5 — dust still hanging from the last blow
  if (r.dust > 0.02) {
    c.globalAlpha = Math.min(0.22, r.dust * 0.16);
    c.fillStyle = '#b7a992';
    // HASHED, not stepped: (seed + i*977) % 1000 walks a straight ramp, and the
    // plume came out as a stack of pancakes at even spacing
    const hs = (n) => { const v = Math.sin(n * 127.1 + r.seed * 0.013) * 43758.5453; return v - Math.floor(v); };
    for (let i = 0; i < 14; i++) {
      const a2 = hs(i * 3.7), a4 = hs(i * 9.1 + 31);
      const dx = (a2 - 0.5) * 200, dy = -14 - a4 * 150 - (1.5 - r.dust) * 24;
      c.beginPath(); c.ellipse(dx, dy, 8 + a4 * 14, 5 + a2 * 8, a2 * 2, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
  }
  c.restore();
}
function drawCaveMouth(cx2, gy, P, k) {
  // THE FIRED MOUTH (§2f): one material family per grotto network, standing
  // on the floor at the same anchor. The seeded procedural mouth below stays
  // the fallback while the plate is in flight.
  const mplate = MOUTH_PLATE_BY_ZONE[G.roomDef && G.roomDef.zone];
  const mim = mplate && scenePlate(mplate);
  if (mim) {
    const MH2 = 292, MW2 = MH2 * (mim.naturalWidth / mim.naturalHeight);
    c.save();
    c.drawImage(mim, cx2 - MW2 / 2, gy - MH2, MW2, MH2);
    // the dark inside breathes, and deepens as she walks in — the plate is a
    // still, and the swallow is what makes it a passage
    const br = 0.35 + Math.sin(performance.now() / 900) * 0.05 + k * 0.45;
    const th = c.createRadialGradient(cx2, gy - MH2 * 0.34, 8, cx2, gy - MH2 * 0.34, MH2 * 0.52);
    th.addColorStop(0, 'rgba(0,0,0,' + Math.min(0.92, br) + ')');
    th.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = th;
    c.fillRect(cx2 - MW2 / 2, gy - MH2, MW2, MH2);
    c.restore();
    return;
  }
  let h = 2166136261 >>> 0;
  for (const ch of G.roomId) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const rnd2 = () => ((h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0) % 1000) / 1000;
  // EVERY CAVE HAS ITS OWN FACE (owner: "caves have different opening
  // shapes"). The room's seed picks a shape family — a wide low arch, a
  // tall crack, a leaning maw, a round hollow — and every layer inherits
  // its build, so no two networks share a mouth.
  const FAM = (h >>> 0) % 4;   // h is imul-signed; a negative index reads undefined and NaNs the whole mouth
  const wMul = [1.35, 0.62, 1.0, 1.1][FAM];
  const hMul = [0.78, 1.3, 1.05, 0.92][FAM];
  const skew = [0, 0, 0.38, 0][FAM] * ((h >>> 0) & 1 ? 1 : -1);   // the maw leans
  const jit = [0.4, 0.55, 0.42, 0.2][FAM];                 // the hollow is rounder
  const MW = 92 * wMul, MH = 168 * hMul, N = 15;
  // one jagged silhouette maker; every layer gets its OWN irregular edge
  const rim = (w2, h2, baseY) => {
    c.beginPath();
    c.moveTo(cx2 - w2 * 1.15, baseY);
    for (let i = 0; i <= N; i++) {
      const a = Math.PI - (i / N) * Math.PI;
      const yy = Math.sin(a) * h2 * (1 - jit * 0.35 + rnd2() * jit);
      c.lineTo(cx2 + Math.cos(a) * w2 * (1 - jit / 2 + rnd2() * jit) + skew * yy,
               baseY - yy);
    }
    c.lineTo(cx2 + w2 * 1.15, baseY);
    c.closePath();
  };
  c.save();
  // AN OBJECT IN THE ROOM, NOT A SHADOW ON THE WALL (owner: "they are
  // objects in the room that stand out"): a soft ambient halo separates the
  // mound from whatever backdrop stands behind it before any rock draws
  const halo = c.createRadialGradient(cx2, gy - MH * 0.5, MW * 0.4, cx2, gy - MH * 0.5, MW * 2.1);
  halo.addColorStop(0, 'rgba(120,160,190,0.16)');
  halo.addColorStop(1, 'rgba(120,160,190,0)');
  c.fillStyle = halo;
  c.beginPath(); c.ellipse(cx2, gy - MH * 0.5, MW * 2.1, MH * 1.15, 0, 0, 7); c.fill();
  // LAYERED, AND SOLID (owner: "add depth and layers... cave should not be
  // translucent"). The first pass was one 0.75-alpha shape — the city read
  // straight through the rock. Four opaque layers now, each darker and
  // smaller than the last, which is what depth IS: shoulder, rim, throat,
  // and the tunnel rings receding inside it.
  // 1 — the outer shoulder: full rock mass, lit faintly from above
  const sh = c.createLinearGradient(0, gy - MH - 80, 0, gy);
  sh.addColorStop(0, '#1a2129'); sh.addColorStop(0.5, '#12171e'); sh.addColorStop(1, '#0b0f14');
  c.fillStyle = sh;
  rim(MW + 62, MH + 52, gy); c.fill();
  // moss line riding the outer lip
  c.strokeStyle = 'rgba(110,160,90,0.35)'; c.lineWidth = 3;
  rim(MW + 60, MH + 50, gy); c.stroke();
  // ...and the kingdom's own light catching one shoulder — the rim light
  // that makes the mound read as a BODY standing in the room
  c.save(); c.globalCompositeOperation = 'lighter';
  c.strokeStyle = P.glow; c.lineWidth = 2.2; c.globalAlpha = 0.22;
  rim(MW + 56, MH + 46, gy); c.stroke();
  c.restore();
  // 2 — the mid rim: a darker collar inside the shoulder
  const md = c.createLinearGradient(0, gy - MH - 30, 0, gy);
  md.addColorStop(0, '#10151b'); md.addColorStop(1, '#080b0f');
  c.fillStyle = md;
  rim(MW + 26, MH + 14, gy); c.fill();
  // 3 — the throat: near-black, fully opaque
  c.fillStyle = '#030405';
  rim(MW, MH, gy); c.fill();
  // 4 — the tunnel recedes: ever-smaller, ever-lower arcs stepping down
  // into the hill, each a shade off pure black so the eye reads distance
  for (let d2 = 0; d2 < 3; d2++) {
    c.fillStyle = ['#07090c', '#0a0d11', '#0d1116'][d2];
    rim(MW * (0.72 - d2 * 0.17), MH * (0.74 - d2 * 0.16), gy - 2 - d2 * 5);
    c.fill();
    c.fillStyle = '#030405';
    rim(MW * (0.66 - d2 * 0.17), MH * (0.66 - d2 * 0.16), gy - 2 - d2 * 5);
    c.fill();
  }
  // hanging teeth off the throat rim, drooping into the dark
  c.fillStyle = '#0a0d12';
  for (let i = 0; i < 5; i++) {
    const tx = cx2 + (rnd2() - 0.5) * MW * 1.4, tw = 7 + rnd2() * 10, th = 14 + rnd2() * 26;
    const ty = gy - MH * (0.72 + rnd2() * 0.2);
    c.beginPath(); c.moveTo(tx - tw / 2, ty); c.quadraticCurveTo(tx + (rnd2() - 0.5) * 6, ty + th, tx + tw / 2, ty); c.closePath(); c.fill();
  }
  // boulders shed at the feet of the mouth, half-buried
  c.fillStyle = '#131920';
  for (let i = 0; i < 4; i++) {
    const bx = cx2 + (rnd2() - 0.5) * (MW + 90) * 2, br = 8 + rnd2() * 16;
    c.beginPath();
    c.moveTo(bx - br, gy);
    c.quadraticCurveTo(bx - br * 0.5, gy - br * (0.8 + rnd2() * 0.5), bx + (rnd2() - 0.5) * 6, gy - br);
    c.quadraticCurveTo(bx + br * 0.8, gy - br * 0.5, bx + br, gy);
    c.closePath(); c.fill();
  }
  // the light inside — deep in the throat, breathing wider as she nears
  c.globalCompositeOperation = 'lighter';
  const gl = c.createRadialGradient(cx2, gy - MH * 0.32, 4, cx2, gy - MH * 0.32, MW * (0.42 + k * 1.1));
  gl.addColorStop(0, 'rgba(255,232,170,' + (0.14 + k * 0.55) + ')');
  gl.addColorStop(1, 'rgba(255,210,120,0)');
  c.fillStyle = gl;
  c.beginPath(); c.ellipse(cx2, gy - MH * 0.34, MW * (0.45 + k * 1.1), MH * (0.4 + k * 0.5), 0, 0, 7); c.fill();
  if (k > 0.05) {
    const pool = c.createRadialGradient(cx2, gy, 4, cx2, gy, 70 + k * 100);
    pool.addColorStop(0, 'rgba(255,220,150,' + (0.2 * k) + ')');
    pool.addColorStop(1, 'rgba(255,200,110,0)');
    c.fillStyle = pool;
    c.beginPath(); c.ellipse(cx2, gy, 70 + k * 100, 18 + k * 8, 0, 0, 7); c.fill();
  }
  c.restore();
}
// THE TRADER'S BOOTH (owner's design): a kiosk standing on the meadow the
// way the backdrop's own stalls and vent housings stand — leaning posts, a
// sagging canopy, cloth flaps over a warm doorway — per the MIMIC-THE-
// BACKGROUND rule and the NO RIGHT ANGLES law (nothing here is plumb).
// The flaps part as she approaches (k); the light inside is Ratchet's.
function drawBooth(cx2, gy, P, k) {
  // THE FIRED PLATE FIRST (§2g, owner-approved): the authored kiosk stands
  // where the procedural one stood, bottom-anchored on the same spot, with
  // the approach glow swelling over it as k opens. The hand-drawn stall
  // below stays as the loading/missing fallback, per the atlas contract.
  if (typeof mediaFetch === 'function') mediaFetch('boothFront');
  const bim = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.boothFront;
  if (bim && bim.naturalWidth) {
    const dh = 236, dw = dh * (bim.naturalWidth / bim.naturalHeight);
    c.save();
    c.drawImage(bim, cx2 - dw / 2, gy - dh, dw, dh);
    // LIT AT REST, NOT ONLY ON APPROACH. An interactive structure has to be the
    // warmest thing in its sightline or nobody walks to it — unlit until she
    // was already inside its radius, the stall was the darkest prop in its own
    // square. A low ember burns in the doorway at all times now, swells as she
    // nears, and spills a pool onto the ground the way a lantern does. The
    // breath is on the sim clock, not the wall clock, so a paused game does not
    // keep pulsing.
    c.globalCompositeOperation = 'lighter';
    const bbr = 0.9 + Math.sin((G.simClock || 0) * 1.1) * 0.1;
    const gl = c.createRadialGradient(cx2, gy - dh * 0.32, 6, cx2, gy - dh * 0.32, dw * (0.34 + k * 0.4));
    gl.addColorStop(0, 'rgba(255,214,130,' + ((0.17 + 0.15 * k) * bbr).toFixed(3) + ')');
    gl.addColorStop(1, 'rgba(255,190,100,0)');
    c.fillStyle = gl;
    c.beginPath(); c.ellipse(cx2, gy - dh * 0.32, dw * (0.34 + k * 0.4), dh * 0.4, 0, 0, 7); c.fill();
    const pool = c.createRadialGradient(cx2, gy, 2, cx2, gy, dw * 0.42);
    pool.addColorStop(0, 'rgba(255,200,110,' + ((0.14 + 0.09 * k) * bbr).toFixed(3) + ')');
    pool.addColorStop(1, 'rgba(255,190,100,0)');
    c.fillStyle = pool;
    c.beginPath(); c.ellipse(cx2, gy, dw * 0.42, Math.max(4, dh * 0.07), 0, 0, 7); c.fill();
    c.restore();
    return;
  }
  const BW = 74, BH = 118;
  c.save();
  // the back shell, leaning a few degrees the way a well-used stall does
  c.fillStyle = '#101820';
  c.beginPath();
  c.moveTo(cx2 - BW - 8, gy);
  c.lineTo(cx2 - BW + 4, gy - BH + 8);
  c.lineTo(cx2 + BW + 10, gy - BH - 2);
  c.lineTo(cx2 + BW + 2, gy);
  c.closePath(); c.fill();
  // the canopy: a sagging sheet with a scalloped hem, thrown over the top
  c.fillStyle = '#1c2836';
  c.beginPath();
  c.moveTo(cx2 - BW - 26, gy - BH + 14);
  c.quadraticCurveTo(cx2, gy - BH - 26, cx2 + BW + 28, gy - BH + 10);
  c.lineTo(cx2 + BW + 20, gy - BH + 30);
  for (let i = 5; i >= 0; i--) {
    const hx = cx2 - BW - 14 + (i + 0.5) * ((BW * 2 + 34) / 6);
    c.quadraticCurveTo(hx + 9, gy - BH + 44, hx - 9, gy - BH + 30);
  }
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,214,120,0.25)'; c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(cx2 - BW - 26, gy - BH + 14);
  c.quadraticCurveTo(cx2, gy - BH - 26, cx2 + BW + 28, gy - BH + 10);
  c.stroke();
  // leaning support posts, tapered — poles, not columns
  c.fillStyle = '#0b1119';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(cx2 + s * (BW + 14), gy);
    c.lineTo(cx2 + s * (BW + 4), gy - BH + 16);
    c.lineTo(cx2 + s * (BW - 2), gy - BH + 18);
    c.lineTo(cx2 + s * (BW + 6), gy);
    c.closePath(); c.fill();
  }
  // the doorway: warm light, with two cloth flaps that part as she nears
  const doorW = 44, doorH = BH - 34;
  c.save(); c.globalCompositeOperation = 'lighter';
  const gl = c.createLinearGradient(0, gy - doorH, 0, gy);
  gl.addColorStop(0, 'rgba(255,214,130,' + (0.10 + k * 0.5) + ')');
  gl.addColorStop(1, 'rgba(255,190,100,' + (0.16 + k * 0.55) + ')');
  c.fillStyle = gl;
  c.beginPath();
  c.moveTo(cx2 - doorW / 2, gy);
  c.quadraticCurveTo(cx2 - doorW / 2 - 6, gy - doorH * 0.7, cx2 - 8, gy - doorH);
  c.quadraticCurveTo(cx2 + 14, gy - doorH - 6, cx2 + doorW / 2 + 4, gy - doorH * 0.6);
  c.lineTo(cx2 + doorW / 2, gy);
  c.closePath(); c.fill();
  c.restore();
  const part = k * 24;
  c.fillStyle = '#141e2a';
  for (const s of [-1, 1]) {
    const ex = cx2 + s * (6 + part);
    c.beginPath();
    c.moveTo(ex, gy - doorH + 6 * s);
    c.quadraticCurveTo(ex + s * 16, gy - doorH * 0.5, ex + s * 8, gy);
    c.lineTo(ex + s * 30, gy);
    c.lineTo(ex + s * 26, gy - doorH + 2);
    c.closePath(); c.fill();
  }
  // his sign: a small hung board with the bolt, swinging slightly
  const sw = Math.sin(performance.now() / 900) * 0.06;
  c.save();
  c.translate(cx2 - BW + 18, gy - BH + 34); c.rotate(sw - 0.08);
  c.fillStyle = '#0d141d'; c.fillRect(-13, 0, 26, 20);
  c.fillStyle = '#ffd76a'; c.globalAlpha = 0.85;
  ftxt('⚡', 0, 15, 13, '#ffd76a');
  c.restore();
  c.restore();
}
// THE ORACLE'S SHRINE (kingdom 2): the depth door into mono's parlor off B3.
// Built from the Conduits backdrop's own furniture per the mimic rule — a
// sagging canopy of dead cable bundles thrown over two leaning conduit posts,
// loose fibre strands hanging like roots, and a doorway glowing the CRT blue
// of the Oracle herself instead of Ratchet's lamp amber. Nothing plumb,
// nothing square (NO RIGHT ANGLES). Procedural STAND-IN awaiting its fired
// plate (ART_QUEUE §2h, oracleBooth): the mediaFetch hook below goes live the
// commit the plate and its media.js entry land, exactly like drawBooth's.
function drawOracleBooth(cx2, gy, P, k) {
  if (typeof mediaFetch === 'function') mediaFetch('oracleBooth');
  const bim = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.oracleBooth;
  if (bim && bim.naturalWidth) {
    const dh = 236, dw = dh * (bim.naturalWidth / bim.naturalHeight);
    c.save();
    c.drawImage(bim, cx2 - dw / 2, gy - dh, dw, dh);
    if (k > 0.02) {
      c.globalCompositeOperation = 'lighter';
      const gl = c.createRadialGradient(cx2, gy - dh * 0.32, 6, cx2, gy - dh * 0.32, dw * (0.3 + k * 0.4));
      gl.addColorStop(0, 'rgba(87,168,255,' + (0.18 * k + 0.08) + ')');
      gl.addColorStop(1, 'rgba(77,184,255,0)');
      c.fillStyle = gl;
      c.beginPath(); c.ellipse(cx2, gy - dh * 0.32, dw * (0.3 + k * 0.4), dh * 0.4, 0, 0, 7); c.fill();
    }
    c.restore();
    return;
  }
  const BW = 70, BH = 122;
  c.save();
  // the back shroud, leaning the other way from Ratchet's stall — two shrines
  // must never share a silhouette
  c.fillStyle = '#0a1226';
  c.beginPath();
  c.moveTo(cx2 - BW - 4, gy);
  c.lineTo(cx2 - BW - 12, gy - BH + 2);
  c.lineTo(cx2 + BW - 2, gy - BH + 12);
  c.lineTo(cx2 + BW + 8, gy);
  c.closePath(); c.fill();
  // the canopy: a heavy swag of dead cable bundles thrown over the posts,
  // sagging in catenaries — the Conduits' own ceiling furniture
  c.strokeStyle = '#101c3e'; c.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    c.lineWidth = 9 - i * 1.6;
    c.beginPath();
    c.moveTo(cx2 - BW - 24 + i * 5, gy - BH + 10 + i * 4);
    c.quadraticCurveTo(cx2 + 4 - i * 3, gy - BH + 40 + i * 7, cx2 + BW + 22 - i * 4, gy - BH + 4 + i * 5);
    c.stroke();
  }
  // loose fibre strands hanging off the swag, tips faintly lit
  for (let i = 0; i < 6; i++) {
    const fx = cx2 - BW + 12 + i * (BW / 3.1), sway = Math.sin(performance.now() / 1100 + i * 1.9) * 3;
    const fy = gy - BH + 34 + (i % 3) * 8, fl = 16 + (i * 7) % 22;
    c.strokeStyle = '#16244a'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo(fx + sway, fy + fl * 0.6, fx + sway * 1.6, fy + fl); c.stroke();
    c.fillStyle = 'rgba(87,168,255,0.55)';
    c.beginPath(); c.arc(fx + sway * 1.6, fy + fl, 1.3, 0, 7); c.fill();
  }
  // leaning conduit posts — pipe bundles, not columns, junction box hips
  c.fillStyle = '#0b142e';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(cx2 + s * (BW + 12), gy);
    c.lineTo(cx2 + s * (BW - 2), gy - BH + 12);
    c.lineTo(cx2 + s * (BW - 9), gy - BH + 15);
    c.lineTo(cx2 + s * (BW + 3), gy);
    c.closePath(); c.fill();
    c.fillStyle = '#122048';
    c.fillRect(cx2 + s * (BW - 2) - 7, gy - BH * 0.52, 14, 18);
    c.fillStyle = '#0b142e';
  }
  // the doorway: parted cable curtains and the Oracle's CRT light inside
  const doorW = 46, doorH = BH - 30;
  c.save(); c.globalCompositeOperation = 'lighter';
  const gl = c.createLinearGradient(0, gy - doorH, 0, gy);
  gl.addColorStop(0, 'rgba(87,168,255,' + (0.10 + k * 0.45) + ')');
  gl.addColorStop(1, 'rgba(77,184,255,' + (0.14 + k * 0.5) + ')');
  c.fillStyle = gl;
  c.beginPath();
  c.moveTo(cx2 - doorW / 2, gy);
  c.quadraticCurveTo(cx2 - doorW / 2 - 8, gy - doorH * 0.62, cx2 - 6, gy - doorH);
  c.quadraticCurveTo(cx2 + 16, gy - doorH - 8, cx2 + doorW / 2 + 2, gy - doorH * 0.66);
  c.lineTo(cx2 + doorW / 2, gy);
  c.closePath(); c.fill();
  // a scanline flicker deep inside — the CRT breathing in the dark
  c.globalAlpha = 0.10 + k * 0.25 + Math.sin(performance.now() / 130) * 0.04;
  c.fillStyle = '#57a8ff';
  for (let y2 = gy - doorH * 0.8; y2 < gy - 8; y2 += 7) c.fillRect(cx2 - 12, y2, 24, 1.4);
  c.restore();
  // the cable curtains part as she nears — the same k the booth flaps use
  const part = k * 26;
  for (const s of [-1, 1]) {
    const ex = cx2 + s * (5 + part);
    c.strokeStyle = '#0e1a3a'; c.lineWidth = 4; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(ex + s * i * 7, gy - doorH + 4);
      c.quadraticCurveTo(ex + s * (i * 7 + 10), gy - doorH * 0.5, ex + s * (i * 7 + 4), gy);
      c.stroke();
    }
  }
  // her sign: a dim cracked monitor hung crooked, one sine wave still on it
  const sw = Math.sin(performance.now() / 1000) * 0.05;
  c.save();
  c.translate(cx2 + BW - 16, gy - BH + 40); c.rotate(sw + 0.1);
  c.fillStyle = '#060b1c'; c.fillRect(-14, 0, 28, 20);
  c.strokeStyle = 'rgba(87,168,255,0.8)'; c.lineWidth = 1.4;
  c.beginPath();
  for (let i = 0; i <= 12; i++) c[i ? 'lineTo' : 'moveTo'](-10 + i * 1.7, 10 - Math.sin(i / 12 * 6.28 + performance.now() / 400) * 4);
  c.stroke();
  c.restore();
  c.restore();
}
// THE TINKER'S QUENCH HOOD (kingdom 3): the depth door into Patch-7's forge
// off C5. Built from the Foundry backdrop's own furniture per the mimic rule —
// a scorched extraction hood sagging between two leaning chain-wrapped
// stanchions, slag crusted and heaped around the base, a tipped ladle resting
// against one post, hanging chains, and a doorway breathing the molten orange
// the pours already paint the hall with (NOT Ratchet's lamp amber, not the
// Oracle's CRT blue — the Foundry's own light). Nothing plumb, nothing square
// (NO RIGHT ANGLES). Procedural STAND-IN awaiting its fired plate (ART_QUEUE
// §2k, forgeFront): the mediaFetch hook below goes live the commit the plate
// and its media.js entry land, exactly like drawBooth's and drawOracleBooth's.
function drawTinkerForge(cx2, gy, P, k) {
  if (typeof mediaFetch === 'function') mediaFetch('forgeFront');
  const bim = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.forgeFront;
  if (bim && bim.naturalWidth) {
    const dh = 236, dw = dh * (bim.naturalWidth / bim.naturalHeight);
    c.save();
    c.drawImage(bim, cx2 - dw / 2, gy - dh, dw, dh);
    if (k > 0.02) {
      c.globalCompositeOperation = 'lighter';
      const gl = c.createRadialGradient(cx2, gy - dh * 0.3, 6, cx2, gy - dh * 0.3, dw * (0.3 + k * 0.4));
      gl.addColorStop(0, 'rgba(255,148,48,' + (0.18 * k + 0.08) + ')');
      gl.addColorStop(1, 'rgba(255,171,74,0)');
      c.fillStyle = gl;
      c.beginPath(); c.ellipse(cx2, gy - dh * 0.3, dw * (0.3 + k * 0.4), dh * 0.4, 0, 0, 7); c.fill();
    }
    c.restore();
    return;
  }
  const BW = 66, BH = 126;
  c.save();
  // the back shroud — soot-dark, leaning right where the Oracle's leans left:
  // three shrines, three silhouettes
  c.fillStyle = '#170a05';
  c.beginPath();
  c.moveTo(cx2 - BW - 8, gy);
  c.lineTo(cx2 - BW + 2, gy - BH + 14);
  c.lineTo(cx2 + BW + 6, gy - BH + 2);
  c.lineTo(cx2 + BW + 14, gy);
  c.closePath(); c.fill();
  // the slag crust heaped around the base: cooled blobby mounds, never steps
  c.fillStyle = '#2a1206';
  for (const [mx, mw, mh] of [[-BW - 2, 30, 16], [-BW + 26, 22, 10], [BW - 10, 34, 18], [BW + 12, 18, 9]]) {
    c.beginPath();
    c.moveTo(cx2 + mx - mw / 2, gy);
    c.quadraticCurveTo(cx2 + mx - mw * 0.2, gy - mh, cx2 + mx + mw * 0.24, gy - mh * 0.8);
    c.quadraticCurveTo(cx2 + mx + mw / 2, gy - mh * 0.3, cx2 + mx + mw / 2 + 3, gy);
    c.closePath(); c.fill();
    // an ember seam still alive in the crust
    c.strokeStyle = 'rgba(255,148,48,0.28)'; c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(cx2 + mx - mw * 0.3, gy - mh * 0.5);
    c.quadraticCurveTo(cx2 + mx, gy - mh * 0.7, cx2 + mx + mw * 0.28, gy - mh * 0.45);
    c.stroke();
    c.fillStyle = '#2a1206';
  }
  // two leaning stanchions, chain-wrapped — pipe legs with collar hips
  c.fillStyle = '#241008';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(cx2 + s * (BW + 8), gy);
    c.lineTo(cx2 + s * (BW - 6), gy - BH + 16);
    c.lineTo(cx2 + s * (BW - 13), gy - BH + 20);
    c.lineTo(cx2 + s * (BW - 1), gy);
    c.closePath(); c.fill();
    // the chain wrap: three sagging loops around each post
    c.strokeStyle = '#3a2410'; c.lineWidth = 2.4; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const wy = gy - 24 - i * 26;
      c.beginPath();
      c.moveTo(cx2 + s * (BW + 6 - i * 2), wy);
      c.quadraticCurveTo(cx2 + s * (BW - 2 - i * 2), wy + 7, cx2 + s * (BW - 9 - i * 2), wy + 1);
      c.stroke();
    }
    c.fillStyle = '#241008';
  }
  // THE HOOD: a scorched extraction bell sagging between the posts — the
  // same curved sheet the backdrop hangs over its own pour ladles
  c.fillStyle = '#1d0e06';
  c.beginPath();
  c.moveTo(cx2 - BW - 16, gy - BH + 22);
  c.quadraticCurveTo(cx2 - BW * 0.3, gy - BH - 12, cx2 + BW * 0.34, gy - BH - 4);
  c.quadraticCurveTo(cx2 + BW + 4, gy - BH + 4, cx2 + BW + 18, gy - BH + 30);
  c.quadraticCurveTo(cx2 + BW * 0.3, gy - BH + 40, cx2 - BW * 0.42, gy - BH + 44);
  c.quadraticCurveTo(cx2 - BW - 6, gy - BH + 38, cx2 - BW - 16, gy - BH + 22);
  c.closePath(); c.fill();
  // heat stain blooming up the hood's throat
  c.save(); c.globalCompositeOperation = 'lighter';
  const hs = c.createRadialGradient(cx2, gy - BH + 34, 4, cx2, gy - BH + 34, BW * 0.9);
  hs.addColorStop(0, 'rgba(255,148,48,' + (0.14 + k * 0.2) + ')');
  hs.addColorStop(1, 'rgba(255,148,48,0)');
  c.fillStyle = hs;
  c.beginPath(); c.ellipse(cx2, gy - BH + 34, BW * 0.9, 26, 0, 0, 7); c.fill();
  c.restore();
  // hanging chains off the hood lip, hooks swaying in the updraft
  for (let i = 0; i < 5; i++) {
    const hx = cx2 - BW + 14 + i * (BW / 2.4), sway = Math.sin(performance.now() / 900 + i * 2.3) * 3;
    const hy = gy - BH + 42, hl = 14 + (i * 9) % 24;
    c.strokeStyle = '#33200e'; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx + sway, hy + hl * 0.6, hx + sway * 1.5, hy + hl); c.stroke();
    c.strokeStyle = '#4a3012'; c.lineWidth = 1.4;
    c.beginPath(); c.arc(hx + sway * 1.5, hy + hl + 3, 3, -0.6, 2.6); c.stroke();
  }
  // the tipped ladle resting against the left post — the backdrop's own tool
  c.save();
  c.translate(cx2 - BW - 6, gy - 12); c.rotate(-0.42);
  c.fillStyle = '#211008';
  c.beginPath(); c.ellipse(0, 0, 15, 9, 0, 0, Math.PI); c.fill();
  c.fillStyle = 'rgba(255,148,48,0.5)';
  c.beginPath(); c.ellipse(0, -1.5, 9, 3, 0, 0, Math.PI); c.fill();
  c.strokeStyle = '#2c1809'; c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(13, -4); c.quadraticCurveTo(30, -18, 38, -30); c.stroke();
  c.restore();
  // the doorway: the hearth breathing inside, molten light rising
  const doorW = 44, doorH = BH - 34;
  c.save(); c.globalCompositeOperation = 'lighter';
  const breathe = Math.sin(performance.now() / 700) * 0.05;
  const gl = c.createLinearGradient(0, gy - doorH, 0, gy);
  gl.addColorStop(0, 'rgba(255,148,48,' + (0.08 + k * 0.4 + breathe) + ')');
  gl.addColorStop(1, 'rgba(255,208,138,' + (0.16 + k * 0.5 + breathe) + ')');
  c.fillStyle = gl;
  c.beginPath();
  c.moveTo(cx2 - doorW / 2, gy);
  c.quadraticCurveTo(cx2 - doorW / 2 - 9, gy - doorH * 0.58, cx2 - 8, gy - doorH);
  c.quadraticCurveTo(cx2 + 12, gy - doorH - 7, cx2 + doorW / 2 + 4, gy - doorH * 0.62);
  c.lineTo(cx2 + doorW / 2, gy);
  c.closePath(); c.fill();
  // embers drifting up out of the doorway — more the nearer she stands
  const en = 2 + Math.round(k * 4);
  for (let i = 0; i < en; i++) {
    const ph = (performance.now() / 1400 + i * 0.37) % 1;
    const ex = cx2 + Math.sin(i * 5.1 + performance.now() / 800) * (doorW * 0.3);
    c.globalAlpha = (1 - ph) * (0.3 + k * 0.4);
    c.fillStyle = i % 2 ? '#ffd08a' : '#ff9430';
    c.beginPath(); c.arc(ex, gy - 6 - ph * (doorH - 8), 1.2 + (i % 3) * 0.5, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
  c.restore();
  // the chain curtain over the doorway parts as she nears — the booth-flap k
  const part = k * 24;
  for (const s of [-1, 1]) {
    const ex = cx2 + s * (4 + part);
    c.strokeStyle = '#26150a'; c.lineWidth = 3.4; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(ex + s * i * 6, gy - doorH + 3);
      c.quadraticCurveTo(ex + s * (i * 6 + 9), gy - doorH * 0.48, ex + s * (i * 6 + 3), gy);
      c.stroke();
    }
  }
  // his sign: a small gear hung crooked from the hood lip, swinging — the
  // Tinker's trade where the Oracle hangs a monitor and Ratchet hangs a lamp
  const sw = Math.sin(performance.now() / 1100) * 0.09;
  c.save();
  c.translate(cx2 + BW - 12, gy - BH + 46); c.rotate(sw - 0.12);
  c.strokeStyle = '#33200e'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(0, -8); c.lineTo(0, 0); c.stroke();
  c.fillStyle = '#42280f';
  c.beginPath(); c.arc(0, 8, 8, 0, 7); c.fill();
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * 6.283 + sw;
    c.fillRect(Math.cos(a) * 8 - 1.4, 8 + Math.sin(a) * 8 - 1.4, 2.8, 2.8);
  }
  c.fillStyle = 'rgba(255,148,48,0.4)';
  c.beginPath(); c.arc(0, 8, 3, 0, 7); c.fill();
  c.restore();
  c.restore();
}
// THE SAGE'S CARREL (kingdom 4): the depth door into the Nine-Lives Sage's
// reading den off D1. Built from the Archives backdrop's own furniture per
// the mimic rule — two shelf-stacks of frozen ledger slabs leaning together
// into an accidental crevice, a frost sheet flowing over the taller pile,
// icicles off the lintel spines, a drift of spilled index cards frozen
// mid-slide at the base, and a doorway breathing the sage's own pale-ice
// glyph light (NOT Ratchet's lamp amber, not the Oracle's CRT blue, not the
// Tinker's molten orange — the Archivist's reading light). Nothing plumb,
// nothing square (NO RIGHT ANGLES). Procedural STAND-IN awaiting its fired
// plate (ART_QUEUE §2m, carrelFront): the mediaFetch hook below goes live the
// commit the plate and its media.js entry land, exactly like its three
// siblings'.
function drawSageCarrel(cx2, gy, P, k) {
  if (typeof mediaFetch === 'function') mediaFetch('carrelFront');
  const bim = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.carrelFront;
  if (bim && bim.naturalWidth) {
    const dh = 236, dw = dh * (bim.naturalWidth / bim.naturalHeight);
    c.save();
    c.drawImage(bim, cx2 - dw / 2, gy - dh, dw, dh);
    if (k > 0.02) {
      c.globalCompositeOperation = 'lighter';
      const gl = c.createRadialGradient(cx2, gy - dh * 0.3, 6, cx2, gy - dh * 0.3, dw * (0.3 + k * 0.4));
      gl.addColorStop(0, 'rgba(159,232,255,' + (0.18 * k + 0.08) + ')');
      gl.addColorStop(1, 'rgba(159,232,255,0)');
      c.fillStyle = gl;
      c.beginPath(); c.ellipse(cx2, gy - dh * 0.3, dw * (0.3 + k * 0.4), dh * 0.4, 0, 0, 7); c.fill();
    }
    c.restore();
    return;
  }
  const BW = 62, BH = 130;
  c.save();
  // the back shroud — deep archive blue, tallest in the MIDDLE where the two
  // stacks meet: the fourth shrine keeps a fourth silhouette (kiosk canopy,
  // cable swag, quench hood... and now a leaning-together crevice)
  c.fillStyle = '#0c1620';
  c.beginPath();
  c.moveTo(cx2 - BW - 10, gy);
  c.lineTo(cx2 - BW * 0.42, gy - BH - 8);
  c.lineTo(cx2 + BW * 0.36, gy - BH - 2);
  c.lineTo(cx2 + BW + 8, gy);
  c.closePath(); c.fill();
  // the two shelf-stacks: piles of frozen ledger slabs, every course a
  // slightly different length and lean — book spines, never masonry
  for (const s of [-1, 1]) {
    let sy = gy, i = 0;
    const lean = s * -0.06;                    // both piles fall toward the door
    while (sy > gy - BH + (s < 0 ? 10 : 26)) {
      const th = 7 + ((i * 5 + (s < 0 ? 2 : 4)) % 5);
      const wd = 34 - i * 1.3 + ((i * 7) % 9);
      const ox = cx2 + s * (BW - 8 - i * 2.4) + Math.sin(i * 2.7 + s) * 3;
      c.save();
      c.translate(ox, sy - th / 2); c.rotate(lean + Math.sin(i * 1.9) * 0.05);
      c.fillStyle = i % 3 === 1 ? '#152535' : i % 3 === 2 ? '#101c2c' : '#1b3040';
      c.beginPath();
      c.moveTo(-wd / 2, th / 2);
      c.quadraticCurveTo(-wd / 2 - 2, 0, -wd / 2 + 1, -th / 2);
      c.lineTo(wd / 2 - 1, -th / 2 + 1.5);
      c.quadraticCurveTo(wd / 2 + 2, 0, wd / 2 - 2, th / 2);
      c.closePath(); c.fill();
      // a spine label catching the door light
      c.fillStyle = 'rgba(159,232,255,' + (0.05 + ((i * 13) % 7) * 0.012) + ')';
      c.fillRect(-wd * 0.24, -th * 0.22, wd * 0.2, th * 0.34);
      c.restore();
      sy -= th - 1.5; i++;
    }
  }
  // the frost sheet flowing over the left (taller) stack, and icicles off the
  // lintel where the two piles lean together
  c.fillStyle = 'rgba(191,234,255,0.18)';
  c.beginPath();
  c.moveTo(cx2 - BW - 4, gy - BH * 0.35);
  c.quadraticCurveTo(cx2 - BW * 0.7, gy - BH * 0.9, cx2 - BW * 0.24, gy - BH - 4);
  c.quadraticCurveTo(cx2 - BW * 0.5, gy - BH * 0.72, cx2 - BW + 4, gy - BH * 0.3);
  c.closePath(); c.fill();
  for (let i = 0; i < 6; i++) {
    const ix = cx2 - 26 + i * 10 + Math.sin(i * 3.1) * 3;
    const il = 7 + ((i * 11) % 13), iy = gy - BH + 12 + Math.sin(i * 1.4) * 5;
    c.fillStyle = 'rgba(191,234,255,' + (0.3 - i * 0.02) + ')';
    c.beginPath();
    c.moveTo(ix - 2.4, iy); c.quadraticCurveTo(ix, iy + il * 0.7, ix + 0.3, iy + il);
    c.quadraticCurveTo(ix + 1.4, iy + il * 0.5, ix + 2.4, iy); c.closePath(); c.fill();
  }
  // the doorway: the crevice between the piles, breathing pale reading light
  const doorW = 42, doorH = BH - 36;
  c.save(); c.globalCompositeOperation = 'lighter';
  const breathe = Math.sin(performance.now() / 1600) * 0.04;
  const gl = c.createLinearGradient(0, gy - doorH, 0, gy);
  gl.addColorStop(0, 'rgba(159,232,255,' + (0.09 + k * 0.42 + breathe) + ')');
  gl.addColorStop(1, 'rgba(230,251,255,' + (0.13 + k * 0.5 + breathe) + ')');
  c.fillStyle = gl;
  c.beginPath();
  c.moveTo(cx2 - doorW / 2, gy);
  c.quadraticCurveTo(cx2 - doorW / 2 - 7, gy - doorH * 0.55, cx2 - 9, gy - doorH);
  c.quadraticCurveTo(cx2 + 8, gy - doorH - 9, cx2 + doorW / 2 + 3, gy - doorH * 0.6);
  c.lineTo(cx2 + doorW / 2, gy);
  c.closePath(); c.fill();
  // glyph motes drifting UP the light — the sage's own threads, read from
  // its idle draw — more the nearer she stands
  const gn = 2 + Math.round(k * 3);
  c.font = '9px monospace'; c.textAlign = 'center';
  for (let i = 0; i < gn; i++) {
    const ph = (performance.now() / 2600 + i * 0.41) % 1;
    const gx2 = cx2 + Math.sin(i * 4.7 + performance.now() / 1500) * (doorW * 0.26);
    c.globalAlpha = Math.sin(ph * Math.PI) * (0.25 + k * 0.4);
    c.fillStyle = '#9fe8ff';
    c.fillText(['◇', '△', '□', '∴', '≡'][i % 5], gx2, gy - 8 - ph * (doorH - 14));
  }
  c.globalAlpha = 1;
  c.restore();
  // the card drift at the base: spilled index cards frozen mid-slide, parting
  // as she nears — the booth-flap k, worn by paper instead of cloth
  const part = k * 20;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const px2 = cx2 + s * (6 + part + i * 7), py2 = gy - 2 - (i % 2) * 3;
      c.save();
      c.translate(px2, py2); c.rotate(s * (0.2 + i * 0.16) + Math.sin(i * 5.1) * 0.1);
      c.fillStyle = i % 2 ? '#22384c' : '#2c4a62';
      c.fillRect(-5, -3.4, 10, 6.8);
      c.strokeStyle = 'rgba(159,232,255,0.25)'; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(-3.4, -1.2); c.lineTo(3.4, -1.2); c.stroke();
      c.restore();
    }
  }
  // its sign: a hooded reading lamp hung crooked off a lintel spine, swaying —
  // the sage's trade where the others hang a lamp, a monitor and a gear
  const sw = Math.sin(performance.now() / 1300) * 0.07;
  c.save();
  c.translate(cx2 + BW - 22, gy - BH + 30); c.rotate(sw + 0.14);
  c.strokeStyle = '#1b3040'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(0, -9); c.quadraticCurveTo(3, -4, 0, 0); c.stroke();
  c.fillStyle = '#152535';
  c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(0, -6, 6, 0);
  c.quadraticCurveTo(0, 2.5, -6, 0); c.closePath(); c.fill();
  const lp = 0.5 + Math.sin(performance.now() / 900) * 0.2;
  c.fillStyle = 'rgba(159,232,255,' + lp + ')';
  c.shadowColor = '#9fe8ff'; c.shadowBlur = 7;
  c.beginPath(); c.ellipse(0, 1.6, 3.4, 1.8, 0, 0, 7); c.fill(); c.shadowBlur = 0;
  c.restore();
  c.restore();
}
// THE NYMPH'S HOLLOW (kingdom 5): the depth door into Lumen's den off E1.
// Built from the Nest backdrop's own furniture per the mimic rule — the
// backdrop grows tissue-of-cable columns and pulsing infection veins, so the
// door is a burst COCOON-POD woven of dead cable-strands, slung low between
// two of those columns leaning together. The fifth shrine keeps a fifth
// silhouette (kiosk canopy, cable swag, quench hood, leaning stacks... and
// now a hanging teardrop pod), and its own light: the split breathes Lumen's
// LEAF-GREEN (#7dff9a, zone E's acc2 — NOT Ratchet's lamp amber, not the
// Oracle's CRT blue, not the Tinker's molten orange, not the Archivist's
// pale ice). Around the mouth the infection veins run GREY — her glow keeps
// this one pocket of the Nest clean, which is the story the structure tells
// before she says a word. Nothing plumb, nothing square (NO RIGHT ANGLES).
// Procedural STAND-IN awaiting its fired plate (ART_QUEUE §2o, hollowFront):
// the mediaFetch hook below goes live the commit the plate and its media.js
// entry land, exactly like its four siblings'.
function drawLumenHollow(cx2, gy, P, k) {
  if (typeof mediaFetch === 'function') mediaFetch('hollowFront');
  const bim = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.hollowFront;
  if (bim && bim.naturalWidth) {
    const dh = 236, dw = dh * (bim.naturalWidth / bim.naturalHeight);
    c.save();
    c.drawImage(bim, cx2 - dw / 2, gy - dh, dw, dh);
    if (k > 0.02) {
      c.globalCompositeOperation = 'lighter';
      const gl = c.createRadialGradient(cx2, gy - dh * 0.35, 6, cx2, gy - dh * 0.35, dw * (0.3 + k * 0.4));
      gl.addColorStop(0, 'rgba(125,255,154,' + (0.16 * k + 0.07) + ')');
      gl.addColorStop(1, 'rgba(125,255,154,0)');
      c.fillStyle = gl;
      c.beginPath(); c.ellipse(cx2, gy - dh * 0.35, dw * (0.3 + k * 0.4), dh * 0.42, 0, 0, 7); c.fill();
    }
    c.restore();
    return;
  }
  const BW = 58, BH = 132;
  const t = performance.now();
  c.save();
  // the back shroud — deep nest violet, tallest where the two columns meet
  c.fillStyle = '#160a20';
  c.beginPath();
  c.moveTo(cx2 - BW - 12, gy);
  c.quadraticCurveTo(cx2 - BW * 0.6, gy - BH * 0.9, cx2 - BW * 0.2, gy - BH - 6);
  c.quadraticCurveTo(cx2 + BW * 0.3, gy - BH - 12, cx2 + BW * 0.5, gy - BH * 0.8);
  c.quadraticCurveTo(cx2 + BW + 4, gy - BH * 0.3, cx2 + BW + 10, gy);
  c.closePath(); c.fill();
  // the two tissue columns, leaning together — the backdrop's own cable
  // tissue, breathing very slowly, each strand a slightly different sag
  for (const s of [-1, 1]) {
    const lean = Math.sin(t / 2400 + s) * 2;
    for (let i = 0; i < 3; i++) {
      const bx = cx2 + s * (BW - 6 - i * 9);
      c.fillStyle = i % 2 ? '#2a1240' : '#331a4a';
      c.beginPath();
      c.moveTo(bx - 5, gy);
      c.quadraticCurveTo(bx - 8 + lean + s * -10, gy - BH * 0.55, bx + s * -16 + lean, gy - BH - 4);
      c.lineTo(bx + s * -10 + lean, gy - BH - 2);
      c.quadraticCurveTo(bx + 3 + lean + s * -8, gy - BH * 0.5, bx + 6, gy);
      c.closePath(); c.fill();
    }
  }
  // the infection veins on the columns: alive and colored at the edges of
  // the structure, fading to DEAD GREY as they near the mouth — her light
  // is why
  for (const s of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const vx = cx2 + s * (BW - 4 - i * 13);
      const pulse = (Math.sin(t / 500 + i * 1.3 + s) + 1) / 2;
      const near = 1 - i * 0.5;                      // inner veins are nearer her
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = (0.1 + pulse * 0.24) * (1 - near * 0.55);
      c.strokeStyle = i % 2 ? '#ff4f6d' : '#e05aff';
      c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(vx, gy - BH * 0.95);
      for (let y = gy - BH * 0.8; y < gy; y += 26)
        c.lineTo(vx + Math.sin(y / 22 + i + s) * 5 - s * (gy - y) * 0.04, y);
      c.stroke(); c.restore();
      // the grey remainder near the mouth: the same vein, quieted
      c.globalAlpha = 0.3;
      c.strokeStyle = '#4a4152'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(vx - s * 8, gy - BH * 0.5);
      c.quadraticCurveTo(vx - s * 14, gy - BH * 0.25, vx - s * 12, gy);
      c.stroke(); c.globalAlpha = 1;
    }
  }
  // THE POD: a burst cocoon slung between the columns — a woven teardrop,
  // wider low, its whole outline built of strand curves. It sways a hair.
  const sway = Math.sin(t / 1900) * 1.6;
  c.save(); c.translate(sway, 0);
  c.fillStyle = '#241332';
  c.beginPath();
  c.moveTo(cx2 - 8, gy - BH + 2);                        // the hanging point
  c.quadraticCurveTo(cx2 - BW * 0.78, gy - BH * 0.62, cx2 - BW * 0.6, gy - BH * 0.24);
  c.quadraticCurveTo(cx2 - BW * 0.5, gy - 2, cx2 - BW * 0.16, gy);
  c.lineTo(cx2 + BW * 0.2, gy);
  c.quadraticCurveTo(cx2 + BW * 0.56, gy - 4, cx2 + BW * 0.6, gy - BH * 0.3);
  c.quadraticCurveTo(cx2 + BW * 0.66, gy - BH * 0.66, cx2 + 2, gy - BH + 2);
  c.closePath(); c.fill();
  // the weave: strand courses following the pod's belly, each sagging its
  // own amount — basketry, never lathe-work
  c.strokeStyle = '#3a2050'; c.lineWidth = 2; c.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const wy = gy - BH * 0.82 + i * (BH * 0.13);
    const ww = BW * (0.36 + i * 0.05) * (i === 5 ? 0.9 : 1);
    c.beginPath();
    c.moveTo(cx2 - ww, wy + Math.sin(i * 2.1) * 3);
    c.quadraticCurveTo(cx2 + (i % 2 ? 4 : -5), wy + 7 + (i % 3) * 2, cx2 + ww, wy + Math.sin(i * 3.3) * 3);
    c.stroke();
  }
  // THE SPLIT: the burst that made it a doorway — an off-centre tear,
  // breathing Lumen's leaf-green from inside
  const doorH = BH * 0.72;
  c.save(); c.globalCompositeOperation = 'lighter';
  const breathe = Math.sin(t / 1500) * 0.04;
  const gl = c.createLinearGradient(0, gy - doorH, 0, gy);
  gl.addColorStop(0, 'rgba(125,255,154,' + (0.08 + k * 0.4 + breathe) + ')');
  gl.addColorStop(1, 'rgba(210,255,222,' + (0.14 + k * 0.5 + breathe) + ')');
  c.fillStyle = gl;
  c.beginPath();
  c.moveTo(cx2 - 15, gy);
  c.quadraticCurveTo(cx2 - 22, gy - doorH * 0.5, cx2 - 4, gy - doorH);
  c.quadraticCurveTo(cx2 + 3, gy - doorH * 0.72, cx2 + 19, gy - doorH * 0.42);
  c.quadraticCurveTo(cx2 + 22, gy - doorH * 0.2, cx2 + 16, gy);
  c.closePath(); c.fill();
  // her motes drifting OUT the light — the same green sparks she sheds in
  // person (see the lumen NPC draw) — more the nearer she stands
  const gn = 2 + Math.round(k * 3);
  for (let i = 0; i < gn; i++) {
    const ph = (t / 2300 + i * 0.43) % 1;
    const gx2 = cx2 + Math.sin(i * 4.3 + t / 1400) * 12;
    c.globalAlpha = Math.sin(ph * Math.PI) * (0.3 + k * 0.4);
    c.fillStyle = '#7dff9a';
    c.beginPath(); c.arc(gx2, gy - 10 - ph * (doorH - 16), 1.6, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
  c.restore();
  // the curl-back lips of the tear, catching her light on their inner edge
  c.strokeStyle = 'rgba(125,255,154,0.35)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(cx2 - 15, gy);
  c.quadraticCurveTo(cx2 - 22, gy - doorH * 0.5, cx2 - 4, gy - doorH); c.stroke();
  c.strokeStyle = 'rgba(125,255,154,0.22)'; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(cx2 + 16, gy);
  c.quadraticCurveTo(cx2 + 22, gy - doorH * 0.28, cx2 + 19, gy - doorH * 0.42); c.stroke();
  c.restore();   // pod sway
  // the shed-leaf drift at the base: dry leaf-scales blown out of the den,
  // parting as she nears — the booth-flap k, worn by leaves instead of cloth
  const part = k * 18;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const px2 = cx2 + s * (8 + part + i * 6.5), py2 = gy - 1.5 - (i % 2) * 2.5;
      c.save();
      c.translate(px2, py2); c.rotate(s * (0.3 + i * 0.2) + Math.sin(i * 4.7) * 0.12);
      c.fillStyle = i % 2 ? '#1d3a26' : '#27492f';
      c.beginPath(); c.moveTo(-4.5, 0);
      c.quadraticCurveTo(0, -3.6, 4.5, 0);
      c.quadraticCurveTo(0, 2.6, -4.5, 0); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(125,255,154,0.2)'; c.lineWidth = 0.7;
      c.beginPath(); c.moveTo(-3.2, 0); c.lineTo(3.2, 0); c.stroke();
      c.restore();
    }
  }
  // its sign: a lantern-bud — a closed flower of leaves on a drooping stem
  // strung off the left column, glowing from inside as she breathes — her
  // trade where the others hang a lamp, a monitor, a gear and a reading hood
  const sw = Math.sin(t / 1200) * 0.08;
  c.save();
  c.translate(cx2 - BW + 14, gy - BH + 34); c.rotate(sw - 0.18);
  c.strokeStyle = '#2a1240'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(0, -10); c.quadraticCurveTo(4, -5, 0, 0); c.stroke();
  c.fillStyle = '#1d3a26';
  for (const s of [-1, 0, 1]) {
    c.save(); c.rotate(s * 0.5);
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(-2.6, 4, 0, 7.5);
    c.quadraticCurveTo(2.6, 4, 0, 0); c.closePath(); c.fill();
    c.restore();
  }
  const lp = 0.45 + Math.sin(t / 800) * 0.22;
  c.fillStyle = 'rgba(125,255,154,' + lp + ')';
  c.shadowColor = '#7dff9a'; c.shadowBlur = 8;
  c.beginPath(); c.ellipse(0, 4.4, 2.6, 3.4, 0, 0, 7); c.fill(); c.shadowBlur = 0;
  c.restore();
  c.restore();
}
// ---------- LEVELS WITHIN LEVELS -------------------------------------------
// The owner, 2026-08-23: "the game itself should be built in a way that
// enables me to add levels within levels. so that I can expand whenever I
// want from here."
//
// GATE_ROOM held ONE door per room, and that single fact was the ceiling on
// the whole idea. A room could lead inward to exactly one other place, so a
// hub with three side chambers — a tunnel with a branch, a shop with a back
// room, a lair with two grottoes — could not be written down at all, however
// many rooms world.js grew. The value of a row may now be a door OR AN ARRAY
// OF DOORS, and everything that reads the table goes through these two.
//
// Existing rows are untouched: one door is still one object, and every field
// on it means what it meant. Adding a second is adding a comma.
function gateDoorsAll(id) {
  const g = GATE_ROOM[id == null ? G.roomId : id];
  return !g ? [] : (Array.isArray(g) ? g : [g]);
}
// ...and this is the one the game uses: the doors that EXIST right now. A door
// with an unmet `need` is not hidden, it has not been built yet — no prompt,
// no structure, no walk — which is how the guardian grottoes appear.
function gateDoors(id) {
  const out = [];
  for (const d of gateDoorsAll(id))
    if (!d.need || (G.save && G.save.flags && G.save.flags[d.need])) out.push(d);
  return out;
}
function drawGateDoors(P) {
  const list = player ? gateDoors() : [];
  if (!list.length) { G._doorK = 0; return; }
  for (const d of list) drawGateDoor(P, d);
}
function drawGateDoor(P, def) {
  // WORLD-LOCKED: one x for the trigger, the prompt and the structure. The
  // parallax depth read now comes from the arch being dimmer and the leaves
  // being lit, not from the whole doorway crawling against the terrain.
  const ds = gateWorldX(def) - camSX();
  if (ds < -320 || ds > 1280) return;
  const gy = (G.roomDef.h - 2) * TILE - camSY();
  const near = Math.abs(player.x + player.w / 2 - gateWorldX(def)) < 130;
  // THE OPEN AMOUNT BELONGS TO THE DOOR. It used to be one number on G, which
  // was correct while a room had one door and wrong the moment it had two:
  // standing at either one opened both.
  const walking = !!(G.gateWalk && G.gateWalk.def === def);
  const want = walking ? 1 : near ? 0.14 : 0;
  def._k = (def._k == null ? 0 : def._k) + (want - (def._k || 0)) * (walking ? 0.07 : 0.04);
  const k = G._doorK = def._k;
  // cave on EITHER side of the passage: it is a mouth, not a door
  const dest = typeof ROOMS !== 'undefined' && ROOMS[def.to];
  if ((G.roomDef && G.roomDef.cave) || (dest && dest.cave)) { drawCaveMouth(ds, gy, P, k); return; }
  // a booth is a STALL, not a monument — the trader's kiosk on the meadow
  if (def.style === 'booth') { drawBooth(ds, gy, P, k); return; }
  // ...and the Oracle's shrine is HERS: same depth-door mechanics, its own
  // body, so the trader's plate never stands in the Conduits
  if (def.style === 'oracle') { drawOracleBooth(ds, gy, P, k); return; }
  // ...and the Tinker's quench hood is HIS — the Foundry's own furniture,
  // the Foundry's own light
  if (def.style === 'forge') { drawTinkerForge(ds, gy, P, k); return; }
  // ...and the Sage's carrel is the SAGE'S — the Archives' own furniture,
  // the Archivist's own reading light
  if (def.style === 'carrel') { drawSageCarrel(ds, gy, P, k); return; }
  // ...and the Nymph's hollow is LUMEN'S — the Nest's own tissue, woven,
  // and the one door in the game lit leaf-green
  if (def.style === 'hollow') { drawLumenHollow(ds, gy, P, k); return; }
  // THE ZONE GATES (§2f): every kingdom's depth door is its own fired
  // monument — a furnace arch, a parted shelf-stack, a cable iris, a talon
  // arch, an organic iris — and ONLY the city keeps the colossal multilayer
  // monument below (owner's order). Until a zone's plate arrives the room
  // falls through to the monument, which is what it drew yesterday.
  if (G.roomId !== 'W2') {
    const gplate = GATE_PLATE_BY_ZONE[G.roomDef && G.roomDef.zone];
    const gim = gplate && scenePlate(gplate);
    if (gim) {
      const GH = 330, GW = GH * (gim.naturalWidth / gim.naturalHeight);
      c.save();
      c.drawImage(gim, ds - GW / 2, gy - GH, GW, GH);
      // the kingdom's own light waking in the opening as she nears
      c.globalCompositeOperation = 'lighter';
      const og = c.createRadialGradient(ds, gy - GH * 0.32, 6, ds, gy - GH * 0.32, GH * 0.45);
      og.addColorStop(0, 'rgba(255,255,255,' + (0.06 + k * 0.22) + ')');
      og.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = og;
      c.fillRect(ds - GW / 2, gy - GH, GW, GH);
      c.restore();
      return;
    }
  }
  const cx2 = ds;
  // THE CITY GATE IS THE MONUMENT (owner: "only the city gate should be
  // huge and epic with multi layers and inscriptions and shapes — it's a
  // futuristic robot city gate!"). Every cave passage takes the mouth, so
  // this structure now belongs to one place and can afford to be colossal:
  // three depth layers of architecture, glyph inscriptions burning on the
  // lintel and leaves, circuit traces, a split iris emblem where the two
  // leaves meet, and tapered spires against the sky.
  const H3 = 410, W3 = 126, GAPW = 26;
  let gh = 2166136261 >>> 0;
  for (const ch of 'citygate') { gh ^= ch.charCodeAt(0); gh = Math.imul(gh, 16777619); }
  const grnd = () => ((gh = Math.imul(gh ^ (gh >>> 15), 2246822519) >>> 0) % 1000) / 1000;
  c.save();
  // ---- layer 0: the super-arch, deepest bones against the sky ----
  c.globalAlpha = 0.35;
  c.fillStyle = '#0a1119';
  c.fillRect(ds - W3 - GAPW - 92, gy - H3 - 150, 34, H3 + 150);
  c.fillRect(ds + W3 + GAPW + 58, gy - H3 - 150, 34, H3 + 150);
  c.fillRect(ds - W3 - GAPW - 92, gy - H3 - 150, (W3 + GAPW + 92) * 2, 26);
  // ---- layer 1: the colossal arch, the dimmer middle bones ----
  c.globalAlpha = 0.55;
  const arch = c.createLinearGradient(0, gy - H3 - 90, 0, gy);
  arch.addColorStop(0, '#060a10'); arch.addColorStop(1, '#101823');
  c.fillStyle = arch;
  c.fillRect(ds - W3 - GAPW - 46, gy - H3 - 90, 40, H3 + 90);
  c.fillRect(ds + W3 + GAPW + 6, gy - H3 - 90, 40, H3 + 90);
  c.fillRect(ds - W3 - GAPW - 46, gy - H3 - 90, (W3 + GAPW + 46) * 2, 34);
  c.globalAlpha = 1;
  // ---- layer 2: the frame, with spires ----
  const pyl = (x0, flip) => {
    const g2 = c.createLinearGradient(x0, 0, x0 + 30 * flip, 0);
    g2.addColorStop(0, '#1b2531'); g2.addColorStop(0.7, '#0c121a'); g2.addColorStop(1, '#070b11');
    c.fillStyle = g2;
    c.fillRect(Math.min(x0, x0 + 30 * flip), gy - H3 - 46, 30, H3 + 46);
    c.strokeStyle = 'rgba(160,200,230,0.25)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x0, gy - H3 - 46); c.lineTo(x0, gy); c.stroke();
    // a tapered spire off each pylon crown — antennae of a machine city
    c.fillStyle = '#0e141c';
    c.beginPath();
    c.moveTo(x0 + 2 * flip, gy - H3 - 46);
    c.lineTo(x0 + 13 * flip, gy - H3 - 118);
    c.lineTo(x0 + 22 * flip, gy - H3 - 46);
    c.closePath(); c.fill();
    c.fillStyle = P.glow; c.globalAlpha = 0.5 + Math.sin(performance.now() / 700) * 0.3;
    c.beginPath(); c.arc(x0 + 13 * flip, gy - H3 - 120, 2.6, 0, 7); c.fill();
    c.globalAlpha = 1;
  };
  pyl(cx2 - W3 - GAPW, -1);
  pyl(cx2 + W3 + GAPW, 1);
  // the lintel, with its glow seam and THE INSCRIPTION — a course of
  // machine glyphs burning across the whole beam
  const lin = c.createLinearGradient(0, gy - H3 - 64, 0, gy - H3 - 10);
  lin.addColorStop(0, '#05080d'); lin.addColorStop(0.6, '#141d29'); lin.addColorStop(1, '#0a1017');
  c.fillStyle = lin;
  c.fillRect(cx2 - W3 - GAPW - 30, gy - H3 - 64, (W3 + GAPW + 30) * 2, 54);
  c.save(); c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.35 + k * 0.4;
  c.fillStyle = P.glow;
  c.fillRect(cx2 - W3 - GAPW - 20, gy - H3 - 16, (W3 + GAPW + 20) * 2, 2.5);
  c.strokeStyle = P.glow; c.lineWidth = 1.6;
  c.globalAlpha = 0.4 + k * 0.35 + Math.sin(performance.now() / 900) * 0.1;
  for (let gi = -6; gi <= 6; gi++) {
    const gx2 = cx2 + gi * 22, gyy = gy - H3 - 40;
    c.beginPath();
    const kind = (gi + 60) % 4;
    if (kind === 0) { c.moveTo(gx2 - 5, gyy + 6); c.lineTo(gx2, gyy - 6); c.lineTo(gx2 + 5, gyy + 6); }
    else if (kind === 1) { c.arc(gx2, gyy, 5.5, 0.6, 5.7); }
    else if (kind === 2) { c.moveTo(gx2 - 5, gyy - 5); c.lineTo(gx2 + 5, gyy - 5); c.moveTo(gx2, gyy - 5); c.lineTo(gx2, gyy + 7); }
    else { c.moveTo(gx2 - 5, gyy); c.lineTo(gx2, gyy - 6); c.lineTo(gx2 + 5, gyy); c.lineTo(gx2, gyy + 6); c.closePath(); }
    c.stroke();
  }
  c.restore();
  // ---- the LEAVES — they slide into the pylons as k opens ----
  const slide = k * (W3 - 6);
  for (const s of [-1, 1]) {
    const inner = cx2 + s * (GAPW * 0.32 + slide);       // the crack edge
    const outer = inner + s * W3;
    const lg = c.createLinearGradient(inner, 0, outer, 0);
    lg.addColorStop(0, '#2a3a4c'); lg.addColorStop(0.25, '#182432');
    lg.addColorStop(0.85, '#0b1219'); lg.addColorStop(1, '#070b11');
    c.fillStyle = lg;
    c.beginPath();
    c.moveTo(inner, gy);
    c.lineTo(inner, gy - H3 + 8);
    c.lineTo(inner + s * 14, gy - H3 - 8);                // the leaf crowns lean in
    c.lineTo(outer, gy - H3 - 8);
    c.lineTo(outer, gy);
    c.closePath(); c.fill();
    // panel ribs — the relief that makes it read as mass, not a rectangle
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2;
    for (let r2 = 1; r2 <= 3; r2++) {
      const rx = inner + s * (W3 * r2 / 4);
      c.beginPath(); c.moveTo(rx, gy - 8); c.lineTo(rx, gy - H3 + 4); c.stroke();
    }
    c.strokeStyle = 'rgba(150,190,225,0.16)'; c.lineWidth = 1;
    for (let r2 = 1; r2 <= 3; r2++) {
      const rx = inner + s * (W3 * r2 / 4) + s * 2;
      c.beginPath(); c.moveTo(rx, gy - 8); c.lineTo(rx, gy - H3 + 4); c.stroke();
    }
    // the lit inner edge of each leaf — the crack is where the light lives
    c.strokeStyle = 'rgba(200,230,255,0.5)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(inner, gy); c.lineTo(inner, gy - H3 + 8); c.stroke();
    // CIRCUIT TRACES — inscriptions etched into the metal, faintly alive.
    // Seeded polylines that step only horizontally/vertically, like board
    // traces, each ending in a via dot.
    c.save(); c.globalCompositeOperation = 'lighter';
    c.strokeStyle = P.glow; c.fillStyle = P.glow; c.lineWidth = 1.1;
    c.globalAlpha = 0.16 + k * 0.25;
    for (let t2 = 0; t2 < 6; t2++) {
      let px2 = inner + s * (10 + grnd() * (W3 - 24));
      let py2 = gy - 20 - grnd() * (H3 - 60);
      c.beginPath(); c.moveTo(px2, py2);
      for (let seg = 0; seg < 4; seg++) {
        if (grnd() < 0.5) px2 += s * (8 + grnd() * 22) * (grnd() < 0.5 ? 1 : -1);
        else py2 -= (10 + grnd() * 26) * (grnd() < 0.5 ? 1 : -1);
        px2 = Math.max(Math.min(px2, Math.max(inner, outer) - 6), Math.min(inner, outer) + 6);
        c.lineTo(px2, py2);
      }
      c.stroke();
      c.beginPath(); c.arc(px2, py2, 2, 0, 7); c.fill();
    }
    // rivet studs down the outer band
    c.globalAlpha = 0.3;
    for (let rv = 0; rv < 7; rv++) {
      c.beginPath(); c.arc(outer - s * 8, gy - 26 - rv * (H3 - 50) / 6, 1.8, 0, 7); c.fill();
    }
    // THE SPLIT IRIS EMBLEM — half a great ringed circle on each leaf, whole
    // only when the gate is shut, parting with the leaves as they open
    c.globalAlpha = 0.5 + k * 0.3;
    c.lineWidth = 2.2;
    const ey = gy - H3 * 0.56;
    for (const er of [44, 30]) {
      c.beginPath();
      c.arc(inner, ey, er, s === -1 ? Math.PI / 2 : -Math.PI / 2, s === -1 ? Math.PI * 1.5 : Math.PI / 2);
      c.stroke();
    }
    c.beginPath(); c.moveTo(inner, ey - 16); c.lineTo(inner, ey + 16); c.stroke();
    c.restore();
  }
  // ---- the light through the opening ----
  const gapNow = GAPW * 0.32 + slide;
  c.save(); c.globalCompositeOperation = 'lighter';
  const spill = c.createLinearGradient(cx2, gy - H3, cx2, gy);
  spill.addColorStop(0, 'rgba(255,226,160,' + (0.10 + k * 0.5) + ')');
  spill.addColorStop(1, 'rgba(255,200,110,' + (0.05 + k * 0.3) + ')');
  c.fillStyle = spill;
  c.fillRect(cx2 - gapNow, gy - H3 + 4, gapNow * 2, H3 - 4);
  // and it pools on the ground when the doors stand open
  if (k > 0.05) {
    const pool = c.createRadialGradient(cx2, gy, 6, cx2, gy, 90 + k * 120);
    pool.addColorStop(0, 'rgba(255,220,150,' + (0.22 * k) + ')');
    pool.addColorStop(1, 'rgba(255,200,110,0)');
    c.fillStyle = pool;
    c.beginPath(); c.ellipse(cx2, gy, 90 + k * 120, 22 + k * 10, 0, 0, 7); c.fill();
  }
  c.restore();
  c.restore();
}
// ---------- THE BURIED MOUTH -----------------------------------------------
// The owner, 2026-08-23: "the first cave or tunnel that I face needs to be
// covered with rubbles, and it should emit a sound from within that attracts
// me to go there... I have to go and hit the rubble to go inside."
//
// So the first tunnel is not a door she walks into — it is a WALL she hears
// through. Three parts, and each carries a third of the idea:
//   1. a pile with HP that answers to the blade          — rubbleHit()
//   2. a voice from behind it whose loudness IS distance  — tickCaveLure()
//   3. a gate that refuses the walk-in until it is gone   — gateEnter()
// It rides on GATE_ROOM (`rubble` names its save flag) rather than being a
// room entity, because the pile has to stand exactly where the door stands.
// Two places for one thing is the bug that made the doors slide in the first
// place, and a heap a shoulder's width off its own mouth is the same bug.
const RUBBLE_HP = 6;
// ONE PILE PER DOOR, because there is more than one door now: a hub can bury
// its side passage and leave its main way open, which is most of what makes a
// branch worth finding.
function rubbleFor(def) {
  if (!def || !def.rubble || !G.rubbles) return null;
  for (const r of G.rubbles) if (r.flag === def.rubble && r.hp > 0) return r;
  return null;
}
function rubbleInit() {
  G.rubbles = [];
  G.rubble = null;
  if (!G.roomDef) return;
  for (const g of gateDoors()) {
    if (!g.rubble) continue;
    if (G.save && G.save.flags && G.save.flags[g.rubble]) continue;   // already opened
    // seeded off the door, so it is the SAME pile every visit. A heap that
    // reshuffles on re-entry reads as weather, not as rock, and a wall she is
    // meant to remember hitting must look like the wall she hit.
    let h = 2166136261 >>> 0;
    for (const ch of G.roomId + '|' + g.rubble) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    G.rubbles.push({ flag: g.rubble, door: g, hp: RUBBLE_HP, max: RUBBLE_HP,
                     x: gateWorldX(g), y: (G.roomDef.h - 2) * TILE,
                     shake: 0, dust: 0, told: 0, seed: h >>> 0, t: 0 });
  }
  // the one she is nearest to, kept for everything that only ever deals with
  // the pile in front of her
  G.rubble = G.rubbles[0] || null;
}
// THE PILE STANDS ON THE GROUND SHE STANDS ON. The gate's own anchor is the
// tile row (h-2), which is where the BACKDROP is painted from — and the
// heightfield lifts the walkable surface above that wherever the curve rises,
// so anchoring the pile on the tile row buried its bottom third in terrain.
// The body's floor and the pile's floor have to be the same number.
function rubbleFoot(r) {
  const g = (typeof groundColumnAt === 'function') ? groundColumnAt(r.x) : null;
  return g && !isNaN(g[0]) ? Math.min(r.y, g[0]) : r.y;
}
function rubbleBox(r) {
  r = r || G.rubble; if (!r) return null;
  const fy = rubbleFoot(r);
  return { x: r.x - 78, y: fy - 178, w: 156, h: 182 };
}
// One swing takes one point off the pile; the supercharged burst takes three.
// ORDINARY CLAWS WORK — deliberately. The pillar teaches "some rock needs the
// charge", and repeating that lesson at the first tunnel would gate the whole
// map behind a skill a new run may not have bought yet.
function rubbleHit(box, heavy) {
  let any = false;
  for (const r of (G.rubbles || [])) if (rubbleHitOne(r, box, heavy)) any = true;
  return any;
}
function rubbleHitOne(r, box, heavy) {
  if (!r || r.hp <= 0) return false;
  const b = rubbleBox(r);
  if (!(box.x < b.x + b.w && box.x + box.w > b.x &&
        box.y < b.y + b.h && box.y + box.h > b.y)) return false;
  r.hp -= heavy ? 3 : 1;
  r.shake = Math.max(r.shake, heavy ? 1 : 0.6);
  r.dust = Math.min(1.5, r.dust + 0.55);
  const px = r.x, py = r.y - 96;
  cam.shake = Math.max(cam.shake, heavy ? 9 : 4.2);
  G.hitStop = Math.max(G.hitStop, heavy ? 0.075 : 0.05);
  if (typeof padRumble === 'function') padRumble(heavy ? 0.5 : 0.32, 0.55, heavy ? 110 : 70);
  if (r.hp > 0) {
    sfx('rock');
    burst(px, py, 12, '#c9b79a', 210, 0.55, 240, 3, true);
    burst(px, py + 46, 7, '#8b7d68', 150, 0.8, 50, 2.4, true);
    // it SAYS how far in she is: the count is the only honest progress bar a
    // rock pile can have, and a wall that eats hits silently reads as a bug
    if ((G._rubToldT || 0) <= 0) { G._rubToldT = 2.2; G.toast(t('rub_hit')); }
    return true;
  }
  // THE PILE GIVES WAY
  r.hp = 0;
  if (G.save) { G.save.flags = G.save.flags || {}; G.save.flags[r.flag] = 1; }
  if (typeof persist === 'function') persist();
  sfx('collapse');
  cam.shake = Math.max(cam.shake, 15);
  G.flash = Math.max(G.flash, 0.5);
  G.hitStop = Math.max(G.hitStop, 0.12);
  if (typeof padRumble === 'function') padRumble(0.8, 0.9, 320);
  burst(px, py, 46, '#c9b79a', 380, 1.1, 320, 4, true);
  burst(px, py + 40, 30, '#7c6f5c', 260, 1.6, 60, 3.4, true);
  burst(px, py - 20, 16, '#ffe6b0', 300, 0.7, 140, 3, true);
  G.toast(t('rub_open'));
  if (typeof hzdSay === 'function') hzdSay('purr', 0);
  // IT FALLS, it does not vanish. The gate is open on this frame — hp is 0 and
  // gateEnter stops refusing — but the stones need half a second to get out of
  // the way, or the biggest moment in the room is a pile blinking off.
  r.fall = 0.6;
  return true;
}
function rubbleTick(dt) {
  G._rubToldT = Math.max(0, (G._rubToldT || 0) - dt);
  if (!G.rubbles || !G.rubbles.length) { G.rubble = null; return; }
  let near = null, nd = 1e9;
  for (let i = G.rubbles.length - 1; i >= 0; i--) {
    const r = G.rubbles[i];
    r.t += dt;
    if (r.fall != null) { r.fall -= dt; if (r.fall <= 0) { G.rubbles.splice(i, 1); continue; } }
    r.shake = Math.max(0, r.shake - dt * 2.6);
    r.dust = Math.max(0, r.dust - dt * 0.9);
    if (!player) continue;
    const d = Math.abs(player.x + player.w / 2 - r.x);
    if (d < nd) { nd = d; near = r; }
    // the nudge, once: she is standing at a hole she cannot enter, and the
    // game has never asked her to hit scenery before
    if (!r.told && d < 150) { r.told = 1; G.toast(t('rub_hint')); }
  }
  G.rubble = near || G.rubbles[0] || null;
}
// THE VOICE FROM INSIDE. Gain is distance and nothing else, which is what makes
// it a lure rather than an ambience: it is audible from the far end of the room
// and it grows as she walks, so the room teaches its own direction. The rock
// still muffles it — the pile's remaining HP scales the top end — so knocking
// it down makes the sound OPEN, and that is the reward for the first two hits.
function tickCaveLure() {
  if (typeof npcVoxTick !== 'function' || !player) return;
  // the nearest hole is the one she can hear. Two calling at once is a chord,
  // not a direction, and a lure that does not point is not a lure.
  let r = null, x = null, nd = 1e9;
  const px = player.x + player.w / 2;
  for (const q of (G.rubbles || [])) { const d2 = Math.abs(px - q.x); if (d2 < nd) { nd = d2; r = q; x = q.x; } }
  if (!r) for (const g of gateDoors()) {
    if (!g.rubble) continue;
    const gx2 = gateWorldX(g), d2 = Math.abs(px - gx2);
    if (d2 < nd) { nd = d2; x = gx2; }
  }
  if (x == null) return;
  const d = Math.abs(px - x);
  const k = clamp(1 - d / 900, 0, 1);
  // buried: muffled, and it un-muffles as the rock goes. Opened: it stays, at
  // half, because a tunnel that fell silent the moment it opened would read as
  // a switch rather than as a place.
  const muffle = r ? 0.5 + 0.5 * (1 - r.hp / r.max) : 0.5;
  npcVoxTick('cave', (0.10 + k * k * 0.62) * muffle);
}
function gateHere() {
  if (!player) return null;
  // THE DOOR IS ONE PLACE. It was briefly "where the backdrop painted it",
  // which moved with the parallax pan — the same slide the owner reported in
  // the caves. The stand spot in the table is the door, full stop; the
  // structure, prompt and walk all draw at that world x now.
  // With more than one door in a room, the NEAREST one in reach is the one she
  // is standing at — never the first in the table, which would make a hub's
  // second door unusable from inside its own stand spot.
  const px = player.x + player.w / 2;
  let best = null, bd = 90;
  for (const d of gateDoors()) {
    const dx = Math.abs(px - gateWorldX(d));
    if (dx < bd) { bd = dx; best = d; }
  }
  return best;
}
function gateEnter() {
  const G2 = gateHere();
  if (!G2 || G.gateWalk) return false;
  // BURIED: the mouth is there, she can hear through it, and it will not take
  // her. Refusing LOUDLY matters — a door that silently ignores UP is a dead
  // input, and she has to learn that this one is opened with the blade.
  const buried = rubbleFor(G2);
  if (buried) {
    sfx('no');
    buried.shake = Math.max(buried.shake, 0.35);
    cam.shake = Math.max(cam.shake, 2.4);
    burst(buried.x, buried.y - 90, 6, '#8b7d68', 120, 0.6, 40, 2.2, true);
    if ((G._rubToldT || 0) <= 0) { G._rubToldT = 2.2; G.toast(t('rub_hint')); }
    return false;
  }
  // the vanishing point: the gap between the doors, in SCREEN space, since the
  // gates are the room's backdrop and the backdrop does not scroll with the
  // tiles (see ROOM_VISTA)
  G.gateWalk = { t: 0, to: G2.to, x0: player.x + player.w / 2, y0: player.y + player.h, def: G2 };
  // ASK FOR HER BACK NOW, not on the frame that draws it. The walk-away shot is
  // the only place in the game she is seen from behind, and the four plates that
  // do it are lazy-loaded like everything else — requested at draw time they
  // arrive a few frames in, and those few frames are exactly the ones that used
  // to show her side-on. Both pairs, because which one she wears depends on the
  // sword and the small copies cost a few kilobytes each — but THE PAIR SHE
  // WILL WEAR GOES FIRST. Requested armed-first regardless, the armed pair won
  // the race on an unarmed run often enough that the shot showed her carrying a
  // sword she does not own; four parallel fetches have no order of their own, so
  // the order has to be given here.
  if (typeof mediaFetch === 'function') {
    const armed = !!(G.save && G.save.flags && G.save.flags.crystal);
    for (const k of gateBackPair(armed)) mediaFetch(k, 1);
    for (const k of gateBackPair(!armed)) mediaFetch(k, 1);
  }
  sfx('ui');
  if (typeof hzdSay === 'function') hzdSay('purr', 0);
  return true;
}
// Every depth door advertises itself: a soft glimmer where it stands, and an
// UP chevron once she is close enough to use it. Without this a door in a
// painting is a secret — the city gate only got away with it because the
// tutorial chip pointed at it, and new doors are not tutorials. Drawn in
// world space, from the same pass as the projectiles.
function drawGatePrompt() {
  if (G.gateWalk || !player || player.dead) return;
  for (const d of gateDoors()) drawOneGatePrompt(d);
}
function drawOneGatePrompt(def) {
  // the glimmer marks the door's one world spot — same anchor as the
  // structure and the trigger, so what pulses is what you press UP at
  const gx = gateWorldX(def);
  const gy = (G.roomDef.h - 2) * TILE;
  const d = Math.abs(player.x + player.w / 2 - gx);
  if (d > 260) return;
  // a buried mouth advertises itself with the pile's own cracklight and the
  // sound behind it — never with the UP chevron, which would promise a walk
  // the door is going to refuse
  const buried = !!(def.rubble && rubbleFor(def));
  const near = d < 90 && !buried, t = performance.now() / 1000;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = (near ? 0.85 : 0.4) * (0.7 + Math.sin(t * 2.4) * 0.3);
  const g2 = c.createRadialGradient(gx, gy - 30, 2, gx, gy - 30, 42);
  g2.addColorStop(0, 'rgba(255,240,200,0.8)'); g2.addColorStop(1, 'rgba(255,220,140,0)');
  c.fillStyle = g2; c.beginPath(); c.arc(gx, gy - 30, 42, 0, 7); c.fill();
  if (near) {
    c.globalAlpha = 0.95;
    c.fillStyle = '#fff2cf';
    c.font = 'bold 20px monospace'; c.textAlign = 'center';
    c.fillText('↑', gx, gy - 44 + Math.sin(t * 3.2) * 3);
  }
  c.restore();
}
// 3.4s: a CAREFUL walk, not a dash through a doorway. The owner's direction:
// "a careful steady walk into the unknown, getting smaller as I go deeper,
// until fading." Steady means near-constant pace — the easing below keeps
// the speed level instead of rushing the middle.
const GATE_WALK = 3.4;
function updateGateWalk(dt) {
  const g = G.gateWalk; if (!g) return;
  // SHE DOES NOT TURN UNTIL THERE IS A BACK TO TURN. Holding the first moments
  // of the shot at the door costs nothing — she is standing there anyway, drawn
  // the way she always is — and it buys the plates the fraction of a second they
  // need. Capped, so a browser that cannot decode webp at all still leaves the
  // room instead of standing in the doorway forever.
  if (typeof gateBackReady === 'function' && !gateBackReady()) {
    g.hold = (g.hold || 0) + dt;
    if (g.hold < 0.75) return;
  }
  g.t += dt;
  if (g.t >= GATE_WALK) {
    G.gateWalk = null;
    loadRoom(g.to);
    // AND SHE COMES OUT OF THE OTHER SIDE OF THE GATE. loadRoom keeps whatever
    // x she had, and she had the far right of a wider room — which put her past
    // the right edge of the meadow and bounced her straight through it into the
    // next room. Walking in through a door has to arrive INSIDE the far room:
    // at the door's declared arrival fraction (ax), clamped into the room so a
    // mis-typed table entry can never strand her in a wall.
    if (player) {
      const rw = G.roomDef.w * TILE;
      const ax = (g.def && g.def.ax != null)
        ? Math.round(rw * g.def.ax - player.w / 2) : 40;
      player.x = clamp(ax, TILE + 4, rw - TILE - 4 - player.w);
      player.vx = 0; player.vy = 0;
      player.face = player.faceVis = 1;
      player.lastSafe = { x: player.x, y: player.y };
    }
  }
}
// Her back plates, and the one question the walk-away shot asks of them: is
// there anything here that can be DRAWN this frame? MEDIA_IMG's accessor
// fetches on read, which is what we want the first time and harmless after —
// but an Image that is still loading has naturalWidth 0 and must not count.
function gateBackImg(k) {
  const im = MEDIA_IMG[k];
  return (im && im.naturalWidth) ? im : null;
}
// READY MEANS THE PAIR SHE WILL WALK IN, NOT ANY ONE PLATE OF FOUR.
//
// This used to return true the moment ONE of the four had decoded, and the hold
// released on that — so the shot could start with only backwalk_a in hand and
// every frame of the B half of the stride fell through to her SIDE view, which
// is the "going in background looks fake" report all over again. It was
// intermittent because it depended on which of four fetches happened to land
// first, and it got worse as the boot set grew: a run measured 89 side frames
// out of a 3.4-second walk while a run minutes earlier measured none.
//
// A stride needs BOTH of its frames. Waiting for the pair costs nothing she can
// see — the hold is capped at 0.75s and she is standing in the doorway drawn
// the way she always is — and it is the difference between a walk and a flicker.
function gateBackPair(armed) {
  return armed ? ['heroBackA', 'heroBackB'] : ['heroBareBackA', 'heroBareBackB'];
}
// Ready means HER pair — not the other one. The substitute exists so a browser
// that never gets the right plates still shows a back rather than a side view,
// and it is drawGateWalk's last resort once this hold has spent its 0.75s. If
// it counted as ready here, the hold would release the moment the WRONG pair
// landed and she would walk out wearing a sword she does not own.
function gateBackReady() {
  const want = gateBackPair(!!(G.save && G.save.flags && G.save.flags.crystal));
  return !!(gateBackImg(want[0]) && gateBackImg(want[1]));
}
function drawGateWalk() {
  const g = G.gateWalk; if (!g) return;
  const k = clamp(g.t / GATE_WALK, 0, 1);
  // she walks into the gap and away: position lerps toward the vanishing point
  // in SCREEN space, scale falls off, and the last third fades to black so the
  // room change lands on darkness rather than on a cut
  // A CAREFUL, STEADY WALK INTO THE UNKNOWN (owner's direction). The first
  // tenth eases her into the stride; after that the pace is CONSTANT — no
  // smoothstep rush through the middle — and she simply gets smaller the
  // deeper she goes, until the dark takes her.
  const e = k < 0.1 ? (k * k) / 0.1 * 0.5 + k * 0.5 : k;
  const sx0 = g.x0 - camSX(), sy0 = g.y0 - camSY();
  const tg = gateTarget(g.def);
  const tx = tg.x, ty = tg.y;
  // INTO the background, not along the floor. She is already standing at the
  // door when the walk starts (the trigger requires it), so the horizontal
  // travel is a step or two — DEPTH does the work: the scale falls away
  // steadily with every step, with a slight rise into the gap.
  const x = sx0 + (tx - sx0) * e, y = sy0 + (ty - sy0) * (e * e);
  // TWO WAYS TO LEAVE THE WORLD (owner): through a GATE she recedes — the
  // doorway has depth and she gets smaller down its length, fading only at
  // the end. Into a CAVE she is SWALLOWED — a cave mouth has no lit hall to
  // shrink down; she keeps her size and the darkness takes her a little
  // more with every step.
  const dest2 = typeof ROOMS !== 'undefined' && ROOMS[g.to];
  const intoCave = (G.roomDef && G.roomDef.cave) || (dest2 && dest2.cave);
  const sc = intoCave ? 1 - 0.16 * e : 1 - 0.84 * e;
  c.save();
  // SWALLOWED BY DARK, NOT DISSOLVED. The old fade dropped globalAlpha, which
  // shows the room THROUGH her — a ghost, not a shadow, and the same wrong read
  // as the powered-down NPCs below. Walking into an unlit passage the LIGHT
  // leaves her: she stays opaque and dims to a black silhouette (brightness,
  // smoothstepped so the falloff is soft at both ends), and only her last few
  // steps dissolve into the dark at all.
  // Older Safari has no canvas filter — there she keeps the old alpha ramp,
  // which is worse but is not nothing.
  const filterOK = typeof c.filter === 'string';
  const darkK = intoCave
    ? clamp((k - 0.15) / 0.65, 0, 1)               // the dark takes her early and steadily
    : clamp((k - 0.55) / 0.40, 0, 1);              // small and deep before the light dies
  const darkE = darkK * darkK * (3 - 2 * darkK);
  if (filterOK) {
    c.filter = 'brightness(' + (1 - darkE).toFixed(3) + ')';
    c.globalAlpha = 1 - clamp((k - 0.93) / 0.07, 0, 1);
  } else {
    c.globalAlpha = intoCave
      ? 1 - clamp((k - 0.18) / 0.66, 0, 1)
      : 1 - clamp((k - 0.74) / 0.26, 0, 1);
  }
  // HER AUTHORED BACK. Generated from her own body (see assets/source/ref/ and
  // ART_QUEUE §1) — the first time the game shows her from behind with real
  // art rather than a side view scaled down. Two stride frames swap on the
  // distance she has covered toward the gap, the same ground-driven rule the
  // wolves walk by, so the walk cannot moonwalk however long the shot runs.
  //
  // WHICH BACK depends on the sword: the armed pair carries the purifier across
  // her shoulders, the bare pair does not, and showing the wrong one hands the
  // owner a sword in the opening that he has not been given yet. What the gate
  // is NOT allowed to do — the owner's instruction, 2026-08-20 — is fall back to
  // her side view: "it should turn its back, not as if it's running to a
  // direction. It's just turning back, walking inside the background." So the
  // wrong-sword back beats the right-sword side, and the live body is the last
  // resort of a browser that loaded neither.
  const armed = !!(G.save && G.save.flags && G.save.flags.crystal);
  const trav = Math.hypot(x - sx0, y - sy0) + e * 60;   // depth counts as stride
  const b = (Math.floor(trav / 26) % 2) ? 1 : 0;
  // ONE COSTUME FOR THE WHOLE WALK. This picked its plate per frame with the
  // other pair as a per-frame fallback, so a run where three of the four had
  // decoded drew her stride as bare-A, armed-B, bare-A — she changed costume
  // twice a second on her way through the gate. The pair is chosen ONCE, on the
  // first drawn frame, and it is whichever pair is whole: the right one if it
  // is here, the substitute if it is not, and if neither is she keeps her side
  // view for that frame and the choice is left open for the next one.
  if (!g.pair) {
    const want = gateBackPair(armed), altp = gateBackPair(!armed);
    if (gateBackImg(want[0]) && gateBackImg(want[1])) g.pair = want;
    else if (gateBackImg(altp[0]) && gateBackImg(altp[1])) g.pair = altp;
  }
  const want = g.pair ? g.pair[b] : '';
  const im = want ? gateBackImg(want) : null;
  // what the shot actually drew her as, for tests/opening.cjs — "she turned her
  // back" is the whole point of this function and it is not readable from the
  // outside otherwise
  G.gateBackKey = im ? want : '';
  if (im) {
    const dh = 92 * sc, dw = dh * (im.naturalWidth / im.naturalHeight);
    // the gait's vertical, off the same stride counter as the frames
    const rise = -Math.abs(Math.sin((trav / 26) * Math.PI)) * 2.2 * sc;
    c.drawImage(im, x - dw / 2, y - dh + rise, dw, dh);
  } else if (player) {
    // Neither back plate decoded. Her live body is all that is left — but it is
    // driven at WALK speed, not the old 210, so that at worst the shot reads as
    // someone walking off rather than sprinting sideways into a wall.
    const dir = Math.sign(tx - sx0) || 1;
    const vx0 = player.vx, f0 = player.face, fv0 = player.faceVis;
    player.vx = dir * 96; player.face = dir; player.faceVis = dir;
    c.translate(x, y);
    c.scale(sc, sc);
    c.translate(-(player.x + player.w / 2), -(player.y + player.h));
    player.draw(c);
    player.vx = vx0; player.face = f0; player.faceVis = fv0;
  }
  c.restore();
  // and the light from inside the gate reaches out for her
  c.save(); c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.10 + e * 0.30;
  const gg = c.createRadialGradient(tx, ty - 60, 8, tx, ty - 60, 260);
  gg.addColorStop(0, 'rgba(255,214,138,0.9)'); gg.addColorStop(1, 'rgba(255,190,90,0)');
  c.fillStyle = gg; c.beginPath(); c.arc(tx, ty - 60, 260, 0, 7); c.fill();
  c.restore();
  // ...and the world dims behind her as she leaves it — late and slow, so
  // the small figure walking away is the shot, not the blackout
  const wDim = clamp((k - 0.62) / 0.38, 0, 1), wDimE = wDim * wDim * (3 - 2 * wDim);
  c.fillStyle = 'rgba(0,0,0,' + (wDimE * 0.97).toFixed(3) + ')';
  c.fillRect(0, 0, 960, 540);
}
// ---------------------------------------------------------------------------
// THE WAKING. Two seconds in which she cannot do anything, on purpose.
//
// The opening film ends on her eyes opening; this is the machine letting go of
// her. Her controls are held for it — the same hold the guardian chambers use —
// because a release you can walk out of halfway through is not a release, it is
// a loading screen with a picture on it. It happens exactly once per save.
function wakeStart() {
  if (!G.save || (G.save.flags && G.save.flags.woke)) return;
  G.wake = { t: 2.0 };
  if (typeof sfx === 'function') sfx('powerUp');
  if (typeof cam !== 'undefined') cam.shake = Math.max(cam.shake, 4);
  if (typeof padRumble === 'function') padRumble(0.5, 0.4, 700);
}
function updateWake(dt) {
  if (!G.wake) return;
  const before = G.wake.t;
  G.wake.t -= dt;
  // the clunk of the last umbilical coming off, half a second in
  if (before > 1.45 && G.wake.t <= 1.45) { sfx('metal'); cam.shake = Math.max(cam.shake, 6); }
  if (G.wake.t <= 0) {
    G.wake = null;
    if (G.save.flags) G.save.flags.woke = 1;
    if (typeof persist === 'function') persist();
    if (typeof hzdSay === 'function') hzdSay('purr', 0);
  }
}
function drawFlora() {
  if (typeof isHero === 'function' && isHero()) return;   // the Odyssey has its own world
  const plan = floraPlan(G.roomId);
  if (!plan.length) return;
  const zone = G.roomDef.zone, far = (PAL[zone] || {}).far || '#0b0d11';
  const now = performance.now() / 1000;
  for (const p of plan) {
    const im = MEDIA_IMG[p.s.key];
    if (!im || !im.naturalWidth) continue;
    const h = p.s.k * TILE * p.sc, w = h * (im.naturalWidth / im.naturalHeight);
    c.save();
    c.translate(camSX() * (1 - p.s.par), camSY() * (1 - p.s.par));
    // a slow sway, phase-offset per plant. Tiny — 0.02 rad — because a garden
    // where every stalk swings in step reads as a screensaver.
    c.translate(p.x, p.y);
    // NO TWINS. Two of the same plant at the same size and the same posture in
    // one frame read as copy-paste however good the asset is, so each carries
    // its own lean on top of the shared sway — hashed off the room like
    // everything else here, which keeps it the same garden on every visit and
    // on every platform (RULE ONE).
    c.rotate((p.lean || 0) + Math.sin(now * 0.5 + p.ph) * 0.02);
    if (p.flip) c.scale(-1, 1);
    c.globalAlpha = 1 - p.s.dim;
    c.drawImage(im, -w / 2, -h, w, h);
    c.globalAlpha = p.s.dim * 0.55;
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = far;
    c.fillRect(-w / 2 - 2, -h - 2, w + 4, h + 4);
    c.restore();
  }
}
// only fetch a kingdom's flora when she is standing in it
function floraPreload(zone) {
  const set = FLORA[zone];
  if (!set || typeof mediaFetch !== 'function') return;
  for (const s of set) mediaFetch(s.key);
}
// ===========================================================================
// THE THRUST BOOTS — the hardware that explains the dash.
//
// She is a MACHINE, and a machine does not one day discover it can cross a gap
// in a straight line at nine hundred pixels a second. It gets fitted for it.
// The dash has always been NULLFANG's grant; these are the thing that grant
// actually is, and until now the game showed the exhaust of a pair of boots
// that did not exist.
//
// They are drawn during the DASH and only during the dash, which is not a
// compromise — it is where the gear is doing something. Her legs are IK-solved
// and her run cycle is procedural, so a static boot plate stapled to a moving
// foot reads as a sticker; a boot plate aligned to the dash VECTOR, at the
// moment both feet are locked together and pointing the same way, reads as the
// machine it is. The authored plate carries its own exhaust, so it sits over
// the procedural cone rather than replacing it: the cone is the light in the
// room, the plate is the hardware making it.
function drawThrustBoots(c, p) {
  if (typeof isHero === 'function' && isHero()) return;
  const im = MEDIA_IMG.bootsFire;
  if (!im || !im.naturalWidth) { if (typeof mediaFetch === 'function') mediaFetch('bootsFire'); return; }
  const dvx = p.dashVX || p.face * 900, dvy = p.dashVY || 0;
  const dn = Math.hypot(dvx, dvy) || 1;
  // the plate is authored pointing LEFT with its exhaust trailing right, so the
  // angle is taken from the dash direction and mirrored for a rightward dash —
  // never rotated a half turn, which would put the flames out in front of her
  const rightward = dvx >= 0;
  const ang = Math.atan2(dvy, dvx) + (rightward ? Math.PI : 0);
  const h = 26, w = h * (im.naturalWidth / im.naturalHeight);
  c.save();
  c.translate(p.x + p.w / 2, p.y + p.h - 8);
  c.rotate(ang);
  if (rightward) c.scale(-1, 1);
  // the boots sit slightly FORWARD of her centre — the feet lead a dash
  c.globalAlpha = 0.95;
  c.drawImage(im, -w * 0.26, -h / 2, w, h);
  c.restore();
}
// ---------------------------------------------------------------------------
// ROOM FURNITURE — placed set pieces that are scenery, not statics: nothing
// here can be interacted with, so it never enters G.statics (findNear would
// offer a prompt for it) and never costs a save flag. World coordinates,
// drawn with the statics so it sits in the same light.
//
// SERVO'S WINDING HOUSE (kingdom 1 protocol: every NPC has a place, or a
// reason). Old Servo built the gantries over the meadow — his own line — and
// his coil errand says why he stands at their foot: "I cannot climb any
// more." What was missing was the PLACE that sentence implies. This is it:
// the winch he raised the gantries with, drum and frame and sagging canvas,
// standing behind him with its cable still made off toward the climb. The
// drawing is a PROCEDURAL STAND-IN awaiting its fired plate (ART_QUEUE §2h),
// same law as drawBooth; nothing in it presents a right angle.
const ROOM_PROPS = { A1: [{ kind: 'winch', tx: 3, ty: 15 }] };
function drawWinchHouse(wx, gy) {
  c.save();
  // the back shell: a lean-to of scrap plate, tipped the way the booth tips
  c.fillStyle = '#101820';
  c.beginPath();
  c.moveTo(wx - 52, gy);
  c.lineTo(wx - 40, gy - 78);
  c.lineTo(wx + 46, gy - 88);
  c.lineTo(wx + 54, gy);
  c.closePath(); c.fill();
  // two tapered poles crossing at the head — an A-frame, not a doorway
  c.fillStyle = '#0b1119';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(wx + s * 44, gy);
    c.lineTo(wx + s * 8, gy - 96);
    c.lineTo(wx + s * 2, gy - 92);
    c.lineTo(wx + s * 36, gy);
    c.closePath(); c.fill();
  }
  // the sagging canvas thrown over the head, scallop-hemmed like the booth's
  c.fillStyle = '#1c2836';
  c.beginPath();
  c.moveTo(wx - 58, gy - 74);
  c.quadraticCurveTo(wx - 4, gy - 112, wx + 56, gy - 80);
  c.lineTo(wx + 50, gy - 62);
  for (let i = 3; i >= 0; i--) {
    const hx = wx - 50 + (i + 0.5) * 27;
    c.quadraticCurveTo(hx + 8, gy - 50, hx - 8, gy - 62);
  }
  c.closePath(); c.fill();
  // THE DRUM — the winding gear itself, hung slightly askew in the frame
  const dx = wx + 2, dy = gy - 44, dr = 20;
  const spin = Math.sin(performance.now() / 2600) * 0.2;   // it still turns, barely
  c.save();
  c.translate(dx, dy); c.rotate(0.12 + spin * 0.04);
  c.fillStyle = '#141e2a';
  c.beginPath(); c.arc(0, 0, dr, 0, 7); c.fill();
  c.strokeStyle = '#2a3a4c'; c.lineWidth = 3;
  c.beginPath(); c.arc(0, 0, dr - 3, 0, 7); c.stroke();
  c.strokeStyle = '#0b1119'; c.lineWidth = 2.4;
  for (let i = 0; i < 3; i++) {
    const a = spin + i / 3 * Math.PI;
    c.beginPath(); c.moveTo(Math.cos(a) * (dr - 4), Math.sin(a) * (dr - 4));
    c.lineTo(-Math.cos(a) * (dr - 4), -Math.sin(a) * (dr - 4)); c.stroke();
  }
  c.restore();
  // the cable: off the drum, up and away toward the gantry climb, sagging
  // under its own weight and fading before it can claim a destination
  const cg = c.createLinearGradient(dx, dy, dx + 250, dy - 170);
  cg.addColorStop(0, 'rgba(90,110,132,0.8)'); cg.addColorStop(1, 'rgba(90,110,132,0)');
  c.strokeStyle = cg; c.lineWidth = 2;
  c.beginPath();
  c.moveTo(dx + dr - 3, dy - 6);
  c.quadraticCurveTo(dx + 120, dy - 30, dx + 250, dy - 170);
  c.stroke();
  // a coil of spare line and a one-legged stool at the base: somebody WORKS here
  c.strokeStyle = '#232a35'; c.lineWidth = 3;
  c.beginPath(); c.arc(wx - 30, gy - 7, 7, 0.3, 5.6); c.stroke();
  c.beginPath(); c.arc(wx - 30, gy - 7, 4, 0.6, 5.2); c.stroke();
  c.fillStyle = '#141e2a';
  c.beginPath();
  c.moveTo(wx + 30, gy - 14); c.quadraticCurveTo(wx + 40, gy - 17, wx + 46, gy - 12);
  c.lineTo(wx + 42, gy); c.lineTo(wx + 36, gy);
  c.closePath(); c.fill();
  // one small work lamp hung off the frame, warm and tired
  const lx = wx - 14, ly = gy - 84;
  c.fillStyle = '#0d141d';
  c.beginPath(); c.arc(lx, ly, 5, 0, 7); c.fill();
  c.save(); c.globalCompositeOperation = 'lighter';
  const lg = c.createRadialGradient(lx, ly + 3, 1, lx, ly + 3, 26);
  lg.addColorStop(0, 'rgba(255,214,120,0.30)'); lg.addColorStop(1, 'rgba(255,190,100,0)');
  c.fillStyle = lg; c.beginPath(); c.arc(lx, ly + 3, 26, 0, 7); c.fill();
  c.restore();
  c.restore();
}
function drawStatics(P) {
  for (const pr of (ROOM_PROPS[G.roomId] || []))
    if (pr.kind === 'winch') drawWinchHouse(pr.tx * TILE + 16, pr.ty * TILE);
  for (const s of G.statics) {
    const bob = Math.sin(performance.now() / 500 + s.t) * 3;
    if (s.type === 'bench' && typeof isHero === 'function' && isHero()) {
      // FOUNTAIN OF LIFE (hero world) — a marble spring of glowing elixir
      const mx = s.x + s.w / 2, now = performance.now();
      const charging = G.recharge && Math.abs(G.recharge.x - mx) < 44;
      const by = s.y + 20;              // basin water line
      // stepped stone base
      c.fillStyle = '#b7ad95'; rr(c, s.x - 8, s.y + s.h - 12, s.w + 16, 12, 4); c.fill();
      c.fillStyle = '#cabfa6'; rr(c, s.x - 3, s.y + s.h - 20, s.w + 6, 9, 3); c.fill();
      // central pedestal with a soft vertical marble gradient
      const pg = c.createLinearGradient(mx, by, mx, s.y + s.h);
      pg.addColorStop(0, '#e6ddc8'); pg.addColorStop(1, '#9c927a');
      c.fillStyle = pg; rr(c, mx - 8, by, 16, s.h - 22, 3); c.fill();
      // basin bowl (stone rim)
      c.fillStyle = '#d8cfba'; c.beginPath(); c.ellipse(mx, by, s.w / 2, 11, 0, 0, 7); c.fill();
      c.fillStyle = '#b0a68e'; c.beginPath(); c.ellipse(mx, by, s.w / 2 - 3, 8, 0, 0, 7); c.fill();
      // glowing elixir water surface (gold→turquoise), animated shimmer
      c.save(); c.globalCompositeOperation = 'lighter';
      const wg = c.createRadialGradient(mx, by, 2, mx, by, s.w / 2);
      wg.addColorStop(0, charging ? '#fff3c0' : '#ffe08a');
      wg.addColorStop(0.6, '#7fd4c8'); wg.addColorStop(1, 'rgba(120,200,180,0)');
      c.globalAlpha = charging ? 0.9 : 0.7; c.fillStyle = wg;
      c.beginPath(); c.ellipse(mx, by, s.w / 2 - 4, 7, 0, 0, 7); c.fill();
      // concentric ripples
      c.strokeStyle = '#ffe8a0'; c.lineWidth = 1;
      for (let r = 0; r < 3; r++) {
        const rp = ((now / 900 + r / 3) % 1);
        c.globalAlpha = (1 - rp) * (charging ? 0.6 : 0.35);
        c.beginPath(); c.ellipse(mx, by, (s.w / 2 - 6) * rp + 3, (5) * rp + 2, 0, 0, 7); c.stroke();
      }
      c.restore(); c.globalAlpha = 1;
      // rising spring jet of light from the centre
      const jh = charging ? 22 : 12 + Math.sin(now / 260 + s.t) * 3;
      c.save(); c.globalCompositeOperation = 'lighter';
      const jg = c.createLinearGradient(mx, by, mx, by - jh - 6);
      jg.addColorStop(0, charging ? 'rgba(255,240,180,0.9)' : 'rgba(255,224,138,0.6)');
      jg.addColorStop(1, 'rgba(127,212,200,0)');
      c.fillStyle = jg;
      c.beginPath(); c.moveTo(mx - 3, by); c.quadraticCurveTo(mx - 1, by - jh, mx, by - jh - 6);
      c.quadraticCurveTo(mx + 1, by - jh, mx + 3, by); c.closePath(); c.fill();
      c.restore();
      // ambient golden motes drifting up
      if (chance(charging ? 0.5 : 0.12)) addPart(mx + rnd(-s.w / 2, s.w / 2), by + rnd(-4, 2), rnd(-8, 8), rnd(-45, -18), 0.7, chance(0.5) ? '#ffe08a' : '#7fd4c8', 2, -30, true);
    } else if (s.type === 'bench') {
      // recharge pod — a standing charge capsule the robot steps INTO (back half here)
      const mx = s.x + s.w / 2;
      const pu = 0.5 + Math.sin(performance.now() / 600 + s.t) * 0.3;
      const charging = G.recharge && Math.abs(G.recharge.x - mx) < 44;
      // THE POD IS AUTHORED NOW, and it is the size the thing deserves to be.
      //
      // The save point is where a run gets its breath back — it is the one
      // object in the world the player is HAPPY to see — and it was thirty
      // pixels of procedural tube. It is a rendered machine: a horseshoe
      // cradle on anti-vibration feet with a beacon mast, servicing arms and
      // pressure tanks, standing three times her height. Two plates, dormant
      // and awake, so stepping into it is a state change rather than a tint.
      //
      // The procedural pod stays UNDERNEATH as the fallback: the plate is
      // lazy-loaded, and a save point that is invisible for the half second
      // before its art arrives is the one object that must never be missable.
      {
        const key = charging ? 'podOn' : 'pod';
        if (typeof mediaFetch === 'function') { mediaFetch('pod'); mediaFetch('podOn'); }
        const im = MEDIA_IMG[key];
        if (im && im.naturalWidth) {
          // stood on the floor line and scaled off the room's tile grid rather
          // than off `s.h` — the static's box is the INTERACTION volume, and
          // the machine is deliberately much bigger than the thing you touch
          const H = TILE * 4.2, W = H * (im.naturalWidth / im.naturalHeight);
          const fy = s.y + s.h;
          c.save();
          // a slow breath while it idles, a brighter steadier one while it works
          c.globalAlpha = charging ? 1 : 0.94;
          // THE POD FACES THE PERSON IT BELONGS WITH (owner: "make the pod
          // facing the NPC instead of the other side"): if the room has an
          // npc, the cradle opens toward them
          const npcS = G.statics.find(q => q.type === 'npc');
          const pfd = npcS && npcS.x + npcS.w / 2 < mx ? -1 : 1;
          c.save(); c.translate(mx, 0); c.scale(pfd, 1);
          c.drawImage(im, -W / 2, fy - H, W, H);
          c.restore();
          if (charging) {
            // it is doing something to her, so it throws light into the room
            c.globalCompositeOperation = 'lighter';
            c.globalAlpha = 0.18 + pu * 0.12;
            const g4 = c.createRadialGradient(mx, fy - H * 0.45, 6, mx, fy - H * 0.45, W * 0.75);
            g4.addColorStop(0, '#ffe6b8'); g4.addColorStop(1, 'rgba(255,214,120,0)');
            c.fillStyle = g4;
            c.beginPath(); c.arc(mx, fy - H * 0.45, W * 0.75, 0, 7); c.fill();
          }
          c.restore();
          // motes rising out of the cradle, so it is never a still picture
          if (chance(charging ? 0.55 : 0.10))
            addPart(mx + rnd(-14, 14), fy - rnd(8, H * 0.5), rnd(-6, 6), rnd(-40, -14),
              0.8, charging ? '#ffe6b8' : '#8cf6ff', 2, -26, true);
          continue;
        }
      }
      const tubeY = s.y + 6, tubeH = s.h - 16;
      // base pad
      c.fillStyle = '#2c3542'; rr(c, s.x - 6, s.y + s.h - 8, s.w + 12, 9, 3); c.fill();
      c.fillStyle = '#3a4655'; rr(c, s.x - 1, s.y + s.h - 14, s.w + 2, 8, 2); c.fill();
      // lit interior tube (robot stands against this)
      const ig = c.createLinearGradient(mx, tubeY, mx, tubeY + tubeH);
      ig.addColorStop(0, 'rgba(140,246,255,' + (charging ? 0.42 : 0.16 * pu + 0.05) + ')');
      ig.addColorStop(1, 'rgba(70,160,200,' + (charging ? 0.26 : 0.05) + ')');
      c.fillStyle = ig; rr(c, mx - 17, tubeY, 34, tubeH, 12); c.fill();
      // side rails
      c.fillStyle = '#3d4c5e'; rr(c, s.x, s.y + 4, 5, s.h - 12, 2); c.fill();
      rr(c, s.x + s.w - 5, s.y + 4, 5, s.h - 12, 2); c.fill();
      // top emitter cap + coil
      c.fillStyle = '#4d5c70'; rr(c, mx - 15, s.y - 4, 30, 12, 4); c.fill();
      c.strokeStyle = '#5a6d84'; c.lineWidth = 2;
      c.beginPath(); c.arc(mx, s.y + 2, 9, Math.PI, Math.PI * 2); c.stroke();
      c.fillStyle = charging ? '#ffffff' : '#8ff6ff'; c.shadowColor = '#8ff6ff'; c.shadowBlur = charging ? 18 : 8;
      c.fillRect(mx - 4, s.y - 1, 8, 5); c.shadowBlur = 0;
      // cable spools coiled on the rails (idle) — reach out when charging (drawn later)
      c.strokeStyle = '#232a35'; c.lineWidth = 2.4;
      c.beginPath(); c.arc(s.x + 2, s.y + s.h - 18, 4, 0, 7); c.stroke();
      c.beginPath(); c.arc(s.x + s.w - 2, s.y + s.h - 18, 4, 0, 7); c.stroke();
      if (chance(charging ? 0.4 : 0.04)) addPart(mx + rnd(-15, 15), s.y + rnd(6, 34), rnd(-20, 20), rnd(-35, 5), 0.25, '#8ff6ff', 2, 0, true);
    } else if (s.type === 'chest') {
      c.fillStyle = '#4a3b22'; rr(c, s.x, s.y + 8, s.w, s.h - 8, 4); c.fill();
      c.fillStyle = s.opened ? '#2c2417' : '#6b5630';
      rr(c, s.x, s.y + (s.opened ? 2 : 4), s.w, 9, 4); c.fill();
      if (!s.opened) {
        c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 10 + bob * 2;
        c.fillRect(s.x + s.w / 2 - 3, s.y + 10, 6, 7); c.shadowBlur = 0;
      }
    } else if (s.type === 'mod') {
      c.save(); c.translate(s.x + 12, s.y + 12 + bob);
      c.rotate(performance.now() / 900);
      c.fillStyle = P.glow; c.shadowColor = P.glow; c.shadowBlur = 16;
      c.fillRect(-9, -9, 18, 18);
      c.fillStyle = '#0a1420'; c.fillRect(-4, -4, 8, 8);
      c.restore(); c.shadowBlur = 0;
    } else if (s.type === 'item') {
      // AN ERRAND'S OBJECT. It turns, it is lit from inside, and it is gold —
      // the colour this game already reserves for something you get to keep.
      const pu2 = 0.5 + Math.sin(performance.now() / 420 + s.x) * 0.5;
      c.save(); c.translate(s.x + 13, s.y + 13 + bob);
      c.globalCompositeOperation = 'lighter';
      const gq = c.createRadialGradient(0, 0, 1, 0, 0, 26);
      gq.addColorStop(0, 'rgba(255,215,106,' + (0.18 + pu2 * 0.16).toFixed(2) + ')');
      gq.addColorStop(1, 'rgba(255,215,106,0)');
      c.fillStyle = gq; c.beginPath(); c.arc(0, 0, 26, 0, 7); c.fill();
      c.globalCompositeOperation = 'source-over';
      c.rotate(performance.now() / 1100);
      c.fillStyle = '#ffd76a'; c.strokeStyle = '#fff3c8'; c.lineWidth = 1.4;
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2, r2 = i % 2 ? 5 : 9;
        i ? c.lineTo(Math.cos(a) * r2, Math.sin(a) * r2) : c.moveTo(r2, 0);
      }
      c.closePath(); c.fill(); c.stroke();
      c.restore();
    } else if (s.type === 'riddle') {
      const pu = 0.5 + Math.sin(performance.now() / 500 + s.t) * 0.35;
      // THE MIND NODE IS AN OBELISK. The fired plate (mindnode_obelisk.png) was
      // keyed in media.js and drawn by nothing, so a puzzle the game asks the
      // player to seek out looked like a parking meter — 26x36, the same box as
      // a wall terminal. It stands several times her height now, which is what
      // makes it a LANDMARK: something you see across a room and walk toward,
      // rather than furniture you notice when you bump into it.
      //
      // The interact box is unchanged on purpose. The prompt belongs at its
      // FOOT, where she stands, not floating at the top of a monolith.
      const mn = MEDIA_IMG.mindNode;
      if (mn && mn.naturalWidth) {
        const oh = 168, ow = oh * (mn.naturalWidth / mn.naturalHeight);
        const ox = s.x + s.w / 2 - ow / 2, oy = s.y + s.h - oh;
        if (!s.opened) {
          // the light it works by, thrown on the ground before the stone
          c.save(); c.globalCompositeOperation = 'lighter';
          const og = c.createRadialGradient(s.x + s.w / 2, s.y + s.h - 8, 4,
                                            s.x + s.w / 2, s.y + s.h - 8, ow * 0.85);
          og.addColorStop(0, 'rgba(180,140,255,' + (0.10 + pu * 0.10).toFixed(3) + ')');
          og.addColorStop(1, 'rgba(180,140,255,0)');
          c.fillStyle = og;
          c.beginPath(); c.ellipse(s.x + s.w / 2, s.y + s.h - 8, ow * 0.85, oh * 0.34, 0, 0, 7); c.fill();
          c.restore();
        }
        // solved, it stops calling: the violet drains out and it stands quiet
        if (s.opened) { c.save(); if (typeof c.filter === 'string') c.filter = 'grayscale(0.7) brightness(0.72)'; }
        c.drawImage(mn, ox, oy, ow, oh);
        if (s.opened) c.restore();
        if (s.opened) ftxt('✓', s.x + s.w / 2, s.y + s.h - 20, 13, '#7de8a0');
        else if (chance(0.06)) addPart(s.x + s.w / 2 + rnd(-ow * 0.3, ow * 0.3),
          s.y + s.h - rnd(6, oh * 0.8), rnd(-12, 12), rnd(-34, -6), 0.4, '#b48cff', 2, 0, true);
      } else {
      c.fillStyle = '#2c3542'; c.fillRect(s.x + 8, s.y + 26, 10, 10);
      c.fillStyle = '#232a35'; rr(c, s.x, s.y, s.w, 26, 6); c.fill();
      c.strokeStyle = s.opened ? 'rgba(125,232,160,0.8)' : '#b48cff';
      if (!s.opened) { c.shadowColor = '#b48cff'; c.shadowBlur = 8 + pu * 9; }
      c.lineWidth = 2;
      c.beginPath(); c.arc(s.x + 13, s.y + 13, 8, 0, 7); c.stroke();
      c.beginPath(); c.moveTo(s.x + 9, s.y + 13); c.quadraticCurveTo(s.x + 13, s.y + 7, s.x + 17, s.y + 13); c.stroke();
      c.shadowBlur = 0;
      if (s.opened) ftxt('✓', s.x + 13, s.y + 14, 11, '#7de8a0');
      else if (chance(0.05)) addPart(s.x + 13 + rnd(-8, 8), s.y + rnd(2, 20), rnd(-15, 15), rnd(-30, 0), 0.3, '#b48cff', 2, 0, true);
      }
    } else if (s.type === 'vault') {
      const have = ['sigil1', 'sigil2', 'sigil3'].filter(id => relicHas(id)).length;
      const open = !!G.save.flags.vaultOpen;
      c.fillStyle = '#232a35'; rr(c, s.x - 4, s.y - 4, s.w + 8, s.h + 6, 6); c.fill();
      c.fillStyle = open ? '#101820' : '#39424f';
      rr(c, s.x, s.y, s.w, s.h, 5); c.fill();
      c.strokeStyle = '#5c6678'; c.lineWidth = 2;
      rr(c, s.x, s.y, s.w, s.h, 5); c.stroke();
      if (!open) {
        c.beginPath(); c.moveTo(s.x, s.y + 17); c.lineTo(s.x + s.w, s.y + 17);
        c.moveTo(s.x, s.y + 35); c.lineTo(s.x + s.w, s.y + 35); c.stroke();
      }
      for (let i = 0; i < 3; i++) {
        const lit = open || i < have;
        c.fillStyle = lit ? '#ffd76a' : '#1a212b';
        if (lit) { c.shadowColor = '#ffd76a'; c.shadowBlur = 9; }
        c.beginPath(); c.arc(s.x + s.w / 2, s.y + 10 + i * 16, 4.5, 0, 7); c.fill();
        c.shadowBlur = 0;
      }
    } else if (s.type === 'trial') {
      const pu = 0.5 + Math.sin(performance.now() / 550 + s.t) * 0.35;
      c.fillStyle = '#232a35'; c.fillRect(s.x + 11, s.y + 30, 12, 14);
      c.fillStyle = '#2c3542'; rr(c, s.x, s.y, s.w, 32, 6); c.fill();
      c.strokeStyle = '#b48cff'; c.lineWidth = 2;
      c.shadowColor = '#b48cff'; c.shadowBlur = 6 + pu * 10;
      rr(c, s.x + 4, s.y + 4, s.w - 8, 24, 4); c.stroke();
      c.beginPath(); c.arc(s.x + 17, s.y + 16, 7, 0, 7); c.stroke();
      c.beginPath(); c.moveTo(s.x + 13, s.y + 16); c.quadraticCurveTo(s.x + 17, s.y + 10, s.x + 21, s.y + 16); c.stroke();
      c.shadowBlur = 0;
    } else if (s.type === 'term') {
      c.fillStyle = '#232a35'; c.fillRect(s.x + 9, s.y + 20, 8, 12);
      c.fillStyle = '#2c3542'; rr(c, s.x, s.y, s.w, 20, 3); c.fill();
      c.fillStyle = P.glow; c.globalAlpha = 0.7;
      for (let k = 0; k < 3; k++) c.fillRect(s.x + 4, s.y + 4 + k * 5, s.w - 8 - k * 5, 2);
      c.globalAlpha = 1;
    } else if (s.type === 'pillar') {
      // THE PILLAR — pure crystal, shining at the end of the dark cave. The
      // authored plate (§2c): three white spears out of a jagged eroded rock
      // clump, lit from inside. Until it arrives, the procedural light spears
      // below draw the same landmark. The breathing halo rides both versions:
      // the plate is a still, and the pulse is what makes it alive.
      const pu = 0.5 + Math.sin(performance.now() / 700 + s.t) * 0.5;
      if (typeof drawPlateAnchored === 'function' &&
          drawPlateAnchored(c, 'pillarPlate', s.x + s.w / 2, s.y + s.h, s.h * 1.18, false)) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const hg = c.createRadialGradient(s.x + s.w / 2, s.y + s.h * 0.45, 6,
                                          s.x + s.w / 2, s.y + s.h * 0.45, s.h * 0.9);
        hg.addColorStop(0, 'rgba(220,240,255,' + (0.16 + pu * 0.12) + ')');
        hg.addColorStop(1, 'rgba(220,240,255,0)');
        c.fillStyle = hg;
        c.fillRect(s.x - s.h, s.y - s.h * 0.4, s.w + s.h * 2, s.h * 1.6);
        c.restore();
        if (chance(0.12)) addPart(s.x + rnd(0, s.w), s.y + rnd(0, s.h * 0.7),
          rnd(-8, 8), rnd(-26, -6), 0.6, '#dff2ff', 1.7, -30, true);
        continue;
      }
      c.fillStyle = '#1a222c';
      c.beginPath();
      c.moveTo(s.x - 6, s.y + s.h); c.lineTo(s.x + 4, s.y + s.h - 14);
      c.lineTo(s.x + s.w - 4, s.y + s.h - 14); c.lineTo(s.x + s.w + 6, s.y + s.h);
      c.closePath(); c.fill();
      c.save();
      c.globalCompositeOperation = 'lighter';
      const spears = [[0.5, 1.0, 0], [0.24, 0.62, 0.4], [0.78, 0.7, 0.9]];
      for (const [fx2, fh, ph] of spears) {
        const bx = s.x + s.w * fx2, tipY = s.y + s.h * (1 - fh);
        const g3 = c.createLinearGradient(bx, s.y + s.h, bx, tipY);
        g3.addColorStop(0, 'rgba(150,200,255,0.12)');
        g3.addColorStop(0.65, 'rgba(220,240,255,' + (0.5 + pu * 0.25) + ')');
        g3.addColorStop(1, 'rgba(255,255,255,' + (0.85 + pu * 0.15) + ')');
        c.fillStyle = g3;
        c.shadowColor = '#cfe8ff'; c.shadowBlur = 14 + pu * 10 + Math.sin(ph * 7) * 2;
        const hw = 7 * fh + 3;
        c.beginPath();
        c.moveTo(bx - hw, s.y + s.h - 12);
        c.lineTo(bx - hw * 0.35, tipY + 6); c.lineTo(bx, tipY);
        c.lineTo(bx + hw * 0.35, tipY + 6); c.lineTo(bx + hw, s.y + s.h - 12);
        c.closePath(); c.fill();
      }
      c.shadowBlur = 0;
      c.restore();
      if (chance(0.12)) addPart(s.x + rnd(0, s.w), s.y + rnd(0, s.h * 0.7),
        rnd(-8, 8), rnd(-26, -6), 0.6, '#dff2ff', 1.7, -30, true);
    } else if (s.type === 'secret') {
      const d = player ? Math.hypot(player.x - s.x, player.y - s.y) : 999;
      if (chance(0.08)) addPart(s.x + rnd(0, 24), s.y + rnd(0, 24), rnd(-10, 10), rnd(-30, -5), 0.5, '#ffd76a', 1.8, -20, true);
      if (d < 170) {
        c.globalAlpha = clamp(1 - d / 170, 0, 0.7);
        c.shadowColor = '#ffd76a'; c.shadowBlur = 12;
        c.fillStyle = '#ffd76a';
        c.beginPath(); c.arc(s.x + 12, s.y + 12, 3 + Math.sin(performance.now() / 300 + s.t) * 1.5, 0, 7); c.fill();
        c.shadowBlur = 0; c.globalAlpha = 1;
      }
    } else if (s.type === 'npc') {
      const talking = G.state === 'DIALOG' && G.dialog && G.dialog.npc === s.extra;
      // A DARK UNIT DOES NOT BREATHE. No bob, no ambient sparks, no turn to
      // face her — it is a body standing where it was standing when the power
      // went. The read has to be instant from across a room, or the player
      // walks past six of them wondering why nobody talks.
      const live = npcLive(s);
      const bob2 = live ? (talking ? bob * 1.9 : bob) : 0;
      // THE RESTING PLATE (§2g): in his den, dark Ratchet is not the standing
      // turnaround grayed out — he is his authored powered-down body, slumped,
      // eye-lights out, the chest crystal the only light in the picture. The
      // plate IS the dark read, so it must not go through the grayscale below:
      // that filter would kill the one glow the image is about.
      let plateDrew = false;
      if (!live && npcKey(s) === 'A0B|ratchet') {
        if (typeof mediaFetch === 'function') mediaFetch('ratchetResting');
        const rIm = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.ratchetResting;
        if (rIm && rIm.naturalWidth) {
          // 2.6×: the owner's ruling in the den — 'the npc is too small, it
          // should be double my size' — and she reads ~2x the npc hitbox, so
          // the resting body needs ~2.6 hitbox-heights to stand double her
          const dh = s.h * 2.6, dw = dh * (rIm.naturalWidth / rIm.naturalHeight);
          c.drawImage(rIm, s.x + s.w / 2 - dw / 2, s.y + s.h - dh, dw, dh);
          plateDrew = true;
        }
      }
      const dimmed = !live && !plateDrew;
      if (dimmed) {
        c.save();
        // A DEAD MACHINE IS DARK, NOT TRANSPARENT — and it is still a MACHINE
        // YOU CAN SEE. The first version of this dropped globalAlpha to about a
        // third and let the room show through the body: a ghost. It was
        // replaced by grayscale(1) brightness(0.5), which fixed the
        // transparency and then produced the same complaint again — "why don't
        // I see any feature of the NPC, it's like a ghost" — because it is a
        // LUMINANCE ghost instead of an alpha one.
        //
        // Measured, on the sheet these NPCs actually draw from: the art enters
        // this filter at mid 115 / white 180 / saturation 0.30 and leaves at
        // mid 57 / white 90 / saturation 0.00, against a den backdrop whose own
        // luminance is about 17. Halving the brightness of art whose white
        // point is already 180 leaves no highlight for a form to read by, and
        // grayscale(1) removes the only thing separating warm bronze from a
        // cold wall. Forty levels of flat grey over the room is a smudge.
        //
        // So: still dark, still desaturated — powered down has to LOOK powered
        // down — but the contrast is pushed back up so the plates, pipes, lamp
        // and helmet survive. This lands at mid 90 / white 178 / saturation
        // 0.10 — and then the whole NPC grade was lifted under it (atlas.js,
        // 0.68 -> 0.45) because the owner's next word on a phone was "all so
        // dark", which was true of the CHARGED unit as well. It now lands at
        // mid 118 against a charged 150: a third brighter than it was, still a
        // clear thirty levels below awake, and still drained of colour. The
        // read is deliberately close to that of ratchet_resting.png,
        // the authored powered-down plate in the den: that art is the game's
        // own answer to "what does a dark machine look like", and it keeps deep
        // blacks AND real highlights rather than crushing everything to middle
        // grey. The lit eyes and the warm chest lamp are drawn separately below
        // and remain the signal that says charged; colour and light level say
        // the rest.
        c.filter = NPC_DARK_FILTER;
        if (typeof c.filter !== 'string') c.globalAlpha = 0.88;  // old Safari: dim, never ghost
      }
      // THE TURN. Below, an NPC faces the cat by being MIRRORED — which flips
      // its lit side onto its shadow side and re-flattens it into a picture the
      // instant it turns. The machine folk are rendered now, so they turn the
      // way everything else in this game turns: by selecting an authored angle
      // off a turntable lit from a fixed point in the world. Drawn out here in
      // world space, before the mirroring transform that it exists to replace.
      // THE EYE MUST FIND HIM FIRST (owner: "NPC is faded — not visible at
      // all"). A live machine-person is rusty bronze standing against
      // furniture the same colour in the darkest rooms in the game, so before
      // the body draws, a warm work-light halo goes on BEHIND it: the centre
      // is covered by the sprite, and what survives is a lit rim that cuts
      // the silhouette free of the backdrop.
      if (live) {
        const AK = typeof atlasOf === 'function' && atlasOf(s.extra);
        const kk = (AK && AK.sub[s.extra] && AK.sub[s.extra].k) || 1.4;
        const bh = s.h * kk;
        const hx = s.x + s.w / 2, hcy = s.y + s.h - bh * 0.5;
        // VALUE SEPARATION FIRST, THEN THE RIM. A warm halo alone cannot free
        // a silhouette that matches its backdrop in VALUE, and the Tinker is
        // bronze standing against a bronze wall at the same brightness. A soft
        // dark disc knocks the wall behind him down a step; the warm halo then
        // lights his edge against that dark instead of against his own colour.
        // Squint at the den now and he survives it.
        const dg = c.createRadialGradient(hx, hcy, 4, hx, hcy, bh * 0.95);
        dg.addColorStop(0, 'rgba(4,6,10,0.40)');
        dg.addColorStop(0.7, 'rgba(4,6,10,0.22)');
        dg.addColorStop(1, 'rgba(4,6,10,0)');
        c.fillStyle = dg;
        c.beginPath(); c.arc(hx, hcy, bh * 0.95, 0, 7); c.fill();
        const hg = c.createRadialGradient(hx, hcy, 4, hx, hcy, bh * 0.8);
        hg.addColorStop(0, 'rgba(255,216,150,0.34)');
        hg.addColorStop(0.6, 'rgba(255,200,120,0.14)');
        hg.addColorStop(1, 'rgba(255,200,120,0)');
        c.fillStyle = hg;
        c.beginPath(); c.arc(hx, hcy, bh * 0.8, 0, 7); c.fill();
      }
      // GROUNDED, NOT STICKERED. The cat, every walking enemy and every boss
      // already cast a contact shadow; the standing NPCs were the one class
      // that did not, which is why they read as cut-outs pasted in front of a
      // painted floor rather than people standing on it. Same helper, so they
      // are lit by the same rule. The Oracle hangs from its cables and has no
      // feet to stand on, so it gets none — the same exception `grounded`
      // already makes for it two lines down.
      if (s.extra !== 'mono' && typeof contactShadow === 'function'
          && !(typeof G !== 'undefined' && G.artProbe)) {
        contactShadow(c, s.x + s.w / 2, s.y + s.h, s.w * 0.72, 0.34);
      }
      // the woken tinker is AT WORK (owner: "start working on the table") —
      // in his den he faces his bench on the right, and only turns from it
      // when she actually talks to him. Every other NPC faces the cat.
      const atBench = live && npcKey(s) === 'A0B|ratchet' && !talking;
      const fdir = atBench ? 1 : ((player && player.x + 12 < s.x) ? -1 : 1);
      // THE TINKER IS A PLATE SET, NOT A ROW. drawTinker owns his poses, his
      // tic and his vent (see the block above npcKey); it returns false until
      // the plates land and the atlas covers those frames as it always did.
      // It replaces the atlas EVERYWHERE he is awake, not only in his den:
      // his row on npc_6yaw is the one the keyer punched 45.6% of the body
      // out of, so the booth was showing the room through his chest.
      // THE JOB, for everyone the tinker's renderer does not own — see NPC_JOB.
      // It runs only while she is not standing over them and not talking, and
      // it drives the turntable ANGLE, which is the one piece of vocabulary
      // these bodies have that nothing was using.
      const npcBusy = live && !talking && !nearNpc(s);
      const jobCol = npcBusy ? npcJobCol(s, npcDt(s)) : (s._job = null, null);
      // A WORK BEAT IS THE STRIP. Twelve frames of this machine doing its own
      // job beat any angle of it standing still, so when the beat says work and
      // the strip has landed, that is what draws; the turntable covers every
      // other beat and every frame before the art arrives.
      let stripDrew = false;
      if (npcBusy && s._job && s._job.work && !(typeof isHero === 'function' && isHero())) {
        const A = typeof atlasOf === 'function' && atlasOf(s.extra);
        const kk = (A && A.sub[s.extra] && A.sub[s.extra].k) || 1.4;
        stripDrew = drawStripCell(c, NPC_LOOP[s.extra],
                                  Math.floor(s._job.ph || 0), 12,
                                  s.x + s.w / 2, s.y + s.h + bob2 * 0.4, s.h * kk,
                                  fdir < 0);
        if (stripDrew) G.npcFrame = s.extra + ':' + (((Math.floor(s._job.ph || 0) % 12) + 12) % 12);
      }
      const sheetDrew = plateDrew || stripDrew ||
        (live && s.extra === 'ratchet' && drawTinker(c, s, talking)) ||
        (!(typeof isHero === 'function' && isHero()) &&
        drawAtlas(c, s.extra, fdir,
                  s.x + s.w / 2, s.y + s.h + bob2 * 0.4, s.h, {
          t: performance.now() / 1000 + (s.t || 0) * 1.7,
          // the Oracle hangs from its cables and has no feet to stand on
          mode: s.extra === 'mono' ? 'sway' : 'breathe',
          grounded: s.extra !== 'mono',
          col: jobCol,
        }));
      c.save(); c.translate(s.x + s.w / 2, s.y + s.h + bob2 * 0.4);
      if (fdir < 0) c.scale(-1, 1);  // face the cat (or the bench — see fdir)
      if (talking) {
        const tp = 0.5 + Math.sin(performance.now() / 140) * 0.5;
        c.save(); c.scale(player && player.x + 12 < s.x ? -1 : 1, 1);
        ftxt('…', 0, -s.h - 14, 15, 'rgba(230,245,255,' + (0.4 + tp * 0.5) + ')');
        c.restore();
      }
      const id = s.extra;
      // ambient character motion
      if (id === 'servo' && chance(0.015)) addPart(s.x + s.w / 2 + 6, s.y + 2, rnd(-5, 5), rnd(-40, -20), 0.7, 'rgba(200,200,200,0.5)', 3, -30);
      if (id === 'ratchet' && chance(0.012)) addPart(s.x + s.w / 2 - 14, s.y + 14, rnd(-10, 10), rnd(-60, -30), 0.5, '#ffd76a', 2, 300, true);
      if (id === 'mono' && chance(0.05)) addPart(s.x + s.w / 2 + rnd(-8, 8), s.y + s.h - 4, 0, rnd(-45, -25), 0.6, '#57a8ff', 1.6, 0, true);
      if (id === 'sage' && chance(0.03)) addPart(s.x + s.w / 2 + rnd(-16, 16), s.y + rnd(0, 20), rnd(-8, 8), rnd(-14, -4), 0.9, '#9fe8ff', 1.6, 0, true);
      if (id === 'patch' && chance(0.05)) addPart(s.x + s.w / 2 + rnd(-6, 10), s.y + s.h - 8, rnd(-40, 40), rnd(-70, -20), 0.3, '#ffd08a', 2, 500, true);
      if (id === 'lumen' && chance(0.06)) addPart(s.x + s.w / 2, s.y + 12, rnd(-14, 14), rnd(-20, -6), 0.7, '#7dff9a', 1.8, -18, true);
      if (typeof isHero === 'function' && isHero() && drawHeroNPC(c, id, s)) {
        // the Odyssey has its own people — robed, human, Greek. The machine
        // folk below belong to the Depths and stay there.
      } else if (!sheetDrew) {
        // the hand-drawn originals, still here and still correct: they are what
        // the game shows while the sheet is loading, and on anything that
        // cannot decode it at all
        drawNPCBody(c, id, performance.now() / 1000 + (s.t || 0) * 1.7, talking);
      }
      c.restore();
      if (!live) {
        if (dimmed) {
          c.restore();                     // close the grayscale save
          c.filter = 'none';
          // THE DYING STATUS LAMP. It used to BE the body's alpha pulsing —
          // which is what made the whole machine read as a ghost. Now the body
          // stays solid and the lamp is a small amber ember at the chest,
          // breathing slowly, drawn additively over the dark.
          const lampK = 0.5 + 0.5 * Math.sin(performance.now() / 900 + (s.t || 0));
          const lampX = s.x + s.w / 2, lampY = s.y + s.h * 0.42;
          c.save(); c.globalCompositeOperation = 'lighter';
          const lampG = c.createRadialGradient(lampX, lampY, 0, lampX, lampY, 10);
          lampG.addColorStop(0, 'rgba(255,200,100,' + (0.28 + lampK * 0.24).toFixed(3) + ')');
          lampG.addColorStop(1, 'rgba(255,180,60,0)');
          c.fillStyle = lampG; c.beginPath(); c.arc(lampX, lampY, 10, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,230,170,' + (0.45 + lampK * 0.35).toFixed(3) + ')';
          c.beginPath(); c.arc(lampX, lampY, 1.7, 0, 7); c.fill();
          c.restore();
        }
        // and the prompt that this one can be fixed — an amber pip over the
        // head, only while she actually has a cell to spend. Without the
        // condition it is a quest marker; with it, it is an answer.
        if (invCount('batt') > 0) {
          // the owner walked straight past this at 15px. A dark unit she can
          // fix is the most important thing in the room: the pip is a BEACON
          // now — a light shaft up from the body, a breathing ring around it,
          // and the bolt riding the top. Still conditional on the cell, so it
          // stays an answer and never becomes a quest marker.
          const px = s.x + s.w / 2, py = s.y - 18 + Math.sin(performance.now() / 320) * 3;
          const pu2 = 0.5 + Math.sin(performance.now() / 300) * 0.5;
          c.save(); c.globalCompositeOperation = 'lighter';
          const shaft = c.createLinearGradient(0, s.y - 60, 0, s.y + s.h);
          shaft.addColorStop(0, 'rgba(255,210,110,0)');
          shaft.addColorStop(0.55, 'rgba(255,214,120,' + (0.10 + pu2 * 0.08) + ')');
          shaft.addColorStop(1, 'rgba(255,214,120,0)');
          c.fillStyle = shaft;
          c.fillRect(px - s.w * 0.7, s.y - 60, s.w * 1.4, s.h + 60);
          c.strokeStyle = 'rgba(255,214,120,' + (0.25 + pu2 * 0.35) + ')';
          c.lineWidth = 2;
          c.beginPath(); c.ellipse(px, s.y + s.h, s.w * 0.9 + pu2 * 6, 7, 0, 0, 7); c.stroke();
          const gg = c.createRadialGradient(px, py, 0, px, py, 24);
          gg.addColorStop(0, 'rgba(255,236,168,0.95)');
          gg.addColorStop(1, 'rgba(255,180,60,0)');
          c.fillStyle = gg; c.beginPath(); c.arc(px, py, 24, 0, 7); c.fill();
          c.restore();
          ftxt('⚡', px, py + 5, 15, '#2a1b06');
        }
      }
    }
  }
  // THE WORK TABLE (owner: "the table behind it, even though it's part of the
  // image, you should create an object in the same shape, the same size, put
  // it in front of it as an extension — this is where the NPC will start
  // working on the sword, from the crystal"). The object IS the painting's
  // own bench: the lamplit workbench region of denInterior, cropped and stood
  // on the den floor at Ratchet's right hand — same shape and size by
  // construction, drawn after the statics so it stands in front of him. The
  // forging of the crystal happens here. A dedicated fired object plate is
  // §2r on THE FIRING LIST; this crop is its stand-in and its reference.
  if (G.roomId === 'A0B') {
    const tb = (G.roomDef.h - 1) * TILE + 6;
    // §2r FIRED: the real forge-table plate stands in the moment it decodes;
    // the painting-crop stand-in below keeps the room whole until then.
    if (typeof mediaFetch === 'function') mediaFetch('forgeTable');
    const fIm = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.forgeTable;
    if (fIm && fIm.naturalWidth && typeof drawPlateAnchored === 'function') {
      if (typeof contactShadow === 'function') contactShadow(c, 22.6 * TILE, tb, 95, 0.5);
      drawPlateAnchored(c, 'forgeTable', 22.6 * TILE, tb, 150, false);
    } else if (typeof workTablePlate === 'function') {
      const tIm = workTablePlate();
      if (tIm) {
        const TH = 150, TW = TH * (tIm.naturalWidth / tIm.naturalHeight);
        const tx = 18.6 * TILE;
        // shadow first: the feathered legs let it show through, which is what
        // roots the bench on the den floor instead of floating over it
        if (typeof contactShadow === 'function') contactShadow(c, tx + TW * 0.5, tb, TW * 0.36, 0.5);
        c.drawImage(tIm, tx, tb - TH, TW, TH);
      }
    }
  }
  // interact hint
  if (G.near && G.state === 'PLAY' && !G.recharge) {
    const s = G.near;
    const label = s.type === 'npc' ? t('talk') : s.type === 'bench' ? t('rest') : s.type === 'term' ? t('read') : s.type === 'riddle' ? t('rd_hint') : s.type === 'secret' ? t('secret_hint') : s.type === 'trial' ? t('tt_open') : s.type === 'vault' ? t('vault_hint') : t('open');
    ftxt(label, s.x + s.w / 2, s.y - 18, 13, '#eef3fa', 'center', 'rgba(120,220,255,0.8)');
  }
}
// ---------------------------------------------------------------------------
// TEACHING THE TELL — once, and then never again. The first loose rock a player
// stands next to says out loud what to do about it. The moment one is broken,
// anywhere, this stops firing for the rest of the save: from then on the seam
// itself is the only thing that tells you, which is what makes the rest of the
// factory worth looking at.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// THE WARNING. The teeth themselves are baked into the tile layer, so the part
// that has to MOVE lives here: as she comes near, heat rises off the rail and
// the points catch the light. A hazard that reacts to you being close reads as
// aware of you, and that is most of what makes one intimidating.
// ---------------------------------------------------------------------------
function drawSpikeMenace() {
  if (!player || player.dead || !G.grid) return;
  const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
  const t0 = Math.floor(pcx / TILE), t1 = Math.floor(pcy / TILE);
  const now = performance.now();
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let ty = t1 - 3; ty <= t1 + 4; ty++) for (let tx = t0 - 5; tx <= t0 + 5; tx++) {
    if (tileAt(tx, ty) !== '^') continue;
    const X = tx * TILE, Y = ty * TILE;
    const d = Math.hypot(X + 16 - pcx, Y + 16 - pcy);
    const k = clamp(1 - d / 170, 0, 1);
    if (k <= 0.01) continue;
    // heat off the rail, breathing
    const pu = 0.55 + Math.sin(now / 260 + tx * 0.7) * 0.45;
    c.globalAlpha = k * k * (0.16 + pu * 0.16);
    const g = c.createLinearGradient(0, Y + TILE, 0, Y - 12);
    g.addColorStop(0, 'rgba(255,50,80,0.9)'); g.addColorStop(1, 'rgba(255,50,80,0)');
    c.fillStyle = g; c.fillRect(X - 2, Y - 12, TILE + 4, TILE + 12);
    // the melt breathes light upward; the trench glows along its rail
    c.globalAlpha = k * (0.2 + pu * 0.3);
    c.fillStyle = G.roomDef.zone === 'C' ? '#ffd08a' : '#ffd0d6';
    c.fillRect(X + 2, Y + TILE - 10, TILE - 4, 2);
  }
  c.restore();
}
function drawBreakHint() {
  if (!player || player.dead || !G.grid) return;
  if (G.save && G.save.flags && G.save.flags.taughtBreak) return;
  const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
  const t0 = Math.floor(pcx / TILE), t1 = Math.floor(pcy / TILE);
  let best = null, bd = 1e9;
  for (let ty = t1 - 3; ty <= t1 + 3; ty++) for (let tx = t0 - 4; tx <= t0 + 4; tx++) {
    if (tileAt(tx, ty) !== 'B') continue;
    const d = Math.hypot(tx * TILE + 16 - pcx, ty * TILE + 16 - pcy);
    if (d < bd) { bd = d; best = { tx, ty }; }
  }
  if (!best || bd > 132) return;
  // find the top of this block so the prompt sits above the whole cluster
  let top = best.ty;
  while (tileAt(best.tx, top - 1) === 'B') top--;
  // a block at or below her feet has to be hit from above; anything beside or
  // over her head takes an ordinary swing
  const below = top * TILE >= player.y + player.h - 6;
  const msg = t(below ? 'break_down' : 'break_hit');
  // a floor block sits at her feet, so the line has to clear her head
  const bx = best.tx * TILE + 16, by = top * TILE - (below ? 46 : 16);
  const pu = 0.55 + Math.sin(performance.now() / 260) * 0.45;
  // a soft ring on the stone itself, so the eye goes to the rock, not the text
  c.save();
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.1 + pu * 0.13;
  const gr = c.createRadialGradient(bx, top * TILE + 16, 2, bx, top * TILE + 16, 34);
  gr.addColorStop(0, PAL[G.roomDef.zone].edge); gr.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gr; c.beginPath(); c.arc(bx, top * TILE + 16, 34, 0, 7); c.fill();
  c.restore();
  ftxt(msg, bx, by, 12, '#eef3fa', 'center', 'rgba(120,220,255,0.85)');
}
function drawSeals(P) {
  if (!bossActive()) return;
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  const pu = 0.5 + Math.sin(performance.now() / 200) * 0.3;
  c.fillStyle = P.glow; c.globalAlpha = 0.25 + pu * 0.25;
  const ex = G.roomDef.exits || {};
  if (ex.L) c.fillRect(0, 0, 10, H);
  if (ex.R) c.fillRect(W - 10, 0, 10, H);
  if (ex.T) c.fillRect(0, 0, W, 10);
  if (ex.B) c.fillRect(0, H - 10, W, 10);
  c.globalAlpha = 1;
}
// Element feedback and the Song's wave. Drawn in screen space, so world points
// are converted through the camera.
function drawFX() {
  const dt = 1 / 60;
  if (G.songWave) {
    const w = G.songWave; w.t -= dt;
    if (w.t <= 0) G.songWave = null;
    else {
      const k = 1 - w.t / 0.7, sx = w.x - cam.x, sy = w.y - cam.y;
      c.save(); c.globalAlpha = (1 - k) * 0.85;
      c.strokeStyle = ELEM.murr.glow; c.lineWidth = 3;
      c.beginPath(); c.arc(sx, sy, SONG_RANGE * k, 0, 7); c.stroke();
      c.lineWidth = 1.5; c.globalAlpha = (1 - k) * 0.4;
      c.beginPath(); c.arc(sx, sy, SONG_RANGE * k * 0.72, 0, 7); c.stroke();
      // notes riding the wave outward
      c.globalAlpha = 1 - k;
      c.fillStyle = ELEM.murr.glow;
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2 + k * 1.6, rr2 = SONG_RANGE * k * 0.86;
        ftxt('♪', sx + Math.cos(a) * rr2, sy + Math.sin(a) * rr2 - 4, 15 + (1 - k) * 6, ELEM.murr.glow);
      }
      c.restore(); c.globalAlpha = 1;
    }
  }
  if (G.elemPop) {
    const p = G.elemPop; p.t -= dt;
    if (p.t <= 0) G.elemPop = null;
    else {
      const k = 1 - p.t / 0.5;
      c.save(); c.globalAlpha = Math.min(1, p.t * 3);
      const lbl = p.el === 'murr' ? t('fx_stagger') : p.el ? t('fx_weak') : t('fx_resist');
      const col = p.el ? ELEM[p.el].glow : '#8aa2b5';
      ftxt(lbl, p.x - cam.x, p.y - cam.y - 22 - k * 20, p.el ? 19 : 14, col, 'center', p.el ? col : null, '800');
      c.restore(); c.globalAlpha = 1;
    }
  }
}
// ---------------------------------------------------------------------------
// THE MAP BUTTON. A map bound to a key nobody presses may as well not exist, so
// there is a labelled control on the HUD that opens it — clickable with a mouse,
// tappable on a phone. It stays out of the way until it means something: the
// moment she has been in a second room, it fades in and says so once.
// ---------------------------------------------------------------------------
function mapUnlocked() {
  let n = 0;
  for (const k in (G.save && G.save.visited) || {}) { if (++n >= 2) return true; }
  return false;
}
function mapBtnRect() { return { x: 846, y: 22, w: 92, h: 28 }; }
function braidBtnRect() { return { x: 846, y: 56, w: 92, h: 28 }; }
function drawMapButton() {
  if (!mapUnlocked() || (TOUCH && TOUCH.enabled)) return;
  // announce it once, the first time it is worth having
  if (!G.save.flags.mapSeen) {
    G.save.flags.mapSeen = 1; G.mapBtnNew = 6; persist();
    if (typeof G.toast === 'function') G.toast(t('map_new'));
  }
  const r = mapBtnRect();
  const nw = (G.mapBtnNew || 0) > 0;
  const pu = nw ? 0.5 + Math.sin(performance.now() / 180) * 0.5 : 0;
  c.save();
  c.fillStyle = 'rgba(8,16,24,' + (0.6 + pu * 0.25) + ')';
  rr(c, r.x, r.y, r.w, r.h, 7); c.fill();
  c.strokeStyle = nw ? 'rgba(120,240,255,' + (0.5 + pu * 0.5) + ')' : 'rgba(120,200,230,0.45)';
  c.lineWidth = nw ? 2 : 1.3;
  rr(c, r.x, r.y, r.w, r.h, 7); c.stroke();
  ftxt('▦ ' + t('map_btn'), r.x + r.w / 2, r.y + r.h / 2, 13, nw ? '#eaffff' : '#bcd6e6', 'center');
  // and the multiverse itself, once she has actually forked one
  const b2 = braid();
  if (b2 && b2.led.length) {
    const q = braidBtnRect();
    const u = universe();
    const hot = u.red > 0.34;
    c.fillStyle = 'rgba(8,16,24,0.6)';
    rr(c, q.x, q.y, q.w, q.h, 7); c.fill();
    c.strokeStyle = hot ? 'rgba(255,90,106,0.55)' : 'rgba(125,232,160,0.45)';
    c.lineWidth = 1.3; rr(c, q.x, q.y, q.w, q.h, 7); c.stroke();
    ftxt('⋔ ' + u.id, q.x + q.w / 2, q.y + q.h / 2, 11.5, hot ? '#ffbcc4' : '#bcd6e6', 'center');
  }
  c.restore();
}
addEventListener('mousedown', (e) => {
  // an offer is answered by clicking the option, on any device
  if (typeof G !== 'undefined' && G.offer && !G.offer.done && typeof offerTap === 'function') {
    const r0 = cv && cv.getBoundingClientRect ? cv.getBoundingClientRect() : null;
    if (r0) {
      const ox = (e.clientX - r0.left) * (960 / r0.width), oy = (e.clientY - r0.top) * (540 / r0.height);
      if (offerTap(ox, oy)) return;
    }
  }
  if (typeof G === 'undefined' || G.state !== 'PLAY') return;
  if (!mapUnlocked() || (TOUCH && TOUCH.enabled)) return;
  const b = cv && cv.getBoundingClientRect ? cv.getBoundingClientRect() : null; if (!b) return;
  const sx = (e.clientX - b.left) * (960 / b.width), sy = (e.clientY - b.top) * (540 / b.height);
  const r = mapBtnRect();
  if (sx >= r.x && sx <= r.x + r.w && sy >= r.y && sy <= r.y + r.h) {
    G.state = 'MAP'; G.mapBtnNew = 0; mapView.ready = false; sfx('ui');
    return;
  }
  const q = braidBtnRect(); const b3 = braid();
  if (b3 && b3.led.length && sx >= q.x && sx <= q.x + q.w && sy >= q.y && sy <= q.y + q.h) {
    G.state = 'BRAID'; braidView.ready = false; sfx('ui');
  }
});
// ===========================================================================
// FIRST LESSONS. The game opened by handing a seven-year-old a robot cat and a
// keyboard and saying nothing. Everything she can do is discoverable, which is
// not the same as discovered — plenty of players never found the claw at all,
// because nothing ever asked them to use it.
//
// So the first room teaches three verbs and no more: MOVE, JUMP, SCRATCH. Each
// one waits for the player to actually do it — not to read about it and press
// on — and each shows the control THIS player has in their hands: the on-screen
// button on a phone, the pad button with a pad plugged in, the key otherwise.
// It never blocks, it never pauses the game, and once a verb is learned it is
// gone for good.
// ===========================================================================
const TUT_STEPS = [
  { id: 'move', label: 'tut_move', hint: 'tut_move_h',
    keys: '\u2190 \u2192', pad: 'D-pad', touch: 'stick', vb: null,
    done: () => Math.abs(player.vx) > 40 },
  // ...and now she has to USE it, which is the step that carries the story:
  // the door out of the room she woke in. It cannot be completed by pressing
  // anything — only by going, which is exactly what the moment is.
  { id: 'out', label: 'tut_out', hint: 'tut_out_h',
    keys: '\u2192', pad: 'D-pad', touch: 'stick', vb: null,
    done: () => (TUT_ROOMS[G.roomId] || 0) >= 1 },
  { id: 'jump', label: 'tut_jump', hint: 'tut_jump_h',
    keys: 'Z / Space', pad: 'A', touch: 'JUMP', vb: 'VJUMP',
    done: () => !player.on && player.vy < -60 },
  // THE GATES. The second half of the walk, and the reason the walk exists: a
  // tutorial that ends at a door you can see from where you started gives the
  // verbs somewhere to have been going.
  { id: 'gate', label: 'tut_gate', hint: 'tut_gate_h',
    keys: '\u2192', pad: 'D-pad', touch: 'stick', vb: null,
    done: () => (TUT_ROOMS[G.roomId] || 0) >= 2 },
  { id: 'atk', label: 'tut_atk', hint: 'tut_atk_h',
    keys: 'X', pad: 'X', touch: 'ATK', vb: 'VATK',
    done: () => !!player.swing || player.comboT > 0 },
  // ---- and now the LOOP, which is the part a verb tutorial never teaches ----
  // Knowing which button swings is not knowing how to play this game. What a
  // player actually has to learn is the circuit: a machine broken is scrap,
  // scrap is volts, volts are cores, and thinking is a currency of its own that
  // buys the abilities everything above runs on. Each of these steps is one
  // link, taught in the order the circuit runs, on the floor where nothing can
  // kill you for getting it wrong.
  { id: 'kill', label: 'tut_kill', hint: 'tut_kill_h',
    keys: 'X', pad: 'X', touch: 'ATK', vb: 'VATK',
    done: () => !G.enemies.some(e => e && !e.dead) },
  { id: 'coin', label: 'tut_coin', hint: 'tut_coin_h',
    keys: '\u2190 \u2192', pad: 'D-pad', touch: 'stick', vb: null,
    done: () => G.save.scrap >= 12 },
  { id: 'buy', label: 'tut_buy', hint: 'tut_buy_h',
    keys: 'E', pad: 'B', touch: 'INT', vb: 'VINT',
    done: () => !!(G.save.flags && G.save.flags.tutBuy) },
  { id: 'heal', label: 'tut_heal', hint: 'tut_heal_h',
    keys: 'F', pad: 'Y', touch: 'HEAL', vb: 'VHEAL',
    done: () => player.cores >= player.maxCores() },
  { id: 'node', label: 'tut_node', hint: 'tut_node_h',
    keys: 'E', pad: 'B', touch: 'INT', vb: 'VINT',
    done: () => (G.save.iq | 0) >= 10 },
  { id: 'skill', label: 'tut_skill', hint: 'tut_skill_h',
    keys: 'T', pad: 'View', touch: 'SKILL', vb: 'VSKILL',
    done: () => (G.save.skills && G.save.skills.length > 0) },
  { id: 'go', label: 'tut_go', hint: 'tut_go_h',
    keys: '\u2192', pad: 'D-pad', touch: 'stick', vb: null,
    done: () => false },                       // ends by leaving the room
];
const TUT_LAST = TUT_STEPS.length - 1;         // the 'go' step, and the open door
// Some lessons need the world to change before they make any sense.
function tutEnter(st) {
  if (!st || !player) return;
  if (st.id === 'heal' && player.cores >= player.maxCores()) {
    // THE FIRST HIT, ON PURPOSE. Repair cannot be taught to somebody at full
    // health: the button does nothing, and a lesson whose demonstration is a
    // no-op lands as noise. So the wreck she just made discharges once —
    // scripted, capped at this single core, and staged in the only room in the
    // game where nothing else can hurt her while she works out the answer.
    player.cores = Math.max(1, player.cores - 1);
    G.coreFlash = { i: player.cores, t: 0.6 };
    player.iT = Math.max(player.iT || 0, 1.4);
    cam.shake = Math.max(cam.shake, 5);
    G.flash = Math.max(G.flash, 0.5);
    sfx('hurt');
    burst(player.x + player.w / 2, player.y + player.h / 2, 20, '#ff5f6d', 230, 0.6, 90, 3, true);
    if (typeof tBuzz === 'function') tBuzz(60);
  }
}
// WHAT THE CHIP SAYS, AND WHY IT STOPPED SAYING "stick".
//
// The chip names the control this player actually has in their hands, and for
// the walking steps that was the literal string `stick` — which on a phone sat
// next to "The gates / the city is still standing, go in" and read as a word
// nobody asked for. The stick is the thing under the player's left thumb; it
// does not need naming, it needs POINTING. Direction steps show the arrow.
const TUT_DIR = { move: '\u2190 \u2192', out: '\u2192', gate: '\u2191', coin: '\u2190 \u2192', go: '\u2192' };
function tutHand(st) {
  if (TUT_DIR[st.id]) return TUT_DIR[st.id];
  if (typeof TOUCH !== 'undefined' && TOUCH && TOUCH.enabled) return st.touch;
  if (typeof PAD !== 'undefined' && PAD && PAD.on) return st.pad;
  return st.keys;
}
// The lessons are STAGED IN THE ROOM: open ground for the first, the step for
// the second, and a machine walking at her for the third — held just short of
// touching, because a lesson you can fail is not a lesson, it is a fight.
// THE LESSON SPANS THREE ROOMS NOW, and which verb belongs to which is the
// whole point of the change: MOVE in the cradle room, JUMP on the walk to the
// city, and everything that involves a machine on the waking floor once she
// can already do both. A tutorial that teaches you to punch before it teaches
// you to walk is a tutorial written in the order the code was, not the order
// the player needs.
//
// Leaving the chain forward (W1 -> W2 -> A0) advances it; leaving BACKWARD
// does not end it, because walking left to look at the room you woke in is
// curiosity, not a decision to skip the tutorial.
const TUT_ROOMS = { W1: 0, W2: 1, A0: 2, A0B: 2 };
// which step opens each room's door — see the fence in updateTutor()
// (the booth interior is part of the waking floor's stage: stepping into it
// mid-lesson must not end the tutorial)
const TUT_DOOR = { W1: 'out', W2: 'gate', A0: 'go', A0B: 'go' };
// ===========================================================================
// SEQUENTIAL CONTROLS (owner's order): a control does not EXIST until the
// lesson that teaches it begins. Buttons appear on the touch layout the
// moment they are needed and not before; keys and pad buttons for untaught
// verbs are ignored. This is enforcement, not decoration — the bug it ends
// is the player interacting with the trader before the fight lesson, opening
// a shop with zero scrap, and reading the whole game as broken ("I cannot
// redeem anything"). WHEEL/CREST are not taught in the walk at all, so they
// arrive with the door out ('go'). Movement, pause and the map are never
// gated: walking is the first lesson, and trapping a player unable to pause
// is not teaching.
// ===========================================================================
const TUT_UNLOCK = { JUMP: 'jump', ATK: 'atk', INT: 'buy', HEAL: 'heal', SKILL: 'skill', WHEEL: 'go', CREST: 'go', DASH: 'go', CAST: 'go', SONG: 'go', CLAW: 'go', ARM: 'go', STAR: 'go', BRAID: 'go' };
function tutAllows(act) {
  const need = TUT_UNLOCK[act];
  if (!need) return true;
  if (!G || !G.save || !G.tut) return true;
  if (G.save.flags && G.save.flags.tut) return true;
  if (TUT_ROOMS[G.roomId] === undefined) return true;
  const idx = TUT_STEPS.findIndex(q => q.id === need);
  return idx < 0 || G.tut.i >= idx;
}
function updateTutor(dt) {
  const sv = G.save;
  if (!sv || !player || player.dead) return;
  if (sv.flags && sv.flags.tut) return;
  if (TUT_ROOMS[G.roomId] === undefined) {       // the whole waking is behind her
    if (sv.flags) sv.flags.tut = 1;
    G.tut = null; if (typeof TOUCH !== 'undefined' && TOUCH) TOUCH.hi = null;
    return;
  }
  if (!G.tut) G.tut = { i: 0, t: 0, hold: 0, doneT: 0 };
  const T = G.tut;
  const st = TUT_STEPS[T.i];
  // THE DUMMY. Calm, so it can never take a core off her, and stopped short of
  // arm's length until the claw has been taught — then it walks in and is held
  // there, close enough to be frightening and too far to touch.
  const dum = G.enemies && G.enemies.find(e => e && !e.dead);
  if (dum) {
    dum.calm = true; dum.hypnoT = 1e9;
    const gap = (dum.x + dum.w / 2) - (player.x + player.w / 2);
    // held at arm's length until the claw has been taught, then let close —
    // but never let loose: the kill step wants a target, not a fight
    if (T.i < 2 || Math.abs(gap) < 96) { dum.vx = 0; dum.stagT = Math.max(dum.stagT || 0, 0.12); }
  }
  if (typeof TOUCH !== 'undefined' && TOUCH) TOUCH.hi = (st && st.vb && TOUCH.enabled) ? st.vb : null;
  // THE DOOR WAITS. Nothing here can hurt her and nothing here can trap her —
  // but a teaching room she can walk straight out of teaches only the first
  // verb, which is what happened: she strolled past the machine she was being
  // asked to scratch and into a room with real ones. The way out holds until
  // the three verbs are done, and then opens itself.
  // ...and now there are THREE doors, because the lesson spans three rooms.
  // Each one holds until the room it belongs to has finished teaching, and the
  // step that opens it is the step that asks her to go through it — which is
  // why `out` and `gate` are steps at all rather than just walking.
  //
  // The fence used to be a single `T.i < TUT_LAST`, and with the waking rooms
  // in front of A0 that fenced her into the cradle for the whole tutorial: the
  // door out of W1 could not open until the LAST lesson in A0 was done, in a
  // room she could not reach. tests/opening.cjs caught it — she walked to
  // x=610 and stopped there forever.
  const openAt = TUT_STEPS.findIndex(q => q.id === (TUT_DOOR[G.roomId] || 'go'));
  if (openAt >= 0 && T.i < openAt) {
    const lim = (G.roomDef.w - 2.2) * TILE - player.w;
    if (player.x > lim) { player.x = lim; if (player.vx > 0) player.vx = 0; }
  } else if (T.opened !== G.roomId) {
    T.opened = G.roomId;                       // per ROOM, not once per run
    sfx('cast'); cam.shake = Math.max(cam.shake, 3);
    for (let i = 0; i < 18; i++)
      addPart((G.roomDef.w - 1.6) * TILE, 11 * TILE + rnd(0, 3.4 * TILE),
        rnd(-40, 60), rnd(-70, 30), rnd(0.4, 0.8), '#37ffd0', 2.6, 120, true);
  }
  if (!st) return;
  T.t += dt;
  if (T.hold > 0) { T.hold -= dt; if (T.hold <= 0) { T.i++; T.t = 0; tutEnter(TUT_STEPS[T.i]); } return; }
  let ok = false;
  try { ok = st.done(); } catch (e) { ok = false; }
  if (ok && T.t > 0.25) {
    T.hold = 0.7;
    sfx('pick');
    burst(player.x + player.w / 2, player.y + 4, 12, '#37ffd0', 190, 0.5, 220, 3, true);
  }
}
function drawTutor() {
  const sv = G.save;
  if (!sv || !G.tut || (sv.flags && sv.flags.tut) || !player || TUT_ROOMS[G.roomId] === undefined) return;
  const T = G.tut;
  const st = TUT_STEPS[T.i];
  if (!st) return;
  const px = player.x + player.w / 2 - cam.x, py = player.y - cam.y;
  const learned = T.hold > 0;
  const pu = 0.5 + Math.sin(performance.now() / 260) * 0.5;
  // THE THING BEING TAUGHT, RINGED. A card that names a verb teaches nothing if
  // the player cannot see what it is about — so the step gets a ring while the
  // jump is being taught and the machine gets one while the claw is.
  const mark = (wx, wy, r, col) => {
    c.save();
    c.strokeStyle = col; c.lineWidth = 2.5; c.globalAlpha = 0.35 + pu * 0.5;
    c.setLineDash([6, 6]); c.lineDashOffset = -performance.now() / 70;
    c.beginPath(); c.arc(wx - cam.x, wy - cam.y, r + pu * 3, 0, 7); c.stroke();
    c.setLineDash([]); c.restore(); c.globalAlpha = 1;
  };
  // the thing being taught, ringed — and WHICH thing depends on the room now
  if (st.id === 'jump')
    mark(G.roomId === 'W2' ? 13 * TILE : 17 * TILE + 12, 14 * TILE + 12, 34, '#37ffd0');
  if (st.id === 'out' || st.id === 'gate') {
    // the gate step points at the GATE, not at the wall: W2's way out is the
    // depth door at the stand spot, and the massed city wall now owns the
    // last three tiles where the old mark used to hover
    const gr = (typeof gateDoors === 'function' ? gateDoors() : [])[0];
    mark(gr ? gr.at * G.roomDef.w * TILE : (G.roomDef.w - 1.5) * TILE, 13 * TILE, 30, '#ffd76a');
  }
  if (st.id === 'atk' || st.id === 'kill') {
    const dum = G.enemies && G.enemies.find(e => e && !e.dead);
    if (dum) mark(dum.x + dum.w / 2, dum.y + dum.h / 2, 30, '#ff8a6a');
  }
  // ring the THING, not just the button: a card that names a verb teaches
  // nothing if the player cannot see what it is about
  if (st.id === 'coin') for (const p2 of G.pickups || [])
    if (!p2.dead) mark(p2.x + 6, p2.y + 6, 18, '#ffd76a');
  if (st.id === 'buy' || st.id === 'node') {
    const want = st.id === 'buy' ? 'npc' : 'riddle';
    const s2 = (G.statics || []).find(q => q.type === want && !q.opened);
    if (s2) mark(s2.x + s2.w / 2, s2.y + s2.h / 2, 30, st.id === 'buy' ? '#ffd76a' : '#b48cff');
    else if (st.id === 'buy') {
      // the trader is inside his booth now: the lesson rings the booth door
      const gr2 = (typeof gateDoors === 'function' ? gateDoors() : []).find(d => d.style === 'booth');
      if (gr2) mark(gateWorldX(gr2), 13 * TILE, 34, '#ffd76a');
    }
  }
  if (st.id === 'heal') mark(player.x + player.w / 2, player.y + player.h / 2, 32, '#aef7d8');
  if (st.id === 'go') {
    // "go right" is a lie inside the booth: the den's only way out is the
    // door she came in by. The five-player validation caught a six-year-old
    // holding right into the den wall for six minutes. In a room with no
    // right-hand exit, the mark rings the depth door instead.
    const gr3 = (typeof gateDoors === 'function' ? gateDoors() : [])[0];
    if (!G.roomDef.exits.R && gr3) mark(gateWorldX(gr3), 13 * TILE, 30, '#ffd76a');
    else mark((G.roomDef.w - 1.5) * TILE, 13 * TILE, 30, '#ffd76a');
  }
  if (T.i < TUT_LAST && !(typeof GATE_ROOM !== 'undefined' && GATE_ROOM[G.roomId])) {
    // the held door: a light curtain, not a wall — it reads as "not yet".
    // Not in W2: its way out is the depth gate, which glimmers for itself,
    // and the curtain's old berth is inside the massed city wall now.
    const bx = (G.roomDef.w - 2.0) * TILE - cam.x;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const bg = c.createLinearGradient(bx - 10, 0, bx + 14, 0);
    bg.addColorStop(0, 'rgba(55,255,208,0)');
    bg.addColorStop(0.5, 'rgba(55,255,208,' + (0.16 + pu * 0.12).toFixed(3) + ')');
    bg.addColorStop(1, 'rgba(55,255,208,0)');
    c.fillStyle = bg;
    c.fillRect(bx - 10, 10.4 * TILE - cam.y, 24, 4.6 * TILE);
    c.strokeStyle = 'rgba(55,255,208,' + (0.3 + pu * 0.3).toFixed(3) + ')';
    c.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const yy = (10.6 + i * 0.9) * TILE - cam.y + Math.sin(performance.now() / 300 + i) * 3;
      c.beginPath(); c.moveTo(bx - 7, yy); c.lineTo(bx + 7, yy); c.stroke();
    }
    c.restore();
  }
  tutCard(px, py, tutHand(st), t(st.label), t(st.hint), learned, Math.max(0, T.hold / 0.7));
}
// one card, used by the waking floor and by every power she is handed after it
function tutCard(px, py, key, label, hint, learned, fade) {
  const pu = 0.5 + Math.sin(performance.now() / 260) * 0.5;
  c.font = '700 15px "Segoe UI", Tahoma, sans-serif';
  const kw = c.measureText(key).width + 26;
  c.font = '600 15px "Segoe UI", Tahoma, sans-serif';
  const lw = Math.max(c.measureText(label).width, c.measureText(hint).width * 0.8);
  const w = Math.max(160, kw + lw + 34), x = clamp(px - w / 2, 12, 948 - w), y = clamp(py - 78, 8, 430);
  c.save();
  c.globalAlpha = learned ? Math.max(0, fade) : 1;
  c.fillStyle = 'rgba(6,14,20,0.86)'; rr(c, x, y, w, 46, 10); c.fill();
  c.strokeStyle = learned ? '#7de8a0' : 'rgba(55,255,208,' + (0.35 + pu * 0.45) + ')';
  c.lineWidth = 2; rr(c, x, y, w, 46, 10); c.stroke();
  c.fillStyle = learned ? 'rgba(125,232,160,0.22)' : 'rgba(55,255,208,0.16)';
  rr(c, x + 10, y + 10, kw, 26, 6); c.fill();
  ftxt(key, x + 10 + kw / 2, y + 24, 15, learned ? '#bff5d2' : '#8ff0d4', 'center', null, '700');
  ftxt(learned ? '\u2713 ' + label : label, x + kw + 22, y + 20, 15,
    learned ? '#bff5d2' : '#eef3fa', 'left', null, '600');
  ftxt(hint, x + kw + 22, y + 36, 12, '#7d93a8', 'left');
  c.fillStyle = learned ? '#7de8a0' : '#37ffd0';
  c.globalAlpha = (learned ? Math.max(0, fade) : 1) * 0.8;
  c.beginPath();
  c.moveTo(px - 6, y + 48); c.lineTo(px + 6, y + 48); c.lineTo(px, y + 56);
  c.closePath(); c.fill();
  c.restore(); c.globalAlpha = 1;
}
// ===========================================================================
// A POWER YOU CANNOT WORK IS NOT A POWER. Every guardian hands over something
// new, and until now the handover was one line of text inside a dialogue box:
// read it, close it, and by the time there is a wall worth clinging to it has
// been forgotten. Each one now teaches itself the same way the first three
// verbs do — the control this player has in their hands, what it is FOR in
// four words, and it waits until they have actually done it once.
// ===========================================================================
const MOD_LESSON = {
  dash:  { vb: 'VDASH', keys: 'C / Shift', pad: 'RB', touch: 'DASH',
           done: () => player.dashT > 0 },
  djump: { vb: 'VJUMP', keys: 'Z / Space', pad: 'A', touch: 'JUMP',
           done: () => !player.on && player.airJumps < (hasSkill('triple') ? 2 : 1) },
  wall:  { vb: null, keys: '\u2190 \u2192', pad: 'D-pad', touch: 'stick',
           done: () => !!player.wallSlide },
  emp:   { vb: 'VCAST', keys: 'V', pad: 'B', touch: 'CAST',
           done: () => player.castCD > 0 },
};
function lessonStart(id) {
  if (!MOD_LESSON[id]) return;
  if (G.save && G.save.flags && G.save.flags['les_' + id]) return;
  G.lesson = { id, t: 0, hold: 0 };
}
function updateLesson(dt) {
  const L = G.lesson;
  if (!L || !player || player.dead) return;
  const M = MOD_LESSON[L.id];
  if (!M) { G.lesson = null; return; }
  if (typeof TOUCH !== 'undefined' && TOUCH && TOUCH.enabled && !G.tut) TOUCH.hi = M.vb || null;
  L.t += dt;
  if (L.hold > 0) {
    L.hold -= dt;
    if (L.hold <= 0) {
      if (G.save.flags) G.save.flags['les_' + L.id] = 1;
      G.lesson = null;
      if (typeof TOUCH !== 'undefined' && TOUCH) TOUCH.hi = null;
      persist();
    }
    return;
  }
  let ok = false;
  try { ok = M.done(); } catch (e) { ok = false; }
  if (ok && L.t > 0.3) {
    L.hold = 1.1;
    sfx('pick');
    burst(player.x + player.w / 2, player.y + 4, 14, '#37ffd0', 200, 0.5, 220, 3, true);
  }
}
function drawLesson() {
  const L = G.lesson;
  if (!L || !player || G.state !== 'PLAY') return;
  const M = MOD_LESSON[L.id];
  if (!M) return;
  tutCard(player.x + player.w / 2 - cam.x, player.y - cam.y, tutHand(M),
    t('m_' + L.id), t('les_' + L.id), L.hold > 0, L.hold / 1.1);
}
function drawHUD() {
  const P = PAL[G.roomDef.zone];
  // DATA CORRUPTION: the whole HUD jitters, tears and lies for its 8 seconds
  const glitched = (G.hudGlitchT || 0) > 0;
  if (glitched) {
    c.save();
    c.translate(Math.sin(performance.now() * 0.09) * 3 + rnd(-2, 2), rnd(-1.5, 1.5));
    if (chance(0.2)) c.translate(rnd(-7, 7), 0);
  }
  // full-health celebration glow behind the row
  if (G.coresFullT > 0) {
    c.globalAlpha = G.coresFullT;
    c.fillStyle = 'rgba(174,247,216,0.25)';
    rr(c, 8, 8, player.maxCores() * 30 + 8, 36, 10); c.fill();
    c.globalAlpha = 1;
  }
  // cores as cat-face icons (robo) / hoplite shields (hero)
  const heroHud = typeof isHero === 'function' && isHero();
  for (let i = 0; i < player.maxCores(); i++) {
    const x = 26 + i * 30, y = 26, full = i < player.cores;
    const fl = G.coreFlash && G.coreFlash.i === i ? G.coreFlash.t : 0;
    c.save(); c.translate(x, y);
    if (fl > 0) c.scale(1 + fl * 0.9, 1 + fl * 0.9);
    if (heroHud) {
      c.fillStyle = fl > 0.25 ? '#ffffff' : (full ? '#d9b56a' : 'rgba(110,98,70,0.4)');
      if (full) { c.shadowColor = fl > 0 ? '#ffe9b0' : P.glow; c.shadowBlur = 8 + fl * 26; }
      c.beginPath(); c.arc(0, -2, 11, 0, Math.PI * 2); c.fill();
      c.shadowBlur = 0;
      if (full) {
        c.strokeStyle = '#8a6f38'; c.lineWidth = 2;
        c.beginPath(); c.arc(0, -2, 11, 0, Math.PI * 2); c.stroke();
        c.fillStyle = '#e0484f'; c.beginPath(); c.arc(0, -2, 4, 0, Math.PI * 2); c.fill();
      }
    } else {
      c.fillStyle = fl > 0.25 ? '#ffffff' : (full ? '#eef3fa' : 'rgba(90,105,125,0.45)');
      if (full) { c.shadowColor = fl > 0 ? '#aef7d8' : P.glow; c.shadowBlur = 8 + fl * 26; }
      rr(c, -10, -8, 20, 17, 6); c.fill();
      c.beginPath(); c.moveTo(-9, -6); c.lineTo(-6, -15); c.lineTo(-1, -7); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(1, -7); c.lineTo(6, -15); c.lineTo(9, -6); c.closePath(); c.fill();
      c.shadowBlur = 0;
      if (full) { c.fillStyle = '#0a1420'; c.fillRect(-6, -2, 4, 4); c.fillRect(2, -2, 4, 4); }
    }
    c.restore();
  }
  // volt gauge — the heal bar (charges from slashes and kills)
  const vx = 38, vy = 66;
  const canHeal = player.volts >= player.healCost() && player.cores < player.maxCores();
  const hpu = 0.6 + Math.sin(performance.now() / 280) * 0.4;
  if (canHeal) {
    const g = c.createRadialGradient(vx, vy, 2, vx, vy, 21);
    g.addColorStop(0, 'rgba(174,247,216,' + 0.5 * hpu + ')');
    g.addColorStop(1, 'rgba(174,247,216,0)');
    c.fillStyle = g; c.beginPath(); c.arc(vx, vy, 21, 0, 7); c.fill();
  }
  c.strokeStyle = 'rgba(120,140,160,0.5)'; c.lineWidth = 6;
  c.beginPath(); c.arc(vx, vy, 16, 0, 7); c.stroke();
  c.strokeStyle = canHeal ? '#aef7d8' : '#ffd76a';
  c.shadowColor = c.strokeStyle; c.shadowBlur = canHeal ? 12 : 6;
  c.beginPath(); c.arc(vx, vy, 16, -Math.PI / 2, -Math.PI / 2 + (player.volts / player.voltMax()) * Math.PI * 2); c.stroke();
  c.shadowBlur = 0;
  ftxt('⚡', vx, vy + 1, 15, canHeal ? '#aef7d8' : '#ffd76a');
  if (canHeal) {
    ftxt(TOUCH && TOUCH.enabled ? '✚' : '✚ F', vx + 28, vy, 15, 'rgba(174,247,216,' + hpu + ')', 'left');
    if (!G.healToasted) { G.healToasted = true; G.toast(t('heal_hint')); }
  }
  // ---- suit wheel: what you are wearing, and what else you could wear
  const slots = armSlots();
  if (slots.length > 1) {
    const cur = (G.save.armIdx || 0) % slots.length;
    for (let i = 1; i < slots.length; i++) {
      const bx = 44 + (i - 1) * 42, by = 118, on = i === cur;
      c.save(); c.translate(bx, by);
      c.globalAlpha = on ? 1 : 0.42;
      drawArmBadge(c, slots[i].id, on ? 17 : 14, on);
      c.restore(); c.globalAlpha = 1;
    }
    const a = slots[cur];
    ftxt(a ? t('arm_' + a.id) : t('arm_none'), 44, 146, 12, a ? ELEM[a.el].glow : '#7d93a8', 'left');
    if (!(TOUCH && TOUCH.enabled)) ftxt('G', 26, 118, 11, '#546b7d');
  }
  // ONE PANEL, ONE CLUSTER. The song glyph, the shuriken pips and their key
  // hints floated loose over the art with nothing behind them, and on a tall
  // phone the pip row lands mid-screen — six glowing diamonds hovering in the
  // world, which reads as collectibles, not as a counter. A single dim plate
  // ties the corner together: UI lives on glass, the world does not. Drawn
  // first so everything in the cluster sits on it.
  const smP = starMax();
  {
    const px0 = 906 - (smP - 1) * 15 - 22;
    // A PLATE, NOT A SLAB. Flat 0.42 black over these rooms is a rectangle
    // floating on the wall — the fix reads as another object in the scene,
    // which is the fault it was fixing. A vertical fade instead: solid enough
    // behind the pips to take them out of the world, gone by its own edges.
    const pg = c.createLinearGradient(0, 100, 0, 196);
    pg.addColorStop(0, 'rgba(5,9,15,0.05)');
    pg.addColorStop(0.45, 'rgba(5,9,15,0.34)');
    pg.addColorStop(1, 'rgba(5,9,15,0.05)');
    c.fillStyle = pg;
    rr(c, px0, 100, 950 - px0, 96, 12); c.fill();
  }
  // the Song is always available — it is hers, not a boss's
  const songReady = player.volts >= SONG_COST;
  ftxt('♪', 934, 118, 20, songReady ? ELEM.murr.glow : 'rgba(125,147,168,0.5)', 'right');
  if (!(TOUCH && TOUCH.enabled)) ftxt('B', 934, 138, 11, songReady ? '#8fd8c8' : '#546b7d', 'right');
  // shuriken: pips, so you can read the count without arithmetic
  const sc = starCount(), sm = starMax();
  for (let i = 0; i < sm; i++) {
    const bx = 906 - i * 15, on = i < sc;
    // the next pip charges up visibly as the suit condenses a new star
    const charging = !on && i === sc && G.starRegenT > 0;
    const chg = charging ? Math.min(1, G.starRegenT / STAR_REGEN_T) : 0;
    c.save(); c.translate(bx, 164); c.rotate(0.5 + (charging ? chg * 6.28 : 0));
    c.fillStyle = on ? ELEM.zizt.glow
      : charging ? 'rgba(190,240,255,' + (0.28 + chg * 0.6).toFixed(2) + ')'
        : 'rgba(120,140,160,0.28)';
    if (on) { c.shadowColor = ELEM.zizt.col; c.shadowBlur = 6; }
    if (charging && chg > 0.7) { c.shadowColor = ELEM.zizt.col; c.shadowBlur = 5 * chg; }
    c.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * Math.PI * 2;
      c.lineTo(Math.cos(a) * 5.4, Math.sin(a) * 5.4);
      c.lineTo(Math.cos(a + 0.39) * 1.9, Math.sin(a + 0.39) * 1.9);
    }
    c.closePath(); c.fill(); c.shadowBlur = 0; c.restore();
  }
  if (!(TOUCH && TOUCH.enabled)) ftxt('R', 934, 186, 11, sc ? '#8fd8c8' : '#546b7d', 'right');

  // scrap + knowledge
  // A NUT, NOT A GEAR. ⚙ reads as SETTINGS to every player alive, and this
  // counter is money — the gear stays where it means the Tinker's trade (his
  // shop sign and the map legend), never the wallet. ⬢ and not the 🔩 emoji:
  // measured in a canvas, the bolt renders as a COLOUR emoji that ignores
  // fillStyle, so the money counter came out sky blue in an all-amber HUD.
  ftxt('⬢ ' + G.save.scrap, 76, 66, 17, '#ffd76a', 'left', null, '700');
  ftxt('◈ ' + (G.save.iq || 0) + ' ' + t('sk_iq'), 76, 88, 13, '#b48cff', 'left');
  // AND FROM THE FIRST POINT EARNED, SAY WHERE IT GOES — BY NAME.
  //
  // This has been wrong twice. First it was a toast, which scrolled away in two
  // seconds mid-fight. Then it was a standing prompt that printed the bare key:
  // "▸ T". A letter on its own is not an instruction, and it only appeared once
  // something was already affordable — so the player watching a counter climb
  // from 1 to 9 was told nothing at all, and the one frame that would have
  // helped never came.
  //
  // It now names the door, and it is up from the first point: the moment a
  // counter starts moving is the moment the player wants to know what it is
  // for. Dim with the target's cost while she is saving; lit and pulsing the
  // moment she can spend.
  if (typeof skillAffordable === 'function' && (G.save.iq || 0) > 0) {
    const ready = skillAffordable();
    const goal = ready || skillNext();
    // POINT AT THE DOOR, NOT AT THE WORD. A line of text naming a key teaches
    // nothing on a phone, where there is no key — the player has a screen full
    // of buttons and no reason to think one of them is the answer. When a point
    // is actually SPENDABLE the prompt gets a lit plate behind it so it stops
    // being another grey line in the corner, and the SKILL button on the touch
    // layout is ringed by the same tutor highlight that teaches every other
    // verb. It clears itself the moment she can no longer afford anything.
    if (ready) {
      const pu3 = 0.5 + Math.sin(performance.now() / 320) * 0.5;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.16 + pu3 * 0.20;
      const hg = c.createLinearGradient(60, 0, 300, 0);
      hg.addColorStop(0, 'rgba(190,150,255,0.85)');
      hg.addColorStop(1, 'rgba(190,150,255,0)');
      c.fillStyle = hg;
      rr(c, 62, 94, 238, 20, 7); c.fill();
      c.restore();
      // ...and the button under her thumb, on the layout that has one. Never
      // while the tutorial is running: that highlight is the lesson's, and two
      // things asking to be pressed at once is worse than neither.
      if (typeof TOUCH !== 'undefined' && TOUCH && TOUCH.enabled && !G.tut) TOUCH.hi = 'VSKILL';
    } else if (typeof TOUCH !== 'undefined' && TOUCH && !G.tut && TOUCH.hi === 'VSKILL') {
      TOUCH.hi = null;
    }
    c.globalAlpha = ready ? 0.62 + Math.sin(performance.now() / 380) * 0.28 : 0.5;
    ftxt('▸ ' + howToOpenNamed('SKILL', t('pm_skills'))
         + (ready || !goal ? '' : '   ' + (G.save.iq || 0) + '/' + goal.cost),
         76, 104, 11.5, ready ? '#d9b8ff' : '#8f7fb0', 'left');
    c.globalAlpha = 1;
  } else if (typeof TOUCH !== 'undefined' && TOUCH && !G.tut && TOUCH.hi === 'VSKILL') {
    TOUCH.hi = null;                       // nothing left to buy: stop pointing
  }
  // nine-lives counter
  if (G.save.diff === 2) ftxt('♥ ' + (9 - G.save.lives) + ' — ' + t('lives_left'), 934, 26, 15, '#ff8f9d', 'right');
  // audio blocked indicator (browser hasn't allowed sound yet)
  if (!AC || AC.state !== 'running') ftxt('🔇', 480, 26, 18, 'rgba(255,143,157,0.8)');
  // boss bar
  if (bossActive() && G.boss.st !== 'intro') {
    const b = G.boss, w = 480;
    c.fillStyle = 'rgba(8,12,18,0.7)'; rr(c, 480 - w / 2, 494, w, 26, 6); c.fill();
    c.fillStyle = P.glow; c.globalAlpha = 0.9;
    c.fillRect(480 - w / 2 + 4, 498, (w - 8) * clamp(b.hp / b.hpMax, 0, 1), 8);
    c.globalAlpha = 1;
    ftxt(t('b_' + b.kind), 480, 481, 14, '#eef3fa', 'center', P.glow);
    // plating chain status: what shorts this boss's armor, and the open window
    if (BOSS_GATE[b.kind]) {
      const key = armDef(BOSS_GATE[b.kind]);
      const kn = t('arm_' + key.id).split(' — ')[0];
      if ((b.shieldT || 0) > 0)
        ftxt('⛨ ' + t('gate_open') + ' ' + Math.ceil(b.shieldT), 480, 534, 12, ELEM[key.el].glow, 'center');
      else if (!bossGateOpen(b))
        ftxt('⛨ ' + t('gate_plated').replace('{a}', kn), 480, 534, 12, '#93a3b4', 'center');
    }
  }
  // toasts
  // A TOAST AT y=440 IS INSIDE THE DIALOGUE BOX. "Errand taken" was landing on
  // top of the line the NPC was saying — two pieces of white text stacked in the
  // same place, both unreadable. A notification exists to be read, so it moves
  // out of the way of whatever panel is open rather than competing with it.
  //
  // AND IT NEEDS SOMETHING BEHIND IT. Bare white text over the world is text
  // over whatever happens to be standing there — reported as "text hides the
  // characters", and true wherever the ground is pale or a fight is happening.
  // A notification is UI, so it is drawn as UI: measured, on its own plate, and
  // not drawn at all over a full-screen menu that has its own reading to do.
  const toastHidden = { SKILLS: 1, CREST: 1, RELICS: 1, MAP: 1, BRAID: 1, PAUSE: 1,
                        CTRL: 1, SHOP: 1, TRIAL: 1, TCFG: 1, CINE: 1 };
  if (!toastHidden[G.state]) {
    // ...and it sits in the SKY, not on the floor. At 452 a notification landed
    // squarely on the ground the player and everything hunting her are standing
    // on — a plate makes it legible, it does not make it welcome there. The band
    // under the HUD is the one part of the frame that is empty in almost every
    // room, and it is where the eye already goes for the zone name.
    const toastY = (G.state === 'DIALOG' || G.state === 'OFFER') ? 178 : 146;
    G.toasts.forEach((tt, i) => {
      // stacked DOWNWARD from the band: upward walked them into the zone banner
      const a = clamp(tt.t, 0, 1), y = toastY + i * 30;
      c.font = '700 15px "Segoe UI", Tahoma, sans-serif';
      const w = Math.min(880, c.measureText(tt.text).width + 34);
      c.globalAlpha = a * 0.86;
      c.fillStyle = 'rgba(6,10,17,0.9)';
      rr(c, 480 - w / 2, y - 14, w, 28, 8); c.fill();
      c.globalAlpha = a * 0.5;
      c.strokeStyle = 'rgba(120,220,255,0.55)'; c.lineWidth = 1;
      rr(c, 480 - w / 2, y - 14, w, 28, 8); c.stroke();
      c.globalAlpha = a;
      ftxt(tt.text, 480, y, 15, '#eef3fa', 'center');
      c.globalAlpha = 1;
    });
  }
  // the zone banner is a PLAY-state flourish; over the pause menu it was just a
  // second title crossing the first
  if (G.zoneToast && G.state === 'PLAY') {
    c.globalAlpha = clamp(G.zoneToast.t, 0, 1);
    ftxt(G.zoneToast.text, 480, 90, 34, '#eef3fa', 'center', PAL[G.roomDef.zone].glow);
    c.globalAlpha = 1;
  }
  if (glitched) {
    // tear bars and static wash over everything the HUD just claimed
    for (let i = 0; i < 4; i++) {
      if (!chance(0.6)) continue;
      const gy2 = rnd(6, 70), gh2 = rnd(2, 6);
      c.fillStyle = 'rgba(140,246,255,' + rnd(0.06, 0.2) + ')';
      c.fillRect(rnd(-8, 8), gy2, 960, gh2);
    }
    if (chance(0.3)) {
      c.fillStyle = 'rgba(230,57,70,0.18)';
      c.fillRect(rnd(0, 700), rnd(4, 60), rnd(60, 200), rnd(3, 9));
    }
    c.restore();
  }
}
function lightAt(x, y, r, color, a) {
  if (!color) return;
  // HER SHADOW LISTENS. Every light drawn near her this frame pushes the
  // contact shadow away from itself, weighted by strength and closeness —
  // so the shadow leans with the room's lighting instead of sitting under
  // her like a printed disc (the owner's exact complaint). Accumulated
  // here, committed at the end of drawLights, read one frame later by the
  // player's shadow — a frame of lag no eye can see.
  if (typeof player !== 'undefined' && player && !player.dead) {
    const dx = player.x + player.w / 2 - x, dy = player.y + player.h - y;
    const d = Math.hypot(dx, dy);
    if (d > 1 && d < r * 1.6) G._shadAcc = (G._shadAcc || 0) + (dx / d) * (a || 0.1) * (1 - d / (r * 1.6));
  }
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = a; c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}
// THE AURA SENSE. While she holds crystal light — the quarried shard on the
// way back, then the forged sword, then the joined blade — the world shows
// its allegiances. She glows halo-white; hostile machines carry a faint
// purple glow, guardians a reddish one, and the woken and the purified a
// blue one. Deliberately QUIET (the owner: "it shouldn't be obvious. It's
// just a glow") — low alpha in the additive pass, a slow shared breath, no
// outlines. The infected sages' black-halo-with-ember variant hangs off the
// same sense when the sages land; black cannot be additive, so theirs will
// be a dark ring pass of its own.
function auraSense() {
  if (!G.save) return false;
  const f = G.save.flags || {};
  return !!(f.crystal || f.crystal2 || (G.save.bag && G.save.bag.cshard));
}
function drawLights(P) {
  c.save(); c.globalCompositeOperation = 'lighter';
  G._shadAcc = 0;
  // her presence light — the reason she is findable in a dark room. It was a
  // 150px pool centred low enough that its bottom half painted the floor
  // beneath her (the owner, twice: the light under her feet). Now a tight
  // rim on the upper body whose gradient dies at her ankles: she still
  // carries light, the ground under her carries only her shadow. Dash and
  // heal still flare it — those are moments, not a standing lamp.
  if (player && !player.dead)
    lightAt(player.x + 12, player.y + 12, 56, P.glow, 0.15 + (player.dashT > 0 ? 0.14 : 0) + (player.healT > 0 ? 0.12 : 0));
  G._auraCount = 0;
  if (auraSense() && player && !player.dead && G.state !== 'FILM') {
    const pu = 0.8 + Math.sin(performance.now() / 640) * 0.2;
    // the halo rides her BODY, not the floor: centred on her chest at a
    // radius that dies out above her feet, so the sense reads as a glow on
    // her and never as a lit disc she is standing on (the owner: "a circuit
    // of light underneath its legs instead of the actual shadowing")
    lightAt(player.x + player.w / 2, player.y + player.h * 0.35, 74, '#ffffff', 0.13 * pu);
    G._auraCount++;
    for (const e of G.enemies) {
      if (e.dead) continue;
      // the sages carry their OWN halos: black-with-ember while infected
      // (drawn with the body — black cannot ride this additive pass), blue
      // once purified. Counted here either way so the sense reads complete.
      if (e.kind === 'sage') {
        if (e.tame) lightAt(e.x + e.w / 2, e.y + e.h / 2, 60, '#57a8ff', 0.14 * pu);
        G._auraCount++;
        continue;
      }
      lightAt(e.x + e.w / 2, e.y + e.h / 2, 46 + Math.max(e.w, e.h) * 0.4, '#b06aff', 0.13 * pu);
      G._auraCount++;
    }
    if (G.boss && !G.boss.dead && G.boss.st !== 'dorm' && G.boss.st !== 'intro') {
      // a dormant guardian keeps its secret — the halo lights when IT wakes
      const pet = typeof isPet === 'function' && isPet(G.boss);
      lightAt(G.boss.x + G.boss.w / 2, G.boss.y + G.boss.h / 2,
        70 + Math.max(G.boss.w, G.boss.h) * 0.35,
        pet ? '#57a8ff' : '#ff5f6d', (pet ? 0.12 : 0.14) * pu);
      G._auraCount++;
    }
    for (const s of G.statics) {
      if (s.type !== 'npc' || !npcLive(s)) continue;
      lightAt(s.x + s.w / 2, s.y + s.h / 2, 52, '#57a8ff', 0.12 * pu);
      G._auraCount++;
    }
    // the den's work lamp: once Ratchet is awake and at his bench, the pool
    // under the painting's hanging lamp becomes a real light, so he works lit
    // instead of standing in the ambient dark like a second powered-down body
    if (G.roomId === 'A0B') {
      const rs = G.statics.find(q => q.type === 'npc');
      if (rs && npcLive(rs)) {
        lightAt(19.5 * TILE, (G.roomDef.h - 3) * TILE, 170, '#ffd28a', 0.28);
        G._auraCount++;
      }
    }
  }
  for (const p of G.projs) lightAt(p.x, p.y, 62, p.color, 0.4);
  if (G.boomer) lightAt(G.boomer.x, G.boomer.y, 72, '#e8f4ff', 0.5);
  for (const s of G.statics) {
    if (s.type === 'pillar') lightAt(s.x + s.w / 2, s.y + s.h * 0.4, 210, '#cfe8ff', 0.5);
    if (s.type === 'bench') lightAt(s.x + s.w / 2, s.y, 80, '#aef7d8', 0.22);
    else if (s.type === 'mod') lightAt(s.x + 12, s.y + 12, 90, P.glow, 0.4);
    else if (s.type === 'chest' && !s.opened) lightAt(s.x + s.w / 2, s.y + 10, 55, '#ffd76a', 0.28);
  }
  if (G.boss && !G.boss.dead) lightAt(G.boss.cx(), G.boss.cy(), 180, P.glow, 0.16);
  for (const p of G.pickups) if (p instanceof Scrap) lightAt(p.x + 5, p.y + 5, 26, '#ffd76a', 0.3);
  // commit this frame's light direction for her shadow (read next frame)
  G._shadX = clamp((G._shadAcc || 0) * 5, -1, 1);
  c.restore(); c.globalAlpha = 1;
}
let bloomCv = null, bloomCtx = null, bloomOK = true;
function applyBloom(k) {
  if (!bloomOK) return;
  if (typeof QUAL !== 'undefined' && !QUAL.bloom) return;   // the first thing a phone gives up
  if (!bloomCv) {
    bloomCv = document.createElement('canvas'); bloomCv.width = 384; bloomCv.height = 216;
    bloomCtx = bloomCv.getContext('2d');
    if (typeof bloomCtx.filter !== 'string') { bloomOK = false; return; }
  }
  // HIGHLIGHT EXTRACTION BY SQUARING. A contrast curve lifts the mid-tones
  // along with the highlights, so blooming through one washes the whole frame
  // in haze. Drawing the frame over itself with multiply squares every channel
  // instead: a bright pixel at 0.9 stays 0.81 and a mid at 0.3 falls to 0.09,
  // which leaves only what is genuinely emitting — the pour, her visor, the
  // crystal seams — to bleed.
  bloomCtx.filter = 'none';
  bloomCtx.globalCompositeOperation = 'source-over';
  bloomCtx.clearRect(0, 0, 384, 216);
  bloomCtx.drawImage(cv, 0, 0, 384, 216);
  bloomCtx.globalCompositeOperation = 'multiply';
  bloomCtx.drawImage(cv, 0, 0, 384, 216);
  bloomCtx.globalCompositeOperation = 'source-over';
  c.save();
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.34 * (k == null ? 1 : k);
  c.filter = 'blur(5px)';
  c.drawImage(bloomCv, 0, 0, 960, 540);
  c.filter = 'none';
  c.restore();
  c.globalAlpha = 1;
}
function drawWorldFrame() {
  const P = PAL[G.roomDef.zone];
  drawBG(P, cam.x, cam.y);
  // The roof, before the tiles: it is the far wall of the room's top, and
  // anything solid the level actually built up there should occlude it.
  if (!(typeof isHero === 'function' && isHero())) drawCeiling(G.roomDef.zone);
  // ART_BIBLE §9.1/§9.4 — THE BACKGROUND PASS. Everything drawn so far is the
  // far plane, and this is the only moment it can be graded alone: after it,
  // the terrain and the cast land on top and a full-frame wash can no longer
  // tell them apart. Measured before this existed, every room read 16/16/11
  // across far/mid/near — five points of range in the whole picture — and the
  // background came back MORE saturated than the plane the player stands on.
  // Pushing the background down and the chroma out of it is what buys the
  // depth the single end-of-frame wash never could.
  bgPlanePass();
  // THE PLANE PROBE — the measurement hook for ART_BIBLE §9.1/§9.4, and the
  // reason it exists is that the obvious test is wrong. Sampling the top third
  // of the frame as "far" only works if height correlates with depth; here the
  // backdrop is a wall filling the frame at every height, so a band test
  // measures vertical composition and calls it depth. THIS is the only instant
  // the background exists alone on the canvas, so it is the only honest place
  // to measure it. Off unless a harness asks: it costs a full readback.
  if (G.planeProbe) G.planeProbe.bg = framePlaneStats();
  // THE MID PLATE IS NOT DRAWN. It was the second floor: a ground-level wreck
  // field with its own rail run and ground edge, so wherever it was placed it
  // read as a floor, and the player could not tell which of the two was hers.
  // Pushing it back — half parallax, dimmed, lifted clear of her line — helped
  // and did not fix it, because the plate DEPICTS ground and a depicted ground
  // line competes at any distance.
  //
  // The rule it breaks is about depth, not about art: terrain-like shapes may
  // not sit at the player's plane. The plates stay in the repo, keyed and
  // archived; a distant wreck field belongs in drawBG with the skyline, and
  // that is where it should return. The near plate stays — a foreground
  // occluder crosses IN FRONT of her and can never be mistaken for footing.
  c.save();
  c.translate(-Math.round(camSX()), -Math.round(camSY()));
  drawLair();                       // behind the level — see the LAIR table
  drawRoomProp();                   // the cradle, the gates — see ROOM_PROP
  drawFlora();                      // ...and what grows in it — see FLORA
  if (tileDirty) renderTileLayer(P);
  // §9.1 — the playable plane is the TILE LAYER, not the bottom third of the
  // screen. Measuring a screen band called the floor "near" while it was
  // mostly backdrop, and reported a negative delta for a frame that had just
  // been correctly separated. The terrain is a canvas of its own; measure it.
  if (G.planeProbe && !G.planeProbe.mid) G.planeProbe.mid = layerStats(tileCv);
  c.drawImage(tileCv, 0, 0);
  drawInteriorFloor();              // a painting-room walks on the painting's floor
  drawFrontier();                   // the next kingdom, seen from the last room
  // X1 hardlight bridge: alive while the Prowler stands, red and flickering
  // through the collapse, gone when the wreck settles
  if (G.roomId === 'X1' && G.x1Bridge && G.boss && (!G.boss.dead || (G.boss.deathAnimT || 0) > 0)) {
    const dying = G.boss.dead;
    const tn2 = performance.now();
    const fl = dying ? 0.45 + Math.sin(tn2 / 38) * 0.3 : 0.7 + Math.sin(tn2 / 300) * 0.15;
    const col = dying ? '#ff5f6d' : '#37ffd0';
    const bx0 = 6 * TILE, bw2 = 3 * TILE, by0 = 15 * TILE;
    c.save();
    // emitter posts at both ends
    c.fillStyle = '#2a3038';
    c.fillRect(bx0 - 6, by0 - 4, 8, 12); c.fillRect(bx0 + bw2 - 2, by0 - 4, 8, 12);
    // hardlight slats
    c.globalAlpha = fl;
    c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 12;
    for (let i = 0; i < 6; i++)
      c.fillRect(bx0 + 3 + i * (bw2 - 6) / 6, by0, (bw2 - 6) / 6 - 3, 5);
    c.shadowBlur = 0;
    c.globalAlpha = fl * 0.4;
    c.fillRect(bx0, by0 + 5, bw2, 2);
    c.restore();
  }
  // D3 kernel seal (dynamic, drawn over the cached tiles)
  if (G.roomId === 'D3' && !G.save.flags.bossZero) {
    const spu = 0.5 + Math.sin(performance.now() / 300) * 0.2;
    c.fillStyle = 'rgba(224,90,255,' + (0.3 * spu + 0.25) + ')';
    c.fillRect(15 * TILE, 15 * TILE, 3 * TILE, 2 * TILE);
    ftxt('✦', 16.5 * TILE, 15.8 * TILE, 22, '#e05aff', 'center', '#e05aff');
  }
  // ambient darkness — dynamic lights lift what matters
  c.fillStyle = 'rgba(3,6,14,0.16)';
  c.fillRect(cam.x - 12, cam.y - 12, 984, 564);
  // THE BRAID writes itself onto the air of the room. A kingdom still deep in
  // the rot runs violet; one she has bought back runs clean. STARLESS worlds
  // lose the ceiling lights entirely.
  if (typeof universe === 'function') {
    const U = universe(), zi = U.inf[G.roomDef.zone] != null ? U.inf[G.roomDef.zone] : 1;
    if (zi > 0.4) {
      c.fillStyle = 'rgba(120,20,90,' + ((zi - 0.4) * 0.13).toFixed(3) + ')';
      c.fillRect(cam.x - 12, cam.y - 12, 984, 564);
    } else if (zi < 0.25) {
      c.fillStyle = 'rgba(60,220,190,' + ((0.25 - zi) * 0.1).toFixed(3) + ')';
      c.fillRect(cam.x - 12, cam.y - 12, 984, 564);
    }
    if (U.darkK) { c.fillStyle = 'rgba(2,4,10,0.4)'; c.fillRect(cam.x - 12, cam.y - 12, 984, 564); }
  }
  drawStatics(P);
  drawSpikeMenace();
  drawBreakHint();
  for (const p of G.pickups) p.draw(c);
  if (G.pools) for (const q of G.pools) {
    const a = Math.min(1, q.t / 0.8) * 0.55;
    c.save();
    c.globalAlpha = a;
    const g3 = c.createLinearGradient(0, q.y - 8, 0, q.y + 3);
    g3.addColorStop(0, 'rgba(180,255,120,0.5)'); g3.addColorStop(1, 'rgba(90,190,60,0.15)');
    c.fillStyle = g3;
    c.beginPath(); c.ellipse(q.x, q.y, q.r, 5.5, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(200,255,150,' + (0.5 * a).toFixed(2) + ')'; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(q.x, q.y, q.r, 5.5, 0, 0, 7); c.stroke();
    // it bubbles, so it reads as active rather than as a decal
    if (chance(0.25 * a)) addPart(q.x + rnd(-q.r, q.r), q.y - 2, rnd(-10, 10), rnd(-40, -12), 0.4, '#c8ff96', 1.8, 60, true);
    c.restore(); c.globalAlpha = 1;
  }
  // THE PILE IS AN OBJECT, NOT SCENERY. It was briefly drawn with the cave
  // mouth in the backdrop pass, where the room's own haze washed it down to a
  // ghost — correctly, because that pass is for painted distance. She stands
  // beside this and hits it, so it belongs in the world layer with everything
  // else that has a hitbox, in front of the terrain and behind her.
  if (G.rubbles && typeof drawRubble === 'function')
    for (const rb of G.rubbles) drawRubble(rb, rb.x, rubbleFoot(rb) + 4, PAL[G.roomDef.zone]);
  if (G.plats) for (const pl of G.plats) pl.draw(c);
  if (G.saws) for (const sw of G.saws) sw.draw(c);
  for (const e of G.enemies) e.draw(c);
  for (const w of G.wrecks) w.draw(c);
  if (G.boss) G.boss.draw(c);
  if (typeof drawPetFx === 'function') { drawPetFx(c); drawPetBond(c); }
  for (const p of G.projs) p.draw(c);
  if (G.boomer && typeof drawBoomer === 'function') drawBoomer(c);
  if (typeof drawGatePrompt === 'function') drawGatePrompt();
  if (typeof drawRoarFX === 'function') drawRoarFX(c);
  // the player is drawn AFTER the cinematic grade (bloom + zone wash) so she
  // stays solid and rich instead of being swallowed by the atmosphere — the
  // one exception is the recharge pod, whose cables and canopy must close
  // over her, so she stays in-world for that scene
  if (player && G.recharge) player.draw(c);
  // recharge at a pod: cables hook onto the robot, surge arcs, glass canopy closes
  if (G.recharge && player) {
    const rc = G.recharge;
    const dp = rc.phase === 'dock' ? clamp(1 - rc.dockT / rc.dock0, 0, 1) : 1;
    const hero = typeof isHero === 'function' && isHero();
    if (!hero) {
      // charge cables snake out of the pod and plug into the robot
      const cable = (ax, ay, bx, by, prog) => {
        const ex = ax + (bx - ax) * prog, ey = ay + (by - ay) * prog;
        const mxc = (ax + ex) / 2, myc = Math.max(ay, ey) + 12;
        c.lineCap = 'round';
        c.strokeStyle = '#222b36'; c.lineWidth = 3.4;
        c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mxc, myc, ex, ey); c.stroke();
        c.save(); c.globalCompositeOperation = 'lighter';
        c.strokeStyle = 'rgba(140,246,255,' + (0.5 + 0.4 * Math.sin(performance.now() / 90 + ax)) + ')';
        c.lineWidth = 1.3;
        c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mxc, myc, ex, ey); c.stroke();
        c.restore();
        if (prog > 0.7) { c.fillStyle = '#8ff6ff'; c.shadowColor = '#8ff6ff'; c.shadowBlur = 6; c.fillRect(ex - 2.5, ey - 2.5, 5, 5); c.shadowBlur = 0; }
      };
      const px = player.x, py = player.y;
      cable(rc.x, rc.podTop + 2, px + 12, py + 4, dp);
      cable(rc.x - 20, rc.podTop + rc.podH - 18, px + 3, py + 13, dp);
      cable(rc.x + 20, rc.podTop + rc.podH - 18, px + 21, py + 13, dp);
    }
    // ROBOT: electric surge arcs jumping over the robot (once seated + charging)
    if (!hero && rc.phase === 'charge') {
      c.save(); c.globalCompositeOperation = 'lighter';
      c.strokeStyle = '#8ff6ff'; c.shadowColor = '#8ff6ff'; c.shadowBlur = 12;
      const tx2 = player.x + 12, ty2 = player.y + 14;
      for (let k = 0; k < 2; k++) {
        c.lineWidth = k ? 1.2 : 2.4; c.globalAlpha = rnd(0.4, 0.95);
        c.beginPath();
        c.moveTo(rc.x, rc.y - 16);
        for (let s2 = 1; s2 <= 4; s2++) {
          const q = s2 / 5;
          c.lineTo(rc.x + (tx2 - rc.x) * q + rnd(-9, 9),
                   (rc.y - 16) + (ty2 - (rc.y - 16)) * q + rnd(-9, 9));
        }
        c.lineTo(tx2, ty2); c.stroke();
      }
      c.restore(); c.globalAlpha = 1;
    }
    // HERO: dip a chalice in the fountain and drink the elixir of life (cinematic)
    if (hero && rc.phase === 'charge') {
      const cp = clamp(1 - rc.t / (rc.dur || 1.4), 0, 1);   // 0→1 over the drink
      const hx = player.x + player.w / 2, hmouth = player.y + 9;
      const basinX = rc.x, basinY = rc.podTop + 20;
      // choreography: dip(0-.28) → raise(.28-.5) → drink(.5-.9) → lower(.9-1)
      let cxp, cyp, tip;
      if (cp < 0.28) { const k = cp / 0.28; cxp = lerp(hx + 12, basinX, k); cyp = lerp(player.y + 18, basinY - 2, k); tip = 0; }
      else if (cp < 0.5) { const k = (cp - 0.28) / 0.22; cxp = lerp(basinX, hx + 6, k); cyp = lerp(basinY - 2, hmouth, k); tip = 0; }
      else if (cp < 0.9) { cxp = hx + 6; cyp = hmouth; tip = Math.min(1, (cp - 0.5) / 0.12) * 0.6; }
      else { const k = (cp - 0.9) / 0.1; cxp = hx + 6; cyp = lerp(hmouth, player.y + 16, k); tip = 0.6 * (1 - k); }
      const drinking = cp >= 0.5 && cp < 0.95;
      // warm cinematic vignette + golden glow rising from the hero while drinking
      if (drinking) {
        c.save(); c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.16 + Math.sin(performance.now() / 130) * 0.05;
        const gg = c.createRadialGradient(hx, player.y + 14, 4, hx, player.y + 14, 46);
        gg.addColorStop(0, '#ffe8a0'); gg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gg; c.beginPath(); c.arc(hx, player.y + 14, 46, 0, 7); c.fill();
        c.restore(); c.globalAlpha = 1;
        if (chance(0.5)) addPart(hx + rnd(-10, 10), player.y + rnd(0, 20), rnd(-12, 12), rnd(-40, -12), 0.6, '#ffe08a', 2, -30, true);
      }
      // stream of light from basin to cup while dipping/filling
      if (cp < 0.3) {
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,232,160,0.6)';
        c.lineWidth = 2; c.beginPath(); c.moveTo(basinX, basinY); c.lineTo(cxp, cyp); c.stroke(); c.restore();
      }
      // the chalice (goblet) with glowing elixir
      c.save(); c.translate(cxp, cyp); c.rotate(tip);
      c.fillStyle = '#caa24a'; // gold stem/base
      c.fillRect(-1.5, 2, 3, 6); c.fillRect(-4, 8, 8, 2);
      const cupg = c.createLinearGradient(0, -5, 0, 3);
      cupg.addColorStop(0, '#e6c56f'); cupg.addColorStop(1, '#a8842e');
      c.fillStyle = cupg;
      c.beginPath(); c.moveTo(-5, -5); c.lineTo(5, -5); c.lineTo(3.5, 3); c.lineTo(-3.5, 3); c.closePath(); c.fill();
      // elixir surface glow
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = '#fff3c0'; c.shadowColor = '#ffe08a'; c.shadowBlur = 8;
      c.beginPath(); c.ellipse(0, -4.5, 4.2, 1.6, 0, 0, 7); c.fill();
      c.restore();
      c.restore();
      // golden droplets while drinking
      if (drinking && chance(0.25)) addPart(cxp + rnd(-2, 2), cyp - 4, rnd(-6, 6), rnd(10, 40), 0.4, '#ffe08a', 1.6, 200, true);
    }
    if (!hero) {
      // front glass canopy — sealing the robot inside the capsule
      const tY = rc.podTop + 6, tH = rc.podH - 16;
      const cg = c.createLinearGradient(rc.x - 18, 0, rc.x + 18, 0);
      cg.addColorStop(0, 'rgba(190,240,255,' + (0.05 * dp) + ')');
      cg.addColorStop(0.45, 'rgba(190,240,255,' + (0.16 * dp) + ')');
      cg.addColorStop(1, 'rgba(120,200,230,' + (0.05 * dp) + ')');
      c.fillStyle = cg; rr(c, rc.x - 18, tY, 36, tH, 12); c.fill();
      c.strokeStyle = 'rgba(255,255,255,' + (0.28 * dp) + ')'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(rc.x - 9, tY + 8); c.lineTo(rc.x - 13, tY + tH - 12); c.stroke();
      c.strokeStyle = 'rgba(95,150,180,' + (0.5 * dp) + ')'; c.lineWidth = 2;
      rr(c, rc.x - 18, tY, 36, tH, 12); c.stroke();
    }
  }
  // THUNDERFALL — a bolt from Olympus tearing down out of the sky
  if (G.bolt && G.bolt.t > 0) {
    const bt = G.bolt, k = bt.t / bt.t0;
    c.save(); c.globalCompositeOperation = 'lighter';
    // pillar of light where it lands
    const pg = c.createLinearGradient(bt.x, bt.y - 540, bt.x, bt.y);
    pg.addColorStop(0, 'rgba(255,246,192,0)');
    pg.addColorStop(0.7, 'rgba(255,225,140,' + (0.18 * k) + ')');
    pg.addColorStop(1, 'rgba(255,255,255,' + (0.4 * k) + ')');
    c.fillStyle = pg; c.fillRect(bt.x - 34, bt.y - 540, 68, 540);
    // the jagged bolt itself, redrawn each frame so it crackles
    for (let pass = 0; pass < 2; pass++) {
      c.strokeStyle = pass ? '#ffffff' : '#ffd76a';
      c.lineWidth = pass ? 3 : 8; c.lineCap = 'round'; c.lineJoin = 'round';
      c.shadowColor = '#ffd76a'; c.shadowBlur = pass ? 10 : 26;
      c.globalAlpha = Math.min(1, k * 1.6);
      c.beginPath(); c.moveTo(bt.x + rnd(-8, 8), bt.y - 540);
      for (let sy = bt.y - 460; sy < bt.y; sy += 60) c.lineTo(bt.x + rnd(-22, 22), sy);
      c.lineTo(bt.x, bt.y); c.stroke();
    }
    c.shadowBlur = 0;
    // ground burst
    c.globalAlpha = k;
    const bg2 = c.createRadialGradient(bt.x, bt.y, 2, bt.x, bt.y, 60 * (1.4 - k));
    bg2.addColorStop(0, 'rgba(255,255,255,0.9)'); bg2.addColorStop(1, 'rgba(255,200,80,0)');
    c.fillStyle = bg2; c.beginPath(); c.arc(bt.x, bt.y, 60 * (1.4 - k), 0, 7); c.fill();
    c.restore(); c.globalAlpha = 1;
  }
  drawParts(c);
  drawLights(P);
  for (const r of G.rings) {
    c.globalAlpha = r.a; c.lineWidth = 3.5; c.strokeStyle = '#ffffff';
    c.beginPath(); c.arc(r.x, r.y, r.r, 0, 7); c.stroke();
    c.globalAlpha = 1;
  }
  drawSeals(P);
  c.restore();
  // THE NEAR PLATE IS OFF UNTIL IT IS RE-FIRED, and the reason is a mistake in
  // my own brief: it asked for a NEAR-BLACK silhouette on a BLACK field, and
  // then the keyer cut it by luminance. A near-black subject on a black ground
  // cannot be luminance-keyed — subject and field are the same value. Measured
  // on fore_a.png: the source is 100% opaque at mean luminance 5, and after
  // keying only 18.8% survived at mean luminance 23.8, of which 45.8% is
  // bluish. The keyer deleted the body and kept the indicator lights. That is
  // the floating blue the owner asked about — a foreground layer reduced to its
  // own light-pips.
  // Re-fired on a WHITE field so a near-black silhouette can actually be cut
  // from it: 29-51% of each plate now survives the key at mean luminance
  // 2.5-14.7, against 18.8% at luminance 23.8 before, of which nearly half was
  // the blue pips.
  drawDepthPlane('fore');
  applyBloom();
  // ---- cinematic grade: zone-tinted light wash + vignette (the "expensive" look) ----
  {
    const P2 = PAL[G.roomDef.zone];
    c.save();
    // warm/cool light wash pulled from the zone's own glow colour
    c.globalCompositeOperation = 'overlay';
    c.globalAlpha = 0.14;
    const wash = c.createLinearGradient(0, 0, 0, 540);
    wash.addColorStop(0, P2.glow); wash.addColorStop(0.55, 'rgba(128,128,128,0)'); wash.addColorStop(1, P2.dark);
    c.fillStyle = wash; c.fillRect(0, 0, 960, 540);
    c.restore();
    // vignette — darkens the frame edges so the action reads as lit
    c.save();
    const vig = c.createRadialGradient(480, 270, 210, 480, 270, 620);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.65, 'rgba(0,0,0,0.18)');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = vig; c.fillRect(0, 0, 960, 540);
    c.restore();
  }
  // the character herself, post-grade: full pigment, no bloom wash. Her own
  // emissive accents (visor, jets, claws) still glow via their shadowBlur.
  // ...and NOT while she is walking into the gates. drawGateWalk draws her
  // from behind, in screen space, shrinking toward the gap; leaving the live
  // body on as well put two of her on screen at once — the one going in, and
  // the one standing where she left.
  if (player && !G.recharge && !G.gateWalk) {
    c.save();
    c.translate(-Math.round(camSX()), -Math.round(camSY()));
    player.draw(c);
    c.restore();
  }
  // ...and the edge of the world OVER her, so the last few pixels of her feet
  // pass behind it. See the fringe block above: this draw order is the effect.
  c.save();
  c.translate(-Math.round(camSX()), -Math.round(camSY()));
  drawFringe();
  c.restore();
  // THE SCREEN LIFT, on the WORLD only — after the room, the cast and the
  // fringe, and before the HUD and the films. The HUD is already legible and
  // its dark panels are what make the text on them readable; screening those
  // up would wash the interface to fix the world.
  drawScreenLift();
  // manga impact frame: white panel + radial action lines
  if (G.impact && G.impact.t > 0) {
    const k = G.impact.t / G.impact.t0;
    const sx = G.impact.x - cam.x, sy = G.impact.y - cam.y;
    c.fillStyle = 'rgba(255,255,255,' + (0.82 * k) + ')';
    c.fillRect(0, 0, 960, 540);
    c.save();
    c.strokeStyle = 'rgba(10,16,26,' + (0.9 * k) + ')';
    c.lineWidth = 5; c.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2 + 0.13;
      const r1 = 90 + hash2(i, 3) * 120, r2 = 620;
      c.beginPath();
      c.moveTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1);
      c.lineTo(sx + Math.cos(a) * r2, sy + Math.sin(a) * r2);
      c.stroke();
    }
    c.restore();
  }
  // anime dash speed-lines across the screen
  if (player && player.dashT > 0) {
    c.save(); c.globalAlpha = 0.22;
    c.strokeStyle = '#ffffff'; c.lineWidth = 2;
    const ang = Math.atan2(player.dashVY, player.dashVX);
    for (let i = 0; i < 10; i++) {
      const yy = hash2(i, 77) * 540, xx = hash2(i, 78) * 960;
      const len = 180 + hash2(i, 79) * 320;
      c.beginPath();
      c.moveTo(xx, yy);
      c.lineTo(xx - Math.cos(ang) * len, yy - Math.sin(ang) * len);
      c.stroke();
    }
    c.restore();
  }
  if ((G.iceT || 0) > 0) {
    // COOLANT FREEZE: blue mist hangs in the room while the floor is glass
    const k = Math.min(1, G.iceT / 1.2) * Math.min(1, (7.5 - G.iceT) * 2 + 1);
    c.fillStyle = 'rgba(120,200,255,' + (0.1 * k) + ')';
    c.fillRect(0, 0, 960, 540);
    c.save(); c.globalAlpha = 0.22 * k; c.fillStyle = '#cfeeff';
    for (let i = 0; i < 8; i++) {
      const mx = (i * 137 + performance.now() * 0.012 * (1 + i * 0.13)) % 1060 - 50;
      const my = 380 + Math.sin(i * 2.4 + performance.now() * 0.0005) * 60;
      c.beginPath(); c.ellipse(mx, my, 90, 16, 0, 0, 7); c.fill();
    }
    c.restore();
  }
  if ((G.lowGravT || 0) > 0.05) {
    // NULL GRAVITY: the whole frame breathes faint virus purple
    c.fillStyle = 'rgba(150,90,255,' + Math.min(0.12, G.lowGravT * 0.1) + ')';
    c.fillRect(0, 0, 960, 540);
  }
  if ((G.revT || 0) > 0) {
    // MOTHER'S SONG: the world runs red and mirrored inputs — lean into it
    c.fillStyle = 'rgba(230,57,70,' + Math.min(0.16, G.revT * 0.1) + ')';
    c.fillRect(0, 0, 960, 540);
  }
  if ((G.darkT || 0) > 0 && G.state === 'PLAY') {
    // TOTAL NULL: the arena lights die. You see yourself, her golden core,
    // and — while the Song rings — her whole shape.
    const dk = Math.min(1, G.darkT * 3);
    c.save();
    c.fillStyle = 'rgba(4,4,10,' + (0.92 * dk * ((G.revealT || 0) > 0 ? 0.45 : 1)) + ')';
    c.beginPath(); c.rect(0, 0, 960, 540);
    const pxs = player.x + player.w / 2 - cam.x, pys = player.y + player.h / 2 - cam.y;
    c.arc(pxs, pys, 68, 0, 7, true);
    if (G.boss && !G.boss.dead) {
      const bx = G.boss.cx() - cam.x, by = G.boss.cy() - cam.y;
      c.arc(bx, by, (G.revealT || 0) > 0 ? 150 : 26, 0, 7, true);
    }
    c.fill('evenodd');
    c.restore();
  }
  // ...and what falls off it, in FRONT of everything: a drip you watch pass
  // behind the cat is scenery, one that passes in front of her is a room.
  if (!(typeof isHero === 'function' && isHero())) drawCeilWeather(G.roomDef.zone);
  // THE BADGE BELONGS IN THE GAME TOO. It was only ever drawn over the opening
  // film, so a player whose audio never unlocked — anyone on a controller —
  // reached the game and found it silent, with nothing on screen explaining
  // why or what to do. It draws itself only while sound is actually locked.
  if (typeof drawSoundChip === 'function') drawSoundChip(performance.now() / 1000);
  lightPass(P);
  if (G.flash > 0) {
    c.fillStyle = 'rgba(255,255,255,' + (G.flash * 0.32) + ')';
    c.fillRect(0, 0, 960, 540);
  }
  scanOverlay();
}
// ===========================================================================
// THE LIGHT IN THE ROOM.
//
// Every character in this game carries its own lighting, baked in when it was
// drawn or rendered, and none of it knows where it is standing. HZD-99 is lit
// cool white in the Foundry, where everything else in frame is lit by molten
// iron; the Archive's machines are lit the same way they were in the Meadows.
// That is the last thing making them read as pasted onto the scene rather than
// standing in it — bosses had hard edges, which is fixed, but nothing had the
// room's light on it.
//
// Two passes, both full-frame, so the rule is the same for every object no
// matter how its art was made:
//
//   WASH  a multiply in the kingdom's own colour, stronger toward the floor
//         and away from the light, so a neutral sprite is pulled into the
//         room's palette without touching the art that made it.
//   BLOOM highlights bleed. The frame is squared against itself at quarter
//         resolution — which crushes the darks and leaves only what is
//         genuinely bright — blurred, and added back. Now the lava pour, her
//         visor and the crystal seams actually emit instead of merely being
//         light-coloured.
//
// Both are gated on the same frame budget as the background's depth plate: a
// prettier picture is never the reason the game stops feeling good.
// ===========================================================================
const ZONE_LIGHT = {
  A: { wash: [120, 190, 175], k: 0.16, from: 0.18 },  // Scrap Meadows — dead daylight
  B: { wash: [110, 150, 210], k: 0.18, from: 0.5 },   // Data Conduits — screen-blue
  C: { wash: [255, 150, 70], k: 0.30, from: 0.42 },   // The Foundry — molten iron
  D: { wash: [140, 190, 235], k: 0.26, from: 0.5 },   // Frozen Archives — ice light
  E: { wash: [230, 90, 110], k: 0.28, from: 0.5 },    // The Virus Nest — infection red
  X: { wash: [210, 140, 235], k: 0.24, from: 0.5 },   // Crystal Cache — prism glow
};
// ART_BIBLE §9.1 THREE-PLANE VALUE LAW and §9.4 THE TWO-COLOUR SCRIPT.
//
// Two composites over the far plane only, and between them they are the whole
// of the aerial perspective this game never had:
//
//   1. DESATURATE. A grey plate in 'saturation' mode pulls the background's
//      chroma toward its own luminance. This is the half that matters most —
//      tests/grammar.cjs measured the background as MORE saturated than the
//      playable plane in every room sampled, which is exactly backwards, and
//      is why nothing in the cast could pop without popArt() shouting.
//   2. DARKEN + HAZE. A multiply toward the zone's shadow, then a thin veil of
//      the zone's light on top. The veil is what stops the darkened background
//      reading as merely underexposed: haze lifts the blacks as it removes
//      contrast, which is what distance actually does to a picture.
//
// It is deliberately NOT on the richK budget. lightPass is a luxury and drops
// first; this is the frame's depth structure, and a frame that loses it does
// not look cheaper, it looks flat. That was the §11 finding in the teardown:
// the one thing holding the picture together was the first thing switched off.
// Mean luminance and mean saturation of whatever is currently on the canvas,
// 0..100 each. Used only by the plane probe above and by tests/grammar.cjs.
// Same statistics over an offscreen layer, ignoring its transparent pixels —
// terrain is mostly holes, and counting them as black makes any solid look dim.
function layerStats(cv) {
  const cx = cv.getContext('2d');
  const im = cx.getImageData(0, 0, cv.width, cv.height).data;
  let L = 0, S = 0, n = 0;
  for (let y = 0; y < cv.height; y += 3) {
    for (let x = 0; x < cv.width; x += 3) {
      const i = ((y * cv.width + x) << 2);
      if (im[i + 3] < 60) continue;
      const r = im[i], g = im[i + 1], b = im[i + 2];
      L += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 2.55;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      // ABSOLUTE chroma (spread over the full range), not relative to the
      // brightest channel. Relative chroma is nonsense on dark pixels — a
      // near-black rgb(30,12,4) scores 87 — and that artefact is what made the
      // Foundry look like it was ignoring a desaturation pass that was in fact
      // working: the pass moved the numbers barely at all across a fourfold
      // change in strength, which is the signature of a broken measurement
      // rather than a stubborn frame.
      S += ((mx - mn) / 255) * 100;
      n++;
    }
  }
  return n ? { lum: L / n, sat: S / n } : null;
}

function framePlaneStats() {
  const im = c.getImageData(0, 0, 960, 540).data;
  let L = 0, S = 0, n = 0;
  for (let y = 0; y < 540; y += 4) {
    for (let x = 0; x < 960; x += 4) {
      const i = (y * 960 + x) << 2;
      const r = im[i], g = im[i + 1], b = im[i + 2];
      L += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 2.55;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      S += ((mx - mn) / 255) * 100;   // ABSOLUTE chroma: see layerStats
      n++;
    }
  }
  return { lum: L / n, sat: S / n };
}

// §10.7 for the FAR PLANE. The anti-tiling work in the tile layer did nothing
// for B4 and C3 because their 32px autocorrelation was never in the terrain —
// it is the backdrop drawing the same motif every tile pitch. The background
// is redrawn every frame, so per-pixel work there is not affordable; a mottle
// baked ONCE and composited is. Its features are deliberately sized off the
// tile pitch (11, 19, 29px) so it cannot reinforce the thing it is breaking.
let bgMottleCv = null;
function bgMottle() {
  if (bgMottleCv) return bgMottleCv;
  const cv = document.createElement('canvas');
  cv.width = 960; cv.height = 540;
  const x = cv.getContext('2d');
  x.fillStyle = 'rgb(128,128,128)';
  x.fillRect(0, 0, 960, 540);
  for (let i = 0; i < 520; i++) {
    const px2 = hash2(i, 61) * 960, py2 = hash2(i, 67) * 540;
    const r = 11 + hash2(i, 71) * 18;
    const up = hash2(i, 73) < 0.5;
    const g = x.createRadialGradient(px2, py2, 0, px2, py2, r);
    const v = up ? 168 : 92;
    g.addColorStop(0, 'rgba(' + v + ',' + v + ',' + v + ',0.55)');
    g.addColorStop(1, 'rgba(128,128,128,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(px2, py2, r, 0, 7); x.fill();
  }
  // ...AND A SECOND LAYER AT SCREEN SCALE, because the first one cannot reach
  // the failure it is aimed at. Blobs 11-29px wide break a 32px pitch and do
  // essentially nothing to a match found 868px apart — the autocorrelation
  // test slides its patch across the WHOLE screen, and at that range two
  // stretches of backdrop are told apart by broad tonal drift or not at all.
  // So: a handful of very large, very low-contrast lobes, sized so no two
  // parts of one screen sit at the same brightness. It is also simply how a
  // painted backdrop behaves — light pools and falls off across a hall.
  for (let i = 0; i < 26; i++) {
    const px2 = hash2(i, 131) * 1100 - 70, py2 = hash2(i, 137) * 640 - 50;
    const r = 90 + hash2(i, 139) * 140;
    const up = hash2(i, 149) < 0.5;
    const g = x.createRadialGradient(px2, py2, 0, px2, py2, r);
    const v = up ? 152 : 104;
    g.addColorStop(0, 'rgba(' + v + ',' + v + ',' + v + ',0.42)');
    g.addColorStop(1, 'rgba(128,128,128,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(px2, py2, r, 0, 7); x.fill();
  }
  bgMottleCv = cv;
  return cv;
}

// ART_BIBLE §9.1 — THE AUTHORED DEPTH PLANES (task #76). Two strips per zone:
// edge_ is the mid plane, the band she stands on, drawn BEHIND the cast; fore_
// is the near plane and draws in FRONT of her. Between them they are what makes
// a floor stop reading as a bar, and the reason is value rather than shape —
// the procedural floor sat within a few points of the backdrop it was supposed
// to stand clear of, and no amount of silhouette work fixes that.
//
// Parallax is the point of having two: the mid plane scrolls slower than the
// world and the fore plane faster, so they separate as she moves rather than
// only in a still frame.
let floorAnchorRoom = null, floorAnchorY = 0;
function roomFloorAnchor(fallbackWorldY) {
  if (floorAnchorRoom === G.roomId) return floorAnchorY;
  let v = fallbackWorldY;
  const cur = (typeof surfaceCurve === 'function') ? surfaceCurve() : null;
  if (cur && cur.raw) {
    const ys = [];
    for (let i = 0; i < cur.N; i++) { const y = cur.raw[i]; if (!isNaN(y)) ys.push(y); }
    if (ys.length) { ys.sort((a, b) => a - b); v = ys[ys.length >> 1]; }
  }
  floorAnchorRoom = G.roomId; floorAnchorY = v;
  return v;
}
function drawDepthPlane(kind) {
  const zone = G.roomDef && G.roomDef.zone;
  if (!zone) return;
  const key = kind + zone;
  if (typeof mediaFetch === 'function') mediaFetch(key);
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[key];
  if (!im || !im.naturalWidth) return;
  const near = kind === 'fore';
  // THE DOUBLE FLOOR. The mid plate used to sit at 0.82 parallax with its ground
  // band just above the walk line, which made it read as a SECOND FLOOR — it
  // carries a rail run and a ground edge of its own, so the player saw a wavy
  // organic floor and a flat one and could not tell which was hers. Suppressing
  // the depth planes and re-shooting the same room proved it: one floor,
  // unmistakably organic, the moment this plate was off.
  //
  // It is not deleted, because the ART is right and the rule is about DEPTH:
  // background shapes belong in the backdrop, not at the player's plane. So the
  // mid plate moves back to where it is scenery — half the parallax, smaller,
  // dimmed, and lifted so its own ground line sits well ABOVE hers and can
  // never be mistaken for something she could stand on.
  const par = near ? 1.16 : 0.42;
  const scale = (near ? 0.46 : 0.52) * 540 / im.naturalHeight;
  const w = im.naturalWidth * scale, h = im.naturalHeight * scale;
  // ANCHOR TO THE ROOM'S FLOOR, NOT TO THE VIEWPORT. Anchoring to the bottom of
  // the screen puts the crest wherever the camera happens to be, so she stood
  // below her own ground. The floor is the lowest row the grid actually calls
  // solid; the mid plane's crest goes on its top edge, and the near plane sits
  // a little below that so it crosses her shins rather than her head.
  let floorY = 540;
  const g = G.grid;
  if (g && g.length) {
    for (let ty = g.length - 1; ty >= 0; ty--) {
      let n = 0;
      for (let tx = 0; tx < g[ty].length; tx++) {
        const ch = g[ty][tx];
        if (ch === '#' || ch === 'B' || ch === '=') n++;
      }
      if (n > g[ty].length * 0.5) { floorY = ty * TILE - camSY(); break; }
    }
  }
  // ...BUT THE ANCHOR IS THE SURFACE SHE WALKS ON, not the room's lowest solid
  // row, and the difference is the whole reason the near plate did nothing.
  //
  // Measured in A1: the lowest >50%-solid row put floorY at 508 while her feet
  // were at 452. The near plate's top edge therefore landed at 454 — TWO PIXELS
  // BELOW HER SOLES — so the one object in the scene whose entire job is to
  // cross in FRONT of her drew a black band under her feet instead, and she came
  // out as the frontmost thing pasted onto a painting. That is the "she looks
  // like she is in the background" report, and no amount of art fixes it.
  //
  // The walk surface is the MEDIAN of the curve's own tile tops, taken once per
  // room. Median rather than the value under the camera: sampling live would
  // hand the foreground the terrain's roll and make it bob as she walks, and a
  // background that moves vertically with the player is worse than one in the
  // wrong place. Pits and high ledges are outvoted, which is what a median is
  // for — the answer wanted is "how high is the ground in this room".
  floorY = roomFloorAnchor(floorY + camSY()) - camSY();
  // The mid plate is a BAND whose lower part meets the floor and whose upper
  // part is the wreck standing behind it, so most of it belongs ABOVE the walk
  // line. Anchoring it below put the whole plate under the tile layer and left
  // only a sliver of glow showing. The near plate is the opposite: it hangs off
  // the bottom of the frame and only its top outline should be in shot.
  const y = near ? floorY - h * 0.22 : floorY - h * 1.02;   // mid: fully above her line
  let x = -((cam.x * par) % w);
  if (x > 0) x -= w;
  // MIRROR EVERY OTHER STAMP. This plate is one painting repeated along the
  // room, and at its own width it repeated INSIDE a single screen — the exact
  // 868px match tests/grammar.cjs kept reporting in the Foundry, which is the
  // plate's width and nothing else. Flipping alternate stamps doubles the
  // period past a screen for free and cannot open a seam: a mirrored copy
  // meets the one before it along the same edge pixels, so the join is
  // continuous by construction. The index is taken from the WORLD, not from
  // the loop, so which stamps are mirrored does not change as she walks.
  let k = Math.round((cam.x * par + x) / w);
  c.save();
  if (!near) c.globalAlpha = 0.95;
  const Wd = Math.ceil(w), Hd = Math.ceil(h), Y = Math.round(y);
  for (; x < 960; x += w - 1, k++) {
    const X = Math.round(x);
    if ((k & 1) === 0) { c.drawImage(im, X, Y, Wd, Hd); continue; }
    c.save();
    c.translate(X + Wd, Y);
    c.scale(-1, 1);
    c.drawImage(im, 0, 0, Wd, Hd);
    c.restore();
  }
  c.restore();
  c.globalAlpha = 1;
}

function bgPlanePass() {
  const L = ZONE_LIGHT[G.roomDef.zone];
  if (!L) return;
  const [wr, wg, wb] = L.wash;
  c.save();
  // 1 — pull the chroma out
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = 'hsl(0,0%,50%)';
  // 0.62 left the Foundry at 76 and 0.82 at 56. The Foundry is molten iron —
  // the zone whose whole identity is saturated orange — so it is the room that
  // decides this number, and §9.4 is explicit that the reserved chroma belongs
  // to the cast and the interactables, not to the wall behind them.
  c.globalAlpha = 0.94;
  c.fillRect(0, 0, 960, 540);
  // 2 — sit it down in value, toward the zone's own shadow rather than to grey
  c.globalCompositeOperation = 'multiply';
  c.globalAlpha = 1;
  c.fillStyle = 'rgb(' + Math.round(wr * 0.42) + ',' + Math.round(wg * 0.42) + ',' +
                Math.round(wb * 0.42) + ')';
  c.fillRect(0, 0, 960, 540);
  // 3 — and the haze that keeps it from reading as underexposure. §9.1 asks for
  //     5-10%; the top of the frame is furthest away and takes the most.
  c.globalCompositeOperation = 'source-over';
  // The haze is MUTED before it is laid down. Painting the zone's own wash on
  // neat put the chroma straight back: over a background already darkened to
  // ~9% luminance, 13% of the Foundry's saturated orange measured 75 on a law
  // that asks for 34. Distance removes colour; a haze that adds it is a lamp.
  const hz = (v) => Math.round(v * 0.42 + ((wr + wg + wb) / 3) * 0.58);
  const hr = hz(wr), hg2 = hz(wg), hb = hz(wb);
  const h = c.createLinearGradient(0, 0, 0, 540);
  h.addColorStop(0, 'rgba(' + hr + ',' + hg2 + ',' + hb + ',0.13)');
  h.addColorStop(1, 'rgba(' + hr + ',' + hg2 + ',' + hb + ',0.04)');
  c.fillStyle = h;
  c.fillRect(0, 0, 960, 540);
  // ...and break the pitch. Overlay keeps mid-grey neutral, so this only
  // pushes the background's own values apart — it never tints it.
  c.globalCompositeOperation = 'overlay';
  c.globalAlpha = 0.55;
  c.drawImage(bgMottle(), 0, 0);
  c.restore();
  c.globalAlpha = 1;
}

function lightPass(P) {
  // The whole pass is a luxury: it makes the picture better and does nothing
  // for how the game plays, so it rides the same frame budget as the
  // background's depth plate and is the first thing dropped when the rate
  // slips. It was costing ten milliseconds a frame while the budget had
  // ALREADY given up on the depth plate, which is the wrong way round.
  if (richK <= 0) return;
  const L = ZONE_LIGHT[G.roomDef.zone];
  if (L) {
    // the wash: a gradient from the room's light toward its shadow
    const g = c.createLinearGradient(0, 540 * L.from - 220, 0, 540);
    const [r2, g2, b2] = L.wash;
    // The wash multiplies toward a LIGHT version of the kingdom's colour, not
    // the colour itself. Multiplying by a saturated tint only darkens, and a
    // second additive pass to undo that is two full-frame composites for one
    // effect — this tints in one.
    const lift = (v) => Math.round(255 - (255 - v) * L.k * richK);
    g.addColorStop(0, 'rgb(255,255,255)');
    g.addColorStop(1, 'rgb(' + lift(r2) + ',' + lift(g2) + ',' + lift(b2) + ')');
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = g; c.fillRect(0, 0, 960, 540);
    c.restore();
    c.globalAlpha = 1;
  }
  applyBloom(richK);
}
function dimPanel(x, y, w, h) {
  c.fillStyle = 'rgba(6,10,16,0.88)'; rr(c, x, y, w, h, 12); c.fill();
  c.strokeStyle = 'rgba(120,200,255,0.35)'; c.lineWidth = 1.5; rr(c, x, y, w, h, 12); c.stroke();
}
// ---------------------------------------------------------------------------
// Character portraits. Both are drawn in one normalised space (roughly ±110 wide,
// -220..+196 tall, origin between the eyes) so the same code serves the big title
// mascot and the small character-select portrait; pass detail=false to drop the
// fine work that turns to mush at portrait size.
//
// Both follow STORY.md's art rules: red light means infected, so nothing friendly
// glows red — HZD-99 reads teal, the hero reads gold, and the crimson crest is
// pigment rather than emission. Nothing here is new, so both carry wear.
// ---------------------------------------------------------------------------
// Corrected to the reference sheet: HZD-99 is WHITE CERAMIC over brushed steel
// with oxidized bronze fittings and cyan light — not the dark blue-teal she was.
const HZD_P  = { core:'#3a3730', shade:'#6b665d', mid:'#c2bcae', lit:'#f2eee6', glow:'#3fd8ee' };
const WRAP_P = { core:'#20262b', shade:'#333c44', mid:'#4e5a64' };
const BRZ_P  = { core:'#2b1f12', shade:'#5f4520', mid:'#9a7534', lit:'#d9b56a', glow:'#ffd98a' };
const CRE_P  = { core:'#5e1a22', shade:'#a8323c', mid:'#e0484f', lit:'#f2887f' };

function hzdSkullP(x) {
  x.beginPath();
  x.moveTo(-48,-92);
  x.bezierCurveTo(-20,-110, 20,-110, 48,-92);
  x.bezierCurveTo(86,-70, 104,-36, 104, 0);
  x.lineTo(112, 16); x.lineTo(98, 24);
  x.bezierCurveTo(94, 52, 74, 74, 44, 84);
  x.bezierCurveTo(24, 92, -24, 92, -44, 84);
  x.bezierCurveTo(-74, 74, -94, 52, -98, 24);
  x.lineTo(-112, 16); x.lineTo(-104, 0);
  x.bezierCurveTo(-104,-36, -86,-70, -48,-92);
  x.closePath();
}
function hzdEarP(x, dir) {
  x.save(); x.scale(dir, 1);
  x.beginPath();
  x.moveTo(36,-76); x.quadraticCurveTo(56,-130, 74,-176); x.quadraticCurveTo(104,-114, 92,-60);
  x.closePath(); x.restore();
}
function hzdEyeP(x) {
  x.beginPath();
  x.moveTo(-25, 1); x.quadraticCurveTo(-20,-12, 2,-13); x.quadraticCurveTo(23,-13, 28,-4);
  x.quadraticCurveTo(23, 10, 2, 11); x.quadraticCurveTo(-20, 10, -25, 1);
  x.closePath();
}
// HZD-99: a maintenance unit, not a soldier — round-dominant skull, level brow and
// alert (not narrowed) eyes. The asymmetry is a repair patch she riveted on herself.
function drawNyaP(x, detail) {
  x.save(); x.rotate(-0.03);
  const sg = x.createLinearGradient(-90, 60, 90, 190);
  sg.addColorStop(0, HZD_P.shade); sg.addColorStop(1, HZD_P.core);
  x.fillStyle = sg;
  x.beginPath(); x.moveTo(-40,44); x.lineTo(40,44); x.lineTo(52,120); x.lineTo(-52,120); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(-126,196); x.quadraticCurveTo(-98,116,-46,106);
  x.lineTo(46,106); x.quadraticCurveTo(98,116,126,196); x.closePath(); x.fill();
  // segmented tail, from the reference sheet — ceramic beads on a steel cable
  x.strokeStyle = MAT.steel.dark; x.lineWidth = 5;
  x.beginPath(); x.moveTo(96,150); x.quadraticCurveTo(158,124, 150,58); x.stroke();
  for (let i = 0; i < 6; i++) {
    const k = i / 5, tx = 96 + (1-k)*(1-k)*0 + (2*(1-k)*k*158 + k*k*150) - (1-k)*(1-k)*0;
    const bx = (1-k)*(1-k)*96 + 2*(1-k)*k*158 + k*k*150;
    const by = (1-k)*(1-k)*150 + 2*(1-k)*k*124 + k*k*58;
    x.fillStyle = ramp(x, MAT.ceramic, bx-8, by-8, bx+7, by+8, 0.9 - k*0.15);
    x.beginPath(); x.ellipse(bx, by, 9 - i*0.7, 8 - i*0.6, 0.3, 0, 7); x.fill();
  }
  // bronze neck collar
  x.fillStyle = ramp(x, MAT.bronze, -44, 36, 40, 62);
  x.beginPath(); x.moveTo(-44,40); x.lineTo(44,40); x.lineTo(40,60); x.lineTo(-40,60); x.closePath(); x.fill();
  occl(x, 0, 44, 52, 12, 0.5);

  x.fillStyle = WRAP_P.shade;
  x.beginPath(); x.moveTo(-64,10); x.quadraticCurveTo(-136,-16,-186,16);
  x.quadraticCurveTo(-140,22,-118,40); x.quadraticCurveTo(-96,30,-60,36); x.closePath(); x.fill();
  x.fillStyle = WRAP_P.core;
  x.beginPath(); x.moveTo(-62,40); x.quadraticCurveTo(-116,58,-150,92);
  x.quadraticCurveTo(-112,76,-58,72); x.closePath(); x.fill();

  x.fillStyle = ramp(x, MAT.ceramic, -60,-180, 60,-60, 0.85);
  hzdEarP(x,-1); x.fill(); hzdEarP(x,1); x.fill();
  x.fillStyle = ramp(x, MAT.bronze, -20,-160, 20,-70, 0.8);
  for (const d of [-1, 1]) {
    x.save(); x.scale(d,1);
    x.beginPath(); x.moveTo(50,-80); x.quadraticCurveTo(64,-126,76,-160);
    x.quadraticCurveTo(90,-120,84,-70); x.closePath(); x.fill(); x.restore();
  }
  if (detail) {
    x.strokeStyle = 'rgba(190,235,230,0.30)'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(58,-118); x.lineTo(92,-104); x.stroke();
    x.fillStyle = 'rgba(214,243,231,0.5)';
    for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(62+i*13,-115+i*5, 2, 0, 7); x.fill(); }
  }

  x.save(); hzdSkullP(x); x.clip();
  x.fillStyle = ramp(x, MAT.ceramic, -96,-114, 88, 76);
  x.fillRect(-150,-210, 300, 330);
  // the ears and the brow sit above the face, so they cast onto it
  occl(x, -62,-70, 46, 34, 0.45); occl(x, 62,-70, 46, 34, 0.45);
  occl(x, 0,-26, 96, 22, 0.35);
  wear(x, [[-84,-14,7],[70,26,6],[-30,64,5],[52,-52,5]]);
  if (detail) {
    x.fillStyle = 'rgba(150,205,200,0.16)';
    x.beginPath(); x.moveTo(46,-22); x.lineTo(102,-12); x.lineTo(96,44); x.lineTo(42,32); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(214,243,231,0.34)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(46,-22); x.lineTo(102,-12); x.stroke();
    x.fillStyle = 'rgba(214,243,231,0.55)';
    for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(52+i*16,-16+i*3.4, 2.2, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(190,235,230,0.16)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(-70,-70); x.quadraticCurveTo(0,-90, 72,-68); x.stroke();
  }
  x.restore();

  x.save(); hzdSkullP(x); x.clip();
  const rg = x.createLinearGradient(-106,-116, 40, 46);
  rg.addColorStop(0,'rgba(214,243,231,0)'); rg.addColorStop(0.18,'rgba(214,243,231,0.92)');
  rg.addColorStop(0.52,'rgba(214,243,231,0)');
  x.strokeStyle = rg; x.lineWidth = 8; hzdSkullP(x); x.stroke();
  const bg2 = x.createLinearGradient(80, 86, 0, 6);
  bg2.addColorStop(0,'rgba(55,255,208,0.40)'); bg2.addColorStop(1,'rgba(55,255,208,0)');
  x.strokeStyle = bg2; x.lineWidth = 5; hzdSkullP(x); x.stroke();
  x.restore();

  x.save(); hzdSkullP(x); x.clip();
  x.fillStyle = ramp(x, MAT.steel, -92,-52, 92,-24);
  x.beginPath(); x.moveTo(-92,-50); x.quadraticCurveTo(0,-36, 92,-50);
  x.lineTo(92,-28); x.quadraticCurveTo(0,-15, -92,-28); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(220,178,104,0.55)'; x.lineWidth = 2.2;   // bronze trim
  x.beginPath(); x.moveTo(-90,-49); x.quadraticCurveTo(0,-35, 90,-49); x.stroke();
  x.restore();

  x.save(); hzdSkullP(x); x.clip();
  const wg = x.createLinearGradient(-60, 24, 70, 84);
  wg.addColorStop(0, WRAP_P.mid); wg.addColorStop(1, WRAP_P.core);
  x.fillStyle = wg;
  x.beginPath(); x.moveTo(-102,30); x.quadraticCurveTo(0,16, 102,30);
  x.lineTo(102,58); x.quadraticCurveTo(0,96, -102,58); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(190,210,200,0.26)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(-98,32); x.quadraticCurveTo(0,18, 98,32); x.stroke();
  if (detail) {
    x.strokeStyle = 'rgba(190,210,200,0.14)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(-66,40); x.quadraticCurveTo(-30,58,-6,74); x.stroke();
    x.beginPath(); x.moveTo(-40,34); x.quadraticCurveTo(-18,54, 4,70); x.stroke();
  }
  x.restore();
  x.fillStyle = WRAP_P.mid;
  x.beginPath(); x.ellipse(-74, 44, 15, 11, -0.35, 0, 7); x.fill();
  x.fillStyle = 'rgba(190,210,200,0.18)';
  x.beginPath(); x.ellipse(-78, 40, 8, 5, -0.35, 0, 7); x.fill();

  // her eyes run the same sensor as everything else in the Depths — but cyan,
  // because she slept through the broadcast and it never reached her
  for (const [d, cx, s, rot] of [[-1,-50,1.0,0.10],[1,51,0.9,-0.10]]) {
    x.save(); x.translate(cx,-8); x.rotate(rot); x.scale(d*s, s);
    x.fillStyle = MAT.steel.deep; x.save(); x.scale(1.2,1.34); hzdEyeP(x); x.fill(); x.restore();
    occl(x, 0, 0, 34, 20, 0.5);
    x.shadowColor = MAT.cyan.mid; x.shadowBlur = 22; x.fillStyle = MAT.cyan.mid;
    hzdEyeP(x); x.fill(); x.shadowBlur = 0;
    x.fillStyle = MAT.cyan.lit; x.beginPath(); x.ellipse(6,-5, 9, 3.2, -0.2, 0, 7); x.fill();
    x.restore();
  }

  x.fillStyle = MAT.cyan.mid; x.shadowColor = MAT.cyan.mid; x.shadowBlur = 14;
  x.beginPath(); x.moveTo(0,-84); x.lineTo(8,-74); x.lineTo(0,-64); x.lineTo(-8,-74); x.closePath(); x.fill();
  x.shadowBlur = 0;
  x.strokeStyle = MAT.bronze.mid; x.lineWidth = 3.5;
  x.beginPath(); x.moveTo(-78,-162); x.quadraticCurveTo(-106,-200,-82,-218); x.stroke();
  x.fillStyle = MAT.cyan.lit; x.shadowColor = MAT.cyan.mid; x.shadowBlur = 16;
  x.beginPath(); x.arc(-81,-221, 5.5, 0, 7); x.fill(); x.shadowBlur = 0;
  x.restore();
}

function helmPathP(x) {
  x.beginPath();
  x.moveTo(-72,-34);
  x.bezierCurveTo(-72,-108, -38,-130, 0,-130);
  x.bezierCurveTo(38,-130, 72,-108, 72,-34);
  x.bezierCurveTo(76, 18, 72, 60, 56, 96);
  x.lineTo(30, 92); x.quadraticCurveTo(20, 52, 15, 30);
  x.lineTo(-15, 30); x.quadraticCurveTo(-20, 52, -30, 92);
  x.lineTo(-56, 96);
  x.bezierCurveTo(-72, 60, -76, 18, -72,-34);
  x.closePath();
}
function helmEyeP(x) {
  x.beginPath();
  x.moveTo(-30, 6); x.quadraticCurveTo(-14,-12, 12,-14);
  x.quadraticCurveTo(30,-13, 33,-2); x.quadraticCurveTo(16, 12, -8, 13);
  x.closePath();
}
// The wanderer of the Odyssey: square-dominant Corinthian helm (endurance), with
// the crest supplying the only dynamic shape. Salt-worn — verdigris in the crevices.
function drawHeroP(x, detail) {
  x.save(); x.rotate(0.03);
  const sg = x.createLinearGradient(-90, 60, 90, 190);
  sg.addColorStop(0, BRZ_P.shade); sg.addColorStop(1, BRZ_P.core);
  x.fillStyle = sg;
  x.beginPath(); x.moveTo(-126,196); x.quadraticCurveTo(-96,112,-44,100);
  x.lineTo(44,100); x.quadraticCurveTo(96,112,126,196); x.closePath(); x.fill();

  const cg = x.createLinearGradient(-70,-200, 60,-60);
  cg.addColorStop(0, CRE_P.lit); cg.addColorStop(0.42, CRE_P.mid); cg.addColorStop(1, CRE_P.core);
  x.fillStyle = cg;
  x.beginPath();
  x.moveTo(-88,-16);
  x.bezierCurveTo(-106,-124, -50,-204, 0,-204);
  x.bezierCurveTo(50,-204, 106,-124, 88,-16);
  x.lineTo(70,-30);
  x.bezierCurveTo(74,-104, 38,-128, 0,-128);
  x.bezierCurveTo(-38,-128, -74,-104, -70,-30);
  x.closePath(); x.fill();
  if (detail) {
    x.strokeStyle = 'rgba(255,190,180,0.20)'; x.lineWidth = 2.4;
    for (let i = -4; i <= 4; i++) {
      const a = i * 0.20 - Math.PI / 2;
      x.beginPath();
      x.moveTo(Math.cos(a) * 62, Math.sin(a) * 74 - 54);
      x.lineTo(Math.cos(a) * 96, Math.sin(a) * 118 - 46);
      x.stroke();
    }
  }
  const combg = x.createLinearGradient(-40,-140, 40,-118);
  combg.addColorStop(0, BRZ_P.lit); combg.addColorStop(1, BRZ_P.shade);
  x.fillStyle = combg;
  x.beginPath();
  x.moveTo(-72,-32); x.bezierCurveTo(-76,-106, -38,-132, 0,-132);
  x.bezierCurveTo(38,-132, 76,-106, 72,-32);
  x.lineTo(60,-34); x.bezierCurveTo(62,-98, 32,-120, 0,-120);
  x.bezierCurveTo(-32,-120, -62,-98, -60,-34);
  x.closePath(); x.fill();

  const g = x.createLinearGradient(-92,-124, 84, 78);
  g.addColorStop(0, BRZ_P.lit); g.addColorStop(0.28, BRZ_P.mid);
  g.addColorStop(0.60, BRZ_P.shade); g.addColorStop(1, BRZ_P.core);
  x.save(); helmPathP(x); x.clip();
  x.fillStyle = g; x.fillRect(-150,-210, 300, 330);
  if (detail) {
    x.fillStyle = 'rgba(78,122,99,0.30)';
    x.beginPath(); x.ellipse(-58, 44, 20, 13, 0.4, 0, 7); x.fill();
    x.beginPath(); x.ellipse(44, 66, 15, 9, -0.3, 0, 7); x.fill();
    x.fillStyle = 'rgba(43,31,18,0.42)';
    x.beginPath(); x.ellipse(48,-64, 14, 8, 0.6, 0, 7); x.fill();
    x.strokeStyle = 'rgba(255,233,184,0.20)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(34,-72); x.quadraticCurveTo(50,-66, 60,-56); x.stroke();
  }
  x.strokeStyle = 'rgba(255,233,184,0.34)'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(-70,-30); x.quadraticCurveTo(0,-46, 70,-30); x.stroke();
  x.restore();

  x.save(); helmPathP(x); x.clip();
  const rg = x.createLinearGradient(-104,-124, 34, 40);
  rg.addColorStop(0,'rgba(255,233,184,0)'); rg.addColorStop(0.18,'rgba(255,233,184,0.95)');
  rg.addColorStop(0.54,'rgba(255,233,184,0)');
  x.strokeStyle = rg; x.lineWidth = 8; helmPathP(x); x.stroke();
  x.restore();

  for (const [d, cx] of [[-1,-38],[1,39]]) {
    x.save(); x.translate(cx,-6); x.scale(d,1);
    x.fillStyle = '#160f08'; x.save(); x.scale(1.14,1.28); helmEyeP(x); x.fill(); x.restore();
    x.shadowColor = BRZ_P.glow; x.shadowBlur = 20; x.fillStyle = BRZ_P.glow;
    x.save(); x.scale(0.52,0.46); x.translate(6,-2); helmEyeP(x); x.fill(); x.restore();
    x.shadowBlur = 0; x.restore();
  }
  const ng = x.createLinearGradient(-9,-30, 11, 30);
  ng.addColorStop(0, BRZ_P.lit); ng.addColorStop(1, BRZ_P.shade);
  x.fillStyle = ng;
  x.beginPath(); x.moveTo(-9,-34); x.lineTo(9,-34); x.lineTo(7, 40); x.lineTo(0, 48); x.lineTo(-7, 40); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,233,184,0.45)'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(-8,-32); x.lineTo(-6, 38); x.stroke();
  x.restore();
}

function updateCtrl() {
  if (!PAD.on) {
    if (inP('BACK') || inP('OK')) { G.state = G.ctrlBack || 'MENU'; sfx('ui'); }
    return;
  }
  if (G.padIdx == null) G.padIdx = 0;
  if (PAD.listen) {                       // waiting for a button to bind
    if (keysP.Escape) { PAD.listen = null; sfx('ui'); return; }
    if (PAD.lastPress >= 0) {
      padBind(PAD.listen, PAD.lastPress);
      G.toast(t('pa_' + PAD.listen) + ' → ' + padLabel(PAD.lastPress));
      PAD.listen = null; sfx('ok');
      // the binding press is still physically held; when code suppression
      // lifts it would fire a phantom fresh edge and instantly re-arm a new
      // bind (and eat the exit button). Mark every code as already-down.
      if (typeof GP_CODES !== 'undefined') for (const c2 of GP_CODES) GP_PREV[c2] = true;
    }
    return;
  }
  const n = PAD_ACTIONS.length, colH = Math.ceil(n / 2);
  if (inP('DOWN') || keysP.ArrowDown) { G.padIdx = (G.padIdx + 1) % n; sfx('ui'); }
  if (inP('UP') || keysP.ArrowUp) { G.padIdx = (G.padIdx + n - 1) % n; sfx('ui'); }
  if (inP('LEFT') || keysP.ArrowLeft) { G.padIdx = (G.padIdx + n - colH) % n; sfx('ui'); }
  if (inP('RIGHT') || keysP.ArrowRight) { G.padIdx = (G.padIdx + colH) % n; sfx('ui'); }
  // the pad must be able to drive its OWN config screen: confirm starts a
  // bind, and BACK / PAUSE on the pad leave the screen — before this, the
  // only way out was a keyboard Escape, a trap for controller players
  if (keysP.Enter || keysP.KeyX || inP('OK')) { PAD.listen = PAD_ACTIONS[G.padIdx]; PAD.lastPress = -1; sfx('ui'); return; }
  if (keysP.KeyR) { padReset(); G.toast(t('pad_wasreset')); sfx('ok'); }
  if (keysP.Escape || inP('BACK') || inP('PAUSE')) { G.state = G.ctrlBack || 'MENU'; sfx('ui'); }
}
function drawMenuBG(tsec) {
  const sky = c.createLinearGradient(0, 0, 0, 540);
  sky.addColorStop(0, '#050a14'); sky.addColorStop(1, '#0b1b30');
  c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
  for (let i = 0; i < 40; i++) {
    const xx = hash2(i, 11) * 960, yy = (hash2(i, 12) * 540 + tsec * (6 + hash2(i, 13) * 14)) % 540;
    c.fillStyle = 'rgba(120,220,255,' + (0.1 + hash2(i, 14) * 0.3) + ')';
    c.fillRect(xx, yy, 2.4, 2.4);
  }
  // HZD-99 keeping watch behind the menu. Suppressed on the chooser, where she would
  // otherwise show through the hero's card and lend him her antenna.
  if (G.state !== 'WHO') drawMenuCat(tsec);
}
// ---------------------------------------------------------------------------
// THE TITLE MASCOT IS THE CHARACTER, DRAWN BY THE CHARACTER'S OWN CODE.
//
// It used to be `drawNyaP` — a separate flat vector head, at 58% alpha, with
// different colours, no visor bar and ears the wrong shape. So the first
// picture of her anybody ever saw was of somebody else, and every pass of
// shading the real HZD-99 got (committed light, core shadow, cast shadows, the
// recessed visor, the formed ears) arrived nowhere near the title screen.
//
// She is posed and drawn here by Player.draw at four times size. Two things
// follow that are worth more than the picture: the title can never again
// disagree with the game about what she looks like, and anything done to her
// later shows up here for free.
//
// Player.draw reads the world it expects to be inside — the zone palette, the
// save, the media manifest — so a menu with no run loaded has to lend it one.
// The whole thing is wrapped: a mascot must never be able to take the title
// screen down with it.
let MENU_CAT = null, MENU_CAT_OFF = false;
function drawMenuCat(tsec) {
  if (MENU_CAT_OFF || typeof Player !== 'function') return;
  c.save();
  const heldRoom = G.roomDef, heldSave = G.save, heldGrid = G.grid;
  try {
    if (!MENU_CAT) {
      MENU_CAT = new Player(0, 0);
      MENU_CAT.cores = 5; MENU_CAT.volts = 60; MENU_CAT.on = true; MENU_CAT.face = -1;
      MENU_CAT.faceVis = -1;                       // looking in toward the menu
    }
    const p = MENU_CAT;
    p.anim = tsec;                                 // idle breathing, scarf, tail
    p.rigDt = 1 / 60;
    p.idleT = tsec;
    p.x = 0; p.y = 0; p.vx = 0; p.vy = 0;
    if (!G.roomDef) G.roomDef = { zone: 'A', w: 30, h: 17 };
    if (!G.save) G.save = { skills: [], crests: [], relics: [], flags: {}, abil: {}, iq: 0, scrap: 0 };
    // NO FAKE FLOOR (owner ruling, 2026-08-21). This lent the menu a one-tile
    // slab so a ground probe would find something under her feet; there is no
    // contact shadow any more, so the slab is a floor nothing stands on. The
    // grid still has to EXIST — tileAt reads its length unguarded, and the
    // mascot draw is inside a try/catch that permanently disables the mascot on
    // a throw — so it is one tile of AIR: present to be read, solid to nothing.
    if (!G.grid) G.grid = [['.']];
    // a slow hover so she reads as alive rather than as a decal
    const bob = Math.sin(tsec * 1.6) * 5;
    c.translate(786, 384 + bob);
    c.scale(4.1, 4.1);
    c.translate(-p.w / 2, -p.h);
    p.draw(c);
  } catch (e) {
    // one failure is enough: stop trying rather than throw every frame
    MENU_CAT_OFF = true;
    if (typeof console !== 'undefined') console.warn('menu mascot disabled:', e);
  }
  G.roomDef = heldRoom; G.save = heldSave; G.grid = heldGrid;
  c.restore(); c.shadowBlur = 0; c.globalAlpha = 1;
}
function draw(tms) {
  const tsec = tms / 1000;
  // The backbuffer may be any size the device can afford; everything below this
  // line is written against 960x540 and never needs to know which.
  if (typeof qFrame === 'function') qFrame(c);
  c.clearRect(0, 0, 960, 540);
  const st = G.state;
  if (st === 'CINE') { drawCine(); return; }
  if (st === 'CUT') { drawCut(); return; }
  if (st === 'MENU' || st === 'LANGSEL' || st === 'DIFF' || st === 'WHO' || (st === 'CTRL' && G.ctrlBack === 'MENU') || st === 'GAMEOVER') {
    drawMenuBG(tsec);
    if (st === 'LANGSEL') {
      ftxt(t('lang_title'), 480, 120, 40, '#eef3fa', 'center', '#37ffd0');
      LANGS.forEach((l, i) => {
        const sel = i === G.langIdx, y = 210 + i * 52;
        if (sel) { c.fillStyle = 'rgba(55,255,208,0.12)'; rr(c, 340, y - 24, 280, 44, 10); c.fill(); }
        ftxt((sel ? '▸  ' : '') + l.name, 480, y, 26, sel ? '#eef3fa' : '#7d93a8', 'center', sel ? '#37ffd0' : null);
      });
      ftxt(t('lang_hint'), 480, 500, 14, '#546b7d');
      return;
    }
    if (st === 'WHO') {
      ftxt(t('who_q'), 480, 90, 42, '#eef3fa', 'center', '#37ffd0');
      for (let i = 0; i < 2; i++) {
        const x = 250 + i * 460, sel = i === G.whoIdx;
        dimPanel(x - 170, 150, 340, 300);
        if (sel) {
          c.strokeStyle = i ? '#ffd98a' : '#37ffd0'; c.lineWidth = 2.5;
          rr(c, x - 170, 150, 340, 300, 12); c.stroke();
        }
        c.save(); c.translate(x, 252); c.scale(0.42, 0.42);
        if (i === 0) drawNyaP(c, false); else drawHeroP(c, false);
        c.restore(); c.shadowBlur = 0;
        ftxt(t(i ? 'who_hero' : 'who_robo'), x, 360, 20, sel ? '#eef3fa' : '#8aa2b5');
        ftxt(t(i ? 'who_herod' : 'who_robod'), x, 392, 13, '#7d93a8');
        // show whether this character has a voyage in progress
        const has = !!loadStored(i ? 'hero' : 'robo');
        ftxt(has ? '● ' + t('who_cont') : t('who_new'), x, 418, 12, has ? (i ? '#ffd98a' : '#37ffd0') : '#66788a');
        if (sel) ftxt('▸', x, 438, 18, i ? '#ffd98a' : '#37ffd0');
      }
      ftxt('← → · Enter', 480, 500, 13, '#546b7d');
      return;
    }
    if (st === 'MENU') {
      ftxt(t('title'), 340, 120, 64, '#eef3fa', 'center', '#37ffd0');
      ftxt(t('subtitle'), 340, 168, 17, '#9fb8c8');
      drawGlyphText(c, RS_TITLE, 340, 200, 13, 'rgba(55,255,208,0.55)', 'rgba(55,255,208,0.4)');
      const opts = menuOptions();
      const labels = {
        play: t('menu_play'), continue: t('menu_continue'), newgame: t('menu_newgame'),
        film: t('menu_film'), controls: t('menu_controls'),
        lang: t('menu_language') + ': ' + langName(LANG),
        bright: t('menu_bright') + ': ' + t(BRIGHT_NAMES[brightIdx()]),
        sound: MUTED ? t('menu_sound_off') : t('menu_sound_on'),
        music: MUSIC_ON ? t('menu_music_on') : t('menu_music_off'),
      };
      opts.forEach((o, i) => {
        const sel = i === G.menuIdx;
        ftxt((sel ? '▸ ' : '') + labels[o], 340, 250 + i * 40, 22, sel ? '#eef3fa' : '#7d93a8', 'center', sel ? '#37ffd0' : null);
      });
      // build stamp — so you can always tell which version you are running
      ftxt(GAME_VERSION, 930, 520, 13, '#6c8296', 'right');
      // a newer build exists — offer it right on the title screen
      if (G.updateReady) {
        const pu = 0.6 + Math.sin(tsec * 4) * 0.4;
        c.fillStyle = 'rgba(20,60,50,0.92)'; rr(c, 250, 452, 460, 46, 12); c.fill();
        c.strokeStyle = 'rgba(55,255,208,' + pu + ')'; c.lineWidth = 2;
        rr(c, 250, 452, 460, 46, 12); c.stroke();
        ftxt('⟳ ' + t('upd_ready').replace('%s', G.updateReady), 480, 470, 15, '#eef3fa');
        ftxt(t('upd_tap'), 480, 489, 12, '#8fd8c8');
      }
    } else if (st === 'DIFF') {
      ftxt(t('diff_title'), 480, 90, 40, '#eef3fa', 'center', '#37ffd0');
      for (let i = 0; i < 3; i++) {
        const sel = i === G.diffIdx;
        dimPanel(230, 150 + i * 105, 500, 88);
        if (sel) { c.strokeStyle = '#37ffd0'; c.lineWidth = 2; rr(c, 230, 150 + i * 105, 500, 88, 12); c.stroke(); }
        ftxt((sel ? '▸ ' : '') + t('diff' + i), 480, 182 + i * 105, 24, sel ? '#eef3fa' : '#8aa2b5');
        ftxt(t('diff' + i + 'd'), 480, 212 + i * 105, 14, '#7d93a8');
      }
    } else if (st === 'GAMEOVER') {
      ftxt(t('gameover'), 480, 220, 52, '#ff5f6d', 'center', '#ff5f6d');
      ftxt(t('gameover2'), 480, 285, 18, '#9fb8c8');
      ftxt(t('press'), 480, 360, 16, '#7d93a8');
    }
    if (st === 'CTRL' && G.ctrlBack === 'MENU') drawCtrl();
    return;
  }
  if (st === 'INTRO') {
    const T = G.introT;
    c.fillStyle = '#020409'; c.fillRect(0, 0, 960, 540);
    for (let i = 0; i < 34; i++) {
      const yy = (hash2(i, 12) * 540 + T * (8 + hash2(i, 13) * 18)) % 540;
      c.fillStyle = 'rgba(120,220,255,' + (0.06 + hash2(i, 14) * 0.2) + ')';
      c.fillRect(hash2(i, 11) * 960, yy, 2.2, 2.2);
    }
    const beat = (a, b, txt) => {
      if (T >= a && T < b) {
        c.globalAlpha = Math.min(1, (T - a) / 0.8) * Math.min(1, (b - T) / 0.8);
        wrapText(txt, 700, 22).forEach((ln, i) => ftxt(ln, 480, 250 + i * 32, 22, '#cfe3ef', 'center', null, '600'));
        c.globalAlpha = 1;
      }
    };
    beat(0.4, 3.4, t('intro1'));
    beat(3.6, 6.6, t('intro2'));
    beat(6.8, 9.4, t('intro3'));
    if (T >= 9.6) {
      if (!G.introSlam) { G.introSlam = true; sfx('roar'); sfx('boom'); }
      c.strokeStyle = 'rgba(55,255,208,0.22)'; c.lineWidth = 3;
      for (let i = 0; i < 20; i++) {
        const a = i / 20 * Math.PI * 2 + 0.1;
        c.beginPath();
        c.moveTo(480 + Math.cos(a) * 150, 240 + Math.sin(a) * 95);
        c.lineTo(480 + Math.cos(a) * 640, 240 + Math.sin(a) * 430);
        c.stroke();
      }
      const k = Math.min(1, (T - 9.6) / 0.25);
      c.save(); c.translate(480, 235); c.scale(2.4 - 1.4 * k, 2.4 - 1.4 * k);
      ftxt(t('title'), 0, 0, 72, '#eef3fa', 'center', '#37ffd0');
      c.restore();
      ftxt(t('intro4'), 480, 335, 30, '#ff5f6d', 'center', '#ff5f6d');
      if (T < 10.2) { c.fillStyle = 'rgba(255,255,255,' + Math.max(0, 1 - (T - 9.6) / 0.6) + ')'; c.fillRect(0, 0, 960, 540); }
    }
    ftxt(t('intro_skip'), 480, 512, 13, '#546b7d');
    return;
  }
  if (st === 'MORE') {
    // the world stays behind it, dimmed. She is standing in the doorway she
    // cannot go through yet, and the screen should read as her looking at it
    drawWorldFrame();
    c.fillStyle = 'rgba(3,7,12,0.86)'; c.fillRect(0, 0, 960, 540);
    ftxt(t('demo_end1'), 480, 132, 44, '#aef7d8', 'center', '#37ffd0');
    ftxt(t('demo_end2'), 480, 196, 19, '#cfe3ef');
    ftxt(t('demo_end3'), 480, 232, 17, '#8aa2b5');
    const s = G.save;
    const mins = Math.floor(s.time / 60), secs = Math.floor(s.time % 60);
    const bosses = ['Glitch', 'Alpha'].filter(b => s.flags['boss' + b]).length;
    ftxt(t('stats_time') + '  ' + mins + ':' + String(secs).padStart(2, '0')
      + '     ' + t('demo_guardians') + '  ' + bosses + '/2',
      480, 292, 16, '#7d93a8');
    const L = moreLayout();
    L.rows.forEach((k, i) => {
      const y = L.y0 + i * L.step, on = i === G.moreIdx;
      c.save();
      c.fillStyle = on ? 'rgba(55,255,208,0.14)' : 'rgba(120,150,170,0.07)';
      c.strokeStyle = on ? '#37ffd0' : '#31465a';
      c.lineWidth = on ? 2 : 1;
      c.beginPath(); c.rect(480 - L.w / 2, y - L.h / 2, L.w, L.h); c.fill(); c.stroke();
      c.restore();
      ftxt(t(k), 480, y + 6, 18, on ? '#eef3fa' : '#9db3c4', 'center', on ? '#37ffd0' : null);
    });
    return;
  }
  if (st === 'WIN') {
    drawMenuBG(tsec);
    ftxt(t('win1'), 480, 120, 52, '#aef7d8', 'center', '#37ffd0');
    ftxt(t('win2'), 480, 185, 17, '#cfe3ef');
    const s = G.save;
    const mins = Math.floor(s.time / 60), secs = Math.floor(s.time % 60);
    const bosses = ['Glitch', 'Brood', 'Atlas', 'Zero', 'Prism', 'Mother'].filter(b => s.flags['boss' + b]).length;
    const mods = ['dash', 'djump', 'wall', 'emp', 'key'].filter(m => s.abil[m]).length;
    const comp = Math.min(100, bosses * 10 + s.crests.length * 3 + mods * 3 + (s.won ? 1 : 0));
    const rows = [
      [t('stats_time'), mins + ':' + String(secs).padStart(2, '0')],
      [t('stats_deaths'), s.deaths],
      [t('stats_scrap'), s.scrap],
      [t('stats_comp'), comp + '%'],
    ];
    rows.forEach((r, i) => {
      ftxt(r[0], 380, 260 + i * 34, 18, '#8aa2b5', 'right');
      ftxt(String(r[1]), 420, 260 + i * 34, 18, '#eef3fa', 'left');
    });
    ftxt(t('win3'), 480, 430, 22, '#eef3fa', 'center', '#37ffd0');
    ftxt(t('press'), 480, 480, 15, '#7d93a8');
    return;
  }
  // in-world states render the world behind
  drawWorldFrame();
  drawFX();
  // THE LIGHTS COMING UP on a guardian's chamber. Over the world and under the
  // HUD, so the room is what darkens — a black frame with the player's own
  // readouts sitting on top of it would just look like a broken screen. It
  // holds nearly dark for the first beat, then lifts, with a vignette that
  // stays a moment longer at the edges so the light reads as arriving from
  // above rather than as an overlay being switched off.
  if (G.bossEntry) {
    const k = clamp(G.bossEntry.t / (G.bossEntry.dur * 0.72), 0, 1);
    const e = k < 0.30 ? 0 : (k - 0.30) / 0.70;
    const dark = (1 - e) * 0.88;
    if (dark > 0.004) {
      c.save();
      c.fillStyle = 'rgba(2,4,8,' + dark.toFixed(3) + ')';
      c.fillRect(0, 0, 960, 540);
      const vg2 = c.createRadialGradient(480, 300, 120, 480, 300, 620);
      vg2.addColorStop(0, 'rgba(0,0,0,0)');
      vg2.addColorStop(1, 'rgba(0,0,0,' + (0.55 * (1 - e * 0.55)).toFixed(3) + ')');
      c.fillStyle = vg2; c.fillRect(0, 0, 960, 540);
      c.restore();
    }
  }
  if (typeof drawBrDelta === 'function') drawBrDelta();
  drawTutor();
  if (typeof drawGateWalk === 'function') drawGateWalk();
  drawLesson();
  drawHUD();
  drawMapButton();
  if (G.trans) {
    const k = G.trans.half ? 1 - (0.14 - G.trans.t) / 0.14 : (0.28 - G.trans.t) / 0.14;
    c.fillStyle = 'rgba(3,5,9,' + clamp(k, 0, 1) + ')'; c.fillRect(0, 0, 960, 540);
  }
  if (st === 'DEAD') {
    c.fillStyle = 'rgba(8,4,8,' + clamp((1.8 - G.deadT) * 1.2, 0, 0.85) + ')';
    c.fillRect(0, 0, 960, 540);
    ftxt(t('death'), 480, 250, 46, '#ff5f6d', 'center', '#ff5f6d');
  } else if (st === 'PAUSE') {
    c.fillStyle = 'rgba(4,7,12,0.75)'; c.fillRect(0, 0, 960, 540);
    ftxt(t('paused'), 480, 118, 34, '#eef3fa', 'center', '#37ffd0');
    // THE LIST IS MEASURED, NOT COUNTED OUT IN FORTIES. At a fixed 40 px step
    // from y=190 the last row landed at 510 on desktop and at 550 — off the
    // bottom of a 540 px screen — as soon as the touch row appeared. The way
    // OUT of the game was the row that fell off, which is the worst one to
    // lose, and it is exactly what was reported: "the exit button is under the
    // screen". The step now comes from how many rows there are.
    const PL = pauseLayout(), pm = PL.items, step = PL.step, y0 = PL.y0;
    const fs = Math.min(21, step * 0.56);
    pm.forEach((it, i) => {
      const sel = i === G.pauseIdx, y = y0 + i * step;
      // the two irreversible rows are tinted so they can never be hit by feel
      if (it.warn) {
        c.fillStyle = it.out ? 'rgba(255,120,110,0.10)' : 'rgba(255,190,110,0.09)';
        rr(c, 300, y - step * 0.5, 360, step * 0.86, 8); c.fill();
      }
      ftxt((sel ? '▸ ' : '') + (it.icon ? it.icon + '  ' : '') + it.label, 480, y, fs,
           sel ? '#eef3fa' : (it.out ? '#e88b86' : it.warn ? '#e8bb86' : '#7d93a8'));
      // the sub-line goes ABOVE the row near the foot of the list, where below
      // is the next row's plate rather than empty space
      const sy = y + step * (i >= pm.length - 2 ? -0.5 : 0.52);
      // the confirm replaces the hint, because it is the more urgent sentence
      if (sel && G.pauseConfirm === it.id) ftxt(t('pm_confirm'), 480, sy, 12, '#ffd76a');
      else if (sel && it.hint) ftxt(it.hint, 480, sy, 12, '#7d93a8');
    });
    ftxt(GAME_VERSION, 930, 522, 12, '#44586b', 'right');
  } else if (st === 'TCFG') {
    c.fillStyle = 'rgba(4,7,12,0.82)'; c.fillRect(0, 0, 960, 540);
    ftxt(t('tl_title'), 480, 150, 32, '#eef3fa', 'center', '#37ffd0');
    ftxt(t('tl_hint1'), 480, 230, 18, '#9fb8cc');
    ftxt(t('tl_hint2'), 480, 262, 18, '#9fb8cc');
    ftxt(t('tl_hint3'), 480, 294, 18, '#9fb8cc');
  } else if (st === 'CTRL') {
    drawCtrl();
  } else if (st === 'DIALOG' && G.dialog) {
    const d = G.dialog;
    // THE BOX IS SIZED FROM WHAT GOES IN IT. At a fixed 118 pixels a
    // three-line answer, or a terminal line that also carries a row of alien
    // glyphs, ran straight through the bottom edge and through the ▼ prompt.
    // Measure first, then draw the frame around it.
    // THE PORTRAIT HAS A COLUMN; THE WORDS GET THE REST.
    //
    // The body was centred on the whole panel and wrapped to 620 px, which put
    // its left edge at x=170 — on top of a portrait that starts at 152. The
    // face acting the line was underneath the line, in every conversation in
    // the game. The bust is why the panel exists; it does not get written on.
    const rtl = LANG === 'ar';
    const px = rtl ? 744 : 152;                    // the 64-wide bust
    const tw = 548, tx0 = rtl ? 176 : 236;         // and the column beside it
    const body = wrapText(d.lines[d.i], tw, d.rs ? 15 : 16);
    const lh = d.rs ? 21 : 22;
    const gh = d.rs ? 26 : 0;                      // the glyph row's own band
    const bh = Math.max(118, 62 + gh + body.length * lh + 26);
    const by = 504 - bh;                           // grows upward, foot stays put
    dimPanel(140, by, 680, bh);
    // 64×64 portrait bust — face acting the sprite is too small to carry
    {
      let expr = 'neutral';
      if (player && player.cores <= 2) expr = 'hurt';
      else if (G.boss && !G.boss.dead) expr = 'determined';
      else if (d.rs || d.name === '…') expr = 'curious';
      // WHOSE FACE IS IT? The bust used to be HERS in every conversation,
      // including the ones where Ratchet or the Oracle was doing the talking
      // (owner, 2026-08-16: "the NPC face should appear when it's talking").
      // G.dialog.npc carries the speaker, and tools/npcbusts.cjs cut a bust
      // per NPC out of the turnaround sheet, so the face above the words can
      // be the character the player is standing in front of. Her portrait is
      // still the fallback: an unnamed speaker, or a bust that has not
      // loaded, draws the same face it always did.
      let bustDrawn = false;
      // ...AND WHEN THE CARD IS A HANDOVER, THE PICTURE IS THE THING. A "GOT
      // IT" card has no speaker — her own face over "Thrust Boots — cross a gap
      // in a straight line" tells the player nothing they did not already know.
      // The object goes in the portrait's column instead, drawn larger than a
      // bust because it is the subject rather than a listener, on a soft warm
      // disc so a dark machined housing still reads against the dim panel.
      if (d.art) {
        const ai = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[d.art];
        if (ai && ai.naturalWidth) {
          const S = 84, cx4 = px + 32, cy4 = by + 14 + 32;
          c.save();
          c.globalCompositeOperation = 'lighter';
          const ag = c.createRadialGradient(cx4, cy4, 4, cx4, cy4, S * 0.62);
          ag.addColorStop(0, 'rgba(255,214,130,0.20)');
          ag.addColorStop(1, 'rgba(255,190,100,0)');
          c.fillStyle = ag;
          c.beginPath(); c.arc(cx4, cy4, S * 0.62, 0, 7); c.fill();
          c.restore();
          // contained, never stretched: the two plates have different aspects
          const sc4 = Math.min(S / ai.naturalWidth, S / ai.naturalHeight);
          const aw = ai.naturalWidth * sc4, ah = ai.naturalHeight * sc4;
          c.drawImage(ai, cx4 - aw / 2, cy4 - ah / 2, aw, ah);
          bustDrawn = true;
        }
      }
      if (d.npc && !bustDrawn) {
        const bk = 'bust' + d.npc.charAt(0).toUpperCase() + d.npc.slice(1);
        if (typeof mediaFetch === 'function') mediaFetch(bk);
        const bi = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[bk];
        if (bi && bi.naturalWidth) {
          const S = 64;
          c.save();
          c.beginPath(); c.arc(px + S / 2, by + 14 + S / 2, S / 2, 0, 7); c.clip();
          c.drawImage(bi, px, by + 14, S, S);
          c.restore();
          bustDrawn = true;
        }
      }
      if (!bustDrawn) drawPortrait(c, px, by + 14, expr);
      // ...AND HER BODY WEARS THE SAME FACE. The bust and the sprite are the
      // same character and used to disagree: the portrait could be listening
      // curiously while the cat on the floor behind it stared blankly ahead.
      // 'neutral' maps to her resting cute face rather than to nothing, so a
      // plain conversation still leaves her looking like herself.
      if (player && player.moodSet)
        player.moodSet(expr === 'neutral' ? 'calm' : expr, 0.4);
    }
    ftxt(d.name || '', rtl ? tx0 + tw : tx0, by + 24, 16, '#37ffd0', rtl ? 'right' : 'left');
    let ty = by + 46;
    if (d.rs) { drawGlyphText(c, d.rs, tx0 + tw / 2, ty, 10, 'rgba(120,220,255,0.65)', 'rgba(120,220,255,0.4)'); ty += gh; }
    body.forEach((ln, i) => ftxt(ln, rtl ? tx0 + tw : tx0, ty + 12 + i * lh,
      d.rs ? 15 : 16, '#e6eef6', rtl ? 'right' : 'left', null, '600'));
    ftxt('▼', 480, 494, 13, '#7d93a8');
  } else if (st === 'OFFER') {
    drawOffer();
  } else if (st === 'BRAID') {
    drawBraidView();
  } else if (st === 'MAP') {
    drawMap();
  } else if (st === 'BAG') {
    drawBag();
  } else if (st === 'CREST') {
    drawCrest();
  } else if (st === 'SHOP') {
    drawShop();
  } else if (st === 'SKILLS') {
    drawSkills();
  } else if (st === 'RELICS') {
    drawRelics();
  } else if (st === 'TRIAL') {
    drawTrial();
  }
}
// ===========================================================================
// THE BROADCAST FALLS — the opening, shot as film. Eight shots, each carrying
// one line of the prologue: a benevolent broadcast being overwritten into a
// command, five guardians going to their knees, and one frame that was never
// wired to the Song waking up alone.
//
// This is the ONLY opening the game has. There was a second one — a hand-drawn
// comic of the same story — and it is deleted rather than kept as a spare,
// because a spare that can win is not a spare. When the film cannot decode,
// the fallback is now this same film held on its own frames (see drawCine),
// never a different telling.
// ===========================================================================
const INTRO_FILM = [
  ['intro1', 'cine_c1'],   // the Kernel Depths, working as one
  ['intro2', 'cine_c3'],   // MOTHER-V, the broadcast heart
  ['intro3', 'cine_c4'],   // something outside answers her Song
  ['intro4', 'cine_c5'],   // frequency by frequency, the signal turns
  ['intro5', 'cine_c6'],   // one worker's eye goes from cyan to red: OBEY
  ['intro6', 'cine_c7'],   // the great guardians kneel first
  ['intro7', 'cine_c8'],   // one frame was never wired to the Song
  ['intro8', 'cine_c10'],  // she wakes to a silent city, and goes
];
function introFilmReel() {
  const have = (typeof window !== 'undefined' && window.VID_FILES) || {};
  return INTRO_FILM.filter(s => have[s[0]]);
}
function startIntroFilm() {
  const reel = introFilmReel();
  while (reel.length) {
    const [k, cap] = reel.shift();
    purifyPreload(k);
    if (startPurifyCut(k)) {
      G.cut.cap = cap; G.cut.patient = true;
      G.reel = reel.map(s => s[0]);
      G.reelCap = reel.map(s => s[1]);
      G.reelEnd = 'CINE';
      filmAhead(G.reel);
      return true;
    }
  }
  G.reel = null; G.reelCap = null; G.reelEnd = null;
  return false;
}
// ---------------------------------------------------------------------------
// THE OPENING WAITS FOR A TAP, and that is not politeness — it is the only way
// the film can play at all. Browsers refuse to start video that no human asked
// for, and this one was starting itself the instant the page loaded, before the
// player had touched anything. So play() was rejected, the reel marked itself
// unplayable, and the comic fallback came up instead: the new opening was
// running correctly and losing to its own safety net, every time, on exactly
// the devices most people use.
//
// Behind a tap, the video is unlocked and primed, the file has had a moment to
// arrive, and audio is allowed to start with it.
// ---------------------------------------------------------------------------
function startCine() {
  // the first two shots, not all eight — startIntroFilm keeps the window
  // topped up from there. See filmAhead().
  try { filmAhead(INTRO_FILM.map(s => s[0])); } catch (e) {}
  startCineNow();
}
function startCineNow() {
  try { purifyGesture(); } catch (e) {}
  G.cine = { i: 0, t: 0 };
  // THE OPENING HAS ITS OWN SCORE, and until now nothing ever asked for it:
  // the slot existed, the track sat in assets/music, and setMusic('intro') was
  // not called from anywhere in the game. So the prologue — a benevolent
  // broadcast being overwritten into a command, and five guardians going to
  // their knees — played out under the friendly title theme.
  setMusic('intro');
  if (startIntroFilm()) return;
  G.state = 'CINE';
}
// page start times in the original score, and how long each page takes to
// finish appearing (panels popped, captions typed) — pressing next before
// that reveals the whole page instantly; pressing again turns it
// ===========================================================================
// THE OPENING, HELD. When a browser will not decode the film — an old phone, a
// locked-down webview, a headless test — the story is still told with the
// film's OWN frames: one still lifted from each of the eight shots, in the
// same order, under the same score, carrying the same lines. Same opening at a
// different frame rate, not a different opening.
//
// What used to live here was a hand-drawn comic telling this story a second
// way, in its own art, on its own timing. It is gone. Two openings meant the
// game could show the wrong one — and it did, every time video was blocked,
// which on a phone was every time.
// ===========================================================================
// ---------------------------------------------------------------------------
// THE SOUND IS NOT MISSING, IT IS WAITING. No browser will start audio that no
// human asked for — that is a rule of the platform, not a setting we can turn
// off. So the opening starts on its own with picture (muted video IS allowed to
// autoplay) and the score joins the instant anything is touched. Until then
// this badge sits in the corner so silence never reads as a broken game: it
// says what is missing and exactly how to get it, and it disappears by itself
// the moment the music is running.
// ---------------------------------------------------------------------------
function drawSoundChip(tsec) {
  if (typeof soundLocked !== 'function' || !soundLocked()) return;
  const pu = 0.5 + Math.sin(tsec * 2.6) * 0.5;
  // A controller cannot unlock audio — a pad press is not a user gesture as far
  // as the browser is concerned — so a pad player needs to be told what WILL
  // work rather than "tap for sound" over a game they are playing with a stick.
  const onPad = typeof PAD !== 'undefined' && PAD && PAD.on;
  const txt = onPad ? t('gate_sound_pad') : t('gate_sound');
  c.save();
  c.globalAlpha = 0.72 + pu * 0.28;
  c.font = '600 14px "Segoe UI", Tahoma, sans-serif';
  const tw = c.measureText(txt).width;
  const w = tw + 78, x = 480 - w / 2, y = 28, h = 34;
  c.fillStyle = 'rgba(4,10,14,0.78)'; rr(c, x, y, w, h, h / 2); c.fill();
  c.strokeStyle = 'rgba(55,255,208,' + (0.35 + pu * 0.4) + ')'; c.lineWidth = 1.5;
  rr(c, x, y, w, h, h / 2); c.stroke();
  // a little speaker with two arcs, drawn rather than trusting an emoji font
  const ix = x + 20, iy = y + h / 2;
  c.fillStyle = '#37ffd0';
  c.beginPath();
  c.moveTo(ix, iy - 4); c.lineTo(ix + 5, iy - 4); c.lineTo(ix + 11, iy - 9);
  c.lineTo(ix + 11, iy + 9); c.lineTo(ix + 5, iy + 4); c.lineTo(ix, iy + 4);
  c.closePath(); c.fill();
  c.strokeStyle = '#37ffd0'; c.lineWidth = 1.6;
  for (let i = 0; i < 2; i++) {
    c.beginPath(); c.arc(ix + 12, iy, 5 + i * 4.5, -0.85, 0.85); c.stroke();
  }
  ftxt(txt, x + 54 + tw / 2, y + h / 2 + 1, 14, '#dff3ff', 'center', null, '600');
  c.restore();
  c.globalAlpha = 1;
}
const CINE_HOLD = 6.4;    // seconds a shot is held
const CINE_DISS = 0.9;    // and the dissolve from the shot before it
function cineEnd() {
  try { localStorage.setItem('cb_intro_seen', '1'); } catch (e) {}
  G.cine = null;
  if (G.state !== 'PLAY') setMusic('title');       // back out to the menu's own theme
  if (G.afterCine === 'DIFF') {
    G.afterCine = null; G.diffIdx = 1;
    G.pendTheme = G.pendTheme || gameLock() || 'robo';
    G.state = 'DIFF';
  } else { G.state = 'MENU'; G.menuIdx = 0; }
}
function updateCine(dt) {
  const ci = G.cine;
  if (!ci) { cineEnd(); return; }
  if (ci.i == null) { ci.i = 0; ci.t = 0; }
  ci.t += dt;
  // THE READER'S CONTROLS: the reel never runs away on its own — next moves a
  // shot on, back re-reads the one before, skip leaves
  const next = inP('OK') || inP('JUMP') || inP('ATK') || inP('RIGHT');
  const prev = inP('LEFT');
  if ((next || prev) && introSoundTap()) return;
  if (inP('PAUSE') || inP('BACK')) { sfx('ui'); cineEnd(); return; }
  if (next) { sfx('ui'); ci.i++; ci.t = 0; }
  else if (prev && ci.i > 0) { sfx('ui'); ci.i--; ci.t = 0; }
  else if (ci.t > CINE_HOLD) { ci.i++; ci.t = 0; }
  if (ci.i >= INTRO_FILM.length) cineEnd();
}
function cineStill(i) {
  if (i < 0 || i >= INTRO_FILM.length) return null;
  const im = MEDIA_IMG['introS' + (i + 1)];
  return (im && im.naturalWidth) ? im : null;
}
// a still is never simply pasted on: it drifts and swells across its hold, so
// the shot breathes the way the footage it came from does
function cineShot(im, k, dir) {
  if (!im) return;
  const z = 1.05 + 0.075 * k;
  const w = 960 * z, h = 540 * z;
  const x = (960 - w) / 2 + dir * (w - 960) * 0.5 * (0.5 - k);
  c.drawImage(im, x, (540 - h) / 2 - (h - 540) * 0.12, w, h);
}
function drawCine() {
  const ci = G.cine; if (!ci) return;
  if (ci.i == null) { ci.i = 0; ci.t = 0; }
  c.fillStyle = '#000'; c.fillRect(0, 0, 960, 540);
  const im = cineStill(ci.i);
  const diss = clamp(ci.t / CINE_DISS, 0, 1);
  const k = clamp(ci.t / CINE_HOLD, 0, 1);
  if (!im) {
    // the art has not arrived yet: one slow breath of her own light, the same
    // wait the film shows while a clip buffers
    const pu = 0.5 + Math.sin(ci.t * 2.4) * 0.5;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g0 = c.createRadialGradient(480, 270, 4, 480, 270, 240);
    g0.addColorStop(0, 'rgba(55,255,208,' + (0.05 + pu * 0.05) + ')');
    g0.addColorStop(1, 'rgba(55,255,208,0)');
    c.fillStyle = g0; c.fillRect(0, 0, 960, 540);
    c.restore();
  } else {
    const back = diss < 1 ? cineStill(ci.i - 1) : null;
    if (back) { c.save(); c.globalAlpha = 1; cineShot(back, 1, (ci.i - 1) % 2 ? -1 : 1); c.restore(); }
    c.save(); c.globalAlpha = back ? diss : clamp(ci.t / 0.5, 0, 1);
    cineShot(im, k, ci.i % 2 ? -1 : 1);
    c.restore();
    // the same surfacing bloom and vignette the film is presented with, so the
    // held version and the moving one look like one piece of work
    if (ci.t < 0.5) {
      const b = 1 - ci.t / 0.5;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = b * 0.45;
      cineShot(im, k + 0.06 * b, ci.i % 2 ? -1 : 1);
      c.restore();
    }
    c.save();
    const vg = c.createRadialGradient(480, 270, 200, 480, 270, 560);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = vg; c.fillRect(0, 0, 960, 540);
    c.restore();
  }
  c.globalAlpha = 1;
  // THE CAPTION, set exactly as the film sets it
  const cap = INTRO_FILM[ci.i] && INTRO_FILM[ci.i][1];
  if (cap) {
    const a = clamp(ci.t / 0.7, 0, 1) * clamp((CINE_HOLD - ci.t) / 0.5, 0, 1);
    if (a > 0.01) {
      c.save(); c.globalAlpha = a;
      const txt = t(cap);
      c.font = '600 17px "Segoe UI", Tahoma, sans-serif';
      const w2 = Math.min(880, c.measureText(txt).width + 40);
      const g2 = c.createLinearGradient(0, 432, 0, 500);
      g2.addColorStop(0, 'rgba(4,8,12,0)'); g2.addColorStop(0.5, 'rgba(4,8,12,0.72)');
      g2.addColorStop(1, 'rgba(4,8,12,0)');
      c.fillStyle = g2; c.fillRect(480 - w2 / 2 - 30, 432, w2 + 60, 68);
      ftxt(txt, 480, 468, 17, '#eaf4ff', 'center', 'rgba(0,0,0,0.85)', '600');
      c.restore(); c.globalAlpha = 1;
    }
  }
  // how much story is left, for a player who cannot read the captions yet
  for (let i = 0; i < INTRO_FILM.length; i++) {
    const on = i === ci.i;
    c.fillStyle = on ? '#37ffd0' : 'rgba(180,205,220,0.28)';
    c.beginPath(); c.arc(480 + (i - (INTRO_FILM.length - 1) / 2) * 16, 500, on ? 3.4 : 2.2, 0, 7);
    c.fill();
  }
  if (ci.t > 1.6 || ci.i > 0) {
    c.save();
    c.globalAlpha = 0.35 + Math.sin(performance.now() / 420) * 0.12;
    ftxt(t('gate_next'), 480, 524, 12, '#9fb8c8', 'center');
    c.restore();
  }
  drawSoundChip(performance.now() / 1000);
}
// ---- the machine world's people ------------------------------------------
// Rebuilt as VOLUMES, not stickers: every form is a path clipped to a
// diagonal light ramp (upper-left key light, cool shadows, warm lights),
// with a segmented rim, asymmetric wear, and exactly one emissive accent.
// Local space: origin at the feet, facing +x; the caller flips and bobs.
function drawNPCBody(c, id, tn, talking) {
  const lin = (x0, y0, x1, y1, st) => {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    for (const s2 of st) g.addColorStop(s2[0], s2[1]);
    return g;
  };
  const ao = (x, r, a) => {
    c.save(); c.globalAlpha = a == null ? 0.3 : a; c.fillStyle = '#04070b';
    c.beginPath(); c.ellipse(x, -1, r, r * 0.22, 0, 0, 7); c.fill(); c.restore();
  };
  const blink = (tn % 4.3) < 0.1, blink2 = ((tn + 1.7) % 3.7) < 0.1;
  if (talking) c.rotate(-0.03 + Math.sin(tn * 8) * 0.015);
  switch (id) {
    case 'servo': {   // the Old Unit — a worn sphere on treads, still warm
      const br = Math.sin(tn * 1.9) * 0.8;
      ao(0, 17);
      // tread base: square = stable; it doesn't travel much anymore
      c.fillStyle = '#26241f'; rr(c, -13, -7, 26, 7, 3); c.fill();
      c.fillStyle = lin(-13, -8, 8, 0, [[0, '#5c584c'], [1, '#302d27']]);
      rr(c, -13, -7, 26, 3.4, 2); c.fill();
      c.fillStyle = '#171613';
      for (let k = -1; k <= 1; k++) { c.beginPath(); c.arc(k * 8, -3.4, 2.2, 0, 7); c.fill(); }
      // the body: one dome, DENTED on the right — a concave bite in the
      // silhouette that thirty years of service put there
      const body = () => {
        c.beginPath();
        c.moveTo(-13, -8);
        c.bezierCurveTo(-16, -20 - br, -9, -30.5 - br, 0, -31 - br);
        c.bezierCurveTo(7, -31 - br, 12, -26 - br, 13, -19 - br);
        c.quadraticCurveTo(13.6, -15, 11.6, -12.4);
        c.quadraticCurveTo(10.2, -10.4, 12.4, -8.4);
        c.closePath();
      };
      c.save(); body(); c.clip();
      c.fillStyle = lin(-14, -34, 12, -6, [[0, '#efe6d2'], [0.35, '#c9bda2'], [0.7, '#8d8371'], [1, '#565349']]);
      c.fillRect(-18, -36, 36, 32);
      c.fillStyle = 'rgba(150,86,58,0.5)';                 // rust bloom, one side only
      c.beginPath(); c.ellipse(9, -13 - br, 5, 7, 0.5, 0, 7); c.fill();
      c.fillStyle = 'rgba(122,66,44,0.45)';
      c.beginPath(); c.ellipse(11, -10 - br, 3, 4, 0.5, 0, 7); c.fill();
      c.strokeStyle = 'rgba(40,38,34,0.5)'; c.lineWidth = 1; // hatch seam
      c.beginPath(); c.arc(0, -14 - br, 8, 0.4, 2.7); c.stroke();
      // segmented rim: bright over a short arc, lost at both ends
      c.strokeStyle = lin(-13, -31, 4, -18, [[0, 'rgba(255,250,235,0)'], [0.45, 'rgba(255,250,235,0.9)'], [1, 'rgba(255,250,235,0)']]);
      c.lineWidth = 2.2; body(); c.stroke();
      c.restore();
      // brow ridge PLATE with a lit top edge; the eyes are housed under it
      c.fillStyle = lin(-9, -28 - br, 8, -22 - br, [[0, '#b6a88c'], [1, '#5f584a']]);
      rr(c, -9, -26.5 - br, 17.5, 4, 2); c.fill();
      c.strokeStyle = 'rgba(255,250,235,0.55)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(-8, -26.6 - br); c.lineTo(6.5, -26.8 - br); c.stroke();
      c.fillStyle = '#171512'; rr(c, -8, -23 - br, 15.5, 6.4, 3); c.fill();
      const ep = blink ? 0.12 : 1;
      c.fillStyle = 'rgba(255,201,100,' + ep + ')'; c.shadowColor = '#ffc964'; c.shadowBlur = 7;
      rr(c, -6.2, -22 - br, 4.6, 4.4, 1.6); c.fill();
      rr(c, 1.2, -22 - br, 4, 4, 1.6); c.fill();           // right eye a touch smaller
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(40,36,30,0.7)';                  // speaker grille
      for (let k = 0; k < 3; k++) c.fillRect(-3 + k * 2.4, -13.8 - br, 1.2, 2.6);
      // one antenna, bent by the years, lamp still burning — his emissive
      const asw = Math.sin(tn * 1.5) * 1.2;
      c.strokeStyle = '#57503f'; c.lineWidth = 1.8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-4, -29.5 - br); c.quadraticCurveTo(-7, -37 - br, -1 + asw, -40 - br); c.stroke();
      c.fillStyle = '#ff9430'; c.shadowColor = '#ff9430'; c.shadowBlur = 7;
      c.beginPath(); c.arc(-0.6 + asw, -40.4 - br, 2, 0, 7); c.fill(); c.shadowBlur = 0;
      // little folded arms
      c.strokeStyle = '#494438'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-11.5, -16 - br); c.quadraticCurveTo(-13.5, -12, -10.5, -10); c.stroke();
      c.beginPath(); c.moveTo(11, -15 - br); c.quadraticCurveTo(13, -12, 10.5, -10.5); c.stroke();
      break;
    }
    case 'ratchet': { // Hermes of the scrap heaps — his silhouette IS the shop
      const br = Math.sin(tn * 1.6) * 0.9;
      const sway = Math.sin(tn * 1.1) * 2.2;
      ao(2, 20);
      // BEHIND: the salvage pack towering over him
      const pack = () => {
        c.beginPath();
        c.moveTo(-19, -4);
        c.bezierCurveTo(-24, -18, -22, -34, -14, -40);
        c.quadraticCurveTo(-6, -44, 0, -40);
        c.quadraticCurveTo(2, -30, 1, -18);
        c.quadraticCurveTo(0, -8, -2, -4);
        c.closePath();
      };
      c.save(); pack(); c.clip();
      c.fillStyle = lin(-24, -44, 2, -6, [[0, '#9a8560'], [0.4, '#77654a'], [0.75, '#544838'], [1, '#3a3330']]);
      c.fillRect(-26, -46, 30, 44);
      c.fillStyle = 'rgba(140,110,70,0.7)'; rr(c, -20, -30, 9, 8, 2); c.fill();   // stitched patches,
      c.fillStyle = 'rgba(94,120,128,0.65)'; rr(c, -12, -38, 8, 7, 2); c.fill();  // mismatched on purpose
      c.strokeStyle = 'rgba(35,30,26,0.6)'; c.lineWidth = 1.2;                    // cargo straps
      c.beginPath(); c.moveTo(-22, -22); c.quadraticCurveTo(-10, -26, 1, -22); c.stroke();
      c.beginPath(); c.moveTo(-21, -12); c.quadraticCurveTo(-10, -16, 0, -12); c.stroke();
      c.restore();
      // dangling wares off the pack — the whole shop sways when he breathes
      for (let k = 0; k < 2; k++) {
        const tx2 = -21 + k * 5, tsw = Math.sin(tn * 1.4 + k * 2.1) * 1.4;
        c.strokeStyle = 'rgba(40,34,28,0.8)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(tx2, -20 + k * 9); c.lineTo(tx2 + tsw, -14 + k * 9); c.stroke();
        c.fillStyle = k ? '#8fa8b0' : '#c9a05e';
        if (k) { c.beginPath(); c.arc(tx2 + tsw, -12.5 + k * 9, 2, 0, 7); c.fill(); }
        else rr(c, tx2 + tsw - 1.6, -14, 3.2, 4, 1), c.fill();
      }
      // rolled tarp on top, and the lamp pole reaching forward
      c.fillStyle = lin(-16, -46, -4, -38, [[0, '#b8a67e'], [1, '#6e5f46']]);
      rr(c, -17, -45, 15, 6, 3); c.fill();
      c.strokeStyle = '#4a4238'; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-6, -44); c.quadraticCurveTo(4, -50, 10, -46); c.stroke();
      // the lantern — HIS light, swinging gently, selling warmth
      c.strokeStyle = '#3a342c'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(10, -46); c.lineTo(10 + sway, -40); c.stroke();
      c.save(); c.translate(10 + sway, -37.5);
      c.fillStyle = '#3a342c'; rr(c, -3, -3, 6, 7, 2); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter';
      const lg2 = c.createRadialGradient(0, 0.5, 0.5, 0, 0.5, 11);
      lg2.addColorStop(0, 'rgba(255,224,150,1)'); lg2.addColorStop(0.35, 'rgba(255,190,90,0.6)'); lg2.addColorStop(1, 'rgba(255,170,60,0)');
      c.fillStyle = lg2; c.beginPath(); c.arc(0, 0.5, 11, 0, 7); c.fill();
      c.restore();
      c.fillStyle = '#fff2cc'; c.shadowColor = '#ffcd62'; c.shadowBlur = 8;
      c.fillRect(-1.4, -1.6, 2.8, 4); c.shadowBlur = 0;
      c.restore();
      // the body: hunched over the counter — concave back, weight in the belly
      const bod = () => {
        c.beginPath();
        c.moveTo(-8, 0);
        c.bezierCurveTo(-12, -10 - br * 0.4, -10, -20 - br, -3, -26 - br);
        c.quadraticCurveTo(5, -30 - br, 10, -24 - br);
        c.bezierCurveTo(14, -18, 13, -8, 10, 0);
        c.closePath();
      };
      c.save(); bod(); c.clip();
      c.fillStyle = lin(-10, -30, 12, -2, [[0, '#d8bc8a'], [0.4, '#a9885c'], [0.75, '#77573c'], [1, '#4c3a30']]);
      c.fillRect(-14, -32, 30, 34);
      c.strokeStyle = 'rgba(52,40,32,0.7)'; c.lineWidth = 2.4;   // apron strap
      c.beginPath(); c.moveTo(-6, -24 - br); c.lineTo(9, -12); c.stroke();
      c.strokeStyle = 'rgba(255,236,200,0.35)'; c.lineWidth = 1; // its lit edge
      c.beginPath(); c.moveTo(-5.4, -25 - br); c.lineTo(9.6, -13); c.stroke();
      c.restore();
      // the head, thrust forward over the goods, hooded in a steel cap
      c.save(); c.translate(8, -27 - br); c.rotate(0.08 + (talking ? Math.sin(tn * 9) * 0.03 : 0));
      const hd = () => {
        c.beginPath(); c.moveTo(-7, 3);
        c.bezierCurveTo(-8, -4, -3, -8, 2, -8);
        c.bezierCurveTo(8, -8, 11, -4, 10.5, 1);
        c.quadraticCurveTo(10, 4.5, 6, 5);
        c.quadraticCurveTo(-2, 6, -7, 3); c.closePath();
      };
      c.save(); hd(); c.clip();
      c.fillStyle = lin(-8, -9, 10, 5, [[0, '#e6d2a4'], [0.45, '#b49468'], [1, '#6a5140']]);
      c.fillRect(-9, -10, 21, 17);
      c.restore();
      c.fillStyle = lin(-8, -10, 6, -2, [[0, '#8a9298'], [1, '#4c5258']]);
      c.beginPath(); c.moveTo(-8, -1); c.quadraticCurveTo(-6, -9.5, 2, -9.5);
      c.quadraticCurveTo(9, -9.5, 11, -4);
      c.quadraticCurveTo(9, -6.5, 2, -6.8); c.quadraticCurveTo(-4, -6.6, -8, -1);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(240,248,255,0.6)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(-7, -3); c.quadraticCurveTo(-4, -8.6, 2, -8.8); c.stroke();
      // gold optics under the cap — the appraising look
      c.fillStyle = '#141210'; rr(c, -1, -5.5, 10.6, 5.4, 2.4); c.fill();
      const ep2 = blink2 ? 0.15 : 1;
      c.fillStyle = 'rgba(255,205,98,' + ep2 + ')'; c.shadowColor = '#ffcd62'; c.shadowBlur = 7;
      rr(c, 0.2, -5, 4.6, 4.2, 1.4); c.fill(); rr(c, 5.6, -4.8, 3.8, 3.8, 1.4); c.fill();
      c.shadowBlur = 0;
      c.restore();
      // the counter crate and the arm resting on it, in FRONT of everything
      c.fillStyle = lin(12, -14, 24, 0, [[0, '#7c6a4c'], [1, '#453a2c']]);
      rr(c, 12, -12, 13, 12, 2); c.fill();
      c.fillStyle = 'rgba(230,210,170,0.35)'; c.fillRect(12, -12, 13, 2.2);
      c.strokeStyle = 'rgba(40,34,26,0.7)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(18.5, -10); c.lineTo(18.5, 0); c.stroke();
      c.strokeStyle = '#8a6f4c'; c.lineWidth = 3.6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(6, -20 - br); c.quadraticCurveTo(13, -18, 16, -12.6); c.stroke();
      c.fillStyle = '#c9a878'; c.beginPath(); c.arc(16.5, -12.4, 2.4, 0, 7); c.fill();
      break;
    }
    case 'mono': {    // the Oracle — a CRT face on a shroud of dead cables
      const br = Math.sin(tn * 1.4) * 0.7;
      ao(0, 15);
      const shroud = () => {
        c.beginPath(); c.moveTo(-4, -36);
        c.bezierCurveTo(-13, -28, -14, -12, -12, 0);
        c.lineTo(12, 0);
        c.bezierCurveTo(14, -12, 13, -28, 4, -36); c.closePath();
      };
      c.save(); shroud(); c.clip();
      c.fillStyle = lin(-12, -36, 12, 0, [[0, '#4c5670'], [0.45, '#333c54'], [1, '#1e2334']]);
      c.fillRect(-16, -38, 32, 40);
      c.lineWidth = 1.6; c.lineCap = 'round';
      for (let k = 0; k < 6; k++) {                        // the hanging cables
        const lx = -10 + k * 4 + (k % 2) * 1.2;
        c.strokeStyle = k === 2 ? 'rgba(120,190,255,0.5)' : 'rgba(20,24,36,0.65)';
        c.beginPath(); c.moveTo(lx, -32);
        c.bezierCurveTo(lx - 2, -20, lx + 2 * Math.sin(tn * 0.9 + k), -10, lx, 0); c.stroke();
      }
      c.restore();
      c.fillStyle = '#232838'; rr(c, -6, -38 - br, 12, 4, 2); c.fill();
      // the CRT head, tilted a few degrees — never square to the room
      c.save(); c.translate(0, -46 - br); c.rotate(-0.05);
      c.fillStyle = lin(-13, -9, 12, 9, [[0, '#8a94a8'], [0.4, '#5b6478'], [1, '#343a4c']]);
      rr(c, -13, -8, 26, 17, 5); c.fill();
      c.strokeStyle = 'rgba(230,240,255,0.5)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(-11, -7.2); c.lineTo(6, -7.5); c.stroke();
      c.fillStyle = '#081020'; rr(c, -10.5, -5.5, 21, 12, 3); c.fill();
      c.save(); rr(c, -10.5, -5.5, 21, 12, 3); c.clip();
      // the face is a waveform: it talks, it quickens
      c.strokeStyle = '#57c8ff'; c.shadowColor = '#57c8ff'; c.shadowBlur = 6; c.lineWidth = 1.6;
      c.beginPath();
      for (let x2 = -10; x2 <= 10; x2 += 1) {
        const y2 = 0.5 - Math.sin(x2 * 0.55 + tn * (talking ? 9 : 3)) * (talking ? 3.6 : 2.2) * Math.exp(-Math.abs(x2) * 0.06);
        x2 === -10 ? c.moveTo(x2, y2) : c.lineTo(x2, y2);
      }
      c.stroke(); c.shadowBlur = 0;
      c.globalAlpha = 0.16; c.fillStyle = '#9fd8ff';
      for (let k = -5; k < 6; k += 2) c.fillRect(-10.5, k, 21, 0.8);
      c.globalAlpha = 1;
      c.restore();
      c.restore();
      // the screen light SPILLS down the shroud — the light lives in the room
      c.save(); c.globalCompositeOperation = 'lighter';
      const sp = c.createRadialGradient(0, -40 - br, 3, 0, -26, 26);
      sp.addColorStop(0, 'rgba(87,200,255,0.2)'); sp.addColorStop(1, 'rgba(87,200,255,0)');
      c.fillStyle = sp; c.beginPath(); c.arc(0, -30, 26, 0, 7); c.fill();
      c.restore();
      break;
    }
    case 'patch': {   // the Tinker — copper dome, unequal goggles, torch arm
      const sc = Math.sin(tn * 7.7) * 1.6;
      ao(0, 15);
      for (let k = 0; k < 4; k++) {                        // shaded spider legs
        const lx = -12 + k * 8, lift = (k % 2 ? sc : -sc);
        c.strokeStyle = '#2e2820'; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(lx * 0.4, -11); c.lineTo(lx, -4 + lift); c.lineTo(lx + 3, 0 + lift * 0.5); c.stroke();
        c.strokeStyle = '#6e5f46'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(lx * 0.4 - 0.5, -11.7); c.lineTo(lx - 0.5, -4.8 + lift); c.stroke();
      }
      const dome = () => {
        c.beginPath(); c.moveTo(-11, -9);
        c.bezierCurveTo(-12, -20, -5, -26, 1, -26);
        c.bezierCurveTo(8, -26, 12, -20, 11, -11);
        c.quadraticCurveTo(6, -7, 0, -7);
        c.quadraticCurveTo(-6, -7, -11, -9); c.closePath();
      };
      c.save(); dome(); c.clip();
      c.fillStyle = lin(-11, -27, 11, -6, [[0, '#e2b184'], [0.4, '#a87850'], [0.8, '#6c4a36'], [1, '#48342c']]);
      c.fillRect(-13, -28, 26, 24);
      c.strokeStyle = 'rgba(30,24,20,0.5)'; c.lineWidth = 1;
      c.beginPath(); c.arc(0, -14, 9, 3.5, 5.9); c.stroke();
      c.restore();
      // goggles: UNEQUAL lenses, glass glint on the big one
      c.fillStyle = '#33302a';
      c.beginPath(); c.arc(-2, -21, 4.4, 0, 7); c.fill();
      c.beginPath(); c.arc(5.4, -20.4, 3.2, 0, 7); c.fill();
      c.fillStyle = '#ffd08a'; c.shadowColor = '#ffd08a'; c.shadowBlur = 6;
      c.beginPath(); c.arc(-2, -21, 2.6, 0, 7); c.fill();
      c.beginPath(); c.arc(5.4, -20.4, 1.8, 0, 7); c.fill(); c.shadowBlur = 0;
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1;
      c.beginPath(); c.arc(-3, -22.2, 2.6, 3.6, 4.8); c.stroke();
      // the torch arm, tip sputtering — his emissive
      c.strokeStyle = '#5c4c38'; c.lineWidth = 2.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(8, -16); c.quadraticCurveTo(14, -22, 15, -27 - sc * 0.6); c.stroke();
      const wp = Math.sin(tn * 23) > 0.2 ? 1 : 0.3;
      c.fillStyle = 'rgba(255,148,48,' + wp + ')'; c.shadowColor = '#ff9430'; c.shadowBlur = 9 * wp;
      c.beginPath(); c.arc(15.3, -28 - sc * 0.6, 1.8, 0, 7); c.fill(); c.shadowBlur = 0;
      break;
    }
    case 'sage': {    // the Archivist — a porcelain orb inside turning rings
      const hov = Math.sin(tn * 1.3) * 2.4;
      ao(0, 11, 0.2);
      c.save(); c.translate(0, -26 + hov);
      const ringTilt = Math.sin(tn * 0.7) * 0.3;
      c.strokeStyle = 'rgba(159,232,255,0.35)'; c.lineWidth = 2;   // back half
      c.beginPath(); c.ellipse(0, 0, 15, 5.4, ringTilt, Math.PI, Math.PI * 2); c.stroke();
      const orb = () => { c.beginPath(); c.arc(0, 0, 9, 0, 7); };
      c.save(); orb(); c.clip();
      c.fillStyle = lin(-8, -9, 8, 8, [[0, '#f2f6fa'], [0.45, '#b9c8d8'], [0.8, '#77879c'], [1, '#4c5870']]);
      c.fillRect(-10, -10, 20, 20);
      c.fillStyle = 'rgba(20,26,40,0.9)';
      rr(c, -5.5, -2.2, 11, 4.4, 2.2); c.fill();
      c.restore();
      const gp = 0.65 + Math.sin(tn * 2.1) * 0.25;
      c.fillStyle = 'rgba(159,232,255,' + gp + ')'; c.shadowColor = '#9fe8ff'; c.shadowBlur = 8;
      rr(c, -3.6, -1.4, 7.2, 2.8, 1.4); c.fill(); c.shadowBlur = 0;
      c.strokeStyle = 'rgba(159,232,255,0.5)'; c.lineWidth = 2;    // front half
      c.beginPath(); c.ellipse(0, 0, 15, 5.4, ringTilt, 0, Math.PI); c.stroke();
      const ba = (tn * 1.6) % Math.PI;                             // one bright segment
      c.strokeStyle = '#e8fbff'; c.lineWidth = 2.2;
      c.beginPath(); c.ellipse(0, 0, 15, 5.4, ringTilt, ba, ba + 0.7); c.stroke();
      c.restore();
      c.strokeStyle = 'rgba(159,232,255,0.4)'; c.lineWidth = 1.6;  // drifting glyph threads
      for (let k = 0; k < 4; k++) {
        const aa = -0.7 + k * 0.46 + Math.sin(tn * 1.4 + k) * 0.1;
        c.beginPath(); c.moveTo(0, -16 + hov); c.quadraticCurveTo(Math.sin(aa) * 16, -8, Math.sin(aa) * 22, 2); c.stroke();
      }
      break;
    }
    case 'lumen': {   // the Lost Nymph — a leaf-wrapped light
      const fl = Math.sin(tn * 11) * 4;
      const gp = 0.5 + Math.sin(tn * 2.4) * 0.35;
      ao(0, 8, 0.16);
      c.save(); c.translate(0, -16 - Math.sin(tn * 1.2) * 3);
      c.save(); c.globalCompositeOperation = 'lighter';
      const au = c.createRadialGradient(0, 2, 1, 0, 2, 20);
      au.addColorStop(0, 'rgba(125,255,154,' + (0.22 + gp * 0.14) + ')');
      au.addColorStop(1, 'rgba(125,255,154,0)');
      c.fillStyle = au; c.beginPath(); c.arc(0, 2, 20, 0, 7); c.fill();
      for (const sd of [-1, 1]) {                          // veined additive wings
        c.save(); c.translate(sd * 4, -4); c.rotate(sd * (0.45 + fl * 0.04));
        const wg = c.createLinearGradient(0, 0, sd * 13, -6);
        wg.addColorStop(0, 'rgba(190,255,210,0.5)'); wg.addColorStop(1, 'rgba(125,255,154,0.06)');
        c.fillStyle = wg;
        c.beginPath(); c.ellipse(sd * 7, -2, 8.5, 3.4, sd * -0.4, 0, 7); c.fill();
        c.strokeStyle = 'rgba(220,255,230,0.5)'; c.lineWidth = 0.8;
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(sd * 8, -4.5, sd * 14, -4); c.stroke();
        c.restore();
      }
      c.restore();
      const bod = () => {
        c.beginPath(); c.moveTo(0, -11);
        c.bezierCurveTo(6.5, -7, 6, 3, 0, 9);
        c.bezierCurveTo(-6, 3, -6.5, -7, 0, -11); c.closePath();
      };
      c.save(); bod(); c.clip();
      c.fillStyle = lin(-6, -11, 6, 9, [[0, '#69a878'], [0.45, '#3f7052'], [1, '#22402e']]);
      c.fillRect(-8, -12, 16, 22);
      c.restore();
      c.strokeStyle = 'rgba(210,255,225,0.7)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(-2.6, -9); c.quadraticCurveTo(-5, -3, -3.4, 4); c.stroke();
      c.fillStyle = 'rgba(220,255,230,' + (0.75 + gp * 0.25) + ')';
      c.shadowColor = '#7dff9a'; c.shadowBlur = 9 + gp * 8;
      c.beginPath(); c.arc(0, -1, 3.4, 0, 7); c.fill(); c.shadowBlur = 0;
      c.fillStyle = '#10241a'; c.fillRect(-2.6, -7.4, 1.8, 1.8); c.fillRect(1, -7.4, 1.8, 1.8);
      c.restore();
      break;
    }
  }
}
// ---- the Odyssey's people ------------------------------------------------
// Robed, human, Greek — drawn in the same local space as the machine NPCs
// (origin at the feet, already flipped to face the player). Breathing and
// small gestures live on performance.now() like their machine counterparts.
function drawHeroNPC(c, id, s) {
  const tn = performance.now() / 1000 + (s.t || 0);
  const br = Math.sin(tn * 1.7) * 0.8;                 // breath
  const robe = (x, w, h, col, hem) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x - w * 0.32, -h);
    c.quadraticCurveTo(x - w * 0.62, -h * 0.4, x - w * 0.5, 0);
    c.lineTo(x + w * 0.5, 0);
    c.quadraticCurveTo(x + w * 0.62, -h * 0.4, x + w * 0.32, -h);
    c.closePath(); c.fill();
    if (hem) { c.fillStyle = hem; c.fillRect(x - w * 0.5, -3, w, 3); }
  };
  const head = (x, y, r, skin) => {
    c.fillStyle = skin || '#d8b896';
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  };
  switch (id) {
    case 'servo': {   // Old Mentor — bearded elder leaning on a knotted staff
      c.strokeStyle = '#6e5a3a'; c.lineWidth = 2.6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(13, 0); c.lineTo(10, -34 - br); c.stroke();
      c.fillStyle = '#8a7248'; c.beginPath(); c.arc(10, -35 - br, 2.6, 0, 7); c.fill();
      robe(0, 24, 26 + br, '#8a8298', '#6b657a');
      head(0, -30 - br, 7.5);
      c.fillStyle = '#e8e4da';                          // beard + brow
      c.beginPath(); c.moveTo(-5, -28 - br); c.quadraticCurveTo(0, -16 - br, 5, -28 - br); c.closePath(); c.fill();
      c.fillStyle = '#f2efe8'; c.beginPath(); c.arc(0, -36 - br, 5.5, Math.PI, 0); c.fill();
      c.fillStyle = '#2a2a30'; c.fillRect(1, -32 - br, 2, 2); c.fillRect(5, -32 - br, 2, 2);
      return true;
    }
    case 'ratchet': { // Hermion the Trader — chiton, amphora, a coin in hand
      c.fillStyle = '#b06a42';                           // the amphora
      c.beginPath(); c.ellipse(-15, -9, 6, 9, 0, 0, 7); c.fill();
      c.fillStyle = '#8a4f30'; c.fillRect(-18, -20, 6, 4);
      robe(0, 22, 24 + br, '#e8e0cc', '#c8a84a');
      head(0, -28 - br, 7);
      c.fillStyle = '#4a3b28';                           // curls
      c.beginPath(); c.arc(0, -32 - br, 5.5, Math.PI * 0.95, Math.PI * 0.05); c.fill();
      c.fillStyle = '#2a2a30'; c.fillRect(2, -29 - br, 2, 2); c.fillRect(5.5, -29 - br, 2, 2);
      const cp = 0.5 + Math.sin(tn * 4) * 0.5;           // the coin turning
      c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 6 * cp;
      c.beginPath(); c.ellipse(12, -18 - br, 2.8 * (0.4 + cp * 0.6), 2.8, 0, 0, 7); c.fill();
      c.shadowBlur = 0;
      return true;
    }
    case 'mono': {    // the Oracle — veiled, gold circlet, eyes like embers
      robe(0, 24, 34 + br, '#3a4668', '#2a3450');
      c.fillStyle = '#3a4668';                           // the veil over the head
      c.beginPath(); c.arc(0, -36 - br, 9, Math.PI * 0.9, Math.PI * 0.1); c.fill();
      c.fillRect(-9, -36 - br, 18, 8);
      c.fillStyle = '#141a2a'; c.beginPath(); c.arc(0, -33 - br, 6, 0, 7); c.fill();
      const gp = 0.6 + Math.sin(tn * 2.2) * 0.3;
      c.fillStyle = 'rgba(159,208,255,' + gp + ')';
      c.shadowColor = '#9fd0ff'; c.shadowBlur = 8;
      c.fillRect(-3.5, -34 - br, 2.6, 2.6); c.fillRect(1, -34 - br, 2.6, 2.6);
      c.shadowBlur = 0;
      c.strokeStyle = '#ffd76a'; c.lineWidth = 1.6;      // circlet
      c.beginPath(); c.arc(0, -37 - br, 8.4, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      return true;
    }
    case 'sage': {    // the Sibyl — hooded, an unrolled scroll in her hands
      robe(0, 25, 30 + br, '#4d5c70', '#3d4a5c');
      c.fillStyle = '#4d5c70';
      c.beginPath(); c.arc(0, -32 - br, 8.5, Math.PI * 0.85, Math.PI * 0.15); c.fill();
      c.fillStyle = '#1a2230'; c.beginPath(); c.arc(0, -30 - br, 5.5, 0, 7); c.fill();
      c.fillStyle = '#9fe8ff'; c.shadowColor = '#9fe8ff'; c.shadowBlur = 7;
      c.fillRect(-3, -31 - br, 2.2, 2.2); c.fillRect(1, -31 - br, 2.2, 2.2); c.shadowBlur = 0;
      c.fillStyle = '#e8e0c8';                            // the scroll
      c.fillRect(-9, -18 - br * 0.5, 18, 6);
      c.fillStyle = '#c8b890'; c.fillRect(-11, -19 - br * 0.5, 3, 8); c.fillRect(8, -19 - br * 0.5, 3, 8);
      return true;
    }
    case 'patch': {   // the Tinker of Daedalus — leather apron, bronze wing
      const sc = Math.sin(tn * 7) * 1.4;                 // hammer taps
      c.fillStyle = '#8a7248';                            // the half-built wing
      for (let k = 0; k < 3; k++) {
        c.beginPath(); c.ellipse(-14 - k * 3, -10 - k * 5, 7 - k, 2.6, -0.5, 0, 7); c.fill();
      }
      robe(0, 21, 22 + br, '#a08862', null);
      c.fillStyle = '#6e5a3a'; c.fillRect(-8, -20 - br, 16, 14);   // apron
      head(0, -26 - br, 6.5);
      c.fillStyle = '#4a3b28'; c.beginPath(); c.arc(0, -29 - br, 5, Math.PI, 0); c.fill();
      c.fillStyle = '#2a2a30'; c.fillRect(1.5, -27 - br, 2, 2); c.fillRect(4.5, -27 - br, 2, 2);
      c.strokeStyle = '#5c5346'; c.lineWidth = 2.2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(9, -16); c.lineTo(15, -22 - sc); c.stroke();
      c.fillStyle = '#8a8ea0'; c.fillRect(13, -26 - sc, 6, 4);     // hammer head
      return true;
    }
    // 'lumen' (the Lost Nymph) keeps the shared leaf-sprite — she already
    // reads as a wood spirit in both worlds.
  }
  return false;
}
// ---- portrait system: a 64×64 dialogue bust with real face acting --------
// Expressions ride on the three things that read at this size: the visor's
// light, the set of the ears, and the tilt of the head.
function drawPortrait(c, x, y, expr, bare) {
  // bare: no dialog frame or clip — the comic intro uses the bust raw
  const tn = performance.now() / 1000;
  const hero = typeof isHero === 'function' && isHero();
  const blink = (tn % 3.4) < 0.09;                     // random-feeling blink
  const E = {
    neutral:    { earL: -0.18, earR: 0.18, glow: 0.85, tilt: 0 },
    determined: { earL: -0.55, earR: 0.55, glow: 0.85 + Math.sin(tn * 6) * 0.15, tilt: -0.04 },
    hurt:       { earL: -0.15, earR: 0.85, glow: 0.4 + (Math.sin(tn * 13) > 0.4 ? 0.35 : 0), tilt: 0.08 },
    curious:    { earL: -0.34, earR: 0.28, glow: 0.75, tilt: -0.09 },
    sad:        { earL: 0.55, earR: 0.75, glow: 0.4, tilt: 0.12 },
    angry:      { earL: -0.9, earR: 0.9, glow: 0.6 + (Math.sin(tn * 22) > 0 ? 0.4 : 0), tilt: -0.06 },
  }[expr] || { earL: -0.18, earR: 0.18, glow: 0.85, tilt: 0 };
  c.save();
  if (!bare) {
    // frame
    c.fillStyle = 'rgba(10,18,28,0.92)'; c.strokeStyle = 'rgba(55,255,208,0.45)'; c.lineWidth = 1.5;
    rr(c, x, y, 64, 64, 8); c.fill(); rr(c, x, y, 64, 64, 8); c.stroke();
    c.beginPath(); rr(c, x + 1, y + 1, 62, 62, 7); c.clip();
  }
  c.translate(x + 32, y + 40); c.rotate(E.tilt);
  if (hero) {
    // bronze-helm bust for the Odyssey theme
    const hgd = c.createLinearGradient(0, -30, 0, 12);
    hgd.addColorStop(0, '#f4e6c8'); hgd.addColorStop(0.5, '#e2cfa0'); hgd.addColorStop(1, '#a8895c');
    c.fillStyle = hgd; rr(c, -20, -26, 40, 40, 12); c.fill();
    c.fillStyle = '#b8934c'; c.beginPath(); c.arc(0, -14, 23, Math.PI, 0); c.fill();
    c.fillRect(-23, -16, 46, 6);
    c.strokeStyle = '#e0484f'; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.arc(-2, -18, 26, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    c.fillStyle = '#2a1e10'; rr(c, -14, -8, 28, 10, 4); c.fill();
    c.fillStyle = blink ? '#6a5a3a' : '#ffd76a';
    c.shadowColor = '#ffd76a'; c.shadowBlur = 8;
    c.fillRect(-10, -6, 7, 6); c.fillRect(3, -6, 7, 6); c.shadowBlur = 0;
  } else {
    // ears carry the emotion — rotate at the base per expression
    for (const s of [-1, 1]) {
      c.save(); c.translate(s * 15, -22); c.rotate(s > 0 ? E.earR : E.earL);
      c.fillStyle = '#dfe6f0';
      c.beginPath(); c.moveTo(-7, 2); c.lineTo(0, -18); c.lineTo(8, 3); c.closePath(); c.fill();
      c.fillStyle = 'rgba(55,255,208,0.5)';
      c.beginPath(); c.moveTo(-3, 0); c.lineTo(0, -11); c.lineTo(4, 1); c.closePath(); c.fill();
      c.restore();
    }
    // ceramic dome
    const hgd = c.createLinearGradient(0, -30, 0, 14);
    hgd.addColorStop(0, '#ffffff'); hgd.addColorStop(0.45, '#eef3fa'); hgd.addColorStop(1, '#9daabd');
    c.fillStyle = hgd; rr(c, -22, -26, 44, 42, 14); c.fill();
    c.strokeStyle = '#7d8a9c'; c.lineWidth = 1.2; rr(c, -22, -26, 44, 42, 14); c.stroke();
    c.fillStyle = 'rgba(70,88,110,0.25)'; rr(c, -22, 4, 44, 12, 8); c.fill();
    // visor — the LED strip that does the acting
    c.fillStyle = '#0a1420'; rr(c, -17, -12, 34, 13, 5); c.fill();
    const g = blink ? 0.15 : E.glow;
    c.fillStyle = expr === 'hurt' ? 'rgba(255,140,120,' + g + ')' : 'rgba(55,255,208,' + g + ')';
    c.shadowColor = '#37ffd0'; c.shadowBlur = 9;
    const eyeH = expr === 'sad' || blink ? 3 : 7;
    c.fillRect(-13, -9 + (7 - eyeH) / 2, 9, eyeH); c.fillRect(4, -9 + (7 - eyeH) / 2, 9, eyeH);
    c.shadowBlur = 0;
    if (expr === 'curious') {                          // slow scan sweep
      const k = (tn % 1.6) / 1.6;
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.fillRect(-16 + k * 29, -11, 2.5, 11);
    }
    // muzzle seam + whiskers
    c.strokeStyle = 'rgba(70,85,105,0.6)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-4, 8); c.lineTo(4, 8); c.stroke();
    c.strokeStyle = 'rgba(200,220,240,0.65)';
    c.beginPath();
    c.moveTo(18, 2); c.lineTo(26, 0); c.moveTo(18, 6); c.lineTo(26, 7);
    c.moveTo(-18, 2); c.lineTo(-26, 0); c.moveTo(-18, 6); c.lineTo(-26, 7);
    c.stroke();
    // scarf collar at the jaw
    c.fillStyle = '#e0484f'; rr(c, -20, 13, 40, 9, 4); c.fill();
    c.fillStyle = '#a63740'; rr(c, -20, 18, 40, 4, 2); c.fill();
  }
  c.restore();
}
function drawCtrl() {
  // With a pad attached this screen becomes the controller map: every action,
  // the button it sits on, and a live highlight of whatever you are pressing.
  if (PAD.on) { drawPadCfg(); return; }
  const lines = t('ctl');
  // THE LIST GREW AND THE BOX DID NOT. This was a fixed 560x390 panel with
  // hard-coded 33px steps from y=170: fine at nine lines, and every line added
  // since — the Song, batting shots, Repair, Interact, Map — ran out of the
  // bottom of the frame and printed on top of the footer. Nothing here is a
  // constant any more; the panel is sized from the content and the content is
  // fitted to the panel, so adding a line or translating into a language with
  // longer ones cannot break it again.
  const n = lines.length;
  const PX = 120, PY = 52, PW = 720, PH = 476;          // 960x540 design space
  dimPanel(PX, PY, PW, PH);
  ftxt(t('ctl_title'), 480, PY + 40, 28, '#eef3fa', 'center', '#37ffd0');
  const top = PY + 74, bot = PY + PH - 46;              // band left for the list
  const step = Math.min(28, (bot - top) / n);
  const size = Math.max(11, Math.min(15, step * 0.54));
  // EVERY LINE IS ALREADY A TABLE ROW — "Jump — Z or Space (again in air…)" is
  // an action and its explanation, and centring the two as one string is what
  // made a wall of text out of a reference card. Split on the dash and set it
  // as two columns: actions flush against the gutter, details flush away from
  // it, so the eye finds the move first and reads the detail only if it wants
  // it. A line with no dash is an aside and stays centred and dimmer.
  const rtl = LANG === 'ar';
  const gutL = rtl ? 500 : 460, gutR = rtl ? 484 : 496;
  for (let i = 0; i < n; i++) {
    const y = top + step * (i + 0.5);
    const cut = String(lines[i]).indexOf(' — ');
    // An action name is short. "Any swing knocks bullets out of the air — you
    // can bat shots away" is a sentence that happens to contain a dash, and
    // setting its first half as a column heading is worse than not splitting
    // at all, so length decides rather than punctuation alone.
    if (cut < 0 || cut > 18) {
      ftxt(lines[i], 480, y, size * 0.92, '#93a9bd', 'center', null, '600');
      continue;
    }
    ftxt(lines[i].slice(0, cut), gutL, y, size, '#dff3ff',
      rtl ? 'left' : 'right', null, '700');
    ftxt(lines[i].slice(cut + 3), gutR, y, size, '#a8bfd0',
      rtl ? 'right' : 'left', null, '500');
  }
  // and when there is no pad, say what was actually looked for — "connect a
  // controller" is useless advice to somebody who has connected one
  const diag = typeof padDiag === 'function' ? padDiag() : '';
  ftxt(diag || t('ctl_nopad'), 480, PY + PH - 30, 12, diag ? '#8a7a5e' : '#66788a');
  ftxt(t('back') + ' — Esc / Enter', 480, PY + PH - 12, 13, '#7d93a8');
}
function drawPadCfg() {
  dimPanel(96, 42, 768, 464);
  ftxt(t('pad_title'), 480, 78, 26, '#eef3fa', 'center', '#37ffd0');
  const nm = PAD.id ? (PAD.id.length > 52 ? PAD.id.slice(0, 52) + '…' : PAD.id) : t('pad_generic');
  ftxt('● ' + nm, 480, 104, 12, '#8fd8c8');
  const n = PAD_ACTIONS.length, colH = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) {
    const a = PAD_ACTIONS[i];
    const col = i < colH ? 0 : 1, row = i % colH;
    const x = 140 + col * 372, y = 142 + row * 40;
    const sel = i === G.padIdx;
    const btn = PAD.map[a];
    const live = btn >= 0 && PAD.down[btn];
    if (sel) {
      c.fillStyle = 'rgba(55,255,208,0.10)'; rr(c, x - 16, y - 17, 344, 34, 8); c.fill();
      c.strokeStyle = '#37ffd0'; c.lineWidth = 1.6; rr(c, x - 16, y - 17, 344, 34, 8); c.stroke();
    }
    ftxt(t('pa_' + a), x, y, 15, sel ? '#eef3fa' : '#9fb8c8', 'left');
    const bx = x + 246, listening = PAD.listen === a;
    c.fillStyle = listening ? 'rgba(255,215,106,0.22)' : live ? 'rgba(55,255,208,0.30)' : 'rgba(20,32,44,0.9)';
    rr(c, bx, y - 14, 88, 28, 7); c.fill();
    c.strokeStyle = listening ? '#ffd76a' : live ? '#37ffd0' : 'rgba(120,150,170,0.5)';
    c.lineWidth = live || listening ? 2 : 1.2; rr(c, bx, y - 14, 88, 28, 7); c.stroke();
    ftxt(listening ? t('pad_press') : padLabel(btn), bx + 44, y, listening ? 12 : 14,
         listening ? '#ffd76a' : live ? '#eafff9' : '#cfe3ef');
  }
  ftxt(t('pad_move'), 480, 412, 12, '#8aa2b5');
  // A ROW SHOWING "—" HAS TO SAY WHAT TO DO INSTEAD. Every real button on a
  // pad is spoken for, so the Neural Tree and the Crests have none — and a
  // dash with no explanation is how a player concludes the screen is simply
  // unreachable, which is exactly what happened.
  ftxt(t('pad_none').replace('%s', padLabel(PAD.map.PAUSE)), 480, 430, 12, '#b48cff');
  ftxt(t('pad_hint'), 480, 454, 13, '#cfe3ef');
  ftxt(t('pad_reset'), 480, 476, 12, '#7d93a8');
}
const miniCache = {};
function roomMini(id) {
  if (miniCache[id]) return miniCache[id];
  const def = ROOMS[id], g = buildRoom(id), P = PAL[def.zone], s = 2;
  const mc = document.createElement('canvas');
  mc.width = def.w * s; mc.height = def.h * s;
  const m = mc.getContext('2d');
  m.globalAlpha = 0.45; m.fillStyle = P.dark; m.fillRect(0, 0, mc.width, mc.height);
  m.globalAlpha = 1;
  for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) {
    const ch = g[y][x];
    if (ch === '#' || ch === 'B') { m.fillStyle = P.edge; m.globalAlpha = 0.85; m.fillRect(x * s, y * s, s, s); }
    else if (ch === '=') { m.fillStyle = P.edge; m.globalAlpha = 0.6; m.fillRect(x * s, y * s, s, 1); }
    else if (ch === '^') { m.fillStyle = '#ff6a7a'; m.globalAlpha = 0.9; m.fillRect(x * s, y * s + 1, s, 1); }
    m.globalAlpha = 1;
  }
  miniCache[id] = mc;
  return mc;
}
const MAP_BOSSROOM = { A4: 'Glitch', B4: 'Brood', C3: 'Atlas', D3: 'Zero', X1: 'Prism', E3: 'Mother' };
// ---------------------------------------------------------------------------
// THE MAP. A fixed grid squeezed into one screen tells you where the rooms are
// but never lets you look at one. This is a real chart you can drive: it opens
// framed on the room you are standing in, and from there you can push in far
// enough to read a room's actual terrain, or pull back to see the whole factory
// at once. Wheel or pinch to zoom, drag or steer to pan, and one key puts the
// whole thing back on screen.
// ---------------------------------------------------------------------------
const MAP_ZMIN = 0.55, MAP_ZMAX = 4.2;
const mapView = { z: 1, x: 0, y: 0, ready: false, drag: null, pinch: 0 };
function mapContentBox() {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const id in MAPPOS) {
    const [gx, gy, w, h] = MAPPOS[id];
    if (gx < x0) x0 = gx; if (gy < y0) y0 = gy;
    if (gx + w > x1) x1 = gx + w; if (gy + h > y1) y1 = gy + h;
  }
  return { x0, y0, x1, y1 };
}
// frame everything, so "where am I in all this" is always one press away
function mapFit() {
  const b = mapContentBox(), cell = 62;
  const w = (b.x1 - b.x0) * cell, h = (b.y1 - b.y0) * cell;
  mapView.z = clamp(Math.min(860 / Math.max(1, w), 400 / Math.max(1, h)), MAP_ZMIN, MAP_ZMAX);
  mapView.x = 480 - (b.x0 * cell + w / 2) * mapView.z;
  mapView.y = 292 - (b.y0 * cell + h / 2) * mapView.z;
}
// open centred on where she is actually standing
function mapCenterOnRoom(id) {
  const pos = MAPPOS[id]; if (!pos) return mapFit();
  const cell = 62;
  mapView.x = 480 - (pos[0] + pos[2] / 2) * cell * mapView.z;
  mapView.y = 292 - (pos[1] + pos[3] / 2) * cell * mapView.z;
}
function mapZoomAt(sx, sy, f) {
  const nz = clamp(mapView.z * f, MAP_ZMIN, MAP_ZMAX);
  const k = nz / mapView.z;
  // keep whatever is under the cursor or the pinch centre pinned in place
  mapView.x = sx - (sx - mapView.x) * k;
  mapView.y = sy - (sy - mapView.y) * k;
  mapView.z = nz;
}
function mapOpen() {
  mapView.z = 1.35; mapView.ready = true; mapView.drag = null;
  mapCenterOnRoom(G.roomId);
}
function updateMap(dt) {
  if (!mapView.ready) mapOpen();
  // steering: stick, arrows or WASD push the chart around
  const sp = 620 * dt;
  if (inD('LEFT')) mapView.x += sp;
  if (inD('RIGHT')) mapView.x -= sp;
  if (inD('UP')) mapView.y += sp;
  if (inD('DOWN')) mapView.y -= sp;
  if (inD('JUMP') || inD('DASH')) mapZoomAt(480, 292, 1 + 1.9 * dt);
  if (inD('ATK') || inD('CAST')) mapZoomAt(480, 292, 1 - 1.6 * dt);
  if (inP('INT')) mapFit();
  if (inP('CLAW')) { mapView.z = 1.35; mapCenterOnRoom(G.roomId); }
  // never let the chart be driven off into empty space
  const b = mapContentBox(), cell = 62, m = 420;
  mapView.x = clamp(mapView.x, 960 - m - b.x1 * cell * mapView.z, m - b.x0 * cell * mapView.z);
  mapView.y = clamp(mapView.y, 540 - m - b.y1 * cell * mapView.z, m - b.y0 * cell * mapView.z);
}
// wheel on desktop; the touch layer feeds drag and pinch through mapPointer()
addEventListener('wheel', (e) => {
  if (typeof G === 'undefined' || G.state !== 'MAP') return;
  e.preventDefault();
  const r = (typeof cv !== 'undefined' && cv && cv.getBoundingClientRect) ? cv.getBoundingClientRect() : null;
  const sx = r ? (e.clientX - r.left) * (960 / r.width) : 480;
  const sy = r ? (e.clientY - r.top) * (540 / r.height) : 292;
  mapZoomAt(sx, sy, e.deltaY < 0 ? 1.14 : 1 / 1.14);
}, { passive: false });
// mouse drag to pan, so the chart works the way every other map does
addEventListener('mousedown', (e) => {
  if (typeof G === 'undefined' || G.state !== 'MAP') return;
  const r = cv && cv.getBoundingClientRect ? cv.getBoundingClientRect() : null;
  if (r) {
    const sx = (e.clientX - r.left) * (960 / r.width), sy = (e.clientY - r.top) * (540 / r.height);
    if (mapTap(sx, sy)) return;              // a control, not the chart
  }
  mapView.drag = { x: e.clientX, y: e.clientY };
});
addEventListener('mousemove', (e) => {
  if (typeof G === 'undefined' || G.state !== 'MAP' || !mapView.drag) return;
  const r = (typeof cv !== 'undefined' && cv && cv.getBoundingClientRect) ? cv.getBoundingClientRect() : null;
  const k = r ? 960 / r.width : 1;
  mapView.x += (e.clientX - mapView.drag.x) * k;
  mapView.y += (e.clientY - mapView.drag.y) * k;
  mapView.drag = { x: e.clientX, y: e.clientY };
});
addEventListener('mouseup', () => { mapView.drag = null; });

function drawMap() {
  c.fillStyle = 'rgba(4,7,12,0.9)'; c.fillRect(0, 0, 960, 540);
  if (!mapView.ready) mapOpen();
  ftxt(t('map_title'), 480, 40, 26, '#eef3fa', 'center', '#37ffd0');
  c.save();
  // everything below is drawn in chart space; the view transform does the rest
  c.beginPath(); c.rect(0, 58, 960, 440); c.clip();
  c.translate(mapView.x, mapView.y); c.scale(mapView.z, mapView.z);
  const cell = 62, ox = 0, oy = 0;
  const rectFor = id => {
    const [gx, gy, w, h] = MAPPOS[id];
    return { x: ox + gx * cell + 3, y: oy + gy * cell + 3, w: w * cell - 6, h: h * cell - 6 };
  };
  // travel routes between explored rooms
  c.strokeStyle = 'rgba(140,200,230,0.35)'; c.lineWidth = 3;
  for (const id in MAPPOS) {
    if (!G.save.visited[id]) continue;
    const ex = ROOMS[id].exits || {};
    for (const side in ex) {
      let d = ex[side]; if (typeof d === 'object') d = d.to;
      if (!G.save.visited[d] || d < id) continue;
      const a = rectFor(id), b = rectFor(d);
      c.beginPath(); c.moveTo(a.x + a.w / 2, a.y + a.h / 2); c.lineTo(b.x + b.w / 2, b.y + b.h / 2); c.stroke();
    }
  }
  // room miniatures with real terrain
  for (const id in MAPPOS) {
    if (!G.save.visited[id]) continue;
    const P = PAL[ROOMS[id].zone], rc = rectFor(id);
    c.fillStyle = '#0a1016'; rr(c, rc.x, rc.y, rc.w, rc.h, 5); c.fill();
    const mc = roomMini(id);
    const fit = Math.min((rc.w - 6) / mc.width, (rc.h - 6) / mc.height);
    const mw = mc.width * fit, mh = mc.height * fit;
    const mx = rc.x + (rc.w - mw) / 2, my = rc.y + (rc.h - mh) / 2;
    c.save(); rr(c, rc.x, rc.y, rc.w, rc.h, 5); c.clip();
    c.imageSmoothingEnabled = false;
    c.drawImage(mc, mx, my, mw, mh);
    c.restore(); c.imageSmoothingEnabled = true;
    c.strokeStyle = P.edge; c.lineWidth = 1.5; rr(c, rc.x, rc.y, rc.w, rc.h, 5); c.stroke();
    if (BENCH_ROOMS.indexOf(id) >= 0 || (ROOMS[id].cave && ROOMS[id].ents.some(e => e[0] === 'bench')))
      ftxt('◆', rc.x + 10, rc.y + 11, 11, '#aef7d8');
    if (id === 'A3') ftxt('⚙', rc.x + 10, rc.y + rc.h - 11, 11, '#ffd76a');
    // THE CAVE SIGN (owner: "the caves on the map should appear as a cave
    // sign... the starting of several caves in several locations"): the arch
    // marks any visited room whose backdrop holds a REVEALED depth door into
    // a cave — the mouth is where you go, so the mouth is what the map marks.
    {
      // ANY revealed door into a cave marks the room — a hub with two of them
      // is still one room with a mouth in it
      if (gateDoors(id).some(gd => ROOMS[gd.to] && ROOMS[gd.to].cave))
        ftxt('∩', rc.x + rc.w - 11, rc.y + rc.h - 10, 13, '#dff2ff');
    }
    if (MAP_BOSSROOM[id]) {
      const done = G.save.flags['boss' + MAP_BOSSROOM[id]];
      ftxt(done ? '✓' : '☠', rc.x + rc.w - 11, rc.y + 11, 12, done ? '#7de8a0' : '#ff6a7a');
    }
    if (id === G.roomId && player) {
      const relx = mx + (player.x / (ROOMS[id].w * TILE)) * mw;
      const rely = my + (player.y / (ROOMS[id].h * TILE)) * mh;
      const pu = 0.6 + Math.sin(performance.now() / 250) * 0.4;
      c.fillStyle = 'rgba(255,255,255,' + pu + ')'; c.shadowColor = '#ffffff'; c.shadowBlur = 8;
      c.beginPath(); c.arc(relx, rely, 3.5, 0, 7); c.fill(); c.shadowBlur = 0;
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2;
      rr(c, rc.x - 2, rc.y - 2, rc.w + 4, rc.h + 4, 6); c.stroke();
    }
  }
  c.restore();
  // zoom readout and the controls, in screen space above the chart
  const btns = mapButtons();
  for (const b of btns) {
    c.fillStyle = 'rgba(10,18,26,0.85)';
    rr(c, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2, 8); c.fill();
    c.strokeStyle = 'rgba(120,220,255,0.5)'; c.lineWidth = 1.5;
    rr(c, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2, 8); c.stroke();
    ftxt(b.icon, b.x, b.y, b.icon.length > 1 ? 12 : 19, '#cfe8ff', 'center');
  }
  ftxt(Math.round(mapView.z * 100) + '%', 900, 96, 12, '#7d93a8', 'center');
  ftxt('● ' + t('map_here') + '   ◆ ' + t('rest').replace('E — ', '') + '   ☠ ' + t('map_boss') + '   ⚙ ' + t('map_shop') + '   ∩ ' + t('map_cave'), 480, 502, 13, '#7d93a8');
  ftxt(t('map_ctl'), 480, 522, 12, '#5f7488');
}
// the three on-screen controls, shared by the mouse and the touch layer
function mapButtons() {
  return [
    { code: 'ZIN', x: 900, y: 130, r: 19, icon: '＋' },
    { code: 'ZOUT', x: 900, y: 176, r: 19, icon: '－' },
    { code: 'ZFIT', x: 900, y: 222, r: 19, icon: '⤢' },
    { code: 'ZME', x: 900, y: 268, r: 19, icon: '◉' },
    // always reachable by thumb: a chart you cannot close is a trap
    { code: 'ZBACK', x: 44, y: 38, r: 19, icon: '✕' },
  ];
}
// a tap or click on one of them, in 960x540 screen coordinates
function mapTap(sx, sy) {
  for (const b of mapButtons()) {
    if (Math.abs(sx - b.x) <= b.r + 8 && Math.abs(sy - b.y) <= b.r + 8) {
      if (b.code === 'ZIN') mapZoomAt(480, 292, 1.3);
      else if (b.code === 'ZOUT') mapZoomAt(480, 292, 1 / 1.3);
      else if (b.code === 'ZFIT') mapFit();
      else if (b.code === 'ZME') { mapView.z = 1.6; mapCenterOnRoom(G.roomId); }
      else { G.state = 'PLAY'; mapView.ready = false; }
      if (typeof sfx === 'function') sfx('ui');
      return true;
    }
  }
  return false;
}
function drawCrest() {
  c.fillStyle = 'rgba(4,7,12,0.85)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('crest_title'), 480, 50, 28, '#eef3fa', 'center', '#37ffd0');
  const used = G.save.equip.reduce((s, x) => s + CRESTS[x], 0);
  // sockets
  for (let i = 0; i < effSlots(); i++) {
    const x = 480 - (effSlots() - 1) * 14 + i * 28;
    c.save(); c.translate(x, 92); c.rotate(Math.PI / 4);
    c.fillStyle = i < used ? '#37ffd0' : 'rgba(90,110,130,0.4)';
    if (i < used) { c.shadowColor = '#37ffd0'; c.shadowBlur = 8; }
    c.fillRect(-7, -7, 14, 14); c.restore(); c.shadowBlur = 0;
  }
  ftxt(t('crest_slots') + '  ' + used + ' / ' + effSlots(), 480, 124, 14, '#8aa2b5');
  const list = G.save.crests;
  if (!list.length) { ftxt(t('crest_none'), 480, 280, 17, '#7d93a8'); return; }
  list.forEach((id, i) => {
    const sel = i === G.crestIdx, eq = G.save.equip.indexOf(id) >= 0;
    const y = 170 + i * 40;
    if (sel) { c.fillStyle = 'rgba(55,255,208,0.08)'; rr(c, 180, y - 17, 430, 34, 8); c.fill(); }
    ftxt((eq ? '◈ ' : '◇ ') + t('c_' + id), LANG === 'ar' ? 590 : 200, y, 18, eq ? '#aef7d8' : sel ? '#eef3fa' : '#8aa2b5', LANG === 'ar' ? 'right' : 'left');
    ftxt('▪'.repeat(CRESTS[id]), LANG === 'ar' ? 210 : 570, y, 14, '#ffd76a', LANG === 'ar' ? 'left' : 'right');
  });
  const cur = list[G.crestIdx];
  dimPanel(630, 160, 280, 140);
  ftxt(t('c_' + cur), 770, 190, 17, '#eef3fa');
  wrapText(t('c_' + cur + 'd'), 240, 14).forEach((ln, i) => ftxt(ln, 770, 220 + i * 20, 14, '#9fb8c8'));
  ftxt(t('crest_hint'), 480, 512, 13, '#7d93a8');
}
function drawShop() {
  c.fillStyle = 'rgba(4,7,12,0.85)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('shop_title'), 480, 50, 28, '#eef3fa', 'center', '#ffd76a');
  ftxt('⬢ ' + G.save.scrap, 480, 86, 17, '#ffd76a');
  SHOP.forEach((it, i) => {
    const sel = i === G.shopIdx, sold = shopSold(it);
    const y = 130 + i * 46;
    if (sel) { c.fillStyle = 'rgba(255,215,106,0.08)'; rr(c, 160, y - 19, 640, 40, 8); c.fill(); }
    const name = it.type === 'crest' ? t('c_' + it.id) : t('s_' + it.id);
    const desc = it.type === 'crest' ? t('c_' + it.id + 'd') : t('s_' + it.id + 'd');
    const col = sold ? '#5a6a78' : sel ? '#eef3fa' : '#9ab0c2';
    ftxt(name, LANG === 'ar' ? 780 : 180, y - 6, 17, col, LANG === 'ar' ? 'right' : 'left');
    ftxt(desc, LANG === 'ar' ? 780 : 180, y + 13, 12, sold ? '#46545f' : '#7d93a8', LANG === 'ar' ? 'right' : 'left', null, '600');
    ftxt(sold ? t('sold') : '⬢ ' + Math.floor(it.cost * (relicHas('coin') ? 0.9 : 1)), LANG === 'ar' ? 180 : 780, y, 16, sold ? '#5a6a78' : '#ffd76a', LANG === 'ar' ? 'left' : 'right');
  });
  ftxt(t('shop_hint'), 480, 512, 13, '#7d93a8');
}

// ---------- boot ----------
// drop any pre-merge single-slot save so an old playthrough can never resurface
try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
// English is always the default/standard start; the picker is reachable any
// time from the menu's "Language" row (no forced foreign-language start).
loadMeta();
// ASK FOR ONE TRACK, ONCE. Starting the title theme and replacing it a
// millisecond later left two streams alive through the cross-fade — and while
// the page is still silent neither has started, so the tap that finally
// unlocks audio could wake both and play them over each other. On a first
// boot the opening's score is the only thing anyone should hear.
setMusic('title');
// THE FILM BELONGS TO NEW GAME, not to the page load. It used to play itself
// the first time the page was ever opened, which put a two-minute prologue in
// front of somebody who had not yet decided to play — and then never again,
// which meant the person who made it almost never saw it. It now starts when
// New Game is pressed, and the FIRST SHOT is fetched here, quietly, while the
// menu is on screen, so that press starts a film that is already in memory.
//
// One shot and not eight: a player who presses Continue never watches the
// opening, and eight shots is 4.4 MB of webm (13.1 MB of mp4, which is what
// iOS takes) spent on their behalf before they have chosen anything. The rest
// of the reel arrives two ahead of the shot on screen — see filmAhead().
//
// ...and only for somebody who has no save. A returning player's next press is
// Continue, and the opening is the one thing on this menu they have already
// seen. If they do start a new game the film simply waits in the dark for a
// beat — updateCut's `hold` phase is built for exactly that and will sit there
// patiently for up to fourteen seconds.
if (gameLock() !== 'hero' && !anySave()) {
  setTimeout(() => { try { filmAhead(INTRO_FILM.map(s => s[0]), 1); } catch (e) {} }, 900);
}
// ...and the art for where she is about to be starts arriving on the title
// screen, which used to fetch nothing at all. See preloadBoot().
setTimeout(() => { try { if (typeof preloadBoot === 'function') preloadBoot(); } catch (e) {} }, 400);
// look for a newer build at boot, and again every few minutes while idling
G.updateStamp = 1;
setTimeout(checkForUpdate, 2500);
setInterval(checkForUpdate, 240000);
addEventListener('visibilitychange', () => { if (!document.hidden) checkForUpdate(); });
// instant repeat loads + offline: cache-first assets, network-first code
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  try { navigator.serviceWorker.register('sw.js'); } catch (e) {}
}
let lastT = 0;
// ---------------------------------------------------------------------------
// THE FRAME BUDGET. The background's near depth plate is the one piece of
// scenery in the game that a weak device cannot afford: it is a second
// full-width composite, every frame, purely for looks. So it is not
// unconditional. The loop keeps a slow average of real frame time and gives
// the plate up when the game is not holding a comfortable rate, taking it back
// when it recovers. Nobody is ever shown a prettier background at the price of
// a worse-feeling game.
// ---------------------------------------------------------------------------
let frameMs = 16.7, richBG = true, richK = 1, richHold = 0;
// ---------------------------------------------------------------------------
// A SLOW MACHINE MUST NOT BECOME A SLOW GAME. The loop simulated exactly one
// step per frame, of at most a thirtieth of a second — and that ceiling is
// necessary, because a single huge step (a tab left in the background, a stall)
// would carry the player straight through a wall. But it also meant that a
// machine drawing 20 frames a second only ever advanced 20 thirtieths of a
// second per second: the entire game ran in slow motion, and it was worst
// exactly where it hurts most, on the weaker device. Measured before this fix,
// she crossed a room at 331 px/s above 30 fps, 265 at 24 fps, 220 at 20 fps and
// 163 at 15 — half speed.
//
// The step size is still capped. What changed is that a long frame now runs
// SEVERAL of those steps instead of one, so wall-clock speed is the same
// whatever the frame rate. The catch-up is bounded: at most a tenth of a second
// of simulation per frame, so a tab that was hidden for a minute resumes where
// it was rather than fast-forwarding through it, and a machine too slow to
// afford the catch-up degrades gently instead of spiralling.
// ---------------------------------------------------------------------------
const SIM_STEP = 1 / 30;      // the largest step collision can be trusted with
const SIM_MAX = 0.1;          // and the most simulation any single frame may do
function mainLoop(tms) {
  const raw = (tms - lastT) / 1000;
  const dt = Math.min(raw, SIM_STEP);
  if (lastT) {
    frameMs += (Math.min(tms - lastT, 100) - frameMs) * 0.03;
    // THE DECISION HAS TO HOLD. The extras cost frames, and the frame rate is
    // what decides whether to run them — so a device near the threshold turns
    // them on, slows down, turns them off, speeds up, forever. Each decision is
    // therefore locked in for a few seconds before the next one can be made,
    // which is what breaks the loop: a machine that cannot afford them settles
    // on off and STAYS there instead of strobing.
    richHold -= dt;
    if (richHold <= 0) {
      if (richBG && frameMs > 26) { richBG = false; richHold = 4; }        // ~38fps: give it up
      else if (!richBG && frameMs < 19) { richBG = true; richHold = 4; }   // ~53fps: take it back
    }
    // and the visible half fades rather than switches — fast off so the cost
    // leaves quickly, slow on so it never looks like a light being flicked
    const want = richBG ? 1 : 0;
    richK += (want - richK) * Math.min(1, dt * (want ? 1.6 : 6));
    if (richK < 0.02) richK = 0;
    // and the coarser dial, which moves rarely and moves everything
    if (typeof qualStep === 'function') qualStep(dt, frameMs);
  }
  lastT = tms;
  if (typeof pollGamepad === 'function') pollGamepad();
  // one step on a healthy frame; two or three when the machine is struggling
  let acc = Math.min(raw, SIM_MAX) * (G.state === 'PLAY' ? paceK() : 1);
  if (!(acc > 0)) acc = dt;
  // THE SIMULATED CLOCK, PUBLISHED — the third measurement hook in this file,
  // beside G.artProbe and G.planeProbe, and it exists for the same reason they
  // do. A frame advances min(raw, SIM_MAX) x paceK() seconds of world, NOT the
  // wall-clock time it took, so on a busy machine the world falls behind the
  // wall and any harness weighting by real elapsed ms is charging the fight for
  // time it never got. tests/bosspace.cjs did exactly that and carried a
  // documented flake for it. One addition per frame, no branch, no allocation.
  G.simClock = (G.simClock || 0) + acc;
  while (acc > 1e-4) { const st = Math.min(acc, SIM_STEP); update(st); acc -= st; }
  // ONE PREFETCH SLOT PER FRAME, IN EVERY STATE. This used to live inside the
  // PLAY branch of update(), which meant the title screen, the map, a shop and
  // the whole two-minute opening fetched nothing at all — the quietest moments
  // in the session were the only ones the prefetcher sat out. preloadIdle()
  // owns the decision now, and it still refuses during a transition, a boss
  // fight, and a film that is not playing cleanly.
  if (typeof preloadTick === 'function') { try { preloadTick(); } catch (e) {} }
  // the music steps back while a trial is open: the trial's notes are the
  // interface, and they lose to a stream at full volume (audio.js MUS_DUCK)
  if (typeof MUS_DUCK !== 'undefined') MUS_DUCK = G.state === 'TRIAL' ? 0.3 : 1;
  draw(tms);
  drawTouchUI();
  clearP();
  if (!mainLoop.ldGone) {
    mainLoop.ldGone = true;
    const ld = document.getElementById('cbload');
    if (ld) { ld.style.opacity = '0'; setTimeout(() => { try { ld.remove(); } catch (e) {} }, 500); }
  }
  requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);
