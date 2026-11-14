// ---------------------------------------------------------------------------
// A MACHINE IS IN THE WAY (owner, 2026-11-14: "I shouldn't be able to walk
// through enemies").
//
// She could. A hostile body was a damage volume and nothing else: touch it, be
// thrown back, and for the second of invulnerability that follows walk straight
// through it and out the other side — through a guard, through a wolf, through
// a third of a ton of lion. The films of the NULLFANG fight show her doing it
// every few seconds, because it was the cheapest way to get behind anything.
//
// Now a hostile body is a WALL TO HER FEET:
//
//   - She cannot WALK into it. Her own movement stops at its edge, hurt or
//     not, invulnerable or not, dashing or not.
//   - She can go OVER it. Only her sideways movement is stopped; a body lower
//     than her jump is a body she can clear, and landing on one slides her off
//     the side she is on. (Every body in the roster is under her 207 px jump.)
//   - A body that comes over HER still does what it did. Blocking stops her
//     walking in; it never pushes her out ahead of an advancing machine, so a
//     pounce that lands on her lands on her and a lunge that reaches her
//     reaches her — the contact rules in Enemy.update and Boss.update are
//     untouched. Only once she is inside a HURT box is she eased back out of
//     it, to the side she is on, or to the other if a wall has her pinned.
//   - What is not fighting her is not in her way: the dead, the bound, the
//     rescued, the tamed, the charmed, a purified guardian, a sleeping one, a
//     keeper who is not duelling, a guardian that has stepped out of the world
//     (lsvanish, arcstorm). A bound machine lying on the floor of a corridor
//     must not seal the corridor.
//   - The phantom dash phases, as it already refuses the hit. The grapple and
//     the soar own her motion and are left alone. Staging (a guardian's
//     entrance, the waking, a scripted meeting, the gate walk) places bodies
//     where the scene needs them and is left alone.
//
// THE BOX IS THE BODY, NOT THE HURT BOX. The engine's x/y/w/h is where a claw
// has to land, and it is small on purpose: NULLFANG's is 84 px of a lion drawn
// 208 px long. A wall that size would let her wade 60 px into a mane first. So
// the wall is the hurt box widened three quarters of the way out to the drawing
// (assets/bodybox.json, measured by tools/bodybox.cjs from the art itself) —
// and never by more than SOLID.pad, because she still has to reach the hurt box
// from outside the wall: her shortest strike covers 74 px from her middle, and
// 46 px of padding plus her own half-width leaves it 16 px of the hurt box.
// NOSTOS draws different creatures on the same kinds and has not been
// measured: there the wall is the hurt box.
// ---------------------------------------------------------------------------
const SOLID = { on: true, pad: 46, lift: 60, out: 560, grace: 5 };
const SOLID_B = { x0: 0, x1: 0, y0: 0, y1: 0 };
function bodySolid(e) {
  if (!e || e.dead || e.disabled || e.rescued || e.meet || e.tame || e.calm || e.calmed || e.purified) return false;
  if ((e.hypnoT || 0) > 0) return false;
  if (typeof isWolf === 'function' && isWolf(e) && typeof packTamed === 'function' && packTamed()) return false;
  if (e.kind === 'sage' && !(typeof sageDuelActive === 'function' && sageDuelActive(e))) return false;
  if (typeof Boss !== 'undefined' && e instanceof Boss && /^(dorm|intro|lsvanish|arcstorm)$/.test(e.st || '')) return false;
  return true;
}
// the wall round one body, into SOLID_B
function solidBox(e) {
  let half = e.w / 2, top = e.h;
  const T = (typeof window !== 'undefined' && window.BODY_BOX && !(typeof isHero === 'function' && isHero()))
    ? window.BODY_BOX[((typeof Boss !== 'undefined' && e instanceof Boss) ? 'boss:' : '') + e.kind] : null;
  // only for the hurt box that was measured: a body that resizes itself is its own box
  if (T && T.w === e.w && T.h === e.h) {
    half += clamp((Math.min(T.l, T.r) - half) * 0.75, 0, SOLID.pad);
    top += clamp((T.top - e.h) * 0.6, 0, SOLID.lift);
  }
  const cx = e.x + e.w / 2, fy = e.y + e.h, B = SOLID_B;
  B.x0 = cx - half; B.x1 = cx + half; B.y0 = fy - top; B.y1 = fy;
  return B;
}
// would her box, moved to x, be inside a wall tile? (the push must not put her in one)
function solidTileFree(p, x) {
  if (typeof solidAt !== 'function') return true;
  const t0 = Math.floor(p.y / TILE), t1 = Math.floor((p.y + p.h - 1) / TILE);
  const a = Math.floor(x / TILE), b = Math.floor((x + p.w - 1) / TILE);
  for (let ty = t0; ty <= t1; ty++) for (let tx = a; tx <= b; tx++) if (solidAt(tx, ty)) return false;
  return true;
}
function solidOne(p, e, xBefore, dt) {
  const B = solidBox(e);
  // over it or under it: nothing to stop
  if (p.y + p.h <= B.y0 + SOLID.grace || p.y >= B.y1) return;
  if (p.x + p.w <= B.x0 || p.x >= B.x1) return;
  // SHE WALKED IN this step: put her back at the edge she came through
  if (xBefore + p.w <= B.x0 + 0.5) { p.x = B.x0 - p.w; if (p.vx > 0) p.vx = 0; p.bodyBlock = e; return; }
  if (xBefore >= B.x1 - 0.5) { p.x = B.x1; if (p.vx < 0) p.vx = 0; p.bodyBlock = e; return; }
  // SHE WAS ALREADY INSIDE THE WALL: it came over her, or she came down onto it.
  const pc = p.x + p.w / 2, ec = e.x + e.w / 2;
  const side = pc < ec ? -1 : pc > ec ? 1 : -(p.face || 1);
  // ...she may always leave, and never go further in
  const moved = p.x - xBefore;
  if (moved * side < 0) { p.x = xBefore; if (p.vx * side < 0) p.vx = 0; p.bodyBlock = e; }
  // inside the HURT box itself she is eased out — to her own side, or through
  // to the other if a wall has her pinned (a body that could crush her against
  // a wall would be a softlock with a health bar)
  if (p.x + p.w > e.x && p.x < e.x + e.w) {
    const step = SOLID.out * dt;
    const want = side < 0 ? Math.max(e.x - p.w, p.x - step) : Math.min(e.x + e.w, p.x + step);
    if (solidTileFree(p, want)) p.x = want;
    else {
      const other = side < 0 ? Math.min(e.x + e.w, p.x + step) : Math.max(e.x - p.w, p.x - step);
      if (solidTileFree(p, other)) p.x = other;
    }
  }
}
// Called by Player.update right after her own movement is resolved against the
// room. xBefore is where she stood before that movement.
function solidResolve(p, xBefore, dt) {
  p.bodyBlock = null;
  if (!SOLID.on || typeof G === 'undefined' || G.state !== 'PLAY' || p.dead) return;
  if (G.bossEntry || G.wake || G.gateWalk || G.recharge || G.ghHold || G.cut || (G.meet && !G.meet.interactive)) return;
  if (p.grap || p.soar) return;
  if (p.dashT > 0 && typeof hasCrest === 'function' && hasCrest('phantom')) return;
  for (const e of G.enemies) if (bodySolid(e)) solidOne(p, e, xBefore, dt);
  if (G.boss && bodySolid(G.boss)) solidOne(p, G.boss, xBefore, dt);
}
