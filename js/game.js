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

const CRESTS = { claws: 2, over: 2, plate: 2, magnet: 1, siphon: 1, phantom: 2, sprint: 1, nine: 3 };
const SHOP = [
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
    const grants = { glitch: 'dash', brood: 'djump', atlas: 'emp', zero: 'key' };
    if (grants[kind]) grantMod(grants[kind]);
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
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify({ lang: LANG, muted: MUTED, music: MUSIC_ON })); } catch (e) {} }
function loadMeta() {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY));
    if (m) { LANG = m.lang || 'en'; MUTED = !!m.muted; MUSIC_ON = m.music !== false; return true; }
  } catch (e) {}
  return false;
}
function newSave(diff) {
  return {
    v: 1, diff, scrap: 0, coresMax: DIFFS[diff].cores, abil: {}, crests: [], equip: [], arms: [], armIdx: 0, stars: 6,
    slots: 3, iq: 0, skills: [], relics: [], flags: {}, broken: {}, visited: {}, shop: {},
    bench: { room: 'A1', x: 80, y: 412 }, deaths: 0, lives: 0, time: 0,
    pouch: null, usedNine: false, won: false, evo: 0,
  };
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
function grantMod(id) {
  G.save.abil[id] = 1;
  showItem(t('m_' + id), t('m_' + id + 'd'));
}
function grantCrest(id) {
  if (G.save.crests.indexOf(id) < 0) G.save.crests.push(id);
  showItem(t('c_' + id), t('c_' + id + 'd'));
}
function showItem(name, desc) {
  sfx('win');
  G.dialog = { name: t('got'), lines: [name + ' — ' + desc], i: 0, onEnd: null };
  G.state = 'DIALOG';
  persist();
}

// ---------- room loading ----------
function spawnStatic(type, tx, ty, extra, flagKey) {
  const sizes = { bench: [44, 52], chest: [30, 24], mod: [24, 24], term: [26, 32], npc: [32, 40], riddle: [26, 36], secret: [24, 24], trial: [34, 44], vault: [40, 52] };
  const [w, h] = sizes[type];
  G.statics.push({ type, x: tx * TILE + (TILE - w) / 2, y: ty * TILE - h, w, h, extra, flagKey, opened: !!(flagKey && G.save.flags[flagKey]), t: rnd(0, 9) });
}
function loadRoom(id) {
  if (typeof npcVoxStopAll === 'function') npcVoxStopAll();   // voices stay in their rooms
  G.roomId = id; G.roomDef = ROOMS[id]; G.grid = buildRoom(id);
  G.enemies = []; G.projs = []; G.pickups = []; G.statics = []; G.boss = null;
  G.wrecks = []; G.recharge = null; G.plats = [];
  parts.length = 0;
  const def = ROOMS[id];
  def.ents.forEach((d, i) => {
    const [kind, tx, ty, extra, cond] = d;
    if (cond && !G.save.flags[cond]) return;
    if (EKIND[kind]) {
      const k = EKIND[kind];
      G.enemies.push(new Enemy(kind, tx * TILE + (TILE - k.w) / 2, ty * TILE - k.h));
    } else if (kind === 'scrap') {
      const fk = 'sc_' + id + '_' + i;
      if (!G.save.flags[fk]) {
        const s = new Scrap(tx * TILE + 10, ty * TILE - 20, extra || 10);
        s.vx = 0; s.vy = 0; s.flagKey = fk;
        G.pickups.push(s);
      }
    } else if (kind === 'plat') {
      G.plats.push(new MovingPlat(tx, ty, extra));
    } else if (kind === 'boss') {
      if (!G.save.flags['boss' + extra.charAt(0).toUpperCase() + extra.slice(1)])
        G.boss = new Boss(extra, tx * TILE, ty * TILE);
    } else if (kind === 'chest') {
      spawnStatic('chest', tx, ty, extra, 'ch_' + id + '_' + i);
    } else if (kind === 'mod') {
      if (!G.save.abil[extra]) spawnStatic('mod', tx, ty, extra);
    } else if (kind === 'riddle') {
      spawnStatic('riddle', tx, ty, extra, 'rd_' + RIDDLES[extra].id);
    } else if (kind === 'secret') {
      if (!G.save.flags['sr_' + extra]) spawnStatic('secret', tx, ty, extra);
    } else {
      spawnStatic(kind, tx, ty, extra, kind === 'term' ? null : null);
    }
  });
  if (G.save.pouch && G.save.pouch.room === id) {
    const p = new Pouch(G.save.pouch.x, G.save.pouch.y, G.save.pouch.amount);
    G.pickups.push(p);
  }
  G.save.visited[id] = 1;
  tileDirty = true;
  setMusic(def.zone);
  if (def.zone !== G.lastZone) { G.zoneToast = { text: t('z_' + def.zone), t: 2.6 }; G.lastZone = def.zone; }
  cam.x = 0; cam.y = 0;
  persist();
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
  applyTheme();
  loadRoom(save.bench.room);
  player = new Player(save.bench.x, save.bench.y);
  player.cores = player.maxCores(); player.volts = 33;
  updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
  if (save.time < 1) { G.state = 'INTRO'; G.introT = 0; G.introSlam = false; }
  else G.state = 'PLAY';
}
function respawn() {
  if (G.save.diff === 2 && G.save.lives >= 9) { G.state = 'GAMEOVER'; return; }
  loadRoom(G.save.bench.room);
  player = new Player(G.save.bench.x, G.save.bench.y);
  player.cores = player.maxCores(); player.volts = 33;
  updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
  if (G.save.pouch) G.toast(t('pouch') + '  (' + t('z_' + ROOMS[G.save.pouch.room].zone) + ')');
  G.state = 'PLAY';
}
function bossActive() { return G.boss && !G.boss.dead && G.boss.st !== 'dorm'; }

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
function doInteract(s) {
  if (s.type === 'npc') {
    const lines = t('d_' + s.extra).slice();
    G.dialog = {
      name: t('n_' + s.extra), lines, i: 0, npc: s.extra,
      onEnd: s.extra === 'ratchet' ? () => { G.state = 'SHOP'; G.shopIdx = 0; }
        : s.extra === 'mono' ? () => trialOpen() : null,
    };
    G.state = 'DIALOG'; sfxVoice(s.extra);
  } else if (s.type === 'term') {
    G.dialog = { name: '…', lines: t('t' + s.extra).slice(), i: 0, onEnd: null, rs: RS_TERM[s.extra] };
    G.state = 'DIALOG'; sfx('ui');
  } else if (s.type === 'bench') {
    G.save.bench = { room: G.roomId, x: s.x, y: s.y + s.h - 38 };
    G.save.usedNine = false; G.save.usedAegis = false;
    starRestock(); persist(); sfx('bench');
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
    else grantCrest(s.extra);
  } else if (s.type === 'mod') {
    G.statics.splice(G.statics.indexOf(s), 1);
    grantMod(s.extra);
  } else if (s.type === 'riddle') {
    G.riddle = { def: RIDDLES[s.extra], sel: 0, st: s };
    G.state = 'RIDDLE'; sfx('ui');
  } else if (s.type === 'secret') {
    G.save.flags['sr_' + s.extra] = 1;
    G.statics.splice(G.statics.indexOf(s), 1);
    burst(s.x + 12, s.y + 12, 26, '#ffd76a', 280, 0.8, 100, 4, true);
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
  if (G.state === 'PLAY' || G.state === 'DIALOG') tickNPCVox();
  else if (typeof npcVoxQuietAll === 'function') npcVoxQuietAll();
  if (G.state === 'PLAY') {
    G.save.time += dt;
    fxDecay(dt);
    if (G.hitStop > 0) { G.hitStop -= dt; updateParts(dt * 0.25); return; }
    if (G.trans) {
      G.trans.t -= dt;
      if (!G.trans.half && G.trans.t < 0.14) { G.trans.half = true; applyTransition(); }
      if (G.trans.t <= 0) G.trans = null;
    } else {
      if (G.plats) for (const pl of G.plats) pl.update(dt);
      player.update(dt);
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
      if (G.near && (inP('INT') || (inP('UP') && player.on))) doInteract(G.near);
      checkTransitions();
      if (G.winT > 0) { G.winT -= dt; if (G.winT <= 0) { G.state = 'WIN'; setMusic('winTheme'); } }
      if (G.state === 'PLAY') {
        if (inP('MAP')) { G.state = 'MAP'; sfx('ui'); }
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
        if (cb) cb();
      } else if (G.dialog.npc) sfxVoice(G.dialog.npc);
      else sfx('ui');
    }
  }
  else if (G.state === 'MAP') { if (inP('MAP') || inP('BACK') || inP('OK')) { G.state = 'PLAY'; sfx('ui'); } }
  else if (G.state === 'CREST') updateCrest();
  else if (G.state === 'SHOP') updateShop();
  else if (G.state === 'RIDDLE') updateRiddle();
  else if (G.state === 'SKILLS') updateSkills();
  else if (G.state === 'RELICS') updateRelics();
  else if (G.state === 'TRIAL') updateTrial(dt);
  else if (G.state === 'PAUSE') updatePause();
  else if (G.state === 'TCFG') updateTouchCfg();
  else if (G.state === 'CINE') updateCine(dt);
  else if (G.state === 'MENU') updateMenu();
  else if (G.state === 'LANGSEL') updateLangSel();
  else if (G.state === 'DIFF') updateDiff();
  else if (G.state === 'WHO') updateWho();
  else if (G.state === 'CTRL') updateCtrl();
  else if (G.state === 'INTRO') {
    G.introT += dt;
    if (inP('OK') || inP('ATK') || inP('BACK') || G.introT > 12.4) { G.state = 'PLAY'; sfx('ok'); }
  }
  else if (G.state === 'WIN') { if (inP('OK')) { G.state = 'MENU'; G.menuIdx = 0; setMusic('title'); } }
  else if (G.state === 'GAMEOVER') {
    if (inP('OK')) { wipeSave(G.save && G.save.theme); G.save = null; G.state = 'MENU'; G.menuIdx = 0; setMusic('title'); }
  }
}
function menuOptions() {
  // "Play" always leads to the Who-are-you chooser (per-character saves)
  return ['play', 'controls', 'lang', 'sound', 'music'];
}
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
    else if (o === 'controls') { G.ctrlBack = 'MENU'; G.state = 'CTRL'; }
    else if (o === 'lang') { openLangSel('MENU'); }
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
  if (inP('BACK')) { G.state = 'WHO'; sfx('ui'); return; }
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
function updatePause() {
  const n = pauseHasTouch() ? 8 : 7;
  if (inP('DOWN')) { G.pauseIdx = (G.pauseIdx + 1) % n; sfx('ui'); }
  if (inP('UP')) { G.pauseIdx = (G.pauseIdx + n - 1) % n; sfx('ui'); }
  if (inP('PAUSE')) { G.state = 'PLAY'; return; }
  if (inP('OK')) {
    sfx('ok');
    const quitIdx = n - 1;
    if (G.pauseIdx === 0) G.state = 'PLAY';
    else if (G.pauseIdx === 1) G.state = 'MAP';
    else if (G.pauseIdx === 2) { G.state = 'CREST'; G.crestIdx = 0; }
    else if (G.pauseIdx === 3) { G.state = 'SKILLS'; G.skillIdx = 0; }
    else if (G.pauseIdx === 4) G.state = 'RELICS';
    else if (G.pauseIdx === 5) { G.ctrlBack = 'PAUSE'; G.state = 'CTRL'; }
    else if (pauseHasTouch() && G.pauseIdx === 6) G.state = 'TCFG';
    else if (G.pauseIdx === quitIdx) { persist(); setMusic('title'); G.state = 'MENU'; G.menuIdx = 0; }
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
    if (it.type === 'crest') { G.save.crests.push(it.id); showItem(t('c_' + it.id), t('c_' + it.id + 'd')); }
    else if (it.type === 'slot') { G.save.slots++; G.save.shop[it.id] = 1; showItem(t('s_slot'), t('s_slotd')); }
    else { G.save.coresMax++; player.cores++; G.save.shop[it.id] = 1; showItem(t('s_core'), t('s_cored')); }
  }
}
function shopSold(it) { return it.type === 'crest' ? G.save.crests.indexOf(it.id) >= 0 : !!G.save.shop[it.id]; }
function effSlots() { return G.save.slots + (G.save.skills && G.save.skills.indexOf('mind') >= 0 ? 1 : 0); }
function updateRiddle() {
  const r = G.riddle;
  if (!r || inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
  const n = r.def.choices.length;
  if (inP('DOWN')) { r.sel = (r.sel + 1) % n; sfx('ui'); }
  if (inP('UP')) { r.sel = (r.sel + n - 1) % n; sfx('ui'); }
  if (inP('OK')) {
    if (r.sel === r.def.correct) {
      G.save.flags['rd_' + r.def.id] = 1;
      G.save.iq += r.def.iq;
      r.st.opened = true;
      sfx('win'); G.toast(t('rd_reward') + '  +' + r.def.iq + ' ' + t('sk_iq'));
      burst(r.st.x + 13, r.st.y + 12, 24, '#b48cff', 260, 0.8, 100, 4, true);
      if (RIDDLES.every(rd => G.save.flags['rd_' + rd.id])) G.grantRelic('sigil2');
      persist();
    } else {
      sfx('no'); cam.shake = 6; G.toast(t('rd_wrong'));
    }
    G.state = 'PLAY';
  }
}
function updateSkills() {
  if (inP('SKILL') || inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
  const n = SKILLS.length;
  if (inP('DOWN') || inP('RIGHT')) { G.skillIdx = (G.skillIdx + 1) % n; sfx('ui'); }
  if (inP('UP') || inP('LEFT')) { G.skillIdx = (G.skillIdx + n - 1) % n; sfx('ui'); }
  if (inP('OK')) {
    const sk = SKILLS[G.skillIdx];
    if (G.save.skills.indexOf(sk.id) >= 0) { sfx('no'); return; }
    if (!tierOpen(sk.tier, G.save.skills.length)) { G.toast(t('sk_locked')); sfx('no'); return; }
    if (G.save.iq < sk.cost) { G.toast(t('sk_poor')); sfx('no'); return; }
    G.save.iq -= sk.cost; G.save.skills.push(sk.id);
    sfx('win'); persist();
    showItem(t('sk_' + sk.id), t('sk_' + sk.id + 'd'));
  }
}
function drawRiddle() {
  const r = G.riddle;
  dimPanel(150, 96, 660, 366);
  ftxt(t('rd_title'), 480, 128, 22, '#b48cff', 'center', '#b48cff');
  wrapText(r.def.q[LANG] || r.def.q.en, 560, 19).forEach((ln, i) => ftxt(ln, 480, 178 + i * 26, 19, '#eef3fa', 'center', null, '600'));
  r.def.choices.forEach((ch, i) => {
    const sel = i === r.sel, y = 300 + i * 44;
    if (sel) { c.fillStyle = 'rgba(180,140,255,0.12)'; rr(c, 220, y - 18, 520, 36, 8); c.fill(); }
    ftxt((sel ? '▸ ' : '') + (ch[LANG] || ch.en), 480, y, 17, sel ? '#eef3fa' : '#8aa2b5');
  });
  ftxt('+' + r.def.iq + ' ' + t('sk_iq'), 480, 442, 14, '#b48cff');
}
function drawSkills() {
  c.fillStyle = 'rgba(4,7,12,0.88)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('sk_title'), 480, 46, 28, '#eef3fa', 'center', '#b48cff');
  ftxt(t('sk_iq') + '  ' + G.save.iq, 480, 82, 17, '#b48cff');
  const pos = i => ({ x: 330 + (i % 2) * 300, y: 150 + Math.floor(i / 2) * 105 });
  c.strokeStyle = 'rgba(180,140,255,0.3)'; c.lineWidth = 2;
  for (let i = 2; i < SKILLS.length; i++) {
    const a = pos(i - 2), b = pos(i);
    c.beginPath(); c.moveTo(a.x, a.y + 26); c.lineTo(b.x, b.y - 26); c.stroke();
  }
  SKILLS.forEach((sk, i) => {
    const p2 = pos(i), owned = G.save.skills.indexOf(sk.id) >= 0;
    const open = tierOpen(sk.tier, G.save.skills.length);
    const afford = open && !owned && G.save.iq >= sk.cost;
    const sel = i === G.skillIdx;
    c.beginPath(); c.arc(p2.x, p2.y, 26, 0, 7);
    c.fillStyle = owned ? 'rgba(125,232,160,0.25)' : afford ? 'rgba(180,140,255,' + (0.16 + Math.sin(performance.now() / 300) * 0.08) + ')' : 'rgba(40,50,66,0.6)';
    c.fill();
    c.lineWidth = sel ? 3 : 1.5;
    c.strokeStyle = sel ? '#ffffff' : owned ? '#7de8a0' : afford ? '#b48cff' : '#44586b';
    c.stroke();
    ftxt(owned ? '✓' : (open ? String(sk.cost) : '🔒'), p2.x, p2.y, owned ? 18 : 13, owned ? '#7de8a0' : open ? '#dbe7f2' : '#607386');
    ftxt(t('sk_' + sk.id), p2.x, p2.y + 44, 14, sel ? '#eef3fa' : '#8aa2b5');
  });
  const cur = SKILLS[G.skillIdx];
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
function ftxt(str, x, y, size, color, align, glow, weight) {
  c.font = (weight || '700') + ' ' + size + 'px "Segoe UI", Tahoma, sans-serif';
  c.textAlign = align || 'center'; c.textBaseline = 'middle';
  if (glow) { c.shadowColor = glow; c.shadowBlur = 14; }
  c.fillStyle = color; c.fillText(str, x, y); c.shadowBlur = 0;
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
function drawZoneVista(P, zone, px, py) {
  const solo = ZONE_VISTA[zone] && typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[ZONE_VISTA[zone]];
  const im = solo || (typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.zones);
  const cell = solo ? [0, 0] : ZONE_CELL[zone];
  if (!im || !cell) return false;
  const CW = solo ? im.naturalWidth : im.naturalWidth / 2;
  const CH = solo ? im.naturalHeight : im.naturalHeight / 3;
  // scale the painting past the screen and pan across the excess as the camera
  // crosses the room — a single painting, so it pans rather than tiles. Wide
  // solo paintings are width-bound so there is always horizontal travel.
  const sc = Math.max((540 / CH) * 1.12, (960 / CW) * 1.16);
  const dw = CW * sc, dh = CH * sc;
  const roomW = G.roomDef.w * TILE;
  const fx = roomW > 980 ? clamp(px / (roomW - 960), 0, 1) : 0.5;
  const ox = -(dw - 960) * fx;
  const oy = -(dh - 540) * 0.6 - py * 0.05;
  c.drawImage(im, cell[0] * CW, cell[1] * CH, CW, CH, ox, oy, dw, dh);
  // seat the playfield: darken the lower third and cool the whole frame slightly
  // toward the zone palette so gameplay reads against the painting
  const hz = c.createLinearGradient(0, 250, 0, 540);
  hz.addColorStop(0, 'rgba(5,9,14,0)'); hz.addColorStop(1, 'rgba(5,9,14,0.62)');
  c.fillStyle = hz; c.fillRect(0, 0, 960, 540);
  c.fillStyle = 'rgba(5,9,14,0.14)'; c.fillRect(0, 0, 960, 540);
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
  if (drawZoneVista(P, zone, px, py)) return;
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
function drawTiles(P) {
  const g = G.grid, W = g[0].length, H = g.length;
  const x0 = 0, x1 = W - 1, y0 = 0, y1 = H - 1;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const ch = tileAt(tx, ty), X = tx * TILE, Y = ty * TILE;
    if (ch === '#') {
      const up = tileAt(tx, ty - 1);
      const exposed = up !== '#' && up !== 'B';
      // body with per-tile tonal variation
      c.fillStyle = P.solid; c.fillRect(X, Y, TILE, TILE);
      c.globalAlpha = 0.1 + hash2(tx * 3, ty * 7) * 0.22;
      c.fillStyle = P.dark; c.fillRect(X, Y, TILE, TILE);
      c.globalAlpha = 1;
      if (!exposed) {
        // interior: plate seams, rivets, polychrome mottling
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
      } else {
        // natural walking surface: irregular lit lip, nubs, zone flora
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
    } else if (ch === '=') {
      c.fillStyle = P.dark; c.fillRect(X, Y + 2, TILE, 7);
      c.fillStyle = P.edge; c.fillRect(X, Y, TILE, 3);
      c.globalAlpha = 0.5; c.fillRect(X + 4, Y + 9, 2.5, 4); c.fillRect(X + 25, Y + 9, 2.5, 4); c.globalAlpha = 1;
    } else if (ch === '^') {
      c.fillStyle = P.spike; c.shadowColor = P.glow; c.shadowBlur = 6;
      for (let k = 0; k < 2; k++) {
        c.beginPath();
        c.moveTo(X + k * 16, Y + TILE); c.lineTo(X + k * 16 + 8, Y + 6); c.lineTo(X + k * 16 + 16, Y + TILE);
        c.closePath(); c.fill();
      }
      c.shadowBlur = 0;
    } else if (ch === 'B') {
      c.fillStyle = P.solid; c.fillRect(X, Y, TILE, TILE);
      const pulse = 0.25 + Math.sin(performance.now() / 400 + tx) * 0.1;
      c.strokeStyle = P.dark; c.lineWidth = 2;
      c.beginPath(); c.moveTo(X + 6, Y + 4); c.lineTo(X + 14, Y + 16); c.lineTo(X + 8, Y + 28);
      c.moveTo(X + 22, Y + 6); c.lineTo(X + 18, Y + 18); c.lineTo(X + 26, Y + 27); c.stroke();
      c.fillStyle = P.glow; c.globalAlpha = pulse; c.fillRect(X + 13, Y + 14, 6, 5); c.globalAlpha = 1;
    }
  }
}
// tile layer cache — tiles are static per room, so render once and blit
let tileCv = null, tileDirty = true;
function renderTileLayer(P) {
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  if (!tileCv || tileCv.width !== W || tileCv.height !== H) {
    tileCv = document.createElement('canvas'); tileCv.width = W; tileCv.height = H;
  }
  const tctx = tileCv.getContext('2d');
  tctx.clearRect(0, 0, W, H);
  const main = c; c = tctx;
  drawTiles(P);
  c = main;
  tileDirty = false;
}
function drawStatics(P) {
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
    } else if (s.type === 'riddle') {
      const pu = 0.5 + Math.sin(performance.now() / 500 + s.t) * 0.35;
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
      const bob2 = talking ? bob * 1.9 : bob;
      c.save(); c.translate(s.x + s.w / 2, s.y + s.h + bob2 * 0.4);
      if (player && player.x + 12 < s.x) c.scale(-1, 1);  // face the cat
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
      } else {
        drawNPCBody(c, id, performance.now() / 1000 + (s.t || 0) * 1.7, talking);
      }
      c.restore();
    }
  }
  // interact hint
  if (G.near && G.state === 'PLAY' && !G.recharge) {
    const s = G.near;
    const label = s.type === 'npc' ? t('talk') : s.type === 'bench' ? t('rest') : s.type === 'term' ? t('read') : s.type === 'riddle' ? t('rd_hint') : s.type === 'secret' ? t('secret_hint') : s.type === 'trial' ? t('tt_open') : s.type === 'vault' ? t('vault_hint') : t('open');
    ftxt(label, s.x + s.w / 2, s.y - 18, 13, '#eef3fa', 'center', 'rgba(120,220,255,0.8)');
  }
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
  ftxt('⚙ ' + G.save.scrap, 76, 66, 17, '#ffd76a', 'left', null, '700');
  ftxt('◈ ' + (G.save.iq || 0) + ' ' + t('sk_iq'), 76, 88, 13, '#b48cff', 'left');
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
  G.toasts.forEach((tt, i) => {
    c.globalAlpha = clamp(tt.t, 0, 1);
    ftxt(tt.text, 480, 440 - i * 24, 15, '#eef3fa', 'center', 'rgba(120,220,255,0.7)');
    c.globalAlpha = 1;
  });
  if (G.zoneToast) {
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
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = a; c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}
function drawLights(P) {
  c.save(); c.globalCompositeOperation = 'lighter';
  if (player && !player.dead)
    lightAt(player.x + 12, player.y + 18, 150, P.glow, 0.13 + (player.dashT > 0 ? 0.14 : 0) + (player.healT > 0 ? 0.12 : 0));
  for (const p of G.projs) lightAt(p.x, p.y, 62, p.color, 0.4);
  for (const s of G.statics) {
    if (s.type === 'bench') lightAt(s.x + s.w / 2, s.y, 80, '#aef7d8', 0.22);
    else if (s.type === 'mod') lightAt(s.x + 12, s.y + 12, 90, P.glow, 0.4);
    else if (s.type === 'chest' && !s.opened) lightAt(s.x + s.w / 2, s.y + 10, 55, '#ffd76a', 0.28);
  }
  if (G.boss && !G.boss.dead) lightAt(G.boss.cx(), G.boss.cy(), 180, P.glow, 0.16);
  for (const p of G.pickups) if (p instanceof Scrap) lightAt(p.x + 5, p.y + 5, 26, '#ffd76a', 0.3);
  c.restore(); c.globalAlpha = 1;
}
let bloomCv = null, bloomCtx = null, bloomOK = true;
function applyBloom() {
  if (!bloomOK) return;
  if (!bloomCv) {
    bloomCv = document.createElement('canvas'); bloomCv.width = 384; bloomCv.height = 216;
    bloomCtx = bloomCv.getContext('2d');
    if (typeof bloomCtx.filter !== 'string') { bloomOK = false; return; }
  }
  bloomCtx.clearRect(0, 0, 384, 216);
  bloomCtx.filter = 'blur(4px) brightness(1.05) contrast(1.6) saturate(1.6)';
  bloomCtx.drawImage(cv, 0, 0, 384, 216);
  c.save();
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.42;
  c.drawImage(bloomCv, 0, 0, 960, 540);
  c.restore();
}
function drawWorldFrame() {
  const P = PAL[G.roomDef.zone];
  drawBG(P, cam.x, cam.y);
  c.save();
  c.translate(-Math.round(camSX()), -Math.round(camSY()));
  if (tileDirty) renderTileLayer(P);
  c.drawImage(tileCv, 0, 0);
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
  drawStatics(P);
  for (const p of G.pickups) p.draw(c);
  if (G.plats) for (const pl of G.plats) pl.draw(c);
  for (const e of G.enemies) e.draw(c);
  for (const w of G.wrecks) w.draw(c);
  if (G.boss) G.boss.draw(c);
  for (const p of G.projs) p.draw(c);
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
  if (player && !G.recharge) {
    c.save();
    c.translate(-Math.round(camSX()), -Math.round(camSY()));
    player.draw(c);
    c.restore();
  }
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
  if (G.flash > 0) {
    c.fillStyle = 'rgba(255,255,255,' + (G.flash * 0.32) + ')';
    c.fillRect(0, 0, 960, 540);
  }
  scanOverlay();
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
// glows red — NYA-9 reads teal, the hero reads gold, and the crimson crest is
// pigment rather than emission. Nothing here is new, so both carry wear.
// ---------------------------------------------------------------------------
// Corrected to the reference sheet: NYA-9 is WHITE CERAMIC over brushed steel
// with oxidized bronze fittings and cyan light — not the dark blue-teal she was.
const NYA_P  = { core:'#3a3730', shade:'#6b665d', mid:'#c2bcae', lit:'#f2eee6', glow:'#3fd8ee' };
const WRAP_P = { core:'#20262b', shade:'#333c44', mid:'#4e5a64' };
const BRZ_P  = { core:'#2b1f12', shade:'#5f4520', mid:'#9a7534', lit:'#d9b56a', glow:'#ffd98a' };
const CRE_P  = { core:'#5e1a22', shade:'#a8323c', mid:'#e0484f', lit:'#f2887f' };

function nyaSkullP(x) {
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
function nyaEarP(x, dir) {
  x.save(); x.scale(dir, 1);
  x.beginPath();
  x.moveTo(36,-76); x.quadraticCurveTo(56,-130, 74,-176); x.quadraticCurveTo(104,-114, 92,-60);
  x.closePath(); x.restore();
}
function nyaEyeP(x) {
  x.beginPath();
  x.moveTo(-25, 1); x.quadraticCurveTo(-20,-12, 2,-13); x.quadraticCurveTo(23,-13, 28,-4);
  x.quadraticCurveTo(23, 10, 2, 11); x.quadraticCurveTo(-20, 10, -25, 1);
  x.closePath();
}
// NYA-9: a maintenance unit, not a soldier — round-dominant skull, level brow and
// alert (not narrowed) eyes. The asymmetry is a repair patch she riveted on herself.
function drawNyaP(x, detail) {
  x.save(); x.rotate(-0.03);
  const sg = x.createLinearGradient(-90, 60, 90, 190);
  sg.addColorStop(0, NYA_P.shade); sg.addColorStop(1, NYA_P.core);
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
  nyaEarP(x,-1); x.fill(); nyaEarP(x,1); x.fill();
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

  x.save(); nyaSkullP(x); x.clip();
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

  x.save(); nyaSkullP(x); x.clip();
  const rg = x.createLinearGradient(-106,-116, 40, 46);
  rg.addColorStop(0,'rgba(214,243,231,0)'); rg.addColorStop(0.18,'rgba(214,243,231,0.92)');
  rg.addColorStop(0.52,'rgba(214,243,231,0)');
  x.strokeStyle = rg; x.lineWidth = 8; nyaSkullP(x); x.stroke();
  const bg2 = x.createLinearGradient(80, 86, 0, 6);
  bg2.addColorStop(0,'rgba(55,255,208,0.40)'); bg2.addColorStop(1,'rgba(55,255,208,0)');
  x.strokeStyle = bg2; x.lineWidth = 5; nyaSkullP(x); x.stroke();
  x.restore();

  x.save(); nyaSkullP(x); x.clip();
  x.fillStyle = ramp(x, MAT.steel, -92,-52, 92,-24);
  x.beginPath(); x.moveTo(-92,-50); x.quadraticCurveTo(0,-36, 92,-50);
  x.lineTo(92,-28); x.quadraticCurveTo(0,-15, -92,-28); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(220,178,104,0.55)'; x.lineWidth = 2.2;   // bronze trim
  x.beginPath(); x.moveTo(-90,-49); x.quadraticCurveTo(0,-35, 90,-49); x.stroke();
  x.restore();

  x.save(); nyaSkullP(x); x.clip();
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
    x.fillStyle = MAT.steel.deep; x.save(); x.scale(1.2,1.34); nyaEyeP(x); x.fill(); x.restore();
    occl(x, 0, 0, 34, 20, 0.5);
    x.shadowColor = MAT.cyan.mid; x.shadowBlur = 22; x.fillStyle = MAT.cyan.mid;
    nyaEyeP(x); x.fill(); x.shadowBlur = 0;
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
  // NYA-9 keeping watch behind the menu. Suppressed on the chooser, where she would
  // otherwise show through the hero's card and lend him her antenna.
  if (G.state !== 'WHO') {
    c.save(); c.translate(772, 334); c.scale(1.02, 1.02);
    c.globalAlpha = 0.58 + Math.sin(tsec * 2) * 0.07;
    drawNyaP(c, true);
    c.restore(); c.shadowBlur = 0; c.globalAlpha = 1;
  }
}
function draw(tms) {
  const tsec = tms / 1000;
  c.clearRect(0, 0, 960, 540);
  const st = G.state;
  if (st === 'CINE') { drawCine(); return; }
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
        play: t('menu_play'), controls: t('menu_controls'),
        lang: t('menu_language') + ': ' + langName(LANG), sound: MUTED ? t('menu_sound_off') : t('menu_sound_on'),
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
  drawHUD();
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
    ftxt(t('paused'), 480, 120, 38, '#eef3fa', 'center', '#37ffd0');
    const pmItems = [t('resume'), t('pm_map'), t('pm_crests'), t('pm_skills'), t('pm_relics'), t('ctl_title')];
    if (pauseHasTouch()) pmItems.push(t('tl_title'));
    pmItems.push(t('to_menu'));
    pmItems.forEach((s, i) => {
      const sel = i === G.pauseIdx, last = i === pmItems.length - 1, y = 190 + i * 40;
      // the way OUT is highlighted so it can never be missed
      if (last) { c.fillStyle = 'rgba(255,120,110,0.10)'; rr(c, 300, y - 20, 360, 34, 8); c.fill(); }
      ftxt((sel ? '▸ ' : '') + (last ? '⏻  ' : '') + s, 480, y, 21,
           sel ? '#eef3fa' : (last ? '#e88b86' : '#7d93a8'));
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
    dimPanel(140, 386, 680, 118);
    // 64×64 portrait bust — face acting the sprite is too small to carry
    {
      let expr = 'neutral';
      if (player && player.cores <= 2) expr = 'hurt';
      else if (G.boss && !G.boss.dead) expr = 'determined';
      else if (d.rs || d.name === '…') expr = 'curious';
      drawPortrait(c, LANG === 'ar' ? 744 : 152, 400, expr);
    }
    ftxt(d.name, LANG === 'ar' ? 736 : 226, 410, 16, '#37ffd0', LANG === 'ar' ? 'right' : 'left');
    if (d.rs) {
      drawGlyphText(c, d.rs, 480, 432, 10, 'rgba(120,220,255,0.65)', 'rgba(120,220,255,0.4)');
      wrapText(d.lines[d.i], 620, 15).forEach((ln, i) => ftxt(ln, 480, 460 + i * 21, 15, '#e6eef6', 'center', null, '600'));
    } else {
      wrapText(d.lines[d.i], 620, 16).forEach((ln, i) => ftxt(ln, 480, 442 + i * 22, 16, '#e6eef6', 'center', null, '600'));
    }
    ftxt('▼', 480, 494, 13, '#7d93a8');
  } else if (st === 'MAP') {
    drawMap();
  } else if (st === 'CREST') {
    drawCrest();
  } else if (st === 'SHOP') {
    drawShop();
  } else if (st === 'RIDDLE' && G.riddle) {
    drawRiddle();
  } else if (st === 'SKILLS') {
    drawSkills();
  } else if (st === 'RELICS') {
    drawRelics();
  } else if (st === 'TRIAL') {
    drawTrial();
  }
}
// ===========================================================================
// THE BROADCAST FALLS — the manga opening. Black-and-white with selective
// color: cyan belongs to NYA-9 and clean machines, red to the infection,
// gold to brief power. Hold-frames with drifting particles, panel borders,
// speed lines; ~70 seconds of story, then the title card.
// Hold JUMP/OK one second to skip; the watched flag lives in localStorage.
// ===========================================================================
function startCine() {
  G.cine = { t: 0, hold: 0, promptT: 0, glitchT: 0, ending: false };
  G.state = 'CINE';
}
function cineEnd() {
  try { localStorage.setItem('cb_intro_seen', '1'); } catch (e) {}
  G.cine = null;
  G.state = 'MENU'; G.menuIdx = 0;
}
function updateCine(dt) {
  const ci = G.cine;
  if (!ci) { cineEnd(); return; }
  if (ci.ending) {
    ci.glitchT -= dt;
    if (ci.glitchT <= 0) cineEnd();
    return;
  }
  ci.t += dt;
  ci.promptT = Math.max(0, ci.promptT - dt);
  const inTitle = ci.t >= 58;
  const pressed = inP('OK') || inP('JUMP') || inP('ATK');
  const held = inD('OK') || inD('JUMP') || inD('ATK');
  if (inTitle) {
    if (pressed) { ci.ending = true; ci.glitchT = 0.8; sfx('phase'); sfx('ok'); }
    return;
  }
  if (pressed) ci.promptT = 2;
  if (held && ci.promptT > 0) {
    ci.hold += dt;
    if (ci.hold >= 1) { ci.t = 58; ci.hold = 0; ci.promptT = 0; sfx('ui'); }
  } else ci.hold = 0;
}
function drawCine() {
  const ci = G.cine; if (!ci) return;
  const T = ci.t;
  // =========================================================================
  // THE BROADCAST FALLS — a real comic. Paper gutters, ink borders, halftone
  // shade — and the actual cast on every page: MOTHER-V, the machine folk,
  // the four guardians from their authored sheets, and NYA-9 herself.
  // Selective color law: cyan is hers, red is the infection, gold is power.
  // =========================================================================
  const seg = (a, b2) => T >= a && T < b2;
  const citySil = (yBase, k, dark) => {
    for (let i = 0; i < 26; i++) {
      const bw = 40 + hash2(i, k) * 80, bh = 90 + hash2(i, k + 1) * 260;
      const bx = (i * 76 + hash2(i, k + 2) * 40) % 1040 - 40;
      c.fillStyle = dark ? '#08080c' : '#131318';
      c.fillRect(bx, yBase - bh, bw, bh + 200);
    }
  };
  const motes = (n, k) => {
    c.fillStyle = 'rgba(200,200,210,0.35)';
    for (let i = 0; i < n; i++)
      c.fillRect((i * 211 + hash2(i, k) * 900) % 960, (hash2(i, k + 1) * 540 + T * 5) % 540, 1.6, 1.6);
  };
  // halftone dot screen, cached as a pattern — the comic's shading
  if (!drawCine._tone) {
    const tc = document.createElement('canvas'); tc.width = tc.height = 7;
    const tx = tc.getContext('2d'); tx.fillStyle = '#000';
    tx.beginPath(); tx.arc(3.5, 3.5, 1.5, 0, 7); tx.fill();
    drawCine._tone = c.createPattern(tc, 'repeat');
  }
  const tone = (x, y, w, h, a) => {
    c.save(); c.globalAlpha = a; c.fillStyle = drawCine._tone;
    c.fillRect(x, y, w, h); c.restore();
  };
  // one comic panel: pops in with an ease + white flash, clips its art
  const panel = (x, y, w, h, at, fn) => {
    const k = clamp((T - at) / 0.32, 0, 1);
    c.save();
    if (k <= 0) {
      c.fillStyle = '#cfc9b8'; c.fillRect(x, y, w, h);
      c.strokeStyle = 'rgba(30,30,34,0.35)'; c.lineWidth = 2; c.strokeRect(x, y, w, h);
      c.restore(); return;
    }
    const e = 1 - Math.pow(1 - k, 3);
    c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.save();
    c.translate(x + w / 2, y + h / 2);
    c.scale(0.94 + 0.06 * e, 0.94 + 0.06 * e);
    c.translate(-(x + w / 2), -(y + h / 2));
    c.fillStyle = '#101016'; c.fillRect(x - 20, y - 20, w + 40, h + 40);
    try { fn(x, y, w, h, T - at); } catch (e2) {}
    c.restore();
    if (k < 1) { c.fillStyle = 'rgba(255,255,255,' + (1 - k) * 0.9 + ')'; c.fillRect(x, y, w, h); }
    c.restore();
    c.strokeStyle = '#14141a'; c.lineWidth = 5; c.strokeRect(x, y, w, h);
  };
  // caption box: cream card, ink border, typewriter reveal
  const cap = (x, y, w, txt, local) => {
    const lines = wrapText(txt, w - 26, 14);
    const h = 14 + lines.length * 18;
    const shown = clamp(local * 40, 0, txt.length);
    c.save(); c.translate(x, y); c.rotate(-0.006);
    c.fillStyle = '#f3efe1'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#14141a'; c.lineWidth = 3; c.strokeRect(0, 0, w, h);
    let used = 0;
    for (let i = 0; i < lines.length; i++) {
      const take = clamp(shown - used, 0, lines[i].length);
      if (take > 0) ftxt(lines[i].slice(0, take), w / 2, 12 + i * 18, 14, '#17171d', 'center');
      used += lines[i].length + 1;
    }
    c.restore();
  };
  // onomatopoeia: double-stroked display type, rocked on its own angle
  const sfxWord = (txt, x, y, size, ang, col) => {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.font = '900 ' + size + 'px Impact, "Arial Black", sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.strokeStyle = '#0d0d12'; c.lineWidth = size * 0.24; c.strokeText(txt, 0, 0);
    c.strokeStyle = '#f3efe1'; c.lineWidth = size * 0.1; c.strokeText(txt, 0, 0);
    c.fillStyle = col; c.fillText(txt, 0, 0);
    c.restore();
  };
  const nameTag = (x, y, key) => {
    const nm = String(t(key)).split(/[,،]/)[0].trim();
    c.save();
    c.font = '800 13px "Segoe UI", Tahoma, sans-serif';
    const w = c.measureText(nm).width + 18;
    c.fillStyle = '#14141a'; c.fillRect(x, y, w, 22);
    c.fillStyle = '#f3efe1'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(nm, x + 9, y + 12);
    c.restore();
  };
  const radialLight = (x, y, r, col, a) => {
    const g = c.createRadialGradient(x, y, r * 0.1, x, y, r);
    g.addColorStop(0, col.replace('$', a)); g.addColorStop(1, col.replace('$', 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const speedBurst = (x, y, r0, r1, n, col, ph) => {
    c.save(); c.strokeStyle = col; c.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + (ph || 0);
      c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
      c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.stroke();
    }
    c.restore();
  };
  const vista = (x, y, w, h, tint, ta) => {
    const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.vistaCity;
    if (im) {
      const s = Math.max(w / im.width, h / im.height);
      c.drawImage(im, x + w / 2 - im.width * s / 2, y + h / 2 - im.height * s / 2,
        im.width * s, im.height * s);
      c.fillStyle = 'rgba(10,12,16,0.35)'; c.fillRect(x, y, w, h);
    } else { c.fillStyle = '#131318'; c.fillRect(x, y, w, h); }
    if (tint) { c.fillStyle = tint.replace('$', ta == null ? 0.22 : ta); c.fillRect(x, y, w, h); }
  };
  // the REAL cat: a Player instance posed for the page (world stubs guarded)
  const nyaReal = (x, y, sc, opts) => {
    if (typeof Player === 'undefined') return;
    if (!G.grid) G.grid = [['#']];
    if (!G.roomDef) G.roomDef = { zone: 'A' };
    if (!G.roomId) G.roomId = 'X0';
    const p = ci.nya || (ci.nya = new Player(0, 0));
    p.x = -12; p.y = -36; p.face = p.faceVis = (opts && opts.face) || 1;
    p.anim = T; p.idleT = (opts && opts.idle) || 0; p.iT = 0; p.on = true;
    c.save(); c.translate(x, y); c.scale(sc, sc);
    try { p.draw(c); } catch (e2) {}
    c.restore();
  };
  const TITLE_AT = 58;

  // paper page under everything (the title page goes dark again)
  if (T < TITLE_AT) {
    c.fillStyle = '#ddd7c6'; c.fillRect(0, 0, 960, 540);
    c.save(); c.globalAlpha = 0.05;
    for (let i = 0; i < 40; i++)
      c.fillRect(hash2(i, 400) * 960, hash2(i, 401) * 540, 1.5 + hash2(i, 402) * 2, 1);
    c.restore();
  }

  // ---------------- PAGE 1: THE SONG (0-13) ----------------
  if (seg(0, 13)) {
    panel(14, 14, 932, 240, 0.2, (x, y, w, h, lo) => {
      // the machine city, whole — and the Song moving through its sky
      vista(x, y, w, h, 'rgba(40,120,120,$)', 0.16);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.strokeStyle = 'rgba(55,255,208,0.55)'; c.lineWidth = 2.4;
      c.shadowColor = '#37ffd0'; c.shadowBlur = 10;
      c.beginPath();
      for (let px = 0; px <= w; px += 5) {
        const yy = y + 52 + Math.sin(px * 0.02 - lo * 2.2) * 12 * Math.sin(px / w * Math.PI);
        px === 0 ? c.moveTo(x + px, yy) : c.lineTo(x + px, yy);
      }
      c.stroke();
      for (let i = 0; i < 4; i++) {
        const nx = x + ((i * 233 + lo * 46) % w), ny = y + 40 + Math.sin(lo * 2 + i * 2) * 14;
        ftxt('♪', nx, ny, 15 + (i % 2) * 5, 'rgba(55,255,208,0.8)');
      }
      c.restore();
      tone(x, y + h - 60, w, 60, 0.1);
      cap(x + 14, y + 12, 400, t('cine_c1'), lo);
    });
    panel(14, 268, 452, 258, 2.2, (x, y, w, h, lo) => {
      // the machine folk at their shift — the real NPCs
      c.fillStyle = '#191922'; c.fillRect(x, y, w, h);
      radialLight(x + w / 2, y + 30, 240, 'rgba(255,205,120,$)', 0.16);
      c.fillStyle = '#101016'; c.fillRect(x, y + h - 44, w, 44);
      c.strokeStyle = 'rgba(220,220,230,0.14)'; c.lineWidth = 1;
      for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(x + i * w / 4, y); c.lineTo(x + i * w / 4, y + h - 44); c.stroke(); }
      const floor = y + h - 44;
      if (typeof drawNPCBody === 'function')
        [['servo', -130, 2.9], ['ratchet', 0, 3.1], ['mono', 128, 2.9]].forEach(nn => {
          c.save(); c.translate(x + w / 2 + nn[1], floor); c.scale(nn[2], nn[2]);
          try { drawNPCBody(c, nn[0], T + nn[1], false); } catch (e2) {}
          c.restore();
        });
      tone(x, floor - 30, w, 74, 0.12);
      cap(x + 12, y + 12, 300, t('cine_c2'), lo - 0.4);
    });
    panel(480, 268, 466, 258, 4.4, (x, y, w, h, lo) => {
      // MOTHER-V serene — the broadcast heart, singing
      c.fillStyle = '#12121c'; c.fillRect(x, y, w, h);
      radialLight(x + w / 2, y + h * 0.46, 230, 'rgba(55,255,208,$)', 0.14);
      if (typeof drawMother === 'function') {
        const bx = x + w / 2, by = y + h * 0.52;
        const mb = ci.mb1 || (ci.mb1 = {
          w: 120, h: 120, st: 'dorm', mPhase: 0, hp: 1, hpMax: 1, hurtT: 0,
          cx() { return 0; }, cy() { return 0; },
        });
        mb.anim = T;
        c.save(); c.translate(bx, by); c.scale(0.78, 0.78);
        try { drawMother(c, mb); } catch (e2) {}
        c.restore();
      }
      for (let i = 0; i < 3; i++) {
        const k = ((lo * 0.5 + i * 0.33) % 1);
        ftxt('♪', x + w / 2 + 90 + i * 26 - k * 30, y + h * 0.4 - k * 90, 14 + i * 3,
          'rgba(55,255,208,' + (0.8 - k * 0.7) + ')');
      }
      tone(x, y, w, 40, 0.1);
      cap(x + 12, y + h - 62, 320, t('cine_c3'), lo - 0.5);
    });
  }
  // ---------------- PAGE 2: THE FALL (13-25) ----------------
  else if (seg(13, 25)) {
    panel(14, 14, 452, 512, 13.2, (x, y, w, h, lo) => {
      // the corruption reaches her: the same heart, torn by the null signal
      c.fillStyle = '#140e14'; c.fillRect(x, y, w, h);
      radialLight(x + w / 2, y + h * 0.42, 260, 'rgba(230,57,70,$)', 0.15);
      const bx = x + w / 2, by = y + h * 0.5;
      // expanding null rings, red
      for (let i = 0; i < 4; i++) {
        const r = ((lo * 90 + i * 70) % 300);
        c.save(); c.globalAlpha = clamp(1 - r / 300, 0, 1) * 0.6;
        c.strokeStyle = i % 2 ? '#e63946' : '#b48cff'; c.lineWidth = 2.6;
        c.beginPath(); c.arc(bx, by, 30 + r, 0, 7); c.stroke(); c.restore();
      }
      if (typeof drawMother === 'function') {
        const mb = ci.mb2 || (ci.mb2 = {
          w: 120, h: 120, st: 'nwcharge', mPhase: 1, hp: 0.55, hpMax: 1, hurtT: 0,
          cx() { return 0; }, cy() { return 0; },
        });
        mb.anim = T;
        const jx = (T * 9 % 1) < 0.2 ? rnd(-4, 4) : 0;
        c.save(); c.translate(bx + jx, by); c.scale(0.92, 0.92);
        try { drawMother(c, mb); } catch (e2) {}
        c.restore();
      }
      // glitch bars tearing the panel
      for (let i = 0; i < 5; i++) {
        if (hash2(i, Math.floor(T * 7)) < 0.55) continue;
        const gy2 = y + hash2(i, Math.floor(T * 5)) * h;
        c.fillStyle = i % 2 ? 'rgba(230,57,70,0.28)' : 'rgba(180,140,255,0.22)';
        c.fillRect(x, gy2, w, 3 + hash2(i, 9) * 5);
      }
      sfxWord('KRRZZT', bx, y + 74, 42, -0.08, '#e63946');
      tone(x, y + h - 90, w, 90, 0.14);
      cap(x + 12, y + h - 64, 320, t('cine_c4'), lo - 0.3);
    });
    panel(480, 14, 466, 248, 15.4, (x, y, w, h, lo) => {
      // the signal itself, discoloring ring by ring
      c.fillStyle = '#0f0f14'; c.fillRect(x, y, w, h);
      for (let i = 0; i < 130; i++) {
        const sx2 = x + (hash2(i, Math.floor(T * 20)) * w) | 0, sy2 = y + (hash2(i + 300, Math.floor(T * 20)) * h) | 0;
        c.fillStyle = hash2(i, 40) > 0.5 ? 'rgba(220,220,225,0.22)' : 'rgba(10,10,14,0.6)';
        c.fillRect(sx2, sy2, 3, 3);
      }
      const bx = x + w / 2, by = y + h / 2;
      for (let i = 0; i < 5; i++) {
        const r2 = (lo * 60 + i * 40) % 200;
        const col = i < 2 ? '#37ffd0' : i < 4 ? '#b48cff' : '#e63946';
        c.save(); c.globalAlpha = clamp(1 - r2 / 200, 0, 1) * 0.8;
        c.strokeStyle = col; c.lineWidth = 3; c.shadowColor = col; c.shadowBlur = 10;
        c.beginPath(); c.arc(bx, by, 14 + r2, 0, 7); c.stroke(); c.restore();
      }
      speedBurst(bx, by, 70, 240, 12, 'rgba(220,220,230,0.22)', T * 0.2);
      cap(x + 12, y + 12, 280, t('cine_c5'), lo - 0.3);
    });
    panel(480, 276, 466, 250, 17.6, (x, y, w, h, lo) => {
      // the city under the command — every window an obeying red eye
      vista(x, y, w, h, 'rgba(160,30,40,$)', 0.34);
      for (let i = 0; i < 30; i++) {
        const kk = clamp((lo - hash2(i, 46) * 3) / 0.4, 0, 1);
        if (kk <= 0) continue;
        c.fillStyle = '#e63946'; c.shadowColor = '#e63946'; c.shadowBlur = 6;
        c.beginPath();
        c.arc(x + hash2(i, 44) * w, y + 30 + hash2(i, 45) * (h - 70), (1.6 + hash2(i, 47) * 3) * kk, 0, 7);
        c.fill();
      }
      c.shadowBlur = 0;
      tone(x, y, w, h, 0.12);
      cap(x + 12, y + h - 62, 300, t('cine_c6'), lo - 0.4);
    });
  }
  // ---------------- PAGE 3: THE GUARDIANS (25-41) ----------------
  else if (seg(25, 41)) {
    // four panels, four real guardians from their own sheets
    panel(14, 14, 452, 240, 25.3, (x, y, w, h, lo) => {
      c.fillStyle = '#120e18'; c.fillRect(x, y, w, h);
      radialLight(x + w / 2, y + h - 30, 250, 'rgba(150,80,255,$)', 0.2);
      c.fillStyle = '#0c0a10'; c.fillRect(x, y + h - 26, w, 26);
      if (typeof bFig === 'function') {
        c.save(); c.translate(x + w / 2 + 10, y + h - 28); c.scale(0.62, 0.62);
        try { bFig(c, 'aRoar', 0, 2.2); } catch (e2) {}
        c.restore();
      }
      speedBurst(x + w / 2 - 60, y + 70, 46, 130, 9, 'rgba(230,57,70,0.35)');
      sfxWord('RRAAGH', x + 128, y + 52, 34, -0.1, '#b48cff');
      nameTag(x + 8, y + h - 30, 'b_glitch');
      tone(x, y, w, 44, 0.12);
    });
    panel(480, 14, 466, 240, 27.3, (x, y, w, h, lo) => {
      c.fillStyle = '#100f15'; c.fillRect(x, y, w, h);
      radialLight(x + w / 2, y + 60, 220, 'rgba(230,57,70,$)', 0.13);
      if (typeof drawEagle === 'function') {
        const S = (120 * 3.0) / 532;
        const eb = ci.eb1 || (ci.eb1 = {
          w: 120, h: 100, st: 'dorm', hurtT: 0, dead: false, t: 0.5,
        });
        eb.x = x + w / 2 - 60; eb.y = y + 120; eb.anim = T;
        eb.spawnX = eb.x; eb.homeY = y + 120 - 100 / 2 + 300 * S - 26;
        c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
        try { drawEagle(c, eb); } catch (e2) {}
        c.restore();
      }
      sfxWord('SKREEE', x + w - 120, y + 46, 32, 0.09, '#e63946');
      nameTag(x + 8, y + h - 30, 'b_brood');
      tone(x, y + h - 50, w, 50, 0.12);
    });
    panel(14, 268, 452, 240, 29.3, (x, y, w, h, lo) => {
      c.fillStyle = '#0e1218'; c.fillRect(x, y, w, h);
      radialLight(x + w / 2, y + h * 0.45, 240, 'rgba(120,190,255,$)', 0.16);
      if (typeof glcHeroRig === 'function') {
        c.save(); c.translate(x + w / 2, y + h - 34); c.scale(0.5, 0.5);
        c.translate(0, Math.sin(T * 1.7) * 8);
        try { glcHeroRig(c, 0, 0, T * 3, 0.35, 0); } catch (e2) {}
        c.restore();
      }
      // frost breathing off her line of flight
      for (let i = 0; i < 8; i++)
        c.fillRect(x + ((i * 63 + T * 30) % w), y + 40 + hash2(i, 61) * (h - 90),
          1.8, 1.8);
      sfxWord('FSSSHH', x + 120, y + 50, 32, -0.07, '#a5d8ff');
      nameTag(x + 8, y + h - 30, 'b_zero');
      tone(x, y, w, 40, 0.1);
    });
    panel(480, 268, 466, 240, 31.3, (x, y, w, h, lo) => {
      c.fillStyle = '#170f0c'; c.fillRect(x, y, w, h);
      radialLight(x + w / 2, y + h - 20, 260, 'rgba(255,123,58,$)', 0.22);
      if (typeof drgFig === 'function') {
        c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
        c.translate(x + w / 2, y + h - 12); c.scale(-0.4, 0.4);
        try {
          drgFig(c, 'hero', 0, 1.2, -0.03);
          if (typeof drgGlow === 'function') drgGlow(c, 266, -292, 26, 0.6, false);
        } catch (e2) {}
        c.restore();
      }
      sfxWord('VWOOOM', x + w - 130, y + 52, 32, 0.08, '#ffd76a');
      nameTag(x + 8, y + h - 30, 'b_atlas');
      tone(x, y, w, 46, 0.12);
    });
    if (T > 33.5) cap(250, 512, 460, t('cine_c7'), T - 33.5);
  }
  // ---------------- PAGE 4: THE ONE THAT SLEPT (41-58) ----------------
  else if (seg(41, 58)) {
    panel(14, 14, 452, 512, 41.3, (x, y, w, h, lo) => {
      // the maintenance bay below the broadcast floor — and her, on standby
      c.fillStyle = '#0e0e13'; c.fillRect(x, y, w, h);
      // hanging cables
      c.strokeStyle = '#23232c'; c.lineWidth = 5;
      for (let i = 0; i < 4; i++) {
        c.beginPath(); c.moveTo(x + 40 + i * 110, y);
        c.quadraticCurveTo(x + 70 + i * 110, y + 120 + i * 18, x + 30 + i * 110, y + 200 + i * 26);
        c.stroke();
      }
      // one cyan worklight cone onto the cradle
      const lg = c.createLinearGradient(0, y, 0, y + h);
      lg.addColorStop(0, 'rgba(55,255,208,0.16)'); lg.addColorStop(0.8, 'rgba(55,255,208,0)');
      c.save(); c.beginPath();
      c.moveTo(x + w / 2 - 26, y); c.lineTo(x + w / 2 + 26, y);
      c.lineTo(x + w / 2 + 128, y + h); c.lineTo(x + w / 2 - 128, y + h); c.closePath();
      c.fillStyle = lg; c.fill(); c.restore();
      c.fillStyle = '#101016'; c.fillRect(x, y + h - 60, w, 60);
      // the cradle ring and the REAL cat inside it, dimmed to standby
      c.strokeStyle = '#2c2c34'; c.lineWidth = 6;
      c.beginPath(); c.arc(x + w / 2, y + h - 64, 74, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
      nyaReal(x + w / 2, y + h - 66, 3.1, { face: 1 });
      c.fillStyle = 'rgba(14,14,19,0.55)'; c.fillRect(x, y, w, h);   // standby dim
      // her visor still finds the light
      radialLight(x + w / 2 - 4, y + h - 156, 60, 'rgba(55,255,208,$)', 0.2);
      tone(x, y + h - 130, w, 130, 0.14);
      cap(x + 12, y + 14, 340, t('cine_c8'), lo - 0.3);
    });
    panel(480, 14, 466, 248, 44.5, (x, y, w, h, lo) => {
      // extreme close-up: the boot. The real portrait, four times life
      c.fillStyle = '#0c1016'; c.fillRect(x, y, w, h);
      const on = lo > 1.1;
      if (typeof drawPortrait === 'function') {
        c.save(); c.translate(x + w / 2, y + h / 2 + 10); c.scale(3.4, 3.4);
        try { drawPortrait(c, -32, -40, on ? 'curious' : 'sad', true); } catch (e2) {}
        c.restore();
      }
      if (!on) {
        c.fillStyle = 'rgba(10,14,20,0.5)'; c.fillRect(x, y, w, h);
        c.font = '600 12px monospace'; c.textAlign = 'left'; c.fillStyle = '#37ffd0';
        const rows = ['> frame NYA-9 : maintenance', '> song-link : NOT FOUND', '> boot?'];
        for (let i = 0; i < rows.length; i++)
          if (lo > 0.25 + i * 0.28) c.fillText(rows[i], x + 16, y + 24 + i * 16);
      } else {
        speedBurst(x + w / 2, y + h / 2, 90, 220, 14, 'rgba(55,255,208,0.25)');
        sfxWord('PING', x + w - 90, y + 40, 30, 0.08, '#37ffd0');
      }
      cap(x + 12, y + h - 62, 300, t('cine_c9'), lo - 1.4);
    });
    panel(480, 276, 466, 250, 48.5, (x, y, w, h, lo) => {
      // she stands. Red city behind the grate; her light in front of it
      c.fillStyle = '#12090b'; c.fillRect(x, y, w, h);
      radialLight(x + w - 80, y + h / 2, 220, 'rgba(230,57,70,$)', 0.2);
      c.fillStyle = '#1c1c22';
      for (let i = 0; i < 9; i++) c.fillRect(x + w - 190 + i * 20, y, 8, h);
      c.fillStyle = '#101016'; c.fillRect(x, y + h - 40, w, 40);
      nyaReal(x + 150, y + h - 40, 3.4, { face: 1, idle: 2 });
      speedBurst(x + 150, y + h - 106, 66, 120, 10, 'rgba(55,255,208,0.12)');
      tone(x, y, w, 50, 0.1);
      cap(x + 12, y + 12, 300, t('cine_c10'), lo - 0.4);
    });
  }
  // ---------------- TITLE CARD (58+) ----------------
  else {
    const local = T - TITLE_AT;
    c.fillStyle = '#050508'; c.fillRect(0, 0, 960, 540);
    c.save(); c.globalAlpha = 0.1;
    c.translate(-((local * 2) % 200), 0);
    citySil(560, 141, false); citySil(760, 143, false);
    c.restore();
    for (let i = 0; i < 50; i++) {
      const sy2 = (hash2(i, 151) * 540 + local * 3) % 540;
      c.fillStyle = 'rgba(200,220,235,' + (0.2 + hash2(i, 152) * 0.5) + ')';
      c.fillRect(hash2(i, 150) * 960, sy2, 1.8, 1.8);
    }
    // she walks the skyline under the title — the real figure, small
    nyaReal(480 + Math.sin(local * 0.4) * 6, 512, 1.7, { face: 1, idle: 1 });
    const title = t('title');
    const shown = Math.min(title.length, Math.floor(local / 0.3) + 1);
    const glitch = (local % 2) < 0.07;
    c.save();
    if (glitch) {
      c.save(); c.translate(2, 0); c.globalAlpha = 0.7;
      ftxt(title.slice(0, shown), 482, 220, 64, '#b48cff', 'center');
      c.restore();
    }
    ftxt(title.slice(0, shown), 480, 220, 64, '#37ffd0', 'center', '#37ffd0');
    c.restore();
    if (shown >= title.length) {
      c.globalAlpha = clamp((local - title.length * 0.3) / 1, 0, 1);
      ftxt(t('cine_sub'), 480, 278, 18, '#8a8a9a', 'center');
      c.globalAlpha = 1;
      const blink = (local % 1) < 0.65;
      if (blink) ftxt(t('press'), 480, 360, 18, '#cfe3ef', 'center');
      const vp = 0.5 + Math.sin(local * 2) * 0.3;
      c.fillStyle = 'rgba(55,255,208,' + vp + ')'; c.shadowColor = '#37ffd0'; c.shadowBlur = 8;
      c.fillRect(896, 496, 26, 9); c.shadowBlur = 0;
    }
  }
  // skip affordance + the ending glitch-out
  if (ci.promptT > 0 && T < 58) {
    c.save(); c.globalAlpha = Math.min(1, ci.promptT);
    ftxt(t('cine_skip'), 480, 508, 14, '#9fb8c8', 'center');
    if (ci.hold > 0) {
      c.strokeStyle = '#37ffd0'; c.lineWidth = 3;
      c.strokeRect(400, 520, 160, 8);
      c.fillStyle = '#37ffd0'; c.fillRect(402, 522, 156 * Math.min(1, ci.hold), 4);
    }
    c.restore();
  }
  if (ci.ending) {
    const gk = ci.glitchT;
    if (gk > 0.3) {
      // the title tearing itself apart
      for (let i = 0; i < 10; i++) {
        const gy2 = hash2(i, Math.floor(gk * 60)) * 540;
        c.fillStyle = ['#37ffd0', '#b48cff', '#e63946'][i % 3];
        c.globalAlpha = 0.25;
        c.fillRect(hash2(i + 5, Math.floor(gk * 60)) * 100 - 50, gy2, 960, 3 + hash2(i, 9) * 8);
      }
      c.globalAlpha = 1;
    } else {
      c.fillStyle = 'rgba(255,255,255,' + clamp(gk / 0.3, 0, 1) + ')';
      c.fillRect(0, 0, 960, 540);
    }
  }
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
  dimPanel(200, 80, 560, 390);
  ftxt(t('ctl_title'), 480, 120, 30, '#eef3fa', 'center', '#37ffd0');
  t('ctl').forEach((ln, i) => ftxt(ln, 480, 170 + i * 33, 15, '#cfe3ef', 'center', null, '600'));
  ftxt(t('ctl_nopad'), 480, 424, 12, '#66788a');
  ftxt(t('back') + ' — Esc / Enter', 480, 448, 13, '#7d93a8');
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
  ftxt(t('pad_move'), 480, 424, 12, '#8aa2b5');
  ftxt(t('pad_hint'), 480, 452, 13, '#cfe3ef');
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
function drawMap() {
  c.fillStyle = 'rgba(4,7,12,0.9)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('map_title'), 480, 40, 26, '#eef3fa', 'center', '#37ffd0');
  const cell = 62, ox = 70, oy = 56;
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
    if (BENCH_ROOMS.indexOf(id) >= 0) ftxt('◆', rc.x + 10, rc.y + 11, 11, '#aef7d8');
    if (id === 'A3') ftxt('⚙', rc.x + 10, rc.y + rc.h - 11, 11, '#ffd76a');
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
  ftxt('● ' + t('map_here') + '   ◆ ' + t('rest').replace('E — ', '') + '   ☠ ' + t('map_boss') + '   ⚙ ' + t('map_shop'), 480, 516, 13, '#7d93a8');
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
  ftxt('⚙ ' + G.save.scrap, 480, 86, 17, '#ffd76a');
  SHOP.forEach((it, i) => {
    const sel = i === G.shopIdx, sold = shopSold(it);
    const y = 130 + i * 46;
    if (sel) { c.fillStyle = 'rgba(255,215,106,0.08)'; rr(c, 160, y - 19, 640, 40, 8); c.fill(); }
    const name = it.type === 'crest' ? t('c_' + it.id) : t('s_' + it.id);
    const desc = it.type === 'crest' ? t('c_' + it.id + 'd') : t('s_' + it.id + 'd');
    const col = sold ? '#5a6a78' : sel ? '#eef3fa' : '#9ab0c2';
    ftxt(name, LANG === 'ar' ? 780 : 180, y - 6, 17, col, LANG === 'ar' ? 'right' : 'left');
    ftxt(desc, LANG === 'ar' ? 780 : 180, y + 13, 12, sold ? '#46545f' : '#7d93a8', LANG === 'ar' ? 'right' : 'left', null, '600');
    ftxt(sold ? t('sold') : '⚙ ' + Math.floor(it.cost * (relicHas('coin') ? 0.9 : 1)), LANG === 'ar' ? 180 : 780, y, 16, sold ? '#5a6a78' : '#ffd76a', LANG === 'ar' ? 'left' : 'right');
  });
  ftxt(t('shop_hint'), 480, 512, 13, '#7d93a8');
}

// ---------- boot ----------
// drop any pre-merge single-slot save so an old playthrough can never resurface
try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
// English is always the default/standard start; the picker is reachable any
// time from the menu's "Language" row (no forced foreign-language start).
loadMeta();
setMusic('title');
// first boot only: "The Broadcast Falls" — the manga opening plays once,
// then never again unless the save flag is cleared
try { if (!localStorage.getItem('cb_intro_seen')) startCine(); } catch (e) {}
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
function mainLoop(tms) {
  const dt = Math.min((tms - lastT) / 1000, 1 / 30);
  lastT = tms;
  if (typeof pollGamepad === 'function') pollGamepad();
  update(dt);
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
