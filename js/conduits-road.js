// ===========================================================================
// THE CONDUITS' ROAD — Kingdom 2 as it is played now (owner, 2026-11-21).
//
// "the crocodile should be a mini boss before the actual boss... Each kingdom
// needs mini boss to defeat. This mini boss will give you a piece of the
// puzzle... we do not change sages, but we add other bosses... The crocodile
// should live in a swamp... dragonflies flying, mosquitoes. Those are just
// graphics flying... just like we entered gates for the caves in the first
// kingdom, this time we need to enter something else... Maybe I will need a
// boat to reach it... shards as transaction... or a quest... The quest should
// be hard. The shards should be high... a wooden raft that is operated by an
// NPC... a creature that lives both land and sea... a robot version."
//
// THE ROAD, and what each piece is for:
//   CARRIER (B8)        mini-boss: Vault Seal I
//   MIREJAW (SW3)       mini-boss, in the swamp: Vault Seal II (swallowed)
//   UNDERTOW (GB1D)     the kingdom's agent: Vault Seal III (SAGE_GIFT)
//   the vault (B5)      three seals turn it, and open the climb to the Cache
//   PRISM PROWLER (X1)  the Conduits' SAGE: purified, it gives the second sword
// Then the Foundry (FURNACE CHOIR needs the swords, gives the connector), and
// only then TALONHOST, whom nothing but the throw brings down (types.js
// BOSS_ORDER). The hero's world keeps the road it was built with.
//
// THE SWAMP (world.js SW1-SW5) is entered through a DRAIN CULVERT off the long
// conduit (B2). Bilge — an old robot frog, a ferryman — poles the only raft
// across the Outfall. He takes a high fare in scrap, or his errand: his pole
// fell into the spillway under his own dock, past two runs of teeth only a
// jump with the dash at its top can cross.
// ===========================================================================

const K2_MINI_SIGIL = { carrier: 'sigil1', mirejaw: 'sigil2' };
const K2_FARE = 600;                 // chapter one pays about 700 — "the shards should be high"
// water: [x0 tile, x1 tile, surface row] — open rows over a solid bed
const K2_WATER = { SW1: [[12, 56, 15]], SW3: [[1, 38, 13]] };
// the insects each swamp room keeps — graphics, never enemies
const K2_FLIES = { SW1: [5, 6], SW2: [6, 8], SW3: [2, 4], SW4: [7, 6] };   // [dragonflies, mosquitoes]
const K2_RAFT = { near: 12, far: 51, w: 6, speed: 118 };   // its deck level with the dock (row 15)

function k2Robo() { return !(typeof isHero === 'function' && isHero()); }

// ---- the second sword, from the second sage -------------------------------
function k2GiveSecondSword() {
  const f = G.save.flags;
  if (!f.crystal || f.crystal2) return;
  grantWeapon('dual');
  f.sr_crystal2 = 1;                 // the old secret up the shaft is the same blade
  persist();
  if (typeof sfx === 'function') sfx('chargeReady');
  G.flash = Math.max(G.flash || 0, 0.5);
  showItem(t('i_crystal2'), t('i_crystal2d'));
}
// TALONHOST IS NOT HOME until the throw is hers: the hall in B4 stands empty on
// the way to the vault, and the eagle is the one the boomerang brings down
function k2BossAway(kind) {
  return kind === 'brood' && k2Robo() && !(typeof weaponOwned === 'function' && weaponOwned('joined'));
}
// A SAVE FROM BEFORE THIS ROAD: the pieces it already earned are handed over
// as the fights that now carry them — a beaten CARRIER holds its seal, a
// purified UNDERTOW his, a purified Prowler the blade it was keeping.
function k2Migrate(save) {
  if (!save || !k2Robo()) return;
  const f = save.flags = save.flags || {};
  if (f.k2Road) return;
  f.k2Road = 1;
  save.relics = save.relics || [];
  const give = id => { if (!save.relics.includes(id)) save.relics.push(id); };
  if (f.bossCarrier) give('sigil1');
  if (f.bossMirejaw) give('sigil2');
  if (f.sageTame_GB1D) give('sigil3');
  if (f.bossPrism && f.crystal && !f.crystal2) { grantWeapon('dual', save); f.sr_crystal2 = 1; }
}

// ---- the swamp's doors: drain culverts -------------------------------------
// The first kingdom went in through cave mouths; this one goes in through the
// drains. Each is a fired object (assets/characters/swamp/culvert.webp), drawn
// by k2DrawCulvert. The wallow's way out is DORMANT until MIREJAW is beaten
// (the `lock` pattern: it stands dark and refuses, then wakes).
if (typeof GATE_ROOM !== 'undefined') {
  GATE_ROOM.B2 = { at: 0.20, to: 'SW1', ax: 0.047, style: 'culvert' };
  GATE_ROOM.SW1 = { at: 0.047, to: 'B2', ax: 0.20, style: 'culvert' };
  GATE_ROOM.SW5 = { at: 0.95, to: 'SW1', ax: 0.047, style: 'culvert' };
  GATE_ROOM.SW3 = { at: 0.92, to: 'SW2', ax: 0.24, style: 'culvert', lock: 'bossMirejaw', lockLine: 'k2_culvert_dormant' };
  GATE_ROOM.SW2 = { at: 0.24, to: 'SW3', ax: 0.92, style: 'culvert', need: 'bossMirejaw' };
}
if (typeof ROOM_VISTA !== 'undefined') {
  ROOM_VISTA.SW1 = 'swampOutfall'; ROOM_VISTA.SW2 = 'swampFar';
  ROOM_VISTA.SW3 = 'swampWallow'; ROOM_VISTA.SW4 = 'swampFar';
}
function k2DrawCulvert(cx, gy, k, def) {
  if (typeof mediaFetch === 'function') mediaFetch('culvertMouth');
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.culvertMouth;
  if (!(im && im.naturalWidth)) return false;
  const dh = 236, dw = dh * (im.naturalWidth / im.naturalHeight);
  const dormant = def && def.lock && !(G.save.flags[def.lock]);
  c.save();
  if (dormant) c.filter = 'brightness(0.62) saturate(0.7)';
  c.drawImage(im, cx - dw / 2, gy - dh, dw, dh);
  c.restore();
  return true;
}

// ---- Bilge's raft ----------------------------------------------------------
// It is a platform like any other — the same x/y/w/h and per-frame delta the
// player's carry reads — that goes where Bilge poles it, not on a timer.
class K2Raft {
  constructor(far) {
    this.w = K2_RAFT.w * TILE; this.h = 12;
    this.xN = K2_RAFT.near * TILE; this.xF = K2_RAFT.far * TILE;
    this.x = far ? this.xF : this.xN;
    this.baseY = 15 * TILE - 2;
    this.y = this.baseY;
    this.fdx = 0; this.fdy = 0; this.st = 'moored'; this.to = null; this.t = 0; this.wait = 0;
    this.k2raft = true;
  }
  update(dt) {
    this.t += dt;
    let nx = this.x;
    if (this.st === 'go') {
      const d = this.to - this.x, s = Math.sign(d);
      // the pole bites, then the raft glides: speed swells and settles on
      // every stroke instead of sliding like a conveyor
      const stroke = 0.62 + 0.38 * Math.max(0, Math.sin(this.t * 2.4));
      const step = Math.min(Math.abs(d), K2_RAFT.speed * stroke * dt * Math.min(1, 0.35 + Math.abs(d) / 160));
      nx = this.x + s * step;
      if (Math.abs(this.to - nx) < 1) {
        nx = this.to; this.st = 'moored'; this.wait = 1.2;
        G.save.flags.raftFar = this.to === this.xF ? 1 : 0;
        if (typeof persistSoon === 'function') persistSoon();
      }
    } else if (this.wait > 0) this.wait -= dt;
    const ny = this.baseY + Math.sin(this.t * 1.7) * 1.6;
    this.fdx = nx - this.x; this.fdy = ny - this.y;
    this.x = nx; this.y = ny;
  }
  depart() {
    if (this.st === 'go' || this.wait > 0) return;
    this.to = Math.abs(this.x - this.xN) < 4 ? this.xF : this.xN;
    this.st = 'go';
    if (typeof playBuf === 'function') playBuf('k2_punt', 0.5);
  }
  draw(c) {
    if (typeof mediaFetch === 'function') mediaFetch('raftPlate');
    const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.raftPlate;
    if (im && im.naturalWidth) {
      // the plate is a square cell with the raft seated on its floor: draw it so
      // the deck's top edge is the platform's surface
      const dw = this.w * 1.06, dh = dw * (im.naturalHeight / im.naturalWidth);
      const deckFrac = 0.898;                // the deck line, measured off the keyed plate (575 of 640)
      c.drawImage(im, this.x + this.w / 2 - dw / 2, this.y - dh * deckFrac, dw, dh);
    }
  }
}
function k2Raft() { return (G.plats || []).find(p => p.k2raft) || null; }
function k2OnRaft(r) {
  if (!r || !player) return false;
  const feet = player.y + player.h, cx = player.x + player.w / 2;
  return cx > r.x + 4 && cx < r.x + r.w - 4 && Math.abs(feet - r.y) < 8 && player.vy >= -1;
}

// ---- room load / per frame -------------------------------------------------
const K2 = { flies: [], buzzT: 0, ambT: 0, onT: 0 };
function k2RoomLoaded(id) {
  K2.flies = []; K2.onT = 0;
  // (the raft is launched on the room's first frame, k2Update: loadRoom clears
  // the platform list after this hook has run)
  const n = K2_FLIES[id];
  if (n) {
    const W = ROOMS[id].w * TILE;
    for (let i = 0; i < n[0] + n[1]; i++) {
      const fly = i < n[0];
      const x = 120 + Math.random() * (W - 240), y = 150 + Math.random() * 260;
      K2.flies.push({ fly, x, y, hx: x, hy: y, vx: 0, vy: 0, t: Math.random() * 9, dart: 0, face: 1, sw: fly ? 0 : (i % 3) });
    }
  }
  // the swamp's own air under the score: frogs and crickets (a CC0 night recording)
  if (/^SW/.test(id) && typeof playBuf === 'function' && !K2.ambOn) { playBuf('k2_amb', 0.32); K2.ambOn = true; K2.ambT = 44; }
  if (!/^SW/.test(id)) K2.ambOn = false;
}
function k2Water(id) { return K2_WATER[id] || null; }
function k2Update(dt) {
  const id = G.roomId;
  if (!/^SW/.test(id || '')) return;
  if (id === 'SW1' && G.plats && !k2Raft()) G.plats.push(new K2Raft(!!G.save.flags.raftFar));
  // the ambience bed re-arms when its recording ends (playBuf is one-shot)
  if ((K2.ambT -= dt) <= 0 && typeof playBuf === 'function') { playBuf('k2_amb', 0.32); K2.ambT = 44; }
  // THE WATER. She cannot swim: under the surface she is pulled out where she
  // went in, as the teeth do (hazardRescue closes the picture first)
  const W = k2Water(id);
  // (not while she is in MIREJAW's jaws: the roll is his, and it costs what it costs)
  const held = G.boss && G.boss.mj && G.boss.mj.held;
  if (W && player && !player.dead && !G.rescue && !held) {
    const feet = player.y + player.h, cx = player.x + player.w / 2;
    for (const [x0, x1, row] of W) {
      if (cx > x0 * TILE && cx < (x1 + 1) * TILE && feet > row * TILE + 14) {
        if (typeof playBuf === 'function') playBuf('k2_splash', 0.6);
        player.hurt(1, player.x, 'swamp.water');
        if (!player.dead && typeof hazardRescue === 'function') hazardRescue(player);
        break;
      }
    }
  }
  // THE SPILLWAY IS HARD (the errand): any fall goes back to where she dropped in
  if (id === 'SW5' && player && player.x < 40 * TILE) player.lastSafe = { x: 4 * TILE, y: 15 * TILE - player.h };
  // Bilge rides the raft; the raft goes when she stands on it with her fare paid
  const r = k2Raft(), bil = G.statics.find(s => s.type === 'ferry');
  if (r && bil) { bil.x = r.x + 6; bil.y = r.y - bil.h; }
  if (r) {
    if (G.save.flags.ferryPaid && r.st === 'moored' && k2OnRaft(r)) {
      K2.onT += dt;
      if (K2.onT > 0.45) { r.depart(); K2.onT = 0; }
    } else K2.onT = 0;
  }
  // the insects: dragonflies hover and dart, mosquitoes dance in small clouds
  for (const f of K2.flies) {
    f.t += dt;
    if (f.fly) {
      if ((f.dart -= dt) <= 0) {
        f.dart = 0.9 + Math.random() * 2.2;
        const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 140;
        f.hx = clamp(f.x + Math.cos(a) * d, 60, ROOMS[id].w * TILE - 60);
        f.hy = clamp(f.y + Math.sin(a) * d * 0.5, 110, 430);
      }
      const k = 1 - Math.pow(0.0006, dt);
      const nx = f.x + (f.hx - f.x) * k, ny = f.y + (f.hy - f.y) * k;
      if (Math.abs(nx - f.x) > 0.3) f.face = nx > f.x ? 1 : -1;
      f.x = nx; f.y = ny + Math.sin(f.t * 3.1) * 0.25;
    } else {
      f.x = f.hx + Math.sin(f.t * 2.3 + f.sw) * 26 + Math.sin(f.t * 7.7) * 5;
      f.y = f.hy + Math.cos(f.t * 1.9 + f.sw) * 14 + Math.sin(f.t * 11.3) * 3;
    }
  }
  // a mosquito near her ear is heard
  if (player && (K2.buzzT -= dt) <= 0) {
    K2.buzzT = 2.5;
    const near = K2.flies.some(f => !f.fly && Math.abs(f.x - player.x) < 90 && Math.abs(f.y - player.y) < 90);
    if (near && typeof playBuf === 'function') playBuf('k2_mosq', 0.22, 0.9 + Math.random() * 0.2);
  }
}

// ---- drawing ---------------------------------------------------------------
function k2Strip(key, n, i, x, y, h, flip, alpha) {
  if (typeof mediaFetch === 'function') mediaFetch(key);
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[key];
  if (!(im && im.naturalWidth)) return false;
  const cw = im.naturalWidth / n, ch = im.naturalHeight, w = h * cw / ch;
  c.save();
  if (alpha != null) c.globalAlpha = alpha;
  c.translate(x, y);
  if (flip) c.scale(-1, 1);
  c.drawImage(im, (i % n) * cw, 0, cw, ch, -w / 2, -h, w, h);
  c.restore();
  return true;
}
// Bilge and his pole draw themselves; every other static is drawStatics'
function k2DrawStatic(s) {
  if (s.type === 'ferry') {
    const talking = G.dialog && G.dialog.k2 || G.state === 'FERRY';
    const r = k2Raft(), going = r && r.st === 'go';
    const key = talking ? 'bilgeTalk' : 'bilgePole';
    const rate = going ? 7 : talking ? 6 : 3.2;
    // he faces the way the raft is going, and her while he talks
    const faceR = going ? r.to > r.x : (player && player.x > s.x);
    k2Strip(key, 16, Math.floor(performance.now() / 1000 * rate), s.x + s.w / 2, s.y + s.h + 2, 112, faceR);
    return true;
  }
  if (s.type === 'k2pole') {
    const bob = Math.sin(performance.now() / 600) * 2;
    c.save();
    c.translate(s.x + s.w / 2, s.y + s.h - 2 + bob);
    c.rotate(-0.12);
    c.fillStyle = '#5a3c22'; c.fillRect(-56, -4, 112, 7);
    c.fillStyle = '#7b5634'; c.fillRect(-56, -4, 112, 2);
    c.fillStyle = '#3a2716'; c.fillRect(-58, -5, 6, 9); c.fillRect(50, -5, 8, 9);
    c.restore();
    return true;
  }
  return false;
}
function k2NearLabel(s) {
  if (s.type === 'ferry') return t('talk');
  if (s.type === 'k2pole') return t('k2_pole_take');
  return null;
}
function k2DrawFront(c2) {
  const id = G.roomId;
  if (!/^SW/.test(id || '')) return;
  const W = k2Water(id), now = performance.now() / 1000;
  if (W) for (const [x0, x1, row] of W) {
    const X0 = x0 * TILE, X1 = (x1 + 1) * TILE, Y = row * TILE + 6, B = (ROOMS[id].h) * TILE;
    // the body of the water: dark, green, and only half clear, so what stands
    // in it is IN it
    const g = c2.createLinearGradient(0, Y, 0, B);
    g.addColorStop(0, 'rgba(22,46,40,0.78)'); g.addColorStop(1, 'rgba(6,16,14,0.94)');
    c2.save();
    // the raft FLOATS: its deck stays above the water's skin, its drums go under
    const rf = k2Raft();
    c2.beginPath(); c2.rect(X0, Y, X1 - X0, B - Y);
    if (rf) c2.rect(rf.x - 4, rf.y - 14, rf.w + 8, 26);
    c2.clip('evenodd');
    c2.fillStyle = g; c2.fillRect(X0, Y, X1 - X0, B - Y);
    c2.restore();
    // the surface: a slow wandering line with scum and the sky caught on it
    c2.strokeStyle = 'rgba(150,190,170,0.35)'; c2.lineWidth = 2;
    c2.beginPath();
    for (let x = X0; x <= X1; x += 12) {
      const yy = Y + Math.sin(x * 0.03 + now * 1.3) * 1.4 + Math.sin(x * 0.011 - now * 0.7) * 1.2;
      if (x === X0) c2.moveTo(x, yy); else c2.lineTo(x, yy);
    }
    c2.stroke();
    c2.fillStyle = 'rgba(120,150,90,0.22)';
    for (let x = X0 + 20; x < X1; x += 53) {
      const w = 18 + ((x * 7) % 23);
      c2.beginPath(); c2.ellipse(x + Math.sin(now * 0.4 + x) * 4, Y + 3, w, 2.2, 0, 0, 7); c2.fill();
    }
    // rings where something breaks the surface: the raft's drums, her shins
    const r = k2Raft();
    const ring = (x, k) => {
      const ph = (now * 0.9 + k) % 1;
      c2.strokeStyle = 'rgba(190,220,200,' + (0.3 * (1 - ph)).toFixed(3) + ')';
      c2.lineWidth = 1.2;
      c2.beginPath(); c2.ellipse(x, Y + 2, 10 + ph * 36, 2 + ph * 4, 0, 0, 7); c2.stroke();
    };
    if (r && r.x + r.w > X0 && r.x < X1) { ring(r.x + 18, 0); ring(r.x + r.w - 18, 0.5); }
    if (G.boss && G.boss.kind === 'mirejaw' && typeof mjSurfaceX === 'function') {
      const sx = mjSurfaceX(G.boss);
      if (sx != null && sx > X0 && sx < X1) { ring(sx, 0.2); ring(sx + 40, 0.7); }
    }
  }
  // the insects, in front of the room and behind the HUD
  for (const f of K2.flies) {
    if (f.fly) {
      // a dragonfly's wings are a blur: the plate drawn twice, the second a
      // ghost a hair lower, alternating — the shimmer of wings that beat faster
      // than any frame
      const flick = Math.floor(now * 40) % 2;
      k2Strip('dragonfly', 1, 0, f.x, f.y + 12, 26, f.face < 0, 0.95);
      if (flick) k2Strip('dragonfly', 1, 0, f.x, f.y + 13, 26, f.face < 0, 0.25);
    } else {
      k2Strip('mosquito', 1, 0, f.x, f.y + 5, 9, Math.sin(f.t * 2.3 + f.sw) > 0, 0.85);
    }
  }
}

// ---- Bilge: the offer ------------------------------------------------------
// NOTHING OPENS OR BUYS BY SURPRISE (the ledger): talking to him asks a
// question, nothing is paid for half a second, and nothing by a key that was
// already down.
const K2F = { idx: 0, guard: 0, armed: false };
function k2FerryButtons() {
  const rows = [{ i: 0, key: 'k2_ferry_pay' }, { i: 1, key: G.save.flags.k2pole ? 'k2_ferry_givepole' : 'k2_ferry_errand' }, { i: 2, key: 'shop_later' }];
  return rows.map((b, j) => Object.assign(b, { x: 230 + j * 172, y: 330, w: 160, h: 50 }));
}
function k2Interact(s) {
  if (s.type === 'k2pole') {
    G.save.flags.k2pole = 1;
    G.statics.splice(G.statics.indexOf(s), 1);
    persist(); sfx('chest');
    showItem(t('k2_pole'), t('k2_poled'));
    return true;
  }
  if (s.type !== 'ferry') return false;
  const f = G.save.flags;
  if (f.ferryPaid) {
    G.dialog = { name: t('n_bilge'), lines: [t('k2_bilge_aboard')], i: 0, npc: null, onEnd: null, k2: 1 };
    return true;
  }
  if (!f.bilgeMet) {
    f.bilgeMet = 1; persist();
    G.dialog = { name: t('n_bilge'), lines: [t('k2_bilge_1'), t('k2_bilge_2')], i: 0, npc: null, k2: 1,
      onEnd: () => { k2FerryOpen(); } };
    return true;
  }
  k2FerryOpen();
  return true;
}
function k2FerryOpen() { G.state = 'FERRY'; K2F.idx = 0; K2F.guard = 0.5; K2F.armed = false; }
function k2FerryChoose(i) {
  const f = G.save.flags;
  if (i === 2) { G.state = 'PLAY'; return; }
  if (i === 0) {
    if ((G.save.scrap | 0) < K2_FARE) { sfx('no'); G.toast(t('k2_ferry_poor')); return; }
    G.save.scrap -= K2_FARE; f.ferryPaid = 1; persist(); sfx('chest');
    G.state = 'PLAY';
    G.dialog = { name: t('n_bilge'), lines: [t('k2_bilge_paid')], i: 0, npc: null, onEnd: null, k2: 1 };
    return;
  }
  // the errand: take it, or bring the pole back
  if (f.k2pole) {
    f.ferryPaid = 1; f.ferryQuestDone = 1; persist(); sfx('chest');
    G.state = 'PLAY';
    G.dialog = { name: t('n_bilge'), lines: [t('k2_bilge_thanks')], i: 0, npc: null, onEnd: null, k2: 1 };
    return;
  }
  f.ferryQuest = 1; persist(); sfx('ui');
  G.state = 'PLAY';
  G.dialog = { name: t('n_bilge'), lines: [t('k2_bilge_errand1'), t('k2_bilge_errand2')], i: 0, npc: null, onEnd: null, k2: 1 };
}
function k2FerryUpdate() {
  K2F.guard = Math.max(0, K2F.guard - 1 / 60);
  if (!inD('OK')) K2F.armed = true;
  if (inP('BACK')) { G.state = 'PLAY'; sfx('ui'); return; }
  if (inP('LEFT') || inP('UP')) { K2F.idx = (K2F.idx + 2) % 3; sfx('ui'); }
  if (inP('RIGHT') || inP('DOWN')) { K2F.idx = (K2F.idx + 1) % 3; sfx('ui'); }
  if (inP('OK') && K2F.armed && K2F.guard <= 0) k2FerryChoose(K2F.idx);
}
function k2FerryTap(x, y) {
  for (const b of k2FerryButtons()) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
    if (K2F.guard > 0) return;
    if (K2F.idx === b.i) k2FerryChoose(b.i); else { K2F.idx = b.i; sfx('ui'); }
    return;
  }
}
function k2FerryDraw() {
  c.fillStyle = 'rgba(4,7,12,0.7)'; c.fillRect(0, 0, 960, 540);
  c.fillStyle = 'rgba(12,20,28,0.96)'; rr(c, 200, 150, 560, 260, 12); c.fill();
  c.strokeStyle = 'rgba(255,215,106,0.55)'; c.lineWidth = 1.5; rr(c, 200, 150, 560, 260, 12); c.stroke();
  // his own face on the card: the talking strip, cropped to the head
  k2Strip('bilgeTalk', 16, Math.floor(performance.now() / 1000 * 6), 262, 300, 130, true);
  ftxt(t('n_bilge'), 520, 182, 16, '#ffd76a', 'center');
  const line = G.save.flags.k2pole ? t('k2_ferry_askpole') : t('k2_ferry_ask');
  wrapText(line.replace('{N}', K2_FARE), 400, 16).slice(0, 4).forEach((ln, i) => ftxt(ln, 520, 214 + i * 22, 16, '#eef3fa', 'center', null, '600'));
  ftxt('⬢ ' + (G.save.scrap | 0), 520, 306, 14, '#ffd76a', 'center');
  for (const b of k2FerryButtons()) {
    const on = b.i === K2F.idx;
    c.fillStyle = on ? 'rgba(255,215,106,0.16)' : 'rgba(255,255,255,0.04)'; rr(c, b.x, b.y, b.w, b.h, 9); c.fill();
    c.strokeStyle = on ? '#ffd76a' : 'rgba(160,180,200,0.4)'; c.lineWidth = on ? 2 : 1; rr(c, b.x, b.y, b.w, b.h, 9); c.stroke();
    const lab = t(b.key).replace('{N}', K2_FARE);
    ftxt(lab, b.x + b.w / 2, b.y + b.h / 2 + 1, 14, on ? '#fff2cf' : '#9ab0c2', 'center');
  }
}
// the pole lies in the spillway only while the errand can still use it
function k2PoleLive() { const f = G.save.flags; return !f.k2pole && !f.ferryPaid; }

// ---- the goal arrow --------------------------------------------------------
// Kingdom 2 in order, from the save alone (js/progress.js progressGoal calls this)
function k2Goal(f) {
  if (!f.bossCarrier) return 'pg_goal_carrier';
  if (!f.bossMirejaw) return f.ferryPaid ? 'pg_goal_mire' : 'pg_goal_ferry';
  if (!f.sageTame_GB1D) return 'pg_goal_undertow';
  if (!f.vaultOpen) return 'pg_goal_vault';
  if (!f.bossPrism) return 'pg_goal_prowler';
  if (!f.bossAtlas) return 'pg_goal_furnace';
  if (!(typeof weaponOwned === 'function' && weaponOwned('joined'))) return 'pg_goal_connector';
  if (!f.bossBrood) return 'pg_goal_brood';
  return null;
}
function k2GoalRoom(key) {
  return ({ pg_goal_ferry: 'SW1', pg_goal_mire: 'SW3', pg_goal_vault: 'B5', pg_goal_prowler: 'X1',
            pg_goal_furnace: 'C3', pg_goal_connector: 'C4' })[key] || null;
}

// ---- words: robot world, all five languages --------------------------------
TEXT_LAYERS.push(k2SplitText({
  en: {
    k2_ferry_need: "Only Bilge's raft crosses this water.",
    n_bilge: 'Bilge',
    k2_bilge_1: 'Mind the water, little one. Nothing in the Mire drinks it — it drinks you.',
    k2_bilge_2: 'I am Bilge. I pole the only raft across. Whatever you are after, it lives on the far bank.',
    k2_ferry_ask: 'A crossing costs {N} scrap. Or bring back my pole — it fell into the spillway under this dock.',
    k2_ferry_askpole: 'That is my pole! Hand it over and the raft is yours, both ways, for as long as I float.',
    k2_ferry_pay: 'Pay {N} scrap', k2_ferry_errand: 'Find his pole', k2_ferry_givepole: 'Give the pole',
    k2_ferry_poor: 'Not enough scrap.',
    k2_bilge_paid: 'Step aboard and stand still. I do the poling.',
    k2_bilge_aboard: 'Step aboard and stand still. I do the poling.',
    k2_bilge_errand1: 'The planks by the culvert are rotten. Break them and you are in the spillway.',
    k2_bilge_errand2: 'Two runs of teeth down there, too wide to jump. The pole is at the far end.',
    k2_bilge_thanks: 'My pole! The raft is yours, both ways, for as long as I float.',
    k2_pole: "Bilge's Pole", k2_poled: 'A ferryman\'s punt pole. Bring it back to Bilge at the dock.',
    k2_pole_take: 'Take',
    k2_culvert_dormant: 'The culvert grate is rusted shut. Something big is still lying on the far side.',
    gate_cache_seal: 'The way up is sealed with the vault\'s three seals.',
    gate_furnace_swords: 'The choir\'s heat would melt one blade. It needs two.',
    gate_archives_talon: 'The floor is frozen shut. Only TALONHOST\'s fall would crack it.',
    rl_sigil1d: 'Carried by the CARRIER. One of three seals of the old vault in the Conduits.',
    rl_sigil2d: 'Swallowed by MIREJAW. The second of the vault\'s three seals.',
    rl_sigil3d: 'Kept by UNDERTOW. The last of the vault\'s three seals.',
    pg_goal_ferry: "Cross the swamp: find Bilge",
    pg_goal_mire: "Hunt the swamp's crocodile",
    pg_goal_vault: "Open the old vault",
    pg_goal_prowler: "Climb to the Prowler",
    pg_goal_furnace: "Down to FURNACE CHOIR",
    pg_goal_connector: "Find the connector",
    pg_goal_brood: "Throw at TALONHOST",
    gear_duald: 'The Prism Prowler keeps it, and gives it up when purified. Hold attack and release to perform a hurricane swirl.',
    weapon_secondlock: 'The Prism Prowler keeps this blade.',
  },
  ar: {
    k2_ferry_need: 'لا يعبر هذا الماء إلا طوف بيلج.',
    n_bilge: 'بيلج',
    k2_bilge_1: 'احذري الماء يا صغيرة. لا شيء في المستنقع يشربه، هو الذي يشربك.',
    k2_bilge_2: 'أنا بيلج. أدفع الطوف الوحيد إلى الضفة الأخرى. ما تبحثين عنه يعيش هناك.',
    k2_ferry_ask: 'العبور بـ{N} خردة. أو أعيدي إليّ عصاي، سقطت في المصرف تحت هذا الرصيف.',
    k2_ferry_askpole: 'هذه عصاي! أعطيني إياها والطوف لك ذهابًا وإيابًا ما دمت أطفو.',
    k2_ferry_pay: 'ادفعي {N} خردة', k2_ferry_errand: 'ابحثي عن عصاه', k2_ferry_givepole: 'أعطيه العصا',
    k2_ferry_poor: 'الخردة لا تكفي.',
    k2_bilge_paid: 'اصعدي وقفي ساكنة. أنا أدفع الطوف.',
    k2_bilge_aboard: 'اصعدي وقفي ساكنة. أنا أدفع الطوف.',
    k2_bilge_errand1: 'ألواح الرصيف قرب المصرف متعفنة. اكسريها تصلي إلى المجرى.',
    k2_bilge_errand2: 'هناك صفّان من الأسنان، أعرض من أي قفزة. العصا في آخره.',
    k2_bilge_thanks: 'عصاي! الطوف لك ذهابًا وإيابًا ما دمت أطفو.',
    k2_pole: 'عصا بيلج', k2_poled: 'عصا دفع لصاحب العبّارة. أعيديها إلى بيلج عند الرصيف.',
    k2_pole_take: 'خذي',
    k2_culvert_dormant: 'شبكة المصرف صدئة ومغلقة. شيء ضخم ما زال رابضًا خلفها.',
    gate_cache_seal: 'الطريق إلى الأعلى مختوم بأختام القبو الثلاثة.',
    gate_furnace_swords: 'حرارة الجوقة تذيب نصلًا واحدًا. تحتاجين اثنين.',
    gate_archives_talon: 'الأرض متجمدة مغلقة. لا يشقها إلا سقوط تالونهوست.',
    rl_sigil1d: 'كان يحمله الحامل. أحد أختام القبو القديم الثلاثة في القنوات.',
    rl_sigil2d: 'ابتلعه مايرجو. ثاني أختام القبو الثلاثة.',
    rl_sigil3d: 'احتفظ به أندرتو. آخر أختام القبو الثلاثة.',
    pg_goal_ferry: "اعبري المستنقع: جدي بيلج",
    pg_goal_mire: "اصطادي تمساح المستنقع",
    pg_goal_vault: "افتحي القبو القديم",
    pg_goal_prowler: "اصعدي إلى قط الموشور",
    pg_goal_furnace: "انزلي إلى جوقة الفرن",
    pg_goal_connector: "جدي الوصلة",
    pg_goal_brood: "ارمي على تالونهوست",
    gear_duald: 'يحفظه قط الموشور ويسلّمه حين يتطهّر. اضغطي مطولاً ثم اتركي الهجوم لدوامة إعصار.',
    weapon_secondlock: 'قط الموشور يحفظ هذا النصل.',
  },
  tr: {
    k2_ferry_need: 'Bu suyu yalnızca Bilge’in salı geçer.',
    n_bilge: 'Bilge',
    k2_bilge_1: 'Suya dikkat et küçük. Bataklıkta kimse bu suyu içmez; o seni içer.',
    k2_bilge_2: 'Ben Bilge. Karşıya geçen tek salı ben iterim. Ne arıyorsan karşı kıyıda yaşıyor.',
    k2_ferry_ask: 'Geçiş {N} hurda. Ya da sırığımı geri getir; bu iskelenin altındaki savağa düştü.',
    k2_ferry_askpole: 'Bu benim sırığım! Ver onu, sal gidiş dönüş senin, ben yüzdükçe.',
    k2_ferry_pay: '{N} hurda öde', k2_ferry_errand: 'Sırığını bul', k2_ferry_givepole: 'Sırığı ver',
    k2_ferry_poor: 'Yeterli hurda yok.',
    k2_bilge_paid: 'Bin ve kıpırdama. Sırığı ben iterim.',
    k2_bilge_aboard: 'Bin ve kıpırdama. Sırığı ben iterim.',
    k2_bilge_errand1: 'Menfezin yanındaki tahtalar çürük. Kır onları, savağa düşersin.',
    k2_bilge_errand2: 'Aşağıda iki sıra diş var, hiçbir atlayışın aşamayacağı kadar geniş. Sırık en sonda.',
    k2_bilge_thanks: 'Sırığım! Sal gidiş dönüş senin, ben yüzdükçe.',
    k2_pole: 'Bilge’in Sırığı', k2_poled: 'Bir salcının sırığı. İskeledeki Bilge’e geri götür.',
    k2_pole_take: 'Al',
    k2_culvert_dormant: 'Menfez ızgarası paslanıp kapanmış. Öbür tarafta büyük bir şey hâlâ yatıyor.',
    gate_cache_seal: 'Yukarı yol kasanın üç mührüyle mühürlü.',
    gate_furnace_swords: 'Korosunun ısısı tek kılıcı eritir. İki kılıç gerek.',
    gate_archives_talon: 'Zemin donmuş, kapalı. Onu ancak TALONHOST’un düşüşü çatlatır.',
    rl_sigil1d: 'CARRIER taşıyordu. Kanallardaki eski kasanın üç mühründen biri.',
    rl_sigil2d: 'MIREJAW yutmuştu. Kasanın üç mühründen ikincisi.',
    rl_sigil3d: 'UNDERTOW saklıyordu. Kasanın üç mühründen sonuncusu.',
    pg_goal_ferry: "Bataklığı geç: Bilge’i bul",
    pg_goal_mire: "Bataklık timsahını avla",
    pg_goal_vault: "Eski kasayı aç",
    pg_goal_prowler: "Avcı’ya tırman",
    pg_goal_furnace: "FURNACE CHOIR’a in",
    pg_goal_connector: "Bağlayıcıyı bul",
    pg_goal_brood: "TALONHOST’a fırlat",
    gear_duald: 'Prizma Avcısı saklar, arındırılınca verir. Kasırga dönüşü için saldırıyı basılı tut ve bırak.',
    weapon_secondlock: 'Bu kılıcı Prizma Avcısı saklıyor.',
  },
  zh: {
    k2_ferry_need: '只有比尔吉的筏子能渡过这片水。',
    n_bilge: '比尔吉',
    k2_bilge_1: '小家伙，当心水。泥沼里没有东西喝这水——是水喝掉你。',
    k2_bilge_2: '我是比尔吉，撑着唯一一条筏子过河。你要找的东西住在对岸。',
    k2_ferry_ask: '渡一次要{N}废料。或者把我的撑杆找回来——它掉进了这码头下面的泄洪道。',
    k2_ferry_askpole: '这是我的撑杆！给我，筏子就归你用，来回都行，只要我还浮着。',
    k2_ferry_pay: '支付{N}废料', k2_ferry_errand: '去找撑杆', k2_ferry_givepole: '交还撑杆',
    k2_ferry_poor: '废料不够。',
    k2_bilge_paid: '上来，站稳别动。撑船的事交给我。',
    k2_bilge_aboard: '上来，站稳别动。撑船的事交给我。',
    k2_bilge_errand1: '涵洞旁的木板烂透了。打碎它们，你就掉进泄洪道了。',
    k2_bilge_errand2: '下面有两排尖牙，宽得跳不过去。撑杆在最里头。',
    k2_bilge_thanks: '我的撑杆！筏子归你用，来回都行，只要我还浮着。',
    k2_pole: '比尔吉的撑杆', k2_poled: '摆渡人的撑杆。把它带回码头交给比尔吉。',
    k2_pole_take: '拿起',
    k2_culvert_dormant: '涵洞的铁栅锈死了。另一边还卧着什么大家伙。',
    gate_cache_seal: '向上的路被金库的三枚封印封住了。',
    gate_furnace_swords: '圣咏的热量会熔掉一把剑。需要两把。',
    gate_archives_talon: '地面冻死了。只有TALONHOST倒下才能震裂它。',
    rl_sigil1d: '由CARRIER携带。管道中旧金库的三枚封印之一。',
    rl_sigil2d: '被MIREJAW吞下。金库三枚封印中的第二枚。',
    rl_sigil3d: '由UNDERTOW保管。金库三枚封印中的最后一枚。',
    pg_goal_ferry: "渡过沼泽：找比尔吉",
    pg_goal_mire: "猎杀沼泽鳄鱼",
    pg_goal_vault: "打开旧金库",
    pg_goal_prowler: "爬上去找潜行者",
    pg_goal_furnace: "下到FURNACE CHOIR",
    pg_goal_connector: "找到连接器",
    pg_goal_brood: "投向TALONHOST",
    gear_duald: '棱镜潜行者保管着它，净化后便交出。按住攻击再松开，施展飓风旋斩。',
    weapon_secondlock: '这把剑由棱镜潜行者保管。',
  },
  ru: {
    k2_ferry_need: 'Эту воду пересекает только плот Билджа.',
    n_bilge: 'Билдж',
    k2_bilge_1: 'Осторожно с водой, малышка. В Трясине её никто не пьёт — она пьёт тебя.',
    k2_bilge_2: 'Я Билдж. Толкаю единственный плот на тот берег. Что бы ты ни искала, оно живёт там.',
    k2_ferry_ask: 'Переправа — {N} лома. Или верни мой шест: он упал в водосброс под этим причалом.',
    k2_ferry_askpole: 'Это мой шест! Отдай — и плот твой, туда и обратно, пока я на плаву.',
    k2_ferry_pay: 'Заплатить {N} лома', k2_ferry_errand: 'Найти шест', k2_ferry_givepole: 'Отдать шест',
    k2_ferry_poor: 'Не хватает лома.',
    k2_bilge_paid: 'Ступай на плот и стой смирно. Толкать буду я.',
    k2_bilge_aboard: 'Ступай на плот и стой смирно. Толкать буду я.',
    k2_bilge_errand1: 'Доски у трубы прогнили. Разбей их — и ты в водосбросе.',
    k2_bilge_errand2: 'Там два ряда зубьев, шире любого прыжка. Шест в самом конце.',
    k2_bilge_thanks: 'Мой шест! Плот твой, туда и обратно, пока я на плаву.',
    k2_pole: 'Шест Билджа', k2_poled: 'Шест паромщика. Верни его Билджу на причал.',
    k2_pole_take: 'Взять',
    k2_culvert_dormant: 'Решётка трубы заржавела намертво. С той стороны ещё лежит что-то большое.',
    gate_cache_seal: 'Путь наверх запечатан тремя печатями хранилища.',
    gate_furnace_swords: 'Жар хора расплавит один клинок. Нужны два.',
    gate_archives_talon: 'Пол намертво промёрз. Его расколет лишь падение TALONHOST.',
    rl_sigil1d: 'Её нёс CARRIER. Одна из трёх печатей старого хранилища в Каналах.',
    rl_sigil2d: 'Её проглотил MIREJAW. Вторая из трёх печатей хранилища.',
    rl_sigil3d: 'Её хранил UNDERTOW. Последняя из трёх печатей хранилища.',
    pg_goal_ferry: "Через болото: найди Билджа",
    pg_goal_mire: "Выследи болотного крокодила",
    pg_goal_vault: "Открой старое хранилище",
    pg_goal_prowler: "Наверх, к Охотнику",
    pg_goal_furnace: "Вниз, к FURNACE CHOIR",
    pg_goal_connector: "Найди соединитель",
    pg_goal_brood: "Бросок в TALONHOST",
    gear_duald: 'Его хранит Призматический охотник и отдаёт, очистившись. Удерживайте и отпустите атаку для вихря.',
    weapon_secondlock: 'Этот клинок хранит Призматический охотник.',
  },
}));
// the swamp is in both worlds; the road's order (gates, seals, goals, the
// blade) is the robot world's alone
function k2SplitText(all) {
  const ROBO = /^(gate_|rl_sigil|pg_goal_|gear_duald|weapon_secondlock)/;
  const both = {}, robo = { robo: true };
  for (const L of Object.keys(all)) {
    both[L] = {}; robo[L] = {};
    for (const k of Object.keys(all[L])) (ROBO.test(k) ? robo : both)[L][k] = all[L][k];
  }
  TEXT_LAYERS.push(both);
  return robo;
}
