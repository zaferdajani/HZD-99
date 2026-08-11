// ===========================================================================
// THE FREED GUARDIANS — what happens when you swing at something that loves you.
//
// The design rule this whole file exists to enforce: NEVER PUNISH AFFECTION.
// A player who walks up to the beast they just saved and presses attack is not
// trying to hurt it. They are poking it to see what it does. So the swing never
// lands as a swing — it lands as a hand on a flank, and the creature ANSWERS.
//
// The answer is the point. The research on why players love petting animals is
// consistent about one thing: it is not the petting, it is the RECIPROCITY. A
// creature that receives affection and does nothing reads as a prop. A creature
// that flops over, or bows, or headbutts you back, reads as alive — and that is
// what produces the response in the player, in a nine-year-old and in their
// parent, by exactly the same mechanism.
//
// So every reaction here obeys four rules:
//   1. NEVER THE SAME TWICE RUNNING. Each guardian has several answers and
//      cycles them. A canned response stops being a response on the third view.
//   2. TRUE TO THE ANIMAL, AND TO THE FIGHT. The lion that used to roar the
//      room apart now rolls over for its belly. The joke only works because
//      you remember the boss.
//   3. SHE ANSWERS BACK. NYA-9 hops, her ears flick. One-way affection is a
//      vending machine; two-way is a friendship.
//   4. IT GIVES SOMETHING. Not loot for grinding — a bond that visibly grows,
//      and at milestones the creature does something it has never done before.
//      "I raised this" is the strongest hook in the whole genre.
// ===========================================================================

const PET_ACTS = {
  glitch: ['flop', 'lean', 'bonk'],     // NULLFANG — the lion
  brood: ['bow', 'preen', 'gift'],      // TALONHOST — the eagle
  zero: ['nuzzle', 'stamp', 'rear'],    // GLACIERE — the unicorn
  atlas: ['huff', 'duck', 'curl'],      // FURNACE CHOIR — the dragon
  prism: ['cheek', 'belly', 'knead'],   // PRISM PROWLER — the cat
};
const PET_NAMES = { glitch: 'NULLFANG', brood: 'TALONHOST', zero: 'GLACIERE', atlas: 'FURNACE CHOIR', prism: 'PRISM PROWLER' };

function petBond(kind) {
  if (!G.save) return 0;
  if (!G.save.bond) G.save.bond = {};
  return G.save.bond[kind] || 0;
}
function petBondAdd(kind) {
  if (!G.save) return 0;
  if (!G.save.bond) G.save.bond = {};
  G.save.bond[kind] = (G.save.bond[kind] || 0) + 1;
  if (typeof persist === 'function') persist();
  return G.save.bond[kind];
}

// is this thing a freed guardian standing peacefully in the room?
function isPet(b) { return !!(b && b.dead && b.purified && (b.pureT || 0) > 0.6); }

// ---------------------------------------------------------------------------
// THE POKE. Called instead of damage. Picks an answer the player has not just
// seen, starts it, and makes the whole room agree that something nice happened.
// ---------------------------------------------------------------------------
function petPoke(pet, hx, hy) {
  if (!isPet(pet) || (pet.petT || 0) > 0.35) return false;
  const acts = PET_ACTS[pet.kind] || ['lean'];
  // never the same twice running
  let a = acts[Math.floor(rnd(0, acts.length)) % acts.length];
  if (acts.length > 1 && a === pet.petLast) a = acts[(acts.indexOf(a) + 1) % acts.length];
  pet.petLast = a;
  pet.petAct = a;
  pet.petT = 1.5; pet.petT0 = 1.5;
  pet.face = Math.sign((player.x + player.w / 2) - pet.cx()) || pet.face;

  const bond = petBondAdd(pet.kind);
  const cx = pet.cx(), cy = pet.cy();

  // the universal layer, on top of whatever the creature itself does: hearts,
  // a soft chime, a gentle rumble that is nothing like a hit rumble
  for (let i = 0; i < 12; i++)
    addPart(cx + rnd(-pet.w * 0.4, pet.w * 0.4), cy - rnd(0, pet.h * 0.5),
      rnd(-24, 24), rnd(-70, -34), rnd(0.8, 1.4),
      chance(0.5) ? '#ff8fb3' : '#ffc2d4', rnd(2.2, 3.4), -18, true);
  sfx(pet.kind === 'brood' ? 'chirp' : 'purr');
  if (typeof padRumble === 'function') padRumble(0.12, 0.1, 220);   // a purr, not a punch

  // SHE ANSWERS BACK — a little hop and a happy ear flick
  if (player && player.on) { player.vy = -210; }
  player.petJoyT = 0.7;

  // per-guardian consequences that are more than particles
  if (a === 'gift' && typeof G.dropScrap === 'function') G.dropScrap(cx, cy - 10, 6);
  if (a === 'stamp') {
    for (let i = 0; i < 18; i++)
      addPart(cx + rnd(-40, 40), pet.y + pet.h - 4, rnd(-70, 70), rnd(-120, -30),
        rnd(0.6, 1.2), '#dff4ff', rnd(2, 3.4), 260, true);
    cam.shake = Math.max(cam.shake, 2);
  }
  if (a === 'huff') {
    // a real smoke ring, and she can jump through it
    G.petRing = { x: cx + pet.face * pet.w * 0.6, y: cy - 6, r: 8, t: 1.6, t0: 1.6, dir: pet.face };
  }
  if (a === 'flop' || a === 'belly') {
    for (let i = 0; i < 8; i++)
      addPart(cx + rnd(-30, 30), pet.y + pet.h - 6, rnd(-50, 50), rnd(-40, -10),
        rnd(0.5, 0.9), '#e8f4ff', rnd(2, 3), 200, true);
  }

  // MILESTONES. The bond is the real reward, and it has to visibly pay off.
  if (bond === 3 || bond === 8 || bond === 16) {
    pet.petCheerT = 2.2;
    sfx('powerUp');
    if (player) player.cores = Math.min(player.maxCores(), player.cores + 1);
    if (typeof G.toast === 'function')
      G.toast(t('pet_bond').replace('%s', PET_NAMES[pet.kind] || '').replace('%d', bond));
    for (let i = 0; i < 26; i++)
      addPart(cx + rnd(-30, 30), cy + rnd(-20, 20), rnd(-90, 90), rnd(-140, -40),
        rnd(0.9, 1.6), chance(0.4) ? '#fff2a8' : '#ff8fb3', rnd(2.4, 4), -20, true);
  }
  return true;
}

function updatePets(dt) {
  const b = G.boss;
  if (b && (b.petT || 0) > 0) { b.petT -= dt; if (b.petT <= 0) b.petAct = null; }
  if (b && (b.petCheerT || 0) > 0) b.petCheerT -= dt;
  if (player && (player.petJoyT || 0) > 0) player.petJoyT -= dt;
  // the dragon's smoke ring drifts away and thins out
  const r = G.petRing;
  if (r) {
    r.t -= dt; r.x += r.dir * 42 * dt; r.y -= 16 * dt; r.r += 34 * dt;
    if (r.t <= 0) G.petRing = null;
  }
}

// how the body itself should be bent this frame. Returned to the boss renderer
// so a reaction reads in the CREATURE, not only in the particles around it.
function petPose(b) {
  if (!b || !b.petAct) return null;
  const k = 1 - clamp((b.petT || 0) / (b.petT0 || 1), 0, 1);   // 0..1 through the beat
  const s = Math.sin(k * Math.PI);                              // rises and settles
  const a = b.petAct;
  const P = { rot: 0, dx: 0, dy: 0, sx: 1, sy: 1 };
  if (a === 'flop' || a === 'belly') { P.rot = -s * 1.5 * (b.face || 1); P.dy = s * 6; }
  else if (a === 'lean' || a === 'nuzzle' || a === 'cheek') { P.dx = s * 9 * (b.face || 1); P.rot = s * 0.12 * (b.face || 1); }
  else if (a === 'bonk') { P.dx = Math.sin(k * Math.PI * 3) * 11 * (b.face || 1); }
  else if (a === 'bow' || a === 'duck') { P.rot = s * 0.3 * (b.face || 1); P.dy = s * 5; }
  else if (a === 'preen') { P.rot = Math.sin(k * Math.PI * 4) * 0.14; P.sy = 1 + s * 0.07; }
  else if (a === 'rear') { P.rot = -s * 0.4 * (b.face || 1); P.dy = -s * 10; }
  else if (a === 'stamp') { P.dy = Math.abs(Math.sin(k * Math.PI * 2)) * -7; }
  else if (a === 'huff') { P.sx = 1 + s * 0.06; P.sy = 1 - s * 0.05; }
  else if (a === 'curl') { P.rot = s * 0.22 * (b.face || 1); P.sx = 1 - s * 0.08; }
  else if (a === 'knead') { P.dy = Math.sin(k * Math.PI * 5) * 3; }
  // the milestone cheer bounces on top of everything
  if ((b.petCheerT || 0) > 0) P.dy += Math.sin(b.petCheerT * 16) * 4;
  return P;
}

// the flourishes: drawn in world space, over the creature
function drawPetFx(c2) {
  const b = G.boss;
  if (G.petRing) {
    const r = G.petRing, k = clamp(r.t / r.t0, 0, 1);
    c2.save();
    c2.globalAlpha = k * 0.5; c2.strokeStyle = '#ffb877'; c2.lineWidth = 5 * k + 1.5;
    c2.beginPath(); c2.ellipse(r.x, r.y, r.r, r.r * 0.42, 0, 0, 7); c2.stroke();
    c2.globalAlpha = k * 0.25; c2.strokeStyle = '#fff0d8'; c2.lineWidth = 1.5;
    c2.beginPath(); c2.ellipse(r.x, r.y, r.r * 0.78, r.r * 0.32, 0, 0, 7); c2.stroke();
    c2.restore();
  }
  if (!b || !b.petAct) return;
  const k = 1 - clamp((b.petT || 0) / (b.petT0 || 1), 0, 1);
  const s = Math.sin(k * Math.PI);
  const cx = b.cx(), cy = b.cy();
  c2.save();
  // a soft warm bloom, so the moment reads even in a busy room
  c2.globalCompositeOperation = 'lighter'; c2.globalAlpha = s * 0.16;
  const g = c2.createRadialGradient(cx, cy, 4, cx, cy, b.w * 1.1);
  g.addColorStop(0, '#ffd0e0'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c2.fillStyle = g; c2.beginPath(); c2.arc(cx, cy, b.w * 1.1, 0, 7); c2.fill();
  c2.restore();
  // the eagle sheds a feather; the unicorn breathes a frost heart
  if (b.petAct === 'preen' || b.petAct === 'gift') {
    c2.save();
    c2.globalAlpha = 0.8 * (1 - k);
    c2.fillStyle = '#dfe9f5';
    const fx = cx + Math.sin(k * 5) * 22, fy = cy - 10 + k * 40;
    c2.translate(fx, fy); c2.rotate(Math.sin(k * 4) * 0.6);
    c2.beginPath(); c2.ellipse(0, 0, 3, 9, 0, 0, 7); c2.fill();
    c2.restore();
  }
  if (b.petAct === 'nuzzle' || b.petAct === 'rear') {
    c2.save();
    c2.globalAlpha = s * 0.85; c2.fillStyle = '#cfeaff';
    petHeart(c2, cx + (b.face || 1) * 16, cy - 26 - s * 12, 5 + s * 3);
    c2.restore();
  }
}
function petHeart(c2, x, y, r) {
  c2.save(); c2.translate(x, y); c2.scale(r / 10, r / 10);
  c2.beginPath();
  c2.moveTo(0, 4);
  c2.bezierCurveTo(-10, -4, -6, -12, 0, -6);
  c2.bezierCurveTo(6, -12, 10, -4, 0, 4);
  c2.closePath(); c2.fill(); c2.restore();
}

// the bond, shown on the creature when she is near it — nurturing needs a dial
function drawPetBond(c2) {
  const b = G.boss;
  if (!isPet(b) || !player || player.dead) return;
  const d = Math.abs(player.x + player.w / 2 - b.cx());
  if (d > 150) return;
  const n = petBond(b.kind);
  const shown = Math.min(n, 16);
  const x0 = b.cx() - (Math.min(shown, 8) * 9) / 2, y0 = b.y - 16;
  c2.save();
  for (let i = 0; i < Math.min(shown, 8); i++) {
    c2.globalAlpha = 0.85;
    c2.fillStyle = n >= 16 ? '#fff2a8' : n >= 8 ? '#ffb3cd' : '#ff8fb3';
    petHeart(c2, x0 + i * 9 + 4, y0, 4.2);
  }
  if (n > 8) { c2.globalAlpha = 0.9; ftxt('×' + n, b.cx() + 44, y0 + 2, 10, '#ffc2d4', 'left'); }
  c2.restore();
}
