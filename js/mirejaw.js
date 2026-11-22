// ===========================================================================
// MIREJAW — the Conduits' swamp crocodile, a mini-boss (owner, 2026-11-21).
//
// "crocodiles usually have a special power... biting on you and rolling over,
// which will hurt you more, like a swirl... The crocodile will go inside the
// water and come out jumping or biting... If it catches you and takes you into
// the water, that will be bad... It swirls inside the water. That's a special
// move that reduces 2 points." · "biting should be epic. The crocodile's bite
// is one of the strongest bites in the whole world" · "crocodile skin is super
// thick, so it needs a weak point to hit to be able to kill."
//
// Built on the lion engine: Higgsfield takes of this machine performing a real
// crocodile's moves (assets/source/swamp/croc-takes), cut by tools/lion-studio.py
// into strips, drawn by mjDraw. The fight lives in the WALLOW (world.js SW3):
// open water and four islands.
//
// THE SIGNATURE is the ambush. He sinks; only the eyes and the ridge of his
// back cross the pool toward the island she stands on. The water boils at the
// edge nearest her (MJ.warn — the eyes rise and STOP: that is the lock), and
// he erupts out of it jaws-first at where she was. If the jaws close on her he
// drags her under and DEATH-ROLLS: two cores, and only her mashing shortens it.
// If he misses, he lands on the island with his jaws hanging open — the only
// time the inside of the mouth can be struck.
//
// THE HIDE (types.js dealDmg, e.hideAt): his back and flanks turn every blow
// (a spark, an eighth of it). Two weak points, each only for a moment: INSIDE
// THE JAWS while he lies beached or panting, and the PALE BELLY while he is in
// the air. A dazed crocodile (the hit-group break) is open everywhere.
//
// PHASE TWO at half: he hauls his head and tail up and BELLOWS (a recorded
// alligator, NPS) until the water dances on his back; his lights go red. Then
// the waits between ambushes shorten — never a warning — and a missed leap
// that lands in water is followed at once by a second from another gap; and on
// land he answers her with the TAIL SLAM (jump the wave it sends along the
// island).
// ===========================================================================

const MJ = {
  drawH: 190,             // the strip cell's height on screen: ~330 px nose to tail
  surfRow: 13,            // the pool's surface row (world.js SW3, k2Water)
  glide: 90,              // how far he swims forward while he rises (never straight up)
  sub: [1.5, 2.3], sub2: [0.9, 1.4],   // seconds under between ambushes (p1, p2)
  swim: 250, swim2: 330,  // px/s under the surface
  warn: 0.8,              // the boil and the eyes: NEVER shortened between phases
  leap: 0.62,             // the arc out of the water
  jawFrom: 0.22, jawTo: 0.5,           // when in the leap the jaws can close on her
  beach: 1.15,            // jaws hanging open on the island: the opening
  backoff: 0.9,           // sliding back into the water, tail first
  roll: 1.9,              // the death roll, before her mashing
  rollMash: 0.13,         // each ATTACK press while held takes this off it
  rollDmg: 2,             // cores (owner: "reduces 2 points")
  tailWarn: 0.7, tail: 0.38, tailSpent: 0.75,
  wave: 340,              // the tail slam's wave along the ground, px/s
  bellow: 2.6,
  hurtShow: 0.32,
  notice: 1.1, turn: 0.75, runSpeed: 320, landShow: 0.32,
  downT: 2.6, sinkT: 1.2,
};
// strips: key, cells (tools/lion-studio.py; cell 640x300, the animal facing left)
const MJ_ART = {
  idle: ['mjIdle', 12], walk: ['mjWalk', 16], swim: ['mjSwim', 14], bite: ['mjBite', 16],
  leap: ['mjLeap', 14], roll: ['mjRoll', 16], tail: ['mjTail', 12], bellow: ['mjBellow', 14],
  hurt: ['mjHurt', 10], down: ['mjDown', 12],
  // the rest of his move set (owner, 2026-11-22: every function of a new species
  // has its own art — docs/SPECIES_MOVESET.md, assets/movesets.json)
  run: ['mjRun', 14], turn: ['mjTurn', 14], notice: ['mjNotice', 12], crouch: ['mjCrouch', 12],
  land: ['mjLand', 10], gape: ['mjGape', 16], daze: ['mjDaze', 12],
};
// NO STEP AND NO STROKE IS FREE (owner, 2026-11-22: "The alligator should go on
// diagonal move, not like sliding, but like either swimming using its tail or legs
// or whatever, however they swim, or to walk on the inclines in the terrain").
// Every move that carries his body — swimming, rising, walking, running, on the
// level or up a bank — turns its strip over by the DISTANCE he covers, never by
// the clock: one full cycle of each strip per this many px of travel.
const MJ_STRIDE = { swim: 230, walk: 150, run: 260 };

function mjInit(b) {
  if (b.mj) return;
  b.mj = { wx: b.cx(), feet: b.y + b.h, face: -1, tgt: null, t0: 0, chain: 0, hurtT: 0, rage: 0,
           held: false, mash: 0, wave: null, log: [], hpPrev: b.hp, roarDone: false, snapAt: 0 };
  b.face = -1; b.faceVis = -1;
  b.hideAt = (x, y) => mjHide(b, x, y);
}
function mjSurfY() { return MJ.surfRow * TILE + 6; }
// the pool's columns that are water at the surface (the islands rise above it)
function mjIsWater(x) {
  const g = G.grid; if (!g) return true;
  const tx = Math.floor(x / TILE), row = MJ.surfRow;
  return !!(g[row] && g[row][tx] === '.' && g[row - 1] && g[row - 1][tx] === '.');
}
// the ground under x on an island (feet y), or null over water
function mjGroundAt(x) {
  if (mjIsWater(x)) return null;
  const tx = Math.floor(x / TILE), g = G.grid;
  for (let y = 1; y < g.length; y++) if (g[y][tx] === '#') return y * TILE;
  return null;
}
// the edge of the water nearest x: where he comes up for a body on that island
function mjNearestWater(x) {
  const W = G.roomDef.w * TILE;
  for (let d = 0; d < W; d += 8) {
    for (const s of [-1, 1]) {
      const xx = x + s * d;
      // open water a body can come up in: not the one-tile channels against the
      // walls, where half of him would be inside the rock
      if (xx > TILE * 1.5 && xx < W - TILE * 1.5 && mjIsWater(xx) && mjIsWater(xx - 44) && mjIsWater(xx + 44)) return xx;
    }
  }
  return x;
}
function mjSet(b, st, t) {
  b.st = st; b.t = t; b.mj.t0 = t;
  const L = b.mj.log; L.push([st, +(G.time || 0).toFixed(3)]); if (L.length > 80) L.shift();
}
function mjK(b) { return b.mj.t0 > 0 ? clamp(1 - b.t / b.mj.t0, 0, 1) : 1; }
// where the surface breaks for the water layer (k2DrawFront rings)
function mjSurfaceX(b) { return b && b.mj && (b.st === 'sub' || b.st === 'bitewarn') ? b.mj.wx - b.mj.face * 120 : null; }
// THE BODY BOX the rest of the game reads (her blows, the camera, the HUD)
function mjBox(b) {
  const M = b.mj;
  b.w = 300; b.h = 64;
  b.x = M.wx - b.w / 2;
  b.y = M.feet - b.h;
}
function mjHeadX(b) { return b.mj.wx + b.mj.face * 130; }
// HE STANDS ON THE GROUND UNDER HIS PAWS (owner, 2026-11-21: "when it stands
// on the platform is leveled and... four of its limbs is almost on the air, not
// actually standing on actual ground"). The plates were drawn level and seated on
// one height — the tile top under the head — while an island is a hump. So the
// body is posed from where his feet are: the fore paws and the hind paws (measured
// off the plates: 0.32 and 0.64 of a cell, the head at the left) each find the
// ground under them — the island's own surface curve, or, over open water, a
// depth below the surface, so a crocodile half out of the water lies along the
// bank with his hind legs under it — the body pitches to the line between them,
// and that line is lifted only as far as the belly needs to clear a crest.
const MJ_PAW = { fore: 73, hind: 57, belly: 46, wet: 30, tiltMax: 0.5, tiltBank: 0.62 };   // belly: the plates' belly clears the paw line by ~24 px; a crocodile's belly rests ON a crest, so a crest may press up to it
const MJ_SEATED = { beached: 1, spent: 1, tailwarn: 1, tail: 1, roarwarn: 1, daze: 1, down: 1, sink: 1, backoff: 1, turn: 1, run: 1 };
function mjFloorY(x) {
  // the room's walls are not ground: a paw past one stands on the column inside it
  if (G.roomDef) x = clamp(x, TILE * 1.5, (G.roomDef.w - 1.5) * TILE);
  if (mjIsWater(x)) return mjSurfY() + MJ_PAW.wet;
  const gc = (typeof groundColumnAt === 'function') ? groundColumnAt(x) : null;
  if (gc) return Math.min(gc[0], gc[1]);
  const g = mjGroundAt(x); return g != null ? g : mjSurfY() + MJ_PAW.wet;
}
// the pose a seated body takes at (wx, face): the pitch, and the height of the
// paw line under the body's centre
function mjSeat(wx, face) {
  const xF = wx + face * MJ_PAW.fore, xH = wx - face * MJ_PAW.hind;
  const inRoom = x => G.roomDef ? clamp(x, TILE * 1.5, (G.roomDef.w - 1.5) * TILE) : x;
  const paws = [[xF, mjFloorY(xF), mjIsWater(inRoom(xF))], [xH, mjFloorY(xH), mjIsWater(inRoom(xH))]].sort((a, c) => a[0] - c[0]);
  // climbing out up a bank he may rear steeper than he ever stands on land
  const tMax = (paws[0][2] || paws[1][2]) ? MJ_PAW.tiltBank : MJ_PAW.tiltMax;
  const tilt = clamp(Math.atan2(paws[1][1] - paws[0][1], paws[1][0] - paws[0][0]), -tMax, tMax);
  const sl = Math.tan(tilt);
  // a paw on land stands ON it; a paw in the water has no floor to meet, only
  // the surface to stay under, so it never holds the body up off the bank
  let y = Infinity;
  for (const [x, gy, wet] of paws) if (!wet) y = Math.min(y, gy - sl * (x - wx));
  if (y === Infinity) for (const [x, gy] of paws) y = Math.min(y, gy - sl * (x - wx));
  for (let x = paws[0][0] + 8; x < paws[1][0]; x += 8)                       // the belly over a crest
    y = Math.min(y, mjFloorY(x) + MJ_PAW.belly - sl * (x - wx));
  return { tilt, y, paws: paws.map(([x, gy, wet]) => ({ x, ground: gy, wet, y: y + sl * (x - wx) })) };
}
// eased each step; the drawing reads M.tilt and M.drawY
function mjPoseStep(b, dt) {
  const M = b.mj, st = b.st;
  let tilt = 0, y = M.feet;
  if (MJ_SEATED[st]) {
    const s = mjSeat(M.wx, M.face);
    tilt = s.tilt; y = s.y; M.paws = s.paws;
    // going back into the water, or sinking, he goes DOWN through it
    if (st === 'sink' || ((st === 'backoff' || st === 'run') && mjIsWater(M.wx))) y = Math.max(y, M.feet);
    else M.feet = y;
  } else if (st === 'leap' && M.from && M.tgt) {
    // nose along the arc: up out of the water, down onto her
    const k = mjK(b), endX = M.tgt.x - M.face * 120;
    const dx = endX - M.from.x, dy = (M.tgt.feet - M.from.feet) - Math.cos(Math.PI * k) * Math.PI * 120;
    tilt = clamp(Math.atan2(dy, Math.abs(dx) + 60) * (dx >= 0 ? 1 : -1), -0.55, 0.55);
    M.paws = null;
  } else if (st === 'bitewarn') {
    tilt = -M.face * 0.2 * mjK(b);                                           // the nose comes up first
    M.paws = null;
  } else M.paws = null;
  const snap = st === 'leap' || M.drawY == null;
  M.drawY = snap ? y : M.drawY + (y - M.drawY) * Math.min(1, dt * 16);
  M.tilt = (M.tilt == null) ? tilt : M.tilt + (tilt - M.tilt) * Math.min(1, dt * 10);
}
// WHERE A BLOW LANDS DECIDES IT (types.js dealDmg)
function mjHide(b, x, y) {
  const st = b.st;
  if (st === 'sub' || st === 'dorm' || st === 'roll') return 0;          // under the water: nothing reaches him
  if (st === 'daze' || st === 'down') return 1;
  // the pale belly, in the air. Rising out of the water he shows only his armoured
  // head and back: the belly is open once he has left it
  if (st === 'leap') return 1;
  const nearHead = Math.abs(x - mjHeadX(b)) < 95;
  if ((st === 'beached' || st === 'spent') && nearHead) {
    b.mj.weakHit = 0.3;
    return 1;                                                           // inside the open jaws
  }
  b.mj.clink = 0.18;
  return 0.125;                                                         // the hide
}

// ---------------------------------------------------------------------------
function mjStep(b, dt) {
  mjInit(b);
  const M = b.mj, p2 = b.phase === 2;
  // the warning gets its sound, as every boss's does
  if (b.st !== b._tellSt) { b._tellSt = b.st; if (!b.dead && TELL_ST.test(b.st || '')) sfx(b.tellCue()); }
  if (b.dead) return;
  b.t -= dt;
  if (M.hurtT > 0) M.hurtT -= dt;
  if (M.weakHit > 0) M.weakHit -= dt;
  if (M.clink > 0) M.clink -= dt;
  // a blow that landed: the flinch (only where it hurt him)
  if (b.hp < M.hpPrev && b.st !== 'down') {
    if (b.hp < M.hpPrev - 2 || M.weakHit > 0) { M.hurtT = MJ.hurtShow; playBuf('mj_growl', 0.55, 0.95 + Math.random() * 0.1); }
    else if (M.clink > 0) sfx('bosshit');
  }
  M.hpPrev = b.hp;
  if (!player || player.dead) { G.ghHold = null; M.held = false; }
  const px = player ? player.x + player.w / 2 : M.wx, pfeet = player ? player.y + player.h : 0;
  // THE BREAK INTO PHASE TWO: at half, the first time he is on the surface
  if (!p2 && b.hp <= b.hpMax / 2 && (b.st === 'beached' || b.st === 'spent' || (b.st === 'backoff' && !mjIsWater(M.wx)))) {
    b.phase = 2; M.wave = null;
    mjSet(b, 'roarwarn', MJ.bellow);
    playBuf('mj_bellow', 0.95);
    cam.shake = Math.max(cam.shake, 8);
    if (typeof shockRipple === 'function') shockRipple(M.wx, M.feet - 60, { amp: 10, speed: 520 });
  }
  // the hit-group break, taken out of anything he is not committed to
  if (b.dazeReq && (b.st === 'beached' || b.st === 'backoff' || b.st === 'spent' || b.st === 'tailwarn')) {
    b.dazeReq = false; mjSet(b, 'daze', 2.3); b.dazeCD = 6;
  }
  if (b.dazeCD > 0) b.dazeCD -= dt;
  if (b.dazeWin > 0) b.dazeWin -= dt;
  switch (b.st) {
    case 'dorm': {
      // under the pool until she has her feet on an island and the staging ends
      M.feet = mjSurfY() + 110; M.wx = b.spawnX + b.w / 2;
      if (!G.bossEntry && player && player.on) {
        // HE NOTICES HER: he comes up in open water, lifts his head and hisses
        M.wx = mjNearestWater(M.wx); M.feet = mjSurfY() + 40; M.drawY = M.feet;
        M.face = Math.sign((player.x + player.w / 2) - M.wx) || M.face;
        mjSet(b, 'notice', MJ.notice);
        playBuf('mj_bellow', 0.8);
      }
      break;
    }
    case 'notice': if (b.t <= 0) mjSet(b, 'sub', 0.4); break;
    case 'sub': {
      // eyes and ridge only, crossing toward the water beside her island
      M.feet += (mjSurfY() + 84 - M.feet) * Math.min(1, dt * 5);
      // he lines up a body-length out in open water, so the rise that carries
      // him forward ends where the old straight rise stood (the leap is the same leap)
      const edge = mjNearestWater(px), away = Math.sign(edge - px) || -M.face;
      let goal = edge;
      for (let r = MJ.glide; r > 0; r -= 8) if (mjIsWater(edge + away * r)) { goal = edge + away * r; break; }
      M.edge = edge;
      const sp = p2 ? MJ.swim2 : MJ.swim, d = goal - M.wx;
      if (Math.abs(d) > 4) { M.wx += Math.sign(d) * Math.min(Math.abs(d), sp * dt); M.face = Math.sign(d); }
      if (b.t <= 0 && Math.abs(d) < 24) {
        // THE LOCK: the eyes rise and stop moving; where she is NOW is where
        // the jaws go — she has the whole warning to be elsewhere
        M.face = Math.sign(px - M.wx) || M.face;
        M.tgt = { x: px, feet: mjGroundAt(px) != null ? mjFloorY(px) : pfeet };
        // he does not stop and rise like a lift: he keeps swimming at her and
        // comes up on the slant, the way a crocodile breaks the surface
        // swimming up through the first part of the warning; the rest is his coil
        M.rise = { x0: M.wx, d: M.edge - M.wx, y0: M.feet };
        mjSet(b, 'bitewarn', MJ.warn);
        playBuf('mj_hiss', 0.7);
      }
      break;
    }
    case 'bitewarn': {
      // the boil: he rises until the head and the top of the jaws are out
      // (his strokes carry him up and forward over the first 55%, then he is still
      // and COILS — the tell is a body gathering, not a body drifting)
      if (M.rise) { const kk = Math.min(1, mjK(b) / 0.55), e = 1 - (1 - kk) * (1 - kk), s2 = kk * kk * (3 - 2 * kk);
        M.wx = M.rise.x0 + M.rise.d * e;
        M.feet = M.rise.y0 + (mjSurfY() + 34 - M.rise.y0) * s2; }
      if (b.t <= 0) {
        M.from = { x: M.wx, feet: M.feet };
        mjSet(b, 'leap', MJ.leap);
        playBuf('mj_splash', 0.8);
        M.snapped = false;
      }
      break;
    }
    case 'leap': {
      const k = mjK(b), T = M.tgt, F = M.from;
      // he lands with the head on her spot: the body ends up behind it
      const endX = T.x - M.face * 120;
      M.wx = F.x + (endX - F.x) * k;
      M.feet = F.feet + (T.feet - F.feet) * k - Math.sin(Math.PI * k) * 120;
      // THE BITE — the strongest in the world, and it is SAID so: the jaws slam
      // with a crack, the frame stops, the camera jolts
      if (!M.snapped && k >= MJ.jawFrom) {
        const hx = mjHeadX(b), hy = M.feet - 40;
        const hit = player && !player.dead && player.iT <= 0 && !G.rescue
          && Math.abs(px - hx) < 62 && Math.abs((player.y + player.h / 2) - hy) < 70;
        if (hit || k >= MJ.jawTo) {
          M.snapped = true; M.snapK = k;
          playBuf('mj_snap', 1.0); sfx('slam');
          G.hitStop = Math.max(G.hitStop || 0, hit ? 0.14 : 0.07);
          cam.shake = Math.max(cam.shake, hit ? 16 : 9);
          if (typeof padRumble === 'function') padRumble(0.9, 0.9, hit ? 420 : 200);
          if (hit) {
            G.impact = { t: 0.22, t0: 0.22, x: hx, y: hy };
            M.held = true; M.mash = 0; G.ghHold = true;
            M.rollFrom = { x: M.wx, feet: M.feet };
            M.rollTo = mjNearestWater(M.wx);
            mjSet(b, 'roll', MJ.roll);
            playBuf('mj_growl', 0.9, 0.85);
            break;
          }
        }
      }
      if (b.t <= 0) {
        // he beaches where his HEAD comes down: the body behind it may still be in the water
        const gnd = mjGroundAt(mjHeadX(b));
        if (gnd != null) {
          M.feet = mjSeat(M.wx, M.face).y; M.drawY = M.feet;   // he lands ON it, in one frame
          cam.shake = Math.max(cam.shake, 7); sfx('slam');
          mjSet(b, 'beached', MJ.beach);
          M.chain = 0;
        } else {
          // into the water: in phase two the next one comes at once, from
          // another gap — the end of a chain is always a beaching
          playBuf('mj_splash', 0.7);
          M.feet = Math.max(M.feet, mjSurfY() + 20);
          if (p2 && M.chain < 1) { M.chain++; mjSet(b, 'sub', 0.25); } else { M.chain = 0; mjSet(b, 'sub', 0.6); }
        }
      }
      break;
    }
    case 'roll': {
      // DRAGGED UNDER AND ROLLED. Her body is in his jaws; she cannot act;
      // every ATTACK press loosens it a little
      const k = mjK(b);
      M.wx = M.rollFrom.x + (M.rollTo - M.rollFrom.x) * Math.min(1, k * 3);
      M.feet = M.rollFrom.feet + (mjSurfY() + 40 - M.rollFrom.feet) * Math.min(1, k * 3);
      if (player) {
        const hx = mjHeadX(b);
        player.x = hx - player.w / 2; player.y = M.feet - 46 - player.h / 2;
        player.vx = 0; player.vy = 0;
        if (inP('ATK')) { b.t -= MJ.rollMash; M.mash++; burst(hx, M.feet - 40, 4, '#cfe0f0', 140, 0.2, 0, 2, true); }
      }
      if (Math.floor(b.t * 6) !== Math.floor((b.t + dt) * 6)) { cam.shake = Math.max(cam.shake, 5); if (typeof padRumble === 'function') padRumble(0.6, 0.5, 120); }
      if (b.t <= 0) {
        M.held = false; G.ghHold = null;
        if (player && !player.dead) {
          player.iT = 0;
          player.hurt(MJ.rollDmg, M.wx, 'mirejaw.roll');   // two cores, whatever else is true
          // thrown clear onto the nearest island
          const land = mjNearestLand(player.x + player.w / 2);
          if (land != null && !player.dead) { player.x = land - player.w / 2; player.y = mjGroundAt(land) - player.h - 2; player.vy = -380; }
        }
        playBuf('mj_splash', 0.8);
        mjSet(b, 'sub', p2 ? MJ.sub2[1] : MJ.sub[1]);
      }
      break;
    }
    case 'beached': {
      // jaws hanging open on the island — the opening, and it LOOKS like one
      if (b.t <= 0) {
        // phase two answers her with the tail if she is on his island behind him
        const behind = Math.sign(px - M.wx) === -M.face && Math.abs(px - M.wx) < 260;
        if (p2 && behind) { mjSet(b, 'tailwarn', MJ.tailWarn); playBuf('mj_hiss', 0.6, 0.9); }
        // phase two does not back away: he TURNS round (his own filmed turn,
        // through the front) and RUNS head first for the water
        else if (p2) { M.turnFrom = M.face; mjSet(b, 'turn', MJ.turn); }
        else { M.back = { x: M.wx, to: mjNearestWater(M.wx - M.face * 60) }; mjSet(b, 'backoff', MJ.backoff); }
      }
      break;
    }
    case 'turn': {
      if (b.t <= 0) {
        M.face = -M.turnFrom;
        M.runTo = mjNearestWater(M.wx + M.face * 60);
        mjSet(b, 'run', 1.6);
      }
      break;
    }
    case 'run': {
      const d = M.runTo - M.wx;
      M.wx += Math.sign(d) * Math.min(Math.abs(d), MJ.runSpeed * dt);
      const g = mjGroundAt(M.wx);
      if (g == null) M.feet = Math.min(mjSurfY() + 84, M.feet + 160 * dt);
      if ((mjIsWater(M.wx) && Math.abs(d) < 8) || b.t <= 0) { playBuf('mj_splash', 0.6); mjSet(b, 'sub', rnd(MJ.sub2[0], MJ.sub2[1])); }
      break;
    }
    case 'tailwarn': {
      if (b.t <= 0) {
        mjSet(b, 'tail', MJ.tail);
        playBuf('mj_slap', 1.0); sfx('slam');
        cam.shake = Math.max(cam.shake, 10);
        const tx = M.wx - M.face * 150;
        M.wave = { x0: tx, l: tx, r: tx, y: M.feet, t: 0 };
      }
      break;
    }
    case 'tail': if (b.t <= 0) mjSet(b, 'spent', MJ.tailSpent); break;
    case 'spent': if (b.t <= 0) { M.back = { x: M.wx, to: mjNearestWater(M.wx - M.face * 60) }; mjSet(b, 'backoff', MJ.backoff); } break;
    case 'backoff': {
      // a crocodile goes back into the water tail first: no turn, no flip
      // a flinch stops him where he stands (his legs are not walking it)
      if (M.hurtT > 0) { b.t = Math.min(M.t0, b.t + dt); break; }
      const k = mjK(b);
      M.wx = M.back.x + (M.back.to - M.back.x) * k;
      const g = mjGroundAt(M.wx);
      M.feet = g != null ? g : Math.min(mjSurfY() + 84, M.feet + 200 * dt);
      if (b.t <= 0) { playBuf('mj_splash', 0.5); mjSet(b, 'sub', p2 ? rnd(MJ.sub2[0], MJ.sub2[1]) : rnd(MJ.sub[0], MJ.sub[1])); }
      break;
    }
    case 'roarwarn': {
      // the bellow: head and tail up, the water dancing on his back
      if (Math.random() < 0.6) burst(M.wx + rnd(-110, 110), M.feet - 70, 1, '#bfe6d8', 120, 0.5, -60, 2, false);
      if (b.t <= 0) { M.back = { x: M.wx, to: mjNearestWater(M.wx - M.face * 60) }; mjSet(b, 'backoff', MJ.backoff); }
      break;
    }
    case 'daze': if (b.t <= 0) { M.back = { x: M.wx, to: mjNearestWater(M.wx - M.face * 60) }; mjSet(b, 'backoff', MJ.backoff); } break;
    case 'down': {
      if (b.t <= 0 && !M.sunk) {
        M.sunk = true;
        mjSet(b, 'sink', MJ.sinkT);
      }
      break;
    }
    case 'sink': {
      M.feet += 60 * dt; b.fade = Math.max(0, b.t / MJ.sinkT);
      if (b.t <= 0) mjGone(b);
      break;
    }
  }
  // the tail's wave runs both ways along the ground; a body on the ground in
  // its path is struck (jump it)
  if (M.wave) {
    const w = M.wave; w.t += dt; w.l = w.x0 - MJ.wave * w.t; w.r = w.x0 + MJ.wave * w.t;
    if (w.t > 0.9) M.wave = null;
    else if (player && !player.dead && player.on && player.iT <= 0) {
      const onL = Math.abs(px - w.l) < 22, onR = Math.abs(px - w.r) < 22;
      if ((onL || onR) && Math.abs(pfeet - w.y) < 40) player.hurt(DF().edmg || 1, w.x0, 'mirejaw.tail');
    }
  }
  // the tail itself sweeps the ground behind him while it falls
  if (b.st === 'tail' && player && !player.dead && player.iT <= 0) {
    const tx = M.wx - M.face * 170;
    if (Math.abs(px - tx) < 90 && Math.abs(pfeet - M.feet) < 50) player.hurt(DF().edmg || 1, tx, 'mirejaw.tail');
  }
  // a leap that comes down ON her without the jaws closing still lands on her
  if (b.st === 'leap' && !M.held && player && !player.dead && player.iT <= 0 && mjK(b) > 0.7
      && Math.abs(px - M.wx) < 120 && Math.abs(pfeet - M.feet) < 40) player.hurt(DF().edmg || 1, M.wx, 'mirejaw.body');
  mjPoseStep(b, dt);
  // the ground or water he has covered, which is what turns his strokes and steps over
  if (M.tx0 != null) { const d = Math.hypot(M.wx - M.tx0, M.drawY - M.ty0); M.trav = (M.trav || 0) + d; M.spd = (M.spd || 0) * 0.85 + (d / Math.max(dt, 1e-3)) * 0.15; }
  M.tx0 = M.wx; M.ty0 = M.drawY;
  mjBox(b);
}
function mjNearestLand(x) {
  const W = G.roomDef.w * TILE;
  for (let d = 0; d < W; d += 8) for (const s of [1, -1]) {
    const xx = x + s * d;
    if (xx > TILE && xx < W - TILE && mjGroundAt(xx) != null && mjGroundAt(xx + 20) != null && mjGroundAt(xx - 20) != null) return xx;
  }
  return null;
}
// the blow that would end it: he collapses, rolls onto his side, and sinks
function mjDown(b) {
  mjInit(b);
  if (b.st === 'down' || b.st === 'sink' || b.dead) { b.hp = Math.max(1, b.hp); return; }
  b.hp = 1; b.invHp = 1;
  if (b.mj.held) { b.mj.held = false; G.ghHold = null; }
  const g = mjGroundAt(b.mj.wx); if (g != null) b.mj.feet = g;
  mjSet(b, 'down', MJ.downT);
  playBuf('mj_bellow', 0.7, 0.8);
  cam.shake = Math.max(cam.shake, 10); G.hitStop = Math.max(G.hitStop || 0, 0.15);
}
function mjGone(b) {
  b.dead = true; b.hp = 0; b.fade = 0;
  G.ghHold = null;
  if (typeof G.dropScrap === 'function') G.dropScrap(b.mj.wx, b.mj.feet - 40, typeof bossScrap === 'function' ? bossScrap(b) : 90);
  // what he swallowed comes back up (K2_MINI_SIGIL: Vault Seal II) — the
  // shared mini-boss payout in G.onBossDead
  G.onBossDead('mirejaw');
  if (typeof persist === 'function') persist();
}

// ---------------------------------------------------------------------------
// DRAWING. One strip per state, sampled by the state's own progress; the
// animal faces left in every take, so facing right is the mirror of the SAME
// pose (he never turns on screen: he turns under the water, or backs off).
function mjDraw(c, b) {
  mjInit(b);
  const M = b.mj, st = b.st, k = mjK(b), now = performance.now() / 1000;
  let a = 'idle', i = 0, flip = M.face > 0;
  const cyc = (n, fps) => Math.floor(now * fps) % n;
  // a moving strip's cell is the distance covered, never the clock (MJ_STRIDE)
  const by = (strip, n) => Math.floor(((M.trav || 0) / MJ_STRIDE[strip]) * n) % n;
  const inState = M.t0 - b.t;
  const inWater = mjIsWater(M.wx);
  if (M.hurtT > 0 && (st === 'beached' || st === 'spent' || st === 'backoff')) { a = 'hurt'; i = Math.floor((1 - M.hurtT / MJ.hurtShow) * 6); }
  else switch (st) {
    // a crocodile at rest in the water floats still; he strokes only to travel
    case 'dorm': case 'sub': if ((M.spd || 0) < 25) { a = 'idle'; i = cyc(12, 5); } else { a = 'swim'; i = by('swim', 14); } break;
    case 'notice': a = 'notice'; i = Math.min(11, Math.floor(k * 12)); break;
    // he swims up on the slant, then coils at the surface: the tell
    case 'bitewarn': if (k < 0.55) { a = 'swim'; i = by('swim', 14); } else { a = 'crouch'; i = Math.min(11, Math.floor((k - 0.55) / 0.45 * 12)); } break;
    // the jaws: the moment they slam, the bite take's own open-and-slam cells
    case 'leap': if (M.snapped && M.snapK != null && k - M.snapK < 0.25) { a = 'bite'; i = 3 + Math.min(3, Math.floor((k - M.snapK) / 0.25 * 4)); }
                 else { a = 'leap'; i = Math.floor(k * 13); } break;
    case 'roll': a = 'roll'; i = cyc(16, 14); break;
    // he lands, then holds the threat gape: jaws wide — the opening, and it LOOKS like one
    case 'beached': if (inState < MJ.landShow) { a = 'land'; i = Math.min(9, Math.floor(inState / MJ.landShow * 10)); }
                    else { a = 'gape'; const g = inState - MJ.landShow; i = g < 0.4 ? Math.floor(g / 0.4 * 8) : 8 + Math.floor((g - 0.4) * 8) % 8; } break;
    case 'spent': a = 'gape'; i = inState < 0.4 ? Math.floor(inState / 0.4 * 8) : 8 + Math.floor((inState - 0.4) * 8) % 8; break;
    case 'tailwarn': a = 'tail'; i = Math.floor(k * 4); break;
    case 'tail': a = 'tail'; i = 4 + Math.floor(k * 7); break;
    // back to the water tail first, his legs walking it (the stride run backwards)
    // on the bank, and his tail swimming it once the water has him
    case 'backoff': if (inWater) { a = 'swim'; i = by('swim', 14); } else { a = 'walk'; i = 15 - by('walk', 16); } break;
    case 'turn': a = 'turn'; i = Math.min(13, Math.floor(k * 14)); flip = M.turnFrom > 0; break;
    case 'run': if (inWater) { a = 'swim'; i = by('swim', 14); } else { a = 'run'; i = by('run', 14); } break;
    case 'roarwarn': a = 'bellow'; i = Math.min(13, Math.floor(k * 16)); break;
    case 'daze': a = 'daze'; i = Math.min(11, Math.floor(k * 12)); break;
    case 'down': case 'sink': a = 'down'; i = Math.min(11, Math.floor((st === 'down' ? k : 1) * 12)); break;
    default: a = 'idle'; i = cyc(12, 6);
  }
  let [key, n] = MJ_ART[a];
  if (typeof mediaFetch === 'function') mediaFetch(key);
  let im = typeof MEDIA_IMG !== 'undefined' && MEDIA_IMG[key];
  // a strip still in flight: the idle, never nothing
  if (!(im && im.naturalWidth)) { key = MJ_ART.idle[0]; n = MJ_ART.idle[1]; im = MEDIA_IMG[key]; i = cyc(12, 6); if (!(im && im.naturalWidth)) return; }
  if (b.phase === 2 && typeof rageArt === 'function') im = rageArt(im);
  const cw = im.naturalWidth / n, ch = im.naturalHeight, H = MJ.drawH, W = H * cw / ch;
  c.save();
  if (b.fade != null && b.fade < 1) c.globalAlpha = Math.max(0, b.fade);
  c.translate(M.wx, (M.drawY != null ? M.drawY : M.feet) + 4);
  if (M.tilt) c.rotate(M.tilt);
  if (flip) c.scale(-1, 1);
  M.drawKey = key; M.drawCell = Math.max(0, i) % n;
  if (b.hurtT > 0 && M.clink > 0) c.filter = 'brightness(1.25)';
  c.drawImage(im, (Math.max(0, i) % n) * cw, 0, cw, ch, -W / 2, -H, W, H);
  c.restore();
  // the wave the tail sends along the ground
  if (M.wave) {
    const w = M.wave, al = 1 - w.t / 0.9;
    c.save(); c.strokeStyle = 'rgba(200,230,210,' + (0.55 * al).toFixed(3) + ')'; c.lineWidth = 3;
    for (const x of [w.l, w.r]) { c.beginPath(); c.ellipse(x, w.y - 4, 18, 10, 0, Math.PI, 0); c.stroke(); }
    c.restore();
  }
}

// THE WORDS (both worlds: the swamp is in both)
TEXT_LAYERS.push({
  en: { mini_mirejaw: 'MIREJAW — it swallowed the second seal' },
  ar: { mini_mirejaw: 'مايرجو — ابتلع الختم الثاني' },
  tr: { mini_mirejaw: 'MIREJAW — ikinci mührü yuttu' },
  zh: { mini_mirejaw: 'MIREJAW —— 它吞下了第二枚封印' },
  ru: { mini_mirejaw: 'MIREJAW — он проглотил вторую печать' },
});
