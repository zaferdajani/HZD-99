// ===========================================================================
// THE SEWER — UNDERTOW's caves, as the robot world plays them (owner,
// 2026-11-24).
//
// "One of the caves would be a sewer, actually, not a cave. And just like in
// Super Mario, where you enter the sewer from an opening... you hold the door
// on the floor, the metallic door, which looks like a waffle... you open it up
// with a cracking metallic rusty sound, and you dive inside... that takes you
// to a level where you start from the top, falling on a platform that goes
// down... Imagine Ninja Turtles... Crocodile should give you shield out of his
// skin... a gift of shed skin that you bring back to that kingdom NPC to craft
// a shield... Putting the shield on will probably make you slower, but adds
// defense bonus... make going to the crocodile a quest."
// His answers: the sewer IS UNDERTOW's three caves (GB1/GB1T/GB1D); the smith
// is a new robot pipe-smith down there; the shell rides on her back; swimming
// is not decided yet (she still cannot swim).
//
// THE ROAD THROUGH IT
//   B6, the relay gallery: a rusted floor HATCH (the old ring's place). Dark
//   until the CARRIER falls ("rusted shut"). She crouches, hauls the grate up,
//   pushes it over — creak, clang — hops, and drops in.
//   GB1, the gallery: she falls from the top of a tall shaft onto a LIFT,
//   which takes her down when she stands on it. RIVET, the pipe-smith, keeps
//   his forge here. He asks for MIREJAW's shed skin; the tunnel east is his
//   to open, and he will not let her into it bare.
//   The swamp (conduits-road.js): MIREJAW, beaten, leaves his shed skin.
//   Back at the forge, Rivet makes the HIDE SHELL: worn on her back, it turns
//   what comes from behind and takes the edge off a heavy blow — and she runs
//   slower in it. The gear screen puts it on and takes it off.
//   GB1T, the tunnel; GB1D, the cistern, where UNDERTOW waits.
// The hero's world (NOSTOS) keeps its caves exactly as they were.
// ===========================================================================

const SW = { lift: null, liftTop: false, hatchArrive: false, backCache: {} };
// water channels in each sewer room: [x0 tile, x1 tile, surface row] (absolute
// rows; open rows over a solid bed, as the swamp's are)
const SW_WATER = { GB1: [[17, 20, 22], [26, 28, 22]], GB1T: [[9, 12, 22], [21, 24, 22], [31, 33, 22]], GB1D: [[10, 13, 22]] };
// the shaft lift in GB1: x tile, width, top deck row, bottom deck (the floor)
const SW_LIFT = { tx: 8, wT: 3, top: 5, bot: 22, speed: 230 };
// the sewer's raised roof: GB1's shaft she falls down, and the tunnel and the
// cistern built to the same height so every join between them agrees row for row
const SW_AIR = 7;
// the shell: how much slower, and how a blow from behind is turned
const SW_SHELL = { speed: 0.86, heatPer: 1, breakAt: 3, cool: 0.55 };

function swOn(save) {
  const s = save || (typeof G !== 'undefined' && G.save);
  // (the save's own world when it names one: themeId answers for the menu
  // while a run is being started)
  const hero = s && s.theme ? s.theme === 'hero' : (typeof isHero === 'function' && isHero());
  return !hero && !!(s ? (s.storyVersion == null || s.storyVersion >= 2) : true);
}
function swRoom(id) { return /^GB1/.test(id || '') && swOn(); }

// ---- the rooms -------------------------------------------------------------
// Kept beside the caves they replace; sewerApply puts the right three in ROOMS
// for whichever world is being played (and clears their built grids).
const SW_CAVES = {};
const SW_ROOMS = {
  // THE GALLERY. A tall shaft at the west end (the hatch's drop), the lift in
  // it, two channels across the walk, and Rivet's forge in the alcove east.
  GB1: { zone: 'B', grotto: 1, mus: 'sewer', w: 40, h: 17 + SW_AIR, air: SW_AIR, decks: 0,
    exits: { R: { to: 'GB1T', flag: 'shellMade', or: ['sageTame_GB1D'], why: 'sw_smith_wait' } },
    ents: [['swsmith', 31, 15 + SW_AIR], ['bench', 36, 15 + SW_AIR], ['bat', 23, 9 + SW_AIR],
           ['scrap', 13, 15 + SW_AIR, 30], ['scrap', 23, 15 + SW_AIR, 30]],
    build(g) {
      frame(g); openR(g);
      for (const [x0, x1] of SW_WATER.GB1) rect(g, x0, 15, x1, 15, '.');   // the channels (row 22 overall)
    } },
  // THE TUNNEL: three channels to jump, its bats and a hopper on the walk
  GB1T: { zone: 'B', grotto: 1, mus: 'sewer', w: 40, h: 17 + SW_AIR, air: SW_AIR, exits: { L: 'GB1', R: 'GB1D' },
    ents: [['term', 17, 15 + SW_AIR, 5], ['bat', 14, 6 + SW_AIR], ['bat', 27, 5 + SW_AIR], ['hopper', 28, 15 + SW_AIR],
           ['scrap', 6, 15 + SW_AIR, 30], ['scrap', 36, 15 + SW_AIR, 40]],
    build(g) {
      frame(g); openL(g); openR(g);
      for (const [x0, x1] of SW_WATER.GB1T) rect(g, x0, 15, x1, 15, '.');   // (row 22 overall)
    } },
  // THE CISTERN: UNDERTOW at the far end, on dry flags; one channel on the way
  GB1D: { zone: 'B', grotto: 1, mus: 'sewer', w: 44, h: 17 + SW_AIR, air: SW_AIR, exits: { L: 'GB1T' },
    ents: [['bat', 16, 5 + SW_AIR], ['sage', 33, 15 + SW_AIR], ['scrap', 6, 15 + SW_AIR, 30], ['scrap', 22, 15 + SW_AIR, 50], ['scrap', 40, 15 + SW_AIR, 60]],
    build(g) {
      frame(g); openL(g);
      for (const [x0, x1] of SW_WATER.GB1D) rect(g, x0, 15, x1, 15, '.');
    } },
};
function sewerApply(save) {
  if (typeof ROOMS === 'undefined') return;
  const on = swOn(save);
  for (const id of Object.keys(SW_ROOMS)) {
    if (!SW_CAVES[id] && ROOMS[id] && ROOMS[id] !== SW_ROOMS[id]) SW_CAVES[id] = ROOMS[id];
    const want = on ? SW_ROOMS[id] : SW_CAVES[id];
    if (want && ROOMS[id] !== want) {
      ROOMS[id] = want;
      if (typeof gridCache !== 'undefined') delete gridCache[id];
    }
  }
  // The old cave's ring left GB1 for late-game B4. Reusing that destination
  // here made the one-way hatch an unintended shortcut past B4's normal gate.
  // The sewer keeps a return ring, but sends it back to the relay gallery that
  // owns the hatch. The hero-world cave keeps its original B4 route unchanged.
  if (typeof GATE_ROOM !== 'undefined' && GATE_ROOM.GB1) {
    if (!SW_CAVES._gate) SW_CAVES._gate = GATE_ROOM.GB1;
    const plain = SW_CAVES._plain || (SW_CAVES._plain = (({ gx, gy, ...r }) => ({
      ...r, to: 'B6', ax: 26 / 32, need: 'bossCarrier'
    }))(SW_CAVES._gate));
    GATE_ROOM.GB1 = on ? plain : SW_CAVES._gate;
  }
  if (typeof ROOM_VISTA !== 'undefined') {
    if (on) { ROOM_VISTA.GB1 = 'sewerGallery'; ROOM_VISTA.GB1T = 'sewerTunnel'; ROOM_VISTA.GB1D = 'sewerCistern'; }
    else for (const id of ['GB1', 'GB1T', 'GB1D']) if (/^sewer/.test(ROOM_VISTA[id] || '')) delete ROOM_VISTA[id];
  }
  if (on && save) sewerMigrate(save);
}
// A SAVE FROM BEFORE THE SEWER: a crocodile already beaten left his skin, so
// the shell is still one walk to Rivet away; past UNDERTOW, the tunnel is open
function sewerMigrate(save) {
  const f = save.flags = save.flags || {};
  save.bag = save.bag || {};
  if (f.bossMirejaw && !f.shellMade && !save.bag.mjSkin && !f.swSkinGiven) { save.bag.mjSkin = 1; f.swSkinGiven = 1; }
}
sewerApply(null);

// ---- the hatch ---------------------------------------------------------------
// A floor door: four fired cells of the lid (closed, cracked, raised, thrown
// open with the ladder showing) and eight of HER opening it, one sheet per
// blade she carries (assets/source/sewer/). The lid's cells follow hers.
const SW_HATCH = {
  T: 2.35,                    // the whole beat, seconds
  // her cells over the beat: crouch-grab, strain, lift, push, look, hop, air, drop
  at: [0, 0.30, 0.62, 0.92, 1.24, 1.52, 1.72, 1.92],
  creakAt: 0.30, clangAt: 1.26, fadeAt: 2.02,
  stand: 50,                  // she stands this far left of the hole's middle (px)
  // THE HATCH IS A HOLE IN BROKEN FLOOR (owner, 2026-11-25: "the floor where
  // the hero jumps in should show like a hole in the ground... as if there's
  // something broken in the ground"). The plate is a stretch of smashed slab
  // with the grate sunk in it and the shaft cut down below: its floor row
  // goes on the game's floor line, the shaft hangs into the ground, and the
  // slab's sides fade into the real floor (assets/source/sewer/2026-11-25/).
  rimW: 118,                  // the grate frame's width on the floor (px)
  artRim: 206,                // ...its width in the plate's 336-px cell
  artFloor: 296,              // the plate's walking line: the slab's back edge (row of its 576), so the grate lies BELOW it, in the pit
  flat: 0.8,                  // the plate looks down more steeply than the game does: a little flatter
  lip: -12,                   // her drop is clipped this far BELOW the floor line: into the mouth
  dh: 97.4,                   // her strip's cell drawn so her body is her own height (70 px)
  floor: 296 / 320,           // her strip's floor row
  key: { claws: 'heroHatchBare', single: 'heroHatchSingle', dual: 'heroHatchDual', joined: 'heroHatchJoined' },
};
function swHatchKey() { const w = typeof weaponMode === 'function' ? weaponMode(G.save) : 'claws'; return SW_HATCH.key[w] || SW_HATCH.key.claws; }
// which of her cells, which of the lid's, at time t into the beat
function swHatchCell(t) { let i = 0; while (i < 7 && t >= SW_HATCH.at[i + 1]) i++; return i; }
function swLidCell(t) { const h = swHatchCell(t); return h <= 1 ? 0 : h === 2 ? 1 : h === 3 ? (t >= SW_HATCH.clangAt ? 3 : 2) : 3; }
// THE HATCH IS IN THE FLOOR: she opens it standing on that floor. A door is
// found by how far along the room she is (gateHere); a ledge above the hatch is
// as near along as the floor beside it, and from there the whole opening played
// at floor level, off the top of her camera.
function swHatchReach(def) {
  if (!player || !G.roomDef) return false;
  return Math.abs(player.y + player.h - (G.roomDef.h - 2) * TILE) < 24;
}
// gateEnter hands the hatch over here: she lines up LEFT of the hole, facing it
function swHatchBegin(g) {
  if (!g || !player) return;
  const hx = gateWorldX(g.def);
  // SHE OPENS IT FROM THE SIDE SHE CAME FROM, facing it — her strip mirrored
  // when that is the east side. Walking round it to the west would end in a
  // flip on the spot, and nothing in this game turns by flipping.
  g.side = (player.x + player.w / 2) > hx ? 1 : -1;
  g.axTo = hx + g.side * SW_HATCH.stand - player.w / 2;
  const need = g.axTo - player.x;
  g.align = Math.abs(need) < 4 ? 1 : 0;
  g.alignDur = Math.min(0.6, Math.abs(need) / 300);
  g.hatch = 1; g.ht = 0; g.turn = 1;
  player.iT = Math.max(player.iT || 0, 0.8);
  if (typeof mediaFetch === 'function') { mediaFetch(swHatchKey(), 1); mediaFetch('sewerHatch', 1); }
}
// after the align beat: the opening, then the drop, then the room below
function swHatchStep(g, dt) {
  const t0 = g.ht; g.ht += dt;
  const t = g.ht;
  // (her controls are held: nothing may bite her while they are)
  if (player) { player.vx = 0; player.face = player.faceVis = -(g.side || -1); player.iT = Math.max(player.iT || 0, 0.25); }
  const cross = a => t0 < a && t >= a;
  if (cross(SW_HATCH.creakAt) && typeof playBuf === 'function') playBuf('sw_creak', 0.9);
  if (cross(SW_HATCH.clangAt)) {
    if (typeof playBuf === 'function') playBuf('sw_clang', 0.85);
    cam.shake = Math.max(cam.shake, 3);
    if (typeof padRumble === 'function') padRumble(0.5, 0.3, 140);
  }
  if (t >= SW_HATCH.T) {
    G.gateWalk = null;
    SW.hatchArrive = true;
    loadRoom(g.to);
    // SHE COMES IN AT THE TOP. The lift waits up the shaft; she falls onto it
    if (player) {
      const L = SW_LIFT;
      player.x = (L.tx + L.wT / 2) * TILE - player.w / 2;
      player.y = 1 * TILE; player.vx = 0; player.vy = 60; player.on = false;
      player.face = player.faceVis = 1;
      player.lastSafe = { x: player.x, y: (L.top) * TILE - player.h - 4 };
    }
    SW.hatchArrive = false;
  }
}
// the door pass: the hatch where the ring stood, its lid on her clock
function swDrawHatch(ds, gy, k, def) {
  if (typeof mediaFetch === 'function') mediaFetch('sewerHatch');
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.sewerHatch;
  if (!(im && im.naturalWidth)) return false;
  const g = G.gateWalk && G.gateWalk.def === def && G.gateWalk.hatch ? G.gateWalk : null;
  const cell = g && g.align >= 1 ? swLidCell(g.ht || 0) : 0;
  // (the lid lifting: the hatch shivers while she strains at it)
  const strain = g && g.align >= 1 && swHatchCell(g.ht || 0) === 1 ? Math.sin(performance.now() / 18) * 0.8 : 0;
  const cw = im.naturalWidth / 4, ch = im.naturalHeight;
  // the plate's walking line on the floor line; the hole and its shaft below it
  const sx = SW_HATCH.rimW / SW_HATCH.artRim, sy = sx * SW_HATCH.flat, dw = cw * sx, dh = ch * sy;
  const dormant = gateLocked(def);
  c.save();
  if (dormant) c.filter = 'brightness(0.7) saturate(0.75)';
  c.drawImage(im, cell * cw, 0, cw, ch, ds - dw / 2 + strain, gy - SW_HATCH.artFloor * sy, dw, dh);
  if (typeof G !== 'undefined') G._hatchRect = { x: ds - dw / 2, y: gy - SW_HATCH.artFloor * sy, w: dw, h: dh, gy, cell };
  c.restore();
  return true;
}
// her, opening it (drawn by drawGateWalk, in the screen's own space)
function swHatchDrawHer(g) {
  if (!player) return;
  const key = swHatchKey();
  const t = g.ht || 0, i = swHatchCell(t);
  const side = g.side || -1, hx = gateWorldX(g.def), x0 = hx + side * SW_HATCH.stand;
  // the hop carries her from where she stood to over the hole; the drop takes
  // her down into it
  const hopK = clamp((t - SW_HATCH.at[5]) / (SW_HATCH.at[7] - SW_HATCH.at[5]), 0, 1);
  const wx = x0 + (hx - x0) * (hopK * hopK * (3 - 2 * hopK));
  const dropK = clamp((t - SW_HATCH.at[7]) / (SW_HATCH.T - SW_HATCH.at[7]), 0, 1);
  const feet = (G.roomDef.h - 2) * TILE + dropK * dropK * 120;
  const sx = wx - camSX(), base = feet - camSY() + (1 - SW_HATCH.floor) * SW_HATCH.dh + 3;
  const lipY = (G.roomDef.h - 2) * TILE - camSY() - SW_HATCH.lip;
  c.save();
  if (i >= 6) { c.beginPath(); c.rect(sx - 200, base - 400, 400, lipY - (base - 400)); c.clip(); }
  const drew = typeof drawStripCell === 'function' && drawStripCell(c, key, i, 8, sx, base, SW_HATCH.dh, side > 0);
  c.restore();
  G.gateBackKey = drew ? key : '';
  G.gateStepCell = drew ? i : -1;
  // the dark takes the picture as she goes under
  if (t > SW_HATCH.fadeAt) {
    c.save(); c.globalAlpha = clamp((t - SW_HATCH.fadeAt) / (SW_HATCH.T - SW_HATCH.fadeAt), 0, 1);
    c.fillStyle = '#000'; c.fillRect(-2000, -2000, 6000, 6000); c.restore();
  }
}

// ---- the lift --------------------------------------------------------------
// A platform like the raft: x/y/w/h and the per-frame delta the carry reads.
// It waits at the top of the shaft for whoever drops through the hatch, and
// takes her down when she stands on it.
class SwLift {
  constructor(top) {
    const L = SW_LIFT;
    this.w = L.wT * TILE; this.h = 12;
    this.x = L.tx * TILE;
    this.yTop = L.top * TILE; this.yBot = L.bot * TILE - 2;
    this.y = top ? this.yTop : this.yBot;
    this.fdx = 0; this.fdy = 0; this.st = top ? 'top' : 'bot'; this.onT = 0; this.t = 0;
    this.swlift = true;
  }
  update(dt) {
    this.t += dt;
    const on = swOnLift(this);
    let ny = this.y;
    if (this.st === 'top') { this.onT = on ? this.onT + dt : 0; if (this.onT > 0.3) { this.st = 'down'; if (typeof playBuf === 'function') playBuf('sw_creak', 0.45, 1.3); } }
    else if (this.st === 'down') {
      // it starts with a lurch and settles at the floor, never a constant slide
      const d = this.yBot - this.y, k = Math.min(1, 0.25 + (this.y - this.yTop) / 90) * Math.min(1, 0.2 + d / 140);
      ny = this.y + Math.min(d, SW_LIFT.speed * k * dt);
      if (this.yBot - ny < 0.5) { ny = this.yBot; this.st = 'bot'; cam.shake = Math.max(cam.shake, 2); if (typeof playBuf === 'function') playBuf('sw_clang', 0.35, 1.25); }
    }
    this.fdx = 0; this.fdy = ny - this.y; this.y = ny;
  }
  draw(c2) {
    // the chains it hangs from, up into the dark of the shaft
    c2.save();
    c2.strokeStyle = 'rgba(70,58,46,0.9)'; c2.lineWidth = 3;
    for (const ex of [this.x + 8, this.x + this.w - 8]) {
      c2.beginPath(); c2.moveTo(ex, 0); c2.lineTo(ex, this.y); c2.stroke();
    }
    c2.restore();
    if (!(typeof drawDeck === 'function' && typeof platVariant === 'function' && drawDeck(c2, this.x, this.y - 5, this.w, 30, platVariant()))) {
      c2.fillStyle = '#4a3a2c'; c2.fillRect(this.x, this.y, this.w, this.h);
    }
  }
}
function swOnLift(L) {
  if (!L || !player) return false;
  const feet = player.y + player.h, cx = player.x + player.w / 2;
  return cx > L.x + 2 && cx < L.x + L.w - 2 && Math.abs(feet - L.y) < 8 && player.vy >= -1;
}
function swLift() { return (G.plats || []).find(p => p.swlift) || null; }

// ---- room load / per frame -------------------------------------------------
function swRoomLoaded(id) {
  SW.liftTop = !!SW.hatchArrive;
  // the sewer's water under the score, streamed and looped; and in a room with
  // no air of its own (neither the sewer nor the swamp) the last bed stops
  if (swRoom(id)) { if (typeof ambPlay === 'function') ambPlay('sw_amb', 0.4); }
  else if (!/^SW/.test(id) && typeof ambStop === 'function') ambStop();
}
function swUpdate(dt) {
  const id = G.roomId;
  if (SW.shellHeat > 0) SW.shellHeat = Math.max(0, SW.shellHeat - dt * SW_SHELL.cool);
  swForgeStep(dt);
  if (!swRoom(id)) return;
  if (id === 'GB1' && G.plats && !swLift()) G.plats.push(new SwLift(SW.liftTop));
  // THE WATER: she still cannot swim (owner: "not yet"). In, and she is pulled
  // out where she went in, as the swamp's water does
  const W = SW_WATER[id];
  if (W && player && !player.dead && !G.rescue) {
    const feet = player.y + player.h, cx = player.x + player.w / 2;
    for (const [x0, x1, row] of W) {
      if (cx > x0 * TILE && cx < (x1 + 1) * TILE && feet > row * TILE + 14) {
        if (typeof playBuf === 'function') playBuf('k2_splash', 0.6);
        player.hurt(1, player.x, 'sewer.water');   // (her own x: water has no side)
        if (!player.dead && typeof hazardRescue === 'function') hazardRescue(player);
        break;
      }
    }
  }
}
function swDrawFront(c2) {
  const id = G.roomId;
  if (!swRoom(id)) return;
  const W = SW_WATER[id], now = performance.now() / 1000;
  if (!W) return;
  for (const [x0, x1, row] of W) {
    const X0 = x0 * TILE, X1 = (x1 + 1) * TILE, Y = row * TILE + 6, B = (row + 1) * TILE + 8;
    // one tile deep and soft at its banks: water lying in a cut, never a block
    c2.save();
    c2.beginPath();
    c2.moveTo(X0 - 6, Y);
    for (let x = X0; x <= X1; x += 8) c2.lineTo(x, Y + Math.sin(x * 0.05 + now * 1.6) * 1.2);
    c2.lineTo(X1 + 6, Y);
    c2.quadraticCurveTo(X1 + 2, B - 4, X1 - 10, B);
    c2.lineTo(X0 + 10, B);
    c2.quadraticCurveTo(X0 - 2, B - 4, X0 - 6, Y);
    c2.closePath();
    const g = c2.createLinearGradient(0, Y, 0, B);
    g.addColorStop(0, 'rgba(46,62,40,0.62)'); g.addColorStop(1, 'rgba(14,22,14,0.9)');
    c2.fillStyle = g; c2.fill();
    c2.restore();
    // the skin of it: a slow wandering line, scum drifting along the flow
    c2.strokeStyle = 'rgba(150,180,140,0.32)'; c2.lineWidth = 2;
    c2.beginPath();
    for (let x = X0; x <= X1; x += 8) {
      const yy = Y + Math.sin(x * 0.05 + now * 1.6) * 1.2 + Math.sin(x * 0.017 - now * 0.9) * 0.9;
      if (x === X0) c2.moveTo(x, yy); else c2.lineTo(x, yy);
    }
    c2.stroke();
    c2.fillStyle = 'rgba(120,140,80,0.24)';
    const flow = (now * 22) % 40;
    for (let x = X0 + 6 + flow; x < X1 - 6; x += 40) { c2.beginPath(); c2.ellipse(x, Y + 3, 7, 1.6, 0, 0, 7); c2.fill(); }
  }
}

// ---- Rivet, the pipe-smith -------------------------------------------------
// His filmed loop (assets/characters/sewer/smith_talk.webp, a Higgsfield take
// cut by tools/vidstrip.cjs): slow while he works, quicker while he talks. He
// faces left in the take, and turns to face her.
function swDrawStatic(s) {
  if (s.type !== 'swsmith') return false;
  const talking = G.dialog && G.dialog.sw;
  const rate = talking ? 7 : 3.2;
  const faceR = player && player.x > s.x + s.w / 2;
  if (typeof k2Strip === 'function') k2Strip('sewerSmithTalk', 16, Math.floor(performance.now() / 1000 * rate), s.x + s.w / 2, s.y + s.h + 3, 118, faceR);
  return true;
}
function swNearLabel(s) { return s.type === 'swsmith' ? t('talk') : null; }
function swSay(lines, onEnd) { G.dialog = { name: t('n_swsmith'), lines: lines.map(k => t(k)), i: 0, npc: null, onEnd: onEnd || null, sw: 1 }; }
function swInteract(s) {
  if (s.type !== 'swsmith') return false;
  const f = G.save.flags, bag = G.save.bag = G.save.bag || {};
  if (f.shellMade) { swSay(['sw_smith_after']); return true; }
  if (bag.mjSkin) { swSay(['sw_smith_craft'], () => swForge(s)); return true; }
  if (!f.smithAsked) { swSay(['sw_smith_1', 'sw_smith_2', 'sw_smith_3'], () => { f.smithAsked = 1; persist(); }); return true; }
  swSay(['sw_smith_remind']);
  return true;
}
// THE FORGE: as the sword was made at Ratchet's, the shell is made here — the
// skin goes in, the hammer rings three times, and it is hers, on her back
function swForge(s) {
  const f = G.save.flags, bag = G.save.bag;
  delete bag.mjSkin;
  f.shellMade = 1; f.shellOwned = 1; f.shellOn = 1;
  persist();
  SW.forge = { t: 0, n: 0, x: s.x + s.w / 2, y: s.y + s.h * 0.5 };
}
// the hammer, on the game's own clock: three blows, then the card
function swForgeStep(dt) {
  const F = SW.forge; if (!F) return;
  F.t += dt;
  while (F.n < 3 && F.t >= 0.12 + F.n * 0.3) {
    if (typeof playBuf === 'function') playBuf('sw_clang', 0.5, 1.35 + F.n * 0.08);
    burst(F.x, F.y, 12, '#ffb35c', 220, 0.4, 260, 2.2, false);
    cam.shake = Math.max(cam.shake, 2);
    F.n++;
  }
  if (F.t >= 1.1) { SW.forge = null; showItem(t('sw_shell'), t('sw_shell_card'), 'sewerShellBack'); }
}
// MIREJAW's gift (game.js onBossDead): the skin he sheds, for Rivet's forge
function swSkinDrop() {
  if (!swOn()) return false;
  const f = G.save.flags, bag = G.save.bag = G.save.bag || {};
  if (f.shellMade) return false;
  bag.mjSkin = 1; f.swSkinGiven = 1;
  showItem(t('sw_skin'), t('sw_skind'), 'sewerSkin');
  return true;
}

// ---- the shell ---------------------------------------------------------------
function swShellOn() { const f = G.save && G.save.flags; return !!(f && f.shellOwned && f.shellOn) && swOn(); }
function swShellSpeedK() { return swShellOn() ? SW_SHELL.speed : 1; }
// A blow from BEHIND rings off the shell. Like the brace it heats: three inside
// a couple of seconds and the third gets through (no hiding inside it). A
// heavy blow from the front comes through one core lighter.
function swShellTurn(p, fromX, src) {
  if (!swShellOn()) return false;
  const pcx = p.x + p.w / 2, faceDir = p.faceVis || p.face || 1;
  // only a BLOW has a side: water, teeth, a pit, a pool hurt from where she
  // stands (their callers pass her own x), and no shell keeps those out
  if (fromX === p.x || Math.abs(fromX - pcx) < 4 || /water|pool|slag|spike|pit|fall/.test(src || '')) return false;
  const behind = (Math.sign(fromX - pcx) || faceDir) === -faceDir;
  if (!behind) return false;
  SW.shellHeat = (SW.shellHeat || 0) + SW_SHELL.heatPer;
  if (SW.shellHeat >= SW_SHELL.breakAt) { SW.shellHeat = 0; return false; }
  p.iT = 0.32; p.hurtPoseT = 0.1;
  cam.shake = Math.max(cam.shake, 3); sfx('block');
  if (typeof padRumble === 'function') padRumble(0.4, 0.2, 110);
  burst(pcx - faceDir * 12, p.y + p.h * 0.45, 10, '#d8cbb0', 220, 0.35, 120, 2.2, false);
  p.vx = faceDir * 90;                      // the blow shoves her the way she is facing
  return true;
}
function swShellCut(d) { return swShellOn() && d >= 2 ? d - 1 : d; }
// Where her back is in each cell she is drawn with, measured once off the cell
// itself (the strips are many and keep growing; a table would go stale). One
// small software canvas, read once per cell, never per frame and never the
// screen's own canvas.
let SW_MEAS = null;
function swBackOf(key, cell, cells) {
  const id = key + ':' + cell;
  const hit = SW.backCache[id];
  if (hit !== undefined) return hit;
  const im = typeof MEDIA_RAW !== 'undefined' && MEDIA_RAW[key];
  if (!(im && im.naturalWidth)) return null;
  if (!SW_MEAS) { const cv = document.createElement('canvas'); cv.width = cv.height = 64; SW_MEAS = cv.getContext('2d', { willReadFrequently: true }); }
  const cw = im.naturalWidth / cells, ch = im.naturalHeight, N = 64;
  SW_MEAS.clearRect(0, 0, N, N);
  SW_MEAS.drawImage(im, cell * cw, 0, cw, ch, 0, 0, N, N);
  let d; try { d = SW_MEAS.getImageData(0, 0, N, N).data; } catch (e) { SW.backCache[id] = false; return false; }
  const A = (x, y) => d[(y * N + x) * 4 + 3] > 70;
  const red = (x, y) => { const o = (y * N + x) * 4; return d[o] > 110 && d[o] > d[o + 1] * 1.6 && d[o] > d[o + 2] * 1.6; };
  let top = N, bot = -1;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (A(x, y)) { if (y < top) top = y; if (y > bot) bot = y; }
  if (bot < 0) { SW.backCache[id] = false; return false; }
  // the back: two fifths of the way up from her soles (the head is most of her)
  const yT = Math.round(bot - (bot - top) * 0.40);
  // the middle of her body on that row, then out to her back through anything
  // that is her (a cape stops it: the shell sits over the cape, at the back)
  let sum = 0, n = 0;
  for (let y = yT - 2; y <= yT + 2; y++) for (let x = 0; x < N; x++) if (A(x, y) && !red(x, y)) { sum += x; n++; }
  if (!n) { SW.backCache[id] = false; return false; }
  let x = Math.round(sum / n), gap = 0, back = x;
  for (; x >= 0; x--) {
    if (A(x, yT) && !red(x, yT)) { back = x; gap = 0; } else if (++gap > 2) break;
  }
  const out = { ax: (back + 1.5) / N, ay: yT / N, s: (bot - top) / N };
  SW.backCache[id] = out;
  return out;
}
// in the transform her cell is drawn in (Player.draw), from the cell of the
// frame before — a frame's lag nobody can see, and it lets the shell go BEHIND her
function swShellOverlay(c2, pose) {
  if (!pose || !swShellOn()) return;
  const b = swBackOf(pose.key, pose.f, pose.cells);
  if (!b) return;
  if (typeof mediaFetch === 'function') mediaFetch('sewerShellSide');
  const im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG.sewerShellSide;
  if (!(im && im.naturalWidth)) return;
  const raw = MEDIA_RAW[pose.key];
  const cw = raw.naturalWidth / pose.cells, chh = raw.naturalHeight, h = pose.height, dw = h * (cw / chh);
  const px = -dw / 2 + b.ax * dw, py = -h + b.ay * h;
  const sh = Math.max(18, b.s * h * 0.5), sw = sh * (im.naturalWidth / im.naturalHeight);
  c2.save();
  c2.translate(pose.cx, pose.base);
  if (pose.flip) c2.scale(-1, 1);
  // drawn BEHIND her (Player.draw calls this before her body): the dome stands
  // out past her back, its top behind her shoulders, its straps hidden by her
  c2.drawImage(im, px - sw * 0.62, py - sh * 0.62, sw, sh);
  c2.restore();
}

// ---- the goal arrow --------------------------------------------------------
function swGoalRoom(key) { return ({ pg_goal_sewer: 'GB1', pg_goal_smith: 'GB1' })[key] || null; }   // (through the hatch: the arrow leads to it, then down it)

// ---- words: all five languages -----------------------------------------------
TEXT_LAYERS.push({
  en: {
    n_swsmith: 'Rivet',
    sw_hatch_rusted: 'The hatch is rusted shut.',
    sw_smith_1: 'Watch the channels. I am Rivet. I mend what the water eats.',
    sw_smith_2: 'You are thin plate for what waits in the cistern. I could forge you a shell, if I had a hide to forge.',
    sw_smith_3: 'The crocodile in the Mire sheds his skin. Bring it to me.',
    sw_smith_remind: 'No skin, no shell. The crocodile is in the Mire.',
    sw_smith_craft: 'His skin! Hold still.',
    sw_smith_after: 'It slows you down. It also turns what comes from behind.',
    sw_smith_wait: 'Rivet will not let you into the tunnel without a shell.',
    sw_skin: "MIREJAW's Shed Skin", sw_skind: 'Take it to Rivet in the sewer.',
    i_mjSkin: "MIREJAW's Shed Skin", i_mjSkind: 'For Rivet the pipe-smith, in the sewer.',
    sw_shell: 'Hide Shell', sw_shelld: 'Worn on your back: blows from behind are turned, heavy blows are lighter. You run slower.',
    sw_shell_card: 'Blows from behind are turned. You run slower. Wear it or take it off in Gear.',
    sw_backslot: 'Back',
    pg_goal_sewer: 'Open the hatch in the relay gallery',
    pg_goal_smith: 'Take the skin to Rivet',
  },
  ar: {
    n_swsmith: 'ريفِت',
    sw_hatch_rusted: 'الفتحة مغلقة بالصدأ.',
    sw_smith_1: 'انتبهي للقنوات. أنا ريفِت. أصلح ما يأكله الماء.',
    sw_smith_2: 'دروعك رقيقة لما ينتظرك في الخزان. أستطيع أن أصنع لك درعًا لو كان عندي جلد.',
    sw_smith_3: 'تمساح المستنقع ينسلخ من جلده. أحضريه لي.',
    sw_smith_remind: 'لا جلد، لا درع. التمساح في المستنقع.',
    sw_smith_craft: 'جلده! اثبتي.',
    sw_smith_after: 'يبطئك. ويصدّ ما يأتي من خلفك.',
    sw_smith_wait: 'ريفِت لن يدعك تدخلين النفق بلا درع.',
    sw_skin: 'جلد مايرجو المنسلخ', sw_skind: 'خذيه إلى ريفِت في المجاري.',
    i_mjSkin: 'جلد مايرجو المنسلخ', i_mjSkind: 'لريفِت صانع الأنابيب في المجاري.',
    sw_shell: 'درع الجلد', sw_shelld: 'على ظهرك: يصدّ الضربات من الخلف ويخفف الثقيلة. تجرين أبطأ.',
    sw_shell_card: 'يصدّ الضربات من الخلف. تجرين أبطأ. البسيه أو اخلعيه من العتاد.',
    sw_backslot: 'الظهر',
    pg_goal_sewer: 'افتحي الفتحة في رواق المرحّلات',
    pg_goal_smith: 'خذي الجلد إلى ريفِت',
  },
  tr: {
    n_swsmith: 'Rivet',
    sw_hatch_rusted: 'Kapak paslanıp kapanmış.',
    sw_smith_1: 'Kanallara dikkat. Ben Rivet. Suyun yediğini onarırım.',
    sw_smith_2: 'Sarnıçta seni bekleyen için zırhın ince. Bir deri olsa sana bir kabuk döverdim.',
    sw_smith_3: 'Bataklıktaki timsah derisini döker. Onu bana getir.',
    sw_smith_remind: 'Deri yoksa kabuk yok. Timsah bataklıkta.',
    sw_smith_craft: 'Derisi! Kımıldama.',
    sw_smith_after: 'Seni yavaşlatır. Arkadan geleni de savuşturur.',
    sw_smith_wait: 'Rivet seni kabuksuz tünele sokmaz.',
    sw_skin: "MIREJAW'ın Dökülen Derisi", sw_skind: "Onu kanalizasyondaki Rivet'e götür.",
    i_mjSkin: "MIREJAW'ın Dökülen Derisi", i_mjSkind: 'Kanalizasyondaki boru ustası Rivet için.',
    sw_shell: 'Deri Kabuk', sw_shelld: 'Sırtında: arkadan gelen darbeler savuşur, ağır darbeler hafifler. Daha yavaş koşarsın.',
    sw_shell_card: 'Arkadan gelen darbeler savuşur. Daha yavaş koşarsın. Teçhizattan giy ya da çıkar.',
    sw_backslot: 'Sırt',
    pg_goal_sewer: 'Röle galerisindeki kapağı aç',
    pg_goal_smith: "Deriyi Rivet'e götür",
  },
  zh: {
    n_swsmith: '铆钉',
    sw_hatch_rusted: '舱盖锈死了。',
    sw_smith_1: '小心水渠。我是铆钉，修补被水啃坏的东西。',
    sw_smith_2: '你这层薄甲挡不住蓄水池里等着你的东西。要是有张皮，我能给你锻一副壳。',
    sw_smith_3: '泥沼里的鳄鱼会蜕皮。把皮带来给我。',
    sw_smith_remind: '没有皮，就没有壳。鳄鱼在泥沼里。',
    sw_smith_craft: '是它的皮！别动。',
    sw_smith_after: '它会让你变慢，但能挡住背后的攻击。',
    sw_smith_wait: '铆钉不会让你不带壳进隧道。',
    sw_skin: 'MIREJAW蜕下的皮', sw_skind: '把它带给下水道里的铆钉。',
    i_mjSkin: 'MIREJAW蜕下的皮', i_mjSkind: '交给下水道里的管匠铆钉。',
    sw_shell: '皮壳', sw_shelld: '背在身后：挡住背后的攻击，重击减轻。跑得更慢。',
    sw_shell_card: '挡住背后的攻击。跑得更慢。在装备里穿上或卸下。',
    sw_backslot: '背部',
    pg_goal_sewer: '打开中继长廊里的舱盖',
    pg_goal_smith: '把皮带给铆钉',
  },
  ru: {
    n_swsmith: 'Заклёпка',
    sw_hatch_rusted: 'Люк заржавел намертво.',
    sw_smith_1: 'Осторожно, каналы. Я Заклёпка. Чиню то, что съедает вода.',
    sw_smith_2: 'Твоя броня тонковата для того, что ждёт в цистерне. Я выковал бы тебе панцирь, будь у меня шкура.',
    sw_smith_3: 'Крокодил в Трясине сбрасывает шкуру. Принеси её мне.',
    sw_smith_remind: 'Нет шкуры, нет панциря. Крокодил в Трясине.',
    sw_smith_craft: 'Его шкура! Не двигайся.',
    sw_smith_after: 'Он замедляет. Зато отбивает удары сзади.',
    sw_smith_wait: 'Заклёпка не пустит тебя в туннель без панциря.',
    sw_skin: 'Сброшенная шкура MIREJAW', sw_skind: 'Отнеси её Заклёпке в канализацию.',
    i_mjSkin: 'Сброшенная шкура MIREJAW', i_mjSkind: 'Для Заклёпки, мастера труб, в канализации.',
    sw_shell: 'Панцирь из шкуры', sw_shelld: 'На спине: отбивает удары сзади, тяжёлые удары слабее. Бегаешь медленнее.',
    sw_shell_card: 'Отбивает удары сзади. Бегаешь медленнее. Надень или сними в снаряжении.',
    sw_backslot: 'Спина',
    pg_goal_sewer: 'Открой люк в галерее реле',
    pg_goal_smith: 'Отнеси шкуру Заклёпке',
  },
});
