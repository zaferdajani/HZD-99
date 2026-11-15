// CLAWBYTE â€” player, enemies, bosses, projectiles, pickups
const DIFFS = [
  { cores: 7, edmg: 1, ehp: 0.75, pdmg: 1.25, espd: 1, lives: 0 },
  { cores: 5, edmg: 1, ehp: 1, pdmg: 1, espd: 1, lives: 0 },
  { cores: 5, edmg: 2, ehp: 1.15, pdmg: 1, espd: 1.2, lives: 9 },
];
function DF() { return DIFFS[G.save.diff]; }
// The real input readers, aliased once. Player.update SHADOWS `inD`/`inP` with
// dead stubs while she is stunned (one line instead of a check at every input
// site), and a `const` cannot initialise from the name it is shadowing â€” so the
// originals are captured here, at load, from the hoisted declarations.
const IN_D = inD, IN_P = inP;
function hasCrest(id) { return G.save.equip.indexOf(id) >= 0; }
// THE CREST'S ATTACK BLOCK (C1; CREST_ATTACK beside CRESTS in js/game.js).
// The style is taken once, when a swing starts, and travels ON the swing (and
// its drawing), so everything that swing does â€” its box, its shape, its push,
// its freeze, its cut â€” reads the same block. Guarded: the combat harnesses
// run this file in a bare VM without game.js, where she wears nothing.
function crestStyleNow() { return typeof crestStyle === 'function' && G.save ? crestStyle(G.save) : null; }
function swingCrest(s) { return s && s.crest && typeof crestAttackOf === 'function' ? crestAttackOf(s.crest) : null; }
// a factor of the swing she is in now (1 when no seal shapes it)
function crestSwingMul(k) {
  const b = typeof player !== 'undefined' && player ? swingCrest(player.swing) : null;
  return b && b[k] != null ? b[k] : 1;
}
function hasMod(id) { return !!G.save.abil[id]; }
function hasSkill(id) { return G.save.skills && G.save.skills.indexOf(id) >= 0; }
// evolution: power milestones make the character visibly bigger and better-geared
function evoPts() {
  const s = G.save; if (!s) return 0;
  const bosses = ['Glitch', 'Brood', 'Atlas', 'Zero', 'Prism', 'Mother'].filter(b => s.flags && s.flags['boss' + b]).length;
  return Object.keys(s.abil || {}).length * 2 + (s.skills || []).length * 2 + bosses * 3 + (s.relics || []).length;
}
// THE SILHOUETTE CHANGES ON A VICTORY (.claude/skills/underdog-arc Â§2.4).
// It used to fire at 5/14/26 hidden points â€” two abilities and a bought skill
// were tier 1 in a corridor, and a guardian's fall was worth three points of
// nothing in particular. Now the tier IS the count of guardians she has put
// down: 1 on the first, 2 on the third, 3 on the fifth. `extra` lets the
// victory frame count the guardian that is falling this instant, before its
// flag lands after the cut; and a save that already wore a higher tier keeps
// it (never author down, even a save).
function evoTier(extra) {
  const n = (typeof guardiansFelled === 'function' ? guardiansFelled() : 0) + (extra || 0);
  const byWar = n >= 5 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0;
  return Math.max(byWar, (G && G.save && G.save.evo) || 0);
}
function relicHas(id) { return G.save.relics && G.save.relics.indexOf(id) >= 0; }

// ---- tile queries against the live room ----
// THE ROOM ABOVE AND THE ROOM BELOW ARE SOLID TOO â€” for her body, and only
// while it is being moved. A vertical pair is one shaft drawn as two rooms
// (js/game.js, VERTICAL LINKS): the jump up through a hole is real physics into
// the floor of the room above, and a fall lands on what is really under it.
// It is a flag rather than a rule for every query because everything else that
// asks about tiles â€” the bake, the enemies, the blade breaking a hatch â€” is
// about THIS room and must keep reading air past its edge.
let tileLinkOn = false;
function tileAt(tx, ty) {
  const g = G.grid;
  if (ty < 0 || ty >= g.length || tx < 0 || tx >= g[0].length) {
    if (tileLinkOn && (ty < 0 || ty >= g.length) && typeof vlinkTile === 'function') return vlinkTile(tx, ty);
    return '.';
  }
  if (G.roomId === 'D3' && !G.save.flags.bossZero && ty >= 15 && tx >= 15 && tx <= 17) return '#';
  // X1: a hardlight bridge seals the floor entrance for the length of the
  // Prowler fight â€” but ONLY once she is inside and standing clear of it.
  // Until then the way in stays open. It holds through the death collapse,
  // then shatters open again.
  if (G.roomId === 'X1' && G.x1Bridge && G.boss && (!G.boss.dead || (G.boss.deathAnimT || 0) > 0)
      && ty >= 15 && tx >= 6 && tx <= 8) return '#';
  const c = g[ty][tx];
  if ((c === 'B' || c === 'v') && G.save.broken[G.roomId + ':' + tx + ',' + ty]) return '.';
  // THE HUB'S HATCH IS ROCK UNTIL THE STORY MAKES IT A HATCH (js/progress.js
  // pgHubSealed) â€” the same shape as D3's sealed floor above. One answer here
  // is the whole seal: the drawing, the knock, the prompt and the blade all ask.
  if (c === 'B' && G.roomId === 'A2' && typeof pgHubSealedTile === 'function' && pgHubSealedTile(tx, ty)) return '#';
  // a FRACTURE world's loose rock is authored '#', so the broken check above
  // never saw it: the claw "broke" it, the save recorded it, and the wall
  // stood there. Checked through a per-room set so that every other solid
  // tile â€” the hot path of all collision â€” costs one property read.
  if (c === '#' && looseCut(tx, ty)) return '.';
  return c;
}
// THE LOOSE ROCK SHE HAS ALREADY CUT, for this room. Rebuilt only when the
// room or the save changes, or a tile breaks (breakTile drops it); empty â€”
// the common case, any world without the fracture â€” answers in one read.
let looseCutSet = null;
function looseCut(tx, ty) {
  let s = looseCutSet;
  if (!s || s.room !== G.roomId || s.save !== G.save || s.grid !== G.grid) {
    s = looseCutSet = { room: G.roomId, save: G.save, grid: G.grid, keys: null };
    const pre = G.roomId + ':', g = G.grid;
    for (const k in G.save.broken) {
      if (k.indexOf(pre) !== 0) continue;
      const [x, y] = k.slice(pre.length).split(',').map(Number);
      if (g[y] && g[y][x] === '#') (s.keys || (s.keys = new Set())).add(x + y * 4096);
    }
  }
  return !!(s.keys && s.keys.has(tx + ty * 4096));
}
function solidAt(tx, ty) { const c = tileAt(tx, ty); return c === '#' || c === 'B'; }
// FRACTURE worlds: a deterministic scatter of ordinary wall is secretly loose.
// Same tiles every visit, and only ever wall that already has open air behind
// it, so it can never seal a route or open one that leads nowhere.
function brLoose(tx, ty) {
  if (typeof brHas !== 'function' || !brHas('fracture')) return false;
  if (tileAt(tx, ty) !== '#') return false;
  const h = ((tx * 73856093) ^ (ty * 19349663) ^ (universe().seed | 0)) >>> 0;
  if ((h % 1000) / 1000 > 0.06) return false;
  const open = (x, y) => { const c2 = tileAt(x, y); return c2 !== '#' && c2 !== 'B'; };
  return open(tx, ty - 1) || open(tx, ty + 1) || open(tx - 1, ty) || open(tx + 1, ty);
}
// ---- sprite-sheet helpers (real hand-animated art; see assets/CREDITS.md) ----
function sheetReady(key) { return typeof MEDIA_IMG !== 'undefined' && !!MEDIA_IMG[key]; }
// draw one frame of a uniform sheet, standing on the local origin (feet at 0,0)
function drawSheet(c, key, n, cw, ch, frame, scale, yOff) {
  const img = MEDIA_IMG[key]; if (!img) return false;
  const f = clamp(frame | 0, 0, n - 1);
  const dw = cw * scale, dh = ch * scale;
  c.imageSmoothingEnabled = false;
  c.drawImage(img, f * cw, 0, cw, ch, -dw / 2, -dh + (yOff || 0), dw, dh);
  infEyeArt(c, key, f, -dw / 2, -dh + (yOff || 0), dw, dh);
  c.imageSmoothingEnabled = true;
  return true;
}
// soft contact shadow â€” the cheapest, strongest "grounded / lit scene" cue
function contactShadow(c, cx, feetY, w, alpha) {
  if (typeof FOE_READ !== 'undefined' && FOE_READ.sil) return;   // a rim's stencil is the body, not its shadow (js/foeread.js)
  c.save();
  const g = c.createRadialGradient(cx, feetY, 1, cx, feetY, w);
  g.addColorStop(0, 'rgba(0,0,0,' + (alpha || 0.4) + ')');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.beginPath(); c.ellipse(cx, feetY, w, w * 0.32, 0, 0, 7); c.fill();
  c.restore();
}
// ===========================================================================
// IRREGULARITY IS NOT ELEVATION (owner, 2026-08-24)
//
//   "Since we already created irregular surfaces, these irregular surfaces
//    should not be considered as all to be elevations. There should be room
//    for running on irregular surfaces without jumping. So a minimum
//    irregularity in the surface should not require a jump and certainly
//    should not stop enemies from moving, because most of the enemies now,
//    they cannot move on an irregular surface and it's trapped in creases
//    created by the terrain surface."
//
// Two numbers answer it, and they are deliberately different.
//
// STEP_DOWN is how far below the feet ground still counts as ground â€” for the
// ledge probe above. It is half a tile: enough that a rolling surface is one
// continuous floor, small enough that a real drop is still a drop.
//
// STEP_UP is how high a body climbs without jumping, and it is set PER BODY
// because the two kinds of body are asking different questions of a step.
//
//   THE PLAYER gets 20 px, and the number was measured rather than chosen.
//
//     A tile step-up COMPOSES with the heightfield: she does not stand on the
//     tile top, she stands on the curve above it, so what stops her is never
//     32 px, it is whatever is left of 32 after the curve has already lifted
//     her. Measured in CV2, she was stopped dead for 473 frames out of 480 by
//     TWO POINT NINE PIXELS of tile â€” the curve had carried her to within
//     3 px of the step ahead and the square collider still called it a wall.
//     That is the owner's sentence exactly: irregularity treated as elevation.
//
//     So every column of every room was asked what rise it presents to a body
//     standing on the surface. The answer is a long tail concentrated at the
//     bottom: 213 rises under 4 px, 201 more under 8, 181 under 12, 126 under
//     16, 69 under 20 â€” and then it thins.
//
//     It was set to 20 first and tests/terrainrun.cjs found the boundary being
//     honest rather than theoretical: a TWENTY-ONE PIXEL rise in CV1 still
//     stopped her dead. Twenty-one pixels against a thirty-six pixel body is
//     not a ledge by any reading, so the allowance moved to meet it. 24 is the
//     line, and it is the same number the harness asserts â€” the contract is
//     that nothing at or under the allowance stops her, so the test cannot
//     drift away from the code.
//
//     It also cost W2's jump lesson its step, and that turned out to be the
//     lesson's fault rather than the threshold's: measured, the step she is
//     taught to jump presented ELEVEN PIXELS of rise. A tutorial demanding a
//     jump over an 11 px lip was already teaching the wrong thing. The step is
//     two tiles now (world.js) and reads as 43 â€” unmistakably a step, to the
//     collider and to the eye. tests/wake.cjs holds the lesson's order.
//   AN ENEMY gets a whole tile. Nothing is being taught to a crawler. A patrol
//     stuck between two floor knobs is never a design decision, it is a bug
//     with a pulse, so the walkers climb what the terrain generator scatters
//     in front of them. They still cannot climb onto a '=' gantry from the
//     side â€” that is a platform you jump up through, and letting a blob walk
//     onto one would put enemies on every shelf in the game.
// ===========================================================================
// ===========================================================================
// THE JUMP, AND WHY IT IS THIS HIGH (owner, 2026-08-24)
//
//   "jumping should push me higher than terrain of the above floor to allow me
//    to actually choose direction to land on instead of falling back down"
//
// Measured across all 73 rooms before changing anything: the apex was 139 px â€”
// FOUR AND A THIRD TILES â€” and 58.7% of every standable surface above a floor
// sat beyond it. The gap histogram peaks at four tiles (218 of them) and again
// at six (230). So more than half the platforms in the game could not be
// reached from the floor under them, and the commonest tier of all was the one
// just out of reach. He was not describing a feel, he was describing geometry.
//
// 920 puts the apex at 201 px â€” 6.28 tiles â€” which clears the six-tile tier
// with margin and leaves the seven-and-up tiers to the double jump, where they
// belong. The float band does the other half of the sentence: see the note at
// the gravity line.
const JUMP_V = 920;        // apex 201 px = 6.28 tiles, with the float below
const JUMP_FLOAT = 150;    // |vy| under this and gravity goes soft: the hang
const JUMP_CUT = 280;      // a released button still leaves a usable hop
const STEP_DOWN = 16;
const PLAYER_STEP_UP = 24;
const ENEMY_STEP_UP = TILE + 2;
// The obstruction's top in this column, if the body can climb onto it: returns
// the new feet Y, or null. Solid tiles only â€” never '=' â€” and it must be able
// to STAND there, body and headroom, or the step is a wall after all.
function stepUpTop(e, tx, lift) {
  const feet = e.y + e.h;
  const base = Math.floor((feet - 1) / TILE);
  let top = null;
  for (let k = 0; k <= 2; k++) {
    const ty = base - k;
    if (!solidAt(tx, ty)) { top = (ty + 1) * TILE; break; }
  }
  if (top == null) return null;
  const rise = feet - top;
  if (rise <= 0.5 || rise > lift) return null;
  // headroom for the whole body at the new height, in this column and the one
  // it is stepping out of â€” otherwise it is a crawlspace, not a step
  const ny = top - e.h;
  const b0 = Math.floor(ny / TILE), b1 = Math.floor((top - 1) / TILE);
  const ox = Math.floor((e.x + e.w / 2) / TILE);
  for (let ty = b0; ty <= b1; ty++) if (solidAt(tx, ty) || solidAt(ox, ty)) return null;
  return top;
}
function moveEnt(e, dt) {
  // her body, and only hers, collides on past the room's top and bottom
  tileLinkOn = e === player;
  const col = { l: 0, r: 0, u: 0, d: 0 };
  const xStart = e.x;
  e.x += e.vx * dt;
  const t0 = Math.floor(e.y / TILE), t1 = Math.floor((e.y + e.h - 1) / TILE);
  // ...and a blocked move is a STEP before it is a wall (see the note above).
  const lift = (e.stepUp || 0);
  if (e.vx > 0) {
    const tx = Math.floor((e.x + e.w) / TILE);
    for (let ty = t0; ty <= t1; ty++) if (solidAt(tx, ty)) {
      const top = lift > 0 && e.vy >= -1 ? stepUpTop(e, tx, lift) : null;
      if (top != null) { e.y = top - e.h - 0.01; e.vy = 0; col.d = 1; break; }
      e.x = tx * TILE - e.w - 0.01; e.vx = 0; col.r = 1; break;
    }
  } else if (e.vx < 0) {
    const tx = Math.floor(e.x / TILE);
    for (let ty = t0; ty <= t1; ty++) if (solidAt(tx, ty)) {
      const top = lift > 0 && e.vy >= -1 ? stepUpTop(e, tx, lift) : null;
      if (top != null) { e.y = top - e.h - 0.01; e.vy = 0; col.d = 1; break; }
      e.x = (tx + 1) * TILE + 0.01; e.vx = 0; col.l = 1; break;
    }
  }
  const prevB = e.y + e.h;
  e.y += e.vy * dt;
  const x0 = Math.floor(e.x / TILE), x1 = Math.floor((e.x + e.w - 1) / TILE);
  if (e.vy >= 0) {
    // Terminal velocity is 1020 px/s and the largest simulation step is 1/30,
    // so feet may travel 34 px across a 32 px tile row in one update. Check
    // every crossed row in order instead of sampling only the landing row.
    const r1 = Math.floor((e.y + e.h) / TILE);
    const r0 = Math.max(Math.floor(prevB / TILE), r1 - 64);
    let hit = false;
    for (let ty = r0; ty <= r1 && !hit; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const c = tileAt(tx, ty);
        // e.thruPlat: a body falling past one-way ledges on purpose (NULLFANG's
        // pounce at a player on the floor below them)
        if (c === '#' || c === 'B' || (c === '=' && !e.thruPlat && prevB <= ty * TILE + 1)) {
          e.y = ty * TILE - e.h - 0.01; e.vy = 0; col.d = 1; hit = true; break;
        }
      }
    }
  } else {
    const ty = Math.floor(e.y / TILE);
    let bonk = false;
    for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) { bonk = true; break; }
    // CORNER CORRECTION (opt-in via e.ccorr â€” the player only). Clipping a
    // ceiling corner by a few pixels on the way up is an aiming error smaller
    // than a paw; the canon answer (Celeste nudges up to 4px, we allow 8) is
    // to slide the body sideways around the corner and keep the jump's speed
    // instead of bonking. Only a small shift qualifies, and only into space
    // that is actually clear for the whole body â€” otherwise it is a real
    // ceiling and stops her like one.
    if (bonk && e.ccorr) {
      const clearAt = (nx) => {
        const a0 = Math.floor(nx / TILE), a1 = Math.floor((nx + e.w - 1) / TILE);
        for (let tx = a0; tx <= a1; tx++) if (solidAt(tx, ty)) return false;
        const b0 = Math.floor(e.y / TILE), b1 = Math.floor((e.y + e.h - 1) / TILE);
        for (let ty2 = b0; ty2 <= b1; ty2++) if (solidAt(a0, ty2) || solidAt(a1, ty2)) return false;
        return true;
      };
      const dxR = (Math.floor(e.x / TILE) + 1) * TILE + 0.01 - e.x;          // clear the left corner
      const dxL = e.x + e.w - Math.floor((e.x + e.w - 1) / TILE) * TILE + 0.01; // clear the right corner
      if (dxR > 0 && dxR <= 8 && clearAt(e.x + dxR)) { e.x += dxR; bonk = false; }
      else if (dxL > 0 && dxL <= 8 && clearAt(e.x - dxL)) { e.x -= dxL; bonk = false; }
    }
    if (bonk) { e.y = (ty + 1) * TILE + 0.01; e.vy = 0; col.u = 1; }
  }
  // How far below her feet the ground may be and still count as underfoot.
  //
  // A CONSTANT WAS THE WRONG SHAPE, and measuring said so. The first pass used
  // 14 px, reasoning that one frame at full run is ~11 px of travel. Then the
  // curve was asked directly how far it descends over 11 px inside a single
  // tile row: A0/A1/D3 reach 15.9 px, B4 28.9, and the Foundry 51.8. So 14 was
  // under the commonest case â€” that is the one skip the gait harness still
  // caught â€” and no constant can be right for all four, because 52 px is a
  // tile and a half and would glue her over real drops.
  //
  // A SLOPE LIMIT is the right shape and is what character controllers use:
  // ground counts as underfoot if reaching it is a walkable descent RELATIVE TO
  // HOW FAR SHE TRAVELLED. Fast, she keeps contact over steeper ground; slow or
  // still, almost none â€” so it can never quietly hold her over a cliff. The
  // small constant term keeps a standing body on the ground it is standing on.
  //
  // The Foundry stays a fall, and that is correct rather than conceded: a
  // surface that drops 52 px in 11 is not a slope, it is a cliff drawn inside
  // one tile row, and the fix for that lives in the terrain amplitude and not
  // in the collider.
  // The constant term is not padding: buildSurfaceCurve deliberately puts
  // FRACTURES in the curve â€” 'a slab dropped a few px against its neighbour',
  // up to 16 px of hard break between adjacent samples. A fracture is a step,
  // not a slope, so no speed-proportional term can cover it and a body walking
  // over one falls off a cliff a fifth of her height. 10 clears the downward
  // half of that amplitude at any speed, standing still included.
  const GROUND_SNAP = 10 + Math.abs(e.vx || 0) * dt * 1.6;
  // THE HEIGHTFIELD. The tile resolver above snaps a landing to ty * TILE â€” the
  // top of a square â€” which is why the level stayed a flat line however the
  // terrain was drawn. Where the surface curve rises above that tile top, real
  // material was added and she should stand ON it: mounds become things she
  // walks over and jumps onto, not scenery she passes through.
  //
  // Only upward. Where the curve dips below the tile, the square still wins â€”
  // a body sinking into drawn ground is how a floor stops being trustworthy.
  if (e.vy >= 0 && !e.noHeightfield && typeof groundColumnAt === 'function') {
    const cx = e.x + e.w / 2;
    const gc = groundColumnAt(cx);
    if (gc) {
      const gy = gc[0], gTop = gc[1];      // surface, and the tile top under it
      const feet = e.y + e.h;
      // She is caught by the mound when her feet are between its surface and
      // the square top it was built on â€” that band IS the added material. The
      // tile top is what proves something solid is holding it up.
      if (gy < gTop && feet > gy - 0.5 && feet <= gTop + 1.5) {
        e.y = gy - e.h - 0.01; e.vy = 0; col.d = 1;
      } else if (e.on && e.vy >= 0 && gy < gTop && feet <= gy && gy - feet <= GROUND_SNAP) {
        // DOWNHILL, which is the half that was missing and the reason running
        // looked wrong. Going UP a mound her feet land inside the band above and
        // she is caught. Going DOWN, the next column's surface is LOWER than her
        // feet, so she is outside that band entirely â€” unsupported, in mid-air,
        // one frame of gravity, caught again on the next column, over and over.
        //
        // Measured before this line existed: running across level ground she was
        // airborne 8 frames in 24, her feet juddering 20 px, vy spiking to 153,
        // and the pose snapping to a falling plate that is drawn CENTRED instead
        // of from the foot â€” so she also popped and changed size. She was not
        // running, she was skipping.
        //
        // A body that was standing on the ground keeps standing on it while the
        // ground is still under its feet. That is the ground snap every
        // platformer with slopes has, and it cannot glue her over a pit: the
        // gy < gTop test means there is a solid tile holding this surface up.
        e.y = gy - e.h - 0.01; e.vy = 0; col.d = 1;
      }
    }
  }
  // MACHINES KNOW WHEN THEY ARE STANDING. Only the hero ever set `on`, so for
  // every enemy the downhill branch just above read `e.on` as undefined and
  // never ran: a walker going down a curve left the surface each column and
  // fell back onto the next one â€” the same skip that branch was written to
  // cure in her â€” and the hopper-wolf's airborne plate (wolfPose reads
  // `on === false`) could never be chosen, so it ran its walk frames in mid-
  // air. Opt-in (`groundTrack`, set by the Enemy constructor) because the hero
  // and the guardians keep their own flag with their own rules, and a body that
  // does not ask must not have a field written onto it behind its back.
  //
  // `airT` is how long it has been off the ground â€” the pose reads it so one
  // frame of daylight over a fracture is not drawn as a leap â€” and `walkD` is
  // floor actually covered, which is what a gait is clocked by (atlas 'walk').
  if (e.groundTrack) {
    e.on = !!col.d;
    e.airT = col.d ? 0 : (e.airT || 0) + dt;
    if (col.d) e.walkD = (e.walkD || 0) + Math.abs(e.x - xStart);
  }
  tileLinkOn = false;
  return col;
}
// WHAT STOPS A SHOT â€” which is not the same question as what stops a BODY.
//
// '=' is a one-way platform: a body jumps up through it and lands on top. The
// projectile test reused solidAt, which is correctly honest about '=' being
// passable, so every shot fired from under a gantry went straight up through
// the floor and hit whoever was standing on it. Standing on a platform reads
// as cover and therefore has to BE cover â€” in both directions, and for her own
// shuriken too, which is what makes it a position worth taking rather than a
// place the rules happen to favour her.
function blocksShot(tx, ty) {
  const c = tileAt(tx, ty);
  return c === '#' || c === 'B' || c === '=';
}
// SWEPT, NOT SAMPLED. A shot travels further than a tile in one step whenever
// the machine is slow or the shot is fast, and a point test taken only at the
// end of the step walks it clean through a one-tile floor without ever having
// been inside it. Returns the last free point before the block, or null.
function shotSweep(x0, y0, x1, y1) {
  // a shot that STARTS inside terrain (a turret muzzle buried in its own
  // mounting) is given the step to get out rather than killed on spawn
  if (blocksShot(Math.floor(x0 / TILE), Math.floor(y0 / TILE))) return null;
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 8));
  let px = x0, py = y0;
  for (let i = 1; i <= steps; i++) {
    const x = x0 + dx * (i / steps), y = y0 + dy * (i / steps);
    if (blocksShot(Math.floor(x / TILE), Math.floor(y / TILE))) return { x: px, y: py };
    px = x; py = y;
  }
  return null;
}
function onSpike(e) {
  const x0 = Math.floor((e.x + 5) / TILE), x1 = Math.floor((e.x + e.w - 5) / TILE);
  const y0 = Math.floor((e.y + 6) / TILE), y1 = Math.floor((e.y + e.h - 2) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const c2 = tileAt(tx, ty); if (c2 === '^' || c2 === 'v') return true; }
  return false;
}
// IS THERE FLOOR AHEAD? â€” the ledge probe every patrol turns on, and the
// single line that stopped the whole roster walking.
//
// It used to sample ONE POINT, four pixels below the feet. That was correct
// for as long as a body's feet sat exactly on a tile top, and it stopped being
// correct the day the surface curve became a heightfield: a body standing on a
// mound stands ABOVE the tile that holds the mound up â€” measured in A1, 9.4 px
// above it, on ground that is perfectly flat â€” so the probe landed in the air
// row and reported a cliff. Every walker in the game then turned round on
// every frame of every room.
//
// Measured before it was believed, over ten seconds of patrol: the A1 crawler
// covered 44 px and reversed 566 times; the A2 guard 38 px and 583; the C2
// blob 9 px and 592. Six hundred frames, five hundred and ninety-two turns.
// They were not trapped by the terrain's creases â€” they were vibrating in
// place, and the owner watching them called it exactly right: since the
// irregular surfaces arrived, the enemies cannot move.
//
// So the probe now asks the question the RESOLVER answers, in the two forms
// ground can take:
//
//   THE HEIGHTFIELD, where the curve has added real material above the tile â€”
//     the same test moveEnt uses to stand a body on it.
//   THE TILES, scanned down a STEP rather than sampled at a point, because
//     ground a few pixels below the feet is ground you walk onto, not a cliff
//     you fall off. The scan stops at one step: a genuine drop still turns a
//     patrol round, which is what keeps enemies off the pits.
// TURN ROUND, OR STAND STILL â€” but never spin.
//
// Every patrol reads `col.d && !groundAhead(...)` and reverses. That is right
// when the ground runs out ahead and wrong when it has run out BOTH ways: a
// body on an island then flips on every frame forever, which is a different
// bug with the same symptom as the probe bug above and survived the fix to it.
// Measured on the A2 guard: 147 turns in 360 frames, with no ground ahead on
// 124 of them. It reverses only if the other way is actually better.
//
// A THIRD way to hit the same symptom, found tuning the terrain-bumpiness
// pass (owner, 2026-09-11), and this one is not a flicker in the read â€” it
// is a real, if gentle, SLOPE the crawler is standing on. buildSurfaceCurve's
// own step-ramp (RAD ~1.5 tiles either side of a real one-tile rise, the same
// pass that turns the player's steps into something she runs up) spreads
// CV2's authored lip at the room's own east mouth into a ~48px grade. A body
// partway up that grade is a genuinely ambiguous read â€” the ground a few px
// ahead really is a different height than the ground a few px behind â€” so
// the ledge probe flips with it, correctly, every time her feet cross the
// next sub-pixel of gradient: measured 76-156 turns in 360 frames, and it
// tracked her exact sub-pixel position on the slope rather than any one
// broken column.
//
// A time-based cooldown does not fit this shape: the slowest patrol in the
// roster (the blob, ~18-30 px/s under its own breathing) can take several
// seconds to clear a 48px grade, and gating on a clock either reopens before
// she is off it (too short to matter) or holds her motionless in an empty
// room for no reason a player would read as intentional (too long). What
// actually resolves the ambiguity is DISTANCE: once she has moved a tile and
// a half from wherever she last turned, she is off the graded span this
// class of slope produces and any new answer from groundAhead() is a fresh
// question, not the same flicker asked again. Gating on ground actually
// covered, not on time spent, costs a real ledge nothing (the first read
// still turns her) and never traps her â€” she is walking the whole gated
// span, same direction, at her own speed, not standing still.
const LEDGE_GATE = TILE * 1.5;
function ledgeTurn(e, dir) {
  if (e.turnX != null && Math.abs(e.x - e.turnX) < LEDGE_GATE) return false;
  const should = !groundAhead(e, dir) && groundAhead(e, -dir);
  if (should) e.turnX = e.x;
  return should;
}
function groundAhead(e, dir) {
  const ax = dir > 0 ? e.x + e.w + 3 : e.x - 3;
  const feet = e.y + e.h;
  if (typeof groundColumnAt === 'function') {
    const gc = groundColumnAt(ax);
    // gc[0] < gc[1] is the proof that a solid tile is holding this surface up
    if (gc && gc[0] < gc[1] && gc[0] - feet <= STEP_DOWN && feet - gc[0] <= TILE) return true;
  }
  const tx = Math.floor(ax / TILE);
  const t0 = Math.floor((feet + 2) / TILE), t1 = Math.floor((feet + STEP_DOWN) / TILE);
  for (let ty = t0; ty <= t1; ty++) {
    const c = tileAt(tx, ty);
    if (c === '#' || c === 'B' || c === '=') return true;
  }
  return false;
}
// ===========================================================================
// THE WALKERS' GAIT â€” it starts, it stops, and a turn is a TURN.
//
// Every walker used to write vx = dir * spd outright: full speed on the first
// frame, full speed the other way on the frame it decided to turn round. The
// picture eased round over ~0.18 s (faceVis, dt*5.5) but the velocity had
// already flipped, so for that long every turn slid the body backwards under
// an image still pointing the old way â€” the moonwalk in the owner's study
// (plan Â§1). The order is now the order an animal does it in:
//
//   1. BRAKE to a stop, still facing where it was going;
//   2. TURN â€” the picture comes round while the body stands (and the wolves'
//      plate mirrors on the crossing, which is now a standing flip);
//   3. ACCELERATE the new way, and never before the picture shows that way.
//
// What that buys, measured by tests/enemygait.cjs: outside a brake, sign(vx)
// never disagrees with the side the picture faces. Ledge and wall turns go
// through the same three steps; the brake is short enough (â‰¤ 4 px at the
// fastest patrol in the roster, a swift crawler) that the ledge probe's own
// look-ahead still covers it, so nothing walks off a ledge it used to turn at.
// Tuning lives in docs/combat/ENEMY_CRAWLER.md.
// ===========================================================================
const WALK_ACC_T = 0.16;     // s: standstill -> its own patrol speed
const WALK_BRAKE_T = 0.09;   // s: patrol speed -> standstill
const FACE_RATE = 5.5;       // faceVis units per second, the rate it always turned at
// RECOVERY POSES' CLOCKS â€” visual only, nothing in the rules reads them. The
// hopper holds its landing crouch for the first third of a second of the gap
// after touchdown; a turret's barrel kicks back for this long after a shot.
const HOP_LAND_T = 0.32;
const TURRET_KICK_T = 0.3;
// the kinds that walk on the floor and therefore turn with their feet. The
// hostile sage is a duelist that BACKS AWAY while facing her on purpose, but
// once it is purified the shared calm branch gives it ordinary ground travel;
// that travel must use the gait too or the rescued body snaps/slides between
// its stops.
const WALKERS = { crawler: 1, guard: 1, blob: 1, hopper: 1, sage: 1 };
// which side the picture shows: the sign of the eased facing
function faceSide(e) { return (e.faceVis == null ? (e.dir || 1) : e.faceVis) >= 0 ? 1 : -1; }
// where a walker's picture is heading: wherever it is moving, and only once it
// has stopped, wherever it has decided to go
function walkerFaceTarget(e) { return e.vx ? Math.sign(e.vx) : (e.dir || faceSide(e)); }
// drive vx toward `want` (signed px/s) under the three rules above
function enemyGait(e, want, dt) {
  const ref = Math.max(24, e.spd || 24);
  const ws = Math.sign(want), vs = Math.sign(e.vx);
  if (vs && vs !== ws) {                       // 1. braking, never through zero
    const dv = ref / WALK_BRAKE_T * dt;
    e.vx = Math.abs(e.vx) <= dv ? 0 : e.vx - vs * dv;
    return;
  }
  if (!ws) return;
  if (faceSide(e) !== ws) { e.vx = 0; return; } // 2. standing while it turns
  const a = ref / (Math.abs(e.vx) > Math.abs(want) ? WALK_BRAKE_T : WALK_ACC_T) * dt;
  const d = want - e.vx;                        // 3. accelerating (or easing off)
  e.vx = Math.abs(d) <= a ? want : e.vx + Math.sign(d) * a;
}
// AN ATTACK COMMITS THE FACING. A lunge or a leap writes its velocity in one
// frame â€” that IS the move â€” so the picture is brought across to that side
// in the same frame rather than eased after it. It only has to cross the
// middle (0.2 past it): the rest of the turn eases on as usual, so the atlas
// still sweeps rather than popping to profile. A no-op when it already faces.
function faceCommit(e, s) {
  if (s && faceSide(e) !== s) e.faceVis = s * 0.2;
}
// FRAME-RATE-PROOF SMOOTHING. `lerp(a, b, 0.1)` once per update is a rate per
// FRAME, and update runs at the display's rate (1/30 s steps on a slow phone,
// 1/144 on a fast monitor), so a flier on a 120 Hz screen closed four times
// faster than on a 30 Hz one. 1 - exp(-kÂ·dt) is the same approach expressed
// per second: k is chosen so that at 60 Hz it equals the old per-frame
// fraction, which keeps the tuning everyone has been looking at.
function smoothK(k, dt) { return 1 - Math.exp(-k * dt); }
// Resolve the same support used by collision, including raised ground and platforms.
// null means open space: never print a shadow on an imaginary floor over a pit.
function shadowGroundY(body, maxDrop = 240) {
  const cx = body.x + body.w / 2, feet = body.y + body.h;
  let support = Infinity;
  const accept = y => { if (Number.isFinite(y) && y >= feet - 2 && y - feet <= maxDrop) support = Math.min(support, y); };
  if (typeof groundColumnAt === 'function') {
    const gc = groundColumnAt(cx);
    if (gc) accept(Math.min(gc[0], gc[1]));
  }
  const tx = Math.floor(cx / TILE);
  for (let ty = Math.floor((feet - 2) / TILE); ty * TILE <= feet + maxDrop; ty++) {
    if (solidAt(tx, ty) || tileAt(tx, ty) === '=') { accept(ty * TILE); if (support < Infinity) break; }
  }
  for (const p of G.plats || []) if (cx >= p.x && cx <= p.x + p.w) accept(p.y);
  return support < Infinity ? support : null;
}

function touchingWall(e, dir) {
  const tx = Math.floor((dir > 0 ? e.x + e.w + 2 : e.x - 2) / TILE);
  const t0 = Math.floor((e.y + 4) / TILE), t1 = Math.floor((e.y + e.h - 4) / TILE);
  // a shaft wall that belongs to the room above is still a wall she can slide
  tileLinkOn = e === player;
  let hit = false;
  for (let ty = t0; ty <= t1; ty++) if (solidAt(tx, ty)) { hit = true; break; }
  tileLinkOn = false;
  return hit;
}

const FLIP_DUR = 0.62;   // the double-jump pirouette, start to finish

// ===========================================================================
// THE ATTACK TABLE â€” ONE CLAW STAT, A ROW PER MOVE (handoff Part 2, A1-A3).
//
// Player.dmg() is the one stat: 12 x weapon tier x crest x resolve x relics x
// difficulty. Every strike she has is a row here, keyed off that stat, so one
// upgrade lifts every move at once and nothing is hand-rebalanced at a call
// site. Before the table each move carried its own literals inline â€” the
// finisher's 1.35 inside the swing, 0.6 in the plunge ring, 0.35/0.8 in
// grapple.js, 310/220/120 knockback on every slash, 240 on the throw â€” and a
// change to one move was a hunt through four files.
//
//   mult        x dmg(). `skill: [id, mult]` replaces it while the skill is owned
//   floor       the least the rounded number may be (moves that always register)
//   feral, wield, purity, crit
//               which CONDITIONAL factors the row takes (ATK_MOD, applied in
//               Player.attackDmg and nowhere else)
//   multi       a sustained move: it re-hits on its own clock, every `every`
//               seconds of GAME time â€” never per frame and never per update()
//               call, because the loop runs a fixed SIM_STEP and may call
//               update() several times in one frame
//   kb          px/s along the blow's direction. 0 PINS the body where it was
//               struck; null means the move does not knock at all
//   kbV         px/s along the blow's vertical component
//   kbUp        px/s of lift on top of that (null: the move leaves vy alone)
//   kbT         s the body is a thrown object before its own brain resumes
//   freeze      hit-stop on contact, s. For a multi-hit, on its FIRST contact
//   tickFreeze  hit-stop on a multi-hit's later contacts (0: no stutter)
//   freezeBig   hit-stop against a guardian, where it differs
//   recoil      px/s her own blow pushes HER back
//   crest       the row is HER SWING (slash, finisher): the seal that sets her
//               fighting style scales its kb, kbV and freeze (CREST_ATTACK in
//               js/game.js, C1). Damage is never touched by it
//
// A1 â€” the damage is exactly what each move dealt before the table existed.
// tests/attacks.cjs swings every row across a matrix of builds and checks it
// against the pre-refactor formulas, written out by hand in the harness.
//
// A2 â€” KNOCKBACK, CHOSEN PER MOVE, and why:
//   slash      310  the jab, unchanged. A chain's opener must leave the foe
//                   inside the next beat's reach: 310 over 0.26 s carries a
//                   crawler ~50 px, which the next beat still covers.
//   finisher   465  1.5x the jab, ~80 px. The third beat ENDS the exchange and
//                   buys her space; at 310 (the old number, the same as the
//                   jab) the finisher landed like the first hit.
//   throw      465  the thrown blade is the spear (Silksong's Silkspear: 1.5x
//                   magnitude), along its flight. Was 240.
//   throwBack    0  the RETURN pass still cuts, but pins. A blade flying home
//                   that carried the foe with it dragged it onto her â€” the old
//                   240 toward the catcher made the throw punish the thrower.
//   swirl        0  a multi-hit PINS (Silksong's multi-hitters use 0). The ring
//                   is worth standing in only if what it catches stays caught;
//                   the old 120 px/s outward shove walked a foe out of a 62 px
//                   ring before the last pass. The 60 px/s lift stays: juggled,
//                   not thrown, exactly as the swirl's own note says.
//   burst      420  the radial "get off me", unchanged.
//   plunge     260  the ring beside the pogo, radial, unchanged.
//   grapHit    260  the claw's arrival strike, unchanged; she bounces off it.
//   grapBite  null  the bite holds the foe on the line while she reels in.
//   thunder      0  NOSTOS's bolt falls from straight above: it pins and lifts.
//   risecut         the up-slash launcher: the slash's push, then a fixed 430
//                   lift that meets an air chain â€” kept exactly as it was.
//   clash      260  every parry (js/parry.js parryClash: the perfect guard and
//                   GRAVEHORN's strike on his horn): steel on steel, no damage,
//                   the attacker is shoved back on its heels.
//   counter    360  the parry's answer (js/parry.js): FLAT 36, upgrades do not
//                   scale it (Silksong's Cross Stitch is 15 flat on a 5 needle).
//   soar         0  Volt Soar (js/soar.js): FLAT 48 to everything she passes,
//                   pinned and thrown upward, out of her way.
//
// A3 â€” only the FIRST contact of a move freezes the game. The swirl froze
// 35 ms on every pass: four stutters in the one move whose point is that you
// watch it. Its later passes now freeze 0 (tickFreeze). Ranged kit â€” stars,
// suits, the wave, the EMP â€” is priced in ammo and volts, not in the claw
// stat, and is deliberately not in this table.
// ===========================================================================
const ATK_MOD = {
  feral: 1.45,                // FERAL CLAWS (clawT): the claws rake deeper
  wield: [1, 1.25, 1.45],     // bare paws / a crystal / the joined blade
  purity: 1.3,                // skill 'purity': a pure edge on a guardian or the corrupted
  crit: 2, critChance: 0.1,   // relic 'lens'
};
const ATTACKS = {
  slash:     { mult: 1, feral: 1, wield: 1, purity: 1, crit: 1, crest: 1,
               kb: 310, kbV: 220, kbUp: 120, kbT: 0.26, freeze: 0.05, freezeBig: 0.06, recoil: 62 },
  finisher:  { mult: 1.35, skill: ['calc', 1.55], feral: 1, wield: 1, purity: 1, crit: 1, crest: 1,
               kb: 465, kbV: 220, kbUp: 120, kbT: 0.30, freeze: 0.085, recoil: 130 },
  risecut:   { mult: 1, kbUp: 430, kbT: 0.4, lift: 300 },   // rides on the slash it launches from
  plunge:    { mult: 0.6, kb: 260, kbUp: 180, kbT: 0.3 },
  throw:     { mult: 1.15, skill: ['boomer', 1.45], kb: 465, kbT: 0.22, freeze: 0.05 },
  throwBack: { mult: 1.15, skill: ['boomer', 1.45], kb: 0, kbT: 0.22, freeze: 0.05 },
  swirl:     { mult: 0.95, floor: 1, multi: true, every: 0.16,
               kb: 0, kbUp: 60, kbT: 0.16, freeze: 0.035, tickFreeze: 0 },
  burst:     { mult: 3.2, kb: 420, kbV: 200, kbUp: 180, kbT: 0.3, freeze: 0.12 },
  thunder:   { mult: 1.6, kb: 0, kbUp: 180, kbT: 0.3 },
  grapBite:  { mult: 0.35, floor: 1, kb: null, freeze: 0.035 },
  grapHit:   { mult: 0.8, floor: 1, kb: 260, kbUp: 160, kbT: 0.26, freeze: 0.07 },
  clash:     { mult: 0, kb: 260, freeze: 0.14 },
  counter:   { mult: 0, flat: 36, kb: 360, kbUp: 160, kbT: 0.3, freeze: 0.09 },
  soar:      { mult: 0, flat: 48, kb: 0, kbUp: 320, kbT: 0.3, freeze: 0.04 },
};
// every row carries every field, so a reader (or the Forge) never has to know
// which ones a move happened to need
for (const id in ATTACKS) ATTACKS[id] = Object.assign({ id, mult: 1, skill: null, floor: 0,
  flat: 0, feral: 0, wield: 0, purity: 0, crit: 0, crest: 0, multi: false, every: 0, kb: null, kbV: 0, kbUp: null,
  kbT: 0, freeze: 0, tickFreeze: 0, freezeBig: null, recoil: 0 }, ATTACKS[id]);
// Knockback, from the row. dx/dy are the blow's unit direction. Guardians and
// turrets are never moved by her blows; returns whether this body was.
// A row marked `crest` (the swing's two rows) is scaled by the attack block of
// the seal that set her style (CREST_ATTACK, js/game.js): a fixed blow never is.
function attackKnock(e, id, dx, dy) {
  const A = ATTACKS[id];
  if (A.kb == null || (typeof Boss !== 'undefined' && e instanceof Boss) || e.kind === 'turret') return false;
  e.kbT = A.kbT;
  const ck = A.crest && !A.flat ? crestSwingMul('kb') : 1;
  if (A.kb) e.vx += dx * A.kb * ck; else e.vx = 0;        // 0 PINS
  if (A.kbUp != null) e.vy = Math.min(e.vy, 0) + (dy || 0) * A.kbV * ck - A.kbUp;
  return true;
}
// Hit-stop, from the row. `later`: a multi-hit's contact after its first.
function attackFreeze(id, big, later) {
  const A = ATTACKS[id];
  const f = (later ? A.tickFreeze : (big && A.freezeBig != null ? A.freezeBig : A.freeze))
    * (A.crest && !A.flat ? crestSwingMul('freeze') : 1);
  if (f > 0) G.hitStop = Math.max(G.hitStop || 0, f);
  return f;
}

// ===========================================================================
// THE SLASH, DEFINED ONCE.
//
// The paw's pose and the claw effect used to be authored separately â€” two
// hand-tuned sets of angles that had no reason to agree, and did not. The
// effect swept one way while the limb throwing it swung another, which is the
// exact thing that reads as "the hand is not moving with the slash".
//
// Both now come from this table. Each beat of the string is one DIAGONAL rake:
// a cat pulls its claws down and back toward itself, it does not swipe flat and
// away. And each beat is thrown by a different paw â€” right, then left, then
// both crossing â€” so a three-hit string is three different motions instead of
// one arm doing everything.
//
//   hand : F front paw, B rear paw, X both (the finisher crosses them)
//   a0â†’a1: where the paw starts and finishes, in radians around the shoulder,
//          relative to the aim. Positive is DOWNWARD on this canvas, so every
//          arc here ends lower than it starts.
//   r0â†’r1: reach at the start and at full extension
// ===========================================================================
// THE SWIRL â€” the twin-blade supercharge. Numbers in seconds, because the loop
// is a fixed-step float accumulator and frame integers would be fabricated
// precision (see the combat skill, Â§0.1).
//
//   startup   ~0     she is already committed when the charge releases
//   active    0.64   FOUR passes, one every 0.16
//   recovery  0.30   she lands out of the turn; this is the cost
//
// Her own recovery is the risk she is buying the ring with. 300 ms is longer
// than any of her combo beats (0.23â€“0.33) and is meant to be felt: the swirl is
// a decision, not a better button.
// The pass clock is the swirl row's `every` (ATTACKS above): one number.
const SWIRL_T = 0.64, SWIRL_STEP = ATTACKS.swirl.every, SWIRL_R = 62;
// the plate's diagonal pogo (C1) rebounds her FORWARD at her own run speed, so
// holding on carries her over what she struck and letting go lets it bleed off
const DIAG_POGO_VX = 340;
const SLASH = [
  { hand: 'F', a0: -0.95, a1: 0.42, r0: 11.5, r1: 21 },   // beat 1 â€” right paw, steep down-rake
  { hand: 'B', a0: -0.45, a1: 0.92, r0: 11, r1: 20 },     // beat 2 â€” left paw, shallower, crosses under
  { hand: 'X', a0: -1.05, a1: 0.55, r0: 12, r1: 23 },     // beat 3 â€” both, closing in an X
];
// the rear paw's half of the finisher travels the other way, so the two arcs
// cross rather than chasing each other
const SLASH_X_B = { a0: 0.75, a1: -0.8, r0: 12, r1: 21 };
// Both forelegs are built the same way; the far one is simply darker, so the
// two read as near and far rather than as one arm that changed sides.
// ===========================================================================
// ONE LIMB. NO BEADS. THIS IS A RULE, NOT A PREFERENCE.
//
// The owner has ruled out the jointed arm repeatedly, and it kept coming back
// because of what is written just below this line in the previous version of
// this comment: an argument that a machine's arm SHOULD show its segments, and
// that a smooth taper reads as flesh. That argument is mine, it is about my
// taste, and it was never what was asked for. Worse, the last round of this
// only SOFTENED it â€” three beads became two, the shoulder puck was flattened,
// and the note congratulated itself for it. A rule half-applied is a rule
// ignored with extra steps.
//
// So: her arm is ONE piece. A single continuous tapered casing from shoulder
// to wrist, thick where it leaves the shoulder and narrow at the paw, bending
// through the elbow as a CURVE rather than a hinge. No pucks. No rings. No gap
// at the bend. Nothing on the limb that reads as a bead on a string.
//
// It still bends â€” the IK solve is unchanged, and the elbow is still where the
// elbow was â€” but the bend is in the silhouette, the way it is in the opening
// film, instead of being announced by hardware bolted to the outside.
//
// tests/hero.cjs enforces this: it spies on the draw and fails if a joint is
// ever stamped onto her arm. That is the only version of this rule that has
// ever survived a week.
function armBone(c, x0, y0, x1, y1, w, trim, dark, mid, lit) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  const ax = x0 + ux * trim, ay = y0 + uy * trim;
  const bx = x1 - ux * trim, by = y1 - uy * trim;
  c.lineCap = 'round';
  c.strokeStyle = dark; c.lineWidth = w + 1.8;
  c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
  c.strokeStyle = mid; c.lineWidth = w;
  c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
  if (lit) {                                     // top-lit edge along the casing
    c.strokeStyle = lit; c.lineWidth = Math.max(0.9, w * 0.3);
    c.beginPath();
    c.moveTo(ax - uy * w * 0.24, ay + ux * w * 0.24 - 0.6);
    c.lineTo(bx - uy * w * 0.24, by + ux * w * 0.24 - 0.6);
    c.stroke();
  }
}
// KEPT, AND DELIBERATELY UNCALLED. This stamped the pucks onto her arm and is
// the exact thing the rule forbids. It stays as a named function so
// tests/hero.cjs can spy on it and fail the build the moment anything calls it
// again â€” a rule with a tripwire under it, rather than a rule in a comment.
function armJoint(c, x, y, r, dark, mid, glow) {
  if (typeof G !== 'undefined' && G) G._armJointCalls = (G._armJointCalls || 0) + 1;
  c.fillStyle = dark;
  c.beginPath(); c.arc(x, y, r + 0.9, 0, 7); c.fill();
  c.fillStyle = mid;
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  if (glow) { c.fillStyle = glow; c.beginPath(); c.arc(x, y, r * 0.42, 0, 7); c.fill(); }
}
// The limb, as one shape. Sampled along shoulder -> elbow -> wrist as a single
// quadratic through the elbow, with the half-width tapering along it, so the
// outline is continuous and the bend is a curve rather than a corner.
const ARM_SEG = 14;
function armBones(c, shX, shY, ex, ey, hx, hy, far, glow) {
  c.lineJoin = 'round';
  const dark = far ? 'rgba(32,41,54,0.92)' : 'rgba(38,48,62,0.92)';
  const mid = far ? '#6d7a8c' : '#8593a6';
  const lit = far ? 'rgba(190,205,224,0.34)' : 'rgba(226,236,250,0.52)';
  const w0 = (far ? 3.4 : 3.8) * 1.16;          // shoulder half-width
  const w1 = (far ? 3.4 : 3.8) * 0.62;          // wrist half-width
  // the elbow is the control point of ONE curve, not a hinge between two bones
  const px = [], py = [], pw = [];
  for (let i = 0; i <= ARM_SEG; i++) {
    const t = i / ARM_SEG, u = 1 - t;
    px.push(u * u * shX + 2 * u * t * ex + t * t * hx);
    py.push(u * u * shY + 2 * u * t * ey + t * t * hy);
    // taper, with a little swell through the forearm so it is a limb and not
    // a cone â€” a straight linear taper is the other way to look wrong
    pw.push((w0 + (w1 - w0) * t) * (1 + 0.10 * Math.sin(t * Math.PI)) * 0.5);
  }
  const side = (sign) => {
    for (let i = 0; i <= ARM_SEG; i++) {
      const j = sign > 0 ? i : ARM_SEG - i;
      const a2 = px[Math.min(ARM_SEG, j + 1)] - px[Math.max(0, j - 1)];
      const b2 = py[Math.min(ARM_SEG, j + 1)] - py[Math.max(0, j - 1)];
      const d = Math.hypot(a2, b2) || 1;
      const nx = -b2 / d * pw[j] * sign, ny = a2 / d * pw[j] * sign;
      const X = px[j] + nx, Y = py[j] + ny;
      if (i === 0 && sign > 0) c.moveTo(X, Y); else c.lineTo(X, Y);
    }
  };
  // contour, then the casing, as ONE closed outline
  c.beginPath(); side(1); side(-1); c.closePath();
  c.fillStyle = dark; c.fill();
  c.save(); c.clip();
  c.fillStyle = mid;
  c.beginPath(); side(1); side(-1); c.closePath(); c.fill();
  // one continuous top-lit edge running the whole length â€” the read that
  // replaces the hinge: light says where the limb turns
  c.strokeStyle = lit; c.lineWidth = Math.max(0.9, w0 * 0.34);
  c.beginPath();
  for (let i = 0; i <= ARM_SEG; i++) {
    const a2 = px[Math.min(ARM_SEG, i + 1)] - px[Math.max(0, i - 1)];
    const b2 = py[Math.min(ARM_SEG, i + 1)] - py[Math.max(0, i - 1)];
    const d = Math.hypot(a2, b2) || 1;
    const X = px[i] - b2 / d * pw[i] * 0.5, Y = py[i] + a2 / d * pw[i] * 0.5 - 0.5;
    if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
  }
  c.stroke();
  c.restore();
  // the one light she keeps: a soft glow INSIDE the casing at the elbow, with
  // no ring and no edge â€” the machine showing through the shell rather than a
  // bolt sitting on it
  if (glow) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
    const gg = c.createRadialGradient(ex, ey, 0, ex, ey, w0 * 1.5);
    gg.addColorStop(0, glow); gg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gg; c.beginPath(); c.arc(ex, ey, w0 * 1.5, 0, 7); c.fill();
    c.restore();
  }
}
function armPaw(c, hx, hy, wr, spread, far) {
  c.save(); c.translate(hx, hy); c.rotate(wr);
  const k2 = far ? 0.9 : 1;
  c.fillStyle = far ? 'rgba(32,41,54,0.9)' : 'rgba(38,48,62,0.9)';   // contour
  c.beginPath(); c.ellipse(0.3, 0, 4.1 * k2, 3.5 * k2, 0, 0, 7); c.fill();
  for (let k = -1; k <= 1; k++) {
    c.beginPath(); c.arc(2.5 * k2, k * 1.65 * spread, 1.9 * k2, 0, 7); c.fill();
  }
  c.fillStyle = far ? '#9fadc0' : '#dbe3ef';
  c.beginPath(); c.ellipse(0.3, 0, 3.2 * k2, 2.6 * k2, 0, 0, 7); c.fill();   // pad
  c.fillStyle = far ? '#b6c3d4' : '#f2f6fd';
  for (let k = -1; k <= 1; k++) {                                            // three toes
    c.beginPath(); c.arc(2.5 * k2, k * 1.65 * spread, 1.1 * k2, 0, 7); c.fill();
  }
  c.restore();
}
// Where the throwing paw is RIGHT NOW. One function, so nothing downstream can
// disagree with it: the limb is drawn here and the effect is rotated by it.
function slashPose(sv, face, back) {
  const S = back ? Object.assign({}, SLASH[2], SLASH_X_B) : SLASH[sv.combo] || SLASH[0];
  const raw = clamp(1 - sv.t / sv.t0, 0, 1);
  // ANTICIPATION: the paw pulls back past the start of the arc for the first
  // beat, then whips through it
  const pr = raw < 0.18 ? -(raw / 0.18) * 0.3 : (raw - 0.18) / 0.82;
  const prc = Math.max(0, pr);
  const aim = sv.ang * (face < 0 ? -1 : 1);          // local space; already flipped
  const span = S.a1 - S.a0;
  return {
    hand: S.hand,
    dir: span >= 0 ? 1 : -1,                          // which way this arc sweeps
    ang: aim + S.a0 + span * pr,
    reach: (pr < 0 ? S.r0 - 1 : S.r0) + (S.r1 - S.r0) * Math.sin(prc * Math.PI),
    p: raw,
  };
}

// ===========================================================================
// THE JOINT LAYER â€” why her limbs used to snap.
//
// Every pose in this rig was evaluated fresh each frame and drawn exactly
// where the formula said. That is fine while one formula is running, but the
// moment the state changed â€” run to swing, swing to idle, ground to air, hurt
// to anything â€” the arm was simply somewhere else on the next frame. No amount
// of polish inside a single pose fixes that; the eye reads the seam between
// poses, not the poses.
//
// So the joints now have MEMORY. Each one carries a value and a velocity and
// is driven toward its target by a critically-damped spring: it arrives
// instead of appearing, carries a little of its old motion into the new pose,
// and settles. That single change smooths every transition in the game at
// once, in every direction she can face and every motion she can be in,
// including ones nobody thought to hand-tune.
// ===========================================================================
const RIG_MAXDT = 1 / 30;      // a dropped frame must never fling a limb
function rigStep(s, key, target, stiff, dt) {
  const p = '_' + key, v = '_' + key + 'v';
  if (s[p] === undefined) { s[p] = target; s[v] = 0; return target; }
  // Sub-step, and take the step size FROM the stiffness. A fixed sub-step is
  // the classic way to blow one of these up: a stiff spring integrated at a
  // step near its own period does not settle, it diverges â€” and a limb that
  // diverges leaves the screen. The step is bounded by the damping term, so
  // the stiffest joint here stays as stable as the loosest.
  const damp = 2 * Math.sqrt(stiff);
  const hMax = Math.min(RIG_MAXDT, 1.4 / damp);
  let left = Math.min(dt, 0.1);
  while (left > 1e-6) {
    const h = Math.min(left, hMax);
    s[v] += (stiff * (target - s[p]) - damp * s[v]) * h;
    s[p] += s[v] * h;
    left -= h;
  }
  return s[p];
}
// the same spring, but on a circle: always take the short way round, so an
// angle crossing Â±Ï€ drags through the near side instead of unwinding
function rigAng(s, key, target, stiff, dt) {
  const p = '_' + key;
  if (s[p] !== undefined) {
    let d = target - s[p];
    while (d > Math.PI) { s[p] += Math.PI * 2; d -= Math.PI * 2; }
    while (d < -Math.PI) { s[p] -= Math.PI * 2; d += Math.PI * 2; }
  }
  return rigStep(s, key, target, stiff, dt);
}
// Two-bone IK. The elbow used to be pinned at a fixed angular offset from the
// shoulderâ†’hand line, so it bent by the same amount whether the arm was tucked
// or fully extended â€” the giveaway that nothing underneath was jointed. Now the
// upper arm and forearm have LENGTHS, and the elbow lands wherever those two
// lengths can actually meet the hand.
function rigIK(sx, sy, hx, hy, l1, l2, bend) {
  const dx = hx - sx, dy = hy - sy;
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01, (l1 + l2) * 0.998);
  const base = Math.atan2(dy, dx);
  const cosA = clamp((d * d + l1 * l1 - l2 * l2) / (2 * d * l1), -1, 1);
  const a = base + Math.acos(cosA) * bend;
  return { x: sx + Math.cos(a) * l1, y: sy + Math.sin(a) * l1, base };
}

// ---- HER AUTHORED BODY -----------------------------------------------------
// assets/characters/hero/states.png: one keyed, foot-aligned cell per state,
// assembled by tools/herostates.cjs. Indexed BY NAME, never by number â€” the
// tool's STATES array is the wire format, and naming keeps appending to it safe.
//
// This is the arrangement NOSTOS's hero has always used (drawHeroSprite first,
// the procedural rig as the fallback), pointed at her for the first time. Her
// procedural body is not deleted: it draws until the sheet loads, and it draws
// forever if the sheet is missing.
// Registration and anatomical scale are prepared by tools/hero-delivery.cjs.
const HERO_REG = {};
const HERO_CELL = {
  idle: 0, walk_a: 1, walk_b: 2, run_a: 3, run_b: 4, rise: 5, apex: 6,
  fall: 7, land: 8, dash: 9, skid: 10, wall_cling: 11, djump_jet: 12,
  claw_1: 13, claw_2: 14, finisher: 15, charge: 16, burst: 17, hurt: 18,
  heal: 19, song: 20, slump: 21, walk_c: 22, run_c: 23,
};
const HERO_CELLS = 24;
// All replacement locomotion states are already right-facing.
const HERO_CELL_MIRROR = {}; // Every replacement locomotion frame faces right.
// Shared delivery scale preserves the approved guard's world-space size.
const HERO_DELIVERY_K = 1.441025641025641;
const HERO_POSE_K = {};
// The plate is drawn from the FOOT, like everything else in this file: y=0 is
// the floor and up is negative. HERO_DH is the whole cell's height in world
// units â€” bigger than she is, because the cell has headroom over her ears â€” and
// HERO_FLOOR is the 4px margin herostates.cjs leaves under the grounded poses,
// scaled into those units so her soles land on y=0 and not just near it.
// HERO_FLOOR sinks the plate to the SOIL LINE: the cells carry a baked
// contact shadow and a few px of margin under the feet, and anchoring the
// cell bottom to the floor stood her on top of the grass fringe â€” reported
// as "running on top of grass instead of the ground". Sunk, her feet meet
// the dirt and the front grass blades brush her ankles, which is what
// standing IN a meadow looks like.
const HERO_DH = 60, HERO_FLOOR = 6;
// 1.78 read as oversized against NPCs and enemies (owner, 2026-09-11); cut
// 25% to 1.335, still too big by the owner's own follow-up the same day â€”
// a second 25% cut lands at 1.00125, effectively the ORIGINAL unscaled
// body (1.78 * 0.75 * 0.75 ~= 1). Rounded to exactly 1.0 rather than kept
// at a spurious-precision 1.00125. Still visual only; collision and attack
// reach are unchanged. NPC/enemy art scale (js/atlas.js ATLAS/ATLAS2) is
// corrected the same direction, by the same compounded 0.5625 factor â€”
// which returns every one of those k-values to its own original Sep-2
// value, since they were tuned against this constant before it existed
// (i.e. against an implicit 1.0).
const HERO_SCREEN_SCALE = 1.0;
// js/presentation.js loads before this file (source-files.json), so its own
// PRESENTATION.heroVisualScale literal can't read this constant at
// declaration time â€” it has to be synced here, once, after both exist.
// Skipping that step is exactly how the two went stale against each other
// last time (tests/reconciliation.cjs caught PRESENTATION still saying
// 1.335 while this constant had already moved to 1.335, then to 1.0).
if (typeof PRESENTATION !== 'undefined') PRESENTATION.heroVisualScale = HERO_SCREEN_SCALE;
// Six frames of the real blow per attack (js/media.js swingClaw1 and friends).
// All four are fired: combo 1, combo 2, the combo-3 finisher and the charged
// burst. Anything not here still falls through to its pose cell, which is the
// contract the half-done set shipped under and is worth keeping.
//
// K IS PER STRIP AND IT IS MEASURED, NOT CHOSEN. A strip cell is square and
// the figure fills whatever fraction of it that swing's widest frame allows â€”
// so drawing every strip at HERO_DH makes her a different size in each attack.
// Each k matches the strip cell that holds the SAME POSE as the sheet cell it
// replaces (tools/swingk.cjs prints them): the sheet's subject fraction over
// the strip's, so the character comes out the size she already was.
//   claw_1   sheet 140/169  strip 236/320 (cell 0, the guard)
//   claw_2   sheet 140/169  strip 306/320 (cell 2, the arm extended)
//   finisher sheet 131/169  strip 283/320 (cell 0, both arms up)
//   burst    sheet 132/169  strip 241/320 (cell 5, arms flung wide)
// ---------------------------------------------------------------------------
// THE TRANSITION LAYER â€” what separates this body's motion from a studio's.
//
// Measured, not assumed: tools/statecensus.cjs plays the real game headlessly
// and counts what the body actually does. Over two minutes across fifteen
// rooms it changes pose 446 times a MINUTE, and the jump arc alone â€”
// rise>apex>fall â€” is 12% of every change that happens. Every one of those is
// currently a hard cut between two stills.
//
// A studio does not draw the poses and cut between them; it draws the MOVE and
// lets the pose be whatever frame the move is on. The mechanism for that is
// already in this file â€” drawRoboSwing indexes a fired strip by the swing's
// own clock â€” it was just wearing an attack's name. Generalised here.
//
// THE TRIGGERS ARE THE CLOCKS THE PHYSICS ALREADY KEEPS. landT counts out the
// impact, skidT the turn, takeoffT the push; every transition worth drawing
// already has a timer, because the game already knew the moment was happening.
// A pose is simply what gets drawn when there is no clip for that clock.
//
// Anything with no strip fired falls through to its pose cell â€” the same
// contract the half-finished swing set shipped under, and the reason this can
// land before the art does.
const HERO_TRANS = {
  // st: { key, cells, k, t: p => timer, t0: p => duration }
  // A cells count of 0 means the strip is not fired yet: drawRoboTrans skips
  // it and the pose cell draws, which is the contract everything here ships
  // under. The counts are filled in by the cut (tools/vidstrip.cjs auto:N).
  // k is measured by tools/swingk.cjs against the sheet cell of the same
  // moment (land 8, skid 10, dash 9) so she keeps her size across the change.
  // DRAWN (2026-09-15). Four cells: touch, absorb, rise, stand â€” the compression
  // the census called the most conspicuous thing missing, because a drop that
  // ends with no squash is the clearest "this body has no weight" tell there is.
  // k against the sheet's land cell 8 (211 of 300) using cell 1, the absorb.
  land: { key: 'transLand', cells: 4, k: HERO_DELIVERY_K, t: p => p.landT, t0: p => p.land0 || 0.12 },
  // DRAWN (2026-09-15), replacing a two-cell filmed stand-in with the real
  // turnaround: plant, lean against the momentum, whip round, settle. k against
  // the sheet's skid cell 10 (210 of 300) using cell 1, the braced lean.
  skid: { key: 'transSkid', cells: 4, k: HERO_DELIVERY_K, t: p => p.skidT, t0: p => p.skid0 || 0.14 },
  // DRAWN (2026-09-15): six cells, stand -> drop -> drive -> recover. k against
  // the sheet's dash cell 9 (240 of 300) using the strip's cell 2, which holds
  // that same low driving pose â€” cell 0 is her standing and would read 15% out.
  dash: { key: 'transDash', cells: 6, k: HERO_DELIVERY_K, t: p => p.dashT, t0: p => p.dash0 || 0.16 },
  // the knockback (Â§2aw, 2026-09-05): flung back with the impact sparks,
  // lands, straightens â€” six cells over the 0.3 s the pose timer holds.
  // k 0.90: the sheet's hurt cell stands 204 (airborne) against the strip's
  // flung cell at 257 measured to the idle's 231.
  // DRAWN (2026-09-15): struck, head snapped back, recoiling, recovering â€” and
  // her visor does the acting, going to a pained squint in the middle cells.
  // k against the sheet's hurt cell 18 (204 of 300) using cell 1, the impact.
  hurt: { key: 'hzdHurt', cells: 4, k: HERO_DELIVERY_K, t: p => p.hurtPoseT, t0: () => 0.3 },
  // THE MEND (2026-09-16). Five drawn cells: she stands, brings both hands to
  // the core light, bows her head, straightens as it takes.
  //
  // healT is the one timer here that counts UP â€” 0 to 0.85, because it is
  // charging something rather than running out. The table's progress is
  // 1 - t/t0, so the count is inverted at the accessor rather than by teaching
  // every other entry about a direction it does not have. The last instant
  // (t exactly 0) falls through to the pose cell, which is correct: healT is
  // reset the same frame the heal lands.
  // k 0.8217 against the sheet's heal cell 19 (208 of 300) using cell 0.
  heal: { key: 'hzdHeal', cells: 5, k: HERO_DELIVERY_K, t: p => 0.85 - p.healT, t0: () => 0.85 },
  // THE GUARD (owner sheet, 2026-09-15: BLOCK/GUARD row). A held brace, not a
  // clip â€” one fired still, same treatment as the charge pose, indexed as a
  // one-cell strip so it goes through the same t/t0 machinery as everything
  // else in this table rather than a special case. t0 is a constant so the
  // "progress" fraction is always 0 and cell 0 (the only cell) always draws,
  // for as long as guardT is held >0 by the input in Player.update.
  guard: { key: 'hzdGuard', cells: 1, k: HERO_DELIVERY_K, t: p => p.guardT, t0: () => 1 },
  //
  // WAITING ON ART (docs/ART_QUEUE.md Â§2x), in census order:
  //   land   fall>land>idle|run, the impact â€” 8/min and the most conspicuous
  //          when missing, because a drop that ends with no compression is the
  //          single clearest "this body has no weight" tell
  //   skid   the run-turnaround â€” plant, lean against the momentum, whip round
};
// How much of an incoming blow the brace cuts. A first pass, not a tuned
// final number â€” see the note in Player.hurt().
// what a dizzy body cannot do (Player.update, playerDizzy in js/gravehorn.js)
const DIZZY_BLOCK = { JUMP: 1, ATK: 1, DASH: 1, CLAW: 1, CAST: 1, SONG: 1, HEAL: 1, ARM: 1, GUARD: 1 };
const GUARD_REDUCTION = 0.65;          // a blow from behind the brace, or the one that breaks it
const GUARD_HEAT_PER_HIT = 0.8;        // heat per held blow; cools 1/s (Player.update)
const GUARD_BREAK_HEAT = 2.2;          // the third held blow inside ~2 s breaks the brace
const GUARD_BREAK_T = 0.6;             // ...and it stays down this long
// THE JUMP IS AN ARC, NOT A CLOCK, so it is indexed differently: rise, apex and
// fall are three stills of ONE continuous movement, and the thing that says
// where in it she is, is her own vertical speed. Cell 0 is the takeoff stretch,
// the middle cells are the hang, the last are the reach for the ground â€” which
// makes the arc read as one move at any jump height, including the clipped ones
// a variable-height jump produces. 53 pose changes a minute collapse into it.
// Three plates â€” takeoff stretch, apex tuck, the reach for the ground â€” fired
// as stills (2026-09-02) after eleven video takes either started the jump in
// the last half-second or never left the ground. k against the sheet's apex.
// THE PUSH, which the air arc never covered. HERO_AIR_STRIP begins after her
// feet have left; the coil and the launch stretch happen before that and were
// drawn procedurally â€” a squash-and-stretch on the plate, in drawRoboPlate.
//
// It rides `takeoffT`, a countdown that has existed since long before the art
// did and was described in the source as "jump coil + launch stretch": exactly
// this. Nothing new is timed; the drawing catches up with the clock.
//
// The procedural squash needs no suppressing. Player.draw returns the moment
// drawRoboTrans draws anything, so the plate stage â€” and the stretch inside it â€”
// never runs on a frame this strip owns.
// k 0.9121 against the sheet's rise cell 5 (236 of 300) using the strip's cell
// 3, the launch stretch, which is the pose that cell holds.
let HERO_TAKEOFF = { key: 'transTakeoff', cells: 4, k: HERO_DELIVERY_K };
// DRAWN (2026-09-15) and now EIGHT cells, not three: the rise sheet's four
// frames are 0-3 and the fall sheet's four are 4-7, which is exactly the shape
// this lookup already wanted â€” it indexes by her own vertical speed from full
// climb to full drop, so a concatenated rise-then-fall IS the arc it samples.
// k 0.8341 against the sheet's apex cell 6 (208 of 300) using cell 2.
let HERO_AIR_STRIP = { key: 'transAir', cells: 8, k: HERO_DELIVERY_K, up: 770, down: 700 };
// THE DEATH SEQUENCE (owner brief, 2026-09-14: "dying... is something you
// have been failing at"). He was right in a specific way: draw() returned
// on the very first line whenever this.dead was true, so from the moment
// she died the only thing onscreen was die()'s particle burst fading out â€”
// no body, authored or procedural, ever drew again. The one state in her
// whole roster that shipped with zero art.
// Three fired stills, same treatment as HERO_AIR_STRIP's jump arc: a
// stagger (the hit that kills her), a buckle, and down. Indexed by
// G.deadT â€” the timer G.onPlayerDeath() itself owns and counts to zero
// before respawn() fires â€” rather than a clock this class would have to
// invent and keep in step with it. `hold` is how much of deadT's own
// 1.8 s the three-frame slide spends moving; the remainder holds on the
// last cell so she is not still visibly settling the instant she respawns.
// DRAWN (2026-09-15): six cells â€” struck, reeling with the eye spiralling,
// down to her knees, forward onto the ground, still, and the eye-lights dimming
// out. k 0.8705 against the sheet's slump (253 of 300) using cell 0.
let HERO_DEATH_STRIP = { key: 'hzdDeath', cells: 6, k: HERO_DELIVERY_K, total: 1.8, hold: 1.2 };
// THE MEND'S LIGHT â€” an EFFECT strip, not a pose strip, so it carries none of
// the k/floor machinery above. Nothing here is anchored to her feet or measured
// against the reference sheet's subject height, because the thing being drawn is
// light rather than a body: it is square, centred on her chest, sized in world
// units and added rather than composited. Five plates assembled by
// tools/fxstrip.cjs, which anchors on the light's centroid and keeps each
// plate's real size, because the growth IS the animation.
// alpha 0.85 rather than 1: the plates were drawn on black, so at full strength
// the core blows out to white against a lit room and eats her chest.
let HERO_HEAL_FX = { key: 'hzdHealFx', cells: 5, size: 58, alpha: 0.85 };
// THE SUPERCHARGE'S ENERGY â€” 19 cells over a 12-cell body strip, and the
// mismatch is deliberate rather than tolerated: both are sampled by the swing's
// own normalised progress, so the energy keeps its own cadence (a long crackling
// build, a one-frame compression, then three frames of release) across the same
// window the body moves in. Tying an effect's cell count to the body's would
// have meant throwing away two thirds of what was drawn.
//
// The sheet could not be cut by gutters at all â€” its release arcs are drawn
// overlapping each other's columns, so every projection method read four of them
// as one frame 726px wide. tools/sheetslice.cjs --cc finds them as SHAPES
// instead. The three tail fragments it also finds are dropped: a 2px speck
// between two wisps is not a frame, and playing it blinks the effect out.
//
// `dx` puts it ahead of her claw rather than on her chest, where the heal sits.
// Forward is +x here: drawRoboSwing runs inside drawRoboPlate's transform and
// facing is applied further out, which is why the body cell passes flip=false.
let HERO_BURST_FX = {
  key: 'swingBurstFx', cells: 19,
  // TWO RANGES, TWO CLOCKS, because the sheet is drawn as two things. Fourteen
  // cells of crackle that grows, then five of strike: a compression, a crescent,
  // two arcs and the break-up. Playing all nineteen over the swing put the whole
  // build inside a window that is already white with the procedural flash â€” the
  // art was on screen and could not be seen. The build belongs to chargeT, which
  // is the timer that IS the build.
  charge:  { from: 0,  to: 13 },   // chargeT / CHARGE_READY, holds on 13
  release: { from: 14, to: 18 },   // the swing's own progress
  // two sets of placement numbers for the two spaces â€” `size/dx/dy` are the
  // strip cell's, `wsize/wdx/wdy` are world pixels off her own box
  size: 92, dx: 15, dy: -7,
  wsize: 46, wdx: 11, wdy: -3,
  alpha: 0.9,
};
// where chargeT is considered charged â€” the same 0.6 the update loop uses
const CHARGE_READY = 0.6;
// THE IMPATIENT WAIT (owner, 2026-08-27: "like a cute kid waiting anxiously
// for something from a grown-up... cross their hands, tapping one leg on the
// floor, and saying Yalla!"). Not a transition and not a pose: a LOOP that
// takes over the idle after she has stood untouched for a while â€” the Sonic
// foot-tap, hers. Null until the fired strip is cut and keyed; the procedural
// idle (ear twitches, look-arounds, weight shifts) remains the floor.
// k 0.78: the fidget figure fills 89% of its cell against the idle cell's 69%,
// and drawing both at HERO_DH would grow her the moment she got impatient.
// intro 7: cells 0-6 are the arms crossing â€” played once â€” and 7-15 are the
// bounce-and-tap she holds for as long as she is ignored.
// DRAWN (2026-09-15): eight front-on cells, her visor doing the acting while her
// feet stay planted. intro drops to 0 â€” the filmed take had a six-cell run-in
// before its loop, and a drawn cycle has no run-in to skip. fps 6.5 matches the
// idle it takes over from, so the handover does not change tempo.
// k 0.8895 against the sheet's idle (231 of 300) on cell 0 (277 of 320).
let HERO_FIDGET = { key: 'heroFidget', cells: 8, k: HERO_DELIVERY_K, fps: 6.5, intro: 0 };
// Cling, slip, catch â€” three stills at 5 fps, because every video take of a
// wall slide painted her a pole to hold. Authored with the wall at her RIGHT.
// DRAWN (2026-09-15): four cells of the cling â€” braced, slipping, catching,
// braced again. k 0.9065 against the sheet's wall_cling cell 11 (232 of 300).
let HERO_WALL_STRIP = { key: 'transWall', cells: 4, k: HERO_DELIVERY_K, fps: 5 };
const FIDGET_AFTER = 5;        // seconds of stillness before she runs out of patience
// IS THE PLAYER BUSY WITH SOMETHING THAT IS NOT MOVING HER? Reading, being
// taught, being given something, standing with someone. Every one of these
// leaves her body still for longer than FIDGET_AFTER through no impatience of
// the player's, and an impatient "yalla" over the top of it is the game
// heckling him for reading its own text.
//   - a person or a thing in reach (G.near): she is WITH it, not waiting
//   - words on screen: a toast, a lesson chip, the opening's guide prompt
//   - a ceremony: a meeting, a rest, an offer, a finisher, a break, a transition
//   - the repair bench and the wrist-release it ends in
function heroOccupied() {
  if (typeof G === 'undefined' || !G) return false;
  if (G.near || G.meet || G.recharge || G.offer || G.finish || G.break || G.trans || G.lesson || G.ghCard) return true;
  if (G.toasts && G.toasts.length) return true;
  if (G.zoneToast) return true;
  // the opening's one-control-at-a-time guide is a thing being read
  if (G.tut && !(G.save && G.save.flags && G.save.flags.tut)) return true;
  if (typeof repairSession !== 'undefined' && repairSession) return true;
  if (typeof ratchetReleaseSession !== 'undefined' && ratchetReleaseSession) return true;
  if (typeof TRI !== 'undefined' && TRI && TRI.node) return true;
  return false;
}
// SHE STANDS STILL, AND ACTS ONE THING AT A TIME (owner, 2026-09-27: "the
// idle makes the character move very fast, impatiently glitching all around,
// instead of smoothly â€” like Sonic left idle: he taps his foot on the ground").
// The idle and fidget strips are not in-betweens of one motion; each cell is a
// different expression (blink, smile, glance, the '!' twitch, a foot tap with
// dust). Cycled at 6.5 fps her whole face changed six times a second. Now each
// strip is a SCRIPT of held beats: a calm pose held for seconds, one gesture,
// back to calm. Every supplied cell still appears. Past FIDGET_AFTER the
// impatience comes in bouts â€” the foot-tap rhythm on the two dust cells, a
// twitch, a glance â€” with the calm idle resting between them.
// [cell, seconds held]
const HERO_IDLE_BEATS = [[0, 2.2], [3, 0.14], [0, 1.6], [4, 1.0], [7, 0.45], [0, 1.3], [1, 0.9],
  [0, 1.7], [3, 0.12], [2, 0.25], [3, 0.12], [0, 1.1], [5, 0.5], [6, 0.9], [0, 0.7]];
const HERO_FIDGET_BEATS = [[5, 0.7], [7, 0.35], [3, 0.2], [7, 0.32], [3, 0.2], [7, 0.32], [3, 0.2],
  [7, 0.45], [4, 0.55], [0, 0.3], [6, 0.22], [1, 0.5], [2, 0.3]];
const beatsLength = b => b.reduce((n, x) => n + x[1], 0);
const FIDGET_BOUT = beatsLength(HERO_FIDGET_BEATS), IDLE_REST = 6.5;
// SHE CROSSES HER ARMS AND TAPS HER FOOT (owner, 2026-11-14: "look for how Sonic
// used to stamp with his feet and cross his hand when he's idle and waiting, and
// give the character the same move when it says yalla"). The fidget strip cannot
// do it â€” its eight cells are front-on with her arms at her sides â€” so this is
// its own strip (ART_QUEUE 1-imp): 0 settle into the cross, 1/3/5 toe up,
// 2/4/6 toe down (6 with a glance at the player), 7 the hold with an ear flick.
// The bout that opens at FIDGET_AFTER â€” the one "yalla" is said over â€” plays it,
// and so does every second bout after; the old fidget keeps the bouts between,
// so the face she already had is not retired by the one she gained.
// A tap is 0.28 s, three and a half a second: the body in cells 1-6 is one
// drawing and only the foot moves, so this is the one script in the idle that is
// allowed a rhythm (the 2026-09-27 ruling was against her whole FACE changing
// six times a second, not against a foot).
// INERT UNTIL THE SHEET EXISTS: with no `heroImpatient` in the manifest nothing
// here is reachable and every bout is the fidget, exactly as before.
// NOT mirrored-cancelled like the fidget: this is a three-quarter view facing
// RIGHT, so it turns with her.
let HERO_IMPATIENT = { key: 'heroImpatient', cells: 8, k: HERO_DELIVERY_K };
const HERO_TAP = 0.14;
const HERO_IMPATIENT_BEATS = (() => {
  const T = HERO_TAP, b = [[0, 0.4],
    [1, T], [2, T], [3, T], [4, T], [5, T], [2, T],
    [1, T], [2, T], [3, T], [4, T], [5, T], [6, 0.6],     // ...and a look at whoever is keeping her
    [1, T], [2, T], [3, T], [4, T], [7, 0.4]];
  // it fills the fidget's own bout, so the rest between bouts starts where it always did
  b.push([2, Math.max(0.2, FIDGET_BOUT - beatsLength(b))]);
  return b;
})();
function heroImpatientReady() {
  const P = HERO_IMPATIENT, im = P && typeof MEDIA_RAW !== 'undefined' && MEDIA_RAW[P.key];
  if (im && im.complete && im.naturalWidth) return true;
  if (P && typeof mediaFetch === 'function') mediaFetch(P.key, true);   // a no-op for a key the manifest does not carry
  return false;
}
function beatCell(beats, t) {
  let k = ((t % beatsLength(beats)) + beatsLength(beats)) % beatsLength(beats);
  for (const [cell, d] of beats) { if (k < d) return cell; k -= d; }
  return beats[beats.length - 1][0];
}
// the first moment a script shows a cell (harnesses drive frames by time)
function beatTime(beats, cell) {
  let t = 0;
  for (const [c0, d] of beats) { if (c0 === cell) return t + d / 2; t += d; }
  return -1;
}
// the first idleT at which the combined schedule shows `cell` of one strip
function heroIdleTimeFor(cell, fidget, imp) {
  for (let t = 0; t < 120; t += 0.01) {
    const q = heroIdleClip(t);
    if (q.fidget === !!fidget && !!q.imp === !!imp && q.cell === cell) return t + 0.005;
  }
  return -1;
}
// What a still body is doing at idleT: {fidget, cell}. Before FIDGET_AFTER it
// is the idle script; after it, fidget bouts of FIDGET_BOUT with IDLE_REST of
// the idle script (continuing where it left off) between them.
function heroIdleClip(t) {
  if (t <= FIDGET_AFTER) return { fidget: false, cell: beatCell(HERO_IDLE_BEATS, t) };
  const u = t - FIDGET_AFTER, P = FIDGET_BOUT + IDLE_REST, n = Math.floor(u / P), k = u - n * P;
  if (k < FIDGET_BOUT) {
    // bouts 0, 2, 4â€¦ are the crossed arms and the tapping foot, once that strip exists
    if (n % 2 === 0 && heroImpatientReady()) return { fidget: true, imp: true, cell: beatCell(HERO_IMPATIENT_BEATS, k) };
    return { fidget: true, cell: beatCell(HERO_FIDGET_BEATS, k) };
  }
  return { fidget: false, cell: beatCell(HERO_IDLE_BEATS, FIDGET_AFTER + n * IDLE_REST + (k - FIDGET_BOUT)) };
}
// THE CELL COUNT IS HOW MANY DIFFERENT PICTURES THE TAKE ACTUALLY HOLDS.
//
// Two owner reports, and the second corrected the first. "Use the films to
// actually improve the actual ingame move by maximizing frames for each move" â€”
// so the strips were re-cut at the source frame rate, six cells becoming
// thirteen. Then: "the images that Higgsfield is generating does not always
// create the correct sequence of the movements... a big percentage of what is
// inside is replicated images."
//
// He was right, and tools/framedupe.cjs put a number on it: across the shipped
// strips, THIRTY-EIGHT cells were the same drawing as the cell before them â€”
// 19 of patch's 24 and 12 of mono's. More cells was the wrong instrument. A
// generated take is not a metronome: the model holds a pose, moves fast, holds
// again, so sampling on a CLOCK spends cells inside the holds and skips the
// part where the body moves.
//
// The frames are chosen by CONTENT now (tools/vidstrip.cjs `auto:N`): walk the
// window finely and keep a frame only when it differs from the last one KEPT.
// N is a CEILING, not a count â€” a take with fewer distinct pictures yields a
// shorter strip, which is both the better animation and the honest report on
// what the take contains. Dead cells across every strip in the game: 38 -> 1.
//
// The reference cell each k is measured against moves with every recount, so
// tools/swingk.cjs is re-run and its DEF re-pointed whenever a strip is re-cut.
//   claw_1   sheet 140/169  strip 257/320 (11 cells, ref 0 â€” the guard)
//   claw_2   sheet 140/169  strip 310/320 (11 cells, ref 3 â€” the arm extended)
//   finisher sheet 131/169  strip 256/320 ( 9 cells, ref 0 â€” both arms up)
//   burst    sheet 132/169  strip 247/320 ( 9 cells, ref 6 â€” arms flung wide)
// THE HIT STRING FACES WHERE SHE HITS (Â§2aw, 2026-09-05). The claw strips
// were fired looking at the camera â€” the owner: "all of them looking at me
// instead of turning to enemy and hit" â€” and tests/hero.cjs measures it (eye
// gap over height 0.113â€“0.139 against the walk's widest 0.099). The three
// punches were fired from her own plates in the house three-quarter facing
// screen-right, so they drive the string now: jab, hook, uppercut for the
// first, second and third hit. The claw strips stay on disk, unwired. The
// jab is a 0.3 s snap held for the rest of its take, so its six cells are
// the snap alone and the strip plays BACK for the return (pingpong). k per
// strip against the sheet's guard (claw_1, 261 of 300): jab's guard stands
// 291, hook's 270, uppercut's 270.
//
// ...AND THEN MEASURED, AND PUT BACK (2026-09-05, an hour later). Wired, the
// punches failed the OTHER law â€” tests/frames.cjs, the owner's earlier and
// more specific ruling: "it should transition in milliseconds from one frame
// to another... three kind of hits with three moves that changes from still
// to hit without transitions in between." The hook is two guard cells, six
// near-identical extended cells (0.3% silhouette change between them) and
// two guard cells: a pose held for the whole blow, in profile. The jab's six
// cells hold two dead duplicates. The claw strips are the wrong facing with
// a real motion; the punches are the right facing with none. A motion the
// player reads as the blow beats a facing the player reads as a still, so
// the claws drive the string until a take has both â€” the brief in
// ART_QUEUE Â§2aw says exactly what that take needs. The punch strips stay on
// disk, unwired; the facing law stays red on the claws.
//
// THE CROSS AND THE UPPERCUT, REFIRED (art session, 2026-09-05 22:40) and
// measured again: the cross moves 8â€“39% of its silhouette between every cell
// and the uppercut 3â€“35%, so both pass the blow-is-a-move law now, and both
// were fired in the three-quarter facing the target. They take the second
// and third hits. The jab was not refired (two dead cells in six) so the
// first hit stays on the claw strip: she opens toward the lens and turns
// into the target for the cross and the uppercut, which reads as turning to
// it. k against the sheet's guard (261 of 300): cross 283 -> 0.92, uppercut
// 273 -> 0.956.
const SWING_STRIP = {
  air:{key:'swingAir',cells:6,k:HERO_DELIVERY_K},
  down:{key:'swingDown',cells:6,k:HERO_DELIVERY_K,order:[0,1,2,3]},
  // Poster order: short jab, two sweeping scratches, rising uppercut.
  claw_1: {key:'swingClawJab',cells:5,k:HERO_DELIVERY_K},
  claw_2: {key:'swingClaw1',cells:6,k:HERO_DELIVERY_K},
  finisher: { key: 'swingUppercut', cells: 6,  k: HERO_DELIVERY_K },
  // 2026-09-08: complete side-facing charged claw action with recovery.
  // Neutral frame matches idle: (231/300)/(281/320) = 0.8769.
  // DRAWN (2026-09-15), and this is the one the owner rejected the filmed version
  // of. Twelve cells: ready, sink, brace, hold, release, extend, follow through.
  // Its frames TOUCH end to end in the delivered sheet, so sheetslice was given
  // the count (--frames 12) rather than inferring it from runs that do not exist.
  //
  // k 0.9503, and the reference is not a pose match because it cannot be: the
  // sheet's burst cell is the OLD design's release with both arms flung wide
  // (aspect 1.00) and the drawn release simply is not that shape (0.81 at its
  // widest). So the reference is the strip's own release cell and the check is
  // external â€” it lands on the same 0.9503 the walk measured independently,
  // which is what agreement between two unrelated measurements is worth.
  // fx is the energy strip that plays over this attack; only the burst has one
  // fired so far, and an attack without one simply draws its body. The table
  // holds the OBJECT, which is safe only because HERO_BURST_FX is declared
  // above this one â€” top-level let does not hoist its value, so a strip table
  // that pointed DOWN the file would read undefined here and never draw.
  burstLegacy: {key:'swingClawChargeAlt',cells:12,k:HERO_DELIVERY_K,order:[6,7,8,9,10,11],fx:HERO_BURST_FX},
  burst:    { key: 'swingClawCharge', cells: 12, k: HERO_DELIVERY_K, order:[6,7,8,9,10,11], fx: HERO_BURST_FX },
};
// Gameplay stores the ordinary combo as 0, 1, 2. Keep both the pose fallback
// and the strip renderer on that same numbering: treating it as 1, 2, 3
// repeated the jab and made the authored uppercut unreachable from input.
// Weapon bodies use the same attack clock and retain the unarmed fallback until loaded.
const HERO_SINGLE_FX = {key:'swingSingleFx',cells:6,release:{from:0,to:5},dx:42,dy:0,size:64,alpha:.68};
// [effect cell, x, y offset from torso centre, size] for each body pose.
const HERO_SINGLE_FX_POSES = [null,[0,30,-8,48],[1,0,-28,58],
  [2,45,4,60],[3,43,-4,58],[1,5,-25,54],[4,46,0,65],
  [3,45,12,58],[5,42,9,48],null];
const HERO_DUAL_FX={key:'swingDualFx',cells:8,release:{from:0,to:7},dx:35,dy:0,size:64,alpha:.7};
const HERO_DUAL_FX_POSES=[null,null,[1,38,-5,58],[2,38,2,58],[3,5,-5,70],[5,48,2,54],[6,38,8,48],null];
const HERO_SINGLE_NORMAL_FX_POSES=[null,null,[3,35,10,60],[2,10,-12,64],[1,10,-24,62],[4,40,2,68],[5,35,9,48],null];
SWING_STRIP.air.fx={...HERO_SINGLE_FX,release:{from:1,to:2},dx:22,dy:0,size:62};
SWING_STRIP.down.fx={...HERO_SINGLE_FX,release:{from:1,to:2},dx:0,dy:16,size:60,rotation:Math.PI/2};
const HERO_WEAPON_CHARGES={single:{key:'swingSingleCharge',cells:10,k:HERO_DELIVERY_K,order:[3,4,5,6,7,8,9],fx:HERO_SINGLE_FX,fxPoses:HERO_SINGLE_FX_POSES},dual:{key:'swingDualCharge',cells:10,k:HERO_DELIVERY_K,order:[3,4,5,6,7,8,9],fx:HERO_DUAL_FX,
  fxPoses:[null,[0,0,0,50],[3,0,0,64],[3,0,-5,74],[3,0,-5,78],[3,0,-5,82],[4,12,-5,80],[5,12,0,84],[7,15,5,60],null]}};
const HERO_JOINED_FX_POSES=[null,[3,0,-4,62],[2,34,10,62],[1,33,-12,65],[3,0,-34,65],[5,49,0,58],[6,40,5,50],null];
const HERO_WEAPON_SWINGS = {
  joined:[
    {key:'swingJoined',cells:8,k:HERO_DELIVERY_K*1.2,fx:HERO_DUAL_FX,fxPoses:HERO_JOINED_FX_POSES,order:[0,1,2,6,7]},
    {key:'swingJoined',cells:8,k:HERO_DELIVERY_K*1.2,fx:HERO_DUAL_FX,fxPoses:HERO_JOINED_FX_POSES,order:[0,2,3,6,7]},
    {key:'swingJoined',cells:8,k:HERO_DELIVERY_K*1.2,fx:HERO_DUAL_FX,fxPoses:HERO_JOINED_FX_POSES,order:[0,3,4,5,6,7]},
  ],
  dual:[
    {key:'swingDual',cells:8,k:HERO_DELIVERY_K,fx:HERO_DUAL_FX,fxPoses:HERO_DUAL_FX_POSES,order:[0,1,2,3,6,7]},
    {key:'swingDual',cells:8,k:HERO_DELIVERY_K,fx:HERO_DUAL_FX,fxPoses:HERO_DUAL_FX_POSES,order:[0,3,2,5,6,7]},
    {key:'swingDual',cells:8,k:HERO_DELIVERY_K,fx:HERO_DUAL_FX,fxPoses:HERO_DUAL_FX_POSES,order:[0,1,4,5,6,7]},
  ],
  single: [
    {key:'swingSingle',cells:8,k:HERO_DELIVERY_K,fx:HERO_SINGLE_FX,fxPoses:HERO_SINGLE_NORMAL_FX_POSES,order:[0,1,2,6,7]},
    {key:'swingSingle',cells:8,k:HERO_DELIVERY_K,fx:HERO_SINGLE_FX,fxPoses:HERO_SINGLE_NORMAL_FX_POSES,order:[0,2,3,5,6,7]},
    {key:'swingSingle',cells:8,k:HERO_DELIVERY_K,fx:HERO_SINGLE_FX,fxPoses:HERO_SINGLE_NORMAL_FX_POSES,order:[0,1,3,4,5,6,7]},
  ],
};
function heroWeaponSwing(sv) {
  if (!sv) return null;
  if (sv.charged) return HERO_WEAPON_CHARGES[sv.weaponMode] || null;
  if (sv.air) return null;
  const strips=HERO_WEAPON_SWINGS[sv.weaponMode];
  return strips && strips[Math.max(0,Math.min(2,sv.combo|0))];
}
function warmHeroWeaponArt(mode) {
  if(typeof mediaFetch!=='function')return;
  const strips=mode==='claws'?Object.values(SWING_STRIP):
    [...(HERO_WEAPON_SWINGS[mode]||[]),HERO_WEAPON_CHARGES[mode]].filter(Boolean);
  const keys=new Set();for(const s of strips){keys.add(s.key);if(s.fx)keys.add(s.fx.key);}
  if(mode==='claws')keys.add('swingSingleFx');
  if(mode==='joined'){keys.add('heroJoinedThrow');keys.add('heroJoinedProjectile');}
  for(const key of keys)mediaFetch(key,1);
}
function heroSwingState(swing) {
  if (swing.charged) return 'burst';
  const ground = swing.combo === 2 ? 'finisher'
    : swing.combo === 1 ? 'claw_2' : 'claw_1';
  // AN ATTACK IN THE AIR IS A DIFFERENT MOVE, and until now the renderer could
  // not tell that it was one: swingVis carried the angle but never whether her
  // feet were on the ground, so a plunge onto an enemy's head drew the standing
  // jab. The mechanics have always distinguished them â€” swing.ay > 0 while
  // airborne IS the pogo, and the `plunge` skill hangs a shockwave off exactly
  // that â€” so this is the drawing catching up with the game.
  //
  // THE FALLBACK IS THE POINT. Routing to a strip that has not been fired would
  // return a name SWING_STRIP has no entry for, drawRoboSwing would return
  // false, and an animated combo swing would be replaced by ONE HELD POSE.
  // That is worse than showing the wrong animation, so the new states are only
  // selected once their sheets actually exist. The day air.webp lands, adding
  // its entry is the whole change; nothing here needs touching.
  if (swing.air) {
    const want = swing.ay > 0 ? 'down' : 'air';
    if (SWING_STRIP[want] && SWING_STRIP[want].cells) return want;
  }
  return ground;
}
// ---- HOW FAR ONE STEP CARRIES HER, OFF THE PLATES THEMSELVES ---------------
//
// The step length is the foot-to-foot distance at CONTACT: when the trailing
// sole leaves the floor it lands where the leading one is, so the body travels
// exactly that far per step. Measured on the sheet, in the ankle band (the
// bottom 8%) of each cell, sole to sole across both feet â€” the painted
// contacts, 2026-09-03: walk_a spans 137 cell-pixels and walk_c 112 â€” call it
// 125 â€” and the plate is drawn HERO_DH tall out of a 300px cell, so
//   125 * (60 / 300) = 24.9 world units.
// walk_b's feet are together, which is the passing pose, and is the check that
// the other two are really contacts. (The 3D plates before them measured 66px
// sole to sole in a 169px cell: 23.4 â€” the painted stride is the same step.)
//
// THE RUN NUMBER IS NOT MEASURED AND SAYS SO. run_a and run_b span 20 and 18
// cell-pixels â€” neither is a contact pose, so the sheet cannot answer it, and
// the one run cell that does show a contact (run_c) is off-model (see
// heroState). So the run uses the walk's measured step scaled by 1.6, the
// ordinary walk-to-run stride ratio. When an on-model run contact is fired,
// measure it the same way and delete this paragraph.
const HERO_STEP_WALK = 29.3, HERO_STEP_RUN = 38;
// One place, because the pose cycle, the stride phase and the foot-plant lock
// must all agree about how long a step is â€” three copies of 23 is three
// chances for a future edit to desynchronise the legs from the floor.
// WHERE A WALK BECOMES A RUN. 120 was most of the way to useless: `speed()` is
// 340, so anything past a third of the stick was already a "run" and the walk
// cells drew almost never â€” measured, a light push on the phone stick lands at
// 186 px/s and was picking run poses. The analogue stick's reachable band is
// 116 (its dead-zone floor) to 340, so the split goes at 210: a light push is a
// walk, a committed push is a run, and the keyboard â€” which has no analogue and
// always asks for everything â€” stays a run, as it should.
const HERO_RUN_VX = 210;
// WHAT A PAD'S STICK ASKS FOR WITHOUT THE CLICK. Under the walk/run split, so
// the walk cells draw; over the touch stick's dead-zone floor (116), so a pad
// walk is not slower than a light thumb. The click (RUN, L3 by default) lifts
// the cap to speed() for as long as the stick stays pushed.
const PAD_WALK_VX = 185;
// BEATS PER SECOND, BY GAIT â€” a beat is one cell change, half a step. A human
// walk is about two steps a second (four beats), a run three to three and a
// half (six to seven); these are the soft ceilings the stride phase saturates
// toward, not the rates it runs at. See the cadence paragraph in Player.update.
const HERO_CADENCE = { walk: 5, run: 7 };
// THE CYCLES, WHEN THEY ARE FIRED. Her walk is three stills and her run two,
// and the owner read the sheet correctly: "these are multiple moves instead of
// a single one like walking and running." A gait is ONE move drawn as a loop â€”
// contact, recoil, passing, high point, on both legs â€” and the slot for that
// loop is here, indexed by the stride phase so the feet still agree with the
// floor. Zero cells means not fired: the pose cells draw, as they do now.
// The brief is docs/ART_QUEUE.md Â§2au; cut with tools/vidstrip.cjs auto:N and
// measure k with tools/swingk.cjs against walk_a / run_a.
// THE RUN IS FIRED AND CUT (Â§2aw, 2026-09-05): sixteen cells of which the
// first NINE are one stride â€” measured, not read off the ledger: the cells'
// silhouettes repeat at a lag of nine (IoU 0.935 against ~0.7 at every other
// lag) and the ankle spread peaks at cells 4 and 13. So the loop runs cells
// 0â€“8 and the rest of the strip is the same stride again. k 0.92: run_a on
// the sheet stands 269 px in a 300 cell, the strip's contact cell 291.
//
// THE WALK IS FIRED AND NOT USABLE AS CUT: its sixteen cells are one slow
// drift (IoU falls monotonically 0.97 -> 0.81 across the strip, the ankle
// spread shrinks 182 -> 166 with no return) â€” the auto cut filled its sixteen
// inside the first moments of a five-second take, before a stride happened.
// Zero cells here until it is re-cut evenly across ONE stride (ART_QUEUE
// Â§2aw); the three walk plates keep drawing meanwhile.
// ...AND RE-CUT (art session, 2026-09-05 21:50): sixteen cells sampled evenly
// over one measured stride (1.75â€“3.08 s of the take, left contact to left
// contact). Measured here before wiring: silhouette IoU falls to its minimum
// at lag 7â€“8 (the opposite contact) and climbs back to 0.89 at lag 15 â€” one
// cycle across the strip, 3â€“10% of silhouette moving between every cell.
// ...AND REPLACED BY DRAWN KEYFRAMES (2026-09-15). Both re-cuts above were
// windowing a FILM, and the whole difficulty â€” finding the stride inside a take,
// the auto cut spending cells in the holds â€” is a difficulty of that route, not
// of the animation. The walk now comes in as eight authored frames of one cycle:
// tools/sheetslice.cjs measures them at 335px tall with a 1% spread and a foot
// line that holds to within a pixel across all eight, which is the property
// every cut of the film failed to have. Eight cells, no from/to window, because
// a drawn cycle IS the cycle and has no surplus to trim.
let HERO_GAIT = {
  walk: { key: 'gaitWalk', cells: 8, k: HERO_DELIVERY_K },
  run:  { key: 'gaitRun',  cells: 16, k: HERO_DELIVERY_K, from: 0, to: 15 },
};
// THE STANDING LOOP: breath, a weight shift, one blink â€” a front view like
// the fidget, so it cancels the body mirror the same way. Eleven cells at
// nine a second is the take's own pace; after FIDGET_AFTER the fidget owns
// the idle as before. k 0.79: idle on the sheet stands 231 of 300, the loop 291.
// Re-authored 2026-09-15 as eight drawn frames (2% height spread, foot line
// dead constant). fps drops 9 -> 6.5 to hold the BREATH at the length it had:
// the loop is what reads as calm, not the frame rate, and 11/9 s of breath
// played over 8 cells at 9 fps would pant.
let HERO_IDLE = { key: 'hzdIdle', cells: 8, k: HERO_DELIVERY_K, fps: 6.5 };
function heroStepLen(vx) { return Math.abs(vx) > HERO_RUN_VX ? HERO_STEP_RUN : HERO_STEP_WALK; }
// Airborne cells are CENTRED in their cell rather than stood on its floor (the
// tool does this, because a flying pose has no contact point to align). They
// must be drawn centred too, or she steps up a few pixels the frame she leaves
// the ground.
const HERO_AIR = {
  // run_b LEFT THE AIR LIST. The old second run cell was a LEAP â€” feet off
  // the ground â€” so it was centred in its cell like every other airborne pose.
  // The re-fired pair is contact and passing, two grounded steps of one stride,
  // and a grounded cell stands on the cell's floor line. Left in the air list
  // it would float half a body above the floor on every other frame.
  rise: 1, apex: 1, fall: 1, dash: 1, wall_cling: 1, djump_jet: 1, hurt: 1,
};

// ---- THE EYES ARE THE ONLY PART OF HER THAT ACTS ---------------------------
//
// She has no mouth, no brows and a ceramic face that cannot move. Everything
// she feels has to come out of two lights, which is a constraint and not a
// shortage â€” the portrait bust in game.js has always worked this way, and its
// comment calls the visor "the LED strip that does the acting". This is that,
// on her body, at gameplay size.
//
// THE PLATES CANNOT DO IT. Her eyes are baked into all 22 of them, so authored
// alone she wears one expression per pose forever: the same face landing a jump
// as taking a hit. So the eye-lights are REPAINTED live over the plate â€” the
// baked pair is covered with the visor's own dark, and a new pair is drawn in
// whatever shape the moment calls for.
//
// WHERE they are per pose is measured, not guessed: tools/heroeyes.cjs finds
// the cyan pair in each cell and writes this table. Three poses defeat it (her
// eyes are dim, tipped away, or drowned by a brighter cyan elsewhere) and are
// set by hand there, said out loud, and checked on its --mark image.
// generated by tools/heroeyes.cjs from hzd_states_front.png
const HERO_EYE = {
  idle:        { lx: 0.592, ly: 0.561, rx: 0.653, ry: 0.565, ew: 0.020, eh: 0.055 },
  walk_a:      { lx: 0.577, ly: 0.511, rx: 0.647, ry: 0.515, ew: 0.023, eh: 0.059 },
  walk_b:      { lx: 0.579, ly: 0.511, rx: 0.647, ry: 0.516, ew: 0.022, eh: 0.058 },
  run_a:       { lx: 0.586, ly: 0.557, rx: 0.653, ry: 0.561, ew: 0.022, eh: 0.056 },
  run_b:       { lx: 0.587, ly: 0.564, rx: 0.654, ry: 0.567, ew: 0.023, eh: 0.056 },
  rise:        { lx: 0.743, ly: 0.272, rx: 0.812, ry: 0.265, ew: 0.027, eh: 0.058 },
  apex:        { lx: 0.643, ly: 0.411, rx: 0.710, ry: 0.422, ew: 0.027, eh: 0.056 },
  fall:        { lx: 0.625, ly: 0.550, rx: 0.678, ry: 0.573, ew: 0.037, eh: 0.050 },
  land:        { lx: 0.684, ly: 0.653, rx: 0.739, ry: 0.660, ew: 0.025, eh: 0.056 },
  dash:        { lx: 0.884, ly: 0.463, rx: 0.926, ry: 0.472, ew: 0.025, eh: 0.050 },
  skid:        { lx: 0.507, ly: 0.537, rx: 0.568, ry: 0.541, ew: 0.022, eh: 0.058 },
  wall_cling:  { lx: 0.577, ly: 0.363, rx: 0.632, ry: 0.380, ew: 0.027, eh: 0.044 },   // BY HAND (detector scored 6.28)
  djump_jet:   { lx: 0.691, ly: 0.307, rx: 0.757, ry: 0.311, ew: 0.023, eh: 0.058 },
  claw_1:      { lx: 0.691, ly: 0.588, rx: 0.740, ry: 0.597, ew: 0.023, eh: 0.050 },
  claw_2:      { lx: 0.642, ly: 0.553, rx: 0.699, ry: 0.559, ew: 0.019, eh: 0.056 },
  finisher:    { lx: 0.685, ly: 0.495, rx: 0.750, ry: 0.499, ew: 0.022, eh: 0.058 },
  charge:      { lx: 0.661, ly: 0.623, rx: 0.720, ry: 0.631, ew: 0.027, eh: 0.053 },
  burst:       { lx: 0.579, ly: 0.564, rx: 0.644, ry: 0.571, ew: 0.023, eh: 0.058 },
  hurt:        { lx: 0.629, ly: 0.434, rx: 0.687, ry: 0.451, ew: 0.031, eh: 0.056 },
  heal:        { lx: 0.601, ly: 0.515, rx: 0.662, ry: 0.521, ew: 0.022, eh: 0.056 },
  song:        { lx: 0.592, ly: 0.517, rx: 0.654, ry: 0.518, ew: 0.020, eh: 0.056 },
  slump:       { lx: 0.637, ly: 0.697, rx: 0.707, ry: 0.720, ew: 0.047, eh: 0.041 },
  walk_c:      { lx: 0.581, ly: 0.513, rx: 0.649, ry: 0.517, ew: 0.023, eh: 0.058 },
  run_c:       { lx: 0.589, ly: 0.567, rx: 0.655, ry: 0.570, ew: 0.022, eh: 0.056 },
};

// THE MOODS. Same names as drawPortrait()'s expressions in game.js, on purpose:
// the face on her body and the face in the dialogue box must never disagree.
//
// SHE IS CUTE BY DEFAULT AND THAT IS THE RULE, not a starting value. `calm` is
// two big soft rounded lights with a slow blink, and everything else is a
// DEPARTURE from it that decays back. A character whose resting face is neutral
// reads as a machine; hers reads as a kid, and the fight is what makes it
// harden.
//
// Shape does the work, not colour. Red is the virus in this game and amber is
// the one reserved telegraph (ART_BIBLE Â§3.5), so her feelings are NOT allowed
// to reach for either â€” an angry cat with red eyes would read as infected. Her
// range is her own cyan-to-mint, and what changes is the SHAPE of the light:
//   squash    < 1 narrows the light to a slit, > 1 opens it round and wide
//   tilt      inner corners down = angry, outer corners down = sad. This one
//             trick carries most of the emotion in every cartoon ever drawn
//   glow      brightness, and its pulse
//   ar        aspect: > 1 wide and sleepy, < 1 tall and alert
//   asym      the FAR eye's size against the near one. Two identical lights are
//             a readout; one slightly smaller is a face with a thought behind
//             it, which is the whole of `curious`
//
// Every row was checked on tools/moodshot.cjs, and two were rewritten because
// of it: `sad` first differed from `calm` only in brightness (a droop the eye
// cannot see is not a droop) and `curious` was a second `excited`.
const HERO_MOOD = {
  //            squash tilt    glow  ar    pulse  asym
  calm:       { sq: 1.00, tl:  0.00, gl: 1.00, ar: 1.00, pu: 0.00, as: 1.00 },
  happy:      { sq: 0.55, tl: -0.30, gl: 1.15, ar: 1.35, pu: 0.00, as: 1.00 },  // shut upward â€” the ^^ smile
  excited:    { sq: 1.25, tl:  0.00, gl: 1.30, ar: 0.85, pu: 7.00, as: 1.00 },  // wide, bright, buzzing
  determined: { sq: 0.72, tl: -0.34, gl: 1.12, ar: 1.15, pu: 0.00, as: 1.00 },  // narrowed, inner down
  angry:      { sq: 0.50, tl: -0.62, gl: 1.30, ar: 1.30, pu: 3.20, as: 1.00 },  // hard slits, steep, burning
  sad:        { sq: 0.52, tl:  0.62, gl: 0.42, ar: 1.25, pu: 0.00, as: 1.00 },  // outer corners dragged down
  hurt:       { sq: 0.22, tl:  0.10, gl: 0.85, ar: 1.40, pu: 15.0, as: 1.00 },  // screwed shut, flickering
  curious:    { sq: 1.10, tl:  0.14, gl: 0.95, ar: 0.92, pu: 0.00, as: 0.62 },  // one eye small: a question
  weary:      { sq: 0.45, tl:  0.26, gl: 0.40, ar: 1.30, pu: 1.10, as: 1.00 },  // one core left: guttering
  // FACE ACTING (handoff Part 2 D4): the three moments the face used to sit
  // out. Effort is a squeeze with a strain flicker, one eye harder than the
  // other; relief is the exhale after a repair, soft and a little drooped;
  // fear is wide, lifted at the outer corners, trembling â€” at a guardian's roar.
  effort:     { sq: 0.60, tl: -0.22, gl: 1.20, ar: 1.22, pu: 9.00, as: 0.80 },  // the reel, the soar, the counter
  relief:     { sq: 0.70, tl:  0.24, gl: 1.05, ar: 1.15, pu: 0.00, as: 1.00 },  // just after a repair lands
  afraid:     { sq: 1.38, tl:  0.30, gl: 0.88, ar: 0.78, pu: 11.0, as: 1.00 },  // a guardian roars
};

// The CV3 marble is the reason GRAVEHORN is there, not a pickup behind him.
// Keeping this as a small pure gate makes the negative rule independently
// testable without pretending a source contract is rendered boss evidence.
function pillarRewardReady(s, save = G.save, room = G.roomId) {
  const item = s && (s.extra || 'cshard');
  return !(room === 'CV3' && item === 'cshard'
    && !(save && save.flags && save.flags.bossHorn));
}

// ================= PLAYER =================
class Player {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 24; this.h = 36;
    this.vx = 0; this.vy = 0; this.face = 1; this.faceVis = 1; this.on = false;
    this.cores = 5; this.volts = 33;
    this.coyote = 0; this.jbuf = 0; this.airJumps = 0;
    this.ccorr = true;   // moveEnt slides her around clipped ceiling corners
    this.stepUp = PLAYER_STEP_UP;   // ...and walks her up irregularity, not up the jump lesson
    this.dashT = 0; this.dashCD = 0; this.iT = 0; this.atkCD = 0; this.guardT = 0;
    this.swing = null; this.healT = 0; this.castCD = 0;
    this.dead = false; this.wallSlide = 0; this.trail = [];
    this.lastSafe = { x, y }; this.anim = 0; this.landT = 0;
    this.lean = 0; this.flipT = 0; this.jetT = 0; this.skidT = 0;
    this.combo = 0; this.comboT = 0; this.dashVX = 0; this.dashVY = 0; this.rechargeT = 0;
    this.chargeT = 0; this.chargeTick = 0; this.healTick = 0;
    this.mood = null; this.moodT = 0;      // a scripted feeling, and its clock
    // THE SWIRL and the window it leaves: while twinT runs the blade is in two
    // and her combo swings both. See swirl().
    this.swirlT = 0; this.swirlTick = 0; this.swirlHits = 0; this.swirlFroze = false; this.twinT = 0;
    this.clawT = 0; this.clawCD = 0; this.pounceT = 0;   // FERAL CLAWS (robo-cat)
    this.armCD = 0; this.songT = 0; this.songCD = 0; this.starCD = 0;
    this.downBuf = 0; this.pogoT = 0; this.slowT = 0;   // frost-slow from the Archivist
    // THE STUN. Nothing in the game took her controls away until the Wolf Pack
    // Alpha's roar, and taking them away is the most expensive thing a boss can
    // do to a player â€” so it is one field, read in exactly one place, and every
    // move that sets it has a wind-up long enough to leave the radius.
    this.stunT = 0;
    // scarf (4 segments) + tail (3 segments) spring chains â€” angles + velocities
    this.scarfA = [-0.4, -0.55, -0.7, -0.85]; this.scarfV = [0, 0, 0, 0];
    this.tailA = [0.9, 0.75, 0.6]; this.tailV = [0, 0, 0];
    // motion-depth state: anticipation / overshoot / settle + idle micro-life
    this.takeoffT = 0; this.takeoff0 = 0.16; this.takeoffCoil = 0; // jump coil + launch stretch
    this.land0 = 0.12;                                   // duration of the current landing bounce
    this.hurtPoseT = 0;                                  // limbs flail for a beat on knockback
    this.earL = 0; this.earV = 0;                        // ear-tip inertia (spring, px of trail)
    this.earTwitchT = 0; this.earTwitchSide = 1;         // idle ear twitch
    this.idleT = 0; this.lookX = 0; this.lookTgt = 0;    // look-around visor shift + weight shift
    this.dashTrailT = 0;                                 // afterimage spawn metronome
  }
  maxCores() { return G.save.coresMax + (hasCrest('plate') ? 1 : 0) + (relicHas('silent') ? 1 : 0); }
  speed() { return 340 * (hasCrest('sprint') ? 1.15 : 1) * (relicHas('shard') ? 1.04 : 1); }
  // weaponAtk is the tier she is HOLDING (js/weapons.js): the one multiplier
  // that makes an earned sword worth earning. Every other move reads dmg(), so
  // the combo, finisher, burst, hurricane and throw all inherit it from here.
  dmg() { return Math.round(12 * weaponAtk() * (hasCrest('claws') ? 1.25 : 1) * (G.save.flags && G.save.flags.resolve ? 1.18 : 1) * (1 + (relicHas('fang') ? 0.08 : 0) + (relicHas('whisker') ? 0.06 : 0)) * DF().pdmg); }
  // THE ONE PLACE A STRIKE'S DAMAGE IS COMPUTED: dmg() x the move's row
  // (ATTACKS) x the conditional factors the row takes (ATK_MOD). ctx carries
  // the swing's own state â€” { clawT, wield, pure, target, x, y } â€” and may be
  // omitted for moves that take no factor. The factor ORDER (row, feral,
  // wield; round; purity; crit) is the order the inline code used, so the
  // rounding is the same rounding and no number moved (tests/attacks.cjs).
  attackDmg(id, ctx) {
    const A = ATTACKS[id], c = ctx || {};
    if (A.flat) return A.flat;          // a fixed blow: no stat, no factor, no crit
    let dm = this.dmg() * (A.skill && hasSkill(A.skill[0]) ? A.skill[1] : A.mult);
    if (A.feral && c.clawT > 0) dm *= ATK_MOD.feral;
    if (A.wield && c.wield) dm *= ATK_MOD.wield[c.wield];
    dm = Math.max(A.floor, Math.round(dm));
    // PURITY: the crystal is a disinfectant before it is a weapon. With the
    // skill, a pure edge bites the Eye's own machines â€” guardians and the
    // corrupted â€” harder, and says so in white.
    if (A.purity && c.pure && hasSkill('purity') && c.target && (c.target instanceof Boss || c.target.miniboss)) {
      dm = Math.round(dm * ATK_MOD.purity);
      burst(c.x, c.y, 8, '#ffffff', 220, 0.3, -60, 2.4, true);
    }
    if (A.crit && relicHas('lens') && chance(ATK_MOD.critChance)) {
      dm *= ATK_MOD.crit;
      burst(c.x, c.y, 10, '#ffffff', 340, 0.4, 100, 4, true);
    }
    return dm;
  }
  voltMax() { return relicHas('collar') ? 110 : 99; }
  healCost() { return relicHas('coolant') ? 28 : 33; }
  gainVolts(n) { this.volts = clamp(this.volts + Math.round(n * (hasCrest('siphon') ? 1.5 : 1)) + (relicHas('silk') ? 2 : 0), 0, this.voltMax()); }
  update(dt) {
    if (this.dead) return;
    // ---- STUNNED: THE CONTROLS ARE GONE, AND THEY ARE GONE ALL AT ONCE ------
    // Gating each input site separately is how a stun ends up letting you dash
    // out of it because one branch was missed. `inD`/`inP` are top-level
    // functions in the concatenated build, so SHADOWING them for the length of
    // this method kills every read in it â€” walk, jump, attack, dash, cast, the
    // pad, the touch controller â€” from one line, which is also the only way
    // RULE ONE holds without four copies of the same check.
    const _stun = (this.stunT = Math.max(0, (this.stunT || 0) - dt)) > 0;
    // DIZZY (js/gravehorn.js playerDizzy): she can still WALK, slowly â€” and
    // nothing else. One rule, applied here once for every input device.
    const _dz = (this.dizzyT = Math.max(0, (this.dizzyT || 0) - dt)) > 0;
    this.flungT = Math.max(0, (this.flungT || 0) - dt);
    this.knockT = Math.max(0, (this.knockT || 0) - dt);       // a blow's throw, still carrying her (hurt())
    const inD = _stun ? () => false : _dz ? (a => !DIZZY_BLOCK[a] && IN_D(a)) : IN_D;
    const inP = _stun ? () => false : _dz ? (a => !DIZZY_BLOCK[a] && IN_P(a)) : IN_P;
    if (_stun && chance(0.5))
      addPart(this.x + this.w / 2 + rnd(-10, 10), this.y - 4,
        rnd(-30, 30), rnd(-50, -20), 0.4, '#ffe08a', 2, 60);
    // she TURNS, fast but with weight: the body flexes through the flip in
    // ~100ms and kicks a little dust â€” same law as every creature in the game
    {
      const pvs = Math.sign(this.faceVis || 1);
      this.faceVis += clamp(this.face - this.faceVis, -dt * 18, dt * 18);
      if ((Math.sign(this.faceVis) || 1) !== pvs && this.on)
        for (let i = 0; i < 3; i++)
          addPart(this.x + this.w / 2 + rnd(-6, 6), this.y + this.h - 2,
            rnd(-60, 60), rnd(-70, -20), 0.25, '#8fa3b5', 2, 400);
    }
    // scarf + tail follow-through: spring-damper chains (k=0.3, damping 0.8
    // per 60fps frame). Each segment chases the one before it, so the cloth
    // whips and settles instead of ticking like a metronome.
    {
      const f60 = clamp(dt * 60, 0, 3);
      const wind = clamp(this.vx * this.face, 0, 420) / 420;   // forward speed streams it back
      const fall = clamp(this.vy / 900, -1, 1);                // + falling lifts, âˆ’ rising drops
      for (let i = 0; i < 4; i++) {
        const rest = -0.34 - i * 0.14 + wind * (0.44 + i * 0.1) + fall * (0.5 + i * 0.14)
          + Math.sin(this.anim * (9 + i * 1.3) + i * 1.9) * (0.05 + wind * 0.16 + Math.abs(fall) * 0.08);
        const drive = i ? this.scarfA[i - 1] * 0.6 + rest * 0.4 : rest;
        this.scarfV[i] = (this.scarfV[i] + (drive - this.scarfA[i]) * 0.3 * f60) * Math.pow(0.8, f60);
        this.scarfA[i] = clamp(this.scarfA[i] + this.scarfV[i] * f60 * 0.6, -1.5, 1.4);
      }
      const runK = clamp(Math.abs(this.vx) / this.speed(), 0, 1);
      for (let i = 0; i < 3; i++) {
        const rest = 0.95 - i * 0.16 - wind * 0.5 + fall * 0.4
          + Math.sin(this.anim * 6 - i * 0.9) * (0.12 + runK * 0.1);
        const drive = i ? this.tailA[i - 1] * 0.55 + rest * 0.45 : rest;
        this.tailV[i] = (this.tailV[i] + (drive - this.tailA[i]) * 0.3 * f60) * Math.pow(0.8, f60);
        this.tailA[i] = clamp(this.tailA[i] + this.tailV[i] * f60 * 0.6, -0.4, 2.2);
      }
      // ear-tip inertia: the tall antenna ears trail the head â€” swept back at a
      // run, thrown forward when she brakes, lifted in a fall (same spring feel
      // as the scarf, one scalar: px of horizontal tip-lag in local space)
      const eTgt = -clamp(this.vx * this.face / this.speed(), -1, 1) * 3.4 - fall * 1.6;
      this.earV = (this.earV + (eTgt - this.earL) * 0.32 * f60) * Math.pow(0.76, f60);
      this.earL = clamp(this.earL + this.earV * f60 * 0.7, -5, 5);
      // idle micro-life: randomized ear twitches, tail flicks, look-arounds and
      // slow weight shifts â€” she never stands like a statue
      const idle = this.on && Math.abs(this.vx) < 30 && !this.swingVis && this.dashT <= 0
        && this.healT <= 0 && this.landT <= 0 && this.chargeT <= 0 && this.swirlT <= 0
        && G.state === 'PLAY' && !G.dialog && !G.cut && !G.gateWalk && !G.wake && !G.bossEntry
        && !['LEFT','RIGHT','UP','DOWN','JUMP','ATK','INT','HEAL','DASH'].some(a => IN_D(a));
      this.wallT = (this.wallSlide !== 0 && !this.on) ? (this.wallT || 0) + dt : 0;
      // IDLE IS NOT "STANDING STILL" (owner, 2026-11-14: "the character shouldn't
      // be saying yalla when the player is reading or interacting with the NPC.
      // That does not mean the character is idle... being idle is just standing
      // still without doing anything, not interacting with anything"). While she
      // is occupied her small life goes on â€” ears, tail, the look-around â€” but the
      // patience clock does not run, so neither the fidget nor the line can come
      // out of a conversation, a lesson or a reward. See heroOccupied().
      if (idle && heroOccupied()) { this.idleT = 0; this.idleSpoke = false; }
      if (idle) {
        this.idleT += dt;
        this.earTwitchIn = (this.earTwitchIn == null ? rnd(1.0, 2.6) : this.earTwitchIn) - dt;
        if (this.earTwitchIn <= 0) {
          this.earTwitchIn = rnd(1.6, 4.4); this.earTwitchT = 0.34;
          this.earTwitchSide = chance(0.5) ? -1 : 1;
        }
        this.lookIn = (this.lookIn == null ? rnd(1.6, 3.4) : this.lookIn) - dt;
        if (this.lookIn <= 0) {
          this.lookIn = rnd(2.4, 5.5);
          this.lookTgt = chance(0.6) ? (chance(0.5) ? -2.6 : 2.6) : 0;
          this.lookHold = rnd(0.5, 1.2);
        }
        this.tailFlickIn = (this.tailFlickIn == null ? rnd(1.8, 4.5) : this.tailFlickIn) - dt;
        if (this.tailFlickIn <= 0) {
          this.tailFlickIn = rnd(2.4, 6);
          this.tailV[0] += 0.55; this.tailV[1] += 0.35; this.tailV[2] += 0.2;
        }
        // THE LOW-CORE IDLE (handoff Part 2 D5). On her last core a still body
        // is not resting, it is running down: the pack sputters â€” a few sparks
        // and a stutter in the light, at uneven gaps, the way a failing cell
        // catches. Glow and sparks are the procedural layer (ART_BIBLE Â§0.0);
        // the slumped body itself is queued (ART_QUEUE Â§2bl). G.artProbe keeps
        // it out of the measurements.
        if (this.cores <= 1 && !G.artProbe) {
          this.sputterIn = (this.sputterIn == null ? rnd(0.4, 1.0) : this.sputterIn) - dt;
          if (this.sputterIn <= 0) {
            this.sputterIn = rnd(0.7, 1.6);
            this.sputters = (this.sputters || 0) + 1;
            const bx = this.x + this.w / 2 - (this.face || 1) * 6, by = this.y + this.h * 0.38;
            burst(bx, by, 4, chance(0.5) ? '#ffd08a' : '#aef7d8', 120, 0.3, 380, 1.8, true);
            this.sputterT = 0.12;
          }
        }
        // Once per uninterrupted idle, at five seconds. Narrative audio and
        // the character voice arbiter retain priority; there is no bypass.
        if (this.idleT >= FIDGET_AFTER && !this.idleSpoke) {
          this.idleSpoke = true;
          if (typeof hzdSay === 'function') hzdSay('yalla', 600);
        }
      } else { this.idleT = 0; this.idleSpoke = false; this.lookTgt = 0; this.lookHold = null; this.yallaIn = null; }
      if (this.lookHold != null) {
        this.lookHold -= dt;
        if (this.lookHold <= 0) { this.lookTgt = 0; this.lookHold = null; }
      }
      this.earTwitchT = Math.max(0, this.earTwitchT - dt);
      this.lookX = lerp(this.lookX, this.lookTgt, 1 - Math.pow(0.001, dt));
      this.takeoffT = Math.max(0, this.takeoffT - dt);
      this.hurtPoseT = Math.max(0, this.hurtPoseT - dt);
    }
    if (this.rechargeT > 0) {
      this.rechargeT -= dt; this.anim += dt;
      this.vx = 0; this.vy = Math.min(this.vy + 2300 * dt, 980);
      moveEnt(this, dt);
      return;
    }
    this.anim += dt;
    // THE CADENCE IS HUMAN NOW, AND IT WAS NOT. `anim` is seconds, so a cell
    // chosen by floor(anim * 10) flips the picture TEN TIMES A SECOND â€”
    // measured at 9.81 at full run. A sprinting human turns over about four
    // steps a second and a walk about two; ten is roughly double the fastest
    // cadence a body can produce, and with two poses to alternate it is not a
    // stride at all, it is a strobe. It is most of what reads as "unnatural",
    // and the new step bob inherited it and became a buzz rather than a rise
    // and fall.
    //
    // A dedicated phase, advanced by SPEED rather than by the clock, because
    // that is the relationship a gait actually has: she takes more steps per
    // second because she is travelling faster, not because more time passed.
    // Airborne it does not advance at all â€” feet that keep walking in mid-air
    // are the other classic tell.
    //
    // ...and the DIVISOR IS THE ART'S STEP, measured, not chosen. 88 units a
    // step was a number from before the plates existed; her walk contacts put
    // her soles 137 and 112 cell-pixels apart (walk_a, walk_c), which at the
    // plate's draw scale of HERO_DH/300 is HERO_STEP_WALK world units. The body
    // was covering three and a half of those for every step the legs claimed,
    // and a leg that claims a step it did not take IS the skating the owner
    // kept reporting. See HERO_STEP_WALK for how the run number is arrived at.
    // ...AND THE CADENCE HAS A CEILING A BODY CAN ACTUALLY PRODUCE. The
    // quotient above is honest about distance and impossible about time: at
    // the pad's walk (185 px/s over a 23-unit step) it asked for 8 beats a
    // second, and at the full run (340 over 38) for 8.9 â€” the same rate, for
    // both gaits, and both faster than a sprinter's legs turn over. So the
    // walk did not read as a walk; it read as the run's strobe at a lower
    // speed, which is the owner's "the dynamics of movement is so bad" once
    // the skating and the facing were gone. docs/GAIT.md has the arithmetic.
    //
    // Animation practice picks the CADENCE first and lets the ground slip:
    // every kit the eye accepts runs its cycle at two to three and a half
    // strides a second whatever the speed, and hides the slip in a long drawn
    // stride. The ceiling is soft (tanh), so the rate still rises with speed
    // inside each gait instead of pinning to a flat number the moment she
    // moves. tests/gait.cjs holds both bands.
    {
      const raw = this.on ? clamp(Math.abs(this.vx) / heroStepLen(this.vx), 0, 11) : 0;
      const cap = Math.abs(this.vx) > HERO_RUN_VX ? HERO_CADENCE.run : HERO_CADENCE.walk;
      this.stridePh = (this.stridePh || 0) + dt * cap * Math.tanh(raw / cap);
    }
    this.dashCD -= dt; this.atkCD -= dt; this.iT -= dt; this.castCD -= dt;
    this.jbuf -= dt; this.landT -= dt; this.comboT -= dt;
    this.throwPoseT = Math.max(0,(this.throwPoseT||0)-dt);
    this.catchPoseT = Math.max(0,(this.catchPoseT||0)-dt);
    if (this.slowT > 0) {
      this.slowT -= dt;
      if (chance(0.3)) addPart(this.x + rnd(0, this.w), this.y + rnd(0, this.h),
        rnd(-15, 15), rnd(-25, 5), 0.4, '#bfe8ff', 2, 100);
    }
    // COOLANT FREEZE coats any floor in ice; NULL GRAVITY makes jumps go light
    const ice = !!G.roomDef.ice || (G.iceT || 0) > 0;
    // THE CHAMBER HOLD. Standing in a guardian's room while the lights come up
    // is staging, and staging that the player can walk out of is not staging.
    // Her controls come back the moment the room is lit.
    // ...and the same hold covers the WAKING: the two seconds in which the
    // cradle lets go of her. A release you can walk out of halfway through is
    // a loading screen with a picture on it.
    const held = !!G.bossEntry || !!G.wake || !!G.gateWalk || !!(G.meet && !G.meet.interactive) || !!G.ghHold;
    // MOTHER'S SONG mirrors your inputs for its few seconds â€” fight it
    const dirRaw = held ? 0 : (inD('RIGHT') ? 1 : 0) - (inD('LEFT') ? 1 : 0);
    const dir = (G.revT || 0) > 0 ? -dirRaw : dirRaw;
    const healing = this.healT > 0;

    if (typeof grapUpdate === 'function' && grapUpdate(this, dt)) {
      // THE GRAPPLING CLAW owns her motion while it flies and while it reels (js/grapple.js)
    } else if (this.dashT > 0) {
      this.dashT -= dt;
      this.vx = this.dashVX; this.vy = this.dashVY;
      if (this.dashT <= 0) { if (this.dashVY < 0) this.vy = -240; else this.vy = Math.min(this.vy, 320); }
      // afterimages: 2-3 DISCRETE echoes along the dash line (not a per-frame
      // smear) â€” each one a readable copy that fades where she was
      this.dashTrailT -= dt;
      if (this.dashTrailT <= 0) {
        this.dashTrailT = 0.055;
        this.trail.push({ x: this.x, y: this.y, face: this.face, t: 0.24, t0: 0.24 });
      }
    } else {
      // horizontal â€” crisp starts and stops
      // ...and the first meeting's swat carries her the length of the mound:
      // ground friction would stop a 980 px/s throw inside a third of a second
      // ...and a body THROWN (a guardian's toss, a charge) keeps its flight:
      // on the floor's friction a 600 px/s throw would stop in a fifth of a second
      // ...AND A BLOW THROWS HER. hurt() sets 250 px/s of knockback and this
      // line then braked it at 2900 px/sÂ²: gone in five frames, nine pixels of
      // travel â€” a hit that left her standing where it found her. (The harness
      // that reported "thrown back 43 px" was reading a key a previous section
      // had left held down; it was measuring her WALKING.) For the beat hurt()
      // names, the throw keeps its flight and her stick cannot cancel it.
      const acc = (ice ? 1000 : 3000), fric = G.meet ? 1300 : (this.flungT > 0 || this.knockT > 0) ? 420 : ice ? 260 : 2900;   // 980Â²/(2Â·1300) â‰ˆ 370 px of throw: she lands inside the aftermath frame
      if (dir !== 0 && !healing && !(this.flungT > 0) && !(this.knockT > 0)) {
        // TURN BOOST: reversing bites harder than accelerating. Pressing away
        // from current speed is always a correction the player already wants
        // finished â€” every feel-canon movement kit does this (not on ice:
        // ice keeps its commitment, that is what ice IS).
        const turn = !ice && Math.sign(this.vx) === -dir ? 1.6 : 1;
        this.vx += dir * acc * turn * dt;
        // frozen joints: the Archivist's beams halve her top speed for a spell
        // ...and HOW HARD SHE IS BEING PUSHED, from the input contract rather
        // than from a device. A phone's thumb-stick is analogue and this game
        // threw the magnitude away, so touch had exactly one gait: full sprint,
        // always, with no way to inch up to a ledge. It reads TOUCH.axis to fix
        // that and the raw GP codes to decide whether a pad was walking â€” which
        // meant the movement resolver knew which device was live, and a fourth
        // device could not be added without editing physics. PI.moveX carries
        // the magnitude and PI.run carries "full speed, please", however the
        // device chose to say it (js/engine.js, THE INPUT CONTRACT).
        const push = Math.abs(PI.moveX) || 1;
        const padCap = PI.run ? 1 : Math.min(1, PAD_WALK_VX / this.speed());
        const cap = this.speed() * (this.slowT > 0 ? 0.5 : 1) * (this.dizzyT > 0 ? 0.45 : 1) * push * padCap;
        this.vx = clamp(this.vx, -cap, cap);
        this.face = dir;
      } else {
        const s = Math.sign(this.vx);
        this.vx -= s * fric * dt;
        if (Math.sign(this.vx) !== s) this.vx = 0;
      }
      // asymmetric gravity: quick rise, floaty apex hang, heavier fall
      //
      // THE APEX BAND IS WIDER NOW (owner, 2026-08-24: "jumping should push me
      // higher than terrain of the above floor to allow me to actually choose
      // direction to land on instead of falling back down"). The second half
      // of that sentence is not about height at all â€” it is about TIME. A jump
      // that arrives at the lip with no float is a commitment made on the
      // ground; a jump that hangs is a decision made in the air.
      //
      // 90 -> 150 doubles the window where gravity is soft: 0.25 s of hang
      // instead of 0.15 s, which is the difference between steering and
      // watching. It also adds ~6 px of apex on its own.
      let grav = this.vy < 0 ? 2150 : 3050;
      if (!this.on && Math.abs(this.vy) < JUMP_FLOAT) grav *= 0.55;
      if ((G.lowGravT || 0) > 0) grav *= 0.32;   // NULL GRAVITY field
      this.vy = Math.min(this.vy + grav * dt, 1020);
      // THE GLIDE caps the fall once the double jump is spent (js/glide.js)
      if (typeof glideStep === 'function') glideStep(this, dt);
      // THE T-CROSSING CARRY (set in applyTransition): while her feet are
      // still below the destination's floor line she is inside the shaft she
      // jumped up through, and the rise is re-asserted AFTER gravity â€” a
      // load-hitch cannot bleed it away frame by frame. The moment she is
      // clear, normal physics owns the jump again; the timer is only the
      // failsafe against a shaft this rule cannot understand.
      if (this.tCarry > 0) {
        this.tCarry = Math.max(0, this.tCarry - dt);
        const floorTop = (G.roomDef.h - 2) * TILE;
        // clear the moment she is out of the shaft (feet above the floor
        // line) OR standing on anything â€” never re-launch a landed body
        if (this.on || this.y + this.h <= floorTop + 2) this.tCarry = 0;
        else this.vy = Math.min(this.vy, -680);
      }
      this.wallSlide = 0;
      if (hasMod('wall') && !this.on && this.vy > 0 && dir !== 0 && touchingWall(this, dir)) {
        this.vy = Math.min(this.vy, 150); this.wallSlide = dir;
        if (chance(0.3)) addPart(dir > 0 ? this.x + this.w : this.x, this.y + this.h * 0.7, -dir * 40, rnd(-20, 60), 0.3, PAL[G.roomDef.zone].glow, 2, 300, true);
        // hot friction flecks off the paw pressed to the wall
        if (chance(0.22)) addPart(dir > 0 ? this.x + this.w : this.x, this.y + this.h * 0.35,
          -dir * rnd(30, 90), rnd(-90, -30), 0.24, '#ffd76a', 1.6, 700, true);
      }
      // jumping
      if (inP('JUMP')) this.jbuf = 0.12;
      if (this.jbuf > 0) {
        if (this.on || this.coyote > 0) {
          this.vy = -JUMP_V * (relicHas('spring') ? 1.045 : 1);
          this.on = false; this.coyote = 0; this.jbuf = 0; this.jetT = 0.2; sfx('jump');
          this.takeoffT = this.takeoff0 = 0.17; this.takeoffCoil = 1;   // coil 1-2 frames, then stretch
        } else if (this.wallSlide !== 0) {
          this.vy = -700; this.vx = -this.wallSlide * 430; this.face = -this.wallSlide; this.jbuf = 0;
          this.jetT = 0.22; this.flipT = FLIP_DUR; sfx('jump');
          this.takeoffT = this.takeoff0 = 0.12; this.takeoffCoil = 0;   // launch stretch only
          burst(this.wallSlide > 0 ? this.x + this.w : this.x, this.y + this.h / 2, 6, PAL[G.roomDef.zone].glow, 140, 0.3, 400, 3, true);
        } else if (this.airJumps > 0) {
          // THE DOUBLE JUMP IS A BACK JET NOW, not a pirouette (owner's call).
          // She is a robot: the second jump is HARDWARE â€” the back thruster
          // lights and shoves her, the same family as the dash boots. boostT
          // drives the thrust pose and the plume; the spin is retired from
          // this move (the wall jump keeps its flip, which is a different
          // gymnastic). Authored back-jet gear plates are queued in
          // ART_QUEUE Â§1c; the plume itself is additive light, which is the
          // one thing the art rules leave procedural (Â§0.0).
          this.vy = -680; this.airJumps--; this.jbuf = 0;
          this.jetT = 0.34; this.boostT = 0.3; sfx('djump');
          if (typeof glideHint === 'function') glideHint();
          this.takeoffT = this.takeoff0 = 0.12; this.takeoffCoil = 0;
          burst(this.x + this.w / 2, this.y + this.h, 10, '#8ff6ff', 160, 0.35, 500, 3, true);
          if (typeof padRumble === 'function') padRumble(0.4, 0.3, 160);
        }
      }
      // (a body THROWN is not a jump being released: the cut must not eat the throw)
      if (!inD('JUMP') && this.vy < -JUMP_CUT && !(this.flungT > 0)) this.vy = -JUMP_CUT;
      // omnidirectional dash â€” travels at the angle you hold
      if (inP('DASH') && hasMod('dash') && this.dashCD <= 0) {
        let ddx = (inD('RIGHT') ? 1 : 0) - (inD('LEFT') ? 1 : 0);
        let ddy = (inD('UP') ? -1 : 0) + (inD('DOWN') && !this.on ? 1 : 0);
        if (!ddx && !ddy) ddx = this.face;
        if (ddx) this.face = ddx;
        const dn = Math.hypot(ddx, ddy) || 1;
        this.dashVX = ddx / dn * 940;
        this.dashVY = ddy / dn * 880;
        this.dashT = 0.16 * (hasCrest('sprint') ? 1.2 : 1); this.dash0 = this.dashT;
        this.dashCD = 0.45; this.vx = this.dashVX; this.vy = this.dashVY;
        this.dashTrailT = 0.03;   // first afterimage drops just behind her
        this.healT = 0; sfx('dash');
        if (typeof padRumble === 'function') padRumble(0.10, 0.22, 45);
      }
    }
    // pose state (ninja/robot animation)
    const leanT = clamp(this.vx * this.face / this.speed(), -1, 1) * 0.15
      + (!this.on && this.dashT <= 0 ? clamp(this.vy / 1800, -0.1, 0.16) : 0);
    this.lean = lerp(this.lean, leanT, 1 - Math.pow(0.002, dt));
    this.flipT = Math.max(0, this.flipT - dt);
    this.boostT = Math.max(0, (this.boostT || 0) - dt);
    this.jetT = Math.max(0, this.jetT - dt);
    this.skidT = Math.max(0, this.skidT - dt);
    if (this.on && dir !== 0 && Math.sign(this.vx) === -dir && Math.abs(this.vx) > 200) {
      this.skidT = 0.14; this.skid0 = 0.14;
      if (chance(0.5)) addPart(this.x + this.w / 2 + dir * 10, this.y + this.h, dir * rnd(40, 110), rnd(-80, -20), 0.35, '#9fb8c8', 2.5, 600);
    }
    if (this.on && Math.abs(this.vx) > 280 && chance(0.1))
      addPart(this.x + this.w / 2 - this.face * 10, this.y + this.h - 2, -this.face * rnd(20, 60), rnd(-40, -10), 0.3, '#8fa3b5', 2, 500);
    // ---- FERAL CLAWS: the robo-cat's signature power ----
    // the volt-blade dissolves into twin purple energy claws, a halo of light
    // wraps the frame, and every strike becomes a raking claw hit
    this.clawT = Math.max(0, this.clawT - dt);
    this.clawCD = Math.max(0, this.clawCD - dt);
    this.pounceT = Math.max(0, this.pounceT - dt);
    G._pillarToldT = Math.max(0, (G._pillarToldT || 0) - dt);
    G._sgToldT = Math.max(0, (G._sgToldT || 0) - dt);
    const heroP = typeof isHero === 'function' && isHero();
    if (inP('CLAW') && this.clawCD <= 0 && this.clawT <= 0 && this.volts >= 30) {
      this.volts -= 30;
      this.clawT = 7; this.clawCD = 11;
      sfx('chargeReady'); sfx('castarc');
      G.flash = Math.max(G.flash, heroP ? 0.42 : 0.3);
      cam.shake = Math.max(cam.shake, heroP ? 7 : 5);
      G.addRing(this.x + this.w / 2, this.y + this.h / 2);
      const c1 = heroP ? '#ffd76a' : '#b06aff';
      burst(this.x + this.w / 2, this.y + this.h / 2, 26, c1, 300, 0.7, 60, 3, true);
      burst(this.x + this.w / 2, this.y + this.h / 2, 12, '#ffffff', 200, 0.5, 20, 2, true);
      if (heroP) {
        // the sky answers: a bolt from Olympus strikes the hero as he is blessed
        G.bolt = { x: this.x + this.w / 2, y: this.y + this.h / 2, t: 0.35, t0: 0.35 };
        burst(this.x + this.w / 2, this.y, 18, '#fff6c0', 260, 0.6, -60, 3, true);
      }
      G.toast(t(heroP ? 'wrath_on' : 'claw_on'));
    }
    if (this.clawT > 0 && chance(0.5))
      addPart(this.x + rnd(-6, this.w + 6), this.y + rnd(0, this.h), rnd(-18, 18), rnd(-42, -12), 0.5,
        heroP ? (chance(0.5) ? '#ffd76a' : '#fff6c0') : (chance(0.5) ? '#b06aff' : '#e0a0ff'), 2.2, -40, true);
    // Down is buffered: players press DOWN and ATK together, and whichever lands
    // first used to decide the swing. Holding the intent for a beat fixes that.
    if (inD('DOWN')) this.downBuf = 0.16; else this.downBuf -= dt;
    this.pogoT -= dt;
    // ---- THE SLASH -------------------------------------------------------
    // The single worst thing about the old melee was invisible: pressing ATK
    // during recovery DROPPED the press. A player attacking on rhythm â€” which is
    // what anyone does once they know the timing â€” was throwing away every other
    // input and feeling like the character was ignoring them. Nothing else about
    // an attack matters as much as the game agreeing that you pressed the button.
    //
    // So the press is now held for a beat and spent the instant the swing is
    // free. This is the difference between "sluggish" and "tight", and it is
    // almost entirely this one buffer.
    // ...unless it is the answer to a parry, which spends the press itself
    // (js/parry.js) â€” fresh, or buffered through the clash's own freeze,
    // which is exactly when a player who saw the clash presses it
    if (this.atkBuf > 0 && this.counterT > 0 && typeof parryCounter === 'function' && parryCounter(this)) this.atkBuf = 0;
    if (inP('ATK') && !G.bossEntry && !G.ghHold && !(typeof parryCounter === 'function' && parryCounter(this))) this.atkBuf = 0.2;
    else this.atkBuf = (this.atkBuf || 0) - dt;
    if (this.atkBuf > 0 && this.atkCD <= 0 && this.swirlT <= 0) {
      this.atkBuf = 0;
      // The combo ACCELERATES. Three identical beats read as one slow beat
      // repeated; opening fast and landing heavy on the finisher is what makes
      // a three-hit string feel like a sentence instead of a metronome.
      // THE SEAL SHE FIGHTS WITH (C1): taken once, here, and carried on the
      // swing so its box, shape, push, freeze and cut all read the same block
      const crest = crestStyleNow(), blk = swingCrest({ crest });
      // a two-beat seal (chain 2) goes straight from the jab to the finisher
      const nextC = this.comboT > 0 ? (blk && blk.chain === 2 ? (this.combo === 0 ? 2 : 0) : (this.combo + 1) % 3) : 0;
      this.atkCD = (typeof COMBAT_HERO_CD !== 'undefined' ? COMBAT_HERO_CD[nextC] : [0.26, 0.23, 0.33][nextC]) * (hasCrest('over') ? 0.7 : 1) * (blk ? blk.cd : 1);
      let ax = (inD('RIGHT') ? 1 : 0) - (inD('LEFT') ? 1 : 0);
      let ay = (inD('UP') ? -1 : 0) + (this.downBuf > 0 && !this.on ? 1 : 0);
      // a down-attack goes straight down. Diagonal aim used to push the hitbox
      // forward of whatever you were standing over, which is why it kept missing.
      // The plate's slam is the one exception, and on purpose: its down-strike
      // is the diagonal pogo, forward-down the way she faces (or is holding).
      if (ay > 0) ax = blk && blk.down === 'diag' ? (ax || this.face) : 0;
      // SHE TURNS TO WHAT SHE IS FIGHTING when the player has not said
      // otherwise (owner, 2026-08-24: "facing my first enemy was not accurate").
      //
      // ax was only ever the HELD direction, so the commonest way to meet the
      // first wolf â€” run at it, let go, swing â€” kept whatever facing the run
      // left behind, and a wolf that had run PAST her got clawed at empty air
      // while it bit her back. Holding a direction is an explicit statement and
      // still wins outright; this only fills the silence, and only for a target
      // close enough that no other reading is plausible.
      if (!ax && !ay) {
        const near = this.nearestFoe(96);
        ax = near ? near : this.face;
      }
      if (!ax && !ay) ax = this.face;
      if (ax) this.face = ax;
      // Ownership and equipment are separate; an airborne weapon leaves empty paws.
      const mode = G.boomer ? 'claws' : weaponMode(G.save);
      const wield = mode === 'joined' ? 2 : mode === 'claws' ? 0 : 1;
      {
      this.combo = nextC;
      this.comboT = 0.9;
      // THE CRYSTAL'S FINISHER RISES. Lost Crown grammar: the third beat of a
      // grounded chain is a diagonal cut that carries UP-forward, so a chain
      // that ends near a wall or a jumper ends by reaching after them. Claw
      // chains keep their flat finisher â€” the rake is a cat's move, not a
      // swordsman's.
      let aay = ay;
      if (wield >= 1 && this.combo === 2 && !ay && this.on) aay = -0.55;
      const ang = Math.atan2(aay, ax);
      // active a touch longer, so a swing that looks like it should connect does
      // Dual swords widen the arc with a second independently held blade.
      const twin = mode === 'dual';
      const tk = blk ? blk.t : 1;
      this.swing = { t: 0.15 * tk, t0: 0.15 * tk, ax, ay: aay, ang, combo: this.combo, set: new Set(), wield,
                     pure: wield >= 1, twin, weaponMode: mode, crest };
      // ay and air ride along so the RENDERER can tell an airborne or downward
      // strike from a standing one â€” see heroSwingState. They are the swing's
      // own aim and stance at the moment it started, not the body's current
      // state: she may land mid-swing, and the move she began is the move she
      // is playing.
      this.swingVis = { t: 0.24 * tk, t0: 0.24 * tk, ang, combo: this.combo, wield, twin, weaponMode: mode,
                        ay: aay, air: !this.on, crest };
      // the cut the seal draws (drawCrestEdge) is the box the swing really has
      if (blk) { const hb0 = this.hitbox(); this.swingVis.reach = hb0.R + hb0.half; this.swingVis.half = hb0.half; }
      this.startScratchWake(this.swingVis);
      if (hasSkill('wave')) {
        const wn = Math.hypot(ax, ay) || 1;
        G.projs.push(new Proj(this.x + this.w / 2 + ax / wn * 22, this.y + this.h / 2 - 2 + ay / wn * 22,
          ax / wn * 430, ay / wn * 430, true, Math.round(8 * DF().pdmg), 7, PAL[G.roomDef.zone].glow, 0, 0.34));
      }
      // EVERY grounded swing steps into the strike. Only the finisher used to
      // move her, so the first two hits felt like swiping at air from a standstill.
      if (this.on && !ay) this.vx += ax * (this.combo === 2 ? 230 : 96) * (blk ? blk.step : 1);
      // and in the air a level swing arrests the fall for a moment: it reads as
      // committing weight to the blow rather than flailing while dropping
      if (!this.on && !ay && this.vy > -60) this.vy = Math.min(this.vy, 40);
      // PAW PUNCH â€” in claw mode the finisher becomes a pouncing strike:
      // she launches at the target like a cat, claws first
      if (this.clawT > 0 && this.combo === 2) {
        if (heroP) {
          // THUNDERFALL â€” Zeus answers the strike: a bolt falls from the sky
          const tx2 = this.x + this.w / 2 + ax * 46, ty2 = this.y + this.h / 2 + ay * 20;
          G.bolt = { x: tx2, y: ty2, t: 0.4, t0: 0.4 };
          G.flash = Math.max(G.flash, 0.5);
          cam.shake = Math.max(cam.shake, 9);
          G.addRing(tx2, ty2);
          sfx('burstout');
          burst(tx2, ty2, 22, '#fff6c0', 320, 0.6, 120, 4, true);
          // the bolt itself wounds anything beneath it
          for (const e of G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'dorm' && G.boss.st !== 'intro' ? [G.boss] : [])) {
            if (e.dead || e.disabled || e.rescued) continue;
            if (Math.abs((e.x + e.w / 2) - tx2) < 46 && Math.abs((e.y + e.h / 2) - ty2) < 120) {
              if (dealDmg(e, this.attackDmg('thunder'), armEl(), tx2, ty2, true, 'thunder') <= 0) continue;
              attackKnock(e, 'thunder', 0, 0);
              if (e.hp <= 0) e.die(Math.sign(ax) || 1, -0.5);
            }
          }
        } else {
          this.pounceT = 0.22;
          this.vx += ax * 320;
          if (!this.on) this.vy = Math.min(this.vy, -80);
          cam.shake = Math.max(cam.shake, 5);
          sfx('wave');
          burst(this.x + this.w / 2 + ax * 18, this.y + this.h / 2 + ay * 18, 14, '#b06aff', 260, 0.4, 60, 3, true);
        }
      }
      this.healT = 0; sfx('atk');
      if (typeof padRumble === 'function') padRumble(0.04, 0.10, 22);
      }
    }
    // HOLD TO GUARD (owner sheet, 2026-09-15: BLOCK/GUARD row). A defensive
    // brace, not a move: while held and grounded with nothing else claiming
    // her hands, hurt() below cuts incoming damage and drops the knockback.
    // Cancelled by attacking, dashing, charging or healing â€” the same
    // mutual exclusion every other held verb in this file already respects.
    // ...and a BROKEN brace cannot be raised until it recovers (see hurt():
    // three braced hits inside two seconds break it). The heat it is measured
    // by cools here, so a block she takes now is forgotten two seconds on.
    this.guardBreakT = Math.max(0, (this.guardBreakT || 0) - dt);
    this.guardHeat = Math.max(0, (this.guardHeat || 0) - dt);
    const wasGuard = this.guardT > 0;
    this.guardT = (inD('GUARD') && this.on && !this.swingVis && this.dashT <= 0
      && this.chargeT <= 0.05 && this.healT <= 0 && this.guardBreakT <= 0) ? 1 : 0;
    // the perfect-guard window and the counter it opens (js/parry.js)
    if (typeof parryGuardStep === 'function') parryGuardStep(this, dt, wasGuard);
    // hold attack to charge the volt-burst
    // ...ONLY ONCE THE PACK IS WIRED (burstUnlocked, game.js): before the first
    // volt cell is bought, a held ATTACK is an attack, and nothing builds.
    if (inD('ATK') && this.dashT <= 0 && this.swirlT <= 0 && !G.boomer
        && (typeof burstUnlocked !== 'function' || burstUnlocked())) {
      if(this.chargeT<=0)this._chargeArtCount=(this._chargeArtCount||0)+1;
      this.chargeT += dt;
      // CAN SHE ACTUALLY PAY FOR IT?
      //
      // The build-up used to look and sound identical whether or not she had
      // the volts: same rising ticks, same brightening aura, same white flash
      // at full charge â€” and then, on release, nothing but a soft refusal
      // buried under the swing. A promise kept every time except when it isn't
      // is not a cost, it is a bug, and it was reported as one.
      //
      // The charge still runs when she is short, because a move you cannot see
      // is a move you never learn. It runs DULL: no rising ladder, sparse cold
      // particles, and the price said out loud the first time she asks for it.
      this.chargeOk = this.volts >= BURST_VOLTS;
      // SHE HOLDS A NOTE WHILE IT BUILDS. Every other bark in the game is an
      // event â€” one syllable on one frame â€” but a charge is a STATE, and the
      // thing the player needs to hear is that it is still going. So the vocal
      // starts once, a beat in, and is not re-triggered: the rising tick ladder
      // is the clock, her voice is the effort under it.
      //
      // Only when she can PAY. The refusal path is deliberately dull (see
      // below) and a hero straining for a move she cannot afford is exactly the
      // promise-that-isn't this whole branch was rewritten to stop making.
      // ...AND IT STARTS WHERE THE CHARGE BECOMES VISIBLE, NOT BEFORE IT.
      //
      // 0.14 was earlier than the move's own tell: the tick ladder and the
      // particles both start at 0.25, so her voice was committing to a charge a
      // tenth of a second before anything on screen agreed, and an ordinary tap
      // held 150 ms â€” which is most of them â€” started a 1.60 second held vowel
      // for a burst that never happened. 0.30 sits after the visual tell and
      // far beyond any tap, so the order is: the ladder starts, then she leans
      // into it, then it fires at 0.6.
      if (this.chargeT > 0.30 && !this.chargeVoxed && this.chargeOk) {
        this.chargeVoxed = true;
        if (typeof hzdHold === 'function') hzdHold('charge');
      }
      if (this.chargeT > 0.25) {
        this.chargeTick -= dt;
        if (this.chargeTick <= 0) {
          this.chargeTick = 0.11;
          if (this.chargeOk) sfxChargeTick(Math.min(1, this.chargeT / 0.6));
        }
        // sparks thrown OFF the chassis: born on her outline, flung outward,
        // short-lived. The drawn storm (drawChargeStorm below) is the current
        // IN her; these are what did not make it into the frame.
        if (chance(this.chargeOk ? 0.55 : 0.16)) {
          const a = rnd(0, Math.PI * 2), sp = rnd(40, 110);
          addPart(this.x + this.w / 2 + Math.cos(a) * 13, this.y + this.h * 0.45 + Math.sin(a) * 22,
            Math.cos(a) * sp, Math.sin(a) * sp, 0.2,
            !this.chargeOk ? '#7d6b8a' : this.chargeT >= 0.6 ? '#ffffff' : PAL[G.roomDef.zone].glow, 2, 0, true);
        }
        if (this.chargeT >= 0.6 && this.chargeT - dt < 0.6) {
          sfx(this.chargeOk ? 'chargeReady' : 'no');
          // said once, at the exact moment the player is asking the question
          if (!this.chargeOk && !G.save.burstTold) {
            G.save.burstTold = 1;
            G.toast(t('tt_burst_need').replace('%n', BURST_VOLTS).replace('%v', Math.floor(this.volts)));
          }
        }
      }
    } else {
      // THE BURST COSTS SOMETHING NOW. Held attack put out 2.6x damage in a
      // 128 px circle with full knockback, at no cost and no cooldown â€” which
      // is strictly better than the combo the whole game is built around, so
      // finding it ended the melee game rather than deepening it. It is a
      // resource decision now, and it is in the controls screen where it can
      // be found on purpose instead of by accident.
      if (this.chargeT >= 0.6 && this.swirlT <= 0 && !G.boomer) {
        if (this.volts >= BURST_VOLTS) {
          this.volts -= BURST_VOLTS;
          // the held note ends in a shout â€” the one place her voice is allowed
          // to sit ON TOP of the impact rather than under it, because this is
          // the move the whole charge was for
          // the held note gives way to the shout rather than fighting it: two
          // of her voices overlapping is the mud, not the drama
          if (typeof hzdRelease === 'function') hzdRelease(0.05);
          if (typeof hzdSay === 'function') hzdSay('release', 0);
          this.releaseCharged();
        } else { sfx('no'); this.chargeT = 0; }
      }
      // AND AN ABANDONED CHARGE ENDS ITS NOTE. Letting go early is the common
      // case â€” it is every ordinary attack â€” so this is the line that stops her
      // straining through a fight she is winning in single hits.
      if (this.chargeVoxed && typeof hzdRelease === 'function') hzdRelease();
      this.chargeT = 0; this.chargeVoxed = false;
    }
    if (this.scratchWake) {
      this.scratchWake.t -= dt;
      if (this.scratchWake.t <= 0 || this.dead) this.scratchWake = null;
    }
    if (this.swingVis) { this.swingVis.t -= dt; if (this.swingVis.t <= 0) { this.swingVis = null; this._rake = null; } }
    // heal
    if (inD('HEAL') && this.on && this.dashT <= 0 && this.volts >= this.healCost() && this.cores < this.maxCores()
        && (typeof healUnlocked !== 'function' || healUnlocked())) {
      this.healT += dt; this.vx = 0;
      if (chance(0.5)) addPart(this.x + rnd(0, this.w), this.y + this.h, rnd(-20, 20), rnd(-120, -60), 0.5, '#aef7d8', 2.5, -50, true);
      this.healTick -= dt;
      if (this.healTick <= 0) { this.healTick = 0.16; sfxHealTick(this.healT / 0.85); }
      if (this.healT >= 0.85) {
        this.healT = 0; this.volts -= this.healCost(); this.cores++;
        this.reliefT = 0.9;                              // the face exhales (heroMood 'relief')
        G.coreFlash = { i: this.cores - 1, t: 0.5 };
        if (this.cores >= this.maxCores()) G.coresFullT = 0.8;
        if (typeof padRumble === 'function') padRumble(0.12, 0.25, 90);
        sfx('heal'); burst(this.x + this.w / 2, this.y + this.h / 2, 16, '#aef7d8', 180, 0.5, 100, 3, true);
      }
    } else this.healT = 0;
    this.armCD -= dt; this.songT -= dt; this.songCD -= dt; this.starCD -= dt;
    if (this.moodT > 0) this.moodT -= dt;
    if (this.reliefT > 0) this.reliefT -= dt;
    if (this.sputterT > 0) this.sputterT -= dt;     // the low-core stutter in her lights
    // THE SWIRL runs on its own clock so its four passes keep their spacing
    // whatever the frame rate is doing
    if (this.swirlT > 0) {
      this.swirlT -= dt; this.swirlTick += dt;
      while (this.swirlTick >= SWIRL_STEP && this.swirlT > -SWIRL_STEP) {
        this.swirlTick -= SWIRL_STEP;
        this.swirlPass();
      }
      if (this.swirlT <= 0) { this.swirlTick = 0; this.atkCD = Math.max(this.atkCD, 0.30); }
    }
    // Dual swords are equipment, never a timed buff that auto-joins.
    this.twinT = 0;
    // shuriken â€” hers from the start, aimed with UP or DOWN
    if (inP('STAR') && this.starCD <= 0) throwStar(this);
    // cycle the suit wheel (slot 0 is the plain bolt, so EMP is never lost)
    if (inP('ARM') && cycleArm(1)) {
      const a = activeArm();
      sfx('ui'); G.toast(a ? t('arm_' + a.id) : t('arm_none'));
    }
    // CAST fires whichever suit is worn; with none worn it is the old EMP bolt
    const arm = (typeof activeArm === 'function') ? activeArm() : null;
    const empCost = hasSkill('router') ? 18 : 26;
    if (inP('CAST') && arm && this.armCD <= 0 && this.volts >= arm.cost) {
      this.volts -= arm.cost; this.armCD = arm.cd;
      fireArm(this, arm);
    } else if (inP('CAST') && !arm && hasMod('emp') && this.castCD <= 0 && this.volts >= empCost) {
      this.volts -= empCost; this.castCD = 0.5; sfx('castarc');
      G.projs.push(new Proj(this.x + this.w / 2 + this.face * 16, this.y + this.h / 2 - 4, this.face * 540, 0, true, Math.round(22 * DF().pdmg), 11, '#7df3ff'));
    }
    // the Song â€” quiets the orders without touching the body
    if (inP('SONG') && this.songCD <= 0 && this.volts >= SONG_COST) {
      if ((G.songLockT || 0) > 0) {
        // MOTHER'S SONG is jamming the channel â€” the keytar chokes
        this.songCD = 0.5; sfx('no');
      } else {
        this.songCD = 1.1;
        const n = playSong();
        if (n) G.toast(t('song_hit').replace('%s', n));
        if ((G.darkT || 0) > 0) G.revealT = 3;   // the Song lights her up
      }
    }
    // resolve movement
    const wasFalling = this.vy;
    const xBeforeMove = this.x;
    const col = moveEnt(this, dt);
    this.lastCol = col;   // what the resolver met this step (js/soar.js reads the ceiling)
    // ...and against the machines in the room: she cannot walk through one (js/solid.js)
    if (typeof solidResolve === 'function') solidResolve(this, xBeforeMove, dt);
    if (col.d) {
      if (!this.on && wasFalling > 420) {
        this.landT = wasFalling > 700 ? 0.22 : 0.12; this.land0 = this.landT; sfx('land');
        if (typeof padRumble === 'function')
          padRumble(wasFalling > 700 ? 0.5 : 0.2, wasFalling > 700 ? 0.35 : 0.3, wasFalling > 700 ? 140 : 80);
        burst(this.x + this.w / 2, this.y + this.h, wasFalling > 700 ? 14 : 6, '#9fb8c8', wasFalling > 700 ? 150 : 90, 0.35, 500, 2);
      }
      this.on = true; this.coyote = 0.1;
      this.airJumps = hasMod('djump') ? (hasSkill('triple') ? 2 : 1) : 0;
    } else { this.on = false; this.coyote -= dt; }
    const contact = Math.floor((this.stridePh || 0) / 2);
    if (this.on && Math.abs(this.vx) > 70 && this.dashT <= 0 && !this.swingVis) {
      if (this.stepContact != null && this.stepContact !== contact)
        sfx((G.roomDef.ice || (G.iceT || 0) > 0) ? 'stepice' : 'step');
      this.stepContact = contact;
    } else this.stepContact = null;
    // hazard tiles. The GROUNDING CREST is the one piece of kit that lets her
    // stand on a live rail â€” and standing on one is the only way to reach what
    // is under the brittle stretch of it.
    if (onSpike(this) && hasCrest('ground')) {
      if (chance(0.5)) addPart(this.x + rnd(0, this.w), this.y + this.h - 2,
        rnd(-40, 40), rnd(-70, -20), 0.3, chance(0.5) ? '#9fe8ff' : '#ffffff', 2, 90, true);
      this.groundedOn = true;
    } else if (onSpike(this)) {
      this.hurt(1, this.x - this.vx);
      if (!this.dead) { this.x = this.lastSafe.x; this.y = this.lastSafe.y; this.vx = 0; this.vy = 0; }
    } else if (this.on && this.vy === 0) {
      // remember a safe spot (solid, non-hazard footing)
      const bx = Math.floor((this.x + this.w / 2) / TILE), by = Math.floor((this.y + this.h + 4) / TILE);
      if (solidAt(bx, by) && tileAt(bx, by - 1) !== '^' && tileAt(bx - 1, by) !== '^' && tileAt(bx + 1, by) !== '^')
        this.lastSafe = { x: this.x, y: this.y };
    }
    // swing hits
    if (this.swing && this.swing.t > 0) {
      // â€¦and the other order too: ATK first, DOWN a frame later. Within the first
      // 60ms the swing is still re-aimable.
      if (this.swing.t > (this.swing.t0 || 0.15) - 0.09 && this.swing.ay <= 0 && !this.on && inD('DOWN')) {
        const sb = swingCrest(this.swing), dg = sb && sb.down === 'diag';
        this.swing.ax = dg ? (this.swing.ax || this.face) : 0; this.swing.ay = 1;
        this.swing.ang = Math.atan2(1, this.swing.ax);
        // the swing is re-aimable for 60ms and the DRAWING has to follow it,
        // or a strike re-aimed into a plunge goes on playing the one it was
        if (this.swingVis) {
          this.swingVis.ay = 1; this.swingVis.ang = this.swing.ang;
          // ...and the seal's edge follows it onto the plunge's own box
          if (sb) { const hb1 = this.hitbox(); this.swingVis.reach = hb1.R + hb1.half; this.swingVis.half = hb1.half; }
        }
      }
      this.swing.t -= dt;
      const hb = this.hitbox();
      let pogo = false;
      // A freed guardian is never a target. Swinging at the beast you saved is
      // not an attack, it is a poke â€” so it is intercepted here, before any of
      // the damage machinery, and answered instead.
      if (typeof isPet === 'function' && isPet(G.boss) && !this.swing.set.has(G.boss)
          && aabb(hb, hurtBoxOf(G.boss))) {
        this.swing.set.add(G.boss);
        petPoke(G.boss, hb.x + hb.w / 2, hb.y + hb.h / 2);
      }
      const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
      const n0 = Math.hypot(this.swing.ax, this.swing.ay) || 1;
      const kx = this.swing.ax / n0 || this.face, ky = this.swing.ay / n0;
      for (const e of targets) {
        if (e.dead || e.disabled || e.rescued || this.swing.set.has(e)) continue;
        if (swingTouches(this, hurtBoxOf(e), hb)) {      // the authored shape inside the box (js/hitshape.js)
          this.swing.set.add(e);
          // the opener and the second beat are the slash row; the third is
          // the finisher's. Feral claws rake deeper, the crystal has an edge,
          // a pure edge bites the corrupted, the lens can crit: all of it is
          // the row's named factors, applied in attackDmg (ATTACKS / ATK_MOD).
          const aid = this.swing.combo === 2 ? 'finisher' : 'slash';
          let dm = this.attackDmg(aid, { clawT: this.clawT, wield: this.swing.wield, pure: this.swing.pure,
                                         target: e, x: hb.x + hb.w / 2, y: hb.y + hb.h / 2 });
          dm = dealDmg(e, dm, armEl(), hb.x + hb.w / 2, hb.y + hb.h / 2, true, aid);
          if (dm <= 0) continue;
          if (attackKnock(e, aid, kx, ky)) {
            // RISECUT: the up-slash becomes a LAUNCHER (Lost Crown's juggle
            // grammar). The enemy goes up far enough to meet an air chain,
            // and a grounded cut that connects lifts her into the juggle too.
            if (this.swing.ay < 0 && this.swing.wield >= 1 && hasSkill('risecut')) {
              e.vy = -ATTACKS.risecut.kbUp; e.kbT = ATTACKS.risecut.kbT;
              if (this.on) this.vy = -ATTACKS.risecut.lift, this.on = false;
            }
          }
          this.gainVolts(11);
          // IMPACT, WEIGHTED. One flat freeze for every hit makes a finisher land
          // like a jab. Hit-stop, shake and rumble now all scale with what the
          // blow actually was, so the third hit of a combo reads as the third hit.
          const heavy = this.swing.combo === 2, big = e instanceof Boss;
          sfx(big ? 'bosshit' : 'hit');
          cam.shake = Math.max(cam.shake, heavy ? 5 : big ? 3.4 : 2.5);
          attackFreeze(aid, big);
          // RECOIL. Contact has to push back on HER too, or the enemy is made of
          // paper â€” a few pixels against the swing is all it takes to sell mass.
          this.vx -= kx * ATTACKS[aid].recoil * crestSwingMul('recoil');
          if (typeof padRumble === 'function') padRumble(heavy ? 0.42 : 0.2, heavy ? 0.6 : 0.42, heavy ? 110 : 60);
          this.hitConfirmT = 0.14;
          burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 14, '#fff2a8', 280, 0.35, 300, 3, true);
          burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 6, '#ffffff', 160, 0.2, 100, 2, true);
          if (this.swing.combo === 2) G.impact = { t: 0.12, t0: 0.12, x: hb.x + hb.w / 2, y: hb.y + hb.h / 2 };
          if (this.swing.ay > 0) pogo = true;
          if (e.hp <= 0) e.die(kx, ky);
        }
      }
      // THE BURIED MOUTH takes the blade. Any blade, any claw, once per swing:
      // the first tunnel must not be gated behind a skill a run may not own.
      if (!this.swing.rubHit && typeof rubbleHit === 'function' && rubbleHit(hb, false))
        this.swing.rubHit = true;
      // the pillar shrugs off ordinary claws â€” and SAYS so, because a wall
      // that eats hits silently reads as a bug rather than a lock. Sparks fly
      // on every hit; the hint line is throttled so it teaches, not nags.
      for (const s2 of G.statics) {
        if (s2.type !== 'pillar' || this.swing.pilHit || !aabb(hb, s2)) continue;
        this.swing.pilHit = true;                       // one clink per swing
        burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 6, '#bfe9ff', 180, 0.22, 220, 2, true);
        sfx('no');
        if ((G._pillarToldT || 0) <= 0) { G._pillarToldT = 3; G.toast(t('pl_hint')); }
      }
      // WHIFF. A miss used to be silent, which made a missed swing feel like a
      // dropped input rather than a mistake. The blade now cuts air on the frame
      // the window closes, and only if nothing was struck.
      if (this.swing.t <= 0 && !this.swing.set.size && !this.swing.whiffed) {
        this.swing.whiffed = true;
        sfx('whiff');
      }
      // hostile projectiles can be swatted
      for (const p of G.projs) if (!p.friendly && !p.dead && aabb(hb, p.box())) { p.dead = true; burst(p.x, p.y, 6, p.color, 150, 0.25, 300, 2, true); }
      // breakable + spike tiles in swing range
      const x0 = Math.floor(hb.x / TILE), x1 = Math.floor((hb.x + hb.w) / TILE);
      const y0 = Math.floor(hb.y / TILE), y1 = Math.floor((hb.y + hb.h) / TILE);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const raw = tileAt(tx, ty);
        // only a grounded cat can cut a live rail; anyone else is just being hit
        if (raw === 'v') {
          if (hasCrest('ground') && this.swing.ay > 0) {
            G.breakTile(tx, ty); pogo = true;
            sfx('glass'); cam.shake = Math.max(cam.shake, 7);
            for (let i = 0; i < 14; i++)
              addPart(tx * TILE + 16, ty * TILE + 16, rnd(-220, 220), rnd(-260, 60),
                rnd(0.4, 0.8), chance(0.5) ? '#9fe8ff' : '#fff2a8', rnd(2, 3.4), 500, true);
          }
          continue;
        }
        const c = (raw === '#' && brLoose(tx, ty)) ? 'B' : raw;
        if (c === 'B') {
          // floor blocks (at/below the feet) only break with a DOWN-attack
          // (jump, hold down, hit), and a down-attack still cuts anything
          // brittle in ONE â€” every pogo route in the game is a single strike.
          //
          // A SIDE OR CEILING SECRET TAKES TWO BLOWS, and that is the tell
          // (docs/plan Â§5 fix 3). One blow used to open it, so the only thing
          // that ever said "hollow" was the rock vanishing. Now the first blow
          // KNOCKS: a hollow note, a puff of grit out of the seam, the crack
          // opening wider â€” and the second one breaks it. A floor struck from
          // the side knocks too and stays put, which is the room telling her
          // this is hollow and the hit came from the wrong direction.
          // One swing is several frames long; a tile counts once per swing.
          const floorBlock = ty * TILE >= this.y + this.h - 6;
          const struck = this.swing.struck || (this.swing.struck = new Set());
          const key = tx + ty * 4096;
          if (struck.has(key)) continue;
          struck.add(key);
          if (this.swing.ay > 0) { G.breakTile(tx, ty); pogo = true; }
          else if (!floorBlock) { if (G.knockTile(tx, ty, true) >= 2) G.breakTile(tx, ty); }
          else G.knockTile(tx, ty, false);
        } else if (c === '^' && this.swing.ay > 0) pogo = true;
      }
      if (pogo && this.swing.ay > 0) {
        // PLUNGE: with the skill, the down-slash's rebound frame also slams a
        // ring into the floor â€” everything grounded nearby takes a smaller,
        // second bite. Priced as a tier-2 node because it turns the pogo from
        // an escape move into an opener.
        if (this.swing.wield >= 1 && hasSkill('plunge')) {
          const px0 = this.x + this.w / 2, py0 = this.y + this.h;
          G.addRing(px0, py0);
          cam.shake = Math.max(cam.shake, 6);
          burst(px0, py0, 18, '#e8f4ff', 300, 0.5, 200, 3, true);
          for (const e2 of G.enemies) {
            if (e2.dead || this.swing.set.has(e2)) continue;
            if (Math.abs(e2.x + e2.w / 2 - px0) < 78 && Math.abs(e2.y + e2.h - py0) < 40) {
              this.swing.set.add(e2);
              if (dealDmg(e2, this.attackDmg('plunge'), armEl(), e2.x + e2.w / 2, e2.y + e2.h / 2, true, 'plunge') <= 0) continue;
              attackKnock(e2, 'plunge', Math.sign(e2.x - px0), 0);
              attackFreeze('plunge');
              if (e2.hp <= 0) e2.die(Math.sign(e2.x - px0) || 1, -0.4);
            }
          }
        }
        // A short, crisp rebound rather than a free jump â€” hold JUMP to get the
        // taller one. Either way you leave the enemy instead of falling into it.
        this.vy = inD('JUMP') ? -880 : -660;
        // THE DIAGONAL POGO (the plate's slam): the rebound carries her on,
        // forward over what she struck, instead of straight back up off it
        if (this.swing.ax) this.vx = this.swing.ax * DIAG_POGO_VX;
        if (this.dashT > 0 && this.dashVY > 0) { this.dashT = 0; this.dashVY = 0; }
        this.iT = Math.max(this.iT, 0.18);   // no contact damage from what you just hit
        this.pogoT = 0.18;
        this.airJumps = hasMod('djump') ? (hasSkill('triple') ? 2 : 1) : 0;
        this.dashCD = Math.min(this.dashCD, 0); this.swing.t = 0; sfx('pogo');
        if (typeof padRumble === 'function') padRumble(0.3, 0.55, 90);
        cam.shake = Math.max(cam.shake, 4);
        attackFreeze('slash');            // the rebound is the down-slash's own contact
        burst(this.x + this.w / 2, this.y + this.h + 4, 10, '#cfe8ff', 220, 0.3, 260, 3, true);
      }
    }
    for (let i = this.trail.length - 1; i >= 0; i--) { this.trail[i].t -= dt; if (this.trail[i].t <= 0) this.trail.splice(i, 1); }
    this.updateBoomer(dt);
  }
  // ---- THE THROWN BLADE ---------------------------------------------------
  // Out flat and fast, a beat of hang, then home to her paw â€” and it cuts on
  // every pass: the same enemy can be hit going and coming, which is the
  // whole reason a boomerang is not just a slower projectile. While it flies
  // she is unarmed (the atk router and the audio's wielded() both check
  // G.boomer), so a throw is a real decision, not free damage.
  updateBoomer(dt) {
    const b = G.boomer;
    if (!b) return;
    b.t += dt; b.spin += dt * 22;
    if (b.out) {
      b.vx *= Math.pow(0.14, dt);            // the air bleeds the throw off
      if (Math.abs(b.vx) < 130 || b.t > 0.55) { b.out = false; b.set.clear(); }
    } else {
      // homing return â€” to where she IS, not where she stood when she threw
      const tx = this.x + this.w / 2, ty = this.y + this.h / 2 - 4;
      const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1;
      const sp = Math.min(980, 560 + b.t * 500);
      b.vx = dx / d * sp; b.vy = dy / d * sp;
      if (d < Math.max(26, sp * dt)) {                          // the catch
        G.boomer = null;
        this.catchPoseT = 0.18;
        this.atkCD = Math.min(this.atkCD, 0.08);
        sfx('chargeReady');
        burst(tx, ty, 8, '#ffffff', 160, 0.25, 60, 2, true);
        if (typeof padRumble === 'function') padRumble(0.2, 0.3, 60);
        return;
      }
    }
    b.x += b.vx * dt; b.y += (b.vy || 0) * dt;
    // it cuts both ways, once per pass
    const bb = { x: b.x - 16, y: b.y - 16, w: 32, h: 32 };
    const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
    for (const e of targets) {
      if (e.dead || e.disabled || e.rescued || b.set.has(e)) continue;
      if (typeof isPet === 'function' && isPet(e)) continue;
      if (aabb(bb, hurtBoxOf(e))) {
        b.set.add(e);
        // out, it is the spear; on its way home it cuts and PINS (ATTACKS)
        const aid = b.out ? 'throw' : 'throwBack';
        const dm = dealDmg(e, this.attackDmg(aid), armEl(), b.x, b.y, true, aid);
        if (dm <= 0) continue;
        sfx(e instanceof Boss ? 'bosshit' : 'hit');
        attackFreeze(aid);
        burst(b.x, b.y, 10, '#ffffff', 240, 0.3, 120, 2.6, true);
        attackKnock(e, aid, Math.sign(b.vx), 0);
        if (e.hp <= 0) e.die(Math.sign(b.vx) || 1, -0.3);
      }
    }
    // walls turn it around early rather than eating it
    if (b.out && solidAt(Math.floor((b.x + Math.sign(b.vx) * 16) / TILE), Math.floor(b.y / TILE))) { b.out = false; b.set.clear(); }
  }
  // ---- THE SWIRL: the twin-blade supercharge --------------------------------
  //
  // With both halves in her paws the charged blow is not a punch, it is a DANCE.
  // She comes up onto one toe and turns, and the two crystals draw a flower in
  // the air around her â€” the same five-petal ring the art plate carries.
  //
  // WHY IT IS A DIFFERENT MOVE AND NOT A BIGGER ONE. The single-crystal burst is
  // a shove: one hit, everything within 128 px, over in a moment. The swirl is
  // FOUR passes over 640 ms in a tighter ring, so it does more to a thing that
  // stays and much less to a thing that leaves. That makes it a positioning
  // move â€” you open with it when something is committed, not when something is
  // approaching â€” and it is the greedy axis from the combat skill: the window
  // fits three passes comfortably and tempts you to stand there for the fourth.
  //
  // Ownership persists after the spin. Joining requires the later connector
  // and an explicit equipped-mode choice; time never changes equipment.
  swirl() {
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    this.chargeT = 0;
    this.swirlT = SWIRL_T; this.swirlTick = 0; this.swirlHits = 0; this.swirlFroze = false; this.swirlImpactDone = false;
    this.twinT = 0;
    this.swing = null; this.atkBuf = 0;
    this.atkCD = Math.max(this.atkCD, SWIRL_T + 0.3);
    // she rises and turns: light, buoyant, off the floor for the whole move
    this.vy = Math.min(this.vy, -110);
    // its OWN cue, on the pass clock â€” not the burst's thud. See crystalSwirl()
    sfx('crystalSwirl');
    // NO cam.shake here. The combat skill's camera rule is that the screen must
    // never shake through a frame the player has to read, and the whole point of
    // this move is that you watch it. The flash and the ring carry the weight.
    G.flash = Math.max(G.flash, 0.4);
    G.addRing(cx, cy, 30);
    this.swingVis = { t: SWIRL_T, t0: SWIRL_T, ang: 0, combo: 3, charged: true, swirl: true, wield: 1, twin: true, weaponMode: 'dual' };
    burst(cx, cy, 22, '#ffffff', 260, 0.7, 90, 3, true);
  }
  // one damage pass of the swirl, called on its own clock from update()
  swirlPass() {
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    const R = SWIRL_R, dm = this.attackDmg('swirl');
    const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
    let hit = 0;
    for (const e of targets) {
      if (e.dead || e.disabled || e.rescued || (typeof isPet === 'function' && isPet(e))) continue;
      const ex = e.x + e.w / 2 - cx, ey = e.y + e.h / 2 - cy;
      const d = Math.hypot(ex, ey);
      if (d > R + Math.max(e.w, e.h) / 2) continue;
      // Specials obey the same purification, ally and guardian defenses as
      // ordinary strikes. A blocked/purifying hit earns no launch or volts.
      if (dealDmg(e, dm, armEl(), e.x + e.w / 2, e.y + e.h / 2, true, 'swirl') <= 0) continue;
      hit++;
      e.hurtT = 0.18;
      const n = d || 1;
      // it LIFTS and PINS rather than throws: a thing juggled inside the ring
      // stays in it for the next pass, which is what makes standing your
      // ground pay (ATTACKS.swirl: kb 0, a 60 px/s lift)
      attackKnock(e, 'swirl', ex / n, ey / n);
      this.gainVolts(4);
      if (e.hp <= 0) e.die(ex / n, ey / n);
    }
    // ONLY THE FIRST CONTACT FREEZES (A3). A 35 ms stop on every pass was four
    // stutters in a move that exists to be watched; the first one still lands
    // the weight, the rest keep the dance moving (ATTACKS.swirl.tickFreeze).
    if (hit) { attackFreeze('swirl', false, this.swirlFroze); this.swirlFroze = true; sfx('hit');
      if (typeof padRumble === 'function') padRumble(0.22, 0.38, 65);
    }
    this.swirlHits += hit;
    burst(cx, cy, 8, '#eafffb', 210, 0.35, 60, 2, true);
  }
  throwJoined() {
    if (G.boomer || weaponMode(G.save) !== 'joined') return false;
    const dir = this.face || 1;
    this.chargeT = 0; this.comboT = 0; this.combo = 0;
    this.swing = null; this.swingVis = null; this.atkBuf = 0;
    this.atkCD = 0.5;
    G.boomer = { x: this.x + this.w / 2, y: this.y + this.h / 2 - 4,
      vx: dir * 640, vy: 0, t: 0, out: true, spin: 0, set: new Set() };
    this.vx -= dir * 90;
    this.throwPoseT = 0.18; this.catchPoseT = 0;
    this.healT = 0;
    sfx('crystalJoin');
    if (typeof padRumble === 'function') padRumble(0.3, 0.4, 90);
    return true;
  }
  releaseCharged() {
    if (G.boomer || this.swirlT > 0) { this.chargeT = 0; return false; }
    // the tutorial's burst lesson (TUT_STEPS 'burst') completes on a real
    // release, whichever weapon shaped it
    // ...at the jammed winch, while the opening teaches it (opBurstMisses)
    if (G.save && G.save.flags && !G.save.flags.burstDone
        && !(typeof opBurstMisses === 'function' && opBurstMisses(this))) { G.save.flags.burstDone = 1; }
    const mode = weaponMode(G.save);
    if (mode === 'dual') return this.swirl();
    if (mode === 'joined') return this.throwJoined();
    this.chargeT = 0;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    this.burstImpactDone = false;
    sfx('chargedHit');
    // THE MOVE THE WHOLE CHARGE WAS FOR (owner, 2026-09-15: "no supercharge or
    // after effect"). Verified live: the release fired every time, but the
    // shared G.flash wash is deliberately dampened to 32% for ordinary hits
    // and stays dampened here too â€” cranking that shared multiplier would
    // brighten every regular hit in the game along with it. So the burst gets
    // its OWN bigger presence instead: three rings instead of two (one more
    // sweep to read), and both particle bursts roughly doubled in count and
    // size â€” this move's punch is now carried by things only IT fires.
    // Release is visible on a miss; confirmed damage owns the heavy pause.
    cam.shake = Math.max(cam.shake, 2);
    G.flash = Math.max(G.flash, 0.55);
    G.impact = { t: 0.16, t0: 0.16, x: cx, y: cy };
    G.addRing(cx, cy); G.addRing(cx, cy, 60); G.addRing(cx, cy, 130);
    // roarWave is the game's own proven "biggest moment" shockwave â€” already
    // used for boss roars and the Oath save. Her own supercharge earns the
    // same visual class rather than a smaller bespoke effect built to match.
    // a white edge over the kingdom's own light, so the wave is hers in every zone
    if (typeof roarWave === 'function') roarWave(cx, cy, '#ffffff', PAL[G.roomDef.zone].glow);
    // flagged so the body can draw the BURST plate rather than the ordinary
    // third-hit finisher â€” same combo number, different blow
    this.swingVis = { t: 0.32, t0: 0.32, ang: 0, combo: 3, charged: true, chargeArtAlt:mode==='claws' && this._chargeArtCount>0 && this._chargeArtCount%2===0, weaponMode: mode, wield: mode === 'single' ? 1 : 0 };
    this.startScratchWake(this.swingVis);
    burst(cx, cy, 60, '#ffffff', 460, 0.7, 180, 6, true);
    burst(cx, cy, 36, PAL[G.roomDef.zone].glow, 340, 0.9, 90, 6, true);
    // BIGGER HIT, FARTHER REACH (owner, 2026-09-18: "supercharge attack should
    // reduce more lives from enemies and have more reach"). 2.6 -> 3.2 on the
    // damage; 128 -> 165 on the radius, with the ring FX scaled to match so the
    // visible burst never undersells what it actually touches.
    const R = 165, dm = this.attackDmg('burst');
    const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
    for (const e of targets) {
      if (e.dead || e.disabled || e.rescued || (typeof isPet === 'function' && isPet(e))) continue;
      const ex = e.x + e.w / 2 - cx, ey = e.y + e.h / 2 - cy;
      const d = Math.hypot(ex, ey);
      if (d > R + Math.max(e.w, e.h) / 2) continue;
      // In particular, a charged claw must stop at a sage's song-lock and
      // a crystal burst must cleanse it, never bypass the shared harm rule.
      if (dealDmg(e, dm, armEl(), e.x + e.w / 2, e.y + e.h / 2, true, 'burst') <= 0) continue;
      e.hurtT = 0.2;
      const n = d || 1;
      attackKnock(e, 'burst', ex / n, ey / n);
      this.gainVolts(11);
      if (e.hp <= 0) e.die(ex / n, ey / n);
    }
    // shatter breakables caught in the burst
    const t0x = Math.floor((cx - R) / TILE), t1x = Math.floor((cx + R) / TILE);
    const t0y = Math.floor((cy - R) / TILE), t1y = Math.floor((cy + R) / TILE);
    for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++)
      if (tileAt(tx, ty) === 'B') G.breakTile(tx, ty);
    // ...and the pile over the first tunnel goes down three courses at once
    if (typeof rubbleHit === 'function')
      rubbleHit({ x: cx - R, y: cy - R, w: R * 2, h: R * 2 }, true);
    // THE PILLAR ANSWERS ONLY TO THIS. Ordinary claws glance off pure crystal
    // (see the swing's hint below); the supercharged claw is the quarry tool â€”
    // the owner's design, and the reason the burst was taught before the cave.
    // Shattering is once per save (flags.pl_*), and the shard goes into the
    // BAG so the inventory screen shows what she is carrying back to Ratchet.
    for (let i = G.statics.length - 1; i >= 0; i--) {
      const s = G.statics[i];
      if (s.type !== 'pillar') continue;
      const sx = s.x + s.w / 2, sy = s.y + s.h / 2;
      if (Math.hypot(sx - cx, sy - cy) > R + 60) continue;
      // He is posted on the marble. Evading him must not award a shard that
      // ghMigrate() would later interpret as proof he had already retreated.
      if (!pillarRewardReady(s)) continue;
      G.statics.splice(i, 1);
      G.save.flags['pl_' + (s.extra || 'cshard')] = 1;
      sfx('glass');
      cam.shake = Math.max(cam.shake, 11);
      G.flash = Math.max(G.flash, 0.65);
      G.hitStop = Math.max(G.hitStop, 0.1);
      burst(sx, sy, 42, '#ffffff', 400, 0.9, 160, 4, true);
      burst(sx, sy, 26, '#bfe9ff', 320, 1.2, 60, 3, true);
      if (typeof padRumble === 'function') padRumble(0.8, 0.7, 360);
      if (typeof questTake === 'function') questTake('cshard');
    }
    if (hasSkill('wave')) {
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2;
        G.projs.push(new Proj(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24,
          Math.cos(a) * 430, Math.sin(a) * 430, true, Math.round(8 * DF().pdmg), 7, PAL[G.roomDef.zone].glow, 0, 0.34));
      }
      sfx('wave');
    }
  }
  hitbox() {
    const s = this.swing;
    const n = Math.hypot(s.ax, s.ay) || 1;
    const down = s.ay > 0 && !s.ax;
    // the down box starts at the feet and is wider than it is deep, so landing on
    // something slightly to one side still rebounds
    // THE LONG RAKE, FOR REAL. 'reach' costs 50 IQ and promised the finisher a
    // longer arc; it swapped the ARC ART from 62 px to 104 px and never touched
    // this function, so the picture had been lying about where the claws were
    // since the day it shipped. The hitbox now grows with the drawing.
    const rk = s.combo === 2 && typeof hasSkill === 'function' && hasSkill('reach');
    // a sword out-reaches a paw: the crystal adds real length to every cut,
    // and the joined blade a little more. The DRAWN arc grows the same way
    // (drawRake), because a hitbox the picture does not admit to is the exact
    // lie the long-rake fix above was about.
    const wm = s.wield === 2 ? 1.35 : s.wield ? 1.2 : 1;
    // TWIN widens, it does not lengthen. The second blade covers the ground
    // either side of the first, so `half` grows and `R` does not â€” she is not
    // reaching further, she is filling more of what she can already reach.
    const tw = s.twin ? 1.45 : 1;
    // Ground claws now clear the body by 86px (jab/double) or 100px
    // (uppercut). Swords retain their longer ranges. The wake uses this box.
    // THE PLATE'S DIAGONAL POGO (C1) is a down-strike sent forward at 45
    // degrees: the plunge's own box, carried along the diagonal.
    // (ay > 0.5: a real down aim. A level swing built from an angle carries
    // sin(PI) = 1e-16 in ay, and that is not a plunge.)
    const diag = s.ay > 0.5 && !!s.ax;
    const plunge = down || diag;
    const claw = !s.wield && !plunge && !(typeof isHero==='function' && isHero());
    let R = (plunge ? 46 : (s.combo === 2 ? (rk ? (claw ? 76 : 68) : (claw ? 58 : 50)) : (claw ? 50 : 44))) * wm;
    let half = (plunge ? 32 : (s.combo === 2 ? (rk ? (claw ? 50 : 46) : (claw ? 42 : 35)) : (claw ? 36 : 30))) * wm * tw;
    // THE SEAL SHE FIGHTS WITH (CREST_ATTACK, js/game.js) lays its reach and
    // width over every weapon form the same way, after the weapon's own
    // factors. REACH IS THE FAR EDGE â€” where the cut stops, the thing a player
    // actually judges â€” so a x1.25 seal puts the far edge 25% further out and a
    // wider seal grows the cut across the aim without pushing that edge on.
    const blk = swingCrest(s), near0 = R - half;
    if (blk) { const far = (R + half) * blk.R; half *= blk.half; R = far - half; }
    const cx = this.x + this.w / 2 + s.ax / n * R;
    const cy = this.y + this.h / 2 + s.ay / n * R;
    // ax0/ay0 is the swing's ANCHOR â€” where R put the box before any edge rule
    // touched it. It is carried on the box because the twin's law is about the
    // anchor ("half grows, R does not") and the near-edge floor below moves the
    // box's geometric centre, so centre-of-box stopped being a witness for it.
    // R and half ride along too: the crest's cut is drawn from them (drawCrestEdge)
    const box = { x: cx - half, y: cy - half, w: half * 2, h: half * 2, ax0: cx, ay0: cy, R, half };
    // ...AND THE NEAR EDGE REACHES BACK TO HER OWN BODY.
    //
    // The box was centred R in front of her and R is 44 for a claw, so with
    // half at 30 it covered 14 to 74 px out â€” and anything that had closed
    // INSIDE 14 px was behind the claws and could not be hit at all. That is
    // the other half of the owner's report: the claw appearing past the enemy
    // rather than at a safe distance from it. A wolf that runs into her is the
    // commonest fight in the game and it was the one the hitbox could not
    // answer.
    //
    // Only the near edge moves. The far edge is the move's reach and stays
    // exactly where the drawing says it is â€” this does not extend her range, it
    // stops there being a dead ring around her feet.
    // A STRAIGHT DOWN- OR UP-CUT KEEPS ITS NEAR EDGE when a seal moves its far
    // one: the plunge's box starts at her feet, and a reaching seal must not
    // open a gap under them (the side cuts have the body rule just below).
    if (blk && !s.ax && near0 < R - half) {
      const d = (R - half) - near0;
      if (s.ay > 0) { box.y -= d; box.h += d; } else if (s.ay < 0) box.h += d;
    }
    if (!plunge) {
      const bx = this.x, bw = this.w;
      if (s.ax > 0 && box.x > bx + bw) { box.w += box.x - (bx + bw); box.x = bx + bw; }
      else if (s.ax < 0 && box.x + box.w < bx) { box.w += bx - (box.x + box.w); }
    }
    return box;
  }
  // Which side the nearest living thing she can fight is on, or 0 for none in
  // range. Sign only: this decides FACING, and a facing assist that also moved
  // her would be the game playing itself.
  nearestFoe(range) {
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    let best = null, bd = range * range;
    const consider = (e) => {
      if (!e || e.dead || e.tame || e.calm) return;
      const dx = (e.x + e.w / 2) - cx, dy = (e.y + e.h / 2) - cy;
      // vertical window: something on a shelf above her is not what this swing
      // is about, and turning to it would be worse than not turning at all
      if (Math.abs(dy) > 56) return;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = dx; }
    };
    for (const e of (G.enemies || [])) consider(e);
    if (G.boss) consider(G.boss);
    if (best == null) return 0;
    return best === 0 ? this.face : (best > 0 ? 1 : -1);
  }
  // The third argument is the point of this: WHAT hit her, by name. One
  // parameter turns "I think that attack is unfair" into a ranked table, and
  // the published heuristic is blunt â€” any single attack above about 40% of all
  // damage taken has a telegraph problem. Nothing is sent anywhere; it lives in
  // the run and is read from the console.
  hurt(d, fromX, src, foe) {
    if (this.dead || this.iT > 0) return;
    if (typeof combatIncoming === 'function') d = combatIncoming(d, foe, src);
    // A BLOW MET IN THE PARRY WINDOW is turned before anything is spent: no
    // core, no heat, no log entry. Only callers that name the attacker can be
    // parried, and only while that attacker shows the glint (js/parry.js).
    if (foe && typeof parryTry === 'function' && parryTry(this, foe, fromX)) return;
    this.grap = null;   // a hit knocks the claw loose
    this.soar = null;   // ...and ends a soar
    try {
      G.dmgLog = G.dmgLog || {};
      const key = src || 'unknown';
      G.dmgLog[key] = (G.dmgLog[key] | 0) + 1;
    } catch (e) {}
    if (this.dashT > 0 && hasCrest('phantom')) return;
    // THE GUARD (owner sheet, 2026-09-15: BLOCK/GUARD). Bracing CUTS the blow,
    // it does not stop it â€” a repeatable defensive option has to still cost
    // something or it trivializes every fight already tuned around dodging,
    // which a one-shot relic/the Oath above are not. GUARD_REDUCTION is a
    // first pass, not a tuned final number, and no boss tell is unblockable
    // yet â€” that is real follow-up work, not shipped by this change.
    const guarded = this.guardT > 0;
    // A BRACE SHE IS FACING INTO HOLDS. The cut above floored at ONE core â€”
    // and nearly everything in this game hits for one core â€” so a block was a
    // hit with a different sound. The owner: "blocking is not actually
    // blocking. Enemies were able to hit me when I'm blocking." Now a hit
    // that arrives from the side she faces is STOPPED: no core, a short shove,
    // sparks off the plate. What keeps it from replacing the dodge: it heats.
    // Three held blows inside two seconds BREAK the brace (guardBreakT) â€” the
    // third lands cut, and she cannot raise it again for 0.6 s. A blow from
    // BEHIND is cut, not stopped, as before. So against one machine the brace
    // is an answer; against a room of them, or a guardian's chain, it is a
    // beat she has to move out of. before â†’ after: min 1 core â†’ 0 core from
    // the front, cut from behind; break at GUARD_BREAK_HEAT.
    const pcx = this.x + this.w / 2, faceDir = this.faceVis || this.face || 1;
    const facing = guarded && (Math.sign(fromX - pcx) || faceDir) === faceDir;
    if (facing) {
      this.guardHeat = (this.guardHeat || 0) + GUARD_HEAT_PER_HIT;
      if (this.guardHeat < GUARD_BREAK_HEAT) {
        this.iT = 0.32;                       // contact cannot chain through a held plate
        this.hurtPoseT = 0.12; this.healT = 0;
        cam.shake = Math.max(cam.shake, 3); sfx('block');
        if (typeof padRumble === 'function') padRumble(0.4, 0.2, 110);
        G.flash = Math.max(G.flash, 0.12);
        burst(pcx + faceDir * 12, this.y + this.h * 0.45, 10, '#cfe0f0', 220, 0.35, 120, 2.2, true);
        const kb = 0.22;
        // ...and no hop: the brace needs her feet on the ground, so a block
        // that lifted her would drop the brace for the next blow of a chain
        this.vx = (typeof solidThrowDir === 'function' ? solidThrowDir(this, Math.sign(pcx - fromX) || -faceDir) : (Math.sign(pcx - fromX) || -faceDir)) * 250 * kb;
        return;
      }
      // the third: the plate gives. This blow lands cut, and the brace is down
      this.guardBreakT = GUARD_BREAK_T; this.guardHeat = 0;
      sfx('break'); cam.shake = Math.max(cam.shake, 6);
      burst(pcx + faceDir * 12, this.y + this.h * 0.45, 16, '#ffd76a', 260, 0.45, 160, 2.6, true);
    }
    if (guarded) d = Math.max(1, Math.round(d * (1 - GUARD_REDUCTION)));
    if (relicHas('aegis') && !G.save.usedAegis) {
      G.save.usedAegis = true;
      this.iT = 1.2;
      sfx('chargeReady');
      G.addRing(this.x + this.w / 2, this.y + this.h / 2);
      G.toast(t('rl_aegis'));
      burst(this.x + this.w / 2, this.y + this.h / 2, 16, '#ffd76a', 240, 0.5, 200, 3, true);
      return;
    }
    // THE OATH â€” what the lion owes her for not finishing it. Once per room,
    // the blow that would leave her on her last core is answered instead: it
    // comes out of the dark, roars everything off her, and is gone. Deliberately
    // a SAVE and not a stat, so the tame reward is a different KIND of power
    // from the +18% the kill hands out rather than a bigger or smaller number.
    if (G.save.flags && G.save.flags.oath && !this.oathUsed && this.cores - d <= 1 && this.cores > 1) {
      this.oathUsed = true;
      this.iT = 1.6; this.healT = 0;
      const cx0 = this.x + this.w / 2, cy0 = this.y + this.h / 2;
      if (typeof roarWave === 'function') roarWave(cx0, cy0, '#ffb347');
      sfx('roar_beast'); cam.shake = Math.max(cam.shake, 9);
      G.hitStop = Math.max(G.hitStop, 0.12);
      if (typeof padRumble === 'function') padRumble(0.7, 0.9, 320);
      for (const e of G.enemies) {
        if (e.dead || e.disabled || e.rescued) continue;
        const dx0 = e.x + e.w / 2 - cx0, dy0 = e.y + e.h / 2 - cy0;
        const dd = Math.hypot(dx0, dy0);
        if (dd > 250) continue;
        e.kbT = 0.45; e.stagT = Math.max(e.stagT || 0, 0.8);
        e.vx += (dx0 / (dd || 1)) * 520; e.vy = -260;
      }
      for (let i = 0; i < 26; i++)
        addPart(cx0 + rnd(-30, 30), cy0 + rnd(-20, 20), rnd(-160, 160), rnd(-180, 60),
          rnd(0.5, 1), chance(0.5) ? '#ffb347' : '#ffe0a8', rnd(2.4, 4), 120, true);
      G.toast(t('oath_fire'));
      return;
    }
    if (typeof dmgNote === 'function') dmgNote(src, d);   // what actually cost her cores (js/dmglog.js)
    this.cores -= d; this.iT = hasSkill('reflex') ? 1.65 : 1.3; this.healT = 0;
    if (typeof combatLog === 'function') combatLog(this, d, Math.min(this.cores + d, d), src || 'incoming', 'hero-hit');
    this.hurtPoseT = guarded ? 0.15 : 0.3;   // limbs flail for a beat while the knockback carries her
    cam.shake = guarded ? 4 : 9; sfx(guarded ? 'block' : 'hurt');
    if (typeof padRumble === 'function') padRumble(guarded ? 0.5 : 0.85, guarded ? 0.3 : 0.5, guarded ? 140 : 240);
    G.flash = Math.max(G.flash, guarded ? 0.2 : 0.4); G.addRing(this.x + this.w / 2, this.y + this.h / 2);
    G.impact = { t: 0.09, t0: 0.09, x: this.x + this.w / 2, y: this.y + this.h / 2 };
    burst(this.x + this.w / 2, this.y + this.h / 2, 14, '#ff5f6d', 260, 0.5, 500, 3, true);
    // BEING HIT IS AN EVENT TOO (owner, 2026-11-14, from the fight film: "when
    // the lion is hitting me, I'm not actually being hit with a step back and
    // frozen moment and flash"). The blow cost a core, shook the camera and
    // threw her â€” but the world never STOPPED for it, and her own body never
    // lit, so a hit read as a number going down. Now the frame freezes on the
    // contact (longer for a guardian's blow than a crawler's), she flashes
    // white and then red (drawHeroHitFlash, js/combat-stats.js), and the hit's
    // light bursts where it landed â€” and only then does the knockback below
    // carry her off. A braced hit gets the short version: she held.
    {
      // a guardian's blow, by whichever road it arrived: a named attacker, a
      // source tagged with a guardian's kind, or â€” its body simply hitting hers,
      // which carries no source at all â€” a living guardian standing on her
      const gb = typeof G !== 'undefined' && G.boss && !G.boss.dead && G.boss.st !== 'dorm' ? G.boss : null;
      const onHer = gb && Math.abs(gb.x + gb.w / 2 - pcx) < gb.w / 2 + this.w / 2 + 48
        && Math.abs(gb.y + gb.h / 2 - (this.y + this.h / 2)) < gb.h / 2 + this.h / 2 + 48;
      const big = (typeof Boss !== 'undefined' && foe instanceof Boss) || onHer
        || /^(glitch|alpha|brood|zero|atlas|prism|horn|mother|chime|carrier|moth|lattice|lens)\./.test(String(src || ''));
      G.hitStop = Math.max(G.hitStop || 0, guarded ? 0.04 : big ? 0.13 : 0.09);
      this._bigHit = big && !guarded;
      const now = performance.now();
      this.hitFlashAt = now; this.hitFlashUntil = now + (guarded ? 110 : 230);
      if (typeof fx === 'function')
        fx('flash', this.x + this.w / 2, this.y + this.h * 0.45, { rx: big ? 130 : 95, ry: big ? 130 : 95, dur: 0.24, col: '#ff5f6d', hot: '#ffffff', power: guarded ? 0.7 : 1.15 });
      // ...AND IT RINGS (owner, 2026-11-14: "hitting the enemy or the enemy hits
      // me will produce the frozen moment with flash sound clashing"). She is
      // metal too: the same clash a struck machine gives, under her own cry.
      if (!guarded && typeof sfx === 'function' && now - (G.clashAt || 0) > 70) { G.clashAt = now; sfx('clash'); }
      // a guardian's blow is the bigger event on every channel, not only the freeze
      if (big && !guarded) {
        cam.shake = Math.max(cam.shake, 12);
        if (typeof padRumble === 'function') padRumble(1, 0.75, 320);
      }
    }
    // a braced hit still shoves her, just far less â€” she stood her ground,
    // she was not thrown by it
    const kbm = (relicHas('ember') ? 0.5 : 1) * (guarded ? 0.35 : 1);
    // (away from the blow â€” unless that is INTO the machine she is standing against: js/solid.js)
    const throwDir = Math.sign(this.x + this.w / 2 - fromX) || 1;
    // a guardian's blow throws her further than a crawler's: about 60 px against 40
    const heavy = this._bigHit ? 1.35 : 1; this._bigHit = false;
    this.vx = (typeof solidThrowDir === 'function' ? solidThrowDir(this, throwDir) : throwDir) * 250 * kbm * heavy; this.vy = -240 * kbm;
    this.knockT = guarded ? 0 : heavy > 1 ? 0.2 : 0.16;
    if (this.cores <= 0 && hasCrest('nine') && !G.save.usedNine) {
      G.save.usedNine = true; this.cores = 3; this.iT = 2.2;
      sfx('win'); G.toast(t('c_nine'));
      burst(this.x + this.w / 2, this.y + this.h / 2, 26, '#ffd76a', 300, 0.8, 100, 4, true);
      return;
    }
    if (this.cores <= 0) this.die();
  }
  die() {
    if (this.dead) return;
    this.dead = true;
    G.boomer = null; this.swirlT = 0; this.chargeT = 0;
    this.swing = null; this.swingVis = null;
    if (typeof hzdRelease === 'function') hzdRelease();
    this.deathAnimT = 1.6;   // the destroyed row plays out while the wreck settles sfx('wreck');
    burst(this.x + this.w / 2, this.y + this.h / 2, 40, '#8ff6ff', 340, 0.9, 300, 4, true);
    G.onPlayerDeath();
  }
  // Odyssey hero â€” real hand-animated character art (CC0, ansimuz), with the
  // code-drawn rig kept as an automatic fallback until the sheets decode.
  // Which authored plate she is in RIGHT NOW.
  //
  // Ordered by what overrides what, and the order is the design: a state her
  // body is PUT INTO (hurt, healing, singing) beats one she chose (running),
  // because the read the player needs is the one she is not in control of.
  // Everything below the airborne test is a ground state, so the test for
  // "is she on the floor" sits in the middle rather than at the top.
  heroState(run) {
    if (this.hurtPoseT > 0) return 'hurt';
    if (this.healT > 0) return 'heal';
    if (this.songT > 0) return 'song';
    if (this.swingVis) {
      // releaseCharged() flags its own swing: the charged blow is a BURST, a
      // different drawing from the third hit of an ordinary combo.
      return heroSwingState(this.swingVis);
    }
    // THE WOLVERINE CROSS (owner report #2). The charge pose is arms crossed at
    // the chest, body UPRIGHT, feet neutral â€” verified against cell 16 of the
    // sheet, which was re-fired that way. Upright matters because this pose
    // composites over a JUMP: the old crouch was a grounded pose drawn in
    // mid-air, and a character crouching while airborne reads as a bug, which
    // is what "can't stay crouching and jump and charged at the same time"
    // was describing. No code change is needed for it â€” the plate is the pose.
    if (this.chargeT > 0.05 && this.on && Math.abs(this.vx) <= 34) return 'charge';
    if (this.guardT > 0) return 'guard';
    // the claw's reel is drawn as her dash plate: the same low driving pose, held
    if (this.grap && this.grap.st === 'pull') return 'dash';
    if (this.dashT > 0) return 'dash';
    if (this.wallSlide !== 0 && !this.on) return 'wall_cling';
    if (!this.on) {
      // A ONE-FRAME DROP IS NOT A FALL. Stepping off a lip, cresting a mound,
      // any bump in the floor takes her off the ground for a frame or two, and
      // swapping to an airborne plate for that long is a flicker rather than a
      // pose â€” the airborne cells are drawn centred instead of from the foot, so
      // she jumps and grows every time it happens. The jump already has a 0.1 s
      // coyote grace; the DRAWING never used it.
      //
      // A real jump is unaffected: it leaves the ground rising, and the guard
      // only holds while she is not (vy >= 0).
      const hop = this.coyote > 0 && this.vy >= 0;
      if (!hop) {
        if ((this.boostT || 0) > 0) return 'djump_jet';
        if (this.vy < -140) return 'rise';
        if (this.vy < 140) return 'apex';               // the hang, both ways through zero
        return 'fall';
      }
    }
    if (this.skidT > 0) return 'skid';
    if (this.landT > 0 && Math.abs(this.vx) <= 34) return 'land';
    // one core left and standing still: the carriage sags. Moving cancels it â€”
    // a limp that survives a sprint reads as a bug, not as damage.
    if (this.cores <= 1 && Math.abs(this.vx) < 20) return 'slump';
    if (Math.abs(this.vx) > 12) {
      // THE RUN PAIR, RE-FIRED AND UNPARKED (2026-08-20). The last firing
      // failed three ways â€” long legs, a facing that read backward, and a
      // second pose that was a LEAP, so the cycle hopped rather than ran. The
      // new pair keeps the short legs and the house facing, and its two poses
      // are CONTACT and PASSING: the opposite steps of one stride.
      //
      // Cycled on the same speed-driven stride phase the walk uses, so
      // crossing the walk/run threshold lands on a footfall instead of a pop â€”
      // the two gaits share a clock rather than each keeping their own.
      // FOUR BEATS AT A WALK. Two poses flipped at stride cadence is a
      // flipbook: the same leg leads every step, so she hops rather than
      // walks. A stride is contact -> passing -> OPPOSITE contact -> passing,
      // and walk_c is the fired opposite contact. The passing pose serves both
      // halves â€” at cycle speed no eye separates a left-foot pass from a
      // right-foot pass drawn the same, and firing a second one would buy a
      // frame nobody can see.
      const k = [0, 1, 2, 1][Math.floor(this.stridePh || 0) % 4];
      if (Math.abs(this.vx) > HERO_RUN_VX) {
        // THE RUN STAYS ON TWO. run_c came back off-model and is benched, not
        // deleted: measured against run_a and run_b at the same figure height
        // (130px) its skull is 72 cell-pixels wide against their 60 and 56 â€”
        // a quarter wider â€” its ears are longer and thinner, and its whiskers
        // are two marks on one cheek where the rest of the sheet carries
        // three plus the far pair. Cycled in, her head would swell every
        // fourth frame. The cell is keyed and the brief is on THE FIRING LIST
        // (ART_QUEUE Â§1g); the day an on-model one lands, this becomes
        // ['run_a', 'run_b', 'run_c'][k] and the run has four beats too.
        return k === 1 ? 'run_b' : 'run_a';
      }
      return ['walk_a', 'walk_b', 'walk_c'][k];
    }
    return 'idle';
  }
  // Draw the authored plate for the current state. Returns false if the sheet
  // has not loaded, so the caller falls back to the procedural body rather than
  // drawing nothing â€” the same contract drawAtlas() has with the guardians.
  //
  // Facing, squash, lean and the pirouette are ALREADY in the transform by the
  // time this runs (see the c.scale at the top of draw()), so this draws her
  // square-on at the origin and inherits all of it. That does mean a leftward
  // facing mirrors the plate and flips its lit side; the procedural body has
  // always been mirrored the same way, so this matches what shipped rather
  // than introducing a new inconsistency.
  // THE SWING IS A MOVE, NOT A POSE â€” and this file already proved the point
  // for the other game. drawHeroSprite steps six frames across the swing with
  // Math.floor(p * n); heroState() returns ONE cell name for the cat and never
  // reads swingVis.t, so her body holds a single drawing for all 240 ms of a
  // blow and then snaps back. The owner: "it should transition in milliseconds
  // from one frame to another... what you're doing is three kind of hits with
  // three moves that changes from still to hit without transitions in between."
  //
  // The blade made it worse rather than covering it: swAng sweeps the sword
  // through the arc with p, so the weapon travelled while the body behind it
  // stood still â€” a moving blade on a frozen body reads as a sticker dragged
  // across the screen, which is why the sword felt faker than the claw.
  //
  // ONE STRIP PER ATTACK, indexed by the swing's own progress. Falls through to
  // the pose cell whenever the strip is not here yet, which is the same
  // contract every other authored renderer in this file keeps.
  drawRoboSwing(c) {
    this._authoredSwingFx = null;
    const sv = this.swingVis;
    if (!sv) return false;
    const weapon = heroWeaponSwing(sv);
    const ready = weapon && typeof MEDIA_RAW !== 'undefined' && MEDIA_RAW[weapon.key] && MEDIA_RAW[weapon.key].naturalWidth;
    if (weapon && !ready && typeof mediaFetch === 'function') mediaFetch(weapon.key,1);
    if (sv.swirl && !ready) return false;
    const S = ready ? weapon : sv.chargeArtAlt ? SWING_STRIP.burstLegacy : SWING_STRIP[heroSwingState(sv)];
    if (!S || !S.cells) return false;      // unfired: the pose cell covers it
    const p = clamp(1 - sv.t / sv.t0, 0, 0.999);
    // THE CELL IS SIZED TO THE SHEET, NOT TO ITSELF â€” see SWING_STRIP: each
    // strip carries its own measured k, because drawing them all at HERO_DH
    // makes her shrink or swell the instant she attacks.
    const h = HERO_DH * S.k;
    // a pingpong strip is the strike alone: out through the cells, then back
    let cell = S.order ? S.order[Math.min(S.order.length-1,Math.floor(p*S.order.length))] : S.pingpong
      ? (p < 0.5 ? Math.floor(p * 2 * S.cells) : Math.floor((1 - p) * 2 * S.cells))
      : Math.floor(p * S.cells);
    if(S===SWING_STRIP.down && this.on)cell=4+Math.min(1,Math.floor(p*2));
    const drew = drawStripCell(c, S.key, Math.min(S.cells - 1, cell), S.cells,
                               0, HERO_FLOOR, h, false);
    // ...and the energy over the top of it, on the same clock. Only if the BODY
    // drew: an effect hanging in the air beside the procedural fallback pose is
    // worse than no effect, and this is the one strip whose art is optional.
    const worldScratch = !sv.wield && !sv.air && !sv.swirl &&
      typeof MEDIA_RAW !== 'undefined' && MEDIA_RAW.swingSingleFx?.naturalWidth;
    if (drew && S.fx && !worldScratch) {
      const cue = S.fxPoses ? S.fxPoses[cell] : undefined;
      if (cue) this.drawSwingFx(c,S.fx,{from:cue[0],to:cue[0]},0,cue[1],HERO_FLOOR-HERO_DH/2+cue[2],cue[3]);
      else if (cue !== null) this.drawSwingFx(c, S.fx, S.fx.release, p,
                      S.fx.dx, HERO_FLOOR - HERO_DH / 2 + S.fx.dy, S.fx.size);
      if (typeof MEDIA_RAW !== 'undefined' && MEDIA_RAW[S.fx.key]?.naturalWidth) this._authoredSwingFx = sv;
    }
    return drew;
  }
  // A scratch leaves light in the air after her paw has returned. This is
  // visual only; damage remains in the existing swing/contact code.
  startScratchWake(sv) {
    if ((typeof isHero==='function' && isHero()) || !sv || sv.wield || sv.air || sv.swirl ||
        (sv.weaponMode && sv.weaponMode !== 'claws')) return;
    const angle=sv.charged?(this.face<0?Math.PI:0):(sv.ang||0);
    const ax=Math.cos(angle), ay=Math.sin(angle);
    let reach=165;
    if (!sv.charged) {
      const old=this.swing;
      // the seal's reach too (C1): the wake's tip is where the claws really reach
      this.swing={ax,ay,combo:sv.combo,wield:0,crest:sv.crest};
      const box=this.hitbox();this.swing=old;
      // Rectangular contact geometry projected onto the direction of the cut.
      const cx=this.x+this.w/2,cy=this.y+this.h/2;
      reach=Math.max(...[[box.x,box.y],[box.x+box.w,box.y],
        [box.x,box.y+box.h],[box.x+box.w,box.y+box.h]].map(([x,y])=>(x-cx)*ax+(y-cy)*ay));
    }
    const duration=sv.t0+.18;
    this.scratchWake={t:duration,t0:duration,attackT:sv.t0,combo:sv.combo,
      charged:!!sv.charged,ang:angle,reach,x:this.x+this.w/2,y:this.y+this.h/2};
    if(typeof mediaFetch==='function')mediaFetch('swingSingleFx',1);
  }
  scratchWakeReady() {
    const w=this.scratchWake,im=typeof MEDIA_RAW!=='undefined'&&MEDIA_RAW.swingSingleFx;
    return !!(w&&im&&im.complete&&im.naturalWidth);
  }
  // pass 'glow' (the slash layer's duplicate, D1): the same strip, a size up,
  // softened, at under half strength â€” a halo with the cut's own shape
  drawScratchWake(c, pass) {
    const w=this.scratchWake,im=typeof MEDIA_RAW!=='undefined'&&MEDIA_RAW.swingSingleFx;
    if(!w||!im?.complete||!im.naturalWidth)return false;
    const glowK = pass === 'glow' ? SLASH_GLOW.alpha : 1;
    if (G.slashPasses) G.slashPasses.push({ layer: 'scratch', pass: pass || 'base' });
    const age=w.t0-w.t,p=clamp(age/w.attackT,0,1);
    const gate=w.charged?1:clamp((age-.025)/.035,0,1);
    const fade=age>w.attackT?Math.pow(clamp(w.t/.18,0,1),1.5):1;
    // Follow the active paw, then leave the recovery wake at the strike site.
    if(age<w.attackT*.7){w.x=this.x+this.w/2;w.y=this.y+this.h/2;}
    c.save();c.translate(w.x,w.y);
    // Mirroring leaves the rising crescent rising for either facing.
    const left=Math.cos(w.ang)<0;c.rotate(left?Math.PI-w.ang:w.ang);c.scale(left?-1:1,1);
    if (pass === 'glow') { c.scale(SLASH_GLOW.scale, SLASH_GLOW.scale); c.filter = 'blur(' + SLASH_GLOW.blur + 'px)'; }
    const cw=im.naturalWidth/6;
    c.globalCompositeOperation='lighter';
    const paint=(frame,near,far,height,y,alpha)=>{
      c.globalAlpha=gate*fade*alpha*glowK;
      // The authored FX occupies the centre 88% of its padded cell.
      c.drawImage(im,frame*cw+cw*.06,im.naturalHeight*.06,cw*.88,im.naturalHeight*.88,
        near,y-height/2,far-near,height);
    };
    const tip=w.reach,near=12;
    // PLAY THE STRIP (owner, 2026-09-19: "animate the blue after effect that
    // comes when attacking"). single_fx.webp is an authored six-cell SEQUENCE â€”
    // gather, twist, sweep, cut, burst, wisp â€” and this was holding cell 4, the
    // burst, as a still for the whole wake, with one more still stacked under
    // it per combo. Reach-accurate, and frozen. Now the frame follows the cut:
    // 0..5 across the attack (about 40 ms a cell at the jab's tempo), the wisp
    // held through the recovery and fading with it, and the previous cell left
    // underneath at lower alpha so consecutive frames read as one motion rather
    // than six pictures. The geometry the tests measure is untouched: the tip
    // lands at contact reach, the cut faces the target, mirroring is as before.
    const seq=6, f=age<w.attackT?Math.min(seq-1,Math.floor(p*seq)):seq-1;
    const prev=Math.max(0,f-1), trail=f>0?.42:0;
    if(w.charged){
      paint(prev,near+16,tip-8,124,-10,trail);
      paint(f,near,tip,145,0,.9);
      // releaseCharged already emits the radial rings and contact particles.
    }else if(w.combo===2){
      // the uppercut rises: the cell is lifted and tall, the trail hangs below it
      paint(prev,near+8,tip,86,-4,trail);
      paint(f,near,tip,132,-30,.9);
    }else if(w.combo===1){
      paint(prev,near+8,tip,66,7,trail);
      paint(f,near,tip,74,-8,.88);
    }else{
      paint(prev,near+6,tip-4,44,2,trail);
      paint(f,near,tip,48,0,.85);
    }
    c.filter = 'none';
    c.restore();return true;
  }
  // ADDED AS LIGHT, NOT COMPOSITED AS AN OBJECT. The plates are energy on
  // transparency, so 'lighter' is what they are: the dark of the sheet adds
  // nothing and the core blows out to white the way a real arc would. Centred
  // rather than foot-anchored â€” an arc does not stand on the floor.
  // THE CENTRE IS PASSED IN, because the two callers are in different spaces and
  // that is not obvious from either of them. The swing draws inside
  // drawRoboPlate's transform, where the units are the strip cell's and facing
  // is already applied outside; the charge draws from draw() in WORLD units,
  // where it is not. Baking either one in here put the crackle at a plausible
  // but wrong size in whichever caller did not own the constants.
  drawSwingFx(c, FX, range, p, cx, cy, size) {
    // The globals are REACHED FOR, not assumed. drawRoboPlate already guards
    // MEDIA_IMG this way and for the same reason: the combat harnesses run this
    // file in a bare VM with drawStripCell stubbed and no media layer at all, so
    // an unguarded MEDIA_RAW here is a crash rather than a missing effect â€” and
    // an effect that cannot be drawn is always allowed to simply not draw.
    if (typeof MEDIA_RAW === 'undefined') return;
    const im = MEDIA_RAW[FX.key];
    if (!im || !im.complete || !im.naturalWidth) {
      if (typeof mediaFetch === 'function') mediaFetch(FX.key, 1);
      return;
    }
    const cw = im.naturalWidth / FX.cells;
    const n = range.to - range.from + 1;
    const i = range.from + clamp(Math.floor(p * n), 0, n - 1);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = FX.alpha;
    if(FX.rotation){c.translate(cx,cy);c.rotate(FX.rotation);cx=0;cy=0;}
    c.drawImage(im, i * cw, 0, cw, im.naturalHeight,
                cx - size / 2, cy - size / 2, size, size);
    c.restore();
  }
  // ONE TRANSITION CLIP, indexed by the clock that made the transition happen.
  // Returns false whenever the art for this moment is not fired, which is most
  // of them for now â€” and false here means the pose cell draws, exactly as it
  // always did. Nothing about the physics or the state machine changes; this
  // only decides what is on screen while a state the game already entered
  // plays out.
  drawRoboTrans(c, st) {
    // THE PUSH COMES FIRST, because by the time takeoffT is running she is
    // already airborne and `st` already says 'rise' â€” the air arc would take the
    // frame and the launch would never be seen. Foot-anchored, not centred like
    // the air cells: movestrip stands every cell on the cell floor, and the coil
    // reads as a push off the ground rather than a pose in mid-air.
    const TK = HERO_TAKEOFF;
    if (TK && TK.cells && this.takeoffT > 0 && this.landT <= 0
        && (st === 'rise' || st === 'apex' || st === 'fall')) {
      const t0 = this.takeoff0 || 0.12;
      const p = clamp(1 - this.takeoffT / t0, 0, 0.999);
      if (drawHeroMotionCell(this, c, TK.key, p * (TK.cells - 1), TK.cells,
                             0, HERO_FLOOR, HERO_DH * TK.k, false)) return true;
    }
    const A = HERO_AIR_STRIP;
    if (A && (st === 'rise' || st === 'apex' || st === 'fall')) {
      // her own vertical speed is the position in the arc
      const p = clamp((this.vy + A.up) / (A.up + A.down), 0, 1);
      const h = HERO_DH * A.k;
      // airborne cells are centred rather than stood on the floor, and a strip
      // cell is anchored at its bottom â€” so the bottom goes half a cell below
      // the same centre the pose cells use
      return drawHeroMotionCell(this, c, A.key, p * (A.cells - 1), A.cells, 0, -18 + h / 2, h, false);
    }
    // the gait loops: one full stride is the four beats the pose cycle steps
    // through ([0,1,2,1] in heroState), so the strip wraps on stridePh % 4
    if (st === 'walk_a' || st === 'walk_b' || st === 'walk_c'
        || st === 'run_a' || st === 'run_b' || st === 'run_c') {
      const Gt = HERO_GAIT && (Math.abs(this.vx) > HERO_RUN_VX ? HERO_GAIT.run : HERO_GAIT.walk);
      if (Gt && Gt.cells) {
        // the loop may be a RANGE of the strip (a take cut longer than one stride)
        const from = Gt.from || 0, to = Gt.to == null ? Gt.cells - 1 : Gt.to, n = to - from + 1;
        const cell = from + (((this.stridePh || 0) % 4 + 4) % 4) / 4 * n;
        if (drawHeroMotionCell(this, c, Gt.key, cell, Gt.cells, 0, HERO_FLOOR, HERO_DH * (Gt.k || 1), false)) return true;
      }
    }
    // Keep the supplied expressive idle in every idle mood. A mood changes
    // only the eye lights; it must not swap the entire body for an old still.
    const I = HERO_IDLE;
    const clip = heroIdleClip(this.idleT || 0);
    if (I && I.cells && st === 'idle' && this.on && !clip.fidget) {
      const cell = clip.cell;
      const h = HERO_DH * (I.k || 1), flip = this.faceVis < 0;
      if (drawHeroMotionCell(this, c, I.key, cell, I.cells, 0, HERO_FLOOR, h, flip)) {
        if (this.heroMood(st) !== 'calm') {
          // Measured light centres in each supplied 320px cell.
          const e = [[141,170,173,170],[146,169,180,170],[147,172,178,170],
            [140,175,175,175],[178,173,205,172],[140,171,171,171],
            [151,172,183,170],[143,171,173,171]][Math.floor(cell)];
          c.save(); if (flip) c.scale(-1,1);
          this.drawHeroEyes(c,st,h,h,HERO_FLOOR-h,
            {lx:e[0]/320,ly:e[1]/320,rx:e[2]/320,ry:e[3]/320,ew:18/320,eh:20/320});
          c.restore();
        }
        return true;
      }
    }
    const P = HERO_IMPATIENT;
    if (P && st === 'idle' && clip.imp
      && drawHeroMotionCell(this, c, P.key, clip.cell, P.cells, 0, HERO_FLOOR, HERO_DH * (P.k || 1), false)) return true;
    const F = HERO_FIDGET;
    if (F && st === 'idle' && clip.fidget) {
      // the scripted bout (HERO_FIDGET_BEATS), not the strip run end to end
      const cell = clip.cell;
      if (drawHeroMotionCell(this, c, F.key, cell, F.cells, 0, HERO_FLOOR, HERO_DH * (F.k || 1), this.faceVis < 0)) return true;
    }
    // THE WALL SLIDE IS HELD, NOT TIMED: it loops on its own clock for as
    // long as she clings, the way the fidget does, so it is not in the table.
    const Wl = HERO_WALL_STRIP;
    if (Wl && Wl.cells && st === 'wall_cling') {
      const cell = Math.floor((this.wallT || 0) * (Wl.fps || 10)) % Wl.cells;
      // NOT flipped here: the body transform already mirrors with her facing,
      // and on a wall she faces the wall â€” so the plate's wall-at-right lands
      // on whichever side the wall is. (The fidget cancels that flip because
      // it is a front view; this is a profile and must keep it.)
      if (drawHeroMotionCell(this, c, Wl.key, cell, Wl.cells, 0, HERO_FLOOR, HERO_DH * (Wl.k || 1), false)) return true;
    }
    const T = HERO_TRANS[st];
    if (!T || !T.cells) return false;
    const t = T.t(this), t0 = T.t0(this);
    if (!(t > 0) || !(t0 > 0)) return false;
    const p = clamp(1 - t / t0, 0, 0.999);
    return drawHeroMotionCell(this, c, T.key, p * (T.cells - 1), T.cells,
                         0, HERO_FLOOR, HERO_DH * T.k, false);
  }
  drawRoboRecharge(c) {
    const rc=G.recharge;
    if(!rc || this.dead)return false;
    const phase=rc.phase==='dock'?Math.max(0,Math.min(.999,1-rc.dockT/rc.dock0)):
      Math.max(0,Math.min(.999,1-rc.t/rc.dur));
    const frame=rc.phase==='dock'?Math.floor(phase*4):4+Math.floor(phase*4);
    return drawStripCell(c,'heroRecharge',frame,8,0,HERO_FLOOR,HERO_DH*HERO_DELIVERY_K,false);
  }
  drawRoboCharge(c) {
    if (this.dead || this.hurtPoseT > 0 || this.dashT > 0 || this.swingVis ||
        !this.on || Math.abs(this.vx)>34 || this.chargeT <= .08 || G.boomer) return false;
    const mode=weaponMode(G.save);
    if(mode==='joined')return false;
    const S=HERO_WEAPON_CHARGES[mode] || (this._chargeArtCount>0 && this._chargeArtCount%2===0 ? SWING_STRIP.burstLegacy : SWING_STRIP.burst);
    const count=mode==='single'||mode==='dual'?3:6;
    const frame=Math.min(count-1,Math.floor(this.chargeT/.12));
    return drawStripCell(c,S.key,frame,S.cells,0,HERO_FLOOR,HERO_DH*S.k,false);
  }
  drawRoboJoinedThrow(c) {
    if (this.dead || this.hurtPoseT > 0 || this.dashT > 0 || this.swingVis) return false;
    let frame = -1;
    if (this.throwPoseT > 0 && G.boomer) frame=3; // actual released weapon means empty paws
    else if (this.catchPoseT > 0 && !G.boomer) frame=this.catchPoseT>.09?4:5;
    else if (!G.boomer && this.on && Math.abs(this.vx)<=34 && this.chargeT>.08 && weaponMode(G.save)==='joined')
      frame=Math.min(2,Math.floor(this.chargeT/.2));
    if(frame<0)return false;
    return drawStripCell(c,'heroJoinedThrow',frame,6,0,HERO_FLOOR,HERO_DH*HERO_DELIVERY_K,false);
  }
  drawRoboPlate(c, run) {
    c.save();
    c.scale(HERO_SCREEN_SCALE, HERO_SCREEN_SCALE);
    try {
    if (typeof MEDIA_IMG === 'undefined') return false;
    // the swing plays its own strip when one is fired for that attack; it
    // returns false until the art lands and the pose cell covers it meanwhile
    if (typeof G !== 'undefined') G.lastStrip = null;
    if (this.drawRoboRecharge(c)) { G.heroDrawn=G.lastStrip; return true; }
    if (this.drawRoboJoinedThrow(c)) { G.heroDrawn=G.lastStrip; return true; }
    if (this.drawRoboCharge(c)) { G.heroDrawn=G.lastStrip; return true; }
    if (this.swingVis && this.drawRoboSwing(c)) { this._motionPose = null; this._motionBlend = null; if (typeof G !== 'undefined') G.heroDrawn = G.lastStrip; return true; }
    const st = this.heroState(run);
    // ...and every other moment the body is mid-change plays its clip the same
    // way, for the same reason, with the same fallback
    if (this.drawRoboTrans(c, st)) { if (typeof G !== 'undefined') G.heroDrawn = G.lastStrip; return true; }
    // SHE IS THE SAME CAT IN EVERY POSE. Every cell is drawn at HERO_DH, which
    // is the CELL's height and not hers â€” so a pose whose figure fills more of
    // its cell arrives on screen as a bigger character. Measured across the
    // sheet, the charge cell is 72x131 against a median of 120x131 and an idle
    // of 77x117: standing to charge made her 12% TALLER than standing still and
    // no wider, which is exactly the owner's "becomes slimmer". Corrected back
    // to her idle height. Only the poses that were measured wrong are listed â€”
    // a crouch is legitimately shorter and a jump stretch legitimately longer,
    // and normalising those would flatten the animation rather than fix it.
    // Critical motion never falls through to retired pose sheets. A missing
    // essential gait sheet also actively re-requests the asset rather than
    // waiting on the passive lazy fetch.
    if (/^(walk_|run_)/.test(st) || ['rise','apex','fall','land','dash','skid','wall_cling'].includes(st)) {
      if (/^(walk_|run_)/.test(st) && typeof requestHeroArt === 'function') requestHeroArt();
      if (typeof G !== 'undefined') G.heroDrawn = 'loading:' + st;
      return true;
    }
    const im = MEDIA_IMG.heroStates;
    if (!im) return false;
    const cw = im.width / HERO_CELLS, ch = im.height;
    this._motionPose = null; this._motionBlend = null;
    const col = HERO_CELL[st] || 0;
    // the pose cell drew her: say so, so the diag panel can tell a strip
    // that has not arrived from a strip that is not wired
    if (typeof G !== 'undefined') G.heroDrawn = 'sheet:' + st;
    const dh = HERO_DH * (HERO_POSE_K[st] || HERO_DELIVERY_K), dw = dh * (cw / ch);
    // grounded cells stand on the cell's floor line; airborne cells are centred
    const dy = HERO_AIR[st] ? -dh * 0.5 - 18 : -dh + HERO_FLOOR;
    c.save();
    // THE ROBOT HURRY â€” LEAN REMOVED (owner report #5, 2026-08-21). The bounce
    // went first; the forward lean was kept on the argument that it is a
    // carriage rather than a cycle, and that argument was wrong. The authored
    // plates already carry their own lean â€” cell by cell, drawn by someone who
    // could see the whole body â€” so rotating the composited result on top of
    // them tips the HEAD through an arc every time the pose flips. That is the
    // "moving the whole body, making it smaller and bigger" the owner reported:
    // a rotation about the feet swings the top of a 60-unit sprite sideways and
    // its bounding box in and out, which the eye reads as scale.
    //
    // Nothing rotates the body here any more. `moving` is still computed
    // because the registration below is a locomotion-only correction.
    const moving = this.on && Math.abs(this.vx) > 12 && !this.swingVis
      && this.dashT <= 0 && this.landT <= 0 && this.skidT <= 0
      && this.hurtPoseT <= 0 && this.healT <= 0 && this.chargeT <= 0.05;
    // REGISTRATION: the two walk plates were fired as independent stills and
    // their heads do not sit at the same x (measured: centers 14.6px apart in
    // the 160px cell). Flipped raw at run cadence that is a strobing head â€”
    // the owner's "head is over-mobile". These offsets pull each plate so the
    // HEAD holds still and the legs do the moving, which is how a walk reads.
    const reg = HERO_REG[st];
    if (reg) c.translate(reg * dw, 0);
    // FOOT-PLANT LOCK. The plate translated with the body while the legs
    // flipped underneath it, so the planted sole slid backwards across the
    // ground on every step â€” the skating half of "the walking is not natural",
    // and the half that survived getting the cadence right. A sole on the
    // floor belongs to the WORLD, not to the body: through one cell the plate
    // is drawn half a step ahead at footfall and half a step behind at the
    // hand-off, giving back exactly the travel the body took, and the pose
    // swap passes the plant to the other foot, which lands ahead again.
    // AND IT IS DELIBERATELY SMALL, for a reason that is measurable. A FULL
    // lock means the drawn body separates from the collider by half a step â€”
    // Â±11 world units at a walk on a body 57 wide â€” and a body that far from
    // its own hitbox stops being trustworthy: hits, ledges and the sword's
    // reach all read off the box, not the picture. tests/hero.cjs caught the
    // first draft doing exactly this: at a maximal stride phase a third of her
    // silhouette had crossed her own spine, and she measured one-armed.
    // Capped at about three world units at a walk and four at a run â€” enough to
    // stop a sole scrubbing backwards, small enough that she is still where she
    // is drawn.
    //
    // ...and it EASES with speed rather than switching on. The correction
    // vanishing the instant `moving` goes false would jump her body sideways by
    // its full amount on every stop, which is a worse artefact than the one
    // being fixed.
    if (moving && !(typeof G !== 'undefined' && G.artProbe)) {
      const lockPx = run ? 4 : 3;
      const ease = clamp((Math.abs(this.vx) - 12) / 48, 0, 1);
      c.translate((0.5 - ((this.stridePh || 0) % 1)) * 2 * lockPx * ease, 0);
    }
    // the wrong-way cell is turned round about its own centre, so the
    // registration and foot-plant corrections above still apply to it
    if (HERO_CELL_MIRROR[st]) { c.scale(-1, 1); }
    c.drawImage(im, col * cw, 0, cw, ch, -dw / 2, dy, dw, dh);
    if (HERO_CELL_MIRROR[st]) { c.scale(-1, 1); }
    this.drawHeroEyes(c, st, dw, dh, dy);
    c.restore();
    return true;
    } finally { c.restore(); }
  }
  // What she is FEELING, which is a different question from what she is doing.
  //
  // A scripted mood always wins (moodSet: dialogue, a pickup, a story beat),
  // then the things being done TO her, then the things she is doing. Combat
  // hardens her face and nothing else does, which is the whole arc in one
  // function: she is a cute maintenance unit until something makes her serious.
  heroMood(st) {
    if (this.moodT > 0 && this.mood) return this.mood;
    if (this.hurtPoseT > 0) return 'hurt';
    // a guardian's roar frightens her â€” its entrance, or any state it names roar
    if (G && (G.bossEntry || (G.boss && !G.boss.dead && /roar/i.test(G.boss.st || '')))) return 'afraid';
    if (this.cores <= 1) return 'weary';
    if (this.healT > 0) return 'happy';                 // relief, eyes closed
    if ((this.reliefT || 0) > 0) return 'relief';       // ...and the exhale after it lands
    if ((this.grap && this.grap.st === 'pull') || this.soar || this.counterAct) return 'effort';
    if (this.songT > 0) return 'excited';
    if (st === 'burst') return 'angry';                 // the charged blow only
    if (this.chargeT > 0.05) return 'determined';
    if (this.swingVis) return 'determined';
    if ((this.boostT || 0) > 0 || st === 'djump_jet') return 'excited';
    if (G && G.boss && !G.boss.dead) return 'determined';   // a fight is on
    return 'calm';
  }
  // Set a mood for a moment, over the top of everything: moodSet('happy', 1.2)
  moodSet(m, t) { this.mood = m; this.moodT = Math.max(this.moodT || 0, t || 1); }
  // Repaint her eye-lights over the plate's baked pair.
  drawHeroEyes(c, st, dw, dh, dy, eyeMap) {
    const E = eyeMap || HERO_EYE[st]; if (!E) return;
    const M = HERO_MOOD[this.heroMood(st)] || HERO_MOOD.calm;
    const t = this.anim;
    // THE BLINK IS THE CUTENESS. Two lights that never close are a sensor; two
    // that blink are alive. It runs on her own animation clock so it does not
    // tick in lockstep with anything else on screen, and it is suppressed while
    // her eyes are already narrowed â€” a slit does not blink, it just vanishes.
    const blink = M.sq > 0.6 && ((t * 0.47) % 3.1) < 0.10 ? 0.12 : 1;
    const pulse = M.pu ? 1 + Math.sin(t * M.pu) * 0.16 : 1;
    const px = (nx) => -dw / 2 + nx * dw, py = (ny) => dy + ny * dh;
    // ew/eh are the eye's MEASURED FULL SIZE in the baked art; the ellipse
    // calls below take RADII. Passing them straight through drew every eye at
    // double the plate's size â€” two huge lights swallowing the visor mask the
    // owner approved on the model ('the eyes and the mask is different, and I
    // don't like it in the game'). Halved, the repaint sits exactly where the
    // baked eye is, the dark visor band around it stays visible, and the
    // blink/mood machinery keeps working at the correct scale.
    const ew = E.ew * dw * 0.5, eh = E.eh * dh * 0.5;
    c.save();
    for (const side of [-1, 1]) {
      const ex = px(side < 0 ? E.lx : E.rx), ey = py(side < 0 ? E.ly : E.ry);
      // 1. COVER the baked light with the visor's own dark. Soft-edged, because
      //    a hard patch on a rendered face reads as a sticker â€” the same lesson
      //    media.js learned about cutting the guardians out.
      const g = c.createRadialGradient(ex, ey, 0, ex, ey, Math.max(ew, eh) * 1.3);
      g.addColorStop(0, 'rgba(14,19,26,1)');
      g.addColorStop(0.62, 'rgba(14,19,26,0.96)');
      g.addColorStop(1, 'rgba(14,19,26,0)');
      c.fillStyle = g;
      c.beginPath(); c.ellipse(ex, ey, ew * 1.25, eh * 1.2, 0, 0, 7); c.fill();
      // 2. DRAW the light she is actually wearing.
      c.save();
      c.translate(ex, ey);
      c.rotate(side < 0 ? -M.tl : M.tl);      // inner corners down = angry, outer = sad
      // the far eye (screen-left when she faces right) carries the asymmetry
      const k = side < 0 ? (M.as == null ? 1 : M.as) : 1;
      const rw = ew * M.ar * k, rh = eh * M.sq * blink * k;
      // ...dipping for the instant a failing cell sputters (the low-core idle)
      const lit = (0.55 + 0.45 * Math.min(1.4, M.gl * pulse)) * ((this.sputterT || 0) > 0 ? 0.45 : 1);
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(' + Math.round(90 * lit) + ',' + Math.round(255 * lit) + ',' + Math.round(232 * lit) + ',1)';
      c.shadowColor = '#37ffd0'; c.shadowBlur = 3 * M.gl * pulse;
      c.beginPath(); c.ellipse(0, 0, Math.max(0.6, rw), Math.max(0.35, rh), 0, 0, 7); c.fill();
      // a white-hot core, because a light with no hotter centre reads as paint
      c.fillStyle = 'rgba(235,255,250,' + (0.55 * lit).toFixed(2) + ')';
      c.beginPath(); c.ellipse(0, -rh * 0.15, rw * 0.45, Math.max(0.3, rh * 0.42), 0, 0, 7); c.fill();
      c.shadowBlur = 0;
      c.restore();
    }
    c.restore();
  }
  drawHeroSprite(c, run, evo) {
    if (typeof MEDIA_IMG === 'undefined' || !MEDIA_IMG.heroIdle || !MEDIA_IMG.heroRun
        || !MEDIA_IMG.heroJump || !MEDIA_IMG.heroAtk) return false;
    // sheet, frame count, cell size (uniform grids measured from the art)
    let key, n, cw, ch, fps, fr;
    if (this.swingVis) {
      key = 'heroAtk'; n = 6; cw = 96; ch = 48;
      const p = clamp(1 - this.swingVis.t / this.swingVis.t0, 0, 0.999);
      fr = Math.floor(p * n);
    } else if (!this.on) {
      key = 'heroJump'; n = 5; cw = 61; ch = 77;
      fr = this.vy < -220 ? 1 : this.vy < 60 ? 2 : this.vy < 420 ? 3 : 4;
    } else if (run) {
      key = 'heroRun'; n = 12; cw = 66; ch = 48;
      // Use the same distance-driven stride as CLAWBYTE. A fixed 16 fps
      // played a sprint at walking speed and kept cycling against a wall.
      fr = Math.floor((((this.stridePh || 0) % 4 + 4) % 4) / 4 * n);
    } else {
      key = 'heroIdle'; n = 4; cw = 38; ch = 48; fps = 7;
      fr = Math.floor(this.anim * fps) % n;
    }
    fr = clamp(fr | 0, 0, n - 1);
    const img = MEDIA_IMG[key];
    // draw standing on the feet (local origin), scaled to the play size
    const s = 1.2, dw = cw * s, dh = ch * s;
    c.imageSmoothingEnabled = false;
    // grounded frames sit on the floor; the jump sheet is taller, keep feet aligned
    c.drawImage(img, fr * cw, 0, cw, ch, -dw / 2, -dh + 3, dw, dh);
    c.imageSmoothingEnabled = true;
    if (evo >= 3) {                       // apex halo stays, drawn over the art
      c.strokeStyle = '#c8ffa0'; c.shadowColor = '#c8ffa0'; c.shadowBlur = 9; c.lineWidth = 2;
      c.beginPath(); c.arc(0, -dh + 16, 13, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      c.shadowBlur = 0;
    }
    return true;
  }
  drawHeroRig(c, P, bob, run, ph, spdK, evo) {
    if (this.drawHeroSprite(c, run, evo)) return;
    const gold = evo >= 3 ? '#e6c56f' : '#c79a4e', goldD = '#8a6f38';
    const crim = '#b23140', crimD = '#7c2430', skin = '#d9a97a', skinD = '#b8895f';
    const b4 = bob * 0.4;
    // --- flowing crimson cloak behind ---
    const cw = Math.sin(this.anim * 5) * (2 + spdK * 4) + (this.on ? 0 : 5);
    c.fillStyle = crimD;
    c.beginPath(); c.moveTo(-3, -30 + bob);
    c.quadraticCurveTo(-16 - spdK * 14, -18 + cw, -14 - spdK * 18, 0 + cw);
    c.quadraticCurveTo(-6, -6, -3, -14 + bob); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,150,120,0.22)'; c.lineWidth = 1.4; c.stroke();
    // --- legs (human, two-segment, bronze greaves + sandals) ---
    const legH = (hipX, phase, front) => {
      const hipY = -15 + bob * 0.3; let footX, footY, lift = 0;
      if (run) { footX = hipX + Math.sin(phase) * 8; lift = Math.max(0, -Math.cos(phase)) * 5; footY = -lift; }
      else if (!this.on) { footX = hipX + 3; footY = -3; }
      else { footX = hipX + 1; footY = 0; }
      const kx = (hipX + footX) / 2 + (front ? 2 : -1), ky = (hipY + footY) / 2;
      c.strokeStyle = front ? skin : skinD; c.lineWidth = 5; c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath(); c.moveTo(hipX, hipY); c.lineTo(kx, ky); c.lineTo(footX, footY - 1); c.stroke();
      c.strokeStyle = front ? gold : goldD; c.lineWidth = 3;
      c.beginPath(); c.moveTo(kx, ky); c.lineTo(footX, footY - 1); c.stroke();
      c.fillStyle = goldD; c.fillRect(footX - 3, footY - 1, 8, 3);
    };
    legH(-5, ph + Math.PI, false); legH(5, ph, true);
    // --- pteruges (leather war-skirt strips) ---
    for (let i = -2; i <= 2; i++) {
      const sway = Math.sin(this.anim * 6 + i) * 1.5 + (run ? Math.sin(ph * 2) * 1 : 0);
      c.fillStyle = i % 2 ? '#8a5a34' : '#9c6a3e';
      c.beginPath(); c.moveTo(i * 4 - 2, -16 + b4); c.lineTo(i * 4 + 2, -16 + b4);
      c.lineTo(i * 4 + 2 + sway, -7); c.lineTo(i * 4 - 2 + sway, -7); c.closePath(); c.fill();
    }
    // --- back arm holding a round hoplite shield (hidden mid-swing) ---
    if (!this.swingVis) {
      c.fillStyle = gold;
      c.beginPath(); c.arc(-9, -19 + b4, 7.5, 0, 7); c.fill();
      c.strokeStyle = goldD; c.lineWidth = 1.5; c.beginPath(); c.arc(-9, -19 + b4, 7.5, 0, 7); c.stroke();
      c.fillStyle = crim; c.beginPath(); c.arc(-9, -19 + b4, 3, 0, 7); c.fill();
      c.fillStyle = goldD; c.beginPath(); c.arc(-9, -19 + b4, 1.2, 0, 7); c.fill();
    }
    // --- torso: crimson tunic under a shaded bronze breastplate ---
    const tg = c.createLinearGradient(0, -30, 0, -13);
    tg.addColorStop(0, crim); tg.addColorStop(1, crimD);
    c.fillStyle = tg; rr(c, -10, -30 + b4, 20, 18, 5); c.fill();
    const bpg = c.createLinearGradient(0, -30, 0, -15);
    bpg.addColorStop(0, '#f0dca0'); bpg.addColorStop(0.5, gold); bpg.addColorStop(1, goldD);
    c.fillStyle = bpg;
    c.beginPath(); c.moveTo(-9, -29 + b4); c.lineTo(9, -29 + b4); c.lineTo(8, -17 + b4);
    c.quadraticCurveTo(0, -13 + b4, -8, -17 + b4); c.closePath(); c.fill();
    c.strokeStyle = goldD; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -27 + b4); c.lineTo(0, -16 + b4); c.stroke();
    c.fillStyle = gold; c.beginPath(); c.arc(-8, -28 + b4, 4, 0, 7); c.arc(8, -28 + b4, 4, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,245,210,0.5)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-8, -28.5 + b4); c.lineTo(8, -28.5 + b4); c.stroke();
    // --- head: skin, helmet dome, nose-guard, flowing plume, an eye (emotion) ---
    const hy = -34 + bob;
    c.fillStyle = skin; c.fillRect(-2, -32 + b4, 6, 4);           // neck
    c.fillStyle = skin; rr(c, -1, hy - 8, 14, 13, 5); c.fill();   // face
    c.fillStyle = '#2a1e14'; c.fillRect(6, hy - 2, 3, 3);          // eye
    c.strokeStyle = '#2a1e14'; c.lineWidth = 1; c.beginPath(); c.moveTo(4.5, hy - 4); c.lineTo(9, hy - 3); c.stroke(); // brow
    c.fillStyle = gold; c.beginPath(); c.arc(6, hy - 3, 9, Math.PI, 0); c.fill(); // helmet dome
    c.fillRect(-3, hy - 4, 18, 3);
    c.fillStyle = goldD; c.fillRect(11, hy - 4, 2, 7);            // nose guard
    const pv = Math.sin(this.anim * 7) * 2 + (run ? Math.sin(ph * 2) * 1.5 : 0);
    c.fillStyle = crim;
    c.beginPath(); c.moveTo(3, hy - 11); c.quadraticCurveTo(-7, hy - 17, -11 - spdK * 4, hy - 7 + pv);
    c.quadraticCurveTo(-4, hy - 11, 3, hy - 8); c.closePath(); c.fill();
    if (evo >= 3) {
      c.strokeStyle = '#c8ffa0'; c.shadowColor = '#c8ffa0'; c.shadowBlur = 8; c.lineWidth = 2;
      c.beginPath(); c.arc(6, hy - 2, 11, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.shadowBlur = 0;
    }
    // --- front arm + LIVE SWORD (windup â†’ sweep â†’ follow-through on attack) ---
    let swAng;
    if (this.swingVis) {
      const sv = this.swingVis, p = 1 - sv.t / sv.t0;
      if (sv.combo === 2) swAng = -1.5 + p * 2.7;        // overhead finisher
      else if (sv.combo === 1) swAng = 1.0 - p * 1.9;    // rising cut
      else swAng = -0.9 + p * 1.9;                       // descending cut
    } else {
      swAng = -1.05 + Math.sin(this.anim * 2) * 0.07;    // ready stance, breathing
    }
    const shX = 6, shY = -26 + b4;
    const handX = shX + Math.cos(swAng) * 8, handY = shY + 6 + Math.sin(swAng) * 8;
    c.strokeStyle = skin; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(shX, shY); c.lineTo(handX, handY); c.stroke();
    c.strokeStyle = gold; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo((shX + handX) / 2, (shY + handY) / 2); c.lineTo(handX, handY); c.stroke();
    c.save(); c.translate(handX, handY); c.rotate(swAng + Math.PI / 2);
    c.fillStyle = goldD; c.fillRect(-1.6, -2, 3.2, 6); c.fillRect(-4.5, -2, 9, 2);  // hilt + guard
    const bl = 27, blg = c.createLinearGradient(0, -2, 0, -bl);
    blg.addColorStop(0, '#9aa7b8'); blg.addColorStop(0.5, '#eef3fa'); blg.addColorStop(1, '#ffffff');
    c.fillStyle = blg; c.shadowColor = this.swingVis ? '#ffffff' : 'rgba(0,0,0,0)'; c.shadowBlur = this.swingVis ? 8 : 0;
    c.beginPath(); c.moveTo(-2, -2); c.lineTo(-1.5, -bl + 3); c.lineTo(0, -bl); c.lineTo(1.5, -bl + 3); c.lineTo(2, -2); c.closePath(); c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(-0.4, -4); c.lineTo(0, -bl + 3); c.stroke();
    c.restore();
  }
  // Self-contained on purpose: the live rig's transform stack (turning,
  // squash-and-stretch, evolution scale) is built for a body still being
  // simulated, and death is a still frame in whatever facing she died
  // facing. Same anchor convention as the rest of draw() â€” feet-centre â€”
  // without the machinery that has nothing left to animate.
  drawDeath(c) {
    c.save();
    c.scale(HERO_SCREEN_SCALE, HERO_SCREEN_SCALE);
    c.translate(this.x + this.w / 2, this.y + this.h);
    const tfv = this.faceVis == null ? this.face : this.faceVis;
    c.scale(Math.sign(tfv) || this.face || 1, 1);
    const D = HERO_DEATH_STRIP;
    const deadT = (typeof G !== 'undefined' && G.deadT != null) ? G.deadT : 0;
    const elapsed = (D.total || 1.8) - deadT;
    const p = clamp(elapsed / (D.hold || 1.2), 0, 1) * (D.cells - 1);
    drawHeroMotionCell(this, c, D.key, p, D.cells, 0, 0, HERO_DH * (D.k || 1), false);
    if (typeof G !== 'undefined') G.heroDrawn = G.lastStrip;
    c.restore();
  }
  draw(c) {
    if (this.dead) { this.drawDeath(c); return; }
    if (typeof grapDraw === 'function') grapDraw(c, this);   // the claw's cable, behind her
    // (the i-frame flicker is applied by the CALLER as an alpha â€” see the player
    //  draw block in game.js. It used to `return` here, which is why she
    //  vanished outright on alternate frames instead of blinking.)
    const P = PAL[G.roomDef.zone];
    for (const tr of this.trail) {
      // dash echoes: each one a whole readable copy of her silhouette that
      // cools from white-hot (freshest) to zone-glow and shrinks as it dies
      const k = tr.t / (tr.t0 || 0.25);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.24 + k * 0.36;
      c.translate(tr.x + this.w / 2, tr.y + this.h / 2);
      c.scale(tr.face * (0.86 + k * 0.14), 0.86 + k * 0.14);
      c.fillStyle = P.glow;
      rr(c, -14, -7, 28, 19, 9); c.fill();
      c.beginPath(); c.arc(2, -15, 11, 0, 7); c.fill();
      c.beginPath(); c.moveTo(-8, -21); c.lineTo(-4, -32); c.lineTo(1, -22); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(4, -22); c.lineTo(9, -32); c.lineTo(13, -21); c.closePath(); c.fill();
      // white-hot core on the freshest echo â€” the visor band still burning
      c.globalAlpha = k * k * 0.7;
      c.fillStyle = '#ffffff';
      rr(c, -5, -19, 15, 6, 3); c.fill();
      c.restore(); c.globalAlpha = 1;
    }
    // contact shadow â€” tightens and darkens as the hero nears the ground,
    // and LEANS AWAY FROM THE ROOM'S LIGHT: drawLights accumulates every
    // light near her into G._shadX, and the shadow is thrown up to 9px in
    // the opposite direction, slightly longer the harder it is pushed â€” a
    // shadow that answers the scene instead of a disc printed under her
    {
      const gy = shadowGroundY(this);
      if (gy !== null) {
        const air = clamp((gy - this.y - this.h) / 200, 0, 1);
        const throwX = (G._shadX || 0) * 9;
        contactShadow(c, this.x + this.w / 2 + throwX, gy,
          this.w * (0.6 - air * 0.25) * (1 + Math.abs(throwX) * 0.03), 0.45 * (1 - air * 0.7));
      }
    }
    // where the paws finish this frame, recorded as they are drawn and read back
    // once the body's transform has been popped (see rakeMark / the swing block)
    this._rake = null;
    c.save();
    c.translate(this.x + this.w / 2, this.y + this.h);
    {
      const tfv = this.faceVis == null ? this.face : this.faceVis;
      c.scale((Math.sign(tfv) || this.face) * (0.86 + 0.14 * Math.abs(tfv)), 1);
    }
    const run = this.on && Math.abs(this.vx) > 40 && this.dashT <= 0;
    const sprintK = clamp((Math.abs(this.vx) - 120) / 240, 0, 1);   // 0â†’1 into a full sprint
    // the joint springs run on render time, not sim time: they smooth what the
    // eye actually receives, so they stay smooth at any frame rate
    {
      const nw = performance.now();
      this.rigDt = this._rigT ? Math.min((nw - this._rigT) / 1000, 0.1) : 1 / 60;
      this._rigT = nw;
    }
    // ninja stride: the faster she moves, the quicker and longer the cycle
    const ph = this.anim * (13 + sprintK * 7);
    const bob = run ? Math.sin(ph * 2) * (1.4 - sprintK * 0.9) : Math.sin(this.anim * 2.4) * 0.9;
    // --- squash & stretch: one signed, volume-conserving deformation ---
    let sy = 1, sx = 1;
    if (this.landT > 0 && Math.abs(this.vx) <= 34) {
      // landing: deep squash -> overshoot stretch -> settle (damped bounce,
      // pinned at the feet so the dome dips and rebounds)
      const l0 = this.land0 || 0.12, lk = 1 - this.landT / l0;
      const A = Math.abs(this.vx) > 12 ? 0.045 : (l0 > 0.15 ? 0.3 : 0.17);
      // cos crosses zero exactly at lk=1, so the settle never pops
      const w = A * Math.cos(lk * Math.PI * 1.5) * (1 - lk * 0.5);
      sy -= w; sx += w * 0.72;
    }
    if (this.pogoT > 0) {
      // pogo rebound: she stretches tall off the bounce, then settles
      const pk = this.pogoT / 0.18;
      sy += 0.22 * pk * pk; sx -= 0.13 * pk * pk;
    }
    if (this.takeoffT > 0 && this.landT <= 0) {
      // jump: 1-2 frames of anticipation coil, then a launch stretch
      const el = this.takeoff0 - this.takeoffT;
      if (this.takeoffCoil && el < 0.05) { sy -= 0.16; sx += 0.12; }
      else {
        const q = this.takeoffT / Math.max(0.01, this.takeoff0 - (this.takeoffCoil ? 0.05 : 0));
        sy += 0.18 * q; sx -= 0.1 * q;
      }
    }
    // ---- THE THREE POSES THE STATE SHEET CAUGHT MISSING -------------------
    // The full-state audit (tools/statesheet.cjs) put every state next to idle
    // and three of them were the same drawing: the Song, the beat after firing
    // an arm, and standing at one core. Each is a MECHANIC the body ignored.
    // The fixes live here, in the same carriage/rotation stage as every other
    // pose, so they compose with running, landing and the rest instead of
    // fighting them â€” and tests/hero.cjs now holds each one to the guardians'
    // silhouette law, so none of them can quietly become idle again.
    //
    // THE SONG: she stands INTO it â€” up on her toes, chest lifted, head back.
    // A note thrown at the sky, which is what the Song is in the fiction.
    const songK = this.songT > 0 ? clamp(this.songT / 0.5, 0, 1) : 0;
    // ARM FIRE: the shot has a beat of recoil. The body rocks back off the
    // firing line and settles as the cooldown runs out, so every arm reads as
    // having KICK even before its projectile is seen.
    const kick = this.armCD > 0 ? clamp(this.armCD / 0.3, 0, 1) : 0;
    // ONE CORE LEFT: she is hurt and it shows between fights â€” shoulders
    // dropped, carriage low, the run unaffected (a limp that slows the PLAYER
    // is punishing the state twice; this is body language, not a debuff).
    const lowK = (this.cores <= 1 && this.on && !run && this.dashT <= 0
                  && !this.swingVis && this.healT <= 0) ? 1 : 0;
    // AIRBORNE â€” the find that put this block under a harness: mid-air she
    // measured 0.92 IoU against standing still. A standing picture on a
    // parabola is exactly what NULLFANG's leap was convicted of, and she had
    // been doing it herself all along. The rise stretches her ALONG the jump
    // and tips her back off it; the fall compresses and pitches her INTO it,
    // reading forward the way anything falling with intent does. Blended by
    // vertical speed so the apex passes through neutral instead of popping.
    let airRot = 0;
    // THE BOOST POSE: the back jet is shoving her, so the body stretches hard
    // along the thrust and tips back against it â€” a rocket, not a dancer.
    if ((this.boostT || 0) > 0) {
      const bk = this.boostT / 0.3;
      sy += 0.20 * bk; sx -= 0.11 * bk;
      airRot = -0.16 * bk;
    } else if (!this.on && this.wallSlide === 0 && this.dashT <= 0 && this.flipT <= 0
        && this.landT <= 0 && this.hurtPoseT <= 0) {
      const vk = clamp(this.vy / 760, -1, 1);
      if (vk < 0) { sy += -vk * 0.13; sx -= -vk * 0.08; }   // the rise: drawn long
      else { sy -= vk * 0.05; sx += vk * 0.04; }            // the fall: gathered
      airRot = vk < 0 ? vk * 0.07 : vk * 0.12;              // back off it, then into it
    }
    // THE STRIDE HAS A VERTICAL, and the authored body had none at all.
    //
    // `bob` is computed thirty lines up and handed ONLY to drawHeroRig â€” the
    // procedural fallback that draws for a second before the sheet loads. The
    // PLATE path, which is what every player actually sees, translated
    // horizontally at a constant height while two pictures alternated. A
    // running body's centre of mass rises and falls once per step; hers did not
    // move at all, and a figure that holds one height while its picture flips
    // is a cut-out sliding along the floor. That is most of what "the movement
    // is horrible" is pointing at.
    //
    // IN PHASE WITH THE PLATE, which is the half that has to be right. The cell
    // swaps on floor(anim * F), so every integer of that product is a FOOTFALL:
    // the body is lowest there and highest between. Driving this off any other
    // clock â€” including the rig's own `ph`, which runs at a different rate â€”
    // puts the rise on the wrong foot and reads worse than no rise at all.
    //
    // Suppressed under G.artProbe with every other ground-anchored effect:
    // tests/artbible.cjs measures her soles against the floor, and a body
    // legitimately mid-stride is not the frame that question is asking about.
    const usePlate = !(typeof isHero === 'function' && isHero())
      && typeof MEDIA_IMG !== 'undefined' && !!MEDIA_IMG.heroStates;
    let stepLift = 0;
    const authoredGait = usePlate && this.on && Math.abs(this.vx) > 12
      && !!MEDIA_RAW[(Math.abs(this.vx) > HERO_RUN_VX ? HERO_GAIT.run : HERO_GAIT.walk).key];
    if (usePlate && !authoredGait && this.on && Math.abs(this.vx) > 12 && this.dashT <= 0
        && !this.swingVis && this.landT <= 0 && this.skidT <= 0
        && this.hurtPoseT <= 0 && !(typeof G !== 'undefined' && G.artProbe)) {
      const sp = this.stridePh || 0;
      const lift = Math.abs(Math.sin(Math.PI * sp));     // 0 at contact, 1 between
      stepLift = -lift * (run ? 1.6 + sprintK * 1.8 : 1.3);
      // ...AND THE FOOT LANDS. A short compression at contact, gone by mid
      // stride â€” the weight arriving, which is the other half of a step. Volume
      // conserving like every other deformation in this block, so she squashes
      // rather than shrinking.
      const hit = Math.pow(1 - lift, 5) * (run ? 0.05 : 0.03);
      sy -= hit; sx += hit * 0.7;
    }
    const cr = (this.skidT > 0 ? 0.2 : (this.wallSlide !== 0 ? 0.1 : 0))
             + (run && !authoredGait ? sprintK * 0.12 : 0)                           // low, coiled sprint carriage
             - songK * 0.08                                        // the Song: drawn UP, not down
             + lowK * 0.11;                                        // one core: sagging carriage
    // recorded so tests/gait.cjs can check the PHASE rather than trust it: a
    // bob that is out of step with the footfall is worse than none, and that
    // is not something a still frame or a reading of this file would show.
    //
    // AND THE PHASE IS CAUGHT HERE, NOT SAMPLED FROM OUTSIDE. The cell swaps
    // roughly every third frame, so a harness reading one frame in one can miss
    // the crossing by most of a step and report a correct bob as inverted â€”
    // which is exactly what it did. This sees every frame: the worst |lift|
    // ever observed ON a cell change. Zero is right; anything near the
    // amplitude means the two clocks have drifted apart.
    this._stepLift = stepLift;
    this._authoredGait = authoredGait;
    if (usePlate) {
      const gc = this.heroState(run);
      if (gc !== this._gaitCell) {
        this._gaitCell = gc;
        if (/^walk_/.test(gc)) this._swapLift = Math.max(this._swapLift || 0, Math.abs(stepLift));
      }
    }
    if (stepLift) c.translate(0, stepLift);                         // the step's own rise and fall
    if (this.wallSlide !== 0) c.translate(2.5, 0);                  // body pressed INTO the wall
    if (kick > 0) c.translate(-2.6 * kick, 0);                      // rocked off the firing line
    // The authored stride already contains its recoil and posture.
    c.rotate((authoredGait ? 0 : this.lean) + (this.skidT > 0 ? -0.14 : 0) + (this.wallSlide !== 0 ? 0.1 : 0)
             + (run && !authoredGait ? sprintK * 0.3 : 0)
             + (this.hurtPoseT > 0 ? -0.3 * (this.hurtPoseT / 0.3) : 0)  // thrown back, off balance
             + airRot                                       // the leap's own pitch
             - songK * 0.13                                        // head and chest thrown back to sing
             - kick * 0.09                                         // recoil rocks her heels-back
             + lowK * 0.07                                         // one core: hunched forward
             + (this.idleT > 0.9 ? Math.sin(this.idleT * 0.9) * 0.022 : 0)); // idle weight shift
    // THE FRAME THE CUT LIVES IN, captured here and not one line later. Below
    // this point the transform stops describing where she IS and starts
    // describing what her body is DOING to itself: the spiral of the double
    // jump, the landing squash, the evolution scale. A mark left in the air
    // takes part in none of that. Marked here, the cut always hangs on the side
    // she is facing â€” mid-pirouette the arm may be anywhere, but the swipe is
    // still thrown forward, which is the thing the player is reading.
    // (only while a swing is alive â€” getTransform allocates, and the loop is
    // meant to stay allocation-light)
    if (this.swingVis) this._rakeM = c.getTransform();
    if (this.flipT > 0) {
      // THE SPIRAL: the double jump is a ninja pirouette about her own
      // VERTICAL axis â€” head to toe through the middle of the body â€” not a
      // cartwheel. Two eased twists; the silhouette slims through each
      // profile pass and mirrors on the far side, so the spin reads as a
      // body turning in place, with a whisker of axis wobble for style.
      // IT USED TO SPIN TOO FAST TO SEE. Two full twists inside half a second
      // is eight profile passes, one every four frames, each squeezed to 22%
      // of her width â€” the eye gets a strobe, not a pirouette, and no amount of
      // extra artwork would have fixed a rotation running faster than the
      // display can show it. One turn now, never narrower than a third of her
      // width, and the smear below fills in the frames the screen cannot.
      const k = 1 - this.flipT / FLIP_DUR;
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const th = e * Math.PI * 2;                  // one full twist
      // MOTION BLUR, which is what "more frames" actually means here: the
      // silhouette is stamped at the phases she passed through between this
      // frame and the last, so the turn reads continuous instead of stepped.
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (let g = 1; g <= 3; g++) {
        const kb = Math.max(0, k - g * 0.055);
        const eb = kb < 0.5 ? 2 * kb * kb : 1 - Math.pow(-2 * kb + 2, 2) / 2;
        const tb = eb * Math.PI * 2, fb = Math.cos(tb);
        c.save();
        c.scale((fb < 0 ? -1 : 1) * Math.max(0.52, Math.abs(fb)), 1);
        c.rotate(Math.sin(tb) * 0.19);
        c.globalAlpha = 0.22 - g * 0.05;
        c.fillStyle = P.glow;
        rr(c, -13, -25, 26, 19, 9); c.fill();                    // body
        c.beginPath(); c.arc(2, -33, 10.5, 0, 7); c.fill();      // head
        c.beginPath(); c.moveTo(-7, -39); c.lineTo(-3, -49); c.lineTo(2, -40); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(5, -40); c.lineTo(9, -49); c.lineTo(13, -39); c.closePath(); c.fill();
        c.restore();
      }
      c.restore();
      c.globalAlpha = 1;
      // SHE FOLDED LIKE PAPER, and a flat scale on x is exactly why: squeezing a
      // drawing to a third of its width does not turn a body, it closes a book.
      // Nothing about the figure got thicker as it turned edge-on, because a
      // sheet has no thickness to show.
      //
      // A real body seen edge-on is still a body â€” narrower, but not gone, and
      // its EDGE is what you see. So the squeeze stops at 0.52 rather than 0.33
      // (a robot cat has depth: shoulders, a chest, a pack), the figure leans
      // into the turn instead of staying bolt upright, and it lifts slightly at
      // the profile pass the way a spinning thing does when it is not on a
      // spit. Same one turn, same timing â€” it just has a third dimension now.
      const fx = Math.cos(th);
      const edge = 1 - Math.abs(fx);                 // 0 face-on, 1 edge-on
      c.scale((fx < 0 ? -1 : 1) * Math.max(0.52, Math.abs(fx)), 1 + edge * 0.06);
      c.rotate(Math.sin(th) * 0.19);
      c.translate(0, -edge * 1.6);
    }
    c.scale(sx, sy * (1 - cr));
    // evolution: the frame grows with each power milestone (visual only â€” hitbox unchanged)
    const evo = typeof evoTier === 'function' ? evoTier() : 0;
    // ...on top of a base presence scale (owner, from his phone: "my hero is
    // so small... increase by twenty to thirty percent"). Visual only, feet
    // anchored at the origin, hitbox untouched â€” the same contract as the
    // evolution growth, so she is easier to hit exactly never.
    const VIS = 1.25;
    c.scale(VIS * (1 + evo * 0.07), VIS * (1 + evo * 0.07));
    const hero = typeof isHero === 'function' && isHero();
    const spdK = Math.min(1, Math.abs(this.vx) / 360);
    if (evo >= 3) {
      // apex aura â€” raw power radiating off the body
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.14 + Math.sin(this.anim * 3.2) * 0.05;
      const ag = c.createRadialGradient(0, -16, 6, 0, -16, 42);
      ag.addColorStop(0, hero ? '#ffd98a' : P.glow); ag.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = ag; c.beginPath(); c.arc(0, -16, 42, 0, 7); c.fill();
      c.restore(); c.globalAlpha = 1;
    }
    if (hero) {
      this.drawHeroRig(c, P, bob, run, ph, spdK, evo);
    } else {
    // HER BODY, authored or drawn. drawRoboPlate() puts the authored plate for
    // the current state on screen and returns true; everything guarded below is
    // the procedural body, which now runs only until the sheet loads (and
    // forever, unchanged, if it never does).
    //
    // The guard stops at the thruster jets on purpose. The plates carry her
    // shell, head, ears, visor, limbs AND her scarf â€” so the procedural scarf
    // must not run over them, or she wears two. The jets are additive light
    // fired from the body rather than part of it (Â§0.0), they respond to state
    // the art cannot know, and they are the same in both paths, so they sit
    // OUTSIDE the guard and draw either way.
    if (!this.drawRoboPlate(c, run)) {
    if (hero && evo >= 2) {
      // crimson war-cloak flowing behind
      const cwv = Math.sin(this.anim * 5) * (2 + spdK * 4);
      c.fillStyle = evo >= 3 ? '#8a1f2e' : '#7c2430';
      c.beginPath(); c.moveTo(-2, -27 + bob);
      c.quadraticCurveTo(-18 - spdK * 12, -20 + cwv, -16 - spdK * 16, -2 + cwv);
      c.quadraticCurveTo(-8, -8, -4, -12 + bob);
      c.closePath(); c.fill();
      if (!this.swingVis) {
        // round shield slung on the back
        c.fillStyle = evo >= 3 ? '#e6c56f' : '#b8934c';
        c.beginPath(); c.arc(-10, -18 + bob * 0.4, 8, 0, 7); c.fill();
        c.strokeStyle = '#8a6f38'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(-10, -18 + bob * 0.4, 8, 0, 7); c.stroke();
        c.fillStyle = '#8a6f38'; c.beginPath(); c.arc(-10, -18 + bob * 0.4, 2.5, 0, 7); c.fill();
      }
    }
    {
      // scarf â€” the 4-segment spring chain, rendered as a tapering ribbon.
      // The angles live in update(); here we just walk the chain backward.
      let sx0 = 0, sy0 = -22.5 + bob;   // knotted at the neck, under the big head
      const seg = [[sx0, sy0]];
      for (let i = 0; i < 4; i++) {
        const L = 7 + spdK * 3.5 + (this.on ? 0 : 1.5);
        sx0 -= Math.cos(this.scarfA[i]) * L; sy0 -= Math.sin(this.scarfA[i]) * L;
        seg.push([sx0, sy0]);
      }
      c.lineCap = 'round'; c.lineJoin = 'round';
      // dark fold under, bright cloth over â€” reads as a folded ribbon
      c.strokeStyle = '#b91c1c';
      c.beginPath(); c.moveTo(seg[0][0], seg[0][1] + 2.2);
      for (let i = 1; i <= 4; i++) c.lineTo(seg[i][0], seg[i][1] + 2.2 - i * 0.3);
      c.lineWidth = 4.6; c.stroke();
      c.strokeStyle = '#e63946';
      c.beginPath(); c.moveTo(seg[0][0], seg[0][1]);
      for (let i = 1; i <= 4; i++) c.lineTo(seg[i][0], seg[i][1]);
      c.lineWidth = 3.6; c.stroke();
      // split tip â€” the scarf ends in two tails that flutter apart
      c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(seg[3][0], seg[3][1]);
      c.lineTo(seg[4][0] - 1, seg[4][1] + 4 + Math.sin(this.anim * 11) * 2); c.stroke();
    }
    if (!hero) {
      // tail â€” energy conduit on the 3-segment spring chain: it lags a turn,
      // streams back at a sprint and flags upward in a fall
      let tx0 = -11, ty0 = -10;
      const tp = [[tx0, ty0]];
      for (let i = 0; i < 3; i++) {
        const L = 8.5 - i * 0.5;
        tx0 -= Math.cos(this.tailA[i]) * L; ty0 -= Math.sin(this.tailA[i]) * L;
        tp.push([tx0, ty0]);
      }
      c.strokeStyle = '#cfd8e6'; c.lineWidth = 3.5; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(tp[0][0], tp[0][1]);
      for (let i = 1; i <= 3; i++) c.lineTo(tp[i][0], tp[i][1]);
      c.stroke();
      c.strokeStyle = P.glow; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(tp[0][0] - 1.5, tp[0][1] - 2.5);
      for (let i = 1; i <= 3; i++) c.lineTo(tp[i][0] + 0.5, tp[i][1] + 1);
      c.stroke();
      c.fillStyle = P.glow; c.beginPath(); c.arc(tp[3][0], tp[3][1], 2.6, 0, 7); c.fill();
    }
    // segmented digitigrade legs with glowing joints
    const leg = (hipX, phase, front) => {
      const hipY = -9 + bob * 0.3;
      let fx, fy, lift = 0, knee = 0;
      if (this.hurtPoseT > 0) {
        // knockback flail: both legs thrown forward, kicking at nothing
        fx = hipX + (front ? 7 : 4.5) + Math.sin(this.anim * 34 + (front ? 0 : 2.1)) * 2.5;
        fy = -6 - Math.max(0, Math.sin(this.anim * 30 + (front ? 1.2 : 3))) * 3;
      } else if (run) {
        // stride reaches further and the knee drives higher the faster she goes
        const reach = 7.5 + sprintK * 7;
        fx = hipX + Math.sin(phase) * reach;
        lift = Math.max(0, -Math.cos(phase)) * (4.5 + sprintK * 7);
        fy = -lift;
        knee = Math.max(0, -Math.cos(phase)) * sprintK * 5;   // tucked knee on recovery
      } else if (!this.on) { fx = hipX + 2.5; fy = -4; }
      else { fx = hipX + 1; fy = 0; }
      // the foot is springed too, so leaving the ground, landing, and dropping
      // out of a run all BEND the leg through the change instead of cutting to
      // the new pose. Stiff enough that a running stride still lands on beat.
      const lk = front ? 'legF' : 'legB';
      fx = rigStep(this, lk + 'x', fx, run ? 2600 : 520, this.rigDt);
      fy = rigStep(this, lk + 'y', fy, run ? 2600 : 520, this.rigDt);
      const kx = (hipX + fx) / 2 - 3.5 - lift * 0.3 + knee, ky = (hipY + fy) / 2 - 1 - knee * 0.5;
      // short, stubby limbs â€” spec Â§1.1: chubby means the legs stay little
      c.strokeStyle = front ? '#aab6c6' : '#7f8b9c'; c.lineWidth = 4.2; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(hipX, hipY); c.lineTo(kx, ky); c.lineTo(fx, fy - 1); c.stroke();
      c.fillStyle = front ? '#cfd8e6' : '#93a0b2';
      // the foot points on push-off instead of staying flat
      c.save(); c.translate(fx, fy - 1); c.rotate(run ? Math.cos(phase) * 0.5 * sprintK : 0);
      c.fillRect(-3, -1.2, 7, 3.2); c.restore();
      c.fillStyle = P.glow;
      c.beginPath(); c.arc(hipX, hipY, 1.9, 0, 7); c.arc(kx, ky, 1.5, 0, 7); c.fill();
      // dust kicks off the back foot at full tilt
      if (run && sprintK > 0.4 && front && Math.cos(phase) > 0.85 && chance(0.5))
        addPart(this.x + this.w / 2 - this.face * 8, this.y + this.h - 1,
                -this.face * rnd(50, 130), rnd(-60, -14), 0.32, '#9fb8c8', 2.4, 500);
    };
    // Rear arm. It used to appear the instant she crossed into a sprint and
    // vanish the instant she dropped out of one â€” a whole limb popping in and
    // out of the silhouette. It is always there now, and it SWINGS between
    // tucked and trailing, so the ninja-run builds instead of switching on.
    {
      const trail = clamp((sprintK - 0.1) / 0.6, 0, 1);
      const bTgt = (run ? 1.25 : 1.5) + trail * 1.6 - Math.sin(ph) * (0.1 + trail * 0.16);
      const bAng = rigAng(this, 'armB', bTgt, 200, this.rigDt);
      // it has to reach PAST the back of the torso to be seen at all â€” a
      // trailing arm that stops inside the silhouette is a trailing arm nobody
      // ever saw. At rest it stays short and the body hides it, which is right
      // for a side view; the sprint is what swings it out.
      const bLen = rigStep(this, 'armBL', 10 + trail * 6, 180, this.rigDt);
      const bx2 = -9, by2 = -19 + bob * 0.4;
      const bhx = bx2 + Math.cos(bAng) * bLen, bhy = by2 + Math.sin(bAng) * bLen;
      const bEl = rigIK(bx2, by2, bhx, bhy, Math.max(5.6, bLen * 0.58), Math.max(5.6, bLen * 0.58), -1);
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = 'rgba(32,41,54,0.85)'; c.lineWidth = 4.6;
      c.beginPath(); c.moveTo(bx2, by2); c.lineTo(bEl.x, bEl.y); c.lineTo(bhx, bhy); c.stroke();
      c.strokeStyle = '#6d7a8c'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(bx2, by2); c.lineTo(bEl.x, bEl.y); c.lineTo(bhx, bhy); c.stroke();
      c.fillStyle = 'rgba(32,41,54,0.85)'; c.beginPath(); c.ellipse(bhx, bhy, 3.1, 2.7, 0, 0, 7); c.fill();
      c.fillStyle = '#8d9aac'; c.beginPath(); c.ellipse(bhx, bhy, 2.3, 1.9, 0, 0, 7); c.fill();
    }
    // speed smear behind her at full sprint
    if (run && sprintK > 0.5) {
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.1 * sprintK;
      c.fillStyle = P.glow;
      for (let k = 1; k <= 2; k++) rr(c, -13 - k * 7, -24 + bob * 0.4, 26, 20, 7), c.fill();
      c.restore(); c.globalAlpha = 1;
    }
    leg(-7, ph + Math.PI, false); leg(6, ph, true);
    // EMPOWERED halo â€” violet Feral Claws (cat) / golden Wrath of Olympus (hero)
    if (this.clawT > 0) {
      const divine = hero;
      c.save(); c.globalCompositeOperation = 'lighter';
      const pulse = 0.7 + Math.sin(this.anim * 7) * 0.3;
      const fade = Math.min(1, this.clawT / 1.2);              // dims as it expires
      const hg = c.createRadialGradient(0, -16, 4, 0, -16, 40);
      if (divine) {
        hg.addColorStop(0, 'rgba(255,225,140,0.5)');
        hg.addColorStop(0.5, 'rgba(255,180,60,0.3)');
        hg.addColorStop(1, 'rgba(255,180,60,0)');
      } else {
        hg.addColorStop(0, 'rgba(160,80,255,0.45)');
        hg.addColorStop(0.5, 'rgba(122,31,208,0.3)');
        hg.addColorStop(1, 'rgba(122,31,208,0)');
      }
      c.globalAlpha = (0.5 + pulse * 0.4) * fade;
      c.fillStyle = hg; c.beginPath(); c.arc(0, -16, 40, 0, 7); c.fill();
      // orbiting halo ring â€” a crown of light / a laurel of divine favour
      c.globalAlpha = (0.45 + pulse * 0.35) * fade;
      c.strokeStyle = divine ? '#ffd76a' : '#e0a0ff'; c.lineWidth = 2.2;
      c.beginPath(); c.ellipse(0, -42, 16, 5, Math.sin(this.anim * 1.6) * 0.25, 0, 7); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(0, -42, 16, 5, Math.sin(this.anim * 1.6) * 0.25, 0.6, 3.1); c.stroke();
      if (divine) {
        // static arcs crawling over the champion â€” the storm clings to him
        c.globalAlpha = fade * (0.5 + Math.sin(this.anim * 19) * 0.4);
        c.strokeStyle = '#fff6c0'; c.lineWidth = 1.3; c.lineCap = 'round';
        for (let k = 0; k < 2; k++) {
          const sx2 = rnd(-11, 11), sy2 = rnd(-32, -6);
          c.beginPath(); c.moveTo(sx2, sy2);
          c.lineTo(sx2 + rnd(-6, 6), sy2 + rnd(5, 11));
          c.lineTo(sx2 + rnd(-8, 8), sy2 + rnd(12, 20));
          c.stroke();
        }
      }
      c.restore(); c.globalAlpha = 1;
    }
    // volt-blade sheathed on the back (hidden mid-swing â€” it's in the paw)
    if (!this.swingVis && this.clawT <= 0) {
      c.save(); c.translate(-11, -19 + bob * 0.4); c.rotate(-1.0);
      c.fillStyle = '#8892a2'; c.fillRect(-2, 0, 4, 8);
      c.fillStyle = '#5c6678'; c.fillRect(-4.5, -1, 9, 3);
      const bg = c.createLinearGradient(0, -26, 0, 0);
      bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, P.glow);
      c.fillStyle = bg; c.shadowColor = P.glow; c.shadowBlur = 9;
      c.beginPath(); c.moveTo(-1.8, -2); c.lineTo(-1.8, -22); c.lineTo(0, -27); c.lineTo(1.8, -22); c.lineTo(1.8, -2); c.closePath(); c.fill();
      c.shadowBlur = 0; c.restore();
      if (!hero && evo >= 2) {
        // second volt-blade â€” crossed sheaths, war-ready
        c.save(); c.translate(-5, -18 + bob * 0.4); c.rotate(-1.35);
        c.fillStyle = '#8892a2'; c.fillRect(-1.6, 0, 3.2, 6);
        c.fillStyle = '#5c6678'; c.fillRect(-3.5, -1, 7, 2.6);
        c.fillStyle = evo >= 3 ? '#ffd76a' : P.glow; c.shadowColor = c.fillStyle; c.shadowBlur = 7;
        c.beginPath(); c.moveTo(-1.4, -2); c.lineTo(-1.4, -17); c.lineTo(0, -21); c.lineTo(1.4, -17); c.lineTo(1.4, -2); c.closePath(); c.fill();
        c.shadowBlur = 0; c.restore();
      }
    }
    // ---- THE FAR FORELEG -------------------------------------------------
    // SHE HAD ONE ARM. The rear arm was only ever drawn while it was throwing
    // the second beat of a combo â€” every other frame of the game, standing,
    // walking, running, jumping, she was a one-armed cat, and at the size she
    // is played that does not read as "the far arm is hidden behind her", it
    // reads as a missing limb.
    //
    // It lives HERE, before the shell, because that is what makes it the far
    // arm: drawn behind the body and darker, so the near arm crossing the
    // belly still wins the eye. Its swing is the near arm's in antiphase â€” the
    // opposite foreleg, which is what a walk actually is â€” and it is deliberately
    // held closer to the body, since a rear limb that reaches as far forward as
    // the front one stops reading as depth and starts reading as a second cat.
    //
    // AND IT HAS TO CLEAR THE SILHOUETTE. Mounted on the near side and aimed
    // forward like the front arm, it is drawn every frame and hidden by the
    // belly in all of them â€” which is exactly the bug it was added to fix,
    // committed twice. It is mounted on the BACK edge of the chest and hangs
    // down the far side, so the paw shows past the body's outline: a limb you
    // can see is a limb, and one you cannot is nothing.
    if (!hero) {
      // SHE IS DRAWN ALMOST FRONT-ON â€” one visor, two eyes, both ears â€” so the
      // far arm is not a limb hiding behind a profile, it is the other arm, and
      // it belongs on the other shoulder doing the mirror of what this one does.
      // Hung down the back edge instead, it spent every frame inside the belly:
      // present in the code, absent from the screen, which is the same bug.
      const fsX = -10, fsY = -19.5 + bob * 0.4;
      const MIR = Math.PI;                                  // pi - a mirrors an angle
      let fAng, fReach;
      if (this.hurtPoseT > 0) {
        fAng = MIR + 1.9 - Math.sin(this.anim * 30) * 0.75; fReach = 11.5;
      } else if (this.wallSlide !== 0) {
        fAng = MIR + 0.55; fReach = 11;                     // reaching away from the wall
      } else if (run && sprintK > 0.25) {
        fAng = MIR - 1.35 - sprintK * 0.5 + Math.sin(ph) * 0.12;
        fReach = 13 + sprintK * 3;
      } else if (!this.onGround) {
        fAng = MIR - 0.62; fReach = 11.5;                   // tucked in the air
      } else {
        const sw = run ? Math.sin(ph) : 0;                  // ANTIPHASE to the near arm
        fAng = MIR - 0.72 - sw * 0.26 - Math.sin(this.anim * 2 + 1.1) * 0.05;
        fReach = 12.6 + sw * 1.1;
      }
      fAng = rigAng(this, 'armFA', fAng, 260, this.rigDt);
      fReach = rigStep(this, 'armFR', fReach, 200, this.rigDt);
      const fhx = fsX + Math.cos(fAng) * fReach, fhy = fsY + Math.sin(fAng) * fReach;
      const fbone = Math.max(6.6, fReach * 0.56);
      const fel = rigIK(fsX, fsY, fhx, fhy, fbone, fbone, -1);
      armBones(c, fsX, fsY, fel.x, fel.y, fhx, fhy, true, null);
      armPaw(c, fhx, fhy, fAng, 1, true);
    }
    // body â€” the CHUBBY ceramic shell (spec Â§1.1): rounded, bottom-heavy,
    // wider at the hips than the chest. A pear, not a box.
    const by0 = -24 + bob * 0.4;
    // WHY SHE READ FLAT. This gradient ran straight down â€” top-to-bottom, its
    // axis CONCENTRIC with the outline â€” which is pillow shading: light bleeds
    // in evenly from the edge and the form has no direction, so it reads as a
    // sticker of a body rather than a body. Every value also sat in the light
    // half (white, bone, pale grey, with the dark stop only touching the last
    // pixel row), and a shape with no shadow side cannot be round.
    //
    // The light is committed now: upper-left, front-side-top, the same key that
    // lights the guardians. The gradient axis runs DIAGONALLY ACROSS the shell,
    // so there is a lit cheek and a shaded cheek, and it carries a real ramp â€”
    // hue-shifted rather than mixed with grey: warm bone in the light, cool
    // violet-slate in the shadow, because a shadow takes its colour from the
    // sky and a highlight from the lamp.
    const grad = c.createLinearGradient(-13, by0 - 2, 13, by0 + 19);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.26, '#f6f2e6');      // warm light
    grad.addColorStop(0.52, '#cbd0da');      // the turn
    grad.addColorStop(0.78, '#8b93ab');      // terminator
    grad.addColorStop(1, '#5d6480');         // cool core shadow
    c.fillStyle = grad;
    const belly = () => {
      c.beginPath();
      c.moveTo(-10, by0 + 1);
      c.quadraticCurveTo(-17, by0 + 9, -14.5, by0 + 16);
      c.quadraticCurveTo(-8, by0 + 20.5, 0, by0 + 20.5);
      c.quadraticCurveTo(8, by0 + 20.5, 14.5, by0 + 16);
      c.quadraticCurveTo(17, by0 + 9, 10, by0 + 1);
      c.quadraticCurveTo(0, by0 - 2.5, -10, by0 + 1);
      c.closePath();
    };
    belly(); c.fill();
    // Everything below is clipped to the shell, so shading stays ON the form.
    c.save(); belly(); c.clip();
    // CORE SHADOW. The darkest band on a round object is not its edge â€” it is
    // just inside the edge on the shaded side, because the very rim picks up
    // bounce. Without this a gradient still reads as a disc; with it the shell
    // turns away from you.
    const core = c.createRadialGradient(-5, by0 + 6, 3, -1, by0 + 10, 24);
    core.addColorStop(0, 'rgba(60,70,95,0)');
    core.addColorStop(0.62, 'rgba(58,68,92,0)');
    core.addColorStop(0.88, 'rgba(52,60,84,0.5)');
    core.addColorStop(1, 'rgba(70,80,104,0.22)');   // bounce lifts the last rim
    c.fillStyle = core; c.fillRect(-20, by0 - 4, 40, 28);
    // ambient occlusion pooling under the round belly
    const ao2 = c.createLinearGradient(0, by0 + 10, 0, by0 + 21);
    ao2.addColorStop(0, 'rgba(60,75,95,0)'); ao2.addColorStop(1, 'rgba(45,58,75,0.5)');
    c.fillStyle = ao2; c.fillRect(-20, by0 - 4, 40, 28);
    // CAST SHADOW FROM THE HEAD. The single strongest cue that two parts are at
    // different depths, and it was missing entirely â€” the head simply sat in
    // front of the chest touching nothing. A big round head above a chest puts
    // a soft crescent across the top of it, offset to the shadow side.
    const hcast = c.createRadialGradient(3, by0 - 8, 4, 3, by0 - 6, 20);
    hcast.addColorStop(0, 'rgba(40,48,70,0.5)');
    hcast.addColorStop(0.7, 'rgba(40,48,70,0.22)');
    hcast.addColorStop(1, 'rgba(40,48,70,0)');
    c.fillStyle = hcast; c.fillRect(-20, by0 - 4, 40, 20);
    c.restore();
    // SPECULAR, SEGMENTED. A rim stroked around the whole outline is the glass
    // dome error â€” it reads as a transparent bubble. This is a short arc on the
    // lit side only, fading to nothing at both ends.
    const spec = c.createLinearGradient(-14, by0 + 2, -6, by0 + 14);
    spec.addColorStop(0, 'rgba(255,255,255,0)');
    spec.addColorStop(0.42, 'rgba(255,255,255,0.92)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    c.strokeStyle = spec; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-8, by0 + 1.5); c.quadraticCurveTo(-14, by0 + 4, -14.5, by0 + 12); c.stroke();
    // and a COOL BACK-RIM on the shadow side, which is what actually lifts her
    // off a dark background â€” the guardians all have one and she had none
    const brim = c.createLinearGradient(9, by0 + 3, 15, by0 + 15);
    brim.addColorStop(0, 'rgba(150,205,255,0)');
    brim.addColorStop(0.45, 'rgba(150,205,255,0.5)');
    brim.addColorStop(1, 'rgba(150,205,255,0)');
    c.strokeStyle = brim; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(10, by0 + 1.5); c.quadraticCurveTo(16.4, by0 + 5, 14.6, by0 + 15); c.stroke();
    c.strokeStyle = 'rgba(74,86,106,0.9)'; c.lineWidth = 1.2; belly(); c.stroke();
    // evolution gear on the torso
    if (!hero && evo >= 1) {
      // shoulder pauldron riding the back of the shell
      c.fillStyle = evo >= 3 ? '#4a5668' : '#68758a';
      rr(c, -16, -25 + bob * 0.4, 11, 6, 3); c.fill();
      c.strokeStyle = evo >= 3 ? '#ffd76a' : '#93a0b2'; c.lineWidth = 1;
      rr(c, -16, -25 + bob * 0.4, 11, 6, 3); c.stroke();
    }
    if (!hero && evo >= 2) {
      // armored belly plate
      c.fillStyle = 'rgba(90,104,124,0.85)';
      rr(c, -10, -20 + bob * 0.4, 14, 8, 4); c.fill();
      c.strokeStyle = evo >= 3 ? '#ffd76a' : 'rgba(150,165,185,0.8)'; c.lineWidth = 1;
      rr(c, -10, -20 + bob * 0.4, 14, 8, 4); c.stroke();
    }
    if (hero && evo >= 1) {
      // hammered bronze breastplate (gold at apex)
      c.fillStyle = evo >= 3 ? '#e6c56f' : '#b8934c';
      rr(c, -11, -23 + bob * 0.4, 21, 12, 5); c.fill();
      c.strokeStyle = '#8a6f38'; c.lineWidth = 1;
      rr(c, -11, -23 + bob * 0.4, 21, 12, 5); c.stroke();
      c.beginPath(); c.moveTo(-1, -21 + bob * 0.4); c.lineTo(-1, -13 + bob * 0.4); c.stroke();
    }
    // chest light + gold power socket (spec: upgrade sockets are gold)
    c.fillStyle = P.glow; c.shadowColor = P.glow; c.shadowBlur = 8;
    c.beginPath(); c.arc(7, -15 + bob * 0.4, 2.6, 0, 7); c.fill(); c.shadowBlur = 0;
    c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 5;
    c.beginPath(); c.arc(-11.5, -18 + bob * 0.4, 1.8, 0, 7); c.fill(); c.shadowBlur = 0;
    c.strokeStyle = '#8a6f38'; c.lineWidth = 0.8;
    c.beginPath(); c.arc(-11.5, -18 + bob * 0.4, 2.6, 0, 7); c.stroke();
    // head â€” the OVERSIZED dome (spec Â§1.1: head is 40% of her): this is
    // what makes the silhouette read CAT at 36px. In the stride it bobs in
    // COUNTER-PHASE to the body â€” the dome stays level-ish while the hips pump
    const hy = -30 + (run ? -bob * 0.6 : bob);
    // The dome, lit by the same lamp as the shell â€” upper-left, gradient axis
    // running diagonally ACROSS the form. Straight down the outline was the
    // pillow-shading tell, and it made the biggest, roundest part of her the
    // flattest thing on screen.
    const hgd = c.createLinearGradient(-11, hy - 12, 14, hy + 8);
    hgd.addColorStop(0, '#ffffff');
    hgd.addColorStop(0.3, '#f4f0e4');
    hgd.addColorStop(0.58, '#cdd2dc');
    hgd.addColorStop(0.82, '#8f97ad');
    hgd.addColorStop(1, '#646b86');
    c.fillStyle = hgd;
    const dome = () => rr(c, -12, hy - 12, 27, 21, 10);
    dome(); c.fill();
    c.save(); dome(); c.clip();
    // core shadow inside the lower-right edge, with the rim lifting again on
    // bounce â€” the thing that separates a sphere from a disc
    const hcore = c.createRadialGradient(-4, hy - 5, 3, 1, hy - 1, 22);
    hcore.addColorStop(0, 'rgba(60,70,95,0)');
    hcore.addColorStop(0.6, 'rgba(58,68,92,0)');
    hcore.addColorStop(0.9, 'rgba(50,58,82,0.52)');
    hcore.addColorStop(1, 'rgba(74,84,110,0.2)');
    c.fillStyle = hcore; c.fillRect(-14, hy - 14, 32, 26);
    // THE EARS CAST ONTO THE SKULL. Two roots, offset to the shadow side, and
    // suddenly the ears are standing ON the head rather than stuck behind it.
    if (!hero) {
      c.fillStyle = 'rgba(46,54,78,0.34)';
      c.beginPath(); c.ellipse(-4.5, hy - 9.5, 5.2, 3.4, -0.5, 0, 7); c.fill();
      c.beginPath(); c.ellipse(9.5, hy - 9.5, 5.2, 3.4, 0.5, 0, 7); c.fill();
    }
    // cheek/jaw shadow â€” the underside of the dome turning away
    const jaw = c.createLinearGradient(0, hy + 1, 0, hy + 9);
    jaw.addColorStop(0, 'rgba(70,88,110,0)'); jaw.addColorStop(1, 'rgba(58,72,98,0.5)');
    c.fillStyle = jaw; c.fillRect(-14, hy, 32, 12);
    c.restore();
    c.strokeStyle = 'rgba(74,86,106,0.9)'; c.lineWidth = 1.2; dome(); c.stroke();
    // top specular, kept SHORT and fading at both ends â€” a highlight that runs
    // the whole width is a glass dome, not a painted shell
    const hspec = c.createLinearGradient(-7, hy - 11, 12, hy - 10);
    hspec.addColorStop(0, 'rgba(255,255,255,0)');
    hspec.addColorStop(0.35, 'rgba(255,255,255,0.95)');
    hspec.addColorStop(1, 'rgba(255,255,255,0)');
    c.strokeStyle = hspec; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-6, hy - 10.4); c.quadraticCurveTo(4, hy - 11.6, 11, hy - 10); c.stroke();
    // cool back-rim down the shadow edge of the skull
    const hrim = c.createLinearGradient(13, hy - 8, 15, hy + 5);
    hrim.addColorStop(0, 'rgba(150,205,255,0)');
    hrim.addColorStop(0.45, 'rgba(150,205,255,0.55)');
    hrim.addColorStop(1, 'rgba(150,205,255,0)');
    c.strokeStyle = hrim; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(14.4, hy - 8); c.quadraticCurveTo(15.6, hy - 2, 12.4, hy + 6); c.stroke();
    if (hero) {
      // bronze helmet with crimson crest (gold at apex)
      c.fillStyle = evo >= 3 ? '#e6c56f' : '#b8934c';
      c.beginPath(); c.arc(6, hy - 6, 11, Math.PI, 0); c.fill();
      c.fillRect(-5, hy - 7, 22, 3);
      c.strokeStyle = '#e63946'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.arc(4, hy - 8, 13, Math.PI * 1.15, Math.PI * 1.8); c.stroke();
      if (evo >= 3) {
        // divine laurel glow
        c.strokeStyle = '#c8ffa0'; c.shadowColor = '#c8ffa0'; c.shadowBlur = 8; c.lineWidth = 2.5;
        c.beginPath(); c.arc(6, hy - 5, 12.5, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
        c.shadowBlur = 0;
      }
    } else {
      // antenna ears â€” one of the three features that must read at 36px:
      // tall, set on top of the dome, cyan sensor inners. The TIPS carry
      // inertia: swept back at a run, thrown up in a fall â€” plus the idle
      // twitch, one ear at a time on its randomized timer
      const eT = this.earTwitchT > 0 ? Math.sin(this.earTwitchT * 34) * this.earTwitchT * 8.5 : 0;
      const eLx = this.earL || 0, eLy = clamp(-this.vy * 0.004, -3, 3);
      const lTx = eLx + (this.earTwitchSide < 0 ? eT : 0);
      const rTx = eLx + (this.earTwitchSide > 0 ? eT : 0);
      // AN EAR IS NOT A TRIANGLE. These were three straight lines each, filled
      // flat, with a flat triangle of cyan inside â€” raw primitives at their
      // default orientation, which is the exact signature of programmer art
      // and the flattest thing left on her once the dome was lit. A real ear
      // curves INWARD along its outer edge and cups toward the head; a
      // triangle never does either.
      //
      // Each ear is now a path with a concave outer edge and a rounded tip,
      // shaded by the same upper-left lamp as the rest of her â€” lit on the
      // outer face, dropping into shadow toward the cup.
      // ONE EAR, STATED PLAINLY. Written with sign arithmetic first and got
      // knobs, spikes and splayed bulges out of it three times running â€” the
      // control points are easier to reason about named than mirrored.
      //   bo = base outer (against the skull)   bi = base inner
      //   tip = where it points, carrying the twitch and the fall-inertia
      // The outer edge bows INWARD on its way up, which is the one thing a
      // triangle cannot do and the reason ears drawn as triangles read as
      // cardboard.
      const earPath = (bo, bi, tipX, co, ci) => {
        const ty = hy - 21.5 + eLy;
        c.beginPath();
        c.moveTo(bo, hy - 8);
        c.quadraticCurveTo(co, hy - 15.5, tipX, ty);          // outer, concave
        c.quadraticCurveTo(ci, hy - 14.5, bi, hy - 9.6);      // inner, back to the skull
        c.quadraticCurveTo((bo + bi) / 2, hy - 7.6, bo, hy - 8);
        c.closePath();
      };
      const EARS = [
        { bo: -11.5, bi: -1.5, tip: -6.5 + lTx, co: -11.2, ci: -3.4, gx: -12, gy: 0 },
        { bo: 15.5, bi: 5.5, tip: 10.5 + rTx, co: 15.2, ci: 7.4, gx: 16, gy: 4 },
      ];
      for (const E of EARS) {
        const eg = c.createLinearGradient(E.gx, hy - 20, E.bi, hy - 8);
        eg.addColorStop(0, '#ffffff');
        eg.addColorStop(0.4, '#e6e8ec');
        eg.addColorStop(0.76, '#a6aebe');
        eg.addColorStop(1, '#79839a');
        c.fillStyle = eg; earPath(E.bo, E.bi, E.tip, E.co, E.ci); c.fill();
        // the cup â€” the inner face turns away from the lamp hardest
        c.save(); earPath(E.bo, E.bi, E.tip, E.co, E.ci); c.clip();
        const cup = c.createLinearGradient(E.bi, hy - 9, E.tip, hy - 19);
        cup.addColorStop(0, 'rgba(56,66,90,0.5)'); cup.addColorStop(1, 'rgba(56,66,90,0)');
        c.fillStyle = cup; c.fillRect(-16, hy - 26, 36, 22);
        c.restore();
        c.strokeStyle = 'rgba(120,131,150,0.8)'; c.lineWidth = 0.8;
        earPath(E.bo, E.bi, E.tip, E.co, E.ci); c.stroke();
      }
      // the sensor inside each ear: a lit membrane, brightest at the base where
      // the light in it comes from, not a flat cyan wedge
      const sens = (ax, tx2, bx2, ty) => {
        const sg = c.createLinearGradient(0, ty, 0, hy - 9.5);
        sg.addColorStop(0, 'rgba(255,255,255,0.5)');
        sg.addColorStop(0.45, P.glow);
        sg.addColorStop(1, 'rgba(20,60,70,0.55)');
        c.fillStyle = sg;
        c.beginPath(); c.moveTo(ax, hy - 9.5);
        c.quadraticCurveTo((ax + tx2) / 2, hy - 14, tx2, ty);
        c.quadraticCurveTo((tx2 + bx2) / 2, hy - 13.5, bx2, hy - 10.5);
        c.closePath(); c.fill();
      };
      c.globalAlpha = 0.85;
      sens(-9, -6.4 + lTx * 0.72, -3, hy - 17 + eLy * 0.72);
      sens(12.6, 9.6 + rTx * 0.72, 6.4, hy - 17 + eLy * 0.72);
      c.globalAlpha = 1;
      if (evo >= 3) {
        // apex antennae with glowing tips
        c.strokeStyle = '#ffd76a'; c.lineWidth = 1.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-6, hy - 20); c.lineTo(-9, hy - 27); c.moveTo(10, hy - 20); c.lineTo(13, hy - 27); c.stroke();
        c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 6;
        c.beginPath(); c.arc(-9, hy - 27, 1.6, 0, 7); c.arc(13, hy - 27, 1.6, 0, 7); c.fill();
        c.shadowBlur = 0;
      }
    }
    // THE VISOR â€” and this was the flattest thing on her, which matters more
    // than anything else on the model because it is where the eye goes.
    //
    // It was a black capsule with two flat rectangles laid on top: features
    // sitting ON the face as separate marks, the emoji-face error. A visor is
    // a LENS SET INTO A SOCKET, and three things say so â€” the socket is cut
    // into the skull and shades its own upper lip, the eyes glow from BEHIND
    // the glass rather than being painted on it, and the glass carries a
    // reflection of the room that the eyes do not move with.
    const vis = () => rr(c, -8, hy - 7, 22, 10, 5);
    c.fillStyle = hero ? '#2a1e10' : '#0a1420'; vis(); c.fill();
    c.save(); vis(); c.clip();
    // the socket is RECESSED: the skull above it casts down into the well
    const well = c.createLinearGradient(0, hy - 7, 0, hy - 1);
    well.addColorStop(0, 'rgba(0,0,0,0.75)'); well.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = well; c.fillRect(-9, hy - 8, 24, 8);
    // eye blocks slide inside the band when she glances around while idle
    const lk = clamp(this.lookX || 0, -2.4, 2.4);
    const eyeCol = this.healT > 0 ? '#aef7d8' : P.glow;
    // behind the glass: a soft bloom pool, then the hard element inside it, so
    // the light has somewhere to come FROM
    c.globalCompositeOperation = 'lighter';
    for (const ex of [-1.75 + lk, 8.25 + lk]) {
      const pool = c.createRadialGradient(ex, hy - 2, 0.5, ex, hy - 2, 7);
      pool.addColorStop(0, eyeCol); pool.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = 0.5; c.fillStyle = pool;
      c.beginPath(); c.arc(ex, hy - 2, 7, 0, 7); c.fill();
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.fillStyle = eyeCol; c.shadowColor = eyeCol; c.shadowBlur = 8;
    rr(c, -5 + lk, hy - 4.8, 6.5, 5.6, 1.6); c.fill();
    rr(c, 5 + lk, hy - 4.8, 6.5, 5.6, 1.6); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(190,255,246,0.75)';                // hot top edge of each element
    c.fillRect(-5 + lk, hy - 4.8, 6.5, 1.3); c.fillRect(5 + lk, hy - 4.8, 6.5, 1.3);
    // THE GLASS ITSELF, in front of everything: a curved sheen running down
    // from the upper left, which is what makes the band read as a covered lens
    // instead of a hole with lights in it. It does NOT track the eyes â€” a
    // reflection belongs to the room, not to where she is looking.
    const gl = c.createLinearGradient(-8, hy - 7, 6, hy + 3);
    gl.addColorStop(0, 'rgba(255,255,255,0.34)');
    gl.addColorStop(0.42, 'rgba(255,255,255,0.07)');
    gl.addColorStop(0.62, 'rgba(255,255,255,0)');
    c.fillStyle = gl;
    c.beginPath();
    c.moveTo(-8, hy - 7); c.lineTo(9, hy - 7);
    c.quadraticCurveTo(-1, hy - 3.4, -8, hy + 1);
    c.closePath(); c.fill();
    c.restore();
    c.strokeStyle = 'rgba(58,58,74,0.9)'; c.lineWidth = 1; vis(); c.stroke();
    // a bright lip on the top edge of the bezel â€” the socket has a thickness
    const lip = c.createLinearGradient(-6, hy - 7, 10, hy - 6);
    lip.addColorStop(0, 'rgba(226,236,250,0)');
    lip.addColorStop(0.4, 'rgba(226,236,250,0.7)');
    lip.addColorStop(1, 'rgba(226,236,250,0)');
    c.strokeStyle = lip; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(-5, hy - 6.6); c.lineTo(11, hy - 6.6); c.stroke();
    if (!hero) {
      // whisker antennae
      c.strokeStyle = 'rgba(200,220,240,0.7)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(15, hy - 1); c.lineTo(21, hy - 3); c.moveTo(15, hy + 2); c.lineTo(21, hy + 3); c.stroke();
    }
    // visor scan sweep â€” the cyan bar crossing the whole band
    const scn = this.anim % 2.6;
    if (scn < 0.45) {
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.fillRect(-7 + (scn / 0.45) * 19, hy - 6, 2.6, 8);
    }
    // panel seam + vents on torso
    c.strokeStyle = 'rgba(70,85,105,0.55)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-9, -16 + bob * 0.4); c.lineTo(7, -16 + bob * 0.4); c.stroke();
    c.fillStyle = (this.dashT > 0 || this.healT > 0) ? P.glow : 'rgba(70,85,105,0.6)';
    for (let k = 0; k < 3; k++) c.fillRect(-10 + k * 3, -12 + bob * 0.4, 1.6, 4);
    // --- front arm: a cat scratches â€” the paw rakes, nothing is held.
    // (the hero form still carries the volt-blade through the old arcs) ---
    {
      // The shoulder used to sit at x=6 â€” six pixels inside a torso that is
      // seventeen wide. Every resting and running pose therefore put the whole
      // arm INSIDE her own silhouette, in the same metal as the belly: drawn
      // every frame, visible in none of them. It rides on the front edge now,
      // and every pose below is aimed to keep the paw clear of the body.
      const shX = 10, shY = -20 + bob * 0.4;
      let ang, reach = 14;
      // which paw is throwing, and where it is â€” resolved once, read by the
      // limb here, by the rear arm below, and by the claw effect
      const swingPose = this.swingVis ? slashPose(this.swingVis, this.face, false) : null;
      const swingHand = swingPose ? swingPose.hand : null;
      if (this.hurtPoseT > 0) {
        // knockback flail: the arm windmills for a beat
        ang = -1.9 + Math.sin(this.anim * 36) * 0.75; reach = 13;
      } else if (this.swingVis && (hero || swingHand !== 'B')) {
        const sv = this.swingVis;
        if (hero) {
          const prRaw = clamp(1 - sv.t / sv.t0, 0, 1);
          const pr = prRaw < 0.18 ? -(prRaw / 0.18) * 0.34 : (prRaw - 0.18) / 0.82;
          const prc = Math.max(0, pr);
          const aim = sv.ang * (this.face < 0 ? -1 : 1);
          // sword arcs: long, shoulder-led
          if (sv.combo === 2) ang = aim - 1.5 + pr * 2.8;
          else if (sv.combo === 1) ang = aim + 1.15 - pr * 2.2;
          else ang = aim - 1.0 + pr * 2.1;
          reach = 13 + Math.sin(prc * Math.PI) * 4;
        } else {
          ang = swingPose.ang; reach = swingPose.reach;
        }
      } else if (this.swingVis && swingHand === 'B') {
        // the OTHER paw is throwing this one. This arm braces across the chest
        // rather than mirroring the strike â€” a cat that rakes with one forepaw
        // plants the other, it does not swing both at everything.
        ang = 0.35 + swingPose.p * 0.3; reach = 12.5;
      } else if (this.wallSlide !== 0) {
        // wall-slide: palm planted on the wall above the shoulder
        ang = -0.9 + Math.sin(this.anim * 3) * 0.05; reach = 13.5;
      } else if (run && sprintK > 0.25) {
        // NINJA SPRINT: the arm sweeps back â€” but LOW, past the hip, so the paw
        // clears the belly instead of disappearing into it
        ang = 1.35 + sprintK * 0.5 + Math.sin(ph) * 0.12;
        reach = 15 + sprintK * 4;
      } else {
        // relaxed guard, held at the front edge of the chest where it can be
        // seen: the paw pumps a little with the walk and breathes at a stand
        const armSw = run ? Math.sin(ph + Math.PI) : 0;
        ang = 0.72 + armSw * 0.26 + Math.sin(this.anim * 2) * 0.06;
        reach = 14 + armSw * 1.2;
      }
      // Everything above only says where the arm WANTS to be. The spring says
      // where it is â€” stiff through a strike so the rake keeps its snap, loose
      // the rest of the time so travel, landing and idle flow into each other.
      const stiff = this.swingVis ? 900 : this.hurtPoseT > 0 ? 700 : 230;
      ang = rigAng(this, 'armA', ang, stiff, this.rigDt);
      reach = rigStep(this, 'armR', reach, stiff * 0.75, this.rigDt);
      const hx = shX + Math.cos(ang) * reach, hy = shY + Math.sin(ang) * reach;
      // the elbow is SOLVED now. The bones grow with the reach, so a tucked arm
      // folds hard and an extended one straightens out â€” the fold itself
      // animates, which is most of what sells a limb as jointed
      const bone = Math.max(7.6, reach * 0.56);
      const el = rigIK(shX, shY, hx, hy, bone, bone, -1);
      const ex = el.x, ey = el.y;
      // upper + fore arm â€” chubby means round little arms too. Drawn twice: a
      // dark contour underneath, then the metal inside it. Without the contour
      // the arm is the same value as the belly it crosses and vanishes into it,
      // which is exactly what it used to do.
      armBones(c, shX, shY, ex, ey, hx, hy, false, P.glow);
      // THE PAW. It was a circle, which meant it pointed nowhere and could not
      // lead or trail the arm. It is now a pad with three toes, and its wrist
      // rides a softer spring than the arm does â€” so it drags behind the swing
      // and whips through at the end, the way a real paw follows a foreleg.
      const wr = rigAng(this, 'armW', ang, this.swingVis ? 520 : 160, this.rigDt);
      const spread = this.swingVis ? 1 + Math.sin(clamp(1 - this.swingVis.t / this.swingVis.t0, 0, 1) * Math.PI) * 0.5 : 1;
      armPaw(c, hx, hy, wr, spread, false);
      // the cut is drawn later, in world space, and has to know where this paw
      // finished â€” otherwise it goes back to guessing from the aim
      // the same condition the near arm is drawn under, so the mark can never
      // describe a limb that is not on screen: in hero form this arm throws
      // every beat, in cat form the middle beat belongs to the other paw
      if (this.swingVis && (hero || swingHand !== 'B'))
        rakeMark(this, c, shX, shY, hx, hy, swingPose ? swingPose.dir : 1, false);
      // (the shoulder and elbow lights are part of the joints themselves now)
      // FERAL CLAWS: three purple energy talons splay from the paw
      if (this.clawT > 0) {
        c.save(); c.translate(hx, hy); c.rotate(ang);
        const flick = 0.85 + Math.sin(this.anim * 22) * 0.15;
        for (let k = -1; k <= 1; k++) {
          const len = (15 + Math.abs(k) * -3) * flick, spread = k * 0.34;
          c.save(); c.rotate(spread);
          const cg2 = c.createLinearGradient(0, 0, len, 0);
          cg2.addColorStop(0, 'rgba(255,255,255,0.95)');
          cg2.addColorStop(0.45, '#e0a0ff'); cg2.addColorStop(1, 'rgba(176,106,255,0)');
          c.fillStyle = cg2; c.shadowColor = '#b06aff'; c.shadowBlur = 12;
          c.beginPath(); c.moveTo(0, -2.2); c.quadraticCurveTo(len * 0.6, -1.6, len, 0);
          c.quadraticCurveTo(len * 0.6, 1.6, 0, 2.2); c.closePath(); c.fill();
          c.shadowBlur = 0; c.restore();
        }
        c.restore();
      }
      // THE RAKE ITSELF used to be drawn here, and that was the bug. Inside her
      // transform it inherits everything the body is doing: the double jump's
      // spiral squashes it to half width and mirrors it, the sprint's forward
      // pitch tips it over, and â€” because it was centred on a paw that is inside
      // her silhouette at both ends of the swing â€” the arc washed straight
      // across her chest. It is now composited in world space, after her, in
      // front of her. See the swing block further down.
      // the cat's own claws bare from the paw for the strike: three hooked
      // talons splayed along the swipe, steel-white with glowing tips
      if (this.swingVis && this.clawT <= 0 && !hero && swingHand !== 'B') {
        c.save(); c.translate(hx, hy); c.rotate(ang);
        for (let k = -1; k <= 1; k++) {
          const len = 11 - Math.abs(k) * 2, spread = k * 0.38;
          c.save(); c.rotate(spread);
          // claw steel per the locked palette: #C0C0D0 body, #E8E8FF edge
          const cg2 = c.createLinearGradient(0, 0, len, 0);
          cg2.addColorStop(0, '#e8e8ff'); cg2.addColorStop(0.55, '#c0c0d0'); cg2.addColorStop(1, P.glow);
          c.fillStyle = cg2; c.shadowColor = P.glow; c.shadowBlur = 8;
          // hooked like a real claw: curves down toward the tip
          c.beginPath(); c.moveTo(0, -1.6);
          c.quadraticCurveTo(len * 0.55, -2.2, len, 1.2);
          c.quadraticCurveTo(len * 0.5, 1.8, 0, 1.6); c.closePath(); c.fill();
          c.shadowBlur = 0; c.restore();
        }
        c.restore();
      }
      // ---- THE FAR PAW'S OWN BEAT ----------------------------------------
      // The second hit of the string is thrown by the OTHER foreleg, and the
      // rear arm lives behind the body, so it is drawn again here â€” in front,
      // for exactly as long as it is striking. Darker than the near one, so it
      // still reads as the far side rather than as this arm teleporting.
      if (this.swingVis && !hero && (swingHand === 'B' || swingHand === 'X')) {
        const bp = slashPose(this.swingVis, this.face, swingHand === 'X');
        const bsx = -2, bsy = -19 + bob * 0.4;
        const ba = rigAng(this, 'armFB', bp.ang, 900, this.rigDt);
        const br = rigStep(this, 'armFBR', bp.reach, 700, this.rigDt);
        const bhx = bsx + Math.cos(ba) * br, bhy = bsy + Math.sin(ba) * br;
        const bbone = Math.max(7.2, br * 0.56);
        const bel = rigIK(bsx, bsy, bhx, bhy, bbone, bbone, -1);
        armBones(c, bsx, bsy, bel.x, bel.y, bhx, bhy, true, null);
        const bwr = rigAng(this, 'armFBW', ba, 520, this.rigDt);
        armPaw(c, bhx, bhy, bwr, 1 + Math.sin(bp.p * Math.PI) * 0.5, true);
        if (this.clawT <= 0) {
          c.save(); c.translate(bhx, bhy); c.rotate(ba);
          for (let k = -1; k <= 1; k++) {
            const len = 10 - Math.abs(k) * 2;
            c.save(); c.rotate(k * 0.38);
            const cg3 = c.createLinearGradient(0, 0, len, 0);
            cg3.addColorStop(0, '#cfd6e6'); cg3.addColorStop(0.55, '#9aa3b6'); cg3.addColorStop(1, P.glow);
            c.fillStyle = cg3; c.shadowColor = P.glow; c.shadowBlur = 6;
            c.beginPath(); c.moveTo(0, -1.5);
            c.quadraticCurveTo(len * 0.55, -2, len, 1.1);
            c.quadraticCurveTo(len * 0.5, 1.7, 0, 1.5); c.closePath(); c.fill();
            c.shadowBlur = 0; c.restore();
          }
          c.restore();
        }
        rakeMark(this, c, bsx, bsy, bhx, bhy, bp.dir, true);
      }
      // the blade, held IN the paw â€” hero form only
      if (this.swingVis && this.clawT <= 0 && hero) {
        c.save(); c.translate(hx, hy); c.rotate(ang + Math.PI / 2);
        c.fillStyle = '#5c6678'; c.fillRect(-1.8, 0, 3.6, 7);        // grip
        c.fillStyle = '#8892a2'; c.fillRect(-4.5, -1.5, 9, 3);       // guard
        const bl = 30;
        const bg2 = c.createLinearGradient(0, -bl, 0, 0);
        bg2.addColorStop(0, '#ffffff'); bg2.addColorStop(0.55, '#eaf6ff'); bg2.addColorStop(1, P.glow);
        c.fillStyle = bg2; c.shadowColor = P.glow; c.shadowBlur = 12;
        c.beginPath(); c.moveTo(-2, -2); c.lineTo(-1.6, -bl + 4); c.lineTo(0, -bl);
        c.lineTo(1.6, -bl + 4); c.lineTo(2, -2); c.closePath(); c.fill();
        c.shadowBlur = 0;
        c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 0.9;
        c.beginPath(); c.moveTo(-0.4, -5); c.lineTo(0, -bl + 4); c.stroke();   // edge highlight
        c.restore();
      }
    }
    // THE BACK JET at full burn â€” the double jump's engine. A single hard
    // plume from the lower back, angled down and behind her, with shock
    // diamonds stepped along it: a jet, not a candle. Additive light only.
    //
    // AND IT IS SCOPED TO THIS BRANCH ON PURPOSE â€” checked 2026-08-21 against
    // the request to composite assets/characters/gear/jetpack_fire.png onto her
    // back here. The plate path does not need it: heroState returns 'djump_jet'
    // for the whole boost and cell 12 of the sheet ALREADY has the pack strapped
    // on and firing, drawn at her scale from her own side view. Compositing the
    // gear render over it puts a second jetpack across her chest â€” measured, not
    // guessed. The two gear plates are illustrations of the object, not rig
    // parts; the surface that wants them is the shop/inventory card, not the
    // body. This plume is for the seconds before the sheet lands, and that is
    // the only body that has no engine drawn on it.
    if ((this.boostT || 0) > 0) {
      const bk = this.boostT / 0.3;
      c.save(); c.globalCompositeOperation = 'lighter';
      c.translate(-9, -14);                      // the pack sits on her lower back
      c.rotate(0.5);                             // exhaust thrown down-behind
      const L = 26 + bk * 22 + rnd(-2, 2);
      const jg = c.createLinearGradient(0, 0, 0, L);
      jg.addColorStop(0, '#ffffff'); jg.addColorStop(0.25, '#8ff6ff');
      jg.addColorStop(0.6, '#37ffd0'); jg.addColorStop(1, 'rgba(55,255,208,0)');
      c.fillStyle = jg; c.globalAlpha = 0.55 + bk * 0.4;
      c.beginPath(); c.moveTo(-4.5, 0); c.lineTo(4.5, 0); c.lineTo(1.5, L); c.lineTo(-1.5, L); c.closePath(); c.fill();
      // shock diamonds â€” the read that says PRESSURE rather than flame
      c.fillStyle = '#ffffff';
      for (let q = 1; q <= 3; q++) {
        const dy2 = q * L * 0.24, w2 = (4.2 - q) * 1.15 * bk;
        c.globalAlpha = (0.5 - q * 0.12) * bk;
        c.beginPath(); c.moveTo(0, dy2 - w2); c.lineTo(w2, dy2); c.lineTo(0, dy2 + w2); c.lineTo(-w2, dy2); c.closePath(); c.fill();
      }
      c.restore();
    }
    }  // end of the procedural body â€” the jets below draw in BOTH paths
    // thruster jets
    if (this.jetT > 0 || (!this.on && this.vy < -140 && this.dashT <= 0)) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const px of (this.flipT > 0 ? [-7, 6] : [-8])) {
        const L = rnd(8, 15) + (this.jetT > 0 ? 5 : 0);
        // spec Â§2.3: jet-orange core fading to cyan at the edge
        const jg = c.createLinearGradient(px, -6, px - 5, -6 + L + 8);
        jg.addColorStop(0, '#fff1d8'); jg.addColorStop(0.4, '#ff8c42'); jg.addColorStop(1, 'rgba(55,255,208,0)');
        c.fillStyle = jg;
        c.beginPath(); c.moveTo(px - 2.4, -6); c.lineTo(px + 2.4, -6); c.lineTo(px - 4, -6 + L + 8); c.closePath(); c.fill();
      }
      c.restore();
    }
    }
    c.restore();
    // combo pips â€” 1/2/3 tiny lights above the head while the chain is alive;
    // the newest pip burns white so you can read where you are mid-combo
    if (this.comboT > 0) {
      const n = this.combo + 1, a = clamp(this.comboT / 0.3, 0, 1);
      c.save(); c.globalAlpha = 0.85 * a;
      for (let i = 0; i < n; i++) {
        const px2 = this.x + this.w / 2 + (i - (n - 1) / 2) * 9;
        c.fillStyle = i === n - 1 ? '#ffffff' : PAL[G.roomDef.zone].glow;
        c.shadowColor = PAL[G.roomDef.zone].glow; c.shadowBlur = 6;
        c.beginPath(); c.arc(px2, this.y - 12, i === n - 1 ? 2.6 : 2, 0, 7); c.fill();
      }
      c.shadowBlur = 0; c.restore(); c.globalAlpha = 1;
    }
    // Authored effects replace the procedural slash only when both images loaded.
    // Impact particles and sounds still come from confirmed gameplay contacts.
    // the scratch itself is drawn on the slash layer, after her (D1); here it
    // only decides whether the procedural fallback below is needed
    const scratchDrawn = this.scratchWakeReady();
    this._slashScratch = scratchDrawn;
    if (this.swingVis && !scratchDrawn && this._authoredSwingFx !== this.swingVis) {
      const sv = this.swingVis;
      const p = 1 - sv.t / sv.t0;
      // ---- THE SWIRL draws its own thing and nothing else ------------------
      // The rake arcs follow her PAWS, and through a pirouette the paws go
      // round with her â€” which would draw two arcs chasing each other's tails
      // and read as a mess. The dance is one shape, so it is drawn as one: a
      // ring the blades are cutting, opened into petals where they cross.
      if (sv.swirl) {
        const cx = this.x + this.w / 2, cy = this.y + this.h / 2 - 4;
        const spin = p * Math.PI * 3.2;                 // a turn and a half
        const grow = Math.sin(Math.min(1, p * 1.25) * Math.PI * 0.5);   // opens fast
        const fade = 1 - Math.max(0, (p - 0.72) / 0.28);                // closes late
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.translate(cx, cy);
        c.rotate(spin);
        c.scale(1, 0.46);                               // seen from above-ish, so it lies flat
        const R = SWIRL_R * (0.55 + grow * 0.55);
        // FIVE PETALS, the shape the art plate carries: a rose curve, which is
        // what two blades crossing on a turn actually leave behind
        for (const pass of [0, 1]) {
          c.beginPath();
          for (let i = 0; i <= 96; i++) {
            const a = i / 96 * Math.PI * 2;
            const rr2 = R * (0.72 + 0.28 * Math.cos(a * 5 + pass * Math.PI));
            const px = Math.cos(a) * rr2, py = Math.sin(a) * rr2;
            i ? c.lineTo(px, py) : c.moveTo(px, py);
          }
          c.closePath();
          c.strokeStyle = pass ? 'rgba(190,245,255,' + (0.5 * fade).toFixed(3) + ')'
                               : 'rgba(255,255,255,' + (0.85 * fade).toFixed(3) + ')';
          c.lineWidth = pass ? 5.5 : 2.4;
          c.shadowColor = '#dff6ff'; c.shadowBlur = pass ? 16 : 7;
          c.stroke();
        }
        c.restore();
        // motes thrown off the ring, in world space so they do not spin with it
        if (chance(0.7)) {
          const a = rnd(0, 7);
          addPart(cx + Math.cos(a) * SWIRL_R * 0.9, cy + Math.sin(a) * SWIRL_R * 0.42,
                  Math.cos(a) * 90, Math.sin(a) * 42 - 30, 0.4, '#ffffff', 2.2, 40, true);
        }
        c.globalCompositeOperation = 'source-over';
        return;
      }
      const ease = p * p * (3 - 2 * p);
      const gcol = PAL[G.roomDef.zone].glow;
      const empowered = this.clawT > 0;
      const divineHit = empowered && typeof isHero === 'function' && isHero();
      const clawed = empowered && !divineHit;
      const col = divineHit ? '#ffd76a' : clawed ? '#b06aff' : (sv.combo === 2 ? '#ffd76a' : gcol);
      // Resolve the paws recorded during the body pass into world space. The old
      // conversion did this by hand â€” body centre, plus the local x flipped by
      // the facing sign â€” which quietly ignored the facing SCALE, the run lean,
      // the landing squash, the evolution scale and, worst of all, the double
      // jump's spiral. Ask the context instead: it knows the exact matrix each
      // paw was drawn under, and the inverse of the world matrix takes it back.
      const marks = [];
      if (this._rake && this._rake.length) {
        const inv = c.getTransform().invertSelf();
        for (const rk of this._rake) {
          const M = inv.multiply(rk.m);
          const o = M.transformPoint(new DOMPoint(rk.sx, rk.sy));   // shoulder
          const t = M.transformPoint(new DOMPoint(rk.x, rk.y));     // paw
          // a mirrored frame reverses which way an arc sweeps, so the travel
          // direction has to be mirrored with it or the cut bows the wrong way
          const mir = M.a * M.d - M.b * M.c < 0 ? -1 : 1;
          marks.push({ sx: o.x, sy: o.y, x: t.x, y: t.y,
                       a: Math.atan2(t.y - o.y, t.x - o.x),
                       r: Math.hypot(t.x - o.x, t.y - o.y),
                       dir: rk.dir * mir, far: rk.far });
        }
      }
      // THE AUTHORED RAKE, composited in world space so nothing the body is
      // doing can deform it. Each beat of the combo escalates the shape and the
      // finisher is a crossing double-rake; the sheet is painted on black, so
      // brightness IS the alpha and no cutting is needed.
      // ...ON ITS OWN LAYER (handoff Part 2 D1): the marks are kept, and
      // drawSlashLayer composites them after her body is finished, each with
      // its glowing duplicate on top, the way Silksong ships every slash.
      this._slashMarks = hero ? null : marks;
      // WRATH OF OLYMPUS: the cut lands as a forked thunderbolt
      const boltCut = (len, wid, alpha) => {
        const hl = len / 2;
        c.save();
        for (let pass = 0; pass < 2; pass++) {
          c.globalAlpha = alpha * (pass ? 1 : 0.85);
          c.strokeStyle = pass ? '#ffffff' : '#ffb43c';
          c.lineWidth = pass ? 2.4 : 6.5; c.lineCap = 'round'; c.lineJoin = 'round';
          c.shadowColor = '#ffd76a'; c.shadowBlur = pass ? 12 : 24;
          c.beginPath(); c.moveTo(-hl, 6);
          for (let s2 = 1; s2 <= 4; s2++)
            c.lineTo(-hl + (len * s2) / 5 + rnd(-4, 4), -wid * 0.55 * Math.sin((s2 / 5) * Math.PI) + rnd(-5, 5));
          c.lineTo(hl, 2); c.stroke();
          // a forked branch splitting off the main arc
          c.lineWidth = pass ? 1.4 : 3.4;
          c.beginPath(); c.moveTo(0, -wid * 0.4);
          c.lineTo(hl * 0.35 + rnd(-4, 4), -wid * 0.15); c.lineTo(hl * 0.55, wid * 0.35);
          c.stroke();
        }
        c.shadowBlur = 0; c.restore(); c.globalAlpha = 1;
      };
      // the cat's cut is a CLAW RAKE: three curved talon crescents, sharp at
      // both ends, full in the belly â€” the wake of a paw, not a sword edge
      const talonRake = (len, wid, alpha, body, edge) => {
        body = body || col; edge = edge || '#ffffff';
        const hl = len / 2;
        c.save();
        for (let k = -1; k <= 1; k++) {
          const off = k * wid * 0.42, L = hl * (1 - Math.abs(k) * 0.14), W = wid * (1 - Math.abs(k) * 0.1);
          c.globalAlpha = alpha * (1 - Math.abs(k) * 0.2);
          c.shadowColor = body; c.shadowBlur = 14;
          c.fillStyle = body;
          c.beginPath();
          c.moveTo(-L, 6 + off);
          c.quadraticCurveTo(0, -W + off, L, 1 + off);
          c.quadraticCurveTo(0, -W * 0.55 + off, -L, 6 + off);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          // razor edge along the leading curve
          c.strokeStyle = edge; c.globalAlpha = alpha * (0.9 - Math.abs(k) * 0.25);
          c.lineWidth = 1.6; c.lineCap = 'round';
          c.beginPath(); c.moveTo(-L * 0.94, 5 + off);
          c.quadraticCurveTo(0, -W * 0.96 + off, L * 0.94, 0.5 + off); c.stroke();
        }
        c.restore(); c.globalAlpha = 1;
      };
      // in claw mode a strike is a RAKE: three parallel talon streaks
      const cut = divineHit ? boltCut : clawed ? (len, wid, alpha) => {
        const hl = len / 2;
        c.save();
        for (let k = -1; k <= 1; k++) {
          const off = k * wid * 0.34, thin = 3.4 - Math.abs(k) * 1.1;
          c.globalAlpha = alpha * (1 - Math.abs(k) * 0.18);
          // deep violet body so the rake stays purple through the bloom pass
          c.strokeStyle = '#8a2be2'; c.shadowColor = '#7a1fd0'; c.shadowBlur = 10;
          c.lineWidth = thin * 1.5; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(-hl * 0.95, 5 + off);
          c.quadraticCurveTo(0, -wid * 0.7 + off, hl * 0.95, 1 + off);
          c.stroke();
          c.strokeStyle = '#c77dff'; c.lineWidth = thin * 0.75; c.shadowBlur = 6;
          c.beginPath();
          c.moveTo(-hl * 0.95, 5 + off);
          c.quadraticCurveTo(0, -wid * 0.7 + off, hl * 0.95, 1 + off);
          c.stroke();
          c.shadowBlur = 0;
          c.strokeStyle = 'rgba(255,240,255,' + (alpha * 0.55) + ')'; c.lineWidth = thin * 0.22;
          c.beginPath();
          c.moveTo(-hl * 0.9, 5 + off);
          c.quadraticCurveTo(0, -wid * 0.7 + off, hl * 0.9, 1 + off);
          c.stroke();
        }
        c.restore(); c.globalAlpha = 1;
      } : (len, wid, alpha) => talonRake(len, wid, alpha, col);
      if (sv.combo === 3) {
        // SUPERCHARGED: two claw sweeps closing in an X in front of the cat â€”
        // gold over zone-glow, a shock ring, and a four-point spark at the cross
        const cbx = this.x + this.w / 2 + (this.face || 1) * 34, cby = this.y + this.h / 2;
        const a3 = Math.min(1, (1 - p) * 1.7);
        const drift3 = (1 - ease) * 0.3;
        c.save();
        c.translate(cbx, cby);
        c.globalCompositeOperation = 'lighter';
        // slim shock ring racing outward from the cross
        c.globalAlpha = a3 * 0.8;
        c.strokeStyle = '#ffffff'; c.shadowColor = gcol; c.shadowBlur = 22;
        c.lineWidth = 3.5 * (1 - p * 0.6);
        c.beginPath(); c.arc(0, 0, 34 + ease * 104, 0, 7); c.stroke();
        c.shadowBlur = 0;
        // the two rakes: they close toward each other as the strike settles
        const gr3 = 0.7 + ease * 0.55;
        c.save(); c.rotate(-0.62 + drift3); c.scale(gr3, gr3);
        talonRake(158, 44, a3, '#ffd76a'); c.restore();
        c.save(); c.rotate(0.62 - drift3); c.scale(gr3, -gr3);
        talonRake(158, 44, a3 * 0.92, gcol); c.restore();
        // spark cross where the claws meet
        c.globalAlpha = a3;
        c.strokeStyle = '#ffffff'; c.shadowColor = '#ffd76a'; c.shadowBlur = 16;
        c.lineWidth = 2.2; c.lineCap = 'round';
        c.rotate(ease * 0.6);
        for (let k = 0; k < 4; k++) {
          c.rotate(Math.PI / 2);
          c.beginPath(); c.moveTo(4, 0); c.lineTo(20 + ease * 14, 0); c.stroke();
        }
        c.restore();
        c.globalAlpha = 1;
      } else {
      c.save();
      // THE CUT COMES OFF THE PAW, AND HANGS IN FRONT OF HER.
      //
      // It was already anchored to the paw and rotated by the paw's live angle,
      // which fixed the hand looking detached. What it was still doing wrong is
      // sitting CENTRED on that paw â€” and the paw is inside her silhouette at
      // the start and the end of every swing, and is dragged back inside it by
      // its own spring whenever she is running or has just left the ground. So
      // the rear half of every rake was painted across her own chest, and the
      // faster she moved the more of it landed on her. A cat does not wear the
      // mark it makes: the claws lead, the cut hangs in the air ahead of them.
      //
      // The stroke is now laid ACROSS the swing rather than along it â€” see
      // rakePlace â€” and carried out to a radius that clears her, with the paw
      // leading the mark it is making.
      const mk3 = marks[0] || {
        sx: this.x + this.w / 2, sy: this.y + this.h - 20,
        x: this.x + this.w / 2 + Math.cos(sv.ang) * 26,
        y: this.y + this.h - 20 + Math.sin(sv.ang) * 26,
        a: sv.ang, r: 26, dir: 1,
      };
      const pd3 = mk3.dir;
      c.globalCompositeOperation = 'lighter';
      const grow = 0.55 + ease * 0.65;         // the cut extends as it lands
      const drift = (1 - ease) * 0.22;         // slight rotation as it settles
      // the rake materializes a frame AFTER the arm's wind-up â€” anticipation
      const gate = clamp((p - 0.07) / 0.07, 0, 1);
      const far3 = (typeof hasSkill === 'function' && hasSkill('reach')) || empowered;
      // finisher: the X still crosses, but its span is earned â€” the long
      // version belongs to the Long Rake skill and to the feral claws
      const L3 = sv.combo === 2 ? (far3 ? 92 : 56) : (far3 ? 62 : 44);
      // captured marks live in body space (aim must fold facing out); the
      // synthesized fallback is world space (aim is the raw swing angle)
      rakePlace(c, mk3, marks[0]
        ? Math.atan2(Math.sin(sv.ang), Math.cos(sv.ang) * (this.faceVis || 1))
        : sv.ang);
      c.rotate(drift * pd3);
      c.scale(grow, pd3);
      c.translate(-L3 * RAKE_LAG, 0);
      if (sv.combo === 2) {
        // the finisher crosses two rakes. They have to open WIDE â€” at a narrow
        // angle six streaks at slightly different tilts read as a firework, not
        // as two paws closing on the same point.
        c.rotate(-0.52);
        cut(L3, L3 * 0.28, Math.min(1, (1 - p) * 1.7) * gate);
        c.rotate(1.04); c.scale(1, -1);
        cut(L3, L3 * 0.28, Math.min(1, (1 - p) * 1.4) * gate);
      } else {
        cut(L3, 18, Math.min(1, (1 - p) * 1.7) * gate);
      }
      c.restore();
      c.globalAlpha = 1;
      }
    }
    // THE CHARGE IS THE AIR IONISING AND THE CURRENT RUNNING THROUGH HER.
    //
    // Owner, 2026-09-19: "instead of looking like circles coming to the
    // character can you animate the supercharge to make it like electricity
    // surge coming from ionization of the air around it surging through its
    // body up and down... this is a robot so all supercharge should be
    // considered as robotic." The previous pass drew power ARRIVING â€” rings
    // sweeping in to her chest â€” and rings sweeping in read as circles around
    // a cat, not as a machine taking charge. A robot charging is a circuit:
    // the air around the chassis ionises into a haze, the haze bleeds current
    // into the frame, and the current runs the frame end to end. In depth order:
    //   1. the ION HAZE â€” a soft field the shape of her, breathing, with motes
    //      of ionised air drawn out of it into the body (the "from somewhere"
    //      is the air itself now, not a ring)
    //   2. the SURGE â€” one bright band running her length, up and down, faster
    //      as the charge fills, with a jagged arc across the chassis at the band
    //   3. SPINE BOLTS â€” vertical arcs foot-to-ear inside her outline, struck per
    //      50 ms slot so they flicker rather than animate, some branching out
    //   4. SPARKS thrown OFF the body, outward â€” current that missed the frame
    //   5. at full charge the chassis is SHEATHED: white bolts and a corona the
    //      shape of her pulsing on the outline. No circle anywhere.
    // All additive light, the one part of the look that is ours to draw
    // (ART_BIBLE Â§0.0); no shadowBlur (measured +10 ms/frame elsewhere); no
    // allocation in the draw path â€” every random is hash2 of a time slot, so a
    // replayed frame draws the same storm (tests/drawclock.cjs).
    if (this.chargeT > 0.02 && !(typeof G !== 'undefined' && G.artProbe)) {
      const ck = clamp(this.chargeT / 0.6, 0, 1);
      const cok = this.chargeOk !== false;
      const now = performance.now() / 1000;
      const bot = this.y + this.h, top = bot - CHARGE_BODY_H, bh = bot - top;   // feet to ear-tips
      const cx = this.x + this.w / 2, cy = bot - bh * 0.55;                      // her chest
      const hw = this.w * 0.5 + 4;                                                // half the chassis
      const col = !cok ? '#7d6b8a' : PAL[G.roomDef.zone].glow;             // the wide passes keep the colour
      const hot = !cok ? '#7d6b8a' : ck >= 1 ? '#ffffff' : col;              // the thin ones go white at full
      const tint = !cok ? 'rgba(125,107,138,' : ck >= 1 ? 'rgba(255,255,255,' : 'rgba(150,235,255,';
      c.save();
      c.globalCompositeOperation = 'lighter';

      // --- 1. the ion haze: a field the shape of her, not a circle
      const breathe = 1 + Math.sin(now * (5 + ck * 6)) * 0.06;
      const hrx = (hw + 28 + ck * 10) * breathe, hry = (bh * 0.64 + 14) * breathe;   // the drawn plate is wider than the collider
      // rim-lit: the field is brightest a little OUTSIDE her outline and
      // near-dark on her, so the ionised air reads as a corona and she stays
      // the colour she was drawn (the fill version washed her to white)
      // SHE IS WHITE. Additive light on a white plate is blow-out, not
      // light â€” every fill that lands on her body erases her â€” so the field
      // is a RIM: zero over her, brightest just outside her outline.
      const hz = c.createRadialGradient(cx, cy, 2, cx, cy, hrx);
      hz.addColorStop(0, tint + '0)');
      hz.addColorStop(0.6, tint + '0)');
      hz.addColorStop(0.78, tint + (cok ? 0.12 + ck * 0.14 : 0.04) + ')');
      hz.addColorStop(1, tint + '0)');
      c.fillStyle = hz; c.globalAlpha = 1;
      c.beginPath(); c.ellipse(cx, cy, hrx, hry, 0, 0, 7); c.fill();
      // motes of ionised air pulled from the haze's rim INTO the chassis, each
      // falling in along its own radius; more of them, faster, as it fills
      const motes = 6 + Math.round(ck * 8), mlife = 0.55 - ck * 0.2;
      for (let i = 0; i < motes; i++) {
        const ph = ((now / mlife) + hash2(i, 41)) % 1;                 // 0 rim -> 1 body
        const gen = Math.floor(now / mlife + hash2(i, 41));
        const a = hash2(gen, 43 + i) * Math.PI * 2;
        const rx = (hw + 18 + ck * 12) * (1 - ph) + hw * 0.6 * ph;
        const ry = (bh * 0.6 + 12) * (1 - ph) + bh * 0.4 * ph;
        c.globalAlpha = (cok ? 0.85 : 0.25) * Math.sin(ph * Math.PI);
        c.fillStyle = ph > 0.7 ? '#ffffff' : hot;
        c.beginPath(); c.arc(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 1 + ph * 1.6, 0, 7); c.fill();
      }

      // --- 2. the surge: TWO bands running her length, one rising while the
      //       other falls ("up and down"), each with a jagged arc across the
      //       chassis where it is â€” a wide coloured stroke under a thin white one
      const sslot = Math.floor(now / 0.05);
      for (let band = 0; band < 2; band++) {
        const w0 = now * (4.5 + ck * 7) + band * Math.PI;
        const sy = top + (0.5 + 0.5 * Math.sin(w0)) * bh;
        const lead = band === 0 ? 1 : 0.7;                        // the second is the echo
        // its glow sits where the arc LEAVES the chassis, one lobe a side â€”
        // a glow across her would whiten her (see the haze)
        c.globalCompositeOperation = 'lighter';
        for (const side of [-1, 1]) {
          const lx = cx + side * (hw + 5);
          const sg = c.createRadialGradient(lx, sy, 1, lx, sy, 11 + ck * 4);
          sg.addColorStop(0, tint + ((cok ? 0.45 + ck * 0.3 : 0.12) * lead) + ')');
          sg.addColorStop(1, tint + '0)');
          c.fillStyle = sg; c.globalAlpha = 1;
          c.beginPath(); c.arc(lx, sy, 11 + ck * 4, 0, 7); c.fill();
        }
        // the arc itself is drawn NORMALLY: the zone colour under a white
        // core â€” the colour shows on her white body, the white on the dark
        // room behind her, and neither erases her
        c.globalCompositeOperation = 'source-over';
        for (let pass = 0; pass < 2; pass++) {
          c.globalAlpha = (pass ? (cok ? 0.95 : 0.35) : (cok ? 0.55 : 0.15)) * lead;
          c.strokeStyle = pass ? (cok ? '#ffffff' : hot) : col;
          c.lineWidth = pass ? 1.3 : 3.2;
          c.beginPath();
          c.moveTo(cx - hw - 6, sy);
          for (let seg = 1; seg <= 6; seg++) {
            const jy = seg === 6 ? 0 : (hash2(sslot + band * 977, 61 + seg) - 0.5) * (7 + ck * 7);
            c.lineTo(cx - hw - 6 + (seg / 6) * (hw * 2 + 12), sy + jy);
          }
          c.stroke();
        }
      }

      // --- 3. spine bolts: current running the frame end to end, inside her
      //       outline. Struck on their own clock; not every slot fires.
      //       Normal blending, for the reason the arcs are.
      c.globalCompositeOperation = 'source-over';
      const bolts = 2 + Math.round(ck * 3);
      for (let i = 0; i < bolts; i++) {
        const slot = Math.floor(now / 0.05) + i * 53;
        if (hash2(slot, 71) > (cok ? 0.6 + ck * 0.35 : 0.3)) continue;
        const x0 = cx + (hash2(slot, 73) - 0.5) * hw * 1.5;
        const x1 = cx + (hash2(slot, 79) - 0.5) * hw * 1.5;
        const y0 = top + hash2(slot, 83) * bh * 0.25, y1 = bot - hash2(slot, 89) * bh * 0.25;
        // the bolt is drawn twice: a wide coloured stroke, then a thin white
        // core over it â€” additive light has no edge and a bolt is all edge
        for (let pass = 0; pass < 2; pass++) {
          c.globalAlpha = (pass ? 0.95 : 0.5) * ((cok ? 0.6 : 0.25) + ck * 0.4);
          c.strokeStyle = pass ? (cok ? '#ffffff' : hot) : col;
          c.lineWidth = pass ? (cok ? 1.2 : 0.8) : (cok ? 2.8 : 1.6);
          c.beginPath(); c.moveTo(x0, y0);
          for (let seg = 1; seg <= 6; seg++) {
            const jx = seg === 6 ? 0 : (hash2(slot, 97 + seg) - 0.5) * (10 + ck * 10);
            c.lineTo(x0 + (x1 - x0) * (seg / 6) + jx, y0 + (y1 - y0) * (seg / 6));
          }
          c.stroke();
        }
        // a branch off the lower third, out past the outline
        if (hash2(slot, 101) < 0.6) {
          const bxx = x0 + (x1 - x0) * 0.6, byy = y0 + (y1 - y0) * 0.6;
          const dir = hash2(slot, 103) < 0.5 ? -1 : 1;
          c.globalAlpha = (cok ? 0.5 : 0.2) + ck * 0.3; c.lineWidth = 1.1; c.strokeStyle = hot;
          c.beginPath(); c.moveTo(bxx, byy);
          c.lineTo(bxx + dir * hw * 0.9, byy + (hash2(slot, 107) - 0.5) * 12);
          c.lineTo(bxx + dir * (hw * 1.7 + ck * 10), byy + (hash2(slot, 109) - 0.5) * 20);
          c.stroke();
        }
      }

      // --- 4. sparks thrown off the chassis: short radial streaks born on the
      //       outline and dying a few pixels out (additive: they are off her)
      c.globalCompositeOperation = 'lighter';
      const sparks = cok ? 3 + Math.round(ck * 5) : 2, slife = 0.18;
      for (let i = 0; i < sparks; i++) {
        const ph = ((now / slife) + hash2(i, 113)) % 1;
        const gen = Math.floor(now / slife + hash2(i, 113));
        const a = hash2(gen, 127 + i) * Math.PI * 2;
        const ex = cx + Math.cos(a) * hw, ey = cy + Math.sin(a) * bh * 0.5;
        const len = (4 + ck * 8) * ph;
        c.globalAlpha = (cok ? 0.8 : 0.3) * (1 - ph);
        c.strokeStyle = hot; c.lineWidth = 1;
        c.beginPath();
        c.moveTo(ex + Math.cos(a) * len * 0.4, ey + Math.sin(a) * len * 0.4);
        c.lineTo(ex + Math.cos(a) * (len + 3), ey + Math.sin(a) * (len + 3));
        c.stroke();
      }

      // (no chest core. Twice now a glow on her chest has been the thing that
      // blew her middle to white; the current in her is the bolts, and the
      // light of it is the rim, the lobes and the sparks â€” all off her body.)

      // --- 5. full: the chassis sheathed. A corona the SHAPE OF HER pulsing on
      //     her outline â€” "ready" without a sound, and without a circle.
      if (ck >= 1 && cok) {
        c.globalCompositeOperation = 'source-over';
        const pulse = Math.sin(now * 18), rslot = Math.floor(now / 0.06);
        const rx0 = hw + 7 + pulse * 1.5, ry0 = bh * 0.56 + 5 + pulse * 1.5;
        // the sheath is a jittered outline: 22 points around her, each thrown
        // in or out per 60 ms slot, so it crackles instead of orbiting
        for (let pass = 0; pass < 2; pass++) {
          c.globalAlpha = pass ? 0.5 + pulse * 0.15 : 0.22 + pulse * 0.06;
          c.strokeStyle = pass ? '#ffffff' : col; c.lineWidth = pass ? 1.2 : 3.4;
          c.beginPath();
          for (let k2 = 0; k2 <= 22; k2++) {
            const a = (k2 % 22) / 22 * Math.PI * 2;
            const j = 1 + (hash2(rslot, 131 + (k2 % 22)) - 0.5) * 0.22;
            const px2 = cx + Math.cos(a) * rx0 * j, py2 = cy + Math.sin(a) * ry0 * j;
            if (k2 === 0) c.moveTo(px2, py2); else c.lineTo(px2, py2);
          }
          c.stroke();
        }
      }
      c.restore(); c.globalAlpha = 1;
    }
    // FIREDASH â€” combustion-engine exhaust: white-hot core at the feet,
    // conical flame body fading behind, shock diamonds and shine flashes
    if (this.dashT > 0) {
      // the hardware first, under its own light â€” see drawThrustBoots()
      if (typeof drawThrustBoots === 'function') drawThrustBoots(c, this);
      const dvx = this.dashVX || this.face * 900, dvy = this.dashVY || 0;
      const dn = Math.hypot(dvx, dvy) || 1;
      const ex = -dvx / dn, ey = -dvy / dn;          // exhaust direction (backwards)
      const pxn = -ey, pyn = ex;                     // perpendicular
      const now = performance.now();
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const foot of [-3.5, 3.5]) {              // twin nozzles, one per foot
        const bx = this.x + this.w / 2 + ex * 8 + pxn * foot;
        const by = this.y + this.h - 7 + ey * 6 + pyn * foot;
        const flick = 0.82 + Math.sin(now / 22 + foot) * 0.18;
        // layered cone: wide orange body â†’ golden mid â†’ white-hot core at the shoe
        for (const [len, wid, col, al] of [[62, 12, '#ff7a2e', 0.42], [42, 8, '#ffd76a', 0.6], [24, 5, '#ffffff', 0.9]]) {
          const L2 = len * flick;
          const tx = bx + ex * L2, ty = by + ey * L2;
          const g2 = c.createLinearGradient(bx, by, tx, ty);
          g2.addColorStop(0, col); g2.addColorStop(1, 'rgba(255,110,30,0)');
          c.fillStyle = g2; c.globalAlpha = al;
          c.beginPath();
          c.moveTo(bx + pxn * wid, by + pyn * wid);
          c.lineTo(bx - pxn * wid, by - pyn * wid);
          c.lineTo(tx, ty);
          c.closePath(); c.fill();
        }
        // shock diamonds along the plume â€” the jet-engine signature
        c.fillStyle = '#ffffff';
        for (let k = 1; k <= 3; k++) {
          const dd = (10 + k * 11) * flick, ds = (4 - k) * 1.5;
          const dx2 = bx + ex * dd, dy2 = by + ey * dd;
          c.globalAlpha = 0.75 - k * 0.18;
          c.beginPath();
          c.moveTo(dx2 + ex * ds * 1.6, dy2 + ey * ds * 1.6);
          c.lineTo(dx2 + pxn * ds, dy2 + pyn * ds);
          c.lineTo(dx2 - ex * ds * 1.6, dy2 - ey * ds * 1.6);
          c.lineTo(dx2 - pxn * ds, dy2 - pyn * ds);
          c.closePath(); c.fill();
        }
        // stray shine sparks flying off the plume
        for (let k = 0; k < 3; k++) {
          const sd = rnd(16, 58), sw = rnd(-9, 9);
          c.globalAlpha = rnd(0.3, 0.8);
          c.fillRect(bx + ex * sd + pxn * sw - 1, by + ey * sd + pyn * sw - 1, 2, 2);
        }
        // nozzle glow at the shoe
        const ng = c.createRadialGradient(bx, by, 1, bx, by, 9);
        ng.addColorStop(0, '#ffffff'); ng.addColorStop(1, 'rgba(255,160,60,0)');
        c.globalAlpha = 0.95; c.fillStyle = ng;
        c.beginPath(); c.arc(bx, by, 9, 0, 7); c.fill();
      }
      c.restore(); c.globalAlpha = 1;
    }
    // THE CHARGE'S CRACKLE â€” the first fourteen cells of the supercharge effects
    // sheet, on chargeT rather than on the swing. Only while the charge is
    // ALLOWED: the update loop already greys its particles when it is not
    // (`!this.chargeOk`), and answering a refused charge with bright energy
    // would promise a strike that is not coming.
    if (this.chargeT > 0 && this.chargeOk && this.swirlT <= 0) {
      const FX = HERO_BURST_FX;
      const p = clamp(this.chargeT / CHARGE_READY, 0, 1);
      // world units, and facing applies here â€” she charges at the claw she is
      // pointing with, so a fixed +x would put it behind her half the time
      this.drawSwingFx(c, FX, FX.charge, p,
                       this.x + this.w / 2 + this.faceVis * FX.wdx,
                       this.y + this.h / 2 + FX.wdy, FX.wsize);
    }
    // THE MEND'S LIGHT. Five drawn plates (assets/source/hero/delivered/v4/
    // heal_fx.png) instead of the stroked circle that stood in for them: a spark
    // that swells to a sparkle burst, turns over once, and falls away. Blended
    // with 'lighter' because that is what it IS â€” the plates carry their own
    // soft matte and a bloom added as light needs no cutout, which is also why
    // this one generated sheet escapes the art-prompts rule against generating
    // pure glow.
    //
    // The ring stays as the fallback rather than being deleted. The engine never
    // assumes it has the good version, and a heal with no feedback at all while
    // a 76 KB sheet decodes is worse than the circle ever was.
    if (this.healT > 0) {
      const FX = HERO_HEAL_FX;
      const im = MEDIA_RAW[FX.key];
      const mx = this.x + this.w / 2, my = this.y + this.h / 2;
      if (im && im.complete && im.naturalWidth) {
        const cw = im.naturalWidth / FX.cells;
        const f = clamp(Math.floor(this.healT / 0.85 * FX.cells), 0, FX.cells - 1);
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = FX.alpha;
        c.drawImage(im, f * cw, 0, cw, im.naturalHeight,
                    mx - FX.size / 2, my - FX.size / 2, FX.size, FX.size);
        c.restore();
      } else {
        mediaFetch(FX.key, true);
        c.strokeStyle = '#aef7d8'; c.globalAlpha = 0.7; c.lineWidth = 2;
        c.beginPath(); c.arc(mx, my, 26 - this.healT * 18, 0, 7); c.stroke();
        c.globalAlpha = 1;
      }
    }
  }
}

// ================= PROJECTILES =================
class Proj {
  constructor(x, y, vx, vy, friendly, dmg, r, color, grav, life) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.friendly = friendly; this.dmg = dmg; this.r = r; this.color = color;
    this.grav = grav || 0; this.life = life || 3; this.dead = false; this.el = null;
  }
  box() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
  update(dt) {
    this.life -= dt; if (this.life <= 0) { this.dead = true; return; }
    this.vy += this.grav * dt;
    const sx = this.x, sy = this.y;
    this.x += this.vx * dt; this.y += this.vy * dt;
    const bump = shotSweep(sx, sy, this.x, this.y);
    if (bump) {
      this.x = bump.x; this.y = bump.y;
      this.dead = true; burst(this.x, this.y, 6, this.color, 130, 0.3, 400, 2, true); return;
    }
    if (this.friendly) {
      const targets = G.enemies.concat(G.boss && !G.boss.dead && G.boss.st !== 'intro' && G.boss.st !== 'dorm' ? [G.boss] : []);
      for (const e of targets) {
        if (e.dead || e.disabled || e.rescued) continue;
        if (aabb(this.box(), hurtBoxOf(e))) {
          const dealt = dealDmg(e, this.dmg, this.el || armEl(), this.x, this.y, false, 'projectile'); this.dead = true;
          if (dealt <= 0) return;
          if (this.freeze) {                       // HALT: holds a target still
            e.stagT = Math.max(e.stagT || 0, 2.0);
            burst(this.x, this.y, 14, ELEM.glazz.glow, 200, 0.6, 40, 3, true);
          }
          if (this.pool) {                         // FORGE: splash where it lands
            for (const o of targets) {
              if (o === e || o.dead) continue;
              if (Math.hypot(o.x + o.w / 2 - this.x, o.y + o.h / 2 - this.y) < 78)
                dealDmg(o, Math.round(this.dmg * 0.6), 'hott', o.x + o.w / 2, o.y);
            }
            burst(this.x, this.y, 18, ELEM.hott.glow, 260, 0.7, 260, 4, true);
          }
          if (this.chain > 0) {                    // ARCLIGHT: jumps onward
            let best = null, bd = 190;
            for (const o of targets) {
              if (o === e || o.dead) continue;
              const d = Math.hypot(o.x + o.w / 2 - this.x, o.y + o.h / 2 - this.y);
              if (d < bd) { bd = d; best = o; }
            }
            if (best) {
              const nx = best.x + best.w / 2, ny = best.y + best.h / 2;
              const j = new Proj(this.x, this.y, (nx - this.x) * 4, (ny - this.y) * 4, true,
                                 Math.round(this.dmg * 0.75), this.r, this.color, 0, 0.3);
              j.el = this.el; j.chain = this.chain - 1; G.projs.push(j);
            }
          }
          if (!(e instanceof Boss) && e.kind !== 'turret') {
            e.kbT = 0.22; e.vx += Math.sign(this.vx) * 260; e.vy -= 120;
          }
          sfx('hit'); burst(this.x, this.y, 10, this.color, 200, 0.35, 200, 3, true);
          if (e.hp <= 0) e.die(Math.sign(this.vx), -0.3);
          return;
        }
      }
    } else if (!player.dead && aabb(this.box(), player)) {
      this.dead = true;
      player.hurt(DF().edmg, this.x);
      if (this.frost) {                          // Archivist beam: frozen joints
        player.slowT = Math.max(player.slowT, 2);
        burst(this.x, this.y, 12, '#bfe8ff', 180, 0.5, 100, 2.5, true);
      }
    }
  }
  draw(c) {
    // TALONHOST's metallic feathers wear the sheet's own art
    if (this.feather && typeof drawFeather === 'function' && drawFeather(c, this)) return;
    // GLACIERE's void lance and ice shards wear hers
    if (this.glcFx && typeof drawGlcProj === 'function' && drawGlcProj(c, this)) return;
    c.shadowColor = this.color; c.shadowBlur = 12; c.fillStyle = this.color;
    c.beginPath(); c.arc(this.x, this.y, this.r, 0, 7); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath(); c.arc(this.x, this.y, this.r * 0.4, 0, 7); c.fill();
  }
}

// ================= MOVING PLATFORMS =================
// Powered rail slabs for the later zones: each one ping-pongs between two
// anchors on a smooth cosine, carries whoever rides it, and is ONE-WAY â€”
// she jumps up through it freely and only lands from above.
// ===========================================================================
// THE GRINDER. A cone sitting still on the floor is a warning sign, not a
// threat â€” you route around it once and never think about it again. A wheel
// that PATROLS the rail is a different thing entirely: it has to be read, timed
// and beaten, and it turns a static wall into a piece of play.
//
// It is built like a machine that would actually exist in this factory: a
// bolted hub, spokes under tension, and a hardened tooth ring that bites the
// rail it runs on and throws sparks off it. Rotation is derived from distance
// travelled, never from a timer, because a wheel that slides instead of rolling
// is the one thing the eye catches instantly.
// ===========================================================================
class SawWheel {
  constructor(x0, x1, ty) {
    this.r = 19;
    this.railY = ty * TILE;                 // top of the hazard rail
    this.x0 = x0 + this.r; this.x1 = x1 - this.r;
    if (this.x1 < this.x0) { const m = (x0 + x1) / 2; this.x0 = this.x1 = m; }
    this.x = this.x0; this.y = this.railY + TILE - this.r * 0.62;
    this.spd = 74 + ((x0 * 7919) % 40);     // each rail runs at its own pace
    this.dir = ((x0 / TILE) | 0) % 2 ? 1 : -1;
    this.rot = 0; this.sparkT = 0; this.arcSeed = 0; this.arcT = 0;
  }
  update(dt) {
    const span = this.x1 - this.x0;
    if (span <= 1) { this.rot += dt * 5; return; }
    const nx = this.x + this.dir * this.spd * dt;
    if (nx > this.x1) { this.x = this.x1; this.dir = -1; }
    else if (nx < this.x0) { this.x = this.x0; this.dir = 1; }
    else this.x = nx;
    // rolling, not sliding: the tooth ring turns exactly as far as it travelled
    this.rot += (this.dir * this.spd * dt) / this.r;
    // the arc re-strikes on its own clock, so it flickers instead of spinning
    this.arcT -= dt;
    if (this.arcT <= 0) { this.arcT = 0.055; this.arcSeed = (this.arcSeed + 5) % 12; }
    // it grinds where it touches
    this.sparkT -= dt;
    if (this.sparkT <= 0 && typeof addPart === 'function') {
      this.sparkT = 0.035;
      for (let i = 0; i < 2; i++)
        addPart(this.x - this.dir * this.r * 0.55, this.y + this.r * 0.86,
          -this.dir * rnd(90, 260), rnd(-140, -20), rnd(0.18, 0.38),
          chance(0.5) ? '#fff0c0' : '#ffa23c', rnd(1.6, 2.6), 620, true);
    }
    // and it hurts, above the rail, which is the entire point of it moving
    if (player && !player.dead && player.iT <= 0) {
      const dx = (player.x + player.w / 2) - this.x, dy = (player.y + player.h / 2) - this.y;
      if (Math.hypot(dx, dy) < this.r + 12) player.hurt(1, this.x);
    }
  }
  draw(c2) {
    const P = PAL[G.roomDef.zone];
    c2.save();
    c2.translate(this.x, this.y);
    // the shadow it casts into its own trench
    c2.globalAlpha = 0.4; c2.fillStyle = '#000';
    c2.beginPath(); c2.ellipse(0, this.r * 0.9, this.r * 0.95, 4, 0, 0, 7); c2.fill();
    c2.globalAlpha = 1;
    c2.rotate(this.rot);
    const R = this.r;
    // hardened tooth ring â€” swept, so the leading edge of each tooth is the
    // one that would catch
    c2.fillStyle = rkMix('#8f9daa', P.edge, 0.12);
    c2.beginPath();
    const N = 12;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 0.42) / N) * Math.PI * 2, a2 = ((i + 1) / N) * Math.PI * 2;
      c2.lineTo(Math.cos(a0) * R * 0.82, Math.sin(a0) * R * 0.82);
      c2.lineTo(Math.cos(a1) * R * 1.16, Math.sin(a1) * R * 1.16);
      c2.lineTo(Math.cos(a2) * R * 0.82, Math.sin(a2) * R * 0.82);
    }
    c2.closePath(); c2.fill();
    c2.strokeStyle = '#141a22'; c2.lineWidth = 1.4; c2.stroke();
    // the honed inner edge of the ring
    c2.strokeStyle = '#eaf4ff'; c2.globalAlpha = 0.5; c2.lineWidth = 1.4;
    c2.beginPath(); c2.arc(0, 0, R * 0.8, 0, 7); c2.stroke();
    c2.globalAlpha = 1;
    // disc, spokes, bolted hub
    const g = c2.createRadialGradient(-R * 0.3, -R * 0.35, 2, 0, 0, R * 0.8);
    g.addColorStop(0, '#7c8996'); g.addColorStop(1, '#2b333d');
    c2.fillStyle = g;
    c2.beginPath(); c2.arc(0, 0, R * 0.78, 0, 7); c2.fill();
    c2.strokeStyle = '#0e131a'; c2.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      c2.beginPath(); c2.moveTo(Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2);
      c2.lineTo(Math.cos(a) * R * 0.72, Math.sin(a) * R * 0.72); c2.stroke();
    }
    c2.fillStyle = '#5d6975';
    c2.beginPath(); c2.arc(0, 0, R * 0.26, 0, 7); c2.fill();
    c2.strokeStyle = '#0e131a'; c2.lineWidth = 1.1; c2.stroke();
    c2.fillStyle = '#0e131a';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      c2.beginPath(); c2.arc(Math.cos(a) * R * 0.16, Math.sin(a) * R * 0.16, 1.5, 0, 7); c2.fill();
    }
    // ---- IT IS ELECTRIC ----------------------------------------------
    // The blade is not merely sharp, it is LIVE: the tooth ring carries a
    // charge that lights its own edge and jumps to whatever is nearest. An
    // arc is the cheapest possible way to say "do not touch this", and it
    // is the thing that stops a wheel reading as a cog.
    c2.globalCompositeOperation = 'lighter';
    c2.globalAlpha = 0.55 + Math.sin(this.rot * 3) * 0.2;
    c2.strokeStyle = '#bdf0ff'; c2.lineWidth = 2.2;
    c2.beginPath(); c2.arc(0, 0, R * 1.02, 0, 7); c2.stroke();
    c2.globalAlpha = 0.9; c2.strokeStyle = '#ffffff'; c2.lineWidth = 1;
    // arcs jumping tooth to tooth
    const AN = 12;
    for (let i = 0; i < 3; i++) {
      const j = ((this.arcSeed || 0) + i * 5) % AN;
      const a0 = (j / AN) * Math.PI * 2, a1 = ((j + 1) / AN) * Math.PI * 2;
      const mid = (a0 + a1) / 2, bulge = R * (1.1 + ((j * 7) % 5) / 16);
      c2.beginPath();
      c2.moveTo(Math.cos(a0) * R * 1.14, Math.sin(a0) * R * 1.14);
      c2.quadraticCurveTo(Math.cos(mid) * bulge * 1.32, Math.sin(mid) * bulge * 1.32,
                          Math.cos(a1) * R * 1.14, Math.sin(a1) * R * 1.14);
      c2.stroke();
    }
    c2.globalAlpha = 0.6; c2.fillStyle = '#9fe8ff';
    c2.beginPath(); c2.arc(0, 0, R * 0.14, 0, 7); c2.fill();
    c2.restore();
  }
}
// ===========================================================================
// THE CHAINSAW RIG. A blade on a rail, running back and forth inside its own
// housing â€” and the thing that makes it read as dangerous is not the blade, it
// is the SPARKS. A saw that slides silently along a bar is a moving rectangle.
// One that throws a rooster-tail of sparks off the rail while it travels, and
// slams into its housing at each end hard enough to shower the floor, is a
// machine that is working, and working is what makes it frightening.
//
// So there are two spark sources, and they are different on purpose:
//   TRAVEL   a thin continuous spray off the shoe where the carriage grinds
//            the rail, thrown BACKWARD from the direction of travel, scaled by
//            how fast it is going â€” so it thins out at the ends of the stroke
//            where the saw slows, and fans at the middle where it is quickest.
//   IMPACT   a hard burst at each end when it hits the box, plus a screech and
//            a kick of the camera. It fires once per arrival, latched, because
//            an impact that repeats every frame while the saw sits at the end
//            is not an impact, it is a fountain.
//
// It travels on the same eased path the moving platforms use, so it is always
// slowest at the ends: there is always a window to cross, and the window is
// visible from across the room because the sparks stop.
// ===========================================================================
class SawRig {
  constructor(tx, ty, spec) {
    this.r = 15;                                   // blade radius
    this.x0 = tx * TILE + TILE / 2;
    this.y0 = ty * TILE - 2;                       // the blade rides on the deck
    this.x1 = this.x0 + ((spec && spec[0]) || 0) * TILE;
    this.y1 = this.y0 + ((spec && spec[1]) || 0) * TILE;
    this.per = Math.max(1.6, (spec && spec[2]) || 3.2);
    this.ph = Math.random() * this.per;
    const u0 = (1 - Math.cos(this.ph / this.per * Math.PI * 2)) / 2;
    this.x = this.x0 + (this.x1 - this.x0) * u0;
    this.y = this.y0 + (this.y1 - this.y0) * u0;
    this.spin = 0; this.sp = 0; this.end = 0; this.hitT = 0;
  }
  update(dt) {
    const px = this.x, py = this.y;
    this.ph += dt;
    const u = (1 - Math.cos(this.ph / this.per * Math.PI * 2)) / 2;
    this.x = this.x0 + (this.x1 - this.x0) * u;
    this.y = this.y0 + (this.y1 - this.y0) * u;
    const dx = this.x - px, dy = this.y - py;
    this.sp = Math.hypot(dx, dy) / Math.max(dt, 1e-4);
    this.spin += dt * (26 + this.sp * 0.06);       // the blade never stops
    if (this.hitT > 0) this.hitT -= dt;
    // THE ENDS OF THE STROKE. Latched, so the shower fires on arrival and not
    // once per frame for as long as it rests there.
    const at = u < 0.02 ? -1 : u > 0.98 ? 1 : 0;
    if (at && at !== this.end) {
      this.end = at;
      this.hitT = 0.22;
      const dirx = this.x1 - this.x0, diry = this.y1 - this.y0;
      const n = Math.hypot(dirx, diry) || 1;
      const sx = this.x + dirx / n * this.r * at, sy = this.y + diry / n * this.r * at;
      for (let i = 0; i < 16; i++) {
        const a = Math.atan2(-diry, -dirx) * at + rnd(-1.1, 1.1);
        const v = rnd(90, 320);
        addPart(sx, sy, Math.cos(a) * v, Math.sin(a) * v - rnd(0, 60),
          rnd(0.22, 0.6), i % 3 ? '#ffb347' : '#fff3d0', rnd(1.5, 3), 780, true);
      }
      // only when the player can actually see it hit â€” a saw grinding in a
      // room she has walked away from should not shake her camera
      if (Math.abs(this.x - cam.x - 480) < 620 && Math.abs(this.y - cam.y - 270) < 400) {
        sfx('grind'); cam.shake = Math.max(cam.shake, 3.5);
      }
    } else if (!at) this.end = 0;
    // THE TRAVELLING SPRAY, off the shoe, thrown back down the rail
    if (this.sp > 22 && parts.length < 420) {
      const k = clamp(this.sp / 260, 0, 1);
      const n = Math.random() < k ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const back = Math.atan2(-dy, -dx) + rnd(-0.5, 0.5);
        const v = rnd(40, 150) * (0.4 + k);
        addPart(this.x - dx / Math.max(1, Math.hypot(dx, dy)) * this.r * 0.8,
          this.y + this.r * 0.55,
          Math.cos(back) * v, Math.sin(back) * v - rnd(10, 70),
          rnd(0.14, 0.4), Math.random() < 0.3 ? '#fff3d0' : '#ffa235', rnd(1, 2.2), 900, true);
      }
    }
    if (!player.dead && player.iT <= 0
        && Math.abs(player.x + player.w / 2 - this.x) < this.r + player.w * 0.4
        && Math.abs(player.y + player.h / 2 - this.y) < this.r + player.h * 0.4) {
      player.hurt(DF().edmg, this.x);
      burst(this.x, this.y, 10, '#ff8a4a', 240, 0.5, 700, 3, true);
    }
  }
  draw(c) {
    const P = PAL[G.roomDef.zone];
    // the rail it runs on, and the housing box at each end
    c.save();
    c.strokeStyle = 'rgba(120,132,148,0.55)'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(this.x0, this.y0); c.lineTo(this.x1, this.y1); c.stroke();
    c.strokeStyle = 'rgba(40,48,58,0.9)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(this.x0, this.y0); c.lineTo(this.x1, this.y1); c.stroke();
    for (const e of [[this.x0, this.y0, -1], [this.x1, this.y1, 1]]) {
      const hot = this.hitT > 0 && this.end === e[2] ? this.hitT / 0.22 : 0;
      c.fillStyle = '#2b3340'; rr(c, e[0] - 9, e[1] - 13, 18, 26, 4); c.fill();
      c.strokeStyle = hot ? '#ffd08a' : 'rgba(150,165,185,0.5)';
      c.lineWidth = hot ? 2.5 : 1.5;
      rr(c, e[0] - 9, e[1] - 13, 18, 26, 4); c.stroke();
      c.fillStyle = 'rgba(90,100,115,0.9)';
      c.fillRect(e[0] - 5, e[1] - 9, 3, 3); c.fillRect(e[0] + 2, e[1] + 6, 3, 3);
    }
    c.restore();
    // THE CARRIAGE. Drawn as a body with the blade in FRONT of it, because the
    // first version drew ten open strokes on a bare disc and what came out was
    // a white star â€” a sea urchin on a wire, not a machine. A saw blade is a
    // solid plate with teeth cut into its rim, and the teeth only read as teeth
    // if the plate behind them is there to be cut from.
    const dirx = (this.x1 - this.x0) || 1, diry = this.y1 - this.y0;
    const along = Math.atan2(diry, dirx);
    const back = this.sp > 4 ? (this.x < (this.x0 + this.x1) / 2 ? -1 : 1) : -1;
    c.save();
    c.translate(this.x, this.y);
    // motor body, sitting behind the blade along the rail
    c.save();
    c.rotate(along);
    // TRAILING the blade, not hidden behind it. At first the body was drawn
    // centred on the hub, where a blade of the same size covers it completely â€”
    // so the rig read as a disc floating on a wire with no machine driving it.
    const bx = back * (this.r * 0.95) - 11;
    c.fillStyle = '#232a34';
    rr(c, bx, -10, 22, 20, 4); c.fill();
    c.strokeStyle = 'rgba(150,168,190,0.55)'; c.lineWidth = 1.4;
    rr(c, bx, -10, 22, 20, 4); c.stroke();
    c.fillStyle = '#39424f';
    for (let i2 = 0; i2 < 3; i2++) c.fillRect(bx + 4 + i2 * 5, -6, 3, 12);
    // the drive arm reaching from the motor to the hub
    c.strokeStyle = 'rgba(170,186,206,0.7)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(bx + (back > 0 ? 0 : 22), 0); c.lineTo(0, 0); c.stroke();
    c.fillStyle = P.glow;
    c.globalAlpha = 0.55 + Math.sin(this.spin * 4) * 0.25;
    c.fillRect(bx + 2, 5, 18, 2);
    c.globalAlpha = 1;
    c.restore();
    // the blade: one filled plate, teeth cut around its rim
    c.save();
    c.rotate(this.spin);
    const R = this.r, root = R * 0.74, N = 12;
    c.beginPath();
    for (let i2 = 0; i2 < N; i2++) {
      const a0 = i2 / N * Math.PI * 2, a1 = (i2 + 0.42) / N * Math.PI * 2, a2 = (i2 + 1) / N * Math.PI * 2;
      if (!i2) c.moveTo(Math.cos(a0) * root, Math.sin(a0) * root);
      else c.lineTo(Math.cos(a0) * root, Math.sin(a0) * root);
      c.lineTo(Math.cos(a0 + 0.02) * R, Math.sin(a0 + 0.02) * R);   // leading edge
      c.lineTo(Math.cos(a1) * R, Math.sin(a1) * R);
      c.lineTo(Math.cos(a2) * root, Math.sin(a2) * root);
    }
    c.closePath();
    const bg = c.createLinearGradient(-R, -R, R, R);
    bg.addColorStop(0, '#aab6c4'); bg.addColorStop(0.5, '#7c8896'); bg.addColorStop(1, '#5d6874');
    c.fillStyle = bg; c.fill();
    c.strokeStyle = 'rgba(240,248,255,0.55)'; c.lineWidth = 1; c.stroke();
    // hub and bolts
    c.fillStyle = '#39424f';
    c.beginPath(); c.arc(0, 0, R * 0.3, 0, 7); c.fill();
    c.fillStyle = '#1b2029';
    c.beginPath(); c.arc(0, 0, R * 0.12, 0, 7); c.fill();
    c.fillStyle = 'rgba(200,214,230,0.7)';
    for (let i2 = 0; i2 < 3; i2++) {
      const a3 = i2 / 3 * Math.PI * 2;
      c.beginPath(); c.arc(Math.cos(a3) * R * 0.46, Math.sin(a3) * R * 0.46, 1.4, 0, 7); c.fill();
    }
    c.restore();
    // it is turning far too fast to see: one soft ring sells the speed
    c.save();
    c.globalAlpha = 0.22;
    c.strokeStyle = '#e8f0fa'; c.lineWidth = R * 0.24;
    c.beginPath(); c.arc(0, 0, R * 0.88, 0, 7); c.stroke();
    c.restore();
    c.restore();
    // heat glow, brighter the harder it is working
    c.save();
    c.globalCompositeOperation = 'lighter';
    const k = 0.10 + clamp(this.sp / 300, 0, 1) * 0.16 + (this.hitT > 0 ? 0.3 : 0);
    const g2 = c.createRadialGradient(this.x, this.y, 2, this.x, this.y, this.r * 2.4);
    g2.addColorStop(0, 'rgba(255,176,90,' + k.toFixed(3) + ')');
    g2.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = g2;
    c.beginPath(); c.arc(this.x, this.y, this.r * 2.4, 0, 7); c.fill();
    c.restore();
  }
}
class MovingPlat {
  constructor(tx, ty, spec) {
    // spec: [dxTiles, dyTiles, periodSec, widthTiles?]
    const wT = (spec && spec[3]) || 3;
    this.w = wT * TILE; this.h = 12;
    this.x0 = tx * TILE; this.y0 = ty * TILE - this.h;
    this.x1 = this.x0 + ((spec && spec[0]) || 0) * TILE;
    this.y1 = this.y0 + ((spec && spec[1]) || 0) * TILE;
    this.per = Math.max(1.4, (spec && spec[2]) || 3.4);
    this.ph = 0; this.x = this.x0; this.y = this.y0;
    this.fdx = 0; this.fdy = 0;
  }
  update(dt) {
    this.ph += dt;
    const k = (1 - Math.cos(this.ph / this.per * Math.PI * 2)) / 2;   // 0â†’1â†’0
    const nx = this.x0 + (this.x1 - this.x0) * k;
    const ny = this.y0 + (this.y1 - this.y0) * k;
    this.fdx = nx - this.x; this.fdy = ny - this.y;
    this.x = nx; this.y = ny;
  }
  draw(c) {
    const P = PAL[G.roomDef.zone];
    const moving = Math.abs(this.fdx) + Math.abs(this.fdy) > 0.01;
    c.save();
    // the rail slab wears the same authored deck the built world does, so a
    // moving platform never reads as a different material to stand on
    if (typeof drawDeck === 'function' && typeof platVariant === 'function'
        && drawDeck(c, this.x, this.y - 5, this.w, 30, platVariant())) {
      // its own rail line and thruster wash still tell you it TRAVELS
      c.strokeStyle = 'rgba(150,170,190,0.14)'; c.lineWidth = 2;
      c.setLineDash([4, 7]);
      c.beginPath();
      c.moveTo(this.x0 + this.w / 2, this.y0 + this.h / 2);
      c.lineTo(this.x1 + this.w / 2, this.y1 + this.h / 2);
      c.stroke(); c.setLineDash([]);
      if (moving) {
        const dir = Math.atan2(this.fdy, this.fdx) + Math.PI;
        const jx = this.x + this.w / 2 + Math.cos(dir) * this.w * 0.5;
        const jy = this.y + this.h / 2 + Math.sin(dir) * 8;
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
        const jg = c.createRadialGradient(jx, jy, 1, jx, jy, 14);
        jg.addColorStop(0, P.glow); jg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = jg; c.beginPath(); c.arc(jx, jy, 14, 0, 7); c.fill();
        c.restore();
      }
      c.restore();
      return;
    }
    // rail ghost: the travel line, faint, so the timing is readable
    c.strokeStyle = 'rgba(150,170,190,0.14)'; c.lineWidth = 2;
    c.setLineDash([4, 7]);
    c.beginPath();
    c.moveTo(this.x0 + this.w / 2, this.y0 + this.h / 2);
    c.lineTo(this.x1 + this.w / 2, this.y1 + this.h / 2);
    c.stroke(); c.setLineDash([]);
    // slab body: dark metal, chamfered, with the zone's light on its lip
    const g = c.createLinearGradient(0, this.y, 0, this.y + this.h);
    g.addColorStop(0, '#4a5462'); g.addColorStop(0.35, '#2c323c'); g.addColorStop(1, '#171b22');
    c.fillStyle = g; rr(c, this.x, this.y, this.w, this.h, 4); c.fill();
    c.strokeStyle = '#0c0f14'; c.lineWidth = 2; rr(c, this.x, this.y, this.w, this.h, 4); c.stroke();
    // emissive top strip â€” her landing surface, always readable
    c.fillStyle = P.glow; c.globalAlpha = 0.85;
    rr(c, this.x + 3, this.y + 1.5, this.w - 6, 3, 2); c.fill();
    c.globalAlpha = 1;
    // side thruster wash when it moves
    if (moving) {
      const dir = Math.atan2(this.fdy, this.fdx) + Math.PI;
      const jx = this.x + this.w / 2 + Math.cos(dir) * this.w * 0.5;
      const jy = this.y + this.h / 2 + Math.sin(dir) * 8;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
      const jg = c.createRadialGradient(jx, jy, 1, jx, jy, 14);
      jg.addColorStop(0, P.glow); jg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = jg; c.beginPath(); c.arc(jx, jy, 14, 0, 7); c.fill();
      c.restore();
    }
    // underside vents
    c.fillStyle = 'rgba(8,10,14,0.8)';
    for (let i = 0; i < Math.floor(this.w / 22); i++)
      c.fillRect(this.x + 8 + i * 22, this.y + this.h - 3, 10, 2);
    c.restore();
  }
}
// ride resolve, run every frame after her physics: standing on a slab means
// the slab's motion is hers too. One-way from above; never a head bonk.
function platRide(p) {
  if (!G.plats || !G.plats.length || p.dead) return;
  for (const pl of G.plats) {
    if (p.x + p.w <= pl.x + 2 || p.x >= pl.x + pl.w - 2) continue;
    const feet = p.y + p.h;
    const catchBand = 12 + Math.abs(pl.fdy) * 2;
    if (p.vy >= -1 && feet >= pl.y - 5 && feet <= pl.y + catchBand) {
      if (!p.on && p.vy > 420) {                 // real landing: squash + dust
        p.landT = p.vy > 700 ? 0.22 : 0.12; p.land0 = p.landT;
        sfx('land');
        burst(p.x + p.w / 2, pl.y, 6, '#9fb8c8', 90, 0.35, 500, 2);
      }
      p.x += pl.fdx;
      p.y = pl.y - p.h;
      p.vy = Math.min(p.vy, Math.max(0, pl.fdy * 60));
      p.on = true; p.coyote = 0.1;
      p.airJumps = hasMod('djump') ? (hasSkill('triple') ? 2 : 1) : 0;
      return;
    }
  }
}

// ================= PICKUPS =================
// open air from a pickup to her, sampled every 12 px through the tile grid
function scrapSees(o) {
  const x0 = o.x + o.w / 2, y0 = o.y + o.h / 2;
  const dx = player.x + player.w / 2 - x0, dy = player.y + player.h / 2 - y0;
  const n = Math.ceil(Math.hypot(dx, dy) / 12);
  for (let i = 1; i < n; i++) {
    if (solidAt(Math.floor((x0 + dx * i / n) / TILE), Math.floor((y0 + dy * i / n) / TILE))) return false;
  }
  return true;
}
class Scrap {
  constructor(x, y, val) {
    this.x = x; this.y = y; this.w = 10; this.h = 10; this.val = val;
    this.vx = rnd(-130, 130); this.vy = rnd(-320, -120); this.t = rnd(0, 9);
    this.dead = false;
  }
  update(dt) {
    this.t += dt;
    if (this.rest === undefined) this.rest = 0;
    // A shard that lands in spikes, or on a ledge you cannot stand on, used to be
    // gone for good. After a moment at rest it drifts to you instead.
    const settled = this.rest > 1.2;
    // ...but never THROUGH rock. Scrap left in a sealed pocket â€” behind a
    // hollow wall, under a brittle crust, in a cave's hidden hold â€” used to
    // fly straight out through the stone the moment she came near, so the
    // secret paid before it was found. It drifts only along open air now;
    // cut the seal and the line opens.
    if (settled && !player.dead && dist2(this.x, this.y, player.x, player.y) < 320 * 320 && scrapSees(this)) {
      const dx = player.x + 12 - this.x, dy = player.y + 18 - this.y, d = Math.hypot(dx, dy) || 1;
      this.x += dx / d * 300 * dt; this.y += dy / d * 300 * dt;
      this.vx = 0; this.vy = 0;
      if (chance(dt * 8)) addPart(this.x, this.y, 0, -30, 0.4, '#ffd76a', 1.6, 0, true);
      if (aabb(this, player)) { this.dead = true; bankScrap(this.val); sfx('pick'); }
      return;
    }
    if (hasCrest('magnet') && !player.dead && dist2(this.x, this.y, player.x, player.y) < 210 * 210) {
      const dx = player.x + 12 - this.x, dy = player.y + 18 - this.y, d = Math.hypot(dx, dy) || 1;
      this.vx += dx / d * 1900 * dt; this.vy += dy / d * 1900 * dt;
    } else this.vy += 900 * dt;
    const pv = this.vy;
    const col = moveEnt(this, dt);
    if (col.d) { this.vy = pv < -50 ? 0 : -pv * 0.35; this.vx *= 0.82; }
    if (col.l || col.r) this.vx = 0;
    this.rest = (col.d && Math.abs(this.vy) < 30 && Math.abs(this.vx) < 20) ? this.rest + dt : 0;
    if (!player.dead && aabb(this, player)) {
      this.dead = true; bankScrap(this.val); sfx('pick');
      addPart(this.x, this.y, 0, -60, 0.4, '#ffd76a', 3, 0, true);
    }
  }
  draw(c) {
    const s = this.size || (this.val >= 15 ? 6 : 4);
    c.save(); c.translate(this.x + 5, this.y + 5); c.rotate(this.t * 3);
    c.shadowColor = '#ffd76a'; c.shadowBlur = 8; c.fillStyle = '#ffd76a';
    c.fillRect(-s / 2, -s / 2, s, s);
    c.restore(); c.shadowBlur = 0;
  }
}
// THE HUSK â€” what is left standing where HZD-99 fell.
// Hollow Knight leaves a shade you must fight. A repair unit leaves something
// worse and more personal: her own previous chassis, still upright, still running
// the last orders she gave it, with the broadcast already behind its eyes. It
// holds the scrap and the charge she was carrying.
// Two ways to take it back, and they are not equal â€” walk into it and it gives up
// the scrap, or play the Song first and it remembers itself, releasing the charge
// as well. The recovery uses the one power that is hers.
class Pouch {
  constructor(x, y, amount) {
    this.x = x; this.y = y; this.w = 22; this.h = 30; this.amount = amount;
    this.vy = 0; this.vx = 0; this.dead = false; this.t = 0;
    this.calmed = false;                 // has the Song reached it
    this.volts = (G.save.pouchVolts || 0);
    this.drift = chance(0.5) ? 1 : -1;
    this.hypnoT = 0; this.stagT = 0; this.kind = 'husk';
  }
  update(dt) {
    this.t += dt;
    // the Song calms it â€” the same call that charms mimics
    if (!this.calmed && this.hypnoT > 0) {
      this.calmed = true;
      burst(this.x + 11, this.y + 12, 22, ELEM.murr.glow, 240, 0.8, -40, 3, true);
      sfx('powerUp'); G.toast(t('husk_calm'));
    }
    // it paces where it fell until it is calmed, then waits for her
    if (!this.calmed) {
      this.vx = this.drift * 22 * (0.6 + Math.sin(this.t * 1.6) * 0.4);
      if (!groundAhead(this, this.drift)) this.drift *= -1;
    } else this.vx = 0;
    this.vy += 900 * dt;
    const col = moveEnt(this, dt);
    if (col.l || col.r) this.drift *= -1;
    if (!player.dead && aabb(this, player)) {
      this.dead = true;
      G.save.scrap += this.amount;
      let msg = t('pouch_back') + '  +' + this.amount;
      if (this.calmed && this.volts > 0) {
        player.gainVolts(this.volts);
        msg += '  Â·  +' + this.volts + 'âš¡';
      }
      G.save.pouch = null; G.save.pouchVolts = 0;
      sfx('bench'); G.toast(msg);
      burst(this.x + 11, this.y + 14, 26, this.calmed ? ELEM.murr.glow : '#ffd76a', 300, 0.7, 60, 4, true);
    }
  }
  draw(c) {
    const cx = this.x + 11, sway = Math.sin(this.t * (this.calmed ? 1.4 : 3.4)) * (this.calmed ? 1 : 2.2);
    contactShadow(c, cx, this.y + this.h, 11, 0.4);
    c.save(); c.translate(cx + sway * 0.3, this.y + this.h);
    // hollow chassis: her outline, emptied out
    const g = c.createLinearGradient(-9, -28, 8, 2);
    g.addColorStop(0, this.calmed ? '#6f8f96' : '#4a5560');
    g.addColorStop(1, '#151c24');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-8, 0); c.lineTo(-9, -16);
    c.quadraticCurveTo(-9, -26, 0, -26);
    c.quadraticCurveTo(9, -26, 9, -16); c.lineTo(8, 0);
    c.closePath(); c.fill();
    // ears, so it is unmistakably her shape
    c.beginPath(); c.moveTo(-7, -22); c.lineTo(-9, -31); c.lineTo(-2, -24); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(7, -22); c.lineTo(9, -31); c.lineTo(2, -24); c.closePath(); c.fill();
    // the eyes are the whole point: red while the broadcast still has it,
    // her own teal once the Song has reached it
    const col = this.calmed ? ELEM.murr.col : '#ff2f4f';
    c.fillStyle = col; c.shadowColor = col;
    c.shadowBlur = 10 + Math.sin(this.t * 5) * 5;
    c.fillRect(-6, -20, 4.2, 2.6); c.fillRect(1.8, -20, 4.2, 2.6);
    c.shadowBlur = 0;
    // the scrap it is holding, visible in the chest cavity
    c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 8;
    c.fillRect(-2.4, -13, 4.8, 4.8);
    c.shadowBlur = 0;
    c.restore();
    if (this.calmed) {   // it hums back
      c.save(); c.globalAlpha = 0.5 + Math.sin(this.t * 4) * 0.3;
      ftxt('â™ª', cx + 12, this.y - 4, 12, ELEM.murr.glow);
      c.restore(); c.globalAlpha = 1;
    }
  }
}

// glowing relic drop â€” grab it before you forget it
class RelicPickup {
  constructor(x, y, id) {
    this.x = x; this.y = y; this.w = 20; this.h = 20; this.id = id;
    this.vx = rnd(-60, 60); this.vy = -280; this.t = 0; this.dead = false;
  }
  update(dt) {
    this.t += dt;
    this.vy += 700 * dt;
    const col = moveEnt(this, dt);
    if (col.d) { this.vy = 0; this.vx *= 0.8; }
    if (chance(0.25)) addPart(this.x + 10, this.y + 10, rnd(-25, 25), rnd(-50, -10), 0.4, '#ffd76a', 2, 0, true);
    if (!player.dead && aabb(this, player)) {
      this.dead = true;
      G.grantRelic(this.id);
    }
  }
  draw(c) {
    const bob = Math.sin(this.t * 4) * 3;
    c.save(); c.translate(this.x + 10, this.y + 10 + bob);
    c.shadowColor = '#ffd76a'; c.shadowBlur = 14;
    c.fillStyle = '#2c2517'; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill();
    c.strokeStyle = '#ffd76a'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.stroke();
    c.shadowBlur = 0;
    c.font = '700 11px "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#ffd76a'; c.fillText(RELIC_ICONS[this.id] || 'â—†', 0, 1);
    c.restore();
  }
}
// ================= ENEMIES =================
function drawTurretLock(c, e, cx) {
  const cy = e.y + e.h / 2;
  // across the lock it was ACTUALLY given: a conduit gun's is longer (see
  // CONDUIT_TRAIN_LOCK), and a beam that finished brightening early would be
  // reporting a shot that has not been fired yet
  const k = 1 - clamp(e.lockT / (e.lock0 || 0.55), 0, 1);            // 0 -> 1 across the lock
  const px = player ? player.x + player.w / 2 : cx, py = player ? player.y + player.h / 2 : cy;
  c.save();
  // the beam finds you: faint and wide at first, thin and bright at the end.
  // It runs off to wherever she is, so it is decoration to the bible's
  // measurements (G.artProbe), never to the player.
  if (!G.artProbe) {
  c.globalAlpha = 0.10 + k * 0.5;
  c.strokeStyle = TELL_COL; c.lineWidth = 3.5 - k * 2.2;
  c.setLineDash([9, 7]); c.lineDashOffset = -performance.now() / 45;
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(px, py); c.stroke();
  c.setLineDash([]);
  }
  // and the eye itself, quickening
  c.globalAlpha = 0.55 + Math.sin(e.anim * (16 + k * 26)) * 0.35;
  c.fillStyle = TELL_COL; c.shadowColor = TELL_COL; c.shadowBlur = 12;
  c.beginPath(); c.arc(cx, cy - e.h * 0.34, 2.4 + k * 2.2, 0, 7); c.fill();
  c.shadowBlur = 0;
  c.restore();
  c.globalAlpha = 1;
}
// Rising, and no longer gently (owner, 2026-09-18: "enemies should get stronger
// and tougher"). At the deepest point a machine now carries 2.1x the plating and
// about a quarter more pace. Difficulty still arrives mostly through what they DO
// and how they are combined â€” this is the floor under that, not the mechanism
// itself â€” but the floor was low enough that the back half of the game escalated
// by terrain alone. The curve is steeper because the player's side of it now
// grows too: WEAPON_ATK (js/weapons.js) hands her up to 1.95x for questing her
// swords, and these numbers are chosen against that so an upgraded player holds
// roughly her time-to-kill while an un-upgraded one feels every border she
// crosses. Raising the two together is the point; raising either alone is not.
const ZONE_K = { A: 1.0, B: 1.25, C: 1.5, D: 1.8, E: 2.1, X: 2.0 };
// ...and the same machine is tougher everywhere, including the first meadow,
// where there is no zone escalation to do it. One multiplier over EKIND rather
// than twelve edited rows: the table stays a description of what each machine
// IS, and this stays a dial on how hard the game is.
const FOE_HP = 1.15;
// WHICH WEAPON EACH FIGHT IS TUNED AGAINST.
//
// A guardian's HP is authored flat (BSTAT) with no zone escalation, so raising
// the player's attack would have made every guardian FASTER to kill â€” the exact
// opposite of the instruction. They cannot take one shared multiplier either:
// the largest (1.95, the joined blade) would make NULLFANG half again as long
// as the fight its own note asks for ("losable, not long"), and the smallest
// would hand MOTHER-V over. So each fight is tuned against the weapon she is
// expected to be HOLDING when she arrives, which is a property of the kingdom
// it stands in â€” the one thing about a guardian that cannot drift.
const ZONE_ATK = { A: 1.3, B: 1.45, C: 1.6, D: 1.6, E: 1.95, X: 1.95 };
// ===========================================================================
// THE MACHINES LEARN. Zone scaling makes them tougher the deeper you go; this
// makes them CLEVERER the stronger you get, which is a different axis and the
// more interesting one. A player who has taken four powers and three guardians
// is not asking for enemies with more health â€” they are asking to be read.
//
// What rises with it: how soon they commit, whether they aim where she IS or
// where she is GOING, whether they follow up, whether they track her while
// winding up. What never rises with it: THE LENGTH OF THE WARNING. Difficulty
// that comes from shortening the tell is difficulty bought by making the game
// unreadable, and that trade is never worth taking â€” every attack stays as
// readable at full cunning as it was in the first room.
// ===========================================================================
function foeIQ() {
  const sv = typeof G !== 'undefined' && G.save;
  if (!sv) return 0;
  let mods = 0; for (const k in (sv.abil || {})) if (sv.abil[k]) mods++;
  let won = 0;
  for (const k of ['bossGlitch', 'bossBrood', 'bossAtlas', 'bossZero', 'bossPrism'])
    if (sv.flags && sv.flags[k]) won++;
  const skills = (sv.skills || []).length;
  // four powers and three guardians is about three quarters of the way up
  return clamp(mods * 0.11 + won * 0.10 + skills * 0.035, 0, 1);
}
// CUNNING IS ONE AXIS; MUSCLE IS THE OTHER. Getting smarter alone eventually
// reads as an enemy that dodges well and still dies in two hits â€” the fight
// gets fussier without getting bigger. This is the second dial: the same
// machines, reinforced, as the virus gets more of the city to work with.
// Multiplied with the zone curve, so depth and progress compound instead of
// competing (a first-kingdom frame late in a run is still the weakest thing in
// the game; a Nest frame late in a run is the hardest).
function foePow() { return 1 + foeIQ() * 0.55; }
// AND MIX AND MATCH. A flat multiplier makes every enemy the same enemy with
// bigger numbers. Traits make the same room play differently twice: one crawler
// is quick, the next is armoured, the one after goes off when it dies. Each is
// marked on the body so it is read before it is discovered, and none of them
// touches a telegraph â€” an enemy is never harder because it warned you less.
const TRAITS = {
  swift:    { spd: 1.32, hp: 0.92, col: '#7de8ff' },
  tough:    { spd: 0.9,  hp: 1.75, col: '#c8b28a' },
  volatile: { spd: 1.06, hp: 0.9,  col: '#ff9a5a' },
};
const TRAIT_KEYS = ['swift', 'tough', 'volatile'];
// ===========================================================================
// THE MACHINE HAS A LEVEL, AND THE LEVEL IS WHAT IT SPENDS (owner, 2026-09-18:
// "improve enemy level and skills point with more moves that need to be created
// for them with every kingdom").
//
// Two dials already existed and neither was a level: foeIQ() reads the RUN's
// progress, and ZONE_K reads the KINGDOM's depth. Nothing combined them, which
// is why traits â€” the one thing that made two crawlers play differently â€” were
// rolled off progress ALONE: a Virus Nest machine on a fresh save reinforced
// exactly like the first crawler in the meadow, because the table never asked
// where it was standing.
//
// The level asks both. A kingdom sets the floor (the Nest builds better
// machines than the meadow, always) and the run raises it (the virus has more
// of the city to work with the further she gets).
const FOE_ZONE_LV = { A: 1, B: 2, C: 3, D: 4, E: 5, X: 5 };
function foeLevel(zone) {
  const z = zone || (typeof G !== 'undefined' && G.roomDef && G.roomDef.zone) || 'A';
  // the run is worth up to two levels on top of whatever the kingdom is worth
  return clamp((FOE_ZONE_LV[z] || 1) + Math.round(foeIQ() * 2), 1, 7);
}
// ...AND THE POINTS ARE WHAT IT BUYS THEM WITH. One per level after the first,
// so the opening meadow on a fresh save spends nothing and is exactly the game
// it always was.
function foeSkillPts(lv) { return Math.max(0, (lv | 0) - 1); }
// WHERE A KINGDOM'S NEW MOVES GO.
//
// This is a registry, and it is deliberately empty in this commit: the moves
// themselves are per-kingdom content and belong to the kingdom sessions (see
// CLAUDE.md, KINGDOMS ARE THE UNIT), which are briefed to add rows here and
// implement the behaviour behind hasMove(). It exists now so that five sessions
// working in parallel extend ONE mechanism instead of inventing five, which is
// the whole reason the integrator owns the framework and not the content.
//
// TWO KINDS OF KEY, AND THE SECOND ONE IS WHY THIS IS SAFE TO WORK ON IN
// PARALLEL. Most machines are shared â€” a crawler walks in all five kingdoms â€”
// so five sessions all editing `crawler` would collide on one row and quietly
// overwrite each other's moves. So a row may be scoped to a kingdom:
//
//   crawler:    [{ id: 'burrow', cost: 1 }]   // a crawler ANYWHERE
//   'crawler@C': [{ id: 'slag', cost: 2 }]    // ...and only in the Foundry
//
// A kingdom session writes `@<its own zone>` keys and nothing else, so no two
// sessions ever touch the same row. The unscoped row is the integrator's.
//
// Cheapest first, scoped moves after shared ones. A move is affordable when the
// machine's remaining points cover it, and EVERY move needs its own telegraph â€”
// the law above TRAITS is not relaxed by this: an enemy is never harder because
// it warned you less.
const FOE_MOVES = {};
// ---------------------------------------------------------------------------
// KINGDOM D â€” THE ARCHIVES. Three moves, and the kingdom's own sentence runs
// through all of them: THE ARCHIVES DO NOT CHASE YOU, THEY KEEP A RECORD OF
// YOU. Zone D is the floor you cannot stop on, so every one of these attacks
// the ground rather than the body â€” and each attacks a DIFFERENT ground.
//
// They are deliberately not three flavours of cold, because the kingdom
// already has a guardian made of cold. GLACIERE projects: her ABSOLUTE ZERO
// is one aura centred on HER, expanding NOW. Nothing here is centred on the
// machine that casts it and nothing here resolves when it is cast:
//
//   recall   (rime)   â€” a second circle on a place she has ALREADY LEFT
//   redact   (turret) â€” a strip of floor struck out where she is GOING
//   crossref (guard)  â€” the room is told, and the room's REST closes up
//
// Scoped '@D' per the parallel-session rule above: the Archives' crawler is
// still the integrator's crawler, and no unscoped row is touched here.
//
// COSTS. Zone D's floor is level 4, so an Archives machine lands with 3 to 5
// points. At 1, `redact` is on every turret in the kingdom; at 2, `recall`
// and `crossref` are on every rime and guard â€” which is correct, because a
// kingdom's own machine should be the kingdom's own question, taught at its
// door. What the points still buy is the SECOND move on a body: the rime's
// `erasure` at 3 needs a machine deep enough to hold both, so an early
// Archives coil files one record and a late one files a record it then
// strikes out.
FOE_MOVES['rime@D'] = [{ id: 'recall', cost: 2 }, { id: 'erasure', cost: 3 }];
FOE_MOVES['turret@D'] = [{ id: 'redact', cost: 1 }];
FOE_MOVES['guard@D'] = [{ id: 'crossref', cost: 2 }];
function foeMovesFor(kind, lv, zone) {
  const z = zone || (typeof G !== 'undefined' && G.roomDef && G.roomDef.zone) || 'A';
  const list = (FOE_MOVES[kind] || []).concat(FOE_MOVES[kind + '@' + z] || []);
  if (!list.length) return [];
  let pts = foeSkillPts(lv);
  const out = [];
  for (const m of list) {
    const cost = m.cost || 1;
    if (cost > pts) continue;
    pts -= cost; out.push(m.id);
  }
  return out;
}
// ===========================================================================
// KINGDOM A â€” THE SCRAP MEADOWS ARM THEIR OWN MACHINES.
//
// One idea, worn three ways: the meadow is made of scrap, and a machine that
// has been here long enough learns to PICK THE SCRAP UP. Nothing here is a new
// body, a new sheet or a new state machine â€” it is the roster she already knows
// reaching down and using the floor she has been walking on since the first
// minute of the game. That is what a returning player is supposed to read:
// not "a new enemy", but "these have been busy".
//
// THE CONSTRAINT NO OTHER KINGDOM HAS. foeLevel('A') is 1 on a fresh save,
// which is ZERO points, which buys none of this â€” so the tutorial, the waking
// floor and the first hour are byte-for-byte the game they have always been.
// The run's own progress is what raises the meadow to level 2-3, so these
// appear on the walk BACK through it and nowhere else. tests/scrapmoves.cjs
// measures both halves of that, and the fresh-save half is the important one.
//
// EVERY ONE OF THEM PAYS FOR ITS REACH WITH A LONGER WARNING. The law above
// TRAITS is not relaxed by a level: an enemy is never harder because it warned
// you less. A crawler that drags a plate has to pick the plate up first, and
// picking it up takes TELL_SWIPE where the bare lunge took TELL_FAST â€” the tell
// gets 43% LONGER, in exchange for the reach. Same for the hopper's rake. The
// blob's bloom goes further still and paints the two tiles it is about to throw
// at, because a hazard that lands where she is not standing has to be shown or
// it is not a read at all.
FOE_MOVES['crawler@A'] = [{ id: 'scrapdrag', cost: 1 }];
FOE_MOVES['hopper@A'] = [{ id: 'scrapkick', cost: 1 }];
FOE_MOVES['blob@A'] = [{ id: 'rustbloom', cost: 1 }];
// The bloom's sag, against the plain drip's 0.34: nearly twice the warning for
// a throw that leaves the tile under it and takes the two beside it instead.
const BLOB_BLOOM = 0.62;
// how far a bloom throws, how far a dragged plate reaches past the nose, and
// how far the hopper's rake washes along the floor â€” all in pixels, all read
// off the body so a trait that changes its size does not change its reach
const BLOOM_THROW = 30, DRAG_REACH = 16, KICK_REACH = 96;
// TRAITS ARE THE FIRST THING THE POINTS BUY, and they are still SPARSE on
// purpose. Handing a deep-kingdom machine every trait it can afford would undo
// the reason traits exist ("a flat multiplier makes every enemy the same enemy
// with bigger numbers") â€” so the cap is two however rich it gets, and each one
// still has to win a roll. A Nest room is LIKELY to be reinforced; it is never
// uniformly reinforced.
function rollTraits(lv) {
  const pts = foeSkillPts(lv), out = [];
  if (pts <= 0) return out;
  const max = Math.min(2, Math.ceil(pts / 2));
  const chance = 0.25 + pts * 0.09;
  for (let i = 0; i < max; i++) {
    if (Math.random() >= chance) continue;
    const t = TRAIT_KEYS[Math.floor(Math.random() * TRAIT_KEYS.length)];
    if (out.indexOf(t) < 0) out.push(t);
  }
  return out;
}
// ===========================================================================
// KINGDOM 5 â€” THE VIRUS NEST'S OWN MOVES (`@E` rows only; the unscoped rows
// are the integrator's, and the four other kingdom sessions own their own
// letters â€” see the registry note above).
//
// The Nest is the last kingdom before the end, and what it has that no other
// kingdom has is that the machinery HAS STOPPED BEING MACHINERY. The other
// four buy behaviour; these three buy biology. Each is the kingdom's own idea
// rather than a bigger number:
//
//   thornbed  (blob,  cost 1) the drip TAKES ROOT, and the air over the pool
//                             stops being free â€” the answer she learned to a
//                             blob ("go over it") is the one that is argued.
//   shed      (guard, cost 2) the plate is grown tissue: deny it enough hits
//                             and it TEARS LOOSE and crawls at her, and the
//                             guard is bare for good. The one move in the
//                             game where SHE opens the window and pays for it.
//   infest    (snare, cost 3) the Nest does not kill the machine, it RECRUITS
//                             it. The snare spends its own punish window
//                             calling a spore into another machine in the
//                             room, and a carrier bursts into a spore bed
//                             where it dies. Kill order becomes a decision.
//
// WHY A 3 LANDS HERE AND NOWHERE ELSE: a cost-3 row needs four skill points,
// which is level 5, which is the Nest's floor alone (FOE_ZONE_LV.E === 5) â€”
// every other kingdom would have to finish the run to afford one. And all
// three fit: a Nest machine has 4 points before the run adds anything.
//
// AND EVERY ONE OF THEM WARNS FIRST, which matters more here than anywhere
// because a player in this kingdom is already handling the hardest machines
// in the game. thornbed grows for THORN_RISE in amber before it can touch
// her; shed gathers for TELL_SWIPE and can be interrupted; infest swells a
// sac across the WHOLE limp window and pops if the snare is struck. Cunning
// buys reach, count and persistence in all three. It never buys silence.
FOE_MOVES['blob@E'] = [{ id: 'thornbed', cost: 1 }];
FOE_MOVES['guard@E'] = [{ id: 'shed', cost: 2 }];
FOE_MOVES['snare@E'] = [{ id: 'infest', cost: 3 }];
// THORNBED. The rise is the telegraph and it is longer than TELL_FAST on
// purpose: the pool it grows out of is already under her feet by then, so the
// warning has to pay for the ground it costs. Live for 1.6 s, and it dies with
// the blob that grew it â€” kill the blob and the bed goes with it.
const THORN_RISE = 0.5, THORN_LIVE = 1.6, THORN_H = 36, THORN_HALF = 13;
// SHED. Three denied hits tear the tissue loose. Three because two is a slip
// and four is a chore â€” it is the number of swings a player who has decided
// the plate is the answer will land before looking for another one.
const SHED_HITS = 3, CREEP_LIFE = 2.4;
// INFEST. Two carriers per snare, ever: a cascade would turn the room into one
// event instead of a decision, and the whole point is the CHOICE of what to
// kill. The bed a carrier leaves behind uses the blob's own pool, because the
// floor going hostile already has a vocabulary in this game and inventing a
// second one for the same meaning is how a room stops being readable.
const INFEST_MAX = 2, INFEST_REACH = 420;
// ---------------------------------------------------------------------------
// thornbed: the stalk that grows out of a Nest blob's pool. Kept on the BLOB
// rather than on the pool because the pool is the shared blob's, in the shared
// layer, and a kingdom's move may not reach into it â€” and because "kill the
// blob, the bed dies" is a better rule than a hazard that outlives its cause.
function thornStep(e, dt) {
  if ((e.thornRise || 0) > 0) {
    e.thornRise -= dt;
    if (e.thornRise <= 0) { e.thornRise = 0; e.thornT = THORN_LIVE; sfx('spikeup'); }
    return;
  }
  if ((e.thornT || 0) <= 0) return;
  e.thornT -= dt;
  if (chance(dt * 16)) addPart(e.thornX + rnd(-4, 4), e.thornY - rnd(4, THORN_H),
    rnd(-16, 16), rnd(-40, -10), 0.4, '#ff6b7a', 1.8, 60, true);
  if (player.dead || player.iT > 0) return;
  const fx = player.x + player.w / 2;
  if (Math.abs(fx - e.thornX) < THORN_HALF + player.w * 0.4
      && player.y + player.h > e.thornY - THORN_H && player.y < e.thornY)
    player.hurt(DF().edmg, e.thornX, 'blob.thornbed');
}
// ---------------------------------------------------------------------------
// shed: the denied hit is counted off hurtT's RISING EDGE. js/types.js's
// dealDmg sets hurtT = 0.12 on the branch that denies a hit to a raised plate
// and nothing else in the frame raises it while the plate is up, so the edge is
// the signal â€” and reading it here means the move never touches the shared
// damage path, which four other sessions are also standing in.
function shedStep(e, dt) {
  const prev = e._shedHurt || 0;
  if (e.hurtT > prev + 1e-4 && e._shedGuard && !e.plateShed) {
    e.shedN = (e.shedN || 0) + 1;
    burst(e.x + e.w / 2 + e.dir * e.w * 0.52, e.y + e.h * 0.5, 5, '#ff8a8a', 150, 0.3, 40, 2, true);
  }
  e._shedHurt = Math.max(0, e.hurtT);
  e._shedGuard = !!e.guard;
  // THE TEAR WAITS FOR A CLEAN BEAT, and it is checked every frame rather than
  // on the frame of the hit. Firing it the instant the third blow lands could
  // drop it on top of a coil the player is already reading, and two amber
  // wind-ups at once is one wind-up nobody can read. The count keeps until the
  // machine is between actions, which is never more than one lunge away.
  if ((e.shedN || 0) >= SHED_HITS && !e.plateShed && (e.crouchT || 0) <= 0
      && (e.coilT || 0) <= 0 && (e.lungeT || 0) <= 0 && (e.windedT || 0) <= 0) {
    e.shedN = 0; e.crouchT = TELL_SWIPE; e.vx = 0; sfx('tell');
  }
  // the torn tissue, once it is loose: SLOW and it HOMES, which is the whole
  // difference between it and the Conduits' charge wave. That one asks "can
  // you be airborne on a beat"; this one cannot be jumped, only walked away
  // from or out-lived â€” and it is the price of an opening she chose to open.
  const cr = e.creep;
  if (!cr) return;
  cr.life -= dt; cr.ph += dt * 9;
  const want = Math.sign((player.x + player.w / 2) - cr.x) || cr.dir;
  cr.dir = want;
  cr.x += cr.dir * cr.spd * dt;
  // THE FLOOR IS NOT THE TILE TOP. Terrain here is a HEIGHTFIELD (the NO RIGHT
  // ANGLES order: `groundColumnAt`, applied in the vertical resolver), so a body
  // resting on organic ground stands ABOVE the tile it stands on â€” measured at
  // 18 px on A0's own floor. Probing the single tile at the creep's foot finds
  // air and kills it on the frame it is born, which is exactly what it did. So
  // it probes DOWN one tile: enough to find ground under any lift the curve can
  // add, never enough to walk on air over a real gap. And it rides the curve
  // rather than the grid, so it crawls over the mounds instead of through them.
  const ctx2 = Math.floor(cr.x / TILE);
  let railOn = false;
  for (let d = 2; d <= TILE + 2 && !railOn; d += 8)
    railOn = (tt => tt === '#' || tt === 'B' || tt === '=')(tileAt(ctx2, Math.floor((cr.y + d) / TILE)));
  if (railOn && typeof groundColumnAt === 'function') {
    const gc = groundColumnAt(cr.x);
    if (gc && Math.abs(gc[0] - cr.y) < TILE) cr.y = gc[0];
  }
  if (cr.life <= 0 || !railOn) {
    burst(cr.x, cr.y - 4, 7, '#7a5a6a', 140, 0.35, 120, 2, true);
    e.creep = null; return;
  }
  if (chance(dt * 26)) addPart(cr.x + rnd(-7, 7), cr.y - rnd(1, 9), rnd(-24, 24), rnd(-60, -14), 0.3, '#ff5f6d', 1.9, 240, true);
  if (!player.dead && player.iT <= 0 && player.on
      && Math.abs(player.x + player.w / 2 - cr.x) < 16
      && player.y + player.h > cr.y - 22 && player.y + player.h < cr.y + 10)
    player.hurt(DF().edmg, cr.x, 'guard.shed');
}
// ---------------------------------------------------------------------------
// infest: what the snare does with the punish window SHE earned. The sac
// swells across the whole limp beat â€” the countdown IS the telegraph, and it is
// the longest tell any minion in the game wears â€” and a single hit on the
// snare pops it. So the window still pays exactly what it always paid; it has
// simply stopped being a window you can spend walking away.
function infestStep(e, dt) {
  if (e.sacT == null) {                 // the limp beat just began: pick a host
    e.sacT = 0; e.host = null;
    // seed the strike-detector from the CURRENT hurt, or a hit she landed
    // during the tell would pop a sac that had not been grown yet
    e._sacHurt = Math.max(0, e.hurtT);
    if ((e.infestN || 0) >= INFEST_MAX) return;
    let best = null, bd = INFEST_REACH * INFEST_REACH;
    for (const o of G.enemies) {
      // never a sage (its own law of harm owns it), never something she has
      // already won over â€” a cured machine or a tamed wolf is hers, and the
      // Nest taking it back would punish the mercy the whole left-hand path
      // is built on
      if (o === e || o.dead || o.calm || o.tame || o.infested || o.kind === 'sage') continue;
      const d = dist2(o.x + o.w / 2, o.y + o.h / 2, e.x + e.w / 2, e.y + e.h / 2);
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) return;
    e.host = best; e.sacT = Math.max(0.35, e.windedT); e.sac0 = e.sacT;
    sfx('castnull');
    return;
  }
  if (e.sacT <= 0) return;
  // STRUCK: the sac is a soft thing on a limp body and it bursts. Same edge
  // read the guard's plate uses, and the same reason â€” no shared damage hook.
  if (e.hurtT > (e._sacHurt || 0) + 1e-4) {
    e.sacT = 0; e.host = null;
    burst(e.x + e.w / 2, e.y + e.h * 0.3, 14, '#9fffa8', 220, 0.45, 40, 2.6, true);
    sfx('no');
    e._sacHurt = Math.max(0, e.hurtT);
    return;
  }
  e._sacHurt = Math.max(0, e.hurtT);
  e.sacT -= dt;
  const sx = e.x + e.w / 2, sy = e.y + e.h * 0.24;
  if (chance(dt * 12)) addPart(sx + rnd(-5, 5), sy + rnd(-3, 3), rnd(-14, 14), rnd(-26, -6), 0.4,
    e.sacT < (e.sac0 || 1) * 0.4 ? '#9fffa8' : TELL_COL, 2, -30, true);
  if (e.sacT > 0) return;
  const h = e.host; e.host = null;
  if (!h || h.dead || h.calm || h.infested) return;
  h.infested = 1;
  e.infestN = (e.infestN || 0) + 1;
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  for (let i = 0; i < 9; i++) addPart(lerp(sx, hx, i / 9), lerp(sy, hy, i / 9),
    rnd(-30, 30), rnd(-30, 30), 0.5, '#9fffa8', 2.4, 0, true);
  burst(hx, hy, 16, '#9fffa8', 260, 0.5, 60, 3, true);
  sfx('phase');
}
// ===========================================================================
// KINGDOM X â€” THE CRYSTAL CACHE BENDS THE ANSWER (owner, 2026-09-18: "improve
// enemy level and skills point with more moves that need to be created for
// them with every kingdom"). The sixth and last kingdom to file its rows.
//
// `@X`-SCOPED AND NOTHING ELSE, per the registry note above FOE_MOVES: the
// unscoped rows are the integrator's and five other sessions own their own
// letters. Zone X is the Cache AND the crystal cave that shares its seam
// (CV1..CV3 carry zone 'X' in js/world.js), so these rows are what the whole
// quarry builds â€” which is also why the roster here is exactly three kinds.
//
// THE ROSTER IS SMALL AND THAT IS THE SHAPE OF THE KINGDOM. Measured off
// world.js rather than assumed: the only enemy kinds standing anywhere in
// zone X are CRAWLER, HOPPER and BAT. No kiln, no turret, no guard, no blob â€”
// so there is nothing here to hide a weak idea behind. Three machines, three
// moves, one each.
//
// THE ONE SENTENCE ALL THREE SPEAK: THE CACHE REFRACTS THE ANSWER. Every
// other kingdom buys reach, cadence, ground or biology; down here the machine
// is grown through with seam crystal and what bends is the LINE the attack
// travels. So each move is aimed squarely at the ANSWER THE PLAYER ALREADY
// LEARNED for that machine, and at nothing else:
//
//   facet   (crawler, 2) YOU LEARNED TO STEP BEHIND IT. The facet grown along
//                        its spine splits the lunge, and the frame it commits
//                        a lance sweeps the floor it left â€” behind it. The
//                        forward lunge, the reach and the winded 0.55 s are
//                        all untouched; what changes is that the free side
//                        stops being free.
//   refract (hopper,  3) YOU LEARNED TO READ THE ARC. It leaves on the honest
//                        line and turns ONCE, at the top, onto a spot the
//                        floor has been painted with since the crouch began.
//                        The only attack in the game whose DESTINATION is
//                        told instead of inferred â€” and the read moves from
//                        the machine to the ground.
//   glint   (bat,     1) YOU LEARNED TO CHASE IT DOWN. The dive sheds
//                        splinters that hang in the air where it passed, so
//                        the lane behind it is briefly not a corridor. The
//                        game's only AIRBORNE hazard: the blob's pool taught
//                        the floor going hostile, this teaches the air.
//
// THE PRICES ARE THE KINGDOM'S DEPTH. FOE_ZONE_LV.X is 5 â€” tied with the Nest
// for the highest floor in the game â€” so a Cache machine lands with 4 points
// and reaches 6. That is what pays for a cost-3: `refract` needs four points,
// which is level 5, which is this kingdom's floor and the Nest's and nobody
// else's. At 1 the bat's splinters are on every bat down here from the first
// walk, because a kingdom's own question should be asked at its door.
//
// AND EVERY ONE OF THEM WARNS FIRST â€” the law above TRAITS is not relaxed by
// depth, and this is the deepest room in the game, where it matters most.
// Two of the three LENGTHEN a tell (the crawler's coil and the bat's shiver
// both go TELL_FAST -> TELL_SWIPE, 43% more warning) and the third paints its
// landing spot on the floor for the whole crouch A×};ÛFòµë(š+myÕ’õ4Ru24Äô4³¢—B'6÷&'2F†RÆæF–ærÂÆVw2föÆFV@¢òòæB6†W7BF÷vâÂf÷"F†Rf—'7B'BöbF†RFV6—6–öâvF†@¢òòföÆÆ÷w2(	BF†R÷Væ–ærF†RFö2æÖW2„TäTÕ•ô„õU"#R’Âæ÷rv—F€¢òò–7GW&Röb—G2÷vâ–ç7FVBöbF†R7FæF–ærÆFP¢F†—2æÆæEBÒ„õôÄäEõC°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂ"“°¢f÷"†ÆWB’Ò²’Âs²’²²¢FE'B†7‚²&æB‚ÓbÂb’ÂF†—2ç’²F†—2æ‚Â&æB‚Ó“Â“’Â&æB‚Ó#ÂÓ#’Âã3RÂr6#–3fCBrÂ"ã"Âs“°¢òòââææBf÷VæG'’†÷W"ÆæG2–âF†R7'W7BÂ6òF†RÆæF–æp¢òòD…$õu2âGvòvö'2ÂöæRV6‚v’Â7–ÖÖWG&–2öâW'÷6S¢F†RÖ÷fP¢òòFöW2æ÷B–ÒÂ—BF—7Æ6W2(	Bv†–6‚—2v†B¶VW2F†Rç7vW ¢òò÷6—F–öæÂ‚&&Röfb&÷F‚&72"’–ç7FVBöb6ö–âfÆ—öâv†–6€¢òò6–FR—B–6¶VBâF†RÆæF–ær6†ö6²—G6VÆb—2Væ6†ævVBà¢–b‡F†—2æ†4Ö÷fR‚w6Æw7Æ6‚r’’°¢F†—2ævö'2ÒF†—2ævö'2ÇÂµÓ°¢f÷"†6öç7B6vâöb²ÓÂÒ¢F†—2ævö'2çW6‚‡²ƒ¢7‚²6vâ¢‚Â“¢F†—2ç’²F†—2æ‚ÒbÂgƒ¢6vâ¢cRÂg“¢Ó#SÂÆ–fS¢"ã"ÂÖ&³¢F†—2ç’²F†—2æ‚Ò“°¢6g‚‚wfVçBr“°¢Ð¢òòââææB$Te$5BÆæG2ôâF†R–çBÂv†–6‚—2F†Rv†öÆR6Æ–Ð¢òòF†RÖ÷fRÖ¶W2âF†RÖ&²vöW2÷WBv—F‚F†RÆæF–ærÂ6òF†P¢òòfÆö÷"æWfW"6'&–W2v&æ–ærf÷"§V×F†B—2÷fW"à¢–b‡F†—2æÖ&µ‚ÒçVÆÂ’°¢'W'7B†7‚ÂF†—2ç’²F†—2æ‚Ò"Â"Âr3†fS†fbrÂ#CÂãCRÂS#Â"ãBÂfÇ6R“°¢6g‚‚w6†&Br“°¢F†—2æÖ&µ‚ÒçVÆÃ²F†—2æÖ&µ’ÒçVÆÃ²F†—2æ&VæDBÒ°¢Ð¢òòââææBF†R&¶VB†VvöW2v—F‚—@¢–b‡F†—2æÆöFVB’°¢F†—2æÆöFVBÒ²F†—2çv6…BÒãC#²F†—2çv6…"Òc°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂB“°¢'W'7B†7‚ÂF†—2ç’²F†—2æ‚Ò"Â"Âr6#Cs&brÂ#cÂãCRÂcÂ"ãBÂfÇ6R“°¢–b‡G—Vöb6g‚ÓÓÒvgVæ7F–öâr’6g‚‚w&ö6²r“°¢Ð¢Ð¢F†—2çv4—"ÒfÇ6S°¢F†—2çg‚Ò°¢–b‡F†—2æ7&÷V6…Bâ’°¢F†—2æ7&÷V6…BÓÒGC°¢òòF†Rf÷VæG'’w2Ö÷fRFG2âVÖ&W"6†÷vW"f÷"WfW'’g&ÖRöbF†P¢òò7&÷V6ƒ²F†RÖVF÷rw2FG2†V&—6–ærVæFW"F†R7&–æw2Âv†÷6P¢òò4•¤R—2F†R&V6‚—B—2&÷WBFò†fRâGvò¶–ævFö×2ÂGvð¢òò–7GW&W2ÂæBæV—F†W"öbF†VÒ6†÷'FVç2F†R7&÷V6‚à¢–b‡F†—2æ†4Ö÷fR‚w6Æw7Æ6‚r’’VÖ&W%FVÆÂ†7‚ÂF†—2ç’²F†—2æ‚Ò"ÂCÂGB“°¢òòF†R66†Rw2FG2æV—F†W#¢F†R–7GW&R—2öâF†RdÄôõ"ÂF6€¢òòöb6W7F–2Æ–v‡Bv†W&R—BÖVç2Fò6öÖRF÷vâÂæB&VæC—2†÷p¢òòf"F†R7&÷V6‚†2v÷Bâ6†R—2FöÆBF†RFW7F–æF–öâ&Vf÷&RF†P¢òòÖ6†–æR†2ÆVgBF†Rw&÷VæBà¢–b‡F†—2æ&VæEBâ’F†—2æ&VæCÒ6Æ×ƒÒF†—2æ7&÷V6…BòF†—2æ&VæEBÂÂ“°¢–b‡F†—2ç&¶UBâ’°¢F†—2ç&¶SÒ6Æ×ƒÒF†—2æ7&÷V6…BòF†—2ç&¶UBÂÂ“°¢–b†6†æ6R†GB¢#"’¢FE'B†7‚²&æB‚Ó#bÂ#b’ÂF†—2ç’²F†—2æ‚ÒÂ&æB‚Ó‚Â‚’Â&æB‚ÓCÂÓ‚’À¢ã2Âr6#Cs&brÂãbÂSC“°¢Ð¢–b‡F†—2æ7&÷V6…Bâ’'&V³°¢–b‡F†—2ç&¶UBâ’²F†—2æÆöFVBÒ²F†—2ç&¶SÒ²F†—2ç&¶UBÒ²Ð¢Ð¢F†—2çBÓÒGC°¢òò—Bf6W2—G2&W’v†–ÆRvF†W&–ær(	B6òF†RÆVvöW2æ÷6RÖf—'7@¢F†—2æF—"ÒÖF‚ç6–vâ‡‚Ò7‚’ÇÂF†—2æF—"ÇÂ°¢–b‡F†—2çBÃÒbbÆ–W"æFVBbbÖF‚æ'2‡‚Ò7‚’Â3ƒ’°¢òòD„R5$õT4‚â—BW6VBFòÆVæ6‚öâF†Rg&ÖR&æFöÒF–ÖW"†—@¢òò¦W&ò(	B—Bf6VB–÷Rf—'7BÂ'WBf6–ær—2æ÷Bv&æ–ærâæ÷r—@¢òòvF†W'2f÷"DTÄÅôd5Bv—F‚7VRÂæBF†RÆV—2F†–ær–÷P¢òò6r6öÖ–ærà¢òð¢òò45$´”4²ÄTäuD„Tå2•BÂæWfW"F†R&WfW'6S¢&¶–ær†Vö`¢òòÖVF÷r67&VæFW"—G6VÆbF¶W2DTÄÅõ5t•Rv†W&RF†R&&RvF†W ¢òòFöö²DTÄÅôd5Bâ6ÖRG&FRF†R7&vÆW"w2ÆFRÖ¶W2(	B&V6€¢òò&÷Vv‡Bv—F‚v&æ–ærà¢–b‡F†—2æ7&÷V6…BÃÒbbF†—2ævF†W&VB’°¢6öç7B&¶RÒF†—2æ†4Ö÷fR‚w67&¶–6²r“°¢òò$Te$5Bu2t”äBÕUÂæB—B—2F†RÆöævW7Bv&æ–ærç’öbF†P¢òòF‡&VR66†RÖ÷fW2vV'3¢F†R7÷B—24„õ4TâäB”åDTB†W&RÀ¢òòBF†RF÷öbDTÄÅõ5t•R7&÷V6‚ÂæB—B7F—2Æ—BF‡&÷Vv€¢òòF†R7&÷V6‚äBF†Rv†öÆRfÆ–v‡B(	B÷fW"6V6öæBöbæ÷F–6Rf÷ ¢òòÖ6†–æRF†BW6VBFòFVÆÂ–÷Ræ÷F†–ærBÆÂ&÷WBv†W&R—@¢òòv÷VÆB6öÖRF÷vââ–bæV—F†W"6–FRöbF†R†öæW7B&2†2fÆö÷ ¢òòVæFW"—BF†RÖ&²—2æ÷BF¶VâæBF†RÆV—2F†RÆ–âÆVà¢6öç7B&VæFÒÒF†—2æ†4Ö÷fR‚w&Vg&7Br“°¢F†—2æ7&÷V6…BÒ‡&¶RÇÂ&VæFÒ’òDTÄÅõ5t•R¢DTÄÅôd5C°¢F†—2ç&¶UBÒ&¶RòDTÄÅõ5t•R¢²F†—2ç&¶SÒ°¢F†—2æ&VæEBÒ²F†—2æ&VæCÒ²F†—2æÖ&µ‚ÒçVÆÃ²F†—2æÖ&µ’ÒçVÆÃ°¢–b†&VæFÒ’°¢òòv†W&RF†R„ôäU5B&2v÷VÆBWB—BF÷vâ(	B6ÖRæ÷6RÂ6ÖP¢òò7VVBÂ6ÖR†ærF–ÖRF†RÆV&VÆ÷rv–ÆÂW6RâF†RÖ&²—0¢òò$Te$5EôôdbFòöæR6–FRöbD„BÂæ÷Böb†W"fVWC¢F†RÖ÷fP¢òòFöW2æ÷B–ÒÂ—BF—7Æ6W2Âv†–6‚—2v†B¶VW2F†Rç7vW ¢òò÷6—F–öæÂ&F†W"F†â6ö–âfÆ—öâv†–6‚6–FR—B–6¶VBà¢F†—2æ&VæDF—"ÒÖF‚ç6–vâ†ÆVE‚‡‚ÂF†—2æ—¢ãR’Ò7‚’ÇÂF†—2æF—"ÇÂ°¢F†—2æ&5‚Ò7‚²F†—2æ&VæDF—"¢F†—2ç7B¢ƒ²F†—2æ—¢ã‚’¢$Te$5EôdÄ”t…C°¢6öç7BÖ²Ò&Vg&7DÖ&²‡F†—2ÂF†—2æ&5‚“°¢–b†Ö²’²F†—2æÖ&µ‚ÒÖ²çƒ²F†—2æÖ&µ’ÒÖ²ç“²F†—2æ&VæEBÒDTÄÅõ5t•S²Ð¢Ð¢F†—2ævF†W&VBÒG'VS²6g‚‡&¶RòwFVÆÆÖ–Br¢wFVÆÂr“°¢òò&÷F‚6†ææVÇ2v–ã¢7Æ6‚†÷W"7&÷V6†W2v—F‚—G2fVW@¢òòööÆ–ærv†—FRæB6†VFF–ærÖVÇBÂæB†—76W2VæFW"F†RFVÆÀ¢–b‡F†—2æ†4Ö÷fR‚w6Æw7Æ6‚r’’6g‚‚wfVçBr“°¢–b‡F†—2æÖ&µ‚ÒçVÆÂ’6g‚‚vÇVÖVâr“°¢F†—2æF—"ÒÖF‚ç6–vâ‡‚Ò7‚’ÇÂ°¢F†—2çBÒã°¢'&V³°¢Ð¢F†—2ævF†W&VBÒfÇ6S°¢F†—2çBÒ&æBƒãÒF†—2æ—¢ãBÂã’ÒF†—2æ—¢ãb“°¢òò&Vg&7B†÷W"ÆVfW2öâF†Ræ÷6RF†R–çBv2G&vâf÷"â—@¢òò—2†Æb6V6öæB6–æ6RF†R7÷Bv26†÷6VâæB6†RÖ’†fP¢òò7&÷76VB—B–âF†RÖVçF–ÖS²&RÖ–Ö–ær†W&Rv÷VÆB6VæBF†R&öG¢òòöæRv’æBÆVfRF†R&öÖ—6RÇ––æröâF†RfÆö÷"F†R÷F†W"à¢F†—2æF—"ÒF†—2æÖ&µ‚ÒçVÆÀ¢ò‡F†—2æ&VæDF—"ÇÂF†—2æF—"ÇÂ¢¢„ÖF‚ç6–vâ†ÆVE‚‡‚ÂF†—2æ—¢ãR’Ò7‚’ÇÂ“°¢F†—2çg’ÒÓSc²F†—2çg‚ÒF†—2æF—"¢F†—2ç7B¢ƒ²F†—2æ—¢ã‚“²F†—2çv4—"ÒG'VS°¢f6T6öÖÖ—B‡F†—2ÂF†—2æF—"“²òò—BÆVfW2æ÷6RÖf—'7BÂæWfW"F–ÂÖf—'7@¢òòF†R&2ÆVfW2„ôäU5B(	B6ÖRF¶RÖöfbÂ6ÖRæ÷6RÂ6ÖR7VVB(	@¢òòæBF†R6Æö6²F†Bv–ÆÂ&VæB—B7F'G2æ÷p¢F†—2æ&VæDBÒF†—2æÖ&µ‚ÒçVÆÂò$Te$5EôU‚¢°¢F†—2æ&VæEBÒ°¢6g‚‚v§V×r“°¢ÒVÇ6R–b‡F†—2æÖ&µ‚ÒçVÆÂbbF†—2çv4—"’°¢òòÔ$²•2$ôÔ•4R$õUB¥TÕâ–bF†R7&÷V6‚f–æ—6†VBæBF†P¢òòÆVæWfW"6ÖR(	B6†RvÆ¶VB÷WBöbF†R3ƒ&æBv†–ÆR—@¢òòvF†W&VB(	BF†R&öÖ—6R—2G&÷VB&F†W"F†âÆVgB'W&æ–æröâ¢òòfÆö÷"æ÷F†–ær—26öÖ–ærFòâFVÆVw&‚f÷"âGF6²F†B—0¢òòæ÷B†Væ–ærFV6†W2F†RÆ–W"Fò7F÷&VÆ–Wf–ærF†RfÆö÷"À¢òòv†–6‚6÷7G2Ö÷&RF†âF†RÖ÷fR—2v÷'F‚à¢F†—2æÖ&µ‚ÒçVÆÃ²F†—2æÖ&µ’ÒçVÆÃ²F†—2æ&VæDBÒ°¢Ð¢Ð¢'&V³°¢Ð¢òòD„R%$T´U"†¶–ævFöÒ"w2÷vâÖ6†–æR’6·3¢4â”õR$R•$$õ$äRôâ¢òò$TCò7VB'&V¶W"G'VÒ&öÇFVBFòF†R6öæGV—B&–Ââv†Vâ6†R—2–à¢òò—G2&æB—B6†&vW2f÷"DTÄÅõ5t•R(	Bf–ç2fÆ&RÂF†RÖ&W"&–ær&VG2(	@¢òòF†VâdTåE3¢6†&vRvfR7&vÇ2F†RfÆö÷"$õD‚v—2BvfR7VVBÀ¢òòæBF†RfÆö÷"VæFW"†W"fVWB—2'&–VfÇ’æ÷B†W'2âF†RvfR—2§V×V@¢òò†w&÷VæFVBÖöæÇ’FÖvR’Â÷WB×&ævVB†f–æ—FR&V6‚ÂF–W2BvÆÇ2æ@¢òòv2(	BVæÆW72—B—2¶–ævFöÒÔ"$UTDU"Âv†–6‚ÆF6†W2BF†RvÆÂæ@¢òò6öÖW2&6²Â6VRdôUôÔõdU5²w7W&vT"uÒ(	BæWfW"6Æ–Ö'2ÆVFvR’Â÷"æWfW ¢òòÖWBBÆÂ†&—BF†RfVçBæBvÆ²–â&V†–æB—C¢ã’2öb÷VâfVçG0¢òò—2GvòÖ†—Bv–æF÷rF†BFV×G2F‡&VR(	BF†Rw&VVB†—2ÂW"F†R6öÖ&@¢òò&Vv—7G'’ÂæBF†R&WVFW"—2v†BÖ¶W2&&V†–æB—B"&VBöb—G2÷và¢òò&F†W"F†âg&VR7V&R’â—B—2v†@¢òòF†R6öæGV—G2FV6‚&Vf÷&RDÄôä„õ5B6·2'v†W&R&R–÷R7FæF–æsò ¢òòf÷"¶VW2â¦öæW#²F‡&VB#²FVÆÂæWfW"6†÷'FVç2v—F‚—(	B7Vææ–æp¢òò'W—2f7FW"vfRæB6†÷'FW"&W7BÂæ÷B6†÷'FW"v&æ–ærà¢66Rw7W&vRs¢°¢F†—2çg’³Ò#¢GC²F†—2çg‚Ò°¢Ö÷fTVçB‡F†—2ÂGB“°¢F†—2æF—"Ò²òòöÖæ–F—&V7F–öæÃ¢æòÖ—6ÆVF–ærFVÆÂvVFvP¢òòF†RvfW2'VâöâF†V—"÷vâ6Æö6²öæ6RfVçFV@¢–b‡F†—2çvfW2bbF†—2çvfW2æÆVæwF‚’°¢f÷"†ÆWB’ÒF†—2çvfW2æÆVæwF‚Ò²’ãÒ²’ÒÒ’°¢6öç7BrÒF†—2çvfW5¶•Ó°¢òò´”ätDôÒ"(	BD„R$UTDU"u2ÄD4‚„dôUôÔõdU5²w7W&vT"uÒÂw&VÆ’r’à¢òò&VÆ–VBvfR7F÷2FVBBF†RvÆÂ—B&V6†VBæBfÆ&W2F†W&RÀ¢òò7FF–öæ'’æB„$ÔÄU52Âf÷"F†Rv†öÆRöb4ôäET•Eõ$TÄ•ô„ôÄ@¢òò&Vf÷&R—B'Vç2&6²âF†R&WGW&âG&—vWG2—G2÷vâFVÆVw&€¢òò&F†W"F†â'&—f–ær÷WBöb6÷&æW"6†R†BÇ&VG’6ÆV&VBà¢–b‡ræ†öÆBâ’°¢ræ†öÆBÓÒGC²rç‚³ÒGB¢Cc°¢–b‡ræ†öÆBÃÒ’²ræF—"Ò×ræF—#²ræÆ–fRÒræÆ–fSÇÂræÆ–fS²rç‚³ÒræF—"¢c²Ð¢6öçF–çVS°¢Ð¢rç‚³ÒræF—"¢rç7B¢GC²ræÆ–fRÓÒGC²rç‚³ÒGB¢3°¢6öç7BwG‚ÒÖF‚æfÆö÷"‡rç‚òD”ÄR“°¢6öç7B&–ÂÒ&–Å7W&f6U’‡rç‚Ârç’“²òòF†R&–Â—B&–FW0¢6öç7B'G’ÒÖF‚æfÆö÷"‚‚‡&–ÂÓÒçVÆÂòrç’¢&–Â’Ò’òD”ÄR“²òòF†R—"—BæVVG0¢6öç7B&Æö6¶VBÒ&–ÂÓÒçVÆÂÇÂ6öÆ–DB‡wG‚Â'G’“°¢òòââææBöæÇ’tTôÔUE%’6VæG2—B&6²âvfRF†B6–×Ç’&â÷WBö`¢òòÆ–fRF–W2v†W&R—BÇv—2F–VBÂ6òF†RÖ÷fRÆVæwF†Vç2F†R&V6‚ö`¢òò6Æ÷6VB&ööÒæB6†ævW2æ÷F†–ærBÆÂ–ââ÷VâöæRà¢–b†&Æö6¶VBbbrç&VÆ’â’°¢rç&VÆ’ÒÓ²rç‚ÓÒræF—"¢rç7B¢GC²ræ†öÆBÒ4ôäET•Eõ$TÄ•ô„ôÄC°¢6g‚‚wFVÆÂr“²6öçF–çVS°¢Ð¢–b‡ræÆ–fRÃÒÇÂ&Æö6¶VB’²F†—2çvfW2ç7Æ–6R†’Â“²6öçF–çVS²Ð¢rç’Ò&–Ã²òòââææB—B&–FW2—@¢òòw&÷VæFVBÖöæÇ“¢fVWBæV"F†R&–ÂÆ–æR—2F†R†—BÂ—"—2F†Rç7vW ¢–b‚Æ–W"æFVBbbÆ–W"æ•BÃÒ ¢bbÖF‚æ'2‡Æ–W"ç‚²Æ–W"çrò"Òrç‚’Â€¢bbÆ–W"ç’²Æ–W"æ‚ârç’Ò#bbbÆ–W"ç’²Æ–W"æ‚Ârç’²‚¢Æ–W"æ‡W'B„Db‚’æVFÖrÂrç‚Âw7W&vRçvfRr“°¢–b†6†æ6R†GB¢#"’’FE'B‡rç‚²&æB‚ÓRÂR’Ârç’Ò&æBƒ"ÂB’Â&æB‚Ó3Â3’Â&æB‚Ó“ÂÓ3’Âã#‚Âr6fcVcfBrÂ"Â3ÂG'VR“°¢Ð¢Ð¢–b‡F†—2çv–æFVEBâ’²òòdTåDTB(	BF†RVæ—6‚v–æF÷rƒã’2¢F†—2çv–æFVEBÓÒGC°¢'&V³°¢Ð¢–b‡F†—2æ7&÷V6…Bâ’²òòF†R6†&vR(	Bf–ç2WÂÖ&W"öà¢F†—2æ7&÷V6…BÓÒGC°¢–b‡F†—2æ7&÷V6…BÃÒ’°¢6öç7Bg’ÒF†—2ç’²F†—2æƒ°¢6öç7BÆ–fRÒÖF‚æÖ–âƒãRÂ3òÖF‚æÖ‚ƒÂF†—2ç7B’“°¢F†—2çvfW2ÒF†—2çvfW2ÇÂµÓ°¢f÷"†6öç7B2öb²ÓÂÒ¢òòÆ–fSæB&VÆ’&RF†R&WVFW"w3¢öæR&WGW&âÂBgVÆÂ&V6€¢F†—2çvfW2çW6‚‡²ƒ¢7‚²2¢‡F†—2çrò"²b’Â“¢g’ÂF—#¢2Â7C¢F†—2ç7BÀ¢Æ–fRÂÆ–fS¢Æ–fRÂƒ¢Â†öÆC¢Â&VÆ“¢F†—2æ†4Ö÷fR‚w&VÆ’r’ò¢Ò“°¢F†—2çv–æFVEBÒã“²òò÷Væ–æuö×2Ò“(‰"33¢Gvò†—G2ÂFV×G2F‡&VP¢6g‚‚w7–¶WWr“°¢Ð¢'&V³°¢Ð¢òò–FÆS¢ÆF6†VBÂ‡VÖÖ–ærÂvF6†–ær—G2&æ@¢–b‚Æ–W"æFVBbbÖF‚æ'2‡‚Ò7‚’Â#3bbÖF‚æ'2‡’Ò7’’Â“ ¢bb‡F†—2æF´4BÓÒGF6´GB’ÃÒ’°¢F†—2æ7&÷V6…BÒDTÄÅõ5t•S²òò¦öæRÔ"fÆö÷#¢F†RFVÆÂæWfW"6†÷'FVç0¢F†—2æF´4BÒ&æBƒ"ãBÒF†—2æ—¢ã‚Â2ãbÒF†—2æ—¢ã"“°¢6g‚‚wFVÆÂr“°¢Ð¢'&V³°¢Ð¢òòD„R´”ÄâdTåB†¶–ævFöÒ2w2÷vâÖ6†–æR’6·2eU$ä4R4„ô•"w2VW7F–öà¢òò¶–ævFöÒV&Ç“¢„TB%Tå2ôâ$TB(	BäB„õrÕT4‚ôbD„RT”UBt”ÄÀ¢òò”õR5TäB5DäD”är”â•E2ÄäSò7VB67F–ær÷BÇVÖ&VB–çFòF†P¢òòf÷VæG'’fÆö÷"âv†Vâ6†R—2–â—G2F6‚—B6†&vW2f÷"DTÄÅõ5t•R(	@¢òòF×W"WFÇ2†–ævR÷VâÂF†RÖ&W"&–ær&VG2(	BF†Vâ—B$Äõu3¢¢òò6öÇVÖâöbgW&æ6R†VB7FæG27G&–v‡BWöfbF†RÖ÷WF‚ÂæBF†R— ¢òò÷fW"F†RfVçB—2'&–VfÇ’æ÷B†W'2Âw&÷VæFVB÷"—&&÷&æRÆ–¶R‡F†P¢òò7W&vR÷vç2F†RfÆö÷#²F†R¶–Æâ÷vç2F†RÄäR(	BGvòF–ffW&VçBç7vW'2’à¢òòF†R6öÇVÖâ—26–FR×7FWVB†f–æ—FR†Æb×v–GF‚’Â÷WB×v—FVB†f–æ—FP¢òò'W&â’Â÷"æWfW"ÖWBBÆÂ†7&÷72öâF†R&VBw2V–WB’âF†VâF†R÷@¢òò—25TåC¢w&FW2fÆÂ÷Vâf÷"ã“R2(	Bv–æF÷rF†Bf—G2Gvò†—G0¢òòæBFV×G2F‡&VRÂv†–6‚—2W†7FÇ’F†Rw&VVB†—2—G2wV&F–âw0¢òòv†öÆRf–v‡B—2'V–ÇBöâ‡&Vv—7G'’*sC¢eU$ä4R4„ô•"Âw&VVBFW7B’à¢òò¦öæW#²F‡&VB#²F†RFVÆÂæWfW"6†÷'FVç2v—F‚—(	B7Vææ–ær'W—2¢òòFÆÆW"ÇVÖRæB6†÷'FW"&W7BÂæ÷B6†÷'FW"v&æ–ærà¢66Rv¶–Æâs¢°¢F†—2çg’³Ò#¢GC²F†—2çg‚Ò°¢Ö÷fTVçB‡F†—2ÂGB“°¢F†—2æF—"Ò²òòöÖæ–F—&V7F–öæÃ¢æòÖ—6ÆVF–ærFVÆÂvVFvP¢–b‚‡F†—2çÇVÖUBÇÂ’â’²òò$Äõt”är(	BF†RÆæR—26Æ÷6V@¢F†—2çÇVÖUBÓÒGC°¢F†—2çÇVÖT‚ÒÖF‚æÖ–â‡F†—2çÇVÖTÖ‚ÇÂSÂ‡F†—2çÇVÖT‚ÇÂ’²F†—2ç7B¢GB“°¢6öç7B×’ÒF†—2ç’²#²òòF†RÖ÷WFƒ¢F†R6öÇVÖâ7FæG2öâ—@¢–b‚Æ–W"æFVBbbÆ–W"æ•BÃÒ ¢bbÖF‚æ'2‡Æ–W"ç‚²Æ–W"çrò"Ò7‚’Â¢bbÆ–W"ç’²Æ–W"æ‚â×’ÒF†—2çÇVÖT‚bbÆ–W"ç’Â×’²b¢Æ–W"æ‡W'B„Db‚’æVFÖrÂ7‚Âv¶–ÆâçÇVÖRr“°¢–b†6†æ6R†GB¢#b’’FE'B†7‚²&æB‚Ó‚Â‚’Â×’Ò&æBƒÂF†—2çÇVÖT‚’À¢&æB‚Ó#BÂ#B’Â&æB‚ÓcÂÓc’Âã2Â6†æ6RƒãB’òr6ffC†r¢r6fcVcfBrÂ"ã"ÂÓƒÂG'VR“°¢òòõU"†¶–ævFöÒ2Â6÷7B2’(	BF†RFVW÷Bâ¶–ÆâF†B†2&VVâfV@¢òòF†—2ÆöærFöW2æ÷B6–×Ç’7F÷¢v†VâF†R6öÇVÖâF–W2F†R7'V6–&ÆP¢òòD•2ÂæB'VææVÂöbÖVÇB'Vç2÷WB÷fW"öæRÆ—æB6WG2öâF†P¢òòfÆö÷"&W6–FR—BâF†R7VçBv–æF÷r—2VçF÷V6†VB(	B7F–ÆÂã“R2À¢òò7F–ÆÂGvò†—G2æBF†RFV×FF–öâöbF‡&VR(	B'WB—Bæ÷r†2¢òò4”DRÂæBF†R6–FR—2F†RöæR6†Rv27FæF–æröâv†VâF†R6†&vP¢òò&VvââF†R÷B6ææ÷BÖ¶R†W"7F÷Væ—6†–ær—C²—B6âÖ¶R†W ¢òò7&÷72f—'7BÂv†–6‚—2F†Rf÷VæG'’w2v†öÆRÆW76öâ&÷WB7VæF–æp¢òòF†RV–WBÂ6†&vVBf÷"&VÂÖöæW’à¢–b‡F†—2çÇVÖUBÃÒbbF†—2æ†4Ö÷fR‚w÷W"r’’°¢6öç7B6–FRÒF†—2ç÷W%6–FRÇÂ°¢6ÆuööÂ†7‚²6–FR¢3ÂF†—2ç’²F†—2æ‚Ò"Â#"Â2ã“°¢6g‚‚wfVçBr“°¢Ð¢–b‡F†—2çÇVÖUBÃÒ’²F†—2çÇVÖT‚Ò²F†—2çv–æFVEBÒã“S²Ð¢'&V³°¢Ð¢–b‡F†—2çv–æFVEBâ’²òò5TåB(	BF†RVæ—6‚v–æF÷rƒã“R2¢F†—2çv–æFVEBÓÒGC°¢'&V³°¢Ð¢–b‡F†—2æ7&÷V6…Bâ’²òòF†R6†&vR(	BWFÇ2WÂÖ&W"öà¢F†—2æ7&÷V6…BÓÒGC°¢òòD„R4”DR•2DôÄBe$ôÒD„Rd•%5Be$ÔRôbD„R4„$tRæBæWfW ¢òò&Wf—6VBÂ6òF†R&VB—26†RöâF†RfÆö÷"f÷"F†Rv†öÆRö`¢òòDTÄÅõ5t•RÇW2F†Rv†öÆRã‚2öbF†R&Æ÷r(	Bã22öbv&æ–ærf÷ ¢òò†¦&BF†B'&—fW2gFW"ÆÂöb—Bâ6†ö÷6–ær—Böæ6R—2Ç6ð¢òòv†BÖ¶W2—Bf—#¢÷BF†B&RÖ–ÖVBv†–ÆR6†R7&÷76VBv÷VÆB&P¢òò†öÖ–ær†¦&Bv—F‚v–æB×WÂv†–6‚—2æ÷B&VBBÆÂà¢–b‡F†—2æ†4Ö÷fR‚w÷W"r’’VÖ&W%FVÆÂ†7‚²‡F†—2ç÷W%6–FRÇÂ’¢’ÂF†—2ç’²BÂ3ÂGB“°¢–b‡F†—2æ7&÷V6…BÃÒ’°¢F†—2çÇVÖUBÒãƒ²F†—2çÇVÖT‚Ò°¢òò7Vææ–ær'W—2$T4ƒ¢FÆÆW"6öÇVÖâV6‚—7FWÂæWfW"ÆW72v&æ–æp¢F†—2çÇVÖTÖ‚ÒC²F†—2æ—¢s°¢6g‚‚wÇVÖRr“°¢Ð¢'&V³°¢Ð¢òò–FÆS¢ÇVÖ&VB–âÂ'&VF†–ærVÖ&W'2ÂvF6†–ær—G2F6‚(	BF†R&æ@¢òò&V6†W2UÂ&V6W6RF†RÆæR—B6Æ÷6W2FöW0¢–b‚Æ–W"æFVBbbÖF‚æ'2‡‚Ò7‚’Â#bb’â7’Ò“bb’Â7’²s ¢bb‡F†—2æF´4BÓÒGF6´GB’ÃÒ’°¢F†—2æ7&÷V6…BÒDTÄÅõ5t•S²òòF†R¶–ævFöÒfÆö÷#¢F†RFVÆÂæWfW"6†÷'FVç0¢F†—2æF´4BÒ&æBƒ"ã"ÒF†—2æ—¢ãrÂ2ãBÒF†—2æ—¢ã“°¢6g‚‚wFVÆÂr“°¢òò—BF—2F÷v&BF†R6–FR6†R—2öâ(	BF†R7Vææ–ær—2F†B—BFVæ–W0¢òòF†Rw&÷VæB6†RÇ&VG’6†÷6RÂæ÷BF†B—B'&—fW2Væææ÷Væ6V@¢–b‡F†—2æ†4Ö÷fR‚w÷W"r’’²F†—2ç÷W%6–FRÒÖF‚ç6–vâ‡‚Ò7‚’ÇÂ²6g‚‚wfVçBr“²Ð¢Ð¢'&V³°¢Ð¢òòD„R$”ÔR4ô”Â†¶–ævFöÒBw2÷vâÖ6†–æR’6·2tÄ4”U$Rw2VW7F–öâ¢òò¶–ævFöÒV&Ç“¢D„R4ôÄB4Äõ4U224•$4ÄRÂäB¥TÕ”är•2äõBà¢òòå5tU"Dò$D•U2(	BD•5Dä4R•2âv—7FVB6öæFVç6W"&ö&&–â&öÇFV@¢òò–çFòF†R&6†—fW2fÆö÷"âv†Vâ6†R—2–â—G2F6‚—B6†&vW2f÷ ¢òòDTÄÅô„Te’(	BF†Rg&÷7B7&÷vâW‡FVæG2ÂF†RÖ&W"&–ær&VG2(	BæBF†P¢òòv†öÆRFVÆÂ—25TåBu$õt”ärD„R$õTäD%“¢g&÷7B&–ær7vVÆÇ2g&öÐ¢òòF†R6ö–ÂFòFöÆBVFvRæB†öÆG2F†W&RÂ6òF†R&VB—26†Röà¢òòF†Rw&÷VæBÂæ÷BF–ÖW"–â†W"†VBâF†Vâ—B4ä3¢WfW'—F†–æp¢òò–ç6–FRF†R6—&6ÆRBF†B–ç7FçB—2†—BÂw&÷VæFVB÷"—&&÷&æRÆ–¶P¢òò‡F†R7W&vR÷vç2F†RfÆö÷"ÂF†R¶–Æâ÷vç2F†RÆæRÂF†R&–ÖR÷vç2F†P¢òò$D•U2(	BF‡&VRÖ6†–æW2ÂF‡&VRF–ffW&VçBç7vW'2’âöâ–6RÂv†W&RF†P¢òò&6†—fW2Ç&VG’f÷&&–B7F÷–ærÂÆVf–ær6—&6ÆR—26öÖÖ—FÖVç@¢òòÖFRT$Å’(	Bv†–6‚—2W†7FÇ’F†R&VBtÄ4”U$Rw2%4ôÅUDR¤U$ð¢òò‡W6‚FVÖæG2f÷"¶VW2‚&&R÷WG6–FR—Bv†VâF†R6–ÆVæ6RÆæG2"’à¢òòF†Vâ—B—2D$³¢F†R6÷&RF–W2f÷"ã2(	Bv–æF÷rF†Bf—G2Gvð¢òò†—G2æBFV×G2F‡&VRâ¦öæW#²F‡&VB#²F†RFVÆÂæWfW"6†÷'FVç2v—F€¢òò—(	B7Vææ–ær'W—2v–FW"6—&6ÆRæB6†÷'FW"&W7BÂæWfW"6†÷'FW ¢òòv&æ–æs²DTÄÅô„Te’Âæ÷BDTÄÅõ5t•RÂ&V6W6RF†Rç7vW"6÷7G0¢òòw&÷VæBæBF†Rv&æ–ær†2Fò’f÷"F†Rw&÷VæB—B6÷7G2à¢66Rw&–ÖRs¢°¢F†—2çg’³Ò#¢GC²F†—2çg‚Ò°¢Ö÷fTVçB‡F†—2ÂGB“°¢F†—2æF—"Ò²òòöÖæ–F—&V7F–öæÃ¢æòÖ—6ÆVF–ærFVÆÂvVFvP¢–b‚‡F†—2ç6æBÇÂ’â’F†—2ç6æBÓÒGC²òòF†RfÆ6‚FV6—2öâ—G2÷và¢òò$T4ÄÂæBU$5U$R&R7FWVB„U$RÂ&÷fRWfW'’7FFR'&æ6‚Âæ@¢òòF†BÆ6VÖVçB—2F†RFW6–vââf–ÆVB&V6÷&B—2æ÷BF†R6ö–Âw0¢òòGF6²(	B—B—2&V6÷&B(	B6ò—B¶VW2—G2÷vâ6Æö6²v†–ÆRF†R6ö–À¢òò6†&vW2Âv†–ÆRF†R6ö–Â—2D$²ÂæBv†–ÆR6†R—2†—GF–ærF†R6ö–À¢òò–âF†Rv–æF÷rF†RF&²6÷&R÷Vç2âVæ—6†–ærF†RÖ6†–æRæ@¢òòç7vW&–ærv†BF†RÖ6†–æRÇ&VG’f–ÆVB&RGvòFV6—6–öç2æ÷rÂæ@¢òòöâfÆö÷"6†R6ææ÷B7F÷öâF†W’&RÖFRv—F‚†W"fVWBà¢&Æ÷E7FW‡F†—2ÂGB“²òòU$5U$Rw27G'V6²Ö÷WBfÆö÷ ¢&–ÖT6&E7FW‡F†—2ÂGB“²òò$T4ÄÂw2f–ÆVB6&@¢–b‡F†—2çv–æFVEBâ’²òòD$²(	BF†RVæ—6‚v–æF÷rƒã2¢F†—2çv–æFVEBÓÒGC°¢'&V³°¢Ð¢–b‡F†—2æ7&÷V6…Bâ’²òòF†R6†&vR(	B7&÷vâWÂ&÷VæF'’w&÷v–æp¢F†—2æ7&÷V6…BÓÒGC°¢F†—2ç&–æu"ÒÖF‚æÖ–â‡F†—2ç&–ætÖ‚ÇÂ#Â‡F†—2ç&–æu"ÇÂ’²F†—2ç7B¢GB“°¢–b‡F†—2æ7&÷V6…BÃÒ’°¢òòD„R4ä¢öæR–ç7FçBÂöæR6—&6ÆR(	B–ç6–FR—2†—BÂ÷WG6–FR—2æ÷@¢6öç7B"ÒF†—2ç&–æu"ÇÂ°¢6öç7BFG‚ÒÆ–W"ç‚²Æ–W"çrò"Ò7‚ÂFG’ÒÆ–W"ç’²Æ–W"æ‚ò"Ò7“°¢–b‚Æ–W"æFVBbbÆ–W"æ•BÃÒbbFG‚¢FG‚²FG’¢FG’Â"¢"¢Æ–W"æ‡W'B„Db‚’æVFÖrÂ7‚Âw&–ÖRç6ær“°¢òòF†R6—&6ÆRw2FVF‚—2G&vâv†W&R—G2VFvRt2Â6òF†RÖ—70¢òòFV6†W22vVÆÂ2F†R†—@¢F†—2ç6æ"Ò#²F†—2ç6æBÒã##°¢f÷"†ÆWB’Ò²’ÂC²’²²’°¢6öç7BÒ’òB¢bã#ƒ2²&æB‚ÓãÂã“°¢FE'B†7‚²ÖF‚æ6÷2†’¢"Â7’²ÖF‚ç6–â†’¢"À¢ÖF‚æ6÷2†’¢&æBƒ#Âc’Â×&æBƒ#Â“’Âã3RÂ’R2òr6†SFcBr¢r6Sff&fbrÂ"ÂcÂG'VR“°¢Ð¢F†—2ç&–æu"Ò°¢F†—2çv–æFVEBÒã²òò÷Væ–æuö×2Ò(‰"33¢Gvò†—G2ÂFV×G2F‡&VP¢6g‚‚v67F–6Rr“°¢òò$T4ÄÂâF†R6&B†2&VVâ7FæF–æröâF†RfÆö÷"f÷"F†Rv†öÆP¢òò6†&vS²F†R6æ—2v†B$Õ2—Bâg&öÒ†W&R—Bw&÷w2—G2÷và¢òò6—&6ÆR÷fW"6V6öæBgVÆÂ4$EõDTÄÂÂ6òF†Rw&÷VæB6†R§W7@¢òòÆVgB—2FöÆBGv–6R&Vf÷&R—B—2WfW"&VÂà¢–b‡F†—2æ6&B’²F†—2æ6&BçBÒ4$EõDTÄÃ²F†—2æ6&Bæ&ÖVBÒ²6g‚‚w6†&Br“²Ð¢Ð¢'&V³°¢Ð¢òò–FÆS¢&öÇFVB–âÂ'&VF†–ær6öÆBÂvF6†–ær—G2F6‚(	BF†R&æB—0¢òòÆ—GFÆRv–FW"F†âF†Rv–FW7B6—&6ÆRÂ6òF†Rf—'7B&VB—2g&VP¢–b‚Æ–W"æFVBbbÖF‚æ'2‡‚Ò7‚’Â#CbbÖF‚æ'2‡’Ò7’’ÂS ¢bb‡F†—2æF´4BÓÒGF6´GB’ÃÒ’°¢F†—2æ7&÷V6…BÒDTÄÅô„Te“²òòF†R¶–ævFöÒfÆö÷#¢F†RFVÆÂæWfW"6†÷'FVç0¢F†—2ç&–æu"Ò°¢òò7Vææ–ær'W—2$T4ƒ¢v–FW"6—&6ÆRV6‚—7FWÂæWfW"ÆW72v&æ–æp¢F†—2ç&–ætÖ‚ÒB²F†—2æ—¢Cƒ°¢F†—2æF´4BÒ&æBƒ"ãbÒF†—2æ—¢ã‚Â2ã‚ÒF†—2æ—¢ã"“°¢6g‚‚wFVÆÂr“°¢òò$T4ÄÂd”ÄU2D„Ru$õTäB4„R•25DäD”ärôâÂBF†R–ç7FçBF†P¢òò6ö–Â&Vv–ç2Fò6†&vR(	Bæ÷BBF†R6æâF†R6&B—2ÆçFVBæ@¢òòf—6–&ÆRg&öÒF†—2g&ÖRÂ6ò—B—2æWfW"–æf÷&ÖF–öâ6†R—0¢òòFVæ–VC¢F†R6—&6ÆR6—2ÄTdRæBF†R6&B6—2t„U$R”õRÄTdP¢òòe$ôÒ•2ôâ$T4õ$BâöæR6&BBF–ÖS²6ö–Â–çFW''WFVB&Vf÷&P¢òò—G26æ6–×Ç’¶VW2F†RöæR—Bf–ÆVBà¢–b‡F†—2æ†4Ö÷fR‚w&V6ÆÂr’bbF†—2æ6&BbbÆ–W"æFVB’°¢F†—2æ6&BÒ²ƒ¢‚Â“¢’Âg“¢Æ–W"ç’²Æ–W"æ‚Âöã¢Æ–W"æöâÀ¢#¢ÂÖƒ¢F†—2ç&–ætÖ‚¢4$Eõ"ÂC¢Â&ÖVC¢Ó°¢6g‚‚wV’r“°¢Ð¢Ð¢'&V³°¢Ð¢òòD„RäU5B4ä$R†¶–ævFöÒRw2÷vâÖ6†–æR’6·2ÔõD„U"Õbw2VW7F–öâ¢òò¶–ævFöÒV&Ç’(	BF†RöæÇ’VW7F–öâ–âF†RvÖRF†RçVÆÂ6÷&R6·0¢òòv—F‚†W"÷vâ†æG3¢D„RäU5BDôU2äõB5E$”´R”õRÂ•BE$u2”õR”âÀ¢òòäB5DäD”är”õU"u$õTäB•2DT4•4”ôâ”õRÔ´Rt•D‚”õU"dTUBâ¢òòF†÷&æVBöÇ—&ö÷FVBv†W&R—Bw&Wrâv†Vâ6†R—2–â—G2F6‚—@¢òò6†&vW2f÷"DTÄÅô„Te’(	BF†RÖrÆVç2÷VâÂFVæG&–Â&72õU@¢òòF÷v&B†W"æB†÷fW'2ÂF†RÖ&W"&–ær&VG2(	BæBF†Rv†öÆRFVÆÂ—0¢òò7VçB6†÷v–ærF†RÆ–æR—BvçG2Fò6Æ÷6RâF†Vâ—BÄD4„U3¢–b6†R—0¢òò–ç6–FRF†RFöÆB&V6‚BF†B–ç7FçBF†R&VVÂ&Vv–ç2(	Bã’2ö`¢òò7FVG’†÷&—¦öçFÂG&rF÷v&BF†RF†÷&æVB6÷&RÂw&÷VæFVB÷"—&&÷&æP¢òòÆ–¶R‡F†R7W&vR÷vç2F†RfÆö÷"ÂF†R¶–Æâ÷vç2F†RÆæRÂF†R&–ÖP¢òò÷vç2F†R&F—W2ÂF†R6æ&R÷vç2F†RÄ”äRôbTÄÂ(	Bf÷W"Ö6†–æW2À¢òòf÷W"F–ffW&VçBç7vW'2’âæBVæÆ–¶R—G2F‡&VR6–&Æ–æw2F†Rf–ÇW&P¢òò—2$T4õdU$$ÄRÂv†–6‚—2F†R7GVÂÆW76öã¢'Vâv–ç7BF†R&VVÀ¢òòæBF†RÖöÖVçBF†RÆ–æR—2÷fW'7G&WF6†VB—B6æ2(	BW†7FÇ’F†P¢òò&VBÔõD„U"Õbw2FVæG&–Âw&"FVÖæG2f÷"¶VW2‚&'&V²Æ–æRÖöb×VÆÀ¢òò'’Ö÷f–ær"’âÆF6‚F†Bf–æG2æö&öG’–ç6–FRF†R&V6‚v†–fg2Âæ@¢òòF†Rv†–fb—2F†R6ÖR2F†R6æâF†VâF†RFVæG&–Â†æw2Ä”Õ ¢òòf÷"ã2(	Bv–æF÷rF†Bf—G2Gvò†—G2æBFV×G2F‡&VRà¢òòF—7'WF÷#²F‡&VB#²F†RFVÆÂæWfW"6†÷'FVç2v—F‚—(	B7Vææ–ær'W—0¢òòÆöævW"&V6‚æB†&FW"w&—ÂæWfW"6†÷'FW"v&æ–æs°¢òòDTÄÅô„Te’Âæ÷BDTÄÅõ5t•RÂ&V6W6RF†Rç7vW"6÷7G2w&÷VæBæBF†P¢òòv&æ–ær†2Fò’f÷"F†Rw&÷VæB—B6÷7G2à¢66Rw6æ&Rs¢°¢F†—2çg’³Ò#¢GC²F†—2çg‚Ò°¢Ö÷fTVçB‡F†—2ÂGB“°¢F†—2æF—"Ò²òòöÖæ–F—&V7F–öæÃ¢æòÖ—6ÆVF–ærFVÆÂvVFvP¢–b‡F†—2çv–æFVEBâ’²òòÄ”Õ(	BF†RVæ—6‚v–æF÷rƒã2¢F†—2çv–æFVEBÓÒGC°¢òòD„RäU5BDôU2äõB´”ÄÂD„RÔ4„”äRÂ•B$T5%T•E2•B†Ö÷fR–æfW7FÀ¢òò6æ&TR’âF†RÆ–×&VB6†RV&æVB—2F†R&VBF†RöÇ—7VæG0¢òò4ÄÄ”äs¢7÷&R627vVÆÇ2öâF†R6Æ6²Örf÷"F†Rv†öÆRv–æF÷p¢òòæBÂ–b—B—2ÆÆ÷vVBFòf–æ—6‚Â6VVG2æ÷F†W"Ö6†–æR–âF†R&ööÐ¢òò(	BæB6'&–W"'W'7G2–çFò7÷&R&VBv†W&R—BF–W2âöæR†—Böà¢òòF†R6æ&R÷2F†R62Â6òF†Rv–æF÷r—2W†7FÇ’v†B—BÇv—0¢òò–C²—B†2öæÇ’7F÷VB&V–ærv–æF÷r6†R6â7VæBvÆ¶–æp¢òòv’âF†RÖ÷7BFVÖæF–ærÖ÷fR–âF†RvÖRæBF†R&V6öâ6÷7BÓ0¢òò&÷rW†—7G3¢—BGW&ç2´”ÄÂõ$DU"–çFòFV6—6–öâÂ–âF†RöæP¢òò¶–ævFöÒv†W&RWfW'’÷F†W"FV6—6–öâ†2Ç&VG’&VVâ6¶VBà¢–b‡F†—2æ†4Ö÷fR‚v–æfW7Br’’–æfW7E7FW‡F†—2ÂGB“°¢'&V³°¢Ð¢–b‚‡F†—2ç&VVÅBÇÂ’â’²òòÄD4„TB(	BF†RÆ–æR—26Æ÷6–æp¢F†—2ç&VVÅBÓÒGC°¢6öç7B&G‚Ò‚Ò7‚Â&G’Ò’Ò7“°¢6öç7B&BÒÖF‚æ‡—÷B‡&G‚Â&G’’ÇÂ°¢–b‡&Bâ‡F†—2ç&V6…"ÇÂS’¢ãB’°¢òò4„R%$ô´R•C¢'Vææ–ærv–ç7BF†R&VVÂ÷fW'7G&WF6†VBF†RÆ–æRà¢òòF†R6÷'&V7Bç7vW"—2&Wv&FVBv—F‚F†R6ÖRÆ–×v–æF÷rF†P¢òòF–ÖW"v÷VÆB†fR–BÂ6òf–v‡F–ærg&VR—2æWfW"v÷'6RF†à¢òòv—F–ær÷WBF†RG&rà¢F†—2ç&VVÅBÒ°¢'W'7B†ÆW'†7‚Â‚ÂãR’ÂÆW'†7’Â’ÂãR’Â‚Âr6fc––rÂƒÂã2ÂcÂ"ÂG'VR“°¢ÒVÇ6R–b‚Æ–W"æFVB’°¢òòF†R&VVÂ—2†÷&—¦öçFÂÂÆ–¶RF†RwV&F–âw2÷vâw&#¢§V×–æp¢òòFöW2æ÷Bç7vW"VÆÂÂÖ÷F–öâv–ç7B—BFöW0¢Æ–W"çg‚³Ò„ÖF‚ç6–vâ†7‚Ò‚’ÇÂ’¢‡F†—2çVÆÂÇÂF†—2ç7B’¢GC°¢–b†6†æ6RƒãR’’FE'B†ÆW'†7‚Â‚Â&æBƒã"Âã’’’ÂÆW'†7’Â’Â&æBƒã"Âã’’’À¢&æB‚Ó#BÂ#B’Â&æB‚Ó#BÂ#B’Âã"Âr6fcFCFBrÂã‚ÂÂG'VR“°¢Ð¢–b‡F†—2ç&VVÅBÃÒ’²F†—2çv–æFVEBÒã²F†—2ç65BÒçVÆÃ²6g‚‚w6æ&V67Br“²Ð¢'&V³°¢Ð¢–b‡F†—2æ7&÷V6…Bâ’²òòF†R&V6‚(	BFVæG&–Â÷WBÂ†÷fW&–æp¢F†—2æ7&÷V6…BÓÒGC°¢–b‡F†—2æ7&÷V6…BÃÒ’°¢6öç7BÆG‚Ò‚Ò7‚ÂÆG’Ò’Ò7“°¢6öç7B"ÒF†—2ç&V6…"ÇÂS°¢–b‚Æ–W"æFVBbbÆG‚¢ÆG‚²ÆG’¢ÆG’Â"¢"’°¢F†—2ç&VVÅBÒã“²6g‚‚vF6‚r“²òòD„RÄD4€¢ÒVÇ6R°¢òòF†Rv†–fbFV6†W22vVÆÂ2F†R†—C¢F†RFVæG&–Â6Æ÷6W2öà¢òòæ÷F†–æræBF†RöÇ——2F†RgVÆÂÆ–×v–æF÷rf÷"—@¢F†—2çv–æFVEBÒã²F†—2ç65BÒçVÆÃ²6g‚‚w6æ&V67Br“°¢Ð¢Ð¢'&V³°¢Ð¢òò–FÆS¢&ö÷FVBÂVÇ6–æröâF†R'&öF67BÂvF6†–ær—G2F6‚(	BF†P¢òò&æB—2Æ—GFÆRv–FW"F†âF†RÆöævW7B&V6‚Â6òF†Rf—'7B&V@¢òò—2g&VP¢–b‚Æ–W"æFVBbbÖF‚æ'2‡‚Ò7‚’Â#SbbÖF‚æ'2‡’Ò7’’Â3 ¢bb‡F†—2æF´4BÓÒGF6´GB’ÃÒ’°¢F†—2æ7&÷V6…BÒDTÄÅô„Te“²òòF†R¶–ævFöÒfÆö÷#¢F†RFVÆÂæWfW"6†÷'FVç0¢òò7Vææ–ær'W—2$T4‚æBu$•¢ÆöævW"Æ–æRæB†&FW"VÆÀ¢òòV6‚—7FWÂæWfW"ÆW72v&æ–ær†æBæWfW"7BF†RwV&F–âw0¢òò÷vâS(	BF†RÖ–æ–öâ×W7B7F’F†RÆW76öâÂæ÷BF†RW†Ò¢F†—2ç&V6…"ÒS²F†—2æ—¢s°¢F†—2çVÆÂÒF†—2ç7B¢ƒã’²F†—2æ—¢ã3R“°¢F†—2æF´4BÒ&æBƒ"ãbÒF†—2æ—¢ã‚Â2ã‚ÒF†—2æ—¢ã"“°¢6g‚‚wFVÆÂr“°¢Ð¢'&V³°¢Ð¢Ð¢òò7–¶W2&R7–¶W2f÷"WfW'–öæS¢Ö6†–æRF†BÆæG2–âF†R—BF–W0¢òò–â—B(	Bæò7&VGW&R6×2v†W&RF†RÆ–W"6ææ÷B7Fæ@¢–b†öå7–¶R‡F†—2’’²F†—2åöVçdFVF‚Ò²F†—2æF–RƒÂÓãB“²&WGW&ã²Ð¢òòD„RuT$Bu2ÅTätR•2D„Rd•%5B%%”$ÄR$ÄõrÄ”U"ÔTUE3¢g&öÒF†P¢òòÆ7B%%•ôÄTBöbF†R6ö–ÂF‡&÷Vv‚F†R6öÖÖ—BÂ—BvV'2F†RvÆ–ç@¢òò†G&u''•FVÆÇ2’ÂæB'&6R&—6VB–âF–ÖRGW&ç2—B†§2÷''’æ§2¢F†—2ç''–&ÆRÒF†—2æ¶–æBÓÓÒvwV&BrbbF†—2çÆFU6†V@¢bb‡F†—2æÇVævUBâÇÂ‡F†—2æ6ö–ÅBâbbF†—2æ6ö–ÅBÃÒ%%•ôÄTB’“°¢òòF÷V6‚FÖvP¢6öç7B6vT6öçF7C×G—Vöb6vTGVVÄ7F—fSÓÓÒvgVæ7F–öârbg6vTGVVÄ7F—fR‡F†—2“°¢–b‚Æ–W"æFVBbb&"‡F†—2ÂÆ–W"’bb‚6vT6öçF7GÇÇ6vTGVVÄ6öçF7B‡F†—2’’¢Æ–W"æ‡W'B„Db‚’æVFÖrÆ7‚Ç6vT6öçF7Còw6vRæÇVævRs§VæFVf–æVBÇF†—2“°¢Ð¢òòdôÄD”ÄS¢—BF¶W2F†R&ööÒv—F‚—BâFVÆVw&†VB'’—G2÷vâ6öÆ÷W"öâF†P¢òò&öG’æB'’&VBöbv&æ–ærÆ–v‡BÂ6ò—B—2F†–ær–÷R7FWv’g&öÐ¢òò&F†W"F†âF†–ærF†B†Vç2Fò–÷Rà¢F–R†·‚Â·’’°¢–b‡7F÷'•&÷FV7FVB‡F†—2’’&WGW&ã°¢òòââææBöæÇ’„U"&Æ÷r&–æG2öæR†÷væW"Â##bÓÓc¢'F†—2'F–7VÆ"öæP¢òò’F–Bæ÷B7GVÆÇ’†—BÂ6òv‡’—2—B7F––ær7F–ÆÂ2–b—Bv0¢òòFVfVFVCò"’â&öG’F†BvÆ¶VB–çFò—BÂöçFò7–¶W2÷"öfbF†R&÷GFöÐ¢òòöbF†R&ööÒv26fVB2&÷VæBÆÂF†R6ÖRÂæBg&öÒF†Vâöâ7FööB@¢òò—G27vâö–çBöâWfW'’f—6—Bv—F–ærf÷"&ÆFR—B†BæWfW"V&æVBà¢òòF†R&ööÒF¶W2—B–ç7FVC¢—B—2vöæRf÷"F†—2f—6—BÂVç&V6÷&FVBÂæ@¢òòv¶W22—G6VÆbF†RæW‡BF–ÖR6†R6öÖW2F‡&÷Vv‚à¢–b‡F†—2ç7F÷'”¶W’bbF†—2æ7F÷%&öÆRÓÓÒv–æfV7FVB×W'6öârbbF†—2åöVçdFVF‚’°¢F†—2æFVBÒG'VS²F†—2çg‚ÒF†—2çg’Ò²F†—2çG"æÆVæwF‚Ò°¢'W'7B‡F†—2ç‚²F†—2çrò"ÂF†—2ç’²F†—2æ‚ò"Â‚Âr3††“brÂcÂãBÂ3Â"ãRÂG'VR“°¢&WGW&ã°¢Ð¢–b‡F†—2ç7F÷'”¶W’bbF†—2æ7F÷%&öÆRÓÓÒv–æfV7FVB×W'6öâr’°¢F†—2æF—6&ÆVBÒG'VS²F†—2æ‡Ò²F†—2çg‚ÒF†—2çg’Ò°¢F†—2æ6ÆVç6UBÒ²F†—2çG"æÆVæwF‚Ò°¢„rç6fRç&W67VW2ÇÂ„rç6fRç&W67VW2Ò·Ò’•·F†—2ç7F÷'”¶W•ÒÒvF—6&ÆVBs°¢W'6—7B‚“°¢&WGW&ã°¢Ð¢òò4%$”U"DôU2äõBD”RT”UDÅ’†Ö÷fR–æfW7FÂ6æ&TR’âv†BF†RæW7@¢òòWB–â—B6öÖW2&6²÷WB27÷&R&VBöâF†Rw&÷VæB—BfVÆÂöâ(	BF†P¢òò&Æö"w2÷vâööÂÂ&V6W6R'F†RfÆö÷"—2†÷7F–ÆR†W&R"Ç&VG’†2¢òòfö6'VÆ'’–âF†—2vÖRæB6V6öæBöæRf÷"F†R6ÖRÖVæ–ær—2†÷r¢òò&ööÒ7F÷2&V–ær&VF&ÆRâF†RööÂ÷Vç2g&öÒ&F—W2öb¤U$òæ@¢òò7&VG2Âv†–6‚—2F†RFVÆVw&ƒ¢F†R'W'7Bææ÷Væ6W2—BæBF†Rw&÷Væ@¢òò—2æ÷BFævW&÷W2–WBv†Vâ—BFöW2â¶–ÆÆ–ærF†R6'&–W"—27F–ÆÂ&–v‡B(	@¢òò—B§W7BFV6–FW2t„U$R6†R6ææ÷B7FæBæW‡BÂv†–6‚—2F†Rv†öÆR&V6öà¢òòF†RÖ&¶–ær—2–çFVBöâF†R&öG’g&öÒF†RÖöÖVçB—B—26VVFVBà¢–b‡F†—2æ–æfW7FVBbbF†—2æFVBbbF†—2ç7÷&T'W'7B’°¢F†—2ç7÷&T'W'7BÒ°¢6öç7B7‚ÒF†—2ç‚²F†—2çrò"Â7’ÒF†—2ç’²F†—2æ‚Ò#°¢rçööÇ2ÒrçööÇ2ÇÂµÓ°¢–b„rçööÇ2æÆVæwF‚ÂB’rçööÇ2çW6‚‡²ƒ¢7‚Â“¢7’ÂC¢Bã"ÂC¢Bã"Â#¢Ò“°¢'W'7B‡7‚Â7’ÒbÂ#Âr3–fff‚rÂ#ƒÂãSRÂCÂ2ÂG'VR“°¢–b‡G—Vöb6g‚ÓÓÒvgVæ7F–öâr’6g‚‚w6æ&V67Br“°¢Ð¢–b‡F†—2çG&—G2bbF†—2çG&—G2æ–æFW„öb‚wföÆF–ÆRr’ãÒbbF†—2æFVBbbF†—2ç÷VB’°¢F†—2ç÷VBÒG'VS°¢6öç7B'‚ÒF†—2ç‚²F†—2çrò"Â'’ÒF†—2ç’²F†—2æ‚ò#°¢rçööÇ2ÒrçööÇ2ÇÂµÓ°¢'W'7B†'‚Â'’Â#"ÂE$•E2çföÆF–ÆRæ6öÂÂ3#ÂãSRÂ“Â2ã"ÂG'VR“°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂR“°¢–b‡G—Vöb6g‚ÓÓÒvgVæ7F–öâr’6g‚‚v&Æ7Br“°¢–b‚Æ–W"æFVBbbÆ–W"æ•BÃÒ ¢bbÖF‚æ‡—÷B‡Æ–W"ç‚²Æ–W"çrò"Ò'‚ÂÆ–W"ç’²Æ–W"æ‚ò"Ò'’’ÂsB¢Æ–W"æ‡W'B„Db‚’æVFÖrÂ'‚ÂF†—2æ¶–æB²rçföÆF–ÆRr“°¢Ð¢&WGW&âF†—2åöF–S†·‚Â·’“°¢Ð¢f–æ—6„6ÆVç6R‚’°¢–b‚F†—2æF—6&ÆVBÇÂF†—2ç7F÷'”¶W’ÇÂrç6fRæfÆw2æ7'—7FÂ’&WGW&ã°¢6öç7B7FFW2Òrç6fRç&W67VW2ÇÂ„rç6fRç&W67VW2Ò·Ò“°¢–b‡7FFW5·F†—2ç7F÷'”¶W•ÒÓÓÒw&W67VVBr’&WGW&ã°¢7FFW5·F†—2ç7F÷'”¶W•ÒÒw&W67VVBs°¢F†—2æF—6&ÆVBÒfÇ6S²F†—2ç&W67VVBÒG'VS²F†—2æ6ÆÒÒG'VS°¢F†—2æ‡ÒT´”äE·F†—2æ¶–æEÒæ‡²F†—2æ‡—æõBÒS“²F†—2æ6ÆVç6UBÒ°¢–b‡G—VöbVW7D¶–ÆÂÓÓÒvgVæ7F–öâr’VW7D¶–ÆÂ‡F†—2æ¶–æB“°¢&æµ67&ƒ‚“²Æ–W"æv–åföÇG2ƒ"“°¢'W'7B‡F†—2ç‚²F†—2çrò"ÂF†—2ç’Â‚Âr3–fVffbrÂsÂãRÂÓRÂ"ÂG'VR“°¢–b‡G—Vöb6ÆVç6T&Vv–âÓÓÒvgVæ7F–öâr’6ÆVç6T&Vv–â‡F†—2ç‚ÂF†—2ç’ÂF†—2çrÂF†—2æ‚Âwuög&VVBrÂçVÆÂÂG'VR“°¢VÇ6R6g‚‚w–6²r“°¢rçFö7B‡B‚w7F÷'•÷&W67VVBr’“²W'6—7B‚“°¢Ð¢öF–S†·‚Â·’’°¢–b‡F†—2æFVB’&WGW&ã°¢–b‡F†—2çÆFR’F†—2ç6†V"‚“²òò¶–ÆÆVBÖ–BÖÇVævS¢F†RÆFRfÆÇ0¢F†—2æFVBÒG'VS°¢òò†W"f—'7B¶–ÆÂ†vÖRæ§2EUEõ5DU2v6Ærr“¢F†R7FW—2F†—2ÂæB—B—0¢òòw&—GFVâF÷vâF†Rg&ÖR—B†Vç26ò&VÆöB6ææ÷B6²f÷"—BGv–6P¢–b‡F†—2æf—'7DföRbbrç6fRbbrç6fRæfÆw2bbrç6fRæfÆw2æf—'7D¶–ÆÂ’²rç6fRæfÆw2æf—'7D¶–ÆÂÒ²–b‡G—VöbW'6—7BÓÓÒvgVæ7F–öâr’W'6—7B‚“²Ð¢6öç7B7‚ÒF†—2ç‚²F†—2çrò"Â7’ÒF†—2ç’²F†—2æ‚ò#°¢6g‚‚vVF–Rr“°¢Æ–W"æv–åföÇG2ƒ‚“°¢'W'7B†7‚Â7’ÂÂÅ´rç&ööÔFVbç¦öæUÒævÆ÷rÂ#ÂãBÂCÂ2ÂG'VR“°¢òò6Ær&Æö"FöW2æ÷BF–R6ÆVã¢—B'W'7G2–çFòGvò6ÖÆÂ&Æö'0¢–b‡F†—2æ¶–æBÓÓÒv&Æö"rbbF†—2æÖ–æ’bböå7–¶R‡F†—2’’°¢f÷"†6öç7B2öb²ÓÂÒ’°¢6öç7B#"ÒæWrVæV×’‚v&Æö"rÂ7‚Ò²2¢ÂF†—2ç’²F†—2æ‚Òb“°¢#"çrÒ#²#"æ‚ÒS²#"æ‡Ò#²#"æÖ–æ’ÒG'VS°¢#"æF—"Ò3²#"çg‚Ò2¢3²#"çg’ÒÓ#C²#"æ¶%BÒã3S°¢ræVæVÖ–W2çW6‚†#"“°¢Ð¢Ð¢rçw&V6·2çW6‚†æWrw&V6²‡F†—2Â·‚ÇÂÂ·’ÇÂ’“°¢òòD„R%$”C¢WfW'’Ö6†–æRF†BF–W2ÆVfW2Ö&²öâF†Rv÷&ÆBÂæBæöæRö`¢òòF†VÒ7F÷F†RvÖRFòF—67W72—BâöæÇ’wV&F–ç2&R6¶VB&÷WBà¢–b‡G—Vöb'$¶–ÆÂÓÓÒvgVæ7F–öârbbF†—2æÖ–æ’’'$¶–ÆÂ„rç&ööÔ–B“°¢òò4„ô•#¢–âv÷&ÆBv†W&RF†W’†V"V6‚÷F†W"F–RÂF†RFVB6ÆÂF†RÆ—f–æp¢–b‡G—Vöb'$†2ÓÓÒvgVæ7F–öârbb'$†2‚v6†ö—"r’bb6†æ6Rƒã3R’’°¢6öç7BS"ÒæWrVæV×’†6†æ6RƒãR’òv7&vÆW"r¢vfÆ–W"rÂ7‚²&æB‚ÓƒÂƒ’ÂF†—2ç’ÒC“°¢S"æW‡—&UBÒC²ræVæVÖ–W2çW6‚†S"“°¢Ð¢Ð¢G&r†2’°¢6öç7BÒÅ´rç&ööÔFVbç¦öæUÓ°¢6öç7B7‚ÒF†—2ç‚²F†—2çrò"Â7’ÒF†—2ç’²F†—2æ‚ò#°¢–b‡F†—2æF—6&ÆVBÇÂF†—2ç&W67VVB’°¢òò'&ö¶Vâ7V&R—2âW‡÷6VB&–æF–æs²6ö×ÆWFR6—&6ÆR—27W&Rà¢òò6†R2vVÆÂ26öÆ÷W"Ö¶W2F†R7FFRÆVv–&ÆRv—F†÷WBVF–òà¢2ç6fR‚“²2ç7G&ö¶U7G–ÆRÒF†—2ç&W67VVBòr6#–c6fbr¢r6ffCcƒRs²2æÆ–æUv–GF‚Ò#°¢2æ&Vv–åF‚‚“°¢–b‡F†—2ç&W67VVB’2æ&2†7‚ÂF†—2ç’Ò"ÂRÂÂÖF‚å’¢"“°¢VÇ6R²2æÖ÷fUFò†7‚ÒRÂF†—2ç’Ò’“²2æÆ–æUFò†7‚ÒRÂF†—2ç’Òr“²2æÆ–æUFò†7‚²RÂF†—2ç’Òr“²2æÆ–æUFò†7‚²RÂF†—2ç’Ò’“²Ð¢2ç7G&ö¶R‚“°¢–b‡F†—2æ6ÆVç6UBâ’²2æf–ÆÅ7G–ÆRÒr6#–c6fbs²2æf–ÆÅ&V7B†7‚Ò"ÂF†—2ç’Ò#BÂ#B¢ƒÒF†—2æ6ÆVç6UBòãcR’Â2“²Ð¢2ç&W7F÷&R‚“°¢Ð¢òòÆ–v‡BG&–Â(	BvÆ÷v–ær&VB6ÖV"&V†–æBF†RÖ÷f–ærÖ6†–æP¢–b‡F†—2çG"æÆVæwF‚â"’°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s²2æÆ–æT6Òw&÷VæBs°¢f÷"†ÆWB’Ò²’ÂF†—2çG"æÆVæwFƒ²’²²’°¢6öç7BÒƒÒ’òF†—2çG"æÆVæwF‚’¢ã#ƒ°¢2ç7G&ö¶U7G–ÆRÒw&v&ƒ#SRÃs’Ã’Âr²çFôf—†VBƒ2’²r’s°¢2æÆ–æUv–GF‚ÒÖF‚æÖ‚ƒÂb¢ƒÒ’òF†—2çG"æÆVæwF‚’“°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡F†—2çG%¶’ÒÒç‚ÂF†—2çG%¶’ÒÒç’“²2æÆ–æUFò‡F†—2çG%¶•Òç‚ÂF†—2çG%¶•Òç’“²2ç7G&ö¶R‚“°¢Ð¢2ç&W7F÷&R‚“°¢Ð¢òò´”ätDôÒ"u2t$ä”äu2Â–âv÷&ÆB76RæB&÷fRWfW'’V&Ç’&WGW&â&VÆ÷r(	@¢òòâWF†÷&VBÆFRæBF†RVvÆRÖÖ–æ’fÆ–W"&÷F‚&WGW&â&Vf÷&RF†P¢òò&ö6VGW&Â&öG’—2&V6†VBÂæBFVÆVw&‚F†Bfæ—6†W2F†RF’F†P¢òò7&—FR6†VWBÆöG2—2F†Rf–ÇW&RF†RGW'&WBw2Æö6²Æ–v‡BÇ&VG’†@¢òòöæ6Râ–æW'Böâç’Ö6†–æRF†BF–Bæ÷B'W’6öæGV—BÖ÷fRà¢–b‡G—VöbG&t6öæGV—De‚ÓÓÒvgVæ7F–öâr’G&t6öæGV—De‚†2ÂF†—2Â7‚“°¢òòWF†÷&VBæ÷6RÖÆVgBÆ–¶RF†R&÷76W2ÂæBV6VB6òÖ–Ö–2GW&ç2&F†W"F†à¢òò6æ–ærâfÆ–W"f6W2—G2G&fVÂfV7F÷#²F†R&W7Bf6RF†V—"vÆ²F—&V7F–öâà¢6öç7BEÒGW&å÷6R‡F†—2æf6Uf—2“°¢òòöæÇ’F†R7&vÆW"—2WF†÷&VB–â&öf–ÆRâF†R&W7B&RG&vâ†VBÖöâÂ6ð¢òòF†W’×W7BæWfW"&R66ÆVBF÷v&B¦W&ò(	BF†W’§W7BÆVâà¢6öç7B&öf–ÆRÒF†—2æ¶–æBÓÓÒv7&vÆW"s°¢6öç7BfÆ—2Ò&öf–ÆP¢òÕEæF—"¢…Eç÷6RÓÓÒwròãƒ"²EçB¢ã‚¢¢¢ÕEæF—#°¢òòF†Rw&÷VæBæ–ÖÇ2†fRæò7FæBÖ–â&öG’‡6VRF†R6²Â&VÆ÷r“¢VçF–À¢òòF†V—"'B—2†W&RF†W&R—2æò6†F÷rV—F†W"(	B6†F÷rv—F‚æ÷F†–æp¢òò7FæF–ær–â—B—2F†Rw&öær&öG’'’æ÷F†W"æÖP¢–b‚‡F†—2æ¶–æBÓÓÒv7&vÆW"rÇÂF†—2æ¶–æBÓÓÒv†÷W"r’bbw&÷VæD&V7E&VG’‡F†—2’’&WGW&ã°¢òòw&÷VæFVB7&VGW&W267B6öçF7B6†F÷r†Æ–v‡F–ær72¢–b‡F†—2æ¶–æBÓÒvfÆ–W"rbbF†—2æ¶–æBÓÒv&Br’6öçF7E6†F÷r†2Â7‚ÂF†—2ç’²F†—2æ‚ÂF†—2çr¢ãSRÂã3‚“°¢òòF†R6fR&B—2—G2÷vâÖ6†–æRÂ†æv–ær÷"fÇ––æs²WF†÷&VBÆFW2&P¢òòVWVVB„%EõTUTR’(	BF†—2—2F†RVæv–æRÖG&vâf—'7B72Â6ÖR7FæF–æp¢òò2F†R÷F†W"Ö–æ–öâfÆÆ&6·0¢òòââææB—G26†—fW"vV'2F†R&–æræBF†RF÷vçv&BvVFvRWfW'’÷F†W ¢òòv–æB×WFöW3¢G&t&B&WGW&ç2&Vf÷&RF†R6†&VB&Æö6²WfW"&à¢–b‡F†—2æ¶–æBÓÓÒv&Br’²G&tVæV×•FVÆÂ†2ÂF†—2Â7‚“²G&t&B†2ÂF†—2“²&WGW&ã²Ð¢–b‡F†—2æ¶–æBÓÓÒw6vRr’²G&u6vR†2ÂF†—2“²&WGW&ã²Ð¢òòÒÒÒÒ†W&òv÷&ÆC¢&VÂ†æBÖæ–ÖFVB7&VGW&W2ÒÒÒÐ¢–b‡G—Vöb—4†W&òÓÓÒvgVæ7F–öârbb—4†W&ò‚’’°¢6öç7B5"Ò°¢7&vÆW#¢‚’Óâ°¢6öç7BÖ÷f–ærÒÖF‚æ'2‡F†—2çg‚’â#°¢&WGW&âÖ÷f–ærò²v†÷VæE'VârÂRÂcrÂ3"ÂÖF‚æfÆö÷"‡F†—2ææ–Ò¢B•Ð¢¢²v†÷VæD–FÆRrÂbÂcBÂ3"ÂÖF‚æfÆö÷"‡F†—2ææ–Ò¢r•Ó°¢ÒÀ¢fÆ–W#¢‚’Óâ²vv†÷7BrÂrÂcBÂƒÂÖF‚æfÆö÷"‡F†—2ææ–Ò¢‚•ÒÀ¢†÷W#¢‚’Óâ²w6·VÆÂrÂ"ÂcBÂ"ÂÖF‚æfÆö÷"‡F†—2ææ–Ò¢"•ÒÀ¢Ó°¢6öç7B–6²Ò5%·F†—2æ¶–æEÒbb5%·F†—2æ¶–æEÒ‚“°¢–b‡–6²bb6†VWE&VG’‡–6µ³Ò’’°¢6öç7B¶¶W’ÂâÂ7rÂ6‚Âg%ÒÒ–6³°¢2ç6fR‚“°¢–b‡F†—2æ‡W'EBâ’2ævÆö&ÄÇ†Òãc°¢2çG&ç6ÆFR†7‚ÂF†—2ç’²F†—2æ‚“°¢2ç66ÆR†fÆ—2Â“°¢òòf—BF†R'BFòF†R†—F&÷‚†V–v‡BÂF÷V6‚Æ&vW"f÷"&W6Væ6P¢6öç7B62Ò‡F†—2æ‚¢ãR’ò6ƒ°¢G&u6†VWB†2Â¶W’ÂâÂ7rÂ6‚Âg"RâÂ62ÂF†—2æ¶–æBÓÓÒvfÆ–W"ròb¢"“°¢2ç&W7F÷&R‚“°¢&WGW&ã°¢Ð¢òòF†R†÷VæBæBF†R6·VÆÂv—Bf÷"F†V—"÷vâ6†VWG3¢F†W&R—2æð¢òòÖ6†–æR&öG’VæFW"F†VÒFò&÷'&÷r„äUdU"D„Ru$ôär$ôE’Â&÷72æG&r¢–b‡F†—2æ¶–æBÓÓÒv7&vÆW"rÇÂF†—2æ¶–æBÓÓÒv†÷W"r’&WGW&ã°¢Ð¢òòD„Ru$õTäBÔ4„”äU2$RD„R4²†ÖVF÷ræB6öæGV—G2’äBD„R4„TUD€¢òòÄ”äR†WfW'’¶–ævFöÒgFW"’(	B§2÷vöÇfW2æ§2âWfW'’4Ät%•DR¦öæR—2öæR÷ ¢òòF†R÷F†W"Â6ò7&vÆW"÷"†÷W"†2æò÷F†W"&öG“¢VçF–Â—G2ÆFW0¢òòÆæB—BG&w2äõD„”ärÂF†R'VÆR&÷72æG&r7FFW22&æWfW"F†Rw&öæp¢òò&öG’"âF†Rv†VÇ&–rÂF†R&÷7FW"w2GW&çF&ÆR&÷w2æBF†R&ö6VGW&À¢òò†VÆW"öÆV²×6VV¶W"F†BW6VBFò7FæB–âvW&RÆÂF–ffW&VçB7&VGW&P¢òòfÆ6†–ærWf÷"g&ÖS²F†RÆFW2&RfWF6†VBöâ&ööÒVçG'¢òò†&V7E&VÆöB’6òF†Rv—B—2F†Rf—'7Bg&ÖR÷"GvòBÖ÷7Bà¢6öç7B†W&ôVâÒG—Vöb—4†W&òÓÓÒvgVæ7F–öârbb—4†W&ò‚“°¢òòââææBöæ6R—B„2G&vâÂWfW'—F†–ærF†B&VG2F†Ræ–ÖÂ7F–ÆÂ'Vç0¢òò÷fW"—C¢—G2G&—BÖ&·2ÂF†R67&ÖG&rÆFRÂF†RÆæF–ærÖ&²ÂF†P¢òò6†&VBv–æB×W&–ærâ&WGW&æ–ær†W&R†2—BW6VBFò’G&÷VBWfW'’öæRö`¢òòF†÷6RFVÆÇ2f÷"F†R6²æBF†R6†VWF‡2F†RF’F†V—"ÆFW2ÆæFVBà¢ÆWB&V7D&öG’ÒfÇ6S°¢–b†—5vöÆb‡F†—2’’²G&uvöÆb†2ÂF†—2“²&V7D&öG’ÒG'VS²Ð¢VÇ6R–b†—46†VWF‚‡F†—2’’²G&t6†VWF‚†2ÂF†—2“²&V7D&öG’ÒG'VS²Ð¢VÇ6R–b‡F†—2æ¶–æBÓÓÒv7&vÆW"rÇÂF†—2æ¶–æBÓÓÒv†÷W"r’&WGW&ã°¢òòWfW'’fÇ––ærÖ–æ–öâ—26ÖÆÂDÄôä„õ5B(	BFÆöç2öæÇ’ÂæòfVF†W'0¢–b‚†W&ôVâbbF†—2æ¶–æBÓÓÒvfÆ–W"rbbG—VöbG&tVvÆTÖ–æ’ÓÓÒvgVæ7F–öârbbG&tfÆ–W$Ö–æ’†2ÂF†—2’’&WGW&ã°¢òòD„REU%$UBu2„ÄbÕ4T4ôäBÂUB$4²ôâ45$TTââF†W&R†2Çv—2&VVâ&V@¢òòF&vWF–ærÆ–v‡Bf÷"F†RãSR2Æö6²(	BG&vâ6WfVâ‡VæG&VBÆ–æW2&VÆ÷rÀ¢òò–ç6–FRF†R&ö6VGW&ÂfÆÆ&6²Âv†–6‚7F÷VBW†V7WF–ærF†RF’F†P¢òò7&—FRFÆ27F'FVBÆöF–ærâ–âF†R6†—VBvÖRF†RöæÇ’v&æ–ær&Vf÷&P¢òò'VÆÆWBv26÷VæBâ—B—2G&vâ„U$Ræ÷rÂ&÷fRWfW'’V&Ç’&WGW&âÂæ@¢òò—B'&–æw2â–ÒÆ–æRv—F‚—C¢F†RÆ–æRf–æG2–÷R÷fW"F†R†Æb6V6öæBÀ¢òò6òF†Rv&æ–ær6—2v†W&RF†R6†÷B—2vö–ær2vVÆÂ2F†B—B—26öÖ–ærà¢òòt„BD„•2ôäR•2â&–ær–âF†RG&—Bw2÷vâ6öÆ÷W"ÂÇW2Ö&³¢¢òò6†Wg&öâf÷"V–6²Â&"f÷"&Ö÷W&VBÂF÷Bf÷"F†RöæRF†BvöW2öfbà¢òò6öÆ÷W"ÆöæRv÷VÆBf–Â&÷Vv†Ç’öæRÖâ–âGvVÇfRÂ6òF†R6†R6'&–W0¢òòF†R6ÖR–æf÷&ÖF–öâà¢–b‡F†—2çG&—G2bbF†—2çG&—G2æÆVæwF‚bbF†—2æFVB’°¢2ç6fR‚“°¢F†—2çG&—G2æf÷$V6‚‚‡G"ÂF’’Óâ°¢6öç7BBÒE$•E5·G%Ó²–b‚B’&WGW&ã°¢6öç7B'’ÒF†—2ç’ÒbÒF’¢s°¢2ævÆö&ÄÇ†ÒãƒS°¢2ç7G&ö¶U7G–ÆRÒBæ6öÃ²2æÆ–æUv–GF‚Òãc°¢2æ&Vv–åF‚‚“²2æ&2†7‚Â'’Â2ãbÂÂr“²2ç7G&ö¶R‚“°¢2æf–ÆÅ7G–ÆRÒBæ6öÃ°¢–b‡G"ÓÓÒw7v–gBr’²2æ&Vv–åF‚‚“²2æÖ÷fUFò†7‚Ò"Â'’²ãb“²2æÆ–æUFò†7‚Â'’Òã‚“²2æÆ–æUFò†7‚²"Â'’²ãb“²2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“²Ð¢VÇ6R–b‡G"ÓÓÒwF÷Vv‚r’2æf–ÆÅ&V7B†7‚Ò"ãBÂ'’Òã"ÂBã‚Â"ãB“°¢VÇ6R²2æ&Vv–åF‚‚“²2æ&2†7‚Â'’ÂãrÂÂr“²2æf–ÆÂ‚“²Ð¢Ò“°¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòF†RÆFS¢WÖVç2v—BÂF÷vâÖVç2æ÷p¢–b‡F†—2æ¶–æBÓÓÒvwV&BrbbF†—2æFVB’°¢6öç7BWÒF†—2æwV&C°¢2ç6fR‚“°¢2çG&ç6ÆFR†7‚²F†—2æF—"¢‡F†—2çr¢ãS"’ÂF†—2ç’²F†—2æ‚¢ãR“°¢2ævÆö&ÄÇ†ÒWòã“R¢ã3S°¢2æf–ÆÅ7G–ÆRÒWòr3–f#63‚r¢r3V#fvs°¢'"†2ÂÓ2Â×F†—2æ‚¢ãRÂbÂF†—2æ‚Â"“²2æf–ÆÂ‚“°¢2ç7G&ö¶U7G–ÆRÒWòr6FfVcbr¢w&v&ƒ“Ã#Ã#3ÃãB’s²2æÆ–æUv–GF‚Òã#°¢'"†2ÂÓ2Â×F†—2æ‚¢ãRÂbÂF†—2æ‚Â"“²2ç7G&ö¶R‚“°¢–b‚Wbbræ'E&ö&R’²òòF†Rv–æF÷rÂÖFRö'f–÷W0¢òò†&–æröbFV6÷&F–öâ&÷VæBF†R&öG’Â6òöfbVæFW"ræ'E&ö&RÆ–¶P¢òòF†Rv–æB×W&–æs²æBöâF†R6–×VÆF–öâ6Æö6²Âæ÷BF†RvÆÂw2¢2ævÆö&ÄÇ†ÒãR²ÖF‚ç6–â‚‡F†—2ææ–ÒÇÂ’¢ã’¢ã3°¢òòäõBF†RFVÆVw&‚Ö&W"â&Vv—7G'’*s"w2f—'7B†&B'VÆS¢6ff3#F—2öà¢òò67&VVâöæÇ’v†–ÆR6öÖWF†–ær—2v–æF–ærW(	BæBF†—2&–ær—2F†P¢òòõõ4•DRÖW76vRÂ&—B—2÷VâÂ†—B—Bæ÷r"âG&vâ–âF†RÆFRw2÷và¢òòÆR7FVVÂÂ6ò—B&VG22F†RÆFRw2'6Væ6RÂæ÷B2v&æ–ærà¢2ç7G&ö¶U7G–ÆRÒr6SFcf"s²2æÆ–æUv–GF‚Ò#°¢2æ&Vv–åF‚‚“²2æ&2‚×F†—2æF—"¢F†—2çr¢ãS"ÂÂF†—2çr¢ãsRÂÂr“²2ç7G&ö¶R‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÐ¢òò´”ätDôÒ(	Bt„BD„RÔTDõr”4´TBUÂE$tâà¢òð¢òòF†W6R&RF†RFVÆVw&‡2f÷"67&G&rò67&¶–6²ò'W7F&ÆööÒÂæBF†W¢òòÆ—fR„U$RÂ–âg&öçBöbF†RFÆ26ÆÂÂf÷"F†R6ÖR&V6öâF†RwV&Bw0¢òòÆFRæBF†R'&V¶W"w2vfW2Fó¢F†RWF†÷&VB6†VWB†2öæR÷6RW ¢òòÖ6†–æRÂ6òç—F†–ærF†R&öG’—2†öÆF–ær†2Fò&RG&vâ&W6–FR—B÷"—@¢òòFöW2æ÷BW†—7Böâ67&VVââ†—F&÷‚v—F‚æò–7GW&R—2F†RW†7BF†–ærF†P¢òòFVÆVw&‚Ærf÷&&–G2à¢òð¢òòF†R&W6W'fVBÖ&W"&÷fRF†VÒ—2Ç&VG’G&vâ'’F†R6†&VBv–æB×W ¢òò&Æö6²&VÆ÷r(	BF†—2—2F†R6V6öæB6†ææVÂÂF†RF†–ær—G6VÆbÂ6òF†P¢òòv&æ–ær—2æ÷B6'&–VB'’öæR‡VRÆöæRà¢–b‚F†—2æFVBbb‡F†—2æG&sâÇÂF†—2çÆFR’’°¢òòF†RÆFS¢†öö¶VBWöfbF†RfÆö÷"GW&–ærF†R6ö–ÂÂF†Vâ6†÷fVBà¢6öç7B²ÒF†—2çÆFRò¢F†—2æG&s°¢6öç7B÷‚Ò7‚²F†—2æF—"¢‡F†—2çr¢ãR²‡F†—2çÆFRòE$uõ$T4‚¢ãR¢B’“°¢6öç7B÷’ÒF†—2ç’²F†—2æ‚Ò2Ò²¢‡F†—2æ‚¢ãSR“°¢2ç6fR‚“°¢2çG&ç6ÆFR†÷‚Â÷’“°¢2ç&÷FFR‡F†—2æF—"¢ƒã’Ò²¢ãsR’“²òò—B6öÖW2WVFvRÖöâÂF†VâfÆ@¢6öç7BrÒE$uõ$T4‚¢ƒãSR²²¢ãCR’Â‚Ò2²²¢#°¢2æf–ÆÅ7G–ÆRÒr3vCF#"s°¢2æ&Vv–åF‚‚“²'"†2Â×rò"Â×‚ò"ÂrÂ‚Âã"“²2æf–ÆÂ‚“°¢2æf–ÆÅ7G–ÆRÒr6#Cs&bs°¢2æf–ÆÅ&V7B‚×rò"Â×‚ò"ÂrÂã“²òòF†R'W7BVFvR6F6†–ærÆ–v‡@¢2ç7G&ö¶U7G–ÆRÒw&v&ƒ#ÃBÃ‚ÃãSR’s²2æÆ–æUv–GF‚Òãc°¢2æ&Vv–åF‚‚“²'"†2Â×rò"Â×‚ò"ÂrÂ‚Âã"“²2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“°¢–b‡F†—2çÆFR’²òò—B—2vVöâæ÷rÂæ÷B6&vð¢2ç6fR‚“²2ævÆö&ÄÇ†ÒãS°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚Òãc°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò†÷‚ÂF†—2ç’²2“²2æÆ–æUFò†÷‚ÂF†—2ç’²F†—2æ‚Ò"“²2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢Ð¢–b‚F†—2æFVBbbF†—2ç&¶SâbbF†—2æÆöFVB’°¢òòF†R†V¢67&VB–âVæFW"F†R7&–æw2v†–ÆR—B7&÷V6†W2ÂæB—G24•¤P¢òò—2F†R&V6‚—B—2&÷WBFò†fRâ6†R—2FöÆB†÷rf"&Vf÷&R—BvöW2à¢6öç7B²ÒF†—2ç&¶SÂ‡rÒ²²¢bÂ†‚Ò"²²¢C°¢2ç6fR‚“°¢2æf–ÆÅ7G–ÆRÒr3vCF#"s²2ævÆö&ÄÇ†Òã“°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†7‚ÂF†—2ç’²F†—2æ‚ÒÂ‡rÂ†‚ÂÂÖF‚å’Â“²2æf–ÆÂ‚“°¢2æf–ÆÅ7G–ÆRÒr6#Cs&bs²2ævÆö&ÄÇ†Òãs°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†7‚ÂF†—2ç’²F†—2æ‚ÒÂ‡r¢ãbÂ†‚¢ãrÂÂÖF‚å’Â“²2æf–ÆÂ‚“°¢2ævÆö&ÄÇ†Òã3R²²¢ãC°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚ÒãC²2ç6WDÆ–æTF6‚…³BÂEÒ“°¢2æÆ–æTF6„öfg6WBÒ×W&f÷&Öæ6Rææ÷r‚’òc°¢f÷"†6öç7B6Böb²ÓÂÒ’°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†7‚²6B¢‡rÂF†—2ç’²F†—2æ‚Ò“°¢2æÆ–æUFò†7‚²6B¢´”4µõ$T4‚¢²ÂF†—2ç’²F†—2æ‚Ò“°¢2ç7G&ö¶R‚“°¢Ð¢2ç6WDÆ–æTF6‚…µÒ“²2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢–b‚F†—2æFVBbb‡F†—2çv6…BÇÂ’â’°¢òòF†R&–æröâF†RfÆö÷#¢w&÷VæFVBÖöæÇ’Â6ò—B—2G&vâôâF†RfÆö÷ ¢6öç7BÒ6Æ×‡F†—2çv6…B¢"ãBÂÂ“°¢2ç6fR‚“²2ævÆö&ÄÇ†Ò¢ãsS°¢2ç7G&ö¶U7G–ÆRÒr6C†62s²2æÆ–æUv–GF‚Ò"ãC°¢f÷"†6öç7B6Böb²ÓÂÒ’°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†7‚²6B¢BÂF†—2ç’²F†—2æ‚Ò"“°¢2çVG&F–47W'fUFò†7‚²6B¢F†—2çv6…"¢ãbÂF†—2ç’²F†—2æ‚Ò’À¢7‚²6B¢F†—2çv6…"ÂF†—2ç’²F†—2æ‚Ò"“°¢2ç7G&ö¶R‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢–b‚F†—2æFVBbbF†—2æ&ÆööÒbbF†—2æG&—â’°¢òòD„R$ÄôôÒ”åE2t„U$RÂäõBÔU$TÅ’D„BâGvòÖ&W"Ö&·2öâF†RGvð¢òòF–ÆW2—B—2&÷WBFòF‡&÷rBÂf–ÆÆ–ær–â2F†R6r'Vç2(	B&V6W6R¢òò†¦&BF†BÆæG2v†W&R6†R—2äõB7FæF–ær†2FòæÖR—G2w&÷VæB÷ ¢òòF†R&VB—2wVW72âF†R6r—G6VÆb—2F†RWWBw2†G&—Óâ6v’à¢2ç6fR‚“°¢f÷"†6öç7B6Böb²ÓÂÒ’°¢6öç7B×‚Ò7‚²6B¢$ÄôôÕõD…$õrÂ×’ÒF†—2ç’²F†—2æ‚Ò#°¢2ævÆö&ÄÇ†Òã#R²F†—2æG&—¢ãSS°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚Òãc°¢2ç6WDÆ–æTF6‚…³BÂEÒ“²2æÆ–æTF6„öfg6WBÒ×W&f÷&Öæ6Rææ÷r‚’òs°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†×‚Â×’Â2ÂBãRÂÂÂr“²2ç7G&ö¶R‚“°¢2ç6WDÆ–æTF6‚…µÒ“°¢2ævÆö&ÄÇ†ÒF†—2æG&—¢ãS°¢2æf–ÆÅ7G–ÆRÒr6#Cs&bs°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†×‚Â×’Â2¢F†—2æG&—ÂBãR¢F†—2æG&—ÂÂÂr“²2æf–ÆÂ‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢–b‚‡F†—2æÆö6µBÇÂ’âbbF†—2æFVB’G&uGW'&WDÆö6²†2ÂF†—2Â7‚“°¢òòF†R'&V¶W"w26†&vRvfW2Æ—fRöâF†R&–ÂÂæ÷BöâF†R&öG’(	BG&vâ–à¢òòv÷&ÆB76RÂFævW"&VBW"F†R&Vv—7G'“¢&VFVæ–ÂÂ'F†RfÆö÷"vö–æp¢òò†÷7F–ÆR"ÂW†7FÇ’v†BF†R‡VR—2&W6W'fVBFòÖVà¢–b‡F†—2æ¶–æBÓÓÒw7W&vRrbbF†—2çvfW2bbF†—2çvfW2æÆVæwF‚’°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢f÷"†6öç7BröbF†—2çvfW2’°¢6öç7BÒ6Æ×‡ræÆ–fR¢"ã"ÂÂ“°¢2ævÆö&ÄÇ†ÒãSR¢°¢2ç7G&ö¶U7G–ÆRÒr6fcVcfBs²2æÆ–æUv–GF‚Ò#²2æÆ–æT6Òw&÷VæBs°¢òò7&W7Böb7&vÆ–ær&72ÂFÆÆW7BBF†Rg&öçBVFvP¢f÷"†ÆWB’Ò²’Â3²’²²’°¢6öç7B‚Òrç‚ÒræF—"¢’¢s°¢6öç7B‚ÒƒBÒ’¢2ãR’¢ƒãr²ÖF‚ç6–â‡rç‚²’¢ãr’¢ã2“°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†‚ÒRÂrç’“°¢2çVG&F–47W'fUFò†‚²&æB‚Ó"Â"’Ârç’Ò‚Â‚²RÂrç’“°¢2ç7G&ö¶R‚“°¢Ð¢2ævÆö&ÄÇ†Òã2¢°¢6öç7BvÂÒ2æ7&VFU&F–Äw&F–VçB‡rç‚Ârç’ÒBÂÂrç‚Ârç’ÒBÂ#b“°¢vÂæFD6öÆ÷%7F÷ƒÂr6fcVcfBr“²vÂæFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ“RÃ’Ã’r“°¢2æf–ÆÅ7G–ÆRÒvÃ°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R‡rç‚Ârç’Ò2Â#bÂ"ÂÂÂr“²2æf–ÆÂ‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòF†R¶–Æâw2ÇVÖR7FæG2öâF†RÖ÷WF‚Âæ÷BöâF†R&öG’(	BG&vâ–âv÷&Æ@¢òò76RÂFævW"&VBB—G26¶–âW"F†R&Vv—7G'’†&VFVæ–ÂÂ'F†—276P¢òò—2'&–VfÇ’æ÷B–÷W'2"’Âv†—FRÖ†÷BöæÇ’BF†RF‡&öBv†W&R—B—2&÷&à¢–b‡F†—2æ¶–æBÓÓÒv¶–Æârbb‡F†—2çÇVÖUBÇÂ’âbbF†—2æFVB’°¢6öç7B×’ÒF†—2ç’²"Â‚ÒF†—2çÇVÖT‚ÇÂ°¢6öç7BÒ6Æ×‡F†—2çÇVÖUB¢BÂÂ“°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢òòF†R6öÇVÖã¢w&F–VçB7FÆ²&÷&âv†—FRæBG––ærFævW"&V@¢6öç7BvÂÒ2æ7&VFTÆ–æV$w&F–VçBƒÂ×’ÂÂ×’Ò‚“°¢vÂæFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ#C"Ã##Âr²ãR¢²r’r“°¢vÂæFD6öÆ÷%7F÷ƒãBÂw&v&ƒ#SRÃC‚ÃC‚Âr²ãB¢²r’r“°¢vÂæFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ“RÃ’Âr²ãb¢²r’r“°¢2æf–ÆÅ7G–ÆRÒvÃ°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†7‚Ò2Â×’“°¢2çVG&F–47W'fUFò†7‚ÒR²ÖF‚ç6–â‡F†—2ææ–Ò¢#’¢2Â×’Ò‚¢ãSRÂ7‚Ò‚²ÖF‚ç6–â‡F†—2ææ–Ò¢r’¢2Â×’Ò‚“°¢2æÆ–æUFò†7‚²‚²ÖF‚ç6–â‡F†—2ææ–Ò¢’²"’¢2Â×’Ò‚“°¢2çVG&F–47W'fUFò†7‚²R²ÖF‚ç6–â‡F†—2ææ–Ò¢#2²B’¢2Â×’Ò‚¢ãSRÂ7‚²2Â×’“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢òòFöæwVW26Æ–Ö&–ærF†R7FÆ²(	BF†R7&W7BF†B6—2—B—2Ôõd”ärW ¢2ç7G&ö¶U7G–ÆRÒr6fcVcfBs²2æÆ–æUv–GF‚Ò#²2æÆ–æT6Òw&÷VæBs°¢2ævÆö&ÄÇ†ÒãR¢°¢f÷"†ÆWB’Ò²’Â3²’²²’°¢6öç7BG’Ò×’Ò‚‡F†—2ææ–Ò¢3²’¢‚ò2’RÖF‚æÖ‚‡‚Â’“°¢6öç7BGrÒÒ’¢#°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†7‚ÒGrÂG’“°¢2çVG&F–47W'fUFò†7‚²ÖF‚ç6–â‡F†—2ææ–Ò¢#R²’¢"ãB’¢RÂG’Ò’Â7‚²GrÂG’“°¢2ç7G&ö¶R‚“°¢Ð¢òòF†R7&÷vã¢v†W&RF†R&V6‚5Dõ2ÂÖ&¶VB6òF†R&VB—26†P¢2ævÆö&ÄÇ†ÒãB¢°¢6öç7B6rÒ2æ7&VFU&F–Äw&F–VçB†7‚Â×’Ò‚ÂÂ7‚Â×’Ò‚Â#“°¢6ræFD6öÆ÷%7F÷ƒÂr6fcVcfBr“²6ræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ“RÃ’Ã’r“°¢2æf–ÆÅ7G–ÆRÒ6s°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†7‚Â×’Ò‚Â#Â’ÂÂÂr“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òò´”ätDôÒ2u2DTÄÅ2Â”âtõ$ÄB54R(	BG&vâ†W&R&F†W"F†âöâF†R&öG¢òòf÷"F†R6ÖR&V6öâF†RÇVÖRæBF†RvfW2&S¢F†W’&R7FFVÖVçG0¢òò&÷WBF†RdÄôõ"ÂæB†¦&Bw2v&æ–ær†2Fò&Rv†W&RF†R†¦&Bv–ÆÀ¢òò&Râ—BÇ6ò¶VW2F†VÒ–æFWVæFVçBöbv†WF†W"Ö6†–æRw2WF†÷&VBÆFP¢òò†2ÆæFVB–WB„%EõTUTR*s&Â’Âv†–6‚&öG’×76RFVÆÂv÷VÆBæ÷B&Rà¢òð¢òòF†R÷W#¢&VBöbÖVÇB7vVÆÇ2öâF†RÆ—F†R÷B†26†÷6VâæB¢òòF6‚'&–v‡FVç2öâF†Rw&÷VæBVæFW"—BÂF‡&÷Vv‚F†R6†&vRäBF†R&Æ÷rÀ¢òò6òF†R7–ÆÂ—2Æ6R6†R†2&VVâÆöö¶–ærBf÷"ã22&Vf÷&R—B—0¢òòÆ6R6†R6â&R'W&æVB'’âÖ&W"v†–ÆR—B—2v&æ–ær(	BF†RvÖRw0¢òòöæRÖVæ–ærf÷"F†B‡VR(	BæWfW"F†RFævW"&VBF†RÆ—fR6öÇVÖâvV'2à¢–b‡F†—2æ¶–æBÓÓÒv¶–ÆârbbF†—2æFVBbbF†—2æ†4Ö÷fR‚w÷W"r¢bb‚‡F†—2æ7&÷V6…BÇÂ’âÇÂ‡F†—2çÇVÖUBÇÂ’â’’°¢6öç7B6–FRÒF†—2ç÷W%6–FRÇÂ°¢òòBF†Rf—'7Bg&ÖRöbF†R6†&vRÂ2F†RÖVÇBÆWG2vð¢6öç7B²Ò‡F†—2æ7&÷V6…BÇÂ’â ¢ò6Æ×ƒÒF†—2æ7&÷V6…BòDTÄÅõ5t•RÂÂ’¢ãCP¢¢ãCR²6Æ×ƒÒF†—2çÇVÖUBòã‚ÂÂ’¢ãSS°¢6öç7BÇ‚Ò7‚²6–FR¢’ãRÂÇ’ÒF†—2ç’²3°¢6öç7Bg’ÒF†—2ç’²F†—2æ‚Ò#°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢òòF†RF6ƒ¢v†W&R—B—2vö–ærFò'VâÂÖ&¶VB26†RöâF†Rw&÷VæBà¢òòw&÷VæBÖæ6†÷&VBÂ6ò—B—2W†7FÇ’F†RFV6÷&F–öâræ'E&ö&RW†—7G2Fð¢òò7v—F6‚öfb(	BFW7G2ö'F&–&ÆRæ6§2ÖV7W&W2v†W&RÖ6†–æRw2fVWB&RÀ¢òòæBÆ—BVÆÆ—6RVæFW"F†VÒ—2Æ–v‡B—Bv÷VÆBÖV7W&R–ç7FVBà¢–b‚ræ'E&ö&R’°¢2ævÆö&ÄÇ†Òãb²²¢ãC°¢6öç7BrÒ2æ7&VFU&F–Äw&F–VçB†7‚²6–FR¢3Âg’ÂÂ7‚²6–FR¢3Âg’Â#B“°¢ræFD6öÆ÷%7F÷ƒÂr6ff#Fr“²ræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃsbÃsBÃ’r“°¢2æf–ÆÅ7G–ÆRÒs°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†7‚²6–FR¢3Âg’Â#"ÂrÂÂÂr“²2æf–ÆÂ‚“°¢Ð¢òòF†R&VC¢†æv–æröfbF†RÆ—Â†Vf–W"2—B—2&÷WBFòÆWBvð¢2ævÆö&ÄÇ†ÒãR²²¢ãS°¢2æf–ÆÅ7G–ÆRÒr6ffC†s°¢6öç7B&ÂÒ"²²¢s°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†Ç‚Ò"ãBÂÇ’“°¢2çVG&F–47W'fUFò†Ç‚Ò2ã"ÂÇ’²&Â¢ãrÂÇ‚ÂÇ’²&Â“°¢2çVG&F–47W'fUFò†Ç‚²2ã"ÂÇ’²&Â¢ãrÂÇ‚²"ãBÂÇ’“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòF†R7Æ6‚vö'3¢F†R&2•2F†Rv&æ–ærÂ6ò&÷F‚F†Rvö"æBF†R7V&P¢òò—B—2fÆÆ–ærF÷v&B&RG&vâÂæBæV—F†W"öbF†VÒ6â‡W'B†W"(	BF†P¢òòÖVÇBöæÇ’&—FW2öæ6R—B†26WBâF†RÖ&²—2&V6ö×WFVBWfW'’7FW–à¢òòWFFR‚’Â6ò—BFVÆÇ2F†RG'WF‚&÷WBvö"F†B—2vö–ærFò6Æ—¢òòÆVFvR–ç7FVBöb&V6†–ærF†RfÆö÷"F†R†÷W"§V×VBg&öÒà¢–b‡F†—2æ¶–æBÓÓÒv†÷W"rbbF†—2ævö'2bbF†—2ævö'2æÆVæwF‚bbF†—2æFVB’°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢f÷"†6öç7BröbF†—2ævö'2’°¢–b‚ræ'E&ö&R’²òòw&÷VæBÖæ6†÷&VBÂ6ÖR'VÆP¢2ævÆö&ÄÇ†ÒãC#°¢6öç7BÖrÒ2æ7&VFU&F–Äw&F–VçB†rç‚ÂræÖ&²ÂÂrç‚ÂræÖ&²Â#“°¢ÖræFD6öÆ÷%7F÷ƒÂr6ff#Fr“²ÖræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃsbÃsBÃ’r“°¢2æf–ÆÅ7G–ÆRÒÖs°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†rç‚ÂræÖ&²Â‚ÂbÂÂÂr“²2æf–ÆÂ‚“°¢Ð¢2ævÆö&ÄÇ†Òã“°¢2æf–ÆÅ7G–ÆRÒr6ffS&‚s°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†rç‚Ârç’ÂRÂbãRÒ6Æ×†rçg’òCÂÓÂ’¢ãRÂÂÂr“²2æf–ÆÂ‚“°¢2ævÆö&ÄÇ†ÒãCS°¢2æf–ÆÅ7G–ÆRÒr6fc“C3s°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†rç‚Ârç’ÒbÂ2ãBÂrÂÂÂr“²2æf–ÆÂ‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÐ¢òò´”ätDôÒRu2D…$TR$TE2ÂG&vâ–âv÷&ÆB76R&V6W6RÆÂF‡&VP¢òòF‡&VFVâw&÷VæB÷"&öG’F†B—2æ÷BF†—2öæRâWfW'’öæRöbF†VÒ—0¢òòÖ&W"v†–ÆR—B—2öæÇ’v&æ–æræB–æfV7F–öâ×&VB÷"7÷&RÖw&VVà¢òòöæ6R—B—2&VÂ(	BF†R†÷W6R'VÆRÂVæ6†ævVC¢âVæV×’—2æWfW"†&FW ¢òò&V6W6R—Bv&æVB–÷RÆW72âF†RGvòF†B&Ræ6†÷&VBFòF†RdÄôõ"&P¢òò7W&W76VBVæFW"ræ'E&ö&Rv—F‚WfW'’÷F†W"w&÷VæBe‚Â6òF†R&–&ÆP¢òò†&æW72ÖV7W&W2fVWB&F†W"F†âv†B—2w&÷v–ærVæFW"F†VÒà¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòD„õ$ä$TC¢F†R7FÆ²w&÷v–ær÷WBöbæW7B&Æö"w2ööÂâF†R&—6R—2F†P¢òòv†öÆRFVÆVw&‚(	B—B—2G&vâB—G2G'VR†V–v‡Bg&öÒF†Rf—'7Bg&ÖP¢òòöbw&÷wF‚ÂÖ&W"æBG&ç6ÇV6VçBÂ6òF†R6öÇVÖâ—Bv–ÆÂ÷vâ—2ÆVv–&ÆP¢òò&Vf÷&R—B6âF÷V6‚†W"â&VBæB6öÆ–BöæÇ’öæ6R—B—2Æ—fRà¢–b‡F†—2æ¶–æBÓÓÒv&Æö"rbbF†—2æFVBbbræ'E&ö&P¢bb‚‡F†—2çF†÷&å&—6RÇÂ’âÇÂ‡F†—2çF†÷&åBÇÂ’â’’°¢6öç7B&—6–ærÒ‡F†—2çF†÷&å&—6RÇÂ’â°¢6öç7B²Ò&—6–æròÒ6Æ×‡F†—2çF†÷&å&—6RòD„õ$åõ$•4RÂÂ’¢°¢6öç7B'‚ÒF†—2çF†÷&å‚Â'’ÒF†—2çF†÷&å“°¢6öç7B‚ÒD„õ$åô‚¢‡&—6–æròã#R²²¢ãsR¢“°¢6öç7BfFRÒ&—6–ærò¢6Æ×‡F†—2çF†÷&åBòãBÂÂ“°¢2ç6fR‚“°¢òòF†R6öÇVÖâ—B6Æ–×2(	BF6†VBÖ&W"÷fW"F†Rv†öÆRFöÆB†V–v‡BÂ6ð¢òòF†R&VB—2'F†—2—"—2&÷WBFò&RF¶Vâ"Âæ÷B&7–¶RV&VB ¢–b‡&—6–ær’°¢2ævÆö&ÄÇ†Òã‚²²¢ã3C°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚ÒãC°¢2ç6WDÆ–æTF6‚…³BÂeÒ“²2æÆ–æTF6„öfg6WBÒ×W&f÷&Öæ6Rææ÷r‚’òCS°¢2æ&Vv–åF‚‚“°¢2ç&V7B†'‚ÒD„õ$åô„ÄbÂ'’ÒD„õ$åô‚ÂD„õ$åô„Äb¢"ÂD„õ$åô‚“°¢2ç7G&ö¶R‚“²2ç6WDÆ–æTF6‚…µÒ“°¢Ð¢òòF†R7FÆ³¢FW&VBF†÷&âv—F‚Gvò&&'2ÂÆVæ–æröâ—G2÷vâVÇ6P¢6öç7BÆVâÒÖF‚ç6–â‡F†—2ææ–Ò¢‡&—6–ærò2¢’’’¢‡&—6–æròãB¢"ãb“°¢2ævÆö&ÄÇ†Ò‡&—6–æròãCR²²¢ãB¢ã“"’¢fFS°¢2æf–ÆÅ7G–ÆRÒ&—6–æròDTÄÅô4ôÂ¢r63C3ƒFs°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†'‚ÒD„õ$åô„Äb¢ãc"Â'’“°¢2çVG&F–47W'fUFò†'‚Ò"ãBÂ'’Ò‚¢ãSRÂ'‚²ÆVâÂ'’Ò‚“°¢2çVG&F–47W'fUFò†'‚²2ã"Â'’Ò‚¢ãSRÂ'‚²D„õ$åô„Äb¢ãc"Â'’“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢2ç7G&ö¶U7G–ÆRÒ&—6–æròDTÄÅô4ôÂ¢r6fc†“bs²2æÆ–æUv–GF‚Òã#°¢2ç7G&ö¶R‚“°¢f÷"†6öç7B2öb²ÓÂÒ’²òòF†R&&'0¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†'‚²2¢"ãBÂ'’Ò‚¢ãS"“°¢2æÆ–æUFò†'‚²2¢…D„õ$åô„Äb¢ã“R’Â'’Ò‚¢ã3‚“°¢2æÆ–æUFò†'‚²2¢"ãBÂ'’Ò‚¢ã3B“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢Ð¢òòÆ—fS¢F†RF—'W&ç2ÂæBF†R'W&â—2öâF†R&öG’w2÷vâ&V@¢–b‚&—6–ær’°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†ÒƒãB²ÖF‚ç6–â‡F†—2ææ–Ò¢2’¢ã#‚’¢fFS°¢2æf–ÆÅ7G–ÆRÒr6fcVcfBs²2ç6†F÷t6öÆ÷"Òr6fcVcfBs²2ç6†F÷t&ÇW"Òƒ°¢2æ&Vv–åF‚‚“²2æ&2†'‚²ÆVâÂ'’Ò‚Â"ãbÂÂr“²2æf–ÆÂ‚“°¢2ç6†F÷t&ÇW"Ò°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òò4„TC¢F†RF—77VRF†RÆFR&V6ÖRÂ7&vÆ–ærâFævW"&VBöâF†RfÆö÷"(	@¢òòF†R&Vv—7G'’w2&VÖFVæ–Â‡VRÂv÷&â&V6W6RF†RfÆö÷"—2FVæ–VB(	Bæ@¢òò—B—2G&vâÆ÷rÂv–FRæB6Æ÷r×VÇ6–ær6ò—BæWfW"&VG22F†P¢òò6öæGV—G2r6†&vRvfRÂv†–6‚—2F†–âf7BÆ–æRà¢–b‡F†—2æ7&VWbbræ'E&ö&R’°¢6öç7B7"ÒF†—2æ7&VW°¢2ç6fR‚“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢6öç7BÒ6Æ×†7"æÆ–fR¢ãbÂÂ“°¢6öç7B&ö"ÒÖF‚ç6–â†7"ç‚’¢ãc°¢6öç7BrÒ2æ7&VFU&F–Äw&F–VçB†7"ç‚Â7"ç’Ò2ÂÂ7"ç‚Â7"ç’Ò2Â#“°¢ræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ#Ã3Âr²ƒãR¢’çFôf—†VBƒ"’²r’r“°¢ræFD6öÆ÷%7F÷ƒÂw&v&ƒƒÃCÃcÃ’r“°¢2æf–ÆÅ7G–ÆRÒs°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†7"ç‚Â7"ç’Ò2Â’Â’ÂÂÂr“²2æf–ÆÂ‚“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒw6÷W&6RÖ÷fW"s°¢2ævÆö&ÄÇ†Òã’¢°¢2æf–ÆÅ7G–ÆRÒr6#ƒ3cFs°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†7"ç‚ÒRÂ7"ç’²"“°¢2çVG&F–47W'fUFò†7"ç‚ÒbÂ7"ç’ÒÒ&ö"Â7"ç‚²"Â7"ç’Ò2²&ö"“°¢2çVG&F–47W'fUFò†7"ç‚²’Â7"ç’Ò"²&ö"Â7"ç‚²RÂ7"ç’²"“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢2ç7G&ö¶U7G–ÆRÒr6fc“f"s²2æÆ–æUv–GF‚Òã²2ç7G&ö¶R‚“°¢òòF‡&VRfVVÆW"F†÷&ç2ÂF†RöæÇ’'BF†B6—2v†–6‚v’—B—2vö–æp¢2ç7G&ö¶U7G–ÆRÒr6fcVcfBs²2æÆ–æUv–GF‚ÒãC²2æÆ–æT6Òw&÷VæBs°¢f÷"†ÆWB’ÒÓ²’ÃÒ²’²²’°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò†7"ç‚²’¢RÂ7"ç’Ò"“°¢2æÆ–æUFò†7"ç‚²’¢R²7"æF—"¢rÂ7"ç’Ò’ÒÖF‚ç6–â†7"ç‚²’’¢"ãB“°¢2ç7G&ö¶R‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòââææBF†RÆFRF†B—2vöæR7F—2vöæRÂf—6–&Ç“¢F÷&â6ö6¶WBv†W&P¢òò—B‡VærÂ6ò&&RæW7BwV&B—2æWfW"Ö—7F¶Vâf÷"öæR7F–ÆÂ†öÆF–ærà¢–b‡F†—2æ¶–æBÓÓÒvwV&BrbbF†—2çÆFU6†VBbbF†—2æFVB’°¢2ç6fR‚“°¢2ævÆö&ÄÇ†ÒãsS°¢2ç7G&ö¶U7G–ÆRÒr3vCF#S‚s²2æÆ–æUv–GF‚Òãc²2æÆ–æT6Òw&÷VæBs°¢6öç7B÷‚Ò7‚²F†—2æF—"¢‡F†—2çr¢ãR“°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†÷‚ÂF†—2ç’²F†—2æ‚¢ã#B“°¢2æÆ–æUFò†÷‚²F†—2æF—"¢BÂF†—2ç’²F†—2æ‚¢ãC"“°¢2æÆ–æUFò†÷‚ÂF†—2ç’²F†—2æ‚¢ãc"“°¢2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òò”ädU5BÂF†R6æ&Rw2†Æc¢F†R62Â7vVÆÆ–æröâF†R6Æ6²Örf÷"F†P¢òòv†öÆRÆ–×&VBÂv—F‚f–ÆÖVçB&V6†–ærF÷v&BF†RÖ6†–æR—B†0¢òò6†÷6VââÖ&W"f÷"F†Rf—'7B7G&WF6‚(	B—B—27F–ÆÂöæÇ’v&æ–ærÂæ@¢òòöæR†—BVæG2—B(	BF†Vâ7÷&RÖw&VVâf÷"F†RÆ7BÂv†–6‚—2F†R&V@¢òòv†W&R6†R†2'Vâ÷WBöbv–æF÷râF†Rf–ÆÖVçB—2F†R&VBF†BÖ¶W0¢òòF†RÖ÷fRf—#¢F†R&ööÒFVÆÇ2†W"t„”4‚Ö6†–æRÂ–âF–ÖRFò6†ö÷6Rà¢–b‡F†—2æ¶–æBÓÓÒw6æ&RrbbF†—2æFVBbb‡F†—2ç65BÇÂ’â’°¢6öç7B²ÒÒ6Æ×‡F†—2ç65Bò‡F†—2ç63ÇÂ’ÂÂ“°¢6öç7B†÷BÒ²âãc°¢6öç7B7‚Ò7‚Â7’ÒF†—2ç’²F†—2æ‚¢ã#C°¢6öç7B6öÂÒ†÷Bòr3–fff‚r¢DTÄÅô4ôÃ°¢2ç6fR‚“°¢–b‡F†—2æ†÷7BbbF†—2æ†÷7BæFVB’°¢6öç7B‡‚ÒF†—2æ†÷7Bç‚²F†—2æ†÷7Bçrò"Â‡’ÒF†—2æ†÷7Bç’²F†—2æ†÷7Bæ‚ò#°¢2ævÆö&ÄÇ†Òã"²²¢ãC°¢2ç7G&ö¶U7G–ÆRÒ6öÃ²2æÆ–æUv–GF‚ÒãS²2æÆ–æT6Òw&÷VæBs°¢2ç6WDÆ–æTF6‚…³2Â…Ò“²2æÆ–æTF6„öfg6WBÒ×W&f÷&Öæ6Rææ÷r‚’ò3ƒ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡7‚Â7’“°¢2çVG&F–47W'fUFò†ÆW'‡7‚Â‡‚ÂãR’ÂÖF‚æÖ–â‡7’Â‡’’Ò3BÂÆW'‡7‚Â‡‚Â²¢ã“"’ÂÆW'‡7’Â‡’Â²¢ã“"’“°¢2ç7G&ö¶R‚“²2ç6WDÆ–æTF6‚…µÒ“°¢òò&–ær6Æ÷6–æröâF†R6†÷6VâÖ6†–æR(	BF†R†öæW7B&÷VæF'’ÂÆ–¶P¢òòF†R&VVÂw2÷vâF6†VB&V6€¢2ævÆö&ÄÇ†Òã#R²²¢ãCS°¢2æÆ–æUv–GF‚Òãƒ°¢2æ&Vv–åF‚‚“²2æ&2†‡‚Â‡’ÂF†—2æ†÷7Bçr¢ã2Ò²¢F†—2æ†÷7Bçr¢ãRÂÂr“²2ç7G&ö¶R‚“°¢Ð¢òòF†R62—G6VÆbÂöâF†R&öG“¢—Bw&÷w2ÂæBF†Rw&÷wF‚—2F†R6Æö6°¢2ævÆö&ÄÇ†ÒãSR²²¢ãC°¢2æf–ÆÅ7G–ÆRÒ6öÃ°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R‡7‚Â7’Â2ãB²²¢RãBÂ2²²¢bã"ÂÂÂr“²2æf–ÆÂ‚“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†Òã2²ÖF‚ç6–â‡F†—2ææ–Ò¢ƒ²²¢#b’’¢ã#S°¢2æf–ÆÅ7G–ÆRÒ6öÃ²2ç6†F÷t6öÆ÷"Ò6öÃ²2ç6†F÷t&ÇW"Ò°¢2æ&Vv–åF‚‚“²2æ&2‡7‚Â7’Â"ãB²²¢2ãBÂÂr“²2æf–ÆÂ‚“°¢2ç6†F÷t&ÇW"Ò°¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòââææB”ädU5Bw2÷F†W"†Æc¢F†R6'&–W"ÂÖ&¶VBg&öÒF†RÖöÖVçB—B—0¢òò6VVFVBâ&VB&Vf÷&R—B—2F—66÷fW&VB(	BF†R6ÖRÆrF†RG&—G2vV"À¢òòæBF†R&V6öâF†R7÷&R&VB6'&–W"ÆVfW2—2FV6—6–öâ&÷WB¶–ÆÀ¢òò÷&FW"&F†W"F†ââÖ'W6‚à¢–b‡F†—2æ–æfW7FVBbbF†—2æFVB’°¢2ç6fR‚“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢6öç7BÂÒãCR²ÖF‚ç6–â‡F†—2ææ–Ò¢BãB’¢ã##°¢2ævÆö&ÄÇ†ÒÂ¢ãSS°¢2ç7G&ö¶U7G–ÆRÒr3–fff‚s²2æÆ–æUv–GF‚Òãc°¢2ç6WDÆ–æTF6‚…³2ÂUÒ“²2æÆ–æTF6„öfg6WBÒW&f÷&Öæ6Rææ÷r‚’òc°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†7‚ÂF†—2ç’²F†—2æ‚ò"ÂF†—2çr¢ãs"ÂF†—2æ‚¢ãs‚ÂÂÂr“°¢2ç7G&ö¶R‚“²2ç6WDÆ–æTF6‚…µÒ“°¢òòF‡&VRfV–ç27&vÆ–æröâF†R6†VÆÂÂöâF†V—"÷vâ6Æ÷r6Æö6°¢2ævÆö&ÄÇ†ÒÂ¢ãƒ°¢2ç7G&ö¶U7G–ÆRÒr3vFffs²2æÆ–æUv–GF‚Òã#²2æÆ–æT6Òw&÷VæBs°¢f÷"†ÆWB’Ò²’Â3²’²²’°¢6öç7B‚ÒF†—2ææ–Ò¢ãr²’¢"ã°¢6öç7BgƒÒ7‚²ÖF‚æ6÷2‡‚’¢F†—2çr¢ã3°¢6öç7Bg“ÒF†—2ç’²F†—2æ‚¢ƒã#R²’¢ã#R“°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡gƒÂg““°¢2çVG&F–47W'fUFò‡gƒ²ÖF‚ç6–â‡‚’¢bÂg“²BÂgƒ²ÖF‚æ6÷2‡‚¢ã2’¢’Âg“²r“°¢2ç7G&ö¶R‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢–b†6†æ6Rƒãr’’FE'B†7‚²&æB‚×F†—2çr¢ãRÂF†—2çr¢ãR’ÂF†—2ç’²&æBƒÂF†—2æ‚’À¢&æB‚ÓÂ’Â&æB‚Ó3ÂÓ‚’ÂãRÂr3–fff‚rÂãrÂÓ#ÂG'VR“°¢Ð¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÐ¢òò´”ätDôÒ‚u2D…$TR$TE2ÂG&vâ–âv÷&ÆB76R&V6W6RWfW'’öæRö`¢òòF†VÒF‡&VFVç2Æ6RF†R&öG’—2æ÷BâF†R†÷W6R'VÆR—2v÷&âF†P¢òò6ÖRv’F†R÷F†W"f—fRvV"—C¢Ô$U"v†–ÆR—B—2öæÇ’v&æ–ærÀ¢òò6VÒÖ&ÇVRöæ6R—B—2&VÂ(	BæBF†RGvòæ6†÷&VBFòF†RdÄôõ"&P¢òò7W&W76VBVæFW"ræ'E&ö&Rv—F‚WfW'’÷F†W"w&÷VæBe‚6òF†R&–&ÆP¢òò†&æW72ÖV7W&W2fVWB&F†W"F†âv†B—2Æ—BVæFW"F†VÒà¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòd4UC¢F†R7G&—öbfÆö÷"&V†–æBF†RÖ6†–æRâG&vâB—G2E%TRW‡FVç@¢òòg&öÒF†Rf—'7Bg&ÖRöbF†R6ö–Â(	BF6†VBÖ&W"Â'&–v‡FVæ–ærv—F‚F†P¢òòf–ÆÂ(	B6òF†Rw&÷VæB—B—2&÷WBFò7vVW—2ÆVv–&ÆR&Vf÷&RF†R&öG¢òò†2Ö÷fVBBÆÂâ6öÆ–B6VÒÖ&ÇVRöæÇ’f÷"F†Rf–gF‚öb6V6öæB—B—0¢òò&VÆÇ’F†W&RÂæBg&÷¦Vâv†W&RF†RÖ&W"&öÖ—6VB—Bv÷VÆB&Rà¢–b‡F†—2æ¶–æBÓÓÒv7&vÆW"rbbF†—2æFVBbbræ'E&ö&P¢bb‡F†—2æf6WEBâÇÂ‡F†—2æÆæ6UBÇÂ’â’’°¢6öç7BÆ—fRÒ‡F†—2æÆæ6UBÇÂ’â°¢6öç7Bg2ÒÆ—fP¢ò²ƒ¢F†—2æÆæ6U‚Â“¢F†—2æÆæ6U’Âs¢d4UEõ$T4‚Âƒ¢F†—2æÆæ6T‚Ð¢¢f6WE7G&—‡F†—2“°¢6öç7B²ÒÆ—fRò6Æ×‡F†—2æÆæ6UBòd4UEôÄ•dRÂÂ’¢F†—2æf6WC°¢2ç6fR‚“°¢–b‚Æ—fR’°¢2ævÆö&ÄÇ†Òãb²²¢ãC°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚ÒãC°¢2ç6WDÆ–æTF6‚…³BÂeÒ“²2æÆ–æTF6„öfg6WBÒ×W&f÷&Öæ6Rææ÷r‚’òCS°¢2æ&Vv–åF‚‚“²2ç&V7B†g2ç‚Âg2ç’Âg2çrÂg2æ‚“²2ç7G&ö¶R‚“°¢2ç6WDÆ–æTF6‚…µÒ“°¢òòF†Rf6WB—G6VÆbÂf–ÆÆ–æröâF†R7–æR(	BF†R6V6öæB6†ææVÂÂöâF†P¢òò&öG’Â6òF†RÖ6†–æRF†B÷vç2—G2÷vâ&6²—2&VBg&öÒ—G26†P¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†Òã3R²²¢ãS°¢2æf–ÆÅ7G–ÆRÒDTÄÅô4ôÃ²2ç6†F÷t6öÆ÷"ÒDTÄÅô4ôÃ²2ç6†F÷t&ÇW"Òs°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†7‚ÒRÂF†—2ç’²2“°¢2æÆ–æUFò†7‚ÂF†—2ç’ÒÒ²¢B“°¢2æÆ–æUFò†7‚²RÂF†—2ç’²2“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢2ç6†F÷t&ÇW"Ò°¢ÒVÇ6R°¢òòF†RÆæ6S¢fÆBæRöb7Æ—BÆ–v‡BÇ––æröâF†RfÆö÷"—B7vWBÀ¢òòfF–ær÷WB7&÷72—G2÷vâ6†÷'BÆ–fP¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†ÒãR¢²²ã#S°¢6öç7BÆrÒ2æ7&VFTÆ–æV$w&F–VçB†g2ç‚Âg2ç’Âg2ç‚Âg2ç’²g2æ‚“°¢ÆræFD6öÆ÷%7F÷ƒÂw&v&ƒC2Ã#3"Ã#SRÃ’r“°¢ÆræFD6öÆ÷%7F÷ƒÂw&v&ƒC2Ã#3"Ã#SRÃãƒR’r“°¢2æf–ÆÅ7G–ÆRÒÆs°¢2æf–ÆÅ&V7B†g2ç‚Âg2ç’Âg2çrÂg2æ‚“°¢2ævÆö&ÄÇ†Òãb¢²²ã3°¢2ç7G&ö¶U7G–ÆRÒr6Cfcffbs²2æÆ–æUv–GF‚ÒãS²2æÆ–æT6Òw&÷VæBs°¢f÷"†ÆWB’Ò²’ÂC²’²²’°¢6öç7BÇƒ"Òg2ç‚²g2çr¢ƒã"²’¢ã#R“°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†Çƒ"Âg2ç’²g2æ‚“°¢2æÆ–æUFò†Çƒ"²†’ÒãR’¢"ãBÂg2ç’²g2æ‚¢ƒãR²ƒÒ²’¢ã3R’“°¢2ç7G&ö¶R‚“°¢Ð¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òò$Te$5C¢F†R–çFVBÆæF–ær7÷BâF†—2—2F†Rv†öÆRÖ÷fR(	BF†R&2—0¢òòÆÆ÷vVBFòÆ–R&V6—6VÇ’&V6W6RF†RdÄôõ"FöW2æ÷B(	B6ò—B—2Æ—Bg&öÐ¢òòF†Rf—'7Bg&ÖRöbF†R7&÷V6‚Â7F—2Æ—Bf÷"F†RVçF—&RfÆ–v‡BÂæ@¢òò&VG2BvÆæ6R2Æ6R&F†W"F†ââVffV7C¢6W7F–2VÆÆ—6P¢òòv—F‚F†R7'—7FÂw2÷vâ7&÷72–â—BÂVÇ6–æröâ—G2÷vâ6Æö6²à¢–b‡F†—2æ¶–æBÓÓÒv†÷W"rbbF†—2æFVBbbræ'E&ö&RbbF†—2æÖ&µ‚ÒçVÆÂ’°¢6öç7BÖ²ÒãCR²F†—2æ&VæC¢ãSS°¢6öç7BVÇ6RÒãs"²ÖF‚ç6–â‡F†—2ææ–Ò¢r’¢ã#ƒ°¢2ç6fR‚“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†Òã3B¢Ö²¢VÇ6S°¢6öç7BÖrÒ2æ7&VFU&F–Äw&F–VçB‡F†—2æÖ&µ‚ÂF†—2æÖ&µ’Ò"ÂÂF†—2æÖ&µ‚ÂF†—2æÖ&µ’Ò"Â3“°¢ÖræFD6öÆ÷%7F÷ƒÂr6ffC#vr“²ÖræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ#Ã#"Ã’r“°¢2æf–ÆÅ7G–ÆRÒÖs°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R‡F†—2æÖ&µ‚ÂF†—2æÖ&µ’Ò"Â#‚ÂÂÂÂr“²2æf–ÆÂ‚“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒw6÷W&6RÖ÷fW"s°¢2ævÆö&ÄÇ†Òã3R²ãCR¢Ö³°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚Òãc°¢2ç6WDÆ–æTF6‚…³RÂUÒ“²2æÆ–æTF6„öfg6WBÒW&f÷&Öæ6Rææ÷r‚’òSS°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R‡F†—2æÖ&µ‚ÂF†—2æÖ&µ’Ò"Âb¢Ö²²bÂb¢Ö²²"ãRÂÂÂr“°¢2ç7G&ö¶R‚“²2ç6WDÆ–æTF6‚…µÒ“°¢òòF†R7&÷73¢Gvòf6WBÆ–æW2F‡&÷Vv‚F†RÖ&²ÂF†R–7GW&RF†B6—0¢òò&Æ–v‡BÆæFVB†W&R"&F†W"F†â'6öÖWF†–ær—2vÆ÷v–ær ¢2ævÆö&ÄÇ†Òã2²ãB¢Ö³°¢2æÆ–æUv–GF‚Òã#²2æÆ–æT6Òw&÷VæBs°¢f÷"†6öç7Böb³ãC"ÂÓãC%Ò’°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò‡F†—2æÖ&µ‚ÒÖF‚æ6÷2†’¢RÂF†—2æÖ&µ’Ò"ÒÖF‚ç6–â†’¢R“°¢2æÆ–æUFò‡F†—2æÖ&µ‚²ÖF‚æ6÷2†’¢RÂF†—2æÖ&µ’Ò"²ÖF‚ç6–â†’¢R“°¢2ç7G&ö¶R‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòtÄ”åC¢F†R7Æ–çFW'2†æv–ærv†W&RF†RF—fR76VBâæ÷Bw&÷VæBe‚(	@¢òòF†Rv†öÆRö–çB—2F†BF†W’&R–âF†R•"(	B6òæò'E&ö&RwV&BÂæ@¢òòæò6†F÷rVæFW"F†VÒV—F†W"âÖ&W"Â†öÆÆ÷ræBw&÷v–ærv†–ÆRF†W’&P¢òò&Ö–æræB6ææ÷BF÷V6‚†W#²6VÒÖ&ÇVRÂ6öÆ–BæB6†'ÖVFvVBf÷"F†P¢òò&VBF†W’6ââGvòF–ffW&VçB6†W2Âæ÷BGvòF–ffW&VçB'&–v‡FæW76W3 ¢òòF†R&VB†2Fò7W'f—fR&V–ærvÆæ6VBBà¢–b‡F†—2æ¶–æBÓÓÒv&BrbbF†—2æÖ÷FW2bbF†—2æÖ÷FW2æÆVæwF‚’°¢2ç6fR‚“°¢f÷"†6öç7BröbF†—2æÖ÷FW2’°¢–b†ræ&Òâ’°¢6öç7B²ÒÒ6Æ×†ræ&ÒòtÄ”åEô$ÒÂÂ“°¢2ævÆö&ÄÇ†Òã#R²²¢ãS°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚Òã3°¢2ç6WDÆ–æTF6‚…³2ÂEÒ“²2æÆ–æTF6„öfg6WBÒ×W&f÷&Öæ6Rææ÷r‚’òS°¢2æ&Vv–åF‚‚“²2æ&2†rç‚Ârç’ÂtÄ”åEõ"¢ƒã3R²²¢ãcR’ÂÂr“²2ç7G&ö¶R‚“°¢2ç6WDÆ–æTF6‚…µÒ“°¢6öçF–çVS°¢Ð¢6öç7BfFRÒ6Æ×†ræÆ–fRòã2ÂÂ“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†ÒãR¢fFS°¢2æf–ÆÅ7G–ÆRÒr3†fS†fbs²2ç6†F÷t6öÆ÷"Òr3†fS†fbs²2ç6†F÷t&ÇW"Ò“°¢2æ&Vv–åF‚‚“°¢f÷"†ÆWB’Ò²’Âc²’²²’²òò6—‚×ö–çB7Æ–çFW ¢6öç7BÒ’¢ÖF‚å’ò2²F†—2ææ–Ò¢ãƒ°¢6öç7B"Ò’R"òtÄ”åEõ"¢ãC"¢tÄ”åEõ#°¢5¶’òvÆ–æUFòr¢vÖ÷fUFòuÒ†rç‚²ÖF‚æ6÷2†’¢"Ârç’²ÖF‚ç6–â†’¢"“°¢Ð¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢2ç6†F÷t&ÇW"Ò°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒw6÷W&6RÖ÷fW"s°¢2ævÆö&ÄÇ†Òã’¢fFS°¢2ç7G&ö¶U7G–ÆRÒr6Cfcffbs²2æÆ–æUv–GF‚Òã°¢2ç7G&ö¶R‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòF†R&–ÖRw26—&6ÆR—2F†R$TBÂG&vâ–âv÷&ÆB76R2F†RE%TR†—@¢òò6†R(	B6—&6ÆRöâF†R&öG’w26VçG&RÂ&V6W6RF†R6æFW7G2W†7FÇ¢òòF†B6—&6ÆRæBfÆö÷"VÆÆ—6Rv÷VÆBÆ–R&÷WBF†R—"âg&÷7B6¶–âÀ¢òòÖ&W"BF†Rw&÷v–ærVFvR†v&æ–ær—2Ö&W"WfW'—v†W&R–âF†—2vÖR“°¢òòFævW"&VBöæÇ’f÷"F†RöæR&VBF†R6—&6ÆR—2&VÂ‡F†R&Vv—7G'’w0¢òò&VÖFVæ–Â‡VRÂv÷&âBF†RÖöÖVçBF†R&VFVæ–W2¢–b‡F†—2æ¶–æBÓÓÒw&–ÖRrbbF†—2æFVBbb‚‡F†—2ç&–æu"ÇÂ’â"ÇÂ‡F†—2ç6æBÇÂ’â’’°¢6öç7B'’ÒF†—2ç’²F†—2æ‚ò#°¢2ç6fR‚“°¢–b‚‡F†—2ç&–æu"ÇÂ’â"’°¢6öç7B"ÒF†—2ç&–æu#°¢6öç7B†VÆBÒ"ãÒ‡F†—2ç&–ætÖ‚ÇÂ#’Ò²òòF†RVFvR†2'&—fV@¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢òòF†R6öÆBf–ÆÆ–ærF†R6—&6ÆRÂF†–â(	B&W6Væ6RÂæ÷B÷6—G¢6öç7BfrÒ2æ7&VFU&F–Äw&F–VçB†7‚Â'’Â"¢ã2Â7‚Â'’Â"“°¢fræFD6öÆ÷%7F÷ƒÂw&v&ƒc‚Ã##‚Ã#CBÃ’r“°¢fræFD6öÆ÷%7F÷ƒÂw&v&ƒc‚Ã##‚Ã#CBÃãb’r“°¢2æf–ÆÅ7G–ÆRÒfs°¢2æ&Vv–åF‚‚“²2æ&2†7‚Â'’Â"ÂÂr“²2æf–ÆÂ‚“°¢òòF†R&÷VæF'’—G6VÆc¢g&÷7BÆ–æRVæFW"âÖ&W"F6†VB&–Ò(	BF†P¢òò6ÖRÖ&W"F†R&öG’vV'2Â&V6W6RF†W’&RF†R6ÖRv&æ–æp¢2ç7G&ö¶U7G–ÆRÒw&v&ƒ#3Ã#SÃ#SRÃãSR’s²2æÆ–æUv–GF‚Ò#°¢2æ&Vv–åF‚‚“²2æ&2†7‚Â'’Â"ÂÂr“²2ç7G&ö¶R‚“°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚Ò†VÆBò"ãB¢ãc°¢2ævÆö&ÄÇ†Ò†VÆBòã‚²ÖF‚ç6–â‡F†—2ææ–Ò¢#b’¢ã"¢ãSS°¢2ç6WDÆ–æTF6‚…³bÂeÒ“²2æÆ–æTF6„öfg6WBÒ×W&f÷&Öæ6Rææ÷r‚’òC°¢2æ&Vv–åF‚‚“²2æ&2†7‚Â'’Â"ÂÂr“²2ç7G&ö¶R‚“²2ç6WDÆ–æTF6‚…µÒ“°¢Ð¢–b‚‡F†—2ç6æBÇÂ’â’°¢òòF†R6æ¢F†R6—&6ÆR—2$TÂf÷"öæRfÆ6‚ÂF†Vâ—B—2vöæP¢6öç7BÒ6Æ×‡F†—2ç6æBòã#"ÂÂ’Â"ÒF†—2ç6æ"ÇÂ°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢6öç7B6rÒ2æ7&VFU&F–Äw&F–VçB†7‚Â'’Â"Â7‚Â'’Â"“°¢6ræFD6öÆ÷%7F÷ƒÂw&v&ƒ#3Ã#SÃ#SRÂr²ãR¢²r’r“°¢6ræFD6öÆ÷%7F÷ƒãsRÂw&v&ƒ#SRÃ“RÃ’Âr²ã2¢²r’r“°¢6ræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ“RÃ’Âr²ãCR¢²r’r“°¢2æf–ÆÅ7G–ÆRÒ6s°¢2æ&Vv–åF‚‚“²2æ&2†7‚Â'’Â"ÂÂr“²2æf–ÆÂ‚“°¢2ç7G&ö¶U7G–ÆRÒr6fcVcfBs²2ævÆö&ÄÇ†Ò²2æÆ–æUv–GF‚Ò"ãc°¢2æ&Vv–åF‚‚“²2æ&2†7‚Â'’Â"ÂÂr“²2ç7G&ö¶R‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òò´”ätDôÒBu2Etò”å5E%TÔTåE2ÂG&vâ–âv÷&ÆB76Rf÷"F†R6ÖR&V6öà¢òòF†R6ö–Âw26—&6ÆR—3¢F†W’&Ræ÷BöâF†RÖ6†–æRÂF†W’&RöâF†P¢òòdÄôõ"ÂæBF†RfÆö÷"—2F†RF†–ær6†R†2Fòç7vW"â&÷F‚&RG&và¢òòWfVâv†–ÆRF†V—"÷væW"—2F&²÷"7FvvW&VB(	B&V6÷&BFöW2æ÷B7F÷ ¢òò&V–ær&V6÷&B&V6W6RF†RÖ6†–æRF†Bf–ÆVB—B—2F÷vâà¢–b‚F†—2æFVB’²G&u&–ÖT6&B†2ÂF†—2“²G&t&Æ÷B†2ÂF†—2“²Ð¢òò5$õ55$Tc¢F†R7vVWvö–ær÷WBÂæBF†RÖ&²—BÆVfW2öâv†öWfW"—@¢òò&V6†VBâGvò6†ææVÇ2Â&V6W6RÖ÷fRF†B6†ævW2F†R&ööÒæB6†÷w0¢òòæ÷F†–ær—2Ö÷fR6†R6ææ÷B&VBà¢–b‚F†—2æFVBbb‡F†—2ç&VeBÇÂ’â’°¢6öç7B²ÒÒ6Æ×‡F†—2ç&VeBò5$õ55$TeõDTÄÂÂÂ“°¢2ç6fR‚“°¢2ævÆö&ÄÇ†ÒãR¢ƒÒ²¢ãR“°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚Ò"Ò³°¢2ç6WDÆ–æTF6‚…³2Â•Ò“²2æÆ–æTF6„öfg6WBÒ×W&f÷&Öæ6Rææ÷r‚’ò3°¢2æ&Vv–åF‚‚“²2æ&2†7‚ÂF†—2ç’²F†—2æ‚¢ãBÂ‚²²¢„5$õ55$Teõ"¢ãb’ÂÂr“²2ç7G&ö¶R‚“°¢2ç6WDÆ–æTF6‚…µÒ“°¢òòF†RG&vW"VFvRÆ–gF–æröâF†R&öG“¢F†R7vVW†26÷W&6P¢2ævÆö&ÄÇ†Òãb²ÖF‚ç6–â‡F†—2ææ–Ò¢#B’¢ã3°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚Ò#²2æÆ–æT6Òw&÷VæBs°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò†7‚Ò‚ÂF†—2ç’Ò2Ò²¢B“²2æÆ–æUFò†7‚²‚ÂF†—2ç’Ò2Ò²¢B“²2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢–b‚F†—2æFVBbb‡F†—2ç&VfBÇÂ’â’°¢òòd”ÄTC¢ÆR–æFW‚F–6²÷fW"Ö6†–æRF†R7vVW§W7Bvö¶P¢6öç7BÒ6Æ×‡F†—2ç&VfBòã’ÂÂ“°¢2ç6fR‚“°¢2ævÆö&ÄÇ†ÒãƒR¢°¢2ç7G&ö¶U7G–ÆRÒr66fS–fbs²2æÆ–æUv–GF‚ÒãS°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò†7‚ÒBÂF†—2ç’Ò“²2æÆ–æUFò†7‚²BÂF†—2ç’Ò“°¢2æÖ÷fUFò†7‚ÒBÂF†—2ç’Ò‚“²2æÆ–æUFò†7‚²"ÂF†—2ç’Ò‚“²2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòF†R6æ&Rw2FVæG&–Â—2F†R$TBÂG&vâ–âv÷&ÆB76R&V6W6RF†RÆ–æP¢òò—BF‡&VFVç2'Vç2g&öÒF†R&öG’Fò„U"âF‡&÷Vv‚F†RFVÆÂ—B7G&WF6†W0¢òò÷WBæB†÷fW'2†Ö&W"(	Bv&æ–ær—2Ö&W"WfW'—v†W&R–âF†—2vÖRÀ¢òòæBF†R&V6‚&÷VæF'’—2F6†VBBF†RFöÆB&F—W26òF†RÆF6€¢òò6—&6ÆRæWfW"Æ–W2“²F‡&÷Vv‚F†R&VVÂ—B—2FWBæB–æfV7F–öâ×&VB(	@¢òòF†R&Vv—7G'’w2FævW"‡VRÂv÷&âBF†RÖöÖVçBF†RÆ–æR—2&VÀ¢–b‡F†—2æ¶–æBÓÓÒw6æ&RrbbF†—2æFV@¢bb‚‡F†—2æ7&÷V6…BÇÂ’âÇÂ‡F†—2ç&VVÅBÇÂ’â’’°¢6öç7B7’ÒF†—2ç’²F†—2æ‚¢ã#ƒ°¢6öç7BG‚ÒÆ–W"òÆ–W"ç‚²Æ–W"çrò"¢7ƒ°¢6öç7BG’ÒÆ–W"òÆ–W"ç’²Æ–W"æ‚ò"¢7“°¢2ç6fR‚“°¢–b‚‡F†—2æ7&÷V6…BÇÂ’â’°¢6öç7B²ÒÒ6Æ×‡F†—2æ7&÷V6…BòDTÄÅô„Te’ÂÂ“°¢6öç7B"ÒF†—2ç&V6…"ÇÂS°¢òòF†RFöÆB&V6ƒ¢F–ÒF6†VB&2BF†RÆF6‚&F—W2(	BF†R†öæW7@¢òò&÷VæF'’ÂÆ–¶RF†R&–ÖRw2†VÆB&–ærÂG&vâÆ÷r6ò—B&VG20¢òòw&÷VæBF†RÆ–æR6â6Æ–Ð¢2ævÆö&ÄÇ†Òãb²²¢ã3°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚Òãc°¢2ç6WDÆ–æTF6‚…³RÂuÒ“²2æÆ–æTF6„öfg6WBÒ×W&f÷&Öæ6Rææ÷r‚’òS°¢2æ&Vv–åF‚‚“²2æ&2†7‚Â7’Â"ÂÂr“²2ç7G&ö¶R‚“²2ç6WDÆ–æTF6‚…µÒ“°¢òòF†RFVæG&–ÂÂw&÷v–ærF÷v&B†W"7&÷72F†Rv†öÆRFVÆÂæB†÷fW&–æp¢òò§W7B6†÷'B(	Bv†Vâ—B6âF÷V6‚F†RG&v–æröb–÷RÂ—B6âF¶R–÷P¢6öç7Bv²ÒÖF‚æÖ–âƒÂ²¢ã#R“°¢6öç7BW‚ÒÆW'†7‚ÂG‚Âv²¢ãƒb’ÂW’ÒÆW'‡7’ÂG’Âv²¢ãƒb“°¢2ævÆö&ÄÇ†Òã3R²²¢ãCS°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚Ò"ãbÒ²¢ãƒ²2æÆ–æT6Òw&÷VæBs°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò†7‚Â7’“°¢2çVG&F–47W'fUFò†ÆW'†7‚ÂW‚ÂãR’ÂÖF‚æÖ–â‡7’ÂW’’Ò#bÒ²¢ÂW‚ÂW’“°¢2ç7G&ö¶R‚“°¢òòF†R÷Vâ†öö²B—G2F—ÂV–6¶Væ–æröâF†R&öG’w2÷vâVÇ6P¢2ævÆö&ÄÇ†ÒãR²ÖF‚ç6–â‡F†—2ææ–Ò¢ƒB²²¢#"’’¢ã3°¢2æf–ÆÅ7G–ÆRÒDTÄÅô4ôÃ²2ç6†F÷t6öÆ÷"ÒDTÄÅô4ôÃ²2ç6†F÷t&ÇW"Ò“°¢2æ&Vv–åF‚‚“²2æ&2†W‚ÂW’Â"ã"²²¢ã‚ÂÂr“²2æf–ÆÂ‚“°¢2ç6†F÷t&ÇW"Ò°¢ÒVÇ6R°¢òòÄD4„TC¢F†RÆ–æR—2&VÂ(	BFWBÂ&VBÂf–'&F–ærv—F‚F†R&VVÀ¢6öç7B¦—BÒÖF‚ç6–â‡F†—2ææ–Ò¢Cb’¢"ã#°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†Òãs°¢2ç7G&ö¶U7G–ÆRÒr6fcFCFBs²2æÆ–æUv–GF‚Ò"ãC²2æÆ–æT6Òw&÷VæBs°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò†7‚Â7’“°¢2çVG&F–47W'fUFò†ÆW'†7‚ÂG‚ÂãR’ÂÆW'‡7’ÂG’ÂãR’²¦—BÂG‚ÂG’“°¢2ç7G&ö¶R‚“°¢2ævÆö&ÄÇ†Òã3S°¢2ç7G&ö¶U7G–ÆRÒr6fc––s²2æÆ–æUv–GF‚Ò°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò†7‚Â7’“°¢2çVG&F–47W'fUFò†ÆW'†7‚ÂG‚ÂãR’ÂÆW'‡7’ÂG’ÂãR’Ò¦—BÂG‚ÂG’“°¢2ç7G&ö¶R‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòUdU%’t”äBÕUtT%2D„R4ÔR4ôÄõU"†G&tVæV×•FVÆÂÂ&VÆ÷rF†R6Æ72¢G&tVæV×•FVÆÂ†2ÂF†—2Â7‚“°¢òòF†R6²w2&öG’—2Ç&VG’F÷vâ†&÷fR“²æ÷F†–ær&VÆ÷r—2—G2&öG¢–b†&V7D&öG’’&WGW&ã°¢òòvÆ¶W"öâd”ÄÔTB5E$”DRG&w2F†B–ç7FVB„%EõTUTR*s&62Ö—b÷b“°¢òòF†RGW&çF&ÆR&VÆ÷r¶VW2WfW'—F†–ærF†R7G&——2æ÷B(	BGW&ç2ÂFVÆÇ2À¢òòF†RG&—ÂF†R6†VBÆFP¢–b†G&u&÷7FW%vÆ²†2ÂF†—2Â7‚’’&WGW&ã°¢òò&R×&VæFW&VB4BGW&æ&÷VæBâ6VÆV7FVB'’ævÆRÂæWfW"Ö—'&÷&VBÂ6òF†R&¶V@¢òò¶W’Æ–v‡B7F—2öâF†R6÷'&V7B6–FR2F†RÖ6†–æRGW&ç2à¢–b†G&tFÆ2†2ÂF†—2æ¶–æBÂF†—2æf6Uf—2Â7‚ÂF†—2ç’²F†—2æ‚ÂF†—2æ‚Â°¢fÆ6ƒ¢F†—2æ‡W'EBâò¢À¢6†&Ó¢F†—2æ‡—æõBâò¢À¢w&÷VæFVC¢F†—2æ¶–æBÓÒvfÆ–W"rÀ¢C¢F†—2ææ–ÒÂgƒ¢F†—2çg‚Âg“¢F†—2çg’À¢ÖöFS¢²wV&C¢wvÆ²rÂ&Æö#¢wVÇ6RrÂfÆ–W#¢v†÷fW"rÂGW'&WC¢v'&VF†RrÕ·F†—2æ¶–æEÒÇÂv'&VF†RrÀ¢òòF†RG&—FVÆÂÂ†æFVBFòF†RWWC¢F†RWF†÷&VB6†VWB†2öæP¢òò÷6RÂ6òF†RvF†W&–æræBF†R&VÆV6R†fRFò&RFVf÷&ÖF–öà¢6s¢F†—2æG&—ÇÂÂ&V#¢‡F†—2æ&Æö%&V"ÇÂ’ò$Äô%õ$T"À¢–u66ã¢VæV×•–r‡F†—2’À¢òòF†Rv—Bw26Æö6²—2F†RfÆö÷"—B†26÷fW&VB†Ö÷fTVçBw2vÆ´B’À¢òòæBF†R7FFR—B—2–â†2÷6Röb—G2÷vâ†VæV×”FÆ5÷6R¢F—7C¢F†—2çvÆ´BÇÂÀ¢÷6S¢VæV×”FÆ5÷6R‡F†—2’À¢Ò’’&WGW&ã°¢2ç6fR‚“°¢–b‡F†—2æ‡W'EBâ’²2ævÆö&ÄÇ†Òãc²Ð¢2çG&ç6ÆFR†7‚Â7’“°¢òòf—'W2vÆ—F6‚(	BF†R–æfV7F–öâÖ¶W2F†R&öG’7GWGFW ¢–b†6†æ6RƒãB’’2çG&ç6ÆFR‡&æB‚ÓãRÂãR’Â&æB‚ÓãRÂãR’“°¢6öç7BfÆ—ÒfÆ—3°¢2ç66ÆR†fÆ—Â“°¢òòÇv—2Ööâ$TBW–W3¢F†R–æfV7F–öâÖ&¶W"(	Bg&–VæFÆ–W2æWfW"†fRF†W6P¢òòöæR&V6W76VB6Vç6÷"Âæ÷BGvòfÆB&VB7V&W2â6†&ÖVBÖ–Ö–2vöW27–âÀ¢òò&V6W6RF†R6öær†2V–WFVB—G2÷&FW'2f÷"ÖöÖVçBà¢6öç7BW–W2Ò‡‚Â’Â2’Óâ°¢6öç7B7BÒF†—2æ‡—æõBâòvÆW'Br¢‡F†—2ç7FuBâòv÷fW&G&—fRr¢vÆö6¶VBr“°¢G&u6Vç6÷"†2Â‚²2¢ã’Â’²2¢ãbÂ2¢ãc"Â7BÂF†—2ææ–Ò“°¢–ædW–TÖ&²†2Â‚²2¢ã’Â’²2¢ãb“°¢Ó°¢òò6†FVBÖWFÂ&öG’w&F–VçB‡F÷ÖÆ—B(i"F&²&VÆÇ’’f÷"F–ÖVç6–öæÆ—G¢6öç7BVrÒ2æ7&VFTÆ–æV$w&F–VçBƒÂÓ"ÂÂB“°¢VræFD6öÆ÷%7F÷ƒÂr3cfSƒ"r“²VræFD6öÆ÷%7F÷ƒãSRÂr3CSFccr“²VræFD6öÆ÷%7F÷ƒÂr3#ƒ362r“°¢òòÒÒÒÒöæRf7F–öâÂf—fR7V6–W2ÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòF†W6R&R#bÓ3G‚FÆÂ–âÆ’Â6òF†W’&RFW6–væVBBF†B6—¦S¢F†P¢òò6–Æ†÷VWGFR6'&–W2F†R&V6övæ—F–öâæBFWF–Â—27VçBöæÇ’v†W&R—@¢òò6W&FW2öæRÖ6†–æRg&öÒæ÷F†W"âV6‚7F–ÆÂ&VG22F†R¦ö"—BW6VBFð¢òòFò…5Dõ%’æÖC¢Ö–Ö–2¶VW2—G2v÷&²Â—BöæÇ’7F÷26&–ærv†BF†Rv÷&°¢òòFöW2Fò–÷R’ÂæBV6‚÷vç2F—7F–æ7B&6RvVöÖWG'’6òæòGvò6†&Rà¢òò÷WFÆ–æS¢&Æö"Ò6vv–ærFöÖRÂfÆ–W"ÒW&R6—&6ÆRÂGW'&WBÒ&ö÷FV@¢òòG&W¦ö–Bâ…F†R7&vÆW"w2vVFvRæBF†R†÷W"w2FV&G&÷&RvöæS¢F†÷6P¢òòGvò&RÇv—2F†R6²÷"F†R6†VWF‚Æ–æRæ÷rÂæWfW"&ö6VGW&Â&öG’â¢6öç7BTÂÒ‡G—VöbTÄTÒÓÒwVæFVf–æVBrbbG—VöbÔ”Ô”5ôTÂÓÒwVæFVf–æVBrbbTÄTÕ´Ô”Ô”5ôTÅ·F†—2æ¶–æEÕÒ’ÇÂ²6öÃ¢r3†&#RrÂvÆ÷s¢r66fS6VbrÓ°¢òòFW&—fVBg&öÒF†RåTÄÂÕ4TT´U"E$”ÄÄU"F†B'VÆW2¦öæR¢F†RÖ–æ–öç2&P¢òò'V–ÇB÷WBöbF†R6ÖRÖFW&–Ç22F†R&÷72Â6ò&ööÒ&VG22öæRfÖ–Ç’à¢òò6W&Ö–2—2F†R&Ö÷W"Â7FVVÂF†Rg&ÖRÂ'&öç¦RF†R¦ö–çG2(	BæBV6‚'@¢òòvWG2—G2÷vâÆ–v‡B†—2–ç7FVBöböæRw&F–VçB÷fW"WfW'—F†–ærà¢6öç7BÆFRÒ‡F‚Â“Â“Â²’Óâ²2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2ÂÓ‚Â“Â‚Â“Â²“²F‚‚“²2æf–ÆÂ‚“²Ó°¢6öç7Bg&ÖRÒ‡F‚Â“Â“Â²’Óâ²2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBç7FVVÂÂÓ‚Â“Â‚Â“Â²“²F‚‚“²2æf–ÆÂ‚“²Ó°¢6öç7B¦ö–çBÒ†§‚Â§’Â§"’Óâ°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂ§‚Ò§"Â§’Ò§"Â§‚²§"Â§’²§"“°¢2æ&Vv–åF‚‚“²2æ&2†§‚Â§’Â§"ÂÂr“²2æf–ÆÂ‚“°¢ö66Â†2Â§‚Â§’²§"¢ãbÂ§"¢ãBÂ§"¢ã‚ÂãB“°¢Ó°¢6öç7B6VÒÒ‡ƒÂ“ÂƒÂ“Â’Óâ²òòFF—F—fRæVÂÆ–æRÂæWfW"&Æ6°¢2ç7G&ö¶U7G–ÆRÒw&v&ƒ“Ã#BÃ#3RÂr²†ÇÂã#"’²r’s²2æÆ–æUv–GF‚Òãs°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡ƒÂ““²2æÆ–æUFò‡ƒÂ““²2ç7G&ö¶R‚“°¢Ó°¢6öç7B66VçBÒ†fâÂvÆ÷r’Óâ²òòVÆVÖVçBFVÆÃ¢ÖFW&–ÂÂæ÷BW–W0¢2æf–ÆÅ7G–ÆRÒTÂæ6öÃ°¢–b†vÆ÷r’²2ç6†F÷t6öÆ÷"ÒTÂæ6öÃ²2ç6†F÷t&ÇW"ÒS²Ð¢fâ‚“²2ç6†F÷t&ÇW"Ò°¢Ó°¢7v—F6‚‡F†—2æ¶–æB’°¢66Rv&Æö"s¢°¢òò%%UB(	Bf÷VæG'’7–ÆÆvRF†B6ööÆVB–çFò6öÖWF†–ærv—F‚ÆVw2âF†RöæÇ¢òò7–ÖÖWG&–2Ö–Ö–3¢—B6w2ÂæB—B†2F‡&VR7GV&'’ÆVw2Âæ÷Bf÷W"à¢6öç7B‚ÒF†—2ææ–Ò¢S°¢6öç7BVÇ6RÒãSR²ÖF‚ç6–â‡‚’¢ãCS°¢òòD„RDTÄÂ•2D„R4„Râ6r&—6W2F‡&÷Vv‚F†RF†—&Böb6V6öæB&Vf÷&P¢òò—BG&—3²&V"—2F†RfÆB&V&÷VæBgFW"F†RG&÷ÆWG2vòâ&÷F‚Ö÷fP¢òòF†RõUDÄ”äR(	B&öG’öbÖVÇB†2æò÷F†W"v’FòÖVâç—F†–ærÂæB¢òòFVÆÂG&vâ–â–çFW&–÷"6öÆ÷W"—2FVÆÂæö&öG’6VW2B7VVBà¢6öç7B6rÒF†—2æG&—ÇÂÂ&V"Ò‡F†—2æ&Æö%&V"ÇÂ’ò$Äô%õ$T#°¢6öç7Bv–FRÒ²&V"¢ãbÒ6r¢ãs²òò7V6‚ÖæB×7G&WF6€¢6öç7BFÆÂÒÒ&V"¢ã#²6r¢ãc°¢6öç7B&VÆÇ’Ò6r¢RãS²òò†÷rf"F†RwWB†æw0¢2ç6fR‚“²2ç66ÆR‡v–FRÂFÆÂ“°¢2ç7G&ö¶U7G–ÆRÒÔBç7FVVÂæF&³²2æÆ–æUv–GF‚Ò"ãC²2æÆ–æT6Òw&÷VæBs°¢f÷"†6öç7B¶Ç‚ÂÇÒöbµ²Ó‚ÂÒÂ²ÓÂ"ãÒÂ³rãRÂBã%ÕÒ’°¢6öç7BÆ–gBÒÖF‚æÖ‚ƒÂÖF‚ç6–â‡‚¢ãb²Ç’’¢ãC°¢òòF†RÆVw25Ä’v†Vâ—B'&6W2FòG&—æB'V6¶ÆRöâF†R&V&÷VæB(	@¢òòF‡&VR"‚Æ–æW2F†BÖ÷fRãB‚&Rv‡’F†—2W6VBFò&VB2¢òò†÷Föw&‚öbâVæV×’&F†W"F†ââVæV×¢2æ&Vv–åF‚‚“²2æÖ÷fUFò†Ç‚Âb“°¢2æÆ–æUFò†Ç‚²ãb²ÖF‚ç6–vâ†Ç‚ÇÂ’¢‡6r¢2ãB²&V"¢ãb’ÂÒÆ–gBÒ&V"¢"ãb²6r¢ã"“°¢2ç7G&ö¶R‚“°¢Ð¢òòF†RÖ73¢v–FRÂÆ÷rÂæBFVÆ–&W&FVÇ’Æ÷6–FVB(	BæBæ÷r—G2fÆö÷ ¢òò6w2v—F‚F†RvV–v‡B—B—2&÷WBFòÆ÷6P¢ÆFR‚‚’Óâ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚ÓbÂb“°¢2æ&W¦–W$7W'fUFò‚ÓrÂÓBÂÓ’ÂÓÂÂÓ“°¢2æ&W¦–W$7W'fUFòƒÂÓÂbÂÓbÂRÂ“°¢2æ&W¦–W$7W'fUFòƒBãBÂRÂ"ÂrÂ‚Âr²&VÆÇ’¢ãR“°¢2æ&W¦–W$7W'fUFòƒBÂ’²&VÆÇ’ÂÓ"Â’²&VÆÇ’¢ã‚ÂÓbÂb“°¢2æ6Æ÷6UF‚‚“°¢ÒÂÓ"Â‚“°¢òòââææBF†RVæFçB—B†æw2&Vf÷&R—BÆWG2vó¢&VÂÆö&RöbF†P¢òò&öG’Âf–ÆÆVBv—F‚F†R&öG’w2÷vâ&×Â6òF†R6–Æ†÷VWGFRw&÷w2¢òòFV&G&÷&F†W"F†âF†R7'W7BÖW&VÇ’'&–v‡FVæ–æp¢–b‡6râãR’°¢6öç7B"ÒãB²6r¢2ãbÂG’Òr²&VÆÇ’¢ã’²6r¢"ã#°¢ÆFR‚‚’Óâ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó"ãbÒ"¢ãRÂb²&VÆÇ’¢ãr“°¢2çVG&F–47W'fUFò‚ÓÂG’²"ÂãBÂG’²"¢ã3R“°¢2çVG&F–47W'fUFòƒã‚ÂG’²"Â"ãb²"¢ãRÂb²&VÆÇ’¢ãr“°¢2æ6Æ÷6UF‚‚“°¢ÒÂBÂG’²"¢ãB“°¢Ð¢òòÖöÇFVâVæFW&vÆ÷rf—'7B(	BF†R†VB—2”å4”DRÂF†R7'W7B6—G2÷fW"—@¢2ç6fR‚“²2ævÆö&ÄÇ†ÒãR²VÇ6R¢ã3°¢6öç7BVrÒ2æ7&VFU&F–Äw&F–VçB‚ÓÂ2ÂÂÓÂ2ÂR“°¢VræFD6öÆ÷%7F÷ƒÂTÂæ6öÂ“²VræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ#"ÃS"Ã’r“°¢2æf–ÆÅ7G–ÆRÒVs²2æ&Vv–åF‚‚“²2æVÆÆ—6R‚ÓÂ2ÂBÂbÂÂÂr“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“°¢òò6ööÆVB7'W7C¢6WfW&ÂD$²—'&VwVÆ"ÆFW2Â6òF†Rv2&WGvVVâF†VÐ¢òò&Rv†BvÆ÷w2âÆFW2Æ–v‡FW"F†âF†R&öG’&VB2Ææ·2FVBöâà¢2æf–ÆÅ7G–ÆRÒÔBç7FVVÂæFVW°¢6öç7B7'W7BÒ°¢µ²ÓBÂ5ÒÂ²ÓÂÓUÒÂ²ÓBÂÓ…ÒÂ²Ó2ÂÓÒÂ²Ó‚ÂEÕÒÀ¢µ²ÓãRÂÓ•ÒÂ³RÂÓ’ãUÒÂ³rÂÓ2ãUÒÂ³ãRÂÓ"ãUÕÒÀ¢µ³‚ãRÂÓeÒÂ³BÂÓ%ÒÂ³2Â5ÒÂ³‚Â%ÕÒÀ¢µ²Ó"ÂÒÂ³bÂÓÒÂ³rãRÂUÒÂ²ÓÂeÕÒÀ¢Ó°¢f÷"†6öç7BöÇ’öb7'W7B’°¢2æ&Vv–åF‚‚“²öÇ’æf÷$V6‚‚‡BÂ’’Óâ’ò2æÆ–æUFò‡E³ÒÂE³Ò’¢2æÖ÷fUFò‡E³ÒÂE³Ò’“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢Ð¢òòfWr6†÷'B†÷BfÆV6·2v†W&RF†R7'W7B†2æ÷B6Æ÷6V@¢2ç6fR‚“²2ævÆö&ÄÇ†ÒVÇ6S°¢2æf–ÆÅ7G–ÆRÒr6ffC–s²2ç6†F÷t6öÆ÷"ÒTÂæ6öÃ²2ç6†F÷t&ÇW"ÒC°¢2æf–ÆÅ&V7B‚Ó2ãBÂÓbÂã’Â"ã"“²2æf–ÆÅ&V7BƒrãBÂÓ"ãbÂã‚Â"ãb“°¢2æf–ÆÅ&V7B‚Óã"ÂRãBÂ"ãBÂã‚“°¢2ç6†F÷t&ÇW"Ò²2ç&W7F÷&R‚“°¢W–W2‚Ó2ÂÓbÂ"ã"“°¢2ç&W7F÷&R‚“²òòF†R7V6‚G&ç6f÷&Ð¢'&V³°¢Ð¢66RvfÆ–W"s¢°¢òòô´²(	B7W'fW’ÆVç2F†BæWfW"ÆæFVBâF†RÆVç2•2F†R&–r6†RÂæ@¢òò—B—2F†RöæÇ’Ö–Ö–2v—F‚6–ævÆRW–RÂ6ò—BæWfW"&VG22F†R÷F†W'2à¢6öç7B‚ÒF†—2ææ–Ò¢bÂ&ö"ÒÖF‚ç6–â‡‚’¢ãƒ°¢2ç6fR‚“²2çG&ç6ÆFRƒÂ&ö"“°¢òò†÷W6–ær&–ær&V†–æBF†RÆVç0¢2ç7G&ö¶U7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓÂÓÂÂ“²2æÆ–æUv–GF‚Ò"ãC°¢2æ&Vv–åF‚‚“²2æ&2ƒÂÂãRÂÂr“²2ç7G&ö¶R‚“°¢2ç7G&ö¶U7G–ÆRÒÔBç7FVVÂæÖ–C²2æÆ–æUv–GF‚Ò°¢f÷"†ÆWB’Ò²’Â3²’²²’²òòÖ÷VçF–ær7G'WG0¢6öç7BÒ‚¢ãb²’ò2¢ÖF‚å’¢#°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò„ÖF‚æ6÷2†’¢bãRÂÖF‚ç6–â†’¢bãR“°¢2æÆ–æUFò„ÖF‚æ6÷2†’¢ãRÂÖF‚ç6–â†’¢ãR“²2ç7G&ö¶R‚“°¢Ð¢òòF†RÆVç2&öG¢ÆFR‚‚’Óâ²2æ&Vv–åF‚‚“²2æ&2ƒÂÂrÂÂr“²2æ6Æ÷6UF‚‚“²ÒÂÓ‚Âr“°¢òò6–ævÆR&VB—&—2(	B–æfV7F–öâÖ&¶W"ÂöæRæ÷BGvð¢G&u6Vç6÷"†2ÂÓã"ÂÂ"ãRÂF†—2æ‡—æõBâòvÆW'Br¢vÆö6¶VBrÂF†—2ææ–Ò“°¢2æf–ÆÅ7G–ÆRÒw&v&ƒ#SRÃ#SRÃ#SRÃãB’s²òò7V7VÆ"Â6òF†RÆVç2&VG22vÆ70¢2æ&Vv–åF‚‚“²2æVÆÆ—6R‚Ó2ãBÂÓ"ãBÂã‚ÂÂÓãRÂÂr“²2æf–ÆÂ‚“°¢òò&2VÖ—GFW'2VæFW&æVF€¢66VçB‚‚’Óâ°¢f÷"†6öç7BW‚öb²ÓRÂUÒ’²2æ&Vv–åF‚‚“²2æ&2†W‚Â‚ãBÂã2ÂÂr“²2æf–ÆÂ‚“²Ð¢ÒÂG'VR“°¢2ç7G&ö¶U7G–ÆRÒÔBæ'&öç¦RæÖ–C²2æÆ–æUv–GF‚Ò°¢2æ&Vv–åF‚‚“²2æÖ÷fUFòƒÂÓãR“²2æÆ–æUFòƒãbÂÓB“²2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“°¢'&V³°¢Ð¢66Rw7W&vRs¢°¢òò%%•B(	BÆ–æR'&V¶W"F†B¶WB—G2&–ÂæBÆ÷7B—G2ÖææW'2â&6P¢òòvVöÖWG'’æò÷F†W"Ö–Ö–2÷vç3¢Æ÷r„õ$•¤ôåDÂE%TÒv—F‚–ç7VÆF÷ ¢òòf–ç2öâ—G2&6²(	BæòÆVw2†&Æö"†2ÆVw2’Âæò&'&VÂ‡F†B—2F†P¢òòGW'&WB’ÂæòvVFvR‡F†R7&vÆW"w2’âVæv–æRÖG&vâ7FæBÖ–ã²WF†÷&V@¢òòÆFW2&RVWVVB„%EõTUTR*s&’’W"F†Rf÷W"Ö6Æ72'B&–&ÆRà¢6öç7BFVÆÂÒ‡F†—2æ7&÷V6…BÇÂ’â°¢6öç7BfVçFVBÒ‡F†—2çv–æFVEBÇÂ’â°¢6öç7B³"ÒFVÆÂòÒ6Æ×‡F†—2æ7&÷V6…BòDTÄÅõ5t•RÂÂ’¢°¢6öç7B‡VÒÒÖF‚ç6–â‡F†—2ææ–Ò¢‡FVÆÂò#b¢r’’¢‡FVÆÂòã"¢ãB“°¢òòD„RUD„õ$TB%$T´U"Œ*s&’“¢F‡&VRÆFW2öâF†R&VG2F†RfÆÆ&6°¢òòFV6†W2(	BÆF6†VBfÆBÂf–ç2fÆ&VBÂfVçG2fÆÆVâ÷VââF†RVæv–æP¢òòG'VÒ&VÆ÷r7F—2F†R7FæBÖ–âv†–ÆRÆFR—2–âfÆ–v‡Bà¢°¢6öç7B'ÒfVçFVBòv'&V¶W%fVçFVBr¢FVÆÂòv'&V¶W%FVÆÂr¢v'&V¶W%&W7Bs°¢2ç6fR‚“²2ç66ÆRƒòfÆ—Â“²òò7–ÖÖWG&–2Ö6†–æRÂæWfW"fÆ—0¢6öç7B$G&WrÒG—VöbG&uÆFTæ6†÷&VBÓÓÒvgVæ7F–öârb`¢G&uÆFTæ6†÷&VB†2Â'ÂÂF†—2æ‚ò"ÂF†—2æ‚¢‡FVÆÂòã3R¢ã’ÂfÇ6RÂG'VR“°¢2ç&W7F÷&R‚“°¢–b†$G&Wr’'&V³°¢Ð¢òò7–ÖÖWG&–2Ö6†–æS¢VæFòF†RfÆ—6ò—BæWfW"V'2Fò§V×6–FW0¢2ç6fR‚“²2ç66ÆRƒòfÆ—Â“°¢òò6&ÆR7GV'2&6–ær–çFòF†R&–Âöâ&÷F‚6–FW2(	B—B—2ÅTÔ$TB–à¢2ç7G&ö¶U7G–ÆRÒÔBç7FVVÂæF&³²2æÆ–æUv–GF‚Ò"ã#²2æÆ–æT6Òw&÷VæBs°¢f÷"†6öç7B2öb²ÓÂÒ’°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡2¢Âb“°¢2çVG&F–47W'fUFò‡2¢rÂrÂ2¢’Â"“²2ç7G&ö¶R‚“°¢Ð¢òòF†RÖ÷VçB6FFÆR—B—2&öÇFVBFð¢g&ÖR‚‚’Óâ²2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó2Â"“²2æÆ–æUFò‚ÓÂr“²2æÆ–æUFòƒÂr“²2æÆ–æUFòƒ2Â"“²2æ6Æ÷6UF‚‚“²ÒÂbÂ"“°¢f÷"†6öç7B'‚öb²Ó’Â•Ò’¦ö–çB†'‚ÂãBÂãR“°¢òòF†RG'VÒ(	BÆ–gG2Æ—GFÆR2—B6†&vW2Â6w2Æ—GFÆRfVçFV@¢6öç7BÆ–gBÒFVÆÂòÖ³"¢"ãR¢fVçFVBòã"¢°¢2ç6fR‚“²2çG&ç6ÆFR†‡VÒ¢ãBÂÆ–gB“°¢ÆFR‚‚’Óâ²2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÂ2Â‚ãRÂÂÂr“²2æ6Æ÷6UF‚‚“²ÒÂÓ’Â’“°¢6VÒ‚ÓÂÓ"ãRÂÂÓ"ãRÂã"“°¢òòVæB60¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓBÂÓBÂÓÂB“°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R‚ÓãBÂÂ"ãbÂbã‚ÂÂÂr“²2æf–ÆÂ‚“°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒãBÂÂ"ãbÂbã‚ÂÂÂr“²2æf–ÆÂ‚“°¢òò–ç7VÆF÷"f–ç3¢föÆFVBfÆBB&W7BÂdÄ$TBF‡&÷Vv‚F†R6†&vRÀ¢òòG&ö÷VBv†VâfVçFVB(	BF†R6–Æ†÷VWGFR•2F†R7FFR†'B&–&ÆR*s2ã2¢6öç7BfÆ&RÒFVÆÂòãSR²³"¢ãsR¢fVçFVBòã"¢ã3°¢f÷"†6öç7B¶g‚Âg5Òöbµ²ÓbÂÓã#UÒÂ³ÂÒÂ³bÂã#UÕÒ’°¢2ç6fR‚“²2çG&ç6ÆFR†g‚ÂÓr“²2ç&÷FFR†g2¢ƒÒfÆ&R’“°¢ÆFR‚‚’Óâ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó"ãbÂ“°¢2æÆ–æUFò‚ÓãbÂÓ2ÒfÆ&R¢bãR“²2æÆ–æUFòƒãbÂÓ2ÒfÆ&R¢bãR“°¢2æÆ–æUFòƒ"ãbÂ“²2æ6Æ÷6UF‚‚“°¢ÒÂÓÒfÆ&R¢bÂÓb“°¢2ç&W7F÷&R‚“°¢Ð¢òòF†R6†&vRv–æF÷s¢GVÆÂB&W7BÂ†÷BF‡&÷Vv‚F†RFVÆÂÂF&²fVçFVB(	@¢òòÇW2÷Vâ6–FRfVçG2v†–ÆR—B—27VçBÂ6òF†Rv–æF÷r&VG0¢2ç6fR‚“°¢2ævÆö&ÄÇ†ÒfVçFVBòã3R¢ãsR²³"¢ã#S°¢66VçB‚‚’Óâ²2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂãRÂR²³"¢ãRÂ2²³"ÂÂÂr“²2æf–ÆÂ‚“²ÒÂFVÆÂ“°¢2ç&W7F÷&R‚“°¢–b‡fVçFVB’°¢2æf–ÆÅ7G–ÆRÒr3##&2s°¢f÷"†6öç7B2öb²ÓÂÒ’2æf–ÆÅ&V7B‡2¢‚Ò"ÂÓÂBÂRãR“°¢2ç6fR‚“²2ævÆö&ÄÇ†ÒãB²ÖF‚ç6–â‡F†—2ææ–Ò¢’’¢ã#°¢2æf–ÆÅ7G–ÆRÒr6fc–fs°¢f÷"†6öç7B2öb²ÓÂÒ’2æf–ÆÅ&V7B‡2¢‚Òã"ÂÂ"ãBÂ2ãb“°¢2ç&W7F÷&R‚“°¢Ð¢W–W2‚Ó2ÂÓRãRÂã’“°¢2ç&W7F÷&R‚“²òòG'VÒÆ–g@¢2ç&W7F÷&R‚“²òòF†RVâÖfÆ— ¢'&V³°¢Ð¢66Rv¶–Æâs¢°¢òòtÄôB(	B67F–ær÷BF†BæWfW"7F÷VB&V–ærfVBâ&6RvVöÖWG'’æð¢òò÷F†W"Ö–Ö–2÷vç3¢7VBdU%D”4Â5%T4”$ÄRv—F‚fÆ&VBÖ÷WF‚æ@¢òòF‡&VRF×W"WFÇ2öâF†R&–Ò(	BæòÆVw2†&Æö"’Âæò†÷&—¦öçFÂG'VÐ¢òò‡F†R'&V¶W"’Âæò&'&VÂ‡F†RGW'&WB’ÂæòvVFvR‡F†R7&vÆW"’à¢òòVæv–æRÖG&vâ7FæBÖ–ã²WF†÷&VBÆFW2&RVWVVB„%EõTUTR*s&Â¢òòW"F†Rf÷W"Ö6Æ72'B&–&ÆRà¢6öç7BFVÆÂÒ‡F†—2æ7&÷V6…BÇÂ’â°¢6öç7B&Æ÷v–ærÒ‡F†—2çÇVÖUBÇÂ’â°¢6öç7B7VçBÒ‡F†—2çv–æFVEBÇÂ’â°¢6öç7B³"ÒFVÆÂòÒ6Æ×‡F†—2æ7&÷V6…BòDTÄÅõ5t•RÂÂ’¢°¢6öç7B6†—fW"Ò&Æ÷v–æròÖF‚ç6–â‡F†—2ææ–Ò¢C’¢ã¢FVÆÂòÖF‚ç6–â‡F†—2ææ–Ò¢#B’¢³"¢ã‚¢°¢òòÄDRd•%5B„%EõTUTR*s&Âü*s&âü*s'’âF‡&VR7FFW2ÂF‡&VP¢òò6–Æ†÷VWGFW3¢B&W7BÂF†RFVÆÂÂæB7VçBâF†RVæv–æRG&v–æp¢òò&VÆ÷r7F—2F†RÆöF–ærfÆÆ&6²ÂW†7FÇ’2F†R'&V¶W"FöW2à¢°¢6öç7B²Ò7VçBòv¶–Æå7VçBr¢FVÆÂòv¶–ÆåFVÆÂr¢v¶–Æå&W7Bs°¢2ç6fR‚“²2ç66ÆRƒòfÆ—Â“²òò7–ÖÖWG&–2Ö6†–æRÂæWfW"fÆ—0¢6öç7BG&WrÒG—VöbG&uÆFTæ6†÷&VBÓÓÒvgVæ7F–öârb`¢G&uÆFTæ6†÷&VB†2Â²ÂÂF†—2æ‚ò"ÂF†—2æ‚¢‡FVÆÂòã3R¢ã’ÂfÇ6RÂG'VR“°¢2ç&W7F÷&R‚“°¢–b†G&Wr’'&V³°¢Ð¢òò7–ÖÖWG&–2Ö6†–æS¢VæFòF†RfÆ—6ò—BæWfW"V'2Fò§V×6–FW0¢2ç6fR‚“²2ç66ÆRƒòfÆ—Â“°¢òòfVVB—W2&6–ær–çFòF†RfÆö÷"öâ&÷F‚6–FW2(	B—B—2ÅTÔ$TB–à¢2ç7G&ö¶U7G–ÆRÒÔBç7FVVÂæF&³²2æÆ–æUv–GF‚Ò"ãC²2æÆ–æT6Òw&÷VæBs°¢f÷"†6öç7B2öb²ÓÂÒ’°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡2¢Â‚“°¢2çVG&F–47W'fUFò‡2¢rÂ’Â2¢’Â2“²2ç7G&ö¶R‚“°¢Ð¢òòF†R6Ær6¶—'B—B6—G2–â(	B6ööÆVB7–ÆÆvRÂæWfW"7V&RÆ–çF€¢g&ÖR‚‚’Óâ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚ÓBÂ2“°¢2çVG&F–47W'fUFò‚ÓÂrÂÓbÂ‚ãR“°¢2çVG&F–47W'fUFòƒÂbãRÂbÂ‚ãR“°¢2çVG&F–47W'fUFòƒÂrÂBÂ2“°¢2æ6Æ÷6UF‚‚“°¢ÒÂrÂ2“°¢f÷"†6öç7B'‚öb²Ó‚Â…Ò’¦ö–çB†'‚ÂãRÂãB“°¢òòF†R÷B(	B7vVÆÇ2Æ—GFÆR2—B6†&vW2Â6w2Æ—GFÆR7Vç@¢6öç7B6rÒ7VçBòã"¢°¢2ç6fR‚“²2çG&ç6ÆFR‡6†—fW"Â6r“°¢ÆFR‚‚’Óâ°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò‚Ó’ÂÓ‚“²òòF†RfÆ&VBÖ÷WF‚Æ— ¢2çVG&F–47W'fUFò‚Ó2ÂÓBÂÓãRÂ"“²òò&VÆÇ’÷W@¢2çVG&F–47W'fUFò‚ÓÂ‚ÂÂ’“°¢2çVG&F–47W'fUFòƒÂ‚ÂãRÂ"“°¢2çVG&F–47W'fUFòƒ2ÂÓBÂ’ÂÓ‚“°¢2çVG&F–47W'fUFòƒÂÓÂÓ’ÂÓ‚“²òòæò7G&–v‡B&–Ð¢2æ6Æ÷6UF‚‚“°¢ÒÂÓ’Â’“°¢6VÒ‚ÓÂÂÂÂã"“°¢òò'&öç¦RÖ÷WF‚6öÆÆ ¢2ç7G&ö¶U7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓÂÓÂÂÓb“°¢2æÆ–æUv–GF‚Ò"ã#°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÓ‚Â’ãbÂ"ãbÂÂÂr“²2ç7G&ö¶R‚“°¢òòF×W"WFÇ3¢föÆFVB÷fW"F†RÖ÷WF‚B&W7BÂ„”ätTBõTâF‡&÷Vv€¢òòF†R6†&vRÂ†æv–ærv–FRæBG&ö÷VBv†Vâ7VçB(	BF†R6–Æ†÷VWGFR•0¢òòF†R7FFR†'B&–&ÆR*s2ã2¢6öç7B÷VâÒFVÆÂòã3R²³"¢ãR¢&Æ÷v–æròãb¢7VçBòãƒR¢ã#S°¢f÷"†6öç7B·ƒ"Â5Òöbµ²ÓbÂÓÒÂ³ÂÒÂ³bÂÕÒ’°¢2ç6fR‚“²2çG&ç6ÆFR‡ƒ"ÂÓ‚ãR“°¢–b‡2’2ç&÷FFR‡2¢÷Vâ“²òò6–FRWFÇ2†–ævR÷W@¢VÇ6R2çG&ç6ÆFRƒÂÖ÷Vâ¢"ã"“²òòF†RÖ–FFÆRWFÂÆ–gG0¢ÆFR‚‚’Óâ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó2Â“°¢2çVG&F–47W'fUFòƒÂÓBãRÒ÷Vâ¢"ãBÂ2Â“°¢2æ6Æ÷6UF‚‚“°¢ÒÂÓ2Ò÷Vâ¢2ÂÓ‚“°¢2ç&W7F÷&R‚“°¢Ð¢òòF†RF‡&öC¢GVÆÂVÖ&W'2B&W7BÂv†—FRF‡&÷Vv‚F†R6†&vRæBF†P¢òò&Æ÷rÂFVBF&²v†Vâ7VçB(	BÇW2fÆÆVâÖ÷Vâ6–FRw&FW2v†–ÆR—@¢òò—27VçBÂ6òF†Rv–æF÷r&VG27&÷72F†R&ööÐ¢2ç6fR‚“°¢2ævÆö&ÄÇ†Ò7VçBòã#"¢&Æ÷v–ærò¢ãb²³"¢ãC°¢66VçB‚‚’Óâ²2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÓrãRÂRãR²³"¢"Â"²³"ÂÂÂr“²2æf–ÆÂ‚“²ÒÂFVÆÂÇÂ&Æ÷v–ær“°¢2ç&W7F÷&R‚“°¢–b‡7VçB’°¢2æf–ÆÅ7G–ÆRÒr3##&2s°¢f÷"†6öç7B2öb²ÓÂÒ’2æf–ÆÅ&V7B‡2¢‚ãRÒ"ÂÂBÂb“°¢2ç6fR‚“²2ævÆö&ÄÇ†ÒãB²ÖF‚ç6–â‡F†—2ææ–Ò¢’’¢ã#°¢2æf–ÆÅ7G–ÆRÒr6fc–fs°¢f÷"†6öç7B2öb²ÓÂÒ’2æf–ÆÅ&V7B‡2¢‚ãRÒã"ÂÂ"ãBÂB“°¢2ç&W7F÷&R‚“°¢ÒVÇ6R–b‚&Æ÷v–ærbb6†æ6Rƒãb’’°¢òò–FÆR'&VFƒ¢öæRVÖ&W"6Æ—–ærF†RF×W'2æ÷ræBF†Và¢FE'B†7‚²&æB‚Ó2Â2’ÂF†—2ç’Ò"Â&æB‚Ó‚Â‚’Â&æB‚ÓCÂÓ#’ÂãRÂr6fc“C3rÂãbÂÓ3ÂG'VR“°¢Ð¢W–W2‚ÓBÂ"ãRÂã‚“°¢2ç&W7F÷&R‚“²òò÷B6†—fW"÷6p¢2ç&W7F÷&R‚“²òòF†RVâÖfÆ— ¢'&V³°¢Ð¢66Rw&–ÖRs¢°¢òò$”Ò(	Bâ&6†—fR6Æ–ÖFRVæ—BF†BæWfW"7F÷VB6†–ÆÆ–ærâ&6P¢òòvVöÖWG'’æò÷F†W"Ö–Ö–2÷vç3¢t•5DTB4ôäDTå4U"$ô$$”â(	BGvð¢òòÆö&W2æB–æ6†VBÖ–FFÆRÂw&VB–â6ööÆ–ær6ö–Â(	BæòÆVw0¢òò†&Æö"’Âæò†÷&—¦öçFÂG'VÒ‡F†R'&V¶W"’ÂæòfÆ&VB7'V6–&ÆRÖ÷WF€¢òò‡F†R¶–Æâ’Âæò&'&VÂ‡F†RGW'&WB’ÂæòvVFvR‡F†R7&vÆW"’à¢òòVæv–æRÖG&vâ7FæBÖ–ã²WF†÷&VBÆFW2&RVWVVB„%EõTUTR*s&â¢òòW"F†Rf÷W"Ö6Æ72'B&–&ÆRà¢6öç7BFVÆÂÒ‡F†—2æ7&÷V6…BÇÂ’â°¢6öç7BF&²Ò‡F†—2çv–æFVEBÇÂ’â°¢6öç7B³"ÒFVÆÂòÒ6Æ×‡F†—2æ7&÷V6…BòDTÄÅô„Te’ÂÂ’¢°¢6öç7B6†—fW"ÒFVÆÂòÖF‚ç6–â‡F†—2ææ–Ò¢3’¢³"¢ã¢°¢òòÄDRd•%5B„%EõTUTR*s&Âü*s&âü*s'’âF‡&VR7FFW2ÂF‡&VP¢òò6–Æ†÷VWGFW3¢B&W7BÂF†RFVÆÂÂæB7VçBâF†RVæv–æRG&v–æp¢òò&VÆ÷r7F—2F†RÆöF–ærfÆÆ&6²ÂW†7FÇ’2F†R'&V¶W"FöW2à¢°¢6öç7B²ÒF&²òw&–ÖTF&²r¢FVÆÂòw&–ÖUFVÆÂr¢w&–ÖU&W7Bs°¢2ç6fR‚“²2ç66ÆRƒòfÆ—Â“²òò7–ÖÖWG&–2Ö6†–æRÂæWfW"fÆ—0¢6öç7BG&WrÒG—VöbG&uÆFTæ6†÷&VBÓÓÒvgVæ7F–öârb`¢G&uÆFTæ6†÷&VB†2Â²ÂÂF†—2æ‚ò"ÂF†—2æ‚¢‡FVÆÂòã3R¢ã’ÂfÇ6RÂG'VR“°¢2ç&W7F÷&R‚“°¢–b†G&Wr’'&V³°¢Ð¢òò7–ÖÖWG&–2Ö6†–æS¢VæFòF†RfÆ—6ò—BæWfW"V'2Fò§V×6–FW0¢2ç6fR‚“²2ç66ÆRƒòfÆ—Â“°¢òòfVVBÆ–æW2&6–ær–çFòF†RfÆö÷"&÷F‚6–FW2(	B—B—2ÅTÔ$TB–çFð¢òòF†R7F6·2r6†–ÆÆW"Æö÷ ¢2ç7G&ö¶U7G–ÆRÒÔBç7FVVÂæF&³²2æÆ–æUv–GF‚Ò"ã#²2æÆ–æT6Òw&÷VæBs°¢f÷"†6öç7B2öb²ÓÂÒ’°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡2¢’Â’“°¢2çVG&F–47W'fUFò‡2¢bÂÂ2¢‚Â2“²2ç7G&ö¶R‚“°¢Ð¢òòF†R†ö"6¶—'B—B7FæG2–â(	Bg&÷7B7'W7BÂæWfW"7V&RÆ–çF€¢g&ÖR‚‚’Óâ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó2Â2“°¢2çVG&F–47W'fUFò‚ÓÂ‚ÂÓRÂ’ãR“°¢2çVG&F–47W'fUFòƒÂrãRÂRÂ’ãR“°¢2çVG&F–47W'fUFòƒÂ‚Â2Â2“°¢2æ6Æ÷6UF‚‚“°¢ÒÂ‚Â2“°¢f÷"†6öç7B'‚öb²ÓrÂuÒ’¦ö–çB†'‚ÂãRÂãB“°¢òòF†R&ö&&–â(	BÆ–gG2†—"2—B6†&vW2Â6ÇV×2†—"v†VâF&°¢6öç7B6rÒF&²òã¢FVÆÂòÖ³"¢ãb¢°¢2ç6fR‚“²2çG&ç6ÆFR‡6†—fW"Â6r“°¢ÆFR‚‚’Óâ°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò‚Ó‚ÂÓ“²òòWW"Æö&P¢2çVG&F–47W'fUFò‚ÓãRÂÓbÂÓ’ÂÓãR“°¢2çVG&F–47W'fUFò‚ÓRãRÂãRÂÓ’ãRÂ2“²òòF†R–æ6†VBv—7@¢2çVG&F–47W'fUFò‚Ó"ÂrãRÂÓrÂ’ãR“²òòÆ÷vW"Æö&P¢2çVG&F–47W'fUFòƒÂÂrÂ’ãR“°¢2çVG&F–47W'fUFòƒ"ÂrãRÂ’ãRÂ2“°¢2çVG&F–47W'fUFòƒRãRÂãRÂ’ÂÓãR“°¢2çVG&F–47W'fUFòƒãRÂÓbÂ‚ÂÓ“°¢2çVG&F–47W'fUFòƒÂÓ"ÂÓ‚ÂÓ“²òòæò7G&–v‡B6†÷VÆFW ¢2æ6Æ÷6UF‚‚“°¢ÒÂÓÂ“°¢òòF†R6ööÆ–ær6ö–Âw&VB&÷VæBF†Rv—7B(	B'&öç¦RÂF‡&VR6vv–ærGW&ç0¢2ç7G&ö¶U7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓ‚ÂÂ‚ÂR“²2æÆ–æUv–GF‚Òãƒ²2æÆ–æT6Òw&÷VæBs°¢f÷"†ÆWB’Ò²’Â3²’²²’°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò‚Ó‚ãR²’¢ãrÂãB²’¢"ã“°¢2çVG&F–47W'fUFòƒÂ"ãb²’¢"ãÂ‚ãRÒ’¢ãrÂã"²’¢"ã“°¢2ç7G&ö¶R‚“°¢Ð¢6VÒ‚ÓrÂÓ‚ÂrÂÓ‚Âã"“°¢òòF†Rg&÷7B7&÷vâ&÷VæBF†RWW"6öÆÆ#¢Æ–BÆ÷rB&W7BÂU…DTäDT@¢òòF‡&÷Vv‚F†R6†&vRÂ6æVBG&ö÷–ærv†Vâ—B—2F&²(	BF†P¢òò6–Æ†÷VWGFR•2F†R7FFR†'B&–&ÆR*s2ã2¢6öç7BW‡BÒFVÆÂòãB²³"¢ã"¢F&²òã‚¢ã3°¢f÷"†6öç7B¶ç‚Â5Òöbµ²ÓRãRÂÓÒÂ³ÂÒÂ³RãRÂÕÒ’°¢2ç6fR‚“²2çG&ç6ÆFR†ç‚ÂÓ’ãR“°¢–b†F&²’2ç&÷FFR‡2¢ã’²‡2ÓÓÒòãR¢’“²òò6æVB÷fW ¢VÇ6R2ç&÷FFR‡2¢ƒãbÒW‡B¢ã3R’“²òòfææ–ærW&–v‡@¢ÆFR‚‚’Óâ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó"ã"Â“°¢2æÆ–æUFò‚ÓãrÂÓ2ÒW‡B¢r“²2æÆ–æUFòƒãrÂÓ2ÒW‡B¢r“°¢2æÆ–æUFòƒ"ã"Â“²2æ6Æ÷6UF‚‚“°¢ÒÂÓ"ÒW‡B¢bÂÓ’“°¢2ç&W7F÷&R‚“°¢Ð¢òòF†R6öÆB6÷&R–âF†RWW"Æö&S¢GVÆÂVÇ6RB&W7BÂv†—FRÖ'&–v‡@¢òòF‡&÷Vv‚F†R6†&vRÂDTBD$²f÷"F†Rv†öÆRv–æF÷r(	BÇW2fÆÆVâÐ¢òò÷Vâg&÷7BfVçG2v†–ÆR—B—2F&²Â6òF†Rv–æF÷r&VG27&÷72&ööÐ¢2ç6fR‚“°¢2ævÆö&ÄÇ†ÒF&²òã"¢FVÆÂòãsR²³"¢ã#R¢ãCR²ÖF‚ç6–â‡F†—2ææ–Ò¢"ã"’¢ãS°¢66VçB‚‚’Óâ²2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÓRãRÂBãR²³"¢"Â2ãB²³"ÂÂÂr“²2æf–ÆÂ‚“²ÒÂFVÆÂ“°¢2ç&W7F÷&R‚“°¢–b†F&²’°¢2æf–ÆÅ7G–ÆRÒr333#bs°¢f÷"†6öç7B2öb²ÓÂÒ’2æf–ÆÅ&V7B‡2¢rãRÒ"Â"ÂBÂb“°¢2ç6fR‚“²2ævÆö&ÄÇ†Òã3R²ÖF‚ç6–â‡F†—2ææ–Ò¢’’¢ãS°¢2æf–ÆÅ7G–ÆRÒr6†SFcBs°¢f÷"†6öç7B2öb²ÓÂÒ’2æf–ÆÅ&V7B‡2¢rãRÒã"Â2Â"ãBÂBãB“°¢2ç&W7F÷&R‚“°¢ÒVÇ6R–b‚FVÆÂbb6†æ6RƒãR’’°¢òò–FÆR'&VFƒ¢6öÆBdÄÅ2(	BöæRg&÷7BÖ÷FR6Æ—–æröfbF†R7&÷và¢FE'B†7‚²&æB‚ÓBÂB’ÂF†—2ç’²"Â&æB‚ÓbÂb’Â&æBƒ‚Â#b’ÂãbÂr6&fVfbrÂãRÂ3ÂG'VR“°¢Ð¢W–W2‚Ó2ÂÓ2Âã‚“°¢2ç&W7F÷&R‚“²òò&ö&&–â6†—fW"÷6p¢2ç&W7F÷&R‚“²òòF†RVâÖfÆ— ¢'&V³°¢Ð¢66Rw6æ&Rs¢°¢òò´äõB(	BæW7BöÇ—F†Bw&Wr&÷VæBÖ–çFVææ6RæöFRæB¶W@¢òò—G2w&—â&6RvVöÖWG'’æò÷F†W"Ö–Ö–2÷vç3¢$ôõDTBDT$E$õ ¢òò%TÄ"VæFW"â÷VâF†÷&âÖr(	BæòÆVw2†&Æö"’Âæò†÷&—¦öçFÂG'VÐ¢òò‡F†R'&V¶W"’ÂæòfÆ&VB7'V6–&ÆRÖ÷WF‚‡F†R¶–Æã¢—G2Ö÷WF‚—2¢òòÖ6†–æR'C²F†—2—2Ö÷WF‚’Âæòv—7FVB&ö&&–â‡F†R&–ÖR’Âæð¢òò&'&VÂ‡F†RGW'&WB’ÂæòvVFvR‡F†R7&vÆW"’âVæv–æRÖG&và¢òò7FæBÖ–ã²WF†÷&VBÆFW2&RVWVVB„%EõTUTR*s'’W"F†P¢òòf÷W"Ö6Æ72'B&–&ÆRà¢6öç7BFVÆÂÒ‡F†—2æ7&÷V6…BÇÂ’â°¢6öç7B&VVÂÒ‡F†—2ç&VVÅBÇÂ’â°¢6öç7BÆ–×Ò‡F†—2çv–æFVEBÇÂ’â°¢6öç7B³"ÒFVÆÂòÒ6Æ×‡F†—2æ7&÷V6…BòDTÄÅô„Te’ÂÂ’¢°¢òòF†R†V'F&VC¢F†R'&öF67Bw2÷vâãã’‡¢Â&6–ærv†VâF†RÆ–æP¢òò—2&VÂ(	BF†RöæRÖ6†–æR–âF†RvÖRF†BVÇ6W2Æ–¶R—G2&÷70¢6öç7B&VBÒÆ–×ò¢„ÖF‚ç6–â‡F†—2ææ–Ò¢‡&VVÂò¢RãcR’’²’ò#°¢òòÄDRd•%5B„%EõTUTR*s&Âü*s&âü*s'’âF‡&VR7FFW2ÂF‡&VP¢òò6–Æ†÷VWGFW3¢B&W7BÂF†RFVÆÂÂæB7VçBâF†RVæv–æRG&v–æp¢òò&VÆ÷r7F—2F†RÆöF–ærfÆÆ&6²ÂW†7FÇ’2F†R'&V¶W"FöW2à¢°¢6öç7B²ÒÆ–×òw6æ&TÆ–×r¢FVÆÂòw6æ&UFVÆÂr¢w6æ&U&W7Bs°¢2ç6fR‚“²2ç66ÆRƒòfÆ—Â“²òò7–ÖÖWG&–2Ö6†–æRÂæWfW"fÆ—0¢6öç7BG&WrÒG—VöbG&uÆFTæ6†÷&VBÓÓÒvgVæ7F–öârb`¢G&uÆFTæ6†÷&VB†2Â²ÂÂF†—2æ‚ò"ÂF†—2æ‚¢‡FVÆÂòãB¢ã’ÂfÇ6RÂG'VR“°¢2ç&W7F÷&R‚“°¢–b†G&Wr’'&V³°¢Ð¢òò7–ÖÖWG&–2Ö6†–æS¢VæFòF†RfÆ—ÂF†VâÄTâF÷v&BF†RF&vWB(	@¢òòF†R&öG’–×2v†W&RF†RFVæG&–ÂvöW2Â6òF†R&VB†2F—&V7F–öà¢òòv—F†÷WBvVFvRÇ––ær&÷WBöæP¢6öç7BGvBÒ‡G—VöbÆ–W"ÓÒwVæFVf–æVBrbbÆ–W"¢ò„ÖF‚ç6–vâ‡Æ–W"ç‚²Æ–W"çrò"Ò‡F†—2ç‚²F†—2çrò"’’ÇÂ’¢°¢2ç6fR‚“²2ç66ÆRƒòfÆ—Â“°¢òòF†R†öÆFf7C¢&ö÷B×FVæG&–Ç27Æ–VB–çFòF†RfÆö÷"(	B—Bu$Ur†W&P¢2ç7G&ö¶U7G–ÆRÒÔBç7FVVÂæF&³²2æÆ–æUv–GF‚Ò"ãC²2æÆ–æT6Òw&÷VæBs°¢f÷"†6öç7B·'‚Â'“%Òöbµ²ÓÂ5ÒÂ²ÓRÂ2ãUÒÂ³bÂ2ãUÒÂ³"Â5ÕÒ’°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡'‚¢ã3RÂ‚“°¢2çVG&F–47W'fUFò‡'‚¢ã‚ÂãRÂ'‚Â'“"“²2ç7G&ö¶R‚“°¢Ð¢2ç6fR‚“°¢2çG&ç6ÆFR‡GvB¢‡FVÆÂò³"¢"ã"¢&VVÂò"ã"¢’ÂÆ–×òãb¢Ö&VB¢ã“°¢–b†Æ–×’2ç&÷FFR‡GvB¢ãB“²òò6vvVBöfb—G2&ö÷F–æp¢òòF†R'VÆ#¢v÷fVâFV&G&÷ÂgVÆÆW"öâöæR6–FR(	BF—77VRÂæ÷BGW&æ–æp¢ÆFR‚‚’Óâ°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò‚Ó2ÂÓ“°¢2çVG&F–47W'fUFò‚Ó’ãRÂÓ‚ãRÂÓãRÂÓ“°¢2çVG&F–47W'fUFò‚ÓãRÂbãRÂÓbÂ’ãR“°¢2çVG&F–47W'fUFòƒÂãRÂbãRÂ’“°¢2çVG&F–47W'fUFòƒãRÂbÂÂÓãR“°¢2çVG&F–47W'fUFòƒ’ÂÓ‚Â2ãRÂÓãR“°¢2çVG&F–47W'fUFòƒÂÓ"ÂÓ2ÂÓ“°¢2æ6Æ÷6UF‚‚“°¢ÒÂÓÂ“°¢òòF†Rv–æF–ær7G&æG3¢FVB6&ÆR×F—77VRw&VB÷fW"F†RvVfR(	@¢òò'&öç¦RÂ6vv–ærÂæWfW"6ÆVâ†ö÷ ¢2ç7G&ö¶U7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓ’ÂÓ"Â’Â‚“²2æÆ–æUv–GF‚Òãc²2æÆ–æT6Òw&÷VæBs°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚ÓÂãR“²2çVG&F–47W'fUFò‚Ó"Â2ãbÂ’ãRÂ“²2ç7G&ö¶R‚“°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó‚ãRÂRãR“²2çVG&F–47W'fUFòƒÂ‚Â‚ÂR“²2ç7G&ö¶R‚“°¢6VÒ‚ÓbÂÓrãRÂRÂÓ‚ãRÂã‚“°¢òòF†RÖs¢&–æröbF†÷&â†öö·2&÷VæBF†R7&÷vâ(	B6Æ÷6VBÆ÷r@¢òò&W7BÂ5$TBF‡&÷Vv‚F†RFVÆÂ‡F†R6–Æ†÷VWGFR—2F†R7FFRÂ'@¢òò&–&ÆR*s2ã2’Â6ÆVæ6†VBGW&–ærF†R&VVÂÂ†æv–ær6Æ6²v†VâÆ–× ¢6öç7B7&VBÒFVÆÂòã3R²³"¢ã¢&VVÂòã"¢Æ–×òãb¢ã3°¢f÷"†6öç7B¶ç‚Â5Òöbµ²ÓbÂÓÒÂ²Ó"ÂÓãEÒÂ³"ãRÂãEÒÂ³bãRÂÕÒ’°¢2ç6fR‚“²2çG&ç6ÆFR†ç‚ÂÓ’²ÖF‚æ'2‡2’¢ãB“°¢–b†Æ–×’2ç&÷FFR‡2¢"ã²ã2“²òòF†÷&ç2G&ö÷VB÷fW ¢VÇ6R2ç&÷FFR‡2¢ƒãRÒ7&VB¢ãr’“²òòfææ–ær÷Và¢g&ÖR‚‚’Óâ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Óã‚Â“°¢2çVG&F–47W'fUFò‚ÓãbÂÓ"ãRÒ7&VB¢RãRÂã’ÂÓ2ã"Ò7&VB¢b“°¢2çVG&F–47W'fUFòƒã’ÂÓãBÒ7&VB¢2Âã‚Â“°¢2æ6Æ÷6UF‚‚“°¢ÒÂÓ2Ò7&VB¢RÂÓ‚“°¢2ç&W7F÷&R‚“°¢Ð¢òòF†R6÷&R–âF†R'VÆ"w2†V'C¢F†R–æfV7F–öâw2÷vâ&VBÂVÇ6–æröà¢òòF†R&VB(	Bv†—FRÖ†÷BF‡&÷Vv‚F†RFVÆÂÂDTBD$²f÷"F†Rv†öÆP¢òòÆ–×v–æF÷rÂ6òF†R÷Væ–ær&VG27&÷72&ööÐ¢2ç6fR‚“°¢2ævÆö&ÄÇ†ÒÆ–×òã¢FVÆÂòãr²³"¢ã2¢ã3R²&VB¢ã3°¢66VçB‚‚’Óâ²2æ&Vv–åF‚‚“²2æVÆÆ—6R‡GvB¢ã‚ÂÓ"ãRÂBã"²³"¢"ÂR²³"ÂÂÂr“²2æf–ÆÂ‚“²ÒÂFVÆÂÇÂ&VVÂ“°¢2ç&W7F÷&R‚“°¢–b†Æ–×’°¢òòF†R7VçBFVæG&–ÂÂÇ––ærv†W&R—BfVÆÂ(	Bf—6–&Ç’V×G’†æG0¢2ç7G&ö¶U7G–ÆRÒr3V#C3s²2æÆ–æUv–GF‚Ò#²2æÆ–æT6Òw&÷VæBs°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡GvB¢2ÂÓ‚“°¢2çVG&F–47W'fUFò‡GvB¢"ÂÓ"ÂGvB¢rÂ"“°¢2çVG&F–47W'fUFò‡GvB¢#Â2ãRÂGvB¢#2Â2“²2ç7G&ö¶R‚“°¢ÒVÇ6R–b‚FVÆÂbb&VVÂbb6†æ6RƒãB’’°¢òò–FÆR'&VFƒ¢7÷&RÖ÷FRG&–gF–ærUöfbF†RÖr(	BF†RæW7@¢òòW††ÆW3²F†R&6†—fW2r6öÆBfÆÇ2ÂF†—2&—6W0¢FE'B†7‚²&æB‚ÓBÂB’ÂF†—2ç’Ò"Â&æB‚Ó‚Â‚’Â×&æBƒ‚Â#B’ÂãbÂr6fc––rÂãRÂÓ#BÂG'VR“°¢Ð¢W–W2‚ÓBÂÓbÂãr“°¢2ç&W7F÷&R‚“²òòF†RÆVà¢2ç&W7F÷&R‚“²òòF†RVâÖfÆ— ¢'&V³°¢Ð¢FVfVÇC¢°¢òòdµB(	B&öÇFVBF÷vâÂ7F–ÆÂwV&F–ærFö÷"F†BÆVG2æ÷v†W&Râ&ö÷FV@¢òòG&W¦ö–C¢F†RöæÇ’Ö–Ö–2v—F‚æòÆVw2æB†÷&—¦öçFÂ&6Rà¢6öç7B‚ÒF†—2ææ–Ò¢3°¢6öç7B–ÒÒÖF‚ç6–â‡‚¢ãR’¢ã##°¢òò&6RÂv–FW"BF†RfÆö÷"Âv—F‚f—6–&ÆRæ6†÷"&öÇG0¢ÆFR‚‚’Óâ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó2ÂR“²2æÆ–æUFò‚Ó‚Â"“²2æÆ–æUFòƒ‚Â"“²2æÆ–æUFòƒ2ÂR“²2æ6Æ÷6UF‚‚“°¢ÒÂÂR“°¢f÷"†6öç7B'‚öb²Ó’ãRÂ’ãUÒ’¦ö–çB†'‚Â"ãBÂãb“°¢6VÒ‚Ó‚ãbÂbÂ‚ãbÂbÂã"“°¢òò6†÷VÆFW"6öÆÆ"(	B†VBÖ&VÖ72Âv†W&R&V6övæ—F–öâÆ—fW0¢ÆFR‚‚’Óâ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó’Â"“²2æÆ–æUFò‚ÓrãRÂÓ2“²2æÆ–æUFòƒrãRÂÓ2“²2æÆ–æUFòƒ’Â"“²2æ6Æ÷6UF‚‚“°¢ÒÂÓBÂ2“°¢2ç6fR‚“²2ç&÷FFR†–Ò“°¢òòGW'&WB†VB²&'&VÀ¢ÆFR‚‚’Óâ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚ÓbãRÂÓ2“²2æÆ–æUFò‚ÓRÂÓ“²2æÆ–æUFòƒRÂÓ“²2æÆ–æUFòƒbãRÂÓ2“²2æ6Æ÷6UF‚‚“°¢ÒÂÓÂÓ"“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBç7FVVÂÂÓ2ÂÓ’ÂÓRÂÓR“²2æf–ÆÅ&V7B‚Ó2ÂÓ‚ãBÂ‚Â2ãB“²òò&'&VÀ¢66VçB‚‚’Óâ²òò&26ö–Ç0¢f÷"†ÆWB’Ò²’Â3²’²²’2æf–ÆÅ&V7B‚Ó"²’¢"ãBÂÓ‚ã‚ÂÂBã"“°¢ÒÂG'VR“°¢W–W2‚Ó2ãBÂÓ‚Â"“°¢2ç&W7F÷&R‚“°¢òò‡F†RÆö6²Æ–v‡B—2G&vâ–âG&r‚’Â&÷fRWfW'’V&Ç’&WGW&â¢'&V³°¢Ð¢Ð¢2ç&W7F÷&R‚“°¢Ð§Ð ¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòD„R44ÄRÄr‡7&—FR7V2Â6V7F–öâ3¢tõ$ÄB44ÄRò4„$5DU"44ÄR’à¢òò…¤BÓ“’—2F†R6æöæ–6Â&VfW&Væ6Râ÷&F–æ'’Ö–æ–öç2×W7B&VB4ÔÄÄU"F†â†W#°¢òòWfW'’&÷72×W7B&VBÄ$tU"âGvòÖ–æ–öç2†BG&–gFVB÷WBöbF†B÷&FW#¢F†P¢òòfÆ–W"æBF†R&Æö"vW&RG&vâB&÷72ÖÆ–¶R×VÇF—ÆW2öbF†V—"÷vâ†—F&÷€¢òò‡ã"ãW‚æBã"ãw‚Âv–ç7BããCW‚f÷"WfW'—F†–ærVÇ6R’Âv†–6‚W6†VB&÷F‚&÷fP¢òòF†R†W&ò(	BæBW6†VBF†R&Æö"&÷fRâ7GVÂ&÷72à¢òð¢òòF†—2G&–×2F†RE$t”äröæÇ’â6öÆÆ—6–öâ&÷†W2ÂFÖvRæBf–v‡BGVæ–ær&P¢òòVçF÷V6†VBÂæBF†R66ÆR—2F¶Vâ&÷WBV6‚7&VGW&Rw2w&÷VæBÖ6öçF7Bö–ç@¢òò6òfVWB7F’ÆçFVBöâF†R6ÖRfÆö÷"Æ–æR‡6V7F–öâÓ¢u$õTäD”är’à¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòF†R&Æö"—2÷fW'6—¦VB–â$õD‚vÖW2(	B—B†2æò†æBÖG&vâöG—76W’6†VWBÂ6ð¢òòF†RöG—76W’G&w2—Bg&öÒF†R6ÖRFÆ2æB–æ†W&—G2F†R6ÖR&ö&ÆVÒâF†P¢òòfÆ–W"öæÇ’÷fW'6†ö÷G2–â4Ät%•DS²F†RöG—76W’w2v†÷7B†2—G2÷vâ6†VWBæ@¢òòÇ&VG’6—G26÷'&V7FÇ’VæFW"F†B†W&òÂ6òG&–ÖÖ–ær—BF†W&Rv÷VÆB6‡&–æ²—@¢òòFòæ÷F†–ærà¦6öç7BTE$rÒ²&Æö#¢ãSbÓ°¢òò4ôÕ$$ÄRt•D‚D„R„U$ò†÷væW"Â##bÓ’Óƒ¢&Ö¶RF†V—"6—¦R6ö×&&ÆRv—F€¢òò×’†W&ò"’âÖV7W&VB&F†W"F†âwVW76VB(	B6†RG&w2sg‚–â4Ät%•DRÂæBF†P¢òòÖ6†–æW26ÖR–âg&öÒã#‡‚öbF†B‡F†R&B’Fòã“W‚‡F†RGW'&WB’Â6òF†P¢òò¶–ævFöÒVÖ—GFW'2æBF†R6ÖÆÂfÆ–W'2vW&R&VF–ær2&÷2&W6–FR†W"âF†W6P¢òò'&–ærF†RÆ÷rVæBWFò&÷Vv†Ç’ãSbÓãƒ'ƒ¢VæÖ—7F¶&Ç’†W"vV–v‡B6Æ72À¢òò7F–ÆÂVæFW"†W"Âv†–6‚¶VW2F†R44ÄRÄr&÷fR–çF7B†Ö–æ–öç2&VB6ÖÆÆW"À¢òòwV&F–ç2&VBÆ&vW"’à¢òð¢òò4Ät%•DRôäÅ’ÂæBF†B—2æ÷Bâ÷fW'6–v‡BâF†R6ÖR&ö&Rv–ç7BF†P¢òòöG—76W’'V–ÆBÖV7W&W2—G2÷vâ†W&òBc‚v—F‚7&vÆW"÷GW'&WBö†÷W"Å$TE¢òòBãRóã‚óãöb†W"(	BF†Bv÷&ÆBw26†VWG2&RF†V—"÷vâÂæB6†&V@¢òò×VÇF—Æ–W"v÷VÆBW6‚F†–æw2F†B&RÇ&VG’Föò&–rgW'F†W"7B—G2†W&òà¢òòwV&BæB†÷W"&R'6VçB&V6W6RF†W’ÖV7W&VB–â†W"&æBÇ&VG“²¢òòçVÖ&W"F†B6†ævW2æ÷F†–ær—2çVÖ&W"F†Bv–ÆÂG&–gBà¢òð¢òòF†REU%$UBvöW2F†R÷F†W"v’ÂæB—B—2F†RöæRF†–ær†W&RF†Bv÷B4ÔÄÄU"à¢òòÖV7W&VBv–ç7B–ææVBÂgVÆÇ’ÖFV6öFVB–FÆR—B&VG2ã‚öb†W"(	B¢òòÖ–æ–öâ7FæF–ærg&7F–öæÆÇ’FÆÆW"F†âF†R&÷Fvöæ—7BÂv†–6‚—2F†R44ÄP¢òòÄr'&ö¶Vâ&F†W"F†âÖW&VÇ’&ö6†VBâ—B†2&VVâF†Bv’f÷"v†–ÆP¢òòæBæ÷F†–ær6Vv‡B—BÂ&V6W6Ræ÷F†–ærÖV7W&VB—BâãƒrWG2—BBãƒ‡ƒ ¢òò7F–ÆÂF†R&–vvW7BÖ6†–æR–âF†R&÷7FW"Â7F–ÆÂ6ÆV&Ç’VæFW"†W"à¦6öç7BTE$uõ$ô$òÒ°¢7&vÆW#¢ã‚ÂfÆ–W#¢ã“bÂ&Æö#¢ãsrÂ&C¢"ãÀ¢7W&vS¢ãrÂ¶–Æã¢ãrÂ&–ÖS¢ãbÂ6æ&S¢ãcRÂ6vS¢ã#"ÂGW'&WC¢ãƒrÀ§Ó°¦6öç7BöVæV×”G&u&rÒVæV×’ç&÷F÷G—RæG&s°¤VæV×’ç&÷F÷G—RæG&rÒgVæ7F–öâ†2’°¢6öç7B†W&òÒG—Vöb—4†W&òÓÓÒvgVæ7F–öârbb—4†W&ò‚“°¢òòF†R&ö&òF&ÆR—2âõdU%$”DRÂæ÷BfÆÆ&6³¢F†R&Æö"6'&–W26†&V@¢òòG&–Òf÷"F†RöG—76W’æB—G2÷vâÆ&vW"çVÖ&W"†W&RÂæBF†RöÆB&V6VFVæ6P¢òò‡6†&VBf—'7B’ÖFR&ö&òVçG'’f÷"—BVç&V6†&ÆRà¢6öç7B²Ò††W&òò¢TE$uõ$ô$õ·F†—2æ¶–æEÒ’ÇÂTE$u·F†—2æ¶–æEÓ°¢–b‚²’&WGW&âöVæV×”G&u&ræ6ÆÂ‡F†—2Â2“°¢6öç7B‚ÒF†—2ç‚²F†—2çrò"Â’ÒF†—2ç’²F†—2æƒ°¢2ç6fR‚“°¢2çG&ç6ÆFR‡‚Â’“²2ç66ÆR†²Â²“²2çG&ç6ÆFR‚×‚Â×’“°¢G'’²öVæV×”G&u&ræ6ÆÂ‡F†—2Â2“²Òf–æÆÇ’²2ç&W7F÷&R‚“²Ð§Ó° ¢òòGVÖ&Æ–ær'W&æ–ærw&V6²(	BF†RG&ÖF–2VæV×’FVF€¦6Æ72w&V6²°¢6öç7G'V7F÷"†RÂ·‚Â·’’°¢F†—2ç‚ÒRçƒ²F†—2ç’ÒRç“²F†—2çrÒRçs²F†—2æ‚ÒRæƒ²F†—2æ¶–æBÒRæ¶–æC°¢6öç7BâÒÖF‚æ‡—÷B†·‚Â·’’ÇÂ°¢F†—2çg‚Ò†·‚òâ’¢&æBƒ#CÂ3ƒ’²&æB‚ÓCÂC“°¢F†—2çg’Ò†·’òâ’¢##Ò&æBƒƒÂ3#“°¢F†—2ç&÷BÒ²F†—2çg"Ò&æB‚Ó’Â’’ÇÂc°¢F†—2çBÒ&æBƒãrÂ“²F†—2æFVBÒfÇ6S²F†—2æ&÷Væ6VBÒ°¢Ð¢WFFR†GB’°¢F†—2çBÓÒGC²F†—2ç&÷B³ÒF†—2çg"¢GC°¢F†—2çg’³Ò“¢GC°¢6öç7BbÒF†—2çg“°¢6öç7B6öÂÒÖ÷fTVçB‡F†—2ÂGB“°¢–b†6öÂæBbbbâ#’°¢F†—2çg’Ò×b¢ãCS²F†—2çg‚£Òãs²F†—2çg"£Òãƒ²F†—2æ&÷Væ6VB²³°¢6g‚‚w†—Br“°¢'W'7B‡F†—2ç‚²F†—2çrò"ÂF†—2ç’²F†—2æ‚ÂRÂr3–f#†3‚rÂÂã2ÂSÂ"“°¢Ð¢–b†6öÂæÂÇÂ6öÂç"’F†—2çg‚£ÒÓãS°¢–b†6†æ6RƒãB’’FE'B‡F†—2ç‚²&æBƒÂF†—2çr’ÂF†—2ç’²&æBƒÂF†—2æ‚’Â&æB‚ÓCÂC’Â&æB‚Ó“Â’Âã3RÂ6†æ6RƒãR’òr6ffCsfr¢r6fc†V2rÂ"ãRÂSÂG'VR“°¢–b‡F†—2çBÃÒÇÂF†—2æ&÷Væ6VBãÒ2ÇÂöå7–¶R‡F†—2’ÇÂF†—2ç’ârç&ööÔFVbæ‚¢D”ÄR²c’F†—2æW‡ÆöFR‚“°¢Ð¢W‡ÆöFR‚’°¢–b‡F†—2æFVB’&WGW&ã°¢F†—2æFVBÒG'VS°¢6öç7B7‚ÒF†—2ç‚²F†—2çrò"Â7’ÒF†—2ç’²F†—2æ‚ò#°¢6g‚‚ww&V6¶&–rr“²6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂB“°¢'W'7B†7‚Â7’Â#"ÂÅ´rç&ööÔFVbç¦öæUÒævÆ÷rÂ3ÂãbÂCÂBÂG'VR“°¢'W'7B†7‚Â7’ÂÂr6ffCsfrÂ#CÂãRÂcÂ2ÂG'VR“°¢ræFE&–ær†7‚Â7’“°¢òòF†Rv¶–ærfÆö÷"w2öæRÖ6†–æR—2f÷"F†RÆW76öâF†BföÆÆ÷w2—C¢F†P¢òòG&FW"Gvò67&VVç2v’—2W6VÆW72–bF†Rf—'7B¶–ÆÂ6ææ÷B'W’ç—F†–æp¢òòg&öÒ†–ÒÂæBGWF÷&–ÂF†B6·2–÷RFòf&Ò—2æ÷BGWF÷&–Âà¢ræG&÷67&†7‚Â7’Ârç&ööÔ–BÓÓÒtrò‚¢—&æBƒBÂ’’“°¢ræÖ–&TG&÷&VÆ–2†7‚Â7’“°¢Ð¢G&r†2’°¢2ç6fR‚“°¢2çG&ç6ÆFR‡F†—2ç‚²F†—2çrò"ÂF†—2ç’²F†—2æ‚ò"“°¢2ç&÷FFR‡F†—2ç&÷B“°¢2æf–ÆÅ7G–ÆRÒr33“C#Fbs°¢'"†2Â×F†—2çrò"Â×F†—2æ‚ò"²2ÂF†—2çrÂF†—2æ‚ÒbÂR“²2æf–ÆÂ‚“°¢2æf–ÆÅ7G–ÆRÒr3##c&bs°¢2æf–ÆÅ&V7B‚×F†—2çrò"²2ÂÓ2ÂF†—2çr¢ãBÂR“°¢2æf–ÆÅ7G–ÆRÒw&v&ƒ#SRÃ3‚Ã“"Ãã’’s²2ç6†F÷t6öÆ÷"Òr6fc†V2s²2ç6†F÷t&ÇW"Òƒ°¢2æ&Vv–åF‚‚“²2æ&2‡F†—2çr¢ãRÂÓ"Â"ãRÂÂr“²2æf–ÆÂ‚“°¢2ç6†F÷t&ÇW"Ò°¢2ç&W7F÷&R‚“°¢Ð§Ð ¢òòUdU%’t”äBÕUtT%2D„R4ÔR4ôÄõU"âöæR‡VRÂöæRÖVæ–ærÂW6VB'’æ÷F†–æp¢òòVÇ6R–âF†RvÖR(	BæBÇv—2v—F‚Ö÷F–öâæB6÷VæB&W6–FR—BÂ&V6W6P¢òò&÷Vv†Ç’öæRÖâ–âGvVÇfR6ææ÷B&VÇ’öâ‡VRÆöæRâgVæ7F–öâæ÷r&F†W ¢òòF†â&Æö6²–ç6–FRVæV×’æG&rÂ&V6W6RF†RWF†÷&VBfÆ–W'2&WGW&âg&öÐ¢òòG&rÆöær&Vf÷&RF†B&Æö6²æB6òv÷VæBWf÷"F†V—"F—fRv—F‚æò&–æræ@¢òòæòvVFvRBÆÂ(	BF†RFö2w2&Ö&W"&–ær²F÷vçv&BvVFvR"„TäTÕ•ôdÄ”U"#R¢òòv2öæÇ’WfW"G'VRöbF†RfÆÆ&6²âFV6÷&F–öâÂæ÷B&öG“¢öfbVæFW ¢òòræ'E&ö&RÆ–¶RF†RwV&F–ç2rv6‚Â6òF†R&–&ÆRÖV7W&W2F†R6–Æ†÷VWGFRà¢òòF†RF6‚7&vÇ2öâF†R4”ÕTÄD”ôâ6Æö6²†æ–Ò’ÂæWfW"F†RvÆÂ6Æö6²à¦gVæ7F–öâG&tVæV×•FVÆÂ†2ÂRÂ7‚’°¢–b†RæFVBÇÂræ'E&ö&R’&WGW&ã°¢òòF†RGW'&WBw2Äô4²—2v–æB×WÆ–¶Rç’÷F†W"æBvV'2F†R6ÖR&–ær(	@¢òò—G2&VÒ6—2v†W&RÂF†R&–ær6—2—B—26öÖ–ærÂ2WfW'—v†W&RVÇ6RâF†P¢òò†—"×G&–vvW"&RÖÆö6·2&WGvVVâ'W'7Bw26†÷G2ƒã2’&Ræ÷BFVÆÂà¢6öç7BÆö6²Ò†RæÆö6µBÇÂ’âãRòRæÆö6µB¢°¢–b‚‚†Ræ6ö–ÅBÇÂ’âÇÂ†Ræ†öÆEBÇÂ’âÇÂ†Ræ7&÷V6…BÇÂ’âÇÂÆö6²’’&WGW&ã°¢6öç7BrÒÖF‚æÖ‚†Ræ6ö–ÅBÇÂÂRæ†öÆEBÇÂÂRæ7&÷V6…BÇÂÂÆö6²“°¢6öç7B²ÒÒ6Æ×‡ròDTÄÅôd5BÂÂ“°¢2ç6fR‚“°¢2ævÆö&ÄÇ†Òã3²²¢ãS°¢2ç7G&ö¶U7G–ÆRÒDTÄÅô4ôÃ²2æÆ–æUv–GF‚Ò"²²¢ãC°¢2ç6WDÆ–æTF6‚…³RÂUÒ“²2æÆ–æTF6„öfg6WBÒÒ†Rææ–ÒÇÂ’¢òSS°¢2æ&Vv–åF‚‚“°¢2æ&2†7‚ÂRç’²Ræ‚ò"ÂRçr¢ãs"²Ò²¢bÂÂr“°¢2ç7G&ö¶R‚“²2ç6WDÆ–æTF6‚…µÒ“°¢òòvVFvRö–çF–ærv†W&R—B—2&÷WBFòvò(	BÖ÷F–öâÂæ÷B§W7B6öÆ÷W ¢6öç7BG‚Ò†Ræ6ö–ÅBÇÂRæ7&÷V6…B’òRæF—"¢ÂG’ÒRæ†öÆEBò¢°¢–b†G‚ÇÂG’’°¢2ævÆö&ÄÇ†ÒãR²²¢ãS²2æf–ÆÅ7G–ÆRÒDTÄÅô4ôÃ°¢6öç7B÷‚Ò7‚²G‚¢†Rçr¢ã’²²¢’Â÷’ÒRç’²Ræ‚ò"²G’¢†Ræ‚¢ã’²²¢“°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò†÷‚²G’¢r²G‚¢rÂ÷’²G‚¢r²G’¢r“°¢2æÆ–æUFò†÷‚ÒG’¢rÒG‚¢Â÷’ÒG‚¢rÒG’¢“°¢2æÆ–æUFò†÷‚²G‚¢2²G’¢Â÷’²G’¢2²G‚¢“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°§Ð¢òòD„RdÅ””ärÔ”ä”ôâu25DDU2âF†R6ÖÆÂDÄôä„õ5B†G&tVvÆTÖ–æ’ÂVvÆRæ§2¢òòfÆ2÷"7Fö÷2æBæ÷F†–ærVÇ6RÂ6ò—G2v–æB×WÂ—G2v—F†G&vÂæB—G0¢òò&W7BöâÆVFvRvW&RÆÂF†R6ÖRfÆ–ær–7GW&RâF†RwV&F–âw2÷vâ6†VW@¢òòÇ&VG’†öÆG2F†R÷6W2F†÷6R7FFW2vçBÂ6òF†W’&RF¶Vâg&öÒ—BÂöæP¢òòv†öÆRf–wW&RV6‚ÂBF†RÖ–æ’w266ÆS ¢òò†öÆEBò6¶WEB(	B´6†&vS¢v–æw2F‡&÷vâv–FRÂF†R6÷&RÆ—BâF†R5Dõ–à¢òòF†R—"F†B—2—G2FVÆÂÂæ÷r6†R2vVÆÂ27F÷à¢òò&—6UB(	Bµ&V6÷fW#¢v–æw2G&ö÷VBÂ6Æ–Ö&–ær÷WB7VçBâF†R÷Væ–ærà¢òòW&6†VB(	B&W7C¢föÆFVBÂ6BöâF†RÆVFvRBF†RVæBöb—G2&VBà¢òòWfW'—F†–ærVÇ6R—2F†RÖ–æ’w2÷vâfÆ–v‡BÂ$ä´TBF÷v&Bv†W&R—B—2vö–ær(	@¢òò—B—2G&vâg&öçBÖöâÂ6òÆVæ–ær–çFò—G2G&fVÂ—2†÷r—Bf6W2—Bà¢òòD„RÔ”ä’u2õtâdÄ”t…B•2d”ÄÔTB„%EõTUTR*s&62×f’“¢7'V—6R&VB@¢òòG&öÂ6RæB†&FW"6†6R&VBÂV6‚öæRv–æv&VBöbÖV7W&VBÖF—7F–æ7@¢òò6VÆÇ2Âg&öçBÖöâÆ–¶RF†Rf–wW&R—"F†W’&WÆ6RæB&æ¶VBF†R6ÖRv’à¢òòæB—BU$4„U2öâÆFRöb—G2÷vâ–ç7FVBöb&÷'&÷v–ærF†R&÷72w2à¢òò6VÆÂ6—¦W2&R–â†—F&÷‚t”ED…2ÂÖF6†VBFòF†Rf–wW&W2rG&vâv–æw7à¢òò‡F÷vã¢"ã3’v–GF‡27&÷72BF†RÖ–æ’w266ÆR’à¦6öç7BDÄôåôÔ”ä’Ò°¢7'V—6S¢²–Ös¢wFÆöäÖ–æ”7'V—6S‚rÂ6VÆÇ3¢‚Â&VC¢ãrÂs¢"ãC"ÒÀ¢6†6S¢²–Ös¢wFÆöäÖ–æ”6†6SbrÂ6VÆÇ3¢bÂ&VC¢ãC"Âs¢"ãC"ÒÀ§Ó°¦gVæ7F–öâG&tfÆ–W$Ö–æ’†2ÂR’°¢6öç7Bf–rÒ‚†Ræ†öÆEBÇÂ’âÇÂ†Rç6¶WEBÇÂ’â’òv´6†&vRp¢¢†Rç&—6UBÇÂ’âòvµ&V6÷fW"r¢RçW&6†VBòw&W7Br¢çVÆÃ°¢6öç7B7‚ÒRç‚²Rçrò"Â7’ÒRç’²Ræ‚ò#°¢–b†f–rÓÓÒw&W7BrbbG—VöbG&u7G&—6VÆÂÓÓÒvgVæ7F–öâr’°¢6öç7B‚ÒRçr¢"ã3²òò&W7B—2"ã"v–GF‡27&÷70¢–b†Ræ‡W'EBâ’2ævÆö&ÄÇ†Òãs#°¢6öç7Bö²ÒG&u7G&—6VÆÂ†2ÂwFÆöäÖ–æ•W&6‚rÂÂÂ7‚ÂRç’²Ræ‚Â‚Â†RæF—"ÇÂÓ’â“°¢2ævÆö&ÄÇ†Ò°¢–b†ö²’&WGW&âG'VS°¢Ð¢–b‚f–r’°¢6öç7B&æ²Ò6Æ×‚†Rçg‚ÇÂ’òÖF‚æÖ‚ƒcÂRç7BÇÂc’ÂÓÂ’¢ã##°¢2ç6fR‚“°¢2çG&ç6ÆFR†7‚Â7’“²2ç&÷FFR†&æ²“²2çG&ç6ÆFR‚Ö7‚ÂÖ7’“°¢ÆWBö²ÒfÇ6S°¢G'’°¢òòF†R6†6R&VBv†Vâ—B—2F—f–ær÷"fÇ––ærfÆB÷WBÂF†R7'V—6R÷F†W'v—6P¢6öç7Bf7BÒ†Rçg’ÇÂ’â#ÇÂÖF‚æ‡—÷B†Rçg‚ÇÂÂRçg’ÇÂ’âÖF‚æÖ‚ƒ“Â†Rç7BÇÂc’¢ãB“°¢6öç7BBÒf7BòDÄôåôÔ”ä’æ6†6R¢DÄôåôÔ”ä’æ7'V—6S°¢6öç7B6‚ÒRçr¢Bçs°¢6öç7B6VÆÂÒÖF‚æfÆö÷"‚‚‚‚†Rææ–ÒÇÂ’òBæ&VB’R’²’R¢Bæ6VÆÇ2“°¢–b†Ræ‡W'EBâ’2ævÆö&ÄÇ†Òãs#°¢–b†Ræ‡—æõBâ’2ævÆö&ÄÇ†ÒãƒS°¢ö²ÒG—VöbG&u7G&—6VÆÂÓÓÒvgVæ7F–öârbbG&u7G&—6VÆÂ†2ÂBæ–ÖrÂ6VÆÂÂBæ6VÆÇ2Â7‚Â7’²6‚ò"Â6‚ÂfÇ6R“°¢2ævÆö&ÄÇ†Ò°¢–b‚ö²’ö²ÒG&tVvÆTÖ–æ’†2ÂR“°¢Òf–æÆÇ’²2ç&W7F÷&R‚“²Ð¢&WGW&âö³°¢Ð¢–b‡G—VöbVtf–tÓÒvgVæ7F–öârÇÂG—VöbVvÆT–ÖrÓÒvgVæ7F–öâr’&WGW&âfÇ6S°¢TuõU$RÒfÇ6S°¢6öç7B–ÒÒVvÆT–Ör‚“²–b‚–ÒÇÂ–ÒææGW&Åv–GF‚’&WGW&âfÇ6S°¢G&tVæV×•FVÆÂ†2ÂRÂ7‚“°¢2ç6fR‚“°¢G'’°¢6öç7B2Ò†Rçr¢2ã"’òS3#°¢òòW&6†VB&—&Bw2vV–v‡B—2öâ—G2fVWC¢6BöâF†RÆVFvRÂæ÷B‡Væp¢òò÷fW"—BB—G2fÇ––ær†V–v‡@¢2çG&ç6ÆFR†7‚ÂRçW&6†VBòRç’²Ræ‚¢ãc"¢7’“°¢2ç66ÆR…2Â2“°¢–b†Ræ‡W'EBâ’2ævÆö&ÄÇ†Òãs#°¢–b†Ræ‡—æõBâ’2ævÆö&ÄÇ†ÒãƒS°¢Vtf–t†2Âf–rÂÂf–rÓÓÒvµ&V6÷fW"ròã"¢f6U6–FR†R’¢“°¢Ò6F6‚†S"’²2ç&W7F÷&R‚“²&WGW&âfÇ6S²Ð¢2ç&W7F÷&R‚“°¢&WGW&âG'VS°§Ð¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÒ$õ54U2ÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÐ¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòU4”ärD„Rt„ôÄREU$åD$ÄRà¢òð¢òòWfW'’Ö6†–æR—2&R×&VæFW&VB4BGW&æ&÷VæBÂV–v‡BWF†÷&VBævÆW2F†BF†P¢òò&VæFW&W"7&÷72ÖfFW2&WGvVVâ(	B'WBF†RöæÇ’F†–ærF†BWfW"Ö÷fVBF†R–rv0¢òòv†–6‚v’—Bv2f6–ærâF†BÖ¶W2GW&â&VB2föÇVÖRæBWfW'—F†–æp¢òòVÇ6R&VB27WF÷WBÂv†–6‚—2v‡’F†R67BÆöö¶VBfÆGFW"F†âF†R'@¢òò7GVÆÇ’—2à¢òð¢òò6òF†R–ræ÷rç7vW'2Fòv†BF†RÖ6†–æR—2Dô”är2vVÆÂ2v†W&R—B—0¢òòÆöö¶–ærâæ÷F†–ær†W&R6†ævW26–Æ†÷VWGFR÷"ÆWGFS¢—B—2F†R6ÖP¢òòWF†÷&VBg&ÖW2Â6×ÆVBBævÆW2F†W’vW&R&VæFW&VBf÷"æBæWfW"&V6†VBà¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¦gVæ7F–öâVæV×•–r†R’°¢òòGW&çF&ÆR&÷r&VæFW&VBF†R÷F†W"v’&÷VæB&VG2—G2f6–ærÖ—'&÷&V@¢òò„DÄ2ç7V%¶¶–æEÒç–tfÆ—Â§2öFÆ2æ§2’(	B†W&RFöòÂ÷"F†RvÆ¶W"w2&6P¢òòævÆRVæFöW2—BæBF†R&öG’GW&ç2—G2&6²F†RÖöÖVçB—B7F÷0¢6öç7B7V"ÒG—VöbDÄ2ÓÒwVæFVf–æVBrbbDÄ2ç7V%¶Ræ¶–æEÓ°¢6öç7B&6RÒ–t6öÄb…7V"bb7V"ç–tfÆ—òÖRæf6Uf—2¢Ræf6Uf—2“°¢òòF†RGW&çF&ÆRw&2ÂæBævÆW2RÓr&RF†R$4²öbF†RÖöFVÂâ¢òò6–FR×67&öÆÆW"×W7BæWfW"6†÷rF†÷6RÂ6òWfW'’öfg6WB—26Æ×VBFò¶VWF†P¢òòv†öÆR7vVW–ç6–FRF†Rg&öçB†VÖ—7†W&RâãB(	BÖV7W&VBÂ&V6W6RF†Rf—'7@¢òòfW'6–öâöbF†—2†–Ç’&÷FFVB7&vÆW"&÷VæBFòf6Rv’g&öÒ6ÖW&à¢6öç7B2Ò†2Â’Óâ‡²3¢6Æ×†2ÂÂBÒ’Â#¢ÂÒ“°¢òòäòÔõ$R„TBÕ44âôâå•D„”ärD„BtÄµ2âF†R7&vÆW"7vWB—G2–r+ã# ¢òòf÷&WfW"æBWfW'’÷F†W"vÆ¶W"fVÆÂF‡&÷Vv‚Fò+ã#RFVfVÇBÂæBF†P¢òò&VæFW&W"7&÷72ÖfFVBF†RGvòævÆW2V—F†W"6–FRöbv†W&WfW"F†R7vVW†@¢òòv÷BFò(	BW&ÖæVçBF÷V&ÆRW‡÷7W&R‡Æâ*s’âvÆ¶W"æ÷rf6W2v†W&P¢òò—G2fVWB&Rvö–æræBæ÷F†–ærVÇ6Râv†W&Râöfg6WB7W'f—fW2‡F†P¢òò†÷W"w2Gv—7B–âF†R—"ÂF†R&Æö"w2&öÆÂÂF†RfÆ–W"w2&æ²’—BÖ÷fW2F†P¢òòævÆRF†R&öG’—24„õtâBÂöæRWF†÷&VBævÆRBF–ÖR†G&tFÆ0¢òò6–ævÆV’ÂæWfW"Gvò–7GW&W2Böæ6Rà¢7v—F6‚†Ræ¶–æB’°¢66RwGW'&WBs ¢òò6VçG'’7vVW–ær—G2&2(	B—BFöW2æ÷BvÆ²Â6òF†R7vVW•2—G0¢òòÖ÷F–öââv†–ÆR—BÄô4µ2ÂæBF‡&÷Vv‚F†R¶–6²gFW"F†R6†÷BÂ—B7F÷0¢òò7vVW–æræBGW&ç2—G2&'&VÂ7V&RöçFò†W#¢F†R7F÷æBF†RGW&à¢òò&R'BöbF†RFVÆÂÂæBF†R&VÒÆVfW2F†R×W§¦ÆR—B—2G&vâg&öÒà¢–b‚†RæÆö6µBÇÂ’âÇÂ†Ræ¶–6µBÇÂ’âÇÂ†RçG&–åBÇÂ’â’°¢6öç7BBÒ‡G—VöbÆ–W"ÓÒwVæFVf–æVBrbbÆ–W"¢ò„ÖF‚ç6–vâ‡Æ–W"ç‚²Æ–W"çrò"Ò†Rç‚²Rçrò"’’ÇÂ’¢°¢&WGW&â2‡–t6öÄb‡B’Â“°¢Ð¢&WGW&âö&¦V7Bæ76–vâ…2ƒ"Âãb’Â²#¢ãSRÒ“°¢66RvfÆ–W"s ¢òò$äµ2–çFò—G2÷vâÖ÷fVÖVçBÂF†Rv’ç—F†–ærF†BfÆ–W2†2Fð¢&WGW&â2†&6R²6Æ×†Rçg‚òSÂÓÂ’¢ãRÂ“°¢66Rv&Æö"s ¢òòÖ72F†B†2æòg&öçB&öÆÇ2v†W&R—B—2vö–æp¢&WGW&â2†&6R²6Æ×†Rçg‚ò#ÂÓÂ’¢ã‚Â“°¢FVfVÇC ¢&WGW&âçVÆÃ°¢Ð§Ð¢òòt„”4‚õ4RD„R5DDRtT%2†G&tFÆ2DÄ5õõ4R’âWfW'’GF6²†2v–æBÐ¢òòWæB&V6÷fW'’ÂæBV6‚öbF†VÒæ÷r6†ævW2F†R4”Ä„õTUEDR&F†W"F†à¢òòöæÇ’F†R6öÆ÷W#¢FW7G2ö'F&–&ÆRæ6§2w2TäTÕ’67BÖV7W&W2—Bà¢òòD„R$õ5DU"tÄµ2ôâd”ÄÔTB5E$”DU2„%EõTUTR*s&62Ö—b÷b’âF†RGW&çF&ÆP¢òò—2öæRWF†÷&VB–7GW&RW"ævÆRÂ6ò—G2vÆ²—27WBÖ÷WB&ö&&–ærÆöæp¢òòF†RfÆö÷#²F†W6R7G&—2&RöæR&VÂ7G&–FRV6‚Â7WBg&öÒ†–vw6f–VÆ@¢òòF¶Rv—F‚WfW'’6VÆÂÖV7W&VBF—7F–æ7BâÆ–VBöâF†R4ÔR6Æö6²2F†P¢òòGW&çF&ÆRw2v—B(	BfÆö÷"6÷fW&VBÂvÆ´BÂöæR7–6ÆRW"GvòDÄ5õ5E$”DW2(	@¢òò6òF†RfVWB6ææ÷B÷WG'VâF†Rw&÷VæBâ†—2F†R4TÄÂ†V–v‡B–â†—F&÷†W2À¢òòÖV7W&VB6òF†R7G&—&öG’ÖF6†W2F†RGW&çF&ÆR&öG’—B&WÆ6W2†wV&C ¢òòãƒ"†—F&÷†W2öbÖ6†–æRV—F†W"v“²&Æö#¢F†R6ÖRÆVæwF‚öb6†VÆÂ’à¢òòöæÇ’v†–ÆR6WGFÆVB–çFò†VF–æs¢F‡&÷Vv‚GW&âF†RGW&çF&ÆRw2ævÆW0¢òò&RF†R†öæW7B–7GW&RÂæBÖ—'&÷&VB&öf–ÆR—2æ÷Bà¢òòD„R4ÔRu$DR2D„R4„TUB•B5DäE2”âdõ"Â÷"F†R&öG’6†ævW26öÆ÷W ¢òòF†RÖöÖVçB—B7F'G2vÆ¶–æs¢F†RwV&Bw2GW&çF&ÆR—2F†Rç726†VWB‡÷ ¢òòw&FRÂãCR6†F÷rÆ–gB’ÂF†R&Æö"w2—2F†R&÷7FW"†—G26öÆ÷W"öf÷&Ò÷&–Ð¢òòw&FR—2&¶VB–çFòF†R7G&—f–ÆR(	BFööÇ3"&÷7FW&w&FRÂF†R6ÖRçVÖ&W'0¢òò2FÆ2æ§2(	BæBF†R÷w&FRv—F‚æòÆ–gB—2Æ–VB†W&R’à¦6öç7B$õ5DU%õtÄ²Ò°¢wV&C¢²–Ös¢vwV&EvÆ³‚rÂ6VÆÇ3¢‚Âƒ¢ãƒ’ÂÆ–gC¢ãCRÒÀ¢&Æö#¢²–Ös¢v&Æö$7&vÃ‚rÂ6VÆÇ3¢‚Âƒ¢BãÂÆ–gC¢ÒÀ§Ó°¦gVæ7F–öâG&u&÷7FW%vÆ²†2ÂRÂ7‚’°¢6öç7B2Ò$õ5DU%õtÄµ¶Ræ¶–æEÓ°¢–b‚2ÇÂRæFVBÇÂ‡G—Vöb—4†W&òÓÓÒvgVæ7F–öârbb—4†W&ò‚’’’&WGW&âfÇ6S°¢–b„ÖF‚æ'2†Rçg‚ÇÂ’Â"ÇÂVæV×”FÆ5÷6R†R’’&WGW&âfÇ6S°¢6öç7BgbÒRæf6Uf—2ÒçVÆÂòRæf6Uf—2¢†RæF—"ÇÂÓ“°¢–b„ÖF‚æ'2†gb’Âã’’&WGW&âfÇ6S°¢òòF†R7G&—6'&–W2F†RÆFR–â—G2&×3²wV&BF†B†26†VB—B—2æ÷BF†B–7GW&P¢–b†Ræ¶–æBÓÓÒvwV&BrbbRçÆFU6†VB’&WGW&âfÇ6S°¢òòF†RG&—æB—G2&V&÷VæB&RFVf÷&ÖF–öâöbF†RGW&çF&ÆR&öG¢–b†Ræ¶–æBÓÓÒv&Æö"rbb‚†RæG&—ÇÂ’âÇÂ†Ræ&Æö%&V"ÇÂ’â’’&WGW&âfÇ6S°¢6öç7B7–2Ò‚‚‚†RçvÆ´BÇÂ’òƒ"¢DÄ5õ5E$”DR’’R’²’R°¢6öç7B6VÆÂÒÖF‚æfÆö÷"†7–2¢2æ6VÆÇ2“°¢ÖVF–fWF6‚…2æ–ÖrÂ“°¢6öç7B&rÒÔTD”õ$uµ2æ–ÖuÓ°¢–b‚&rÇÂ&rææGW&Åv–GF‚’&WGW&âfÇ6S°¢6öç7B–ÒÒ‡G—Vöb÷'BÓÓÒvgVæ7F–öârbb÷'B…2æ–ÖrÂçVÆÂÂ2æÆ–gB’’ÇÂ&s°¢6öç7B‚ÒRæ‚¢2æ‚ÂfÆ—Ògbâ²òòWF†÷&VBf6–ærÄTe@¢6öç7B7rÒ–ÒææGW&Åv–GF‚ò2æ6VÆÇ2ÂGrÒ‚¢†7rò–ÒææGW&Ä†V–v‡B“°¢–b‡G—VöbrÓÒwVæFVf–æVBr’ræÆ7E7G&—Ò2æ–Ör²s¢r²6VÆÃ°¢2ç6fR‚“°¢2çG&ç6ÆFR†7‚ÂRç’²Ræ‚“°¢–b†fÆ—’2ç66ÆR‚ÓÂ“°¢–b†Ræ‡W'EBâ’2ævÆö&ÄÇ†ÒãƒS°¢2æG&t–ÖvR†–ÒÂ6VÆÂ¢7rÂÂ7rÂ–ÒææGW&Ä†V–v‡BÂÖGrò"ÂÖ‚ÂGrÂ‚“°¢–ædW–T'B†2Â2æ–ÖrÂ6VÆÂÂÖGrò"ÂÖ‚ÂGrÂ‚“°¢–b†Ræ‡W'EBâ’°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s²2ævÆö&ÄÇ†ÒãS°¢2æG&t–ÖvR†–ÒÂ6VÆÂ¢7rÂÂ7rÂ–ÒææGW&Ä†V–v‡BÂÖGrò"ÂÖ‚ÂGrÂ‚“°¢Ð¢2ç&W7F÷&R‚“°¢&WGW&âG'VS°§Ð¦gVæ7F–öâVæV×”FÆ5÷6R†R’°¢7v—F6‚†Ræ¶–æB’°¢66RvwV&Bs ¢–b‚†Ræ6ö–ÅBÇÂ’âÇÂ†Ræ7&÷V6…BÇÂ’â’&WGW&âv6ö–Âs°¢–b‚†RæÇVævUBÇÂ’â’&WGW&âvÇVævRs°¢–b‚†Rçv–æFVEBÇÂ’â’&WGW&âwv–æFVBs°¢&WGW&âçVÆÃ°¢66RvfÆ–W"s ¢–b‚†Ræ†öÆEBÇÂ’âÇÂ†Rç6¶WEBÇÂ’â’&WGW&âv6ö–Âs°¢–b‚†RæF—fUBÇÂ’â’&WGW&âvÇVævRs°¢–b‚†Rç&—6UBÇÂ’â’&WGW&âwv–æFVBs°¢–b†RçW&6†VB’&WGW&âwW&6‚s°¢&WGW&âçVÆÃ°¢66RwGW'&WBs ¢–b‚†RæÆö6µBÇÂ’â’&WGW&âv6ö–Âs°¢–b‚†Ræ¶–6µBÇÂ’â’&WGW&âv¶–6²s°¢&WGW&âçVÆÃ°¢FVfVÇC ¢&WGW&âçVÆÃ°¢Ð§Ð¢òòF†R7FFW2F†B÷vâF†V—"7FvvW"&F†W"F†â&V–ær–çFW''WFVB'’öæRà¢òòF¦V¦ö–æVBF†VÒv—F‚F†R†—BÖw&÷W'&V²f÷"WfW'’wV&F–ã¢6öær67@¢òò–çFòwV&F–âF†B—2Ç&VG’'&ö¶Vâ÷VâW6VBFòe$TU¤RF†R'&V²w2÷và¢òò6Æö6²‡7FuB&WGW&ç2V&Ç’’Â6òF†RGvò7F6¶VB–çFòöæRÆöær7GVæÆö6²âF†P¢òò'&V²¶VW26÷VçF–ærF÷vâF‡&÷Vv‚7FvvW"æ÷s²F†R6öær7F–ÆÂ—2÷W@¢òò—G2÷vâv–æF÷rÂ—B§W7B6ææ÷BÆVæwF†VâF†—2öæRà¦6öç7B$õ55õ4TÄeõ5DrÒ²çVÆÆVæC¢Â6ffÆö÷#¢ÂF¦S¢Ó° ¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòôäRuT$D”âÂôäRTU5D”ôâ(	BæB—B†2Fò&R6¶VBæòÖGFW"v†BÆæG2F†P¢òòÆ7B&Æ÷rà¢òð¢òòf÷W"6W&FRÆ6W2–âF†R6öÖ&B6öFRFW7G&÷’âVçF—G’F†R–ç7FçB—G0¢òò†VÇF‚&V6†W2¦W&ó¢F†R6Ærw2†—F&÷‚ÂF†R6‡W&–¶VâÂF†R6öærÂæBF†P¢òò÷Væ6RâWfW'’öæRöbF†VÒ6ÆÆVBF–R‚’öâF†R7÷Bâ6òwV&F–â¶–ÆÆVB'¢òòâ7GVÂGF6²(	Bv†–6‚—2WfW'’wV&F–âÆ–W"†2WfW"¶–ÆÆVB(	Bv0¢òòÇ&VG’FVBæBÇ&VG’Æ––ær—G2FVF‚'’F†RF–ÖR&÷72çWFFRÆöö¶VB@¢òò—G2†VÇF‚æBöffW&VBF†R6†ö–6RâF†Rf÷&²öæÇ’WfW"f—&VB–âFW7G2F†@¢òò7V'G&7FVB†VÇF‚F—&V7FÇ’v—F†÷WB7v–æv–ærç—F†–ærÂv†–6‚—2&V6—6VÇ’v‡¢òò—B76VB—G2÷vâFW7B7V—FRv†–ÆRæWfW"öæ6RV&–ær–âF†RvÖRà¢òð¢òòF†RVW7F–öâF†W&Vf÷&RÆ—fW2„U$RÂæBF–R‚’6·2—B&Vf÷&RFö–ærç—F†–æp¢òòVÇ6Râv†FWfW"¶–ÆÇ2wV&F–âÂ—B¶æVVÇ2f—'7Bà¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÐ¢òòD„RU”Ru24ôå5E%T5E2(	BF†RÖ–æ’Ö&÷76W2ÂæBv‡’F†W’&RF–ffW&VçB¶–æBö`¢òòF†–ærg&öÒwV&F–âà¢òð¢òòwV&F–â—2Ô4„”äRD„Bt2”ädT5DTBâ—B†BÆ–fR&Vf÷&RF†R6öæræ@¢òò—B6â†fRöæRgFW"Âv†–6‚—2v‡’F†Rf–v‡BVæG2–âVW7F–öâæBv‡¢òò7&–æröæRGW&ç2—B–çFò6öÖWF†–ærF†BföÆÆ÷w2–÷R†öÖRà¢òð¢òòF†W6RF–Bæ÷BâF†W’vW&RÔDR'’F†R6÷W&6RöbF†R6öær(	BF†RW–R(	BæBF†W&P¢òò—2æ÷F†–ærVæFW&æVF‚F†Rf—'W2Fòv—fR&6²â6òF†W’&RFW7G&÷–VBÂF†W’&P¢òòæWfW"öffW&VBF†Rf÷&²ÂæBF†W’ÆVfRæòG&÷‡’'WBF†R÷vW"6VÆÂF†W’vW&P¢òò'V–ÇB&÷VæBà¢òð¢òòäBD„U’$RäõBTtÅ’ÂFVÆ–&W&FVÇ’âF†Rö'f–÷W2&VF–æröb&ÖFR'’F†P¢òòVæV×’"—2FVWF‚æB7–¶W2ÂæBF†B&VF–ær—2w&öær†W&S¢F†RW–RFöW2æ÷@¢òò'V–ÆBÖöç7FW'2Â—B'V–ÆG2”å5E%TÔTåE2âv–æBÖ6†–ÖRâ6÷W&–W"7F–ÆÂ'Vææ–æp¢òò—G2&÷WFRâÖ÷F‚vö–ærFòF†R†VBâg&÷7BÆGF–6Rw&÷v–ærF÷v&B–÷RâV6€¢òò—26ÆVâÂ7–ÖÖWG&–6ÂÂÆÖ÷7B&WGG’(	BæBV6‚—2G'––ærFò¶–ÆÂ–÷RâF†P¢òòVæV6R—2F†Rö–çBÂæB—B—2F†R&V6öâF†W’&R&ö6VGW&ÂvVöÖWG'’æ@¢òòÆ–v‡B&F†W"F†âWF†÷&VB7&VGW&W2„%Eô$”$ÄRæÖB*sÂ6Æ72R’à¦6öç7BÔ”ä•2Ò°¢6†–ÖS¢²s¢CBÂƒ¢S‚Â‡¢3Â¦öæS¢trÂ6öÃ¢r3–fS†fbrÂ63¢r6VVf6fbrÒÀ¢6'&–W#§²s¢S"Âƒ¢CbÂ‡¢cRÂ¦öæS¢t"rÂ6öÃ¢r3Sv†fbrÂ63¢r66fSffbrÒÀ¢Ö÷Fƒ¢²s¢cÂƒ¢C‚Â‡¢#Â¦öæS¢t2rÂ6öÃ¢r6ff#FrÂ63¢r6ffSf#‚rÒÀ¢ÆGF–6S§²s¢SÂƒ¢c"Â‡¢#3RÂ¦öæS¢tBrÂ6öÃ¢r6&fVfbrÂ63¢r6fffffbrÒÀ¢ÆVç3¢²s¢CbÂƒ¢CbÂ‡¢#sÂ¦öæS¢u‚rÂ6öÃ¢r6fcvCrÂ63¢r6ffC–c"rÒÀ§Ó°¦gVæ7F–öâ—4Ö–æ’†"’²&WGW&â†"bbÔ”ä•5¶"æ¶–æEÒ“²Ð¢òòEtòUD„õ$TBÄDU2T4‚ÂæBF†R&V6öâF†W&R&RGvò—2F†R6–Æ†÷VWGFRÆrà¢òð¢òòF†Rf—'7B7WBöbF†W6Rv2&ö6VGW&ÂÆ–æR'B(	BfWr7G&ö¶W2æBvÆ÷r(	@¢òòöâF†R&wVÖVçBF†BF†W’&R&vVöÖWG'’æBÆ–v‡BÂæ÷B7&VGW&W2"âF†Bv0¢òò&F–öæÆ—6F–öâw&—GFVâv†–ÆRF†R'B6öææV7F÷"v2F÷vâÂæB—B6†÷w3 ¢òòæW‡BFò&VæFW&VBwV&F–âF†W’&VB2fÆB$BG&v–æw2–â4BvÖRâF†W¢òò&RvVæW&FVBæB&VæFW&VBÆ–¶RWfW'—F†–ærVÇ6Ræ÷rà¢òò²(	B†÷rÖç’†—F&÷‚Ö†V–v‡G2F†RÆFRö67W–W0¢òòfÇ’(	B&ö"×Æ—GVFRæBÆVâÂf÷"F†RöæW2F†B†÷fW ¢òò7–â(	B6öç7FçB&÷FF–öâÂf÷"F†RöæW2F†B†fRæòW ¦6öç7BÔ”ä•ô%BÒ°¢6†–ÖS¢²&W7C¢vW–T6†–ÖRrÂv&ã¢vW–T6†–ÖUrrÂ³¢ã’ÂfÇ“¢ÒÀ¢6'&–W#¢²&W7C¢vW–T6'&–W"rÂv&ã¢vW–T6'&–W%rrÂ³¢ã‚ÂfÇ“¢ÒÀ¢Ö÷Fƒ¢²&W7C¢vW–TÖ÷F‚rÂv&ã¢vW–TÖ÷F…rrÂ³¢ãrÂfÇ“¢ÒÀ¢òòfö÷Fæ6†÷'2F†RÆFR'’—G2$õEDôÒ–ç7FVBöb—G26VçG&RâF†RGvð¢òòÆGF–6RÆFW2†fRF–ffW&VçB7V7B&F–÷2†—Bw&÷w2’Â6ò6VçG&–ærF†VÐ¢òòÖ÷fVBF†RF†–ærw2&6R‚öfbF†RfÆö÷"&WGvVVâ&W7BæBv–æB×W(	@¢òòv†–6‚FW7G2ö'F&–&ÆRæ6§2ÖV7W&W22fVWBÆVf–ærF†Rw&÷VæBà¢ÆGF–6S¢²&W7C¢vW–TÆGF–6RrÂv&ã¢vW–TÆGF–6UrrÂ³¢ã‚ÂfÇ“¢Â7–ã¢ã#"Âfö÷C¢ÒÀ¢ÆVç3¢²&W7C¢vW–TÆVç2rÂv&ã¢vW–TÆVç5rrÂ³¢ãrÂfÇ“¢Â7–ã¢ã3RÒÀ§Ó°¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òò„õrD„U’Äôô²ÂæBv‡’æöæRöbF†VÒ†2f6Rà¢òð¢òò%F†W’Fòæ÷BæVVBFòÆöö²Wf–Â"—2F†R'&–VbÂæBF†R†öæW7Bv’Fò†öæ÷W"—@¢òò—2æ÷BFò6ögFVâÖöç7FW"(	B—B—2æ÷BFòG&rÖöç7FW"âV6‚öbF†W6R—2à¢òòô$¤T5BF†B†Vç2Fò&R‡VçF–ær–÷S¢Öö&–ÆRÂ6÷W&–W"ÂÖ÷F‚Âw&÷v–æp¢òò7'—7FÂÂÆVç2â6ÆVâÂ7–ÖÖWG&–6ÂÂÖ÷7FÇ’7F–ÆÂâæ÷F†–ær6æ&Ç2Âæ÷F†–æp¢òò&&W2ç—F†–ærÂæBF†B—2W†7FÇ’v†BÖ¶W2F†VÒVæ6öÖf÷'F&ÆRFò&R–â¢òò&ööÒv—F‚à¢òð¢òòF†W’&R&ö6VGW&ÂöâW'÷6R„%Eô$”$ÄRæÖB*sÂ6Æ72R“¢WfW'’öæRöbF†VÐ¢òò—2vVöÖWG'’æBÆ–v‡B&F†W"F†â7&VGW&Rv—F‚æFö×’ÂæBvVæW&F÷ ¢òò6¶VBf÷"&&VWF–gVÂÆWF†ÂÖ6†–æR"&WGW&ç2&VWF–gVÂÆWF†Âä”ÔÂà¢òò4„”ÔRu2ÔõdU2Âd”ÄÔTB„%EõTUTR*s&‚Â¶–ævFöÒ’âf÷W"F¶W2÷fW"F†P¢òò6öç7G'V7Bw2÷vâw&ÖÖ#¢F†R†÷fW"Æö÷ÂF†R&–ær‡v–æB×W6VÆÇ2(	3BÂF†P¢òò&–ær^(	3rÂ6WGFÆR’ÂF†Ræ÷FR‡v–æB×W(	32ÂF†R7G&–¶RN(	3bÂ6WGFÆR’æBF†P¢òòfÆÂf÷"F†RFVF‚âF†R&W7BÆFR—2ÆÂÖö&–ÆRƒc3öbc3‚’æBG&w0¢òòBã’†—F&÷‚†V–v‡G3²F†R&W7BF¶Rw26†–ÖR†æw23öb—G23#×‚6VÆÂÀ¢òò6òF†R6VÆÂG&w2Bã’¢3#ó3†V–v‡G2â²W"F¶Rv–ç7BF†R&W7@¢òòF¶Rw23¢&–ærS’Óâã“RÂæ÷FR#"ÓâãCbÂfÆÂ3#Óâã“râ¢òò†÷fW&–ærF†–ær—2G&vâ&÷WB—G26VçG&RÂÆ–¶R—G2ÆFRà¦6öç7B4„”ÔUõ5E$•ô‚Òã’¢3#ò3°¦6öç7BÔ”ä•õ5E$•Ò°¢6†–ÖS¢°¢&W7C¢²¶W“¢v6…&W7BrÂ6VÆÇ3¢’Â³¢ÂÆö÷¢‚ÒÀ¢&–æwv&ã¢²¶W“¢v6…&–ærrÂ6VÆÇ3¢"Â³¢ã“RÂg&öÓ¢ÂFó¢BÂC¢ã3RÒÀ¢&–æs¢²¶W“¢v6…&–ærrÂ6VÆÇ3¢"Â³¢ã“RÂg&öÓ¢RÂFó¢ÂC¢ãRÒÀ¢æ÷FWv&ã¢²¶W“¢v6„æ÷FRrÂ6VÆÇ3¢"Â³¢ãCbÂg&öÓ¢ÂFó¢2ÂC¢ã3RÒÀ¢æ÷FS¢²¶W“¢v6„æ÷FRrÂ6VÆÇ3¢"Â³¢ãCbÂg&öÓ¢BÂFó¢ÂC¢ãRÒÀ¢FVC¢²¶W“¢v6„fÆÂrÂ6VÆÇ3¢"Â³¢ã“rÂFVFƒ¢ÒÀ¢ÒÀ§Ó°¦gVæ7F–öâÖ–æ•7G&—6VÆÂ†"’°¢–b‡G—VöbrÓÒwVæFVf–æVBrbb„ræ&÷75&–rÇÂræÖ–æ•&–r’’&WGW&âçVÆÃ°¢6öç7BBÒÔ”ä•õ5E$•¶"æ¶–æEÓ²–b‚B’&WGW&âçVÆÃ°¢ÆWB7BÒ"æFVBòvFVBr¢"ç7C°¢–b‡7BÓÓÒv–FÆRr’7BÒw&W7Bs°¢6öç7B2ÒE·7EÓ²–b‚2’&WGW&âçVÆÃ°¢6öç7Bg&öÒÒ2æg&öÒÇÂÂFòÒ2çFòÓÒçVÆÂò2æ6VÆÇ2Ò¢2çFòÂâÒFòÒg&öÒ²°¢ÆWB6VÆÃ°¢–b…2æÆö÷’6VÆÂÒg&öÒ²„ÖF‚æfÆö÷"‚†"ææ–ÒÇÂ’¢2æÆö÷’Râ“°¢VÇ6R–b…2æFVF‚’°¢6öç7BC"ÒãbÒÖF‚æÖ‚ƒÂÖF‚æÖ–âƒãbÂ"æFVF„æ–ÕBÓÒçVÆÂò¢"æFVF„æ–ÕB’“°¢6VÆÂÒg&öÒ²ÖF‚æÖ–â†âÒÂÖF‚æfÆö÷"‚…C"òãb’¢â’“°¢ÒVÇ6R°¢6öç7BÒÖF‚æÖ‚ƒÂÖF‚æÖ–âƒã““’ÂÒ†"çBÇÂ’ò…2çCÇÂ’’“°¢6VÆÂÒg&öÒ²ÖF‚æfÆö÷"‡¢â“°¢Ð¢&WGW&â²2Â6VÆÂÓ°§Ð¦gVæ7F–öâG&tÖ–æ’†2Â"Â7‚Â7’’°¢6öç7BÒÒÔ”ä•5¶"æ¶–æEÒÂÒÔ”ä•ô%E¶"æ¶–æEÒÂBÒ"ææ–ÒÇÂ°¢6öç7Bv&âÒ÷v&âBòçFW7B†"ç7BÇÂrr“°¢2ç6fR‚“°¢2çG&ç6ÆFR†7‚Â7’“°¢òòF†Rf–ÆÖVBÖ÷fRÂv†Vâ—G27G&——2†W&S¢F†RFVF‚F¶R†öÆG2—G2Æ7@¢òò6VÆÂÂ6òF†RÆFRw2ÆöærfFR&V6öÖW26†÷'BöæRBF†RfW'’Væ@¢6öç7B–6²ÒÖ–æ•7G&—6VÆÂ†"“°¢6öç7B6–ÒÒ–6²bbÔTD”õ$u·–6²å2æ¶W•Ó°¢–b‡–6²bb6–Òbb6–ÒææGW&Åv–GF‚’°¢–b†"æFVB’2ævÆö&ÄÇ†£Ò6Æ×‚†"æFVF„æ–ÕBÇÂ’òã3RÂÂ“°¢°¢6öç7B"ÒÖF‚æÖ‚†"çrÂ"æ‚’¢ãs°¢6öç7BrÒ2æ7&VFU&F–Äw&F–VçBƒÂÂÂÂÂ"“°¢ræFD6öÆ÷%7F÷ƒÂÒæ6öÂ“²ræFD6öÆ÷%7F÷ƒÂw&v&ƒÃÃÃ’r“°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†£Ò‡v&âòã#b¢ãB’¢ƒãƒR²ãR¢ÖF‚ç6–â‡B¢b’“°¢2æf–ÆÅ7G–ÆRÒs²2æ&Vv–åF‚‚“²2æ&2ƒÂÂ"ÂÂr“²2æf–ÆÂ‚“²2ç&W7F÷&R‚“°¢Ð¢6öç7B2Ò–6²å2Â‚Ò"æ‚¢4„”ÔUõ5E$•ô‚¢2æ³°¢6öç7B&ö"ÒÖF‚ç6–â‡B¢„æfÇ’ò2ã¢ãb’’¢„æfÇ’òB¢ãb“°¢6öç7BÆVâÒ6Æ×‚†"çg‚ÇÂ’ò“ÂÓã#"Âã#"’¢„æfÇ’ò¢ãB“°¢6öç7B÷Òv&âò²ãb¢ÖF‚ç6–â‡B¢#"’¢°¢2ç6fR‚“°¢2çG&ç6ÆFRƒÂ&ö"“°¢2ç&÷FFR†ÆVâ“°¢2ç66ÆR‡÷¢†"æf6RâòÓ¢’Â÷“°¢òò&÷726öçF7BfÆ6‚—2Æ–VBöæ6R'’föTG&rÂv—F†÷WBfF–ær—G2ÖWFÂ&öG’à¢G&u7G&—6VÆÂ†2Â2æ¶W’Â–6²æ6VÆÂÂ2æ6VÆÇ2ÂÂ‚ò"Â‚ÂfÇ6R“°¢–b†"æ‡W'EBâ’°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s²2ævÆö&ÄÇ†ÒãS°¢G&u7G&—6VÆÂ†2Â2æ¶W’Â–6²æ6VÆÂÂ2æ6VÆÇ2ÂÂ‚ò"Â‚ÂfÇ6R“²2ç&W7F÷&R‚“°¢Ð¢2ç&W7F÷&R‚“°¢2ç&W7F÷&R‚“°¢&WGW&ã°¢Ð¢–b†"æFVB’2ævÆö&ÄÇ†£ÒÖF‚æÖ‚ƒÂÒƒãbÒ†"æFVF„æ–ÕBÇÂ’’òãb“°¢òòF†Rv6‚&V†–æB—BÂv†–6‚—2v†BF†Rv–æB×W—2&VBg&öÒBvÆæ6P¢°¢6öç7B"ÒÖF‚æÖ‚†"çrÂ"æ‚’¢ãs°¢6öç7BrÒ2æ7&VFU&F–Äw&F–VçBƒÂÂÂÂÂ"“°¢ræFD6öÆ÷%7F÷ƒÂÒæ6öÂ“²ræFD6öÆ÷%7F÷ƒÂw&v&ƒÃÃÃ’r“°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†Ò‡v&âòã#b¢ãB’¢ƒãƒR²ãR¢ÖF‚ç6–â‡B¢b’“°¢2æf–ÆÅ7G–ÆRÒs²2æ&Vv–åF‚‚“²2æ&2ƒÂÂ"ÂÂr“²2æf–ÆÂ‚“²2ç&W7F÷&R‚“°¢Ð¢6öç7B–ÒÒÔTD”ô”Ôu·v&âòçv&â¢ç&W7EÓ°¢–b†–Òbb–ÒææGW&Åv–GF‚’°¢òò66ÆVBFòF†R†—F&÷‚'’„T”t…BæBG&vâ&÷WB—G26VçG&RâF†Rv–æB×W ¢òòÆFR—2F–ffW&VçBG&v–ær&F†W"F†âF†R6ÖRöæRF–çFVBÂ6òF†P¢òò6–Æ†÷VWGFRvVçV–æVÇ’6†ævW2(	Bv†–6‚—2F†RöæR'VÆRF†—26Æ726ææ÷@¢òò6F—6g’v—F‚&–rÂ&V6W6R—B†2æò&–rà¢6öç7B²Ò†"æ‚¢æ²’ò–ÒææGW&Ä†V–v‡C°¢6öç7BrÒ–ÒææGW&Åv–GF‚¢²Â‚Ò–ÒææGW&Ä†V–v‡B¢³°¢òòæB—B—2Ä•dS¢&ö"ÂÆVâ–çFò—G2÷vâÖ÷F–öâÂæB7vVÆÂöâF†P¢òòv–æB×Wâ7FF–2ÆFR6Æ–B&÷VæB&ööÒ—2F†RF†–ærF†RwV&F–ç2p¢òòÆVv2&V'V–ÇBFò7F÷&V–ærà¢6öç7B&ö"ÒÖF‚ç6–â‡B¢„æfÇ’ò2ã¢ãb’’¢„æfÇ’òB¢ãb“°¢òòw&÷VæFVB6öç7G'V7G2†æröfbF†RfÆö÷"Æ–æRÂæ÷BöfbF†V—"÷vâÖ–FFÆP¢6öç7Bfö÷BÒæfö÷Bò†"æ‚ò"Ò‚ò"’¢°¢6öç7BÆVâÒ6Æ×‚†"çg‚ÇÂ’ò“ÂÓã#"Âã#"’¢„æfÇ’ò¢ãB“°¢6öç7B÷Òv&âò²ãb¢ÖF‚ç6–â‡B¢#"’¢°¢2ç6fR‚“°¢2çG&ç6ÆFRƒÂ&ö"²fö÷B“°¢2ç&÷FFR†ÆVâ²„ç7–âòB¢ç7–â¢’“°¢2ç66ÆR‡÷¢†"æf6RâòÓ¢’Â÷“°¢òò¶VWF†RÖ–æ’Ö&÷72÷VRGW&–ær6öæf—&ÖVB†—Bà¢2æG&t–ÖvR†–ÒÂ×rò"ÂÖ‚ò"ÂrÂ‚“°¢–ædW–T'B†2Âv&âòçv&â¢ç&W7BÂÂ×rò"ÂÖ‚ò"ÂrÂ‚“°¢òò‡W'BfÆ6ƒ¢F†RÆFR&RÖG&vâ2W&Rv†—FRF‡&÷Vv‚Æ–v‡FW"70¢–b†"æ‡W'EBâ’°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s²2ævÆö&ÄÇ†ÒãS°¢2æG&t–ÖvR†–ÒÂ×rò"ÂÖ‚ò"ÂrÂ‚“²2ç&W7F÷&R‚“°¢Ð¢2ç&W7F÷&R‚“°¢Ð¢2ç&W7F÷&R‚“°§Ð¢òòF†Rf—fRF–ffW"–âF†R4„RöbÖ÷fRÂæWfW"–â—G2w&ÖÖ"à¢òòæV"(	B–ç6–FRF†—2ÂW6R6Æ÷6V²÷WG6–FR—BÂW6Rf& ¢òòGW"(	B†÷rÆöærF†R6öÖÖ—GFVBÖ÷fRÆ7G0¢òòfÇ’(	B†öÆG27FF–öâ–âF†R—"–ç7FVBöb7FæF–æröâF†RfÆö÷ ¦6öç7BÔ”ä•ô´•BÒ°¢òò4„”ÔR(	BÖö&–ÆRöbGVæ–ærf÷&·2â—B6–æw2ÂæBF†R6öær—2&–ærö`¢òòæ÷FW2â6Æ÷rÂv–FRÂæB6ö×ÆWFVÇ’fö–F&ÆR–b–÷R&VBF†Rv–æB×Wà¢6†–ÖS¢²fÇ“¢Â7C¢#Â7FæC¢SÂ†÷fW#¢“ÂæV#¢“À¢6Æ÷6S¢væ÷FRrÂf#¢w&–ærrÂGW#¢ãRÂÇVævUc¢ÒÀ¢òò4%$”U"(	B6÷W&–W"F†BæWfW"7F÷VBâ—BF‡&÷w2F†R&6VÂÂF†Vâ'Vç0¢òò—G2&÷WFR7G&–v‡BF‡&÷Vv‚–÷Rà¢6'&–W#¢²fÇ“¢Â7C¢sRÂ7FæC¢#Â†÷fW#¢sÂæV#¢#3À¢6Æ÷6S¢vÇVævRrÂf#¢wF÷72rÂGW#¢ãC"ÂÇVævUc¢CƒÒÀ¢òòÔõD‚(	Bvö–ærFòF†R†VBâ66GFW'26–æFW'2ÂF†Vâ6Æ–Ö'2æBG&÷2à¢Ö÷Fƒ¢²fÇ“¢Â7C¢SÂ7FæC¢sÂ†÷fW#¢3ÂæV#¢#À¢6Æ÷6S¢vG&÷rÂf#¢v6–æFW"rÂGW#¢ãSRÂÇVævUc¢ÒÀ¢òòÄED”4R(	B—BFöW2æ÷B6†6Râ—Bu$õu2F÷v&B–÷RÂæBv†B—Bw&÷w2—0¢òò6öÆ–BVçF–Â—B6†GFW'2à¢ÆGF–6S¢²fÇ“¢Â7C¢“Â7FæC¢Â†÷fW#¢ÂæV#¢#cÀ¢6Æ÷6S¢w7–¶RrÂf#¢vw&÷rrÂGW#¢ãbÂÇVævUc¢ÒÀ¢òòÄTå2(	BF†RW–Rw2÷vâ–ç7G'VÖVçBâ—Bfö7W6W2ÂæBF†VâF†RÆ–æR—BG&Wr—0¢òòv†W&RF†R&VÒvöW2à¢ÆVç3¢²fÇ“¢Â7C¢CÂ7FæC¢#CÂ†÷fW#¢#ÂæV#¢3À¢6Æ÷6S¢vÇVævRrÂf#¢v&VÒrÂGW#¢ãrÂÇVævUc¢C#ÒÀ§Ó°¢òòt„BT4‚4ôÔÔ•EDTBÔõdR5ETÄÅ’DôU2â7Æ—B÷WBöbF†R7FFRÖ6†–æR6òF†P¢òòÖ6†–æR7F—2&VF&ÆR(	BF†RÖ6†–æR—2&÷WBt„TâÂF†—2—2&÷WBt„Bà¦gVæ7F–öâÖ–æ”f—&R†"Â7BÂ²’°¢6öç7B6öÂÒÔ”ä•5¶"æ¶–æEÒæ6öÃ°¢6öç7B7‚Ò"æ7‚‚’Â7’Ò"æ7’‚“°¢òòÆ–W"†2æò7‚‚’ö7’‚’(	BöæÇ’&÷72FöW2âw&—F–ærÆ–W"æ7’‚’7&6†VBWfW'¢òò–ÖVBÖ÷fRF†RÖöÖVçB—Bf—&VBÂæBFW7G2öÖ–æ—2æ6§2f÷VæB—B&Vf÷&RF†P¢òòf–v‡Bv2WfW"Æ–VBà¢6öç7B7‚ÒÆ–W"ç‚²Æ–W"çrò"Â7’ÒÆ–W"ç’²Æ–W"æ‚ò#°¢–b‡7BÓÓÒw&–ærr’°¢òò&–æröbV–v‡Bæ÷FW2Â6Æ÷rVæ÷Vv‚FòvÆ²÷WBö`¢"ç&–ærƒ‚ÂƒÂ"ææ–Ò“°¢6g‚‚w&–æw6†÷Br“°¢ÒVÇ6R–b‡7BÓÓÒvæ÷FRr’°¢òòF‡&VR–ÖVBæ÷FW2–âæ'&÷rfà¢6öç7BÒÖF‚æFã"‡7’Ò7’Â7‚Ò7‚“°¢f÷"†ÆWB’ÒÓ²’ÃÒ²’²²¢"ç6†ö÷B„ÖF‚æ6÷2†²’¢ã#"’¢#cÂÖF‚ç6–â†²’¢ã#"’¢#cÂb“°¢6g‚‚w6†ö÷Br“°¢ÒVÇ6R–b‡7BÓÓÒwF÷72r’°¢òòF†R&6VÃ¢†Vg’&2F†BÆæG2v†W&R6†R•2Âæ÷Bv†W&R6†Rv0¢6öç7BG‚Ò7‚Ò7ƒ°¢rç&ö§2çW6‚†æWr&ö¢†7‚Â7’Â6Æ×†G‚¢ãRÂÓC#ÂC#’ÂÓ3ÂfÇ6RÂÂ’Â6öÂÂ“Â2’“°¢6g‚‚vÆö"r“°¢ÒVÇ6R–b‡7BÓÓÒv6–æFW"r’°¢òò6–æFW'266GFW&VBv–FRæBfÆÆ–ær(	Bâ&VFòÆVfRÂæ÷B6†÷BFòFöFvP¢f÷"†ÆWB’Ò²’Âs²’²²¢rç&ö§2çW6‚†æWr&ö¢†7‚²&æB‚Ó3Â3’Â7’Â&æB‚ÓƒÂƒ’Â&æB‚Ó#cÂÓC’ÂfÇ6RÂÂRÂ6öÂÂsƒÂ2’“°¢6g‚‚v6–æFW"r“°¢ÒVÇ6R–b‡7BÓÓÒvG&÷r’°¢"çg’Òc#²"çg‚Ò²òò7G&–v‡BF÷vâöçFò†W ¢6g‚‚vF6‚r“°¢ÒVÇ6R–b‡7BÓÓÒvw&÷rr’°¢òò•B%T”ÄE2âF‡&VR6öÇVÖç2öb–6RÖ&6†–ærF÷v&B†W"ÆöærF†RfÆö÷"(	@¢òòF†RöæÇ’6öç7G'V7Bv†÷6RGF6²W'6—7G2–âF†R&ööÒgFW"—Bf—&W2à¢6öç7Bw’Ò"ç’²"æƒ°¢f÷"†ÆWB’Ò²’ÃÒ3²’²²’°¢6öç7Bw‚Ò7‚²"æf6R¢’¢“#°¢rç&ö§2çW6‚†æWr&ö¢†w‚Âw’ÒBÂÂÓsÂfÇ6RÂÂ‚Â6öÂÂÓS#Âã’“°¢Ð¢6g‚‚w7–¶WWr“°¢ÒVÇ6R–b‡7BÓÓÒw7–¶Rr’°¢f÷"†ÆWB’ÒÓ²’ÃÒ²’²²’"ç6†ö÷B†"æf6R¢3Â’¢3Âr“°¢6g‚‚w6†ö÷Br“°¢ÒVÇ6R–b‡7BÓÓÒv&VÒr’°¢òòF†Rfö7W2Ç&VG’FöÆB–÷RF†RÆ–æS²F†—2—2F†BÆ–æR'&—f–æp¢6öç7BÒÖF‚æFã"‡7’Ò7’Â7‚Ò7‚“°¢f÷"†ÆWB’Ò²’ÂS²’²²¢rç&ö§2çW6‚†æWr&ö¢†7‚²ÖF‚æ6÷2†’¢’¢#"Â7’²ÖF‚ç6–â†’¢’¢#"À¢ÖF‚æ6÷2†’¢S#ÂÖF‚ç6–â†’¢S#ÂfÇ6RÂÂbÂ6öÂÂÂãb’“°¢6g‚‚vÆæ6Rr“°¢Ð§Ð¦gVæ7F–öâ&÷74f÷&²†"’°¢–b‡G—VöbW&–f–6F–öä&Vv–âÓÓÒvgVæ7F–öârbb"bb"æf÷&´6¶VBbbW&–f–6F–öä&Vv–â†"’’&WGW&âG'VS°¢òòF†RW–Rw26öç7G'V7G2&RæWfW"öffW&VBÖW&7“¢F†W&R—2æö&öG’–âF†W&P¢–b†—4Ö–æ’†"’’&WGW&âfÇ6S°¢–b‚"ÇÂ"æf÷&´6¶VBÇÂ"æFVBÇÂ"æ¶–æBÓÓÒvÖ÷F†W"r’&WGW&âfÇ6S°¢–b‡G—Vöb'$öffW"ÓÒvgVæ7F–öârÇÂG—VöbrÓÓÒwVæFVf–æVBr’&WGW&âfÇ6S°¢–b‡G—VöbÆ–W"ÓÓÒwVæFVf–æVBrÇÂÆ–W"ÇÂÆ–W"æFVB’&WGW&âfÇ6S°¢–b‡G—Vöb—4†W&òÓÓÒvgVæ7F–öârbb—4†W&ò‚’’&WGW&âfÇ6S°¢òòæò&ÆFRÂæòg&VV–æs¢F†R6öær†öÆG2—BFövWF†W"†'$æVVG4&ÆFRÂ'&–Bæ§2¢–b‡G—Vöb'$æVVG4&ÆFRÓÓÒvgVæ7F–öârbb'$æVVG4&ÆFR†"’’&WGW&âG'VS°¢"æf÷&´6¶VBÒG'VS°¢"æ‡Ò²"çg‚Ò²"çg’Ò²"ç7FuBÒ°¢òòræf÷&´&÷72d•%5BÂæBF†B÷&FW&–ær—2æ÷rÆöBÖ&V&–ærâ—BW6VBFò&R6W@¢òògFW"'$öffW"&V6W6R'$öffW"öæÇ’÷VæVBF–ÆöræBF†Rç7vW"'&—fV@¢òòg&ÖW2ÆFW"âVæFW"DÔUôôäÅ’'$öffW"å5tU%2ôâD„R5õB(	BæB'$ç7vW ¢òò&VG2ræf÷&´&÷72Fòf–æBF†R7&VGW&R—B—2ç7vW&–ær&÷WBÂ6ò6WGF–ær—@¢òògFW'v&G2ÖVçBWfW'’wV&F–â&W6öÇfVB–çFòâV×G’'&æ6ƒ¢æòFÖRÂæð¢òò7ö–ÂÂæòfÆrÂæB&÷72ÆVgB7FæF–ærB¦W&ò†VÇF‚âFW7G2÷vöÇfW2æ6§0¢òò6Vv‡B—BöâF†RÇ†à¢ræf÷&´&÷72Ò#°¢'$öffW"†"æ¶–æBÓÓÒvvÆ—F6‚ròvf—'7F&÷72r¢v&÷72r“°¢&WGW&âG'VS°§Ð¢òòF¦TF÷G2wV&F–â–çFòF†R†—BÖw&÷W'&V²‡6VRD¤Uõt”äDõr–à¢òòG—W2æ§2“¢ÆæBF†—2Öç’†—G2–ç6–FRF†R&öÆÆ–ærv–æF÷ræB—B6öÖW2'@¢òòf÷"6V6öæBæB†ÆbâåTÄÄdär—2F†Rf—'7BwV&F–â–÷RÖVWBæBF†RöæP¢òòv†÷6Rv†öÆR&VB—2&&–r6B–÷R6â÷WB×F–ÖR"Â6ò—B—2v†W&RF†RÖV6†æ–0¢òò—2DTt…B(	Bf—fR†—G2Âã2&WGvVVâF†VÒà¢òð¢òòUdU%’uT$D”â%$Tµ2äõrƒ##bÓÓ‚ÂF†R†öÆÆ÷r¶æ–v‡B7GVG’ÂÆâ*s2’à¢òòF†R÷F†W'2vW&RÆVgBöfb'VçF–ÂF†—2öæR†B&VVâÆ–VBVæ÷Vv‚"ÂæBF†P¢òò6÷7Böbv—F–ærv2&÷7FW"–âv†–6‚öæÇ’F†Rf—'7Bf–v‡BWfW"&Wv&FV@¢òò&W76–ærâGfçFvRâF¦U7æ—2†÷rÆöær†—B7F—2'&V6VçB"f÷"F†@¢òòwV&F–ã¢åTÄÄdärvÆ·2F†RfÆö÷"&W6–FR†W"Â6òw&÷W—2f—fR†—G2–à¢òòöæR'W'7C²F†RfÆ–W'2&RöæÇ’–â&V6‚GW&–ærF†V—"&V6÷fW&–W2Â6òw&÷W ¢òò—2GvòVæ—6†W2&6²Fò&6²ÂæBã2v÷VÆBÖ¶RF†R'&V²Vç&V6†&ÆR'¢òò6öç7G'V7F–öââ6—‚†—G2Â&÷Vv†Ç’Gvò6ÆVâF‡&VRÖ†—B6öÖ&÷2ÂWfW'—v†W&Rà¢òò¦öæV—2F†R¶–ævFöÒF†RwV&F–â7FæG2–âÂæB—B—2ÆöBÖ&V&–æræ÷s¢—@¢òò–6·2F†RvVöâF–W"F†Rf–v‡B—2&Ææ6VBv–ç7B…¤ôäUôD²’âF†RÖ–æ—0¢òòÇ&VG’6'&–VBöæS²F†RwV&F–ç26’—B†W&R&F†W"F†â†f–ær—B–æfW'&V@¢òòg&öÒÆ—"–BF†B¶–ævFöÒ6W76–öâ—2g&VRFòÖ÷fRà¦6öç7B%5DBÒö&¦V7Bæ76–vâ‡°¢vÆ—F6ƒ¢²s¢ƒBÂƒ¢SbÂ‡¢##ÂF¦TC¢RÂ¦öæS¢trÒÀ¢'&ööC¢²s¢“bÂƒ¢cBÂ‡¢3#ÂF¦TC¢bÂF¦U7ã¢2ã"Â¦öæS¢t"rÒÀ¢òòFVÆÆ÷fW'&–FW2F†Rv&æ–ær6—¦Rfö÷G&–çBv÷VÆBFW&—fR‡6VP¢òò&÷72çFVÆÄ7VR’âeU$ä4R4„ô•"—2FÆÂæBæ'&÷rÂ6ò—G2fö÷G&–çB&VG0¢òò6ÖÆÂÂ'WB—B—2f÷VæG'’F†Bv&ç2v—F‚&VÆÇ2æB‡–Öâ(	BF†RÆ–v‡@¢òòFVÆÂVæFW"F†B—2F†Rw&öær–ç7G'VÖVçBf÷"F†RF†–ær'&—f–ærà¢FÆ3¢²s¢c"Âƒ¢sBÂ‡¢CcÂFVÆÃ¢wFVÆÆÖ–BrÂF¦TC¢bÂF¦U7ã¢"ãbÂ¦öæS¢t2rÒÀ¢¦W&ó¢²s¢"Âƒ¢c"Â‡¢SÂF¦TC¢bÂF¦U7ã¢2ãbÂ¦öæS¢tBrÒÂòòtÄ4”U$S¢ÆöærfÆöF–ærVG'WV@¢òò$•4Ò—2F†Ræ–Ö&ÆR&—fÂÂ6ò—B7F—2F†R6ÖÆÆW7BwV&F–â(	B'WB&÷70¢òò7F–ÆÂ†2Fò7FæB÷fW"…¤BÓ“’ƒ3b’ÂæBB3B—B7FööBVæFW"†W"à¢&—6Ó¢²s¢c"Âƒ¢CbÂ‡¢S#ÂF¦TC¢bÂF¦U7ã¢"ãBÂ¦öæS¢u‚rÒÀ¢Ö÷F†W#¢²s¢#Âƒ¢#Â‡¢sSÂF¦TC¢rÂF¦U7ã¢2ã"Â¦öæS¢tRrÒÀ¢òòD„RÅ„âF†Rf—'7BÖ–æ’Ö&÷72–âF†R'VâÂæBF†RöæÇ’öæRF†B—2DÔT@¢òò&F†W"F†âFW7G&÷–VB(	B6VR§2÷vöÇfW2æ§2âv–FW"F†âåTÄÄdäræB6†÷'FW# ¢òò—B—2VG'WVBF†Bf–v‡G2ÆöærF†RfÆö÷"ÂæB—G2&V6‚—2F†RÆVæwF€¢òòöb—Bâ3…WG2—B§W7B&÷fRF†Rf—'7BwV&F–âw2##v†–ÆR6†R7F–ÆÀ¢òò†2æòF6‚Âv†–6‚—2v†W&RF†Rf–v‡BvçG2Fò6—B(	BÆ÷6&ÆRÂæ÷BÆöærà¢Ç†¢²s¢BÂƒ¢S‚Â‡¢3Â¦öæS¢trÒÀ¢òòu$dT„õ$â†§2öw&fV†÷&âæ§2’ÂF†RW–Rw2&†–æòöâF†R&rÖ&&ÆRâF†R&÷‚—0¢òòF†R&'&VÂæBF†RÆVw2VæFW"—C²†—2†VBæB†÷&ç2&RÖV7W&VBöfbF†P¢òò&–r†v„&÷†W2’Â&V6W6R#C2‚æ–ÖÂ—2æ÷B&V7FævÆRâ##W"†6P¢òòƒ3#’öâæ÷&ÖÂ’ÂGvò†6W2Âf÷Vv‡Bv—F‚6Æw2æBF†RföÇB'W'7B(	BF†P¢òò&ÆFR6öÖW2gFW"âSÖV7W&VB2†6R7VçB–âôäR†÷&æÆW72v–æF÷r'¢òòF†R6†FW"ÖöæRWF÷–Æ÷C²B##†6RF¶W2F‡&VR÷"f÷W"÷Væ–æw2à¢†÷&ã¢²s¢sbÂƒ¢#Â‡¢##ÂF¦TC¢bÂF¦U7ã¢"ãbÂ¦öæS¢trÂFVÆÃ¢wFVÆÆ&–rrÒÀ¢òòââææBF†RW–Rw26öç7G'V7G2¦ö–âF†R6ÖRF&ÆRÂ6òWfW'’–V6RöbÖ6†–æW'¢òòF†BÇ&VG’v÷&·2öâ&÷72(	BF†R‡W'BfÆ6‚ÂF†R†VÇF‚&"ÂF†RFVÆVw&€¢òòv6‚ÂF†R'F&–&ÆR†&æW72(	Bv÷&·2öâF†VÒv—F†÷WB6V6öæB6öFRF‚âF†W¢òòF–ffW"–âv†BF†W’$RÂæ÷B–â†÷rF†W’&RÇVÖ&VBà§ÒÂÔ”ä•2“°¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÐ¢òòD„R$´R(	B…¤BÓ“’w26Ær&2Âg&öÒâWF†÷&VBÆ–v‡B6†VWBà¢òð¢òòF†R6†VWB—2–çFVBöâW&R&Æ6²Âv†–6‚—2F†Rv†öÆRG&–6³¢G&vâv—F€¢òòvÆ–v‡FW"rF†R&Æ6²6öçG&–'WFW2æ÷F†–æræBF†RvÆ÷r6ö×÷6—FW26÷'&V7FÇ¢òò÷fW"ç’&6¶w&÷VæBÂ6òF†W&R—2æòÇ†6†ææVÂFò7WBæBæòÖGFRFð¢òòvWBw&öærâ'&–v‡FæW72—2F†RÇ†à¢òð¢òòF†R'B&72g&öÒWW"ÖÆVgBF÷vâFòÆ÷vW"×&–v‡BÂ6òV6‚G&r&÷FFW2—@¢òòöçFòF†R7v–ærF—&V7F–öâæBÖ—'&÷'2—Bf÷"F†Rv’6†R—2f6–ærà¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÐ¦6öç7B$´RÒ°¢&¶S¢³3’Â32ÂSbÂs…ÒÂ&¶S#¢³##’Â3BÂ“RÂsuÒÂ†Vg“¢³CSrÂ3Â#S"Â#EÒÀ¢'W'7DÃ¢³ƒrÂc‚Âc‚ÂcEÒÂ‡&¶S¢³3rÂ#C’Â3BÂ#“ÒÂ'W'7DÓ¢³SC"Â#s‚ÂS’ÂSÒÀ¢'W'7E3¢³CrÂ32Âƒ2ÂƒÒÂ&–æs¢³scÂ3#’Â#3ÂcÒÂ7G&V³¢³3s"ÂCs"Â3sBÂC•ÒÀ§Ó°¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòt„U$RD„R5UBtôU2(	BäBt…’•Bt2ÄäD”ärôâ„U ¢òð¢òò4ÄrÔ$²•2DätTåD”ÂÂäõB$D”ÂâF†R6Æw27v–æröââ&2&÷WBF†P¢òò6†÷VÆFW"Â6òF†R7G&V·2F†W’ÆVfR'Vâ5$õ52F†R7G&–¶RÂ7W'f–ær&÷VæB†W ¢òò(	BF‡&VR&ÆÆVÂ7&W66VçG2W'VæF–7VÆ"FòF†RÆ–æRg&öÒ6†÷VÆFW"Fòrà¢òòF†R7WBW6VBFò&RÆ–B÷WBF†R÷F†W"v“¢—G2Æöær†—2ö–çFVBÆöærF†@¢òòÆ–æRÂ6ò—B&âg&öÒ†W"6†W7B÷WGv&BÆ–¶R7V"ÂæBWfW'—F†–ærg&öÒF†P¢òòÖ–Gö–çB&6²v2–çFVBöâF†R6BF‡&÷v–ær—Bâ&÷FF–ær—BV'FW"GW&à¢òò—2Ö÷7BöbF†—2f—‚ÂæB—B—2v‡’F†RVffV7BæWfW"&VB27v—Rà¢òð¢òòF†R6V6öæB†Æb—2F†R&F—W2â7G&–v‡B6†÷&BFævVçBFò6—&6ÆRÆ–W0¢òòVçF—&VÇ’õUE4”DRF†B6—&6ÆRÂ6òöæ6RF†R&2—2FævVçF–ÂÂ¶VW–ær—G0¢òòÖ–Gö–çBBÆV7B$´Uô4ÄT"g&öÒF†R6†÷VÆFW"WG2F†Rv†öÆR7G&ö¶R6ÆV"ö`¢òò†W"(	BBWfW'’ævÆRÂBWfW'’ö–çB–âF†R7v–ærÂv†FWfW"F†R&öG’—2Fö–ærà¢òòF†B—2F†R&÷W'G’F†RöÆBfW'6–öâ6÷VÆBæ÷B†fRBç’öfg6WC¢&F–À¢òò7G&ö¶RF‡&÷Vv‚†W"6†÷VÆFW"Çv—27&÷76W2†W"à¢òð¢òò$´Uô4ÄT"—2ÖV7W&VBg&öÒF†R6†÷VÆFW"ƒÂÓ#’Âv†–6‚6—G2öâ†W"g&öç@¢òòVFvRÂ÷WB7BF†Rf"6–FRöb†W"†VBæB†—2â$´UôõUBF†Vâ6'&–W2F†P¢òòÖ&²$U”ôäBF†R6Æw2(	B7v—RÆVfW2—G2Ö&²–âF†R—"F†R6Æw2÷VæVBÀ¢òòæ÷BöâF†R6Æw2(	BæB—B—2v†B7F÷27G&ö¶RF†—2Æöærg&öÒ7W&Æ–ær&÷Væ@¢òò†W#¢B&F—W2#Râ&2öbCB7V'FVæG2æ–æWG’FVw&VW2æBw&2†W"Æ–¶R¢òò†Æó²F†R6ÖR&2B3B7V'FVæG2f–gG’æB&VG227v—RF‡&÷Vv‚F†R—"à¦6öç7B$´Uô4ÄT"Ò3Â$´UôõUBÒ#°¢òò†÷rf"F†R&2G&–Ç2$T„”äBF†RrÂ2g&7F–öâöb—G2÷vâÆVæwFƒ¢F†P¢òò6Æw2ÆVBF†RÖ&²F†W’&RÖ¶–æp¦6öç7B$´UôÄrÒã3°¦gVæ7F–öâ&¶UÆ6R†2ÂÖ²Â–Ò’°¢6öç7B"ÒÖ²ç"ÇÂ°¢6öç7B"ÒÖF‚æÖ‚‡"²$´UôõUBÂ$´Uô4ÄT"“°¢ÆWBW‚Ò†Ö²ç‚ÒÖ²ç7‚’ò"ÂW’Ò†Ö²ç’ÒÖ²ç7’’ò#°¢–b†–ÒÒçVÆÂ’°¢òòD„RÔ$²dôÄÄõu2D„R”ÒÂäõBD„RrâF†Rr—2†–v‚–âF†Rv–æB×W ¢òòæBÆ÷r–âF†RföÆÆ÷r×F‡&÷Vv‚Â6òÖ&²æ6†÷&VBFò—BÆæFVB÷fW"†W ¢òò†VBÖ–B×7v–æræBVæFW"†W"fVWBBF†RVæB(	B&W÷'FVBW†7FÇ’6ó ¢òò'67&F6†–ærVæFW"†W"fVWB–ç7FVBöb–âg&öçBöb†W"Æ–¶Ræ÷&ÖÀ¢òò6Bâ"F†R7WBw27vVW7F–ÆÂ6öÖW2g&öÒF†Rrw2G&fVÃ²öæÇ’—G2„ôÔP¢òò—2æ÷rGvò×F†—&G2F†R7v–ærw2–ÒÂöæR×F†—&BF†Rr(	Bf÷'v&B7W@¢òòÖ&·2f÷'v&BB6†W7B†V–v‡BÂâWÖ7WB&÷fRÂövò&VÆ÷rà¢6öç7B'‚ÒÖF‚æ6÷2†–Ò’Â'’ÒÖF‚ç6–â†–Ò“°¢W‚ÒW‚¢ã3B²'‚¢ãcc²W’ÒW’¢ã3B²'’¢ãcc°¢6öç7BâÒÖF‚æ‡—÷B‡W‚ÂW’’ÇÂ²W‚óÒã²W’óÒã°¢Ð¢2çG&ç6ÆFR†Ö²ç7‚²W‚¢"ÂÖ²ç7’²W’¢"“°¢òò·‚&V6öÖW2F†RF—&V7F–öâF†Rr—2G&fVÆÆ–æs²×’ÂgFW"F†R6ÆÆW"w0¢òò’ÖfÆ—'’F—"Âö–çG2v’g&öÒF†R6†÷VÆFW"Â6òF†R7&W66VçB&÷w2÷WGv&@¢2ç&÷FFR†Ö²æ²ÖF‚å’ò"¢Ö²æF—"“°§Ð¢òòD„R4Ä4‚Ä”U"††æFöfb'B"C’â6ÆÆVB'’vÖRæ§2&–v‡BgFW ¢òòÆ–W"æG&rÂ–âF†R6ÖRv÷&ÆBG&ç6f÷&ÒF†RÖ&·2vW&R&W6öÇfVB–ââGvð¢òò76W3¢F†RWF†÷&VB&¶RÂF†Vâ—G2vÆ÷r6÷’(	BÆ&vW"Â&ÇW'&VBÂFF—F—fR(	@¢òò7VçBöæÇ’v†VâF†RVÆ—G’F–Â7VæG2vÆ÷r…TÂævÆ÷rÂ§2÷W&bæ§2’à¢òò7&W7BF†B6†ævW2†W"7WB„3’7v2F†R&2†W&RÂæ÷B–âF†R&öG’G&rà¦6öç7B4Ä4…ôtÄõrÒ²66ÆS¢ã‚ÂÇ†¢ãCRÂ&ÇW#¢"ãRÓ°¦gVæ7F–öâG&u6Æ6„Æ–W"†2ÂÂ’°¢–b‚Â’&WGW&ã°¢6öç7BvÆ÷rÒG—VöbTÂÓÓÒwVæFVf–æVBrÇÂTÂævÆ÷s°¢òòF†R76W2F†—2g&ÖRG&Wr‡FW7G2÷6Æ6†Æ–W"æ6§2&VG2—B“²öæÇ’¶WBöà¢òòg&ÖW2F†B7WBÂ6òF†RÆö÷ÆÆö6FW2æ÷F†–ær÷F†W'v—6P¢–b‡Âå÷6Æ6…67&F6‚ÇÂ‡Âå÷6Æ6„Ö&·2bbÂå÷6Æ6„Ö&·2æÆVæwF‚’ÇÂ‡Âç7v–æuf—2bbÂç7v–æuf—2æ7&W7B’’rç6Æ6…76W2ÒµÓ°¢òòF†RWF†÷&VB67&F6‚‡F†RÆFRW&w27WBÂ6–ævÆUög‚çvV'¢–b‡Âå÷6Æ6…67&F6‚’°¢ÂæG&u67&F6…v¶R†2Âv&6Rr“°¢–b†vÆ÷r’ÂæG&u67&F6…v¶R†2ÂvvÆ÷rr“°¢Ð¢Âå÷6Æ6…67&F6‚ÒfÇ6S°¢òòF†R6VÂw2VFvR„3“¢WfW'’vVöâf÷&ÒÂ&÷F‚v÷&ÆG2Âv†FWfW"&öG’G&Wp¢–b†G&t7&W7DVFvR†2ÂÂÂv&6Rr’bbvÆ÷r’G&t7&W7DVFvR†2ÂÂÂvvÆ÷rr“°¢òòF†R&ö6VGW&Â&öG’w2&¶RÂv†VâF†B—2F†R&öG’&V–ærG&và¢6öç7BÖ&·2ÒÂå÷6Æ6„Ö&·3°¢Âå÷6Æ6„Ö&·2ÒçVÆÃ°¢–b‚Ö&·2ÇÂÖ&·2æÆVæwF‚ÇÂÂç7v–æuf—2’&WGW&ã°¢f÷"†6öç7BÖ²öbÖ&·2’°¢G&u&¶R†2ÂÂÂÖ²Âv&6Rr“°¢–b†vÆ÷r’G&u&¶R†2ÂÂÂÖ²ÂvvÆ÷rr“°¢Ð§Ð¢òòD„R4TÂu2TDtR††æFöfb'B"3’â6VÂF†B6†ævW2†÷r6†Rf–v‡G2†0¢òòFò&R4TTâ6†æv–ær—BÂöâWfW'’vVöã¢F†R6Æw2rWF†÷&VB67&F6‚ÂF†P¢òò7v÷&B7G&—2æBF†R¦ö–æVB&ÆFRV6‚G&rF†V—"÷vâ7WBÂæBöâF÷öb—@¢òòF†—2Æ—2öæR7&W66VçBöbF†R6VÂw2÷vâÆ–v‡BÂ'V–ÇBg&öÒF†R&÷‚F†R7v–æp¢òò&VÆÇ’†2(	B—G2÷WFW"&–ÒBF†R7WBw2&V6‚Â—G27âF†R7WBw2v–GF‚Â—G0¢òòF†–6¶æW72—G2vV–v‡Bâ&V6†–ær6VÂG&w2ÆöævW"&2ÂF†R6ÆÒv–FW"À¢òò†Vf–W"öæRÂF†RV–6²7v—W26†÷'BF†–âfÆ–6²âFF—F—fRÆ–v‡BöæÇ’‡F†P¢òò6†ææVÂF†R'B'VÆW2ÆVfR&ö6VGW&Â“²F†RWF†÷&VB&2ÆFW2F†Bv–ÆÀ¢òò&WÆ6R—B&RVWVVB–âFö72ô%EõTUTRæÖB*s&&òà¦gVæ7F–öâG&t7&W7DVFvR†2ÂÂÂ72’°¢6öç7B7bÒÂç7v–æuf—3°¢6öç7B&Æ²Ò7bbb7bæ6†&vVBbb7bç7v—&Âbb7bç&V6‚ò7v–æt7&W7B‡7b’¢çVÆÃ°¢–b‚&Æ²’&WGW&âfÇ6S°¢6öç7BÒ6Æ×ƒÒ7bçBò7bçCÂÂ“°¢–b‡ÂãB’&WGW&âfÇ6S²òòæ÷F†–ærGW&–ærF†Rv–æB×W ¢òò6æ2–âÂ†öÆG2ÂF†–ç2v’(	BF†R7WBw2÷vâVçfVÆ÷P¢6öç7BÒÂã#Ròòã#R¢ÖF‚ç÷rƒÒ‡Òã#R’òãsRÂãB“°¢–b†ÃÒã"’&WGW&âfÇ6S°¢–b„rç6Æ6…76W2’rç6Æ6…76W2çW6‚‡²Æ–W#¢v7&W7BrÂ73¢72ÇÂv&6RrÂ7&W7C¢7bæ7&W7BÒ“°¢6öç7B&V6‚Ò7bç&V6‚Â†ÆbÒ7bæ†Æc°¢6öç7BÇrÒ6Æ×††Æb¢ãrÂ"ãRÂ“²òòF†R7WBw2vV–v‡B—2—G2v–GF€¢6öç7B&BÒÖF‚æÖ‚ƒ‚Â&V6‚ÒÇrò"“²òòF†R÷WFW"&–ÒÆæG2öâF†R&V6€¢6öç7B7âÒÖF‚æÖ–âƒã#RÂÖF‚æFã"††ÆbÂÖF‚æÖ‚ƒÂ&V6‚Ò†Æb’’“°¢òòF†R&2÷Vç27&÷72F†R7WB2F†R7v–ærG&fVÇ2ÂF†Vâ†öÆG0¢6öç7B÷VâÒÖF‚æÖ–âƒÂòãB“°¢2ç6fR‚“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2çG&ç6ÆFR‡Âç‚²Âçrò"ÂÂç’²Âæ‚ò"“°¢2ç&÷FFR‡7bæærÇÂ“°¢òòF†RvÆ÷r6÷’—2F†R6ÖR7G&ö¶RÂdEDU"æB6ögFVæVB(	BæWfW"66ÆVB÷W@¢òòg&öÒ†W"6VçG&RF†Rv’F†R&¶Rw26÷’—2Â&V6W6R66ÆVB6÷’öbF†—0¢òò&2v÷VÆBG&r6V6öæB&–Ò7BF†R&V6‚F†R6VÂ&VÆÇ’v—fW2†W ¢6öç7BvÆ÷uÒ72ÓÓÒvvÆ÷rs°¢–b†vÆ÷u’2æf–ÇFW"Òv&ÇW"‚r²4Ä4…ôtÄõræ&ÇW"²w‚’s°¢2ævÆö&ÄÇ†Ò¢†vÆ÷uò4Ä4…ôtÄõræÇ†¢ã’“°¢2ç7G&ö¶U7G–ÆRÒ&Æ²çF–çC²2æÆ–æT6Òw&÷VæBs°¢2æÆ–æUv–GF‚ÒÇr¢†vÆ÷uò"¢“²òòF†R†Æó¢Gv–6RF†R7G&ö¶RÂ&ÇW'&V@¢2æ&Vv–åF‚‚“²2æ&2ƒÂÂ&BÂ×7âÂ×7â²7â¢"¢÷Vâ“²2ç7G&ö¶R‚“°¢òòF†–ææW"–ææW"&–ÒÂ6ò—B&VG227&W66VçBæBæ÷B&–ær6VvÖVç@¢–b†vÆ÷u’²2æf–ÇFW"ÒvæöæRs²2ç&W7F÷&R‚“²&WGW&âG'VS²ÒòòF†R†ÆòæVVG2æò–ææW"&–Ð¢2æÆ–æUv–GF‚ÒÖF‚æÖ‚ƒã"ÂÇr¢ãB“²2ævÆö&ÄÇ†£Òãc°¢2æ&Vv–åF‚‚“²2æ&2ƒÂÂÖF‚æÖ‚ƒBÂ&BÒÇr¢ãB’Â×7â¢ã‚Â×7â¢ã‚²7â¢ãb¢÷Vâ“²2ç7G&ö¶R‚“°¢2æf–ÇFW"ÒvæöæRs°¢2ç&W7F÷&R‚“°¢&WGW&âG'VS°§Ð¦gVæ7F–öâG&u&¶R†2ÂÂÂÖ²Â72’°¢6öç7BF—"ÒÖ²æF—"Âf"ÒÖ²æf#°¢–b„rç6Æ6…76W2’rç6Æ6…76W2çW6‚‡²Æ–W#¢w&¶RrÂ73¢72ÇÂv&6RrÒ“°¢6öç7B–ÒÒ‡G—VöbÔTD”ô”ÔrÓÒwVæFVf–æVBr’òÔTD”ô”Ôrç6Æ6„g‚¢çVÆÃ°¢–b‚–ÒÇÂ–ÒææGW&Åv–GF‚’&WGW&ã°¢6öç7B7bÒÂç7v–æuf—2ÂÒ6Æ×ƒÒ7bçBò7bçCÂÂ“°¢–b‡Âãb’&WGW&ã²òòæ÷F†–ærGW&–ærF†Rv–æB×W ¢òòF†R7v–ærw2–Ò–âF†RÔ$²w2†&öG’’76S¢F†R&öG’G&ç6f÷&ÒÖ—'&÷'0¢òòv—F‚f6–ærÂ6òf÷'v&B—2·‚V—F†W"v’(	BföÆBF†Rf6–ær÷WBöbæp¢6öç7B&öG’ÒÖF‚æFã"„ÖF‚ç6–â‡7bæær’ÂÖF‚æ6÷2‡7bæær’¢‡Âæf6Uf—2ÇÂ’“°¢òò6æ2–âÂ†öÆG2ÖöÖVçBÂF†–ç2v’(	B7WBFöW2æ÷BfFRWfVæÇ¢6öç7BÒÂã#"òòã#"¢ÖF‚ç÷rƒÒ‡Òã#"’òãs‚ÂãR“°¢–b†ÃÒã"’&WGW&ã°¢6öç7B6ÆrÒÂæ6ÆuBâ°¢òòD„R5%•5DÂu25UB•2Ä”t…BâVçF–ÂF†RWF†÷&VB6Æ6‚6†VWG2„%EõTUTP¢òò*s"Ö’’ÆæB2ÔTD”¶W—2ÂF†RW&–f–W"w2&2—2G&vâ2W&RFF—F—fP¢òòÆ–v‡B(	BF†RöæR6†ææVÂF†R'B'VÆW2ÆVfR&ö6VGW&ÂŒ*sã’(	BæBæWfW ¢òò2F†R6Ær6†VWBÂv†–6‚—26Ær'BæBv÷VÆBWB6Bw2&¶Röâ¢òò7v÷&Bw27WBà¢–b‡7bçv–VÆB’²–b‡72ÓÒvvÆ÷rr’G&t7'—7FÄ&2†2ÂÂÂÖ²Â7bÂÂ&öG’“²&WGW&ã²ÒòòF†R7'—7FÂw27WB—2Ç&VG’Æ–v‡@¢òòD„RÄôär$´R•2T$äTBâF†Rv–FR6†–æ–ær&2—2F†R&W7BÖÆöö¶–ærF†–ær–à¢òòF†R6†VWBÂæB7VæF–ær—BöâWfW'’F†—&BVæ6‚g&öÒF†Rf—'7B&ööÒÆVfW0¢òòæ÷F†–ærFòw&÷r–çFòâF†RFVfVÇBf–æ—6†W"—2†Vf–W"fW'6–öâöbF†R6ÖP¢òò6†÷'B7WB6†R†2&VVâF‡&÷v–ærÆÂÆöæs²F†RÆöæröæR&VÆöæw2FòF†P¢òò6¶–ÆÂÂæBFòF†RfW&Â6Æw2à¢6öç7BÆöæu&¶RÒ6ÆrÇÂ‡G—Vöb†56¶–ÆÂÓÓÒvgVæ7F–öârbb†56¶–ÆÂ‚w&V6‚r’“°¢6öç7B¶W’Ò7bæ6öÖ&òÓÓÒ"ò†Æöæu&¶Ròw‡&¶Rr¢w&¶S"r¢¢7bæ6öÖ&òÓÓÒòw&¶S"r¢w&¶Ss°¢6öç7B"Ò$´U¶¶W•Ó°¢òò—Bw&÷w2F‡&÷Vv‚F†R7v–ærÂ6òF†R&2÷Vç2&F†W"F†â6—GF–ær7F–ÆÀ¢òò6—¦VBv–ç7B„U"Âæ÷Bv–ç7BF†R67&VVã¢6†R—23g‚FÆÂÂ6ò&¶RF†@¢òò&VG22†Vg’&Æ÷r—2&÷WB†W"÷vâ†V–v‡BæBæ÷BF‡&VRF–ÖW2—@¢òò4•¤TBt”å5B„U"$T4‚ÂäõB„U"$ôE’âB†W"÷vâ†V–v‡BF†R&2v6†V@¢òò7G&–v‡B7&÷72F†R6BF‡&÷v–ær—C²&¶R&VÆöæw2–âg&öçBöbF†RrÀ¢òò6Æ÷6R–âÂv†W&R6B7GVÆÇ’VÆÇ2—G26Æw2à¢6öç7B‚Ò‡7bæ6öÖ&òÓÓÒ"ò†Æöæu&¶Rò3B¢#B’¢7bæ6öÖ&òÓÓÒò#¢’¢¢†6Æròã2¢’¢†f"òã’¢’¢ƒãƒB²¢ã#b“°¢òòF†R'B—2t”DU"F†â—B—2FÆÂæB—G2v–GF‚—2æ÷rF†R7vVWÂ6ò—B—0¢òò6—¦VB'’F†RÆVæwF‚öbF†R7G&ö¶R&F†W"F†â'’—G2F†–6¶æW70¢6öç7BrÒ%³%Òò%³5Ò¢ƒ°¢2ç6fR‚“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢&¶UÆ6R†2ÂÖ²Â&öG’“°¢2ç66ÆRƒÂF—"“²òò&÷rv’g&öÒF†R6†÷VÆFW ¢òòF†Rf–æ—6†W"Ç&VG’†2—G2÷vâWF†÷&VB–FVçF—G’(	BF†RvöÆFVâ7&÷76–ær€¢òòG&vâ&VÆ÷râF†—27vVW6—G2TäDU"—BB†Æb7G&VæwF‚6òF†RF†—&B&V@¢òò&VG22öæR†Vf–W"&Æ÷r&F†W"F†âGvòVffV7G2&wV–ærà¢2ævÆö&ÄÇ†Ò¢†6Æròã“R¢ã‚’¢‡7bæ6öÖ&òÓÓÒ"òãR¢’¢†f"òã‚¢“°¢–b‡72ÓÓÒvvÆ÷rr’°¢òòF†RGWÆ–6FS¢F†R6ÖR7G&ö¶RÂ6—¦RWÂ6ögFVæVBÂBVæFW"†Æ`¢òò7G&VæwF‚(	B†ÆòF†B†2F†R7WBw2÷vâ6†RÂæ÷BvVæW&–2&ÆööÐ¢2ævÆö&ÄÇ†£Ò4Ä4…ôtÄõræÇ†°¢2æf–ÇFW"Òv&ÇW"‚r²4Ä4…ôtÄõræ&ÇW"²w‚’s°¢2ç66ÆR…4Ä4…ôtÄõrç66ÆRÂ4Ä4…ôtÄõrç66ÆR“°¢2æG&t–ÖvR†–ÒÂ%³ÒÂ%³ÒÂ%³%ÒÂ%³5ÒÂ×r¢ƒãR²$´UôÄr’ÂÖ‚ò"ÂrÂ‚“°¢2æf–ÇFW"ÒvæöæRs°¢2ç&W7F÷&R‚“°¢&WGW&ã°¢Ð¢2æG&t–ÖvR†–ÒÂ%³ÒÂ%³ÒÂ%³%ÒÂ%³5ÒÂ×r¢ƒãR²$´UôÄr’ÂÖ‚ò"ÂrÂ‚“°¢òòF†R7G&–¶RfÆ6ƒ¢öæR'&–v‡B'W'7BöâF†Rg&ÖRF†R†—F&÷‚—2Æ—fRÂF‡&÷và¢òòBF†RÄTD”ärF—öbF†R7G&ö¶R(	Bv†W&RF†R6Æw2&RÂæ÷Bv†W&RF†W’vW&P¢–b‡âã‚bbÂãC"bb7bæ6öÖ&òÓÒ"’°¢6öç7B"Ò$´Ræ'W'7E3°¢6öç7B&‚Ò‡7bæ6öÖ&òÓÓÒ"ò#"¢R’¢†6Æròã2¢“°¢6öç7B'rÒ%³%Òò%³5Ò¢&ƒ°¢2ævÆö&ÄÇ†ÒƒÒÖF‚æ'2‡Òã2’òã"’¢ãƒS°¢2æG&t–ÖvR†–ÒÂ%³ÒÂ%³ÒÂ%³%ÒÂ%³5ÒÂr¢ƒãRÒ$´UôÄr’Ò'rò"ÂÖ&‚ò"Â'rÂ&‚“°¢Ð¢2ç&W7F÷&R‚“°§Ð¢òòF†RW&–f–W"w27G&ö¶S¢FW&VB7&W66VçBöbv†—FRÆ–v‡BÂ'&–v‡BBF†P¢òòÆVF–ærVFvRÂv—F‚6öÆB&ÇVRv6‚&V†–æB—BâF†R¦ö–æVB&ÆFR‡v–VÆB"¢òò7WG2Et”4R(	B6V6öæB7&W66VçBG&–Ç2F†Rf—'7B'’&VBÂv†–6‚—2F†P¢òòf—7VÂGv–âöbF†RF÷V&ÆVBv†ö÷6‚–âVF–òæ§2âÆÂFF—F—fS²æò&öG’'Bà¦gVæ7F–öâG&t7'—7FÄ&2†2ÂÂÂÖ²Â7bÂÂ&öG’’°¢6öç7B†Vg’Ò7bæ6öÖ&òÓÓÒ#°¢6öç7BÂÒ††Vg’òS¢7bæ6öÖ&òÓÓÒò3‚¢32’¢‡7bçv–VÆBÓÓÒ"òãR¢“°¢6öç7BD‚Ò†Vg’ò2¢“°¢2ç6fR‚“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢&¶UÆ6R†2ÂÖ²Â&öG’“°¢2ç66ÆRƒÂÖ²æF—"“°¢6öç7B76W2Ò7bçv–VÆBÓÓÒ"ò³ÂãeÒ¢³Ó°¢f÷"†6öç7Böfböb76W2’°¢6öç7BÒ6Æ×‡ÒöfbÂÂ“°¢–b‡ÃÒãR’6öçF–çVS°¢6öç7BVçbÒÂã#"òòã#"¢ÖF‚ç÷rƒÒ‡Òã#"’òãs‚ÂãR“°¢–b†VçbÃÒã"’6öçF–çVS°¢6öç7Bw&÷rÒã‚²¢ã3S°¢6öç7BÒÔÖF‚å’¢ãs‚ÂÒÔÖF‚å’¢ã##°¢2æ&Vv–åF‚‚“°¢2æ&2ƒÂÂ¢ãc"¢w&÷rÂÂ¢w&÷rÂÂ“°¢2æ&2ƒÂÂ¢ãc"¢w&÷rÂ„ÂÒD‚’¢w&÷rÂÂÂG'VR“°¢2æ6Æ÷6UF‚‚“°¢6öç7BrÒ2æ7&VFU&F–Äw&F–VçBƒÂÂ¢ãc"¢w&÷rÂ„ÂÒD‚’¢w&÷rÂÂÂ¢ãc"¢w&÷rÂÂ¢w&÷r“°¢ræFD6öÆ÷%7F÷ƒÂw&v&ƒCÃ“Ã#SRÃ’r“°¢ræFD6öÆ÷%7F÷ƒãSRÂw&v&ƒ#Ã#3RÃ#SRÂr²ƒãR¢Vçb’²r’r“°¢ræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ#SRÃ#SRÂr²ƒã’¢Vçb’²r’r“°¢2æf–ÆÅ7G–ÆRÒs°¢2ç6†F÷t6öÆ÷"Òr66fS†fbs²2ç6†F÷t&ÇW"Ò¢Vçc°¢2æf–ÆÂ‚“°¢2ç6†F÷t&ÇW"Ò°¢òòF†RÆVF–ærF—fÆ6†W2öâF†Rg&ÖW2F†R†—F&÷‚—2Æ—fP¢–b‡âã‚bbÂãCR’°¢6öç7BF—ÒÂ#"Ò„ÂÒD‚ò"’¢w&÷s°¢2ævÆö&ÄÇ†ÒƒÒÖF‚æ'2‡Òã2’òãb’¢ã“°¢2æf–ÆÅ7G–ÆRÒr6fffffbs°¢2æ&Vv–åF‚‚“°¢2æ&2„ÖF‚æ6÷2‡F—’¢#"ÂÂ¢ãc"¢w&÷r²ÖF‚ç6–â‡F—’¢#"Â†Vg’òBãR¢2ã"ÂÂr“°¢2æf–ÆÂ‚“°¢2ævÆö&ÄÇ†Ò°¢Ð¢Ð¢2ç&W7F÷&R‚“°§Ð¢òòF†R&ÆFR–âfÆ–v‡B(	BF&²w&—v—F‚Gvòv†—FR7'—7FÂVæG2Â7–ææ–ærà¢òòG&vâ–âv÷&ÆB76Rg&öÒF†RvÖRw2G&r72†gFW"&ö¦V7F–ÆW2’à¦gVæ7F–öâG&t&ööÖW"†2’°¢6öç7B"Òræ&ööÖW#°¢–b‚"’&WGW&ã°¢2ç6fR‚“°¢2çG&ç6ÆFR†"ç‚Â"ç’“°¢2ç&÷FFR†"ç7–â“°¢6öç7B'C×G—VöbÔTD”õ$rÓÒwVæFVf–æVBrbbÔTD”õ$ræ†W&ô¦ö–æVE&ö¦V7F–ÆS°¢–b†'Bbb'BææGW&Åv–GF‚—°¢6öç7BgƒÔÔTD”õ$rç7v–ætGVÄgƒ°¢–b†g‚bbg‚æ6ö×ÆWFRbbg‚ææGW&Åv–GF‚—°¢6öç7B7sÖg‚ææGW&Åv–GF‚óƒ°¢2ç6fR‚“¶2ævÆö&Ä6ö×÷6—FT÷W&F–öãÒvÆ–v‡FW"s¶2ævÆö&ÄÇ†ÒãSS°¢2æG&t–ÖvR†g‚Ã2¦7rÃÆ7rÆg‚ææGW&Ä†V–v‡BÂÓ3‚ÂÓ3‚ÃsbÃsb“¶2ç&W7F÷&R‚“°¢Ð¢òò&÷FF–öâföÆÆ÷w2F†R7GVÂ&ö¦V7F–ÆS²6öÆÆ—6–öâÂ&WGW&âæB6F6‚&RVæ6†ævVBà¢2æG&t–ÖvR†'BÂÓ3ÂÓ3ÃcÃc“°¢2ç&W7F÷&R‚“°¢&WGW&ã°¢Ð¢–b‡G—VöbÖVF–fWF6ƒÓÓÒvgVæ7F–öâr–ÖVF–fWF6‚‚v†W&ô¦ö–æVE&ö¦V7F–ÆRrÃ“°¢òòF†Rw&——26öÆ–BF†–æræBG&vâ2öæP¢2æf–ÆÅ7G–ÆRÒr3&3CC"s°¢2æ&Vv–åF‚‚“²2ç&÷VæE&V7Bò2ç&÷VæE&V7B‚ÓRÂÓ"ãbÂÂRã"Â"ãB’¢2ç&V7B‚ÓRÂÓ"ãbÂÂRã"“²2æf–ÆÂ‚“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢f÷"†6öç7B2öb³ÂÓÒ’°¢6öç7BrÒ2æ7&VFTÆ–æV$w&F–VçBƒÂÂ2¢#BÂ“°¢ræFD6öÆ÷%7F÷ƒÂw&v&ƒ#Ã#3RÃ#SRÃãR’r“°¢ræFD6öÆ÷%7F÷ƒãSRÂw&v&ƒ#CÃ#SÃ#SRÃã“R’r“°¢ræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ#SRÃ#SRÃ’r“°¢2æf–ÆÅ7G–ÆRÒs°¢2ç6†F÷t6öÆ÷"Òr66fS†fbs²2ç6†F÷t&ÇW"Òƒ°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò‡2¢RÂÓ2“²2æÆ–æUFò‡2¢#ÂÓãr“²2æÆ–æUFò‡2¢#BÂ“°¢2æÆ–æUFò‡2¢#Âãr“²2æÆ–æUFò‡2¢RÂ2“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢Ð¢2ç&W7F÷&R‚“°§Ð¢òò&V6÷&G2v†W&Rrv2ÂæBv†B—Bv27v–æv–ær&÷VæBÂ–âF†R6öçFW‡B—@¢òòv2G&vâ–ââF†RÖG&—‚—26GW&VB&F†W"F†âF†Rv÷&ÆB÷6—F–öâÂ&V6W6P¢òò'’F†RF–ÖRF†R7WB—26ö×÷6—FVBF†R&öG’w2G&ç6f÷&Ò(	Bf6–ærÖ—'&÷"Â'Và¢òòÆVâÂÆæF–ær7V6‚ÂWföÇWF–öâ66ÆRæBF†RF÷V&ÆR§V×w27—&Â(	B†2&VVà¢òò÷VBÂæBöæÇ’F†RÖG&—‚¶æ÷w2v†BÆÂöbF†BF–BFòF†W6RGvòö–çG2à¦gVæ7F–öâ&¶TÖ&²‡ÂÂ2Â7‚Â7’Â‡‚Â‡’ÂF—"Âf"’°¢‡Âå÷&¶RÇÂ‡Âå÷&¶RÒµÒ’’çW6‚‡°¢Ó¢Âå÷&¶TÒÇÂ2ævWEG&ç6f÷&Ò‚’Â7ƒ¢7‚Â7“¢7’Âƒ¢‡‚Â“¢‡’À¢F—#¢F—"ÓÒçVÆÂò¢F—"Âf#¢f"À¢Ò“°§Ð¢òòD„R4tRu2Ärôb„$Ò†Fö72ö6öÖ&Bõ4tRæÖB’âf–v‡F–æs¢æ÷&ÖÂFÖvP¢òòF÷vâFò†&BfÆö÷"B3R(	BF†R6öær†öÆG2F†R&öG’FövWF†W"7B—BÀ¢òòæB&V6†–ærF†RfÆö÷"G&÷2—B–çFòF†R4ôärÔÄô4²âÆö6¶VC¢6Æw2vÆæ6P¢òò‡7&·2æBF†R†–çBÆ–æR(	B&F6†WB6–B—B–âF–ÆöwVRÂF†Rf–v‡B6—0¢òò—B–âÆ’“²7'—7FÂ7G&–¶W2f–ÆÂU$•E’ÂæBgVÆÂW&—G’FÖW2—Bà¢òòFÖVC¢7G&–¶W2&Rö¶W2ÂF†RvöÇfW2r÷vâÖW&7’Ærà¦gVæ7F–öâ6vU7G'V6²†RÂFÒÂ‚Â’’°¢–b†RçFÖR’°¢'W'7B‡‚Â’ÂRÂr3–ff6fbrÂSÂã2ÂÂ"ÂG'VR“°¢–b‡G—Vöb6g‚ÓÓÒvgVæ7F–öâr’6g‚‚w–6²r“°¢&WGW&â°¢Ð¢6öç7Bv–VÆBÒG—Vöbv–VÆFVBÓÓÒvgVæ7F–öâròv–VÆFVB‚’¢v6Ærs°¢6öç7BfÆö÷"ÒÖF‚ç&÷VæB†Ræ‡Öƒ¢ã2“°¢–b†RæÆö6¶VB’°¢–b‡v–VÆBÓÓÒv6Ærr’°¢'W'7B‡‚Â’ÂbÂr6&fS–fbrÂƒÂã#"Â##Â"ÂG'VR“°¢6g‚‚væòr“°¢–b‚„rå÷6uFöÆEBÇÂ’ÃÒ’²rå÷6uFöÆEBÒC²rçFö7B‡B‚w6uö†–çBr’“²Ð¢&WGW&â°¢Ð¢RçW&TÒ³Ò‡v–VÆBÓÓÒv7'—7FÃ"ròã3B¢ã#R“°¢Ræ‡W'EBÒãS°¢'W'7B‡‚Â’ÂBÂr6fffffbrÂ#cÂãRÂcÂ2ÂG'VR“°¢6g‚‚v&÷76†—Br“°¢ræ†—E7F÷ÒÖF‚æÖ‚„ræ†—E7F÷Âãb“°¢–b†RçW&TÒãÒ’6vUFÖR†R“°¢&WGW&â°¢Ð¢Rç7G'V6²ÒG'VS°¢–b†Ræ‡ÒFÒÃÒfÆö÷"’°¢Ræ‡ÒfÆö÷#²RæÆö6¶VBÒG'VS²Ræ‡W'EBÒã#°¢Ræ6ö–ÅBÒRævF†W%BÒRæÇVævUBÒRçv–æFVEBÒ²Rç&–æu"ÒçVÆÃ°¢–b‡G—Vöb6vTGVVÅ&W6WCÓÓÒvgVæ7F–öâr—6vTGVVÅ&W6WB†RÂvÆö6¶VBr“°¢ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚Âã2“°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂb“°¢6g‚‚wFVÆÂr“°¢–b‚rç6fRæfÆw2ç6tÆö6µ6VVâ’²rç6fRæfÆw2ç6tÆö6µ6VVâÒ²rçFö7B‡B‚w6uöÆö6²r’“²W'6—7B‚“²Ð¢&WGW&âFÓ°¢Ð¢Ræ‡ÓÒFÓ²Ræ‡W'EBÒã#°¢&WGW&âFÓ°§Ð¢òòUdU%’4tR•24ôÔT$ôE’â6WfVâ6†Ö&W'2Â6WfVâ–FVçF—F–W2ÂæBv†BV6€¢òòöæRv—fW2—2v†B—G2¶–ævFöÒfÇVVB(	B6VÆÂ¶WB6fRÂÖVæF–ær¶—BÀ¢òòFV6†–ærÂvV–v‡BöbÖWFÂâF†R–FVçF—G’6&B6'&–W2F†R6fRw27F÷'¢òò&VC²F†Rv–gB6Æ÷7W&R6'&–W2—G2V6öæö×’â6†Ö&W"v—F‚æò&÷rfÆÇ0¢òò&6²FòF†RvVæW&–2–÷WBÂ6òæWræWGv÷&²—2æWfW"6–ÆVçFÇ’v–gFÆW72à¦6öç7B4tUôt”eBÒ°¢tC¢‚’Óâ–çdFB‚v&GBr’Âòò6VÆÂÂ¶WB6fP¢t$C¢‚’Óâ²–çdFB‚v¶—Br“²rç6fRç67&³Òƒ²ÒÂòòv†B6²fÇVW0¢t#C¢‚’Óâ²rç6fRæ—³Ò#S²ÒÂòò—BFV6†W0¢t3C¢‚’Óâ²rç6fRç67&³Ò#²ÒÂòòvV–v‡BöbÖWFÀ¢tCC¢‚’Óâ²rç6fRç67&³ÒS²rç6fRæ—³Ò²ÒÂòòF†R&6†—fW2†ö&@¢uƒC¢‚’Óâ²rç6fRç67&³Ò#²rç6fRæ—³ÒS²ÒÂòòG&–'WFRFòF†R7v÷&@¢tSC¢‚’Óâ–çdFB‚v&GBr’Âòò—B¶æVÇB6Æ÷6W7BæB†VÆBöà§Ó°¦gVæ7F–öâ6vUFÖR†R’°¢–b‡G—Vöb6vTGVVÅ&W6WCÓÓÒvgVæ7F–öâr—6vTGVVÅ&W6WB†RÂwW&Rr“°¢RçFÖRÒ²RæÆö6¶VBÒfÇ6S²Ræ6ÆÒÒG'VS²RçW&TÒÒ°¢6öç7B¶W’Òw6vUFÖUòr²rç&ööÔ–C°¢rç6fRæfÆw5¶¶W•ÒÒ°¢òòF†RGVVÂG&6²&W6öÇfW3¢F†R6†Ö&W"vöW2&6²Fò—G2¦öæRw2÷vâV–W@¢òò‡F†R¦öæR¶W’—2v†BÆöE&ööÒ—G6VÆbÆ—2f÷"æöâÖ&÷72&ööÒ¢–b†RæGVVÄ×W2bbG—Vöb6WD×W6–2ÓÓÒvgVæ7F–öârbbrç&ööÔFVb’6WD×W6–2„rç&ööÔFVbç¦öæR“°¢6öç7B7‚ÒRç‚²Rçrò"Â7’ÒRç’²Ræ‚ò#°¢òò$U45TRÂäõB´”ÄÂ†÷væW"Â##bÓÓ“¢%F†R6vR—2&W67VVBÂæ÷B¶–ÆÆVBà¢òò6ÆVç6–ær×W7BÆöö²æB&VBF–ffW&VçFÇ’g&öÒFW7G&÷––ærâVæV×’"’âæð¢òòfæf&RÖæBÖ'W'7B(	BF†B—2F†R¶–ÆÂw2fö6'VÆ'’âF†R6ÆVç6–ærÆ–v‡@¢òò†§2÷&öw&W72æ§2’æBF†Rv÷&G2f÷"v†B†VæVBà¢–b‡G—Vöb6ÆVç6T&Vv–âÓÓÒvgVæ7F–öârbb‡G—Vöb—4†W&òÓÓÒvgVæ7F–öârbb—4†W&ò‚’’’°¢6ÆVç6T&Vv–â†Rç‚ÂRç’ÂRçrÂRæ‚Âwu÷&W67VVBr“°¢–b„rç&ööÔ–BÓÓÒttBr’°¢rçFö7B‡B‚wu÷6vUög&VRr’“°¢òòF†R&VÆÂw2v&B÷fW"F†RÖVF÷r6Æ–Ö"fÆÇ2v—F‚F†R6vRw2&–æF–æp¢–b‚rç6fRæfÆw2æ&÷746†–ÖR’rçFö7B‡B‚wv&Eö6†–ÖUöfÆÂr’“°¢Ð¢ÒVÇ6R°¢6g‚‚wv–âr“°¢ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚ÂãR“°¢ræFE&–ær†7‚Â7’“°¢'W'7B†7‚Â7’Â3Âr6fffffbrÂ3#Âã’ÂcÂ2ÂG'VR“°¢Ð¢'W'7B†7‚Â7’Â‚Âr3Sv†fbrÂ#ÂãÂÓCÂ"ãbÂG'VR“°¢òòD„Rt”eB(	BF†R6fRv—fW2&–ç7FVBöbF¶–ærg&öÒF†RFÖVB6vR ¢–b‚rç6fRæfÆw5²w6vTv–gEòr²rç&ööÔ–EÒ’°¢rç6fRæfÆw5²w6vTv–gEòr²rç&ööÔ–EÒÒ°¢…4tUôt”eE´rç&ööÔ–EÒÇÂ‚‚’Óâ²rç6fRç67&³Ò#²rç6fRæ—³ÒS²Ò’’‚“°¢6öç7B–²Òw6u÷Eòr²rç&ööÔ–C°¢6öç7BæÒÒB†–²’ÓÓÒ–²òB‚w6u÷FÖVBr’¢B†–²“°¢6öç7BG2ÒB†–²²vBr’ÓÓÒ–²²vBròB‚w6u÷FÖVFBr’¢B†–²²vBr“°¢–b‡G—Vöb6†÷t—FVÒÓÓÒvgVæ7F–öâr’6†÷t—FVÒ†æÒÂG2“°¢–b‡G—Vöb—çVFvRÓÓÒvgVæ7F–öâr’—çVFvR‚“°¢Ð¢òòD„R%TÄRÂdõ"4tU2Dôó¢&FVfVF–ær&÷72÷"6vRÇv—2&WfVÇ2¢òò6fRâ"6†Ö&W"6vW2&RÇ&VG’–ç6–FRF†V—'3²gWGW&R5U$d4R6vP¢òòæVVG2öæÇ’tDUõ$ôôÒ&÷rvFVBöâw6vUFÖUóÆ—G2&ööÓâræBF†—0¢òòf—&W2F†R&WfVÂF†RÖöÖVçB—B—2W&–f–VBà¢f÷"†6öç7B&–B–â‡G—VöbtDUõ$ôôÒÓÒwVæFVf–æVBròtDUõ$ôôÒ¢·Ò’’°¢–b‚vFTFö÷'4ÆÂ‡&–B’ç6öÖR†BÓâBææVVBÓÓÒ¶W’’’6öçF–çVS°¢rçFö7B‡B‚v6fUö÷Vâr’“°¢6g‚‚v6†&vU&VG’r“°¢'&V³°¢Ð¢òò$’4â4Äõ4RõU"TäB"(	BF†R&öÖ—6R¶WB–âF†R&ööÒ6†R—27FæF–ær–âÀ¢òòæ÷BöæÇ’–âF†R&öö×26†RvÆ·2–çFòæW‡B†6öÖ–2#c¢F†RVF—B6¶VBf÷ ¢òòF†R6ö÷&F–æFVB6‡WFF÷vâæBF†RÖ6†–æW2r&V7F–öâÂæB†BöæÇ’F†P¢òò&WfVÂ’âWfW'—F†–ær7F–ÆÂ‡VçF–ær†W"–âF†R6†Ö&W"7FæG2F÷vâBF†P¢òòÖöÖVçBF†R†ÆòGW&ç2Âv†–6‚—2F†RöæÇ’g&ÖRv†W&RF†RÆ–W"6â6VP¢òòF†BF†R6vRF–B—B&F†W"F†âF†BF†R&ööÒ†VæVBFò&RV×G’à¢f÷"†6öç7Bòöb„ræVæVÖ–W2ÇÂµÒ’’°¢–b‚òÇÂòÓÓÒRÇÂòæFVBÇÂòæ¶–æBÓÓÒw6vRr’6öçF–çVS°¢6öç7Bv46ÆÒÒòæ6ÆÓ°¢òòF†RöæW2F†BvW&RV÷ÆR&Rg&VVBv—F‚—B(	BWfVâöæRF†R'&–B†@¢òòÇ&VG’6ÆÖVB(	BæBvV"F†R7W&Rw26—&6ÆP¢–b†òæ7F÷%&öÆRÓÓÒv–æfV7FVB×W'6öârbbòç&W67VVB’°¢òç&W67VVBÒG'VS²òæF—6&ÆVBÒfÇ6S°¢–b‡G—Vöb6ÆVç6T&Vv–âÓÓÒvgVæ7F–öâr’6ÆVç6T&Vv–â†òç‚Âòç’ÂòçrÂòæ‚Âwuög&VVBrÂçVÆÂÂG'VR“°¢Ð¢òæ6ÆÒÒG'VS²òæ‡—æõBÒS“°¢–b‡v46ÆÒ’6öçF–çVS°¢òç7FuBÒ°¢'W'7B†òç‚²òçrò"Âòç’²òæ‚ò"Â’Âr33vffCrÂÂãrÂÓ"Â"ã"ÂG'VR“°¢Ð¢–b‡G—Vöbf—'7E6vU&WfVÆF–öâÓÓÒvgVæ7F–öâr’f—'7E6vU&WfVÆF–öâ‚“°¢W'6—7B‚“°§Ð¢òòD„R4tRÂE$tâ(	B&ö&VBÖ6†–æRÖöæ²Â†ööFVBÂ¶æVVÆ–ær†ÆbÖ–ç6–FRF†P¢òò6öærâVæv–æRÖG&vâf—'7B72–âF†RÖ–æ–öâfÆÆ&6²7G–ÆS²WF†÷&V@¢òòÆFW2VWVVB„%EõTUTR’âF†RW&'VÆRÆ—fW2†W&RFöó¢v†–ÆR6†R†öÆG0¢òò7'—7FÂÆ–v‡Bâ–æfV7FVB6vRvV'2F†R$Ä4²„Äòt•D‚D„RTÔ$U"$”Ð¢òò‡F†R÷væW"w27V2(	B&Æ6²6ææ÷B&–FRF†RFF—F—fR72Â6ò—B—2—G2÷và¢òòF&²&–ær’ÂæBW&–f–VBöæR6†÷w2&ÇVRg&öÒF†RÆ–v‡B72à¦gVæ7F–öâG&u6vR†2ÂR’°¢6öç7B7‚ÒRç‚²Rçrò"Â&6RÒRç’²Ræƒ°¢6öç7BC"ÒRææ–Ó°¢òò&W67VVB6vR¶æVVÇ2öæÇ’v†–ÆR&W7F–ærâöæ6R—G26ÆÒ’vÆ·2ÂW6RF†P¢òòWF†÷&VBW&–f–VBvÆ²7G&—²÷F†W'v—6R—G2&öG’G&ç6ÆFW2–âöæRg&÷¦Và¢òò¶æVVÆ–ærÆFRæB&VG226ÆVW–ær6†&7FW"6Æ–F–ær÷fW"F†RfÆö÷"à¢6öç7B6vUvÆ¶–ærÒRçFÖRbbÖF‚æ'2†Rçg‚ÇÂ’â#°¢6öç7B¶æVVÂÒRæÆö6¶VBÇÂ‚RçFÖRbb6vUvÆ¶–ær“°¢6öç7BGVVÄ7F—fRÒG—Vöb6vTGVVÄ7F—fRÓÓÒvgVæ7F–öârbb6vTGVVÄ7F—fR†R“°¢6öç7B&ö"Ò¶æVVÂÇÂGVVÄ7F—fRò¢ÖF‚ç6–â‡C"¢"ã"’¢ãc°¢òòF†RW&6Vç6S¢F†R&Æ6²†ÆòÂVæFW"WfW'—F†–æp¢–b‡G—VöbW&6Vç6RÓÓÒvgVæ7F–öârbbW&6Vç6R‚’bbRçFÖR’°¢6öç7BfÂÒãsR²ÖF‚ç6–â‡C"¢r²ÖF‚ç6–â‡C"¢2’’¢ã#S°¢2ç6fR‚“°¢6öç7BFrÒ2æ7&VFU&F–Äw&F–VçB†7‚Â&6RÒRæ‚¢ãRÂBÂ7‚Â&6RÒRæ‚¢ãRÂS"“°¢FræFD6öÆ÷%7F÷ƒÂw&v&ƒÃÃÃãR’r“²FræFD6öÆ÷%7F÷ƒãs"Âw&v&ƒÃ"ÃBÃã2’r“°¢FræFD6öÆ÷%7F÷ƒÂw&v&ƒÃÃÃ’r“°¢2æf–ÆÅ7G–ÆRÒFs²2æ&Vv–åF‚‚“²2æ&2†7‚Â&6RÒRæ‚¢ãRÂS"ÂÂr“²2æf–ÆÂ‚“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†Òã2¢fÃ°¢2ç7G&ö¶U7G–ÆRÒr6fcV&s²2æÆ–æUv–GF‚Ò"ãS°¢2ç6†F÷t6öÆ÷"Òr6fcV&s²2ç6†F÷t&ÇW"Òƒ°¢2æ&Vv–åF‚‚“²2æ&2†7‚Â&6RÒRæ‚¢ãRÂC²fÂ¢BÂÂr“²2ç7G&ö¶R‚“°¢2ç6†F÷t&ÇW"Ò°¢2ç&W7F÷&R‚“°¢Ð¢òòD„RUD„õ$TB4tRŒ*s&R“¢6—‚ÆFW2–æFW†VB'’F†R6ÖR7FFRF†Rv†öÆP¢òòf–v‡B&VG2(	BÖ&W"öâW†7FÇ’F†RF‡&VRFVÆVw&‚7FFW2ÂVÖ&W"vöæRæ@¢òò7'—7FÂ&ÇVRöâW&RâF†R&ö6VGW&ÂÖöæ²&VÆ÷r7F—22F†RfÆÆ&6°¢òòv†–ÆRÆFR—2–âfÆ–v‡BÂv†–6‚—2F†R†÷W6R'&ævVÖVçBWfW'—v†W&Rà¢6öç7B6vUÆFRÒRçFÖRbb6vUvÆ¶–æròw6vUW&Rp¢¢RæÆö6¶VBòw6vTÆö6²p¢¢RævF†W%Bâòw6vTvF†W"p¢¢Ræ6ö–ÅBâòw6vT6ö–Âp¢¢RæÇVævUBâòw6vTÇVævRr¢w6vU7FæBs°¢òòW"×7FFR†V–v‡C¢F†R6–Æ†÷VWGFW2&RvVçV–æVÇ’F–ffW&VçB6†W2Â6òV6€¢òòÖ2—G2÷vâ÷VRÖ&÷‚†V–v‡BFòF†R&öG’&F†W"F†âöæR6†&VBçVÖ&W ¢6öç7B6vT‚Ò²6vUW&S¢ãs"Â6vTÆö6³¢ãcbÂ6vTÇVævS¢ãc"Õ·6vUÆFUÒÇÂã#°¢6öç7B6vTfÆ—Ò‡G—VöbÆ–W"ÓÒwVæFVf–æVBrbbÆ–W"bbÆ–W"ç‚²Æ–W"çrò"Â7‚“°¢òòD„RU„„ÄR„2$ôE’âF†R6vRw2÷Væ–ær‡v–æFVEBÂFö72ö6öÖ&Bõ4tRæÖB¢òòG&WrF†RÆ–â7FæF–ærÆFRÂ6òF†RöæRv–æF÷rF†RGVVÂ—2'V–ÇB&÷Væ@¢òòÆöö¶VBW†7FÇ’Æ–¶RF†R6vRv—F–ærFò7G&–¶Râ—Bæ÷r$õu2÷fW"F†R7Vç@¢òò'&VF‚(	BF÷V&ÆVBf÷'v&BF÷v&B†W"Â6†÷VÆFW'27Væ²(	B—f÷FVBöâ—G2fVWBÀ¢òòVçF–ÂâWF†÷&VBW††ÆRÆFR6öÖW2öfbD„Rd•$”ärÄ•5B„%EõTUTR*s&62’à¢6öç7BW††ÆRÒ¶æVVÂbb†Rçv–æFVEBÇÂ’â°¢òòââææBæ÷r—B†2—G2÷vâÆFRæB—G2÷vâvÆ²„%EõTUTR*s&62×f–’’À¢òò&÷F‚WF†÷&VBF‡&VR×V'FW"f6–ærÄTeBÂ6òF†W’GW&âF÷v&B†W"F†P¢òò÷÷6—FRv’FòF†Rg&öçBÖöâ6WBâF†R&÷rG&ç6f÷&Ò7F—2öæÇ’2F†P¢òòfÆÆ&6²v†–ÆRF†RW††ÆRÆFR—2–âfÆ–v‡Bâ6VÆÂ†V–v‡G2&RÖF6†VBFð¢òòF†R7FæF–ærÆFRw2ã"†—F&÷†W2öb&öG’‡F†R&÷r7FæG2Æ—GFÆRÆ÷vW"’à¢ÆWB6vTG&WrÒG—VöbG&u6vTGVVÄ&öG“ÓÓÒvgVæ7F–öârbfG&u6vTGVVÄ&öG’†2ÆR“°¢6öç7BF÷v&D†W"Ò6vTfÆ—°¢–b‚6vTG&WrbbW††ÆRbbG—VöbG&u7G&—6VÆÂÓÓÒvgVæ7F–öâr¢6vTG&WrÒG&u7G&—6VÆÂ†2Âw6vTW††ÆRrÂÂÂ7‚Â&6RÂRæ‚¢ãrÂF÷v&D†W"“°¢VÇ6R–b‚6vTG&Wrbb¶æVVÂbb6vUÆFRÓÓÒw6vU7FæBrbbÖF‚æ'2†Rçg‚ÇÂ’â"bbG—VöbG&u7G&—6VÆÂÓÓÒvgVæ7F–öâr’°¢òòöæR7G&–FRW"Sb‚öbfÆö÷"—B6÷fW'2†Ö÷fTVçBw2vÆ´B’ÂÆ–¶RWfW'¢òòvÆ¶W"(	BæWfW"F†R6Æö6²Â÷"F†R&ö&Rv÷VÆB6Rf7FW"F†âF†RfVW@¢6öç7B6VÆÂÒÖF‚æfÆö÷"‚‚‚‚†RçvÆ´BÇÂ’òSb’R’²’R¢‚“°¢òòW&T'BÆ–W2F†R6ÆVâ7–â÷v†—FRÖFW&–ÂFòF†R6ÖRWF†÷&VBv—Bà¢6vTG&WrÒG&u7G&—6VÆÂ†2Âw6vUvÆ³‚rÂ6VÆÂÂ‚Â7‚Â&6R²&ö"ÂRæ‚¢ãSRÂF÷v&D†W"ÂRçFÖR“°¢Ð¢–b‚6vTG&Wr’°¢–b†W††ÆR’°¢2ç6fR‚“°¢2çG&ç6ÆFR†7‚Â&6R“²2ç&÷FFR‚‡6vTfÆ—òÓ¢’¢ã"“²2ç66ÆRƒã‚Âã‚“²2çG&ç6ÆFR‚Ö7‚ÂÖ&6R“°¢Ð¢G'’°¢6vTG&WrÒG—VöbG&uÆFTæ6†÷&VBÓÓÒvgVæ7F–öârb`¢G&uÆFTæ6†÷&VB†2Â6vUÆFRÂ7‚Â&6R²&ö"ÂRæ‚¢6vT‚Â6vTfÆ—ÂG'VR“°¢Òf–æÆÇ’²–b†W††ÆR’2ç&W7F÷&R‚“²Ð¢Ð¢–b‡6vTG&Wr’°¢òòF†RÆFR6'&–W2F†R&öG“²F†R&–ærÂW&—G’&"æB†Æò7F–ÆÂ&–FR—@¢ÒVÇ6R°¢2ç6fR‚“°¢2çG&ç6ÆFR†7‚Â&6R²&ö"“°¢6öç7BÆVâÒ¶æVVÂò¢6Æ×†Rçg‚ò#cÂÓÂ’¢ã#°¢2ç&÷FFR†ÆVâ“°¢6öç7Bƒ"Ò¶æVVÂòRæ‚¢ãs"¢Ræƒ°¢6öç7B6ö–ÂÒRæ6ö–ÅBâòÒRæ6ö–ÅBòDTÄÅõ5t•R¢°¢6öç7BvF‚ÒRævF†W%BâòÒRævF†W%BòDTÄÅô„Te’¢°¢òòF†R&ö&R(	BFW&VB6÷vÂÂF÷&âBF†R†VÐ¢6öç7B&rÒ2æ7&VFTÆ–æV$w&F–VçBƒÂÔƒ"ÂÂ“°¢&ræFD6öÆ÷%7F÷ƒÂRçFÖRòr3SCcƒvRr¢r3SCCF2r“°¢&ræFD6öÆ÷%7F÷ƒÂRçFÖRòr3#C&c62r¢r3#Cƒ#r“°¢2æf–ÆÅ7G–ÆRÒ&s°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò‚ÓBÂÔƒ"“°¢2çVG&F–47W'fUFò‚Ó2Ò6ö–Â¢2ÂÔƒ"¢ãSRÂÓÂ“°¢f÷"†ÆWB²ÒÓ²²Â²²³ÒB’2æÆ–æUFò†²²"Â²R‚ÓÓÒòÓ2¢“°¢2æÆ–æUFòƒÂ“°¢2çVG&F–47W'fUFòƒ2²6ö–Â¢2ÂÔƒ"¢ãSRÂBÂÔƒ"“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢òòF†R&–ÒÆ–v‡B(	BöæRÆ—BVFvRÂ6òF†R6–Æ†÷VWGFR&VG2v–ç7BF&²&ö6°¢òò†&Æ6²ÖöâÖ&Æ6²v2–çf—6–&ÆR–âF†R&VæFW"ÖæBÖÆöö²72¢2ç7G&ö¶U7G–ÆRÒRçFÖRòr3†f#62r¢r3†fvs°¢2æÆ–æUv–GF‚ÒãC²2ævÆö&ÄÇ†ÒãƒS°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò‚ÓBÂÔƒ"“°¢2çVG&F–47W'fUFò‚Ó2Ò6ö–Â¢2ÂÔƒ"¢ãSRÂÓÂ“°¢2ç7G&ö¶R‚“°¢2ævÆö&ÄÇ†Ò°¢òòF†R†ööB(	BFVWÂæBæ÷F†–ær–â—B'WBF†RW–W0¢2æf–ÆÅ7G–ÆRÒRçFÖRòr3&36F2r¢r3#Cƒ#s°¢2æ&Vv–åF‚‚“°¢2æVÆÆ—6RƒÂÔƒ"²BÂ’Â‚ÂÂÖF‚å’¢ã“RÂÖF‚å’¢"ãR“°¢2çVG&F–47W'fUFòƒrÂÔƒ"²"ÂÂÔƒ"²2“°¢2çVG&F–47W'fUFò‚ÓrÂÔƒ"²"ÂÓ’ÂÔƒ"²B“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢2æf–ÆÅ7G–ÆRÒr3Sss°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÔƒ"²‚ÂbÂRãRÂÂÂr“²2æf–ÆÂ‚“°¢òòvF†W&–æs¢VÖ&W"Æ–v‡BööÇ2–âF†R6ÆVWfW0¢–b†vF‚â’°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†ÒvFƒ°¢f÷"†6öç7B2öb²ÓÂÒ’°¢2æf–ÆÅ7G–ÆRÒr6fc†Fs²2ç6†F÷t6öÆ÷"Òr6fcV&s²2ç6†F÷t&ÇW"Ò°¢2æ&Vv–åF‚‚“²2æ&2‡2¢ƒ"²vF‚¢B’ÂÔƒ"¢ãBÂ2²vF‚¢"ãRÂÂr“²2æf–ÆÂ‚“°¢Ð¢2ç6†F÷t&ÇW"Ò²2ç&W7F÷&R‚“°¢Ð¢òòF†RW–W2(	BVÖ&W"v†–ÆRF†R6öær†öÆG2—BÂ&ÇVRöæ6R—BÆWG2vð¢6öç7B†÷BÒRæ6ö–ÅBâÇÂRævF†W%BâÇÂRæÇVævUBâ°¢6öç7BV2ÒRçFÖRòr3f3†fbr¢†÷Bòr6fcv6r¢r63ƒV6s°¢2æf–ÆÅ7G–ÆRÒV3²2ç6†F÷t6öÆ÷"ÒV3²2ç6†F÷t&ÇW"Ò†÷Bò’¢S°¢6öç7B&Æ–æ²ÒRæÆö6¶VBòãb²ÖF‚ç6–â‡C"¢b’¢ãB¢°¢2ævÆö&ÄÇ†Ò&Æ–æ³°¢f÷"†6öç7B2öb²ÓÂÒ’²2æ&Vv–åF‚‚“²2æ&2‡2¢"ãbÂÔƒ"²‚ÂãBÂÂr“²2æf–ÆÂ‚“²–ædW–TÖ&²†2Â2¢"ãbÂÔƒ"²‚“²Ð¢2ævÆö&ÄÇ†Ò²2ç6†F÷t&ÇW"Ò°¢2ç&W7F÷&R‚“°¢Ð¢òòF†RVÖ&W"&–ær…Tu2D„Ru$õTäB(	B—B‡W'G2†W"fVWBÂ6ò—B—2G&vâ@¢òò†W"fVWC¢7V6†VBVÆÆ—6R7&vÆ–ær÷WGv&BÂæ÷B†ö÷–âF†R— ¢òò‡F†Rf—'7B&VæFW"&VB2v–çB6—&6ÆR÷fW"F†Rv†öÆR&ööÒ¢–b†Rç&–æu"ÒçVÆÂ’°¢6öç7B÷&–v–ã×G—Vöb6vU&–æt÷&–v–ãÓÓÒvgVæ7F–öâs÷6vU&–æt÷&–v–â†R“§·ƒ¦7‚Ç“¦&6WÓ°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†Ò6Æ×ƒÒRç&–æu"ò#SÂã"ÂãSR“°¢2ç7G&ö¶U7G–ÆRÒr6fcf6s²2æÆ–æUv–GF‚Ò3°¢2ç6†F÷t6öÆ÷"Òr6fcV&s²2ç6†F÷t&ÇW"Òc°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†÷&–v–âç‚Â÷&–v–âç’ÂRç&–æu"Â’ÂÂÖF‚å’ÂÖF‚å’¢"“²2ç7G&ö¶R‚“°¢òò7&·2&–F–ærF†RvfVg&öç@¢f÷"†6öç7B2öb²ÓÂÒ’°¢2æf–ÆÅ7G–ÆRÒr6ff#†s°¢2æ&Vv–åF‚‚“²2æ&2†÷&–v–âç‚²2¢Rç&–æu"Â÷&–v–âç’Ò"Â"ÂÂr“²2æf–ÆÂ‚“°¢Ð¢2ç6†F÷t&ÇW"Ò²2ç&W7F÷&R‚“°¢Ð¢òòW&—G’Â6†÷vã¢F†RÆö6²6†çBF–×22F†R7'—7FÂf–ÆÇ2—@¢–b†RæÆö6¶VBbbRçW&TÒâ’°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†ÒãR²RçW&TÒ¢ãC°¢2æf–ÆÅ7G–ÆRÒr6fffffbs²2ç6†F÷t6öÆ÷"Òr66fS†fbs²2ç6†F÷t&ÇW"Òƒ°¢2æf–ÆÅ&V7B†7‚ÒBÂ&6RÒRæ‚ÒÂ#‚¢6Æ×†RçW&TÒÂÂ’Â2“°¢2ç&W7F÷&R‚“°¢Ð§Ð¢òòD„R$ô$õB$BÂE$tââ†æv–æs¢föÆFVBv–æræVÇ2&÷VæBF†R&öG’Â†V@¢òòF÷vâÂöæR&VB÷F–2(	BöæRÖ÷&RF&²6†R–âF†R6V–Æ–ærVçF–Â—B6†—fW'2à¢òòfÇ––æs¢æwVÆ"ÖWFÂv–æw2fÆ–ærg&öÒF†R6†÷VÆFW"¦ö–çBâÆÂF‡0¢òòæBw&F–VçG2Â–âF†RÖ–æ–öâfÆÆ&6²7G–ÆS²WF†÷&VBÆFW2VWVVBà¦gVæ7F–öâG&t&B†2ÂR’°¢6öç7B7‚ÒRç‚²Rçrò"Â7’ÒRç’²Ræ‚ò#°¢6öç7B†ærÒRæ†æs°¢6öç7B6†—fW"Ò†ærbbRæ†öÆEBâòÖF‚ç6–â‚†Rææ–ÒÇÂ’¢C"’¢ãb¢²òò6–Ò6Æö6²ÂæWfW"F†RvÆÂw0¢6öç7BfÆÒÖF‚ç6–â†Rææ–Ò¢‚’¢†RæF—fUBâòã’¢ãb“°¢òòD„RUD„õ$TB$BŒ*s&B“¢f—fRÆFW2öâF†R6ÖR&VG2F†RfÆÆ&6²W6W2à¢òò†ær—2F†RöæÇ’öæRv—F‚—G2÷F–2F&³²6†—fW"&GFÆW2Ö&W"÷WBöbF†P¢òò6V×3²fÆ÷WöfÆöFâÇFW&æFRöâF†R7G&–FR6÷VçFW#²F—fR—2F†P¢òò7vWBÖ&6²'&÷v†VBâ†æv–ærÆFW2&RWF†÷&VB†VBÖF÷vâÂ6òF†W¢òòæ6†÷"g&öÒF†R6V–Æ–ær'’F†V—"÷VRF÷²fÆ–W'26VçG&RöâF†R&öG’à¢6öç7B&EÆFRÒ†ærò†Ræ†öÆEBâòv&E6†—fW"r¢v&D†ærr¢¢RæF—fUBâòv&DF—fRp¢¢„ÖF‚ç6–â†Rææ–Ò¢‚’âòv&DfÆWr¢v&DfÆFâr“°¢òòD„RdÄ”t…B•2d”ÄÔTB„%EõTUTR*s&62×f–’“¢öæRgVÆÂv–æv&VB–â6—€¢òòÖV7W&VBÖF—7F–æ7B6VÆÇ2ÂöâF†R6ÖR‚&B÷2&VBF†RGvòÆFW0¢òòÇFW&æFVBöâÂ6òæ÷F†–ær&÷WB—G2&‡—F†Ò6†ævW2(	BöæÇ’F†BF†Rv–æp¢òòæ÷r76W2D…$õTt‚F†R7G&ö¶R–ç7FVBöb§V×–ær&WGvVVâ—G2VæG2à¢òò6VÆÂ†V–v‡BÖF6†W2F†RÆFW2rG&vâv–æw7âƒã‚†—F&÷†W27&÷72’à¢–b‚†ærbb&EÆFRÓÒv&DF—fRr’°¢6öç7B6VÆÂÒÖF‚æfÆö÷"‚‚‚‚†Rææ–ÒÇÂ’¢‚’ò„ÖF‚å’¢"’’R²’R¢b“°¢6öç7B6‚ÒRæ‚¢ãƒS°¢–b‡G—VöbG&u7G&—6VÆÂÓÓÒvgVæ7F–öârbbG&u7G&—6VÆÂ†2Âv&DfÆ–v‡CbrÂ6VÆÂÂbÂ7‚Â7’²6‚ò"Â6‚ÂRçg‚â’’&WGW&ã°¢Ð¢6öç7B&D‚ÒRæ‚¢††æròã2¢&EÆFRÓÓÒv&DF—fRròãR¢ãsR“°¢6öç7B&D&6RÒ†æròRç’²&D‚¢7’²&D‚ò#°¢òòd4”ärU"ÄDS¢F†RfÆÆFW2vW&RWF†÷&VBf6–ærÄTeBæBF†RF—fP¢òòf6–ær$”t…BÂæBöæR6†&VBÖ—'&÷"'VÆRfÆWrF†RfÆ–ær&B&6·v&G0¢òò&WGvVVâWfW'’F—fP¢6öç7B&DfÆ—Ò†ærbb†&EÆFRÓÓÒv&DF—fRròRçg‚Â¢Rçg‚â“°¢–b‡G—VöbG&uÆFTæ6†÷&VBÓÓÒvgVæ7F–öârb`¢G&uÆFTæ6†÷&VB†2Â&EÆFRÂ7‚²6†—fW"Â&D&6RÂ&D‚Â&DfÆ—ÂG'VR’’&WGW&ã°¢2ç6fR‚“°¢2çG&ç6ÆFR†7‚²6†—fW"Â7’“°¢–b††ær’2ç66ÆRƒÂÓ“²òò†VBF÷vâÂfVWB–âF†R&ö6°¢òò&öG’(	BwVæÖWFÂFV&G&÷ ¢6öç7B&rÒ2æ7&VFTÆ–æV$w&F–VçBƒÂÓ’ÂÂ’“°¢&ræFD6öÆ÷%7F÷ƒÂr36CCSr“²&ræFD6öÆ÷%7F÷ƒÂr33#3&2r“°¢2æf–ÆÅ7G–ÆRÒ&s°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÂbãRÂ’ÂÂÂr“²2æf–ÆÂ‚“°¢òòv–æw2(	BföÆFVB6†VÆÇ2v†–ÆR†æv–ærÂæwVÆ"æVÇ2–âfÆ–v‡@¢2æf–ÆÅ7G–ÆRÒr3#C&S6s°¢2ç7G&ö¶U7G–ÆRÒr33“C3Fbs²2æÆ–æUv–GF‚Ò°¢f÷"†6öç7B2öb²ÓÂÒ’°¢2ç6fR‚“°¢–b††ær’°¢2çG&ç6ÆFR‡2¢BãRÂÓ“°¢2ç&÷FFR‡2¢ã‚²6†—fW"¢ãR¢2“°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFòƒÂÓr“²2çVG&F–47W'fUFò‡2¢rÂÓ"Â2¢RÂ‚“°¢2çVG&F–47W'fUFò‡2¢"ÂÂÂr“²2æ6Æ÷6UF‚‚“°¢2æf–ÆÂ‚“²2ç7G&ö¶R‚“°¢ÒVÇ6R°¢2çG&ç6ÆFR‡2¢RÂÓ2“°¢2ç&÷FFR‡2¢ƒãR²fÆ’“°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFòƒÂ“²2æÆ–æUFò‡2¢2ÂÓB“²2æÆ–æUFò‡2¢bÂ"“°¢2æÆ–æUFò‡2¢’Â2“²2æÆ–æUFò‡2¢"Â‚“²2æÆ–æUFò‡2¢2Âb“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“²2ç7G&ö¶R‚“°¢Ð¢2ç&W7F÷&R‚“°¢Ð¢òò6ÆrfVWBw&—–ærF†R&ö6²‡F†W’&VB2F†RGF6†ÖVçB¢–b††ær’°¢2ç7G&ö¶U7G–ÆRÒr3FScc2s²2æÆ–æUv–GF‚Òãc°¢f÷"†6öç7B2öb²ÓÂÒ’°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡2¢"Â‚“²2æÆ–æUFò‡2¢2ãBÂãR“²2ç7G&ö¶R‚“°¢Ð¢Ð¢òòF†R÷F–2(	BGVÆÂv†–ÆR—B6ÆVW2Â†÷BF‡&÷Vv‚F†R6†—fW"æBF†RF—fP¢6öç7B†÷BÒRæ†öÆEBâÇÂRæF—fUBâ°¢2æf–ÆÅ7G–ÆRÒ†÷Bòr6fcVcfBr¢r3v3SCs°¢–b††÷B’²2ç6†F÷t6öÆ÷"Òr6fcVcfBs²2ç6†F÷t&ÇW"Òƒ²Ð¢2æ&Vv–åF‚‚“²2æ&2ƒÂ†æròRãR¢ÓBãRÂ"ãÂÂr“²2æf–ÆÂ‚“°¢–b‚†ær’–ædW–TÖ&²†2ÂÂÓBãR“°¢2ç6†F÷t&ÇW"Ò°¢2ç&W7F÷&R‚“°§Ð¢òòUdU%’uT$D”âu2$TÂ$ôE’ÂäBD„R4„TUB•B%$•dU2”ââöæRF&ÆRÂ6†V6¶V@¢òòW"¶–æBâ–b¶–æB—2–â†W&R—B†2WF†÷&VB'BæB×W7BæWfW"&RG&vâ0¢òòç—F†–ærVÇ6R(	Bæ÷B2F†RG&–ÆÆW"—Bv2&÷F÷G—VBg&öÒÂæ÷B2æ÷F†W ¢òòwV&F–âv†÷6R6†VWB†Vç2Fò&R–âÖVÖ÷'’à¦6öç7B$õ55ô%BÒ°¢vÆ—F6ƒ¢v&V7E'G2rÂòòåTÄÄdär(	BF†RÆ–öà¢'&ööC¢vVvÆU'G2rÂòòDÄôä„õ5B(	BF†RVvÆP¢¦W&ó¢vvÆ6–W&U'G2rÂòòtÄ4”U$R(	BF†RVæ–6÷&à¢FÆ3¢vG&vöå'G2rÂòòeU$ä4R4„ô•"(	BF†RG&vöà¢&—6Ó¢w&—6Õ'G2rÂòò$•4Ò$õtÄU"(	BF†R6@¢Ö÷F†W#¢vÖ÷F†W%'G2rÂòòÔõD„U"Õb(	BF†RçVÆÂ6÷&P§Ó°¢òò—B—2F†W&S²—G2&öG’§W7B†2æ÷B6öÖR÷fW"F†Rv—&R–WBâF&²Ö72v—F‚¢òòÆ—fR&–ÒæBGvòW–W2&VG22'6öÖWF†–ærVæ÷&Ö÷W2Â–âF†RF&²ÂvF6†–ær"(	@¢òòv†–6‚—2F†R&–v‡BF†–ærFò&RÆöö¶–ærBf÷"F†R†Æb6V6öæBF†—2Æ7G2Âæ@¢òò—2†öæW7B–âv’F†B6†÷v–ærF†Rw&öær7&VGW&RæWfW"v2à¦gVæ7F–öâG&t&÷74†öÆB†2Â"’°¢6öç7BÒÅ´rç&ööÔFVbç¦öæUÓ°¢6öç7B7‚Ò"ç‚²"çrò"Â7’Ò"ç’²"æ‚ò#°¢6öç7BRÒãR²ÖF‚ç6–â‚†"ææ–ÒÇÂ’¢2’¢ãS°¢2ç6fR‚“°¢2æf–ÆÅ7G–ÆRÒw&v&ƒrÃÃbÃã“B’s°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†7‚Â7’Â"çr¢ãSbÂ"æ‚¢ãSbÂÂÂbã#ƒ3"“²2æf–ÆÂ‚“°¢2ævÆö&ÄÇ†Òã#"²R¢ã#ƒ²2ç7G&ö¶U7G–ÆRÒævÆ÷s²2æÆ–æUv–GF‚Ò"ãS²2ç7G&ö¶R‚“°¢2ævÆö&ÄÇ†ÒãCR²R¢ãSS²2æf–ÆÅ7G–ÆRÒævÆ÷s°¢f÷"†6öç7B2öb²ÓÂÒ’°¢2æ&Vv–åF‚‚“°¢2æVÆÆ—6R†7‚²2¢"çr¢ãRÂ7’Ò"æ‚¢ãbÂ2ãbÂ"ã2ÂÂÂbã#ƒ3"“°¢2æf–ÆÂ‚“°¢–ædW–TÖ&²†2Â7‚²2¢"çr¢ãRÂ7’Ò"æ‚¢ãb“°¢Ð¢2ç&W7F÷&R‚“°§Ð¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òò„õrÄôärt$ä”är„2Dò$Râæ÷BfVVÂfÇVR(	B6ö×WFVBöæS ¢òð¢òòFVÆÂÒ&V7F–öâF–ÖR²F–ÖRf÷"F†RFöFvRFò7GVÆÇ’6ÆV"²'VffW ¢òð¢òò6–×ÆRf—7VÂ&V7F–öâ—2ã#S×2f÷"âGVÇBæB#ƒÓ3S×2B‚Ó–V'0¢òòöÆC²6†ö÷6–ær&WGvVVâf÷W"÷76–&ÆRGF6·2—26Æ÷vW"7F–ÆÂâF†RF6‚æVVG0¢òòãƒ×2Fò6''’†W"÷WBöb7v—R&÷‚ÂæB$bÇW2F—7Æ’ÆFVæ7’VG0¢òòãS×2&Vf÷&R6†RWfW"6VW2F†Rg&ÖRâF†BWG2F†RfÆö÷"B†Æb6V6öæ@¢òòf÷"F†RÆ–W"F†—2vÖR—2'V–ÇBf÷"â†÷&æWBÂ–â†öÆÆ÷r¶æ–v‡BÂFVÆVw&‡0¢òò&WGvVVâãRæBãcb2(	BF†W6R&RF†R6ÖRçVÖ&W'2'&—fVBBGv–6Rà¦6öç7BDTÄÅõ5t•RÒãRÂDTÄÅôd5BÒã3RÂDTÄÅô„Te’Òãs°¢òòWfW'’7FFRv†÷6Rv†öÆR¦ö"—2Fò6’'F†—2—26öÖ–ær"âF†R7VRf—&W2v†Và¢òòF†R7FFR—2TåDU$TBÂ6VçG&ÆÇ’Â6òæWrGF6²6ææ÷B&Rw&—GFVâv—F†÷W@¢òòöæR(	Bv†–6‚—2W†7FÇ’†÷rF†RöÆB7v—RVæFVBWv—F‚—G26÷VæBöâF†R†—@¢òò–ç7FVBöböâF†Rv&æ–ærà¢òòD„R5DDRäÔR•2D„R4ôåE$5Bâç’&÷727FFRv†÷6RæÖRÖF6†W2F†—2f—&W0¢òòF†RFVÆÂ7VRW†7FÇ’öæ6RöâVçG'’Âv†–6‚—2†÷rF†RVF–ò6†ææVÂöbWfW'¢òòFVÆVw&‚–âF†RvÖRvWG2†æFÆVBv—F†÷WB&÷72WF†÷"†f–ærFò&VÖVÖ&W ¢òò—BâF†R6÷&öÆÆ'’—2F†RG&¢v–æB×W7FFRæÖVB6öÖWF†–ærF†BFöW2äõ@¢òòÖF6‚—26–ÆVçFÇ’ôäRÔ4„ääTÂFVÆVw&‚ÂæBæ÷F†–ærv&ç2–÷Rà¢òð¢òòw&ö"r—2†W&R&V6W6RöbW†7FÇ’F†BâåTÄÄdärw2&ö"÷Vç2v—F‚S×0¢òò–æ†ÆR(	B÷&"vF†W&–ær–âF†RF‡&öBÂFV'&—2Æ–gF–æröfbF†RfÆö÷"(	BæBF†Và¢òò6†÷fW2F†RÆ–W"7&÷72F†R&ööÒâF†R–æ†ÆR—2&VÂFVÆVw&‚æB—B†@¢òòæò6÷VæBöb—G2÷vã¢F†RöæÇ’VF–òv2&ö%ö&V7FÂv†–6‚Æ—2S×0¢òòÄDU"æB—2F†R†—BÂæ÷BF†Rv&æ–ærâöâF†RvÖRw2d•%5B&÷72Âv†÷6RVçF—&P¢òò¦ö"—2Fò&÷fRF†RFVÆVw&‚6öçG&7B—2&VÂ&Vf÷&Rç’ÆFW"f–v‡B6à¢òò&VÇ’öâF†RÆ–W"G'W7F–ær—Bà¢òòwföÆÆW’ræBv'&ööF6ÆÂr¦ö–æVB—Bf÷"F†R6ÖR&V6öâw&ö"rF–BÂf÷VæBF†P¢òò6ÖRv’öæR¦öæRÆFW#¢DÄôä„õ5B7VæG2“×2†VÆ–ær—G6VÆbFò6VçG&R×F÷ ¢òòv—F‚—G2v–æw2ÆöF–ær&Vf÷&R6WfVâÖfVF†W"fâÆVfW2ÂæBS×2v—F‚—G0¢òò†VBF‡&÷vâ&6²&Vf÷&RF†R67&VV6‚F†B6ÆÇ2F†R'&ööBâ&÷F‚&R&VÀ¢òòFVÆVw&‡2Â&÷F‚vW&Rf—7VÂÖöæÇ’ÂæBæV—F†W"—26ÆÆVBç—F†–ærÆ—7Bö`¢òòv–æB×W×6÷VæF–ærv÷&G2v÷VÆBWfW"†fR6öçF–æVBà¢òð¢òòv†–6‚—2F†R7GVÂÆW76öã¢ÆW†–6Â'VÆR6ææ÷Bf–æBF†W6RâFW7G2÷FVÆÇ2æ6§6 ¢òòæòÆöævW"wVW76W2g&öÒ7FFRæÖW2(	B—BvF6†W2f÷"7FFW2F†B6WBv–æEFÀ¢òò&V6W6R6WGF–ærv–æEB•2F†RVæv–æRFV6Æ&–ær$’Òv–æF–ærW"ÂæBç’7FFP¢òòF†BFV6Æ&W2F†BæBV&ç2æò7VR—2öæRÖ6†ææVÂFVÆVw&‚'’6öç7G'V7F–öâà¦6öç7BDTÄÅõ5BÒ÷v&çÆ6†&vWÆ7&÷V6‡Æ6ö–ÇÆÆö6·Ç&WÇ7–çÆvF†W'Ç&ö'ÇföÆÆW—Æ'&ööF6ÆÇÆf÷&vV&VÆÇÆ‡–Öâö“°¢òòôäR4ôÄõU"D„BÔTå2ôäRD„”ärâF†R‡VRÆrÇ&VG’6—27&–×6öâ—2–æfV7FV@¢òòæB7–â—26ÆVâ(	B'WBF†÷6RVæ6öFRt„õ4R6–FRF†–ær—2öâÂæBæ÷F†–ær–à¢òòF†RÆWGFRÖVçB'F†—2—2&÷WBFò†—B–÷R"âFVÆÂæVVG26†ææVÂöb—G0¢òò÷vâÂW6VB'’æ÷F†–ærVÇ6RÂF†Rv’7W†VBw2–æ²ÖVç2''–&ÆRWfW'—v†W&P¢òòv—F‚æòW†6WF–öç2âF†—2Ö&W"—2F†B6†ææVÂâ—B—2Ç6ò—&VBv—F‚Ö÷F–öà¢òòæB6÷VæB–âWfW'’W6RÂ&V6W6R&÷Vv†Ç’öæRÖâ–âGvVÇfR6ææ÷B&VÇ’öâ‡VRà¦6öç7BDTÄÅô4ôÂÒr6ff3#Fs°¦6öç7B%U%5EõdôÅE2Ò#S°¢òò†÷rFÆÂF†R6†&vR7F÷&Ò7FæG2ÂfVWBFòV"×F—2Â–âv÷&ÆBƒ¢F†RG&và¢òòÆFRÂæ÷BF†R3b‚6öÆÆ–FW"†ÖV7W&VBv–ç7BF†R–FÆRÆFR–â¦6öç7B4„$tUô$ôE•ô‚ÒSƒ°¢òòtÄ4”U$Ru2$U5B$TBÂ–âöæRÆ6R&V6W6R—Bv2w&öær–âf—fRà¢òð¢òòÖV7W&VB÷fW"GvVçG’Öf—fR6V6öæG2öb&VÂf–v‡C¢4•…E’ÕEtòU"4TåBöb†W ¢òò6×ÆW2vW&R–FÆVâWfW'’÷vW"VæFVBv—F‚F†—2ç7BÒv–FÆRs²F†—2çBÒ"ã ¢òò(	BGvò×6V6öæBW6RgFW"†Æb×6V6öæBFVÆVw&‚(	B6òF†Rf–v‡B6†P¢òò7GVÆÇ’&W6VçG2—2†÷fW&–ærVæ–6÷&âv—F–ærf÷"F–ÖW"ÂVæ7GVFVBâF†P¢òòFVÆÂ—2æ÷BF†R&ö&ÆVÒæBæWfW"v3²F†R6–ÆVæ6RgFW"—B—2à¢òð¢òò&W7B&VB†2¦ö#¢—B—2F†Rv–æF÷r–÷RGF6²–çFòâ—B†2Fò&RÆöæp¢òòVæ÷Vv‚Fò&Rv–æF÷ræB6†÷'BVæ÷Vv‚F†B–÷R&R7F–ÆÂ&V–ærf÷Vv‡Bà¢òò&÷Vv†Ç’öæR6V6öæBÂF–v‡FVæ–ær26†RÆ÷6W2Âv—F‚Æ—GFÆRf&–æ6R6òF†P¢òò&‡—F†Ò—2æ÷BÖWG&öæöÖR–÷R6â6WB–÷W"vF6‚'’à¦gVæ7F–öâvÆ5&W7B†"’²&WGW&â&÷75&W7B†"ÂãƒR“²Ð¢òòââææB—Bv2w&öærf÷"ÆÂ6—‚Âv†–6‚—2v‡’F†—2—2æ÷röæRgVæ7F–öâà¢òð¢òòÖV7W&VBv–ç7BÆ–W"v†òÔõdU2‡FW7G2ö&÷776Ræ6§2(	BF†RV&Æ–W"f–wW&W0¢òò6ÖRg&öÒ7FF–öæ'’F&vWBÂv†–6‚—2æ÷BF†Rf–v‡B’ÂF†R&÷7FW"7Vç@¢òò&WGvVVâSrRæBs2RöbWfW'’Væ6÷VçFW"–â–FÆVâeU$ä4R4„ô•"v2F†P¢òò6ÆV&W7B66RæBF†R6†R—2–FVçF–6Â–âÆÂöbF†VÓ¢†Æb×6V6öæ@¢òòFVÆVw&‚ÂâGF6²ÂæBF†VâD…$TR4T4ôäE2öbwV&F–â7FæF–ær7F–ÆÂà¢òòF†B—2æ÷BVæ—6‚v–æF÷râ—B—2VWVRà¢òð¢òò&W7B&VB†2öæR¦ö#¢&RF†Rv–æF÷rF†RÆ–W"GF6·2”åDòâÆöærVæ÷Vv€¢òòFòÆæBF†RF‡&VRÖ†—B6öÖ&ò(	B&÷WBãr2(	BæB6†÷'BVæ÷Vv‚F†BF†W’&P¢òò7F–ÆÂ&V–ærf÷Vv‡Bâ¶66ÆW2—Bf÷"÷vW"F†B†2V&æVBÆöævW ¢òò'&VFƒ¢&ööÒÖ6ÆV&–ær&—FRvWG2öæRÂ¦"FöW2æ÷Bà¦gVæ7F–öâ&÷75&W7B†"Â²’°¢òòãs"2—2F†RfÆö÷"Âæ÷BfVVÂfÇVS¢F†B—2v†B†W"F‡&VRÖ†—B6öÖ&ð¢òòF¶W2FòÆæBÂæBv–æF÷r6†÷'FW"F†âF†RVæ—6‚—BW†—7G2f÷"—2¢òòFV6Râ†6RGvòG&÷2VæFW"—BFVÆ–&W&FVÇ’(	B'’F†Vâ6†R—2W‡V7FVBFð¢òòF¶RF†Rf—'7BGvò†—G2æBÆVfRà¢6öç7B&6RÒ"ç†6RÓÓÒ"ò&æBƒãCRÂãc"’¢&æBƒãsBÂã“‚“°¢&WGW&â&6R¢†²ÇÂ“°§Ð¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòtÄ4”U$R”âD„R•"â6†RfÆ–W2(	B6†RFöW2æ÷BvÆ–FRöâÆW'âÆW' ¢òòF÷v&BF&vWB&V6†W2—G2F÷7VVBöâF†Rf—'7Bg&ÖRæBV6W2f÷&WfW"À¢òò6ò6†R&VB27W'6÷"&V–ærG&vvVC¢æòÆVæ6‚Âæò'&¶RÂæòvV–v‡BâF†—0¢òò—2'&—fR7FVW&–æs¢F†RfVÆö6—G’6†RtåE2ö–çG2BF†RF&vWBæB6‡&–æ·0¢òò26†RvWG2F†W&RÂæBF†RfVÆö6—G’6†R„2Ö’öæÇ’6†ævR'’66W ¢òò6V6öæB(	B6ò6†R66VÆW&FW2÷WBÂ7'V—6W2ÂæB'&¶W2–ââF†R&æ²æBF†P¢òòÆVâföÆÆ÷rg&öÒfVÆö6—G’F†B—2æ÷r&VÂ‡F†RvV–v‡B72–âWFFR‚’À¢òòæBF†R&öÆÂ–â§2övÆ6–W&Ræ§2’ÂæBWfW'—F†–ær—2GB×66ÆVBà¦6öç7BtÄ5ô5%T•4RÒC#ÂtÄ5ô44TÂÒS°¦gVæ7F–öâvÆ4fÇ’†"ÂG‚ÂG’ÂfÖ‚Â62ÂGBÂv–â’°¢6öç7BrÒv–âÇÂ2ã#°¢ÆWBw‚Ò‡G‚Ò"æ7‚‚’’¢rÂw’Ò‡G’Ò"ç’’¢s°¢6öç7BvÒÒÖF‚æ‡—÷B‡w‚Âw’“°¢–b‡vÒâfÖ‚’²w‚£ÒfÖ‚òvÓ²w’£ÒfÖ‚òvÓ²Ð¢ÆWB‚Òw‚Ò†"çg‚ÇÂ’Â’Òw’Ò†"çg’ÇÂ“°¢6öç7BÒÒÖF‚æ‡—÷B†‚Â’’Â6Ò62¢GC°¢–b†Òâ6’²‚£Ò6òÓ²’£Ò6òÓ²Ð¢"çg‚Ò†"çg‚ÇÂ’²ƒ²"çg’Ò†"çg’ÇÂ’²“°§Ð¢òò†VÆBv–æB×WvÆ–FW2Fò7F÷&F†W"F†â7F÷–ærFVB(	BF†RFVÆÂ—0¢òò7F–ÆÂ7F–ÆÆæW72Â—B§W7B'&—fW2Æ–¶RöæP¦gVæ7F–öâvÆ4'&¶R†"Â²ÂGB’²6öç7BbÒÖF‚æW‡‚Ö²¢GB“²"çg‚£Òc²"çg’£Òc²Ð¢òò†÷rÆöær6†R„ôÄE2B†—GF–ær†V–v‡BgFW"V6‚÷vW"Â·†6RÂ†6R%Òà¢òòãbÓã2—2F†RÆâw2&æC¢öæR6ÆVâF‡&VRÖ†—B6öÖ&ò—2ãs"2Â6òF†P¢òò6†÷'BVæB—2&öæR6öÖ&òæBÆVfR"æBF†RÆöærVæB—2&W6W'fVBf÷"F†P¢òò÷vW'2F†B6¶VBF†RÖ÷7BöbF†RÆ–W"Fò7W'f—fR‡F†Ræ÷f–÷R7&÷vFV@¢òò†W"–çFòÂF†R‡W6‚’â†6RGvòF–v‡FVç2WfW'’öæR(	BF÷v&BöæR†—BÂæWfW ¢òò&VÆ÷r—B†&÷72Ö÷Væ–æw2*s’à¦6öç7BtÄ5ô„ôÄBÒ°¢Ææ6S¢³ã‚ÂãuÒÂ6†&C¢³ã‚ÂãuÒÂF6ƒ¢³ã‚ÂãcUÒÂ&—6öã¢³ãsRÂãcUÒÀ¢÷&'3¢³ã“RÂãsUÒÂæ÷f¢³ã’ÂãsUÒÂ£¢³ãÂãƒUÒÂF3¢³ãcRÂãcUÒÀ§Ó°¦gVæ7F–öâvÆ5&V6÷fW"†"Â†öÆB’°¢6öç7B2Ò&÷75&V57÷B†"“°¢"ç7BÒw&V6÷fW"s²"çBÒ†öÆC²"ç&V5‚Ò2çƒ²"ç&V5’Ò2ç“²"ç&V4Æ÷rÒfÇ6S²"ç&V56–æ²Òãc°§Ð¢òòWfW'’÷vW"w2v–æB×WÂ–âöæRÆ6RÂ6ò6†–æVB÷vW"—2FöÆBW†7FÇ’0¢òògVÆÇ’2G&vâöæR(	B6†–âÖ’FBÆ–æ²ÂæWfW"6†÷'FVâFVÆÀ¦gVæ7F–öâvÆ467B†"Â×bÂ‚Â’’°¢–b†×bÓÓÒvÆæ6Rr’²"ç7BÒvÆæ6Wv&âs²"çBÒãs²"çv–æEBÒãS²6g‚‚v67F–6Rr“²Ð¢VÇ6R–b†×bÓÓÒw6†&Br’²"ç7BÒw6†&Gv&âs²"çBÒãS²"çv–æEBÒãC²6g‚‚v67F–6Rr“²Ð¢VÇ6R–b†×bÓÓÒvF6‚r’²"ç7BÒvF6‡v&âs²"çBÒãSS²"çv–æEBÒãS²"æF6„ærÒæã²6g‚‚vF6‚r“²Ð¢VÇ6R–b†×bÓÓÒv÷&'2r’²"ç7BÒv÷&'2s²"çBÒã²"çv–æEBÒãS²6g‚‚v67F–6Rr“²Ð¢VÇ6R°¢òòD„R$•4ôâtUE2•E2õtâ5DDRâ—BW6VBFò&R67Bg&öÒ–ç6–FR–FÆVÀ¢òòv†–6‚ÖFR–FÆR—G6VÆböæRÖ6†ææVÂv–æB×W¢æòv’FòÆöö²B¢òò†÷fW&–ærwV&F–âæB¶æ÷r6vR—26öÖ–ærà¢"ç7BÒw&—6öçv&âs²"çBÒãS²"çv–æEBÒãS²"ç&—6öä–ÒÒ²ƒ¢‚Â“¢’Ó²6g‚‚w&—6öâr“°¢Ð§Ð¢òòDÄôä„õ5Bu2t”äDõu2âWfW'’Ö÷fRVæG2Æ÷ræ÷s¢F†Rfâw2&V6ö–ÂÂF†R7vö÷w0¢òòVÆÂ×WæBF†R67&VV6‚w27VçBv–æw2V6‚WB†W"–â6Ær&ævRf÷"&V@¢òò&Vf÷&R6†R6Æ–Ö'2&6²FòF†R6&ÆRâ6†÷'B(	BF†R$U5B&VB—27F–ÆÂF†R&–p¢òòöæRæBF†Rf–v‡Bw2–FVçF—G’(	B'WB&W6VçBgFW"WfW'—F†–ær†&÷72Ö÷Væ–æw0¢òò*s2Â'Vær¢¦öæR"—2v†W&R÷Væ–æw2&R7F–ÆÂö'f–÷W2’à¦6öç7B%$ôôEô„ôÄBÒ²föÆÆW“¢³ãbÂãUÒÂ7vö÷¢³ãSRÂãCUÒÂ6ÆÃ¢³ãrÂãSUÒÓ°¦gVæ7F–öâ'&ööE&V6÷fW"†"Â†öÆB’°¢6öç7B2Ò&÷75&V57÷B†"“°¢"ç7BÒw&V6÷fW"s²"çBÒ†öÆC²"ç&V5‚Ò2çƒ²"ç&V5’Ò2ç“²"ç&V56–æ²Òãs°§Ð¢òòeU$ä4R4„ô•"u2t”äDõu2„eU$åõ$T2ÂgW&å&V6÷fW"’Æ—fRv—F‚†—2Ö6†–æR–à¢òò§2ögW&æ6RÖf–v‡Bæ§2à¢òòÔõD„U"Õbu2t”äDõu3¢F†R†öÆBBF†RÆ–W"w2ÆWfVÂgFW"V6‚Ö÷fRÂ·Â%Òà¢òòF†RÆ7Bf–v‡B—2F†RF–v‡FW7B(	BF†W6R6—BBF†RÖ–æ–ÖÂVæBöbF†P¢òòFö7G&–æR†öæR†—BÂF÷v&BGvò’ÂæB†W"†—BÖw&÷W'&V²æBF†R6öærw0¢òò7FvvW"&Rv†W&RF†R&–vvW"v–æF÷w2Æ—fRà¦6öç7BÔõD„U%ô„ôÄBÒ²vfS¢³ãrÂãSUÒÂ&–æs¢³ãbÂãUÒÂ&VÓ¢³ãSRÂãCUÒÂw&#¢³ãbÂãUÒÓ°¦gVæ7F–öâÖ÷F†W%&V6÷fW"†"Â×b’°¢6öç7B2Ò&÷75&V57÷B†"“°¢"ç7BÒw&V6÷fW"s²"ç&V5BÒÔõD„U%ô„ôÄE¶×eÕ¶"ç†6RÓÓÒ"ò¢Ó°¢"ç&V5‚Ò2çƒ²"ç&V5’Ò2ç“²"ç&V56–æ²Òãƒ°§Ð¢òòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòD„RDTÕÄDRUdU%’uT$D”âäõr4„$U2ƒ##bÓÓ‚ÂF†R†öÆÆ÷r¶æ–v‡B7GVG’À¢òòÆâ*s2“¢v&æ–ærÓâGF6²ÓâTä•4‚t”äDõrÂ†—BÖw&÷W'&V²ÂæBÖ÷fP¢òò6†÷6Vâg&öÒv†W&R6†R—27FæF–ær&F†W"F†âg&öÒ6÷VçFW"âF†R–V6W0¢òòF†B&RF†R6ÖRf÷"ÆÂöbF†VÒÆ—fR†W&RÂöæ6Rà¢òð¢òò„õr„”t‚dÄ”U"„äu2t„”ÄR•B•2õTââf÷'G’—†VÇ2&WGvVVâ—G2fVWBæ@¢òò†W'2—26†÷6Vâg&öÒ&÷F‚6–FW2öbF†R&—F†ÖWF–3¢†W"f÷'v&B7v–ær&V6†W0¢òòSB‚&÷fR†W"÷vâfVWB††—F&÷‚‚“¢6VçG&RBÖ–BÖ&öG’Â†ÆbÖ†V–v‡B3b’Â6ð¢òò‡W'F&÷‚v†÷6R&÷GFöÒ—2C‚WF¶W2Æ–âw&÷VæFVB7G&–¶S²æB6†P¢òò—23b‚FÆÂÂ6ò&öG’v†÷6RVæFW'6–FR—2C‚W6ÆV'2†W"†VBæB6†P¢òò6âvÆ²VæFW"—Bv—F†÷WBvV&–ær6öçF7BFÖvRâÆ÷vW"æBF†Rv–æF÷r6÷7G0¢òò†W"†—BFò7FæB–ã²†–v†W"æB—BæVVG2§V×Âv†–6‚—2v†BtÄ4”U$Rw0¢òòs"Óƒ2‚†÷fW"Ç&VG’6¶VBöb†W"æBv†BF†R&V6÷fW'’W†—7G2Fòf—‚à¦6öç7B$õ55õ$T5ôÄ”eBÒC°¢òòF†RwV&F–ç2F†B†ær–âF†R—"&F†W"F†â7FæBöâF†RfÆö÷ ¦6öç7B$õ55ôdÄ”U2Ò²'&ööC¢Â¦W&ó¢ÂÖ÷F†W#¢Ó°¢òòD„RDT4²‚æ6ÆVFR÷6¶–ÆÇ2ö&÷72×GFW&ç2*s’âvV–v‡G2ÂæWfW"F–6R7&÷72F†P¢òòv†öÆRÖ÷fW6WBÂæB$T4Tä5’DT%C¢F†RÆ7BGvòÖ÷fW2G&vâ&Rv÷'F‚†Æbf÷ ¢òòF†RæW‡BG&rÂv†–6‚¶–ÆÇ2F†RF÷V&ÆRÖÇVævRfVVÂÖ&Bv—F†÷WBf÷&&–FF–ær—Bà¢òòFV6¶—2µ¶Ö÷fRÂvV–v‡EÒÂââåÓ²vV–v‡Böb&VÖ÷fW2Ö÷fRF†—2G&rà¦gVæ7F–öâ&÷74G&r†"ÂFV6²’°¢6öç7BÆ7BÒ"æFV6´Æ7BÇÂ†"æFV6´Æ7BÒµÒ“°¢ÆWBF÷BÒ°¢f÷"†6öç7BBöbFV6²’²E³%ÒÒE³ÒâòE³Ò¢†Æ7Bæ–æFW„öb†E³Ò’ãÒòãR¢’¢²F÷B³ÒE³%Ó²Ð¢ÆWB–6²ÒçVÆÂÂ"Ò&æBƒÂF÷B“°¢f÷"†6öç7BBöbFV6²’²–b†E³%ÒÃÒ’6öçF–çVS²–6²ÒE³Ó²"ÓÒE³%Ó²–b‡"ÃÒ’'&V³²Ð¢Æ7BçVç6†–gB‡–6²“²–b†Æ7BæÆVæwF‚â"’Æ7BæÆVæwF‚Ò#°¢&WGW&â–6³°§Ð¢òòt„U$RdÄ”U"4”äµ2Dòt„Tâ•B•25TåC¢&W6–FR†W"ÂB†W"ÆWfVÂÂæWfW"öà¢òòF÷öb†W"âF†RÆWfVÂ—2„U"w&÷VæB†ÆVFvR–b6†R—27FæF–æröâöæR“²F†P¢òò6–FR—2v†–6†WfW"¶VW2&öG’×v–GF‚vg&öÒ†W"æB7F–ÆÂf—G2F†R&ööÒÀ¢òò6òF†Rv–æF÷ræWfW"÷Vç2'’G&÷–ærwV&F–âöçFòF†RÆ–W"à¦gVæ7F–öâ&÷75&V57÷B†"ÂÆ–gB’°¢6öç7BrÒrç&ööÔFVbçr¢D”ÄRÂfÆö÷"Ò„rç&ööÔFVbæ‚Ò"’¢D”ÄS°¢6öç7B7‚ÒÆ–W"ç‚²Æ–W"çrò#°¢6öç7Bw&÷VæBÒÆ–W"æöâòÖF‚æÖ–â†fÆö÷"ÂÆ–W"ç’²Æ–W"æ‚’¢fÆö÷#°¢6öç7BvÒ"çrò"²Æ–W"çrò"²#c°¢ÆWB‚Ò"æ7‚‚“°¢–b„ÖF‚æ'2‡‚Ò7‚’Âv’°¢6öç7B3ÒÖF‚ç6–vâ‡‚Ò7‚’ÇÂÒ†"æf6RÇÂ“°¢6öç7BÆòÒ"çrò"²bÂ†’ÒrÒ"çrò"Òc°¢6öç7BÒ7‚²3¢vÂ2Ò7‚Ò3¢v°¢‚Ò†ãÒÆòbbÃÒ†’’ò¢†2ãÒÆòbb2ÃÒ†’’ò2¢6Æ×†ÂÆòÂ†’“°¢Ð¢&WGW&â²‚Â“¢w&÷VæBÒ†Æ–gBÓÒçVÆÂò$õ55õ$T5ôÄ”eB¢Æ–gB’Ò"æ‚Ó°§Ð¢òòââææBF†RÆWfVÂ—2„U"ÆWfVÂf÷"F†Rv†öÆR&V6÷fW'’Âæ÷BF†RÆWfVÂ6†P¢òò7FööBBv†Vâ—B&Vvã¢F†Rw&÷VæB–âF†W6R&öö×2&öÆÇ2‡F†RFW'&–â7W'fP¢òòÆ–gG2F†RfÆö÷"Ó#‚–âÆ6W2’ÂæBF&vWBf—†VBBF†R7F'BöbF†P¢òò6–æ²ÆVfW2F†Rv–æF÷r÷WBöb&V6‚F†RÖöÖVçB6†R7FW2öfbF†RÖ÷Væ@¦gVæ7F–öâ&÷75&V5G&6²†"ÂÆ–gB’°¢–b‚Æ–W"æöâÇÂÆ–W"æFVB’&WGW&ã°¢6öç7BfÆö÷"Ò„rç&ööÔFVbæ‚Ò"’¢D”ÄS°¢"ç&V5’ÒÖF‚æÖ–â†fÆö÷"ÂÆ–W"ç’²Æ–W"æ‚’Ò†Æ–gBÓÒçVÆÂò$õ55õ$T5ôÄ”eB¢Æ–gB’Ò"æƒ°§Ð¢òòD„R„•BÔu$õU%$T²Âf÷"WfW'’wV&F–âF†B—2æ÷BåTÄÄdär‡v†÷6R'&V²—0¢òòw&—GFVâ–çFò—G2÷vâÖ6†–æRÂv†W&R—Bv2FVv‡Bf—'7B’âFVÄFÖr&—6W0¢òòF¦U&W²—B—2D´Tâ†W&RÂæBöæÇ’÷WBöb7FFRF†RwV&F–â—2æ÷@¢òò6öÖÖ—GFVBFò(	B6†&vR7WBöfbÖ–BÖÆ–æRÂ÷"ÖVÇFF÷vâF†BæWfW"÷W'2À¢òòv÷VÆB&RF†R'&V²FVÆWF–ærÖ÷fR&F†W"F†â÷Væ–ærv–æF÷râ&WVW7@¢òòF†B'&—fW2GW&–ær6öÖÖ—GFVB7FFRv—G2f÷"—BFòVæBà¢òð¢òòGW&—2F†Rv–æF÷r‡†6RöæRÂ†6RGvó¢F†R6ÖR&VBÂ6ÖÆÆW"&—¦R’À¢òò6F†÷rÆöær&Vf÷&R—B6â'&V²v–â6òf7BÆ–W"6ææ÷B†öÆB—@¢òòF÷vâÂgFW&F†R7FFR—BvWG2W–çFòâfÆ–W'2fÆÃ¢&w&÷VæFVBæB÷Vâ ¢òò—2F†Rö–çBöbF†R'&V²ÂæBfÆöF–ær7FvvW"—2v–æF÷r–÷R6ææ÷@¢òò&V6‚(	Bv†–6‚—2F†R6ö×Æ–çBF†—2v†öÆR72—2ç7vW&–ærà¦6öç7B%$Tµô´•BÒ°¢'&ööC¢²GW#¢³ãrÂã3UÒÂ6C¢³bÂrãUÒÂfÇ“¢G'VRÂgFW#¢w&—6RrÂ6öÃ¢r3†fC†fbrÀ¢'W7“¢²7vö÷¢Â6f7&6ƒ¢Â6ffÆö÷#¢ÒÒÀ¢FÆ3¢²GW#¢³ãbÂã5ÒÂ6C¢³bÂrãUÒÂfÇ“¢fÇ6RÂgFW#¢v–FÆRrÂ6öÃ¢r6ff#crÀ¢'W7“¢²ÖVÇGv&ã¢ÂfVçGv&ã¢ÂfVçC¢Â&—6S¢ÂG&÷Æö6³¢ÂF—fS¢ÒÒÀ¢¦W&ó¢²GW#¢³ã‚ÂãUÒÂ6C¢³bÂrãUÒÂfÇ“¢G'VRÂgFW#¢v–FÆRrÂ6öÃ¢r6VC†fbrÀ¢'W7“¢²F6ƒ¢ÂF667C¢ÒÒÀ¢&—6Ó¢²GW#¢³ãRÂã%ÒÂ6C¢³RãRÂuÒÂfÇ“¢fÇ6RÂgFW#¢w&W7BrÂ6öÃ¢r33vffCrÀ¢'W7“¢²F6‡6Æ6ƒ¢Â÷Væ6S¢ÂÇ7fæ—6ƒ¢Â&77–ã¢Â&77F÷&Ó¢ÒÒÀ¢Ö÷F†W#¢²GW#¢³ãrÂã3UÒÂ6C¢³rÂ‚ãUÒÂfÇ“¢G'VRÂgFW#¢v–FÆRrÂ6öÃ¢r6#C†6fbrÀ¢'W7“¢²×6öæs¢ÂFçVÆÃ¢Âw&#¢ÒÒÀ§Ó°¢òò&WGW&ç2G'VRv†–ÆRF†R'&V²÷vç2F†Rg&ÖR‡F†RwV&F–âw2÷vâÖ6†–æR—0¢òò6¶—VB’ÂfÇ6R÷F†W'v—6P¦gVæ7F–öâwV&D'&V²†"ÂGB’°¢6öç7B²Ò%$Tµô´•E¶"æ¶–æEÓ°¢–b‚²ÇÂ"æF¦TB’&WGW&âfÇ6S°¢–b‚†"æF¦Uv–âÇÂ’â’"æF¦Uv–âÓÒGC°¢–b‚†"æF¦T4BÇÂ’â’"æF¦T4BÓÒGC°¢6öç7B"Ò"ç†6RÓÓÒ"ò¢°¢–b†"æF¦U&Wbb"ç7BÓÒvF¦Rrbb²æ'W7•¶"ç7EÒ’°¢"æF¦U&WÒfÇ6S°¢"ç7BÒvF¦Rs²"æF¦TGW"Ò²æGW%·%Ó²"çBÒ"æF¦TGW#°¢"çg‚Ò²–b‚²æfÇ’’"çg’ÒÖF‚æÖ‚ƒÂ"çg’ÇÂ“²VÇ6R"çg’Ò°¢"çv–æEBÒ²"æ6†–âÒçVÆÃ°¢òòt„B•Bt2„ôÄD”ärE$õ2t•D‚•BâF†RwV&F–âw2÷vâÖ6†–æR—0¢òò6¶—VBf÷"F†RÆVæwF‚öbF†R'&V²Â6òç—F†–ær—Bv26''––ærv÷VÆ@¢òò÷F†W'v—6R†ærg&÷¦Vâ–âF†R—"(	B&VÒF†B7F—2G&vâæBFöW2æ÷@¢òòf—&RÂ&–ær7F÷VBÖ–BÖW‡ç6–öââF†R'&V²6†GFW'2F†VÒ–ç7FVBÀ¢òòv†–6‚—2Ç6òF†RÖ÷7BÆVv–&ÆR&Wv&BF†W&R—2f÷"†f–ær6W6VB—Bà¢6öç7B7‚Ò"æ7‚‚’Â7’Ò"æ7’‚“°¢–b†"æ¶–æBÓÓÒw¦W&òr’°¢–b†"æ÷&'2’f÷"†6öç7Bö"öb"æ÷&'2’'W'7B†ö"ç‚Âö"ç’Â‚Âr6C#F&fbrÂcÂãBÂÂ"ãRÂG'VR“°¢"æ÷&'2ÒçVÆÃ²"ææ÷fÒçVÆÃ²"æ¥"Ò²"æÖ&·2æÆVæwF‚Ò²"æ–6UG&–ÂÒçVÆÃ²"ævÆ56†&EÒçVÆÃ°¢ÒVÇ6R–b†"æ¶–æBÓÓÒvÖ÷F†W"r’°¢"æ&VÒÒçVÆÃ²"æÆ6‚ÒçVÆÃ²"æçvfRÒçVÆÃ°¢ÒVÇ6R–b†"æ¶–æBÓÓÒv'&ööBr’°¢"æfVÒçVÆÃ°¢Ð¢6g‚‚w†6Rr“²6g‚‚v&÷76†—Br“°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂ‚“°¢ræ†—E7F÷ÒÖF‚æÖ‚„ræ†—E7F÷Âã“°¢'W'7B†7‚Â7’Â#bÂ²æ6öÂÂ3CÂãrÂ#cÂBÂG'VR“°¢–b‡G—Vöb&ö%vfRÓÓÒvgVæ7F–öâr’&ö%vfR†7‚Â7’Â²æ6öÂ“°¢–b‡G—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr’E'VÖ&ÆRƒãsRÂãbÂ##“°¢rçFö7B‡B‚vvEö÷Vâr’“°¢Ð¢–b†"ç7BÓÒvF¦Rr’&WGW&âfÇ6S°¢"çBÓÒGC°¢òòF†RfÆö÷"—2F†R&Væw2F–ÆRfÆö÷"ÂÆ–gFVBv†W&RF†RFW'&–â7W'fR†0¢òò&VÂÖFW&–Â÷fW"—B†w&÷VæD6öÇVÖäB’(	B'&ö¶VâfÆ–W"ÆæG2ôâF†P¢òòG&vâw&÷VæBÂæ÷B–ç6–FRÖ÷VæBöb—@¢ÆWBfÆö÷%’Ò„rç&ööÔFVbæ‚Ò"’¢D”ÄS°¢6öç7Bv2ÒG—Vöbw&÷VæD6öÇVÖäBÓÓÒvgVæ7F–öâròw&÷VæD6öÇVÖäB†"æ7‚‚’’¢çVÆÃ°¢–b†v2bbv5³ÒãÒfÆö÷%’Òbbv5³ÒÂfÆö÷%’bbv5³ÒâfÆö÷%’Òc’fÆö÷%’Òv5³Ó°¢fÆö÷%’ÓÒ"æƒ°¢–b„²æfÇ’’°¢òò—BdÄÅ2(	B÷WBöbF†R—"æBöçFòF†RfÆö÷"Âv†W&R6†R6â&V6‚—@¢"çg‚Ò°¢–b†"ç’ÂfÆö÷%’’°¢"çg’ÒÖF‚æÖ–âƒ“Â†"çg’ÇÂ’²“¢GB“°¢"ç’ÒÖF‚æÖ–â†fÆö÷%’Â"ç’²"çg’¢GB“°¢–b†"ç’ãÒfÆö÷%’’°¢"çg’Ò²6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂb“²6g‚‚vÆæBr“°¢f÷"†ÆWB’Ò²’Â²’²²¢FE'B†"æ7‚‚’²&æB‚Ö"çr¢ãRÂ"çr¢ãR’Â"ç’²"æ‚Ò2Â&æB‚ÓcÂc’Â&æB‚ÓSÂÓ3’À¢&æBƒã3RÂãSR’Â²æ6öÂÂ&æBƒ"ãRÂ2ãR’Â#cÂG'VR“°¢Ð¢ÒVÇ6R²"ç’ÒfÆö÷%“²"çg’Ò²Ð¢ÒVÇ6R°¢"çg‚Ò²"çg’³Ò#¢GC°¢Ö÷fTVçB†"ÂGB“°¢Ð¢–b†"çBÃÒ’°¢"ç7BÒ²ægFW#°¢"çBÒ²ægFW"ÓÓÒw&—6Rròã"¢²ægFW"ÓÓÒw&W7Bròã3R¢&÷75&W7B†"Âãb“°¢"æF¦T4BÒ²æ6E·%Ó²"æF¦T†—G2Ò²"æF¦Uv–âÒ°¢Ð¢&WGW&âG'VS°§Ð¢òòåTÄÄdärÄäE2t„U$R4„R•2ÂäUdU"ôâD„ReU$ä•EU$R$U4”DR„U"âF†RÆV@¢òòÆæF–ær7÷B—2ö–çC²F†RÆ–öâ—2ƒB‚öb&öG’&÷VæB—BÂæBBVæG2öà¢òòGvò×F–ÆR‡VÆ²âÆV–ÖVBBÆ–W"7FæF–ærBF†R‡VÆ²w2fö÷B6ÖP¢òòF÷vâöâF÷öb—B(	Bs‚&÷fR†W"Â÷WBöbw&÷VæFVB7G&–¶Rw2&V6‚Âf÷ ¢òòF†Rv†öÆRÆæF–ær6WGFÆR‡FW7G2ö÷Væ–æw2æ6§3¢÷Væ6Sç&V6÷fW"Âv÷'7B×2’à¢òò6òF†R7÷B6Æ–FW2&6²ÆöærF†RÆVÂ†ÆbF–ÆRBF–ÖRÂVçF–ÂF†P¢òò&öG’w2fö÷G&–çB—26ÆV"öb6öÆ–BF–ÆR÷fW"F†RGvò&÷w2&÷fR†W"fÆö÷"à¦gVæ7F–öâ&÷74ÆæD6ÆV"†"Â‚ÂfVWE’’°¢6öç7B'’ÒÖF‚æfÆö÷"†fVWE’òD”ÄR’Ò°¢6öç7B6ÆV$BÒ7‚Óâ°¢6öç7BCÒÖF‚æfÆö÷"‚†7‚Ò"çrò"’òD”ÄR’ÂCÒÖF‚æfÆö÷"‚†7‚²"çrò"Ò’òD”ÄR“°¢f÷"†ÆWBG‚ÒC²G‚ÃÒC²G‚²²¢–b‡6öÆ–DB‡G‚Â'’’ÇÂ6öÆ–DB‡G‚Â'’Ò’’&WGW&âfÇ6S°¢&WGW&âG'VS°¢Ó°¢–b†6ÆV$B‡‚’’&WGW&âƒ°¢6öç7B&6²ÒÖF‚ç6–vâ†"æ7‚‚’Ò‚’ÇÂÒ†"æf6RÇÂ“°¢f÷"†ÆWB²Ò²²ÃÒ#²²²²’°¢6öç7Bç‚Ò‚²&6²¢²¢D”ÄRò#°¢–b†6ÆV$B†ç‚’’&WGW&âçƒ°¢Ð¢&WGW&âƒ°§Ð¦6Æ72&÷72°¢òòt„”4‚ôbD„RD…$TRt$ä”äu2D„•2uT$D”âÔ´U2à¢òð¢òòF†Rv&æ–ær—2öæR6÷VæBBF‡&VR6—¦W2ÂæBF†R6—¦R†2FòG&6²F†P¢òòF†–ærÖ¶–ær—B÷"F†RF‡&VR6—¦W2&RFV6÷&F–öââ—B6†—VBf÷"öæP¢òò'V–ÆBv—&VBFòwFVÆÆ&–rrf÷"WfW'’&÷72Âv†–6‚ÖVçB'&ööBv7æ@¢òòÔõD„U"ÕbÖFRF†R–FVçF–6ÂBã3b×vV–v‡Bæö—6RæBF†RÆ–W"ÆV&æV@¢òòæ÷F†–ærg&öÒ†V&–ær—Bà¢òð¢òòfö÷G&–çB—2F†R&VBÂ&V6W6Rfö÷G&–çB—2v†BF†RÆ–W"4TU26öÖ–æs ¢òò$•4Ò—26ÖÆÂæBV–6²æBvWG2F†RÆ–v‡BFVÆÂ†÷vWfW"×V6‚…—B†2À¢òòÔõD„U"ÕbB#ƒ#—2Ö÷&RF†âF÷V&ÆRç—F†–ærVÇ6RæBvWG2F†P¢òò†Vf–W7Bâ¶–ævFöÒ6W76–öâ6â÷fW'&–FRW"&÷72v—F‚FVÆÃ¦–â%5D@¢òò&F†W"F†âf–v‡BF†RF‡&W6†öÆG2à¢FVÆÄ7VR‚’°¢òò•E2õtâdô”4Rd•%5B†÷væW"Â##bÓ‚Ó#C¢V6‚wV&F–âvWG2—G2÷vâFVÆÂÀ¢òò4õTäEô$”$ÄR*s’âF†RvW7GW&R—26†&VB(	B&—6–ær—"Â&V6W6R&—6P¢òòVæ6öFW2F–ÖR&VÖ–æ–ær(	BæBöæÇ’F†R–ç7G'VÖVçB—2F†R7&VGW&Rw2Â6ð¢òòF†R7VR7F—2ÆV&æ&ÆRv†–ÆR6––ært„”4‚F†–ær—2&÷WBFòÖ÷fRà¢–b‡G—VöbDTÄÅõdô”4RÓÒwVæFVf–æVBrbbDTÄÅõdô”4U·F†—2æ¶–æEÒ’&WGW&âwFVÆÅòr²F†—2æ¶–æC°¢òòââææBwV&F–âv—F‚æòfö–6Röb—G2÷vâ—2æWfW"6–ÆVçC¢—BfÆÇ2&6°¢òòFòF†RvV–v‡B—G2÷vâfö÷G&–çBV&ç2Âv†–6‚—2v†BF†RÆ–W"6VW0¢òò6öÖ–ærâ$•4Ò—26ÖÆÂæBV–6²æBF¶W2F†RÆ–v‡BFVÆÂv†FWfW"—G0¢òò…²ÔõD„U"ÕbB#ƒ#F¶W2F†R†Vf–W7Bà¢6öç7B7BÒ%5DE·F†—2æ¶–æEÓ°¢–b‡7Bbb7BçFVÆÂ’&WGW&â7BçFVÆÃ°¢6öç7B&VÒF†—2çr¢F†—2æƒ°¢&WGW&â&VãÒ“òwFVÆÆ&–rr¢&VãÒCƒòwFVÆÆÖ–Br¢wFVÆÂs°¢Ð¢6öç7G'V7F÷"†¶–æBÂ‚Â’’°¢6öç7B2Ò%5DE¶¶–æEÓ°¢F†—2æ¶–æBÒ¶–æC²F†—2çrÒ2çs²F†—2æ‚Ò2æƒ°¢F†—2ç‚Ò‚Ò2çrò#²F†—2ç’Ò’Ò2æƒ°¢òòdôUô…—2F†R6ÖRF÷Vv†æW72&—6RWfW'’Ö6†–æRFöö³²¤ôäUôD²—2F†P¢òòvVöâF†—2f–v‡B—2GVæVBv–ç7BÂ6òâV&æVB&ÆFR6†÷'FVç2—B&6°¢òòFòv†W&R—Bv2&F†W"F†âG&—f–Æ—6–ær—BâwV&F–âv—F‚æò¦öæP¢òòfÆÇ2FòF†RÖ–FFÆRöbF†RvVöâ7W'fR&F†W"F†âFòÂv†–6‚v÷VÆ@¢òò6–ÆVçFÇ’Ö¶R—BF†RV6–W7BF†–ær–â—G2÷vâ¶–ævFöÒà¢F†—2æ‡Ö‚ÒÖF‚ç&÷VæB‡2æ‡¢dôUô…¢…¤ôäUôDµ·2ç¦öæUÒÇÂãb’¢Db‚’æV‡“²F†—2æ‡ÒF†—2æ‡Öƒ°¢–b‡G—Vöb6öÖ&D–æ—BÓÓÒvgVæ7F–öâr’6öÖ&D–æ—B‡F†—2“°¢F†—2çg‚Ò²F†—2çg’Ò²F†—2ç7BÒvF÷&Òs²F†—2çBÒãC²F†—2ç†6RÒ°¢F†—2æ‡W'EBÒ²F†—2æFVBÒfÇ6S²F†—2ææ–ÒÒ²F†—2æf6RÒÓ°¢F†—2æ7–6ÆRÒ²F†—2æÖ&·2ÒµÓ²F†—2æ&VÒÒçVÆÃ°¢F†—2æ‡—æõBÒ²F†—2ç7FuBÒ°¢F†—2æF¦TBÒ2æF¦TBÇÂ²F†—2æF¦T†—G2Ò²F†—2æF¦Uv–âÒ²F†—2æF¦T4BÒ°¢F†—2æF¦U7âÒ2æF¦U7âÇÂ°¢òòf6Uf—2G&–Ç2f6RÂ6òÖ6†–æRf—6–&Ç’EU$å2–ç7FVBöbFVÆW÷'F–ær—G0¢òòæ÷6RFòF†R÷F†W"6–FRâ76–ærF‡&÷Vv‚¦W&ò7V6†W2F†R&öG’Âv†–6‚&VG0¢òò2—B7v–æv–ær&÷VæBà¢F†—2æf6Uf—2ÒF†—2æf6S°¢F†—2æ&÷&W2ÒµÓ²F†—2æ‡–ÖâÒçVÆÃ²F†—2ç&—6öâÒçVÆÃ°¢F†—2çv–æEBÒ²F†—2æ÷fW&G&—fUBÒ°¢–b†¶–æBÓÓÒv'&ööBr’²F†—2ç’Òc²F†—2æ†öÖU’Òc²Ð¢–b†¶–æBÓÓÒvFÆ2r’²F†—2ææW7E‚ÒF†—2ç‚²2çrò#²F†—2ææW7Dfö÷E’Ò“²Ð¢–b†¶–æBÓÓÒw¦W&òr’F†—2ç’ÓÒ“°¢–b†¶–æBÓÓÒvÖ÷F†W"r’²F†—2ç’Ò²F†—2ç‚Òrç&ööÔFVbçr¢D”ÄRò"Ò2çrò#²Ð¢òò&V6÷&FVBeDU"F†RW"Ö¶–æBÆ6VÖVçBÂ÷"F†RfÇ–W'2vWB6VçB&6²Fò¢òò÷6—F–öâF†W’æWfW"7GVÆÇ’ö67W–V@¢F†—2ç7vå‚ÒF†—2çƒ²F†—2ç7vå’ÒF†—2ç“°¢Ð¢7‚‚’²&WGW&âF†—2ç‚²F†—2çrò#²Ð¢7’‚’²&WGW&âF†—2ç’²F†—2æ‚ò#²Ð¢6†ö÷B‡g‚Âg’Â"Âw&bÂÆ–fRÂ÷&–v–â’°¢rç&ö§2çW6‚†æWr&ö¢†÷&–v–âò÷&–v–âç‚¢F†—2æ7‚‚’Â÷&–v–âò÷&–v–âç’¢F†—2æ7’‚’Âg‚Âg’ÂfÇ6RÂÂ"ÇÂrÂÅ´rç&ööÔFVbç¦öæUÒævÆ÷rÂw&bÇÂÂÆ–fRÇÂB’“°¢Ð¢&–ær†âÂ7VVBÂöfb’°¢f÷"†ÆWB’Ò²’Âã²’²²’°¢6öç7BÒöfb²’òâ¢ÖF‚å’¢#°¢F†—2ç6†ö÷B„ÖF‚æ6÷2†’¢7VVBÂÖF‚ç6–â†’¢7VVBÂb“°¢Ð¢6g‚‚w&–æw6†÷Br“°¢Ð¢7–æ4Ö÷F–öåFVÆÂ‚’°¢–b‡F†—2æ¶–æBÓÓÒv†÷&âr’&WGW&ã²òò—G26–æVÖF–2÷6†÷BÖ6†–æR÷vç2—G27VW0¢–b‡F†—2ç7BÓÒF†—2å÷FVÆÅ7B’°¢F†—2å÷FVÆÅ7BÒF†—2ç7C°¢F†—2å÷FVÆÄGW"ÒF†—2æFVBbbDTÄÅõ5BçFW7B‡F†—2ç7BÇÂrr¢òÖF‚æÖ‚‚ã‚ÂF†—2ç7BÓÓÒvçv6†&vRròF†—2æçuBÇÂãB¢F†—2çBÇÂãB’¢°¢–b‚F†—2æFVB’°¢–b…DTÄÅõ5BçFW7B‡F†—2ç7BÇÂrr’’6g‚‡F†—2çFVÆÄ7VR‚’“°¢Ð¢Ð¢Ð¢WFFR†GB’°¢F†—2ææ–Ò³ÒGC²F†—2æ‡W'EBÓÒGC°¢–b‡G—Vöb&÷74Ö÷F–öä&Vv–âÓÓÒvgVæ7F–öâr’&÷74Ö÷F–öä&Vv–â‡F†—2ÂGB“°¢6öç7BÆ–öäÖ÷F–öâÒF†—2æ¶–æBÓÓÒvvÆ—F6‚rbbF†—2æÖVWC°¢–b†Æ–öäÖ÷F–öâ’&V7DÖ÷F–öä&Vv–â‡F†—2“°¢–b‡F†—2æ¶–æBÓÓÒvÇ†r’Ç†Ö÷F–öä&Vv–â‡F†—2“°¢G'’°¢òòD„Rd•%5BÔTUD”ärG&—fW2F†—2&öG’'’†æB†§2övÖRæ§2ÖVWE7FW“¢æð¢òòFV6²Âæò6ööÆF÷vç2Âæò†—F&÷†W2öb—G2÷vâ(	B7FvVB6WVVæ6RÂæ÷B¢òòf–v‡B6†R6÷VÆB†fRvöà¢–b‡F†—2æÖVWB’&WGW&ã°¢òòu$dT„õ$â'Vç2†—2÷vâÖ6†–æRVæBFòVæB†§2öw&fV†÷&âæ§2“¢æòf÷&²Âæð¢òòÖ–Gö–çBÂæòW&–f–6F–öâ(	B†R—2F†RW–Rw26öÆF–W"Âæ÷BwV&F–âà¢–b‡F†—2æ¶–æBÓÓÒv†÷&âr’°¢òò5DttU"e$ôÒõUE4”DR„•2õtâÔ4„”äR‡F†R6öærÂvV¶æW72’†öÆG0¢òò†–Òv†W&R†R7FæG2Â2—B†öÆG2WfW'’wV&F–â(	BæöæRöb†—2÷và¢òòÖ÷fW2W6R7FuBÂ6òv—F†÷WBF†—2—Bv26WBæBæWfW"7VçBâ†—0¢òò6†÷G2–âF†R—"¶VWfÇ––æs²F†R6–æVÖF–2&VG2&Ræ÷B–çFW''WFVBà¢–b‡F†—2ç7FuBâbbt…ô4”äU·F†—2ç7EÒbbF†—2ç7BÓÒvF÷&Òr’°¢F†—2ç7FuBÓÒGC²F†—2çg‚Ò°¢–b‡F†—2æÖ—76–ÆW2’v…&ö¥7FW‡F†—2ÂGB“°¢&WGW&ã°¢Ð¢v…7FW‡F†—2ÂGB“²&WGW&ã°¢Ð¢–b‡G—Vöb—4†W&òÓÓÒvgVæ7F–öârbb—4†W&ò‚’’°¢6öç7Bt‚ÒGBâRÓBò‡F†—2çg‚Ò‡F†—2å÷g‚ÓÒçVÆÂòF†—2çg‚¢F†—2å÷g‚’’òGB¢°¢6öç7BvçDÆVâÒ6Æ×‡F†—2çg‚òCcÂÓÂ’¢ãSR²6Æ×‡t‚òC#ÂÓãbÂãb’¢ã3S°¢F†—2åöÆVâÒ‡F†—2åöÆVâÇÂ’²‡vçDÆVâÒ‡F†—2åöÆVâÇÂ’’¢ƒÒÖF‚ç÷rƒã"ÂGB’“°¢–b‚‡F†—2å÷g’ÇÂ’âSbbÖF‚æ'2‡F†—2çg’’Â#BbbF†—2å÷7V6…B’F†—2å÷7V6…BÒã##°¢–b‡F†—2å÷7V6…Bâ’F†—2å÷7V6…BÒÖF‚æÖ‚ƒÂF†—2å÷7V6…BÒGB“°¢F†—2å÷g‚ÒF†—2çgƒ²F†—2å÷g’ÒF†—2çg“°¢Ð¢F†—2ç7–æ4Ö÷F–öåFVÆÂ‚“°¢òòeU$ä4R4„ô•"w27FFRÆöræB†—2''’vÆ–çBw2&W6WB†§2ögW&æ6RÖf–v‡Bæ§2¢–b‡F†—2æ¶–æBÓÓÒvFÆ2r’f4Æöu7FW‡F†—2ÂGB“°¢–b‡F†—2ç&ö$'W§¥Bâ’°¢òòF†R&ö"d”%$DU3¢†VÆBG&VÖ&ÆRöâF†R6ÖW&æBÂF‡&÷Vv‚F†P¢òò'VÖ&ÆRÖ÷F÷'2ÂöâF†R6öçG&öÆÆW"(	B&RÖ&ÖVB–â6†÷'BVÇ6W0¢6öç7B"ÒÖF‚æfÆö÷"‡F†—2ç&ö$'W§¥B¢RãR“°¢F†—2ç&ö$'W§¥BÓÒGC°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂ"ãb“°¢–b„ÖF‚æfÆö÷"‡F†—2ç&ö$'W§¥B¢RãR’ÓÒ"bbG—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr¢E'VÖ&ÆRƒãBÂãSRÂ#“°¢Ð¢–b‡F†—2ç6†–VÆEBâ’F†—2ç6†–VÆEBÓÒGC²òò6†÷'FVBÆF–ær&V6÷fW'0¢–b‡F†—2æFVF„æ–ÕBâ’F†—2æFVF„æ–ÕBÓÒGC²òòF†R6öÆÆ6RÆ—2÷W@¢–b‡F†—2æFVB’°¢òòD„RDTD‚44TäS¢F†Rw&V6²FöW2æ÷BvòV–WFÇ’(	B6V6öæF'¢òòFWFöæF–öç2&—ÆR7&÷72F†R&öG’v†–ÆR—B6öÖW2'BÂV6‚öæP¢òò¶–6¶–ærF†R&ööÒæBF†RBÂ6Æ÷6–æröâöæRÆ7Bv†—FV÷W@¢–b‡F†—2æFVF„g…BÓÒçVÆÂ’²F†—2æFVF„g…BÒ"ã²F†—2æFVF„g„æW‡BÒã#²Ð¢–b‡F†—2æFVF„g…Bâ’°¢F†—2æFVF„g…BÓÒGC²F†—2æFVF„g„æW‡BÓÒGC°¢–b‡F†—2æFVF„g„æW‡BÃÒbbF†—2æFVF„g…BâãR’°¢F†—2æFVF„g„æW‡BÒ&æBƒã"Âã#‚“°¢6öç7B'‚ÒF†—2æ7‚‚’²&æB‚×F†—2çr¢ãrÂF†—2çr¢ãr“°¢6öç7B'’ÒF†—2ç’²&æBƒÂF†—2æ‚“°¢'W'7B†'‚Â'’ÂÂ6†æ6RƒãR’òr6fffffbr¢Å´rç&ööÔFVbç¦öæUÒævÆ÷rÂ#3ÂãRÂSÂ2ÂG'VR“°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂR“²6g‚‚v†—Br“°¢–b‡G—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr’E'VÖ&ÆRƒã2ÂãC"Â#“°¢Ð¢–b‡F†—2æFVF„g…BÃÒãRbbF†—2æFVF„f–æÆR’°¢F†—2æFVF„f–æÆRÒG'VS°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂsÂr6fffffbrÂCƒÂã"ÂSÂRÂG'VR“°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â3ÂÅ´rç&ööÔFVbç¦öæUÒævÆ÷rÂ3#ÂãÂƒÂBÂG'VR“°¢ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚ÂãƒR“²6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂ‚“°¢ræ†—E7F÷ÒÖF‚æÖ‚„ræ†—E7F÷Âã‚“°¢6g‚‚wV¶Rr“²6g‚‚w†6Rr“°¢–b‡G—Vöb&ö%vfRÓÓÒvgVæ7F–öâr’&ö%vfR‡F†—2æ7‚‚’ÂF†—2æ7’‚’Âr6fffffbr“°¢–b‡G—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr’E'VÖ&ÆRƒÂã‚Âs“°¢òòæ÷&ÖÆÇ’F†R&Æ7B—2F†Rd•%U2ÆVf–ærÂæ÷BF†RwV&F–âG––ær(	@¢òòF†B—2F†Rv†öÆRö–çBöbF†RW&–f–6F–öâ&2â'WBf÷&6T¶–ÆÂÖVç0¢òòF†RÆ–W"v24´TBæB6†÷6RFòVæB—BÂæB6†ö–6RF†RvÖP¢òòV–WFÇ’&WfW'6W2Gvò6V6öæG2ÆFW"—2æ÷B6†ö–6Rà¢–b‡F†—2æ¶–æBÓÒvÖ÷F†W"rbbF†—2çW&–f–VBbbF†—2æf÷&6T¶–ÆÂ’°¢F†—2çW&–f–VBÒG'VS²F†—2çW&UBÒ°¢òòöæÇ’F†Rf—fRwV&F–ç2†fRW&–f–6F–öâÆ–æRâF†RÇ†æ@¢òòF†RW–Rw26öç7G'V7G26ÖRF‡&÷Vv‚†W&RFöòæBFö7FVBF†Rv÷&@¢òò'VæFVf–æVB"÷fW"F†RæW‡B&ööÒ(	BB‚’öbÖ—76–ær¶W’(	Bv†–6€¢òòFööÇ2ö67G&VVÂæ6§26Vv‡BF†Rf—'7BF–ÖRWfW'’&÷72fVÆÂöâf–ÆÒà¢6öç7B²Ò²vÆ—F6ƒ¢wW&Uö&V7BrÂ'&ööC¢wW&Uö'&ööBrÂFÆ3¢wW&UöFÆ2rÀ¢¦W&ó¢wW&U÷¦W&òrÂ&—6Ó¢wW&U÷&—6ÒrÕ·F†—2æ¶–æEÓ°¢–b‡²’rçFö7B‡B‡²’“°¢Ð¢–b‡F†—2ç&Wv&EVæB’²F†—2ç&Wv&EVæBÒfÇ6S²ræöä&÷74FVB‡F†—2æ¶–æB“²Ð¢Ð¢Ð¢–b‡F†—2çW&–f–VB’°¢òòD„RUE3¢g&VVBwV&F–â¶VW2—G2æGW&RâF†RÆ–öâæBF†P¢òòG&vöâBFò†W"6–FS²tÄ4”U$RvÆ–FW2B†W"6†÷VÆFW#²F†P¢òòVvÆRW&6†W2vF6†–ær÷fW"†W#²F†R&÷vÆW"—2§W7B6@¢òòv–ââÆÂöbF†VÒW'"†V'G2v†Vâ6†R—26Æ÷6Rà¢F†—2çW&UBÒ‡F†—2çW&UBÇÂ’²GC°¢F†—2æf6Uf—2Ò‡F†—2æf6Uf—2ÇÂF†—2æf6R¢²6Æ×‡F†—2æf6RÒ‡F†—2æf6Uf—2ÇÂF†—2æf6R’ÂÖGB¢RÂGB¢R“°¢6öç7Bƒ"ÒÆ–W"ç‚²Æ–W"çrò"ÂBÒƒ"ÒF†—2æ7‚‚“°¢6öç7B6WGFÆVBÒF†—2çW&UBâãbbÆ–W"æFVC°¢–b‡6WGFÆVB’F†—2æf6RÒÖF‚ç6–vâ‡B’ÇÂF†—2æf6S°¢–b‡6WGFÆVBbbÖF‚æ'2‡B’Â‡F†—2æ¶–æBÓÓÒw¦W&òròƒ¢’bb6†æ6RƒãR’¢FE'B‡F†—2æ7‚‚’²&æB‚ÓBÂB’ÂF†—2ç’ÒbÂ&æB‚ÓbÂb’Â&æB‚ÓC"ÂÓ#"’À¢&æBƒãrÂã’Â6†æ6RƒãR’òr6fc†f#2r¢r6ff3&CBrÂ"ãbÂÓBÂG'VR“°¢6öç7BfÆö÷%“"ÒR¢D”ÄRÒF†—2æƒ°¢–b‡F†—2æ¶–æBÓÓÒvvÆ—F6‚rÇÂF†—2æ¶–æBÓÓÒvFÆ2rÇÂF†—2æ¶–æBÓÓÒvÇ†r’°¢–b‡F†—2ç’ÂfÆö÷%“"’F†—2ç’ÒÖF‚æÖ–â†fÆö÷%“"ÂF†—2ç’²3#¢GB“°¢ÆWB×bÒ°¢–b‡6WGFÆVBbbÖF‚æ'2‡B’â“b’²×bÒ6Æ×‡BÂÓsÂs“²F†—2ç‚³Ò×b¢GC²Ð¢F†—2çWEvÆ²Ò×bÓÒ°¢F†—2çg‚Ò×c°¢–b‡F†—2æ¶–æBÓÓÒvvÆ—F6‚rÇÂF†—2æ¶–æBÓÓÒvÇ†r’°¢F†—2ç7BÒ×bò‡F†—2æ¶–æBÓÓÒvvÆ—F6‚ròw7FÆ²r¢w&W7Br’¢v–FÆRs°¢F†—2çg’Ò°¢6öç7Bw&÷VæBÒw&÷VæD6öÇVÖäB‡F†—2æ7‚‚’“°¢–b†w&÷VæBbbw&÷VæBæÆVæwF‚’F†—2ç’ÒÖF‚æÖ–â‚ââæw&÷VæB’ÒF†—2æƒ°¢Ð¢–b‡F†—2æ¶–æBÓÓÒvFÆ2r’²F†—2ç7BÒv–FÆRs²F†—2çBÒS²F†—2çg’Ò²Ð¢ÒVÇ6R–b‡F†—2æ¶–æBÓÓÒw¦W&òr’°¢F†—2ç7BÒv–FÆRs°¢–b‡6WGFÆVB’°¢òòB†W"6†÷VÆFW#¢†ÆbÖÆVæwF‚&V†–æBÂ&–F–ærF†R— ¢6öç7BGƒ"Òƒ"Ò„ÖF‚ç6–vâ‡B’ÇÂ’¢#ÒF†—2çrò#°¢6öç7BG“"ÒfÆö÷%“"Ò3°¢F†—2ç‚³Ò‡Gƒ"ÒF†—2ç‚’¢ÖF‚æÖ–âƒÂGB¢ãb“°¢F†—2ç’³Ò‡G“"ÒF†—2ç’’¢ÖF‚æÖ–âƒÂGB¢ã“°¢Ð¢ÒVÇ6R–b‡F†—2æ¶–æBÓÓÒv'&ööBr’°¢F†—2ç7BÒw&W7FÆ÷rs²F†—2çBÒS°¢F†—2ç’ÒfÆö÷%“"²C²F†—2çg’Ò²F†—2æ6%bÒF†—2æ6%bÇÂ°¢ÒVÇ6R–b‡F†—2æ¶–æBÓÓÒw&—6Òr’°¢F†—2ç7BÒvF÷&Òs°¢–b‡F†—2ç’ÂfÆö÷%“"’F†—2ç’ÒÖF‚æÖ–â†fÆö÷%“"ÂF†—2ç’²3#¢GB“°¢Ð¢F†—2ç‚Ò6Æ×‡F†—2ç‚Â‚Ârç&ööÔFVbçr¢D”ÄRÒF†—2çrÒ‚“°¢Ð¢òòF†Rƒ'&–FvRÆWG2vòöæ6RF†Rw&V6²†26WGFÆV@¢–b„rç&ööÔ–BÓÓÒuƒrbb‡F†—2æFVF„æ–ÕBÇÂ’ÃÒbbF†—2æ'&–FvTvöæR’°¢F†—2æ'&–FvTvöæRÒG'VS°¢f÷"†ÆWB’Ò²’Â#²’²²¢FE'Bƒb¢D”ÄR²&æBƒÂ2¢D”ÄR’ÂR¢D”ÄR²&æB‚ÓBÂB’À¢&æB‚ÓcÂc’Â&æB‚ÓCÂ#’ÂãbÂr33vffCrÂ"ãRÂSÂG'VR“°¢6g‚‚vvÆ72r“²6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂB“°¢Ð¢&WGW&ã°¢Ð¢òòÒÒÒÒD„Rdõ$²ÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòWfW'’wV&F–â6·2ÂæB—B6·2öâF†R¶–ÆÆ–ær&Æ÷râF†R7G&–¶RF†@¢òòv÷VÆBVæB—B–ç7FVBWG2—Böâ—G2¶æVW2ÂæBF†Rf–v‡B7F÷2öâF†P¢òòöæÇ’VW7F–öâF†RvÖR—2'V–ÇBöã¢Fò–÷Rf–æ—6‚F†—2Â÷"Fò–÷Rg&VP¢òò—Còæ÷F†–ær6ÖÆÆW"F†âwV&F–â—2WfW"ÆÆ÷vVBFò6²(	BVW7F–öà¢òò&WVFVB÷fW"WfW'’7&vÆW"—2v†BÖFRF†—2öæR6†Và¢òð¢òòf÷"åTÄÄdär—B—2Ç6òÂ'’F†R'&–Bw2÷vâ&—F†ÖWF–2ÂF†R6–ævÆRÖ÷7@¢òò6öç6WVVçF–Â&W72–â'Vã¢2F†Rd•%5BVçG'’öâF†RÆVFvW"—B6'&–W0¢òò&÷Vv†Ç’æ–æRF–ÖW2F†RvV–v‡BöbF†R6†ö–6R–÷Rv–ÆÂÖ¶Râ†÷W"ÆFW"à¢òð¢òòD„•2%Tå2$Tdõ$RD„R5DDRÔ4„”äRÂæBF†BÆ6VÖVçB—2F†Rv†öÆRö–çBà¢òò—BW6VBFò6—B&VÆ÷rWfW'’7FFR†æFÆW"Â6òç’7FFRF†B&WGW&æVBV&Ç¢òò7vÆÆ÷vVBF†RVW7F–öâVçF—&VÇ“¢$•4Ò$õtÄU"¶–ÆÆVBÖ–BÖF6‚æWfW"6¶V@¢òòæBæWfW"F–VB(	B—B6BB¦W&ò†VÇF‚Â7F–ÆÂf–v‡F–ærâwV&F–âw2FVF€¢òò6ææ÷B&R6öçF–ævVçBöâv†–6‚Ö÷fR—B†VæVBFò&R–âv†Vâ—BF–VBà¢òò…F†R&Æ÷r—G6VÆb—26Vv‡B–âF–R‚“²F†—2—2F†R&6·7F÷f÷"ç—F†–æp¢òòF†BG&–ç2wV&F–âFò¦W&òv—F†÷WBWfW"6ÆÆ–ær—Bâ¢–b‡F†—2æ‡ÃÒbb&÷74f÷&²‡F†—2’’&WGW&ã°¢òòwV&F–âB¦W&òFöW2æ÷BfÆÂöâ—G2÷vâç’Ö÷&Râ—B—2V—F†W"¶æVVÆ–æp¢òòv—F‚F†RVW7F–öâ7F–ÆÂ÷VâÂ÷"v—F–ærf÷"F†R&Æ÷rF†RvÖR—2&÷WBFð¢òò7v–æröâF†RÆ–W"w2&V†Æb(	BæBG––ærV&Ç’v÷VÆBVB&÷F‚ÖöÖVçG2à¢–b‡F†—2æ‡ÃÒbb„ræf÷&´&÷72ÓÓÒF†—2ÇÂ„ræf–æ—6‚bbræf–æ—6‚æ"ÓÓÒF†—2’’’&WGW&ã°¢–b‡F†—2æ‡ÃÒ’²F†—2æF–R‚“²&WGW&ã²Ð¢òòEtò5DDU2$RD„T•"õtâ5DttU"âçVÆÆVæB„åTÄÄdärÆæF–ærgFW"çVÆÀ¢òòw&f—G’’æB6ffÆö÷"…DÄôä„õ5Bw&÷VæFVBv—F‚—G26†W7B7&6¶VB÷Vâ¢òò&RÖÇ’7FuBWfW'’g&ÖR6òF†R&÷727F—2÷VâFòGF6²f÷"F†Rv†öÆP¢òòv–æF÷râ&WGW&æ–ærV&Ç’öâF†B7F'fVBF†RfW'’F–ÖW"F†R†æFÆW"v0¢òò6÷VçF–ærF÷vã¢—BöæÇ’F–6¶VBöâF†RöæRg&ÖR–âV–v‡FVVâv†W&RF†P¢òò7FvvW"†B§W7BW‡—&VBâåTÄÄdärw2ãW2&V6÷fW'’Föö²#"6V6öæG2æ@¢òòDÄôä„õ5Bw2ãw2&W—"Föö²C"(	BF†R&÷72f—6–&Ç’7F÷VBæB7F–V@¢òò7F÷VBÂv†–6‚—2W†7FÇ’†÷r—BÆöö¶VBg&öÒF†R÷WG6–FRà¢òòââæW†6WB&öG’–âF†R—#¢eU$ä4R4„ô•"w2G&÷—2fÆ÷vâ'’†æBÂæ@¢òò7FvvW"F†Bg&÷¦R—Bv÷VÆB†ær†–Ò÷fW"†W"†VBâ—Bv—G2f÷"F†P¢òòÆæF–ærÂv†W&R—B—2â÷Væ–ærv–â„d5ô•"Â§2ögW&æ6RÖf–v‡Bæ§2’à¢–b‡F†—2ç7FuBâbb‡F†—2æ¶–æBÓÓÒvFÆ2rbbd5ô•%·F†—2ç7EÒ’’°¢F†—2ç7FuBÓÒGC°¢–b‚$õ55õ4TÄeõ5Du·F†—2ç7EÒ’²òò6öæròvV¶æW727FvvW ¢òò5DttU"•2âõTä”ärÂäBâõTä”är•2”â$T4‚âWfW'’7FvvW ¢òò–âF†RvÖR(	BF†R6öærw2ÂF†R†ÆbÖ†VÇF‚Ö–Gö–çBw2ãR2ÂÔõD„U"Õ`¢òò†æv–ærW‡÷6VBgFW"F÷FÂçVÆÂ(	Bg&÷¦RfÆ–W"v†W&WfW"—B‡VærÀ¢òòv†–6‚f÷"tÄ4”U$Rv2s"Óƒ2‚÷fW"F†RfÆö÷#¢g&VRVæ—6‚–÷P¢òòæVVFVB§V×Fò6öÆÆV7BâF†RfÆ–W'26rFòF†RÆ–W"w2ÆWfVÂf÷ ¢òò—Bæ÷r†&÷75&V57÷C¢&W6–FR†W"ÂVæFW'6–FR÷fW"†W"†VB’âæ÷@¢òòÖ–B×7vö÷¢DÄôä„õ5Bw27vö÷—2f—†VB7W'fR—Bv÷VÆB6æ&6²Fòà¢–b„$õ55ôdÄ”U5·F†—2æ¶–æEÒbbF†—2ç7BÓÒw7vö÷rbbF†—2ç7BÓÒv6f7&6‚r’°¢6öç7B2Ò&÷75&V57÷B‡F†—2“°¢F†—2ç’³Ò‡2ç’ÒF†—2ç’’¢ƒÒÖF‚æW‡‚Ób¢GB’“°¢F†—2ç‚³Ò‡2ç‚ÒF†—2æ7‚‚’’¢ƒÒÖF‚æW‡‚ÓB¢GB’“°¢F†—2çg‚Ò²F†—2çg’Ò°¢Ð¢&WGW&ã°¢Ð¢Ð¢–b‡F†—2ç7BÓÓÒvF÷&Òr’°¢òòD„RU”Ru24ôå5E%T5E2DòäõBtUBuT$D”âu2t´Tä”ärâF†R6†&V@¢òò†æFÆW"&VÆ÷r&—6W2Â$ô%2Â6†¶W2F†R&ööÒæB7F'G2æÖVB&÷70¢òòF†VÖR(	Bv†–6‚—2F†R&–v‡B6W&VÖöç’f÷"öæRöbF†R6—‚æB6ö×ÆWFVÇ¢òòw&öærf÷"6–FRf–v‡B–÷RvVçBÆöö¶–ærf÷"âv÷'6RÂ—BÆVgB–çG&ö–à¢òòF†V—"7FFRÆ—7C¢âGF6²×6†VB7FFRv—F‚æòv–æB×WÂv†–6‚—0¢òòW†7FÇ’v†BFW7G2öÖ–æ—2æ6§2fÆvvVBà¢–b†—4Ö–æ’‡F†—2’’°¢–b‚Æ–W"æFVBbbÖF‚æ'2‡Æ–W"ç‚²Æ–W"çrò"ÒF†—2æ7‚‚’’Â3C’°¢F†—2ç7BÒv–FÆRs²F†—2çBÒãCS°¢6g‚‚v67FçVÆÂr“²6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂ2“°¢6WD×W6–2‚v&÷75öÖ–æ’r“°¢rçFö7B‡B‚vÖ–æ•òr²F†—2æ¶–æB’“°¢Ð¢&WGW&ã°¢Ð¢òòD„RÅ„tUE2uT$D”âu24U$TÔôå’Â&V6W6R—BV&ç2öæS¢—B—2F†P¢òòf—'7BF†–ær–âF†R'Vâv—F‚æÖRÂF†VÖRöb—G2÷vâæBf–v‡B–÷P¢òò6âÆ÷6Râv†B—BFöW2æ÷BvWB—2wV&F–âw2$Ut$B6†–â(	B6VP¢òòöä&÷74FVB(	BæB—BFöW2æ÷BvWBF†Rf÷&²Â&V6W6RFÖ–ær—2F†RöæÇ¢òòVæF–ær—B†2à¢–b‡F†—2æ¶–æBÓÓÒvÇ†r’°¢–b‚Æ–W"æFVBbbÖF‚æ'2‡Æ–W"ç‚²Æ–W"çrò"ÒF†—2æ7‚‚’’Â3ƒ’°¢F†—2ç7BÒv–çG&òs²F†—2çBÒ"ã²F†—2ç&ö&VBÒfÇ6S°¢6g‚‚wV’r“²6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂ2“°¢6WD×W6–2‚v&÷75öÇ†r“°¢rçFö7B‡B‚vÇ†öÖVWBr’“°¢Ð¢&WGW&ã°¢Ð¢–b‚Æ–W"æFVBbbÖF‚æ'2‡Æ–W"ç‚²Æ–W"çrò"ÒF†—2æ7‚‚’’Â3ƒ’°¢òòD„R5D•#¢—B†V'2†W"âF†Rv¶R—G6VÆb—2V–WB(	B6W'f÷2Â¢òò'&VF‚(	BF†R$ô"&VÆöæw2FòF†RÖöÖVçB—B&V6†W2gVÆÂ†V–v‡Bà¢F†—2ç7BÒv–çG&òs²F†—2çBÒ"ã²F†—2ç&ö&VBÒfÇ6S°¢6g‚‚wV’r“²6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂ2“°¢òòV6‚wV&F–âvWG2—G2÷vâF†VÖRv†VâöæR†2&VVâ66÷&VBÂæBF†P¢òò6†&VB&÷7266÷&RVçF–ÂF†Và¢6WD×W6–2‚v&÷75òr²F†—2æ¶–æB“°¢òòD„R$TÔD4‚‡VæFW&FörÖ&2*s"ã“¢F†R6÷'&–F÷"w27F–ærv–â(	BF†P¢òò6ÆÒ—B'&—fVBöâ(	BæBF†R'&–BÖ&·2F†B6†R6ÖR&6²f÷"—@¢–b‡F†—2æ¶–æBÓÓÒvvÆ—F6‚rbbrç6fRbbrç6fRæfÆw2bbrç6fRæfÆw2æædÖVWB’°¢rçFö7B‡B‚væe÷&VÖF6‚r’“°¢–b‡G—Vöb'$Ö&²ÓÓÒvgVæ7F–öâr’'$Ö&²‚w&VÖF6‚rÂrç&ööÔ–B“°¢Ð¢Ð¢&WGW&ã°¢Ð¢–b‡F†—2ç7BÓÓÒv–çG&òr’°¢F†—2çBÓÒGC°¢–b‚F†—2ç&ö&VBbbF†—2çBÃÒãƒR’°¢òòD„R$ô"(	BV6‚wV&F–âææ÷Væ6W2—G6VÆb–â—G2÷vâfö–6RÂæ@¢òòF†R&ööÒç7vW'3¢6†¶RÂ'VÖ&ÆRÂ'W'7BöfbF†R&öG¢F†—2ç&ö&VBÒG'VS°¢–b‡F†—2æ¶–æBÓÓÒvvÆ—F6‚r’&V7E6÷VæB‚w&ö"r“°¢VÇ6R6g‚‡²vÆ—F6ƒ¢w&ö%ö&V7BrÂ'&ööC¢w&ö%öVvÆRrÂ¦W&ó¢w&ö%övÆ2rÀ¢FÆ3¢w&ö%öG&rrÂ&—6Ó¢w&ö%÷&—6ÒrÂÇ†¢vÇ†ö†÷vÂrÕ·F†—2æ¶–æEÒÇÂw&ö"r“°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂ“°¢F†—2ç&ö$'W§¥BÒãƒ°¢–b‡G—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr’E'VÖ&ÆRƒã’ÂãrÂcS“°¢–b‡G—Vöb&ö%vfRÓÓÒvgVæ7F–öâr¢&ö%vfR‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÒF†—2æ‚¢ã3RÀ¢²vÆ—F6ƒ¢r6#C†6fbrÂ'&ööC¢r6fcVcfBrÂ¦W&ó¢r6VC†fbrÀ¢FÆ3¢r6fc–VrÂ&—6Ó¢r33vffCrÂÇ†¢r6ff3#FrÕ·F†—2æ¶–æEÒÇÂr6SVfbr“²òòFÆ3¢ÖöÇFVâÂæ÷B&Wv&BvöÆB†÷væW"Â##bÓÓ"¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÒF†—2æ‚¢ã2ÂbÂr6fffffbrÂ#cÂãRÂcÂ2ÂG'VR“°¢Ð¢–b‡F†—2æ¶–æBÓÓÒvFÆ2rbbF†—2ææW7Dfö÷E’ÒçVÆÂbbF†—2çBÃÒãbbbF†—2ææW7DÆæFVB’°¢òòDõtâe$ôÒD„R$ôõ5C¢†RÆVfW2F†RæW7BöâF†Rv–æræBvÆ–FW2Fð¢òòF†R&VæfÆö÷"ÂÆæF–ærv—F‚F†Rv†öÆR&ööÒw2vV–v‡@¢6öç7BfÆö÷$fö÷BÒR¢D”ÄS°¢6öç7B³"Ò6Æ×‚ƒãbÒF†—2çB’òãRÂÂ“°¢6öç7BS"Ò³"¢³"¢ƒ2Ò"¢³"“°¢F†—2ç’ÒF†—2ææW7Dfö÷E’²†fÆö÷$fö÷BÒF†—2ææW7Dfö÷E’’¢S"ÒF†—2æƒ°¢F†—2ç‚³Ò„rç&ööÔFVbçr¢D”ÄR¢ãRÒF†—2çrò"ÒF†—2ç‚’¢ÖF‚æÖ–âƒÂGB¢2“°¢F†—2çg’Ò3#°¢F†—2æf6RÒF†—2æf6Uf—2ÒÆ–W"ç‚²Æ–W"çrò"ÂF†—2æ7‚‚’òÓ¢°¢–b†³"ãÒ’°¢F†—2ææW7DÆæFVBÒG'VS²F†—2çg’Ò°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂ’“²6g‚‚w6ÆÒr“°¢–b‡G—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr’E'VÖ&ÆRƒãrÂãRÂ3“°¢'W'7B‡F†—2æ7‚‚’ÂF†—2ç’²F†—2æ‚Â‚Âr63ƒ“#V2rÂ##ÂãRÂCÂ2“°¢Ð¢Ð¢–b‡F†—2çBÃÒ’²F†—2ç7BÒv–FÆRs²F†—2çBÒãƒ²F†—2çg’Ò²Ð¢&WGW&ã°¢Ð¢òòÒÒÒÒD„Rdõ$²ÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòWfW'’wV&F–â6·2ÂæB—B6·2öâF†R¶–ÆÆ–ær&Æ÷râF†R7G&–¶RF†@¢òòv÷VÆBVæB—B–ç7FVBWG2—Böâ—G2¶æVW2ÂæBF†Rf–v‡B7F÷2öâF†P¢òòöæÇ’VW7F–öâF†RvÖR—2'V–ÇBöã¢Fò–÷Rf–æ—6‚F†—2Â÷"Fò–÷Rg&VP¢òò—Còæ÷F†–ær6ÖÆÆW"F†âwV&F–â—2WfW"ÆÆ÷vVBFò6²(	BVW7F–öà¢òò&WVFVB÷fW"WfW'’7&vÆW"—2v†BÖFRF†—2öæR6†Và¢òð¢òòf÷"åTÄÄdär—B—2Ç6òÂ'’F†R'&–Bw2÷vâ&—F†ÖWF–2ÂF†R6–ævÆRÖ÷7@¢òò6öç6WVVçF–Â&W72–â'Vã¢2F†Rd•%5BVçG'’öâF†RÆVFvW"—B6'&–W0¢òò&÷Vv†Ç’æ–æRF–ÖW2F†RvV–v‡BöbF†R6†ö–6R–÷Rv–ÆÂÖ¶Râ†÷W"ÆFW"à¢–b‡F†—2ç†6RÓÓÒbbF†—2æ‡ÂF†—2æ‡Ö‚ò"’°¢òòD„RÔ”Eô”åB(	BF†R&VBWfW'’öæRöbF†W6Rf–v‡G2v2Ö—76–ærâ&÷70¢òò—2G&ÖF–27G'V7GW&RÂæBF†RV&Æ—6†VB6†RWG2GW&æ–ærö–ç@¢òòBF†RÖ–FFÆS¢ÖöÖVçBöb&VÆ–Vb–ÖÖVF–FVÇ’&Vf÷&RF†R†&FW7B'Bà¢òòvö–ær7G&–v‡Bg&öÒ†6RöæRFò†6RGvòÖFRW66ÆF–öâ&VB2F†P¢òòf–v‡BvWGF–ærw&–æF–W"âF†—26÷7G26V6öæBæB†ÆbÂ†æG2F†P¢òòÆ–W"wV&çFVVBg&VRVæ—6‚W†7FÇ’v†W&Rg'W7G&F–öâV·2Âæ@¢òòÖ¶W2F†R6†ævRöbvV"6öÖWF†–ær–÷R4TR&F†W"F†â6öÖWF†–ær–÷P¢òò6Æ÷vÇ’–æfW"g&öÒ&V–ær†—BÖ÷&Rà¢F†—2ç†6RÒ#²F†—2ç7FuBÒÖF‚æÖ‚‡F†—2ç7FuBÇÂÂãR“²F†—2çBÒã#²F†—2çg‚Ò²F†—2çg’Ò°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â3Âr6fffffbrÂ3#ÂãrÂ#ÂBÂG'VR“°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â#"ÂDTÄÅô4ôÂÂ#CÂã’ÂcÂ2ÂG'VR“°¢6Òç6†¶RÒ#²6g‚‚w†6Rr“²ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚Âã3R“°¢ræ†—E7F÷ÒÖF‚æÖ‚„ræ†—E7F÷Âã"“°¢–b‡G—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr’E'VÖ&ÆRƒã‚Âã’Â3ƒ“°¢Ð¢6öç7B‚ÒÆ–W"ç‚²Æ–W"çrò"Â’ÒÆ–W"ç’²Æ–W"æ‚ò#°¢òòV6‚&÷72WF†R6†–â—2æF—fVÇ’f7FW"æBÖ÷&R&VÆVçFÆW70¢6öç7B7BÒDb‚’æW7B¢‡F†—2æGF6µ7VVBÇÂ$õ55ôtu$õ·F†—2æ¶–æEÒÇÂ“°¢F†—2çv–æEBÓÒGC²F†—2æ÷fW&G&—fUBÓÒGC°¢òòWfW'’&÷72Æöö·2v†W&R—B—2vö–ærÂWfVâF†RöæW2F†BFòæ÷BvÆ°¢òòtÄ4”U$R÷vç2f6–ær–â†W"7FFR†æFÆW#¢6öÖÖ—GFVB6†&vR¶VW0¢òòf6–ærÆöær—G2fVÆö6—G’WfVâgFW"F†RÆ–W"7&÷76W2&V†–æB—Bà¢–b‡F†—2æ¶–æBÓÓÒv'&ööBrÇÂF†—2æ¶–æBÓÓÒw&—6ÒrÇÂF†—2æ¶–æBÓÓÒvÖ÷F†W"r¢F†—2æf6RÒÖF‚ç6–vâ‡‚ÒF†—2æ7‚‚’’ÇÂF†—2æf6RÇÂ°¢òòåTÄÄdärw2GW&â—2f–ÆÖVBÆ–öâGW&æ–ær†§2ö&V7Bæ§2$T5EõEU$â“¢ãS"0¢òòVæBFòVæBv–ç7BF†Rã3b2WfW'’÷F†W"Ö6†–æRv†—2&÷VæB–ââ—B—0¢òòæ÷B—f÷Bç’Ö÷&R(	BF†R†VBÆVG2ÂF†Rw27FW&÷VæBÂF†RF–À¢òòföÆÆ÷w2(	BæBf÷W"7FW27VVW¦VB–çFòãC"2&VB2&ÇW"Âæ÷BGW&âà¢6öç7BGW&âÒGB¢‡F†—2æ¶–æBÓÓÒvvÆ—F6‚rò2ãƒR¢RãR“°¢6öç7Be6–vâÒÖF‚ç6–vâ‡F†—2æf6Uf—2’ÇÂ°¢F†—2æf6Uf—2³Ò6Æ×‚‡F†—2æf6RÇÂ’ÒF†—2æf6Uf—2Â×GW&âÂGW&â“°¢òòF†R—f÷B¶–6·2WGW7BF†R–ç7FçBF†R&öG’v†—2F‡&÷Vv‚6VçG&RÂ6ò¢òòGW&æ–ærÖ6†–æR&VG22ÆçF–æræB7–ææ–ærÂæWfW"2fÆB6Æ—fW ¢–b‚‡F†—2æ¶–æBÓÓÒvvÆ—F6‚rÇÂF†—2æ¶–æBÓÓÒw¦W&òrÇÂF†—2æ¶–æBÓÓÒvFÆ2r’bb„ÖF‚ç6–vâ‡F†—2æf6Uf—2’ÇÂ’ÓÒe6–vâ’°¢òòD„REU$âÄrw2GW7C¢F†R7&÷76–ærg&ÖR—2Ö6¶VB'’¶–6¶VB6Æ÷V@¢6öç7BGW7D6öÂÒF†—2æ¶–æBÓÓÒw¦W&òròr66fS†cBr¢F†—2æ¶–æBÓÓÒvFÆ2ròr63ƒ“#V2r¢r6#–ƒƒ‚s°¢f÷"†ÆWB’Ò²’Âƒ²’²²¢FE'B‡F†—2æ7‚‚’²&æB‚×F†—2çr¢ãBÂF†—2çr¢ãB’ÂF†—2ç’²F†—2æ‚Ò&æBƒÂ‚’À¢&æB‚Ó#Â#’Â&æB‚ÓCÂÓ3’Âã3RÂGW7D6öÂÂ2Â#cÂG'VR“°¢6g‚‚w7FWr“°¢Ð¢F†—2çF–6´&–Æ—F–W2†GBÂ‚Â’“°¢òòF†R†—BÖw&÷W'&V²÷vç2F†Rg&ÖRv†–ÆR—B†öÆG2†wV&D'&V²Â&÷fR“°¢òòåTÄÄdärw2Æ—fW2–ç6–FR—G2÷vâ66RÂv†W&R—Bv2FVv‡Bf—'7@¢–b‡F†—2æ¶–æBÓÒvvÆ—F6‚rbbwV&D'&V²‡F†—2ÂGB’’²ò¢'&ö¶Vâ÷Vâ¢òÐ¢VÇ6R7v—F6‚‡F†—2æ¶–æB’°¢òòÒÒÒÒtÄ•D4‚äU„S¢6†&v–ær6÷''WFVB†÷VæBÒÒÒÐ¢66RvvÆ—F6‚s¢°¢òòÒÒÒÒåTÄÄdärÖ÷fW2Æ–¶RÄ”ôâÂG&6VBg&öÒF†R6†VWBw2f÷W ¢òò÷6W3¢—B5DÄµ2Æ÷r‡vÆ²f–wW&R’Â5t•U2rB&Òw2&V6‚À¢òòfÆGFVç2–çFò5$õT4‚†GF6²f–wW&R’&Vf÷&RF†RõTä4RÂæ@¢òò$ô%2‡&ö"f–wW&R’Fò6†÷fR–÷R&6²æB6ÆÂF†R6²âF†RöÆ@¢òò&÷72w2G&–ÆÂ—2vöæR(	Bæ÷F†–ær†W&R—2–æ†W&—FVBâÒÒÒÐ¢F†—2çg’³Ò#¢GC°¢F†—2ç7v—T4BÒF†—2ç7v—T4BÓÒçVÆÂò¢F†—2ç7v—T4BÒGC°¢6öç7BF—7BÒ‚ÒF†—2æ7‚‚’ÂF—7BÒÖF‚æ'2†F—7B“°¢òòÒÒÒÒ•BEU$å2ôâD„Ru$õTäBÂäB•Bd”ä•4„U2EU$ä”ärd•%5BÒÒÒÒÒÒÒÒÒÐ¢òò†7&VGW&RÖÖ÷F–öâÖ6öÖ&B*s3¢7F÷&RF—&V7F–öâB6öÖÖ—FÖVçC²GW&âB¢òò7F÷VBÂ&WÆçFVB&VBâ’f–ÆÖVB##bÓÓ2v–ç7BF†RÆ—fR'V–ÆC¢¢òò7&–ærFòÆVFvR&V†–æB—BÆVæ6†VBf6–ær†W"æBÖ—'&÷&VB–âÖ–@¢òò—#²v–æB×W6÷VÆB&Vv–âv†–ÆRF†R&öG’v27F–ÆÂ6öÖ–ær&÷VæBâ6ð¢òò6†ævRöbf6–ær—2öæR6öÖÖ—GFVB—f÷B(	Bæ÷F†–ær&RÖ–×2—Bv†–ÆP¢òò—BÆ—2Âæ÷F†–ær&Vv–ç2VçF–Â—B†2ÆæFVB(	BæBÆVÆVfW2F†P¢òòw&÷VæBö–çF–ærv†W&R—B—2vö–ærà¢ÆWBGW&æ–ærÒÖF‚æ'2‚‡F†—2æf6Uf—2ÓÒçVÆÂò‡F†—2æf6RÇÂ’¢F†—2æf6Uf—2’Ò‡F†—2æf6RÇÂ’’âã#°¢6öç7BÆöö´BÒ‡6–FR’Óâ°¢–b‡GW&æ–ærÇÂ6–FRÇÂ6–FRÓÓÒF†—2æf6R’&WGW&ã°¢F†—2æf6RÒ6–FS²F†—2çGW&å7G&V²Ò‡F†—2çGW&å7G&V²ÇÂ’²°¢GW&æ–ærÒG'VS²òòg&öÒF†—2g&ÖS¢æ÷F†–ær—26†÷6VâVçF–Â—B†2ÆæFV@¢Ó°¢òòââääB•B4ääõB$RDä4TB$õTäBâGvòGW&ç2v—F‚æòGF6²&WGvVVà¢òòF†VÒÖVç26†R—27&÷76–ærVæFW"—Bf7FW"F†â—B6âf6R†W"Âæ@¢òò—f÷BÖÆö6¶VB&÷72F†BöæÇ’WfW"GW&ç2—2&÷727v—F6†VBöfbâF†P¢òòç7vW"—2F†RÖ÷fRF†BæVVG2æòf6–æs¢F†R&ö"Âv†–6‚6†÷fW2g&öÐ¢òò&÷F‚6–FW2â6ÖRS×2–æ†ÆRÂ6ÖR7VRÂ6ÖR†&ÖÆW726†÷fRà¢–b‚‡F†—2çGW&å7G&V²ÇÂ’ãÒ"bbGW&æ–ærbb‡F†—2ç7BÓÓÒv–FÆRrÇÂF†—2ç7BÓÓÒw7FÆ²rÇÂF†—2ç7BÓÓÒw'Vâr’’°¢F†—2çGW&å7G&V²Ò°¢F†—2ç7BÒw&ö"s²F†—2çBÒã#S²F†—2çg‚Ò²F†—2ç&ö&VBÒfÇ6S°¢F†—2ç&ö$4BÒ&æBƒRãRÂr“²F†—2æÆ7DÖ÷fRÒw&ö"s°¢Ð¢òòÒÒÒÒD„R%$T²ÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòFVÄFÖr6÷VçG2†—G2ÆæFVB6Æ÷6RFövWF†W"æB&—6W2F¦U&Wâ—@¢òò—2F¶Vâ„U$RæBöæÇ’†W&RÂæBöæÇ’÷WBöb7FFRF†R&÷72—2æ÷@¢òò6öÖÖ—GFVBFó¢–çFW''WF–ærÆVæ6†VB÷Væ6RÖ–BÖ—"v÷VÆBÆVfRF†P¢òòæ–ÖÂfÆÆ–ær–â÷6RF†B†2æòÆæF–ærÂæB–çFW''WF–ærF†P¢òò&ö"v÷VÆBVBF†R÷&"—B†2Ç&VG’7væVBâWfW'—F†–ærF†RÆ–W ¢òò6â7FæBæW‡BFòæB†—B(	BF†R7FÆ²ÂF†R–FÆRÂF†Rv–æB×W2(	B—0¢òòf—"vÖRÂv†–6‚—2ÆÂöbF†Rf–v‡BF†BÖGFW'2f÷"F†—2à¢–b‡F†—2æF¦U&W’°¢F†—2æF¦U&WÒfÇ6S°¢6öç7B6öÖÖ—GFVBÒF†—2ç7BÓÓÒw÷Væ6RrÇÂF†—2ç7BÓÓÒw7&–ærrÇÂF†—2ç7BÓÓÒvF—fRp¢ÇÂF†—2ç7BÓÓÒvçVÆÆ6†&vRrÇÂF†—2ç7BÓÓÒvçVÆÆ†÷rÇÂF†—2ç7BÓÓÒvçVÆÆVæBp¢ÇÂF†—2ç7BÓÓÒv–çG&òrÇÂF†—2ç7BÓÓÒvF÷&ÒrÇÂF†—2ç7BÓÓÒvF¦Rs°¢–b‚6öÖÖ—GFVB’°¢F†—2ç7BÒvF¦Rs²F†—2ç&WÆçFVBÒfÇ6S°¢–b‡F†—2æ6ö–Äg‚’²F†—2æ6ö–Äg‚æ7WBÒ²F†—2æ6ö–Äg‚ÒçVÆÃ²Ð¢òò†6RGvò6‡'Vw2—Böfbf7FW"(	BF†R6ÖR&VBÂ6ÖÆÆW"&—¦P¢F†—2æF¦TGW"ÒF†—2ç†6RÓÓÒ"òã#R¢ãs°¢F†—2çBÒF†—2æF¦TGW#°¢F†—2çg‚Ò²F†—2ç7v—VBÒfÇ6S²F†—2ç7v—VC"ÒfÇ6S°¢òòF†R'&V²—2âUdTåBæBvWG2ææ÷Væ6VBöâWfW'’6†ææVÂF†P¢òò&W7BöbF†Rf–v‡BW6W2Â÷"F†RÆ–W"v–ÆÂæ÷Bæ÷F–6RF†W’†fP¢òòV&æVBç—F†–æræBv–ÆÂ¶VWÆ––ærF†R6fRv¢6g‚‚w†6Rr“²6g‚‚v&÷76†—Br“°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂ‚“°¢ræ†—E7F÷ÒÖF‚æÖ‚„ræ†—E7F÷Âã“°¢'W'7B‡F†—2æ7‚‚’ÂF†—2ç’²SÂ#bÂr6Cc†6fbrÂ3CÂãrÂ#cÂBÂG'VR“°¢–b‡G—Vöb&ö%vfRÓÓÒvgVæ7F–öâr’&ö%vfR‡F†—2æ7‚‚’ÂF†—2ç’²cÂr6Cc†6fbr“°¢–b‡G—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr’E'VÖ&ÆRƒãsRÂãbÂ##“°¢rçFö7B‡B‚vF¦Uö÷Vâr’“°¢Ð¢Ð¢–b‚‡F†—2æF¦Uv–âÇÂ’â’F†—2æF¦Uv–âÓÒGC°¢–b‚‡F†—2æF¦T4BÇÂ’â’F†—2æF¦T4BÓÒGC°¢–b‡F†—2ç7BÓÓÒvF¦Rr’°¢F†—2çg‚Ò²F†—2çBÓÒGC°¢–b‡F†—2çBÃÒ’°¢òò—B6öÖW2&6²UÂæ÷B7G&–v‡B&6²Fòv÷&³¢&V6÷fW&—2F†P¢òòW†—7F–ærÆæF–ær6WGFÆRæB—BÇ&VG’&VG22&vWGF–ær—G2fVW@¢òòVæFW"—B"Âv†–6‚—2W†7FÇ’F†R&VBF†—2vçG2à¢F†—2ç7BÒw&V6÷fW"s²F†—2çBÒãC#°¢òòæB—B6ææ÷B&R'&ö¶Vâv–â–ÖÖVF–FVÇ’Â÷"f7BÆ–W ¢òò7GVæÆö6·2F†RwV&F–âæBF†Rf–v‡B7F÷2&V–ærf–v‡@¢F†—2æF¦T4BÒF†—2ç†6RÓÓÒ"òr¢RãS°¢F†—2æF¦T†—G2Ò²F†—2æF¦Uv–âÒ°¢F†—2ç7v—T4BÒÖF‚æÖ‚‡F†—2ç7v—T4BÂãR“°¢Ð¢'&V³°¢Ð¢–b‡F†—2ç7BÓÓÒv–FÆRr’°¢F†—2çg‚Ò²F†—2çBÓÒGC°¢Æöö´B„ÖF‚ç6–vâ†F—7B’ÇÂ“°¢òòF†RÖ'W6‚6Æö6²'Vç2&WGvVVâÖ÷fW2Föó¢v—F‚F†R&÷vÂ7WBFð¢òòVæFW"6V6öæB—B7VçBRRöbF†Rf–v‡B–â7FÆ²æBF†RF—fP¢òòæWfW"6ÖR†ÖV7W&VBöb“2–âFW7G2ö÷Væ–æw2æ6§2¢–b‡F†—2æÖ'W6„4BÒçVÆÂ’F†—2æÖ'W6„4BÓÒGC°¢–b‡F†—2çBÃÒbbGW&æ–ær’°¢F†—2ç&ö$4BÒF†—2ç&ö$4BÇÂ&æBƒBÂRãR“²–b‡F†—2æÖ'W6„4BÓÒçVÆÂ’F†—2æÖ'W6„4BÒ&æBƒRÂ‚“°¢òòD„R4ôÄBÔD”4RdÄôõ"‚æ6ÆVFR÷6¶–ÆÇ2ö&÷72Ö÷Væ–æw2*sB“¢F‡&VP¢òò&Æ÷w2–â&÷rF†BÆæFVBÖVâ6†R†2†Bæò÷Væ–ær6†R6÷VÆ@¢òòW6Râ—B†öÆG27F–ÆÂöæRÖ÷&R&VB(	Bâ–FÆR—2w&÷VæFVBÂ7F–ÆÂÀ¢òòæB&V6†&ÆR(	BæBF†VâF¶W2F†R7v—RF‚ÂæWfW"F†R6ö–Âà¢–b‚F†—2æ†—E6–æ6R’F†—2æFVæ–VBÒ°¢F†—2æ†—E6–æ6RÒfÇ6S°¢–b‚‡F†—2æFVæ–VBÇÂ’ãÒ2’²F†—2æFVæ–VBÒ²F†—2çBÒãƒ²F†—2æÆ7DÖ÷fRÒw÷Væ6Rs²&WGW&ã²Ð¢òòD„R$õtÂ•24„õ%BäõrâFW7G2ö÷Væ–æw2æ6§2ÖV7W&VBF†R÷Væ–æp¢òògFW"÷Væ6RB"ãÓRãR3¢V'FW"×6V6öæBÆæF–ær6WGFÆRÂ¢òò†Æb×6V6öæB–FÆRÂæBF†VâãBÓ"ãB2öbvÆ¶–ær&Vf÷&RF†R6ö–À¢òòv2WfVâÆÆ÷vVBFòf—&RâF†RFö7G&–æR‚æ6ÆVFR÷6¶–ÆÇ2ð¢òò&÷72Ö÷Væ–æw2’WG2¦öæRÔ÷Væ–ærBöæR†—BÂvVæW&÷W2BGvòÀ¢òòæBv–gB7B“×2(	BöæRW"f–v‡BÂæBF†—2f–v‡Bw2v–gB—0¢òòF†RçVÆÂ7&6‚â6ó¢F†R6ö–ÂÖ’f—&R7G&–v‡B÷WBöbF†R–FÆP¢òòv†Vâ6†R—2–â—G2&æBæBF†RÆ7BÖ÷fRv2æ÷BÇ&VG’¢òò÷Væ6R‡&V6Væ7’FV'B(	B÷Væ6RÆö÷—2öæR6¶–ÆÂvV&–ær6öB’À¢òòæBF†R&÷vÂ–âg&öçBöbWfW'—F†–ærVÇ6R—2ãBÓã‚2à¢6öç7B–ä&æBÒF—7BâsbbF—7BÂCs°¢òòD„R5t•R5D%E2e$ôÒD„R”DÄR•Bt25DäD”är”ââ—BW6VBFò70¢òòF‡&÷Vv‚öæRg&ÖRöb7FÆ¶f—'7B(	BöæR6VÆÂöbÖ–B×7G&–FR&÷vÀ¢òòfÆ6†VB&WGvVVâF†R7FæF–ærÆ–öâæBF†R&—6–ærrÂ&Vf÷&P¢òòWfW'’7v—R–âF†Rf–v‡Bâ6ÖRFV6—6–öâÂ6ÖR&–÷&—G’‡F†RçVÆÀ¢òòf–VÆBæBF†RÖ'W6‚7F–ÆÂvòf—'7B’ÂöæRg&ÖR6ööæW"à¢6öç7BçVÆÄGVRÒF†—2æçVÆÅW6VBbbF†—2æ‡ÃÒF†—2æ‡Ö‚¢ãS°¢–b‚çVÆÄGVRbbF†—2æÖ'W6„4BâbbF—7BÂ3bbF†—2ç7v—T4BÃÒ’°¢F†—2ç7BÒw7v—Wv&âs²F†—2çBÒDTÄÅõ5t•S²F†—2çg‚Ò²F†—2æÆ7DÖ÷fRÒw7v—Rs²F†—2çGW&å7G&V²Ò°¢F†—2ç7v—T4BÒF†—2ç†6RÓÓÒ"ò&æBƒãrÂã’¢&æBƒã’Âã2“°¢ÒVÇ6R–b†–ä&æBbbF†—2æÆ7DÖ÷fRÓÒw÷Væ6Rr’°¢F†—2ç7BÒv7&÷V6‚s²F†—2çBÒF†—2ç†6RÓÓÒ"òã’¢ã²F†—2çGW&å7G&V²Ò²F†—2ç&WÆçFVBÒfÇ6S°¢F†—2çg‚Ò²F†—2æ6ö–ÅF–6²Ò²F†—2æ6ö–ÄfÆ6†VBÒfÇ6S²F†—2æÆ7DÖ÷fRÒw÷Væ6Rs°¢–b‡G—Vöbg‚ÓÓÒvgVæ7F–öâr’F†—2æ6ö–Äg‚Òg‚‚vvF†W"rÂF†—2æ7‚‚’ÂF†—2ç’²F†—2æ‚Ò3BÂ²'ƒ¢SÂ'“¢#ÂGW#¢F†—2çBÂ6öÃ¢DTÄÅô4ôÂÂ†÷C¢r6ffcfFbrÂföÆÆ÷s¢F†—2Â÷vW#¢ã’Ò“°¢ÒVÇ6R°¢F†—2ç7BÒF—7BâS#òw'Vâr¢w7FÆ²s²F†—2çBÒF†—2ç†6RÓÓÒ"ò&æBƒã2Âãb’¢&æBƒã3"Âãc"“°¢Ð¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw7FÆ²rÇÂF†—2ç7BÓÓÒw'Vâr’°¢òòÆ÷r&÷vÂF÷v&B–÷RÂF–VçBÂvF†W&–ær÷Væ6RF—7Fæ6P¢Æöö´B„ÖF‚ç6–vâ†F—7B’ÇÂ“°¢òòÖ–B×—f÷B—BÆçG3¢F†Rw2&R&R×Æ6–ærÂæ÷B&÷vÆ–ærÂæ@¢òòæ÷F†–ær—26†÷6VâVçF–ÂF†R&öG’f6W2v†B—B6†÷6P¢–b‡GW&æ–ær’°¢F†—2çg‚³Ò6Æ×‚×F†—2çg‚ÂÓC¢GBÂC¢GB“°¢F†—2ç&ö$4BÓÒGC²F†—2æÖ'W6„4BÓÒGC°¢ÒVÇ6R°¢–b†F—7BâS#’F†—2ç7BÒw'Vâs°¢VÇ6R–b†F—7BÂ3s’F†—2ç7BÒw7FÆ²s°¢6öç7B6RÒF†—2ç7BÓÓÒw'Vârò3¢‡F†—2ç†6RÓÓÒ"ò#¢ƒ“²òò&÷vÂcRÓâƒÂ'Vâ#ƒRÓâ3ƒ##bÓÓB¢6öç7BFW6—&VBÒF†—2æf6R¢6R¢7C°¢F†—2çg‚³Ò6Æ×†FW6—&VBÒF†—2çg‚ÂÓS¢GBÂS¢GB“°¢F†—2çBÓÒGC²F†—2ç&ö$4BÓÒGC²F†—2æÖ'W6„4BÓÒGC°¢–b‚F†—2æçVÆÅW6VBbbF†—2æ‡ÃÒF†—2æ‡Ö‚¢ãR’°¢òòåTÄÂu$d•E“¢öæ6RW"f–v‡BÂ&VÆ÷r†Æb†VÇF‚ÂF†Rf—'W0¢òò÷fW'&–FW2F†R&ööÒw2w&f—G’(	BF†R6†&vR×W—2F†RFVÆÀ¢F†—2æçVÆÅW6VBÒG'VS°¢F†—2ç7BÒvçVÆÆ6†&vRs²F†—2çBÒã²F†—2çg‚Ò²6g‚‚v67FçVÆÂr“°¢ÒVÇ6R–b‡F†—2æÖ'W6„4BÃÒ’°¢òò66âF†R&ööÒf÷"W&6†W2‚sÒrÆFf÷&Ò'Vç2¢6öç7BW"ÒµÓ°¢f÷"†ÆWBG“"Ò3²G“"Ârç&ööÔFVbæ‚Ò#²G“"²²’°¢ÆWB'VâÒ°¢f÷"†ÆWBGƒ"Ò²Gƒ"Ârç&ööÔFVbçs²Gƒ"²²’°¢6öç7B6ƒ"Òræw&–Bbbræw&–E·G“%Òbbræw&–E·G“%Õ·Gƒ%Ó°¢–b†6ƒ"ÓÓÒsÒr’'Vâ²³°¢VÇ6R²–b‡'VâãÒ2’W"çW6‚…²‡Gƒ"Ò'Vâò"’¢D”ÄRÂG“"¢D”ÄUÒ“²'VâÒ²Ð¢Ð¢–b‡'VâãÒ2’W"çW6‚…²„rç&ööÔFVbçrÒ'Vâò"’¢D”ÄRÂG“"¢D”ÄUÒ“°¢Ð¢–b‡W"æÆVæwF‚’°¢W"ç6÷'B‚†"Â#"’ÓâÖF‚æ'2†%³ÒÒF†—2æ7‚‚’’ÒÖF‚æ'2†#%³ÒÒF†—2æ7‚‚’’“°¢F†—2çW&6‚ÒW%³Ó°¢F†—2ç7BÒw7&–æwv&âs²F†—2çBÒãC#²F†—2çg‚Ò²F†—2æÆ7DÖ÷fRÒvF—fRs²F†—2çGW&å7G&V²Ò°¢òò—BÆöö·2BF†RÆVFvR—B—2&÷WBFòF¶R(	BæB–bF†BÆVFvR—0¢òò&V†–æB—BÂ—BGW&ç2Fò—BöâF†Rw&÷VæBÂ–ç6–FRF†RFVÆÀ¢F†—2æf6RÒÖF‚ç6–vâ‡W%³Õ³ÒÒF†—2æ7‚‚’’ÇÂF†—2æf6S°¢Ð¢F†—2æÖ'W6„4BÒ&æB‡F†—2ç†6RÓÓÒ"òb¢’ÂF†—2ç†6RÓÓÒ"ò’¢"“°¢ÒVÇ6R–b†F—7BÂ3bbF†—2ç7v—T4BÃÒ’°¢òòF†R6ÖRG&eU$ä4Rw26ÆÒv2–ã¢vFVBöâ&ævRÆöæRÂ6ò¢òòÆ–W"v†ò7F—2–âÖVÆVR6VW2öæRFVÆVw&‚æBæ÷F†–ærVÇ6P¢F†—2ç7BÒw7v—Wv&âs²F†—2çBÒDTÄÅõ5t•S²F†—2çg‚Ò²F†—2æÆ7DÖ÷fRÒw7v—Rs²F†—2çGW&å7G&V²Ò°¢òòã’Óã22Âv2ãRÓ"ãC¢ÖV7W&VB2ã"2÷Væ–ærgFW"WfW'¢òò7v—R‡sR’Âv†–6‚—2v–gBöâF†Rf–v‡Bw26öÖÖöæW7BÖ÷fRâF†P¢òò–FÆR&VÆ÷r—2F†R÷Væ–æs²F†R6ööÆF÷vâöæÇ’†2Fò÷WFÆ7B—Bà¢F†—2ç7v—T4BÒF†—2ç†6RÓÓÒ"ò&æBƒãrÂã’¢&æBƒã’Âã2“°¢Ð¢VÇ6R–b‡F†—2ç&ö$4BÃÒ’²F†—2ç7BÒw&ö"s²F†—2çBÒã#S²F†—2çg‚Ò²F†—2ç&ö&VBÒfÇ6S²F†—2ç&ö$4BÒ&æBƒRãRÂr“²F†—2æÆ7DÖ÷fRÒw&ö"s²F†—2çGW&å7G&V²Ò²Ð¢VÇ6R–b‡F†—2çBÃÒbbF—7BâsbbF—7BÂCs’°¢òòD„R4ô”Â•2D„Rd”t…Bu2$”ttU5B4TåDTä4RÂ6ò—BvWG26V6öæBà¢òð¢òò’6†÷'FVæVBF†—2FòF†—&Böb6V6öæBf—'7BÂöâF†RF†V÷'’F†@¢òò&WGFW"æ–ÖF–öâ'W—26†÷'FW"FVÆÂâw&öær–ç7F–æ7C¢F†—2—2F†P¢òòöæRÖ÷fR–âF†RVæ6÷VçFW"F†B6â7&÷72F†Rv†öÆR&VæÂæBF†P¢òòÆ–W"w2ç7vW"Fò—B—2æ÷BGv—F6‚Â—B—2FV6—6–öâ&÷W@¢òòv†W&RFò&RâFV6—6–öâæVVG2F–ÖRFòÖ¶RÂæBÖöÖVçBF†@¢òòÖGFW'26†÷VÆBÄôô²Æ–¶R—BÖGFW'2à¢òð¢òò6ò—B—2gVÆÂ6V6öæBöbÆ–öâvF†W&–ær—G6VÆb(	BF†R†—0¢òòÆöF–ærÂF†RfV–ç2'Vææ–ærg&öÒf—'W2W'ÆRFòv&æ–ærÖ&W"À¢òò7&·2VÆÆVB”åDòF†R†Væ6†W2&F†W"F†âF‡&÷vâöfbF†VÒÂ&70¢òò7&vÆ–ærWg&öÒF†Rw2ÂæBF†R6Æw26öÖ–ær÷WBâ6VP¢òò&V7D6ö–Äg‚âF†RF–ff–7VÇG’—2–Bf÷"öâF†R÷F†W"6–FS¢F†P¢òòÆVÆVG2†W"æ÷rÂæB–â†6RGvò—BÆæG2æBvöW2v–âà¢F†—2ç7BÒv7&÷V6‚s²F†—2çBÒF†—2ç†6RÓÓÒ"òã’¢ã²F†—2çGW&å7G&V²Ò²F†—2ç&WÆçFVBÒfÇ6S°¢F†—2çg‚Ò²F†—2æ6ö–ÅF–6²Ò²F†—2æ6ö–ÄfÆ6†VBÒfÇ6S²F†—2æÆ7DÖ÷fRÒw÷Væ6Rs°¢–b‡G—Vöbg‚ÓÓÒvgVæ7F–öâr’F†—2æ6ö–Äg‚Òg‚‚vvF†W"rÂF†—2æ7‚‚’ÂF†—2ç’²F†—2æ‚Ò3BÂ²'ƒ¢SÂ'“¢#ÂGW#¢F†—2çBÂ6öÃ¢DTÄÅô4ôÂÂ†÷C¢r6ffcfFbrÂföÆÆ÷s¢F†—2Â÷vW#¢ã’Ò“°¢Ð¢VÇ6R–b‡F†—2çBÃÒ’F†—2çBÒF†—2ç†6RÓÓÒ"ò&æBƒã2Âãb’¢&æBƒãBÂã‚“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw7v—Wv&âr’°¢òòF†Rr&—6W2(	BF†B—2–÷W"FVÆÀ¢F†—2çg‚Ò²F†—2çBÓÒGC²F†—2çv–æEBÒã3°¢–b‡F†—2çBÃÒ’²F†—2ç7BÒw7v—Rs²F†—2çBÒF†—2ç7v—VC"òãC‚¢ã#C²F†—2ç7v—VBÒfÇ6S²Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw7v—Rr’°¢F†—2çg‚Ò²F†—2çBÓÒGC°¢–b‚F†—2ç7v—VBbbF†—2çBÃÒ‡F†—2ç7v—VC"òã3b¢ã‚’’°¢F†—2ç7v—VBÒG'VS°¢F†—2å÷6Æ6…BÒãƒ°¢6öç7BbÒF†—2æf6RÇÂ°¢6öç7B&÷‚Ò²ƒ¢F†—2æ7‚‚’²†bâòb¢ÓB’Â“¢F†—2ç’Ò#BÂs¢‚Âƒ¢F†—2æ‚²#‚Ó°¢'W'7B‡F†—2æ7‚‚’²b¢cbÂF†—2æ7’‚’ÂÂr6#ffbrÂ#cÂã3RÂSÂ2ÂG'VR“°¢òòf÷W"6Æw2F‡&÷Vv‚F†R—"ÂW†7FÇ’÷fW"F†R&÷‚F†W’7G&–¶P¢–b‡G—Vöbg‚ÓÓÒvgVæ7F–öâr’g‚‚w6Æ6‚rÂF†—2æ7‚‚’²b¢CBÂF†—2æ7’‚’ÒBÂ²'ƒ¢BÂ'“¢“bÂGW#¢ã2ÂfÆ—¢bÂÂ÷vW#¢BÂ6öÃ¢r6#ffbrÂ†÷C¢r6cFSffbrÒ“°¢&V7E6÷VæB‚w7v—Rr“°¢–b‚Æ–W"æFVBbbÆ–W"æ•BÃÒbb&"†&÷‚ÂÆ–W"’’²Æ–W"æ‡W'B„Db‚’æVFÖrÂF†—2æ7‚‚’ÂF†—2æ¶–æB²râr²F†—2ç7B“²F†—2æFVæ–VBÒ‡F†—2æFVæ–VBÇÂ’²²F†—2æ†—E6–æ6RÒG'VS²Ð¢Ð¢òòdôÄÄõrÕD…$õTtƒ¢F†R&Æ÷r6'&–W2F†R&öG’7FWgFW"—BÂF†Rv¢òò&–r6Bw2vV–v‡BvöW2–çFò7G&–¶RâgFW"F†R†—B6†V6²öæÇ’À¢òò6òF†R7v—Rw2&V6‚†æB—G2ç7vW"Â÷WB×&ævR’—2Væ6†ævVBà¢–b‡F†—2ç7v—VB’F†—2çg‚Ò‡F†—2æf6RÇÂ’¢S¢6Æ×‡F†—2çBò‡F†—2ç7v—VC"òã3b¢ã‚’ÂÂ“°¢–b‡F†—2çBÃÒ’°¢òòÆ–öâ7v—W2Gv–6Rv†Vâ—B—2æw'¢òòÄ”ôâ5t•U2Et”4Rt„Tâ•B•2äu%’(	B'WB—BW6VBFòFò6òöâ¢òò6ö–âfÆ—Âv—F‚ã#"2FVÆÂâGvò6W&FRfVÇG2–âöæRÆ–æS ¢òòã#"2—2&VÆ÷rF†R&V7F–öâF–ÖRöbâETÅB‡ãã#R26–×ÆP¢òòf—7VÂÂ6Æ÷vW"v–âf÷"6†ö–6R&WGvVVâf÷W"GF6·2’ÂÆW@¢òòÆöæRF†R‚Ó–V"öÆBF†—2vÖR—2f÷#²æBf—&–ær—B†ÆbF†P¢òòF–ÖRÖVç2F†R6ÖR&VB&öGV6W2F–ffW&VçB÷WF6öÖW2Âv†–6‚—0¢òòv†B'VæÆV&æ&ÆR"ÖVç2â—B—2æ÷rÇv—2Gv–6R–â†6RGvòÀ¢òòv—F‚gVÆÂFVÆÂâF†R&W77W&R6öÖW2&6²26†÷'FW"v ¢òògFW'v&G2Âv†–6‚—2F†RÆWfW"F†BFöW2æ÷B6÷7B&VF&–Æ—G’à¢òòââääB”â„4RôäRÂEt”4R”b4„R5D•2†÷væW"Â##bÓÓ3¢&æ÷@¢òò6†ÆÆVæv–ærâââæ÷BW†6—F–ær#²##bÓÓC¢f–æ—6‚—B’âöæRrÂ¢òòÆöær&W7BÂöæRrÂÆöær&W7Bv2ÖWG&öæöÖR6†R6÷VÆBG&FP¢òò–çFòf÷&WfW"âæ÷rF†Rf—'7Br6·2VW7F–öã¢7F–ÆÂ–ç6–FR—G0¢òò&V6‚æB–âg&öçBöb—Bv†VâF†R&Æ÷rVæG2ÂæBF†R†Vg’&¶P¢òòföÆÆ÷w2(	Bv†öÆRFVÆÂÂ6ÖRç7vW"†ÆVfRÂ÷"vWB&V†–æB—B’â7FW ¢òò÷WBgFW"F†Rf—'7BæBæ÷F†–ær†26†ævVBâ6öæF—F–öæÂÂæ÷@¢òò&æFöÓ¢F†R6ÖR6†ö–6RÇv—2vWG2F†R6ÖRÆ–öâà¢6öç7B7F—2ÒF—7BÂSbb„ÖF‚ç6–vâ†F—7B’ÇÂF†—2æf6R’ÓÓÒF†—2æf6S°¢–b‚F†—2ç7v—VC"bb‡F†—2ç†6RÓÓÒ"ÇÂ7F—2’’²F†—2ç7v—VC"ÒG'VS²F†—2ç7BÒw7v—Wv&âs²F†—2çBÒDTÄÅõ5t•S²Ð¢VÇ6R²F†—2ç7v—VC"ÒfÇ6S²F†—2ç7BÒv–FÆRs²F†—2çBÒF†—2ç†6RÓÓÒ"ò&æBƒã3RÂãb’¢&æBƒã3BÂãS"“²Ð¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒv7&÷V6‚r’°¢òòfÆBFòF†Rw&÷VæBÂG&VÖ&Æ–ærv—F‚–çFVçB(	BF†VâF†R÷Væ6P¢F†—2çg‚Ò²F†—2çBÓÒGC²F†—2çv–æEBÒãC°¢°¢òòD„R4„$tRÂ„T$BäBdTÅBâFVÆÂ6'&–VBöâöæR6†ææVÂ—2¢òòFVÆÂ†ÆbF†R&ööÒÖ—76W3¢F†RÆFFW"6Æ–Ö'2–â—F6‚2F†P¢òò7&–ærv–æG2ÂF†RB6†¶W2†&FW"ÂæBF†RÆ7BV'FW"6V6öæ@¢òòG&VÖ&ÆW2F†R6ÖW&6ò—BÆæG2WfVâv—F‚F†R6÷VæBöfbà¢6öç7BGW"ÒF†—2ç†6RÓÓÒ"òã’¢ã°¢6öç7B²ÒÒÖF‚æÖ‚ƒÂÖF‚æÖ–âƒÂF†—2çBòGW"’“°¢F†—2æ6ö–Ä²Ò³°¢F†—2æ6ö–ÅF–6²Ò‡F†—2æ6ö–ÅF–6²ÇÂ’ÒGC°¢–b‡F†—2æ6ö–ÅF–6²ÃÒ’°¢F†—2æ6ö–ÅF–6²ÒãbÒ²¢ã“°¢6g„6†&vUF–6²ƒãR²²¢ãƒR“°¢–b‡G—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr’E'VÖ&ÆRƒã"²²¢ãRÂã²²¢ã3RÂ““°¢Ð¢–b†²âãsB’6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂãR²†²ÒãsB’¢B“°¢òòââææBF†RfÆ6‚—2âUdTåBÂ6ò—BvWG2öæR6÷VæBæBöæR¦öÇ@¢òò&F†W"F†â&V–ær'BöbF†R&×âF†—2—2F†R&VBF†BÖVç0¢òò&Ö÷fRæ÷r"ÂæB—BÆæG2v—F‚f–gF‚öb6V6öæB7F–ÆÂFòvòà¢–b†²âãƒbbF†—2æ6ö–ÄfÆ6†VB’°¢F†—2æ6ö–ÄfÆ6†VBÒG'VS°¢6g‚‚v6†&vU&VG’r“²6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂb“°¢ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚ÇÂÂã“°¢–b‡G—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr’E'VÖ&ÆRƒã‚ÂãSRÂC“°¢Ð¢Ð¢òòD„R$UÄåBâ6†R7&÷76VBVæFW"—BGW&–ærF†R6ö–Ââ—BW6VBFòÆVæ6€¢òòç—v’(	B&6·v&G2ÂF†R–7GW&RÖ—'&÷&–ær–âF†R—"öâF†Rv’â—@¢òò&R×ÆçG2æ÷s¢öæR—f÷BöâF†Rw&÷VæBÂ7F–ÆÂ6ö–ÆVBÂ7F–ÆÂÖ&W"À¢òòF†RfÆ6‚f—&VBv–âf÷"F†RæWrÆ–æR(	BæBF†Vâ—BvöW2âF†B—0¢òòãSB2Ö÷&Rv&æ–ærf÷"†W"‡F†RGW&âw2ãS"æBg&ÖRFòÆæ@¢òò—B’Â&÷Vv‡B'’'Vææ–ærB6ö–Æ–ærÆ–öâà¢–b‡F†—2çBÃÒbbF†—2ç&WÆçFVBbb„ÖF‚ç6–vâ†F—7B’ÇÂF†—2æf6R’ÓÒF†—2æf6R’°¢F†—2ç&WÆçFVBÒG'VS²F†—2æf6RÒÖF‚ç6–vâ†F—7B’ÇÂF†—2æf6S°¢F†—2çBÒãSC²F†—2æ6ö–ÄfÆ6†VBÒfÇ6S°¢Ð¢–b‡F†—2çBÃÒbbGW&æ–ær’°¢F†—2ç7BÒw÷Væ6Rs²F†—2ç&WÆçFVBÒfÇ6S°¢òòäB•BÄTE2„U"â–Ö–ærBv†W&R6†R—27FæF–ærÖ¶W2öæP¢òò6–FW7FWF†Rv†öÆRç7vW"(	B–÷R6â&VB—Bv—F†÷WBÖ÷f–ær–÷W ¢òòfVWBVçF–ÂF†RÆVæ6‚â–Ö–ærBv†W&R6†R—2tô”ärÖVç2F†P¢òòFöFvR†2Fò&R&VÂ6†ævRöbF—&V7F–öâÂv†–6‚—2F†Rf–v‡@¢òòF†—2Ö÷fRv2Çv—27W÷6VBFò&Rà¢ÆWBÆVBÒF—7B²‡Æ–W"çg‚ÇÂ’¢‡F†—2ç†6RÓÓÒ"òã#b¢ã‚“°¢òò4ôÔÔ•EDTC¢—BÆVfW2F†Rw&÷VæBÆöærF†RÆ–æR—G2&öG’—2öââ¢òò6V6öæB7&÷76–ærgFW"F†R&WÆçB—2&V†–æB—BÂæB—BFöW2æ÷@¢òòvWBF†—&B–Ò(	B—BÆæG2&öG’ÖÆVæwF‚†VBöb—G6VÆbà¢–b‚„ÖF‚ç6–vâ†ÆVB’ÇÂF†—2æf6R’ÓÒF†—2æf6R’ÆVBÒF†—2æf6R¢S°¢òòââæöâ„U"fÆö÷#¢ÆVB7÷BF†Bv÷VÆBWBF†R&öG’öâF÷ö`¢òòF†RgW&æ—GW&R&W6–FR†W"6Æ–FW2&6²ÆöærF†RÆVVçF–Â—@¢òòf—G2†&÷74ÆæD6ÆV"’(	BÆæF–ær6†R6ææ÷B&V6‚—2æòÆæF–æp¢ÆVBÒ&÷74ÆæD6ÆV"‡F†—2ÂF†—2æ7‚‚’²ÆVBÂÆ–W"ç’²Æ–W"æ‚’ÒF†—2æ7‚‚“°¢òòÄ”ôâu2ÄTÂäõB„õ†÷væW"Â##bÓ’Ó#s¢Ö÷fRÆ–¶RF†RÆ–öà¢òò¶–ærw2w&÷vâ6–Ö&’â—BW6VBFòÆVfRBC#Ócƒ‚÷2WVæFW ¢òò#w&f—G’(	BC"Ó‚6¶—ÂãBÓãcR2ÆöærÂfÆB7&÷72F†P¢òòfÆö÷"â—B—26öÇfVB2&VÂ&2æ÷s¢6WBfÆ–v‡BF–ÖRÂF†P¢òòÆVæ6‚7VVBF†BF–ÖRæVVG2ÂæBF†R'VâF†BÆæG2—BöâF†P¢òòÆVB7÷BâW‚#’Ósb‚ÂãsÓãƒ"2–âF†R—"ƒãc"ÓãsB–à¢òò†6RGvò’âFÖvR—27F–ÆÂF†RÄäD”är&÷‚öæÇ’Â6òF†Rç7vW ¢òò—2Væ6†ævVB(	BFòæ÷B&Rv†W&R—B6öÖW2F÷vâ(	BæBF†RÆöævW ¢òòfÆ–v‡Bv—fW2F†RW–RF†R&2Fò&VBF†RÆæF–ærg&öÒà¢6öç7B—"Ò‡F†—2ç†6RÓÓÒ"òãc"¢ãs’²ÖF‚æÖ–âƒã"ÂF—7BòC“°¢F†—2çg‚Ò6Æ×†ÆVBò—"ÂÓscÂsc’¢7C°¢F†—2çg’ÒÓ#¢—"ò#°¢F†—2æÆVCÒF†—2ææ–ÒÇÂ°¢F†—2æÆVGW&F–öâÒ—#°¢òòââææB—B6öÖW2F÷vâv†W&R4„R—2âS‚W‚6ÆV'2F†P¢òò&Væw2öæR×v’ÆVFvW2Â6òöâF†Rv’F÷vâ—Bv÷VÆBÆæBöâöæP¢òòæB6—B÷WBöb†W"&V6‚‡FW7G2ö÷Væ–æw2æ6§3¢&V6‚öbS0¢òòg&ÖW2’â–ÖVBBÆ–W"v†ò—2æ÷B&÷fR—BÂ—BfÆÇ2F‡&÷Vv€¢òòF†VÒFò†W"fÆö÷#²–ÖVBBÆ–W"ôâÆVFvRÂ—BÆæG2F†W&Rà¢F†—2çF‡'UÆBÒ‡Æ–W"ç’²Æ–W"æ‚’ãÒ‡F†—2ç’²F†—2æ‚’ÒC°¢&V7E6÷VæB‚vÆVr“°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂ’“°¢ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚ÇÂÂãb“°¢F†—2æ6ö–Ä²Ò°¢òòF†R7F÷&VB6†&vRÄTdU3¢&–æröb—B&Æ÷w2öfbF†R†–æBw0¢f÷"†ÆWB’Ò²’ÂC²’²²’°¢6öç7BÒ&æBƒ"ã"ÂBã“°¢FE'B‡F†—2æ7‚‚’ÒF†—2æf6R¢‚ÂF†—2ç’²F†—2æ‚Ò‚À¢ÖF‚æ6÷2†’¢&æBƒ#Â3’ÂÖF‚ç6–â†’¢&æBƒcÂ##’À¢&æBƒã#RÂãCR’Â’R2òDTÄÅô4ôÂ¢r6ffcfFbrÂ&æBƒ"ãRÂB’Â#ÂG'VR“°¢Ð¢–b‡G—Vöb&ö%vfRÓÓÒvgVæ7F–öâr¢&ö%vfR‡F†—2æ7‚‚’ÂF†—2ç’²F†—2æ‚ÒÂDTÄÅô4ôÂ“°¢–b‡G—Vöbg‚ÓÓÒvgVæ7F–öâr’°¢g‚‚vw&÷VæBrÂF†—2æ7‚‚’ÒF†—2æf6R¢#ÂF†—2ç’²F†—2æ‚Ò"Â²'ƒ¢“Â'“¢3ÂGW#¢ãRÂ6öÃ¢DTÄÅô4ôÂÂ†÷C¢r6ffcfFbrÂ÷vW#¢ã"Ò“°¢g‚‚vfÆ6‚rÂF†—2æ7‚‚’ÂF†—2ç’²F†—2æ‚Ò3Â²'ƒ¢SÂ'“¢SÂGW#¢ã#"Â6öÃ¢DTÄÅô4ôÂÂ†÷C¢r6fff&S‚rÒ“°¢Ð¢òòÆVæ6‚¶–6¶&6³¢F†R†–æBw2F‡&÷rF—'B÷WB&V†–æBF†RÆV ¢f÷"†ÆWB’Ò²’Âs²’²²¢FE'B‡F†—2æ7‚‚’ÒF†—2æf6R¢&æBƒÂC’ÂF†—2ç’²F†—2æ‚Ò&æBƒÂb’À¢×F†—2æf6R¢&æBƒƒÂ##’Â&æB‚ÓCÂÓ3’Â&æBƒã2ÂãR’Âr6#–ƒƒ‚rÂ&æBƒ"ãRÂB’Â#CÂG'VR“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw÷Væ6Rr’°¢òò—&&÷&æRÂ6Æw2f—'7BÂf—'W27G&VÖ–æröfbF†R6ö@¢–b†6†æ6RƒãR’’FE'B‡F†—2æ7‚‚’ÒF†—2æf6R¢3ÂF†—2æ7’‚’²&æB‚ÓBÂB’À¢×F†—2æf6R¢&æBƒcÂC’Â&æB‚ÓCÂC’Âã2Âr6#ffbrÂ"ãRÂÂG'VR“°¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw&ö"r’°¢F†—2çg‚Ò²F†—2çBÓÒGC°¢–b‚F†—2ç&ö&VB’°¢òòF†R–æ†ÆS¢f—'W2÷&"vF†W'2–âF†RF‡&öBæBÆö÷6Rw&÷Væ@¢òòFV'&—2G&–gG2Wv&B(	B&÷F‚67&VÒ&vWB6ÆV"äõr ¢–b†6†æ6Rƒãr’’FE'B‡F†—2æ7‚‚’²&æB‚Ó“Â“’ÂF†—2ç’²F†—2æ‚ÒBÀ¢&æB‚ÓRÂR’Â&æB‚ÓƒÂÓ3’ÂãRÂr3††“brÂ"ÂÓc“°¢–b†6†æ6Rƒã‚’’°¢6öç7BöÒ&æBƒÂbã#‚’Â÷#"Ò&æBƒ#bÂC‚“°¢FE'B‡F†—2æ7‚‚’²F†—2æf6R¢3²ÖF‚æ6÷2†ö’¢÷#"ÂF†—2æ7’‚’Òb²ÖF‚ç6–â†ö’¢÷#"À¢ÔÖF‚æ6÷2†ö’¢“RÂÔÖF‚ç6–â†ö’¢“RÂã2Âr6#ffbrÂ"ãRÂÂG'VR“°¢Ð¢Ð¢–b‚F†—2ç&ö&VBbbF†—2çBÃÒãsR’°¢F†—2ç&ö&VBÒG'VS°¢6Òç6†¶RÒ²&V7E6÷VæB‚w&ö"r“²ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚Âã‚“°¢F†—2ç&ö$'W§¥BÒãc°¢–b‡G—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr’E'VÖ&ÆRƒãƒRÂãcRÂS“°¢–b‡G—Vöb&ö%vfRÓÓÒvgVæ7F–öâr’&ö%vfR‡F†—2æ7‚‚’²F†—2æf6R¢3ÂF†—2æ7’‚’ÒÂr6#C†6fbr“°¢òòF†R&ö"2&W77W&RÆVf–ærF†RF‡&öBÂ&÷F‚v—3¢—B6†÷fW2g&öÒV—F†W"6–FP¢–b‡G—Vöbg‚ÓÓÒvgVæ7F–öâr’f÷"†6öç7B6Böb³ÂÓÒ¢g‚‚v6öæRrÂF†—2æ7‚‚’²6B¢3ÂF†—2æ7’‚’Ò"Â²'ƒ¢3Â'“¢##ÂGW#¢ãsRÂfÆ—¢6BÂÂ6öÃ¢r6#C†6fbrÂ†÷C¢r6fffffbrÂ÷vW#¢6BÓÓÒF†—2æf6Ròã"¢ã‚Ò“°¢–b‡G—VöbræFE&–ærÓÓÒvgVæ7F–öâr’ræFE&–ær‡F†—2æ7‚‚’ÂF†—2æ7’‚’Ò#“°¢òòF†R&ö"—G6VÆb6†÷fW2–÷Röfb–÷W"fVW@¢–b†F—7BÂ#SbbÆ–W"æFVB’°¢Æ–W"çg‚Ò„ÖF‚ç6–vâ†F—7B’ÇÂ’¢S#°¢Æ–W"çg’ÒÖF‚æÖ–â‡Æ–W"çg’ÂÓs“°¢Ð¢òòæBF†R6²ç7vW'0¢–b„ræVæVÖ–W2æf–ÇFW"†RÓâRæFVBbb†Ræ¶–æBÓÓÒv7&vÆW"rÇÂRæ¶–æBÓÓÒv†÷W"r’’æÆVæwF‚Â‡F†—2ç†6RÓÓÒ"ò"¢’’°¢6öç7Bw‚Ò6Æ×‡F†—2æ7‚‚’ÒF†—2æf6R¢SÂcÂrç&ööÔFVbçr¢D”ÄRÒc“°¢6öç7BvÂÒæWrVæV×’‚v7&vÆW"rÂw‚ÂF†—2ç’²F†—2æ‚Ò#b“°¢ræVæVÖ–W2çW6‚‡vÂ“°¢'W'7B‡w‚ÂF†—2ç’²F†—2æ‚ÒÂ"Âr6#ffbrÂ##ÂãRÂ#cÂ2ÂG'VR“°¢Ð¢Ð¢òòƒã"Óã3R26–æ6R##bÓÓC¢F†R6†÷fR†2§W7BWB†W"B÷Væ6P¢òò&ævRÂæBÆ–öâF†B&ö'2æBF†Vâ7G&öÆÇ2†2v7FVB—G2&ö"¢–b‡F†—2çBÃÒ’²F†—2ç7BÒw7FÆ²s²F†—2çBÒ&æBƒã"Âã3R“²Òòòv2ãbÓãÂæBãbÓ"ãb&Vf÷&RF†@¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw7&–æwv&âr’°¢òò7&÷V6†VBÂW–W2WBF†RW&6‚(	BGW7BÇ&VG’&—6–æröfb—G2&6°¢F†—2çg‚Ò²F†—2çg’Ò²F†—2çv–æEBÒã3°¢–b‚GW&æ–ær’F†—2çBÓÒGC²òòF†R7&÷V6‚—26÷VçFVBg&öÒF†RVæBöbF†R—f÷@¢–b†6†æ6RƒãB’’FE'B‡F†—2æ7‚‚’²&æB‚Ó#Â#’ÂF†—2ç’²&æBƒÂ’Â&æB‚Ó3Â3’Â&æB‚Ó#ÂÓc’Âã2Âr6#–ƒƒ‚rÂ"ÂÂG'VR“°¢–b‡F†—2çBÃÒ’°¢F†—2ç7BÒw7&–ærs²F†—2çRÒ°¢F†—2ç7‚ÒF†—2çƒ²F†—2ç7’ÒF†—2ç“°¢F†—2çG‚Ò6Æ×‡F†—2çW&6…³ÒÒF†—2çrò"ÂCÂrç&ööÔFVbçr¢D”ÄRÒF†—2çrÒC“°¢F†—2çG’ÒF†—2çW&6…³ÒÒF†—2æƒ°¢F†—2æf6RÒÖF‚ç6–vâ‡F†—2çG‚ÒF†—2ç‚’ÇÂ°¢&V7E6÷VæB‚vÆVr“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw7&–ærr’°¢òòöæR6ÆVâÆVöçFòF†RÆFf÷&Ð¢F†—2çR³ÒGBòãSS°¢6öç7BS"ÒÖF‚æÖ–âƒÂF†—2çR“°¢F†—2ç‚ÒÆW'‡F†—2ç7‚ÂF†—2çG‚ÂS"“°¢F†—2ç’ÒÆW'‡F†—2ç7’ÂF†—2çG’ÂS"’ÒÖF‚ç6–â‡S"¢ÖF‚å’’¢#°¢F†—2çg‚Ò‡F†—2çG‚ÒF†—2ç7‚’òãSS²F†—2çg’Ò°¢–b‡S"ãÒ’°¢F†—2ç‚ÒF†—2çGƒ²F†—2ç’ÒF†—2çG“²F†—2çg‚Ò°¢F†—2ç7BÒwW&6‚s²F†—2çBÒF†—2ç†6RÓÓÒ"òã¢ãC²F†—2çW&6…FöÆBÒfÇ6S°¢6Òç6†¶RÒS²&V7E6÷VæB‚vÆæBr“°¢òòw&—BVfg2öfbF†RÆVFvRv†W&RF†Rw2&—FRF÷và¢f÷"†ÆWB’Ò²’Âc²’²²¢FE'B‡F†—2æ7‚‚’²&æB‚Ó3BÂ3B’ÂF†—2ç’²F†—2æ‚Ò"À¢&æB‚Ó“Â“’Â&æB‚ÓsÂÓ"’Â&æBƒã#RÂãB’Âr6#–ƒƒ‚rÂ&æBƒ"Â2’ÂCÂG'VR“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒwW&6‚r’°¢òòWöâF†RÆVFvRÂG&6¶–ær–÷S²—BfÆGFVç2æBF†RW–RfÆ&W0¢òò–âF†RÆ7B†Æb6V6öæB(	BF†B—2F†RF—fR6öÖ–æp¢F†—2çg‚Ò²F†—2çg’Ò²F†—2çBÓÒGC°¢Æöö´B„ÖF‚ç6–vâ†F—7B’ÇÂ“°¢òòF†RF—fRw2FVÆVw&‚—2F†RÄ5BCS×2öbF†RW&6‚Âæ÷BF†Rv†öÆP¢òòöb—B(	B—B6—G2WF†W&RG&6¶–ær–÷Rf÷"6V6öæBf—'7BÂæB7VP¢òòöâVçG'’v÷VÆB&Rv&æ–ærF†B'&—fW2&Vf÷&RF†W&R—2ç—F†–æp¢òòFòv&â&÷WBâ6òF†R7FFRæÖRFVÆ–&W&FVÇ’7F—2÷WG6–FRDTÄÅõ5@¢òòæBF†R7VR—2f—&VB'’†æBÂBF†RÖöÖVçBF†R&öG’fÆGFVç2à¢–b‡F†—2çBÃÒãCR’°¢F†—2çv–æEBÒã3°¢–b‚F†—2çW&6…FöÆB’²F†—2çW&6…FöÆBÒG'VS²6g‚‚wFVÆÆ&–rr“²Ð¢Ð¢–b‡F†—2çBÃÒbbGW&æ–ær’°¢F†—2çGW&å7G&V²Ò°¢F†—2ç7BÒvF—fRs²F†—2çRÒ°¢F†—2ç7‚ÒF†—2çƒ²F†—2ç7’ÒF†—2ç“°¢F†—2çG‚Ò6Æ×‡‚ÒF†—2çrò"Â#Ârç&ööÔFVbçr¢D”ÄRÒF†—2çrÒ#“°¢F†—2çG’ÒÆ–W"ç’²Æ–W"æ‚ÒF†—2æƒ°¢F†—2æf6RÒÖF‚ç6–vâ‡F†—2çG‚ÒF†—2ç‚’ÇÂ°¢&V7E6÷VæB‚vÆVr“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvF—fRr’°¢òò6Æw2Öf—'7BG&÷öçFòF†R&W¢F†—2çR³ÒGBòãC#°¢6öç7BS"ÒÖF‚æÖ–âƒÂF†—2çR“°¢F†—2ç‚ÒÆW'‡F†—2ç7‚ÂF†—2çG‚ÂS"“°¢F†—2ç’ÒÆW'‡F†—2ç7’ÂF†—2çG’ÂS"¢S"“²òò66VÆW&F–ærfÆÀ¢F†—2çg‚Ò‡F†—2çG‚ÒF†—2ç7‚’òãC#²F†—2çg’Òc°¢–b†6†æ6Rƒãb’’FE'B‡F†—2æ7‚‚’ÒF†—2æf6R¢#bÂF†—2æ7’‚’²&æB‚ÓbÂb’Â×F†—2æf6R¢&æBƒcÂ3’Â&æB‚ÓcÂ3’Âã2Âr6#ffbrÂ"ãRÂÂG'VR“°¢–b‡S"ãÒ’°¢F†—2ç7BÒw&V6÷fW"s²F†—2çBÒF†—2ç†6RÓÓÒ"òã#"¢ã3²òòÖV7W&VBã2BãCRÂ“r×2Bã3b(	BF†R6V–Æ–ær—2“ ¢6Òç6†¶RÒ²&V7E6÷VæB‚vÆæBr“°¢–b‡G—Vöbg‚ÓÓÒvgVæ7F–öâr’°¢6öç7BÇ’ÒF†—2ç’²F†—2æ‚Ò#°¢g‚‚vw&÷VæBrÂF†—2æ7‚‚’ÂÇ’Â²'ƒ¢3Â'“¢CbÂGW#¢ãcRÂ6öÃ¢r6#ffbrÂ†÷C¢r6cF6fbrÂ÷vW#¢ã3RÒ“°¢g‚‚v7&6·2rÂF†—2æ7‚‚’ÂÇ’²2Â²'ƒ¢#Â'“¢3ÂGW#¢ãrÂ6öÃ¢r3†6FcrÂ†÷C¢r6cF6fbrÂ÷vW#¢ã2Ò“°¢g‚‚vfÆ6‚rÂF†—2æ7‚‚’ÂÇ’ÒbÂ²'ƒ¢“Â'“¢“ÂGW#¢ã#bÂ6öÃ¢r63c–&fbrÂ†÷C¢r6fffffbrÂ÷vW#¢ãRÒ“°¢Ð¢f÷"†ÆWB’Ò²’Â#²’²²¢FE'B‡F†—2æ7‚‚’²&æB‚×F†—2çr¢ãbÂF†—2çr¢ãb’ÂF†—2ç’²F†—2æ‚ÒBÀ¢&æB‚ÓƒÂƒ’Â&æB‚Ó#ÂÓS’ÂãCRÂr6#–ƒƒ‚rÂ2Â3ÂG'VR“°¢òòF†R†Vg’ÆæF–ærÆæwVvS¢Æ÷rGW7B&öÆÇ2÷WGv&BÆöærF†P¢òòw&÷VæBÂ6Æ÷rÆRÇVÖW2†ærÂæBfWrF&²6†—2fÇ¢f÷"†ÆWB’Ò²’Âƒ²’²²’°¢6öç7BG"Ò’R"ò¢Ó°¢FE'B‡F†—2æ7‚‚’²G"¢&æBƒ"ÂF†—2çr¢ã‚’ÂF†—2ç’²F†—2æ‚Ò2À¢G"¢&æBƒ3Â3’Â&æB‚Ó3bÂÓb’Â&æBƒãRÂãƒR’Âr66F&C–2rÂ&æBƒ2ãRÂRãR’Âs“°¢Ð¢f÷"†ÆWB’Ò²’ÂC²’²²¢FE'B‡F†—2æ7‚‚’²&æB‚Ó3Â3’ÂF†—2ç’²F†—2æ‚Ò&æBƒBÂB’À¢&æB‚ÓCÂC’Â&æB‚Ó“ÂÓC’Â&æBƒãbÂã’’Âr3†cƒCfbrÂ&æBƒBÂb’Â3“°¢f÷"†ÆWB’Ò²’Â3²’²²¢FE'B‡F†—2æ7‚‚’²&æB‚Ó#Â#’ÂF†—2ç’²F†—2æ‚ÒbÀ¢&æB‚Ó#CÂ#C’Â&æB‚Ó#cÂÓC’ÂãRÂr3††“brÂ"ãRÂsÂG'VR“°¢6öç7B&÷‚Ò²ƒ¢F†—2æ7‚‚’Ò“"Â“¢F†—2ç’Ò‚Âs¢ƒBÂƒ¢F†—2æ‚²#"Ó°¢–b‚Æ–W"æFVBbbÆ–W"æ•BÃÒbb&"†&÷‚ÂÆ–W"’’²Æ–W"æ‡W'B„Db‚’æVFÖrÂF†—2æ7‚‚’ÂF†—2æ¶–æB²râr²F†—2ç7B“²F†—2æFVæ–VBÒ‡F†—2æFVæ–VBÇÂ’²²F†—2æ†—E6–æ6RÒG'VS²Ð¢–b‡F†—2ç†6RÓÓÒ"bbG—VöbræFE&–ærÓÓÒvgVæ7F–öâr’ræFE&–ær‡F†—2æ7‚‚’ÂF†—2ç’²F†—2æ‚Ò‚“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw&V6÷fW"r’°¢òò&VBöb7F–ÆÆæW72gFW"F†RÆæF–ær(	B–÷W"v–æF÷p¢F†—2çg‚£Òãƒ²F†—2çBÓÒGC°¢òò6WGFÆR²–FÆR—2F†Rv–æF÷s¢ã3b²ã3RâããSRÒF†RF‡&VRÖ†—@¢òò6öÖ&òƒãs"2’æBæòÖ÷&R(	BF†R&÷vÂgFW"—BæòÆöævW"6÷VçG0¢òò•BÄäE2äBtôU2t”ââ÷Væ6RF†B6ÖRF÷vâ&W6–FR†W"W6VBFð¢òò&RföÆÆ÷vVB'’F†—&Böb6V6öæBöb6WGFÆRÂæ÷F†W"F†—&Bö`¢òò7FæF–ærÂæB7G&öÆÂ(	BF†RÆ–öâ†æF–ærF†Rf–v‡B&6²gFW"—G0¢òò&–vvW7BÖ÷fRÂWfW'’F–ÖRâ–b6†R—27F–ÆÂ–ç6–FRF†Rrw2&V6€¢òòæB–âg&öçBöb—Bv†Vâ—B†2—G2fVWBÂF†Rr—2Ç&VG’6öÖ–æp¢òòW¢F†R6WGFÆR—2F†R÷Væ–ær†öæR†—BÂ3×2æBÖ÷&R’ÂæBF†P¢òò7v—RF†BföÆÆ÷w2†2—G2v†öÆRFVÆÂâ7F––ærFòG&FR—2¢òò6†ö–6Ræ÷rÂæB6ò—2ÆVf–ærà¢–b‡F†—2çBÃÒ’°¢6öç7B6†–âÒF—7BÂ3Rbb„ÖF‚ç6–vâ†F—7B’ÇÂF†—2æf6R’ÓÓÒF†—2æf6RbbGW&æ–ærbbF†—2ç7v—T4BÃÒãP¢bb‚F†—2æçVÆÅW6VBbbF†—2æ‡ÃÒF†—2æ‡Ö‚¢ãR’bb‡F†—2æçVÆÅ6Wâ“°¢òòäB”â„4REtò•BÄT2t”ââ6†RFöFvVBF†Rf—'7B÷Væ6Ræ@¢òò—27FæF–ærB÷Væ6R&ævRÂ–âg&öçBöb—C¢—B6ö–Ç27G&–v‡B÷W@¢òòöbF†RÆæF–ær(	BãsR2Â&÷fRF†R†Vg’×FVÆÂfÆö÷"Âv—F‚WfW'¢òò6†ææVÂF†Rf—'7B6ö–Â†2(	Böæ6RâF†R6V6öæBÆæF–ær6WGFÆW2æ@¢òò&W7G2Æ–¶Rç’÷F†W"Â6òF†R—"7F–ÆÂVæG2–ââ÷Væ–ærà¢6öç7Bv–âÒF†—2ç†6RÓÓÒ"bbF†—2ç÷Væ6VC"bbGW&æ–ærbbF—7BâsbbF—7BÂCs ¢bb„ÖF‚ç6–vâ†F—7B’ÇÂF†—2æf6R’ÓÓÒF†—2æf6Rbb‡F†—2æçVÆÅ6Wâ’bb‡F†—2æFVæ–VBÇÂ’Â#°¢–b†6†–â’°¢F†—2ç7BÒw7v—Wv&âs²F†—2çBÒDTÄÅõ5t•S²F†—2çg‚Ò²F†—2æÆ7DÖ÷fRÒw7v—Rs²F†—2çGW&å7G&V²Ò²F†—2ç÷Væ6VC"ÒfÇ6S°¢F†—2ç7v—T4BÒF†—2ç†6RÓÓÒ"ò&æBƒãrÂã’¢&æBƒã’Âã2“°¢ÒVÇ6R–b†v–â’°¢F†—2ç÷Væ6VC"ÒG'VS°¢F†—2ç7BÒv7&÷V6‚s²F†—2çBÒãsS²F†—2çGW&å7G&V²Ò²F†—2ç&WÆçFVBÒfÇ6S°¢F†—2çg‚Ò²F†—2æ6ö–ÅF–6²Ò²F†—2æ6ö–ÄfÆ6†VBÒfÇ6S²F†—2æÆ7DÖ÷fRÒw÷Væ6Rs°¢–b‡G—Vöbg‚ÓÓÒvgVæ7F–öâr’F†—2æ6ö–Äg‚Òg‚‚vvF†W"rÂF†—2æ7‚‚’ÂF†—2ç’²F†—2æ‚Ò3BÂ²'ƒ¢SÂ'“¢#ÂGW#¢F†—2çBÂ6öÃ¢DTÄÅô4ôÂÂ†÷C¢r6ffcfFbrÂföÆÆ÷s¢F†—2Â÷vW#¢ã’Ò“°¢ÒVÇ6R²F†—2ç7BÒv–FÆRs²F†—2çBÒ&æBƒã3ÂãCR“²F†—2ç÷Væ6VC"ÒfÇ6S²Ð¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw&–æv6†&vRr’°¢F†—2çg‚Ò²F†—2æçuBÓÒGC°¢6öç7B¶²ÒÒ6Æ×‡F†—2æçuBòãrÂÂ“°¢f÷"†ÆWB’Ò²’Â#²’²²’°¢6öç7B"Ò&æBƒÂbã#‚’Â'#"Ò3Ò¶²¢“#°¢FE'B‡F†—2æ7‚‚’²ÖF‚æ6÷2†"’¢'#"ÂF†—2æ7’‚’²ÖF‚ç6–â†"’¢'#"À¢ÔÖF‚æ6÷2†"’¢#ÂÔÖF‚ç6–â†"’¢#Âã2ÂDTÄÅô4ôÂÂ"ãbÂÂG'VR“°¢Ð¢–b‡F†—2æçuBÃÒ’°¢F†—2ç&–ær‚‡F†—2ç†6RÓÓÒ"òB¢’²‡F†—2æÕ†6RÇÂ’¢"Â#3¢„Db‚’æW7BÇÂ’ÂF†—2ææ–Ò“°¢F†—2ç7BÒv–FÆRs²F†—2çBÒ&÷75&W7B‡F†—2Âã“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvçVÆÆ6†&vRr’°¢òòFVB7F–ÆÂv†–ÆRf—'W2Æ–v‡B7&vÇ2WöfbF†RfÆö÷"æB–÷W ¢òò÷vâ§V×27F'BFòfVVÂw&öær(	Bw&f—G’—2&V–ærVçÇVvvV@¢F†—2çg‚Ò²F†—2çBÓÒGC²F†—2çv–æEBÒã3°¢ræÆ÷tw&eBÒÖF‚æÖ‚„ræÆ÷tw&eBÇÂÂãR“°¢–b†6†æ6Rƒã’’’FE'B‡&æBƒCÂrç&ööÔFVbçr¢D”ÄRÒC’Ârç&ööÔFVbæ‚¢D”ÄRÒÀ¢&æB‚ÓÂ’Â&æB‚ÓsÂÓ#R’ÂãbÂr6#ffbrÂ"ãRÂÓCÂG'VR“°¢–b‡F†—2çBÃÒ’°¢F†—2æçVÆÅ6WÒ3°¢F†—2ç7BÒvçVÆÆ†÷s²F†—2çBÒã#°¢ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚Âã#R“²6Òç6†¶RÒc²&V7E6÷VæB‚w&ö"r“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvçVÆÆ†÷r’°¢òò&WGvVVâF†Rf–VÆB÷Væ6W3¢â–ç7FçB6ö–ÂÂF†VâÆVæ6‚(	BF†P¢òòf–VÆB—G6VÆb—2F†Rv–æB×WÂF†R÷Væ6W2†fRæöæP¢F†—2çg‚Ò²F†—2çBÓÒGC°¢ræÆ÷tw&eBÒÖF‚æÖ‚„ræÆ÷tw&eBÇÂÂã"“°¢–b†6†æ6RƒãR’’FE'B‡&æBƒCÂrç&ööÔFVbçr¢D”ÄRÒC’Â&æBƒcÂrç&ööÔFVbæ‚¢D”ÄRÒS’À¢&æB‚Ó#Â#’Â&æB‚Ó3Â’ÂãRÂr6#ffbrÂ"ÂÂG'VR“°¢òòV6‚f–VÆB÷Væ6RGW&ç2Fò†W"öâF†Rw&÷VæB&Vf÷&R—BÆVfW2—@¢–b‚GW&æ–ær’F†—2æf6RÒÖF‚ç6–vâ†F—7B’ÇÂF†—2æf6S°¢–b‡F†—2çBÃÒbbÖF‚æ'2‚‡F†—2æf6Uf—2ÓÒçVÆÂòF†—2æf6R¢F†—2æf6Uf—2’ÒF†—2æf6R’ÃÒã"’°¢6öç7BC"Ò‚ÒF†—2æ7‚‚“°¢F†—2çg‚Ò6Æ×†C"¢ã’ÂÓs#Âs#’¢7C°¢F†—2çg’ÒÒƒ3ƒ²ÖF‚æÖ–âƒ#CÂÖF‚æ'2†C"’¢ãCR’“°¢F†—2æÆVCÒF†—2ææ–ÒÇÂ°¢F†—2æÆVGW&F–öâÒÓ"¢F†—2çg’ò#°¢F†—2ç7BÒw÷Væ6Rs²&V7E6÷VæB‚vÆVr“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvçVÆÆVæBr’°¢òòF†Rf–VÆB6öÆÆ6W3¢WfW'—F†–ær6Æ×2&6²F÷vâæBåTÄÄdäp¢òòÆæG2†&BÂ7GVææVB(	BF†RÆöævW7Bv–æF÷r–âF†Rf–v‡@¢F†—2çg‚Ò²F†—2çBÓÒGC°¢–b‚F†—2æçVÆÄ7&6‚’°¢F†—2æçVÆÄ7&6‚ÒG'VS°¢ræÆ÷tw&eBÒ°¢f÷"†ÆWB’Ò²’Âc²’²²¢FE'B‡&æBƒCÂrç&ööÔFVbçr¢D”ÄRÒC’Â&æBƒƒÂrç&ööÔFVbæ‚¢D”ÄRÒƒ’À¢Â&æBƒ3ÂS#’ÂãRÂr3††“brÂ2Âc“°¢6Òç6†¶RÒ“²6g‚‚wV¶Rr“°¢Ð¢F†—2ç7FuBÒÖF‚æÖ‚‡F†—2ç7FuBÂã2“°¢–b‡F†—2çBÃÒ’²F†—2ç7BÒv–FÆRs²F†—2çBÒ&æBƒãbÂã“²F†—2æçVÆÄ7&6‚ÒfÇ6S²Ð¢Ð¢–b‡F†—2ç7BÓÒw÷Væ6Rr’F†—2çF‡'UÆBÒfÇ6S°¢–b‡F†—2ç7BÓÓÒw÷Væ6RrbbF†—2æçVÆÅ6Wâ’ræÆ÷tw&eBÒÖF‚æÖ‚„ræÆ÷tw&eBÇÂÂã"“°¢6öç7B6öÂÒ‡F†—2ç7BÓÓÒw7&–ærrÇÂF†—2ç7BÓÓÒvF—fRr’ò·Ò¢Ö÷fTVçB‡F†—2ÂGB“°¢–b‡F†—2ç7BÓÓÒw÷Væ6Rrbb6öÂæB’°¢6Òç6†¶RÒƒ²&V7E6÷VæB‚vÆæBr“°¢òòD„RÄäD”äs¢vfRÆöærF†Rw&÷VæBÂF†Rw&÷VæB—G6VÆb7&6¶–æp¢òòÆ–v‡BVæFW"F†Rf÷&Ww2æB6ööÆ–ærÂæBF†RÆ–v‡BöbF†R†—@¢–b‡G—Vöbg‚ÓÓÒvgVæ7F–öâr’°¢6öç7BÇ‚ÒF†—2æ7‚‚’²F†—2æf6R¢#BÂÇ’ÒF†—2ç’²F†—2æ‚Ò#°¢g‚‚vw&÷VæBrÂÇ‚ÂÇ’Â²'ƒ¢#SÂ'“¢CÂGW#¢ãbÂ6öÃ¢r6#ffbrÂ†÷C¢r6cF6fbrÂ÷vW#¢ã#RÒ“°¢g‚‚v7&6·2rÂÇ‚ÂÇ’²2Â²'ƒ¢sÂ'“¢#bÂGW#¢ãRÂ6öÃ¢r3†6FcrÂ†÷C¢r6cF6fbrÂ÷vW#¢ã"Ò“°¢g‚‚vfÆ6‚rÂÇ‚ÂÇ’ÒBÂ²'ƒ¢SÂ'“¢SÂGW#¢ã#BÂ6öÃ¢r63c–&fbrÂ†÷C¢r6fffffbrÒ“°¢Ð¢–b‡G—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr’E'VÖ&ÆR‚ãcRÂã3RÂc“°¢f÷"†ÆWB’Ò²’Â²’²²¢FE'B‡F†—2æ7‚‚’²&æB‚×F†—2çr¢ãRÂF†—2çr¢ãR’ÂF†—2ç’²F†—2æ‚ÒBÀ¢&æB‚ÓcÂc’Â&æB‚ÓƒÂÓC’ÂãBÂr6#–ƒƒ‚rÂ2Â3ÂG'VR“°¢òò†Vf–W"ÆæF–æs¢GW7B&öÆÇ2Æ÷ræBv–FRöfbF†Rf÷&Ww0¢f÷"†ÆWB’Ò²’Âc²’²²’°¢6öç7BG"Ò’R"ò¢Ó°¢FE'B‡F†—2æ7‚‚’²F†—2æf6R¢#²G"¢&æBƒ‚ÂF†—2çr¢ãb’ÂF†—2ç’²F†—2æ‚Ò2À¢G"¢&æBƒÂ#S’Â&æB‚Ó3ÂÓb’Â&æBƒãCRÂãr’Âr66F&C–2rÂ&æBƒ2ÂR’Âs“°¢Ð¢f÷"†ÆWB’Ò²’Â3²’²²¢FE'B‡F†—2æ7‚‚’²&æB‚Ó#BÂ#B’ÂF†—2ç’²F†—2æ‚Ò&æBƒBÂ"’À¢&æB‚Ó3Â3’Â&æB‚ÓƒÂÓ3R’Â&æBƒãSRÂã‚’Âr3†cƒCfbrÂ&æBƒ2ãRÂRãR’Â3“°¢6öç7B&÷‚Ò²ƒ¢F†—2æ7‚‚’ÒƒÂ“¢F†—2ç’Âs¢cÂƒ¢F†—2æ‚²‚Ó°¢–b‚Æ–W"æFVBbbÆ–W"æ•BÃÒbb&"†&÷‚ÂÆ–W"’’²Æ–W"æ‡W'B„Db‚’æVFÖrÂF†—2æ7‚‚’ÂF†—2æ¶–æB²râr²F†—2ç7B“²F†—2æFVæ–VBÒ‡F†—2æFVæ–VBÇÂ’²²F†—2æ†—E6–æ6RÒG'VS²Ð¢–b‡F†—2æçVÆÅ6Wâ’°¢F†—2æçVÆÅ6WÒÓ°¢–b‡F†—2æçVÆÅ6Wâ’²F†—2ç7BÒvçVÆÆ†÷s²F†—2çBÒãc²Ð¢VÇ6R²F†—2ç7BÒvçVÆÆVæBs²F†—2çBÒãS²Ð¢ÒVÇ6R°¢òòF†RVæ—6‚v–æF÷s¢ÆöærVæ÷Vv‚f÷"F†RF‡&VRÖ†—B6öÖ&òÂæ÷Bf÷ ¢òòF‡&VRöbF†VÐ¢F†—2ç7BÒw&V6÷fW"s²F†—2çBÒF†—2ç†6RÓÓÒ"òã#b¢ã3c°¢F†—2æÆæDBÒF†—2ææ–ÒÇÂ²òòG&t&V7Bw2F÷V6†F÷vâ7V6€¢Ð¢Ð¢òò„•BU4TBDòEU$â$õTäBBtÄÂ„U$R(	Bf6R£ÒÓöâç’6–FR6öçF7BÀ¢òòG&öÂw2&VfÆW‚ÆVgB÷fW"g&öÒ&Vf÷&R—B‡VçFVBâv†–ÆRf6–ærv0¢òò&RÖ–ÖVBWfW'’g&ÖRF†BfÆ—v2÷fW'w&—GFVâ&Vf÷&Rç–öæR6r—Bà¢òòöæ6RGW&â&V6ÖRöæR6öÖÖ—GFVB—f÷Bƒ##bÓÓ2’—Bv2æ÷C¢&W76V@¢òòv–ç7B&—6R–âF†RÖVF÷rv—F‚†W"&W–öæB—BÂF†RÆ–öâ—f÷FVBv’À¢òò—f÷FVB&6²Âv26÷VçFVB2Fæ6VBÖ&÷VæBÂæB&ö&VB(	B÷fW"æB÷fW"À¢òòæWfW"6ö–Æ–ærÂf–ÆÖVBöâ'V–ÆBC3#vVVCsfSƒ"â—B‡VçG3²—B†2æòvÆÀ¢òòFòG&öÂFòâÆöö´B‚’÷vç2—G2f6–æræBæ÷F†–ærVÇ6RFöW2â¢òòåD’ÕtTDtRtD4„Dôs¢F—fR6âVæB&VæVF‚ÆVFvRæB¦ÒF†P¢òò‡VçFW"–âÆ6Râ–b—B7F÷2&Vv—7FW&–ærÖ÷fVÖVçBf÷""ãg2–âà¢òò7F—fR7FFR—Bu$Tä4„U2—G6VÆbg&VRF÷v&B÷VâfÆö÷"(	BæB–`¢òòF†Bf–Ç2Gv–6RÖ÷&RÂ—B&RÖVçFW'26ÆVâg&öÒ—G27vâö–çBà¢°¢–b‡F†—2çvE‚ÓÒçVÆÂ’²F†—2çvE‚ÒF†—2çƒ²F†—2çvE’ÒF†—2ç“²F†—2çvEBÒ²Ð¢6öç7B7F—fU7BÒF†—2ç7BÓÓÒw7FÆ²rÇÂF†—2ç7BÓÓÒw'VârÇÂF†—2ç7BÓÓÒw&V6÷fW"p¢ÇÂF†—2ç7BÓÓÒw÷Væ6RrÇÂF†—2ç7BÓÓÒv7&÷V6‚rÇÂF†—2ç7BÓÓÒvçVÆÆVæBs°¢òòÄT5E$”t…BU•2äõBtTDtRâF†RvF6†FöröæÇ’vF6†VB‚Â6ð¢òò6ö–ÂÂ÷Væ6RBÆ–W"7FæF–ær&–v‡BVæFW"F†RÆæF–ær7÷@¢òò‡F†RÆVvöW2WæB6öÖW2F÷vâv†W&R—BÆVgB’æB—G2ÆæF–æp¢òò6WGFÆRFFVBWFò"ãb2öb&æòÖ÷fVÖVçB"(	BæB—Bf—&VBw&Væ6€¢òò÷Væ6R÷WBöbF†RVæ—6‚v–æF÷rcr×2–â‡FW7G2ö÷Væ–æw2æ6§2À¢òò÷Væ6Sç&V6÷fW"Â6VVBv†W&RF†RÆæF–ær†Bæ÷v†W&RFò6Æ–FR’à¢–b‡F†—2çvE’ÓÒçVÆÂ’F†—2çvE’ÒF†—2ç“°¢–b„ÖF‚æ'2‡F†—2ç‚ÒF†—2çvE‚’âÇÂÖF‚æ'2‡F†—2ç’ÒF†—2çvE’’â#BÇÂ7F—fU7BÇÂF†—2ç7FuBâ’°¢F†—2çvE‚ÒF†—2çƒ²F†—2çvE’ÒF†—2ç“²F†—2çvEBÒ°¢ÒVÇ6R–b‚‡F†—2çvEB³ÒGB’â"ãb’°¢F†—2çvEBÒ²F†—2çvE‚ÒF†—2çƒ²F†—2çvE’ÒF†—2ç“°¢F†—2çvVFvVBÒ‡F†—2çvVFvVBÇÂ’²°¢6öç7BÖ–BÒrç&ööÔFVbçr¢D”ÄRò#°¢–b‡F†—2çvVFvVBãÒ2’°¢F†—2ç‚ÒF†—2ç7våƒ²F†—2ç’ÒF†—2ç7vå“²F†—2çg‚Ò²F†—2çg’Ò°¢F†—2ç7BÒw7FÆ²s²F†—2çBÒãS²F†—2çvVFvVBÒ°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂBÂr6#ffbrÂ#ÂãRÂÂ2ÂG'VR“°¢ÒVÇ6R°¢F†—2ç7BÒw÷Væ6Rs°¢F†—2çg’ÒÓSc²F†—2çg‚Ò†Ö–BâF†—2æ7‚‚’ò¢Ó’¢3°¢F†—2æf6RÒÖF‚ç6–vâ‡F†—2çg‚’ÇÂ°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂB“²6g‚‚vF6‚r“°¢f÷"†ÆWB’Ò²’Âƒ²’²²¢FE'B‡F†—2æ7‚‚’²&æB‚Ó#BÂ#B’ÂF†—2ç’²F†—2æ‚ÒBÀ¢&æB‚Ó#Â#’Â&æB‚ÓcÂÓC’ÂãBÂr6#–ƒƒ‚rÂ"ãRÂ3ÂG'VR“°¢Ð¢Ð¢Ð¢'&V³°¢Ð¢òòÒÒÒÒ'&ööFÖ÷F†W#¢†æw2&÷fRÂ7vç2æB6Æ×2ÒÒÒÐ¢66Rv'&ööBs¢°¢òòÒÒÒÒDÄôä„õ5C¢†æw2g&öÒF†R6V–Æ–ærÖ÷VçBÂ&–ç2ÖWFÆÆ–0¢òòfVF†W'2–âfç2Â7vö÷2F‡&÷Vv‚F†R&Væv—F‚v–æBv¶RÂæ@¢òò×W7B6öÖRF÷vâÆ÷rFò&W7B—G2v–æw2(	BF†Bw2–÷W"v–æF÷rÒÒÒÐ¢F†—2æ&44BÒF†—2æ&44BÓÒçVÆÂò’¢F†—2æ&44BÒGC°¢òò7FvvW"æ÷r6w2†W"F÷v&BF†RfÆö÷"‡6VRF†R7FuB&Æö6²“²6†P¢òò4Ä”Ô%2&6²FòF†R6&ÆRg&öÒF†W&RÂ6†RFöW2æ÷B&Æ–æ²WFò—@¢–b‡F†—2ç7BÓÓÒv–FÆRrbbF†—2ç’âF†—2æ†öÖU’²C’²F†—2ç7BÒw&—6Rs²F†—2çBÒã²Ð¢–b‡F†—2ç7BÓÓÒv–FÆRr’°¢òò•BtTåB„ôÔR$UEtTTâ54U2â&WGW&æ–ærFò7vâ—2F†RöæRÆ6R–à¢òòF†R&VæF†RÆ–W"æWfW"†2Fò&RÂ6òWfW'’&VB&WGvVVâGF6·0¢òòv2F†RVvÆRG&–gF–ært’(	BF†R÷÷6—FRöb&W77W&Râ—B†öÆG2¢òò7FF–öâöfb†W"6†÷VÆFW"æ÷rÂ7v–ær6–FW2ÂF†Rv’&—&BF†B—0¢òò‡VçF–ær–÷R7GVÆÇ’&V†fW2à¢–b‡F†—2çW&6…BÓÒçVÆÂÇÂ‡F†—2çW&6…BÓÒGB’ÃÒ’°¢F†—2çW&6…6–FRÒ†6†æ6RƒãR’òÓ¢“°¢F†—2çW&6…BÒ&æBƒãBÂ"ãB“°¢Ð¢°¢6öç7B%rÒrç&ööÔFVbçr¢D”ÄS°¢6öç7BFwBÒ6Æ×‡‚²F†—2çW&6…6–FR¢&æBƒ#ÂS’ÂƒÂ%rÒƒ’ÒF†—2çrò#°¢F†—2ç‚ÒÆW'‡F†—2ç‚ÂFwBÂÖF‚æÖ–âƒÂGB¢ãb’“°¢Ð¢F†—2ç’ÒF†—2æ†öÖU’²ÖF‚ç6–â‡F†—2ææ–Ò¢ãb’¢ƒ°¢F†—2çBÓÒGC°¢–b‚F†—2æg&÷¦UW6VBbbF†—2æ‡ÃÒF†—2æ‡Ö‚¢ãB’°¢òò4ôôÄåBe$TU¤S¢öæ6RW"f–v‡BF†R'WGW&VB6ööÆçB7—7FVÐ¢òòG&÷2—B÷WBöbF†R6·’(	BâVæ6öçG&öÆÆVBfÆÂÂæ÷B7vö÷ ¢F†—2æg&÷¦UW6VBÒG'VS°¢F†—2ç7BÒv6f7&6‚s²F†—2çg’Òc²6g‚‚v‡W'Br“°¢F†—2æ6%bÒ‡F†—2æ6%bÇÂ’²"ã²òòF÷&âg&VR(	BF†R6&ÆRv†—0¢ÒVÇ6R–b‡F†—2çBÃÒbbF†—2æ&44BÃÒ’°¢òò%$ôôB4ÄÃ¢F†RFW'&—F÷&–Â67&VV6‚F†B7VÖÖöç2—G2'&öö@¢F†—2ç7BÒv'&ööF6ÆÂs²F†—2çBÒãc°¢F†—2æ&44BÒ&æBƒ"Âb“²F†—2æ&4âÒF†—2ç†6RÓÓÒ"òB¢3°¢F†—2æ&5BÒãS²F†—2æ&47&–VBÒfÇ6S°¢ÒVÇ6R–b‡F†—2çBÃÒ’°¢òòD„RDT4²Â'’v†W&R6†R7FæG2(	BF†Rf—†VB7–6ÆR²²RF‡föÆÆW’À¢òò7vö÷ÂföÆÆW’Â&W7B’F‡&WrF†R6ÖRf÷W"&VG2BÆ–W"–âF†P¢òòÖ–FFÆRöbF†R&VææBöæR&W76VB–çFò6÷&æW"âF†Rfâ&–ç0¢òòg&öÒ6VçG&R×F÷Â6ò—B—2F†Rç7vW"FòÆ–W"æV"F†RÖ–FFÆS°¢òòF†R7vö÷—2F†Rç7vW"FòöæRBF†RvÆÇ2÷"WöâÆVFvRà¢òò$U5B´TU2•E2$ôÔ•4S¢—B6öÖW2öâF†Rf÷W'F‚&VBBF†P¢òòÆFW7B‡F†R6öÆBÖF–6RfÆö÷"Â&÷72Ö÷Væ–æw2*sB’ÂæBÖ’6öÖRöà¢òòF†RF†—&B(	B'F†Rf÷W'F‚&VB—2–÷W'2"&V6ÖR'F†Rf÷W'F‚&V@¢òò—2–÷W'2Â–bæ÷B6ööæW""à¢6öç7BÖ–DG‚ÒÖF‚æ'2‡‚Òrç&ööÔFVbçr¢D”ÄRò"“°¢6öç7BÆVFvRÒ‡Æ–W"ç’²Æ–W"æ‚’Â„rç&ööÔFVbæ‚Ò"’¢D”ÄRÒC°¢6öç7BÖ–FFÆRÒÖ–DG‚Â##bbÆVFvS°¢6öç7B6–æ6RÒF†—2ç6–æ6U&W7BÇÂ°¢6öç7Bv†–6‚Ò6–æ6RãÒ2òw&W7Bp¢¢&÷74G&r‡F†—2Âµ²wföÆÆW’rÂÖ–FFÆRò2¢ã#UÒÂ²w7vö÷rÂÖ–FFÆRòãB¢5ÒÂ²w&W7BrÂ6–æ6RãÒ"ò¢ÕÒ“°¢F†—2ç6–æ6U&W7BÒv†–6‚ÓÓÒw&W7Brò¢6–æ6R²°¢–b‡v†–6‚ÓÓÒw&W7Br’²F†—2ç7BÒw&W7Bs²F†—2çBÒ&÷75&W7B‡F†—2Âã’“²Ð¢VÇ6R–b‡v†–6‚ÓÓÒw7vö÷r’²F†—2ç7BÒw7vö÷v&âs²F†—2çBÒãSS²F†—2çG‚Òƒ²F†—2çG’Ò“²Ð¢VÇ6R°¢F†—2ç7BÒwföÆÆW’s²F†—2çBÒF†—2ç†6RÓÓÒ"òãb¢ã“²F†—2æf—&VBÒ°¢–b„ræVæVÖ–W2æf–ÇFW"†RÓâRæFVBbbRæ¶–æBÓÓÒvfÆ–W"r’æÆVæwF‚Â‡F†—2ç†6RÓÓÒ"ò"¢’’°¢6öç7BbÒæWrVæV×’‚vfÆ–W"rÂF†—2æ7‚‚’Ò2ÂF†—2ç’²F†—2æ‚“°¢ræVæVÖ–W2çW6‚†b“²6g‚‚w7VÖÖöâr“°¢'W'7B‡F†—2æ7‚‚’ÂF†—2ç’²F†—2æ‚ÂÂÂä"ævÆ÷rÂƒÂãBÂ3Â2ÂG'VR“°¢Ð¢Ð¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒwföÆÆW’r’°¢òò6VçG&R×F÷ÂF†VâF†RWF†÷&VB6†&vRÓâf—&RÓâ&V6÷fW"Â&–æ–æp¢òòfâöbÖWFÆÆ–2fVF†W'2–÷R×W7BF¶R6÷fW"g&öÐ¢F†—2ç‚ÒÆW'‡F†—2ç‚Ârç&ööÔFVbçr¢D”ÄRò"ÒF†—2çrò"ÂGB¢2“°¢F†—2ç’ÒÆW'‡F†—2ç’ÂF†—2æ†öÖU’ÂGB¢2“°¢F†—2çBÓÒGC²F†—2çv–æEBÒã3°¢6öç7BföÆÆW—2ÒF†—2ç†6RÓÓÒ"ò"¢°¢–b‡F†—2æf—&VBÂföÆÆW—2bbF†—2çBÃÒ‡F†—2æf—&VBòãCR¢‡F†—2ç†6RÓÓÒ"òãR¢ã’’’’°¢F†—2æf—&VB²³°¢6öç7BâÒF†—2ç†6RÓÓÒ"òr¢S°¢òòF†RfâÆVfW2F†Rv–æw26VçG&RÖ÷WB–âGvòÖg&ÖR&—ÆRÂæ@¢òòF†R&V6ö–Â¶–6·2†W"&6²WF†R6&ÆP¢F†—2æfVÒF†—2æfVÇÂµÓ°¢f÷"†ÆWB’Ò²’Âã²’²²¢F†—2æfVçW6‚‡²C¢ÖF‚æ'2†’Ò†âÒ’ò"’¢ã32Â’ÂâÒ“°¢F†—2æ6%bÒ‡F†—2æ6%bÇÂ’²‡F†—2æf—&VBÓÓÒòã2¢Óã2“°¢F†—2æf—&T¶–6²Ò°¢6g‚‚wV–ÆÂr“²6Òç6†¶RÒC°¢Ð¢–b‡F†—2æfVbbF†—2æfVæÆVæwF‚’°¢f÷"†6öç7BöbF†—2æfV’°¢æBÓÒGC°¢–b‡æBâ’6öçF–çVS°¢6öç7BÒÖF‚å’ò"²‡æ’Ò‡æâÒ’ò"’¢ã#‚²&æB‚ÓãBÂãB“°¢6öç7BbÒæWr&ö¢‡F†—2æ7‚‚’²‡æ’Ò‡æâÒ’ò"’¢bÂF†—2ç’²F†—2æ‚ÒbÀ¢ÖF‚æ6÷2†’¢33ÂÖF‚ç6–â†’¢33ÂfÇ6RÂÂrÂr6fcF3V2rÂƒÂB“°¢bæfVF†W"ÒG'VS²rç&ö§2çW6‚†b“°¢Ð¢F†—2æfVÒF†—2æfVæf–ÇFW"‡ÓâæBâ“°¢Ð¢–b‡F†—2çBÃÒ’°¢òò5TåC¢F†R&V6ö–ÂöbF†RfâG&÷2†W"F÷vâF†R6&ÆR–çFò6Æp¢òò&ævRf÷"&VB(	BF†RföÆÆW’W6VBFòvò7G&–v‡B&6²Fò¢òò7FF–öâ3S‚÷fW"F†RfÆö÷"Âv†–6‚—2æòv–æF÷rBÆÀ¢'&ööE&V6÷fW"‡F†—2Â%$ôôEô„ôÄBçföÆÆW•·F†—2ç†6RÓÓÒ"ò¢Ò“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw7vö÷v&âr’°¢òòÆö6·2öâÂFÆöç27Æ–VB(	BF†VâF†RF—fP¢F†—2çBÓÒGC²F†—2çv–æEBÒã3°¢–b‡F†—2çBÃÒ’°¢F†—2ç7BÒw7vö÷s²F†—2çBÒ°¢F†—2ç7‚ÒF†—2çƒ²F†—2ç7’ÒF†—2ç“°¢6öç7BrÒrç&ööÔFVbçr¢D”ÄS°¢F†—2æ×‚Ò6Æ×‡F†—2çG‚ÂsÂrÒs“°¢F†—2æ×’Ò6Æ×‡F†—2çG’²BÂcÂBãB¢D”ÄR“°¢F†—2æW‚Ò6Æ×‡F†—2æ×‚²‡F†—2æ7‚‚’ÂF†—2æ×‚ò3¢Ó3’Â“ÂrÒ“’ÒF†—2çrò#°¢òòF†RVÆÂ×WVæG2ÄõrÂæ÷B&6²öâF†R6&ÆS¢ƒ‚÷fW"F†P¢òò†V–v‡B6†Rv–ÆÂÆ&÷W"BÂv†–6‚¶VW2F†Rv†öÆR6öÖÖ—GFVB&0¢òò÷fW"w&÷VæFVBÆ–W"w2†VB‡F†R7vö÷w2ç7vW"—2Væ6†ævVB(	@¢òòÖ÷fRÂ÷"Fòæ÷B&R–âF†R—"’æBWG2F†R&V6÷fW'’v†W&R6†P¢òò6â&V6‚—@¢F†—2ç4VæE’ÒÖF‚æÖ‚‡F†—2æ†öÖU’Â&÷75&V57÷B‡F†—2’ç’Òƒ“°¢6g‚‚vF6‚r“°¢òò†W"FW'GW&RÆVfW2F†RV×G’6&ÆR7v–æv–ær÷fW"F†RW&6€¢F†—2æ6%bÒ‡F†—2æ6%bÇÂ’²‡F†—2æ7‚‚’ÂF†—2æ×‚òÓ"ã"¢"ã"“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw7vö÷r’°¢òòöæRF–vöæÂF—fR7G&–v‡BF‡&÷Vv‚v†W&R–÷R7FööBÂv–æBG&–Æ–æp¢F†—2çB³ÒGBòãS°¢6öç7BRÒÖF‚æÖ–âƒÂF†—2çB’Â—RÒÒS°¢6öç7Bç‚Ò—R¢—R¢F†—2ç7‚²"¢—R¢R¢‡F†—2æ×‚ÒF†—2çrò"’²R¢R¢F†—2æWƒ°¢6öç7Bç’Ò—R¢—R¢F†—2ç7’²"¢—R¢R¢‡F†—2æ×’ÒF†—2æ‚ò"’²R¢R¢‡F†—2ç4VæE’ÓÒçVÆÂòF†—2æ†öÖU’¢F†—2ç4VæE’“°¢F†—2çg‚Ò†ç‚ÒF†—2ç‚’òÖF‚æÖ‚†GBÂã“°¢F†—2çg’Ò†ç’ÒF†—2ç’’òÖF‚æÖ‚†GBÂã“°¢F†—2ç‚Òçƒ²F†—2ç’Òç“°¢òòF†Rv¶S¢Gv–â&–&&öç2öbv–æBVVÆ–æröfbF†Rv–æwF—2ÂV6€¢òò7W&Æ–ær÷WGv&B6òF†RG&–Â&72–ç7FVBöb66GFW&–æp¢6öç7Bw7ÒÖF‚æ‡—÷B‡F†—2çg‚ÂF†—2çg’’ÇÂ°¢6öç7Bvç‚Ò×F†—2çg’òw7Âvç’ÒF†—2çg‚òw7°¢f÷"†6öç7B6vâöb²ÓÂÒ’°¢–b‚6†æ6Rƒã’’’6öçF–çVS°¢6öç7BöfbÒ6vâ¢ƒR²ÖF‚ç6–â‡F†—2ææ–Ò¢"²6vâ’¢R“°¢FE'B‡F†—2æ7‚‚’²vç‚¢öfbÒF†—2çg‚¢ã2ÂF†—2æ7’‚’²vç’¢öfbÒF†—2çg’¢ã2À¢×F†—2çg‚¢ãb²vç‚¢6vâ¢SRÂ×F†—2çg’¢ãb²vç’¢6vâ¢SRÀ¢ãSRÂr6Cfc&f"rÂ2ãBÂÂG'VR“°¢Ð¢–b†6†æ6Rƒã2’’FE'B‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â&æB‚ÓCÂC’Â&æB‚ÓCÂC’Âã#"Âr6fcF3V2rÂ"ÂÂG'VR“°¢–b‡RãÒ’°¢òòF†R6F6ƒ¢6†R6æ2&6²öçFò7FF–öâæBF†R6&ÆRF¶W2F†P¢òòÆVgF÷fW"ÖöÖVçGVÒ26WGFÆ–ær7v–æp¢F†—2æ6%bÒ‡F†—2æ6%bÇÂ’²6Æ×‡F†—2çg‚¢ã3RÂÓ"ãBÂ"ãB“°¢F†—2çg‚Ò²F†—2çg’Ò°¢'&ööE&V6÷fW"‡F†—2Â%$ôôEô„ôÄBç7vö÷·F†—2ç†6RÓÓÒ"ò¢Ò“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw&V6÷fW"r’°¢òòÆ&÷W&–ærÆ÷rgFW"Ö÷fS¢6–æ²–çFò6Ær&ævR†f7BÂV6VB’À¢òò„ôÄBF†W&Rv—F‚F†Rv–æw2&VF–ær†Vg’ÂF†Vâ6Æ–Ö"âF†R†öÆ@¢òòöæÇ’6÷VçG2öæ6R6†R—2F÷vâà¢&÷75&V5G&6²‡F†—2“°¢6öç7B²ÒÒÖF‚æW‡‚Ó‚¢GB“°¢F†—2ç‚³Ò‡F†—2ç&V5‚ÒF†—2çrò"ÒF†—2ç‚’¢ƒÒÖF‚æW‡‚ÓR¢GB’“°¢F†—2ç’³Ò‡F†—2ç&V5’ÒF†—2ç’’¢³°¢F†—2ç&V56–æ²ÓÒGC°¢–b„ÖF‚æ'2‡F†—2ç’ÒF†—2ç&V5’’Â‚ÇÂF†—2ç&V56–æ²ÃÒ’°¢F†—2çBÓÒGC°¢–b‡F†—2çBÃÒ’²F†—2ç7BÒw&—6Rs²F†—2çBÒã#²Ð¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw&W7Br’°¢òòv–æw2'W&â÷WC¢—BFW66VæG2–çFò6Ær&ævP¢F†—2ç’ÒÆW'‡F†—2ç’Â"ãB¢D”ÄRÂGB¢"ã‚“°¢F†—2ç‚³ÒÖF‚ç6–â‡F†—2ææ–Ò¢"ã"’¢#"¢GC°¢F†—2çBÓÒGC°¢–b‡F†—2çBÃÒbbF†—2ç’âãb¢D”ÄR’²F†—2ç7BÒw&W7FÆ÷rs²F†—2çBÒ&÷75&W7B‡F†—2ÂãR“²Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw&W7FÆ÷rr’°¢F†—2ç’³ÒÖF‚ç6–â‡F†—2ææ–Ò¢2’¢‚¢GC°¢F†—2çBÓÒGC°¢–b‡F†—2çBÃÒ’²F†—2ç7BÒw&—6Rs²F†—2çBÒã#²Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw&—6Rr’°¢òòv2ÆW'‚ââÂãb’U"e$ÔR(	B6Æ–Ö"Gv–6R2f7BB#‡¢0¢òòBc²F†R6ÖR7W'fRÂ66ÆVB'’G@¢F†—2çBÓÒGC²F†—2ç’ÒÆW'‡F†—2ç’ÂF†—2æ†öÖU’ÂÒÖF‚ç÷rƒã“BÂGB¢c’“°¢–b‡F†—2çBÃÒ’°¢F†—2ç7BÒv–FÆRs²F†—2çBÒ&÷75&W7B‡F†—2Âã“°¢F†—2æ6%bÒ‡F†—2æ6%bÇÂ’²ã“²òò6F6†–ærF†R6&ÆR&ö6·2—@¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒv'&ööF6ÆÂr’°¢òò†VBF‡&÷vâ&6²Â6÷&R7G&ö&–ær(	BF†VâF†R'&ööBç7vW'2g&öÐ¢òòF†R&Væw2VFvW2ÂöæR7FvvW&VB7vö÷BF–ÖP¢F†—2ç‚ÒÆW'‡F†—2ç‚Ârç&ööÔFVbçr¢D”ÄRò"ÒF†—2çrò"ÂGB¢"“°¢F†—2ç’ÒÆW'‡F†—2ç’ÂF†—2æ†öÖU’ÂGB¢"“°¢F†—2çBÓÒGC²F†—2çv–æEBÒã3°¢–b‚F†—2æ&47&–VBbbF†—2çBÃÒã’°¢F†—2æ&47&–VBÒG'VS²6g‚‚w&ö"r“²6Òç6†¶RÒs°¢F†—2æ6%bÒ‡F†—2æ6%bÇÂ’Òã²òòF†R67&VV6‚F‡&÷w2†W"&6°¢–b‡G—VöbræFE&–ærÓÓÒvgVæ7F–öâr’ræFE&–ær‡F†—2æ7‚‚’ÂF†—2æ7’‚’“°¢Ð¢–b†6†æ6RƒãB’’FE'B‡F†—2æ7‚‚’²&æB‚Ó#Â#’ÂF†—2ç’²F†—2æ‚Ò‚À¢&æB‚ÓCÂC’Â&æB‚Ó3Âc’Âã2Âr6fcF3V2rÂ"ãRÂÂG'VR“°¢–b‡F†—2æ&47&–VBbbF†—2æ&4ââ’°¢F†—2æ&5BÓÒGC°¢–b‡F†—2æ&5BÃÒ’°¢F†—2æ&5BÒãS²F†—2æ&4âÒÓ°¢6öç7BÆVgBÒF†—2æ&4âR"ÓÓÒ°¢6öç7BbÒæWrVæV×’‚vfÆ–W"rÂÆVgBòb¢rç&ööÔFVbçr¢D”ÄRÒC"Â&æBƒsÂS’“°¢bæ‡Ò²bæW‡—&UBÒ²bæF—"ÒÆVgBò¢Ó°¢ræVæVÖ–W2çW6‚†b“²6g‚‚w7VÖÖöâr“°¢'W'7B†bç‚²bçrò"Âbç’²bæ‚ò"Â‚Âr6fcF3V2rÂcÂã3RÂÂ"ãRÂG'VR“°¢Ð¢Ð¢–b‡F†—2çBÃÒbbF†—2æ&4âÃÒ’°¢òòv–æw2G&ö÷VB(	BF†Rv–æF÷râ—Bv27FuBã–Âv†–6‚g&÷¦R†W ¢òòB6VçG&R×F÷v†W&RF†R67&VV6‚ÆVgB†W#¢v–æF÷r3S‚÷fW ¢òòF†RfÆö÷"â6†R6öÖW2Dõtâf÷"—Bæ÷rÂÆ–¶RWfW'’÷F†W"Ö÷fRà¢'&ööE&V6÷fW"‡F†—2Â%$ôôEô„ôÄBæ6ÆÅ·F†—2ç†6RÓÓÒ"ò¢Ò“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒv6f7&6‚r’°¢òòfÆÆ–ærv—F‚æòÆ–gBBÆÃ²7&·2æB6ööÆçBG&–Æ–æp¢F†—2çg’³Ò#c¢GC²F†—2ç’³ÒF†—2çg’¢GC°¢F†—2ç‚³ÒÖF‚ç6–â‡F†—2ææ–Ò¢’’¢3¢GC°¢–b†6†æ6Rƒãr’’FE'B‡F†—2æ7‚‚’²&æB‚ÓbÂb’ÂF†—2ç’²&æBƒÂF†—2æ‚’À¢&æB‚ÓcÂc’Â&æB‚ÓƒÂ#’ÂãBÂ6†æ6RƒãR’òr3†fC†fbr¢r6ff#crÂ"ãRÂ#ÂG'VR“°¢–b‡F†—2ç’ãÒ"ã’¢D”ÄR’°¢F†—2ç’Ò"ã’¢D”ÄS²F†—2çg’Ò°¢F†—2ç7BÒv6ffÆö÷"s²F†—2çBÒãs²F†—2æ6÷&T7&6¶VBÒG'VS°¢ræ–6UBÒrãS²6Òç6†¶RÒ²6g‚‚v7&6²r“°¢f÷"†ÆWB’Ò²’Â##²’²²¢FE'B‡F†—2æ7‚‚’²&æB‚Ó#BÂ#B’ÂF†—2æ7’‚’²&æB‚ÓÂ’À¢&æB‚Ó#ƒÂ#ƒ’Â&æB‚Ó3#ÂÓC’ÂãrÂ’R2òr3†fC†fbr¢r6S†f&fbrÂ2ÂSÂG'VR“°¢rçFö7B‡B‚v6e÷v&âr’“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒv6ffÆö÷"r’°¢òòw&÷VæFVBv—F‚F†R6†W7B7&6¶VB÷Vâ(	B†—B—Bv†–ÆR—B&W—'0¢F†—2çBÓÒGC°¢F†—2ç7FuBÒÖF‚æÖ‚‡F†—2ç7FuBÂãB“°¢–b†6†æ6RƒãR’’FE'B‡F†—2æ7‚‚’²&æB‚ÓBÂB’ÂF†—2æ7’‚’À¢&æB‚ÓcÂc’Â&æB‚Ó3ÂÓ3’ÂãRÂr3†fC†fbrÂ"ãRÂ#ÂG'VR“°¢–b‡F†—2çBÃÒ’²F†—2ç7BÒw&—6Rs²F†—2çBÒãC²F†—2æ6÷&T7&6¶VBÒfÇ6S²Ð¢Ð¢'&V³°¢Ð¢òòÒÒÒÒDÄ2Ós¢6Æ÷rvÆ¶W"Â6Æ×2æBÆö'2ÒÒÒÐ¢66RvFÆ2s¢°¢òòeU$ä4R4„ô•"w2Ö6†–æRÆ—fW2–â§2ögW&æ6RÖf–v‡Bæ§2†f57FW“¢F†P¢òò&VÆÆ÷w2F†Bç7vW'2F†RF†—&B†—BÂF†RG&÷F†BF¶W2F—7Fæ6P¢òòv’–â†6RGvòÂWfW'’Ö÷fRFöÆBæB÷VæVBâ—G2÷vâ‡—6–70¢òò†Ö÷fTVçB’'Vç2F†W&RÂ&V6W6RF†RG&÷fÆ–W2'’†æBà¢f57FW‡F†—2ÂGBÂ‚Â’Â7B“°¢'&V³°¢Ð¢òòÒÒÒÒ&6†—f—7B¦W&ó¢FVÆW÷'F–ær67FW"ÒÒÒÐ¢66Rw¦W&òs¢°¢òòÒÒÒÒtÄ4”U$RÂD„Re$õ¤TâU$”d”U#¢6†RdÄ”U2Â†öÆF–ær7FF–öâöf`¢òò–÷W"6†÷VÆFW"ÂæBç7vW'2v—F‚F†R6†VWBw2f—fR÷vW'2(	Bdô”BÄä4RÀ¢òò”4R4„$E2Âe$õ5BäõdÂD4‚4„$tRÂdô”Bõ$%2(	BWfW'’öæRFöÆBà¢òò%4ôÅUDR¤U$òÂDD4õ%%UD”ôâæBF†R&—6öâ&VÖ–â†W"&—FW2âÒÒÒÐ¢òð¢òòD„RTä•4‚t”äDõr•2D„Rd”t…Bäõrƒ##bÓÓ‚ÂF†R†öÆÆ÷r¶æ–v‡@¢òò7GVG’ÂÆâ*s2’âÖV7W&VB&Vf÷&S¢öæÇ’F†RF6‚†B&V6÷fW'’Âæ@¢òò6†RfÆöFVB&6²WGW&–ær—C²WfW'’÷F†W"÷vW"vVçB7G&–v‡B&6°¢òòFòvÆ–F–ærv’s"Óƒ2‚&÷fRF†RfÆö÷"âæ÷rUdU%’÷vW"VæG2–à¢òò&V6÷fW&¢6†R6–æ·2Fò†—GF–ær†V–v‡B†vÆ5&V6÷fW"’(	BfVWBC€¢òò÷fW"†W"w&÷VæBÂ&W6–FR†W"ÂæWfW"öâ†W"(	BæB†öÆG2F†W&RÂ7VçBÀ¢òòf÷"ãbÓã2âF†R6VçFVæ6RÆ–W"ÆV&ç2—2F†R6ÖRgFW"WfW'¢òòÖ÷fS¢FöFvR—BÂF†Vâ6†R6öÖW2F÷vâFò–÷Rà¢òð¢òòD„R4TåDTä4U2†&÷72×GFW&ç2*s"’âöæR6Æ÷6W"(	BF†R&V6÷fW'’(	Bæ@¢òòF†RFV6²FV6–FW2F†R÷VæW"g&öÒv†W&R–÷R7FæC ¢òòæV"ƒÂ#‚’'F†Rfâ"6†&G2ÂF†Vâ6†R6öÖW2F÷và¢òòÖ–B'F†RÆæ6R"Ææ6R÷"F6‚ÂF†VâF÷và¢òòf"ƒâ3ƒ‚’'F†R6†&vR"F6‚ÂÆæ6R÷"÷&'2ÂF†VâF÷và¢òò&÷fR†W"fÆö÷"†öâÆVFvR“¢Ææ6RÂF6‚æBF†R6vRÆVâ–âÀ¢òò&V6W6RF†÷6R&RF†R÷vW'2F†B–Ð¢òò†6RGvò$T4ôÔ$”äU2Â—BFöW2æ÷BFB‡Æâ*s2ã2Â&÷72×GFW&ç2*sBãR“ ¢òò&F6‚ÂF†VâF†Rfâ"(	BWfW'’F6‚–â†6RGvò—2föÆÆ÷vVB'¢òò6†&G2g&öÒv†W&RF†R6†&vRVæFV@¢òò&Ææ6RÂF†VâF†RF6‚"(	BB&ævRÂF†RÆæ6R—2föÆÆ÷vVB'’F6€¢òòæBöæÇ’F†RÄ5BÆ–æ²6'&–W2F†R&V6÷fW'’Â6òF†R6†–âw2VæB—0¢òòF†RF†–ærFòÆV&ââæòFVÆÂ6†÷'FVç3²F†R6öÆB&—FW2&–FRöâF÷à¢F†—2æ¤4BÒF†—2æ¤4BÓÒçVÆÂò¢F†—2æ¤4BÒGC°¢F†—2ææ÷f4BÒÖF‚æÖ‚ƒÂ‡F†—2ææ÷f4BÇÂ’ÒGB“°¢òòF†R6†&Bfâw26V6öæB&æ³¢VWVVB'&÷w2ÆVfR6÷WÆRg&ÖW0¢òògFW"F†Rf—'7B(	BF†R&—ÆRÆVæ6‚†ævÆW2÷7VVG2Væ6†ævVB¢–b‡F†—2ævÆ56†&EbbF†—2ævÆ56†&EæÆVæwF‚’°¢f÷"†ÆWB’ÒF†—2ævÆ56†&EæÆVæwF‚Ò²’ãÒ²’ÒÒ’°¢6öç7BÒF†—2ævÆ56†&E¶•Ó²æBÓÒGC°¢–b‡æBÃÒ’°¢6öç7B"ÒæWr&ö¢‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂÖF‚æ6÷2‡æ’¢3SÂÖF‚ç6–â‡æ’¢3SÂfÇ6RÂÂ‚Âr6VC†fbrÂÂ"ã"“°¢"ævÆ4g‚Òw6†&Bs²"æg&÷7BÒG'VS²rç&ö§2çW6‚‡"“°¢F†—2ævÆ56†&Eç7Æ–6R†’Â“°¢Ð¢Ð¢Ð¢6öç7BurÒrç&ööÔFVbçr¢D”ÄS°¢6öç7BtfÆö÷"Ò„rç&ööÔFVbæ‚Ò"’¢D”ÄS°¢6öç7B†÷e’Ò6Æ×‡’Ò3ÂƒÂ33“°¢6öç7B"ÒF†—2ç†6RÓÓÒ"ò¢°¢6öç7BF—7BÒÖF‚æ'2‡‚ÒF†—2æ7‚‚’“°¢–b‡F†—2ç7BÓÒvF6‚rbbF†—2ç7BÓÒvF6‡v&âr¢F†—2æf6RÒÖF‚ç6–vâ‡‚ÒF†—2æ7‚‚’’ÇÂF†—2æf6RÇÂ°¢òòÆVf–ær–FÆRf÷&vWG2F†R7FF–öâÂ6ò6öÖ–ær&6²–6·2æWröæP¢–b‡F†—2ç7BÓÒv–FÆRr’²F†—2ævÆ57FBÒçVÆÃ²F†—2åövÆ5v2ÒF†—2ç7C²Ð¢–b‡F†—2ç7BÓÓÒv–FÆRr’°¢òòD„R5DD”ôââ6†R–6·2g&W6‚öæRV6‚F–ÖR6†R6öÖW2Fò&W7B(	@¢òòv†–6‚6–FRÂ†÷r†–v‚Â†÷rf"÷WB(	BæBdÄ”U2Fò—B†vÆ4fÇ“ ¢òò6†R66VÆW&FW2÷WBÂ7'V—6W2ÂæB'&¶W2–çFò—BÂ&æ¶–ærv—F€¢òòF†RGW&ã²F†RöÆBÆW'vÆ–FR&V6†VBgVÆÂ7VVB–âöæRg&ÖRæ@¢òòV6VBf÷&WfW"Âv†–6‚—2†÷rwV&F–â&VG227W'6÷"’à¢–b‡F†—2ævÆ57FBÓÒçVÆÂÇÂF†—2ç7BÓÒF†—2åövÆ5v2’°¢F†—2ævÆ57FBÒ²6–FS¢F†—2æ7‚‚’Â‚òÓ¢Â÷WC¢&æBƒSÂ#3’ÂW¢&æB‚ÓCÂ“R’Ó°¢Ð¢F†—2åövÆ5v2Òv–FÆRs°¢6öç7B2ÒF†—2ævÆ57FC°¢6öç7BGƒ"Ò6Æ×‡‚²2ç6–FR¢2æ÷WBÂsÂurÒs“°¢6öç7BG“"Ò6Æ×††÷e’Ò2çWÂsÂB¢D”ÄRÒF†—2æ‚ÒC“°¢vÆ4fÇ’‡F†—2ÂGƒ"ÂG“"ÂtÄ5ô5%T•4R¢7BÂtÄ5ô44TÂ¢7BÂGB“°¢òòDD4õ%%UD”ôâÖ¶W2F†Rv†öÆRVæ—B'Vâ†÷GFW"v†–ÆR–÷W"…TBÆ–W0¢F†—2çBÓÒGB¢‚„ræ‡VDvÆ—F6…BÇÂ’âòãCR¢“°¢–b‚F†—2æF5W6VBbbF†—2æ‡ÃÒF†—2æ‡Ö‚¢ãB’°¢òòDD4õ%%UD”ôã¢öæ6RÂ&VÆ÷rCR(	BF†Rfö–BWÆöG2—G6VÆ`¢òò–çFò–÷W"f—6÷"æB67&Ö&ÆW2WfW'—F†–ær–÷RG'W7@¢F†—2æF5W6VBÒG'VS°¢F†—2ç7BÒvF667Bs²F†—2çBÒã“²6g‚‚v67FçVÆÂr“²F†—2çv–æEBÒãS°¢ÒVÇ6R–b‡F†—2æ¤4BÃÒbbF†—2çBÃÒãB’°¢òò%4ôÅUDR¤U$ó¢F†RW&–f–W"w2‡W6‚(	BF†RW‡æF–ærg&÷7BW&¢òò—2F†RFVÆÃ²&R÷WG6–FR—Bv†VâF†R6–ÆVæ6RÆæG0¢F†—2ç7BÒv¦‡W6‚s²F†—2çBÒã²F†—2æ¤4BÒ&æBƒ2Âr“²F†—2çv–æEBÒãS°¢6g‚‚v67F–6Rr“°¢ÒVÇ6R–b†F—7BÂCbbÖF‚æ'2‡’ÒF†—2æ7’‚’’Â#bbF†—2ææ÷f4BÃÒ’°¢òòe$õ5Bäõd—2&V7F—fS¢7&÷vB†W"æBF†R6öÆBç7vW'2(	B6†P¢òòG&÷2öçFòF†R7FæF–ærg&ÖRæBvF†W'2ÂF†B—2F†RFVÆÀ¢F†—2ç7BÒvæ÷fv&âs²F†—2çBÒãc²F†—2ææ÷f4BÒs²6g‚‚v67F–6Rr“²F†—2çv–æEBÒãS°¢ÒVÇ6R–b‡F†—2çBÃÒ’°¢òòD„RDT4²Â'’&ævRæB'’†V–v‡B(	BæWfW"7–6ÆR²²RVv–âà¢òòF†R&÷FF–öâv2ÆV&æ&ÆRæB—Bv2Ç6òFVc¢6†RF‡&WrF†P¢òò6ÖRf—fR&VG2BÆ–W"&W6–FR†W"æBÆ–W"7&÷72F†P¢òò&ööÒâvV–v‡G2W"&æB¶æV"ÂÖ–BÂf%Ó²F†R6vRæBF†R÷&'0¢òòG&÷÷WBv†–ÆRöæR—27F–ÆÂ7FæF–ærà¢6öç7B&æBÒF—7BÂ#ò¢F—7BÂ3ƒò¢#°¢6öç7B†–v‚Ò‡Æ–W"ç’²Æ–W"æ‚’ÂtfÆö÷"ÒCò¢°¢6öç7B×bÒ&÷74G&r‡F†—2Â°¢²vÆæ6RrÂ³Â2Â%Õ¶&æEÒ²†–v…ÒÀ¢²w6†&BrÂ³BÂ"ÂãUÕ¶&æEÕÒÀ¢²vF6‚rÂ³Â"Â5Õ¶&æEÒ²†–v…ÒÀ¢²v÷&'2rÂ‡F†—2æ÷&'2bbF†—2æ÷&'2æÆVæwF‚’ò¢³ãRÂÂ%Õ¶&æEÕÒÀ¢²w&—6öârÂF†—2ç&—6öâò¢²†–v…ÒÀ¢Ò“°¢F†—2ævÆ4&æBÒ&æC°¢vÆ467B‡F†—2Â×bÂ‚Â’“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvÆæ6Wv&âr’°¢òòF†R†÷&âG&–æ·2fö–BÆ–v‡B(	B†öÆBÂvF6‚ÂF†VâÖ÷fRôdbF†RÆ–æP¢F†—2çBÓÒGC²vÆ4'&¶R‡F†—2ÂbÂGB“°¢–b‡F†—2çBÃÒ’°¢6öç7Bã"Ò"ò"¢°¢f÷"†ÆWB²Ò²²Âã#²²²²’°¢6öç7BÒÖF‚æFã"‡’²†²òÓs¢’ÒF†—2æ7’‚’Â‚ÒF†—2æ7‚‚’“°¢6öç7B"ÒæWr&ö¢‡F†—2æ7‚‚’²F†—2æf6R¢F†—2çr¢ãSRÂF†—2ç’²F†—2æ‚¢ã‚À¢ÖF‚æ6÷2†’¢ƒRÂÖF‚ç6–â†’¢ƒRÂfÇ6RÂÂ2Âr6C#F&fbrÂÂBã"“°¢"ævÆ4g‚ÒvÆæ6Rs²rç&ö§2çW6‚‡"“°¢Ð¢6g‚‚vÆæ6Rr“²6Òç6†¶RÒC°¢òò&Ææ6RÂF†VâF†RF6‚#¢†6RGvòÂB&ævRÂF†RÆæ6R—2F†P¢òò÷VæW"æBF†R6†&vR—2—G26Æ÷6W ¢–b‡"bbF—7BãÒ3ƒbbF†—2æ6†–â’²F†—2æ6†–âÒvÆæ6Rs²vÆ467B‡F†—2ÂvF6‚rÂ‚Â’“²Ð¢VÇ6RvÆ5&V6÷fW"‡F†—2ÂtÄ5ô„ôÄBæÆæ6U·%Ò“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw6†&Gv&âr’°¢òò–6R6öæFVç6W2ÆöærF†R7–æR7'—7FÇ2ÂF†VâF†RfâfÆ–W0¢F†—2çBÓÒGC²vÆ4'&¶R‡F†—2ÂbÂGB“°¢–b‡F†—2çBÃÒ’°¢6öç7Bã"Ò"òr¢S°¢6öç7B&6RÒÖF‚æFã"‡’ÒF†—2æ7’‚’Â‚ÒF†—2æ7‚‚’“°¢òòF†RfâÆVfW2–â$•ÄRÂæ÷BvÆÃ¢WfVâ&æ·2f—&Ræ÷rÀ¢òòöFB&æ·26÷WÆRg&ÖW2ÆFW"(	B6ÖRævÆW2Â6ÖR7VVG0¢F†—2ævÆ56†&EÒF†—2ævÆ56†&EÇÂµÓ°¢f÷"†ÆWB²Ò²²Âã#²²²²’°¢6öç7BÒ&6R²†²Ò†ã"Ò’ò"’¢ã“°¢–b†²R"ÓÓÒ’°¢6öç7B"ÒæWr&ö¢‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂÖF‚æ6÷2†’¢3SÂÖF‚ç6–â†’¢3SÂfÇ6RÂÂ‚Âr6VC†fbrÂÂ"ã"“°¢"ævÆ4g‚Òw6†&Bs²"æg&÷7BÒG'VS²rç&ö§2çW6‚‡"“°¢ÒVÇ6RF†—2ævÆ56†&EçW6‚‡²ÂC¢ãrÒ“°¢Ð¢6g‚‚w6†&Br“°¢vÆ5&V6÷fW"‡F†—2ÂtÄ5ô„ôÄBç6†&E·%Ò“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvF6‡v&âr’°¢òò6†R7V&W2WæB6ö–Ç3²F†R6†&vRÆ–æR—2G&vâ–âF†R— ¢F†—2çBÓÒGC²vÆ4'&¶R‡F†—2Â’ÂGB“°¢òòF†RÆ–æR6öÖÖ—G2f÷"F†Rf–æÂ3×2âG&6¶–ærVçF–ÂF†RÆVæ6€¢òòg&ÖRÖFR6÷'&V7B6–FW7FWÖ÷fRF†RGfW'F—6VBÆ–æRv—F‚†W"à¢–b‡F†—2çBâã2ÇÂçVÖ&W"æ—4f–æ—FR‡F†—2æF6„ær’¢F†—2æF6„ærÒÖF‚æFã"‡’ÒF†—2æ7’‚’Â‚ÒF†—2æ7‚‚’“°¢F†—2æf6RÒÖF‚æ'2„ÖF‚æ6÷2‡F†—2æF6„ær’’âãRò„ÖF‚æ6÷2‡F†—2æF6„ær’âò¢Ó’¢F†—2æf6S°¢–b‡F†—2çBÃÒ’°¢F†—2ç7BÒvF6‚s²F†—2çBÒãc#°¢F†—2çg‚ÒÖF‚æ6÷2‡F†—2æF6„ær’¢cC¢7C°¢F†—2çg’ÒÖF‚ç6–â‡F†—2æF6„ær’¢cC¢7C°¢6g‚‚vF6‚r“²6Òç6†¶RÒS°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvF6‚r’°¢òòD4‚4„$tS¢F‡&÷Vv‚v†W&R–÷R7FööBÂWF†÷&VB7'—7FÇ2†æv–æp¢òò–â†W"v¶R(	BF†RG&–Â—G6VÆb&—FW2âF†RÆ–æR—26öÖÖ—GFVBÂ6ð¢òòF†RfVÆö6—G’—2†VÆBÂæ÷B7FVW&VBà¢F†—2çBÓÒGC°¢F†—2çG&–ÅBÒ‡F†—2çG&–ÅBÇÂ’ÒGC°¢–b‡F†—2çG&–ÅBÃÒ’°¢F†—2çG&–ÅBÒãs°¢F†—2æ–6UG&–ÂÒF†—2æ–6UG&–ÂÇÂµÓ°¢F†—2æ–6UG&–ÂçW6‚‡²ƒ¢F†—2æ7‚‚’ÒF†—2çg‚¢ãbÂ“¢F†—2æ7’‚’²&æB‚Ó‚Â‚’ÂC¢"ãBÒ“°¢Ð¢–b†6†æ6Rƒã‚’’FE'B‡F†—2æ7‚‚’ÒF†—2çg‚¢ãBÂF†—2æ7’‚’²&æB‚ÓbÂb’À¢×F†—2çg‚¢ã"²&æB‚ÓCÂC’Â&æB‚ÓCÂC’Âã2Âr6&fS†fbrÂ"ãRÂÂG'VR“°¢–b‡F†—2çBÃÒ’°¢òò6†RFöW2æ÷B7F÷FVBBF†RVæBöbcC‚÷26†&vS¢F†P¢òò7VVB&ÆVVG2öfb–âF†R&V6÷fW'’w26–æ²†vÆ4fÇ’'&¶W2—B’À¢òòv†–6‚—2F†R÷fW'6†ö÷BF†RG&r6–FRW6VBFòf¶Rv—F‚7&–æp¢òò&F6‚ÂF†VâF†Rfâ#¢–â†6RGvòF†R6†&vR—2â÷VæW ¢–b‡"bbF†—2æ6†–â’²F†—2æ6†–âÒvF6‚s²vÆ467B‡F†—2Âw6†&BrÂ‚Â’“²Ð¢VÇ6RvÆ5&V6÷fW"‡F†—2ÂtÄ5ô„ôÄBæF6…·%Ò“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw&V6÷fW"r’°¢òò5TåB(	B–÷W"v–æF÷râ6–æ²f—'7B†f7BÂ'&¶–ær–çFòÆ6R’ÂF†Và¢òò„ôÄC¢æ÷6RF÷vâÂÆVw2†æv–ærÂ6Æ÷6RVæ÷Vv‚Fò†—Bg&öÒF†RfÆö÷"à¢òòF†R†öÆBöæÇ’6÷VçG2öæ6R6†R—2F÷vã²F†R6–æ²—26VBÂ6ò¢òò&V6÷fW'’F†B7F'G2BF†R6V–Æ–ær7F–ÆÂ÷Vç2öâF–ÖRà¢&÷75&V5G&6²‡F†—2“°¢–b‚F†—2ç&V4Æ÷r’°¢òò7F–fb'&—fR†v–â‚“¢6ögBöæR7VæG2—G2Æ7BC€¢òò7&VW–ærÂæBF†Rv–æF÷rv÷VÆB&R7VçB&Vf÷&R6†Rv÷BF†W&P¢vÆ4fÇ’‡F†—2ÂF†—2ç&V5‚ÂF†—2ç&V5’ÂcCÂ3#ÂGBÂ‚“°¢F†—2ç&V56–æ²ÓÒGC°¢òò%$•dTBÖVç2F†W&RæB5DõTC¢6†&vRF†BVæG2Bƒ‚÷0¢òò76W2F‡&÷Vv‚†—GF–ær†V–v‡Böâ—G2v’6öÖWv†W&RVÇ6P¢–b‚„ÖF‚æ'2‡F†—2ç’ÒF†—2ç&V5’’Â‚bbÖF‚æ'2‡F†—2æ7‚‚’ÒF†—2ç&V5‚’Â#@¢bbÖF‚æ‡—÷B‡F†—2çg‚ÂF†—2çg’’ÂC’ÇÂF†—2ç&V56–æ²ÃÒ¢F†—2ç&V4Æ÷rÒG'VS°¢ÒVÇ6R°¢vÆ4fÇ’‡F†—2ÂF†—2ç&V5‚ÂF†—2ç&V5’Â“Â3#ÂGBÂ‚“°¢F†—2çBÓÒGC°¢–b‡F†—2çBÃÒ’²F†—2ç7BÒv–FÆRs²F†—2çBÒvÆ5&W7B‡F†—2“²F†—2æ6†–âÒçVÆÃ²Ð¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw&—6öçv&âr’°¢òòF†Rfö–BvF†W'2&÷VæBv†W&R6†R—2Æöö¶–ærÂF†Vâ6Æ÷6W0¢F†—2çBÓÒGC²vÆ4'&¶R‡F†—2ÂbÂGB“°¢6öç7B–ÒÒF†—2ç&—6öä–ÒÇÂ‡F†—2ç&—6öä–ÒÒ²ƒ¢‚Â“¢’Ò“°¢–b†6†æ6Rƒãr’’°¢6öç7BÒ&æBƒÂbã#‚’Â'#"ÒCB²&æB‚Ó‚Â‚“°¢FE'B†–Òç‚²ÖF‚æ6÷2†’¢'#"Â–Òç’²ÖF‚ç6–â†’¢'#"À¢ÔÖF‚æ6÷2†’¢“ÂÔÖF‚ç6–â†’¢“Âã2Âr63ƒ†6fbrÂ"ã"ÂÂG'VR“°¢Ð¢–b‡F†—2çBÃÒ’°¢F†—2ç&—6öâÒ²ƒ¢–Òç‚Â“¢–Òç’ÂC¢ÂÆ–fS¢"ò2ãB¢"ãbÂ†VÆC¢Ó°¢F†—2ç&—6öä–ÒÒçVÆÃ°¢6g‚‚w&—6öâr“°¢vÆ5&V6÷fW"‡F†—2ÂtÄ5ô„ôÄBç&—6öå·%Ò“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvæ÷fv&âr’°¢F†—2çBÓÒGC²vÆ4'&¶R‡F†—2Â‚ÂGB“°¢–b‡F†—2çBÃÒ’°¢F†—2ææ÷fÒ²#¢#BÓ°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â#bÂr6ScvfrÂ3ƒÂãbÂÂ2ãRÂG'VR“°¢6Òç6†¶RÒs²6g‚‚v'&V²r“²ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚Âã‚“°¢òòF†Ræ÷fv2&ãSR27FvvW""(	B7FuBÂv†–6‚e$õ¤R†W"–âF†P¢òò—"v†W&R6†R7FööBÂW7VÆÇ’÷WBöb&V6‚â—B—2F†R6ÖP¢òò&V6÷fW'’2WfW'—F†–ærVÇ6Ræ÷rÂæBF†RÆöævW7BöbF†VÓ¢F†P¢òò÷vW"–÷RV&æVB'’7&÷vF–ær†W"—2–÷Rf÷"†f–ærFöæR—Bà¢vÆ5&V6÷fW"‡F†—2ÂtÄ5ô„ôÄBææ÷f·%Ò“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒv÷&'2r’°¢òòdô”Bõ$%3¢6†R7FæG2æB6ÆÇ2F†VÒ÷WBöbF†RF&°¢F†—2çBÓÒGC²vÆ4'&¶R‡F†—2ÂbÂGB“°¢–b‡F†—2çBÃÒ’°¢F†—2æ÷&'2ÒµÓ°¢6öç7Bã"Ò"òB¢3°¢f÷"†ÆWB²Ò²²Âã#²²²²¢F†—2æ÷&'2çW6‚‡²¢²òã"¢ÖF‚å’¢"Â6C¢ãB²²¢ãRÂC¢’Âƒ¢F†—2æ7‚‚’Â“¢F†—2æ7’‚’Ò“°¢6g‚‚w†6Rr“°¢vÆ5&V6÷fW"‡F†—2ÂtÄ5ô„ôÄBæ÷&'5·%Ò“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒv¦‡W6‚r’°¢F†—2çBÓÒGC²vÆ4'&¶R‡F†—2ÂbÂGB“°¢F†—2æ¥"ÒC²ƒãÒF†—2çB’¢“²òòF†RW&7vVÆÆ–ær÷WGv&@¢–b†6†æ6Rƒã‚’’°¢6öç7BÒ&æBƒÂbã#‚“°¢FE'B‡F†—2æ7‚‚’²ÖF‚æ6÷2†’¢F†—2æ¥"ÂF†—2æ7’‚’²ÖF‚ç6–â†’¢F†—2æ¥"À¢ÔÖF‚æ6÷2†’¢cÂÔÖF‚ç6–â†’¢cÂã3RÂr6&fS†fbrÂ"ÂÂG'VR“°¢Ð¢–b‡F†—2çBÃÒ’°¢6öç7BC"ÒÖF‚æ‡—÷B‡‚ÒF†—2æ7‚‚’Â’ÒF†—2æ7’‚’“°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â3Âr6ScvfrÂC#ÂãrÂÂ2ãRÂG'VR“°¢6Òç6†¶RÒƒ²6g‚‚v'&V²r“²ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚Âã"“°¢–b†C"ÂF†—2æ¥"bbÆ–W"æFVB’°¢Æ–W"ç6Æ÷uBÒÖF‚æÖ‚‡Æ–W"ç6Æ÷uBÂ"ãB“°¢Æ–W"æ‡W'BƒÂF†—2æ7‚‚’“°¢Ð¢òòGvòföÆÆ÷r×W&V×2v†–ÆR–÷R&R6Æ÷vVB(	BFöFvRöâ†Æb7VV@¢F†—2æÖ&·2çW6‚‡²ƒ¢‚ÂC¢ãSRÒÂ²ƒ¢‚²„ÖF‚ç6–vâ‡Æ–W"çg‚’ÇÂ’¢sÂC¢ãƒRÒ“°¢F†—2æ¥"Ò°¢vÆ5&V6÷fW"‡F†—2ÂtÄ5ô„ôÄBæ¥·%Ò“²òò†W"&–vvW7B&—FRV&ç2F†RÆöævW7B'&VF€¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvF667Br’°¢F†—2çBÓÒGC²vÆ4'&¶R‡F†—2ÂbÂGB“°¢òò7G&VÒöb7–âF–v—G2÷W&–ærg&öÒF†RF&ÆWB–çFò–÷W"f—6÷ ¢–b†6†æ6Rƒã’’’°¢6öç7B²Ò&æBƒÂ“°¢FE'B†ÆW'‡F†—2æ7‚‚’Â‚Â²’ÂÆW'‡F†—2æ7’‚’Â’Â²’²&æB‚Ó‚Â‚’À¢‡‚ÒF†—2æ7‚‚’’¢ãBÂ‡’ÒF†—2æ7’‚’’¢ãBÂã#RÂr3†fcffbrÂ"ÂÂG'VR“°¢Ð¢–b‡F†—2çBÃÒ’°¢ræ‡VDvÆ—F6…BÒƒ²rçFö7B‡B‚vF5÷v&âr’“²6g‚‚w†6Rr“°¢vÆ5&V6÷fW"‡F†—2ÂtÄ5ô„ôÄBæF5·%Ò“°¢Ð¢Ð¢òòôäR”åDTu$D”ôâf÷"WfW'’7FFS¢v†FWfW"F†R7FFR6¶VBöbF†P¢òòfVÆö6—G’ÂF†—2—2F†RöæÇ’Æ6R—B&V6öÖW2÷6—F–öâÂ6òæ÷F†–æp¢òò6âÖ÷fR†W"Gv–6R–âg&ÖR÷"6¶—G@¢F†—2ç‚³ÒF†—2çg‚¢GC²F†—2ç’³ÒF†—2çg’¢GC°¢°¢6öç7B”Ö‚ÒF†—2ç7BÓÓÒvF6‚ròB¢D”ÄRÒF†—2æ‚¢tfÆö÷"ÒF†—2æ‚Òƒ°¢–b‡F†—2ç’ÂS’²F†—2ç’ÒS²–b‡F†—2çg’Â’F†—2çg’Ò²Ð¢–b‡F†—2ç’â”Ö‚’²F†—2ç’Ò”Öƒ²–b‡F†—2çg’â’F†—2çg’Ò²Ð¢Ð¢f÷"†ÆWB’ÒF†—2æÖ&·2æÆVæwF‚Ò²’ãÒ²’ÒÒ’°¢6öç7BÒÒF†—2æÖ&·5¶•Ó²ÒçBÓÒGC°¢–b†ÒçBÃÒ’°¢6öç7B"ÒæWr&ö¢†Òç‚ÂR¢D”ÄRÒbÂÂÓS#ÂfÇ6RÂÂ‚Âr6VVf6fbrÂÂã’“°¢"æg&÷7BÒG'VS²òò6öçF7Bg&VW¦W2F†R¦ö–çG0¢rç&ö§2çW6‚‡"“°¢6g‚‚w6†&Br“²F†—2æÖ&·2ç7Æ–6R†’Â“°¢Ð¢Ð¢òòe$õ5Bäõd–âfÆ–v‡C¢&–æröb&—F–ær6öÆBÂ§V×—B÷"vV"—@¢–b‡F†—2ææ÷f’°¢6öç7BçbÒF†—2ææ÷f²çbç"³Ò3¢GC°¢6öç7BC"ÒÖF‚æ‡—÷B‡‚ÒF†—2æ7‚‚’Â’ÒF†—2æ7’‚’“°¢–b„ÖF‚æ'2†C"Òçbç"’ÂrbbÆ–W"æFVBbbÆ–W"æ•BÃÒ’°¢Æ–W"æ‡W'B„Db‚’æVFÖrÂF†—2æ7‚‚’“°¢Æ–W"ç6Æ÷uBÒÖF‚æÖ‚‡Æ–W"ç6Æ÷uBÂãb“°¢Ð¢–b†çbç"â#S’F†—2ææ÷fÒçVÆÃ°¢Ð¢òòdô”Bõ$%3¢F†W’÷&&—B†W"æBF¶RF†V—"6†÷G3²F†W’'W&â÷W@¢–b‡F†—2æ÷&'2bbF†—2æ÷&'2æÆVæwF‚’°¢f÷"†ÆWB’ÒF†—2æ÷&'2æÆVæwF‚Ò²’ãÒ²’ÒÒ’°¢6öç7Bö"ÒF†—2æ÷&'5¶•Ó°¢ö"æ³ÒGB¢ãs²ö"çBÓÒGC²ö"æ6BÓÒGC°¢ö"ç‚ÒF†—2æ7‚‚’²ÖF‚æ6÷2†ö"æ’¢ƒ°¢ö"ç’ÒF†—2æ7’‚’²ÖF‚ç6–â†ö"æ’¢SC°¢–b†ö"æ6BÃÒ’°¢ö"æ6BÒF†—2ç†6RÓÓÒ"òãR¢"ã°¢6öç7BÒÖF‚æFã"‡’Òö"ç’Â‚Òö"ç‚“°¢rç&ö§2çW6‚†æWr&ö¢†ö"ç‚Âö"ç’ÂÖF‚æ6÷2†’¢3ÂÖF‚ç6–â†’¢3ÂfÇ6RÂÂbÂr6C#F&fbrÂÂ"’“°¢6g‚‚v÷&'6†÷Br“°¢Ð¢–b†ö"çBÃÒ’°¢'W'7B†ö"ç‚Âö"ç’Â‚Âr6C#F&fbrÂcÂãBÂÂ"ãRÂG'VR“°¢F†—2æ÷&'2ç7Æ–6R†’Â“°¢Ð¢Ð¢Ð¢òòF†RD4‚4„$tRw2†æv–ær–6S¢WF†÷&VB7'—7FÇ2F†B&—FRæBfFP¢–b‡F†—2æ–6UG&–ÂbbF†—2æ–6UG&–ÂæÆVæwF‚’°¢f÷"†ÆWB’ÒF†—2æ–6UG&–ÂæÆVæwF‚Ò²’ãÒ²’ÒÒ’°¢6öç7BG"ÒF†—2æ–6UG&–Å¶•Ó²G"çBÓÒGC°¢–b‡G"çBÃÒ’²F†—2æ–6UG&–Âç7Æ–6R†’Â“²6öçF–çVS²Ð¢–b‚Æ–W"æFVBbbÆ–W"æ•BÃÒbbÖF‚æ'2‡‚ÒG"ç‚’Â#bbÖF‚æ'2‡’ÒG"ç’’Â#b’°¢Æ–W"æ‡W'BƒÂG"ç‚“°¢Æ–W"ç6Æ÷uBÒÖF‚æÖ‚‡Æ–W"ç6Æ÷uBÂã"“°¢Ð¢Ð¢Ð¢'&V³°¢Ð¢òòÒÒÒÒ&—6Ò&÷vÆW#¢&—fÂ&ö&òÖ6BÒÒÒÐ¢66Rw&—6Òs¢°¢F†—2çg’³Ò#¢GC°¢F†—2æÇ44BÒF†—2æÇ44BÓÒçVÆÂò‚¢F†—2æÇ44BÒGC°¢–b‡F†—2ç7BÓÓÒv–FÆRr’°¢òò—B$õtÅ2â7FæF–ærFVB7F–ÆÂ&WGvVVâ÷Væ6W2ÖFRF†R&—fÂ&V@¢òò27FGVRF†Bö666–öæÆÇ’FVÆW÷'G3²6B6Æ÷6W2F†Rvà¢F†—2æf6RÒÖF‚ç6–vâ‡‚ÒF†—2æ7‚‚’’ÇÂ°¢6öç7BvÒ‚ÒF†—2æ7‚‚“°¢F†—2çg‚ÒÖF‚æ'2†v’â“bòÖF‚ç6–vâ†v’¢“¢7B¢ÖF‚ç6–vâ†v’¢s¢7C°¢F†—2çBÓÒGC°¢–b‚F†—2æ&5W6VBbbF†—2æ‡ÃÒF†—2æ‡Ö‚¢ã3R’°¢òò$2õdU$ÄôC¢öæ6RÂÆ÷r†VÇF‚(	BF†RGW&çF&ÆR÷fW&6†&vW2æ@¢òò—Bfæ—6†W2–çFò—G2÷vâÆ–v‡Fæ–ær7F÷&Ð¢F†—2æ&5W6VBÒG'VS°¢F†—2ç7BÒv&77–âs²F†—2çBÒã#²F†—2çg‚Ò²6g‚‚v67F&2r“°¢ÒVÇ6R–b‡F†—2æÇ44BÃÒbbF†—2çBÃÒ’°¢òòÄ”t…B5Ä•C¢6Bw2÷Væ6RÂF¶VâF‡&÷Vv‚Æ–v‡B(	BF‡&VR7÷G0¢òòvÆ÷s²öæÇ’öæR†öÆG2F†R&VÂ&öG¢F†—2ç7BÒvÇ7fæ—6‚s²F†—2çBÒã“S²F†—2æÇ44BÒ&æBƒÂB“°¢6öç7Bs"Òrç&ööÔFVbçr¢D”ÄS°¢F†—2æÇ57÷G2Ò³ÂÂ%ÒæÖ†’Óâ‡°¢ƒ¢6Æ×…s"¢ƒã"²’¢ã2’²&æB‚ÓcÂc’ÂsÂs"Òs’À¢“¢2ãB¢D”ÄRÀ¢Ò’“°¢F†—2æÇ5&VÂÒÖF‚æfÆö÷"‡&æBƒÂ2’’R3°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â#ÂÂå‚ævÆ÷rÂ#cÂãRÂÂ2ÂG'VR“°¢6g‚‚wvfRr“°¢ÒVÇ6R–b‡F†—2çBÃÒ’°¢òòD„Rd5DU5B$õ52”âD„RtÔR„BäòDTÄÅ2â—G2F6‚6÷fW'2# ¢òò‚÷2v–ç7B†W"3CæBf—&VB7G&–v‡B÷WBöb–FÆR(	Bæ÷F†–ærFð¢òò&VBÂæ÷F†–ærFò&VBÂæBF†R6ÖRf÷"F†R÷Væ6Râ&÷F‚æ÷p¢òòvF†W"f—'7BÂöâF†R6†&VB'VFvWBÂv—F‚F†R6÷VæBF†RFVÆÀ¢òò7—7FVÒf—&W2WFöÖF–6ÆÇ’öâVçFW&–ær§v&â7FFRâF†Rf–v‡@¢òò—27F–ÆÂF†RF–v‡FW7B7–6ÆR–âF†RvÖS²—B—2æ÷rf—"öæRà¢òòââääB•B$TE2D„Rtƒ##bÓÓ‚’â7–6ÆR²²R6f—&VBF6‚À¢òò÷Væ6RÂ7&VBv†FWfW"F†RF—7Fæ6R(	B7&VBBö–çB&Ææ°¢òòæB÷Væ6Rg&öÒ7&÷72F†R&ööÒâ6B÷Væ6W2öâv†B—0¢òò6Æ÷6RÂ6Æ6†W27&÷72F†RÖ–FFÆRF—7Fæ6RÂæB7—G2Æ–v‡B@¢òòv†B—B6ææ÷B&V6‚–WBà¢6öç7BvG‚ÒÖF‚æ'2‡‚ÒF†—2æ7‚‚’“°¢6öç7Bv"ÒvG‚Âcò¢vG‚Â3ƒò¢#°¢6öç7B–6²Ò&÷74G&r‡F†—2Âµ²w÷Væ6RrÂ³2ÂÂãUÕ¶v%ÕÒÂ²vF6‚rÂ³Â2Â%Õ¶v%ÕÒÂ²w7&VBrÂ³ãRÂÂ5Õ¶v%ÕÕÒ“°¢òòââääBD„Rt$ä”är4•2t„”4‚ôäR•B•2ƒ##bÓÓ"’à¢òð¢òòÆÂF‡&VRW6VBDTÄÅôd5BÂF†R÷Væ6RBãƒböb—BÂæ@¢òòFW7G2ö&÷77v–æF÷ræ6§2ÖV7W&VBF†VÒB332ò3crò3cr×3¢F‡&VP¢òòF–ffW&VçBGF6·2ææ÷Væ6–ærF†V×6VÇfW2f÷"F†R6ÖRF†—&Böb¢òò6V6öæBÂ–ç6–FRF†RöæRf–v‡Bv†W&RF†RFö7G&–æR6—2æòGvð¢òòFVÆVw&‡2Ö’&VBÆ–¶RâF†RFV6²Ç&VG’6W&FW2F†VÒ'¢òòD•5Dä4R(	B÷Væ6R6Æ÷6RÂF6‚Ö–BÂ7&VBf"(	B6òF†RÆ–W ¢òò6÷VÆB–æfW"F†RÖ÷fRg&öÒF†RvÂæBF†VâF†Rv—2Fö–ærF†P¢òòv†öÆR¦ö"æBF†RFVÆÂ—26''––æræ÷F†–ærà¢òð¢òòæ÷rF†RÆVæwF‚—2–æf÷&ÖF–öââF†RF‡&VR6—¦W2Ç&VG’W†—7Bæ@¢òòÇ&VG’ÖVâ6öÖWF†–ærÂ6òF†W’&RW6VB2ÖVçC¢Æ–æR–÷P¢òò7FW÷WBöb—2V–6²ÂÆVF†B6öÖÖ—G2—2F†RÖ–FFÆRÂæBF†P¢òò&VæÖ6†æv–æröæRvWG2F†R†Vg’FVÆÂ—Bv2Çv—2÷vVBà¢òð¢òòF6‚DTÄÅôd5B3S×2Væ6†ævVB(	BÆ–æRÂç7vW&VB'’7FW ¢òò÷Væ6R3ÓâS×2—Bv2F†R4„õ%DU5Bv&æ–ær–âF†P¢òòf–v‡BGF6†VBFòF†R6Æ÷6W7Bæ@¢òòÖ÷7B6öÖÖ—GFVBÖ÷fRÂv†–6‚—0¢òò&6·v&G3²DTÄÅõ5t•P¢òò7&VB3SÓâs×2DTÄÅô„Te’Âv†÷6RFö7VÖVçFVB¦ö"—0¢òòF†R&VæÖ6†æv–ærÖ÷fRÂv†–6‚—0¢òòW†7FÇ’v†B7&VBöbÆ–v‡B—0¢–b‡–6²ÓÓÒvF6‚r’²F†—2ç7BÒvF6‡v&âs²F†—2çBÒDTÄÅôd5C²F†—2çg‚Ò²Ð¢VÇ6R–b‡–6²ÓÓÒw÷Væ6Rr’²F†—2ç7BÒw÷Væ6Wv&âs²F†—2çBÒDTÄÅõ5t•S²F†—2çg‚Ò²Ð¢òòD„R5$TB„Bäòt”äBÕU†Fö72ö6öÖ&Bôô$õ55ôTD•C¢&f—&W0¢òòg&öÒ–FÆRv—F‚æòFVF–6FVBFVÆÂ"’â—BvF†W'2Æ–¶RF†R÷F†W'2à¢VÇ6R²F†—2ç7BÒw7&VGv&âs²F†—2çBÒDTÄÅô„Te“²F†—2çg‚Ò²Ð¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw7&VGv&âr’°¢F†—2çg‚Ò²F†—2çBÓÒGC°¢F†—2æf6RÒÖF‚ç6–vâ‡‚ÒF†—2æ7‚‚’’ÇÂF†—2æf6S°¢–b†6†æ6Rƒãr’’FE'B‡F†—2æ7‚‚’²F†—2æf6R¢&æBƒ‚Â#b’ÂF†—2æ7’‚’Ò&æBƒBÂb’À¢F†—2æf6R¢&æBƒ#Âs’Â×&æBƒ#Âƒ’Âã#"ÂDTÄÅô4ôÂÂ"ãBÂÂG'VR“°¢–b‡F†—2çBÃÒ’°¢F†—2çg’ÒÓCƒ°¢f÷"†ÆWB²ÒÓ²²ÃÒ²²²²’°¢6öç7BÒÖF‚æFã"‡’ÒF†—2æ7’‚’Â‚ÒF†—2æ7‚‚’’²²¢ã3°¢F†—2ç6†ö÷B„ÖF‚æ6÷2†’¢3ÂÖF‚ç6–â†’¢3Âb“°¢Ð¢F†—2ç7BÒw&W7Bs²F†—2çBÒ&÷75&W7B‡F†—2Âã‚“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvF6‡6Æ6‚r’°¢F†—2çBÓÒGC°¢F†—2çG&–ÅBÒ‡F†—2çG&–ÅBÇÂ’ÒGC°¢–b‡F†—2çG&–ÅBÃÒ’²F†—2çG&–ÅBÒã3²FE'B‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂÂÂã2ÂÂå‚ævÆ÷rÂRÂÂG'VR“²Ð¢–b‡F†—2çBÃÒ’²F†—2ç7BÒw&W7Bs²F†—2çBÒ&÷75&W7B‡F†—2ÂãsR“²F†—2çg‚Ò²Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw÷Væ6Rr’°¢òòÆæF–ær—2FV6–FVB'’F†R7GVÂ6öÆÆ—6–öâ&VÆ÷rÂæ÷B&÷rBà¢òòF†RöÆBF‡&W6†öÆB6÷VÆB&W7B–âÖ–BÖ—"÷"æWfW"&V6÷fW"öâÆVFvRà¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw&W7Br’°¢F†—2çg‚Ò²F†—2çBÓÒGC°¢–b‡F†—2çBÃÒ’²F†—2ç7BÒv–FÆRs²F†—2çBÒ&æBƒã2Âãr“²Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvÇ7fæ—6‚r’°¢òòvöæR(	BöæÇ’F†RF‡&VRvÆ÷v–ærgFW&–ÖvW2&VÖ–â‡F†RFVÆÂ¢F†—2çg‚Ò²F†—2çg’Ò²F†—2çBÓÒGC°¢–b‡F†—2çBÃÒ’°¢6öç7B7÷BÒF†—2æÇ57÷G5·F†—2æÇ5&VÅÓ°¢F†—2ç‚Ò7÷Bç‚ÒF†—2çrò#²F†—2ç’Ò7÷Bç’ÒF†—2æƒ°¢'W'7B‡7÷Bç‚Â7÷Bç’ÒF†—2æ‚ò"Â‚ÂÂå‚ævÆ÷rÂ3ÂãRÂcÂ2ÂG'VR“°¢6g‚‚vF6‚r“°¢òòF†Rf¶W2f—&S²F†R&VÂöæR÷Væ6W0¢F†—2æÇ57÷G2æf÷$V6‚‚‡3"Â’’Óâ°¢–b†’ÓÓÒF†—2æÇ5&VÂ’&WGW&ã°¢6öç7BÒÖF‚æFã"‡’Ò‡3"ç’Ò#’Â‚Ò3"ç‚“°¢F†—2ç6†ö÷B„ÖF‚æ6÷2†’¢3CÂÖF‚ç6–â†’¢3CÂRÂÂBÂ²ƒ¢3"ç‚Â“¢3"ç’Ò#Ò“°¢'W'7B‡3"ç‚Â3"ç’Ò#ÂÂr6SSfbrÂ#ÂãBÂÂ"ãRÂG'VR“°¢Ò“°¢F†—2æÇ57÷G2ÒçVÆÃ°¢F†—2æf6RÒÖF‚ç6–vâ‡‚ÒF†—2æ7‚‚’’ÇÂ°¢F†—2ç7BÒw÷Væ6Rs²F†—2çg’ÒÓC#²F†—2çg‚ÒF†—2æf6R¢Cc¢7C°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒv&77–âr’°¢òòF†RGW&çF&ÆR67&V×2WFògVÆÂ7VVB(	B7&·26Æ–Ö&–ærF†R6ö–Ç0¢F†—2çg‚Ò²F†—2çBÓÒGC²F†—2çv–æEBÒã3°¢–b†6†æ6Rƒã’’’FE'B‡F†—2æ7‚‚’²&æB‚Ó3Â3’ÂF†—2ç’²F†—2æ‚ÒbÀ¢&æB‚ÓCÂC’Â&æB‚ÓcÂÓc’ÂãBÂr3†fcffbrÂ"ãRÂÂG'VR“°¢–b‡F†—2çBÃÒ’°¢F†—2ç7BÒv&77F÷&Òs²F†—2çBÒRã#²F†—2ç7F÷&ÕBÒRã#°¢F†—2ç7G&–¶W2ÒµÓ²F†—2ç7G&–¶UBÒã#°¢ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚Âã2“²6Òç6†¶RÒƒ²6g‚‚w&ö"r“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvF6‡v&âr’°¢F†—2çg‚Ò²F†—2çBÓÒGC°¢F†—2æf6RÒÖF‚ç6–vâ‡‚ÒF†—2æ7‚‚’’ÇÂF†—2æf6S°¢–b†6†æ6Rƒãr’’FE'B‡F†—2æ7‚‚’²F†—2æf6R¢&æBƒÂ3B’ÂF†—2æ7’‚’²&æB‚ÓBÂB’À¢×F†—2æf6R¢&æBƒcÂ“’Â&æB‚Ó3Â3’Âã#"ÂDTÄÅô4ôÂÂ"ãBÂÂG'VR“°¢–b‡F†—2çBÃÒ’²F†—2ç7BÒvF6‡6Æ6‚s²F†—2çBÒãC#²F†—2çg‚ÒF†—2æf6R¢s#¢7C²Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw÷Væ6Wv&âr’°¢F†—2çg‚Ò²F†—2çBÓÒGC°¢F†—2æf6RÒÖF‚ç6–vâ‡‚ÒF†—2æ7‚‚’’ÇÂF†—2æf6S°¢–b†6†æ6Rƒãr’’FE'B‡F†—2æ7‚‚’²&æB‚ÓbÂb’ÂF†—2ç’²F†—2æ‚Ò&æBƒÂ’À¢&æB‚ÓCÂC’Â×&æBƒCÂS’Âã#BÂDTÄÅô4ôÂÂ"ãBÂÂG'VR“°¢–b‡F†—2çBÃÒ’²F†—2ç7BÒw÷Væ6Rs²F†—2çg’ÒÓc²F†—2çg‚ÒF†—2æf6R¢3ƒ¢7C²Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒv&77F÷&Òr’°¢òò†–F–ær–ç6–FRF†R7F÷&Ó¢VçF÷V6†&ÆRÂ'WBWfW'’7G&–¶R—2FöÆ@¢òò'’—G2fÆö÷"ÖvÆ÷rgVÆÂ6V6öæBV&Ç¢F†—2çg‚Ò²F†—2çBÓÒGC²F†—2ç7F÷&ÕBÒF†—2çC°¢F†—2ç7G&–¶UBÓÒGC°¢–b‡F†—2ç7G&–¶UBÃÒbbF†—2çBâã’°¢F†—2ç7G&–¶UBÒãc°¢F†—2ç7G&–¶W2çW6‚‡²ƒ¢6Æ×‡‚²&æB‚ÓCÂC’ÂCÂrç&ööÔFVbçr¢D”ÄRÒC’ÂC¢ãÒ“°¢Ð¢–b†6†æ6Rƒã‚’’FE'B‡F†—2æ7‚‚’²&æB‚Ó3bÂ3b’ÂF†—2ç’²&æB‚ÓÂF†—2æ‚’À¢&æB‚ÓcÂc’Â&æB‚ÓCÂC’Âã"Âr3†fcffbrÂ"ÂÂG'VR“°¢–b‡F†—2çBÃÒ’°¢F†—2ç7F÷&ÕBÒ°¢F†—2ç7BÒw&W7Bs²F†—2çBÒ&÷75&W7B‡F†—2ÂãB“°¢F†—2ç7FuBÒÖF‚æÖ‚‡F†—2ç7FuBÂãR“²òòfVÆÂöfbF†RF—60¢6Òç6†¶RÒs²6g‚‚w6ÆÒr“°¢Ð¢Ð¢òòF†R7F÷&Òw2Æ–v‡Fæ–æs¢v&âöâF†RfÆö÷"ÂF†VâF†R&öÇ@¢–b‡F†—2ç7G&–¶W2bbF†—2ç7G&–¶W2æÆVæwF‚’°¢f÷"†ÆWB’ÒF†—2ç7G&–¶W2æÆVæwF‚Ò²’ãÒ²’ÒÒ’°¢6öç7B3"ÒF†—2ç7G&–¶W5¶•Ó²3"çBÓÒGC°¢–b‡3"çBÃÒ’°¢6öç7Bw’ÒR¢D”ÄS°¢f÷"†ÆWB²Ò²²Âƒ²²²²¢FE'B‡3"ç‚²&æB‚ÓÂ’Âw’Ò²¢SRÒ&æBƒÂC’Â&æB‚ÓCÂC’Â&æB‚Ó#Â#’ÂãbÂr6Fff6fbrÂ2ÂÂG'VR“°¢'W'7B‡3"ç‚Âw’Ò‚ÂBÂr3†fcffbrÂ#cÂãBÂ#Â2ÂG'VR“°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂb“²6g‚‚v–6V6öÇVÖâr“°¢–b‚Æ–W"æFVBbbÖF‚æ'2‡‚Ò3"ç‚’ÂC"bb’âw’Ò“’Æ–W"æ‡W'B„Db‚’æVFÖrÂ3"ç‚“°¢F†—2ç7G&–¶W2ç7Æ–6R†’Â“°¢Ð¢Ð¢Ð¢6öç7B6öÂÒ‡F†—2ç7BÓÓÒvÇ7fæ—6‚rÇÂF†—2ç7BÓÓÒv&77F÷&Òr’ò·Ò¢Ö÷fTVçB‡F†—2ÂGB“°¢–b‡F†—2ç7BÓÓÒw÷Væ6Rrbb6öÂæB’°¢F†—2ç7BÒw&W7Bs²F†—2çBÒ&÷75&W7B‡F†—2ÂãsR“²F†—2çg‚Ò°¢F†—2ç'¤ÆæEBÒãc²6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂb“²6g‚‚vÆæBr“°¢Ð¢–b‡F†—2ç7BÓÓÒvF6‡6Æ6‚rbb†6öÂæÂÇÂ6öÂç"’’²F†—2ç7BÒw&W7Bs²F†—2çBÒ&÷75&W7B‡F†—2Âã‚“²F†—2çg‚Ò²Ð¢'&V³°¢Ð¢òòÒÒÒÒÔõD„U"Õc¢F†RçVÆÂ6÷&RÒÒÒÐ¢66RvÖ÷F†W"s¢°¢òò4„RäUdU"ÔõdTBâ†W"’v26–æRæB†W"‚v2v†W&WfW"6†P¢òò7væVBÂ6ò†ÆbF†RÆ7Bf–v‡B–âF†RvÖRÖV7W&VB2fÆöF–æp¢òò6†VÆÂv—F–ærf÷"F–ÖW"(	Bv†–6‚—2F†R6ÖR6ö×Æ–çBtÄ4”U$P¢òò†BÂæBF†R6ÖRç7vW#¢†öÆB5DD”ôâ&VÆF—fRFòF†RÆ–W"À¢òò&V6Æ–ÖVBgFW"WfW'’7F–öâÂ6òF†R&VB&WGvVVâGF6·2—2à¢òò&ö6‚&F†W"F†âW6Rà¢òòââæW†6WBv†–ÆR6†R—25TåC¢F†R&V6÷fW'’÷vç2†W"÷6—F–öâF†Và¢òò†—B6–æ·2†W"FòF†RÆ–W"w2ÆWfVÂ(	B6VRF†Rw&V6÷fW"r'&æ6‚¢–b‡F†—2ç7BÓÒw&V6÷fW"r’°¢F†—2ç’ÒÆW'‡F†—2ç’Â²ÖF‚ç6–â‡F†—2ææ–Ò¢ã’¢`¢²6Æ×‡’Ò3ÂÓsÂs’¢ã3RÂÖF‚æÖ–âƒÂGB¢"ã"’“°¢6öç7BÕrÒrç&ööÔFVbçr¢D”ÄS°¢–b‡F†—2æÕ7FBÓÒçVÆÂÇÂ‡F†—2æÕ7FEBÒ‡F†—2æÕ7FEBÇÂ’ÒGB’ÃÒ’°¢F†—2æÕ7FBÒ†6†æ6RƒãR’òÓ¢’¢&æBƒ“Â#“°¢F†—2æÕ7FEBÒ&æBƒãbÂ"ã‚“°¢Ð¢6öç7BFwBÒ6Æ×‡‚²F†—2æÕ7FBÂ“ÂÕrÒ“’ÒF†—2çrò#°¢F†—2ç‚ÒÆW'‡F†—2ç‚ÂFwBÂÖF‚æÖ–âƒÂGB¢ãR’“°¢Ð¢òò„4R4„”eC¢7&÷76–ærsRóSó#RR6†GFW'2GvòÖ÷&R6†VÆÂÆFW2à¢òòF†R6÷&R'W&ç2'&–v‡FW"Fò6ö×Vç6FRæBV6‚'&V²VæÆö6·2¢òò7'VVÆÆW"G&–6³¢F÷V&ÆRçVÆÂvfRÂF†VâF†RFVæG&–Âw&"ÂF†Và¢òòF†RW‡÷6VB6÷&R7—GF–ærv–FW"&–æw2à¢6öç7B„g&2ÒF†—2æ‡òF†—2æ‡Öƒ°¢6öç7BvçE‚Ò„g&2ÃÒã#Rò2¢„g&2ÃÒãRò"¢„g&2ÃÒãsRò¢°¢–b‚‡F†—2æÕ†6RÇÂ’ÂvçE‚’°¢F†—2æÕ†6RÒvçEƒ°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â3Âr6#C†6fbrÂC#Âã‚ÂÂBÂG'VR“°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂBÂr6ffCsfrÂ3ÂãbÂÂ2ÂG'VR“°¢6Òç6†¶RÒ²6g‚‚w†6Rr“²ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚Âã#R“°¢F†—2ç7FuBÒÖF‚æÖ‚‡F†—2ç7FuBÂãR“²òò&Vf÷&Ö–ær(	B'&–Vbv–æF÷p¢Ð¢F†—2æ×44BÒF†—2æ×44BÓÒçVÆÂò"¢F†—2æ×44BÒGC°¢òòDõDÂåTÄÃ¢öæ6RÂ&VÆ÷r#R(	BWfW'’Æ–v‡B–âF†R&VæF–W0¢–b‚F†—2çFåW6VBbb„g&2ÃÒã"bbF†—2ç7BÓÒv×6öærrbbF†—2ç7BÓÒvçv6†&vRr’°¢F†—2çFåW6VBÒG'VS°¢F†—2ç7BÒwFçVÆÂs²F†—2æçuBÒãC²F†—2æ&VÒÒçVÆÃ°¢ræF&µBÒ‚ãC²rçFö7B‡B‚wFå÷v&âr’“°¢6g‚‚w&ö"r“²ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚ÂãB“²6Òç6†¶RÒ“°¢Ð¢F†—2çBÓÒGC°¢–b‡F†—2æ&VÒ’°¢F†—2æ&VÒçBÓÒGC°¢–b‡F†—2æ&VÒçv&âbbF†—2æ&VÒçBÃÒ’²F†—2æ&VÒçv&âÒfÇ6S²F†—2æ&VÒçBÒãS²6g‚‚v&VÖf—&Rr“²6Òç6†¶RÒƒ²Ð¢VÇ6R–b‚F†—2æ&VÒçv&â’°¢–b‚Æ–W"æFVBbb&"‡F†—2æ&VÒÂÆ–W"’’Æ–W"æ‡W'B„Db‚’æVFÖrÂF†—2æ&VÒç‚²F†—2æ&VÒçrò"“°¢–b‡F†—2æ&VÒçBÃÒ’F†—2æ&VÒÒçVÆÃ°¢Ð¢Ð¢òòåTÄÂtdR–âfÆ–v‡C¢&Æ6²&–ærÂ&VBVFvR(	B§V×—B÷"VBF†R6†÷fP¢–b‡F†—2æçvfR’°¢6öç7BçrÒF†—2æçvfS°¢çrç"³Ò#C¢GC°¢6öç7BC"ÒÖF‚æ‡—÷B‡‚ÒF†—2æ7‚‚’Â’ÒF†—2æ7’‚’“°¢–b„ÖF‚æ'2†C"Òçrç"’Â‚bbÆ–W"æFVBbbÆ–W"æ•BÃÒ’°¢Æ–W"æ‡W'B„Db‚’æVFÖrÂF†—2æ7‚‚’“°¢Æ–W"çg‚Ò„ÖF‚ç6–vâ‡‚ÒF†—2æ7‚‚’’ÇÂ’¢cC°¢Æ–W"ç6Æ÷uBÒÖF‚æÖ‚‡Æ–W"ç6Æ÷uBÂã"“°¢Ð¢–b†çrç"âc#’°¢çræâÒÓ°¢–b†çræââ’çrç"Ò°¢òòF†RvfRw2÷vâv–æF÷rv27FuBã†W&RÂv†–6‚g&÷¦R†W ¢òòv†W&WfW"6†R‡Vær(	B#S‚÷fW"F†RfÆö÷"âF†R6–æ²gFW"F†P¢òò6†&vR†&VÆ÷r’—2F†Bv–æF÷ræ÷rÂæB—B—2–â&V6‚à¢VÇ6RF†—2æçvfRÒçVÆÃ°¢Ð¢Ð¢–b‡F†—2ç7BÓÓÒvçv6†&vRr’°¢òòF†RFVÆÂ—24”ÄTä4S¢F†R†Æòg&VW¦W2æBF†R6÷&R'Vç2&Æ6°¢F†—2æçuBÓÒGC°¢–b‡F†—2æçuBÃÒ’°¢F†—2æçvfRÒ²#¢Âã¢‡F†—2æÕ†6RÇÂ’ãÒò"¢Ó°¢6Òç6†¶RÒ“²6g‚‚w6†ö6·&–ærr“²ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚Âã2“°¢Ö÷F†W%&V6÷fW"‡F†—2ÂwvfRr“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒv×6öærr’°¢òòÔõD„U"u24ôäs¢F†R÷&–v–æÂ'&öF67B(	B&VBv†W&R†W'2—27–à¢F†—2æçuBÓÒGC°¢–b†6†æ6Rƒã‚’’°¢6öç7BöÒ&æBƒÂbã#‚“°¢FE'B‡F†—2æ7‚‚’²ÖF‚æ6÷2†ö’¢CÂF†—2æ7’‚’²ÖF‚ç6–â†ö’¢CÀ¢ÖF‚æ6÷2†ö’¢cÂÖF‚ç6–â†ö’¢cÂãBÂ6†æ6RƒãR’òr6Sc3“Cbr¢r6#C†6fbrÂ"ãRÂÂG'VR“°¢Ð¢–b‡F†—2æçuBÃÒ’°¢F†—2ç7BÒv–FÆRs°¢rç6öætÆö6µBÒ²rç&WeBÒS²rçFö7B‡B‚v×5÷v&âr’“°¢6g‚‚w†6Rr“²6Òç6†¶RÒs°¢F†—2ç7FuBÒÖF‚æÖ‚‡F†—2ç7FuBÂã‚“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒwFçVÆÂr’°¢òòGF6·26öÖR÷WBöbF†RF&²v—F‚6÷VæBf÷"FVÆÃ²F†R6öæp¢òò'W—2F‡&VR6V6öæG2öb6–v‡@¢F†—2æçuBÓÒGC°¢–b‡F†—2æçuBÃÒ’²F†—2æçuBÒãC²6g‚‚vÆ6‚r“²F†—2æÆ6‚Ò²ƒ¢‚Â“¢’ÂC¢ãRÓ²Ð¢–b‡F†—2æÆ6‚’°¢F†—2æÆ6‚çBÓÒGC°¢–b‡F†—2æÆ6‚çBÃÒ’°¢'W'7B‡F†—2æÆ6‚ç‚ÂF†—2æÆ6‚ç’Â"Âr6#C†6fbrÂ#CÂãBÂÂ2ÂG'VR“°¢–b‚Æ–W"æFVBbbÖF‚æ‡—÷B‡‚ÒF†—2æÆ6‚ç‚Â’ÒF†—2æÆ6‚ç’’ÂCb¢Æ–W"æ‡W'B„Db‚’æVFÖrÂF†—2æÆ6‚ç‚“°¢F†—2æÆ6‚ÒçVÆÃ°¢Ð¢Ð¢–b‚„ræF&µBÇÂ’ÃÒ’°¢òòÆ–v‡G2&WGW&ã¢6†R†æw2W‡÷6VBÂWfW'’ÆFR÷Vâ(	Bd”ä•4‚•@¢F†—2ç7BÒv–FÆRs²F†—2çBÒ&÷75&W7B‡F†—2Â"ã“²F†—2æÆ6‚ÒçVÆÃ°¢F†—2ç7FuBÒÖF‚æÖ‚‡F†—2ç7FuBÂ"ã“°¢ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚Âã2“²6g‚‚w†6Rr“°¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvw&'v&âr’°¢òòFVæG&–Â&72÷WBæB†÷fW'2öâ–÷R(	B'&V²Æ–æRÖöb×VÆÂ'’Ö÷f–æp¢F†—2æçuBÓÒGC°¢–b‡F†—2æçuBÃÒ’²F†—2ç7BÒvw&"s²F†—2æçuBÒã“²6g‚‚vF6‚r“²Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒvw&"r’°¢F†—2æçuBÓÒGC°¢–b‚Æ–W"æFVB’°¢Æ–W"çg‚³Ò„ÖF‚ç6–vâ‡F†—2æ7‚‚’Ò‚’ÇÂ’¢S¢GC°¢–b†6†æ6Rƒãb’’FE'B†ÆW'‡F†—2æ7‚‚’Â‚Â&æBƒã"Âã’’’ÂÆW'‡F†—2æ7’‚’Â’Â&æBƒã"Âã’’’À¢&æB‚Ó3Â3’Â&æB‚Ó3Â3’Âã"Âr6#C†6fbrÂ"ÂÂG'VR“°¢Ð¢–b‡F†—2æçuBÃÒ’Ö÷F†W%&V6÷fW"‡F†—2Âvw&"r“°¢ÒVÇ6R–b‡F†—2ç7BÓÓÒv&V×v&âr’°¢F†—2æçuBÓÒGC²F†—2çv–æEBÒã3°¢–b‡F†—2æçuBÃÒ’Ö÷F†W%&V6÷fW"‡F†—2Âv&VÒr“°¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw&V6÷fW"r’°¢òò5TåC¢F†R6÷&R6w2÷WBöbF†R—"FòF†RÆ–W"w2ÆWfVÂ(	@¢òòVæFW'6–FR&öG’Ö†V–v‡B÷fW"†W"†VBÂ&W6–FR†W"ÂæWfW"öâ†W"(	@¢òòæB†æw2F†W&RfVçF–ærâF†R†öÆBv—G2f÷"†W"÷vâ&VÒFò'W&à¢òò÷WC¢â÷Væ–ær–ç6–FRÆ—fR&VÒ—2æ÷BöæRà¢&÷75&V5G&6²‡F†—2“°¢6öç7B²ÒÒÖF‚æW‡‚Ór¢GB“°¢F†—2ç‚³Ò‡F†—2ç&V5‚ÒF†—2çrò"ÒF†—2ç‚’¢ƒÒÖF‚æW‡‚ÓB¢GB’“°¢F†—2ç’³Ò‡F†—2ç&V5’ÒF†—2ç’’¢³°¢F†—2ç&V56–æ²ÓÒGC°¢–b‚F†—2æ&VÒbb„ÖF‚æ'2‡F†—2ç’ÒF†—2ç&V5’’Â‚ÇÂF†—2ç&V56–æ²ÃÒ’’°¢F†—2ç&V5BÓÒGC°¢–b‡F†—2ç&V5BÃÒ’²F†—2ç7BÒv–FÆRs²F†—2çBÒ‡F†—2ç†6RÓÓÒ"òãCR¢ãb’¢ƒÒ‡F†—2æÕ†6RÇÂ’¢ã‚“²Ð¢Ð¢ÒVÇ6R–b‡F†—2ç7BÓÓÒw&–æv6†&vRr’°¢òò„U"$”är„2äUdU"ôä4Rd•$TBà¢òð¢òò&–æv6†&vV—2†æFÆVB–âåTÄÄdärw27FFR6†–âæBæ÷v†W&RVÇ6Rà¢òòF†RÆ7B&÷72–âF†RvÖR6WG2F†R7FFRÂÖF6†W2æöæRöb†W"÷và¢òò'&æ6†W2ÂfÆÇ2F‡&÷Vv‚Fò'–6²6öÖWF†–ær"ÂæB7FæG27F–ÆÂf÷ ¢òòF†Rv†öÆR&VB&Vf÷&R6†ö÷6–ærv–ââöæR7F–öâ–âf÷W"v2¢òòæòÖ÷(	Bv†–6‚—2W†7FÇ’F†RsBRöbF†Rf–v‡BF†RÖV7W&VÖVçBf÷Væ@¢òò†W"7VæF–ær–â6–ævÆR7FFR(	BæBF†R&–ær—G6VÆbÂ6—‡FVVà¢òò&ö¦V7F–ÆW2F‡&÷vâ–çFò6÷fW&ÆW72&VæÂ†W"6–væGW&RÖ÷fRÂ†0¢òòæWfW"vöæRöfb–â6†—VB'V–ÆBà¢F†—2çg‚Ò²F†—2æçuBÓÒGC²F†—2çv–æEBÒã3°¢°¢6öç7B&²ÒÒ6Æ×‡F†—2æçuBòãrÂÂ“°¢f÷"†ÆWB’Ò²’Â#²’²²’°¢6öç7B&Ò&æBƒÂbã#‚’Â'#2ÒSÒ&²¢C°¢FE'B‡F†—2æ7‚‚’²ÖF‚æ6÷2‡&’¢'#2ÂF†—2æ7’‚’²ÖF‚ç6–â‡&’¢'#2À¢ÔÖF‚æ6÷2‡&’¢#3ÂÔÖF‚ç6–â‡&’¢#3Âã2ÂDTÄÅô4ôÂÂ"ã‚ÂÂG'VR“°¢Ð¢Ð¢–b‡F†—2æçuBÃÒ’°¢F†—2ç&–ær‚‡F†—2ç†6RÓÓÒ"òb¢"’²‡F†—2æÕ†6RÇÂ’¢"À¢#S¢„Db‚’æW7BÇÂ’ÂF†—2ææ–Ò“°¢6g‚‚v÷&'6†÷Br“²6Òç6†¶RÒc°¢Ö÷F†W%&V6÷fW"‡F†—2Âw&–ærr“°¢Ð¢ÒVÇ6R–b‡F†—2çBÃÒ’°¢6öç7B"ÒF†—2ç†6RÓÓÒ#°¢òò†W"FV6—6–öâ&VBÂv†–6‚t2F†Rf–v‡C¢ãR2öbæ÷F†–ær&WGvVVà¢òòWfW'’7F–öâÂv–ç7B7F–öç2F†BÆ7BvVÆÂVæFW"6V6öæ@¢F†—2çBÒ‡"òãc"¢ã’’¢ƒÒ‡F†—2æÕ†6RÇÂ’¢ã‚“°¢–b‡F†—2æ×44BÃÒbb‡F†—2æÕ†6RÇÂ’ãÒ’°¢F†—2æ×44BÒ&æBƒ‚Â#B“°¢F†—2ç7BÒv×6öærs²F†—2æçuBÒãc²6g‚‚v×6öærr“°¢ÒVÇ6R°¢òòD„RDT4²Â'’&ævRƒ##bÓÓ‚’(	B7–6ÆR²²RFv–âÂæBF†P¢òò6ÖRFVfæW73¢F†RvfRF†BÆVfW2†W"&öG’v2F‡&÷vâB¢òòÆ–W"7&÷72F†R&VæÂF†R&VÒF†B7&÷76W2F†R&VæB¢òòÆ–W"VæFW"†W"â6Æ÷6RÂF†RçVÆÂvfS²f"ÂF†R&VÒæB†öæ6P¢òòF†R6†VÆÂ—2'&V¶–ær’F†RFVæG&–ÂF†BG&w2–÷R&6²–ã²F†P¢òò&–ærWfW'—v†W&RâF†R&Æö"—2G&vâöæÇ’v†–ÆRF†R&ööÒ†0¢òò76Rf÷"—Bà¢6öç7BÖG‚ÒÖF‚æ'2‡‚ÒF†—2æ7‚‚’“°¢6öç7BÖ"ÒÖG‚Â##ò¢ÖG‚ÂC#ò¢#°¢6öç7Bs"Ò‡F†—2æÕ†6RÇÂ’ãÒ#°¢6öç7B&Æö$ö²ÒræVæVÖ–W2æf–ÇFW"†RÓâRæFVB’æÆVæwF‚Â#°¢6öç7Bv†–6‚Ò&÷74G&r‡F†—2Â°¢²wvfRrÂF†—2æçvfRò¢³BÂãRÂã5Õ¶Ö%ÕÒÀ¢²w&–ærrÂ³"ãRÂ"ÂÕ¶Ö%ÕÒÀ¢²vw&"rÂs"ò³ÂÂ5Õ¶Ö%Ò¢ÒÀ¢²v&Æö"rÂ&Æö$ö²òãr¢ÒÀ¢²v&VÒrÂ³ã2Â"ÂEÕ¶Ö%ÕÒÀ¢Ò“°¢–b‡v†–6‚ÓÓÒwvfRr’²F†—2ç7BÒvçv6†&vRs²F†—2æçuBÒã²6g‚‚væòr“²Ð¢òòD„R$”ärtD„U%2d•%5Bâ6—‡FVVâ&ö¦V7F–ÆW2W6VBFòV"–â¢òò6–ævÆRg&ÖRÂ–â3B×F–ÆR&Væv—F‚æò6÷fW"Âv†–ÆR6†R—0¢òòW7VÆÇ’Ö–BÖ—"v—F‚†W"F6‚7VçBâF†R6†&vR—26†÷'B(	BF†—0¢òò—27F–ÆÂF†RÆ7B&÷72(	B'WB—BW†—7G2ÂæBF†RFVÆÂ7—7FVÐ¢òò6÷VæG2—BWFöÖF–6ÆÇ’&V6W6RF†R7FFRæÖR6—2v6†&vRrà¢VÇ6R–b‡v†–6‚ÓÓÒw&–ærr’²F†—2ç7BÒw&–æv6†&vRs²F†—2æçuBÒãs²Ð¢VÇ6R–b‡v†–6‚ÓÓÒvw&"r’²F†—2ç7BÒvw&'v&âs²F†—2æçuBÒãS²6g‚‚v67FçVÆÂr“²Ð¢VÇ6R–b‡v†–6‚ÓÓÒv&Æö"r’°¢6öç7B"ÒæWrVæV×’‚v&Æö"rÂF†—2æ7‚‚’ÒrÂF†—2ç’²F†—2æ‚“°¢ræVæVÖ–W2çW6‚†"“°¢'W'7B‡F†—2æ7‚‚’ÂF†—2ç’²F†—2æ‚Â"ÂÂäRævÆ÷rÂ#ÂãRÂ3Â2ÂG'VR“°¢ÒVÇ6R°¢òòââææBF†R6ÖR–â†W"6†–ã¢F†R7vVW–ær&VÒv2Æ–BF÷và¢òòg&öÒ–ç6–FR–FÆVÂ6òF†RWFöÖF–2FVÆVw&‚æWfW"f—&VBf÷ ¢òò—BæBGvòF†—&G2öbF†RÆ7Bf–v‡B–âF†RvÖRÖV7W&VB2†W ¢òò7FæF–ær7F–ÆÂâ—B—2æÖVB7FFRæ÷rÂÆ–¶RWfW'—F†–ærVÇ6Rà¢6öç7B†÷&—¢Ò"ò6†æ6RƒãR’¢G'VS°¢F†—2æ&VÒÒ†÷&— ¢ò²ƒ¢Â“¢’Ò3BÂs¢rç&ööÔFVbçr¢D”ÄRÂƒ¢c‚ÂC¢ã‚Âv&ã¢G'VRÐ¢¢²ƒ¢‚Ò3BÂ“¢Âs¢c‚Âƒ¢rç&ööÔFVbæ‚¢D”ÄRÂC¢ã‚Âv&ã¢G'VRÓ°¢6g‚‚v&V×v&âr“°¢F†—2ç7BÒv&V×v&âs²F†—2æçuBÒãƒ°¢Ð¢Ð¢Ð¢'&V³°¢Ð¢òòÒÒÒÒD„RU”Ru24ôå5E%T5E2ÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòôäR7FFRÖ6†–æRf÷"ÆÂf—fRÂ&ÖWFW&—6VB'’Ô”ä•ô´•BÂ&V6W6P¢òòf—fR†æB×w&—GFVâÖ6†–æW2—2f—fRÆ6W2f÷"FVÆVw&‚Fòvð¢òòÖ—76–æræBF†Rv†öÆRö–çBöbF†W6R—2F†BF†W’&RÄTt”$ÄRâv†@¢òòF–ffW'2&WGvVVâF†VÒ—2F†R6†RöbF†RGF6²æBF†R6†RöbF†P¢òòF†–æs²F†Rw&ÖÖ"(	BG&–gBÂv–æBWv—F‚–÷W"æÖRöâ—BÂ6öÖÖ—BÀ¢òò&V6÷fW"(	B—2F†R6ÖRÂæB&V–ærF†R6ÖR—2v†BÖ¶W2F†VÐ¢òòÆV&æ&ÆR–âvÖRF†B—2&÷WBFò†fRf—fRÖ÷&Rf–v‡G2–â—Bà¢òòÒÒÒÒD„RÅ„ÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòf—fR6¶–ÆÇ2æBGvò&V6÷fW&–W2ÂÆÂöb—B–â§2÷vöÇfW2æ§26òF†—0¢òò7v—F6‚FöW2æ÷Bw&÷r6—‡F‚†æB×w&—GFVâÖ6†–æRâ—B—2æ÷BöæRö`¢òòF†RW–Rw26öç7G'V7G2æB—B—2æ÷BwV&F–ã¢—B—2F†R6²à¢66RvÇ†s¢Ç†7FW‡F†—2ÂGBÂ‚Â’“²'&V³°¢66Rv6†–ÖRs¢66Rv6'&–W"s¢66RvÖ÷F‚s¢66RvÆGF–6Rs¢66RvÆVç2s¢°¢6öç7B²ÒÔ”ä•ô´•E·F†—2æ¶–æEÓ°¢6öç7BF—7BÒ‚ÒF†—2æ7‚‚’ÂF—7BÒÖF‚æ'2†F—7B“°¢F†—2æf6RÒÖF‚ç6–vâ†F—7B’ÇÂ°¢F†—2çBÓÒGC°¢òòÒÒÒÒt„B•B•2Dô”ärÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòw&—GFVâ2öæR72v—F‚äòV&Ç’'&V·2âF†Rf—'7B7WB'&ö¶R÷WBö`¢òòF†R–FÆR'&æ6‚æB÷WBöbF†Rv–æB×W'&æ6‚ÂæBF†R–çFVw&FR6@¢òòBF†R&÷GFöÒöbF†R66R(	B6òF†R&öG’öæÇ’Ö÷fVBGW&–ærF†RGvð¢òòFVçF‡2öb6V6öæB—Bv27GVÆÇ’GF6¶–ærÂæBWfW'’6öç7G'V7@¢òòÖV7W&VBcÓ“‚RÖ÷F–öæÆW72âF†R7FFRÖ6†–æRFV6–FW2–çFVçC²F†P¢òò&Æö6²gFW"—BÇv—2'Vç2à¢–b‡F†—2ç7BÓÓÒv–FÆRrÇÂF†—2ç7BÓÓÒw&W7Br’°¢–b‡F†—2çBÃÒ’°¢òòÇFW&æFRF†RGvòÖ÷fW2&F†W"F†â&öÆÆ–ærf÷"F†VÓ¢6ö–à¢òòfÆ—&WGvVVâGF6·2—2v†B6öÖ&BÖFW6–vâ6ÆÇ2VæÆV&æ&ÆRÀ¢òòæB—B—2v‡’åTÄÄdärw2F÷V&ÆR7v—Rv2f—†V@¢F†—2æÖ–æ”ÇBÒF†—2æÖ–æ”ÇC°¢6öç7Bf"ÒF—7Bâ²ææV#°¢F†—2ç7BÒ†f"ò²æf"¢‡F†—2æÖ–æ”ÇBò²æ6Æ÷6R¢²æf"’’²wv&âs°¢F†—2çBÒDTÄÅôd5C°¢Ð¢ÒVÇ6R–b‚÷v&âBòçFW7B‡F†—2ç7B’’°¢òòWfW'’v–æB×W—2æÖVBÆÖ÷fSçv&âÂ6òDTÄÅõ5Bf—&W2—G26÷VæBæ@¢òò&÷72æG&r–çG2F†RÖ&W"(	BæòW"Ö6öç7G'V7BFVÆVw&‚6öFP¢F†—2çv–æEBÒDTÄÅôd5C°¢–b‡F†—2çBÃÒ’°¢F†—2ç7BÒF†—2ç7Bç&WÆ6R‚÷v&âBòÂrr“°¢F†—2çBÒ²æGW#²F†—2æf—&VBÒfÇ6S²F†—2æÇVævVBÒfÇ6S°¢Ð¢ÒVÇ6R°¢–b‚F†—2æf—&VB’²F†—2æf—&VBÒG'VS²Ö–æ”f—&R‡F†—2ÂF†—2ç7BÂ²“²Ð¢–b‡F†—2ç7BÓÓÒvÇVævRrbbF†—2æÇVævVB’°¢F†—2æÇVævVBÒG'VS²F†—2çg‚ÒF†—2æf6R¢²æÇVævUc²–b„²æfÇ’’F†—2çg’Ò°¢Ð¢–b‡F†—2ç7BÓÓÒvÇVævRrbbÆ–W"æFVBbbÆ–W"æ•BÃÒbb&"†‡W'D&÷„öb‡F†—2’ÂÆ–W"’¢Æ–W"æ‡W'B„Db‚’æVFÖrÂF†—2æ7‚‚’ÂF†—2æ¶–æB²ræÇVævRr“°¢–b‡F†—2çBÃÒ’²F†—2æÇVævVBÒfÇ6S²F†—2ç7BÒw&W7Bs²F†—2çBÒ&÷75&W7B‡F†—2ÂãSR“²Ð¢Ð¢òòÒÒÒÒäBt„U$R•B•2ÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òò—B—2äUdU"&¶VBâ6öç7G'V7BF†B†öÆG27FF–öâ&WGvVVâÖ÷fW2—0¢òòGW'&WBv—F‚v–æB×WÂv†–6‚—2F†R6ö×Æ–çBF†RwV&F–ç2vW&P¢òò&WGVæVBf÷#²F†W6R&–FR6Æ÷rf–wW&RÖöbÖV–v‡B&÷VæBF†R7FF–öâæ@¢òò¶VW&–F–ær—BF‡&÷Vv‚F†RFVÆVw&‚à¢6öç7B†VÆBÒ÷v&âBòçFW7B‡F†—2ç7B’òãSR¢°¢–b„²æfÇ’’°¢6öç7BFwBÒ‚ÒF†—2æf6R¢²ç7FæBÂG“"Ò’Ò²æ†÷fW#°¢F†—2çg‚³Ò6Æ×‚‡FwBÒF†—2æ7‚‚’’¢"ãBÂÓS#ÂS#’¢GB¢†VÆC°¢F†—2çg’³Ò6Æ×‚‡G“"ÒF†—2æ7’‚’’¢"ãBÂÓC#ÂC#’¢GB¢†VÆC°¢F†—2çg‚³ÒÖF‚æ6÷2‡F†—2ææ–Ò¢ãr’¢²ç7B¢"ãb¢GB¢†VÆC°¢F†—2çg’³ÒÖF‚ç6–â‡F†—2ææ–Ò¢"ãb’¢#¢GB¢†VÆC°¢F†—2çg‚Ò6Æ×‡F†—2çg‚ÂÔ²ç7B¢2ã"Â²ç7B¢2ã"“°¢F†—2çg’Ò6Æ×‡F†—2çg’ÂÓ#CÂ#C“°¢F†—2ç‚³ÒF†—2çg‚¢GC²F†—2ç’³ÒF†—2çg’¢GC°¢F†—2çg‚£Òã“ƒS²F†—2çg’£Òã“sS°¢6öç7Bg’ÒR¢D”ÄRÒF†—2æƒ°¢–b‡F†—2ç’âg’’²F†—2ç’Òg“²–b‡F†—2çg’â’F†—2çg’Ò²Ð¢–b‡F†—2ç’ÂD”ÄR’²F†—2ç’ÒD”ÄS²–b‡F†—2çg’Â’F†—2çg’Ò²Ð¢ÒVÇ6R°¢F†—2çg’³Ò#¢GC°¢òò—BvÆ·2ÂæB—B¶VW2vÆ¶–ærF‡&÷Vv‚—G2÷vâv–æB×W(	BÆGF–6P¢òòF†B7F÷2FVBFòFVÆVw&‚—2ÆGF–6R–÷R6â–væ÷&P¢–b‡F†—2ç7BÓÒw7–¶Rr’F†—2çg‚ÒF†—2æf6R¢²ç7B¢ƒã’¢†VÆB²ã#R’¢7C°¢Ö÷fTVçB‡F†—2ÂGB“°¢Ð¢'&V³°¢Ð¢Ð¢òò&VæwV&C¢&÷726âæWfW"ÆVfRF†R&ööÒ†÷WBÖöbÖ&÷VæG2F–ÆW2&VB0¢òòV×G’Â6ò6†&vRF‡&÷Vv‚Fö÷'v’v÷VÆBW66RæBfÆÂ–çFòF†Rfö–B¢6öç7BÖ…‚Òrç&ööÔFVbçr¢D”ÄRÒF†—2çs°¢–b‡F†—2ç‚Â’²F†—2ç‚Ò²–b‡F†—2çg‚Â’F†—2çg‚Ò²F†—2æDVFvRÒ²Ð¢VÇ6R–b‡F†—2ç‚âÖ…‚’²F†—2ç‚ÒÖ…ƒ²–b‡F†—2çg‚â’F†—2çg‚Ò²F†—2æDVFvRÒ²Ð¢VÇ6RF†—2æDVFvRÒ°¢òòfÆÆ–ær÷WBW6VBFò&²F†R&÷72öâF†R&ööÒw2&÷GFöÒVFvRÂv†–6‚—2ögFVà¢òò–ç6–FR6öÆ–BF–ÆR(	B†Væ6R&÷727GV6²–âF†RfÆö÷"â6VæB—B†öÖR–ç7FVBà¢–b‡F†—2ç’ârç&ööÔFVbæ‚¢D”ÄR²#’°¢F†—2ç‚ÒF†—2ç7våƒ²F†—2ç’ÒF†—2ç7vå“²F†—2çg‚Ò²F†—2çg’Ò°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂBÂr6fffffbrÂ#ÂãRÂÂ2ÂG'VR“°¢Ð¢–b‚Æ–W"æFVBbb&"‡F†—2ÂÆ–W"’bbF†—2ç7BÓÒv–çG&òp¢bbF†—2ç7BÓÒvÇ7fæ—6‚rbbF†—2ç7BÓÒv&77F÷&Òr’Æ–W"æ‡W'B„Db‚’æVFÖrÂF†—2æ7‚‚’“°¢Òf–æÆÇ’°¢–b†Æ–öäÖ÷F–öâ’&V7DÖ÷F–öäVæB‡F†—2ÂGB“°¢–b‡F†—2æ¶–æBÓÓÒvÇ†r’Ç†Ö÷F–öäVæB‡F†—2ÂGB“°¢–b‡G—Vöb&÷74Ö÷F–öäVæBÓÓÒvgVæ7F–öâr’&÷74Ö÷F–öäVæB‡F†—2ÂGB“°¢–b‚F†—2æÖVWBbb‡G—Vöb—4†W&òÓÓÒvgVæ7F–öârbb—4†W&ò‚’’’F†—2ç7–æ4Ö÷F–öåFVÆÂ‚“°¢Ð¢Ð¢òòÒÒÒÒF†RF‡&VR6–væGW&R7—7FV×2ÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢ÆçD&÷&R‡‚’°¢F†—2æ&÷&W2çW6‚‡²‚ÂC¢ÂæW‡C¢ãbÒ“°¢–b‡F†—2æ&÷&W2æÆVæwF‚âB’F†—2æ&÷&W2ç6†–gB‚“°¢Ð¢F–6´&–Æ—F–W2†GBÂ‚Â’’°¢òò&÷&V†öÆW3¢F†RG&–ÆÆW"w2ÆVv7’âF†W’¶VWW'WF–ærgFW"—BÆçG2F†VÒÀ¢òò6òF†RfÆö÷"–÷Rf–v‡Böâ—2v÷'6R–âF†R6V6öæB†ÆbF†âF†Rf—'7Bà¢f÷"†6öç7B"öbF†—2æ&÷&W2’°¢"çB³ÒGC²"ææW‡BÓÒGC°¢–b†"ææW‡BÃÒ’°¢"ææW‡BÒã“°¢6öç7Bw’Òrç&ööÔFVbæ‚¢D”ÄS°¢f÷"†ÆWB’ÒÓ²’ÃÒ²’²²’°¢6öç7B"ÒæWr&ö¢†"ç‚²’¢’Âw’Ò‚Â’¢cÂÓS#ÂfÇ6RÂÂbÂÔBæ7&–×6öâæÖ–BÂ“Âãb“°¢rç&ö§2çW6‚‡"“°¢Ð¢'W'7B†"ç‚Âw’ÒÂÂÔBæ7&–×6öâæÖ–BÂ##ÂãRÂÓ#Â2ÂG'VR“°¢6g‚‚vW'WBr“°¢Ð¢Ð¢òòF†R‡–Öã¢W‡æF–ær&–æw2âF†R6öær6æ6VÇ2—B(	BF—76öææ6RâF†B—2F†P¢òòv†öÆR&V6öâF†—2&÷72†2&VÆÇ2à¢–b‡F†—2æ‡–Öâ’°¢6öç7B‚ÒF†—2æ‡–Öã°¢‚çB³ÒGC²‚ç"³Ò#c¢GC°¢–b‡Æ–W"ç6öæuBâ’²òò6†R6–æw2÷fW"—@¢F†—2æ‡–ÖâÒçVÆÃ°¢F†—2ç7FuBÒÖF‚æÖ‚‡F†—2ç7FuBÂã“°¢ræVÆVÕ÷Ò²C¢ãbÂƒ¢F†—2æ7‚‚’Â“¢F†—2ç’Ò"ÂVÃ¢v×W'"rÓ°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â3ÂTÄTÒæ×W'"ævÆ÷rÂ3ƒÂã‚ÂÂBÂG'VR“°¢6Òç6†¶RÒ“²6g‚‚w÷vW%Wr“°¢ÒVÇ6R°¢òòD„R„TB$ôÄÅ2ÄôärD„RdÄôõ"âF†R&–ærW6VBFò†—B†W"ç—v†W&Röà¢òò—G26—&7VÖfW&Væ6RÂ–âF†R—"÷"öâF†Rw&÷VæB(	BS#‚6—&6ÆR@¢òò#c‚÷2–â#B‚&ööÒÂGvò÷"F‡&VRF–ÖW267BÂv—F‚F†R6öæp¢òò2—G2öæÇ’ç7vW"âFö72ö6öÖ&B6ÆÇ2F†BFöÆÃ¢âW‡æF–ær&V¢òòv—F‚öæRç7vW"â÷væW#¢'v†Vâ—B&ö'2—Bw2æV&Ç’–×÷76–&ÆRFð¢òòW66RâââWfW'’Ö÷fRf÷"6vR6†÷VÆB†fR6÷VçFW"â"6òF†R&–æp¢òòF¶W2öæÇ’u$õTäDTB&öG’(	B¥TÕ—B2—B76W2(	BæBÂ6–æ6R¢òòf6–ær'&6R†öÆG2æ÷rÂuT$Bf6–ærF†R&VÆÂ7F÷2—BFöòâF‡&VP¢òòç7vW'3¢§V×Â'&6RÂ6–ærâ&Vf÷&R(i"gFW#¢ç’&öG’öâF†R&–ær(i ¢òòw&÷VæFVB&öF–W2öæÇ’à¢6öç7BBÒÖF‚æ‡—÷B‡‚ÒF†—2æ7‚‚’Â’ÒF†—2æ7’‚’“°¢–b„ÖF‚æ'2†BÒ‚ç"’ÂbbbÆ–W"æFVBbbÆ–W"æöâ’Æ–W"æ‡W'B„Db‚’æVFÖrÂF†—2æ7‚‚’ÂvFÆ2æ‡–Öâr“°¢–b†‚ç"âS#’²‚æâÒÓ²–b†‚æââ’²‚ç"Ò²ÒVÇ6RF†—2æ‡–ÖâÒçVÆÃ²Ð¢Ð¢Ð¢òòdõ$tR$TÄÃ¢F†RfÆÆVâvVöç2(	BVÖ&VFFVBÂv†—FRÖ†÷BÂöâgW6Rà¢òò'&V²F†VÒV&Ç’†öæR†—BV6‚’÷"&RVÇ6Wv†W&Rv†VâF†W’'W'7Bà¢–b‡F†—2æf÷&vRbbF†—2æf÷&vRæÆVæwF‚’°¢f÷"†ÆWB’ÒF†—2æf÷&vRæÆVæwF‚Ò²’ãÒ²’ÒÒ’°¢6öç7BrÒF†—2æf÷&vU¶•Ó°¢–b‚ræÆæFVB’°¢rçg’³Òs¢GC²rç’³Òrçg’¢GC°¢–b†6†æ6RƒãR’’FE'B‡rç‚²&æB‚ÓBÂB’Ârç’Â&æB‚Ó#Â#’Â&æB‚ÓcÂÓ’Âã2ÂÔBæÖöÇFVâæÖ–BÂ"ÂÂG'VR“°¢–b‡rç’ãÒR¢D”ÄRÒ#b’°¢rç’ÒR¢D”ÄRÒ#c²ræÆæFVBÒG'VS°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂ2“²6g‚‚vÆæBr“°¢'W'7B‡rç‚Ârç’²#Â‚ÂÔBæÖöÇFVâæÖ–BÂƒÂãBÂ3Â"ãRÂG'VR“°¢Ð¢ÒVÇ6R°¢rçBÓÒGC°¢–b‡Æ–W"ç7v–ærbbÖF‚æ'2‡‚Òrç‚’ÂCBbbÖF‚æ'2‡’Ò‡rç’²’’ÂS’°¢'W'7B‡rç‚Ârç’²Â"ÂÔBæÖöÇFVâæÖ–BÂ##ÂãCRÂ#Â2ÂG'VR“°¢6g‚‚v'&V²r“²F†—2æf÷&vRç7Æ–6R†’Â“²6öçF–çVS°¢Ð¢–b‡rçBÃÒ’°¢'W'7B‡rç‚Ârç’²‚Â‚ÂÔBæÖöÇFVâæÆ—BÂ3#ÂãSRÂ#Â2ãRÂG'VR“°¢6Òç6†¶RÒÖF‚æÖ‚†6Òç6†¶RÂb“²6g‚‚v&Æ7Br“°¢–b‚Æ–W"æFVBbbÖF‚æ‡—÷B‡‚Òrç‚Â’Ò‡rç’²‚’’ÂSB’Æ–W"æ‡W'B„Db‚’æVFÖrÂrç‚“°¢F†—2æf÷&vRç7Æ–6R†’Â“°¢Ð¢Ð¢Ð¢Ð¢òòÔTÅDDõtã¢F†R6ÆrF–FR(	Bâ÷&ævRÆ–æR6Æ–Ö&–ærF†RfÆö÷"âÆFf÷&×0¢òò&RF†Rç7vW#²7FæF–ær–âF†R÷W"—2æ÷Bà¢–b‡F†—2ç6Ær’°¢6öç7B2ÒF†—2ç6Æs°¢2çB³ÒGC²2æÆ–fRÓÒGC°¢2æ‚Ò3¢ÖF‚æÖ–âƒÂ2çBòã"’¢6Æ×‡2æÆ–fRòã‚ÂÂ“°¢6öç7BF÷ÒR¢D”ÄRÒ2æƒ°¢–b‡2æ‚â‚bbÆ–W"æFVBbbÆ–W"ç’²Æ–W"æ‚âF÷²B’°¢2çF–6²Ò‡2çF–6²ÇÂ’ÒGC°¢–b‡2çF–6²ÃÒ’²2çF–6²Òãs²Æ–W"æ‡W'BƒÂÆ–W"ç‚ÒC“²Ð¢Ð¢–b†6†æ6Rƒãr’’FE'B‡&æBƒ3Ârç&ööÔFVbçr¢D”ÄRÒ3’ÂF÷Â&æB‚Ó#Â#’Â&æB‚ÓsÂÓ#’ÂãBÂÔBæÖöÇFVâæÖ–BÂ"ãRÂÂG'VR“°¢–b‡2æÆ–fRÃÒ’°¢F†—2ç6ÆrÒçVÆÃ²F†—2çv†—FT†÷BÒ°¢F†—2ç7FuBÒÖF‚æÖ‚‡F†—2ç7FuBÂã“²òò6ööÆ–ærfVçG2÷Vâ(	Bv–æF÷p¢6g‚‚w†6Rr“°¢Ð¢Ð¢òòF†R&—6öã¢—B†öÆG2–÷RæBF¶W2v†B–÷R&R6''––ærÂ&F†W"F†à¢òòv÷VæF–ær–÷Râ'&V²÷WB'’GF6¶–ær—Bà¢–b‡F†—2ç&—6öâ’°¢6öç7BÒF†—2ç&—6öã°¢çB³ÒGC°¢6öç7B–ç6–FRÒÖF‚æ'2‡‚Òç‚’Âc"bbÖF‚æ'2‡’Òç’’Âc#°¢–b†–ç6–FRbbÆ–W"æFVB’°¢Æ–W"çg‚£Òã#S°¢æ†VÆB³ÒGC°¢–b‡æ†VÆBâãr’°¢æ†VÆBÒ°¢–b„rç6fRç67&â’²rç6fRç67&ÒÖF‚æÖ‚ƒÂrç6fRç67&Ò2“²rçFö7B‡B‚v&6…÷F¶Rr’“²Ð¢VÇ6RÆ–W"æ‡W'BƒÂç‚“°¢Ð¢Ð¢–b‡Æ–W"ç7v–ærbb–ç6–FR’æÆ–fRÓÒGB¢3²òò†—GF–ærF†R&'2'&V·2F†VÐ¢æÆ–fRÓÒGC°¢–b‡æÆ–fRÃÒ’²F†—2ç&—6öâÒçVÆÃ²Ð¢Ð¢Ð¢G&t&–Æ—F–W2†2’°¢f÷"†6öç7B"öbF†—2æ&÷&W2’²òò66"–âF†RfÆö÷ ¢6öç7Bw’Òrç&ööÔFVbæ‚¢D”ÄS°¢2ç6fR‚“°¢2æf–ÆÅ7G–ÆRÒÔBæ7&–×6öâæFVW°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†"ç‚Âw’ÒBÂ2ÂRÂÂÂr“²2æf–ÆÂ‚“°¢6öç7BvÆ÷rÒãB²ÖF‚ç6–â†"çB¢B’¢ã3°¢2ævÆö&ÄÇ†ÒvÆ÷s°¢2æf–ÆÅ7G–ÆRÒÔBæ7&–×6öâæÖ–C°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†"ç‚Âw’ÒRÂ‚Â2ÂÂÂr“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢2ç6fR‚“²2çG&ç6ÆFR†"ç‚Âw’Ò‚“²FVæG&–Ç2†2Â2ÂbÂ"çBÂ"ç‚Âã3R¢vÆ÷r“²2ç&W7F÷&R‚“°¢Ð¢–b‡F†—2æ‡–Öâ’²òòF†R&–æröbF†R&VÆÇ0¢6öç7B‚ÒF†—2æ‡–Öã°¢2ç6fR‚“²2ævÆö&ÄÇ†Ò6Æ×ƒÒ‚ç"òScÂÂ“°¢2ç7G&ö¶U7G–ÆRÒÔBæÖöÇFVâæÖ–C²2æÆ–æUv–GF‚Òs°¢2ç6†F÷t6öÆ÷"ÒÔBæÖöÇFVâæÖ–C²2ç6†F÷t&ÇW"ÒC°¢2æ&Vv–åF‚‚“²2æ&2‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â‚ç"ÂÂr“²2ç7G&ö¶R‚“°¢2ç7G&ö¶U7G–ÆRÒÔBæÖöÇFVâæÆ—C²2æÆ–æUv–GF‚Ò#°¢2æ&Vv–åF‚‚“²2æ&2‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â‚ç"ÒRÂÂr“²2ç7G&ö¶R‚“°¢2ç6†F÷t&ÇW"Ò²2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòdõ$tR$TÄÂvVöç3¢7v÷&BÂ†RæB7V"6–Æ†÷VWGFW2ÂVÖ&VFFVBÂvÆ÷v–æp¢–b‡F†—2æf÷&vR’°¢f÷"†6öç7BröbF†—2æf÷&vR’°¢òòF†R7VÖÖöæVBÖöÇFVâ÷&'3¢F†R6†VWBw2WF†÷&VBtÄõr4õ$RÂv†VâF†P¢òòG&vöâFÆ2—2–â(	B6ÖR÷6—F–öç2ÂF–ÖW'2æB†—F6†V6·2V—F†W"v¢–b‡G—VöbG&tgW&æ6T÷&"ÓÓÒvgVæ7F–öârbbG&tgW&æ6T÷&"†2ÂrÂF†—2ææ–Ò’’6öçF–çVS°¢2ç6fR‚“²2çG&ç6ÆFR‡rç‚Ârç’“°¢6öç7B†÷BÒræÆæFVBòãb²ÖF‚ç6–â‡rçB¢‡rçBÂò#"¢’’’¢ã3R¢ãƒ°¢2ç6†F÷t6öÆ÷"ÒÔBæÖöÇFVâæÖ–C²2ç6†F÷t&ÇW"Ò"¢†÷C°¢2æf–ÆÅ7G–ÆRÒr6S†C†3‚s²2ç7G&ö¶U7G–ÆRÒÔBæÖöÇFVâæÖ–C²2æÆ–æUv–GF‚ÒãC°¢–b‡ræ¶–æBÓÓÒ’²òò7v÷&C¢&ÆFRF÷vâÂ7&÷76wV&@¢2æf–ÆÅ&V7B‚Ó"ãBÂÓ#"ÂBã‚ÂCB“²2æf–ÆÅ&V7B‚Ó’ÂÓBÂ‚ÂB“°¢ÒVÇ6R–b‡ræ¶–æBÓÓÒ’²òò†S¢†gB²†V@¢2æf–ÆÅ&V7B‚Ó"ÂÓ#BÂBÂC‚“°¢2æ&Vv–åF‚‚“²2æÖ÷fUFòƒ"ÂÓ#“²2çVG&F–47W'fUFòƒ‚ÂÓBÂ"ÂÓ"“²2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢ÒVÇ6R²òò7V#¢Æöær6†gB²ÆVbö–ç@¢2æf–ÆÅ&V7B‚ÓãbÂÓ#‚Â2ã"ÂS"“°¢2æ&Vv–åF‚‚“²2æÖ÷fUFòƒÂÓ3‚“²2æÆ–æUFòƒRÂÓ#b“²2æÆ–æUFò‚ÓRÂÓ#b“²2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢Ð¢2ævÆö&ÄÇ†Ò†÷C²2ç7G&ö¶U7G–ÆRÒÔBæÖöÇFVâæÆ—C°¢2ç7G&ö¶U&V7B‚Ó"ãBÂÓ#"ÂBã‚ÂCB“°¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢Ð¢òòÔTÅDDõtâ6ÆrF–FP¢–b‡F†—2ç6ÆrbbF†—2ç6Æræ‚â’°¢6öç7Bw’ÒR¢D”ÄRÂF÷Òw’ÒF†—2ç6Æræƒ°¢6öç7Bs"Òrç&ööÔFVbçr¢D”ÄS°¢6öç7B6rÒ2æ7&VFTÆ–æV$w&F–VçBƒÂF÷ÂÂw’“°¢6ræFD6öÆ÷%7F÷ƒÂÔBæÖöÇFVâæÆ—B“²6ræFD6öÆ÷%7F÷ƒã3RÂÔBæÖöÇFVâæÖ–B“²6ræFD6öÆ÷%7F÷ƒÂr3v&3‚r“°¢2æf–ÆÅ7G–ÆRÒ6s²2æf–ÆÅ&V7BƒÂF÷Âs"ÂF†—2ç6Æræ‚²b“°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s²2ævÆö&ÄÇ†ÒãR²ÖF‚ç6–â‡F†—2ææ–Ò¢r’¢ã#°¢2æf–ÆÅ7G–ÆRÒÔBæÖöÇFVâæÆ—C²2æf–ÆÅ&V7BƒÂF÷Ò"Âs"Â2“°¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢òòÔTÅDDõtã¢F†R&VÆÂ'Vææ–ærv†—FRÖ†÷B(	B†VBW&7vÆÆ÷v–ærF†R&öG¢–b‚‡F†—2çv†—FT†÷BÇÂ’âÇÂF†—2ç6Ær’°¢6öç7Bv²ÒF†—2ç6Ærò¢F†—2çv†—FT†÷C°¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢6öç7BvrÒ2æ7&VFU&F–Äw&F–VçB‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â‚ÂF†—2æ7‚‚’ÂF†—2æ7’‚’ÂF†—2çr¢ã“°¢vræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ#CRÃ##BÂr²ƒãR¢v²’²r’r“°¢vræFD6öÆ÷%7F÷ƒãRÂw&v&ƒ#SRÃsÃƒÂr²ƒã2¢v²’²r’r“°¢vræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ#ÃS‚Ã’r“°¢2æf–ÆÅ7G–ÆRÒvs²2æ&Vv–åF‚‚“²2æ&2‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂF†—2çr¢ãÂÂr“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“°¢Ð¢òòtÄ4”U$Rw2FVÆVw&‡2æB7FæF–ær†¦&G2ÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢–b‡F†—2ææ÷f’°¢2ç6fR‚“²2ævÆö&ÄÇ†Ò6Æ×ƒÒF†—2ææ÷fç"ò#cÂÂ“°¢2ç7G&ö¶U7G–ÆRÒr6Scvfs²2æÆ–æUv–GF‚ÒC°¢2ç6†F÷t6öÆ÷"Òr6VC†fbs²2ç6†F÷t&ÇW"ÒC°¢2æ&Vv–åF‚‚“²2æ&2‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂF†—2ææ÷fç"ÂÂr“²2ç7G&ö¶R‚“°¢2ç7G&ö¶U7G–ÆRÒr6C#F&fbs²2æÆ–æUv–GF‚Òãc°¢2æ&Vv–åF‚‚“²2æ&2‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂF†—2ææ÷fç"¢ã’ÂÂr“²2ç7G&ö¶R‚“°¢2ç6†F÷t&ÇW"Ò²2ç&W7F÷&R‚“°¢Ð¢–b‡F†—2æ–6UG&–ÂbbG—VöbG&tvÆ47'—7FÂÓÓÒvgVæ7F–öâr¢f÷"†6öç7BG"öbF†—2æ–6UG&–Â¢G&tvÆ47'—7FÂ†2ÂG"ç‚ÂG"ç’²bÂã3BÂ6Æ×‡G"çB¢ã’ÂÂ’“°¢–b‡F†—2æ÷&'2bbG—VöbG&tvÆ4÷&"ÓÓÒvgVæ7F–öâr¢f÷"†6öç7Bö"öbF†—2æ÷&'2’–b†ö"ç‚ÒçVÆÂ’G&tvÆ4÷&"†2Âö"ç‚Âö"ç’ÂF†—2ææ–Ò²ö"æÂ’Òö"çB“°¢–b‡F†—2ç7BÓÓÒvF6‡v&ârbbF†—2æF6„ærÒçVÆÂ’°¢òòF†R6†&vRÆ–æRÂ6¶WF6†VB–âg&÷7B&Vf÷&R6†RF¶W2—@¢2ç6fR‚“²2ævÆö&ÄÇ†Òã2²ÖF‚ç6–â‡F†—2ææ–Ò¢B’¢ãS°¢2ç7G&ö¶U7G–ÆRÒr6VC†fbs²2æÆ–æUv–GF‚Ò#²2ç6WDÆ–æTF6‚…³"Â•Ò“°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡F†—2æ7‚‚’ÂF†—2æ7’‚’“°¢2æÆ–æUFò‡F†—2æ7‚‚’²ÖF‚æ6÷2‡F†—2æF6„ær’¢CcÂF†—2æ7’‚’²ÖF‚ç6–â‡F†—2æF6„ær’¢Cc“°¢2ç7G&ö¶R‚“²2ç6WDÆ–æTF6‚…µÒ“²2ç&W7F÷&R‚“°¢Ð¢òò%4ôÅUDR¤U$ò‡W6‚W&(	BF†R7vVÆÆ–ærg&÷7B&–ær—2F†Rv†öÆRFVÆÀ¢–b‡F†—2ç7BÓÓÒv¦‡W6‚rbbF†—2æ¥"â’°¢2ç6fR‚“²2ævÆö&ÄÇ†ÒãSS°¢2ç7G&ö¶U7G–ÆRÒr6&fS†fbs²2æÆ–æUv–GF‚Ò3°¢2ç6†F÷t6öÆ÷"Òr6&fS†fbs²2ç6†F÷t&ÇW"ÒC°¢2æ&Vv–åF‚‚“²2æ&2‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂF†—2æ¥"ÂÂr“²2ç7G&ö¶R‚“°¢2æÆ–æUv–GF‚Òã#²2ç7G&ö¶U7G–ÆRÒr6VVf6fbs°¢2æ&Vv–åF‚‚“²2æ&2‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂF†—2æ¥"¢ãƒbÂÂr“²2ç7G&ö¶R‚“°¢2ç6†F÷t&ÇW"Ò²2ç&W7F÷&R‚“°¢Ð¢òòÄ”t…B5Ä•C¢F‡&VR&Vg&7F–öâv†÷7G2(	BöæR†öÆG2F†R6@¢–b‡F†—2ç7BÓÓÒvÇ7fæ—6‚rbbF†—2æÇ57÷G2’°¢6öç7B²Ò6Æ×ƒÒF†—2çBòã“RÂÂ“°¢f÷"†6öç7B3"öbF†—2æÇ57÷G2’°¢2ç6fR‚“²2ævÆö&ÄÇ†Òã#R²²¢ãB²ÖF‚ç6–â‡F†—2ææ–Ò¢²3"ç‚’¢ã°¢2ç7G&ö¶U7G–ÆRÒÂå‚ævÆ÷s²2æÆ–æUv–GF‚Ò#°¢2ç6†F÷t6öÆ÷"ÒÂå‚ævÆ÷s²2ç6†F÷t&ÇW"Ò#°¢òò7&÷V6†VBÖ6B÷WFÆ–æRÂf–çBÂ6†–ÖÖW&–æp¢2æ&Vv–åF‚‚“²2æVÆÆ—6R‡3"ç‚Â3"ç’Ò#"Â3ÂbÂÂÂr“²2ç7G&ö¶R‚“°¢2æ&Vv–åF‚‚“²2æ&2‡3"ç‚²#"Â3"ç’Ò3BÂÂÂr“²2ç7G&ö¶R‚“°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡3"ç‚²‚Â3"ç’ÒC"“²2æÆ–æUFò‡3"ç‚²#"Â3"ç’ÒS“²2æÆ–æUFò‡3"ç‚²#rÂ3"ç’ÒC"“°¢2æÖ÷fUFò‡3"ç‚²#bÂ3"ç’ÒC"“²2æÆ–æUFò‡3"ç‚²3Â3"ç’ÒC’“²2æÆ–æUFò‡3"ç‚²3BÂ3"ç’ÒC“²2ç7G&ö¶R‚“°¢2ç6†F÷t&ÇW"Ò²2ç&W7F÷&R‚“°¢Ð¢2ævÆö&ÄÇ†Ò°¢Ð¢òò$2õdU$ÄôC¢fÆö÷"vÆ÷w26V6öæB†VBöbWfW'’&öÇ@¢–b‡F†—2ç7G&–¶W2’°¢6öç7Bw’ÒR¢D”ÄS°¢f÷"†6öç7B3"öbF†—2ç7G&–¶W2’°¢6öç7Bv&âÒ6Æ×ƒÒ3"çBÂÂ“°¢2ç6fR‚“²2ævÆö&ÄÇ†Òã2²v&â¢ãS°¢2æf–ÆÅ7G–ÆRÒr3†fcffbs²2ç6†F÷t6öÆ÷"Òr3†fcffbs²2ç6†F÷t&ÇW"Ò°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R‡3"ç‚Âw’ÒBÂ3²v&â¢ÂbÂÂÂr“²2æf–ÆÂ‚“°¢2ç6†F÷t&ÇW"Ò²2ç&W7F÷&R‚“°¢Ð¢2ævÆö&ÄÇ†Ò°¢Ð¢òòåTÄÂtdR&–æs¢&Æ6²&öG’Â&VB&–Ò(	BF†Rfö–BÖ÷f–ær÷WGv&@¢–b‡F†—2æçvfR’°¢6öç7BçrÒF†—2æçvfS°¢2ç6fR‚“²2ævÆö&ÄÇ†Ò6Æ×ƒÒçrç"òccÂÂ“°¢2ç7G&ö¶U7G–ÆRÒr3CC"s²2æÆ–æUv–GF‚Ò°¢2æ&Vv–åF‚‚“²2æ&2‡F†—2æ7‚‚’ÂF†—2æ7’‚’Âçrç"ÂÂr“²2ç7G&ö¶R‚“°¢2ç7G&ö¶U7G–ÆRÒr6Sc3“Cbs²2æÆ–æUv–GF‚Ò3°¢2ç6†F÷t6öÆ÷"Òr6Sc3“Cbs²2ç6†F÷t&ÇW"Ò#°¢2æ&Vv–åF‚‚“²2æ&2‡F†—2æ7‚‚’ÂF†—2æ7’‚’Âçrç"²RÂÂr“²2ç7G&ö¶R‚“°¢2ç6†F÷t&ÇW"Ò²2ç&W7F÷&R‚“°¢Ð¢–b‡F†—2ç7BÓÓÒvçv6†&vRr’°¢òòF†R6–ÆVçB6†&vS¢F†R6÷&R7vÆÆ÷vVB'’&Æ6°¢2ç6fR‚“°¢6öç7B²ÒÒ6Æ×‡F†—2æçuBòãÂÂ“°¢6öç7BFrÒ2æ7&VFU&F–Äw&F–VçB‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â"ÂF†—2æ7‚‚’ÂF†—2æ7’‚’Âc“°¢FræFD6öÆ÷%7F÷ƒÂw&v&ƒ2Ã2Ã‚Âr²ƒãsR¢²’²r’r“°¢FræFD6öÆ÷%7F÷ƒÂw&v&ƒ2Ã2Ã‚Ã’r“°¢2æf–ÆÅ7G–ÆRÒFs²2æ&Vv–åF‚‚“²2æ&2‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂcÂÂr“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“°¢Ð¢–b‡F†—2ç7BÓÓÒv×6öærr’°¢òò–çfW'FVB6öær&–æw2(	B&VBæBf–öÆWBv†W&R†W'2'Vâ7–à¢f÷"†ÆWB’Ò²’Â3²’²²’°¢6öç7B#"Ò‚ƒãbÒF†—2æçuB’¢“²’¢3B’RS°¢2ç6fR‚“²2ævÆö&ÄÇ†Ò6Æ×ƒÒ#"òSÂÂ’¢ãs°¢2ç7G&ö¶U7G–ÆRÒ’R"òr6Sc3“Cbr¢r6#C†6fbs²2æÆ–æUv–GF‚Ò"ãS°¢2æ&Vv–åF‚‚“²2æ&2‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â3²#"ÂÂr“²2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“°¢Ð¢2ævÆö&ÄÇ†Ò°¢Ð¢–b‚‡F†—2ç7BÓÓÒvw&'v&ârÇÂF†—2ç7BÓÓÒvw&"r’bbÆ–W"æFVB’°¢òòF†RFVæG&–Ã¢vf–ærf—'W2×W'ÆRv†—&V6†–ærf÷"–÷P¢2ç6fR‚“²2ævÆö&ÄÇ†ÒF†—2ç7BÓÓÒvw&"ròã’¢ãCS°¢2ç7G&ö¶U7G–ÆRÒr6#C†6fbs²2æÆ–æUv–GF‚ÒF†—2ç7BÓÓÒvw&"ròB¢"ãS°¢2ç6†F÷t6öÆ÷"Òr6#C†6fbs²2ç6†F÷t&ÇW"Ò²2æÆ–æT6Òw&÷VæBs°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡F†—2æ7‚‚’ÂF†—2æ7’‚’²#“°¢6öç7BGƒ"ÒÆ–W"ç‚²Æ–W"çrò"ÂG“"ÒÆ–W"ç’²Æ–W"æ‚ò#°¢f÷"†ÆWB²Ò²²ÃÒS²²²²’°¢6öç7BRÒ²òS°¢2æÆ–æUFò†ÆW'‡F†—2æ7‚‚’ÂGƒ"ÂR’²ÖF‚ç6–â‡F†—2ææ–Ò¢²²¢ãr’¢b¢ƒÒR’À¢ÆW'‡F†—2æ7’‚’²#ÂG“"ÂR’²ÖF‚æ6÷2‡F†—2ææ–Ò¢’²²¢ã2’¢"¢ƒÒR’“°¢Ð¢2ç7G&ö¶R‚“²2ç6†F÷t&ÇW"Ò²2ç&W7F÷&R‚“°¢Ð¢–b‡F†—2æÆ6‚’°¢òò–âF†RF&³¢F†R7G&–¶Rö–çBvÆ÷w2f÷"†Æb6V6öæB(	BÔõdP¢2ç6fR‚“²2ævÆö&ÄÇ†ÒãR²ÖF‚ç6–â‡F†—2ææ–Ò¢#"’¢ã3°¢2ç7G&ö¶U7G–ÆRÒr6#C†6fbs²2æÆ–æUv–GF‚Ò#°¢2æ&Vv–åF‚‚“²2æ&2‡F†—2æÆ6‚ç‚ÂF†—2æÆ6‚ç’Â3²F†—2æÆ6‚çB¢CÂÂr“²2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“°¢Ð¢–b‡F†—2ç&—6öâ’²òò&'2öbg&÷¦VâFF¢6öç7BÒF†—2ç&—6öâÂ²Ò6Æ×‡æÆ–fRÂÂ“°¢2ç6fR‚“²2ævÆö&ÄÇ†Òã3R²ÖF‚æÖ–âƒÂçB¢2’¢ãB¢³°¢2ç7G&ö¶U7G–ÆRÒÔBæg&÷7BæÖ–C²2æÆ–æUv–GF‚Ò3°¢2ç7G&ö¶U&V7B‡ç‚Òc"Âç’Òc"Â#BÂ#B“°¢2æÆ–æUv–GF‚Òãc²2ç7G&ö¶U7G–ÆRÒÔBæg&÷7BæÆ—C°¢f÷"†ÆWB’Ò²’Âc²’²²’°¢6öç7B'‚Òç‚Òc"²’¢#ãc°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò†'‚Âç’Òc"“²2æÆ–æUFò†'‚Âç’²c"“²2ç7G&ö¶R‚“°¢Ð¢2ævÆö&ÄÇ†ÒãS²2æf–ÆÅ7G–ÆRÒÔBæg&÷7BæÆ—C°¢f÷"†ÆWB’Ò²’ÂS²’²²’²òòW‡G&7FVBÖVÖ÷&–W2Â&—6–æp¢6öç7B—’Òç’²SbÒ‚‡çB¢C²’¢#b’R#“°¢gG‡B‚~)x‚rÂç‚ÒC²’¢#Â—’ÂÂÔBæg&÷7BæÆ—B“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢Ð¢Ð¢F–R‚’°¢–b‡F†—2æFVBÇÂF†—2æÖVWB’&WGW&ã°¢òòu$dT„õ$âvöW2F÷vâöâ†—2¶æVW2‡†6RöæR’÷"&6·2–çFòF†R&ö6°¢òò‡†6RGvò’(	BæWfW"F†Rf÷&²ÂæWfW"w&V6²†§2öw&fV†÷&âæ§2v„F÷vâ¢–b‡F†—2æ¶–æBÓÓÒv†÷&âr’²v„F÷vâ‡F†—2“²&WGW&ã²Ð¢òòD„R$ÄõrD„BtõTÄBTäB•B6·2F†RVW7F–öâ–ç7FVBâF†—2—2F†RF€¢òòWfW'’&VÂ¶–ÆÂ7GVÆÇ’F¶W2(	BF†R6ÆrÂF†R6‡W&–¶VâÂF†R6öæræBF†P¢òò÷Væ6RÆÂ6ÆÂF–R‚’F†RÖöÖVçB†VÇF‚†—G2¦W&ò(	B6òF†RwV&F–â†0¢òòFò¶æVVÂ†W&RÂ÷"—BæWfW"¶æVVÇ2BÆÂà¢–b‚F†—2æf÷&6T¶–ÆÂbb&÷74f÷&²‡F†—2’’&WGW&ã°¢F†—2æFVBÒG'VS°¢òòÔõD„U"•2äõB´”ÄÄTB†Fö72õ5Dõ%•ô4äôâæÖC¢F†R†–¦6¶VB6–ævW"Âæ÷BF†P¢òòWF†÷"’âF†R&Æ7B&VÆ÷r—2F†R6öÖÖæBÆVf–ær†W"ÂæBF†RvÖR6—26òà¢–b‡F†—2æ¶–æBÓÓÒvÖ÷F†W"rbbG—Vöb&Wf—6VE7F÷'’ÓÓÒvgVæ7F–öârbb&Wf—6VE7F÷'’‚’’rçFö7B‡B‚wW&UöÖ÷F†W"r’“°¢òòwV&F–âv—F‚âWF†÷&VBW&–f–6F–öâf–ÆÒFöW2æ÷BFWFöæFRâF†P¢òòf–ÆÒ6†÷w2F†RÆ7B&Æ÷ræBF†Rf—'W2ÆVf–æs²vR6¶—7G&–v‡B7@¢òòF†Rw&V6²6òæ÷F†–æröb†–Ò—2WfW"6VVâFW7G&÷–VBà¢òòf÷&6T¶–ÆÂ—2F†Rd”ä•4‚'&æ6‚öbF†Rf—'7Bf÷&²âv—F†÷WB—BF†Rf–ÆÒ'Vç0¢òòV—F†W"v’æB&÷F‚ç7vW'2VæBv—F‚F†RÆ–öâÆ—fRÂv†–6‚v÷VÆBÖ¶RF†P¢òò6†ö–6R6÷7GVÖR6†ævRâ6†ö÷6–ærFòVæB—B†2Fò7GVÆÇ’VæB—Bà¢–b‚F†—2æf÷&6T¶–ÆÂbbF†—2ç6¶—W&–g”f–ÆÒbbG—Vöb7F'EW&–g”7WBÓÓÒvgVæ7F–öârbb7F'EW&–g”7WB‡F†—2æ¶–æB’’°¢F†—2æFVF„æ–ÕBÒ²F†—2æFVF„g…BÒ²F†—2æFVF„f–æÆRÒG'VS°¢F†—2çW&–f–VBÒG'VS²F†—2çW&UBÒ²F†—2ç&Wv&EVæBÒG'VS°¢F†—2çg‚Ò²F†—2çg’Ò°¢–b‡F†—2æ¶–æBÓÒvÖ÷F†W"r’6WD×W6–2„rç&ööÔFVbç¦öæR“²VÇ6R7F÷×W6–2‚“°¢ræG&÷67&‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â3“°¢òòF†Rf–ÆÒF‚÷vW2F†R6ÖR6VçFVæ6RF†R6ÆVç6RF‚6—3¢F†P¢òò6×–vâ'Vâg&VVBåTÄÄdärF‡&÷Vv‚†—2f–ÆÒæBæWfW"&VBF†B†P¢òòv26ÆVç6VBÂæ÷B¶–ÆÆVBâ—Bv—G2VæFW"F†Rf–ÆÒ‡Fö7G2†öÆBv†–ÆP¢òòf–ÆÒÆ—2’æB&VG2F†RÖöÖVçBÆ’&W7VÖW2à¢6öç7B´bÒ²vÆ—F6ƒ¢wW&Uö&V7BrÂ'&ööC¢wW&Uö'&ööBrÂFÆ3¢wW&UöFÆ2rÀ¢¦W&ó¢wW&U÷¦W&òrÂ&—6Ó¢wW&U÷&—6ÒrÕ·F†—2æ¶–æEÓ°¢–b‡´b’rçFö7B‡B‡´b’“°¢6g‚‚wv–âr“²6g‚‚wv–å7F–ærr“²òò†W"Ö÷F–b÷fW"F†RG'V×WBÒwV&F–âfVÆÀ¢–b‡G—Vöb6†V6´WfòÓÓÒvgVæ7F–öâr’6†V6´WfòƒÂG'VR“²òò6†Rw&÷w2öâD„•2g&ÖS²F†R6&Bv—G2f÷"F†R7W@¢&WGW&ã°¢Ð¢òòe$TTBuT$D”ât•D‚äòd”ÄÒ•25D”ÄÂe$TTBÂäõBdTÄÄTBâv—F†÷WB¢òòW&–f–6F–öâf–ÆÒF†—2W6VBFòfÆÂF‡&÷Vv‚FòF†RFWFöæF–öâ&VÆ÷r(	@¢òò6V6öæF'’&Æ7G2ÂFV'&—2ÂF†Rw&V6²7F–ær(	B6ò7&VGW&RF†R7F÷'’6—0¢òòv2&W67VVBÆöö¶VBW†7FÇ’Æ–¶RöæRF†Bv2FW7G&÷–VB‡F†RÇ†Âæ@¢òòç’wV&F–âv†÷6Rf–ÆÒ6ææ÷BÆ’’â6ÆVç6–ær†2—G2÷vâ–7GW&P¢òò†§2÷&öw&W72æ§26ÆVç6T&Vv–â“¢v†—FRVÇ6RÂF†R–æfV7F–öâ&—6–æröf`¢òòF†R&öG’ÂF†Rv÷&B÷fW"—BâF†R&Wv&Bv—G2f÷"F†RÆ–v‡BFò6WGFÆRà¢–b‡F†—2çFÖVBbbF†—2æf÷&6T¶–ÆÂbbF†—2æ¶–æBÓÒvÖ÷F†W"rbbG—Vöb6ÆVç6T&Vv–âÓÓÒvgVæ7F–öâp¢bb‡G—Vöb—4†W&òÓÓÒvgVæ7F–öârbb—4†W&ò‚’’’°¢F†—2æFVF„æ–ÕBÒ²F†—2æFVF„g…BÒ²F†—2æFVF„f–æÆRÒG'VS°¢F†—2çW&–f–VBÒG'VS²F†—2çW&UBÒãs²F†—2çg‚Ò²F†—2çg’Ò°¢F†—2ç&Wv&EVæBÒG'VS°¢6WD×W6–2„rç&ööÔFVbç¦öæR“°¢ræG&÷67&‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â3“°¢6öç7B²Ò²vÆ—F6ƒ¢wW&Uö&V7BrÂ'&ööC¢wW&Uö'&ööBrÂFÆ3¢wW&UöFÆ2rÀ¢¦W&ó¢wW&U÷¦W&òrÂ&—6Ó¢wW&U÷&—6ÒrÕ·F†—2æ¶–æEÓ°¢–b‡²’rçFö7B‡B‡²’“°¢6ÆVç6T&Vv–â‡F†—2ç‚ÂF†—2ç’ÂF†—2çrÂF†—2æ‚Âwuög&VVBrÂF†—2“°¢–b‡G—Vöb6†V6´WfòÓÓÒvgVæ7F–öâr’6†V6´WfòƒÂG'VR“°¢&WGW&ã°¢Ð¢F†—2æFVF„æ–ÕBÒÖF‚æÖ‚‡F†—2æFVF„æ–ÕBÇÂÂãb“°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂcÂr6fffffbrÂC#ÂãÂ#ÂRÂG'VR“°¢'W'7B‡F†—2æ7‚‚’ÂF†—2æ7’‚’ÂCÂÅ´rç&ööÔFVbç¦öæUÒævÆ÷rÂ3ÂãBÂÂBÂG'VR“°¢6Òç6†¶RÒc²6g‚‚ww&V6¶&–rr“²6g‚‚wv–âr“²6g‚‚wv–å7F–ærr“°¢–b‡G—Vöb6†V6´WfòÓÓÒvgVæ7F–öâr’6†V6´WfòƒÂG'VR“°¢–b‡G—Vöb&ö%vfRÓÓÒvgVæ7F–öâr’&ö%vfR‡F†—2æ7‚‚’ÂF†—2æ7’‚’Âr6fffffbr“°¢–b‡G—VöbE'VÖ&ÆRÓÓÒvgVæ7F–öâr’E'VÖ&ÆRƒÂãƒRÂƒ“°¢ræ†—E7F÷ÒÖF‚æÖ‚„ræ†—E7F÷Âã#"“²ræfÆ6‚ÒÖF‚æÖ‚„ræfÆ6‚Âãr“°¢ræFE&–ær‡F†—2æ7‚‚’ÂF†—2æ7’‚’“²ræFE&–ær‡F†—2æ7‚‚’ÂF†—2æ7’‚’Âc“°¢ræ–×7BÒ²C¢ã#BÂC¢ã#BÂƒ¢F†—2æ7‚‚’Â“¢F†—2æ7’‚’Ó°¢–b‡F†—2æ¶–æBÓÒvÖ÷F†W"r’6WD×W6–2„rç&ööÔFVbç¦öæR“²VÇ6R7F÷×W6–2‚“°¢ræG&÷67&‡F†—2æ7‚‚’ÂF†—2æ7’‚’Â3“°¢òòF†R&Wv&BF–ÆörW6VBFò÷Vâ„U$R(	Bg&VW¦–ærF†R6öÆÆ6RÖ–BÖfÆÀ¢òò6òF†Rw&V6²7FööB7F–ÆÂâæ÷rF†RFVF‚66VæRÆ—2Fò—G2f–æÆP¢òòf—'7C²F†R7ö–Ç2v—BF†V—"GW&â‡WFFRf—&W2F†VÒÂÆöE&ööÒ—0¢òòF†R6fWG’æWB–bF†R&ööÒ—2ÆVgBV&Ç’’à¢F†—2ç&Wv&EVæBÒG'VS°¢Ð¢G&r†2’°¢òòôäRTät”äRÂEtòtõ$ÄE2(	BæBF†W’×W7BæWfW"&ÆVVB–çFòV6‚÷F†W"à¢òòWfW'’&÷WF–ærFV6—6–öâ&VÆ÷r6†V6·2F†RF†VÖRd•%5C¢F†RöG—76W’w0¢òò&÷76W2&RæWfW"ÆÆ÷vVBFò&÷'&÷rF†RÖ6†–æR'BÂFVB÷"Æ—fRà¢6öç7B†W&õv÷&ÆBÒG—Vöb—4†W&òÓÓÒvgVæ7F–öârbb—4†W&ò‚“°¢òòF†RöÆBFW7Bõ&VBF†R'B¶W—27&÷72&÷76W2Â6òåTÄÄdär6÷VçFVB0¢òò&†2&öG’"v†VæWfW"F†RTtÄRw26†VWB†VæVBFò&RÆöFVBâW"Ö¶–æBÀ¢òòg&öÒöæRF&ÆRÂ—2F†RöæÇ’fW'6–öâöbF†—2F†B6ææ÷B&Rw&öærà¢òòââææB6öç7G'V7Bv—F‚f–ÆÖVBFVF‚„Ô”ä•õ5E$•’Æ—2—B÷WBÂ0¢òòF†RwV&F–ç2Fò(	BF†—2wV&BW6VBFòG&÷WfW'’FVB6öç7G'V7B&Vf÷&P¢òòG&tÖ–æ’w2÷vâfFR6÷VÆB'VâÂv†–6‚—2v‡’F†BfFRæWfW"6†÷vV@¢–b‡F†—2æFVBbb†W&õv÷&ÆBbb$õ55ô%E·F†—2æ¶–æEÒbbF†—2æ¶–æBÓÒvÖ÷F†W"p¢bbF†—2æ¶–æBÓÒvÇ†p¢bb‡G—VöbÔ”ä•õ5E$•ÓÒwVæFVf–æVBrbbÔ”ä•õ5E$•·F†—2æ¶–æEÒbbÔ”ä•õ5E$•·F†—2æ¶–æEÒæFVB’’&WGW&ã°¢6öç7BÒÅ´rç&ööÔFVbç¦öæUÓ°¢òòF†R–çG&òW6VBFòfFRF†R&÷72Wg&öÒæ÷F†–ærÂv†–6‚ÖFR6Vç6Rv†Vâ—@¢òò'&—fVB÷WBöbV×G’—"âæ÷rWfW'’wV&F–â—2Ç&VG’Ç––ærF†W&R–â¢òòF÷&ÖçB÷6RÂ6òfFRg&öÒ¦W&ò&Æ–æ¶VB—B÷WBöbW†—7FVæ6RöâF†RW†7@¢òòg&ÖR—Bvö¶Râ—B7F—26öÆ–C²F†R&—6RæBF†R&ö"6''’F†RÖöÖVçBà¢ÆWBÒ°¢–b‡F†—2çW&–f–VBbb‡F†—2çW&UBÇÂ’Âãr’£Ò6Æ×‚‡F†—2çW&UBÇÂ’òãr²ãRÂãRÂ“°¢òòÖWFÂFöW2æ÷B&V6öÖRG&ç7&VçBv†Vâ7G'V6²âF†R6öæf—&ÖVBÖ6öçF7@¢òòfÆ6‚—2÷væVB'’föTG&s²WF†÷&VB&V6ö–Â&VÖ–ç2F†R&öG’w2&W7öç6Rà¢2ç6fR‚“²2ævÆö&ÄÇ†Ò¢††W&õv÷&ÆBbbF†—2æ‡W'EBâòãb¢“°¢–b‚†W&õv÷&ÆBbbF†—2æ¶–æBÓÓÒvvÆ—F6‚r’&V7D6öçF7Dg‚†2ÂF†—2“°¢òòD„RDTÄTu$‚t4‚ÂæB—BÆ—fW2„U$R&F†W"F†â–âV6‚wV&F–âw2÷và¢òòf–ÆRöâW'÷6RâDTÄÅõ5B†2f—&VBF†Rv&æ–ær4õTäBf÷"WfW'’&÷726–æ6P¢òò—Bv2w&—GFVã²F†RÖF6†–ærf—7VÂv2ÆVgBFòV6‚wV&F–âFð¢òò–×ÆVÖVçBÂæBFW7G2ö'F&–&ÆRæ6§2ÖV7W&VBF†R&W7VÇC¢åTÄÄdärw26ö–À¢òò&V6†W23RÖ&W"v–ç7BR&W7BÂ'WBtÄ4”U$Rw2Ææ6Rv–æB×W6—G2@¢òòãR(	Bæòv&æ–ær6öÆ÷W"BÆÂ(	BæBeU$ä4R4„ô•"w2f—&RÖÆö"v–æB×W—0¢òò7GVÆÇ’D”ÔÔU"–âÖ&W"F†â†W"÷vâ–FÆRÂ&V6W6R6†R—2f—&RG&vöà¢òòæB†W"&W7B7FFRÇ&VG’Æ—fW2–âF†B‡VRà¢òð¢òò6òF†RfÆö÷"—27G'V7GW&Ã¢ç’7FFRv†÷6RäÔR6—2&Æ÷r—26öÖ–æp¢òòvWG2&—6–ærÖ&W"&ÆööÒ&V†–æBF†Ræ–ÖÂæB†÷B&–ærB—G2fVWBÀ¢òòf÷"WfW'’wV&F–âF†BW†—7G2æBWfW'’wV&F–âFFVBÆFW"â—B6—G0¢òò$T„”äBF†R&öG’(	Bv6‚–âg&öçBv÷VÆB&RF†R7FVB&FvR%Eô$”$ÄRæÖ@¢òò*s2ãRf÷&&–G2(	BæB—B—2fÆö÷"Âæ÷B6V–Æ–æs¢wV&F–âF†BÆW'0¢òò—G2÷vâfV–ç2F÷v&BF†RÖ&W"‡6VRåTÄÄdärw2&V7D6ö–Äg‚’&VG2&WGFW"À¢òòæB6†÷VÆBà¢òò„ræ'E&ö&R—2F†RöæRÖV7W&VÖVçB†öö²–âF†—2f–ÆRâFW7G2ö'F&–&ÆRæ6§0¢òò6†V6·2F†BwV&F–âw2dTUB&RöâF†RfÆö÷"ÂæBw&÷VæBÖæ6†÷&V@¢òòVffV7G2(	BF†—2&–ærÂ6†&vR&VBÂ6†ö6·vfR(	B&RÆ—B—†VÇ2&VÆ÷p¢òòF†Rfö÷BÆ–æRF†B&Ræ÷BfVWBâ7W&W76–ærFV6÷&F–öâf÷"F†R&ö&R—0¢òò†öæW7C²FV6†–ærF†R&ö&RFòwVW72v†–6‚'&–v‡B—†VÇ2&RæFö×’—0¢òòæ÷Bâæ÷F†–ær–âF†RvÖRWfW"6WG2—Bâ¢–b‚F†—2æFVBbbræ'E&ö&RbbF†—2ç7BbbDTÄÅõ5BçFW7B‡F†—2ç7B’’°¢òò&×÷fW"F†Rv–æB×Ww2÷vâÆVæwF‚Â6òF†R&ÆööÒw&÷w22F†R&Æ÷p¢òò&ö6†W2–ç7FVBöb7v—F6†–æröà¢6öç7BGW"ÒÖF‚æÖ‚ƒã‚ÂF†—2å÷FVÆÄGW"ÇÂF†—2çBÇÂãB“°¢6öç7B²Ò6Æ×ƒÒ‡F†—2çBÇÂ’òGW"ÂÂ“°¢6öç7BRÒÖF‚ç÷r†²Âãc"“²òò*s2ãb(	BÆ—Bg&öÒF†Rf—'7Bg&ÖP¢òòdÄôõ"ôâD„R$D•U2Âæ÷BW&R×VÇF—ÆRöbF†R&öG’â66ÆVBW&VÇ¢òòöfb6—¦RÂF†R6ÖÆÆW7B6öç7G'V7B‡F†R6'&–W"ÂS'ƒCb’v÷Bs‚‚&ÆööÐ¢òòæBÖV7W&VBBãbRÖ&W"v–ç7BwV&F–âw2ƒ‚(	Bf–çFW"v&æ–æp¢òòf÷"f7FW"VæV×’Âv†–6‚—2&6·v&G2âF†RÆ–W"w2W–RæVVG2F†R6ÖP¢òò6–væÂv†FWfW"F†RF†–ærw26—¦RÂ6ò6ÖÆÂF†–æw2vWB&÷÷'F–öæÆÇ¢òòÖ÷&Röb—Bà¢6öç7B'‚ÒF†—2æ7‚‚’Â'’ÒF†—2ç’²F†—2æ‚¢ãSS°¢6öç7B"ÒÖF‚æÖ‚ƒBÂÖF‚æÖ‚‡F†—2çrÂF†—2æ‚’¢ãR“°¢2ç6fR‚“°¢2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢6öç7BvrÒ2æ7&VFU&F–Äw&F–VçB†'‚Â'’ÂBÂ'‚Â'’Â"“°¢6öç7BÂÒãb²R¢ã3²ÖF‚ç6–â‚‡F†—2ææ–ÒÇÂ’¢B’¢ãB¢S°¢vræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃ#3"Ãc‚Âr²ÖF‚æÖ–âƒãrÂÂ’²r’r“°¢vræFD6öÆ÷%7F÷ƒãC"Âw&v&ƒ#SRÃ“BÃsBÂr²Â¢ãb²r’r“°¢vræFD6öÆ÷%7F÷ƒÂw&v&ƒ#SRÃSÃCÃ’r“°¢2æf–ÆÅ7G–ÆRÒvs°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R†'‚Â'’Â"Â"¢ãƒbÂÂÂr“²2æf–ÆÂ‚“°¢òòæBF†RfÆö÷"VæFW"—BF¶W2F†RÆ–v‡B(	BF†RöæRÆ6Rv–æB×W—0¢òòÇv—2f—6–&ÆRWfVâv†VâF†Ræ–ÖÂ—G6VÆb—2öfbF†RF÷öbF†R67&VVâà¢òòD„RdÄôõ"Âæ÷BâVÆÆ—6RBF†Rfö÷BÆ–æR†÷væW"Â##bÓÓC¢&Æöö·0¢òòf¶RæBæ÷B&ÆVæFVBv—F‚FW'&–â"“¢F†RÖ&W"föÆÆ÷w2F†Rw&÷VæBF†@¢òò—27GVÆÇ’VæFW"F†R&öG’†§2ög†vÂæ§2FVÆÄfÆö÷$Æ–v‡B’à¢–b‡G—VöbFVÆÄfÆö÷$Æ–v‡BÓÓÒvgVæ7F–öâr¢FVÆÄfÆö÷$Æ–v‡B†2Â'‚ÂF†—2ç’²F†—2æ‚Ò"ÂF†—2çr¢ƒãb²R¢ãR’²BÂR“°¢2ç&W7F÷&R‚“°¢ÒòòF†R6–×VÆF–öâ÷vç2F†R&×²÷WFÆ–æRöW‡G&G&w26ææ÷B&W6WB—Bà¢òòu$dT„õ$âG&w2†—2÷vâ&–r†§2öw&fV†÷&âæ§2“¢†—2vV–v‡B—2–â†—2ÆVw2À¢òòæ÷B–âF†R6†&VBÆVâ&VÆ÷p¢–b‚†W&õv÷&ÆBbbF†—2æ¶–æBÓÓÒv†÷&ârbbG—VöbG&tw&fV†÷&âÓÓÒvgVæ7F–öâr’²G&tw&fV†÷&â†2ÂF†—2“²2ç&W7F÷&R‚“²&WGW&ã²Ð¢òò$T5D”ôâ„2Dò„Tâ”âD„R5$TEU$Râ'F–6ÆW2F‡&÷vâ&÷VæB¢òòÖ÷F–öæÆW72&öG’&VB2âVffV7BÆ–VBB—C²F†R&VæB—2v†BGW&ç2¢òòö¶R–çFòâç7vW"â&–FW2–ç6–FRF†R6fR&÷fRÂ6òWfW'’V&Ç’&WGW&à¢òò–âF†—2ÖWF†öBVçv–æG2—B6÷'&V7FÇ’à¢6öç7B÷Ò‡G—VöbWE÷6RÓÓÒvgVæ7F–öâr’òWE÷6R‡F†—2’¢çVÆÃ°¢–b…÷’°¢6öç7B÷‚ÒF†—2æ7‚‚’Â÷’ÒF†—2ç’²F†—2æƒ°¢2çG&ç6ÆFR…÷‚²÷æG‚Â÷’²÷æG’“°¢2ç&÷FFR…÷ç&÷B“²2ç66ÆR…÷ç7‚Â÷ç7’“°¢2çG&ç6ÆFR‚Õ÷‚ÂÕ÷’“°¢Ð¢òòD„RtT”t…B52ÂG&r†Æc¢F†RÖöÖVçGVÒ&öö¶¶VW–ærg&öÒWFFR‚¢òò&V6öÖW2&öG’F†BÆVç2–çFò—G2÷vâ7VVBÂ&ö'2v—F‚—G27G&–FRÀ¢òòæB6ö×&W76W2v†VâfÆÂÆæG2(	B—f÷FVBBF†RdTUB6òÖ727F—0¢òòÆçFVBâ7W&W76VBf÷"F†R'B&ö&R†—BÖV7W&W2fVWBÂæ÷B‡—6–72¢òòæBf÷"F†RFVB‡F†V—"6öÆÆ6W2&R6†÷&Vöw&†VBW"wV&F–â’à¢òòF†R&–Òw27FVæ6–Â†§2öföW&VBæ§2’&—6W2F†R&ö&Rf÷"FV6÷&F–öâöæÇ“ ¢òòF†RÆVâ—2÷6RÂæBF†R&–Ò†2Fòf—BF†R&öG’F†B—2G&vâà¢–b‚F†—2æFVBbb‚ræ'E&ö&RÇÂdôUõ$TBç6–Â¢bb††W&õv÷&ÆBÇÂG—Vöb&÷74÷vç4w&÷VæDÖ÷F–öâÓÒvgVæ7F–öârÇÂ&÷74÷vç4w&÷VæDÖ÷F–öâ‡F†—2’’’°¢6öç7Bw‚ÒF†—2æ7‚‚’Âw’ÒF†—2ç’²F†—2æƒ°¢6öç7B7BÒÖF‚æ'2‡F†—2çg‚“°¢6öç7B&ö"ÒÖF‚æ'2‡F†—2çg’’Â3bb7Bâ#`¢òÖF‚æ'2„ÖF‚ç6–â‡F†—2ææ–Ò¢ƒb²ÖF‚æÖ–âƒbÂ7Bò“’’’’¢ÖF‚æÖ–âƒBÂ7Bò“’¢°¢6öç7B7ÒF†—2å÷7V6…BâòÖF‚ç6–â‚‡F†—2å÷7V6…Bòã#"’¢ÖF‚å’’¢ã’¢°¢–b‡F†—2åöÆVâÇÂ7ÇÂ&ö"’°¢2çG&ç6ÆFR‡w‚Âw’“°¢2ç&÷FFR‡F†—2åöÆVâÇÂ“°¢2ç66ÆRƒ²7¢ãrÂÒ7“°¢2çG&ç6ÆFR‚×w‚Â×w’“°¢2çG&ç6ÆFRƒÂÖ&ö"“°¢Ð¢Ð¢6öç7B7‚ÒF†—2æ7‚‚’Â7’ÒF†—2æ7’‚“°¢–b‡F†—2æFVB’°¢òò6öç7G'V7Bv—F‚f–ÆÖVBFVF‚„Ô”ä•õ5E$•’Æ—2—B–â—G2÷và¢òò&VæFW&W"(	BF†RW"ÖwV&F–â6öÆÆ6W2&VÆ÷ræWfW"¶æWrF†R6öç7G'V7G0¢–b‚†W&õv÷&ÆBbb—4Ö–æ’‡F†—2’bbG—VöbÔ”ä•õ5E$•ÓÒwVæFVf–æVBp¢bbÔ”ä•õ5E$•·F†—2æ¶–æEÒbbÔ”ä•õ5E$•·F†—2æ¶–æEÒæFVB’°¢G&tÖ–æ’†2ÂF†—2Â7‚Â7’“²2ç&W7F÷&R‚“²&WGW&ã°¢Ð¢–b††W&õv÷&ÆB’°¢òòF†RöG—76W’w27&VGW&W2F–R2D„TÕ4TÅdU3¢F†R6ÖR6†VWBF†W¢òòf÷Vv‡Bv—F‚Â¶VVÆ–ær÷fW"æBfF–ær(	BæWfW"F†RÆ–öà¢6öç7B²ÒÒ6Æ×‚‡F†—2æFVF„æ–ÕBÇÂ’òãbÂÂ“°¢6öç7B%5"Ò°¢vÆ—F6ƒ¢²v&V7BrÂbÂSRÂcrÂã#UÒÂ'&ööC¢²vv†÷7BrÂrÂcBÂƒÂãeÒÀ¢FÆ3¢²vFVÖöârÂbÂcÂCBÂãuÒÂ¦W&ó¢²vv†÷7BrÂrÂcBÂƒÂãEÒÀ¢Ó°¢6öç7B2Ò%5%·F†—2æ¶–æEÓ°¢–b‡2bbG—Vöb6†VWE&VG’ÓÓÒvgVæ7F–öârbb6†VWE&VG’‡5³Ò’’°¢6öç7B¶¶W’ÂâÂ7rÂ6‚Â×VÇEÒÒ3°¢2ç6fR‚“°¢2ævÆö&ÄÇ†£ÒÖF‚æÖ‚ƒÂÒ²¢ã’“°¢2çG&ç6ÆFR†7‚ÂF†—2ç’²F†—2æ‚²²¢“°¢2ç66ÆR‡F†—2æf6RÇÂÂ“°¢2ç&÷FFR†²¢ãCR“²2ç66ÆRƒÂÒ²¢ãB“°¢G&u6†VWB†2Â¶W’ÂâÂ7rÂ6‚ÂÂ‡F†—2æ‚¢ãSR¢×VÇB’ò6‚ÂB“°¢2ç&W7F÷&R‚“°¢Ð¢2ç&W7F÷&R‚“²&WGW&ã°¢Ð¢òòV6‚Ö6†–æRF–W22—G6VÆc¢F†R&V7BföÆG2ÂF†RVvÆRG&÷2À¢òòtÄ4”U$R'&V·2–çFòF†R6†VWBw2÷vâ'G2ÂF†R$•4Ò$õtÄU ¢òò6†GFW'2–çFò&–æ&÷r6†&G2v†–ÆR—G2GW&çF&ÆR7–ç2F÷vâÂæ@¢òòÔõD„U"Õbw2f–æÆRÆ—2÷WB(	BÆFW2öæR'’öæRÂÆ–×FVæG&–Ç2À¢òòF†RfÆÆVâ†Æò&–æv–æröâF†RfÆö÷"ÂF†R6÷&RfÆ–6¶W&–ær÷WBÄ5@¢òòD„RÅ„DôU2äõBD”Râ—B––VÆG2(	B6òv†B7FæG2–âF†R&ööÒgFW ¢òòF†Rf–v‡B—2F†Rg&VVBÆFRÂæ÷BFVF‚æ–ÖF–öâÂæB—B7F—0¢òòF†W&Rf÷"F†R&W7BöbF†R'Vâ‡6VRUEô„ôÔU2’à¢–b‡F†—2æ¶–æBÓÓÒvÇ†r’²G&tÇ††2ÂF†—2Â7‚Â7’“²2ç&W7F÷&R‚“²&WGW&ã²Ð¢–b‡F†—2æ¶–æBÓÓÒvÖ÷F†W"r’°¢–b‡G—VöbG&tÖ÷F†W"ÓÓÒvgVæ7F–öâr’G&tÖ÷F†W"†2ÂF†—2“°¢2ç&W7F÷&R‚“²&WGW&ã°¢Ð¢–b‡F†—2æ¶–æBÓÓÒw&—6Òr’°¢–b‡G—VöbG&u&—6ÒÓÓÒvgVæ7F–öâr’G&u&—6Ò†2ÂF†—2“°¢2ç&W7F÷&R‚“²&WGW&ã°¢Ð¢–b‡F†—2æ¶–æBÓÓÒw¦W&òr’°¢–b‡G—VöbG&tvÆ6–W&RÓÓÒvgVæ7F–öâr’G&tvÆ6–W&R†2ÂF†—2“°¢ÒVÇ6R–b‡F†—2æ¶–æBÓÓÒvFÆ2r’°¢òòeU$ä4R4„ô•"F–W22†–×6VÆc¢F†RG&vöâ'&V·2–çFòF†R6†VWBw0¢òò÷vâ'G2(	Bv–æw2f—'7BÂF†VâF†R†VBÂF†VâF†R&öG’G&÷0¢–b‡G—VöbG&tgW&æ6RÓÓÒvgVæ7F–öâr’G&tgW&æ6R†2ÂF†—2“°¢ÒVÇ6R–b‡F†—2æ¶–æBÓÓÒv'&ööBr’°¢–b‡G—VöbG&tVvÆRÓÓÒvgVæ7F–öâr’G&tVvÆR†2ÂF†—2“°¢ÒVÇ6R–b‚‡G—VöbG&t&V7BÓÓÒvgVæ7F–öârbbG&t&V7B†2ÂF†—2’’’°¢òòäUdU"D„RE$”ÄÄU"âF†—2W6VBFòfÆÂ&6²FòF†RÆVv7’&ö6VGW&À¢òòåTÄÂÕ4TT´U"(	BG&–ÆÂÖæ÷6VBvÆ¶W"öfbG&–ÆÆW%ó'ƒbçær(	Bv†VæWfW ¢òòF†RÆ–öâw2'G26†VWBv2æ÷B–âÖVÖ÷'’–WBÂv†–6‚—2W†7FÇ’v†Và¢òòÆ–W"—2Ö÷7BÆ–¶VÇ’Fò&RÆöö¶–æs¢F†Rg&ÖR—BF–W2â—Bv0¢òò&W÷'FVB2'F†RöÆBöæRF†B†2G&–ÆÂ2æ÷6R"ÂæB—Bv2à¢G&t&÷74†öÆB†2ÂF†—2“°¢Ð¢2ç&W7F÷&R‚“²&WGW&ã°¢Ð¢òòFVÆVw&‡0¢F†—2æG&t&–Æ—F–W2†2“°¢òòÄ”t…B5Ä•C¢F†R&öG’—2VÇ6Wv†W&R(	BöæÇ’F†Rv†÷7G2†G&vâ&÷fR’6†÷p¢–b‡F†—2ç7BÓÓÒvÇ7fæ—6‚r’²2ç&W7F÷&R‚“²&WGW&ã²Ð¢òò$2õdU$ÄôC¢7G&ö&–ær6–Æ†÷VWGFR–ç6–FR—G2÷vâÆ–v‡Fæ–æp¢–b‡F†—2ç7BÓÓÒv&77F÷&Òr’°¢2ævÆö&ÄÇ†£Òã3R²ÖF‚ç6–â‡F†—2ææ–Ò¢#b’¢ã#S°¢Ð¢òòÆF–ær6†–âfVVF&6³¢6†÷'FVB6†–VÆB7&6¶ÆW2–âF†R¶W’VÆVÖVçBw0¢òò6öÆ÷"f÷"F†RÆVæwF‚öbF†Rv–æF÷s²6Æ÷6VBÆF–ær–æw2w&W’öâ†—@¢–b„$õ55ôtDU·F†—2æ¶–æEÒ’°¢6öç7B"ÒÖF‚æÖ‚‡F†—2çrÂF†—2æ‚’¢ãsƒ°¢–b‚‡F†—2ç6†–VÆEBÇÂ’â’°¢6öç7B¶W’Ò&ÔFVb„$õ55ôtDU·F†—2æ¶–æEÒ“°¢6öç7B6öÂÒ¶W’òTÄTÕ¶¶W’æVÅÒævÆ÷r¢r6fffffbs°¢2ç6fR‚“²2ævÆö&ÄÇ†Òã3"²ÖF‚ç6–â‡F†—2ææ–Ò¢‚’¢ãC°¢2ç7G&ö¶U7G–ÆRÒ6öÃ²2æÆ–æUv–GF‚Ò"ãS²2ç6WDÆ–æTF6‚…³ÂuÒ“°¢2æ&Vv–åF‚‚“²2æ&2†7‚Â7’Â"²ÖF‚ç6–â‡F†—2ææ–Ò¢’’¢2ÂÂr“²2ç7G&ö¶R‚“°¢2ç6WDÆ–æTF6‚…µÒ“²2ç&W7F÷&R‚“°¢ÒVÇ6R–b‚&÷74vFT÷Vâ‡F†—2’bbF†—2æ‡W'EBâ’°¢2ç6fR‚“²2ævÆö&ÄÇ†ÒãSS°¢2ç7G&ö¶U7G–ÆRÒr63†C&F2s²2æÆ–æUv–GF‚Ò3°¢2æ&Vv–åF‚‚“²2æ&2†7‚Â7’Â"ÂÓãbÂãb“²2ç7G&ö¶R‚“°¢2æ&Vv–åF‚‚“²2æ&2†7‚Â7’Â"ÂÖF‚å’ÒãbÂÖF‚å’²ãb“²2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“°¢Ð¢Ð¢–b‡F†—2æ¶–æBÓÓÒw¦W&òr’f÷"†6öç7BÒöbF†—2æÖ&·2’°¢2æf–ÆÅ7G–ÆRÒw&v&ƒ#3‚Ã#S"Ã#SRÃã3R’s°¢2æf–ÆÅ&V7B†Òç‚ÒÂ"¢D”ÄRÂ#Â2¢D”ÄR“°¢Ð¢–b‡F†—2æ¶–æBÓÓÒvÖ÷F†W"rbbF†—2æ&VÒ’°¢2æf–ÆÅ7G–ÆRÒF†—2æ&VÒçv&âòw&v&ƒ#SRÃ“Ã##Ãã#"’r¢w&v&ƒ#SRÃ#Ã#CÃãb’s°¢2æf–ÆÅ&V7B‡F†—2æ&VÒç‚ÂF†—2æ&VÒç’ÂF†—2æ&VÒçrÂF†—2æ&VÒæ‚“°¢Ð¢òò&÷76W2vWB†Vg’6öçF7B6†F÷rFöò†w&÷VæFVBöæW2¢–b‡F†—2æ¶–æBÓÓÒvvÆ—F6‚rÇÂF†—2æ¶–æBÓÓÒvFÆ2rÇÂF†—2æ¶–æBÓÓÒw&—6Òr¢6öçF7E6†F÷r†2Â7‚ÂF†—2ç’²F†—2æ‚ÂF†—2çr¢ãbÂãCR“°¢òòÒÒÒÒ†W&òv÷&ÆC¢&VÂ†æBÖæ–ÖFVB&÷72&V7G2ÒÒÒÐ¢–b‡G—Vöb—4†W&òÓÓÒvgVæ7F–öârbb—4†W&ò‚’’°¢6öç7B%5"Ò°¢vÆ—F6ƒ¢²v&V7BrÂbÂSRÂcrÂ"Âã#UÒÂòòF†R'&öç¦R&ö ¢'&ööC¢²vv†÷7BrÂrÂcBÂƒÂ‚ÂãeÒÂòòF†R6—&VâÖ÷F†W"(	B7—&—BÂæ÷BF†R—&öâVvÆP¢FÆ3¢²vFVÖöârÂbÂcÂCBÂrÂãuÒÂòòFÆ÷2ÂF†Rf÷&vRÔv–ç@¢¦W&ó¢²vv†÷7BrÂrÂcBÂƒÂ‚ÂãEÒÂòòF†R§VFvRöbF†RFV@¢Ó°¢6öç7B2Ò%5%·F†—2æ¶–æEÓ°¢–b‡2bb6†VWE&VG’‡5³Ò’’°¢6öç7B¶¶W’ÂâÂ7rÂ6‚Âg2Â×VÇEÒÒ3°¢òòFÆ÷2'Vç2eU$ä4R4„ô•"w2Ö6†–æRÂ6ò†—2G&÷w2ÆæF–ærÖ&²æ@¢òò†—2&6¶G&gBw26öæR&RF†R6ÖRvÖWÆ’†W&R†§2ögW&æ6RÖf–v‡Bæ§2¢6öç7Bf4g‚ÒF†—2æ¶–æBÓÓÒvFÆ2rbbG—Vöbf4G&tg‚ÓÓÒvgVæ7F–öâs°¢–b†f4g‚’f4G&tg‚†2ÂF†—2ÂwVæFW"r“°¢2ç6fR‚“°¢–b‡F†—2æ‡W'EBâ’2ævÆö&ÄÇ†ÒãcS°¢2çG&ç6ÆFR†7‚ÂF†—2ç’²F†—2æ‚“°¢2ç66ÆR‡F†—2æf6RÇÂÂ“°¢–b‡F†—2ç7BÓÓÒw6Æ×v&ârÇÂF†—2ç7BÓÓÒv6†&vRr’²òòÖVæ6RFVÆÀ¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s²2ævÆö&ÄÇ†Òã#ƒ°¢6öç7BvrÒ2æ7&VFU&F–Äw&F–VçBƒÂ×F†—2æ‚ò"ÂBÂÂ×F†—2æ‚ò"ÂF†—2çr“°¢vræFD6öÆ÷%7F÷ƒÂr6fcf62r“²vræFD6öÆ÷%7F÷ƒÂw&v&ƒÃÃÃ’r“°¢2æf–ÆÅ7G–ÆRÒvs²2æ&Vv–åF‚‚“²2æ&2ƒÂ×F†—2æ‚ò"ÂF†—2çrÂÂr“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“°¢Ð¢G&u6†VWB†2Â¶W’ÂâÂ7rÂ6‚ÂÖF‚æfÆö÷"‡F†—2ææ–Ò¢g2’RâÂ‡F†—2æ‚¢ãSR¢×VÇB’ò6‚ÂB“°¢2ç&W7F÷&R‚“°¢–b†f4g‚’f4G&tg‚†2ÂF†—2Âv÷fW"r“°¢2ç&W7F÷&R‚“°¢&WGW&ã°¢Ð¢Ð¢òòF†RÖ6†–æRw2WF†÷&VB'B—24Ät%•DRÖöæÇ’(	B†&BF†VÖRvFP¢–b‚†W&õv÷&ÆBbbF†—2æ¶–æBÓÓÒw¦W&òrbbG—VöbG&tvÆ6–W&RÓÓÒvgVæ7F–öârbbG&tvÆ6–W&R†2ÂF†—2’’²2ç&W7F÷&R‚“²&WGW&ã²Ð¢–b‚†W&õv÷&ÆBbbF†—2æ¶–æBÓÓÒvFÆ2rbbG—VöbG&tgW&æ6RÓÓÒvgVæ7F–öârbbG&tgW&æ6R†2ÂF†—2’’²2ç&W7F÷&R‚“²&WGW&ã²Ð¢–b‚†W&õv÷&ÆBbbF†—2æ¶–æBÓÓÒvvÆ—F6‚rbbG—VöbG&t&V7BÓÓÒvgVæ7F–öârbbG&t&V7B†2ÂF†—2’’²2ç&W7F÷&R‚“²&WGW&ã²Ð¢–b‚†W&õv÷&ÆBbbF†—2æ¶–æBÓÓÒv'&ööBrbbG—VöbG&tVvÆRÓÓÒvgVæ7F–öârbbG&tVvÆR†2ÂF†—2’’²2ç&W7F÷&R‚“²&WGW&ã²Ð¢–b‚†W&õv÷&ÆBbbF†—2æ¶–æBÓÓÒw&—6ÒrbbG—VöbG&u&—6ÒÓÓÒvgVæ7F–öârbbG&u&—6Ò†2ÂF†—2’’²2ç&W7F÷&R‚“²&WGW&ã²Ð¢–b‚†W&õv÷&ÆBbbF†—2æ¶–æBÓÓÒvÖ÷F†W"rbbG—VöbG&tÖ÷F†W"ÓÓÒvgVæ7F–öârbbG&tÖ÷F†W"†2ÂF†—2’’²2ç&W7F÷&R‚“²&WGW&ã²Ð¢òòäUdU"D„Ru$ôär$ôE’âWfW'’wV&F–âw2WF†÷&VB'B7G&V×2–âöâFVÖæBÀ¢òòæBVçF–Â—BÆæG2—G2G&rgVæ7F–öâ&WGW&ç2fÇ6R(	Bv†–6‚W6VBFòG&÷ ¢òòF‡&÷Vv‚FòF†RÆVv7’&ö6VGW&Â&÷72VæFW&æVF‚âF†B—2W†7FÇ’v‡¢òòvÆ¶–ær–çFòåTÄÄdärw2&ööÒ6÷VÆB6†÷r–÷RF†RE$”ÄÄU"f÷"ÖöÖVçC¢æ÷@¢òòÆVgF÷fW"76WBÂfÆÆ&6²f—&–ærv†–ÆRF†R&VÂ6†VWBv27F–ÆÂ–à¢òòfÆ–v‡BâwV&F–âF†B„2&öG’æ÷rv—G2&V†–æB—G2÷vâ6–Æ†÷VWGFP¢òò&F†W"F†â&÷'&÷v–ær6öÖV&öG’VÇ6Rw2à¢òòF†RW–Rw26öç7G'V7G2&RG&vâÂæ÷B6ö×÷6—FVB(	B6VRÔ”ä•0¢–b†—4Ö–æ’‡F†—2’’²G&tÖ–æ’†2ÂF†—2Â7‚Â7’“²2ç&W7F÷&R‚“²&WGW&ã²Ð¢–b‚†W&õv÷&ÆBbbF†—2æ¶–æBÓÓÒvÇ†r’²G&tÇ††2ÂF†—2Â7‚Â7’“²2ç&W7F÷&R‚“²&WGW&ã²Ð¢–b‚†W&õv÷&ÆBbb$õ55ô%E·F†—2æ¶–æEÒ’°¢–b‡G—VöbÖVF–fWF6‚ÓÓÒvgVæ7F–öâr’ÖVF–fWF6‚„$õ55ô%E·F†—2æ¶–æEÒ“°¢G&t&÷74†öÆB†2ÂF†—2“²2ç&W7F÷&R‚“²&WGW&ã°¢Ð¢–b†G&tFÆ2†2ÂF†—2æ¶–æBÂF†—2æf6Uf—2Â7‚ÂF†—2ç’²F†—2æ‚ÂF†—2æ‚Â°¢fÆ6ƒ¢F†—2æ‡W'EBâò¢À¢w&÷VæFVC¢F†—2æ¶–æBÓÒv'&ööBrbbF†—2æ¶–æBÓÒw¦W&òrbbF†—2æ¶–æBÓÒw&—6ÒrÀ¢C¢F†—2ææ–ÒÂgƒ¢F†—2çg‚Âg“¢F†—2çg’Â—#¢6Æ×‚×F†—2çg’òSÂÂ’À¢ÖöFS¢²'&ööC¢w7v’rÂFÆ3¢v'&VF†RrÂ¦W&ó¢v†÷fW"rÂ&—6Ó¢vv–Ö&ÂrÂÖ÷F†W#¢wVÇ6RrÕ·F†—2æ¶–æEÒÇÂv'&VF†RrÀ¢–u7–ã¢F†—2æ¶–æBÓÓÒw&—6Òròã’¢À¢–u66ã¢F†—2æ¶–æBÓÓÒw¦W&òrò²3¢–t6öÄb‡F†—2æf6Uf—2’Â#¢ãBÂ¢ãrÒ¢çVÆÂÀ¢Ò’’²2ç&W7F÷&R‚“²&WGW&ã²Ð¢òòÒÒÒÒD„RÄTt5’$ô4TEU$Â$ôD”U2TäB„U$RÂdõ"4Ät%•DRÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÐ¢òòWfW'—F†–ær&VÆ÷rF†—2Æ–æR—2F†R&RÖWF†÷&VBÖ'B67C¢F†RG&–ÆÂÖæ÷6V@¢òòåTÄÂÕ4TT´U"ÂF†R&ö6VGW&ÂVvÆRÂæBF†R&W7BâWfW'’öæRöbF†VÒ†2¢òò&VæFW&VB&öG’æ÷rÂæBF†RôäÅ’v’Fò&V6‚F†W6R—26†VWBF†B†0¢òòæ÷B'&—fVB–WB(	B6òv†BF†RÆ–W"vWG2—2&÷72vV&–ærF†Rw&öæp¢òò7V6–W2f÷"g&ÖR÷"GvòâF†B—2v÷'6RF†â6†÷v–æræ÷F†–ærÂ&V6W6P¢òò&æ÷F†–ær"—2F&²6–Æ†÷VWGFRv—F‚GvòW–W2–â—BæB&VG22ÖVæ6RÀ¢òòv†–ÆRG&–ÆÂÖæ÷6VBvÆ¶W"&VG22F†Rw&öærvÖRà¢òð¢òòF†RöG—76W’¶VW2F†VÓ¢—G27&VGW&W2&R†æBÖæ–ÖFVB6†VWG2æBF†W6P¢òò&RF†V—"†öæW7BfÆÆ&6²Âæ÷BF–ffW&VçB67Bà¢–b‚†W&õv÷&ÆB’²G&t&÷74†öÆB†2ÂF†—2“²2ç&W7F÷&R‚“²&WGW&ã²Ð¢2çG&ç6ÆFR†7‚Â7’“°¢òòF†R&öF–W2&RWF†÷&VBæ÷6RÔÄTeBÂ'WBf6RÒ³ÖVç2'F†RÆ–W"—2Fò×¢òò&–v‡B"Â6ò66Æ–ær'’f6RF—&V7FÇ’ÖFRWfW'’&÷726†&vR&6·v&G2â66ÆP¢òò'’F†RæVvFVBV6VBf6–ær–ç7FVBÂæBæWfW"ÆWB—B†—BW†7FÇ’¦W&òà¢6öç7BgbÒÒ‡F†—2æf6Uf—2ÇÂ‡F†—2æf6RÇÂ’“°¢6öç7Bf6U66ÆRÒÖF‚æ'2†gb’Âã’ò†gbÂòÓã’¢ã’’¢gc°¢7v—F6‚‡F†—2æ¶–æB’°¢66RvvÆ—F6‚s¢°¢òòåTÄÂÕ4TT´U"E$”ÄÄU"âWF†÷&VB–âF‡&VR÷6W2öfbF†R6†VWB(	B4”DRÂ2ó@¢òòæBe$ôåB(	B6òGW&âvÆ·2F‡&÷Vv‚F†Rg&öçBf–Wr–ç7FVBöb7V6†–æp¢òòF†R&öf–ÆRFò6Æ—fW"à¢6öç7BGBÒF†—2ææ–ÒÂ"ÒF†—2ç†6RÓÓÒ#°¢6öç7B7C‚Ò6Vç6÷%7FFR‡F†—2“°¢6öç7BBÒGW&å÷6R‡F†—2æf6Uf—2“°¢6öç7BG&–ÆÂÒGB¢‡F†—2ç7BÓÓÒv6†&vRrÇÂF†—2ç7BÓÓÒv&÷&RròCb¢"“° ¢6öç7BÆVu—"Ò†Ç‚Â‚ÂFWF‚’Óâ²òòFWF‚ÒæV"ÂÃÒf"6–FP¢6öç7B7rÒÖF‚ç6–â‡GB¢‡F†—2ç7BÓÓÒv6†&vRròB¢R’²‚“°¢6öç7B·‚ÒÇ‚²7r¢R¢FWF‚Â·’ÒB²ÖF‚æ'2‡7r’¢#°¢2ç6fR‚“²2ævÆö&ÄÇ†ÒFWF‚Âòã‚¢°¢2ç7G&ö¶U7G–ÆRÒFWF‚ÂòÔBç7FVVÂæFVW¢ÔBç7FVVÂæF&³°¢2æÆ–æUv–GF‚ÒR¢FWFƒ²2æÆ–æT6Òw&÷VæBs°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò†·‚Â·’“²2æÆ–æUFò†·‚²7r¢2Â#B“²2ç7G&ö¶R‚“°¢6öç7BærÒÖF‚æFã"†·’²BÂ·‚ÒÇ‚¢ãr’Â6VrÒÖF‚æ‡—÷B†·‚ÒÇ‚¢ãrÂ·’²B“°¢2ç6fR‚“²2çG&ç6ÆFR†Ç‚¢ãrÂÓB“²2ç&÷FFR†ær“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBç7FVVÂÂÂÓ2ãBÂ6Vr¢ãbÂ2ãBÂFWF‚“°¢'"†2ÂÂÓ2ãB¢FWF‚Â6Vr¢ãc"Âbã‚¢FWF‚Â"ãB“²2æf–ÆÂ‚“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2Â6Vr¢ãRÂÓ"Â6VrÂ"Âã’¢FWF‚“°¢2æf–ÆÅ&V7B‡6Vr¢ãSRÂÓã’¢FWF‚Â6Vr¢ãCRÂ2ã‚¢FWF‚“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÂÓBÂbÂBÂFWF‚“°¢'"†2ÂÓÂÓBã"¢FWF‚ÂbÂ‚ãB¢FWF‚Â"“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“°¢2æf–ÆÅ7G–ÆRÒÔBæ6W&Ö–2æF&³²2æf–ÆÅ&V7B†·‚²7r¢2ÒB¢FWF‚Â#2Â‚¢FWF‚Â2ãR“°¢ö66Â†2Â·‚²7r¢2Â#bÂr¢FWF‚Â2ÂãR¢FWF‚“°¢2ç&W7F÷&R‚“°¢Ó°¢6öç7B7F6·2Ò‡6W’Óâ°¢f÷"†6öç7BW‚öb·6WÂ6W²uÒ’°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBç7FVVÂÂW‚Ò"ÂÓ3BÂW‚²"ÂÓ#b“°¢2æf–ÆÅ&V7B†W‚ÂÓ3BÂBÂ‚“°¢–b‡"’²2æf–ÆÅ7G–ÆRÒÔBæ7&–×6öâæÖ–C²2æf–ÆÅ&V7B†W‚ÂÓ3bÂBÂ"ãR“²Ð¢Ð¢Ó° ¢–b…Bç÷6RÓÓÒvg&öçBr’°¢òòÒÒÒÒe$ôåC¢F†RG'VÒ†VBÖöâÂF†R&÷&RÖ†VBö–çF–ær7G&–v‡BB–÷RÀ¢òòf÷W"ÆVw27Æ–VBv—F‚F†Rf"—"F–ÖÖVB&V†–æBF†RæV"—"à¢2ç6fR‚“²2ç66ÆRƒ²BçB¢ãÂ“°¢ÆVu—"‚Ó’ÂãÂãc‚“²ÆVu—"ƒ’Â2ãBÂãc‚“°¢ÆVu—"‚Ó2ÂÂ“²ÆVu—"ƒ2Â"ã"Â“°¢7F6·2‚ÓB“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2ÂÓBÂÓ#"ÂbÂ"“°¢'"†2ÂÓ’ÂÓ#Â3‚Â3Â’“²2æf–ÆÂ‚“²òòæ'&÷vW"6VVâ†VBÖöà¢ö66Â†2ÂÂÂ’ÂbÂãCR“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓ’ÂÓbÂ’Â"“°¢2æf–ÆÅ&V7B‚Ó’ÂÓbÂ3‚ÂR“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2ÂÓÂÓ3Â"ÂÓBÂã“R“°¢'"†2ÂÓ"ÂÓ3Â#BÂBÂR“²2æf–ÆÂ‚“°¢ö66Â†2ÂÂÓbÂ2ÂBÂãB“°¢vV"†2Âµ²ÓRÂÓ"ÂEÒÂ³Â"Â5ÕÒ“°¢2ç6fR‚“²2çG&ç6ÆFRƒÂB“²òò&÷&RÖ†VBÂVæBÖöà¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓÂÓÂÂ“°¢2æ&Vv–åF‚‚“²2æ&2ƒÂÂÂÂr“²2æf–ÆÂ‚“°¢2ç7G&ö¶U7G–ÆRÒw&v&ƒ#‚Ã#ÃÃãb’s²2æÆ–æUv–GF‚ÒãC°¢f÷"†ÆWB’Ò²’Âc²’²²’°¢6öç7BÒG&–ÆÂ¢ãb²’òb¢ÖF‚å’¢#°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò„ÖF‚æ6÷2†’¢2ãRÂÖF‚ç6–â†’¢2ãR“°¢2æÆ–æUFò„ÖF‚æ6÷2†’¢ãRÂÖF‚ç6–â†’¢ãR“²2ç7G&ö¶R‚“°¢Ð¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBç7FVVÂÂÓBÂÓBÂBÂB“°¢2æ&Vv–åF‚‚“²2æ&2ƒÂÂBÂÂr“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“°¢ö66Â†2ÂÂBÂÂBÂãR“°¢G&u6Vç6÷"†2ÂÂÓ"ÂRÂ7C‚ÂGB“°¢–b‡"ÇÂF†—2æ÷fW&G&—fUBâ’²2ç6fR‚“²2çG&ç6ÆFRƒÂÓ#‚“²FVæG&–Ç2†2ÂRÂ#bÂGBÂã"ÂãsR“²2ç&W7F÷&R‚“²Ð¢2ç&W7F÷&R‚“°¢ÒVÇ6R°¢òòÒÒÒÒ4”DRæB2óBâF†R2óBæ'&÷w2F†R&öf–ÆRæB'&–æw2F†Rf"ÆVw0¢òò–çFòf–WrÂv†–6‚—2v†B6VÆÇ2F†RævÆR&F†W"F†â7V6‚à¢6öç7Bæ'&÷rÒBç÷6RÓÓÒwròãCb²BçB¢ãSB¢°¢2ç66ÆR‚ÕBæF—"¢æ'&÷rÂ“°¢–b…Bç÷6RÓÓÒwr’²ÆVu—"‚Ó#ÂãÂãcb“²ÆVu—"ƒ‚Â2ãBÂãcb“²Ð¢ÆVu—"‚Ó#BÂÂ“²ÆVu—"‚ÓÂ"ã"Â“²ÆVu—"ƒ"ÂãÂ“²ÆVu—"ƒ#RÂ2ãBÂ“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2ÂÓ#ÂÓ#"Â#BÂ"“°¢'"†2ÂÓ#bÂÓ#ÂS"Â3Â’“²2æf–ÆÂ‚“°¢ö66Â†2ÂÂÂ#bÂrÂãCR“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓ#bÂÓbÂ#bÂ"“°¢2æf–ÆÅ&V7B‚Ó#bÂÓbÂS"ÂR“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2ÂÓBÂÓ3ÂbÂÓBÂã“R“°¢'"†2ÂÓbÂÓ3Â3"ÂBÂR“²2æf–ÆÂ‚“°¢ö66Â†2ÂÂÓbÂ‚ÂBÂãB“°¢vV"†2Âµ²Ó#"ÂÓBÂEÒÂ³rÂ"Â5ÒÂ²ÓbÂÓ#bÂ5ÕÒ“°¢2ç7G&ö¶U7G–ÆRÒw&v&ƒCÃCBÃSÃãCR’s²2æÆ–æUv–GF‚Ò°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó#ÂÓ"“²2æÆ–æUFòƒ#ÂÓ"“²2ç7G&ö¶R‚“°¢7F6·2ƒ‚“°¢2ç6fR‚“²2çG&ç6ÆFR‚Ó3Â"“²2ç&÷FFR‡F†—2ç7BÓÓÒv&÷&RròãR¢Óãb“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓbÂÓ’ÂbÂ’“°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó#"Â“²2æÆ–æUFòƒBÂÓ’“²2æÆ–æUFòƒBÂ’“²2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢2ç7G&ö¶U7G–ÆRÒw&v&ƒ#‚Ã#ÃÃãb’s²2æÆ–æUv–GF‚Òã#°¢f÷"†ÆWB’Ò²’ÂC²’²²’°¢6öç7BòÒ‚†G&–ÆÂ²’¢RãR’R#"’Ò##°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò†òÂÓrãR“²2æÆ–æUFò†ò²‚ÂrãR“²2ç7G&ö¶R‚“°¢Ð¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBç7FVVÂÂ"ÂÓÂÂ“°¢'"†2Â"ÂÓÂ’Â#Â2“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“°¢ö66Â†2ÂÓ#BÂBÂ’ÂRÂãR“°¢G&u6Vç6÷"†2ÂÓ2ÂÓ"ÂRÂ7C‚ÂGB“°¢–b‡"ÇÂF†—2æ÷fW&G&—fUBâ’²2ç6fR‚“²2çG&ç6ÆFRƒBÂÓ#b“²FVæG&–Ç2†2ÂRÂ#bÂGBÂã"ÂãsR“²2ç&W7F÷&R‚“²Ð¢Ð¢'&V³°¢Ð¢66Rv'&ööBs¢°¢òò%$ôôDÔõD„U"äôDR(	B6ööÆçB&VwVÆF÷"f÷"F†RæWGv÷&²w2'FW&–W2F†@¢òò7F'FVB–æ7V&F–ær–ç7FVBâ6W&Ö–2&W77W&RfW76VÂÂ'&öç¦RÖæ–föÆG2À¢òò7–â6ööÆçB&V†–æBvÆ72ÂæB†ÆbÖf÷&ÖVBÖ–Ö–72–âöG2&VæVF‚—Bà¢6öç7BGBÒF†—2ææ–ÒÂ"ÒF†—2ç†6RÓÓÒ#°¢6öç7B7C‚Ò6Vç6÷%7FFR‡F†—2“°¢6öç7BVÇ2Ò²ÖF‚ç6–â‡GB¢2’¢ãC°¢òòF†RfVVB6&ÆR—B7F–ÆÂ†æw2g&öÐ¢2ç7G&ö¶U7G–ÆRÒÔBç7FVVÂæF&³²2æÆ–æUv–GF‚Òc°¢2æ&Vv–åF‚‚“²2æÖ÷fUFòƒÂ×F†—2æ‚ò"“²2æÆ–æUFòƒÂÖ7’“²2ç7G&ö¶R‚“°¢2ç7G&ö¶U7G–ÆRÒÔBæ'&öç¦RæF&³²2æÆ–æUv–GF‚Ò"ã#°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó"Â×F†—2æ‚ò"“²2æÆ–æUFò‚Ó"ÂÖ7’“²2ç7G&ö¶R‚“°¢2ç6fR‚“°¢2ç&÷FFR‡F†—2æf6Uf—2¢Óãr“²òò7v–æw2öâ—G26&ÆRF÷v&B–÷P¢2ç66ÆR‡VÇ2ÂVÇ2“°¢òò'&öç¦RÖæ–föÆB6öÆÆ"BF†RF÷Âv—F‚÷WFÆWB7GV'0¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓ#"ÂÓ3Â#"ÂÓ#“°¢'"†2ÂÓ#"ÂÓ3ÂCBÂÂ2“²2æf–ÆÂ‚“°¢f÷"†6öç7B×‚öb²Ó#bÂÓ‚Â‚Â#eÒ’°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂ×‚Ò2ÂÓ#‚Â×‚²2ÂÓ#“°¢2æf–ÆÅ&V7B†×‚Ò2ÂÓ#‚ÂbÂ’“°¢Ð¢ö66Â†2ÂÂÓ’Â#"ÂBÂãR“°¢òòF†R6W&Ö–2fW76VÀ¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2ÂÓ#ÂÓ#"Â#"Âb“°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò‚Ó#BÂÓ#“²2æÆ–æUFòƒ#BÂÓ#“°¢2æ&W¦–W$7W'fUFòƒ3ÂÂ#BÂbÂBÂ#“°¢2æÆ–æUFò‚ÓBÂ#“°¢2æ&W¦–W$7W'fUFò‚Ó#BÂbÂÓ3ÂÂÓ#BÂÓ#“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢vV"†2Âµ²Ó#ÂÓ‚ÂUÒÂ³rÂBÂEÒÂ²ÓbÂBÂ5ÕÒ“°¢òò6ööÆçBv–æF÷s¢7–âfÇV–Bv—F‚Ö÷f–ærÆWfVÂÆ–æP¢2ç6fR‚“°¢2æf–ÆÅ7G–ÆRÒÔBæ7–âæFVW°¢'"†2ÂÓ2ÂÓ2Â#bÂ#BÂB“²2æf–ÆÂ‚“°¢6öç7BÇfÂÒÓb²ÖF‚ç6–â‡GB¢ãb’¢"ãC°¢6öç7B6s"Ò2æ7&VFTÆ–æV$w&F–VçBƒÂÇfÂÂÂ“°¢6s"æFD6öÆ÷%7F÷ƒÂÔBæ7–âæÆ—B“²6s"æFD6öÆ÷%7F÷ƒÂÔBæ7–âæF&²“°¢2ævÆö&ÄÇ†ÒãƒS²2ç6†F÷t6öÆ÷"ÒÔBæ7–âæÖ–C²2ç6†F÷t&ÇW"Ò°¢2æf–ÆÅ7G–ÆRÒ6s#²'"†2ÂÓ"ÂÇfÂÂ#BÂÒÇfÂÂ2“²2æf–ÆÂ‚“°¢2ç6†F÷t&ÇW"Ò²2ævÆö&ÄÇ†Ò°¢2ç7G&ö¶U7G–ÆRÒw&v&ƒ#CÃ#SÃ#SRÃãR’s²2æÆ–æUv–GF‚Ò°¢'"†2ÂÓ2ÂÓ2Â#bÂ#BÂB“²2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“°¢ö66Â†2ÂÂÓ2Â2Â2ÂãB“°¢òò–æ7V&F–öâöG2†æv–ærVæFW&æVF‚ÂV6‚v—F‚†ÆbÖf÷&ÖVBÖ–Ö–0¢f÷"†6öç7B¶'‚Â'Òöbµ²ÓbÂÒÂ³ÂãuÒÂ³bÂ2ãEÕÒ’°¢6öç7B7rÒÖF‚ç6–â‡GB¢ã2²'’¢ã°¢2ç6fR‚“²2çG&ç6ÆFR†'‚Â’“²2ç&÷FFR‡7r“°¢2ç7G&ö¶U7G–ÆRÒÔBç7FVVÂæÖ–C²2æÆ–æUv–GF‚ÒãC°¢2æ&Vv–åF‚‚“²2æÖ÷fUFòƒÂ“²2æÆ–æUFòƒÂR“²2ç7G&ö¶R‚“°¢2ç6fR‚“²2ævÆö&ÄÇ†Òãc°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæg&÷7BÂÓrÂRÂrÂ#"“°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂ2ÂrÂ’ÂÂÂr“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“°¢òòF†RF†–ær–ç6–FRÂæ÷Bf–æ—6†V@¢2æf–ÆÅ7G–ÆRÒ"òÔBæ7&–×6öâæF&²¢ÔBç7FVVÂæF&³°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂBÂ2ãBÂBãBÂ7rÂÂr“²2æf–ÆÂ‚“°¢2æf–ÆÅ7G–ÆRÒ"òÔBæ7&–×6öâæÖ–B¢ÔBæ7–âæF&³°¢2æ&Vv–åF‚‚“²2æ&2‚ÓãÂ"ãbÂãÂÂr“²2æf–ÆÂ‚“°¢2ç7G&ö¶U7G–ÆRÒw&v&ƒ#CÃ#SÃ#SRÃãCR’s²2æÆ–æUv–GF‚Òãƒ°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂ2ÂrÂ’ÂÂÂr“²2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“°¢Ð¢òò6ööÆçBG&—–ærg&öÒF†R†VÐ¢f÷"†ÆWB’Ò²’Â3²’²²’°¢6öç7BG’Ò‚‡GB¢3B²’¢r’R#b“°¢2ævÆö&ÄÇ†ÒÒG’ò#c°¢2æf–ÆÅ7G–ÆRÒÔBæ7–âæÖ–C°¢2æ&Vv–åF‚‚“²2æVÆÆ—6R‚Ó’²’¢’Â#²G’Âã"Â"ã"ÂÂÂr“²2æf–ÆÂ‚“°¢Ð¢2ævÆö&ÄÇ†Ò°¢G&u6Vç6÷"†2ÂÂÓ#BÂRÂ7C‚ÂGB“°¢2ç&W7F÷&R‚“°¢–b‡"ÇÂF†—2æ÷fW&G&—fUBâ’°¢2ç6fR‚“²2çG&ç6ÆFR‚Ó#Âb“²FVæG&–Ç2†2ÂBÂ#"ÂGBÂã’Âãr“²2ç&W7F÷&R‚“°¢2ç6fR‚“²2çG&ç6ÆFRƒ#Âb“²FVæG&–Ç2†2ÂBÂ#"ÂGBÂ2ãBÂãr“²2ç&W7F÷&R‚“°¢Ð¢'&V³°¢Ð¢66RvFÆ2s¢°¢òòeU$ä4R4„ô•"(	B6ÖVÇF–ær'&’F†B6–æw2â'&öç¦R&–ærg&ÖRö`¢òò6W&Ö–2&VÆÇ2&÷VæBâ÷VâgW&æ6R6÷&RÂÖöÇFVâÖWFÂ–âF†R6Æ÷Bà¢6öç7BGBÒF†—2ææ–Ó°¢6öç7B6–æv–ærÒF†—2ç7BÓÓÒv‡–ÖârÇÂF†—2æ‡–Öã°¢6öç7B†VBÒ6–æv–ærò¢‡F†—2ç†6RÓÓÒ"òãr¢ãCR“°¢6öç7B7C‚Ò6Vç6÷%7FFR‡F†—2“°¢2ç&÷FFR‡F†—2æf6Uf—2¢ÓãR“²òòÆVç2F÷v&B—G2F&vW@¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBç7FVVÂÂÓ#bÂ#BÂ#bÂ3r“°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó#bÂ3r“²2æÆ–æUFò‚Ó‚Â#"“²2æÆ–æUFòƒ‚Â#"“²2æÆ–æUFòƒ#bÂ3r“²2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢ö66Â†2ÂÂ3bÂ#bÂRÂãSR“°¢f÷"†6öç7Bƒ"öb²Ó2Â5Ò’°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂƒ"Ò2ÂBÂƒ"²2Â#B“°¢2æf–ÆÅ&V7B‡ƒ"Ò2ÂBÂbÂ#“°¢Ð¢òòF†R6öÇVÖâ—26W&Ö–2æB7F—26W&Ö–3¢†VBÆ—fW2–âF†R6Æ÷BöæÇ’Â6ð¢òòF†R–V6R¶VW2Æ–v‡BÖÖ–BÖF&²7G'V7GW&R–ç7FVBöbvÆ÷v–ærÆÂ÷fW ¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2ÂÓÂÓ3Â’Â#"Âã‚“°¢'"†2ÂÓÂÓ3Â#ÂSBÂB“²2æf–ÆÂ‚“°¢2æf–ÆÅ7G–ÆRÒw&v&ƒ#‚Ã#bÃ#"ÃãR’s²òò6†F÷vVB&–v‡BfÆæ°¢'"†2Â2ÂÓ#’ÂrÂS"Â2“²2æf–ÆÂ‚“°¢2ç6fR‚“°¢2æf–ÆÅ7G–ÆRÒr3SBs²2æf–ÆÅ&V7B‚ÓRãRÂÓ#bÂÂCb“²òò6öÆB6f—G¢6öç7BÖrÒ2æ7&VFTÆ–æV$w&F–VçBƒÂÓ#bÂÂ#“°¢ÖræFD6öÆ÷%7F÷ƒÂÔBæÖöÇFVâæÖ–B“²ÖræFD6öÆ÷%7F÷ƒãCRÂÔBæÖöÇFVâæÆ—B“°¢ÖræFD6öÆ÷%7F÷ƒÂÔBæÖöÇFVâæF&²“°¢2ævÆö&ÄÇ†ÒãR²†VB¢ã3R²ÖF‚ç6–â‡GB¢b’¢ãS°¢2ç6†F÷t6öÆ÷"ÒÔBæÖöÇFVâæÖ–C²2ç6†F÷t&ÇW"Ò‚²†VB¢C°¢2æf–ÆÅ7G–ÆRÒÖs²2æf–ÆÅ&V7B‚Ó2ãBÂÓ#BÂbã‚ÂC"“°¢2ç&W7F÷&R‚“²2ç6†F÷t&ÇW"Ò°¢2ç7G&ö¶U7G–ÆRÒw&v&ƒ#ÃBÃ‚Ããr’s²2æÆ–æUv–GF‚ÒãC²òò6Æ÷BÆ— ¢2ç7G&ö¶U&V7B‚ÓRãRÂÓ#bÂÂCb“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓÂÓBÂÂ2“²òòv—7B&æ@¢2æf–ÆÅ&V7B‚ÓÂÓBÂ#"ÂR“°¢ö66Â†2ÂÂÂÂ2ÂãCR“°¢vV"†2Âµ²Ó’ÂÓbÂEÒÂ³bÂÂ5ÕÒ“°¢2ç7G&ö¶U7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓ3ÂÓ3BÂ3ÂÓ#b“²2æÆ–æUv–GF‚ÒC°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÓ3Â#’ÂrÂÂÂr“²2ç7G&ö¶R‚“°¢2ç7G&ö¶U7G–ÆRÒÔBæ'&öç¦RæÆ—C²2æÆ–æUv–GF‚Òã#°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÓ3Â#’ÂrÂÂÖF‚å’ÂÖF‚å’¢"“²2ç7G&ö¶R‚“°¢f÷"†6öç7B¶'‚Â'Òöbµ²Ó#BÂÒÂ²Ó2ÂãÒÂ³Â"ã%ÒÂ³2Â2ã5ÒÂ³#BÂBãEÕÒ’°¢6öç7B7v–ærÒÖF‚ç6–â‡GB¢‡6–æv–æròr¢ãr’²'’¢‡6–æv–æròã3¢ã“°¢2ç6fR‚“²2çG&ç6ÆFR†'‚ÂÓ3²ÖF‚æ'2†'‚’¢ã"“²2ç&÷FFR‡7v–ær“°¢2ç7G&ö¶U7G–ÆRÒÔBæ'&öç¦RæF&³²2æÆ–æUv–GF‚ÒãC°¢2æ&Vv–åF‚‚“²2æÖ÷fUFòƒÂ“²2æÆ–æUFòƒÂ’“²2ç7G&ö¶R‚“°¢f÷"†ÆWB²Ò#²²Â“²²³Ò2’²2æf–ÆÅ7G–ÆRÒÔBæ'&öç¦RæÖ–C²2æf–ÆÅ&V7B‚Óã"Â²Â"ãBÂãb“²Ð¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2ÂÓbÂ‚ÂbÂ#BÂã“R“°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò‚Ó2ãRÂ’“²2æÆ–æUFòƒ2ãRÂ’“°¢2æ&W¦–W$7W'fUFòƒbãRÂRÂrÂ#ÂrÂ#"“°¢2æÆ–æUFò‚ÓrÂ#"“²2æ&W¦–W$7W'fUFò‚ÓrÂ#ÂÓbãRÂRÂÓ2ãRÂ’“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓrÂ#ÂrÂ#R“°¢2æf–ÆÅ&V7B‚Órã"Â#ãRÂBãBÂ"ãb“°¢2ç6fR‚“²2ævÆö&ÄÇ†ÒãB²†VB¢ãSS°¢2ç6†F÷t6öÆ÷"ÒÔBæÖöÇFVâæÖ–C²2ç6†F÷t&ÇW"Ò‚²†VB¢#°¢2æf–ÆÅ7G–ÆRÒÔBæÖöÇFVâæÖ–C°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂ#"ãRÂRãBÂã‚ÂÂÂr“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“²2ç6†F÷t&ÇW"Ò°¢ö66Â†2ÂÂ’ãRÂRÂ"ÂãR“°¢2ç&W7F÷&R‚“°¢Ð¢G&u6Vç6÷"†2ÂÂÓ3bÂRãRÂ7C‚ÂGB“°¢–b‡F†—2ç†6RÓÓÒ"ÇÂF†—2æ÷fW&G&—fUBâ’°¢2ç6fR‚“²2çG&ç6ÆFR‚Ó#"ÂÓ#"“²FVæG&–Ç2†2ÂBÂ#BÂGBÂãBÂãr“²2ç&W7F÷&R‚“°¢2ç6fR‚“²2çG&ç6ÆFRƒ#"ÂÓ#"“²FVæG&–Ç2†2ÂBÂ#BÂGBÂ"ã’Âãr“²2ç&W7F÷&R‚“°¢Ð¢'&V³°¢Ð¢66Rw¦W&òs¢°¢òòD„R$4„•d•5B(	BFFÆ–'&&–ã¢FW&–ær6Æö²öb6W&Ö–2æVÇ0¢òòæBg&÷7FVBvÆ72Â'&öç¦R†ÆòÂæB¦ö–çFVB&×2†öÆF–ær&öö²×&6·2à¢6öç7BGBÒF†—2ææ–ÒÂfÂÒÖF‚ç6–â‡GB¢"ã"’¢3°¢6öç7B7C‚Ò6Vç6÷%7FFR‡F†—2“°¢6öç7BÆöö²Ò×F†—2æf6Uf—3²òò—BFöW2æ÷BvÆ³²—BGW&ç2FòÆöö°¢2çG&ç6ÆFRƒÂfÂ“°¢òòF†R6Æö²—2'V–ÇBg&öÒfW'F–6ÂföÆBæVÇ2ÂV6‚v—F‚—G2÷vâÆ–v‡@¢òòfÇVRÂ6òF†Rf÷&ÒGW&ç2–ç7FVBöb&VF–ær2öæRfÆB6öæP¢6öç7BföÆG2Ò²Ó2ÂÓ"ÂÓÂÂÂ"Â5Ó°¢f÷"†6öç7BböbföÆG2’°¢6öç7BF÷Òb¢"ãbÂ&÷DÂÒb¢bãbÒ2ãBÂ&÷E"Òb¢bãb²2ãC°¢òòæVÇ2f6–ærF†RÆ–v‡B&R'&–v‡FW#²F†Rf"öæW2fÆÂv¢6öç7B²Ò6Æ×ƒã“RÒÖF‚æ'2†b²ã’’¢ã2ÂãC"Âã“R“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2ÂF÷ÒBÂÓBÂ&÷E"Â#’Â²“°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò‡F÷ÒãbÂÓB“°¢2æ&W¦–W$7W'fUFò‡F÷Ò"ãBÂBÂ&÷DÂ²ã"Â‚Â&÷DÂÂ#’“°¢2æÆ–æUFò†&÷E"Â#’“°¢2æ&W¦–W$7W'fUFò†&÷E"Òã"Â‚ÂF÷²"ãBÂBÂF÷²ãbÂÓB“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢òòF†R7&V6RÆ–æRF÷vâV6‚föÆ@¢2ç7G&ö¶U7G–ÆRÒw&v&ƒ3‚Ã3bÃ3"ÃãCR’s²2æÆ–æUv–GF‚Òãƒ°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡F÷²ãbÂÓ2“²2æÆ–æUFò†&÷E"Â#‚“²2ç7G&ö¶R‚“°¢Ð¢òò†VÓ¢†Vf–W"'&öç¦R×vV–v‡FVBVFvRÂæBF†R6†F÷r—BF‡&÷w0¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓ#"Â#RÂ#"Â3ÂãƒR“°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚Ó#2Â#R“²2æÆ–æUFòƒ#2Â#R“²2æÆ–æUFòƒ#Â3“²2æÆ–æUFò‚Ó#Â3“²2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢ö66Â†2ÂÂ#’Â#"ÂBÂãSR“°¢2ç6fR‚“²2ævÆö&ÄÇ†ÒãC#°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæg&÷7BÂÓRÂÓÂRÂ#b“°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚ÓBÂÓ"“²2æÆ–æUFòƒBÂÓ"“²2æÆ–æUFòƒ‚Â#r“²2æÆ–æUFò‚Ó‚Â#r“²2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢2ç&W7F÷&R‚“°¢2ç7G&ö¶U7G–ÆRÒw&v&ƒcÃsBÃƒBÃãB’s²2æÆ–æUv–GF‚Òã“°¢f÷"†6öç7B7‚öb²Ó"Â%Ò’²2æ&Vv–åF‚‚“²2æÖ÷fUFò‡7‚¢ãRÂÓ‚“²2æÆ–æUFò‡7‚¢ãRÂ#b“²2ç7G&ö¶R‚“²Ð¢f÷"†6öç7B·6–FRÂ’Â…Òöbµ²ÓÂÓ‚ÂÒÂ³ÂÓ‚ÂãeÒÂ²ÓÂ"Â2ãÒÂ³Â"ÂBãuÕÒ’°¢6öç7B7rÒÖF‚ç6–â‡GB¢ãR²‚’¢"ãC°¢6öç7B&V6‚Ò#B²‡6–FRÓÓÒÖF‚ç6–vâ†Æöö²’òR¢Ó2“²òò&V6†W2F÷v&B–÷P¢6öç7BW‚Ò6–FR¢&V6‚ÂW’Ò’²7s°¢2ç7G&ö¶U7G–ÆRÒÔBç7FVVÂæF&³²2æÆ–æUv–GF‚Ò2ã#²2æÆ–æT6Òw&÷VæBs°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‡6–FR¢rÂ’Ò"“²2æÆ–æUFò‡6–FR¢bÂ’²"²7r¢ãR“²2æÆ–æUFò†W‚ÂW’“²2ç7G&ö¶R‚“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂ6–FR¢RÂ’Ò"Â6–FR¢rÂ’²B“°¢2æ&Vv–åF‚‚“²2æ&2‡6–FR¢bÂ’²"²7r¢ãRÂ"ã"ÂÂr“²2æf–ÆÂ‚“°¢2ç6fR‚“²2çG&ç6ÆFR†W‚ÂW’“²2ç&÷FFR‡6–FR¢ã"²7r¢ãB“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2ÂÓBÂÓbÂBÂbÂã’“°¢'"†2ÂÓBãRÂÓbÂ’Â"ÂãR“²2æf–ÆÂ‚“°¢2æf–ÆÅ7G–ÆRÒÔBæ'&öç¦RæÖ–C²2æf–ÆÅ&V7B‚ÓBãRÂÓÂ’Âãb“°¢–b‡7C‚ÓÓÒvÆö6¶VBrÇÂ7C‚ÓÓÒv÷fW&G&—fRr’°¢2æf–ÆÅ7G–ÆRÒÔBæ7&–×6öâæÖ–C²2ç6†F÷t6öÆ÷"ÒÔBæ7&–×6öâæÖ–C²2ç6†F÷t&ÇW"Òs°¢2æf–ÆÅ&V7B‚Ó2ÂÓBãRÂbÂãb“²2ç6†F÷t&ÇW"Ò°¢Ð¢2ç&W7F÷&R‚“°¢ö66Â†2ÂW‚ÂW’²rÂRÂ"ÂãB“°¢Ð¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBç7FVVÂÂÓBÂÓ#ÂBÂÓ"“°¢2æf–ÆÅ&V7B‚Ó2ãRÂÓ#ÂrÂ’“°¢2ç6fR‚“²2çG&ç6ÆFR†Æöö²¢"ã"Â“²2ç&÷FFR†Æöö²¢ã’“²òò†VBGW&à¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2ÂÓ‚ÂÓ3Â‚ÂÓ‚“°¢'"†2ÂÓ‚ÂÓ3ÂbÂBÂR“²2æf–ÆÂ‚“°¢ö66Â†2ÂÂÓrÂ‚Â2ÂãCR“°¢G&u6Vç6÷"†2ÂÂÓ#2ÂBãbÂ7C‚ÂGB“°¢2ç&W7F÷&R‚“°¢2ç6fR‚“²2çG&ç6ÆFR†Æöö²¢ãbÂÓ3B“°¢2ç7G&ö¶U7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓbÂÓBÂbÂB“²2æÆ–æUv–GF‚Ò"ãc°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÂbÂBãRÂÖF‚ç6–â‡GB¢ãR’¢ãbÂÂr“²2ç7G&ö¶R‚“°¢2ç7G&ö¶U7G–ÆRÒÔBæ'&öç¦RæÆ—C²2æÆ–æUv–GF‚Ò°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÓã‚ÂbÂBãRÂÖF‚ç6–â‡GB¢ãR’¢ãbÂÖF‚å’ÂÖF‚å’¢"“²2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“°¢–b‡F†—2ç†6RÓÓÒ"ÇÂF†—2æ÷fW&G&—fUBâ’°¢2ç6fR‚“²2çG&ç6ÆFRƒÂÓ3B“²FVæG&–Ç2†2ÂbÂ#"ÂGBÂãrÂã‚“²2ç&W7F÷&R‚“°¢Ð¢'&V³°¢Ð¢66Rw&—6Òs¢°¢òò$•4Ò$õtÄU"(	BF†RöæRÖ6†–æRF†RæWGv÷&²æWfW"–æFW†VBÂ6òF†P¢òò'&öF67BæWfW"f÷VæB—Bâ—B—2äõB–æfV7FVC¢—B—2F†RöæÇ’&÷72v†÷6P¢òò6Vç6÷"7F—27–âÂæBF†RöæÇ’öæRv—F‚æòvV"æBæòFVæG&–Ç2â—B—0¢òò7F–ÆÂW†7FÇ’v†B—Bv2ÂæBF†B—2F†Rö–çBöb—Bà¢6öç7BGBÒF†—2ææ–Ó°¢6öç7B†÷BÒF†—2ç7BÓÓÒv&VÒrÇÂF†—2ç7BÓÓÒv–Òs°¢òòWF†÷&VB†VBÖöã¢—BGW&ç2'’7v–æv–ær—G2v–Ö&ÂÂæWfW"'’7V6†–æp¢2ç&÷FFR‡F†—2æf6Uf—2¢ã‚“°¢òò'&öç¦Rv–Ö&Â&–ærÂGW&æ–æröâGvò†W0¢2ç7G&ö¶U7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓ#"ÂÓBÂ#"ÂB“²2æÆ–æUv–GF‚Ò"ãƒ°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÂ#Â2ÂÖF‚ç6–â‡GB¢ãb’¢ã"ÂÂr“²2ç7G&ö¶R‚“°¢2ç7G&ö¶U7G–ÆRÒÔBæ'&öç¦RæÆ—C²2æÆ–æUv–GF‚Ò°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÓÂ#Â2ÂÖF‚ç6–â‡GB¢ãb’¢ã"ÂÖF‚å’ÂÖF‚å’¢"“²2ç7G&ö¶R‚“°¢2ç7G&ö¶U7G–ÆRÒ&×†2ÂÔBæ'&öç¦RÂÓbÂÓbÂbÂb“²2æÆ–æUv–GF‚Ò"ã#°¢2æ&Vv–åF‚‚“²2æVÆÆ—6RƒÂÂ‚ÂRÂÖF‚æ6÷2‡GB¢ãCR’¢ã#RÂÂr“²2ç7G&ö¶R‚“°¢òò6W&Ö–2†÷W6–ær6†VÆÇ2Â6ÆVâ(	Bæò6†—–æröâF†—2öæP¢f÷"†6öç7B7‚öb²ÓÂÒ’°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2Â7‚¢"ÒbÂÓÂ7‚¢"²bÂ’Âã“R“°¢2æ&Vv–åF‚‚“°¢2æÖ÷fUFò‡7‚¢’ÂÓ“²2æÆ–æUFò‡7‚¢#"ÂÓb“°¢2æÆ–æUFò‡7‚¢#"Âb“²2æÆ–æUFò‡7‚¢’Â“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢ö66Â†2Â7‚¢ÂÂBÂ‚ÂãB“°¢Ð¢òòF†Rf6WFVB7'—7FÂ6÷&P¢6öç7Bf6WG2ÒrÂ7–âÒGB¢ãƒ°¢2ç6fR‚“°¢f÷"†ÆWB’Ò²’Âf6WG3²’²²’°¢6öç7BÒ7–â²’òf6WG2¢ÖF‚å’¢"ÂÒ7–â²†’²’òf6WG2¢ÖF‚å’¢#°¢6öç7B²ÒãCR²ãSR¢ÖF‚æ'2„ÖF‚æ6÷2†²ãb’“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæg&÷7BÂÂÓÂÖF‚æ6÷2†’¢ÂÂ²“°¢2æ&Vv–åF‚‚“²2æÖ÷fUFòƒÂ“°¢2æÆ–æUFò„ÖF‚æ6÷2†’¢ÂÖF‚ç6–â†’¢’“°¢2æÆ–æUFò„ÖF‚æ6÷2†’¢ÂÖF‚ç6–â†’¢’“°¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢Ð¢2ç&W7F÷&R‚“°¢òò&Vg&7FVBÆ–v‡B(	BfâöbF†–â7–â&—2Â'&–v‡FW"v†–ÆR—B–×0¢2ç6fR‚“²2ævÆö&Ä6ö×÷6—FT÷W&F–öâÒvÆ–v‡FW"s°¢2ævÆö&ÄÇ†Ò†÷BòãSR¢ã#C°¢f÷"†ÆWB’Ò²’ÂS²’²²’°¢6öç7BÒ7–â¢ãb²’òR¢ÖF‚å’¢#°¢2ç7G&ö¶U7G–ÆRÒÔBæ7–âæÆ—C²2æÆ–æUv–GF‚Òã°¢2æ&Vv–åF‚‚“²2æÖ÷fUFòƒÂ“°¢2æÆ–æUFò„ÖF‚æ6÷2†’¢††÷Bò3B¢#’ÂÖF‚ç6–â†’¢††÷Bò#b¢R’“°¢2ç7G&ö¶R‚“°¢Ð¢2ç&W7F÷&R‚“²2ævÆö&ÄÇ†Ò°¢òòF†RW–Râ7–âÂÇv—2(	B—Bv2æWfW"6÷'&V7FVBà¢G&u6Vç6÷"†2ÂÂÂBãbÂ†÷BòvÆö6¶VBr¢vÆW'BrÂGBÂG'VR“²òò6ÆVã¢æWfW"6FÆöwVVBÂæWfW"6÷'&V7FV@¢'&V³°¢Ð¢66RvÖ÷F†W"s¢°¢òòÔõD„U"Õb(	Bæ÷BÖ6†–æRâF†R'&öF67Bw&Wr&öG’÷WBöb6&ÆRæ@¢òò6ööÆçB&V6W6R—Bf–æÆÇ’vçFVB†æG2â6ò—B—2F†R–çfW'6RöbWfW'¢òò÷F†W"&÷73¢7&–×6öâF—77VRf—'7BÂv—F‚g&vÖVçG2öbF†R6W&Ö–2Ö6†–æW0¢òò—B'6÷&&VB7F–ÆÂ7GV6²–â—BÂ†ÆbÖF–vW7FVBà¢6öç7BGBÒF†—2ææ–ÒÂ"ÒF†—2ç†6RÓÓÒ#°¢òò÷WFW"6&ÆRÖfÆW6ƒ¢÷fW&Æ–ærÆö&W2F†B'&VF†P¢f÷"†ÆWB&–ærÒ3²&–ærãÒ²&–ærÒÒ’°¢6öç7B'#2Ò#"²&–ær¢"²ÖF‚ç6–â‡GB¢ã"²&–ær’¢"ãS°¢6öç7Bs"Ò2æ7&VFU&F–Äw&F–VçB‚×'#2¢ã#RÂ×'#2¢ã2Â"ÂÂÂ'#2“°¢s"æFD6öÆ÷%7F÷ƒÂÔBæ7&–×6öâæF&²“°¢s"æFD6öÆ÷%7F÷ƒãbÂw&v&ƒcÃÃ‚Ãã“"’r“°¢s"æFD6öÆ÷%7F÷ƒÂw&v&ƒ#‚ÃbÃ"ÃãR’r“°¢2æf–ÆÅ7G–ÆRÒs#°¢2æ&Vv–åF‚‚“°¢f÷"†ÆWB’Ò²’ÃÒc²’²²’°¢6öç7BÒ’òb¢ÖF‚å’¢#°¢6öç7Bs"Ò'#2¢ƒ²ÖF‚ç6–â†¢2²GB¢ã‚²&–ær’¢ã“°¢’ò2æÆ–æUFò„ÖF‚æ6÷2†’¢s"ÂÖF‚ç6–â†’¢s"¢ã“"¢¢2æÖ÷fUFò„ÖF‚æ6÷2†’¢s"ÂÖF‚ç6–â†’¢s"¢ã“"“°¢Ð¢2æ6Æ÷6UF‚‚“²2æf–ÆÂ‚“°¢Ð¢òò'6÷&&VBÖ6†–æR'G3¢6W&Ö–2ÆFW2æB'&öç¦Rf—GF–ærÂVÖ&VFFV@¢f÷"†6öç7B¶‚Â’Â"ÂrÂ…Òöbµ²Ó3BÂÓbÂÓãRÂRÂ•ÒÂ³3ÂÂã3RÂ2Â…ÒÂ²ÓBÂ3BÂã’Â"ÂuÒÂ³#BÂÓ3ÂÓã"ÂÂeÕÒ’°¢2ç6fR‚“²2çG&ç6ÆFR†‚Â’“²2ç&÷FFR†"“°¢2æf–ÆÅ7G–ÆRÒ&×†2ÂÔBæ6W&Ö–2ÂÖrÂÖ‚ÂrÂ‚Âãc"“°¢'"†2ÂÖrÂÖ‚Âr¢"Â‚¢"Â"“²2æf–ÆÂ‚“°¢2æf–ÆÅ7G–ÆRÒw&v&ƒcÃÃ‚ÃãSR’s²òòF—77VR7&VW–ær÷fW ¢'"†2ÂÖrÂ‚¢ã"Âr¢"Â‚¢ã’Â"“²2æf–ÆÂ‚“°¢2ç7G&ö¶U7G–ÆRÒÔBæ'&öç¦RæF&³²2æÆ–æUv–GF‚Òã#°¢2æ&Vv–åF‚‚“²2æÖ÷fUFò‚ÖrÂÖ‚¢ã2“²2æÆ–æUFò†rÂÖ‚¢ã2“²2ç7G&ö¶R‚“°¢2ç&W7F÷&R‚“°¢ö66Â†2Â‚Â’²‚ÂrÂ‚¢ãbÂãCR“°¢Ð¢òò6&ÆR'VæFÆW2&V6†–ær÷WGv&B(	BF†R†æG2—BvçFV@¢f÷"†ÆWB’Ò²’Âƒ²’²²’°¢6öç7BÒ’ò‚¢ÖF‚å’¢"²GB¢ã##°¢2ç6fR‚“²2ç&÷FFR†“²2çG&ç6ÆFRƒ3Â“°¢FVæG&–Ç2†2Â2Â3²‡"òB¢’ÂGBÂ’¢ã2Âã‚“°¢2ç&W7F÷&R‚“°¢Ð¢òòF†R6÷&S¢7&–×6öâ†V'Bv—F‚&–æröbW‡G&7FVB6Vç6÷'2&÷VæB—@¢6öç7B&VBÒ²ÖF‚ç6–â‡GB¢B’¢‡"òãB¢ãr“°¢2ç6fR‚“²2ç66ÆR†&VBÂ&VB“°¢6öç7B6s2Ò2æ7&VFU&F–Äw&F–VçB‚ÓBÂÓRÂÂÂÂ#"“°¢6s2æFD6öÆ÷%7F÷ƒÂr6ffccr“²6s2æFD6öÆ÷%7F÷ƒã3RÂÔBæ7&–×6öâæÖ–B“°¢6s2æFD6öÆ÷%7F÷ƒÂÔBæ7&–×6öâæFVW“°¢2ç6†F÷t6öÆ÷"ÒÔBæ7&–×6öâæÖ–C²2ç6†F÷t&ÇW"Ò#c°¢2æf–ÆÅ7G–ÆRÒ6s3°¢2æ&Vv–åF‚‚“²2æ&2ƒÂÂ#ÂÂr“²2æf–ÆÂ‚“°¢2ç6†F÷t&ÇW"Ò°¢2ç&W7F÷&R‚“°¢òòF†RW–W2öbF†RÖ6†–æW2—B†2F¶VâÂ÷&&—F–ær—@¢f÷"†ÆWB’Ò²’Âc²’²²’°¢6öç7BÒGB¢ãr²’òb¢ÖF‚å’¢#°¢6öç7B÷‚ÒÖF‚æ6÷2†’¢3Â÷’ÒÖF‚ç6–â†’¢#C°¢G&u6Vç6÷"†2Â÷‚Â÷’Â"ã‚ÂvÆö6¶VBrÂGB²’“°¢Ð¢G&u6Vç6÷"†2ÂÂÂrÂv÷fW&G&—fRrÂGB“°¢'&V³°¢Ð¢Ð¢2ç&W7F÷&R‚“°¢Ð§Ð 