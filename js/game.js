// NOSTOS — main loop, states, HUD, menus, save
const cv = document.getElementById('cv');
let c = cv.getContext('2d');
const mainCtx = c;
const SAVE_KEY = 'nostos_save', META_KEY = 'nostos_meta';
// accessibility / audience settings (persisted in meta)
let REDUCED_FLASH = false;   // dampens full-screen flashes for photosensitivity
let KIDS = false;            // gentler text, no obol loss on death, dev menu hidden, glossary on
// scales the alpha of any full-screen flash; 0.28 keeps effects readable without strobing
function flashScale() { return REDUCED_FLASH ? 0.28 : 1; }

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
  recharge: null, coreFlash: null, coresFullT: 0, healToasted: false,
  addRing(x, y, r0) { this.rings.push({ x, y, r: r0 || 12, a: 0.85 }); },
  toast(text) { this.toasts.push({ text, t: 3 }); },
  // one-time contextual explainer the first time a resource/term is earned
  firstSeen(flagKey, tKey) {
    if (!this.save || !this.save.flags || this.save.flags['fu_' + flagKey]) return;
    this.save.flags['fu_' + flagKey] = 1;
    this.toast(t(tKey));
  },
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
    // Kids mode: keep your obols on death (no Souls-style dropped pouch to recover)
    if (!KIDS && this.save.scrap > 0) {
      this.save.pouch = { room: this.roomId, x: clamp(player.x, 40, this.roomDef.w * TILE - 60), y: Math.min(player.y, 13 * TILE), amount: this.save.scrap };
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
    const grants = { glitch: 'dash', atlas: 'djump', zero: 'emp', brood: 'key' };
    if (grants[kind]) grantMod(grants[kind]);
    const tr = RELIC_TROPHY[kind];
    if (tr && !(this.save.relics || []).includes(tr)) {
      if (!this.save.relics) this.save.relics = [];
      this.save.relics.push(tr);
      this.toast(t('rl_' + tr) + ' — ' + t('rl_' + tr + 'd'));
    }
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
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) {} }
function loadStored() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify({ lang: LANG, muted: MUTED, music: MUSIC_ON, flash: REDUCED_FLASH, kids: KIDS })); } catch (e) {} }
function loadMeta() {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY));
    if (m) { LANG = m.lang || 'en'; MUTED = !!m.muted; MUSIC_ON = m.music !== false; REDUCED_FLASH = !!m.flash; KIDS = !!m.kids; }
  } catch (e) {}
}
function newSave(diff) {
  return {
    v: 1, diff, scrap: 0, coresMax: DIFFS[diff].cores, abil: {}, crests: [], equip: [],
    slots: 3, iq: 0, skills: [], relics: [], flags: {}, broken: {}, visited: {}, shop: {},
    bench: { room: 'A1', x: 80, y: 412 }, deaths: 0, lives: 0, time: 0,
    pouch: null, usedNine: false, won: false,
  };
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
  const sizes = { bench: [44, 52], chest: [30, 24], mod: [24, 24], term: [26, 32], npc: [32, 40], riddle: [26, 36], secret: [24, 24], trial: [46, 64], temple: [56, 58] };
  const [w, h] = sizes[type];
  G.statics.push({ type, x: tx * TILE + (TILE - w) / 2, y: ty * TILE - h, w, h, extra, flagKey, opened: !!(flagKey && G.save.flags[flagKey]), t: rnd(0, 9) });
}
function loadRoom(id) {
  G.roomId = id; G.roomDef = ROOMS[id]; G.grid = buildRoom(id);
  G.enemies = []; G.projs = []; G.pickups = []; G.statics = []; G.boss = null;
  G.wrecks = []; G.recharge = null;
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
function startGame(save) {
  save.iq = save.iq || 0; save.skills = save.skills || []; save.relics = save.relics || [];
  G.save = save;
  loadRoom(save.bench.room);
  player = new Player(save.bench.x, save.bench.y);
  player.cores = player.maxCores(); player.volts = 33;
  updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
  if (save.time < 1) {
    // the colorful backstory comic, then the cinematic title beat
    CX_START('intro', () => { G.state = 'INTRO'; G.introT = 0; G.introSlam = false; });
  }
  else G.state = 'PLAY';
}
function respawn() {
  if (G.save.diff === 2 && G.save.lives >= 9) { G.state = 'GAMEOVER'; return; }
  loadRoom(G.save.bench.room);
  player = new Player(G.save.bench.x, G.save.bench.y);
  player.cores = player.maxCores(); player.volts = 33;
  updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
  if (G.save.pouch) G.toast(t('pouch'));
  G.state = 'PLAY';
}
function bossActive() { return G.boss && !G.boss.dead && G.boss.st !== 'dorm'; }

// ---------- transitions ----------
function checkTransitions() {
  if (G.trans || bossActive()) return;
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  const ex = G.roomDef.exits || {};
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
  for (const s of G.statics) {
    if ((s.type === 'chest' || s.type === 'riddle') && s.opened) continue;
    const dx = (player.x + player.w / 2) - (s.x + s.w / 2);
    const dy = (player.y + player.h / 2) - (s.y + s.h / 2);
    if (Math.abs(dx) < 46 && Math.abs(dy) < 60) return s;
  }
  return null;
}
function doInteract(s) {
  if (s.type === 'npc') {
    const lines = t('d_' + s.extra).slice();
    G.dialog = { name: t('n_' + s.extra), lines, i: 0, npc: s.extra, onEnd: s.extra === 'hermes' ? () => { G.state = 'SHOP'; G.shopIdx = 0; } : null };
    G.state = 'DIALOG'; sfxVoice(s.extra);
  } else if (s.type === 'term') {
    G.dialog = { name: '…', lines: t('t' + s.extra).slice(), i: 0, onEnd: null, rs: RS_TERM[s.extra] };
    G.state = 'DIALOG'; sfx('ui');
  } else if (s.type === 'bench') {
    G.save.bench = { room: G.roomId, x: s.x, y: s.y + s.h - 38 };
    G.save.usedNine = false;
    persist(); sfx('bench'); sfx('cast');
    const dur = Math.max(1.1, (player.maxCores() - player.cores) * 0.18 + 1.1);
    G.recharge = { t: dur, tick: 0.4, x: s.x + s.w / 2, y: s.y + 14 };
    player.rechargeT = dur;
    player.volts = 99;
    burst(s.x + s.w / 2, s.y + 8, 20, '#8ff6ff', 220, 0.7, 100, 3, true);
  } else if (s.type === 'chest') {
    s.opened = true;
    if (s.flagKey) G.save.flags[s.flagKey] = 1;
    sfx('chest');
    if (s.extra === 'slot') { G.save.slots++; showItem(t('s_slot'), t('s_slotd')); }
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
    trOpenSingle(s.extra); sfx('ui');
  } else if (s.type === 'temple') {
    trOpenTemple(); sfx('ui');
  }
}

// ---------- update ----------
function fxDecay(dt) {
  G.flash = Math.max(0, G.flash - dt * 2.4);
  for (const r of G.rings) { r.r += 560 * dt; r.a -= dt * 2; }
  G.rings = G.rings.filter(r => r.a > 0);
  if (G.coreFlash) { G.coreFlash.t -= dt; if (G.coreFlash.t <= 0) G.coreFlash = null; }
  G.coresFullT = Math.max(0, G.coresFullT - dt);
  if (G.impact) { G.impact.t -= dt; if (G.impact.t <= 0) G.impact = null; }
}
function update(dt) {
  if (G.state === 'PLAY') {
    G.save.time += dt;
    fxDecay(dt);
    if (G.hitStop > 0) { G.hitStop -= dt; updateParts(dt * 0.25); return; }
    if (G.trans) {
      G.trans.t -= dt;
      if (!G.trans.half && G.trans.t < 0.14) { G.trans.half = true; applyTransition(); }
      if (G.trans.t <= 0) G.trans = null;
    } else {
      player.update(dt);
      if (bossActive()) player.x = clamp(player.x, 4, G.roomDef.w * TILE - player.w - 4);
      for (const e of G.enemies) if (!e.dead) e.update(dt);
      G.enemies = G.enemies.filter(e => !e.dead);
      if (G.boss) G.boss.update(dt);
      for (const p of G.projs) if (!p.dead) p.update(dt);
      G.projs = G.projs.filter(p => !p.dead);
      for (const w of G.wrecks) if (!w.dead) w.update(dt);
      G.wrecks = G.wrecks.filter(w => !w.dead);
      // recharge-pod sequence: cores refill one by one under electric surge
      if (G.recharge) {
        const rc = G.recharge;
        rc.t -= dt; rc.tick -= dt;
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
  else if (G.state === 'PAUSE') updatePause();
  else if (G.state === 'GLOSS') updateGloss();
  else if (G.state === 'COMIC') updateComic(dt);
  else if (G.state === 'TRIALS') updateTrials(dt);
  else if (G.state === 'DEV') updateDev();
  else if (G.state === 'MENU') updateMenu();
  else if (G.state === 'DIFF') updateDiff();
  else if (G.state === 'CTRL') { if (inP('BACK') || inP('OK')) { G.state = G.ctrlBack || 'MENU'; sfx('ui'); } }
  else if (G.state === 'INTRO') {
    G.introT += dt;
    if (inP('OK') || inP('ATK') || inP('BACK') || G.introT > 12.4) { G.state = 'PLAY'; sfx('ok'); }
  }
  else if (G.state === 'WIN') { if (inP('OK')) { G.state = 'MENU'; G.menuIdx = 0; setMusic('title'); } }
  else if (G.state === 'GAMEOVER') {
    if (inP('OK')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} G.save = null; G.state = 'MENU'; G.menuIdx = 0; setMusic('title'); }
  }
}
function menuOptions() {
  const opts = [];
  if (loadStored()) opts.push('continue');
  opts.push('new', 'controls', 'lang', 'sound', 'music', 'flash', 'kids');
  if (!KIDS) opts.push('dev'); // dev jump menu hidden while Kids mode is on
  return opts;
}
function updateMenu() {
  const opts = menuOptions();
  if (inP('DOWN')) { G.menuIdx = (G.menuIdx + 1) % opts.length; sfx('ui'); }
  if (inP('UP')) { G.menuIdx = (G.menuIdx + opts.length - 1) % opts.length; sfx('ui'); }
  if (inP('OK')) {
    const o = opts[G.menuIdx]; sfx('ok');
    if (o === 'continue') startGame(loadStored());
    else if (o === 'new') { G.state = 'DIFF'; G.diffIdx = 0; } // default cursor on the gentle Lotus-Eater
    else if (o === 'controls') { G.ctrlBack = 'MENU'; G.state = 'CTRL'; }
    else if (o === 'lang') { LANG = LANG === 'en' ? 'ar' : 'en'; saveMeta(); }
    else if (o === 'sound') { MUTED = !MUTED; saveMeta(); }
    else if (o === 'music') {
      MUSIC_ON = !MUSIC_ON; saveMeta();
      const nm = MUS.name;
      if (!MUSIC_ON) stopRecorded();
      else if (nm) { MUS.name = null; setMusic(nm); }
    }
    else if (o === 'flash') { REDUCED_FLASH = !REDUCED_FLASH; saveMeta(); }
    else if (o === 'kids') { KIDS = !KIDS; saveMeta(); if (G.menuIdx >= menuOptions().length) G.menuIdx = 0; }
    else if (o === 'dev') { G.state = 'DEV'; G.devIdx = 0; }
  }
}

// ---------- Workshop of Daedalus (developer jump menu) ----------
const DEV_ITEMS = (() => {
  const it = [];
  [['A4', 'Glitch'], ['B4', 'Atlas'], ['C3', 'Zero'], ['D3', 'Brood'], ['X1', 'Prism'], ['E3', 'Mother']]
    .forEach(([room, flag]) => it.push({ kind: 'boss', room, flag, label: () => t('b_' + flag.toLowerCase()) }));
  it.push({ kind: 'temple', label: () => t('tr_full') });
  ['stones', 'scales', 'numbers', 'song'].forEach(g => it.push({ kind: 'trial', game: g, label: () => t('tr_g_' + g) }));
  RIDDLES.forEach((r, i) => it.push({ kind: 'riddle', idx: i, label: () => t('rd_title') + ' ' + (i + 1) }));
  return it;
})();
function devEnsure() {
  if (!G.save) G.save = newSave(1);
  ['dash', 'djump', 'wall', 'emp', 'key'].forEach(m => { G.save.abil[m] = 1; });
  if (G.save.scrap < 400) G.save.scrap = 400;
}
function updateDev() {
  const n = DEV_ITEMS.length;
  if (inP('BACK')) { G.state = 'MENU'; sfx('ui'); return; }
  if (inP('DOWN')) { G.devIdx = (G.devIdx + 1) % n; sfx('ui'); }
  if (inP('UP')) { G.devIdx = (G.devIdx + n - 1) % n; sfx('ui'); }
  if (inP('LEFT')) { G.devIdx = (G.devIdx + n - 10) % n; sfx('ui'); }
  if (inP('RIGHT')) { G.devIdx = (G.devIdx + 10) % n; sfx('ui'); }
  if (inP('OK')) {
    const it = DEV_ITEMS[G.devIdx]; sfx('ok');
    devEnsure();
    if (it.kind === 'boss') {
      delete G.save.flags['boss' + it.flag];
      loadRoom(it.room);
      player = new Player(48, 380);
      player.cores = player.maxCores(); player.volts = 99;
      player.lastSafe = { x: player.x, y: player.y };
      updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
      G.state = 'PLAY';
    } else if (it.kind === 'temple' || it.kind === 'trial') {
      loadRoom('B3');
      player = new Player(12 * TILE, 420);
      player.cores = player.maxCores(); player.volts = 50;
      updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
      if (it.kind === 'temple') trOpenTemple(); else trOpenSingle(it.game);
    } else if (it.kind === 'riddle') {
      loadRoom('A1');
      player = new Player(80, 412);
      player.cores = player.maxCores();
      updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
      G.riddle = { def: RIDDLES[it.idx], sel: 0, st: { x: 100, y: 400, opened: false } };
      G.state = 'RIDDLE';
    }
  }
}
function drawDev() {
  dimPanel(60, 50, 840, 440);
  ftxt(t('dev_title'), 480, 84, 24, '#eef3fa', 'center', '#ffcf6a');
  DEV_ITEMS.forEach((it, i) => {
    const col = Math.floor(i / 10), y = 130 + (i % 10) * 34;
    const x = 130 + col * 420;
    const sel = i === G.devIdx;
    const tag = it.kind === 'boss' ? '☠' : it.kind === 'riddle' ? '?' : 'Δ';
    if (sel) { c.fillStyle = 'rgba(232,194,106,0.1)'; rr(c, x - 20, y - 15, 390, 30, 7); c.fill(); }
    ftxt(tag, x, y, 14, sel ? '#ffcf6a' : '#8a7a5c');
    ftxt((sel ? '▸ ' : '') + it.label(), x + 20, y, 15, sel ? '#eef3fa' : '#9ab0c2', 'left');
  });
  ftxt(t('dev_hint'), 480, 472, 13, '#7d93a8');
}

function updateDiff() {
  if (inP('DOWN')) { G.diffIdx = (G.diffIdx + 1) % 3; sfx('ui'); }
  if (inP('UP')) { G.diffIdx = (G.diffIdx + 2) % 3; sfx('ui'); }
  if (inP('BACK')) { G.state = 'MENU'; sfx('ui'); return; }
  if (inP('OK')) { sfx('ok'); startGame(newSave(G.diffIdx)); }
}
function updatePause() {
  const n = 8;
  if (inP('DOWN')) { G.pauseIdx = (G.pauseIdx + 1) % n; sfx('ui'); }
  if (inP('UP')) { G.pauseIdx = (G.pauseIdx + n - 1) % n; sfx('ui'); }
  if (inP('PAUSE')) { G.state = 'PLAY'; return; }
  if (inP('OK')) {
    sfx('ok');
    if (G.pauseIdx === 0) G.state = 'PLAY';
    else if (G.pauseIdx === 1) G.state = 'MAP';
    else if (G.pauseIdx === 2) { G.state = 'CREST'; G.crestIdx = 0; }
    else if (G.pauseIdx === 3) { G.state = 'SKILLS'; G.skillIdx = 0; }
    else if (G.pauseIdx === 4) G.state = 'RELICS';
    else if (G.pauseIdx === 5) { G.ctrlBack = 'PAUSE'; G.state = 'CTRL'; }
    else if (G.pauseIdx === 6) { G.state = 'GLOSS'; }
    else { persist(); setMusic('title'); G.state = 'MENU'; G.menuIdx = 0; }
  }
}
function updateGloss() { if (inP('OK') || inP('BACK') || inP('PAUSE')) { G.state = 'PAUSE'; sfx('ui'); } }
const GLOSS_TERMS = ['heart', 'ichor', 'metis', 'obol', 'blessing'];
function drawGloss() {
  c.fillStyle = 'rgba(4,7,12,0.9)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('gloss_title'), 480, 54, 28, '#eef3fa', 'center', '#ffd76a');
  const rtl = LANG === 'ar';
  GLOSS_TERMS.forEach((id, i) => {
    const y = 116 + i * 78;
    dimPanel(150, y - 26, 660, 66);
    ftxt(t('g_' + id), rtl ? 786 : 174, y - 6, 18, '#ffd76a', rtl ? 'right' : 'left');
    wrapText(t('g_' + id + '_d'), 620, 13).slice(0, 2).forEach((ln, j) =>
      ftxt(ln, rtl ? 786 : 174, y + 14 + j * 17, 13, '#c6d4e2', rtl ? 'right' : 'left', null, '600'));
  });
  ftxt(t('gloss_hint'), 480, 512, 13, '#7d93a8');
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
      sfx('win'); G.firstSeen('metis', 'fu_metis'); G.toast(t('rd_reward') + '  +' + r.def.iq + ' ' + t('sk_iq'));
      burst(r.st.x + 13, r.st.y + 12, 24, '#b48cff', 260, 0.8, 100, 4, true);
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
  // bidi: Arabic strings (incl. embedded numbers/latin like "Μ 0 ميتيس") resolve
  // correctly only with an rtl base direction; reset to ltr otherwise.
  c.direction = LANG === 'ar' ? 'rtl' : 'ltr';
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
function drawBG(P, px, py) {
  py = py || 0;
  const sky = c.createLinearGradient(0, 0, 0, 540);
  sky.addColorStop(0, P.sky[0]); sky.addColorStop(0.55, P.sky[1]); sky.addColorStop(1, P.far);
  c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
  // real Mediterranean artwork as the deepest layer, pre-tinted per zone (cached)
  const tinted = tintedBG(G.roomDef.zone);
  if (tinted) {
    const off = ((px * 0.12) % 960 + 960) % 960;
    c.globalAlpha = 0.42;
    c.drawImage(tinted, -off, -20 - py * 0.05);
    c.drawImage(tinted, 960 - off, -20 - py * 0.05);
    c.globalAlpha = 1;
  }
  const now = performance.now();
  const horizon = 285 - py * 0.18;
  // low sun / pale moon disc hanging over the horizon
  c.save();
  const sunX = 480 - ((px * 0.05) % 960 - 480) * 0.2;
  const sg = c.createRadialGradient(sunX, horizon - 60, 6, sunX, horizon - 60, 90);
  sg.addColorStop(0, P.glow); sg.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = 0.22; c.fillStyle = sg;
  c.fillRect(sunX - 90, horizon - 150, 180, 180);
  c.globalAlpha = 0.5; c.fillStyle = P.glow;
  c.beginPath(); c.arc(sunX, horizon - 60, 26, 0, 7); c.fill();
  c.restore(); c.globalAlpha = 1;
  // marble terrace grid converging on the horizon
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
  // three depth rows of ruined temples receding to the horizon
  for (const [z, alpha] of [[5, 0.3], [3.2, 0.5], [2.1, 0.75]]) {
    const sc = 1 / z, span = 620;
    const off = ((px * sc * 0.9) % span + span) % span;
    for (let i = -1; i < 3; i++) {
      const bx = i * span - off + hash2(i + z * 7, 50) * 120;
      const w = (150 + hash2(i, z) * 150) * sc * 2.2;
      const h = (150 + hash2(i, z + 1) * 200) * sc * 2.2;
      const by = horizon + 46 * sc * 2;
      c.globalAlpha = alpha; c.fillStyle = P.far;
      // stylobate + columns + (sometimes broken) pediment
      c.fillRect(bx, by - h * 0.16, w, h * 0.16);
      const ncol = Math.max(3, Math.floor(w / (26 * sc * 2.2)));
      const cw = w / (ncol * 2 - 1);
      for (let k = 0; k < ncol; k++) {
        const colh = h * (hash2(i * 7 + k, z) > 0.82 ? 0.35 + hash2(k, i) * 0.3 : 0.62);
        c.fillRect(bx + k * cw * 2, by - h * 0.16 - colh, cw, colh);
      }
      if (hash2(i, z + 3) > 0.35) {
        c.fillRect(bx - w * 0.04, by - h * 0.16 - h * 0.62 - 8 * sc * 2.2, w * 1.08, 8 * sc * 2.2);
        c.beginPath();
        c.moveTo(bx - w * 0.04, by - h * 0.16 - h * 0.62 - 8 * sc * 2.2);
        c.lineTo(bx + w / 2, by - h * 0.16 - h * 0.62 - (8 + h * 0.14) * sc * 2.2 - h * 0.14);
        c.lineTo(bx + w * 1.04, by - h * 0.16 - h * 0.62 - 8 * sc * 2.2);
        c.closePath(); c.fill();
      }
      // warm torchlight between the columns
      c.fillStyle = hash2(i, z + 4) > 0.5 ? P.glow : P.acc2;
      c.globalAlpha = alpha * 0.45;
      for (let k = 0; k < ncol - 1; k++)
        if (hash2(i * 3 + k, z + 9) > 0.6)
          c.fillRect(bx + k * cw * 2 + cw * 1.2, by - h * 0.16 - 16 * sc * 2.2, cw * 0.5, 8 * sc * 2.2);
      c.globalAlpha = 1;
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
    const sway = Math.sin(now / 3200 + i * 2.1) * 34;
    const g = c.createLinearGradient(bx, 0, bx + 150, 540);
    g.addColorStop(0, P.glow); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = 0.045 + 0.02 * Math.sin(now / 1700 + i * 2);
    c.beginPath();
    c.moveTo(bx, 0); c.lineTo(bx + 95, 0);
    c.lineTo(bx + 240 + sway, 540); c.lineTo(bx + 70 + sway, 540);
    c.closePath(); c.fillStyle = g; c.fill();
  }
  c.restore(); c.globalAlpha = 1;
  // layer 0 — far mountain ridges, barely darker than the sky
  c.globalAlpha = 0.5; c.fillStyle = P.far;
  for (let i = 0; i < 7; i++) {
    const h = 160 + hash2(i, 21) * 220;
    const xx = ((i * 300 - px * 0.1) % 1600 + 1600) % 1600 - 260;
    const w = 260 + hash2(i, 22) * 200;
    c.beginPath(); c.moveTo(xx - 40, 540);
    c.quadraticCurveTo(xx + w * 0.5, 540 - h * 1.25, xx + w + 40, 540);
    c.closePath(); c.fill();
  }
  c.globalAlpha = 1;
  // haze band separating far layers
  const hz = c.createLinearGradient(0, 180, 0, 540);
  hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(1, P.sky[1]);
  c.globalAlpha = 0.45; c.fillStyle = hz; c.fillRect(0, 180, 960, 360); c.globalAlpha = 1;
  // layer 1 — closer ruins: lone columns and statues on crags
  c.fillStyle = P.far;
  for (let i = 0; i < 12; i++) {
    const h = 100 + hash2(i, 1) * 200;
    const xx = ((i * 173 - px * 0.24) % 1400 + 1400) % 1400 - 200;
    const w = 80 + hash2(i, 2) * 60;
    c.fillRect(xx, 540 - h * 0.5, w, h * 0.5);                    // crag
    const kind = hash2(i, 24);
    if (kind > 0.62) {
      c.fillRect(xx + w * 0.3, 540 - h * 0.5 - h * 0.45, 12, h * 0.45);   // lone column
      c.fillRect(xx + w * 0.3 - 4, 540 - h * 0.5 - h * 0.45 - 6, 20, 6);  // capital
    } else if (kind > 0.34) {
      // amphora silhouette on the crag
      c.beginPath(); c.ellipse(xx + w * 0.5, 540 - h * 0.5 - 14, 10, 14, 0, 0, 7); c.fill();
      c.fillRect(xx + w * 0.5 - 4, 540 - h * 0.5 - 32, 8, 6);
    }
    if (hash2(i, 3) > 0.55) {
      c.fillStyle = P.glow;
      const blink = hash2(i, 30) > 0.85 ? (Math.sin(now / 700 + i) > 0 ? 1 : 0.1) : 1;
      c.globalAlpha = 0.2 * blink;
      c.fillRect(xx + w * 0.55, 540 - h * 0.5 - 10, 6, 10);       // brazier light
      c.globalAlpha = 1; c.fillStyle = P.far;
    }
  }
  // drifting sea-mist sheets
  for (let i = 0; i < 4; i++) {
    const fx = ((i * 380 + now * (0.006 + i * 0.002) - px * 0.32) % 1500 + 1500) % 1500 - 280;
    const fy = 250 + hash2(i, 40) * 220;
    c.globalAlpha = 0.07;
    c.fillStyle = P.sky[1];
    c.beginPath(); c.ellipse(fx, fy, 240, 46 + hash2(i, 41) * 30, 0, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
  // layer 2 — mid-ground: aqueduct arches and cypress trees
  c.fillStyle = P.mid;
  for (let i = 0; i < 9; i++) {
    const xx = ((i * 231 - px * 0.5) % 1500 + 1500) % 1500 - 220;
    const yy = 120 + hash2(i, 5) * 280;
    if (hash2(i, 8) > 0.45) {
      // aqueduct span: beam + two arches
      c.fillRect(xx, yy, 170 + hash2(i, 6) * 60, 13);
      for (const ax of [26, 96]) {
        c.beginPath(); c.arc(xx + ax + 26, yy + 13, 26, Math.PI, 0, true);
        c.lineTo(xx + ax + 46, yy + 60); c.lineTo(xx + ax + 40, yy + 60);
        c.arc(xx + ax + 26, yy + 13, 18, 0, Math.PI, false);
        c.lineTo(xx + ax - 14, yy + 60); c.lineTo(xx + ax - 20, yy + 60);
        c.closePath(); c.fill();
      }
    } else {
      // cypress tree
      const th = 60 + hash2(i, 7) * 50;
      c.beginPath(); c.ellipse(xx + 30, yy + th * 0.45, 13, th * 0.55, 0, 0, 7); c.fill();
      c.fillRect(xx + 27, yy + th * 0.9, 6, th * 0.2);
    }
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
            c.fillStyle = '#6aff9e'; c.shadowColor = '#6aff9e'; c.shadowBlur = 6;
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
    if (s.type === 'bench') {
      // hearth of Hestia — stone altar bowl with a living flame
      const mx = s.x + s.w / 2;
      const charging = G.recharge && Math.abs(G.recharge.x - mx) < 44;
      const now2 = performance.now();
      // stepped stone base
      c.fillStyle = '#6b5c48'; rr(c, s.x - 8, s.y + s.h - 8, s.w + 16, 8, 3); c.fill();
      c.fillStyle = '#7d6c54'; rr(c, s.x - 2, s.y + s.h - 16, s.w + 4, 10, 3); c.fill();
      // altar bowl with meander band
      c.fillStyle = '#8a7a60';
      c.beginPath(); c.moveTo(mx - 20, s.y + s.h - 16); c.lineTo(mx - 14, s.y + 22);
      c.lineTo(mx + 14, s.y + 22); c.lineTo(mx + 20, s.y + s.h - 16); c.closePath(); c.fill();
      c.fillStyle = '#9a8a6c'; rr(c, mx - 18, s.y + 18, 36, 8, 3); c.fill();
      drawMeander(c, mx - 16, s.y + s.h - 14, 32, 4, '#3a3226', 0.8);
      // the flame — layered tongues of fire
      const fl2 = Math.sin(now2 / 110 + s.t) * 3, fl3 = Math.sin(now2 / 150 + s.t * 2) * 2;
      const fg = c.createRadialGradient(mx, s.y + 12, 2, mx, s.y + 12, 26);
      fg.addColorStop(0, 'rgba(255,220,130,' + (charging ? 0.6 : 0.3) + ')');
      fg.addColorStop(1, 'rgba(255,150,60,0)');
      c.fillStyle = fg; c.beginPath(); c.arc(mx, s.y + 12, 26, 0, 7); c.fill();
      c.fillStyle = charging ? '#ffe9b8' : '#ff9c4a';
      c.beginPath(); c.moveTo(mx - 8, s.y + 20);
      c.quadraticCurveTo(mx - 9, s.y + 6 + fl2, mx, s.y - 2 + fl3);
      c.quadraticCurveTo(mx + 9, s.y + 6 - fl2, mx + 8, s.y + 20); c.closePath(); c.fill();
      c.fillStyle = charging ? '#ffffff' : '#ffd76a';
      c.beginPath(); c.moveTo(mx - 4, s.y + 20);
      c.quadraticCurveTo(mx - 4, s.y + 10 - fl3, mx, s.y + 5 + fl2 * 0.6);
      c.quadraticCurveTo(mx + 4, s.y + 10 + fl3, mx + 4, s.y + 20); c.closePath(); c.fill();
      if (chance(charging ? 0.5 : 0.14)) addPart(mx + rnd(-8, 8), s.y + rnd(0, 14), rnd(-14, 14), rnd(-70, -30), 0.5, chance(0.5) ? '#ffd76a' : '#ff9c4a', 2, -40, true);
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
    } else if (s.type === 'term') {
      // votive stone tablet on a plinth, carved with the Old Tongue
      c.fillStyle = '#5c5244'; c.fillRect(s.x + 8, s.y + 22, 10, 10);
      c.fillStyle = '#8a7d68'; rr(c, s.x - 1, s.y, s.w + 2, 24, 3); c.fill();
      c.strokeStyle = '#4a4234'; c.lineWidth = 1; rr(c, s.x - 1, s.y, s.w + 2, 24, 3); c.stroke();
      c.fillStyle = '#3a3226'; c.globalAlpha = 0.85;
      for (let k = 0; k < 3; k++) c.fillRect(s.x + 4, s.y + 5 + k * 6, s.w - 8 - (k === 2 ? 8 : 0), 2);
      c.globalAlpha = 1;
      c.fillStyle = P.glow; c.globalAlpha = 0.35 + Math.sin(performance.now() / 600 + s.t) * 0.15;
      c.fillRect(s.x + 4, s.y + 5, 6, 2); c.globalAlpha = 1;
    } else if (s.type === 'trial') {
      drawTrialStation(s, P);
    } else if (s.type === 'temple') {
      drawTempleConsole(s, P);
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
      if (id === 'athena' && chance(0.03)) addPart(s.x + s.w / 2 + rnd(-14, 14), s.y + rnd(0, 24), rnd(-8, 8), rnd(-16, -5), 0.8, '#cfd8ff', 1.6, 0, true);
      if (id === 'hermes' && chance(0.012)) addPart(s.x + s.w / 2 - 14, s.y + 14, rnd(-10, 10), rnd(-60, -30), 0.5, '#ffd76a', 2, 300, true);
      if (id === 'eurylochus' && chance(0.02)) addPart(s.x + s.w / 2 + rnd(-6, 6), s.y - 2, rnd(-5, 5), rnd(-25, -12), 0.7, 'rgba(200,190,160,0.5)', 2, -20);
      if (id === 'tiresias' && chance(0.05)) addPart(s.x + s.w / 2 + rnd(-16, 16), s.y + rnd(0, 26), rnd(-8, 8), rnd(-14, -4), 1.1, '#9effd0', 1.6, 0, true);
      if (id === 'elpenor' && chance(0.03)) addPart(s.x + s.w / 2 + rnd(-6, 10), s.y + 2, rnd(-10, 10), rnd(-30, -12), 0.5, '#ffd08a', 1.8, -10, true);
      if (id === 'eumaeus' && chance(0.02)) addPart(s.x + s.w / 2 + rnd(-10, 10), s.y + s.h - 6, rnd(-20, 20), rnd(-30, -8), 0.4, 'rgba(160,140,110,0.5)', 2, 300);
      if (id === 'penelope' && chance(0.03)) addPart(s.x + s.w / 2 + rnd(-10, 10), s.y + 10, rnd(-6, 6), rnd(-18, -6), 0.8, '#e8c8ff', 1.5, -8, true);
      if (id === 'athena') {
        // grey-eyed goddess as an old helmsman: hooded sea-cloak, spear-staff, owl
        c.fillStyle = '#4a5a74'; // cloak
        c.beginPath(); c.moveTo(-13, 0); c.quadraticCurveTo(-15, -26, 0, -32);
        c.quadraticCurveTo(15, -26, 13, 0); c.closePath(); c.fill();
        c.fillStyle = '#38465c'; c.beginPath(); c.arc(0, -28, 9, Math.PI, 0); c.fill(); // hood
        c.fillStyle = '#d8b28a'; c.beginPath(); c.arc(0, -25, 6, 0, 7); c.fill();       // face
        c.fillStyle = '#cfd8ff'; c.shadowColor = '#cfd8ff'; c.shadowBlur = 8;           // grey eyes
        c.fillRect(-4, -27, 3, 2.4); c.fillRect(1.5, -27, 3, 2.4); c.shadowBlur = 0;
        c.strokeStyle = '#8a7a5c'; c.lineWidth = 2.4;                                    // spear-staff
        c.beginPath(); c.moveTo(12, 0); c.lineTo(12, -40); c.stroke();
        c.fillStyle = '#e8e2d0'; c.beginPath(); c.moveTo(9.6, -40); c.lineTo(12, -48); c.lineTo(14.4, -40); c.closePath(); c.fill();
        // the little owl on her shoulder
        c.fillStyle = '#8a7a5c'; c.beginPath(); c.ellipse(-11, -32, 4, 5, 0, 0, 7); c.fill();
        c.fillStyle = '#ffd76a';
        c.beginPath(); c.arc(-12.5, -33.5, 1.2, 0, 7); c.arc(-9.5, -33.5, 1.2, 0, 7); c.fill();
      } else if (id === 'hermes') {
        // the trader god: winged cap, caduceus, coin pouch
        c.fillStyle = '#c8963c'; rr(c, -11, -22, 22, 22, 6); c.fill();                  // tunic
        c.fillStyle = '#d8b28a'; c.beginPath(); c.arc(0, -27, 7, 0, 7); c.fill();       // face
        c.fillStyle = '#e8c26a'; c.beginPath(); c.arc(0, -31, 7, Math.PI, 0); c.fill(); // cap
        c.fillStyle = '#fffcf0';                                                         // cap wings
        c.beginPath(); c.moveTo(-7, -32); c.quadraticCurveTo(-14, -38, -16, -31); c.quadraticCurveTo(-11, -30, -7, -30); c.fill();
        c.beginPath(); c.moveTo(7, -32); c.quadraticCurveTo(14, -38, 16, -31); c.quadraticCurveTo(11, -30, 7, -30); c.fill();
        c.fillStyle = '#3a2a10'; c.fillRect(-4, -28, 2.6, 2.2); c.fillRect(2, -28, 2.6, 2.2);
        c.strokeStyle = '#a8853f'; c.lineWidth = 2;                                      // caduceus
        c.beginPath(); c.moveTo(13, -2); c.lineTo(13, -34); c.stroke();
        c.beginPath(); c.arc(11, -35, 2.5, 0, 5); c.arc(15, -35, 2.5, Math.PI, 6); c.stroke();
        c.fillStyle = '#6b4a2a'; c.beginPath(); c.arc(-12, -6, 5, 0, 7); c.fill();       // coin pouch
        c.fillStyle = '#ffd76a'; c.fillRect(-13.5, -9, 3, 2);
      } else if (id === 'eurylochus') {
        // the wary shipmate: patched sailor's tunic, rope coil, worried brow
        c.fillStyle = '#7a6a4c'; rr(c, -10, -20, 20, 20, 5); c.fill();
        c.fillStyle = '#5c4c34'; c.fillRect(-10, -12, 20, 3);                            // rope belt
        c.fillStyle = '#d8a878'; c.beginPath(); c.arc(0, -25, 7, 0, 7); c.fill();
        c.fillStyle = '#3a2a1c'; rr(c, -6, -33, 12, 6, 3); c.fill();                     // hair
        c.fillStyle = '#2a1c10'; c.fillRect(-4, -26, 2.6, 2); c.fillRect(2, -26, 2.6, 2);
        c.strokeStyle = '#2a1c10'; c.lineWidth = 1;                                      // worried brows
        c.beginPath(); c.moveTo(-5, -29); c.lineTo(-1, -28); c.moveTo(5, -29); c.lineTo(1, -28); c.stroke();
        c.strokeStyle = '#8a7a5c'; c.lineWidth = 3;                                      // rope coil on shoulder
        c.beginPath(); c.arc(-11, -14, 5, 0, 7); c.stroke();
      } else if (id === 'elpenor') {
        // the youngest crewman: cheerful, wine cup, sitting on an amphora
        c.fillStyle = '#a84a3a'; c.beginPath(); c.ellipse(0, -4, 9, 8, 0, 0, 7); c.fill(); // amphora
        c.fillStyle = '#8a3a2c'; c.fillRect(-4, -14, 8, 4);
        c.fillStyle = '#c8b494'; rr(c, -8, -26, 16, 14, 5); c.fill();                    // tunic
        c.fillStyle = '#d8a878'; c.beginPath(); c.arc(0, -31, 6.5, 0, 7); c.fill();
        c.fillStyle = '#4a2c14'; c.beginPath(); c.arc(0, -34, 6.5, Math.PI, 0); c.fill();// curly hair
        c.fillStyle = '#2a1c10'; c.fillRect(-3.5, -32, 2.4, 2); c.fillRect(1.5, -32, 2.4, 2);
        c.strokeStyle = '#2a1c10'; c.lineWidth = 1;                                      // grin
        c.beginPath(); c.arc(0, -29, 3, 0.3, Math.PI - 0.3); c.stroke();
        c.fillStyle = '#c8963c';                                                          // raised cup
        c.beginPath(); c.moveTo(9, -30); c.lineTo(15, -30); c.lineTo(13, -24); c.lineTo(11, -24); c.closePath(); c.fill();
      } else if (id === 'tiresias') {
        // the blind prophet's shade: translucent, staff, blindfolded
        c.globalAlpha = 0.75 + Math.sin(performance.now() / 700 + s.t) * 0.12;
        c.fillStyle = 'rgba(158,255,208,0.4)';
        c.beginPath(); c.moveTo(-12, 2); c.quadraticCurveTo(-14, -30, 0, -36);
        c.quadraticCurveTo(14, -30, 12, 2);
        c.quadraticCurveTo(6, -4, 0, 2); c.quadraticCurveTo(-6, -4, -12, 2); c.fill();   // wisping robe
        c.fillStyle = 'rgba(220,255,240,0.8)'; c.beginPath(); c.arc(0, -30, 7, 0, 7); c.fill();
        c.fillStyle = '#2a4a3c'; c.fillRect(-7, -32, 14, 4);                             // blindfold
        c.fillStyle = 'rgba(220,255,240,0.9)'; rr(c, -5, -25, 10, 4, 2); c.fill();       // white beard
        c.strokeStyle = 'rgba(158,255,208,0.7)'; c.lineWidth = 2;                        // seer's staff
        c.beginPath(); c.moveTo(11, 2); c.lineTo(11, -38); c.stroke();
        c.beginPath(); c.arc(11, -40, 3, 0, 7); c.stroke();
        c.globalAlpha = 1;
      } else if (id === 'eumaeus') {
        // the loyal swineherd: rough cloak, crook, broad hat on his back
        c.fillStyle = '#6b5a40'; rr(c, -11, -22, 22, 22, 6); c.fill();
        c.fillStyle = '#4a3c28';                                                          // sheepskin shoulder
        c.beginPath(); c.ellipse(-5, -20, 8, 5, -0.3, 0, 7); c.fill();
        c.fillStyle = '#c89468'; c.beginPath(); c.arc(0, -27, 7, 0, 7); c.fill();
        c.fillStyle = '#8a7a5c'; c.beginPath(); c.arc(0, -24, 9, 0.4, Math.PI - 0.4); c.fill(); // grey beard
        c.fillStyle = '#2a1c10'; c.fillRect(-4, -28, 2.6, 2.2); c.fillRect(2, -28, 2.6, 2.2);
        c.strokeStyle = '#8a6a3a'; c.lineWidth = 2.6;                                    // shepherd's crook
        c.beginPath(); c.moveTo(12, 0); c.lineTo(12, -36); c.stroke();
        c.beginPath(); c.arc(9, -36, 3.5, -0.5, Math.PI + 0.4); c.stroke();
      } else if (id === 'penelope') {
        // the weaving queen: long gown, diadem, shuttle with thread
        const wg = c.createLinearGradient(0, -34, 0, 2);
        wg.addColorStop(0, '#c8a2c8'); wg.addColorStop(1, '#8a6a9a');
        c.fillStyle = wg;
        c.beginPath(); c.moveTo(-8, -26); c.lineTo(8, -26); c.quadraticCurveTo(13, -8, 10, 2);
        c.lineTo(-10, 2); c.quadraticCurveTo(-13, -8, -8, -26); c.closePath(); c.fill();
        c.fillStyle = '#e8c0a0'; c.beginPath(); c.arc(0, -31, 6.5, 0, 7); c.fill();
        c.fillStyle = '#3a2a20';                                                          // braided hair
        c.beginPath(); c.arc(0, -33, 6.5, Math.PI * 0.9, Math.PI * 2.1); c.fill();
        c.fillStyle = '#ffd76a'; c.fillRect(-5, -37.5, 10, 2);                            // diadem
        c.fillStyle = '#2a1c10'; c.fillRect(-3.5, -32, 2.4, 2); c.fillRect(1.5, -32, 2.4, 2);
        c.strokeStyle = '#e8e2d0'; c.lineWidth = 1.2;                                     // thread to shuttle
        const shy = Math.sin(performance.now() / 500 + s.t) * 3;
        c.beginPath(); c.moveTo(6, -22); c.quadraticCurveTo(12, -16 + shy, 14, -8 + shy); c.stroke();
        c.fillStyle = '#8a6a3a'; rr(c, 12, -9 + shy, 6, 3, 1.5); c.fill();               // the shuttle
      }
      c.restore();
    }
  }
  // interact hint
  if (G.near && G.state === 'PLAY') {
    const s = G.near;
    const label = s.type === 'npc' ? t('talk') : s.type === 'bench' ? t('rest') : s.type === 'term' ? t('read') : s.type === 'riddle' ? t('rd_hint') : s.type === 'secret' ? t('secret_hint') : s.type === 'trial' ? t('tr_hint_one') : s.type === 'temple' ? t('tr_hint') : t('open');
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
function drawHUD() {
  const P = PAL[G.roomDef.zone];
  // full-health celebration glow behind the row
  if (G.coresFullT > 0) {
    c.globalAlpha = G.coresFullT;
    c.fillStyle = 'rgba(174,247,216,0.25)';
    rr(c, 8, 8, player.maxCores() * 30 + 8, 36, 10); c.fill();
    c.globalAlpha = 1;
  }
  // hearts as round hoplite shields (aspis)
  for (let i = 0; i < player.maxCores(); i++) {
    const x = 26 + i * 30, y = 26, full = i < player.cores;
    const fl = G.coreFlash && G.coreFlash.i === i ? G.coreFlash.t : 0;
    c.save(); c.translate(x, y);
    if (fl > 0) c.scale(1 + fl * 0.9, 1 + fl * 0.9);
    if (full) { c.shadowColor = fl > 0 ? '#aef7d8' : P.glow; c.shadowBlur = 8 + fl * 26; }
    c.fillStyle = fl > 0.25 ? '#ffffff' : (full ? '#c8963c' : 'rgba(90,105,125,0.45)');
    c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = full ? '#e8c26a' : 'rgba(120,130,145,0.5)'; c.lineWidth = 2;
    c.beginPath(); c.arc(0, 0, 8, 0, 7); c.stroke();
    c.fillStyle = full ? '#6b4520' : 'rgba(70,80,95,0.5)';
    c.beginPath(); c.arc(0, 0, 3, 0, 7); c.fill();
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
  // scrap + knowledge (a touch larger on phones, where the canvas is letterboxed small)
  const big = (TOUCH && TOUCH.enabled) ? 1 : 0;
  ftxt('◎ ' + G.save.scrap, 76, 66, 17 + big * 4, '#ffd76a', 'left', null, '700');
  ftxt('Μ ' + (G.save.iq || 0) + ' ' + t('sk_iq'), 76, 90 + big * 2, 13 + big * 4, '#c8a2ff', 'left', null, '700');
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
    drawGlyphText(c, GREEK_B[b.kind] || '', 480, 464, 9, 'rgba(255,235,190,0.5)');
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
    drawGlyphText(c, GREEK_Z[G.roomDef.zone] || '', 480, 122, 13, 'rgba(255,235,190,0.75)', PAL[G.roomDef.zone].glow);
    c.globalAlpha = 1;
  }
}
function lightAt(x, y, r, color, a) {
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
  // faint rim behind each enemy so silhouettes never vanish into dark ground
  for (const e of G.enemies) if (!e.dead) lightAt(e.x + e.w / 2, e.y + e.h / 2, 40, e.kind === 'turret' ? '#ff8f6a' : '#fff2d0', 0.16);
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
  if (G.roomId === 'D3' && !G.save.flags.bossBrood) {
    const spu = 0.5 + Math.sin(performance.now() / 300) * 0.2;
    c.fillStyle = 'rgba(125,234,200,' + (0.3 * spu + 0.25) + ')';
    c.fillRect(15 * TILE, 15 * TILE, 3 * TILE, 2 * TILE);
    ftxt('⚷', 16.5 * TILE, 15.8 * TILE, 22, '#7deac8', 'center', '#7deac8');
  }
  // ambient darkness — dynamic lights lift what matters (eased for readability)
  c.fillStyle = 'rgba(3,6,14,0.11)';
  c.fillRect(cam.x - 12, cam.y - 12, 984, 564);
  drawStatics(P);
  for (const p of G.pickups) p.draw(c);
  for (const e of G.enemies) e.draw(c);
  for (const w of G.wrecks) w.draw(c);
  if (G.boss) G.boss.draw(c);
  for (const p of G.projs) p.draw(c);
  if (player) player.draw(c);
  // electric surge arcs while recharging at a pod
  if (G.recharge && player) {
    c.save(); c.globalCompositeOperation = 'lighter';
    c.strokeStyle = '#8ff6ff'; c.shadowColor = '#8ff6ff'; c.shadowBlur = 12;
    const tx2 = player.x + 12, ty2 = player.y + 14;
    for (let k = 0; k < 2; k++) {
      c.lineWidth = k ? 1.2 : 2.4; c.globalAlpha = rnd(0.4, 0.95);
      c.beginPath();
      c.moveTo(G.recharge.x, G.recharge.y - 16);
      for (let s2 = 1; s2 <= 4; s2++) {
        const q = s2 / 5;
        c.lineTo(G.recharge.x + (tx2 - G.recharge.x) * q + rnd(-9, 9),
                 (G.recharge.y - 16) + (ty2 - (G.recharge.y - 16)) * q + rnd(-9, 9));
      }
      c.lineTo(tx2, ty2); c.stroke();
    }
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
  // manga impact frame: white panel + radial action lines
  if (G.impact && G.impact.t > 0) {
    const k = G.impact.t / G.impact.t0;
    const sx = G.impact.x - cam.x, sy = G.impact.y - cam.y;
    c.fillStyle = 'rgba(255,255,255,' + (0.82 * k * flashScale()) + ')';
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
  if (G.flash > 0) {
    c.fillStyle = 'rgba(255,255,255,' + (G.flash * 0.32 * flashScale()) + ')';
    c.fillRect(0, 0, 960, 540);
  }
  scanOverlay();
}
function dimPanel(x, y, w, h) {
  c.fillStyle = 'rgba(14,10,6,0.9)'; rr(c, x, y, w, h, 12); c.fill();
  c.strokeStyle = 'rgba(232,194,106,0.4)'; c.lineWidth = 1.5; rr(c, x, y, w, h, 12); c.stroke();
  drawMeander(c, x + 14, y + 6, w - 28, 6, 'rgba(232,194,106,0.55)', 0.5);
}
function drawMenuBG(tsec) {
  // night over the wine-dark sea
  const sky = c.createLinearGradient(0, 0, 0, 540);
  sky.addColorStop(0, '#0a0e1c'); sky.addColorStop(0.7, '#1c2440'); sky.addColorStop(1, '#2a1c14');
  c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
  for (let i = 0; i < 40; i++) {
    const xx = hash2(i, 11) * 960, yy = (hash2(i, 12) * 540 + tsec * (6 + hash2(i, 13) * 14)) % 400;
    c.fillStyle = 'rgba(255,240,200,' + (0.1 + hash2(i, 14) * 0.3) + ')';
    c.fillRect(xx, yy, 2, 2);
  }
  // temple colonnade silhouette on the right
  c.save(); c.globalAlpha = 0.5; c.fillStyle = '#151a2a';
  c.fillRect(600, 430, 340, 20);                                  // stylobate
  for (let k = 0; k < 5; k++) {
    const colx = 630 + k * 66;
    c.fillRect(colx, 300, 26, 130);                               // column shafts
    c.fillRect(colx - 5, 292, 36, 10);                            // capitals
  }
  c.beginPath(); c.moveTo(600, 292); c.lineTo(770, 240); c.lineTo(940, 292); c.closePath(); c.fill(); // pediment
  c.restore();
  // great Corinthian helmet silhouette, watching
  c.save(); c.translate(760, 372); c.globalAlpha = 0.75;
  c.fillStyle = '#101828';
  c.beginPath();
  c.moveTo(-78, 60);
  c.quadraticCurveTo(-84, -50, 0, -66);
  c.quadraticCurveTo(84, -50, 78, 60);
  c.lineTo(48, 60); c.lineTo(48, 12);
  c.lineTo(20, 2); c.lineTo(8, 60); c.lineTo(-8, 60); c.lineTo(-20, 2);
  c.lineTo(-48, 12); c.lineTo(-48, 60);
  c.closePath(); c.fill();
  // tall crest
  c.fillStyle = '#3a1c22';
  c.beginPath(); c.moveTo(-58, -52); c.quadraticCurveTo(0, -110 - Math.sin(tsec * 1.4) * 5, 66, -50);
  c.quadraticCurveTo(10, -78, -50, -40); c.closePath(); c.fill();
  // eye-slits glowing warm
  c.fillStyle = '#ffcf6a'; c.shadowColor = '#ffcf6a'; c.shadowBlur = 30;
  c.globalAlpha = 0.55 + Math.sin(tsec * 2) * 0.15;
  c.fillRect(-42, -18, 30, 10); c.fillRect(14, -18, 30, 10);
  c.restore(); c.shadowBlur = 0; c.globalAlpha = 1;
  // meander friezes top and bottom
  drawMeander(c, 20, 14, 920, 9, 'rgba(232,194,106,0.6)', 0.55);
  drawMeander(c, 20, 518, 920, 9, 'rgba(232,194,106,0.6)', 0.55);
}
function draw(tms) {
  const tsec = tms / 1000;
  c.clearRect(0, 0, 960, 540);
  const st = G.state;
  if (st === 'MENU' || st === 'DIFF' || st === 'DEV' || (st === 'CTRL' && G.ctrlBack === 'MENU') || st === 'GAMEOVER') {
    drawMenuBG(tsec);
    if (st === 'MENU') {
      ftxt(t('title'), 340, 120, 64, '#eef3fa', 'center', '#ffcf6a');
      ftxt(t('subtitle'), 340, 168, 17, '#9fb8c8');
      drawGlyphText(c, RS_TITLE, 340, 200, 13, 'rgba(232,194,106,0.8)', 'rgba(232,194,106,0.5)');
      const opts = menuOptions();
      const labels = {
        continue: t('menu_continue'), new: t('menu_new'), controls: t('menu_controls'),
        lang: t('menu_lang'), sound: MUTED ? t('menu_sound_off') : t('menu_sound_on'),
        music: MUSIC_ON ? t('menu_music_on') : t('menu_music_off'),
        flash: REDUCED_FLASH ? t('menu_flash_on') : t('menu_flash_off'),
        kids: KIDS ? t('menu_kids_on') : t('menu_kids_off'),
        dev: t('menu_dev'),
      };
      opts.forEach((o, i) => {
        const sel = i === G.menuIdx;
        ftxt((sel ? '▸ ' : '') + labels[o], 340, 250 + i * 40, 22, sel ? '#eef3fa' : '#7d93a8', 'center', sel ? '#ffcf6a' : null);
      });
      ftxt('v1.0', 930, 520, 12, '#44586b', 'right');
      ftxt('♪ Eric Matyas (soundimage.org, CC-BY) · cynicmusic (CC0) · SFX Berklee College of Music (CC-BY), rubberduck (CC0)', 12, 528, 9, 'rgba(120,130,145,0.75)', 'left');
    } else if (st === 'DIFF') {
      ftxt(t('diff_title'), 480, 90, 40, '#eef3fa', 'center', '#ffcf6a');
      for (let i = 0; i < 3; i++) {
        const sel = i === G.diffIdx;
        dimPanel(230, 150 + i * 105, 500, 88);
        if (sel) { c.strokeStyle = '#ffcf6a'; c.lineWidth = 2; rr(c, 230, 150 + i * 105, 500, 88, 12); c.stroke(); }
        ftxt((sel ? '▸ ' : '') + t('diff' + i), 480, 182 + i * 105, 24, sel ? '#eef3fa' : '#8aa2b5');
        ftxt(t('diff' + i + 'd'), 480, 212 + i * 105, 14, '#7d93a8');
      }
    } else if (st === 'GAMEOVER') {
      ftxt(t('gameover'), 480, 220, 52, '#ff5f6d', 'center', '#ff5f6d');
      ftxt(t('gameover2'), 480, 285, 18, '#9fb8c8');
      ftxt(t('press'), 480, 360, 16, '#7d93a8');
    }
    if (st === 'DEV') drawDev();
    if (st === 'CTRL' && G.ctrlBack === 'MENU') drawCtrl();
    return;
  }
  if (st === 'COMIC') { drawComic(); return; }
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
      c.strokeStyle = 'rgba(232,194,106,0.25)'; c.lineWidth = 3;
      for (let i = 0; i < 20; i++) {
        const a = i / 20 * Math.PI * 2 + 0.1;
        c.beginPath();
        c.moveTo(480 + Math.cos(a) * 150, 240 + Math.sin(a) * 95);
        c.lineTo(480 + Math.cos(a) * 640, 240 + Math.sin(a) * 430);
        c.stroke();
      }
      const k = Math.min(1, (T - 9.6) / 0.25);
      c.save(); c.translate(480, 235); c.scale(2.4 - 1.4 * k, 2.4 - 1.4 * k);
      ftxt(t('title'), 0, 0, 72, '#eef3fa', 'center', '#ffcf6a');
      c.restore();
      ftxt(t('intro4'), 480, 335, 30, '#ff5f6d', 'center', '#ff5f6d');
      if (T < 10.2) { c.fillStyle = 'rgba(255,255,255,' + Math.max(0, 1 - (T - 9.6) / 0.6) * flashScale() + ')'; c.fillRect(0, 0, 960, 540); }
    }
    ftxt(t('intro_skip'), 480, 512, 13, '#546b7d');
    return;
  }
  if (st === 'WIN') {
    drawMenuBG(tsec);
    ftxt(t('win1'), 480, 120, 52, '#aef7d8', 'center', '#ffcf6a');
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
    ftxt(t('win3'), 480, 430, 22, '#eef3fa', 'center', '#ffcf6a');
    ftxt(t('press'), 480, 480, 15, '#7d93a8');
    return;
  }
  // in-world states render the world behind
  drawWorldFrame();
  drawHUD();
  if (G.trans) {
    const k = G.trans.half ? 1 - (0.14 - G.trans.t) / 0.14 : (0.28 - G.trans.t) / 0.14;
    c.fillStyle = 'rgba(3,5,9,' + clamp(k, 0, 1) + ')'; c.fillRect(0, 0, 960, 540);
  }
  if (st === 'DEAD') {
    c.fillStyle = 'rgba(8,4,8,' + clamp((1.8 - G.deadT) * 1.2, 0, 0.85) + ')';
    c.fillRect(0, 0, 960, 540);
    ftxt(t(KIDS ? 'death_kids' : 'death'), 480, 250, KIDS ? 40 : 46, KIDS ? '#7ad4ff' : '#ff5f6d', 'center', KIDS ? '#7ad4ff' : '#ff5f6d');
  } else if (st === 'PAUSE') {
    c.fillStyle = 'rgba(4,7,12,0.75)'; c.fillRect(0, 0, 960, 540);
    ftxt(t('paused'), 480, 120, 38, '#eef3fa', 'center', '#ffcf6a');
    [t('resume'), t('pm_map'), t('pm_crests'), t('pm_skills'), t('pm_relics'), t('ctl_title'), t('pm_gloss'), t('to_menu')].forEach((s, i) => {
      const sel = i === G.pauseIdx;
      ftxt((sel ? '▸ ' : '') + s, 480, 190 + i * 40, 21, sel ? '#eef3fa' : '#7d93a8');
    });
  } else if (st === 'CTRL') {
    drawCtrl();
  } else if (st === 'DIALOG' && G.dialog) {
    const d = G.dialog;
    dimPanel(140, 386, 680, 118);
    ftxt(d.name, LANG === 'ar' ? 790 : 170, 410, 16, '#ffcf6a', LANG === 'ar' ? 'right' : 'left');
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
  } else if (st === 'GLOSS') {
    drawGloss();
  } else if (st === 'TRIALS') {
    drawTrials();
  }
}
function drawCtrl() {
  dimPanel(200, 80, 560, 390);
  ftxt(t('ctl_title'), 480, 120, 30, '#eef3fa', 'center', '#ffcf6a');
  t('ctl').forEach((ln, i) => ftxt(ln, 480, 170 + i * 33, 15, '#cfe3ef', 'center', null, '600'));
  ftxt(t('back') + ' — Esc / Enter', 480, 445, 13, '#7d93a8');
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
const MAP_BOSSROOM = { A4: 'Glitch', B4: 'Atlas', C3: 'Zero', D3: 'Brood', X1: 'Prism', E3: 'Mother' };
// how many collectibles (secret relics, unopened chests, uncollected abilities)
// still remain in a room — powers the backtracking ★ marker on the chart.
function roomSecretsLeft(id) {
  const def = ROOMS[id]; if (!def) return 0;
  let n = 0;
  def.ents.forEach((e, i) => {
    const [kind, , , extra, cond] = e;
    if (cond && !G.save.flags[cond]) return;
    if (kind === 'secret') { if (!G.save.flags['sr_' + extra]) n++; }
    else if (kind === 'chest') { if (!G.save.flags['ch_' + id + '_' + i]) n++; }
    else if (kind === 'mod') { if (!G.save.abil[extra]) n++; }
  });
  return n;
}
function drawMap() {
  c.fillStyle = 'rgba(4,7,12,0.9)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('map_title'), 480, 40, 26, '#eef3fa', 'center', '#ffcf6a');
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
    if (id === 'A3') ftxt('◎', rc.x + 10, rc.y + rc.h - 11, 11, '#ffd76a');
    if (MAP_BOSSROOM[id]) {
      const done = G.save.flags['boss' + MAP_BOSSROOM[id]];
      ftxt(done ? '✓' : '☠', rc.x + rc.w - 11, rc.y + 11, 12, done ? '#7de8a0' : '#ff6a7a');
    }
    // ★ = this explored room still hides something — come back with new gifts
    if (roomSecretsLeft(id) > 0) {
      const tw = 0.6 + Math.sin(performance.now() / 300 + rc.x) * 0.4;
      ftxt('★', rc.x + rc.w - 11, rc.y + rc.h - 11, 12, 'rgba(255,215,106,' + tw + ')', 'center', '#ffd76a');
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
  ftxt('● ' + t('map_here') + '   ◆ ' + t('rest').replace('E — ', '') + '   ☠ ' + t('map_boss') + '   ◎ ' + t('map_shop') + '   ★ ' + t('map_secret'), 480, 508, 13, '#7d93a8');
  ftxt(t('map_backtrack'), 480, 528, 12, '#6a8298');
}
function drawCrest() {
  c.fillStyle = 'rgba(4,7,12,0.85)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('crest_title'), 480, 50, 28, '#eef3fa', 'center', '#ffcf6a');
  const used = G.save.equip.reduce((s, x) => s + CRESTS[x], 0);
  // sockets
  for (let i = 0; i < effSlots(); i++) {
    const x = 480 - (effSlots() - 1) * 14 + i * 28;
    c.save(); c.translate(x, 92); c.rotate(Math.PI / 4);
    c.fillStyle = i < used ? '#ffcf6a' : 'rgba(90,110,130,0.4)';
    if (i < used) { c.shadowColor = '#ffcf6a'; c.shadowBlur = 8; }
    c.fillRect(-7, -7, 14, 14); c.restore(); c.shadowBlur = 0;
  }
  ftxt(t('crest_slots') + '  ' + used + ' / ' + effSlots(), 480, 124, 14, '#8aa2b5');
  const list = G.save.crests;
  if (!list.length) { ftxt(t('crest_none'), 480, 280, 17, '#7d93a8'); return; }
  list.forEach((id, i) => {
    const sel = i === G.crestIdx, eq = G.save.equip.indexOf(id) >= 0;
    const y = 170 + i * 40;
    if (sel) { c.fillStyle = 'rgba(232,194,106,0.08)'; rr(c, 180, y - 17, 430, 34, 8); c.fill(); }
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
loadMeta();
setMusic('title');
let lastT = 0;
function mainLoop(tms) {
  const dt = Math.min((tms - lastT) / 1000, 1 / 30);
  lastT = tms;
  update(dt);
  draw(tms);
  drawTouchUI();
  clearP();
  requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);
