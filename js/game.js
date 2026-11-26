Y��x-���jם��i��+��j[h��ܢ��߾v��9�}�o+^����ם// CLAWBYTE — main loop, states, HUD, menus, save
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
// stop and read — the title and the pause card — and on the pages themselves
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
// ===========================================================================
// CRESTS THAT CHANGE HOW SHE FIGHTS (handoff Part 2 C1; owner, 2026-10-12:
// "expensive crests should change how she fights, give her something tangible
// that helps in the game... applicable for all weapons, whether it's claw,
// sword, double sword, etc.").
//
// A seal is a dead unit's certified rating (docs/CRESTS.md), and a rating is a
// way of moving. Every seal that takes TWO OR MORE units of port width carries
// an ATTACK BLOCK as well as its passive: a set of multipliers laid over her
// swing at ONE place, so the same block shapes the bare claws, the single
// sword, the twin blades and the joined blade identically, and NOSTOS's hero
// through the same Player code. The one-socket seals (magnet, siphon, sprint)
// stay passives: a courier's sprint was rated to run, not to fight.
//
//   t       the swing's ACTIVE window (0.15 s) and its drawn clock (0.24 s)
//   cd      her RECOVERY after each beat (0.26 / 0.23 / 0.33 s). Overclock's
//           own passive x0.7 still applies on top: the passive is kept
//   R       REACH: how far in front of her the cut's FAR EDGE lands (Player.hitbox)
//   half    WIDTH: the cut's half-height across the aim (Player.hitbox)
//   kb      knockback of the swing rows (ATTACKS.slash / .finisher, crest: 1)
//   freeze  hit-stop of the swing rows
//   step    how far each grounded beat carries her in (96 / 230 px/s)
//   recoil  how hard her own blow pushes her back (62 / 130 px/s)
//   chain   3: jab, jab, finisher. 2: every second beat is the finisher
//   down    'diag': the air down-strike goes down-forward at 45 degrees and
//           its pogo carries her on over what it struck
//   shape   which authored hit shape (js/hitshape.js) each beat uses
//   tint    the colour of the cut she draws on the slash layer. Measured
//           against every reserved hue in docs/combat/GLOBAL_REGISTRY.md §2
//           (ΔE > 30) by tests/crestfight.cjs
//
// Every block is a TRADE, never a pure upgrade: whatever it gives (reach,
// width, push, speed, ground) it pays for in recovery, reach or push. A fixed
// blow (ATTACKS rows with `flat`: the parry counter, Volt Soar) and the charged
// moves (burst, swirl, the thrown blade) are their own moves and stay fixed.
//
// ONE STYLE AT A TIME. If she wears several, the seal taking the most port
// width sets it; between equals, the one she seated first (crestStyle). Gear
// marks that row "sets your fighting style". tests/crestfight.cjs swings every
// block with every weapon form through real input and measures all of it.
// ===========================================================================
const CREST_ATTACK = {
  // the cutter's rating: the edge goes further and pays in width and recovery
  claws:   { t: 1,   cd: 1.15, R: 1.25, half: 0.9,  kb: 1,    freeze: 1,   step: 1,   recoil: 1, chain: 3, down: 'straight',
             shape: { slash: 'reach', finisher: 'reach' }, tint: '#2dff1e' },
  // the wall-walker's rating: a slower, wider, heavier slam and a diagonal pogo
  plate:   { t: 1.2, cd: 1.25, R: 1,    half: 1.35, kb: 1.4,  freeze: 1.3, step: 1,   recoil: 1, chain: 3, down: 'diag',
             shape: { slash: 'slam', finisher: 'slam' }, tint: '#5c7aa8' },
  // the actuator's rating: quicker, shorter, lighter swipes
  over:    { t: 0.8, cd: 1,    R: 0.85, half: 1,    kb: 0.75, freeze: 0.6, step: 1,   recoil: 1, chain: 3, down: 'straight',
             shape: null, tint: '#ff9be0' },
  // the phase-dasher's rating: every cut lunges, a little shorter
  phantom: { t: 1,   cd: 1.1,  R: 0.9,  half: 1,    kb: 1,    freeze: 1,   step: 2.5, recoil: 1, chain: 3, down: 'straight',
             shape: null, tint: '#b8a0ff' },
  // the insulated unit's rating: planted feet, no step and no recoil, a
  // heavier shove from a stance that recovers slower
  ground:  { t: 1,   cd: 1.1,  R: 1,    half: 1.15, kb: 1.3,  freeze: 1,   step: 0,   recoil: 0, chain: 3, down: 'straight',
             shape: null, tint: '#16a596' },
  // the prototype's rating: a two-beat string — every second cut is the finisher
  nine:    { t: 1,   cd: 1,    R: 1,    half: 1,    kb: 1,    freeze: 1,   step: 1,   recoil: 1, chain: 2, down: 'straight',
             shape: null, tint: '#69872d' },
};
// Which worn seal sets her fighting style: the one taking the most port
// width; between equals, the one seated first. null: her own, uncertified.
function crestStyle(save) {
  const eq = (save || (typeof G !== 'undefined' && G.save) || {}).equip || [];
  let best = null;
  for (const id of eq) if (CREST_ATTACK[id] && (!best || CRESTS[id] > CRESTS[best])) best = id;
  return best;
}
function crestAttackOf(id) { return (id && CREST_ATTACK[id]) || null; }
// the plain-words line a crest's card adds about her attacks ('' for a seal
// that does not change them)
function crestFightText(id) { return CREST_ATTACK[id] ? t('cf_' + id) : ''; }
// a seal's whole card: what it does to her body, then what it does to her attacks
function crestCardText(id) { const f = crestFightText(id); return t('c_' + id + 'd') + (f ? ' ' + f : ''); }
// the seal's name as the screen she is on calls it (Gear names the coil)
function crestNameKey(id) { return id === 'phantom' && !isHero() ? 'gear_phase' : 'c_' + id; }
// For a WORN seal with an attack block: does it set her style, or which seal
// does? '' for anything else. The one-style rule, said where it applies.
function crestStyleNote(id, save) {
  const s = save || G.save;
  if (!CREST_ATTACK[id] || !s || (s.equip || []).indexOf(id) < 0) return '';
  const on = crestStyle(s);
  return on === id ? t('cf_active') : t('cf_held').replace('%s', t(crestNameKey(on)));
}
// wrapText breaks at spaces, and Chinese has none: a line that is still too
// wide is broken between characters, so a panel never runs out of its frame
function wrapCrest(str, maxW, size) {
  const out = [];
  for (const ln of wrapText(str, maxW, size)) {
    if (c.measureText(ln).width <= maxW) { out.push(ln); continue; }
    let cur = '';
    for (const ch of Array.from(ln)) {
      if (cur && c.measureText(cur + ch).width > maxW) { out.push(cur); cur = ch; } else cur += ch;
    }
    if (cur) out.push(cur);
  }
  return out;
}
const SHOP = [
  // SOMETHING SHE CAN ACTUALLY AFFORD. Every other line on this list costs more
  // than a whole kingdom's scrap, which meant a new player met the shop, read
  // seven prices they could not pay, and learned that money is a number that
  // goes up. The cell is deliberately cheap, deliberately repeatable, and
  // deliberately the thing HEALING runs on — so one purchase teaches the whole
  // economy: scratch a machine, take its scrap, turn it into volts, spend the
  // volts on a core.
  { id: 'cell', type: 'cell', cost: 12 },
  // PRICED TO BE CHOSEN BETWEEN (owner, 2026-11-16, with 632 scrap in the first
  // kingdom: "most of the things he has is affordable for now... I purchased
  // everything"). A shelf she can clear is not a shop, it is a pickup. Every
  // permanent line costs about half again what it did: one kingdom's scrap now
  // buys one or two of these, and which one is a decision.
  // ...AND DEARER AGAIN (owner, 2026-11-20: "things need to be more expensive
  // because it is easy to get shards in the game"): chapter one pays about 700,
  // and every line is about 1.6x what it was — one crest a kingdom, if that.
  { id: 'claws', type: 'crest', cost: 540 }, { id: 'over', type: 'crest', cost: 580 },
  { id: 'plate', type: 'crest', cost: 740 }, { id: 'siphon', type: 'crest', cost: 520 },
  { id: 'sprint', type: 'crest', cost: 450 },
  { id: 'slot', type: 'slot', cost: 990 }, { id: 'core', type: 'core', cost: 1600 },
  // ONE MORE HORN-STAR (owner, 2026-11-20: "shooting one ... can be upgraded at
  // the shop into becoming shooting 2 and 3 and 4. Until it reaches the
  // maximum"). GRAVEHORN's suit fires one; each upgrade adds one, up to four.
  { id: 'volley', type: 'volley', get cost() { return SHOP_VOLLEY[Math.min(SHOP_VOLLEY.length - 1, shardLevel() - 1)]; } },
  // THE PACK LADDER (owner, 2026-11-25: "Improving this skill by spending shards at certain NPCs";
  // 2026-11-26: the stronger wolf, then the Alpha himself). ONE row: always the next rung Ratchet
  // sells — A STRONGER WOLF, CALL THE ALPHA, THE ALPHA'S HOWL (js/packtree.js ptNextRatchet; prices
  // measured: docs/OWNER_ORDERS.md, tests/pack-prices.cjs). The ride is on the Tinker's shelf.
  { id: 'packup', type: 'packup', get cost() { return typeof ptShelfCost === 'function' ? ptShelfCost() : 700; } },
];
const BENCH_ROOMS = ['A3', 'B3', 'D2', 'E2'];   // (D2: the archive's pod is at ZERO's door now — world.js, SAVE POINTS ARE FOR CRITICAL PLACES)

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
  // NO RING ROUND ANY BODY (the ledger, 4x; owner 2026-11-21 on the purify scene, the
  // teal circle round NULLFANG). Sixteen callers fired an expanding ring of light centred
  // on a body — a blow, a parry, a roar, a death. The call stays so they need not change;
  // it draws nothing. The impact is carried by the ripple, the cracks, the shake and sound.
  addRing() {},
  // nothing speaks over the first meeting (manga-direction §6: the silence IS the beat)
  // A STORY LINE IS NOT A TOAST (js/overlay.js storyToast): the sentences the
  // story turns on become cards she acknowledges; the rest live long enough to
  // be read, and inside a menu they are said where the menu can show them.
  toast(text) {
    // AN EMPTY LINE IS NO TOAST (js/text-lite.js): a narration the screen
    // already shows was shortened to nothing, and a toast with a leftover
    // number ("  +10 IQ") is trimmed rather than drawn with its gap
    text = String(text == null ? '' : text).trim();
    if (!text) return;
    if (this.meet) return;
    if (typeof storyToast === 'function' && storyToast(text)) return;
    if (typeof menuMsgSet === 'function') menuMsgSet(text);
    this.toasts.push({ text, t: typeof toastLife === 'function' ? toastLife(text) : 3 });
  },
  breakTile(tx, ty) {
    // The hub's hatch (A2, 12-14) is not handled here any more. It used to be
    // refused at this point until the NULLFANG meeting — while the light, the
    // caption, the goal line and the strike prompt all told the player to dig.
    // The owner's ruling (2026-11-14): "if it's supposed to go inside and dig
    // after Nullfang, then why are you showing it before?" So before the meeting
    // it is not a hatch at all: tileAt reports it as rock (pgHubSealed), which
    // is what every system that draws it, knocks on it or prompts for it reads.
    this.save.broken[this.roomId + ':' + tx + ',' + ty] = 1;
    // THE GROUND CURVE IS RE-READ. The heightfield she stands on is built
    // from the grid once per room and cached by room id, so a floor she cut
    // out still held her up 19 px above the hole (measured, tests/secrets.cjs:
    // the camp's cellar hatch broke and she stood on the air where it was).
    if (typeof surfRoom !== 'undefined') surfRoom = null;
    looseCutSet = null;                      // a fracture world's '#' may be the cut
    // THE LESSON IS LEARNED THE FIRST TIME IT WORKS — and there are two of
    // them. A wall gives to an ordinary swing; a floor only to a strike from
    // above, which is the one players do not find on their own. One shared
    // flag let the first hollow WALL she opened (A6's, off the critical path)
    // silence the floor's hint for good, and the floor is the way to the first
    // cave. So each kind of hint has its own 'seen': taughtWall, taughtFloor.
    // taughtBreak stays the any-break flag the loose-rock drawing reads.
    const fl = this.save.flags, wasFloor = player && ty * TILE >= player.y + player.h - 6;
    const lesson = wasFloor ? 'taughtFloor' : 'taughtWall';
    if (!fl.taughtBreak || !fl[lesson]) { fl.taughtBreak = 1; fl[lesson] = 1; persist(); }
    tileDirty = true;
    sfx('break'); cam.shake = Math.max(cam.shake, 4);
    burst(tx * TILE + 16, ty * TILE + 16, 14, PAL[this.roomDef.zone].solid, 220, 0.6, 600, 4);
    burst(tx * TILE + 16, ty * TILE + 16, 6, PAL[this.roomDef.zone].glow, 160, 0.4, 300, 3, true);
    return true;
  },
  // A BLOW THAT DOES NOT BREAK IT. The secret's tell is a SOUND as much as a
  // crack: a hollow knock, grit puffing out of the seam, the crack opening
  // wider (drawKnocks) — so a wall that looks like every other wall can be
  // tested by hitting it, and the first time it answers, she is told what the
  // answer means (the hint_secret line, once per save). `crack` counts the
  // blow toward breaking (side and ceiling secrets take two); a floor struck
  // from the side only rings. Returns the blows this tile has taken.
  knockTile(tx, ty, crack) {
    // a crack belongs to the run it was struck in; a new game starts uncracked
    if (this.knockSave !== this.save) { this.knocks = {}; this.knockSave = this.save; }
    const room = this.knocks[this.roomId] || (this.knocks[this.roomId] = {}), k = tx + ty * 4096;
    const n = crack ? (room[k] = (room[k] | 0) + 1) : (room[k] | 0);
    // ...and every tile that has answered a blow at all, cracked or not: the
    // hint (drawBreakHint) speaks at once to somebody who has already tried
    (room.rang || (room.rang = {}))[k] = 1;
    // one note per swing, however many tiles of the plug the blade crossed
    if (this.knockAt !== this.save.time) { this.knockAt = this.save.time; sfx('hollow'); cam.shake = Math.max(cam.shake, 2); }
    const P = PAL[this.roomDef.zone];
    burst(tx * TILE + 16, ty * TILE + 16, 5, P.solid, 90, 0.45, 260, 2);
    burst(tx * TILE + 16, ty * TILE + 22, 3, P.edge, 60, 0.35, 120, 1.6);
    // the first time each kind answers, say what the answer means — a wall
    // that rings will give to another blow; a floor that rings wants one from above
    const heard = crack ? 'heardHollow' : 'heardHollowFloor';
    if (!this.save.flags[heard]) { this.save.flags[heard] = 1; this.toast(t(crack ? 'hint_secret' : 'hint_hollow_floor')); persist(); }
    return n;
  },
  knocks: {}, knockAt: -1, knockSave: null,
  dropScrap(x, y, total) {
    let left = total;
    while (left > 0) { const v = Math.min(left, irnd(2, 5)); left -= v; this.pickups.push(new Scrap(x, y, v)); }
  },
  onPlayerDeath() {
    this.save.deaths++;
    // DEFEAT IS A BEAT, NOT A RELOAD (underdog-arc §2.5): one line under the
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
  grantRelic(id, presentStored) {
    if (!this.save.relics) this.save.relics = [];
    const stored = this.save.relics.indexOf(id) >= 0;
    if (stored && !presentStored) return;
    if (!stored) {
      if (presentStored) return;
      this.save.relics.push(id);
      persist();
    }
    sfx('win');
    loadoutTagCard(showItem(t('rl_' + id), t('rl_' + id + 'd')), 'relic', id);
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
    // THE RULE: every guardian resolved — felled or tamed — REVEALS A CAVE.
    // The lair grows a depth door (GATE_ROOM `need` flags), the map grows the
    // cave sign, and the player is told the ground moved so the reveal is an
    // event, not a secret. What waits inside each grotto is its own story.
    {
      const opened = kind === 'alpha' ? 'alpha' : 'boss' + cap;
      for (const rid in (typeof GATE_ROOM !== 'undefined' ? GATE_ROOM : {})) {
        if (!gateDoorsAll(rid).some(d => d.need === opened || d.lock === opened)) continue;
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
      this.save.quests = this.save.quests || {}; this.save.quests.alpha_pack = 'done';
      invAdd('batt');
      // THE PACK ANSWERS HER (owner, 2026-11-20): the yield gives her the arm
      // that calls one of its wolves (js/packcall.js) — one card says both
      this.save.arms = this.save.arms || [];
      if (!isHero() && !this.save.arms.includes('pack')) { this.save.arms.push('pack'); this.save.armIdx = this.save.arms.length; }
      {
        const card = showItem(t('alpha_won'), t('alpha_wond') + (isHero() ? '' : '  —  ' + t('arm_how')));
        if (card && !isHero() && typeof loadoutTagCard === 'function') loadoutTagCard(card, 'arm', 'pack');
      }
      this.save.scrap += 60;
      // its own cue, and it is the only one in the game that resolves major
      if (typeof setMusic === 'function') setMusic('alphaTame');
      persist();
      return;
    }
    if ((typeof MINIS !== 'undefined' && MINIS[kind]) || kind === 'mirejaw') {
      invAdd('batt');
      // the crocodile's card is his shed skin, for the pipe-smith (js/sewer.js)
      if (!(kind === 'mirejaw' && typeof swSkinDrop === 'function' && swSkinDrop())) showItem(t('i_batt'), t('i_battd'));
      this.save.scrap += 40;
      // A MINI-BOSS GIVES A PIECE OF WHAT THE SAGE NEEDS (owner, 2026-11-21:
      // "This mini boss will give you a piece of the puzzle"). In the Conduits
      // the pieces are the vault's three seals: the CARRIER's, the swamp
      // crocodile's (swallowed), and the agent UNDERTOW's (SAGE_GIFT GB1D).
      // The vault is the way to the kingdom's sage (js/conduits-road.js).
      if (typeof K2_MINI_SIGIL !== 'undefined' && K2_MINI_SIGIL[kind] && !isHero()) this.grantRelic(K2_MINI_SIGIL[kind]);
      // THE BELL'S LAST NOTE NAMES ITS KEEPER (owner, 2026-11-25: "build the suspense about the agent,
      // hint about the agent from all of the mini bosses"): GRAVEHORN warned of the Eye's hand in this
      // kingdom; the bell, falling silent, says whose it is and where — and the ring beside the quarry wakes
      if (kind === 'chime' && typeof revisedStory === 'function' && revisedStory() && !this.save.flags.sageTame_GA1D) G.toast(t('chime_keeper'));
      // 'room' was never a real track key — resolve to the zone's own theme,
      // which is exactly what loadRoom plays for a non-boss room
      if (typeof setMusic === 'function') setMusic(G.roomDef ? (G.roomDef.mus || G.roomDef.zone) : 'A');
      return;
    }
    const grants = { glitch: 'dash', brood: 'djump', atlas: 'emp', zero: 'key' };
    if (grants[kind]) grantMod(grants[kind]);
    // WHO POINTS HER ON. The lion was the Meadows' gate (world.js A3's climb):
    // the moment it is free, the world says where the road now goes.
    if (kind === 'glitch' && typeof revisedStory === 'function' && revisedStory()) G.toast(t('conduits_open'));
    // THE CELL. Every guardian was built around one, and it comes out when the
    // guardian stops. NULLFANG's is the one that opens the shop — which is why
    // the trader is standing in the room next door and why he has been dark
    // since you walked past him.
    invAdd('batt');
    showItem(t('i_batt'), t('i_battd'));
    // …and the suit it was wearing. This is the Mega Man X loop: the thing that
    // beat you becomes the thing that beats the next one.
    // (the robot world: the volley is GRAVEHORN's now — owner, 2026-11-20,
    // "shooting ninja stars ... that's an extra skill that I should not be
    // getting from Nelfang ... Maybe the rhino" — ghGone gives it; NULLFANG
    // teaches the dash and only the dash)
    const arm = (kind === 'glitch' && !isHero()) ? null : ARM_BY_BOSS[kind];
    if (arm) {
      if (!this.save.arms) this.save.arms = [];
      if (!this.save.arms.includes(arm)) {
        this.save.arms.push(arm);
        this.save.armIdx = this.save.arms.length;   // wear it immediately
        loadoutTagCard(showItem(t('arm_' + arm), t('arm_' + arm + 'd') + '  —  ' + t('arm_how')), 'arm', arm);
      }
    }
    const tr = RELIC_TROPHY[kind];
    if (tr && !(this.save.relics || []).includes(tr)) {
      if (!this.save.relics) this.save.relics = [];
      this.save.relics.push(tr);
      this.toast(t('rl_' + tr) + ' — ' + t('rl_' + tr + 'd'));
    }
    // THE SECOND SWORD IS THE SECOND SAGE'S GIFT (owner, 2026-11-21: "getting
    // the second sword should probably happen while beating the second sage").
    // The Prowler kept Kerf's second edge clean; purified, it hands it over.
    // The hero's world keeps its old road (the seal, then the blade up the shaft).
    if (kind === 'prism' && isHero()) this.grantRelic('sigil1');
    if (kind === 'prism' && !isHero() && typeof k2GiveSecondSword === 'function') k2GiveSecondSword();
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
  persistPending = false;          // whatever was waiting is written by this one
  // The toast's deadline is on the SAME clock the frame is drawn on. It used to
  // be Date.now(), which draw then sampled directly — so a frame boundary that
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
// THE CROSSING DOES NOT WAIT FOR THE DISK. loadRoom used to persist() on the
// frame of every room change — a JSON.stringify of the whole save and a
// synchronous localStorage write, in the one frame the game is asking to feel
// continuous. Nothing about a doorway needs the write to happen THEN: the save
// object in memory is already the truth, and the disk only has to catch up
// before anything could lose it. So the crossing asks for a write and the next
// quiet moment does it — and the moments that could lose it (the tab hidden,
// the page torn down, the app backgrounded) flush whatever is still waiting.
// Any ordinary persist() in between satisfies the request as well.
let persistPending = false, persistTimer = 0;
function persistSoon() {
  if (!G.save) return;
  persistPending = true;
  if (persistTimer) return;
  const go = () => { persistTimer = 0; if (persistPending) persist(); };
  try {
    if (typeof requestIdleCallback === 'function') { persistTimer = requestIdleCallback(go, { timeout: 900 }); return; }
  } catch (e) {}
  persistTimer = setTimeout(go, 250);
}
function persistFlush() { if (persistPending) persist(); }
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('pagehide', persistFlush);
  window.addEventListener('beforeunload', persistFlush);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persistFlush();
  });
}
function loadStored(theme) {
  try {
    const v = localStorage.getItem(saveKeyFor(theme));
    // every save read from disk is brought onto the current story first
    if (v) { const sv = JSON.parse(v); return typeof migrateStory === 'function' ? migrateStory(sv) : sv; }
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
// THE STORY VERSION. 2 was Draft 2 (new games only); 3 is Draft 2 for EVERY
// save — migrateStory (js/story-opening.js) brings an older save onto it once,
// on load, so nobody testing on an old save plays the old storyline.
const STORY_VERSION = 3;
function newSave(diff) {
  return {
    v: 1, weaponVersion: 1, weaponMode: 'claws', packVersion: 1, packLv: 0,
    diff, scrap: 0, coresMax: DIFFS[diff].cores, abil: {}, crests: [], equip: [], arms: [], armIdx: 0, stars: 6,
    slots: 3, iq: 0, skills: [], relics: [], flags: {}, broken: {}, visited: {}, shop: {},
    // SHE STARTS IN THE CRADLE, not on the meadow floor. W1 is the room the
    // opening film hands her to; A0 is where the game's economy starts, two
    // rooms and two learned verbs later.
    bench: { room: 'W1', x: 96, y: 412 }, deaths: 0, lives: 0, time: 0,
    pouch: null, usedNine: false, won: false, evo: 0, pace: 0, quests: {}, culls: {}, bag: {},
    // Draft 2: Ratchet's own battery must be found in his workshop.
    // Existing saves are migrated (migrateStory); NOSTOS keeps its own rules.
    storyVersion: STORY_VERSION,
    items: isHero() ? { batt: 1 } : {},
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
  ratchetCell: { icon: '⚡', col: '#ffd76a' },
  batt: { icon: '⚡', col: '#ffd76a' },
  kit:  { icon: '✚', col: '#7dff9a' },
  coil: { icon: '◎', col: '#57a8ff' },
  cshard: { icon: '◆', col: '#dff2ff' },
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
// A PLACEMENT, NOT A SUBJECT. `ratchet` stands in two rooms — the waking floor
// and the camp by NULLFANG's door — and they are two different meetings with
// the same trader. Keying the charge on the subject alone would wake both at
// once and hand you the shop before you had earned it, so the key is the room
// as well.
//
// ...EXCEPT RATCHET, who is one machine (js/story-opening.js npcPlaced): he
// stands in his den or at the camp, never both, and one waking is his flag
// wherever he stands — so his key is always his home.
function npcKey(s) {
  if (s.extra === 'ratchet' && typeof revisedStory === 'function' && revisedStory()) return 'A0B|ratchet';
  return (s.room || G.roomId) + '|' + s.extra;
}

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
  // (owner, 2026-11-16: "his movement is looking more like a tick, like
  // someone who has ADHD. It should look more natural, standing, being elegant,
  // or being a robot or something, doing something meaningful with his stand."
  // He turned to a new angle every two or three seconds and did nothing at any
  // of them. He WORKS now — the hammer loop he was filmed with, a few strokes
  // at a time and a long stillness after (NPC_LOOP / NPC_WORK below) — and when
  // he does look round he takes his time over it.)
  // (...and between NEIGHBOURING angles only. His old beats went 0 -> 5 -> 1,
  // and on a six-angle turntable the way from 0 to 5 is through 1, 2, 3 and 4:
  // every "glance" was a whole pirouette.)
  // (...three neighbouring angles, there and back: a body that only ever shows
  // two reads as a picture being flipped — tests/folk.cjs wants every one of
  // them to actually turn — and each step is still one angle, taken slowly.)
  ratchet: [{ col: 0, t: [8.0, 13.0], work: 1 }, { col: 1, t: [4.5, 7.0] }, { col: 2, t: [4.0, 6.0] }, { col: 1, t: [4.5, 7.0] }],
  // THE CUTTER BARELY LOOKS UP. Every other body here has beats that alternate
  // work and attention; hers are almost all work, because the story is that she
  // sat down at the bottom of the world and has not moved since. The one
  // non-work beat is long and small — she checks the cut, not the room. She
  // also cannot hear anyone arrive, so nothing in her rhythm is a reaction to
  // company: the visitor rings a wire she can feel, and until then the saw is
  // the only thing happening.
  //
  // SHE STILL HAS TO TURN, THOUGH, and the first cut of these beats did not:
  // two of the three were the same column and the third was the only angle the
  // ATLAS ever drew, because a work beat plays the side-on strip instead. She
  // measured at 1.0 angles in tests/folk.cjs — the exact failure the Sage's own
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
  // KERF (§2aq, 2026-09-29). Eight drawn cells rather than the five filmed
  // clips' twenty-four: THE CUT is a push and a wait, and a held pause does not
  // want in-between frames — it wants to be held.
  kerf: 'kerfLoop',
  // RATCHET, wherever he stands outside his den: the six cells of him at work
  ratchet: 'ratchetLoop',
};
// how long a work beat plays for and how fast, per body — the same shape as
// the tinker's TINKER_JOB, and per-character for the same reason: the warden
// reading a console and the tinker welding do not move at one speed.
// HOW MANY CELLS EACH BODY'S STRIP ACTUALLY HOLDS.
//
// It was the literal 12 at the draw site, which was true of every strip when it
// was written and stopped being true the moment one was re-cut. The five job
// clips are 5.04 seconds at 24 fps — 121 filmed frames — and twelve of them
// were reaching the screen. Re-cut at 24, from the same clips, at no credit
// cost (owner: "maximizing frames for each move").
//
// This does NOT contradict the cadence note below. That note is right: more
// frames never stops a cycle reading as a cycle, and the fix for loopiness was
// bursts, varying tempo and holds. Frame count is the other axis entirely —
// whether the motion inside a burst is smooth or steps. Both were wrong; the
// cadence was fixed then, this is the other half.
//
// Ratchet's loop was cut in an earlier pass and its clip is not in the
// scratchpad any more, so he keeps his twelve until he is re-fired — which is
// exactly why this is a table and not a constant.
// ...and each number is what tools/framedupe.cjs measured that take to CONTAIN,
// not what was asked for. servo, sage and lumen really do hold 24 different
// pictures; patch's whole five seconds holds ten and mono's holds nine, and
// padding them to 24 put the same drawing on screen twice in a row nineteen
// times and twelve times. Those two takes need re-firing — they are on THE
// FIRING LIST — and until then they carry their real frames and nothing else.
// THE ORACLE STANDS LIKE SOMEBODY (owner, 2026-11-16, standing beside it: "the
// npc needs a lot of improvement to be like [Ratchet]"). It had two pictures:
// its filmed body — a CRT head over a shroud of cable, reading a tape — which
// drew only on a work beat while she was far away, and its row on the old
// turntable atlas, a pale wisp half her height, which drew whenever she was
// near enough to see it. So the one she met was always the wisp. Ratchet's
// answer (drawTinker) is this one's: the filmed body, everywhere it is awake,
// at a merchant's stature. `h` is the cell's drawn height in px; `read` the
// cells where the tape is in its hands; `fps` near her, and speaking.
// `sink` seats the frayed hem on the floor (the strands thin out before the cell's foot).
// PLATES OF ITS OWN (fired 2026-11-17, ART_QUEUE §2bv): powered down it is its
// RESTING plate — screen dead, shroud slack, one standby lamp — which IS the
// dark read, so it is not put through the dead-machine grey; spoken to, it is
// a TALKING pair (a scan-line face, a hand raised) alternating on `beat`
// seconds. `plateH` draws a plate's cell so its body is the strip's size.
const NPC_TALL = { mono: { h: 188, read: [8, 14], fps: [4, 7], sink: 9,
  rest: 'monoResting', talk: ['monoTalk1', 'monoTalk2'], beat: 0.55, plateH: 190 } };
const NPC_LOOP_CELLS = { servo: 16, mono: 15, patch: 13, sage: 11, lumen: 10, kerf: 8, ratchet: 6 };
function npcLoopCells(id) { return NPC_LOOP_CELLS[id] || 12; }
// ...and the tempo doubles with the cell count, or the same job plays at half
// speed: fps is COLUMNS a second and run is a burst measured in COLUMNS, so
// twice as many columns for the same movement needs twice as many of both to
// take the same time. The holds are seconds and do not move.
// ...and the tempo scales with each body's OWN cell count, or the same job
// plays at the wrong speed: fps is columns a second and run is a burst measured
// in columns, so a strip with twice the columns needs twice the rate to cover
// the same movement in the same time — and one with three quarters of them
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
  // a smith's hand: two or three unhurried strokes, then he looks at the piece
  ratchet: { fps: [4.5, 6.5], run: [6, 18], hold: [1.60, 3.60] },
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
  if(typeof drawRatchetRelease==='function'&&drawRatchetRelease(c,s))return true;
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
  // ...AND AT THE CAMP TOO, AND SLOWER (owner, 2026-11-20, seeing him the
  // second time: "his movement is so fast. It looks like glitching instead of
  // actually moving. It needs to be smooth, slow, chill, doing his thing
  // outside of his room"). Outside the den he used to stand cutting between
  // held plates every second, with a twitch every few: now he works his loop
  // at a gentler pace, and the twitch belongs to the den alone.
  const camp = !inDen;
  const working = !talking && !near;
  if (camp && !r.campReady) { r.campReady = 1; mediaFetch('ratchetLoop'); }
  r.t -= dt; if (!camp) r.tic -= dt;
  // the job's own clock, and it only runs while he is working: a task that
  // keeps advancing behind a tic comes back mid-stroke in the wrong stage
  if (working) tinkerTask(r, camp ? dt * 0.55 : dt);
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
      const cell = ((Math.floor(r.ph || 0) % 6) + 6) % 6;
      drew = drawStripCell(c, 'ratchetLoop', cell, 6, cx, base + 2, s.h * 3.3, face < 0);
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
// SCRAP, EXPLAINED THE FIRST TIME SHE HOLDS SOME.
//
// The tutorial said "Take the scrap / walk over it", which teaches the verb and
// not the noun — the owner's report, in full, was "I have no idea what the
// scrap is". A currency has to introduce itself, and the moment it can is the
// moment it is first picked up: she has the thing in hand, the number in the
// HUD has just moved, and the sentence has somewhere to point.
//
// Once per save, and never during a cutscene or a fight's own dialogue — the
// card takes the screen, and taking the screen mid-swing is its own bug.
function bankScrap(v) {
  G.save.scrap += v;
  if (G.save.flags.sawScrap) return;
  if (G.state !== 'PLAY' || G.dialog || G.cut || G.bossEntry || (G.boss && !G.boss.dead)) return;
  G.save.flags.sawScrap = 1;
  // ...BUT NOT IN RATCHET'S STORY (owner's order, 2026-11-14, hook review item
  // 6: fewer words after the first lessons). There her first scrap falls out of
  // the machine she has just broken on the road, the counter appears in the HUD
  // as it lands, and a minute later Ratchet names his price in it — the
  // currency introduces itself by being spent. The sentence stays for NOSTOS,
  // which has no such scene.
  if (typeof opOn === 'function' && opOn()) return;
  // A TOAST, NOT A CARD. The first version of this called showItem, which sets
  // G.state = 'DIALOG' — and a pickup happens while she is WALKING. Measured
  // on the meadow: she left A1 at 96, touched the first scrap at 323, and the
  // card took the screen with her still holding right at 340 px/s. update()
  // simulates the player only in PLAY, so she stopped there; nine harnesses
  // went red on one line, and every one of them was reporting the same thing
  // the player would have felt — the game stopping to talk in the middle of a
  // stride. A currency can introduce itself without taking the controls away.
  G.toast(t('i_scrap') + ' — ' + t('i_scraph'));
}
function healUnlocked() {
  if (typeof isHero === 'function' && isHero()) return true;
  return !!(G.save && G.save.flags && G.save.flags.heal);
}
// THE VOLT BURST IS BOUGHT, NOT INNATE (owner, 2026-09-19): "supercharge
// should be gained when the character purchases the battery pack from the
// shop — the first item the character purchases is what gives it the charging
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
  return !!(f && (f.heal || (!(G.save.storyVersion >= 2) && f.tut)));
}
// THE ONE MACHINE THAT WAS NEVER SWITCHED OFF.
//
// Every machine person in the Depths pulled its cell or had it pulled when the
// Song went out — that is why they were never infected, why they have been
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
// visibly grows and gains gear (drawn in entities.js) — announce it
// `extra` counts a guardian falling on this very frame (its flag lands after
// the cut); `quiet` fires the sting, the flash and the new silhouette but holds
// the card, which a purify film would otherwise be interrupted by — onBossDead
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
  showItem(t('m_' + id), t('m_' + id + 'd') + '  ' + t('gear_seeit').replace('%k', howToOpen('CREST', t('crest_title'))), MOD_ART[id], id);
  lessonStart(id);                                  // and then teach it
}
// THE FIRST CREST EXPLAINS ITSELF. The owner, on the crest button: "I have no
// idea what's the point of crest so far. Nobody does. So why was it created?
// How would it work? And what is the background story of it?" The system
// existed — sockets, seals, a shop that sells port width — and the story did
// not, so a player met a screen of nouns. docs/CRESTS.md is the story; the
// first seal she seats tells it, once, in the card that hands it over.
function grantCrest(id) {
  if (G.save.crests.indexOf(id) < 0) G.save.crests.push(id);
  // ...and a seal that changes how she fights says how, in plain words (C1)
  const card = loadoutTagCard(showItem(t('c_' + id), crestCardText(id)), 'crest', id);
  if (card && !(G.save.flags && G.save.flags.crestTold)) {
    if (!G.save.flags) G.save.flags = {};
    G.save.flags.crestTold = 1;
    card.lines.push(t('crest_first'), t('crest_first2'));
  }
}
// THE CARD WAITS ITS TURN (owner, 2026-10-09: nothing overlaps). It used to
// overwrite whatever dialogue was open — the conversation simply vanished. Now
// it queues behind anything on screen (js/overlay.js), opens in place of a menu
// it was bought from and hands back to it, and RETURNS the card object, so a
// caller that adds an onEnd or a line adds it to this card and not to whatever
// happens to be G.dialog at the time.
function showItem(name, desc, art, demo) {
  const card = { name: t('got'), lines: [name + ' — ' + desc], i: 0, onEnd: null,
                 art: art || null, demo: demo || null, item: true };
  persist();
  const open = () => { sfx('win'); G.dialog = card; G.state = 'DIALOG'; };
  if (typeof overlayRequest !== 'function') open();
  else if (!G.dialog && typeof CARD_RETURN !== 'undefined' && CARD_RETURN[G.state]) { card.ret = G.state; open(); }
  else overlayRequest(open, 'item');
  return card;
}

// ---------- room loading ----------
// THE MARBLE STANDS ON THE GROUND SHE STANDS ON (owner, 2026-11-15: "I just
// found a marble. It's located above the ground. The ground is tilted down
// beneath it, so I can't actually stand on top of it or next to it. I'm
// standing underneath it, which is a glitch"). Measured in the quarry: the
// pillar was spawned on tile row 15 and the cave is carved a row deeper there,
// a bowl whose surface runs 498-503 — so the stone hung 18 to 23 px in the air
// over the hollow she walks into. The same correction the rubble pile and the
// ring gates needed: a thing that stands on the floor is seated on the
// heightfield, at the LOWEST ground under its base, sunk a little so it is in
// the ground rather than on it.
function seatPillars() {
  if (typeof groundColumnAt !== 'function' || !G.statics) return;
  for (const s of G.statics) {
    if (s.type !== 'pillar') continue;
    let low = -Infinity;
    for (const ox of [0.15, 0.5, 0.85]) { const col = groundColumnAt(s.x + s.w * ox); if (col && col.length) low = Math.max(low, Math.min.apply(null, col)); }
    if (low > -Infinity && Math.abs(low - (s.y + s.h)) < 90) { s.seat0 = s.y + s.h; s.y = low - s.h + 5; }
  }
}
function spawnStatic(type, tx, ty, extra, flagKey) {
  // npc was 32x40 — a head shorter than the player's own 60px plate, and the
  // owner's read of the first one he ever met was "very small, easy to miss".
  // The machine folk stand at her scale now.
  const sizes = { swsmith: [56, 72], ferry: [56, 64], k2pole: [30, 30], item: [26, 26], bench: [44, 52], chest: [30, 24], mod: [24, 24], term: [26, 32], npc: [40, 56], riddle: [26, 36], secret: [24, 24], trial: [34, 44], vault: [40, 52], pillar: [46, 96] };
  const [w, h] = sizes[type];
  // `room` is stamped at spawn rather than read from G.roomId at use time,
  // because npcKey() must stay stable for a static that outlives a room change
  // (the pet follows, the reward queue drains a room late) — and because a key
  // that depends on when you ask it is not a key.
  const actor = { type, room: G.roomId, x: tx * TILE + (TILE - w) / 2, y: ty * TILE - h, w, h, extra, flagKey, opened: !!(flagKey && G.save.flags[flagKey]), t: rnd(0, 9) };
  if (type === 'npc') Object.assign(actor, {hp:100, hpMax:100, defense:100, attackPower:0, attackSpeed:0, friendly:true});
  G.statics.push(actor);
}
function settlePendingBossReward() {
  if (G.boss && G.boss.dead && G.boss.rewardPend) {
    G.boss.rewardPend = false; G.onBossDead(G.boss.kind);
  }
}
function loadRoom(id) {
  if(typeof ratchetReleaseFinish==='function')ratchetReleaseFinish(false);
  if (typeof purificationCancel === 'function') purificationCancel();
  infEyeClearAll();                 // no smoke follows her through a door, a respawn or a load
  // (a door's wake belongs to its room: it does not follow her out, nor does the camera's hold on it)
  if (G.ringWake) G.ringWake = null;
  if (typeof cam !== 'undefined' && cam) cam.peek = null;
  repairClose(false);
  settlePendingBossReward();
  if (typeof npcVoxStopAll === 'function') npcVoxStopAll();   // voices stay in their rooms
  // A ROOM CROSSING EATS A STILL-HELD "UP". Touch's stick and a gamepad's
  // button/axis both derive their edge from ONE poll of "was this already
  // down" (touch.js tSetK checks keys[code]; pollGamepad checks GP_PREV) —
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
  if (typeof k2RoomLoaded === 'function') k2RoomLoaded(id);   // the swamp's raft and its insects (conduits-road.js)
  if (typeof swRoomLoaded === 'function') swRoomLoaded(id);   // the sewer's lift and its air (sewer.js)
  G.enemies = []; G.projs = []; G.pickups = []; G.statics = []; G.boss = null; G.crescents = [];
  // a called wolf stays in the room it was called to — unless she is riding it (js/wolfmount.js)
  if (!(G.mount && G.mount.w && G.mount.w === G.packWolf)) { G.packWolf = null; G.mount = null; }
  G.boomer = null;   // a thrown blade never crosses a room line — it is back in her paw
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
  // long before it stirs — the silhouette is a safety net, not a plan
  setTimeout(() => {
    if (G.boss && typeof BOSS_ART !== 'undefined' && BOSS_ART[G.boss.kind]
        && typeof mediaFetch === 'function') mediaFetch(BOSS_ART[G.boss.kind]);
    // ...and the lion's filmed moves, so the first swipe is the take and not
    // the rig popping into the take a second later
    if (G.boss && G.boss.kind === 'glitch' && typeof BEAST_STRIPS !== 'undefined'
        && typeof mediaFetch === 'function') for (const k of BEAST_STRIPS) mediaFetch(k);
    // ...and his voice: the recorded lion is asked for with his art, so the first roar of the
    // fight is the real one and not the stand-in a not-yet-loaded sound falls back to
    if (G.boss && G.boss.kind === 'glitch' && typeof NF_LION !== 'undefined' && typeof mediaAudio === 'function')
      for (const bank of Object.values(NF_LION)) for (const k of bank) mediaAudio(k);
  }, 0);
  parts.length = 0;
  const def = ROOMS[id];
  // a save that already holds the marble met a quarry GRAVEHORN had left
  if (typeof ghMigrate === 'function') ghMigrate(G.save);
  def.ents.forEach((d, i) => {
    let [kind, tx, ty, extra, cond] = d;
    // a retired entity: its slot is kept because the ORDER of a room's entities
    // is a save key (world.js, SAVE POINTS ARE FOR CRITICAL PLACES)
    if (kind === 'gone') return;
    // The first target is an automatic scrap-yard defence, not a person.
    if (!isHero() && G.save.storyVersion >= 2 && id === 'A0' && kind === 'crawler') kind = 'turret';
    if (cond && !G.save.flags[cond]) return;
    // one Ratchet: he stands in his den until the blade is forged, then at the camp
    if (kind === 'npc' && typeof npcPlaced === 'function' && !npcPlaced(id, extra)) return;
    if (EKIND[kind]) {
      const k = EKIND[kind];
      const storyKey = !isHero() && G.save.storyVersion >= 2 ? id + ':' + i + ':' + kind : null;
      const rescueState = storyKey && G.save.rescues && G.save.rescues[storyKey];
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
        if (!rescueState && kind !== 'sage' && keep < 1 && ((i * 2654435761) % 1000) / 1000 > keep) return;
      }
      const en = !isHero() && G.save.storyVersion >= 2 && id === 'A0' && kind === 'turret'
        ? new YardWinch(tx * TILE + (TILE - k.w) / 2, ty * TILE - k.h)
        : new Enemy(kind, tx * TILE + (TILE - k.w) / 2, ty * TILE - k.h);
      if (kind === 'turret' && typeof mountTurret === 'function') mountTurret(en);
      en.actorRole = STORY_ACTOR_ROLES[kind]; en.storyKey = storyKey;
      if (rescueState === 'disabled') { en.disabled = true; en.hp = 1; }
      if (rescueState === 'rescued') { en.rescued = true; en.calm = true; en.hypnoT = 1e9; }
      // a purified sage STAYS purified: the tame is a save fact, re-applied
      // at spawn, so leaving the chamber never re-infects it
      if (kind === 'sage' && G.save.flags['sageTame_' + id]) { en.tame = 1; en.calm = true; en.pureM = 1; }
      // ...and so does the quiet it promised. "I will keep this end quiet" was a
      // line with nothing behind it: the tunnel she walked back out through was
      // as hostile as the one she walked in through, which is the audit's note
      // against comic page 26. A purified sage's own network wakes calm — they
      // potter, their sensors burn cyan, and they will not touch her. Re-applied
      // at spawn from the save fact, exactly like the sage's own tame, so it
      // survives leaving the cave and loading it again a week later.
      if (kind !== 'sage' && typeof sageQuietHere === 'function' && sageQuietHere(id)) {
        en.calm = true; en.hypnoT = 1e9;
        // ...and the ones that were people wear the cure's circle: freed, not
        // merely quiet, and no stray swing can undo that (storyProtected)
        if (en.actorRole === 'infected-person') { en.rescued = true; en.disabled = false; }
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
      // TALONHOST IS NOT HOME until she can throw (js/conduits-road.js): the
      // eagle's hall in the Conduits stands empty on the way to the vault
      if (typeof k2BossAway === 'function' && k2BossAway(extra)) return;
      if (!G.save.flags['boss' + extra.charAt(0).toUpperCase() + extra.slice(1)])
        G.boss = new Boss(extra, tx * TILE, ty * TILE);
    } else if (kind === 'chest') {
      spawnStatic('chest', tx, ty, extra, 'ch_' + id + '_' + i);
    } else if (kind === 'mod') {
      if (!G.save.abil[extra]) spawnStatic('mod', tx, ty, extra);
    } else if (kind === 'item') {
      // an errand's object. It exists in exactly one place in the world, and
      // once it is in the bag it does not come back.
      // ...and only while an errand is waiting for it (questItemLive)
      if (typeof questItemLive === 'function' ? questItemLive(extra) : !(G.save.bag && G.save.bag[extra]))
        spawnStatic('item', tx, ty, extra, null);
    } else if (kind === 'riddle') {
      spawnStatic('riddle', tx, ty, extra, nodeKey(extra));
    } else if (kind === 'secret') {
      // (the Foundry's hidden seal belongs to the hero's road; in the robot
      // world the Conduits' own fights carry all three — js/conduits-road.js)
      if (extra === 'sigil3' && !isHero()) return;
      if (!(extra === 'connector' && isHero()) && !G.save.flags['sr_' + extra]) spawnStatic('secret', tx, ty, extra);
    } else if (kind === 'pillar') {
      // the crystal pillar is quarried once per save — the shard in the bag
      // IS the pillar now, and a pillar that regrew would un-tell the story
      if (!G.save.flags['pl_' + (extra || 'cshard')]) spawnStatic('pillar', tx, ty, extra || 'cshard');
    } else {
      if (kind === 'k2pole' && typeof k2PoleLive === 'function' && !k2PoleLive()) return;
      spawnStatic(kind, tx, ty, extra, kind === 'term' ? null : null);
    }
  });
  // THE FIRST THING SHE FIGHTS (TUT_STEPS 'claw'): one small empty construct on
  // the road between the jump and the gates — a slag mite, the little half a
  // blob bursts into, which is the smallest hostile body the game has art for.
  // Not a person (STORY_ACTOR_ROLES: an empty construct, so it breaks and stays
  // broken and nothing waits to be cleansed), two swipes of hp, and it does not
  // drip: it crawls at her and it stings, which is all a first enemy should
  // know how to do. Once per save (flags.firstKill), and only in Ratchet's
  // story — the hero's world wakes differently.
  if (id === 'W2' && typeof opOn === 'function' && opOn() && !G.save.flags.firstKill
      && !G.save.flags.gateOpened && !G.save.flags.ratchetRepaired && !G.save.flags.tut) {
    // ON LEVEL GROUND (owner, 2026-11-15: "the enemy is set up on the top of a
    // hill, which is a very bad location to start with"). It stood at tile 23,
    // which is the far slope of the mound the jump lesson climbs — her first
    // fight was a small body above or below her on a ramp (the floor 40 px
    // either side of it was 35 px off its feet). The road past that mound
    // rolls the whole way to the gates; its one level stretch is the low
    // terrace at x 928-1040 — 110 px of floor that varies by 3 px — so that is
    // where it waits, in the middle, and it is LEASHED there (tutStep): it
    // shuffles at her and never leaves the flat. She walks up to it and fights
    // it standing on the same level it is.
    const m = new Enemy('blob', 30 * TILE + 14, (def.h - 2) * TILE - 16);
    m.w = 20; m.h = 15; m.hp = 12; m.mini = true; m.firstFoe = true;
    m.homeX = m.x;
    m.dir = -1; m.dripT = 1e9;               // it never pools the floor
    m.moves = []; m.traits = [];
    m.actorRole = 'empty-construct';
    G.enemies.push(m);
  }
  // THE MACHINE FOLK STAND ON THE GROUND SHE STANDS ON. A static is placed on
  // the tile grid, but the floor she walks is the heightfield (groundColumnAt),
  // which rides up to a couple of dozen px above the grid in the meadow — so
  // Old Servo's treads were buried 18 px under the grass she stood on beside
  // him. Lift each person onto the curve where it has added material over the
  // very floor they were placed on; never down, and never onto a ledge.
  for (const s of G.statics) {
    if (s.type !== 'npc') continue;
    const gc = groundColumnAt(s.x + s.w / 2);
    if (gc && Math.abs(gc[1] - (s.y + s.h)) < 1 && gc[0] < gc[1] && gc[1] - gc[0] <= 28) s.y -= gc[1] - gc[0];
  }
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
  if (typeof beastPreload === 'function') beastPreload(ROOMS[id] && ROOMS[id].zone, ROOMS[id]);
  // the machine lets go of her the first time she stands in the room it kept
  // her in, and never again
  if (id === 'W1' && typeof wakeStart === 'function') wakeStart();
  if (player) player.oathUsed = false;      // the lion owes her once per room
  G.save.visited[id] = 1;
  if (typeof questVisit === 'function') questVisit(id);
  rubbleInit();          // the buried mouth, if this room has one
  ringGateWant();        // ...and the ring at every door this room has, built yet or not
  seatPillars();         // ...and the marble on the ground under it, not on its tile row
  // THE BAKED FLOOR COMES FROM THE ROOM'S OWN CACHE. Rebuilding it on every
  // crossing — even into the room she just left — was most of the hitch at a
  // doorway (see TILE CACHE below); a room baked ahead of her arrives baked.
  tileUse(id);
  G.vlink = vlinkFor(id);  // the rooms directly above and below, as solid ground
  G.climb = null;          // a ledge arc belongs to the room it was planned in
  // ---- WALKING INTO A GUARDIAN'S CHAMBER --------------------------------
  // It used to be a doorway like any other: full brightness, the kingdom's
  // theme still playing, and a boss-sized shape asleep in the corner. The room
  // is held DARK for a beat and brought up — she is standing in a chamber where
  // something has been sleeping, and the light finds it — while the theme
  // cross-fades underneath. Her controls are hers again the moment the lights
  // are up; the hold is short enough to read as staging, not as a cutscene.
  G.bossEntry = null; G.ghHold = null; G.ghCard = null;
  if (G.boss && !G.boss.dead && G.boss.st === 'dorm') {
    G.bossEntry = { t: 0, dur: 2.3 };
    setMusic('boss_' + G.boss.kind);
  } else {
    setMusic(def.mus || def.zone);
  }
  // named for the kingdom the room lies in, not its palette (world.js zoneLabelKey)
  { const zk = typeof zoneLabelKey === 'function' ? zoneLabelKey(id) : 'z_' + def.zone;
    if (zk !== G.lastZone) { G.zoneToast = { text: t(zk), t: 2.6 }; G.lastZone = zk; } }
  cam.x = 0; cam.y = 0; cam.room = null; cam.extUp = 0; cam.extDn = 0; cam.soft = 0;
  persistSoon();           // the next quiet moment writes it; see persistSoon
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
  // the opening teaches one thing at a time, and SKILLS is not one of them:
  // the nudge waits until the walk is behind her (js/opening.js sends it)
  if (G.tut && G.save && G.save.flags && !G.save.flags.tut) { G.iqNudgeLater = 1; return; }
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
  if(typeof ratchetReleaseFinish==='function')ratchetReleaseFinish(false);
  repairClose(false);
  // A run's pending reward belongs to THAT save, never the next one. Keep
  // same-object resumes legitimate; menu Quit settles before its saved copy
  // is reloaded. Ordinary room changes retain loadRoom's reward safety net.
  if (save === G.save) settlePendingBossReward();
  G.boss = null;
  // Reset before loadRoom so its NEW arrival wake/tutorial is not erased.
  // Previously a paused reward's impact panel and dash lesson followed a
  // restart into the cradle, even though the new cat owned no dash.
  G.impact = null; G.flash = 0; G.hitStop = 0; G.rings = []; if (typeof clearBossVfx === 'function') clearBossVfx();
  if (typeof FXGL !== 'undefined') FXGL.list.length = 0;
  G.lesson = null; G.brDelta = null; G.elemPop = null; G.songWave = null;
  G.dialog = null; G.toasts = []; G.zoneToast = null; G.lastZone = ''; G.menuMsg = null; G.sceneCaps = null;
  if (typeof overlayClear === 'function') overlayClear();
  G.tut = null; G.wake = null; G.meet = null; G.break = null; G.trans = null; G.gateWalk = null;
  G.coreFlash = null; G.coresFullT = 0; G.bolt = null;
  cam.shake = 0;
  migrateWeapons(save);
  if (typeof questMigrate === 'function') questMigrate(save);   // MIS-01: the survey errand's old visit residue
  save.iq = save.iq || 0; save.skills = save.skills || []; save.relics = save.relics || [];
  G.save = save;
  if (typeof qualRestore === 'function') qualRestore();  // the player's own call outranks the guess
  applyTheme();
  if (typeof bossOrderApply === 'function') bossOrderApply();     // the world's own sage order (types.js)
  if (typeof k2Migrate === 'function') k2Migrate(save);           // the Conduits' new road (conduits-road.js)
  if (typeof sewerApply === 'function') sewerApply(save);         // UNDERTOW's caves are a sewer in this world (sewer.js)
  // no saved bench may stand inside a place the story has not opened yet
  // (js/progress.js) — a hand-edited or pre-gate save wakes at the camp
  if (typeof progressBenchGuard === 'function') progressBenchGuard(save);
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
  if (typeof progressBenchGuard === 'function') progressBenchGuard(G.save);
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
  if (G.save.pouch) G.toast(t('pouch') + '  (' + t(typeof zoneLabelKey === 'function' ? zoneLabelKey(G.save.pouch.room) : 'z_' + ROOMS[G.save.pouch.room].zone) + ')');
  G.state = 'PLAY';
}
function bossActive() { return G.boss && !G.boss.dead && G.boss.st !== 'dorm' && !G.boss.meet; }
// THE NAME OVER THE BAR. The six guardians have a `b_<kind>` line; the Alpha
// and the Eye's five constructs never did, and t() hands back the key when it
// has nothing — so the bar over the Alpha read "b_alpha" and the one over the
// chime read "b_chime". Found by tools/castreel.cjs, the first time every boss
// was filmed in one sitting. The Alpha has its own name line; a construct's
// name is the head of its meeting toast ("CHIME — it is singing at you").
function bossBarName(b) {
  const k = 'b_' + b.kind, s = t(k);
  if (s !== k) return s;
  if (b.kind === 'alpha') return t('alpha_name');
  const mk = 'mini_' + b.kind, m = t(mk);
  return m !== mk ? m.split(' — ')[0] : b.kind.toUpperCase();
}

// ---------------------------------------------------------------------------
// THE FIRST MEETING (.claude/skills/underdog-arc §2.1; staged per
// .claude/skills/manga-direction). She must meet something that swats her
// aside and walks away, early, and survive it by being outclassed rather than
// by losing — so the whole game after it is "come back for that". It costs one
// crest of one room and one flag, and A4 becomes the rematch for free.
//
// Staged as an impact triple with a silence on each side, not as text:
//   fall    it drops out of the sky east of her on the A2 crest — geography
//   land    the silence: music gone, controls gone, it walks up to her
//   wind    the paw rises, held a hair too long (beat 1 of the hit)
//   swipe   the flash — hit-stop, white, the frame stops (beat 2)
//   watch   the aftermath: she is thrown the length of the mound and it
//           stands and looks (beat 3 — the frame that carries the information)
//   coil    it gathers, bored of her
//   leave   and bounds east out of the room, toward where she will meet it again
// She keeps at least one core: this is a survival, never a scripted death.
// ---------------------------------------------------------------------------
// A CANNON IS BOLTED TO SOMETHING (owner, 2026-11-14: "a floating canon that
// does not make any sense"). A turret has no gravity — it fires from where the
// room list put it — so one authored a row or two off its ledge, or over open
// air, hangs there for the rest of the game. Six did (A6, B7, C5, C6, D5, E5).
// At spawn, a turret with nothing solid under its feet is moved to the nearest
// surface that could carry it: a solid tile with open air above it (never a
// hazard rail), within eight columns, dropping preferred over climbing so it
// lands on the ledge it was written above rather than the one over its head.
// A turret already standing on something is not touched.
function mountTurret(en) {
  if (!G.grid || !en) return;
  const sol = (tx, ty) => { const ch = tileAt(tx, ty); return ch === '#' || ch === '=' || ch === 'B'; };
  const H = G.grid.length, W = G.grid[0].length;
  const tx0 = Math.floor((en.x + en.w / 2) / TILE), ty0 = Math.round((en.y + en.h) / TILE);
  if (sol(tx0, ty0)) return;
  let best = null, bd = 1e9;
  for (let dx = -8; dx <= 8; dx++) {
    const tx = tx0 + dx;
    if (tx < 1 || tx >= W - 1) continue;
    for (let ty = 1; ty < H; ty++) {
      if (!sol(tx, ty)) continue;
      const up = tileAt(tx, ty - 1);
      if (up === '#' || up === '=' || up === 'B' || up === '^') continue;   // buried, or a trap's own bed
      const dy = ty - ty0;
      const d = Math.abs(dx) + (dy >= 0 ? dy * 0.6 : -dy * 1.4);
      if (d < bd) { bd = d; best = { tx, ty }; }
    }
  }
  if (!best) return;
  en.x = best.tx * TILE + (TILE - en.w) / 2;
  en.y = best.ty * TILE - en.h;
}
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
  G.meet = { t: 0, ph: 'fall', hit: false, interactive: !isHero() && G.save.storyVersion >= 2 };
  G.save.flags.nfMeet = 1;                    // set as it begins: a reload mid-beat keeps the sentence
  // ...and the hub's floor stops being rock: the hatch, its fracture and its
  // light exist from this moment (pgHubSealed), so the tile layer and the
  // ground curve are re-read
  tileDirty = true; if (typeof surfRoom !== 'undefined') surfRoom = null;
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
      b.vy = 0; b.vx = 0; b.st = 'stalk'; M.ph = 'settle'; M.t = 0;
      cam.shake = Math.max(cam.shake, 12); beastSound('arrive'); dust(14, b.w * 0.6);
      if (typeof padRumble === 'function') padRumble(0.8, 0.6, 400);
      G.flash = Math.max(G.flash, 0.12);
    }
  } else if (M.ph === 'settle') {
    // IT LOOKS AT HER, AND THEN IT ROARS (owner, 2026-11-16: "First time
    // Nullfang shows he should actually roar and stun me with it. Make it
    // intimidating"). It used to land and stroll over. Now there is half a
    // second of it simply looking, and then the inhale.
    b.face = pcx < b.cx() ? -1 : 1; b.vy += 1700 * dt; b.vx = 0; moveEnt(b, dt);
    if (M.t > 0.25) { b.st = 'roar'; b.t = 1.25; b.roared = false; M.ph = 'roar'; M.t = 0; sfx('tellbig'); }
  } else if (M.ph === 'roar') {
    b.vx = 0; b.vy += 1700 * dt; moveEnt(b, dt); b.t -= dt;
    if (!b.roared) {
      // the inhale: the ground's loose grit lifts toward it, light gathers in the throat
      if (chance(0.7)) addPart(b.cx() + rnd(-110, 110), b.y + b.h - 4, rnd(-15, 15), rnd(-90, -30), 0.5, '#8a8a96', 2, -60);
      if (chance(0.8)) { const oa = rnd(0, 6.28), or2 = rnd(28, 54);
        addPart(b.cx() + b.face * 30 + Math.cos(oa) * or2, b.cy() - 6 + Math.sin(oa) * or2, -Math.cos(oa) * 100, -Math.sin(oa) * 100, 0.3, '#b06aff', 2.5, 0, true); }
      if (b.t <= 0.75) {
        b.roared = true;
        // THE ROAR. The whole frame takes it: the picture bows as the wave
        // passes (ripple.js), the camera is thrown, the pad shakes — and she
        // is STUNNED where she stands, staggered a step back from it, for
        // long enough to understand what she has walked into. The stun is
        // over before the paw comes up: the swipe that follows is still hers
        // to run from.
        cam.shake = Math.max(cam.shake, 20); G.flash = Math.max(G.flash, 0.3); G.hitStop = Math.max(G.hitStop, 0.1);
        beastSound('roar'); if (typeof padRumble === 'function') padRumble(1, 0.9, 900);
        if (typeof roarWave === 'function') roarWave(b.cx() + b.face * 30, b.cy() - 10, '#b48cff');
        if (typeof shockRipple === 'function') {
          shockRipple(b.cx() + b.face * 30, b.cy() - 10, { R: 760, dur: 1.15, amp: 30, width: 70, col: '#b06aff', fronts: 4, gap: 0.12, nudge: 7, pulse: 0.22 });
        }
        if (typeof fx === 'function') for (const sd of [1, -1])
          fx('cone', b.cx() + sd * 30, b.cy() - 12, { rx: 420, ry: 260, dur: 0.9, flip: sd < 0, col: '#b48cff', hot: '#ffffff', power: sd === b.face ? 1.5 : 0.8 });
        dust(18, b.w * 0.8);
        if (!player.dead) {
          const away = pcx < b.cx() ? -1 : 1;
          player.stunT = Math.max(player.stunT || 0, 1.15); player.dizzyT = Math.max(player.dizzyT || 0, 1.3);
          player.hurtPoseT = Math.max(player.hurtPoseT || 0, 0.9);
          player.vx = away * 300; player.vy = Math.min(player.vy, -150);
          player.swing = null; player.chargeT = 0;
        }
      }
    }
    if (b.t <= 0) { b.st = 'stalk'; M.ph = 'land'; M.t = 0.5; }       // ...and then it walks up to her
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
      G.impact = { t: 0.3, t0: 0.3, x: pcx, y: pcy, hurt: 1 };
      if (typeof padRumble === 'function') padRumble(1, 0.9, 600);
      beastSound('swipe'); sfx('hit');
      burst(pcx, pcy, 22, '#b06aff', 320, 0.5, 200, 3, true);
      burst(pcx, pcy, 12, '#ffffff', 200, 0.4, 0, 2, true);
      // it costs her something — one core — and never the last one
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
      setMusic(G.roomDef.mus || G.roomDef.zone);
      persist();
      // the hatch has just come into being behind her (progress.js pgHubSealed):
      // say where, once, while she is still looking east after the lion
      if (typeof pgRobo === 'function' && pgRobo() && !G.save.flags.crystal && typeof pgHubBroken === 'function' && !pgHubBroken())
        G.toast(t('pg_hub_wakes'));
    }
  }
  beastMotionEnd(b, dt);
}


// ===========================================================================
// THE DEMO BOUNDARY — where the free version stops, and says so properly.
//
// THE WEB IS NEVER STOPPED (owner, 2026-11-25): "as long as we're on the web app, all people
// who access the web are actually testers. So even if it shows it's a paid version or buy it or
// whatever, which will direct users later on for the full version, depending on their platform,
// still users on the link can access the second kingdom and all other kingdoms freely." So the
// boundary can only ever close on a STORE build — the packaged phone app or the desktop shell —
// whose save has no entitlement. The web page, http or https, walks on through every kingdom,
// whatever DEMO_OFFER says. (Until 2026-11-25 this was the other way round: the web was the demo
// and a package was the bought copy.)
//
// When it does close, the end has to feel like a chapter closing rather than the game breaking.
//
// WHERE IT ENDS is derived, never listed. Any exit that leaves DEMO_ZONE is the
// boundary — which today is exactly one edge, the frontier road's east edge (A14 -> B1), past
// NULLFANG's door — and which stays correct if the world is ever re-plumbed. A hard-coded room
// id would be a second copy of the map that somebody has to remember to update.
//
// The player gets the whole first kingdom to that point: waking in the cradle,
// the walk to the gates, the first machine folk, the purifier, the Alpha and
// its pack, and NULLFANG. Two boss fights and an ending, which is what makes
// this a chapter and not a wall. Stopping mid-corridor would read as a fault.
//
// ONE BUILD STILL, and that is deliberate (RULE ONE). This is not a demo BUILD;
// it is the same file everywhere, deciding at run time (demoStore: Capacitor, file:, capacitor:,
// or the desktop shell's app:).
//
// `G.save.full` is the hook each store's entitlement will hang off later: whatever proves a
// purchase on that platform sets that flag and the same package becomes the whole game.
//
// AND IT IS OFF UNTIL THE OWNER SWITCHES IT ON. Flipping DEMO_OFFER to true is
// a product decision with a store page behind it, not a code change, so the
// default cannot be the one that quietly truncates a game that is already live.
const DEMO_ZONE = 'A';
// (a `let` so a harness can throw the switch both ways; nothing in the game assigns it)
let DEMO_OFFER = false;
// Where the full game is sold. Empty until there is a page to point at — the
// screen then says the game continues without offering a link that 404s.
const DEMO_URL = '';
// a store build: the packaged phone app, or the desktop shell
function demoStore() {
  return (typeof window !== 'undefined') &&
    (!!window.Capacitor || location.protocol === 'file:' || location.protocol === 'capacitor:' || location.protocol === 'app:');
}
// stop at the threshold: ONLY a store build, with the offer on and no entitlement on the save
function demoOn() {
  if (!DEMO_OFFER) return false;
  if (!demoStore()) return false;                     // the web: everyone on the link is a tester
  if (G.save && G.save.full) return false;            // bought on that platform
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
// THE END OF THE FIRST KINGDOM (owner, 2026-11-25: "You can show it as end of, okay, or
// something catchy for the first kingdom. And moving on to the next one. The quest is still
// going. And then it shows the payment or whatever gate or the message."). The first time she
// reaches the threshold out of the free kingdom (the frontier road's east edge, A14 -> B1; in
// NOSTOS its own climb), once per save: a card on the dimmed world, the demo end screen's look —
// the kingdom is purified, the quest goes on. Few words, no comic, nothing drawn round anything;
// any button after half a second skips it and it closes itself at K1_END.T. THEN the gate: on a
// store build without the game, with the offer on, the end-of-chapter screen (demoStop: get the
// game / stay); anywhere else she walks on through the edge she was crossing. On the web with the
// offer on, the card carries one more line, once: the game goes on here, free for testers.
const K1_END = Object.freeze({ min: 0.5, T: 3.6 });
function k1EndDue(dest) {
  const a = ROOMS[G.roomId], b = ROOMS[dest];
  return !!(a && b && G.save && G.save.flags && a.zone === DEMO_ZONE && b.zone !== DEMO_ZONE && !G.save.flags.k1End
    && !(G.save.visited && G.save.visited[dest]));       // (a save already past it is not told again)
}
function k1EndShow(side, dest) {
  G.k1End = { t: 0, side, dest, tester: !!DEMO_OFFER && !demoStore() };
  G.state = 'KEND';
  sfx('ok');
}
function updateK1End(dt) {
  const k = G.k1End;
  if (!k) { G.state = 'PLAY'; return; }
  k.t += dt;
  const skip = k.t > K1_END.min && (inP('OK') || inP('ATK') || inP('JUMP') || inP('BACK'));
  if (!skip && k.t < K1_END.T) return;
  G.save.flags.k1End = 1; persist();
  G.k1End = null; G.state = 'PLAY';
  // ...then the gate, on a store build without the game; anywhere else she is still in the
  // doorway she was crossing, and the next frame carries her through it
  if (demoWall(k.dest)) demoStop(k.side);
}
function drawK1End() {
  const k = G.k1End; if (!k) return;
  drawWorldFrame();
  const a = Math.min(1, k.t / 0.35);
  c.fillStyle = 'rgba(3,7,12,' + (0.86 * a).toFixed(3) + ')'; c.fillRect(0, 0, 960, 540);
  c.save(); c.globalAlpha = a;
  ftxt(t('k1_end1'), 480, 228, 40, '#aef7d8');
  c.globalAlpha = Math.max(0, Math.min(1, (k.t - 0.6) / 0.4));
  ftxt(t('k1_end2'), 480, 290, 21, '#cfe3ef');
  if (k.tester) ftxt(t('k1_end_web'), 480, 336, 16, '#8aa2b5');
  c.restore();
}
// ONE GEOMETRY, used by the drawing AND by touch. Written out separately they
// drift, and a screen whose buttons are somewhere other than where they are
// painted is the exact failure tests/tap.cjs exists for.
function moreLayout() {
  const rows = [DEMO_URL ? 'demo_get' : 'demo_soon', 'demo_stay'];
  return { rows, y0: 372, step: 54, w: 420, h: 44 };
}

// ---------- the way back from a hazard ----------
// SHOWN, NOT DONE TO HER (owner, 2026-11-16: "there was a glitch here. When I
// dropped down, I actually went up. So dropping down here, or dropping down at
// the lowest cave, lifted me back up like a loop... We are in a closed
// universe"). It was not a loop: the spikes at the bottom of the shaft cost her
// a core and put her back on the last safe ground she stood on — the ledge she
// had dropped FROM — in one frame, with nothing between the two pictures. A
// fall that ends above where it started, with no cut, is exactly what a wrapped
// world looks like. So it is a beat now: the frame goes dark, she is set down,
// it comes back, and the first time it is said in words what happened.
function hazardRescue(p) {
  if (!p || p.dead || G.rescue) return;
  G.rescue = { t: 0, T: 0.7, at: 0.24, done: false, x: p.lastSafe.x, y: p.lastSafe.y, hx: p.x, hy: p.y };
  p.vx = 0; p.vy = 0; p.stunT = Math.max(p.stunT || 0, 0.7); p.iT = Math.max(p.iT || 0, 1.6);
  if (G.save && G.save.flags && !G.save.flags.hzTold) { G.save.flags.hzTold = 1; G.toast(t('hz_back')); }
}
function hazardRescueStep(dt) {
  const r = G.rescue; if (!r) return;
  r.t += dt;
  if (!r.done) {
    player.x = r.hx; player.y = r.hy; player.vx = 0; player.vy = 0;       // held where it caught her, in the dark
    if (r.t >= r.at) {
      r.done = true; player.x = r.x; player.y = r.y; player.on = true;
      if (typeof updateCam === 'function') updateCam(player.x, player.y, G.roomDef.w * TILE, G.grid.length * TILE, 1);
      sfx('land');
    }
  }
  if (r.t >= r.T || player.dead) G.rescue = null;
}
function drawHazardRescue() {
  const r = G.rescue; if (!r) return;
  const a = r.t < r.at ? r.t / r.at : 1 - (r.t - r.at) / (r.T - r.at);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = clamp(a, 0, 1); c.fillStyle = '#05060a';
  c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.restore();
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
    if (!G.rescue) { player.hurt(1, player.x); if (!player.dead) hazardRescue(player); }
    player.vx = 0; player.vy = 0; player.y = Math.min(player.y, H + 60);
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
  // THE SHAFT IS ONE PLACE (VERTICAL LINKS, below): where the room above or
  // below can take her without a cut, the line is crossed when her CENTRE
  // crosses it — she is already standing in the neighbour's geometry by then —
  // and the room changes underneath an unbroken camera.
  const cyc = player.y + player.h / 2;
  let seam = null;
  if (cyc < 0 && ex.T && vlinkSeamless('T') && vlinkOpenAt('T', player.x + player.w / 2, cyc)) seam = 'T';
  else if (cyc > H && ex.B && vlinkSeamless('B')) seam = 'B';
  if (seam) side = seam;
  else if (player.x + player.w < -2 && ex.L) side = 'L';
  else if (player.x > W + 2 && ex.R) side = 'R';
  else if (player.y + player.h < -2 && ex.T) side = 'T';
  else if (player.y > H + 40 && ex.B) side = 'B';
  // THE SKY IS NOT A DOOR. With the lid open (js/world.js skyLid) a jump can
  // rise past the frame anywhere, but the way UP is still the authored
  // opening the sky remembered — a T crossing keeps her x, so triggering it
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
    if (player.y > H + 40 && !ex.B) { if (!G.rescue) { player.hurt(1, player.x); if (!player.dead) hazardRescue(player); } player.vy = 0; player.y = Math.min(player.y, H + 60); }
    return;
  }
  let dest = ex[side], at = null;
  if (typeof dest === 'object') {
    // {flag, to} gates a door behind a power; {to, at} carries an ARRIVAL
    // COLUMN for a vertical pair whose rooms cannot align by width — V2's
    // way up arrives through the hole she cut in B2's floor, not at her
    // own x in a hall twice as wide as the vault
    if (!exitOpen(dest)) { refuseCrossing(side, dest.why); return; }
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
    if (!G.storyGateAt || G.save.time - G.storyGateAt > 4) {G.toast(storyHint);G.storyGateAt=G.save.time||0.001;}
    return;
  }
  if (k1EndDue(dest)) { k1EndShow(side, dest); return; }
  if (demoWall(dest)) { demoStop(side); return; }
  // THE WAY UP ENDS ON A LEDGE OR IT DOES NOT HAPPEN (owner's rule). Rising
  // into the room above, she is carried onto the nearest floor she can stand
  // on beside the hole; if the room above offers none — an unbroken hatch, a
  // sealed kernel — the opening is a ceiling, not a door that drops her back.
  // X1's live Prowler places her on its own bridge and keeps that staging.
  if (side === 'T' && !(dest === 'X1' && roomHasLiveBoss('X1'))) {
    const arr = seam ? vlinkArrival('T', player.x, player.y)
                     : topArrival(dest, at, player.x);
    if (!topLedge(dest, arr.x, arr.y, Math.sign(player.vx) || player.face)) {
      player.y = Math.max(player.y, -player.h / 2 + 1);
      if (player.vy < 0) player.vy = 0;
      return;
    }
  }
  if (seam) { vlinkHandover(seam, dest); return; }
  G.trans = { t: TRANS_DUR, to: dest, side, at, half: false };
  // HOLD THE PICTURE NOW, not at draw time. The loop runs a fixed step and may
  // call update() several times in one frame (SIM_STEP/SIM_MAX), so the frame
  // that creates a crossing is often the same frame that applies it — by the
  // time the renderer looked, the old room was already gone and the slide had
  // nothing to slide. The canvas still holds the last frame drawn, and the
  // last frame drawn is the room she is leaving.
  transSnap = transHeld ? transCv : null;
}
// A GATED CROSSING. `flag` names what opens it, `blade` asks for the forged
// sword as well, `robo` keeps it to the robot story (NOSTOS has its own
// route), and `why` is the line she is told when it refuses — a door that
// silently ignores her is a dead input. A gate she has already been through
// stays open: the only way into the room beyond was this door, so a save that
// has stood there earned it (an older save that crossed before the gate
// existed keeps its road home).
function exitOpen(d) {
  if (d.robo && isHero()) return true;
  if (G.save.visited && G.save.visited[d.to]) return true;
  // `or`: other flags that mean the same thing was already earned — a save
  // that has silenced the bell has been past the bell's gate
  if (d.flag && !G.save.flags[d.flag] && !(d.or && d.or.some(f => G.save.flags[f]))) return false;
  if (d.blade && !isHero() && !weaponOwned('single')) return false;
  return true;
}
function refuseCrossing(side, why) {
  const W = G.roomDef.w * TILE;
  if (side === 'L' || side === 'R') { player.x = clamp(player.x, 2, W - player.w - 2); player.vx = 0; }
  else if (side === 'B') { player.x = player.lastSafe.x; player.y = player.lastSafe.y; player.vy = 0; }
  // a refused climb needs nothing: she is above the frame and gravity returns her
  if (why && (!G.gateWhyAt || G.time - G.gateWhyAt > 4)) { G.toast(t(why)); G.gateWhyAt = G.time || 0.001; }
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
    const arr = topArrival(G.roomId, tr.at, from.x);
    player.x = arr.x;
    player.y = arr.y;
    player.vy = Math.min(from.vy, -680);
    // THE CLIMB CANNOT STALL. She arrives at the bottom of the room above,
    // still inside the floor shaft she jumped through — and if the room's
    // first-visit art decode janks the next few frames, a time-based carry
    // dies in the shaft and she falls straight back down the hole (owner,
    // 2026-08-24: "loose momentum in jump and fall down"). So the carry is
    // STATE-based: Player.update re-asserts the rise until her feet have
    // actually cleared the destination floor, however long the loader takes.
    player.tCarry = 1.0;
  }
  else { player.x = clamp(from.x, 40, W - 60); player.y = 4; player.vy = Math.max(from.vy, 80); }
  player.vx = from.vx; player.lastSafe = { x: player.x, y: player.y };
  // ...and the carry is now the FALLBACK: where the room above has a ledge
  // beside the hole she is lifted onto it (climbStart), the way the owner
  // asked for, and the state-based carry only runs where it does not.
  if (tr.side === 'T') {
    const led = topLedge(G.roomId, player.x, player.y, Math.sign(from.vx) || player.face);
    if (led) climbStart(led);
  }
  // THE CACHE MOUTH: she climbs up through the opening, and the hardlight
  // bridge closes beneath her the instant she is through — so the way in is
  // never a pit that spits her straight back down the shaft she came up.
  if (G.roomId === 'X1' && tr.side === 'T' && G.boss && !G.boss.dead) {
    G.x1Bridge = true;
    G.climb = null;              // the bridge places her, not a ledge arc
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

// ===========================================================================
// VERTICAL LINKS — the 24 up/down pairs as one continuous shaft.
//
// A side crossing keeps her height and slides the old picture off; that reads
// as travel because the eye follows her sideways. Vertically it never did: the
// camera snapped, the room above appeared as a still being pushed away, and she
// was dropped into a hole in its floor with a forced upward shove (plan §2).
// Hollow Knight's answer is a scripted lift onto the ledge; ours is that plus
// letting the two rooms be one place while she is between them:
//
//   COLLISION continues into the neighbour (tileAt's tileLinkOn, for her body
//     only), so the jump up through the hole is real physics against the real
//     floor above, and a fall lands on what is really below.
//   THE PICTURE continues: the neighbour's baked floor (the tile cache) is
//     drawn directly above or below, and the camera is allowed past the room's
//     edge toward it, so it keeps going across the line.
//   THE HANDOVER is silent: when her centre crosses the line the room changes,
//     her position and the camera are translated by exactly the offset between
//     the two rooms, and nothing on screen moves.
//
// The offsets come from the exits themselves — a pair keeps her x, and an
// `at` arrival column (V2 -> B2) shifts the room above so its column sits over
// the opening she rose through. Whatever the shaft columns are, the two grids
// are simply laid one over the other: a mismatch shows up as rock she bumps,
// never as a body teleported inside a roof.
// ===========================================================================
function ceilingOpenStart(id) {
  const g = buildRoom(id), w = ROOMS[id].w;
  if (g.tGap) return g.tGap[0];
  for (let x = 1; x < w - 1; x++) if (g[0][x] === '.') return x;
  return 0;
}
// An `at` exit names the column she arrives at in the room above, not how the
// two openings line up. The hole she rises into is the run of not-rock in the
// upper room's floor that holds that column (V2's way up is B2's cut vent,
// 43-46, named by its column 44), so the lower opening is laid under the START
// of that run: the hole over the hole, column for column.
function atShift(lowerId, upperId, at) {
  const U = buildRoom(upperId), row = U[U.length - 1], w = row.length;
  let a = Math.max(0, Math.min(w - 1, at | 0));
  if (row[a] === '#') return ceilingOpenStart(lowerId) - at;
  while (a > 0 && row[a - 1] !== '#') a--;
  return ceilingOpenStart(lowerId) - a;
}
function vlinkFor(id) {
  const def = ROOMS[id], ex = (def && def.exits) || {}, out = { T: null, B: null };
  for (const side of ['T', 'B']) {
    let to = ex[side], at = null, flag = null, gate = null;
    if (!to) continue;
    if (typeof to === 'object') { at = to.at != null ? to.at : null; flag = to.flag || null; gate = to; to = to.to; }
    if (!to || !ROOMS[to]) continue;
    let otx = 0, oty;
    if (side === 'T') {
      oty = -ROOMS[to].h;
      if (at != null) otx = atShift(id, to, at);
    } else {
      oty = def.h;
      // the room below may arrive through an `at` column of THIS room: lay it
      // under that column, the inverse of its own way up
      let back = (ROOMS[to].exits || {}).T;
      if (back && typeof back === 'object' && back.to === id && back.at != null)
        otx = -atShift(to, id, back.at);
    }
    out[side] = { id: to, grid: buildRoom(to), otx, oty, ox: otx * TILE, oy: oty * TILE,
      w: ROOMS[to].w, h: ROOMS[to].h, flag, gate };
  }
  return out;
}
// tileAt's view past the top or bottom edge, for her body (see tileLinkOn)
function vlinkTile(tx, ty) {
  const V = G.vlink;
  const L = V && (ty < 0 ? V.T : V.B);
  if (!L) return '.';
  // A CLOSED GATE HAS NO FLOOR BEYOND IT. The story gates (exitOpen: the
  // Conduits wait on NULLFANG and the blade) are enforced at the old cut
  // crossing; if the room above stayed solid to her here she could rise
  // through the hole and stand on its floor while still officially below —
  // outside both rooms. Closed, it is open air, as it always was.
  if (L.gate && !exitOpen(L.gate)) return '.';
  const nx = tx - L.otx, ny = ty - L.oty, g = L.grid;
  if (ny < 0 || ny >= g.length || nx < 0 || nx >= g[0].length) return '.';
  if (L.id === 'D3' && !G.save.flags.bossZero && ny >= 15 && nx >= 15 && nx <= 17) return '#';
  const ch = g[ny][nx];
  if ((ch === 'B' || ch === 'v') && G.save.broken[L.id + ':' + nx + ',' + ny]) return '.';
  return ch;
}
function roomHasLiveBoss(id) {
  const d = ROOMS[id];
  for (const e of (d && d.ents) || []) {
    if (e[0] !== 'boss' || !e[3]) continue;
    if (!G.save.flags['boss' + e[3].charAt(0).toUpperCase() + e[3].slice(1)]) return true;
  }
  return false;
}
// Can this edge be crossed without a cut? A gated exit, and a guardian's
// chamber (it stages its own entrance: the dark hold, X1's bridge), keep the
// old crossing.
function vlinkSeamless(side) {
  return vlinkLive(G.vlink && G.vlink[side]);
}
// the same question about ANY link, not only the live room's — the fringe asks
// it about a neighbour's own lid while that neighbour is being drawn
function vlinkLive(L) {
  if (!L) return null;
  if (L.flag && !G.save.flags[L.flag] && !(L.gate && L.gate.or && L.gate.or.some(f => G.save.flags[f]))) return null;
  // every rule exitOpen knows (blade, hero exemption, a door already walked)
  // — a gate the cut crossing refuses must not be walked through seamlessly
  if (L.gate && !exitOpen(L.gate)) return null;
  if (roomHasLiveBoss(L.id)) return null;
  return L;
}
// she can only be handed up where the room above is open at her centre — in a
// sky room the lid is gone and the body can rise anywhere, but the way up is
// still the hole in the floor above, never its underside
function vlinkOpenAt(side, cx, cy) {
  const L = G.vlink && G.vlink[side];
  if (!L) return false;
  const nx = Math.floor(cx / TILE) - L.otx, ny = Math.floor(cy / TILE) - L.oty;
  if (nx < 0 || nx >= L.w || ny < 0 || ny >= L.h) return false;
  if (G.roomDef.sky && side === 'T' && G.grid.tGap) {
    if (cx < G.grid.tGap[0] * TILE - 8 || cx > (G.grid.tGap[1] + 1) * TILE + 8) return false;
  }
  const prev = tileLinkOn; tileLinkOn = true;
  const ch = tileAt(Math.floor(cx / TILE), Math.floor(cy / TILE));
  tileLinkOn = prev;
  return ch !== '#' && ch !== 'B';
}
function vlinkArrival(side, x, y) {
  const L = G.vlink[side];
  return { x: x - L.ox, y: y - L.oy };
}
// where the old crossing puts her in the room above (kept for the cut path)
function topArrival(id, at, fromX) {
  const W = ROOMS[id].w * TILE, H = ROOMS[id].h * TILE;
  return { x: clamp(at != null ? at * TILE : fromX, 40, W - 60), y: H - (player ? player.h : 36) - 6 };
}
// THE SILENT HANDOVER. Same room change as ever (loadRoom), then every
// coordinate that was in the old room's space is moved into the new one's by
// the offset between them — her body and the camera together — so the frame
// after looks exactly like the frame before.
function vlinkHandover(side, dest) {
  const L = G.vlink[side];
  const ox = L.ox, oy = L.oy;
  const px = player.x, py = player.y, cx = cam.x, cy = cam.y, look = cam.look || 0, lead = cam.lead || 0;
  const zoom = cam.zoom, ld = cam.lookDir, lh = cam.lookHold;
  vlinkFadeArm(ox, oy);                             // the last frame of this room, kept to ease out of
  loadRoom(dest);
  player.x = px - ox; player.y = py - oy;
  player.lastSafe = { x: player.x, y: Math.max(0, Math.min(player.y, G.roomDef.h * TILE - player.h - 4)) };
  cam.x = cx - ox; cam.y = cy - oy; cam.look = look; cam.lead = lead; cam.zoom = zoom;
  cam.lookDir = ld; cam.lookHold = lh;
  cam.room = G.roomId;                              // no snap: updateCam keeps lerping
  // the camera is past the new room's edge, looking back at the one she left;
  // let it stay there and come home at its own pace (vlinkCam)
  const z = cam.zoom || 1, oyz = 270 * (1 - 1 / z), H = G.roomDef.h * TILE;
  cam.extUp = Math.max(0, -oyz - cam.y);
  cam.extDn = Math.max(0, cam.y - (H - 540 + oyz));
  cam.soft = 0.4;
  G.vlinkLast = { side, from: L, at: G.time || 0, clk: simNow() };
  // A SEAMLESS SHAFT IS ONE PLACE, SO SHE LANDS WHERE SHE CHOOSES (owner,
  // 2026-10-13: "when I jump up and I'm not changing the screen or the rooms
  // ... the system should not push me to the left or right of the opening ...
  // I will be choosing the direction I land in. The only reason to be pushed
  // ... is if I'm leaving one room to another"). Nothing on screen changes
  // here, so the scripted ledge arc (climbStart) is not used: only the rise is
  // held until her feet clear the floor line, so the hole never swallows a
  // jump that reached it, and her own left/right takes her onto either side
  // — or, with no direction held, back down the way she came. The arc is
  // kept for the CUT crossing (applyTransition), which is a real change of room.
  if (side === 'T') player.tCarry = 1.0;
}
// How far past its top and bottom the camera may look. Only toward a link
// whose neighbour is baked (there is a picture to show), and only while she is
// near that edge — away from it the room's own bounds come back, eased so the
// frame is drawn home rather than snapped.
function vlinkCam(dt) {
  const V = G.vlink, H = G.roomDef.h * TILE;
  const cyp = player.y + player.h / 2;
  const reach = 540;
  const near = (side) => {
    const L = V && V[side];
    if (!L || !vlinkSeamless(side)) return false;
    const e = tileStore.get(L.id);
    if (!e || !e.ready) return false;
    if (side === 'T' ? cyp > 7 * TILE : cyp < H - 7 * TILE) return false;
    // ...and horizontally over the neighbour, not beside it
    const cx = player.x + player.w / 2;
    return cx > L.ox - 2 * TILE && cx < L.ox + L.w * TILE + 2 * TILE;
  };
  const k = 1 - Math.exp(-Math.min(dt, 0.1) * 3.5);
  const ease = (cur, want) => (want >= cur ? want : cur + (want - cur) * k);
  cam.extUp = ease(cam.extUp || 0, near('T') ? reach : 0);
  cam.extDn = ease(cam.extDn || 0, near('B') ? reach : 0);
  if (cam.extUp < 0.5) cam.extUp = 0;
  if (cam.extDn < 0.5) cam.extDn = 0;
}
// The neighbour's baked floor, drawn where it really is. Only the slice the
// camera can see is copied, so a tall room above costs a strip, not a room.
// ...AND SO DOES THE BACKDROP. The floor crossed the seam and what was behind
// it did not: the whole frame wore the CURRENT room's background, so the
// instant her centre crossed the line the meadow's skyline was replaced, in one
// frame, by the room below's wall — and where the camera looked past a room's
// own edge its backdrop showed whatever it had never been asked to paint (a
// pale block, in the first room under the meadow). Filmed, that is the glitch
// he was seeing. Each side of the line keeps its OWN room's background now:
// beyond the seam the neighbour's is drawn, in the neighbour's clothes (the
// swap tileJobSlice and vlinkFringe make), from her position and the camera's
// as that room would see them — so which room is "current" changes nothing
// about the picture, and the handover has nothing left to show.
function drawVLinkBG() {
  const V = G.vlink;
  if (!V || (typeof isHero === 'function' && isHero())) return;
  const z = cam.zoom || 1, ozy = 270 * (1 - 1 / z), H = G.roomDef.h * TILE;
  const vy0 = camSY() + ozy, vy1 = camSY() + 540 - ozy;
  for (const side of ['T', 'B']) {
    const L = V[side];
    if (!L || !ROOMS[L.id] || !vlinkSeamless(side)) continue;
    if (side === 'T' ? vy0 >= 0 : vy1 <= H) continue;
    const e = tileStore.get(L.id);
    if (!e || !e.ready) continue;
    const seam = Math.round((side === 'T' ? 0 : H) - camSY());
    const sv = { id: G.roomId, def: G.roomDef, grid: G.grid, vr: G._vistaRoom, px: player.x, py: player.y };
    c.save();
    c.beginPath();
    if (side === 'T') c.rect(0, 0, 960, seam); else c.rect(0, seam, 960, 540 - seam);
    c.clip();
    G.roomId = L.id; G.roomDef = ROOMS[L.id]; G.grid = L.grid; player.x = sv.px - L.ox; player.y = sv.py - L.oy;
    try {
      drawBG(PAL[G.roomDef.zone], cam.x - L.ox, cam.y - L.oy);
      bgPlanePass();
    } catch (err) {
    } finally {
      G.roomId = sv.id; G.roomDef = sv.def; G.grid = sv.grid; G._vistaRoom = sv.vr; player.x = sv.px; player.y = sv.py;
      c.restore();
    }
    G.vlinkBG = (G.vlinkBG | 0) + 1;
  }
}
// ...AND WHAT WAS THE OLD ROOM'S ALONE EASES OUT. The floor and the backdrop
// are the same on both sides of the handover now; what is not is everything
// that belongs to a room and is only drawn while she is in it — the light
// falling through the hatch, its props and machines, the way the room is lit.
// Those still ended on one frame. So the last frame of the room she left (the
// presentation buffer still holds it, unzoomed, without the HUD) is kept, she
// is cut out of it — and so is the column she is about to travel, so the new
// frame is never dimmed where SHE is — and for a third of a second it is laid
// over the new room's finished frame, world-locked, and let go. Finished frame
// over finished frame: laid in under the lighting instead, it was lit twice
// (measured: 44% of the picture changed on the crossing frame, worse than the
// cut it replaced).
const VFADE = { cv: null, t: 0, T: 0.3, cx: 0, cy: 0, at: 0 };
function simNow() { return (G.save && G.save.time) || 0; }
function vlinkFadeArm(ox, oy) {
  VFADE.t = 0;
  const b = typeof PRESENTATION !== 'undefined' && PRESENTATION.buffer;
  if (!b || !b.width || (cam.zoom || 1) <= 1.001 || (G.save && G.save.opts && G.save.opts.reduceMotion)) return;
  try {
    if (!VFADE.cv) VFADE.cv = document.createElement('canvas');
    if (VFADE.cv.width !== b.width || VFADE.cv.height !== b.height) { VFADE.cv.width = b.width; VFADE.cv.height = b.height; }
    const x = VFADE.cv.getContext('2d'), k = b.width / 960;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'copy'; x.drawImage(b, 0, 0);
    // she is not in the picture that fades: a ghost of her falling behind herself
    const sx = (player.x + player.w / 2 - camSX()) * k, sy = (player.y + player.h / 2 - camSY()) * k, r = 84 * k;
    const tx = clamp(player.vx || 0, -500, 500) * VFADE.T * k, ty = clamp(player.vy || 0, -900, 900) * VFADE.T * k;
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i <= 6; i++) {
      const hx = sx + tx * i / 6, hy = sy + ty * i / 6;
      const g = x.createRadialGradient(hx, hy, r * 0.5, hx, hy, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(hx - r, hy - r, r * 2, r * 2);
    }
    x.globalCompositeOperation = 'source-over';
    VFADE.cx = camSX() - ox; VFADE.cy = camSY() - oy; VFADE.t = VFADE.T; VFADE.at = simNow();
  } catch (e) { VFADE.t = 0; }
}
function drawVLinkFade() {
  if (VFADE.t <= 0 || !VFADE.cv) return;
  // on the GAME's clock (simNow: the save's play time, which only update() advances), not the wall's: a fade that kept going while the
  // simulation was stepped or paused would be a picture of a room she left
  // some time ago, laid over wherever the camera has got to since
  const left = VFADE.T - (simNow() - VFADE.at);
  if (!(left > 0) || left > VFADE.T + 0.001) { VFADE.t = 0; return; }
  const a = left / VFADE.T, k = c.canvas.width / 960;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = a * a * (3 - 2 * a);
  c.drawImage(VFADE.cv, Math.round((VFADE.cx - camSX()) * k), Math.round((VFADE.cy - camSY()) * k));
  c.restore();
  G.vlinkFades = (G.vlinkFades | 0) + 1;
}
function drawVLinkArt() {
  const V = G.vlink;
  if (!V) return;
  const z = cam.zoom || 1, ozx = 480 * (1 - 1 / z), ozy = 270 * (1 - 1 / z);
  const vx0 = camSX() + ozx, vy0 = camSY() + ozy, vx1 = camSX() + 960 - ozx, vy1 = camSY() + 540 - ozy;
  for (const side of ['T', 'B']) {
    const L = V[side];
    if (!L) continue;
    if (side === 'T' ? vy0 >= 0 : vy1 <= G.roomDef.h * TILE) continue;
    const e = tileStore.get(L.id);
    if (!e || !e.ready || !vlinkSeamless(side)) continue;
    const sx0 = Math.max(0, Math.floor(vx0 - L.ox) - 2), sy0 = Math.max(0, Math.floor(vy0 - L.oy) - 2);
    const sx1 = Math.min(e.cv.width, Math.ceil(vx1 - L.ox) + 2), sy1 = Math.min(e.cv.height, Math.ceil(vy1 - L.oy) + 2);
    if (sx1 <= sx0 || sy1 <= sy0) continue;
    c.drawImage(e.cv, sx0, sy0, sx1 - sx0, sy1 - sy0, L.ox + sx0, L.oy + sy0, sx1 - sx0, sy1 - sy0);
    // ...AND WHAT GROWS ON IT. The fringe is not in the baked layer (the live
    // room draws its own over her feet), so a neighbour seen across the seam
    // used to show its floor bare — and then grassed the moment she stood on
    // it. Its blades come with it now, from the same deterministic plan.
    const fr = vlinkFringe(L, e);
    if (fr) c.drawImage(fr, sx0, sy0, sx1 - sx0, sy1 - sy0, L.ox + sx0, L.oy + sy0, sx1 - sx0, sy1 - sy0);
  }
}
// The neighbour's fringe, painted once in the neighbour's own clothes (the
// same swap tileJobSlice makes) and kept on its tile entry beside the bake it
// grows on, so it is rebuilt exactly when that bake is.
function vlinkFringe(L, e) {
  if (G.fringeProbe || (typeof QUAL !== 'undefined' && QUAL.ceil <= 0)) return null;
  if (e.fringe && e.fringeSig === e.sig) return e.fringe;
  const W = e.cv.width, H = e.cv.height;
  let f = e.fringe;
  if (!f || f.width !== W || f.height !== H) {
    if (!f) e.bytes += W * H * 4;
    f = document.createElement('canvas'); f.width = W; f.height = H;
  }
  const sv = { id: G.roomId, def: G.roomDef, grid: G.grid, sc: surfCurve, sr: surfRoom };
  G.roomId = L.id; G.roomDef = ROOMS[L.id]; G.grid = L.grid;
  surfCurve = e.curve || null; surfRoom = e.curve ? L.id : null;
  try { paintFringe(f.getContext('2d'), W, H); }
  finally {
    if (surfRoom === L.id && surfCurve) e.curve = surfCurve;
    G.roomId = sv.id; G.roomDef = sv.def; G.grid = sv.grid; surfCurve = sv.sc; surfRoom = sv.sr;
  }
  e.fringe = f; e.fringeSig = e.sig;
  return f;
}
// ---------------------------------------------------------------------------
// THE LEDGE — the owner's rule for the way up: "jump up and you are carried
// onto the floor beside the hole", in a short scripted arc with the controls
// held, instead of arriving inside a shaft and being shoved. SUPERSEDED for
// the seamless shaft (owner, 2026-10-13): where nothing on screen changes she
// steers her own landing (vlinkHandover); the arc now runs only on a CUT
// crossing, which is a real change of room. Pure geometry
// against the destination's grid, so the harness asks exactly the question the
// game does (tests/vlink.cjs walks all 24 ways up through it).
//
// A ledge is a tile top she can stand on: solid or a deck, open above for her
// whole body, no hazard on it, within seven tiles of where she arrives, and
// reachable on an arc that never passes through rock. Nearest wins, and a
// floor beside the hole beats a deck far overhead — height costs more than
// width, because a lift reads as a hop and a hoist reads as a cutscene.
// `assumeBroken` reads breakable tiles as open (a hatch is a designed way
// through once it has been cut; the harness asks about the route, the game
// asks about this save).
// ---------------------------------------------------------------------------
function topLedge(id, x0, y0, pref, assumeBroken) {
  const def = ROOMS[id];
  if (!def) return null;
  const g = buildRoom(id), Ht = g.length, Wt = g[0].length;
  const PW = player ? player.w : 24, PH = player ? player.h : 36;
  const br = (G.save && G.save.broken) || {};
  const plug = id === 'D3' && !(G.save && G.save.flags && G.save.flags.bossZero);
  const cell = (tx, ty) => {
    if (tx < 0 || tx >= Wt) return '#';            // the room's sides are walls
    if (ty < 0 || ty >= Ht) return '.';            // under it is the shaft she came up
    if (plug && ty >= 15 && tx >= 15 && tx <= 17) return '#';
    const ch = g[ty][tx];
    if ((ch === 'B' || ch === 'v') && (assumeBroken || br[id + ':' + tx + ',' + ty])) return '.';
    return ch;
  };
  const blocks = (ch) => ch === '#' || ch === 'B' || ch === '^' || ch === 'v';
  const boxFree = (x, y) => {
    const a0 = Math.floor(x / TILE), a1 = Math.floor((x + PW - 1) / TILE);
    const b0 = Math.floor(y / TILE), b1 = Math.floor((y + PH - 1) / TILE);
    for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) if (blocks(cell(a, b))) return false;
    return true;
  };
  if (!boxFree(x0, y0)) return null;               // she would arrive inside rock
  const feet0 = y0 + PH, c0 = Math.floor((x0 + PW / 2) / TILE);
  const cands = [];
  for (let tx = c0 - 7; tx <= c0 + 7; tx++) {
    if (tx < 0 || tx >= Wt) continue;
    for (let ty = Ht - 1; ty >= 1; ty--) {
      const top = ty * TILE, rise = feet0 - top;
      if (rise < TILE * 0.5) continue;
      if (rise > 7 * TILE) break;
      const ch = cell(tx, ty);
      if (!(ch === '#' || ch === 'B' || ch === '=')) continue;
      const up = cell(tx, ty - 1);
      if (up === '#' || up === 'B' || up === '=') continue;   // buried: not a top
      const x1 = tx * TILE + (TILE - PW) / 2, y1 = top - PH;
      if (!boxFree(x1, y1)) continue;
      const dx = x1 - x0;
      cands.push({ x: x1, y: y1, tx, ty, score: Math.abs(dx) + rise * 1.5 - (Math.sign(dx) === pref ? 10 : 0) });
    }
  }
  cands.sort((a, b) => a.score - b.score);
  for (const cd of cands.slice(0, 12)) {
    for (const bump of [12, 28, 48, 72, 100]) {
      const k = { x0, y0, x1: cd.x, y1: cd.y, bump };
      let ok = true;
      for (let i = 1; i <= 24 && ok; i++) {
        const p = climbPos(k, i / 24);
        if (!boxFree(p[0], p[1])) ok = false;
      }
      if (ok) {
        const dist = Math.hypot(cd.x - x0, cd.y - y0);
        return { x0, y0, x1: cd.x, y1: cd.y, bump, tx: cd.tx, ty: cd.ty, dur: clamp(0.35 * dist / 150, 0.35, 0.5) };
      }
    }
  }
  return null;
}
// Up first, then over: the body clears the lip before it travels across it,
// and the sideways ease starts late enough that it never scrapes the shaft.
function climbPos(k, u) {
  const ux = u < 0.3 ? 0 : (u - 0.3) / 0.7, ex = ux * ux * (3 - 2 * ux);
  const ey = 1 - (1 - u) * (1 - u);
  return [k.x0 + (k.x1 - k.x0) * ex, k.y0 + (k.y1 - k.y0) * ey - k.bump * Math.sin(Math.PI * u)];
}
function climbStart(led) {
  // the grid says where the tile top is; the heightfield may have built the
  // ground a few px above it there, and she lands on the ground, not the grid
  let y1 = led.y1;
  const PH = player.h, gc = (typeof groundColumnAt === 'function') ? groundColumnAt(led.x1 + player.w / 2) : null;
  if (gc && gc[0] < gc[1] && Math.abs(gc[1] - (led.y1 + PH)) < 2) y1 = gc[0] - PH;
  G.climb = { x0: led.x0, y0: led.y0, x1: led.x1, y1, bump: led.bump, t: 0, dur: led.dur || 0.35 };
  player.tCarry = 0;
  player.on = false;
  if (led.x1 !== led.x0) player.face = Math.sign(led.x1 - led.x0);
}
// The arc, driven: the controls are held for its length (update() runs this
// INSTEAD of Player.update, the same arrangement as a finishing blow), and her
// velocity is the arc's own derivative so every pose that reads vy — the rise,
// the hang, the landing — reads a real jump.
function climbStep(dt) {
  const k = G.climb;
  if (!k || !player) { G.climb = null; return; }
  k.t += dt;
  const u = clamp(k.t / k.dur, 0, 1);
  const p = climbPos(k, u);
  const ddt = Math.max(dt, 1e-3);
  player.vx = (p[0] - player.x) / ddt; player.vy = (p[1] - player.y) / ddt;
  player.x = p[0]; player.y = p[1];
  player.on = false; player.tCarry = 0;
  if (k.x1 !== k.x0) { player.face = Math.sign(k.x1 - k.x0); }
  if (u >= 1) {
    // set down a hair above the ledge, falling: the next physics step LANDS
    // her, so the landing squash, dust and sound are the ordinary ones
    player.x = k.x1; player.y = k.y1 - 0.5;
    player.vy = 90; player.vx *= 0.25;
    player.lastSafe = { x: player.x, y: k.y1 };
    G.climb = null;
  }
}
// ---------- interaction ----------
// A CONVERSATION HAS TWO PEOPLE IN IT, SIDE BY SIDE. The reach used to be 46 px
// from the NPC's FEET BOX (40 wide) — but the machine folk are drawn at their
// atlas scale, Old Servo 75 px across, so the prompt arrived only once her
// body was already inside his, and the talk was held with the cat painted over
// the face she was talking to (the audit's phone capture, 2026-10-10). The
// stand-off is measured from the body that is DRAWN: his half-width, plus
// hers, plus a hand's gap. The prompt comes up before she reaches it, and if
// she has walked into him anyway, the talk steps her back out to it, facing
// him. (The cell aspect is the npc sheet's own; 0.77 is that sheet until it
// has decoded, so the number does not jump when the art lands.)
const TALK_HERO_HALF = 26, TALK_GAP = 4, TALK_MAX = 76;
function npcStandOff(s) {
  const A = typeof atlasOf === 'function' && atlasOf(s.extra);
  const S = A && A.sub && A.sub[s.extra];
  if (!S) return Math.max(s.w / 2 + TALK_HERO_HALF, 34);
  let asp = 0.77;
  const im = A.key && typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[A.key];
  if (im && im.naturalWidth && im.naturalHeight) asp = (im.naturalWidth / A.cols) / (im.naturalHeight / A.rows);
  const half = s.h * S.k * asp / 2;
  return Math.min(TALK_MAX, half + TALK_HERO_HALF + TALK_GAP);
}
function npcReach(s) { return Math.max(46, Math.min(TALK_MAX + 8, npcStandOff(s) + 10)); }
// can she stand at world x (her centre) at her current height: nothing solid
// in her body's rows, and something under her feet
function talkSpotFree(x) {
  if (!player || !G.grid) return false;
  const l = Math.floor((x - player.w / 2) / TILE), r = Math.floor((x + player.w / 2 - 1) / TILE);
  if (l < 1 || r > G.grid[0].length - 2) return false;
  const top = Math.floor(player.y / TILE), bot = Math.floor((player.y + player.h - 1) / TILE);
  for (let tx = l; tx <= r; tx++) for (let ty = top; ty <= bot; ty++) if (solidAt(tx, ty)) return false;
  const under = tileAt(Math.floor(x / TILE), bot + 1);
  return under === '#' || under === 'B' || under === '=';
}
// pick her spot beside this NPC: her own side first, the other if hers is a
// wall or a drop; nowhere (null) when she is already clear of him
function npcTalkSpot(s) {
  if (!player || !s || s.type !== 'npc' || !player.on) return null;
  const ncx = s.x + s.w / 2, hcx = player.x + player.w / 2;
  const want = npcStandOff(s), dx = hcx - ncx;
  player.face = ncx >= hcx ? 1 : -1;               // she turns to him either way
  if (Math.abs(dx) >= want - 1) return (G.talkSpot = null);
  const side = dx !== 0 ? Math.sign(dx) : -(player.face || 1);
  let x = null;
  for (const sd of [side, -side]) {
    const cand = ncx + sd * want;
    // every step of the way there must be standable, not just the end of it
    let ok = true;
    for (let k = 1; k <= 4 && ok; k++) ok = talkSpotFree(hcx + (cand - hcx) * k / 4);
    if (ok) { x = cand; break; }
  }
  if (x == null) return (G.talkSpot = null);
  G.talkSpot = { x: x - player.w / 2, npcX: ncx, room: G.roomId };
  return G.talkSpot;
}
// the step itself: a short walk, a fifth of a second, while the box opens
function talkSpotStep(dt) {
  const k = G.talkSpot;
  if (!k || !player) return;
  if (k.room !== G.roomId) { G.talkSpot = null; return; }
  const d = k.x - player.x, v = 260 * dt;
  if (Math.abs(d) <= v) { player.x = k.x; G.talkSpot = null; }
  else player.x += Math.sign(d) * v;
  player.vx = 0;
  player.face = k.npcX >= player.x + player.w / 2 ? 1 : -1;
}
function findNear() {
  if (!player || player.dead) return null;
  let best = null, bestD = 1e9;
  for (const s of G.statics) {
    if ((s.type === 'chest' || s.type === 'riddle') && s.opened) continue;
    const dx = (player.x + player.w / 2) - (s.x + s.w / 2);
    const dy = (player.y + player.h / 2) - (s.y + s.h / 2);
    const reach = s.type === 'npc' ? npcReach(s) : 46;
    if (Math.abs(dx) < reach && Math.abs(dy) < 60) {
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = s; }
    }
  }
  for (const e of G.enemies) {
    if (!e.disabled || !e.storyKey) continue;
    const dx = player.x + player.w / 2 - e.x - e.w / 2;
    const dy = player.y + player.h / 2 - e.y - e.h / 2;
    const d = dx * dx + dy * dy;
    if (Math.abs(dx) < rescueReach(e) && Math.abs(dy) < 60 && d < bestD) {
      bestD = d; best = { type: 'rescue', target: e, x: e.x, y: e.y, w: e.w, h: e.h };
    }
  }
  return best || (typeof monoNearTarget === 'function' ? monoNearTarget() : null);
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
  // THE FIRST WAKING PAYS WITH THE KIT AND HIS STORY. Healing used to be
  // granted here too — "Ratchet's first gift for the battery" — and it moved
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
function forgeCrystal(presentStored) {
  if (presentStored) {
    if (!weaponOwned('single')) return false;
  } else {
    if (!grantWeapon('single')) return false;
    // ...and the trader packs his tools for the camp by the lion's door: the
    // next time a room is loaded he stands there, not here (npcPlaced). He says
    // so as he hands the job over (sl_ratchet_moving), never silently.
    if (typeof revisedStory === 'function' && revisedStory()) G.save.flags.ratchetCamp = 1;
    if (persist() === false) return false;
  }
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
    if (startPurifyCut('gift')) { G.cutEnd = () => alphaQuestOffer(); return; }
  }
  const card = showItem(t('i_crystal'), t('i_crystald'));
  if (card) card.onEnd = () => alphaQuestOffer();
  else if (G.dialog) G.dialog.onEnd = () => alphaQuestOffer();
  return true;
}
function doInteract(s) {
  if (!s && typeof monoNearTarget === 'function') s = monoNearTarget();
  if (!s) return;
  if (typeof k2Interact === 'function' && k2Interact(s)) return;   // Bilge's ferry (conduits-road.js)
  if (typeof swInteract === 'function' && swInteract(s)) return;   // Rivet the pipe-smith (sewer.js)
  if (s.type === 'rescue') {
    const e = s.target;
    if (!e || !e.disabled || e.cleanseT > 0) return;
    if (!G.save.flags.crystal) { G.toast(t('story_need_blade')); return; }
    e.cleanseT = 0.65; e.cleanseHP = player.cores;
    return;
  }
  if (s.type === 'npc') {
    // THE OPENING'S TWO PEOPLE speak through js/opening.js while their story
    // is being told: Ratchet's letter, repair, explanation, pod and pack, and
    // Old Servo's waking and errand. It hands back to everything below once
    // there is nothing scripted left to say.
    // she steps to his side and turns to him before a word is said
    if (typeof npcTalkSpot === 'function') npcTalkSpot(s);
    if (typeof openingTalk === 'function' && openingTalk(s)) return;
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
      if (invCount(npcCellItem(s)) <= 0) {
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
          const restore = () => {
          if (!invTake(npcCellItem(s))) return;
          npcCharge(s);
          if (key === 'A0B|ratchet') { G.save.flags.ratchetRepaired = 1; persist(); }
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
                // THE WAKING (owner, 2026-10-12): his cell goes in and he
                // comes on — filmed, not told. When the clip is not on disk
                // the wake flows straight on to the lessons.
                if (PURIFY_VID.revive) {
                  purifyPreload('revive');
                  if (startPurifyCut('revive')) { G.cutEnd = lesson; return; }
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
    if (s.extra === 'ratchet' && !isHero() && G.save.flags.crystal && G.save.flags.bossGlitch && !G.save.flags.alphaLead && !G.save.flags.alpha) {
      G.save.flags.alphaLead = 1; qSet('alpha_pack', 'active'); lines = lines.concat(t('q_ask_alpha_pack')); persist();
    }
    // WHAT THIS PERSON IS FOR. The trader trades; the Oracle opens the Trials.
    // That is their job and an errand does not replace it — which is exactly
    // what the errand system did when it landed: the moment the trader had a
    // job outstanding, `after` was overwritten and talking to him did NOTHING,
    // forever, until you finished it. He stopped being a shop because he had
    // asked you for a favour. Worse in the tutorial, where the trader IS the
    // shop lesson and his errand hid it.
    const base = s.extra === 'ratchet' ? () => shopOpen(true)
      : s.extra === 'mono' ? () => trialOpen()
      : s.extra === 'patch' && typeof ptTinkerSells === 'function' && ptTinkerSells() ? () => shopOpen(true, 'patch') : null;
    let after = base;
    if (q) {
      const st = qState(q.id);
      let qAct = null;
      // WHO POINTS YOU THERE (docs/STORY_SHEET.md). An errand may carry the
      // way to its goal; it is said with the ask and again while she is still
      // looking, because a direction heard once and forgotten is no direction.
      const wk = 'q_where_' + q.id, wl = t(wk);
      const where = wl && wl !== wk ? [wl] : [];
      if (st === 'none' && typeof questFoundEarly === 'function' && questFoundEarly(q)) {
        // FOUND BEFORE IT WAS ASKED (owner: "remember discoveries and adapt
        // later quest dialogue"). The thing is already in her bag, or she has
        // already stood where they wanted her to stand: they say so, and pay.
        lines = questEarlyLines(q);
        qAct = () => { qSet(q.id, 'active'); questPay(q); };
      } else if (st === 'none') {
        // AN ASK MAY BE SEVERAL SHORT BEATS. It used to be one string, so the
        // only way to tell a story here was to write a paragraph into a speech
        // bubble — and the owner read one: 'npc words are long and repeated'.
        // concat takes either, so a line stays a line and a story is a list.
        lines = [].concat(t('q_ask_' + q.id) || t('q_ask'), qText(q), where);
        qAct = () => { qSet(q.id, 'active'); G.toast(t('q_taken')); sfx('ok'); };
      } else if (qDone(q)) {
        lines = [t('q_thanks_' + q.id) || t('q_thanks')];
        // the forge is also where he leaves for the camp, and he says so
        if (q.id === 'ratchet_forge' && typeof revisedStory === 'function' && revisedStory())
          lines.push(t('sl_ratchet_moving'));
        qAct = () => questPay(q);
      } else {
        lines = [qText(q)].concat(where, t('q_wait'));
      }
      after = () => {
        if (qAct) qAct();
        // ...and then they go back to being themselves. Guarded on the state
        // still being PLAY, because a hand-in can hand over a relic, and that
        // opens a card the shop must not slam shut.
        // A card or a note that the errand raised goes first; the shop then
        // opens behind it rather than not at all (js/overlay.js queue).
        if (base) {
          if (G.state === 'PLAY' && !(typeof overlayBusy === 'function' && overlayBusy())) base();
          else if (typeof overlayRequest === 'function') overlayRequest(() => { if (G.state === 'PLAY') base(); }, 'shop');
        }
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
      let backLine = null;               // "you came back" leads even the standing line
      if (s.extra === 'ratchet') {
        // forged → sage → bell → lion, in the story's order (and the corridor's
        // dent only becomes "go and put one in it" once the lion is winnable):
        // ratchetStandingKey in js/story-opening.js
        if (typeof ratchetStandingKey === 'function') k = ratchetStandingKey(G.save.flags, k);
        // "YOU CAME BACK" — the underdog sentence, said by the one who passed
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
      if (backLine) lines = [backLine].concat(lines);
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
    if (typeof survivorStory === 'function') lines = survivorStory(s, lines);
    if (typeof ctlFill === 'function') lines = lines.map(ctlFill);   // {JUMP} -> her own bound control
    G.dialog = { name: t('n_' + s.extra), lines, i: 0, npc: s.extra, onEnd: after };
    G.state = 'DIALOG'; npcSay(s.extra, 0);
  } else if (s.type === 'term') {
    G.dialog = { name: '…', lines: t('t' + s.extra).slice(), i: 0, onEnd: null, rs: RS_TERM[s.extra] };
    G.state = 'DIALOG'; sfx('ui');
    // a read is remembered per terminal; an errand may be waiting on it (questRead)
    if (typeof questRead === 'function') questRead(G.roomId, s.extra);
    // ...and a few terminals DO something when read (the quarry survey, js/progress.js)
    if (typeof pgTermRead === 'function') pgTermRead(G.roomId, s.extra);
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
    else if (s.extra === 'core') {
      // a cache in a quarry pocket: scrap now, not a life (owner, 2026-11-20:
      // "Getting extra lives should be only rewarded when you defeat a sage")
      G.save.scrap = (G.save.scrap || 0) + 80;
      showItem(t('sp_cache'), t('sp_cache_d').replace('%s', '80'));
    }
    else if (s.extra.indexOf('rl:') === 0) G.grantRelic(s.extra.slice(3));
    else if (s.extra.indexOf('it:') === 0) {
      // an inventory item kept in a chest — the booth's spare power cell
      // ...his own cell while he is dark; once he is awake (an older save
      // woke him with another cell) the toolbox holds an ordinary spare
      const it = !isHero() && G.save.storyVersion >= 2 && G.roomId === 'A0B' && s.extra === 'it:batt'
        && !G.save.flags['on_A0B|ratchet'] ? 'ratchetCell' : s.extra.slice(3);
      invAdd(it);
      // HIS battery is a thing she has to recognise on the repair board, so
      // the card shows the board's own battery art (repair_battery.webp)
      showItem(t('i_' + it), t('i_' + it + 'd'), it === 'ratchetCell' ? 'repairBattery' : null);
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
      // the third seal is the one a player can walk past — it is the only one
      // not handed over by a fight or a puzzle — so the door says where it lies
      // (robot world: the goal arrow names the fight that still holds a seal)
      G.toast(t('vault_locked') + '  ' + have + '/3' + (relicHas('sigil3') || !isHero() ? '' : '  ' + t('vault_where3')));
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
  // the wave leaves fast and slows as it dies — an ease-out reads as a blast,
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
    // still deactivated". Every other system in the game knows the difference —
    // a unit with no cell reads a note instead of speaking, and its dialogue is
    // HER line rather than its own — but the voice loop was mixed purely by
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
    // her — a drone at full gain under the recorded line AND under the text
    // she is trying to read. "its lyrics is too long and destracting from
    // reading the story" is that drone: it is the voice you cannot finish,
    // because it never ends. A voice belongs to a body standing in a room; the
    // moment it has something to SAY, the room's sound gets out of the way.
    //
    // AND THE CEILING COMES DOWN. A voice loop at 0.6 beside a body is not a
    // presence, it is a second piece of music — and this game already has one.
    // A machine you are standing next to should be something you notice when
    // you stop, not something you have to talk over.
    npcVoxTick(s.extra, (talking ? 0.12 : k * k) * NPC_VOX_CEIL);
  }
}
function update(dt) {
  // THE INPUT CONTRACT IS FILLED ONCE PER SIMULATION STEP, here rather than in
  // mainLoop, because every harness in tests/ calls update() directly and a
  // struct that only existed inside the real loop would be a contract the game
  // keeps and the tests do not. It goes FIRST, above every early return, so a
  // state that exits before the rest of the body still reads fresh input.
  // See PI / pollInput in js/engine.js.
  if (typeof pollInput === 'function') pollInput();
  if (G.state === 'PURIFY') { updatePurification(dt); return; }
  if (G.purificationReturn > 0) G.purificationReturn = Math.max(0,G.purificationReturn-dt);
  if (G.state === 'REPAIR') { updateRepair(dt); narrativeAudioTick(); return; }
  if(typeof ratchetReleaseUpdate==='function'&&ratchetReleaseUpdate(dt)){narrativeAudioTick();return;}
  if (typeof ComicRewards !== 'undefined' && ComicRewards.tick(dt)) return;
  // THE STORY PANELS (js/panels.js): a story beat's manhwa crops take over at
  // the first safe moment after it — never mid-fight, mid-dialogue or mid-crossing
  if (typeof panelsTick === 'function' && panelsTick(dt)) return;
  if (typeof heroMotionGate === 'function' && heroMotionGate(dt)) return;
  if (typeof tutorialTick === 'function') tutorialTick();
  narrativeAudioTick();
  if (typeof menuMsgTick === 'function') menuMsgTick(dt);
  if (G.state === 'PLAY' && typeof sceneCaptionTick === 'function') sceneCaptionTick(dt);
  // the next queued card / note / dialogue opens on the first free PLAY frame
  if (G.state === 'PLAY' && typeof overlayPump === 'function') overlayPump();
  if (G.state === 'PLAY' || G.state === 'DIALOG') { tickNPCVox(); tickCaveLure(); }
  else if (typeof npcVoxQuietAll === 'function') npcVoxQuietAll();
  if (G.state === 'PLAY') {
    G.save.time += dt;
    // a talk spot belongs to the conversation that asked for it; one left by
    // a talk that opened a shop instead must not move her in a later one
    G.talkSpot = null;
    fxDecay(dt);
    rubbleTick(dt);
    if (G.hitStop > 0) {
      if (inP('ATK') && player) player.atkBuf = Math.max(player.atkBuf || 0, 0.2);
      if (inP('JUMP') && player) player.jbuf = Math.max(player.jbuf || 0, 0.12);
      if (inP('PAUSE') || inP('BACK')) { G.state = 'PAUSE'; G.pauseIdx = 0; sfx('ui'); }
      G.hitStop = Math.max(0, G.hitStop - dt); updateParts(dt * 0.25); infEyeUpdate(dt * 0.25); return;
    }
    meetCheck(); if (G.meet) meetStep(dt);
    if (typeof glimpseTick === 'function') glimpseTick(dt);   // NULLFANG seen down the road, once (js/glimpse.js)
    // THE BREAK (js/story-opening.js): the one moment NULLFANG lets go of the
    // order, staged between the sage and the bell. Same shape as the meeting —
    // a check that may open it, a step that drives the body by hand.
    if (typeof breakCheck === 'function') { breakCheck(); if (G.break) breakStep(dt); }
    // THE CROSSING IS A MOVE, NOT A CUT (owner, 2026-08-23: "the map... becomes
    // cubicles of rooms connected... instead, it's actual world connected").
    // Every screen edge used to fade the picture to solid black over 0.28s,
    // swap the room at the halfway point, and fade back — and the world was
    // frozen for the whole of it. Two rooms joined by a blackout are two
    // rooms; the same two joined by the camera carrying through are a place.
    // The room now swaps on the FIRST frame of the crossing and the outgoing
    // picture is PUSHED off the side she left by (see transSnap in the draw),
    // while the world underneath keeps running — so her walk never stops.
    if (G.trans) {
      G.trans.t -= dt;
      if (!G.trans.half) {
        G.trans.half = true; applyTransition();
        // Arrival panels own the same simulation step as the room swap. The
        // old early tick saw the departing room and leaked one playable frame.
        if (typeof panelsTick === 'function' && panelsTick(dt)) return;
      }
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
      if (typeof updateBossVfx === 'function') updateBossVfx(dt);
      if (typeof updateInsects === 'function') updateInsects(dt);   // the small life of the place (js/insects.js)
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
          // ...and what the FOUNDRY leaves behind uses the same list (kingdom
          // C's moves, js/entities.js: cinder / slagsplash / pour). A poured
          // runnel is not a drip: it RUNS, fast, to the width its own spill
          // had and no further — so the spread rate and the ceiling are per
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
      if (typeof k2Update === 'function') k2Update(dt);   // the swamp: raft, water, insects (conduits-road.js)
      if (typeof swUpdate === 'function') swUpdate(dt);   // the sewer: lift, channels (sewer.js)
      if (!(typeof isHero === 'function' && isHero())) ceilWeather(dt, G.roomDef.zone);
      sawHum(dt);
      updateTutor(dt);
      if (typeof openingTick === 'function') openingTick(dt);
      updateLesson(dt);
      // during a finishing blow she is driven, not steered — the choice was the
      // input, and nothing the player does now can fumble it
      if (G.finish && typeof updateFinisher === 'function') updateFinisher(dt);
      else if (G.climb) climbStep(dt);          // the ledge arc: driven, controls held
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
      if (typeof packStep === 'function') packStep(dt);       // her called wolf (js/packcall.js)
      for (const p of G.projs) if (!p.dead) p.update(dt);
      G.projs = G.projs.filter(p => !p.dead);
      if (typeof crescentStep === 'function') crescentStep(dt);
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
      // (not while the pod holds her: a second press used to restart the rest
      // from the top, so a player who pressed twice never finished resting)
      else if (G.near && !G.recharge && (inP('INT') || (inP('UP') && player.on))) doInteract(G.near);
      hazardRescueStep(dt);
      ringWakeStep(dt);
      if (typeof alphaCall === 'function') alphaCall(dt);
      checkTransitions();
      // chapter one's road: the wards' faces, the quarry's return, the bound
      // machines waiting, the cleansing light (js/progress.js)
      if (typeof progressTick === 'function') progressTick(dt);
      if (G.winT > 0) {
        G.winT -= dt;
        // the reel plays in the gap the win screen was already waiting through
        if (G.winT <= 0 && !(typeof startEndingReel === 'function' && startEndingReel())) {
          G.state = 'WIN'; setMusic('winTheme');
        }
      }
      if (G.state === 'PLAY') {
        if (inP('MAP')) { if (mapUnlocked()) { G.state = 'MAP'; sfx('ui'); } else { sfx('no'); if (!(G.mapNoT > 0)) { G.mapNoT = 4; G.toast(t('map_locked')); } } }
        if (G.mapNoT > 0) G.mapNoT -= dt;
        if (inP('BRAID')) { G.state = 'BRAID'; braidView.ready = false; sfx('ui'); }
        else if (inP('CREST')) { G.state = 'CREST'; G.crestIdx = 0; sfx('ui'); }
        else if (inP('SKILL')) { G.state = 'SKILLS'; G.skillIdx = 0; sfx('ui'); }
        else if (inP('TREE') && typeof ptOpen === 'function') ptOpen('PLAY');
        else if (inP('PAUSE')) { G.state = 'PAUSE'; G.pauseIdx = 0; sfx('ui'); }
      }
    }
    // THE AFTERMATH IS THE FRAME THAT CARRIES THE INFORMATION (manga-direction
    // §3): once it has thrown her, the camera holds both of them — where she
    // landed, and it standing there looking — rather than chasing her off the
    // crest and leaving the guardian to finish its beat off-screen
    if (G.meet && !G.meet.interactive && G.boss && (G.meet.ph === 'watch' || G.meet.ph === 'coil'))
      // a third of a screen short of the guardian: it stands at the right of
      // the frame and she is wherever the throw put her, up to 800 px west of
      // it (measured 480-600) — a true midpoint put it a hair past the edge
      updateCam(G.boss.cx() - 330, (player.y + player.h / 2 + G.boss.cy()) / 2, G.roomDef.w * TILE, G.roomDef.h * TILE, dt);
    else {
      if (player && G.roomDef) vlinkCam(dt);
      updateCam(player.x + player.w / 2, player.y + player.h / 2, G.roomDef.w * TILE, G.roomDef.h * TILE, dt);
    }
    updateParts(dt);
    infEyeUpdate(dt);
    for (const tt of G.toasts) tt.t -= dt;
    G.toasts = G.toasts.filter(tt => tt.t > 0);
    if (G.zoneToast) { G.zoneToast.t -= dt; if (G.zoneToast.t <= 0) G.zoneToast = null; }
  }
  else if (G.state === 'DEAD') {
    updateParts(dt); fxDecay(dt); infEyeUpdate(dt);
    G.deadT -= dt;
    if (G.deadT <= 0) respawn();
  }
  else if (G.state === 'DIALOG') {
    // a conversation that opened on its own (Servo's first say comes a beat
    // after his waking) still puts her beside him, not inside him
    const dd = G.dialog;
    if (dd && dd.npc && !dd._spotted) {
      dd._spotted = 1;
      const sp = !G.talkSpot && (G.statics || []).find(q => q.type === 'npc' && q.extra === dd.npc);
      if (sp) npcTalkSpot(sp);
    }
    talkSpotStep(dt);
    dialogUpdate(dt);   // paged, typed, mash-proof: js/overlay.js
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
  else if (G.state === 'FERRY') k2FerryUpdate();
  else if (G.state === 'SKILLS') updateSkills();
  else if (G.state === 'TREE') updateTree();
  else if (G.state === 'RELICS') updateRelics();
  else if (G.state === 'TRIAL') updateTrial(dt);
  else if (G.state === 'PAUSE') updatePause();
  else if (G.state === 'TCFG') updateTouchCfg();
  else if (G.state === 'CINE') updateCine(dt);
  else if (G.state === 'CUT') updateCut(dt);
  else if (G.state === 'PANELS') updatePanels(dt);
  else if (G.state === 'PANELLIST') updatePanelList();
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
  else if (G.state === 'KEND') updateK1End(dt);
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
// THE LIFT IS ADAPTIVE NOW (2026-08-30). It was written for frames whose
// median pixel was zero, and it fixed them. Then the painted plates were freed
// from the grade and the lit rooms arrived on screen at a mean of 60-70 RAW —
// and the same constant 46 was still being screened over them, which is the
// grey film the critic's pass photographed in every room: out = 46 + 0.82*raw
// turns a warm workshop into milk. So the floor is now a function of how dark
// the frame actually is: a cave at raw 10 keeps the full lift (cavedark's
// numbers are unchanged), a lit room at raw 66 gets almost none, and the
// setting still scales the ceiling. Measured every half second off a 24x14
// downsample of the world — one small readback, not one per frame — and
// eased so a room change never pops.
let LIFT_K = 1, LIFT_NEXT = 0, LIFT_CV = null, LIFT_MID = null, LIFT_ROOM = null, LIFT_N = 0;
const LIFT_LIT = 72, LIFT_SPAN = 48;   // raw mean >= 72: no lift; <= 24: full
// THE LOOK IS RARE, AND IT IS SMALL (owner, 2026-11-15, on the APK: "the
// screen was not very smooth when it moved"). Reading a canvas back is the one
// thing in this file a phone's GPU cannot do in passing: everything it has been
// asked to draw must be finished first, and then the pixels are copied out to
// the CPU, with the frame waiting. This did that twice a second for as long as
// the game ran — and it did it to the WHOLE frame, because drawing a GPU canvas
// into a CPU one copies all of it out before the 24x14 is made.
//   - how dark a room is changes when the room does. So: three looks in the
//     first second and a half of a room, as before, then one every three
//     seconds — a sixth of the readbacks while she is simply playing;
//   - the frame is shrunk on the GPU first, into a canvas large enough to stay
//     on it (a small canvas is a CPU canvas), and only that is copied out:
//     a twelfth of the bytes or less.
// The number it produces is the same mean it always was.
function liftProbe() {
  const now = performance.now();
  // NOT WHILE THE CAMERA IS STILL ARRIVING (owner, 2026-11-15: "the screen
  // still glitches when I transition from one room to another... when the
  // camera moves, it glitches a little bit"). The first look at a new room was
  // 120 ms in — the fourth to eighth frame of the crossing, with the camera
  // mid-travel — and a look is a readback: measured 17 ms on a desk, several
  // times that on a phone's GPU, in exactly the frames the eye is following
  // the picture. It waits 0.7 s now, until the frame has come to rest; the
  // lift it carries in from the last room holds for that long, eased.
  // ...and a SEAMLESS shaft is one place: crossing its line starts no new
  // settling at all — the cadence it was on simply continues.
  if (G.roomId !== LIFT_ROOM) {
    const seamless = !!(G.vlinkLast && G.vlinkLast.clk != null && simNow() - G.vlinkLast.clk < 0.5 && simNow() >= G.vlinkLast.clk);
    LIFT_ROOM = G.roomId;
    if (!seamless) { LIFT_N = 0; LIFT_NEXT = now + 700; } else LIFT_NEXT = Math.max(LIFT_NEXT, now + 700);
  }
  if (now < LIFT_NEXT) return;
  const settling = LIFT_N < 3;
  LIFT_NEXT = now + (settling ? 500 : 3000); LIFT_N++;
  try {
    if (!LIFT_CV) { LIFT_CV = document.createElement('canvas'); LIFT_CV.width = 24; LIFT_CV.height = 14; }
    if (!LIFT_MID) { LIFT_MID = document.createElement('canvas'); LIFT_MID.width = 288; LIFT_MID.height = 168; }
    const m = LIFT_MID.getContext('2d');
    m.drawImage(c.canvas, 0, 0, 288, 168);
    const x = LIFT_CV.getContext('2d', { willReadFrequently: true });
    x.drawImage(LIFT_MID, 0, 0, 24, 14);
    const d = x.getImageData(0, 0, 24, 14).data;
    let L = 0;
    for (let i = 0; i < d.length; i += 4) L += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    L /= 24 * 14;
    const want = clamp((LIFT_LIT - L) / LIFT_SPAN, 0, 1);
    // the sparse looks carry more each, so the lift follows her out of a lit
    // corner in about the time it used to
    LIFT_K += (want - LIFT_K) * (settling ? 0.35 : 0.7);
    G.liftLooks = (G.liftLooks | 0) + 1;
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
    { id: 'crests', label: t('pm_crests'), lo: 'crest' },
    { id: 'skills', label: t('pm_skills') },
    // HER SKILL TREES (js/packtree.js): the Pack's ladder, and room for the trees that join it
    { id: 'tree', label: t('pk_menu') },
    { id: 'relics', label: t('pm_relics'), lo: 'relic' },
    { id: 'ctrl', label: t('ctl_title') },
    { id: 'pace', label: t('pace') + ':  ' + paceLabel() + '   ◂ ▸', arrows: 1, hint: t('pace_d') },
    { id: 'qual', label: t('qual') + ':  ' + qualLabel() + '   ◂ ▸', arrows: 1, hint: t('qual_d').replace('%s', DEVICE.form) },
  ];
  // READING (js/reveal.js): how fast words type out, and the switch that
  // stops every drift and typewriter at once. Same row shape as the dials.
  if (typeof textSpeedId === 'function') {
    it.push({ id: 'tspd', label: t('tx_speed') + ':  ' + t('tx_' + textSpeedId()) + '   ◂ ▸', arrows: 1, hint: t('tx_speed_d') });
    it.push({ id: 'rmot', label: t('tx_motion') + ':  ' + (reduceMotion() ? t('on') : t('off')) + '   ◂ ▸', arrows: 1, hint: t('tx_motion_d') });
  }
  it.push({ id: 'films', label: t('film_title') });
  if (!isHero()) it.push({ id: 'comics', label: LANG === 'ar' ? 'ذكريات المانهوا' : 'Manhwa memories' });
  // the approved manhwa's panels, replayable once seen (js/panels.js)
  if (!isHero() && typeof panelsSeenList === 'function' && panelsSeenList().length) it.push({ id: 'panels', label: t('pn_menu') });
  if (pauseHasTouch()) it.push({ id: 'touch', label: t('tl_title') });
  // THE PICTURE'S GESTURES, AND THE WAY OUT OF THEM. A control the player
  // cannot see is a control the player must be able to switch off: the picture
  // answers taps and swipes now (js/touch.js, THE PICTURE IS THE REST OF THE
  // CONTROLLER), and a thumb that rests on the glass should not have to learn
  // to hover. Same row shape as the pace and quality dials, so the pause menu's
  // one geometry keeps covering its tap target.
  if (pauseHasTouch()) it.push({ id: 'gest', label: t('gest') + ':  ' + (G.save && G.save.gestOff ? t('off') : t('on')) + '   ◂ ▸', arrows: 1, hint: t('gest_d') });
  it.push({ id: 'restart', label: t('pm_restart'), icon: '↻', warn: 1, hint: t('pm_restart_d') });
  it.push({ id: 'quit', label: t('to_menu'), icon: '⏻', warn: 1, out: 1 });
  return it;
}
// ...and one geometry, read by the drawing AND by the tap targets. They used to
// be written out separately, which is how the touch hit-boxes ended up testing
// for seven rows at a 40 px pitch against a menu that had ten at a different
// one: on a phone the pause menu selected the wrong line.
// one line: WORLD <id> · <lean> · <laws>. A run with no fork yet leans nowhere.
function pauseWorldLine() {
  const u = (typeof universe === 'function' && universe()) || null;
  if (!u) return '';
  const lean = u.depth === 0 ? '—'
    : (u.mercy >= u.sever && u.mercy >= u.red) ? t('br_mercy')
    : (u.sever >= u.red) ? t('br_sever') : t('br_red');
  const laws = (u.anom || []).map(a => (typeof BR_ANOM !== 'undefined' && BR_ANOM[a]) ? BR_ANOM[a].n : a).join(' · ');
  return t('pm_world') + ' ' + u.id + '   ·   ' + lean + (laws ? '   ·   ' + laws : '');
}
// TWO COLUMNS ONCE ONE IS TOO TALL. With the reading options the list reached
// seventeen rows on a phone: an 18 px pitch, 10 px type, and every row's hint
// written over the row below it. Past PAUSE_ONE_COL rows the menu splits —
// going places on the left, how the game behaves on the right — and the
// selected row's hint gets a line of its own under both. `items` is in
// navigation order (left column, then right), so UP/DOWN, the touch hit-test
// and the drawing all walk the same list; pos(i) is the one geometry.
const PAUSE_ONE_COL = 12;
const PAUSE_SETTING = { ctrl: 1, touch: 1 };
function pauseLayout() {
  const all = pauseItems();
  if (all.length <= PAUSE_ONE_COL) {
    const step = Math.min(40, Math.floor(322 / all.length)), y0 = 322 - (all.length - 1) * step / 2;
    return { items: all, step, y0, cols: 1, colW: 360, split: all.length, pos: i => ({ x: 480, y: y0 + i * step }) };
  }
  const left = all.filter(it => !(it.arrows || PAUSE_SETTING[it.id]));
  const right = all.filter(it => it.arrows || PAUSE_SETTING[it.id]);
  const items = left.concat(right), rows = Math.max(left.length, right.length);
  const step = Math.min(40, Math.floor(296 / rows)), y0 = 188 + step / 2;
  const rtl = typeof isRTL === 'function' && isRTL();
  // reading order: the first column is the one a reader starts from
  const xa = rtl ? 662 : 298, xb = rtl ? 298 : 662;
  return { items, step, y0, cols: 2, colW: 340, split: left.length,
    pos: i => i < left.length ? { x: xa, y: y0 + i * step } : { x: xb, y: y0 + (i - left.length) * step } };
}
function updatePause() {
  const PL = pauseLayout(), pm = PL.items, n = pm.length;
  if (inP('DOWN')) { G.pauseIdx = (G.pauseIdx + 1) % n; G.pauseConfirm = null; sfx('ui'); }
  if (inP('UP')) { G.pauseIdx = (G.pauseIdx + n - 1) % n; G.pauseConfirm = null; sfx('ui'); }
  if (inP('PAUSE')) { G.pauseConfirm = null; G.state = 'PLAY'; return; }
  // in two columns, LEFT/RIGHT on a plain row crosses to the other column (a
  // dial row keeps them for its value)
  const cur0 = pm[G.pauseIdx] || pm[0];
  if (PL.cols === 2 && !cur0.arrows && (inP('LEFT') || inP('RIGHT'))) {
    const inLeft = G.pauseIdx < PL.split, row = inLeft ? G.pauseIdx : G.pauseIdx - PL.split;
    const other = inLeft ? [PL.split, n - 1] : [0, PL.split - 1];
    G.pauseIdx = Math.min(other[1], other[0] + row); G.pauseConfirm = null; sfx('ui');
    return;
  }
  const cur = pm[G.pauseIdx] || pm[0];
  if (cur.id === 'pace' && (inP('LEFT') || inP('RIGHT'))) {
    const d = inP('RIGHT') ? 1 : -1, n2 = PACE_STEPS.length;
    G.save.pace = ((((G.save.pace | 0) + d) % n2) + n2) % n2;
    sfx('ui'); persist();
  }
  if (cur.id === 'qual' && (inP('LEFT') || inP('RIGHT'))) { qualCycle(); sfx('ui'); }
  if (cur.id === 'tspd' && (inP('LEFT') || inP('RIGHT') || inP('OK'))) {
    textSpeedCycle(inP('LEFT') ? -1 : 1); sfx('ui'); persist();
    return;                           // the row cycles; it does not also fire
  }
  if (cur.id === 'rmot' && (inP('LEFT') || inP('RIGHT') || inP('OK'))) {
    reduceMotionToggle(); sfx('ui'); persist();
    return;
  }
  if (cur.id === 'gest' && (inP('LEFT') || inP('RIGHT') || inP('OK'))) {
    G.save.gestOff = G.save.gestOff ? 0 : 1;
    if (G.save.gestOff && typeof tGestureRelease === 'function') tGestureRelease();
    sfx('ui'); persist();
    if (inP('OK')) return;            // the row toggles; it does not also fire
  }
  if (inP('OK')) {
    // THROWING A RUN AWAY TAKES TWO PRESSES. Restart and Quit sit at the bottom
    // of a list the player scrolls through with the same key that confirms, and
    // one of them cannot be undone.
    if (cur.warn && G.pauseConfirm !== cur.id) { G.pauseConfirm = cur.id; sfx('ui'); return; }
    G.pauseConfirm = null;
    sfx('ok');
    if (cur.id === 'resume') G.state = 'PLAY';
    else if (cur.id === 'map') { if (mapUnlocked()) G.state = 'MAP'; else { sfx('no'); G.toast(t('map_locked')); } }
    else if (cur.id === 'bag') { G.state = 'BAG'; G.bagIdx = 0; }
    else if (cur.id === 'crests') { G.state = 'CREST'; G.crestIdx = 0; }
    else if (cur.id === 'skills') { G.state = 'SKILLS'; G.skillIdx = 0; }
    else if (cur.id === 'tree') ptOpen('PAUSE');
    else if (cur.id === 'relics') G.state = 'RELICS';
    else if (cur.id === 'ctrl') { G.ctrlBack = 'PAUSE'; G.state = 'CTRL'; }
    else if (cur.id === 'pace') {
      G.save.pace = (((G.save.pace | 0) + 1) % PACE_STEPS.length);
      G.toast(t('pace') + '  ' + paceLabel()); persist();
    }
    else if (cur.id === 'qual') { qualCycle(); G.toast(t('qual') + '  ' + qualLabel()); }
    else if (cur.id === 'films') { G.state = 'FILMS'; G.filmIdx = 0; }
    else if (cur.id === 'comics') ComicRewards.library();
    else if (cur.id === 'panels') { G.state = 'PANELLIST'; G.panelIdx = 0; }
    else if (cur.id === 'touch') G.state = 'TCFG';
    else if (cur.id === 'restart') {
      // same difficulty, same world, nothing carried — the run starts over
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
// ONE GEOMETRY for the relic case, read by the drawing and tests/loadout.cjs.
// Two columns in reading order: in Arabic the first relic is top-RIGHT and the
// seal sits on the right of its name, the way the line is read.
function relicsLayout() {
  const owned = (G.save && G.save.relics) || [];
  const rtl = typeof isRTL === 'function' ? isRTL() : LANG === 'ar';
  return { owned, rtl, r: 17, pos: i => {
    const col = i % 2;
    return { x: rtl ? 710 - col * 400 : 250 + col * 400, y: 120 + Math.floor(i / 2) * 62 };
  } };
}
function drawRelics() {
  c.fillStyle = 'rgba(4,7,12,0.88)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('rl_title'), 480, 46, 28, '#eef3fa', 'center', LOADOUT_COL.relic);
  const L = relicsLayout(), owned = L.owned;
  if (!owned.length) {
    wrapText(t('rl_none'), 620, 17).forEach((ln, i) => ftxt(ln, 480, 250 + i * 26, 17, '#8aa2b5'));
  } else {
    owned.forEach((id, i) => {
      const P = L.pos(i), x = P.x, y = P.y;
      // the relic's seal (js/loadout.js): carried, so filled
      drawLoadoutFrame(c, 'relic', x, y, L.r, 'filled', RELIC_ICONS[id] || '◆', '#eef3fa');
      const tx = L.rtl ? x - 30 : x + 30, al = L.rtl ? 'right' : 'left';
      ftxt(t('rl_' + id), tx, y - 9, 16, '#eef3fa', al);
      // wrapped to its column: a long line used to run off the screen's edge
      // (Glitch Fang in English, most of them in Arabic)
      wrapText(t('rl_' + id + 'd'), 256, 12).slice(0, 2)
        .forEach((ln, k) => ftxt(ln, tx, y + 11 + k * 15, 12, '#8aa2b5', al, null, '600'));
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
  // (her blades, her powers and the keys that use them are the GEAR screen:
  // from the bag the same key that opens it anywhere opens it here, and with
  // nothing in the bag OK goes there too — the bag used to answer "what do I
  // have?" with "nothing but scrap and nerve" while she carried a sword)
  if (inP('CREST') || (!list.length && inP('OK'))) { G.state = 'CREST'; G.crestIdx = 0; sfx('ui'); return; }
  if (inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
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
  const toGear = t('bag_gear').replace('%k', howToOpen('CREST', t('crest_title')));
  if (!list.length) { ftxt(t('bag_none'), 480, 250, 17, '#7d93a8'); ftxt(toGear, 480, 300, 15, '#ffd76a'); ftxt(t('rl_close'), 480, 516, 12, '#7d93a8'); return; }
  ftxt(toGear, 480, 106, 13, '#ffd76a');
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
// ---------------------------------------------------------------------------
// THE EMPORIUM SAYS WHY IT OPENED, AND WHAT IT WOULD BUY (owner, 2026-11-16:
// "when you open the Ratchet's Emporium... I have no idea what to get. I don't
// know why you opened it. You should mark the thing they want me to buy" — and
// again: "I wasn't paying attention, and suddenly the window opened... I did
// not know what to do and what to purchase, so I purchased everything").
//
// Three things were wrong at once. The shop opened by itself on the last line
// of a conversation; the key that turns a page of talk is the key that buys,
// so a player still pressing it bought the row the cursor was on; and nothing
// on the shelf said which line was the one worth her scrap.
//   - It opens on a QUESTION when a conversation led to it: Ratchet's one line
//     of why, and "Browse" or "Not now". Nothing can be bought from that card.
//   - A press that was already down when the shelf appears buys nothing: the
//     first purchase needs a press made AFTER it opened, half a second in.
//   - One row is RATCHET'S PICK, marked, with the reason said under the title,
//     and the cursor starts on it. The pick is what she lacks most: the pack if
//     she has none, a refill if she is low, else the cheapest seal she can
//     afford — or, if she can afford nothing, the one to save for and how far
//     off it is.
// ---------------------------------------------------------------------------
const SHOP_PICK_ORDER = ['sprint', 'siphon', 'claws', 'over', 'plate'];
// the shelf's rows: the drawing and the touch layer read the same two numbers. TEN ROWS since the
// pack's rung (2026-11-25): at 41 apart the last row's line sat on the key hint at 512 (reviewed in
// the pack-ladder clip, 2026-11-26) — at 37 from 132 the last row's lines end at 484, each row's
// text clears its neighbours', and tests/shop-ask.cjs measures every drawn line against the others
const SHOP_ROW = { y0: 132, step: 37, h: 35 };
function shopCost(it) { return Math.floor(it.cost * (relicHas('coin') ? 0.9 : 1)); }
function shopPick() {
  if (!G.save) return null;
  if (G.shopWho === 'patch') {
    const it = shopList().find(q => !shopSold(q)); if (!it) return null;
    return G.save.scrap >= shopCost(it) ? { it, why: 'shop_why_buy' } : { it, why: 'shop_why_save', need: shopCost(it) - G.save.scrap };
  }
  const f = G.save.flags || {}, cell = SHOP.find(q => q.type === 'cell');
  if (cell && !f.heal) return { it: cell, why: 'shop_why_pack' };
  if (cell && player && player.volts < player.voltMax() * 0.5 && G.save.scrap >= shopCost(cell)) return { it: cell, why: 'shop_why_cell' };
  const open = SHOP.filter(q => q.type !== 'cell' && !shopSold(q) && (q.type !== 'core' || shopCoreOpen()) && (q.type !== 'volley' || shopVolleyOpen()) && (q.type !== 'packup' || shopPackOpen()));
  if (!open.length) return null;
  const rank = (q) => { const i = SHOP_PICK_ORDER.indexOf(q.id); return i < 0 ? 99 : i; };
  const can = open.filter(q => G.save.scrap >= shopCost(q)).sort((a, b) => rank(a) - rank(b) || a.cost - b.cost);
  if (can.length) return { it: can[0], why: 'shop_why_buy' };
  const next = open.slice().sort((a, b) => a.cost - b.cost)[0];
  return { it: next, why: 'shop_why_save', need: shopCost(next) - G.save.scrap };
}
// WHOSE SHELF: Ratchet's (SHOP) or the Tinker's (TINKER_SHOP, js/packtree.js: the ride)
function shopList() { return G.shopWho === 'patch' && typeof TINKER_SHOP !== 'undefined' ? TINKER_SHOP : SHOP; }
function shopOpen(ask, who) {
  G.state = 'SHOP';
  G.shopWho = who || 'ratchet';
  const pk = shopPick();
  G.shopIdx = pk ? Math.max(0, shopList().indexOf(pk.it)) : 0;
  G.shopAsk = !!ask; G.shopAskIdx = 0;
  G.shopGuard = 0.5;                        // s: no purchase before this, whatever is held
  G.shopArmed = false;                      // ...and not until OK has been seen UP once
}
function updateShop() {
  G.shopGuard = Math.max(0, (G.shopGuard || 0) - 1 / 60);
  if (!inD('OK')) G.shopArmed = true;
  if (G.shopAsk) {
    if (inP('BACK')) { G.state = 'PLAY'; G.shopAsk = false; sfx('ui'); return; }
    if (inP('LEFT') || inP('RIGHT') || inP('UP') || inP('DOWN')) { G.shopAskIdx = G.shopAskIdx ? 0 : 1; sfx('ui'); }
    if (inP('OK') && G.shopArmed && G.shopGuard <= 0) {
      sfx('ui');
      if (G.shopAskIdx === 1) { G.state = 'PLAY'; G.shopAsk = false; return; }
      G.shopAsk = false; G.shopGuard = 0.35; G.shopArmed = false;
    }
    return;
  }
  if (inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
  const SL = shopList();
  if (inP('DOWN')) { G.shopIdx = (G.shopIdx + 1) % SL.length; sfx('ui'); }
  if (inP('UP')) { G.shopIdx = (G.shopIdx + SL.length - 1) % SL.length; sfx('ui'); }
  if (inP('OK') && G.shopArmed && G.shopGuard <= 0) {
    const it = SL[G.shopIdx];
    if (!it) return;
    if (!isHero() && G.save.storyVersion >= 2 && !G.save.flags.heal && it.type !== 'cell') {
      G.toast(t('story_pack_first')); sfx('no'); return;
    }
    if (shopSold(it)) { sfx('no'); return; }
    // ONE DEAR LIFE, AND NOT ALWAYS (owner, 2026-11-20: "You might be able to
    // purchase one life from Ratchet with a higher price, like a very high
    // price, but shouldn't be available all the time"): on his shelf only once
    // a sage has fallen, once, at 1200
    if (it.type === 'core' && !shopCoreOpen()) { G.toast(t('s_core_wait')); sfx('no'); return; }
    if (it.type === 'volley' && !shopVolleyOpen()) { G.toast(t('s_volley_wait')); sfx('no'); return; }
    if (it.type === 'packup' && !shopPackOpen()) { G.toast(t('s_packup_wait')); sfx('no'); return; }
    if (it.type === 'alride' && !ptRideOpen()) { G.toast(ptHarness() && !ptHas('alcall') ? t('pk_first').replace('%s', t('pk_n_alcall')) : t('pk_harness')); sfx('no'); return; }
    const cost = Math.floor(it.cost * (relicHas('coin') ? 0.9 : 1));
    if (G.save.scrap < cost) { G.toast(t('poor')); sfx('no'); return; }
    G.save.scrap -= cost; sfx('buy');
    if (it.type === 'cell') {
      // consumable, so it never leaves the list and never stops being useful
      player.volts = player.voltMax();
      G.save.flags.tutBuy = 1;
      burst(player.x + player.w / 2, player.y + 6, 16, '#ffd76a', 200, 0.6, 120, 3, true);
      // THE FIRST ONE IS THE PACK. It wires the HEAL PROTOCOL and the VOLT
      // BURST into her — the two things the volts are FOR — and says so once,
      // on the card, because a verb nobody announced is a verb nobody finds
      // (see burstUnlocked). Every cell after it is a refill.
      if (!G.save.flags.heal) {
        G.save.flags.heal = 1; G.save.flags.pack = 1;
        // the card says what it does with HER controls, and shows it working —
        // and it hands back to the world, not the shop: the next lesson (heal)
        // happens in-world (js/npc_shop_exit_fix.js leaves the shop after the
        // tutorial purchase for the same reason)
        const pk = typeof opPackCard === 'function' ? opPackCard() : showItem(t('i_pack'), t('i_packd'));
        if (pk && pk.ret === 'SHOP') pk.ret = null;
        return;
      }
      G.toast(t('s_cell') + '  ⚡ ' + player.volts);
      persist();
      return;
    }
    if (it.type === 'crest') grantCrest(it.id);
    else if (it.type === 'slot') { G.save.slots++; G.save.shop[it.id] = 1; showItem(t('s_slot'), t('s_slotd')); }
    else if (it.type === 'packup') ptBuy(ptNextRatchet());
    else if (it.type === 'alride') ptBuy(ptNode('alride'));
    else if (it.type === 'volley') { G.save.shardLv = shardLevel() + 1; showItem(t('s_volley'), t('s_volley_now').replace('%n', String(G.save.shardLv))); }
    else { G.save.coresMax++; player.cores++; G.save.shop[it.id] = 1; showItem(t('s_core'), t('s_cored')); }
  }
}
const SHOP_VOLLEY = [600, 900, 1300];          // to 2, to 3, to 4 stars
function shardLevel() { return Math.max(1, Math.min(4, (G.save && G.save.shardLv) | 0 || 1)); }
function shopVolleyOpen() { return !isHero() && !!(G.save && G.save.arms && G.save.arms.includes('shard')); }
function shopPackOpen() { return !isHero() && !!(G.save && G.save.arms && G.save.arms.includes('pack')); }
function shopCoreOpen() { return !!(G.save && G.save.flags && (G.save.flags.sageLives | 0) > 0); }
function shopSold(it) {
  if (it.type === 'cell') return false;          // a consumable is never sold out
  if (it.type === 'volley') return shardLevel() >= 4;
  if (it.type === 'packup') return typeof ptNextRatchet === 'function' ? !ptNextRatchet() : !!G.save.shop[it.id];
  if (it.type === 'alride') return typeof ptHas === 'function' && ptHas('alride');
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
// ONE GEOMETRY FOR THE TREE, read by the drawing AND by the tap targets — the
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
    ftxt(owned ? '✓' : (open ? String(sk.cost) : '🔒'), p2.x, p2.y, owned ? 18 : 13, owned ? '#7de8a0' : open ? '#dbe7f2' : '#607386');
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
// looked broadly right — but the base direction governs where neutral
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
  // the Cutter's kerf (§2aq): the split-stone shop in the wall of the Cache.
  // Unfired — the room borrows the zone-X atlas cell until the plate lands.
  V1B: 'kerfInterior',
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
  V1B: 'floorKerf',       // the Cutter's kerf: cut rock, crystal grit, saw-scored
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
  // THE PLATE IS NAILED TO THE ROOM. Both layers used to ride their own
  // parallax — the far one at 0.35 across and 0.22 down, the near one at 0.92
  // — so in any room taller or wider than the screen the roof slid against the
  // rock it hangs from: 8% of a 34-row shaft's scroll is 64 px of plate
  // drifting down into the room, and it could never meet the floor art of the
  // room stacked above, which IS world-locked. A roof is part of the building,
  // so both layers now move exactly with the grid: the near plate hangs from
  // world y -8 (just over row 0's top edge, where the room above's floor ends)
  // and the far plate behind it from -26, offset half a plate across so the two
  // never print the same stamp in the same place. The depth the far layer was
  // for comes from its darkness and its offset, not from sliding.
  // the same rounded offset the tile layer is translated by, so plate and
  // rock never shimmer half a pixel apart
  const sx = Math.round(camSX()), sy = Math.round(camSY());
  const wrapX = (v) => -(((v % CEIL_TW) + CEIL_TW) % CEIL_TW);
  // across the whole view: wider than 960 when the world is drawn zoomed out (WORLD_VIEW)
  const V = WORLD_VIEW, vx0 = V.x, vx1 = V.x + V.w, back = (x) => x - Math.ceil(Math.max(0, x - vx0) / CEIL_TW) * CEIL_TW;
  // FAR: dark, wide — the thickness of the roof
  if (tier >= 2) {
    const fy = -sy - 26, fh = CEIL_TH * 1.18;
    if (fy + fh > 0) {
      c.save();
      c.globalAlpha = 0.55;
      const fx = back(wrapX(sx + CEIL_TW / 2));
      for (let x0 = fx; x0 < vx1 + CEIL_TW; x0 += CEIL_TW)
        c.drawImage(tex, x0, fy, CEIL_TW, fh);
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(vx0, V.y, V.w, fh + fy - V.y);
      c.restore();
    }
  }
  // NEAR: on the room's own grid, so it belongs to the geometry
  const ny = -sy - 8;
  if (ny + CEIL_TH + 40 <= 0) return;           // scrolled out of sight above
  c.save();
  const nx = back(wrapX(sx));
  for (let x0 = nx; x0 < vx1 + CEIL_TW; x0 += CEIL_TW)
    c.drawImage(tex, x0, ny, CEIL_TW, CEIL_TH);
  // the kingdom's own light spilling down off it
  c.globalCompositeOperation = 'lighter';
  const g2 = c.createLinearGradient(0, ny + CEIL_TH * 0.55, 0, ny + CEIL_TH + 40);
  g2.addColorStop(0, 'rgba(0,0,0,0)');
  g2.addColorStop(0.6, (P && P.glow ? P.glow : '#37ffd0') + '22');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g2; c.fillRect(vx0, ny + CEIL_TH * 0.55, V.w, CEIL_TH * 0.5 + 40);
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
    // the Meadows drip condensation off the vines — and where the sky is open
    // there is no vine overhead to hang from, so the same water arrives the
    // way meadow water does: already falling. Under a sky room's derived lid
    // (js/world.js skyUnder) there IS rock overhead, and water beads on it.
    const dx = spawnX(), lidRow = G.grid && G.grid[0];
    const open = G.roomDef.sky && !(lidRow && lidRow[Math.floor(dx / TILE)] === '#');
    push(open
      ? { k: 'drip', x: dx, y: -10, vy: rnd(70, 120), t: 0, hang: 0, r: rnd(1.4, 2.2) }
      : { k: 'drip', x: dx, y: 0, vy: 0, t: 0, hang: rnd(0.4, 1.6), r: rnd(1.6, 2.6) });
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
      c.fi�my��$z{-���jם
//   `at`    the room the step's destination is in — tutPrompt leads her there
//           from anywhere in the waking rooms (out of the den, into the booth)
//   `room`  the room whose state completes it — a lesson is learned where it
//           is taught (a swing in the den is not a strike at the winch)
//
// The story beats between steps (the letter, the repair, Ratchet's short
// explanation, the spare cell, the pod line, the pack pitch and the scrap he
// pays her with) are js/opening.js, which owns Ratchet and Servo through the
// opening; this table owns only what the player is asked to DO.
// ===========================================================================
const TUT_STEPS = [
  { id: 'move', label: 'tut_move', hint: 'tut_move_h', at: 'W1',
    done: () => Math.abs(player.vx) > 40 },
  // ...and now she has to USE it: the door out of the room she woke in.
  { id: 'out', label: 'tut_out', hint: 'tut_out_h', at: 'W1',
    done: () => (TUT_ROOMS[G.roomId] || 0) >= 1 },
  { id: 'jump', label: 'tut_jump', hint: 'tut_jump_h', at: 'W2', room: 'W2',
    done: () => (!player.on && player.vy < -60 && (typeof window === 'undefined' || !window.__tutorialEnforcement || !!G.tut.jumpShown))
      || (typeof tutOnJumpShelf === 'function' && tutOnJumpShelf()) },
  // THE FIRST FIGHT, BEFORE ANYONE SPEAKS (owner's order, 2026-11-14, after
  // the review of what hooks a player in the first minute: "a fight in the
  // first minute or two... she should win something before anyone speaks").
  // The opening used to hand her a letter, a drawer, a repair board, five pages
  // and a shop before the first thing she could hit — and that thing was a
  // jammed winch that did not hit back. One small hostile machine crawls the
  // road to the gates now (loadRoom, W2), her claws answer from the first
  // frame, and breaking it is the step. See TUT_UNLOCK: ATK is no longer a
  // lesson's gift.
  { id: 'claw', label: 'tut_claw', hint: 'tut_claw_h', at: 'W2', room: 'W2', robo: true,
    done: () => !!G.save.flags.firstKill },
  // THE GATES: the only way into the city, and they close behind her.
  { id: 'gate', label: 'tut_gate', hint: 'tut_gate_h', at: 'W2',
    done: () => (TUT_ROOMS[G.roomId] || 0) >= 2 },
  // RATCHET'S BOOTH, the first thing past the gates. Nothing is fought on the
  // way to him: the winch stands BEYOND the booth and is calm until taught.
  { id: 'booth', label: 'op_booth', hint: 'op_booth_h', at: 'A0', robo: true,
    done: () => G.roomId === 'A0B' },
  // THE LETTER FIRST. It is what tells her there is a battery, and where.
  { id: 'note', label: 'op_note', hint: 'op_note_h', at: 'A0B', room: 'A0B', robo: true,
    done: () => !!(G.save.flags.opNote || G.save.flags.ratchetRepaired) },
  { id: 'drawer', label: 'op_drawer', hint: 'op_drawer_h', at: 'A0B', room: 'A0B', robo: true,
    done: () => invCount('ratchetCell') > 0 || !!G.save.flags.ratchetRepaired },
  // ...the repair board, and the short explanation he gives on waking (it
  // ends on the spare cell for Servo and the line that sends her to the pod)
  { id: 'repair', label: 'op_repair', hint: 'op_repair_h', at: 'A0B', room: 'A0B', robo: true,
    done: () => !!(G.save.flags.ratchetRepaired && G.save.flags.opTold) },
  // "This pod saves your progress and recharges you. Use it before you
  // leave." Done once the rest has finished AND its confirmation has been on
  // screen — the next lesson is only introduced after it (opening.js).
  { id: 'pod', label: 'op_pod', hint: 'op_pod_h', at: 'A0B', room: 'A0B', robo: true,
    done: () => !!G.save.flags.opPod },
  // NEED BEFORE TEACH (same order, item 2: "move the shop pitch to after the
  // first fight outside, when she actually needs to heal"). The pack used to be
  // pitched in the den, cold, and its first surge had to be SCRIPTED to cost a
  // core so there was something to heal. Now the winch does it for real: she
  // strikes it, scrap flies out of the housing (twelve of it — the pack's own
  // price), and on the third blow it bites back and takes a core
  // (YardWinch.onStruck). Claws only scratch it. THEN Ratchet has something to
  // sell, and she has the reason and the scrap to buy it.
  // (both the 'atk' and the 'pack' lessons are the old purchase: in the robot world the pack is
  // Ratchet's thanks on waking, so once she holds it they pass WHEREVER she is — `room` held them
  // to A0 and A0B, and the walk sent her out to the winch and straight back in to Ratchet for a
  // purchase already made. Owner, 2026-11-26: "the system still requires me to go back inside after
  // I go outside for no reason ... I think it's a glitch from the previous walkthrough, which we
  // shortened." tests/opening-order.cjs)
  { id: 'atk', label: 'op_atk', hint: 'op_atk_h', at: 'A0', room: 'A0', hero: ['tut_atk', 'tut_atk_h'],
    passAnywhere: () => !(typeof isHero === 'function' && isHero()) && !!G.save.flags.heal,
    done: () => (typeof isHero === 'function' && isHero())
      ? (!!player.swing || player.comboT > 0)
      : !!(G.save.flags.winchBit || G.save.flags.heal || G.save.flags.burstDone) },
  // THE VOLT PACK: two lines — what it does, what it costs — and his counter
  // opens with the pack marked. One purchase; the step is the purchase.
  { id: 'pack', label: 'op_pack', hint: 'op_pack_h', at: 'A0B', room: 'A0B', robo: true,
    passAnywhere: () => !!G.save.flags.heal,
    done: () => !!G.save.flags.heal },
  // THE CORE THE WINCH TOOK, mended with what she just bought. (A save that
  // reaches this at full health — it rested at the pod on the way back — still
  // gets the one scripted surge in tutEnter, because repair cannot be taught
  // to somebody with nothing to repair.)
  { id: 'heal', label: 'op_heal', hint: 'op_heal_h', hero: ['tut_heal', 'tut_heal_h'],
    done: () => player.cores >= player.maxCores() },
  { id: 'burst', label: 'op_burst', hint: 'op_burst_h', at: 'A0', room: 'A0', hero: ['tut_burst', 'tut_burst_h'],
    done: () => !!(G.save.flags && G.save.flags.burstDone) },
  // THE FIRST PUZZLE MONUMENT, just past the winch, on the same screen as the
  // booth door and on the way out — never behind her.
  { id: 'node', label: 'op_node', hint: 'op_node_h', at: 'A0', room: 'A0', hero: ['tut_node', 'tut_node_h'],
    done: () => !!G.save.flags.rd_n8 || (G.save.iq | 0) >= 10 },
  { id: 'go', label: 'op_go', hint: 'op_go_h', at: 'A0', hero: ['tut_go', 'tut_go_h'],
    done: () => false },                       // ends by leaving the room
];
// TWO GAMES, ONE ENGINE: NOSTOS shares these rooms but not Ratchet's story —
// its trader is awake, its hero heals and bursts from birth. `robo` steps are
// passed over in that world, and `hero` names the generic wording it keeps.
const TUT_LAST = TUT_STEPS.length - 1;         // the 'go' step, and the open door
// ...and the list the saves were written against before the opening was
// rebuilt, so an index saved by that build resumes on the right lesson.
const TUT_OLD_IDS = ['move', 'out', 'jump', 'gate', 'atk', 'kill', 'coin', 'buy', 'heal', 'burst', 'node', 'skill', 'go'];
// Some lessons need the world to change before they make any sense.
function tutEnter(st) {
  if (!st || !player) return;
  // (the robot world: the pack is Ratchet's gift on waking, owner 2026-11-20,
  // "one shot instead of multiple steps" — she is whole, the card has said what
  // the pack does, and the first real hurt is what teaches the mend. Only
  // NOSTOS, whose hero heals from birth, still stages the surge.)
  if (st.id === 'heal' && player.cores >= player.maxCores() && typeof isHero === 'function' && isHero()) {
    // THE FIRST SURGE, ON PURPOSE. Repair cannot be taught to somebody at full
    // health: the button does nothing, and a lesson whose demonstration is a
    // no-op lands as noise. So the pack's first surge bites once — scripted,
    // capped at this single core, and staged in the den where nothing else
    // can hurt her while she works out the answer. The chip says why.
    player.cores = Math.max(1, player.cores - 1);
    G.coreFlash = { i: player.cores, t: 0.6 };
    player.iT = Math.max(player.iT || 0, 1.4);
    cam.shake = Math.max(cam.shake, 5);
    G.flash = Math.max(G.flash, 0.5);
    sfx('hurt');
    burst(player.x + player.w / 2, player.y + player.h / 2, 20, '#8ff6ff', 230, 0.6, 90, 3, true);
    if (typeof tBuzz === 'function') tBuzz(60);
  }
  // the pack was bought full; a heal spends a third of it. The burst lesson
  // must never be refused for want of volts she was never told to earn.
  if (st.id === 'heal' && player.volts < player.healCost()) player.volts = player.healCost();
  if (st.id === 'burst' && typeof BURST_VOLTS === 'number' && player.volts < BURST_VOLTS) player.volts = BURST_VOLTS;
}
// WHAT THE CHIP SAYS, AND WHY IT STOPPED SAYING "stick".
//
// The chip names the control this player actually has in their hands: the key
// they bound, the pad button they bound, or the on-screen glyph on a phone
// (ctlName, js/story-opening.js — the same names the dialogue fills {ATK}
// with, so a chip and a line can never disagree). Walking steps show the
// direction to go, not the name of the stick.
const TUT_DIR = { move: '← →', out: '→', go: '→' };
// WHICH WAY THE STEP POINTS, as a direction the world arrow and the touch stick
// can both draw. The marker used to be one shape for everything — an arrow
// pointing DOWN at its target — so the first instruction of the game, "walk
// right", was illustrated by an arrow pointing at the floor, and the door that
// asks for UP had an arrow aimed down at her head. Owner, 2026-10-30: "the
// arrow direction is downward instead of to the right, which is confusing ...
// they just stand there and do not know what to do", and "when they reach the
// door, press up should be more obvious".
function tutDir(st, pv) {
  if (!st || !pv || pv.suppressed) return null;
  if (pv.action === 'UP') return 'up';
  if (pv.action && pv.action !== 'MOVE') return null;
  const h = tutHand(pv);
  return h === '←' ? 'left' : (h === '→' || h === '← →') ? 'right' : null;
}
const TUT_ACTION = { jump: 'JUMP', claw: 'ATK', note: 'INT', drawer: 'INT', repair: 'INT', pod: 'INT', pack: 'INT',
  heal: 'HEAL', atk: 'ATK', burst: 'ATK', node: 'INT' };
function tutHand(st) {
  if (st.control) return st.control;
  if (st.action === 'MOVE' || !st.action) return TUT_DIR[st.id] || '→';
  if (typeof ctlName === 'function') return ctlName(st.action);
  return st.action;
}
// THE NEXT ACTION, AND WHERE. One target, one control: far from the target the
// chip points the way (an arrow, "follow the gold marker"); at it, the chip
// names the one control that does the step. A step whose destination is in
// another waking room leads her there first — out of the den by its door, or
// into the booth — so the walk always runs forward to the thing being taught.
function tutPrompt(st) {
  const action = TUT_ACTION[st.id] || 'MOVE';
  const view = { ...st, target: null, action, vb: action === 'MOVE' ? null : 'V' + action };
  // Entry is already complete; the short completion hold must not route
  // her back outside before the letter lesson becomes active.
  if (st.id === 'booth' && G.roomId === 'A0B') {
    view.suppressed = true; view.action = null; view.vb = null; return view;
  }
  if (st.hero && typeof isHero === 'function' && isHero()) { view.label = st.hero[0]; view.hint = st.hero[1]; }
  const pc = player.x + player.w / 2;
  const doors = typeof gateDoors === 'function' ? gateDoors() : [];
  const point = (x, y, color, radius = 30) => { view.target = { x, y, color, radius }; };
  const travel = () => {
    view.action = 'MOVE'; view.vb = null;
    view.control = !view.target || pc < view.target.x ? '→' : '←';
    view.hint = 'tut_workshop_h';
  };
  // a door is walked to, then entered with UP
  const doorPrompt = (door, label, hint) => {
    const x = gateWorldX(door);
    point(x, 13 * TILE, '#ffd76a');
    view.label = label; view.hint = hint;
    view.action = 'UP'; view.vb = null; view.control = null;
    if (Math.abs(pc - x) > 80) travel();
  };
  // ...and a thing is walked to, then used with the step's own control
  const useAt = (s, color) => {
    if (!s) return false;
    point(s.x + s.w / 2, s.y + s.h / 2, color || '#ffd76a');
    if (G.near !== s) travel();
    return true;
  };
  // ---- the right room first ----
  if (st.at && G.roomId !== st.at) {
    if (G.roomId === 'A0B' && doors[0]) doorPrompt(doors[0], 'op_back', 'op_back_h');
    else if (G.roomId === 'A0' && st.at === 'A0B') {
      const booth = doors.find(d => d.style === 'booth');
      if (booth) doorPrompt(booth, 'op_booth', 'op_booth_h');
    } else if (G.roomId === 'W2' && doors[0]) doorPrompt(doors[0], 'tut_gate', 'tut_gate_h');
    else if (G.roomId === 'W1') { point((G.roomDef.w - 1.5) * TILE, 13 * TILE, '#ffd76a'); travel(); view.label = 'tut_out'; view.hint = 'tut_out_h'; }
    return view;
  }
  // ---- the step itself ----
  const ratchet = (G.statics || []).find(q => q.type === 'npc' && q.extra === 'ratchet');
  if (st.id === 'out' || st.id === 'go') point((G.roomDef.w - 1.5) * TILE, 13 * TILE, '#ffd76a');
  else if (st.id === 'jump') point(13 * TILE, 11 * TILE, '#37ffd0', 34);
  else if (st.id === 'gate') { if (doors[0]) doorPrompt(doors[0], 'tut_gate', 'tut_gate_h'); }
  else if (st.id === 'booth') {
    const booth = doors.find(d => d.style === 'booth');
    if (booth) doorPrompt(booth, 'op_booth', 'op_booth_h');
  } else if (st.id === 'note' || st.id === 'repair' || st.id === 'pack') useAt(ratchet);
  else if (st.id === 'drawer') {
    const drawer = (G.statics || []).find(q => q.type === 'chest' && q.extra === 'it:batt' && !q.opened);
    if (!useAt(drawer)) useAt(ratchet);
  } else if (st.id === 'pod') useAt((G.statics || []).find(q => q.type === 'bench'), '#8ff6ff');
  else if (st.id === 'atk' || st.id === 'burst' || st.id === 'claw') {
    const enemy = (G.enemies || []).find(q => q && !q.dead && !q.disabled);
    if (enemy) {
      point(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ff8a6a');
      if (typeof tutorialReady === 'function' && !tutorialReady(view) && !(G.tut && G.tut.hold > 0)) travel();
    }
  } else if (st.id === 'node') useAt((G.statics || []).find(q => q.type === 'riddle' && !q.opened), '#c9a6ff');
  else if (st.id === 'heal') point(pc, player.y + player.h / 2, '#aef7d8', 32);
  if (view.action === 'JUMP' && typeof tutorialReady === 'function'
      && !tutorialReady(view) && view.target && !(G.tut && G.tut.hold > 0)) travel();
  return view;
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
// JUMP IS NOT ON THIS LIST ANY MORE (owner, 2026-08-24: "start with direction
// controllers and jump from the very beginning").
//
// It was gated behind its own lesson, which sits two steps in — after she has
// walked and after she has left the room she woke in. So the first minute of
// the game handed the player a stick and nothing else, and a jump button that
// appeared later reads as the game having been broken until then rather than
// as a lesson. Walking and jumping are the two things a player will try before
// they read anything, and both now answer from the first frame.
//
// The LESSON still happens where there is something to clear — the step in W2
// — because teaching a verb is not the same as permitting it. What changed is
// that pressing jump before that point does what it looks like it should.
// INTERACT arrives with the letter (the first thing she is asked to use), the
// claw with the strike lesson at the winch, SKILL with the open road.
// THE CLAW IS NOT ON THIS LIST ANY MORE EITHER (owner, 2026-11-14: "claws
// available from the start"). It waited for the winch lesson, eleven steps in,
// so the thing every player tries third — after walking and jumping — did
// nothing for the whole first act. It answers from the first frame; the lesson
// (the 'claw' step, on the road to the gates) is where there is something to
// hit, exactly as the jump's is where there is something to clear.
const TUT_UNLOCK = { INT: 'note', HEAL: 'heal', SKILL: 'go', WHEEL: 'go', CREST: 'go', DASH: 'go', CAST: 'go', SONG: 'go', CLAW: 'go', ARM: 'go', STAR: 'go', BRAID: 'go' };
function tutAllows(act) {
  if (typeof tutorialAllows === 'function') return tutorialAllows(act);
  const need = TUT_UNLOCK[act];
  if (!need) return true;
  if (!G || !G.save || !G.tut) return true;
  if (G.save.flags && G.save.flags.tut) return true;
  if (TUT_ROOMS[G.roomId] === undefined) return true;
  const idx = TUT_STEPS.findIndex(q => q.id === need);
  return idx < 0 || G.tut.i >= idx;
}
// THE STEP, IN AND OUT OF THE SAVE — by NAME. The opening was rebuilt and its
// list reordered (2026-10-09), and an index saved by the old list would resume
// on whatever now sits at that number. The id is what is saved now
// (flags.tutId, with flags.tutI kept beside it); a save that only has the old
// index is mapped through the old list to the lesson that replaced it, then
// carried past every step the save's own facts show is already behind her —
// a player who woke Ratchet under the old opening is not asked to read his
// letter again.
const TUT_FROM_OLD = { atk: 'booth', kill: 'booth', coin: 'booth', buy: 'note', heal: 'heal', burst: 'atk', node: 'node', skill: 'go' };
const TUT_SETTLED = {
  claw: f => f.firstKill || f.gateOpened || f.ratchetRepaired,
  note: f => f.opNote || f.ratchetRepaired,
  drawer: (f, sv) => (sv.items && sv.items.ratchetCell) || f.ratchetRepaired,
  repair: f => f.ratchetRepaired && f.opTold,
  pod: f => f.opPod,
  pack: f => f.heal,
};
function tutRestore(sv) {
  const f = (sv && sv.flags) || {};
  if (f.tutId) {
    const k = TUT_STEPS.findIndex(q => q.id === f.tutId);
    if (k >= 0) return k;
  }
  const old = TUT_OLD_IDS[Math.max(0, Math.min(TUT_OLD_IDS.length - 1, f.tutI | 0))];
  let i = Math.max(0, TUT_STEPS.findIndex(q => q.id === (TUT_FROM_OLD[old] || old)));
  if ((f.tutI | 0) > 0) while (i < TUT_LAST && TUT_SETTLED[TUT_STEPS[i].id] && TUT_SETTLED[TUT_STEPS[i].id](f, sv)) i++;
  return Math.max(0, Math.min(TUT_LAST, i));
}
function tutSave(sv, T) {
  if (!sv || !T) return;
  if (!sv.flags) sv.flags = {};
  const was = sv.flags.tutId ? TUT_STEPS.findIndex(q => q.id === sv.flags.tutId) : -1;
  if (was >= T.i) return;                       // one way: never written backwards
  sv.flags.tutI = T.i;
  sv.flags.tutId = TUT_STEPS[T.i] ? TUT_STEPS[T.i].id : 'go';
  if (typeof persist === 'function') persist();
}
function updateTutor(dt) {
  const sv = G.save;
  if (!sv || !player || player.dead) return;
  if (sv.flags && sv.flags.tut) return;
  if (TUT_ROOMS[G.roomId] === undefined) {       // the whole waking is behind her
    if (sv.flags) sv.flags.tut = 1;
    G.tut = null; if (typeof TOUCH !== 'undefined' && TOUCH) { TOUCH.hi = null; TOUCH.hiDir = null; }
    return;
  }
  // THE LESSON IS ONE WAY, AND IT USED TO FORGET THAT ON EVERY RELOAD.
  //
  // G.tut lived only in memory. The save carried `flags.tut` for "the whole
  // walk is behind her" and nothing for "she is on step seven of twelve" — so
  // a page reload, a phone that dropped the tab, or a save picked up at the
  // booth started a fresh `{ i: 0 }` and taught MOVE again, then OUT, then
  // JUMP, in the shop she had already bought from. The owner: "When I start
  // at the shop, I'm starting the loop of teaching all over again... It's a
  // one time thing." The step index is in the save now (flags.tutI), written
  // on every advance, and a run resumes on the lesson it was on. There is no
  // way back down the list: the index only ever grows.
  if (!G.tut) G.tut = { i: tutRestore(sv), t: 0, hold: 0, doneT: 0 };
  const T = G.tut;
  const st = TUT_STEPS[T.i];
  // NOTHING ON THE WAKING FLOOR FIGHTS WHILE SHE IS BEING TAUGHT. The yard
  // winch is the strike and burst lessons' target, not an encounter: calm (it
  // holds its arm and never swings — winch.js) until the lessons are behind
  // her, so no lesson is ever interrupted by a hit she was not taught to read.
  // ...with ONE exception, and it is the point of it: the small machine on the
  // road to the gates (firstFoe) is her first fight, and a fight with something
  // that cannot touch her is a chore. It stays live — and stops being able to
  // HURT her only if she is down to two cores, because nobody dies in the
  // first minute.
  //
  // IT IS STILL THERE TO BE HIT (owner, 2026-11-15, on the phone: "attacking
  // the first enemy is not actually doing any damage. It's passing through the
  // enemy"). That mercy used to be `calm`, and calm is the CURED state: a calm
  // machine cannot be hurt and cannot be touched. So a player who had been
  // stung twice found her claw going through the thing it was pointed at, with
  // the lesson still asking her to strike it. It goes MEEK instead — it keeps
  // its body and its hit points and loses only its sting (Enemy.update).
  for (const e of (G.enemies || [])) {
    if (!e || e.dead || e.disabled || e.rescued) continue;
    if (e.firstFoe) {
      e.calm = false; e.hypnoT = 0; e.meek = player.cores <= 2;
      // and it keeps to its flat: never up the mound behind it, never off down the road
      if (e.homeX != null) {
        if (e.x < e.homeX - 14) { e.x = e.homeX - 14; if (e.vx < 0) e.vx = 0; }
        else if (e.x > e.homeX + 14) { e.x = e.homeX + 14; if (e.vx > 0) e.vx = 0; }
      }
      continue;
    }
    e.calm = true; e.hypnoT = Math.max(e.hypnoT || 0, 1);
  }
  if (typeof TOUCH !== 'undefined' && TOUCH) {
    const prompt = st && tutPrompt(st);
    TOUCH.hi = (prompt && prompt.vb && TOUCH.enabled) ? prompt.vb : null;
    TOUCH.hiDir = TOUCH.enabled && !(prompt && prompt.vb) ? tutDir(st, prompt) : null;
  }
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
    if (player.x > lim) {
      player.x = lim; if (player.vx > 0) player.vx = 0;
      // AND SHE IS TOLD SHE IS BEING HELD. The clamp used to be silent: walk
      // right, stop dead against nothing, no curtain, no sound, no reason —
      // the owner's report was "not clear why I can't go past the shop". A
      // held door has to answer when you push on it, so pushing lights the
      // curtain and re-points the objective. T.push decays in drawTutor.
      if (inD('RIGHT')) {
        if (!T.push) sfx('phit');
        T.push = 1;
      }
    }
  } else if (T.opened !== G.roomId) {
    T.opened = G.roomId;                       // per ROOM, not once per run
    sfx('cast'); cam.shake = Math.max(cam.shake, 3);
    for (let i = 0; i < 18; i++)
      addPart((G.roomDef.w - 1.6) * TILE, 11 * TILE + rnd(0, 3.4 * TILE),
        rnd(-40, 60), rnd(-70, 30), rnd(0.4, 0.8), '#37ffd0', 2.6, 120, true);
  }
  if (!st) return;
  // a step of Ratchet's story, in the world that does not have it
  if (st.robo && typeof isHero === 'function' && isHero()) {
    T.i++; T.t = 0; T.hold = 0; tutEnter(TUT_STEPS[T.i]); tutSave(sv, T); return;
  }
  T.t += dt;
  if (T.hold > 0) { T.hold -= dt; if (T.hold <= 0) { T.i++; T.t = 0; tutEnter(TUT_STEPS[T.i]); tutSave(sv, T); } return; }
  let ok = false;
  try { ok = st.done(); } catch (e) { ok = false; }
  // the lesson is only learned where it is taught (see `room` above)
  if (st.room && G.roomId !== st.room && !(st.passAnywhere && st.passAnywhere())) ok = false;
  if (ok && T.t > 0.25) {
    T.hold = 0.7;
    sfx('pick');
    burst(player.x + player.w / 2, player.y + 4, 12, '#37ffd0', 190, 0.5, 220, 3, true);
  }
}
function drawTutor() {
  const sv = G.save;
  if (!sv || !G.tut || (sv.flags && sv.flags.tut) || !player || G.state !== 'PLAY' || G.gateWalk || G.dialog || G.cut || G.wake || G.bossEntry || TUT_ROOMS[G.roomId] === undefined) return;
  const T = G.tut;
  const st = TUT_STEPS[T.i];
  if (!st) return;
  if (tutPrompt(st).suppressed) { G.tutChip = null; return; }
  const projectX = x => typeof worldScreenX === 'function' ? worldScreenX(x) : x-cam.x;
  const projectY = y => typeof worldScreenY === 'function' ? worldScreenY(y) : y-cam.y;
  const px = projectX(player.x+player.w/2), py = projectY(player.y-12);
  const learned = T.hold > 0;
  const pu = 0.5 + Math.sin(performance.now() / 260) * 0.5;
  // THE THING BEING TAUGHT, RINGED. A card that names a verb teaches nothing if
  // the player cannot see what it is about — so the step gets a ring while the
  // jump is being taught and the machine gets one while the claw is.
  const mark = (wx, wy, r, col, dir, key) => {
    const sx = projectX(wx), sy = projectY(wy);
    c.save();
    c.strokeStyle = col; c.lineWidth = 2.5; c.globalAlpha = 0.35 + pu * 0.5;
    c.setLineDash([6, 6]); c.lineDashOffset = -performance.now() / 70;
    if (typeof drawMechanicalTutorialArrow === 'function' && sx >= 26 && sx <= 934 && sy >= 90 && sy <= 580) {
      c.setLineDash([]); drawMechanicalTutorialArrow({x:wx,y:wy,radius:r,dir,key});
    } else if (typeof drawMechanicalTutorialArrow !== 'function') {
      c.beginPath(); c.arc(sx,sy,r+pu*3,0,7); c.stroke();
    }
    c.setLineDash([]);
    // A RING OFF THE EDGE OF THE SCREEN RINGS NOTHING. The node the 'think'
    // step points at sits thirteen tiles behind where she stands when the step
    // opens — the ring was drawn faithfully, four hundred pixels to the left
    // of the picture. The owner, twice: "you just show the prompt on top of
    // the cat, which is very confusing even for me". So when the target is out
    // of frame the ring's colour becomes a chevron pinned to the nearest edge,
    // pointing the way, with the distance under it. It is the one-way sign a
    // walk needs: there is only ever one thing rung, and it is always in view
    // or pointed at.
    // ...and EVERY target the arrow is not drawn over gets the chevron. The two
    // tests used to leave a band at each edge (26 px in from the frame to r
    // past it) where neither was drawn — which is exactly where a room's exit
    // sits, so the first room's way out had no marker at all.
    const M = 26;
    if (!(sx >= 26 && sx <= 934 && sy >= 90 && sy <= 580)) {
      const ex = Math.max(M, Math.min(960 - M, sx)), ey = Math.max(M + 40, Math.min(540 - M - 60, sy));
      const ang = Math.atan2(sy - ey, sx - ex);
      c.globalAlpha = 0.55 + pu * 0.45;
      c.translate(ex, ey); c.rotate(ang);
      c.fillStyle = col;
      c.beginPath(); c.moveTo(14 + pu * 4, 0); c.lineTo(-8, -11); c.lineTo(-3, 0); c.lineTo(-8, 11); c.closePath(); c.fill();
      c.rotate(-ang);
      const dist = Math.round(Math.hypot(sx - ex, sy - ey) / TILE);
      c.font = '700 11px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillStyle = col; c.fillText(dist + 'm', 0, 16);
    }
    c.restore(); c.globalAlpha = 1;
  };
  // One marker agrees with the one action card, including inside the booth.
  const pv0 = tutPrompt(st), dir0 = tutDir(st, pv0);
  const target = pv0.target;
  if (target) mark(target.x, target.y, target.radius, target.color, dir0, dir0 === 'up' ? tutHand(pv0) : null);
  // WALKING HAS A DIRECTION, so it is drawn at her feet: three chevrons running
  // ahead of her the way she should go, the moment a step asks her to walk.
  if ((dir0 === 'right' || dir0 === 'left') && !learned) {
    const sgn = dir0 === 'right' ? 1 : -1, cy = projectY(player.y + player.h * 0.55);
    const tt = performance.now() / 1000;
    c.save();
    c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 10;
    for (let k = 0; k < 3; k++) {
      const ph = (tt * 1.6 + k / 3) % 1;
      const cx = px + sgn * (34 + ph * 70);
      c.globalAlpha = Math.sin(ph * Math.PI) * 0.95;
      c.beginPath();
      c.moveTo(cx + sgn * 11, cy); c.lineTo(cx - sgn * 5, cy - 12); c.lineTo(cx - sgn * 1, cy);
      c.lineTo(cx - sgn * 5, cy + 12); c.closePath(); c.fill();
    }
    c.restore(); c.globalAlpha = 1;
  }
  // the push flare decays on the wall clock — this is a draw pass and has no dt
  {
    const now2 = performance.now();
    const el = T.pushT ? Math.min(0.2, (now2 - T.pushT) / 1000) : 0;
    T.pushT = now2;
    T.push = Math.max(0, (T.push || 0) - el * 1.6);
  }
  const openAt2 = TUT_STEPS.findIndex(q => q.id === (TUT_DOOR[G.roomId] || 'go'));
  // THE CURTAIN BELONGS TO THE HELD SIDE DOOR, and the question is whether the
  // room HAS one — not whether it happens to contain a depth door as well.
  //
  // The test was `!GATE_ROOM[G.roomId]`, written to keep the curtain out of W2,
  // whose only way out IS the depth gate. But A0 contains a depth door — the
  // trader's booth — AND a right-hand exit, and it is the right-hand exit the
  // tutorial clamps. So in the one room where the player spends the whole
  // opening, the fence was invisible: she walked right, stopped against
  // nothing, and the game never said why. A room whose way out is the gate
  // still skips it; a room with a side door that is being held now shows it.
  if (T.i < openAt2 && G.roomDef.exits && G.roomDef.exits.R) {
    // the held door: a light curtain, not a wall — it reads as "not yet",
    // and it flares when she pushes on it so the answer arrives when asked.
    const bx = projectX((G.roomDef.w - 2.0) * TILE);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const bg = c.createLinearGradient(bx - 10, 0, bx + 14, 0);
    bg.addColorStop(0, 'rgba(55,255,208,0)');
    bg.addColorStop(0.5, 'rgba(55,255,208,' + (0.16 + pu * 0.12 + (T.push || 0) * 0.34).toFixed(3) + ')');
    bg.addColorStop(1, 'rgba(55,255,208,0)');
    c.fillStyle = bg;
    c.fillRect(bx - 10, projectY(10.4 * TILE), 24, 4.6 * TILE);
    c.strokeStyle = 'rgba(55,255,208,' + (0.3 + pu * 0.3 + (T.push || 0) * 0.4).toFixed(3) + ')';
    c.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const yy = projectY((10.6+i*.9)*TILE) + Math.sin(performance.now() / 300 + i) * 3;
      c.beginPath(); c.moveTo(bx - 7, yy); c.lineTo(bx + 7, yy); c.stroke();
    }
    c.restore();
  }
  // the pod's "Progress saved" is read before the next lesson is introduced
  if (typeof opPodSettled === 'function' && !opPodSettled()) return;
  const prompt = tutPrompt(st);
  // the hint names controls as {ATK}/{INT}/{UP}…, filled with THIS player's own
  // binding (ctlFill) — the chip and the dialogue speak the same controls
  const fill = typeof ctlFill === 'function' ? ctlFill : (x => x);
  // THE BUTTON AND ITS NAME, NOT A SENTENCE (owner, 2026-11-19: "minimize all
  // the text that we see while keeping the scenario understandable"). The
  // sentence under the name said where to go — which the marker in the world
  // already says — and which button to press — which the key box already
  // shows. In the robot world the chip is the key and two or three words; a
  // HOLD is a ring that fills round the key, not the word "hold" in a line.
  const lite = !(typeof isHero === 'function' && isHero());
  // (only while the chip asks for the held button itself — not the door or the walk the step sends her through first)
  const holdStep = (st.id === 'heal' && prompt.action === 'HEAL') || (st.id === 'burst' && prompt.action === 'ATK');
  tutCard(px, py, tutHand(prompt), t(prompt.label), lite ? '' : fill(t(prompt.hint)), learned, Math.max(0, T.hold / 0.7), lite && holdStep);
}
// A PICTURE ABOVE THE WORDS. One per line at most, looked up by the line's
// index (d.shots, aligned with d.lines — js/overlay.js dlgClean keeps them
// aligned when an empty line is dropped). 'demo:<id>' plays a demonstration
// (js/riddles.js), 'assets/...' is a comic panel, anything else a media key.
// Not drawn until the picture is here: a frame with nothing in it is noise.
// A LINE THAT NAMES SOMETHING ON HER SCREEN POINTS AT IT: a bobbing arrow
// and a breathing outline round the HUD element (the charge ring), so "your
// ring" is never a guess at which of the things in the corner he means
function drawHudPointer(x, y) {
  const tt = performance.now() / 1000, bob = Math.sin(tt * 5) * 5, pu = 0.55 + Math.sin(tt * 4) * 0.45;
  c.save();
  c.strokeStyle = 'rgba(255,215,106,' + (0.5 + pu * 0.5).toFixed(3) + ')'; c.lineWidth = 3;
  c.beginPath(); c.arc(x, y, 25 + pu * 3, 0, Math.PI * 2); c.stroke();
  // the arrow, from below-right, pointing up-left at it
  const ax = x + 46 + bob, ay = y + 46 + bob;
  c.translate(ax, ay); c.rotate(-Math.PI * 0.75);
  c.fillStyle = '#ffd76a'; c.strokeStyle = 'rgba(20,14,4,0.85)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(18, 0); c.lineTo(2, -11); c.lineTo(2, -4); c.lineTo(-16, -4); c.lineTo(-16, 4); c.lineTo(2, 4); c.lineTo(2, 11); c.closePath();
  c.stroke(); c.fill();
  c.restore();
  G.hudPoint = { x, y };
}
const DLG_SHOT_W = 248, DLG_SHOT_H = 140;
// a drawn comic panel is shown bigger, in a comic panel's own frame
const DLG_COMIC_W = 384, DLG_COMIC_H = 216;
function drawDlgShot(d, x, boxY) {
  const sh = d && ((d.shots && d.shots[d.i]) || (d.lines && typeof lineShot === 'function' && lineShot(d.lines[d.i])));
  if (!sh) { G.dlgShot = null; return; }
  const comic = /^assets\/manhua\//.test(sh);
  const w = comic ? DLG_COMIC_W : DLG_SHOT_W, h = comic ? DLG_COMIC_H : DLG_SHOT_H, y = boxY - h - 10;
  if (x > 140) x = 820 - w;   // right-to-left: against the box's right edge
  let im = null, demo = null;
  if (/^demo:/.test(sh)) demo = sh.slice(5);
  else if (/^assets\//.test(sh)) { const r = typeof panelsImg === 'function' ? panelsImg(sh) : null; im = r && r.ok ? r.im : null; }
  else { if (typeof mediaFetch === 'function') mediaFetch(sh); const m = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[sh]; im = m && m.naturalWidth ? m : null; }
  if (!im && !(demo && typeof demoScript === 'function' && demoScript(demo))) { G.dlgShot = null; return; }
  c.save();
  if (comic) {
    // the page's gutter and ink line: the panel, edge to edge, cropped to fill
    c.fillStyle = '#f4efe4'; c.fillRect(x, y, w, h);
    const iw = w - 8, ih = h - 8, sc = Math.max(iw / im.naturalWidth, ih / im.naturalHeight);
    const sw = iw / sc, shh = ih / sc;
    c.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - shh) / 2, sw, shh, x + 4, y + 4, iw, ih);
    c.strokeStyle = '#111'; c.lineWidth = 2; c.strokeRect(x + 4, y + 4, iw, ih);
    c.restore();
    G.dlgShot = { key: sh, x, y, w, h, comic: true };
    return;
  }
  c.fillStyle = 'rgba(6,14,20,0.94)'; rr(c, x, y, w, h, 10); c.fill();
  c.strokeStyle = 'rgba(200,215,225,0.35)'; c.lineWidth = 1.5; rr(c, x, y, w, h, 10); c.stroke();
  if (demo) drawSkillDemo(c, x + 8, y + 6, w - 16, h - 12, demo, performance.now() / 1000);
  else {
    // contained, never stretched or cropped: the picture is the explanation
    const sc = Math.min((w - 16) / im.naturalWidth, (h - 12) / im.naturalHeight);
    const iw = im.naturalWidth * sc, ih = im.naturalHeight * sc;
    c.save(); rr(c, x + 4, y + 4, w - 8, h - 8, 8); c.clip();
    c.drawImage(im, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
    c.restore();
  }
  c.restore();
  G.dlgShot = { key: sh, x, y, w, h };
}
// one card, used by the waking floor and by every power she is handed after it
function tutCard(px, py, key, label, hint, learned, fade, hold) {
  const touch = typeof TOUCH !== 'undefined' && TOUCH.enabled;
  const keySize = touch ? 26 : 20, titleSize = touch ? 27 : 22, helpSize = touch ? 22 : 16;
  const oneLine = !hint;
  const height = oneLine ? (touch ? 72 : 58) : (touch ? 88 : 70);
  c.save();
  c.font = '700 ' + keySize + 'px "Segoe UI", Tahoma, sans-serif';
  const kw = Math.min(240, c.measureText(key).width + 28);
  c.font = '600 ' + titleSize + 'px "Segoe UI", Tahoma, sans-serif';
  const titleWidth = c.measureText(label).width;
  c.font = '700 ' + helpSize + 'px "Segoe UI", Tahoma, sans-serif';
  const lw = Math.max(titleWidth, c.measureText(hint).width);
  const w = Math.min(780, Math.max(260, kw + lw + 50));
  // (measured in the weight ftxt draws with — measured at 400 and drawn at
  // 700, a long hint ran out of its own card on a phone)
  const x = (960 - w) / 2, y = touch ? 100 : 436, rtl = LANG === 'ar';
  // where the chip stands this frame, so nothing else on the HUD (the goal
  // line, js/opening.js) is ever drawn over it
  G.tutChip = { x, y, w, h: height, at: G.simClock || 0 };
  c.globalAlpha = learned ? Math.max(0, fade) : 1;
  c.fillStyle = 'rgba(6,14,20,0.92)'; rr(c, x, y, w, height, 8); c.fill();
  const keyX = rtl ? x + w - kw - 14 : x + 14;
  c.fillStyle = '#e7edef'; rr(c, keyX, y + 16, kw, height - 32, 5); c.fill();
  ftxt(key, keyX + kw/2, y + height/2 + keySize*.32, keySize, '#17262d', 'center', null, '700');
  const textX = rtl ? keyX - 14 : keyX + kw + 14, align = rtl ? 'right' : 'left';
  const maxText = w - kw - 44;
  c.font = '600 ' + titleSize + 'px "Segoe UI", Tahoma, sans-serif';
  const labelSize = Math.min(titleSize, titleSize * maxText / Math.max(1,c.measureText(label).width));
  ftxt(learned ? '\u2713 ' + label : label, textX, oneLine ? y + height / 2 + labelSize * 0.34 : y + (touch ? 35 : 29), labelSize,
    learned ? '#bff5d2' : '#f3f5f6', align, null, '600');
  if (!oneLine) {
    c.font = '700 ' + helpSize + 'px "Segoe UI", Tahoma, sans-serif';
    const hintSize = Math.min(helpSize, helpSize * maxText / Math.max(1,c.measureText(hint).width));
    ftxt(hint, textX, y + (touch ? 65 : 53), hintSize, '#c8d5db', align);
  }
  // HOLD, SHOWN: a ring round the key that fills over a second and empties,
  // the way the press itself charges — a child reads it as "keep it down"
  if (hold && !learned) {
    const kx = keyX + kw / 2, ky = y + height / 2, R = Math.max(kw, height - 32) * 0.5 + 7;
    const ph = (performance.now() / 1100) % 1;
    c.lineWidth = 3.5; c.lineCap = 'round';
    c.strokeStyle = 'rgba(143,246,255,0.22)';
    c.beginPath(); c.ellipse(kx, ky, R, (height - 32) / 2 + 7, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#8ff6ff';
    c.beginPath(); c.ellipse(kx, ky, R, (height - 32) / 2 + 7, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, ph * 1.25)); c.stroke();
  }
  G.tutChipHold = !!(hold && !learned);
  c.restore();
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
  if (G.brDelta) return;             // it waits behind the world readout (drawLesson)
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
  // ONE CARD AT A TIME, AND THE REAL KEY (campaign run, 2026-10-10). After the
  // lion the Dash Jets chip sat on top of the world readout (js/braid.js, the
  // same bottom-centre spot), and tutHand(M) — M has no action — named the
  // key '→'. The readout plays first; the chip names the bound DASH control.
  if (G.brDelta) return;
  const hand = M.vb ? tutHand({ action: M.vb.slice(1) }) : '← →';
  tutCard(typeof worldScreenX==='function'?worldScreenX(player.x+player.w/2):player.x+player.w/2-cam.x, typeof worldScreenY==='function'?worldScreenY(player.y-12):player.y-cam.y, hand,
    t('m_' + L.id), t('les_' + L.id), L.hold > 0, L.hold / 1.1);
}
// ---------------------------------------------------------------------------
// THE HUD'S RESTING ICONS, BAKED.
//
// Every icon in the core row is the same drawing every frame and each one costs
// a shadowBlur — the most expensive per-draw operation Canvas2D has, because it
// is a real gaussian with no batching behind it. Baking them turns fifteen
// blurs a frame into five drawImage calls of a 48x48 sprite.
//
// Keyed on the kingdom's glow colour as well as the shape, because P.glow is
// what the blur is tinted with and it changes per zone — a cache that ignored
// it would carry the Meadows' teal into the Foundry.
const HUD_ICO = 24;                       // half-size: 20x17 of art + room for an 8px blur
const hudIcoCache = {};
function starIcon() {
  const hit = hudIcoCache.star;
  if (hit !== undefined) return hit;
  let cv = null;
  try {
    cv = document.createElement('canvas');
    cv.width = HUD_ICO * 2; cv.height = HUD_ICO * 2;
    const x = cv.getContext('2d');
    x.translate(HUD_ICO, HUD_ICO); x.rotate(0.5);
    x.fillStyle = ELEM.zizt.glow;
    x.shadowColor = ELEM.zizt.col; x.shadowBlur = 6;
    x.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * Math.PI * 2;
      x.lineTo(Math.cos(a) * 5.4, Math.sin(a) * 5.4);
      x.lineTo(Math.cos(a + 0.39) * 1.9, Math.sin(a + 0.39) * 1.9);
    }
    x.closePath(); x.fill();
  } catch (e) { cv = null; }
  hudIcoCache.star = cv;
  return cv;
}
function heartIcon(heroHud, full, glowCol) {
  const key = (heroHud ? 'h' : 'r') + (full ? '1' : '0') + (glowCol || '');
  const hit = hudIcoCache[key];
  if (hit !== undefined) return hit;
  let cv = null;
  try {
    cv = document.createElement('canvas');
    cv.width = HUD_ICO * 2; cv.height = HUD_ICO * 2;
    const x = cv.getContext('2d');
    x.translate(HUD_ICO, HUD_ICO);
    if (heroHud) {
      x.fillStyle = full ? '#d9b56a' : 'rgba(110,98,70,0.4)';
      if (full) { x.shadowColor = glowCol; x.shadowBlur = 8; }
      x.beginPath(); x.arc(0, -2, 11, 0, Math.PI * 2); x.fill();
      x.shadowBlur = 0;
      if (full) {
        x.strokeStyle = '#8a6f38'; x.lineWidth = 2;
        x.beginPath(); x.arc(0, -2, 11, 0, Math.PI * 2); x.stroke();
        x.fillStyle = '#e0484f'; x.beginPath(); x.arc(0, -2, 4, 0, Math.PI * 2); x.fill();
      }
    } else {
      x.fillStyle = full ? '#eef3fa' : 'rgba(90,105,125,0.45)';
      if (full) { x.shadowColor = glowCol; x.shadowBlur = 8; }
      rr(x, -10, -8, 20, 17, 6); x.fill();
      x.beginPath(); x.moveTo(-9, -6); x.lineTo(-6, -15); x.lineTo(-1, -7); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(1, -7); x.lineTo(6, -15); x.lineTo(9, -6); x.closePath(); x.fill();
      x.shadowBlur = 0;
      if (full) { x.fillStyle = '#0a1420'; x.fillRect(-6, -2, 4, 4); x.fillRect(2, -2, 4, 4); }
    }
  } catch (e) { cv = null; }              // no canvas here: fall back to drawing live
  hudIcoCache[key] = cv;
  return cv;
}
function drawHUD() {
  if (typeof drawWolfMountHud === 'function') drawWolfMountHud();   // the ridden wolf's stamina (js/wolfmount.js)
  const P = PAL[G.roomDef.zone];
  const teaching = !!(G.tut && !G.save.flags.tut);
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
    // THE RESTING HEART IS A CACHED PICTURE. Measured in the den: drawHUD was
    // issuing FIFTEEN blurred fills a frame — three per heart, five hearts —
    // and every one of them drew the identical icon. Canvas2D shadowBlur is a
    // per-draw blur with no batching, so that is fifteen gaussian passes per
    // frame, forever, in every room, to redraw a picture that never changes.
    // It was 27% of every draw call the den made.
    //
    // Baked once per (kind, full, kingdom glow) and blitted since. The FLASHING
    // heart still draws live — it scales and changes colour, one heart at a
    // time, and a cache keyed on a continuous value is not a cache.
    if (fl <= 0) {
      const ico = heartIcon(heroHud, full, P.glow);
      if (ico) { c.drawImage(ico, x - HUD_ICO, y - HUD_ICO); continue; }
    }
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
  if (!teaching || healUnlocked() || player.volts > 0) {
  const vx = 38, vy = 66;
  const canHeal = healUnlocked() && player.volts >= player.healCost() && player.cores < player.maxCores();
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
    // her own HEAL control, not a literal F (a remapped key or a pad)
    const hk = typeof ctlName === 'function' ? ctlName('HEAL') : 'F';
    ftxt(TOUCH && TOUCH.enabled ? '✚' : (hk === '✚' ? '✚' : '✚ ' + hk), vx + 28, vy, 15, 'rgba(174,247,216,' + hpu + ')', 'left');
    // (the opening's own heal lesson is already saying this, on its chip)
    if (!G.healToasted && !teaching) { G.healToasted = true; G.toast(typeof ctlFill === 'function' ? ctlFill(t('heal_hint')) : t('heal_hint')); }
  }
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
  // ...and THE REST OF THE BUILD on the same line (js/loadout.js): a cobalt
  // diamond per worn crest, one green seal with the relic count. Arms, crests,
  // relics: three frames, three hues, read without opening a menu.
  if (typeof drawLoadoutHud === 'function') drawLoadoutHud(c);
  // ONE PANEL, ONE CLUSTER. The song glyph, the shuriken pips and their key
  // hints floated loose over the art with nothing behind them, and on a tall
  // phone the pip row lands mid-screen — six glowing diamonds hovering in the
  // world, which reads as collectibles, not as a counter. A single dim plate
  // ties the corner together: UI lives on glass, the world does not. Drawn
  // first so everything in the cluster sits on it.
  if (!teaching) {
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
    // A RESTING PIP IS A FIXED PICTURE TOO — same rotation, same colour, same
    // blur — and there are up to six of them. Baked like the cores; only the
    // one that is CHARGING spins and fades, and only one ever charges at once.
    if (on && !charging) {
      const ico = starIcon();
      if (ico) { c.drawImage(ico, bx - HUD_ICO, 164 - HUD_ICO); continue; }
    }
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
  }

  // scrap + knowledge
  // A NUT, NOT A GEAR. ⚙ reads as SETTINGS to every player alive, and this
  // counter is money — the gear stays where it means the Tinker's trade (his
  // shop sign and the map legend), never the wallet. ⬢ and not the 🔩 emoji:
  // measured in a canvas, the bolt renders as a COLOUR emoji that ignores
  // fillStyle, so the money counter came out sky blue in an all-amber HUD.
  if (!teaching || G.save.flags.sawScrap || G.save.scrap > 0)
    ftxt('⬢ ' + G.save.scrap, 76, 66, 17, '#ffd76a', 'left', null, '700');
  if (!teaching || G.save.iq > 0)
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
  if (bossActive() && G.boss.st !== 'intro' && !G.boss.hideBar) {
    const b = G.boss, w = 480;
    c.fillStyle = 'rgba(8,12,18,0.7)'; rr(c, 480 - w / 2, 494, w, 26, 6); c.fill();
    c.fillStyle = P.glow; c.globalAlpha = 0.9;
    c.fillRect(480 - w / 2 + 4, 498, (w - 8) * clamp(b.hp / b.hpMax, 0, 1), 8);
    c.globalAlpha = 1;
    ftxt(bossBarName(b), 480, 481, 14, '#eef3fa', 'center', P.glow);
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
  // ...AND NOT OVER A CONVERSATION. A notice drawn in the band above an open
  // dialogue is a second thing to read while the first is being read — the
  // overlap the owner ruled out (js/overlay.js). Its clock only runs in PLAY,
  // so it is not lost: it waits and is shown, whole, when the talk closes.
  const toastHidden = { SKILLS: 1, CREST: 1, RELICS: 1, MAP: 1, BRAID: 1, PAUSE: 1,
                        CTRL: 1, SHOP: 1, TRIAL: 1, TCFG: 1, CINE: 1, DIALOG: 1 };
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
  if (typeof drawGhCard === 'function') drawGhCard(c);    // GRAVEHORN's name, as he bellows
  if (G.zoneToast && G.state === 'PLAY' && !(G.tut && !G.save.flags.tut)) {
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
  // Riding (js/wolfmount.js), the light goes up with her to the wolf's back and the lunge
  // does not flare it: a wolf's lunge is weight, not light.
  if (player && !player.dead) {
    const rid = typeof wmRiding === 'function' && wmRiding();
    lightAt(player.x + 12, (rid ? wmSeatY(player) : player.y) + 12, 56, P.glow, 0.15 + (player.dashT > 0 && !rid ? 0.14 : 0) + (player.healT > 0 ? 0.12 : 0));
  }
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
      // an agent: blue once purified, and nothing at all while infected (the
      // dark halo with the ember ring it wore is withdrawn — owner, 2026-11-17).
      // Counted here either way so the sense reads complete.
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
    else if (s.type === 'chest' && !s.opened) {
      // his toolbox lights the floor with the battery's cyan, and further than a chest's latch does
      if (typeof denToolbox === 'function' && denToolbox(s)) lightAt(s.x + s.w / 2, s.y + 12, 100, '#8ff6ff', 0.42);
      else lightAt(s.x + s.w / 2, s.y + 10, 55, '#ffd76a', 0.28);
    }
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
  // the world's own view: at a zoom below 1 the world is drawn small about the frame's centre
  // (js/presentation.js WORLD_VIEW); the backdrop stays the picture's, on the canvas itself
  worldViewBegin(c);
  const WV = WORLD_VIEW;
  worldOnScreen(c, () => drawBG(P, cam.x, cam.y));
  // The roof, before the tiles: it is the far wall of the room's top, and
  // anything solid the level actually built up there should occlude it.
  // AN INTERIOR HAS ITS OWN ROOF, IN ITS OWN PAINTING. The kingdom's ceiling
  // plate is scrapyard gantry hung on parallax, and it was drawing over the
  // trader's den too — a machine-yard roof stretched across a workshop that
  // already has rafters painted into it. That is half of "the background does
  // not blend with the items in it": two different ceilings in one room.
  // ...AND THE OPEN AIR HAS NO ROOF AT ALL. A sky room (js/world.js skyLid)
  // hangs no kingdom plate: the vista's own sky is what is up there, the same
  // way a seam's boundary is no wall at all. Indoors keeps its rafters, caves
  // keep their rock, and the hero's world never had the plate to begin with.
  if (!(typeof isHero === 'function' && isHero()) && !(G.roomDef && G.roomDef.indoor)
      && !(G.roomDef && G.roomDef.sky))
    drawCeiling(G.roomDef.zone);
  // ART_BIBLE §9.1/§9.4 — THE BACKGROUND PASS. Everything drawn so far is the
  // far plane, and this is the only moment it can be graded alone: after it,
  // the terrain and the cast land on top and a full-frame wash can no longer
  // tell them apart. Measured before this existed, every room read 16/16/11
  // across far/mid/near — five points of range in the whole picture — and the
  // background came back MORE saturated than the plane the player stands on.
  // Pushing the background down and the chroma out of it is what buys the
  // depth the single end-of-frame wash never could.
  worldOnScreen(c, bgPlanePass);
  drawVLinkBG();                    // beyond a seamless seam, the neighbour's own backdrop
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
  infEyeWorldBegin(c);              // world -> pixels, so eyes report WORLD positions
  drawLair();                       // behind the level — see the LAIR table
  drawRoomProp();                   // the cradle, the gates — see ROOM_PROP
  drawFlora();                      // ...and what grows in it — see FLORA
  if (typeof nfCoverDrawBack === 'function') nfCoverDrawBack(c);   // NULLFANG's meadow beyond (js/nfcover.js)
  if (typeof drawInsects === 'function') drawInsects(c);   // ...and what flies in it (js/insects.js)
  // (a zone's platform objects that landed AFTER this room's tile layer was
  // rendered: the layer is a cache, and the cache was painted with the old deck)
  { const PO = platObjSet();
    if (PO && !platObjReady(PO)) { if (typeof mediaFetch === 'function') mediaFetch(PO.key, 1); }
    else if (PO && platCvKey.indexOf(G.roomId + '|') === 0 && platCvKey.slice(-4) !== '|obj') tileDirty = true; }
  if (tileDirty) renderTileLayer(P);
  // §9.1 — the playable plane is the TILE LAYER, not the bottom third of the
  // screen. Measuring a screen band called the floor "near" while it was
  // mostly backdrop, and reported a negative delta for a frame that had just
  // been correctly separated. The terrain is a canvas of its own; measure it.
  if (G.planeProbe && !G.planeProbe.mid) G.planeProbe.mid = layerStats(tileCv);
  c.save();
  if(G.roomDef.cave){c.shadowColor='rgba(4,5,10,0.8)';c.shadowBlur=9;c.shadowOffsetY=4;}
  c.drawImage(tileCv, 0, 0);
  drawVLinkArt();                   // the room above / below, where it really is
  c.restore();
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
  // ONE MORE FLAT VEIL OVER THE WHOLE VIEW, and it is the fifth. Counted while
  // chasing "background is toooooo dark and faded": the far-plane grade, the
  // painting's seating gradient, the painting's flat veil, this, and the
  // screen-lift dial's grey — five full-frame operations on one picture, none
  // of which knows about the others. This one is a hair of atmosphere; at 0.16
  // it was taking a sixth of the light out of every frame in the game.
  c.fillStyle = 'rgba(3,6,14,' + WORLD_VEIL + ')';
  c.fillRect(cam.x + WV.x - 12, cam.y + WV.y - 12, WV.w + 24, WV.h + 24);
  // THE BRAID writes itself onto the air of the room. A kingdom still deep in
  // the rot runs violet; one she has bought back runs clean. STARLESS worlds
  // lose the ceiling lights entirely.
  if (typeof universe === 'function') {
    const U = universe(), zi = U.inf[G.roomDef.zone] != null ? U.inf[G.roomDef.zone] : 1;
    if (zi > 0.4) {
      c.fillStyle = 'rgba(120,20,90,' + ((zi - 0.4) * 0.13).toFixed(3) + ')';
      c.fillRect(cam.x + WV.x - 12, cam.y + WV.y - 12, WV.w + 24, WV.h + 24);
    } else if (zi < 0.25) {
      c.fillStyle = 'rgba(60,220,190,' + ((0.25 - zi) * 0.1).toFixed(3) + ')';
      c.fillRect(cam.x + WV.x - 12, cam.y + WV.y - 12, WV.w + 24, WV.h + 24);
    }
    if (U.darkK) { c.fillStyle = 'rgba(2,4,10,0.4)'; c.fillRect(cam.x + WV.x - 12, cam.y + WV.y - 12, WV.w + 24, WV.h + 24); }
  }
  // THE INTERACTABLE STRUCTURES, in the CAST'S plane and not the painting's.
  // The booth, the shrine, the forge hood, the carrel, the hollow and every
  // cave mouth stand here — immediately before the standing NPCs, so a stall
  // and the person who runs it take exactly the same light and the same
  // chroma. They were in drawBG, where bgPlanePass pulls 94% of the colour out
  // to push the far plane back, and the owner read the result correctly: "the
  // colors are still in dull faded three d instead of drawings like the
  // characters... the player might actually miss it." See gateDoorNear.
  if (typeof drawGateDoors === 'function') drawGateDoors(P, 1);
  drawStatics(P);
  drawSpikeMenace();
  drawBreakHint();
  for (const p of G.pickups) p.draw(c);
  if (G.pools) for (const q of G.pools) {
    const a = Math.min(1, q.t / 0.8) * 0.55;
    c.save();
    c.globalAlpha = a;
    // MELT COOLS; ACID DOES NOT. The Foundry's spill is the same pool object
    // with `hot` set, and it is drawn as the thing it is: white at the middle
    // where it is newest, darkening to danger red at the rim, and losing its
    // light across its life so a player can see the floor giving her the tile
    // back. `t/t0` is the whole animation — no second timer, no second list.
    const heat = q.hot ? Math.max(0, q.t / (q.t0 || 1)) : 0;
    const g3 = c.createLinearGradient(0, q.y - 8, 0, q.y + 3);
    if (q.hot) {
      g3.addColorStop(0, 'rgba(255,242,221,' + (0.25 + 0.4 * heat).toFixed(2) + ')');
      g3.addColorStop(1, 'rgba(255,95,109,' + (0.1 + 0.25 * heat).toFixed(2) + ')');
    } else {
      g3.addColorStop(0, 'rgba(180,255,120,0.5)'); g3.addColorStop(1, 'rgba(90,190,60,0.15)');
    }
    c.fillStyle = g3;
    c.beginPath(); c.ellipse(q.x, q.y, q.r, 5.5, 0, 0, 7); c.fill();
    c.strokeStyle = q.hot
      ? 'rgba(255,148,48,' + ((0.3 + 0.5 * heat) * a).toFixed(2) + ')'
      : 'rgba(200,255,150,' + (0.5 * a).toFixed(2) + ')';
    c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(q.x, q.y, q.r, 5.5, 0, 0, 7); c.stroke();
    // it bubbles, so it reads as active rather than as a decal
    if (chance(0.25 * a)) addPart(q.x + rnd(-q.r, q.r), q.y - 2, rnd(-10, 10), rnd(-40, -12), 0.4,
      q.hot ? (chance(0.5) ? '#ffd08a' : '#ff9430') : '#c8ff96', 1.8, 60, true);
    c.restore(); c.globalAlpha = 1;
  }
  // THE PILE IS AN OBJECT, NOT SCENERY. It was briefly drawn with the cave
  // mouth in the backdrop pass, where the room's own haze washed it down to a
  // ghost — correctly, because that pass is for painted distance. She stands
  // beside this and hits it, so it belongs in the world layer with everything
  // else that has a hitbox, in front of the terrain and behind her.
  if (typeof drawProgressGround === 'function') drawProgressGround(c);   // the quarry marks, the hub's dust
  if (typeof drawGlimpse === 'function') drawGlimpse(c);                 // ...and the shape in the road (js/glimpse.js)
  if (G.rubbles && typeof drawRubble === 'function')
    for (const rb of G.rubbles) drawRubble(rb, rb.x, rubbleFoot(rb) + 4, PAL[G.roomDef.zone]);
  if (G.plats) for (const pl of G.plats) pl.draw(c);
  if (G.saws) for (const sw of G.saws) sw.draw(c);
  // every hostile body and the guardian through foeDraw: the pale rim that
  // keeps each one off its room (js/foeread.js, tests/contrast.cjs)
  for (const e of G.enemies) foeDraw(c, e);
  for (const w of G.wrecks) w.draw(c);
  // (freed in his arena, the lion is drawn in front of the clumps instead — nfCoverDrawFront)
  if (G.boss && !(typeof nfPetFront === 'function' && nfPetFront(G.boss))) foeDraw(c, G.boss);
  if (typeof drawParryTells === 'function') drawParryTells(c);           // the parry glint (js/parry.js)
  if (typeof drawPetFx === 'function') { drawPetFx(c); drawPetBond(c); }
  // (her called wolf or Alpha is drawn with HER, after the grade — below, before her body: under the
  //  zone wash the pack's graphite wolf sank into the dark ground and the turret it bit was drawn over
  //  it; owner's reviewer, 2026-11-26: "I see only her clawing; no wolf on screen")
  if (typeof drawWolfMountPrompt === 'function') drawWolfMountPrompt(c);   // ▲ Ride, beside her called wolf
  for (const p of G.projs) p.draw(c);
  if (typeof drawCrescents === 'function') drawCrescents(c);      // the single blade's charged cut (js/entities.js)
  if (G.boomer && typeof drawBoomer === 'function') drawBoomer(c);
  if (typeof drawGatePrompt === 'function') drawGatePrompt();
  if (typeof drawProgress === 'function') drawProgress(c);              // wards and the cleansing light
  if (typeof drawRoarFX === 'function') drawRoarFX(c);
  if (typeof drawBossVfx === 'function') drawBossVfx(c);           // the bosses' attacks in generated light (js/bossvfx.js)
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
  if (!G.artProbe) infEyeDraw(c);    // the infection's eyes and the smoke they leave
  drawParts(c);
  // every hostile body, as authored, before the room lights it (js/foeread.js FOE_PIG)
  if (typeof foePigSnap === 'function') foePigSnap(c);
  drawLights(P);
  // the shader layer draws the rings, the roar waves and every fx() record
  // here; with no GPU the Canvas rings draw as they always did (js/fxgl.js)
  if (!G.artProbe) { if (typeof fxglOn === 'function' && fxglOn()) fxglDraw(c); else if (G.rings.length) drawRings(c); }
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
  // NOT INDOORS. fore_a.webp is two pictures in one file: a black CITY SKYLINE
  // across its upper half and the rubble-and-pipes foreground across its lower.
  // Drawn at 1.16 parallax it lands in front of everything — and in the trader's
  // den that put a row of tower silhouettes across the inside of a workshop.
  // The owner drew a line round them and asked what the point of them was. There
  // is none: they are an outdoor skyline, indoors.
  //
  // This is the same ruling the ceiling already follows twenty lines up — the
  // kingdom's gantry roof is skipped in a room that has its own rafters painted
  // in, because "the background does not blend with the items in it". That note
  // calls itself HALF of the problem. This is the other half: a room that is a
  // painting of an enclosed space has no far city and no near rubble, and both
  // of its planes belong to the world outside it.
  if (!(G.roomDef && G.roomDef.indoor)) drawDepthPlane('fore');
  // THE BLOOM RUNS ONCE, AND IT RUNS HERE — on the world, before the grade and
  // before the accessibility lift.
  //
  // It used to run twice: this call, and a second one at the end of lightPass,
  // which is invoked AFTER drawScreenLift. That second pass is why a lamp-lit
  // room could turn into a wash you cannot see through. applyBloom isolates
  // emitters by SQUARING the frame — a highlight at 0.9 survives as 0.81, a
  // mid at 0.3 collapses to 0.09 — and that only works while the frame still
  // has real darks in it. drawScreenLift is affine and deliberately destroys
  // them: out = 46 + 0.82*raw at the default setting. Squaring a frame with no
  // black left rejects nothing, so the second pass was adding a blurred copy of
  // the whole room back over itself, warmest where the room was warmest.
  //
  // It also explains the timing the owner reported — the glare "goes away for a
  // second when the shopkeeper gets freed, then comes back". npcCharge sets
  // G.flash; the white flash raises the frame's mean; liftProbe reads that mean
  // twice a second and drops LIFT_K, which weakens the lift and with it the
  // second bloom; the flash decays, the room is dark again, LIFT_K climbs and
  // the glare returns. A screen-space measurement was feeding a pass that
  // changed what it measured.
  //
  // richK is the quality dial the second call was carrying, so it moves here
  // rather than being lost with it.
  worldOnScreen(c, () => applyBloom(typeof richK === 'number' ? richK : 1));
  // ---- cinematic grade: zone-tinted light wash + vignette (the "expensive" look) ----
  worldOnScreen(c, () => {
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
  });
  // ...and the machines get back the bodies the light pass was given: a lit,
  // bloomed, washed lion reads as a see-through one (js/foeread.js FOE_PIG)
  // the palms she stands on, solid, under the bodies laid back next (js/game.js platPalmFront)
  if (typeof platPalmFront === 'function') { c.save(); c.translate(-Math.round(camSX()), -Math.round(camSY())); platPalmFront(c); c.restore(); }
  if (typeof foePigLay === 'function') foePigLay(c);
  // the character herself, post-grade: full pigment, no bloom wash. Her own
  // emissive accents (visor, jets, claws) still glow via their shadowBlur.
  // ...and NOT while she is walking into the gates. drawGateWalk draws her
  // from behind, in screen space, shrinking toward the gap; leaving the live
  // body on as well put two of her on screen at once — the one going in, and
  // the one standing where she left.
  // ...and she is drawn as herself through the align beat: the walk to the
  // doorway is the ordinary body walking, and only the recede down the doorway
  // is the special shot (see updateGateWalk)
  // NULLFANG'S COVER (js/nfcover.js): the clumps he goes into stand between the bodies and
  // her, at full strength like her — objects in the fight, not painted distance
  if (typeof nfCoverDrawFront === 'function') {
    c.save(); c.translate(-Math.round(camSX()), -Math.round(camSY())); nfCoverDrawFront(c); c.restore();
  }
  // HER CALLED WOLF / ALPHA: in her own layer, in front of what it bites, never under the grade
  if (G.packWolf && typeof drawPackWolf === 'function') {
    c.save(); c.translate(-Math.round(camSX()), -Math.round(camSY())); drawPackWolf(c); c.restore();
  }
  if (player && !G.recharge && !(G.gateWalk && G.gateWalk.align >= 1)) {
    c.save();
    // THE I-FRAME FLICKER DIMS HER, IT DOES NOT DELETE HER.
    //
    // The owner: "the character pretty much disappears when it hits. It shows
    // partial of transparent image." He was photographing a `return` — inside
    // Player.draw, on alternate frames at 18 Hz, for the whole invulnerability
    // window, she was not drawn AT ALL. Half of every hit's aftermath had no
    // character on screen, and a still caught in that half shows the room where
    // she should be.
    //
    // A flicker is meant to say "you cannot be hurt right now", and it says
    // that perfectly well at reduced opacity. Deleting the body is worse than
    // saying nothing: the moments just after a hit are exactly the ones where
    // the player is deciding where to go, and nobody decides that about a
    // character they cannot see. 0.4 still reads unmistakably as blinking.
    //
    // It lives HERE rather than in draw() because this save/restore pair is
    // balanced by construction — draw() is hundreds of lines with its own
    // nested transforms, and an alpha set inside it has no single safe place
    // to be put back.
    if (player.iT > 0 && Math.floor(player.iT * 18) % 2 === 0) c.globalAlpha = 0.4;
    c.translate(-Math.round(camSX()), -Math.round(camSY()));
    // (in MIREJAW's jaws she is drawn by him, under his teeth: js/mirejaw.js mjHoldsHer)
    if(!(typeof drawRatchetReleaseHero==='function'&&drawRatchetReleaseHero(c))&&!(typeof mjHoldsHer==='function'&&mjHoldsHer()))player.draw(c);
    if (typeof drawPurificationWorld === 'function') drawPurificationWorld(c);
    c.globalAlpha = 1;
    if (typeof drawHeroHitFlash === 'function') drawHeroHitFlash(c, player);   // struck: her body lights (js/combat-stats.js)
    if (typeof drawSlashLayer === 'function') drawSlashLayer(c, player);   // her cuts, on their own layer, with their glow
    if (typeof drawGlideJets === 'function') drawGlideJets(c, player);     // the hover jets (js/glide.js)
    if (typeof drawDizzy === 'function') drawDizzy(c, player);   // stars round her head
    if (typeof drawParryFx === 'function') drawParryFx(c, player);  // the clash and the counter's cross-cut
    if (typeof drawHitShapes === 'function') drawHitShapes(c);      // the Forge's SHAPES overlay (js/hitshape.js)
    c.restore();
  }
  // THE WATER goes over everything standing in it (js/conduits-road.js): a
  // body below the line is under the surface, which is what makes it water
  if (typeof k2DrawFront === 'function') {
    c.save(); c.translate(-Math.round(camSX()), -Math.round(camSY())); k2DrawFront(c); if (typeof swDrawFront === 'function') swDrawFront(c); c.restore();
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
  worldOnScreen(c, drawScreenLift);
  // THE DARK, and it goes AFTER the lift on purpose.
  //
  // drawScreenLift is an accessibility floor: a 'screen' with grey 46 at the
  // default setting, which is affine — out = 46 + 0.82*raw. Run before it, the
  // cave dark was measurably doing its job and visually doing almost nothing:
  // a patch of rock went from raw 32 to raw 13.9, a 57% cut, and the player
  // saw 72 -> 57. Every contrast in a dark room is compressed into the top
  // fifth of the range by a constant added to it.
  //
  // Compensating by shouting — a brighter additive pass — was worse: additive
  // light over dark rock with nothing to catch it is fog, and the second
  // attempt turned three lamps into three milky blobs with no rock in them.
  //
  // So the lift goes FIRST and the dark shapes what it leaves. The slider
  // still does its job: raising it raises the lit rock (72 -> 90) and lifts
  // the unlit floor with it (0.26 of a bigger number), which is exactly what a
  // brightness control should do in a cave — brighten what she can see, not
  // erase the difference between seen and unseen.
  drawCaveDark();
  // THE IMPACT, AS A GAME DOES IT (owner, 2026-11-25, of the old one: "As a gamer, do you think
  // this is a proper effect? It looks more like a comic effect than an actual game effect. These
  // straight lines looks like coming from a comic"). It was a manga impact frame — the screen
  // washed white and black action lines burst from the hit — which blanked the fight at the one
  // moment she needed to see it. A hit is now carried by what games use: the hit-stop, the shake
  // and the sparks its caller already fires, and here only a brief darkening that closes in from
  // the edges of the screen toward the blow (red when it is HER that is hurt). The middle of the
  // screen, where the fight is, is never covered. And no lines across the screen while she dashes:
  // her dash leaves its ghost (js/entities.js), which is the game's own way of showing speed.
  if (G.impact && G.impact.t > 0) {
    const k = G.impact.t / G.impact.t0;
    const sx = G.impact.x - cam.x, sy = G.impact.y - cam.y;
    const gr = c.createRadialGradient(sx, sy, 130, sx, sy, 560);
    const col = G.impact.hurt ? '96,0,12' : '0,0,0';
    gr.addColorStop(0, 'rgba(' + col + ',0)');
    gr.addColorStop(0.45, 'rgba(' + col + ',' + (0.3 * k).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(' + col + ',' + (0.78 * k).toFixed(3) + ')');
    c.fillStyle = gr; c.fillRect(WV.x, WV.y, WV.w, WV.h);
  }
  worldOnScreen(c, () => {
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
  });
  if ((G.darkT || 0) > 0 && G.state === 'PLAY') {
    // TOTAL NULL: the arena lights die. You see yourself, her golden core,
    // and — while the Song rings — her whole shape.
    const dk = Math.min(1, G.darkT * 3);
    c.save();
    c.fillStyle = 'rgba(4,4,10,' + (0.92 * dk * ((G.revealT || 0) > 0 ? 0.45 : 1)) + ')';
    c.beginPath(); c.rect(WV.x, WV.y, WV.w, WV.h);
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
  // ...and neither does its weather. The Meadows drip condensation off their
  // roof; indoors that put cold blue droplets through a lamplit workshop, five
  // blurred draws a frame of an effect that belongs to a place she is not in.
  if (!(typeof isHero === 'function' && isHero()) && !(G.roomDef && G.roomDef.indoor))
    drawCeilWeather(G.roomDef.zone);
  // THE BADGE BELONGS IN THE GAME TOO. It was only ever drawn over the opening
  // film, so a player whose audio never unlocked — anyone on a controller —
  // reached the game and found it silent, with nothing on screen explaining
  // why or what to do. It draws itself only while sound is actually locked.

  worldOnScreen(c, () => {
    lightPass(P);
    if (G.flash > 0) {
      c.fillStyle = 'rgba(255,255,255,' + (G.flash * 0.32) + ')';
      c.fillRect(0, 0, 960, 540);
    }
    scanOverlay();
  });
  drawHazardRescue();               // the way back from a hazard is a cut, shown (hazardRescue)
  drawVLinkFade();                  // just crossed a seamless seam: the room she left, easing out (finished frame over finished frame)
  worldViewEnd(c);
  if (typeof presentWorld === 'function') presentWorld();
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
  // the surface she WALKS on, which is the curve wherever it rides above the
  // tile top (groundColumnAt) — not the tile tops themselves. The curve's roll
  // is biased upward, so the raw tops sit up to a body-ankle below her soles
  // (measured: soles at 468 over raw tops of 480 in A1), and a plate measured
  // from them crossed her by 12 px where it was meant to cross her by 24.
  if (cur && cur.raw) {
    const ys = [];
    for (let i = 0; i < cur.N; i++) {
      const t = cur.raw[i], y = cur.y ? cur.y[i] : NaN;
      if (isNaN(t)) continue;
      ys.push(isNaN(y) ? t : Math.min(y, t));
    }
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
  if (near) { drawNearPlate(im, floorY); return; }
  // The mid plate is a BAND whose lower part meets the floor and whose upper
  // part is the wreck standing behind it, so most of it belongs ABOVE the walk
  // line. Anchoring it below put the whole plate under the tile layer and left
  // only a sliver of glow showing. (The near plate is drawn by drawNearPlate,
  // which never lets it reach below the walk line.)
  const y = floorY - h * 1.02;   // mid: fully above her line
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
  c.globalAlpha = 0.95;
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

// THE NEAR PLATE IS NOT A FLOOR (owner, 2026-10-11, on the phone: "When I see
// it from underneath, it shows normal. When I go on it, it shows the second
// floor layer, which is black, which does not make sense because it can't just
// appear because I jumped on the top").
//
// He jumped from A2 up through the ceiling hole into A8. From below, A8's floor
// is drawn by drawVLinkArt — A8's own baked tile layer, grass and stone. Arrive
// on it and the same floor turned into a black city skyline. That was this
// plate: fore_a.webp is two pictures in one file (a solid skyline above, rubble
// and pipes below — see the NOT INDOORS note at the call site), and it was laid
// whole with its top 22% above the walk line, which put the skyline's SOLID
// BODY exactly over the floor rows: soles down to +59 px, near-black, in every
// outdoor room of the kingdom. Seen from the room below, the plate belongs to
// nobody (it hangs off THIS room's floor in THIS room's frame), so the floor
// looked like two different surfaces depending on which side of the seam she
// stood. It is the mid plate's "second floor" again, at the near plane.
//
// The plate keeps its one job — something in front of her ankles, so she is
// in the world rather than pasted on it (tests/gait.cjs) — and loses the other
// two it never should have had:
//   * ONLY THE FOREGROUND PICTURE. The lowest picture in the file, found by
//     measuring its alpha (a run of empty rows separates them), never the
//     skyline: a skyline is a far object and has no business at 1.16 parallax.
//   * NOTHING BELOW THE WALK LINE. Its crest rises RISE px above the floor and
//     it feathers out by the line itself, so the floor she stands on is the
//     tile layer and only the tile layer — the same pixels the room below
//     shows her from underneath. tests/seam-look.cjs measures both sides.
const NEAR_RISE = 24, NEAR_SOLID = 10, NEAR_DROP = 2;
let nearCutIm = null, nearCut = null;
function nearPlateCut(im) {
  if (nearCutIm === im && nearCut) return nearCut;
  const W = im.naturalWidth, H = im.naturalHeight;
  const s = 0.46 * 540 / H;                       // the plate's drawn scale, unchanged
  let start = 0, crest = 0;
  try {
    // rows at full height, columns squeezed: a row's coverage is all this
    // asks, and a 256-wide readback is a fraction of a millisecond where the
    // full plate cost 30-50 ms of one frame
    const MW = Math.min(W, 256);
    const m = document.createElement('canvas'); m.width = MW; m.height = H;
    const mx = m.getContext('2d', { willReadFrequently: true });
    mx.drawImage(im, 0, 0, W, H, 0, 0, MW, H);
    const d = mx.getImageData(0, 0, MW, H).data;
    const cov = new Float32Array(H);
    for (let y = 0; y < H; y++) {
      let n = 0;
      for (let x = 0; x < MW; x++) if (d[(y * MW + x) * 4 + 3] > 60) n++;
      cov[y] = n / MW;
    }
    m.width = m.height = 0;
    // the lowest run of near-empty rows at least 8% of the plate tall: the gap
    // between two pictures. Everything under it is the foreground.
    const minRun = Math.max(4, Math.round(H * 0.08));
    let gapTop = 0;
    for (let y = H - 1, run = 0; y >= 0; y--) {
      if (cov[y] < 0.12) { if (++run >= minRun) { start = y + run; gapTop = y; break; } }
      else run = 0;
    }
    if (start >= H) start = gapTop = 0;
    // ...then back up to the picture's very first opaque row (never out of
    // the gap), so the tip of the tallest pipe is the crest — cutting at the
    // gap's threshold would shear every tip off along one straight line
    while (start > gapTop && cov[start - 1] > 0) start--;
    crest = start;
    while (crest < H - 1 && cov[crest] === 0) crest++;
  } catch (e) { start = crest = 0; }
  // bake the cut ONCE: crest down to the walk line, opaque to NEAR_SOLID above
  // it and feathered to nothing NEAR_DROP below it — a fade, not a ruled edge
  const rows = Math.max(1, Math.min(H - crest, Math.ceil((NEAR_RISE + NEAR_DROP) / s)));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = rows;
  const x = cv.getContext('2d');
  x.drawImage(im, 0, -crest);
  x.globalCompositeOperation = 'destination-in';
  const g = x.createLinearGradient(0, 0, 0, rows);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(clamp((NEAR_RISE - NEAR_SOLID) / (NEAR_RISE + NEAR_DROP), 0, 1), 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, rows);
  nearCutIm = im;
  nearCut = { cv, s, start, crest, w: W * s, h: rows * s };
  return nearCut;
}
// where the near plate is drawn, in WORLD y — the harnesses ask this rather
// than re-deriving the geometry (tests/gait.cjs, tests/seam-look.cjs)
function nearPlateSpan() {
  if (!G.roomDef) return null;
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG['fore' + G.roomDef.zone];
  if (!im || !im.naturalWidth || G.roomDef.indoor) return null;
  const k = nearPlateCut(im), a = roomFloorAnchor(G.roomDef.h * TILE);
  return { top: a - NEAR_RISE, bottom: a - NEAR_RISE + k.h, anchor: a };
}
// ...AND NOT OVER THE GROUND EITHER. The walk line above is the room's MEDIAN
// floor; beside a hole, on a heap's foot, the ground she actually stands on
// rolls up to a dozen pixels above it (measured: soles at 467 over a median of
// 480 in A2, A5, A9), and there the crest would lie across the floor's lip
// again. So the band is composed in a strip of its own and the terrain is cut
// out of it: the floor's pixels are the tile layer's, everywhere, always.
let nearBandCv = null;
function drawNearPlate(im, floorY) {
  const k = nearPlateCut(im), par = 1.16;
  const w = k.w, Y = Math.round(floorY - NEAR_RISE);
  const Wd = Math.ceil(w), Hd = Math.ceil(k.h);
  // across the whole view (WORLD_VIEW: wider than 960 when the world is drawn zoomed out)
  const V = WORLD_VIEW;
  if (Y >= V.y + V.h || Y + Hd <= V.y) return;
  // the strip at the backbuffer's own resolution, so the plate is not softened
  const sf = Math.max(1, (cv && cv.width ? cv.width : 960) / 960) * V.k;
  const bw = Math.ceil(V.w * sf), bh = Math.ceil((Hd + 2) * sf);
  if (!nearBandCv) nearBandCv = document.createElement('canvas');
  if (nearBandCv.width !== bw || nearBandCv.height !== bh) { nearBandCv.width = bw; nearBandCv.height = bh; }
  const b = nearBandCv.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.globalCompositeOperation = 'source-over';
  b.clearRect(0, 0, bw, bh);
  b.setTransform(sf, 0, 0, sf, -V.x * sf, 0);
  let x = -((cam.x * par) % w);
  if (x > 0) x -= w;
  while (x > V.x) x -= w - 1;
  // mirrored alternate stamps, keyed to the world — see drawDepthPlane
  let n = Math.round((cam.x * par + x) / w);
  for (; x < V.x + V.w; x += w - 1, n++) {
    const X = Math.round(x);
    if ((n & 1) === 0) { b.drawImage(k.cv, X, 0, Wd, Hd); continue; }
    b.save();
    b.translate(X + Wd, 0);
    b.scale(-1, 1);
    b.drawImage(k.cv, 0, 0, Wd, Hd);
    b.restore();
  }
  // the terrain, exactly where the world pass put it (same rounding)
  // — only the slice under the strip, clipped by hand: Safari draws nothing at
  // all for a source rectangle that runs off its canvas
  if (tileCv && tileCv.width) {
    const ox = Math.round(camSX()), oy = Math.round(camSY()) + Y;
    const sx0 = Math.max(0, ox + Math.floor(V.x)), sy0 = Math.max(0, oy);
    const sx1 = Math.min(tileCv.width, ox + Math.ceil(V.x + V.w)), sy1 = Math.min(tileCv.height, oy + Hd + 2);
    if (sx1 > sx0 && sy1 > sy0) {
      b.globalCompositeOperation = 'destination-out';
      b.drawImage(tileCv, sx0, sy0, sx1 - sx0, sy1 - sy0, sx0 - ox, sy0 - oy, sx1 - sx0, sy1 - sy0);
      b.globalCompositeOperation = 'source-over';
    }
  }
  b.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(nearBandCv, 0, 0, bw, bh, V.x, Y, bw / sf, Hd + 2);
}

// ===========================================================================
// THE DARK, AND THE LIGHTS THAT ARE THE ONLY MAP OF IT
//
// world.js calls the crystal cave "the long dark" and says of its far end
// "the pillar SHINING at the end of the dark — the shine is the guide". It
// was lit like a corridor with the lights on. Nothing in it could be a guide,
// because everything was equally visible: the beacon terminal she is meant to
// walk sixty tiles toward was six pixels of amber in a fully lit magenta
// room, and the buried branch into the Seam was exactly as legible as the way
// on. The owner asked for a tunnel that is "rich in experience"; a tunnel is
// not rich because it has more furniture in it, it is rich because it
// withholds, and lighting is the only thing in a side-scroller that can
// withhold and still be fair.
//
// So the cave gets its dark back, and light becomes information:
//
//   SHE CARRIES ONE. A lamp around the body that breathes with her core and
//     FLARES while the claw is charged — the charge is now a light source as
//     well as a weapon, which is the cheapest good reason to hold it.
//   THE BEACON IS THE WARMEST THING DOWN THERE. The sound she has followed
//     since the meadow has a glow at the end of it now, and the glow carries
//     further than the voice does, so the last stretch of the search is seen
//     before it is heard.
//   THE PILLAR IS BRIGHTER AND COLD, where the beacon is dim and warm, so the
//     two ends of the tunnel never read as the same errand.
//   THE MOUTHS LEAK DAYLIGHT. The way back is never lost, and a buried mouth
//     leaks nothing at all until it is broken open — which is the rubble's
//     reward stated in light instead of in a toast.
//   THE BENCH BURNS. A save point you can see from across a dark room is a
//     save point that changes how you spend the room.
//   AND THE ANIMALS HAVE EYES: a crawler is two embers before it is a
//     crawler. That is the whole point of an unlit room — it moves the
//     information from the silhouette to whatever on the thing is lit.
//
// It is a MASK, not a filter: one half-resolution plate of the zone's own
// shadow with holes punched in it by destination-out, then blitted back over
// the frame. That is a fill, a handful of radial gradients at quarter area,
// and one scaled draw — cheap enough that it is deliberately NOT on the richK
// budget with the luxuries. A dark room with its lighting switched off is not
// a cheaper dark room, it is a black screen.
//
// The dark stops at 0.80 rather than at 1: the far rock stays a readable
// silhouette, so the player is navigating a dim room rather than groping in
// one. Being unable to see the floor is not atmosphere, it is a bug the
// player cannot report.
// ===========================================================================
const DARK_K = 0.74;                   // how much of the unlit room is taken
const DARK_ADD = 0.40;                 // ...and how hard the lamps put it back.
// Modest, and it stays modest. The additive pass is the GLOW around a source,
// not the illumination itself — the illumination is the shadow mask lifting off
// the rock, which keeps the rock's own texture because it is a blend and not a
// paint. Turned up far enough to carry the lighting on its own it stops being
// light and becomes fog: measured at 0.90 it rendered three lamps as three
// milky discs with no rock visible inside them. See the note on draw order at
// the call site for why that was ever tempting.
const DARK_TINT = 'rgb(15,8,28)';      // unlit crystal rock. Never pure black:
                                       // black reads as a hole in the canvas
const DARK_W = 480, DARK_H = 270;      // half res — soft light has no edge to lose
let darkCv = null, litCv = null;
// A light is a hole in the shadow AND a glow added back on top, and it needs
// to be both. The first version was the hole alone, and it was measurably
// correct and visually nothing: subtracting less darkness from rock that is
// already dark does not read as a lamp, because a lamp is not an absence of
// shadow, it is a source. The pair is the whole trick — the mask decides what
// she can see, the additive pass decides what it looks like when she can.
// ...and both of them are baked ONCE into a 128 px sprite and thereafter
// blitted, never rasterised again. Measured on the software rasteriser this
// repo tests on: ten lights x two createRadialGradient + arc + fill per frame
// cost 9.2 ms, which is 60% of a frame budget spent on a lighting model that
// is supposed to be the cheap part. A radial falloff does not change shape
// between lights — only its size, its colour and its strength do, and all
// three are free on a drawImage (scale, one sprite per colour, globalAlpha).
const LIGHT_SPR = {};
let SHADOW_SPR = null;
function radialSprite(paint) {
  const s = document.createElement('canvas');
  s.width = s.height = 128;
  const x2 = s.getContext('2d');
  const g = x2.createRadialGradient(64, 64, 0, 64, 64, 64);
  paint(g);
  x2.fillStyle = g; x2.fillRect(0, 0, 128, 128);
  return s;
}
function shadowSprite() { return SHADOW_SPR || (SHADOW_SPR = radialSprite(g => darkStops(g, 1))); }
function lightSprite(rgb) { return LIGHT_SPR[rgb] || (LIGHT_SPR[rgb] = radialSprite(g => litStops(g, rgb, 1))); }
function darkStops(g, a) {
  g.addColorStop(0,    'rgba(0,0,0,' + a + ')');
  g.addColorStop(0.34, 'rgba(0,0,0,' + (a * 0.86) + ')');
  g.addColorStop(0.68, 'rgba(0,0,0,' + (a * 0.34) + ')');
  g.addColorStop(1,    'rgba(0,0,0,0)');
}
function litStops(g, rgb, a) {
  // tight core, long tail. A light with a linear falloff reads as a grey disc
  // pasted on the room; the eye only accepts it as a source when the middle is
  // much hotter than the edge.
  g.addColorStop(0,    'rgba(' + rgb + ',' + a + ')');
  g.addColorStop(0.30, 'rgba(' + rgb + ',' + (a * 0.70) + ')');
  g.addColorStop(0.62, 'rgba(' + rgb + ',' + (a * 0.24) + ')');
  g.addColorStop(1,    'rgba(' + rgb + ',0)');
}
// The lights in the room, in world coordinates, gathered once and spent twice.
//   r     world-pixel reach
//   hard  how completely the centre clears the shadow: 1 is a lamp, 0.5 is an
//         ember that says something is there without saying what
//   rgb   what colour it puts back
//   lit   how much it puts back, relative to DARK_ADD
function caveLightList() {
  const L = [], now = performance.now() / 1000;
  const add = (x, y, r, hard, rgb, lit) => L.push({ x, y, r, hard, rgb, lit: lit == null ? 1 : lit });

  // SHE CARRIES ONE, and it breathes with her core and FLARES with the charge
  // — the charge is a light source as well as a weapon now, which is the
  // cheapest good reason a dark room can give her to hold it.
  const ch = Math.min(1, (player.chargeT || 0) / 0.6);
  add(player.x + player.w / 2, player.y + player.h * 0.44,
      (246 + ch * 118) * (1 + Math.sin(now * 2.1) * 0.028), 1,
      ch > 0.05 ? '190,232,255' : '150,196,232', 0.9 + ch * 0.7);

  // the fixtures. Each one is a reason to walk toward it, and the colour is
  // the reason: warm is somebody's machine, cold is the cave's own crystal.
  for (const s2 of G.statics) {
    const cx = s2.x + s2.w / 2, cy = s2.y + s2.h / 2;
    // (0.6, not 1.5: at one and a half the light the marble gives off was laid
    // over the marble itself, and the stone she came all this way for was a
    // pale ghost inside its own glare. The dark is still cleared as widely.)
    if (s2.type === 'pillar') add(cx, cy, 372, 1, '196,238,255', 0.6);
    else if (s2.type === 'term') add(cx, cy - 6, s2.opened ? 168 : 236, 0.94, '255,178,86', s2.opened ? 0.8 : 1.25);
    else if (s2.type === 'bench') add(cx, cy, 190, 0.88, '255,206,120', 1.0);
    else if (s2.type === 'npc') add(cx, cy, 198, 0.86, '255,214,150', 0.8);
    else if (s2.type === 'chest' || s2.type === 'vault' || s2.type === 'mod' ||
             s2.type === 'item' || s2.type === 'trial') add(cx, cy, 132, 0.72, '190,150,255', 0.7);
  }
  // DAYLIGHT DOWN THE MOUTHS — but only the ones that are actually open. A
  // buried door leaks nothing, so breaking the rubble is what lets the light
  // in and the room changes shape the moment it does. That is the reward for
  // the owner's rubble stated in light instead of in a toast.
  if (typeof gateDoors === 'function' && typeof gateWorldX === 'function') {
    for (const d of gateDoors()) {
      if ((typeof rubbleFor === 'function' && rubbleFor(d)) || gateLocked(d) || ringAsleep(d)) continue;
      const gx = gateWorldX(d);
      if (gx == null || isNaN(gx)) continue;
      // (a RING is its own lamp: the dark is cleared round it just the same,
      // but daylight is not poured over a field that is already light — that
      // pushed every cave gate to white)
      if (typeof ringGateFor === 'function' && ringGateFor(d)) add(gx, (G.roomDef.h - 3) * TILE, 268, 0.9, '206,232,214', 0.22);
      else add(gx, (G.roomDef.h - 3) * TILE, 268, 0.9, '206,232,214', 0.85);
    }
  }
  const ex = G.roomDef.exits || {}, W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  if (ex.L) add(0, H - TILE * 2.5, 224, 0.72, '176,206,226', 0.6);
  if (ex.R) add(W, H - TILE * 2.5, 224, 0.72, '176,206,226', 0.6);

  // EYES. Dim, and they do not clear their centre, so an animal in the dark is
  // a pair of embers and a suggestion — which is both more frightening and
  // more useful than a full silhouette or nothing at all. A SAGE is not an
  // animal: he kneels in his own light at the end of the deep chamber, which
  // is how that room announces a duel before she is in range to be challenged.
  for (const e of G.enemies) {
    if (e.dead) continue;
    if (e.kind === 'sage') add(e.x + e.w / 2, e.y + e.h * 0.4, 274, 0.9, '160,232,255', 1.1);
    else add(e.x + e.w / 2, e.y + e.h * 0.3, 100, 0.5, '255,120,120', 0.5);
  }
  if (G.boss && !G.boss.dead) add(G.boss.x + G.boss.w / 2, G.boss.y + G.boss.h * 0.35, 320, 0.74, '255,110,130', 1.0);
  for (const p2 of G.projs) add(p2.x, p2.y, 82, 0.56, '210,238,255', 0.7);
  return L;
}
// ---------------------------------------------------------------------------
// AN INTERIOR IS A DARK ROOM WITH THE LAMPS ON, WHICH IS NOT THE SAME THING
// AS A CAVE.
//
// The owner, on the trader's den: "a dark room for a workshop, but it needs to
// also look lively... the background should blend with the items within it,
// instead of being dull and dark."
//
// What he was reading is real and it is a LIGHTING failure, not an art one.
// The den's painting is a warm workshop — Ratchet under a lamp, a lit bench,
// tools — and it is bottom-anchored, so two thirds of the frame above it was
// flat unlit dark with nothing in it. Meanwhile every character was drawn at
// full brightness with a cold teal rim, because the only light in the room was
// the one baked into each sprite. So the painted lamps lit nothing, the empty
// air was a black rectangle, and she stood in front of it all rather than in
// it. The picture had no single light to agree on.
//
// The caves solved this problem already (drawCaveDark), and the answer is the
// same one: put the light in the ROOM and let it fall on everything. What
// differs is the recipe, because a workshop is not a cave —
//
//   IT IS DIMMER, NOT BLIND. The cave takes 74% of the room away because not
//     being able to see is the cave's whole subject. A workshop with its lamps
//     lit is 55%: shadowed, warm, and readable everywhere.
//   THE LAMPS PUT BACK MORE. A small room with painted light bounces; the
//     additive pass runs harder here than underground, and that — not the
//     shadow — is what makes it read as LIVELY rather than merely dark.
//   THE DARK IS WARM. Cave rock is cold purple. Unlit corners of a lamplit
//     workshop are brown, because they are the same light with less of it.
//   SHE STOPS CARRYING THE SUN. In a cave her lamp is the map; indoors it is
//     a courtesy, so it drops to a fifth of the reach. Being LIT by the room
//     instead of self-lit is the whole of what makes her belong in it.
// TUNED AGAINST THE PICTURE, not in the abstract. At 0.55/0.62 the mask was
// winning and it was darkening the painting's OWN lit areas — the booth's lit
// front, the lamp on his lap — which is the one thing a lighting pass over
// authored art must never do. The shadow comes down and the lamps come up: the
// room is barely masked and heavily re-lit, so what the eye reads is the light
// rather than the dark. That is the difference between moody and dull.
// ...and once the plate itself is graded up, the mask has far less work to do:
// its job here is shape, not exposure. 0.22 is a room with corners rather than
// a room with the lights off, and the lamps still carry the reading.
//
// THE LAMPS WERE TUNED WITH THE LAMPS OFF (owner's phone, 2026-09-03: the den
// under a yellow disc the size of the room, Ratchet a ghost inside it — "it
// went away then came back"). The additive pass rides richK, and on the
// software rasteriser every harness runs on, richK is at zero within seconds
// of any room loading. So every headless look anyone ever took at an interior
// was the glow-OFF picture — "dull and dark", the very complaint the pass was
// written to answer — and INT_ADD climbed to 0.95 to brighten lamps that were
// not being drawn. On a phone the dial sits at one. At 0.95, added over a
// painting that is already lit, 73% of the pixels around the keeper clipped,
// in all six interiors; and the on/off he saw was the dial falling under load
// and recovering, not the chest. 0.25 is the value at which every interior
// keeps its picture with the dial OPEN — tests/denlight.cjs pins richK at one
// and measures it — while the keeper's spot still doubles in brightness against
// the glow-off room. `let`, like the BG_ knobs, so the harness can sweep it.
let INT_K = 0.22, INT_ADD = 0.25;
const INT_TINT = 'rgb(30,19,12)';
// each kingdom's interior takes its own warm accent, so the Foundry's forge and
// the Archives' carrel are lamplit in their own colour rather than the meadow's
function warmRGB(zone) {
  const P = PAL[zone] || PAL.A;
  const h = (P.acc2 || '#ffb347').replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
}
function interiorLightList() {
  const L = [], now = performance.now() / 1000;
  const add2 = (x, y, r, hard, rgb, lit) => L.push({ x, y, r, hard, rgb, lit: lit == null ? 1 : lit });
  const zone = G.roomDef.zone, warm = warmRGB(zone);
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;

  // HER OWN, kept small on purpose — see the note above. Enough that she is
  // never a silhouette in her own room, nowhere near enough to be the reason
  // the room is visible.
  add2(player.x + player.w / 2, player.y + player.h * 0.44, 132, 0.62, '208,214,226', 0.34);

  // THE FIXTURES ARE THE ROOM. Everything somebody works at is a light: the
  // keeper's own lamp is the brightest thing in here because he is what the
  // room is for.
  for (const s2 of G.statics) {
    const cx = s2.x + s2.w / 2, cy = s2.y + s2.h / 2;
    if (s2.type === 'npc') add2(cx, cy - 8, 300, 0.95, warm, 1.35);
    else if (s2.type === 'bench') add2(cx, cy, 210, 0.8, '255,206,120', 0.9);
    else if (s2.type === 'term') add2(cx, cy - 6, 190, 0.8, '255,178,86', 0.85);
    else if (s2.type === 'chest' || s2.type === 'vault' || s2.type === 'mod' ||
             s2.type === 'item' || s2.type === 'trial') add2(cx, cy, 150, 0.7, '255,196,120', 0.6);
  }

  // THE WORK SURFACES CARRY STRIP LIGHT. A loft or a bench in one of these
  // rooms is where the work happens, so it is lit — and because these hang
  // high on the wall, they are also what finally puts something in the empty
  // air above the painting. One lamp per run of platform, over its middle.
  const g = G.grid;
  if (g) for (let ty = 0; ty < g.length; ty++) {
    let tx = 0;
    while (tx < g[0].length) {
      if (g[ty][tx] !== '=') { tx++; continue; }
      let e = tx; while (e + 1 < g[0].length && g[ty][e + 1] === '=') e++;
      add2((tx + e + 1) / 2 * TILE, ty * TILE - 10, 236, 0.72, warm, 0.8);
      tx = e + 1;
    }
  }

  // ...and a hanging lamp, breathing, so the ceiling is a place with something
  // in it rather than the top edge of the picture
  add2(W * 0.62, H * 0.30, (260 + Math.sin(now * 0.9) * 8), 0.66, warm, 0.72);
  add2(W * 0.24, H * 0.34, 190, 0.55, warm, 0.5);
  return L;
}
function drawCaveDark() {
  const indoor = !!(G.roomDef && G.roomDef.indoor);
  if (G.darkProbe || !G.roomDef || !(G.roomDef.cave || indoor) || !player) return;
  if (!darkCv) {
    darkCv = document.createElement('canvas'); darkCv.width = DARK_W; darkCv.height = DARK_H;
    litCv  = document.createElement('canvas'); litCv.width  = DARK_W; litCv.height  = DARK_H;
  }
  const dx = darkCv.getContext('2d'), lx = litCv.getContext('2d');
  // THE SHADOW IS GAMEPLAY; THE GLOW IS A LUXURY. Two full-frame composites is
  // what this pass costs, and on the software rasteriser the harnesses run on
  // that measured 9.8 ms — which is a frame budget spent on lighting. So the
  // mask, which decides what she can SEE and therefore how the room plays,
  // runs unconditionally; the additive glow rides the same richK dial as the
  // background depth plate and fades out first on a machine that is
  // struggling. A dark cave without its glow is a dark cave. A dark cave
  // without its mask is a lit corridor, which is the bug this fixes.
  const glowK = (typeof richK === 'number' ? richK : 1);
  const glow = glowK > 0.02;
  // over the whole view (WORLD_VIEW: wider than 960 when the world is drawn zoomed out)
  const V = WORLD_VIEW;
  const S = DARK_W / V.w;                        // world px -> mask px
  const ox = Math.round(camSX() + V.x), oy = Math.round(camSY() + V.y);
  dx.globalCompositeOperation = 'source-over';
  dx.fillStyle = indoor ? INT_TINT : DARK_TINT; dx.fillRect(0, 0, DARK_W, DARK_H);
  dx.globalCompositeOperation = 'destination-out';
  if (glow) {
    lx.globalCompositeOperation = 'source-over';
    lx.clearRect(0, 0, DARK_W, DARK_H);
    lx.globalCompositeOperation = 'lighter';
  }

  const shadow = shadowSprite();
  for (const L of (indoor ? interiorLightList() : caveLightList())) {
    const sx = (L.x - ox) * S, sy = (L.y - oy) * S, r = L.r * S;
    // off-screen lights still count: a glow whose centre is past the edge is
    // exactly how a room tells you there is something over there
    if (r <= 1 || sx < -r || sy < -r || sx > DARK_W + r || sy > DARK_H + r) continue;
    dx.globalAlpha = L.hard;
    dx.drawImage(shadow, sx - r, sy - r, r * 2, r * 2);
    if (!glow) continue;
    lx.globalAlpha = Math.min(1, L.lit);
    lx.drawImage(lightSprite(L.rgb), sx - r, sy - r, r * 2, r * 2);
  }
  dx.globalAlpha = 1; lx.globalAlpha = 1;

  // The shadow plate is FILLED with the tint and the holes are cut out of it,
  // so one blit lays the unlit part down in exactly the right colour. Filling
  // black and tinting afterwards would have tinted the lit holes too.
  //
  // NO setTransform HERE. The backbuffer is resized by the quality dial
  // (js/perf.js sets cv.width = 960 * rs) and the context carries that scale,
  // so 960x540 is the logical frame and resetting the matrix would draw the
  // shadow into a corner of it. lightPass and drawScreenLift both fillRect
  // 0,0,960,540 for the same reason; this follows them.
  c.save();
  c.globalAlpha = indoor ? INT_K : DARK_K;
  c.globalCompositeOperation = 'source-over';
  c.drawImage(darkCv, V.x, V.y, V.w, V.h);
  if (glow) {
    c.globalAlpha = (indoor ? INT_ADD : DARK_ADD) * glowK;
    c.globalCompositeOperation = 'lighter';
    c.drawImage(litCv, V.x, V.y, V.w, V.h);
  }
  c.restore();
}
// THE THREE NUMBERS THAT DECIDE HOW FAR THE BACKGROUND IS PUSHED BACK, named
// so they can be measured and swept (tools/gradesweep.cjs) instead of guessed.
// Guessing is what produced the frame the owner reported as "toooooo dark and
// faded", and the guessing had a signature: the background was crushed to a
// tenth of its value and 94% of its colour, and then the SCREEN LIFT put grey
// back over the whole frame to compensate. Crush plus lift is the exact recipe
// for faded — it removes the picture and then raises the floor it was removed
// to.
//
// The laws these serve have a ceiling, and the measurements were nowhere near
// it: §9.1 allows the background plane up to 25% luminance and it was sitting
// at 8-13, §9.4 allows 12 chroma and it was at 3-7. Half the permitted light
// and a quarter of the permitted colour, thrown away for nothing.
let BG_DESAT = 0.80;   // how much chroma the far plane gives up
let BG_SIT = 0.55;     // how hard the far plane is sat down: 0 untouched, 1 full wash
let BG_HAZE = 0.13;    // the veil that keeps distance from reading as underexposure
let BG_TINT = 0.62;    // how much of the zone hue survives the darkening (0 = grey)
// AND THE PASS HAS TO KNOW WHAT IS BEHIND IT.
//
// This grade was written for the PROCEDURAL backdrop — bands of machine city
// drawn in code, which arrived too bright and too saturated and needed pushing
// back. It then ran, unchanged and at full strength, over the authored
// paintings as well. Photographed step by step (tools/gradesweep.cjs and the
// layer snapshots that found this), the gate painting arrives warm, rusty and
// completely readable, the desaturation takes its colour, and the multiply
// takes two thirds of its light: what reaches the player is the flat teal murk
// the owner sent a screenshot of, with the door he asked about invisible in it.
//
// A painting already contains its own aerial perspective. The gate plate is
// painted with haze, with depth, and with a warm light behind the doors — that
// is what the brief asked Higgsfield for and it is what came back. Grading it
// again is not depth, it is repainting, and ART_BIBLE §0 is explicit about who
// owns the paint. So the pass keeps its full strength over procedural ground
// and goes light over an authored plate: enough to seat it behind the
// playfield, not enough to take it away.
// THE FOUNDRY DECIDES THE CHROMA NUMBER, and it always did — the note this
// pass was written under says so. Zone C is molten iron: its painting is the
// most saturated surface in the game, and a desaturation generous enough to
// give the Meadows its rust back leaves the Foundry's wall at the §9.4 limit
// while every other room sits comfortably under it. So the strength is per
// zone rather than one number bent until the worst room passes — which is how
// every other room lost its colour in the first place.
// 2026-08-25: dropped from 0.40/0.92 — see the note over VISTA_SEAT. A painted
// plate arrives already graded by the painter; the pass keeps only enough hold
// that she still reads in front of it.
let BG_ART_DESAT = 0.05, BG_ART_SIT = 0.18, BG_ART_HAZE = 0.11;
const BG_ART_DESAT_ZONE = { C: 0.30 };
const BG_ART_SIT_ZONE = { C: 0.45 };
function bgPlanePass() {
  const L = ZONE_LIGHT[G.roomDef.zone];
  if (!L) return;
  const [wr, wg, wb] = L.wash;
  // HOW HARD THIS PASS PUSHES DEPENDS ON WHAT IS BEHIND THE FRAME, and there
  // are two ways it can be wrong. Both were reported, from opposite ends, and
  // both are the same mistake: a grade written for one kind of backdrop running
  // at full strength over another.
  //
  // AERIAL PERSPECTIVE IS ABOUT DISTANCE, AND AN INTERIOR HAS NONE. Outdoors
  // the law models the real thing — kilometres of air between her and the
  // skyline. In the trader's den the "far plane" is the wall she is standing a
  // metre from, and stripping its chroma and multiplying it down does not push
  // it into the distance, it turns the room she is inside into a grey
  // photograph of somewhere else: "as if I'm looking at a framed image instead
  // of an actual background of the actual shop".
  //
  // AND AN AUTHORED PAINTING ALREADY CONTAINS ITS OWN. The gate plate is
  // painted with haze, with depth and with a warm light behind the doors,
  // because that is what the brief asked Higgsfield for. Photographed step by
  // step, it arrives warm and completely readable and this pass takes it back
  // off: what reached the player was the flat teal murk in the owner's
  // screenshot, with the door he asked about invisible in it. Grading a
  // painting again is not depth, it is repainting, and ART_BIBLE §0 is
  // explicit about who owns the paint.
  //
  // So the law is kept and its STRENGTH is a function of what it is grading.
  // Procedural ground outdoors takes it in full; a wall she is standing next to
  // and a painted plate take a fraction — enough separation that she still
  // reads in front of it, nowhere near enough to send it to another country.
  const inr = !!(G.roomDef && G.roomDef.indoor);
  const painted = G._vistaPainted === G.roomId;   // drawZoneVista says so directly
  const soft = inr || painted;
  const zn = G.roomDef.zone;
  const artDesat = (BG_ART_DESAT_ZONE && BG_ART_DESAT_ZONE[zn]) || BG_ART_DESAT;
  const artSit = (BG_ART_SIT_ZONE && BG_ART_SIT_ZONE[zn]) || BG_ART_SIT;
  const DESAT = inr ? 0.24 : painted ? (G.roomDef.cave ? Math.max(.30,artDesat) : artDesat) : BG_DESAT;
  const SIT = inr ? 0.08 : painted ? (G.roomDef.cave ? Math.max(.25,artSit) : artSit) : BG_SIT;
  const HAZE = inr ? 0.04 : painted ? BG_ART_HAZE : BG_HAZE;
  c.save();
  // 1 — pull the chroma out
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = 'hsl(0,0%,50%)';
  // 0.62 left the Foundry at 76 and 0.82 at 56 on the RELATIVE chroma measure
  // that was later found to be meaningless on dark pixels; on the absolute one
  // this file measures with now, 0.94 was costing the background nearly all of
  // its colour to stay a quarter under a limit it could not have reached.
  c.globalAlpha = DESAT;
  c.fillRect(0, 0, 960, 540);
  // 2 — sit it down in value, toward the zone's own shadow rather than to grey.
  //
  // THE TINT IS MUTED BEFORE IT DARKENS, which is the difference between depth
  // and repainting. A multiply by a SATURATED colour does not dim a picture, it
  // rewrites it: zone A's wash is [120,190,175], so its red channel is 0.63 of
  // its green whatever strength it is used at, and every warm plate in the
  // Meadows lost 37% of its red before anything else touched it. The haze below
  // has muted itself toward its own mean since it was written, for exactly this
  // reason; the darkening never did. Indoors it goes toward a warm lamp shadow
  // instead of the kingdom's outdoor light — the corners of a lit workshop are
  // brown, not teal.
  //
  // AND `SIT` IS A STRENGTH NOW, WHICH IT WAS NOT. It used to SCALE the wash
  // colour, and a wash is already about 0.6 of white — so `sit = 1`, which
  // reads like "leave it alone", still multiplied the frame by (0.51, 0.72,
  // 0.67): a 35% darkening and a hard cut to red that no value of the knob
  // could turn off. That is why softening it from 0.42 to 0.92 changed the
  // number and never the picture. Interpolated from WHITE instead, 0 means
  // untouched and 1 means the full wash, which is what a strength is.
  const tw = inr ? [250, 232, 214] : [wr, wg, wb];
  const tmean = (tw[0] + tw[1] + tw[2]) / 3;
  const mute = (v) => v * (1 - BG_TINT) + tmean * BG_TINT;
  const toward = (v) => Math.round(255 - (255 - mute(v)) * SIT);
  c.globalCompositeOperation = 'multiply';
  c.globalAlpha = 1;
  c.fillStyle = 'rgb(' + toward(tw[0]) + ',' + toward(tw[1]) + ',' + toward(tw[2]) + ')';
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
  // barely any haze indoors — haze is suspended air, and there are four metres
  // of it in a shed
  h.addColorStop(0, 'rgba(' + hr + ',' + hg2 + ',' + hb + ',' + HAZE + ')');
  h.addColorStop(1, 'rgba(' + hr + ',' + hg2 + ',' + hb + ',' + (HAZE * 0.31).toFixed(3) + ')');
  c.fillStyle = h;
  c.fillRect(0, 0, 960, 540);
  // ...and break the pitch. Overlay keeps mid-grey neutral, so this only
  // pushes the background's own values apart — it never tints it. A PAINTING
  // does not need it: the mottle exists so a procedurally repeated backdrop
  // cannot match itself across a screen (§10.7), and a painted plate has its
  // own light pooling in it already.
  c.globalCompositeOperation = 'overlay';
  c.globalAlpha = painted ? 0.42 : 0.55;
  c.drawImage(bgMottle(), 0, 0);
  c.restore();
  c.globalAlpha = 1;
}

// A one-pixel-wide cached grade keeps scene lighting coherent even when
// bloom and the extra background copy are dropped by the performance budget.
const ZONE_GRADE_CACHE = new Map();
function zoneLightGrade(L, quality) {
  const strength = 0.35 + 0.65 * (Math.round(clamp(quality, 0, 1) * 32) / 32);
  const key = JSON.stringify([L.from, L.wash, L.k, strength]);
  if (ZONE_GRADE_CACHE.has(key)) return ZONE_GRADE_CACHE.get(key);
  const cv = document.createElement('canvas'); cv.width = 1; cv.height = 540;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 540 * L.from - 220, 0, 540);
  const lift = v => Math.round(255 - (255 - v) * L.k * strength);
  g.addColorStop(0, 'rgb(255,255,255)');
  g.addColorStop(1, 'rgb(' + L.wash.map(lift).join(',') + ')');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 540);
  if (ZONE_GRADE_CACHE.size >= 256) ZONE_GRADE_CACHE.clear();
  ZONE_GRADE_CACHE.set(key, cv);
  return cv;
}
function lightPass(P) {
  const L = ZONE_LIGHT[G.roomDef.zone];
  if (!L) return;
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.drawImage(zoneLightGrade(L, richK), 0, 0, 960, 540);
  c.restore();
  c.globalAlpha = 1;
  // Bloom remains in drawWorldFrame, before the accessibility lift.
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
  if (typeof drawHeroMotionLoading === 'function' && drawHeroMotionLoading(c)) return;
  if (st === 'CINE') { drawCine(); return; }
  if (st === 'CUT') { drawCut(); return; }
  if (st === 'PURIFY') { drawPurification(); return; }
  if (st === 'PANELS') { drawPanels(); return; }
  // A ROOM IS NOT SHOWN BEFORE THE PAGES THAT LEAD INTO IT: the wake's pages
  // right after the difficulty choice, an arrival's pages while they finish
  // loading (js/panels.js panelsCovering) — black, never the game underneath
  if (st === 'PLAY' && typeof panelsCovering === 'function' && panelsCovering()) { c.fillStyle = '#000'; c.fillRect(0, 0, 960, 540); return; }
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
      // the studio and the build stamp — who made it, and which one you are running
      drawFooter(520, false);
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
  if (st === 'KEND') { drawK1End(); return; }
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
    // ...and what is left after her (docs/STORY_SCRIPT.md: the Eye has no
    // fight yet, so the ending says only what is true — it is exposed, not beaten)
    { const w2 = t('win2b'); if (w2 !== 'win2b') ftxt(w2, 480, 212, 15, '#9db3c4'); }
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
  if (typeof withWorldProjection === 'function') withWorldProjection(c,drawFX); else drawFX();
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
  // THE HELD FRAME IS THE WORLD, NOT THE SCREEN. Grabbing the finished screen
  // meant the crossing slid the HUD too — two map buttons and two rows of
  // hearts, which reads as a glitch rather than as travel. It is taken HERE,
  // before the interface goes on, and only in the moments a crossing could
  // actually start: a full-backbuffer blit every frame of the game to serve a
  // third of a second at a doorway is not a trade worth making.
  // a shock wave bends the finished picture as it passes — the world and its
  // grade, never the interface, which goes on after this (js/ripple.js)
  if (typeof rippleDraw === 'function') rippleDraw(c);
  holdFrameNearExit();
  if (typeof drawBrDelta === 'function') drawBrDelta();
  drawTutor();
  if (typeof pgHatchPointer === 'function') pgHatchPointer(c);   // the way down to the marble (js/progress.js)
  if (typeof pgRoutePointer === 'function') pgRoutePointer(c);   // ...and the way to whatever she was asked to do
  if (typeof drawGateWalk === 'function') { if (typeof withWorldProjection === 'function') withWorldProjection(c,drawGateWalk); else drawGateWalk(); }
  drawLesson();
  drawHUD();
  if (typeof drawDmgOverlay === 'function') drawDmgOverlay(c);   // the Forge's DAMAGE ranking (js/dmglog.js)
  if (typeof drawSceneCaption === 'function') drawSceneCaption();   // js/overlay.js
  if (typeof drawOpeningHUD === 'function') drawOpeningHUD();
  drawMapButton();
  drawMapGive();
  if (typeof drawSoundChip === 'function') drawSoundChip(tsec);
  if (typeof drawSaveFeedback === 'function') drawSaveFeedback();
  // THE PUSH. The frame she left is held and slid off the edge she left by, so
  // the two rooms read as one continuous space travelled through rather than
  // two pictures swapped. Drawn in RAW DEVICE PIXELS — the quality dial scales
  // the backbuffer, and a slide measured in layout units tears at the seam.
  if (G.trans) {
    if (transSnap) {
      const k = clamp(1 - G.trans.t / TRANS_DUR, 0, 1);
      // eased so it leaves fast and settles: a linear slide reads as a wipe
      const e = 1 - Math.pow(1 - k, 2.2);
      const W = cv.width, H = cv.height;
      const sd = G.trans.side;
      const dx = sd === 'R' ? -e * W : sd === 'L' ? e * W : 0;
      const dy = sd === 'T' ? e * H : sd === 'B' ? -e * H : 0;
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(transSnap, dx, dy);
      // the seam: a thin shadow on the leading edge of the room she is
      // entering, so the join is a doorway of light rather than a hard cut
      const sw = 26;
      if (dx || dy) {
        const gx0 = dx ? (sd === 'R' ? dx + W : dx - sw) : 0;
        const gy0 = dy ? (sd === 'T' ? dy + H : dy - sw) : 0;
        const g4 = dx ? c.createLinearGradient(gx0, 0, gx0 + (sd === 'R' ? sw : -sw), 0)
                      : c.createLinearGradient(0, gy0, 0, gy0 + (sd === 'T' ? sw : -sw));
        g4.addColorStop(0, 'rgba(3,5,9,0.55)');
        g4.addColorStop(1, 'rgba(3,5,9,0)');
        c.fillStyle = g4;
        if (dx) c.fillRect(Math.min(gx0, gx0 + (sd === 'R' ? sw : -sw)), 0, sw, H);
        else c.fillRect(0, Math.min(gy0, gy0 + (sd === 'T' ? sw : -sw)), W, sw);
      }
      c.restore();
    }
  } else if (transSnap) { transSnap = null; }
  if (st === 'DEAD') {
    c.fillStyle = 'rgba(8,4,8,' + clamp((1.8 - G.deadT) * 1.2, 0, 0.85) + ')';
    c.fillRect(0, 0, 960, 540);
    ftxt(t('death'), 480, 250, 46, '#ff5f6d', 'center', '#ff5f6d');
    if (G.deathLine) {
      c.save(); c.globalAlpha = clamp((1.2 - G.deadT) * 1.6, 0, 1);
      ftxt(G.deathLine, 480, 300, 17, '#c9a0a6', 'center');
      c.restore();
    }
  } else if (st === 'PAUSE') {
    c.fillStyle = 'rgba(4,7,12,0.75)'; c.fillRect(0, 0, 960, 540);
    ftxt(t('paused'), 480, 118, 34, '#eef3fa', 'center', '#37ffd0');
    // THE BRAID, SHOWN (underdog-arc): the world's code, which way it leans,
    // and the law that is this run's alone — on the screen she opens most,
    // not only behind its own button
    ftxt(pauseWorldLine(), 480, 150, 13, '#7d93a8', 'center');
    // THE LIST IS MEASURED, NOT COUNTED OUT IN FORTIES. At a fixed 40 px step
    // from y=190 the last row landed at 510 on desktop and at 550 — off the
    // bottom of a 540 px screen — as soon as the touch row appeared. The way
    // OUT of the game was the row that fell off, which is the worst one to
    // lose, and it is exactly what was reported: "the exit button is under the
    // screen". The step now comes from how many rows there are.
    const PL = pauseLayout(), pm = PL.items, step = PL.step;
    const fs = Math.min(PL.cols === 2 ? 18 : 21, step * 0.56);
    pm.forEach((it, i) => {
      const sel = i === G.pauseIdx, P = PL.pos(i), x = P.x, y = P.y;
      // the two irreversible rows are tinted so they can never be hit by feel
      if (it.warn) {
        c.fillStyle = it.out ? 'rgba(255,120,110,0.10)' : 'rgba(255,190,110,0.09)';
        rr(c, x - PL.colW / 2, y - step * 0.5, PL.colW, step * 0.86, 8); c.fill();
      }
      if (sel && PL.cols === 2) {
        c.fillStyle = 'rgba(55,255,208,0.07)';
        rr(c, x - PL.colW / 2, y - step * 0.5, PL.colW, step * 0.86, 8); c.fill();
      }
      const rowTxt = (sel ? '▸ ' : '') + (it.icon ? it.icon + '  ' : '') + it.label;
      ftxt(rowTxt, x, y, fs,
           sel ? '#eef3fa' : (it.out ? '#e88b86' : it.warn ? '#e8bb86' : '#7d93a8'));
      // the two loadout doors carry their system's frame at the line's leading
      // edge (js/loadout.js) — the same diamond and seal the screens behind them use
      if (it.lo && typeof drawLoadoutFrame === 'function') {
        c.font = '700 ' + fs + 'px "Segoe UI", Tahoma, sans-serif';
        const hw = c.measureText(rowTxt).width / 2, fr = Math.max(6, Math.min(10, step * 0.28));
        const rtlP = typeof isRTL === 'function' && isRTL();
        drawLoadoutFrame(c, it.lo, rtlP ? x + hw + fr + 8 : x - hw - fr - 8, y, fr, sel ? 'filled' : 'empty');
      }
      if (!sel) return;
      // the confirm replaces the hint, because it is the more urgent sentence
      const line = G.pauseConfirm === it.id ? t('pm_confirm') : it.hint;
      if (!line) return;
      const col = G.pauseConfirm === it.id ? '#ffd76a' : '#9fb8c8';
      if (PL.cols === 2) {
        // two columns: the hint has its own line under both, never on a row
        wrapLines(c, line, 820, '700 14px "Segoe UI", Tahoma, sans-serif').slice(0, 2)
          .forEach((l, k, a) => ftxt(l, 480, 494 - (a.length - 1) * 9 + k * 18, 14, col));
      } else {
        // the sub-line goes ABOVE the row near the foot of the list, where below
        // is the next row's plate rather than empty space
        const sy = y + step * (i >= pm.length - 2 ? -0.5 : 0.52);
        ftxt(line, 480, sy, 12, col);
      }
    });
    drawFooter(522, true);
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
    const rtl = typeof isRTL === 'function' ? isRTL() : LANG === 'ar';
    const px = rtl ? 744 : 152;                    // the 64-wide bust
    // A NOTE HAS NO SPEAKER (js/overlay.js storyNote): the narrator's card
    // takes the whole width and no face is put on it.
    const note = !!d.note;
    const tw = note ? DLG_NOTE_W : DLG_W, tx0 = note ? 480 - DLG_NOTE_W / 2 : (rtl ? 176 : 236);
    // THE PAGE, NOT THE LINE. The line is wrapped to this column and cut into
    // pages of at most DLG_LINES (js/overlay.js), and the page types itself
    // out — so the box is sized from the whole page, never from the part
    // typed so far, and does not grow under the reader's eye.
    const view = dialogView(d), body = view.page;
    const lh = d.rs ? 25 : 28;
    const gh = d.rs ? 26 : 0;                      // the glyph row's own band
    const bh = Math.max(note ? 96 : 118, (note ? 40 : 62) + gh + body.length * lh + 26);
    const by = 504 - bh;                           // grows upward, foot stays put
    dimPanel(140, by, 680, bh);
    // THE SHOT this line is said over (js/opening.js OP_SHOT): a small framed
    // picture standing on the box, over the speaker's side
    if (typeof drawDlgShot === 'function') drawDlgShot(d, rtl ? 820 - DLG_SHOT_W : 140, by);
    if (d.points && d.points[d.i] === 'ring') drawHudPointer(38, 66);
    // 64×64 portrait bust — face acting the sprite is too small to carry
    if (!note) {
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
      // ...AND WHEN IT IS A POWER, THE PICTURE MOVES. A jetpack drawn as a
      // still object says what she was given; the same window the skill tree
      // uses says what it DOES, which is the owner's ask in one breath with
      // the tree: "the same goes with the upgrades I would get when beating
      // the bosses — the jet, the slash, getting the new sword". Same
      // component, same scripts (js/riddles.js), so a power reads the same way
      // wherever the game offers it.
      if (d.demo && typeof drawSkillDemo === 'function' && typeof demoScript === 'function'
          && demoScript(d.demo)) {
        drawSkillDemo(c, px - 4, by + 8, 132, 100, d.demo, performance.now() / 1000);
        bustDrawn = true;
      } else if (d.art) {
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
      // A LOADOUT HANDOVER SHOWS ITS SYSTEM (js/loadout.js): the arm's hex,
      // the crest's diamond, the relic's seal — the frame it will wear on
      // every screen from now on, and the system's name under it.
      if (d.lo && !bustDrawn && typeof drawLoadoutCard === 'function') { drawLoadoutCard(c, d, px, by + 14); bustDrawn = true; }
      // GRAVEHORN speaks with his own face (js/gravehorn.js ghPortrait)
      if (d.gh && !bustDrawn && typeof ghPortrait === 'function') { ghPortrait(c, px, by + 14, 64); bustDrawn = true; }
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
    if (!note) ftxt(d.name || '', rtl ? tx0 + tw : tx0, by + 25, 19,
      d.lo && typeof LOADOUT_COL !== 'undefined' && LOADOUT_COL[d.lo] ? LOADOUT_COL[d.lo] : '#37ffd0', rtl ? 'right' : 'left');
    let ty = note ? by + 22 : by + 46;
    if (d.rs) { drawGlyphText(c, d.rs, tx0 + tw / 2, ty, 10, 'rgba(120,220,255,0.65)', 'rgba(120,220,255,0.4)'); ty += gh; }
    // Arabic is set from the right edge and typed a whole word at a time
    // (js/reveal.js), so its letters are always joined as they will finally be
    // 21 px, not 16: on a phone the 960-wide frame is drawn at about two
    // thirds, so 16 arrived as 11 px — owner, 2026-10-30: "very small, barely
    // readable". The page is wrapped and paginated at this size (dlgFont).
    const fs = d.rs ? 19 : 21;
    c.font = '600 ' + fs + 'px "Segoe UI", Tahoma, sans-serif';
    drawRevealLines(c, view.R, rtl ? tx0 + tw : tx0, ty + 12, lh, rtl ? 'right' : 'left',
      (str, x, y, al) => ftxt(str, x, y, fs, '#e6eef6', al, null, '600'));
    // the prompt appears only once the page is whole — a ▼ under half a
    // sentence invites the press that would skip the other half
    if (view.done) {
      const pu = 0.55 + Math.sin(performance.now() / 260) * 0.35;
      c.save(); c.globalAlpha = pu;
      ftxt(view.more ? '▼' : '■', 480, 494, 13, '#9fb8c8');
      c.restore();
      if (view.pages.length > 1) {
        for (let k = 0; k < view.pages.length; k++) {
          c.fillStyle = k === d.pg ? '#37ffd0' : 'rgba(180,205,220,0.3)';
          c.beginPath(); c.arc((rtl ? 160 + (view.pages.length - 1 - k) * 10 : 800 - (view.pages.length - 1 - k) * 10), 494, k === d.pg ? 3 : 2.2, 0, 7); c.fill();
        }
      }
    }
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
  } else if (st === 'FILMS') {
    drawFilms();
  } else if (st === 'PANELLIST') {
    drawPanelList();
  } else if (st === 'SHOP') {
    drawShop();
  } else if (st === 'FERRY') {
    k2FerryDraw();
  } else if (st === 'TREE') {
    drawTree();
  } else if (st === 'SKILLS') {
    drawSkills();
  } else if (st === 'RELICS') {
    drawRelics();
  } else if (st === 'TRIAL') {
    drawTrial();
  }
  // a refusal said while a menu is open is said ON the menu (js/overlay.js)
  if (typeof drawMenuMsg === 'function') drawMenuMsg();
  // LAST, OVER EVERYTHING, AND ONLY WHEN THE URL ASKED FOR IT. See js/diag.js:
  // the panel exists because three faults in a row were reported off a phone
  // and could not be reproduced here, and a guess about somebody else's device
  // cost an evening and shipped a regression.
  if (typeof drawDiag === 'function') drawDiag();
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
  mediaFetch('introS1', true);
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
  // THE OPENING DOES NOT HAND BACK TO THE MENU LOOP. Measured (docs/ACT_ONE.md):
  // forty-six seconds of the `intro` score, and then the difficulty picker
  // snapped the room back to `title` — the last thing a player hears before
  // gameplay was the tune from before the film. The reel's own theme carries
  // through the ONE choice that follows it and hands over to the kingdom when
  // the run starts. Backing out to the menu proper still takes the menu's tune.
  if (G.state !== 'PLAY' && G.afterCine !== 'DIFF') setMusic('title');
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
  // THE CAPTION IS READ BEFORE THE SHOT MOVES (owner, 2026-10-09: no unread
  // paragraph disappears on a timer). The held stills no longer turn by
  // themselves; the first press finishes typing the caption, a later one turns
  // the shot — the same rule as every dialogue (js/overlay.js capPress).
  const cap = INTRO_FILM[ci.i] && INTRO_FILM[ci.i][1];
  if (cap && typeof capReader === 'function') {
    if (!ci.cr || ci.crI !== ci.i) { ci.cr = capReader(t(cap)); ci.crI = ci.i; }
    capTick(ci.cr, dt);
  }
  if (next && ci.cr && typeof capPress === 'function' && capPress(ci.cr)) return;
  if (next) { sfx('ui'); ci.i++; ci.t = 0; }
  else if (prev && ci.i > 0) { sfx('ui'); ci.i--; ci.t = 0; }
  else if (ci.t > CINE_HOLD && !cap) { ci.i++; ci.t = 0; }
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
  // reduced motion: the still is held, not panned (js/reveal.js reduceMotion)
  if (typeof reduceMotion === 'function' && reduceMotion()) k = 0.5;
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
  if (cap && ci.cr && ci.crI === ci.i && typeof drawCaption === 'function') {
    // it stays until the shot is turned — see updateCine
    drawCaption(ci.cr, clamp(ci.t / 0.5, 0, 1));
  } else if (cap) {
    const a = clamp(ci.t / 0.7, 0, 1) * clamp((CINE_HOLD - ci.t) / 0.5, 0, 1);
    if (a > 0.01) {
      c.save(); c.globalAlpha = a;
      const txt = t(cap);
      c.font = '600 22px "Segoe UI", Tahoma, sans-serif';
      const w2 = Math.min(900, c.measureText(txt).width + 40);
      const g2 = c.createLinearGradient(0, 432, 0, 500);
      g2.addColorStop(0, 'rgba(4,8,12,0)'); g2.addColorStop(0.5, 'rgba(4,8,12,0.72)');
      g2.addColorStop(1, 'rgba(4,8,12,0)');
      c.fillStyle = g2; c.fillRect(480 - w2 / 2 - 30, 432, w2 + 60, 68);
      ftxt(txt, 480, 468, Math.min(22, 22 * 860 / Math.max(1, c.measureText(txt).width)), '#eaf4ff', 'center', 'rgba(0,0,0,0.85)', '600');
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
    ftxt(t('gate_next'), 480, 524, 15, '#9fb8c8', 'center');
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
    case 'kerf': {    // THE LAST CUTTER — a heavy lapidary with no ears
      // WHAT THE SILHOUETTE HAS TO SAY AT FORTY PIXELS, in order: she is
      // heavy and low, she has NOTHING TO HEAR WITH, and she is holding
      // something that is burning. Everything below serves those three.
      //
      // Two passes were thrown away getting here and both failures are worth
      // writing down, because they are the standing traps for a body at this
      // size. The first drew her in the chassis greys she is actually made of
      // and she vanished into a dark floor — ART_BIBLE §9.4, the reserved
      // chroma belongs to the cast, so she carries her own light now and the
      // light is the work she is doing. The second smoothed her into a dome
      // with a separate cap on top and she read as a MUSHROOM: a body with no
      // FRONT has no head for an ear to be missing from, and "no ears" says
      // nothing until there is somewhere they could have been.
      //
      // So she has a front. A blunt eyeless prow runs forward and down out of
      // a wedge shell, one wide optic bar recessed into it — and above that
      // prow, where every other machine in this cast carries a cowl, a dish or
      // an antenna, there is nothing at all. She is not idling when the player
      // finds her, she is WORKING: a slow bow stroke across the crystal
      // clamped in front of her, and the crystal answering it.
      // SHE IS BUILT AT 1.5, from the feet up. The owner's standing ruling on
      // the cast — "the npc is too small, it should be double my size" — is
      // why Ratchet's atlas sits at 2.6, and a body drawn at hitbox scale
      // stands SHORTER than the cat. Kerf is deliberately low-slung, so she
      // does not need the trader's height; she needs his WEIGHT, and the
      // scale is from y=0 so her feet stay on the floor while she gets it.
      c.save(); c.scale(1.5, 1.5);
      const br = Math.sin(tn * 1.5) * 0.6;
      // the stroke: slow, one-directional, with a pause at the far end — a saw
      // cut is a push and a wait, never a scrub
      const ph = (tn * 0.42) % 1;
      const stroke = ph < 0.72 ? Math.sin(ph / 0.72 * Math.PI) : 0;
      const JX = 28, JY = -13;                          // where the crystal sits
      ao(0, 22, 0.32);
      // the work's own light, laid down first so the whole body sits inside it
      c.save(); c.globalCompositeOperation = 'lighter';
      const aur = c.createRadialGradient(JX, JY, 2, JX, JY, 24 + stroke * 12);
      aur.addColorStop(0, 'rgba(234,246,255,' + (0.3 + stroke * 0.34) + ')');
      aur.addColorStop(0.5, 'rgba(234,246,255,' + (0.08 + stroke * 0.12) + ')');
      aur.addColorStop(1, 'rgba(234,246,255,0)');
      c.fillStyle = aur;
      c.beginPath(); c.arc(JX, JY, 24 + stroke * 12, 0, 7); c.fill();
      c.restore();
      // four braced legs with real feet — bowed, planted, never posts
      for (const lx of [-16, -8, 3, 11]) {
        c.strokeStyle = '#4a3d49'; c.lineWidth = 4.2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(lx * 0.8, -13);
        c.quadraticCurveTo(lx * 1.16, -6, lx, -1.8); c.stroke();
        c.fillStyle = '#2b232c';
        c.beginPath(); c.ellipse(lx, -1.2, 4.4, 1.9, 0, 0, 7); c.fill();
      }
      // THE SHELL: a wedge — tall and round over the haunches at the back,
      // running down and forward to the prow. A body with a direction.
      const shell = () => {
        c.beginPath();
        c.moveTo(-21, -12);
        c.bezierCurveTo(-24, -25 - br, -18, -34 - br, -7, -35 - br);
        c.bezierCurveTo(3, -36 - br, 11, -31 - br, 14, -25 - br);
        c.quadraticCurveTo(16, -19, 13, -14.5);
        c.quadraticCurveTo(-3, -10.5, -21, -12);
        c.closePath();
      };
      c.save(); shell(); c.clip();
      c.fillStyle = lin(-21, -37, 15, -10, [[0, '#a08ea0'], [0.36, '#6f5f70'], [0.8, '#3e3441'], [1, '#251f29']]);
      c.fillRect(-25, -39, 44, 32);
      // CUT PLANES, not a smooth casting. She is a lapidary and her own
      // chassis is chiselled: three long facet edges over the haunches,
      // each catching a different amount of the work light.
      for (let i = 0; i < 3; i++) {
        c.strokeStyle = 'rgba(234,246,255,' + (0.16 - i * 0.04) + ')'; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(-22, -30 + i * 6.5 - br);
        c.quadraticCurveTo(-6, -33 + i * 6.8 - br, 14, -26 + i * 5.4 - br); c.stroke();
      }
      // crystal dust in the seams — she is the colour of the stuff she cuts,
      // in the places she cannot reach
      c.fillStyle = 'rgba(234,246,255,0.13)';
      for (let i = 0; i < 9; i++) {
        // scattered, not spaced: a row of evenly pitched dots is rivets
        const gx3 = -20 + i * 4.4 + Math.sin(i * 12.9) * 2.6;
        const gy3 = -14 - Math.abs(Math.sin(i * 7.3)) * 14 - br;
        c.beginPath(); c.arc(gx3, gy3, 0.8 + Math.abs(Math.sin(i * 3.1)) * 0.7, 0, 7); c.fill();
      }
      c.restore();
      // the top edge takes the light: a rim ALONG the shoulder line only. A
      // stroke across her middle reads as a scratch, which is what the last
      // pass drew.
      // ...and it traces the SHELL'S OWN top curve, not a hand-typed copy of
      // it. A second set of control points a pixel or two out draws a line
      // floating off her back, which at this size reads as an antenna — on
      // the one body in the game whose entire point is not having one.
      c.save(); shell(); c.clip();
      c.strokeStyle = 'rgba(234,246,255,' + (0.4 + stroke * 0.3) + ')'; c.lineWidth = 3;
      shell(); c.stroke();
      c.restore();
      // ---- THE PROW: her head, and the shape of the whole idea. Blunt,
      // eyeless, jutting forward and DOWN off the front of the shell, with a
      // clean empty curve over the top of it where the ears are not.
      c.fillStyle = lin(8, -30, 24, -14, [[0, '#8d7b8d'], [0.6, '#5a4c5c'], [1, '#372e3a']]);
      c.beginPath();
      c.moveTo(9, -29 - br);
      c.quadraticCurveTo(20, -28 - br, 23, -22 - br);
      c.quadraticCurveTo(25, -17.5 - br, 20, -14.5 - br);
      c.quadraticCurveTo(14, -12.5 - br, 10, -15 - br);
      c.closePath(); c.fill();
      // the optic: a DARK RECESS with a bright bar in it. Contrast is what
      // survives the shrink, so the socket does as much work as the light.
      c.fillStyle = '#1b151f';
      c.beginPath(); c.moveTo(11.5, -24.5 - br);
      c.quadraticCurveTo(18, -25.5 - br, 22, -21.5 - br);
      c.quadraticCurveTo(18, -18.5 - br, 11.5, -19.5 - br);
      c.closePath(); c.fill();
      const op = 0.78 + Math.sin(tn * 0.9) * 0.14;
      c.save();
      c.fillStyle = 'rgba(234,246,255,' + (blink ? 0.12 : op) + ')';
      c.shadowColor = '#eaf6ff'; c.shadowBlur = blink ? 0 : 8;
      c.beginPath(); c.moveTo(12.5, -23.4 - br);
      c.quadraticCurveTo(18, -24 - br, 20.6, -21.4 - br);
      c.quadraticCurveTo(18, -19.8 - br, 12.5, -20.6 - br);
      c.closePath(); c.fill();
      c.restore();
      // ---- THE WORK. The jig arm reaches out under the prow and holds the
      // seam; the bow draws across it.
      c.strokeStyle = '#5b4d59'; c.lineWidth = 3.6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(11, -15); c.quadraticCurveTo(20, -13, JX - 2, JY); c.stroke();
      c.fillStyle = '#4a3d49';                                    // the clamp
      c.beginPath(); c.moveTo(JX - 6, JY + 3); c.quadraticCurveTo(JX - 2, JY - 4, JX + 5, JY + 1);
      c.quadraticCurveTo(JX + 2, JY + 5, JX - 6, JY + 3); c.closePath(); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter';           // the seam in it
      c.fillStyle = 'rgba(255,255,255,' + (0.55 + stroke * 0.45) + ')';
      c.shadowColor = '#eaf6ff'; c.shadowBlur = 10 + stroke * 12;
      c.beginPath(); c.moveTo(JX - 4, JY - 1); c.lineTo(JX, JY - 6.5); c.lineTo(JX + 4, JY - 0.5);
      c.lineTo(JX, JY + 2); c.closePath(); c.fill();
      c.shadowBlur = 0; c.restore();
      // the bow: a curved frame with a slack wire, travelling across the cut
      const dx = -4 + stroke * 11;
      c.save(); c.translate(dx, 0);
      c.strokeStyle = '#7d6b7c'; c.lineWidth = 2.8;
      c.beginPath(); c.moveTo(JX - 13, JY - 13); c.quadraticCurveTo(JX + 2, JY - 18, JX + 8, JY - 5); c.stroke();
      c.strokeStyle = 'rgba(234,246,255,0.8)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(JX - 13, JY - 13); c.quadraticCurveTo(JX - 2, JY - 8, JX + 8, JY - 5); c.stroke();
      c.restore();
      // her other arm on the bow, bent — the elbow leads the stroke
      c.strokeStyle = '#5b4d59'; c.lineWidth = 3.2;
      c.beginPath(); c.moveTo(6, -20); c.quadraticCurveTo(14 + dx * 0.5, -24, JX - 12 + dx, JY - 12); c.stroke();
      // the grit the cut throws, and only while the stroke is moving
      if (stroke > 0.25) {
        c.save(); c.globalCompositeOperation = 'lighter';
        c.globalAlpha = (stroke - 0.25) * 0.85;
        c.strokeStyle = '#ffffff'; c.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const a2 = -0.35 - i * 0.3;
          c.beginPath(); c.moveTo(JX, JY - 2);
          c.lineTo(JX + Math.cos(a2) * (8 + i * 3), JY - 2 + Math.sin(a2) * (8 + i * 3)); c.stroke();
        }
        c.restore(); c.globalAlpha = 1;
      }
      c.restore();                                       // her 1.5 build scale
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
    case 'kerf': {    // the Last Telchine — the smiths who cut the gods' weapons
      // SHE FACES HER WORK, and her work faces the player. drawHeroNPC is
      // called already flipped toward the cat, so +x is the way she is
      // looking: the block goes there. The first pass put it behind her left
      // shoulder, which drew a smith hammering over her own back.
      const sc = Math.abs(Math.sin(tn * 3.2)) * 3.4;     // the hammer coming down
      // the block she is working, bedded on the ground clear of her skirts
      c.fillStyle = '#6b675e';
      c.beginPath(); c.moveTo(16, 0); c.quadraticCurveTo(14, -12, 22, -14.5);
      c.quadraticCurveTo(30, -15, 29, 0); c.closePath(); c.fill();
      c.fillStyle = '#c9c4b4';                            // the cut face, pale
      c.beginPath(); c.moveTo(19, -9); c.quadraticCurveTo(23, -13.5, 27, -8.5);
      c.quadraticCurveTo(23, -6.5, 19, -9); c.closePath(); c.fill();
      // squat and wide: the Telchines were sea-smiths, low over their work
      robe(0, 25, 21 + br, '#5e5a52', '#45423b');
      c.fillStyle = '#7a6a4e';                            // the stone apron
      c.beginPath(); c.moveTo(-8, -16 - br); c.lineTo(9, -16 - br);
      c.quadraticCurveTo(8, -5, 0, -4); c.quadraticCurveTo(-7, -5, -8, -16 - br);
      c.closePath(); c.fill();
      head(2, -25 - br, 6.8, '#c8a882');
      // NO EAR, AND NOTHING BESIDE IT. A bound head-cloth pulled flat across
      // the temples — a low band over the crown, never a hood over the face:
      // she was born without hearing, that deafness is the only reason the
      // singers never took her, and the silhouette has to say it while the
      // face stays a face.
      c.fillStyle = '#8f8880';
      c.beginPath(); c.arc(2, -26 - br, 7.2, Math.PI * 0.98, Math.PI * 0.02); c.fill();
      c.fillRect(-5, -27.6 - br, 14.4, 3.4);
      c.fillStyle = '#2a2a30';
      c.fillRect(3.4, -24.6 - br, 2, 2); c.fillRect(7, -24.6 - br, 2, 2);
      // ---- the work, both hands, kept clear of her face: the chisel held to
      // the block and the hammer swinging down onto it
      c.strokeStyle = '#5c5346'; c.lineWidth = 2.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(7, -14); c.quadraticCurveTo(13, -13, 17, -10); c.stroke();
      c.strokeStyle = '#8a8ea0'; c.lineWidth = 1.8;       // the chisel itself
      c.beginPath(); c.moveTo(17.5, -10); c.lineTo(21, -8.5); c.stroke();
      c.strokeStyle = '#5c5346'; c.lineWidth = 2.6;       // the hammer arm
      c.beginPath(); c.moveTo(4, -16); c.quadraticCurveTo(11, -17 - sc, 15, -15 - sc); c.stroke();
      c.fillStyle = '#8a8ea0';
      c.beginPath(); c.ellipse(17.5, -15 - sc, 3.6, 2.5, 0.3, 0, 7); c.fill();
      // chips off the cut, at the moment of the blow
      if (sc < 0.6) {
        c.strokeStyle = 'rgba(240,236,222,0.75)'; c.lineWidth = 1;
        for (let k = 0; k < 3; k++) {
          const a2 = -1.0 + k * 0.42;
          c.beginPath(); c.moveTo(21, -9);
          c.lineTo(21 + Math.cos(a2) * 6.5, -9 + Math.sin(a2) * 6.5); c.stroke();
        }
      }
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
    // 17 actions (GRAPPLE joined) make nine rows a column: 31 px keeps row 9 clear of the footer at 412
    const x = 140 + col * 372, y = 142 + row * (colH > 8 ? 31 : 34);   // 15 rows now (RUN joined): 34 px pitch keeps row 8 clear of the footer text
    const sel = i === G.padIdx;
    const btn = PAD.map[a];
    const live = btn >= 0 && PAD.down[btn];
    if (sel) {
      c.fillStyle = 'rgba(55,255,208,0.10)'; rr(c, x - 16, y - 15, 344, 30, 8); c.fill();
      c.strokeStyle = '#37ffd0'; c.lineWidth = 1.6; rr(c, x - 16, y - 15, 344, 30, 8); c.stroke();
    }
    ftxt(t('pa_' + a), x, y, 15, sel ? '#eef3fa' : '#9fb8c8', 'left');
    const bx = x + 246, listening = PAD.listen === a;
    c.fillStyle = listening ? 'rgba(255,215,106,0.22)' : live ? 'rgba(55,255,208,0.30)' : 'rgba(20,32,44,0.9)';
    rr(c, bx, y - 13, 88, 26, 7); c.fill();
    c.strokeStyle = listening ? '#ffd76a' : live ? '#37ffd0' : 'rgba(120,150,170,0.5)';
    c.lineWidth = live || listening ? 2 : 1.2; rr(c, bx, y - 13, 88, 26, 7); c.stroke();
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
// THE MAP IS THE GROUND'S OWN SHAPE (owner, 2026-11-16: "this map is straight
// lines instead of following the natural curves of the terrain... just like
// Hollow Knight" — and: "these shapes in the map, they're pixelated instead of
// smooth terrains"). A room was drawn two pixels a tile with smoothing OFF and
// stretched to its cells: a chart of staircases in a box. Each room is now
// drawn from its AIR — the cavity she can actually be in — six pixels a tile,
// softened and cut back to a clean edge, so a floor that rolls is a line that
// rolls and a cave is the shape of the cave. The rock is not filled at all:
// what is on the chart is where she can go, and the line round it. Where a
// room opens onto its neighbour the cavity runs off the edge of its cells and
// meets the next one, with no frame between.
const MINI_S = 6;
function roomMini(id) {
  if (miniCache[id]) return miniCache[id];
  const def = ROOMS[id], g = buildRoom(id), P = PAL[def.zone], s = MINI_S;
  const Wt = def.w, Ht = g.length, W = Wt * s, H = Ht * s;
  const mc = document.createElement('canvas');
  mc.width = W; mc.height = H;
  const m = mc.getContext('2d');
  const solid = (tx, ty) => { tx = Math.max(0, Math.min(Wt - 1, tx)); ty = Math.max(0, Math.min(Ht - 1, ty)); const ch = g[ty][tx]; return ch === '#' || ch === 'B'; };
  // air = 1, rock = 0, then a box blur twice (edges replicated, so an opening
  // at the room's edge stays open) — the soft field the edge is cut from
  let a = new Float32Array(W * H);
  // ...read through a slow wander of about a third of a tile, seeded by the
  // room's name: a wall the grid can only say as a ruled line comes out as a
  // line a hand drew. Small enough that no ledge moves a tile and no gap shuts.
  let hsh = 7; for (let k = 0; k < id.length; k++) hsh = (hsh * 31 + id.charCodeAt(k)) % 9973;
  const p1 = hsh * 0.37, p2 = hsh * 0.71, amp = s * 0.36;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const wx = amp * (Math.sin(y * 0.071 + p1) + 0.6 * Math.sin(y * 0.173 + x * 0.031 + p2));
    const wy = amp * (Math.sin(x * 0.063 + p2) + 0.6 * Math.sin(x * 0.157 + y * 0.029 + p1));
    a[y * W + x] = solid(Math.floor((x + wx) / s), Math.floor((y + wy) / s)) ? 0 : 1;
  }
  const blur = (src) => { const r = 3, tmp = new Float32Array(W * H), out = new Float32Array(W * H);
    for (let y = 0; y < H; y++) { let acc = 0; for (let k = -r; k <= r; k++) acc += src[y * W + Math.max(0, Math.min(W - 1, k))];
      for (let x = 0; x < W; x++) { tmp[y * W + x] = acc / (2 * r + 1); acc += src[y * W + Math.min(W - 1, x + r + 1)] - src[y * W + Math.max(0, x - r)]; } }
    for (let x = 0; x < W; x++) { let acc = 0; for (let k = -r; k <= r; k++) acc += tmp[Math.max(0, Math.min(H - 1, k)) * W + x];
      for (let y = 0; y < H; y++) { out[y * W + x] = acc / (2 * r + 1); acc += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; } }
    return out; };
  a = blur(blur(a));
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const fill = hex(P.dark), edge = hex(P.edge);
  const id2 = m.createImageData(W, H), d = id2.data;
  for (let k = 0; k < W * H; k++) {
    const v = a[k];
    const inside = Math.max(0, Math.min(1, (v - 0.44) / 0.12));          // the cavity
    const rim = Math.max(0, 1 - Math.abs(v - 0.5) / 0.13);               // the line round it
    const o = k * 4;
    d[o] = fill[0] + (edge[0] - fill[0]) * rim; d[o + 1] = fill[1] + (edge[1] - fill[1]) * rim; d[o + 2] = fill[2] + (edge[2] - fill[2]) * rim;
    d[o + 3] = Math.round(255 * Math.max(inside * 0.62, rim * 0.95));
  }
  m.putImageData(id2, 0, 0);
  // what stands in the cavity: a platform is a short solid bar, a rail of teeth is red
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
    const ch = g[y][x];
    if (ch === '=') { m.fillStyle = P.edge; m.globalAlpha = 0.9; m.fillRect(x * s, y * s + 1, s, 2); }
    else if (ch === '^') { m.fillStyle = '#ff6a7a'; m.globalAlpha = 0.95; m.fillRect(x * s + 1, y * s + s - 2, s - 2, 2); }
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
  // THE MAP IS ONE PIECE OF GROUND (owner, 2026-09-05: "the map should
  // actually show the terrain... continuous with a minor separation that
  // differentiates rooms from each other, because the concept is it's an open
  // world where you can move from one room to another. It's not separated by
  // a wall anymore.")
  //
  // It used to draw each room as a framed card — inset 3 px, rounded, the
  // terrain letterboxed inside it with a route line between the cards — which
  // is a chart of BOXES, and boxes say "separate places" whatever is painted
  // in them. Now the rooms tile edge to edge, the terrain is stretched to fill
  // its cells so a floor at row 15 of 18 meets the same floor next door, and
  // the only thing between two rooms is a hairline seam. The route lines stay
  // only for the pairs that do NOT touch on the board — a depth door into a
  // cave network, a gate — because there the line is the information.
  const rectFor = id => {
    const [gx, gy, w, h] = MAPPOS[id];
    return { x: ox + gx * cell, y: oy + gy * cell, w: w * cell, h: h * cell };
  };
  const touching = (a, b) =>
    (Math.abs(a.x + a.w - b.x) < 1 || Math.abs(b.x + b.w - a.x) < 1) && a.y < b.y + b.h && b.y < a.y + a.h
    || (Math.abs(a.y + a.h - b.y) < 1 || Math.abs(b.y + b.h - a.y) < 1) && a.x < b.x + b.w && b.x < a.x + a.w;
  // the ground first, every visited room's terrain filling its own cells —
  // and, fainter, every room a restored survey pod has CHARTED for her
  // (js/progress.js: the quarrymen's pod in CV1B)
  for (const id in MAPPOS) {
    const charted = !G.save.visited[id] && G.save.charted && G.save.charted[id];
    if (!G.save.visited[id] && !charted) continue;
    const rc = rectFor(id);
    if (charted) c.globalAlpha = 0.45;
    const mc = roomMini(id);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(mc, rc.x, rc.y, rc.w, rc.h);
    // the room she is standing in is LIT — the same shape, again, as light
    if (id === G.roomId) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.12 * Math.sin(performance.now() / 420); c.drawImage(mc, rc.x, rc.y, rc.w, rc.h); c.globalCompositeOperation = 'source-over'; }
    c.globalAlpha = 1;
  }
  // routes only where the board leaves a gap between two connected rooms
  c.strokeStyle = 'rgba(140,200,230,0.35)'; c.lineWidth = 3;
  for (const id in MAPPOS) {
    if (!G.save.visited[id]) continue;
    const ex = ROOMS[id].exits || {};
    for (const side in ex) {
      let d = ex[side]; if (typeof d === 'object') d = d.to;
      if (!G.save.visited[d] || d < id || !MAPPOS[d]) continue;
      const a = rectFor(id), b = rectFor(d);
      if (touching(a, b)) continue;
      c.beginPath(); c.moveTo(a.x + a.w / 2, a.y + a.h / 2); c.lineTo(b.x + b.w / 2, b.y + b.h / 2); c.stroke();
    }
  }
  // the seams and the signs
  for (const id in MAPPOS) {
    if (!G.save.visited[id]) continue;
    const P = PAL[ROOMS[id].zone], rc = rectFor(id);
    const mx = rc.x, my = rc.y, mw = rc.w, mh = rc.h;
    // a hairline in the zone's own edge colour: enough to count rooms by,
    // never enough to read as a wall
    // (no frame round a room: the cavity's own line is the room, and where two
    // rooms meet there is nothing between them to draw)
    // every room with a pod in it: the map is where she looks for the way back to one
    if (BENCH_ROOMS.indexOf(id) >= 0 || ROOMS[id].ents.some(e => e[0] === 'bench'))
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
      // YOU ARE HERE, AND IT CANNOT BE MISSED (owner, 2026-11-16: "find a
      // better indicator on the map to show where I am. I'm confused. I have no
      // idea where I am right now"). It was a 3.5 px dot and a white box round
      // the room. It is her own head now — the helmet and its two ear fins —
      // held at one size on screen however far the chart is zoomed, inside a
      // ring that beats outward, under a chevron and the words.
      const k = 1 / mapView.z, tt = performance.now() / 1000, beat = (tt * 0.9) % 1;
      c.save(); c.translate(relx, rely - 6 * k); c.scale(k, k);
      c.strokeStyle = 'rgba(120,236,255,' + (0.9 * (1 - beat)).toFixed(3) + ')'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(0, 0, 12 + beat * 26, 0, 7); c.stroke();
      c.strokeStyle = 'rgba(120,236,255,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 14, 0, 7); c.stroke();
      c.fillStyle = '#f4f8fc';
      c.beginPath(); c.moveTo(-8, -5); c.lineTo(-7, -13); c.lineTo(-2, -8); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(8, -5); c.lineTo(7, -13); c.lineTo(2, -8); c.closePath(); c.fill();
      c.beginPath(); c.arc(0, 0, 8.5, 0, 7); c.fill();
      c.fillStyle = '#0c1620'; rr(c, -6, -3, 12, 6.5, 3); c.fill();
      c.fillStyle = '#5ff0ff'; c.fillRect(-4, -1, 2.4, 2.6); c.fillRect(1.6, -1, 2.4, 2.6);
      const bob = Math.sin(tt * 4) * 2;
      c.fillStyle = '#7de8ff'; c.beginPath(); c.moveTo(-6, -24 + bob); c.lineTo(6, -24 + bob); c.lineTo(0, -17 + bob); c.closePath(); c.fill();
      c.restore();
      ftxt(t('map_here'), relx, rely - 42 * k, Math.max(8, 12 * k), '#bff4ff', 'center', '#0a1016');
    }
  }
  // WHERE SHE IS HEADED: the errand's room wears a gold mark, visited or not —
  // the same room the pointer in the world is leading her to (pgGoalRoom)
  if (typeof progressGoal === 'function' && typeof pgGoalRoom === 'function') {
    let gid = null; try { const gk = progressGoal(G.save.flags); gid = gk ? pgGoalRoom(gk, G.save.flags) : null; } catch (e) {}
    if (gid && MAPPOS[gid]) {
      const rc = rectFor(gid), k = 1 / mapView.z, tt = performance.now() / 1000, gx = rc.x + rc.w / 2, gy = rc.y + rc.h / 2;
      c.save(); c.translate(gx, gy); c.scale(k, k); c.rotate(Math.PI / 4);
      const pu = 0.65 + 0.35 * Math.sin(tt * 3.2);
      c.strokeStyle = 'rgba(255,215,106,' + pu.toFixed(3) + ')'; c.lineWidth = 2.5; c.strokeRect(-9, -9, 18, 18);
      c.fillStyle = 'rgba(255,215,106,' + (0.35 + 0.3 * pu).toFixed(3) + ')'; c.fillRect(-5, -5, 10, 10);
      c.restore();
      if (gid !== G.roomId) ftxt(t('map_goal'), gx, gy + 24 * k, Math.max(8, 11 * k), '#ffe9a8', 'center', '#0a1016');
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
  ftxt('◎ ' + t('map_here') + '   ◇ ' + t('map_goal') + '   ◆ ' + t('rest').replace(/^(E|\{INT\}) — /, '') + '   ☠ ' + t('map_boss') + '   ⚙ ' + t('map_shop') + '   ∩ ' + t('map_cave'), 480, 502, 13, '#7d93a8');
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
  if (!isHero()) return drawGear();
  c.fillStyle = 'rgba(4,7,12,0.85)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('crest_title'), 480, 50, 28, '#eef3fa', 'center', LOADOUT_COL.crest);
  const used = G.save.equip.reduce((s, x) => s + CRESTS[x], 0);
  // sockets — the crest's own diamond (js/loadout.js): seated ones filled,
  // the free width of the port dashed
  for (let i = 0; i < effSlots(); i++) {
    const x = 480 - (effSlots() - 1) * 14 + i * 28;
    drawLoadoutFrame(c, 'crest', x, 92, 10, i < used ? 'filled' : 'empty');
  }
  ftxt(t('crest_slots') + '  ' + used + ' / ' + effSlots(), 480, 124, 14, '#8aa2b5');
  const list = G.save.crests;
  if (!list.length) {
    // an empty screen is where the question gets asked, so it is where the
    // answer lives: what a crest is, and where the seals are
    wrapText(t('crest_lore'), 640, 15).forEach((ln, i) => ftxt(ln, 480, 210 + i * 22, 15, '#9fb8c8'));
    wrapText(t('crest_none'), 640, 15).forEach((ln, i) => ftxt(ln, 480, 330 + i * 22, 15, '#7d93a8'));
    return;
  }
  // ...and one line of it stays under the port for the players who skipped the card
  ftxt(t('crest_port'), 480, 146, 12, '#5f7488');
  list.forEach((id, i) => {
    const sel = i === G.crestIdx, eq = G.save.equip.indexOf(id) >= 0;
    const y = 170 + i * 40, ar = LANG === 'ar';
    if (sel) { c.fillStyle = loadoutRGBA('crest', 0.12); rr(c, 180, y - 17, 430, 34, 8); c.fill(); }
    // the diamond replaces the ◈/◇ glyph that used to say seated/unseated:
    // the same two states, now in the crest's frame and hue
    drawLoadoutFrame(c, 'crest', ar ? 592 : 198, y, 11, eq ? 'filled' : 'empty');
    ftxt(t('c_' + id), ar ? 572 : 218, y, 18, eq ? '#eef3fa' : sel ? '#eef3fa' : '#8aa2b5', ar ? 'right' : 'left');
    ftxt('▪'.repeat(CRESTS[id]), ar ? 210 : 570, y, 14, '#ffd76a', ar ? 'left' : 'right');
  });
  const cur = list[G.crestIdx];
  // the panel grew to hold the seal's fighting style (C1) and, when it is
  // worn, whether it is the one setting her style
  const note = crestStyleNote(cur);
  const body = wrapCrest(crestCardText(cur), 240, 14).slice(0, note ? 7 : 8);
  dimPanel(630, 160, 280, Math.max(140, 72 + body.length * 19 + (note ? 22 : 0)));
  ftxt(t('c_' + cur), 770, 190, 17, '#eef3fa');
  body.forEach((ln, i) => ftxt(ln, 770, 216 + i * 19, 14, '#9fb8c8'));
  if (note) ftxt(note, 770, 216 + body.length * 19 + 4, 13, '#eef3fa');
  ftxt(t('crest_hint'), 480, 512, 13, '#7d93a8');
}
function shopWhyLine(pk) {
  if (!pk) return t('shop_why_none');
  const nm = pk.it.type === 'crest' ? t('c_' + pk.it.id) : pk.it.type === 'alride' ? t('pk_n_alride')
    : pk.it.type === 'packup' && shopPackOpen() && ptNextRatchet() ? t('pk_n_' + ptNextRatchet().id) : t('s_' + pk.it.id);
  return t(pk.why).replace('{item}', nm).replace('{n}', String(pk.need || 0));
}
// the question card's two buttons, in 960x540 — the touch layer taps these
function shopAskButtons() { return [{ i: 0, x: 300, y: 318, w: 170, h: 46, key: 'shop_browse' }, { i: 1, x: 490, y: 318, w: 170, h: 46, key: 'shop_later' }]; }
function shopAskTap(sx, sy) {
  if (!G.shopAsk) return false;
  for (const b of shopAskButtons()) if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) {
    sfx('ui');
    if (b.i === 1) { G.state = 'PLAY'; G.shopAsk = false; } else { G.shopAsk = false; G.shopGuard = 0.35; G.shopArmed = false; }
    return true;
  }
  return true;                              // a tap anywhere else on the card buys nothing
}
function drawShop() {
  c.fillStyle = 'rgba(4,7,12,0.85)'; c.fillRect(0, 0, 960, 540);
  ftxt(G.shopWho === 'patch' ? t('n_patch') : t('shop_title'), 480, 50, 28, '#eef3fa', 'center', '#ffd76a');
  const pk = shopPick();
  if (G.shopAsk) {
    // THE QUESTION: why it opened, and whether she wants it
    c.fillStyle = 'rgba(12,20,28,0.96)'; rr(c, 220, 170, 520, 220, 12); c.fill();
    c.strokeStyle = 'rgba(255,215,106,0.55)'; c.lineWidth = 1.5; rr(c, 220, 170, 520, 220, 12); c.stroke();
    ftxt(t('n_' + (G.shopWho === 'patch' ? 'patch' : 'ratchet')), 480, 198, 15, '#ffd76a', 'center');
    wrapText(shopWhyLine(pk), 460, 16).slice(0, 3).forEach((ln, i) => ftxt(ln, 480, 232 + i * 22, 16, '#eef3fa', 'center', null, '600'));
    for (const b of shopAskButtons()) {
      const on = b.i === (G.shopAskIdx | 0);
      c.fillStyle = on ? 'rgba(255,215,106,0.16)' : 'rgba(255,255,255,0.04)'; rr(c, b.x, b.y, b.w, b.h, 9); c.fill();
      c.strokeStyle = on ? '#ffd76a' : 'rgba(160,180,200,0.4)'; c.lineWidth = on ? 2 : 1; rr(c, b.x, b.y, b.w, b.h, 9); c.stroke();
      ftxt(t(b.key), b.x + b.w / 2, b.y + b.h / 2 + 1, 16, on ? '#fff2cf' : '#9ab0c2', 'center');
    }
    return;
  }
  ftxt('⬢ ' + G.save.scrap, 480, 80, 17, '#ffd76a');
  ftxt(shopWhyLine(pk), 480, 104, 13, '#cfe0ee', 'center', null, '600');
  shopList().forEach((it, i) => {
    const sel = i === G.shopIdx, sold = shopSold(it);
    const y = SHOP_ROW.y0 + i * SHOP_ROW.step;
    if (pk && pk.it === it) {
      // RATCHET'S PICK: a gold bar down the row's edge and its tag, said in words
      c.fillStyle = 'rgba(255,215,106,0.10)'; rr(c, 160, y - 17, 640, SHOP_ROW.h, 8); c.fill();
      c.fillStyle = '#ffd76a'; c.fillRect(LANG === 'ar' ? 796 : 160, y - 17, 4, SHOP_ROW.h);
      ftxt('◆ ' + t('shop_pick'), 480, y - 11, 10, '#ffd76a', 'center', null, '700');
    }
    if (sel) { c.fillStyle = 'rgba(255,215,106,0.08)'; rr(c, 160, y - 17, 640, SHOP_ROW.h, 8); c.fill(); }
    let name = it.type === 'crest' ? t('c_' + it.id) : t('s_' + it.id);
    let desc = it.type === 'crest' ? t('c_' + it.id + 'd') : t('s_' + it.id + 'd');
    // a seal that changes how she fights names its style on the shelf (C1)
    if (it.type === 'crest' && CREST_ATTACK[it.id]) desc += '  ·  ' + t('cf_style') + ': ' + t('cfs_' + it.id);
    // THE PACK IS NOT A REFILL. Until it is bought the first row is the Volt
    // Pack — permanent, marked, and the only thing on the list she can buy;
    // after it, the same row is the refill it always was (js/opening.js).
    let row = typeof opShopRow === 'function' ? opShopRow(it, y, sel) : null;
    if (row) { name = row.name; desc = row.desc; }
    if (it.type === 'core' && !sold && !shopCoreOpen()) { row = Object.assign({}, row || {}, { locked: true }); desc = t('s_core_wait'); }
    if (it.type === 'volley' && !sold && !shopVolleyOpen()) { row = Object.assign({}, row || {}, { locked: true }); desc = t('s_volley_wait'); }
    if (it.type === 'packup' && !sold && !shopPackOpen()) { row = Object.assign({}, row || {}, { locked: true }); desc = t('s_packup_wait'); }
    // THE PACK LADDER's row wears the rung it sells now (js/packtree.js)
    else if (it.type === 'packup' && !sold && ptNextRatchet()) { name = t('pk_n_' + ptNextRatchet().id); desc = t('pk_n_' + ptNextRatchet().id + 'd'); }
    if (it.type === 'alride') { name = t('pk_n_alride'); desc = t('pk_n_alrided'); if (!sold && !ptRideOpen()) { row = Object.assign({}, row || {}, { locked: true }); desc = ptHarness() ? t('pk_first').replace('%s', t('pk_n_alcall')) : t('pk_harness'); } }
    const col = row && row.locked ? '#56626e' : sold ? '#5a6a78' : sel ? '#eef3fa' : '#9ab0c2';
    // WHICH SYSTEM IS THIS LINE? A crest — and the port width a crest sits
    // in — wears the crest's diamond (js/loadout.js): dashed while it is on
    // the shelf, filled once it is hers. The cell and the core are neither
    // and keep a bare line; every name moves over so the column stays one.
    const ar = LANG === 'ar', lo = loadoutKindOf(it.type, it.id);
    if (lo) drawLoadoutFrame(c, lo, ar ? 774 : 186, y, 13, row && row.locked ? 'locked' : sold ? 'filled' : 'empty');
    ftxt(name, ar ? 752 : 208, y - 6, 17, col, ar ? 'right' : 'left');
    ftxt(desc, ar ? 752 : 208, y + 13, 12, sold ? '#46545f' : '#7d93a8', ar ? 'right' : 'left', null, '600');
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
  try { navigator.serviceWorker.register('sw.js?v=' + encodeURIComponent(window.BUILD_ID || 'dev'), {updateViaCache:'none'}).catch(() => {}); } catch (e) {}
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
  // Rule 4 of the touch recognizer (js/touch.js, js/mobile-platform.js): a
  // finger that lands and holds still emits no events, so the long press is
  // found from the frame loop or not at all.
  if (typeof tGestureUpdate === 'function') tGestureUpdate(tms);
  const artReady = typeof heroArtBootTick !== 'function' || heroArtBootTick();
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
  while (acc > 1e-4) {
    const st = Math.min(acc, SIM_STEP);
    if (artReady || G.state !== 'PLAY') update(st);
    // Held controls survive. A pressed edge belongs to one simulation step,
    // including a frame that catches up two or three physics steps.
    for (const key in keysP) keysP[key] = 0;
    acc -= st;
  }
  // ONE PREFETCH SLOT PER FRAME, IN EVERY STATE. This used to live inside the
  // PLAY branch of update(), which meant the title screen, the map, a shop and
  // the whole two-minute opening fetched nothing at all — the quietest moments
  // in the session were the only ones the prefetcher sat out. preloadIdle()
  // owns the decision now, and it still refuses during a transition, a boss
  // fight, and a film that is not playing cleanly.
  if (typeof preloadTick === 'function') { try { preloadTick(); } catch (e) {} }
  // ...and one slice of baking the next room's floor ahead of her (TILE CACHE)
  if (typeof tilePrebakeTick === 'function') { try { tilePrebakeTick(); } catch (e) {} }
  // the music steps back while a trial is open: the trial's notes are the
  // interface, and they lose to a stream at full volume (audio.js MUS_DUCK)
  if (typeof MUS_DUCK !== 'undefined') MUS_DUCK = G.state === 'TRIAL' ? 0.3 : 1;
  draw(tms);
  if (G.purificationReturn > 0) { c.fillStyle='rgba(0,0,0,'+Math.min(1,G.purificationReturn/.65)+')'; c.fillRect(0,0,960,540); }
  drawTouchUI();
  clearP();
  if (!mainLoop.ldGone && artReady) {
    mainLoop.ldGone = true;
    const ld = document.getElementById('cbload');
    if (ld) { ld.style.opacity = '0'; setTimeout(() => { try { ld.remove(); } catch (e) {} }, 500); }
  }
  requestAnimationFrame(mainLoop);
}
// Initial scheduling is in boot.js, after all production modules have loaded.
