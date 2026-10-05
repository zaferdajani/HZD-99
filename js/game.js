// CLAWBYTE ‚Äî main loop, states, HUD, menus, save
const cv = document.getElementById('cv');
let c = cv.getContext('2d');
const mainCtx = c;
const SAVE_KEY = 'clawbyte_save', META_KEY = 'clawbyte_meta';
const GAME_VERSION = 'CLAWBYTE v4.5';
// THE STUDIO (owner, 2026-09-10): "VibeSolutions ... the name using to become
// my creating company name. I will add all the projects all the released and
// published projects to be from this name."
//
// ONE CONSTANT, EVERY SURFACE. The name goes on the screens the player can
// stop and read ‚Äî the title and the pause card ‚Äî and on the pages themselves
// (build.cjs puts it in the author meta and the structured data). It is a
// proper noun, so it is NOT an i18n key: the company is called the same thing
// in Arabic as it is in English, and routing it through t() would invite a
// translation of a trademark.
const STUDIO = 'VibeSolutions';
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
// are on the title screen ‚Äî nothing to lose ‚Äî it applies on its own.
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
  // deliberately the thing HEALING runs on ‚Äî so one purchase teaches the whole
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
  // a0 is the birth alpha drawRings normalises against; col is an optional tint
  // for the halo (default: the room's own glow); seed salts the rim sparks so
  // two rings born in one frame do not spin in lockstep. Position-derived, so
  // it costs no randomness and a replayed frame draws the same ring.
  addRing(x, y, r0, col) { this.rings.push({ x, y, r: r0 || 12, a: 0.85, a0: 0.85, col: col || null, seed: ((x * 7 + y * 13) | 0) & 0x7fffffff }); },
  // nothing speaks over the first meeting (manga-direction ¬ß6: the silence IS the beat)
  toast(text) { if (this.meet) return; this.toasts.push({ text, t: 3 }); },
  breakTile(tx, ty) {
    this.save.broken[this.roomId + ':' + tx + ',' + ty] = 1;
    // THE GROUND CURVE IS RE-READ. The heightfield she stands on is built
    // from the grid once per room and cached by room id, so a floor she cut
    // out still held her up 19 px above the hole (measured, tests/secrets.cjs:
    // the camp's cellar hatch broke and she stood on the air where it was).
    if (typeof surfRoom !== 'undefined') surfRoom = null;
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
    // DEFEAT IS A BEAT, NOT A RELOAD (underdog-arc ¬ß2.5): one line under the
    // toll, rotating with the count, and the Braid keeps where it happened so
    // the trader can say he passed the husk.
    this.deathLine = t('death_' + (1 + (this.save.deaths % 3)));
    if (typeof brDeath === 'function') brDeath(this.roomId);
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
    if (kind === 'alpha' && this.save.flags.alpha) return;
    const cap = kind.charAt(0).toUpperCase() + kind.slice(1);
    this.save.flags['boss' + cap] = 1;
    if (typeof checkEvo === 'function') checkEvo();   // the card the victory frame held back
    // THE RULE: every guardian resolved ‚Äî felled or tamed ‚Äî REVEALS A CAVE.
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
    // trophy relic ‚Äî they were built around the cell and there is nothing else
    // in them. Returning here keeps the guardians' whole reward chain (which
    // assumes a creature that had a life before the Song) off a thing that
    // never did.
    // THE ALPHA. It is not a guardian and it is not one of the Eye's things, so
    // it pays in the one currency neither of them can: THE PACK CHANGES SIDES.
    // Every wolf in the game, in every room, from this moment ‚Äî including the
    // ones standing in rooms she cleared an hour ago, because the flag is read
    // at draw time rather than baked into a spawn.
    if (kind === 'alpha') {
      this.save.flags.alpha = 1;
      this.save.quests = this.save.quests || {}; this.save.quests.alpha_pack = 'done';
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
      // 'room' was never a real track key ‚Äî resolve to the zone's own theme,
      // which is exactly what loadRoom plays for a non-boss room
      if (typeof setMusic === 'function') setMusic(G.roomDef ? G.roomDef.zone : 'A');
      return;
    }
    const grants = { glitch: 'dash', brood: 'djump', atlas: 'emp', zero: 'key' };
    if (grants[kind]) grantMod(grants[kind]);
    // THE CELL. Every guardian was built around one, and it comes out when the
    // guardian stops. NULLFANG's is the one that opens the shop ‚Äî which is why
    // the trader is standing in the room next door and why he has been dark
    // since you walked past him.
    invAdd('batt');
    showItem(t('i_batt'), t('i_battd'));
    // ‚Ä¶and the suit it was wearing. This is the Mega Man X loop: the thing that
    // beat you becomes the thing that beats the next one.
    const arm = ARM_BY_BOSS[kind];
    if (arm) {
      if (!this.save.arms) this.save.arms = [];
      if (!this.save.arms.includes(arm)) {
        this.save.arms.push(arm);
        this.save.armIdx = this.save.arms.length;   // wear it immediately
        showItem(t('arm_' + arm), t('arm_' + arm + 'd') + '  ‚Äî  ' + t('arm_how'));
      }
    }
    const tr = RELIC_TROPHY[kind];
    if (tr && !(this.save.relics || []).includes(tr)) {
      if (!this.save.relics) this.save.relics = [];
      this.save.relics.push(tr);
      this.toast(t('rl_' + tr) + ' ‚Äî ' + t('rl_' + tr + 'd'));
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
function persist() {
  if (!G.save) return false;
  // The toast's deadline is on the SAME clock the frame is drawn on. It used to
  // be Date.now(), which draw then sampled directly ‚Äî so a frame boundary that
  // happened to fall on the 1.7s expiry rendered the toast once and not the
  // next time, and the meadow harness (which freezes performance.now and draws
  // one frame twice expecting them identical) failed a couple of runs in four
  // on a 2629px box in the corner where the toast lives. Draw must not read a
  // clock nothing can freeze.
  const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  try {
    localStorage.setItem(saveKeyFor(G.save.theme), JSON.stringify(G.save));
    G.saveFeedback = { ok:true, until:nowMs+1700 };
    return true;
  } catch (e) {
    G.saveFeedback = { ok:false, until:nowMs+12000 };
    console.warn('CLAWBYTE: progress could not be saved', e && e.name);
    return false;
  }
}
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
      // language and the mute rather than in the save ‚Äî it must survive a new
      // game, and it must not travel to a different device with one
      if (typeof m.bright === 'number') BRIGHT_SET = m.bright;
      return true;
    }
  } catch (e) {}
  return false;
}
function newSave(diff) {
  return {
    v: 1, weaponVersion: 1, weaponMode: 'claws', diff, scrap: 0, coresMax: DIFFS[diff].cores, abil: {}, crests: [], equip: [], arms: [], armIdx: 0, stars: 6,
    slots: 3, iq: 0, skills: [], relics: [], flags: {}, broken: {}, visited: {}, shop: {},
    // SHE STARTS IN THE CRADLE, not on the meadow floor. W1 is the room the
    // opening film hands her to; A0 is where the game's economy starts, two
    // rooms and two learned verbs later.
    bench: { room: 'W1', x: 96, y: 412 }, deaths: 0, lives: 0, time: 0,
    pouch: null, usedNine: false, won: false, evo: 0, pace: 0, quests: {}, culls: {}, bag: {},
    // Draft 2: Ratchet's own battery must be found in his workshop.
    // Existing saves keep their inventory; NOSTOS retains its separate rules.
    storyVersion: 2,
    items: isHero() ? { batt: 1 } : {},
  };
}
// ===========================================================================
// THE INVENTORY, and the arc it exists for.
//
// The story the world never told: every NPC in the Depths was POWERED DOWN on
// the night the Song went out. That is why they are still themselves ‚Äî the
// broadcast could not reach a machine that was not listening. It is also why
// they are standing there dark: nobody has charged them since.
//
// So a Power Cell is the game's real currency of progress. She starts with one.
// NULLFANG carries one. Every mini-boss the Eye made is sitting on another. The
// supply is exactly the demand ‚Äî there is no cell to waste and none to hoard,
// which is what makes "who do I wake first" a question rather than a formality.
//
// `bag` already existed for quest fetch-items and is boolean; this is counted,
// and the inventory screen shows both.
const INV = {
  ratchetCell: { icon: '‚ö°', col: '#ffd76a' },
  batt: { icon: '‚ö°', col: '#ffd76a' },
  kit:  { icon: '‚úö', col: '#7dff9a' },
  coil: { icon: '‚óé', col: '#57a8ff' },
  cshard: { icon: '‚óÜ', col: '#dff2ff' },
};
function invCount(id) { return (G.save.items && G.save.items[id]) || 0; }
function npcCellItem(s) {
  return !isHero() && G.save.storyVersion >= 2 && npcKey(s) === 'A0B|ratchet'
    ? 'ratchetCell' : 'batt';
}
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
// A PLACEMENT, NOT A SUBJECT. `ratchet` stands in two rooms ‚Äî the waking floor
// and the camp by NULLFANG's door ‚Äî and they are two different meetings with
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
// completed ‚Äî and it still fires: the arm goes out, the fingers open, there is
// nothing there. That is the tic, and it is not a twitch bolted on for
// flavour, it is the one thing that broke and never got repaired. His coolant
// regulator did not come back either, so he runs hot and blows it off through
// the canister rack on his back. And what he is building, endlessly, out of
// salvage that does not fit, is a replacement regulator ‚Äî which is why he is
// always busy, always hot, never finished, and why he wants her scrap.
//
// WHY THIS IS NOT AN ATLAS ROW. Class D (ART_BIBLE ¬ß1) is one 6-yaw sheet and
// a breathe cycle: it can turn and it can bob, and that is the whole
// vocabulary. None of the above fits in it. So Ratchet changes class ‚Äî he is a
// PLATE SET now, seven authored poses of one body, and the code's job is to
// choose which one and when.
//
// THE SMOKE IS CODE, DELIBERATELY. art-prompts ¬ß0: additive glow handed to a
// generator comes back as a beautifully lit SOLID OBJECT, because the model
// renders a thing and the compositor wanted light. So the plates were fired
// with "no smoke, no steam, no vapour" in every negative, and the vent is
// particles drawn over them ‚Äî which also means it can react to the beat
// instead of being baked into one frame of it.
const TINKER_PLATE = {
  work1: 'ratchetWork1', work2: 'ratchetWork2', tic: 'ratchetTic',
  notice: 'ratchetNotice', talk1: 'ratchetTalk1', talk2: 'ratchetTalk2',
  vent: 'ratchetVent',
};
// how long each beat holds, in seconds. The tic is SHORT ‚Äî a spasm the length
// of a real one ‚Äî and the work beats are uneven so the loop does not tick like
// a metronome.
const TINKER_HOLD = {
  work1: 1.15, work2: 1.55, tic: 0.42, notice: 1.0,
  talk1: 1.6, talk2: 1.35, vent: 1.1,
};
function tinkerRig(s) {
  if (!s._tk) {
    s._tk = { pose: 'work1', t: 0.6, last: 0, tic: rnd(3, 7), vent: rnd(9, 16), blew: false,
              // the task machine ‚Äî see tinkerTask()
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
// asks for 0..4 ‚Äî so column 5, the one where the body is turned away into its
// own work, has never been drawn in this game. Its own comment says so: "a
// turntable renderer that cannot be asked for a specific angle is a turntable
// renderer with a hole in it."
//
// So each of them gets a JOB in the same shape as the tinker's: a short list of
// beats, each a place to be looking and a spread of how long to look there,
// with the TURN BETWEEN THEM EASED so the turn is itself the motion. The order
// is walked with a skip, the holds are re-rolled every beat, and the arc is
// nobody's multiple of anybody else's ‚Äî so no two of them fall into step, which
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
  // something on it. Long holds ‚Äî she is patient in a way the others are not.
  mono:  [{ col: 2, t: [3.5, 6.5], work: 1 }, { col: 4, t: [3.0, 5.0] },
          { col: 1, t: [2.5, 4.5], work: 1 }],
  // Patch-7 at the quench: quick, fussy, always turning between the fire and
  // the bench. The shortest holds of anyone here.
  patch: [{ col: 5, t: [1.4, 2.6], work: 1 }, { col: 2, t: [0.9, 1.8] },
          { col: 4, t: [1.3, 2.4], work: 1 }, { col: 0, t: [0.8, 1.6] }],
  // the Nymph drifts. Her beats are barely a job at all ‚Äî she turns the way
  // something growing turns, slowly and without a reason you can see.
  lumen: [{ col: 1, t: [4.0, 7.0], work: 1 }, { col: 3, t: [3.5, 6.0] },
          { col: 5, t: [3.0, 5.5], work: 1 }],
  // the Sage is the still one, and stillness has to be AUTHORED or it reads as a
  // bug. The first pass gave him two angles one step apart and he measured as
  // frozen ‚Äî which is the difference between a person being still and a picture
  // being still. A person at rest shifts: three angles, long holds, and one of
  // them further round than the others so the shift is occasionally visible.
  sage:  [{ col: 2, t: [6.0, 10.0], work: 1 }, { col: 3, t: [5.0, 9.0] }, { col: 1, t: [4.0, 7.5] }],
  // Ratchet AT THE BOOTH ‚Äî not in the den, where drawTinker owns him. A
  // shopkeeper turns to his stock and back to the road.
  ratchet: [{ col: 0, t: [2.0, 3.6] }, { col: 5, t: [2.4, 4.2] },
            { col: 1, t: [1.6, 3.0] }],
  // THE CUTTER BARELY LOOKS UP. Every other body here has beats that alternate
  // work and attention; hers are almost all work, because the story is that she
  // sat down at the bottom of the world and has not moved since. The one
  // non-work beat is long and small ‚Äî she checks the cut, not the room. She
  // also cannot hear anyone arrive, so nothing in her rhythm is a reaction to
  // company: the visitor rings a wire she can feel, and until then the saw is
  // the only thing happening.
  //
  // SHE STILL HAS TO TURN, THOUGH, and the first cut of these beats did not:
  // two of the three were the same column and the third was the only angle the
  // ATLAS ever drew, because a work beat plays the side-on strip instead. She
  // measured at 1.0 angles in tests/folk.cjs ‚Äî the exact failure the Sage's own
  // note two entries up warns about, that stillness has to be AUTHORED or it
  // reads as a frozen picture. So: three non-work angles now, long and
  // unhurried, one of them further round than the others so the shift is
  // occasionally visible. She is still the least mobile body in the cast; she
  // is no longer a statue.
  kerf:  [{ col: 1, t: [7.0, 12.0], work: 1 }, { col: 2, t: [2.5, 4.5] },
          { col: 1, t: [6.0, 11.0], work: 1 }, { col: 4, t: [1.6, 3.2] },
          { col: 3, t: [2.2, 4.0] }],
};
// She is standing over them: the same radius the tinker uses, so the whole cast
// reacts to being approached on one rule rather than five.
function nearNpc(s) {
  return !!(player && Math.abs((player.x + player.w / 2) - (s.x + s.w / 2)) < 140);
}
// Per-body wall clock. The draw path has no dt of its own, and this is
// presentation, so it takes one from the frame ‚Äî clamped, because a tabbed-out
// page must not hand it four seconds and spin the whole cast round.
function npcDt(s) {
  const now = performance.now() / 1000;
  const dt = s._jt ? Math.min(0.1, now - s._jt) : 0;
  s._jt = now;
  return dt;
}
// THE WORK STRIPS, fired by the art session against the ¬ß2v brief. Each is
// twelve frames of that machine doing its own job, and each is wired the way
// the tinker's is: a `work` beat PLAYS it, in bursts, at a tempo re-rolled per
// burst, with the phase carried across beats ‚Äî while every other beat is the
// turntable angle. media.js's entry says "wired through NPC_LOOP in
// js/game.js", which is this; the keys landed a commit before the wiring did,
// and declared-but-never-drawn is the exact failure ART_BIBLE ¬ß7 exists for.
const NPC_LOOP = {
  servo: 'servoLoop', mono: 'monoLoop', patch: 'patchLoop',
  sage: 'sageLoop', lumen: 'lumenLoop',
  // KERF (¬ß2aq, 2026-09-29). Eight drawn cells rather than the five filmed
  // clips' twenty-four: THE CUT is a push and a wait, and a held pause does not
  // want in-between frames ‚Äî it wants to be held.
  kerf: 'kerfLoop',
};
// how long a work beat plays for and how fast, per body ‚Äî the same shape as
// the tinker's TINKER_JOB, and per-character for the same reason: the warden
// reading a console and the tinker welding do not move at one speed.
// HOW MANY CELLS EACH BODY'S STRIP ACTUALLY HOLDS.
//
// It was the literal 12 at the draw site, which was true of every strip when it
// was written and stopped being true the moment one was re-cut. The five job
// clips are 5.04 seconds at 24 fps ‚Äî 121 filmed frames ‚Äî and twelve of them
// were reaching the screen. Re-cut at 24, from the same clips, at no credit
// cost (owner: "maximizing frames for each move").
//
// This does NOT contradict the cadence note below. That note is right: more
// frames never stops a cycle reading as a cycle, and the fix for loopiness was
// bursts, varying tempo and holds. Frame count is the other axis entirely ‚Äî
// whether the motion inside a burst is smooth or steps. Both were wrong; the
// cadence was fixed then, this is the other half.
//
// Ratchet's loop was cut in an earlier pass and its clip is not in the
// scratchpad any more, so he keeps his twelve until he is re-fired ‚Äî which is
// exactly why this is a table and not a constant.
// ...and each number is what tools/framedupe.cjs measured that take to CONTAIN,
// not what was asked for. servo, sage and lumen really do hold 24 different
// pictures; patch's whole five seconds holds ten and mono's holds nine, and
// padding them to 24 put the same drawing on screen twice in a row nineteen
// times and twelve times. Those two takes need re-firing ‚Äî they are on THE
// FIRING LIST ‚Äî and until then they carry their real frames and nothing else.
const NPC_LOOP_CELLS = { servo: 16, mono: 16, patch: 13, sage: 11, lumen: 10, kerf: 8 };
function npcLoopCells(id) { return NPC_LOOP_CELLS[id] || 12; }
// ...and the tempo doubles with the cell count, or the same job plays at half
// speed: fps is COLUMNS a second and run is a burst measured in COLUMNS, so
// twice as many columns for the same movement needs twice as many of both to
// take the same time. The holds are seconds and do not move.
// ...and the tempo scales with each body's OWN cell count, or the same job
// plays at the wrong speed: fps is columns a second and run is a burst measured
// in columns, so a strip with twice the columns needs twice the rate to cover
// the same movement in the same time ‚Äî and one with three quarters of them
// needs three quarters. Every pair below is the original twelve-cell number
// times cells/12. The holds are seconds and do not move.
const NPC_WORK = {
  servo: { fps: [12, 18], run: [20, 60], hold: [0.30, 0.90] },
  mono:  { fps: [3, 5],   run: [5, 14],  hold: [0.60, 1.60] },
  patch: { fps: [8, 12],  run: [12, 33], hold: [0.18, 0.55] },
  sage:  { fps: [6, 10],  run: [10, 28], hold: [1.00, 2.40] },
  lumen: { fps: [8, 14],  run: [16, 40], hold: [0.50, 1.40] },
  // THE SLOWEST HAND IN THE CAST, and deliberately. A wire saw through
  // crystal is one push and a long wait; the strip's own last three cells
  // are the pause, so the clip is played slowly and then held for longer
  // than anyone else's. She has sat in that room a very long time.
  kerf:  { fps: [4, 7],   run: [8, 22],  hold: [1.40, 3.20] },
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
    // what he decided to do and for how long ‚Äî tests/folk.cjs reads the BEATS,
    // because a body holding one angle for eight seconds autocorrelates at 89%
    // by standing still, and standing still is not a loop
    j.beat = b.col + '@' + j.t.toFixed(1);
    j.beats = (j.beats || 0) + 1;
  }
  const want = list[j.i].col;
  // ease toward the beat's angle rather than snapping to it ‚Äî the TURN is the
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
// craftsman ‚Äî it is a spinning gear. And the fix is not more frames, because
// any fixed-rate cycle of any length eventually reads as a cycle; a 3-second
// loop is a loop you notice four seconds later instead of two.
//
// What stops reading as a loop is that a person at a bench is not performing a
// motion, they are DOING A JOB, and a job has shape:
//
//   SHAPE   he works the part ‚Äî bursts of strokes, 2 to 5 at a time, then a
//           beat with the hammer up while he looks at what he did
//   CHECK   he folds over it and turns it in his hands (the work_2 plate, a
//           genuinely different silhouette, held ‚Äî an ACT wants a held frame)
//   FIT     he offers it up to the rack ‚Äî slower, fewer strokes, longer pauses
//   REJECT  it does not fit. He goes still. Then he runs hot, or he starts again
//
// ...and then he starts over, which is his whole character (¬ß2t): he is building
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
//   4. PING-PONG. Some bursts run the strip forward and back ‚Äî a stroke and a
//      return ‚Äî which also doubles what twelve cells can say.
//   5. THE ARC IS 14-26 SECONDS and re-rolled every time, and the tic and the
//      vent interrupt it on their own unrelated timers, so the compound period
//      is not a period at all.
//
// Measured rather than asserted: tests/tinker.cjs autocorrelates the sequence of
// frames he actually draws over half a minute and fails if any lag under five
// seconds is a strong match ‚Äî the same test grammar.cjs runs on tile repeats.
const TINKER_JOB = {
  //        how long the stage runs   fps range    burst length, in cells
  shape:  { t: [4.5, 8.0],  fps: [8, 13], run: [14, 60], hold: [0.22, 0.70] },
  fit:    { t: [2.5, 4.5],  fps: [5, 7],  run: [8, 22],  hold: [0.45, 1.10] },
  check:  { t: [1.1, 2.1] },                       // a held plate, no strip
  reject: { t: [0.5, 1.0] },                       // one frozen cell
};
// the order is fixed because a JOB has an order ‚Äî what varies is how long each
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

// Returns true once it has drawn him ‚Äî false means the plates are not here yet
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
  // has looked up ‚Äî which is what makes walking into the den feel like
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
    else if (working) r.pose = 'work1';   // the JOB decides what shows ‚Äî see tinkerTask
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
  // held 1.15 s and 1.55 s ‚Äî a cut every second and a bit, which is what the
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
    // same swing, and an act wants a held frame (¬ß3.3 is the same law).
    if (r.job === 'check') {
      drew = drawSetPlate(c, TINKER_PLATE.work2, cx, base, frameH, face < 0, 'ratchetWork1');
      if (drew) G.tinkerFrame = 'check';
    }
    if (!drew) {
      const cell = ((Math.floor(r.ph || 0) % 6) + 6) % 6;
      drew = drawStripCell(c, 'ratchetLoop', cell, 6, cx, base + 2, s.h * 3.3, face < 0);
      // what he actually drew, for tests/tinker.cjs ‚Äî "it does not repeat" is
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
  // Measured off the plate rather than guessed ‚Äî the rack tops out at about
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
// ONE ENGINE, TWO WORLDS. The cells are a CLAWBYTE story ‚Äî machines that were
// switched off when the broadcast went out. NOSTOS's people are people; they
// are not waiting for a battery, and gating a Greek elder behind one would be
// the theme bleed this codebase has had to fix twice already.
// HEALING IS EARNED, NOT INNATE (owner's design): Ratchet's first gift for
// the battery. NOSTOS's hero keeps it from the start ‚Äî people are people.
// SCRAP, EXPLAINED THE FIRST TIME SHE HOLDS SOME.
//
// The tutorial said "Take the scrap / walk over it", which teaches the verb and
// not the noun ‚Äî the owner's report, in full, was "I have no idea what the
// scrap is". A currency has to introduce itself, and the moment it can is the
// moment it is first picked up: she has the thing in hand, the number in the
// HUD has just moved, and the sentence has somewhere to point.
//
// Once per save, and never during a cutscene or a fight's own dialogue ‚Äî the
// card takes the screen, and taking the screen mid-swing is its own bug.
function bankScrap(v) {
  G.save.scrap += v;
  if (G.save.flags.sawScrap) return;
  if (G.state !== 'PLAY' || G.dialog || G.cut || G.bossEntry || (G.boss && !G.boss.dead)) return;
  G.save.flags.sawScrap = 1;
  // A TOAST, NOT A CARD. The first version of this called showItem, which sets
  // G.state = 'DIALOG' ‚Äî and a pickup happens while she is WALKING. Measured
  // on the meadow: she left A1 at 96, touched the first scrap at 323, and the
  // card took the screen with her still holding right at 340 px/s. update()
  // simulates the player only in PLAY, so she stopped there; nine harnesses
  // went red on one line, and every one of them was reporting the same thing
  // the player would have felt ‚Äî the game stopping to talk in the middle of a
  // stride. A currency can introduce itself without taking the controls away.
  G.toast(t('i_scrap') + ' ‚Äî ' + t('i_scraph'));
}
function healUnlocked() {
  if (typeof isHero === 'function' && isHero()) return true;
  return !!(G.save && G.save.flags && G.save.flags.heal);
}
// THE VOLT BURST IS BOUGHT, NOT INNATE (owner, 2026-09-19): "supercharge
// should be gained when the character purchases the battery pack from the
// shop ‚Äî the first item the character purchases is what gives it the charging
// power, a means to use the shards it finds after hitting enemies... this
// would give it two things: the ability to heal using the charges, or using
// the charges to do a super attack." So the pack is ONE purchase that wires
// BOTH verbs: the same flag gates them (`flags.heal`, historical name), set
// by the first volt cell bought in updateShop and nowhere else. Before it,
// holding ATTACK is an ordinary attack: no build, no ticks, no storm.
//
// Legacy saves used tutorial completion as evidence of the purchase. Draft 2
// records the actual purchase, so skipping a lesson never grants equipment.
function burstUnlocked() {
  if (typeof isHero === 'function' && isHero()) return true;
  const f = G.save && G.save.flags;
  return !!(f && (f.heal || (G.save.storyVersion !== 2 && f.tut)));
}
// THE ONE MACHINE THAT WAS NEVER SWITCHED OFF.
//
// Every machine person in the Depths pulled its cell or had it pulled when the
// Song went out ‚Äî that is why they were never infected, why they have been
// standing in the dark ever since, and why the cell economy is CLOSED: one
// start cell, one out of NULLFANG, one out of each of the Eye's constructs,
// and exactly that many dark bodies (tests/battery.cjs counts it off the world
// and refuses a surplus of more than two).
//
// Kerf is outside that arithmetic, and being outside it IS her character. Her
// receivers were stamped dead at the factory; she has never heard a sound, so
// the Song never reached her and she never had to go quiet to survive it. She
// has been awake at the bottom of the world the whole time, which is the only
// answer to "why is there a person down here" that does not need a cell
// somebody would have to carry past a guardian to reach her.
//
// It is a KEY, not a name: a body is awake because of where it stands and who
// it is, and another Kerf placed elsewhere would be a different machine.
const NPC_AWAKE = new Set(['V1B|kerf']);
function npcLive(s) {
  if (typeof isHero === 'function' && isHero()) return true;
  if (NPC_AWAKE.has(npcKey(s))) return true;
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
// visibly grows and gains gear (drawn in entities.js) ‚Äî announce it
// `extra` counts a guardian falling on this very frame (its flag lands after
// the cut); `quiet` fires the sting, the flash and the new silhouette but holds
// the card, which a purify film would otherwise be interrupted by ‚Äî onBossDead
// shows it once the cut has handed back.
function checkEvo(extra, quiet) {
  const tv = evoTier(extra || 0);
  if (G.save.evo == null) { G.save.evo = tv; return; } // old saves: adopt silently
  if (tv > G.save.evo) {
    G.save.evo = tv;
    sfx('chargeReady');
    sfx('evoSting');   // her motif, over the fanfare - she grew
    G.flash = Math.max(G.flash, 0.35);
    G.impact = { t: 0.22, t0: 0.22, x: player.x + player.w / 2, y: player.y + player.h / 2 };
    burst(player.x + player.w / 2, player.y + player.h / 2, 30, '#ffd76a', 280, 0.8, 40, 3, true);
    burst(player.x + player.w / 2, player.y + player.h / 2, 18, '#ffffff', 160, 0.6, -60, 2, true);
    if (quiet) G.save.evoCard = tv; else showItem(t('evo' + tv), t('evo' + tv + 'd'));
  } else if (!quiet && G.save.evoCard) {
    const cv = G.save.evoCard; G.save.evoCard = 0;
    showItem(t('evo' + cv), t('evo' + cv + 'd'));
  }
}
// THE GEAR HAS A PICTURE OF ITSELF. Two cold plates were fired for the hardware
// that explains her movement ‚Äî jetpack.png for the double jump, boots_idle.png
// for the dash ‚Äî and both were keyed in media.js and drawn by NOTHING. They are
// not rig parts: they are the object, square-on, lit, with no exhaust and no
// motion. There is exactly one moment in the game that wants that picture, and
// it is the moment she is HANDED the thing. Until now that moment was a line of
// text. (bootsFire is the other half and is already worn ‚Äî drawThrustBoots
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
  showItem(t('m_' + id), t('m_' + id + 'd'), MOD_ART[id], id);
  lessonStart(id);                                  // and then teach it
}
// THE FIRST CREST EXPLAINS ITSELF. The owner, on the crest button: "I have no
// idea what's the point of crest so far. Nobody does. So why was it created?
// How would it work? And what is the background story of it?" The system
// existed ‚Äî sockets, seals, a shop that sells port width ‚Äî and the story did
// not, so a player met a screen of nouns. docs/CRESTS.md is the story; the
// first seal she seats tells it, once, in the card that hands it over.
function grantCrest(id) {
  if (G.save.crests.indexOf(id) < 0) G.save.crests.push(id);
  showItem(t('c_' + id), t('c_' + id + 'd'));
  if (G.dialog && !(G.save.flags && G.save.flags.crestTold)) {
    if (!G.save.flags) G.save.flags = {};
    G.save.flags.crestTold = 1;
    G.dialog.lines.push(t('crest_first'), t('crest_first2'));
  }
}
function showItem(name, desc, art, demo) {
  sfx('win');
  G.dialog = { name: t('got'), lines: [name + ' ‚Äî ' + desc], i: 0, onEnd: null,
               art: art || null, demo: demo || null };
  G.state = 'DIALOG';
  persist();
}

// ---------- room loading ----------
function spawnStatic(type, tx, ty, extra, flagKey) {
  // npc was 32x40 ‚Äî a head shorter than the player's own 60px plate, and the
  // owner's read of the first one he ever met was "very small, easy to miss".
  // The machine folk stand at her scale now.
  const sizes = { item: [26, 26], bench: [44, 52], chest: [30, 24], mod: [24, 24], term: [26, 32], npc: [40, 56], riddle: [26, 36], secret: [24, 24], trial: [34, 44], vault: [40, 52], pillar: [46, 96] };
  const [w, h] = sizes[type];
  // `room` is stamped at spawn rather than read from G.roomId at use time,
  // because npcKey() must stay stable for a static that outlives a room change
  // (the pet follows, the reward queue drains a room late) ‚Äî and because a key
  // that depends on when you ask it is not a key.
  G.statics.push({ type, room: G.roomId, x: tx * TILE + (TILE - w) / 2, y: ty * TILE - h, w, h, extra, flagKey, opened: !!(flagKey && G.save.flags[flagKey]), t: rnd(0, 9) });
}
function settlePendingBossReward() {
  if (G.boss && G.boss.dead && G.boss.rewardPend) {
    G.boss.rewardPend = false; G.onBossDead(G.boss.kind);
  }
}
function loadRoom(id) {
  repairClose(false);
  settlePendingBossReward();
  if (typeof npcVoxStopAll === 'function') npcVoxStopAll();   // voices stay in their rooms
  // A ROOM CROSSING EATS A STILL-HELD "UP". Touch's stick and a gamepad's
  // button/axis both derive their edge from ONE poll of "was this already
  // down" (touch.js tSetK checks keys[code]; pollGamepad checks GP_PREV) ‚Äî
  // so a player who never lets the stick re-centre between walking INTO a
  // booth and walking back OUT of it gets exactly one edge, spent entering,
  // and pressing UP at the very same door a moment later does nothing: not
  // because the door is broken, but because the game still thinks that
  // thumb never came up. Reported 2026-09-12 ("when I get out of shop I
  // can't get back in, pressing up doesn't work") on a phone, where holding
  // a direction through a whole walk is the ordinary way to move, not an
  // edge case. Keyboard does not need this: engine.js's keydown handler
  // filters e.repeat, so a real key release always sits between two presses
  // there. Clearing the two continuously-DERIVED tracking values forces the
  // very next poll of each to read the current physical state as fresh,
  // without asking the player to actually let go first.
  keys.VU = 0; GP_PREV.GP_U = false;
  G.roomId = id; G.roomDef = ROOMS[id]; G.grid = buildRoom(id);
  surfCurve = null; surfRoom = null;   // the surface curve belongs to the room
  // re-aim the prefetcher: the art for the rooms she can now REACH
  if (typeof preloadRoom === 'function') { try { preloadRoom(id); } catch (e) {} }
  G.enemies = []; G.projs = []; G.pickups = []; G.statics = []; G.boss = null;
  G.boomer = null;   // a thrown blade never crosses a room line ‚Äî it is back in her paw
  // An attack belongs to the room where it began. Do not carry a damaging
  // hurricane, buffered strike or half-charged release through a doorway.
  if (typeof player !== 'undefined' && player) {
    player.swirlT = 0; player.swirlTick = 0; player.chargeT = 0;
    player.chargeVoxed = false; player.swing = null; player.swingVis = null;
    player.atkBuf = 0;
    if (typeof hzdRelease === 'function') hzdRelease(0.025);
  }
  G.wrecks = []; G.recharge = null; G.plats = []; G.saws = []; G.pools = []; G.x1Bridge = false; G.x1T = 0;
  ceilReset();                       // the roof of the last room does not follow you
  fringeMark();                      // and neither does what grew on its edges
  // a scripted finishing blow belongs to the room it was swung in; carrying one
  // across a door would leave her driven by a boss that no longer exists
  G.finish = null; G.offer = null; G.forkBoss = null;
  // stream the room's guardian the moment the room exists, so its body is ready
  // long before it stirs ‚Äî the silhouette is a safety net, not a plan
  setTimeout(() => {
    if (G.boss && typeof BOSS_ART !== 'undefined' && BOSS_ART[G.boss.kind]
        && typeof mediaFetch === 'function') mediaFetch(BOSS_ART[G.boss.kind]);
    // ...and the lion's filmed moves, so the first swipe is the take and not
    // the rig popping into the take a second later
    if (G.boss && G.boss.kind === 'glitch' && typeof BEAST_STRIPS !== 'undefined'
        && typeof mediaFetch === 'function') for (const k of BEAST_STRIPS) mediaFetch(k);
  }, 0);
  parts.length = 0;
  const def = ROOMS[id];
  def.ents.forEach((d, i) => {
    let [kind, tx, ty, extra, cond] = d;
    // The first target is an automatic scrap-yard defence, not a person.
    if (!isHero() && G.save.storyVersion === 2 && id === 'A0' && kind === 'crawler') kind = 'turret';
    if (cond && !G.save.flags[cond]) return;
    if (EKIND[kind]) {
      const k = EKIND[kind];
      const storyKey = !isHero() && G.save.storyVersion === 2 ? id + ':' + i + ':' + kind : null;
      const rescueState = storyKey && G.save.rescues && G.save.rescues[storyKey];
      // THE BRAID decides who is even here. A kingdom you have cured wakes fewer
      // machines and wakes some of them calm; a HOLLOW world barely wakes at all.
      const U = typeof universe === 'function' ? universe() : null;
      if (U) {
        const zi = U.inf[def.zone] != null ? U.inf[def.zone] : 1;
        // Infection feeds the population, but only somewhat ‚Äî a cured kingdom
        // should read as PEACEFUL, not as empty. Most of what survives mercy is
        // still there; it has simply stopped wanting to kill her.
        const keep = clamp((0.66 + zi * 0.34) * U.foeK, 0.2, 1.6);
        // a SAGE is never culled by the Braid ‚Äî it is a story, not population
        if (!rescueState && kind !== 'sage' && keep < 1 && ((i * 2654435761) % 1000) / 1000 > keep) return;
      }
      const en = !isHero() && G.save.storyVersion === 2 && id === 'A0' && kind === 'turret'
        ? new YardWinch(tx * TILE + (TILE - k.w) / 2, ty * TILE - k.h)
        : new Enemy(kind, tx * TILE + (TILE - k.w) / 2, ty * TILE - k.h);
      en.actorRole = STORY_ACTOR_ROLES[kind]; en.storyKey = storyKey;
      if (rescueState === 'disabled') { en.disabled = true; en.hp = 1; }
      if (rescueState === 'rescued') { en.rescued = true; en.calm = true; en.hypnoT = 1e9; }
      // a purified sage STAYS purified: the tame is a save fact, re-applied
      // at spawn, so leaving the chamber never re-infects it
      if (kind === 'sage' && G.save.flags['sageTame_' + id]) { en.tame = 1; en.calm = true; en.pureM = 1; }
      // ...and so does the quiet it promised. "I will keep this end quiet" was a
      // line with nothing behind it: the tunnel she walked back out through was
      // as hostile as the one she walked in through, which is the audit's note
      // against comic page 26. A purified sage's own network wakes calm ‚Äî they
      // potter, their sensors burn cyan, and they will not touch her. Re-applied
      // at spawn from the save fact, exactly like the sage's own tame, so it
      // survives leaving the cave and loading it again a week later.
      if (kind !== 'sage' && typeof sageQuietHere === 'function' && sageQuietHere(id)) {
        en.calm = true; en.hypnoT = 1e9;
      }
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
      if (!(extra === 'connector' && isHero()) && !G.save.flags['sr_' + extra]) spawnStatic('secret', tx, ty, extra);
    } else if (kind === 'pillar') {
      // the crystal pillar is quarried once per save ‚Äî the shard in the bag
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
  // the kingdom's own flora, fetched on arrival rather than at boot ‚Äî twelve
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
  // is held DARK for a beat and brought up ‚Äî she is standing in a chamber where
  // something has been sleeping, and the light finds it ‚Äî while the theme
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
  cam.x = 0; cam.y = 0; cam.room = null;
  persist();
}
// ---------------------------------------------------------------------------
// WHAT THE POINTS ARE FOR. IQ is earned in the Trials and spent on skills, and
// nothing in the game ever said so ‚Äî a player could finish every trial, watch a
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
// The cheapest thing she is SAVING for ‚Äî reachable in the tree, not yet
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
  // door ‚Äî the bare key on its own was the reported failure.
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
  repairClose(false);
  // A run's pending reward belongs to THAT save, never the next one. Keep
  // same-object resumes legitimate; menu Quit settles before its saved copy
  // is reloaded. Ordinary room changes retain loadRoom's reward safety net.
  if (save === G.save) settlePendingBossReward();
  G.boss = null;
  // Reset before loadRoom so its NEW arrival wake/tutorial is not erased.
  // Previously a paused reward's impact panel and dash lesson followed a
  // restart into the cradle, even though the new cat owned no dash.
  G.impact = null; G.flash = 0; G.hitStop = 0; G.rings = [];
  G.lesson = null; G.brDelta = null; G.elemPop = null; G.songWave = null;
  G.dialog = null; G.toasts = []; G.zoneToast = null; G.lastZone = '';
  G.tut = null; G.wake = null; G.meet = null; G.break = null; G.trans = null; G.gateWalk = null;
  G.coreFlash = null; G.coresFullT = 0; G.bolt = null;
  cam.shake = 0;
  migrateWeapons(save);
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
  // the game is unkind to her, so it is the one moment her eyes are ‚Äî for two
  // seconds, then she is herself again. Without the pouch test she would mope
  // after a death that cost her nothing, which is sulking, not grief.
  if (G.save.pouch && player.moodSet) player.moodSet('sad', 2.0);
  if (G.save.pouch) G.toast(t('pouch') + '  (' + t('z_' + ROOMS[G.save.pouch.room].zone) + ')');
  G.state = 'PLAY';
}
function bossActive() { return G.boss && !G.boss.dead && G.boss.st !== 'dorm' && !G.boss.meet; }
// THE NAME OVER THE BAR. The six guardians have a `b_<kind>` line; the Alpha
// and the Eye's five constructs never did, and t() hands back the key when it
// has nothing ‚Äî so the bar over the Alpha read "b_alpha" and the one over the
// chime read "b_chime". Found by tools/castreel.cjs, the first time every boss
// was filmed in one sitting. The Alpha has its own name line; a construct's
// name is the head of its meeting toast ("CHIME ‚Äî it is singing at you").
function bossBarName(b) {
  const k = 'b_' + b.kind, s = t(k);
  if (s !== k) return s;
  if (b.kind === 'alpha') return t('alpha_name');
  const mk = 'mini_' + b.kind, m = t(mk);
  return m !== mk ? m.split(' ‚Äî ')[0] : b.kind.toUpperCase();
}

// ---------------------------------------------------------------------------
// THE FIRST MEETING (.claude/skills/underdog-arc ¬ß2.1; staged per
// .claude/skills/manga-direction). She must meet something that swats her
// aside and walks away, early, and survive it by being outclassed rather than
// by losing ‚Äî so the whole game after it is "come back for that". It costs one
// crest of one room and one flag, and A4 becomes the rematch for free.
//
// Staged as an impact triple with a silence on each side, not as text:
//   fall    it drops out of the sky east of her on the A2 crest ‚Äî geography
//   land    the silence: music gone, controls gone, it walks up to her
//   wind    the paw rises, held a hair too long (beat 1 of the hit)
//   swipe   the flash ‚Äî hit-stop, white, the frame stops (beat 2)
//   watch   the aftermath: she is thrown the length of the mound and it
//           stands and looks (beat 3 ‚Äî the frame that carries the information)
//   coil    it gathers, bored of her
//   leave   and bounds east out of the room, toward where she will meet it again
// She keeps at least one core: this is a survival, never a scripted death.
// ---------------------------------------------------------------------------
const MEET_ROOM = 'A2', MEET_X = 60 * TILE;
function meetCheck() {
  if (G.meet || G.roomId !== MEET_ROOM || !G.save || G.save.flags.nfMeet) return;
  if (player.dead || G.cut || G.gateWalk || G.bossEntry || G.wake) return;
  if (player.x + player.w / 2 < MEET_X) return;
  const W = G.roomDef.w * TILE;
  const gx = clamp(player.x + player.w / 2 + 7 * TILE, 220, W - 220);
  const b = new Boss('glitch', gx, -260);      // x is the centre, y the feet
  b.meet = true; b.st = 'pounce'; b.vx = 0; b.vy = 520; b.face = -1; b.t = 9;
  G.boss = b;
  G.meet = { t: 0, ph: 'fall', hit: false, interactive: !isHero() && G.save.storyVersion === 2 };
  G.save.flags.nfMeet = 1;                    // set as it begins: a reload mid-beat keeps the sentence
  if (typeof brMark === 'function') brMark('meet', G.roomId);
  if (typeof filmSee === 'function' && PURIFY_VID.meet) filmSee('meet');
  persist();
  stopMusic();
  player.vx = 0;
}
function meetStep(dt) {
  const M = G.meet, b = G.boss;
  if (!M || !b || !b.meet) { G.meet = null; return; }
  beastMotionBegin(b);
  M.t += dt;
  const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
  const W = G.roomDef.w * TILE;
  const dust = (n, spread) => { for (let i = 0; i < n; i++)
    addPart(b.cx() + rnd(-spread, spread), b.y + b.h - 4, rnd(-180, 180), rnd(-200, -50), 0.45, '#b9a888', 3, 300, true); };
  if (M.ph === 'fall') {
    b.vy += 1700 * dt;
    const col = moveEnt(b, dt);
    if (col.d || b.y + b.h >= (G.roomDef.h - 2) * TILE) {
      b.vy = 0; b.vx = 0; b.st = 'stalk'; M.ph = 'land'; M.t = 0;
      cam.shake = Math.max(cam.shake, 12); beastSound('arrive'); dust(14, b.w * 0.6);
      if (typeof padRumble === 'function') padRumble(0.8, 0.6, 400);
      G.flash = Math.max(G.flash, 0.12);
    }
  } else if (M.ph === 'land') {
    // it walks up to her. Nothing else happens, which is the point.
    b.face = pcx < b.cx() ? -1 : 1;
    const gap = Math.abs(pcx - b.cx());
    b.vy += 1700 * dt;
    b.vx = (M.t > 0.7 && gap > 118) ? b.face * 240 : 0;
    moveEnt(b, dt);
    if (M.t > 0.7 && (gap <= 118 || M.t > 3.2)) {
      b.vx = 0; b.st = 'swipewarn'; b.t = M.interactive ? 0.85 : 0.5; M.ph = 'wind'; M.t = 0;
      sfx('tellbig');
    }
  } else if (M.ph === 'wind') {
    b.windT = M.interactive ? 0.85 : 0.5; b.t -= dt; b.vx = 0;
    if (b.t <= 0) { b.st = 'swipe'; b.t = 0.24; M.ph = 'swipe'; }
  } else if (M.ph === 'swipe') {
    b.t -= dt;
    if (!M.hit && b.t <= 0.18) {
      M.hit = true;
      b._slashT = .18;
      if (M.interactive) {
        // The tell commits the paw's direction. Running away or jumping is
        // a real escape, and no cutscene removes a core from outside its reach.
        const hit = { x: b.face < 0 ? b.x - 110 : b.x + b.w, y: b.y + b.h - 82, w: 110, h: 82 };
        beastSound('swipe'); cam.shake = Math.max(cam.shake, 3);
        burst(hit.x + hit.w / 2, hit.y + hit.h / 2, 8, '#b06aff', 120, 0.35, 80, 2, true);
        if (aabb(hit, player)) player.hurt(1, b.cx(), 'nf.meet');
      } else {
      // THE IMPACT FRAME: the least readable frame on purpose
      G.hitStop = Math.max(G.hitStop, 0.2); G.flash = Math.max(G.flash, 0.85);
      cam.shake = Math.max(cam.shake, 18);
      G.impact = { t: 0.3, t0: 0.3, x: pcx, y: pcy };
      if (typeof padRumble === 'function') padRumble(1, 0.9, 600);
      beastSound('swipe'); sfx('hit');
      burst(pcx, pcy, 22, '#b06aff', 320, 0.5, 200, 3, true);
      burst(pcx, pcy, 12, '#ffffff', 200, 0.4, 0, 2, true);
      // it costs her something ‚Äî one core ‚Äî and never the last one
      if (player.cores > 1) { player.iT = 0; player.hurt(1, b.cx(), 'nf.meet'); }
      player.iT = 2.4; player.hurtPoseT = 0.9; player.stunT = 0;
      player.vx = (pcx < b.cx() ? -1 : 1) * 980; player.vy = -520; player.on = false;   // away from it
      }
    }
    if (b.t <= 0) { b.st = 'stalk'; b.vx = 0; M.ph = 'watch'; M.t = 0; }
  } else if (M.ph === 'watch') {
    // the aftermath: it stands and looks at where she landed
    b.face = pcx < b.cx() ? -1 : 1; b.vy += 1700 * dt; b.vx = 0; moveEnt(b, dt);
    if (M.t > 1.1) { b.st = 'crouch'; b.t = 0.6; b.coilTick = 0; b.coilFlashed = false; M.ph = 'coil'; }
  } else if (M.ph === 'coil') {
    b.windT = 0.4; b.t -= dt; b.coilK = 1 - clamp(b.t / 0.6, 0, 1);
    if (b.t <= 0) {
      b.st = 'pounce'; b.face = 1; b.vx = 920; b.vy = -720; M.ph = 'leave'; M.t = 0;
      b.leapT0 = b.anim; b.leapDuration = 1.6;
      beastSound('leap'); cam.shake = Math.max(cam.shake, 6); dust(10, b.w * 0.5);
    }
  } else if (M.ph === 'leave') {
    // no walls for it on the way out: it is leaving the room, not bouncing off it
    b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 900 * dt;
    if (b.x > W + 40 || M.t > 1.6) {
      G.boss = null; G.meet = null;
      setMusic(G.roomDef.zone);
      persist();
    }
  }
  beastMotionEnd(b, dt);
}


// ===========================================================================
// THE DEMO BOUNDARY ‚Äî where the free version stops, and says so properly.
//
// THE SHAPE OF THE DECISION. The free web build is the shop window: it opens
// on any phone from any maker with no download and no account, which is the one
// distribution advantage this game has and the app stores cannot match. What it
// is NOT is the place anyone can be charged. So the free version ends, and the
// end has to feel like a chapter closing rather than the game breaking.
//
// WHERE IT ENDS is derived, never listed. Any exit that leaves DEMO_ZONE is the
// boundary ‚Äî which today is exactly one door, A3 going up into B1, and which
// stays correct if the world is ever re-plumbed. A hard-coded room id would be
// a second copy of the map that somebody has to remember to update.
//
// The player gets the whole first kingdom to that point: waking in the cradle,
// the walk to the gates, the first machine folk, the purifier, the Alpha and
// its pack, and NULLFANG. Two boss fights and an ending, which is what makes
// this a chapter and not a wall. Stopping mid-corridor would read as a fault.
//
// ONE BUILD STILL, and that is deliberate (RULE ONE). This is not a demo BUILD;
// it is the same file everywhere, deciding at run time. A packaged app ‚Äî the
// Steam shell, the phone app ‚Äî is by definition the bought copy and is never
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
// Where the full game is sold. Empty until there is a page to point at ‚Äî the
// screen then says the game continues without offering a link that 404s.
const DEMO_URL = '';
function demoOn() {
  if (!DEMO_OFFER) return false;
  const packaged = (typeof window !== 'undefined') &&
    (!!window.Capacitor || location.protocol === 'file:' || location.protocol === 'capacitor:' || location.protocol === 'app:');
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
// the room bounds ‚Äî put her back inside first or the moment the screen closes
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
  // fight dropped you out of the world with nothing to catch you ‚Äî no floor, no
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
  // THE SKY IS NOT A DOOR. With the lid open (js/world.js skyLid) a jump can
  // rise past the frame anywhere, but the way UP is still the authored
  // opening the sky remembered ‚Äî a T crossing keeps her x, so triggering it
  // from the wrong column would land her inside A6's geometry. And no side
  // crossing happens above the roofline: the next room may still wear a lid,
  // and arriving on top of it is a walk on a roof no camera will follow.
  if (G.roomDef.sky) {
    if (side === 'T' && G.grid.tGap) {
      const cx = player.x + player.w / 2;
      if (cx < G.grid.tGap[0] * TILE - 8 || cx > (G.grid.tGap[1] + 1) * TILE + 8) side = null;
    }
    if ((side === 'L' || side === 'R') && player.y < 0) side = null;
  }
  if (!side) {
    player.x = clamp(player.x, ex.L ? -60 : 2, ex.R ? W + 60 : W - player.w - 2);
    if (player.y > H + 40 && !ex.B) { player.hurt(1, player.x); player.x = player.lastSafe.x; player.y = player.lastSafe.y; player.vy = 0; }
    return;
  }
  let dest = ex[side], at = null;
  if (typeof dest === 'object') {
    // {flag, to} gates a door behind a power; {to, at} carries an ARRIVAL
    // COLUMN for a vertical pair whose rooms cannot align by width ‚Äî V2's
    // way up arrives through the hole she cut in B2's floor, not at her
    // own x in a hall twice as wide as the vault
    if (dest.flag && !G.save.flags[dest.flag]) return;
    at = dest.at != null ? dest.at : null;
    dest = dest.to;
  }
  // The cleansing material and Ratchet's forge are the first sage's story
  // prerequisites. Keep the tunnel/return route open, not an invisible edge
  // that lets the player drift offscreen while missing the quest.
  if (!isHero() && dest === 'GA1D' && !weaponOwned('single')) {
    player.x = clamp(player.x, 2, W - player.w - 2);
    player.vx = 0;
    if (!G.sageForgeHintAt || G.time - G.sageForgeHintAt > 4) {
      G.toast(t('sage_need_forge')); G.sageForgeHintAt = G.time || 0.001;
    }
    return;
  }
  const storyHint = typeof openingGateHint === 'function' ? openingGateHint(dest) : '';
  if (storyHint) {
    player.x = clamp(player.x, 2, W - player.w - 2); player.vx = 0;
    if (!G.storyGateAt || G.time - G.storyGateAt > 4) {G.toast(storyHint);G.storyGateAt=G.time||0.001;}
    return;
  }
  if (demoWall(dest)) { demoStop(side); return; }
  G.trans = { t: TRANS_DUR, to: dest, side, at, half: false };
  // HOLD THE PICTURE NOW, not at draw time. The loop runs a fixed step and may
  // call update() several times in one frame (SIM_STEP/SIM_MAX), so the frame
  // that creates a crossing is often the same frame that applies it ‚Äî by the
  // time the renderer looked, the old room was already gone and the slide had
  // nothing to slide. The canvas still holds the last frame drawn, and the
  // last frame drawn is the room she is leaving.
  transSnap = transHeld ? transCv : null;
}
function applyTransition() {
  const tr = G.trans, from = { x: player.x, y: player.y, vx: player.vx, vy: player.vy };
  const fromAir = (G.roomDef.air | 0) * TILE;
  loadRoom(tr.to);
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  // an `air` room (THE ROOF LAW, js/world.js) holds its authored space at the
  // BOTTOM of a taller frame, so a side crossing shifts by exactly the added
  // rows and the floor stays under her feet; between two ordinary rooms the
  // delta is zero and this is the same keep-your-y it has always been
  const dAir = (G.roomDef.air | 0) * TILE - fromAir;
  if (tr.side === 'L') { player.x = W - player.w - 10; player.y = from.y + dAir; }
  else if (tr.side === 'R') { player.x = 10; player.y = from.y + dAir; }
  else if (tr.side === 'T') {
    player.x = clamp(tr.at != null ? tr.at * TILE : from.x, 40, W - 60);
    player.y = H - player.h - 6;
    player.vy = Math.min(from.vy, -680);
    // THE CLIMB CANNOT STALL. She arrives at the bottom of the room above,
    // still inside the floor shaft she jumped through ‚Äî and if the room's
    // first-visit art decode janks the next few frames, a time-based carry
    // dies in the shaft and she falls straight back down the hole (owner,
    // 2026-08-24: "loose momentum in jump and fall down"). So the carry is
    // STATE-based: Player.update re-asserts the rise until her feet have
    // actually cleared the destination floor, however long the loader takes.
    player.tCarry = 1.0;
  }
  else { player.x = clamp(from.x, 40, W - 60); player.y = 4; player.vy = Math.max(from.vy, 80); }
  player.vx = from.vx; player.lastSafe = { x: player.x, y: player.y };
  // THE CACHE MOUTH: she climbs up through the opening, and the hardlight
  // bridge closes beneath her the instant she is through ‚Äî so the way in is
  // never a pit that spits her straight back down the shaft she came up.
  if (G.roomId === 'X1' && tr.side === 'T' && G.boss && !G.boss.dead) {
    G.x1Bridge = true;
    player.tCarry = 0;           // the bridge places her; no shaft to climb
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
  for (const e of G.enemies) {
    if (!e.disabled || !e.storyKey) continue;
    const dx = player.x + player.w / 2 - e.x - e.w / 2;
    const dy = player.y + player.h / 2 - e.y - e.h / 2;
    const d = dx * dx + dy * dy;
    if (Math.abs(dx) < 46 && Math.abs(dy) < 60 && d < bestD) {
      bestD = d; best = { type: 'rescue', target: e, x: e.x, y: e.y, w: e.w, h: e.h };
    }
  }
  return best || (typeof monoNearTarget === 'function' ? monoNearTarget() : null);
}
// ---------------------------------------------------------------------------
// HOW THE WORLD SEES HER, AND WHETHER IT SAYS SO.
//
// The machinery for an underdog run was almost all here ‚Äî a chassis that
// evolves, a tree, a Braid that remembers, guardians that can be spared ‚Äî and
// one thing was missing that no mechanic can supply: nobody's opinion of her
// ever changed. Servo called her "little frame" in the first hour and called
// her "little frame" in the fifth, after she had put five guardians on their
// knees. Growth you can measure is a number; growth somebody REMARKS ON is a
// story, and it costs eighteen strings.
//
// Three tiers, because the shift has to be legible: nobody / one or two / most
// of them. And the line has to be SPECIFIC, never flattering ‚Äî "you are still
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
  // crystal is NOT handed over any more ‚Äî the owner's story is that Ratchet
  // FORGES it, and forging needs raw crystal she has to quarry herself (the
  // ratchet_forge errand in quests.js; forgeCrystal below is the payoff).
  // What Ratchet gives on waking is the practical thing and his story: he
  // survived the corrupted song because the small crystal on his chest burned
  // it out of him ‚Äî too small, so it faded, and he pulled his own plug before
  // the song could creep back. Her cell is what woke him. All of that is the
  // errand's ASK text, delivered in dialogue where lore belongs.
  // THE FIRST WAKING PAYS WITH THE KIT AND HIS STORY. Healing used to be
  // granted here too ‚Äî "Ratchet's first gift for the battery" ‚Äî and it moved
  // (owner, 2026-09-19): the HEAL PROTOCOL and the VOLT BURST are both wired
  // by the first pack she BUYS from him, one purchase, two verbs (see
  // burstUnlocked and the cell branch of updateShop). He wakes, he hands her
  // the kit, he opens the shop; the shop is where she becomes a machine that
  // can spend what she knocks out of other machines.
  'A0B|ratchet': () => {
    invAdd('kit');
    // His own cell stays installed. This separately stored spare is for Servo.
    if (!isHero() && G.save.storyVersion >= 2 && !G.save.flags.ratchetSpareGiven) {
      G.save.flags.ratchetSpareGiven = 1;
      invAdd('batt');
    }
    showItem(t('i_kit'), t('i_kitd'));
  },
  // and the trader at the camp by NULLFANG's door ‚Äî this is the shop, and it
  // does not exist until the lion's cell has paid for it
  'A3|ratchet': () => { G.toast(t('npc_shop_open')); },
  'A1|servo':  () => { invAdd('kit'); showItem(t('i_kit'), t('i_kitd')); },
  '*': () => { G.save.scrap += 25; G.toast(t('npc_thanks_scrap')); },
};
// THE FORGING ‚Äî the payoff of the game's first quest. She brings the pillar
// shard back to Ratchet; he makes the PURIFIER out of it. The cartoonish
// forging cinematic is queued in ART_QUEUE (¬ß1d, Higgsfield); this function
// is its code hook ‚Äî when the film asset lands it plays from here, and until
// then the moment is the flash, the sting and the card. The grant itself
// never waits on the art.
function forgeCrystal() {
  if (!grantWeapon('single')) return;
  persist();
  sfx('chargeReady');
  G.flash = Math.max(G.flash, 0.6);
  if (typeof cam !== 'undefined') cam.shake = Math.max(cam.shake, 6);
  if (player) {
    burst(player.x + player.w / 2, player.y + player.h / 2, 30, '#ffffff', 320, 0.9, 60, 3, true);
    burst(player.x + player.w / 2, player.y + player.h / 2, 16, '#bfe9ff', 240, 1.1, 20, 2.6, true);
  }
  // THE FORGING CINEMATIC ‚Äî ¬ß1d, fired by the sister session against the
  // canon element. It plays through the purify-cut player; the card is the
  // fallback when the clip cannot run, so the grant never waits on a codec.
  if (PURIFY_VID.gift) {
    purifyPreload('gift');
    if (startPurifyCut('gift')) { G.cutEnd = () => alphaQuestOffer(); return; }
  }
  showItem(t('i_crystal'), t('i_crystald'));
  if (G.dialog) G.dialog.onEnd = () => alphaQuestOffer();
}
function doInteract(s) {
  if (!s && typeof monoNearTarget === 'function') s = monoNearTarget();
  if (!s) return;
  if (s.type === 'rescue') {
    const e = s.target;
    if (!e || !e.disabled || e.cleanseT > 0) return;
    if (!G.save.flags.crystal) { G.toast(t('story_need_blade')); return; }
    e.cleanseT = 0.65; e.cleanseHP = player.cores;
    return;
  }
  if (s.type === 'npc') {
    // THEY WANT SOMETHING NOW. Talking twice used to give you the same three
    // lines forever; a character who cannot ask you for anything is scenery
    // with a mouth. The errand comes first when there is one, and what they
    // say depends on whether you have done it yet.
    // ---- DARK, AND WHY -------------------------------------------------
    // Nothing here works until it has been charged. A dark unit has no quest,
    // no shop and no trial: it is a body standing in a room. That is the whole
    // point of the arc ‚Äî the world is full of people who are not gone, just
    // switched off, and you are the one carrying the cells.
    if (!npcLive(s)) {
      const key = npcKey(s);
      // THE NOTE (owner, 2026-08-16). Ratchet is not like the other dark
      // units: nothing drained him and nothing infected him. He pulled his
      // OWN cell when the broadcast took the city ‚Äî the one sane move left ‚Äî
      // and he left a note on his chest for whoever came after. So in the
      // den she does not stare at a silent body wondering; she READS, and
      // the note itself is the ask: put the cell back when it is safe. (It
      // even tells her where he hid it ‚Äî the chest across the room.)
      const note = key === 'A0B|ratchet'
        ? [t('sl_note1'), t('sl_note2'), t('sl_note3')] : null;
      if (invCount(npcCellItem(s)) <= 0) {
        // no cell: it says nothing, because it cannot. The line is HERS ‚Äî
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
          const restore = () => {
          if (!invTake(npcCellItem(s))) return;
          npcCharge(s);
          if (key === 'A0B|ratchet') { G.save.flags.ratchetRepaired = 1; persist(); }
          G.toast(t('npc_woke').replace('%s', t('n_' + s.extra)));
          // WHAT IT GIVES BACK. Every unit repays the cell, because a hand-off
          // that buys nothing is a fetch quest wearing a story. The first one
          // she ever wakes gives her a repair kit ‚Äî the thing she needs most,
          // from the person who needed her most, which is the whole game in
          // one exchange.
          const gift = NPC_GIFT[key] || NPC_GIFT['*'];
          if (gift) gift();
          // THE STORY RIDES THE WAKING. A unit that just came back has the
          // most to say of its whole life, and making the player guess to
          // press E a second time is how the first story beat got missed
          // ("it doesn't have a story"). When the gift card closes, the
          // conversation reopens itself ‚Äî straight into the errand ask,
          // which for Ratchet IS the backstory: the song, the chest
          // crystal, the sword he can forge.
          //
          // ...and in the DEN, the waking teaches the two survival systems
          // first (owner's design): the pod in the corner ‚Äî how saving and
          // recharging work ‚Äî and the heal protocol he just handed over,
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
                // back in is TELL ‚Äî the fired film of the city falling and
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
          };
          if (key === 'A0B|ratchet' && !isHero() && G.save.storyVersion >= 2) repairOpen(s, restore);
          else restore();
        },
      };
      G.state = 'DIALOG'; sfx('ui'); npcSay(s.extra, 0);
      return;
    }
    const q = typeof questFor === 'function' ? questFor(s.extra) : null;
    let lines = t('d_' + s.extra).slice();
    if (s.extra === 'ratchet' && !isHero() && G.save.flags.crystal && !G.save.flags.alphaLead && !G.save.flags.alpha) {
      G.save.flags.alphaLead = 1; qSet('alpha_pack', 'active'); lines = lines.concat(t('q_ask_alpha_pack')); persist();
    }
    // WHAT THIS PERSON IS FOR. The trader trades; the Oracle opens the Trials.
    // That is their job and an errand does not replace it ‚Äî which is exactly
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
        // bubble ‚Äî and the owner read one: 'npc words are long and repeated'.
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
    // ‚Äî which is every conversation in zone A, where all six have errands.
    // It leads rather than trails, because it is the line the greeting used to
    // be, and because a player who skips the rest still hears it.
    {
      // THE KINGDOM'S OWN MILESTONES OUTRANK THE WAR'S. The tier lines count
      // fallen guardians ‚Äî the whole game's arc ‚Äî but the trader's opinion of
      // her should move on HIS arc first: the sword he forged, and what it
      // did in the deep chamber under this kingdom. Two overrides, in story
      // order, both specific per the standing-line law (what changed, never
      // how great she is): the forge line points the blade at the sage it
      // was made for, and the sage line is the kingdom's ending heard from
      // the mouth of the machine that made it possible.
      let k = 'sl_' + s.extra + '_' + standingTier();
      let backLine = null;               // "you came back" leads even the standing line
      if (s.extra === 'ratchet') {
        if (G.save.flags['sageTame_GA1D']) k = 'sl_ratchet_sage';
        else if (G.save.flags.crystal) k = 'sl_ratchet_forged';
        // the corridor where it swatted her: he has seen the dent, and he
        // says so until she has answered it (nfMeet set by the meeting,
        // bossGlitch by the rematch)
        else if (G.save.flags.nfMeet && !G.save.flags.bossGlitch) k = 'sl_ratchet_rematch';
        // "YOU CAME BACK" ‚Äî the underdog sentence, said by the one who passed
        // the husk. Once per death, keyed on the count so it never repeats
        // for the same fall.
        const dn = G.save.deaths || 0, seen = G.save.flags.deathsSeen || 0;
        if (dn > seen) {
          G.save.flags.deathsSeen = dn;
          const bl = t('sl_back');
          if (bl && bl !== 'sl_back') backLine = bl;
        }
      }
      // ...AND HE SAYS IT ONCE. This line is what the NPC makes of her now, so
      // it leads every conversation ‚Äî which meant that between two guardians
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
      if (backLine) lines = [backLine].concat(lines);
    }
    // THE STORY COMES IN FRAGMENTS (owner: "give us fragments of the story
    // with every advancement"). The memory film is the whole of what happened
    // to the city; these are the shards he can only say out loud once she has
    // proven she can carry them ‚Äî one new fragment each time a guardian's
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
    if (typeof survivorStory === 'function') lines = survivorStory(s, lines);
    G.dialog = { name: t('n_' + s.extra), lines, i: 0, npc: s.extra, onEnd: after };
    G.state = 'DIALOG'; npcSay(s.extra, 0);
  } else if (s.type === 'term') {
    G.dialog = { name: '‚Ä¶', lines: t('t' + s.extra).slice(), i: 0, onEnd: null, rs: RS_TERM[s.extra] };
    G.state = 'DIALOG'; sfx('ui');
    // THE CALL IS ANSWERED. This is the thing that has been sounding through
    // the rock since the meadow (CAVE_BEACON), and reading it is the first
    // time anything in the world has spoken to her rather than at her. The
    // voice settles from a search into a carrier from here on.
    if (CAVE_BEACON[G.roomId] && CAVE_BEACON[G.roomId].far === 0 &&
        !(G.save.flags && G.save.flags.beacon)) {
      G.save.flags = G.save.flags || {}; G.save.flags.beacon = 1;
      if (typeof persist === 'function') persist();
      G.toast(t('beacon_found'));
    }
  } else if (s.type === 'bench') {
    G.save.bench = { room: G.roomId, x: s.x, y: s.y + s.h - 38 };
    G.save.usedNine = false; G.save.usedAegis = false;
    starRestock(); persist(); sfx('bench');
    // A rest used to raise the fork too. It is a checkpoint ‚Äî the place you go
    // to stop thinking for a moment ‚Äî and putting the game's heaviest question
    // there, every single time, is what turned it into furniture.
    const dur = Math.max(1.4, (player.maxCores() - player.cores) * 0.2 + 1.4);
    const dock = 0.55;
    // dock phase: walk to the centre, then charge (robot: cables+surge / hero: drink)
    G.recharge = {
      t: dur, dur: dur, tick: 0.4, x: s.x + s.w / 2, y: s.y + 14,
      podTop: s.y, podH: s.h, phase: 'dock', dockT: dock, dock0: dock,
    };
    if(typeof mediaFetch==='function')mediaFetch('heroRecharge',1);
    player.rechargeT = dur + dock;
    player.face = 1;
    player.volts = 99;
    burst(s.x + s.w / 2, s.y + 8, 14, '#8ff6ff', 180, 0.6, 100, 3, true);
  } else if (s.type === 'chest') {
    if (s.opened) return;
    s.opened = true;
    if (s.flagKey) G.save.flags[s.flagKey] = 1;
    sfx('chest');
    if (s.extra === 'slot') { G.save.slots++; showItem(t('s_slot'), t('s_slotd')); }
    else if (s.extra.indexOf('rl:') === 0) G.grantRelic(s.extra.slice(3));
    else if (s.extra.indexOf('it:') === 0) {
      // an inventory item kept in a chest ‚Äî the booth's spare power cell
      const it = !isHero() && G.save.storyVersion >= 2 && G.roomId === 'A0B' && s.extra === 'it:batt'
        ? 'ratchetCell' : s.extra.slice(3);
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
    // a MIND NODE is one interactive puzzle now ‚Äî see NODES in trials.js
    triStartNode(s.extra | 0, s);
  } else if (s.type === 'secret') {
    // Story rewards remain in the world until prerequisites are earned.
    // Visiting the Cache or Foundry early must never consume a locked item.
    if (!isHero() && s.extra === 'crystal2' && (!G.save.flags.crystal || !G.save.flags.bossPrism)) {
      G.toast(t('weapon_secondlock')); sfx('no'); return;
    }
    if (s.extra === 'connector' && (!weaponOwned('dual') || !G.save.flags.bossAtlas)) {
      G.toast(t('weapon_connectorlock')); sfx('no'); return;
    }
    G.save.flags['sr_' + s.extra] = 1;
    G.statics.splice(G.statics.indexOf(s), 1);
    burst(s.x + 12, s.y + 12, 26, '#ffd76a', 280, 0.8, 100, 4, true);
    if (s.extra === 'crystal2' || s.extra === 'connector') {
      const joined = s.extra === 'connector';
      if (isHero() && !joined) { G.save.flags.crystal = 1; G.save.flags.crystal2 = 1; grantWeapon('joined'); }
      else grantWeapon(joined ? 'joined' : 'dual');
      persist();
      sfx(joined || isHero() ? 'crystalJoin' : 'chargeReady');
      G.flash = Math.max(G.flash, 0.5);
      burst(s.x + 12, s.y + 12, 34, '#ffffff', 320, 1.0, 40, 4, true);
      showItem(t(joined ? 'i_connector' : 'i_crystal2'), t(joined ? 'i_connectord' : 'i_crystal2d'));
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
      G.trans = { t: TRANS_DUR, to: 'V1', side: 'R', half: false };
      transSnap = transHeld ? transCv : null;
    } else {
      G.toast(t('vault_locked') + '  ' + have + '/3');
      sfx('no');
    }
  }
}

// ---------- update ----------
function fxDecay(dt) {
  for (const key of ['songWave','elemPop']) if (G[key]) {
    G[key].t-=dt; if (G[key].t<=0) G[key]=null;
  }
  G.flash = Math.max(0, G.flash - dt * 2.4);
  G.lowGravT = Math.max(0, (G.lowGravT || 0) - dt);   // NULL GRAVITY field
  G.iceT = Math.max(0, (G.iceT || 0) - dt);           // COOLANT FREEZE floor
  G.hudGlitchT = Math.max(0, (G.hudGlitchT || 0) - dt); // DATA CORRUPTION
  G.revT = Math.max(0, (G.revT || 0) - dt);           // MOTHER'S SONG reversal
  G.songLockT = Math.max(0, (G.songLockT || 0) - dt); // Song jammed
  G.darkT = Math.max(0, (G.darkT || 0) - dt);         // TOTAL NULL darkness
  G.revealT = Math.max(0, (G.revealT || 0) - dt);     // Song reveal in the dark
  // the wave leaves fast and slows as it dies ‚Äî an ease-out reads as a blast,
  // a constant speed reads as a hoop being inflated. Same ~250px reach as the
  // old flat 560/s, spent differently.
  for (const r of G.rings) { r.r += (260 + 700 * clamp(r.a / (r.a0 || 0.85), 0, 1)) * dt; r.a -= dt * 2; }
  G.rings = G.rings.filter(r => r.a > 0);
  if (G.coreFlash) { G.coreFlash.t -= dt; if (G.coreFlash.t <= 0) G.coreFlash = null; }
  G.coresFullT = Math.max(0, G.coresFullT - dt);
  if (G.impact) { G.impact.t -= dt; if (G.impact.t <= 0) G.impact = null; }
  if (G.bolt) { G.bolt.t -= dt; if (G.bolt.t <= 0) G.bolt = null; }
}
// How loud a machine's voice loop gets when she is standing right beside it.
const NPC_VOX_CEIL = 0.20;
function tickNPCVox() {
  // proximity mixing: each NPC's voice swells as she draws near, and blooms
  // while it is actually speaking with her
  if (typeof npcVoxTick !== 'function' || !G.statics) return;
  for (const s of G.statics) {
    if (s.type !== 'npc') continue;
    // A DARK UNIT MAKES NO SOUND. The owner: "why is my npc talking even while
    // still deactivated". Every other system in the game knows the difference ‚Äî
    // a unit with no cell reads a note instead of speaking, and its dialogue is
    // HER line rather than its own ‚Äî but the voice loop was mixed purely by
    // distance, so a body that has not been woken yet hummed at you as you
    // walked past it. A machine with its cell pulled is silent; that is the
    // whole point of the errand.
    if (typeof npcLive === 'function' && !npcLive(s)) { npcVoxTick(s.extra, 0); continue; }
    const d = Math.hypot(player.x + player.w / 2 - (s.x + s.w / 2),
                         player.y + player.h / 2 - (s.y + s.h / 2));
    const talking = G.state === 'DIALOG' && G.dialog && G.dialog.npc === s.extra;
    const k = clamp(1 - d / 320, 0, 1);
    // ...AND IT DUCKS UNDER ITS OWN SPEECH RATHER THAN SWELLING INTO IT. The
    // loop used to bloom to 0.85 exactly while this character was talking to
    // her ‚Äî a drone at full gain under the recorded line AND under the text
    // she is trying to read. "its lyrics is too long and destracting from
    // reading the story" is that drone: it is the voice you cannot finish,
    // because it never ends. A voice belongs to a body standing in a room; the
    // moment it has something to SAY, the room's sound gets out of the way.
    //
    // AND THE CEILING COMES DOWN. A voice loop at 0.6 beside a body is not a
    // presence, it is a second piece of music ‚Äî and this game already has one.
    // A machine you are standing next to should be something you notice when
    // you stop, not something you have to talk over.
    npcVoxTick(s.extra, (talking ? 0.12 : k * k) * NPC_VOX_CEIL);
  }
}
function update(dt) {
  if (G.state === 'REPAIR') { updateRepair(dt); narrativeAudioTick(); return; }
  if (typeof ComicRewards !== 'undefined' && ComicRewards.tick(dt)) return;
  if (typeof heroMotionGate === 'function' && heroMotionGate(dt)) return;
  if (typeof tutorialTick === 'function') tutorialTick();
  narrativeAudioTick();
  if (G.state === 'PLAY' || G.state === 'DIALOG') { tickNPCVox(); tickCaveLure(); }
  else if (typeof npcVoxQuietAll === 'function') npcVoxQuietAll();
  if (G.state === 'PLAY') {
    G.save.time += dt;
    fxDecay(dt);
    rubbleTick(dt);
    if (G.hitStop > 0) {
      if (inP('ATK') && player) player.atkBuf = Math.max(player.atkBuf || 0, 0.2);
      if (inP('JUMP') && player) player.jbuf = Math.max(player.jbuf || 0, 0.12);
      if (inP('PAUSE') || inP('BACK')) { G.state = 'PAUSE'; G.pauseIdx = 0; sfx('ui'); }
      G.hitStop = Math.max(0, G.hitStop - dt); updateParts(dt * 0.25); return;
    }
    meetCheck(); if (G.meet) meetStep(dt);
    // THE BREAK (js/story-opening.js): the one moment NULLFANG lets go of the
    // order, staged between the sage and the bell. Same shape as the meeting ‚Äî
    // a check that may open it, a step that drives the body by hand.
    if (typeof breakCheck === 'function') { breakCheck(); if (G.break) breakStep(dt); }
    // THE CROSSING IS A MOVE, NOT A CUT (owner, 2026-08-23: "the map... becomes
    // cubicles of rooms connected... instead, it's actual world connected").
    // Every screen edge used to fade the picture to solid black over 0.28s,
    // swap the room at the halfway point, and fade back ‚Äî and the world was
    // frozen for the whole of it. Two rooms joined by a blackout are two
    // rooms; the same two joined by the camera carrying through are a place.
    // The room now swaps on the FIRST frame of the crossing and the outgoing
    // picture is PUSHED off the side she left by (see transSnap in the draw),
    // while the world underneath keeps running ‚Äî so her walk never stops.
    if (G.trans) {
      G.trans.t -= dt;
      if (!G.trans.half) { G.trans.half = true; applyTransition(); }
      if (G.trans.t <= 0) G.trans = null;
    }
    {
      // the chamber hold: the world keeps breathing, she does not move
      if (G.bossEntry) {
        G.bossEntry.t += dt;
        if (G.bossEntry.t >= G.bossEntry.dur || !G.boss || G.boss.st !== 'dorm') G.bossEntry = null;
        else if (player) player.vx = 0;
      }
      if (typeof updateRoarFX === 'function') updateRoarFX(dt);
      // THE CACHE GATE: the floor entrance stays open until she is truly
      // inside ‚Äî on her feet, clear of the hole ‚Äî and only then does the
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
      // ‚Äî and standing in it costs a core. It is the only thing in the game
      // that makes NOT moving the mistake.
      if (G.pools && G.pools.length) {
        for (let i = G.pools.length - 1; i >= 0; i--) {
          const q = G.pools[i];
          q.t -= dt;
          if (q.t <= 0) { G.pools.splice(i, 1); continue; }
          // ...and what the FOUNDRY leaves behind uses the same list (kingdom
          // C's moves, js/entities.js: cinder / slagsplash / pour). A poured
          // runnel is not a drip: it RUNS, fast, to the width its own spill
          // had and no further ‚Äî so the spread rate and the ceiling are per
          // pool now instead of one pair of constants for the only thing that
          // ever made one. An old-style pool passes neither and is unchanged.
          q.r = Math.min(q.rMax || 26, q.r + (q.hot ? SLAG_SPREAD : 34) * dt);
          if (!player.dead && player.iT <= 0 && player.on
              && Math.abs(player.x + player.w / 2 - q.x) < q.r
              && Math.abs(player.y + player.h - q.y) < 16)
            player.hurt(DF().edmg, q.x, q.hot ? 'foundry.slag' : 'blob.pool');
        }
      }
      if (G.plats) for (const pl of G.plats) pl.update(dt);
      if (!(typeof isHero === 'function' && isHero())) ceilWeather(dt, G.roomDef.zone);
      sawHum(dt);
      updateTutor(dt);
      updateLesson(dt);
      // during a finishing blow she is driven, not steered ‚Äî the choice was the
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
      // only when she is standing on the ground in front of them ‚Äî pressing up
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
    // THE AFTERMATH IS THE FRAME THAT CARRIES THE INFORMATION (manga-direction
    // ¬ß3): once it has thrown her, the camera holds both of them ‚Äî where she
    // landed, and it standing there looking ‚Äî rather than chasing her off the
    // crest and leaving the guardian to finish its beat off-screen
    if (G.meet && !G.meet.interactive && G.boss && (G.meet.ph === 'watch' || G.meet.ph === 'coil'))
      // a third of a screen short of the guardian: it stands at the right of
      // the frame and she is wherever the throw put her, up to 800 px west of
      // it (measured 480-600) ‚Äî a true midpoint put it a hair past the edge
      updateCam(G.boss.cx() - 330, (player.y + player.h / 2 + G.boss.cy()) / 2, G.roomDef.w * TILE, G.roomDef.h * TILE, dt);
    else
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
  else if (G.state === 'FILMS') updateFilms();
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
  // "Play" always leads to the Who-are-you chooser (per-character saves) ‚Äî
  // unless this build is LOCKED to one game, where the menu speaks plainly:
  // Continue (if that game has a save) and New Game (story from the top)
  const lk = gameLock();
  if (lk) {
    const opts = [];
    if (loadStored(lk)) opts.push('continue');
    opts.push('newgame');
    // THE OPENING, ON DEMAND. It played once, on the first boot ever, and after
    // that a returning player never saw it again ‚Äî which is most boots, for the
    // person who has been testing the game all week. It is a piece of the game,
    // not a one-time gate: it belongs on the menu like everything else.
    if (lk !== 'hero') opts.push('film');
    return opts.concat(['controls', 'lang', 'bright', 'sound', 'music']);
  }
  return ['play', 'controls', 'lang', 'bright', 'sound', 'music'];
}
// ---------------------------------------------------------------------------
// SCREEN BRIGHTNESS ‚Äî a real setting, because a game this dark cannot be
// mastered on one screen and shipped to another.
//
// MEASURED, over eight rooms: mean frame luminance 13-22 out of 255, and in
// SEVEN of the eight the MEDIAN PIXEL IS ZERO ‚Äî between 62% and 80% of every
// screen is within a hair of black. On a desktop monitor in a dim room that is
// atmosphere. On a phone, which is where this game is actually played and often
// in daylight, it is a black rectangle with a cat in it. The owner's word for
// it, three times: "all so dark".
//
// The lift is a SCREEN composite, not a brightness multiply, and that choice is
// the whole point: multiplying a black pixel by anything leaves it black, which
// is why a CSS brightness filter does nothing for a frame that is 70% black.
// screen(dst, g) = 1-(1-dst)(1-g) raises the floor to g and leaves a white
// highlight white ‚Äî it lifts exactly the region that is missing and nothing
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
// THE LIFT IS ADAPTIVE NOW (2026-08-30). It was written for frames whose
// median pixel was zero, and it fixed them. Then the painted plates were freed
// from the grade and the lit rooms arrived on screen at a mean of 60-70 RAW ‚Äî
// and the same constant 46 was still being screened over them, which is the
// grey film the critic's pass photographed in every room: out = 46 + 0.82*raw
// turns a warm workshop into milk. So the floor is now a function of how dark
// the frame actually is: a cave at raw 10 keeps the full lift (cavedark's
// numbers are unchanged), a lit room at raw 66 gets almost none, and the
// setting still scales the ceiling. Measured every half second off a 24x14
// downsample of the world ‚Äî one small readback, not one per frame ‚Äî and
// eased so a room change never pops.
let LIFT_K = 1, LIFT_NEXT = 0, LIFT_CV = null;
const LIFT_LIT = 72, LIFT_SPAN = 48;   // raw mean >= 72: no lift; <= 24: full
function liftProbe() {
  const now = performance.now();
  if (now < LIFT_NEXT) return;
  LIFT_NEXT = now + 500;
  try {
    if (!LIFT_CV) { LIFT_CV = document.createElement('canvas'); LIFT_CV.width = 24; LIFT_CV.height = 14; }
    const x = LIFT_CV.getContext('2d', { willReadFrequently: true });
    x.drawImage(c.canvas, 0, 0, 24, 14);
    const d = x.getImageData(0, 0, 24, 14).data;
    let L = 0;
    for (let i = 0; i < d.length; i += 4) L += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    L /= 24 * 14;
    const want = clamp((LIFT_LIT - L) / LIFT_SPAN, 0, 1);
    LIFT_K += (want - LIFT_K) * 0.35;
  } catch (e) { LIFT_K = 1; }             // a tainted canvas keeps the old behaviour
}
function drawScreenLift() {
  const g0 = BRIGHT_STEPS[brightIdx()];
  if (!g0) return;
  liftProbe();
  const g = Math.round(g0 * LIFT_K);
  if (g < 2) return;
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
      // steps round, like every other toggle on this menu ‚Äî and it applies the
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
// language picker ‚Äî a clear list, live preview, easy to change back (works like a toggle)
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
    else { G.diffIdx = 1; G.state = 'DIFF'; }  // fresh voyage ‚Üí pick difficulty
  }
}
function pauseHasTouch() { return typeof TOUCH !== 'undefined' && TOUCH.enabled; }
// ===========================================================================
// THE PACE DIAL. The one assist that matters most for the player this game is
// actually for, and the cheapest: one multiplier on dt slows every telegraph
// in the game at once ‚Äî including the ones nobody has tuned yet ‚Äî without
// touching a single enemy constant or making anybody invincible.
//
// It is SEPARATE from the difficulty presets on purpose. Kitten bundles seven
// cores, weak enemies and a quarter of the damage into one switch, so a child
// who needs nothing but more time to react has to accept being nearly
// unkillable, and loses the achievement along with the challenge. Celeste's
// designer found the assists that matter are the in-between ones ‚Äî 20% slower,
// one extra dash ‚Äî the ones that let a player tune rather than trivialise.
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
// places and getting all of them right ‚Äî which is why no row was ever added,
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
    { id: 'pace', label: t('pace') + ':  ' + paceLabel() + '   ‚óÇ ‚ñ∏', arrows: 1, hint: t('pace_d') },
    { id: 'qual', label: t('qual') + ':  ' + qualLabel() + '   ‚óÇ ‚ñ∏', arrows: 1, hint: t('qual_d').replace('%s', DEVICE.form) },
  ];
  it.push({ id: 'films', label: t('film_title') });
  if (!isHero()) it.push({ id: 'comics', label: LANG === 'ar' ? 'ÿ∞ŸÉÿ±Ÿäÿßÿ™ ÿßŸÑŸÖÿßŸÜŸáŸàÿß' : 'Manhwa memories' });
  if (pauseHasTouch()) it.push({ id: 'touch', label: t('tl_title') });
  it.push({ id: 'restart', label: t('pm_restart'), icon: '‚Üª', warn: 1, hint: t('pm_restart_d') });
  it.push({ id: 'quit', label: t('to_menu'), icon: '‚èª', warn: 1, out: 1 });
  return it;
}
// ...and one geometry, read by the drawing AND by the tap targets. They used to
// be written out separately, which is how the touch hit-boxes ended up testing
// for seven rows at a 40 px pitch against a menu that had ten at a different
// one: on a phone the pause menu selected the wrong line.
// one line: WORLD <id> ¬∑ <lean> ¬∑ <laws>. A run with no fork yet leans nowhere.
function pauseWorldLine() {
  const u = (typeof universe === 'function' && universe()) || null;
  if (!u) return '';
  const lean = u.depth === 0 ? '‚Äî'
    : (u.mercy >= u.sever && u.mercy >= u.red) ? t('br_mercy')
    : (u.sever >= u.red) ? t('br_sever') : t('br_red');
  const laws = (u.anom || []).map(a => (typeof BR_ANOM !== 'undefined' && BR_ANOM[a]) ? BR_ANOM[a].n : a).join(' ¬∑ ');
  return t('pm_world') + ' ' + u.id + '   ¬∑   ' + lean + (laws ? '   ¬∑   ' + laws : '');
}
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
    else if (cur.id === 'films') { G.state = 'FILMS'; G.filmIdx = 0; }
    else if (cur.id === 'comics') ComicRewards.library();
    else if (cur.id === 'touch') G.state = 'TCFG';
    else if (cur.id === 'restart') {
      // same difficulty, same world, nothing carried ‚Äî the run starts over
      const d = G.save && G.save.diff != null ? G.save.diff : 1;
      const fresh = newSave(d);
      fresh.theme = gameLock() || (G.save && G.save.theme) || 'robo';
      startGame(fresh);
    }
    else if (cur.id === 'quit') {
      // Continue reloads a stored object. Preserve a finishing guardian's
      // earned reward in that object before leaving this run behind.
      settlePendingBossReward(); persist(); setMusic('title'); G.state = 'MENU'; G.menuIdx = 0;
    }
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
      ftxt(RELIC_ICONS[id] || '‚óÜ', x, y + 1, 14, '#ffd76a');
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
// It lists two things that were previously invisible ‚Äî the counted items the
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
    const meta = INV[it.id] || { icon: '‚óÜ', col: '#8aa2b5' };
    const x0 = rtl ? 770 : 190, al = rtl ? 'right' : 'left';
    ftxt(meta.icon, rtl ? 782 : 178, y + 1, 19, meta.col, 'center');
    const nm = t('i_' + it.id);
    ftxt(nm + (it.n > 1 ? '  √ó' + it.n : ''), x0 + (rtl ? -22 : 22), y - 6, 17,
         sel ? '#eef3fa' : '#a9bccd', al);
    ftxt(t('i_' + it.id + 'd'), x0 + (rtl ? -22 : 22), y + 12, 12, '#7d93a8', al);
    if (it.use) ftxt(t('i_use'), rtl ? 190 : 770, y, 12, sel ? '#7dff9a' : '#5d7a8f', rtl ? 'left' : 'right');
  });
  ftxt(t('rl_close'), 480, 516, 12, '#7d93a8');
}
function updateCrest() {
  if (!isHero()) return updateGear();
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
    if (!isHero() && G.save.storyVersion === 2 && !G.save.flags.heal && it.type !== 'cell') {
      G.toast(t('story_pack_first')); sfx('no'); return;
    }
    if (shopSold(it)) { sfx('no'); return; }
    const cost = Math.floor(it.cost * (relicHas('coin') ? 0.9 : 1));
    if (G.save.scrap < cost) { G.toast(t('poor')); sfx('no'); return; }
    G.save.scrap -= cost; sfx('buy');
    if (it.type === 'cell') {
      // consumable, so it never leaves the list and never stops being useful
      player.volts = player.voltMax();
      G.save.flags.tutBuy = 1;
      burst(player.x + player.w / 2, player.y + 6, 16, '#ffd76a', 200, 0.6, 120, 3, true);
      // THE FIRST ONE IS THE PACK. It wires the HEAL PROTOCOL and the VOLT
      // BURST into her ‚Äî the two things the volts are FOR ‚Äî and says so once,
      // on the card, because a verb nobody announced is a verb nobody finds
      // (see burstUnlocked). Every cell after it is a refill.
      if (!G.save.flags.heal) {
        G.save.flags.heal = 1; G.save.flags.pack = 1;
        showItem(t('i_pack'), t('i_packd'));
        return;
      }
      G.toast(t('s_cell') + '  ‚ö° ' + player.volts);
      persist();
      return;
    }
    if (it.type === 'crest') grantCrest(it.id);
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
// ONE GEOMETRY FOR THE TREE, read by the drawing AND by the tap targets ‚Äî the
// pause menu's lesson, and this screen needed it for the same reason: the touch
// hit-test was written against the TWO-column layout and never learned about
// the three-column one the purifier branch grows, so on a phone with the sword
// every node past the second column selected the wrong skill.
//
// It also makes room. The preview window is a column of its own now, and the
// tree slides left to give it one rather than being drawn over.
function skillLayout() {
  const pool = skillPool();
  const cols = pool.length > 8 ? 3 : 2;
  const pos = cols === 2
    ? i => ({ x: 250 + (i % 2) * 290, y: 150 + Math.floor(i / 2) * 105 })
    : i => ({ x: 165 + (i % 3) * 225, y: 138 + Math.floor(i / 3) * 88 });
  return { pool, cols, pos, demo: { x: 706, y: 148, w: 228, h: 176 } };
}
function drawSkills() {
  c.fillStyle = 'rgba(4,7,12,0.88)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('sk_title'), 480, 46, 28, '#eef3fa', 'center', '#b48cff');
  ftxt(t('sk_iq') + '  ' + G.save.iq, 480, 82, 17, '#b48cff');
  // the tree BREATHES when the crystal branch appears: two columns while she
  // is claws-only (the layout every save so far has known), three once the
  // pool outgrows it, with the rows squeezed to keep the description clear
  const L = skillLayout();
  const pool = L.pool, cols = L.cols, pos = L.pos;
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
    ftxt(owned ? '‚úì' : (open ? String(sk.cost) : 'üîí'), p2.x, p2.y, owned ? 18 : 13, owned ? '#7de8a0' : open ? '#dbe7f2' : '#607386');
    ftxt(t('sk_' + sk.id), p2.x, p2.y + 44, 14, sel ? '#eef3fa' : '#8aa2b5');
  });
  const cur = pool[Math.min(G.skillIdx, pool.length - 1)];
  // ...AND THE WINDOW THAT SHOWS THE VERB (owner: "it should open a window next
  // to it showing me the character doing it in a mini screen"). A tree that
  // sells moves has to show the move; the description under it is a promise,
  // and this is the thing itself, played out of her own sheet. See
  // js/riddles.js drawSkillDemo.
  //
  // It sits on the side of the frame the selected node is NOT on, so the window
  // never covers the thing you are looking at.
  if (typeof drawSkillDemo === 'function') {
    const d = L.demo;
    drawSkillDemo(c, d.x, d.y, d.w, d.h, cur.id, performance.now() / 1000);
    ftxt(t('sk_' + cur.id), d.x + d.w / 2, d.y - 14, 14, '#cbb6ff');
  }
  // the description keeps clear of the window's column
  wrapText(t('sk_' + cur.id + 'd'), 440, 14).forEach((ln, i) => ftxt(ln, 420, 474 + i * 19, 14, '#9fb8c8'));
  ftxt(t('sk_hint'), 420, 518, 12, '#7d93a8');
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
// looked broadly right ‚Äî but the base direction governs where neutral
// characters land, so full stops, dashes and digits were being placed at the
// wrong end of the sentence. The language knows which way it reads; the canvas
// simply was never told.
// THE FOOTER. Studio on the left, build stamp on the right, drawn by one
// function so a screen can never carry the version and lose the name.
function drawFooter(y, dim) {
  ftxt(STUDIO, 30, y, dim ? 12 : 13, dim ? '#44586b' : '#6c8296', 'left');
  ftxt(GAME_VERSION, 930, y, dim ? 12 : 13, dim ? '#44586b' : '#6c8296', 'right');
}
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
// CC0 industrial parallax skylines (ansimuz, CC0) ‚Äî colourised per zone so the
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
    // pure silhouette ‚Üí vertical zone gradient
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
// Hand-built layered vistas ‚Äî marble temples, sailing ships, the underworld ‚Äî
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
    // deep colonnade receding ‚Äî three ranks at different depths
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
// THE GATES WERE A RECTANGLE. They were drawn as a PROP ‚Äî a full-frame 16:9
// render pasted into the room ‚Äî so the room had a hard vertical seam down it
// and the backdrop stopped a third of the way from the right, which is exactly
// what it looked like: a photograph laid on the scene rather than the scene
// continuing. A full-frame painting is a BACKDROP. It goes where the backdrop
// goes: behind everything, full bleed, panning with the camera, with no edges.
const ROOM_VISTA = {
  W2: 'gateCity',
  // the crystal cave (quest 1): the mouth in the kingdom's rock, and the view
  // back out of the dark. Both paintings are queued in ART_QUEUE ¬ß2c; until
  // they land the rooms borrow their zone's atlas cell, and the depth doors
  // work either way ‚Äî the walk aims at whatever backdrop is actually there.
  A5: 'caveMouth',
  CV1: 'caveExit',
  // the trader's den (¬ß2g): the one-room workshop painting. Until it lands
  // the room borrows the zone atlas cell like every other unfired vista.
  A0B: 'denInterior',
  // the Oracle's parlor (¬ß2h): mono's data-den behind the cable shrine in B3.
  // Unfired ‚Äî the room borrows the zone-B atlas cell until the plate lands.
  B3B: 'oracleInterior',
  // the Tinker's forge (¬ß2k): Patch-7's smithy behind the quench hood in C5.
  // Unfired ‚Äî the room borrows the zone-C atlas cell until the plate lands.
  C5B: 'forgeInterior',
  // the Sage's carrel (¬ß2m): the Nine-Lives Sage's reading den behind the
  // leaning shelf-stacks in D1. Unfired ‚Äî the room borrows the zone-D atlas
  // cell until the plate lands.
  D1B: 'carrelInterior',
  // the Nymph's hollow (¬ß2o): Lumen's den inside the burst cocoon-pod in E1.
  // Unfired ‚Äî the room borrows the zone-E atlas cell until the plate lands.
  E1B: 'hollowInterior',
  // the Cutter's kerf (¬ß2aq): the split-stone shop in the wall of the Cache.
  // Unfired ‚Äî the room borrows the zone-X atlas cell until the plate lands.
  V1B: 'kerfInterior',
};

// ===========================================================================
// THE POUR ‚Äî the Foundry's molten iron, running continuously behind the play.
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
    // dark crust first ‚Äî the skin that cools on the outside of the stream
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
    // heat haze standing over the pool ‚Äî the air itself bending
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
// THE STRATA BAND ‚Äî the owner's painted scene strips, hung as a mid-depth
// layer between the vista and the playfield so the kingdoms read as built
// places with real material behind them instead of a flat wash.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// GROUND STRATA. The kingdoms' floors and walls were flat palette fills ‚Äî one
// colour, one line, all the way across. They are now cut from the owner's
// painted scenes: forge rubble and cooling slag underfoot in the Foundry,
// rimed ice and frozen racks in the Archives. The texture is baked into a
// tile-aligned sheet once, then sampled by WORLD position, so seams never
// show and the same wall never repeats where the eye can catch it.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// THE ROCK. Every solid tile in the game ‚Äî floor, wall, ceiling ‚Äî is cut from
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
// the same material as the wall around it or it is not a secret ‚Äî so the
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
// stays on screen if the plate never does (RULE ZERO ‚Äî the engine never assumes
// it has the good version).
const ROCK_ART = { A: 'rockA', B: 'rockB', C: 'rockC', D: 'rockD', E: 'rockE', X: 'rockX' };

// ---------------------------------------------------------------------------
// A ROOM WITH A ROOF IS NOT THE FIELD OUTSIDE IT (owner, 2026-08-21: "why is
// the terrain inside tent same as outside!").
//
// It was, exactly, and for a reason worth writing down: EVERY ground decision
// in this engine was keyed on the room's ZONE, and an interior room keeps its
// kingdom's zone because it belongs to that kingdom. So Ratchet's workshop ‚Äî
// walls, roof, bench, hanging lamp ‚Äî was floored with Scrap Meadows: the
// zone's rock slab, the zone's strata plate, and wire-grass tufts sprouting
// along the boards in the kingdom's own teal. Alien flora was planted in it
// too, by the same rule. Three separate systems all asking the zone and none
// of them asking whether the room has a roof.
//
// The floor is now a property of the ROOM. `indoor` on the room def (js/world.js)
// switches the material to that interior's own ‚Äî which is the mimic rule the
// owner already set for elevations, applied to the ground they stand on: a
// workshop floor is the workshop's boards, a data-den's is deck plate.
//
// THE PLATES ARE HIGGSFIELD'S. Every key below is queued in ART_QUEUE ¬ß2u and
// UNFIRED; floorBake() underneath is the wiring stand-in, and it is deliberately
// a plain worn floor rather than an attempt at art. The keys light up the moment
// the plates are keyed into media.js ‚Äî nothing else has to change.
const INDOOR_ART = {
  A0B: 'floorDen',        // the Tinker's workshop: oiled boards, swarf, burn marks
  B3B: 'floorParlor',     // the Oracle's data-den: deck plate, cable gutters
  C5B: 'floorForge',      // Patch-7's smithy: slag-crusted plate, quench stains
  D1B: 'floorCarrel',     // the Sage's carrel: dry boards, drifted paper dust
  E1B: 'floorHollow',     // Lumen's hollow: grown chitin, soft and shell-like
  V1B: 'floorKerf',       // the Cutter's kerf: cut rock, crystal grit, saw-scored
};
// The interior's palette, in the same three roles the zone palettes use. Named
// here rather than derived from the zone, because the whole point is that the
// room is not its zone.
// ...and the LIGHT, which turned out to be the loudest half of the complaint.
// The tile layer is finished with a screen wash in ZONE_LIGHT ‚Äî aerial
// perspective, ¬ß9.1, and correct outdoors. Zone A's is [120,190,175]: dead
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
  // the Cache's own rock, cut flat and never swept: cold stone with the
  // seam's magenta still in it, and the white of the crystal she works
  floorKerf:   { base: '#33262f', join: '#1c1419', lit: '#6a5464', wash: [225, 220, 235], k: 0.11 },
};
function indoorKey() {
  return (G.roomDef && G.roomDef.indoor) ? (INDOOR_ART[G.roomId] || 'floorDen') : null;
}
const floorCache = {};
function floorTex(key) {
  const had = floorCache[key];
  if (had && had._final) return had;
  // the authored plate, IF it has been keyed ‚Äî asking for a key that media.js
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
    // the join between courses WANDERS ‚Äî a ruled line across a room is the
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
  // asking must not be what fetches ‚Äî see mediaHas in media.js ‚Äî so the request
  // is made explicitly, once, and the answer is "not yet" until it lands
  if (!mediaHas(k)) { if (typeof mediaFetch === 'function') mediaFetch(k); return null; }
  // NOT through softArt: that pass exists to feather the edge of a CUTOUT so
  // it does not read as a sticker, and a slab has no edge ‚Äî it is a texture
  // that must join itself. Running it here bought a full extra copy of every
  // slab and 22 ms of work for no visible difference.
  const im = MEDIA_IMG[k];
  return (im && (im.naturalWidth || im.width)) ? im : null;
}

function rockTex(zone) {
  // THE CACHE IS CHECKED FIRST, and that is a hot path, not tidiness: this is
  // called once per solid tile inside drawTiles, so several hundred times per
  // bake. Reaching rockPlate() first meant a mediaHas ‚Äî and, before the plate
  // landed, a mediaFetch ‚Äî on every one of them.
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
  // are saturated by design ‚Äî the Cache is hot magenta, the Foundry is orange ‚Äî
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
// was nothing at all ‚Äî the top of every room was the same flat tile as the
// walls, in every kingdom, which is why the rooms read as cross-sections
// rather than as places. A room you are INSIDE has something over you, and it
// is doing something.
//
// Two halves, deliberately:
//
//   THE PLATE   an authored strip per kingdom, hung from the top, drawn at two
//               depths ‚Äî a dark far layer that barely moves and a near layer on
//               full parallax ‚Äî so the ceiling has thickness rather than being
//               a sticker.
//   THE WEATHER what that ceiling DOES, drawn procedurally over it and
//               different in every kingdom: the Foundry beads and drips molten
//               metal that falls and cools on the floor, the Archives grow
//               icicles and shed snow, the Conduits arc and flicker, the
//               Meadows drip condensation and their little service robots twitch
//               on their clamps, the Nest breathes spores. It is the same
//               principle as the enemy tells ‚Äî a place is alive if it is
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
  // FAR: slow, dark, and wide ‚Äî the thickness of the roof
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
// is cosmetic on purpose ‚Äî a place that can kill you from above is a hazard,
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
    // the Meadows drip condensation off the vines ‚Äî and where the sky is open
    // there is no vine overhead to hang from, so the same water arrives the
    // way meadow water does: already falling
    push(G.roomDef.sky
      ? { k: 'drip', x: spawnX(), y: -10, vy: rnd(70, 120), t: 0, hang: 0, r: rnd(1.4, 2.2) }
      : { k: 'drip', x: spawnX(), y: 0, vy: 0, t: 0, hang: rnd(0.4, 1.6), r: rnd(1.6, 2.6) });
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
// THE FRINGE ‚Äî what grows on the edge of the world, and why it is drawn LAST.
//
// A tile grid ends in perfectly straight lines: every floor is a ruler, every
// ledge a machined step, and the eye reads the whole room as a diagram of
// rectangles because that is exactly what it is. No amount of texture INSIDE a
// tile fixes that, because the giveaway is not the surface, it is the boundary.
//
// So the boundary gets something growing out of it ‚Äî grass and vine on the
// Meadows, cable ends in the Conduits, slag crust in the Foundry, frost teeth
// in the Archives, fronds in the Nest, shards in the Crystal. Deterministic
// per tile (hash2 on the tile coordinate), so it is stable across frames and
// across visits, and built once per room into an offscreen layer that is then
// a single blit.
//
// AND IT IS DRAWN OVER THE CHARACTER. That is the whole trick and it is worth
// being explicit about: the fringe rises above the floor line, she stands ON
// the floor line, so the last few pixels of her feet pass BEHIND it. Nothing
// about her movement changes ‚Äî she is not standing in anything, there is no
// collision here at all ‚Äî but the eye stops reading her as a sticker laid on
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
// The ¬ß10 grammar shipped as ONE grammar: the same wave, the same crest, the
// same hang, in all six kingdoms. That is the defect the spec names ‚Äî the
// silhouette stopped being straight everywhere at once, and in doing so it
// became uniform, which is its own kind of flat. A kingdom is told by what
// its edges are MADE of, so the numbers and the decoration are per zone:
//
//   rough  how far the fBm wave sinks the silhouette (¬ß10.1's "4-12px")
//   lip    crest depth in px (¬ß10.3 wants irregular, not thin)
//   skirt  under-hang reach (¬ß10.3's 8-24)
//   crack  fracture density on exposed faces
//   edge   what grows ON the crest      ‚Äî the kingdom's signature at eye level
//   hang   what the under-hang is MADE of
//
// Values are the spec's, with two deliberate departures recorded where they
// are made: the crack test is hashed rather than Math.random (a per-frame
// random would flicker the cached layer on every re-render ‚Äî the exact bug
// the seed exists to prevent), and the decoration is painted into the cached
// tile canvas rather than per frame, so none of it costs anything at 60fps.
// ===========================================================================
const TERRAIN_THEME = {
  A: { rough: 6,  lip: 4, skirt: 12, crack: 0.30, edge: 'glow',    hang: 'plates'   },
  B: { rough: 8,  lip: 5, skirt: 18, crack: 0.50, edge: 'crystal', hang: 'roots'    },
  C: { rough: 10, lip: 6, skirt: 20, crack: 0.40, edge: 'molten',  hang: 'slag'     },
  D: { rough: 7,  lip: 5, skirt: 16, crack: 0.20, edge: 'ice',     hang: 'frost'    },
  // E AND X WERE SWAPPED, inherited from a brief written without this repo in
  // front of it. That brief's zone list belongs to another game ‚Äî it has E as a
  // prism facility and X as a void. Here E is THE VIRUS NEST (ZONE_LIGHT:
  // "infection red") and X is the CRYSTAL CACHE ("prism glow"), so the table
  // was giving the Nest cracked glass panels and the Cache hanging flesh.
  // The owner's own standing instruction is to preserve existing lore, names
  // and zone themes; these two now match the world they are drawing.
  E: { rough: 12, lip: 4, skirt: 24, crack: 0.80, edge: 'flesh',   hang: 'tendrils' },
  X: { rough: 5,  lip: 3, skirt: 10, crack: 0.15, edge: 'prism',   hang: 'glass'    },
};
// AN INTERIOR IS NOT A LANDSCAPE (owner, 2026-08-21: "why is the terrain inside
// tent same as outside!"). The material was already the painting's own floor ‚Äî
// drawInteriorFloor lays the den's boards over the tile layer ‚Äî so what he was
// reading as "the same" is the SHAPE, and the shape came from this table.
//
// Every number here is per ZONE, and an interior room keeps its kingdom's zone
// because it belongs to that kingdom. So Ratchet's workshop got the Scrap
// Meadows' terrain grammar: a 6px eroded ridge, a 4px scalloped crest, and 12px
// of material hanging off the underside ‚Äî a rock outcrop, drawn under a roof,
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
  // above the crest is doing real work ‚Äî it is how the walk line reads at a
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
  // dropped scrap, not grass ‚Äî the interior rooms swap to the scrap kind
  const kind = (typeof interiorVista === 'function' && interiorVista())
    ? 'scrap' : (FRINGE_KIND[zone] || 'grass');
  // fewer blades on a machine that is already struggling; the silhouette break
  // survives at three, the lushness does not
  const per = (typeof QUAL !== 'undefined' && !QUAL.glow) ? 3 : 5;
  // THE COASTLINE THE BLADES GROW ON IS THE ONE THAT IS DRAWN. The surface
  // curve lifts the painted silhouette as much as 46px above the tile line;
  // rooting the fringe on the tile line instead put every snow crust and every
  // blade on a second horizon BELOW the visible one, so the picture had two
  // ground lines ‚Äî a rolling one made of rock and a ruled one made of snow.
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
      // A shared flat baseline was the last ruler the floor had ‚Äî hundreds of
      // crust bottoms all sitting on Y+3 add up to one straight line.
      // the curve owns the ground; a floating deck is nowhere near it, so a
      // sample that lands more than a tile and a half away is not this tile's
      // surface and the tile line stays the fallback.
      const cy = curveY(bx);
      const gY = (cy != null && Math.abs(cy - Y) < TILE * 1.5) ? cy + 2
        : Y + (typeof fbm1 === 'function' ? Math.round(fbm1(bx, 641) * 10) : 0);
      // NOT A LAWN. One species at one height on even spacing reads as a comb,
      // and the eye flags a perfect fringe as fake in well under a second ‚Äî the
      // same failure the tile repeats had, one scale down. A verge is clumps
      // and gaps, so a sixth of the blades simply never grew here.
      const r3 = hash2(tx * 5 + i * 3, ty * 7 + 2);
      if (r3 < 0.16) continue;
      x.save();
      if (kind === 'grass' || kind === 'frond') {
        // a few greens, not one: the hue walks blade to blade, and a rare tuft
        // stands half again as tall as its neighbours
        // THE MEADOW IS ALIVE, AND IT HAS TO LOOK IT (owner, 2026-08-23: "this
        // greenery background is giving me very pale blue vibe instead of
        // vibrant one... it shouldn't be so electronic. It needs to be, even
        // though electronic, but vibrant, even though all the machines are
        // dead right now").
        //
        // He was reading the composite, not the paint. Measured: the fringe
        // canvas ALONE is 49.7 saturation at hue 100 ‚Äî a true yellow-green,
        // exactly as authored ‚Äî and on screen it was 27.8 at hue 113. The
        // cinematic grade was innocent (turning it off changed nothing); the
        // loss was HERE, in a per-blade alpha that started at 0.55. A blade at
        // 55% over dark teal rock is 45% rock: half the chroma gone and the
        // hue dragged toward the ground it is standing on.
        //
        // The alpha still varies ‚Äî blades at different depths must ‚Äî but from
        // 0.78, not 0.55, so a blade is a blade and not a stain. And the
        // greens go up a step in chroma and down a step toward yellow: still
        // wire-grass, still a machine meadow, but growing rather than glowing.
        const greens = ['#4f8b32', '#5da33c', '#71bf49'];
        x.strokeStyle = kind === 'frond' ? (r3 < 0.5 ? '#9a4fc4' : '#8544b4')
          : greens[Math.floor(r3 * 5.9) % 3];
        x.globalAlpha = 0.86 + r2 * 0.14;
        x.lineWidth = 1.9 + r1 * 1.3; x.lineCap = 'round';
        const hgt2 = hgt * (r2 > 0.86 ? 1.5 : 1);
        const blade = () => {
          x.beginPath(); x.moveTo(bx, gY + 3);
          x.quadraticCurveTo(bx + lean * 0.5, gY - hgt2 * 0.6, bx + lean, gY - hgt2);
          x.stroke();
        };
        blade();
        // A BLADE NEEDS A CORE. A 2px stroke is nearly all antialiased edge,
        // and an antialiased edge is half the rock behind it ‚Äî which is why
        // the paint measured 63 saturation and the screen measured 34. The
        // second pass is thinner, opaque and a step brighter: a lit filament
        // down the middle of the leaf. It is also the story ‚Äî in a kingdom
        // where every machine is dead, the grass is the thing still running.
        if (kind !== 'frond') {
          x.globalAlpha = 1;
          x.lineWidth = Math.max(0.9, (1.9 + r1 * 1.3) * 0.45);
          x.strokeStyle = r2 > 0.5 ? '#8fe05c' : '#7ccf4e';
          blade();
        }
        if (r1 > 0.72) {                       // a seed head / spore pod
          // the seed head is the brightest thing at ankle height, and it is
          // what makes a field read as a FIELD rather than as texture
          x.globalAlpha = Math.min(1, x.globalAlpha + 0.15);
          x.fillStyle = kind === 'frond' ? '#f09dff' : '#cbef72';
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
        // spike strips ‚Äî a decoration that impersonates a hazard, which is the
        // one thing scenery must never do. Rime is a rounded crust that pools
        // and sags; it is drawn as such, and low.
        // rime POOLS ‚Äî it does not carpet. A crust drawn at every blade slot
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
        // indoors: shavings and dropped bits, sparse and low ‚Äî floor clutter
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
      } else {                                  // shard ‚Äî same rule: never a spike
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
  // the measurement hook, the same shape as G.artProbe: with it set the fringe
  // is not drawn, so a harness can photograph the room with and without its
  // greenery and measure exactly the pixels the grass owns
  if (G.fringeProbe) return;
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
// PURIFICATION CUTSCENES. Some guardians do not blow apart when they lose ‚Äî
// they get an authored film instead. The final blow freezes the room, the
// clip plays, and when it fades the creature is standing there freed, moving
// around as your pet. No smoke, no wreckage: the film IS the death.
// A hard timeout and an error path guarantee this can never trap the player.
// ===========================================================================
const PURIFY_VID = {
  // THE FORGING ‚Äî ¬ß1d's film: Ratchet at his anvil, the shard, the chest
  // crystal, ending on the same white flare the grant flashes. It supersedes
  // sword_gift.mp4 (the tight handover close-up), which stays on disk as good
  // work but is no longer the moment the quest pays off on.
  // THE MEMORY ‚Äî the den wake already asks for this film by name and has
  // done since the wake was written; it just had no file. It is what he
  // tells her the moment his cell is back in: the workshop floor, the Song
  // taking every machine in the room, his chest crystal burning it out of
  // him, and the cable he pulled himself. It replaced 687 characters of
  // speech bubble, which is the owner's own instruction ‚Äî 'npc story should
  // be short generated video'.
  memory: 'assets/video/memory.mp4',
  // THE CORRIDOR ‚Äî the first meeting (underdog-arc ¬ß2.1) as the gallery keeps
  // it: the crest, the lion dropping in, the swat, her thrown and still alive.
  // Unlocked by the meeting itself (meetCheck); the live sequence is the beat,
  // this is the reward view of it.
  meet: 'assets/video/meet.mp4',
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
// five times, whether a creature gets to live. So the ending is not a film ‚Äî
// it is a REEL. An opener and a closer that always play, and one short solo
// vignette per guardian that plays only if that guardian is still alive.
//
// Every vignette is the same meadow at the same hour, shot as a slow left-to-
// right dolly at the same height and speed, with no other guardian and no HZD-99
// in frame. That is what makes them cuttable: any subset, in order, joins into
// one continuous travelling move. A player who spared nobody gets the same
// sunrise and the same last frame over an emptier field ‚Äî which is the honest
// version of what they chose, not a punishment.
// ---------------------------------------------------------------------------
// The order they cut in. Only the clips actually present in assets/video/ get
// registered ‚Äî the build scans the directory and hands the list over ‚Äî so a
// reel can never name a file that is not there and park the ending on black
// while a watchdog counts down.
// end_mother opens the reel: she is the last thing the player fights, and her
// switching off is what turns the lights back on across the whole world ‚Äî so
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
// The opening film's shots go in the same table ‚Äî it is what every film in the
// game is played through, so a clip the build found on disk but never
// registered here is a clip that silently does not exist.
{
  const have = (typeof window !== 'undefined' && window.VID_FILES) || null;
  if (have) for (const k in have) if (k.indexOf('intro') === 0) PURIFY_VID[k] = have[k];
  // THE MEMORY FILM (owner, 2026-08-16): the moment his cell goes back in,
  // Ratchet tells what happened to the city ‚Äî the necklace, the red flicker,
  // the crystal turning his eyes back blue, and his own hands opening his
  // chest. ¬ß3n on THE FIRING LIST. Registered only when the fired clip is
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
// Start pulling the film down long before it is needed, and ‚Äî critically ‚Äî
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
// A packaged app never takes it ‚Äî the files are already on the device, so a
// smaller copy buys nothing and costs picture. Everywhere else it is the
// connection that decides, and Save-Data is an explicit yes.
function videoLight() {
  if (!PURIFY_LIGHT || !Object.keys(PURIFY_LIGHT).length) return false;
  const packaged = (typeof window !== 'undefined') &&
    (!!window.Capacitor || location.protocol === 'file:' || location.protocol === 'capacitor:' || location.protocol === 'app:');
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
  // Mobile WebKit needs a connected inline media element. Canvas presents it.
  v.setAttribute('aria-hidden', 'true');
  v.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none';
  document.body.appendChild(v);
  // sources rather than a src: the browser picks the first one it can decode,
  // and only reports an error once it has failed at ALL of them
  const add = (url, type) => {
    if (!url) return;
    const so = document.createElement('source');
    so.src = url; so.type = type;
    v.appendChild(so);
  };
  // THE LIGHT TIER FIRST, WHERE IT IS WORTH IT. Browsers that take webm already
  // have a cheap option ‚Äî the webm set is 13.4 MB against the mp4 set's 33 ‚Äî
  // so it is iOS Safari, which takes mp4 and nothing else, that pays full price
  // for every film. On a metered or slow connection it gets the light mp4
  // instead: the same 960x540 picture, encoded at about half the bytes, which
  // frame-for-frame comparison could not tell from the master.
  //
  // Ordered rather than switched: the browser walks the <source> list and takes
  // the FIRST one it can decode, so putting the light copy in front costs a
  // device that cannot play it nothing at all.
  // the manifests are keyed by file basename (sword_forge, purify_glitch‚Ä¶),
  // not by the cut's kind (gift, glitch‚Ä¶) ‚Äî looking up by kind alone made the
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
// The opening is eight shots. Preloading all eight put 4.4 MB of webm ‚Äî or
// 13.1 MB of mp4, which is what iOS Safari takes ‚Äî on the wire 900 ms after the
// page loaded, every session, INCLUDING the sessions where the player presses
// Continue and never sees a frame of it. On mobile data that was the single
// most expensive thing the boot did, and it was competing with the room art the
// player was actually about to need.
//
// A reel is a QUEUE. Each shot runs about fifteen seconds, so shot n+1 has a
// quarter of a minute to arrive while shot n is on screen ‚Äî an eternity on any
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
  // Priming is a play() followed by a pause() ‚Äî the only way to unlock a video
  // element for later. play() returns a PROMISE, so the pause lands a beat
  // after the call, and the opening primes all eight clips on the same tap
  // that then starts the first one. The settle for clip one therefore arrived
  // AFTER it had begun: pause, rewind to zero. On screen that is a glimpse of
  // the film and then a stall, and a stalled clip is dropped ‚Äî which is how
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
// ---------------------------------------------------------------------------
// THE FILM GALLERY ‚Äî a story you earned should be a thing you own.
//
// Every film in this game was seen ONCE and then gone. That is the wrong shape
// for the thing they are: the owner's word for them is REWARD, and a reward
// you cannot go back and look at is closer to an interruption you got through.
// It is also what makes the two halves of the game work on each other ‚Äî the
// better the playing gets, the more a film is worth earning, and a film you can
// return to is what makes it worth having earned.
//
// Only the SINGLE CLIPS are listed. The opening and the ending are REELS ‚Äî
// eight shots cut to what the player did ‚Äî and a reel is played by a different
// path (G.reel) that hands its ending to the comic or the win screen; putting
// one behind a menu row would need that path to learn where it came from. They
// are noted here so the omission is a decision rather than an oversight.
const FILM_GALLERY = ['memory', 'meet', 'gift', 'glitch', 'brood', 'zero', 'atlas', 'prism'];
// SEEN IS RECORDED WHERE THE FILM ACTUALLY STARTS, not where it is triggered
// from ‚Äî every path into a film goes through startPurifyCut, including the
// gallery itself, so there is exactly one place this can be missed.
function filmSee(kind) {
  if (!G.save) return;
  if (!G.save.films) G.save.films = {};
  if (G.save.films[kind]) return;
  G.save.films[kind] = 1;
  if (typeof persist === 'function') persist();
}
function filmHas(kind) { return !!(G.save && G.save.films && G.save.films[kind]); }
// A GUARDIAN'S FILM IS CALLED WHAT THE GUARDIAN IS CALLED, and those names are
// already written in all five languages (b_glitch and friends) ‚Äî so the gallery
// borrows them rather than adding a second set to keep in sync, which is how
// two names for one creature drift apart.
const FILM_BOSS = { glitch: 1, brood: 1, zero: 1, atlas: 1, prism: 1 };
function filmTitle(k) { return t(FILM_BOSS[k] ? 'b_' + k : 'film_' + k); }
// one geometry, read by the drawing AND by the tap targets ‚Äî the pause menu's
// lesson, which cost a release in which the phone selected the wrong row
function filmsLayout() {
  const rows = FILM_GALLERY.filter(k => PURIFY_VID[k]);
  return { rows, step: 44, y0: 300 - (rows.length - 1) * 22, w: 560, h: 38 };
}
function updateFilms() {
  const L = filmsLayout(), n = L.rows.length;
  if (inP('BACK') || inP('PAUSE')) { G.state = 'PAUSE'; sfx('ui'); return; }
  if (!n) return;
  if (inP('DOWN')) { G.filmIdx = (G.filmIdx + 1) % n; sfx('ui'); }
  if (inP('UP')) { G.filmIdx = (G.filmIdx + n - 1) % n; sfx('ui'); }
  if (inP('OK')) {
    const k = L.rows[G.filmIdx];
    if (!filmHas(k)) { sfx('no'); return; }
    sfx('ok');
    // ...and it comes back HERE rather than to the room. G.cutEnd is the
    // one-shot the memory film already uses to hand back to the conversation
    // that started it; a film opened from a menu owes the menu the same.
    if (startPurifyCut(k)) G.cutEnd = () => { G.state = 'FILMS'; };
    else G.toast(t('film_wait'));
  }
}
function drawFilms() {
  c.fillStyle = 'rgba(4,7,12,0.88)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('film_title'), 480, 62, 28, '#eef3fa', 'center', '#8ff6ff');
  const L = filmsLayout();
  const got = L.rows.filter(filmHas).length;
  ftxt(got + ' / ' + L.rows.length, 480, 100, 15, '#8aa2b5');
  L.rows.forEach((k, i) => {
    const sel = i === G.filmIdx, have = filmHas(k);
    const y = L.y0 + i * L.step;
    if (sel) { c.fillStyle = 'rgba(143,246,255,0.09)'; rr(c, 480 - L.w / 2, y - L.h / 2, L.w, L.h, 9); c.fill(); }
    // A LOCKED ROW IS NOT A TITLE THE PLAYER HAS NOT EARNED YET ‚Äî naming the
    // films still to come spoils the count of guardians left and which of them
    // there are. It is a shape with nothing in it, which is what an unseen
    // story looks like.
    const label = have ? filmTitle(k) : '‚Äî ‚Äî ‚Äî';
    ftxt((have ? '‚ñ∏ ' : '¬∑ ') + label, LANG === 'ar' ? 480 + L.w / 2 - 20 : 480 - L.w / 2 + 20, y + 6,
      18, have ? (sel ? '#eef3fa' : '#9fb8c8') : '#4a5a68', LANG === 'ar' ? 'right' : 'left');
  });
  ftxt(t('film_hint'), 480, 500, 13, '#7d93a8');
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
  filmSee(kind);
  return true;
}
// Start the ending reel. Returns false when there is nothing to play ‚Äî no
// clips shipped yet, or none of them decodable ‚Äî so the caller can fall
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
    // browser cannot decode the reel at all ‚Äî trying the other seven would be
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
    // the opening film hands over to the comic's own ending ‚Äî the title card
    // and whatever was waiting behind it ‚Äî rather than to the win screen
    if (G.reelEnd === 'CINE') {
      G.reelEnd = null;
      // Only a film that COULD NOT PLAY falls back to the comic. Someone who
      // skipped it is telling us they do not want the opening at all ‚Äî handing
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
// How long a deliberate skip takes. Long enough that a stray touch cannot
// spend the story, short enough that a player who has seen it twice is not
// held hostage by it.
const CUT_SKIP_HOLD = 0.8;
function updateCut(dt) {
  const ct = G.cut;
  if (!ct) { G.state = 'PLAY'; return; }
  ct.t += dt; ct.hint += dt;
  const v = ct.v;
  // SKIPPING IS A HOLD, NOT A TAP (owner, 2026-08-23): "we should prevent
  // skipping the videos by single tap. It should be holding a certain button to
  // skip it instead of accidental skipping the story."
  //
  // He is right about the failure mode and it is worse on a phone than anywhere
  // else: the screen IS the button, the film asks to be touched to start its
  // sound, and every one of those touches used to be a live skip. The story is
  // the one thing in this game a player cannot get back by trying again.
  //
  // The press still does two things it always did ‚Äî it buys sound while the
  // sound is locked, and it is what the hold is measured from ‚Äî but throwing
  // the film away now costs CUT_SKIP_HOLD seconds of deliberate contact, drawn
  // as a filling bar so the player can see the cost before paying it.
  const pressed = inP('OK') || inP('JUMP') || inP('ATK') || inP('PAUSE') || inP('BACK');
  const holding = inD('OK') || inD('JUMP') || inD('ATK') || inD('PAUSE') || inD('BACK');
  if (pressed && ct.patient && introSoundTap()) { ct.skipHold = 0; return; }
  // the bar only fills once the film is actually on screen; holding through the
  // fade-in would skip a story the player has not been shown yet
  if (holding && ct.ph === 'play') ct.skipHold = (ct.skipHold || 0) + dt;
  else ct.skipHold = 0;
  if (ct.skipHold >= CUT_SKIP_HOLD && ct.ph !== 'out') {
    ct.ph = 'out'; ct.t = 0; ct.skipped = true; return;
  }
  if (ct.ph === 'in') {
    if (ct.t >= 0.34) { ct.ph = 'hold'; ct.t = 0; }
    return;
  }
  if (ct.ph === 'hold') {
    // black. If the film still is not ready, we simply wait here ‚Äî the dark
    // reads as the moment before a memory surfaces, never as a stall.
    ct.held += dt;
    if (purifyReady(ct.kind) || ct.held > (ct.patient ? 14 : 4)) {
      // WAIT FOR THE REWIND TO LAND. Asking for currentTime = 0 and calling
      // play() on the same frame is a RACE, and it is the one the owner kept
      // losing: "the first story glitches most of the time, I need to replay it
      // multiple times to force it to show from the beginning."
      //
      // The opening is where it bites hardest, because the very tap that starts
      // it is also the gesture that primes every clip in the game, and priming
      // IS a play(). purifyPrime's settle deliberately leaves the live cut
      // alone ‚Äî correct, or it would pause the film it just started ‚Äî so clip
      // one arrives here already running, at whatever position the prime
      // reached. A seek is asynchronous: request it, call play() immediately,
      // and the browser resumes from the OLD position. On screen that is the
      // film starting somewhere in its middle.
      //
      // So the rewind is now a state, not a statement. Ask once, stay in the
      // dark until the clip is actually at the start, and only then play. The
      // hold timeout above still bounds it, so a browser that will not seek
      // falls through exactly as it did before instead of hanging.
      if (v.currentTime > 0.05) {
        if (!ct.rewound) { ct.rewound = true; try { v.pause(); v.currentTime = 0; } catch (e) {} }
        return;                                  // still seeking ‚Äî hold the black
      }
      const pr = v.play();
      if (pr && pr.catch) pr.catch(() => { if (G.cut === ct) ct.failed = true; });
      ct.ph = 'play'; ct.t = 0;
    }
    return;
  }
  if (ct.ph === 'play') {
    // stall watch: if the frame clock has not moved after a beat and a half,
    // this browser cannot decode the film. Bail immediately rather than make
    // her stand in the dark ‚Äî the fight resumes as if the memory never came.
    if (v.currentTime > (ct.lastCT || 0) + 0.01) { ct.lastCT = v.currentTime; ct.stall = 0; ct.ran = true; }
    else ct.stall = (ct.stall || 0) + dt;
    // A CLIP CANNOT BE OVER IN ITS FIRST QUARTER SECOND. `ended` and the
    // duration check are both true for a video element parked at the end of a
    // previous playthrough, and both are read on the frame play() was called ‚Äî
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
    // out of the way of ‚Äî and on a phone on mobile data the first seconds of the
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
    // letterbox the film inside the frame ‚Äî never crop the authored art
    const k = Math.min(960 / v.videoWidth, 540 / v.videoHeight);
    const w = v.videoWidth * k, h = v.videoHeight * k;
    const x0 = (960 - w) / 2, y0 = (540 - h) / 2;
    c.save(); c.globalAlpha = a;
    try { c.drawImage(v, x0, y0, w, h); } catch (e) {}
    c.restore();
    // THE MEMORY REVEAL: it does not cut in, it surfaces ‚Äî a bloom of its own
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
  // carried, one per shot ‚Äî without them the footage is atmosphere and the
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
    const k = clamp((ct.skipHold || 0) / CUT_SKIP_HOLD, 0, 1);
    // A HOLD THE PLAYER CANNOT SEE IS JUST A BUTTON THAT DOES NOT WORK. The
    // prompt brightens the moment contact starts and a bar fills under it, so
    // the second of deliberate pressure reads as progress rather than as the
    // game ignoring them ‚Äî and letting go visibly costs nothing.
    c.globalAlpha = k > 0 ? 1 : 0.35 + Math.sin(performance.now() / 420) * 0.12;
    ftxt(t('cut_skip'), 480, 516, 13, k > 0 ? '#eaf4ff' : '#9fb8c8', 'center');
    if (k > 0) {
      const W = 96, H = 3, X = 480 - W / 2, Y = 524;
      c.fillStyle = 'rgba(160,190,210,0.28)';
      rr(c, X, Y, W, H, 1.5); c.fill();
      c.fillStyle = '#eaf4ff';
      rr(c, X, Y, Math.max(2, W * k), H, 1.5); c.fill();
    }
    c.restore();
  }
  if (typeof drawSoundChip === 'function') drawSoundChip(performance.now() / 1000);
}

// One reused offscreen layer for the near depth plate, and one gradient built
// once. Both are allocated on first use and never again ‚Äî a depth pass that
// allocated per frame would cost more than the depth is worth.
const VNEAR_Y = 196, VNEAR_H = 344;      // the band the near depth lives in
const VNEAR_K = 0.5;                     // and the resolution it is drawn at
let _vsc = null, _vmask = null;
function vistaScratch() {
  if (_vsc === null) {
    try {
      const cv4 = document.createElement('canvas');
      // Only as tall as the band it feeds ‚Äî a full-frame scratch spent a third
      // of its fill rate on rows the mask throws away ‚Äî and only half as wide
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
// SMALLER ‚Äî bottom on the floor line, feathered edges dying into darkness ‚Äî
// the same painting becomes a lamplit room whose table stands beside the
// sitting npc. The number is the fraction of the full-bleed cover scale.
// HOW MUCH OF THE FRAME THE ROOM'S OWN PAINTING FILLS.
//
// DO NOT RAISE THIS TO FILL THE FRAME. It has now been tried twice and reverted
// twice, and the second time is on me: 0.62 -> 0.88 made the room bigger and
// every complaint about it worse, because the den's painting is composed at
// photographic wide-angle. Its camera stands at eye level in the room, so a
// person in it would fill most of the frame ‚Äî the play plane runs at roughly
// 70px to the metre (a 32px tile, a 36px character) and the painting runs at
// roughly 180. It is about two and a half times overscale BY COMPOSITION, and
// scaling a picture cannot change what is inside it: zooming a painting whose
// workbench already towers over the cat only makes the workbench taller.
//
// The fix is the re-fire in docs/ART_QUEUE.md ¬ß2g ADDENDUM ‚Äî THE INTERIOR SCALE
// CONTRACT, which was written for exactly this report on 2026-08-16 and has not
// been fired yet. Until that plate lands, this value keeps the painted furniture
// as close to character scale as a single number can, and everything else that
// can be fixed in code ‚Äî the exposure, the surround, the light ‚Äî is fixed
// around it rather than by moving it.
const INTERIOR_FIT = { denInterior: 0.62, oracleInterior: 0.68 };
// which rooms ARE a painting: their vista key names an interior plate
function interiorVista() {
  const own = G.roomId && ROOM_VISTA[G.roomId];
  return own && /Interior$/.test(own) ? own : null;
}
// ===========================================================================
// THE INTERIOR FLOOR (owner, 2026-08-16: "the table on the floor looks very
// bad ‚Äî it's all because you refuse to create floor texture instead of the
// straight line"). In a room that IS a painting, the walkable strip cannot be
// the zone's soil band wearing a ruler edge and a lawn: it has to be the
// painting's OWN ground, carried forward to where she walks. So the band
// from the walk surface down is re-surfaced with the plate's bottom strip ‚Äî
// its actual floor ‚Äî and the seam where it meets the room is eaten into an
// irregular edge (bites in, lumps of its own texture pushed up past the
// line), per NO RIGHT ANGLES. Built once per room into an offscreen layer.
// ===========================================================================
let INT_FLOOR = null;                       // { key, cv, top[] }
// WHICH PART OF AN INTERIOR PLATE IS ACTUALLY ITS FLOOR. Per plate, because it
// is a fact about a painting and not a rule: these are paintings of rooms, and
// where the bare ground is depends entirely on where the artist put the
// furniture. x0/x1 bound the window horizontally, y/h the band. The default is
// the old full-width bottom strip, which is right for any plate whose floor
// really does run edge to edge.
const INTERIOR_FLOOR_SRC = {
  default:     { x0: 0,    x1: 1,    y: 0.86, h: 0.14 },
  // the den: crates and the cabinet own both edges at every height, and the
  // swept boards in front of the work table are the only real ground in it
  denInterior: { x0: 0.32, x1: 0.68, y: 0.80, h: 0.14 },
};
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
  // the walk surface, per column ‚Äî interiors are flat but nothing here
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
  // THE PAINTING'S OWN FLOOR ‚Äî and the word that matters is FLOOR.
  //
  // This took the plate's full-width bottom strip and stretched it across the
  // room. On den_interior that strip is not ground: it is the crates, the
  // cabinet and the coil rack standing at the FRONT of the picture, and
  // stretching them over a thirty-tile room laid a row of black towers across
  // the workshop. The owner drew a line round them and asked what the point of
  // them was; there was none. They were furniture, smeared.
  //
  // No height fixes it, which is the part worth recording: sampled at 0.60,
  // 0.66, 0.72, 0.78 or 0.86 this plate has furniture down BOTH SIDES every
  // time. Its floor exists only in the middle. So the sample is a WINDOW, not
  // a band ‚Äî a horizontal slice of real floor, per plate, stretched from there.
  const F = INTERIOR_FLOOR_SRC[own] || INTERIOR_FLOOR_SRC.default;
  const sx = im.naturalWidth * F.x0, sw = im.naturalWidth * (F.x1 - F.x0);
  const sy = im.naturalHeight * F.y, sh = im.naturalHeight * F.h;
  x.drawImage(im, sx, sy, sw, sh, 0, UP, W, cv.height - UP);
  // settle it into the room's dark: a touch of shade toward the bottom
  const shade = x.createLinearGradient(0, UP, 0, cv.height);
  shade.addColorStop(0, 'rgba(3,6,8,0)'); shade.addColorStop(1, 'rgba(3,6,8,0.55)');
  x.fillStyle = shade; x.fillRect(0, UP, W, cv.height - UP);
  // the seam: lumps of the floor's own texture pushed UP past the line first
  // (they copy clean pixels), then bites eaten INTO the edge ‚Äî same grammar
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
// How hard the painting is sat down so the playfield reads in front of it.
// Named for the same reason the far-plane knobs are: these were guessed, and
// the guess was measured wrong. See the note inside drawZoneVista.
// 2026-08-25, measured with tools/‚Ä¶ gradegrid: with every one of these knobs at
// its old value the city-gate painting lands on screen at chroma 6 against the
// 44 it carries in the file ‚Äî the grade was eating 88% of the art's colour and
// the screen lift was putting grey back on top, which is "dark AND faded" as a
// mechanism. The plates are painted with their own staged depth now (ART_QUEUE
// ¬ß2ac), so the compensation is double-counting. These are the D values from
// the five-step grid: the painting nearly raw, the seat kept only where the
// playfield needs it.
let VISTA_SEAT = 0.10;    // was 0.34, was 0.62 ‚Äî the bottom of the seating gradient
let VISTA_VEIL = 0.0;     // was 0.06, was 0.14 ‚Äî a flat black wash over the entire frame
let VISTA_GAMMA = 0.92;   // the mid-tone lift on the painting itself (1 = none)
let WORLD_VEIL = 0.06;    // was 0.16 ‚Äî the flat wash over the whole view
// Architecture stays rigid. Only progress through the room and camera height
// move a vista; ambient animation belongs to motes, foliage and light.
function vistaPlacement(CW, CH, scale, progress, travel, cameraY, vertical, yOffset) {
  const w = CW * scale, h = CH * scale;
  return { x: -(w - 960) * (0.5 + (progress - 0.5) * travel),
    y: -(h - 540) * 0.6 - cameraY * vertical - (yOffset || 0), w, h };
}
function drawZoneVista(P, zone, px, py) {
  const own = ROOM_VISTA[G.roomId];
  if (own && typeof mediaFetch === 'function') mediaFetch(own);
  if (own && INTERIOR_FIT[own] && typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[own]
      && typeof scenePlate === 'function') {
    const fim = scenePlate(own);            // the feathered copy ‚Äî edges fade out
    if (fim) {
      // THE ROOM DOES NOT END AT THE EDGE OF THE PICTURE.
      //
      // This used to fill the frame with #030608 and feather the plate into it,
      // which is precisely how you draw A PICTURE HANGING ON A WALL: a
      // rectangle of workshop, dissolving at its border into black that is not
      // part of any room. The owner's words ‚Äî "as if I'm looking at a framed
      // image instead of an actual background of the actual shop".
      //
      // The surround is sampled FROM THE PLATE instead ‚Äî its own ceiling colour
      // at the top, its own wall at the middle, its own floor at the bottom ‚Äî
      // so what the plate feathers into is more of the same room, a little
      // darker and without detail, the way the far corners of a workshop
      // actually look. Same feather, same plate, no frame: the picture stops
      // having an outside.
      const wash = plateWash(own);
      if (wash) { c.fillStyle = wash; c.fillRect(0, 0, 960, 540); }
      else { c.fillStyle = '#0d0a08'; c.fillRect(0, 0, 960, 540); }
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
      G._vistaPainted = G.roomId;
      return true;
    }
  }
  const solo = (own && typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[own])
    || (ZONE_VISTA[zone] && typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[ZONE_VISTA[zone]]);
  const im0 = solo || (typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.zones);
  const cell = solo ? [0, 0] : ZONE_CELL[zone];
  if (!im0 || !cell) return false;
  // THIS ROOM IS A PAINTING, AND SAYING SO IS ITS OWN JOB. bgPlanePass grades a
  // plate far more gently than it grades procedural ground, and it used to ask
  // `G._vistaRoom === G.roomId` ‚Äî a rect recorded as a SIDE EFFECT inside the
  // far-copy draw, and only when that copy is drawn at full parallax. A room
  // wide enough to earn its second plate never set it, so exactly the wide
  // rooms ‚Äî the Foundry among them ‚Äî took the procedural grade over a painting
  // and none of the gentle knobs moved them at all. Recorded here, where the
  // question is actually answered.
  G._vistaPainted = G.roomId;
  // THE PAINTING IS LIFTED BEFORE ANYTHING IS DONE TO IT. These plates are dark
  // in themselves ‚Äî the city gate painting measures 16% mean luminance with a
  // third of its pixels already crushed ‚Äî and four passes then sit on top. A
  // gamma lift raises what is in the shadows and leaves the highlights where
  // the painter put them, which is what makes the architecture in the plate
  // visible instead of merely brighter. Cached per plate; see media.js bgLift.
  const im = (typeof bgLift === 'function'
    && bgLift((solo ? (own || ZONE_VISTA[zone]) : 'zones'), im0, VISTA_GAMMA)) || im0;
  const CW = solo ? im.naturalWidth : im.naturalWidth / 2;
  const CH = solo ? im.naturalHeight : im.naturalHeight / 3;
  // scale the painting past the screen and pan across the excess as the camera
  // crosses the room ‚Äî a single painting, so it pans rather than tiles. Wide
  // solo paintings are width-bound so there is always horizontal travel.
  // NO per-room zoom (tried and reverted the same day): zooming a painting
  // whose furniture is already too big makes the furniture BIGGER. When an
  // interior's furniture towers over the characters ("the table in the
  // background is bigger than the npc") the fault is the painting's own
  // composition, and the fix is a re-fire with the scale contract in
  // ART_QUEUE ¬ß2g ‚Äî a standing character reaches 40% of frame height, a
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
  // art ‚Äî nothing is redrawn, nothing is restyled, the scene is identical ‚Äî
  // but the bottom of the frame now moves past faster than the top, which is
  // the whole of what the eye uses to judge distance.
  const t3 = performance.now() / 1000;
  // An opening painted into this room is architecture, not a distant vista.
  // Lock its painted threshold to the same world anchor as its interaction.
  const entrance = own && !INTERIOR_FIT[own] && gateDoors().find(d => d.gx != null && d.gy != null);
  const plate = (x2, mul, travel, vert, yOff) => {
    const rect = entrance
      ? {x:gateWorldX(entrance)-camSX()-dw*entrance.gx,
         y:(G.roomDef.h-2)*TILE-camSY()-dh*entrance.gy,w:dw,h:dh}
      : vistaPlacement(CW, CH, sc * mul, fx, travel, py, vert, yOff);
    const { x: cx2, y: cy2, w: w2, h: h2 } = rect;
    // WHERE THE PAINTING ACTUALLY LANDED ON SCREEN. Anything that has to line
    // up with something IN the backdrop ‚Äî the gap between the city gates, for
    // one ‚Äî cannot guess: the plate is scaled to overfill and panned by the
    // camera, so its rect is only known here. Recorded from the FAR copy,
    // which is the one the architecture belongs to. Stamped with the room, so
    // a stale rect from the previous room can never place this room's door.
    if (mul <= 1.001) { G._vista = { x: cx2, y: cy2, w: w2, h: h2 }; G._vistaRoom = G.roomId; }
    if (entrance) {
      // Continue edge material beyond the painting without repeating its door.
      if(cx2>0)x2.drawImage(im,0,0,1,CH,0,cy2,cx2,h2);
      if(cx2+w2<960)x2.drawImage(im,CW-1,0,1,CH,cx2+w2,cy2,960-cx2-w2,h2);
      if(cy2>0)x2.drawImage(im,0,0,CW,1,cx2,0,w2,cy2);
      if(cy2+h2<540)x2.drawImage(im,0,CH-1,CW,1,cx2,cy2+h2,w2,540-cy2-h2);
    }
    x2.drawImage(im, cell[0] * CW, cell[1] * CH, CW, CH, cx2, cy2, w2, h2);
  };
  // when the far plate is the only one, it carries the full travel ‚Äî the
  // depth pass must not cost the scene its pan
  // ...and only when the frame budget can carry it (see mainLoop)
  const wide = !entrance && roomW > 980 && richBG;
  plate(c, 1, wide ? 0.62 : 1, 0.035, 0);                   // far: the horizon barely moves
  // The near copy, masked into the lower frame. A room exactly one screen wide
  // cannot pan at all, so there is no parallax to separate and the second plate
  // would be pure cost ‚Äî most rooms in the game are that size.
  const near = wide && vistaScratch();
  if (near) {
    // no clear: the plate is opaque and covers the band edge to edge, so the
    // previous frame is fully overwritten by the draw that follows
    plate(near, 1.13, 1, 0.115, VNEAR_Y);
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
  // toward the zone palette so gameplay reads against the painting.
  //
  // MEASURED, AFTER THE OWNER REPORTED IT FOR THE FOURTH TIME. This is one of
  // FOUR darkening passes stacked on the same pixels ‚Äî this seat, the flat veil
  // under it, bgPlanePass, and the zone wash ‚Äî and the frame that came out of
  // them measured 14.3% luminance with 45% of its pixels crushed below 12%.
  // The screen-lift dial then put grey back over all of it to compensate,
  // which is where the second half of "too dark AND FADED" comes from: you
  // cannot restore a picture you have already removed, you can only raise the
  // floor it was removed to. So the seat and the veil come down, and the lift
  // has less to do. tools/gradesweep.cjs measures the result.
  const hz = c.createLinearGradient(0, 250, 0, 540);
  hz.addColorStop(0, 'rgba(5,9,14,0)'); hz.addColorStop(1, 'rgba(5,9,14,' + VISTA_SEAT + ')');
  c.fillStyle = hz; c.fillRect(0, 0, 960, 540);
  if (VISTA_VEIL > 0) { c.fillStyle = 'rgba(5,9,14,' + VISTA_VEIL + ')'; c.fillRect(0, 0, 960, 540); }
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
  if (drawZoneVista(P, zone, px, py)) { if (typeof drawGateDoors === 'function') drawGateDoors(P, 0); return; }
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
  // room edges ‚Äî and in a one-screen room it cannot move at all ‚Äî so every
  // parallax layer fed by the camera freezes exactly when she is nearest a
  // wall, then lurches when the camera unpins. Half of the travel the camera
  // refuses is handed to the background instead: mid-room in a wide room the
  // drift is zero (the camera is doing the work), and at the pinned ranges
  // the layers keep drifting with her at parallax fractions of half speed ‚Äî
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
}
// What a hazard rail is MADE OF, per kingdom. The machine is the same in every
// zone; the metal it was cast from, the livery painted on it and what has grown
// over it since are not. `dress` is the weathering pass drawn over the finished
// trench ‚Äî rime in the cold, growth in the hatchery, crystal in the seam.
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
      // INDOORS THE FLOOR IS THE ROOM'S, NOT THE KINGDOM'S ‚Äî see INDOOR_ART.
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
          // continuous ‚Äî the right property ‚Äî and also exactly periodic, which
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
        // floor ‚Äî the grammar harness measured it as an 800px ruled double
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
        // inside a few pixels ‚Äî the collision is still a square, and the art
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
      // renderer that drew the lip ‚Äî it runs for the rock and the fallback both
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
      // THE SIDES AND THE UNDERSIDE ‚Äî the half of the terrain that was never
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
            // and darken as it hangs ‚Äî the tip is furthest from the light
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
      // Outside the Foundry this is now a MACHINED TRENCH ‚Äî a recessed
      // channel with a live rail down it and hazard chevrons on the lip ‚Äî
      // and a bolted saw wheel patrols every run of it long enough to walk.
      // The trench is the track; the wheel is the danger, and it has to be
      // read and timed instead of merely avoided.
      //
      // In the Foundry there is no machine at all. The floor is simply open
      // to the melt, and the melt takes whatever falls in it ‚Äî hers or
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
        // a platform ‚Äî that is what a platform is ‚Äî and no amount of colour was
        // going to argue the player out of standing on it.
        //
        // Lava is a LIQUID and it is HOT, and the two things that say so are
        // motion and bloom. The surface is a moving wave rather than an edge,
        // the crust drifts along it instead of sitting in courses, bubbles rise
        // and burst, and the heat is thrown upward into the air above. The
        // straight line is gone entirely ‚Äî there is nothing left in it that
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
          // even spacing is a course of BRICKS ‚Äî which is precisely what made
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
        // the lip where the melt laps the rock ‚Äî traced along the SAME wave, so
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
        // frozen archive and a crystal seam ‚Äî construction-site livery in a
        // place that has never seen a construction site. It read as imported,
        // and anything that reads as imported reads as a game object rather
        // than a thing that lives there.
        //
        // Same machine everywhere, because it IS the same machine ‚Äî but built
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
        // THE BRITTLE STRETCH. Same rail, same teeth ‚Äî but the housing is
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
          // hatchery: the machine has been colonised ‚Äî moss in the seams and
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
      // around it, or it is not a secret ‚Äî it is a button. So this is cut from
      // the same slab as the wall, and betrays itself only twice: its grain does
      // not line up with the rock around it, and a hairline FRACTURE runs the
      // perimeter of the mass, broken the way a real seam is, with a little
      // spill of grit where it has been quietly settling.
      //
      // That tell is the same everywhere in the game. Learn it once on the rock
      // that opens the floor in Zone A, and from then on you read every wall in
      // the factory differently ‚Äî which is the whole point of teaching it.
      // ---------------------------------------------------------------------
      const rockB = (typeof isHero === 'function' && isHero()) ? null : rockTex(G.roomDef.zone);
      if (rockB) {
        // Same slab, deliberately sampled at a different offset. The joints in
        // the surrounding wall run continuously; the joints inside a loose mass
        // do not line up with them. That mismatch is the real tell ‚Äî it is a
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
      // individual tiles ‚Äî a boulder has one crack around it, not a grid of
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
          // the gap itself ‚Äî dark, because you are seeing past the stone
          c.strokeStyle = '#000'; c.globalAlpha = dk; c.lineWidth = taught ? 1.4 : 2;
          c.beginPath(); c.moveTo(px0, py0); c.lineTo(px1, py1); c.stroke();
          // and the lip the light catches on the near side of it, which is what
          // actually makes a crack read as a crack rather than a drawn line
          c.strokeStyle = P.edge; c.globalAlpha = lk; c.lineWidth = taught ? 0.8 : 1.2;
          c.beginPath(); c.moveTo(px0 + 0.9, py0 - 1.1); c.lineTo(px1 + 0.9, py1 - 1.1); c.stroke();
        }
      }
      c.globalAlpha = 1;
      // grit trickled out of the seam ‚Äî only along the bottom of the mass, and
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
// AUTHORED STRATA DECKS. The one-way platforms used to be flat two-tone bars ‚Äî
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
// decks draw per-frame ON TOP of it ‚Äî so the squarest thing on screen was
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
            // per-slice source jitter (¬ß10.7): two decks built from the same
            // slice of the same plate ARE each other, and the repeat detector
            // proved it ‚Äî every mid slice now samples a wandering window of
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
        // THE BITE ‚Äî and both long edges ride the low-frequency wave now,
        // not just per-spot nibbles: white-noise nibbles average back into
        // the straight line they were meant to break (the same measured
        // lesson as the crest ‚Äî see fbm1).
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
        // THE SKIRT (¬ß10.3), grown AFTER the bite so nothing erases it:
        // tags of the deck's own bottom material stretched down 3-16px (on
        // the ice plate those pixels are icicle; on fire, slag). A platform's
        // flat underside was the one ¬ß10.3 failure erosion could never fix,
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
// tile layer cache ‚Äî tiles are static per room, so render once and blit
let tileCv = null, tileDirty = true;
// THE CROSSING'S HELD FRAME. One canvas, reused: the picture she is leaving,
// kept for the third of a second it takes to slide off the edge she left by.
// Reused rather than allocated per crossing ‚Äî a full backbuffer copy every
// time she walks through a doorway is a garbage-collection pause in the one
// moment the game is asking to feel continuous.
const TRANS_DUR = 0.34;
let transSnap = null, transCv = null, transHeld = false;
// the erosion pass's read-only copy of the tile layer ‚Äî see erodeCaveEdges
let erodeSrc = null, erodeMask = null;
// Only within reach of an edge she can actually leave by ‚Äî so the cost is a
// second or two of blits before a doorway and nothing at all anywhere else.
function holdFrameNearExit() {
  transHeld = false;
  if (G.state !== 'PLAY' || G.trans || !player || !G.roomDef) return;
  const ex = G.roomDef.exits || {}, W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  const px = player.x + player.w / 2, py = player.y + player.h / 2;
  const near = (ex.L && px < 260) || (ex.R && px > W - 260) ||
               (ex.T && py < 240) || (ex.B && py > H - 240);
  if (!near) return;
  grabFrame();
  transHeld = true;
}
function grabFrame() {
  if (!transCv) transCv = document.createElement('canvas');
  if (transCv.width !== cv.width || transCv.height !== cv.height) {
    transCv.width = cv.width; transCv.height = cv.height;
  }
  const tc = transCv.getContext('2d');
  tc.setTransform(1, 0, 0, 1, 0, 0);
  tc.clearRect(0, 0, transCv.width, transCv.height);
  tc.drawImage(cv, 0, 0);
  return transCv;
}
// DO NOT BAKE A FLOOR YOU ARE ABOUT TO THROW AWAY.
//
// Baking the tile layer for a large room measures at about 940 ms, and the rock
// slab it is cut from is lazy like all art here. Bake first and the slab lands a
// moment later, the bake is discarded and paid for again: two seconds of stalled
// frames in the first three seconds of play. tests/memnote.cjs is what found it
// ‚Äî a stalled loop plays one note of a three-note trial ‚Äî and the frame counter
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

// The mid-tone lift on the plane she stands on. See the note at the end of
// renderTileLayer: the readability law is about the GAP between the playfield
// and the wall, and this game had been making the gap by darkening the wall.
let TERRAIN_GAMMA = 0.68;   // 0.74 until the painted-plate grade freed the bg: the playable plane keeps its 10-point clearance by rising, not by re-crushing the painting
function renderTileLayer(P) {
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  // THE CANVAS IS MADE FIRST, ALWAYS. The wait below returns without baking,
  // and the draw path composites this layer unconditionally ‚Äî returning before
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
  // in the tile GRID; this kills them in the tile FACES ‚Äî the owner's
  // report after the carve shipped was "still seeing straight lines walls
  // and floors!", and the ruler that remained was the edge of the tile art
  // itself. Cave rooms get an erosion pass over the finished layer: deep
  // hash-driven scallops bitten INTO every exposed face (tops, undersides,
  // and the vertical walls, which had never been touched), and lumps of the
  // rock's own texture pushed OUTWARD past the line. Runs once per room
  // render, on the cached canvas ‚Äî free at frame time.
  // ...and the pass is GLOBAL now. The owner's rule graduated from caves to
  // the whole game ‚Äî "no 90 degree elevation or walls in all game!!" ‚Äî so
  // every room's exposed tile faces get the erosion: scallops bitten into
  // tops, undersides and verticals, texture lumps pushed past the line. The
  // collision grid stays square; the SILHOUETTE never is.
  if (G.roomDef) erodeCaveEdges(tctx);
  // ART_BIBLE ¬ß10.3 ‚Äî THE THREE-PART EDGE, after the erosion and for a
  // different reason. Erosion answers "is the silhouette straight"; this
  // answers "is the edge BARE", which is the thing the reference actually
  // never ships. tests/grammar.cjs measured 12 of 12 long edges in this game
  // with neither a lit crest nor a broken underside ‚Äî a flat top and a flat
  // bottom, which is a rectangle however wobbly you make its outline.
  if (G.roomDef) organicSilhouettePass(tctx);
  if (G.roomDef) slabSilhouettePass(tctx);  // ¬ß10.3 ‚Äî the other three sides
  if (G.roomDef) surfaceCurvePass(tctx);   // ¬ß10.1 ‚Äî the surface stops being cells
  if (G.roomDef) edgeGrammarPass(tctx);
  // ¬ß9.1 ‚Äî and lift the whole plane. Pushing the background down is only half
  // of aerial perspective; measured after the background pass alone, B4's
  // terrain still sat 9 points off its backdrop where the law asks for 10.
  // A screen wash in the zone's light lifts the face without touching hue.
  {
    // INDOORS THE LIGHT IS THE ROOM'S ‚Äî see INDOOR_PAL. This wash is the last
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
  // THE PLAYABLE PLANE IS LIT, NOT THE BACKGROUND CRUSHED.
  //
  // ¬ß9.1 asks for ten points of luminance between the ground she stands on and
  // the wall behind it, and this game has been buying that gap by taking light
  // OUT of the background ‚Äî which is the whole of the owner's report. Measured:
  // the terrain plane itself sits at 23-31%, so the law forced the background
  // down to 13 in the darkest rooms, and no amount of tuning the background
  // could make the picture brighter without breaking the separation that makes
  // the game readable.
  //
  // Raising the FLOOR raises the ceiling. One gamma pass on the tile layer ‚Äî
  // built once per room, not per frame, so it costs nothing in the loop ‚Äî lifts
  // the plane the player reads and lets the background come up with it. The
  // separation is preserved because both move; the picture gets brighter
  // because both move UP.
  if (TERRAIN_GAMMA < 1) {
    try {
      const tx2 = tileCv.getContext('2d', { willReadFrequently: true });
      const lut = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) lut[i] = 255 * Math.pow(i / 255, TERRAIN_GAMMA);
      const id = tx2.getImageData(0, 0, tileCv.width, tileCv.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;                       // holes stay holes
        d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]];
      }
      tx2.putImageData(id, 0, 0);
    } catch (e) {}
  }
  tileDirty = false;
}
// 1D fractal value noise (fBm) on the hash2 lattice: three octaves of
// smoothly interpolated values. This exists because of a measured lesson ‚Äî
// the crest below first varied its height with PER-PIXEL hash noise, and the
// grammar harness still caught the crest-to-face boundary as a ruled line
// hundreds of px long. White noise has a flat mean: jitter every pixel ¬±3px
// and the STATISTICAL edge is still exactly straight, and so is what the eye
// reads at a glance. What breaks a line is low-frequency wander ‚Äî swells over
// tens of px with detail on top ‚Äî which is fBm (the construction every noise
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
  // and a wave that mostly whispers ¬±1px of its mean is a ruler with fuzz ‚Äî
  // the same measured failure the per-pixel hash had. Stretch √ó2.1 about the
  // centre so the output genuinely visits its whole range, clamped.
  const q = (v / tot - 0.5) * 2.1 + 0.5;
  return q < 0 ? 0 : q > 1 ? 1 : q;
}
// The lip and the skirt. Runs once per room render on the cached layer, so it
// costs nothing at frame time ‚Äî the same deal erodeCaveEdges takes.
//
// Both colours are SAMPLED from the tile face rather than chosen, because this
// pass has to work over every zone's material and over authored tile art it
// has never seen. Lighten what is there for the crest, darken it for the
// hang; the material stays whatever the room said it was.
// ART_BIBLE ¬ß10.1 ‚Äî THE VISUAL MESH. erodeCaveEdges bites scallops out of the
// raster edge; this replaces the tile's OUTLINE with a curved polygon, which is
// the difference between a wobbly rectangle and a shape that was never square.
//
// IT ERASES ONLY INSIDE EACH TILE'S OWN RECT, and that bound is the entire
// design rather than a detail. The first attempt built one path over every
// solid tile and applied destination-in to the finished layer ‚Äî which keeps the
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
// tileDirty ‚Äî so anything seeded on time or Math.random would give a room
// different edges on every render.
// ART_BIBLE ¬ß10.1 ‚Äî THE SURFACE CURVE. This is the piece that was missing, and
// its absence is why every previous pass decorated a staircase instead of
// removing one.
//
// The unit stops being the cell. One continuous polyline is computed across the
// whole room at sub-tile resolution, the grid's 32px steps are RAMPED rather
// than stepped, and noise is added at an amplitude LARGER THAN A TILE IS TALL.
// The old pass bounded every vertex inside its own tile rect and moved it
// inward only ‚Äî a safety rule adopted after an earlier attempt erased the room,
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
  // a brittle tile she has cut is air to the curve too ‚Äî the grid keeps its
  // 'B', the save keeps the cut, and a curve that read only the grid stood
  // her on the hole (the camp's cellar hatch, tests/secrets.cjs)
  const broken = (G.save && G.save.broken) || {};
  const solidAt = (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= Wt || ty >= Ht) return false;
    const ch = g[ty][tx];
    if (ch === 'B' && broken[G.roomId + ':' + tx + ',' + ty]) return false;
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
  // duly built the ramp as material ‚Äî two solid legs sloping from the deck's
  // ends down to the floor, with an untouched rectangle of backdrop between
  // them. A table. It is in no collision grid, she walks straight through it,
  // and its inner faces are the straightest verticals in the room.
  //
  // A platform counts as this column's surface only when it is a LIP ON THE
  // TERRAIN ‚Äî ground within a tile underneath it ‚Äî which is the case the
  // 'soft' branch below was written for. A deck in mid-air is drawn by
  // drawPlatformRuns, which owns its own crest and skirt; the ground curve
  // walks underneath it and never sees it.
  const surfaceOf = (tx) => {
    // A cave's hidden pocket is a ceiling object, not a hill. Scanning from
    // above chose the pocket's bottom after entering its hollow centre and
    // extruded a floor ramp up to it, sealing the passage underneath. Only
    // the bottom-connected rock owns the cave heightfield; suspended rock
    // and its breakable hatch retain their ordinary tile collision.
    if (G.roomDef && G.roomDef.cave) {
      let ty = Ht - 1;
      if (!solidAt(tx, ty)) return null;
      while (ty > 0 && solidAt(tx, ty - 1)) ty--;
      if (ty === 0) return null; // a closed boundary is a wall, not ground
      if (platAt(tx, ty - 1)) return { ty: ty - 1, soft: 1 };
      if (ty > 1 && platAt(tx, ty - 2)) return { ty: ty - 2, soft: 1 };
      return { ty, soft: 0 };
    }
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

  // Owner (2026-09-11): "the terrain is too bumpy, when I asked for texture I
  // didn't mean to make it up and down everywhere." At 26 the two-octave rise
  // below (amp + amp*0.45) peaks near 38px ‚Äî more than a full 32px tile of
  // continuous elevation change on ordinary ground, everywhere, all the time.
  // That reads as terrain, not texture. 10 peaks near 14.5px: still organic,
  // still no straight line (NO RIGHT ANGLES), but a surface ripple rather than
  // a mountain range she has to keep climbing.
  const AMP = 18;
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
    // it away ‚Äî the surface came out deviating 8px on average, barely more than
    // the per-cell inset this whole pass exists to replace. Riding ABOVE the
    // grid line costs nothing and can never remove ground she stands on, so the
    // grid becomes the FLOOR of the range rather than its centre.
    const rise = fbm(x * 0.55) * amp + fbm(x * 1.9 + 7) * amp * 0.45;
    let y = N2[i] - rise;
    // FRACTURES. Smooth noise reads as landscape; this world is a fallen city,
    // so the curve carries occasional hard breaks ‚Äî a slab dropped a few px
    // against its neighbour ‚Äî instead of only rolling.
    //
    // Scaled with AMP (owner, 2026-09-11, same pass): this was a flat ¬±8px
    // regardless of AMP, so cutting AMP 26->18 for "texture, not elevation"
    // left the one genuinely hard edge in the curve exactly as large as
    // before ‚Äî now a proportionally BIGGER share of the room's relief than
    // the organic rolling around it was tuned to absorb. Measured effect:
    // tests/terrainrun.cjs's C2 stall (rise 0px reported at the moment she
    // stopped, meaning something not caught by the raw-tile riseAhead scan)
    // went from 0/6 clean runs at AMP=26 to ~5/6 failing at AMP=18 with the
    // fracture left unscaled. Tying it to the same AMP the rest of the pass
    // answers to keeps the ratio the fracture was originally tuned against.
    const fseed = Math.floor(x * 0.7);
    if (h1(fseed * 3.7) > 0.72) y += (h1(fseed * 9.1) - 0.5) * 16 * (AMP / 26);
    // ADD FREELY, CUT CONSERVATIVELY ‚Äî and this asymmetry is the whole rule.
    // Smoothing a one-tile step produces a ramp that lies BELOW the platform's
    // own top for most of its length, and cutting to that ramp erased 40px of
    // real platform: the mound came out as a hollow arch. Rising above the grid
    // invents new material and is free; falling below destroys material she is
    // meant to stand on, so it is capped at a few px of erosion.
    // CLAMP AGAINST THE SMOOTHED PROFILE, NEVER THE RAW GRID. Clamping to
    // raw[i] re-quantised the curve onto the staircase it had just finished
    // ramping: raw jumps a full tile between adjacent columns at a step, so a
    // ¬±6px cut cap measured against it forces the surface back into a square
    // shoulder. The floor rolled everywhere except at steps ‚Äî the one place it
    // matters. N2 is the ramped profile, so bounding deviation against it keeps
    // the ramp and still stops the surface sinking away from her feet.
    // ...but a PLATFORM clamps against its own raw top, not the ramp. Ground
    // and platforms want opposite things here: ground should ramp through its
    // steps, while a platform has a defined top the player reads as "jump onto"
    // ‚Äî clamping it to the ramp too dissolved it into a dome and quietly
    // changed what the level was asking of her.
    const t = soft[i] ? raw[i] : N2[i];
    if (!isNaN(t)) y = Math.max(t - (soft[i] ? 14 : 46), Math.min(y, t + 8));
    out[i] = y;
  }
  // THE PASS AND THE COLLIDER MUST BOTH MEASURE AGAINST THE SURFACE THIS CURVE
  // WAS BUILT FROM. surfaceCurvePass used to recompute its own 'top' with a
  // different definition of solid, so the two disagreed about every platform in
  // the game and the sign of their difference ‚Äî add material or cut it ‚Äî was
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
// underside ‚Äî a rolling top edge on a box is still a box.
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
// where it sits ABOVE the tile top ‚Äî real material was added there, so standing
// on it is standing on something that exists. Where the curve dips below the
// tile the collider still wins, because letting a body sink into drawn ground
// is how a floor stops being trustworthy.
// Returns [surfaceY, tileTopY] for a column, or null. Both are needed: the
// surface is where she stands, the tile top is the proof that something solid
// is under it. Testing for solid material half a tile BELOW the surface ‚Äî the
// first version ‚Äî fails on exactly the terrain this exists for, because half a
// tile below a 46px mound is still air, so she only ever got 16px of the lift.
function groundColumnAt(worldX) {
  const cur = (typeof surfaceCurve === 'function') ? surfaceCurve() : null;
  if (!cur) return null;
  // CLAMP, DO NOT REFUSE ‚Äî and this was the intermittent skip.
  //
  // The curve holds N samples spaced SURF_STEP apart, so it describes
  // x = 0 .. (N-1)*SURF_STEP. A room 32 tiles wide is 1024 px and its last
  // sample sits at 1020, so for the final three pixels of EVERY room this
  // returned null: the ground snap had nothing to hold her with and she fell
  // through a floor that was plainly there ‚Äî measured at x 1023 with solid tile
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
        // rather than merely wobbling ‚Äî a uniform fringe is another ruler
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
  // plus a full-canvas draw on every room render, and tests/tutor.cjs ‚Äî which
  // walks the whole opening under a time budget ‚Äî failed only when the suite
  // was running everything else alongside it, three times for three alone.
  // That is the signature of a load-sensitive cost, not a broken step.
  if (!surfSnapCv) surfSnapCv = document.createElement('canvas');
  if (surfSnapCv.width !== W || surfSnapCv.height !== H) { surfSnapCv.width = W; surfSnapCv.height = H; }
  const surfSnap = surfSnapCv;
  const surfSnapCtx = surfSnap.getContext('2d', { willReadFrequently: true });
  surfSnapCtx.clearRect(0, 0, W, H);
  surfSnapCtx.drawImage(tileCv, 0, 0);

  // the grid's own surface height per sample ‚Äî taken FROM the curve, which
  // computed it, so the two can never drift apart again
  const top = cur.top;

  // Walk the samples in runs of the same SIGN ‚Äî curve above the grid, or below ‚Äî
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
  // exposed tile ‚Äî the walking surface. Filling only as far as the tile line
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
      // ‚Äî so the fill is the mechanism; and painting the band in palette
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
        // out pale ‚Äî a bright shelf instead of an invisible join.
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
      // ‚Äî it can never mismatch the tone ‚Äî but a band of one flat colour reads
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
      // a touch of depth so the added mass is not a flat plate of one colour ‚Äî
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
  // kingdom's own colour ‚Äî traced, continuous, and the single most visible
  // reason the den read as the field outside it. A floor still needs an edge,
  // so it keeps one, in the room's own material and quietly.
  const ik2 = (typeof indoorKey === 'function') && indoorKey();
  const IP = ik2 && (INDOOR_PAL[ik2] || INDOOR_PAL.floorDen);
  strokeCurve(IP ? IP.join : P.dark, 7, 6, IP ? 0.26 : 0.34);   // the shadow step
  strokeCurve(IP ? IP.lit : G.roomDef.cave ? '#c5bcb0' : P.edge, 2, 1, IP ? 0.40 : 0.8);
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
  // not a lighting problem ‚Äî the surface LINE is flat, and no crest fixes that.
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
        // find the true top of the drawn material in this column ‚Äî erosion has
        // already moved it off the tile line, and a crest painted on the tile
        // line instead of on the ROCK is exactly the pasted-on look we are
        // removing.
        // START ABOVE THE ROLL, not above the tile line. This search used to
        // begin 6px up, which was generous when the only thing above the line
        // was an erosion lump ‚Äî and wrong the moment the surface roll began
        // lifting ground by up to ~13px. On a raised column the walk found
        // rock at once and painted the crest six pixels INSIDE the mass,
        // where nothing can see it: the grammar harness read those stretches
        // as ground with no lit lip, and it was right. 28px clears the
        // deepest roll any kingdom asks for.
        let Y = y0 - 28;
        while (Y < y0 + TILE && (px(X, Math.max(0, Y))[3] < 40)) Y++;
        if (Y >= y0 + TILE) continue;
        const [r, gg, b] = px(X, Math.min(Ht * TILE - 1, Y + 3));
        // ¬ß10.3 asks for irregular ‚Äî and irregular means fBm, not per-pixel
        // hash: the harness measured the old per-pixel crest's lower boundary
        // as a ruled line, because white noise averages straight. The crest
        // now swells 2-9px on low-frequency wander with a ¬±1px chip on top,
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
        // material that is already near-white ‚Äî D3's ice floor clamped at 255
        // and the edge stayed invisible. A lit lip is a STEP, so the band just
        // beneath it is pushed down; that reads as an edge at any base value,
        // and it is what the eye actually uses to find the top of a solid.
        // ...and the step is DEEPER the brighter the material, because on a
        // near-white face the lift has nowhere to go. The Archives' ice floor
        // clamps at 255, so a fixed 30% shadow left one stretch of ground in
        // three frames with no readable crest at all (grammar: "129px@y479
        // NO-LIP"). The darkening now scales with the crest's own luminance ‚Äî
        // dark rock keeps its gentle 30%, white ice gets up to 48% ‚Äî so the
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
          if (d[gi + 3] >= 40) continue;          // air only ‚Äî never over rock
          d[gi]     = Math.min(255, Math.round(r * 0.7) + 70);
          d[gi + 1] = Math.min(255, Math.round(gg * 0.7) + 70);
          d[gi + 2] = Math.min(255, Math.round(b * 0.7) + 62);
          d[gi + 3] = Math.max(d[gi + 3], k === 1 ? 88 : 44);
        }
        // WHAT GROWS ON THIS KINGDOM'S CREST. The signature the player reads
        // at eye level while walking: crystal teeth in the catacombs, molten
        // seams in the Foundry, icicles in the Archives, a breathing red in
        // the Deep. Hashed, never random ‚Äî this is baked into the cached
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
        // strands of varying length ‚Äî ¬ß10.3 wants 8-24px, and wants it broken,
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
  // ---- 3. THE ANTI-TILING PASS (¬ß10.7) ------------------------------------
  // B4 and C3 autocorrelated at exactly 32px ‚Äî the tile pitch ‚Äî which is the
  // signature of every tile drawing itself identically. ¬ß10.7 asks for four
  // variants, random flips and decals; all three are ways of saying "make the
  // pitch stop being findable", and per-tile variation does it without needing
  // four hand-authored sheets for a renderer that is procedural anyway.
  //
  // Deliberately subtle. This runs over the finished face, so a heavy hand
  // reads as dirt rather than as material ‚Äî the target is to break the
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
      // same crack every time the room renders ‚Äî the spec's Math.random()
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
      // ...and a decal on some tiles ‚Äî ¬ß10.7 wants 20-40% density
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

  // ---- 3. THE WALL EDGE: the same grammar, rotated 90¬∞ ---------------------
  // The harness found the room-border walls as bare vertical rules hundreds
  // of px tall ‚Äî the lip/skirt passes only ever looked at tops and bottoms.
  // A vertical exposed face gets a narrow lit edge whose depth wanders on the
  // same fBm the crest uses, so neither the face line nor its lit band is
  // straight. Left faces are lit, right faces get the dark version ‚Äî one
  // world light direction, per the sacred-ground-plane law.
  for (let ty = 0; ty < Ht; ty++) {
    for (let tx = 0; tx < Wt; tx++) {
      if (!solid(tx, ty)) continue;
      for (const [side, lit] of [[-1, true], [1, false]]) {
        if (solid(tx + side, ty)) continue;
        const xf = side < 0 ? tx * TILE : tx * TILE + TILE - 1;
        const inward = -side;                     // from the air into the rock
        for (let Y = ty * TILE; Y < ty * TILE + TILE; Y++) {
          // walk in from 6px out in the air to the drawn material ‚Äî erosion
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
  // NEVER READ THE CANVAS YOU ARE DRAWING ON. The outward lumps below copy a
  // patch of a tile's own face and shove it past the line ‚Äî and they used to
  // copy it out of tileCv, which is the very canvas being drawn to. A browser
  // cannot alias a canvas with itself, so every one of those calls snapshots
  // the WHOLE source: the cost of one seven-pixel lump is the area of the
  // room. Measured with tools/bakecost.cjs: the bake was 716 ms for an
  // ordinary 32x17 room and TWENTY-ONE SECONDS for a three-by-two-screen one,
  // and 94-99.7% of it was this function ‚Äî the tile draw itself is 47 ms and
  // barely moves with room size. One copy up front, thousands of reads from
  // it, and room size stops being a rendering decision. That is what the
  // owner's "one big room... actual world connected" needs underneath it.
  if (!erodeSrc) erodeSrc = document.createElement('canvas');
  if (erodeSrc.width !== tileCv.width || erodeSrc.height !== tileCv.height) {
    erodeSrc.width = tileCv.width; erodeSrc.height = tileCv.height;
  }
  const esx = erodeSrc.getContext('2d');
  esx.clearRect(0, 0, erodeSrc.width, erodeSrc.height);
  esx.drawImage(tileCv, 0, 0);
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
          if (ed === 'T') x.drawImage(erodeSrc, X + u, Y + 2, lw, lh, X + u - 1, Y - lh + 2, lw, lh);
          if (ed === 'B') x.drawImage(erodeSrc, X + u, Y + TILE - 2 - lh, lw, lh, X + u + 1, Y + TILE - 2, lw, lh);
          if (ed === 'L') x.drawImage(erodeSrc, X + 2, Y + u, lh, lw, X - lh + 2, Y + u + 1, lh, lw);
          if (ed === 'R') x.drawImage(erodeSrc, X + TILE - 2 - lh, Y + u, lh, lw, X + TILE - 2, Y + u - 1, lh, lw);
        } catch (e) {}
      }
    }
  }
  // ...AND ONE DESTINATION-OUT, NOT TEN THOUSAND. Every scallop and every
  // two-pixel wave step used to erase straight into the tile layer under a
  // destination-out composite, and a compositing erase is not clipped to the
  // shape it draws the way an ordinary fill is ‚Äî each one costs the layer.
  // That, not the lumps, was the room-size ceiling: 618 ms of erosion on an
  // ordinary room and eighteen seconds on a three-by-two-screen one. The bites
  // are painted into a MASK with a plain fill ‚Äî cheap, and exactly the same
  // union, because every one of them is opaque ‚Äî and the mask is taken out of
  // the layer once at the end.
  if (!erodeMask) erodeMask = document.createElement('canvas');
  if (erodeMask.width !== tileCv.width || erodeMask.height !== tileCv.height) {
    erodeMask.width = tileCv.width; erodeMask.height = tileCv.height;
  }
  const xReal = x;
  x = erodeMask.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, erodeMask.width, erodeMask.height);
  x.globalCompositeOperation = 'source-over';
  x.fillStyle = '#000';
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
    // THE LOW-FREQUENCY WAVE ‚Äî ¬ß10.1's "4-12px rougher", finally measured in.
    // Scallops and lumps roughen the line LOCALLY, but their mean stays on
    // the tile line, so a long floor still reads ‚Äî and the grammar harness
    // still measures ‚Äî as a rule with fuzz on it. A slow fBm wave now sinks
    // the whole silhouette 0-10px on ~30-140px wavelengths (the technique
    // every terrain-noise source reduces to: low-frequency swell, detail on
    // top ‚Äî docs/TERRAIN_SOURCES.md). The crest pass walks down to whatever
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
          const dep = fb◊m˘”FÚµÎ(ö+my◊G&Á6∆FRÜ7É"≤%r“#"¬wí“$Ç≤3ì≤2Á&˜FFRá7r≤„Bì∞¢2Á7G&ˆ∂U7Gñ∆R“r3#3Cs≤2Ê∆ñÊUvñGFÇ“„c∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ¬”íì≤2ÁVG&Fñ47W'fUFÚÉ2¬”B¬¬ì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r3S#S3Rs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”b¬ì≤2ÁVG&Fñ47W'fUFÚÉ¬”b¬b¬ì∞¢2ÁVG&Fñ47W'fUFÚÉ¬"„R¬”b¬ì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢6ˆÁ7B«“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚìí¢„#∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉSí√#3"√#SR¬r≤«≤rís∞¢2Á6ÜF˜t6ˆ∆˜"“r3ñfSÜfbs≤2Á6ÜF˜t&«W"“s∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÉ¬„b¬2„B¬„Ç¬¬¬rì≤2Êfñ∆¬Çì≤2Á6ÜF˜t&«W"“∞¢2Á&W7F˜&RÇì∞¢2Á&W7F˜&RÇì∞ß–¢ÚÚDÑRÂî’Çu2ÑÙƒƒırÜ∂ñÊvFˆ“Rì¢FÜRFWFÇFˆ˜"ñÁFÚ«V÷V‚w2FV‚ˆfbS‡¢ÚÚ'Vñ«Bg&ˆ“FÜRÊW7B&6∂G&˜w2˜v‚gW&ÊóGW&RW"FÜR÷ñ÷ñ2'V∆R(	BFÜP¢ÚÚ&6∂G&˜w&˜w2Fó77VR÷ˆb÷6&∆R6ˆ«V÷Á2ÊBV«6ñÊrñÊfV7Fñˆ‚fVñÁ2¬6ÚFÜP¢ÚÚFˆ˜"ó2'W'7B4Ù4ÙÙ‚’ÙBv˜fV‚ˆbFVB6&∆R◊7G&ÊG2¬6«VÊr∆˜r&WGvVV‡¢ÚÚGvÚˆbFÜ˜6R6ˆ«V÷Á2∆VÊñÊrFˆvWFÜW"‚FÜRfñgFÇ6á&ñÊR∂VW2fñgFÄ¢ÚÚ6ñ∆Ü˜VWGFRÜ∂ñ˜6≤6Ê˜í¬6&∆R7vr¬VVÊ6ÇÜˆˆB¬∆VÊñÊr7F6∑2‚‚‚Ê@¢ÚÚÊ˜rÜÊvñÊrFV&G&˜ˆBí¬ÊBóG2˜v‚∆ñváC¢FÜR7∆óB'&VFÜW2«V÷V‚w0¢ÚÚƒTb‘u$TT‚Ç3vFfcñ¬¶ˆÊRRw263"(	B‰ıB&F6ÜWBw2∆◊÷&W"¬Ê˜BFÜP¢ÚÚ˜&6∆Rw25%B&«VR¬Ê˜BFÜRFñÊ∂W"w2÷ˆ«FV‚˜&ÊvR¬Ê˜BFÜR&6Üófó7Bw0¢ÚÚ∆Rñ6Rí‚&˜VÊBFÜR÷˜WFÇFÜRñÊfV7Fñˆ‚fVñÁ2'V‚u$Uí(	BÜW"v∆˜r∂VW0¢ÚÚFÜó2ˆÊRˆ6∂WBˆbFÜRÊW7B6∆V‚¬vÜñ6Çó2FÜR7F˜'íFÜR7G'V7GW&RFV∆«0¢ÚÚ&Vf˜&R6ÜR6ó2v˜&B‚Ê˜FÜñÊr«V÷"¬Ê˜FÜñÊr7V&RÑ‰Ú$îtÖB‰tƒU2í‡¢ÚÚ&ˆ6VGW&¬5D‰B‘î‚vóFñÊróG2fó&VB∆FRÑ%EıTUTR*s&Ú¬Üˆ∆∆˜tg&ˆÁBì†¢ÚÚFÜR÷VFñfWF6ÇÜˆˆ≤&V∆˜rvˆW2∆ófRFÜR6ˆ÷÷óBFÜR∆FRÊBóG2÷VFñÊß0¢ÚÚVÁG'í∆ÊB¬WÜ7F«í∆ñ∂RóG2f˜W"6ñ&∆ñÊw2r‡¶gVÊ7Fñˆ‚G&t«V÷V‰Üˆ∆∆˜rÜ7É"¬wí¬¬≤í∞¢ñbáGóVˆb÷VFñfWF6Ç””“vgVÊ7Fñˆ‚rí÷VFñfWF6ÇÇvÜˆ∆∆˜tg&ˆÁBrì∞¢6ˆÁ7B&ñ““GóVˆb‘TDîÙî‘r”“wVÊFVfñÊVBrbb‘TDîÙî‘rÊÜˆ∆∆˜tg&ˆÁC∞¢ñbÜ&ñ“bb&ñ“ÊÊGW&≈vñGFÇí∞¢6ˆÁ7BFÇ“#3b¬Gr“FÇ¢Ü&ñ“ÊÊGW&≈vñGFÇÚ&ñ“ÊÊGW&ƒÜVñváBì∞¢2Á6fRÇì∞¢ÚÚDÑRîÂDTBDÙı"ƒ‰E2Ù‚DÑR5D‰B5ıB¬Ê˜BFÜR∆FRw2÷ñFF∆R‚7É"ó0¢ÚÚvÜW&RFÜRF&∆R6ó2FÜRFˆ˜"ó2(	BvÜW&RFÜR&ˆ◊BG&w2¬vÜW&RFÜRv∆∞¢ÚÚñ◊2¬vÜW&R6ÜRVÊG2W(	B6ÚFÜRñ7GW&Ró2ˆfg6WBFÚWBóG2˜v‚˜VÊñÊp¢ÚÚFÜW&R¬&FÜW"FÜ‚FÜR7FÊB7˜B&VñÊr&VÁBFÚ÷F6ÇñÁFñÊr‚ˆÊP¢ÚÚ6˜W&6RˆbG'WFÇf˜"'vÜW&RFÜRFˆ˜"ó2"¬ÊBóB7Fó2G'VRf˜"FÜRÊWá@¢ÚÚ∆FRFÜR'B6W76ñˆ‚fó&W2‚óB«6ÚWG2FÜó27G'V7GW&Rw2V÷&W"&6≤î‡¢ÚÚFÜRFˆ˜'vì¢FÜRv∆˜ró2G&v‚B7É"ÊBv2'W&ÊñÊrˆ‚FÜRv∆¬&W6ñFP¢ÚÚFÜRvíñ‚‡¢6ˆÁ7BF7Ç“7É"“Gr¢á∆FTFˆ˜$g&2Ü&ñ“¬vÜˆ∆∆˜tg&ˆÁBrí“„Rì∞¢2ÊG&tñ÷vRÜ&ñ“¬F7Ç“GrÚ"¬wí“FÇ¬Gr¬FÇì∞¢ñbÜ≤‚„"í∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7Bv¬“2Ê7&VFU&Fñƒw&FñVÁBÜ7É"¬wí“FÇ¢„3R¬b¬7É"¬wí“FÇ¢„3R¬Gr¢É„2≤≤¢„Bíì∞¢v¬ÊFD6ˆ∆˜%7F˜É¬w&v&É#R√#SR√SB¬r≤É„b¢≤≤„rí≤rírì∞¢v¬ÊFD6ˆ∆˜%7F˜É¬w&v&É#R√#SR√SB√írì∞¢2Êfñ∆≈7Gñ∆R“v√∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ7É"¬wí“FÇ¢„3R¬Gr¢É„2≤≤¢„Bí¬FÇ¢„C"¬¬¬rì≤2Êfñ∆¬Çì∞¢–¢2Á&W7F˜&RÇì∞¢&WGW&„∞¢–¢6ˆÁ7B%r“SÇ¬$Ç“3#∞¢6ˆÁ7BB“W&f˜&÷Ê6RÊÊ˜rÇì∞¢2Á6fRÇì∞¢ÚÚFÜR&6≤6á&˜VB(	BFVWÊW7Bfñˆ∆WB¬F∆∆W7BvÜW&RFÜRGvÚ6ˆ«V÷Á2÷VW@¢2Êfñ∆≈7Gñ∆R“r3c#s∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜ7É"“%r“"¬wíì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"“%r¢„b¬wí“$Ç¢„í¬7É"“%r¢„"¬wí“$Ç“bì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤%r¢„2¬wí“$Ç“"¬7É"≤%r¢„R¬wí“$Ç¢„Çì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤%r≤B¬wí“$Ç¢„2¬7É"≤%r≤¬wíì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÚÚFÜRGvÚFó77VR6ˆ«V÷Á2¬∆VÊñÊrFˆvWFÜW"(	BFÜR&6∂G&˜w2˜v‚6&∆P¢ÚÚFó77VR¬'&VFÜñÊrfW'í6∆˜v«í¬V6Ç7G&ÊB6∆ñváF«íFñffW&VÁB6p¢f˜"Ü6ˆÁ7B2ˆb≤”¬“í∞¢6ˆÁ7B∆V‚“÷FÇÁ6ñ‚áBÚ#C≤2í¢#∞¢f˜"Ü∆WBí“≤í¬3≤í≤≤í∞¢6ˆÁ7B'Ç“7É"≤2¢Ñ%r“b“í¢íì∞¢2Êfñ∆≈7Gñ∆R“íR"Úr3&#Cr¢r333Fs∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜ'Ç“R¬wíì∞¢2ÁVG&Fñ47W'fUFÚÜ'Ç“Ç≤∆V‚≤2¢”¬wí“$Ç¢„SR¬'Ç≤2¢”b≤∆V‚¬wí“$Ç“Bì∞¢2Ê∆ñÊUFÚÜ'Ç≤2¢”≤∆V‚¬wí“$Ç“"ì∞¢2ÁVG&Fñ47W'fUFÚÜ'Ç≤2≤∆V‚≤2¢”Ç¬wí“$Ç¢„R¬'Ç≤b¬wíì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢–¢–¢ÚÚFÜRñÊfV7Fñˆ‚fVñÁ2ˆ‚FÜR6ˆ«V÷Á3¢∆ófRÊB6ˆ∆˜&VBBFÜRVFvW2ˆ`¢ÚÚFÜR7G'V7GW&R¬fFñÊrFÚDTBu$Uí2FÜWíÊV"FÜR÷˜WFÇ(	BÜW"∆ñvá@¢ÚÚó2váê¢f˜"Ü6ˆÁ7B2ˆb≤”¬“í∞¢f˜"Ü∆WBí“≤í¬#≤í≤≤í∞¢6ˆÁ7BgÇ“7É"≤2¢Ñ%r“B“í¢2ì∞¢6ˆÁ7BV«6R“Ñ÷FÇÁ6ñ‚áBÚS≤í¢„2≤2í≤íÚ#∞¢6ˆÁ7BÊV"““í¢„S≤ÚÚñÊÊW"fVñÁ2&RÊV&W"ÜW ¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Êv∆ˆ&ƒ«Ü“É„≤V«6R¢„#Bí¢É“ÊV"¢„SRì∞¢2Á7G&ˆ∂U7Gñ∆R“íR"Úr6fcFcfBr¢r6SVfbs∞¢2Ê∆ñÊUvñGFÇ“„c∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚágÇ¬wí“$Ç¢„ìRì∞¢f˜"Ü∆WBí“wí“$Ç¢„É≤í¬wì≤í≥“#bê¢2Ê∆ñÊUFÚágÇ≤÷FÇÁ6ñ‚áíÚ#"≤í≤2í¢R“2¢Üwí“íí¢„B¬íì∞¢2Á7G&ˆ∂RÇì≤2Á&W7F˜&RÇì∞¢ÚÚFÜRw&Wí&V÷ñÊFW"ÊV"FÜR÷˜WFÉ¢FÜR6÷RfVñ‚¬VñWFV@¢2Êv∆ˆ&ƒ«Ü“„3∞¢2Á7G&ˆ∂U7Gñ∆R“r3FCS"s≤2Ê∆ñÊUvñGFÇ“„#∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚágÇ“2¢Ç¬wí“$Ç¢„Rì∞¢2ÁVG&Fñ47W'fUFÚágÇ“2¢B¬wí“$Ç¢„#R¬gÇ“2¢"¬wíì∞¢2Á7G&ˆ∂RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢–¢–¢ÚÚDÑRÙC¢'W'7B6ˆ6ˆˆ‚6«VÊr&WGvVV‚FÜR6ˆ«V÷Á2(	Bv˜fV‚FV&G&˜¿¢ÚÚvñFW"∆˜r¬óG2vÜˆ∆R˜WF∆ñÊR'Vñ«Bˆb7G&ÊB7W'fW2‚óB7vó2Üó"‡¢6ˆÁ7B7ví“÷FÇÁ6ñ‚áBÚìí¢„c∞¢2Á6fRÇì≤2ÁG&Á6∆FRá7ví¬ì∞¢2Êfñ∆≈7Gñ∆R“r3#C33"s∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜ7É"“Ç¬wí“$Ç≤"ì≤ÚÚFÜRÜÊvñÊrˆñÁ@¢2ÁVG&Fñ47W'fUFÚÜ7É"“%r¢„sÇ¬wí“$Ç¢„c"¬7É"“%r¢„b¬wí“$Ç¢„#Bì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"“%r¢„R¬wí“"¬7É"“%r¢„b¬wíì∞¢2Ê∆ñÊUFÚÜ7É"≤%r¢„"¬wíì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤%r¢„Sb¬wí“B¬7É"≤%r¢„b¬wí“$Ç¢„2ì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤%r¢„cb¬wí“$Ç¢„cb¬7É"≤"¬wí“$Ç≤"ì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÚÚFÜRvVfS¢7G&ÊB6˜W'6W2fˆ∆∆˜vñÊrFÜRˆBw2&V∆«í¬V6Ç6vvñÊróG0¢ÚÚ˜v‚÷˜VÁB(	B&6∂WG'í¬ÊWfW"∆FÜR◊v˜&∞¢2Á7G&ˆ∂U7Gñ∆R“r36#Ss≤2Ê∆ñÊUvñGFÇ“#≤2Ê∆ñÊT6“w&˜VÊBs∞¢f˜"Ü∆WBí“≤í¬c≤í≤≤í∞¢6ˆÁ7Bwí“wí“$Ç¢„É"≤í¢Ñ$Ç¢„2ì∞¢6ˆÁ7Bwr“%r¢É„3b≤í¢„Rí¢Üí””“RÚ„í¢ì∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜ7É"“wr¬wí≤÷FÇÁ6ñ‚Üí¢"„í¢2ì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤ÜíR"ÚB¢”Rí¬wí≤r≤ÜíR2í¢"¬7É"≤wr¬wí≤÷FÇÁ6ñ‚Üí¢2„2í¢2ì∞¢2Á7G&ˆ∂RÇì∞¢–¢ÚÚDÑR5ƒïC¢FÜR'W'7BFÜB÷FRóBFˆ˜'ví(	B‚ˆfb÷6VÁG&RFV"¿¢ÚÚ'&VFÜñÊr«V÷V‚w2∆Vb÷w&VV‚g&ˆ“ñÁ6ñFP¢6ˆÁ7BFˆ˜$Ç“$Ç¢„s#∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7B'&VFÜR“÷FÇÁ6ñ‚áBÚSí¢„C∞¢6ˆÁ7Bv¬“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬wí“Fˆ˜$Ç¬¬wíì∞¢v¬ÊFD6ˆ∆˜%7F˜É¬w&v&É#R√#SR√SB¬r≤É„Ç≤≤¢„B≤'&VFÜRí≤rírì∞¢v¬ÊFD6ˆ∆˜%7F˜É¬w&v&É#√#SR√##"¬r≤É„B≤≤¢„R≤'&VFÜRí≤rírì∞¢2Êfñ∆≈7Gñ∆R“v√∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜ7É"“R¬wíì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"“#"¬wí“Fˆ˜$Ç¢„R¬7É"“B¬wí“Fˆ˜$Çì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤2¬wí“Fˆ˜$Ç¢„s"¬7É"≤í¬wí“Fˆ˜$Ç¢„C"ì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤#"¬wí“Fˆ˜$Ç¢„"¬7É"≤b¬wíì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÚÚÜW"÷˜FW2G&ñgFñÊrıUBFÜR∆ñváB(	BFÜR6÷Rw&VV‚7&∑26ÜR6ÜVG2ñ‡¢ÚÚW'6ˆ‚á6VRFÜR«V÷V‚Â2G&rí(	B÷˜&RFÜRÊV&W"6ÜR7FÊG0¢6ˆÁ7Bv‚“"≤÷FÇÁ&˜VÊBÜ≤¢2ì∞¢f˜"Ü∆WBí“≤í¬v„≤í≤≤í∞¢6ˆÁ7BÇ“áBÚ#3≤í¢„C2íR∞¢6ˆÁ7BwÉ"“7É"≤÷FÇÁ6ñ‚Üí¢B„2≤BÚCí¢#∞¢2Êv∆ˆ&ƒ«Ü“÷FÇÁ6ñ‚áÇ¢÷FÇÂíí¢É„2≤≤¢„Bì∞¢2Êfñ∆≈7Gñ∆R“r3vFfcñs∞¢2Ê&VvñÂFÇÇì≤2Ê&2ÜwÉ"¬wí““Ç¢ÜFˆ˜$Ç“bí¬„b¬¬rì≤2Êfñ∆¬Çì∞¢–¢2Êv∆ˆ&ƒ«Ü“∞¢2Á&W7F˜&RÇì∞¢ÚÚFÜR7W&¬÷&6≤∆ó2ˆbFÜRFV"¬6F6ÜñÊrÜW"∆ñváBˆ‚FÜVó"ñÊÊW"VFvP¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#R√#SR√SB√„3Rís≤2Ê∆ñÊUvñGFÇ“#∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜ7É"“R¬wíì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"“#"¬wí“Fˆ˜$Ç¢„R¬7É"“B¬wí“Fˆ˜$Çì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#R√#SR√SB√„#"ís≤2Ê∆ñÊUvñGFÇ“„C∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜ7É"≤b¬wíì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤#"¬wí“Fˆ˜$Ç¢„#Ç¬7É"≤í¬wí“Fˆ˜$Ç¢„C"ì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì≤ÚÚˆB7vê¢ÚÚFÜR6ÜVB÷∆VbG&ñgBBFÜR&6S¢G'í∆Vb◊66∆W2&∆˜v‚˜WBˆbFÜRFV‚¿¢ÚÚ'FñÊr26ÜRÊV'2(	BFÜR&ˆ˜FÇ÷f∆≤¬v˜&‚'í∆VfW2ñÁ7FVBˆb6∆˜FÄ¢6ˆÁ7B'B“≤¢É∞¢f˜"Ü6ˆÁ7B2ˆb≤”¬“í∞¢f˜"Ü∆WBí“≤í¬C≤í≤≤í∞¢6ˆÁ7BÉ"“7É"≤2¢ÉÇ≤'B≤í¢b„Rí¬ì"“wí“„R“ÜíR"í¢"„S∞¢2Á6fRÇì∞¢2ÁG&Á6∆FRáÉ"¬ì"ì≤2Á&˜FFRá2¢É„2≤í¢„"í≤÷FÇÁ6ñ‚Üí¢B„rí¢„"ì∞¢2Êfñ∆≈7Gñ∆R“íR"Úr3C6#br¢r3#sCì&bs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”B„R¬ì∞¢2ÁVG&Fñ47W'fUFÚÉ¬”2„b¬B„R¬ì∞¢2ÁVG&Fñ47W'fUFÚÉ¬"„b¬”B„R¬ì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#R√#SR√SB√„"ís≤2Ê∆ñÊUvñGFÇ“„s∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”2„"¬ì≤2Ê∆ñÊUFÚÉ2„"¬ì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢–¢–¢ÚÚóG26ñv„¢∆ÁFW&‚÷'VB(	B6∆˜6VBf∆˜vW"ˆb∆VfW2ˆ‚G&ˆ˜ñÊr7FV–¢ÚÚ7G'VÊrˆfbFÜR∆VgB6ˆ«V÷‚¬v∆˜vñÊrg&ˆ“ñÁ6ñFR26ÜR'&VFÜW2(	BÜW ¢ÚÚG&FRvÜW&RFÜR˜FÜW'2ÜÊr∆◊¬÷ˆÊóF˜"¬vV"ÊB&VFñÊrÜˆˆ@¢6ˆÁ7B7r“÷FÇÁ6ñ‚áBÚ#í¢„É∞¢2Á6fRÇì∞¢2ÁG&Á6∆FRÜ7É"“%r≤B¬wí“$Ç≤3Bì≤2Á&˜FFRá7r“„Çì∞¢2Á7G&ˆ∂U7Gñ∆R“r3&#Cs≤2Ê∆ñÊUvñGFÇ“„c∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ¬”ì≤2ÁVG&Fñ47W'fUFÚÉB¬”R¬¬ì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r3C6#bs∞¢f˜"Ü6ˆÁ7B2ˆb≤”¬¬“í∞¢2Á6fRÇì≤2Á&˜FFRá2¢„Rì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ¬ì∞¢2ÁVG&Fñ47W'fUFÚÇ”"„b¬B¬¬r„Rì∞¢2ÁVG&Fñ47W'fUFÚÉ"„b¬B¬¬ì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢–¢6ˆÁ7B«“„CR≤÷FÇÁ6ñ‚áBÚÉí¢„##∞¢2Êfñ∆≈7Gñ∆R“w&v&É#R√#SR√SB¬r≤«≤rís∞¢2Á6ÜF˜t6ˆ∆˜"“r3vFfcñs≤2Á6ÜF˜t&«W"“É∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÉ¬B„B¬"„b¬2„B¬¬¬rì≤2Êfñ∆¬Çì≤2Á6ÜF˜t&«W"“∞¢2Á&W7F˜&RÇì∞¢2Á&W7F˜&RÇì∞ß–¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚDÑR¥U$bÜ∂ñÊvFˆ“Çì¢FÜRFWFÇFˆ˜"ñÁFÚFÜR7WGFW"w26Ü˜ˆfbÉ‡¢ÚÚ'Vñ«Bg&ˆ“FÜR66ÜRw2˜v‚gW&ÊóGW&RW"FÜR÷ñ÷ñ2'V∆R(	BFÜR&6∂G&˜F˜v‡¢ÚÚÜW&Ró27'ó7F¬◊fVñÊVB«V“&ˆ6≤ÊB7WBf6W2¬6ÚFÜRFˆ˜"ó2$ıTƒDU ¢ÚÚ5ƒïBî‚EtÚ¬óG2Ü«fW26WGF∆VB'B¬ÊBFÜR7∆óBóG6V∆bó2FÜRvíñ‚‡¢ÚÚFÜR6óáFÇ6á&ñÊR∂VW26óáFÇ6ñ∆Ü˜VWGFRÜ∂ñ˜6≤6Ê˜í¬6&∆R7vr¬VVÊ6Ä¢ÚÚÜˆˆB¬∆VÊñÊr7F6∑2¬ÜÊvñÊrˆB‚‚‚ÊBÊ˜r6∆˜fV‚7FˆÊRí¬ÊBóG2˜v‡¢ÚÚ∆ñváC¢Êˆ&ˆGíV«6Rw2∆◊'W&Á2ñ‚FÜR66ÜR¬6ÚFÜR7∆óB'&VFÜW2FÜP¢ÚÚU$îdîU"u2ıt‚tÑïDRÇ6Vcffbí(	BFÜR7GVfb6ÜR7WG2¬Ê˜B∆◊6ÜR∆óB‡¢Ú¢ÚÚÊ˜FÜñÊr«V÷"¬Ê˜FÜñÊr7V&RÑ‰Ú$îtÖB‰tƒU2ì¢7WBñ‚7'ó7F¬fˆ∆∆˜w0¢ÚÚFÜR7'ó7F¬w26∆VfvR¬6ÚFÜR∂W&bvÊFW'2FÜRvÜˆ∆RvíF˜v‚ÊBFÜRGv¢ÚÚ7&˜vÁ2∆V‚'B'íFñffW&VÁB÷˜VÁG2‚FÜW&Ró2ÊÚ7G&ñváBVFvRñ‚óB‡¢Ú¢ÚÚ‰BïBÑ2DÙı$$Tƒ¬4ÑR4‚dTT¬‚6ÜRÜ2ÊWfW"ÜV&B6˜VÊB‚6ÚFÜP¢ÚÚ7FˆÊRó27G'VÊrvóFÇ6ñvÊ¬∆ñÊRVvvVBñÁFÚFÜRf∆ˆ˜"(	BFÜRFVb7ó7FV–¢ÚÚó2vó&VB'íF˜V6ÇÊB∆ñváBÜFˆ72ÙDTeı5ï5DT“Ê÷Bí(	BÊBFÜR∆ñÊRTïdU%0¢ÚÚÜ&FW"FÜRÊV&W"FÜR∆ñW"7FÊG2‚FÜBó2FÜR7G'V7GW&RFV∆∆ñÊrÜW ¢ÚÚ7F˜'í&Vf˜&R6ÜR6ó2v˜&B¬ÊBóBó2FÜRFˆ˜"w2&ˆ6Ç&VB2vV∆¬‡¢Ú¢ÚÚ&ˆ6VGW&¬5D‰B‘î‚vóFñÊróG2fó&VB∆FRÑ%EıTUTR*s&¬∂W&dg&ˆÁBì†¢ÚÚFÜR÷VFñfWF6ÇÜˆˆ≤&V∆˜rvˆW2∆ófRFÜR6ˆ÷÷óBFÜR∆FRÊBóG2÷VFñÊß0¢ÚÚVÁG'í∆ÊB¬WÜ7F«í∆ñ∂RóG2fófR6ñ&∆ñÊw2r‡¶gVÊ7Fñˆ‚G&t∂W&e7FˆÊRÜ7É"¬wí¬¬≤í∞¢ñbáGóVˆb÷VFñfWF6Ç””“vgVÊ7Fñˆ‚rí÷VFñfWF6ÇÇv∂W&dg&ˆÁBrì∞¢6ˆÁ7B&ñ““GóVˆb‘TDîÙî‘r”“wVÊFVfñÊVBrbb‘TDîÙî‘rÊ∂W&dg&ˆÁC∞¢ñbÜ&ñ“bb&ñ“ÊÊGW&≈vñGFÇí∞¢6ˆÁ7BFÇ“#3b¬Gr“FÇ¢Ü&ñ“ÊÊGW&≈vñGFÇÚ&ñ“ÊÊGW&ƒÜVñváBì∞¢2Á6fRÇì∞¢ÚÚFÜRñÁFVB7∆óB∆ÊG2ˆ‚FÜR5D‰B5ıB¬Ê˜BFÜR∆FRw2÷ñFF∆R(	BFÜP¢ÚÚ6÷RˆÊR◊6˜W&6R÷ˆb◊G'WFÇ'V∆RFÜR˜FÜW"fófR∆FW2&RáVÊr'ê¢6ˆÁ7BF7Ç“7É"“Gr¢á∆FTFˆ˜$g&2Ü&ñ“¬v∂W&dg&ˆÁBrí“„Rì∞¢2ÊG&tñ÷vRÜ&ñ“¬F7Ç“GrÚ"¬wí“FÇ¬Gr¬FÇì∞¢ñbÜ≤‚„"í∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7Bv¬“2Ê7&VFU&Fñƒw&FñVÁBÜ7É"¬wí“FÇ¢„B¬b¬7É"¬wí“FÇ¢„B¬Gr¢É„#b≤≤¢„3bíì∞¢v¬ÊFD6ˆ∆˜%7F˜É¬w&v&É#3B√#Cb√#SR¬r≤É„R¢≤≤„bí≤rírì∞¢v¬ÊFD6ˆ∆˜%7F˜É¬w&v&É#3B√#Cb√#SR√írì∞¢2Êfñ∆≈7Gñ∆R“v√∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ7É"¬wí“FÇ¢„B¬Gr¢É„#b≤≤¢„3bí¬FÇ¢„CB¬¬¬rì≤2Êfñ∆¬Çì∞¢–¢2Á&W7F˜&RÇì∞¢&WGW&„∞¢–¢ÚÚtîDR‰B$≈TÂB¬˜"óBó2Ê˜B&˜V∆FW"‚FÜRfó'7B72FW&VB&˜FÇÜ«fW0¢ÚÚFÚˆñÁG2BFÜR7&˜v‚ÊBFÜWí&VB2GvÚ∆VfW27FÊFñÊrˆ‚VÊB&FÜW ¢ÚÚFÜ‚2ˆÊR&ˆ6≤6ˆ÷V&ˆGíÜB7WB(	BFÜR÷72ó2FÜRvÜˆ∆R7F˜'íÜW&R¬Ê@¢ÚÚ6∆˜fV‚7FˆÊR∂VW2óG26Ü˜V∆FW'2‡¢6ˆÁ7B%r“s¬$Ç“##∞¢6ˆÁ7BB“W&f˜&÷Ê6RÊÊ˜rÇì∞¢2Á6fRÇì∞¢ÚÚ““““FÜRw&˜VÊBFÜR7FˆÊR6óG2ñ„¢6Ü∆∆˜r&ˆ‚ˆbóG2˜v‚7ˆñ¬¬6¢ÚÚFÜR&˜V∆FW"ó2$TDDTB&FÜW"FÜ‚&∂VBˆ‚∆ñÊP¢2Êfñ∆≈7Gñ∆R“r33Çs∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜ7É"“%r“#b¬wí≤2ì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"“%r¢„R¬wí“í¬7É"¬wí“bì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤%r¢„b¬wí“¬7É"≤%r≤#B¬wí≤2ì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÚÚ““““DÑREtÚÑ≈dU2‚ˆÊR&˜V∆FW"¬7WBˆÊ6S≤V6ÇÜ∆bó26∆˜6VB«V◊ê¢ÚÚ7W'fRÊBFÜRGvÚñÊÊW"f6W2&RFÜR∂W&b‚∆VÊFñ«G2FÜR7&˜vÁ2'@¢ÚÚ'íFñffW&VÁB÷˜VÁG26ÚFÜRvó2vVFvRFÜB6ÜÊvW2óG2÷ñÊB‡¢6ˆÁ7B'&VFÇ“÷FÇÁ6ñ‚áBÚ#cí¢„#∞¢6ˆÁ7BÜ∆b“á2¬∆V‚¬vˆ"í”‚∞¢ÚÚ2“”∆VgB¬≥&ñváB‚'Vñ«B˜WGv&Bg&ˆ“FÜR7∆óB6ÚFÜRñÊÊW"f6Ró0¢ÚÚWFÜ˜&VBÊBFÜR˜WFW"6ñ∆Ü˜VWGFRó2FÜR«V◊í'B‡¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜ7É"≤2¢2¬wíì≤ÚÚfˆ˜B¬BFÜR7∆ó@¢2ÁVG&Fñ47W'fUFÚÜ7É"≤2¢Ñ%r¢„rí¬wí“$Ç¢„b¬7É"≤2¢Ñ%r≤vˆ"í¬wí“$Ç¢„#bì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤2¢Ñ%r¢„"í¬wí“$Ç¢„SÇ¬7É"≤2¢Ñ%r¢„É"í¬wí“$Ç¢„ÉBì∞¢ÚÚFÜR7&˜v„¢&«VÁB6Ü˜V∆FW"vóFÇ«V◊ˆ‚óB¬ÊWfW"ˆñÁ@¢2ÁVG&Fñ47W'fUFÚÜ7É"≤2¢Ñ%r¢„s"í¬wí“$Ç¢„¬7É"≤2¢Ñ%r¢„Cbí¬wí“$Ç¢„"ì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤2¢Ñ%r¢„3í¬wí“$Ç¢„2¬7É"≤2¢Ñ%r¢„bí≤∆V‚¬wí“$Ç¢„ìrì∞¢ÚÚFÜRî‰‰U"f6R(	BFÜR7WB‚óBvÊFW'3¢Fá&VRV6VB∂ñÊ∑2¬ÊWfW"∆ñÊR‡¢2ÁVG&Fñ47W'fUFÚÜ7É"≤2¢B≤∆V‚¢„r¬wí“$Ç¢„sb¬7É"≤2¢b¬wí“$Ç¢„Sbì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤2¢R¬wí“$Ç¢„C¬7É"≤2¢Ç¬wí“$Ç¢„#"ì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤2¢2¬wí“$Ç¢„¬7É"≤2¢2¬wíì∞¢2Ê6∆˜6UFÇÇì∞¢”∞¢f˜"Ü6ˆÁ7B2ˆb≤”¬“í∞¢6ˆÁ7B∆V‚“2¢á2¬Úí¢Rí≤'&VFÇ¢3≤ÚÚVÊWV√¢FÜWí6WGF∆VB¬FÜWíFñBÊ˜B˜V‡¢6ˆÁ7Bvˆ"“2¬ÚB¢”3∞¢2Á6fRÇì∞¢Ü∆bá2¬∆V‚¬vˆ"ì∞¢2Ê6∆óÇì∞¢ÚÚFÜR&ˆ6≥¢FÜR66ÜRw2«V“¬∆óBg&ˆ“FÜR7∆óB˜WGv&@¢6ˆÁ7B&r“2Ê7&VFT∆ñÊV$w&FñVÁBÜ7É"¬wí“$Ç¬7É"≤2¢%r¬wíì∞¢&rÊFD6ˆ∆˜%7F˜É¬r3V3&cSrì∞¢&rÊFD6ˆ∆˜%7F˜É„2¬r36C#3brì∞¢&rÊFD6ˆ∆˜%7F˜É„r¬r3&c#Brì∞¢&rÊFD6ˆ∆˜%7F˜É¬r3ÉCBrì∞¢2Êfñ∆≈7Gñ∆R“&s∞¢2Êfñ∆≈&V7BÜ7É"“%r“3¬wí“$Ç“#¬Ñ%r≤3í¢"¬$Ç≤#Bì∞¢ÚÚ5%ï5D¬dTîÂ2ñ‚FÜRf6R(	BFÜR6V“FÜó2vÜˆ∆R∂ñÊvFˆ“ó2V'&ñV@¢ÚÚf˜"¬vÊFW&ñÊr¬'&ñváFW"FÜRÊV&W"FÜR7WB¬&V6W6RFÜBó2FÜR6ñFP¢ÚÚÜW"∆ñváBf∆«2ˆ‡¢f˜"Ü∆WBí“≤í¬C≤í≤≤í∞¢6ˆÁ7BgÇ“7É"≤2¢É≤í¢Rì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#SR√ìB√#3B¬r≤É„3“í¢„SRí≤rís∞¢2Ê∆ñÊUvñGFÇ“„b“í¢„#S∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚágÇ¬wí“"ì∞¢f˜"Ü∆WBí“wí“É≤í‚wí“$É≤í”“#"ê¢2Ê∆ñÊUFÚágÇ≤÷FÇÁ6ñ‚áíÚ#b≤í¢"„í¢r≤2¢Üwí“$Ç“íí¢„2¬íì∞¢2Á7G&ˆ∂RÇì∞¢–¢ÚÚ‚‚ÊÊBFÜR4r44ı$R‚7WBf6R∂VW2FÜR÷&∑2ˆbFÜR7WC¢6Ü∆∆˜p¢ÚÚ&72fˆ∆∆˜vñÊrFÜR7vVWˆbFÜRvó&R¬ˆÊ«íˆ‚FÜRñÊÊW"FÜó&B‡¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#3B√#Cb√#SR√„ís≤2Ê∆ñÊUvñGFÇ“∞¢f˜"Ü∆WBí“≤í¬S≤í≤≤í∞¢6ˆÁ7Bóí“wí“$Ç¢É„B≤í¢„rì∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜ7É"≤2¢B¬óíì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤2¢#¬óí≤R¬7É"≤2¢3¬óí≤"ì∞¢2Á7G&ˆ∂RÇì∞¢–¢2Á&W7F˜&RÇì∞¢ÚÚFÜR˜WFW"&ñ“¬6F6ÜñÊrFÜR&ˆˆ”¢FÜñ‚6ˆ∆BVFvR¬ÊWfW"7G&ˆ∂Rˆ`¢ÚÚFÜRvÜˆ∆R˜WF∆ñÊRÜ‚˜WF∆ñÊVB&˜V∆FW"&VG227Fñ6∂W"ê¢2Á6fRÇì∞¢Ü∆bá2¬∆V‚¬vˆ"ì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#SR√#"√#í√„bís≤2Ê∆ñÊUvñGFÇ“„C≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢–¢ÚÚ““““DÑR¥U$bïE4Tƒc¢FÜRv&WGvVV‚FÜRÜ«fW2¬'&VFÜñÊrFÜRW&ñfñW"w0¢ÚÚvÜóFR‚vñFW7BBFÜRfˆ˜BÜóBó2Fˆ˜'víí¬ñÊ6ÜVBÊV"FÜR7&˜v‚‡¢6ˆÁ7BFˆ˜$Ç“$Ç¢„Éc∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7BV«6R“÷FÇÁ6ñ‚áBÚsí¢„S∞¢6ˆÁ7B∂r“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬wí“Fˆ˜$Ç¬¬wíì∞¢∂rÊFD6ˆ∆˜%7F˜É¬w&v&É#3B√#Cb√#SR¬r≤É„b≤≤¢„3B≤V«6Rí≤rírì∞¢∂rÊFD6ˆ∆˜%7F˜É„SR¬w&v&É#SR√#SR√#SR¬r≤É„"≤≤¢„CB≤V«6Rí≤rírì∞¢∂rÊFD6ˆ∆˜%7F˜É¬w&v&É#3B√#Cb√#SR¬r≤É„#≤≤¢„S"≤V«6Rí≤rírì∞¢2Êfñ∆≈7Gñ∆R“∂s∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜ7É"“B¬wíì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"“r¬wí“Fˆ˜$Ç¢„#B¬7É"“"¬wí“Fˆ˜$Ç¢„Cbì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"“b¬wí“Fˆ˜$Ç¢„sB¬7É"“2¬wí“Fˆ˜$Çì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤B¬wí“Fˆ˜$Ç¢„s"¬7É"≤¬wí“Fˆ˜$Ç¢„CBì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤b¬wí“Fˆ˜$Ç¢„#"¬7É"≤R¬wíì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÚÚFÜRw&óBÜÊvñÊrñ‚ÜW"∆ñváB(	B7'ó7F¬GW7B¬FÜR6Ü˜w2˜v‚ó ¢6ˆÁ7Bv‚“2≤÷FÇÁ&˜VÊBÜ≤¢Bì∞¢f˜"Ü∆WBí“≤í¬v„≤í≤≤í∞¢6ˆÁ7BÇ“áBÚ3≤í¢„3ríR∞¢6ˆÁ7BGÇ“7É"≤÷FÇÁ6ñ‚Üí¢2„í≤BÚìí¢∞¢2Êv∆ˆ&ƒ«Ü“÷FÇÁ6ñ‚áÇ¢÷FÇÂíí¢É„#b≤≤¢„Bì∞¢2Êfñ∆≈7Gñ∆R“r6Vcffbs∞¢2Ê&VvñÂFÇÇì≤2Ê&2ÜGÇ¬wí“Ç“Ç¢ÜFˆ˜$Ç“#í¬„B¬¬rì≤2Êfñ∆¬Çì∞¢–¢2Êv∆ˆ&ƒ«Ü“∞¢2Á&W7F˜&RÇì∞¢ÚÚFÜR∆ó2ˆbFÜR7WB¬F∂ñÊrÜW"∆ñváBˆ‚FÜVó"ñÊÊW"VFvP¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#3B√#Cb√#SR√„3Bís≤2Ê∆ñÊUvñGFÇ“#∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜ7É"“B¬wíì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"“r¬wí“Fˆ˜$Ç¢„3B¬7É"“2¬wí“Fˆ˜$Çì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#3B√#Cb√#SR√„#"ís≤2Ê∆ñÊUvñGFÇ“„S∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜ7É"≤R¬wíì∞¢2ÁVG&Fñ47W'fUFÚÜ7É"≤Ç¬wí“Fˆ˜$Ç¢„2¬7É"≤¬wí“Fˆ˜$Ç¢„CBì≤2Á7G&ˆ∂RÇì∞¢ÚÚ““““DÑR4ît‰¬ƒî‰R(	BÜW"Fˆ˜&&V∆¬¬ÊBFÜRˆÊ«íˆÊRñ‚FÜRv÷RÊˆ&ˆGê¢ÚÚ&ñÊw2‚7G'VÊrg&ˆ“FÜR∆VgB7&˜v‚FÚVrñ‚FÜRf∆ˆ˜"ˆ‚FÜR&ñváB¬¢ÚÚ&V¬6FVÊ'í¬VófW&ñÊrÜ&FW"FÜRÊV&W"6ÜR7FÊG3¢FÜó2ó2Ü˜rFV`¢ÚÚ÷6ÜñÊR∂Ê˜w2FÜR&ˆˆ“Ü26ˆ÷V&ˆGíñ‚óB‡¢6ˆÁ7BÉ"“7É"“%r¢„c"¬í“wí“$Ç¢„É#∞¢6ˆÁ7B'É"“7É"≤%r≤b¬'í“wí“#∞¢6ˆÁ7BVófW"“÷FÇÁ6ñ‚áBÚSÇí¢É„b≤≤¢2„Bì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#B√ì√#Ç√„Rís≤2Ê∆ñÊUvñGFÇ“„#∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜÉ"¬íì∞¢2ÁVG&Fñ47W'fUFÚÇÜÉ"≤'É"íÚ"≤VófW"¬Üí≤'ííÚ"≤3≤VófW"¢„B¬'É"¬'íì∞¢2Á7G&ˆ∂RÇì∞¢ÚÚFÜRVr¬ÊBFÜR∆óGF∆RvÜóFRFñ6≤FÜB'VÁ2WFÜR∆ñÊRvÜV‚6ÜRó2ÊV ¢2Êfñ∆≈7Gñ∆R“r3F#CCs∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ'É"¬'í¬B¬"„b¬”„2¬¬rì≤2Êfñ∆¬Çì∞¢ñbÜ≤‚„Rí∞¢6ˆÁ7B'“áBÚìíR∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Êv∆ˆ&ƒ«Ü“÷FÇÁ6ñ‚á'¢÷FÇÂíí¢≤¢„ì∞¢2Êfñ∆≈7Gñ∆R“r6Vcffbs∞¢2Ê&VvñÂFÇÇì∞¢2Ê&2Ü'É"≤ÜÉ"“'É"í¢'¬'í≤Üí“'íí¢'≤÷FÇÁ6ñ‚á'¢÷FÇÂíí¢#b¬"„"¬¬rì∞¢2Êfñ∆¬Çì≤2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢–¢ÚÚ““““ÑU"4ît‚‚FÜR˜FÜW'2ÜÊr∆◊¬÷ˆÊóF˜"¬vV"¬&VFñÊrÜˆˆ@¢ÚÚÊB∆ÁFW&‚÷'VC≤6ÜRÜÊw2DÑR$ır(	B6∆6≤7WGFñÊrvó&Rñ‚7W'fV@¢ÚÚg&÷R¬GW&ÊñÊr∆óGF∆R¬vóFÇFÜR7WB7Fñ∆¬v∆∂ñÊr∆ˆÊrFÜRvó&R‡¢6ˆÁ7B7r“÷FÇÁ6ñ‚áBÚSí¢„∞¢2Á6fRÇì∞¢2ÁG&Á6∆FRÜ7É"“%r¢„s"¬wí“$Ç¢„SRì≤2Á&˜FFRá7r“„#"ì∞¢2Á7G&ˆ∂U7Gñ∆R“r3f#FVRs≤2Ê∆ñÊUvñGFÇ“"„#≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”í¬”íì≤2ÁVG&Fñ47W'fUFÚÇ”b¬B¬”Ç¬2ì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#3B√#Cb√#SR√„SRís≤2Ê∆ñÊUvñGFÇ“„ì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”í¬”íì≤2ÁVG&Fñ47W'fUFÚÇ”"¬"¬”Ç¬2ì≤2Á7G&ˆ∂RÇì∞¢6ˆÁ7B&VB“áBÚ3íR∞¢2Êfñ∆≈7Gñ∆R“w&v&É#SR√#SR√#SR¬r≤É„R≤÷FÇÁ6ñ‚áBÚCí¢„2í≤rís∞¢2Á6ÜF˜t6ˆ∆˜"“r6Vcffbs≤2Á6ÜF˜t&«W"“s∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ç”í≤÷FÇÁ6ñ‚Ü&VB¢÷FÇÂíí¢b¬”í≤&VB¢#"¬„í¬¬rì≤2Êfñ∆¬Çì∞¢2Á6ÜF˜t&«W"“∞¢2Á&W7F˜&RÇì∞¢ÚÚ““““ÜW"7ˆñ¬BFÜRfˆ˜B¬'FñÊr26ÜRÊV'2áFÜR&ˆ˜FÇ÷f∆≤¬v˜&‡¢ÚÚ'í6Üó2ˆb7'ó7F¬ñÁ7FVBˆb6∆˜FÇê¢6ˆÁ7B'B“≤¢C∞¢f˜"Ü6ˆÁ7B2ˆb≤”¬“í∞¢f˜"Ü∆WBí“≤í¬C≤í≤≤í∞¢6ˆÁ7BÉ"“7É"≤2¢Éb≤'B≤í¢rí¬ì"“wí““ÜíR"í¢#∞¢2Á6fRÇì∞¢2ÁG&Á6∆FRáÉ"¬ì"ì≤2Á&˜FFRá2¢É„#R≤í¢„#Bí≤÷FÇÁ6ñ‚Üí¢R„í¢„"ì∞¢2Êfñ∆≈7Gñ∆R“íR"Úr36c32r¢r3Fc&#CRs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”B¬ì∞¢2ÁVG&Fñ47W'fUFÚÇ”¬”2„"¬2„Ç¬”„bì∞¢2ÁVG&Fñ47W'fUFÚÉ„R¬"„"¬”B¬ì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“w&v&É#3B√#Cb√#SR√„#Çís∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ç”„R¬”„Ç¬„í¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢–¢–¢2Á&W7F˜&RÇì∞ß–¢ÚÚ““““““““““ƒUdT≈2tïDÑî‚ƒUdT≈2““““““““““““““““““““““““““““““““““““““““““–¢ÚÚFÜR˜vÊW"¬##b”Ç”#3¢'FÜRv÷RóG6V∆b6Ü˜V∆B&R'Vñ«Bñ‚víFÜ@¢ÚÚVÊ&∆W2÷RFÚFB∆WfV«2vóFÜñ‚∆WfV«2‚6ÚFÜBí6‚WáÊBvÜVÊWfW"ê¢ÚÚvÁBg&ˆ“ÜW&R‚ ¢Ú¢ÚÚtDUı$ÙÙ“ÜV∆BÙ‰RFˆ˜"W"&ˆˆ“¬ÊBFÜB6ñÊv∆Rf7Bv2FÜR6Vñ∆ñÊrˆ‡¢ÚÚFÜRvÜˆ∆RñFV‚&ˆˆ“6˜V∆B∆VBñÁv&BFÚWÜ7F«íˆÊR˜FÜW"∆6R¬6Ú¢ÚÚáV"vóFÇFá&VR6ñFR6Ü÷&W'2(	BGVÊÊV¬vóFÇ'&Ê6Ç¬6Ü˜vóFÇ&6∞¢ÚÚ&ˆˆ“¬∆ó"vóFÇGvÚw&˜GFˆW2(	B6˜V∆BÊ˜B&Rw&óGFV‚F˜v‚B∆¬¬Ü˜vWfW ¢ÚÚ÷Áí&ˆˆ◊2v˜&∆BÊß2w&Wr‚FÜRf«VRˆb&˜r÷íÊ˜r&RFˆ˜"ı"‚%$ê¢ÚÚÙbDÙı%2¬ÊBWfW'óFÜñÊrFÜB&VG2FÜRF&∆RvˆW2Fá&˜VvÇFÜW6RGvÚ‡¢Ú¢ÚÚWÜó7FñÊr&˜w2&RVÁF˜V6ÜVC¢ˆÊRFˆ˜"ó27Fñ∆¬ˆÊRˆ&¶V7B¬ÊBWfW'ífñV∆@¢ÚÚˆ‚óB÷VÁ2vÜBóB÷VÁB‚FFñÊr6V6ˆÊBó2FFñÊr6ˆ÷÷‡¶gVÊ7Fñˆ‚vFTFˆ˜'4∆¬ÜñBí∞¢6ˆÁ7B&ˆˆ““ñB”“ÁV∆¬ÚrÁ&ˆˆ‘ñB¢ñC∞¢6ˆÁ7Br“tDUı$ÙÙ’∑&ˆˆ’”∞¢6ˆÁ7BFˆ˜'2“rÚµ“¢Ñ'&íÊó4'&íÜríÚrÁ6∆ñ6RÇí¢∂u“ì∞¢ÚÚ‚WÜó7FñÊrf∆ˆ˜"Ê6Ü˜"ñ‚FÜRV''í6ˆÊÊV7G2FÚFÜRGVÊÊV¬w26VÁG&¿¢ÚÚ÷ñÁFVÊÊ6R∆ÊFñÊr‚FÜRwV&Fñ‚w2&Wv&Bó2ÊWfW"&W&WVó6óFR‡¢ñbÇó4ÜW&ÚÇíbbrÁ6fRbbrÁ6fRÁ7F˜'ïfW'6ñˆ‚””“"í∞¢ñbá&ˆˆ“””“t5c2ríFˆ˜'2ÁW6Çá≤C¢3bÚSb¬FÛ¢ttBr¬É¢„R¬ÊVVC¢v7'ó7F¬r“ì∞¢ñbá&ˆˆ“””“ttBríFˆ˜'2ÁW6Çá≤C¢„R¬FÛ¢t5c2r¬É¢3bÚSb¬ÊVVC¢v7'ó7F¬r“ì∞¢–¢&WGW&‚Fˆ˜'3∞ß–¢ÚÚ‚‚ÊÊBFÜó2ó2FÜRˆÊRFÜRv÷RW6W3¢FÜRFˆ˜'2FÜBUÑï5B&ñváBÊ˜r‚Fˆ˜ ¢ÚÚvóFÇ‚VÊ÷WBÊVVFó2Ê˜BÜñFFV‚¬óBÜ2Ê˜B&VV‚'Vñ«BñWB(	BÊÚ&ˆ◊B¿¢ÚÚÊÚ7G'V7GW&R¬ÊÚv∆≤(	BvÜñ6Çó2Ü˜rFÜRwV&Fñ‚w&˜GFˆW2V"‡¶gVÊ7Fñˆ‚vFTFˆ˜'2ÜñBí∞¢6ˆÁ7B˜WB“µ”∞¢f˜"Ü6ˆÁ7BBˆbvFTFˆ˜'4∆¬ÜñBíê¢ñbÇBÊÊVVB«¬ÑrÁ6fRbbrÁ6fRÊf∆w2bbrÁ6fRÊf∆w5∂BÊÊVVE“íí˜WBÁW6ÇÜBì∞¢ÚÚ‚‚‰‰BDÑRt¥î‰rdƒÙı"u2$ÙıDÇï2‰ıB%Tî≈BTÂDî¬4ÑRï24TÂBDÚïB‡¢Ú¢ÚÚFÜRGWF˜&ñ¬fVÊ6W2FÜR&ˆˆ“w24îDRFˆ˜"ÊB∆VgBFÜRFWFÇFˆ˜"vñFP¢ÚÚ˜V‚¬6ÚFÜRví7BWfW'í∆W76ˆ‚v2FÚv∆≤ñÁFÚFÜR6Ü˜¢FÜR∂ñ∆¿¢ÚÚ7FW6ˆ◊∆WFVBóG6V∆bñ‚FÜW&RÜÊÚVÊV÷ñW2ñ‚&ˆ˜FÇí¬7vñÊrñ‚FÜW&P¢ÚÚ6ˆ◊∆WFVBFÜRGF6≤7FW¬ÊBFÜRG&FW"˜VÊVBÜó27F∆¬FÚ∆ñW ¢ÚÚÜˆ∆FñÊrÊ˜FÜñÊr‚FÜBó2FÜR˜vÊW"w2'FÜW&Ró2ÊÚVÊf˜&6V÷VÁBf˜"FÜP¢ÚÚwVñFRˆbFÜRv÷R"¬ÊBóBó2FÜR6÷R'VrFÜR6WVVÁFñ¬÷6ˆÁG&ˆ«2Ê˜FP¢ÚÚ&˜fR«&VGíFW67&ñ&W2f˜"'WGFˆÁ2(	BFˆ˜"ó26ˆÁG&ˆ¬FˆÚ‡¢Ú¢ÚÚÜV∆BˆÊ«ívÜñ∆RFÜRv∆≤ó27GV∆«í'VÊÊñÊr¬ˆÊ«íñ‚óG2˜v‚&ˆˆ“¬Ê@¢ÚÚˆÊ«íVÁFñ¬FÜR7FWFÜB6ó2FÚvÚñ‚‚Ê˜FÜñÊr˜WG6ñFRFÜRGWF˜&ñ¬¬Ê@¢ÚÚÊ˜FÜñÊrgFW"óB¬6ÜÊvW2B∆¬‡¢ñbÜ˜WBÊ∆VÊwFÇbbGóVˆbEUEı5DU2”“wVÊFVfñÊVBrbbrÁGW@¢bbÑrÁ6fRbbrÁ6fRÊf∆w2bbrÁ6fRÊf∆w2ÁGWBíbbEUEÙ$ÙıDÖı$ÙÙ’∂ñE“í∞¢6ˆÁ7B˜V‰B“EUEı5DU2ÊfñÊDñÊFWÇá”‚ÊñB””“EUEÙ$ÙıDÖı$ÙÙ’∂ñE“ì∞¢ñbÜ˜V‰B„“bbrÁGWBÊí¬˜V‰Bí&WGW&‚µ”∞¢–¢&WGW&‚˜WC∞ß–¢ÚÚvÜñ6Ç7FW˜VÁ2V6Çv∂ñÊr÷f∆ˆ˜"FWFÇFˆ˜"(	BFÜR&ˆ˜FÇWÜó7G2ˆÊ6RFÜP¢ÚÚ∆W76ˆ‚FÜB6VÊG2ÜW"ñÁ6ñFRóB&VvñÁ0¶6ˆÁ7BEUEÙ$ÙıDÖı$ÙÙ““≤¢v'Wír”∞¢ÚÚtÑî4Çƒ‰RDÙı"5D‰E2î‚¬ÊBóBó2FÜRvÜˆ∆RˆbFÜR˜vÊW"w26ˆ◊∆ñÁ@¢ÚÚ&˜WBFÜRfó'7B6Ü˜¢'FÜR6ˆ∆˜'2&R7Fñ∆¬ñ‚GV∆¬fFVBFá&VRBñÁ7FVBˆ`¢ÚÚG&vñÊw2∆ñ∂RFÜR6Ü&7FW'2‚‚‚FÜR∆ñW"÷ñváB7GV∆«í÷ó72óB‚óBw2Ê˜@¢ÚÚV∆ñÊrFÚFÜR‚‚‚áV÷‚∆ñW"FÚVÁFW"‚ ¢Ú¢ÚÚÜRv2&VFñÊr&V¬ÁV÷&W"‚WfW'íFWFÇ÷Fˆ˜"7G'V7GW&Rv2G&v‚ñÁ6ñFP¢ÚÚG&t$r¬vÜñ6Ç÷VÁ2&u∆ÊU72&‚˜fW"óB(	BìBRˆbFÜR6á&ˆ÷V∆∆VB˜W@¢ÚÚÊBFÜRf«VR◊V«Fó∆ñVBFÚC"R¬&V6W6RFÜB72WÜó7G2FÚW6ÇFÜRd ¢ÚÚ∆ÊR&6≤‚÷V7W&VBñ‚¢FÜR&ˆ˜FÇw2÷V‚6GW&Fñˆ‚v2"„BvñÁ7B¢ÚÚ&6∂G&˜ˆb„í‚FÜR6Ü˜v2¬FÚvóFÜñ‚ˆÊRˆñÁB¬FÜRv∆¬&VÜñÊBóB‡¢Ú¢ÚÚ%EÙ$î$ƒR*sí„B«&VGí6ñBvÜW&RóB&V∆ˆÊw2(	B'FÜR&W6W'fVB6á&ˆ÷&V∆ˆÊw0¢ÚÚFÚFÜR67BÊBFÜRîÂDU$5D$ƒU2¬Ê˜BFÚFÜRv∆¬&VÜñÊBFÜV“"(	BÊBFÜP¢ÚÚ&ˆ˜FÇó2FÜR÷˜7BñÁFW&7F&∆Rˆ&¶V7Bñ‚∂ñÊvFˆ“‚6ÚFÜRFˆ˜'27∆óC†¢ÚÚÁóFÜñÊr6ÜRv∆∑2WFÚÊB&W76W2UBó2G&v‚vóFÇFÜR67B¬gFW"FÜP¢ÚÚ&6∂w&˜VÊBó2w&FVC≤FÜR÷ˆÁV÷VÁF¬¶ˆÊRvFW27Fíñ‚FÜRñÁFñÊr¬vÜñ6Ä¢ÚÚó2vÜBFÜWí&R‡¢ÚÚDÙı"EdU%Dï4U2ïE4TƒbtïDÇƒîtÖB¬≈tï2(	BÊ˜BˆÊ«íˆÊ6R6ÜRó2«&VGê¢ÚÚ&W6ñFRóB‚FÜRG&FW"w27F∆¬∆V&ÊVBFÜó2ˆ‚óG2˜v‚Ç$ƒïBB$U5B¬‰ı@¢ÚÚÙ‰≈íÙ‚$Ù4Ç"ñ‚G&t&ˆ˜FÇíÊBÊ˜FÜñÊrV«6RFñB¬6ÚFÜR˜&6∆Rw0¢ÚÚ6á&ñÊR¬FÜRVVÊ6ÇÜˆˆB¬FÜR6'&V¬ÊBFÜRÜˆ∆∆˜r∆¬6BBFÜRf«VRˆ`¢ÚÚFÜRv∆¬FÜWí7FÊBvñÁ7B‚÷V7W&VB'íFW7G2˜6Ü˜&VBÊ6ß3¢7G'V7GW&P¢ÚÚ◊W7BFñffW"g&ˆ“vÜBóB6˜fW'2ñ‚4Ö$Ù‘˜"ñ‚ƒîtÖB¬ÊBFÜR6á&ñÊP¢ÚÚFñffW&VBñ‚ÊVóFÜW"‡¢Ú¢ÚÚv&“f˜"ÁóFÜñÊr'Vñ«BÊB∆óBg&ˆ“ñÁ6ñFS≤4ÙƒBf˜"6fR÷˜WFÇ¬vÜñ6Ä¢ÚÚ&VG2'í&VñÊrÜˆ∆R&FÜW"FÜ‚'í&VñÊr∆◊‡¶gVÊ7Fñˆ‚7G'V7D&V6ˆ‚Ü7É"¬wí¬r¬Ç¬≤¬6ˆ∆Bí∞¢6ˆÁ7B'"“„í≤÷FÇÁ6ñ‚ÇÑrÁ6ñ‘6∆ˆ6≤«¬í¢„í¢„∞¢2Á6fRÇì∞¢ñbÜ6ˆ∆Bí∞¢ÚÚFÜRFá&ˆBvˆW2D$≤¬ÊBFÜR&ñ“F∂W2FÜñ‚6ˆ∆B∆ñváC¢÷˜WFÇFÜ@¢ÚÚv∆˜w2ó2Fˆ˜'ví¬ÊBFÜó2ó2Üˆ∆Rñ‚&ˆ6∞¢6ˆÁ7BFÇ“2Ê7&VFU&Fñƒw&FñVÁBÜ7É"¬wí“Ç¢„C¬B¬7É"¬wí“Ç¢„C¬r¢„S"ì∞¢FÇÊFD6ˆ∆˜%7F˜É¬w&v&É√√¬r≤É„ìB≤„R¢≤íÁFÙfóÜVBÉ2í≤rírì∞¢FÇÊFD6ˆ∆˜%7F˜É„c"¬w&v&É√√¬r≤É„É"≤„¢≤íÁFÙfóÜVBÉ2í≤rírì∞¢FÇÊFD6ˆ∆˜%7F˜É„ÉÇ¬w&v&É√√¬r≤É„3b≤„B¢≤íÁFÙfóÜVBÉ2í≤rírì∞¢FÇÊFD6ˆ∆˜%7F˜É¬w&v&É√√√írì∞¢2Êfñ∆≈7Gñ∆R“FÉ∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ7É"¬wí“Ç¢„C¬r¢„S"¬Ç¢„R¬¬¬rì≤2Êfñ∆¬Çì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7B&ñ““2Ê7&VFU&Fñƒw&FñVÁBÜ7É"¬wí“Ç¢„c"¬r¢„C"¬7É"¬wí“Ç¢„c"¬r¢„cbì∞¢&ñ“ÊFD6ˆ∆˜%7F˜É¬w&v&É#√É√#R√írì∞¢&ñ“ÊFD6ˆ∆˜%7F˜É„s"¬w&v&É3√ì√##¬r≤É„R¢'"íÁFÙfóÜVBÉ2í≤rírì∞¢&ñ“ÊFD6ˆ∆˜%7F˜É¬w&v&É#√É√#R√írì∞¢2Êfñ∆≈7Gñ∆R“&ñ”∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ7É"¬wí“Ç¢„c"¬r¢„cb¬Ç¢„c"¬¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢&WGW&„∞¢–¢ÚÚÙ‰Rt$“T‘$U"¬WfW'óvÜW&R‚6ˆˆ¬∆◊ñ‚FÜRÜ˜B∂ñÊvFˆ◊2v2G&ñVBÊ@¢ÚÚ÷V7W&VBv˜'6Rñ‚WfW'í&ˆˆ“óBF˜V6ÜVC¢7ñ‚∆ñváB∆ÊFñÊrˆ‚˜&ÊvR&ˆ6∞¢ÚÚ6Ê6V«2FÚw&Wí¬6ÚFÜRf˜VÊG'íw2ÜˆˆBvVÁBg&ˆ“&VFñÊr"„FÚ„s"‡¢ÚÚ6ˆÁG&7B&WGvVV‚Fˆ˜'víÊBóG2∂ñÊvFˆ“ó2FÜR%Bw2¶ˆ"(	BFÜRfó&V@¢ÚÚ∆FW2ñ‚%EıTUTR*s&Ç¸*s&≤6''íóB(	BÊB∆ñváB∆ˆÊR6ÊÊ˜B'WíóB‡¢6ˆÁ7B3“≥#SR¬#b¬e“¬3"“≥#SR¬Éb¬ì%“¬32“≥#SR¬##Ç¬cÖ”∞¢6ˆÁ7B&v&“áb¬í”‚w&v&Çr≤e≥“≤r¬r≤e≥“≤r¬r≤e≥%“≤r¬r≤ÁFÙfóÜVBÉ2í≤rís∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7Bv¬“2Ê7&VFU&Fñƒw&FñVÁBÜ7É"¬wí“Ç¢„3B¬b¬7É"¬wí“Ç¢„3B¬r¢É„C≤≤¢„3bíì∞¢v¬ÊFD6ˆ∆˜%7F˜É¬&v&Ñ3¬É„3≤„b¢≤í¢'"íì∞¢v¬ÊFD6ˆ∆˜%7F˜É„R¬&v&Ñ3"¬É„R≤„¢≤í¢'"íì∞¢v¬ÊFD6ˆ∆˜%7F˜É¬&v&Ñ3"¬íì∞¢2Êfñ∆≈7Gñ∆R“v√∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ7É"¬wí“Ç¢„3B¬r¢É„C≤≤¢„3bí¬Ç¢„Cb¬¬¬rì≤2Êfñ∆¬Çì∞¢ÚÚ‚‚ÊÊB6÷∆¬ÑıB6˜&Rñ‚FÜRFˆ˜'ví‚FÜRvñFRv∆˜r∆ñgG2FÜRf«VS≤¢ÚÚÜ&B∆óGF∆R6˜W&6Ró2vÜB6ó2'FÜW&Ró2∆◊ñ‚FÜW&R"‡¢6ˆÁ7B6˜&R“2Ê7&VFU&Fñƒw&FñVÁBÜ7É"¬wí“Ç¢„3¬¬7É"¬wí“Ç¢„3¬r¢„rì∞¢6˜&RÊFD6ˆ∆˜%7F˜É¬&v&Ñ32¬É„3Ç≤„"¢≤í¢'"íì∞¢6˜&RÊFD6ˆ∆˜%7F˜É¬&v&Ñ3¬íì∞¢2Êfñ∆≈7Gñ∆R“6˜&S∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ7É"¬wí“Ç¢„3¬r¢„r¬Ç¢„#"¬¬¬rì≤2Êfñ∆¬Çì∞¢6ˆÁ7Bˆˆ¬“2Ê7&VFU&Fñƒw&FñVÁBÜ7É"¬wí¬"¬7É"¬wí¬r¢„Cbì∞¢ˆˆ¬ÊFD6ˆ∆˜%7F˜É¬&v&Ñ3"¬É„b≤„í¢≤í¢'"íì∞¢ˆˆ¬ÊFD6ˆ∆˜%7F˜É¬&v&Ñ3"¬íì∞¢2Êfñ∆≈7Gñ∆R“ˆˆ√∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ7É"¬wí¬r¢„Cb¬÷FÇÊ÷ÇÉB¬Ç¢„Çí¬¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞ß–¶gVÊ7Fñˆ‚vFTFˆ˜$ÊV"ÜFVbí∞¢ñbÜFVbÁ7Gñ∆Rí&WGW&‚G'VS≤ÚÚ&ˆ˜FÇ¬6á&ñÊR¬f˜&vR¬6'&V¬¬Üˆ∆∆˜p¢6ˆÁ7BFW7B“GóVˆb$ÙÙ’2”“wVÊFVfñÊVBrbb$ÙÙ’5∂FVbÁFı”∞¢&WGW&‚ÇÑrÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÊ6fRí«¬ÜFW7BbbFW7BÊ6fRíì≤ÚÚÊB6fR÷˜WFá0ß–¶gVÊ7Fñˆ‚G&tvFTFˆ˜'2Ö¬ÊV"í∞¢ÚÚFÜR÷V7W&V÷VÁBÜˆˆ≤¬FÜR6÷R6ÜR2rÊ'E&ˆ&S¢vóFÇóB6WB¬FÜRÊV ¢ÚÚ72G&w2Ê˜FÜñÊr¬6ÚÜ&ÊW726‚Ü˜Fˆw&ÇFÜR&ˆˆ“vóFÇÊBvóFÜ˜W@¢ÚÚóG27G'V7GW&W2ÊB÷V7W&RWÜ7F«íFÜRóÜV«2FÜWí˜v‚‚ÁívVˆ÷WG&ñ0¢ÚÚwVW72B'vÜW&RFÜR&ˆ˜FÇó2"÷V7W&W2FÜRV◊Gí6∑í&˜fRóB2vV∆¬‡¢ñbÜÊV"bbrÁ7G'V7E&ˆ&Rí&WGW&„∞¢6ˆÁ7B∆ó7B“∆ñW"ÚvFTFˆ˜'2Çí¢µ”∞¢ñbÇ∆ó7BÊ∆VÊwFÇí≤rÂˆFˆ˜$≤“≤&WGW&„≤–¢f˜"Ü6ˆÁ7BBˆb∆ó7BíñbÜvFTFˆ˜$ÊV"ÜBí””“ÊV"íG&tvFTFˆ˜"Ö¬B¬ÊV"ì∞ß–¶gVÊ7Fñˆ‚G&tvFTFˆ˜"Ö¬FVb¬ÊV%∆ÊRí∞¢ÚÚtı$ƒB‘ƒÙ4¥TC¢ˆÊRÇf˜"FÜRG&ñvvW"¬FÜR&ˆ◊BÊBFÜR7G'V7GW&R‚FÜP¢ÚÚ&∆∆ÇFWFÇ&VBÊ˜r6ˆ÷W2g&ˆ“FÜR&6Ç&VñÊrFñ÷÷W"ÊBFÜR∆VfW0¢ÚÚ&VñÊr∆óB¬Ê˜Bg&ˆ“FÜRvÜˆ∆RFˆ˜'ví7&v∆ñÊrvñÁ7BFÜRFW'&ñ‚‡¢ÚÚFÜRÊV"72G&w2ñÁ6ñFRFÜR6÷W&G&Á6f˜&“¬6ÚóBvÁG2tı$ƒ@¢ÚÚ6ˆ˜&FñÊFW3≤FÜRf"72G&w2ñ‚67&VV‚76R‚ˆÊRÊ6Ü˜"¬GvÚg&÷W2‡¢6ˆÁ7BwÇ“vFUv˜&∆EÇÜFVbí¬wí“ÑrÁ&ˆˆ‘FVbÊÇ“"í¢DîƒS∞¢6ˆÁ7B7É"“wÇ“6’5ÇÇì∞¢ñbá7É"¬”3#«¬7É"‚#Éí&WGW&„∞¢6ˆÁ7BG2“ÊV%∆ÊRÚwÇ¢7É#∞¢6ˆÁ7Bwí“ÊV%∆ÊRÚwí¢wí“6’5íÇì∞¢6ˆÁ7BÊV"“÷FÇÊ'2á∆ñW"ÁÇ≤∆ñW"ÁrÚ"“vFUv˜&∆EÇÜFVbíí¬3∞¢ÚÚDÑRıT‚‘ıTÂB$TƒÙ‰u2DÚDÑRDÙı"‚óBW6VBFÚ&RˆÊRÁV÷&W"ˆ‚r¬vÜñ6Ä¢ÚÚv26˜'&V7BvÜñ∆R&ˆˆ“ÜBˆÊRFˆ˜"ÊBw&ˆÊrFÜR÷ˆ÷VÁBóBÜBGvÛ†¢ÚÚ7FÊFñÊrBVóFÜW"ˆÊR˜VÊVB&˜FÇ‡¢6ˆÁ7Bv∆∂ñÊr“ÑrÊvFUv∆≤bbrÊvFUv∆≤ÊFVb””“FVbì∞¢6ˆÁ7BvÁB“v∆∂ñÊrÚ¢ÊV"Ú„B¢∞¢FVbÂˆ≤“ÜFVbÂˆ≤”“ÁV∆¬Ú¢FVbÂˆ≤í≤ávÁB“ÜFVbÂˆ≤«¬íí¢áv∆∂ñÊrÚ„r¢„Bì∞¢6ˆÁ7B≤“rÂˆFˆ˜$≤“FVbÂˆ≥∞¢ÚÚDÑRuT$Dî‚DÙı%2tT"DÑTï"‘ÙÂT‘TÂE2Ü˜vÊW"¬##b”Ç”#í¬Üˆ∆FñÊrÜó0¢ÚÚ˜v‚∆ñ'&'íW¢'váí&V‚wBñ˜RW6ñÊrÁíˆbFÜ˜6SÚ"í‚FÜRfófRfó&V@¢ÚÚ*s&bvFW2vW&R∂WñVBÊB$T4Ñ$ƒR¬FÜV‚FÜR÷˜&ÊñÊrw2Fˆ˜"&W6áVff∆P¢ÚÚ÷FRWfW'íwV&Fñ‚w&˜GFÚ6fR&ˆˆ“(	BÊBFÜR6fR'&Ê6Ç&V∆˜r'VÁ0¢ÚÚfó'7B¬6Ú∆¬fófR÷ˆÁV÷VÁG2&V6÷RFV6∆&VB÷ÊB÷ÊWfW"÷G&v‚¬vÜñ6Çó0¢ÚÚFÜRWÜ7B*srfñ«W&RFÜR&ñ&∆RÊ÷W2‚wV&Fñ‚w2Fá&W6Üˆ∆Bó2'Vñ«@¢ÚÚ‘ÙÂT‘TÂB(	BFÜR6&∆Ró&ó2¬FÜRgW&Ê6RÜ˜'6W6ÜˆR¬FÜR&ˆÊR&6Ç(	BÊ@¢ÚÚˆÊ«íFÜR˜&FñÊ'í&ˆ6≤76vW2&R÷˜WFá2‚6Û¢7FÊFñÊrıUE4îDR¬B¢ÚÚFˆ˜"ñÁFÚwV&Fñ‚w&˜GFÚ¬FÜR∂ñÊvFˆ“w2˜v‚vFR7FÊG3≤g&ˆ“ñÁ6ñFP¢ÚÚFÜRw&˜GFÚ¬ÊBBWfW'í∆ñ‚6fR¬FÜR÷˜WFÇf÷ñ«í∂VW2FÜR¶ˆ"‡¢6ˆÁ7BFW7B“GóVˆb$ÙÙ’2”“wVÊFVfñÊVBrbb$ÙÙ’5∂FVbÁFı”∞¢6ˆÁ7BwV&DFˆ˜"“FW7BbbFW7BÊ6fRbbÑrÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÊ6fRê¢bbFVbÁFÚbbFVbÁFı≥“””“trs∞¢6ˆÁ7Bwß“wV&DFˆ˜"bbtDUıƒDUÙ%ïı§Ù‰U¥rÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÁ¶ˆÊU”∞¢6ˆÁ7Bw¶ñ““wßbb66VÊU∆FRÜwßì∞¢ÚÚDÑR‘T5U$T‘TÂBÑÙÙ≤‚FW7G2ˆ∂ñÊvFˆ“Ê6ß26∑2vÜB6Ü&RˆbFˆ˜"ó2óG0¢ÚÚ∆FR'í6Üˆ˜FñÊrFÜRFˆ˜"vóFÇFÜR∆FRÊBvóFÜ˜WBóB‚vóFÜ˜WBóB¬¢ÚÚwV&Fñ‚vFRf∆«2&6≤FÚFÜR&ˆ6VGW&¬6fR÷˜WFÇ(	BvÜñ6Çf˜"F&∞¢ÚÚ&ˆ6≤∆FR∆ñ∂RvFTFVWó2ÊV&«íFÜR6÷Rñ7GW&R¬6ÚFÜRFñffW&VÊ6P¢ÚÚ&VB2#2RˆbFÜRFˆ˜"ó2FÜR∆FR"vÜñ∆RFÜR∆FRv2G&vñÊrvÜˆ∆R‡¢ÚÚVÊFW"rÊ'E&ˆ&RFV6∆&VB÷'WB÷÷ó76ñÊr∆FRG&w2Ê˜FÜñÊr¬6ÚFÜP¢ÚÚFñffW&VÊ6Ró2FÜR∆FRóG6V∆b¬Ê˜BFÜR∆FRvñÁ7BóG27FÊB÷ñ‚‡¢ñbÜwßbbw¶ñ“bbrÊ'E&ˆ&Rí&WGW&„∞¢ñbÜw¶ñ“í∞¢6ˆÁ7BtÇ“33¬ur“tÇ¢Üw¶ñ“ÊÊGW&≈vñGFÇÚw¶ñ“ÊÊGW&ƒÜVñváBì∞¢2Á6fRÇì∞¢2ÊG&tñ÷vRÜw¶ñ“¬G2“urÚ"¬wí“tÇ¬ur¬tÇì∞¢ÚÚFÜR∂ñÊvFˆ“w2˜v‚∆ñváBv∂ñÊrñ‚FÜR˜VÊñÊr26ÜRÊV'0¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7Bˆr“2Ê7&VFU&Fñƒw&FñVÁBÜG2¬wí“tÇ¢„3"¬b¬G2¬wí“tÇ¢„3"¬tÇ¢„CRì∞¢ˆrÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#SR√#SR¬r≤É„b≤≤¢„#"í≤rírì∞¢ˆrÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#SR√#SR√írì∞¢2Êfñ∆≈7Gñ∆R“ˆs∞¢2Êfñ∆≈&V7BÜG2“urÚ"¬wí“tÇ¬ur¬tÇì∞¢2Á&W7F˜&RÇì∞¢7G'V7D&V6ˆ‚ÜG2¬wí¬#¬#s"¬≤¬ì∞¢&WGW&„∞¢–¢ÚÚ6fRˆ‚TïDÑU"6ñFRˆbFÜR76vS¢óBó2÷˜WFÇ¬Ê˜BFˆ˜ ¢ñbÇÑrÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÊ6fRí«¬ÜFW7BbbFW7BÊ6fRíí∞¢ÚÚFÜRFVFñ6FVB&ˆˆ“ñÁFñÊr«&VGí6ˆÁFñÁ2FÜó2WÜ7B˜VÊñÊr‡¢ÚÚG&vñÊr6V6ˆÊB÷˜WFÇ˜fW"óB7&VFW2FÜR7FVB÷ˆ‚∆ñW"&W˜'FVB'ê¢ÚÚFÜR˜vÊW"‚'V&&∆RÊBFÜRñÁFW&7Fñˆ‚&V÷ñ‚BóG26Ü&VBv˜&∆BÊ6Ü˜"‡¢6ˆÁ7B˜v„’$ÙÙ’ıdï5D¥rÁ&ˆˆ‘ñE”∞¢ñbÜFVbÊwÇ÷ÁV∆¬bb˜v‚bbrÂ˜fó7F&ˆˆ”””‘rÁ&ˆˆ‘ñBbb‘TDîı$u∂˜vÂ“í&WGW&„∞¢ÚÚ‚‚ÊÊBFÜR÷˜WFÇó2Fˆ∆BvÜWFÜW"óBó24ÑÙ¥TB¬&V6W6R76vR6∂V@¢ÚÚvóFÇ&ˆ6≤FˆW2Ê˜B6Ü˜róG2ñÁFW&ñ˜"á6VRG&t6fT÷˜WFÇí‡¢G&t6fT÷˜WFÇÜG2¬wí¬¬≤¬áGóVˆb'V&&∆Tf˜"””“vgVÊ7Fñˆ‚rbb'V&&∆Tf˜"ÜFVbííì∞¢7G'V7D&V6ˆ‚ÜG2¬wí¬#¬#s"¬≤¬ì≤&WGW&„∞¢–¢ÚÚ&ˆ˜FÇó25Dƒ¬¬Ê˜B÷ˆÁV÷VÁB(	BFÜRG&FW"w2∂ñ˜6≤ˆ‚FÜR÷VF˜p¢ñbÜFVbÁ7Gñ∆R””“v&ˆ˜FÇrí≤G&t&ˆ˜FÇÜG2¬wí¬¬≤ì≤&WGW&„≤–¢ÚÚ‚‚ÊÊBFÜR˜&6∆Rw26á&ñÊRó2ÑU%3¢6÷RFWFÇ÷Fˆ˜"÷V6ÜÊñ72¬óG2˜v‡¢ÚÚ&ˆGí¬6ÚFÜRG&FW"w2∆FRÊWfW"7FÊG2ñ‚FÜR6ˆÊGVóG0¢ñbÜFVbÁ7Gñ∆R””“v˜&6∆Rrí≤G&t˜&6∆T&ˆ˜FÇÜG2¬wí¬¬≤ì≤7G'V7D&V6ˆ‚ÜG2¬wí¬#¬#3b¬≤ì≤&WGW&„≤–¢ÚÚ‚‚ÊÊBFÜRFñÊ∂W"w2VVÊ6ÇÜˆˆBó2Ñï2(	BFÜRf˜VÊG'íw2˜v‚gW&ÊóGW&R¿¢ÚÚFÜRf˜VÊG'íw2˜v‚∆ñvá@¢ñbÜFVbÁ7Gñ∆R””“vf˜&vRrí≤G&uFñÊ∂W$f˜&vRÜG2¬wí¬¬≤ì≤7G'V7D&V6ˆ‚ÜG2¬wí¬#¬#3b¬≤ì≤&WGW&„≤–¢ÚÚ‚‚ÊÊBFÜR6vRw26'&V¬ó2FÜR4tRu2(	BFÜR&6ÜófW2r˜v‚gW&ÊóGW&R¿¢ÚÚFÜR&6Üófó7Bw2˜v‚&VFñÊr∆ñvá@¢ñbÜFVbÁ7Gñ∆R””“v6'&V¬rí≤G&u6vT6'&V¬ÜG2¬wí¬¬≤ì≤7G'V7D&V6ˆ‚ÜG2¬wí¬#¬#3b¬≤ì≤&WGW&„≤–¢ÚÚ‚‚ÊÊBFÜRÁñ◊Çw2Üˆ∆∆˜ró2≈T‘T‚u2(	BFÜRÊW7Bw2˜v‚Fó77VR¬v˜fV‚¿¢ÚÚÊBFÜRˆÊRFˆ˜"ñ‚FÜRv÷R∆óB∆Vb÷w&VV‡¢ñbÜFVbÁ7Gñ∆R””“vÜˆ∆∆˜rrí≤G&t«V÷V‰Üˆ∆∆˜rÜG2¬wí¬¬≤ì≤7G'V7D&V6ˆ‚ÜG2¬wí¬#¬#3b¬≤ì≤&WGW&„≤–¢ÚÚ‚‚ÊÊBFÜR7WGFW"w2∂W&bó2¥U$bu2(	BFÜR66ÜRw2˜v‚&ˆ6≤¬7∆óBˆÊ6R¿¢ÚÚÊBFÜRˆÊ«íFˆ˜"ñ‚FÜRv÷R∆óB'íFÜRW&ñfñW"w2˜v‚vÜóFP¢ñbÜFVbÁ7Gñ∆R””“v∂W&brí≤G&t∂W&e7FˆÊRÜG2¬wí¬¬≤ì≤7G'V7D&V6ˆ‚ÜG2¬wí¬#¬#3b¬≤ì≤&WGW&„≤–¢ÚÚDÑR§Ù‰RtDU2å*s&bì¢WfW'í∂ñÊvFˆ“w2FWFÇFˆ˜"ó2óG2˜v‚fó&V@¢ÚÚ÷ˆÁV÷VÁB(	BgW&Ê6R&6Ç¬'FVB6ÜV∆b◊7F6≤¬6&∆Ró&ó2¬F∆ˆ‡¢ÚÚ&6Ç¬‚˜&vÊñ2ó&ó2(	BÊBÙ‰≈íFÜR6óGí∂VW2FÜR6ˆ∆˜76¬◊V«Fñ∆ñW ¢ÚÚ÷ˆÁV÷VÁB&V∆˜rÜ˜vÊW"w2˜&FW"í‚VÁFñ¬¶ˆÊRw2∆FR'&ófW2FÜR&ˆˆ–¢ÚÚf∆«2Fá&˜VvÇFÚFÜR÷ˆÁV÷VÁB¬vÜñ6Çó2vÜBóBG&WrñW7FW&Fí‡¢ñbÑrÁ&ˆˆ‘ñB”“us"rí∞¢6ˆÁ7Bw∆FR“tDUıƒDUÙ%ïı§Ù‰U¥rÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÁ¶ˆÊU”∞¢6ˆÁ7Bvñ““w∆FRbb66VÊU∆FRÜw∆FRì∞¢ñbÜvñ“í∞¢6ˆÁ7BtÇ“33¬ur“tÇ¢Üvñ“ÊÊGW&≈vñGFÇÚvñ“ÊÊGW&ƒÜVñváBì∞¢2Á6fRÇì∞¢2ÊG&tñ÷vRÜvñ“¬G2“urÚ"¬wí“tÇ¬ur¬tÇì∞¢ÚÚFÜR∂ñÊvFˆ“w2˜v‚∆ñváBv∂ñÊrñ‚FÜR˜VÊñÊr26ÜRÊV'0¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7Bˆr“2Ê7&VFU&Fñƒw&FñVÁBÜG2¬wí“tÇ¢„3"¬b¬G2¬wí“tÇ¢„3"¬tÇ¢„CRì∞¢ˆrÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#SR√#SR¬r≤É„b≤≤¢„#"í≤rírì∞¢ˆrÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#SR√#SR√írì∞¢2Êfñ∆≈7Gñ∆R“ˆs∞¢2Êfñ∆≈&V7BÜG2“urÚ"¬wí“tÇ¬ur¬tÇì∞¢2Á&W7F˜&RÇì∞¢&WGW&„∞¢–¢–¢6ˆÁ7B7É"“G3∞¢ÚÚDÑR4ïEítDRï2DÑR‘ÙÂT‘TÂBÜ˜vÊW#¢&ˆÊ«íFÜR6óGívFR6Ü˜V∆B&P¢ÚÚáVvRÊBWñ2vóFÇ◊V«Fí∆ñW'2ÊBñÁ67&óFñˆÁ2ÊB6ÜW2(	BóBw2¢ÚÚgWGW&ó7Fñ2&ˆ&˜B6óGívFR"í‚WfW'í6fR76vRF∂W2FÜR÷˜WFÇ¬6¢ÚÚFÜó27G'V7GW&RÊ˜r&V∆ˆÊw2FÚˆÊR∆6RÊB6‚ff˜&BFÚ&R6ˆ∆˜76√†¢ÚÚFá&VRFWFÇ∆ñW'2ˆb&6ÜóFV7GW&R¬v«óÇñÁ67&óFñˆÁ2'W&ÊñÊrˆ‚FÜP¢ÚÚ∆ñÁFV¬ÊB∆VfW2¬6ó&7VóBG&6W2¬7∆óBó&ó2V÷&∆V“vÜW&RFÜRGv¢ÚÚ∆VfW2÷VWB¬ÊBFW&VB7ó&W2vñÁ7BFÜR6∑í‡¢6ˆÁ7BÉ2“C¬s2“#b¬tr“#c∞¢∆WBvÇ“#cc3c#c„„‚∞¢f˜"Ü6ˆÁ7B6Çˆbv6óGñvFRrí≤vÇ„“6ÇÊ6Ü$6ˆFTBÉì≤vÇ“÷FÇÊñ◊V¬ÜvÇ¬cssscíì≤–¢6ˆÁ7Bw&ÊB“Çí”‚ÇÜvÇ“÷FÇÊñ◊V¬ÜvÇ‚ÜvÇ„„‚Rí¬##CcÉ##Síí„„‚íRíÚ∞¢2Á6fRÇì∞¢ÚÚ““““∆ñW"¢FÜR7WW"÷&6Ç¬FVWW7B&ˆÊW2vñÁ7BFÜR6∑í“““–¢2Êv∆ˆ&ƒ«Ü“„3S∞¢2Êfñ∆≈7Gñ∆R“r3ís∞¢2Êfñ∆≈&V7BÜG2“s2“tr“ì"¬wí“É2“S¬3B¬É2≤Sì∞¢2Êfñ∆≈&V7BÜG2≤s2≤tr≤SÇ¬wí“É2“S¬3B¬É2≤Sì∞¢2Êfñ∆≈&V7BÜG2“s2“tr“ì"¬wí“É2“S¬Ös2≤tr≤ì"í¢"¬#bì∞¢ÚÚ““““∆ñW"¢FÜR6ˆ∆˜76¬&6Ç¬FÜRFñ÷÷W"÷ñFF∆R&ˆÊW2“““–¢2Êv∆ˆ&ƒ«Ü“„SS∞¢6ˆÁ7B&6Ç“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬wí“É2“ì¬¬wíì∞¢&6ÇÊFD6ˆ∆˜%7F˜É¬r3crì≤&6ÇÊFD6ˆ∆˜%7F˜É¬r3É#2rì∞¢2Êfñ∆≈7Gñ∆R“&6É∞¢2Êfñ∆≈&V7BÜG2“s2“tr“Cb¬wí“É2“ì¬C¬É2≤ìì∞¢2Êfñ∆≈&V7BÜG2≤s2≤tr≤b¬wí“É2“ì¬C¬É2≤ìì∞¢2Êfñ∆≈&V7BÜG2“s2“tr“Cb¬wí“É2“ì¬Ös2≤tr≤Cbí¢"¬3Bì∞¢2Êv∆ˆ&ƒ«Ü“∞¢ÚÚ““““∆ñW"#¢FÜRg&÷R¬vóFÇ7ó&W2“““–¢6ˆÁ7Bñ¬“áÉ¬f∆óí”‚∞¢6ˆÁ7Bs"“2Ê7&VFT∆ñÊV$w&FñVÁBáÉ¬¬É≤3¢f∆ó¬ì∞¢s"ÊFD6ˆ∆˜%7F˜É¬r3##S3rì≤s"ÊFD6ˆ∆˜%7F˜É„r¬r33#rì≤s"ÊFD6ˆ∆˜%7F˜É¬r3s#rì∞¢2Êfñ∆≈7Gñ∆R“s#∞¢2Êfñ∆≈&V7BÑ÷FÇÊ÷ñ‚áÉ¬É≤3¢f∆óí¬wí“É2“Cb¬3¬É2≤Cbì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&Éc√#√#3√„#Rís≤2Ê∆ñÊUvñGFÇ“„S∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚáÉ¬wí“É2“Cbì≤2Ê∆ñÊUFÚáÉ¬wíì≤2Á7G&ˆ∂RÇì∞¢ÚÚFW&VB7ó&RˆfbV6Çñ∆ˆ‚7&˜v‚(	BÁFVÊÊRˆb÷6ÜñÊR6óGê¢2Êfñ∆≈7Gñ∆R“r3SC2s∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚáÉ≤"¢f∆ó¬wí“É2“Cbì∞¢2Ê∆ñÊUFÚáÉ≤2¢f∆ó¬wí“É2“Çì∞¢2Ê∆ñÊUFÚáÉ≤#"¢f∆ó¬wí“É2“Cbì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“Êv∆˜s≤2Êv∆ˆ&ƒ«Ü“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚsí¢„3∞¢2Ê&VvñÂFÇÇì≤2Ê&2áÉ≤2¢f∆ó¬wí“É2“#¬"„b¬¬rì≤2Êfñ∆¬Çì∞¢2Êv∆ˆ&ƒ«Ü“∞¢”∞¢ñ¬Ü7É"“s2“tr¬”ì∞¢ñ¬Ü7É"≤s2≤tr¬ì∞¢ÚÚFÜR∆ñÁFV¬¬vóFÇóG2v∆˜r6V“ÊBDÑRîÂ45$ïDîÙ‚(	B6˜W'6Rˆ`¢ÚÚ÷6ÜñÊRv«óá2'W&ÊñÊr7&˜72FÜRvÜˆ∆R&V–¢6ˆÁ7B∆ñ‚“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬wí“É2“cB¬¬wí“É2“ì∞¢∆ñ‚ÊFD6ˆ∆˜%7F˜É¬r3SÉBrì≤∆ñ‚ÊFD6ˆ∆˜%7F˜É„b¬r3CC#írì≤∆ñ‚ÊFD6ˆ∆˜%7F˜É¬r3rrì∞¢2Êfñ∆≈7Gñ∆R“∆ñ„∞¢2Êfñ∆≈&V7BÜ7É"“s2“tr“3¬wí“É2“cB¬Ös2≤tr≤3í¢"¬SBì∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Êv∆ˆ&ƒ«Ü“„3R≤≤¢„C∞¢2Êfñ∆≈7Gñ∆R“Êv∆˜s∞¢2Êfñ∆≈&V7BÜ7É"“s2“tr“#¬wí“É2“b¬Ös2≤tr≤#í¢"¬"„Rì∞¢2Á7G&ˆ∂U7Gñ∆R“Êv∆˜s≤2Ê∆ñÊUvñGFÇ“„c∞¢2Êv∆ˆ&ƒ«Ü“„B≤≤¢„3R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚìí¢„∞¢f˜"Ü∆WBví“”c≤ví√“c≤ví≤≤í∞¢6ˆÁ7BwÉ"“7É"≤ví¢#"¬wóí“wí“É2“C∞¢2Ê&VvñÂFÇÇì∞¢6ˆÁ7B∂ñÊB“Üví≤cíRC∞¢ñbÜ∂ñÊB””“í≤2Ê÷˜fUFÚÜwÉ"“R¬wóí≤bì≤2Ê∆ñÊUFÚÜwÉ"¬wóí“bì≤2Ê∆ñÊUFÚÜwÉ"≤R¬wóí≤bì≤–¢V«6RñbÜ∂ñÊB””“í≤2Ê&2ÜwÉ"¬wóí¬R„R¬„b¬R„rì≤–¢V«6RñbÜ∂ñÊB””“"í≤2Ê÷˜fUFÚÜwÉ"“R¬wóí“Rì≤2Ê∆ñÊUFÚÜwÉ"≤R¬wóí“Rì≤2Ê÷˜fUFÚÜwÉ"¬wóí“Rì≤2Ê∆ñÊUFÚÜwÉ"¬wóí≤rì≤–¢V«6R≤2Ê÷˜fUFÚÜwÉ"“R¬wóíì≤2Ê∆ñÊUFÚÜwÉ"¬wóí“bì≤2Ê∆ñÊUFÚÜwÉ"≤R¬wóíì≤2Ê∆ñÊUFÚÜwÉ"¬wóí≤bì≤2Ê6∆˜6UFÇÇì≤–¢2Á7G&ˆ∂RÇì∞¢–¢2Á&W7F˜&RÇì∞¢ÚÚ““““FÜRƒTdU2(	BFÜWí6∆ñFRñÁFÚFÜRñ∆ˆÁ22≤˜VÁ2“““–¢6ˆÁ7B6∆ñFR“≤¢Ös2“bì∞¢f˜"Ü6ˆÁ7B2ˆb≤”¬“í∞¢6ˆÁ7BñÊÊW"“7É"≤2¢Ñtr¢„3"≤6∆ñFRì≤ÚÚFÜR7&6≤VFvP¢6ˆÁ7B˜WFW"“ñÊÊW"≤2¢s3∞¢6ˆÁ7B∆r“2Ê7&VFT∆ñÊV$w&FñVÁBÜñÊÊW"¬¬˜WFW"¬ì∞¢∆rÊFD6ˆ∆˜%7F˜É¬r3&6F2rì≤∆rÊFD6ˆ∆˜%7F˜É„#R¬r3É#C3"rì∞¢∆rÊFD6ˆ∆˜%7F˜É„ÉR¬r3##írì≤∆rÊFD6ˆ∆˜%7F˜É¬r3s#rì∞¢2Êfñ∆≈7Gñ∆R“∆s∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜñÊÊW"¬wíì∞¢2Ê∆ñÊUFÚÜñÊÊW"¬wí“É2≤Çì∞¢2Ê∆ñÊUFÚÜñÊÊW"≤2¢B¬wí“É2“Çì≤ÚÚFÜR∆Vb7&˜vÁ2∆V‚ñ‡¢2Ê∆ñÊUFÚÜ˜WFW"¬wí“É2“Çì∞¢2Ê∆ñÊUFÚÜ˜WFW"¬wíì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÚÚÊV¬&ñ'2(	BFÜR&V∆ñVbFÜB÷∂W2óB&VB2÷72¬Ê˜B&V7FÊv∆P¢2Á7G&ˆ∂U7Gñ∆R“w&v&É√√√„Rís≤2Ê∆ñÊUvñGFÇ“#∞¢f˜"Ü∆WB#"“≤#"√“3≤#"≤≤í∞¢6ˆÁ7B'Ç“ñÊÊW"≤2¢Ös2¢#"ÚBì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚá'Ç¬wí“Çì≤2Ê∆ñÊUFÚá'Ç¬wí“É2≤Bì≤2Á7G&ˆ∂RÇì∞¢–¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉS√ì√##R√„bís≤2Ê∆ñÊUvñGFÇ“∞¢f˜"Ü∆WB#"“≤#"√“3≤#"≤≤í∞¢6ˆÁ7B'Ç“ñÊÊW"≤2¢Ös2¢#"ÚBí≤2¢#∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚá'Ç¬wí“Çì≤2Ê∆ñÊUFÚá'Ç¬wí“É2≤Bì≤2Á7G&ˆ∂RÇì∞¢–¢ÚÚFÜR∆óBñÊÊW"VFvRˆbV6Ç∆Vb(	BFÜR7&6≤ó2vÜW&RFÜR∆ñváB∆ófW0¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#√#3√#SR√„Rís≤2Ê∆ñÊUvñGFÇ“„c∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜñÊÊW"¬wíì≤2Ê∆ñÊUFÚÜñÊÊW"¬wí“É2≤Çì≤2Á7G&ˆ∂RÇì∞¢ÚÚ4ï$5TïBE$4U2(	BñÁ67&óFñˆÁ2WF6ÜVBñÁFÚFÜR÷WF¬¬fñÁF«í∆ófR‡¢ÚÚ6VVFVBˆ«ñ∆ñÊW2FÜB7FWˆÊ«íÜ˜&ó¶ˆÁF∆«í˜fW'Fñ6∆«í¬∆ñ∂R&ˆ&@¢ÚÚG&6W2¬V6ÇVÊFñÊrñ‚fñF˜B‡¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Á7G&ˆ∂U7Gñ∆R“Êv∆˜s≤2Êfñ∆≈7Gñ∆R“Êv∆˜s≤2Ê∆ñÊUvñGFÇ“„∞¢2Êv∆ˆ&ƒ«Ü“„b≤≤¢„#S∞¢f˜"Ü∆WBC"“≤C"¬c≤C"≤≤í∞¢∆WBÉ"“ñÊÊW"≤2¢É≤w&ÊBÇí¢Ös2“#Bíì∞¢∆WBì"“wí“#“w&ÊBÇí¢ÑÉ2“cì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚáÉ"¬ì"ì∞¢f˜"Ü∆WB6Vr“≤6Vr¬C≤6Vr≤≤í∞¢ñbÜw&ÊBÇí¬„RíÉ"≥“2¢ÉÇ≤w&ÊBÇí¢#"í¢Üw&ÊBÇí¬„RÚ¢”ì∞¢V«6Rì"”“É≤w&ÊBÇí¢#bí¢Üw&ÊBÇí¬„RÚ¢”ì∞¢É"“÷FÇÊ÷ÇÑ÷FÇÊ÷ñ‚áÉ"¬÷FÇÊ÷ÇÜñÊÊW"¬˜WFW"í“bí¬÷FÇÊ÷ñ‚ÜñÊÊW"¬˜WFW"í≤bì∞¢2Ê∆ñÊUFÚáÉ"¬ì"ì∞¢–¢2Á7G&ˆ∂RÇì∞¢2Ê&VvñÂFÇÇì≤2Ê&2áÉ"¬ì"¬"¬¬rì≤2Êfñ∆¬Çì∞¢–¢ÚÚ&ófWB7GVG2F˜v‚FÜR˜WFW"&Ê@¢2Êv∆ˆ&ƒ«Ü“„3∞¢f˜"Ü∆WB'b“≤'b¬s≤'b≤≤í∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ü˜WFW"“2¢Ç¬wí“#b“'b¢ÑÉ2“SíÚb¬„Ç¬¬rì≤2Êfñ∆¬Çì∞¢–¢ÚÚDÑR5ƒïBï$ï2T‘$ƒT“(	BÜ∆bw&VB&ñÊvVB6ó&6∆Rˆ‚V6Ç∆Vb¬vÜˆ∆P¢ÚÚˆÊ«ívÜV‚FÜRvFRó26áWB¬'FñÊrvóFÇFÜR∆VfW22FÜWí˜V‡¢2Êv∆ˆ&ƒ«Ü“„R≤≤¢„3∞¢2Ê∆ñÊUvñGFÇ“"„#∞¢6ˆÁ7BWí“wí“É2¢„Sc∞¢f˜"Ü6ˆÁ7BW"ˆb≥CB¬3“í∞¢2Ê&VvñÂFÇÇì∞¢2Ê&2ÜñÊÊW"¬Wí¬W"¬2””“”Ú÷FÇÂíÚ"¢‘÷FÇÂíÚ"¬2””“”Ú÷FÇÂí¢„R¢÷FÇÂíÚ"ì∞¢2Á7G&ˆ∂RÇì∞¢–¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜñÊÊW"¬Wí“bì≤2Ê∆ñÊUFÚÜñÊÊW"¬Wí≤bì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢–¢ÚÚ““““FÜR∆ñváBFá&˜VvÇFÜR˜VÊñÊr“““–¢6ˆÁ7BvÊ˜r“tr¢„3"≤6∆ñFS∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7B7ñ∆¬“2Ê7&VFT∆ñÊV$w&FñVÁBÜ7É"¬wí“É2¬7É"¬wíì∞¢7ñ∆¬ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√##b√c¬r≤É„≤≤¢„Rí≤rírì∞¢7ñ∆¬ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#√¬r≤É„R≤≤¢„2í≤rírì∞¢2Êfñ∆≈7Gñ∆R“7ñ∆√∞¢2Êfñ∆≈&V7BÜ7É"“vÊ˜r¬wí“É2≤B¬vÊ˜r¢"¬É2“Bì∞¢ÚÚÊBóBˆˆ«2ˆ‚FÜRw&˜VÊBvÜV‚FÜRFˆ˜'27FÊB˜V‡¢ñbÜ≤‚„Rí∞¢6ˆÁ7Bˆˆ¬“2Ê7&VFU&Fñƒw&FñVÁBÜ7É"¬wí¬b¬7É"¬wí¬ì≤≤¢#ì∞¢ˆˆ¬ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√##√S¬r≤É„#"¢≤í≤rírì∞¢ˆˆ¬ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#√√írì∞¢2Êfñ∆≈7Gñ∆R“ˆˆ√∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ7É"¬wí¬ì≤≤¢#¬#"≤≤¢¬¬¬rì≤2Êfñ∆¬Çì∞¢–¢2Á&W7F˜&RÇì∞¢2Á&W7F˜&RÇì∞ß–¢ÚÚ““““““““““DÑR%U$îTB‘ıUDÇ““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚFÜR˜vÊW"¬##b”Ç”#3¢'FÜRfó'7B6fR˜"GVÊÊV¬FÜBíf6RÊVVG2FÚ&P¢ÚÚ6˜fW&VBvóFÇ'V&&∆W2¬ÊBóB6Ü˜V∆BV÷óB6˜VÊBg&ˆ“vóFÜñ‚FÜBGG&7G0¢ÚÚ÷RFÚvÚFÜW&R‚‚‚íÜfRFÚvÚÊBÜóBFÜR'V&&∆RFÚvÚñÁ6ñFR‚ ¢Ú¢ÚÚ6ÚFÜRfó'7BGVÊÊV¬ó2Ê˜BFˆ˜"6ÜRv∆∑2ñÁFÚ(	BóBó2tƒ¬6ÜRÜV'0¢ÚÚFá&˜VvÇ‚Fá&VR'G2¬ÊBV6Ç6'&ñW2FÜó&BˆbFÜRñFV†¢ÚÚ‚ñ∆RvóFÇÖFÜBÁ7vW'2FÚFÜR&∆FR(	B'V&&∆TÜóBÇê¢ÚÚ"‚fˆñ6Rg&ˆ“&VÜñÊBóBvÜ˜6R∆˜VFÊW72ï2Fó7FÊ6R(	BFñ6¥6fT«W&RÇê¢ÚÚ2‚vFRFÜB&VgW6W2FÜRv∆≤÷ñ‚VÁFñ¬óBó2vˆÊR(	BvFTVÁFW"Çê¢ÚÚóB&ñFW2ˆ‚tDUı$ÙÙ“Ü'V&&∆VÊ÷W2óG26fRf∆rí&FÜW"FÜ‚&VñÊr¢ÚÚ&ˆˆ“VÁFóGí¬&V6W6RFÜRñ∆RÜ2FÚ7FÊBWÜ7F«ívÜW&RFÜRFˆ˜"7FÊG2‡¢ÚÚGvÚ∆6W2f˜"ˆÊRFÜñÊró2FÜR'VrFÜB÷FRFÜRFˆ˜'26∆ñFRñ‚FÜRfó'7@¢ÚÚ∆6R¬ÊBÜV6Ü˜V∆FW"w2vñGFÇˆfbóG2˜v‚÷˜WFÇó2FÜR6÷R'Vr‡¶6ˆÁ7B%T$$ƒUÙÖ“c∞¢ÚÚÙ‰RîƒRU"DÙı"¬&V6W6RFÜW&Ró2÷˜&RFÜ‚ˆÊRFˆ˜"Ê˜s¢áV"6‚'W'ê¢ÚÚóG26ñFR76vRÊB∆VfRóG2÷ñ‚ví˜V‚¬vÜñ6Çó2÷˜7BˆbvÜB÷∂W2¢ÚÚ'&Ê6Çv˜'FÇfñÊFñÊr‡¶gVÊ7Fñˆ‚'V&&∆Tf˜"ÜFVbí∞¢ñbÇFVb«¬FVbÁ'V&&∆R«¬rÁ'V&&∆W2í&WGW&‚ÁV∆√∞¢f˜"Ü6ˆÁ7B"ˆbrÁ'V&&∆W2íñbá"Êf∆r””“FVbÁ'V&&∆Rbb"Êá‚í&WGW&‚#∞¢&WGW&‚ÁV∆√∞ß–¶gVÊ7Fñˆ‚'V&&∆TñÊóBÇí∞¢rÁ'V&&∆W2“µ”∞¢rÁ'V&&∆R“ÁV∆√∞¢ñbÇrÁ&ˆˆ‘FVbí&WGW&„∞¢f˜"Ü6ˆÁ7BrˆbvFTFˆ˜'2Çíí∞¢ñbÇrÁ'V&&∆Rí6ˆÁFñÁVS∞¢ñbÑrÁ6fRbbrÁ6fRÊf∆w2bbrÁ6fRÊf∆w5∂rÁ'V&&∆U“í6ˆÁFñÁVS≤ÚÚ«&VGí˜VÊV@¢ÚÚ6VVFVBˆfbFÜRFˆ˜"¬6ÚóBó2FÜR4‘Rñ∆RWfW'ífó6óB‚ÜVFÜ@¢ÚÚ&W6áVff∆W2ˆ‚&R÷VÁG'í&VG22vVFÜW"¬Ê˜B2&ˆ6≤¬ÊBv∆¬6ÜRó0¢ÚÚ÷VÁBFÚ&V÷V÷&W"ÜóGFñÊr◊W7B∆ˆˆ≤∆ñ∂RFÜRv∆¬6ÜRÜóB‡¢∆WBÇ“#cc3c#c„„‚∞¢f˜"Ü6ˆÁ7B6ÇˆbrÁ&ˆˆ‘ñB≤w¬r≤rÁ'V&&∆Rí≤Ç„“6ÇÊ6Ü$6ˆFTBÉì≤Ç“÷FÇÊñ◊V¬ÜÇ¬cssscíì≤–¢rÁ'V&&∆W2ÁW6Çá≤f∆s¢rÁ'V&&∆R¬Fˆ˜#¢r¬á¢%T$$ƒUÙÖ¬÷É¢%T$$ƒUÙÖ¿¢É¢vFUv˜&∆EÇÜrí¬ì¢ÑrÁ&ˆˆ‘FVbÊÇ“"í¢DîƒR¿¢6Ü∂S¢¬GW7C¢¬Fˆ∆C¢¬6VVC¢Ç„„‚¬C¢“ì∞¢–¢ÚÚFÜRˆÊR6ÜRó2ÊV&W7BFÚ¬∂WBf˜"WfW'óFÜñÊrFÜBˆÊ«íWfW"FV«2vóFÄ¢ÚÚFÜRñ∆Rñ‚g&ˆÁBˆbÜW ¢rÁ'V&&∆R“rÁ'V&&∆W5≥“«¬ÁV∆√∞ß–¢ÚÚDÑRîƒR5D‰E2Ù‚DÑRu$ıT‰B4ÑR5D‰E2Ù‚‚FÜRvFRw2˜v‚Ê6Ü˜"ó2FÜP¢ÚÚFñ∆R&˜rÜÇ”"í¬vÜñ6Çó2vÜW&RFÜR$4¥E$ıó2ñÁFVBg&ˆ“(	BÊBFÜP¢ÚÚÜVñváFfñV∆B∆ñgG2FÜRv∆∂&∆R7W&f6R&˜fRFÜBvÜW&WfW"FÜR7W'fR&ó6W2¿¢ÚÚ6ÚÊ6Ü˜&ñÊrFÜRñ∆Rˆ‚FÜRFñ∆R&˜r'W&ñVBóG2&˜GFˆ“FÜó&Bñ‚FW'&ñ‚‡¢ÚÚFÜR&ˆGíw2f∆ˆ˜"ÊBFÜRñ∆Rw2f∆ˆ˜"ÜfRFÚ&RFÜR6÷RÁV÷&W"‡¶gVÊ7Fñˆ‚'V&&∆Tfˆ˜Bá"í∞¢6ˆÁ7Br“áGóVˆbw&˜VÊD6ˆ«V÷‰B””“vgVÊ7Fñˆ‚ríÚw&˜VÊD6ˆ«V÷‰Bá"ÁÇí¢ÁV∆√∞¢&WGW&‚rbbó4Ê‚Üu≥“íÚ÷FÇÊ÷ñ‚á"Áí¬u≥“í¢"Áì∞ß–¶gVÊ7Fñˆ‚'V&&∆T&˜Çá"í∞¢"“"«¬rÁ'V&&∆S≤ñbÇ"í&WGW&‚ÁV∆√∞¢6ˆÁ7Bgí“'V&&∆Tfˆ˜Bá"ì∞¢&WGW&‚≤É¢"ÁÇ“sÇ¬ì¢gí“sÇ¬s¢Sb¬É¢É"”∞ß–¢ÚÚˆÊR7vñÊrF∂W2ˆÊRˆñÁBˆfbFÜRñ∆S≤FÜR7WW&6Ü&vVB'W'7BF∂W2Fá&VR‡¢ÚÚı$Dî‰%í4ƒu2tı$≤(	BFV∆ñ&W&FV«í‚FÜRñ∆∆"FV6ÜW2'6ˆ÷R&ˆ6≤ÊVVG2FÜP¢ÚÚ6Ü&vR"¬ÊB&WVFñÊrFÜB∆W76ˆ‚BFÜRfó'7BGVÊÊV¬v˜V∆BvFRFÜRvÜˆ∆P¢ÚÚ÷&VÜñÊB6∂ñ∆¬ÊWr'V‚÷íÊ˜BÜfR&˜VváBñWB‡¶gVÊ7Fñˆ‚'V&&∆TÜóBÜ&˜Ç¬ÜVgíí∞¢∆WBÁí“f«6S∞¢f˜"Ü6ˆÁ7B"ˆbÑrÁ'V&&∆W2«¬µ“ííñbá'V&&∆TÜóDˆÊRá"¬&˜Ç¬ÜVgíííÁí“G'VS∞¢&WGW&‚Áì∞ß–¶gVÊ7Fñˆ‚'V&&∆TÜóDˆÊRá"¬&˜Ç¬ÜVgíí∞¢ñbÇ"«¬"Êá√“í&WGW&‚f«6S∞¢6ˆÁ7B"“'V&&∆T&˜Çá"ì∞¢ñbÇÜ&˜ÇÁÇ¬"ÁÇ≤"Árbb&˜ÇÁÇ≤&˜ÇÁr‚"ÁÇb`¢&˜ÇÁí¬"Áí≤"ÊÇbb&˜ÇÁí≤&˜ÇÊÇ‚"Áííí&WGW&‚f«6S∞¢"Êá”“ÜVgíÚ2¢∞¢"Á6Ü∂R“÷FÇÊ÷Çá"Á6Ü∂R¬ÜVgíÚ¢„bì∞¢"ÊGW7B“÷FÇÊ÷ñ‚É„R¬"ÊGW7B≤„SRì∞¢6ˆÁ7BÇ“"ÁÇ¬í“"Áí“ìc∞¢6“Á6Ü∂R“÷FÇÊ÷ÇÜ6“Á6Ü∂R¬ÜVgíÚí¢B„"ì∞¢rÊÜóE7F˜“÷FÇÊ÷ÇÑrÊÜóE7F˜¬ÜVgíÚ„sR¢„Rì∞¢ñbáGóVˆbE'V÷&∆R””“vgVÊ7Fñˆ‚ríE'V÷&∆RÜÜVgíÚ„R¢„3"¬„SR¬ÜVgíÚ¢sì∞¢ñbá"Êá‚í∞¢6gÇÇw&ˆ6≤rì∞¢'W'7BáÇ¬í¬"¬r63ñ#sñr¬#¬„SR¬#C¬2¬G'VRì∞¢'W'7BáÇ¬í≤Cb¬r¬r3Ü#vCcÇr¬S¬„Ç¬S¬"„B¬G'VRì∞¢ÚÚóB4ï2Ü˜rf"ñ‚6ÜRó3¢FÜR6˜VÁBó2FÜRˆÊ«íÜˆÊW7B&ˆw&W72&"¢ÚÚ&ˆ6≤ñ∆R6‚ÜfR¬ÊBv∆¬FÜBVG2ÜóG26ñ∆VÁF«í&VG22'Vp¢ñbÇÑrÂ˜'V%Fˆ∆EB«¬í√“í≤rÂ˜'V%Fˆ∆EB“"„#≤rÁFˆ7BáBÇw'V%ˆÜóBríì≤–¢&WGW&‚G'VS∞¢–¢ÚÚDÑRîƒRtïdU2tê¢"Êá“∞¢ñbÑrÁ6fRí≤rÁ6fRÊf∆w2“rÁ6fRÊf∆w2«¬∑”≤rÁ6fRÊf∆w5∑"Êf∆u““≤–¢ñbáGóVˆbW'6ó7B””“vgVÊ7Fñˆ‚ríW'6ó7BÇì∞¢6gÇÇv6ˆ∆∆6Rrì∞¢6“Á6Ü∂R“÷FÇÊ÷ÇÜ6“Á6Ü∂R¬Rì∞¢rÊf∆6Ç“÷FÇÊ÷ÇÑrÊf∆6Ç¬„Rì∞¢rÊÜóE7F˜“÷FÇÊ÷ÇÑrÊÜóE7F˜¬„"ì∞¢ñbáGóVˆbE'V÷&∆R””“vgVÊ7Fñˆ‚ríE'V÷&∆RÉ„Ç¬„í¬3#ì∞¢'W'7BáÇ¬í¬Cb¬r63ñ#sñr¬3É¬„¬3#¬B¬G'VRì∞¢'W'7BáÇ¬í≤C¬3¬r3v3fcV2r¬#c¬„b¬c¬2„B¬G'VRì∞¢'W'7BáÇ¬í“#¬b¬r6ffSf#r¬3¬„r¬C¬2¬G'VRì∞¢rÁFˆ7BáBÇw'V%ˆ˜V‚ríì∞¢ñbáGóVˆbá¶E6í””“vgVÊ7Fñˆ‚ríá¶E6íÇwW'"r¬ì∞¢ÚÚïBdƒ≈2¬óBFˆW2Ê˜BfÊó6Ç‚FÜRvFRó2˜V‚ˆ‚FÜó2g&÷R(	Báó2Ê@¢ÚÚvFTVÁFW"7F˜2&VgW6ñÊr(	B'WBFÜR7FˆÊW2ÊVVBÜ∆b6V6ˆÊBFÚvWB˜WBˆ`¢ÚÚFÜRví¬˜"FÜR&ñvvW7B÷ˆ÷VÁBñ‚FÜR&ˆˆ“ó2ñ∆R&∆ñÊ∂ñÊrˆfb‡¢"Êf∆¬“„c∞¢&WGW&‚G'VS∞ß–¶gVÊ7Fñˆ‚'V&&∆UFñ6≤ÜGBí∞¢rÂ˜'V%Fˆ∆EB“÷FÇÊ÷ÇÉ¬ÑrÂ˜'V%Fˆ∆EB«¬í“GBì∞¢ñbÇrÁ'V&&∆W2«¬rÁ'V&&∆W2Ê∆VÊwFÇí≤rÁ'V&&∆R“ÁV∆√≤&WGW&„≤–¢∆WBÊV"“ÁV∆¬¬ÊB“Sì∞¢f˜"Ü∆WBí“rÁ'V&&∆W2Ê∆VÊwFÇ“≤í„“≤í““í∞¢6ˆÁ7B"“rÁ'V&&∆W5∂ï”∞¢"ÁB≥“GC∞¢ñbá"Êf∆¬“ÁV∆¬í≤"Êf∆¬”“GC≤ñbá"Êf∆¬√“í≤rÁ'V&&∆W2Á7∆ñ6RÜí¬ì≤6ˆÁFñÁVS≤“–¢"Á6Ü∂R“÷FÇÊ÷ÇÉ¬"Á6Ü∂R“GB¢"„bì∞¢"ÊGW7B“÷FÇÊ÷ÇÉ¬"ÊGW7B“GB¢„íì∞¢ñbÇ∆ñW"í6ˆÁFñÁVS∞¢6ˆÁ7BB“÷FÇÊ'2á∆ñW"ÁÇ≤∆ñW"ÁrÚ"“"ÁÇì∞¢ñbÜB¬ÊBí≤ÊB“C≤ÊV"“#≤–¢ÚÚFÜRÁVFvR¬ˆÊ6S¢6ÜRó27FÊFñÊrBÜˆ∆R6ÜR6ÊÊ˜BVÁFW"¬ÊBFÜP¢ÚÚv÷RÜ2ÊWfW"6∂VBÜW"FÚÜóB66VÊW'í&Vf˜&P¢ñbÇ"ÁFˆ∆BbbB¬Sí≤"ÁFˆ∆B“≤rÁFˆ7BáBÇw'V%ˆÜñÁBríì≤–¢–¢rÁ'V&&∆R“ÊV"«¬rÁ'V&&∆W5≥“«¬ÁV∆√∞ß–¢ÚÚDÑRdÙî4Re$Ù“îÂ4îDR‚vñ‚ó2Fó7FÊ6RÊBÊ˜FÜñÊrV«6R¬vÜñ6Çó2vÜB÷∂W0¢ÚÚóB«W&R&FÜW"FÜ‚‚÷&ñVÊ6S¢óBó2VFñ&∆Rg&ˆ“FÜRf"VÊBˆbFÜR&ˆˆ–¢ÚÚÊBóBw&˜w226ÜRv∆∑2¬6ÚFÜR&ˆˆ“FV6ÜW2óG2˜v‚Fó&V7Fñˆ‚‚FÜR&ˆ6∞¢ÚÚ7Fñ∆¬◊Vff∆W2óB(	BFÜRñ∆Rw2&V÷ñÊñÊrÖ66∆W2FÜRF˜VÊB(	B6Ú∂Êˆ6∂ñÊp¢ÚÚóBF˜v‚÷∂W2FÜR6˜VÊBıT‚¬ÊBFÜBó2FÜR&Wv&Bf˜"FÜRfó'7BGvÚÜóG2‡¢ÚÚDÑR4ıT‰BÑ24ıU$4R¬‰B4ÑR4‚tƒ≤DÚïB‡¢Ú¢ÚÚFÜR˜vÊW"6∂VBf˜"'W&ñVB÷˜WFÇFÜB&V÷óG26˜VÊBg&ˆ“vóFÜñ‚FÜ@¢ÚÚGG&7G2÷RFÚvÚFÜW&R"(	BÊBóBFñB¬ÊBFÜV‚FÜR6˜VÊBv266VÊW'ì¢‡¢ÚÚ÷&ñVÊ6RÊ6Ü˜&VBˆ‚FÜRFˆ˜"¬vÜñ6Çv˜BVñWFW"26ÜRvVÁBFVWW"¬vÜñ6Ä¢ÚÚó2&6∑v&G2‚«W&RFÜBFˆW2Ê˜B∆VBÁóvÜW&Ró2G&ñ6≤‡¢Ú¢ÚÚóB∆VG2FÚFÜRFVb7ó7FV“w2∆ˆr÷&V6ˆ‚ñ‚5c"Ê˜r¬ÊBFÜRvÜˆ∆RGVÊÊV¿¢ÚÚó266˜&VBvñÁ7BFÜRv∆≤FÚóC¢◊Vff∆VBFá&˜VvÇ&ˆ6≤BFÜR÷˜WFÇ¬6∆˜6W ¢ÚÚñ‚FÜRVÁG'íÜ∆¬¬ÊBñ‚FÜR&V6ˆ‚w2˜v‚&ˆˆ“FÜRfˆ«V÷Ró2FÜRFó7FÊ6P¢ÚÚFÚFÜRFW&÷ñÊ¬‚&VFñÊróB6WGF∆W2FÜRfˆñ6R(	B6VRv6fRrñ‚Á5f˜Ñ'Vñ∆B‡¢Ú¢ÚÚFÜRF&∆Ró2DUDÇ¬Ê˜BvVˆ÷WG'í‚FÜW6R&ˆˆ◊2&R6W&FRFñ∆Rw&ñG2vóFÄ¢ÚÚÊÚ6Ü&VB6ˆ˜&FñÊFR76R¬6Ú&Ü˜rf"víó2óB"6‚ˆÊ«í&RÁ7vW&VB'ê¢ÚÚÜ˜r÷Áí&ˆˆ◊2∆ñR&WGvVV„≤ÊWGv˜&≤FG2óG2˜v‚&˜rvÜV‚óBw&˜w2ˆÊR‡¶6ˆÁ7B4dUÙ$T4Ù‚“∞¢S¢≤&ˆˆ”¢t5c"r¬f#¢„b“¬ÚÚFá&˜VvÇFÜR'V&&∆R¬g&ˆ“FÜR÷VF˜p¢5c¢≤&ˆˆ”¢t5c"r¬f#¢„3B“¬ÚÚFÜRVÁG'íÜ∆¬(	BˆÊR&ˆˆ“ˆf`¢5c#¢≤&ˆˆ”¢t5c"r¬f#¢„3B“¬ÚÚFÜR6V“w2ˆÁv&B÷˜WFÇ&V6ÜW2FÜR&V6ˆ‚Ü∆¿¢5c3¢≤&ˆˆ”¢t5c"r¬f#¢„3B“¬ÚÚ7BóB¬ÊB&VÜñÊBÜW"Ê˜p¢5c#¢≤&ˆˆ”¢t5c"r¬f#¢“¬ÚÚÜW&R‚FÜRFó7FÊ6R&V∆˜rFˆW2FÜRv˜&∞ß”∞¶gVÊ7Fñˆ‚Fñ6¥6fT«W&RÇí∞¢ñbáGóVˆbÁ5f˜ÖFñ6≤”“vgVÊ7Fñˆ‚r«¬∆ñW"í&WGW&„∞¢6ˆÁ7B"“4dUÙ$T4ÙÂ¥rÁ&ˆˆ‘ñE”∞¢6ˆÁ7BÇ“∆ñW"ÁÇ≤∆ñW"ÁrÚ#∞¢∆WBvñ‚“∞¢ñbÑ"í∞¢ñbÑ"Êf"‚í∞¢ÚÚ&ˆˆ“vì¢7FVGí&VB¬∆˜VFW"f˜"FÜRFˆ˜'2FÜB∆VBF˜v&BóB‡¢ÚÚFÜRñ∆R7Fñ∆¬◊Vff∆W2óB¬ÊB∂Êˆ6∂ñÊrFÜRñ∆RF˜v‚˜VÁ2óBW(	@¢ÚÚvÜñ6Çó2FÜR&Wv&Bf˜"FÜRfó'7BGvÚÜóG2‡¢∆WB◊Vff∆R“∞¢f˜"Ü6ˆÁ7BˆbÑrÁ'V&&∆W2«¬µ“íí◊Vff∆R“÷FÇÊ÷ñ‚Ü◊Vff∆R¬„CR≤„SR¢É“ÊáÚÊ÷Çíì∞¢ÚÚ‚‚ÊÊBvóFÜñ‚FÜR&ˆˆ“¬∆VÊñÊrF˜v&BFÜRvíF˜v‡¢∆WB∆VB“∞¢f˜"Ü6ˆÁ7BrˆbvFTFˆ˜'2Çíí∞¢ñbÇ4dUÙ$T4ÙÂ∂rÁFı“bbrÁFÚ”“t5c"rí6ˆÁFñÁVS∞¢∆VB“÷FÇÊ÷ÇÜ∆VB¬6∆◊É“÷FÇÊ'2áÇ“vFUv˜&∆EÇÜrííÚs¬¬íì∞¢–¢vñ‚“Ñ"Êf"≤∆VB¢„#"í¢◊Vff∆S∞¢“V«6R∞¢ÚÚïE2ıt‚$ÙÙ”¢FÜRfˆ«V÷Rï2FÜRFó7FÊ6RFÚFÜRFÜñÊr÷∂ñÊró@¢6ˆÁ7BC"“ÑrÁ7FFñ72«¬µ“íÊfñÊBá”‚ÁGóR””“wFW&“rì∞¢6ˆÁ7BB“C"Ú÷FÇÊ'2áÇ“áC"ÁÇ≤C"ÁrÚ"íí¢c∞¢vñ‚“„3≤6∆◊É“BÚc#¬¬í¢„SS∞¢–¢–¢ñbÜvñ‚√“í&WGW&„∞¢ÚÚÊBˆÊ6R6ÜRÜ2&VBóB¬óB7F˜26V&6ÜñÊs¢VñWFW"¬ÊB7FVGê¢ñbÑrÁ6fRbbrÁ6fRÊf∆w2bbrÁ6fRÊf∆w2Ê&V6ˆ‚ívñ‚£“„SS∞¢Á5f˜ÖFñ6≤Çv6fRr¬vñ‚ì∞ß–¶gVÊ7Fñˆ‚vFTÜW&RÇí∞¢ñbÇ∆ñW"í&WGW&‚ÁV∆√∞¢ÚÚDÑRDÙı"ï2Ù‰Rƒ4R‚óBv2'&ñVf«í'vÜW&RFÜR&6∂G&˜ñÁFVBóB"¿¢ÚÚvÜñ6Ç÷˜fVBvóFÇFÜR&∆∆Ç‚(	BFÜR6÷R6∆ñFRFÜR˜vÊW"&W˜'FVBñ‡¢ÚÚFÜR6fW2‚FÜR7FÊB7˜Bñ‚FÜRF&∆Ró2FÜRFˆ˜"¬gV∆¬7F˜≤FÜP¢ÚÚ7G'V7GW&R¬&ˆ◊BÊBv∆≤∆¬G&rBFÜBv˜&∆BÇÊ˜r‡¢ÚÚvóFÇ÷˜&RFÜ‚ˆÊRFˆ˜"ñ‚&ˆˆ“¬FÜR‰T$U5BˆÊRñ‚&V6Çó2FÜRˆÊR6ÜP¢ÚÚó27FÊFñÊrB(	BÊWfW"FÜRfó'7Bñ‚FÜRF&∆R¬vÜñ6Çv˜V∆B÷∂RáV"w0¢ÚÚ6V6ˆÊBFˆ˜"VÁW6&∆Rg&ˆ“ñÁ6ñFRóG2˜v‚7FÊB7˜B‡¢6ˆÁ7BÇ“∆ñW"ÁÇ≤∆ñW"ÁrÚ#∞¢∆WB&W7B“ÁV∆¬¬&B“ì∞¢f˜"Ü6ˆÁ7BBˆbvFTFˆ˜'2Çíí∞¢6ˆÁ7BGÇ“÷FÇÊ'2áÇ“vFUv˜&∆EÇÜBíì∞¢ñbÜGÇ¬&Bí≤&B“GÉ≤&W7B“C≤–¢–¢&WGW&‚&W7C∞ß–¶gVÊ7Fñˆ‚vFTVÁFW"Çí∞¢6ˆÁ7Bs"“vFTÜW&RÇì∞¢ñbÇs"«¬rÊvFUv∆≤í&WGW&‚f«6S∞¢ñbÑs"ÁFÚ””“trbbó4ÜW&ÚÇíbbrÁ6fRÊf∆w2Ê7'ó7F¬í≤rÁFˆ7BáBÇw7F˜'ïˆÊVVEˆ&∆FRríì≤&WGW&‚f«6S≤–¢6ˆÁ7B7F˜'îÜñÁB“GóVˆb˜VÊñÊtvFTÜñÁB””“vgVÊ7Fñˆ‚rÚ˜VÊñÊtvFTÜñÁBÑs"ÁFÚí¢rs∞¢ñbá7F˜'îÜñÁBí¥rÁFˆ7Bá7F˜'îÜñÁBì∑&WGW&‚f«6S∑–¢ÚÚ%U$îTC¢FÜR÷˜WFÇó2FÜW&R¬6ÜR6‚ÜV"Fá&˜VvÇóB¬ÊBóBvñ∆¬Ê˜BF∂P¢ÚÚÜW"‚&VgW6ñÊrƒıTD≈í÷GFW'2(	BFˆ˜"FÜB6ñ∆VÁF«íñvÊ˜&W2Uó2FV@¢ÚÚñÁWB¬ÊB6ÜRÜ2FÚ∆V&‚FÜBFÜó2ˆÊRó2˜VÊVBvóFÇFÜR&∆FR‡¢6ˆÁ7B'W&ñVB“'V&&∆Tf˜"Ñs"ì∞¢ñbÜ'W&ñVBí∞¢6gÇÇvÊÚrì∞¢'W&ñVBÁ6Ü∂R“÷FÇÊ÷ÇÜ'W&ñVBÁ6Ü∂R¬„3Rì∞¢6“Á6Ü∂R“÷FÇÊ÷ÇÜ6“Á6Ü∂R¬"„Bì∞¢'W'7BÜ'W&ñVBÁÇ¬'W&ñVBÁí“ì¬b¬r3Ü#vCcÇr¬#¬„b¬C¬"„"¬G'VRì∞¢ñbÇÑrÂ˜'V%Fˆ∆EB«¬í√“í≤rÂ˜'V%Fˆ∆EB“"„#≤rÁFˆ7BáBÇw'V%ˆÜñÁBríì≤–¢&WGW&‚f«6S∞¢–¢ÚÚFÜRfÊó6ÜñÊrˆñÁC¢FÜRv&WGvVV‚FÜRFˆ˜'2¬ñ‚45$TT‚76R¬6ñÊ6RFÜP¢ÚÚvFW2&RFÜR&ˆˆ“w2&6∂G&˜ÊBFÜR&6∂G&˜FˆW2Ê˜B67&ˆ∆¬vóFÇFÜP¢ÚÚFñ∆W2á6VR$ÙÙ’ıdï5Dê¢ÚÚ4ÑRtƒµ2DÚDÑRDÙı"$Tdı$R4ÑREU$Â2ÑU"$4≤Ù‚ïB‡¢Ú¢ÚÚFÜR˜vÊW#¢&&Vf˜&RFˆñÊrFÜB¬óBw2ßW7BF∂ñÊrˆÊR7FW&6∑v&BÊBFÜV‡¢ÚÚvˆW2ñÁ6ñFRFÜR&ˆˆ“‚‚‚∂VWFßW7FñÊrFÜB2ñb7GV∆«íFÜR6Ü&7FW"ó0¢ÚÚv∆∂ñÊrñÁ7FVBˆbßW7BfFñÊr‚"FÜB&6∑v&B7FWv2&V¬ÊBóBv0¢ÚÚFÜó3¢FÜRG&ñvvW"66WG2UÁóvÜW&RvóFÜñ‚ìÇˆbFÜRv¬ÊBFÜR6Ü˜@¢ÚÚFÜV‚∆W'VBÜW"g&ˆ“vÜW&WfW"6ÜR7FˆˆBFÚFÜRfÊó6ÜñÊrˆñÁB(	BvóFÇÜW ¢ÚÚ&6≤≈$TEíGW&ÊVB‚ÁíÜ˜&ó¶ˆÁF¬6˜'&V7Fñˆ‚6ÜR˜vVBFÜRFˆ˜'vív˜@¢ÚÚ7VÁBvÜñ∆R6ÜRv2f6ñÊrvíg&ˆ“FÜRFó&V7Fñˆ‚6ÜRv2÷˜fñÊr¬vÜñ6Çó0¢ÚÚFÜRFVfñÊóFñˆ‚ˆbv∆∂ñÊr&6∑v&G2‡¢Ú¢ÚÚ6ÚFÜR6Ü˜BÜ2GvÚ&VG2Ê˜r‚fó'7B6ÜRtƒµ2FÚFÜRv¬6ñFR÷ˆ‚¬ˆ‚ÜW ¢ÚÚ˜v‚∆Vw2¬BÜW"˜v‚v∆∂ñÊr6R¬f6ñÊrvÜW&R6ÜRó2vˆñÊr(	BFÜR˜&FñÊ'ê¢ÚÚ&ˆGíFˆñÊrFÜR˜&FñÊ'íFÜñÊr‚ˆÊ«ívÜV‚6ÜRó27FÊFñÊrñ‚FÜRFˆ˜'víFˆW0¢ÚÚ6ÜRGW&‚ÊB7F'BF˜v‚óB‚ñb6ÜRó2«&VGíFÜW&RFÜR&VBó2¶W&Ú÷∆VÊwFÄ¢ÚÚÊBÊ˜FÜñÊr6ÜÊvVB‡¢6ˆÁ7BvÇ“vFUv˜&∆EÇÑs"í“∆ñW"ÁrÚ#∞¢6ˆÁ7BÊVVB“vÇ“∆ñW"ÁÉ∞¢rÊvFUv∆≤“∞¢C¢¬FÛ¢s"ÁFÚ¬É¢∆ñW"ÁÇ≤∆ñW"ÁrÚ"¬ì¢∆ñW"Áí≤∆ñW"ÊÇ¬FVc¢s"¿¢ÚÚFÜR∆ñv‚&VC¢Ü˜rf"¬vÜñ6Çví¬ÊBÜ˜r∆ˆÊrÜW"∆Vw2v˜V∆BF∂P¢É¢∆ñW"ÁÇ¬ÖFÛ¢vÇ¿¢∆ñv„¢÷FÇÊ'2ÜÊVVBí¬bÚ¢¿¢∆ñvÂC¢¬∆ñv‰GW#¢÷FÇÊ÷ñ‚É„¬÷FÇÊ'2ÜÊVVBíÚtDUı5DUıeÇí¿¢”∞¢ÚÚ4≤dı"ÑU"$4≤‰ır¬Ê˜Bˆ‚FÜRg&÷RFÜBG&w2óB‚FÜRv∆≤÷ví6Ü˜Bó0¢ÚÚFÜRˆÊ«í∆6Rñ‚FÜRv÷R6ÜRó26VV‚g&ˆ“&VÜñÊB¬ÊBFÜRf˜W"∆FW2FÜ@¢ÚÚFÚóB&R∆ßí÷∆ˆFVB∆ñ∂RWfW'óFÜñÊrV«6R(	B&WVW7FVBBG&rFñ÷RFÜWê¢ÚÚ'&ófRfWrg&÷W2ñ‚¬ÊBFÜ˜6RfWrg&÷W2&RWÜ7F«íFÜRˆÊW2FÜBW6V@¢ÚÚFÚ6Ü˜rÜW"6ñFR÷ˆ‚‚&˜FÇó'2¬&V6W6RvÜñ6ÇˆÊR6ÜRvV'2FWVÊG2ˆ‚FÜP¢ÚÚ7v˜&BÊBFÜR6÷∆¬6˜ñW26˜7BfWr∂ñ∆ˆ'óFW2V6Ç(	B'WBDÑRï"4ÑP¢ÚÚtîƒ¬tT"tÙU2dï%5B‚&WVW7FVB&÷VB÷fó'7B&Vv&F∆W72¬FÜR&÷VBó"vˆ‡¢ÚÚFÜR&6Rˆ‚‚VÊ&÷VB'V‚ˆgFV‚VÊ˜VvÇFÜBFÜR6Ü˜B6Ü˜vVBÜW"6''ññÊr¢ÚÚ7v˜&B6ÜRFˆW2Ê˜B˜v„≤f˜W"&∆∆V¬fWF6ÜW2ÜfRÊÚ˜&FW"ˆbFÜVó"˜v‚¬6¢ÚÚFÜR˜&FW"Ü2FÚ&RvófV‚ÜW&R‡¢ñbáGóVˆb÷VFñfWF6Ç””“vgVÊ7Fñˆ‚rí∞¢6ˆÁ7B&÷VB“ÑrÁ6fRbbrÁ6fRÊf∆w2bbrÁ6fRÊf∆w2Ê7'ó7F¬ì∞¢÷VFñfWF6ÇÇvÜW&ÙFW'GW&Rr¬ì∞¢÷VFñfWF6ÇÑtDUÙ4ƒïÊ∂Wí¬ì≤ÚÚFÜRWFÜ˜&VBv∆≤÷ví¬fó'7@¢÷VFñfWF6ÇÑtDUÙ4ƒïı%T‚Ê∂Wí¬ì≤ÚÚ‚‚ÊÊBFÜR'V‚¬f˜"6fR÷˜WFá0¢ÚÚ‚‚ÊÊBÑU"FñW"¬vÜñ6ÜWfW"óBó2‚FÜR˜FÜW'26‚vóBf˜"FÜVó"˜v‚vFR‡¢∞¢6ˆÁ7Bv““GóVˆbvVˆ‰÷ˆFR””“vgVÊ7Fñˆ‚rÚvVˆ‰÷ˆFRÑrÁ6fRí¢v6∆w2s∞¢ñbÑtDUÙ4ƒïÙ$‘TE∑v’“í÷VFñfWF6ÇÑtDUÙ4ƒïÙ$‘TE∑v’“Ê∂Wí¬ì∞¢–¢f˜"Ü6ˆÁ7B≤ˆbvFT&6µó"Ü&÷VBíí÷VFñfWF6ÇÜ≤¬ì∞¢f˜"Ü6ˆÁ7B≤ˆbvFT&6µó"Ç&÷VBíí÷VFñfWF6ÇÜ≤¬ì∞¢ÚÚ‚‚ÊÊBFÜRGW&Ê&˜VÊBFÜRGW&‚&VBó27WBg&ˆ“¬ÜW"6˜7GV÷Rfó'7@¢÷VFñfWF6ÇÜ&÷VBÚvÜW&ıñrr¢vÜW&ıñt&&Rr¬ì∞¢÷VFñfWF6ÇÜ&÷VBÚvÜW&ıñt&&Rr¢vÜW&ıñrr¬ì∞¢–¢ÚÚDÑRtDR4ıT‰E2ƒî¥RtDR‚óB∆ñVB6gÇÇwVírí(	BFÜR6÷RFá&VR÷g&÷P¢ÚÚFñ6≤÷VÁR&˜r÷∂W2(	Bf˜"FÜR&ñvvW7B'Vñ«BFÜñÊrñ‚FÜR˜VÊñÊr‚FÜP¢ÚÚfó'7B˜VÊñÊrˆbFÜR4ïEívFRvWG2FÜR&ñrfW'6ñˆ„¢'&ófñÊr6ˆ÷WvÜW&Rf˜ ¢ÚÚFÜRfó'7BFñ÷Ró2FñffW&VÁBWfVÁBg&ˆ“vˆñÊrFá&˜VvÇFˆ˜"ñ˜R∂Ê˜r‡¢6ˆÁ7B6óGîfó'7B“rÁ&ˆˆ‘ñB””“us"rbbÑrÁ6fRÊf∆w2bbrÁ6fRÊf∆w2ÊvFT˜VÊVBì∞¢ñbÜ6óGîfó'7Bí≤rÁ6fRÊf∆w2ÊvFT˜VÊVB“≤W'6ó7BÇì≤–¢ñbáGóVˆb6gÑvFR””“vgVÊ7Fñˆ‚rí6gÑvFRÜ6óGîfó'7Bì∞¢V«6R6gÇÇwVírì∞¢ÚÚÊBFÜR&ˆˆ“Á7vW'2vóFÇóG2˜v‚÷70¢6“Á6Ü∂R“÷FÇÊ÷ÇÜ6“Á6Ü∂R¬6óGîfó'7BÚR¢"„Rì∞¢ñbáGóVˆbE'V÷&∆R””“vgVÊ7Fñˆ‚ríE'V÷&∆RÜ6óGîfó'7BÚ„SR¢„2¬„R¬6óGîfó'7BÚ3C¢cì∞¢&WGW&‚G'VS∞ß–¢ÚÚWfW'íFWFÇFˆ˜"GfW'Fó6W2óG6V∆c¢6ˆgBv∆ñ÷÷W"vÜW&RóB7FÊG2¬ÊB‡¢ÚÚU6ÜWg&ˆ‚ˆÊ6R6ÜRó26∆˜6RVÊ˜VvÇFÚW6RóB‚vóFÜ˜WBFÜó2Fˆ˜"ñ‚¢ÚÚñÁFñÊró26V7&WB(	BFÜR6óGívFRˆÊ«ív˜BvívóFÇóB&V6W6RFÜP¢ÚÚGWF˜&ñ¬6ÜóˆñÁFVBBóB¬ÊBÊWrFˆ˜'2&RÊ˜BGWF˜&ñ«2‚G&v‚ñ‡¢ÚÚv˜&∆B76R¬g&ˆ“FÜR6÷R722FÜR&ˆ¶V7Fñ∆W2‡¶gVÊ7Fñˆ‚G&tvFU&ˆ◊BÇí∞¢ñbÑrÊvFUv∆≤«¬∆ñW"«¬∆ñW"ÊFVBí&WGW&„∞¢f˜"Ü6ˆÁ7BBˆbvFTFˆ˜'2ÇííG&tˆÊTvFU&ˆ◊BÜBì∞ß–¶gVÊ7Fñˆ‚G&tˆÊTvFU&ˆ◊BÜFVbí∞¢ÚÚFÜRv∆ñ÷÷W"÷&∑2FÜRFˆ˜"w2ˆÊRv˜&∆B7˜B(	B6÷RÊ6Ü˜"2FÜP¢ÚÚ7G'V7GW&RÊBFÜRG&ñvvW"¬6ÚvÜBV«6W2ó2vÜBñ˜R&W72U@¢6ˆÁ7BwÇ“vFUv˜&∆EÇÜFVbì∞¢6ˆÁ7Bwí“ÑrÁ&ˆˆ‘FVbÊÇ“"í¢DîƒS∞¢6ˆÁ7BB“÷FÇÊ'2á∆ñW"ÁÇ≤∆ñW"ÁrÚ"“wÇì∞¢ñbÜB‚#cí&WGW&„∞¢ÚÚ'W&ñVB÷˜WFÇGfW'Fó6W2óG6V∆bvóFÇFÜRñ∆Rw2˜v‚7&6∂∆ñváBÊBFÜP¢ÚÚ6˜VÊB&VÜñÊBóB(	BÊWfW"vóFÇFÜRU6ÜWg&ˆ‚¬vÜñ6Çv˜V∆B&ˆ÷ó6Rv∆∞¢ÚÚFÜRFˆ˜"ó2vˆñÊrFÚ&VgW6P¢6ˆÁ7B'W&ñVB“ÜFVbÁ'V&&∆Rbb'V&&∆Tf˜"ÜFVbíì∞¢6ˆÁ7BÊV"“B¬ìbb'W&ñVB¬V«6UFñ÷R“W&f˜&÷Ê6RÊÊ˜rÇíÚ∞¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Êv∆ˆ&ƒ«Ü“ÜÊV"Ú„ÉR¢„Bí¢É„r≤÷FÇÁ6ñ‚áV«6UFñ÷R¢"„Bí¢„2ì∞¢6ˆÁ7Bs"“2Ê7&VFU&Fñƒw&FñVÁBÜwÇ¬wí“3¬"¬wÇ¬wí“3¬C"ì∞¢s"ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#C√#√„Çírì≤s"ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√##√C√írì∞¢2Êfñ∆≈7Gñ∆R“s#≤2Ê&VvñÂFÇÇì≤2Ê&2ÜwÇ¬wí“3¬C"¬¬rì≤2Êfñ∆¬Çì∞¢ñbÜÊV"í∞¢2Êv∆ˆ&ƒ«Ü“„ìS∞¢2Êfñ∆≈7Gñ∆R“r6ffc&6bs∞¢2ÊfˆÁB“v&ˆ∆B#Ç÷ˆÊ˜76Rs≤2ÁFWáD∆ñv‚“v6VÁFW"s∞¢ñbÜFVbÁFÚ””“trí≤2ÊfˆÁB“v&ˆ∆B'Ç7ó7FV“◊Vís≤2Êfñ∆≈FWáBáBÇv«ÜˆFV‚rí¬wÇ¬wí“s"ì≤2ÊfˆÁB“v&ˆ∆B#Ç÷ˆÊ˜76Rs≤–¢2Êfñ∆≈FWáBÇ~(ir¬wÇ¬wí“CB≤÷FÇÁ6ñ‚áV«6UFñ÷R¢2„"í¢2ì∞¢–¢2Á&W7F˜&RÇì∞ß–¢ÚÚ2„G3¢4$TeT¬v∆≤¬Ê˜BF6ÇFá&˜VvÇFˆ˜'ví‚FÜR˜vÊW"w2Fó&V7Fñˆ„†¢ÚÚ&6&VgV¬7FVGív∆≤ñÁFÚFÜRVÊ∂Ê˜v‚¬vWGFñÊr6÷∆∆W"2ívÚFVWW"¿¢ÚÚVÁFñ¬fFñÊr‚"7FVGí÷VÁ2ÊV"÷6ˆÁ7FÁB6R(	BFÜRV6ñÊr&V∆˜r∂VW0¢ÚÚFÜR7VVB∆WfV¬ñÁ7FVBˆb'W6ÜñÊrFÜR÷ñFF∆R‡¶6ˆÁ7BtDUıtƒ≤“2„C∞¢ÚÚDÑRtƒ≤‘tíï2Ù‰RUDÑı$TB4ƒïÉ##b”í”Rí¬Ê˜BGvÚ∆FW2f∆óVB‡¢Ú¢ÚÚFÜR7G&óó2”2FÜREU$‚(	Bg&ˆÁB÷ˆ‚¬Fá&VR◊V'FW"¬ÊV&«í&VÜñÊB¬&VÜñÊB(	@¢ÚÚÊBB”rFÜR&6≤◊fñWr7G&ñFR‚óB6ÊÊ˜B6ñ◊«í∆ˆ˜¢'V‚∆¬VñváBˆ‚FÜP¢ÚÚ7G&ñFR6˜VÁFW"ÊB6ÜRó&˜VWGFW2WfW'í6V6ˆÊB7FW¬GW&ÊñÊrFÚf6RFÜP¢ÚÚ6÷W&vñ‚ˆ‚ÜW"ví˜WBˆbFÜRv˜&∆B‡¢Ú¢ÚÚ6ÚFÜRGW&‚∆ó2Ù‰4R¬ˆ‚FÜRv∆≤w2˜v‚6∆ˆ6≤¬˜fW"óG2fó'7BfñgFÉ≤FÜP¢ÚÚ&6≤7G&ñFR∆ˆ˜2ˆ‚E$dT¬gFW"FÜB¬FÜR6÷R6˜VÁFW"FÜRGvÚ∆FW2W6VB¿¢ÚÚ6ÚFÜR6FVÊ6R7Fñ∆¬Á7vW'2FÚÜ˜rf"6ÜRÜ27GV∆«ívˆÊR&FÜW"FÜ‚F¢ÚÚv∆¬Fñ÷R‚ÊBFÜR&ˆ6VGW&¬&ˆ"vˆW2vívóFÇFÜV”¢‚WFÜ˜&VB7ñ6∆P¢ÚÚ6'&ñW2óG2˜v‚fW'Fñ6¬¬ÊBFFñÊr7ñÁFÜWFñ2ˆÊRˆ‚F˜ó2FÜR6V6ˆÊB&ˆ ¢ÚÚFW7G2ˆvóBÊ6ß2«&VGíf˜&&ñG2f˜"FÜR'V‚‡¶6ˆÁ7BtDUÙ4ƒï“≤∂Wì¢vÜW&ÙvFUv∆≤r¬6V∆«3¢Ç¬GW&„¢B¬GW&‰g&3¢„"”∞¢ÚÚEtÚtï2DÚƒTdR¬EtÚ4ƒï2‚FÜR6ˆFR&V∆˜r«&VGíFV∆«2vFRg&ˆ“6fP¢ÚÚÊBG&VG2FÜV“FñffW&VÁF«í(	BvFWvíó2∆óBÜ∆¬6ÜR&V6VFW2Dıt‚¬ÉBRˆ`¢ÚÚÜW"6ó¶R7&˜72FÜRv∆≤¬vÜñ∆R6fR÷˜WFÇÜ2ÊÚÜ∆¬ÊBˆÊ«íF∂W2bP¢ÚÚ&Vf˜&RFÜRF&∂ÊW72Ü2ÜW"‚6ÚFÜR6fRó2Ê˜B6÷∆∆W"fW'6ñˆ‚ˆbFÜRvFR¿¢ÚÚóBó2f7FW"ˆÊR¬ÊB6ÜRvˆW2ñÁFÚóBB%T‚‚6÷RVñváB÷6V∆¬6ÜS¢FÜP¢ÚÚGW&‚¬FÜV‚FÜR7G&ñFR‡¶6ˆÁ7BtDUÙ4ƒïı%T‚“≤∂Wì¢vÜW&ÙvFU'V‚r¬6V∆«3¢Ç¬GW&„¢B¬GW&‰g&3¢„Ç”∞¢ÚÚ4ÑRƒTdU24%%îî‰rtÑB4ÑRT$‰TB‚FÜRVÊ&÷VB6∆óó2G&v‚vóFÇÊ˜FÜñÊrˆ‡¢ÚÚÜW"&6≤¬vÜñ6Ç÷FRóB&ñváBf˜"FÜR˜VÊñÊrÊBw&ˆÊrg&ˆ“FÜR7'ó7F¿¢ÚÚˆÁv&B(	B&÷VB¬G&tvFUv∆≤fV∆¬&6≤FÚFÜRGvÚˆ∆B∆FW2‚FÜW&Ró2Ê˜rˆÊP¢ÚÚ6∆óW"vVˆ‚FñW"¬∂WñVB'íFÜRÊ÷W2vVˆ‰÷ˆFRÇí«&VGí&WGW&Á2¬6ÚFÜP¢ÚÚ&∆FRˆ‚ÜW"&6≤Fá&˜VvÇFÜRvFRó2FÜR&∆FR6ÜRó27GV∆«íÜˆ∆FñÊr‡¶6ˆÁ7BtDUÙ4ƒïÙ$‘TB“∞¢6ñÊv∆S¢≤∂Wì¢vÜW&ÙvFU6ñÊv∆Rr¬6V∆«3¢Ç¬GW&„¢B¬GW&‰g&3¢„"“¿¢GV√¢≤∂Wì¢vÜW&ÙvFTGV¬r¬6V∆«3¢Ç¬GW&„¢B¬GW&‰g&3¢„"“¿¢¶ˆñÊVC¢≤∂Wì¢vÜW&ÙvFT¶ˆñÊVBr¬6V∆«3¢Ç¬GW&„¢B¬GW&‰g&3¢„"“¿ß”∞¢ÚÚÜW"v∆∂ñÊr6Rf˜"FÜR&VBFÜB∆ñÊW2ÜW"WvóFÇFÜRFˆ˜'ví‚Ê˜BFÜP¢ÚÚ'V„¢'V‚ñÁFÚFˆ˜"ó2FÜR&F6ÇFá&˜VvÇFˆ˜'ví"FÜR6Ü˜B&V∆˜rv0¢ÚÚw&óGFV‚vñÁ7B¬ÊBFÜR˜vÊW"6∂VBf˜"6&VgV¬v∆≤‡¶6ˆÁ7BtDUı5DUıeÇ“S∞¢ÚÚ4ÑREU$Â2$Tdı$R4ÑRtƒµ2Ü˜vÊW"¬##b”Ç”#c¢&Ê˜&÷¬÷˜Fñˆ‚ˆbGW&ÊñÊr‚‚‡¢ÚÚw&GV∆«íÊB6÷ˆ˜FÜ«íFÚGW&‚óBFÚf6RFÜRvFR¬FÜV‚Ê˜&÷¬∆Vw2Ê@¢ÚÚ&ˆGí÷˜fV÷VÁBˆb6ˆ÷VˆÊRv∆∂ñÊrví"í‚FÜRˆ∆B6Ü˜B7WBg&ˆ“ÜW"6ñFRfñWp¢ÚÚ7G&ñváBFÚÜW"&6≤(	BßV◊¬Ê˜BGW&‚‚FÜR&VB&WGvVV‚FÜR∆ñv‚v∆∞¢ÚÚÊBFÜR&V6VFRÊ˜r∆ó2ÜW"˜v‚Ç◊ñrGW&Ê&˜VÊBFá&˜VvÇFÜRÜ∆b◊GW&‚FÜP¢ÚÚ6÷W&6‚6VS¢&ˆfñ∆R¬Fá&VR◊V'FW"&6≤¬gV∆¬&6≤(	BÊBˆÊ«íFÜV‚F¢ÚÚÜW"∆Vw27F'BF˜v‚FÜRÜ∆¬‚„SW3¢Fá&VRWFÜ˜&VBÊv∆W2B6R&ˆGê¢ÚÚ7GV∆«íGW&Á2C≤∆ˆÊvW"&VG22ÜW6óFFñˆ‚¬6Ü˜'FW"&VG22FÜR7W@¢ÚÚFÜó2&W∆6W2‡¶6ˆÁ7BtDUıEU$‚“„SS∞¶gVÊ7Fñˆ‚WFFTvFUv∆≤ÜGBí∞¢6ˆÁ7Br“rÊvFUv∆≥≤ñbÇrí&WGW&„∞¢ÚÚ““““&VBˆÊS¢v∆≤FÚFÜRFˆ˜'ví¬6ñFR÷ˆ‚¬ˆ‚ÜW"˜v‚∆Vw2““““““““““““–¢ñbÜrÊ∆ñv‚¬í∞¢rÊ∆ñvÂB≥“GC∞¢6ˆÁ7B≤“rÊ∆ñv‰GW"‚Ú6∆◊ÜrÊ∆ñvÂBÚrÊ∆ñv‰GW"¬¬í¢∞¢6ˆÁ7BFó"“rÊÖFÚ„“rÊÉÚ¢”∞¢ñbá∆ñW"í∞¢∆ñW"ÁÇ“rÊÉ≤ÜrÊÖFÚ“rÊÉí¢≥∞¢ÚÚgÇó2vÜBFÜR˜6Rñ6∂W"&VG2¬ÊB7G&ñFUÇó2vÜB7ñ6∆W2FÜP¢ÚÚ6V∆«2(	B&˜FÇ6WBÜW&R&FÜW"FÜ‚∆VgBFÚÜW"˜v‚WFFR¬&V6W6P¢ÚÚFÜW&Ró2ÊÚñÁWBG&ófñÊrÜW"ÊBg&ñ7Fñˆ‚v˜V∆BÜfRÜW"'&ófP¢ÚÚ7FÊFñÊr7Fñ∆¬vóFÇÜW"∆Vw2ñ‚÷ñB÷ó ¢∆ñW"ÁgÇ“Fó"¢tDUı5DUıeÇ¢É“≤¢„3Rì∞¢∆ñW"Êf6R“∆ñW"Êf6Ufó2“Fó#∞¢ñbáGóVˆbÜW&ı7FW∆V‚””“vgVÊ7Fñˆ‚rê¢∆ñW"Á7G&ñFUÇ“á∆ñW"Á7G&ñFUÇ«¬ê¢≤GB¢6∆◊Ñ÷FÇÊ'2á∆ñW"ÁgÇíÚÜW&ı7FW∆V‚á∆ñW"ÁgÇí¬¬ì∞¢–¢ñbÜ≤„“í∞¢rÊ∆ñv‚“∞¢ñbá∆ñW"í∞¢∆ñW"ÁgÇ“∞¢ÚÚFÜR&V6VFR7F'G2g&ˆ“vÜW&R6ÜR7GV∆«íT‰DTBU¬Ê˜Bg&ˆ“vÜW&P¢ÚÚ6ÜRv27FÊFñÊrvÜV‚FÜR∂Wív2&W76V@¢rÁÉ“∆ñW"ÁÇ≤∆ñW"ÁrÚ#∞¢rÁì“∆ñW"Áí≤∆ñW"ÊÉ∞¢–¢–¢&WGW&„∞¢–¢ÚÚ4ÑRDÙU2‰ıBEU$‚TÂDî¬DÑU$Rï2$4≤DÚEU$‚‚Üˆ∆FñÊrFÜRfó'7B÷ˆ÷VÁG0¢ÚÚˆbFÜR6Ü˜BBFÜRFˆ˜"6˜7G2Ê˜FÜñÊr(	B6ÜRó27FÊFñÊrFÜW&RÁóví¬G&v‡¢ÚÚFÜRví6ÜR«vó2ó2(	BÊBóB'Wó2FÜR∆FW2FÜRg&7Fñˆ‚ˆb6V6ˆÊBFÜWê¢ÚÚÊVVB‚6VB¬6Ú'&˜w6W"FÜB6ÊÊ˜BFV6ˆFRvV'B∆¬7Fñ∆¬∆VfW2FÜP¢ÚÚ&ˆˆ“ñÁ7FVBˆb7FÊFñÊrñ‚FÜRFˆ˜'víf˜&WfW"‡¢ñbáGóVˆbvFT&6µ&VGí””“vgVÊ7Fñˆ‚rbbvFT&6µ&VGíÇíí∞¢rÊÜˆ∆B“ÜrÊÜˆ∆B«¬í≤GC∞¢ñbÜrÊÜˆ∆B¬„sRí&WGW&„∞¢–¢ÚÚ““““&VBGvÛ¢FÜRGW&‚(	BÜW"6∆ˆ6≤Üˆ∆G2B¶W&ÚvÜñ∆RÜW"&ˆGí&˜FFW0¢ñbÇÜrÁGW&‚«¬í¬í∞¢rÁGW&ÂB“ÜrÁGW&ÂB«¬í≤GC∞¢rÁGW&‚“6∆◊ÜrÁGW&ÂBÚtDUıEU$‚¬¬ì∞¢ñbÜrÁGW&‚¬í&WGW&„∞¢–¢rÁB≥“GC∞¢ñbÜrÁB„“tDUıtƒ≤í∞¢rÊvFUv∆≤“ÁV∆√∞¢∆ˆE&ˆˆ“ÜrÁFÚì∞¢ÚÚ‰B4ÑR4Ù‘U2ıUBÙbDÑRıDÑU"4îDRÙbDÑRtDR‚∆ˆE&ˆˆ“∂VW2vÜFWfW ¢ÚÚÇ6ÜRÜB¬ÊB6ÜRÜBFÜRf"&ñváBˆbvñFW"&ˆˆ“(	BvÜñ6ÇWBÜW"7@¢ÚÚFÜR&ñváBVFvRˆbFÜR÷VF˜rÊB&˜VÊ6VBÜW"7G&ñváBFá&˜VvÇóBñÁFÚFÜP¢ÚÚÊWáB&ˆˆ“‚v∆∂ñÊrñ‚Fá&˜VvÇFˆ˜"Ü2FÚ'&ófRîÂ4îDRFÜRf"&ˆˆ”†¢ÚÚBFÜRFˆ˜"w2FV6∆&VB'&óf¬g&7Fñˆ‚ÜÇí¬6∆◊VBñÁFÚFÜR&ˆˆ“6Ú¢ÚÚ÷ó2◊GóVBF&∆RVÁG'í6‚ÊWfW"7G&ÊBÜW"ñ‚v∆¬‡¢ñbá∆ñW"í∞¢6ˆÁ7B'r“rÁ&ˆˆ‘FVbÁr¢DîƒS∞¢6ˆÁ7BÇ“ÜrÊFVbbbrÊFVbÊÇ“ÁV∆¬ê¢Ú÷FÇÁ&˜VÊBá'r¢rÊFVbÊÇ“∆ñW"ÁrÚ"í¢C∞¢∆ñW"ÁÇ“6∆◊ÜÇ¬DîƒR≤B¬'r“DîƒR“B“∆ñW"Árì∞¢∆ñW"ÁgÇ“≤∆ñW"Ágí“∞¢∆ñW"Êf6R“∆ñW"Êf6Ufó2“∞¢∆ñW"Ê∆7E6fR“≤É¢∆ñW"ÁÇ¬ì¢∆ñW"Áí”∞¢–¢–ß–¢ÚÚÜW"&6≤∆FW2¬ÊBFÜRˆÊRVW7Fñˆ‚FÜRv∆≤÷ví6Ü˜B6∑2ˆbFÜV”¢ó0¢ÚÚFÜW&RÁóFÜñÊrÜW&RFÜB6‚&RE$t‚FÜó2g&÷SÚ‘TDîÙî‘rw266W76˜ ¢ÚÚfWF6ÜW2ˆ‚&VB¬vÜñ6Çó2vÜBvRvÁBFÜRfó'7BFñ÷RÊBÜ&÷∆W72gFW"(	@¢ÚÚ'WB‚ñ÷vRFÜBó27Fñ∆¬∆ˆFñÊrÜ2ÊGW&≈vñGFÇÊB◊W7BÊ˜B6˜VÁB‡¶gVÊ7Fñˆ‚vFT&6¥ñ÷rÜ≤í∞¢6ˆÁ7Bñ““‘TDîÙî‘u∂µ”∞¢&WGW&‚Üñ“bbñ“ÊÊGW&≈vñGFÇíÚñ“¢ÁV∆√∞ß–¢ÚÚ$TEí‘TÂ2DÑRï"4ÑRtîƒ¬tƒ≤î‚¬‰ıBÂíÙ‰RƒDRÙbdıU"‡¢Ú¢ÚÚFÜó2W6VBFÚ&WGW&‚G'VRFÜR÷ˆ÷VÁBÙ‰RˆbFÜRf˜W"ÜBFV6ˆFVB¬ÊBFÜRÜˆ∆@¢ÚÚ&V∆V6VBˆ‚FÜB(	B6ÚFÜR6Ü˜B6˜V∆B7F'BvóFÇˆÊ«í&6∑v∆µˆñ‚ÜÊBÊ@¢ÚÚWfW'íg&÷RˆbFÜR"Ü∆bˆbFÜR7G&ñFRfV∆¬Fá&˜VvÇFÚÜW"4îDRfñWr¬vÜñ6Ä¢ÚÚó2FÜR&vˆñÊrñ‚&6∂w&˜VÊB∆ˆˆ∑2f∂R"&W˜'B∆¬˜fW"vñ‚‚óBv0¢ÚÚñÁFW&÷óGFVÁB&V6W6RóBFWVÊFVBˆ‚vÜñ6Çˆbf˜W"fWF6ÜW2ÜVÊVBFÚ∆Ê@¢ÚÚfó'7B¬ÊBóBv˜Bv˜'6R2FÜR&ˆ˜B6WBw&Ws¢'V‚÷V7W&VBÉí6ñFRg&÷W0¢ÚÚ˜WBˆb2„B◊6V6ˆÊBv∆≤vÜñ∆R'V‚÷ñÁWFW2V&∆ñW"÷V7W&VBÊˆÊR‡¢Ú¢ÚÚ7G&ñFRÊVVG2$ıDÇˆbóG2g&÷W2‚vóFñÊrf˜"FÜRó"6˜7G2Ê˜FÜñÊr6ÜR6‡¢ÚÚ6VR(	BFÜRÜˆ∆Bó26VBB„sW2ÊB6ÜRó27FÊFñÊrñ‚FÜRFˆ˜'víG&v‡¢ÚÚFÜRví6ÜR«vó2ó2(	BÊBóBó2FÜRFñffW&VÊ6R&WGvVV‚v∆≤ÊBf∆ñ6∂W"‡¶gVÊ7Fñˆ‚vFT&6µó"Ü&÷VBí∞¢&WGW&‚&÷VBÚ≤vÜW&Ù&6¥r¬vÜW&Ù&6¥"u“¢≤vÜW&Ù&&T&6¥r¬vÜW&Ù&&T&6¥"u”∞ß–¢ÚÚ&VGí÷VÁ2ÑU"ó"(	BÊ˜BFÜR˜FÜW"ˆÊR‚FÜR7V'7FóGWFRWÜó7G26Ú'&˜w6W ¢ÚÚFÜBÊWfW"vWG2FÜR&ñváB∆FW27Fñ∆¬6Ü˜w2&6≤&FÜW"FÜ‚6ñFRfñWr¿¢ÚÚÊBóBó2G&tvFUv∆≤w2∆7B&W6˜'BˆÊ6RFÜó2Üˆ∆BÜ27VÁBóG2„sW2‚ñ`¢ÚÚóB6˜VÁFVB2&VGíÜW&R¬FÜRÜˆ∆Bv˜V∆B&V∆V6RFÜR÷ˆ÷VÁBFÜRu$Ù‰ró ¢ÚÚ∆ÊFVBÊB6ÜRv˜V∆Bv∆≤˜WBvV&ñÊr7v˜&B6ÜRFˆW2Ê˜B˜v‚‡¶gVÊ7Fñˆ‚vFT&6µ&VGíÇí∞¢ÚÚFÜRWFÜ˜&VB6∆óó2vÜˆ∆Rv∆≤ˆ‚óG2˜v‚¬6ÚóB6Fó6fñW2FÜRÜˆ∆B'ê¢ÚÚóG6V∆b(	BFÜRó"'V∆R&V∆˜rWÜó7G2&V6W6RÙ‰RˆbGvÚ∆FW2ó2Ü∆b¢ÚÚ7G&ñFR¬ÊB6∆óó2ÊWfW"Ü∆bˆbÁóFÜñÊr‚VóFÜW"6∆óvñ∆¬FÛ¢FÜRv∆∞¢ÚÚ7FÊG2ñ‚f˜"FÜR'V‚ñbFÜR'V‚Ü2Ê˜B∆ÊFVB¬ÊBFÜR&WfW'6RÊWfW ¢ÚÚÜVÁ2&V6W6RFÜRv∆≤ó2fWF6ÜVBfó'7B‡¢ñbÜvFT&6¥ñ÷rÑtDUÙ4ƒïÊ∂Wíí«¬vFT&6¥ñ÷rÑtDUÙ4ƒïı%T‚Ê∂Wííí&WGW&‚G'VS∞¢f˜"Ü6ˆÁ7B≤ñ‚tDUÙ4ƒïÙ$‘TBíñbÜvFT&6¥ñ÷rÑtDUÙ4ƒïÙ$‘TE∂µ“Ê∂Wííí&WGW&‚G'VS∞¢6ˆÁ7BvÁB“vFT&6µó"ÇÑrÁ6fRbbrÁ6fRÊf∆w2bbrÁ6fRÊf∆w2Ê7'ó7F¬íì∞¢&WGW&‚ÜvFT&6¥ñ÷rávÁE≥“íbbvFT&6¥ñ÷rávÁE≥“íì∞ß–¢ÚÚFÜRGW&‚&VBw2g&÷W2¬7WBg&ˆ“ÜW"˜v‚GW&Ê&˜VÊB‚vÜñ6ÇFá&VR6V∆«2÷∂P¢ÚÚFÜRfó6ñ&∆RÜ∆b◊GW&‚FWVÊG2ˆ‚vÜñ6Çví6ÜRv2f6ñÊrvÜV‚6ÜR'&ófVC†¢ÚÚf6ñÊr&ñváBóBó2&ˆfñ∆R”‚Fá&VR◊V'FW"R”‚&6≤c≤f6ñÊr∆VgB¿¢ÚÚ&ˆfñ∆RB”‚Fá&VR◊V'FW"2”‚&6≤b‚FÜR6ÜVWBó2WFÜ˜&VB¬Ê˜B÷ó'&˜&VB¿¢ÚÚvÜñ6Çó2váíFÜRGvÚFá2W6RFñffW&VÁB6V∆«2&FÜW"FÜ‚f∆ó‡¶gVÊ7Fñˆ‚vFUGW&‰6V∆¬ÜFó"¬Gí∞¢ñbáG¬„3Bí&WGW&‚Fó"‚Ú¢C∞¢ñbáG¬„s"í&WGW&‚Fó"‚ÚR¢3∞¢&WGW&‚c∞ß–¶gVÊ7Fñˆ‚G&tvFUv∆≤Çí∞¢6ˆÁ7Br“rÊvFUv∆≥≤ñbÇr«¬rÊ∆ñv‚¬í&WGW&„≤ÚÚ&VBˆÊRó2ÜW"˜v‚&ˆGê¢ÚÚ““““&VBGvÛ¢FÜRGW&‚‚6ÜR7FÊG2ñ‚FÜRFˆ˜'víBgV∆¬6ó¶RÊBÜW ¢ÚÚ&ˆGí6ˆ÷W2&˜VÊBFá&˜VvÇFÜRWFÜ˜&VBÊv∆W2‚Ê˜FÜñÊr&V6VFW2ñWB(	BFÜP¢ÚÚ6∆ˆ6≤ÜrÁBíó27Fñ∆¬B¶W&Ú(	B6ÚFÜR&V6VFR&V∆˜r7F'G2WÜ7F«ívÜW&P¢ÚÚÊBWÜ7F«í2∆&vR2FÜRGW&‚∆VfW2ÜW"‡¢ñbÇÜrÁGW&‚«¬í¬bbrÁB√“í∞¢6ˆÁ7B&÷VB“ÑrÁ6fRbbrÁ6fRÊf∆w2bbrÁ6fRÊf∆w2Ê7'ó7F¬ì∞¢6ˆÁ7Bñtñ““vFT&6¥ñ÷rÜ&÷VBÚvÜW&ıñrr¢vÜW&ıñt&&Rrê¢«¬vFT&6¥ñ÷rÜ&÷VBÚvÜW&ıñt&&Rr¢vÜW&ıñrrì∞¢6ˆÁ7B7É“rÁÉ“6’5ÇÇí¬7ì“rÁì“6’5íÇì∞¢6ˆÁ7BFó"“á∆ñW"bbá∆ñW"Êf6Ufó2«¬∆ñW"Êf6Ríí«¬∞¢6ˆÁ7BG“rÁGW&‚«¬∞¢6ˆÁ7BFW'GW&S“&÷VBbbvFT&6¥ñ÷rÇvÜW&ÙFW'GW&Rrì∞¢ñbÜFW'GW&Rí∞¢6ˆÁ7B6ˆ√‘÷FÇÊ÷ñ‚É2ƒ÷FÇÊf∆ˆ˜"áG£Bíí∆7s÷FW'GW&RÊÊGW&≈vñGFÇÛÉ∞¢6ˆÁ7B&Fñ˜3’≥√3ìBÛCÇ√3s2ÛCÇ√3SíÛCÖ”∞¢6ˆÁ7BFÉ”ì"˜&Fñ˜5∂6ˆ≈”∞¢2Á6fRÇì∂2ÁG&Á6∆FRá7É«7ìì∂ñbÜFó#√bf6ˆ√√2ñ2Á66∆RÇ”√ì∞¢2ÊG&tñ÷vRÜFW'GW&R∆6ˆ¬¶7r√∆7r∆FW'GW&RÊÊGW&ƒÜVñváB¬÷FÇÛ"¬÷FÇ∆FÇ∆FÇì∂2Á&W7F˜&RÇì∞¢rÊvFT&6¥∂Wì“vÜW&ÙFW'GW&Rs∞¢“V«6Rñbáñtñ“bbG„“„3Bí∞¢ÚÚFÜRV6VB÷ñFF∆RˆbFÜRGW&„¢FÜRFá&VR◊V'FW"6V∆¬∆VÁ2ñ‚Üó ¢ÚÚ6ÚFÜR&˜FFñˆ‚&VG22÷˜Fñˆ‚&FÜW"FÜ‚2GvÚ7Fñ∆«0¢6ˆÁ7B6ˆ¬“vFUGW&‰6V∆¬ÜFó"¬Gì∞¢6ˆÁ7B5r“ñtñ“ÊÊGW&≈vñGFÇÚÇ¬4Ç“ñtñ“ÊÊGW&ƒÜVñváC∞¢6ˆÁ7BFÇ“ì"¬Gr“FÇ¢Ñ5rÚ4Çì∞¢2Á6fRÇì∞¢2ÊG&tñ÷vRáñtñ“¬6ˆ¬¢5r¬¬5r¬4Ç¬7É“GrÚ"¬7ì“FÇ¬Gr¬FÇì∞¢2Á&W7F˜&RÇì∞¢rÊvFT&6¥∂Wí“G„“„s"ÚÜ&÷VBÚvÜW&ıñrr¢vÜW&ıñt&&Rrí¢rs∞¢“V«6Rñbá∆ñW"í∞¢ÚÚfó'7BFÜó&B(	B˜"ÊÚ6ÜVWBB∆√¢ÜW"∆ófR&ˆGí¬7FÊFñÊrBFÜRFˆ˜"¿¢ÚÚf6ñÊrFÜRví6ÜRv∆∂VBñ‚‚FÜR6÷R&ˆGíFÜR∆ñv‚&VBG&Wr¬6¢ÚÚFÜR&VB&˜VÊF'íó2ñÁfó6ñ&∆R‚FÜó2gVÊ7Fñˆ‚G&w2ñ‚45$TT‚76R¿¢ÚÚÊBÜW"&ˆGíG&w2óG6V∆bñ‚tı$ƒB76R¬6ÚóBó26'&ñVBFÚFÜP¢ÚÚFˆ˜"w267&VV‚7˜BFÜR6÷RvíFÜR&V6VFRw2∆7B◊&W6˜'BFÇFˆW2‡¢6ˆÁ7BgÉ“∆ñW"ÁgÇ¬c“∆ñW"Êf6R¬gc“∆ñW"Êf6Ufó3∞¢∆ñW"ÁgÇ“≤∆ñW"Êf6R“Fó#≤∆ñW"Êf6Ufó2“Fó#∞¢2Á6fRÇì∞¢2ÁG&Á6∆FRá7É¬7ìì∞¢2ÁG&Á6∆FRÇ“á∆ñW"ÁÇ≤∆ñW"ÁrÚ"í¬“á∆ñW"Áí≤∆ñW"ÊÇíì∞¢∆ñW"ÊG&rÜ2ì∞¢2Á&W7F˜&RÇì∞¢∆ñW"ÁgÇ“gÉ≤∆ñW"Êf6R“c≤∆ñW"Êf6Ufó2“gc∞¢–¢&WGW&„∞¢–¢6ˆÁ7B≤“6∆◊ÜrÁBÚtDUıtƒ≤¬¬ì∞¢ÚÚ6ÜRv∆∑2ñÁFÚFÜRvÊBvì¢˜6óFñˆ‚∆W'2F˜v&BFÜRfÊó6ÜñÊrˆñÁ@¢ÚÚñ‚45$TT‚76R¬66∆Rf∆«2ˆfb¬ÊBFÜR∆7BFÜó&BfFW2FÚ&∆6≤6ÚFÜP¢ÚÚ&ˆˆ“6ÜÊvR∆ÊG2ˆ‚F&∂ÊW72&FÜW"FÜ‚ˆ‚7W@¢ÚÚ4$TeT¬¬5DTEítƒ≤îÂDÚDÑRT‰¥‰ıt‚Ü˜vÊW"w2Fó&V7Fñˆ‚í‚FÜRfó'7@¢ÚÚFVÁFÇV6W2ÜW"ñÁFÚFÜR7G&ñFS≤gFW"FÜBFÜR6Ró24ÙÂ5DÂB(	BÊ¢ÚÚ6÷ˆ˜Fá7FW'W6ÇFá&˜VvÇFÜR÷ñFF∆R(	BÊB6ÜR6ñ◊«ívWG26÷∆∆W"FÜP¢ÚÚFVWW"6ÜRvˆW2¬VÁFñ¬FÜRF&≤F∂W2ÜW"‡¢6ˆÁ7BR“≤¬„ÚÜ≤¢≤íÚ„¢„R≤≤¢„R¢≥∞¢6ˆÁ7B7É“rÁÉ“6’5ÇÇí¬7ì“rÁì“6’5íÇì∞¢6ˆÁ7BFr“vFUF&vWBÜrÊFVbì∞¢6ˆÁ7BGÇ“FrÁÇ¬Gí“FrÁì∞¢ÚÚîÂDÚFÜR&6∂w&˜VÊB¬Ê˜B∆ˆÊrFÜRf∆ˆ˜"‚6ÜRó2«&VGí7FÊFñÊrBFÜP¢ÚÚFˆ˜"vÜV‚FÜRv∆≤7F'G2áFÜRG&ñvvW"&WVó&W2óBí¬6ÚFÜRÜ˜&ó¶ˆÁF¿¢ÚÚG&fV¬ó27FW˜"GvÚ(	BDUDÇFˆW2FÜRv˜&≥¢FÜR66∆Rf∆«2vê¢ÚÚ7FVFñ«ívóFÇWfW'í7FW¬vóFÇ6∆ñváB&ó6RñÁFÚFÜRv‡¢6ˆÁ7BÇ“7É≤áGÇ“7Éí¢R¬í“7ì≤áGí“7ìí¢ÜR¢Rì∞¢6ˆÁ7BFW7C"“GóVˆb$ÙÙ’2”“wVÊFVfñÊVBrbb$ÙÙ’5∂rÁFı”∞¢6ˆÁ7BñÁFÙ6fR“ÑrÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÊ6fRí«¬ÜFW7C"bbFW7C"Ê6fRì∞¢6ˆÁ7B62“vFUv∆µ66∆RÜrÊFVb¬ñÁFÙ6fR¬Rì∞¢2Á6fRÇì∞¢ÚÚ5tƒƒıtTB%íD$≤¬‰ıBDï54Ù≈dTB‚FÜRˆ∆BfFRG&˜VBv∆ˆ&ƒ«Ü¬vÜñ6Ä¢ÚÚ6Ü˜w2FÜR&ˆˆ“DÖ$ıTtÇÜW"(	BvÜ˜7B¬Ê˜B6ÜF˜r¬ÊBFÜR6÷Rw&ˆÊr&V@¢ÚÚ2FÜR˜vW&VB÷F˜v‚Â72&V∆˜r‚v∆∂ñÊrñÁFÚ‚VÊ∆óB76vRFÜRƒîtÖ@¢ÚÚ∆VfW2ÜW#¢6ÜR7Fó2˜VRÊBFñ◊2FÚ&∆6≤6ñ∆Ü˜VWGFRÜ'&ñváFÊW72¿¢ÚÚ6÷ˆ˜Fá7FWVB6ÚFÜRf∆∆ˆfbó26ˆgBB&˜FÇVÊG2í¬ÊBˆÊ«íÜW"∆7BfWp¢ÚÚ7FW2Fó76ˆ«fRñÁFÚFÜRF&≤B∆¬‡¢ÚÚˆ∆FW"6f&íÜ2ÊÚ6Áf2fñ«FW"(	BFÜW&R6ÜR∂VW2FÜRˆ∆B«Ü&◊¿¢ÚÚvÜñ6Çó2v˜'6R'WBó2Ê˜BÊ˜FÜñÊr‡¢6ˆÁ7Bfñ«FW$Ù≤“GóVˆb2Êfñ«FW"””“w7G&ñÊrs∞¢6ˆÁ7BF&¥≤“ñÁFÙ6fP¢Ú6∆◊ÇÜ≤“„RíÚ„cR¬¬íÚÚFÜRF&≤F∂W2ÜW"V&«íÊB7FVFñ«ê¢¢6∆◊ÇÜ≤“„SRíÚ„C¬¬ì≤ÚÚ6÷∆¬ÊBFVW&Vf˜&RFÜR∆ñváBFñW0¢6ˆÁ7BF&¥R“F&¥≤¢F&¥≤¢É2“"¢F&¥≤ì∞¢ñbÜfñ«FW$Ù≤í∞¢2Êfñ«FW"“v'&ñváFÊW72Çr≤É“F&¥RíÁFÙfóÜVBÉ2í≤rís∞¢2Êv∆ˆ&ƒ«Ü““6∆◊ÇÜ≤“„ì2íÚ„r¬¬ì∞¢“V«6R∞¢2Êv∆ˆ&ƒ«Ü“ñÁFÙ6fP¢Ú“6∆◊ÇÜ≤“„ÇíÚ„cb¬¬ê¢¢“6∆◊ÇÜ≤“„sBíÚ„#b¬¬ì∞¢–¢ÚÚÑU"UDÑı$TB$4≤‚vVÊW&FVBg&ˆ“ÜW"˜v‚&ˆGíá6VR76WG2˜6˜W&6R˜&VbÚÊ@¢ÚÚ%EıTUTR*sí(	BFÜRfó'7BFñ÷RFÜRv÷R6Ü˜w2ÜW"g&ˆ“&VÜñÊBvóFÇ&V¿¢ÚÚ'B&FÜW"FÜ‚6ñFRfñWr66∆VBF˜v‚‚GvÚ7G&ñFRg&÷W27vˆ‚FÜP¢ÚÚFó7FÊ6R6ÜRÜ26˜fW&VBF˜v&BFÜRv¬FÜR6÷Rw&˜VÊB÷G&ófV‚'V∆RFÜP¢ÚÚvˆ«fW2v∆≤'í¬6ÚFÜRv∆≤6ÊÊ˜B÷ˆˆÁv∆≤Ü˜vWfW"∆ˆÊrFÜR6Ü˜B'VÁ2‡¢Ú¢ÚÚtÑî4Ç$4≤FWVÊG2ˆ‚FÜR7v˜&C¢FÜR&÷VBó"6'&ñW2FÜRW&ñfñW"7&˜70¢ÚÚÜW"6Ü˜V∆FW'2¬FÜR&&Ró"FˆW2Ê˜B¬ÊB6Ü˜vñÊrFÜRw&ˆÊrˆÊRÜÊG2FÜP¢ÚÚ˜vÊW"7v˜&Bñ‚FÜR˜VÊñÊrFÜBÜRÜ2Ê˜B&VV‚vófV‚ñWB‚vÜBFÜRvFP¢ÚÚó2‰ıB∆∆˜vVBFÚFÚ(	BFÜR˜vÊW"w2ñÁ7G'V7Fñˆ‚¬##b”Ç”#(	Bó2f∆¬&6≤F¢ÚÚÜW"6ñFRfñWs¢&óB6Ü˜V∆BGW&‚óG2&6≤¬Ê˜B2ñbóBw2'VÊÊñÊrFÚ¢ÚÚFó&V7Fñˆ‚‚óBw2ßW7BGW&ÊñÊr&6≤¬v∆∂ñÊrñÁ6ñFRFÜR&6∂w&˜VÊB‚"6ÚFÜP¢ÚÚw&ˆÊr◊7v˜&B&6≤&VG2FÜR&ñváB◊7v˜&B6ñFR¬ÊBFÜR∆ófR&ˆGíó2FÜR∆7@¢ÚÚ&W6˜'Bˆb'&˜w6W"FÜB∆ˆFVBÊVóFÜW"‡¢6ˆÁ7B&÷VB“ÑrÁ6fRbbrÁ6fRÊf∆w2bbrÁ6fRÊf∆w2Ê7'ó7F¬ì∞¢6ˆÁ7BG&b“÷FÇÊáó˜BáÇ“7É¬í“7ìí≤R¢c≤ÚÚFWFÇ6˜VÁG227G&ñFP¢6ˆÁ7B"“Ñ÷FÇÊf∆ˆ˜"áG&bÚ#bíR"íÚ¢∞¢ÚÚÙ‰R4ı5ET‘Rdı"DÑRtÑÙƒRtƒ≤‚FÜó2ñ6∂VBóG2∆FRW"g&÷RvóFÇFÜP¢ÚÚ˜FÜW"ó"2W"÷g&÷Rf∆∆&6≤¬6Ú'V‚vÜW&RFá&VRˆbFÜRf˜W"Ü@¢ÚÚFV6ˆFVBG&WrÜW"7G&ñFR2&&R‘¬&÷VB‘"¬&&R‘(	B6ÜR6ÜÊvVB6˜7GV÷P¢ÚÚGvñ6R6V6ˆÊBˆ‚ÜW"víFá&˜VvÇFÜRvFR‚FÜRó"ó26Ü˜6V‚Ù‰4R¬ˆ‚FÜP¢ÚÚfó'7BG&v‚g&÷R¬ÊBóBó2vÜñ6ÜWfW"ó"ó2vÜˆ∆S¢FÜR&ñváBˆÊRñbó@¢ÚÚó2ÜW&R¬FÜR7V'7FóGWFRñbóBó2Ê˜B¬ÊBñbÊVóFÜW"ó26ÜR∂VW2ÜW"6ñFP¢ÚÚfñWrf˜"FÜBg&÷RÊBFÜR6Üˆñ6Ró2∆VgB˜V‚f˜"FÜRÊWáBˆÊR‡¢ñbÇrÁó"í∞¢6ˆÁ7BvÁB“vFT&6µó"Ü&÷VBí¬«G“vFT&6µó"Ç&÷VBì∞¢ñbÜvFT&6¥ñ÷rávÁE≥“íbbvFT&6¥ñ÷rávÁE≥“íírÁó"“vÁC∞¢V«6RñbÜvFT&6¥ñ÷rÜ«G≥“íbbvFT&6¥ñ÷rÜ«G≥“íírÁó"“«G∞¢–¢ÚÚFÜRWFÜ˜&VB6∆ófó'7C≤FÜR∆FRó"ó2vÜB'VÁ2vÜV‚óBó2Ê˜BÜW&R‡¢ÚÚvÜñ6Ç6∆óó2FÜRFW7FñÊFñˆ‚w2VW7Fñˆ‚¬Ê˜BÜW'3¢6fRF∂W2ÜW"B'V‚‡¢Ú¢ÚÚ‚‚‰‰BÙ‰≈ítÑT‚4ÑRï2T‰$‘TB‚FÜR6∆óó2G&v‚vóFÇÊ˜FÜñÊrˆ‚ÜW"&6≤¿¢ÚÚ6ÚóBï2FÜR&&R6˜7GV÷RÊBó2&ñváBf˜"FÜR˜VÊñÊr¬vÜW&R6ÜRÜ2Ê˜@¢ÚÚ&VV‚vófV‚FÜR7'ó7F¬ñWB‚∆ññÊróB&÷VBv˜V∆BF∂RÜW"7v˜&BˆfbÜW ¢ÚÚ&6≤f˜"FÜR∆VÊwFÇˆbFÜRv∆≤(	BFÜR6÷R6∆72ˆbW'&˜"2FÜRW"÷g&÷P¢ÚÚ6˜7GV÷Rf∆ñ6∂W"FÜRó"∆ˆvñ2&V∆˜rv2w&óGFV‚FÚ7F˜‚‚&÷VB6∆óó0¢ÚÚˆ‚FÜR∆ó7Bñ‚Fˆ72Ù%EÙÑ‰DÙdbÊ÷B*sì≤VÁFñ¬óBWÜó7G2¬&÷VB∂VW2FÜP¢ÚÚ∆FW2‡¢ÚÚÜW"vVˆ‚ñ6∑2FÜR6∆ófó'7B¬FÜRFW7FñÊFñˆ‚6V6ˆÊC¢‚&÷VBFñW"Ü0¢ÚÚˆÊR6∆óÊBóBó2v∆≤¬&V6W6RˆÊ«íFÜRVÊ&÷VB6WBÜ2'V‚G&v‚f˜ ¢ÚÚóB‚VÊ&÷VB¬FÜR6fRF∂W2ÜW"B'V‚ÊBFÜRvFRBv∆≤‡¢6ˆÁ7Bv÷ˆFR“GóVˆbvVˆ‰÷ˆFR””“vgVÊ7Fñˆ‚rÚvVˆ‰÷ˆFRÑrÁ6fRí¢v6∆w2s∞¢6ˆÁ7B&÷VD6∆ó“tDUÙ4ƒïÙ$‘TE∑v÷ˆFU“«¬ÁV∆√∞¢6ˆÁ7B4ƒï“&÷VD6∆ó«¬ÜñÁFÙ6fRÚtDUÙ4ƒïı%T‚¢tDUÙ4ƒïì∞¢ÚÚf∆¬&6≤FÚFÜRVÊ&÷VBv∆≤ñbFÜó2FñW"w26∆óÜ2Ê˜BFV6ˆFVB(	B6fP¢ÚÚVÁFW&VBBv∆≤ó26÷∆∆W"w&ˆÊrFÜ‚ÜW"6ñFRfñWr6∆ñFñÊrñÁFÚ&ˆ6≤¿¢ÚÚÊB÷ó76ñÊr7v˜&Bó26÷∆∆W"w&ˆÊrFÜ‚ÊÚ6Ü&7FW"B∆¿¢6ˆÁ7B6∆óñ““vFT&6¥ñ÷rÑ4ƒïÊ∂Wíí«¬vFT&6¥ñ÷rÑtDUÙ4ƒïÊ∂Wíì∞¢6ˆÁ7B4ƒïR“vFT&6¥ñ÷rÑ4ƒïÊ∂WííÚ4ƒï¢tDUÙ4ƒï∞¢6ˆÁ7BvÁB“rÁó"ÚrÁó%∂%“¢rs∞¢6ˆÁ7Bñ““6∆óñ“ÚÁV∆¬¢ávÁBÚvFT&6¥ñ÷rávÁBí¢ÁV∆¬ì∞¢6ˆÁ7BFW'GW&S“&÷VBbbñÁFÙ6fRbbvFT&6¥ñ÷rÇvÜW&ÙFW'GW&Rrì∞¢ñbÜFW'GW&Rí∞¢6ˆÁ7B6ˆ√”2¥÷FÇÊ÷ñ‚ÉBƒ÷FÇÊf∆ˆ˜"Ü≤£Ríí∆7s÷FW'GW&RÊÊGW&≈vñGFÇÛÉ∞¢ÚÚ6˜W&6R«&VGí&V6VFW2‚6ˆ◊VÁ6FRóG2W'7V7FófR&Vf˜&R«ññÊrFÜP¢ÚÚWÜó7FñÊr6ˆÁFñÁV˜W2v˜&∆B÷FWFÇ66∆R¬6ÚóBÊWfW"6á&ñÊ∑2Gvñ6R‡¢6ˆÁ7B&FñÛ’≥CÇ√3ìB√3s2√3Sí√33B√#ì√#C√ì’∂6ˆ≈“ÛCÉ∞¢6ˆÁ7BFÉ”ì"ß62˜&FñÛ∞¢2ÊG&tñ÷vRÜFW'GW&R∆6ˆ¬¶7r√∆7r∆FW'GW&RÊÊGW&ƒÜVñváB«Ç÷FÇÛ"«í÷FÇ∆FÇ∆FÇì∞¢rÊvFT&6¥∂Wì“vÜW&ÙFW'GW&Rs∞¢“V«6RñbÜ6∆óñ“í∞¢6ˆÁ7B‰&6≤“4ƒïRÊ6V∆«2“4ƒïRÁGW&„∞¢ÚÚFÜR'V‚GW&Á2óG2∆Vw2˜fW"f7FW"¬6ÚóG27G&ñFR6˜VÁFW"ó26Ü˜'FW ¢6ˆÁ7B7FW“4ƒïR””“tDUÙ4ƒïı%T‚Úí¢#c∞¢6ˆÁ7B6V∆¬“≤¬4ƒïRÁGW&‰g&0¢Ú÷FÇÊ÷ñ‚Ñ4ƒïRÁGW&‚“¬÷FÇÊf∆ˆ˜"Ü≤Ú4ƒïRÁGW&‰g&2¢4ƒïRÁGW&‚íê¢¢4ƒïRÁGW&‚≤Ñ÷FÇÊf∆ˆ˜"áG&bÚ7FWíR‰&6≤ì∞¢6ˆÁ7B7r“6∆óñ“ÊÊGW&≈vñGFÇÚ4ƒïRÊ6V∆«3∞¢6ˆÁ7BFÇ“ì"¢62¬Gr“FÇ¢Ü7rÚ6∆óñ“ÊÊGW&ƒÜVñváBì∞¢2ÊG&tñ÷vRÜ6∆óñ“¬6V∆¬¢7r¬¬7r¬6∆óñ“ÊÊGW&ƒÜVñváB¬Ç“GrÚ"¬í“FÇ¬Gr¬FÇì∞¢rÊvFT&6¥∂Wí“4ƒïRÊ∂Wì∞¢–¢ÚÚvÜBFÜR6Ü˜B7GV∆«íG&WrÜW"2¬f˜"FW7G2ˆ˜VÊñÊrÊ6ß2(	B'6ÜRGW&ÊVBÜW ¢ÚÚ&6≤"ó2FÜRvÜˆ∆RˆñÁBˆbFÜó2gVÊ7Fñˆ‚ÊBóBó2Ê˜B&VF&∆Rg&ˆ“FÜP¢ÚÚ˜WG6ñFR˜FÜW'vó6P¢ñbÇ6∆óñ“bbFW'GW&RírÊvFT&6¥∂Wí“ñ“ÚvÁB¢rs∞¢ñbÜñ“bbFW'GW&Rí∞¢6ˆÁ7BFÇ“ì"¢62¬Gr“FÇ¢Üñ“ÊÊGW&≈vñGFÇÚñ“ÊÊGW&ƒÜVñváBì∞¢ÚÚFÜRvóBw2fW'Fñ6¬¬ˆfbFÜR6÷R7G&ñFR6˜VÁFW"2FÜRg&÷W2‚FÜR6∆ó ¢ÚÚFˆW2‰ıBvWBFÜó3¢óB6'&ñW2óG2˜v‚fW'Fñ6¬¬ÊB6V6ˆÊB7ñÁFÜWFñ2&ˆ ¢ÚÚ˜fW"‚WFÜ˜&VB7ñ6∆Ró2FÜRFÜñÊrFW7G2ˆvóBÊ6ß2f˜&&ñG2f˜"FÜR'V‚‡¢6ˆÁ7B&ó6R“‘÷FÇÊ'2Ñ÷FÇÁ6ñ‚ÇáG&bÚ#bí¢÷FÇÂííí¢"„"¢63∞¢2ÊG&tñ÷vRÜñ“¬Ç“GrÚ"¬í“FÇ≤&ó6R¬Gr¬FÇì∞¢“V«6RñbÇ6∆óñ“bbFW'GW&Rbb∆ñW"í∞¢ÚÚÊVóFÜW"&6≤∆FRFV6ˆFVB‚ÜW"∆ófR&ˆGíó2∆¬FÜBó2∆VgB(	B'WBóBó0¢ÚÚG&ófV‚Btƒ≤7VVB¬Ê˜BFÜRˆ∆B#¬6ÚFÜBBv˜'7BFÜR6Ü˜B&VG20¢ÚÚ6ˆ÷VˆÊRv∆∂ñÊrˆfb&FÜW"FÜ‚7&ñÁFñÊr6ñFWvó2ñÁFÚv∆¬‡¢6ˆÁ7BFó"“÷FÇÁ6ñv‚áGÇ“7Éí«¬∞¢6ˆÁ7BgÉ“∆ñW"ÁgÇ¬c“∆ñW"Êf6R¬gc“∆ñW"Êf6Ufó3∞¢∆ñW"ÁgÇ“Fó"¢ìc≤∆ñW"Êf6R“Fó#≤∆ñW"Êf6Ufó2“Fó#∞¢2ÁG&Á6∆FRáÇ¬íì∞¢2Á66∆Rá62¬62ì∞¢2ÁG&Á6∆FRÇ“á∆ñW"ÁÇ≤∆ñW"ÁrÚ"í¬“á∆ñW"Áí≤∆ñW"ÊÇíì∞¢∆ñW"ÊG&rÜ2ì∞¢∆ñW"ÁgÇ“gÉ≤∆ñW"Êf6R“c≤∆ñW"Êf6Ufó2“gc∞¢–¢2Á&W7F˜&RÇì∞¢ÚÚÊBFÜR∆ñváBg&ˆ“ñÁ6ñFRFÜRvFR&V6ÜW2˜WBf˜"ÜW ¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Êv∆ˆ&ƒ«Ü“„≤R¢„3∞¢6ˆÁ7Bvr“2Ê7&VFU&Fñƒw&FñVÁBáGÇ¬Gí“c¬Ç¬GÇ¬Gí“c¬#cì∞¢vrÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#B√3Ç√„íírì≤vrÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√ì√ì√írì∞¢2Êfñ∆≈7Gñ∆R“vs≤2Ê&VvñÂFÇÇì≤2Ê&2áGÇ¬Gí“c¬#c¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢ÚÚ‚‚ÊÊBFÜRv˜&∆BFñ◊2&VÜñÊBÜW"26ÜR∆VfW2óB(	B∆FRÊB6∆˜r¬6¢ÚÚFÜR6÷∆¬fñwW&Rv∆∂ñÊrvíó2FÜR6Ü˜B¬Ê˜BFÜR&∆6∂˜W@¢6ˆÁ7BtFñ““6∆◊ÇÜ≤“„c"íÚ„3Ç¬¬í¬tFñ‘R“tFñ“¢tFñ“¢É2“"¢tFñ“ì∞¢2Êfñ∆≈7Gñ∆R“w&v&É√√¬r≤átFñ‘R¢„ìríÁFÙfóÜVBÉ2í≤rís∞¢2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞ß–¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚDÑRt¥î‰r‚GvÚ6V6ˆÊG2ñ‚vÜñ6Ç6ÜR6ÊÊ˜BFÚÁóFÜñÊr¬ˆ‚W'˜6R‡¢Ú¢ÚÚFÜR˜VÊñÊrfñ∆“VÊG2ˆ‚ÜW"WñW2˜VÊñÊs≤FÜó2ó2FÜR÷6ÜñÊR∆WGFñÊrvÚˆ`¢ÚÚÜW"‚ÜW"6ˆÁG&ˆ«2&RÜV∆Bf˜"óB(	BFÜR6÷RÜˆ∆BFÜRwV&Fñ‚6Ü÷&W'2W6R(	@¢ÚÚ&V6W6R&V∆V6Rñ˜R6‚v∆≤˜WBˆbÜ∆gvíFá&˜VvÇó2Ê˜B&V∆V6R¬óBó0¢ÚÚ∆ˆFñÊr67&VV‚vóFÇñ7GW&Rˆ‚óB‚óBÜVÁ2WÜ7F«íˆÊ6RW"6fR‡¶gVÊ7Fñˆ‚v∂U7F'BÇí∞¢ñbÇrÁ6fR«¬ÑrÁ6fRÊf∆w2bbrÁ6fRÊf∆w2Ávˆ∂Ríí&WGW&„∞¢6ˆÁ7BfV«B“ó4ÜW&ÚÇì∞¢rÁv∂R“≤C¢fV«BÚB„"¢"¬F˜F√¢fV«BÚB„"¢"¬fV«B”∞¢Ê'&FófTVFñıFñ6≤Çì∞¢ñbáGóVˆb6gÇ””“vgVÊ7Fñˆ‚rí6gÇÜfV«BÚv÷WF¬r¢w˜vW%Wrì∞¢ñbáGóVˆb6“”“wVÊFVfñÊVBrí6“Á6Ü∂R“÷FÇÊ÷ÇÜ6“Á6Ü∂R¬Bì∞¢ñbáGóVˆbE'V÷&∆R””“vgVÊ7Fñˆ‚ríE'V÷&∆RÉ„R¬„B¬sì∞ß–¶gVÊ7Fñˆ‚WFFUv∂RÜGBí∞¢ñbÇrÁv∂Rí&WGW&„∞¢6ˆÁ7B&Vf˜&R“rÁv∂RÁC∞¢rÁv∂RÁB”“GC∞¢ñbÑrÁv∂RÊfV«Bí∞¢ñbÜ&Vf˜&R‚2„#RbbrÁv∂RÁB√“2„#Rí≤6gÇÇw6Ü˜'Brì≤rÊf∆6É‘÷FÇÊ÷ÇÑrÊf∆6Ç¬„bì∂6“Á6Ü∂S‘÷FÇÊ÷ÇÜ6“Á6Ü∂R√"ì≤–¢ñbÜ&Vf˜&R‚"„bbrÁv∂RÁB√“"„í≤6gÇÇw˜vW%Wrì≤rÁFˆ7BáBÇwv∂UˆfV«Bríì≤–¢–¢ÚÚFÜR6«VÊ≤ˆbFÜR∆7BV÷&ñ∆ñ6¬6ˆ÷ñÊrˆfb¬Ü∆b6V6ˆÊBñ‡¢ñbÜ&Vf˜&R‚„CRbbrÁv∂RÁB√“„CRí≤6gÇÇv÷WF¬rì≤6“Á6Ü∂R“÷FÇÊ÷ÇÜ6“Á6Ü∂R¬bì≤–¢ñbÑrÁv∂RÁB√“í∞¢rÁv∂R“ÁV∆√∞¢ñbÑrÁ6fRÊf∆w2írÁ6fRÊf∆w2Ávˆ∂R“∞¢ñbáGóVˆbW'6ó7B””“vgVÊ7Fñˆ‚ríW'6ó7BÇì∞¢–ß–¶gVÊ7Fñˆ‚G&tf∆˜&Çí∞¢ñbáGóVˆbó4ÜW&Ú””“vgVÊ7Fñˆ‚rbbó4ÜW&ÚÇíí&WGW&„≤ÚÚFÜRˆGó76WíÜ2óG2˜v‚v˜&∆@¢6ˆÁ7B∆‚“f∆˜&∆‚ÑrÁ&ˆˆ‘ñBì∞¢ñbÇ∆‚Ê∆VÊwFÇí&WGW&„∞¢6ˆÁ7B¶ˆÊR“rÁ&ˆˆ‘FVbÁ¶ˆÊR¬f#“Ö≈∑¶ˆÊU“«¬∑“íÊf"«¬r3#Cs∞¢ÚÚU$î¬U%5T5DïdR‘íD¥RDÑRƒîtÖB‚ïB‘í‰ıBD¥RDÑRƒîdR‡¢ÚÚFÜRW6Ç÷&6≤&V∆˜rñÁG2FÜR∂ñÊvFˆ“w2d"6ˆ∆˜W"˜fW"WfW'í∆ÁB¬Ê@¢ÚÚñ‚FÜR÷VF˜rFÜB6ˆ∆˜W"ó26ˆ∆BFV¬(	B6ÚFÜR∆ÁG26÷R˜WBFÜR6÷P¢ÚÚ∆R&«VR2FÜR6∑í&VÜñÊBFÜV“¬vÜñ6Çó2vÜBFÜR˜vÊW"&W˜'FVC¢'fW'ê¢ÚÚ∆R&«VRfñ&RñÁ7FVBˆbfñ'&ÁB‚‚‚óB6Ü˜V∆F‚wB&R6ÚV∆V7G&ˆÊñ2‚ ¢ÚÚFó7FÊ6RFˆW2G&ñ‚6ˆ∆˜W"¬6ÚFÜRFñÁB7Fó3≤óBó2÷óÜVBÜ∆gvíFÚóG0¢ÚÚ˜v‚w&Wífó'7B¬6ÚvÜBóBF∂W2ó2d≈TRÊBˆÊ«íÜ∆b2◊V6ÇÖTR‡¢6ˆÁ7Bf"“ÇÇí”‚∞¢6ˆÁ7B““ı‚2Ö≥”ñ÷e◊≥g“íBˆíÊWÜV2Üf#ì∞¢ñbÇ“í&WGW&‚f#∞¢6ˆÁ7Bb“'6TñÁBÜ’≥“¬bí¬"“b„‚bb#SR¬s"“b„‚Çb#SR¬"“bb#SS∞¢6ˆÁ7Bí“÷FÇÁ&˜VÊBÇá"≤s"≤"íÚ2ì∞¢6ˆÁ7B÷óÇ“Ü¬#"í”‚÷FÇÁ&˜VÊBÇÜ≤#"íÚ"ì∞¢&WGW&‚w&v"Çr≤÷óÇá"¬íí≤r¬r≤÷óÇÜs"¬íí≤r¬r≤÷óÇÜ"¬íí≤rís∞¢“íÇì∞¢6ˆÁ7BÊ˜r“W&f˜&÷Ê6RÊÊ˜rÇíÚ∞¢f˜"Ü6ˆÁ7Bˆb∆‚í∞¢6ˆÁ7Bñ““‘TDîÙî‘u∑Á2Ê∂Wï”∞¢ñbÇñ“«¬ñ“ÊÊGW&≈vñGFÇí6ˆÁFñÁVS∞¢6ˆÁ7BÇ“Á2Ê≤¢DîƒR¢Á62¬r“Ç¢Üñ“ÊÊGW&≈vñGFÇÚñ“ÊÊGW&ƒÜVñváBì∞¢2Á6fRÇì∞¢2ÁG&Á6∆FRÜ6’5ÇÇí¢É“Á2Á"í¬6’5íÇí¢É“Á2Á"íì∞¢ÚÚ6∆˜r7ví¬Ü6R÷ˆfg6WBW"∆ÁB‚FñÁí(	B„"&B(	B&V6W6Rv&FV‡¢ÚÚvÜW&RWfW'í7F∆≤7vñÊw2ñ‚7FW&VG2267&VVÁ6fW"‡¢2ÁG&Á6∆FRáÁÇ¬Áíì∞¢ÚÚ‰ÚEtîÂ2‚GvÚˆbFÜR6÷R∆ÁBBFÜR6÷R6ó¶RÊBFÜR6÷R˜7GW&Rñ‡¢ÚÚˆÊRg&÷R&VB26˜í◊7FRÜ˜vWfW"vˆˆBFÜR76WBó2¬6ÚV6Ç6'&ñW0¢ÚÚóG2˜v‚∆V‚ˆ‚F˜ˆbFÜR6Ü&VB7ví(	BÜ6ÜVBˆfbFÜR&ˆˆ“∆ñ∂P¢ÚÚWfW'óFÜñÊrV«6RÜW&R¬vÜñ6Ç∂VW2óBFÜR6÷Rv&FV‚ˆ‚WfW'ífó6óBÊ@¢ÚÚˆ‚WfW'í∆Ff˜&“Ö%TƒRÙ‰Rí‡¢2Á&˜FFRÇáÊ∆V‚«¬í≤÷FÇÁ6ñ‚ÜÊ˜r¢„R≤ÁÇí¢„"ì∞¢ñbáÊf∆óí2Á66∆RÇ”¬ì∞¢2Êv∆ˆ&ƒ«Ü““Á2ÊFñ”∞¢2ÊG&tñ÷vRá66VÊW'ïFñÁBÜñ“¬f"¬Á2ÊFñ“¢„3Çí¬◊rÚ"¬÷Ç¬r¬Çì∞¢2Á&W7F˜&RÇì∞¢–ß–¢ÚÚˆÊ«ífWF6Ç∂ñÊvFˆ“w2f∆˜&vÜV‚6ÜRó27FÊFñÊrñ‚ó@¶gVÊ7Fñˆ‚f∆˜&&V∆ˆBá¶ˆÊRí∞¢6ˆÁ7B6WB“dƒı$∑¶ˆÊU”∞¢ñbÇ6WB«¬GóVˆb÷VFñfWF6Ç”“vgVÊ7Fñˆ‚rí&WGW&„∞¢f˜"Ü6ˆÁ7B2ˆb6WBí÷VFñfWF6Çá2Ê∂Wíì∞ß–¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¢ÚÚDÑRDÖ%U5B$ÙıE2(	BFÜRÜ&Gv&RFÜBWá∆ñÁ2FÜRF6Ç‡¢Ú¢ÚÚ6ÜRó2‘4Ñî‰R¬ÊB÷6ÜñÊRFˆW2Ê˜BˆÊRFíFó66˜fW"óB6‚7&˜72v ¢ÚÚñ‚7G&ñváB∆ñÊRBÊñÊRáVÊG&VBóÜV«26V6ˆÊB‚óBvWG2fóGFVBf˜"óB‡¢ÚÚFÜRF6ÇÜ2«vó2&VV‚ÂTƒƒd‰rw2w&ÁC≤FÜW6R&RFÜRFÜñÊrFÜBw&Á@¢ÚÚ7GV∆«íó2¬ÊBVÁFñ¬Ê˜rFÜRv÷R6Ü˜vVBFÜRWÜÜW7Bˆbó"ˆb&ˆ˜G0¢ÚÚFÜBFñBÊ˜BWÜó7B‡¢Ú¢ÚÚFÜWí&RG&v‚GW&ñÊrFÜRD4ÇÊBˆÊ«íGW&ñÊrFÜRF6Ç¬vÜñ6Çó2Ê˜B¢ÚÚ6ˆ◊&ˆ÷ó6R(	BóBó2vÜW&RFÜRvV"ó2FˆñÊr6ˆ÷WFÜñÊr‚ÜW"∆Vw2&Rî≤◊6ˆ«fV@¢ÚÚÊBÜW"'V‚7ñ6∆Ró2&ˆ6VGW&¬¬6Ú7FFñ2&ˆ˜B∆FR7F∆VBFÚ÷˜fñÊp¢ÚÚfˆ˜B&VG227Fñ6∂W#≤&ˆ˜B∆FR∆ñvÊVBFÚFÜRF6ÇdT5Dı"¬BFÜP¢ÚÚ÷ˆ÷VÁB&˜FÇfVWB&R∆ˆ6∂VBFˆvWFÜW"ÊBˆñÁFñÊrFÜR6÷Rví¬&VG22FÜP¢ÚÚ÷6ÜñÊRóBó2‚FÜRWFÜ˜&VB∆FR6'&ñW2óG2˜v‚WÜÜW7B¬6ÚóB6óG2˜fW ¢ÚÚFÜR&ˆ6VGW&¬6ˆÊR&FÜW"FÜ‚&W∆6ñÊróC¢FÜR6ˆÊRó2FÜR∆ñváBñ‚FÜP¢ÚÚ&ˆˆ“¬FÜR∆FRó2FÜRÜ&Gv&R÷∂ñÊróB‡¶gVÊ7Fñˆ‚G&uFá'W7D&ˆ˜G2Ü2¬í∞¢ñbáGóVˆbó4ÜW&Ú””“vgVÊ7Fñˆ‚rbbó4ÜW&ÚÇíí&WGW&„∞¢6ˆÁ7Bñ““‘TDîÙî‘rÊ&ˆ˜G4fó&S∞¢ñbÇñ“«¬ñ“ÊÊGW&≈vñGFÇí≤ñbáGóVˆb÷VFñfWF6Ç””“vgVÊ7Fñˆ‚rí÷VFñfWF6ÇÇv&ˆ˜G4fó&Rrì≤&WGW&„≤–¢6ˆÁ7BGgÇ“ÊF6ÖeÇ«¬Êf6R¢ì¬Ggí“ÊF6Öeí«¬∞¢6ˆÁ7BF‚“÷FÇÊáó˜BÜGgÇ¬Ggíí«¬∞¢ÚÚFÜR∆FRó2WFÜ˜&VBˆñÁFñÊrƒTeBvóFÇóG2WÜÜW7BG&ñ∆ñÊr&ñváB¬6ÚFÜP¢ÚÚÊv∆Ró2F∂V‚g&ˆ“FÜRF6ÇFó&V7Fñˆ‚ÊB÷ó'&˜&VBf˜"&ñváGv&BF6Ç(	@¢ÚÚÊWfW"&˜FFVBÜ∆bGW&‚¬vÜñ6Çv˜V∆BWBFÜRf∆÷W2˜WBñ‚g&ˆÁBˆbÜW ¢6ˆÁ7B&ñváGv&B“GgÇ„“∞¢6ˆÁ7BÊr“÷FÇÊF„"ÜGgí¬GgÇí≤á&ñváGv&BÚ÷FÇÂí¢ì∞¢6ˆÁ7BÇ“#b¬r“Ç¢Üñ“ÊÊGW&≈vñGFÇÚñ“ÊÊGW&ƒÜVñváBì∞¢2Á6fRÇì∞¢2ÁG&Á6∆FRáÁÇ≤ÁrÚ"¬Áí≤ÊÇ“Çì∞¢2Á&˜FFRÜÊrì∞¢ñbá&ñváGv&Bí2Á66∆RÇ”¬ì∞¢ÚÚFÜR&ˆ˜G26óB6∆ñváF«ídı%t$BˆbÜW"6VÁG&R(	BFÜRfVWB∆VBF6Ä¢2Êv∆ˆ&ƒ«Ü“„ìS∞¢2ÊG&tñ÷vRÜñ“¬◊r¢„#b¬÷ÇÚ"¬r¬Çì∞¢2Á&W7F˜&RÇì∞ß–¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚ$ÙÙ“eU$‰ïEU$R(	B∆6VB6WBñV6W2FÜB&R66VÊW'í¬Ê˜B7FFñ73¢Ê˜FÜñÊp¢ÚÚÜW&R6‚&RñÁFW&7FVBvóFÇ¬6ÚóBÊWfW"VÁFW'2rÁ7FFñ72ÜfñÊDÊV"v˜V∆@¢ÚÚˆffW"&ˆ◊Bf˜"óBíÊBÊWfW"6˜7G26fRf∆r‚v˜&∆B6ˆ˜&FñÊFW2¿¢ÚÚG&v‚vóFÇFÜR7FFñ726ÚóB6óG2ñ‚FÜR6÷R∆ñváB‡¢Ú¢ÚÚ4U%dÚu2tî‰Dî‰rÑıU4RÜ∂ñÊvFˆ“&˜Fˆ6ˆ√¢WfW'íÂ2Ü2∆6R¬˜"¢ÚÚ&V6ˆ‚í‚ˆ∆B6W'fÚ'Vñ«BFÜRvÁG&ñW2˜fW"FÜR÷VF˜r(	BÜó2˜v‚∆ñÊR(	BÊ@¢ÚÚÜó26ˆñ¬W'&ÊB6ó2váíÜR7FÊG2BFÜVó"fˆ˜C¢$í6ÊÊ˜B6∆ñ÷"Áê¢ÚÚ÷˜&R‚"vÜBv2÷ó76ñÊrv2FÜRƒ4RFÜB6VÁFVÊ6Rñ◊∆ñW2‚FÜó2ó2óC†¢ÚÚFÜRvñÊ6ÇÜR&ó6VBFÜRvÁG&ñW2vóFÇ¬G'V“ÊBg&÷RÊB6vvñÊr6Áf2¿¢ÚÚ7FÊFñÊr&VÜñÊBÜñ“vóFÇóG26&∆R7Fñ∆¬÷FRˆfbF˜v&BFÜR6∆ñ÷"‚FÜP¢ÚÚG&vñÊró2$Ù4TEU$¬5D‰B‘î‚vóFñÊróG2fó&VB∆FRÑ%EıTUTR*s&Çí¿¢ÚÚ6÷R∆r2G&t&ˆ˜FÉ≤Ê˜FÜñÊrñ‚óB&W6VÁG2&ñváBÊv∆R‡¶6ˆÁ7B$ÙÙ’ı$ı2“≤¢∑≤∂ñÊC¢wvñÊ6Çr¬GÉ¢2¬Gì¢R’“”∞¶gVÊ7Fñˆ‚G&uvñÊ6ÑÜ˜W6RáwÇ¬wíí∞¢2Á6fRÇì∞¢ÚÚFÜR&6≤6ÜV∆√¢∆V‚◊FÚˆb67&∆FR¬FóVBFÜRvíFÜR&ˆ˜FÇFó0¢2Êfñ∆≈7Gñ∆R“r3É#s∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚáwÇ“S"¬wíì∞¢2Ê∆ñÊUFÚáwÇ“C¬wí“sÇì∞¢2Ê∆ñÊUFÚáwÇ≤Cb¬wí“ÉÇì∞¢2Ê∆ñÊUFÚáwÇ≤SB¬wíì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÚÚGvÚFW&VBˆ∆W27&˜76ñÊrBFÜRÜVB(	B‚÷g&÷R¬Ê˜BFˆ˜'vê¢2Êfñ∆≈7Gñ∆R“r3#ís∞¢f˜"Ü6ˆÁ7B2ˆb≤”¬“í∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚáwÇ≤2¢CB¬wíì∞¢2Ê∆ñÊUFÚáwÇ≤2¢Ç¬wí“ìbì∞¢2Ê∆ñÊUFÚáwÇ≤2¢"¬wí“ì"ì∞¢2Ê∆ñÊUFÚáwÇ≤2¢3b¬wíì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢–¢ÚÚFÜR6vvñÊr6Áf2Fá&˜v‚˜fW"FÜRÜVB¬66∆∆˜÷ÜV÷÷VB∆ñ∂RFÜR&ˆ˜FÇw0¢2Êfñ∆≈7Gñ∆R“r33#É3bs∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚáwÇ“SÇ¬wí“sBì∞¢2ÁVG&Fñ47W'fUFÚáwÇ“B¬wí“"¬wÇ≤Sb¬wí“Éì∞¢2Ê∆ñÊUFÚáwÇ≤S¬wí“c"ì∞¢f˜"Ü∆WBí“3≤í„“≤í““í∞¢6ˆÁ7BáÇ“wÇ“S≤Üí≤„Rí¢#s∞¢2ÁVG&Fñ47W'fUFÚÜáÇ≤Ç¬wí“S¬áÇ“Ç¬wí“c"ì∞¢–¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÚÚDÑRE%T“(	BFÜRvñÊFñÊrvV"óG6V∆b¬áVÊr6∆ñváF«í6∂Wrñ‚FÜRg&÷P¢6ˆÁ7BGÇ“wÇ≤"¬Gí“wí“CB¬G"“#∞¢6ˆÁ7B7ñ‚“÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ#cí¢„#≤ÚÚóB7Fñ∆¬GW&Á2¬&&V«ê¢2Á6fRÇì∞¢2ÁG&Á6∆FRÜGÇ¬Gíì≤2Á&˜FFRÉ„"≤7ñ‚¢„Bì∞¢2Êfñ∆≈7Gñ∆R“r3CS&s∞¢2Ê&VvñÂFÇÇì≤2Ê&2É¬¬G"¬¬rì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“r3&6F2s≤2Ê∆ñÊUvñGFÇ“3∞¢2Ê&VvñÂFÇÇì≤2Ê&2É¬¬G"“2¬¬rì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“r3#ís≤2Ê∆ñÊUvñGFÇ“"„C∞¢f˜"Ü∆WBí“≤í¬3≤í≤≤í∞¢6ˆÁ7B“7ñ‚≤íÚ2¢÷FÇÂì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÑ÷FÇÊ6˜2Üí¢ÜG"“Bí¬÷FÇÁ6ñ‚Üí¢ÜG"“Bíì∞¢2Ê∆ñÊUFÚÇ‘÷FÇÊ6˜2Üí¢ÜG"“Bí¬‘÷FÇÁ6ñ‚Üí¢ÜG"“Bíì≤2Á7G&ˆ∂RÇì∞¢–¢2Á&W7F˜&RÇì∞¢ÚÚFÜR6&∆S¢ˆfbFÜRG'V“¬WÊBvíF˜v&BFÜRvÁG'í6∆ñ÷"¬6vvñÊp¢ÚÚVÊFW"óG2˜v‚vVñváBÊBfFñÊr&Vf˜&RóB6‚6∆ñ“FW7FñÊFñˆ‡¢6ˆÁ7B6r“2Ê7&VFT∆ñÊV$w&FñVÁBÜGÇ¬Gí¬GÇ≤#S¬Gí“sì∞¢6rÊFD6ˆ∆˜%7F˜É¬w&v&Éì√√3"√„Çírì≤6rÊFD6ˆ∆˜%7F˜É¬w&v&Éì√√3"√írì∞¢2Á7G&ˆ∂U7Gñ∆R“6s≤2Ê∆ñÊUvñGFÇ“#∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜGÇ≤G"“2¬Gí“bì∞¢2ÁVG&Fñ47W'fUFÚÜGÇ≤#¬Gí“3¬GÇ≤#S¬Gí“sì∞¢2Á7G&ˆ∂RÇì∞¢ÚÚ6ˆñ¬ˆb7&R∆ñÊRÊBˆÊR÷∆VvvVB7Fˆˆ¬BFÜR&6S¢6ˆ÷V&ˆGítı$µ2ÜW&P¢2Á7G&ˆ∂U7Gñ∆R“r3#3&3Rs≤2Ê∆ñÊUvñGFÇ“3∞¢2Ê&VvñÂFÇÇì≤2Ê&2áwÇ“3¬wí“r¬r¬„2¬R„bì≤2Á7G&ˆ∂RÇì∞¢2Ê&VvñÂFÇÇì≤2Ê&2áwÇ“3¬wí“r¬B¬„b¬R„"ì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r3CS&s∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚáwÇ≤3¬wí“Bì≤2ÁVG&Fñ47W'fUFÚáwÇ≤C¬wí“r¬wÇ≤Cb¬wí“"ì∞¢2Ê∆ñÊUFÚáwÇ≤C"¬wíì≤2Ê∆ñÊUFÚáwÇ≤3b¬wíì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÚÚˆÊR6÷∆¬v˜&≤∆◊áVÊrˆfbFÜRg&÷R¬v&“ÊBFó&V@¢6ˆÁ7B«Ç“wÇ“B¬«í“wí“ÉC∞¢2Êfñ∆≈7Gñ∆R“r3CCBs∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ü«Ç¬«í¬R¬¬rì≤2Êfñ∆¬Çì∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7B∆r“2Ê7&VFU&Fñƒw&FñVÁBÜ«Ç¬«í≤2¬¬«Ç¬«í≤2¬#bì∞¢∆rÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#B√#√„3írì≤∆rÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√ì√√írì∞¢2Êfñ∆≈7Gñ∆R“∆s≤2Ê&VvñÂFÇÇì≤2Ê&2Ü«Ç¬«í≤2¬#b¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢2Á&W7F˜&RÇì∞ß–¶gVÊ7Fñˆ‚G&u7FFñ72Öí∞¢f˜"Ü6ˆÁ7B"ˆbÖ$ÙÙ’ı$ı5¥rÁ&ˆˆ‘ñE“«¬µ“íê¢ñbá"Ê∂ñÊB””“wvñÊ6ÇríG&uvñÊ6ÑÜ˜W6Rá"ÁGÇ¢DîƒR≤b¬"ÁGí¢DîƒRì∞¢f˜"Ü6ˆÁ7B2ˆbrÁ7FFñ72í∞¢6ˆÁ7B&ˆ"“÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚS≤2ÁBí¢3∞¢ñbá2ÁGóR””“v&VÊ6ÇrbbGóVˆbó4ÜW&Ú””“vgVÊ7Fñˆ‚rbbó4ÜW&ÚÇíí∞¢ÚÚdıTÂDî‚ÙbƒîdRÜÜW&Úv˜&∆Bí(	B÷&&∆R7&ñÊrˆbv∆˜vñÊrV∆óÜó ¢6ˆÁ7B◊Ç“2ÁÇ≤2ÁrÚ"¬Ê˜r“W&f˜&÷Ê6RÊÊ˜rÇì∞¢6ˆÁ7B6Ü&vñÊr“rÁ&V6Ü&vRbb÷FÇÊ'2ÑrÁ&V6Ü&vRÁÇ“◊Çí¬CC∞¢6ˆÁ7B'í“2Áí≤#≤ÚÚ&6ñ‚vFW"∆ñÊP¢ÚÚ7FWVB7FˆÊR&6P¢2Êfñ∆≈7Gñ∆R“r6#vCìRs≤'"Ü2¬2ÁÇ“Ç¬2Áí≤2ÊÇ“"¬2Ár≤b¬"¬Bì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r66&fbs≤'"Ü2¬2ÁÇ“2¬2Áí≤2ÊÇ“#¬2Ár≤b¬í¬2ì≤2Êfñ∆¬Çì∞¢ÚÚ6VÁG&¬VFW7F¬vóFÇ6ˆgBfW'Fñ6¬÷&&∆Rw&FñVÁ@¢6ˆÁ7Br“2Ê7&VFT∆ñÊV$w&FñVÁBÜ◊Ç¬'í¬◊Ç¬2Áí≤2ÊÇì∞¢rÊFD6ˆ∆˜%7F˜É¬r6SfFF3Çrì≤rÊFD6ˆ∆˜%7F˜É¬r3ñ3ì#vrì∞¢2Êfñ∆≈7Gñ∆R“s≤'"Ü2¬◊Ç“Ç¬'í¬b¬2ÊÇ“#"¬2ì≤2Êfñ∆¬Çì∞¢ÚÚ&6ñ‚&˜v¬á7FˆÊR&ñ“ê¢2Êfñ∆≈7Gñ∆R“r6CÜ6f&s≤2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ◊Ç¬'í¬2ÁrÚ"¬¬¬¬rì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r6#cÜRs≤2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ◊Ç¬'í¬2ÁrÚ"“2¬Ç¬¬¬rì≤2Êfñ∆¬Çì∞¢ÚÚv∆˜vñÊrV∆óÜó"vFW"7W&f6RÜvˆ∆N(i'GW'Vˆó6Rí¬Êñ÷FVB6Üñ÷÷W ¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7Bvr“2Ê7&VFU&Fñƒw&FñVÁBÜ◊Ç¬'í¬"¬◊Ç¬'í¬2ÁrÚ"ì∞¢vrÊFD6ˆ∆˜%7F˜É¬6Ü&vñÊrÚr6ffc63r¢r6ffSÜrì∞¢vrÊFD6ˆ∆˜%7F˜É„b¬r3vfCF3Çrì≤vrÊFD6ˆ∆˜%7F˜É¬w&v&É#√#√É√írì∞¢2Êv∆ˆ&ƒ«Ü“6Ü&vñÊrÚ„í¢„s≤2Êfñ∆≈7Gñ∆R“vs∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ◊Ç¬'í¬2ÁrÚ"“B¬r¬¬¬rì≤2Êfñ∆¬Çì∞¢ÚÚ6ˆÊ6VÁG&ñ2&ó∆W0¢2Á7G&ˆ∂U7Gñ∆R“r6ffSÜs≤2Ê∆ñÊUvñGFÇ“∞¢f˜"Ü∆WB"“≤"¬3≤"≤≤í∞¢6ˆÁ7B'“ÇÜÊ˜rÚì≤"Ú2íRì∞¢2Êv∆ˆ&ƒ«Ü“É“'í¢Ü6Ü&vñÊrÚ„b¢„3Rì∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ◊Ç¬'í¬á2ÁrÚ"“bí¢'≤2¬ÉRí¢'≤"¬¬¬rì≤2Á7G&ˆ∂RÇì∞¢–¢2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢ÚÚ&ó6ñÊr7&ñÊr¶WBˆb∆ñváBg&ˆ“FÜR6VÁG&P¢6ˆÁ7B¶Ç“6Ü&vñÊrÚ#"¢"≤÷FÇÁ6ñ‚ÜÊ˜rÚ#c≤2ÁBí¢3∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7B¶r“2Ê7&VFT∆ñÊV$w&FñVÁBÜ◊Ç¬'í¬◊Ç¬'í“¶Ç“bì∞¢¶rÊFD6ˆ∆˜%7F˜É¬6Ü&vñÊrÚw&v&É#SR√#C√É√„íír¢w&v&É#SR√##B√3Ç√„bírì∞¢¶rÊFD6ˆ∆˜%7F˜É¬w&v&É#r√#"√#√írì∞¢2Êfñ∆≈7Gñ∆R“¶s∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜ◊Ç“2¬'íì≤2ÁVG&Fñ47W'fUFÚÜ◊Ç“¬'í“¶Ç¬◊Ç¬'í“¶Ç“bì∞¢2ÁVG&Fñ47W'fUFÚÜ◊Ç≤¬'í“¶Ç¬◊Ç≤2¬'íì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢ÚÚ÷&ñVÁBvˆ∆FV‚÷˜FW2G&ñgFñÊrW ¢ñbÜ6ÜÊ6RÜ6Ü&vñÊrÚ„R¢„"ííFE'BÜ◊Ç≤&ÊBÇ◊2ÁrÚ"¬2ÁrÚ"í¬'í≤&ÊBÇ”B¬"í¬&ÊBÇ”Ç¬Çí¬&ÊBÇ”CR¬”Çí¬„r¬6ÜÊ6RÉ„RíÚr6ffSÜr¢r3vfCF3Çr¬"¬”3¬G'VRì∞¢“V«6Rñbá2ÁGóR””“v&VÊ6Çrí∞¢ÚÚ&V6Ü&vRˆB(	B7FÊFñÊr6Ü&vR67V∆RFÜR&ˆ&˜B7FW2îÂDÚÜ&6≤Ü∆bÜW&Rê¢6ˆÁ7B◊Ç“2ÁÇ≤2ÁrÚ#∞¢6ˆÁ7BR“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚc≤2ÁBí¢„3∞¢6ˆÁ7B6Ü&vñÊr“rÁ&V6Ü&vRbb÷FÇÊ'2ÑrÁ&V6Ü&vRÁÇ“◊Çí¬CC∞¢ÚÚDÑRÙBï2UDÑı$TB‰ır¬ÊBóBó2FÜR6ó¶RFÜRFÜñÊrFW6W'fW2FÚ&R‡¢Ú¢ÚÚFÜR6fRˆñÁBó2vÜW&R'V‚vWG2óG2'&VFÇ&6≤(	BóBó2FÜRˆÊP¢ÚÚˆ&¶V7Bñ‚FÜRv˜&∆BFÜR∆ñW"ó2ÑíFÚ6VR(	BÊBóBv2FÜó'Gê¢ÚÚóÜV«2ˆb&ˆ6VGW&¬GV&R‚óBó2&VÊFW&VB÷6ÜñÊS¢Ü˜'6W6ÜˆP¢ÚÚ7&F∆Rˆ‚ÁFí◊fñ'&Fñˆ‚fVWBvóFÇ&V6ˆ‚÷7B¬6W'fñ6ñÊr&◊2Ê@¢ÚÚ&W77W&RFÊ∑2¬7FÊFñÊrFá&VRFñ÷W2ÜW"ÜVñváB‚GvÚ∆FW2¬F˜&÷Á@¢ÚÚÊBv∂R¬6Ú7FWñÊrñÁFÚóBó27FFR6ÜÊvR&FÜW"FÜ‚FñÁB‡¢Ú¢ÚÚFÜR&ˆ6VGW&¬ˆB7Fó2T‰DU$‰TDÇ2FÜRf∆∆&6≥¢FÜR∆FRó0¢ÚÚ∆ßí÷∆ˆFVB¬ÊB6fRˆñÁBFÜBó2ñÁfó6ñ&∆Rf˜"FÜRÜ∆b6V6ˆÊ@¢ÚÚ&Vf˜&RóG2'B'&ófW2ó2FÜRˆÊRˆ&¶V7BFÜB◊W7BÊWfW"&R÷ó76&∆R‡¢∞¢6ˆÁ7B∂Wí“6Ü&vñÊrÚwˆDˆ‚r¢wˆBs∞¢ñbáGóVˆb÷VFñfWF6Ç””“vgVÊ7Fñˆ‚rí≤÷VFñfWF6ÇÇwˆBrì≤÷VFñfWF6ÇÇwˆDˆ‚rì≤–¢6ˆÁ7Bñ““‘TDîÙî‘u∂∂Wï”∞¢ñbÜñ“bbñ“ÊÊGW&≈vñGFÇí∞¢ÚÚ7FˆˆBˆ‚FÜRf∆ˆ˜"∆ñÊRÊB66∆VBˆfbFÜR&ˆˆ“w2Fñ∆Rw&ñB&FÜW ¢ÚÚFÜ‚ˆfb2ÊÜ(	BFÜR7FFñ2w2&˜Çó2FÜRîÂDU$5DîÙ‚fˆ«V÷R¬Ê@¢ÚÚFÜR÷6ÜñÊRó2FV∆ñ&W&FV«í◊V6Ç&ñvvW"FÜ‚FÜRFÜñÊrñ˜RF˜V6Ä¢6ˆÁ7BÇ“DîƒR¢B„"¬r“Ç¢Üñ“ÊÊGW&≈vñGFÇÚñ“ÊÊGW&ƒÜVñváBì∞¢6ˆÁ7Bgí“2Áí≤2ÊÉ∞¢2Á6fRÇì∞¢ÚÚ6∆˜r'&VFÇvÜñ∆RóBñF∆W2¬'&ñváFW"7FVFñW"ˆÊRvÜñ∆RóBv˜&∑0¢2Êv∆ˆ&ƒ«Ü“6Ü&vñÊrÚ¢„ìC∞¢ÚÚDÑRÙBd4U2DÑRU%4Ù‚ïB$TƒÙ‰u2tïDÇÜ˜vÊW#¢&÷∂RFÜRˆ@¢ÚÚf6ñÊrFÜRÂ2ñÁ7FVBˆbFÜR˜FÜW"6ñFR"ì¢ñbFÜR&ˆˆ“Ü2‡¢ÚÚÁ2¬FÜR7&F∆R˜VÁ2F˜v&BFÜV–¢6ˆÁ7BÁ52“rÁ7FFñ72ÊfñÊBá”‚ÁGóR””“vÁ2rì∞¢6ˆÁ7BfB“Á52bbÁ52ÁÇ≤Á52ÁrÚ"¬◊ÇÚ”¢∞¢2Á6fRÇì≤2ÁG&Á6∆FRÜ◊Ç¬ì≤2Á66∆RáfB¬ì∞¢2ÊG&tñ÷vRÜñ“¬’rÚ"¬gí“Ç¬r¬Çì∞¢2Á&W7F˜&RÇì∞¢ñbÜ6Ü&vñÊrí∞¢ÚÚóBó2FˆñÊr6ˆ÷WFÜñÊrFÚÜW"¬6ÚóBFá&˜w2∆ñváBñÁFÚFÜR&ˆˆ–¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Êv∆ˆ&ƒ«Ü“„Ç≤R¢„#∞¢6ˆÁ7BsB“2Ê7&VFU&Fñƒw&FñVÁBÜ◊Ç¬gí“Ç¢„CR¬b¬◊Ç¬gí“Ç¢„CR¬r¢„sRì∞¢sBÊFD6ˆ∆˜%7F˜É¬r6ffSf#Çrì≤sBÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#B√#√írì∞¢2Êfñ∆≈7Gñ∆R“sC∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ü◊Ç¬gí“Ç¢„CR¬r¢„sR¬¬rì≤2Êfñ∆¬Çì∞¢–¢2Á&W7F˜&RÇì∞¢ÚÚ÷˜FW2&ó6ñÊr˜WBˆbFÜR7&F∆R¬6ÚóBó2ÊWfW"7Fñ∆¬ñ7GW&P¢ñbÜ6ÜÊ6RÜ6Ü&vñÊrÚ„SR¢„íê¢FE'BÜ◊Ç≤&ÊBÇ”B¬Bí¬gí“&ÊBÉÇ¬Ç¢„Rí¬&ÊBÇ”b¬bí¬&ÊBÇ”C¬”Bí¿¢„Ç¬6Ü&vñÊrÚr6ffSf#Çr¢r3Ü6cffbr¬"¬”#b¬G'VRì∞¢6ˆÁFñÁVS∞¢–¢–¢6ˆÁ7BGV&Uí“2Áí≤b¬GV&TÇ“2ÊÇ“c∞¢ÚÚ&6R@¢2Êfñ∆≈7Gñ∆R“r3&33SC"s≤'"Ü2¬2ÁÇ“b¬2Áí≤2ÊÇ“Ç¬2Ár≤"¬í¬2ì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r36CcSRs≤'"Ü2¬2ÁÇ“¬2Áí≤2ÊÇ“B¬2Ár≤"¬Ç¬"ì≤2Êfñ∆¬Çì∞¢ÚÚ∆óBñÁFW&ñ˜"GV&Rá&ˆ&˜B7FÊG2vñÁ7BFÜó2ê¢6ˆÁ7Bñr“2Ê7&VFT∆ñÊV$w&FñVÁBÜ◊Ç¬GV&Uí¬◊Ç¬GV&Uí≤GV&TÇì∞¢ñrÊFD6ˆ∆˜%7F˜É¬w&v&ÉC√#Cb√#SR¬r≤Ü6Ü&vñÊrÚ„C"¢„b¢R≤„Rí≤rírì∞¢ñrÊFD6ˆ∆˜%7F˜É¬w&v&És√c√#¬r≤Ü6Ü&vñÊrÚ„#b¢„Rí≤rírì∞¢2Êfñ∆≈7Gñ∆R“ñs≤'"Ü2¬◊Ç“r¬GV&Uí¬3B¬GV&TÇ¬"ì≤2Êfñ∆¬Çì∞¢ÚÚ6ñFR&ñ«0¢2Êfñ∆≈7Gñ∆R“r36CF3VRs≤'"Ü2¬2ÁÇ¬2Áí≤B¬R¬2ÊÇ“"¬"ì≤2Êfñ∆¬Çì∞¢'"Ü2¬2ÁÇ≤2Ár“R¬2Áí≤B¬R¬2ÊÇ“"¬"ì≤2Êfñ∆¬Çì∞¢ÚÚF˜V÷óGFW"6≤6ˆñ¿¢2Êfñ∆≈7Gñ∆R“r3FCV3ss≤'"Ü2¬◊Ç“R¬2Áí“B¬3¬"¬Bì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“r3VfCÉBs≤2Ê∆ñÊUvñGFÇ“#∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ü◊Ç¬2Áí≤"¬í¬÷FÇÂí¬÷FÇÂí¢"ì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“6Ü&vñÊrÚr6fffffbr¢r3Üfcffbs≤2Á6ÜF˜t6ˆ∆˜"“r3Üfcffbs≤2Á6ÜF˜t&«W"“6Ü&vñÊrÚÇ¢É∞¢2Êfñ∆≈&V7BÜ◊Ç“B¬2Áí“¬Ç¬Rì≤2Á6ÜF˜t&«W"“∞¢ÚÚ6&∆R7ˆˆ«26ˆñ∆VBˆ‚FÜR&ñ«2ÜñF∆Rí(	B&V6Ç˜WBvÜV‚6Ü&vñÊrÜG&v‚∆FW"ê¢2Á7G&ˆ∂U7Gñ∆R“r3#3&3Rs≤2Ê∆ñÊUvñGFÇ“"„C∞¢2Ê&VvñÂFÇÇì≤2Ê&2á2ÁÇ≤"¬2Áí≤2ÊÇ“Ç¬B¬¬rì≤2Á7G&ˆ∂RÇì∞¢2Ê&VvñÂFÇÇì≤2Ê&2á2ÁÇ≤2Ár“"¬2Áí≤2ÊÇ“Ç¬B¬¬rì≤2Á7G&ˆ∂RÇì∞¢ñbÜ6ÜÊ6RÜ6Ü&vñÊrÚ„B¢„BííFE'BÜ◊Ç≤&ÊBÇ”R¬Rí¬2Áí≤&ÊBÉb¬3Bí¬&ÊBÇ”#¬#í¬&ÊBÇ”3R¬Rí¬„#R¬r3Üfcffbr¬"¬¬G'VRì∞¢“V«6Rñbá2ÁGóR””“v6ÜW7Brí∞¢2Êfñ∆≈7Gñ∆R“r3F6##"s≤'"Ü2¬2ÁÇ¬2Áí≤Ç¬2Ár¬2ÊÇ“Ç¬Bì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“2Ê˜VÊVBÚr3&3#Crr¢r3f#Sc3s∞¢'"Ü2¬2ÁÇ¬2Áí≤á2Ê˜VÊVBÚ"¢Bí¬2Ár¬í¬Bì≤2Êfñ∆¬Çì∞¢ñbÇ2Ê˜VÊVBí∞¢2Êfñ∆≈7Gñ∆R“r6ffCsfs≤2Á6ÜF˜t6ˆ∆˜"“r6ffCsfs≤2Á6ÜF˜t&«W"“≤&ˆ"¢#∞¢2Êfñ∆≈&V7Bá2ÁÇ≤2ÁrÚ"“2¬2Áí≤¬b¬rì≤2Á6ÜF˜t&«W"“∞¢–¢“V«6Rñbá2ÁGóR””“v÷ˆBrí∞¢2Á6fRÇì≤2ÁG&Á6∆FRá2ÁÇ≤"¬2Áí≤"≤&ˆ"ì∞¢2Á&˜FFRáW&f˜&÷Ê6RÊÊ˜rÇíÚìì∞¢2Êfñ∆≈7Gñ∆R“Êv∆˜s≤2Á6ÜF˜t6ˆ∆˜"“Êv∆˜s≤2Á6ÜF˜t&«W"“c∞¢2Êfñ∆≈&V7BÇ”í¬”í¬Ç¬Çì∞¢2Êfñ∆≈7Gñ∆R“r3C#s≤2Êfñ∆≈&V7BÇ”B¬”B¬Ç¬Çì∞¢2Á&W7F˜&RÇì≤2Á6ÜF˜t&«W"“∞¢“V«6Rñbá2ÁGóR””“vóFV“rí∞¢ÚÚ‚U%$‰Bu2Ù$§T5B‚óBGW&Á2¬óBó2∆óBg&ˆ“ñÁ6ñFR¬ÊBóBó2vˆ∆B(	@¢ÚÚFÜR6ˆ∆˜W"FÜó2v÷R«&VGí&W6W'fW2f˜"6ˆ÷WFÜñÊrñ˜RvWBFÚ∂VW‡¢6ˆÁ7BS"“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚC#≤2ÁÇí¢„S∞¢2Á6fRÇì≤2ÁG&Á6∆FRá2ÁÇ≤2¬2Áí≤2≤&ˆ"ì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7Bw“2Ê7&VFU&Fñƒw&FñVÁBÉ¬¬¬¬¬#bì∞¢wÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#R√b¬r≤É„Ç≤S"¢„bíÁFÙfóÜVBÉ"í≤rírì∞¢wÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#R√b√írì∞¢2Êfñ∆≈7Gñ∆R“w≤2Ê&VvñÂFÇÇì≤2Ê&2É¬¬#b¬¬rì≤2Êfñ∆¬Çì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“w6˜W&6R÷˜fW"s∞¢2Á&˜FFRáW&f˜&÷Ê6RÊÊ˜rÇíÚì∞¢2Êfñ∆≈7Gñ∆R“r6ffCsfs≤2Á7G&ˆ∂U7Gñ∆R“r6ffc63Çs≤2Ê∆ñÊUvñGFÇ“„C∞¢2Ê&VvñÂFÇÇì∞¢f˜"Ü∆WBí“≤í¬c≤í≤≤í∞¢6ˆÁ7B“íÚb¢÷FÇÂí¢"¬#"“íR"ÚR¢ì∞¢íÚ2Ê∆ñÊUFÚÑ÷FÇÊ6˜2Üí¢#"¬÷FÇÁ6ñ‚Üí¢#"í¢2Ê÷˜fUFÚá#"¬ì∞¢–¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢“V«6Rñbá2ÁGóR””“w&ñFF∆Rrí∞¢6ˆÁ7BR“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚS≤2ÁBí¢„3S∞¢ÚÚDÑR‘î‰B‰ÙDRï2‚Ù$Tƒï4≤‚FÜRfó&VB∆FRÜ÷ñÊFÊˆFUˆˆ&V∆ó6≤ÁÊrív0¢ÚÚ∂WñVBñ‚÷VFñÊß2ÊBG&v‚'íÊ˜FÜñÊr¬6ÚWß¶∆RFÜRv÷R6∑2FÜP¢ÚÚ∆ñW"FÚ6VV≤˜WB∆ˆˆ∂VB∆ñ∂R&∂ñÊr÷WFW"(	B#gÉ3b¬FÜR6÷R&˜Ç0¢ÚÚv∆¬FW&÷ñÊ¬‚óB7FÊG26WfW&¬Fñ÷W2ÜW"ÜVñváBÊ˜r¬vÜñ6Çó2vÜ@¢ÚÚ÷∂W2óBƒ‰D‘$≥¢6ˆ÷WFÜñÊrñ˜R6VR7&˜72&ˆˆ“ÊBv∆≤F˜v&B¿¢ÚÚ&FÜW"FÜ‚gW&ÊóGW&Rñ˜RÊ˜Fñ6RvÜV‚ñ˜R'V◊ñÁFÚóB‡¢Ú¢ÚÚFÜRñÁFW&7B&˜Çó2VÊ6ÜÊvVBˆ‚W'˜6R‚FÜR&ˆ◊B&V∆ˆÊw2BóG0¢ÚÚdÙıB¬vÜW&R6ÜR7FÊG2¬Ê˜Bf∆ˆFñÊrBFÜRF˜ˆb÷ˆÊˆ∆óFÇ‡¢6ˆÁ7B÷‚“‘TDîÙî‘rÊ÷ñÊDÊˆFS∞¢ñbÜ÷‚bb÷‚ÊÊGW&≈vñGFÇí∞¢6ˆÁ7BˆÇ“cÇ¬˜r“ˆÇ¢Ü÷‚ÊÊGW&≈vñGFÇÚ÷‚ÊÊGW&ƒÜVñváBì∞¢6ˆÁ7B˜Ç“2ÁÇ≤2ÁrÚ"“˜rÚ"¬˜í“2Áí≤2ÊÇ“ˆÉ∞¢ñbÇ2Ê˜VÊVBí∞¢ÚÚFÜR∆ñváBóBv˜&∑2'í¬Fá&˜v‚ˆ‚FÜRw&˜VÊB&Vf˜&RFÜR7FˆÊP¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7Bˆr“2Ê7&VFU&Fñƒw&FñVÁBá2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ“Ç¬B¿¢2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ“Ç¬˜r¢„ÉRì∞¢ˆrÊFD6ˆ∆˜%7F˜É¬w&v&ÉÉ√C√#SR¬r≤É„≤R¢„íÁFÙfóÜVBÉ2í≤rírì∞¢ˆrÊFD6ˆ∆˜%7F˜É¬w&v&ÉÉ√C√#SR√írì∞¢2Êfñ∆≈7Gñ∆R“ˆs∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6Rá2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ“Ç¬˜r¢„ÉR¬ˆÇ¢„3B¬¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢–¢ÚÚ6ˆ«fVB¬óB7F˜26∆∆ñÊs¢FÜRfñˆ∆WBG&ñÁ2˜WBÊBóB7FÊG2VñW@¢ñbá2Ê˜VÊVBí≤2Á6fRÇì≤ñbáGóVˆb2Êfñ«FW"””“w7G&ñÊrrí2Êfñ«FW"“vw&ó66∆RÉ„rí'&ñváFÊW72É„s"ís≤–¢2ÊG&tñ÷vRÜ÷‚¬˜Ç¬˜í¬˜r¬ˆÇì∞¢ñbá2Ê˜VÊVBí2Á&W7F˜&RÇì∞¢ñbá2Ê˜VÊVBígGáBÇ~)…2r¬2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ“#¬2¬r3vFSÜrì∞¢V«6RñbÜ6ÜÊ6RÉ„bííFE'Bá2ÁÇ≤2ÁrÚ"≤&ÊBÇ÷˜r¢„2¬˜r¢„2í¿¢2Áí≤2ÊÇ“&ÊBÉb¬ˆÇ¢„Çí¬&ÊBÇ”"¬"í¬&ÊBÇ”3B¬”bí¬„B¬r6#CÜ6fbr¬"¬¬G'VRì∞¢“V«6R∞¢2Êfñ∆≈7Gñ∆R“r3&33SC"s≤2Êfñ∆≈&V7Bá2ÁÇ≤Ç¬2Áí≤#b¬¬ì∞¢2Êfñ∆≈7Gñ∆R“r3#3&3Rs≤'"Ü2¬2ÁÇ¬2Áí¬2Ár¬#b¬bì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“2Ê˜VÊVBÚw&v&É#R√#3"√c√„Çír¢r6#CÜ6fbs∞¢ñbÇ2Ê˜VÊVBí≤2Á6ÜF˜t6ˆ∆˜"“r6#CÜ6fbs≤2Á6ÜF˜t&«W"“Ç≤R¢ì≤–¢2Ê∆ñÊUvñGFÇ“#∞¢2Ê&VvñÂFÇÇì≤2Ê&2á2ÁÇ≤2¬2Áí≤2¬Ç¬¬rì≤2Á7G&ˆ∂RÇì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚá2ÁÇ≤í¬2Áí≤2ì≤2ÁVG&Fñ47W'fUFÚá2ÁÇ≤2¬2Áí≤r¬2ÁÇ≤r¬2Áí≤2ì≤2Á7G&ˆ∂RÇì∞¢2Á6ÜF˜t&«W"“∞¢ñbá2Ê˜VÊVBígGáBÇ~)…2r¬2ÁÇ≤2¬2Áí≤B¬¬r3vFSÜrì∞¢V«6RñbÜ6ÜÊ6RÉ„RííFE'Bá2ÁÇ≤2≤&ÊBÇ”Ç¬Çí¬2Áí≤&ÊBÉ"¬#í¬&ÊBÇ”R¬Rí¬&ÊBÇ”3¬í¬„2¬r6#CÜ6fbr¬"¬¬G'VRì∞¢–¢“V«6Rñbá2ÁGóR””“wfV«Brí∞¢6ˆÁ7BÜfR“≤w6ñvñ√r¬w6ñvñ√"r¬w6ñvñ√2u“Êfñ«FW"ÜñB”‚&V∆ñ4Ü2ÜñBííÊ∆VÊwFÉ∞¢6ˆÁ7B˜V‚“rÁ6fRÊf∆w2ÁfV«D˜V„∞¢2Êfñ∆≈7Gñ∆R“r3#3&3Rs≤'"Ü2¬2ÁÇ“B¬2Áí“B¬2Ár≤Ç¬2ÊÇ≤b¬bì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“˜V‚Úr3É#r¢r33ìC#Fbs∞¢'"Ü2¬2ÁÇ¬2Áí¬2Ár¬2ÊÇ¬Rì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“r3V3ccsÇs≤2Ê∆ñÊUvñGFÇ“#∞¢'"Ü2¬2ÁÇ¬2Áí¬2Ár¬2ÊÇ¬Rì≤2Á7G&ˆ∂RÇì∞¢ñbÇ˜V‚í∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚá2ÁÇ¬2Áí≤rì≤2Ê∆ñÊUFÚá2ÁÇ≤2Ár¬2Áí≤rì∞¢2Ê÷˜fUFÚá2ÁÇ¬2Áí≤3Rì≤2Ê∆ñÊUFÚá2ÁÇ≤2Ár¬2Áí≤3Rì≤2Á7G&ˆ∂RÇì∞¢–¢f˜"Ü∆WBí“≤í¬3≤í≤≤í∞¢6ˆÁ7B∆óB“˜V‚«¬í¬ÜfS∞¢2Êfñ∆≈7Gñ∆R“∆óBÚr6ffCsfr¢r3#&"s∞¢ñbÜ∆óBí≤2Á6ÜF˜t6ˆ∆˜"“r6ffCsfs≤2Á6ÜF˜t&«W"“ì≤–¢2Ê&VvñÂFÇÇì≤2Ê&2á2ÁÇ≤2ÁrÚ"¬2Áí≤≤í¢b¬B„R¬¬rì≤2Êfñ∆¬Çì∞¢2Á6ÜF˜t&«W"“∞¢–¢“V«6Rñbá2ÁGóR””“wG&ñ¬rí∞¢6ˆÁ7BR“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚSS≤2ÁBí¢„3S∞¢2Êfñ∆≈7Gñ∆R“r3#3&3Rs≤2Êfñ∆≈&V7Bá2ÁÇ≤¬2Áí≤3¬"¬Bì∞¢2Êfñ∆≈7Gñ∆R“r3&33SC"s≤'"Ü2¬2ÁÇ¬2Áí¬2Ár¬3"¬bì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“r6#CÜ6fbs≤2Ê∆ñÊUvñGFÇ“#∞¢2Á6ÜF˜t6ˆ∆˜"“r6#CÜ6fbs≤2Á6ÜF˜t&«W"“b≤R¢∞¢'"Ü2¬2ÁÇ≤B¬2Áí≤B¬2Ár“Ç¬#B¬Bì≤2Á7G&ˆ∂RÇì∞¢2Ê&VvñÂFÇÇì≤2Ê&2á2ÁÇ≤r¬2Áí≤b¬r¬¬rì≤2Á7G&ˆ∂RÇì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚá2ÁÇ≤2¬2Áí≤bì≤2ÁVG&Fñ47W'fUFÚá2ÁÇ≤r¬2Áí≤¬2ÁÇ≤#¬2Áí≤bì≤2Á7G&ˆ∂RÇì∞¢2Á6ÜF˜t&«W"“∞¢“V«6Rñbá2ÁGóR””“wFW&“rí∞¢2Êfñ∆≈7Gñ∆R“r3#3&3Rs≤2Êfñ∆≈&V7Bá2ÁÇ≤í¬2Áí≤#¬Ç¬"ì∞¢2Êfñ∆≈7Gñ∆R“r3&33SC"s≤'"Ü2¬2ÁÇ¬2Áí¬2Ár¬#¬2ì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“Êv∆˜s≤2Êv∆ˆ&ƒ«Ü“„s∞¢f˜"Ü∆WB≤“≤≤¬3≤≤≤≤í2Êfñ∆≈&V7Bá2ÁÇ≤B¬2Áí≤B≤≤¢R¬2Ár“Ç“≤¢R¬"ì∞¢2Êv∆ˆ&ƒ«Ü“∞¢“V«6Rñbá2ÁGóR””“wñ∆∆"rí∞¢ÚÚDÑRîƒƒ"(	BW&R7'ó7F¬¬6ÜñÊñÊrBFÜRVÊBˆbFÜRF&≤6fR‚FÜP¢ÚÚWFÜ˜&VB∆FRå*s&2ì¢Fá&VRvÜóFR7V'2˜WBˆb¶vvVBW&ˆFVB&ˆ6∞¢ÚÚ6«V◊¬∆óBg&ˆ“ñÁ6ñFR‚VÁFñ¬óB'&ófW2¬FÜR&ˆ6VGW&¬∆ñváB7V'0¢ÚÚ&V∆˜rG&rFÜR6÷R∆ÊF÷&≤‚FÜR'&VFÜñÊrÜ∆Ú&ñFW2&˜FÇfW'6ñˆÁ3†¢ÚÚFÜR∆FRó27Fñ∆¬¬ÊBFÜRV«6Ró2vÜB÷∂W2óB∆ófR‡¢6ˆÁ7BR“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚs≤2ÁBí¢„S∞¢ñbÇó4ÜW&ÚÇíbbrÁ6fRÁ7F˜'ïfW'6ñˆ‚””“"í∞¢ÚÚ&˜VÊFVB&r÷FW&ñ¬¬6Ü&VBvóFÇFÜR6ˆ÷ñ2w2V''í&VfW&VÊ6R‡¢ÚÚ∆ˆFñÊr◊W7BÊWfW"f∆6ÇFÜR∆Vv7íˆñÁFVB7'ó7F¬ñÁFÚFÜó266VÊR‡¢ñbÇG&u∆FTÊ6Ü˜&VBÜ2¬w&t÷&&∆Rr¬2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ¬2ÊÇ¢„Ç¬f«6Ríí∞¢2Á6fRÇì≤2Êfñ∆≈7Gñ∆R“r6#ñ3Ü6"s∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6Rá2ÁÇ≤2ÁrÛ"¬2Áí≤2ÊÇ¢„Sr¬2Ár¢„cb¬2ÊÇ¢„C2¬¬¬÷FÇÂí£"ì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢–¢6ˆÁFñÁVS∞¢–¢ñbáGóVˆbG&u∆FTÊ6Ü˜&VB””“vgVÊ7Fñˆ‚rb`¢G&u∆FTÊ6Ü˜&VBÜ2¬wñ∆∆%∆FRr¬2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ¬2ÊÇ¢„Ç¬f«6Ríí∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7BÜr“2Ê7&VFU&Fñƒw&FñVÁBá2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ¢„CR¬b¿¢2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ¢„CR¬2ÊÇ¢„íì∞¢ÜrÊFD6ˆ∆˜%7F˜É¬w&v&É##√#C√#SR¬r≤É„b≤R¢„"í≤rírì∞¢ÜrÊFD6ˆ∆˜%7F˜É¬w&v&É##√#C√#SR√írì∞¢2Êfñ∆≈7Gñ∆R“Üs∞¢2Êfñ∆≈&V7Bá2ÁÇ“2ÊÇ¬2Áí“2ÊÇ¢„B¬2Ár≤2ÊÇ¢"¬2ÊÇ¢„bì∞¢2Á&W7F˜&RÇì∞¢ñbÜ6ÜÊ6RÉ„"ííFE'Bá2ÁÇ≤&ÊBÉ¬2Árí¬2Áí≤&ÊBÉ¬2ÊÇ¢„rí¿¢&ÊBÇ”Ç¬Çí¬&ÊBÇ”#b¬”bí¬„b¬r6Ffc&fbr¬„r¬”3¬G'VRì∞¢6ˆÁFñÁVS∞¢–¢2Êfñ∆≈7Gñ∆R“r3##&2s∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚá2ÁÇ“b¬2Áí≤2ÊÇì≤2Ê∆ñÊUFÚá2ÁÇ≤B¬2Áí≤2ÊÇ“Bì∞¢2Ê∆ñÊUFÚá2ÁÇ≤2Ár“B¬2Áí≤2ÊÇ“Bì≤2Ê∆ñÊUFÚá2ÁÇ≤2Ár≤b¬2Áí≤2ÊÇì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7B7V'2“µ≥„R¬„¬“¬≥„#B¬„c"¬„E“¬≥„sÇ¬„r¬„ï’”∞¢f˜"Ü6ˆÁ7B∂gÉ"¬fÇ¬Ö“ˆb7V'2í∞¢6ˆÁ7B'Ç“2ÁÇ≤2Ár¢gÉ"¬Fóí“2Áí≤2ÊÇ¢É“fÇì∞¢6ˆÁ7Bs2“2Ê7&VFT∆ñÊV$w&FñVÁBÜ'Ç¬2Áí≤2ÊÇ¬'Ç¬Fóíì∞¢s2ÊFD6ˆ∆˜%7F˜É¬w&v&ÉS√#√#SR√„"írì∞¢s2ÊFD6ˆ∆˜%7F˜É„cR¬w&v&É##√#C√#SR¬r≤É„R≤R¢„#Rí≤rírì∞¢s2ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#SR√#SR¬r≤É„ÉR≤R¢„Rí≤rírì∞¢2Êfñ∆≈7Gñ∆R“s3∞¢2Á6ÜF˜t6ˆ∆˜"“r66fSÜfbs≤2Á6ÜF˜t&«W"“B≤R¢≤÷FÇÁ6ñ‚áÇ¢rí¢#∞¢6ˆÁ7Bár“r¢fÇ≤3∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜ'Ç“ár¬2Áí≤2ÊÇ“"ì∞¢2Ê∆ñÊUFÚÜ'Ç“ár¢„3R¬Fóí≤bì≤2Ê∆ñÊUFÚÜ'Ç¬Fóíì∞¢2Ê∆ñÊUFÚÜ'Ç≤ár¢„3R¬Fóí≤bì≤2Ê∆ñÊUFÚÜ'Ç≤ár¬2Áí≤2ÊÇ“"ì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢–¢2Á6ÜF˜t&«W"“∞¢2Á&W7F˜&RÇì∞¢ñbÜ6ÜÊ6RÉ„"ííFE'Bá2ÁÇ≤&ÊBÉ¬2Árí¬2Áí≤&ÊBÉ¬2ÊÇ¢„rí¿¢&ÊBÇ”Ç¬Çí¬&ÊBÇ”#b¬”bí¬„b¬r6Ffc&fbr¬„r¬”3¬G'VRì∞¢“V«6Rñbá2ÁGóR””“w6V7&WBrí∞¢6ˆÁ7BB“∆ñW"Ú÷FÇÊáó˜Bá∆ñW"ÁÇ“2ÁÇ¬∆ñW"Áí“2Áíí¢ììì∞¢ñbÜ6ÜÊ6RÉ„ÇííFE'Bá2ÁÇ≤&ÊBÉ¬#Bí¬2Áí≤&ÊBÉ¬#Bí¬&ÊBÇ”¬í¬&ÊBÇ”3¬”Rí¬„R¬r6ffCsfr¬„Ç¬”#¬G'VRì∞¢ñbÜB¬sí∞¢2Êv∆ˆ&ƒ«Ü“6∆◊É“BÚs¬¬„rì∞¢2Á6ÜF˜t6ˆ∆˜"“r6ffCsfs≤2Á6ÜF˜t&«W"“#∞¢2Êfñ∆≈7Gñ∆R“r6ffCsfs∞¢2Ê&VvñÂFÇÇì≤2Ê&2á2ÁÇ≤"¬2Áí≤"¬2≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ3≤2ÁBí¢„R¬¬rì≤2Êfñ∆¬Çì∞¢2Á6ÜF˜t&«W"“≤2Êv∆ˆ&ƒ«Ü“∞¢–¢“V«6Rñbá2ÁGóR””“vÁ2rí∞¢ñbáGóVˆbG&t÷ˆÊıv˜&∆D66VÁB””“vgVÊ7Fñˆ‚ríG&t÷ˆÊıv˜&∆D66VÁBÜ2¬2ì∞¢6ˆÁ7BF∆∂ñÊr“rÁ7FFR””“tDîƒÙrrbbrÊFñ∆ˆrbbrÊFñ∆ˆrÊÁ2””“2ÊWáG&∞¢ÚÚD$≤T‰ïBDÙU2‰ıB%$TDÑR‚ÊÚ&ˆ"¬ÊÚ÷&ñVÁB7&∑2¬ÊÚGW&‚F¢ÚÚf6RÜW"(	BóBó2&ˆGí7FÊFñÊrvÜW&RóBv27FÊFñÊrvÜV‚FÜR˜vW ¢ÚÚvVÁB‚FÜR&VBÜ2FÚ&RñÁ7FÁBg&ˆ“7&˜72&ˆˆ“¬˜"FÜR∆ñW ¢ÚÚv∆∑27B6óÇˆbFÜV“vˆÊFW&ñÊrváíÊˆ&ˆGíF∆∑2‡¢6ˆÁ7B∆ófR“Á4∆ófRá2ì∞¢6ˆÁ7B&ˆ#"“∆ófRÚáF∆∂ñÊrÚ&ˆ"¢„í¢&ˆ"í¢∞¢ÚÚDÑR$U5Dî‰rƒDRå*s&rì¢ñ‚Üó2FV‚¬F&≤&F6ÜWBó2Ê˜BFÜR7FÊFñÊp¢ÚÚGW&Ê&˜VÊBw&ñVB˜WB(	BÜRó2Üó2WFÜ˜&VB˜vW&VB÷F˜v‚&ˆGí¬6«V◊VB¿¢ÚÚWñR÷∆ñváG2˜WB¬FÜR6ÜW7B7'ó7F¬FÜRˆÊ«í∆ñváBñ‚FÜRñ7GW&R‚FÜP¢ÚÚ∆FRï2FÜRF&≤&VB¬6ÚóB◊W7BÊ˜BvÚFá&˜VvÇFÜRw&ó66∆R&V∆˜s†¢ÚÚFÜBfñ«FW"v˜V∆B∂ñ∆¬FÜRˆÊRv∆˜rFÜRñ÷vRó2&˜WB‡¢∆WB∆FTG&Wr“f«6S∞¢ñbÇ∆ófRbbÁ4∂Wíá2í””“t'«&F6ÜWBrí∞¢ñbáGóVˆb÷VFñfWF6Ç””“vgVÊ7Fñˆ‚rí÷VFñfWF6ÇÇw&F6ÜWE&W7FñÊrrì∞¢6ˆÁ7B$ñ““GóVˆb‘TDîÙî‘r”“wVÊFVfñÊVBrbb‘TDîÙî‘rÁ&F6ÜWE&W7FñÊs∞¢ñbá$ñ“bb$ñ“ÊÊGW&≈vñGFÇí∞¢ÚÚ"„l9s¢FÜR˜vÊW"w2'V∆ñÊrñ‚FÜRFV‚(	BwFÜRÁ2ó2FˆÚ6÷∆¬¬ó@¢ÚÚ6Ü˜V∆B&RF˜V&∆R◊í6ó¶Rr(	BÊB6ÜR&VG2„'ÇFÜRÁ2ÜóF&˜Ç¬6¢ÚÚFÜR&W7FñÊr&ˆGíÊVVG2„"„bÜóF&˜Ç÷ÜVñváG2FÚ7FÊBF˜V&∆RÜW ¢6ˆÁ7BFÇ“2ÊÇ¢"„b¬Gr“FÇ¢á$ñ“ÊÊGW&≈vñGFÇÚ$ñ“ÊÊGW&ƒÜVñváBì∞¢2ÊG&tñ÷vRá$ñ“¬2ÁÇ≤2ÁrÚ"“GrÚ"¬2Áí≤2ÊÇ“FÇ¬Gr¬FÇì∞¢∆FTG&Wr“G'VS∞¢–¢–¢6ˆÁ7BFñ÷÷VB“∆ófRbb∆FTG&Ws∞¢ñbÜFñ÷÷VBí∞¢2Á6fRÇì∞¢ÚÚDTB‘4Ñî‰Rï2D$≤¬‰ıBE$Â5$TÂB(	BÊBóBó27Fñ∆¬‘4Ñî‰P¢ÚÚîıR4‚4TR‚FÜRfó'7BfW'6ñˆ‚ˆbFÜó2G&˜VBv∆ˆ&ƒ«ÜFÚ&˜WB¢ÚÚFÜó&BÊB∆WBFÜR&ˆˆ“6Ü˜rFá&˜VvÇFÜR&ˆGì¢vÜ˜7B‚óBv0¢ÚÚ&W∆6VB'íw&ó66∆RÉí'&ñváFÊW72É„Rí¬vÜñ6ÇfóÜVBFÜP¢ÚÚG&Á7&VÊ7íÊBFÜV‚&ˆGV6VBFÜR6÷R6ˆ◊∆ñÁBvñ‚(	B'váíFˆ‚w@¢ÚÚí6VRÁífVGW&RˆbFÜRÂ2¬óBw2∆ñ∂RvÜ˜7B"(	B&V6W6RóBó2¢ÚÚ≈T‘î‰‰4RvÜ˜7BñÁ7FVBˆb‚«ÜˆÊR‡¢Ú¢ÚÚ÷V7W&VB¬ˆ‚FÜR6ÜVWBFÜW6RÂ727GV∆«íG&rg&ˆ”¢FÜR'BVÁFW'0¢ÚÚFÜó2fñ«FW"B÷ñBRÚvÜóFRÉÚ6GW&Fñˆ‚„3ÊB∆VfW2@¢ÚÚ÷ñBSrÚvÜóFRìÚ6GW&Fñˆ‚„¬vñÁ7BFV‚&6∂G&˜vÜ˜6R˜v‡¢ÚÚ«V÷ñÊÊ6Ró2&˜WBr‚Ü«fñÊrFÜR'&ñváFÊW72ˆb'BvÜ˜6RvÜóFP¢ÚÚˆñÁBó2«&VGíÉ∆VfW2ÊÚÜñvÜ∆ñváBf˜"f˜&“FÚ&VB'í¬Ê@¢ÚÚw&ó66∆RÉí&V÷˜fW2FÜRˆÊ«íFÜñÊr6W&FñÊrv&“'&ˆÁ¶Rg&ˆ“¢ÚÚ6ˆ∆Bv∆¬‚f˜'Gí∆WfV«2ˆbf∆Bw&Wí˜fW"FÜR&ˆˆ“ó26◊VFvR‡¢Ú¢ÚÚ6Û¢7Fñ∆¬F&≤¬7Fñ∆¬FW6GW&FVB(	B˜vW&VBF˜v‚Ü2FÚƒÙÙ≤˜vW&V@¢ÚÚF˜v‚(	B'WBFÜR6ˆÁG&7Bó2W6ÜVB&6≤W6ÚFÜR∆FW2¬óW2¬∆◊ ¢ÚÚÊBÜV∆÷WB7W'fófR‚FÜó2∆ÊG2B÷ñBìÚvÜóFRsÇÚ6GW&Fñˆ‡¢ÚÚ„(	BÊBFÜV‚FÜRvÜˆ∆RÂ2w&FRv2∆ñgFVBVÊFW"óBÜF∆2Êß2¿¢ÚÚ„cÇ”‚„CRí&V6W6RFÜR˜vÊW"w2ÊWáBv˜&Bˆ‚ÜˆÊRv2&∆¬6¢ÚÚF&≤"¬vÜñ6Çv2G'VRˆbFÜR4Ñ$tTBVÊóB2vV∆¬‚óBÊ˜r∆ÊG2@¢ÚÚ÷ñBÇvñÁ7B6Ü&vVBS¢FÜó&B'&ñváFW"FÜ‚óBv2¬7Fñ∆¬¢ÚÚ6∆V"FÜó'Gí∆WfV«2&V∆˜rv∂R¬ÊB7Fñ∆¬G&ñÊVBˆb6ˆ∆˜W"‚FÜP¢ÚÚ&VBó2FV∆ñ&W&FV«í6∆˜6RFÚFÜBˆb&F6ÜWE˜&W7FñÊrÁÊr¿¢ÚÚFÜRWFÜ˜&VB˜vW&VB÷F˜v‚∆FRñ‚FÜRFV„¢FÜB'Bó2FÜRv÷Rw0¢ÚÚ˜v‚Á7vW"FÚ'vÜBFˆW2F&≤÷6ÜñÊR∆ˆˆ≤∆ñ∂R"¬ÊBóB∂VW2FVW ¢ÚÚ&∆6∑2‰B&V¬ÜñvÜ∆ñváG2&FÜW"FÜ‚7'W6ÜñÊrWfW'óFÜñÊrFÚ÷ñFF∆P¢ÚÚw&Wí‚FÜR∆óBWñW2ÊBFÜRv&“6ÜW7B∆◊&RG&v‚6W&FV«í&V∆˜p¢ÚÚÊB&V÷ñ‚FÜR6ñvÊ¬FÜB6ó26Ü&vVC≤6ˆ∆˜W"ÊB∆ñváB∆WfV¬6ê¢ÚÚFÜR&W7B‡¢2Êfñ«FW"“Â5ÙD$µÙdî≈DU#∞¢ñbáGóVˆb2Êfñ«FW"”“w7G&ñÊrrí2Êv∆ˆ&ƒ«Ü“„ÉÉ≤ÚÚˆ∆B6f&ì¢Fñ“¬ÊWfW"vÜ˜7@¢–¢ÚÚDÑREU$‚‚&V∆˜r¬‚Â2f6W2FÜR6B'í&VñÊr‘ï%$ı$TB(	BvÜñ6Çf∆ó0¢ÚÚóG2∆óB6ñFRˆÁFÚóG26ÜF˜r6ñFRÊB&R÷f∆GFVÁ2óBñÁFÚñ7GW&RFÜP¢ÚÚñÁ7FÁBóBGW&Á2‚FÜR÷6ÜñÊRfˆ∆≤&R&VÊFW&VBÊ˜r¬6ÚFÜWíGW&‚FÜP¢ÚÚvíWfW'óFÜñÊrV«6Rñ‚FÜó2v÷RGW&Á3¢'í6V∆V7FñÊr‚WFÜ˜&VBÊv∆P¢ÚÚˆfbGW&ÁF&∆R∆óBg&ˆ“fóÜVBˆñÁBñ‚FÜRv˜&∆B‚G&v‚˜WBÜW&Rñ‡¢ÚÚv˜&∆B76R¬&Vf˜&RFÜR÷ó'&˜&ñÊrG&Á6f˜&“FÜBóBWÜó7G2FÚ&W∆6R‡¢ÚÚDÑRUîR’U5Bdî‰BÑî“dï%5BÜ˜vÊW#¢$Â2ó2fFVB(	BÊ˜Bfó6ñ&∆R@¢ÚÚ∆¬"í‚∆ófR÷6ÜñÊR◊W'6ˆ‚ó2'W7Gí'&ˆÁ¶R7FÊFñÊrvñÁ7@¢ÚÚgW&ÊóGW&RFÜR6÷R6ˆ∆˜W"ñ‚FÜRF&∂W7B&ˆˆ◊2ñ‚FÜRv÷R¬6Ú&Vf˜&P¢ÚÚFÜR&ˆGíG&w2¬v&“v˜&≤÷∆ñváBÜ∆ÚvˆW2ˆ‚$TÑî‰BóC¢FÜR6VÁG&P¢ÚÚó26˜fW&VB'íFÜR7&óFR¬ÊBvÜB7W'fófW2ó2∆óB&ñ“FÜB7WG0¢ÚÚFÜR6ñ∆Ü˜VWGFRg&VRˆbFÜR&6∂G&˜‡¢ñbÜ∆ófRí∞¢6ˆÁ7B≤“GóVˆbF∆4ˆb””“vgVÊ7Fñˆ‚rbbF∆4ˆbá2ÊWáG&ì∞¢6ˆÁ7B∂≤“Ñ≤bb≤Á7V%∑2ÊWáG&“bb≤Á7V%∑2ÊWáG&“Ê≤í«¬„C∞¢6ˆÁ7B&Ç“2ÊÇ¢∂≥∞¢6ˆÁ7BáÇ“2ÁÇ≤2ÁrÚ"¬Ü7í“2Áí≤2ÊÇ“&Ç¢„S∞¢ÚÚd≈TR4U$DîÙ‚dï%5B¬DÑT‚DÑR$î“‚v&“Ü∆Ú∆ˆÊR6ÊÊ˜Bg&VP¢ÚÚ6ñ∆Ü˜VWGFRFÜB÷F6ÜW2óG2&6∂G&˜ñ‚d≈TR¬ÊBFÜRFñÊ∂W"ó0¢ÚÚ'&ˆÁ¶R7FÊFñÊrvñÁ7B'&ˆÁ¶Rv∆¬BFÜR6÷R'&ñváFÊW72‚6ˆg@¢ÚÚF&≤Fó62∂Êˆ6∑2FÜRv∆¬&VÜñÊBÜñ“F˜v‚7FW≤FÜRv&“Ü∆ÚFÜV‡¢ÚÚ∆ñváG2Üó2VFvRvñÁ7BFÜBF&≤ñÁ7FVBˆbvñÁ7BÜó2˜v‚6ˆ∆˜W"‡¢ÚÚ7VñÁBBFÜRFV‚Ê˜rÊBÜR7W'fófW2óB‡¢6ˆÁ7BFr“2Ê7&VFU&Fñƒw&FñVÁBÜáÇ¬Ü7í¬B¬áÇ¬Ü7í¬&Ç¢„ìRì∞¢FrÊFD6ˆ∆˜%7F˜É¬w&v&ÉB√b√√„Círì∞¢FrÊFD6ˆ∆˜%7F˜É„r¬w&v&ÉB√b√√„#"írì∞¢FrÊFD6ˆ∆˜%7F˜É¬w&v&ÉB√b√√írì∞¢2Êfñ∆≈7Gñ∆R“Fs∞¢2Ê&VvñÂFÇÇì≤2Ê&2ÜáÇ¬Ü7í¬&Ç¢„ìR¬¬rì≤2Êfñ∆¬Çì∞¢6ˆÁ7BÜr“2Ê7&VFU&Fñƒw&FñVÁBÜáÇ¬Ü7í¬B¬áÇ¬Ü7í¬&Ç¢„Çì∞¢ÜrÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#b√S√„3Bírì∞¢ÜrÊFD6ˆ∆˜%7F˜É„b¬w&v&É#SR√#√#√„Bírì∞¢ÜrÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#√#√írì∞¢2Êfñ∆≈7Gñ∆R“Üs∞¢2Ê&VvñÂFÇÇì≤2Ê&2ÜáÇ¬Ü7í¬&Ç¢„Ç¬¬rì≤2Êfñ∆¬Çì∞¢–¢ÚÚu$ıT‰DTB¬‰ıB5Dî4¥U$TB‚FÜR6B¬WfW'ív∆∂ñÊrVÊV◊íÊBWfW'í&˜70¢ÚÚ«&VGí67B6ˆÁF7B6ÜF˜s≤FÜR7FÊFñÊrÂ72vW&RFÜRˆÊR6∆70¢ÚÚFÜBFñBÊ˜B¬vÜñ6Çó2váíFÜWí&VB27WB÷˜WG27FVBñ‚g&ˆÁBˆb¢ÚÚñÁFVBf∆ˆ˜"&FÜW"FÜ‚V˜∆R7FÊFñÊrˆ‚óB‚6÷RÜV«W"¬6ÚFÜWê¢ÚÚ&R∆óB'íFÜR6÷R'V∆R‚FÜR˜&6∆RÜÊw2g&ˆ“óG26&∆W2ÊBÜ2Ê¢ÚÚfVWBFÚ7FÊBˆ‚¬6ÚóBvWG2ÊˆÊR(	BFÜR6÷RWÜ6WFñˆ‚w&˜VÊFVF ¢ÚÚ«&VGí÷∂W2f˜"óBGvÚ∆ñÊW2F˜v‚‡¢ñbá2ÊWáG&”“v÷ˆÊÚrbbGóVˆb6ˆÁF7E6ÜF˜r””“vgVÊ7Fñˆ‚p¢bbáGóVˆbr”“wVÊFVfñÊVBrbbrÊ'E&ˆ&Ríí∞¢6ˆÁF7E6ÜF˜rÜ2¬2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ¬2Ár¢„s"¬„3Bì∞¢–¢ÚÚFÜRvˆ∂V‚FñÊ∂W"ó2Btı$≤Ü˜vÊW#¢'7F'Bv˜&∂ñÊrˆ‚FÜRF&∆R"í(	@¢ÚÚñ‚Üó2FV‚ÜRf6W2Üó2&VÊ6Çˆ‚FÜR&ñváB¬ÊBˆÊ«íGW&Á2g&ˆ“ó@¢ÚÚvÜV‚6ÜR7GV∆«íF∆∑2FÚÜñ“‚WfW'í˜FÜW"Â2f6W2FÜR6B‡¢6ˆÁ7BD&VÊ6Ç“∆ófRbbÁ4∂Wíá2í””“t'«&F6ÜWBrbbF∆∂ñÊs∞¢6ˆÁ7BfFó"“D&VÊ6ÇÚ¢Çá∆ñW"bb∆ñW"ÁÇ≤"¬2ÁÇíÚ”¢ì∞¢ÚÚDÑRDî‰¥U"ï2ƒDR4UB¬‰ıB$ır‚G&uFñÊ∂W"˜vÁ2Üó2˜6W2¬Üó0¢ÚÚFñ2ÊBÜó2fVÁBá6VRFÜR&∆ˆ6≤&˜fRÁ4∂Wíì≤óB&WGW&Á2f«6RVÁFñ¿¢ÚÚFÜR∆FW2∆ÊBÊBFÜRF∆26˜fW'2FÜ˜6Rg&÷W22óB«vó2FñB‡¢ÚÚóB&W∆6W2FÜRF∆2UdU%ïtÑU$RÜRó2v∂R¬Ê˜BˆÊ«íñ‚Üó2FV„†¢ÚÚÜó2&˜rˆ‚Á5Ûgñró2FÜRˆÊRFÜR∂WñW"VÊ6ÜVBCR„bRˆbFÜR&ˆGê¢ÚÚ˜WBˆb¬6ÚFÜR&ˆ˜FÇv26Ü˜vñÊrFÜR&ˆˆ“Fá&˜VvÇÜó26ÜW7B‡¢ÚÚDÑR§Ù"¬f˜"WfW'ñˆÊRFÜRFñÊ∂W"w2&VÊFW&W"FˆW2Ê˜B˜v‚(	B6VRÂ5Ù§Ù"‡¢ÚÚóB'VÁ2ˆÊ«ívÜñ∆R6ÜRó2Ê˜B7FÊFñÊr˜fW"FÜV“ÊBÊ˜BF∆∂ñÊr¬Ê@¢ÚÚóBG&ófW2FÜRGW&ÁF&∆R‰tƒR¬vÜñ6Çó2FÜRˆÊRñV6Rˆbfˆ6'V∆'ê¢ÚÚFÜW6R&ˆFñW2ÜfRFÜBÊ˜FÜñÊrv2W6ñÊr‡¢6ˆÁ7BÁ4'W7í“∆ófRbbF∆∂ñÊrbbÊV$Á2á2ì∞¢6ˆÁ7B¶ˆ$6ˆ¬“Á4'W7íÚÁ4¶ˆ$6ˆ¬á2¬Á4GBá2íí¢á2Âˆ¶ˆ"“ÁV∆¬¬ÁV∆¬ì∞¢ÚÚtı$≤$TBï2DÑR5E$ï‚GvV«fRg&÷W2ˆbFÜó2÷6ÜñÊRFˆñÊróG2˜v‡¢ÚÚ¶ˆ"&VBÁíÊv∆RˆbóB7FÊFñÊr7Fñ∆¬¬6ÚvÜV‚FÜR&VB6ó2v˜&≤Ê@¢ÚÚFÜR7G&óÜ2∆ÊFVB¬FÜBó2vÜBG&w3≤FÜRGW&ÁF&∆R6˜fW'2WfW'ê¢ÚÚ˜FÜW"&VBÊBWfW'íg&÷R&Vf˜&RFÜR'B'&ófW2‡¢∆WB7G&óG&Wr“f«6S∞¢ñbÜÁ4'W7íbb2Âˆ¶ˆ"bb2Âˆ¶ˆ"Áv˜&≤bbáGóVˆbó4ÜW&Ú””“vgVÊ7Fñˆ‚rbbó4ÜW&ÚÇííí∞¢6ˆÁ7B“GóVˆbF∆4ˆb””“vgVÊ7Fñˆ‚rbbF∆4ˆbá2ÊWáG&ì∞¢6ˆÁ7B∂≤“ÑbbÁ7V%∑2ÊWáG&“bbÁ7V%∑2ÊWáG&“Ê≤í«¬„C∞¢6ˆÁ7BÊ2“Á4∆ˆ˜6V∆«2á2ÊWáG&ì∞¢7G&óG&Wr“G&u7G&ó6V∆¬Ü2¬Â5ÙƒÙı∑2ÊWáG&“¿¢÷FÇÊf∆ˆ˜"á2Âˆ¶ˆ"ÁÇ«¬í¬Ê2¿¢2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ≤&ˆ#"¢„B¬2ÊÇ¢∂≤¿¢fFó"¬ì∞¢ñbá7G&óG&WrírÊÁ4g&÷R“2ÊWáG&≤s¢r≤ÇÇÑ÷FÇÊf∆ˆ˜"á2Âˆ¶ˆ"ÁÇ«¬íRÊ2í≤Ê2íRÊ2ì∞¢–¢6ˆÁ7B6ÜVWDG&Wr“∆FTG&Wr«¬7G&óG&Wr«¿¢Ü∆ófRbb2ÊWáG&””“w&F6ÜWBrbbG&uFñÊ∂W"Ü2¬2¬F∆∂ñÊríí«¿¢ÇáGóVˆbó4ÜW&Ú””“vgVÊ7Fñˆ‚rbbó4ÜW&ÚÇííb`¢G&tF∆2Ü2¬2ÊWáG&¬fFó"¿¢2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ≤&ˆ#"¢„B¬2ÊÇ¬∞¢C¢W&f˜&÷Ê6RÊÊ˜rÇíÚ≤á2ÁB«¬í¢„r¿¢ÚÚFÜR˜&6∆RÜÊw2g&ˆ“óG26&∆W2ÊBÜ2ÊÚfVWBFÚ7FÊBˆ‡¢÷ˆFS¢2ÊWáG&””“v÷ˆÊÚrÚw7vír¢v'&VFÜRr¿¢w&˜VÊFVC¢2ÊWáG&”“v÷ˆÊÚr¿¢6ˆ√¢¶ˆ$6ˆ¬¿¢“íì∞¢2Á6fRÇì≤2ÁG&Á6∆FRá2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ≤&ˆ#"¢„Bì∞¢ñbÜfFó"¬í2Á66∆RÇ”¬ì≤ÚÚf6RFÜR6BÜ˜"FÜR&VÊ6Ç(	B6VRfFó"ê¢ñbáF∆∂ñÊrí∞¢6ˆÁ7BG“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚCí¢„S∞¢2Á6fRÇì≤2Á66∆Rá∆ñW"bb∆ñW"ÁÇ≤"¬2ÁÇÚ”¢¬ì∞¢gGáBÇ~(
br¬¬◊2ÊÇ“B¬R¬w&v&É#3√#CR√#SR¬r≤É„B≤G¢„Rí≤rírì∞¢2Á&W7F˜&RÇì∞¢–¢6ˆÁ7BñB“2ÊWáG&∞¢ÚÚ÷&ñVÁB6Ü&7FW"÷˜Fñˆ‡¢ñbÜñB””“w6W'fÚrbb6ÜÊ6RÉ„RííFE'Bá2ÁÇ≤2ÁrÚ"≤b¬2Áí≤"¬&ÊBÇ”R¬Rí¬&ÊBÇ”C¬”#í¬„r¬w&v&É#√#√#√„Rír¬2¬”3ì∞¢ñbÜñB””“w&F6ÜWBrbb6ÜÊ6RÉ„"ííFE'Bá2ÁÇ≤2ÁrÚ"“B¬2Áí≤B¬&ÊBÇ”¬í¬&ÊBÇ”c¬”3í¬„R¬r6ffCsfr¬"¬3¬G'VRì∞¢ñbÜñB””“v÷ˆÊÚrbb6ÜÊ6RÉ„RííFE'Bá2ÁÇ≤2ÁrÚ"≤&ÊBÇ”Ç¬Çí¬2Áí≤2ÊÇ“B¬¬&ÊBÇ”CR¬”#Rí¬„b¬r3SvÜfbr¬„b¬¬G'VRì∞¢ñbÜñB””“w6vRrbb6ÜÊ6RÉ„2ííFE'Bá2ÁÇ≤2ÁrÚ"≤&ÊBÇ”b¬bí¬2Áí≤&ÊBÉ¬#í¬&ÊBÇ”Ç¬Çí¬&ÊBÇ”B¬”Bí¬„í¬r3ñfSÜfbr¬„b¬¬G'VRì∞¢ñbÜñB””“wF6Çrbb6ÜÊ6RÉ„RííFE'Bá2ÁÇ≤2ÁrÚ"≤&ÊBÇ”b¬í¬2Áí≤2ÊÇ“Ç¬&ÊBÇ”C¬Cí¬&ÊBÇ”s¬”#í¬„2¬r6ffCÜr¬"¬S¬G'VRì∞¢ñbÜñB””“v«V÷V‚rbb6ÜÊ6RÉ„bííFE'Bá2ÁÇ≤2ÁrÚ"¬2Áí≤"¬&ÊBÇ”B¬Bí¬&ÊBÇ”#¬”bí¬„r¬r3vFfcñr¬„Ç¬”Ç¬G'VRì∞¢ÚÚFÜR7WGFW"w2w&óBdƒ≈3¢WfW'óFÜñÊrV«6Rñ‚FÜR67B6ÜVG2Wv&@¢ÚÚÜÜVB¬∆ñváB¬7FFñ2íÊBÜW'2ó27FˆÊRGW7B6ˆ÷ñÊrˆfb7W@¢ñbÜñB””“v∂W&brbb6ÜÊ6RÉ„bííFE'Bá2ÁÇ≤2ÁrÚ"“"¬2Áí≤2¬&ÊBÇ”B¬bí¬&ÊBÇ”#b¬”Bí¬„SR¬r6Vcffbr¬„R¬¬G'VRì∞¢ñbáGóVˆbó4ÜW&Ú””“vgVÊ7Fñˆ‚rbbó4ÜW&ÚÇíbbG&tÜW&ÙÂ2Ü2¬ñB¬2íí∞¢ÚÚFÜRˆGó76WíÜ2óG2˜v‚V˜∆R(	B&ˆ&VB¬áV÷‚¬w&VV≤‚FÜR÷6ÜñÊP¢ÚÚfˆ∆≤&V∆˜r&V∆ˆÊrFÚFÜRFWFá2ÊB7FíFÜW&R‡¢“V«6RñbÇ6ÜVWDG&Wrí∞¢ÚÚFÜRÜÊB÷G&v‚˜&ñvñÊ«2¬7Fñ∆¬ÜW&RÊB7Fñ∆¬6˜'&V7C¢FÜWí&RvÜ@¢ÚÚFÜRv÷R6Ü˜w2vÜñ∆RFÜR6ÜVWBó2∆ˆFñÊr¬ÊBˆ‚ÁóFÜñÊrFÜ@¢ÚÚ6ÊÊ˜BFV6ˆFRóBB∆¿¢G&tÂ4&ˆGíÜ2¬ñB¬W&f˜&÷Ê6RÊÊ˜rÇíÚ≤á2ÁB«¬í¢„r¬F∆∂ñÊrì∞¢–¢2Á&W7F˜&RÇì∞¢ñbÇ∆ófRí∞¢ñbÜFñ÷÷VBí∞¢2Á&W7F˜&RÇì≤ÚÚ6∆˜6RFÜRw&ó66∆R6fP¢2Êfñ«FW"“vÊˆÊRs∞¢ÚÚDÑREîî‰r5DEU2ƒ’‚óBW6VBFÚ$RFÜR&ˆGíw2«ÜV«6ñÊr(	@¢ÚÚvÜñ6Çó2vÜB÷FRFÜRvÜˆ∆R÷6ÜñÊR&VB2vÜ˜7B‚Ê˜rFÜR&ˆGê¢ÚÚ7Fó26ˆ∆ñBÊBFÜR∆◊ó26÷∆¬÷&W"V÷&W"BFÜR6ÜW7B¿¢ÚÚ'&VFÜñÊr6∆˜v«í¬G&v‚FFóFófV«í˜fW"FÜRF&≤‡¢6ˆÁ7B∆◊≤“„R≤„R¢÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚì≤á2ÁB«¬íì∞¢6ˆÁ7B∆◊Ç“2ÁÇ≤2ÁrÚ"¬∆◊í“2Áí≤2ÊÇ¢„C#∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7B∆◊r“2Ê7&VFU&Fñƒw&FñVÁBÜ∆◊Ç¬∆◊í¬¬∆◊Ç¬∆◊í¬ì∞¢∆◊rÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#√¬r≤É„#Ç≤∆◊≤¢„#BíÁFÙfóÜVBÉ2í≤rírì∞¢∆◊rÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√É√c√írì∞¢2Êfñ∆≈7Gñ∆R“∆◊s≤2Ê&VvñÂFÇÇì≤2Ê&2Ü∆◊Ç¬∆◊í¬¬¬rì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“w&v&É#SR√#3√s¬r≤É„CR≤∆◊≤¢„3RíÁFÙfóÜVBÉ2í≤rís∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ü∆◊Ç¬∆◊í¬„r¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢–¢ÚÚÊBFÜR&ˆ◊BFÜBFÜó2ˆÊR6‚&RfóÜVB(	B‚÷&W"ó˜fW"FÜP¢ÚÚÜVB¬ˆÊ«ívÜñ∆R6ÜR7GV∆«íÜ26V∆¬FÚ7VÊB‚vóFÜ˜WBFÜP¢ÚÚ6ˆÊFóFñˆ‚óBó2VW7B÷&∂W#≤vóFÇóB¬óBó2‚Á7vW"‡¢ñbÜñÁd6˜VÁBÜÁ46V∆ƒóFV“á2íí‚í∞¢ÚÚFÜR˜vÊW"v∆∂VB7G&ñváB7BFÜó2BWÇ‚F&≤VÊóB6ÜR6‡¢ÚÚfóÇó2FÜR÷˜7Bñ◊˜'FÁBFÜñÊrñ‚FÜR&ˆˆ”¢FÜRóó2$T4Ù‡¢ÚÚÊ˜r(	B∆ñváB6ÜgBWg&ˆ“FÜR&ˆGí¬'&VFÜñÊr&ñÊr&˜VÊBóB¿¢ÚÚÊBFÜR&ˆ«B&ñFñÊrFÜRF˜‚7Fñ∆¬6ˆÊFóFñˆÊ¬ˆ‚FÜR6V∆¬¬6Úó@¢ÚÚ7Fó2‚Á7vW"ÊBÊWfW"&V6ˆ÷W2VW7B÷&∂W"‡¢ÚÚ‘$¥U"ıdU"Ñî“¬‰UdU"t4Ç5$ı52Ñî“Ü˜vÊW"¬##b”Ç”#ì†¢ÚÚ'FÜR6Ü&7FW'2vW&RßW7B&«W''íÊBgV∆¬ˆb∆ñváB‚‚‚Ê˜FÜñÊró0¢ÚÚ6Ü˜vñÊr"í‚FÜR&V6ˆ‚v2‚DDïDïdR6ˆ«V÷‚G&v‚g&ˆ“&˜fRÜó0¢ÚÚÜVBF˜v‚Fá&˜VvÇÜó2VÁFó&R&ˆGí¬„GÇÜó2vñGFÇ(	BÊBFFóFófP¢ÚÚ∆ñváBÜ2ÊÚVFvRÑ%EÙ$î$ƒR*s2í¬6ÚóBFñBÊ˜B∆ñváBÜñ“¬ó@¢ÚÚFó76ˆ«fVBÜñ“‚÷V7W&VBñ‚FÜRFV„¢∆Vvñ&∆R&÷˜W&VBfñwW&RvóFÄ¢ÚÚÜV∆÷WB¬6Ü˜V∆FW"∆ñÊRÊB∆óB6ÜW7BvVÁBFÚfVGW&V∆W70¢ÚÚvˆ∆B∆˜¶VÊvR¬ÊBFÜR6B7FÊFñÊr&W6ñFRÜñ“vVÁBvóFÇóB‡¢Ú¢ÚÚFÜR¶ˆ"ó2VÊ6ÜÊvVB(	BFÜó2VÊóB6‚&RfóÜVBÊB6ÜRó2Üˆ∆FñÊp¢ÚÚFÜR6V∆¬(	B6ÚóBó27Fñ∆¬&V“¬&ñÊrÊB&ˆ«B¬ÊBóB7Fñ∆¿¢ÚÚÜ2FÚ&RfñÊF&∆RB&“w2∆VÊwFÇˆ‚ÜˆÊR‚óB6ñ◊«í5Dı2@¢ÚÚÑï2ÑTB‚FÜR&V“7FÊG2&˜fRÜñ“¬'&ñváFW7BßW7B˜fW"FÜP¢ÚÚÜV∆÷WC≤FÜR&ñÊró2ˆ‚FÜRf∆ˆ˜"ÜRó27FÊFñÊrˆ„≤FÜR&ˆ«B&ñFW0¢ÚÚFÜRF˜‚WfW'óFÜñÊrFÜBF˜V6ÜW2FÜR&ˆGíó2vˆÊR¬ÊB&V6ˆ‡¢ÚÚ˜fW"6Ü&7FW"ÁñˆÊR6‚6VR&VG22÷&∂W"&FÜW"FÜ‚2¢ÚÚ∆ñváFñÊrfV«B‡¢Ú¢ÚÚ‰BïBï2‰4Ñı$TBDÚDÑR$ÙEíDÑBï2E$t‚¬‰ıBDÑR$ıÇDÑ@¢ÚÚ4ÙƒƒîDU2‚FÜó2ó2váíFÜRv6Ç∆ÊFVBvÜW&RóBFñB¬ÊBóBv0¢ÚÚÊWfW"GVÊñÊr&ˆ&∆V”¢‚Â2w2VÁFóGí&˜Çó2óG2dTUB¬ÊBFÜP¢ÚÚfñwW&Ró2G&v‚g&ˆ“‚F∆26V∆¬66∆VB'íFÜB6Ü&7FW"w2˜v‡¢ÚÚ≤‚&F6ÜWBw2&˜Çó2SbÇF∆¬ÊBÜó2≤ó2"„b¬6ÚÜR7FÊG0¢ÚÚCbÇÜñvÇÊBÜó2ÜVBó2cbÇ$ıdR2Áí‚WfW'íˆfg6WBÜW&P¢ÚÚv2÷V7W&VBF˜v‚g&ˆ“2Áí(	B6Ú#ÇÇ˜fW"Üó2ÜVB"v2Gv¢ÚÚFÜó&G2ˆbFÜRvíF˜v‚Üó26ÜW7B¬ÊB6ÜgBFÜB&‚g&ˆ–¢ÚÚ2Áí“cFÚÜó2fVWB7F'FVBBÜó27FW&ÁV“‚6÷R&óFÜ÷WFñ2FÜP¢ÚÚ&ñ“Ü∆Ú&˜fR«&VGíFˆW3≤óBó2FˆÊRÜW&RFˆÚ&FÜW"FÜ‡¢ÚÚ77V÷VB¬&V6W6RFÜR≤FñffW'2W"6Ü&7FW"ÊB÷&∂W"FÜBó0¢ÚÚ&ñváBf˜"ˆÊRÊBw&ˆÊrf˜"FÜRÊWáBó2FÜR6÷R'Vrvñ‚‡¢6ˆÁ7B≥"“GóVˆbF∆4ˆb””“vgVÊ7Fñˆ‚rbbF∆4ˆbá2ÊWáG&ì∞¢6ˆÁ7B∂≥"“Ñ≥"bb≥"Á7V%∑2ÊWáG&“bb≥"Á7V%∑2ÊWáG&“Ê≤í«¬„C∞¢6ˆÁ7BÜVEí“2Áí≤2ÊÇ“2ÊÇ¢∂≥#∞¢6ˆÁ7BÇ“2ÁÇ≤2ÁrÚ"¬í“ÜVEí“#"≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ3#í¢3∞¢6ˆÁ7BS"“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ3í¢„S∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7B6ÜgB“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬ÜVEí“sÇ¬¬ÜVEí≤"ì∞¢6ÜgBÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#√√írì∞¢6ÜgBÊFD6ˆ∆˜%7F˜É„sB¬w&v&É#SR√#B√#¬r≤É„B≤S"¢„í≤rírì∞¢6ÜgBÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#B√#√írì∞¢2Êfñ∆≈7Gñ∆R“6ÜgC∞¢2Êfñ∆≈&V7BáÇ“2Ár¢„C"¬ÜVEí“sÇ¬2Ár¢„ÉB¬Éì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#SR√#B√#¬r≤É„#R≤S"¢„3Rí≤rís∞¢2Ê∆ñÊUvñGFÇ“#∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RáÇ¬2Áí≤2ÊÇ¬2Ár¢„í≤S"¢b¬r¬¬¬rì≤2Á7G&ˆ∂RÇì∞¢6ˆÁ7Bvr“2Ê7&VFU&Fñƒw&FñVÁBáÇ¬í¬¬Ç¬í¬#ì∞¢vrÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#3b√cÇ√„É"írì∞¢vrÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√É√c√írì∞¢2Êfñ∆≈7Gñ∆R“vs≤2Ê&VvñÂFÇÇì≤2Ê&2áÇ¬í¬#¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢gGáBÇ~)™r¬Ç¬í≤R¬R¬r3&#brì∞¢–¢–¢–¢–¢ÚÚDÑRtı$≤D$ƒRÜ˜vÊW#¢'FÜRF&∆R&VÜñÊBóB¬WfV‚FÜ˜VvÇóBw2'BˆbFÜP¢ÚÚñ÷vR¬ñ˜R6Ü˜V∆B7&VFR‚ˆ&¶V7Bñ‚FÜR6÷R6ÜR¬FÜR6÷R6ó¶R¬W@¢ÚÚóBñ‚g&ˆÁBˆbóB2‚WáFVÁ6ñˆ‚(	BFÜó2ó2vÜW&RFÜRÂ2vñ∆¬7F'@¢ÚÚv˜&∂ñÊrˆ‚FÜR7v˜&B¬g&ˆ“FÜR7'ó7F¬"í‚FÜRˆ&¶V7Bï2FÜRñÁFñÊrw0¢ÚÚ˜v‚&VÊ6É¢FÜR∆◊∆óBv˜&∂&VÊ6Ç&Vvñˆ‚ˆbFV‰ñÁFW&ñ˜"¬7&˜VBÊB7Fˆˆ@¢ÚÚˆ‚FÜRFV‚f∆ˆ˜"B&F6ÜWBw2&ñváBÜÊB(	B6÷R6ÜRÊB6ó¶R'ê¢ÚÚ6ˆÁ7G'V7Fñˆ‚¬G&v‚gFW"FÜR7FFñ726ÚóB7FÊG2ñ‚g&ˆÁBˆbÜñ“‚FÜP¢ÚÚf˜&vñÊrˆbFÜR7'ó7F¬ÜVÁ2ÜW&R‚FVFñ6FVBfó&VBˆ&¶V7B∆FRó0¢ÚÚ*s'"ˆ‚DÑRdï$î‰rƒï5C≤FÜó27&˜ó2óG27FÊB÷ñ‚ÊBóG2&VfW&VÊ6R‡¢ñbÑrÁ&ˆˆ‘ñB””“t"rí∞¢6ˆÁ7BF"“ÑrÁ&ˆˆ‘FVbÊÇ“í¢DîƒR≤c∞¢ÚÚ*s'"dï$TC¢FÜR&V¬f˜&vR◊F&∆R∆FR7FÊG2ñ‚FÜR÷ˆ÷VÁBóBFV6ˆFW3∞¢ÚÚFÜRñÁFñÊr÷7&˜7FÊB÷ñ‚&V∆˜r∂VW2FÜR&ˆˆ“vÜˆ∆RVÁFñ¬FÜV‚‡¢ñbáGóVˆb÷VFñfWF6Ç””“vgVÊ7Fñˆ‚rí÷VFñfWF6ÇÇvf˜&vUF&∆Rrì∞¢6ˆÁ7Bdñ““GóVˆb‘TDîÙî‘r”“wVÊFVfñÊVBrbb‘TDîÙî‘rÊf˜&vUF&∆S∞¢ñbÜdñ“bbdñ“ÊÊGW&≈vñGFÇbbGóVˆbG&u∆FTÊ6Ü˜&VB””“vgVÊ7Fñˆ‚rí∞¢ñbáGóVˆb6ˆÁF7E6ÜF˜r””“vgVÊ7Fñˆ‚rí6ˆÁF7E6ÜF˜rÜ2¬#"„b¢DîƒR¬F"¬ìR¬„Rì∞¢G&u∆FTÊ6Ü˜&VBÜ2¬vf˜&vUF&∆Rr¬#"„b¢DîƒR¬F"¬S¬f«6Rì∞¢“V«6RñbáGóVˆbv˜&µF&∆U∆FR””“vgVÊ7Fñˆ‚rí∞¢6ˆÁ7BDñ““v˜&µF&∆U∆FRÇì∞¢ñbáDñ“í∞¢6ˆÁ7BDÇ“S¬Er“DÇ¢áDñ“ÊÊGW&≈vñGFÇÚDñ“ÊÊGW&ƒÜVñváBì∞¢6ˆÁ7BGÇ“Ç„b¢DîƒS∞¢ÚÚ6ÜF˜rfó'7C¢FÜRfVFÜW&VB∆Vw2∆WBóB6Ü˜rFá&˜VvÇ¬vÜñ6Çó2vÜ@¢ÚÚ&ˆ˜G2FÜR&VÊ6Çˆ‚FÜRFV‚f∆ˆ˜"ñÁ7FVBˆbf∆ˆFñÊr˜fW"ó@¢ñbáGóVˆb6ˆÁF7E6ÜF˜r””“vgVÊ7Fñˆ‚rí6ˆÁF7E6ÜF˜rÜ2¬GÇ≤Er¢„R¬F"¬Er¢„3b¬„Rì∞¢2ÊG&tñ÷vRáDñ“¬GÇ¬F"“DÇ¬Er¬DÇì∞¢–¢–¢–¢ÚÚñÁFW&7BÜñÁ@¢ñbÑrÊÊV"bbrÁ7FFR””“uƒírbbrÁ&V6Ü&vRí∞¢6ˆÁ7B2“rÊÊV#∞¢6ˆÁ7B∆&V¬“2ÁGóR””“w&W67VRrÚBÑrÁ6fRÊf∆w2Ê7'ó7F¬Úw7F˜'ïˆ6∆VÁ6Rr¢w7F˜'ïˆ&ñÊFñÊrrí¢2ÁGóR””“vÁ2rÚBÇwF∆≤rí¢2ÁGóR””“v&VÊ6ÇrÚBÇw&W7Brí¢2ÁGóR””“wFW&“rÚBÇw&VBrí¢2ÁGóR””“w&ñFF∆RrÚBÇw&EˆÜñÁBrí¢2ÁGóR””“w6V7&WBrÚBÇw6V7&WEˆÜñÁBrí¢2ÁGóR””“wG&ñ¬rÚBÇwGEˆ˜V‚rí¢2ÁGóR””“wfV«BrÚBÇwfV«EˆÜñÁBrí¢BÇv˜V‚rì∞¢gGáBÜ∆&V¬¬2ÁÇ≤2ÁrÚ"¬2Áí“Ç¬2¬r6VVc6fr¬v6VÁFW"r¬w&v&É#√##√#SR√„Çírì∞¢–ß–¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚDT4Ñî‰rDÑRDTƒ¬(	BˆÊ6R¬ÊBFÜV‚ÊWfW"vñ‚‚FÜRfó'7B∆ˆ˜6R&ˆ6≤∆ñW ¢ÚÚ7FÊG2ÊWáBFÚ6ó2˜WB∆˜VBvÜBFÚFÚ&˜WBóB‚FÜR÷ˆ÷VÁBˆÊRó2'&ˆ∂V‚¿¢ÚÚÁóvÜW&R¬FÜó27F˜2fó&ñÊrf˜"FÜR&W7BˆbFÜR6fS¢g&ˆ“FÜV‚ˆ‚FÜR6V–¢ÚÚóG6V∆bó2FÜRˆÊ«íFÜñÊrFÜBFV∆«2ñ˜R¬vÜñ6Çó2vÜB÷∂W2FÜR&W7BˆbFÜP¢ÚÚf7F˜'ív˜'FÇ∆ˆˆ∂ñÊrB‡¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚDÑRt$‰î‰r‚FÜRFVWFÇFÜV◊6V«fW2&R&∂VBñÁFÚFÜRFñ∆R∆ñW"¬6ÚFÜR'@¢ÚÚFÜBÜ2FÚ‘ıdR∆ófW2ÜW&S¢26ÜR6ˆ÷W2ÊV"¬ÜVB&ó6W2ˆfbFÜR&ñ¬Ê@¢ÚÚFÜRˆñÁG26F6ÇFÜR∆ñváB‚Ü¶&BFÜB&V7G2FÚñ˜R&VñÊr6∆˜6R&VG20¢ÚÚv&Rˆbñ˜R¬ÊBFÜBó2÷˜7BˆbvÜB÷∂W2ˆÊRñÁFñ÷ñFFñÊr‡¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¶gVÊ7Fñˆ‚G&u7ñ∂T÷VÊ6RÇí∞¢ñbÇ∆ñW"«¬∆ñW"ÊFVB«¬rÊw&ñBí&WGW&„∞¢6ˆÁ7B7Ç“∆ñW"ÁÇ≤∆ñW"ÁrÚ"¬7í“∆ñW"Áí≤∆ñW"ÊÇÚ#∞¢6ˆÁ7BC“÷FÇÊf∆ˆ˜"á7ÇÚDîƒRí¬C“÷FÇÊf∆ˆ˜"á7íÚDîƒRì∞¢6ˆÁ7BÊ˜r“W&f˜&÷Ê6RÊÊ˜rÇì∞¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢f˜"Ü∆WBGí“C“3≤Gí√“C≤C≤Gí≤≤íf˜"Ü∆WBGÇ“C“S≤GÇ√“C≤S≤GÇ≤≤í∞¢ñbáFñ∆TBáGÇ¬Gíí”“u‚rí6ˆÁFñÁVS∞¢6ˆÁ7BÇ“GÇ¢DîƒR¬í“Gí¢DîƒS∞¢6ˆÁ7BB“÷FÇÊáó˜BÖÇ≤b“7Ç¬í≤b“7íì∞¢6ˆÁ7B≤“6∆◊É“BÚs¬¬ì∞¢ñbÜ≤√“„í6ˆÁFñÁVS∞¢ÚÚÜVBˆfbFÜR&ñ¬¬'&VFÜñÊp¢6ˆÁ7BR“„SR≤÷FÇÁ6ñ‚ÜÊ˜rÚ#c≤GÇ¢„rí¢„CS∞¢2Êv∆ˆ&ƒ«Ü“≤¢≤¢É„b≤R¢„bì∞¢6ˆÁ7Br“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬í≤DîƒR¬¬í“"ì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√S√É√„íírì≤rÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√S√É√írì∞¢2Êfñ∆≈7Gñ∆R“s≤2Êfñ∆≈&V7BÖÇ“"¬í“"¬DîƒR≤B¬DîƒR≤"ì∞¢ÚÚFÜR÷V«B'&VFÜW2∆ñváBWv&C≤FÜRG&VÊ6Çv∆˜w2∆ˆÊróG2&ñ¿¢2Êv∆ˆ&ƒ«Ü“≤¢É„"≤R¢„2ì∞¢2Êfñ∆≈7Gñ∆R“rÁ&ˆˆ‘FVbÁ¶ˆÊR””“t2rÚr6ffCÜr¢r6ffCCbs∞¢2Êfñ∆≈&V7BÖÇ≤"¬í≤DîƒR“¬DîƒR“B¬"ì∞¢–¢2Á&W7F˜&RÇì∞ß–¶gVÊ7Fñˆ‚G&t'&V¥ÜñÁBÇí∞¢ñbÇ∆ñW"«¬∆ñW"ÊFVB«¬rÊw&ñBí&WGW&„∞¢ñbÑrÁ6fRbbrÁ6fRÊf∆w2bbrÁ6fRÊf∆w2ÁFVváD'&V≤í&WGW&„∞¢6ˆÁ7B7Ç“∆ñW"ÁÇ≤∆ñW"ÁrÚ"¬7í“∆ñW"Áí≤∆ñW"ÊÇÚ#∞¢6ˆÁ7BC“÷FÇÊf∆ˆ˜"á7ÇÚDîƒRí¬C“÷FÇÊf∆ˆ˜"á7íÚDîƒRì∞¢∆WB&W7B“ÁV∆¬¬&B“Sì∞¢f˜"Ü∆WBGí“C“3≤Gí√“C≤3≤Gí≤≤íf˜"Ü∆WBGÇ“C“C≤GÇ√“C≤C≤GÇ≤≤í∞¢ñbáFñ∆TBáGÇ¬Gíí”“t"rí6ˆÁFñÁVS∞¢6ˆÁ7BB“÷FÇÊáó˜BáGÇ¢DîƒR≤b“7Ç¬Gí¢DîƒR≤b“7íì∞¢ñbÜB¬&Bí≤&B“C≤&W7B“≤GÇ¬Gí”≤–¢–¢ñbÇ&W7B«¬&B‚3"í&WGW&„∞¢ÚÚfñÊBFÜRF˜ˆbFÜó2&∆ˆ6≤6ÚFÜR&ˆ◊B6óG2&˜fRFÜRvÜˆ∆R6«W7FW ¢∆WBF˜“&W7BÁGì∞¢vÜñ∆RáFñ∆TBÜ&W7BÁGÇ¬F˜“í””“t"ríF˜“”∞¢ÚÚ&∆ˆ6≤B˜"&V∆˜rÜW"fVWBÜ2FÚ&RÜóBg&ˆ“&˜fS≤ÁóFÜñÊr&W6ñFR˜ ¢ÚÚ˜fW"ÜW"ÜVBF∂W2‚˜&FñÊ'í7vñÊp¢6ˆÁ7B&V∆˜r“F˜¢DîƒR„“∆ñW"Áí≤∆ñW"ÊÇ“c∞¢6ˆÁ7B◊6r“BÜ&V∆˜rÚv'&VµˆF˜v‚r¢v'&VµˆÜóBrì∞¢ÚÚf∆ˆ˜"&∆ˆ6≤6óG2BÜW"fVWB¬6ÚFÜR∆ñÊRÜ2FÚ6∆V"ÜW"ÜV@¢6ˆÁ7B'Ç“&W7BÁGÇ¢DîƒR≤b¬'í“F˜¢DîƒR“Ü&V∆˜rÚCb¢bì∞¢6ˆÁ7BR“„SR≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ#cí¢„CS∞¢ÚÚ6ˆgB&ñÊrˆ‚FÜR7FˆÊRóG6V∆b¬6ÚFÜRWñRvˆW2FÚFÜR&ˆ6≤¬Ê˜BFÜRFWá@¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s≤2Êv∆ˆ&ƒ«Ü“„≤R¢„3∞¢6ˆÁ7Bw"“2Ê7&VFU&Fñƒw&FñVÁBÜ'Ç¬F˜¢DîƒR≤b¬"¬'Ç¬F˜¢DîƒR≤b¬3Bì∞¢w"ÊFD6ˆ∆˜%7F˜É¬≈¥rÁ&ˆˆ‘FVbÁ¶ˆÊU“ÊVFvRì≤w"ÊFD6ˆ∆˜%7F˜É¬w&v&É√√√írì∞¢2Êfñ∆≈7Gñ∆R“w#≤2Ê&VvñÂFÇÇì≤2Ê&2Ü'Ç¬F˜¢DîƒR≤b¬3B¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢gGáBÜ◊6r¬'Ç¬'í¬"¬r6VVc6fr¬v6VÁFW"r¬w&v&É#√##√#SR√„ÉRírì∞ß–¢ÚÚDÑR4ÑÙ4µtdRÜ˜vÊW"¬##b”í”Ç¬g&ˆ“67&VVÁ6Ü˜BˆbFÜR7WW&6Ü&vS†¢ÚÚ'FÜW6R7W'&˜VÊFñÊrVffV7B6ó&6∆W2ÊVVG2FÚ&R÷˜&RfgÇÊBÊñ÷FVBñ‚÷˜&P¢ÚÚFWFñ«2ÊB6ÜñÊR"í‚óBv2ˆÊR2„WÇvÜóFR7G&ˆ∂R‚óBó2Ê˜rvfRvóFÇ¢ÚÚ&ˆGì¢‚FFóFófRÜ∆Úñ‚FÜR∂ñÊvFˆ“w2˜v‚∆ñváB¬6Vv÷VÁFVBñÊÊW"vfR¢ÚÚ&VB&VÜñÊBóBFÜBGW&Á22óBWáÊG2¬7&∑2&ñFñÊrFÜR&ñ“¬ÊBÜ˜@¢ÚÚ7&ó7VFvRˆ‚F˜‚&ñÊw2∆ñ∂RFÜó2&R˜W'2FÚG&rÊBÊWfW"Üñvw6fñV∆Bw2(	@¢ÚÚW&RFFóFófRv∆˜rÜÊFVBFÚ÷ˆFV¬6ˆ÷W2&6≤2∆óB6ˆ∆ñBˆ&¶V7B‡¢Ú¢ÚÚFá&VR'V∆W2óB∂VW3¢WfW'óFÜñÊró2G&ófV‚'í"ÊB¬vÜñ6ÇWFFRÇí˜vÁ2¿¢ÚÚ6ÚG&rÊWfW"&VG26∆ˆ6≤áFW7G2ˆG&v6∆ˆ6≤Ê6ß2ì≤Ê˜FÜñÊró2∆∆ˆ6FVBW ¢ÚÚg&÷S≤ÊBFÜR'B&ˆ&RÜñFW2óB∆ñ∂RWfW'í˜FÜW"w&˜VÊBVffV7B¬6Ú¢ÚÚÜ&ÊW72÷V7W&ñÊr&ˆGíÊWfW"÷V7W&W2FÜRvfRVÊFW"óB‡¶gVÊ7Fñˆ‚G&u&ñÊw2Ü2í∞¢6ˆÁ7B¶ˆÊR“áGóVˆb¬”“wVÊFVfñÊVBrbb≈¥rÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÁ¶ˆÊU“í«¬áGóVˆb¬”“wVÊFVfñÊVBrbb¬‰ì∞¢6ˆÁ7B¶ˆÊTv∆˜r“¶ˆÊRÚ¶ˆÊRÊv∆˜r¢r3vFSÜfbs∞¢f˜"Ü6ˆÁ7B"ˆbrÁ&ñÊw2í∞¢6ˆÁ7B≤“6∆◊á"ÊÚá"Ê«¬„ÉRí¬¬ì≤ÚÚB&ó'FÇ”‚BFVFÄ¢6ˆÁ7B&˜&‚““≤¬"“"Á"¬6ˆ¬“"Ê6ˆ¬«¬¶ˆÊTv∆˜r¬6VVB“"Á6VVB¬∞¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢ÚÚFÜRÜ∆Û¢vñFRÊB6ˆgB¬ñ‚FÜR&ˆˆ“w2∆ñváB¬'&ñváFW7BFÜRñÁ7FÁBóBfó&W0¢2Á7G&ˆ∂U7Gñ∆R“6ˆ√∞¢2Êv∆ˆ&ƒ«Ü“„#b¢≥≤2Ê∆ñÊUvñGFÇ“Ç¢É„b≤„B¢≤ì∞¢2Ê&VvñÂFÇÇì≤2Ê&2á"ÁÇ¬"Áí¬"¬¬rì≤2Á7G&ˆ∂RÇì∞¢2Êv∆ˆ&ƒ«Ü“„C"¢≥≤2Ê∆ñÊUvñGFÇ“s∞¢2Ê&VvñÂFÇÇì≤2Ê&2á"ÁÇ¬"Áí¬"¬¬rì≤2Á7G&ˆ∂RÇì∞¢ÚÚFÜRñÊÊW"vfS¢6Vv÷VÁFVBVÊW&wí&VB&VÜñÊBFÜRVFvR¬&˜FFñÊrvóFÇFÜP¢ÚÚWáÁ6ñˆ‚(	BFÜRF6Çˆfg6WBó2gVÊ7Fñˆ‚ˆb"¬6ÚóBGW&Á22óBw&˜w0¢6ˆÁ7B&í“÷FÇÊ÷ÇÉ"¬"“B“#Ç¢&˜&‚ì∞¢2Á6WD∆ñÊTF6ÇÖ≥í¬5“ì≤2Ê∆ñÊTF6Ñˆfg6WB“’"¢„c∞¢2Êv∆ˆ&ƒ«Ü“„R¢≥≤2Ê∆ñÊUvñGFÇ“"„c∞¢2Ê&VvñÂFÇÇì≤2Ê&2á"ÁÇ¬"Áí¬&í¬¬rì≤2Á7G&ˆ∂RÇì∞¢2Á6WD∆ñÊTF6ÇÖµ“ì∞¢ÚÚ7&∑2&ñFñÊrFÜR&ñ“¬7V‚'íFÜRWáÁ6ñˆ‚ÊB6«FVB'íFÜR&ñÊrw26VV@¢6ˆÁ7B‚“B¬7ñ‚“"¢„"≤á6VVBRrí¢„S∞¢2Á7G&ˆ∂U7Gñ∆R“r6fffffbs≤2Êv∆ˆ&ƒ«Ü“„í¢≥≤2Ê∆ñÊUvñGFÇ“„c∞¢2Ê&VvñÂFÇÇì∞¢f˜"Ü∆WBí“≤í¬„≤í≤≤í∞¢6ˆÁ7B“7ñ‚≤í¢Ñ÷FÇÂí¢"Ú‚í≤Çá6VVB„‚ÜíR2ííbí¢„#∞¢6ˆÁ7B∆V‚“R≤í¢≤¢ÇÇÇá6VVB≤í¢Üí≤2ííRRíÚBì∞¢6ˆÁ7B6“÷FÇÊ6˜2Üí¬6“÷FÇÁ6ñ‚Üì∞¢2Ê÷˜fUFÚá"ÁÇ≤6¢Ö"“"í¬"Áí≤6¢Ö"“"íì∞¢2Ê∆ñÊUFÚá"ÁÇ≤6¢Ö"≤∆V‚í¬"Áí≤6¢Ö"≤∆V‚íì∞¢–¢2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢ÚÚFÜRÜ˜BVFvS¢7&ó7ÊB6˜W&6R÷˜fW"‚ÊÚ6ÜF˜t&«W"(	B6VRG&u&ˆ$eÇf˜ ¢ÚÚFÜR÷V7W&V÷VÁC≤FÜRÜ∆Ú7G&ˆ∂W2&˜fR&RvÜB6ÜñÊR‡¢2Êv∆ˆ&ƒ«Ü“÷FÇÊ÷ñ‚É¬„ìR¢÷FÇÁ7'BÜ≤íì∞¢2Ê∆ñÊUvñGFÇ“2„R¢É„r≤„R¢≤ì∞¢2Á7G&ˆ∂U7Gñ∆R“r6fffffbs∞¢2Ê&VvñÂFÇÇì≤2Ê&2á"ÁÇ¬"Áí¬"¬¬rì≤2Á7G&ˆ∂RÇì∞¢2Êv∆ˆ&ƒ«Ü“∞¢–ß–¶gVÊ7Fñˆ‚G&u6V«2Öí∞¢ñbÇ&˜747FófRÇíí&WGW&„∞¢6ˆÁ7Br“rÁ&ˆˆ‘FVbÁr¢DîƒR¬Ç“rÁ&ˆˆ‘FVbÊÇ¢DîƒS∞¢6ˆÁ7BR“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ#í¢„3∞¢2Êfñ∆≈7Gñ∆R“Êv∆˜s≤2Êv∆ˆ&ƒ«Ü“„#R≤R¢„#S∞¢6ˆÁ7BWÇ“rÁ&ˆˆ‘FVbÊWÜóG2«¬∑”∞¢ñbÜWÇ‰¬í2Êfñ∆≈&V7BÉ¬¬¬Çì∞¢ñbÜWÇÂ"í2Êfñ∆≈&V7BÖr“¬¬¬Çì∞¢ñbÜWÇÂBí2Êfñ∆≈&V7BÉ¬¬r¬ì∞¢ñbÜWÇ‰"í2Êfñ∆≈&V7BÉ¬Ç“¬r¬ì∞¢2Êv∆ˆ&ƒ«Ü“∞ß–¢ÚÚV∆V÷VÁBfVVF&6≤ÊBFÜR6ˆÊrw2vfR‚G&v‚ñ‚67&VV‚76R¬6Úv˜&∆BˆñÁG0¢ÚÚ&R6ˆÁfW'FVBFá&˜VvÇFÜR6÷W&‡¶gVÊ7Fñˆ‚G&teÇÇí∞¢6ˆÁ7BGB“≤ÚÚ&VB÷ˆÊ«íG&s¢gÑFV6í˜vÁ2FÜR6ñ◊V∆Fñˆ‚6∆ˆ6∞¢ñbÑrÁ6ˆÊuvfRí∞¢6ˆÁ7Br“rÁ6ˆÊuvfS≤rÁB”“GC∞¢ñbárÁB√“írÁ6ˆÊuvfR“ÁV∆√∞¢V«6R∞¢6ˆÁ7B≤““rÁBÚ„r¬7Ç“rÁÇ“6“ÁÇ¬7í“rÁí“6“Áì∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ«Ü“É“≤í¢„ÉS∞¢2Á7G&ˆ∂U7Gñ∆R“TƒT“Ê◊W'"Êv∆˜s≤2Ê∆ñÊUvñGFÇ“3∞¢2Ê&VvñÂFÇÇì≤2Ê&2á7Ç¬7í¬4Ù‰uı$‰tR¢≤¬¬rì≤2Á7G&ˆ∂RÇì∞¢2Ê∆ñÊUvñGFÇ“„S≤2Êv∆ˆ&ƒ«Ü“É“≤í¢„C∞¢2Ê&VvñÂFÇÇì≤2Ê&2á7Ç¬7í¬4Ù‰uı$‰tR¢≤¢„s"¬¬rì≤2Á7G&ˆ∂RÇì∞¢ÚÚÊ˜FW2&ñFñÊrFÜRvfR˜WGv&@¢2Êv∆ˆ&ƒ«Ü““≥∞¢2Êfñ∆≈7Gñ∆R“TƒT“Ê◊W'"Êv∆˜s∞¢f˜"Ü∆WBí“≤í¬s≤í≤≤í∞¢6ˆÁ7B“íÚr¢÷FÇÂí¢"≤≤¢„b¬'#"“4Ù‰uı$‰tR¢≤¢„Éc∞¢gGáBÇ~)ö¢r¬7Ç≤÷FÇÊ6˜2Üí¢'#"¬7í≤÷FÇÁ6ñ‚Üí¢'#"“B¬R≤É“≤í¢b¬TƒT“Ê◊W'"Êv∆˜rì∞¢–¢2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢–¢–¢ñbÑrÊV∆V’˜í∞¢6ˆÁ7B“rÊV∆V’˜≤ÁB”“GC∞¢ñbáÁB√“írÊV∆V’˜“ÁV∆√∞¢V«6R∞¢6ˆÁ7B≤““ÁBÚ„S∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ«Ü“÷FÇÊ÷ñ‚É¬ÁB¢2ì∞¢6ˆÁ7B∆&¬“ÊV¬””“v◊W'"rÚBÇvgÖ˜7FvvW"rí¢ÊV¬ÚBÇvgÖ˜vV≤rí¢BÇvgÖ˜&W6ó7Brì∞¢6ˆÁ7B6ˆ¬“ÊV¬ÚTƒT’∑ÊV≈“Êv∆˜r¢r3Ü&#Rs∞¢gGáBÜ∆&¬¬ÁÇ“6“ÁÇ¬Áí“6“Áí“#"“≤¢#¬ÊV¬Úí¢B¬6ˆ¬¬v6VÁFW"r¬ÊV¬Ú6ˆ¬¢ÁV∆¬¬sÉrì∞¢2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢–¢–ß–¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚDÑR‘%UEDÙ‚‚÷&˜VÊBFÚ∂WíÊˆ&ˆGí&W76W2÷í2vV∆¬Ê˜BWÜó7B¬6¢ÚÚFÜW&Ró2∆&V∆∆VB6ˆÁG&ˆ¬ˆ‚FÜRÖTBFÜB˜VÁ2óB(	B6∆ñ6∂&∆RvóFÇ÷˜W6R¿¢ÚÚF&∆Rˆ‚ÜˆÊR‚óB7Fó2˜WBˆbFÜRvíVÁFñ¬óB÷VÁ26ˆ÷WFÜñÊs¢FÜP¢ÚÚ÷ˆ÷VÁB6ÜRÜ2&VV‚ñ‚6V6ˆÊB&ˆˆ“¬óBfFW2ñ‚ÊB6ó26ÚˆÊ6R‡¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¶gVÊ7Fñˆ‚÷VÊ∆ˆ6∂VBÇí∞¢∆WB‚“∞¢f˜"Ü6ˆÁ7B≤ñ‚ÑrÁ6fRbbrÁ6fRÁfó6óFVBí«¬∑“í≤ñbÇ≤∂‚„“"í&WGW&‚G'VS≤–¢&WGW&‚f«6S∞ß–¶gVÊ7Fñˆ‚÷'FÂ&V7BÇí≤&WGW&‚≤É¢ÉCb¬ì¢#"¬s¢ì"¬É¢#Ç”≤–¶gVÊ7Fñˆ‚'&ñD'FÂ&V7BÇí≤&WGW&‚≤É¢ÉCb¬ì¢Sb¬s¢ì"¬É¢#Ç”≤–¶gVÊ7Fñˆ‚G&t÷'WGFˆ‚Çí∞¢ñbÇ÷VÊ∆ˆ6∂VBÇí«¬ÖDıT4ÇbbDıT4ÇÊVÊ&∆VBíí&WGW&„∞¢ÚÚÊÊ˜VÊ6RóBˆÊ6R¬FÜRfó'7BFñ÷RóBó2v˜'FÇÜfñÊp¢ñbÇrÁ6fRÊf∆w2Ê÷6VV‚bbrÁGWBbbrÊ∆W76ˆ‚bbrÁ7FFR””“uƒírí∞¢rÁ6fRÊf∆w2Ê÷6VV‚“≤rÊ÷'F‰ÊWr“c≤W'6ó7BÇì∞¢ñbáGóVˆbrÁFˆ7B””“vgVÊ7Fñˆ‚rírÁFˆ7BáBÇv÷ˆÊWrríì∞¢–¢6ˆÁ7B"“÷'FÂ&V7BÇì∞¢6ˆÁ7BÁr“ÑrÊ÷'F‰ÊWr«¬í‚∞¢6ˆÁ7BR“ÁrÚ„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚÉí¢„R¢∞¢2Á6fRÇì∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉÇ√b√#B¬r≤É„b≤R¢„#Rí≤rís∞¢'"Ü2¬"ÁÇ¬"Áí¬"Ár¬"ÊÇ¬rì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“ÁrÚw&v&É#√#C√#SR¬r≤É„R≤R¢„Rí≤rír¢w&v&É#√#√#3√„CRís∞¢2Ê∆ñÊUvñGFÇ“ÁrÚ"¢„3∞¢'"Ü2¬"ÁÇ¬"Áí¬"Ár¬"ÊÇ¬rì≤2Á7G&ˆ∂RÇì∞¢gGáBÇ~)jbr≤BÇv÷ˆ'F‚rí¬"ÁÇ≤"ÁrÚ"¬"Áí≤"ÊÇÚ"¬2¬ÁrÚr6Vfffbr¢r6&6CfSbr¬v6VÁFW"rì∞¢ÚÚÊBFÜR◊V«FófW'6RóG6V∆b¬ˆÊ6R6ÜRÜ27GV∆«íf˜&∂VBˆÊP¢6ˆÁ7B#"“'&ñBÇì∞¢ñbÜ#"bb#"Ê∆VBÊ∆VÊwFÇí∞¢6ˆÁ7B“'&ñD'FÂ&V7BÇì∞¢6ˆÁ7BR“VÊófW'6RÇì∞¢6ˆÁ7BÜ˜B“RÁ&VB‚„3C∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉÇ√b√#B√„bís∞¢'"Ü2¬ÁÇ¬Áí¬Ár¬ÊÇ¬rì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“Ü˜BÚw&v&É#SR√ì√b√„SRír¢w&v&É#R√#3"√c√„CRís∞¢2Ê∆ñÊUvñGFÇ“„3≤'"Ü2¬ÁÇ¬Áí¬Ár¬ÊÇ¬rì≤2Á7G&ˆ∂RÇì∞¢gGáBÇ~(πBr≤RÊñB¬ÁÇ≤ÁrÚ"¬Áí≤ÊÇÚ"¬„R¬Ü˜BÚr6ff&63Br¢r6&6CfSbr¬v6VÁFW"rì∞¢–¢2Á&W7F˜&RÇì∞ß–¶FDWfVÁD∆ó7FVÊW"Çv÷˜W6VF˜v‚r¬ÜRí”‚∞¢ÚÚ‚ˆffW"ó2Á7vW&VB'í6∆ñ6∂ñÊrFÜR˜Fñˆ‚¬ˆ‚ÁíFWfñ6P¢ñbáGóVˆbr”“wVÊFVfñÊVBrbbrÊˆffW"bbrÊˆffW"ÊFˆÊRbbGóVˆbˆffW%F””“vgVÊ7Fñˆ‚rí∞¢6ˆÁ7B#“7bbb7bÊvWD&˜VÊFñÊt6∆ñVÁE&V7BÚ7bÊvWD&˜VÊFñÊt6∆ñVÁE&V7BÇí¢ÁV∆√∞¢ñbá#í∞¢6ˆÁ7B˜Ç“ÜRÊ6∆ñVÁEÇ“#Ê∆VgBí¢ÉìcÚ#ÁvñGFÇí¬˜í“ÜRÊ6∆ñVÁEí“#ÁF˜í¢ÉSCÚ#ÊÜVñváBì∞¢ñbÜˆffW%FÜ˜Ç¬˜ííí&WGW&„∞¢–¢–¢ñbáGóVˆbr””“wVÊFVfñÊVBr«¬rÁ7FFR”“uƒírí&WGW&„∞¢ñbÇ÷VÊ∆ˆ6∂VBÇí«¬ÖDıT4ÇbbDıT4ÇÊVÊ&∆VBíí&WGW&„∞¢6ˆÁ7B"“7bbb7bÊvWD&˜VÊFñÊt6∆ñVÁE&V7BÚ7bÊvWD&˜VÊFñÊt6∆ñVÁE&V7BÇí¢ÁV∆√≤ñbÇ"í&WGW&„∞¢6ˆÁ7B7Ç“ÜRÊ6∆ñVÁEÇ“"Ê∆VgBí¢ÉìcÚ"ÁvñGFÇí¬7í“ÜRÊ6∆ñVÁEí“"ÁF˜í¢ÉSCÚ"ÊÜVñváBì∞¢6ˆÁ7B"“÷'FÂ&V7BÇì∞¢ñbá7Ç„“"ÁÇbb7Ç√“"ÁÇ≤"Árbb7í„“"Áíbb7í√“"Áí≤"ÊÇí∞¢rÁ7FFR“t‘s≤rÊ÷'F‰ÊWr“≤÷fñWrÁ&VGí“f«6S≤6gÇÇwVírì∞¢&WGW&„∞¢–¢6ˆÁ7B“'&ñD'FÂ&V7BÇì≤6ˆÁ7B#2“'&ñBÇì∞¢ñbÜ#2bb#2Ê∆VBÊ∆VÊwFÇbb7Ç„“ÁÇbb7Ç√“ÁÇ≤Árbb7í„“Áíbb7í√“Áí≤ÊÇí∞¢rÁ7FFR“t%$îBs≤'&ñEfñWrÁ&VGí“f«6S≤6gÇÇwVírì∞¢–ß“ì∞¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¢ÚÚdï%5BƒU54ÙÂ2‚FÜRv÷R˜VÊVB'íÜÊFñÊr6WfV‚◊ñV"÷ˆ∆B&ˆ&˜B6BÊB¢ÚÚ∂Wñ&ˆ&BÊB6ññÊrÊ˜FÜñÊr‚WfW'óFÜñÊr6ÜR6‚FÚó2Fó66˜fW&&∆R¬vÜñ6Çó0¢ÚÚÊ˜BFÜR6÷R2Fó66˜fW&VB(	B∆VÁGíˆb∆ñW'2ÊWfW"f˜VÊBFÜR6∆rB∆¬¿¢ÚÚ&V6W6RÊ˜FÜñÊrWfW"6∂VBFÜV“FÚW6RóB‡¢Ú¢ÚÚ6ÚFÜRfó'7B&ˆˆ“FV6ÜW2Fá&VRfW&'2ÊBÊÚ÷˜&S¢‘ıdR¬•T’¬45$D4Ç‚V6Ä¢ÚÚˆÊRvóG2f˜"FÜR∆ñW"FÚ7GV∆«íFÚóB(	BÊ˜BFÚ&VB&˜WBóBÊB&W70¢ÚÚˆ‚(	BÊBV6Ç6Ü˜w2FÜR6ˆÁG&ˆ¬DÑï2∆ñW"Ü2ñ‚FÜVó"ÜÊG3¢FÜRˆ‚◊67&VV‡¢ÚÚ'WGFˆ‚ˆ‚ÜˆÊR¬FÜRB'WGFˆ‚vóFÇB«VvvVBñ‚¬FÜR∂Wí˜FÜW'vó6R‡¢ÚÚóBÊWfW"&∆ˆ6∑2¬óBÊWfW"W6W2FÜRv÷R¬ÊBˆÊ6RfW&"ó2∆V&ÊVBóBó0¢ÚÚvˆÊRf˜"vˆˆB‡¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¶6ˆÁ7BEUEı5DU2“∞¢≤ñC¢v÷˜fRr¬∆&V√¢wGWEˆ÷˜fRr¬ÜñÁC¢wGWEˆ÷˜fUˆÇr¿¢∂Wó3¢u«S#ì«S#ì"r¬C¢tB◊Br¬F˜V6É¢w7Fñ6≤r¬f#¢ÁV∆¬¿¢FˆÊS¢Çí”‚÷FÇÊ'2á∆ñW"ÁgÇí‚C“¿¢ÚÚ‚‚ÊÊBÊ˜r6ÜRÜ2FÚU4RóB¬vÜñ6Çó2FÜR7FWFÜB6'&ñW2FÜR7F˜'ì†¢ÚÚFÜRFˆ˜"˜WBˆbFÜR&ˆˆ“6ÜRvˆ∂Rñ‚‚óB6ÊÊ˜B&R6ˆ◊∆WFVB'í&W76ñÊp¢ÚÚÁóFÜñÊr(	BˆÊ«í'ívˆñÊr¬vÜñ6Çó2WÜ7F«ívÜBFÜR÷ˆ÷VÁBó2‡¢≤ñC¢v˜WBr¬∆&V√¢wGWEˆ˜WBr¬ÜñÁC¢wGWEˆ˜WEˆÇr¿¢∂Wó3¢u«S#ì"r¬C¢tB◊Br¬F˜V6É¢w7Fñ6≤r¬f#¢ÁV∆¬¿¢FˆÊS¢Çí”‚ÖEUEı$ÙÙ’5¥rÁ&ˆˆ‘ñE“«¬í„““¿¢≤ñC¢vßV◊r¬∆&V√¢wGWEˆßV◊r¬ÜñÁC¢wGWEˆßV◊ˆÇr¬&ˆˆ”¢us"r¿¢∂Wó3¢u76Rr¬C¢tr¬F˜V6É¢t•T’r¬f#¢ud•T’r¿¢FˆÊS¢Çí”‚∆ñW"Êˆ‚bb∆ñW"Ágí¬”cbbáGóVˆbvñÊF˜r””“wVÊFVfñÊVBr«¬vñÊF˜rÂı˜GWF˜&ñƒVÊf˜&6V÷VÁB«¬rÁGWBÊßV◊6Ü˜v‚í“¿¢ÚÚDÑRtDU2‚FÜR6V6ˆÊBÜ∆bˆbFÜRv∆≤¬ÊBFÜR&V6ˆ‚FÜRv∆≤WÜó7G3¢¢ÚÚGWF˜&ñ¬FÜBVÊG2BFˆ˜"ñ˜R6‚6VRg&ˆ“vÜW&Rñ˜R7F'FVBvófW2FÜP¢ÚÚfW&'26ˆ÷WvÜW&RFÚÜfR&VV‚vˆñÊr‡¢≤ñC¢vvFRr¬∆&V√¢wGWEˆvFRr¬ÜñÁC¢wGWEˆvFUˆÇr¿¢∂Wó3¢u«S#ì"r¬C¢tB◊Br¬F˜V6É¢w7Fñ6≤r¬f#¢ÁV∆¬¿¢FˆÊS¢Çí”‚ÖEUEı$ÙÙ’5¥rÁ&ˆˆ‘ñE“«¬í„“"“¿¢ÚÚ‚‚‰‰BƒU54Ù‚ï2Ù‰≈íƒT$‰TBî‚DÑR$ÙÙ“DÑBDT4ÑU2ïB‡¢Ú¢ÚÚ&˜FÇˆbFÜRÊWáBGvÚ&VBtƒÙ$¬7FFR¬ÊBv∆ˆ&¬7FFR6ÜÊvW2vÜV‚6ÜP¢ÚÚ6ÜÊvW2&ˆˆ◊2(	BvÜñ6Çó2FÜRvÜˆ∆RˆbFÜR˜vÊW"w2&W˜'C¢'FÜRv∆≤Fá&˜VvÄ¢ÚÚ∆∆˜w2FÜR∆ñW"FÚ72FÜRfó'7BVÊV◊íFÜBÊVVG2FÚ&RGF6∂VB¬∂VW ¢ÚÚvˆñÊrFÚFÜR6Ü˜¬72FÜR6Ü˜vóFÜ˜WBWfV‚GF6∂ñÊróB‚‚‚ÊBñbê¢ÚÚ&W72GF6≤ñÁ6ñFRFÜR6Ü˜¬FÜR7ó7FV“6ˆÁ6ñFW'2óB2ñbíGF6∂VBFÜP¢ÚÚVÊV◊íÁóví‚"7vñÊró27vñÊrvÜW&WfW"óBÜVÁ2¬ÊBÊÚ∆ófP¢ÚÚVÊV÷ñW6ó2E%TRñ‚WfW'í&ˆˆ“FÜBÊWfW"ÜBˆÊR(	B6Ú7FWñÊrñÁFÚFÜP¢ÚÚ&ˆ˜FÇ6ˆ◊∆WFVBFÜR∂ñ∆¬∆W76ˆ‚'ív∆∂ñÊrvíg&ˆ“FÜR÷6ÜñÊR‡¢Ú¢ÚÚ&ˆˆ÷Ê÷W2vÜW&RFÜR∆W76ˆ‚∆ófW2‚GWEFñ6≤vñ∆¬Ê˜B6ˆ◊∆WFR7FW ¢ÚÚvÜ˜6R&ˆˆ“6ÜRó2Ê˜B7FÊFñÊrñ‚‡¢≤ñC¢vF≤r¬∆&V√¢wGWEˆF≤r¬ÜñÁC¢wGWEˆFµˆÇr¬&ˆˆ”¢tr¿¢∂Wó3¢uÇr¬C¢uÇr¬F˜V6É¢tD≤r¬f#¢udD≤r¿¢FˆÊS¢Çí”‚∆ñW"Á7vñÊr«¬∆ñW"Ê6ˆ÷&ıB‚“¿¢ÚÚ““““ÊBÊ˜rFÜRƒÙı¬vÜñ6Çó2FÜR'BfW&"GWF˜&ñ¬ÊWfW"FV6ÜW2“““–¢ÚÚ∂Ê˜vñÊrvÜñ6Ç'WGFˆ‚7vñÊw2ó2Ê˜B∂Ê˜vñÊrÜ˜rFÚ∆íFÜó2v÷R‚vÜB¢ÚÚ∆ñW"7GV∆«íÜ2FÚ∆V&‚ó2FÜR6ó&7VóC¢÷6ÜñÊR'&ˆ∂V‚ó267&¿¢ÚÚ67&ó2fˆ«G2¬fˆ«G2&R6˜&W2¬ÊBFÜñÊ∂ñÊró27W'&VÊ7íˆbóG2˜v‚FÜ@¢ÚÚ'Wó2FÜR&ñ∆óFñW2WfW'óFÜñÊr&˜fR'VÁ2ˆ‚‚V6ÇˆbFÜW6R7FW2ó2ˆÊP¢ÚÚ∆ñÊ≤¬FVváBñ‚FÜR˜&FW"FÜR6ó&7VóB'VÁ2¬ˆ‚FÜRf∆ˆ˜"vÜW&RÊ˜FÜñÊr6‡¢ÚÚ∂ñ∆¬ñ˜Rf˜"vWGFñÊróBw&ˆÊr‡¢≤ñC¢v∂ñ∆¬r¬∆&V√¢wGWEˆ∂ñ∆¬r¬ÜñÁC¢wGWEˆ∂ñ∆≈ˆÇr¬&ˆˆ”¢tr¿¢∂Wó3¢uÇr¬C¢uÇr¬F˜V6É¢tD≤r¬f#¢udD≤r¿¢FˆÊS¢Çí”‚rÊVÊV÷ñW2Á6ˆ÷RÜR”‚RbbRÊFVBbbRÊFó6&∆VBbbRÁ&W67VVBí“¿¢≤ñC¢v6ˆñ‚r¬∆&V√¢wGWEˆ6ˆñ‚r¬ÜñÁC¢wGWEˆ6ˆñÂˆÇr¿¢∂Wó3¢u«S#ì«S#ì"r¬C¢tB◊Br¬F˜V6É¢w7Fñ6≤r¬f#¢ÁV∆¬¿¢FˆÊS¢Çí”‚rÁ6fRÁ67&„“"“¿¢≤ñC¢v'Wír¬∆&V√¢wGWEˆ'Wír¬ÜñÁC¢wGWEˆ'WïˆÇr¿¢∂Wó3¢tRr¬C¢t"r¬F˜V6É¢tîÂBr¬f#¢udîÂBr¿¢FˆÊS¢Çí”‚ÑrÁ6fRÊf∆w2bbrÁ6fRÊf∆w2ÁGWD'Wíí“¿¢≤ñC¢vÜV¬r¬∆&V√¢wGWEˆÜV¬r¬ÜñÁC¢wGWEˆÜV≈ˆÇr¿¢∂Wó3¢tbr¬C¢uír¬F˜V6É¢tÑT¬r¬f#¢udÑT¬r¿¢FˆÊS¢Çí”‚∆ñW"Ê6˜&W2„“∆ñW"Ê÷Ñ6˜&W2Çí“¿¢ÚÚ‚‚ÊÊBFÜRıDÑU"FÜñÊrFÜR6≤&˜VváBÜ˜vÊW"¬##b”í”íì¢FÜR6÷P¢ÚÚfˆ«G2¬ÜV∆BñÁFÚFÜR6∆rñÁ7FVBˆbFÜR6˜&R‚FVváBÜW&R¬ˆ‚FÜR6fP¢ÚÚf∆ˆ˜"¬&V6W6RFÜRV''íñ∆∆"ñ‚FÜR7FˆÊR6fRˆÊ«í'&V∑2FÚ'W'7@¢ÚÚÊB∆ñW"vÜÚÊWfW"∆V&ÊVBFÜRÜˆ∆Bó27GV6≤ñ‚g&ˆÁBˆb&ˆ6≤‡¢≤ñC¢v'W'7Br¬∆&V√¢wGWEˆ'W'7Br¬ÜñÁC¢wGWEˆ'W'7EˆÇr¿¢∂Wó3¢uÇr¬C¢uÇr¬F˜V6É¢tD≤r¬f#¢udD≤r¿¢FˆÊS¢Çí”‚ÑrÁ6fRÊf∆w2bbrÁ6fRÊf∆w2Ê'W'7DFˆÊRí“¿¢≤ñC¢vÊˆFRr¬∆&V√¢wGWEˆÊˆFRr¬ÜñÁC¢wGWEˆÊˆFUˆÇr¬&ˆˆ”¢tr¿¢∂Wó3¢tRr¬C¢t"r¬F˜V6É¢tîÂBr¬f#¢udîÂBr¿¢FˆÊS¢Çí”‚ÑrÁ6fRÊó¬í„““¿¢≤ñC¢w6∂ñ∆¬r¬∆&V√¢wGWE˜6∂ñ∆¬r¬ÜñÁC¢wGWE˜6∂ñ∆≈ˆÇr¿¢∂Wó3¢uBr¬C¢ufñWrr¬F˜V6É¢u4¥îƒ¬r¬f#¢ue4¥îƒ¬r¿¢FˆÊS¢Çí”‚ÑrÁ6fRÁ6∂ñ∆«2bbrÁ6fRÁ6∂ñ∆«2Ê∆VÊwFÇ‚í“¿¢≤ñC¢vvÚr¬∆&V√¢wGWEˆvÚr¬ÜñÁC¢wGWEˆvıˆÇr¿¢∂Wó3¢u«S#ì"r¬C¢tB◊Br¬F˜V6É¢w7Fñ6≤r¬f#¢ÁV∆¬¿¢FˆÊS¢Çí”‚f«6R“¬ÚÚVÊG2'í∆VfñÊrFÜR&ˆˆ–•”∞¶6ˆÁ7BEUEÙƒ5B“EUEı5DU2Ê∆VÊwFÇ“≤ÚÚFÜRvvÚr7FW¬ÊBFÜR˜V‚Fˆ˜ ¢ÚÚ6ˆ÷R∆W76ˆÁ2ÊVVBFÜRv˜&∆BFÚ6ÜÊvR&Vf˜&RFÜWí÷∂RÁí6VÁ6R‡¶gVÊ7Fñˆ‚GWDVÁFW"á7Bí∞¢ñbÇ7B«¬∆ñW"í&WGW&„∞¢ñbá7BÊñB””“vÜV¬rbb∆ñW"Ê6˜&W2„“∆ñW"Ê÷Ñ6˜&W2Çíí∞¢ÚÚDÑRdï%5BÑïB¬Ù‚U%ı4R‚&Wó"6ÊÊ˜B&RFVváBFÚ6ˆ÷V&ˆGíBgV∆¿¢ÚÚÜV«FÉ¢FÜR'WGFˆ‚FˆW2Ê˜FÜñÊr¬ÊB∆W76ˆ‚vÜ˜6RFV÷ˆÁ7G&Fñˆ‚ó2¢ÚÚÊÚ÷˜∆ÊG22Êˆó6R‚6ÚFÜRw&V6≤6ÜRßW7B÷FRFó66Ü&vW2ˆÊ6R(	@¢ÚÚ67&óFVB¬6VBBFÜó26ñÊv∆R6˜&R¬ÊB7FvVBñ‚FÜRˆÊ«í&ˆˆ“ñ‚FÜP¢ÚÚv÷RvÜW&RÊ˜FÜñÊrV«6R6‚áW'BÜW"vÜñ∆R6ÜRv˜&∑2˜WBFÜRÁ7vW"‡¢∆ñW"Ê6˜&W2“÷FÇÊ÷ÇÉ¬∆ñW"Ê6˜&W2“ì∞¢rÊ6˜&Tf∆6Ç“≤ì¢∆ñW"Ê6˜&W2¬C¢„b”∞¢∆ñW"ÊïB“÷FÇÊ÷Çá∆ñW"ÊïB«¬¬„Bì∞¢6“Á6Ü∂R“÷FÇÊ÷ÇÜ6“Á6Ü∂R¬Rì∞¢rÊf∆6Ç“÷FÇÊ÷ÇÑrÊf∆6Ç¬„Rì∞¢6gÇÇváW'Brì∞¢'W'7Bá∆ñW"ÁÇ≤∆ñW"ÁrÚ"¬∆ñW"Áí≤∆ñW"ÊÇÚ"¬#¬r6fcVcfBr¬#3¬„b¬ì¬2¬G'VRì∞¢ñbáGóVˆbD'Wß¢””“vgVÊ7Fñˆ‚ríD'Wß¢Écì∞¢–ß–¢ÚÚtÑBDÑR4Ñï4ï2¬‰BtÖíïB5DıTB4îî‰r'7Fñ6≤"‡¢Ú¢ÚÚFÜR6ÜóÊ÷W2FÜR6ˆÁG&ˆ¬FÜó2∆ñW"7GV∆«íÜ2ñ‚FÜVó"ÜÊG2¬ÊBf˜ ¢ÚÚFÜRv∆∂ñÊr7FW2FÜBv2FÜR∆óFW&¬7G&ñÊr7Fñ6∂(	BvÜñ6Çˆ‚ÜˆÊR6@¢ÚÚÊWáBFÚ%FÜRvFW2ÚFÜR6óGíó27Fñ∆¬7FÊFñÊr¬vÚñ‚"ÊB&VB2v˜&@¢ÚÚÊˆ&ˆGí6∂VBf˜"‚FÜR7Fñ6≤ó2FÜRFÜñÊrVÊFW"FÜR∆ñW"w2∆VgBFáV÷#≤ó@¢ÚÚFˆW2Ê˜BÊVVBÊ÷ñÊr¬óBÊVVG2ÙîÂDî‰r‚Fó&V7Fñˆ‚7FW26Ü˜rFÜR'&˜r‡¶6ˆÁ7BEUEÙDï"“≤÷˜fS¢u«S#ì«S#ì"r¬˜WC¢u«S#ì"r¬vFS¢u«S#ìr¬6ˆñ„¢u«S#ì«S#ì"r¬vÛ¢u«S#ì"r”∞¶gVÊ7Fñˆ‚GWDÜÊBá7Bí∞¢ñbá7BÊ6ˆÁG&ˆ¬í&WGW&‚7BÊ6ˆÁG&ˆ√∞¢ñbÖEUEÙDï%∑7BÊñE“í&WGW&‚EUEÙDï%∑7BÊñE”∞¢ñbáGóVˆbDıT4Ç”“wVÊFVfñÊVBrbbDıT4ÇbbDıT4ÇÊVÊ&∆VBê¢&WGW&‚7BÁf"””“ue4¥îƒ¬rÚ~)ã)kÇr≤BÇw’˜6∂ñ∆«2rí¢7BÁF˜V6É∞¢ñbáGóVˆbB”“wVÊFVfñÊVBrbbBbbBÊˆ‚í∞¢6ˆÁ7B7Fñˆ‚“7BÁf"bb7BÁf"Á6∆ñ6RÉì∞¢ñbÜ7Fñˆ‚bbGóVˆbÜ˜uFÙ˜V‚””“vgVÊ7Fñˆ‚rê¢&WGW&‚Ü˜uFÙ˜V‚Ü7Fñˆ‚¬BÇwÚr≤7Fñˆ‚íì∞¢&WGW&‚7BÁC∞¢–¢&WGW&‚7BÊ∂Wó3∞ß–¢ÚÚFÜRÊWáB7Fñˆ‚¬Ê˜B∆ó7BˆbWfW'óFÜñÊrFÜR∆ñW"vñ∆¬WfVÁGV∆«íFÚ‡¢ÚÚ6Ü˜∆W76ˆ‚˜WG6ñFRFÜRv˜&∑6Ü˜FV6ÜW2UBóG2Fˆ˜"¬FÜV‚R&W6ñFP¢ÚÚFÜR&ˆ&˜BñÁ6ñFR‚∂VWñÊrFÜR6fVB∆W76ˆ‚ñÊFWÇVÊ6ÜÊvVB&W6W'fW2'VÁ2‡¶gVÊ7Fñˆ‚GWE&ˆ◊Bá7Bí∞¢6ˆÁ7BfñWr“≤‚‚Á7B¬F&vWC¢ÁV∆¬¬7Fñˆ„¢á≤ßV◊¢t•T’r¬F≥¢tD≤r¬∂ñ∆√¢tD≤r¬'Wì¢tîÂBr¬ÊˆFS¢tîÂBr¬ÜV√¢tÑT¬r¬'W'7C¢tD≤r¬6∂ñ∆√¢u4¥îƒ¬r“ï∑7BÊñE“«¬t‘ıdRr”∞¢6ˆÁ7B2“∆ñW"ÁÇ≤∆ñW"ÁrÚ#∞¢6ˆÁ7BFˆ˜'2“GóVˆbvFTFˆ˜'2””“vgVÊ7Fñˆ‚rÚvFTFˆ˜'2Çí¢µ”∞¢6ˆÁ7BˆñÁB“áÇ¬í¬6ˆ∆˜"¬&FóW2“3í”‚≤fñWrÁF&vWB“≤Ç¬í¬6ˆ∆˜"¬&FóW2”≤”∞¢6ˆÁ7BFˆ˜%&ˆ◊B“ÜFˆ˜"¬&WGW&ÊñÊrí”‚∞¢6ˆÁ7BÇ“vFUv˜&∆EÇÜFˆ˜"ì∞¢ˆñÁBáÇ¬2¢DîƒR¬r6ffCsfrì∞¢fñWrÁf"“ÁV∆√∞¢fñWrÊ∆&V¬“&WGW&ÊñÊrÚwGWE˜&WGW&‚r¢wGWEˆVÁFW"s∞¢fñWrÊÜñÁB“wGWEˆVÁFW%ˆÇs∞¢fñWrÊ6ˆÁG&ˆ¬“u«S#ìs≤fñWrÊ7Fñˆ‚“uUs∞¢ñbÑ÷FÇÊ'2á2“Çí‚Éí∞¢fñWrÊ6ˆÁG&ˆ¬“2¬ÇÚu«S#ì"r¢u«S#ìs≤fñWrÊ7Fñˆ‚“t‘ıdRs∞¢fñWrÊÜñÁB“&WGW&ÊñÊrÚwGWE˜&WGW&ÂˆÇr¢wGWE˜v˜&∑6Ü˜ˆÇs∞¢ñbÇ&WGW&ÊñÊrífñWrÊ∆&V¬“wGWEˆ&ˆ6Çs∞¢–¢”∞¢ÚÚ&6∑G&6∂ñÊrÊWfW"&WvñÊG2∆W76ˆ‚¬'WBóG2Fó&V7FñˆÁ2◊W7B∆VB&6∞¢ÚÚFÚFÜR&ˆˆ“vÜW&RFÜB∆W76ˆ‚6‚7GV∆«í&R6ˆ◊∆WFVB‡¢6ˆÁ7B&ˆˆ’&WVó&VB“7BÁ&ˆˆ“«¬á7BÊñB””“vßV◊r«¬7BÊñB””“vvFRrÚus"r¢ÁV∆¬ì∞¢ñbá&ˆˆ’&WVó&VBbbrÁ&ˆˆ‘ñB”“&ˆˆ’&WVó&VBbbrÁ&ˆˆ‘ñB””“t"rbbFˆ˜'5≥“í∞¢Fˆ˜%&ˆ◊BÜFˆ˜'5≥“¬G'VRì∞¢&WGW&‚fñWs∞¢–¢6ˆÁ7B7FvR“7BÊñB””“v÷˜fRr«¬7BÊñB””“v˜WBrÚ¢7BÊñB””“vßV◊r«¬7BÊñB””“vvFRrÚ¢#∞¢ñbÖEUEı$ÙÙ’5¥rÁ&ˆˆ‘ñE“¬7FvRí∞¢ñbÇrÁ&ˆˆ‘FVbÊWÜóG2Â"bbFˆ˜'5≥“íFˆ˜%&ˆ◊BÜFˆ˜'5≥“¬f«6Rì∞¢V«6R∞¢ˆñÁBÇÑrÁ&ˆˆ‘FVbÁr“„Rí¢DîƒR¬2¢DîƒR¬r6ffCsfrì∞¢fñWrÊ6ˆÁG&ˆ¬“u«S#ì"s≤fñWrÁf"“ÁV∆√≤fñWrÊ7Fñˆ‚“t‘ıdRs∞¢fñWrÊ∆&V¬“wGWEˆ&ˆ6Çs≤fñWrÊÜñÁB“wGWE˜v˜&∑6Ü˜ˆÇs∞¢–¢&WGW&‚fñWs∞¢–¢ñbá7BÊñB””“v'Wírí∞¢6ˆÁ7BÁ2“ÑrÁ7FFñ72«¬µ“íÊfñÊBá”‚ÁGóR””“vÁ2rbbÊWáG&””“w&F6ÜWBrì∞¢ñbÜÁ2í∞¢ˆñÁBÜÁ2ÁÇ≤Á2ÁrÚ"¬Á2Áí≤Á2ÊÇÚ"¬r6ffCsfrì∞¢ñbáGóVˆbÁ4∆ófR””“vgVÊ7Fñˆ‚rbbÁ4∆ófRÜÁ2íí∞¢fñWrÊ∆&V¬“wGWEˆÊ˜FRs≤fñWrÊÜñÁB“wGWEˆÊ˜FUˆÇs∞¢ñbÜÁ46V∆ƒóFV“ÜÁ2í””“w&F6ÜWD6V∆¬rbbñÁd6˜VÁBÇw&F6ÜWD6V∆¬ríí∞¢6ˆÁ7BG&vW"“ÑrÁ7FFñ72«¬µ“íÊfñÊBá”‚ÁGóR””“v6ÜW7BrbbÊWáG&””“vóC¶&GBrbbÊ˜VÊVBì∞¢ñbÜG&vW"í∞¢ˆñÁBÜG&vW"ÁÇ≤G&vW"ÁrÚ"¬G&vW"Áí≤G&vW"ÊÇÚ"¬r6ffCsfrì∞¢fñWrÊ∆&V¬“wGWEˆ6V∆¬s≤fñWrÊÜñÁB“wGWEˆ6V∆≈ˆÇs∞¢ñbÑrÊÊV"”“G&vW"í∞¢fñWrÊ6ˆÁG&ˆ¬“2¬fñWrÁF&vWBÁÇÚu«S#ì"r¢u«S#ìs≤fñWrÊ7Fñˆ‚“t‘ıdRs≤fñWrÁf"“ÁV∆√∞¢–¢&WGW&‚fñWs∞¢–¢–¢–¢ñbÑrÊÊV"”“Á2í∞¢fñWrÊ6ˆÁG&ˆ¬“2¬fñWrÁF&vWBÁÇÚu«S#ì"r¢u«S#ìs≤fñWrÊ7Fñˆ‚“t‘ıdRs∞¢fñWrÊ∆&V¬“wGWEˆ&ˆ6Çs≤fñWrÊÜñÁB“wGWE˜v˜&∑6Ü˜ˆÇs≤fñWrÁf"“ÁV∆√∞¢–¢“V«6R∞¢6ˆÁ7B&ˆ˜FÇ“Fˆ˜'2ÊfñÊBÜB”‚BÁ7Gñ∆R””“v&ˆ˜FÇrì∞¢ñbÜ&ˆ˜FÇíFˆ˜%&ˆ◊BÜ&ˆ˜FÇ¬f«6Rì∞¢–¢“V«6Rñbá7BÊñB””“v˜WBr«¬7BÊñB””“vvFRr«¬7BÊñB””“vvÚrí∞¢ñbÇrÁ&ˆˆ‘FVbÊWÜóG2Â"bbFˆ˜'5≥“íFˆ˜%&ˆ◊BÜFˆ˜'5≥“¬rÁ&ˆˆ‘ñB””“t"rì∞¢V«6RˆñÁBÇÑrÁ&ˆˆ‘FVbÁr“„Rí¢DîƒR¬2¢DîƒR¬r6ffCsfrì∞¢“V«6Rñbá7BÊñB””“vßV◊rí∞¢ˆñÁBÑrÁ&ˆˆ‘ñB””“us"rÚ2¢DîƒR¢r¢DîƒR≤"¬rÁ&ˆˆ‘ñB””“us"rÚ¢DîƒR¢B¢DîƒR≤"¬r33vffCr¬3Bì∞¢“V«6Rñbá7BÊñB””“vF≤r«¬7BÊñB””“v∂ñ∆¬rí∞¢6ˆÁ7BVÊV◊í“ÑrÊVÊV÷ñW2«¬µ“íÊfñÊBá”‚bbÊFVBì∞¢ñbÜVÊV◊ííˆñÁBÜVÊV◊íÁÇ≤VÊV◊íÁrÚ"¬VÊV◊íÁí≤VÊV◊íÊÇÚ"¬r6fcÜfrì∞¢“V«6Rñbá7BÊñB””“v6ˆñ‚rí∞¢∆WB67&“ÁV∆√∞¢f˜"Ü6ˆÁ7BˆbrÁñ6∑W2«¬µ“ê¢ñbábbÊFVBbbÇ67&«¬÷FÇÊ'2áÁÇ“2í¬÷FÇÊ'2á67&ÁÇ“2ííí67&“∞¢ñbá67&íˆñÁBá67&ÁÇ≤b¬67&Áí≤b¬r6ffCsfr¬#Bì∞¢“V«6Rñbá7BÊñB””“vÊˆFRrí∞¢6ˆÁ7BÊˆFR“ÑrÁ7FFñ72«¬µ“íÊfñÊBá”‚ÁGóR””“w&ñFF∆RrbbÊ˜VÊVBì∞¢ñbÜÊˆFRí∞¢ˆñÁBÜÊˆFRÁÇ≤ÊˆFRÁrÚ"¬ÊˆFRÁí≤ÊˆFRÊÇÚ"¬r63ñffbrì∞¢ñbÑrÊÊV"”“ÊˆFRí∞¢fñWrÊ6ˆÁG&ˆ¬“2¬fñWrÁF&vWBÁÇÚu«S#ì"r¢u«S#ìs≤fñWrÊ7Fñˆ‚“t‘ıdRs∞¢fñWrÊ∆&V¬“wGWEˆ&ˆ6Çs≤fñWrÁf"“ÁV∆√∞¢–¢–¢“V«6Rñbá7BÊñB””“vÜV¬ríˆñÁBá2¬∆ñW"Áí≤∆ñW"ÊÇÚ"¬r6VcvCÇr¬3"ì∞¢ñbÖ≤t•T’r¬tD≤u“ÊñÊ6«VFW2áfñWrÊ7Fñˆ‚íbbGóVˆbGWF˜&ñ≈&VGí””“vgVÊ7Fñˆ‚p¢bbGWF˜&ñ≈&VGíáfñWríbbfñWrÁF&vWBbbÑrÁGWBbbrÁGWBÊÜˆ∆B‚íí∞¢fñWrÊ7Fñˆ‚“t‘ıdRs≤fñWrÊ6ˆÁG&ˆ¬“2¬fñWrÁF&vWBÁÇÚu«S#ì"r¢u«S#ìs∞¢fñWrÊ∆&V¬“wGWEˆ&ˆ6Çs≤fñWrÊÜñÁB“wGWE˜v˜&∑6Ü˜ˆÇs≤fñWrÁf"“ÁV∆√∞¢–¢&WGW&‚fñWs∞ß–¢ÚÚFÜR∆W76ˆÁ2&R5DtTBî‚DÑR$ÙÙ”¢˜V‚w&˜VÊBf˜"FÜRfó'7B¬FÜR7FWf˜ ¢ÚÚFÜR6V6ˆÊB¬ÊB÷6ÜñÊRv∆∂ñÊrBÜW"f˜"FÜRFÜó&B(	BÜV∆BßW7B6Ü˜'Bˆ`¢ÚÚF˜V6ÜñÊr¬&V6W6R∆W76ˆ‚ñ˜R6‚fñ¬ó2Ê˜B∆W76ˆ‚¬óBó2fñváB‡¢ÚÚDÑRƒU54Ù‚5Â2DÖ$TR$ÙÙ’2‰ır¬ÊBvÜñ6ÇfW&"&V∆ˆÊw2FÚvÜñ6Çó2FÜP¢ÚÚvÜˆ∆RˆñÁBˆbFÜR6ÜÊvS¢‘ıdRñ‚FÜR7&F∆R&ˆˆ“¬•T’ˆ‚FÜRv∆≤FÚFÜP¢ÚÚ6óGí¬ÊBWfW'óFÜñÊrFÜBñÁfˆ«fW2÷6ÜñÊRˆ‚FÜRv∂ñÊrf∆ˆ˜"ˆÊ6R6ÜP¢ÚÚ6‚«&VGíFÚ&˜FÇ‚GWF˜&ñ¬FÜBFV6ÜW2ñ˜RFÚVÊ6Ç&Vf˜&RóBFV6ÜW0¢ÚÚñ˜RFÚv∆≤ó2GWF˜&ñ¬w&óGFV‚ñ‚FÜR˜&FW"FÜR6ˆFRv2¬Ê˜BFÜR˜&FW ¢ÚÚFÜR∆ñW"ÊVVG2‡¢Ú¢ÚÚ∆VfñÊrFÜR6Üñ‚f˜'v&BÖs”‚s"”‚íGfÊ6W2óC≤∆VfñÊr$4µt$@¢ÚÚFˆW2Ê˜BVÊBóB¬&V6W6Rv∆∂ñÊr∆VgBFÚ∆ˆˆ≤BFÜR&ˆˆ“ñ˜Rvˆ∂Rñ‚ó0¢ÚÚ7W&ñ˜6óGí¬Ê˜BFV6ó6ñˆ‚FÚ6∂óFÜRGWF˜&ñ¬‡¶6ˆÁ7BEUEı$ÙÙ’2“≤s¢¬s#¢¬¢"¬#¢"”∞¢ÚÚvÜñ6Ç7FW˜VÁ2V6Ç&ˆˆ“w2Fˆ˜"(	B6VRFÜRfVÊ6Rñ‚WFFUGWF˜"Çê¢ÚÚáFÜR&ˆ˜FÇñÁFW&ñ˜"ó2'BˆbFÜRv∂ñÊrf∆ˆ˜"w27FvS¢7FWñÊrñÁFÚó@¢ÚÚ÷ñB÷∆W76ˆ‚◊W7BÊ˜BVÊBFÜRGWF˜&ñ¬ê¶6ˆÁ7BEUEÙDÙı"“≤s¢v˜WBr¬s#¢vvFRr¬¢vvÚr¬#¢vvÚr”∞¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¢ÚÚ4UTTÂDî¬4ÙÂE$Ù≈2Ü˜vÊW"w2˜&FW"ì¢6ˆÁG&ˆ¬FˆW2Ê˜BUÑï5BVÁFñ¬FÜP¢ÚÚ∆W76ˆ‚FÜBFV6ÜW2óB&VvñÁ2‚'WGFˆÁ2V"ˆ‚FÜRF˜V6Ç∆ñ˜WBFÜP¢ÚÚ÷ˆ÷VÁBFÜWí&RÊVVFVBÊBÊ˜B&Vf˜&S≤∂Wó2ÊBB'WGFˆÁ2f˜"VÁFVvá@¢ÚÚfW&'2&RñvÊ˜&VB‚FÜó2ó2VÊf˜&6V÷VÁB¬Ê˜BFV6˜&Fñˆ‚(	BFÜR'VróBVÊG0¢ÚÚó2FÜR∆ñW"ñÁFW&7FñÊrvóFÇFÜRG&FW"&Vf˜&RFÜRfñváB∆W76ˆ‚¬˜VÊñÊp¢ÚÚ6Ü˜vóFÇ¶W&Ú67&¬ÊB&VFñÊrFÜRvÜˆ∆Rv÷R2'&ˆ∂V‚Ç$í6ÊÊ˜@¢ÚÚ&VFVV“ÁóFÜñÊr"í‚tÑTT¬Ù5$U5B&RÊ˜BFVváBñ‚FÜRv∆≤B∆¬¬6ÚFÜWê¢ÚÚ'&ófRvóFÇFÜRFˆ˜"˜WBÇvvÚrí‚÷˜fV÷VÁB¬W6RÊBFÜR÷&RÊWfW ¢ÚÚvFVC¢v∆∂ñÊró2FÜRfó'7B∆W76ˆ‚¬ÊBG&ñÊr∆ñW"VÊ&∆RFÚW6P¢ÚÚó2Ê˜BFV6ÜñÊr‡¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¢ÚÚ•T’ï2‰ıBÙ‚DÑï2ƒï5BÂí‘ı$RÜ˜vÊW"¬##b”Ç”#C¢'7F'BvóFÇFó&V7Fñˆ‡¢ÚÚ6ˆÁG&ˆ∆∆W'2ÊBßV◊g&ˆ“FÜRfW'í&VvñÊÊñÊr"í‡¢Ú¢ÚÚóBv2vFVB&VÜñÊBóG2˜v‚∆W76ˆ‚¬vÜñ6Ç6óG2GvÚ7FW2ñ‚(	BgFW"6ÜRÜ0¢ÚÚv∆∂VBÊBgFW"6ÜRÜ2∆VgBFÜR&ˆˆ“6ÜRvˆ∂Rñ‚‚6ÚFÜRfó'7B÷ñÁWFRˆ`¢ÚÚFÜRv÷RÜÊFVBFÜR∆ñW"7Fñ6≤ÊBÊ˜FÜñÊrV«6R¬ÊBßV◊'WGFˆ‚FÜ@¢ÚÚV&VB∆FW"&VG22FÜRv÷RÜfñÊr&VV‚'&ˆ∂V‚VÁFñ¬FÜV‚&FÜW"FÜ‡¢ÚÚ2∆W76ˆ‚‚v∆∂ñÊrÊBßV◊ñÊr&RFÜRGvÚFÜñÊw2∆ñW"vñ∆¬G'í&Vf˜&P¢ÚÚFÜWí&VBÁóFÜñÊr¬ÊB&˜FÇÊ˜rÁ7vW"g&ˆ“FÜRfó'7Bg&÷R‡¢Ú¢ÚÚFÜRƒU54Ù‚7Fñ∆¬ÜVÁ2vÜW&RFÜW&Ró26ˆ÷WFÜñÊrFÚ6∆V"(	BFÜR7FWñ‚s ¢ÚÚ(	B&V6W6RFV6ÜñÊrfW&"ó2Ê˜BFÜR6÷R2W&÷óGFñÊróB‚vÜB6ÜÊvVBó0¢ÚÚFÜB&W76ñÊrßV◊&Vf˜&RFÜBˆñÁBFˆW2vÜBóB∆ˆˆ∑2∆ñ∂RóB6Ü˜V∆B‡¶6ˆÁ7BEUEıT‰ƒÙ4≤“≤D≥¢vF≤r¬îÂC¢v'Wír¬ÑT√¢vÜV¬r¬4¥îƒ√¢w6∂ñ∆¬r¬tÑTT√¢vvÚr¬5$U5C¢vvÚr¬D4É¢vvÚr¬45C¢vvÚr¬4Ù‰s¢vvÚr¬4ƒs¢vvÚr¬$”¢vvÚr¬5D#¢vvÚr¬%$îC¢vvÚr”∞¶gVÊ7Fñˆ‚GWD∆∆˜w2Ü7Bí∞¢ñbáGóVˆbGWF˜&ñƒ∆∆˜w2””“vgVÊ7Fñˆ‚rí&WGW&‚GWF˜&ñƒ∆∆˜w2Ü7Bì∞¢6ˆÁ7BÊVVB“EUEıT‰ƒÙ4µ∂7E”∞¢ñbÇÊVVBí&WGW&‚G'VS∞¢ñbÇr«¬rÁ6fR«¬rÁGWBí&WGW&‚G'VS∞¢ñbÑrÁ6fRÊf∆w2bbrÁ6fRÊf∆w2ÁGWBí&WGW&‚G'VS∞¢ñbÖEUEı$ÙÙ’5¥rÁ&ˆˆ‘ñE“””“VÊFVfñÊVBí&WGW&‚G'VS∞¢6ˆÁ7BñGÇ“EUEı5DU2ÊfñÊDñÊFWÇá”‚ÊñB””“ÊVVBì∞¢&WGW&‚ñGÇ¬«¬rÁGWBÊí„“ñGÉ∞ß–¢ÚÚFÜR7FWñÊFWÇ¬ñ‚ÊB˜WBˆbFÜR6fR(	B6∆◊VB¬&V6W6R6fRw&óGFV‚'ê¢ÚÚ'Vñ∆BvóFÇ÷˜&R7FW2FÜ‚FÜó2ˆÊR◊W7BÊ˜BñÊFWÇ7BFÜR∆ó7@¶gVÊ7Fñˆ‚GWE&W7F˜&Rá7bí∞¢6ˆÁ7Bí“á7bbb7bÊf∆w2bb7bÊf∆w2ÁGWDíí¬∞¢&WGW&‚÷FÇÊ÷ÇÉ¬÷FÇÊ÷ñ‚ÖEUEÙƒ5B¬ííì∞ß–¶gVÊ7Fñˆ‚GWE6fRá7b¬Bí∞¢ñbÇ7b«¬Bí&WGW&„∞¢ñbÇ7bÊf∆w2í7bÊf∆w2“∑”∞¢ñbÇá7bÊf∆w2ÁGWDí¬í„“BÊíí&WGW&„≤ÚÚˆÊRvì¢ÊWfW"w&óGFV‚&6∑v&G0¢7bÊf∆w2ÁGWDí“BÊì∞¢ñbáGóVˆbW'6ó7B””“vgVÊ7Fñˆ‚ríW'6ó7BÇì∞ß–¶gVÊ7Fñˆ‚WFFUGWF˜"ÜGBí∞¢6ˆÁ7B7b“rÁ6fS∞¢ñbÇ7b«¬∆ñW"«¬∆ñW"ÊFVBí&WGW&„∞¢ñbá7bÊf∆w2bb7bÊf∆w2ÁGWBí&WGW&„∞¢ñbÖEUEı$ÙÙ’5¥rÁ&ˆˆ‘ñE“””“VÊFVfñÊVBí≤ÚÚFÜRvÜˆ∆Rv∂ñÊró2&VÜñÊBÜW ¢ñbá7bÊf∆w2í7bÊf∆w2ÁGWB“∞¢rÁGWB“ÁV∆√≤ñbáGóVˆbDıT4Ç”“wVÊFVfñÊVBrbbDıT4ÇíDıT4ÇÊÜí“ÁV∆√∞¢&WGW&„∞¢–¢ÚÚDÑRƒU54Ù‚ï2Ù‰Rtí¬‰BïBU4TBDÚdı$tUBDÑBÙ‚UdU%í$TƒÙB‡¢Ú¢ÚÚrÁGWB∆ófVBˆÊ«íñ‚÷V÷˜'í‚FÜR6fR6'&ñVBf∆w2ÁGWFf˜"'FÜRvÜˆ∆P¢ÚÚv∆≤ó2&VÜñÊBÜW""ÊBÊ˜FÜñÊrf˜"'6ÜRó2ˆ‚7FW6WfV‚ˆbGvV«fR"(	B6¢ÚÚvR&V∆ˆB¬ÜˆÊRFÜBG&˜VBFÜRF"¬˜"6fRñ6∂VBWBFÜP¢ÚÚ&ˆ˜FÇ7F'FVBg&W6Ç≤ì¢÷ÊBFVváB‘ıdRvñ‚¬FÜV‚ıUB¬FÜV‡¢ÚÚ•T’¬ñ‚FÜR6Ü˜6ÜRÜB«&VGí&˜VváBg&ˆ“‚FÜR˜vÊW#¢%vÜV‚í7F'@¢ÚÚBFÜR6Ü˜¬ív“7F'FñÊrFÜR∆ˆ˜ˆbFV6ÜñÊr∆¬˜fW"vñ‚‚‚‚óBw2¢ÚÚˆÊRFñ÷RFÜñÊr‚"FÜR7FWñÊFWÇó2ñ‚FÜR6fRÊ˜rÜf∆w2ÁGWDíí¬w&óGFV‡¢ÚÚˆ‚WfW'íGfÊ6R¬ÊB'V‚&W7V÷W2ˆ‚FÜR∆W76ˆ‚óBv2ˆ‚‚FÜW&Ró2Ê¢ÚÚví&6≤F˜v‚FÜR∆ó7C¢FÜRñÊFWÇˆÊ«íWfW"w&˜w2‡¢ñbÇrÁGWBírÁGWB“≤ì¢GWE&W7F˜&Rá7bí¬C¢¬Üˆ∆C¢¬FˆÊUC¢”∞¢6ˆÁ7BB“rÁGWC∞¢6ˆÁ7B7B“EUEı5DU5µBÊï”∞¢ÚÚDÑRET‘’í‚6∆“¬6ÚóB6‚ÊWfW"F∂R6˜&RˆfbÜW"¬ÊB7F˜VB6Ü˜'Bˆ`¢ÚÚ&“w2∆VÊwFÇVÁFñ¬FÜR6∆rÜ2&VV‚FVváB(	BFÜV‚óBv∆∑2ñ‚ÊBó2ÜV∆@¢ÚÚFÜW&R¬6∆˜6RVÊ˜VvÇFÚ&Rg&ñváFVÊñÊrÊBFˆÚf"FÚF˜V6Ç‡¢6ˆÁ7BGV““rÊVÊV÷ñW2bbrÊVÊV÷ñW2ÊfñÊBÜR”‚RbbRÊFVBì∞¢ñbÜGV“bbá7bÁ7F˜'ïfW'6ñˆ‚”“"«¬7BÊñB”“v∂ñ∆¬ríí∞¢GV“Ê6∆““G'VS≤GV“ÊáóÊıB“Sì∞¢6ˆÁ7Bv“ÜGV“ÁÇ≤GV“ÁrÚ"í“á∆ñW"ÁÇ≤∆ñW"ÁrÚ"ì∞¢ÚÚÜV∆BB&“w2∆VÊwFÇVÁFñ¬FÜR6∆rÜ2&VV‚FVváB¬FÜV‚∆WB6∆˜6R(	@¢ÚÚ'WBÊWfW"∆WB∆ˆ˜6S¢FÜR∂ñ∆¬7FWvÁG2F&vWB¬Ê˜Bfñvá@¢ñbÖBÊí¬"«¬÷FÇÊ'2Üví¬ìbí≤GV“ÁgÇ“≤GV“Á7FuB“÷FÇÊ÷ÇÜGV“Á7FuB«¬¬„"ì≤–¢“V«6RñbÜGV“bbGV“ÊFó6&∆VBbbGV“Á&W67VVBí∞¢GV“Ê6∆““f«6S≤GV“ÊáóÊıB“∞¢–¢ñbáGóVˆbDıT4Ç”“wVÊFVfñÊVBrbbDıT4Çí∞¢6ˆÁ7B&ˆ◊B“7BbbGWE&ˆ◊Bá7Bì∞¢DıT4ÇÊÜí“á&ˆ◊Bbb&ˆ◊BÁf"bbDıT4ÇÊVÊ&∆VBíÚ&ˆ◊BÁf"¢ÁV∆√∞¢–¢ÚÚDÑRDÙı"tïE2‚Ê˜FÜñÊrÜW&R6‚áW'BÜW"ÊBÊ˜FÜñÊrÜW&R6‚G&ÜW"(	@¢ÚÚ'WBFV6ÜñÊr&ˆˆ“6ÜR6‚v∆≤7G&ñváB˜WBˆbFV6ÜW2ˆÊ«íFÜRfó'7@¢ÚÚfW&"¬vÜñ6Çó2vÜBÜVÊVC¢6ÜR7G&ˆ∆∆VB7BFÜR÷6ÜñÊR6ÜRv2&VñÊp¢ÚÚ6∂VBFÚ67&F6ÇÊBñÁFÚ&ˆˆ“vóFÇ&V¬ˆÊW2‚FÜRví˜WBÜˆ∆G2VÁFñ¿¢ÚÚFÜRFá&VRfW&'2&RFˆÊR¬ÊBFÜV‚˜VÁ2óG6V∆b‡¢ÚÚ‚‚ÊÊBÊ˜rFÜW&R&RDÖ$TRFˆ˜'2¬&V6W6RFÜR∆W76ˆ‚7Á2Fá&VR&ˆˆ◊2‡¢ÚÚV6ÇˆÊRÜˆ∆G2VÁFñ¬FÜR&ˆˆ“óB&V∆ˆÊw2FÚÜ2fñÊó6ÜVBFV6ÜñÊr¬ÊBFÜP¢ÚÚ7FWFÜB˜VÁ2óBó2FÜR7FWFÜB6∑2ÜW"FÚvÚFá&˜VvÇóB(	BvÜñ6Çó0¢ÚÚváí˜WFÊBvFV&R7FW2B∆¬&FÜW"FÜ‚ßW7Bv∆∂ñÊr‡¢Ú¢ÚÚFÜRfVÊ6RW6VBFÚ&R6ñÊv∆RBÊí¬EUEÙƒ5F¬ÊBvóFÇFÜRv∂ñÊr&ˆˆ◊0¢ÚÚñ‚g&ˆÁBˆbFÜBfVÊ6VBÜW"ñÁFÚFÜR7&F∆Rf˜"FÜRvÜˆ∆RGWF˜&ñ√¢FÜP¢ÚÚFˆ˜"˜WBˆbs6˜V∆BÊ˜B˜V‚VÁFñ¬FÜRƒ5B∆W76ˆ‚ñ‚v2FˆÊR¬ñ‚¢ÚÚ&ˆˆ“6ÜR6˜V∆BÊ˜B&V6Ç‚FW7G2ˆ˜VÊñÊrÊ6ß26VváBóB(	B6ÜRv∆∂VBF¢ÚÚÉ”cÊB7F˜VBFÜW&Rf˜&WfW"‡¢6ˆÁ7B˜V‰B“EUEı5DU2ÊfñÊDñÊFWÇá”‚ÊñB””“ÖEUEÙDÙı%¥rÁ&ˆˆ‘ñE“«¬vvÚríì∞¢ñbÜ˜V‰B„“bbBÊí¬˜V‰Bí∞¢6ˆÁ7B∆ñ““ÑrÁ&ˆˆ‘FVbÁr“"„"í¢DîƒR“∆ñW"Ás∞¢ñbá∆ñW"ÁÇ‚∆ñ“í∞¢∆ñW"ÁÇ“∆ñ”≤ñbá∆ñW"ÁgÇ‚í∆ñW"ÁgÇ“∞¢ÚÚ‰B4ÑRï2DÙƒB4ÑRï2$Tî‰rÑTƒB‚FÜR6∆◊W6VBFÚ&R6ñ∆VÁC¢v∆∞¢ÚÚ&ñváB¬7F˜FVBvñÁ7BÊ˜FÜñÊr¬ÊÚ7W'Fñ‚¬ÊÚ6˜VÊB¬ÊÚ&V6ˆ‚(	@¢ÚÚFÜR˜vÊW"w2&W˜'Bv2&Ê˜B6∆V"váíí6‚wBvÚ7BFÜR6Ü˜"‚¢ÚÚÜV∆BFˆ˜"Ü2FÚÁ7vW"vÜV‚ñ˜RW6Çˆ‚óB¬6ÚW6ÜñÊr∆ñváG2FÜP¢ÚÚ7W'Fñ‚ÊB&R◊ˆñÁG2FÜRˆ&¶V7FófR‚BÁW6ÇFV6ó2ñ‚G&uGWF˜"‡¢ñbÜñ‰BÇu$îtÖBríí∞¢ñbÇBÁW6Çí6gÇÇwÜóBrì∞¢BÁW6Ç“∞¢–¢–¢“V«6RñbÖBÊ˜VÊVB”“rÁ&ˆˆ‘ñBí∞¢BÊ˜VÊVB“rÁ&ˆˆ‘ñC≤ÚÚW"$ÙÙ“¬Ê˜BˆÊ6RW"'V‡¢6gÇÇv67Brì≤6“Á6Ü∂R“÷FÇÊ÷ÇÜ6“Á6Ü∂R¬2ì∞¢f˜"Ü∆WBí“≤í¬É≤í≤≤ê¢FE'BÇÑrÁ&ˆˆ‘FVbÁr“„bí¢DîƒR¬¢DîƒR≤&ÊBÉ¬2„B¢DîƒRí¿¢&ÊBÇ”C¬cí¬&ÊBÇ”s¬3í¬&ÊBÉ„B¬„Çí¬r33vffCr¬"„b¬#¬G'VRì∞¢–¢ñbÇ7Bí&WGW&„∞¢BÁB≥“GC∞¢ñbÖBÊÜˆ∆B‚í≤BÊÜˆ∆B”“GC≤ñbÖBÊÜˆ∆B√“í≤BÊí≤≥≤BÁB“≤GWDVÁFW"ÖEUEı5DU5µBÊï“ì≤GWE6fRá7b¬Bì≤“&WGW&„≤–¢∆WBˆ≤“f«6S∞¢G'í≤ˆ≤“7BÊFˆÊRÇì≤“6F6ÇÜRí≤ˆ≤“f«6S≤–¢ÚÚFÜR∆W76ˆ‚ó2ˆÊ«í∆V&ÊVBvÜW&RóBó2FVváBá6VR&ˆˆ÷&˜fRê¢ñbá7BÁ&ˆˆ“bbrÁ&ˆˆ‘ñB”“7BÁ&ˆˆ“íˆ≤“f«6S∞¢ñbÜˆ≤bbBÁB‚„#Rí∞¢BÊÜˆ∆B“„s∞¢6gÇÇwñ6≤rì∞¢'W'7Bá∆ñW"ÁÇ≤∆ñW"ÁrÚ"¬∆ñW"Áí≤B¬"¬r33vffCr¬ì¬„R¬##¬2¬G'VRì∞¢–ß–¶gVÊ7Fñˆ‚G&uGWF˜"Çí∞¢6ˆÁ7B7b“rÁ6fS∞¢ñbÇ7b«¬rÁGWB«¬á7bÊf∆w2bb7bÊf∆w2ÁGWBí«¬∆ñW"«¬rÁ7FFR”“uƒír«¬rÊvFUv∆≤«¬rÊFñ∆ˆr«¬rÊ7WB«¬rÁv∂R«¬rÊ&˜74VÁG'í«¬EUEı$ÙÙ’5¥rÁ&ˆˆ‘ñE“””“VÊFVfñÊVBí&WGW&„∞¢6ˆÁ7BB“rÁGWC∞¢6ˆÁ7B7B“EUEı5DU5µBÊï”∞¢ñbÇ7Bí&WGW&„∞¢6ˆÁ7B&ˆ¶V7EÇ“Ç”‚GóVˆbv˜&∆E67&VVÂÇ””“vgVÊ7Fñˆ‚rÚv˜&∆E67&VVÂÇáÇí¢Ç÷6“ÁÉ∞¢6ˆÁ7B&ˆ¶V7Eí“í”‚GóVˆbv˜&∆E67&VVÂí””“vgVÊ7Fñˆ‚rÚv˜&∆E67&VVÂíáíí¢í÷6“Áì∞¢6ˆÁ7BÇ“&ˆ¶V7EÇá∆ñW"ÁÇ∑∆ñW"ÁrÛ"í¬í“&ˆ¶V7Eíá∆ñW"Áí”"ì∞¢6ˆÁ7B∆V&ÊVB“BÊÜˆ∆B‚∞¢6ˆÁ7BR“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ#cí¢„S∞¢ÚÚDÑRDÑî‰r$Tî‰rDTtÖB¬$î‰tTB‚6&BFÜBÊ÷W2fW&"FV6ÜW2Ê˜FÜñÊrñ`¢ÚÚFÜR∆ñW"6ÊÊ˜B6VRvÜBóBó2&˜WB(	B6ÚFÜR7FWvWG2&ñÊrvÜñ∆RFÜP¢ÚÚßV◊ó2&VñÊrFVváBÊBFÜR÷6ÜñÊRvWG2ˆÊRvÜñ∆RFÜR6∆ró2‡¢6ˆÁ7B÷&≤“áwÇ¬wí¬"¬6ˆ¬í”‚∞¢6ˆÁ7B7Ç“&ˆ¶V7EÇáwÇí¬7í“&ˆ¶V7Eíáwíì∞¢2Á6fRÇì∞¢2Á7G&ˆ∂U7Gñ∆R“6ˆ√≤2Ê∆ñÊUvñGFÇ“"„S≤2Êv∆ˆ&ƒ«Ü“„3R≤R¢„S∞¢2Á6WD∆ñÊTF6ÇÖ≥b¬e“ì≤2Ê∆ñÊTF6Ñˆfg6WB“◊W&f˜&÷Ê6RÊÊ˜rÇíÚs∞¢ñbáGóVˆbG&t÷V6ÜÊñ6≈GWF˜&ñƒ'&˜r””“vgVÊ7Fñˆ‚rbb7Ç„“#bbb7Ç√“ì3Bbb7í„“ìbb7í√“SÉí∞¢2Á6WD∆ñÊTF6ÇÖµ“ì≤G&t÷V6ÜÊñ6≈GWF˜&ñƒ'&˜rá∑ÉßwÇ«ìßwí«&FóW3ß'“ì∞¢“V«6RñbáGóVˆbG&t÷V6ÜÊñ6≈GWF˜&ñƒ'&˜r”“vgVÊ7Fñˆ‚rí∞¢2Ê&VvñÂFÇÇì≤2Ê&2á7Ç«7í«"∑R£2√√rì≤2Á7G&ˆ∂RÇì∞¢–¢2Á6WD∆ñÊTF6ÇÖµ“ì∞¢ÚÚ$î‰rÙdbDÑRTDtRÙbDÑR45$TT‚$î‰u2‰ıDÑî‰r‚FÜRÊˆFRFÜRwFÜñÊ≤p¢ÚÚ7FWˆñÁG2B6óG2FÜó'FVV‚Fñ∆W2&VÜñÊBvÜW&R6ÜR7FÊG2vÜV‚FÜR7FW ¢ÚÚ˜VÁ2(	BFÜR&ñÊrv2G&v‚fóFÜgV∆«í¬f˜W"áVÊG&VBóÜV«2FÚFÜR∆Vg@¢ÚÚˆbFÜRñ7GW&R‚FÜR˜vÊW"¬Gvñ6S¢'ñ˜RßW7B6Ü˜rFÜR&ˆ◊Bˆ‚F˜ˆ`¢ÚÚFÜR6B¬vÜñ6Çó2fW'í6ˆÊgW6ñÊrWfV‚f˜"÷R"‚6ÚvÜV‚FÜRF&vWBó2˜W@¢ÚÚˆbg&÷RFÜR&ñÊrw26ˆ∆˜W"&V6ˆ÷W26ÜWg&ˆ‚ñÊÊVBFÚFÜRÊV&W7BVFvR¿¢ÚÚˆñÁFñÊrFÜRví¬vóFÇFÜRFó7FÊ6RVÊFW"óB‚óBó2FÜRˆÊR◊ví6ñv‚¢ÚÚv∆≤ÊVVG3¢FÜW&Ró2ˆÊ«íWfW"ˆÊRFÜñÊr'VÊr¬ÊBóBó2«vó2ñ‚fñWp¢ÚÚ˜"ˆñÁFVBB‡¢6ˆÁ7B““#c∞¢ñbá7Ç¬◊"«¬7Ç‚ìc≤"«¬7í¬◊"«¬7í‚SC≤"í∞¢6ˆÁ7BWÇ“÷FÇÊ÷ÇÑ“¬÷FÇÊ÷ñ‚Éìc““¬7Çíí¬Wí“÷FÇÊ÷ÇÑ“≤C¬÷FÇÊ÷ñ‚ÉSC“““c¬7ííì∞¢6ˆÁ7BÊr“÷FÇÊF„"á7í“Wí¬7Ç“WÇì∞¢2Êv∆ˆ&ƒ«Ü“„SR≤R¢„CS∞¢2ÁG&Á6∆FRÜWÇ¬Wíì≤2Á&˜FFRÜÊrì∞¢2Êfñ∆≈7Gñ∆R“6ˆ√∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉB≤R¢B¬ì≤2Ê∆ñÊUFÚÇ”Ç¬”ì≤2Ê∆ñÊUFÚÇ”2¬ì≤2Ê∆ñÊUFÚÇ”Ç¬ì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Á&˜FFRÇ÷Êrì∞¢6ˆÁ7BFó7B“÷FÇÁ&˜VÊBÑ÷FÇÊáó˜Bá7Ç“WÇ¬7í“WííÚDîƒRì∞¢2ÊfˆÁB“ssÇ7ó7FV“◊Ví¬6Á2◊6W&ñbs≤2ÁFWáD∆ñv‚“v6VÁFW"s≤2ÁFWáD&6V∆ñÊR“wF˜s∞¢2Êfñ∆≈7Gñ∆R“6ˆ√≤2Êfñ∆≈FWáBÜFó7B≤v“r¬¬bì∞¢–¢2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢”∞¢ÚÚˆÊR÷&∂W"w&VW2vóFÇFÜRˆÊR7Fñˆ‚6&B¬ñÊ6«VFñÊrñÁ6ñFRFÜR&ˆ˜FÇ‡¢6ˆÁ7BF&vWB“GWE&ˆ◊Bá7BíÁF&vWC∞¢ñbáF&vWBí÷&≤áF&vWBÁÇ¬F&vWBÁí¬F&vWBÁ&FóW2¬F&vWBÊ6ˆ∆˜"ì∞¢ÚÚFÜRW6Çf∆&RFV6ó2ˆ‚FÜRv∆¬6∆ˆ6≤(	BFÜó2ó2G&r72ÊBÜ2ÊÚG@¢∞¢6ˆÁ7BÊ˜s"“W&f˜&÷Ê6RÊÊ˜rÇì∞¢6ˆÁ7BV¬“BÁW6ÖBÚ÷FÇÊ÷ñ‚É„"¬ÜÊ˜s"“BÁW6ÖBíÚí¢∞¢BÁW6ÖB“Ê˜s#∞¢BÁW6Ç“÷FÇÊ÷ÇÉ¬ÖBÁW6Ç«¬í“V¬¢„bì∞¢–¢6ˆÁ7B˜V‰C"“EUEı5DU2ÊfñÊDñÊFWÇá”‚ÊñB””“ÖEUEÙDÙı%¥rÁ&ˆˆ‘ñE“«¬vvÚríì∞¢ÚÚDÑR5U%Dî‚$TƒÙ‰u2DÚDÑRÑTƒB4îDRDÙı"¬ÊBFÜRVW7Fñˆ‚ó2vÜWFÜW"FÜP¢ÚÚ&ˆˆ“Ñ2ˆÊR(	BÊ˜BvÜWFÜW"óBÜVÁ2FÚ6ˆÁFñ‚FWFÇFˆ˜"2vV∆¬‡¢Ú¢ÚÚFÜRFW7Bv2tDUı$ÙÙ’¥rÁ&ˆˆ‘ñE÷¬w&óGFV‚FÚ∂VWFÜR7W'Fñ‚˜WBˆbs"¿¢ÚÚvÜ˜6RˆÊ«íví˜WBï2FÜRFWFÇvFR‚'WB6ˆÁFñÁ2FWFÇFˆ˜"(	BFÜP¢ÚÚG&FW"w2&ˆ˜FÇ(	B‰B&ñváB÷ÜÊBWÜóB¬ÊBóBó2FÜR&ñváB÷ÜÊBWÜóBFÜP¢ÚÚGWF˜&ñ¬6∆◊2‚6Úñ‚FÜRˆÊR&ˆˆ“vÜW&RFÜR∆ñW"7VÊG2FÜRvÜˆ∆P¢ÚÚ˜VÊñÊr¬FÜRfVÊ6Rv2ñÁfó6ñ&∆S¢6ÜRv∆∂VB&ñváB¬7F˜VBvñÁ7@¢ÚÚÊ˜FÜñÊr¬ÊBFÜRv÷RÊWfW"6ñBváí‚&ˆˆ“vÜ˜6Rví˜WBó2FÜRvFP¢ÚÚ7Fñ∆¬6∂ó2óC≤&ˆˆ“vóFÇ6ñFRFˆ˜"FÜBó2&VñÊrÜV∆BÊ˜r6Ü˜w2óB‡¢ñbÖBÊí¬˜V‰C"bbrÁ&ˆˆ‘FVbÊWÜóG2bbrÁ&ˆˆ‘FVbÊWÜóG2Â"í∞¢ÚÚFÜRÜV∆BFˆ˜#¢∆ñváB7W'Fñ‚¬Ê˜Bv∆¬(	BóB&VG22&Ê˜BñWB"¿¢ÚÚÊBóBf∆&W2vÜV‚6ÜRW6ÜW2ˆ‚óB6ÚFÜRÁ7vW"'&ófW2vÜV‚6∂VB‡¢6ˆÁ7B'Ç“&ˆ¶V7EÇÇÑrÁ&ˆˆ‘FVbÁr“"„í¢DîƒRì∞¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7B&r“2Ê7&VFT∆ñÊV$w&FñVÁBÜ'Ç“¬¬'Ç≤B¬ì∞¢&rÊFD6ˆ∆˜%7F˜É¬w&v&ÉSR√#SR√#Ç√írì∞¢&rÊFD6ˆ∆˜%7F˜É„R¬w&v&ÉSR√#SR√#Ç¬r≤É„b≤R¢„"≤ÖBÁW6Ç«¬í¢„3BíÁFÙfóÜVBÉ2í≤rírì∞¢&rÊFD6ˆ∆˜%7F˜É¬w&v&ÉSR√#SR√#Ç√írì∞¢2Êfñ∆≈7Gñ∆R“&s∞¢2Êfñ∆≈&V7BÜ'Ç“¬&ˆ¶V7EíÉ„B¢DîƒRí¬#B¬B„b¢DîƒRì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉSR√#SR√#Ç¬r≤É„2≤R¢„2≤ÖBÁW6Ç«¬í¢„BíÁFÙfóÜVBÉ2í≤rís∞¢2Ê∆ñÊUvñGFÇ“„S∞¢f˜"Ü∆WBí“≤í¬S≤í≤≤í∞¢6ˆÁ7Bóí“&ˆ¶V7EíÇÉ„b∂í¢„íí•DîƒRí≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ3≤íí¢3∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜ'Ç“r¬óíì≤2Ê∆ñÊUFÚÜ'Ç≤r¬óíì≤2Á7G&ˆ∂RÇì∞¢–¢2Á&W7F˜&RÇì∞¢–¢6ˆÁ7B&ˆ◊B“GWE&ˆ◊Bá7Bì∞¢GWD6&BáÇ¬í¬GWDÜÊBá&ˆ◊Bí¬Bá&ˆ◊BÊ∆&V¬í¬Bá&ˆ◊BÊÜñÁBí¬∆V&ÊVB¬÷FÇÊ÷ÇÉ¬BÊÜˆ∆BÚ„ríì∞ß–¢ÚÚˆÊR6&B¬W6VB'íFÜRv∂ñÊrf∆ˆ˜"ÊB'íWfW'í˜vW"6ÜRó2ÜÊFVBgFW"ó@¶gVÊ7Fñˆ‚GWD6&BáÇ¬í¬∂Wí¬∆&V¬¬ÜñÁB¬∆V&ÊVB¬fFRí∞¢6ˆÁ7BF˜V6Ç“GóVˆbDıT4Ç”“wVÊFVfñÊVBrbbDıT4ÇÊVÊ&∆VC∞¢6ˆÁ7B∂Wï6ó¶R“F˜V6ÇÚ#b¢#¬FóF∆U6ó¶R“F˜V6ÇÚ#r¢#"¬ÜV«6ó¶R“F˜V6ÇÚ#"¢c∞¢6ˆÁ7BÜVñváB“F˜V6ÇÚÉÇ¢s∞¢2Á6fRÇì∞¢2ÊfˆÁB“ssr≤∂Wï6ó¶R≤wÇ%6VvˆRTí"¬FÜˆ÷¬6Á2◊6W&ñbs∞¢6ˆÁ7B∑r“÷FÇÊ÷ñ‚É#C¬2Ê÷V7W&UFWáBÜ∂WííÁvñGFÇ≤#Çì∞¢2ÊfˆÁB“scr≤FóF∆U6ó¶R≤wÇ%6VvˆRTí"¬FÜˆ÷¬6Á2◊6W&ñbs∞¢6ˆÁ7BFóF∆UvñGFÇ“2Ê÷V7W&UFWáBÜ∆&V¬íÁvñGFÉ∞¢2ÊfˆÁB“sCr≤ÜV«6ó¶R≤wÇ%6VvˆRTí"¬FÜˆ÷¬6Á2◊6W&ñbs∞¢6ˆÁ7B«r“÷FÇÊ÷ÇáFóF∆UvñGFÇ¬2Ê÷V7W&UFWáBÜÜñÁBíÁvñGFÇì∞¢6ˆÁ7Br“÷FÇÊ÷ñ‚ÉsÉ¬÷FÇÊ÷ÇÉ#c¬∑r≤«r≤Síì∞¢6ˆÁ7BÇ“Éìc“ríÚ"¬í“F˜V6ÇÚ¢C3b¬'F¬“ƒ‰r””“v"s∞¢2Êv∆ˆ&ƒ«Ü“∆V&ÊVBÚ÷FÇÊ÷ÇÉ¬fFRí¢∞¢2Êfñ∆≈7Gñ∆R“w&v&Éb√B√#√„ì"ís≤'"Ü2¬Ç¬í¬r¬ÜVñváB¬Çì≤2Êfñ∆¬Çì∞¢6ˆÁ7B∂WïÇ“'F¬ÚÇ≤r“∑r“B¢Ç≤C∞¢2Êfñ∆≈7Gñ∆R“r6SvVFVbs≤'"Ü2¬∂WïÇ¬í≤b¬∑r¬ÜVñváB“3"¬Rì≤2Êfñ∆¬Çì∞¢gGáBÜ∂Wí¬∂WïÇ≤∑rÛ"¬í≤ÜVñváBÛ"≤∂Wï6ó¶R¢„3"¬∂Wï6ó¶R¬r3s#c&Br¬v6VÁFW"r¬ÁV∆¬¬ssrì∞¢6ˆÁ7BFWáEÇ“'F¬Ú∂WïÇ“B¢∂WïÇ≤∑r≤B¬∆ñv‚“'F¬Úw&ñváBr¢v∆VgBs∞¢6ˆÁ7B÷ÖFWáB“r“∑r“CC∞¢2ÊfˆÁB“scr≤FóF∆U6ó¶R≤wÇ%6VvˆRTí"¬FÜˆ÷¬6Á2◊6W&ñbs∞¢6ˆÁ7B∆&V≈6ó¶R“÷FÇÊ÷ñ‚áFóF∆U6ó¶R¬FóF∆U6ó¶R¢÷ÖFWáBÚ÷FÇÊ÷ÇÉ∆2Ê÷V7W&UFWáBÜ∆&V¬íÁvñGFÇíì∞¢gGáBÜ∆V&ÊVBÚu«S#s2r≤∆&V¬¢∆&V¬¬FWáEÇ¬í≤áF˜V6ÇÚ3R¢#íí¬∆&V≈6ó¶R¿¢∆V&ÊVBÚr6&fcVC"r¢r6c6cVcbr¬∆ñv‚¬ÁV∆¬¬scrì∞¢2ÊfˆÁB“sCr≤ÜV«6ó¶R≤wÇ%6VvˆRTí"¬FÜˆ÷¬6Á2◊6W&ñbs∞¢6ˆÁ7BÜñÁE6ó¶R“÷FÇÊ÷ñ‚ÜÜV«6ó¶R¬ÜV«6ó¶R¢÷ÖFWáBÚ÷FÇÊ÷ÇÉ∆2Ê÷V7W&UFWáBÜÜñÁBíÁvñGFÇíì∞¢gGáBÜÜñÁB¬FWáEÇ¬í≤áF˜V6ÇÚcR¢S2í¬ÜñÁE6ó¶R¬r63ÜCVF"r¬∆ñv‚ì∞¢2Á&W7F˜&RÇì∞ß–¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¢ÚÚıtU"îıR4‰‰ıBtı$≤ï2‰ıBıtU"‚WfW'íwV&Fñ‚ÜÊG2˜fW"6ˆ÷WFÜñÊp¢ÚÚÊWr¬ÊBVÁFñ¬Ê˜rFÜRÜÊF˜fW"v2ˆÊR∆ñÊRˆbFWáBñÁ6ñFRFñ∆ˆwVR&˜É†¢ÚÚ&VBóB¬6∆˜6RóB¬ÊB'íFÜRFñ÷RFÜW&Ró2v∆¬v˜'FÇ6∆ñÊvñÊrFÚóBÜ0¢ÚÚ&VV‚f˜&v˜GFV‚‚V6ÇˆÊRÊ˜rFV6ÜW2óG6V∆bFÜR6÷RvíFÜRfó'7BFá&VP¢ÚÚfW&'2FÚ(	BFÜR6ˆÁG&ˆ¬FÜó2∆ñW"Ü2ñ‚FÜVó"ÜÊG2¬vÜBóBó2dı"ñ‡¢ÚÚf˜W"v˜&G2¬ÊBóBvóG2VÁFñ¬FÜWíÜfR7GV∆«íFˆÊRóBˆÊ6R‡¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¶6ˆÁ7B‘ÙEÙƒU54Ù‚“∞¢F6É¢≤f#¢udD4Çr¬∂Wó3¢t2Ú6ÜñgBr¬C¢u$"r¬F˜V6É¢tD4Çr¿¢FˆÊS¢Çí”‚∆ñW"ÊF6ÖB‚“¿¢FßV◊¢≤f#¢ud•T’r¬∂Wó3¢u¢Ú76Rr¬C¢tr¬F˜V6É¢t•T’r¿¢FˆÊS¢Çí”‚∆ñW"Êˆ‚bb∆ñW"Êó$ßV◊2¬ÜÜ56∂ñ∆¬ÇwG&ó∆RríÚ"¢í“¿¢v∆√¢≤f#¢ÁV∆¬¬∂Wó3¢u«S#ì«S#ì"r¬C¢tB◊Br¬F˜V6É¢w7Fñ6≤r¿¢FˆÊS¢Çí”‚∆ñW"Áv∆≈6∆ñFR“¿¢V◊¢≤f#¢ud45Br¬∂Wó3¢ubr¬C¢t"r¬F˜V6É¢t45Br¿¢FˆÊS¢Çí”‚∆ñW"Ê67D4B‚“¿ß”∞¶gVÊ7Fñˆ‚∆W76ˆÂ7F'BÜñBí∞¢ñbÇ‘ÙEÙƒU54ÙÂ∂ñE“í&WGW&„∞¢ñbÑrÁ6fRbbrÁ6fRÊf∆w2bbrÁ6fRÊf∆w5≤v∆W5Úr≤ñE“í&WGW&„∞¢rÊ∆W76ˆ‚“≤ñB¬C¢¬Üˆ∆C¢”∞ß–¶gVÊ7Fñˆ‚WFFT∆W76ˆ‚ÜGBí∞¢6ˆÁ7B¬“rÊ∆W76ˆ„∞¢ñbÇ¬«¬∆ñW"«¬∆ñW"ÊFVBí&WGW&„∞¢6ˆÁ7B““‘ÙEÙƒU54ÙÂ¥¬ÊñE”∞¢ñbÇ“í≤rÊ∆W76ˆ‚“ÁV∆√≤&WGW&„≤–¢ñbáGóVˆbDıT4Ç”“wVÊFVfñÊVBrbbDıT4ÇbbDıT4ÇÊVÊ&∆VBbbrÁGWBíDıT4ÇÊÜí““Áf"«¬ÁV∆√∞¢¬ÁB≥“GC∞¢ñbÑ¬ÊÜˆ∆B‚í∞¢¬ÊÜˆ∆B”“GC∞¢ñbÑ¬ÊÜˆ∆B√“í∞¢ñbÑrÁ6fRÊf∆w2írÁ6fRÊf∆w5≤v∆W5Úr≤¬ÊñE““∞¢rÊ∆W76ˆ‚“ÁV∆√∞¢ñbáGóVˆbDıT4Ç”“wVÊFVfñÊVBrbbDıT4ÇíDıT4ÇÊÜí“ÁV∆√∞¢W'6ó7BÇì∞¢–¢&WGW&„∞¢–¢∆WBˆ≤“f«6S∞¢G'í≤ˆ≤““ÊFˆÊRÇì≤“6F6ÇÜRí≤ˆ≤“f«6S≤–¢ñbÜˆ≤bb¬ÁB‚„2í∞¢¬ÊÜˆ∆B“„∞¢6gÇÇwñ6≤rì∞¢'W'7Bá∆ñW"ÁÇ≤∆ñW"ÁrÚ"¬∆ñW"Áí≤B¬B¬r33vffCr¬#¬„R¬##¬2¬G'VRì∞¢–ß–¶gVÊ7Fñˆ‚G&t∆W76ˆ‚Çí∞¢6ˆÁ7B¬“rÊ∆W76ˆ„∞¢ñbÇ¬«¬∆ñW"«¬rÁ7FFR”“uƒírí&WGW&„∞¢6ˆÁ7B““‘ÙEÙƒU54ÙÂ¥¬ÊñE”∞¢ñbÇ“í&WGW&„∞¢GWD6&BáGóVˆbv˜&∆E67&VVÂÉ””“vgVÊ7Fñˆ‚s˜v˜&∆E67&VVÂÇá∆ñW"ÁÇ∑∆ñW"ÁrÛ"ìß∆ñW"ÁÇ∑∆ñW"ÁrÛ"÷6“ÁÇ¬GóVˆbv˜&∆E67&VVÂì””“vgVÊ7Fñˆ‚s˜v˜&∆E67&VVÂíá∆ñW"Áí”"ìß∆ñW"Áí÷6“Áí¬GWDÜÊBÑ“í¿¢BÇv’Úr≤¬ÊñBí¬BÇv∆W5Úr≤¬ÊñBí¬¬ÊÜˆ∆B‚¬¬ÊÜˆ∆BÚ„ì∞ß–¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚDÑRÖTBu2$U5Dî‰rî4ÙÂ2¬$¥TB‡¢Ú¢ÚÚWfW'íñ6ˆ‚ñ‚FÜR6˜&R&˜ró2FÜR6÷RG&vñÊrWfW'íg&÷RÊBV6ÇˆÊR6˜7G0¢ÚÚ6ÜF˜t&«W"(	BFÜR÷˜7BWáVÁ6ófRW"÷G&r˜W&Fñˆ‚6Áf3$BÜ2¬&V6W6Ró@¢ÚÚó2&V¬vW76ñ‚vóFÇÊÚ&F6ÜñÊr&VÜñÊBóB‚&∂ñÊrFÜV“GW&Á2fñgFVV‡¢ÚÚ&«W'2g&÷RñÁFÚfófRG&tñ÷vR6∆«2ˆbCáÉCÇ7&óFR‡¢Ú¢ÚÚ∂WñVBˆ‚FÜR∂ñÊvFˆ“w2v∆˜r6ˆ∆˜W"2vV∆¬2FÜR6ÜR¬&V6W6RÊv∆˜ró0¢ÚÚvÜBFÜR&«W"ó2FñÁFVBvóFÇÊBóB6ÜÊvW2W"¶ˆÊR(	B66ÜRFÜBñvÊ˜&V@¢ÚÚóBv˜V∆B6''íFÜR÷VF˜w2rFV¬ñÁFÚFÜRf˜VÊG'í‡¶6ˆÁ7BÖTEÙî4Ú“#C≤ÚÚÜ∆b◊6ó¶S¢#Érˆb'B≤&ˆˆ“f˜"‚áÇ&«W ¶6ˆÁ7BáVDñ6Ù66ÜR“∑”∞¶gVÊ7Fñˆ‚7F$ñ6ˆ‚Çí∞¢6ˆÁ7BÜóB“áVDñ6Ù66ÜRÁ7F#∞¢ñbÜÜóB”“VÊFVfñÊVBí&WGW&‚ÜóC∞¢∆WB7b“ÁV∆√∞¢G'í∞¢7b“Fˆ7V÷VÁBÊ7&VFTV∆V÷VÁBÇv6Áf2rì∞¢7bÁvñGFÇ“ÖTEÙî4Ú¢#≤7bÊÜVñváB“ÖTEÙî4Ú¢#∞¢6ˆÁ7BÇ“7bÊvWD6ˆÁFWáBÇs&Brì∞¢ÇÁG&Á6∆FRÑÖTEÙî4Ú¬ÖTEÙî4Úì≤ÇÁ&˜FFRÉ„Rì∞¢ÇÊfñ∆≈7Gñ∆R“TƒT“Á¶óßBÊv∆˜s∞¢ÇÁ6ÜF˜t6ˆ∆˜"“TƒT“Á¶óßBÊ6ˆ√≤ÇÁ6ÜF˜t&«W"“c∞¢ÇÊ&VvñÂFÇÇì∞¢f˜"Ü∆WB≤“≤≤¬C≤≤≤≤í∞¢6ˆÁ7B“≤ÚB¢÷FÇÂí¢#∞¢ÇÊ∆ñÊUFÚÑ÷FÇÊ6˜2Üí¢R„B¬÷FÇÁ6ñ‚Üí¢R„Bì∞¢ÇÊ∆ñÊUFÚÑ÷FÇÊ6˜2Ü≤„3íí¢„í¬÷FÇÁ6ñ‚Ü≤„3íí¢„íì∞¢–¢ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢“6F6ÇÜRí≤7b“ÁV∆√≤–¢áVDñ6Ù66ÜRÁ7F"“7c∞¢&WGW&‚7c∞ß–¶gVÊ7Fñˆ‚ÜV'Dñ6ˆ‚ÜÜW&ÙáVB¬gV∆¬¬v∆˜t6ˆ¬í∞¢6ˆÁ7B∂Wí“ÜÜW&ÙáVBÚvÇr¢w"rí≤ÜgV∆¬Úsr¢srí≤Üv∆˜t6ˆ¬«¬rrì∞¢6ˆÁ7BÜóB“áVDñ6Ù66ÜU∂∂Wï”∞¢ñbÜÜóB”“VÊFVfñÊVBí&WGW&‚ÜóC∞¢∆WB7b“ÁV∆√∞¢G'í∞¢7b“Fˆ7V÷VÁBÊ7&VFTV∆V÷VÁBÇv6Áf2rì∞¢7bÁvñGFÇ“ÖTEÙî4Ú¢#≤7bÊÜVñváB“ÖTEÙî4Ú¢#∞¢6ˆÁ7BÇ“7bÊvWD6ˆÁFWáBÇs&Brì∞¢ÇÁG&Á6∆FRÑÖTEÙî4Ú¬ÖTEÙî4Úì∞¢ñbÜÜW&ÙáVBí∞¢ÇÊfñ∆≈7Gñ∆R“gV∆¬Úr6Cñ#Sfr¢w&v&É√ìÇ√s√„Bís∞¢ñbÜgV∆¬í≤ÇÁ6ÜF˜t6ˆ∆˜"“v∆˜t6ˆ√≤ÇÁ6ÜF˜t&«W"“É≤–¢ÇÊ&VvñÂFÇÇì≤ÇÊ&2É¬”"¬¬¬÷FÇÂí¢"ì≤ÇÊfñ∆¬Çì∞¢ÇÁ6ÜF˜t&«W"“∞¢ñbÜgV∆¬í∞¢ÇÁ7G&ˆ∂U7Gñ∆R“r3Üfc3Çs≤ÇÊ∆ñÊUvñGFÇ“#∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ&2É¬”"¬¬¬÷FÇÂí¢"ì≤ÇÁ7G&ˆ∂RÇì∞¢ÇÊfñ∆≈7Gñ∆R“r6SCÉFbs≤ÇÊ&VvñÂFÇÇì≤ÇÊ&2É¬”"¬B¬¬÷FÇÂí¢"ì≤ÇÊfñ∆¬Çì∞¢–¢“V«6R∞¢ÇÊfñ∆≈7Gñ∆R“gV∆¬Úr6VVc6fr¢w&v&Éì√R√#R√„CRís∞¢ñbÜgV∆¬í≤ÇÁ6ÜF˜t6ˆ∆˜"“v∆˜t6ˆ√≤ÇÁ6ÜF˜t&«W"“É≤–¢'"áÇ¬”¬”Ç¬#¬r¬bì≤ÇÊfñ∆¬Çì∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”í¬”bì≤ÇÊ∆ñÊUFÚÇ”b¬”Rì≤ÇÊ∆ñÊUFÚÇ”¬”rì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÉ¬”rì≤ÇÊ∆ñÊUFÚÉb¬”Rì≤ÇÊ∆ñÊUFÚÉí¬”bì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢ÇÁ6ÜF˜t&«W"“∞¢ñbÜgV∆¬í≤ÇÊfñ∆≈7Gñ∆R“r3C#s≤ÇÊfñ∆≈&V7BÇ”b¬”"¬B¬Bì≤ÇÊfñ∆≈&V7BÉ"¬”"¬B¬Bì≤–¢–¢“6F6ÇÜRí≤7b“ÁV∆√≤“ÚÚÊÚ6Áf2ÜW&S¢f∆¬&6≤FÚG&vñÊr∆ófP¢áVDñ6Ù66ÜU∂∂Wï““7c∞¢&WGW&‚7c∞ß–¶gVÊ7Fñˆ‚G&tÖTBÇí∞¢6ˆÁ7B“≈¥rÁ&ˆˆ‘FVbÁ¶ˆÊU”∞¢6ˆÁ7BFV6ÜñÊr“ÑrÁGWBbbrÁ6fRÊf∆w2ÁGWBì∞¢ÚÚDD4ı%%UDîÙ„¢FÜRvÜˆ∆RÖTB¶óGFW'2¬FV'2ÊB∆ñW2f˜"óG2Ç6V6ˆÊG0¢6ˆÁ7Bv∆óF6ÜVB“ÑrÊáVDv∆óF6ÖB«¬í‚∞¢ñbÜv∆óF6ÜVBí∞¢2Á6fRÇì∞¢2ÁG&Á6∆FRÑ÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇí¢„íí¢2≤&ÊBÇ”"¬"í¬&ÊBÇ”„R¬„Ríì∞¢ñbÜ6ÜÊ6RÉ„"íí2ÁG&Á6∆FRá&ÊBÇ”r¬rí¬ì∞¢–¢ÚÚgV∆¬÷ÜV«FÇ6V∆V'&Fñˆ‚v∆˜r&VÜñÊBFÜR&˜p¢ñbÑrÊ6˜&W4gV∆≈B‚í∞¢2Êv∆ˆ&ƒ«Ü“rÊ6˜&W4gV∆≈C∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉsB√#Cr√#b√„#Rís∞¢'"Ü2¬Ç¬Ç¬∆ñW"Ê÷Ñ6˜&W2Çí¢3≤Ç¬3b¬ì≤2Êfñ∆¬Çì∞¢2Êv∆ˆ&ƒ«Ü“∞¢–¢ÚÚ6˜&W226B÷f6Rñ6ˆÁ2á&ˆ&ÚíÚÜ˜∆óFR6ÜñV∆G2ÜÜW&Úê¢6ˆÁ7BÜW&ÙáVB“GóVˆbó4ÜW&Ú””“vgVÊ7Fñˆ‚rbbó4ÜW&ÚÇì∞¢f˜"Ü∆WBí“≤í¬∆ñW"Ê÷Ñ6˜&W2Çì≤í≤≤í∞¢6ˆÁ7BÇ“#b≤í¢3¬í“#b¬gV∆¬“í¬∆ñW"Ê6˜&W3∞¢6ˆÁ7Bf¬“rÊ6˜&Tf∆6ÇbbrÊ6˜&Tf∆6ÇÊí””“íÚrÊ6˜&Tf∆6ÇÁB¢∞¢ÚÚDÑR$U5Dî‰rÑT%Bï244ÑTBî5EU$R‚÷V7W&VBñ‚FÜRFV„¢G&tÖTBv0¢ÚÚó77VñÊrdîeDTT‚&«W'&VBfñ∆«2g&÷R(	BFá&VRW"ÜV'B¬fófRÜV'G2(	@¢ÚÚÊBWfW'íˆÊRˆbFÜV“G&WrFÜRñFVÁFñ6¬ñ6ˆ‚‚6Áf3$B6ÜF˜t&«W"ó2¢ÚÚW"÷G&r&«W"vóFÇÊÚ&F6ÜñÊr¬6ÚFÜBó2fñgFVV‚vW76ñ‚76W2W ¢ÚÚg&÷R¬f˜&WfW"¬ñ‚WfW'í&ˆˆ“¬FÚ&VG&rñ7GW&RFÜBÊWfW"6ÜÊvW2‡¢ÚÚóBv2#rRˆbWfW'íG&r6∆¬FÜRFV‚÷FR‡¢Ú¢ÚÚ&∂VBˆÊ6RW"Ü∂ñÊB¬gV∆¬¬∂ñÊvFˆ“v∆˜ríÊB&∆óGFVB6ñÊ6R‚FÜRdƒ4Ñî‰p¢ÚÚÜV'B7Fñ∆¬G&w2∆ófR(	BóB66∆W2ÊB6ÜÊvW26ˆ∆˜W"¬ˆÊRÜV'BB¢ÚÚFñ÷R¬ÊB66ÜR∂WñVBˆ‚6ˆÁFñÁV˜W2f«VRó2Ê˜B66ÜR‡¢ñbÜf¬√“í∞¢6ˆÁ7Bñ6Ú“ÜV'Dñ6ˆ‚ÜÜW&ÙáVB¬gV∆¬¬Êv∆˜rì∞¢ñbÜñ6Úí≤2ÊG&tñ÷vRÜñ6Ú¬Ç“ÖTEÙî4Ú¬í“ÖTEÙî4Úì≤6ˆÁFñÁVS≤–¢–¢2Á6fRÇì≤2ÁG&Á6∆FRáÇ¬íì∞¢ñbÜf¬‚í2Á66∆RÉ≤f¬¢„í¬≤f¬¢„íì∞¢ñbÜÜW&ÙáVBí∞¢2Êfñ∆≈7Gñ∆R“f¬‚„#RÚr6fffffbr¢ÜgV∆¬Úr6Cñ#Sfr¢w&v&É√ìÇ√s√„Bírì∞¢ñbÜgV∆¬í≤2Á6ÜF˜t6ˆ∆˜"“f¬‚Úr6ffSñ#r¢Êv∆˜s≤2Á6ÜF˜t&«W"“Ç≤f¬¢#c≤–¢2Ê&VvñÂFÇÇì≤2Ê&2É¬”"¬¬¬÷FÇÂí¢"ì≤2Êfñ∆¬Çì∞¢2Á6ÜF˜t&«W"“∞¢ñbÜgV∆¬í∞¢2Á7G&ˆ∂U7Gñ∆R“r3Üfc3Çs≤2Ê∆ñÊUvñGFÇ“#∞¢2Ê&VvñÂFÇÇì≤2Ê&2É¬”"¬¬¬÷FÇÂí¢"ì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r6SCÉFbs≤2Ê&VvñÂFÇÇì≤2Ê&2É¬”"¬B¬¬÷FÇÂí¢"ì≤2Êfñ∆¬Çì∞¢–¢“V«6R∞¢2Êfñ∆≈7Gñ∆R“f¬‚„#RÚr6fffffbr¢ÜgV∆¬Úr6VVc6fr¢w&v&Éì√R√#R√„CRírì∞¢ñbÜgV∆¬í≤2Á6ÜF˜t6ˆ∆˜"“f¬‚Úr6VcvCÇr¢Êv∆˜s≤2Á6ÜF˜t&«W"“Ç≤f¬¢#c≤–¢'"Ü2¬”¬”Ç¬#¬r¬bì≤2Êfñ∆¬Çì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”í¬”bì≤2Ê∆ñÊUFÚÇ”b¬”Rì≤2Ê∆ñÊUFÚÇ”¬”rì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ¬”rì≤2Ê∆ñÊUFÚÉb¬”Rì≤2Ê∆ñÊUFÚÉí¬”bì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Á6ÜF˜t&«W"“∞¢ñbÜgV∆¬í≤2Êfñ∆≈7Gñ∆R“r3C#s≤2Êfñ∆≈&V7BÇ”b¬”"¬B¬Bì≤2Êfñ∆≈&V7BÉ"¬”"¬B¬Bì≤–¢–¢2Á&W7F˜&RÇì∞¢–¢ÚÚfˆ«BvVvR(	BFÜRÜV¬&"Ü6Ü&vW2g&ˆ“6∆6ÜW2ÊB∂ñ∆«2ê¢ñbÇFV6ÜñÊr«¬ÜV≈VÊ∆ˆ6∂VBÇí«¬∆ñW"Áfˆ«G2‚í∞¢6ˆÁ7BgÇ“3Ç¬gí“cc∞¢6ˆÁ7B6‰ÜV¬“ÜV≈VÊ∆ˆ6∂VBÇíbb∆ñW"Áfˆ«G2„“∆ñW"ÊÜVƒ6˜7BÇíbb∆ñW"Ê6˜&W2¬∆ñW"Ê÷Ñ6˜&W2Çì∞¢6ˆÁ7BáR“„b≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ#Éí¢„C∞¢ñbÜ6‰ÜV¬í∞¢6ˆÁ7Br“2Ê7&VFU&Fñƒw&FñVÁBágÇ¬gí¬"¬gÇ¬gí¬#ì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&ÉsB√#Cr√#b¬r≤„R¢áR≤rírì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&ÉsB√#Cr√#b√írì∞¢2Êfñ∆≈7Gñ∆R“s≤2Ê&VvñÂFÇÇì≤2Ê&2ágÇ¬gí¬#¬¬rì≤2Êfñ∆¬Çì∞¢–¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#√C√c√„Rís≤2Ê∆ñÊUvñGFÇ“c∞¢2Ê&VvñÂFÇÇì≤2Ê&2ágÇ¬gí¬b¬¬rì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“6‰ÜV¬Úr6VcvCÇr¢r6ffCsfs∞¢2Á6ÜF˜t6ˆ∆˜"“2Á7G&ˆ∂U7Gñ∆S≤2Á6ÜF˜t&«W"“6‰ÜV¬Ú"¢c∞¢2Ê&VvñÂFÇÇì≤2Ê&2ágÇ¬gí¬b¬‘÷FÇÂíÚ"¬‘÷FÇÂíÚ"≤á∆ñW"Áfˆ«G2Ú∆ñW"Áfˆ«D÷ÇÇíí¢÷FÇÂí¢"ì≤2Á7G&ˆ∂RÇì∞¢2Á6ÜF˜t&«W"“∞¢gGáBÇ~)™r¬gÇ¬gí≤¬R¬6‰ÜV¬Úr6VcvCÇr¢r6ffCsfrì∞¢ñbÜ6‰ÜV¬í∞¢gGáBÖDıT4ÇbbDıT4ÇÊVÊ&∆VBÚ~)…¢r¢~)…¢br¬gÇ≤#Ç¬gí¬R¬w&v&ÉsB√#Cr√#b¬r≤áR≤rír¬v∆VgBrì∞¢ñbÇrÊÜV≈Fˆ7FVBí≤rÊÜV≈Fˆ7FVB“G'VS≤rÁFˆ7BáBÇvÜV≈ˆÜñÁBríì≤–¢–¢–¢ÚÚ““““7VóBvÜVV√¢vÜBñ˜R&RvV&ñÊr¬ÊBvÜBV«6Rñ˜R6˜V∆BvV ¢6ˆÁ7B6∆˜G2“&’6∆˜G2Çì∞¢ñbá6∆˜G2Ê∆VÊwFÇ‚í∞¢6ˆÁ7B7W"“ÑrÁ6fRÊ&‘ñGÇ«¬íR6∆˜G2Ê∆VÊwFÉ∞¢f˜"Ü∆WBí“≤í¬6∆˜G2Ê∆VÊwFÉ≤í≤≤í∞¢6ˆÁ7B'Ç“CB≤Üí“í¢C"¬'í“Ç¬ˆ‚“í””“7W#∞¢2Á6fRÇì≤2ÁG&Á6∆FRÜ'Ç¬'íì∞¢2Êv∆ˆ&ƒ«Ü“ˆ‚Ú¢„C#∞¢G&t&‘&FvRÜ2¬6∆˜G5∂ï“ÊñB¬ˆ‚Úr¢B¬ˆ‚ì∞¢2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢–¢6ˆÁ7B“6∆˜G5∂7W%”∞¢gGáBÜÚBÇv&’Úr≤ÊñBí¢BÇv&’ˆÊˆÊRrí¬CB¬Cb¬"¬ÚTƒT’∂ÊV≈“Êv∆˜r¢r3vCì6Çr¬v∆VgBrì∞¢ñbÇÖDıT4ÇbbDıT4ÇÊVÊ&∆VBíígGáBÇtrr¬#b¬Ç¬¬r3SCf#vBrì∞¢–¢ÚÚÙ‰R‰T¬¬Ù‰R4≈U5DU"‚FÜR6ˆÊrv«óÇ¬FÜR6áW&ñ∂V‚ó2ÊBFÜVó"∂Wê¢ÚÚÜñÁG2f∆ˆFVB∆ˆ˜6R˜fW"FÜR'BvóFÇÊ˜FÜñÊr&VÜñÊBFÜV“¬ÊBˆ‚F∆¿¢ÚÚÜˆÊRFÜRó&˜r∆ÊG2÷ñB◊67&VV‚(	B6óÇv∆˜vñÊrFñ÷ˆÊG2Ü˜fW&ñÊrñ‚FÜP¢ÚÚv˜&∆B¬vÜñ6Ç&VG226ˆ∆∆V7Fñ&∆W2¬Ê˜B26˜VÁFW"‚6ñÊv∆RFñ“∆FP¢ÚÚFñW2FÜR6˜&ÊW"FˆvWFÜW#¢Tí∆ófW2ˆ‚v∆72¬FÜRv˜&∆BFˆW2Ê˜B‚G&v‡¢ÚÚfó'7B6ÚWfW'óFÜñÊrñ‚FÜR6«W7FW"6óG2ˆ‚óB‡¢ñbÇFV6ÜñÊrí∞¢6ˆÁ7B6’“7F$÷ÇÇì∞¢∞¢6ˆÁ7BÉ“ìb“á6’“í¢R“##∞¢ÚÚƒDR¬‰ıB4ƒ"‚f∆B„C"&∆6≤˜fW"FÜW6R&ˆˆ◊2ó2&V7FÊv∆P¢ÚÚf∆ˆFñÊrˆ‚FÜRv∆¬(	BFÜRfóÇ&VG22Ê˜FÜW"ˆ&¶V7Bñ‚FÜR66VÊR¿¢ÚÚvÜñ6Çó2FÜRfV«BóBv2fóÜñÊr‚fW'Fñ6¬fFRñÁ7FVC¢6ˆ∆ñBVÊ˜VvÄ¢ÚÚ&VÜñÊBFÜRó2FÚF∂RFÜV“˜WBˆbFÜRv˜&∆B¬vˆÊR'íóG2˜v‚VFvW2‡¢6ˆÁ7Br“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬¬¬ìbì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&ÉR√í√R√„Rírì∞¢rÊFD6ˆ∆˜%7F˜É„CR¬w&v&ÉR√í√R√„3Bírì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&ÉR√í√R√„Rírì∞¢2Êfñ∆≈7Gñ∆R“s∞¢'"Ü2¬É¬¬ìS“É¬ìb¬"ì≤2Êfñ∆¬Çì∞¢–¢ÚÚFÜR6ˆÊró2«vó2fñ∆&∆R(	BóBó2ÜW'2¬Ê˜B&˜72w0¢6ˆÁ7B6ˆÊu&VGí“∆ñW"Áfˆ«G2„“4Ù‰uÙ4ı5C∞¢gGáBÇ~)ö¢r¬ì3B¬Ç¬#¬6ˆÊu&VGíÚTƒT“Ê◊W'"Êv∆˜r¢w&v&É#R√Cr√cÇ√„Rír¬w&ñváBrì∞¢ñbÇÖDıT4ÇbbDıT4ÇÊVÊ&∆VBíígGáBÇt"r¬ì3B¬3Ç¬¬6ˆÊu&VGíÚr3ÜfCÜ3Çr¢r3SCf#vBr¬w&ñváBrì∞¢ÚÚ6áW&ñ∂V„¢ó2¬6Úñ˜R6‚&VBFÜR6˜VÁBvóFÜ˜WB&óFÜ÷WFñ0¢6ˆÁ7B62“7F$6˜VÁBÇí¬6““7F$÷ÇÇì∞¢f˜"Ü∆WBí“≤í¬6”≤í≤≤í∞¢6ˆÁ7B'Ç“ìb“í¢R¬ˆ‚“í¬63∞¢ÚÚFÜRÊWáBó6Ü&vW2Wfó6ñ&«í2FÜR7VóB6ˆÊFVÁ6W2ÊWr7F ¢6ˆÁ7B6Ü&vñÊr“ˆ‚bbí””“62bbrÁ7F%&VvVÂB‚∞¢6ˆÁ7B6Ür“6Ü&vñÊrÚ÷FÇÊ÷ñ‚É¬rÁ7F%&VvVÂBÚ5D%ı$TtTÂıBí¢∞¢ÚÚ$U5Dî‰rïï2dïÑTBî5EU$RDÙÚ(	B6÷R&˜FFñˆ‚¬6÷R6ˆ∆˜W"¬6÷P¢ÚÚ&«W"(	BÊBFÜW&R&RWFÚ6óÇˆbFÜV“‚&∂VB∆ñ∂RFÜR6˜&W3≤ˆÊ«íFÜP¢ÚÚˆÊRFÜBó24Ñ$tî‰r7ñÁ2ÊBfFW2¬ÊBˆÊ«íˆÊRWfW"6Ü&vW2BˆÊ6R‡¢ñbÜˆ‚bb6Ü&vñÊrí∞¢6ˆÁ7Bñ6Ú“7F$ñ6ˆ‚Çì∞¢ñbÜñ6Úí≤2ÊG&tñ÷vRÜñ6Ú¬'Ç“ÖTEÙî4Ú¬cB“ÖTEÙî4Úì≤6ˆÁFñÁVS≤–¢–¢2Á6fRÇì≤2ÁG&Á6∆FRÜ'Ç¬cBì≤2Á&˜FFRÉ„R≤Ü6Ü&vñÊrÚ6Ür¢b„#Ç¢íì∞¢2Êfñ∆≈7Gñ∆R“ˆ‚ÚTƒT“Á¶óßBÊv∆˜p¢¢6Ü&vñÊrÚw&v&Éì√#C√#SR¬r≤É„#Ç≤6Ür¢„bíÁFÙfóÜVBÉ"í≤ríp¢¢w&v&É#√C√c√„#Çís∞¢ñbÜˆ‚í≤2Á6ÜF˜t6ˆ∆˜"“TƒT“Á¶óßBÊ6ˆ√≤2Á6ÜF˜t&«W"“c≤–¢ñbÜ6Ü&vñÊrbb6Ür‚„rí≤2Á6ÜF˜t6ˆ∆˜"“TƒT“Á¶óßBÊ6ˆ√≤2Á6ÜF˜t&«W"“R¢6Üs≤–¢2Ê&VvñÂFÇÇì∞¢f˜"Ü∆WB≤“≤≤¬C≤≤≤≤í∞¢6ˆÁ7B“≤ÚB¢÷FÇÂí¢#∞¢2Ê∆ñÊUFÚÑ÷FÇÊ6˜2Üí¢R„B¬÷FÇÁ6ñ‚Üí¢R„Bì∞¢2Ê∆ñÊUFÚÑ÷FÇÊ6˜2Ü≤„3íí¢„í¬÷FÇÁ6ñ‚Ü≤„3íí¢„íì∞¢–¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì≤2Á6ÜF˜t&«W"“≤2Á&W7F˜&RÇì∞¢–¢ñbÇÖDıT4ÇbbDıT4ÇÊVÊ&∆VBíígGáBÇu"r¬ì3B¬Éb¬¬62Úr3ÜfCÜ3Çr¢r3SCf#vBr¬w&ñváBrì∞¢–†¢ÚÚ67&≤∂Ê˜v∆VFvP¢ÚÚÂUB¬‰ıBtT"‚)©í&VG224UEDî‰u2FÚWfW'í∆ñW"∆ófR¬ÊBFÜó0¢ÚÚ6˜VÁFW"ó2÷ˆÊWí(	BFÜRvV"7Fó2vÜW&RóB÷VÁ2FÜRFñÊ∂W"w2G&FRÜÜó0¢ÚÚ6Ü˜6ñv‚ÊBFÜR÷∆VvVÊBí¬ÊWfW"FÜRv∆∆WB‚* "ÊBÊ˜BFÜR	˘JíV÷ˆ¶ì†¢ÚÚ÷V7W&VBñ‚6Áf2¬FÜR&ˆ«B&VÊFW'224ÙƒıU"V÷ˆ¶íFÜBñvÊ˜&W0¢ÚÚfñ∆≈7Gñ∆R¬6ÚFÜR÷ˆÊWí6˜VÁFW"6÷R˜WB6∑í&«VRñ‚‚∆¬÷÷&W"ÖTB‡¢ñbÇFV6ÜñÊr«¬rÁ6fRÊf∆w2Á6u67&«¬rÁ6fRÁ67&‚ê¢gGáBÇ~* "r≤rÁ6fRÁ67&¬sb¬cb¬r¬r6ffCsfr¬v∆VgBr¬ÁV∆¬¬ssrì∞¢ñbÇFV6ÜñÊr«¬rÁ6fRÊó‚ê¢gGáBÇ~)xÇr≤ÑrÁ6fRÊó«¬í≤rr≤BÇw6µˆórí¬sb¬ÉÇ¬2¬r6#CÜ6fbr¬v∆VgBrì∞¢ÚÚ‰Be$Ù“DÑRdï%5BÙîÂBT$‰TB¬4ítÑU$RïBtÙU2(	B%í‰‘R‡¢Ú¢ÚÚFÜó2Ü2&VV‚w&ˆÊrGvñ6R‚fó'7BóBv2Fˆ7B¬vÜñ6Ç67&ˆ∆∆VBvíñ‚Gv¢ÚÚ6V6ˆÊG2÷ñB÷fñváB‚FÜV‚óBv27FÊFñÊr&ˆ◊BFÜB&ñÁFVBFÜR&&R∂Wì†¢ÚÚ.)kÇB"‚∆WGFW"ˆ‚óG2˜v‚ó2Ê˜B‚ñÁ7G'V7Fñˆ‚¬ÊBóBˆÊ«íV&VBˆÊ6P¢ÚÚ6ˆ÷WFÜñÊrv2«&VGíff˜&F&∆R(	B6ÚFÜR∆ñW"vF6ÜñÊr6˜VÁFW"6∆ñ÷ ¢ÚÚg&ˆ“FÚív2Fˆ∆BÊ˜FÜñÊrB∆¬¬ÊBFÜRˆÊRg&÷RFÜBv˜V∆BÜfP¢ÚÚÜV«VBÊWfW"6÷R‡¢Ú¢ÚÚóBÊ˜rÊ÷W2FÜRFˆ˜"¬ÊBóBó2Wg&ˆ“FÜRfó'7BˆñÁC¢FÜR÷ˆ÷VÁB¢ÚÚ6˜VÁFW"7F'G2÷˜fñÊró2FÜR÷ˆ÷VÁBFÜR∆ñW"vÁG2FÚ∂Ê˜rvÜBóBó0¢ÚÚf˜"‚Fñ“vóFÇFÜRF&vWBw26˜7BvÜñ∆R6ÜRó26fñÊs≤∆óBÊBV«6ñÊrFÜP¢ÚÚ÷ˆ÷VÁB6ÜR6‚7VÊB‡¢ñbáGóVˆb6∂ñ∆ƒff˜&F&∆R””“vgVÊ7Fñˆ‚rbbÑrÁ6fRÊó«¬í‚í∞¢6ˆÁ7B&VGí“6∂ñ∆ƒff˜&F&∆RÇì∞¢6ˆÁ7Bvˆ¬“&VGí«¬6∂ñ∆ƒÊWáBÇì∞¢ÚÚÙîÂBBDÑRDÙı"¬‰ıBBDÑRtı$B‚∆ñÊRˆbFWáBÊ÷ñÊr∂WíFV6ÜW0¢ÚÚÊ˜FÜñÊrˆ‚ÜˆÊR¬vÜW&RFÜW&Ró2ÊÚ∂Wí(	BFÜR∆ñW"Ü267&VV‚gV∆¿¢ÚÚˆb'WGFˆÁ2ÊBÊÚ&V6ˆ‚FÚFÜñÊ≤ˆÊRˆbFÜV“ó2FÜRÁ7vW"‚vÜV‚ˆñÁ@¢ÚÚó27GV∆«í5T‰D$ƒRFÜR&ˆ◊BvWG2∆óB∆FR&VÜñÊBóB6ÚóB7F˜0¢ÚÚ&VñÊrÊ˜FÜW"w&Wí∆ñÊRñ‚FÜR6˜&ÊW"¬ÊBFÜR4¥îƒ¬'WGFˆ‚ˆ‚FÜRF˜V6Ä¢ÚÚ∆ñ˜WBó2&ñÊvVB'íFÜR6÷RGWF˜"ÜñvÜ∆ñváBFÜBFV6ÜW2WfW'í˜FÜW ¢ÚÚfW&"‚óB6∆V'2óG6V∆bFÜR÷ˆ÷VÁB6ÜR6‚ÊÚ∆ˆÊvW"ff˜&BÁóFÜñÊr‡¢ñbá&VGíí∞¢6ˆÁ7BS2“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ3#í¢„S∞¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Êv∆ˆ&ƒ«Ü“„b≤S2¢„#∞¢6ˆÁ7BÜr“2Ê7&VFT∆ñÊV$w&FñVÁBÉc¬¬3¬ì∞¢ÜrÊFD6ˆ∆˜%7F˜É¬w&v&Éì√S√#SR√„ÉRírì∞¢ÜrÊFD6ˆ∆˜%7F˜É¬w&v&Éì√S√#SR√írì∞¢2Êfñ∆≈7Gñ∆R“Üs∞¢'"Ü2¬c"¬ìB¬#3Ç¬#¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢ÚÚ‚‚ÊÊBFÜR'WGFˆ‚VÊFW"ÜW"FáV÷"¬ˆ‚FÜR∆ñ˜WBFÜBÜ2ˆÊR‚ÊWfW ¢ÚÚvÜñ∆RFÜRGWF˜&ñ¬ó2'VÊÊñÊs¢FÜBÜñvÜ∆ñváBó2FÜR∆W76ˆ‚w2¬ÊBGv¢ÚÚFÜñÊw26∂ñÊrFÚ&R&W76VBBˆÊ6Ró2v˜'6RFÜ‚ÊVóFÜW"‡¢ñbáGóVˆbDıT4Ç”“wVÊFVfñÊVBrbbDıT4ÇbbDıT4ÇÊVÊ&∆VBbbrÁGWBíDıT4ÇÊÜí“ue4¥îƒ¬s∞¢“V«6RñbáGóVˆbDıT4Ç”“wVÊFVfñÊVBrbbDıT4ÇbbrÁGWBbbDıT4ÇÊÜí””“ue4¥îƒ¬rí∞¢DıT4ÇÊÜí“ÁV∆√∞¢–¢2Êv∆ˆ&ƒ«Ü“&VGíÚ„c"≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ3Éí¢„#Ç¢„S∞¢gGáBÇ~)kÇr≤Ü˜uFÙ˜V‰Ê÷VBÇu4¥îƒ¬r¬BÇw’˜6∂ñ∆«2ríê¢≤á&VGí«¬vˆ¬Úrr¢rr≤ÑrÁ6fRÊó«¬í≤rÚr≤vˆ¬Ê6˜7Bí¿¢sb¬B¬„R¬&VGíÚr6Cñ#Üfbr¢r3Ücvf#r¬v∆VgBrì∞¢2Êv∆ˆ&ƒ«Ü“∞¢“V«6RñbáGóVˆbDıT4Ç”“wVÊFVfñÊVBrbbDıT4ÇbbrÁGWBbbDıT4ÇÊÜí””“ue4¥îƒ¬rí∞¢DıT4ÇÊÜí“ÁV∆√≤ÚÚÊ˜FÜñÊr∆VgBFÚ'Wì¢7F˜ˆñÁFñÊp¢–¢ÚÚÊñÊR÷∆ófW26˜VÁFW ¢ñbÑrÁ6fRÊFñfb””“"ígGáBÇ~)öRr≤Éí“rÁ6fRÊ∆ófW2í≤r(	Br≤BÇv∆ófW5ˆ∆VgBrí¬ì3B¬#b¬R¬r6fcÜcñBr¬w&ñváBrì∞¢ÚÚVFñÚ&∆ˆ6∂VBñÊFñ6F˜"Ü'&˜w6W"Ü6‚wB∆∆˜vVB6˜VÊBñWBê¢ñbÇ2«¬2Á7FFR”“w'VÊÊñÊrrígGáBÇ	˘Hrr¬CÉ¬#b¬Ç¬w&v&É#SR√C2√Sr√„Çírì∞¢ÚÚ&˜72& ¢ñbÜ&˜747FófRÇíbbrÊ&˜72Á7B”“vñÁG&Úrí∞¢6ˆÁ7B"“rÊ&˜72¬r“CÉ∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉÇ√"√Ç√„rís≤'"Ü2¬CÉ“rÚ"¬CìB¬r¬#b¬bì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“Êv∆˜s≤2Êv∆ˆ&ƒ«Ü“„ì∞¢2Êfñ∆≈&V7BÉCÉ“rÚ"≤B¬CìÇ¬ár“Çí¢6∆◊Ü"ÊáÚ"Êá÷Ç¬¬í¬Çì∞¢2Êv∆ˆ&ƒ«Ü“∞¢gGáBÜ&˜74&$Ê÷RÜ"í¬CÉ¬CÉ¬B¬r6VVc6fr¬v6VÁFW"r¬Êv∆˜rì∞¢ÚÚ∆FñÊr6Üñ‚7FGW3¢vÜB6Ü˜'G2FÜó2&˜72w2&÷˜"¬ÊBFÜR˜V‚vñÊF˜p¢ñbÑ$ı55ÙtDU∂"Ê∂ñÊE“í∞¢6ˆÁ7B∂Wí“&‘FVbÑ$ı55ÙtDU∂"Ê∂ñÊE“ì∞¢6ˆÁ7B∂‚“BÇv&’Úr≤∂WíÊñBíÁ7∆óBÇr(	Brï≥”∞¢ñbÇÜ"Á6ÜñV∆EB«¬í‚ê¢gGáBÇ~)∫Çr≤BÇvvFUˆ˜V‚rí≤rr≤÷FÇÊ6Vñ¬Ü"Á6ÜñV∆EBí¬CÉ¬S3B¬"¬TƒT’∂∂WíÊV≈“Êv∆˜r¬v6VÁFW"rì∞¢V«6RñbÇ&˜74vFT˜V‚Ü"íê¢gGáBÇ~)∫Çr≤BÇvvFU˜∆FVBríÁ&W∆6RÇw∂“r¬∂‚í¬CÉ¬S3B¬"¬r3ì66#Br¬v6VÁFW"rì∞¢–¢–¢ÚÚFˆ7G0¢ÚÚDÙ5BBì”CCï2îÂ4îDRDÑRDîƒÙuTR$ıÇ‚$W'&ÊBF∂V‚"v2∆ÊFñÊrˆ‡¢ÚÚF˜ˆbFÜR∆ñÊRFÜRÂ2v26ññÊr(	BGvÚñV6W2ˆbvÜóFRFWáB7F6∂VBñ‚FÜP¢ÚÚ6÷R∆6R¬&˜FÇVÁ&VF&∆R‚Ê˜Fñfñ6Fñˆ‚WÜó7G2FÚ&R&VB¬6ÚóB÷˜fW0¢ÚÚ˜WBˆbFÜRvíˆbvÜFWfW"ÊV¬ó2˜V‚&FÜW"FÜ‚6ˆ◊WFñÊrvóFÇóB‡¢Ú¢ÚÚ‰BïB‰TTE24Ù‘UDÑî‰r$TÑî‰BïB‚&&RvÜóFRFWáB˜fW"FÜRv˜&∆Bó2FWá@¢ÚÚ˜fW"vÜFWfW"ÜVÁ2FÚ&R7FÊFñÊrFÜW&R(	B&W˜'FVB2'FWáBÜñFW2FÜP¢ÚÚ6Ü&7FW'2"¬ÊBG'VRvÜW&WfW"FÜRw&˜VÊBó2∆R˜"fñváBó2ÜVÊñÊr‡¢ÚÚÊ˜Fñfñ6Fñˆ‚ó2Tí¬6ÚóBó2G&v‚2Tì¢÷V7W&VB¬ˆ‚óG2˜v‚∆FR¬Ê@¢ÚÚÊ˜BG&v‚B∆¬˜fW"gV∆¬◊67&VV‚÷VÁRFÜBÜ2óG2˜v‚&VFñÊrFÚFÚ‡¢6ˆÁ7BFˆ7DÜñFFV‚“≤4¥îƒ≈3¢¬5$U5C¢¬$Tƒî53¢¬‘¢¬%$îC¢¬U4S¢¿¢5E$√¢¬4Ñı¢¬E$î√¢¬D4ds¢¬4î‰S¢”∞¢ñbÇFˆ7DÜñFFVÂ¥rÁ7FFU“í∞¢ÚÚ‚‚ÊÊBóB6óG2ñ‚FÜR4µí¬Ê˜Bˆ‚FÜRf∆ˆ˜"‚BCS"Ê˜Fñfñ6Fñˆ‚∆ÊFV@¢ÚÚ7V&V«íˆ‚FÜRw&˜VÊBFÜR∆ñW"ÊBWfW'óFÜñÊráVÁFñÊrÜW"&R7FÊFñÊp¢ÚÚˆ‚(	B∆FR÷∂W2óB∆Vvñ&∆R¬óBFˆW2Ê˜B÷∂RóBvV∆6ˆ÷RFÜW&R‚FÜR&Ê@¢ÚÚVÊFW"FÜRÖTBó2FÜRˆÊR'BˆbFÜRg&÷RFÜBó2V◊Gíñ‚∆÷˜7BWfW'ê¢ÚÚ&ˆˆ“¬ÊBóBó2vÜW&RFÜRWñR«&VGívˆW2f˜"FÜR¶ˆÊRÊ÷R‡¢6ˆÁ7BFˆ7Eí“ÑrÁ7FFR””“tDîƒÙrr«¬rÁ7FFR””“tÙddU"ríÚsÇ¢Cc∞¢rÁFˆ7G2Êf˜$V6ÇÇáGB¬íí”‚∞¢ÚÚ7F6∂VBDıtÂt$Bg&ˆ“FÜR&ÊC¢Wv&Bv∆∂VBFÜV“ñÁFÚFÜR¶ˆÊR&ÊÊW ¢6ˆÁ7B“6∆◊áGBÁB¬¬í¬í“Fˆ7Eí≤í¢3∞¢2ÊfˆÁB“ssWÇ%6VvˆRTí"¬FÜˆ÷¬6Á2◊6W&ñbs∞¢6ˆÁ7Br“÷FÇÊ÷ñ‚ÉÉÉ¬2Ê÷V7W&UFWáBáGBÁFWáBíÁvñGFÇ≤3Bì∞¢2Êv∆ˆ&ƒ«Ü“¢„Éc∞¢2Êfñ∆≈7Gñ∆R“w&v&Éb√√r√„íís∞¢'"Ü2¬CÉ“rÚ"¬í“B¬r¬#Ç¬Çì≤2Êfñ∆¬Çì∞¢2Êv∆ˆ&ƒ«Ü“¢„S∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#√##√#SR√„SRís≤2Ê∆ñÊUvñGFÇ“∞¢'"Ü2¬CÉ“rÚ"¬í“B¬r¬#Ç¬Çì≤2Á7G&ˆ∂RÇì∞¢2Êv∆ˆ&ƒ«Ü“∞¢gGáBáGBÁFWáB¬CÉ¬í¬R¬r6VVc6fr¬v6VÁFW"rì∞¢2Êv∆ˆ&ƒ«Ü“∞¢“ì∞¢–¢ÚÚFÜR¶ˆÊR&ÊÊW"ó2ƒí◊7FFRf∆˜W&ó6É≤˜fW"FÜRW6R÷VÁRóBv2ßW7B¢ÚÚ6V6ˆÊBFóF∆R7&˜76ñÊrFÜRfó'7@¢ñbÑrÁ¶ˆÊUFˆ7BbbrÁ7FFR””“uƒírbbÑrÁGWBbbrÁ6fRÊf∆w2ÁGWBíí∞¢2Êv∆ˆ&ƒ«Ü“6∆◊ÑrÁ¶ˆÊUFˆ7BÁB¬¬ì∞¢gGáBÑrÁ¶ˆÊUFˆ7BÁFWáB¬CÉ¬ì¬3B¬r6VVc6fr¬v6VÁFW"r¬≈¥rÁ&ˆˆ‘FVbÁ¶ˆÊU“Êv∆˜rì∞¢2Êv∆ˆ&ƒ«Ü“∞¢–¢ñbÜv∆óF6ÜVBí∞¢ÚÚFV"&'2ÊB7FFñ2v6Ç˜fW"WfW'óFÜñÊrFÜRÖTBßW7B6∆ñ÷V@¢f˜"Ü∆WBí“≤í¬C≤í≤≤í∞¢ñbÇ6ÜÊ6RÉ„bíí6ˆÁFñÁVS∞¢6ˆÁ7Bwì"“&ÊBÉb¬sí¬vÉ"“&ÊBÉ"¬bì∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉC√#Cb√#SR¬r≤&ÊBÉ„b¬„"í≤rís∞¢2Êfñ∆≈&V7Bá&ÊBÇ”Ç¬Çí¬wì"¬ìc¬vÉ"ì∞¢–¢ñbÜ6ÜÊ6RÉ„2íí∞¢2Êfñ∆≈7Gñ∆R“w&v&É#3√Sr√s√„Çís∞¢2Êfñ∆≈&V7Bá&ÊBÉ¬sí¬&ÊBÉB¬cí¬&ÊBÉc¬#í¬&ÊBÉ2¬ííì∞¢–¢2Á&W7F˜&RÇì∞¢–ß–¶gVÊ7Fñˆ‚∆ñváDBáÇ¬í¬"¬6ˆ∆˜"¬í∞¢ñbÇ6ˆ∆˜"í&WGW&„∞¢ÚÚÑU"4ÑDırƒï5DTÂ2‚WfW'í∆ñváBG&v‚ÊV"ÜW"FÜó2g&÷RW6ÜW2FÜP¢ÚÚ6ˆÁF7B6ÜF˜rvíg&ˆ“óG6V∆b¬vVñváFVB'í7G&VÊwFÇÊB6∆˜6VÊW72(	@¢ÚÚ6ÚFÜR6ÜF˜r∆VÁ2vóFÇFÜR&ˆˆ“w2∆ñváFñÊrñÁ7FVBˆb6óGFñÊrVÊFW ¢ÚÚÜW"∆ñ∂R&ñÁFVBFó62áFÜR˜vÊW"w2WÜ7B6ˆ◊∆ñÁBí‚67V◊V∆FV@¢ÚÚÜW&R¬6ˆ÷÷óGFVBBFÜRVÊBˆbG&t∆ñváG2¬&VBˆÊRg&÷R∆FW"'íFÜP¢ÚÚ∆ñW"w26ÜF˜r(	Bg&÷Rˆb∆rÊÚWñR6‚6VR‡¢ñbáGóVˆb∆ñW"”“wVÊFVfñÊVBrbb∆ñW"bb∆ñW"ÊFVBí∞¢6ˆÁ7BGÇ“∆ñW"ÁÇ≤∆ñW"ÁrÚ"“Ç¬Gí“∆ñW"Áí≤∆ñW"ÊÇ“ì∞¢6ˆÁ7BB“÷FÇÊáó˜BÜGÇ¬Gíì∞¢ñbÜB‚bbB¬"¢„bírÂ˜6ÜD62“ÑrÂ˜6ÜD62«¬í≤ÜGÇÚBí¢Ü«¬„í¢É“BÚá"¢„bíì∞¢–¢6ˆÁ7Br“2Ê7&VFU&Fñƒw&FñVÁBáÇ¬í¬¬Ç¬í¬"ì∞¢rÊFD6ˆ∆˜%7F˜É¬6ˆ∆˜"ì≤rÊFD6ˆ∆˜%7F˜É¬w&v&É√√√írì∞¢2Êv∆ˆ&ƒ«Ü“≤2Êfñ∆≈7Gñ∆R“s∞¢2Êfñ∆≈&V7BáÇ“"¬í“"¬"¢"¬"¢"ì∞ß–¢ÚÚDÑRU$4TÂ4R‚vÜñ∆R6ÜRÜˆ∆G27'ó7F¬∆ñváB(	BFÜRV'&ñVB6Ü&Bˆ‚FÜP¢ÚÚví&6≤¬FÜV‚FÜRf˜&vVB7v˜&B¬FÜV‚FÜR¶ˆñÊVB&∆FR(	BFÜRv˜&∆B6Ü˜w0¢ÚÚóG2∆∆VvñÊ6W2‚6ÜRv∆˜w2Ü∆Ú◊vÜóFS≤Ü˜7Fñ∆R÷6ÜñÊW26''ífñÁ@¢ÚÚW'∆Rv∆˜r¬wV&FñÁ2&VFFó6ÇˆÊR¬ÊBFÜRvˆ∂V‚ÊBFÜRW&ñfñVB¢ÚÚ&«VRˆÊR‚FV∆ñ&W&FV«íTîUBáFÜR˜vÊW#¢&óB6Ü˜V∆F‚wB&Rˆ'fñ˜W2‚óBw0¢ÚÚßW7Bv∆˜r"í(	B∆˜r«Üñ‚FÜRFFóFófR72¬6∆˜r6Ü&VB'&VFÇ¬Ê¢ÚÚ˜WF∆ñÊW2‚FÜRñÊfV7FVB6vW2r&∆6≤÷Ü∆Ú◊vóFÇ÷V÷&W"f&ñÁBÜÊw2ˆfbFÜP¢ÚÚ6÷R6VÁ6RvÜV‚FÜR6vW2∆ÊC≤&∆6≤6ÊÊ˜B&RFFóFófR¬6ÚFÜVó'2vñ∆¿¢ÚÚ&RF&≤&ñÊr72ˆbóG2˜v‚‡¶gVÊ7Fñˆ‚W&6VÁ6RÇí∞¢ñbÇrÁ6fRí&WGW&‚f«6S∞¢6ˆÁ7Bb“rÁ6fRÊf∆w2«¬∑”∞¢&WGW&‚ÜbÊ7'ó7F¬«¬bÊ7'ó7F√"«¬ÑrÁ6fRÊ&rbbrÁ6fRÊ&rÊ76Ü&Bíì∞ß–¶gVÊ7Fñˆ‚G&t∆ñváG2Öí∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢rÂ˜6ÜD62“∞¢ÚÚÜW"&W6VÊ6R∆ñváB(	BFÜR&V6ˆ‚6ÜRó2fñÊF&∆Rñ‚F&≤&ˆˆ“‚óBv2¢ÚÚSÇˆˆ¬6VÁG&VB∆˜rVÊ˜VvÇFÜBóG2&˜GFˆ“Ü∆bñÁFVBFÜRf∆ˆ˜ ¢ÚÚ&VÊVFÇÜW"áFÜR˜vÊW"¬Gvñ6S¢FÜR∆ñváBVÊFW"ÜW"fVWBí‚Ê˜rFñvá@¢ÚÚ&ñ“ˆ‚FÜRWW"&ˆGívÜ˜6Rw&FñVÁBFñW2BÜW"Ê∂∆W3¢6ÜR7Fñ∆¿¢ÚÚ6'&ñW2∆ñváB¬FÜRw&˜VÊBVÊFW"ÜW"6'&ñW2ˆÊ«íÜW"6ÜF˜r‚F6ÇÊ@¢ÚÚÜV¬7Fñ∆¬f∆&RóB(	BFÜ˜6R&R÷ˆ÷VÁG2¬Ê˜B7FÊFñÊr∆◊‡¢ñbá∆ñW"bb∆ñW"ÊFVBê¢∆ñváDBá∆ñW"ÁÇ≤"¬∆ñW"Áí≤"¬Sb¬Êv∆˜r¬„R≤á∆ñW"ÊF6ÖB‚Ú„B¢í≤á∆ñW"ÊÜV≈B‚Ú„"¢íì∞¢rÂˆW&6˜VÁB“∞¢ñbÜW&6VÁ6RÇíbb∆ñW"bb∆ñW"ÊFVBbbrÁ7FFR”“tdîƒ“rí∞¢6ˆÁ7BR“„Ç≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚcCí¢„#∞¢ÚÚFÜRÜ∆Ú&ñFW2ÜW"$ÙEí¬Ê˜BFÜRf∆ˆ˜#¢6VÁG&VBˆ‚ÜW"6ÜW7BB¢ÚÚ&FóW2FÜBFñW2˜WB&˜fRÜW"fVWB¬6ÚFÜR6VÁ6R&VG22v∆˜rˆ‡¢ÚÚÜW"ÊBÊWfW"2∆óBFó626ÜRó27FÊFñÊrˆ‚áFÜR˜vÊW#¢&6ó&7Vó@¢ÚÚˆb∆ñváBVÊFW&ÊVFÇóG2∆Vw2ñÁ7FVBˆbFÜR7GV¬6ÜF˜vñÊr"ê¢∆ñváDBá∆ñW"ÁÇ≤∆ñW"ÁrÚ"¬∆ñW"Áí≤∆ñW"ÊÇ¢„3R¬sB¬r6fffffbr¬„2¢Rì∞¢rÂˆW&6˜VÁB≤≥∞¢f˜"Ü6ˆÁ7BRˆbrÊVÊV÷ñW2í∞¢ñbÜRÊFVBí6ˆÁFñÁVS∞¢ÚÚFÜR6vW26''íFÜVó"ıt‚Ü∆˜3¢&∆6≤◊vóFÇ÷V÷&W"vÜñ∆RñÊfV7FV@¢ÚÚÜG&v‚vóFÇFÜR&ˆGí(	B&∆6≤6ÊÊ˜B&ñFRFÜó2FFóFófR72í¬&«VP¢ÚÚˆÊ6RW&ñfñVB‚6˜VÁFVBÜW&RVóFÜW"ví6ÚFÜR6VÁ6R&VG26ˆ◊∆WFR‡¢ñbÜRÊ∂ñÊB””“w6vRrí∞¢ñbÜRÁF÷Rí∆ñváDBÜRÁÇ≤RÁrÚ"¬RÁí≤RÊÇÚ"¬c¬r3SvÜfbr¬„B¢Rì∞¢rÂˆW&6˜VÁB≤≥∞¢6ˆÁFñÁVS∞¢–¢∆ñváDBÜRÁÇ≤RÁrÚ"¬RÁí≤RÊÇÚ"¬Cb≤÷FÇÊ÷ÇÜRÁr¬RÊÇí¢„B¬r6#ffbr¬„2¢Rì∞¢rÂˆW&6˜VÁB≤≥∞¢–¢ñbÑrÊ&˜72bbrÊ&˜72ÊFVBbbrÊ&˜72Á7B”“vF˜&“rbbrÊ&˜72Á7B”“vñÁG&Úrí∞¢ÚÚF˜&÷ÁBwV&Fñ‚∂VW2óG26V7&WB(	BFÜRÜ∆Ú∆ñváG2vÜV‚ïBv∂W0¢6ˆÁ7BWB“GóVˆbó5WB””“vgVÊ7Fñˆ‚rbbó5WBÑrÊ&˜72ì∞¢∆ñváDBÑrÊ&˜72ÁÇ≤rÊ&˜72ÁrÚ"¬rÊ&˜72Áí≤rÊ&˜72ÊÇÚ"¿¢s≤÷FÇÊ÷ÇÑrÊ&˜72Ár¬rÊ&˜72ÊÇí¢„3R¿¢WBÚr3SvÜfbr¢r6fcVcfBr¬áWBÚ„"¢„Bí¢Rì∞¢rÂˆW&6˜VÁB≤≥∞¢–¢f˜"Ü6ˆÁ7B2ˆbrÁ7FFñ72í∞¢ñbá2ÁGóR”“vÁ2r«¬Á4∆ófRá2íí6ˆÁFñÁVS∞¢∆ñváDBá2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇÚ"¬S"¬r3SvÜfbr¬„"¢Rì∞¢rÂˆW&6˜VÁB≤≥∞¢–¢ÚÚFÜRFV‚w2v˜&≤∆◊¢ˆÊ6R&F6ÜWBó2v∂RÊBBÜó2&VÊ6Ç¬FÜRˆˆ¿¢ÚÚVÊFW"FÜRñÁFñÊrw2ÜÊvñÊr∆◊&V6ˆ÷W2&V¬∆ñváB¬6ÚÜRv˜&∑2∆ó@¢ÚÚñÁ7FVBˆb7FÊFñÊrñ‚FÜR÷&ñVÁBF&≤∆ñ∂R6V6ˆÊB˜vW&VB÷F˜v‚&ˆGê¢ñbÑrÁ&ˆˆ‘ñB””“t"rí∞¢6ˆÁ7B'2“rÁ7FFñ72ÊfñÊBá”‚ÁGóR””“vÁ2rì∞¢ñbá'2bbÁ4∆ófRá'2íí∞¢∆ñváDBÉí„R¢DîƒR¬ÑrÁ&ˆˆ‘FVbÊÇ“2í¢DîƒR¬s¬r6ffC#Ür¬„#Çì∞¢rÂˆW&6˜VÁB≤≥∞¢–¢–¢–¢f˜"Ü6ˆÁ7BˆbrÁ&ˆß2í∆ñváDBáÁÇ¬Áí¬c"¬Ê6ˆ∆˜"¬„Bì∞¢ñbÑrÊ&ˆˆ÷W"í∆ñváDBÑrÊ&ˆˆ÷W"ÁÇ¬rÊ&ˆˆ÷W"Áí¬s"¬r6SÜcFfbr¬„Rì∞¢f˜"Ü6ˆÁ7B2ˆbrÁ7FFñ72í∞¢ñbá2ÁGóR””“wñ∆∆"rí∆ñváDBá2ÁÇ≤2ÁrÚ"¬2Áí≤2ÊÇ¢„B¬#¬r66fSÜfbr¬„Rì∞¢ñbá2ÁGóR””“v&VÊ6Çrí∆ñváDBá2ÁÇ≤2ÁrÚ"¬2Áí¬É¬r6VcvCÇr¬„#"ì∞¢V«6Rñbá2ÁGóR””“v÷ˆBrí∆ñváDBá2ÁÇ≤"¬2Áí≤"¬ì¬Êv∆˜r¬„Bì∞¢V«6Rñbá2ÁGóR””“v6ÜW7Brbb2Ê˜VÊVBí∆ñváDBá2ÁÇ≤2ÁrÚ"¬2Áí≤¬SR¬r6ffCsfr¬„#Çì∞¢–¢ñbÑrÊ&˜72bbrÊ&˜72ÊFVBí∆ñváDBÑrÊ&˜72Ê7ÇÇí¬rÊ&˜72Ê7íÇí¬É¬Êv∆˜r¬„bì∞¢f˜"Ü6ˆÁ7BˆbrÁñ6∑W2íñbáñÁ7FÊ6Vˆb67&í∆ñváDBáÁÇ≤R¬Áí≤R¬#b¬r6ffCsfr¬„2ì∞¢ÚÚ6ˆ÷÷óBFÜó2g&÷Rw2∆ñváBFó&V7Fñˆ‚f˜"ÜW"6ÜF˜rá&VBÊWáBg&÷Rê¢rÂ˜6ÜEÇ“6∆◊ÇÑrÂ˜6ÜD62«¬í¢R¬”¬ì∞¢2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞ß–¶∆WB&∆ˆˆ‘7b“ÁV∆¬¬&∆ˆˆ‘7GÇ“ÁV∆¬¬&∆ˆˆ‘Ù≤“G'VS∞¶gVÊ7Fñˆ‚«î&∆ˆˆ“Ü≤í∞¢ñbÇ&∆ˆˆ‘Ù≤í&WGW&„∞¢ñbáGóVˆbT¬”“wVÊFVfñÊVBrbbT¬Ê&∆ˆˆ“í&WGW&„≤ÚÚFÜRfó'7BFÜñÊrÜˆÊRvófW2W ¢ñbÇ&∆ˆˆ‘7bí∞¢&∆ˆˆ‘7b“Fˆ7V÷VÁBÊ7&VFTV∆V÷VÁBÇv6Áf2rì≤&∆ˆˆ‘7bÁvñGFÇ“3ÉC≤&∆ˆˆ‘7bÊÜVñváB“#c∞¢&∆ˆˆ‘7GÇ“&∆ˆˆ‘7bÊvWD6ˆÁFWáBÇs&Brì∞¢ñbáGóVˆb&∆ˆˆ‘7GÇÊfñ«FW"”“w7G&ñÊrrí≤&∆ˆˆ‘Ù≤“f«6S≤&WGW&„≤–¢–¢ÚÚÑîtÑƒîtÖBUÖE$5DîÙ‚%í5T$î‰r‚6ˆÁG&7B7W'fR∆ñgG2FÜR÷ñB◊FˆÊW0¢ÚÚ∆ˆÊrvóFÇFÜRÜñvÜ∆ñváG2¬6Ú&∆ˆˆ÷ñÊrFá&˜VvÇˆÊRv6ÜW2FÜRvÜˆ∆Rg&÷P¢ÚÚñ‚Ü¶R‚G&vñÊrFÜRg&÷R˜fW"óG6V∆bvóFÇ◊V«Fó«í7V&W2WfW'í6ÜÊÊV¿¢ÚÚñÁ7FVC¢'&ñváBóÜV¬B„í7Fó2„ÉÊB÷ñBB„2f∆«2FÚ„í¿¢ÚÚvÜñ6Ç∆VfW2ˆÊ«ívÜBó2vVÁVñÊV«íV÷óGFñÊr(	BFÜR˜W"¬ÜW"fó6˜"¬FÜP¢ÚÚ7'ó7F¬6V◊2(	BFÚ&∆VVB‡¢&∆ˆˆ‘7GÇÊfñ«FW"“vÊˆÊRs∞¢&∆ˆˆ‘7GÇÊv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“w6˜W&6R÷˜fW"s∞¢&∆ˆˆ‘7GÇÊ6∆V%&V7BÉ¬¬3ÉB¬#bì∞¢&∆ˆˆ‘7GÇÊG&tñ÷vRÜ7b¬¬¬3ÉB¬#bì∞¢&∆ˆˆ‘7GÇÊv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v◊V«Fó«ís∞¢&∆ˆˆ‘7GÇÊG&tñ÷vRÜ7b¬¬¬3ÉB¬#bì∞¢&∆ˆˆ‘7GÇÊv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“w6˜W&6R÷˜fW"s∞¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s≤2Êv∆ˆ&ƒ«Ü“„3B¢Ü≤”“ÁV∆¬Ú¢≤ì∞¢2Êfñ«FW"“v&«W"ÉWÇís∞¢2ÊG&tñ÷vRÜ&∆ˆˆ‘7b¬¬¬ìc¬SCì∞¢2Êfñ«FW"“vÊˆÊRs∞¢2Á&W7F˜&RÇì∞¢2Êv∆ˆ&ƒ«Ü“∞ß–¶gVÊ7Fñˆ‚G&uv˜&∆Dg&÷RÇí∞¢6ˆÁ7B“≈¥rÁ&ˆˆ‘FVbÁ¶ˆÊU”∞¢G&t$rÖ¬6“ÁÇ¬6“Áíì∞¢ÚÚFÜR&ˆˆb¬&Vf˜&RFÜRFñ∆W3¢óBó2FÜRf"v∆¬ˆbFÜR&ˆˆ“w2F˜¬Ê@¢ÚÚÁóFÜñÊr6ˆ∆ñBFÜR∆WfV¬7GV∆«í'Vñ«BWFÜW&R6Ü˜V∆Bˆ66«VFRóB‡¢ÚÚ‚îÂDU$îı"Ñ2ïE2ıt‚$ÙÙb¬î‚ïE2ıt‚îÂDî‰r‚FÜR∂ñÊvFˆ“w26Vñ∆ñÊp¢ÚÚ∆FRó267&ñ&BvÁG'íáVÊrˆ‚&∆∆Ç¬ÊBóBv2G&vñÊr˜fW"FÜP¢ÚÚG&FW"w2FV‚FˆÚ(	B÷6ÜñÊR◊ñ&B&ˆˆb7G&WF6ÜVB7&˜72v˜&∑6Ü˜FÜ@¢ÚÚ«&VGíÜ2&gFW'2ñÁFVBñÁFÚóB‚FÜBó2Ü∆bˆb'FÜR&6∂w&˜VÊBFˆW0¢ÚÚÊ˜B&∆VÊBvóFÇFÜRóFV◊2ñ‚óB#¢GvÚFñffW&VÁB6Vñ∆ñÊw2ñ‚ˆÊR&ˆˆ“‡¢ÚÚ‚‚‰‰BDÑRıT‚ï"Ñ2‰Ú$ÙÙbBƒ¬‚6∑í&ˆˆ“Üß2˜v˜&∆BÊß26∑î∆ñBê¢ÚÚÜÊw2ÊÚ∂ñÊvFˆ“∆FS¢FÜRfó7Fw2˜v‚6∑íó2vÜBó2WFÜW&R¬FÜR6÷P¢ÚÚví6V“w2&˜VÊF'íó2ÊÚv∆¬B∆¬‚ñÊFˆ˜'2∂VW2óG2&gFW'2¬6fW0¢ÚÚ∂VWFÜVó"&ˆ6≤¬ÊBFÜRÜW&Úw2v˜&∆BÊWfW"ÜBFÜR∆FRFÚ&Vvñ‚vóFÇ‡¢ñbÇáGóVˆbó4ÜW&Ú””“vgVÊ7Fñˆ‚rbbó4ÜW&ÚÇííbbÑrÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÊñÊFˆ˜"ê¢bbÑrÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÁ6∑ííê¢G&t6Vñ∆ñÊrÑrÁ&ˆˆ‘FVbÁ¶ˆÊRì∞¢ÚÚ%EÙ$î$ƒR*sí„¸*sí„B(	BDÑR$4¥u$ıT‰B52‚WfW'óFÜñÊrG&v‚6Úf"ó2FÜP¢ÚÚf"∆ÊR¬ÊBFÜó2ó2FÜRˆÊ«í÷ˆ÷VÁBóB6‚&Rw&FVB∆ˆÊS¢gFW"óB¿¢ÚÚFÜRFW'&ñ‚ÊBFÜR67B∆ÊBˆ‚F˜ÊBgV∆¬÷g&÷Rv6Ç6‚ÊÚ∆ˆÊvW ¢ÚÚFV∆¬FÜV“'B‚÷V7W&VB&Vf˜&RFÜó2WÜó7FVB¬WfW'í&ˆˆ“&VBbÛbÛ¢ÚÚ7&˜72f"ˆ÷ñBˆÊV"(	BfófRˆñÁG2ˆb&ÊvRñ‚FÜRvÜˆ∆Rñ7GW&R(	BÊBFÜP¢ÚÚ&6∂w&˜VÊB6÷R&6≤‘ı$R6GW&FVBFÜ‚FÜR∆ÊRFÜR∆ñW"7FÊG2ˆ‚‡¢ÚÚW6ÜñÊrFÜR&6∂w&˜VÊBF˜v‚ÊBFÜR6á&ˆ÷˜WBˆbóBó2vÜB'Wó2FÜP¢ÚÚFWFÇFÜR6ñÊv∆RVÊB÷ˆb÷g&÷Rv6ÇÊWfW"6˜V∆B‡¢&u∆ÊU72Çì∞¢ÚÚDÑRƒ‰R$Ù$R(	BFÜR÷V7W&V÷VÁBÜˆˆ≤f˜"%EÙ$î$ƒR*sí„¸*sí„B¬ÊBFÜP¢ÚÚ&V6ˆ‚óBWÜó7G2ó2FÜBFÜRˆ'fñ˜W2FW7Bó2w&ˆÊr‚6◊∆ñÊrFÜRF˜FÜó&@¢ÚÚˆbFÜRg&÷R2&f""ˆÊ«ív˜&∑2ñbÜVñváB6˜'&V∆FW2vóFÇFWFÉ≤ÜW&RFÜP¢ÚÚ&6∂G&˜ó2v∆¬fñ∆∆ñÊrFÜRg&÷RBWfW'íÜVñváB¬6Ú&ÊBFW7@¢ÚÚ÷V7W&W2fW'Fñ6¬6ˆ◊˜6óFñˆ‚ÊB6∆«2óBFWFÇ‚DÑï2ó2FÜRˆÊ«íñÁ7FÁ@¢ÚÚFÜR&6∂w&˜VÊBWÜó7G2∆ˆÊRˆ‚FÜR6Áf2¬6ÚóBó2FÜRˆÊ«íÜˆÊW7B∆6P¢ÚÚFÚ÷V7W&RóB‚ˆfbVÊ∆W72Ü&ÊW726∑3¢óB6˜7G2gV∆¬&VF&6≤‡¢ñbÑrÁ∆ÊU&ˆ&RírÁ∆ÊU&ˆ&RÊ&r“g&÷U∆ÊU7FG2Çì∞¢ÚÚDÑR‘îBƒDRï2‰ıBE$t‚‚óBv2FÜR6V6ˆÊBf∆ˆ˜#¢w&˜VÊB÷∆WfV¬w&V6∞¢ÚÚfñV∆BvóFÇóG2˜v‚&ñ¬'V‚ÊBw&˜VÊBVFvR¬6ÚvÜW&WfW"óBv2∆6VBó@¢ÚÚ&VB2f∆ˆ˜"¬ÊBFÜR∆ñW"6˜V∆BÊ˜BFV∆¬vÜñ6ÇˆbFÜRGvÚv2ÜW'2‡¢ÚÚW6ÜñÊróB&6≤(	BÜ∆b&∆∆Ç¬Fñ÷÷VB¬∆ñgFVB6∆V"ˆbÜW"∆ñÊR(	BÜV«V@¢ÚÚÊBFñBÊ˜BfóÇóB¬&V6W6RFÜR∆FRDUî5E2w&˜VÊBÊBFWñ7FVBw&˜VÊ@¢ÚÚ∆ñÊR6ˆ◊WFW2BÁíFó7FÊ6R‡¢Ú¢ÚÚFÜR'V∆RóB'&V∑2ó2&˜WBFWFÇ¬Ê˜B&˜WB'C¢FW'&ñ‚÷∆ñ∂R6ÜW2÷ê¢ÚÚÊ˜B6óBBFÜR∆ñW"w2∆ÊR‚FÜR∆FW27Fíñ‚FÜR&WÚ¬∂WñVBÊ@¢ÚÚ&6ÜófVC≤Fó7FÁBw&V6≤fñV∆B&V∆ˆÊw2ñ‚G&t$rvóFÇFÜR6∑ñ∆ñÊR¬Ê@¢ÚÚFÜBó2vÜW&RóB6Ü˜V∆B&WGW&‚‚FÜRÊV"∆FR7Fó2(	Bf˜&Vw&˜VÊ@¢ÚÚˆ66«VFW"7&˜76W2î‚e$ÙÂBˆbÜW"ÊB6‚ÊWfW"&R÷ó7F∂V‚f˜"fˆ˜FñÊr‡¢2Á6fRÇì∞¢2ÁG&Á6∆FRÇ‘÷FÇÁ&˜VÊBÜ6’5ÇÇíí¬‘÷FÇÁ&˜VÊBÜ6’5íÇííì∞¢G&t∆ó"Çì≤ÚÚ&VÜñÊBFÜR∆WfV¬(	B6VRFÜRƒï"F&∆P¢G&u&ˆˆ’&˜Çì≤ÚÚFÜR7&F∆R¬FÜRvFW2(	B6VR$ÙÙ’ı$ı ¢G&tf∆˜&Çì≤ÚÚ‚‚ÊÊBvÜBw&˜w2ñ‚óB(	B6VRdƒı$¢ñbáFñ∆TFó'Gíí&VÊFW%Fñ∆T∆ñW"Öì∞¢ÚÚ*sí„(	BFÜR∆ñ&∆R∆ÊRó2FÜRDîƒRƒîU"¬Ê˜BFÜR&˜GFˆ“FÜó&BˆbFÜP¢ÚÚ67&VV‚‚÷V7W&ñÊr67&VV‚&ÊB6∆∆VBFÜRf∆ˆ˜"&ÊV""vÜñ∆RóBv0¢ÚÚ÷˜7F«í&6∂G&˜¬ÊB&W˜'FVBÊVvFófRFV«Ff˜"g&÷RFÜBÜBßW7@¢ÚÚ&VV‚6˜'&V7F«í6W&FVB‚FÜRFW'&ñ‚ó26Áf2ˆbóG2˜v„≤÷V7W&RóB‡¢ñbÑrÁ∆ÊU&ˆ&RbbrÁ∆ÊU&ˆ&RÊ÷ñBírÁ∆ÊU&ˆ&RÊ÷ñB“∆ñW%7FG2áFñ∆T7bì∞¢2Á6fRÇì∞¢ñbÑrÁ&ˆˆ‘FVbÊ6fRó∂2Á6ÜF˜t6ˆ∆˜#“w&v&ÉB√R√√„Çís∂2Á6ÜF˜t&«W#”ì∂2Á6ÜF˜tˆfg6WEì”C∑–¢2ÊG&tñ÷vRáFñ∆T7b¬¬ì∞¢2Á&W7F˜&RÇì∞¢G&tñÁFW&ñ˜$f∆ˆ˜"Çì≤ÚÚñÁFñÊr◊&ˆˆ“v∆∑2ˆ‚FÜRñÁFñÊrw2f∆ˆ˜ ¢G&tg&ˆÁFñW"Çì≤ÚÚFÜRÊWáB∂ñÊvFˆ“¬6VV‚g&ˆ“FÜR∆7B&ˆˆ–¢ÚÚÉÜ&F∆ñváB'&ñFvS¢∆ófRvÜñ∆RFÜR&˜v∆W"7FÊG2¬&VBÊBf∆ñ6∂W&ñÊp¢ÚÚFá&˜VvÇFÜR6ˆ∆∆6R¬vˆÊRvÜV‚FÜRw&V6≤6WGF∆W0¢ñbÑrÁ&ˆˆ‘ñB””“uÉrbbrÁÉ'&ñFvRbbrÊ&˜72bbÇrÊ&˜72ÊFVB«¬ÑrÊ&˜72ÊFVFÑÊñ’B«¬í‚íí∞¢6ˆÁ7BGññÊr“rÊ&˜72ÊFVC∞¢6ˆÁ7BF„"“W&f˜&÷Ê6RÊÊ˜rÇì∞¢6ˆÁ7Bf¬“GññÊrÚ„CR≤÷FÇÁ6ñ‚áF„"Ú3Çí¢„2¢„r≤÷FÇÁ6ñ‚áF„"Ú3í¢„S∞¢6ˆÁ7B6ˆ¬“GññÊrÚr6fcVcfBr¢r33vffCs∞¢6ˆÁ7B'É“b¢DîƒR¬'s"“2¢DîƒR¬'ì“R¢DîƒS∞¢2Á6fRÇì∞¢ÚÚV÷óGFW"˜7G2B&˜FÇVÊG0¢2Êfñ∆≈7Gñ∆R“r3&33Çs∞¢2Êfñ∆≈&V7BÜ'É“b¬'ì“B¬Ç¬"ì≤2Êfñ∆≈&V7BÜ'É≤'s"“"¬'ì“B¬Ç¬"ì∞¢ÚÚÜ&F∆ñváB6∆G0¢2Êv∆ˆ&ƒ«Ü“f√∞¢2Êfñ∆≈7Gñ∆R“6ˆ√≤2Á6ÜF˜t6ˆ∆˜"“6ˆ√≤2Á6ÜF˜t&«W"“#∞¢f˜"Ü∆WBí“≤í¬c≤í≤≤ê¢2Êfñ∆≈&V7BÜ'É≤2≤í¢Ü's"“bíÚb¬'ì¬Ü's"“bíÚb“2¬Rì∞¢2Á6ÜF˜t&«W"“∞¢2Êv∆ˆ&ƒ«Ü“f¬¢„C∞¢2Êfñ∆≈&V7BÜ'É¬'ì≤R¬'s"¬"ì∞¢2Á&W7F˜&RÇì∞¢–¢ÚÚC2∂W&ÊV¬6V¬ÜGñÊ÷ñ2¬G&v‚˜fW"FÜR66ÜVBFñ∆W2ê¢ñbÑrÁ&ˆˆ‘ñB””“tC2rbbrÁ6fRÊf∆w2Ê&˜75¶W&Úí∞¢6ˆÁ7B7R“„R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ3í¢„#∞¢2Êfñ∆≈7Gñ∆R“w&v&É##B√ì√#SR¬r≤É„2¢7R≤„#Rí≤rís∞¢2Êfñ∆≈&V7BÉR¢DîƒR¬R¢DîƒR¬2¢DîƒR¬"¢DîƒRì∞¢gGáBÇ~) br¬b„R¢DîƒR¬R„Ç¢DîƒR¬#"¬r6SVfbr¬v6VÁFW"r¬r6SVfbrì∞¢–¢ÚÚ÷&ñVÁBF&∂ÊW72(	BGñÊ÷ñ2∆ñváG2∆ñgBvÜB÷GFW'0¢ÚÚÙ‰R‘ı$RdƒBdTî¬ıdU"DÑRtÑÙƒRdîUr¬ÊBóBó2FÜRfñgFÇ‚6˜VÁFVBvÜñ∆P¢ÚÚ6Ü6ñÊr&&6∂w&˜VÊBó2FˆˆˆˆˆÚF&≤ÊBfFVB#¢FÜRf"◊∆ÊRw&FR¬FÜP¢ÚÚñÁFñÊrw26VFñÊrw&FñVÁB¬FÜRñÁFñÊrw2f∆BfVñ¬¬FÜó2¬ÊBFÜP¢ÚÚ67&VV‚÷∆ñgBFñ¬w2w&Wí(	BfófRgV∆¬÷g&÷R˜W&FñˆÁ2ˆ‚ˆÊRñ7GW&R¬ÊˆÊP¢ÚÚˆbvÜñ6Ç∂Ê˜w2&˜WBFÜR˜FÜW'2‚FÜó2ˆÊRó2Üó"ˆbF÷˜7ÜW&S≤B„`¢ÚÚóBv2F∂ñÊr6óáFÇˆbFÜR∆ñváB˜WBˆbWfW'íg&÷Rñ‚FÜRv÷R‡¢2Êfñ∆≈7Gñ∆R“w&v&É2√b√B¬r≤tı$ƒEıdTî¬≤rís∞¢2Êfñ∆≈&V7BÜ6“ÁÇ“"¬6“Áí“"¬ìÉB¬ScBì∞¢ÚÚDÑR%$îBw&óFW2óG6V∆bˆÁFÚFÜRó"ˆbFÜR&ˆˆ“‚∂ñÊvFˆ“7Fñ∆¬FVWñ‡¢ÚÚFÜR&˜B'VÁ2fñˆ∆WC≤ˆÊR6ÜRÜ2&˜VváB&6≤'VÁ26∆V‚‚5D$ƒU52v˜&∆G0¢ÚÚ∆˜6RFÜR6Vñ∆ñÊr∆ñváG2VÁFó&V«í‡¢ñbáGóVˆbVÊófW'6R””“vgVÊ7Fñˆ‚rí∞¢6ˆÁ7BR“VÊófW'6RÇí¬¶í“RÊñÊe¥rÁ&ˆˆ‘FVbÁ¶ˆÊU““ÁV∆¬ÚRÊñÊe¥rÁ&ˆˆ‘FVbÁ¶ˆÊU“¢∞¢ñbá¶í‚„Bí∞¢2Êfñ∆≈7Gñ∆R“w&v&É#√#√ì¬r≤Çá¶í“„Bí¢„2íÁFÙfóÜVBÉ2í≤rís∞¢2Êfñ∆≈&V7BÜ6“ÁÇ“"¬6“Áí“"¬ìÉB¬ScBì∞¢“V«6Rñbá¶í¬„#Rí∞¢2Êfñ∆≈7Gñ∆R“w&v&Éc√##√ì¬r≤ÇÉ„#R“¶íí¢„íÁFÙfóÜVBÉ2í≤rís∞¢2Êfñ∆≈&V7BÜ6“ÁÇ“"¬6“Áí“"¬ìÉB¬ScBì∞¢–¢ñbÖRÊF&¥≤í≤2Êfñ∆≈7Gñ∆R“w&v&É"√B√√„Bís≤2Êfñ∆≈&V7BÜ6“ÁÇ“"¬6“Áí“"¬ìÉB¬ScBì≤–¢–¢ÚÚDÑRîÂDU$5D$ƒR5E%T5EU$U2¬ñ‚FÜR45Bu2∆ÊRÊBÊ˜BFÜRñÁFñÊrw2‡¢ÚÚFÜR&ˆ˜FÇ¬FÜR6á&ñÊR¬FÜRf˜&vRÜˆˆB¬FÜR6'&V¬¬FÜRÜˆ∆∆˜rÊBWfW'ê¢ÚÚ6fR÷˜WFÇ7FÊBÜW&R(	Bñ÷÷VFñFV«í&Vf˜&RFÜR7FÊFñÊrÂ72¬6Ú7F∆¿¢ÚÚÊBFÜRW'6ˆ‚vÜÚ'VÁ2óBF∂RWÜ7F«íFÜR6÷R∆ñváBÊBFÜR6÷P¢ÚÚ6á&ˆ÷‚FÜWívW&Rñ‚G&t$r¬vÜW&R&u∆ÊU72V∆«2ìBRˆbFÜR6ˆ∆˜W"˜W@¢ÚÚFÚW6ÇFÜRf"∆ÊR&6≤¬ÊBFÜR˜vÊW"&VBFÜR&W7V«B6˜'&V7F«ì¢'FÜP¢ÚÚ6ˆ∆˜'2&R7Fñ∆¬ñ‚GV∆¬fFVBFá&VRBñÁ7FVBˆbG&vñÊw2∆ñ∂RFÜP¢ÚÚ6Ü&7FW'2‚‚‚FÜR∆ñW"÷ñváB7GV∆«í÷ó72óB‚"6VRvFTFˆ˜$ÊV"‡¢ñbáGóVˆbG&tvFTFˆ˜'2””“vgVÊ7Fñˆ‚ríG&tvFTFˆ˜'2Ö¬ì∞¢G&u7FFñ72Öì∞¢G&u7ñ∂T÷VÊ6RÇì∞¢G&t'&V¥ÜñÁBÇì∞¢f˜"Ü6ˆÁ7BˆbrÁñ6∑W2íÊG&rÜ2ì∞¢ñbÑrÁˆˆ«2íf˜"Ü6ˆÁ7BˆbrÁˆˆ«2í∞¢6ˆÁ7B“÷FÇÊ÷ñ‚É¬ÁBÚ„Çí¢„SS∞¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ«Ü“∞¢ÚÚ‘T≈B4ÙÙ≈3≤4îBDÙU2‰ıB‚FÜRf˜VÊG'íw27ñ∆¬ó2FÜR6÷Rˆˆ¬ˆ&¶V7@¢ÚÚvóFÇÜ˜F6WB¬ÊBóBó2G&v‚2FÜRFÜñÊróBó3¢vÜóFRBFÜR÷ñFF∆P¢ÚÚvÜW&RóBó2ÊWvW7B¬F&∂VÊñÊrFÚFÊvW"&VBBFÜR&ñ“¬ÊB∆˜6ñÊróG0¢ÚÚ∆ñváB7&˜72óG2∆ñfR6Ú∆ñW"6‚6VRFÜRf∆ˆ˜"vófñÊrÜW"FÜRFñ∆P¢ÚÚ&6≤‚B˜Có2FÜRvÜˆ∆RÊñ÷Fñˆ‚(	BÊÚ6V6ˆÊBFñ÷W"¬ÊÚ6V6ˆÊB∆ó7B‡¢6ˆÁ7BÜVB“ÊÜ˜BÚ÷FÇÊ÷ÇÉ¬ÁBÚáÁC«¬íí¢∞¢6ˆÁ7Bs2“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬Áí“Ç¬¬Áí≤2ì∞¢ñbáÊÜ˜Bí∞¢s2ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#C"√##¬r≤É„#R≤„B¢ÜVBíÁFÙfóÜVBÉ"í≤rírì∞¢s2ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√ìR√í¬r≤É„≤„#R¢ÜVBíÁFÙfóÜVBÉ"í≤rírì∞¢“V«6R∞¢s2ÊFD6ˆ∆˜%7F˜É¬w&v&ÉÉ√#SR√#√„Rírì≤s2ÊFD6ˆ∆˜%7F˜É¬w&v&Éì√ì√c√„Rírì∞¢–¢2Êfñ∆≈7Gñ∆R“s3∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RáÁÇ¬Áí¬Á"¬R„R¬¬¬rì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“ÊÜ˜@¢Úw&v&É#SR√CÇ√CÇ¬r≤ÇÉ„2≤„R¢ÜVBí¢íÁFÙfóÜVBÉ"í≤ríp¢¢w&v&É#√#SR√S¬r≤É„R¢íÁFÙfóÜVBÉ"í≤rís∞¢2Ê∆ñÊUvñGFÇ“„C∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RáÁÇ¬Áí¬Á"¬R„R¬¬¬rì≤2Á7G&ˆ∂RÇì∞¢ÚÚóB'V&&∆W2¬6ÚóB&VG227FófR&FÜW"FÜ‚2FV6¿¢ñbÜ6ÜÊ6RÉ„#R¢ííFE'BáÁÇ≤&ÊBÇ◊Á"¬Á"í¬Áí“"¬&ÊBÇ”¬í¬&ÊBÇ”C¬”"í¬„B¿¢ÊÜ˜BÚÜ6ÜÊ6RÉ„RíÚr6ffCÜr¢r6fcìC3rí¢r63Üfcìbr¬„Ç¬c¬G'VRì∞¢2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢–¢ÚÚDÑRîƒRï2‚Ù$§T5B¬‰ıB44T‰U%í‚óBv2'&ñVf«íG&v‚vóFÇFÜR6fP¢ÚÚ÷˜WFÇñ‚FÜR&6∂G&˜72¬vÜW&RFÜR&ˆˆ“w2˜v‚Ü¶Rv6ÜVBóBF˜v‚FÚ¢ÚÚvÜ˜7B(	B6˜'&V7F«í¬&V6W6RFÜB72ó2f˜"ñÁFVBFó7FÊ6R‚6ÜR7FÊG0¢ÚÚ&W6ñFRFÜó2ÊBÜóG2óB¬6ÚóB&V∆ˆÊw2ñ‚FÜRv˜&∆B∆ñW"vóFÇWfW'óFÜñÊp¢ÚÚV«6RFÜBÜ2ÜóF&˜Ç¬ñ‚g&ˆÁBˆbFÜRFW'&ñ‚ÊB&VÜñÊBÜW"‡¢ñbÑrÁ'V&&∆W2bbGóVˆbG&u'V&&∆R””“vgVÊ7Fñˆ‚rê¢f˜"Ü6ˆÁ7B&"ˆbrÁ'V&&∆W2íG&u'V&&∆Rá&"¬&"ÁÇ¬'V&&∆Tfˆ˜Bá&"í≤B¬≈¥rÁ&ˆˆ‘FVbÁ¶ˆÊU“ì∞¢ñbÑrÁ∆G2íf˜"Ü6ˆÁ7B¬ˆbrÁ∆G2í¬ÊG&rÜ2ì∞¢ñbÑrÁ6w2íf˜"Ü6ˆÁ7B7rˆbrÁ6w2í7rÊG&rÜ2ì∞¢f˜"Ü6ˆÁ7BRˆbrÊVÊV÷ñW2íRÊG&rÜ2ì∞¢f˜"Ü6ˆÁ7BrˆbrÁw&V6∑2írÊG&rÜ2ì∞¢ñbÑrÊ&˜72írÊ&˜72ÊG&rÜ2ì∞¢ñbáGóVˆbG&uWDgÇ””“vgVÊ7Fñˆ‚rí≤G&uWDgÇÜ2ì≤G&uWD&ˆÊBÜ2ì≤–¢f˜"Ü6ˆÁ7BˆbrÁ&ˆß2íÊG&rÜ2ì∞¢ñbÑrÊ&ˆˆ÷W"bbGóVˆbG&t&ˆˆ÷W"””“vgVÊ7Fñˆ‚ríG&t&ˆˆ÷W"Ü2ì∞¢ñbáGóVˆbG&tvFU&ˆ◊B””“vgVÊ7Fñˆ‚ríG&tvFU&ˆ◊BÇì∞¢ñbáGóVˆbG&u&ˆ$eÇ””“vgVÊ7Fñˆ‚ríG&u&ˆ$eÇÜ2ì∞¢ÚÚFÜR∆ñW"ó2G&v‚eDU"FÜR6ñÊV÷Fñ2w&FRÜ&∆ˆˆ“≤¶ˆÊRv6Çí6Ú6ÜP¢ÚÚ7Fó26ˆ∆ñBÊB&ñ6ÇñÁ7FVBˆb&VñÊr7v∆∆˜vVB'íFÜRF÷˜7ÜW&R(	BFÜP¢ÚÚˆÊRWÜ6WFñˆ‚ó2FÜR&V6Ü&vRˆB¬vÜ˜6R6&∆W2ÊB6Ê˜í◊W7B6∆˜6P¢ÚÚ˜fW"ÜW"¬6Ú6ÜR7Fó2ñ‚◊v˜&∆Bf˜"FÜB66VÊP¢ñbá∆ñW"bbrÁ&V6Ü&vRí∆ñW"ÊG&rÜ2ì∞¢ÚÚ&V6Ü&vRBˆC¢6&∆W2Üˆˆ≤ˆÁFÚFÜR&ˆ&˜B¬7W&vR&72¬v∆726Ê˜í6∆˜6W0¢ñbÑrÁ&V6Ü&vRbb∆ñW"í∞¢6ˆÁ7B&2“rÁ&V6Ü&vS∞¢6ˆÁ7BG“&2ÁÜ6R””“vFˆ6≤rÚ6∆◊É“&2ÊFˆ6µBÚ&2ÊFˆ6≥¬¬í¢∞¢6ˆÁ7BÜW&Ú“GóVˆbó4ÜW&Ú””“vgVÊ7Fñˆ‚rbbó4ÜW&ÚÇì∞¢ñbÇÜW&Úí∞¢ÚÚ6Ü&vR6&∆W26Ê∂R˜WBˆbFÜRˆBÊB«VrñÁFÚFÜR&ˆ&˜@¢6ˆÁ7B6&∆R“ÜÇ¬í¬'Ç¬'í¬&ˆrí”‚∞¢6ˆÁ7BWÇ“Ç≤Ü'Ç“Çí¢&ˆr¬Wí“í≤Ü'í“íí¢&ˆs∞¢6ˆÁ7B◊Ü2“ÜÇ≤WÇíÚ"¬◊ñ2“÷FÇÊ÷ÇÜí¬Wíí≤#∞¢2Ê∆ñÊT6“w&˜VÊBs∞¢2Á7G&ˆ∂U7Gñ∆R“r3##&#3bs≤2Ê∆ñÊUvñGFÇ“2„C∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜÇ¬íì≤2ÁVG&Fñ47W'fUFÚÜ◊Ü2¬◊ñ2¬WÇ¬Wíì≤2Á7G&ˆ∂RÇì∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉC√#Cb√#SR¬r≤É„R≤„B¢÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚì≤Çíí≤rís∞¢2Ê∆ñÊUvñGFÇ“„3∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜÇ¬íì≤2ÁVG&Fñ47W'fUFÚÜ◊Ü2¬◊ñ2¬WÇ¬Wíì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢ñbá&ˆr‚„rí≤2Êfñ∆≈7Gñ∆R“r3Üfcffbs≤2Á6ÜF˜t6ˆ∆˜"“r3Üfcffbs≤2Á6ÜF˜t&«W"“c≤2Êfñ∆≈&V7BÜWÇ“"„R¬Wí“"„R¬R¬Rì≤2Á6ÜF˜t&«W"“≤–¢”∞¢6ˆÁ7BÇ“∆ñW"ÁÇ¬í“∆ñW"Áì∞¢6&∆Rá&2ÁÇ¬&2ÁˆEF˜≤"¬Ç≤"¬í≤B¬Gì∞¢6&∆Rá&2ÁÇ“#¬&2ÁˆEF˜≤&2ÁˆDÇ“Ç¬Ç≤2¬í≤2¬Gì∞¢6&∆Rá&2ÁÇ≤#¬&2ÁˆEF˜≤&2ÁˆDÇ“Ç¬Ç≤#¬í≤2¬Gì∞¢–¢ÚÚ$Ù$ıC¢V∆V7G&ñ27W&vR&72ßV◊ñÊr˜fW"FÜR&ˆ&˜BÜˆÊ6R6VFVB≤6Ü&vñÊrê¢ñbÇÜW&Úbb&2ÁÜ6R””“v6Ü&vRrí∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Á7G&ˆ∂U7Gñ∆R“r3Üfcffbs≤2Á6ÜF˜t6ˆ∆˜"“r3Üfcffbs≤2Á6ÜF˜t&«W"“#∞¢6ˆÁ7BGÉ"“∆ñW"ÁÇ≤"¬Gì"“∆ñW"Áí≤C∞¢f˜"Ü∆WB≤“≤≤¬#≤≤≤≤í∞¢2Ê∆ñÊUvñGFÇ“≤Ú„"¢"„C≤2Êv∆ˆ&ƒ«Ü“&ÊBÉ„B¬„ìRì∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚá&2ÁÇ¬&2Áí“bì∞¢f˜"Ü∆WB3"“≤3"√“C≤3"≤≤í∞¢6ˆÁ7B“3"ÚS∞¢2Ê∆ñÊUFÚá&2ÁÇ≤áGÉ"“&2ÁÇí¢≤&ÊBÇ”í¬íí¿¢á&2Áí“bí≤áGì"“á&2Áí“bíí¢≤&ÊBÇ”í¬ííì∞¢–¢2Ê∆ñÊUFÚáGÉ"¬Gì"ì≤2Á7G&ˆ∂RÇì∞¢–¢2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢–¢ÚÚÑU$Û¢Fó6Ü∆ñ6Rñ‚FÜRf˜VÁFñ‚ÊBG&ñÊ≤FÜRV∆óÜó"ˆb∆ñfRÜ6ñÊV÷Fñ2ê¢ñbÜÜW&Úbb&2ÁÜ6R””“v6Ü&vRrí∞¢6ˆÁ7B7“6∆◊É“&2ÁBÚá&2ÊGW"«¬„Bí¬¬ì≤ÚÚ(i#˜fW"FÜRG&ñÊ∞¢6ˆÁ7BáÇ“∆ñW"ÁÇ≤∆ñW"ÁrÚ"¬Ü÷˜WFÇ“∆ñW"Áí≤ì∞¢6ˆÁ7B&6ñÂÇ“&2ÁÇ¬&6ñÂí“&2ÁˆEF˜≤#∞¢ÚÚ6Ü˜&Vˆw&áì¢FóÉ“„#Çí(i"&ó6RÇ„#Ç“„Rí(i"G&ñÊ≤Ç„R“„íí(i"∆˜vW"Ç„í”ê¢∆WB7á¬7ó¬Fó∞¢ñbÜ7¬„#Çí≤6ˆÁ7B≤“7Ú„#É≤7á“∆W'ÜáÇ≤"¬&6ñÂÇ¬≤ì≤7ó“∆W'á∆ñW"Áí≤Ç¬&6ñÂí“"¬≤ì≤Fó“≤–¢V«6RñbÜ7¬„Rí≤6ˆÁ7B≤“Ü7“„#ÇíÚ„##≤7á“∆W'Ü&6ñÂÇ¬áÇ≤b¬≤ì≤7ó“∆W'Ü&6ñÂí“"¬Ü÷˜WFÇ¬≤ì≤Fó“≤–¢V«6RñbÜ7¬„íí≤7á“áÇ≤c≤7ó“Ü÷˜WFÉ≤Fó“÷FÇÊ÷ñ‚É¬Ü7“„RíÚ„"í¢„c≤–¢V«6R≤6ˆÁ7B≤“Ü7“„ííÚ„≤7á“áÇ≤c≤7ó“∆W'ÜÜ÷˜WFÇ¬∆ñW"Áí≤b¬≤ì≤Fó“„b¢É“≤ì≤–¢6ˆÁ7BG&ñÊ∂ñÊr“7„“„Rbb7¬„ìS∞¢ÚÚv&“6ñÊV÷Fñ2fñvÊWGFR≤vˆ∆FV‚v∆˜r&ó6ñÊrg&ˆ“FÜRÜW&ÚvÜñ∆RG&ñÊ∂ñÊp¢ñbÜG&ñÊ∂ñÊrí∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Êv∆ˆ&ƒ«Ü“„b≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ3í¢„S∞¢6ˆÁ7Bvr“2Ê7&VFU&Fñƒw&FñVÁBÜáÇ¬∆ñW"Áí≤B¬B¬áÇ¬∆ñW"Áí≤B¬Cbì∞¢vrÊFD6ˆ∆˜%7F˜É¬r6ffSÜrì≤vrÊFD6ˆ∆˜%7F˜É¬w&v&É√√√írì∞¢2Êfñ∆≈7Gñ∆R“vs≤2Ê&VvñÂFÇÇì≤2Ê&2ÜáÇ¬∆ñW"Áí≤B¬Cb¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢ñbÜ6ÜÊ6RÉ„RííFE'BÜáÇ≤&ÊBÇ”¬í¬∆ñW"Áí≤&ÊBÉ¬#í¬&ÊBÇ”"¬"í¬&ÊBÇ”C¬”"í¬„b¬r6ffSÜr¬"¬”3¬G'VRì∞¢–¢ÚÚ7G&V“ˆb∆ñváBg&ˆ“&6ñ‚FÚ7WvÜñ∆RFóñÊrˆfñ∆∆ñÊp¢ñbÜ7¬„2í∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s≤2Á7G&ˆ∂U7Gñ∆R“w&v&É#SR√#3"√c√„bís∞¢2Ê∆ñÊUvñGFÇ“#≤2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜ&6ñÂÇ¬&6ñÂíì≤2Ê∆ñÊUFÚÜ7á¬7óì≤2Á7G&ˆ∂RÇì≤2Á&W7F˜&RÇì∞¢–¢ÚÚFÜR6Ü∆ñ6RÜvˆ&∆WBívóFÇv∆˜vñÊrV∆óÜó ¢2Á6fRÇì≤2ÁG&Á6∆FRÜ7á¬7óì≤2Á&˜FFRáFóì∞¢2Êfñ∆≈7Gñ∆R“r66#Fs≤ÚÚvˆ∆B7FV“ˆ&6P¢2Êfñ∆≈&V7BÇ”„R¬"¬2¬bì≤2Êfñ∆≈&V7BÇ”B¬Ç¬Ç¬"ì∞¢6ˆÁ7B7Wr“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬”R¬¬2ì∞¢7WrÊFD6ˆ∆˜%7F˜É¬r6Sf3Sfbrì≤7WrÊFD6ˆ∆˜%7F˜É¬r6ÉÉC&Rrì∞¢2Êfñ∆≈7Gñ∆R“7Ws∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”R¬”Rì≤2Ê∆ñÊUFÚÉR¬”Rì≤2Ê∆ñÊUFÚÉ2„R¬2ì≤2Ê∆ñÊUFÚÇ”2„R¬2ì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÚÚV∆óÜó"7W&f6Rv∆˜p¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Êfñ∆≈7Gñ∆R“r6ffc63s≤2Á6ÜF˜t6ˆ∆˜"“r6ffSÜs≤2Á6ÜF˜t&«W"“É∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÉ¬”B„R¬B„"¬„b¬¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢2Á&W7F˜&RÇì∞¢ÚÚvˆ∆FV‚G&˜∆WG2vÜñ∆RG&ñÊ∂ñÊp¢ñbÜG&ñÊ∂ñÊrbb6ÜÊ6RÉ„#RííFE'BÜ7á≤&ÊBÇ”"¬"í¬7ó“B¬&ÊBÇ”b¬bí¬&ÊBÉ¬Cí¬„B¬r6ffSÜr¬„b¬#¬G'VRì∞¢–¢ñbÇÜW&Úí∞¢ÚÚg&ˆÁBv∆726Ê˜í(	B6V∆ñÊrFÜR&ˆ&˜BñÁ6ñFRFÜR67V∆P¢6ˆÁ7BEí“&2ÁˆEF˜≤b¬DÇ“&2ÁˆDÇ“c∞¢6ˆÁ7B6r“2Ê7&VFT∆ñÊV$w&FñVÁBá&2ÁÇ“Ç¬¬&2ÁÇ≤Ç¬ì∞¢6rÊFD6ˆ∆˜%7F˜É¬w&v&Éì√#C√#SR¬r≤É„R¢Gí≤rírì∞¢6rÊFD6ˆ∆˜%7F˜É„CR¬w&v&Éì√#C√#SR¬r≤É„b¢Gí≤rírì∞¢6rÊFD6ˆ∆˜%7F˜É¬w&v&É#√#√#3¬r≤É„R¢Gí≤rírì∞¢2Êfñ∆≈7Gñ∆R“6s≤'"Ü2¬&2ÁÇ“Ç¬Eí¬3b¬DÇ¬"ì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#SR√#SR√#SR¬r≤É„#Ç¢Gí≤rís≤2Ê∆ñÊUvñGFÇ“3≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚá&2ÁÇ“í¬Eí≤Çì≤2Ê∆ñÊUFÚá&2ÁÇ“2¬Eí≤DÇ“"ì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉìR√S√É¬r≤É„R¢Gí≤rís≤2Ê∆ñÊUvñGFÇ“#∞¢'"Ü2¬&2ÁÇ“Ç¬Eí¬3b¬DÇ¬"ì≤2Á7G&ˆ∂RÇì∞¢–¢–¢ÚÚDÖT‰DU$dƒ¬(	B&ˆ«Bg&ˆ“ˆ«ñ◊W2FV&ñÊrF˜v‚˜WBˆbFÜR6∑ê¢ñbÑrÊ&ˆ«BbbrÊ&ˆ«BÁB‚í∞¢6ˆÁ7B'B“rÊ&ˆ«B¬≤“'BÁBÚ'BÁC∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢ÚÚñ∆∆"ˆb∆ñváBvÜW&RóB∆ÊG0¢6ˆÁ7Br“2Ê7&VFT∆ñÊV$w&FñVÁBÜ'BÁÇ¬'BÁí“SC¬'BÁÇ¬'BÁíì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#Cb√ì"√írì∞¢rÊFD6ˆ∆˜%7F˜É„r¬w&v&É#SR√##R√C¬r≤É„Ç¢≤í≤rírì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#SR√#SR¬r≤É„B¢≤í≤rírì∞¢2Êfñ∆≈7Gñ∆R“s≤2Êfñ∆≈&V7BÜ'BÁÇ“3B¬'BÁí“SC¬cÇ¬SCì∞¢ÚÚFÜR¶vvVB&ˆ«BóG6V∆b¬&VG&v‚V6Çg&÷R6ÚóB7&6∂∆W0¢f˜"Ü∆WB72“≤72¬#≤72≤≤í∞¢2Á7G&ˆ∂U7Gñ∆R“72Úr6fffffbr¢r6ffCsfs∞¢2Ê∆ñÊUvñGFÇ“72Ú2¢É≤2Ê∆ñÊT6“w&˜VÊBs≤2Ê∆ñÊT¶ˆñ‚“w&˜VÊBs∞¢2Á6ÜF˜t6ˆ∆˜"“r6ffCsfs≤2Á6ÜF˜t&«W"“72Ú¢#c∞¢2Êv∆ˆ&ƒ«Ü“÷FÇÊ÷ñ‚É¬≤¢„bì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜ'BÁÇ≤&ÊBÇ”Ç¬Çí¬'BÁí“SCì∞¢f˜"Ü∆WB7í“'BÁí“Cc≤7í¬'BÁì≤7í≥“cí2Ê∆ñÊUFÚÜ'BÁÇ≤&ÊBÇ”#"¬#"í¬7íì∞¢2Ê∆ñÊUFÚÜ'BÁÇ¬'BÁíì≤2Á7G&ˆ∂RÇì∞¢–¢2Á6ÜF˜t&«W"“∞¢ÚÚw&˜VÊB'W'7@¢2Êv∆ˆ&ƒ«Ü“≥∞¢6ˆÁ7B&s"“2Ê7&VFU&Fñƒw&FñVÁBÜ'BÁÇ¬'BÁí¬"¬'BÁÇ¬'BÁí¬c¢É„B“≤íì∞¢&s"ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#SR√#SR√„íírì≤&s"ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#√É√írì∞¢2Êfñ∆≈7Gñ∆R“&s#≤2Ê&VvñÂFÇÇì≤2Ê&2Ü'BÁÇ¬'BÁí¬c¢É„B“≤í¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢–¢G&u'G2Ü2ì∞¢G&t∆ñváG2Öì∞¢ñbÑrÁ&ñÊw2Ê∆VÊwFÇbbrÊ'E&ˆ&RíG&u&ñÊw2Ü2ì∞¢G&u6V«2Öì∞¢2Á&W7F˜&RÇì∞¢ÚÚDÑR‰T"ƒDRï2ÙdbTÂDî¬ïBï2$R‘dï$TB¬ÊBFÜR&V6ˆ‚ó2÷ó7F∂Rñ‡¢ÚÚ◊í˜v‚'&ñVc¢óB6∂VBf˜"‰T"‘$ƒ4≤6ñ∆Ü˜VWGFRˆ‚$ƒ4≤fñV∆B¬Ê@¢ÚÚFÜV‚FÜR∂WñW"7WBóB'í«V÷ñÊÊ6R‚ÊV"÷&∆6≤7V&¶V7Bˆ‚&∆6≤w&˜VÊ@¢ÚÚ6ÊÊ˜B&R«V÷ñÊÊ6R÷∂WñVB(	B7V&¶V7BÊBfñV∆B&RFÜR6÷Rf«VR‚÷V7W&V@¢ÚÚˆ‚f˜&UˆÁÊs¢FÜR6˜W&6Ró2R˜VRB÷V‚«V÷ñÊÊ6RR¬ÊBgFW ¢ÚÚ∂WññÊrˆÊ«íÇ„ÇR7W'fófVBB÷V‚«V÷ñÊÊ6R#2„Ç¬ˆbvÜñ6ÇCR„ÇRó0¢ÚÚ&«Vó6Ç‚FÜR∂WñW"FV∆WFVBFÜR&ˆGíÊB∂WBFÜRñÊFñ6F˜"∆ñváG2‚FÜBó0¢ÚÚFÜRf∆ˆFñÊr&«VRFÜR˜vÊW"6∂VB&˜WB(	Bf˜&Vw&˜VÊB∆ñW"&VGV6VBFÚóG0¢ÚÚ˜v‚∆ñváB◊ó2‡¢ÚÚ&R÷fó&VBˆ‚tÑïDRfñV∆B6ÚÊV"÷&∆6≤6ñ∆Ü˜VWGFR6‚7GV∆«í&R7W@¢ÚÚg&ˆ“óC¢#í”SRˆbV6Ç∆FRÊ˜r7W'fófW2FÜR∂WíB÷V‚«V÷ñÊÊ6P¢ÚÚ"„R”B„r¬vñÁ7BÇ„ÇRB«V÷ñÊÊ6R#2„Ç&Vf˜&R¬ˆbvÜñ6ÇÊV&«íÜ∆bv0¢ÚÚFÜR&«VRó2‡¢ÚÚ‰ıBî‰DÙı%2‚f˜&UˆÁvV'ó2GvÚñ7GW&W2ñ‚ˆÊRfñ∆S¢&∆6≤4ïEí4µîƒî‰P¢ÚÚ7&˜72óG2WW"Ü∆bÊBFÜR'V&&∆R÷ÊB◊óW2f˜&Vw&˜VÊB7&˜72óG2∆˜vW"‡¢ÚÚG&v‚B„b&∆∆ÇóB∆ÊG2ñ‚g&ˆÁBˆbWfW'óFÜñÊr(	BÊBñ‚FÜRG&FW"w0¢ÚÚFV‚FÜBWB&˜rˆbF˜vW"6ñ∆Ü˜VWGFW27&˜72FÜRñÁ6ñFRˆbv˜&∑6Ü˜‡¢ÚÚFÜR˜vÊW"G&Wr∆ñÊR&˜VÊBFÜV“ÊB6∂VBvÜBFÜRˆñÁBˆbFÜV“v2‚FÜW&P¢ÚÚó2ÊˆÊS¢FÜWí&R‚˜WFFˆ˜"6∑ñ∆ñÊR¬ñÊFˆ˜'2‡¢Ú¢ÚÚFÜó2ó2FÜR6÷R'V∆ñÊrFÜR6Vñ∆ñÊr«&VGífˆ∆∆˜w2GvVÁGí∆ñÊW2W(	BFÜP¢ÚÚ∂ñÊvFˆ“w2vÁG'í&ˆˆbó26∂óVBñ‚&ˆˆ“FÜBÜ2óG2˜v‚&gFW'2ñÁFV@¢ÚÚñ‚¬&V6W6R'FÜR&6∂w&˜VÊBFˆW2Ê˜B&∆VÊBvóFÇFÜRóFV◊2ñ‚óB"‚FÜBÊ˜FP¢ÚÚ6∆«2óG6V∆bÑƒbˆbFÜR&ˆ&∆V“‚FÜó2ó2FÜR˜FÜW"Ü∆c¢&ˆˆ“FÜBó2¢ÚÚñÁFñÊrˆb‚VÊ6∆˜6VB76RÜ2ÊÚf"6óGíÊBÊÚÊV"'V&&∆R¬ÊB&˜FÄ¢ÚÚˆbóG2∆ÊW2&V∆ˆÊrFÚFÜRv˜&∆B˜WG6ñFRóB‡¢ñbÇÑrÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÊñÊFˆ˜"ííG&tFWFÖ∆ÊRÇvf˜&Rrì∞¢ÚÚDÑR$ƒÙÙ“%TÂ2Ù‰4R¬‰BïB%TÂ2ÑU$R(	Bˆ‚FÜRv˜&∆B¬&Vf˜&RFÜRw&FRÊ@¢ÚÚ&Vf˜&RFÜR66W76ñ&ñ∆óGí∆ñgB‡¢Ú¢ÚÚóBW6VBFÚ'V‚Gvñ6S¢FÜó26∆¬¬ÊB6V6ˆÊBˆÊRBFÜRVÊBˆb∆ñváE72¿¢ÚÚvÜñ6Çó2ñÁfˆ∂VBeDU"G&u67&VV‰∆ñgB‚FÜB6V6ˆÊB72ó2váí∆◊÷∆ó@¢ÚÚ&ˆˆ“6˜V∆BGW&‚ñÁFÚv6Çñ˜R6ÊÊ˜B6VRFá&˜VvÇ‚«î&∆ˆˆ“ó6ˆ∆FW0¢ÚÚV÷óGFW'2'í5T$î‰rFÜRg&÷R(	BÜñvÜ∆ñváBB„í7W'fófW22„É¬¢ÚÚ÷ñBB„26ˆ∆∆6W2FÚ„í(	BÊBFÜBˆÊ«ív˜&∑2vÜñ∆RFÜRg&÷R7Fñ∆¿¢ÚÚÜ2&V¬F&∑2ñ‚óB‚G&u67&VV‰∆ñgBó2ffñÊRÊBFV∆ñ&W&FV«íFW7G&˜ó0¢ÚÚFÜV”¢˜WB“Cb≤„É"ß&rBFÜRFVfV«B6WGFñÊr‚7V&ñÊrg&÷RvóFÇÊ¢ÚÚ&∆6≤∆VgB&V¶V7G2Ê˜FÜñÊr¬6ÚFÜR6V6ˆÊB72v2FFñÊr&«W'&VB6˜íˆ`¢ÚÚFÜRvÜˆ∆R&ˆˆ“&6≤˜fW"óG6V∆b¬v&÷W7BvÜW&RFÜR&ˆˆ“v2v&÷W7B‡¢Ú¢ÚÚóB«6ÚWá∆ñÁ2FÜRFñ÷ñÊrFÜR˜vÊW"&W˜'FVB(	BFÜRv∆&R&vˆW2víf˜"¢ÚÚ6V6ˆÊBvÜV‚FÜR6Ü˜∂VWW"vWG2g&VVB¬FÜV‚6ˆ÷W2&6≤"‚Á46Ü&vR6WG0¢ÚÚrÊf∆6É≤FÜRvÜóFRf∆6Ç&ó6W2FÜRg&÷Rw2÷V„≤∆ñgE&ˆ&R&VG2FÜB÷V‡¢ÚÚGvñ6R6V6ˆÊBÊBG&˜2ƒîeEÙ≤¬vÜñ6ÇvV∂VÁ2FÜR∆ñgBÊBvóFÇóBFÜP¢ÚÚ6V6ˆÊB&∆ˆˆ”≤FÜRf∆6ÇFV6ó2¬FÜR&ˆˆ“ó2F&≤vñ‚¬ƒîeEÙ≤6∆ñ÷'2Ê@¢ÚÚFÜRv∆&R&WGW&Á2‚67&VV‚◊76R÷V7W&V÷VÁBv2fVVFñÊr72FÜ@¢ÚÚ6ÜÊvVBvÜBóB÷V7W&VB‡¢Ú¢ÚÚ&ñ6Ñ≤ó2FÜRV∆óGíFñ¬FÜR6V6ˆÊB6∆¬v26''ññÊr¬6ÚóB÷˜fW2ÜW&P¢ÚÚ&FÜW"FÜ‚&VñÊr∆˜7BvóFÇóB‡¢«î&∆ˆˆ“áGóVˆb&ñ6Ñ≤””“vÁV÷&W"rÚ&ñ6Ñ≤¢ì∞¢ÚÚ““““6ñÊV÷Fñ2w&FS¢¶ˆÊR◊FñÁFVB∆ñváBv6Ç≤fñvÊWGFRáFÜR&WáVÁ6ófR"∆ˆˆ≤í“““–¢∞¢6ˆÁ7B"“≈¥rÁ&ˆˆ‘FVbÁ¶ˆÊU”∞¢2Á6fRÇì∞¢ÚÚv&“ˆ6ˆˆ¬∆ñváBv6ÇV∆∆VBg&ˆ“FÜR¶ˆÊRw2˜v‚v∆˜r6ˆ∆˜W ¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v˜fW&∆ís∞¢2Êv∆ˆ&ƒ«Ü“„C∞¢6ˆÁ7Bv6Ç“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬¬¬SCì∞¢v6ÇÊFD6ˆ∆˜%7F˜É¬"Êv∆˜rì≤v6ÇÊFD6ˆ∆˜%7F˜É„SR¬w&v&É#Ç√#Ç√#Ç√írì≤v6ÇÊFD6ˆ∆˜%7F˜É¬"ÊF&≤ì∞¢2Êfñ∆≈7Gñ∆R“v6É≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢2Á&W7F˜&RÇì∞¢ÚÚfñvÊWGFR(	BF&∂VÁ2FÜRg&÷RVFvW26ÚFÜR7Fñˆ‚&VG22∆ó@¢2Á6fRÇì∞¢6ˆÁ7Bfñr“2Ê7&VFU&Fñƒw&FñVÁBÉCÉ¬#s¬#¬CÉ¬#s¬c#ì∞¢fñrÊFD6ˆ∆˜%7F˜É¬w&v&É√√√írì∞¢fñrÊFD6ˆ∆˜%7F˜É„cR¬w&v&É√√√„Çírì∞¢fñrÊFD6ˆ∆˜%7F˜É¬w&v&É√√√„SRírì∞¢2Êfñ∆≈7Gñ∆R“fñs≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢2Á&W7F˜&RÇì∞¢–¢ÚÚFÜR6Ü&7FW"ÜW'6V∆b¬˜7B÷w&FS¢gV∆¬ñv÷VÁB¬ÊÚ&∆ˆˆ“v6Ç‚ÜW"˜v‡¢ÚÚV÷ó76ófR66VÁG2áfó6˜"¬¶WG2¬6∆w2í7Fñ∆¬v∆˜rfñFÜVó"6ÜF˜t&«W"‡¢ÚÚ‚‚ÊÊB‰ıBvÜñ∆R6ÜRó2v∆∂ñÊrñÁFÚFÜRvFW2‚G&tvFUv∆≤G&w2ÜW ¢ÚÚg&ˆ“&VÜñÊB¬ñ‚67&VV‚76R¬6á&ñÊ∂ñÊrF˜v&BFÜRv≤∆VfñÊrFÜR∆ófP¢ÚÚ&ˆGíˆ‚2vV∆¬WBGvÚˆbÜW"ˆ‚67&VV‚BˆÊ6R(	BFÜRˆÊRvˆñÊrñ‚¬Ê@¢ÚÚFÜRˆÊR7FÊFñÊrvÜW&R6ÜR∆VgB‡¢ÚÚ‚‚ÊÊB6ÜRó2G&v‚2ÜW'6V∆bFá&˜VvÇFÜR∆ñv‚&VC¢FÜRv∆≤FÚFÜP¢ÚÚFˆ˜'víó2FÜR˜&FñÊ'í&ˆGív∆∂ñÊr¬ÊBˆÊ«íFÜR&V6VFRF˜v‚FÜRFˆ˜'vê¢ÚÚó2FÜR7V6ñ¬6Ü˜Bá6VRWFFTvFUv∆≤ê¢ñbá∆ñW"bbrÁ&V6Ü&vRbbÑrÊvFUv∆≤bbrÊvFUv∆≤Ê∆ñv‚„“íí∞¢2Á6fRÇì∞¢ÚÚDÑRí‘e$‘Rdƒî4¥U"Dî’2ÑU"¬ïBDÙU2‰ıBDTƒUDRÑU"‡¢Ú¢ÚÚFÜR˜vÊW#¢'FÜR6Ü&7FW"&WGGí◊V6ÇFó6V'2vÜV‚óBÜóG2‚óB6Ü˜w0¢ÚÚ'Fñ¬ˆbG&Á7&VÁBñ÷vR‚"ÜRv2Ü˜Fˆw&ÜñÊr&WGW&Ê(	BñÁ6ñFP¢ÚÚ∆ñW"ÊG&r¬ˆ‚«FW&ÊFRg&÷W2BÇá¢¬f˜"FÜRvÜˆ∆RñÁgV∆ÊW&&ñ∆óGê¢ÚÚvñÊF˜r¬6ÜRv2Ê˜BG&v‚Bƒ¬‚Ü∆bˆbWfW'íÜóBw2gFW&÷FÇÜBÊ¢ÚÚ6Ü&7FW"ˆ‚67&VV‚¬ÊB7Fñ∆¬6VváBñ‚FÜBÜ∆b6Ü˜w2FÜR&ˆˆ“vÜW&P¢ÚÚ6ÜR6Ü˜V∆B&R‡¢Ú¢ÚÚf∆ñ6∂W"ó2÷VÁBFÚ6í'ñ˜R6ÊÊ˜B&RáW'B&ñváBÊ˜r"¬ÊBóB6ó0¢ÚÚFÜBW&fV7F«ívV∆¬B&VGV6VB˜6óGí‚FV∆WFñÊrFÜR&ˆGíó2v˜'6RFÜ‡¢ÚÚ6ññÊrÊ˜FÜñÊs¢FÜR÷ˆ÷VÁG2ßW7BgFW"ÜóB&RWÜ7F«íFÜRˆÊW2vÜW&P¢ÚÚFÜR∆ñW"ó2FV6ñFñÊrvÜW&RFÚvÚ¬ÊBÊˆ&ˆGíFV6ñFW2FÜB&˜WB¢ÚÚ6Ü&7FW"FÜWí6ÊÊ˜B6VR‚„B7Fñ∆¬&VG2VÊ÷ó7F∂&«í2&∆ñÊ∂ñÊr‡¢Ú¢ÚÚóB∆ófW2ÑU$R&FÜW"FÜ‚ñ‚G&rÇí&V6W6RFÜó26fR˜&W7F˜&Ró"ó0¢ÚÚ&∆Ê6VB'í6ˆÁ7G'V7Fñˆ‚(	BG&rÇíó2áVÊG&VG2ˆb∆ñÊW2vóFÇóG2˜v‡¢ÚÚÊW7FVBG&Á6f˜&◊2¬ÊB‚«Ü6WBñÁ6ñFRóBÜ2ÊÚ6ñÊv∆R6fR∆6P¢ÚÚFÚ&RWB&6≤‡¢ñbá∆ñW"ÊïB‚bb÷FÇÊf∆ˆ˜"á∆ñW"ÊïB¢ÇíR"””“í2Êv∆ˆ&ƒ«Ü“„C∞¢2ÁG&Á6∆FRÇ‘÷FÇÁ&˜VÊBÜ6’5ÇÇíí¬‘÷FÇÁ&˜VÊBÜ6’5íÇííì∞¢∆ñW"ÊG&rÜ2ì∞¢2Á&W7F˜&RÇì∞¢–¢ÚÚ‚‚ÊÊBFÜRVFvRˆbFÜRv˜&∆BıdU"ÜW"¬6ÚFÜR∆7BfWróÜV«2ˆbÜW"fVW@¢ÚÚ72&VÜñÊBóB‚6VRFÜRg&ñÊvR&∆ˆ6≤&˜fS¢FÜó2G&r˜&FW"ó2FÜRVffV7B‡¢2Á6fRÇì∞¢2ÁG&Á6∆FRÇ‘÷FÇÁ&˜VÊBÜ6’5ÇÇíí¬‘÷FÇÁ&˜VÊBÜ6’5íÇííì∞¢G&tg&ñÊvRÇì∞¢2Á&W7F˜&RÇì∞¢ÚÚDÑR45$TT‚ƒîeB¬ˆ‚FÜRtı$ƒBˆÊ«í(	BgFW"FÜR&ˆˆ“¬FÜR67BÊBFÜP¢ÚÚg&ñÊvR¬ÊB&Vf˜&RFÜRÖTBÊBFÜRfñ∆◊2‚FÜRÖTBó2«&VGí∆Vvñ&∆RÊ@¢ÚÚóG2F&≤ÊV«2&RvÜB÷∂RFÜRFWáBˆ‚FÜV“&VF&∆S≤67&VVÊñÊrFÜ˜6P¢ÚÚWv˜V∆Bv6ÇFÜRñÁFW&f6RFÚfóÇFÜRv˜&∆B‡¢G&u67&VV‰∆ñgBÇì∞¢ÚÚDÑRD$≤¬ÊBóBvˆW2eDU"FÜR∆ñgBˆ‚W'˜6R‡¢Ú¢ÚÚG&u67&VV‰∆ñgBó2‚66W76ñ&ñ∆óGíf∆ˆ˜#¢w67&VV‚rvóFÇw&WíCbBFÜP¢ÚÚFVfV«B6WGFñÊr¬vÜñ6Çó2ffñÊR(	B˜WB“Cb≤„É"ß&r‚'V‚&Vf˜&RóB¬FÜP¢ÚÚ6fRF&≤v2÷V7W&&«íFˆñÊróG2¶ˆ"ÊBfó7V∆«íFˆñÊr∆÷˜7BÊ˜FÜñÊs†¢ÚÚF6Çˆb&ˆ6≤vVÁBg&ˆ“&r3"FÚ&r2„í¬SrR7WB¬ÊBFÜR∆ñW ¢ÚÚ6rs"”‚Sr‚WfW'í6ˆÁG&7Bñ‚F&≤&ˆˆ“ó26ˆ◊&W76VBñÁFÚFÜRF˜ ¢ÚÚfñgFÇˆbFÜR&ÊvR'í6ˆÁ7FÁBFFVBFÚóB‡¢Ú¢ÚÚ6ˆ◊VÁ6FñÊr'í6Ü˜WFñÊr(	B'&ñváFW"FFóFófR72(	Bv2v˜'6S¢FFóFófP¢ÚÚ∆ñváB˜fW"F&≤&ˆ6≤vóFÇÊ˜FÜñÊrFÚ6F6ÇóBó2fˆr¬ÊBFÜR6V6ˆÊ@¢ÚÚGFV◊BGW&ÊVBFá&VR∆◊2ñÁFÚFá&VR÷ñ∆∑í&∆ˆ'2vóFÇÊÚ&ˆ6≤ñ‚FÜV“‡¢Ú¢ÚÚ6ÚFÜR∆ñgBvˆW2dï%5BÊBFÜRF&≤6ÜW2vÜBóB∆VfW2‚FÜR6∆ñFW ¢ÚÚ7Fñ∆¬FˆW2óG2¶ˆ#¢&ó6ñÊróB&ó6W2FÜR∆óB&ˆ6≤És"”‚ìíÊB∆ñgG0¢ÚÚFÜRVÊ∆óBf∆ˆ˜"vóFÇóBÉ„#bˆb&ñvvW"ÁV÷&W"í¬vÜñ6Çó2WÜ7F«ívÜB¢ÚÚ'&ñváFÊW726ˆÁG&ˆ¬6Ü˜V∆BFÚñ‚6fR(	B'&ñváFV‚vÜB6ÜR6‚6VR¬Ê˜@¢ÚÚW&6RFÜRFñffW&VÊ6R&WGvVV‚6VV‚ÊBVÁ6VV‚‡¢G&t6fTF&≤Çì∞¢ÚÚ÷Êvñ◊7Bg&÷S¢vÜóFRÊV¬≤&Fñ¬7Fñˆ‚∆ñÊW0¢ñbÑrÊñ◊7BbbrÊñ◊7BÁB‚í∞¢6ˆÁ7B≤“rÊñ◊7BÁBÚrÊñ◊7BÁC∞¢6ˆÁ7B7Ç“rÊñ◊7BÁÇ“6“ÁÇ¬7í“rÊñ◊7BÁí“6“Áì∞¢2Êfñ∆≈7Gñ∆R“w&v&É#SR√#SR√#SR¬r≤É„É"¢≤í≤rís∞¢2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢2Á6fRÇì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É√b√#b¬r≤É„í¢≤í≤rís∞¢2Ê∆ñÊUvñGFÇ“S≤2Ê∆ñÊT6“w&˜VÊBs∞¢f˜"Ü∆WBí“≤í¬#c≤í≤≤í∞¢6ˆÁ7B“íÚ#b¢÷FÇÂí¢"≤„3∞¢6ˆÁ7B#“ì≤Ü6É"Üí¬2í¢#¬#"“c#∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚá7Ç≤÷FÇÊ6˜2Üí¢#¬7í≤÷FÇÁ6ñ‚Üí¢#ì∞¢2Ê∆ñÊUFÚá7Ç≤÷FÇÊ6˜2Üí¢#"¬7í≤÷FÇÁ6ñ‚Üí¢#"ì∞¢2Á7G&ˆ∂RÇì∞¢–¢2Á&W7F˜&RÇì∞¢–¢ÚÚÊñ÷RF6Ç7VVB÷∆ñÊW27&˜72FÜR67&VV‡¢ñbá∆ñW"bb∆ñW"ÊF6ÖB‚í∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ«Ü“„##∞¢2Á7G&ˆ∂U7Gñ∆R“r6fffffbs≤2Ê∆ñÊUvñGFÇ“#∞¢6ˆÁ7BÊr“÷FÇÊF„"á∆ñW"ÊF6Öeí¬∆ñW"ÊF6ÖeÇì∞¢f˜"Ü∆WBí“≤í¬≤í≤≤í∞¢6ˆÁ7Bóí“Ü6É"Üí¬srí¢SC¬áÇ“Ü6É"Üí¬sÇí¢ìc∞¢6ˆÁ7B∆V‚“É≤Ü6É"Üí¬síí¢3#∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚááÇ¬óíì∞¢2Ê∆ñÊUFÚááÇ“÷FÇÊ6˜2ÜÊrí¢∆V‚¬óí“÷FÇÁ6ñ‚ÜÊrí¢∆V‚ì∞¢2Á7G&ˆ∂RÇì∞¢–¢2Á&W7F˜&RÇì∞¢–¢ñbÇÑrÊñ6UB«¬í‚í∞¢ÚÚ4ÙÙƒÂBe$TU§S¢&«VR÷ó7BÜÊw2ñ‚FÜR&ˆˆ“vÜñ∆RFÜRf∆ˆ˜"ó2v∆70¢6ˆÁ7B≤“÷FÇÊ÷ñ‚É¬rÊñ6UBÚ„"í¢÷FÇÊ÷ñ‚É¬Ér„R“rÊñ6UBí¢"≤ì∞¢2Êfñ∆≈7Gñ∆R“w&v&É#√#√#SR¬r≤É„¢≤í≤rís∞¢2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ«Ü“„#"¢≥≤2Êfñ∆≈7Gñ∆R“r66fVVfbs∞¢f˜"Ü∆WBí“≤í¬É≤í≤≤í∞¢6ˆÁ7B◊Ç“Üí¢3r≤W&f˜&÷Ê6RÊÊ˜rÇí¢„"¢É≤í¢„2ííRc“S∞¢6ˆÁ7B◊í“3É≤÷FÇÁ6ñ‚Üí¢"„B≤W&f˜&÷Ê6RÊÊ˜rÇí¢„Rí¢c∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ◊Ç¬◊í¬ì¬b¬¬¬rì≤2Êfñ∆¬Çì∞¢–¢2Á&W7F˜&RÇì∞¢–¢ñbÇÑrÊ∆˜tw&eB«¬í‚„Rí∞¢ÚÚÂTƒ¬u$dïEì¢FÜRvÜˆ∆Rg&÷R'&VFÜW2fñÁBfó'W2W'∆P¢2Êfñ∆≈7Gñ∆R“w&v&ÉS√ì√#SR¬r≤÷FÇÊ÷ñ‚É„"¬rÊ∆˜tw&eB¢„í≤rís∞¢2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢–¢ñbÇÑrÁ&WeB«¬í‚í∞¢ÚÚ‘ıDÑU"u24Ù‰s¢FÜRv˜&∆B'VÁ2&VBÊB÷ó'&˜&VBñÁWG2(	B∆V‚ñÁFÚó@¢2Êfñ∆≈7Gñ∆R“w&v&É#3√Sr√s¬r≤÷FÇÊ÷ñ‚É„b¬rÁ&WeB¢„í≤rís∞¢2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢–¢ñbÇÑrÊF&µB«¬í‚bbrÁ7FFR””“uƒírí∞¢ÚÚDıD¬ÂTƒ√¢FÜR&VÊ∆ñváG2FñR‚ñ˜R6VRñ˜W'6V∆b¬ÜW"vˆ∆FV‚6˜&R¿¢ÚÚÊB(	BvÜñ∆RFÜR6ˆÊr&ñÊw2(	BÜW"vÜˆ∆R6ÜR‡¢6ˆÁ7BF≤“÷FÇÊ÷ñ‚É¬rÊF&µB¢2ì∞¢2Á6fRÇì∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉB√B√¬r≤É„ì"¢F≤¢ÇÑrÁ&WfV≈B«¬í‚Ú„CR¢íí≤rís∞¢2Ê&VvñÂFÇÇì≤2Á&V7BÉ¬¬ìc¬SCì∞¢6ˆÁ7Bá2“∆ñW"ÁÇ≤∆ñW"ÁrÚ"“6“ÁÇ¬ó2“∆ñW"Áí≤∆ñW"ÊÇÚ"“6“Áì∞¢2Ê&2áá2¬ó2¬cÇ¬¬r¬G'VRì∞¢ñbÑrÊ&˜72bbrÊ&˜72ÊFVBí∞¢6ˆÁ7B'Ç“rÊ&˜72Ê7ÇÇí“6“ÁÇ¬'í“rÊ&˜72Ê7íÇí“6“Áì∞¢2Ê&2Ü'Ç¬'í¬ÑrÁ&WfV≈B«¬í‚ÚS¢#b¬¬r¬G'VRì∞¢–¢2Êfñ∆¬ÇvWfVÊˆFBrì∞¢2Á&W7F˜&RÇì∞¢–¢ÚÚ‚‚ÊÊBvÜBf∆«2ˆfbóB¬ñ‚e$ÙÂBˆbWfW'óFÜñÊs¢G&óñ˜RvF6Ç70¢ÚÚ&VÜñÊBFÜR6Bó266VÊW'í¬ˆÊRFÜB76W2ñ‚g&ˆÁBˆbÜW"ó2&ˆˆ“‡¢ÚÚ‚‚ÊÊBÊVóFÜW"FˆW2óG2vVFÜW"‚FÜR÷VF˜w2G&ó6ˆÊFVÁ6Fñˆ‚ˆfbFÜVó ¢ÚÚ&ˆˆc≤ñÊFˆ˜'2FÜBWB6ˆ∆B&«VRG&˜∆WG2Fá&˜VvÇ∆◊∆óBv˜&∑6Ü˜¬fófP¢ÚÚ&«W'&VBG&w2g&÷Rˆb‚VffV7BFÜB&V∆ˆÊw2FÚ∆6R6ÜRó2Ê˜Bñ‚‡¢ñbÇáGóVˆbó4ÜW&Ú””“vgVÊ7Fñˆ‚rbbó4ÜW&ÚÇííbbÑrÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÊñÊFˆ˜"íê¢G&t6Vñ≈vVFÜW"ÑrÁ&ˆˆ‘FVbÁ¶ˆÊRì∞¢ÚÚDÑR$DtR$TƒÙ‰u2î‚DÑRt‘RDÙÚ‚óBv2ˆÊ«íWfW"G&v‚˜fW"FÜR˜VÊñÊp¢ÚÚfñ∆“¬6Ú∆ñW"vÜ˜6RVFñÚÊWfW"VÊ∆ˆ6∂VB(	BÁñˆÊRˆ‚6ˆÁG&ˆ∆∆W"(	@¢ÚÚ&V6ÜVBFÜRv÷RÊBf˜VÊBóB6ñ∆VÁB¬vóFÇÊ˜FÜñÊrˆ‚67&VV‚Wá∆ñÊñÊp¢ÚÚváí˜"vÜBFÚFÚ‚óBG&w2óG6V∆bˆÊ«ívÜñ∆R6˜VÊBó27GV∆«í∆ˆ6∂VB‡†¢∆ñváE72Öì∞¢ñbÑrÊf∆6Ç‚í∞¢2Êfñ∆≈7Gñ∆R“w&v&É#SR√#SR√#SR¬r≤ÑrÊf∆6Ç¢„3"í≤rís∞¢2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢–¢66‰˜fW&∆íÇì∞¢ñbáGóVˆb&W6VÁEv˜&∆B””“vgVÊ7Fñˆ‚rí&W6VÁEv˜&∆BÇì∞ß–¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¢ÚÚDÑRƒîtÖBî‚DÑR$ÙÙ“‡¢Ú¢ÚÚWfW'í6Ü&7FW"ñ‚FÜó2v÷R6'&ñW2óG2˜v‚∆ñváFñÊr¬&∂VBñ‚vÜV‚óBv0¢ÚÚG&v‚˜"&VÊFW&VB¬ÊBÊˆÊRˆbóB∂Ê˜w2vÜW&RóBó27FÊFñÊr‚Ö§B”ìíó2∆ó@¢ÚÚ6ˆˆ¬vÜóFRñ‚FÜRf˜VÊG'í¬vÜW&RWfW'óFÜñÊrV«6Rñ‚g&÷Ró2∆óB'í÷ˆ«FV‡¢ÚÚó&ˆ„≤FÜR&6ÜófRw2÷6ÜñÊW2&R∆óBFÜR6÷RvíFÜWívW&Rñ‚FÜR÷VF˜w2‡¢ÚÚFÜBó2FÜR∆7BFÜñÊr÷∂ñÊrFÜV“&VB27FVBˆÁFÚFÜR66VÊR&FÜW"FÜ‡¢ÚÚ7FÊFñÊrñ‚óB(	B&˜76W2ÜBÜ&BVFvW2¬vÜñ6Çó2fóÜVB¬'WBÊ˜FÜñÊrÜBFÜP¢ÚÚ&ˆˆ“w2∆ñváBˆ‚óB‡¢Ú¢ÚÚGvÚ76W2¬&˜FÇgV∆¬÷g&÷R¬6ÚFÜR'V∆Ró2FÜR6÷Rf˜"WfW'íˆ&¶V7BÊ¢ÚÚ÷GFW"Ü˜róG2'Bv2÷FS†¢Ú¢ÚÚt4Ç◊V«Fó«íñ‚FÜR∂ñÊvFˆ“w2˜v‚6ˆ∆˜W"¬7G&ˆÊvW"F˜v&BFÜRf∆ˆ˜ ¢ÚÚÊBvíg&ˆ“FÜR∆ñváB¬6ÚÊWWG&¬7&óFRó2V∆∆VBñÁFÚFÜP¢ÚÚ&ˆˆ“w2∆WGFRvóFÜ˜WBF˜V6ÜñÊrFÜR'BFÜB÷FRóB‡¢ÚÚ$ƒÙÙ“ÜñvÜ∆ñváG2&∆VVB‚FÜRg&÷Ró27V&VBvñÁ7BóG6V∆bBV'FW ¢ÚÚ&W6ˆ«WFñˆ‚(	BvÜñ6Ç7'W6ÜW2FÜRF&∑2ÊB∆VfW2ˆÊ«ívÜBó0¢ÚÚvVÁVñÊV«í'&ñváB(	B&«W'&VB¬ÊBFFVB&6≤‚Ê˜rFÜR∆f˜W"¬ÜW ¢ÚÚfó6˜"ÊBFÜR7'ó7F¬6V◊27GV∆«íV÷óBñÁ7FVBˆb÷W&V«í&VñÊp¢ÚÚ∆ñváB÷6ˆ∆˜W&VB‡¢Ú¢ÚÚ&˜FÇ&RvFVBˆ‚FÜR6÷Rg&÷R'VFvWB2FÜR&6∂w&˜VÊBw2FWFÇ∆FS¢¢ÚÚ&WGFñW"ñ7GW&Ró2ÊWfW"FÜR&V6ˆ‚FÜRv÷R7F˜2fVV∆ñÊrvˆˆB‡¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¶6ˆÁ7B§Ù‰UÙƒîtÖB“∞¢¢≤v6É¢≥#¬ì¬sU“¬≥¢„b¬g&ˆ”¢„Ç“¬ÚÚ67&÷VF˜w2(	BFVBFñ∆ñvá@¢#¢≤v6É¢≥¬S¬#“¬≥¢„Ç¬g&ˆ”¢„R“¬ÚÚFF6ˆÊGVóG2(	B67&VV‚÷&«VP¢3¢≤v6É¢≥#SR¬S¬s“¬≥¢„3¬g&ˆ”¢„C"“¬ÚÚFÜRf˜VÊG'í(	B÷ˆ«FV‚ó&ˆ‡¢C¢≤v6É¢≥C¬ì¬#3U“¬≥¢„#b¬g&ˆ”¢„R“¬ÚÚg&˜¶V‚&6ÜófW2(	Bñ6R∆ñvá@¢S¢≤v6É¢≥#3¬ì¬“¬≥¢„#Ç¬g&ˆ”¢„R“¬ÚÚFÜRfó'W2ÊW7B(	BñÊfV7Fñˆ‚&V@¢É¢≤v6É¢≥#¬C¬#3U“¬≥¢„#B¬g&ˆ”¢„R“¬ÚÚ7'ó7F¬66ÜR(	B&ó6“v∆˜pß”∞¢ÚÚ%EÙ$î$ƒR*sí„DÖ$TR’ƒ‰Rd≈TRƒrÊB*sí„BDÑREtÚ‘4ÙƒıU"45$ïB‡¢Ú¢ÚÚGvÚ6ˆ◊˜6óFW2˜fW"FÜRf"∆ÊRˆÊ«í¬ÊB&WGvVV‚FÜV“FÜWí&RFÜRvÜˆ∆P¢ÚÚˆbFÜRW&ñ¬W'7V7FófRFÜó2v÷RÊWfW"ÜC†¢Ú¢ÚÚ‚DU4EU$DR‚w&Wí∆FRñ‚w6GW&Fñˆ‚r÷ˆFRV∆«2FÜR&6∂w&˜VÊBw0¢ÚÚ6á&ˆ÷F˜v&BóG2˜v‚«V÷ñÊÊ6R‚FÜó2ó2FÜRÜ∆bFÜB÷GFW'2÷˜7B(	@¢ÚÚFW7G2ˆw&÷÷"Ê6ß2÷V7W&VBFÜR&6∂w&˜VÊB2‘ı$R6GW&FVBFÜ‚FÜP¢ÚÚ∆ñ&∆R∆ÊRñ‚WfW'í&ˆˆ“6◊∆VB¬vÜñ6Çó2WÜ7F«í&6∑v&G2¬Ê@¢ÚÚó2váíÊ˜FÜñÊrñ‚FÜR67B6˜V∆B˜vóFÜ˜WB˜'BÇí6Ü˜WFñÊr‡¢ÚÚ"‚D$¥T‚≤Ñ§R‚◊V«Fó«íF˜v&BFÜR¶ˆÊRw26ÜF˜r¬FÜV‚FÜñ‚fVñ¬ˆ`¢ÚÚFÜR¶ˆÊRw2∆ñváBˆ‚F˜‚FÜRfVñ¬ó2vÜB7F˜2FÜRF&∂VÊVB&6∂w&˜VÊ@¢ÚÚ&VFñÊr2÷W&V«íVÊFW&Wá˜6VC¢Ü¶R∆ñgG2FÜR&∆6∑22óB&V÷˜fW0¢ÚÚ6ˆÁG&7B¬vÜñ6Çó2vÜBFó7FÊ6R7GV∆«íFˆW2FÚñ7GW&R‡¢Ú¢ÚÚóBó2FV∆ñ&W&FV«í‰ıBˆ‚FÜR&ñ6Ñ≤'VFvWB‚∆ñváE72ó2«WáW'íÊBG&˜0¢ÚÚfó'7C≤FÜó2ó2FÜRg&÷Rw2FWFÇ7G'V7GW&R¬ÊBg&÷RFÜB∆˜6W2óBFˆW0¢ÚÚÊ˜B∆ˆˆ≤6ÜVW"¬óB∆ˆˆ∑2f∆B‚FÜBv2FÜR*sfñÊFñÊrñ‚FÜRFV&F˜v„†¢ÚÚFÜRˆÊRFÜñÊrÜˆ∆FñÊrFÜRñ7GW&RFˆvWFÜW"v2FÜRfó'7BFÜñÊr7vóF6ÜVBˆfb‡¢ÚÚ÷V‚«V÷ñÊÊ6RÊB÷V‚6GW&Fñˆ‚ˆbvÜFWfW"ó27W'&VÁF«íˆ‚FÜR6Áf2¿¢ÚÚ‚„V6Ç‚W6VBˆÊ«í'íFÜR∆ÊR&ˆ&R&˜fRÊB'íFW7G2ˆw&÷÷"Ê6ß2‡¢ÚÚ6÷R7FFó7Fñ72˜fW"‚ˆfg67&VV‚∆ñW"¬ñvÊ˜&ñÊróG2G&Á7&VÁBóÜV«2(	@¢ÚÚFW'&ñ‚ó2÷˜7F«íÜˆ∆W2¬ÊB6˜VÁFñÊrFÜV“2&∆6≤÷∂W2Áí6ˆ∆ñB∆ˆˆ≤Fñ“‡¶gVÊ7Fñˆ‚∆ñW%7FG2Ü7bí∞¢6ˆÁ7B7Ç“7bÊvWD6ˆÁFWáBÇs&Brì∞¢6ˆÁ7Bñ““7ÇÊvWDñ÷vTFFÉ¬¬7bÁvñGFÇ¬7bÊÜVñváBíÊFF∞¢∆WB¬“¬2“¬‚“∞¢f˜"Ü∆WBí“≤í¬7bÊÜVñváC≤í≥“2í∞¢f˜"Ü∆WBÇ“≤Ç¬7bÁvñGFÉ≤Ç≥“2í∞¢6ˆÁ7Bí“Çáí¢7bÁvñGFÇ≤Çí√¬"ì∞¢ñbÜñ’∂í≤5“¬cí6ˆÁFñÁVS∞¢6ˆÁ7B"“ñ’∂ï“¬r“ñ’∂í≤“¬"“ñ’∂í≤%”∞¢¬≥“É„##b¢"≤„sS"¢r≤„s#"¢"íÚ"„SS∞¢6ˆÁ7B◊Ç“÷FÇÊ÷Çá"¬r¬"í¬÷‚“÷FÇÊ÷ñ‚á"¬r¬"ì∞¢ÚÚ%4Ù≈UDR6á&ˆ÷á7&VB˜fW"FÜRgV∆¬&ÊvRí¬Ê˜B&V∆FófRFÚFÜP¢ÚÚ'&ñváFW7B6ÜÊÊV¬‚&V∆FófR6á&ˆ÷ó2ÊˆÁ6VÁ6Rˆ‚F&≤óÜV«2(	B¢ÚÚÊV"÷&∆6≤&v"É3√"√Bí66˜&W2Ér(	BÊBFÜB'FVf7Bó2vÜB÷FRFÜP¢ÚÚf˜VÊG'í∆ˆˆ≤∆ñ∂RóBv2ñvÊ˜&ñÊrFW6GW&Fñˆ‚72FÜBv2ñ‚f7@¢ÚÚv˜&∂ñÊs¢FÜR72÷˜fVBFÜRÁV÷&W'2&&V«íB∆¬7&˜72f˜W&fˆ∆@¢ÚÚ6ÜÊvRñ‚7G&VÊwFÇ¬vÜñ6Çó2FÜR6ñvÊGW&Rˆb'&ˆ∂V‚÷V7W&V÷VÁ@¢ÚÚ&FÜW"FÜ‚7GV&&˜&‚g&÷R‡¢2≥“ÇÜ◊Ç“÷‚íÚ#SRí¢∞¢‚≤≥∞¢–¢–¢&WGW&‚‚Ú≤«V”¢¬Ú‚¬6C¢2Ú‚“¢ÁV∆√∞ß–†¶gVÊ7Fñˆ‚g&÷U∆ÊU7FG2Çí∞¢6ˆÁ7Bñ““2ÊvWDñ÷vTFFÉ¬¬ìc¬SCíÊFF∞¢∆WB¬“¬2“¬‚“∞¢f˜"Ü∆WBí“≤í¬SC≤í≥“Bí∞¢f˜"Ü∆WBÇ“≤Ç¬ìc≤Ç≥“Bí∞¢6ˆÁ7Bí“áí¢ìc≤Çí√¬#∞¢6ˆÁ7B"“ñ’∂ï“¬r“ñ’∂í≤“¬"“ñ’∂í≤%”∞¢¬≥“É„##b¢"≤„sS"¢r≤„s#"¢"íÚ"„SS∞¢6ˆÁ7B◊Ç“÷FÇÊ÷Çá"¬r¬"í¬÷‚“÷FÇÊ÷ñ‚á"¬r¬"ì∞¢2≥“ÇÜ◊Ç“÷‚íÚ#SRí¢≤ÚÚ%4Ù≈UDR6á&ˆ÷¢6VR∆ñW%7FG0¢‚≤≥∞¢–¢–¢&WGW&‚≤«V”¢¬Ú‚¬6C¢2Ú‚”∞ß–†¢ÚÚ*s„rf˜"FÜRd"ƒ‰R‚FÜRÁFí◊Fñ∆ñÊrv˜&≤ñ‚FÜRFñ∆R∆ñW"FñBÊ˜FÜñÊp¢ÚÚf˜"#BÊB32&V6W6RFÜVó"3'ÇWFˆ6˜'&V∆Fñˆ‚v2ÊWfW"ñ‚FÜRFW'&ñ‚(	@¢ÚÚóBó2FÜR&6∂G&˜G&vñÊrFÜR6÷R÷˜FñbWfW'íFñ∆RóF6Ç‚FÜR&6∂w&˜VÊ@¢ÚÚó2&VG&v‚WfW'íg&÷R¬6ÚW"◊óÜV¬v˜&≤FÜW&Ró2Ê˜Bff˜&F&∆S≤÷˜GF∆P¢ÚÚ&∂VBÙ‰4RÊB6ˆ◊˜6óFVBó2‚óG2fVGW&W2&RFV∆ñ&W&FV«í6ó¶VBˆfbFÜP¢ÚÚFñ∆RóF6ÇÉ¬í¬#óÇí6ÚóB6ÊÊ˜B&VñÊf˜&6RFÜRFÜñÊróBó2'&V∂ñÊr‡¶∆WB&t÷˜GF∆T7b“ÁV∆√∞¶gVÊ7Fñˆ‚&t÷˜GF∆RÇí∞¢ñbÜ&t÷˜GF∆T7bí&WGW&‚&t÷˜GF∆T7c∞¢6ˆÁ7B7b“Fˆ7V÷VÁBÊ7&VFTV∆V÷VÁBÇv6Áf2rì∞¢7bÁvñGFÇ“ìc≤7bÊÜVñváB“SC∞¢6ˆÁ7BÇ“7bÊvWD6ˆÁFWáBÇs&Brì∞¢ÇÊfñ∆≈7Gñ∆R“w&v"É#Ç√#Ç√#Çís∞¢ÇÊfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢f˜"Ü∆WBí“≤í¬S#≤í≤≤í∞¢6ˆÁ7BÉ"“Ü6É"Üí¬cí¢ìc¬ì"“Ü6É"Üí¬crí¢SC∞¢6ˆÁ7B"“≤Ü6É"Üí¬sí¢É∞¢6ˆÁ7BW“Ü6É"Üí¬s2í¬„S∞¢6ˆÁ7Br“ÇÊ7&VFU&Fñƒw&FñVÁBáÉ"¬ì"¬¬É"¬ì"¬"ì∞¢6ˆÁ7Bb“WÚcÇ¢ì#∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&Çr≤b≤r¬r≤b≤r¬r≤b≤r√„SRírì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&É#Ç√#Ç√#Ç√írì∞¢ÇÊfñ∆≈7Gñ∆R“s∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ&2áÉ"¬ì"¬"¬¬rì≤ÇÊfñ∆¬Çì∞¢–¢ÚÚ‚‚‰‰B4T4Ù‰BƒîU"B45$TT‚44ƒR¬&V6W6RFÜRfó'7BˆÊR6ÊÊ˜B&V6Ä¢ÚÚFÜRfñ«W&RóBó2ñ÷VBB‚&∆ˆ'2”#óÇvñFR'&V≤3'ÇóF6ÇÊBF¢ÚÚW76VÁFñ∆«íÊ˜FÜñÊrFÚ÷F6Çf˜VÊBÉcáÇ'B(	BFÜRWFˆ6˜'&V∆Fñˆ‡¢ÚÚFW7B6∆ñFW2óG2F6Ç7&˜72FÜRtÑÙƒR67&VV‚¬ÊBBFÜB&ÊvRGv¢ÚÚ7G&WF6ÜW2ˆb&6∂G&˜&RFˆ∆B'B'í'&ˆBFˆÊ¬G&ñgB˜"Ê˜BB∆¬‡¢ÚÚ6Û¢ÜÊFgV¬ˆbfW'í∆&vR¬fW'í∆˜r÷6ˆÁG&7B∆ˆ&W2¬6ó¶VB6ÚÊÚGv¢ÚÚ'G2ˆbˆÊR67&VV‚6óBBFÜR6÷R'&ñváFÊW72‚óBó2«6Ú6ñ◊«íÜ˜r¢ÚÚñÁFVB&6∂G&˜&VÜfW2(	B∆ñváBˆˆ«2ÊBf∆«2ˆfb7&˜72Ü∆¬‡¢f˜"Ü∆WBí“≤í¬#c≤í≤≤í∞¢6ˆÁ7BÉ"“Ü6É"Üí¬3í¢“s¬ì"“Ü6É"Üí¬3rí¢cC“S∞¢6ˆÁ7B"“ì≤Ü6É"Üí¬3íí¢C∞¢6ˆÁ7BW“Ü6É"Üí¬Cíí¬„S∞¢6ˆÁ7Br“ÇÊ7&VFU&Fñƒw&FñVÁBáÉ"¬ì"¬¬É"¬ì"¬"ì∞¢6ˆÁ7Bb“WÚS"¢C∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&Çr≤b≤r¬r≤b≤r¬r≤b≤r√„C"írì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&É#Ç√#Ç√#Ç√írì∞¢ÇÊfñ∆≈7Gñ∆R“s∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ&2áÉ"¬ì"¬"¬¬rì≤ÇÊfñ∆¬Çì∞¢–¢&t÷˜GF∆T7b“7c∞¢&WGW&‚7c∞ß–†¢ÚÚ%EÙ$î$ƒR*sí„(	BDÑRUDÑı$TBDUDÇƒ‰U2áF6≤3sbí‚GvÚ7G&ó2W"¶ˆÊS†¢ÚÚVFvUÚó2FÜR÷ñB∆ÊR¬FÜR&ÊB6ÜR7FÊG2ˆ‚¬G&v‚$TÑî‰BFÜR67C≤f˜&U¢ÚÚó2FÜRÊV"∆ÊRÊBG&w2ñ‚e$ÙÂBˆbÜW"‚&WGvVV‚FÜV“FÜWí&RvÜB÷∂W0¢ÚÚf∆ˆ˜"7F˜&VFñÊr2&"¬ÊBFÜR&V6ˆ‚ó2f«VR&FÜW"FÜ‚6ÜR(	@¢ÚÚFÜR&ˆ6VGW&¬f∆ˆ˜"6BvóFÜñ‚fWrˆñÁG2ˆbFÜR&6∂G&˜óBv27W˜6V@¢ÚÚFÚ7FÊB6∆V"ˆb¬ÊBÊÚ÷˜VÁBˆb6ñ∆Ü˜VWGFRv˜&≤fóÜW2FÜB‡¢Ú¢ÚÚ&∆∆Çó2FÜRˆñÁBˆbÜfñÊrGvÛ¢FÜR÷ñB∆ÊR67&ˆ∆«26∆˜vW"FÜ‚FÜP¢ÚÚv˜&∆BÊBFÜRf˜&R∆ÊRf7FW"¬6ÚFÜWí6W&FR26ÜR÷˜fW2&FÜW"FÜ‡¢ÚÚˆÊ«íñ‚7Fñ∆¬g&÷R‡¶∆WBf∆ˆ˜$Ê6Ü˜%&ˆˆ““ÁV∆¬¬f∆ˆ˜$Ê6Ü˜%í“∞¶gVÊ7Fñˆ‚&ˆˆ‘f∆ˆ˜$Ê6Ü˜"Üf∆∆&6µv˜&∆Eíí∞¢ñbÜf∆ˆ˜$Ê6Ü˜%&ˆˆ“””“rÁ&ˆˆ‘ñBí&WGW&‚f∆ˆ˜$Ê6Ü˜%ì∞¢∆WBb“f∆∆&6µv˜&∆Eì∞¢6ˆÁ7B7W"“áGóVˆb7W&f6T7W'fR””“vgVÊ7Fñˆ‚ríÚ7W&f6T7W'fRÇí¢ÁV∆√∞¢ñbÜ7W"bb7W"Á&rí∞¢6ˆÁ7Bó2“µ”∞¢f˜"Ü∆WBí“≤í¬7W"‰„≤í≤≤í≤6ˆÁ7Bí“7W"Á&u∂ï”≤ñbÇó4Ê‚áíííó2ÁW6Çáíì≤–¢ñbáó2Ê∆VÊwFÇí≤ó2Á6˜'BÇÜ¬"í”‚“"ì≤b“ó5∑ó2Ê∆VÊwFÇ„‚”≤–¢–¢f∆ˆ˜$Ê6Ü˜%&ˆˆ““rÁ&ˆˆ‘ñC≤f∆ˆ˜$Ê6Ü˜%í“c∞¢&WGW&‚c∞ß–¶gVÊ7Fñˆ‚G&tFWFÖ∆ÊRÜ∂ñÊBí∞¢6ˆÁ7B¶ˆÊR“rÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÁ¶ˆÊS∞¢ñbÇ¶ˆÊRí&WGW&„∞¢6ˆÁ7B∂Wí“∂ñÊB≤¶ˆÊS∞¢ñbáGóVˆb÷VFñfWF6Ç””“vgVÊ7Fñˆ‚rí÷VFñfWF6ÇÜ∂Wíì∞¢6ˆÁ7Bñ““GóVˆb‘TDîÙî‘r”“wVÊFVfñÊVBrbb‘TDîÙî‘u∂∂Wï”∞¢ñbÇñ“«¬ñ“ÊÊGW&≈vñGFÇí&WGW&„∞¢6ˆÁ7BÊV"“∂ñÊB””“vf˜&Rs∞¢ÚÚDÑRDıT$ƒRdƒÙı"‚FÜR÷ñB∆FRW6VBFÚ6óBB„É"&∆∆ÇvóFÇóG2w&˜VÊ@¢ÚÚ&ÊBßW7B&˜fRFÜRv∆≤∆ñÊR¬vÜñ6Ç÷FRóB&VB24T4Ù‰BdƒÙı"(	Bó@¢ÚÚ6'&ñW2&ñ¬'V‚ÊBw&˜VÊBVFvRˆbóG2˜v‚¬6ÚFÜR∆ñW"6rvgê¢ÚÚ˜&vÊñ2f∆ˆ˜"ÊBf∆BˆÊRÊB6˜V∆BÊ˜BFV∆¬vÜñ6Çv2ÜW'2‚7W&W76ñÊp¢ÚÚFÜRFWFÇ∆ÊW2ÊB&R◊6Üˆ˜FñÊrFÜR6÷R&ˆˆ“&˜fVBóC¢ˆÊRf∆ˆ˜"¿¢ÚÚVÊ÷ó7F∂&«í˜&vÊñ2¬FÜR÷ˆ÷VÁBFÜó2∆FRv2ˆfb‡¢Ú¢ÚÚóBó2Ê˜BFV∆WFVB¬&V6W6RFÜR%Bó2&ñváBÊBFÜR'V∆Ró2&˜WBDUDÉ†¢ÚÚ&6∂w&˜VÊB6ÜW2&V∆ˆÊrñ‚FÜR&6∂G&˜¬Ê˜BBFÜR∆ñW"w2∆ÊR‚6ÚFÜP¢ÚÚ÷ñB∆FR÷˜fW2&6≤FÚvÜW&RóBó266VÊW'í(	BÜ∆bFÜR&∆∆Ç¬6÷∆∆W"¿¢ÚÚFñ÷÷VB¬ÊB∆ñgFVB6ÚóG2˜v‚w&˜VÊB∆ñÊR6óG2vV∆¬$ıdRÜW'2ÊB6‡¢ÚÚÊWfW"&R÷ó7F∂V‚f˜"6ˆ÷WFÜñÊr6ÜR6˜V∆B7FÊBˆ‚‡¢6ˆÁ7B"“ÊV"Ú„b¢„C#∞¢6ˆÁ7B66∆R“ÜÊV"Ú„Cb¢„S"í¢SCÚñ“ÊÊGW&ƒÜVñváC∞¢6ˆÁ7Br“ñ“ÊÊGW&≈vñGFÇ¢66∆R¬Ç“ñ“ÊÊGW&ƒÜVñváB¢66∆S∞¢ÚÚ‰4Ñı"DÚDÑR$ÙÙ“u2dƒÙı"¬‰ıBDÚDÑRdîUuı%B‚Ê6Ü˜&ñÊrFÚFÜR&˜GFˆ“ˆ`¢ÚÚFÜR67&VV‚WG2FÜR7&W7BvÜW&WfW"FÜR6÷W&ÜVÁ2FÚ&R¬6Ú6ÜR7Fˆˆ@¢ÚÚ&V∆˜rÜW"˜v‚w&˜VÊB‚FÜRf∆ˆ˜"ó2FÜR∆˜vW7B&˜rFÜRw&ñB7GV∆«í6∆«0¢ÚÚ6ˆ∆ñC≤FÜR÷ñB∆ÊRw27&W7BvˆW2ˆ‚óG2F˜VFvR¬ÊBFÜRÊV"∆ÊR6óG0¢ÚÚ∆óGF∆R&V∆˜rFÜB6ÚóB7&˜76W2ÜW"6ÜñÁ2&FÜW"FÜ‚ÜW"ÜVB‡¢∆WBf∆ˆ˜%í“SC∞¢6ˆÁ7Br“rÊw&ñC∞¢ñbÜrbbrÊ∆VÊwFÇí∞¢f˜"Ü∆WBGí“rÊ∆VÊwFÇ“≤Gí„“≤Gí““í∞¢∆WB‚“∞¢f˜"Ü∆WBGÇ“≤GÇ¬u∑Gï“Ê∆VÊwFÉ≤GÇ≤≤í∞¢6ˆÁ7B6Ç“u∑Gï’∑GÖ”∞¢ñbÜ6Ç””“r2r«¬6Ç””“t"r«¬6Ç””“s“rí‚≤≥∞¢–¢ñbÜ‚‚u∑Gï“Ê∆VÊwFÇ¢„Rí≤f∆ˆ˜%í“Gí¢DîƒR“6’5íÇì≤'&V≥≤–¢–¢–¢ÚÚ‚‚‰%UBDÑR‰4Ñı"ï2DÑR5U$d4R4ÑRtƒµ2Ù‚¬Ê˜BFÜR&ˆˆ“w2∆˜vW7B6ˆ∆ñ@¢ÚÚ&˜r¬ÊBFÜRFñffW&VÊ6Ró2FÜRvÜˆ∆R&V6ˆ‚FÜRÊV"∆FRFñBÊ˜FÜñÊr‡¢Ú¢ÚÚ÷V7W&VBñ‚¢FÜR∆˜vW7B„SR◊6ˆ∆ñB&˜rWBf∆ˆ˜%íBSÇvÜñ∆RÜW"fVW@¢ÚÚvW&RBCS"‚FÜRÊV"∆FRw2F˜VFvRFÜW&Vf˜&R∆ÊFVBBCSB(	BEtÚïÑT≈0¢ÚÚ$TƒırÑU"4ÙƒU2(	B6ÚFÜRˆÊRˆ&¶V7Bñ‚FÜR66VÊRvÜ˜6RVÁFó&R¶ˆ"ó2F¢ÚÚ7&˜72ñ‚e$ÙÂBˆbÜW"G&Wr&∆6≤&ÊBVÊFW"ÜW"fVWBñÁ7FVB¬ÊB6ÜR6÷P¢ÚÚ˜WB2FÜRg&ˆÁF÷˜7BFÜñÊr7FVBˆÁFÚñÁFñÊr‚FÜBó2FÜR'6ÜR∆ˆˆ∑0¢ÚÚ∆ñ∂R6ÜRó2ñ‚FÜR&6∂w&˜VÊB"&W˜'B¬ÊBÊÚ÷˜VÁBˆb'BfóÜW2óB‡¢Ú¢ÚÚFÜRv∆≤7W&f6Ró2FÜR‘TDî‚ˆbFÜR7W'fRw2˜v‚Fñ∆RF˜2¬F∂V‚ˆÊ6RW ¢ÚÚ&ˆˆ“‚÷VFñ‚&FÜW"FÜ‚FÜRf«VRVÊFW"FÜR6÷W&¢6◊∆ñÊr∆ófRv˜V∆@¢ÚÚÜÊBFÜRf˜&Vw&˜VÊBFÜRFW'&ñ‚w2&ˆ∆¬ÊB÷∂RóB&ˆ"26ÜRv∆∑2¬ÊB¢ÚÚ&6∂w&˜VÊBFÜB÷˜fW2fW'Fñ6∆«ívóFÇFÜR∆ñW"ó2v˜'6RFÜ‚ˆÊRñ‚FÜP¢ÚÚw&ˆÊr∆6R‚óG2ÊBÜñvÇ∆VFvW2&R˜WGf˜FVB¬vÜñ6Çó2vÜB÷VFñ‚ó0¢ÚÚf˜"(	BFÜRÁ7vW"vÁFVBó2&Ü˜rÜñvÇó2FÜRw&˜VÊBñ‚FÜó2&ˆˆ“"‡¢f∆ˆ˜%í“&ˆˆ‘f∆ˆ˜$Ê6Ü˜"Üf∆ˆ˜%í≤6’5íÇíí“6’5íÇì∞¢ÚÚFÜR÷ñB∆FRó2$‰BvÜ˜6R∆˜vW"'B÷VWG2FÜRf∆ˆ˜"ÊBvÜ˜6RWW ¢ÚÚ'Bó2FÜRw&V6≤7FÊFñÊr&VÜñÊBóB¬6Ú÷˜7BˆbóB&V∆ˆÊw2$ıdRFÜRv∆∞¢ÚÚ∆ñÊR‚Ê6Ü˜&ñÊróB&V∆˜rWBFÜRvÜˆ∆R∆FRVÊFW"FÜRFñ∆R∆ñW"ÊB∆Vg@¢ÚÚˆÊ«í6∆ófW"ˆbv∆˜r6Ü˜vñÊr‚FÜRÊV"∆FRó2FÜR˜˜6óFS¢óBÜÊw2ˆf`¢ÚÚFÜR&˜GFˆ“ˆbFÜRg&÷RÊBˆÊ«íóG2F˜˜WF∆ñÊR6Ü˜V∆B&Rñ‚6Ü˜B‡¢6ˆÁ7Bí“ÊV"Úf∆ˆ˜%í“Ç¢„#"¢f∆ˆ˜%í“Ç¢„#≤ÚÚ÷ñC¢gV∆«í&˜fRÜW"∆ñÊP¢∆WBÇ““ÇÜ6“ÁÇ¢"íRrì∞¢ñbáÇ‚íÇ”“s∞¢ÚÚ‘ï%$ı"UdU%íıDÑU"5D’‚FÜó2∆FRó2ˆÊRñÁFñÊr&WVFVB∆ˆÊrFÜP¢ÚÚ&ˆˆ“¬ÊBBóG2˜v‚vñGFÇóB&WVFVBîÂ4îDR6ñÊv∆R67&VV‚(	BFÜRWÜ7@¢ÚÚÉcáÇ÷F6ÇFW7G2ˆw&÷÷"Ê6ß2∂WB&W˜'FñÊrñ‚FÜRf˜VÊG'í¬vÜñ6Çó2FÜP¢ÚÚ∆FRw2vñGFÇÊBÊ˜FÜñÊrV«6R‚f∆óñÊr«FW&ÊFR7F◊2F˜V&∆W2FÜP¢ÚÚW&ñˆB7B67&VV‚f˜"g&VRÊB6ÊÊ˜B˜V‚6V”¢÷ó'&˜&VB6˜ê¢ÚÚ÷VWG2FÜRˆÊR&Vf˜&RóB∆ˆÊrFÜR6÷RVFvRóÜV«2¬6ÚFÜR¶ˆñ‚ó0¢ÚÚ6ˆÁFñÁV˜W2'í6ˆÁ7G'V7Fñˆ‚‚FÜRñÊFWÇó2F∂V‚g&ˆ“FÜRtı$ƒB¬Ê˜Bg&ˆ–¢ÚÚFÜR∆ˆ˜¬6ÚvÜñ6Ç7F◊2&R÷ó'&˜&VBFˆW2Ê˜B6ÜÊvR26ÜRv∆∑2‡¢∆WB≤“÷FÇÁ&˜VÊBÇÜ6“ÁÇ¢"≤ÇíÚrì∞¢2Á6fRÇì∞¢ñbÇÊV"í2Êv∆ˆ&ƒ«Ü“„ìS∞¢6ˆÁ7BvB“÷FÇÊ6Vñ¬árí¬ÜB“÷FÇÊ6Vñ¬ÜÇí¬í“÷FÇÁ&˜VÊBáíì∞¢f˜"É≤Ç¬ìc≤Ç≥“r“¬≤≤≤í∞¢6ˆÁ7BÇ“÷FÇÁ&˜VÊBáÇì∞¢ñbÇÜ≤bí””“í≤2ÊG&tñ÷vRÜñ“¬Ç¬í¬vB¬ÜBì≤6ˆÁFñÁVS≤–¢2Á6fRÇì∞¢2ÁG&Á6∆FRÖÇ≤vB¬íì∞¢2Á66∆RÇ”¬ì∞¢2ÊG&tñ÷vRÜñ“¬¬¬vB¬ÜBì∞¢2Á&W7F˜&RÇì∞¢–¢2Á&W7F˜&RÇì∞¢2Êv∆ˆ&ƒ«Ü“∞ß–†¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¢ÚÚDÑRD$≤¬‰BDÑRƒîtÖE2DÑB$RDÑRÙ‰≈í‘Ùbï@¢Ú¢ÚÚv˜&∆BÊß26∆«2FÜR7'ó7F¬6fR'FÜR∆ˆÊrF&≤"ÊB6ó2ˆbóG2f"VÊ@¢ÚÚ'FÜRñ∆∆"4Ñî‰î‰rBFÜRVÊBˆbFÜRF&≤(	BFÜR6ÜñÊRó2FÜRwVñFR"‚ó@¢ÚÚv2∆óB∆ñ∂R6˜'&ñF˜"vóFÇFÜR∆ñváG2ˆ‚‚Ê˜FÜñÊrñ‚óB6˜V∆B&RwVñFR¿¢ÚÚ&V6W6RWfW'óFÜñÊrv2WV∆«ífó6ñ&∆S¢FÜR&V6ˆ‚FW&÷ñÊ¬6ÜRó2÷VÁBF¢ÚÚv∆≤6óáGíFñ∆W2F˜v&Bv26óÇóÜV«2ˆb÷&W"ñ‚gV∆«í∆óB÷vVÁF¢ÚÚ&ˆˆ“¬ÊBFÜR'W&ñVB'&Ê6ÇñÁFÚFÜR6V“v2WÜ7F«í2∆Vvñ&∆R2FÜRvê¢ÚÚˆ‚‚FÜR˜vÊW"6∂VBf˜"GVÊÊV¬FÜBó2'&ñ6Çñ‚WáW&ñVÊ6R#≤GVÊÊV¬ó0¢ÚÚÊ˜B&ñ6Ç&V6W6RóBÜ2÷˜&RgW&ÊóGW&Rñ‚óB¬óBó2&ñ6Ç&V6W6Ró@¢ÚÚvóFÜÜˆ∆G2¬ÊB∆ñváFñÊró2FÜRˆÊ«íFÜñÊrñ‚6ñFR◊67&ˆ∆∆W"FÜB6‡¢ÚÚvóFÜÜˆ∆BÊB7Fñ∆¬&Rfó"‡¢Ú¢ÚÚ6ÚFÜR6fRvWG2óG2F&≤&6≤¬ÊB∆ñváB&V6ˆ÷W2ñÊf˜&÷Fñˆ„†¢Ú¢ÚÚ4ÑR4%$îU2Ù‰R‚∆◊&˜VÊBFÜR&ˆGíFÜB'&VFÜW2vóFÇÜW"6˜&RÊ@¢ÚÚdƒ$U2vÜñ∆RFÜR6∆ró26Ü&vVB(	BFÜR6Ü&vRó2Ê˜r∆ñváB6˜W&6R0¢ÚÚvV∆¬2vVˆ‚¬vÜñ6Çó2FÜR6ÜVW7BvˆˆB&V6ˆ‚FÚÜˆ∆BóB‡¢ÚÚDÑR$T4Ù‚ï2DÑRt$‘U5BDÑî‰rDıt‚DÑU$R‚FÜR6˜VÊB6ÜRÜ2fˆ∆∆˜vV@¢ÚÚ6ñÊ6RFÜR÷VF˜rÜ2v∆˜rBFÜRVÊBˆbóBÊ˜r¬ÊBFÜRv∆˜r6'&ñW0¢ÚÚgW'FÜW"FÜ‚FÜRfˆñ6RFˆW2¬6ÚFÜR∆7B7G&WF6ÇˆbFÜR6V&6Çó26VV‡¢ÚÚ&Vf˜&RóBó2ÜV&B‡¢ÚÚDÑRîƒƒ"ï2%$îtÖDU"‰B4ÙƒB¬vÜW&RFÜR&V6ˆ‚ó2Fñ“ÊBv&“¬6ÚFÜP¢ÚÚGvÚVÊG2ˆbFÜRGVÊÊV¬ÊWfW"&VB2FÜR6÷RW'&ÊB‡¢ÚÚDÑR‘ıUDÖ2ƒT≤DîƒîtÖB‚FÜRví&6≤ó2ÊWfW"∆˜7B¬ÊB'W&ñVB÷˜WFÄ¢ÚÚ∆V∑2Ê˜FÜñÊrB∆¬VÁFñ¬óBó2'&ˆ∂V‚˜V‚(	BvÜñ6Çó2FÜR'V&&∆Rw0¢ÚÚ&Wv&B7FFVBñ‚∆ñváBñÁ7FVBˆbñ‚Fˆ7B‡¢ÚÚDÑR$T‰4Ç%U$Â2‚6fRˆñÁBñ˜R6‚6VRg&ˆ“7&˜72F&≤&ˆˆ“ó2¢ÚÚ6fRˆñÁBFÜB6ÜÊvW2Ü˜rñ˜R7VÊBFÜR&ˆˆ“‡¢ÚÚ‰BDÑR‰î‘≈2ÑdRUîU3¢7&v∆W"ó2GvÚV÷&W'2&Vf˜&RóBó2¢ÚÚ7&v∆W"‚FÜBó2FÜRvÜˆ∆RˆñÁBˆb‚VÊ∆óB&ˆˆ“(	BóB÷˜fW2FÜP¢ÚÚñÊf˜&÷Fñˆ‚g&ˆ“FÜR6ñ∆Ü˜VWGFRFÚvÜFWfW"ˆ‚FÜRFÜñÊró2∆óB‡¢Ú¢ÚÚóBó2‘4≤¬Ê˜Bfñ«FW#¢ˆÊRÜ∆b◊&W6ˆ«WFñˆ‚∆FRˆbFÜR¶ˆÊRw2˜v‡¢ÚÚ6ÜF˜rvóFÇÜˆ∆W2VÊ6ÜVBñ‚óB'íFW7FñÊFñˆ‚÷˜WB¬FÜV‚&∆óGFVB&6≤˜fW ¢ÚÚFÜRg&÷R‚FÜBó2fñ∆¬¬ÜÊFgV¬ˆb&Fñ¬w&FñVÁG2BV'FW"&V¿¢ÚÚÊBˆÊR66∆VBG&r(	B6ÜVVÊ˜VvÇFÜBóBó2FV∆ñ&W&FV«í‰ıBˆ‚FÜR&ñ6Ñ∞¢ÚÚ'VFvWBvóFÇFÜR«WáW&ñW2‚F&≤&ˆˆ“vóFÇóG2∆ñváFñÊr7vóF6ÜVBˆfbó2Ê˜@¢ÚÚ6ÜVW"F&≤&ˆˆ“¬óBó2&∆6≤67&VV‚‡¢Ú¢ÚÚFÜRF&≤7F˜2B„É&FÜW"FÜ‚B¢FÜRf"&ˆ6≤7Fó2&VF&∆P¢ÚÚ6ñ∆Ü˜VWGFR¬6ÚFÜR∆ñW"ó2ÊfñvFñÊrFñ“&ˆˆ“&FÜW"FÜ‚w&˜ñÊrñ‡¢ÚÚˆÊR‚&VñÊrVÊ&∆RFÚ6VRFÜRf∆ˆ˜"ó2Ê˜BF÷˜7ÜW&R¬óBó2'VrFÜP¢ÚÚ∆ñW"6ÊÊ˜B&W˜'B‡¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¶6ˆÁ7BD$µÙ≤“„sC≤ÚÚÜ˜r◊V6ÇˆbFÜRVÊ∆óB&ˆˆ“ó2F∂V‡¶6ˆÁ7BD$µÙDB“„C≤ÚÚ‚‚ÊÊBÜ˜rÜ&BFÜR∆◊2WBóB&6≤‡¢ÚÚ÷ˆFW7B¬ÊBóB7Fó2÷ˆFW7B‚FÜRFFóFófR72ó2FÜRtƒır&˜VÊB6˜W&6R¿¢ÚÚÊ˜BFÜRñ∆«V÷ñÊFñˆ‚óG6V∆b(	BFÜRñ∆«V÷ñÊFñˆ‚ó2FÜR6ÜF˜r÷6≤∆ñgFñÊrˆf`¢ÚÚFÜR&ˆ6≤¬vÜñ6Ç∂VW2FÜR&ˆ6≤w2˜v‚FWáGW&R&V6W6RóBó2&∆VÊBÊBÊ˜B¢ÚÚñÁB‚GW&ÊVBWf"VÊ˜VvÇFÚ6''íFÜR∆ñváFñÊrˆ‚óG2˜v‚óB7F˜2&VñÊp¢ÚÚ∆ñváBÊB&V6ˆ÷W2fˆs¢÷V7W&VBB„ìóB&VÊFW&VBFá&VR∆◊22Fá&VP¢ÚÚ÷ñ∆∑íFó672vóFÇÊÚ&ˆ6≤fó6ñ&∆RñÁ6ñFRFÜV“‚6VRFÜRÊ˜FRˆ‚G&r˜&FW"@¢ÚÚFÜR6∆¬6óFRf˜"váíFÜBv2WfW"FV◊FñÊr‡¶6ˆÁ7BD$µıDîÂB“w&v"ÉR√Ç√#Çís≤ÚÚVÊ∆óB7'ó7F¬&ˆ6≤‚ÊWfW"W&R&∆6≥†¢ÚÚ&∆6≤&VG22Üˆ∆Rñ‚FÜR6Áf0¶6ˆÁ7BD$µır“CÉ¬D$µÙÇ“#s≤ÚÚÜ∆b&W2(	B6ˆgB∆ñváBÜ2ÊÚVFvRFÚ∆˜6P¶∆WBF&¥7b“ÁV∆¬¬∆óD7b“ÁV∆√∞¢ÚÚ∆ñváBó2Üˆ∆Rñ‚FÜR6ÜF˜r‰Bv∆˜rFFVB&6≤ˆ‚F˜¬ÊBóBÊVVG0¢ÚÚFÚ&R&˜FÇ‚FÜRfó'7BfW'6ñˆ‚v2FÜRÜˆ∆R∆ˆÊR¬ÊBóBv2÷V7W&&«ê¢ÚÚ6˜'&V7BÊBfó7V∆«íÊ˜FÜñÊs¢7V'G&7FñÊr∆W72F&∂ÊW72g&ˆ“&ˆ6≤FÜBó0¢ÚÚ«&VGíF&≤FˆW2Ê˜B&VB2∆◊¬&V6W6R∆◊ó2Ê˜B‚'6VÊ6Rˆ`¢ÚÚ6ÜF˜r¬óBó26˜W&6R‚FÜRó"ó2FÜRvÜˆ∆RG&ñ6≤(	BFÜR÷6≤FV6ñFW2vÜ@¢ÚÚ6ÜR6‚6VR¬FÜRFFóFófR72FV6ñFW2vÜBóB∆ˆˆ∑2∆ñ∂RvÜV‚6ÜR6‚‡¢ÚÚ‚‚ÊÊB&˜FÇˆbFÜV“&R&∂VBÙ‰4RñÁFÚ#ÇÇ7&óFRÊBFÜW&VgFW ¢ÚÚ&∆óGFVB¬ÊWfW"&7FW&ó6VBvñ‚‚÷V7W&VBˆ‚FÜR6ˆgGv&R&7FW&ó6W"FÜó0¢ÚÚ&WÚFW7G2ˆ„¢FV‚∆ñváG2ÇGvÚ7&VFU&Fñƒw&FñVÁB≤&2≤fñ∆¬W"g&÷P¢ÚÚ6˜7Bí„"◊2¬vÜñ6Çó2cRˆbg&÷R'VFvWB7VÁBˆ‚∆ñváFñÊr÷ˆFV¬FÜ@¢ÚÚó27W˜6VBFÚ&RFÜR6ÜV'B‚&Fñ¬f∆∆ˆfbFˆW2Ê˜B6ÜÊvR6ÜP¢ÚÚ&WGvVV‚∆ñváG2(	BˆÊ«íóG26ó¶R¬óG26ˆ∆˜W"ÊBóG27G&VÊwFÇFÚ¬ÊB∆¿¢ÚÚFá&VR&Rg&VRˆ‚G&tñ÷vRá66∆R¬ˆÊR7&óFRW"6ˆ∆˜W"¬v∆ˆ&ƒ«Üí‡¶6ˆÁ7BƒîtÖEı5"“∑”∞¶∆WB4ÑDıuı5"“ÁV∆√∞¶gVÊ7Fñˆ‚&Fñ≈7&óFRáñÁBí∞¢6ˆÁ7B2“Fˆ7V÷VÁBÊ7&VFTV∆V÷VÁBÇv6Áf2rì∞¢2ÁvñGFÇ“2ÊÜVñváB“#É∞¢6ˆÁ7BÉ"“2ÊvWD6ˆÁFWáBÇs&Brì∞¢6ˆÁ7Br“É"Ê7&VFU&Fñƒw&FñVÁBÉcB¬cB¬¬cB¬cB¬cBì∞¢ñÁBÜrì∞¢É"Êfñ∆≈7Gñ∆R“s≤É"Êfñ∆≈&V7BÉ¬¬#Ç¬#Çì∞¢&WGW&‚3∞ß–¶gVÊ7Fñˆ‚6ÜF˜u7&óFRÇí≤&WGW&‚4ÑDıuı5"«¬Ö4ÑDıuı5"“&Fñ≈7&óFRÜr”‚F&µ7F˜2Ür¬ííì≤–¶gVÊ7Fñˆ‚∆ñváE7&óFRá&v"í≤&WGW&‚ƒîtÖEı5%∑&v%“«¬ÑƒîtÖEı5%∑&v%““&Fñ≈7&óFRÜr”‚∆óE7F˜2Ür¬&v"¬ííì≤–¶gVÊ7Fñˆ‚F&µ7F˜2Ür¬í∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&É√√¬r≤≤rírì∞¢rÊFD6ˆ∆˜%7F˜É„3B¬w&v&É√√¬r≤Ü¢„Ébí≤rírì∞¢rÊFD6ˆ∆˜%7F˜É„cÇ¬w&v&É√√¬r≤Ü¢„3Bí≤rírì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&É√√√írì∞ß–¶gVÊ7Fñˆ‚∆óE7F˜2Ür¬&v"¬í∞¢ÚÚFñváB6˜&R¬∆ˆÊrFñ¬‚∆ñváBvóFÇ∆ñÊV"f∆∆ˆfb&VG22w&WíFó60¢ÚÚ7FVBˆ‚FÜR&ˆˆ”≤FÜRWñRˆÊ«í66WG2óB26˜W&6RvÜV‚FÜR÷ñFF∆Ró0¢ÚÚ◊V6ÇÜ˜GFW"FÜ‚FÜRVFvR‡¢rÊFD6ˆ∆˜%7F˜É¬w&v&Çr≤&v"≤r¬r≤≤rírì∞¢rÊFD6ˆ∆˜%7F˜É„3¬w&v&Çr≤&v"≤r¬r≤Ü¢„sí≤rírì∞¢rÊFD6ˆ∆˜%7F˜É„c"¬w&v&Çr≤&v"≤r¬r≤Ü¢„#Bí≤rírì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&Çr≤&v"≤r√írì∞ß–¢ÚÚFÜR∆ñváG2ñ‚FÜR&ˆˆ“¬ñ‚v˜&∆B6ˆ˜&FñÊFW2¬vFÜW&VBˆÊ6RÊB7VÁBGvñ6R‡¢ÚÚ"v˜&∆B◊óÜV¬&V6Ä¢ÚÚÜ&BÜ˜r6ˆ◊∆WFV«íFÜR6VÁG&R6∆V'2FÜR6ÜF˜s¢ó2∆◊¬„Ró2‡¢ÚÚV÷&W"FÜB6ó26ˆ÷WFÜñÊró2FÜW&RvóFÜ˜WB6ññÊrvÜ@¢ÚÚ&v"vÜB6ˆ∆˜W"óBWG2&6∞¢ÚÚ∆óBÜ˜r◊V6ÇóBWG2&6≤¬&V∆FófRFÚD$µÙD@¶gVÊ7Fñˆ‚6fT∆ñváD∆ó7BÇí∞¢6ˆÁ7B¬“µ“¬Ê˜r“W&f˜&÷Ê6RÊÊ˜rÇíÚ∞¢6ˆÁ7BFB“áÇ¬í¬"¬Ü&B¬&v"¬∆óBí”‚¬ÁW6Çá≤Ç¬í¬"¬Ü&B¬&v"¬∆óC¢∆óB”“ÁV∆¬Ú¢∆óB“ì∞†¢ÚÚ4ÑR4%$îU2Ù‰R¬ÊBóB'&VFÜW2vóFÇÜW"6˜&RÊBdƒ$U2vóFÇFÜR6Ü&vP¢ÚÚ(	BFÜR6Ü&vRó2∆ñváB6˜W&6R2vV∆¬2vVˆ‚Ê˜r¬vÜñ6Çó2FÜP¢ÚÚ6ÜVW7BvˆˆB&V6ˆ‚F&≤&ˆˆ“6‚vófRÜW"FÚÜˆ∆BóB‡¢6ˆÁ7B6Ç“÷FÇÊ÷ñ‚É¬á∆ñW"Ê6Ü&vUB«¬íÚ„bì∞¢FBá∆ñW"ÁÇ≤∆ñW"ÁrÚ"¬∆ñW"Áí≤∆ñW"ÊÇ¢„CB¿¢É#Cb≤6Ç¢Çí¢É≤÷FÇÁ6ñ‚ÜÊ˜r¢"„í¢„#Çí¬¿¢6Ç‚„RÚsì√#3"√#SRr¢sS√ìb√#3"r¬„í≤6Ç¢„rì∞†¢ÚÚFÜRfóáGW&W2‚V6ÇˆÊRó2&V6ˆ‚FÚv∆≤F˜v&BóB¬ÊBFÜR6ˆ∆˜W"ó0¢ÚÚFÜR&V6ˆ„¢v&“ó26ˆ÷V&ˆGíw2÷6ÜñÊR¬6ˆ∆Bó2FÜR6fRw2˜v‚7'ó7F¬‡¢f˜"Ü6ˆÁ7B3"ˆbrÁ7FFñ72í∞¢6ˆÁ7B7Ç“3"ÁÇ≤3"ÁrÚ"¬7í“3"Áí≤3"ÊÇÚ#∞¢ñbá3"ÁGóR””“wñ∆∆"ríFBÜ7Ç¬7í¬3s"¬¬sìb√#3Ç√#SRr¬„Rì∞¢V«6Rñbá3"ÁGóR””“wFW&“ríFBÜ7Ç¬7í“b¬3"Ê˜VÊVBÚcÇ¢#3b¬„ìB¬s#SR√sÇ√Ébr¬3"Ê˜VÊVBÚ„Ç¢„#Rì∞¢V«6Rñbá3"ÁGóR””“v&VÊ6ÇríFBÜ7Ç¬7í¬ì¬„ÉÇ¬s#SR√#b√#r¬„ì∞¢V«6Rñbá3"ÁGóR””“vÁ2ríFBÜ7Ç¬7í¬ìÇ¬„Éb¬s#SR√#B√Sr¬„Çì∞¢V«6Rñbá3"ÁGóR””“v6ÜW7Br«¬3"ÁGóR””“wfV«Br«¬3"ÁGóR””“v÷ˆBr«¿¢3"ÁGóR””“vóFV“r«¬3"ÁGóR””“wG&ñ¬ríFBÜ7Ç¬7í¬3"¬„s"¬sì√S√#SRr¬„rì∞¢–¢ÚÚDîƒîtÖBDıt‚DÑR‘ıUDÖ2(	B'WBˆÊ«íFÜRˆÊW2FÜB&R7GV∆«í˜V‚‚¢ÚÚ'W&ñVBFˆ˜"∆V∑2Ê˜FÜñÊr¬6Ú'&V∂ñÊrFÜR'V&&∆Ró2vÜB∆WG2FÜR∆ñvá@¢ÚÚñ‚ÊBFÜR&ˆˆ“6ÜÊvW26ÜRFÜR÷ˆ÷VÁBóBFˆW2‚FÜBó2FÜR&Wv&Bf˜ ¢ÚÚFÜR˜vÊW"w2'V&&∆R7FFVBñ‚∆ñváBñÁ7FVBˆbñ‚Fˆ7B‡¢ñbáGóVˆbvFTFˆ˜'2””“vgVÊ7Fñˆ‚rbbGóVˆbvFUv˜&∆EÇ””“vgVÊ7Fñˆ‚rí∞¢f˜"Ü6ˆÁ7BBˆbvFTFˆ˜'2Çíí∞¢ñbáGóVˆb'V&&∆Tf˜"””“vgVÊ7Fñˆ‚rbb'V&&∆Tf˜"ÜBíí6ˆÁFñÁVS∞¢6ˆÁ7BwÇ“vFUv˜&∆EÇÜBì∞¢ñbÜwÇ”“ÁV∆¬«¬ó4Ê‚ÜwÇíí6ˆÁFñÁVS∞¢FBÜwÇ¬ÑrÁ&ˆˆ‘FVbÊÇ“2í¢DîƒR¬#cÇ¬„í¬s#b√#3"√#Br¬„ÉRì∞¢–¢–¢6ˆÁ7BWÇ“rÁ&ˆˆ‘FVbÊWÜóG2«¬∑“¬r“rÁ&ˆˆ‘FVbÁr¢DîƒR¬Ç“rÁ&ˆˆ‘FVbÊÇ¢DîƒS∞¢ñbÜWÇ‰¬íFBÉ¬Ç“DîƒR¢"„R¬##B¬„s"¬ssb√#b√##br¬„bì∞¢ñbÜWÇÂ"íFBÖr¬Ç“DîƒR¢"„R¬##B¬„s"¬ssb√#b√##br¬„bì∞†¢ÚÚUîU2‚Fñ“¬ÊBFÜWíFÚÊ˜B6∆V"FÜVó"6VÁG&R¬6Ú‚Êñ÷¬ñ‚FÜRF&≤ó0¢ÚÚó"ˆbV÷&W'2ÊB7VvvW7Fñˆ‚(	BvÜñ6Çó2&˜FÇ÷˜&Rg&ñváFVÊñÊrÊ@¢ÚÚ÷˜&RW6VgV¬FÜ‚gV∆¬6ñ∆Ü˜VWGFR˜"Ê˜FÜñÊrB∆¬‚4tRó2Ê˜B‡¢ÚÚÊñ÷√¢ÜR∂ÊVV«2ñ‚Üó2˜v‚∆ñváBBFÜRVÊBˆbFÜRFVW6Ü÷&W"¬vÜñ6Ä¢ÚÚó2Ü˜rFÜB&ˆˆ“ÊÊ˜VÊ6W2GVV¬&Vf˜&R6ÜRó2ñ‚&ÊvRFÚ&R6Ü∆∆VÊvVB‡¢f˜"Ü6ˆÁ7BRˆbrÊVÊV÷ñW2í∞¢ñbÜRÊFVBí6ˆÁFñÁVS∞¢ñbÜRÊ∂ñÊB””“w6vRríFBÜRÁÇ≤RÁrÚ"¬RÁí≤RÊÇ¢„B¬#sB¬„í¬sc√#3"√#SRr¬„ì∞¢V«6RFBÜRÁÇ≤RÁrÚ"¬RÁí≤RÊÇ¢„2¬¬„R¬s#SR√#√#r¬„Rì∞¢–¢ñbÑrÊ&˜72bbrÊ&˜72ÊFVBíFBÑrÊ&˜72ÁÇ≤rÊ&˜72ÁrÚ"¬rÊ&˜72Áí≤rÊ&˜72ÊÇ¢„3R¬3#¬„sB¬s#SR√√3r¬„ì∞¢f˜"Ü6ˆÁ7B"ˆbrÁ&ˆß2íFBá"ÁÇ¬"Áí¬É"¬„Sb¬s#√#3Ç√#SRr¬„rì∞¢&WGW&‚√∞ß–¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚ‚îÂDU$îı"ï2D$≤$ÙÙ“tïDÇDÑRƒ’2Ù‚¬tÑî4Çï2‰ıBDÑR4‘RDÑî‰p¢ÚÚ24dR‡¢Ú¢ÚÚFÜR˜vÊW"¬ˆ‚FÜRG&FW"w2FV„¢&F&≤&ˆˆ“f˜"v˜&∑6Ü˜¬'WBóBÊVVG2F¢ÚÚ«6Ú∆ˆˆ≤∆ófV«í‚‚‚FÜR&6∂w&˜VÊB6Ü˜V∆B&∆VÊBvóFÇFÜRóFV◊2vóFÜñ‚óB¿¢ÚÚñÁ7FVBˆb&VñÊrGV∆¬ÊBF&≤‚ ¢Ú¢ÚÚvÜBÜRv2&VFñÊró2&V¬ÊBóBó2ƒîtÖDî‰rfñ«W&R¬Ê˜B‚'BˆÊR‡¢ÚÚFÜRFV‚w2ñÁFñÊró2v&“v˜&∑6Ü˜(	B&F6ÜWBVÊFW"∆◊¬∆óB&VÊ6Ç¿¢ÚÚFˆˆ«2(	BÊBóBó2&˜GFˆ“÷Ê6Ü˜&VB¬6ÚGvÚFÜó&G2ˆbFÜRg&÷R&˜fRóBv0¢ÚÚf∆BVÊ∆óBF&≤vóFÇÊ˜FÜñÊrñ‚óB‚÷VÁvÜñ∆RWfW'í6Ü&7FW"v2G&v‚@¢ÚÚgV∆¬'&ñváFÊW72vóFÇ6ˆ∆BFV¬&ñ“¬&V6W6RFÜRˆÊ«í∆ñváBñ‚FÜR&ˆˆ“v0¢ÚÚFÜRˆÊR&∂VBñÁFÚV6Ç7&óFR‚6ÚFÜRñÁFVB∆◊2∆óBÊ˜FÜñÊr¬FÜRV◊Gê¢ÚÚó"v2&∆6≤&V7FÊv∆R¬ÊB6ÜR7FˆˆBñ‚g&ˆÁBˆbóB∆¬&FÜW"FÜ‚ñ‡¢ÚÚóB‚FÜRñ7GW&RÜBÊÚ6ñÊv∆R∆ñváBFÚw&VRˆ‚‡¢Ú¢ÚÚFÜR6fW26ˆ«fVBFÜó2&ˆ&∆V“«&VGíÜG&t6fTF&≤í¬ÊBFÜRÁ7vW"ó2FÜP¢ÚÚ6÷RˆÊS¢WBFÜR∆ñváBñ‚FÜR$ÙÙ“ÊB∆WBóBf∆¬ˆ‚WfW'óFÜñÊr‚vÜ@¢ÚÚFñffW'2ó2FÜR&V6óR¬&V6W6Rv˜&∑6Ü˜ó2Ê˜B6fR(	@¢Ú¢ÚÚïBï2Dî‘‘U"¬‰ıB$ƒî‰B‚FÜR6fRF∂W2sBRˆbFÜR&ˆˆ“ví&V6W6RÊ˜@¢ÚÚ&VñÊr&∆RFÚ6VRó2FÜR6fRw2vÜˆ∆R7V&¶V7B‚v˜&∑6Ü˜vóFÇóG2∆◊0¢ÚÚ∆óBó2SRS¢6ÜF˜vVB¬v&“¬ÊB&VF&∆RWfW'óvÜW&R‡¢ÚÚDÑRƒ’2UB$4≤‘ı$R‚6÷∆¬&ˆˆ“vóFÇñÁFVB∆ñváB&˜VÊ6W3≤FÜP¢ÚÚFFóFófR72'VÁ2Ü&FW"ÜW&RFÜ‚VÊFW&w&˜VÊB¬ÊBFÜB(	BÊ˜BFÜP¢ÚÚ6ÜF˜r(	Bó2vÜB÷∂W2óB&VB2ƒïdT≈í&FÜW"FÜ‚÷W&V«íF&≤‡¢ÚÚDÑRD$≤ï2t$“‚6fR&ˆ6≤ó26ˆ∆BW'∆R‚VÊ∆óB6˜&ÊW'2ˆb∆◊∆ó@¢ÚÚv˜&∑6Ü˜&R'&˜v‚¬&V6W6RFÜWí&RFÜR6÷R∆ñváBvóFÇ∆W72ˆbóB‡¢ÚÚ4ÑR5Dı24%%îî‰rDÑR5T‚‚ñ‚6fRÜW"∆◊ó2FÜR÷≤ñÊFˆ˜'2óBó0¢ÚÚ6˜W'FW7í¬6ÚóBG&˜2FÚfñgFÇˆbFÜR&V6Ç‚&VñÊrƒïB'íFÜR&ˆˆ–¢ÚÚñÁ7FVBˆb6V∆b÷∆óBó2FÜRvÜˆ∆RˆbvÜB÷∂W2ÜW"&V∆ˆÊrñ‚óB‡¢ÚÚET‰TBtîÂ5BDÑRî5EU$R¬Ê˜Bñ‚FÜR'7G&7B‚B„SRÛ„c"FÜR÷6≤v0¢ÚÚvñÊÊñÊrÊBóBv2F&∂VÊñÊrFÜRñÁFñÊrw2ıt‚∆óB&V2(	BFÜR&ˆ˜FÇw2∆ó@¢ÚÚg&ˆÁB¬FÜR∆◊ˆ‚Üó2∆(	BvÜñ6Çó2FÜRˆÊRFÜñÊr∆ñváFñÊr72˜fW ¢ÚÚWFÜ˜&VB'B◊W7BÊWfW"FÚ‚FÜR6ÜF˜r6ˆ÷W2F˜v‚ÊBFÜR∆◊26ˆ÷RW¢FÜP¢ÚÚ&ˆˆ“ó2&&V«í÷6∂VBÊBÜVfñ«í&R÷∆óB¬6ÚvÜBFÜRWñR&VG2ó2FÜR∆ñvá@¢ÚÚ&FÜW"FÜ‚FÜRF&≤‚FÜBó2FÜRFñffW&VÊ6R&WGvVV‚÷ˆˆGíÊBGV∆¬‡¢ÚÚ‚‚ÊÊBˆÊ6RFÜR∆FRóG6V∆bó2w&FVBW¬FÜR÷6≤Ü2f"∆W72v˜&≤FÚFÛ†¢ÚÚóG2¶ˆ"ÜW&Ró26ÜR¬Ê˜BWá˜7W&R‚„#"ó2&ˆˆ“vóFÇ6˜&ÊW'2&FÜW"FÜ‡¢ÚÚ&ˆˆ“vóFÇFÜR∆ñváG2ˆfb¬ÊBFÜR∆◊27Fñ∆¬6''íFÜR&VFñÊr‡¢Ú¢ÚÚDÑRƒ’2tU$RET‰TBtïDÇDÑRƒ’2ÙdbÜ˜vÊW"w2ÜˆÊR¬##b”í”3¢FÜRFV‡¢ÚÚVÊFW"ñV∆∆˜rFó62FÜR6ó¶RˆbFÜR&ˆˆ“¬&F6ÜWBvÜ˜7BñÁ6ñFRóB(	B&ó@¢ÚÚvVÁBvíFÜV‚6÷R&6≤"í‚FÜRFFóFófR72&ñFW2&ñ6Ñ≤¬ÊBˆ‚FÜP¢ÚÚ6ˆgGv&R&7FW&ó6W"WfW'íÜ&ÊW72'VÁ2ˆ‚¬&ñ6Ñ≤ó2B¶W&ÚvóFÜñ‚6V6ˆÊG0¢ÚÚˆbÁí&ˆˆ“∆ˆFñÊr‚6ÚWfW'íÜVF∆W72∆ˆˆ≤ÁñˆÊRWfW"Fˆˆ≤B‚ñÁFW&ñ˜ ¢ÚÚv2FÜRv∆˜r‘Ùdbñ7GW&R(	B&GV∆¬ÊBF&≤"¬FÜRfW'í6ˆ◊∆ñÁBFÜR72v0¢ÚÚw&óGFV‚FÚÁ7vW"(	BÊBîÂEÙDB6∆ñ÷&VBFÚ„ìRFÚ'&ñváFV‚∆◊2FÜBvW&P¢ÚÚÊ˜B&VñÊrG&v‚‚ˆ‚ÜˆÊRFÜRFñ¬6óG2BˆÊR‚B„ìR¬FFVB˜fW"¢ÚÚñÁFñÊrFÜBó2«&VGí∆óB¬s2RˆbFÜRóÜV«2&˜VÊBFÜR∂VWW"6∆óVB¿¢ÚÚñ‚∆¬6óÇñÁFW&ñ˜'3≤ÊBFÜRˆ‚ˆˆfbÜR6rv2FÜRFñ¬f∆∆ñÊrVÊFW"∆ˆ@¢ÚÚÊB&V6˜fW&ñÊr¬Ê˜BFÜR6ÜW7B‚„#Ró2FÜRf«VRBvÜñ6ÇWfW'íñÁFW&ñ˜ ¢ÚÚ∂VW2óG2ñ7GW&RvóFÇFÜRFñ¬ıT‚(	BFW7G2ˆFVÊ∆ñváBÊ6ß2ñÁ2&ñ6Ñ≤BˆÊP¢ÚÚÊB÷V7W&W2óB(	BvÜñ∆RFÜR∂VWW"w27˜B7Fñ∆¬F˜V&∆W2ñ‚'&ñváFÊW72vñÁ7@¢ÚÚFÜRv∆˜r÷ˆfb&ˆˆ“‚∆WF¬∆ñ∂RFÜR$uÚ∂Êˆ'2¬6ÚFÜRÜ&ÊW726‚7vVWóB‡¶∆WBîÂEÙ≤“„#"¬îÂEÙDB“„#S∞¶6ˆÁ7BîÂEıDîÂB“w&v"É3√í√"ís∞¢ÚÚV6Ç∂ñÊvFˆ“w2ñÁFW&ñ˜"F∂W2óG2˜v‚v&“66VÁB¬6ÚFÜRf˜VÊG'íw2f˜&vRÊ@¢ÚÚFÜR&6ÜófW2r6'&V¬&R∆◊∆óBñ‚FÜVó"˜v‚6ˆ∆˜W"&FÜW"FÜ‚FÜR÷VF˜rw0¶gVÊ7Fñˆ‚v&’$t"á¶ˆÊRí∞¢6ˆÁ7B“≈∑¶ˆÊU“«¬¬‰∞¢6ˆÁ7BÇ“ÖÊ63"«¬r6ff#3CrríÁ&W∆6RÇr2r¬rrì∞¢6ˆÁ7B‚“'6TñÁBÜÇÊ∆VÊwFÇ””“2ÚÇÁ&W∆6RÇÚÇ‚íˆr¬rCCrí¢Ç¬bì∞¢&WGW&‚ÇÜ‚„‚bíb#SRí≤r¬r≤ÇÜ‚„‚Çíb#SRí≤r¬r≤Ü‚b#SRì∞ß–¶gVÊ7Fñˆ‚ñÁFW&ñ˜$∆ñváD∆ó7BÇí∞¢6ˆÁ7B¬“µ“¬Ê˜r“W&f˜&÷Ê6RÊÊ˜rÇíÚ∞¢6ˆÁ7BFC"“áÇ¬í¬"¬Ü&B¬&v"¬∆óBí”‚¬ÁW6Çá≤Ç¬í¬"¬Ü&B¬&v"¬∆óC¢∆óB”“ÁV∆¬Ú¢∆óB“ì∞¢6ˆÁ7B¶ˆÊR“rÁ&ˆˆ‘FVbÁ¶ˆÊR¬v&““v&’$t"á¶ˆÊRì∞¢6ˆÁ7Br“rÁ&ˆˆ‘FVbÁr¢DîƒR¬Ç“rÁ&ˆˆ‘FVbÊÇ¢DîƒS∞†¢ÚÚÑU"ıt‚¬∂WB6÷∆¬ˆ‚W'˜6R(	B6VRFÜRÊ˜FR&˜fR‚VÊ˜VvÇFÜB6ÜRó0¢ÚÚÊWfW"6ñ∆Ü˜VWGFRñ‚ÜW"˜v‚&ˆˆ“¬Ê˜vÜW&RÊV"VÊ˜VvÇFÚ&RFÜR&V6ˆ‡¢ÚÚFÜR&ˆˆ“ó2fó6ñ&∆R‡¢FC"á∆ñW"ÁÇ≤∆ñW"ÁrÚ"¬∆ñW"Áí≤∆ñW"ÊÇ¢„CB¬3"¬„c"¬s#Ç√#B√##br¬„3Bì∞†¢ÚÚDÑRdïÖEU$U2$RDÑR$ÙÙ“‚WfW'óFÜñÊr6ˆ÷V&ˆGív˜&∑2Bó2∆ñváC¢FÜP¢ÚÚ∂VWW"w2˜v‚∆◊ó2FÜR'&ñváFW7BFÜñÊrñ‚ÜW&R&V6W6RÜRó2vÜBFÜP¢ÚÚ&ˆˆ“ó2f˜"‡¢f˜"Ü6ˆÁ7B3"ˆbrÁ7FFñ72í∞¢6ˆÁ7B7Ç“3"ÁÇ≤3"ÁrÚ"¬7í“3"Áí≤3"ÊÇÚ#∞¢ñbá3"ÁGóR””“vÁ2ríFC"Ü7Ç¬7í“Ç¬3¬„ìR¬v&“¬„3Rì∞¢V«6Rñbá3"ÁGóR””“v&VÊ6ÇríFC"Ü7Ç¬7í¬#¬„Ç¬s#SR√#b√#r¬„íì∞¢V«6Rñbá3"ÁGóR””“wFW&“ríFC"Ü7Ç¬7í“b¬ì¬„Ç¬s#SR√sÇ√Ébr¬„ÉRì∞¢V«6Rñbá3"ÁGóR””“v6ÜW7Br«¬3"ÁGóR””“wfV«Br«¬3"ÁGóR””“v÷ˆBr«¿¢3"ÁGóR””“vóFV“r«¬3"ÁGóR””“wG&ñ¬ríFC"Ü7Ç¬7í¬S¬„r¬s#SR√ìb√#r¬„bì∞¢–†¢ÚÚDÑRtı$≤5U$d4U24%%í5E$ïƒîtÖB‚∆ˆgB˜"&VÊ6Çñ‚ˆÊRˆbFÜW6P¢ÚÚ&ˆˆ◊2ó2vÜW&RFÜRv˜&≤ÜVÁ2¬6ÚóBó2∆óB(	BÊB&V6W6RFÜW6RÜÊp¢ÚÚÜñvÇˆ‚FÜRv∆¬¬FÜWí&R«6ÚvÜBfñÊ∆«íWG26ˆ÷WFÜñÊrñ‚FÜRV◊Gê¢ÚÚó"&˜fRFÜRñÁFñÊr‚ˆÊR∆◊W"'V‚ˆb∆Ff˜&“¬˜fW"óG2÷ñFF∆R‡¢6ˆÁ7Br“rÊw&ñC∞¢ñbÜríf˜"Ü∆WBGí“≤Gí¬rÊ∆VÊwFÉ≤Gí≤≤í∞¢∆WBGÇ“∞¢vÜñ∆RáGÇ¬u≥“Ê∆VÊwFÇí∞¢ñbÜu∑Gï’∑GÖ“”“s“rí≤GÇ≤≥≤6ˆÁFñÁVS≤–¢∆WBR“GÉ≤vÜñ∆RÜR≤¬u≥“Ê∆VÊwFÇbbu∑Gï’∂R≤“””“s“ríR≤≥∞¢FC"ÇáGÇ≤R≤íÚ"¢DîƒR¬Gí¢DîƒR“¬#3b¬„s"¬v&“¬„Çì∞¢GÇ“R≤∞¢–¢–†¢ÚÚ‚‚ÊÊBÜÊvñÊr∆◊¬'&VFÜñÊr¬6ÚFÜR6Vñ∆ñÊró2∆6RvóFÇ6ˆ÷WFÜñÊp¢ÚÚñ‚óB&FÜW"FÜ‚FÜRF˜VFvRˆbFÜRñ7GW&P¢FC"Ör¢„c"¬Ç¢„3¬É#c≤÷FÇÁ6ñ‚ÜÊ˜r¢„íí¢Çí¬„cb¬v&“¬„s"ì∞¢FC"Ör¢„#B¬Ç¢„3B¬ì¬„SR¬v&“¬„Rì∞¢&WGW&‚√∞ß–¶gVÊ7Fñˆ‚G&t6fTF&≤Çí∞¢6ˆÁ7BñÊFˆ˜"“ÑrÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÊñÊFˆ˜"ì∞¢ñbÑrÊF&µ&ˆ&R«¬rÁ&ˆˆ‘FVb«¬ÑrÁ&ˆˆ‘FVbÊ6fR«¬ñÊFˆ˜"í«¬∆ñW"í&WGW&„∞¢ñbÇF&¥7bí∞¢F&¥7b“Fˆ7V÷VÁBÊ7&VFTV∆V÷VÁBÇv6Áf2rì≤F&¥7bÁvñGFÇ“D$µıs≤F&¥7bÊÜVñváB“D$µÙÉ∞¢∆óD7b“Fˆ7V÷VÁBÊ7&VFTV∆V÷VÁBÇv6Áf2rì≤∆óD7bÁvñGFÇ“D$µıs≤∆óD7bÊÜVñváB“D$µÙÉ∞¢–¢6ˆÁ7BGÇ“F&¥7bÊvWD6ˆÁFWáBÇs&Brí¬«Ç“∆óD7bÊvWD6ˆÁFWáBÇs&Brì∞¢ÚÚDÑR4ÑDırï2t‘Uƒì≤DÑRtƒırï2≈UÖU%í‚GvÚgV∆¬÷g&÷R6ˆ◊˜6óFW2ó0¢ÚÚvÜBFÜó2726˜7G2¬ÊBˆ‚FÜR6ˆgGv&R&7FW&ó6W"FÜRÜ&ÊW76W2'V‚ˆ‡¢ÚÚFÜB÷V7W&VBí„Ç◊2(	BvÜñ6Çó2g&÷R'VFvWB7VÁBˆ‚∆ñváFñÊr‚6ÚFÜP¢ÚÚ÷6≤¬vÜñ6ÇFV6ñFW2vÜB6ÜR6‚4TRÊBFÜW&Vf˜&RÜ˜rFÜR&ˆˆ“∆ó2¿¢ÚÚ'VÁ2VÊ6ˆÊFóFñˆÊ∆«ì≤FÜRFFóFófRv∆˜r&ñFW2FÜR6÷R&ñ6Ñ≤Fñ¬2FÜP¢ÚÚ&6∂w&˜VÊBFWFÇ∆FRÊBfFW2˜WBfó'7Bˆ‚÷6ÜñÊRFÜBó0¢ÚÚ7G'Vvv∆ñÊr‚F&≤6fRvóFÜ˜WBóG2v∆˜ró2F&≤6fR‚F&≤6fP¢ÚÚvóFÜ˜WBóG2÷6≤ó2∆óB6˜'&ñF˜"¬vÜñ6Çó2FÜR'VrFÜó2fóÜW2‡¢6ˆÁ7Bv∆˜t≤“áGóVˆb&ñ6Ñ≤””“vÁV÷&W"rÚ&ñ6Ñ≤¢ì∞¢6ˆÁ7Bv∆˜r“v∆˜t≤‚„#∞¢6ˆÁ7B2“D$µırÚìc≤ÚÚv˜&∆BÇ”‚÷6≤Ä¢6ˆÁ7B˜Ç“÷FÇÁ&˜VÊBÜ6’5ÇÇíí¬˜í“÷FÇÁ&˜VÊBÜ6’5íÇíì∞¢GÇÊv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“w6˜W&6R÷˜fW"s∞¢GÇÊfñ∆≈7Gñ∆R“ñÊFˆ˜"ÚîÂEıDîÂB¢D$µıDîÂC≤GÇÊfñ∆≈&V7BÉ¬¬D$µır¬D$µÙÇì∞¢GÇÊv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“vFW7FñÊFñˆ‚÷˜WBs∞¢ñbÜv∆˜rí∞¢«ÇÊv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“w6˜W&6R÷˜fW"s∞¢«ÇÊ6∆V%&V7BÉ¬¬D$µır¬D$µÙÇì∞¢«ÇÊv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢–†¢6ˆÁ7B6ÜF˜r“6ÜF˜u7&óFRÇì∞¢f˜"Ü6ˆÁ7B¬ˆbÜñÊFˆ˜"ÚñÁFW&ñ˜$∆ñváD∆ó7BÇí¢6fT∆ñváD∆ó7BÇííí∞¢6ˆÁ7B7Ç“Ñ¬ÁÇ“˜Çí¢2¬7í“Ñ¬Áí“˜íí¢2¬"“¬Á"¢3∞¢ÚÚˆfb◊67&VV‚∆ñváG27Fñ∆¬6˜VÁC¢v∆˜rvÜ˜6R6VÁG&Ró27BFÜRVFvRó0¢ÚÚWÜ7F«íÜ˜r&ˆˆ“FV∆«2ñ˜RFÜW&Ró26ˆ÷WFÜñÊr˜fW"FÜW&P¢ñbá"√“«¬7Ç¬◊"«¬7í¬◊"«¬7Ç‚D$µır≤"«¬7í‚D$µÙÇ≤"í6ˆÁFñÁVS∞¢GÇÊv∆ˆ&ƒ«Ü“¬ÊÜ&C∞¢GÇÊG&tñ÷vRá6ÜF˜r¬7Ç“"¬7í“"¬"¢"¬"¢"ì∞¢ñbÇv∆˜rí6ˆÁFñÁVS∞¢«ÇÊv∆ˆ&ƒ«Ü“÷FÇÊ÷ñ‚É¬¬Ê∆óBì∞¢«ÇÊG&tñ÷vRÜ∆ñváE7&óFRÑ¬Á&v"í¬7Ç“"¬7í“"¬"¢"¬"¢"ì∞¢–¢GÇÊv∆ˆ&ƒ«Ü“≤«ÇÊv∆ˆ&ƒ«Ü“∞†¢ÚÚFÜR6ÜF˜r∆FRó2dîƒƒTBvóFÇFÜRFñÁBÊBFÜRÜˆ∆W2&R7WB˜WBˆbóB¿¢ÚÚ6ÚˆÊR&∆óB∆ó2FÜRVÊ∆óB'BF˜v‚ñ‚WÜ7F«íFÜR&ñváB6ˆ∆˜W"‚fñ∆∆ñÊp¢ÚÚ&∆6≤ÊBFñÁFñÊrgFW'v&G2v˜V∆BÜfRFñÁFVBFÜR∆óBÜˆ∆W2FˆÚ‡¢Ú¢ÚÚ‰Ú6WEG&Á6f˜&“ÑU$R‚FÜR&6∂'VffW"ó2&W6ó¶VB'íFÜRV∆óGíFñ¿¢ÚÚÜß2˜W&bÊß26WG27bÁvñGFÇ“ìc¢'2íÊBFÜR6ˆÁFWáB6'&ñW2FÜB66∆R¿¢ÚÚ6ÚìcÉSCó2FÜR∆ˆvñ6¬g&÷RÊB&W6WGFñÊrFÜR÷G&óÇv˜V∆BG&rFÜP¢ÚÚ6ÜF˜rñÁFÚ6˜&ÊW"ˆbóB‚∆ñváE72ÊBG&u67&VV‰∆ñgB&˜FÇfñ∆≈&V7@¢ÚÚ√√ìc√SCf˜"FÜR6÷R&V6ˆ„≤FÜó2fˆ∆∆˜w2FÜV“‡¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ«Ü“ñÊFˆ˜"ÚîÂEÙ≤¢D$µÙ≥∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“w6˜W&6R÷˜fW"s∞¢2ÊG&tñ÷vRÜF&¥7b¬¬¬ìc¬SCì∞¢ñbÜv∆˜rí∞¢2Êv∆ˆ&ƒ«Ü“ÜñÊFˆ˜"ÚîÂEÙDB¢D$µÙDBí¢v∆˜t≥∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2ÊG&tñ÷vRÜ∆óD7b¬¬¬ìc¬SCì∞¢–¢2Á&W7F˜&RÇì∞ß–¢ÚÚDÑRDÖ$TRÂT‘$U%2DÑBDT4îDRÑırd"DÑR$4¥u$ıT‰Bï2U4ÑTB$4≤¬Ê÷V@¢ÚÚ6ÚFÜWí6‚&R÷V7W&VBÊB7vWBáFˆˆ«2ˆw&FW7vVWÊ6ß2íñÁ7FVBˆbwVW76VB‡¢ÚÚwVW76ñÊró2vÜB&ˆGV6VBFÜRg&÷RFÜR˜vÊW"&W˜'FVB2'FˆˆˆˆˆÚF&≤Ê@¢ÚÚfFVB"¬ÊBFÜRwVW76ñÊrÜB6ñvÊGW&S¢FÜR&6∂w&˜VÊBv27'W6ÜVBFÚ¢ÚÚFVÁFÇˆbóG2f«VRÊBìBRˆbóG26ˆ∆˜W"¬ÊBFÜV‚FÜR45$TT‚ƒîeBWBw&Wê¢ÚÚ&6≤˜fW"FÜRvÜˆ∆Rg&÷RFÚ6ˆ◊VÁ6FR‚7'W6Ç«W2∆ñgBó2FÜRWÜ7B&V6óP¢ÚÚf˜"fFVB(	BóB&V÷˜fW2FÜRñ7GW&RÊBFÜV‚&ó6W2FÜRf∆ˆ˜"óBv2&V÷˜fV@¢ÚÚFÚ‡¢Ú¢ÚÚFÜR∆w2FÜW6R6W'fRÜfR6Vñ∆ñÊr¬ÊBFÜR÷V7W&V÷VÁG2vW&RÊ˜vÜW&RÊV ¢ÚÚóC¢*sí„∆∆˜w2FÜR&6∂w&˜VÊB∆ÊRWFÚ#RR«V÷ñÊÊ6RÊBóBv26óGFñÊp¢ÚÚBÇ”2¬*sí„B∆∆˜w2"6á&ˆ÷ÊBóBv2B2”r‚Ü∆bFÜRW&÷óGFVB∆ñvá@¢ÚÚÊBV'FW"ˆbFÜRW&÷óGFVB6ˆ∆˜W"¬Fá&˜v‚víf˜"Ê˜FÜñÊr‡¶∆WB$uÙDU4B“„É≤ÚÚÜ˜r◊V6Ç6á&ˆ÷FÜRf"∆ÊRvófW2W ¶∆WB$uı4ïB“„SS≤ÚÚÜ˜rÜ&BFÜRf"∆ÊRó26BF˜v„¢VÁF˜V6ÜVB¬gV∆¬v6Ä¶∆WB$uÙÑ§R“„3≤ÚÚFÜRfVñ¬FÜB∂VW2Fó7FÊ6Rg&ˆ“&VFñÊr2VÊFW&Wá˜7W&P¶∆WB$uıDîÂB“„c#≤ÚÚÜ˜r◊V6ÇˆbFÜR¶ˆÊRáVR7W'fófW2FÜRF&∂VÊñÊrÉ“w&Wíê¢ÚÚ‰BDÑR52Ñ2DÚ¥‰ırtÑBï2$TÑî‰BïB‡¢Ú¢ÚÚFÜó2w&FRv2w&óGFV‚f˜"FÜR$Ù4TEU$¬&6∂G&˜(	B&ÊG2ˆb÷6ÜñÊR6óGê¢ÚÚG&v‚ñ‚6ˆFR¬vÜñ6Ç'&ófVBFˆÚ'&ñváBÊBFˆÚ6GW&FVBÊBÊVVFVBW6ÜñÊp¢ÚÚ&6≤‚óBFÜV‚&‚¬VÊ6ÜÊvVBÊBBgV∆¬7G&VÊwFÇ¬˜fW"FÜRWFÜ˜&V@¢ÚÚñÁFñÊw22vV∆¬‚Ü˜Fˆw&ÜVB7FW'í7FWáFˆˆ«2ˆw&FW7vVWÊ6ß2ÊBFÜP¢ÚÚ∆ñW"6Ê6Ü˜G2FÜBf˜VÊBFÜó2í¬FÜRvFRñÁFñÊr'&ófW2v&“¬'W7GíÊ@¢ÚÚ6ˆ◊∆WFV«í&VF&∆R¬FÜRFW6GW&Fñˆ‚F∂W2óG26ˆ∆˜W"¬ÊBFÜR◊V«Fó«ê¢ÚÚF∂W2GvÚFÜó&G2ˆbóG2∆ñváC¢vÜB&V6ÜW2FÜR∆ñW"ó2FÜRf∆BFV¬◊W&∞¢ÚÚFÜR˜vÊW"6VÁB67&VVÁ6Ü˜Bˆb¬vóFÇFÜRFˆ˜"ÜR6∂VB&˜WBñÁfó6ñ&∆Rñ‚óB‡¢Ú¢ÚÚñÁFñÊr«&VGí6ˆÁFñÁ2óG2˜v‚W&ñ¬W'7V7FófR‚FÜRvFR∆FRó0¢ÚÚñÁFVBvóFÇÜ¶R¬vóFÇFWFÇ¬ÊBvóFÇv&“∆ñváB&VÜñÊBFÜRFˆ˜'2(	BFÜ@¢ÚÚó2vÜBFÜR'&ñVb6∂VBÜñvw6fñV∆Bf˜"ÊBóBó2vÜB6÷R&6≤‚w&FñÊró@¢ÚÚvñ‚ó2Ê˜BFWFÇ¬óBó2&WñÁFñÊr¬ÊB%EÙ$î$ƒR*só2Wá∆ñ6óB&˜WBvÜ¢ÚÚ˜vÁ2FÜRñÁB‚6ÚFÜR72∂VW2óG2gV∆¬7G&VÊwFÇ˜fW"&ˆ6VGW&¬w&˜VÊ@¢ÚÚÊBvˆW2∆ñváB˜fW"‚WFÜ˜&VB∆FS¢VÊ˜VvÇFÚ6VBóB&VÜñÊBFÜP¢ÚÚ∆ñfñV∆B¬Ê˜BVÊ˜VvÇFÚF∂RóBví‡¢ÚÚDÑRdıT‰E%íDT4îDU2DÑR4Ö$Ù‘ÂT‘$U"¬ÊBóB«vó2FñB(	BFÜRÊ˜FRFÜó0¢ÚÚ72v2w&óGFV‚VÊFW"6ó26Ú‚¶ˆÊR2ó2÷ˆ«FV‚ó&ˆ„¢óG2ñÁFñÊró2FÜP¢ÚÚ÷˜7B6GW&FVB7W&f6Rñ‚FÜRv÷R¬ÊBFW6GW&Fñˆ‚vVÊW&˜W2VÊ˜VvÇF¢ÚÚvófRFÜR÷VF˜w2óG2'W7B&6≤∆VfW2FÜRf˜VÊG'íw2v∆¬BFÜR*sí„B∆ñ÷ó@¢ÚÚvÜñ∆RWfW'í˜FÜW"&ˆˆ“6óG26ˆ÷f˜'F&«íVÊFW"óB‚6ÚFÜR7G&VÊwFÇó2W ¢ÚÚ¶ˆÊR&FÜW"FÜ‚ˆÊRÁV÷&W"&VÁBVÁFñ¬FÜRv˜'7B&ˆˆ“76W2(	BvÜñ6Çó2Ü˜p¢ÚÚWfW'í˜FÜW"&ˆˆ“∆˜7BóG26ˆ∆˜W"ñ‚FÜRfó'7B∆6R‡¢ÚÚ##b”Ç”#S¢G&˜VBg&ˆ“„CÛ„ì"(	B6VRFÜRÊ˜FR˜fW"dï5Dı4TB‚ñÁFV@¢ÚÚ∆FR'&ófW2«&VGíw&FVB'íFÜRñÁFW#≤FÜR72∂VW2ˆÊ«íVÊ˜VvÇÜˆ∆@¢ÚÚFÜB6ÜR7Fñ∆¬&VG2ñ‚g&ˆÁBˆbóB‡¶∆WB$uÙ%EÙDU4B“„R¬$uÙ%Eı4ïB“„Ç¬$uÙ%EÙÑ§R“„∞¶6ˆÁ7B$uÙ%EÙDU4Eı§Ù‰R“≤3¢„3”∞¶6ˆÁ7B$uÙ%Eı4ïEı§Ù‰R“≤3¢„CR”∞¶gVÊ7Fñˆ‚&u∆ÊU72Çí∞¢6ˆÁ7B¬“§Ù‰UÙƒîtÖE¥rÁ&ˆˆ‘FVbÁ¶ˆÊU”∞¢ñbÇ¬í&WGW&„∞¢6ˆÁ7B∑w"¬vr¬v%““¬Áv6É∞¢ÚÚÑırÑ$BDÑï252U4ÑU2DUT‰E2Ù‚tÑBï2$TÑî‰BDÑRe$‘R¬ÊBFÜW&P¢ÚÚ&RGvÚvó2óB6‚&Rw&ˆÊr‚&˜FÇvW&R&W˜'FVB¬g&ˆ“˜˜6óFRVÊG2¬Ê@¢ÚÚ&˜FÇ&RFÜR6÷R÷ó7F∂S¢w&FRw&óGFV‚f˜"ˆÊR∂ñÊBˆb&6∂G&˜'VÊÊñÊp¢ÚÚBgV∆¬7G&VÊwFÇ˜fW"Ê˜FÜW"‡¢Ú¢ÚÚU$î¬U%5T5DïdRï2$ıUBDï5D‰4R¬‰B‚îÂDU$îı"Ñ2‰Ù‰R‚˜WFFˆ˜'0¢ÚÚFÜR∆r÷ˆFV«2FÜR&V¬FÜñÊr(	B∂ñ∆ˆ÷WG&W2ˆbó"&WGvVV‚ÜW"ÊBFÜP¢ÚÚ6∑ñ∆ñÊR‚ñ‚FÜRG&FW"w2FV‚FÜR&f"∆ÊR"ó2FÜRv∆¬6ÜRó27FÊFñÊr¢ÚÚ÷WG&Rg&ˆ“¬ÊB7G&óñÊróG26á&ˆ÷ÊB◊V«Fó«ññÊróBF˜v‚FˆW2Ê˜BW6Ä¢ÚÚóBñÁFÚFÜRFó7FÊ6R¬óBGW&Á2FÜR&ˆˆ“6ÜRó2ñÁ6ñFRñÁFÚw&Wê¢ÚÚÜ˜Fˆw&Çˆb6ˆ÷WvÜW&RV«6S¢&2ñbív“∆ˆˆ∂ñÊrBg&÷VBñ÷vRñÁ7FV@¢ÚÚˆb‚7GV¬&6∂w&˜VÊBˆbFÜR7GV¬6Ü˜"‡¢Ú¢ÚÚ‰B‚UDÑı$TBîÂDî‰r≈$TEí4ÙÂDîÂ2ïE2ıt‚‚FÜRvFR∆FRó0¢ÚÚñÁFVBvóFÇÜ¶R¬vóFÇFWFÇÊBvóFÇv&“∆ñváB&VÜñÊBFÜRFˆ˜'2¿¢ÚÚ&V6W6RFÜBó2vÜBFÜR'&ñVb6∂VBÜñvw6fñV∆Bf˜"‚Ü˜Fˆw&ÜVB7FW'ê¢ÚÚ7FW¬óB'&ófW2v&“ÊB6ˆ◊∆WFV«í&VF&∆RÊBFÜó272F∂W2óB&6∞¢ÚÚˆfc¢vÜB&V6ÜVBFÜR∆ñW"v2FÜRf∆BFV¬◊W&≤ñ‚FÜR˜vÊW"w0¢ÚÚ67&VVÁ6Ü˜B¬vóFÇFÜRFˆ˜"ÜR6∂VB&˜WBñÁfó6ñ&∆Rñ‚óB‚w&FñÊr¢ÚÚñÁFñÊrvñ‚ó2Ê˜BFWFÇ¬óBó2&WñÁFñÊr¬ÊB%EÙ$î$ƒR*só0¢ÚÚWá∆ñ6óB&˜WBvÜÚ˜vÁ2FÜRñÁB‡¢Ú¢ÚÚ6ÚFÜR∆ró2∂WBÊBóG25E$T‰uDÇó2gVÊ7Fñˆ‚ˆbvÜBóBó2w&FñÊr‡¢ÚÚ&ˆ6VGW&¬w&˜VÊB˜WFFˆ˜'2F∂W2óBñ‚gV∆√≤v∆¬6ÜRó27FÊFñÊrÊWáBF¢ÚÚÊBñÁFVB∆FRF∂Rg&7Fñˆ‚(	BVÊ˜VvÇ6W&Fñˆ‚FÜB6ÜR7Fñ∆¿¢ÚÚ&VG2ñ‚g&ˆÁBˆbóB¬Ê˜vÜW&RÊV"VÊ˜VvÇFÚ6VÊBóBFÚÊ˜FÜW"6˜VÁG'í‡¢6ˆÁ7BñÁ"“ÑrÁ&ˆˆ‘FVbbbrÁ&ˆˆ‘FVbÊñÊFˆ˜"ì∞¢6ˆÁ7BñÁFVB“rÂ˜fó7FñÁFVB””“rÁ&ˆˆ‘ñC≤ÚÚG&u¶ˆÊUfó7F6ó26ÚFó&V7F«ê¢6ˆÁ7B6ˆgB“ñÁ"«¬ñÁFVC∞¢6ˆÁ7B¶‚“rÁ&ˆˆ‘FVbÁ¶ˆÊS∞¢6ˆÁ7B'DFW6B“Ñ$uÙ%EÙDU4Eı§Ù‰Rbb$uÙ%EÙDU4Eı§Ù‰U∑¶Â“í«¬$uÙ%EÙDU4C∞¢6ˆÁ7B'E6óB“Ñ$uÙ%Eı4ïEı§Ù‰Rbb$uÙ%Eı4ïEı§Ù‰U∑¶Â“í«¬$uÙ%Eı4ïC∞¢6ˆÁ7BDU4B“ñÁ"Ú„#B¢ñÁFVBÚÑrÁ&ˆˆ‘FVbÊ6fRÚ÷FÇÊ÷ÇÇ„3∆'DFW6Bí¢'DFW6Bí¢$uÙDU4C∞¢6ˆÁ7B4ïB“ñÁ"Ú„Ç¢ñÁFVBÚÑrÁ&ˆˆ‘FVbÊ6fRÚ÷FÇÊ÷ÇÇ„#R∆'E6óBí¢'E6óBí¢$uı4ïC∞¢6ˆÁ7BÑ§R“ñÁ"Ú„B¢ñÁFVBÚ$uÙ%EÙÑ§R¢$uÙÑ§S∞¢2Á6fRÇì∞¢ÚÚ(	BV∆¬FÜR6á&ˆ÷˜W@¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“w6GW&Fñˆ‚s∞¢2Êfñ∆≈7Gñ∆R“vá6¬É√R√SRís∞¢ÚÚ„c"∆VgBFÜRf˜VÊG'íBsbÊB„É"BSbˆ‚FÜR$TƒDïdR6á&ˆ÷÷V7W&P¢ÚÚFÜBv2∆FW"f˜VÊBFÚ&R÷VÊñÊv∆W72ˆ‚F&≤óÜV«3≤ˆ‚FÜR'6ˆ«WFRˆÊP¢ÚÚFÜó2fñ∆R÷V7W&W2vóFÇÊ˜r¬„ìBv26˜7FñÊrFÜR&6∂w&˜VÊBÊV&«í∆¬ˆ`¢ÚÚóG26ˆ∆˜W"FÚ7FíV'FW"VÊFW"∆ñ÷óBóB6˜V∆BÊ˜BÜfR&V6ÜVB‡¢2Êv∆ˆ&ƒ«Ü“DU4C∞¢2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢ÚÚ"(	B6óBóBF˜v‚ñ‚f«VR¬F˜v&BFÜR¶ˆÊRw2˜v‚6ÜF˜r&FÜW"FÜ‚FÚw&Wí‡¢Ú¢ÚÚDÑRDîÂBï2’UDTB$Tdı$RïBD$¥TÂ2¬vÜñ6Çó2FÜRFñffW&VÊ6R&WGvVV‚FWFÄ¢ÚÚÊB&WñÁFñÊr‚◊V«Fó«í'í4EU$DTB6ˆ∆˜W"FˆW2Ê˜BFñ“ñ7GW&R¬ó@¢ÚÚ&Ww&óFW2óC¢¶ˆÊRw2v6Çó2≥#√ì√sU“¬6ÚóG2&VB6ÜÊÊV¬ó2„c2ˆ`¢ÚÚóG2w&VV‚vÜFWfW"7G&VÊwFÇóBó2W6VBB¬ÊBWfW'ív&“∆FRñ‚FÜP¢ÚÚ÷VF˜w2∆˜7B3rRˆbóG2&VB&Vf˜&RÁóFÜñÊrV«6RF˜V6ÜVBóB‚FÜRÜ¶R&V∆˜p¢ÚÚÜ2◊WFVBóG6V∆bF˜v&BóG2˜v‚÷V‚6ñÊ6RóBv2w&óGFV‚¬f˜"WÜ7F«íFÜó0¢ÚÚ&V6ˆ„≤FÜRF&∂VÊñÊrÊWfW"FñB‚ñÊFˆ˜'2óBvˆW2F˜v&Bv&“∆◊6ÜF˜p¢ÚÚñÁ7FVBˆbFÜR∂ñÊvFˆ“w2˜WFFˆ˜"∆ñváB(	BFÜR6˜&ÊW'2ˆb∆óBv˜&∑6Ü˜&P¢ÚÚ'&˜v‚¬Ê˜BFV¬‡¢Ú¢ÚÚ‰B4ïFï25E$T‰uDÇ‰ır¬tÑî4ÇïBt2‰ıB‚óBW6VBFÚ44ƒRFÜRv6Ä¢ÚÚ6ˆ∆˜W"¬ÊBv6Çó2«&VGí&˜WB„bˆbvÜóFR(	B6Ú6óB“¬vÜñ6Ä¢ÚÚ&VG2∆ñ∂R&∆VfRóB∆ˆÊR"¬7Fñ∆¬◊V«Fó∆ñVBFÜRg&÷R'íÉ„S¬„s"¿¢ÚÚ„crì¢3RRF&∂VÊñÊrÊBÜ&B7WBFÚ&VBFÜBÊÚf«VRˆbFÜR∂Êˆ ¢ÚÚ6˜V∆BGW&‚ˆfb‚FÜBó2váí6ˆgFVÊñÊróBg&ˆ“„C"FÚ„ì"6ÜÊvVBFÜP¢ÚÚÁV÷&W"ÊBÊWfW"FÜRñ7GW&R‚ñÁFW'ˆ∆FVBg&ˆ“tÑïDRñÁ7FVB¬÷VÁ0¢ÚÚVÁF˜V6ÜVBÊB÷VÁ2FÜRgV∆¬v6Ç¬vÜñ6Çó2vÜB7G&VÊwFÇó2‡¢6ˆÁ7BGr“ñÁ"Ú≥#S¬#3"¬#E“¢∑w"¬vr¬v%”∞¢6ˆÁ7BF÷V‚“áGu≥“≤Gu≥“≤Gu≥%“íÚ3∞¢6ˆÁ7B◊WFR“ábí”‚b¢É“$uıDîÂBí≤F÷V‚¢$uıDîÂC∞¢6ˆÁ7BF˜v&B“ábí”‚÷FÇÁ&˜VÊBÉ#SR“É#SR“◊WFRábíí¢4ïBì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v◊V«Fó«ís∞¢2Êv∆ˆ&ƒ«Ü“∞¢2Êfñ∆≈7Gñ∆R“w&v"Çr≤F˜v&BáGu≥“í≤r¬r≤F˜v&BáGu≥“í≤r¬r≤F˜v&BáGu≥%“í≤rís∞¢2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢ÚÚ2(	BÊBFÜRÜ¶RFÜB∂VW2óBg&ˆ“&VFñÊr2VÊFW&Wá˜7W&R‚*sí„6∑2f˜ ¢ÚÚR”S≤FÜRF˜ˆbFÜRg&÷Ró2gW'FÜW7BvíÊBF∂W2FÜR÷˜7B‡¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“w6˜W&6R÷˜fW"s∞¢ÚÚFÜRÜ¶Ró2’UDTB&Vf˜&RóBó2∆ñBF˜v‚‚ñÁFñÊrFÜR¶ˆÊRw2˜v‚v6Çˆ‡¢ÚÚÊVBWBFÜR6á&ˆ÷7G&ñváB&6≥¢˜fW"&6∂w&˜VÊB«&VGíF&∂VÊVBF¢ÚÚ„íR«V÷ñÊÊ6R¬2RˆbFÜRf˜VÊG'íw26GW&FVB˜&ÊvR÷V7W&VBsRˆ‚∆p¢ÚÚFÜB6∑2f˜"3B‚Fó7FÊ6R&V÷˜fW26ˆ∆˜W#≤Ü¶RFÜBFG2óBó2∆◊‡¢6ˆÁ7Bá¢“ábí”‚÷FÇÁ&˜VÊBáb¢„C"≤Çáw"≤vr≤v"íÚ2í¢„SÇì∞¢6ˆÁ7Bá"“á¢áw"í¬Üs"“á¢ávrí¬Ü"“á¢áv"ì∞¢6ˆÁ7BÇ“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬¬¬SCì∞¢ÚÚ&&V«íÁíÜ¶RñÊFˆ˜'2(	BÜ¶Ró27W7VÊFVBó"¬ÊBFÜW&R&Rf˜W"÷WG&W0¢ÚÚˆbóBñ‚6ÜV@¢ÇÊFD6ˆ∆˜%7F˜É¬w&v&Çr≤á"≤r¬r≤Üs"≤r¬r≤Ü"≤r¬r≤Ñ§R≤rírì∞¢ÇÊFD6ˆ∆˜%7F˜É¬w&v&Çr≤á"≤r¬r≤Üs"≤r¬r≤Ü"≤r¬r≤ÑÑ§R¢„3íÁFÙfóÜVBÉ2í≤rírì∞¢2Êfñ∆≈7Gñ∆R“É∞¢2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢ÚÚ‚‚ÊÊB'&V≤FÜRóF6Ç‚˜fW&∆í∂VW2÷ñB÷w&WíÊWWG&¬¬6ÚFÜó2ˆÊ«ê¢ÚÚW6ÜW2FÜR&6∂w&˜VÊBw2˜v‚f«VW2'B(	BóBÊWfW"FñÁG2óB‚îÂDî‰p¢ÚÚFˆW2Ê˜BÊVVBóC¢FÜR÷˜GF∆RWÜó7G26Ú&ˆ6VGW&∆«í&WVFVB&6∂G&˜ ¢ÚÚ6ÊÊ˜B÷F6ÇóG6V∆b7&˜7267&VV‚å*s„rí¬ÊBñÁFVB∆FRÜ2óG0¢ÚÚ˜v‚∆ñváBˆˆ∆ñÊrñ‚óB«&VGí‡¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v˜fW&∆ís∞¢2Êv∆ˆ&ƒ«Ü“ñÁFVBÚ„C"¢„SS∞¢2ÊG&tñ÷vRÜ&t÷˜GF∆RÇí¬¬ì∞¢2Á&W7F˜&RÇì∞¢2Êv∆ˆ&ƒ«Ü“∞ß–†¢ÚÚˆÊR◊óÜV¬◊vñFR66ÜVBw&FR∂VW266VÊR∆ñváFñÊr6ˆÜW&VÁBWfV‚vÜV‡¢ÚÚ&∆ˆˆ“ÊBFÜRWáG&&6∂w&˜VÊB6˜í&RG&˜VB'íFÜRW&f˜&÷Ê6R'VFvWB‡¶6ˆÁ7B§Ù‰UÙu$DUÙ44ÑR“ÊWr÷Çì∞¶gVÊ7Fñˆ‚¶ˆÊT∆ñváDw&FRÑ¬¬V∆óGíí∞¢6ˆÁ7B7G&VÊwFÇ“„3R≤„cR¢Ñ÷FÇÁ&˜VÊBÜ6∆◊áV∆óGí¬¬í¢3"íÚ3"ì∞¢6ˆÁ7B∂Wí“•4Ù‚Á7G&ñÊvñgíÖ¥¬Êg&ˆ“¬¬Áv6Ç¬¬Ê≤¬7G&VÊwFÖ“ì∞¢ñbÖ§Ù‰UÙu$DUÙ44ÑRÊÜ2Ü∂Wííí&WGW&‚§Ù‰UÙu$DUÙ44ÑRÊvWBÜ∂Wíì∞¢6ˆÁ7B7b“Fˆ7V÷VÁBÊ7&VFTV∆V÷VÁBÇv6Áf2rì≤7bÁvñGFÇ“≤7bÊÜVñváB“SC∞¢6ˆÁ7B7GÇ“7bÊvWD6ˆÁFWáBÇs&Brì∞¢6ˆÁ7Br“7GÇÊ7&VFT∆ñÊV$w&FñVÁBÉ¬SC¢¬Êg&ˆ““##¬¬SCì∞¢6ˆÁ7B∆ñgB“b”‚÷FÇÁ&˜VÊBÉ#SR“É#SR“bí¢¬Ê≤¢7G&VÊwFÇì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v"É#SR√#SR√#SRírì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v"Çr≤¬Áv6ÇÊ÷Ü∆ñgBíÊ¶ˆñ‚Çr¬rí≤rírì∞¢7GÇÊfñ∆≈7Gñ∆R“s≤7GÇÊfñ∆≈&V7BÉ¬¬¬SCì∞¢ñbÖ§Ù‰UÙu$DUÙ44ÑRÁ6ó¶R„“#Sbí§Ù‰UÙu$DUÙ44ÑRÊ6∆V"Çì∞¢§Ù‰UÙu$DUÙ44ÑRÁ6WBÜ∂Wí¬7bì∞¢&WGW&‚7c∞ß–¶gVÊ7Fñˆ‚∆ñváE72Öí∞¢6ˆÁ7B¬“§Ù‰UÙƒîtÖE¥rÁ&ˆˆ‘FVbÁ¶ˆÊU”∞¢ñbÇ¬í&WGW&„∞¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v◊V«Fó«ís∞¢2ÊG&tñ÷vRá¶ˆÊT∆ñváDw&FRÑ¬¬&ñ6Ñ≤í¬¬¬ìc¬SCì∞¢2Á&W7F˜&RÇì∞¢2Êv∆ˆ&ƒ«Ü“∞¢ÚÚ&∆ˆˆ“&V÷ñÁ2ñ‚G&uv˜&∆Dg&÷R¬&Vf˜&RFÜR66W76ñ&ñ∆óGí∆ñgB‡ß–†¶gVÊ7Fñˆ‚Fñ’ÊV¬áÇ¬í¬r¬Çí∞¢2Êfñ∆≈7Gñ∆R“w&v&Éb√√b√„ÉÇís≤'"Ü2¬Ç¬í¬r¬Ç¬"ì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#√#√#SR√„3Rís≤2Ê∆ñÊUvñGFÇ“„S≤'"Ü2¬Ç¬í¬r¬Ç¬"ì≤2Á7G&ˆ∂RÇì∞ß–¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚ6Ü&7FW"˜'G&óG2‚&˜FÇ&RG&v‚ñ‚ˆÊRÊ˜&÷∆ó6VB76Rá&˜VvÜ«í+vñFR¿¢ÚÚ”##‚‚≥ìbF∆¬¬˜&ñvñ‚&WGvVV‚FÜRWñW2í6ÚFÜR6÷R6ˆFR6W'fW2FÜR&ñrFóF∆P¢ÚÚ÷66˜BÊBFÜR6÷∆¬6Ü&7FW"◊6V∆V7B˜'G&óC≤72FWFñ√÷f«6RFÚG&˜FÜP¢ÚÚfñÊRv˜&≤FÜBGW&Á2FÚ◊W6ÇB˜'G&óB6ó¶R‡¢Ú¢ÚÚ&˜FÇfˆ∆∆˜r5Dı%íÊ÷Bw2'B'V∆W3¢&VB∆ñváB÷VÁ2ñÊfV7FVB¬6ÚÊ˜FÜñÊrg&ñVÊF«ê¢ÚÚv∆˜w2&VB(	BÖ§B”ìí&VG2FV¬¬FÜRÜW&Ú&VG2vˆ∆B¬ÊBFÜR7&ñ◊6ˆ‚7&W7Bó0¢ÚÚñv÷VÁB&FÜW"FÜ‚V÷ó76ñˆ‚‚Ê˜FÜñÊrÜW&Ró2ÊWr¬6Ú&˜FÇ6''ívV"‡¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚ6˜'&V7FVBFÚFÜR&VfW&VÊ6R6ÜVWC¢Ö§B”ìíó2tÑïDR4U$‘î2˜fW"''W6ÜVB7FVV¿¢ÚÚvóFÇ˜ÜñFó¶VB'&ˆÁ¶RfóGFñÊw2ÊB7ñ‚∆ñváB(	BÊ˜BFÜRF&≤&«VR◊FV¬6ÜRv2‡¶6ˆÁ7BÖ§Eı“≤6˜&S¢r363s3r¬6ÜFS¢r3f#ccVBr¬÷ñC¢r63&&6Rr¬∆óC¢r6c&VVSbr¬v∆˜s¢r36fCÜVRr”∞¶6ˆÁ7Bu$ı“≤6˜&S¢r3##c&"r¬6ÜFS¢r33363CBr¬÷ñC¢r3FSVcBr”∞¶6ˆÁ7B%%•ı“≤6˜&S¢r3&#c"r¬6ÜFS¢r3VcCS#r¬÷ñC¢r3ñsS3Br¬∆óC¢r6Cñ#Sfr¬v∆˜s¢r6ffCìÜr”∞¶6ˆÁ7B5$Uı“≤6˜&S¢r3VS#"r¬6ÜFS¢r6É3#62r¬÷ñC¢r6SCÉFbr¬∆óC¢r6c#ÉÉvbr”∞†¶gVÊ7Fñˆ‚á¶E6∑V∆≈áÇí∞¢ÇÊ&VvñÂFÇÇì∞¢ÇÊ÷˜fUFÚÇ”CÇ¬”ì"ì∞¢ÇÊ&W¶ñW$7W'fUFÚÇ”#¬”¬#¬”¬CÇ¬”ì"ì∞¢ÇÊ&W¶ñW$7W'fUFÚÉÉb¬”s¬B¬”3b¬B¬ì∞¢ÇÊ∆ñÊUFÚÉ"¬bì≤ÇÊ∆ñÊUFÚÉìÇ¬#Bì∞¢ÇÊ&W¶ñW$7W'fUFÚÉìB¬S"¬sB¬sB¬CB¬ÉBì∞¢ÇÊ&W¶ñW$7W'fUFÚÉ#B¬ì"¬”#B¬ì"¬”CB¬ÉBì∞¢ÇÊ&W¶ñW$7W'fUFÚÇ”sB¬sB¬”ìB¬S"¬”ìÇ¬#Bì∞¢ÇÊ∆ñÊUFÚÇ”"¬bì≤ÇÊ∆ñÊUFÚÇ”B¬ì∞¢ÇÊ&W¶ñW$7W'fUFÚÇ”B¬”3b¬”Éb¬”s¬”CÇ¬”ì"ì∞¢ÇÊ6∆˜6UFÇÇì∞ß–¶gVÊ7Fñˆ‚á¶DV%áÇ¬Fó"í∞¢ÇÁ6fRÇì≤ÇÁ66∆RÜFó"¬ì∞¢ÇÊ&VvñÂFÇÇì∞¢ÇÊ÷˜fUFÚÉ3b¬”sbì≤ÇÁVG&Fñ47W'fUFÚÉSb¬”3¬sB¬”sbì≤ÇÁVG&Fñ47W'fUFÚÉB¬”B¬ì"¬”cì∞¢ÇÊ6∆˜6UFÇÇì≤ÇÁ&W7F˜&RÇì∞ß–¶gVÊ7Fñˆ‚á¶DWñUáÇí∞¢ÇÊ&VvñÂFÇÇì∞¢ÇÊ÷˜fUFÚÇ”#R¬ì≤ÇÁVG&Fñ47W'fUFÚÇ”#¬”"¬"¬”2ì≤ÇÁVG&Fñ47W'fUFÚÉ#2¬”2¬#Ç¬”Bì∞¢ÇÁVG&Fñ47W'fUFÚÉ#2¬¬"¬ì≤ÇÁVG&Fñ47W'fUFÚÇ”#¬¬”#R¬ì∞¢ÇÊ6∆˜6UFÇÇì∞ß–¢ÚÚÖ§B”ìì¢÷ñÁFVÊÊ6RVÊóB¬Ê˜B6ˆ∆FñW"(	B&˜VÊB÷Fˆ÷ñÊÁB6∑V∆¬¬∆WfV¬'&˜rÊ@¢ÚÚ∆W'BÜÊ˜BÊ'&˜vVBíWñW2‚FÜR7ñ÷÷WG'íó2&Wó"F6Ç6ÜR&ófWFVBˆ‚ÜW'6V∆b‡¶gVÊ7Fñˆ‚G&tÁñáÇ¬FWFñ¬í∞¢ÇÁ6fRÇì≤ÇÁ&˜FFRÇ”„2ì∞¢6ˆÁ7B6r“ÇÊ7&VFT∆ñÊV$w&FñVÁBÇ”ì¬c¬ì¬ìì∞¢6rÊFD6ˆ∆˜%7F˜É¬Ö§EıÁ6ÜFRì≤6rÊFD6ˆ∆˜%7F˜É¬Ö§EıÊ6˜&Rì∞¢ÇÊfñ∆≈7Gñ∆R“6s∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”C√CBì≤ÇÊ∆ñÊUFÚÉC√CBì≤ÇÊ∆ñÊUFÚÉS"√#ì≤ÇÊ∆ñÊUFÚÇ”S"√#ì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”#b√ìbì≤ÇÁVG&Fñ47W'fUFÚÇ”ìÇ√b¬”Cb√bì∞¢ÇÊ∆ñÊUFÚÉCb√bì≤ÇÁVG&Fñ47W'fUFÚÉìÇ√b√#b√ìbì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢ÚÚ6Vv÷VÁFVBFñ¬¬g&ˆ“FÜR&VfW&VÊ6R6ÜVWB(	B6W&÷ñ2&VG2ˆ‚7FVV¬6&∆P¢ÇÁ7G&ˆ∂U7Gñ∆R“‘BÁ7FVV¬ÊF&≥≤ÇÊ∆ñÊUvñGFÇ“S∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÉìb√Sì≤ÇÁVG&Fñ47W'fUFÚÉSÇ√#B¬S√SÇì≤ÇÁ7G&ˆ∂RÇì∞¢f˜"Ü∆WBí“≤í¬c≤í≤≤í∞¢6ˆÁ7B≤“íÚR¬GÇ“ìb≤É÷≤í¢É÷≤í£≤É"¢É÷≤í¶≤£SÇ≤≤¶≤£Sí“É÷≤í¢É÷≤í£∞¢6ˆÁ7B'Ç“É÷≤í¢É÷≤í£ìb≤"¢É÷≤í¶≤£SÇ≤≤¶≤£S∞¢6ˆÁ7B'í“É÷≤í¢É÷≤í£S≤"¢É÷≤í¶≤£#B≤≤¶≤£SÉ∞¢ÇÊfñ∆≈7Gñ∆R“&◊áÇ¬‘BÊ6W&÷ñ2¬'Ç”Ç¬'í”Ç¬'Ç≥r¬'í≥Ç¬„í“≤£„Rì∞¢ÇÊ&VvñÂFÇÇì≤ÇÊV∆∆ó6RÜ'Ç¬'í¬í“í£„r¬Ç“í£„b¬„2¬¬rì≤ÇÊfñ∆¬Çì∞¢–¢ÚÚ'&ˆÁ¶RÊV6≤6ˆ∆∆ ¢ÇÊfñ∆≈7Gñ∆R“&◊áÇ¬‘BÊ'&ˆÁ¶R¬”CB¬3b¬C¬c"ì∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”CB√Cì≤ÇÊ∆ñÊUFÚÉCB√Cì≤ÇÊ∆ñÊUFÚÉC√cì≤ÇÊ∆ñÊUFÚÇ”C√cì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢ˆ66¬áÇ¬¬CB¬S"¬"¬„Rì∞†¢ÇÊfñ∆≈7Gñ∆R“u$ıÁ6ÜFS∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”cB√ì≤ÇÁVG&Fñ47W'fUFÚÇ”3b¬”b¬”Éb√bì∞¢ÇÁVG&Fñ47W'fUFÚÇ”C√#"¬”Ç√Cì≤ÇÁVG&Fñ47W'fUFÚÇ”ìb√3¬”c√3bì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢ÇÊfñ∆≈7Gñ∆R“u$ıÊ6˜&S∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”c"√Cì≤ÇÁVG&Fñ47W'fUFÚÇ”b√SÇ¬”S√ì"ì∞¢ÇÁVG&Fñ47W'fUFÚÇ”"√sb¬”SÇ√s"ì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞†¢ÇÊfñ∆≈7Gñ∆R“&◊áÇ¬‘BÊ6W&÷ñ2¬”c¬”É¬c¬”c¬„ÉRì∞¢á¶DV%áÇ¬”ì≤ÇÊfñ∆¬Çì≤á¶DV%áÇ√ì≤ÇÊfñ∆¬Çì∞¢ÇÊfñ∆≈7Gñ∆R“&◊áÇ¬‘BÊ'&ˆÁ¶R¬”#¬”c¬#¬”s¬„Çì∞¢f˜"Ü6ˆÁ7BBˆb≤”¬“í∞¢ÇÁ6fRÇì≤ÇÁ66∆RÜB√ì∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÉS¬”Éì≤ÇÁVG&Fñ47W'fUFÚÉcB¬”#b√sb¬”cì∞¢ÇÁVG&Fñ47W'fUFÚÉì¬”#√ÉB¬”sì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì≤ÇÁ&W7F˜&RÇì∞¢–¢ñbÜFWFñ¬í∞¢ÇÁ7G&ˆ∂U7Gñ∆R“w&v&Éì√#3R√#3√„3ís≤ÇÊ∆ñÊUvñGFÇ“3∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÉSÇ¬”Çì≤ÇÊ∆ñÊUFÚÉì"¬”Bì≤ÇÁ7G&ˆ∂RÇì∞¢ÇÊfñ∆≈7Gñ∆R“w&v&É#B√#C2√#3√„Rís∞¢f˜"Ü∆WBí“≤í¬3≤í≤≤í≤ÇÊ&VvñÂFÇÇì≤ÇÊ&2Éc"∂í£2¬”R∂í£R¬"¬¬rì≤ÇÊfñ∆¬Çì≤–¢–†¢ÇÁ6fRÇì≤á¶E6∑V∆≈áÇì≤ÇÊ6∆óÇì∞¢ÇÊfñ∆≈7Gñ∆R“&◊áÇ¬‘BÊ6W&÷ñ2¬”ìb¬”B¬ÉÇ¬sbì∞¢ÇÊfñ∆≈&V7BÇ”S¬”#¬3¬33ì∞¢ÚÚFÜRV'2ÊBFÜR'&˜r6óB&˜fRFÜRf6R¬6ÚFÜWí67BˆÁFÚó@¢ˆ66¬áÇ¬”c"¬”s¬Cb¬3B¬„CRì≤ˆ66¬áÇ¬c"¬”s¬Cb¬3B¬„CRì∞¢ˆ66¬áÇ¬¬”#b¬ìb¬#"¬„3Rì∞¢vV"áÇ¬µ≤”ÉB¬”B√u“≈≥s√#b√e“≈≤”3√cB√U“≈≥S"¬”S"√U’“ì∞¢ñbÜFWFñ¬í∞¢ÇÊfñ∆≈7Gñ∆R“w&v&ÉS√#R√#√„bís∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÉCb¬”#"ì≤ÇÊ∆ñÊUFÚÉ"¬”"ì≤ÇÊ∆ñÊUFÚÉìb√CBì≤ÇÊ∆ñÊUFÚÉC"√3"ì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢ÇÁ7G&ˆ∂U7Gñ∆R“w&v&É#B√#C2√#3√„3Bís≤ÇÊ∆ñÊUvñGFÇ“#∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÉCb¬”#"ì≤ÇÊ∆ñÊUFÚÉ"¬”"ì≤ÇÁ7G&ˆ∂RÇì∞¢ÇÊfñ∆≈7Gñ∆R“w&v&É#B√#C2√#3√„SRís∞¢f˜"Ü∆WBí“≤í¬C≤í≤≤í≤ÇÊ&VvñÂFÇÇì≤ÇÊ&2ÉS"∂í£b¬”b∂í£2„B¬"„"¬¬rì≤ÇÊfñ∆¬Çì≤–¢ÇÁ7G&ˆ∂U7Gñ∆R“w&v&Éì√#3R√#3√„bís≤ÇÊ∆ñÊUvñGFÇ“#∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”s¬”sì≤ÇÁVG&Fñ47W'fUFÚÉ¬”ì¬s"¬”cÇì≤ÇÁ7G&ˆ∂RÇì∞¢–¢ÇÁ&W7F˜&RÇì∞†¢ÇÁ6fRÇì≤á¶E6∑V∆≈áÇì≤ÇÊ6∆óÇì∞¢6ˆÁ7B&r“ÇÊ7&VFT∆ñÊV$w&FñVÁBÇ”b¬”b¬C¬Cbì∞¢&rÊFD6ˆ∆˜%7F˜É¬w&v&É#B√#C2√#3√írì≤&rÊFD6ˆ∆˜%7F˜É„Ç¬w&v&É#B√#C2√#3√„ì"írì∞¢&rÊFD6ˆ∆˜%7F˜É„S"¬w&v&É#B√#C2√#3√írì∞¢ÇÁ7G&ˆ∂U7Gñ∆R“&s≤ÇÊ∆ñÊUvñGFÇ“É≤á¶E6∑V∆≈áÇì≤ÇÁ7G&ˆ∂RÇì∞¢6ˆÁ7B&s"“ÇÊ7&VFT∆ñÊV$w&FñVÁBÉÉ¬Éb¬¬bì∞¢&s"ÊFD6ˆ∆˜%7F˜É¬w&v&ÉSR√#SR√#Ç√„Círì≤&s"ÊFD6ˆ∆˜%7F˜É¬w&v&ÉSR√#SR√#Ç√írì∞¢ÇÁ7G&ˆ∂U7Gñ∆R“&s#≤ÇÊ∆ñÊUvñGFÇ“S≤á¶E6∑V∆≈áÇì≤ÇÁ7G&ˆ∂RÇì∞¢ÇÁ&W7F˜&RÇì∞†¢ÇÁ6fRÇì≤á¶E6∑V∆≈áÇì≤ÇÊ6∆óÇì∞¢ÇÊfñ∆≈7Gñ∆R“&◊áÇ¬‘BÁ7FVV¬¬”ì"¬”S"¬ì"¬”#Bì∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”ì"¬”Sì≤ÇÁVG&Fñ47W'fUFÚÉ¬”3b¬ì"¬”Sì∞¢ÇÊ∆ñÊUFÚÉì"¬”#Çì≤ÇÁVG&Fñ47W'fUFÚÉ¬”R¬”ì"¬”#Çì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢ÇÁ7G&ˆ∂U7Gñ∆R“w&v&É##√sÇ√B√„SRís≤ÇÊ∆ñÊUvñGFÇ“"„#≤ÚÚ'&ˆÁ¶RG&ñ–¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”ì¬”Cíì≤ÇÁVG&Fñ47W'fUFÚÉ¬”3R¬ì¬”Cíì≤ÇÁ7G&ˆ∂RÇì∞¢ÇÁ&W7F˜&RÇì∞†¢ÇÁ6fRÇì≤á¶E6∑V∆≈áÇì≤ÇÊ6∆óÇì∞¢6ˆÁ7Bvr“ÇÊ7&VFT∆ñÊV$w&FñVÁBÇ”c¬#B¬s¬ÉBì∞¢vrÊFD6ˆ∆˜%7F˜É¬u$ıÊ÷ñBì≤vrÊFD6ˆ∆˜%7F˜É¬u$ıÊ6˜&Rì∞¢ÇÊfñ∆≈7Gñ∆R“vs∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”"√3ì≤ÇÁVG&Fñ47W'fUFÚÉ√b¬"√3ì∞¢ÇÊ∆ñÊUFÚÉ"√SÇì≤ÇÁVG&Fñ47W'fUFÚÉ√ìb¬”"√SÇì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢ÇÁ7G&ˆ∂U7Gñ∆R“w&v&Éì√#√#√„#bís≤ÇÊ∆ñÊUvñGFÇ“#∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”ìÇ√3"ì≤ÇÁVG&Fñ47W'fUFÚÉ√Ç¬ìÇ√3"ì≤ÇÁ7G&ˆ∂RÇì∞¢ñbÜFWFñ¬í∞¢ÇÁ7G&ˆ∂U7Gñ∆R“w&v&Éì√#√#√„Bís≤ÇÊ∆ñÊUvñGFÇ“#∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”cb√Cì≤ÇÁVG&Fñ47W'fUFÚÇ”3√SÇ¬”b√sBì≤ÇÁ7G&ˆ∂RÇì∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”C√3Bì≤ÇÁVG&Fñ47W'fUFÚÇ”Ç√SB¬B√sì≤ÇÁ7G&ˆ∂RÇì∞¢–¢ÇÁ&W7F˜&RÇì∞¢ÇÊfñ∆≈7Gñ∆R“u$ıÊ÷ñC∞¢ÇÊ&VvñÂFÇÇì≤ÇÊV∆∆ó6RÇ”sB¬CB¬R¬¬”„3R¬¬rì≤ÇÊfñ∆¬Çì∞¢ÇÊfñ∆≈7Gñ∆R“w&v&Éì√#√#√„Çís∞¢ÇÊ&VvñÂFÇÇì≤ÇÊV∆∆ó6RÇ”sÇ¬C¬Ç¬R¬”„3R¬¬rì≤ÇÊfñ∆¬Çì∞†¢ÚÚÜW"WñW2'V‚FÜR6÷R6VÁ6˜"2WfW'óFÜñÊrV«6Rñ‚FÜRFWFá2(	B'WB7ñ‚¿¢ÚÚ&V6W6R6ÜR6∆WBFá&˜VvÇFÜR'&ˆF67BÊBóBÊWfW"&V6ÜVBÜW ¢f˜"Ü6ˆÁ7B∂B¬7Ç¬2¬&˜E“ˆbµ≤”¬”S√„√„“≈≥√S√„í¬”„’“í∞¢ÇÁ6fRÇì≤ÇÁG&Á6∆FRÜ7Ç¬”Çì≤ÇÁ&˜FFRá&˜Bì≤ÇÁ66∆RÜBß2¬2ì∞¢ÇÊfñ∆≈7Gñ∆R“‘BÁ7FVV¬ÊFVW≤ÇÁ6fRÇì≤ÇÁ66∆RÉ„"√„3Bì≤á¶DWñUáÇì≤ÇÊfñ∆¬Çì≤ÇÁ&W7F˜&RÇì∞¢ˆ66¬áÇ¬¬¬3B¬#¬„Rì∞¢ÇÁ6ÜF˜t6ˆ∆˜"“‘BÊ7ñ‚Ê÷ñC≤ÇÁ6ÜF˜t&«W"“##≤ÇÊfñ∆≈7Gñ∆R“‘BÊ7ñ‚Ê÷ñC∞¢á¶DWñUáÇì≤ÇÊfñ∆¬Çì≤ÇÁ6ÜF˜t&«W"“∞¢ÇÊfñ∆≈7Gñ∆R“‘BÊ7ñ‚Ê∆óC≤ÇÊ&VvñÂFÇÇì≤ÇÊV∆∆ó6RÉb¬”R¬í¬2„"¬”„"¬¬rì≤ÇÊfñ∆¬Çì∞¢ÇÁ&W7F˜&RÇì∞¢–†¢ÇÊfñ∆≈7Gñ∆R“‘BÊ7ñ‚Ê÷ñC≤ÇÁ6ÜF˜t6ˆ∆˜"“‘BÊ7ñ‚Ê÷ñC≤ÇÁ6ÜF˜t&«W"“C∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÉ¬”ÉBì≤ÇÊ∆ñÊUFÚÉÇ¬”sBì≤ÇÊ∆ñÊUFÚÉ¬”cBì≤ÇÊ∆ñÊUFÚÇ”Ç¬”sBì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢ÇÁ6ÜF˜t&«W"“∞¢ÇÁ7G&ˆ∂U7Gñ∆R“‘BÊ'&ˆÁ¶RÊ÷ñC≤ÇÊ∆ñÊUvñGFÇ“2„S∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”sÇ¬”c"ì≤ÇÁVG&Fñ47W'fUFÚÇ”b¬”#¬”É"¬”#Çì≤ÇÁ7G&ˆ∂RÇì∞¢ÇÊfñ∆≈7Gñ∆R“‘BÊ7ñ‚Ê∆óC≤ÇÁ6ÜF˜t6ˆ∆˜"“‘BÊ7ñ‚Ê÷ñC≤ÇÁ6ÜF˜t&«W"“c∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ&2Ç”É¬”##¬R„R¬¬rì≤ÇÊfñ∆¬Çì≤ÇÁ6ÜF˜t&«W"“∞¢ÇÁ&W7F˜&RÇì∞ß–†¶gVÊ7Fñˆ‚ÜV∆’FÖáÇí∞¢ÇÊ&VvñÂFÇÇì∞¢ÇÊ÷˜fUFÚÇ”s"¬”3Bì∞¢ÇÊ&W¶ñW$7W'fUFÚÇ”s"¬”Ç¬”3Ç¬”3¬¬”3ì∞¢ÇÊ&W¶ñW$7W'fUFÚÉ3Ç¬”3¬s"¬”Ç¬s"¬”3Bì∞¢ÇÊ&W¶ñW$7W'fUFÚÉsb¬Ç¬s"¬c¬Sb¬ìbì∞¢ÇÊ∆ñÊUFÚÉ3¬ì"ì≤ÇÁVG&Fñ47W'fUFÚÉ#¬S"¬R¬3ì∞¢ÇÊ∆ñÊUFÚÇ”R¬3ì≤ÇÁVG&Fñ47W'fUFÚÇ”#¬S"¬”3¬ì"ì∞¢ÇÊ∆ñÊUFÚÇ”Sb¬ìbì∞¢ÇÊ&W¶ñW$7W'fUFÚÇ”s"¬c¬”sb¬Ç¬”s"¬”3Bì∞¢ÇÊ6∆˜6UFÇÇì∞ß–¶gVÊ7Fñˆ‚ÜV∆‘WñUáÇí∞¢ÇÊ&VvñÂFÇÇì∞¢ÇÊ÷˜fUFÚÇ”3¬bì≤ÇÁVG&Fñ47W'fUFÚÇ”B¬”"¬"¬”Bì∞¢ÇÁVG&Fñ47W'fUFÚÉ3¬”2¬32¬”"ì≤ÇÁVG&Fñ47W'fUFÚÉb¬"¬”Ç¬2ì∞¢ÇÊ6∆˜6UFÇÇì∞ß–¢ÚÚFÜRvÊFW&W"ˆbFÜRˆGó76Wì¢7V&R÷Fˆ÷ñÊÁB6˜&ñÁFÜñ‚ÜV∆“ÜVÊGW&Ê6Rí¬vóFÄ¢ÚÚFÜR7&W7B7W«ññÊrFÜRˆÊ«íGñÊ÷ñ26ÜR‚6«B◊v˜&‚(	BfW&Fñw&ó2ñ‚FÜR7&Wfñ6W2‡¶gVÊ7Fñˆ‚G&tÜW&ıáÇ¬FWFñ¬í∞¢ÇÁ6fRÇì≤ÇÁ&˜FFRÉ„2ì∞¢6ˆÁ7B6r“ÇÊ7&VFT∆ñÊV$w&FñVÁBÇ”ì¬c¬ì¬ìì∞¢6rÊFD6ˆ∆˜%7F˜É¬%%•ıÁ6ÜFRì≤6rÊFD6ˆ∆˜%7F˜É¬%%•ıÊ6˜&Rì∞¢ÇÊfñ∆≈7Gñ∆R“6s∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”#b√ìbì≤ÇÁVG&Fñ47W'fUFÚÇ”ìb√"¬”CB√ì∞¢ÇÊ∆ñÊUFÚÉCB√ì≤ÇÁVG&Fñ47W'fUFÚÉìb√"√#b√ìbì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞†¢6ˆÁ7B6r“ÇÊ7&VFT∆ñÊV$w&FñVÁBÇ”s¬”#¬c¬”cì∞¢6rÊFD6ˆ∆˜%7F˜É¬5$UıÊ∆óBì≤6rÊFD6ˆ∆˜%7F˜É„C"¬5$UıÊ÷ñBì≤6rÊFD6ˆ∆˜%7F˜É¬5$UıÊ6˜&Rì∞¢ÇÊfñ∆≈7Gñ∆R“6s∞¢ÇÊ&VvñÂFÇÇì∞¢ÇÊ÷˜fUFÚÇ”ÉÇ¬”bì∞¢ÇÊ&W¶ñW$7W'fUFÚÇ”b¬”#B¬”S¬”#B¬¬”#Bì∞¢ÇÊ&W¶ñW$7W'fUFÚÉS¬”#B¬b¬”#B¬ÉÇ¬”bì∞¢ÇÊ∆ñÊUFÚÉs¬”3ì∞¢ÇÊ&W¶ñW$7W'fUFÚÉsB¬”B¬3Ç¬”#Ç¬¬”#Çì∞¢ÇÊ&W¶ñW$7W'fUFÚÇ”3Ç¬”#Ç¬”sB¬”B¬”s¬”3ì∞¢ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢ñbÜFWFñ¬í∞¢ÇÁ7G&ˆ∂U7Gñ∆R“w&v&É#SR√ì√É√„#ís≤ÇÊ∆ñÊUvñGFÇ“"„C∞¢f˜"Ü∆WBí“”C≤í√“C≤í≤≤í∞¢6ˆÁ7B“í¢„#“÷FÇÂíÚ#∞¢ÇÊ&VvñÂFÇÇì∞¢ÇÊ÷˜fUFÚÑ÷FÇÊ6˜2Üí¢c"¬÷FÇÁ6ñ‚Üí¢sB“SBì∞¢ÇÊ∆ñÊUFÚÑ÷FÇÊ6˜2Üí¢ìb¬÷FÇÁ6ñ‚Üí¢Ç“Cbì∞¢ÇÁ7G&ˆ∂RÇì∞¢–¢–¢6ˆÁ7B6ˆ÷&r“ÇÊ7&VFT∆ñÊV$w&FñVÁBÇ”C¬”C¬C¬”Çì∞¢6ˆ÷&rÊFD6ˆ∆˜%7F˜É¬%%•ıÊ∆óBì≤6ˆ÷&rÊFD6ˆ∆˜%7F˜É¬%%•ıÁ6ÜFRì∞¢ÇÊfñ∆≈7Gñ∆R“6ˆ÷&s∞¢ÇÊ&VvñÂFÇÇì∞¢ÇÊ÷˜fUFÚÇ”s"¬”3"ì≤ÇÊ&W¶ñW$7W'fUFÚÇ”sb¬”b¬”3Ç¬”3"¬¬”3"ì∞¢ÇÊ&W¶ñW$7W'fUFÚÉ3Ç¬”3"¬sb¬”b¬s"¬”3"ì∞¢ÇÊ∆ñÊUFÚÉc¬”3Bì≤ÇÊ&W¶ñW$7W'fUFÚÉc"¬”ìÇ¬3"¬”#¬¬”#ì∞¢ÇÊ&W¶ñW$7W'fUFÚÇ”3"¬”#¬”c"¬”ìÇ¬”c¬”3Bì∞¢ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞†¢6ˆÁ7Br“ÇÊ7&VFT∆ñÊV$w&FñVÁBÇ”ì"¬”#B¬ÉB¬sÇì∞¢rÊFD6ˆ∆˜%7F˜É¬%%•ıÊ∆óBì≤rÊFD6ˆ∆˜%7F˜É„#Ç¬%%•ıÊ÷ñBì∞¢rÊFD6ˆ∆˜%7F˜É„c¬%%•ıÁ6ÜFRì≤rÊFD6ˆ∆˜%7F˜É¬%%•ıÊ6˜&Rì∞¢ÇÁ6fRÇì≤ÜV∆’FÖáÇì≤ÇÊ6∆óÇì∞¢ÇÊfñ∆≈7Gñ∆R“s≤ÇÊfñ∆≈&V7BÇ”S¬”#¬3¬33ì∞¢ñbÜFWFñ¬í∞¢ÇÊfñ∆≈7Gñ∆R“w&v&ÉsÇ√#"√ìí√„3ís∞¢ÇÊ&VvñÂFÇÇì≤ÇÊV∆∆ó6RÇ”SÇ¬CB¬#¬2¬„B¬¬rì≤ÇÊfñ∆¬Çì∞¢ÇÊ&VvñÂFÇÇì≤ÇÊV∆∆ó6RÉCB¬cb¬R¬í¬”„2¬¬rì≤ÇÊfñ∆¬Çì∞¢ÇÊfñ∆≈7Gñ∆R“w&v&ÉC2√3√Ç√„C"ís∞¢ÇÊ&VvñÂFÇÇì≤ÇÊV∆∆ó6RÉCÇ¬”cB¬B¬Ç¬„b¬¬rì≤ÇÊfñ∆¬Çì∞¢ÇÁ7G&ˆ∂U7Gñ∆R“w&v&É#SR√#32√ÉB√„#ís≤ÇÊ∆ñÊUvñGFÇ“#∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÉ3B¬”s"ì≤ÇÁVG&Fñ47W'fUFÚÉS¬”cb¬c¬”Sbì≤ÇÁ7G&ˆ∂RÇì∞¢–¢ÇÁ7G&ˆ∂U7Gñ∆R“w&v&É#SR√#32√ÉB√„3Bís≤ÇÊ∆ñÊUvñGFÇ“3∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”s¬”3ì≤ÇÁVG&Fñ47W'fUFÚÉ¬”Cb¬s¬”3ì≤ÇÁ7G&ˆ∂RÇì∞¢ÇÁ&W7F˜&RÇì∞†¢ÇÁ6fRÇì≤ÜV∆’FÖáÇì≤ÇÊ6∆óÇì∞¢6ˆÁ7B&r“ÇÊ7&VFT∆ñÊV$w&FñVÁBÇ”B¬”#B¬3B¬Cì∞¢&rÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#32√ÉB√írì≤&rÊFD6ˆ∆˜%7F˜É„Ç¬w&v&É#SR√#32√ÉB√„ìRírì∞¢&rÊFD6ˆ∆˜%7F˜É„SB¬w&v&É#SR√#32√ÉB√írì∞¢ÇÁ7G&ˆ∂U7Gñ∆R“&s≤ÇÊ∆ñÊUvñGFÇ“É≤ÜV∆’FÖáÇì≤ÇÁ7G&ˆ∂RÇì∞¢ÇÁ&W7F˜&RÇì∞†¢f˜"Ü6ˆÁ7B∂B¬7Ö“ˆbµ≤”¬”3Ö“≈≥√3ï’“í∞¢ÇÁ6fRÇì≤ÇÁG&Á6∆FRÜ7Ç¬”bì≤ÇÁ66∆RÜB√ì∞¢ÇÊfñ∆≈7Gñ∆R“r3ccÇs≤ÇÁ6fRÇì≤ÇÁ66∆RÉ„B√„#Çì≤ÜV∆‘WñUáÇì≤ÇÊfñ∆¬Çì≤ÇÁ&W7F˜&RÇì∞¢ÇÁ6ÜF˜t6ˆ∆˜"“%%•ıÊv∆˜s≤ÇÁ6ÜF˜t&«W"“#≤ÇÊfñ∆≈7Gñ∆R“%%•ıÊv∆˜s∞¢ÇÁ6fRÇì≤ÇÁ66∆RÉ„S"√„Cbì≤ÇÁG&Á6∆FRÉb¬”"ì≤ÜV∆‘WñUáÇì≤ÇÊfñ∆¬Çì≤ÇÁ&W7F˜&RÇì∞¢ÇÁ6ÜF˜t&«W"“≤ÇÁ&W7F˜&RÇì∞¢–¢6ˆÁ7BÊr“ÇÊ7&VFT∆ñÊV$w&FñVÁBÇ”í¬”3¬¬3ì∞¢ÊrÊFD6ˆ∆˜%7F˜É¬%%•ıÊ∆óBì≤ÊrÊFD6ˆ∆˜%7F˜É¬%%•ıÁ6ÜFRì∞¢ÇÊfñ∆≈7Gñ∆R“Ês∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”í¬”3Bì≤ÇÊ∆ñÊUFÚÉí¬”3Bì≤ÇÊ∆ñÊUFÚÉr¬Cì≤ÇÊ∆ñÊUFÚÉ¬CÇì≤ÇÊ∆ñÊUFÚÇ”r¬Cì≤ÇÊ6∆˜6UFÇÇì≤ÇÊfñ∆¬Çì∞¢ÇÁ7G&ˆ∂U7Gñ∆R“w&v&É#SR√#32√ÉB√„CRís≤ÇÊ∆ñÊUvñGFÇ“„c∞¢ÇÊ&VvñÂFÇÇì≤ÇÊ÷˜fUFÚÇ”Ç¬”3"ì≤ÇÊ∆ñÊUFÚÇ”b¬3Çì≤ÇÁ7G&ˆ∂RÇì∞¢ÇÁ&W7F˜&RÇì∞ß–†¶gVÊ7Fñˆ‚WFFT7G&¬Çí∞¢ñbÇBÊˆ‚í∞¢ñbÜñÂÇt$4≤rí«¬ñÂÇtÙ≤ríí≤rÁ7FFR“rÊ7G&ƒ&6≤«¬t‘TÂRs≤6gÇÇwVírì≤–¢&WGW&„∞¢–¢ñbÑrÁDñGÇ”“ÁV∆¬írÁDñGÇ“∞¢ñbÖBÊ∆ó7FV‚í≤ÚÚvóFñÊrf˜"'WGFˆ‚FÚ&ñÊ@¢ñbÜ∂Wó5‰W66Rí≤BÊ∆ó7FV‚“ÁV∆√≤6gÇÇwVírì≤&WGW&„≤–¢ñbÖBÊ∆7E&W72„“í∞¢D&ñÊBÖBÊ∆ó7FV‚¬BÊ∆7E&W72ì∞¢rÁFˆ7BáBÇwÚr≤BÊ∆ó7FV‚í≤r(i"r≤D∆&V¬ÖBÊ∆7E&W72íì∞¢BÊ∆ó7FV‚“ÁV∆√≤6gÇÇvˆ≤rì∞¢ÚÚFÜR&ñÊFñÊr&W72ó27Fñ∆¬áó6ñ6∆«íÜV∆C≤vÜV‚6ˆFR7W&W76ñˆ‡¢ÚÚ∆ñgG2óBv˜V∆Bfó&RÜÁFˆ“g&W6ÇVFvRÊBñÁ7FÁF«í&R÷&“ÊWp¢ÚÚ&ñÊBÜÊBVBFÜRWÜóB'WGFˆ‚í‚÷&≤WfW'í6ˆFR2«&VGí÷F˜v‚‡¢ñbáGóVˆbuÙ4ÙDU2”“wVÊFVfñÊVBríf˜"Ü6ˆÁ7B3"ˆbuÙ4ÙDU2íuı$Ue∂3%““G'VS∞¢–¢&WGW&„∞¢–¢6ˆÁ7B‚“EÙ5DîÙÂ2Ê∆VÊwFÇ¬6ˆƒÇ“÷FÇÊ6Vñ¬Ü‚Ú"ì∞¢ñbÜñÂÇtDıt‚rí«¬∂Wó5‰'&˜tF˜v‚í≤rÁDñGÇ“ÑrÁDñGÇ≤íR„≤6gÇÇwVírì≤–¢ñbÜñÂÇuUrí«¬∂Wó5‰'&˜uWí≤rÁDñGÇ“ÑrÁDñGÇ≤‚“íR„≤6gÇÇwVírì≤–¢ñbÜñÂÇtƒTeBrí«¬∂Wó5‰'&˜t∆VgBí≤rÁDñGÇ“ÑrÁDñGÇ≤‚“6ˆƒÇíR„≤6gÇÇwVírì≤–¢ñbÜñÂÇu$îtÖBrí«¬∂Wó5‰'&˜u&ñváBí≤rÁDñGÇ“ÑrÁDñGÇ≤6ˆƒÇíR„≤6gÇÇwVírì≤–¢ÚÚFÜRB◊W7B&R&∆RFÚG&ófRóG2ıt‚6ˆÊfñr67&VV„¢6ˆÊfó&“7F'G2¢ÚÚ&ñÊB¬ÊB$4≤ÚU4Rˆ‚FÜRB∆VfRFÜR67&VV‚(	B&Vf˜&RFÜó2¬FÜP¢ÚÚˆÊ«íví˜WBv2∂Wñ&ˆ&BW66R¬G&f˜"6ˆÁG&ˆ∆∆W"∆ñW'0¢ñbÜ∂Wó5‰VÁFW"«¬∂Wó5‰∂WïÇ«¬ñÂÇtÙ≤ríí≤BÊ∆ó7FV‚“EÙ5DîÙÂ5¥rÁDñGÖ”≤BÊ∆7E&W72“”≤6gÇÇwVírì≤&WGW&„≤–¢ñbÜ∂Wó5‰∂Wï"í≤E&W6WBÇì≤rÁFˆ7BáBÇwE˜v7&W6WBríì≤6gÇÇvˆ≤rì≤–¢ñbÜ∂Wó5‰W66R«¬ñÂÇt$4≤rí«¬ñÂÇuU4Rríí≤rÁ7FFR“rÊ7G&ƒ&6≤«¬t‘TÂRs≤6gÇÇwVírì≤–ß–¶gVÊ7Fñˆ‚G&t÷VÁT$ráG6V2í∞¢6ˆÁ7B6∑í“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬¬¬SCì∞¢6∑íÊFD6ˆ∆˜%7F˜É¬r3SBrì≤6∑íÊFD6ˆ∆˜%7F˜É¬r3##3rì∞¢2Êfñ∆≈7Gñ∆R“6∑ì≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢f˜"Ü∆WBí“≤í¬C≤í≤≤í∞¢6ˆÁ7BáÇ“Ü6É"Üí¬í¢ìc¬óí“ÜÜ6É"Üí¬"í¢SC≤G6V2¢Éb≤Ü6É"Üí¬2í¢BííRSC∞¢2Êfñ∆≈7Gñ∆R“w&v&É#√##√#SR¬r≤É„≤Ü6É"Üí¬Bí¢„2í≤rís∞¢2Êfñ∆≈&V7BááÇ¬óí¬"„B¬"„Bì∞¢–¢ÚÚÖ§B”ìí∂VWñÊrvF6Ç&VÜñÊBFÜR÷VÁR‚7W&W76VBˆ‚FÜR6Üˆ˜6W"¬vÜW&R6ÜRv˜V∆@¢ÚÚ˜FÜW'vó6R6Ü˜rFá&˜VvÇFÜRÜW&Úw26&BÊB∆VÊBÜñ“ÜW"ÁFVÊÊ‡¢ñbÑrÁ7FFR”“utÑÚríG&t÷VÁT6BáG6V2ì∞ß–¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚDÑRDïDƒR‘44ıBï2DÑR4Ñ$5DU"¬E$t‚%íDÑR4Ñ$5DU"u2ıt‚4ÙDR‡¢Ú¢ÚÚóBW6VBFÚ&RG&tÁñ(	B6W&FRf∆BfV7F˜"ÜVB¬BSÇR«Ü¬vóFÄ¢ÚÚFñffW&VÁB6ˆ∆˜W'2¬ÊÚfó6˜"&"ÊBV'2FÜRw&ˆÊr6ÜR‚6ÚFÜRfó'7@¢ÚÚñ7GW&RˆbÜW"Áñ&ˆGíWfW"6rv2ˆb6ˆ÷V&ˆGíV«6R¬ÊBWfW'í72ˆ`¢ÚÚ6ÜFñÊrFÜR&V¬Ö§B”ìív˜BÜ6ˆ÷÷óGFVB∆ñváB¬6˜&R6ÜF˜r¬67B6ÜF˜w2¬FÜP¢ÚÚ&V6W76VBfó6˜"¬FÜRf˜&÷VBV'2í'&ófVBÊ˜vÜW&RÊV"FÜRFóF∆R67&VV‚‡¢Ú¢ÚÚ6ÜRó2˜6VBÊBG&v‚ÜW&R'í∆ñW"ÊG&rBf˜W"Fñ÷W26ó¶R‚GvÚFÜñÊw0¢ÚÚfˆ∆∆˜rFÜB&Rv˜'FÇ÷˜&RFÜ‚FÜRñ7GW&S¢FÜRFóF∆R6‚ÊWfW"vñ‡¢ÚÚFó6w&VRvóFÇFÜRv÷R&˜WBvÜB6ÜR∆ˆˆ∑2∆ñ∂R¬ÊBÁóFÜñÊrFˆÊRFÚÜW ¢ÚÚ∆FW"6Ü˜w2WÜW&Rf˜"g&VR‡¢Ú¢ÚÚ∆ñW"ÊG&r&VG2FÜRv˜&∆BóBWáV7G2FÚ&RñÁ6ñFR(	BFÜR¶ˆÊR∆WGFR¬FÜP¢ÚÚ6fR¬FÜR÷VFñ÷ÊñfW7B(	B6Ú÷VÁRvóFÇÊÚ'V‚∆ˆFVBÜ2FÚ∆VÊBóBˆÊR‡¢ÚÚFÜRvÜˆ∆RFÜñÊró2w&VC¢÷66˜B◊W7BÊWfW"&R&∆RFÚF∂RFÜRFóF∆P¢ÚÚ67&VV‚F˜v‚vóFÇóB‡¶∆WB‘TÂUÙ4B“ÁV∆¬¬‘TÂUÙ4EÙÙdb“f«6S∞¶gVÊ7Fñˆ‚G&t÷VÁT6BáG6V2í∞¢ñbÑ‘TÂUÙ4EÙÙdb«¬GóVˆb∆ñW"”“vgVÊ7Fñˆ‚rí&WGW&„∞¢2Á6fRÇì∞¢6ˆÁ7BÜV∆E&ˆˆ““rÁ&ˆˆ‘FVb¬ÜV∆E6fR“rÁ6fR¬ÜV∆Dw&ñB“rÊw&ñC∞¢G'í∞¢ñbÇ‘TÂUÙ4Bí∞¢‘TÂUÙ4B“ÊWr∆ñW"É¬ì∞¢‘TÂUÙ4BÊ6˜&W2“S≤‘TÂUÙ4BÁfˆ«G2“c≤‘TÂUÙ4BÊˆ‚“G'VS≤‘TÂUÙ4BÊf6R“”∞¢‘TÂUÙ4BÊf6Ufó2“”≤ÚÚ∆ˆˆ∂ñÊrñ‚F˜v&BFÜR÷VÁP¢–¢6ˆÁ7B“‘TÂUÙ4C∞¢ÊÊñ““G6V3≤ÚÚñF∆R'&VFÜñÊr¬66&b¬Fñ¿¢Á&ñtGB“Úc∞¢ÊñF∆UB“G6V3∞¢ÁÇ“≤Áí“≤ÁgÇ“≤Ágí“∞¢ñbÇrÁ&ˆˆ‘FVbírÁ&ˆˆ‘FVb“≤¶ˆÊS¢tr¬s¢3¬É¢r”∞¢ñbÇrÁ6fRírÁ6fR“≤6∂ñ∆«3¢µ“¬7&W7G3¢µ“¬&V∆ñ73¢µ“¬f∆w3¢∑“¬&ñ√¢∑“¬ó¢¬67&¢”∞¢ÚÚ‰Úd¥RdƒÙı"Ü˜vÊW"'V∆ñÊr¬##b”Ç”#í‚FÜó2∆VÁBFÜR÷VÁRˆÊR◊Fñ∆P¢ÚÚ6∆"6Úw&˜VÊB&ˆ&Rv˜V∆BfñÊB6ˆ÷WFÜñÊrVÊFW"ÜW"fVWC≤FÜW&Ró2Ê¢ÚÚ6ˆÁF7B6ÜF˜rÁí÷˜&R¬6ÚFÜR6∆"ó2f∆ˆ˜"Ê˜FÜñÊr7FÊG2ˆ‚‚FÜP¢ÚÚw&ñB7Fñ∆¬Ü2FÚUÑï5B(	BFñ∆TB&VG2óG2∆VÊwFÇVÊwV&FVB¬ÊBFÜP¢ÚÚ÷66˜BG&ró2ñÁ6ñFRG'íˆ6F6ÇFÜBW&÷ÊVÁF«íFó6&∆W2FÜR÷66˜Bˆ‡¢ÚÚFá&˜r(	B6ÚóBó2ˆÊRFñ∆Rˆbï#¢&W6VÁBFÚ&R&VB¬6ˆ∆ñBFÚÊ˜FÜñÊr‡¢ñbÇrÊw&ñBírÊw&ñB“µ≤r‚u’”∞¢ÚÚ6∆˜rÜ˜fW"6Ú6ÜR&VG22∆ófR&FÜW"FÜ‚2FV6¿¢6ˆÁ7B&ˆ"“÷FÇÁ6ñ‚áG6V2¢„bí¢S∞¢2ÁG&Á6∆FRÉsÉb¬3ÉB≤&ˆ"ì∞¢2Á66∆RÉB„¬B„ì∞¢2ÁG&Á6∆FRÇ◊ÁrÚ"¬◊ÊÇì∞¢ÊG&rÜ2ì∞¢“6F6ÇÜRí∞¢ÚÚˆÊRfñ«W&Ró2VÊ˜VvÉ¢7F˜G'ññÊr&FÜW"FÜ‚Fá&˜rWfW'íg&÷P¢‘TÂUÙ4EÙÙdb“G'VS∞¢ñbáGóVˆb6ˆÁ6ˆ∆R”“wVÊFVfñÊVBrí6ˆÁ6ˆ∆RÁv&‚Çv÷VÁR÷66˜BFó6&∆VC¢r¬Rì∞¢–¢rÁ&ˆˆ‘FVb“ÜV∆E&ˆˆ”≤rÁ6fR“ÜV∆E6fS≤rÊw&ñB“ÜV∆Dw&ñC∞¢2Á&W7F˜&RÇì≤2Á6ÜF˜t&«W"“≤2Êv∆ˆ&ƒ«Ü“∞ß–¶gVÊ7Fñˆ‚G&ráF◊2í∞¢6ˆÁ7BG6V2“F◊2Ú∞¢ÚÚFÜR&6∂'VffW"÷í&RÁí6ó¶RFÜRFWfñ6R6‚ff˜&C≤WfW'óFÜñÊr&V∆˜rFÜó0¢ÚÚ∆ñÊRó2w&óGFV‚vñÁ7BìcÉSCÊBÊWfW"ÊVVG2FÚ∂Ê˜rvÜñ6Ç‡¢ñbáGóVˆbg&÷R””“vgVÊ7Fñˆ‚ríg&÷RÜ2ì∞¢2Ê6∆V%&V7BÉ¬¬ìc¬SCì∞¢6ˆÁ7B7B“rÁ7FFS∞¢ñbáGóVˆbG&tÜW&Ù÷˜Fñˆ‰∆ˆFñÊr””“vgVÊ7Fñˆ‚rbbG&tÜW&Ù÷˜Fñˆ‰∆ˆFñÊrÜ2íí&WGW&„∞¢ñbá7B””“t4î‰Rrí≤G&t6ñÊRÇì≤&WGW&„≤–¢ñbá7B””“t5UBrí≤G&t7WBÇì≤&WGW&„≤–¢ñbá7B””“t‘TÂRr«¬7B””“tƒ‰u4T¬r«¬7B””“tDîdbr«¬7B””“utÑÚr«¬á7B””“t5E$¬rbbrÊ7G&ƒ&6≤””“t‘TÂRrí«¬7B””“tt‘TıdU"rí∞¢G&t÷VÁT$ráG6V2ì∞¢ñbá7B””“tƒ‰u4T¬rí∞¢gGáBáBÇv∆Êu˜FóF∆Rrí¬CÉ¬#¬C¬r6VVc6fr¬v6VÁFW"r¬r33vffCrì∞¢ƒ‰u2Êf˜$V6ÇÇÜ¬¬íí”‚∞¢6ˆÁ7B6V¬“í””“rÊ∆ÊtñGÇ¬í“#≤í¢S#∞¢ñbá6V¬í≤2Êfñ∆≈7Gñ∆R“w&v&ÉSR√#SR√#Ç√„"ís≤'"Ü2¬3C¬í“#B¬#É¬CB¬ì≤2Êfñ∆¬Çì≤–¢gGáBÇá6V¬Ú~)kÇr¢rrí≤¬ÊÊ÷R¬CÉ¬í¬#b¬6V¬Úr6VVc6fr¢r3vCì6Çr¬v6VÁFW"r¬6V¬Úr33vffCr¢ÁV∆¬ì∞¢“ì∞¢gGáBáBÇv∆ÊuˆÜñÁBrí¬CÉ¬S¬B¬r3SCf#vBrì∞¢&WGW&„∞¢–¢ñbá7B””“utÑÚrí∞¢gGáBáBÇwvÜı˜rí¬CÉ¬ì¬C"¬r6VVc6fr¬v6VÁFW"r¬r33vffCrì∞¢f˜"Ü∆WBí“≤í¬#≤í≤≤í∞¢6ˆÁ7BÇ“#S≤í¢Cc¬6V¬“í””“rÁvÜÙñGÉ∞¢Fñ’ÊV¬áÇ“s¬S¬3C¬3ì∞¢ñbá6V¬í∞¢2Á7G&ˆ∂U7Gñ∆R“íÚr6ffCìÜr¢r33vffCs≤2Ê∆ñÊUvñGFÇ“"„S∞¢'"Ü2¬Ç“s¬S¬3C¬3¬"ì≤2Á7G&ˆ∂RÇì∞¢–¢2Á6fRÇì≤2ÁG&Á6∆FRáÇ¬#S"ì≤2Á66∆RÉ„C"¬„C"ì∞¢ñbÜí””“íG&tÁñÜ2¬f«6Rì≤V«6RG&tÜW&ıÜ2¬f«6Rì∞¢2Á&W7F˜&RÇì≤2Á6ÜF˜t&«W"“∞¢gGáBáBÜíÚwvÜıˆÜW&Úr¢wvÜı˜&ˆ&Úrí¬Ç¬3c¬#¬6V¬Úr6VVc6fr¢r3Ü&#Rrì∞¢gGáBáBÜíÚwvÜıˆÜW&ˆBr¢wvÜı˜&ˆ&ˆBrí¬Ç¬3ì"¬2¬r3vCì6Çrì∞¢ÚÚ6Ü˜rvÜWFÜW"FÜó26Ü&7FW"Ü2f˜ñvRñ‚&ˆw&W70¢6ˆÁ7BÜ2“∆ˆE7F˜&VBÜíÚvÜW&Úr¢w&ˆ&Úrì∞¢gGáBÜÜ2Ú~)xÚr≤BÇwvÜıˆ6ˆÁBrí¢BÇwvÜıˆÊWrrí¬Ç¬CÇ¬"¬Ü2ÚÜíÚr6ffCìÜr¢r33vffCrí¢r3ccsÉÜrì∞¢ñbá6V¬ígGáBÇ~)kÇr¬Ç¬C3Ç¬Ç¬íÚr6ffCìÜr¢r33vffCrì∞¢–¢gGáBÇ~(i(i"+rVÁFW"r¬CÉ¬S¬2¬r3SCf#vBrì∞¢&WGW&„∞¢–¢ñbá7B””“t‘TÂRrí∞¢gGáBáBÇwFóF∆Rrí¬3C¬#¬cB¬r6VVc6fr¬v6VÁFW"r¬r33vffCrì∞¢gGáBáBÇw7V'FóF∆Rrí¬3C¬cÇ¬r¬r3ñf#Ü3Çrì∞¢G&tv«óÖFWáBÜ2¬%5ıDïDƒR¬3C¬#¬2¬w&v&ÉSR√#SR√#Ç√„SRír¬w&v&ÉSR√#SR√#Ç√„Bírì∞¢6ˆÁ7B˜G2“÷VÁT˜FñˆÁ2Çì∞¢6ˆÁ7B∆&V«2“∞¢∆ì¢BÇv÷VÁU˜∆írí¬6ˆÁFñÁVS¢BÇv÷VÁUˆ6ˆÁFñÁVRrí¬ÊWvv÷S¢BÇv÷VÁUˆÊWvv÷Rrí¿¢fñ∆”¢BÇv÷VÁUˆfñ∆“rí¬6ˆÁG&ˆ«3¢BÇv÷VÁUˆ6ˆÁG&ˆ«2rí¿¢∆Ês¢BÇv÷VÁUˆ∆ÊwVvRrí≤s¢r≤∆ÊtÊ÷RÑƒ‰rí¿¢'&ñváC¢BÇv÷VÁUˆ'&ñváBrí≤s¢r≤BÑ%$îtÖEÙ‰‘U5∂'&ñváDñGÇÇï“í¿¢6˜VÊC¢’UDTBÚBÇv÷VÁU˜6˜VÊEˆˆfbrí¢BÇv÷VÁU˜6˜VÊEˆˆ‚rí¿¢◊W6ñ3¢’U4î5ÙÙ‚ÚBÇv÷VÁUˆ◊W6ñ5ˆˆ‚rí¢BÇv÷VÁUˆ◊W6ñ5ˆˆfbrí¿¢”∞¢˜G2Êf˜$V6ÇÇÜÚ¬íí”‚∞¢6ˆÁ7B6V¬“í””“rÊ÷VÁTñGÉ∞¢gGáBÇá6V¬Ú~)kÇr¢rrí≤∆&V«5∂ı“¬3C¬#S≤í¢C¬#"¬6V¬Úr6VVc6fr¢r3vCì6Çr¬v6VÁFW"r¬6V¬Úr33vffCr¢ÁV∆¬ì∞¢“ì∞¢ÚÚFÜR7GVFñÚÊBFÜR'Vñ∆B7F◊(	BvÜÚ÷FRóB¬ÊBvÜñ6ÇˆÊRñ˜R&R'VÊÊñÊp¢G&tfˆ˜FW"ÉS#¬f«6Rì∞¢ÚÚÊWvW"'Vñ∆BWÜó7G2(	BˆffW"óB&ñváBˆ‚FÜRFóF∆R67&VV‡¢ñbÑrÁWFFU&VGíí∞¢6ˆÁ7BR“„b≤÷FÇÁ6ñ‚áG6V2¢Bí¢„C∞¢2Êfñ∆≈7Gñ∆R“w&v&É#√c√S√„ì"ís≤'"Ü2¬#S¬CS"¬Cc¬Cb¬"ì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉSR√#SR√#Ç¬r≤R≤rís≤2Ê∆ñÊUvñGFÇ“#∞¢'"Ü2¬#S¬CS"¬Cc¬Cb¬"ì≤2Á7G&ˆ∂RÇì∞¢gGáBÇ~)˚2r≤BÇwWE˜&VGíríÁ&W∆6RÇrW2r¬rÁWFFU&VGíí¬CÉ¬Cs¬R¬r6VVc6frì∞¢gGáBáBÇwWE˜Frí¬CÉ¬CÉí¬"¬r3ÜfCÜ3Çrì∞¢–¢“V«6Rñbá7B””“tDîdbrí∞¢gGáBáBÇvFñfe˜FóF∆Rrí¬CÉ¬ì¬C¬r6VVc6fr¬v6VÁFW"r¬r33vffCrì∞¢f˜"Ü∆WBí“≤í¬3≤í≤≤í∞¢6ˆÁ7B6V¬“í””“rÊFñfdñGÉ∞¢Fñ’ÊV¬É#3¬S≤í¢R¬S¬ÉÇì∞¢ñbá6V¬í≤2Á7G&ˆ∂U7Gñ∆R“r33vffCs≤2Ê∆ñÊUvñGFÇ“#≤'"Ü2¬#3¬S≤í¢R¬S¬ÉÇ¬"ì≤2Á7G&ˆ∂RÇì≤–¢gGáBÇá6V¬Ú~)kÇr¢rrí≤BÇvFñfbr≤íí¬CÉ¬É"≤í¢R¬#B¬6V¬Úr6VVc6fr¢r3Ü&#Rrì∞¢gGáBáBÇvFñfbr≤í≤vBrí¬CÉ¬#"≤í¢R¬B¬r3vCì6Çrì∞¢–¢“V«6Rñbá7B””“tt‘TıdU"rí∞¢gGáBáBÇvv÷V˜fW"rí¬CÉ¬##¬S"¬r6fcVcfBr¬v6VÁFW"r¬r6fcVcfBrì∞¢gGáBáBÇvv÷V˜fW#"rí¬CÉ¬#ÉR¬Ç¬r3ñf#Ü3Çrì∞¢gGáBáBÇw&W72rí¬CÉ¬3c¬b¬r3vCì6Çrì∞¢–¢ñbá7B””“t5E$¬rbbrÊ7G&ƒ&6≤””“t‘TÂRríG&t7G&¬Çì∞¢&WGW&„∞¢–¢ñbá7B””“tîÂE$Úrí∞¢6ˆÁ7BB“rÊñÁG&ıC∞¢2Êfñ∆≈7Gñ∆R“r3#Cís≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢f˜"Ü∆WBí“≤í¬3C≤í≤≤í∞¢6ˆÁ7Bóí“ÜÜ6É"Üí¬"í¢SC≤B¢ÉÇ≤Ü6É"Üí¬2í¢ÇííRSC∞¢2Êfñ∆≈7Gñ∆R“w&v&É#√##√#SR¬r≤É„b≤Ü6É"Üí¬Bí¢„"í≤rís∞¢2Êfñ∆≈&V7BÜÜ6É"Üí¬í¢ìc¬óí¬"„"¬"„"ì∞¢–¢6ˆÁ7B&VB“Ü¬"¬GáBí”‚∞¢ñbÖB„“bbB¬"í∞¢2Êv∆ˆ&ƒ«Ü“÷FÇÊ÷ñ‚É¬ÖB“íÚ„Çí¢÷FÇÊ÷ñ‚É¬Ü"“BíÚ„Çì∞¢w&FWáBáGáB¬s¬#"íÊf˜$V6ÇÇÜ∆‚¬íí”‚gGáBÜ∆‚¬CÉ¬#S≤í¢3"¬#"¬r66fS6Vbr¬v6VÁFW"r¬ÁV∆¬¬scríì∞¢2Êv∆ˆ&ƒ«Ü“∞¢–¢”∞¢&VBÉ„B¬2„B¬BÇvñÁG&Ûríì∞¢&VBÉ2„b¬b„b¬BÇvñÁG&Û"ríì∞¢&VBÉb„Ç¬í„B¬BÇvñÁG&Û2ríì∞¢ñbÖB„“í„bí∞¢ñbÇrÊñÁG&ı6∆“í≤rÊñÁG&ı6∆““G'VS≤6gÇÇw&ˆ"rì≤6gÇÇv&ˆˆ“rì≤–¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉSR√#SR√#Ç√„#"ís≤2Ê∆ñÊUvñGFÇ“3∞¢f˜"Ü∆WBí“≤í¬#≤í≤≤í∞¢6ˆÁ7B“íÚ#¢÷FÇÂí¢"≤„∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÉCÉ≤÷FÇÊ6˜2Üí¢S¬#C≤÷FÇÁ6ñ‚Üí¢ìRì∞¢2Ê∆ñÊUFÚÉCÉ≤÷FÇÊ6˜2Üí¢cC¬#C≤÷FÇÁ6ñ‚Üí¢C3ì∞¢2Á7G&ˆ∂RÇì∞¢–¢6ˆÁ7B≤“÷FÇÊ÷ñ‚É¬ÖB“í„bíÚ„#Rì∞¢2Á6fRÇì≤2ÁG&Á6∆FRÉCÉ¬#3Rì≤2Á66∆RÉ"„B“„B¢≤¬"„B“„B¢≤ì∞¢gGáBáBÇwFóF∆Rrí¬¬¬s"¬r6VVc6fr¬v6VÁFW"r¬r33vffCrì∞¢2Á&W7F˜&RÇì∞¢gGáBáBÇvñÁG&ÛBrí¬CÉ¬33R¬3¬r6fcVcfBr¬v6VÁFW"r¬r6fcVcfBrì∞¢ñbÖB¬„"í≤2Êfñ∆≈7Gñ∆R“w&v&É#SR√#SR√#SR¬r≤÷FÇÊ÷ÇÉ¬“ÖB“í„bíÚ„bí≤rís≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì≤–¢–¢gGáBáBÇvñÁG&ı˜6∂órí¬CÉ¬S"¬2¬r3SCf#vBrì∞¢&WGW&„∞¢–¢ñbá7B””“t‘ı$Rrí∞¢ÚÚFÜRv˜&∆B7Fó2&VÜñÊBóB¬Fñ÷÷VB‚6ÜRó27FÊFñÊrñ‚FÜRFˆ˜'ví6ÜP¢ÚÚ6ÊÊ˜BvÚFá&˜VvÇñWB¬ÊBFÜR67&VV‚6Ü˜V∆B&VB2ÜW"∆ˆˆ∂ñÊrBó@¢G&uv˜&∆Dg&÷RÇì∞¢2Êfñ∆≈7Gñ∆R“w&v&É2√r√"√„Ébís≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢gGáBáBÇvFV÷ıˆVÊCrí¬CÉ¬3"¬CB¬r6VcvCÇr¬v6VÁFW"r¬r33vffCrì∞¢gGáBáBÇvFV÷ıˆVÊC"rí¬CÉ¬ìb¬í¬r66fS6Vbrì∞¢gGáBáBÇvFV÷ıˆVÊC2rí¬CÉ¬#3"¬r¬r3Ü&#Rrì∞¢6ˆÁ7B2“rÁ6fS∞¢6ˆÁ7B÷ñÁ2“÷FÇÊf∆ˆ˜"á2ÁFñ÷RÚcí¬6V72“÷FÇÊf∆ˆ˜"á2ÁFñ÷RRcì∞¢6ˆÁ7B&˜76W2“≤tv∆óF6Çr¬t«Üu“Êfñ«FW"Ü"”‚2Êf∆w5≤v&˜72r≤%“íÊ∆VÊwFÉ∞¢gGáBáBÇw7FG5˜Fñ÷Rrí≤rr≤÷ñÁ2≤s¢r≤7G&ñÊrá6V72íÁE7F'BÉ"¬srê¢≤rr≤BÇvFV÷ıˆwV&FñÁ2rí≤rr≤&˜76W2≤rÛ"r¿¢CÉ¬#ì"¬b¬r3vCì6Çrì∞¢6ˆÁ7B¬“÷˜&T∆ñ˜WBÇì∞¢¬Á&˜w2Êf˜$V6ÇÇÜ≤¬íí”‚∞¢6ˆÁ7Bí“¬Áì≤í¢¬Á7FW¬ˆ‚“í””“rÊ÷˜&TñGÉ∞¢2Á6fRÇì∞¢2Êfñ∆≈7Gñ∆R“ˆ‚Úw&v&ÉSR√#SR√#Ç√„Bír¢w&v&É#√S√s√„rís∞¢2Á7G&ˆ∂U7Gñ∆R“ˆ‚Úr33vffCr¢r33CcVs∞¢2Ê∆ñÊUvñGFÇ“ˆ‚Ú"¢∞¢2Ê&VvñÂFÇÇì≤2Á&V7BÉCÉ“¬ÁrÚ"¬í“¬ÊÇÚ"¬¬Ár¬¬ÊÇì≤2Êfñ∆¬Çì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢gGáBáBÜ≤í¬CÉ¬í≤b¬Ç¬ˆ‚Úr6VVc6fr¢r3ñF#63Br¬v6VÁFW"r¬ˆ‚Úr33vffCr¢ÁV∆¬ì∞¢“ì∞¢&WGW&„∞¢–¢ñbá7B””“utî‚rí∞¢G&t÷VÁT$ráG6V2ì∞¢gGáBáBÇwvñ„rí¬CÉ¬#¬S"¬r6VcvCÇr¬v6VÁFW"r¬r33vffCrì∞¢gGáBáBÇwvñ„"rí¬CÉ¬ÉR¬r¬r66fS6Vbrì∞¢6ˆÁ7B2“rÁ6fS∞¢6ˆÁ7B÷ñÁ2“÷FÇÊf∆ˆ˜"á2ÁFñ÷RÚcí¬6V72“÷FÇÊf∆ˆ˜"á2ÁFñ÷RRcì∞¢6ˆÁ7B&˜76W2“≤tv∆óF6Çr¬t'&ˆˆBr¬tF∆2r¬u¶W&Úr¬u&ó6“r¬t÷˜FÜW"u“Êfñ«FW"Ü"”‚2Êf∆w5≤v&˜72r≤%“íÊ∆VÊwFÉ∞¢6ˆÁ7B÷ˆG2“≤vF6Çr¬vFßV◊r¬wv∆¬r¬vV◊r¬v∂Wíu“Êfñ«FW"Ü“”‚2Ê&ñ≈∂’“íÊ∆VÊwFÉ∞¢6ˆÁ7B6ˆ◊“÷FÇÊ÷ñ‚É¬&˜76W2¢≤2Ê7&W7G2Ê∆VÊwFÇ¢2≤÷ˆG2¢2≤á2Ávˆ‚Ú¢íì∞¢6ˆÁ7B&˜w2“∞¢∑BÇw7FG5˜Fñ÷Rrí¬÷ñÁ2≤s¢r≤7G&ñÊrá6V72íÁE7F'BÉ"¬srï“¿¢∑BÇw7FG5ˆFVFá2rí¬2ÊFVFá5“¿¢∑BÇw7FG5˜67&rí¬2Á67&“¿¢∑BÇw7FG5ˆ6ˆ◊rí¬6ˆ◊≤rRu“¿¢”∞¢&˜w2Êf˜$V6ÇÇá"¬íí”‚∞¢gGáBá%≥“¬3É¬#c≤í¢3B¬Ç¬r3Ü&#Rr¬w&ñváBrì∞¢gGáBÖ7G&ñÊrá%≥“í¬C#¬#c≤í¢3B¬Ç¬r6VVc6fr¬v∆VgBrì∞¢“ì∞¢gGáBáBÇwvñ„2rí¬CÉ¬C3¬#"¬r6VVc6fr¬v6VÁFW"r¬r33vffCrì∞¢gGáBáBÇw&W72rí¬CÉ¬CÉ¬R¬r3vCì6Çrì∞¢&WGW&„∞¢–¢ÚÚñ‚◊v˜&∆B7FFW2&VÊFW"FÜRv˜&∆B&VÜñÊ@¢G&uv˜&∆Dg&÷RÇì∞¢ñbáGóVˆbvóFÖv˜&∆E&ˆ¶V7Fñˆ‚””“vgVÊ7Fñˆ‚rívóFÖv˜&∆E&ˆ¶V7Fñˆ‚Ü2∆G&teÇì≤V«6RG&teÇÇì∞¢ÚÚDÑRƒîtÖE24Ù‘î‰rUˆ‚wV&Fñ‚w26Ü÷&W"‚˜fW"FÜRv˜&∆BÊBVÊFW"FÜP¢ÚÚÖTB¬6ÚFÜR&ˆˆ“ó2vÜBF&∂VÁ2(	B&∆6≤g&÷RvóFÇFÜR∆ñW"w2˜v‡¢ÚÚ&VF˜WG26óGFñÊrˆ‚F˜ˆbóBv˜V∆BßW7B∆ˆˆ≤∆ñ∂R'&ˆ∂V‚67&VV‚‚ó@¢ÚÚÜˆ∆G2ÊV&«íF&≤f˜"FÜRfó'7B&VB¬FÜV‚∆ñgG2¬vóFÇfñvÊWGFRFÜ@¢ÚÚ7Fó2÷ˆ÷VÁB∆ˆÊvW"BFÜRVFvW26ÚFÜR∆ñváB&VG22'&ófñÊrg&ˆ–¢ÚÚ&˜fR&FÜW"FÜ‚2‚˜fW&∆í&VñÊr7vóF6ÜVBˆfb‡¢ñbÑrÊ&˜74VÁG'íí∞¢6ˆÁ7B≤“6∆◊ÑrÊ&˜74VÁG'íÁBÚÑrÊ&˜74VÁG'íÊGW"¢„s"í¬¬ì∞¢6ˆÁ7BR“≤¬„3Ú¢Ü≤“„3íÚ„s∞¢6ˆÁ7BF&≤“É“Rí¢„ÉÉ∞¢ñbÜF&≤‚„Bí∞¢2Á6fRÇì∞¢2Êfñ∆≈7Gñ∆R“w&v&É"√B√Ç¬r≤F&≤ÁFÙfóÜVBÉ2í≤rís∞¢2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢6ˆÁ7Bfs"“2Ê7&VFU&Fñƒw&FñVÁBÉCÉ¬3¬#¬CÉ¬3¬c#ì∞¢fs"ÊFD6ˆ∆˜%7F˜É¬w&v&É√√√írì∞¢fs"ÊFD6ˆ∆˜%7F˜É¬w&v&É√√¬r≤É„SR¢É“R¢„SRííÁFÙfóÜVBÉ2í≤rírì∞¢2Êfñ∆≈7Gñ∆R“fs#≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢2Á&W7F˜&RÇì∞¢–¢–¢ÚÚDÑRÑTƒBe$‘Rï2DÑRtı$ƒB¬‰ıBDÑR45$TT‚‚w&&&ñÊrFÜRfñÊó6ÜVB67&VV‡¢ÚÚ÷VÁBFÜR7&˜76ñÊr6∆ñBFÜRÖTBFˆÚ(	BGvÚ÷'WGFˆÁ2ÊBGvÚ&˜w2ˆ`¢ÚÚÜV'G2¬vÜñ6Ç&VG22v∆óF6Ç&FÜW"FÜ‚2G&fV¬‚óBó2F∂V‚ÑU$R¿¢ÚÚ&Vf˜&RFÜRñÁFW&f6RvˆW2ˆ‚¬ÊBˆÊ«íñ‚FÜR÷ˆ÷VÁG27&˜76ñÊr6˜V∆@¢ÚÚ7GV∆«í7F'C¢gV∆¬÷&6∂'VffW"&∆óBWfW'íg&÷RˆbFÜRv÷RFÚ6W'fR¢ÚÚFÜó&Bˆb6V6ˆÊBBFˆ˜'víó2Ê˜BG&FRv˜'FÇ÷∂ñÊr‡¢Üˆ∆Dg&÷TÊV$WÜóBÇì∞¢ñbáGóVˆbG&t'$FV«F””“vgVÊ7Fñˆ‚ríG&t'$FV«FÇì∞¢G&uGWF˜"Çì∞¢ñbáGóVˆbG&tvFUv∆≤””“vgVÊ7Fñˆ‚rí≤ñbáGóVˆbvóFÖv˜&∆E&ˆ¶V7Fñˆ‚””“vgVÊ7Fñˆ‚rívóFÖv˜&∆E&ˆ¶V7Fñˆ‚Ü2∆G&tvFUv∆≤ì≤V«6RG&tvFUv∆≤Çì≤–¢G&t∆W76ˆ‚Çì∞¢G&tÖTBÇì∞¢G&t÷'WGFˆ‚Çì∞¢ñbáGóVˆbG&u6˜VÊD6Üó””“vgVÊ7Fñˆ‚ríG&u6˜VÊD6ÜóáG6V2ì∞¢ñbáGóVˆbG&u6fTfVVF&6≤””“vgVÊ7Fñˆ‚ríG&u6fTfVVF&6≤Çì∞¢ÚÚDÑRU4Ç‚FÜRg&÷R6ÜR∆VgBó2ÜV∆BÊB6∆ñBˆfbFÜRVFvR6ÜR∆VgB'í¬6¢ÚÚFÜRGvÚ&ˆˆ◊2&VB2ˆÊR6ˆÁFñÁV˜W276RG&fV∆∆VBFá&˜VvÇ&FÜW"FÜ‡¢ÚÚGvÚñ7GW&W27vVB‚G&v‚ñ‚$rDUdî4RïÑT≈2(	BFÜRV∆óGíFñ¬66∆W0¢ÚÚFÜR&6∂'VffW"¬ÊB6∆ñFR÷V7W&VBñ‚∆ñ˜WBVÊóG2FV'2BFÜR6V“‡¢ñbÑrÁG&Á2í∞¢ñbáG&Á56Êí∞¢6ˆÁ7B≤“6∆◊É“rÁG&Á2ÁBÚE$Â5ÙEU"¬¬ì∞¢ÚÚV6VB6ÚóB∆VfW2f7BÊB6WGF∆W3¢∆ñÊV"6∆ñFR&VG22vóP¢6ˆÁ7BR““÷FÇÁ˜rÉ“≤¬"„"ì∞¢6ˆÁ7Br“7bÁvñGFÇ¬Ç“7bÊÜVñváC∞¢6ˆÁ7B6B“rÁG&Á2Á6ñFS∞¢6ˆÁ7BGÇ“6B””“u"rÚ÷R¢r¢6B””“t¬rÚR¢r¢∞¢6ˆÁ7BGí“6B””“uBrÚR¢Ç¢6B””“t"rÚ÷R¢Ç¢∞¢2Á6fRÇì∞¢2Á6WEG&Á6f˜&“É¬¬¬¬¬ì∞¢2ÊG&tñ÷vRáG&Á56Ê¬GÇ¬Gíì∞¢ÚÚFÜR6V”¢FÜñ‚6ÜF˜rˆ‚FÜR∆VFñÊrVFvRˆbFÜR&ˆˆ“6ÜRó0¢ÚÚVÁFW&ñÊr¬6ÚFÜR¶ˆñ‚ó2Fˆ˜'víˆb∆ñváB&FÜW"FÜ‚Ü&B7W@¢6ˆÁ7B7r“#c∞¢ñbÜGÇ«¬Gíí∞¢6ˆÁ7BwÉ“GÇÚá6B””“u"rÚGÇ≤r¢GÇ“7rí¢∞¢6ˆÁ7Bwì“GíÚá6B””“uBrÚGí≤Ç¢Gí“7rí¢∞¢6ˆÁ7BsB“GÇÚ2Ê7&VFT∆ñÊV$w&FñVÁBÜwÉ¬¬wÉ≤á6B””“u"rÚ7r¢◊7rí¬ê¢¢2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬wì¬¬wì≤á6B””“uBrÚ7r¢◊7ríì∞¢sBÊFD6ˆ∆˜%7F˜É¬w&v&É2√R√í√„SRírì∞¢sBÊFD6ˆ∆˜%7F˜É¬w&v&É2√R√í√írì∞¢2Êfñ∆≈7Gñ∆R“sC∞¢ñbÜGÇí2Êfñ∆≈&V7BÑ÷FÇÊ÷ñ‚ÜwÉ¬wÉ≤á6B””“u"rÚ7r¢◊7ríí¬¬7r¬Çì∞¢V«6R2Êfñ∆≈&V7BÉ¬÷FÇÊ÷ñ‚Üwì¬wì≤á6B””“uBrÚ7r¢◊7ríí¬r¬7rì∞¢–¢2Á&W7F˜&RÇì∞¢–¢“V«6RñbáG&Á56Êí≤G&Á56Ê“ÁV∆√≤–¢ñbá7B””“tDTBrí∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉÇ√B√Ç¬r≤6∆◊ÇÉ„Ç“rÊFVEBí¢„"¬¬„ÉRí≤rís∞¢2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢gGáBáBÇvFVFÇrí¬CÉ¬#S¬Cb¬r6fcVcfBr¬v6VÁFW"r¬r6fcVcfBrì∞¢ñbÑrÊFVFÑ∆ñÊRí∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ«Ü“6∆◊ÇÉ„"“rÊFVEBí¢„b¬¬ì∞¢gGáBÑrÊFVFÑ∆ñÊR¬CÉ¬3¬r¬r63ñbr¬v6VÁFW"rì∞¢2Á&W7F˜&RÇì∞¢–¢“V«6Rñbá7B””“uU4Rrí∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉB√r√"√„sRís≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢gGáBáBÇwW6VBrí¬CÉ¬Ç¬3B¬r6VVc6fr¬v6VÁFW"r¬r33vffCrì∞¢ÚÚDÑR%$îB¬4Ñıt‚áVÊFW&Fˆr÷&2ì¢FÜRv˜&∆Bw26ˆFR¬vÜñ6ÇvíóB∆VÁ2¿¢ÚÚÊBFÜR∆rFÜBó2FÜó2'V‚w2∆ˆÊR(	Bˆ‚FÜR67&VV‚6ÜR˜VÁ2÷˜7B¿¢ÚÚÊ˜BˆÊ«í&VÜñÊBóG2˜v‚'WGFˆ‡¢gGáBáW6Uv˜&∆D∆ñÊRÇí¬CÉ¬S¬2¬r3vCì6Çr¬v6VÁFW"rì∞¢ÚÚDÑRƒï5Bï2‘T5U$TB¬‰ıB4ıTÂDTBıUBî‚dı%DîU2‚BfóÜVBCÇ7FW ¢ÚÚg&ˆ“ì”ìFÜR∆7B&˜r∆ÊFVBBSˆ‚FW6∑F˜ÊBBSS(	BˆfbFÜP¢ÚÚ&˜GFˆ“ˆbSCÇ67&VV‚(	B26ˆˆ‚2FÜRF˜V6Ç&˜rV&VB‚FÜRvê¢ÚÚıUBˆbFÜRv÷Rv2FÜR&˜rFÜBfV∆¬ˆfb¬vÜñ6Çó2FÜRv˜'7BˆÊRF¢ÚÚ∆˜6R¬ÊBóBó2WÜ7F«ívÜBv2&W˜'FVC¢'FÜRWÜóB'WGFˆ‚ó2VÊFW"FÜP¢ÚÚ67&VV‚"‚FÜR7FWÊ˜r6ˆ÷W2g&ˆ“Ü˜r÷Áí&˜w2FÜW&R&R‡¢6ˆÁ7B¬“W6T∆ñ˜WBÇí¬““¬ÊóFV◊2¬7FW“¬Á7FW¬ì“¬Áì∞¢6ˆÁ7Bg2“÷FÇÊ÷ñ‚É#¬7FW¢„Sbì∞¢“Êf˜$V6ÇÇÜóB¬íí”‚∞¢6ˆÁ7B6V¬“í””“rÁW6TñGÇ¬í“ì≤í¢7FW∞¢ÚÚFÜRGvÚó'&WfW'6ñ&∆R&˜w2&RFñÁFVB6ÚFÜWí6‚ÊWfW"&RÜóB'ífVV¿¢ñbÜóBÁv&‚í∞¢2Êfñ∆≈7Gñ∆R“óBÊ˜WBÚw&v&É#SR√#√√„ír¢w&v&É#SR√ì√√„íís∞¢'"Ü2¬3¬í“7FW¢„R¬3c¬7FW¢„Éb¬Çì≤2Êfñ∆¬Çì∞¢–¢gGáBÇá6V¬Ú~)kÇr¢rrí≤ÜóBÊñ6ˆ‚ÚóBÊñ6ˆ‚≤rr¢rrí≤óBÊ∆&V¬¬CÉ¬í¬g2¿¢6V¬Úr6VVc6fr¢ÜóBÊ˜WBÚr6SÉÜ#Ébr¢óBÁv&‚Úr6SÜ&#Ébr¢r3vCì6Çríì∞¢ÚÚFÜR7V"÷∆ñÊRvˆW2$ıdRFÜR&˜rÊV"FÜRfˆ˜BˆbFÜR∆ó7B¬vÜW&R&V∆˜p¢ÚÚó2FÜRÊWáB&˜rw2∆FR&FÜW"FÜ‚V◊Gí76P¢6ˆÁ7B7í“í≤7FW¢Üí„““Ê∆VÊwFÇ“"Ú”„R¢„S"ì∞¢ÚÚFÜR6ˆÊfó&“&W∆6W2FÜRÜñÁB¬&V6W6RóBó2FÜR÷˜&RW&vVÁB6VÁFVÊ6P¢ñbá6V¬bbrÁW6T6ˆÊfó&“””“óBÊñBígGáBáBÇw’ˆ6ˆÊfó&“rí¬CÉ¬7í¬"¬r6ffCsfrì∞¢V«6Rñbá6V¬bbóBÊÜñÁBígGáBÜóBÊÜñÁB¬CÉ¬7í¬"¬r3vCì6Çrì∞¢“ì∞¢G&tfˆ˜FW"ÉS#"¬G'VRì∞¢“V«6Rñbá7B””“uD4drrí∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉB√r√"√„É"ís≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢gGáBáBÇwF≈˜FóF∆Rrí¬CÉ¬S¬3"¬r6VVc6fr¬v6VÁFW"r¬r33vffCrì∞¢gGáBáBÇwF≈ˆÜñÁCrí¬CÉ¬#3¬Ç¬r3ñf#Ü62rì∞¢gGáBáBÇwF≈ˆÜñÁC"rí¬CÉ¬#c"¬Ç¬r3ñf#Ü62rì∞¢gGáBáBÇwF≈ˆÜñÁC2rí¬CÉ¬#ìB¬Ç¬r3ñf#Ü62rì∞¢“V«6Rñbá7B””“t5E$¬rí∞¢G&t7G&¬Çì∞¢“V«6Rñbá7B””“tDîƒÙrrbbrÊFñ∆ˆrí∞¢6ˆÁ7BB“rÊFñ∆ˆs∞¢ÚÚDÑR$ıÇï24ï§TBe$Ù“tÑBtÙU2î‚ïB‚BfóÜVBÇóÜV«2¢ÚÚFá&VR÷∆ñÊRÁ7vW"¬˜"FW&÷ñÊ¬∆ñÊRFÜB«6Ú6'&ñW2&˜rˆb∆ñV‡¢ÚÚv«óá2¬&‚7G&ñváBFá&˜VvÇFÜR&˜GFˆ“VFvRÊBFá&˜VvÇFÜR)k¬&ˆ◊B‡¢ÚÚ÷V7W&Rfó'7B¬FÜV‚G&rFÜRg&÷R&˜VÊBóB‡¢ÚÚDÑRı%E$ïBÑ24Ù≈T‘„≤DÑRtı$E2tUBDÑR$U5B‡¢Ú¢ÚÚFÜR&ˆGív26VÁG&VBˆ‚FÜRvÜˆ∆RÊV¬ÊBw&VBFÚc#Ç¬vÜñ6ÇW@¢ÚÚóG2∆VgBVFvRBÉ”s(	Bˆ‚F˜ˆb˜'G&óBFÜB7F'G2BS"‚FÜP¢ÚÚf6R7FñÊrFÜR∆ñÊRv2VÊFW&ÊVFÇFÜR∆ñÊR¬ñ‚WfW'í6ˆÁfW'6Fñˆ‚ñ‡¢ÚÚFÜRv÷R‚FÜR'W7Bó2váíFÜRÊV¬WÜó7G3≤óBFˆW2Ê˜BvWBw&óGFV‚ˆ‚‡¢6ˆÁ7B'F¬“ƒ‰r””“v"s∞¢6ˆÁ7BÇ“'F¬ÚsCB¢S#≤ÚÚFÜRcB◊vñFR'W7@¢6ˆÁ7BGr“SCÇ¬GÉ“'F¬Úsb¢#3c≤ÚÚÊBFÜR6ˆ«V÷‚&W6ñFRó@¢6ˆÁ7B&ˆGí“w&FWáBÜBÊ∆ñÊW5∂BÊï“¬Gr¬BÁ'2ÚR¢bì∞¢6ˆÁ7B∆Ç“BÁ'2Ú#¢##∞¢6ˆÁ7BvÇ“BÁ'2Ú#b¢≤ÚÚFÜRv«óÇ&˜rw2˜v‚&Ê@¢6ˆÁ7B&Ç“÷FÇÊ÷ÇÉÇ¬c"≤vÇ≤&ˆGíÊ∆VÊwFÇ¢∆Ç≤#bì∞¢6ˆÁ7B'í“SB“&É≤ÚÚw&˜w2Wv&B¬fˆ˜B7Fó2W@¢Fñ’ÊV¬ÉC¬'í¬cÉ¬&Çì∞¢ÚÚcL9scB˜'G&óB'W7B(	Bf6R7FñÊrFÜR7&óFRó2FˆÚ6÷∆¬FÚ6''ê¢∞¢∆WBWá"“vÊWWG&¬s∞¢ñbá∆ñW"bb∆ñW"Ê6˜&W2√“"íWá"“váW'Bs∞¢V«6RñbÑrÊ&˜72bbrÊ&˜72ÊFVBíWá"“vFWFW&÷ñÊVBs∞¢V«6RñbÜBÁ'2«¬BÊÊ÷R””“~(
bríWá"“v7W&ñ˜W2s∞¢ÚÚtÑı4Rd4Rï2ïCÚFÜR'W7BW6VBFÚ&RÑU%2ñ‚WfW'í6ˆÁfW'6Fñˆ‚¿¢ÚÚñÊ6«VFñÊrFÜRˆÊW2vÜW&R&F6ÜWB˜"FÜR˜&6∆Rv2FˆñÊrFÜRF∆∂ñÊp¢ÚÚÜ˜vÊW"¬##b”Ç”c¢'FÜRÂ2f6R6Ü˜V∆BV"vÜV‚óBw2F∆∂ñÊr"í‡¢ÚÚrÊFñ∆ˆrÊÁ26'&ñW2FÜR7V∂W"¬ÊBFˆˆ«2ˆÁ6'W7G2Ê6ß27WB'W7@¢ÚÚW"Â2˜WBˆbFÜRGW&Ê&˜VÊB6ÜVWB¬6ÚFÜRf6R&˜fRFÜRv˜&G26‡¢ÚÚ&RFÜR6Ü&7FW"FÜR∆ñW"ó27FÊFñÊrñ‚g&ˆÁBˆb‚ÜW"˜'G&óBó0¢ÚÚ7Fñ∆¬FÜRf∆∆&6≥¢‚VÊÊ÷VB7V∂W"¬˜"'W7BFÜBÜ2Ê˜@¢ÚÚ∆ˆFVB¬G&w2FÜR6÷Rf6RóB«vó2FñB‡¢∆WB'W7DG&v‚“f«6S∞¢ÚÚ‚‚‰‰BtÑT‚DÑR4$Bï2Ñ‰DıdU"¬DÑRî5EU$Rï2DÑRDÑî‰r‚$tı@¢ÚÚïB"6&BÜ2ÊÚ7V∂W"(	BÜW"˜v‚f6R˜fW"%Fá'W7B&ˆ˜G2(	B7&˜72v ¢ÚÚñ‚7G&ñváB∆ñÊR"FV∆«2FÜR∆ñW"Ê˜FÜñÊrFÜWíFñBÊ˜B«&VGí∂Ê˜r‡¢ÚÚFÜRˆ&¶V7BvˆW2ñ‚FÜR˜'G&óBw26ˆ«V÷‚ñÁ7FVB¬G&v‚∆&vW"FÜ‚¢ÚÚ'W7B&V6W6RóBó2FÜR7V&¶V7B&FÜW"FÜ‚∆ó7FVÊW"¬ˆ‚6ˆgBv&–¢ÚÚFó626ÚF&≤÷6ÜñÊVBÜ˜W6ñÊr7Fñ∆¬&VG2vñÁ7BFÜRFñ“ÊV¬‡¢ÚÚ‚‚‰‰BtÑT‚ïBï2ıtU"¬DÑRî5EU$R‘ıdU2‚¶WG6≤G&v‚2¢ÚÚ7Fñ∆¬ˆ&¶V7B6ó2vÜB6ÜRv2vófV„≤FÜR6÷RvñÊF˜rFÜR6∂ñ∆¬G&VP¢ÚÚW6W26ó2vÜBóBDÙU2¬vÜñ6Çó2FÜR˜vÊW"w26≤ñ‚ˆÊR'&VFÇvóFÄ¢ÚÚFÜRG&VS¢'FÜR6÷RvˆW2vóFÇFÜRWw&FW2ív˜V∆BvWBvÜV‚&VFñÊp¢ÚÚFÜR&˜76W2(	BFÜR¶WB¬FÜR6∆6Ç¬vWGFñÊrFÜRÊWr7v˜&B"‚6÷P¢ÚÚ6ˆ◊ˆÊVÁB¬6÷R67&óG2Üß2˜&ñFF∆W2Êß2í¬6Ú˜vW"&VG2FÜR6÷Rvê¢ÚÚvÜW&WfW"FÜRv÷RˆffW'2óB‡¢ñbÜBÊFV÷ÚbbGóVˆbG&u6∂ñ∆ƒFV÷Ú””“vgVÊ7Fñˆ‚rbbGóVˆbFV÷ı67&óB””“vgVÊ7Fñˆ‚p¢bbFV÷ı67&óBÜBÊFV÷Úíí∞¢G&u6∂ñ∆ƒFV÷ÚÜ2¬Ç“B¬'í≤Ç¬3"¬¬BÊFV÷Ú¬W&f˜&÷Ê6RÊÊ˜rÇíÚì∞¢'W7DG&v‚“G'VS∞¢“V«6RñbÜBÊ'Bí∞¢6ˆÁ7Bí“GóVˆb‘TDîÙî‘r”“wVÊFVfñÊVBrbb‘TDîÙî‘u∂BÊ'E”∞¢ñbÜíbbíÊÊGW&≈vñGFÇí∞¢6ˆÁ7B2“ÉB¬7ÉB“Ç≤3"¬7ìB“'í≤B≤3#∞¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7Br“2Ê7&VFU&Fñƒw&FñVÁBÜ7ÉB¬7ìB¬B¬7ÉB¬7ìB¬2¢„c"ì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√#B√3√„#írì∞¢rÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√ì√√írì∞¢2Êfñ∆≈7Gñ∆R“s∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ü7ÉB¬7ìB¬2¢„c"¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢ÚÚ6ˆÁFñÊVB¬ÊWfW"7G&WF6ÜVC¢FÜRGvÚ∆FW2ÜfRFñffW&VÁB7V7G0¢6ˆÁ7B63B“÷FÇÊ÷ñ‚Ö2ÚíÊÊGW&≈vñGFÇ¬2ÚíÊÊGW&ƒÜVñváBì∞¢6ˆÁ7Br“íÊÊGW&≈vñGFÇ¢63B¬Ç“íÊÊGW&ƒÜVñváB¢63C∞¢2ÊG&tñ÷vRÜí¬7ÉB“rÚ"¬7ìB“ÇÚ"¬r¬Çì∞¢'W7DG&v‚“G'VS∞¢–¢–¢ñbÜBÊÁ2bb'W7DG&v‚í∞¢6ˆÁ7B&≤“v'W7Br≤BÊÁ2Ê6Ü$BÉíÁFıWW$66RÇí≤BÊÁ2Á6∆ñ6RÉì∞¢ñbáGóVˆb÷VFñfWF6Ç””“vgVÊ7Fñˆ‚rí÷VFñfWF6ÇÜ&≤ì∞¢6ˆÁ7B&í“GóVˆb‘TDîÙî‘r”“wVÊFVfñÊVBrbb‘TDîÙî‘u∂&µ”∞¢ñbÜ&íbb&íÊÊGW&≈vñGFÇí∞¢6ˆÁ7B2“cC∞¢2Á6fRÇì∞¢2Ê&VvñÂFÇÇì≤2Ê&2áÇ≤2Ú"¬'í≤B≤2Ú"¬2Ú"¬¬rì≤2Ê6∆óÇì∞¢2ÊG&tñ÷vRÜ&í¬Ç¬'í≤B¬2¬2ì∞¢2Á&W7F˜&RÇì∞¢'W7DG&v‚“G'VS∞¢–¢–¢ñbÇ'W7DG&v‚íG&u˜'G&óBÜ2¬Ç¬'í≤B¬Wá"ì∞¢ÚÚ‚‚‰‰BÑU"$ÙEítT%2DÑR4‘Rd4R‚FÜR'W7BÊBFÜR7&óFR&RFÜP¢ÚÚ6÷R6Ü&7FW"ÊBW6VBFÚFó6w&VS¢FÜR˜'G&óB6˜V∆B&R∆ó7FVÊñÊp¢ÚÚ7W&ñ˜W6«ívÜñ∆RFÜR6Bˆ‚FÜRf∆ˆ˜"&VÜñÊBóB7F&VB&∆Ê∂«íÜVB‡¢ÚÚvÊWWG&¬r÷2FÚÜW"&W7FñÊr7WFRf6R&FÜW"FÜ‚FÚÊ˜FÜñÊr¬6Ú¢ÚÚ∆ñ‚6ˆÁfW'6Fñˆ‚7Fñ∆¬∆VfW2ÜW"∆ˆˆ∂ñÊr∆ñ∂RÜW'6V∆b‡¢ñbá∆ñW"bb∆ñW"Ê÷ˆˆE6WBê¢∆ñW"Ê÷ˆˆE6WBÜWá"””“vÊWWG&¬rÚv6∆“r¢Wá"¬„Bì∞¢–¢gGáBÜBÊÊ÷R«¬rr¬'F¬ÚGÉ≤Gr¢GÉ¬'í≤#B¬b¬r33vffCr¬'F¬Úw&ñváBr¢v∆VgBrì∞¢∆WBGí“'í≤Cc∞¢ñbÜBÁ'2í≤G&tv«óÖFWáBÜ2¬BÁ'2¬GÉ≤GrÚ"¬Gí¬¬w&v&É#√##√#SR√„cRír¬w&v&É#√##√#SR√„Bírì≤Gí≥“vÉ≤–¢&ˆGíÊf˜$V6ÇÇÜ∆‚¬íí”‚gGáBÜ∆‚¬'F¬ÚGÉ≤Gr¢GÉ¬Gí≤"≤í¢∆Ç¿¢BÁ'2ÚR¢b¬r6SfVVcbr¬'F¬Úw&ñváBr¢v∆VgBr¬ÁV∆¬¬scríì∞¢gGáBÇ~)k¬r¬CÉ¬CìB¬2¬r3vCì6Çrì∞¢“V«6Rñbá7B””“tÙddU"rí∞¢G&tˆffW"Çì∞¢“V«6Rñbá7B””“t%$îBrí∞¢G&t'&ñEfñWrÇì∞¢“V«6Rñbá7B””“t‘rí∞¢G&t÷Çì∞¢“V«6Rñbá7B””“t$rrí∞¢G&t&rÇì∞¢“V«6Rñbá7B””“t5$U5Brí∞¢G&t7&W7BÇì∞¢“V«6Rñbá7B””“tdîƒ’2rí∞¢G&tfñ∆◊2Çì∞¢“V«6Rñbá7B””“u4Ñırí∞¢G&u6Ü˜Çì∞¢“V«6Rñbá7B””“u4¥îƒ≈2rí∞¢G&u6∂ñ∆«2Çì∞¢“V«6Rñbá7B””“u$Tƒî52rí∞¢G&u&V∆ñ72Çì∞¢“V«6Rñbá7B””“uE$î¬rí∞¢G&uG&ñ¬Çì∞¢–¢ÚÚƒ5B¬ıdU"UdU%ïDÑî‰r¬‰BÙ‰≈ítÑT‚DÑRU$¬4¥TBdı"ïB‚6VRß2ˆFñrÊß3†¢ÚÚFÜRÊV¬WÜó7G2&V6W6RFá&VRfV«G2ñ‚&˜rvW&R&W˜'FVBˆfbÜˆÊP¢ÚÚÊB6˜V∆BÊ˜B&R&W&ˆGV6VBÜW&R¬ÊBwVW72&˜WB6ˆ÷V&ˆGíV«6Rw2FWfñ6P¢ÚÚ6˜7B‚WfVÊñÊrÊB6ÜóVB&Vw&W76ñˆ‚‡¢ñbáGóVˆbG&tFñr””“vgVÊ7Fñˆ‚ríG&tFñrÇì∞ß–¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¢ÚÚDÑR%$ÙD45Bdƒ≈2(	BFÜR˜VÊñÊr¬6Ü˜B2fñ∆“‚VñváB6Ü˜G2¬V6Ç6''ññÊp¢ÚÚˆÊR∆ñÊRˆbFÜR&ˆ∆ˆwVS¢&VÊWfˆ∆VÁB'&ˆF67B&VñÊr˜fW'w&óGFV‚ñÁFÚ¢ÚÚ6ˆ÷÷ÊB¬fófRwV&FñÁ2vˆñÊrFÚFÜVó"∂ÊVW2¬ÊBˆÊRg&÷RFÜBv2ÊWfW ¢ÚÚvó&VBFÚFÜR6ˆÊrv∂ñÊrW∆ˆÊR‡¢Ú¢ÚÚFÜó2ó2FÜRÙ‰≈í˜VÊñÊrFÜRv÷RÜ2‚FÜW&Rv26V6ˆÊBˆÊR(	BÜÊB÷G&v‡¢ÚÚ6ˆ÷ñ2ˆbFÜR6÷R7F˜'í(	BÊBóBó2FV∆WFVB&FÜW"FÜ‚∂WB27&R¿¢ÚÚ&V6W6R7&RFÜB6‚vñ‚ó2Ê˜B7&R‚vÜV‚FÜRfñ∆“6ÊÊ˜BFV6ˆFR¿¢ÚÚFÜRf∆∆&6≤ó2Ê˜rFÜó26÷Rfñ∆“ÜV∆Bˆ‚óG2˜v‚g&÷W2á6VRG&t6ñÊRí¿¢ÚÚÊWfW"FñffW&VÁBFV∆∆ñÊr‡¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¶6ˆÁ7BîÂE$ıÙdîƒ““∞¢≤vñÁG&Ûr¬v6ñÊUˆ3u“¬ÚÚFÜR∂W&ÊV¬FWFá2¬v˜&∂ñÊr2ˆÊP¢≤vñÁG&Û"r¬v6ñÊUˆ32u“¬ÚÚ‘ıDÑU"’b¬FÜR'&ˆF67BÜV'@¢≤vñÁG&Û2r¬v6ñÊUˆ3Bu“¬ÚÚ6ˆ÷WFÜñÊr˜WG6ñFRÁ7vW'2ÜW"6ˆÊp¢≤vñÁG&ÛBr¬v6ñÊUˆ3Ru“¬ÚÚg&WVVÊ7í'íg&WVVÊ7í¬FÜR6ñvÊ¬GW&Á0¢≤vñÁG&ÛRr¬v6ñÊUˆ3bu“¬ÚÚˆÊRv˜&∂W"w2WñRvˆW2g&ˆ“7ñ‚FÚ&VC¢Ù$Uê¢≤vñÁG&Ûbr¬v6ñÊUˆ3ru“¬ÚÚFÜRw&VBwV&FñÁ2∂ÊVV¬fó'7@¢≤vñÁG&Ûrr¬v6ñÊUˆ3Çu“¬ÚÚˆÊRg&÷Rv2ÊWfW"vó&VBFÚFÜR6ˆÊp¢≤vñÁG&ÛÇr¬v6ñÊUˆ3u“¬ÚÚ6ÜRv∂W2FÚ6ñ∆VÁB6óGí¬ÊBvˆW0•”∞¶gVÊ7Fñˆ‚ñÁG&Ùfñ∆’&VV¬Çí∞¢6ˆÁ7BÜfR“áGóVˆbvñÊF˜r”“wVÊFVfñÊVBrbbvñÊF˜rÂdîEÙdîƒU2í«¬∑”∞¢&WGW&‚îÂE$ıÙdîƒ“Êfñ«FW"á2”‚ÜfU∑5≥’“ì∞ß–¶gVÊ7Fñˆ‚7F'DñÁG&Ùfñ∆“Çí∞¢6ˆÁ7B&VV¬“ñÁG&Ùfñ∆’&VV¬Çì∞¢vÜñ∆Rá&VV¬Ê∆VÊwFÇí∞¢6ˆÁ7B∂≤¬6““&VV¬Á6ÜñgBÇì∞¢W&ñgï&V∆ˆBÜ≤ì∞¢ñbá7F'EW&ñgî7WBÜ≤íí∞¢rÊ7WBÊ6“6≤rÊ7WBÁFñVÁB“G'VS∞¢rÁ&VV¬“&VV¬Ê÷á2”‚5≥“ì∞¢rÁ&VVƒ6“&VV¬Ê÷á2”‚5≥“ì∞¢rÁ&VVƒVÊB“t4î‰Rs∞¢fñ∆‘ÜVBÑrÁ&VV¬ì∞¢&WGW&‚G'VS∞¢–¢–¢rÁ&VV¬“ÁV∆√≤rÁ&VVƒ6“ÁV∆√≤rÁ&VVƒVÊB“ÁV∆√∞¢&WGW&‚f«6S∞ß–¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚDÑRıT‰î‰rtïE2dı"D¬ÊBFÜBó2Ê˜Bˆ∆óFVÊW72(	BóBó2FÜRˆÊ«ívê¢ÚÚFÜRfñ∆“6‚∆íB∆¬‚'&˜w6W'2&VgW6RFÚ7F'BfñFVÚFÜBÊÚáV÷‚6∂V@¢ÚÚf˜"¬ÊBFÜó2ˆÊRv27F'FñÊróG6V∆bFÜRñÁ7FÁBFÜRvR∆ˆFVB¬&Vf˜&RFÜP¢ÚÚ∆ñW"ÜBF˜V6ÜVBÁóFÜñÊr‚6Ú∆íÇív2&V¶V7FVB¬FÜR&VV¬÷&∂VBóG6V∆`¢ÚÚVÁ∆ñ&∆R¬ÊBFÜR6ˆ÷ñ2f∆∆&6≤6÷RWñÁ7FVC¢FÜRÊWr˜VÊñÊrv0¢ÚÚ'VÊÊñÊr6˜'&V7F«íÊB∆˜6ñÊrFÚóG2˜v‚6fWGíÊWB¬WfW'íFñ÷R¬ˆ‚WÜ7F«ê¢ÚÚFÜRFWfñ6W2÷˜7BV˜∆RW6R‡¢Ú¢ÚÚ&VÜñÊBF¬FÜRfñFVÚó2VÊ∆ˆ6∂VBÊB&ñ÷VB¬FÜRfñ∆RÜ2ÜB÷ˆ÷VÁBF¢ÚÚ'&ófR¬ÊBVFñÚó2∆∆˜vVBFÚ7F'BvóFÇóB‡¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¶gVÊ7Fñˆ‚7F'D6ñÊRÇí∞¢÷VFñfWF6ÇÇvñÁG&ı3r¬G'VRì∞¢ÚÚFÜRfó'7BGvÚ6Ü˜G2¬Ê˜B∆¬VñváB(	B7F'DñÁG&Ùfñ∆“∂VW2FÜRvñÊF˜p¢ÚÚF˜VBWg&ˆ“FÜW&R‚6VRfñ∆‘ÜVBÇí‡¢G'í≤fñ∆‘ÜVBÑîÂE$ıÙdîƒ“Ê÷á2”‚5≥“íì≤“6F6ÇÜRí∑–¢7F'D6ñÊTÊ˜rÇì∞ß–¶gVÊ7Fñˆ‚7F'D6ñÊTÊ˜rÇí∞¢G'í≤W&ñgîvW7GW&RÇì≤“6F6ÇÜRí∑–¢rÊ6ñÊR“≤ì¢¬C¢”∞¢ÚÚDÑRıT‰î‰rÑ2ïE2ıt‚44ı$R¬ÊBVÁFñ¬Ê˜rÊ˜FÜñÊrWfW"6∂VBf˜"óC†¢ÚÚFÜR6∆˜BWÜó7FVB¬FÜRG&6≤6Bñ‚76WG2ˆ◊W6ñ2¬ÊB6WD◊W6ñ2ÇvñÁG&Úrív0¢ÚÚÊ˜B6∆∆VBg&ˆ“ÁóvÜW&Rñ‚FÜRv÷R‚6ÚFÜR&ˆ∆ˆwVR(	B&VÊWfˆ∆VÁ@¢ÚÚ'&ˆF67B&VñÊr˜fW'w&óGFV‚ñÁFÚ6ˆ÷÷ÊB¬ÊBfófRwV&FñÁ2vˆñÊrF¢ÚÚFÜVó"∂ÊVW2(	B∆ñVB˜WBVÊFW"FÜRg&ñVÊF«íFóF∆RFÜV÷R‡¢6WD◊W6ñ2ÇvñÁG&Úrì∞¢ñbá7F'DñÁG&Ùfñ∆“Çíí&WGW&„∞¢rÁ7FFR“t4î‰Rs∞ß–¢ÚÚvR7F'BFñ÷W2ñ‚FÜR˜&ñvñÊ¬66˜&R¬ÊBÜ˜r∆ˆÊrV6ÇvRF∂W2F¢ÚÚfñÊó6ÇV&ñÊráÊV«2˜VB¬6FñˆÁ2GóVBí(	B&W76ñÊrÊWáB&Vf˜&P¢ÚÚFÜB&WfV«2FÜRvÜˆ∆RvRñÁ7FÁF«ì≤&W76ñÊrvñ‚GW&Á2ó@¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¢ÚÚDÑRıT‰î‰r¬ÑTƒB‚vÜV‚'&˜w6W"vñ∆¬Ê˜BFV6ˆFRFÜRfñ∆“(	B‚ˆ∆BÜˆÊR¬¢ÚÚ∆ˆ6∂VB÷F˜v‚vV'fñWr¬ÜVF∆W72FW7B(	BFÜR7F˜'íó27Fñ∆¬Fˆ∆BvóFÇFÜP¢ÚÚfñ∆“w2ıt‚g&÷W3¢ˆÊR7Fñ∆¬∆ñgFVBg&ˆ“V6ÇˆbFÜRVñváB6Ü˜G2¬ñ‚FÜP¢ÚÚ6÷R˜&FW"¬VÊFW"FÜR6÷R66˜&R¬6''ññÊrFÜR6÷R∆ñÊW2‚6÷R˜VÊñÊrB¢ÚÚFñffW&VÁBg&÷R&FR¬Ê˜BFñffW&VÁB˜VÊñÊr‡¢Ú¢ÚÚvÜBW6VBFÚ∆ófRÜW&Rv2ÜÊB÷G&v‚6ˆ÷ñ2FV∆∆ñÊrFÜó27F˜'í6V6ˆÊ@¢ÚÚví¬ñ‚óG2˜v‚'B¬ˆ‚óG2˜v‚Fñ÷ñÊr‚óBó2vˆÊR‚GvÚ˜VÊñÊw2÷VÁBFÜP¢ÚÚv÷R6˜V∆B6Ü˜rFÜRw&ˆÊrˆÊR(	BÊBóBFñB¬WfW'íFñ÷RfñFVÚv2&∆ˆ6∂VB¿¢ÚÚvÜñ6Çˆ‚ÜˆÊRv2WfW'íFñ÷R‡¢ÚÚ””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””””–¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚDÑR4ıT‰Bï2‰ıB‘ï54î‰r¬ïBï2tïDî‰r‚ÊÚ'&˜w6W"vñ∆¬7F'BVFñÚFÜBÊ¢ÚÚáV÷‚6∂VBf˜"(	BFÜBó2'V∆RˆbFÜR∆Ff˜&“¬Ê˜B6WGFñÊrvR6‚GW&‡¢ÚÚˆfb‚6ÚFÜR˜VÊñÊr7F'G2ˆ‚óG2˜v‚vóFÇñ7GW&RÜ◊WFVBfñFVÚï2∆∆˜vVBF¢ÚÚWF˜∆ííÊBFÜR66˜&R¶ˆñÁ2FÜRñÁ7FÁBÁóFÜñÊró2F˜V6ÜVB‚VÁFñ¬FÜV‡¢ÚÚFÜó2&FvR6óG2ñ‚FÜR6˜&ÊW"6Ú6ñ∆VÊ6RÊWfW"&VG22'&ˆ∂V‚v÷S¢ó@¢ÚÚ6ó2vÜBó2÷ó76ñÊrÊBWÜ7F«íÜ˜rFÚvWBóB¬ÊBóBFó6V'2'íóG6V∆`¢ÚÚFÜR÷ˆ÷VÁBFÜR◊W6ñ2ó2'VÊÊñÊr‡¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¶gVÊ7Fñˆ‚G&u6˜VÊD6ÜóáG6V2í∞¢ñbáGóVˆb6˜VÊD∆ˆ6∂VB”“vgVÊ7Fñˆ‚r«¬6˜VÊD∆ˆ6∂VBÇíí&WGW&„∞¢6ˆÁ7BR“„R≤÷FÇÁ6ñ‚áG6V2¢"„bí¢„S∞¢ÚÚ6ˆÁG&ˆ∆∆W"6ÊÊ˜BVÊ∆ˆ6≤VFñÚ(	BB&W72ó2Ê˜BW6W"vW7GW&R2f ¢ÚÚ2FÜR'&˜w6W"ó26ˆÊ6W&ÊVB(	B6ÚB∆ñW"ÊVVG2FÚ&RFˆ∆BvÜBtîƒ¿¢ÚÚv˜&≤&FÜW"FÜ‚'Ff˜"6˜VÊB"˜fW"v÷RFÜWí&R∆ññÊrvóFÇ7Fñ6≤‡¢6ˆÁ7BˆÂB“GóVˆbB”“wVÊFVfñÊVBrbbBbbBÊˆ„∞¢6ˆÁ7BGáB“ˆÂBÚBÇvvFU˜6˜VÊE˜Brí¢BÇvvFU˜6˜VÊBrì∞¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ«Ü“„s"≤R¢„#É∞¢2ÊfˆÁB“scGÇ%6VvˆRTí"¬FÜˆ÷¬6Á2◊6W&ñbs∞¢6ˆÁ7BGr“2Ê÷V7W&UFWáBáGáBíÁvñGFÉ∞¢6ˆÁ7Br“Gr≤sÇ¬Ç“CÉ“rÚ"¬í“#Ç¬Ç“3C∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉB√√B√„sÇís≤'"Ü2¬Ç¬í¬r¬Ç¬ÇÚ"ì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉSR√#SR√#Ç¬r≤É„3R≤R¢„Bí≤rís≤2Ê∆ñÊUvñGFÇ“„S∞¢'"Ü2¬Ç¬í¬r¬Ç¬ÇÚ"ì≤2Á7G&ˆ∂RÇì∞¢ÚÚ∆óGF∆R7V∂W"vóFÇGvÚ&72¬G&v‚&FÜW"FÜ‚G'W7FñÊr‚V÷ˆ¶ífˆÁ@¢6ˆÁ7BóÇ“Ç≤#¬óí“í≤ÇÚ#∞¢2Êfñ∆≈7Gñ∆R“r33vffCs∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÜóÇ¬óí“Bì≤2Ê∆ñÊUFÚÜóÇ≤R¬óí“Bì≤2Ê∆ñÊUFÚÜóÇ≤¬óí“íì∞¢2Ê∆ñÊUFÚÜóÇ≤¬óí≤íì≤2Ê∆ñÊUFÚÜóÇ≤R¬óí≤Bì≤2Ê∆ñÊUFÚÜóÇ¬óí≤Bì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“r33vffCs≤2Ê∆ñÊUvñGFÇ“„c∞¢f˜"Ü∆WBí“≤í¬#≤í≤≤í∞¢2Ê&VvñÂFÇÇì≤2Ê&2ÜóÇ≤"¬óí¬R≤í¢B„R¬”„ÉR¬„ÉRì≤2Á7G&ˆ∂RÇì∞¢–¢gGáBáGáB¬Ç≤SB≤GrÚ"¬í≤ÇÚ"≤¬B¬r6Ffc6fbr¬v6VÁFW"r¬ÁV∆¬¬scrì∞¢2Á&W7F˜&RÇì∞¢2Êv∆ˆ&ƒ«Ü“∞ß–¶6ˆÁ7B4î‰UÙÑÙƒB“b„C≤ÚÚ6V6ˆÊG26Ü˜Bó2ÜV∆@¶6ˆÁ7B4î‰UÙDï52“„ì≤ÚÚÊBFÜRFó76ˆ«fRg&ˆ“FÜR6Ü˜B&Vf˜&Ró@¶gVÊ7Fñˆ‚6ñÊTVÊBÇí∞¢G'í≤∆ˆ6≈7F˜&vRÁ6WDóFV“Çv6%ˆñÁG&ı˜6VV‚r¬srì≤“6F6ÇÜRí∑–¢rÊ6ñÊR“ÁV∆√∞¢ÚÚDÑRıT‰î‰rDÙU2‰ıBÑ‰B$4≤DÚDÑR‘TÂRƒÙı‚÷V7W&VBÜFˆ72Ù5EÙÙ‰RÊ÷Bì†¢ÚÚf˜'Gí◊6óÇ6V6ˆÊG2ˆbFÜRñÁG&ˆ66˜&R¬ÊBFÜV‚FÜRFñffñ7V«Gíñ6∂W ¢ÚÚ6ÊVBFÜR&ˆˆ“&6≤FÚFóF∆V(	BFÜR∆7BFÜñÊr∆ñW"ÜV'2&Vf˜&P¢ÚÚv÷W∆ív2FÜRGVÊRg&ˆ“&Vf˜&RFÜRfñ∆“‚FÜR&VV¬w2˜v‚FÜV÷R6'&ñW0¢ÚÚFá&˜VvÇFÜRÙ‰R6Üˆñ6RFÜBfˆ∆∆˜w2óBÊBÜÊG2˜fW"FÚFÜR∂ñÊvFˆ“vÜV‡¢ÚÚFÜR'V‚7F'G2‚&6∂ñÊr˜WBFÚFÜR÷VÁR&˜W"7Fñ∆¬F∂W2FÜR÷VÁRw2GVÊR‡¢ñbÑrÁ7FFR”“uƒírbbrÊgFW$6ñÊR”“tDîdbrí6WD◊W6ñ2ÇwFóF∆Rrì∞¢ñbÑrÊgFW$6ñÊR””“tDîdbrí∞¢rÊgFW$6ñÊR“ÁV∆√≤rÊFñfdñGÇ“∞¢rÁVÊEFÜV÷R“rÁVÊEFÜV÷R«¬v÷T∆ˆ6≤Çí«¬w&ˆ&Ús∞¢rÁ7FFR“tDîdbs∞¢“V«6R≤rÁ7FFR“t‘TÂRs≤rÊ÷VÁTñGÇ“≤–ß–¶gVÊ7Fñˆ‚WFFT6ñÊRÜGBí∞¢6ˆÁ7B6í“rÊ6ñÊS∞¢ñbÇ6íí≤6ñÊTVÊBÇì≤&WGW&„≤–¢ñbÜ6íÊí”“ÁV∆¬í≤6íÊí“≤6íÁB“≤–¢6íÁB≥“GC∞¢ÚÚDÑR$TDU"u24ÙÂE$Ù≈3¢FÜR&VV¬ÊWfW"'VÁ2víˆ‚óG2˜v‚(	BÊWáB÷˜fW2¢ÚÚ6Ü˜Bˆ‚¬&6≤&R◊&VG2FÜRˆÊR&Vf˜&R¬6∂ó∆VfW0¢6ˆÁ7BÊWáB“ñÂÇtÙ≤rí«¬ñÂÇt•T’rí«¬ñÂÇtD≤rí«¬ñÂÇu$îtÖBrì∞¢6ˆÁ7B&Wb“ñÂÇtƒTeBrì∞¢ñbÇÜÊWáB«¬&WbíbbñÁG&ı6˜VÊEFÇíí&WGW&„∞¢ñbÜñÂÇuU4Rrí«¬ñÂÇt$4≤ríí≤6gÇÇwVírì≤6ñÊTVÊBÇì≤&WGW&„≤–¢ñbÜÊWáBí≤6gÇÇwVírì≤6íÊí≤≥≤6íÁB“≤–¢V«6Rñbá&Wbbb6íÊí‚í≤6gÇÇwVírì≤6íÊí“”≤6íÁB“≤–¢V«6RñbÜ6íÁB‚4î‰UÙÑÙƒBí≤6íÊí≤≥≤6íÁB“≤–¢ñbÜ6íÊí„“îÂE$ıÙdîƒ“Ê∆VÊwFÇí6ñÊTVÊBÇì∞ß–¶gVÊ7Fñˆ‚6ñÊU7Fñ∆¬Üíí∞¢ñbÜí¬«¬í„“îÂE$ıÙdîƒ“Ê∆VÊwFÇí&WGW&‚ÁV∆√∞¢6ˆÁ7Bñ““‘TDîÙî‘u≤vñÁG&ı2r≤Üí≤ï”∞¢&WGW&‚Üñ“bbñ“ÊÊGW&≈vñGFÇíÚñ“¢ÁV∆√∞ß–¢ÚÚ7Fñ∆¬ó2ÊWfW"6ñ◊«í7FVBˆ„¢óBG&ñgG2ÊB7vV∆«27&˜72óG2Üˆ∆B¬6¢ÚÚFÜR6Ü˜B'&VFÜW2FÜRvíFÜRfˆ˜FvRóB6÷Rg&ˆ“FˆW0¶gVÊ7Fñˆ‚6ñÊU6Ü˜BÜñ“¬≤¬Fó"í∞¢ñbÇñ“í&WGW&„∞¢6ˆÁ7B¢“„R≤„sR¢≥∞¢6ˆÁ7Br“ìc¢¢¬Ç“SC¢£∞¢6ˆÁ7BÇ“Éìc“ríÚ"≤Fó"¢ár“ìcí¢„R¢É„R“≤ì∞¢2ÊG&tñ÷vRÜñ“¬Ç¬ÉSC“ÇíÚ"“ÜÇ“SCí¢„"¬r¬Çì∞ß–¶gVÊ7Fñˆ‚G&t6ñÊRÇí∞¢6ˆÁ7B6í“rÊ6ñÊS≤ñbÇ6íí&WGW&„∞¢ñbÜ6íÊí”“ÁV∆¬í≤6íÊí“≤6íÁB“≤–¢2Êfñ∆≈7Gñ∆R“r3s≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢6ˆÁ7Bñ““6ñÊU7Fñ∆¬Ü6íÊíì∞¢6ˆÁ7BFó72“6∆◊Ü6íÁBÚ4î‰UÙDï52¬¬ì∞¢6ˆÁ7B≤“6∆◊Ü6íÁBÚ4î‰UÙÑÙƒB¬¬ì∞¢ñbÇñ“í∞¢ÚÚFÜR'BÜ2Ê˜B'&ófVBñWC¢ˆÊR6∆˜r'&VFÇˆbÜW"˜v‚∆ñváB¬FÜR6÷P¢ÚÚvóBFÜRfñ∆“6Ü˜w2vÜñ∆R6∆ó'VffW'0¢6ˆÁ7BR“„R≤÷FÇÁ6ñ‚Ü6íÁB¢"„Bí¢„S∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7Bs“2Ê7&VFU&Fñƒw&FñVÁBÉCÉ¬#s¬B¬CÉ¬#s¬#Cì∞¢sÊFD6ˆ∆˜%7F˜É¬w&v&ÉSR√#SR√#Ç¬r≤É„R≤R¢„Rí≤rírì∞¢sÊFD6ˆ∆˜%7F˜É¬w&v&ÉSR√#SR√#Ç√írì∞¢2Êfñ∆≈7Gñ∆R“s≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢2Á&W7F˜&RÇì∞¢“V«6R∞¢6ˆÁ7B&6≤“Fó72¬Ú6ñÊU7Fñ∆¬Ü6íÊí“í¢ÁV∆√∞¢ñbÜ&6≤í≤2Á6fRÇì≤2Êv∆ˆ&ƒ«Ü“≤6ñÊU6Ü˜BÜ&6≤¬¬Ü6íÊí“íR"Ú”¢ì≤2Á&W7F˜&RÇì≤–¢2Á6fRÇì≤2Êv∆ˆ&ƒ«Ü“&6≤ÚFó72¢6∆◊Ü6íÁBÚ„R¬¬ì∞¢6ñÊU6Ü˜BÜñ“¬≤¬6íÊíR"Ú”¢ì∞¢2Á&W7F˜&RÇì∞¢ÚÚFÜR6÷R7W&f6ñÊr&∆ˆˆ“ÊBfñvÊWGFRFÜRfñ∆“ó2&W6VÁFVBvóFÇ¬6ÚFÜP¢ÚÚÜV∆BfW'6ñˆ‚ÊBFÜR÷˜fñÊrˆÊR∆ˆˆ≤∆ñ∂RˆÊRñV6Rˆbv˜&∞¢ñbÜ6íÁB¬„Rí∞¢6ˆÁ7B"““6íÁBÚ„S∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s≤2Êv∆ˆ&ƒ«Ü“"¢„CS∞¢6ñÊU6Ü˜BÜñ“¬≤≤„b¢"¬6íÊíR"Ú”¢ì∞¢2Á&W7F˜&RÇì∞¢–¢2Á6fRÇì∞¢6ˆÁ7Bfr“2Ê7&VFU&Fñƒw&FñVÁBÉCÉ¬#s¬#¬CÉ¬#s¬Scì∞¢frÊFD6ˆ∆˜%7F˜É¬w&v&É√√√írì≤frÊFD6ˆ∆˜%7F˜É¬w&v&É√√√„SRírì∞¢2Êfñ∆≈7Gñ∆R“fs≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢2Á&W7F˜&RÇì∞¢–¢2Êv∆ˆ&ƒ«Ü“∞¢ÚÚDÑR4DîÙ‚¬6WBWÜ7F«í2FÜRfñ∆“6WG2ó@¢6ˆÁ7B6“îÂE$ıÙdîƒ’∂6íÊï“bbîÂE$ıÙdîƒ’∂6íÊï’≥”∞¢ñbÜ6í∞¢6ˆÁ7B“6∆◊Ü6íÁBÚ„r¬¬í¢6∆◊ÇÑ4î‰UÙÑÙƒB“6íÁBíÚ„R¬¬ì∞¢ñbÜ‚„í∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ«Ü“∞¢6ˆÁ7BGáB“BÜ6ì∞¢2ÊfˆÁB“scwÇ%6VvˆRTí"¬FÜˆ÷¬6Á2◊6W&ñbs∞¢6ˆÁ7Bs"“÷FÇÊ÷ñ‚ÉÉÉ¬2Ê÷V7W&UFWáBáGáBíÁvñGFÇ≤Cì∞¢6ˆÁ7Bs"“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬C3"¬¬Sì∞¢s"ÊFD6ˆ∆˜%7F˜É¬w&v&ÉB√Ç√"√írì≤s"ÊFD6ˆ∆˜%7F˜É„R¬w&v&ÉB√Ç√"√„s"írì∞¢s"ÊFD6ˆ∆˜%7F˜É¬w&v&ÉB√Ç√"√írì∞¢2Êfñ∆≈7Gñ∆R“s#≤2Êfñ∆≈&V7BÉCÉ“s"Ú"“3¬C3"¬s"≤c¬cÇì∞¢gGáBáGáB¬CÉ¬CcÇ¬r¬r6VcFfbr¬v6VÁFW"r¬w&v&É√√√„ÉRír¬scrì∞¢2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢–¢–¢ÚÚÜ˜r◊V6Ç7F˜'íó2∆VgB¬f˜"∆ñW"vÜÚ6ÊÊ˜B&VBFÜR6FñˆÁ2ñW@¢f˜"Ü∆WBí“≤í¬îÂE$ıÙdîƒ“Ê∆VÊwFÉ≤í≤≤í∞¢6ˆÁ7Bˆ‚“í””“6íÊì∞¢2Êfñ∆≈7Gñ∆R“ˆ‚Úr33vffCr¢w&v&ÉÉ√#R√##√„#Çís∞¢2Ê&VvñÂFÇÇì≤2Ê&2ÉCÉ≤Üí“ÑîÂE$ıÙdîƒ“Ê∆VÊwFÇ“íÚ"í¢b¬S¬ˆ‚Ú2„B¢"„"¬¬rì∞¢2Êfñ∆¬Çì∞¢–¢ñbÜ6íÁB‚„b«¬6íÊí‚í∞¢2Á6fRÇì∞¢2Êv∆ˆ&ƒ«Ü“„3R≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚC#í¢„#∞¢gGáBáBÇvvFUˆÊWáBrí¬CÉ¬S#B¬"¬r3ñf#Ü3Çr¬v6VÁFW"rì∞¢2Á&W7F˜&RÇì∞¢–¢G&u6˜VÊD6ÜóáW&f˜&÷Ê6RÊÊ˜rÇíÚì∞ß–¢ÚÚ““““FÜR÷6ÜñÊRv˜&∆Bw2V˜∆R“““““““““““““““““““““““““““““““““““““““““–¢ÚÚ&V'Vñ«B2dÙ≈T‘U2¬Ê˜B7Fñ6∂W'3¢WfW'íf˜&“ó2FÇ6∆óVBFÚ¢ÚÚFñvˆÊ¬∆ñváB&◊áWW"÷∆VgB∂Wí∆ñváB¬6ˆˆ¬6ÜF˜w2¬v&“∆ñváG2í¿¢ÚÚvóFÇ6Vv÷VÁFVB&ñ“¬7ñ÷÷WG&ñ2vV"¬ÊBWÜ7F«íˆÊRV÷ó76ófR66VÁB‡¢ÚÚ∆ˆ6¬76S¢˜&ñvñ‚BFÜRfVWB¬f6ñÊr∑É≤FÜR6∆∆W"f∆ó2ÊB&ˆ'2‡¶gVÊ7Fñˆ‚G&tÂ4&ˆGíÜ2¬ñB¬F‚¬F∆∂ñÊrí∞¢6ˆÁ7B∆ñ‚“áÉ¬ì¬É¬ì¬7Bí”‚∞¢6ˆÁ7Br“2Ê7&VFT∆ñÊV$w&FñVÁBáÉ¬ì¬É¬ìì∞¢f˜"Ü6ˆÁ7B3"ˆb7BírÊFD6ˆ∆˜%7F˜á3%≥“¬3%≥“ì∞¢&WGW&‚s∞¢”∞¢6ˆÁ7BÚ“áÇ¬"¬í”‚∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ«Ü“”“ÁV∆¬Ú„2¢≤2Êfñ∆≈7Gñ∆R“r3Cs"s∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RáÇ¬”¬"¬"¢„#"¬¬¬rì≤2Êfñ∆¬Çì≤2Á&W7F˜&RÇì∞¢”∞¢6ˆÁ7B&∆ñÊ≤“áF‚RB„2í¬„¬&∆ñÊ≥"“ÇáF‚≤„ríR2„rí¬„∞¢ñbáF∆∂ñÊrí2Á&˜FFRÇ”„2≤÷FÇÁ6ñ‚áF‚¢Çí¢„Rì∞¢7vóF6ÇÜñBí∞¢66Rw6W'fÚs¢≤ÚÚFÜRˆ∆BVÊóB(	Bv˜&‚7ÜW&Rˆ‚G&VG2¬7Fñ∆¬v&–¢6ˆÁ7B'"“÷FÇÁ6ñ‚áF‚¢„íí¢„É∞¢ÚÉ¬rì∞¢ÚÚG&VB&6S¢7V&R“7F&∆S≤óBFˆW6‚wBG&fV¬◊V6ÇÁñ÷˜&P¢2Êfñ∆≈7Gñ∆R“r3#c#Cbs≤'"Ü2¬”2¬”r¬#b¬r¬2ì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”2¬”Ç¬Ç¬¬µ≥¬r3V3SÉF2u“¬≥¬r33&C#ru’“ì∞¢'"Ü2¬”2¬”r¬#b¬2„B¬"ì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r3sc2s∞¢f˜"Ü∆WB≤“”≤≤√“≤≤≤≤í≤2Ê&VvñÂFÇÇì≤2Ê&2Ü≤¢Ç¬”2„B¬"„"¬¬rì≤2Êfñ∆¬Çì≤–¢ÚÚFÜR&ˆGì¢ˆÊRFˆ÷R¬DTÂDTBˆ‚FÜR&ñváB(	B6ˆÊ6fR&óFRñ‚FÜP¢ÚÚ6ñ∆Ü˜VWGFRFÜBFÜó'GíñV'2ˆb6W'fñ6RWBFÜW&P¢6ˆÁ7B&ˆGí“Çí”‚∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÇ”2¬”Çì∞¢2Ê&W¶ñW$7W'fUFÚÇ”b¬”#“'"¬”í¬”3„R“'"¬¬”3“'"ì∞¢2Ê&W¶ñW$7W'fUFÚÉr¬”3“'"¬"¬”#b“'"¬2¬”í“'"ì∞¢2ÁVG&Fñ47W'fUFÚÉ2„b¬”R¬„b¬”"„Bì∞¢2ÁVG&Fñ47W'fUFÚÉ„"¬”„B¬"„B¬”Ç„Bì∞¢2Ê6∆˜6UFÇÇì∞¢”∞¢2Á6fRÇì≤&ˆGíÇì≤2Ê6∆óÇì∞¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”B¬”3B¬"¬”b¬µ≥¬r6VfSfC"u“¬≥„3R¬r63ñ&F"u“¬≥„r¬r3ÜCÉ3su“¬≥¬r3ScS3Cíu’“ì∞¢2Êfñ∆≈&V7BÇ”Ç¬”3b¬3b¬3"ì∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉS√Éb√SÇ√„Rís≤ÚÚ'W7B&∆ˆˆ“¬ˆÊR6ñFRˆÊ«ê¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÉí¬”2“'"¬R¬r¬„R¬¬rì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“w&v&É#"√cb√CB√„CRís∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÉ¬”“'"¬2¬B¬„R¬¬rì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉC√3Ç√3B√„Rís≤2Ê∆ñÊUvñGFÇ“≤ÚÚÜF6Ç6V–¢2Ê&VvñÂFÇÇì≤2Ê&2É¬”B“'"¬Ç¬„B¬"„rì≤2Á7G&ˆ∂RÇì∞¢ÚÚ6Vv÷VÁFVB&ñ”¢'&ñváB˜fW"6Ü˜'B&2¬∆˜7BB&˜FÇVÊG0¢2Á7G&ˆ∂U7Gñ∆R“∆ñ‚Ç”2¬”3¬B¬”Ç¬µ≥¬w&v&É#SR√#S√#3R√íu“¬≥„CR¬w&v&É#SR√#S√#3R√„ííu“¬≥¬w&v&É#SR√#S√#3R√íu’“ì∞¢2Ê∆ñÊUvñGFÇ“"„#≤&ˆGíÇì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢ÚÚ'&˜r&ñFvRƒDRvóFÇ∆óBF˜VFvS≤FÜRWñW2&RÜ˜W6VBVÊFW"ó@¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”í¬”#Ç“'"¬Ç¬”#"“'"¬µ≥¬r6#fÉÜ2u“¬≥¬r3VcSÉFu’“ì∞¢'"Ü2¬”í¬”#b„R“'"¬r„R¬B¬"ì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#SR√#S√#3R√„SRís≤2Ê∆ñÊUvñGFÇ“∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”Ç¬”#b„b“'"ì≤2Ê∆ñÊUFÚÉb„R¬”#b„Ç“'"ì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r3sS"s≤'"Ü2¬”Ç¬”#2“'"¬R„R¬b„B¬2ì≤2Êfñ∆¬Çì∞¢6ˆÁ7BW“&∆ñÊ≤Ú„"¢∞¢2Êfñ∆≈7Gñ∆R“w&v&É#SR√#√¬r≤W≤rís≤2Á6ÜF˜t6ˆ∆˜"“r6ff3ìcBs≤2Á6ÜF˜t&«W"“s∞¢'"Ü2¬”b„"¬”#"“'"¬B„b¬B„B¬„bì≤2Êfñ∆¬Çì∞¢'"Ü2¬„"¬”#"“'"¬B¬B¬„bì≤2Êfñ∆¬Çì≤ÚÚ&ñváBWñRF˜V6Ç6÷∆∆W ¢2Á6ÜF˜t&«W"“∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉC√3b√3√„rís≤ÚÚ7V∂W"w&ñ∆∆P¢f˜"Ü∆WB≤“≤≤¬3≤≤≤≤í2Êfñ∆≈&V7BÇ”2≤≤¢"„B¬”2„Ç“'"¬„"¬"„bì∞¢ÚÚˆÊRÁFVÊÊ¬&VÁB'íFÜRñV'2¬∆◊7Fñ∆¬'W&ÊñÊr(	BÜó2V÷ó76ófP¢6ˆÁ7B7r“÷FÇÁ6ñ‚áF‚¢„Rí¢„#∞¢2Á7G&ˆ∂U7Gñ∆R“r3SsS6bs≤2Ê∆ñÊUvñGFÇ“„É≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”B¬”#í„R“'"ì≤2ÁVG&Fñ47W'fUFÚÇ”r¬”3r“'"¬”≤7r¬”C“'"ì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r6fcìC3s≤2Á6ÜF˜t6ˆ∆˜"“r6fcìC3s≤2Á6ÜF˜t&«W"“s∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ç”„b≤7r¬”C„B“'"¬"¬¬rì≤2Êfñ∆¬Çì≤2Á6ÜF˜t&«W"“∞¢ÚÚ∆óGF∆Rfˆ∆FVB&◊0¢2Á7G&ˆ∂U7Gñ∆R“r3CìCC3Çs≤2Ê∆ñÊUvñGFÇ“3≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”„R¬”b“'"ì≤2ÁVG&Fñ47W'fUFÚÇ”2„R¬”"¬”„R¬”ì≤2Á7G&ˆ∂RÇì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ¬”R“'"ì≤2ÁVG&Fñ47W'fUFÚÉ2¬”"¬„R¬”„Rì≤2Á7G&ˆ∂RÇì∞¢'&V≥∞¢–¢66Rw&F6ÜWBs¢≤ÚÚÜW&÷W2ˆbFÜR67&ÜV2(	BÜó26ñ∆Ü˜VWGFRï2FÜR6Ü˜ ¢6ˆÁ7B'"“÷FÇÁ6ñ‚áF‚¢„bí¢„ì∞¢6ˆÁ7B7ví“÷FÇÁ6ñ‚áF‚¢„í¢"„#∞¢ÚÉ"¬#ì∞¢ÚÚ$TÑî‰C¢FÜR6«fvR6≤F˜vW&ñÊr˜fW"Üñ–¢6ˆÁ7B6≤“Çí”‚∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÇ”í¬”Bì∞¢2Ê&W¶ñW$7W'fUFÚÇ”#B¬”Ç¬”#"¬”3B¬”B¬”Cì∞¢2ÁVG&Fñ47W'fUFÚÇ”b¬”CB¬¬”Cì∞¢2ÁVG&Fñ47W'fUFÚÉ"¬”3¬¬”Çì∞¢2ÁVG&Fñ47W'fUFÚÉ¬”Ç¬”"¬”Bì∞¢2Ê6∆˜6UFÇÇì∞¢”∞¢2Á6fRÇì≤6≤Çì≤2Ê6∆óÇì∞¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”#B¬”CB¬"¬”b¬µ≥¬r3ñÉScu“¬≥„B¬r3sscSFu“¬≥„sR¬r3SCCÉ3Çu“¬≥¬r36333u’“ì∞¢2Êfñ∆≈&V7BÇ”#b¬”Cb¬3¬CBì∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉC√√s√„rís≤'"Ü2¬”#¬”3¬í¬Ç¬"ì≤2Êfñ∆¬Çì≤ÚÚ7FóF6ÜVBF6ÜW2¿¢2Êfñ∆≈7Gñ∆R“w&v&ÉìB√#√#Ç√„cRís≤'"Ü2¬”"¬”3Ç¬Ç¬r¬"ì≤2Êfñ∆¬Çì≤ÚÚ÷ó6÷F6ÜVBˆ‚W'˜6P¢2Á7G&ˆ∂U7Gñ∆R“w&v&É3R√3√#b√„bís≤2Ê∆ñÊUvñGFÇ“„#≤ÚÚ6&vÚ7G&0¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”#"¬”#"ì≤2ÁVG&Fñ47W'fUFÚÇ”¬”#b¬¬”#"ì≤2Á7G&ˆ∂RÇì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”#¬”"ì≤2ÁVG&Fñ47W'fUFÚÇ”¬”b¬¬”"ì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢ÚÚFÊv∆ñÊrv&W2ˆfbFÜR6≤(	BFÜRvÜˆ∆R6Ü˜7vó2vÜV‚ÜR'&VFÜW0¢f˜"Ü∆WB≤“≤≤¬#≤≤≤≤í∞¢6ˆÁ7BGÉ"“”#≤≤¢R¬G7r“÷FÇÁ6ñ‚áF‚¢„B≤≤¢"„í¢„C∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉC√3B√#Ç√„Çís≤2Ê∆ñÊUvñGFÇ“∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚáGÉ"¬”#≤≤¢íì≤2Ê∆ñÊUFÚáGÉ"≤G7r¬”B≤≤¢íì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“≤Úr3ÜfÜ#r¢r63ñVRs∞¢ñbÜ≤í≤2Ê&VvñÂFÇÇì≤2Ê&2áGÉ"≤G7r¬”"„R≤≤¢í¬"¬¬rì≤2Êfñ∆¬Çì≤–¢V«6R'"Ü2¬GÉ"≤G7r“„b¬”B¬2„"¬B¬í¬2Êfñ∆¬Çì∞¢–¢ÚÚ&ˆ∆∆VBF'ˆ‚F˜¬ÊBFÜR∆◊ˆ∆R&V6ÜñÊrf˜'v&@¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”b¬”Cb¬”B¬”3Ç¬µ≥¬r6#ÜcvRu“¬≥¬r3fSVcCbu’“ì∞¢'"Ü2¬”r¬”CR¬R¬b¬2ì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“r3FC#3Çs≤2Ê∆ñÊUvñGFÇ“#≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”b¬”CBì≤2ÁVG&Fñ47W'fUFÚÉB¬”S¬¬”Cbì≤2Á7G&ˆ∂RÇì∞¢ÚÚFÜR∆ÁFW&‚(	BÑï2∆ñváB¬7vñÊvñÊrvVÁF«í¬6V∆∆ñÊrv&◊FÄ¢2Á7G&ˆ∂U7Gñ∆R“r363C&2s≤2Ê∆ñÊUvñGFÇ“„#∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ¬”Cbì≤2Ê∆ñÊUFÚÉ≤7ví¬”Cì≤2Á7G&ˆ∂RÇì∞¢2Á6fRÇì≤2ÁG&Á6∆FRÉ≤7ví¬”3r„Rì∞¢2Êfñ∆≈7Gñ∆R“r363C&2s≤'"Ü2¬”2¬”2¬b¬r¬"ì≤2Êfñ∆¬Çì∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7B∆s"“2Ê7&VFU&Fñƒw&FñVÁBÉ¬„R¬„R¬¬„R¬ì∞¢∆s"ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√##B√S√írì≤∆s"ÊFD6ˆ∆˜%7F˜É„3R¬w&v&É#SR√ì√ì√„bírì≤∆s"ÊFD6ˆ∆˜%7F˜É¬w&v&É#SR√s√c√írì∞¢2Êfñ∆≈7Gñ∆R“∆s#≤2Ê&VvñÂFÇÇì≤2Ê&2É¬„R¬¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢2Êfñ∆≈7Gñ∆R“r6ffc&62s≤2Á6ÜF˜t6ˆ∆˜"“r6ff6Cc"s≤2Á6ÜF˜t&«W"“É∞¢2Êfñ∆≈&V7BÇ”„B¬”„b¬"„Ç¬Bì≤2Á6ÜF˜t&«W"“∞¢2Á&W7F˜&RÇì∞¢ÚÚFÜR&ˆGì¢áVÊ6ÜVB˜fW"FÜR6˜VÁFW"(	B6ˆÊ6fR&6≤¬vVñváBñ‚FÜR&V∆«ê¢6ˆÁ7B&ˆB“Çí”‚∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÇ”Ç¬ì∞¢2Ê&W¶ñW$7W'fUFÚÇ”"¬”“'"¢„B¬”¬”#“'"¬”2¬”#b“'"ì∞¢2ÁVG&Fñ47W'fUFÚÉR¬”3“'"¬¬”#B“'"ì∞¢2Ê&W¶ñW$7W'fUFÚÉB¬”Ç¬2¬”Ç¬¬ì∞¢2Ê6∆˜6UFÇÇì∞¢”∞¢2Á6fRÇì≤&ˆBÇì≤2Ê6∆óÇì∞¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”¬”3¬"¬”"¬µ≥¬r6CÜ&3Üu“¬≥„B¬r6ìÉÉV2u“¬≥„sR¬r3ssSs62u“¬≥¬r3F363u’“ì∞¢2Êfñ∆≈&V7BÇ”B¬”3"¬3¬3Bì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉS"√C√3"√„rís≤2Ê∆ñÊUvñGFÇ“"„C≤ÚÚ&ˆ‚7G& ¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”b¬”#B“'"ì≤2Ê∆ñÊUFÚÉí¬”"ì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#SR√#3b√#√„3Rís≤2Ê∆ñÊUvñGFÇ“≤ÚÚóG2∆óBVFvP¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”R„B¬”#R“'"ì≤2Ê∆ñÊUFÚÉí„b¬”2ì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢ÚÚFÜRÜVB¬Fá'W7Bf˜'v&B˜fW"FÜRvˆˆG2¬ÜˆˆFVBñ‚7FVV¬6 ¢2Á6fRÇì≤2ÁG&Á6∆FRÉÇ¬”#r“'"ì≤2Á&˜FFRÉ„Ç≤áF∆∂ñÊrÚ÷FÇÁ6ñ‚áF‚¢íí¢„2¢íì∞¢6ˆÁ7BÜB“Çí”‚∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”r¬2ì∞¢2Ê&W¶ñW$7W'fUFÚÇ”Ç¬”B¬”2¬”Ç¬"¬”Çì∞¢2Ê&W¶ñW$7W'fUFÚÉÇ¬”Ç¬¬”B¬„R¬ì∞¢2ÁVG&Fñ47W'fUFÚÉ¬B„R¬b¬Rì∞¢2ÁVG&Fñ47W'fUFÚÇ”"¬b¬”r¬2ì≤2Ê6∆˜6UFÇÇì∞¢”∞¢2Á6fRÇì≤ÜBÇì≤2Ê6∆óÇì∞¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”Ç¬”í¬¬R¬µ≥¬r6SfC&Bu“¬≥„CR¬r6#CìCcÇu“¬≥¬r3fSCu’“ì∞¢2Êfñ∆≈&V7BÇ”í¬”¬#¬rì∞¢2Á&W7F˜&RÇì∞¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”Ç¬”¬b¬”"¬µ≥¬r3Üì#ìÇu“¬≥¬r3F3S#SÇu’“ì∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”Ç¬”ì≤2ÁVG&Fñ47W'fUFÚÇ”b¬”í„R¬"¬”í„Rì∞¢2ÁVG&Fñ47W'fUFÚÉí¬”í„R¬¬”Bì∞¢2ÁVG&Fñ47W'fUFÚÉí¬”b„R¬"¬”b„Çì≤2ÁVG&Fñ47W'fUFÚÇ”B¬”b„b¬”Ç¬”ì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#C√#CÇ√#SR√„bís≤2Ê∆ñÊUvñGFÇ“∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”r¬”2ì≤2ÁVG&Fñ47W'fUFÚÇ”B¬”Ç„b¬"¬”Ç„Çì≤2Á7G&ˆ∂RÇì∞¢ÚÚvˆ∆B˜Fñ72VÊFW"FÜR6(	BFÜR&ó6ñÊr∆ˆˆ∞¢2Êfñ∆≈7Gñ∆R“r3C#s≤'"Ü2¬”¬”R„R¬„b¬R„B¬"„Bì≤2Êfñ∆¬Çì∞¢6ˆÁ7BW"“&∆ñÊ≥"Ú„R¢∞¢2Êfñ∆≈7Gñ∆R“w&v&É#SR√#R√ìÇ¬r≤W"≤rís≤2Á6ÜF˜t6ˆ∆˜"“r6ff6Cc"s≤2Á6ÜF˜t&«W"“s∞¢'"Ü2¬„"¬”R¬B„b¬B„"¬„Bì≤2Êfñ∆¬Çì≤'"Ü2¬R„b¬”B„Ç¬2„Ç¬2„Ç¬„Bì≤2Êfñ∆¬Çì∞¢2Á6ÜF˜t&«W"“∞¢2Á&W7F˜&RÇì∞¢ÚÚFÜR6˜VÁFW"7&FRÊBFÜR&“&W7FñÊrˆ‚óB¬ñ‚e$ÙÂBˆbWfW'óFÜñÊp¢2Êfñ∆≈7Gñ∆R“∆ñ‚É"¬”B¬#B¬¬µ≥¬r3v3fF2u“¬≥¬r3CS6&2u’“ì∞¢'"Ü2¬"¬”"¬2¬"¬"ì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“w&v&É#3√#√s√„3Rís≤2Êfñ∆≈&V7BÉ"¬”"¬2¬"„"ì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉC√3B√#b√„rís≤2Ê∆ñÊUvñGFÇ“∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉÇ„R¬”ì≤2Ê∆ñÊUFÚÉÇ„R¬ì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“r3ÜfcF2s≤2Ê∆ñÊUvñGFÇ“2„c≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉb¬”#“'"ì≤2ÁVG&Fñ47W'fUFÚÉ2¬”Ç¬b¬”"„bì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r63ñÉsÇs≤2Ê&VvñÂFÇÇì≤2Ê&2Éb„R¬”"„B¬"„B¬¬rì≤2Êfñ∆¬Çì∞¢'&V≥∞¢–¢66Rv÷ˆÊÚs¢≤ÚÚFÜR˜&6∆R(	B5%Bf6Rˆ‚6á&˜VBˆbFVB6&∆W0¢6ˆÁ7B'"“÷FÇÁ6ñ‚áF‚¢„Bí¢„s∞¢ÚÉ¬Rì∞¢6ˆÁ7B6á&˜VB“Çí”‚∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”B¬”3bì∞¢2Ê&W¶ñW$7W'fUFÚÇ”2¬”#Ç¬”B¬”"¬”"¬ì∞¢2Ê∆ñÊUFÚÉ"¬ì∞¢2Ê&W¶ñW$7W'fUFÚÉB¬”"¬2¬”#Ç¬B¬”3bì≤2Ê6∆˜6UFÇÇì∞¢”∞¢2Á6fRÇì≤6á&˜VBÇì≤2Ê6∆óÇì∞¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”"¬”3b¬"¬¬µ≥¬r3F3Scsu“¬≥„CR¬r33363SBu“¬≥¬r3S#33Bu’“ì∞¢2Êfñ∆≈&V7BÇ”b¬”3Ç¬3"¬Cì∞¢2Ê∆ñÊUvñGFÇ“„c≤2Ê∆ñÊT6“w&˜VÊBs∞¢f˜"Ü∆WB≤“≤≤¬c≤≤≤≤í≤ÚÚFÜRÜÊvñÊr6&∆W0¢6ˆÁ7B«Ç“”≤≤¢B≤Ü≤R"í¢„#∞¢2Á7G&ˆ∂U7Gñ∆R“≤””“"Úw&v&É#√ì√#SR√„Rír¢w&v&É#√#B√3b√„cRís∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜ«Ç¬”3"ì∞¢2Ê&W¶ñW$7W'fUFÚÜ«Ç“"¬”#¬«Ç≤"¢÷FÇÁ6ñ‚áF‚¢„í≤≤í¬”¬«Ç¬ì≤2Á7G&ˆ∂RÇì∞¢–¢2Á&W7F˜&RÇì∞¢2Êfñ∆≈7Gñ∆R“r3#3#É3Çs≤'"Ü2¬”b¬”3Ç“'"¬"¬B¬"ì≤2Êfñ∆¬Çì∞¢ÚÚFÜR5%BÜVB¬Fñ«FVBfWrFVw&VW2(	BÊWfW"7V&RFÚFÜR&ˆˆ–¢2Á6fRÇì≤2ÁG&Á6∆FRÉ¬”Cb“'"ì≤2Á&˜FFRÇ”„Rì∞¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”2¬”í¬"¬í¬µ≥¬r3ÜìFÇu“¬≥„B¬r3V#cCsÇu“¬≥¬r33C6F2u’“ì∞¢'"Ü2¬”2¬”Ç¬#b¬r¬Rì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#3√#C√#SR√„Rís≤2Ê∆ñÊUvñGFÇ“∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”¬”r„"ì≤2Ê∆ñÊUFÚÉb¬”r„Rì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r3É#s≤'"Ü2¬”„R¬”R„R¬#¬"¬2ì≤2Êfñ∆¬Çì∞¢2Á6fRÇì≤'"Ü2¬”„R¬”R„R¬#¬"¬2ì≤2Ê6∆óÇì∞¢ÚÚFÜRf6Ró2vfVf˜&”¢óBF∆∑2¬óBVñ6∂VÁ0¢2Á7G&ˆ∂U7Gñ∆R“r3Sv3Üfbs≤2Á6ÜF˜t6ˆ∆˜"“r3Sv3Üfbs≤2Á6ÜF˜t&«W"“c≤2Ê∆ñÊUvñGFÇ“„c∞¢2Ê&VvñÂFÇÇì∞¢f˜"Ü∆WBÉ"“”≤É"√“≤É"≥“í∞¢6ˆÁ7Bì"“„R“÷FÇÁ6ñ‚áÉ"¢„SR≤F‚¢áF∆∂ñÊrÚí¢2íí¢áF∆∂ñÊrÚ2„b¢"„"í¢÷FÇÊWáÇ‘÷FÇÊ'2áÉ"í¢„bì∞¢É"””“”Ú2Ê÷˜fUFÚáÉ"¬ì"í¢2Ê∆ñÊUFÚáÉ"¬ì"ì∞¢–¢2Á7G&ˆ∂RÇì≤2Á6ÜF˜t&«W"“∞¢2Êv∆ˆ&ƒ«Ü“„c≤2Êfñ∆≈7Gñ∆R“r3ñfCÜfbs∞¢f˜"Ü∆WB≤“”S≤≤¬c≤≤≥“"í2Êfñ∆≈&V7BÇ”„R¬≤¬#¬„Çì∞¢2Êv∆ˆ&ƒ«Ü“∞¢2Á&W7F˜&RÇì∞¢2Á&W7F˜&RÇì∞¢ÚÚFÜR67&VV‚∆ñváB5îƒ≈2F˜v‚FÜR6á&˜VB(	BFÜR∆ñváB∆ófW2ñ‚FÜR&ˆˆ–¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7B7“2Ê7&VFU&Fñƒw&FñVÁBÉ¬”C“'"¬2¬¬”#b¬#bì∞¢7ÊFD6ˆ∆˜%7F˜É¬w&v&ÉÉr√#√#SR√„"írì≤7ÊFD6ˆ∆˜%7F˜É¬w&v&ÉÉr√#√#SR√írì∞¢2Êfñ∆≈7Gñ∆R“7≤2Ê&VvñÂFÇÇì≤2Ê&2É¬”3¬#b¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢'&V≥∞¢–¢66RwF6Çs¢≤ÚÚFÜRFñÊ∂W"(	B6˜W"Fˆ÷R¬VÊWV¬vˆvv∆W2¬F˜&6Ç&–¢6ˆÁ7B62“÷FÇÁ6ñ‚áF‚¢r„rí¢„c∞¢ÚÉ¬Rì∞¢f˜"Ü∆WB≤“≤≤¬C≤≤≤≤í≤ÚÚ6ÜFVB7ñFW"∆Vw0¢6ˆÁ7B«Ç“”"≤≤¢Ç¬∆ñgB“Ü≤R"Ú62¢◊62ì∞¢2Á7G&ˆ∂U7Gñ∆R“r3&S#É#s≤2Ê∆ñÊUvñGFÇ“3≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜ«Ç¢„B¬”ì≤2Ê∆ñÊUFÚÜ«Ç¬”B≤∆ñgBì≤2Ê∆ñÊUFÚÜ«Ç≤2¬≤∆ñgB¢„Rì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“r3fSVcCbs≤2Ê∆ñÊUvñGFÇ“„#∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜ«Ç¢„B“„R¬”„rì≤2Ê∆ñÊUFÚÜ«Ç“„R¬”B„Ç≤∆ñgBì≤2Á7G&ˆ∂RÇì∞¢–¢6ˆÁ7BFˆ÷R“Çí”‚∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”¬”íì∞¢2Ê&W¶ñW$7W'fUFÚÇ”"¬”#¬”R¬”#b¬¬”#bì∞¢2Ê&W¶ñW$7W'fUFÚÉÇ¬”#b¬"¬”#¬¬”ì∞¢2ÁVG&Fñ47W'fUFÚÉb¬”r¬¬”rì∞¢2ÁVG&Fñ47W'fUFÚÇ”b¬”r¬”¬”íì≤2Ê6∆˜6UFÇÇì∞¢”∞¢2Á6fRÇì≤Fˆ÷RÇì≤2Ê6∆óÇì∞¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”¬”#r¬¬”b¬µ≥¬r6S&#ÉBu“¬≥„B¬r6ÉsÉSu“¬≥„Ç¬r3f3F3bu“¬≥¬r3CÉ3C&2u’“ì∞¢2Êfñ∆≈&V7BÇ”2¬”#Ç¬#b¬#Bì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É3√#B√#√„Rís≤2Ê∆ñÊUvñGFÇ“∞¢2Ê&VvñÂFÇÇì≤2Ê&2É¬”B¬í¬2„R¬R„íì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢ÚÚvˆvv∆W3¢T‰UT¬∆VÁ6W2¬v∆72v∆ñÁBˆ‚FÜR&ñrˆÊP¢2Êfñ∆≈7Gñ∆R“r3333&s∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ç”"¬”#¬B„B¬¬rì≤2Êfñ∆¬Çì∞¢2Ê&VvñÂFÇÇì≤2Ê&2ÉR„B¬”#„B¬2„"¬¬rì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r6ffCÜs≤2Á6ÜF˜t6ˆ∆˜"“r6ffCÜs≤2Á6ÜF˜t&«W"“c∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ç”"¬”#¬"„b¬¬rì≤2Êfñ∆¬Çì∞¢2Ê&VvñÂFÇÇì≤2Ê&2ÉR„B¬”#„B¬„Ç¬¬rì≤2Êfñ∆¬Çì≤2Á6ÜF˜t&«W"“∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#SR√#SR√#SR√„sRís≤2Ê∆ñÊUvñGFÇ“∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ç”2¬”#"„"¬"„b¬2„b¬B„Çì≤2Á7G&ˆ∂RÇì∞¢ÚÚFÜRF˜&6Ç&“¬Fó7WGFW&ñÊr(	BÜó2V÷ó76ófP¢2Á7G&ˆ∂U7Gñ∆R“r3V3F33Çs≤2Ê∆ñÊUvñGFÇ“"„C≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉÇ¬”bì≤2ÁVG&Fñ47W'fUFÚÉB¬”#"¬R¬”#r“62¢„bì≤2Á7G&ˆ∂RÇì∞¢6ˆÁ7Bw“÷FÇÁ6ñ‚áF‚¢#2í‚„"Ú¢„3∞¢2Êfñ∆≈7Gñ∆R“w&v&É#SR√CÇ√CÇ¬r≤w≤rís≤2Á6ÜF˜t6ˆ∆˜"“r6fcìC3s≤2Á6ÜF˜t&«W"“í¢w∞¢2Ê&VvñÂFÇÇì≤2Ê&2ÉR„2¬”#Ç“62¢„b¬„Ç¬¬rì≤2Êfñ∆¬Çì≤2Á6ÜF˜t&«W"“∞¢'&V≥∞¢–¢66Rw6vRs¢≤ÚÚFÜR&6Üófó7B(	B˜&6V∆ñ‚˜&"ñÁ6ñFRGW&ÊñÊr&ñÊw0¢6ˆÁ7BÜ˜b“÷FÇÁ6ñ‚áF‚¢„2í¢"„C∞¢ÚÉ¬¬„"ì∞¢2Á6fRÇì≤2ÁG&Á6∆FRÉ¬”#b≤Ü˜bì∞¢6ˆÁ7B&ñÊuFñ«B“÷FÇÁ6ñ‚áF‚¢„rí¢„3∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉSí√#3"√#SR√„3Rís≤2Ê∆ñÊUvñGFÇ“#≤ÚÚ&6≤Ü∆`¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÉ¬¬R¬R„B¬&ñÊuFñ«B¬÷FÇÂí¬÷FÇÂí¢"ì≤2Á7G&ˆ∂RÇì∞¢6ˆÁ7B˜&"“Çí”‚≤2Ê&VvñÂFÇÇì≤2Ê&2É¬¬í¬¬rì≤”∞¢2Á6fRÇì≤˜&"Çì≤2Ê6∆óÇì∞¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”Ç¬”í¬Ç¬Ç¬µ≥¬r6c&cffu“¬≥„CR¬r6#ñ3ÜCÇu“¬≥„Ç¬r3ssÉsñ2u“¬≥¬r3F3SÉsu’“ì∞¢2Êfñ∆≈&V7BÇ”¬”¬#¬#ì∞¢2Êfñ∆≈7Gñ∆R“w&v&É#√#b√C√„íís∞¢'"Ü2¬”R„R¬”"„"¬¬B„B¬"„"ì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢6ˆÁ7Bw“„cR≤÷FÇÁ6ñ‚áF‚¢"„í¢„#S∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉSí√#3"√#SR¬r≤w≤rís≤2Á6ÜF˜t6ˆ∆˜"“r3ñfSÜfbs≤2Á6ÜF˜t&«W"“É∞¢'"Ü2¬”2„b¬”„B¬r„"¬"„Ç¬„Bì≤2Êfñ∆¬Çì≤2Á6ÜF˜t&«W"“∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉSí√#3"√#SR√„Rís≤2Ê∆ñÊUvñGFÇ“#≤ÚÚg&ˆÁBÜ∆`¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÉ¬¬R¬R„B¬&ñÊuFñ«B¬¬÷FÇÂíì≤2Á7G&ˆ∂RÇì∞¢6ˆÁ7B&“áF‚¢„bíR÷FÇÂì≤ÚÚˆÊR'&ñváB6Vv÷VÁ@¢2Á7G&ˆ∂U7Gñ∆R“r6SÜf&fbs≤2Ê∆ñÊUvñGFÇ“"„#∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÉ¬¬R¬R„B¬&ñÊuFñ«B¬&¬&≤„rì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉSí√#3"√#SR√„Bís≤2Ê∆ñÊUvñGFÇ“„c≤ÚÚG&ñgFñÊrv«óÇFá&VG0¢f˜"Ü∆WB≤“≤≤¬C≤≤≤≤í∞¢6ˆÁ7B“”„r≤≤¢„Cb≤÷FÇÁ6ñ‚áF‚¢„B≤≤í¢„∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ¬”b≤Ü˜bì≤2ÁVG&Fñ47W'fUFÚÑ÷FÇÁ6ñ‚Üí¢b¬”Ç¬÷FÇÁ6ñ‚Üí¢#"¬"ì≤2Á7G&ˆ∂RÇì∞¢–¢'&V≥∞¢–¢66Rv«V÷V‚s¢≤ÚÚFÜR∆˜7BÁñ◊Ç(	B∆Vb◊w&VB∆ñvá@¢6ˆÁ7Bf¬“÷FÇÁ6ñ‚áF‚¢í¢C∞¢6ˆÁ7Bw“„R≤÷FÇÁ6ñ‚áF‚¢"„Bí¢„3S∞¢ÚÉ¬Ç¬„bì∞¢2Á6fRÇì≤2ÁG&Á6∆FRÉ¬”b“÷FÇÁ6ñ‚áF‚¢„"í¢2ì∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7BR“2Ê7&VFU&Fñƒw&FñVÁBÉ¬"¬¬¬"¬#ì∞¢RÊFD6ˆ∆˜%7F˜É¬w&v&É#R√#SR√SB¬r≤É„#"≤w¢„Bí≤rírì∞¢RÊFD6ˆ∆˜%7F˜É¬w&v&É#R√#SR√SB√írì∞¢2Êfñ∆≈7Gñ∆R“S≤2Ê&VvñÂFÇÇì≤2Ê&2É¬"¬#¬¬rì≤2Êfñ∆¬Çì∞¢f˜"Ü6ˆÁ7B6Bˆb≤”¬“í≤ÚÚfVñÊVBFFóFófRvñÊw0¢2Á6fRÇì≤2ÁG&Á6∆FRá6B¢B¬”Bì≤2Á&˜FFRá6B¢É„CR≤f¬¢„Bíì∞¢6ˆÁ7Bvr“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬¬6B¢2¬”bì∞¢vrÊFD6ˆ∆˜%7F˜É¬w&v&Éì√#SR√#√„Rírì≤vrÊFD6ˆ∆˜%7F˜É¬w&v&É#R√#SR√SB√„bírì∞¢2Êfñ∆≈7Gñ∆R“vs∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6Rá6B¢r¬”"¬Ç„R¬2„B¬6B¢”„B¬¬rì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É##√#SR√#3√„Rís≤2Ê∆ñÊUvñGFÇ“„É∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ¬ì≤2ÁVG&Fñ47W'fUFÚá6B¢Ç¬”B„R¬6B¢B¬”Bì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢–¢2Á&W7F˜&RÇì∞¢6ˆÁ7B&ˆB“Çí”‚∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ¬”ì∞¢2Ê&W¶ñW$7W'fUFÚÉb„R¬”r¬b¬2¬¬íì∞¢2Ê&W¶ñW$7W'fUFÚÇ”b¬2¬”b„R¬”r¬¬”ì≤2Ê6∆˜6UFÇÇì∞¢”∞¢2Á6fRÇì≤&ˆBÇì≤2Ê6∆óÇì∞¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”b¬”¬b¬í¬µ≥¬r3cñÉsÇu“¬≥„CR¬r36csS"u“¬≥¬r3##C&Ru’“ì∞¢2Êfñ∆≈&V7BÇ”Ç¬”"¬b¬#"ì∞¢2Á&W7F˜&RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#√#SR√##R√„rís≤2Ê∆ñÊUvñGFÇ“∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”"„b¬”íì≤2ÁVG&Fñ47W'fUFÚÇ”R¬”2¬”2„B¬Bì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“w&v&É##√#SR√#3¬r≤É„sR≤w¢„#Rí≤rís∞¢2Á6ÜF˜t6ˆ∆˜"“r3vFfcñs≤2Á6ÜF˜t&«W"“í≤w¢É∞¢2Ê&VvñÂFÇÇì≤2Ê&2É¬”¬2„B¬¬rì≤2Êfñ∆¬Çì≤2Á6ÜF˜t&«W"“∞¢2Êfñ∆≈7Gñ∆R“r3#Cs≤2Êfñ∆≈&V7BÇ”"„b¬”r„B¬„Ç¬„Çì≤2Êfñ∆≈&V7BÉ¬”r„B¬„Ç¬„Çì∞¢2Á&W7F˜&RÇì∞¢'&V≥∞¢–¢66Rv∂W&bs¢≤ÚÚDÑRƒ5B5UEDU"(	BÜVgí∆ñF'ívóFÇÊÚV'0¢ÚÚtÑBDÑR4îƒÑıTUEDRÑ2DÚ4íBdı%EíïÑT≈2¬ñ‚˜&FW#¢6ÜRó0¢ÚÚÜVgíÊB∆˜r¬6ÜRÜ2‰ıDÑî‰rDÚÑT"tïDÇ¬ÊB6ÜRó2Üˆ∆FñÊp¢ÚÚ6ˆ÷WFÜñÊrFÜBó2'W&ÊñÊr‚WfW'óFÜñÊr&V∆˜r6W'fW2FÜ˜6RFá&VR‡¢Ú¢ÚÚGvÚ76W2vW&RFá&˜v‚vívWGFñÊrÜW&RÊB&˜FÇfñ«W&W2&Rv˜'FÄ¢ÚÚw&óFñÊrF˜v‚¬&V6W6RFÜWí&RFÜR7FÊFñÊrG&2f˜"&ˆGíBFÜó0¢ÚÚ6ó¶R‚FÜRfó'7BG&WrÜW"ñ‚FÜR6Ü76ó2w&Wó26ÜRó27GV∆«í÷FRˆ`¢ÚÚÊB6ÜRfÊó6ÜVBñÁFÚF&≤f∆ˆ˜"(	B%EÙ$î$ƒR*sí„B¬FÜR&W6W'fV@¢ÚÚ6á&ˆ÷&V∆ˆÊw2FÚFÜR67B¬6Ú6ÜR6'&ñW2ÜW"˜v‚∆ñváBÊ˜rÊBFÜP¢ÚÚ∆ñváBó2FÜRv˜&≤6ÜRó2FˆñÊr‚FÜR6V6ˆÊB6÷ˆ˜FÜVBÜW"ñÁFÚFˆ÷P¢ÚÚvóFÇ6W&FR6ˆ‚F˜ÊB6ÜR&VB2’U4Ö$ÙÙ”¢&ˆGívóFÇÊ¢ÚÚe$ÙÂBÜ2ÊÚÜVBf˜"‚V"FÚ&R÷ó76ñÊrg&ˆ“¬ÊB&ÊÚV'2"6ó0¢ÚÚÊ˜FÜñÊrVÁFñ¬FÜW&Ró26ˆ÷WvÜW&RFÜWí6˜V∆BÜfR&VV‚‡¢Ú¢ÚÚ6Ú6ÜRÜ2g&ˆÁB‚&«VÁBWñV∆W72&˜r'VÁ2f˜'v&BÊBF˜v‚˜WBˆ`¢ÚÚvVFvR6ÜV∆¬¬ˆÊRvñFR˜Fñ2&"&V6W76VBñÁFÚóB(	BÊB&˜fRFÜ@¢ÚÚ&˜r¬vÜW&RWfW'í˜FÜW"÷6ÜñÊRñ‚FÜó267B6'&ñW26˜v¬¬Fó6Ç˜ ¢ÚÚ‚ÁFVÊÊ¬FÜW&Ró2Ê˜FÜñÊrB∆¬‚6ÜRó2Ê˜BñF∆ñÊrvÜV‚FÜR∆ñW ¢ÚÚfñÊG2ÜW"¬6ÜRó2tı$¥î‰s¢6∆˜r&˜r7G&ˆ∂R7&˜72FÜR7'ó7F¿¢ÚÚ6∆◊VBñ‚g&ˆÁBˆbÜW"¬ÊBFÜR7'ó7F¬Á7vW&ñÊróB‡¢ÚÚ4ÑRï2%Tî≈BB„R¬g&ˆ“FÜRfVWBW‚FÜR˜vÊW"w27FÊFñÊr'V∆ñÊrˆ‡¢ÚÚFÜR67B(	B'FÜRÁ2ó2FˆÚ6÷∆¬¬óB6Ü˜V∆B&RF˜V&∆R◊í6ó¶R"(	Bó0¢ÚÚváí&F6ÜWBw2F∆26óG2B"„b¬ÊB&ˆGíG&v‚BÜóF&˜Ç66∆P¢ÚÚ7FÊG24Ñı%DU"FÜ‚FÜR6B‚∂W&bó2FV∆ñ&W&FV«í∆˜r◊6«VÊr¬6Ú6ÜP¢ÚÚFˆW2Ê˜BÊVVBFÜRG&FW"w2ÜVñváC≤6ÜRÊVVG2Üó2tTîtÖB¬ÊBFÜP¢ÚÚ66∆Ró2g&ˆ“ì”6ÚÜW"fVWB7Fíˆ‚FÜRf∆ˆ˜"vÜñ∆R6ÜRvWG2óB‡¢2Á6fRÇì≤2Á66∆RÉ„R¬„Rì∞¢6ˆÁ7B'"“÷FÇÁ6ñ‚áF‚¢„Rí¢„c∞¢ÚÚFÜR7G&ˆ∂S¢6∆˜r¬ˆÊR÷Fó&V7FñˆÊ¬¬vóFÇW6RBFÜRf"VÊB(	B6p¢ÚÚ7WBó2W6ÇÊBvóB¬ÊWfW"67'V ¢6ˆÁ7BÇ“áF‚¢„C"íR∞¢6ˆÁ7B7G&ˆ∂R“Ç¬„s"Ú÷FÇÁ6ñ‚áÇÚ„s"¢÷FÇÂíí¢∞¢6ˆÁ7B•Ç“#Ç¬•í“”3≤ÚÚvÜW&RFÜR7'ó7F¬6óG0¢ÚÉ¬#"¬„3"ì∞¢ÚÚFÜRv˜&≤w2˜v‚∆ñváB¬∆ñBF˜v‚fó'7B6ÚFÜRvÜˆ∆R&ˆGí6óG2ñÁ6ñFRó@¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢6ˆÁ7BW"“2Ê7&VFU&Fñƒw&FñVÁBÑ•Ç¬•í¬"¬•Ç¬•í¬#B≤7G&ˆ∂R¢"ì∞¢W"ÊFD6ˆ∆˜%7F˜É¬w&v&É#3B√#Cb√#SR¬r≤É„2≤7G&ˆ∂R¢„3Bí≤rírì∞¢W"ÊFD6ˆ∆˜%7F˜É„R¬w&v&É#3B√#Cb√#SR¬r≤É„Ç≤7G&ˆ∂R¢„"í≤rírì∞¢W"ÊFD6ˆ∆˜%7F˜É¬w&v&É#3B√#Cb√#SR√írì∞¢2Êfñ∆≈7Gñ∆R“W#∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ñ•Ç¬•í¬#B≤7G&ˆ∂R¢"¬¬rì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢ÚÚf˜W"'&6VB∆Vw2vóFÇ&V¬fVWB(	B&˜vVB¬∆ÁFVB¬ÊWfW"˜7G0¢f˜"Ü6ˆÁ7B«Çˆb≤”b¬”Ç¬2¬“í∞¢2Á7G&ˆ∂U7Gñ∆R“r3F6CCís≤2Ê∆ñÊUvñGFÇ“B„#≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜ«Ç¢„Ç¬”2ì∞¢2ÁVG&Fñ47W'fUFÚÜ«Ç¢„b¬”b¬«Ç¬”„Çì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r3&##3&2s∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÜ«Ç¬”„"¬B„B¬„í¬¬¬rì≤2Êfñ∆¬Çì∞¢–¢ÚÚDÑR4ÑTƒ√¢vVFvR(	BF∆¬ÊB&˜VÊB˜fW"FÜRÜVÊ6ÜW2BFÜR&6≤¿¢ÚÚ'VÊÊñÊrF˜v‚ÊBf˜'v&BFÚFÜR&˜r‚&ˆGívóFÇFó&V7Fñˆ‚‡¢6ˆÁ7B6ÜV∆¬“Çí”‚∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÇ”#¬”"ì∞¢2Ê&W¶ñW$7W'fUFÚÇ”#B¬”#R“'"¬”Ç¬”3B“'"¬”r¬”3R“'"ì∞¢2Ê&W¶ñW$7W'fUFÚÉ2¬”3b“'"¬¬”3“'"¬B¬”#R“'"ì∞¢2ÁVG&Fñ47W'fUFÚÉb¬”í¬2¬”B„Rì∞¢2ÁVG&Fñ47W'fUFÚÇ”2¬”„R¬”#¬”"ì∞¢2Ê6∆˜6UFÇÇì∞¢”∞¢2Á6fRÇì≤6ÜV∆¬Çì≤2Ê6∆óÇì∞¢2Êfñ∆≈7Gñ∆R“∆ñ‚Ç”#¬”3r¬R¬”¬µ≥¬r6ÜVu“¬≥„3b¬r3fcVcsu“¬≥„Ç¬r36S3CCu“¬≥¬r3#Sc#íu’“ì∞¢2Êfñ∆≈&V7BÇ”#R¬”3í¬CB¬3"ì∞¢ÚÚ5UBƒ‰U2¬Ê˜B6÷ˆ˜FÇ67FñÊr‚6ÜRó2∆ñF'íÊBÜW"˜v‡¢ÚÚ6Ü76ó2ó26Üó6V∆∆VC¢Fá&VR∆ˆÊrf6WBVFvW2˜fW"FÜRÜVÊ6ÜW2¿¢ÚÚV6Ç6F6ÜñÊrFñffW&VÁB÷˜VÁBˆbFÜRv˜&≤∆ñváB‡¢f˜"Ü∆WBí“≤í¬3≤í≤≤í∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#3B√#Cb√#SR¬r≤É„b“í¢„Bí≤rís≤2Ê∆ñÊUvñGFÇ“„C∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”#"¬”3≤í¢b„R“'"ì∞¢2ÁVG&Fñ47W'fUFÚÇ”b¬”32≤í¢b„Ç“'"¬B¬”#b≤í¢R„B“'"ì≤2Á7G&ˆ∂RÇì∞¢–¢ÚÚ7'ó7F¬GW7Bñ‚FÜR6V◊2(	B6ÜRó2FÜR6ˆ∆˜W"ˆbFÜR7GVfb6ÜR7WG2¿¢ÚÚñ‚FÜR∆6W26ÜR6ÊÊ˜B&V6Ä¢2Êfñ∆≈7Gñ∆R“w&v&É#3B√#Cb√#SR√„2ís∞¢f˜"Ü∆WBí“≤í¬ì≤í≤≤í∞¢ÚÚ66GFW&VB¬Ê˜B76VC¢&˜rˆbWfVÊ«íóF6ÜVBF˜G2ó2&ófWG0¢6ˆÁ7BwÉ2“”#≤í¢B„B≤÷FÇÁ6ñ‚Üí¢"„íí¢"„c∞¢6ˆÁ7Bwì2“”B“÷FÇÊ'2Ñ÷FÇÁ6ñ‚Üí¢r„2íí¢B“'#∞¢2Ê&VvñÂFÇÇì≤2Ê&2ÜwÉ2¬wì2¬„Ç≤÷FÇÊ'2Ñ÷FÇÁ6ñ‚Üí¢2„íí¢„r¬¬rì≤2Êfñ∆¬Çì∞¢–¢2Á&W7F˜&RÇì∞¢ÚÚFÜRF˜VFvRF∂W2FÜR∆ñváC¢&ñ“ƒÙ‰rFÜR6Ü˜V∆FW"∆ñÊRˆÊ«í‚¢ÚÚ7G&ˆ∂R7&˜72ÜW"÷ñFF∆R&VG2267&F6Ç¬vÜñ6Çó2vÜBFÜR∆7@¢ÚÚ72G&Wr‡¢ÚÚ‚‚ÊÊBóBG&6W2FÜR4ÑTƒ¬u2ıt‚F˜7W'fR¬Ê˜BÜÊB◊GóVB6˜íˆ`¢ÚÚóB‚6V6ˆÊB6WBˆb6ˆÁG&ˆ¬ˆñÁG2óÜV¬˜"GvÚ˜WBG&w2∆ñÊP¢ÚÚf∆ˆFñÊrˆfbÜW"&6≤¬vÜñ6ÇBFÜó26ó¶R&VG22‚ÁFVÊÊ(	Bˆ‡¢ÚÚFÜRˆÊR&ˆGíñ‚FÜRv÷RvÜ˜6RVÁFó&RˆñÁBó2Ê˜BÜfñÊrˆÊR‡¢2Á6fRÇì≤6ÜV∆¬Çì≤2Ê6∆óÇì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#3B√#Cb√#SR¬r≤É„B≤7G&ˆ∂R¢„2í≤rís≤2Ê∆ñÊUvñGFÇ“3∞¢6ÜV∆¬Çì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢ÚÚ““““DÑR$ıs¢ÜW"ÜVB¬ÊBFÜR6ÜRˆbFÜRvÜˆ∆RñFV‚&«VÁB¿¢ÚÚWñV∆W72¬ßWGFñÊrf˜'v&BÊBDıt‚ˆfbFÜRg&ˆÁBˆbFÜR6ÜV∆¬¬vóFÇ¢ÚÚ6∆V‚V◊Gí7W'fR˜fW"FÜRF˜ˆbóBvÜW&RFÜRV'2&RÊ˜B‡¢2Êfñ∆≈7Gñ∆R“∆ñ‚ÉÇ¬”3¬#B¬”B¬µ≥¬r3ÜCv#ÜBu“¬≥„b¬r3VF3V2u“¬≥¬r33s&S6u’“ì∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÉí¬”#í“'"ì∞¢2ÁVG&Fñ47W'fUFÚÉ#¬”#Ç“'"¬#2¬”#"“'"ì∞¢2ÁVG&Fñ47W'fUFÚÉ#R¬”r„R“'"¬#¬”B„R“'"ì∞¢2ÁVG&Fñ47W'fUFÚÉB¬”"„R“'"¬¬”R“'"ì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÚÚFÜR˜Fñ3¢D$≤$T4U52vóFÇ'&ñváB&"ñ‚óB‚6ˆÁG&7Bó2vÜ@¢ÚÚ7W'fófW2FÜR6á&ñÊ≤¬6ÚFÜR6ˆ6∂WBFˆW22◊V6Çv˜&≤2FÜR∆ñváB‡¢2Êfñ∆≈7Gñ∆R“r3#Sbs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ„R¬”#B„R“'"ì∞¢2ÁVG&Fñ47W'fUFÚÉÇ¬”#R„R“'"¬#"¬”#„R“'"ì∞¢2ÁVG&Fñ47W'fUFÚÉÇ¬”Ç„R“'"¬„R¬”í„R“'"ì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢6ˆÁ7B˜“„sÇ≤÷FÇÁ6ñ‚áF‚¢„íí¢„C∞¢2Á6fRÇì∞¢2Êfñ∆≈7Gñ∆R“w&v&É#3B√#Cb√#SR¬r≤Ü&∆ñÊ≤Ú„"¢˜í≤rís∞¢2Á6ÜF˜t6ˆ∆˜"“r6Vcffbs≤2Á6ÜF˜t&«W"“&∆ñÊ≤Ú¢É∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ"„R¬”#2„B“'"ì∞¢2ÁVG&Fñ47W'fUFÚÉÇ¬”#B“'"¬#„b¬”#„B“'"ì∞¢2ÁVG&Fñ47W'fUFÚÉÇ¬”í„Ç“'"¬"„R¬”#„b“'"ì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢ÚÚ““““DÑRtı$≤‚FÜR¶ñr&“&V6ÜW2˜WBVÊFW"FÜR&˜rÊBÜˆ∆G2FÜP¢ÚÚ6V”≤FÜR&˜rG&w27&˜72óB‡¢2Á7G&ˆ∂U7Gñ∆R“r3V#FCSís≤2Ê∆ñÊUvñGFÇ“2„c≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ¬”Rì≤2ÁVG&Fñ47W'fUFÚÉ#¬”2¬•Ç“"¬•íì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r3F6CCís≤ÚÚFÜR6∆◊ ¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÑ•Ç“b¬•í≤2ì≤2ÁVG&Fñ47W'fUFÚÑ•Ç“"¬•í“B¬•Ç≤R¬•í≤ì∞¢2ÁVG&Fñ47W'fUFÚÑ•Ç≤"¬•í≤R¬•Ç“b¬•í≤2ì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s≤ÚÚFÜR6V“ñ‚ó@¢2Êfñ∆≈7Gñ∆R“w&v&É#SR√#SR√#SR¬r≤É„SR≤7G&ˆ∂R¢„CRí≤rís∞¢2Á6ÜF˜t6ˆ∆˜"“r6Vcffbs≤2Á6ÜF˜t&«W"“≤7G&ˆ∂R¢#∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÑ•Ç“B¬•í“ì≤2Ê∆ñÊUFÚÑ•Ç¬•í“b„Rì≤2Ê∆ñÊUFÚÑ•Ç≤B¬•í“„Rì∞¢2Ê∆ñÊUFÚÑ•Ç¬•í≤"ì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Á6ÜF˜t&«W"“≤2Á&W7F˜&RÇì∞¢ÚÚFÜR&˜s¢7W'fVBg&÷RvóFÇ6∆6≤vó&R¬G&fV∆∆ñÊr7&˜72FÜR7W@¢6ˆÁ7BGÇ“”B≤7G&ˆ∂R¢∞¢2Á6fRÇì≤2ÁG&Á6∆FRÜGÇ¬ì∞¢2Á7G&ˆ∂U7Gñ∆R“r3vCf#v2s≤2Ê∆ñÊUvñGFÇ“"„É∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÑ•Ç“2¬•í“2ì≤2ÁVG&Fñ47W'fUFÚÑ•Ç≤"¬•í“Ç¬•Ç≤Ç¬•í“Rì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#3B√#Cb√#SR√„Çís≤2Ê∆ñÊUvñGFÇ“∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÑ•Ç“2¬•í“2ì≤2ÁVG&Fñ47W'fUFÚÑ•Ç“"¬•í“Ç¬•Ç≤Ç¬•í“Rì≤2Á7G&ˆ∂RÇì∞¢2Á&W7F˜&RÇì∞¢ÚÚÜW"˜FÜW"&“ˆ‚FÜR&˜r¬&VÁB(	BFÜRV∆&˜r∆VG2FÜR7G&ˆ∂P¢2Á7G&ˆ∂U7Gñ∆R“r3V#FCSís≤2Ê∆ñÊUvñGFÇ“2„#∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉb¬”#ì≤2ÁVG&Fñ47W'fUFÚÉB≤GÇ¢„R¬”#B¬•Ç“"≤GÇ¬•í“"ì≤2Á7G&ˆ∂RÇì∞¢ÚÚFÜRw&óBFÜR7WBFá&˜w2¬ÊBˆÊ«ívÜñ∆RFÜR7G&ˆ∂Ró2÷˜fñÊp¢ñbá7G&ˆ∂R‚„#Rí∞¢2Á6fRÇì≤2Êv∆ˆ&ƒ6ˆ◊˜6óFT˜W&Fñˆ‚“v∆ñváFW"s∞¢2Êv∆ˆ&ƒ«Ü“á7G&ˆ∂R“„#Rí¢„ÉS∞¢2Á7G&ˆ∂U7Gñ∆R“r6fffffbs≤2Ê∆ñÊUvñGFÇ“∞¢f˜"Ü∆WBí“≤í¬C≤í≤≤í∞¢6ˆÁ7B"“”„3R“í¢„3∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÑ•Ç¬•í“"ì∞¢2Ê∆ñÊUFÚÑ•Ç≤÷FÇÊ6˜2Ü"í¢ÉÇ≤í¢2í¬•í“"≤÷FÇÁ6ñ‚Ü"í¢ÉÇ≤í¢2íì≤2Á7G&ˆ∂RÇì∞¢–¢2Á&W7F˜&RÇì≤2Êv∆ˆ&ƒ«Ü“∞¢–¢2Á&W7F˜&RÇì≤ÚÚÜW"„R'Vñ∆B66∆P¢'&V≥∞¢–¢–ß–¢ÚÚ““““FÜRˆGó76Wíw2V˜∆R“““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚ&ˆ&VB¬áV÷‚¬w&VV≤(	BG&v‚ñ‚FÜR6÷R∆ˆ6¬76R2FÜR÷6ÜñÊRÂ70¢ÚÚÜ˜&ñvñ‚BFÜRfVWB¬«&VGíf∆óVBFÚf6RFÜR∆ñW"í‚'&VFÜñÊrÊ@¢ÚÚ6÷∆¬vW7GW&W2∆ófRˆ‚W&f˜&÷Ê6RÊÊ˜rÇí∆ñ∂RFÜVó"÷6ÜñÊR6˜VÁFW''G2‡¶gVÊ7Fñˆ‚G&tÜW&ÙÂ2Ü2¬ñB¬2í∞¢6ˆÁ7BF‚“W&f˜&÷Ê6RÊÊ˜rÇíÚ≤á2ÁB«¬ì∞¢6ˆÁ7B'"“÷FÇÁ6ñ‚áF‚¢„rí¢„É≤ÚÚ'&VFÄ¢6ˆÁ7B&ˆ&R“áÇ¬r¬Ç¬6ˆ¬¬ÜV“í”‚∞¢2Êfñ∆≈7Gñ∆R“6ˆ√∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚáÇ“r¢„3"¬÷Çì∞¢2ÁVG&Fñ47W'fUFÚáÇ“r¢„c"¬÷Ç¢„B¬Ç“r¢„R¬ì∞¢2Ê∆ñÊUFÚáÇ≤r¢„R¬ì∞¢2ÁVG&Fñ47W'fUFÚáÇ≤r¢„c"¬÷Ç¢„B¬Ç≤r¢„3"¬÷Çì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ñbÜÜV“í≤2Êfñ∆≈7Gñ∆R“ÜV”≤2Êfñ∆≈&V7BáÇ“r¢„R¬”2¬r¬2ì≤–¢”∞¢6ˆÁ7BÜVB“áÇ¬í¬"¬6∂ñ‚í”‚∞¢2Êfñ∆≈7Gñ∆R“6∂ñ‚«¬r6CÜ#Éìbs∞¢2Ê&VvñÂFÇÇì≤2Ê&2áÇ¬í¬"¬¬rì≤2Êfñ∆¬Çì∞¢”∞¢7vóF6ÇÜñBí∞¢66Rw6W'fÚs¢≤ÚÚˆ∆B÷VÁF˜"(	B&V&FVBV∆FW"∆VÊñÊrˆ‚∂Ê˜GFVB7Ff`¢2Á7G&ˆ∂U7Gñ∆R“r3fSV6s≤2Ê∆ñÊUvñGFÇ“"„c≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ2¬ì≤2Ê∆ñÊUFÚÉ¬”3B“'"ì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r3Üs#CÇs≤2Ê&VvñÂFÇÇì≤2Ê&2É¬”3R“'"¬"„b¬¬rì≤2Êfñ∆¬Çì∞¢&ˆ&RÉ¬#B¬#b≤'"¬r3ÜÉ#ìÇr¬r3f#cSvrì∞¢ÜVBÉ¬”3“'"¬r„Rì∞¢2Êfñ∆≈7Gñ∆R“r6SÜSFFs≤ÚÚ&V&B≤'&˜p¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”R¬”#Ç“'"ì≤2ÁVG&Fñ47W'fUFÚÉ¬”b“'"¬R¬”#Ç“'"ì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r6c&VfSÇs≤2Ê&VvñÂFÇÇì≤2Ê&2É¬”3b“'"¬R„R¬÷FÇÂí¬ì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r3&&3s≤2Êfñ∆≈&V7BÉ¬”3"“'"¬"¬"ì≤2Êfñ∆≈&V7BÉR¬”3"“'"¬"¬"ì∞¢&WGW&‚G'VS∞¢–¢66Rw&F6ÜWBs¢≤ÚÚÜW&÷ñˆ‚FÜRG&FW"(	B6ÜóFˆ‚¬◊Ü˜&¬6ˆñ‚ñ‚ÜÊ@¢2Êfñ∆≈7Gñ∆R“r6#fC"s≤ÚÚFÜR◊Ü˜&¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÇ”R¬”í¬b¬í¬¬¬rì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r3ÜFc3s≤2Êfñ∆≈&V7BÇ”Ç¬”#¬b¬Bì∞¢&ˆ&RÉ¬#"¬#B≤'"¬r6SÜS62r¬r63ÜÉFrì∞¢ÜVBÉ¬”#Ç“'"¬rì∞¢2Êfñ∆≈7Gñ∆R“r3F6##Çs≤ÚÚ7W&«0¢2Ê&VvñÂFÇÇì≤2Ê&2É¬”3"“'"¬R„R¬÷FÇÂí¢„ìR¬÷FÇÂí¢„Rì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r3&&3s≤2Êfñ∆≈&V7BÉ"¬”#í“'"¬"¬"ì≤2Êfñ∆≈&V7BÉR„R¬”#í“'"¬"¬"ì∞¢6ˆÁ7B7“„R≤÷FÇÁ6ñ‚áF‚¢Bí¢„S≤ÚÚFÜR6ˆñ‚GW&ÊñÊp¢2Êfñ∆≈7Gñ∆R“r6ffCsfs≤2Á6ÜF˜t6ˆ∆˜"“r6ffCsfs≤2Á6ÜF˜t&«W"“b¢7∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÉ"¬”Ç“'"¬"„Ç¢É„B≤7¢„bí¬"„Ç¬¬¬rì≤2Êfñ∆¬Çì∞¢2Á6ÜF˜t&«W"“∞¢&WGW&‚G'VS∞¢–¢66Rv÷ˆÊÚs¢≤ÚÚFÜR˜&6∆R(	BfVñ∆VB¬vˆ∆B6ó&6∆WB¬WñW2∆ñ∂RV÷&W'0¢&ˆ&RÉ¬#B¬3B≤'"¬r36CccÇr¬r3&3CSrì∞¢2Êfñ∆≈7Gñ∆R“r36CccÇs≤ÚÚFÜRfVñ¬˜fW"FÜRÜV@¢2Ê&VvñÂFÇÇì≤2Ê&2É¬”3b“'"¬í¬÷FÇÂí¢„í¬÷FÇÂí¢„ì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈&V7BÇ”í¬”3b“'"¬Ç¬Çì∞¢2Êfñ∆≈7Gñ∆R“r3C&s≤2Ê&VvñÂFÇÇì≤2Ê&2É¬”32“'"¬b¬¬rì≤2Êfñ∆¬Çì∞¢6ˆÁ7Bw“„b≤÷FÇÁ6ñ‚áF‚¢"„"í¢„3∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉSí√#Ç√#SR¬r≤w≤rís∞¢2Á6ÜF˜t6ˆ∆˜"“r3ñfCfbs≤2Á6ÜF˜t&«W"“É∞¢2Êfñ∆≈&V7BÇ”2„R¬”3B“'"¬"„b¬"„bì≤2Êfñ∆≈&V7BÉ¬”3B“'"¬"„b¬"„bì∞¢2Á6ÜF˜t&«W"“∞¢2Á7G&ˆ∂U7Gñ∆R“r6ffCsfs≤2Ê∆ñÊUvñGFÇ“„c≤ÚÚ6ó&6∆W@¢2Ê&VvñÂFÇÇì≤2Ê&2É¬”3r“'"¬Ç„B¬÷FÇÂí¢„R¬÷FÇÂí¢„ìRì≤2Á7G&ˆ∂RÇì∞¢&WGW&‚G'VS∞¢–¢66Rw6vRs¢≤ÚÚFÜR6ñ'ñ¬(	BÜˆˆFVB¬‚VÁ&ˆ∆∆VB67&ˆ∆¬ñ‚ÜW"ÜÊG0¢&ˆ&RÉ¬#R¬3≤'"¬r3FCV3sr¬r36CFV2rì∞¢2Êfñ∆≈7Gñ∆R“r3FCV3ss∞¢2Ê&VvñÂFÇÇì≤2Ê&2É¬”3"“'"¬Ç„R¬÷FÇÂí¢„ÉR¬÷FÇÂí¢„Rì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r3##3s≤2Ê&VvñÂFÇÇì≤2Ê&2É¬”3“'"¬R„R¬¬rì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r3ñfSÜfbs≤2Á6ÜF˜t6ˆ∆˜"“r3ñfSÜfbs≤2Á6ÜF˜t&«W"“s∞¢2Êfñ∆≈&V7BÇ”2¬”3“'"¬"„"¬"„"ì≤2Êfñ∆≈&V7BÉ¬”3“'"¬"„"¬"„"ì≤2Á6ÜF˜t&«W"“∞¢2Êfñ∆≈7Gñ∆R“r6SÜS3Çs≤ÚÚFÜR67&ˆ∆¿¢2Êfñ∆≈&V7BÇ”í¬”Ç“'"¢„R¬Ç¬bì∞¢2Êfñ∆≈7Gñ∆R“r63Ü#Éìs≤2Êfñ∆≈&V7BÇ”¬”í“'"¢„R¬2¬Çì≤2Êfñ∆≈&V7BÉÇ¬”í“'"¢„R¬2¬Çì∞¢&WGW&‚G'VS∞¢–¢66RwF6Çs¢≤ÚÚFÜRFñÊ∂W"ˆbFVF«W2(	B∆VFÜW"&ˆ‚¬'&ˆÁ¶RvñÊp¢6ˆÁ7B62“÷FÇÁ6ñ‚áF‚¢rí¢„C≤ÚÚÜ÷÷W"F0¢2Êfñ∆≈7Gñ∆R“r3Üs#CÇs≤ÚÚFÜRÜ∆b÷'Vñ«BvñÊp¢f˜"Ü∆WB≤“≤≤¬3≤≤≤≤í∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÇ”B“≤¢2¬”“≤¢R¬r“≤¬"„b¬”„R¬¬rì≤2Êfñ∆¬Çì∞¢–¢&ˆ&RÉ¬#¬#"≤'"¬r6ÉÉc"r¬ÁV∆¬ì∞¢2Êfñ∆≈7Gñ∆R“r3fSV6s≤2Êfñ∆≈&V7BÇ”Ç¬”#“'"¬b¬Bì≤ÚÚ&ˆ‡¢ÜVBÉ¬”#b“'"¬b„Rì∞¢2Êfñ∆≈7Gñ∆R“r3F6##Çs≤2Ê&VvñÂFÇÇì≤2Ê&2É¬”#í“'"¬R¬÷FÇÂí¬ì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r3&&3s≤2Êfñ∆≈&V7BÉ„R¬”#r“'"¬"¬"ì≤2Êfñ∆≈&V7BÉB„R¬”#r“'"¬"¬"ì∞¢2Á7G&ˆ∂U7Gñ∆R“r3V3S3Cbs≤2Ê∆ñÊUvñGFÇ“"„#≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉí¬”bì≤2Ê∆ñÊUFÚÉR¬”#"“62ì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r3ÜÜVs≤2Êfñ∆≈&V7BÉ2¬”#b“62¬b¬Bì≤ÚÚÜ÷÷W"ÜV@¢&WGW&‚G'VS∞¢–¢66Rv∂W&bs¢≤ÚÚFÜR∆7BFV∆6ÜñÊR(	BFÜR6÷óFá2vÜÚ7WBFÜRvˆG2rvVˆÁ0¢ÚÚ4ÑRd4U2ÑU"tı$≤¬ÊBÜW"v˜&≤f6W2FÜR∆ñW"‚G&tÜW&ÙÂ2ó0¢ÚÚ6∆∆VB«&VGíf∆óVBF˜v&BFÜR6B¬6Ú∑Çó2FÜRví6ÜRó0¢ÚÚ∆ˆˆ∂ñÊs¢FÜR&∆ˆ6≤vˆW2FÜW&R‚FÜRfó'7B72WBóB&VÜñÊBÜW"∆Vg@¢ÚÚ6Ü˜V∆FW"¬vÜñ6ÇG&Wr6÷óFÇÜ÷÷W&ñÊr˜fW"ÜW"˜v‚&6≤‡¢6ˆÁ7B62“÷FÇÊ'2Ñ÷FÇÁ6ñ‚áF‚¢2„"íí¢2„C≤ÚÚFÜRÜ÷÷W"6ˆ÷ñÊrF˜v‡¢ÚÚFÜR&∆ˆ6≤6ÜRó2v˜&∂ñÊr¬&VFFVBˆ‚FÜRw&˜VÊB6∆V"ˆbÜW"6∂ó'G0¢2Êfñ∆≈7Gñ∆R“r3f#csVRs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉb¬ì≤2ÁVG&Fñ47W'fUFÚÉB¬”"¬#"¬”B„Rì∞¢2ÁVG&Fñ47W'fUFÚÉ3¬”R¬#í¬ì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r63ñ3F#Bs≤ÚÚFÜR7WBf6R¬∆P¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉí¬”íì≤2ÁVG&Fñ47W'fUFÚÉ#2¬”2„R¬#r¬”Ç„Rì∞¢2ÁVG&Fñ47W'fUFÚÉ#2¬”b„R¬í¬”íì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÚÚ7VBÊBvñFS¢FÜRFV∆6ÜñÊW2vW&R6V◊6÷óFá2¬∆˜r˜fW"FÜVó"v˜&∞¢&ˆ&RÉ¬#R¬#≤'"¬r3VSVS"r¬r3CSC#6"rì∞¢2Êfñ∆≈7Gñ∆R“r3vfFRs≤ÚÚFÜR7FˆÊR&ˆ‡¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”Ç¬”b“'"ì≤2Ê∆ñÊUFÚÉí¬”b“'"ì∞¢2ÁVG&Fñ47W'fUFÚÉÇ¬”R¬¬”Bì≤2ÁVG&Fñ47W'fUFÚÇ”r¬”R¬”Ç¬”b“'"ì∞¢2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢ÜVBÉ"¬”#R“'"¬b„Ç¬r63ÜÉÉ"rì∞¢ÚÚ‰ÚT"¬‰B‰ıDÑî‰r$U4îDRïB‚&˜VÊBÜVB÷6∆˜FÇV∆∆VBf∆B7&˜70¢ÚÚFÜRFV◊∆W2(	B∆˜r&ÊB˜fW"FÜR7&˜v‚¬ÊWfW"ÜˆˆB˜fW"FÜRf6S†¢ÚÚ6ÜRv2&˜&‚vóFÜ˜WBÜV&ñÊr¬FÜBFVfÊW72ó2FÜRˆÊ«í&V6ˆ‚FÜP¢ÚÚ6ñÊvW'2ÊWfW"Fˆˆ≤ÜW"¬ÊBFÜR6ñ∆Ü˜VWGFRÜ2FÚ6íóBvÜñ∆RFÜP¢ÚÚf6R7Fó2f6R‡¢2Êfñ∆≈7Gñ∆R“r3ÜcÉÉÉs∞¢2Ê&VvñÂFÇÇì≤2Ê&2É"¬”#b“'"¬r„"¬÷FÇÂí¢„ìÇ¬÷FÇÂí¢„"ì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈&V7BÇ”R¬”#r„b“'"¬B„B¬2„Bì∞¢2Êfñ∆≈7Gñ∆R“r3&&3s∞¢2Êfñ∆≈&V7BÉ2„B¬”#B„b“'"¬"¬"ì≤2Êfñ∆≈&V7BÉr¬”#B„b“'"¬"¬"ì∞¢ÚÚ““““FÜRv˜&≤¬&˜FÇÜÊG2¬∂WB6∆V"ˆbÜW"f6S¢FÜR6Üó6V¬ÜV∆BF¢ÚÚFÜR&∆ˆ6≤ÊBFÜRÜ÷÷W"7vñÊvñÊrF˜v‚ˆÁFÚó@¢2Á7G&ˆ∂U7Gñ∆R“r3V3S3Cbs≤2Ê∆ñÊUvñGFÇ“"„C≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉr¬”Bì≤2ÁVG&Fñ47W'fUFÚÉ2¬”2¬r¬”ì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“r3ÜÜVs≤2Ê∆ñÊUvñGFÇ“„É≤ÚÚFÜR6Üó6V¬óG6V∆`¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉr„R¬”ì≤2Ê∆ñÊUFÚÉ#¬”Ç„Rì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“r3V3S3Cbs≤2Ê∆ñÊUvñGFÇ“"„c≤ÚÚFÜRÜ÷÷W"&–¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉB¬”bì≤2ÁVG&Fñ47W'fUFÚÉ¬”r“62¬R¬”R“62ì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r3ÜÜVs∞¢2Ê&VvñÂFÇÇì≤2ÊV∆∆ó6RÉr„R¬”R“62¬2„b¬"„R¬„2¬¬rì≤2Êfñ∆¬Çì∞¢ÚÚ6Üó2ˆfbFÜR7WB¬BFÜR÷ˆ÷VÁBˆbFÜR&∆˜p¢ñbá62¬„bí∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#C√#3b√##"√„sRís≤2Ê∆ñÊUvñGFÇ“∞¢f˜"Ü∆WB≤“≤≤¬3≤≤≤≤í∞¢6ˆÁ7B"“”„≤≤¢„C#∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÉ#¬”íì∞¢2Ê∆ñÊUFÚÉ#≤÷FÇÊ6˜2Ü"í¢b„R¬”í≤÷FÇÁ6ñ‚Ü"í¢b„Rì≤2Á7G&ˆ∂RÇì∞¢–¢–¢&WGW&‚G'VS∞¢–¢ÚÚv«V÷V‚ráFÜR∆˜7BÁñ◊Çí∂VW2FÜR6Ü&VB∆Vb◊7&óFR(	B6ÜR«&VGê¢ÚÚ&VG22vˆˆB7ó&óBñ‚&˜FÇv˜&∆G2‡¢–¢&WGW&‚f«6S∞ß–¢ÚÚ““““˜'G&óB7ó7FV”¢cL9scBFñ∆ˆwVR'W7BvóFÇ&V¬f6R7FñÊr“““““““–¢ÚÚWá&W76ñˆÁ2&ñFRˆ‚FÜRFá&VRFÜñÊw2FÜB&VBBFÜó26ó¶S¢FÜRfó6˜"w0¢ÚÚ∆ñváB¬FÜR6WBˆbFÜRV'2¬ÊBFÜRFñ«BˆbFÜRÜVB‡¶gVÊ7Fñˆ‚G&u˜'G&óBÜ2¬Ç¬í¬Wá"¬&&Rí∞¢ÚÚ&&S¢ÊÚFñ∆ˆrg&÷R˜"6∆ó(	BFÜR6ˆ÷ñ2ñÁG&ÚW6W2FÜR'W7B&p¢6ˆÁ7BF‚“W&f˜&÷Ê6RÊÊ˜rÇíÚ∞¢6ˆÁ7BÜW&Ú“GóVˆbó4ÜW&Ú””“vgVÊ7Fñˆ‚rbbó4ÜW&ÚÇì∞¢6ˆÁ7B&∆ñÊ≤“áF‚R2„Bí¬„ì≤ÚÚ&ÊFˆ“÷fVV∆ñÊr&∆ñÊ∞¢6ˆÁ7BR“∞¢ÊWWG&√¢≤V$√¢”„Ç¬V%#¢„Ç¬v∆˜s¢„ÉR¬Fñ«C¢“¿¢FWFW&÷ñÊVC¢≤V$√¢”„SR¬V%#¢„SR¬v∆˜s¢„ÉR≤÷FÇÁ6ñ‚áF‚¢bí¢„R¬Fñ«C¢”„B“¿¢áW'C¢≤V$√¢”„R¬V%#¢„ÉR¬v∆˜s¢„B≤Ñ÷FÇÁ6ñ‚áF‚¢2í‚„BÚ„3R¢í¬Fñ«C¢„Ç“¿¢7W&ñ˜W3¢≤V$√¢”„3B¬V%#¢„#Ç¬v∆˜s¢„sR¬Fñ«C¢”„í“¿¢6C¢≤V$√¢„SR¬V%#¢„sR¬v∆˜s¢„B¬Fñ«C¢„"“¿¢Êw'ì¢≤V$√¢”„í¬V%#¢„í¬v∆˜s¢„b≤Ñ÷FÇÁ6ñ‚áF‚¢#"í‚Ú„B¢í¬Fñ«C¢”„b“¿¢’∂Wá%“«¬≤V$√¢”„Ç¬V%#¢„Ç¬v∆˜s¢„ÉR¬Fñ«C¢”∞¢2Á6fRÇì∞¢ñbÇ&&Rí∞¢ÚÚg&÷P¢2Êfñ∆≈7Gñ∆R“w&v&É√Ç√#Ç√„ì"ís≤2Á7G&ˆ∂U7Gñ∆R“w&v&ÉSR√#SR√#Ç√„CRís≤2Ê∆ñÊUvñGFÇ“„S∞¢'"Ü2¬Ç¬í¬cB¬cB¬Çì≤2Êfñ∆¬Çì≤'"Ü2¬Ç¬í¬cB¬cB¬Çì≤2Á7G&ˆ∂RÇì∞¢2Ê&VvñÂFÇÇì≤'"Ü2¬Ç≤¬í≤¬c"¬c"¬rì≤2Ê6∆óÇì∞¢–¢2ÁG&Á6∆FRáÇ≤3"¬í≤Cì≤2Á&˜FFRÑRÁFñ«Bì∞¢ñbÜÜW&Úí∞¢ÚÚ'&ˆÁ¶R÷ÜV∆“'W7Bf˜"FÜRˆGó76WíFÜV÷P¢6ˆÁ7BÜvB“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬”3¬¬"ì∞¢ÜvBÊFD6ˆ∆˜%7F˜É¬r6cFSf3Çrì≤ÜvBÊFD6ˆ∆˜%7F˜É„R¬r6S&6frì≤ÜvBÊFD6ˆ∆˜%7F˜É¬r6ÉÉìV2rì∞¢2Êfñ∆≈7Gñ∆R“ÜvC≤'"Ü2¬”#¬”#b¬C¬C¬"ì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r6#Éì3F2s≤2Ê&VvñÂFÇÇì≤2Ê&2É¬”B¬#2¬÷FÇÂí¬ì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈&V7BÇ”#2¬”b¬Cb¬bì∞¢2Á7G&ˆ∂U7Gñ∆R“r6SCÉFbs≤2Ê∆ñÊUvñGFÇ“É≤2Ê∆ñÊT6“w&˜VÊBs∞¢2Ê&VvñÂFÇÇì≤2Ê&2Ç”"¬”Ç¬#b¬÷FÇÂí¢„R¬÷FÇÂí¢„ÉRì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“r3&Ss≤'"Ü2¬”B¬”Ç¬#Ç¬¬Bì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“&∆ñÊ≤Úr3fV6r¢r6ffCsfs∞¢2Á6ÜF˜t6ˆ∆˜"“r6ffCsfs≤2Á6ÜF˜t&«W"“É∞¢2Êfñ∆≈&V7BÇ”¬”b¬r¬bì≤2Êfñ∆≈&V7BÉ2¬”b¬r¬bì≤2Á6ÜF˜t&«W"“∞¢“V«6R∞¢ÚÚV'26''íFÜRV÷˜Fñˆ‚(	B&˜FFRBFÜR&6RW"Wá&W76ñˆ‡¢f˜"Ü6ˆÁ7B2ˆb≤”¬“í∞¢2Á6fRÇì≤2ÁG&Á6∆FRá2¢R¬”#"ì≤2Á&˜FFRá2‚ÚRÊV%"¢RÊV$¬ì∞¢2Êfñ∆≈7Gñ∆R“r6FfSfcs∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”r¬"ì≤2Ê∆ñÊUFÚÉ¬”Çì≤2Ê∆ñÊUFÚÉÇ¬2ì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉSR√#SR√#Ç√„Rís∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”2¬ì≤2Ê∆ñÊUFÚÉ¬”ì≤2Ê∆ñÊUFÚÉB¬ì≤2Ê6∆˜6UFÇÇì≤2Êfñ∆¬Çì∞¢2Á&W7F˜&RÇì∞¢–¢ÚÚ6W&÷ñ2Fˆ÷P¢6ˆÁ7BÜvB“2Ê7&VFT∆ñÊV$w&FñVÁBÉ¬”3¬¬Bì∞¢ÜvBÊFD6ˆ∆˜%7F˜É¬r6fffffbrì≤ÜvBÊFD6ˆ∆˜%7F˜É„CR¬r6VVc6frì≤ÜvBÊFD6ˆ∆˜%7F˜É¬r3ñF&Brì∞¢2Êfñ∆≈7Gñ∆R“ÜvC≤'"Ü2¬”#"¬”#b¬CB¬C"¬Bì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“r3vCÜñ2s≤2Ê∆ñÊUvñGFÇ“„#≤'"Ü2¬”#"¬”#b¬CB¬C"¬Bì≤2Á7G&ˆ∂RÇì∞¢2Êfñ∆≈7Gñ∆R“w&v&És√ÉÇ√√„#Rís≤'"Ü2¬”#"¬B¬CB¬"¬Çì≤2Êfñ∆¬Çì∞¢ÚÚfó6˜"(	BFÜRƒTB7G&óFÜBFˆW2FÜR7FñÊp¢2Êfñ∆≈7Gñ∆R“r3C#s≤'"Ü2¬”r¬”"¬3B¬2¬Rì≤2Êfñ∆¬Çì∞¢6ˆÁ7Br“&∆ñÊ≤Ú„R¢RÊv∆˜s∞¢2Êfñ∆≈7Gñ∆R“Wá"””“váW'BrÚw&v&É#SR√C√#¬r≤r≤rír¢w&v&ÉSR√#SR√#Ç¬r≤r≤rís∞¢2Á6ÜF˜t6ˆ∆˜"“r33vffCs≤2Á6ÜF˜t&«W"“ì∞¢6ˆÁ7BWñTÇ“Wá"””“w6Br«¬&∆ñÊ≤Ú2¢s∞¢2Êfñ∆≈&V7BÇ”2¬”í≤Ér“WñTÇíÚ"¬í¬WñTÇì≤2Êfñ∆≈&V7BÉB¬”í≤Ér“WñTÇíÚ"¬í¬WñTÇì∞¢2Á6ÜF˜t&«W"“∞¢ñbÜWá"””“v7W&ñ˜W2rí≤ÚÚ6∆˜r66‚7vVW ¢6ˆÁ7B≤“áF‚R„bíÚ„c∞¢2Êfñ∆≈7Gñ∆R“w&v&É#SR√#SR√#SR√„Çís∞¢2Êfñ∆≈&V7BÇ”b≤≤¢#í¬”¬"„R¬ì∞¢–¢ÚÚ◊Wß¶∆R6V“≤vÜó6∂W'0¢2Á7G&ˆ∂U7Gñ∆R“w&v&És√ÉR√R√„bís≤2Ê∆ñÊUvñGFÇ“∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÇ”B¬Çì≤2Ê∆ñÊUFÚÉB¬Çì≤2Á7G&ˆ∂RÇì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#√##√#C√„cRís∞¢2Ê&VvñÂFÇÇì∞¢2Ê÷˜fUFÚÉÇ¬"ì≤2Ê∆ñÊUFÚÉ#b¬ì≤2Ê÷˜fUFÚÉÇ¬bì≤2Ê∆ñÊUFÚÉ#b¬rì∞¢2Ê÷˜fUFÚÇ”Ç¬"ì≤2Ê∆ñÊUFÚÇ”#b¬ì≤2Ê÷˜fUFÚÇ”Ç¬bì≤2Ê∆ñÊUFÚÇ”#b¬rì∞¢2Á7G&ˆ∂RÇì∞¢ÚÚ66&b6ˆ∆∆"BFÜR¶p¢2Êfñ∆≈7Gñ∆R“r6SCÉFbs≤'"Ü2¬”#¬2¬C¬í¬Bì≤2Êfñ∆¬Çì∞¢2Êfñ∆≈7Gñ∆R“r6c3sCs≤'"Ü2¬”#¬Ç¬C¬B¬"ì≤2Êfñ∆¬Çì∞¢–¢2Á&W7F˜&RÇì∞ß–¶gVÊ7Fñˆ‚G&t7G&¬Çí∞¢ÚÚvóFÇBGF6ÜVBFÜó267&VV‚&V6ˆ÷W2FÜR6ˆÁG&ˆ∆∆W"÷¢WfW'í7Fñˆ‚¿¢ÚÚFÜR'WGFˆ‚óB6óG2ˆ‚¬ÊB∆ófRÜñvÜ∆ñváBˆbvÜFWfW"ñ˜R&R&W76ñÊr‡¢ñbÖBÊˆ‚í≤G&uD6frÇì≤&WGW&„≤–¢6ˆÁ7B∆ñÊW2“BÇv7F¬rì∞¢ÚÚDÑRƒï5Bu$Ur‰BDÑR$ıÇDîB‰ıB‚FÜó2v2fóÜVBScÉ3ìÊV¬vóFÄ¢ÚÚÜ&B÷6ˆFVB37Ç7FW2g&ˆ“ì”s¢fñÊRBÊñÊR∆ñÊW2¬ÊBWfW'í∆ñÊRFFV@¢ÚÚ6ñÊ6R(	BFÜR6ˆÊr¬&GFñÊr6Ü˜G2¬&Wó"¬ñÁFW&7B¬÷(	B&‚˜WBˆbFÜP¢ÚÚ&˜GFˆ“ˆbFÜRg&÷RÊB&ñÁFVBˆ‚F˜ˆbFÜRfˆ˜FW"‚Ê˜FÜñÊrÜW&Ró2¢ÚÚ6ˆÁ7FÁBÁí÷˜&S≤FÜRÊV¬ó26ó¶VBg&ˆ“FÜR6ˆÁFVÁBÊBFÜR6ˆÁFVÁBó0¢ÚÚfóGFVBFÚFÜRÊV¬¬6ÚFFñÊr∆ñÊR˜"G&Á6∆FñÊrñÁFÚ∆ÊwVvRvóFÄ¢ÚÚ∆ˆÊvW"ˆÊW26ÊÊ˜B'&V≤óBvñ‚‡¢6ˆÁ7B‚“∆ñÊW2Ê∆VÊwFÉ∞¢6ˆÁ7BÇ“#¬í“S"¬r“s#¬Ç“Csc≤ÚÚìcÉSCFW6ñv‚76P¢Fñ’ÊV¬ÖÇ¬í¬r¬Çì∞¢gGáBáBÇv7F≈˜FóF∆Rrí¬CÉ¬í≤C¬#Ç¬r6VVc6fr¬v6VÁFW"r¬r33vffCrì∞¢6ˆÁ7BF˜“í≤sB¬&˜B“í≤Ç“Cc≤ÚÚ&ÊB∆VgBf˜"FÜR∆ó7@¢6ˆÁ7B7FW“÷FÇÊ÷ñ‚É#Ç¬Ü&˜B“F˜íÚ‚ì∞¢6ˆÁ7B6ó¶R“÷FÇÊ÷ÇÉ¬÷FÇÊ÷ñ‚ÉR¬7FW¢„SBíì∞¢ÚÚUdU%íƒî‰Rï2≈$TEíD$ƒR$ır(	B$ßV◊(	B¢˜"76RÜvñ‚ñ‚ó.(
bí"ó0¢ÚÚ‚7Fñˆ‚ÊBóG2Wá∆ÊFñˆ‚¬ÊB6VÁG&ñÊrFÜRGvÚ2ˆÊR7G&ñÊró2vÜ@¢ÚÚ÷FRv∆¬ˆbFWáB˜WBˆb&VfW&VÊ6R6&B‚7∆óBˆ‚FÜRF6ÇÊB6WBó@¢ÚÚ2GvÚ6ˆ«V÷Á3¢7FñˆÁ2f«W6ÇvñÁ7BFÜRwWGFW"¬FWFñ«2f«W6Çvíg&ˆ–¢ÚÚóB¬6ÚFÜRWñRfñÊG2FÜR÷˜fRfó'7BÊB&VG2FÜRFWFñ¬ˆÊ«íñbóBvÁG0¢ÚÚóB‚∆ñÊRvóFÇÊÚF6Çó2‚6ñFRÊB7Fó26VÁG&VBÊBFñ÷÷W"‡¢6ˆÁ7B'F¬“ƒ‰r””“v"s∞¢6ˆÁ7BwWD¬“'F¬ÚS¢Cc¬wWE"“'F¬ÚCÉB¢Cìc∞¢f˜"Ü∆WBí“≤í¬„≤í≤≤í∞¢6ˆÁ7Bí“F˜≤7FW¢Üí≤„Rì∞¢6ˆÁ7B7WB“7G&ñÊrÜ∆ñÊW5∂ï“íÊñÊFWÑˆbÇr(	Brì∞¢ÚÚ‚7Fñˆ‚Ê÷Ró26Ü˜'B‚$Áí7vñÊr∂Êˆ6∑2'V∆∆WG2˜WBˆbFÜRó"(	Bñ˜P¢ÚÚ6‚&B6Ü˜G2ví"ó26VÁFVÊ6RFÜBÜVÁ2FÚ6ˆÁFñ‚F6Ç¬Ê@¢ÚÚ6WGFñÊróG2fó'7BÜ∆b26ˆ«V÷‚ÜVFñÊró2v˜'6RFÜ‚Ê˜B7∆óGFñÊp¢ÚÚB∆¬¬6Ú∆VÊwFÇFV6ñFW2&FÜW"FÜ‚VÊ7GVFñˆ‚∆ˆÊR‡¢ñbÜ7WB¬«¬7WB‚Çí∞¢gGáBÜ∆ñÊW5∂ï“¬CÉ¬í¬6ó¶R¢„ì"¬r3ì6ñ&Br¬v6VÁFW"r¬ÁV∆¬¬scrì∞¢6ˆÁFñÁVS∞¢–¢gGáBÜ∆ñÊW5∂ï“Á6∆ñ6RÉ¬7WBí¬wWD¬¬í¬6ó¶R¬r6Ffc6fbr¿¢'F¬Úv∆VgBr¢w&ñváBr¬ÁV∆¬¬ssrì∞¢gGáBÜ∆ñÊW5∂ï“Á6∆ñ6RÜ7WB≤2í¬wWE"¬í¬6ó¶R¬r6Ü&fCr¿¢'F¬Úw&ñváBr¢v∆VgBr¬ÁV∆¬¬sSrì∞¢–¢ÚÚÊBvÜV‚FÜW&Ró2ÊÚB¬6ívÜBv27GV∆«í∆ˆˆ∂VBf˜"(	B&6ˆÊÊV7B¢ÚÚ6ˆÁG&ˆ∆∆W""ó2W6V∆W72Gfñ6RFÚ6ˆ÷V&ˆGívÜÚÜ26ˆÊÊV7FVBˆÊP¢6ˆÁ7BFñr“GóVˆbDFñr””“vgVÊ7Fñˆ‚rÚDFñrÇí¢rs∞¢gGáBÜFñr«¬BÇv7F≈ˆÊ˜Brí¬CÉ¬í≤Ç“3¬"¬FñrÚr3ÜvVRr¢r3ccsÉÜrì∞¢gGáBáBÇv&6≤rí≤r(	BW62ÚVÁFW"r¬CÉ¬í≤Ç“"¬2¬r3vCì6Çrì∞ß–¶gVÊ7Fñˆ‚G&uD6frÇí∞¢Fñ’ÊV¬Éìb¬C"¬scÇ¬CcBì∞¢gGáBáBÇwE˜FóF∆Rrí¬CÉ¬sÇ¬#b¬r6VVc6fr¬v6VÁFW"r¬r33vffCrì∞¢6ˆÁ7BÊ““BÊñBÚÖBÊñBÊ∆VÊwFÇ‚S"ÚBÊñBÁ6∆ñ6RÉ¬S"í≤~(
br¢BÊñBí¢BÇwEˆvVÊW&ñ2rì∞¢gGáBÇ~)xÚr≤Ê“¬CÉ¬B¬"¬r3ÜfCÜ3Çrì∞¢6ˆÁ7B‚“EÙ5DîÙÂ2Ê∆VÊwFÇ¬6ˆƒÇ“÷FÇÊ6Vñ¬Ü‚Ú"ì∞¢f˜"Ü∆WBí“≤í¬„≤í≤≤í∞¢6ˆÁ7B“EÙ5DîÙÂ5∂ï”∞¢6ˆÁ7B6ˆ¬“í¬6ˆƒÇÚ¢¬&˜r“íR6ˆƒÉ∞¢6ˆÁ7BÇ“C≤6ˆ¬¢3s"¬í“C"≤&˜r¢3C≤ÚÚR&˜w2Ê˜rÖ%T‚¶ˆñÊVBì¢3BÇóF6Ç∂VW2&˜rÇ6∆V"ˆbFÜRfˆ˜FW"FWá@¢6ˆÁ7B6V¬“í””“rÁDñGÉ∞¢6ˆÁ7B'F‚“BÊ÷∂”∞¢6ˆÁ7B∆ófR“'F‚„“bbBÊF˜vÂ∂'FÂ”∞¢ñbá6V¬í∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉSR√#SR√#Ç√„ís≤'"Ü2¬Ç“b¬í“R¬3CB¬3¬Çì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“r33vffCs≤2Ê∆ñÊUvñGFÇ“„c≤'"Ü2¬Ç“b¬í“R¬3CB¬3¬Çì≤2Á7G&ˆ∂RÇì∞¢–¢gGáBáBÇwÚr≤í¬Ç¬í¬R¬6V¬Úr6VVc6fr¢r3ñf#Ü3Çr¬v∆VgBrì∞¢6ˆÁ7B'Ç“Ç≤#Cb¬∆ó7FVÊñÊr“BÊ∆ó7FV‚””“∞¢2Êfñ∆≈7Gñ∆R“∆ó7FVÊñÊrÚw&v&É#SR√#R√b√„#"ír¢∆ófRÚw&v&ÉSR√#SR√#Ç√„3ír¢w&v&É#√3"√CB√„íís∞¢'"Ü2¬'Ç¬í“2¬ÉÇ¬#b¬rì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“∆ó7FVÊñÊrÚr6ffCsfr¢∆ófRÚr33vffCr¢w&v&É#√S√s√„Rís∞¢2Ê∆ñÊUvñGFÇ“∆ófR«¬∆ó7FVÊñÊrÚ"¢„#≤'"Ü2¬'Ç¬í“2¬ÉÇ¬#b¬rì≤2Á7G&ˆ∂RÇì∞¢gGáBÜ∆ó7FVÊñÊrÚBÇwE˜&W72rí¢D∆&V¬Ü'F‚í¬'Ç≤CB¬í¬∆ó7FVÊñÊrÚ"¢B¿¢∆ó7FVÊñÊrÚr6ffCsfr¢∆ófRÚr6Vffcír¢r66fS6Vbrì∞¢–¢gGáBáBÇwEˆ÷˜fRrí¬CÉ¬C"¬"¬r3Ü&#Rrì∞¢ÚÚ$ır4Ñıtî‰r.(	B"Ñ2DÚ4ítÑBDÚDÚîÂ5DTB‚WfW'í&V¬'WGFˆ‚ˆ‚¢ÚÚBó27ˆ∂V‚f˜"¬6ÚFÜRÊWW&¬G&VRÊBFÜR7&W7G2ÜfRÊˆÊR(	BÊB¢ÚÚF6ÇvóFÇÊÚWá∆ÊFñˆ‚ó2Ü˜r∆ñW"6ˆÊ6«VFW2FÜR67&VV‚ó26ñ◊«ê¢ÚÚVÁ&V6Ü&∆R¬vÜñ6Çó2WÜ7F«ívÜBÜVÊVB‡¢gGáBáBÇwEˆÊˆÊRríÁ&W∆6RÇrW2r¬D∆&V¬ÖBÊ÷ÂU4Ríí¬CÉ¬C3¬"¬r6#CÜ6fbrì∞¢gGáBáBÇwEˆÜñÁBrí¬CÉ¬CSB¬2¬r66fS6Vbrì∞¢gGáBáBÇwE˜&W6WBrí¬CÉ¬Csb¬"¬r3vCì6Çrì∞ß–¶6ˆÁ7B÷ñÊî66ÜR“∑”∞¶gVÊ7Fñˆ‚&ˆˆ‘÷ñÊíÜñBí∞¢ñbÜ÷ñÊî66ÜU∂ñE“í&WGW&‚÷ñÊî66ÜU∂ñE”∞¢6ˆÁ7BFVb“$ÙÙ’5∂ñE“¬r“'Vñ∆E&ˆˆ“ÜñBí¬“≈∂FVbÁ¶ˆÊU“¬2“#∞¢6ˆÁ7B÷2“Fˆ7V÷VÁBÊ7&VFTV∆V÷VÁBÇv6Áf2rì∞¢÷2ÁvñGFÇ“FVbÁr¢3≤÷2ÊÜVñváB“FVbÊÇ¢3∞¢6ˆÁ7B““÷2ÊvWD6ˆÁFWáBÇs&Brì∞¢“Êv∆ˆ&ƒ«Ü“„CS≤“Êfñ∆≈7Gñ∆R“ÊF&≥≤“Êfñ∆≈&V7BÉ¬¬÷2ÁvñGFÇ¬÷2ÊÜVñváBì∞¢“Êv∆ˆ&ƒ«Ü“∞¢f˜"Ü∆WBí“≤í¬FVbÊÉ≤í≤≤íf˜"Ü∆WBÇ“≤Ç¬FVbÁs≤Ç≤≤í∞¢6ˆÁ7B6Ç“u∑ï’∑Ö”∞¢ñbÜ6Ç””“r2r«¬6Ç””“t"rí≤“Êfñ∆≈7Gñ∆R“ÊVFvS≤“Êv∆ˆ&ƒ«Ü“„ÉS≤“Êfñ∆≈&V7BáÇ¢2¬í¢2¬2¬2ì≤–¢V«6RñbÜ6Ç””“s“rí≤“Êfñ∆≈7Gñ∆R“ÊVFvS≤“Êv∆ˆ&ƒ«Ü“„c≤“Êfñ∆≈&V7BáÇ¢2¬í¢2¬2¬ì≤–¢V«6RñbÜ6Ç””“u‚rí≤“Êfñ∆≈7Gñ∆R“r6fcfvs≤“Êv∆ˆ&ƒ«Ü“„ì≤“Êfñ∆≈&V7BáÇ¢2¬í¢2≤¬2¬ì≤–¢“Êv∆ˆ&ƒ«Ü“∞¢–¢÷ñÊî66ÜU∂ñE““÷3∞¢&WGW&‚÷3∞ß–¶6ˆÁ7B‘Ù$ı55$ÙÙ““≤C¢tv∆óF6Çr¬#C¢t'&ˆˆBr¬33¢tF∆2r¬C3¢u¶W&Úr¬É¢u&ó6“r¬S3¢t÷˜FÜW"r”∞¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚDÑR‘‚fóÜVBw&ñB7VVW¶VBñÁFÚˆÊR67&VV‚FV∆«2ñ˜RvÜW&RFÜR&ˆˆ◊2&P¢ÚÚ'WBÊWfW"∆WG2ñ˜R∆ˆˆ≤BˆÊR‚FÜó2ó2&V¬6Ü'Bñ˜R6‚G&ófS¢óB˜VÁ0¢ÚÚg&÷VBˆ‚FÜR&ˆˆ“ñ˜R&R7FÊFñÊrñ‚¬ÊBg&ˆ“FÜW&Rñ˜R6‚W6Çñ‚f ¢ÚÚVÊ˜VvÇFÚ&VB&ˆˆ“w27GV¬FW'&ñ‚¬˜"V∆¬&6≤FÚ6VRFÜRvÜˆ∆Rf7F˜'ê¢ÚÚBˆÊ6R‚vÜVV¬˜"ñÊ6ÇFÚ¶ˆˆ“¬G&r˜"7FVW"FÚ‚¬ÊBˆÊR∂WíWG2FÜP¢ÚÚvÜˆ∆RFÜñÊr&6≤ˆ‚67&VV‚‡¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¶6ˆÁ7B‘ı§‘î‚“„SR¬‘ı§‘Ç“B„#∞¶6ˆÁ7B÷fñWr“≤£¢¬É¢¬ì¢¬&VGì¢f«6R¬G&s¢ÁV∆¬¬ñÊ6É¢”∞¶gVÊ7Fñˆ‚÷6ˆÁFVÁD&˜ÇÇí∞¢∆WBÉ“Sí¬ì“Sí¬É“”Sí¬ì“”Sì∞¢f˜"Ü6ˆÁ7BñBñ‚‘ı2í∞¢6ˆÁ7B∂wÇ¬wí¬r¬Ö““‘ı5∂ñE”∞¢ñbÜwÇ¬ÉíÉ“wÉ≤ñbÜwí¬ìíì“wì∞¢ñbÜwÇ≤r‚ÉíÉ“wÇ≤s≤ñbÜwí≤Ç‚ìíì“wí≤É∞¢–¢&WGW&‚≤É¬ì¬É¬ì”∞ß–¢ÚÚg&÷RWfW'óFÜñÊr¬6Ú'vÜW&R“íñ‚∆¬FÜó2"ó2«vó2ˆÊR&W72vê¶gVÊ7Fñˆ‚÷fóBÇí∞¢6ˆÁ7B"“÷6ˆÁFVÁD&˜ÇÇí¬6V∆¬“c#∞¢6ˆÁ7Br“Ü"ÁÉ“"ÁÉí¢6V∆¬¬Ç“Ü"Áì“"Áìí¢6V∆√∞¢÷fñWrÁ¢“6∆◊Ñ÷FÇÊ÷ñ‚ÉÉcÚ÷FÇÊ÷ÇÉ¬rí¬CÚ÷FÇÊ÷ÇÉ¬Çíí¬‘ı§‘î‚¬‘ı§‘Çì∞¢÷fñWrÁÇ“CÉ“Ü"ÁÉ¢6V∆¬≤rÚ"í¢÷fñWrÁ£∞¢÷fñWrÁí“#ì"“Ü"Áì¢6V∆¬≤ÇÚ"í¢÷fñWrÁ£∞ß–¢ÚÚ˜V‚6VÁG&VBˆ‚vÜW&R6ÜRó27GV∆«í7FÊFñÊp¶gVÊ7Fñˆ‚÷6VÁFW$ˆÂ&ˆˆ“ÜñBí∞¢6ˆÁ7B˜2“‘ı5∂ñE”≤ñbÇ˜2í&WGW&‚÷fóBÇì∞¢6ˆÁ7B6V∆¬“c#∞¢÷fñWrÁÇ“CÉ“á˜5≥“≤˜5≥%“Ú"í¢6V∆¬¢÷fñWrÁ£∞¢÷fñWrÁí“#ì"“á˜5≥“≤˜5≥5“Ú"í¢6V∆¬¢÷fñWrÁ£∞ß–¶gVÊ7Fñˆ‚÷¶ˆˆ‘Bá7Ç¬7í¬bí∞¢6ˆÁ7BÁ¢“6∆◊Ü÷fñWrÁ¢¢b¬‘ı§‘î‚¬‘ı§‘Çì∞¢6ˆÁ7B≤“Á¢Ú÷fñWrÁ£∞¢ÚÚ∂VWvÜFWfW"ó2VÊFW"FÜR7W'6˜"˜"FÜRñÊ6Ç6VÁG&RñÊÊVBñ‚∆6P¢÷fñWrÁÇ“7Ç“á7Ç“÷fñWrÁÇí¢≥∞¢÷fñWrÁí“7í“á7í“÷fñWrÁíí¢≥∞¢÷fñWrÁ¢“Á£∞ß–¶gVÊ7Fñˆ‚÷˜V‚Çí∞¢÷fñWrÁ¢“„3S≤÷fñWrÁ&VGí“G'VS≤÷fñWrÊG&r“ÁV∆√∞¢÷6VÁFW$ˆÂ&ˆˆ“ÑrÁ&ˆˆ‘ñBì∞ß–¶gVÊ7Fñˆ‚WFFT÷ÜGBí∞¢ñbÇ÷fñWrÁ&VGíí÷˜V‚Çì∞¢ÚÚ7FVW&ñÊs¢7Fñ6≤¬'&˜w2˜"t4BW6ÇFÜR6Ü'B&˜VÊ@¢6ˆÁ7B7“c#¢GC∞¢ñbÜñ‰BÇtƒTeBríí÷fñWrÁÇ≥“7∞¢ñbÜñ‰BÇu$îtÖBríí÷fñWrÁÇ”“7∞¢ñbÜñ‰BÇuUríí÷fñWrÁí≥“7∞¢ñbÜñ‰BÇtDıt‚ríí÷fñWrÁí”“7∞¢ñbÜñ‰BÇt•T’rí«¬ñ‰BÇtD4Çríí÷¶ˆˆ‘BÉCÉ¬#ì"¬≤„í¢GBì∞¢ñbÜñ‰BÇtD≤rí«¬ñ‰BÇt45Bríí÷¶ˆˆ‘BÉCÉ¬#ì"¬“„b¢GBì∞¢ñbÜñÂÇtîÂBríí÷fóBÇì∞¢ñbÜñÂÇt4ƒrríí≤÷fñWrÁ¢“„3S≤÷6VÁFW$ˆÂ&ˆˆ“ÑrÁ&ˆˆ‘ñBì≤–¢ÚÚÊWfW"∆WBFÜR6Ü'B&RG&ófV‚ˆfbñÁFÚV◊Gí76P¢6ˆÁ7B"“÷6ˆÁFVÁD&˜ÇÇí¬6V∆¬“c"¬““C#∞¢÷fñWrÁÇ“6∆◊Ü÷fñWrÁÇ¬ìc“““"ÁÉ¢6V∆¬¢÷fñWrÁ¢¬““"ÁÉ¢6V∆¬¢÷fñWrÁ¢ì∞¢÷fñWrÁí“6∆◊Ü÷fñWrÁí¬SC“““"Áì¢6V∆¬¢÷fñWrÁ¢¬““"Áì¢6V∆¬¢÷fñWrÁ¢ì∞ß–¢ÚÚvÜVV¬ˆ‚FW6∑F˜≤FÜRF˜V6Ç∆ñW"fVVG2G&rÊBñÊ6ÇFá&˜VvÇ÷ˆñÁFW"Çê¶FDWfVÁD∆ó7FVÊW"ÇwvÜVV¬r¬ÜRí”‚∞¢ñbáGóVˆbr””“wVÊFVfñÊVBr«¬rÁ7FFR”“t‘rí&WGW&„∞¢RÁ&WfVÁDFVfV«BÇì∞¢6ˆÁ7B"“áGóVˆb7b”“wVÊFVfñÊVBrbb7bbb7bÊvWD&˜VÊFñÊt6∆ñVÁE&V7BíÚ7bÊvWD&˜VÊFñÊt6∆ñVÁE&V7BÇí¢ÁV∆√∞¢6ˆÁ7B7Ç“"ÚÜRÊ6∆ñVÁEÇ“"Ê∆VgBí¢ÉìcÚ"ÁvñGFÇí¢CÉ∞¢6ˆÁ7B7í“"ÚÜRÊ6∆ñVÁEí“"ÁF˜í¢ÉSCÚ"ÊÜVñváBí¢#ì#∞¢÷¶ˆˆ‘Bá7Ç¬7í¬RÊFV«Fí¬Ú„B¢Ú„Bì∞ß“¬≤76ófS¢f«6R“ì∞¢ÚÚ÷˜W6RG&rFÚ‚¬6ÚFÜR6Ü'Bv˜&∑2FÜRvíWfW'í˜FÜW"÷FˆW0¶FDWfVÁD∆ó7FVÊW"Çv÷˜W6VF˜v‚r¬ÜRí”‚∞¢ñbáGóVˆbr””“wVÊFVfñÊVBr«¬rÁ7FFR”“t‘rí&WGW&„∞¢6ˆÁ7B"“7bbb7bÊvWD&˜VÊFñÊt6∆ñVÁE&V7BÚ7bÊvWD&˜VÊFñÊt6∆ñVÁE&V7BÇí¢ÁV∆√∞¢ñbá"í∞¢6ˆÁ7B7Ç“ÜRÊ6∆ñVÁEÇ“"Ê∆VgBí¢ÉìcÚ"ÁvñGFÇí¬7í“ÜRÊ6∆ñVÁEí“"ÁF˜í¢ÉSCÚ"ÊÜVñváBì∞¢ñbÜ÷Fá7Ç¬7ííí&WGW&„≤ÚÚ6ˆÁG&ˆ¬¬Ê˜BFÜR6Ü'@¢–¢÷fñWrÊG&r“≤É¢RÊ6∆ñVÁEÇ¬ì¢RÊ6∆ñVÁEí”∞ß“ì∞¶FDWfVÁD∆ó7FVÊW"Çv÷˜W6V÷˜fRr¬ÜRí”‚∞¢ñbáGóVˆbr””“wVÊFVfñÊVBr«¬rÁ7FFR”“t‘r«¬÷fñWrÊG&rí&WGW&„∞¢6ˆÁ7B"“áGóVˆb7b”“wVÊFVfñÊVBrbb7bbb7bÊvWD&˜VÊFñÊt6∆ñVÁE&V7BíÚ7bÊvWD&˜VÊFñÊt6∆ñVÁE&V7BÇí¢ÁV∆√∞¢6ˆÁ7B≤“"ÚìcÚ"ÁvñGFÇ¢∞¢÷fñWrÁÇ≥“ÜRÊ6∆ñVÁEÇ“÷fñWrÊG&rÁÇí¢≥∞¢÷fñWrÁí≥“ÜRÊ6∆ñVÁEí“÷fñWrÊG&rÁíí¢≥∞¢÷fñWrÊG&r“≤É¢RÊ6∆ñVÁEÇ¬ì¢RÊ6∆ñVÁEí”∞ß“ì∞¶FDWfVÁD∆ó7FVÊW"Çv÷˜W6WWr¬Çí”‚≤÷fñWrÊG&r“ÁV∆√≤“ì∞†¶gVÊ7Fñˆ‚G&t÷Çí∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉB√r√"√„íís≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢ñbÇ÷fñWrÁ&VGíí÷˜V‚Çì∞¢gGáBáBÇv÷˜FóF∆Rrí¬CÉ¬C¬#b¬r6VVc6fr¬v6VÁFW"r¬r33vffCrì∞¢2Á6fRÇì∞¢ÚÚWfW'óFÜñÊr&V∆˜ró2G&v‚ñ‚6Ü'B76S≤FÜRfñWrG&Á6f˜&“FˆW2FÜR&W7@¢2Ê&VvñÂFÇÇì≤2Á&V7BÉ¬SÇ¬ìc¬CCì≤2Ê6∆óÇì∞¢2ÁG&Á6∆FRÜ÷fñWrÁÇ¬÷fñWrÁíì≤2Á66∆RÜ÷fñWrÁ¢¬÷fñWrÁ¢ì∞¢6ˆÁ7B6V∆¬“c"¬˜Ç“¬˜í“∞¢ÚÚDÑR‘ï2Ù‰RîT4RÙbu$ıT‰BÜ˜vÊW"¬##b”í”S¢'FÜR÷6Ü˜V∆@¢ÚÚ7GV∆«í6Ü˜rFÜRFW'&ñ‚‚‚‚6ˆÁFñÁV˜W2vóFÇ÷ñÊ˜"6W&Fñˆ‚FÜ@¢ÚÚFñffW&VÁFñFW2&ˆˆ◊2g&ˆ“V6Ç˜FÜW"¬&V6W6RFÜR6ˆÊ6WBó2óBw2‚˜V‡¢ÚÚv˜&∆BvÜW&Rñ˜R6‚÷˜fRg&ˆ“ˆÊR&ˆˆ“FÚÊ˜FÜW"‚óBw2Ê˜B6W&FVB'ê¢ÚÚv∆¬Áñ÷˜&R‚"ê¢Ú¢ÚÚóBW6VBFÚG&rV6Ç&ˆˆ“2g&÷VB6&B(	BñÁ6WB2Ç¬&˜VÊFVB¬FÜP¢ÚÚFW'&ñ‚∆WGFW&&˜ÜVBñÁ6ñFRóBvóFÇ&˜WFR∆ñÊR&WGvVV‚FÜR6&G2(	BvÜñ6Ä¢ÚÚó26Ü'Bˆb$ıÑU2¬ÊB&˜ÜW26í'6W&FR∆6W2"vÜFWfW"ó2ñÁFV@¢ÚÚñ‚FÜV“‚Ê˜rFÜR&ˆˆ◊2Fñ∆RVFvRFÚVFvR¬FÜRFW'&ñ‚ó27G&WF6ÜVBFÚfñ∆¿¢ÚÚóG26V∆«26Úf∆ˆ˜"B&˜rRˆbÇ÷VWG2FÜR6÷Rf∆ˆ˜"ÊWáBFˆ˜"¬Ê@¢ÚÚFÜRˆÊ«íFÜñÊr&WGvVV‚GvÚ&ˆˆ◊2ó2Üó&∆ñÊR6V“‚FÜR&˜WFR∆ñÊW27Fê¢ÚÚˆÊ«íf˜"FÜRó'2FÜBFÚ‰ıBF˜V6Çˆ‚FÜR&ˆ&B(	BFWFÇFˆ˜"ñÁFÚ¢ÚÚ6fRÊWGv˜&≤¬vFR(	B&V6W6RFÜW&RFÜR∆ñÊRó2FÜRñÊf˜&÷Fñˆ‚‡¢6ˆÁ7B&V7Df˜"“ñB”‚∞¢6ˆÁ7B∂wÇ¬wí¬r¬Ö““‘ı5∂ñE”∞¢&WGW&‚≤É¢˜Ç≤wÇ¢6V∆¬¬ì¢˜í≤wí¢6V∆¬¬s¢r¢6V∆¬¬É¢Ç¢6V∆¬”∞¢”∞¢6ˆÁ7BF˜V6ÜñÊr“Ü¬"í”‡¢Ñ÷FÇÊ'2ÜÁÇ≤Ár“"ÁÇí¬«¬÷FÇÊ'2Ü"ÁÇ≤"Ár“ÁÇí¬íbbÁí¬"Áí≤"ÊÇbb"Áí¬Áí≤ÊÄ¢«¬Ñ÷FÇÊ'2ÜÁí≤ÊÇ“"Áíí¬«¬÷FÇÊ'2Ü"Áí≤"ÊÇ“Áíí¬íbbÁÇ¬"ÁÇ≤"Árbb"ÁÇ¬ÁÇ≤Ás∞¢ÚÚFÜRw&˜VÊBfó'7B¬WfW'ífó6óFVB&ˆˆ“w2FW'&ñ‚fñ∆∆ñÊróG2˜v‚6V∆«0¢f˜"Ü6ˆÁ7BñBñ‚‘ı2í∞¢ñbÇrÁ6fRÁfó6óFVE∂ñE“í6ˆÁFñÁVS∞¢6ˆÁ7B&2“&V7Df˜"ÜñBì∞¢2Êfñ∆≈7Gñ∆R“r3bs≤2Êfñ∆≈&V7Bá&2ÁÇ¬&2Áí¬&2Ár¬&2ÊÇì∞¢6ˆÁ7B÷2“&ˆˆ‘÷ñÊíÜñBì∞¢2Êñ÷vU6÷ˆ˜FÜñÊtVÊ&∆VB“f«6S∞¢2ÊG&tñ÷vRÜ÷2¬&2ÁÇ¬&2Áí¬&2Ár¬&2ÊÇì∞¢2Êñ÷vU6÷ˆ˜FÜñÊtVÊ&∆VB“G'VS∞¢–¢ÚÚ&˜WFW2ˆÊ«ívÜW&RFÜR&ˆ&B∆VfW2v&WGvVV‚GvÚ6ˆÊÊV7FVB&ˆˆ◊0¢2Á7G&ˆ∂U7Gñ∆R“w&v&ÉC√#√#3√„3Rís≤2Ê∆ñÊUvñGFÇ“3∞¢f˜"Ü6ˆÁ7BñBñ‚‘ı2í∞¢ñbÇrÁ6fRÁfó6óFVE∂ñE“í6ˆÁFñÁVS∞¢6ˆÁ7BWÇ“$ÙÙ’5∂ñE“ÊWÜóG2«¬∑”∞¢f˜"Ü6ˆÁ7B6ñFRñ‚WÇí∞¢∆WBB“WÖ∑6ñFU”≤ñbáGóVˆbB””“vˆ&¶V7BríB“BÁFÛ∞¢ñbÇrÁ6fRÁfó6óFVE∂E“«¬B¬ñB«¬‘ı5∂E“í6ˆÁFñÁVS∞¢6ˆÁ7B“&V7Df˜"ÜñBí¬"“&V7Df˜"ÜBì∞¢ñbáF˜V6ÜñÊrÜ¬"íí6ˆÁFñÁVS∞¢2Ê&VvñÂFÇÇì≤2Ê÷˜fUFÚÜÁÇ≤ÁrÚ"¬Áí≤ÊÇÚ"ì≤2Ê∆ñÊUFÚÜ"ÁÇ≤"ÁrÚ"¬"Áí≤"ÊÇÚ"ì≤2Á7G&ˆ∂RÇì∞¢–¢–¢ÚÚFÜR6V◊2ÊBFÜR6ñvÁ0¢f˜"Ü6ˆÁ7BñBñ‚‘ı2í∞¢ñbÇrÁ6fRÁfó6óFVE∂ñE“í6ˆÁFñÁVS∞¢6ˆÁ7B“≈µ$ÙÙ’5∂ñE“Á¶ˆÊU“¬&2“&V7Df˜"ÜñBì∞¢6ˆÁ7B◊Ç“&2ÁÇ¬◊í“&2Áí¬◊r“&2Ár¬÷Ç“&2ÊÉ∞¢ÚÚÜó&∆ñÊRñ‚FÜR¶ˆÊRw2˜v‚VFvR6ˆ∆˜W#¢VÊ˜VvÇFÚ6˜VÁB&ˆˆ◊2'í¿¢ÚÚÊWfW"VÊ˜VvÇFÚ&VB2v∆¿¢2Á7G&ˆ∂U7Gñ∆R“ÊVFvS≤2Êv∆ˆ&ƒ«Ü“„CS≤2Ê∆ñÊUvñGFÇ“∞¢2Á7G&ˆ∂U&V7Bá&2ÁÇ≤„R¬&2Áí≤„R¬&2Ár“¬&2ÊÇ“ì∞¢2Êv∆ˆ&ƒ«Ü“∞¢ñbÑ$T‰4Öı$ÙÙ’2ÊñÊFWÑˆbÜñBí„“«¬Ö$ÙÙ’5∂ñE“Ê6fRbb$ÙÙ’5∂ñE“ÊVÁG2Á6ˆ÷RÜR”‚U≥“””“v&VÊ6Çrííê¢gGáBÇ~)xbr¬&2ÁÇ≤¬&2Áí≤¬¬r6VcvCÇrì∞¢ñbÜñB””“t2rígGáBÇ~)©ír¬&2ÁÇ≤¬&2Áí≤&2ÊÇ“¬¬r6ffCsfrì∞¢ÚÚDÑR4dR4ît‚Ü˜vÊW#¢'FÜR6fW2ˆ‚FÜR÷6Ü˜V∆BV"26fP¢ÚÚ6ñv‚‚‚‚FÜR7F'FñÊrˆb6WfW&¬6fW2ñ‚6WfW&¬∆ˆ6FñˆÁ2"ì¢FÜR&6Ä¢ÚÚ÷&∑2Áífó6óFVB&ˆˆ“vÜ˜6R&6∂G&˜Üˆ∆G2$UdTƒTBFWFÇFˆ˜"ñÁF¢ÚÚ6fR(	BFÜR÷˜WFÇó2vÜW&Rñ˜RvÚ¬6ÚFÜR÷˜WFÇó2vÜBFÜR÷÷&∑2‡¢∞¢ÚÚÂí&WfV∆VBFˆ˜"ñÁFÚ6fR÷&∑2FÜR&ˆˆ“(	BáV"vóFÇGvÚˆbFÜV–¢ÚÚó27Fñ∆¬ˆÊR&ˆˆ“vóFÇ÷˜WFÇñ‚ó@¢ñbÜvFTFˆ˜'2ÜñBíÁ6ˆ÷RÜvB”‚$ÙÙ’5∂vBÁFı“bb$ÙÙ’5∂vBÁFı“Ê6fRíê¢gGáBÇ~(äír¬&2ÁÇ≤&2Ár“¬&2Áí≤&2ÊÇ“¬2¬r6Ffc&fbrì∞¢–¢ñbÑ‘Ù$ı55$ÙÙ’∂ñE“í∞¢6ˆÁ7BFˆÊR“rÁ6fRÊf∆w5≤v&˜72r≤‘Ù$ı55$ÙÙ’∂ñE’”∞¢gGáBÜFˆÊRÚ~)…2r¢~)är¬&2ÁÇ≤&2Ár“¬&2Áí≤¬"¬FˆÊRÚr3vFSÜr¢r6fcfvrì∞¢–¢ñbÜñB””“rÁ&ˆˆ‘ñBbb∆ñW"í∞¢6ˆÁ7B&V«Ç“◊Ç≤á∆ñW"ÁÇÚÖ$ÙÙ’5∂ñE“Ár¢DîƒRíí¢◊s∞¢6ˆÁ7B&V«í“◊í≤á∆ñW"ÁíÚÖ$ÙÙ’5∂ñE“ÊÇ¢DîƒRíí¢÷É∞¢6ˆÁ7BR“„b≤÷FÇÁ6ñ‚áW&f˜&÷Ê6RÊÊ˜rÇíÚ#Sí¢„C∞¢2Êfñ∆≈7Gñ∆R“w&v&É#SR√#SR√#SR¬r≤R≤rís≤2Á6ÜF˜t6ˆ∆˜"“r6fffffbs≤2Á6ÜF˜t&«W"“É∞¢2Ê&VvñÂFÇÇì≤2Ê&2á&V«Ç¬&V«í¬2„R¬¬rì≤2Êfñ∆¬Çì≤2Á6ÜF˜t&«W"“∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#SR√#SR√#SR√„sRís≤2Ê∆ñÊUvñGFÇ“#∞¢2Á7G&ˆ∂U&V7Bá&2ÁÇ≤¬&2Áí≤¬&2Ár“"¬&2ÊÇ“"ì∞¢–¢–¢2Á&W7F˜&RÇì∞¢ÚÚ¶ˆˆ“&VF˜WBÊBFÜR6ˆÁG&ˆ«2¬ñ‚67&VV‚76R&˜fRFÜR6Ü'@¢6ˆÁ7B'FÁ2“÷'WGFˆÁ2Çì∞¢f˜"Ü6ˆÁ7B"ˆb'FÁ2í∞¢2Êfñ∆≈7Gñ∆R“w&v&É√Ç√#b√„ÉRís∞¢'"Ü2¬"ÁÇ“"Á"¬"Áí“"Á"¬"Á"¢"¬"Á"¢"¬Çì≤2Êfñ∆¬Çì∞¢2Á7G&ˆ∂U7Gñ∆R“w&v&É#√##√#SR√„Rís≤2Ê∆ñÊUvñGFÇ“„S∞¢'"Ü2¬"ÁÇ“"Á"¬"Áí“"Á"¬"Á"¢"¬"Á"¢"¬Çì≤2Á7G&ˆ∂RÇì∞¢gGáBÜ"Êñ6ˆ‚¬"ÁÇ¬"Áí¬"Êñ6ˆ‚Ê∆VÊwFÇ‚Ú"¢í¬r66fSÜfbr¬v6VÁFW"rì∞¢–¢gGáBÑ÷FÇÁ&˜VÊBÜ÷fñWrÁ¢¢í≤rRr¬ì¬ìb¬"¬r3vCì6Çr¬v6VÁFW"rì∞¢gGáBÇ~)xÚr≤BÇv÷ˆÜW&Rrí≤r)xbr≤BÇw&W7BríÁ&W∆6RÇtR(	Br¬rrí≤r)är≤BÇv÷ˆ&˜72rí≤r)©ír≤BÇv÷˜6Ü˜rí≤r(äír≤BÇv÷ˆ6fRrí¬CÉ¬S"¬2¬r3vCì6Çrì∞¢gGáBáBÇv÷ˆ7F¬rí¬CÉ¬S#"¬"¬r3VcsCÉÇrì∞ß–¢ÚÚFÜRFá&VRˆ‚◊67&VV‚6ˆÁG&ˆ«2¬6Ü&VB'íFÜR÷˜W6RÊBFÜRF˜V6Ç∆ñW ¶gVÊ7Fñˆ‚÷'WGFˆÁ2Çí∞¢&WGW&‚∞¢≤6ˆFS¢u§î‚r¬É¢ì¬ì¢3¬#¢í¬ñ6ˆ„¢~˚»≤r“¿¢≤6ˆFS¢u§ıUBr¬É¢ì¬ì¢sb¬#¢í¬ñ6ˆ„¢~˚»“r“¿¢≤6ˆFS¢u§dïBr¬É¢ì¬ì¢##"¬#¢í¬ñ6ˆ„¢~*J"r“¿¢≤6ˆFS¢u§‘Rr¬É¢ì¬ì¢#cÇ¬#¢í¬ñ6ˆ„¢~)xír“¿¢ÚÚ«vó2&V6Ü&∆R'íFáV÷#¢6Ü'Bñ˜R6ÊÊ˜B6∆˜6Ró2G& ¢≤6ˆFS¢u§$4≤r¬É¢CB¬ì¢3Ç¬#¢í¬ñ6ˆ„¢~)…Rr“¿¢”∞ß–¢ÚÚF˜"6∆ñ6≤ˆ‚ˆÊRˆbFÜV“¬ñ‚ìcÉSC67&VV‚6ˆ˜&FñÊFW0¶gVÊ7Fñˆ‚÷Fá7Ç¬7íí∞¢f˜"Ü6ˆÁ7B"ˆb÷'WGFˆÁ2Çíí∞¢ñbÑ÷FÇÊ'2á7Ç“"ÁÇí√“"Á"≤Çbb÷FÇÊ'2á7í“"Áíí√“"Á"≤Çí∞¢ñbÜ"Ê6ˆFR””“u§î‚rí÷¶ˆˆ‘BÉCÉ¬#ì"¬„2ì∞¢V«6RñbÜ"Ê6ˆFR””“u§ıUBrí÷¶ˆˆ‘BÉCÉ¬#ì"¬Ú„2ì∞¢V«6RñbÜ"Ê6ˆFR””“u§dïBrí÷fóBÇì∞¢V«6RñbÜ"Ê6ˆFR””“u§‘Rrí≤÷fñWrÁ¢“„c≤÷6VÁFW$ˆÂ&ˆˆ“ÑrÁ&ˆˆ‘ñBì≤–¢V«6R≤rÁ7FFR“uƒís≤÷fñWrÁ&VGí“f«6S≤–¢ñbáGóVˆb6gÇ””“vgVÊ7Fñˆ‚rí6gÇÇwVírì∞¢&WGW&‚G'VS∞¢–¢–¢&WGW&‚f«6S∞ß–¶gVÊ7Fñˆ‚G&t7&W7BÇí∞¢ñbÇó4ÜW&ÚÇíí&WGW&‚G&tvV"Çì∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉB√r√"√„ÉRís≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢gGáBáBÇv7&W7E˜FóF∆Rrí¬CÉ¬S¬#Ç¬r6VVc6fr¬v6VÁFW"r¬r33vffCrì∞¢6ˆÁ7BW6VB“rÁ6fRÊWVóÁ&VGV6RÇá2¬Çí”‚2≤5$U5E5∑Ö“¬ì∞¢ÚÚ6ˆ6∂WG0¢f˜"Ü∆WBí“≤í¬Vfe6∆˜G2Çì≤í≤≤í∞¢6ˆÁ7BÇ“CÉ“ÜVfe6∆˜G2Çí“í¢B≤í¢#É∞¢2Á6fRÇì≤2ÁG&Á6∆FRáÇ¬ì"ì≤2Á&˜FFRÑ÷FÇÂíÚBì∞¢2Êfñ∆≈7Gñ∆R“í¬W6VBÚr33vffCr¢w&v&Éì√√3√„Bís∞¢ñbÜí¬W6VBí≤2Á6ÜF˜t6ˆ∆˜"“r33vffCs≤2Á6ÜF˜t&«W"“É≤–¢2Êfñ∆≈&V7BÇ”r¬”r¬B¬Bì≤2Á&W7F˜&RÇì≤2Á6ÜF˜t&«W"“∞¢–¢gGáBáBÇv7&W7E˜6∆˜G2rí≤rr≤W6VB≤rÚr≤Vfe6∆˜G2Çí¬CÉ¬#B¬B¬r3Ü&#Rrì∞¢6ˆÁ7B∆ó7B“rÁ6fRÊ7&W7G3∞¢ñbÇ∆ó7BÊ∆VÊwFÇí∞¢ÚÚ‚V◊Gí67&VV‚ó2vÜW&RFÜRVW7Fñˆ‚vWG26∂VB¬6ÚóBó2vÜW&RFÜP¢ÚÚÁ7vW"∆ófW3¢vÜB7&W7Bó2¬ÊBvÜW&RFÜR6V«2&P¢w&FWáBáBÇv7&W7Eˆ∆˜&Rrí¬cC¬RíÊf˜$V6ÇÇÜ∆‚¬íí”‚gGáBÜ∆‚¬CÉ¬#≤í¢#"¬R¬r3ñf#Ü3Çríì∞¢w&FWáBáBÇv7&W7EˆÊˆÊRrí¬cC¬RíÊf˜$V6ÇÇÜ∆‚¬íí”‚gGáBÜ∆‚¬CÉ¬33≤í¢#"¬R¬r3vCì6Çríì∞¢&WGW&„∞¢–¢ÚÚ‚‚ÊÊBˆÊR∆ñÊRˆbóB7Fó2VÊFW"FÜR˜'Bf˜"FÜR∆ñW'2vÜÚ6∂óVBFÜR6&@¢gGáBáBÇv7&W7E˜˜'Brí¬CÉ¬Cb¬"¬r3VcsCÉÇrì∞¢∆ó7BÊf˜$V6ÇÇÜñB¬íí”‚∞¢6ˆÁ7B6V¬“í””“rÊ7&W7DñGÇ¬W“rÁ6fRÊWVóÊñÊFWÑˆbÜñBí„“∞¢6ˆÁ7Bí“s≤í¢C∞¢ñbá6V¬í≤2Êfñ∆≈7Gñ∆R“w&v&ÉSR√#SR√#Ç√„Çís≤'"Ü2¬É¬í“r¬C3¬3B¬Çì≤2Êfñ∆¬Çì≤–¢gGáBÇÜWÚ~)xÇr¢~)xrrí≤BÇv5Úr≤ñBí¬ƒ‰r””“v"rÚSì¢#¬í¬Ç¬WÚr6VcvCÇr¢6V¬Úr6VVc6fr¢r3Ü&#Rr¬ƒ‰r””“v"rÚw&ñváBr¢v∆VgBrì∞¢gGáBÇ~)j¢rÁ&WVBÑ5$U5E5∂ñE“í¬ƒ‰r””“v"rÚ#¢Ss¬í¬B¬r6ffCsfr¬ƒ‰r””“v"rÚv∆VgBr¢w&ñváBrì∞¢“ì∞¢6ˆÁ7B7W"“∆ó7E¥rÊ7&W7DñGÖ”∞¢Fñ’ÊV¬Éc3¬c¬#É¬Cì∞¢gGáBáBÇv5Úr≤7W"í¬ss¬ì¬r¬r6VVc6frì∞¢w&FWáBáBÇv5Úr≤7W"≤vBrí¬#C¬BíÊf˜$V6ÇÇÜ∆‚¬íí”‚gGáBÜ∆‚¬ss¬##≤í¢#¬B¬r3ñf#Ü3Çríì∞¢gGáBáBÇv7&W7EˆÜñÁBrí¬CÉ¬S"¬2¬r3vCì6Çrì∞ß–¶gVÊ7Fñˆ‚G&u6Ü˜Çí∞¢2Êfñ∆≈7Gñ∆R“w&v&ÉB√r√"√„ÉRís≤2Êfñ∆≈&V7BÉ¬¬ìc¬SCì∞¢gGáBáBÇw6Ü˜˜FóF∆Rrí¬CÉ¬S¬#Ç¬r6VVc6fr¬v6VÁFW"r¬r6ffCsfrì∞¢gGáBÇ~* "r≤rÁ6fRÁ67&¬CÉ¬Éb¬r¬r6ffCsfrì∞¢4ÑıÊf˜$V6ÇÇÜóB¬íí”‚∞¢6ˆÁ7B6V¬“í””“rÁ6Ü˜ñGÇ¬6ˆ∆B“6Ü˜6ˆ∆BÜóBì∞¢6ˆÁ7Bí“3≤í¢Cc∞¢ñbá6V¬í≤2Êfñ∆≈7Gñ∆R“w&v&É#SR√#R√b√„Çís≤'"Ü2¬c¬í“í¬cC¬C¬Çì≤2Êfñ∆¬Çì≤–¢6ˆÁ7BÊ÷R“óBÁGóR””“v7&W7BrÚBÇv5Úr≤óBÊñBí¢BÇw5Úr≤óBÊñBì∞¢6ˆÁ7BFW62“óBÁGóR””“v7&W7BrÚBÇv5Úr≤óBÊñB≤vBrí¢BÇw5Úr≤óBÊñB≤vBrì∞¢6ˆÁ7B6ˆ¬“6ˆ∆BÚr3VfsÇr¢6V¬Úr6VVc6fr¢r3ñ#3"s∞¢gGáBÜÊ÷R¬ƒ‰r””“v"rÚsÉ¢É¬í“b¬r¬6ˆ¬¬ƒ‰r””“v"rÚw&ñváBr¢v∆VgBrì∞¢gGáBÜFW62¬ƒ‰r””“v"rÚsÉ¢É¬í≤2¬"¬6ˆ∆BÚr3CcSCVbr¢r3vCì6Çr¬ƒ‰r””“v"rÚw&ñváBr¢v∆VgBr¬ÁV∆¬¬scrì∞¢gGáBá6ˆ∆BÚBÇw6ˆ∆Brí¢~* "r≤÷FÇÊf∆ˆ˜"ÜóBÊ6˜7B¢á&V∆ñ4Ü2Çv6ˆñ‚ríÚ„í¢íí¬ƒ‰r””“v"rÚÉ¢sÉ¬í¬b¬6ˆ∆BÚr3VfsÇr¢r6ffCsfr¬ƒ‰r””“v"rÚv∆VgBr¢w&ñváBrì∞¢“ì∞¢gGáBáBÇw6Ü˜ˆÜñÁBrí¬CÉ¬S"¬2¬r3vCì6Çrì∞ß–†¢ÚÚ““““““““““&ˆ˜B“““““““““–¢ÚÚG&˜Áí&R÷÷W&vR6ñÊv∆R◊6∆˜B6fR6Ú‚ˆ∆B∆óFá&˜VvÇ6‚ÊWfW"&W7W&f6PßG'í≤∆ˆ6≈7F˜&vRÁ&V÷˜fTóFV“Ö4dUÙ¥Uíì≤“6F6ÇÜRí∑–¢ÚÚVÊv∆ó6Çó2«vó2FÜRFVfV«B˜7FÊF&B7F'C≤FÜRñ6∂W"ó2&V6Ü&∆RÁê¢ÚÚFñ÷Rg&ˆ“FÜR÷VÁRw2$∆ÊwVvR"&˜rÜÊÚf˜&6VBf˜&Vñv‚÷∆ÊwVvR7F'Bí‡¶∆ˆD÷WFÇì∞¢ÚÚ4≤dı"Ù‰RE$4≤¬Ù‰4R‚7F'FñÊrFÜRFóF∆RFÜV÷RÊB&W∆6ñÊróB¢ÚÚ÷ñ∆∆ó6V6ˆÊB∆FW"∆VgBGvÚ7G&V◊2∆ófRFá&˜VvÇFÜR7&˜72÷fFR(	BÊBvÜñ∆P¢ÚÚFÜRvRó27Fñ∆¬6ñ∆VÁBÊVóFÜW"Ü27F'FVB¬6ÚFÜRFFÜBfñÊ∆«ê¢ÚÚVÊ∆ˆ6∑2VFñÚ6˜V∆Bv∂R&˜FÇÊB∆íFÜV“˜fW"V6Ç˜FÜW"‚ˆ‚fó'7@¢ÚÚ&ˆ˜BFÜR˜VÊñÊrw266˜&Ró2FÜRˆÊ«íFÜñÊrÁñˆÊR6Ü˜V∆BÜV"‡ß6WD◊W6ñ2ÇwFóF∆Rrì∞¢ÚÚDÑRdîƒ“$TƒÙ‰u2DÚ‰Urt‘R¬Ê˜BFÚFÜRvR∆ˆB‚óBW6VBFÚ∆íóG6V∆`¢ÚÚFÜRfó'7BFñ÷RFÜRvRv2WfW"˜VÊVB¬vÜñ6ÇWBGvÚ÷÷ñÁWFR&ˆ∆ˆwVRñ‡¢ÚÚg&ˆÁBˆb6ˆ÷V&ˆGívÜÚÜBÊ˜BñWBFV6ñFVBFÚ∆í(	BÊBFÜV‚ÊWfW"vñ‚¿¢ÚÚvÜñ6Ç÷VÁBFÜRW'6ˆ‚vÜÚ÷FRóB∆÷˜7BÊWfW"6róB‚óBÊ˜r7F'G2vÜV‡¢ÚÚÊWrv÷Ró2&W76VB¬ÊBFÜRdï%5B4ÑıBó2fWF6ÜVBÜW&R¬VñWF«í¬vÜñ∆RFÜP¢ÚÚ÷VÁRó2ˆ‚67&VV‚¬6ÚFÜB&W727F'G2fñ∆“FÜBó2«&VGíñ‚÷V÷˜'í‡¢Ú¢ÚÚˆÊR6Ü˜BÊBÊ˜BVñváC¢∆ñW"vÜÚ&W76W26ˆÁFñÁVRÊWfW"vF6ÜW2FÜP¢ÚÚ˜VÊñÊr¬ÊBVñváB6Ü˜G2ó2B„B‘"ˆbvV&“É2„‘"ˆb◊B¬vÜñ6Çó2vÜ@¢ÚÚîı2F∂W2í7VÁBˆ‚FÜVó"&VÜ∆b&Vf˜&RFÜWíÜfR6Ü˜6V‚ÁóFÜñÊr‚FÜR&W7@¢ÚÚˆbFÜR&VV¬'&ófW2GvÚÜVBˆbFÜR6Ü˜Bˆ‚67&VV‚(	B6VRfñ∆‘ÜVBÇí‡¢Ú¢ÚÚ‚‚ÊÊBˆÊ«íf˜"6ˆ÷V&ˆGívÜÚÜ2ÊÚ6fR‚&WGW&ÊñÊr∆ñW"w2ÊWáB&W72ó0¢ÚÚ6ˆÁFñÁVR¬ÊBFÜR˜VÊñÊró2FÜRˆÊRFÜñÊrˆ‚FÜó2÷VÁRFÜWíÜfR«&VGê¢ÚÚ6VV‚‚ñbFÜWíFÚ7F'BÊWrv÷RFÜRfñ∆“6ñ◊«ívóG2ñ‚FÜRF&≤f˜"¢ÚÚ&VB(	BWFFT7WBw2Üˆ∆FÜ6Ró2'Vñ«Bf˜"WÜ7F«íFÜBÊBvñ∆¬6óBFÜW&P¢ÚÚFñVÁF«íf˜"WFÚf˜W'FVV‚6V6ˆÊG2‡¶ñbÜv÷T∆ˆ6≤Çí”“vÜW&ÚrbbÁï6fRÇíí∞¢6WEFñ÷V˜WBÇÇí”‚≤G'í≤fñ∆‘ÜVBÑîÂE$ıÙdîƒ“Ê÷á2”‚5≥“í¬ì≤“6F6ÇÜRí∑““¬ìì∞ß–¢ÚÚ‚‚ÊÊBFÜR'Bf˜"vÜW&R6ÜRó2&˜WBFÚ&R7F'G2'&ófñÊrˆ‚FÜRFóF∆P¢ÚÚ67&VV‚¬vÜñ6ÇW6VBFÚfWF6ÇÊ˜FÜñÊrB∆¬‚6VR&V∆ˆD&ˆ˜BÇí‡ß6WEFñ÷V˜WBÇÇí”‚≤G'í≤ñbáGóVˆb&V∆ˆD&ˆ˜B””“vgVÊ7Fñˆ‚rí&V∆ˆD&ˆ˜BÇì≤“6F6ÇÜRí∑““¬Cì∞¢ÚÚ∆ˆˆ≤f˜"ÊWvW"'Vñ∆BB&ˆ˜B¬ÊBvñ‚WfW'ífWr÷ñÁWFW2vÜñ∆RñF∆ñÊp§rÁWFFU7F◊“∞ß6WEFñ÷V˜WBÜ6ÜV6¥f˜%WFFR¬#Sì∞ß6WDñÁFW'f¬Ü6ÜV6¥f˜%WFFR¬#Cì∞¶FDWfVÁD∆ó7FVÊW"Çwfó6ñ&ñ∆óGñ6ÜÊvRr¬Çí”‚≤ñbÇFˆ7V÷VÁBÊÜñFFV‚í6ÜV6¥f˜%WFFRÇì≤“ì∞¢ÚÚñÁ7FÁB&WVB∆ˆG2≤ˆff∆ñÊS¢66ÜR÷fó'7B76WG2¬ÊWGv˜&≤÷fó'7B6ˆFP¶ñbÇw6W'fñ6Uv˜&∂W"rñ‚ÊfñvF˜"bb∆ˆ6Fñˆ‚Á&˜Fˆ6ˆ¬””“váGG3¢rí∞¢G'í≤ÊfñvF˜"Á6W'fñ6Uv˜&∂W"Á&Vvó7FW"Çw7rÊß3˜c“r≤VÊ6ˆFUU$î6ˆ◊ˆÊVÁBávñÊF˜r‰%TîƒEÙîB«¬vFWbrí¬∑WFFUfñ66ÜS¢vÊˆÊRw“íÊ6F6ÇÇÇí”‚∑“ì≤“6F6ÇÜRí∑–ß–¶∆WB∆7EB“∞¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚDÑRe$‘R%TDtUB‚FÜR&6∂w&˜VÊBw2ÊV"FWFÇ∆FRó2FÜRˆÊRñV6Rˆ`¢ÚÚ66VÊW'íñ‚FÜRv÷RFÜBvV≤FWfñ6R6ÊÊ˜Bff˜&C¢óBó26V6ˆÊ@¢ÚÚgV∆¬◊vñGFÇ6ˆ◊˜6óFR¬WfW'íg&÷R¬W&V«íf˜"∆ˆˆ∑2‚6ÚóBó2Ê˜@¢ÚÚVÊ6ˆÊFóFñˆÊ¬‚FÜR∆ˆ˜∂VW26∆˜rfW&vRˆb&V¬g&÷RFñ÷RÊBvófW0¢ÚÚFÜR∆FRWvÜV‚FÜRv÷Ró2Ê˜BÜˆ∆FñÊr6ˆ÷f˜'F&∆R&FR¬F∂ñÊróB&6∞¢ÚÚvÜV‚óB&V6˜fW'2‚Êˆ&ˆGíó2WfW"6Ü˜v‚&WGFñW"&6∂w&˜VÊBBFÜR&ñ6Rˆ`¢ÚÚv˜'6R÷fVV∆ñÊrv÷R‡¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¶∆WBg&÷T◊2“b„r¬&ñ6Ñ$r“G'VR¬&ñ6Ñ≤“¬&ñ6ÑÜˆ∆B“∞¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¢ÚÚ4ƒır‘4Ñî‰R’U5B‰ıB$T4Ù‘R4ƒırt‘R‚FÜR∆ˆ˜6ñ◊V∆FVBWÜ7F«íˆÊP¢ÚÚ7FWW"g&÷R¬ˆbB÷˜7BFÜó'FñWFÇˆb6V6ˆÊB(	BÊBFÜB6Vñ∆ñÊró0¢ÚÚÊV6W76'í¬&V6W6R6ñÊv∆RáVvR7FWÜF"∆VgBñ‚FÜR&6∂w&˜VÊB¬7F∆¬ê¢ÚÚv˜V∆B6''íFÜR∆ñW"7G&ñváBFá&˜VvÇv∆¬‚'WBóB«6Ú÷VÁBFÜB¢ÚÚ÷6ÜñÊRG&vñÊr#g&÷W26V6ˆÊBˆÊ«íWfW"GfÊ6VB#FÜó'FñWFá2ˆb¢ÚÚ6V6ˆÊBW"6V6ˆÊC¢FÜRVÁFó&Rv÷R&‚ñ‚6∆˜r÷˜Fñˆ‚¬ÊBóBv2v˜'7@¢ÚÚWÜ7F«ívÜW&RóBáW'G2÷˜7B¬ˆ‚FÜRvV∂W"FWfñ6R‚÷V7W&VB&Vf˜&RFÜó2fóÇ¿¢ÚÚ6ÜR7&˜76VB&ˆˆ“B33Ç˜2&˜fR3g2¬#cRB#Bg2¬##B#g2Ê@¢ÚÚc2BR(	BÜ∆b7VVB‡¢Ú¢ÚÚFÜR7FW6ó¶Ró27Fñ∆¬6VB‚vÜB6ÜÊvVBó2FÜB∆ˆÊrg&÷RÊ˜r'VÁ0¢ÚÚ4UdU$¬ˆbFÜ˜6R7FW2ñÁ7FVBˆbˆÊR¬6Úv∆¬÷6∆ˆ6≤7VVBó2FÜR6÷P¢ÚÚvÜFWfW"FÜRg&÷R&FR‚FÜR6F6Ç◊Wó2&˜VÊFVC¢B÷˜7BFVÁFÇˆb6V6ˆÊ@¢ÚÚˆb6ñ◊V∆Fñˆ‚W"g&÷R¬6ÚF"FÜBv2ÜñFFV‚f˜"÷ñÁWFR&W7V÷W2vÜW&P¢ÚÚóBv2&FÜW"FÜ‚f7B÷f˜'v&FñÊrFá&˜VvÇóB¬ÊB÷6ÜñÊRFˆÚ6∆˜rF¢ÚÚff˜&BFÜR6F6Ç◊WFVw&FW2vVÁF«íñÁ7FVBˆb7ó&∆∆ñÊr‡¢ÚÚ““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““““–¶6ˆÁ7B4î’ı5DU“Ú3≤ÚÚFÜR∆&vW7B7FW6ˆ∆∆ó6ñˆ‚6‚&RG'W7FVBvóFÄ¶6ˆÁ7B4î’Ù‘Ç“„≤ÚÚÊBFÜR÷˜7B6ñ◊V∆Fñˆ‚Áí6ñÊv∆Rg&÷R÷íF¶gVÊ7Fñˆ‚÷ñ‰∆ˆ˜áF◊2í∞¢6ˆÁ7B&r“áF◊2“∆7EBíÚ∞¢6ˆÁ7BGB“÷FÇÊ÷ñ‚á&r¬4î’ı5DUì∞¢ñbÜ∆7EBí∞¢g&÷T◊2≥“Ñ÷FÇÊ÷ñ‚áF◊2“∆7EB¬í“g&÷T◊2í¢„3∞¢ÚÚDÑRDT4ï4îÙ‚Ñ2DÚÑÙƒB‚FÜRWáG&26˜7Bg&÷W2¬ÊBFÜRg&÷R&FRó0¢ÚÚvÜBFV6ñFW2vÜWFÜW"FÚ'V‚FÜV“(	B6ÚFWfñ6RÊV"FÜRFá&W6Üˆ∆BGW&Á0¢ÚÚFÜV“ˆ‚¬6∆˜w2F˜v‚¬GW&Á2FÜV“ˆfb¬7VVG2W¬f˜&WfW"‚V6ÇFV6ó6ñˆ‚ó0¢ÚÚFÜW&Vf˜&R∆ˆ6∂VBñ‚f˜"fWr6V6ˆÊG2&Vf˜&RFÜRÊWáBˆÊR6‚&R÷FR¿¢ÚÚvÜñ6Çó2vÜB'&V∑2FÜR∆ˆ˜¢÷6ÜñÊRFÜB6ÊÊ˜Bff˜&BFÜV“6WGF∆W0¢ÚÚˆ‚ˆfbÊB5Dï2FÜW&RñÁ7FVBˆb7G&ˆ&ñÊr‡¢&ñ6ÑÜˆ∆B”“GC∞¢ñbá&ñ6ÑÜˆ∆B√“í∞¢ñbá&ñ6Ñ$rbbg&÷T◊2‚#bí≤&ñ6Ñ$r“f«6S≤&ñ6ÑÜˆ∆B“C≤“ÚÚ„3Üg3¢vófRóBW ¢V«6RñbÇ&ñ6Ñ$rbbg&÷T◊2¬íí≤&ñ6Ñ$r“G'VS≤&ñ6ÑÜˆ∆B“C≤“ÚÚ„S6g3¢F∂RóB&6∞¢–¢ÚÚÊBFÜRfó6ñ&∆RÜ∆bfFW2&FÜW"FÜ‚7vóF6ÜW2(	Bf7Bˆfb6ÚFÜR6˜7@¢ÚÚ∆VfW2Vñ6∂«í¬6∆˜rˆ‚6ÚóBÊWfW"∆ˆˆ∑2∆ñ∂R∆ñváB&VñÊrf∆ñ6∂V@¢6ˆÁ7BvÁB“&ñ6Ñ$rÚ¢∞¢&ñ6Ñ≤≥“ávÁB“&ñ6Ñ≤í¢÷FÇÊ÷ñ‚É¬GB¢ávÁBÚ„b¢bíì∞¢ñbá&ñ6Ñ≤¬„"í&ñ6Ñ≤“∞¢ÚÚÊBFÜR6ˆ'6W"Fñ¬¬vÜñ6Ç÷˜fW2&&V«íÊB÷˜fW2WfW'óFÜñÊp¢ñbáGóVˆbV≈7FW””“vgVÊ7Fñˆ‚ríV≈7FWÜGB¬g&÷T◊2ì∞¢–¢∆7EB“F◊3∞¢ñbáGóVˆbˆ∆ƒv÷WB””“vgVÊ7Fñˆ‚ríˆ∆ƒv÷WBÇì∞¢6ˆÁ7B'E&VGí“GóVˆbÜW&Ù'D&ˆ˜EFñ6≤”“vgVÊ7Fñˆ‚r«¬ÜW&Ù'D&ˆ˜EFñ6≤Çì∞¢ÚÚˆÊR7FWˆ‚ÜV«Fáíg&÷S≤GvÚ˜"Fá&VRvÜV‚FÜR÷6ÜñÊRó27G'Vvv∆ñÊp¢∆WB62“÷FÇÊ÷ñ‚á&r¬4î’Ù‘Çí¢ÑrÁ7FFR””“uƒírÚ6T≤Çí¢ì∞¢ñbÇÜ62‚íí62“GC∞¢ÚÚDÑR4î’TƒDTB4ƒÙ4≤¬T$ƒï4ÑTB(	BFÜRFÜó&B÷V7W&V÷VÁBÜˆˆ≤ñ‚FÜó2fñ∆R¿¢ÚÚ&W6ñFRrÊ'E&ˆ&RÊBrÁ∆ÊU&ˆ&R¬ÊBóBWÜó7G2f˜"FÜR6÷R&V6ˆ‚FÜWê¢ÚÚFÚ‚g&÷RGfÊ6W2÷ñ‚á&r¬4î’Ù‘ÇíÇ6T≤Çí6V6ˆÊG2ˆbv˜&∆B¬‰ıBFÜP¢ÚÚv∆¬÷6∆ˆ6≤Fñ÷RóBFˆˆ≤¬6Úˆ‚'W7í÷6ÜñÊRFÜRv˜&∆Bf∆«2&VÜñÊBFÜP¢ÚÚv∆¬ÊBÁíÜ&ÊW72vVñváFñÊr'í&V¬V∆6VB◊2ó26Ü&vñÊrFÜRfñváBf˜ ¢ÚÚFñ÷RóBÊWfW"v˜B‚FW7G2ˆ&˜776RÊ6ß2FñBWÜ7F«íFÜBÊB6'&ñVB¢ÚÚFˆ7V÷VÁFVBf∆∂Rf˜"óB‚ˆÊRFFóFñˆ‚W"g&÷R¬ÊÚ'&Ê6Ç¬ÊÚ∆∆ˆ6Fñˆ‚‡¢rÁ6ñ‘6∆ˆ6≤“ÑrÁ6ñ‘6∆ˆ6≤«¬í≤63∞¢vÜñ∆RÜ62‚R”Bí∞¢6ˆÁ7B7B“÷FÇÊ÷ñ‚Ü62¬4î’ı5DUì∞¢ñbÜ'E&VGí«¬rÁ7FFR”“uƒíríWFFRá7Bì∞¢ÚÚÜV∆B6ˆÁG&ˆ«27W'fófR‚&W76VBVFvR&V∆ˆÊw2FÚˆÊR6ñ◊V∆Fñˆ‚7FW¿¢ÚÚñÊ6«VFñÊrg&÷RFÜB6F6ÜW2WGvÚ˜"Fá&VRáó6ñ727FW2‡¢f˜"Ü6ˆÁ7B∂Wíñ‚∂Wó5í∂Wó5∂∂Wï““∞¢62”“7C∞¢–¢ÚÚÙ‰R$TdUD4Ç4ƒıBU"e$‘R¬î‚UdU%í5DDR‚FÜó2W6VBFÚ∆ófRñÁ6ñFRFÜP¢ÚÚƒí'&Ê6ÇˆbWFFRÇí¬vÜñ6Ç÷VÁBFÜRFóF∆R67&VV‚¬FÜR÷¬6Ü˜Ê@¢ÚÚFÜRvÜˆ∆RGvÚ÷÷ñÁWFR˜VÊñÊrfWF6ÜVBÊ˜FÜñÊrB∆¬(	BFÜRVñWFW7B÷ˆ÷VÁG0¢ÚÚñ‚FÜR6W76ñˆ‚vW&RFÜRˆÊ«íˆÊW2FÜR&VfWF6ÜW"6B˜WB‚&V∆ˆDñF∆RÇê¢ÚÚ˜vÁ2FÜRFV6ó6ñˆ‚Ê˜r¬ÊBóB7Fñ∆¬&VgW6W2GW&ñÊrG&Á6óFñˆ‚¬&˜70¢ÚÚfñváB¬ÊBfñ∆“FÜBó2Ê˜B∆ññÊr6∆VÊ«í‡¢ñbáGóVˆb&V∆ˆEFñ6≤””“vgVÊ7Fñˆ‚rí≤G'í≤&V∆ˆEFñ6≤Çì≤“6F6ÇÜRí∑“–¢ÚÚFÜR◊W6ñ27FW2&6≤vÜñ∆RG&ñ¬ó2˜V„¢FÜRG&ñ¬w2Ê˜FW2&RFÜP¢ÚÚñÁFW&f6R¬ÊBFÜWí∆˜6RFÚ7G&V“BgV∆¬fˆ«V÷RÜVFñÚÊß2’U5ÙET4≤ê¢ñbáGóVˆb’U5ÙET4≤”“wVÊFVfñÊVBrí’U5ÙET4≤“rÁ7FFR””“uE$î¬rÚ„2¢∞¢G&ráF◊2ì∞¢G&uF˜V6ÖTíÇì∞¢6∆V%Çì∞¢ñbÇ÷ñ‰∆ˆ˜Ê∆DvˆÊRbb'E&VGíí∞¢÷ñ‰∆ˆ˜Ê∆DvˆÊR“G'VS∞¢6ˆÁ7B∆B“Fˆ7V÷VÁBÊvWDV∆V÷VÁD'îñBÇv6&∆ˆBrì∞¢ñbÜ∆Bí≤∆BÁ7Gñ∆RÊ˜6óGí“ss≤6WEFñ÷V˜WBÇÇí”‚≤G'í≤∆BÁ&V÷˜fRÇì≤“6F6ÇÜRí∑““¬Sì≤–¢–¢&WVW7DÊñ÷Fñˆ‰g&÷RÜ÷ñ‰∆ˆ˜ì∞ß–¢ÚÚñÊóFñ¬66ÜVGV∆ñÊró2ñ‚&ˆ˜BÊß2¬gFW"∆¬&ˆGV7Fñˆ‚÷ˆGV∆W2ÜfR∆ˆFVB‡