// THE CAST REEL. One film of every character in the game doing every move it
// has, drawn by the game's own renderers, with the sound the game makes for
// each move — so the whole restyle can be checked in one sitting instead of
// room by room.
//
// It is not a mock-up. The shipped build boots in a real browser, the real
// update() advances the world one fixed step at a time, the real draw() paints
// each frame, and the camera is cut to a 2x crop around whoever is being
// filmed. Every sound the game asks for while the film runs — sfx(), a
// foley take through playBuf(), a machine-person's line through npcSay() —
// is rendered through an OfflineAudioContext at the moment it is asked for,
// with the game's state as it was at that moment, and laid on the reel's
// own timeline at the frame it fired. What is heard is what a player hears.
//
// The wall clock is REPLACED by the simulated clock for the length of the
// film (performance.now / Date.now), so the tinker's tics, the idle fidget
// and every other wall-timed animation run at the reel's speed rather than
// at the speed frames happen to be captured.
//
//   node tools/castreel.cjs <out.mp4> [--only=hero,npc,enemy,boss] [--max=N]
//                                     [--frames=<dir>] [--keep]
//
// Serve the repo on 8220 first (the harnesses' port). ffmpeg is the static
// one in node_modules.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FF = path.join(__dirname, '..', 'node_modules', 'ffmpeg-static', 'ffmpeg');
const FPS = 30, SR = 32000;

// ---------------------------------------------------------------------------
// The page side. Everything in here runs inside the game's own scope.
// ---------------------------------------------------------------------------
function installReel(cfg) {
  const { FPS, SR, MAXF } = cfg;
  const DT = 1 / FPS;
  const R = window.REEL = {
    t: 0, queue: [], done: false, resume: null, pend: [], sec: null,
    audioOut: [], log: [], ticker: [], seen: {}, errors: [], nfr: 0, secFrames: 0,
  };
  window.addEventListener('error', e => R.errors.push(String(e.message)));
  const _now = performance.now.bind(performance);
  R.wall = _now;
  // ---- stop the game's own loop: the reel drives update() and draw() itself
  const _raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => (cb === mainLoop ? 0 : _raf(cb));
  // ---- the simulated clock is the only clock
  const base = _now(), dbase = Date.now();
  performance.now = () => base + R.t * 1000;
  Date.now = () => dbase + Math.round(R.t * 1000);

  // ---- SOUND: every request is rendered offline at the moment it is made ---
  const _sfx = sfx, _playBuf = playBuf, _voice = sfxVoice, _say = npcSay;
  const _sting = (typeof stingPlay === 'function') ? stingPlay : null;
  const _vm = voxMech;
  function mixInto(sec, data, at, vol, maxLen) {
    const o = Math.round(at * SR), m = sec.buf;
    const n = Math.min(data.length, maxLen || data.length);
    for (let i = 0; i < n && o + i < m.length; i++) m[o + i] += data[i] * vol;
  }
  function tick(label) {
    R.ticker.push({ t: R.t, label });
    R.log.push((R.sec ? R.sec.name : '-') + ' ' + R.t.toFixed(2) + ' ' + label);
  }
  function offRender(label, fn, dur) {
    if (!R.sec) return;
    const sec = R.sec, at = R.t - sec.t0;
    const off = new OfflineAudioContext(1, Math.ceil(SR * dur), SR);
    const saveAC = AC, saveM = MUTED;
    AC = off; MUTED = false; voxMech = () => null;
    try { fn(); } catch (e) { R.log.push('ERR ' + label + ' ' + e); }
    AC = saveAC; MUTED = saveM; voxMech = _vm;
    R.pend.push(off.startRendering()
      .then(b => mixInto(sec, b.getChannelData(0), at, 1))
      .catch(() => {}));
    tick(label);
  }
  sfx = function (n) {
    if (AC instanceof OfflineAudioContext) return _sfx(n);
    offRender(n, () => _sfx(n), 4);
  };
  playBuf = function (k, v, r) {
    if (AC instanceof OfflineAudioContext) return _playBuf(k, v, r);
    if (!MBUF[k]) return _playBuf(k, v, r);
    offRender(k, () => _playBuf(k, v, r), 4);
    return true;
  };
  sfxVoice = function (id) {
    if (AC instanceof OfflineAudioContext) return _voice(id);
    offRender('voice:' + id, () => _voice(id), 2);
  };
  function streamIn(label, src, vol, maxSec) {
    if (!R.sec || !src) return false;
    const sec = R.sec, at = R.t - sec.t0;
    R.pend.push(fetch(src).then(r => r.arrayBuffer())
      .then(ab => new OfflineAudioContext(1, SR, SR).decodeAudioData(ab))
      .then(b => {
        const d = b.getChannelData(0);
        // fade the tail the way npcSay does: a cut mid-vowel sounds broken
        const n = Math.min(d.length, Math.round(maxSec * SR)), fade = Math.round(SR * 0.4);
        const out = new Float32Array(n);
        for (let i = 0; i < n; i++) out[i] = d[i] * (i > n - fade ? (n - i) / fade : 1);
        mixInto(sec, out, at, vol);
      }).catch(() => {}));
    tick(label);
    return true;
  }
  npcSay = function (id, idx) {
    const files = window.VOX_FILES || null;
    const src = files && files[id + idx];
    if (!streamIn('line:' + id + idx, src, 0.85, 4.2)) sfxVoice(id);
  };
  if (_sting) {
    stingPlay = function (key, vol) {
      const src = (typeof MEDIA_SRC !== 'undefined' && MEDIA_SRC.sting && MEDIA_SRC.sting[key]);
      streamIn('sting:' + key, src, vol || 0.8, 10);
    };
  }

  // ---- the stage ------------------------------------------------------------
  const ST = document.createElement('canvas'); ST.width = 960; ST.height = 540;
  const S = ST.getContext('2d');
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  R.secStart = (name, maxSec) => {
    R.sec = { name, t0: R.t, buf: new Float32Array(Math.ceil(SR * (maxSec + 4))), f0: R.nfr };
    R.ticker.length = 0;
  };
  R.secEnd = async () => {
    const sec = R.sec; if (!sec) return;
    await Promise.all(R.pend.splice(0));
    const frames = R.nfr - sec.f0;
    const n = Math.round(frames / FPS * SR);
    const out = new Int16Array(n);
    let peak = 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(sec.buf[i]));
    const g = peak > 0.95 ? 0.95 / peak : 1;
    for (let i = 0; i < n; i++) {
      const fade = i > n - SR * 0.25 ? (n - i) / (SR * 0.25) : 1;
      out[i] = Math.round(clampN(sec.buf[i] * g * fade, -1, 1) * 32767);
    }
    // to base64 in slices — one giant String.fromCharCode.apply blows the stack
    const u8 = new Uint8Array(out.buffer);
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    R.audioOut.push({ name: sec.name, frames, b64: btoa(s), peak });
    R.sec = null;
  };
  R.take = () => {
    const frames = R.queue.splice(0);
    const audio = R.audioOut.splice(0);
    const res = R.resume; R.resume = null; if (res) res();
    return { frames, audio, done: R.done, log: R.log.splice(0), errors: R.errors.splice(0), nfr: R.nfr };
  };
  R.camOn = (x, y) => {
    const rw = G.roomDef.w * TILE, rh = G.roomDef.h * TILE;
    cam.x = clampN(x - 480, 0, Math.max(0, rw - 960));
    cam.y = clampN(y - 300, 0, Math.max(0, rh - 540));
  };
  R.tap = [];
  R.step = () => {
    update(DT); clearP();
    for (const k of R.tap) keys[k] = 0;   // a press is one step long
    R.tap.length = 0;
    R.t += DT;
  };
  // one frame of the film: the real draw() into the backbuffer, then a crop
  // of it onto the stage under the caption bar
  R.frame = async (cap) => {
    if (MAXF && R.nfr - (R.sec ? R.sec.f0 : 0) >= MAXF) return;
    try { draw(R.t * 1000); } catch (e) { R.errors.push('draw: ' + e); }
    const rs = cv.width / 960;
    S.fillStyle = '#05070b'; S.fillRect(0, 0, 960, 540);
    const z = cap.zoom || R.zoom || 2;
    if (z === 1) S.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, 960, 540);
    else {
      const w = 960 / z, h = 540 / z;
      const sx = clampN((cap.fx - cam.x) - w / 2, 0, 960 - w);
      const sy = clampN((cap.fy - cam.y) - h / 2 - 20, 0, 540 - h);
      S.drawImage(cv, sx * rs, sy * rs, w * rs, h * rs, 0, 0, 960, 540);
    }
    // the caption bar
    S.fillStyle = 'rgba(4,7,12,0.78)'; S.fillRect(0, 484, 960, 56);
    S.fillStyle = '#eef3fa'; S.font = '600 22px system-ui, sans-serif'; S.textAlign = 'left';
    S.fillText(cap.name || '', 18, 519);
    S.fillStyle = '#9fb8cc'; S.font = '500 17px system-ui, sans-serif'; S.textAlign = 'center';
    S.fillText(cap.state || '', 480, 518);
    // the sound ticker: what fired in the last second and a half, newest brightest
    const recent = R.ticker.filter(e => R.t - e.t < 1.6).slice(-3);
    S.textAlign = 'right';
    recent.forEach((e, i) => {
      const age = R.t - e.t;
      S.fillStyle = 'rgba(255,215,106,' + (1 - age / 1.6).toFixed(2) + ')';
      S.font = (i === recent.length - 1 ? '600 17px' : '500 14px') + ' system-ui, sans-serif';
      S.fillText('♪ ' + e.label, 942, 518 - (recent.length - 1 - i) * 17);
    });
    S.fillStyle = 'rgba(159,184,204,0.55)'; S.font = '500 12px system-ui, sans-serif'; S.textAlign = 'left';
    S.fillText('CLAWBYTE — THE CAST  ·  ' + (R.sec ? R.sec.name : ''), 14, 20);
    R.queue.push(ST.toDataURL('image/jpeg', 0.86));
    R.nfr++;
    if (R.queue.length >= 45) await new Promise(r => { R.resume = r; });
  };
  // run the world for `sec` seconds, filming every step; `cap()` returns the
  // caption and focus for the frame, `each(i)` runs before the step
  R.run = async (sec, cap, each) => {
    const n = Math.round(sec * FPS);
    for (let i = 0; i < n; i++) {
      if (each) each(i);
      R.step();
      const cp = cap(i);
      if (cp.focus) R.camOn(cp.focus.x, cp.focus.y);
      cp.fx = cp.focus ? cp.focus.x : (player.x + player.w / 2);
      cp.fy = cp.focus ? cp.focus.y : (player.y + player.h / 2);
      await R.frame(cp);
    }
  };
  const K = a => KEYB[a][0];
  R.hold = (a, on) => { keys[K(a)] = on ? 1 : 0; };
  R.press = (a) => { keysP[K(a)] = 1; keys[K(a)] = 1; R.tap.push(K(a)); };
  R.release = (a) => { keys[K(a)] = 0; };
  R.clearKeys = () => { for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0; };
  // give the art time to arrive: draw() is what requests the plates, so it
  // is called while waiting, on a stalled clock
  R.warm = async (ms) => {
    const t0 = _now();
    while (_now() - t0 < ms) {
      try { draw(R.t * 1000); } catch (e) {}
      await new Promise(r => setTimeout(r, 40));
      const pend = Object.keys(MEDIA_PEND).filter(k => MEDIA_PEND[k] && !(MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth)).length;
      if (_now() - t0 > 900 && pend === 0) break;
    }
  };
  R.place = (x, footY) => {
    player.x = x; player.y = footY - player.h; player.vx = 0; player.vy = 0;
    player.on = true; player.dead = false; player.hp = player.hpMax || player.hp;
    R.camOn(player.x, player.y);
  };
  R.loadRoom = async (id) => {
    G.state = 'PLAY'; G.dialog = null; G.trans = null; G.bossEntry = null;
    G.artProbe = 0;
    loadRoom(id);
    G.bossEntry = null;
    if (typeof beastPreload === 'function') try { beastPreload(G.roomDef.zone); } catch (e) {}
    await R.warm(3500);
  };
  R.boot = async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.sawScrap = 1;
    sv.skills = ['dash', 'wall', 'glide', 'pulse'];
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    // every move-lesson is already learned: the lesson card would otherwise
    // sit over the second guardian's fight until she happened to dash
    if (typeof MOD_LESSON !== 'undefined') for (const id in MOD_LESSON) sv.flags['les_' + id] = 1;
    startGame(sv);
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (typeof loadMedia === 'function') loadMedia();
    // the foley takes decode against the real context; wait for the lot
    const want = Object.keys(MEDIA_SRC.audio);
    const t0 = _now();
    while (_now() - t0 < 25000) {
      await new Promise(r => setTimeout(r, 200));
      const have = want.filter(k => MBUF[k]).length;
      if (have === want.length) break;
    }
    R.log.push('takes decoded: ' + want.filter(k => MBUF[k]).length + '/' + want.length);
    return want.filter(k => MBUF[k]).length;
  };

  // ---- discovery ------------------------------------------------------------
  R.rooms = () => {
    const out = { npc: [], enemy: {}, boss: {} };
    for (const id in ROOMS) {
      const r = ROOMS[id];
      for (const e of (r.ents || [])) {
        if (e[0] === 'npc') out.npc.push([id, e[3]]);
        else if (e[0] === 'boss') { if (!out.boss[e[3]]) out.boss[e[3]] = id; }
        else if (EKIND[e[0]]) {
          const key = (e[0] === 'crawler' || e[0] === 'hopper')
            ? e[0] + ':' + (WOLF_ZONES[r.zone] ? 'wolf' : CAT_ZONES[r.zone] ? 'cheetah' : 'plain')
            : e[0];
          if (!out.enemy[key]) out.enemy[key] = id;
        }
      }
    }
    return out;
  };
}

// ---------------------------------------------------------------------------
// The programme: what each section does, as page-side async functions.
// ---------------------------------------------------------------------------
async function sectionHero() {
  const R = REEL;
  R.zoom = 2.6;
  R.secStart('HZD-99 — her every move', 80);
  await R.loadRoom('A4');
  G.boss = null; G.enemies = []; G.bossEntry = null;
  const floor = 15 * TILE;
  R.place(22 * TILE, floor);
  const NAME = 'HZD-99', cap = st => () => ({ name: NAME, state: st + '   [' + (player.heroState ? player.heroState(Math.abs(player.vx) > 150) : '') + ']' });
  R.clearKeys();
  await R.run(9.5, cap('idle → fidget'));
  R.hold('RIGHT', 1); await R.run(2.4, cap('run right'));
  R.hold('RIGHT', 0); R.hold('LEFT', 1); await R.run(2.4, cap('turn / skid, run left'));
  R.hold('LEFT', 0); await R.run(0.8, cap('stop'));
  R.press('JUMP'); R.hold('JUMP', 1); await R.run(0.45, cap('jump'));
  R.hold('JUMP', 0); await R.run(0.1, cap('jump'));
  R.press('JUMP'); R.hold('JUMP', 1); await R.run(0.35, cap('double jump'));
  R.hold('JUMP', 0); await R.run(1.5, cap('double jump → land'));
  R.hold('RIGHT', 1); R.press('DASH'); await R.run(1.2, cap('dash'));
  R.hold('RIGHT', 0); await R.run(0.6, cap('stop'));
  // the right wall of the arena
  R.hold('RIGHT', 1); await R.run(3.0, cap('run to the wall'));
  R.press('JUMP'); R.hold('JUMP', 1); await R.run(0.5, cap('wall cling'));
  await R.run(1.2, cap('wall cling / slide'));
  R.hold('JUMP', 0); R.hold('RIGHT', 0); R.hold('LEFT', 1); R.press('JUMP'); await R.run(1.4, cap('wall jump away'));
  R.hold('LEFT', 0); await R.run(0.8, cap('land'));
  for (let i = 0; i < 3; i++) { R.press('ATK'); await R.run(0.33, cap('claw combo ' + (i + 1))); R.release('ATK'); await R.run(0.1, cap('claw combo ' + (i + 1))); }
  await R.run(0.9, cap('combo recovers'));
  R.hold('ATK', 1); await R.run(1.7, cap('charging the burst'));
  R.hold('ATK', 0); await R.run(1.4, cap('charged burst'));
  R.press('CAST'); await R.run(1.4, cap('cast'));
  R.release('CAST');
  R.hold('RIGHT', 1); await R.run(0.3, cap('the hit')); R.hold('RIGHT', 0);
  player.iT = 0; player.hurt(1, player.x - 80, 'reel');
  await R.run(1.6, cap('hurt'));
  player.iT = 0; player.die();
  await R.run(1.5, cap('destroyed'));
  await R.secEnd();
}

async function sectionNPC() {
  const R = REEL;
  const list = R.rooms().npc;
  // the tinker in his den, once; every other machine-person once
  const done = {};
  for (const [room, id] of list) {
    if (done[id]) continue;
    if (id === 'ratchet' && room !== 'A0B') continue;
    done[id] = 1;
    R.zoom = 2.4;
    R.secStart(id + ' — at work, noticing her, talking', 40);
    await R.loadRoom(room);
    G.enemies = []; G.boss = null;
    const s = G.statics.find(q => q.type === 'npc' && q.extra === id);
    if (!s) { await R.secEnd(); continue; }
    G.save.flags['on_' + npcKey(s)] = 1;                     // awake
    // only the machine-person is interactable: the den's chest sits a step
    // from the tinker, and E opened it instead of him
    G.statics = G.statics.filter(q => q.type === 'npc');
    // the bust the dialog panel draws is lazy; fetch it now so line one is
    // not spoken over her portrait
    if (typeof mediaFetch === 'function') mediaFetch('bust' + id.charAt(0).toUpperCase() + id.slice(1));
    await R.warm(1500);
    const rw = G.roomDef.w * TILE;
    const side = (s.x + 420 < rw - 64) ? 1 : -1;
    R.place(s.x + side * 380, s.y + s.h);
    player.face = -side;
    const nn = (typeof t === 'function' && t('n_' + id)) || '';
    const name = (nn && nn.indexOf('n_') !== 0) ? nn : id;
    const focus = { x: s.x + s.w / 2, y: s.y + s.h * 0.4 };
    const tf = () => (id === 'ratchet' && typeof tinkerRig === 'function') ? (tinkerRig(s).pose + (tinkerRig(s).job ? ' / ' + tinkerRig(s).job : '')) : (G.npcFrame || '');
    const cap = st => () => ({ name, state: st + '   [' + tf() + ']', focus });
    if (id === 'ratchet') { const r = tinkerRig(s); r.tic = 2.5; r.vent = 6; }
    await R.run(id === 'ratchet' ? 11 : 7, cap('at work, on the turntable'));
    // she walks in
    R.hold(side > 0 ? 'LEFT' : 'RIGHT', 1);
    await R.run(3.2, cap('she comes over'), () => {
      if (Math.abs((player.x + player.w / 2) - (s.x + s.w / 2)) < 96) { R.hold('LEFT', 0); R.hold('RIGHT', 0); }
    });
    R.hold('LEFT', 0); R.hold('RIGHT', 0);
    await R.run(1.2, cap('noticing her'));
    // the conversation: the real interact path, then each line on its bust
    R.press('INT');
    await R.run(0.2, cap('talk'));
    R.release('INT');
    if (G.state !== 'DIALOG' || !G.dialog) {
      // the interact path can open a card first; fall back to the game's own record
      const lines = (typeof t === 'function' && t('sl_' + id + '_1')) || null;
      G.dialog = { name, lines: [typeof lines === 'string' ? lines : (name + ' speaks.')], i: 0, npc: id, onEnd: null };
      G.state = 'DIALOG'; npcSay(id, 0);
    }
    let guard = 0;
    while (G.state === 'DIALOG' && G.dialog && guard++ < 4) {
      const li = G.dialog.i;
      await R.run(3.6, () => ({ name, state: 'line ' + (li + 1) + ' — ' + (G.dialog ? G.dialog.name : ''), zoom: 1 }));
      R.press('INT'); R.step(); R.release('INT');
    }
    G.state = 'PLAY'; G.dialog = null;
    await R.run(1.0, cap('back to work'));
    await R.secEnd();
  }
}

async function sectionEnemies() {
  const R = REEL;
  const rooms = R.rooms().enemy;
  const order = ['crawler:wolf', 'hopper:wolf', 'guard', 'flier', 'turret', 'blob', 'surge', 'bat',
    'crawler:cheetah', 'hopper:cheetah', 'kiln', 'rime', 'snare', 'sage'];
  for (const key of order.concat(Object.keys(rooms).filter(k => order.indexOf(k) < 0))) {
    const room = rooms[key]; if (!room) continue;
    const kind = key.split(':')[0], skin = key.split(':')[1];
    const label = kind + (skin ? ' (' + skin + ')' : '');
    R.zoom = 2.4;
    R.secStart(label + ' — ' + room, 30);
    await R.loadRoom(room);
    G.boss = null; G.bossEntry = null;
    const e = G.enemies.find(q => q.kind === kind);
    if (!e) { await R.secEnd(); continue; }
    G.enemies = [e];
    const rw = G.roomDef.w * TILE;
    const side = (e.x + 260 < rw - 64) ? 1 : -1;
    const footY = e.y + e.h;
    R.place(e.x + side * 220, (kind === 'flier' || kind === 'bat') ? 15 * TILE : footY);
    player.face = -side;
    const focus = () => ({ x: e.x + e.w / 2, y: e.y + e.h / 2 });
    const st = () => (e.dead ? 'destroyed' : (e.st || e.state || (e.coilT > 0 ? 'coil' : e.lungeT > 0 ? 'lunge' : e.windedT > 0 ? 'winded' : e.hurtT > 0 ? 'hurt' : 'moving')));
    const cap = s => () => ({ name: label, state: s + '   [' + st() + ']', focus: focus() });
    const inv = () => { player.iT = 5; };
    await R.run(4.0, cap('as found'), inv);
    // approach until close, so it winds up
    const toward = () => { const dx = (e.x + e.w / 2) - (player.x + player.w / 2); R.hold('LEFT', dx < -70); R.hold('RIGHT', dx > 70); };
    await R.run(3.5, cap('she closes in'), () => { inv(); toward(); });
    R.hold('LEFT', 0); R.hold('RIGHT', 0);
    await R.run(2.5, cap('it reacts'), inv);
    // back off and come again
    await R.run(2.0, cap('she backs off'), () => { inv(); const dx = (e.x + e.w / 2) - (player.x + player.w / 2); R.hold('LEFT', dx > 0); R.hold('RIGHT', dx < 0); });
    R.hold('LEFT', 0); R.hold('RIGHT', 0);
    await R.run(2.0, cap('it comes'), inv);
    // the claws: close and strike until it breaks
    await R.run(5.0, cap('she strikes'), (i) => {
      inv(); toward();
      if (i % 12 === 0) R.press('ATK'); else if (i % 12 === 4) R.release('ATK');
    });
    R.hold('LEFT', 0); R.hold('RIGHT', 0); R.release('ATK');
    if (!e.dead) { e.hp = 1; await R.run(1.5, cap('one more'), (i) => { inv(); toward(); if (i % 10 === 0) R.press('ATK'); else if (i % 10 === 4) R.release('ATK'); }); }
    R.hold('LEFT', 0); R.hold('RIGHT', 0); R.release('ATK');
    if (!e.dead) e.die(-side * 120, -80);
    await R.run(2.0, cap('destroyed'), inv);
    await R.secEnd();
  }
}

// the states each guardian's renderer knows, so the film visits the ones the
// fight did not reach on its own
const BOSS_STATES = {
  glitch: ['intro', 'stalk', 'crouch', 'swipewarn', 'swipe', 'springwarn', 'spring', 'pounce', 'roar', 'daze', 'dive', 'perch', 'nullcharge', 'nullhop', 'nullend', 'recover'],
  brood: ['intro', 'idle', 'rise', 'swoopwarn', 'swoop', 'volley', 'broodcall', 'restlow', 'cfcrash', 'cffloor'],
  zero: ['intro', 'idle', 'dashwarn', 'dash', 'lancewarn', 'shardwarn', 'orbs', 'novawarn', 'azhush'],
  atlas: ['intro', 'idle', 'slamwarn', 'meltwarn', 'forgebell', 'hymn', 'function'],
  prism: ['intro', 'idle', 'rest', 'aim', 'beam', 'dashslash', 'pounce', 'arcspin', 'arcstorm', 'lsvanish', 'lsarrive'],
  mother: ['intro', 'grabwarn', 'grab', 'msong', 'nwcharge'],
  alpha: ['intro', 'rest', 'roarwarn', 'roar', 'broodcall', 'howl', 'coil', 'leap', 'clawwarn', 'claw', 'bitewarn', 'bite', 'clinch', 'shake', 'recoil'],
};
async function sectionBosses() {
  const R = REEL;
  const rooms = R.rooms().boss;
  const order = ['glitch', 'alpha', 'chime', 'brood', 'carrier', 'atlas', 'moth', 'zero', 'lattice', 'mother', 'lens', 'prism'];
  for (const kind of order.concat(Object.keys(rooms).filter(k => order.indexOf(k) < 0))) {
    const room = rooms[kind]; if (!room) continue;
    R.zoom = 2;
    R.secStart(kind.toUpperCase() + ' — ' + room, 90);
    await R.loadRoom(room);
    const b = G.boss;
    if (!b) { await R.secEnd(); continue; }
    G.enemies = G.enemies.filter(e => e.boss || false);
    const rw = G.roomDef.w * TILE;
    const side = (b.x + b.w / 2 < rw / 2) ? 1 : -1;
    const footY = b.y + b.h;
    R.place(b.x + b.w / 2 + side * 240 - player.w / 2, Math.min(footY, 15 * TILE));
    player.face = -side;
    const bn = (BSTAT[kind] && BSTAT[kind].name) || (typeof t === 'function' && t('b_' + kind)) || '';
    const name = (bn && bn.indexOf('b_') !== 0) ? bn : kind.toUpperCase();
    const seen = {};
    const focus = () => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
    const cap = s => () => { seen[b.st] = 1; return { name, state: s + '   [' + b.st + (b.phase > 1 ? ' · phase ' + b.phase : '') + ']', focus: focus() }; };
    // she cannot die, and neither can it until the film says so: the fight
    // has to run long enough to show every state, and a guardian that falls
    // at the twelfth second takes the tour with it
    const inv = () => {
      player.iT = 5; if (player.dead) { player.dead = false; G.state = 'PLAY'; }
      if (!b.dead && b.hp < 1) b.hp = 1;
      // a construct's arrival card is a dialog, and a dialog stops the world
      if (G.state === 'DIALOG') { G.dialog = null; G.state = 'PLAY'; }
    };
    await R.run(1.5, cap('dormant'), inv);
    if (b.st === 'dorm') { b.st = 'intro'; b.t = 2.0; G.bossEntry = null; }
    await R.run(2.6, cap('it wakes'), inv);
    // THE FIGHT: she circles, closes, strikes, backs off — thirty seconds of
    // whatever the guardian does about it
    const toward = (want) => {
      const dx = (b.x + b.w / 2) - (player.x + player.w / 2);
      const far = Math.abs(dx) > want;
      R.hold('LEFT', far ? dx < 0 : dx > 0); R.hold('RIGHT', far ? dx > 0 : dx < 0);
    };
    await R.run(30, cap('the fight'), (i) => {
      inv();
      const beat = Math.floor(i / 90) % 3;          // 3 s beats: close, strike, back off
      if (beat === 0) toward(120);
      else if (beat === 1) { toward(60); if (i % 14 === 0) R.press('ATK'); else if (i % 14 === 5) R.release('ATK'); }
      else toward(260);
      if (i % 150 === 40) R.press('JUMP'); else if (i % 150 === 46) R.release('JUMP');
      if (b.dead) return;
    });
    R.clearKeys();
    // the states the fight never reached, each held long enough to read
    const tour = (BOSS_STATES[kind] || []).filter(s => !seen[s]);
    for (const st of tour) {
      if (b.dead) break;
      b.st = st; b.t = 0.9; b.fc = null; b.stagT = 0;
      await R.run(1.2, () => ({ name, state: 'state tour: ' + st + '   [' + b.st + ']', focus: focus() }), inv);
    }
    if (!b.dead) { b.hp = 0; b.die(); }
    // the fall, and out before the victory cards: they are the game's, not the cast's
    await R.run(1.8, () => ({ name, state: 'falls   [' + b.st + ']', focus: focus() }), () => { player.iT = 5; });
    await R.secEnd();
  }
}

async function program(opts) {
  const R = REEL;
  try {
    for (const s of opts.sections) {
      if (s === 'hero') await sectionHero();
      else if (s === 'npc') await sectionNPC();
      else if (s === 'enemy') await sectionEnemies();
      else if (s === 'boss') await sectionBosses();
    }
  } catch (e) { R.errors.push('program: ' + (e && e.stack || e)); if (R.sec) await R.secEnd(); }
  R.done = true;
  const res = R.resume; R.resume = null; if (res) res();
}

// ---------------------------------------------------------------------------
(async () => {
  const args = process.argv.slice(2);
  const out = args.find(a => !a.startsWith('--')) || 'restyle/reel/cast_reel.mp4';
  const opt = (n, d) => { const a = args.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
  const sections = opt('only', 'hero,npc,enemy,boss').split(',');
  const MAXF = parseInt(opt('max', '0'), 10) || 0;
  const fdir = opt('frames', path.join(path.dirname(out), 'frames'));
  fs.mkdirSync(fdir, { recursive: true });
  for (const f of fs.readdirSync(fdir)) fs.unlinkSync(path.join(fdir, f));

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(installReel, { FPS, SR, MAXF });
  const takes = await page.evaluate(() => REEL.boot());
  console.log('booted; foley takes decoded:', takes);
  // the programme lives in the page as source, so the sections can call the
  // game's own functions by name
  const src = [sectionHero, sectionNPC, sectionEnemies, sectionBosses, program]
    .map(f => f.toString()).join('\n') + '\nconst BOSS_STATES = ' + JSON.stringify(BOSS_STATES) + ';\n';
  await page.addScriptTag({ content: src + '\nwindow.__reelProgram = program;' });
  await page.evaluate(sections => { window.__reelProgram({ sections }); }, sections);

  let n = 0; const pcm = []; const secs = []; const logAll = [];
  for (;;) {
    const r = await page.evaluate(() => REEL.take());
    for (const f of r.frames) {
      fs.writeFileSync(path.join(fdir, String(n).padStart(6, '0') + '.jpg'), Buffer.from(f.slice(f.indexOf(',') + 1), 'base64'));
      n++;
    }
    for (const a of r.audio) {
      pcm.push(Buffer.from(a.b64, 'base64'));
      secs.push({ name: a.name, frames: a.frames, peak: a.peak });
      console.log('section', a.name, a.frames + 'f', 'peak', a.peak.toFixed(2));
    }
    for (const l of r.log) { logAll.push(l); if (/ERR|decoded/.test(l)) console.log(' ', l); }
    for (const e of r.errors) console.log('  PAGE:', e);
    if (r.done && !r.frames.length) break;
    if (!r.frames.length) await new Promise(res => setTimeout(res, 120));
  }
  const log = logAll.concat(await page.evaluate(() => REEL.log));
  await browser.close();
  for (const e of errs) console.log('pageerror:', e);
  console.log('frames:', n, 'sections:', secs.length);

  // the soundtrack: one WAV, section PCM back to back — each section's audio
  // is exactly its frame count long, so the picture and the sound share a clock
  const data = Buffer.concat(pcm);
  const wav = path.join(fdir, '..', 'cast_reel.wav');
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write('WAVE', 8);
  hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22);
  hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 2, 28); hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34);
  hdr.write('data', 36); hdr.writeUInt32LE(data.length, 40);
  fs.writeFileSync(wav, Buffer.concat([hdr, data]));
  fs.writeFileSync(path.join(fdir, '..', 'cast_reel.log'), log.join('\n') + '\n\n' + JSON.stringify(secs, null, 1));

  execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(fdir, '%06d.jpg'),
    '-i', wav, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
  console.log('wrote', out, (fs.statSync(out).size / 1048576).toFixed(1) + ' MB', (n / FPS).toFixed(0) + ' s');
  if (!args.includes('--keep')) { for (const f of fs.readdirSync(fdir)) fs.unlinkSync(path.join(fdir, f)); fs.rmdirSync(fdir); }
})().catch(e => { console.error(e); process.exit(1); });
