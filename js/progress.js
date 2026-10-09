// ===========================================================================
// CHAPTER ONE'S ROAD (owner, 2026-10-09: "PUT THE MARBLE QUEST BEFORE THE
// LION" and "MAKE CAVES WORTH ENTERING").
//
// The required order is the owner's, verbatim:
//   find raw marble -> return to Ratchet -> forge the Purifier -> cleanse the
//   first Sage -> learn about CHIME -> silence CHIME -> face and cleanse NULLFANG
//
// Everything in this file serves that line, and nothing in it is a message
// pretending to be a wall. The order is held by GEOMETRY and GATES:
//   * the lion's enclosure (A4) — a song ward at A3's east seam that pushes her
//     back (and checkTransitions' clamp behind it), no depth door from the
//     grotto until he is free (GATE_ROOM GA1 `need`), and a saved bench can
//     never be inside it (progressBenchGuard)
//   * the bell (A9) — A8's way up is a gated exit (world.js) that only the
//     freed Sage opens, and a ward is drawn across the hole while it is shut
//   * the staged lion bodies (the meeting, the break) take no damage at all
//     (storyProtected / Boss.die), so no blow can free him out of order
// ...and it is SHOWN, so the player is never left reading a toast to find the
// way: the quarry marks (MARBLE_TRAIL), the marble dust over the hub's cracked
// floor, the quarry visibly cut and the maintenance passage lit on the return,
// and the bound machines she left behind asking to be freed on the way back.
//
// Cleansing reads as a rescue, never as a kill (cleanseBegin): a slow white
// pulse, the infection leaving the body as dark motes that RISE and thin out,
// a column of light, a soft cue, and the word over the body — no debris, no
// detonations, no shake.
//
// docs/CAVES_CH1.md is the cave-by-cave ledger; tests/den-gate.cjs and
// tests/caves-ch1.cjs measure all of it in the real build.
// ===========================================================================

// ---- THE LAIR'S MILESTONES -------------------------------------------------
const PG_LAIR_NEEDS = ['crystal', 'sageTame_GA1D', 'bossChime'];
function pgRobo() { return !(typeof isHero === 'function' && isHero()) && G.save && G.save.storyVersion >= 2; }
function pgLairOpen(f) {
  f = f || (G.save && G.save.flags) || {};
  if (f.bossGlitch) return true;
  return PG_LAIR_NEEDS.every(k => f[k]);
}
function pgBellOpen(f, visited) {
  f = f || (G.save && G.save.flags) || {};
  return !!(f.sageTame_GA1D || f.bossChime || f.bossGlitch || (visited && visited.A9));
}

// A save can only be continued from a bench, and no bench stands inside a
// locked place — but a hand-edited or pre-gate save can name one. Continuing
// it must not start her inside the lair (or the bell's chamber) the gates
// exist to keep her out of. She wakes at the camp bench instead, which is the
// last place before both.
const PG_SAFE_BENCH = { room: 'A3', tx: 8, ty: 15 };
function progressBenchGuard(save) {
  if (!save || save.theme === 'hero' || (typeof isHero === 'function' && isHero())) return false;
  const b = save.bench; if (!b) return false;
  const f = save.flags || {};
  const lockedLair = b.room === 'A4' && !pgLairOpen(f);
  const lockedBell = (b.room === 'A9' || b.room === 'A11') && !pgBellOpen(f, save.visited);
  if (!lockedLair && !lockedBell) return false;
  // the bench static's own geometry (spawnStatic: 44x52, centred on its tile)
  b.room = PG_SAFE_BENCH.room;
  b.x = PG_SAFE_BENCH.tx * TILE + (TILE - 44) / 2;
  b.y = PG_SAFE_BENCH.ty * TILE - 52 + 52 - 38;
  return true;
}

// ---- WHAT TO DO NOW --------------------------------------------------------
// One answer for "what is the current goal of chapter one", from the save
// alone, so a HUD objective line (the OPENING workstream's) and the cave
// guidance below can never disagree. Returns an i18n key, or null when the
// chapter's own opening lessons (or a later chapter) own the answer.
function progressGoal(f) {
  f = f || (G.save && G.save.flags) || {};
  if (!pgRobo() || f.bossGlitch && f.ch2Climb) return null;
  if (!f['on_A0B|ratchet']) return null;               // the opening's lessons speak first
  if (!f.crystal) {
    if (G.save.bag && G.save.bag.cshard || f.pl_cshard && !f.crystal) return 'pg_goal_return';
    if (!f.heal) return 'pg_goal_pack';
    return f.beacon ? 'pg_goal_quarry' : 'pg_goal_marble';
  }
  if (f.bossGlitch) return 'pg_goal_up';           // an older save may hold the lion without the rest
  if (!f.sageTame_GA1D) return 'pg_goal_sage';
  if (!f.bossChime) return 'pg_goal_chime';
  return f.nfMeet ? 'pg_goal_lion' : 'pg_goal_east';
}

// ---- THE QUARRY MARKS -------------------------------------------------------
// The Deaf quarrymen marked their road to the seam in chalk (terminal 20, the
// survey under the hub, says so). Each row: tile columns of a mark on the
// floor, all pointing the way on. CV3 has two roads — to the pillar before the
// forge, and to the maintenance passage after it.
const MARBLE_TRAIL = {
  A5:   [17, 23, 30],
  CV1:  [12, 20, 28, 42, 50],
  CV1B: [12, 26],
  CV2:  [20, 31, 41, 50, 58],
  CV3:  { marble: [12, 22, 32, 42], sage: [12, 22, 30] },
};
// which leg of the road is live: 'marble' (go and get it), 'sage' (the blade
// is forged; the same marks now lead to the passage beside the quarry), or
// nothing (carrying the marble home, or the Sage already free)
function pgTrailPhase(f) {
  f = f || (G.save && G.save.flags) || {};
  if (!pgRobo()) return null;
  if (!f.crystal) return f.pl_cshard ? null : 'marble';
  if (!f.sageTame_GA1D) return 'sage';
  return null;
}
function pgTrailMarks(room, phase) {
  const r = MARBLE_TRAIL[room];
  if (!r) return [];
  return Array.isArray(r) ? r : (r[phase] || []);
}
// the floor under a world x, in this room: the heightfield where there is one
// (the meadow's mounds), else the first solid row under open air from the
// bottom of the grid
function pgFloorY(wx) {
  const col = typeof groundColumnAt === 'function' ? groundColumnAt(wx) : null;
  if (col && col.length) { const y = Math.min.apply(null, col); if (isFinite(y)) return y; }
  const g = G.grid, tx = Math.max(0, Math.min(g[0].length - 1, Math.floor(wx / TILE)));
  let ty = g.length - 1;
  while (ty > 0 && (g[ty][tx] === '#' || g[ty][tx] === 'B')) ty--;
  return (ty + 1) * TILE;
}

// ---- THE HUB'S LANDMARK -----------------------------------------------------
// A2's cracked floor (12-14) is the way down to everything in this file, and a
// player arriving from the west is standing two screens from it with the whole
// meadow to look at. So the floor itself says it: pale marble dust seeping up
// through the cracks and a column of light rising out of them, visible from the
// room's west seam — the material in the ground, not a sign on a post.
const PG_HUB = { room: 'A2', tx0: 12, tx1: 14, ty: 15 };
function pgHubBroken() {
  const br = (G.save && G.save.broken) || {};
  for (let x = PG_HUB.tx0; x <= PG_HUB.tx1; x++) if (br['A2:' + x + ',' + PG_HUB.ty]) return true;
  return false;
}

// ---- WARDS ------------------------------------------------------------------
// The song, wound tight across a way through. Drawn as layered membranes whose
// edges are never straight (NO RIGHT ANGLES), with sound-rings crawling along
// them; `layers` is how many milestones are still missing, so the lair's ward
// visibly thins as the chapter is played: three sheets before the forge, two
// before the Sage, one before the bell, none after.
function pgWardLayers() {
  const f = G.save.flags;
  if (pgLairOpen(f)) return 0;
  return PG_LAIR_NEEDS.filter(k => !f[k]).length;
}
const PG_WARD_EAST = 2.2;       // tiles: the lair ward's depth at A3's east seam (inside the camera's clamp)
const PG_BELL_COLS = [11, 14];  // A8's way up (world.js: the shaft shared with A2 and A9)

// ---- THE TICK ---------------------------------------------------------------
function progressTick(dt) {
  // the cleansing light belongs to the room it was cast in (the reward it was
  // holding is settled by loadRoom's own safety net)
  if (G.pgRoom !== G.roomId) { G.pgRoom = G.roomId; G.cleanses = []; }
  if (!pgRobo() || !player || player.dead || G.trans) return;
  const f = G.save.flags, W = G.roomDef.w * TILE, now = G.save.time || 0;
  // THE LAIR WARD, physically. checkTransitions already refuses the crossing at
  // the room's edge; this is the face of it, a tile and a half earlier, so she
  // meets a thing she can SEE rather than an invisible stop at the seam. Speed
  // is irrelevant: it corrects position after movement, every step, so a dash
  // or a jump arrives at the same place a walk does.
  if (G.roomId === 'A3' && !pgLairOpen(f) && !G.break) {
    const face = W - PG_WARD_EAST * TILE;
    if (player.x + player.w > face) {
      player.x = face - player.w;
      if (player.vx > 0) player.vx = -90;
      if (player.dashT > 0) player.dashT = 0;
      pgWardHit(face, player.y + player.h * 0.5, 'lair');
    }
  }
  // THE BELL WARD. The gate (world.js A8 T exit) makes the hole above a ceiling;
  // this makes the ceiling answer: she is pushed back down with the ward's
  // light, and told why.
  if (G.roomId === 'A8' && !pgBellOpen(f, G.save.visited)) {
    const cx = player.x + player.w / 2;
    if (player.y < TILE * 0.7 && cx > (PG_BELL_COLS[0] - 0.5) * TILE && cx < (PG_BELL_COLS[1] + 1.5) * TILE) {
      player.y = TILE * 0.7;
      if (player.vy < 0) player.vy = 160;
      pgWardHit(cx, TILE * 0.6, 'bell');
    }
  }
  // THE QUARRY, AFTER THE FORGE. The same cavern, visibly not the same: the
  // marble cut, the maintenance passage open and lit, and she is told so the
  // first time she stands there with the blade.
  if (G.roomId === 'CV3' && f.crystal && !f.sageTame_GA1D && !f.pgCv3Back) {
    f.pgCv3Back = 1; persistSoon();
    G.toast(t('pg_cv3_back'));
  }
  // THE BOUND ONES WAIT. Every machine she knocked down before the forge is
  // lying where it fell, still bound — and the road back through the caves is
  // where she meets them again with the blade in her paw.
  if (f.crystal && !(f.pgBound || {})[G.roomId]
      && (G.enemies || []).some(e => e && e.disabled && !e.rescued)) {
    (f.pgBound = f.pgBound || {})[G.roomId] = 1; persistSoon();
    G.toast(t('pg_bound_wait'));
  }
  // THE SURVEY POD (CV1B). Resting at the Deaf quarrymen's own pod restores it,
  // and it charts the quarry's tunnels onto her map — a facility brought back,
  // not a heap of scrap.
  if (G.roomId === 'CV1B' && G.save.bench && G.save.bench.room === 'CV1B' && !f.pgSurvey) {
    f.pgSurvey = 1;
    const ch = G.save.charted = G.save.charted || {};
    for (const id of ['CV1', 'CV1B', 'CV2', 'CV3']) ch[id] = 1;
    persistSoon();
    G.toast(t('pg_survey'));
    if (typeof sfx === 'function') sfx('chargeReady');
  }
  // THE FIRST MARK SPEAKS ONCE: what the arrows are and who drew them.
  if (pgTrailPhase(f) === 'marble' && !f.pgMarks && G.roomId === 'A5') {
    const mk = pgTrailMarks('A5', 'marble');
    if (mk.length && Math.abs(player.x + player.w / 2 - (mk[0] + 0.5) * TILE) < 3 * TILE) {
      f.pgMarks = 1; persistSoon();
      G.toast(t('pg_marks'));
    }
  }
  // THE END OF CHAPTER ONE: the climb above the camp, once the lion is free.
  // The manhwa's chapter-two teaser rides the moment she starts up it (the
  // MANHWA workstream owns the panels; this is only the hook).
  if (G.roomId === 'A3' && f.bossGlitch && f.crystal && !f.ch2Climb) {
    const cx = (player.x + player.w / 2) / TILE, cy = (player.y + player.h / 2) / TILE;
    if (cx >= 17 && cx <= 29 && cy < 8) {
      f.ch2Climb = 1; persist();
      if (typeof panelsPlay === 'function') { try { panelsPlay('ch2_teaser'); } catch (e) {} }
    }
  }
  // cleansing pulses: the reward waits for the light to settle, the way the
  // kill path waits for its finale
  if (G.cleanses && G.cleanses.length) {
    for (const q of G.cleanses) {
      q.t += dt;
      if (q.t < 1.6 && q.t - (q.mt || 0) > 0.05) {
        q.mt = q.t;
        // THE INFECTION LEAVES: dark violet motes rising off the body and
        // thinning out, with white sparks — the opposite of debris, which
        // falls. Nothing here has gravity pulling it down.
        const n = q.small ? 1 : 3;
        for (let i = 0; i < n; i++) {
          addPart(q.x + rnd(0, q.w), q.y + rnd(q.h * 0.2, q.h), rnd(-18, 18), rnd(-110, -50),
            rnd(0.8, 1.3), chance(0.5) ? '#5a2a7a' : '#2a1238', q.small ? 2.2 : 3.2, -40, false);
          if (chance(0.5)) addPart(q.x + rnd(0, q.w), q.y + rnd(0, q.h), rnd(-30, 30), rnd(-80, -20),
            0.7, '#ffffff', 1.8, -20, true);
        }
      }
      if (q.boss && q.t > 1.6 && q.boss.rewardPend) { q.boss.rewardPend = false; G.onBossDead(q.boss.kind); }
    }
    G.cleanses = G.cleanses.filter(q => q.t < 3.4);
  }
}
function pgWardHit(x, y, which) {
  const now = G.save.time || 0;
  if (chance(0.5)) burst(x, y, 4, '#c79bff', 140, 0.35, 0, 2, true);
  G.pgWardFlash = 0.6;
  if (!G.pgWardSaid || now - G.pgWardSaid > 4) {
    G.pgWardSaid = now;
    if (typeof sfx === 'function') sfx('no');
    const hint = which === 'lair' && typeof openingGateHint === 'function' ? openingGateHint('A4') : '';
    G.toast(hint || t(which === 'lair' ? 'gh_marble' : 'gate_chime_ward'));
  }
}

// ---- CLEANSING ---------------------------------------------------------------
// The one picture of a rescue, shared by the Sage, the freed guardians and every
// bound machine she cleanses: see the header. `label` is an i18n key drawn
// over the body; `boss` (optional) is paid its reward when the light settles.
function cleanseBegin(x, y, w, h, label, boss, small) {
  G.cleanses = G.cleanses || [];
  G.cleanses.push({ x, y, w, h, t: 0, label: label || 'pg_freed', boss: boss || null, small: !!small });
  if (typeof sfx === 'function') sfx('heal');
  if (!small) {
    G.flash = Math.max(G.flash || 0, 0.22);
    if (typeof G.addRing === 'function') G.addRing(x + w / 2, y + h / 2);
  }
}
function drawCleanses(c) {
  if (!G.cleanses || !G.cleanses.length) return;
  for (const q of G.cleanses) {
    const cx = q.x + q.w / 2, cy = q.y + q.h / 2, k = q.small ? 0.55 : 1;
    const R = Math.max(q.w, q.h) * (q.small ? 1.2 : 1.6);
    c.save();
    c.globalCompositeOperation = 'lighter';
    // a column of clean light standing on the body, fading as it settles
    const colA = Math.max(0, 1 - q.t / 2.6) * 0.42 * k;
    if (colA > 0.01) {
      const cw = q.w * 0.9;
      const g = c.createLinearGradient(0, q.y + q.h, 0, q.y - 260 * k);
      g.addColorStop(0, 'rgba(235,250,255,' + colA.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(235,250,255,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(cx - cw / 2, q.y + q.h);
      c.quadraticCurveTo(cx - cw * 0.2, q.y - 120 * k, cx, q.y - 260 * k);
      c.quadraticCurveTo(cx + cw * 0.2, q.y - 120 * k, cx + cw / 2, q.y + q.h);
      c.fill();
    }
    // three slow white rings, the pulse going OUT and staying soft
    for (let i = 0; i < 3; i++) {
      const u = (q.t - i * 0.35) / 1.8;
      if (u <= 0 || u >= 1) continue;
      c.strokeStyle = 'rgba(225,245,255,' + ((1 - u) * 0.45 * k).toFixed(3) + ')';
      c.lineWidth = (1 - u) * 3.5 + 1;
      c.beginPath(); c.ellipse(cx, cy, R * (0.4 + u * 1.6), R * (0.32 + u * 1.25), 0, 0, 7); c.stroke();
    }
    c.restore();
    // ...and the word, so nobody reads the light as a death
    const la = Math.min(1, q.t / 0.35) * Math.max(0, Math.min(1, (3.4 - q.t) / 0.8));
    if (la > 0.02) {
      // on a dark plate, like every other word the game hands her: white on
      // the column of light would be white on white
      const sz = q.small ? 12 : 16, ly = q.y - 22 - Math.min(1, q.t) * 10, word = t(q.label);
      c.save(); c.globalAlpha = la;
      c.font = '700 ' + sz + 'px "Segoe UI", Tahoma, sans-serif';
      const lw = c.measureText(word).width + sz * 1.4;
      c.fillStyle = 'rgba(6,14,24,0.82)';
      if (typeof rr === 'function') { rr(c, cx - lw / 2, ly - sz * 0.9, lw, sz * 1.8, sz * 0.6); c.fill(); }
      ftxt(word, cx, ly, sz, '#f4fbff', 'center', 'rgba(140,220,255,0.95)');
      c.restore(); c.globalAlpha = 1;
    }
  }
}

// ---- DRAWING ----------------------------------------------------------------
// Ground layer: marks and dust, under every body.
function drawProgressGround(c) {
  if (!pgRobo()) return;
  const f = G.save.flags, phase = pgTrailPhase(f), now = performance.now() / 1000;
  const sage = phase === 'sage';
  const ink = sage ? '159,220,255' : '238,244,240';
  // the hub's landmark
  if (G.roomId === PG_HUB.room && phase) {
    const x0 = PG_HUB.tx0 * TILE, x1 = (PG_HUB.tx1 + 1) * TILE, cx = (x0 + x1) / 2;
    const broken = pgHubBroken(), fy = broken ? PG_HUB.ty * TILE : Math.min(PG_HUB.ty * TILE, pgFloorY(cx));
    const pu = 0.6 + Math.sin(now * 1.7) * 0.4;
    c.save(); c.globalCompositeOperation = 'lighter';
    // the column of light out of the cracks, tall enough to read from the seam
    const H = 8.5 * TILE;
    const g = c.createLinearGradient(0, fy, 0, fy - H);
    g.addColorStop(0, 'rgba(' + ink + ',' + (0.30 + pu * 0.12).toFixed(3) + ')');
    g.addColorStop(0.45, 'rgba(' + ink + ',' + (0.10 + pu * 0.05).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + ink + ',0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x0 - 6, fy + 4);
    c.bezierCurveTo(x0 + 10, fy - H * 0.4, cx - 30, fy - H * 0.8, cx, fy - H);
    c.bezierCurveTo(cx + 30, fy - H * 0.8, x1 - 10, fy - H * 0.4, x1 + 6, fy + 4);
    c.fill();
    // the seams themselves glow: the dust is coming through the cracks — a
    // pale pool lying ON the surface (anything below it is under the
    // foreground ground and nobody would see it), split by dark seams
    if (!broken) {
      const pg = c.createRadialGradient(cx, fy - 2, 4, cx, fy - 2, (x1 - x0) * 0.75);
      pg.addColorStop(0, 'rgba(' + ink + ',' + (0.55 + pu * 0.3).toFixed(3) + ')');
      pg.addColorStop(1, 'rgba(' + ink + ',0)');
      c.fillStyle = pg; c.beginPath(); c.ellipse(cx, fy - 2, (x1 - x0) * 0.75, 12, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(' + ink + ',' + (0.6 + pu * 0.35).toFixed(3) + ')';
      c.lineWidth = 2; c.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const sx = x0 + 14 + i * ((x1 - x0 - 28) / 3);
        c.beginPath(); c.moveTo(sx - 9, fy - 1);
        c.quadraticCurveTo(sx, fy - 5 - (i % 2) * 3, sx + 9, fy - 1);
        c.stroke();
      }
    } else {
      // the hole she cut keeps breathing light: this is still the way down
      const hg = c.createRadialGradient(cx, fy + 18, 4, cx, fy + 18, 70);
      hg.addColorStop(0, 'rgba(' + ink + ',' + (0.35 + pu * 0.2).toFixed(3) + ')');
      hg.addColorStop(1, 'rgba(' + ink + ',0)');
      c.fillStyle = hg; c.beginPath(); c.ellipse(cx, fy + 18, 70, 40, 0, 0, 7); c.fill();
    }
    c.restore();
    if (chance(0.35)) addPart(x0 + rnd(4, x1 - x0 - 4), fy - 2, rnd(-10, 10), rnd(-70, -30), rnd(0.9, 1.5),
      sage ? '#a8e4ff' : '#f2f5ef', 2, -20, true);
    // a caption on the approach; up close the strike prompt takes over
    if (!broken && player) {
      const d = Math.abs(player.x + player.w / 2 - cx);
      if (d > 140 && d < 470) {
        c.save(); c.globalAlpha = Math.min(1, (470 - d) / 120) * 0.92;
        // one sentence a line: the caption stands over the crack, inside the
        // light, and never runs off the side of a phone's frame
        const lines = pgSentences(t('pg_marble_here'));
        lines.forEach((ln, i) => ftxt(ln, cx, fy - 3.9 * TILE + (i - (lines.length - 1)) * 16, 12, '#f4f7f2', 'center', 'rgba(200,225,215,0.9)'));
        c.restore(); c.globalAlpha = 1;
      }
    }
  }
  // the quarry marks
  if (phase) {
    for (const tx of pgTrailMarks(G.roomId, phase)) {
      const mx = (tx + 0.5) * TILE, my = pgFloorY(mx);
      pgDrawMark(c, mx, my, ink, now + tx);
    }
  }
  // CV3 after the forge: the cut stump where the marble came free, and the
  // maintenance passage lit from inside
  if (G.roomId === 'CV3' && f.pl_cshard) pgDrawStump(c, f);
  if (G.roomId === 'CV3' && f.crystal && !f.sageTame_GA1D) {
    const dx = W_CV3_DOOR() , fy = pgFloorY(dx), pu = 0.6 + Math.sin(now * 2.1) * 0.4;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(dx, fy - 70, 6, dx, fy - 70, 190);
    g.addColorStop(0, 'rgba(120,200,255,' + (0.28 + pu * 0.14).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(120,200,255,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(dx, fy - 70, 190, 150, 0, 0, 7); c.fill();
    c.restore();
    if (chance(0.3)) addPart(dx + rnd(-40, 40), fy - rnd(20, 120), rnd(-14, 14), rnd(-30, 6), 1.2, '#9fdcff', 2, -8, true);
  }
}
function pgSentences(str) {
  const parts = String(str).split(/(?<=[.!?。！？])\s*/).filter(Boolean);
  return parts.length ? parts : [String(str)];
}
function W_CV3_DOOR() { return G.roomDef.w * TILE * (36 / 56); }
// one chalk mark: a curved arrow pointing on, and a rounded pebble — the raw
// marble as the quarrymen drew it. Strokes only, all of them curved.
function pgDrawMark(c, x, y, ink, ph) {
  const pu = 0.65 + Math.sin(ph * 2.3) * 0.35;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const hg = c.createRadialGradient(x, y - 4, 2, x, y - 4, 46);
  hg.addColorStop(0, 'rgba(' + ink + ',' + (0.18 * pu).toFixed(3) + ')');
  hg.addColorStop(1, 'rgba(' + ink + ',0)');
  c.fillStyle = hg; c.beginPath(); c.ellipse(x, y - 4, 46, 22, 0, 0, 7); c.fill();
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = 'rgba(' + ink + ',' + (0.55 + 0.35 * pu).toFixed(3) + ')';
  c.lineWidth = 2.4; c.lineCap = 'round'; c.lineJoin = 'round';
  // the shaft, bowed like a quick hand drew it
  c.beginPath(); c.moveTo(x - 20, y - 6); c.quadraticCurveTo(x - 2, y - 13, x + 16, y - 7); c.stroke();
  // the head
  c.beginPath(); c.moveTo(x + 7, y - 15); c.quadraticCurveTo(x + 13, y - 9, x + 17, y - 7);
  c.quadraticCurveTo(x + 12, y - 4, x + 8, y + 1); c.stroke();
  // the pebble: raw marble, rounded
  c.beginPath(); c.ellipse(x - 27, y - 9, 6, 4.5, -0.3, 0, 7); c.stroke();
  c.restore();
}
function pgDrawStump(c, f) {
  const x = 50 * TILE + TILE / 2, base = 15 * TILE;
  const h = 96 * 1.18, cutY = base - h * 0.38;
  c.save();
  // keep only what is below an uneven cut line — the pillar's own plate,
  // quarried down to a stump
  c.beginPath();
  c.moveTo(x - 90, base + 6);
  c.lineTo(x - 90, cutY + 6);
  c.quadraticCurveTo(x - 30, cutY - 6, x + 6, cutY + 2);
  c.quadraticCurveTo(x + 40, cutY + 10, x + 90, cutY - 4);
  c.lineTo(x + 90, base + 6);
  c.closePath();
  c.clip();
  const drew = typeof drawPlateAnchored === 'function' && drawPlateAnchored(c, 'rawMarble', x, base, h, false);
  if (!drew) {
    c.fillStyle = '#b9c8cb';
    c.beginPath(); c.ellipse(x, base - h * 0.3, 54, h * 0.42, 0, 0, 7); c.fill();
  }
  c.restore();
  // the cut face catches the light
  const pu = 0.6 + Math.sin(performance.now() / 800) * 0.4;
  c.save(); c.globalCompositeOperation = 'lighter';
  c.strokeStyle = 'rgba(240,250,255,' + (0.55 + pu * 0.3).toFixed(3) + ')';
  c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - 46, cutY + 3);
  c.quadraticCurveTo(x - 30, cutY - 6, x + 6, cutY + 2);
  c.quadraticCurveTo(x + 30, cutY + 8, x + 48, cutY + 1);
  c.stroke();
  c.restore();
}
// Over the bodies: the wards and the cleansing light.
function drawProgress(c) {
  if (!pgRobo()) return;
  const now = performance.now() / 1000;
  if (G.pgWardFlash > 0) G.pgWardFlash = Math.max(0, G.pgWardFlash - 1 / 60);
  if (G.roomId === 'A3') {
    const n = pgWardLayers();
    if (n > 0) {
      const W = G.roomDef.w * TILE, x0 = W - PG_WARD_EAST * TILE;
      pgDrawWardV(c, x0, W + 8, -2 * TILE, 15 * TILE + 6, n, now);
    }
  }
  if (G.roomId === 'A8' && !pgBellOpen(G.save.flags, G.save.visited)) {
    pgDrawWardH(c, (PG_BELL_COLS[0] - 0.6) * TILE, (PG_BELL_COLS[1] + 1.6) * TILE, -6, TILE * 1.9, now);
  }
  drawCleanses(c);
}
function pgDrawWardV(c, x0, x1, y0, y1, layers, now) {
  const fl = G.pgWardFlash || 0;
  c.save(); c.globalCompositeOperation = 'lighter';
  // the halo it throws on the camp, so the ward reads from across the yard
  const hw = 3.5 * TILE;
  const hg = c.createLinearGradient(x0 - hw, 0, x0 + 8, 0);
  hg.addColorStop(0, 'rgba(170,110,255,0)');
  hg.addColorStop(1, 'rgba(170,110,255,' + (0.10 + 0.05 * layers + fl * 0.15).toFixed(3) + ')');
  c.fillStyle = hg;
  c.beginPath();
  c.moveTo(x0 + 8, y0);
  c.quadraticCurveTo(x0 - hw * 0.6, (y0 + y1) / 2, x0 + 8, y1);
  c.closePath(); c.fill();
  for (let L = 0; L < layers; L++) {
    const depth = L / Math.max(1, layers);
    const left = x0 + depth * (x1 - x0) * 0.45;
    const a = (0.16 + 0.1 * (layers - L) / layers + fl * 0.25);
    const g = c.createLinearGradient(left, 0, x1, 0);
    g.addColorStop(0, 'rgba(180,120,255,0)');
    g.addColorStop(0.35, 'rgba(180,120,255,' + a.toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,110,190,' + (a * 0.8).toFixed(3) + ')');
    c.fillStyle = g;
    c.beginPath();
    const N = 14;
    for (let i = 0; i <= N; i++) {
      const yy = y0 + (y1 - y0) * i / N;
      const xx = left + Math.sin(now * (1.3 + L * 0.4) + i * 0.9 + L * 2) * 9;
      if (!i) c.moveTo(xx, yy); else c.lineTo(xx, yy);
    }
    c.lineTo(x1, y1); c.lineTo(x1, y0); c.closePath();
    c.fill();
    // sound-rings crawling up the sheet: the song, still singing in it
    c.strokeStyle = 'rgba(230,190,255,' + (0.35 + fl * 0.4).toFixed(3) + ')';
    c.lineWidth = 1.6;
    for (let r = 0; r < 4; r++) {
      const v = ((now * 0.35 + r / 4 + L * 0.13) % 1);
      const yy = y1 - v * (y1 - y0);
      c.beginPath(); c.ellipse(left + 12, yy, 10 + L * 4, 26, 0, -1.3, 1.3); c.stroke();
    }
  }
  c.restore();
}
function pgDrawWardH(c, x0, x1, y0, y1, now) {
  const fl = G.pgWardFlash || 0;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(255,120,200,' + (0.55 + fl * 0.3).toFixed(3) + ')');
  g.addColorStop(0.55, 'rgba(190,120,255,' + (0.28 + fl * 0.2).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(180,120,255,0)');
  c.fillStyle = g;
  c.beginPath();
  const N = 12;
  c.moveTo(x0, y0);
  for (let i = 0; i <= N; i++) {
    const xx = x0 + (x1 - x0) * i / N;
    const sag = Math.sin(Math.PI * i / N);           // the membrane bellies down in the middle
    c.lineTo(xx, y0 + (y1 - y0) * (0.35 + 0.65 * sag) + Math.sin(now * 2.2 + i * 1.1) * 6);
  }
  c.lineTo(x1, y0); c.closePath(); c.fill();
  // the strings it is wound from, each one bowed and trembling
  c.strokeStyle = 'rgba(245,215,255,' + (0.55 + fl * 0.4).toFixed(3) + ')';
  c.lineWidth = 1.5;
  for (let k = 0; k < 4; k++) {
    const yy = y0 + 6 + k * (y1 - y0) * 0.18;
    c.beginPath(); c.moveTo(x0 + 4, yy);
    c.quadraticCurveTo((x0 + x1) / 2, yy + (y1 - y0) * 0.35 + Math.sin(now * 9 + k) * 3, x1 - 4, yy);
    c.stroke();
  }
  // sound-rings dropping out of it: the bell, ringing somewhere above
  for (let r = 0; r < 3; r++) {
    const v = ((now * 0.45 + r / 3) % 1);
    c.strokeStyle = 'rgba(230,190,255,' + ((1 - v) * 0.6).toFixed(3) + ')';
    c.beginPath(); c.ellipse((x0 + x1) / 2, y1 * 0.6 + v * TILE * 1.6, 16 + v * 40, 5 + v * 9, 0, 0, 7); c.stroke();
  }
  c.restore();
}

// ---- REMEMBERED DISCOVERIES -------------------------------------------------
// "Reward early exploration: remember discoveries and adapt later quest
// dialogue rather than making players revisit an empty room solely because
// they explored before accepting the task." (owner). A fetch whose object is
// already in her bag, or a reach whose place she already stood in, is finished
// the moment it is asked — and the asker says so, in their own words.
// Culls are not discoveries: a count of machines broken before the ask is not
// the thing anybody asked for, so they still count from the ask.
function questFoundEarly(q) {
  if (!q || !G.save) return false;
  if (q.kind === 'fetch') return !!(G.save.bag && G.save.bag[q.item]);
  if (q.kind === 'reach') return !!(G.save.visited && G.save.visited[q.room]);
  return false;
}
function questEarlyLines(q) {
  const k = 'q_early_' + q.id, l = t(k);
  const thanks = t('q_thanks_' + q.id);
  const out = [].concat(l && l !== k ? l : t('q_early'));
  if (thanks && thanks !== 'q_thanks_' + q.id) out.push(thanks);
  if (q.id === 'ratchet_forge' && typeof revisedStory === 'function' && revisedStory()) out.push(t('sl_ratchet_moving'));
  return out;
}
