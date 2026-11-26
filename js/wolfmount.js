// ===========================================================================
// THE WOLF MOUNT — she rides the Alpha she calls.
//
// The owner, 2026-11-25: "the logic of alpha wolf that gives me the ability to summon wolves.
// Improving this skill by spending shards at certain NPCs should allow me to later on mount the
// wolf ... I can use the wolf when it's summoned as mounted and fight with it. Hits will reduce
// the wolf's hit until it's tired and depleted. That's when the wolf will run back away, will
// retire and leave you back to fight. Mounting a wolf should give me extra abilities, have its
// own artwork, have its own abilities and fun to play with ... an NPC that tells me about the
// secret of mounting wolves through a certain task ... make it in the one after that [Kingdom 3]"
// · "While mounted, I should also be able to use dash as a skill and create skills that I can use
// using the wolf, such as scratch, jumping, howling. Maybe that will stun the enemy a little bit."
//
// THE ROAD TO IT (rebuilt 2026-11-26 — the owner: "the wolf I'm riding on should be at the same
// size as the wolf I am summoning ... summon the beaten Alpha and ride it"): THE PACK LADDER,
// js/packtree.js. The small wolf is never ridden any more; CALL THE ALPHA (Ratchet) brings the
// Alpha himself, and the Tinker in the Foundry fits HIM with a harness once the Alpha she calls has
// brought down three of his machines (js/quests.js patch_harness); then RIDE THE ALPHA is on the
// Tinker's shelf. The 1.9x-scaled small wolf with her landing crouch pasted on its back is GONE
// (owner, refusing "becoming on it").
//
// RIDING: the called Alpha comes to her; beside him, the interact key (or UP on the ground) puts
// her on his back. She keeps her own body box and controls — the resolver, the doors, the rooms —
// scaled to the animal under her: his run, his longer leap, and her DASH becomes his lunge, which
// carries his weight into what it meets. ATTACK is his SCRATCH (he rears and swipes a forepaw; the
// hit is the reach of the drawn paw). The arm key is his HOWL (a recorded wolf): the machines near
// her stagger, briefly; a guardian only flinches. DOWN + JUMP gets her off.
// THE ALPHA TAKES THE BLOWS: a hit while she rides costs his stamina, not her cores, and he tires on
// his own as he runs. Spent, he sets her down on her feet and lopes off; the call's cooldown stands.
// THE ART is ONE IMAGE per frame — the Alpha with her on him, filmed (RIDE_ART in packtree.js:
// ride_gallop, ride_leap, ride_rear), at the Alpha's own draw scale on the box she calls him with.
// No ridden stand or lunge was filmed: standing holds the gallop's first cell and the lunge plays
// the leap's gather. No light round either.
// ===========================================================================
const WOLF_MOUNT = {
  stam: 100,          // his stamina
  drain: 2.2,         // per second of riding (about 45 s of an unhurt ride)
  hit: 24,            // a blow she takes while riding
  iT: 0.7,            // ...and the breath before the next can land
  spdK: 1.45,         // his run against hers
  jumpK: 1.22,        // his leap against her jump
  dashK: 1.4,         // his lunge against her dash
  dashDmg: 16,        // what the lunge's weight does to what it meets
  reach: 160,         // how close the called Alpha must be for her to get on
  // the swipe: the rear take's cells 0-6 over t; the paw is out from 35% to 85% of it
  scratch: { cd: 0.55, t: 0.42, on: 0.35, off: 0.85, reach: 96, h: 70, dmg: 20 },
  howl: { cd: 6, r: 290, stun: 1.2, boss: 0.35, cost: 10, t: 0.8 },
};
function wmLearned() { return !(typeof isHero === 'function' && isHero()) && typeof ptHas === 'function' && ptHas('alride') && ptRideArt(); }
function wmRiding() { return !!(G.mount && G.mount.w && G.packWolf === G.mount.w); }
function wmWolfNear(p) {
  const w = G.packWolf;
  if (!w || !w.alpha || w.leaveT > 0 || !wmLearned()) return null;
  return Math.abs(w.x + w.w / 2 - (p.x + p.w / 2)) < WOLF_MOUNT.reach && Math.abs(w.y + w.h - (p.y + p.h)) < 40 ? w : null;
}
// ON: she climbs on; he stops hunting and carries her
function wmMount(p) {
  const w = G.packWolf; if (!w || !w.alpha) return false;
  G.mount = { w, stam: WOLF_MOUNT.stam, scrT: 0, scrCD: 0, howlCD: 0, howlT: 0, landT: 0, hitSet: null, lastVy: 0, dashB: false };
  w.mounted = 1; w.st = 'run'; w.stT = 0; w.hunt = 0;
  // he comes under her (she stays on the ground she chose; moving her to him could set her over a pit)
  w.x = p.x + p.w / 2 - w.w / 2; w.y = p.y + p.h - w.h; p.vx = 0;
  if (typeof mediaFetch === 'function') for (const k of Object.values(RIDE_ART)) mediaFetch(k.key, 1);
  if (typeof sfx === 'function') sfx('alpha_bark');
  if (typeof burst === 'function') burst(p.x + p.w / 2, p.y + p.h, 8, '#b9a88a', 140, 0.4, 300, 2.2, false);
  if (G.save && G.save.flags && !G.save.flags.wmTold) { G.save.flags.wmTold = 1; G.toast(t('wm_how')); }
  return true;
}
// OFF: of her own will (a hop off his back) or thrown when he is spent (set down on her feet)
function wmDismount(p, spent) {
  const M = G.mount; if (!M) return;
  const w = M.w;
  G.mount = null;
  if (w) {
    w.mounted = 0;
    w.x = p.x + p.w / 2 - w.w / 2; w.y = p.y + p.h - w.h; w.vx = p.vx; w.vy = 0; w.face = p.face || w.face;
    // spent, his time is up: the lope away (alcStep's own)
    if (spent) { w.t = 0; w.leaveT = ALPHA_SIDE.leave; }
  }
  if (spent) {
    p.vy = -300; p.vx = -(p.face || 1) * 140; p.on = false; p.iT = Math.max(p.iT || 0, 0.8);
    if (typeof sfx === 'function') sfx('alpha_bark');
    G.toast(t('wm_tired'));
  } else { p.vy = -420; p.on = false; }
  // spent, the call waits its whole cooldown again (a ride can outlast the one it started with)
  p.armCD = Math.max(p.armCD || 0, spent ? ALPHA_SIDE.cd : 1.5);
}
// the claws' reach, in front of him at the height of his forelegs — the drawn shape
function wmScratchBox(p) {
  const S = WOLF_MOUNT.scratch, w = G.mount.w, f = p.face || 1;
  const cx = w.x + w.w / 2, x0 = f > 0 ? cx + w.w * 0.25 : cx - w.w * 0.25 - S.reach;
  return { x: x0, y: w.y + w.h - S.h, w: S.reach, h: S.h };
}
function wmFoes() { return alcFoes(); }
function wmHitFoe(q, dmg, dir, src) {
  const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
  const dm = Math.round(dmg * ((typeof DF === 'function' && DF().pdmg) || 1));
  dealDmg(q, dm, null, b.x + b.w / 2, b.y + b.h / 2, true, src);
  if (!(typeof Boss !== 'undefined' && q instanceof Boss) && q.kind !== 'turret') { q.kbT = Math.max(q.kbT || 0, 0.18); q.vx = (q.vx || 0) + dir * 220; q.vy = (q.vy || 0) - 80; }
  if (q.hp <= 0 && !q.dead && typeof q.die === 'function') q.die(dir, -0.3);
}
// roughly where her body is drawn on his back (the light rides up with her)
function wmSeatY(p) {
  const W = G.mount.w;
  return W.y + W.h - W.h * ALPHA_PX * RIDE_ART.gallop.ch * 0.92;
}
// THE HOWL: a recorded wolf; the machines near her stagger, a guardian only flinches
function wmHowl(p) {
  const H = WOLF_MOUNT.howl, M = G.mount;
  M.howlCD = H.cd; M.howlT = H.t; M.stam = Math.max(1, M.stam - H.cost);
  if (typeof sfx === 'function') sfx('alpha_howl');
  cam.shake = Math.max(cam.shake || 0, 5);
  const px = p.x + p.w / 2, py = p.y + p.h / 2;
  let n = 0;
  for (const q of wmFoes()) {
    const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
    if (Math.hypot(b.x + b.w / 2 - px, b.y + b.h / 2 - py) > H.r) continue;
    n++;
    if (typeof Boss !== 'undefined' && q instanceof Boss) { q.stagT = Math.max(q.stagT || 0, H.boss); q.howlT = H.boss; }
    else { q.kbT = Math.max(q.kbT || 0, H.stun); q.vx = Math.sign(b.x + b.w / 2 - px || 1) * 90; q.howlT = H.stun; }
    // dust off what it shook, never a ring of light (the ledger)
    if (typeof burst === 'function') burst(b.x + b.w / 2, b.y + b.h, 6, '#b9a88a', 120, 0.4, 300, 2, false);
  }
  if (typeof burst === 'function') burst(px, p.y + p.h, 12, '#b9a88a', 220, 0.5, 300, 2.4, false);
  return n;
}
// ---- the ride, stepped (Player.update is wrapped below) ------------------------------------
function wmPre(p, dt) {
  const M = G.mount, S = WOLF_MOUNT.scratch;
  M.scrCD -= dt; M.howlCD -= dt;
  // the sword stays sheathed and the suit's arm is the howl while she rides
  p.atkCD = Math.max(p.atkCD || 0, 0.05); p.atkBuf = 0;
  p.armCD = Math.max(p.armCD || 0, 0.05); p.castCD = Math.max(p.castCD || 0, 0.05);
  if (inD('DOWN') && inP('JUMP')) { wmDismount(p, false); return false; }
  if (inP('ATK') && M.scrCD <= 0 && !(M.howlT > 0)) {
    M.scrT = S.t; M.scrCD = S.cd; M.hitSet = new Set();
    if (typeof sfx === 'function') sfx('alpha_claw');
  }
  if (inP('CAST') && M.howlCD <= 0 && !(M.scrT > 0)) wmHowl(p);
  return true;
}
function wmPost(p, dt) {
  const M = G.mount, W = M.w;
  // his leap: the jump that just left the ground goes higher and further
  if (M.lastVy > -120 && p.vy < -JUMP_V * 0.9 && !p.on) { p.vy *= WOLF_MOUNT.jumpK; if (typeof sfx === 'function') sfx('alpha_leap'); }
  M.lastVy = p.vy;
  // his lunge: her dash, with his weight behind it — and what it runs into feels it
  if (p.dashT > 0) {
    if (!M.dashB) {
      M.dashB = true; p.dashVX = (p.dashVX || 0) * WOLF_MOUNT.dashK; M.lungeSet = new Set();
      // a wolf's lunge is weight, not light: none of her dash's ring, sparks or wake
      p.dashFx = null;
      if (typeof RIPPLES !== 'undefined') for (let i = RIPPLES.length - 1; i >= 0; i--) if (RIPPLES[i].col === '#8ff6ff' && RIPPLES[i].t <= 0.05) RIPPLES.splice(i, 1);
      if (typeof parts !== 'undefined') for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; if (q.life > q.life0 - 0.03 && /8ff6ff|ffffff/i.test(q.color || '')) parts.splice(i, 1); }
      if (typeof burst === 'function') burst(W.x + W.w / 2, W.y + W.h, 8, '#8a7a62', 160, 0.45, 500, 2.2, false);   // the earth he kicks off
    }
    // ...and no ghosts of her hung behind him
    p.dashTrailT = 1; if (p.trail) p.trail.length = 0;
    for (const q of wmFoes()) {
      if (M.lungeSet.has(q)) continue;
      const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
      if (aabb({ x: W.x - 10, y: W.y, w: W.w + 20, h: W.h }, b)) { M.lungeSet.add(q); wmHitFoe(q, WOLF_MOUNT.dashDmg, p.face || 1, 'mount'); }
    }
  } else M.dashB = false;
  // the scratch: the paw is out for the middle of the swipe, each foe once
  if (M.scrT > 0) {
    M.scrT -= dt;
    const S = WOLF_MOUNT.scratch, u = 1 - M.scrT / S.t;
    if (u >= S.on && u <= S.off) {
      const box = wmScratchBox(p);
      for (const q of wmFoes()) {
        if (M.hitSet.has(q)) continue;
        const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
        if (aabb(box, b)) { M.hitSet.add(q); wmHitFoe(q, S.dmg, p.face || 1, 'mount'); if (typeof sfx === 'function') sfx('wolf_bite'); }
      }
    }
  }
  if (M.howlT > 0) M.howlT -= dt;
  // he tires as he runs
  M.stam -= WOLF_MOUNT.drain * dt;
  // he is under her: his body goes where hers does, his stride paced by the ground covered
  const wasOn = W.on;
  const nx = p.x + p.w / 2 - W.w / 2;
  W.dist = (W.dist || 0) + Math.abs(nx - W.x);
  W.x = nx; W.y = p.y + p.h - W.h; W.vx = p.vx; W.vy = p.vy; W.on = p.on;
  W.face = p.face || W.face || 1; W.dir = W.face; W.anim = (W.anim || 0) + dt; W.t = Math.max(W.t || 0, 1);
  W.airT = p.on ? 0 : (W.airT || 0) + dt;
  if (p.on && !wasOn) M.landT = 0.24; else if (M.landT > 0) M.landT -= dt;
  if (M.stam <= 0) wmDismount(p, true);
}
// the stamina, near her cores: a short bar in his own fur, one word over it
function drawWolfMountHud() {
  const M = G.mount; if (!M || typeof c === 'undefined') return;
  const k = clamp(M.stam / WOLF_MOUNT.stam, 0, 1), x = 22, y = 104, w = 120, h = 8;
  c.save();
  c.fillStyle = 'rgba(4,8,12,0.7)'; rr(c, x - 3, y - 3, w + 6, h + 6, 5); c.fill();
  c.fillStyle = k < 0.25 ? '#c46b4a' : '#b9a88a'; rr(c, x, y, Math.max(2, w * k), h, 4); c.fill();
  ftxt(t('wm_wolf'), x, y - 9, 11, '#d8cdb8', 'left', 'rgba(0,0,0,0.7)', '700');
  c.restore();
}
// the prompt beside her called Alpha: one word
function drawWolfMountPrompt(c2) {
  if (G.mount || !player || !wmWolfNear(player)) return;
  const w = G.packWolf;
  ftxt('▲ ' + t('wm_ride'), w.x + w.w / 2, w.y - 64, 12, '#eef3fa', 'center', 'rgba(0,0,0,0.75)', '700');
}
(function wmInstall() {
  if (typeof Player === 'undefined' || Player.prototype.__wm) return;
  Player.prototype.__wm = true;
  const U = Player.prototype.update, H = Player.prototype.hurt, D = Player.prototype.draw, S = Player.prototype.speed;
  Player.prototype.speed = function () { const v = S.call(this); return G.mount && this === player ? v * WOLF_MOUNT.spdK : v; };
  Player.prototype.update = function (dt) {
    // she gets on beside her called Alpha (the interact key, or UP on the ground)
    if (!G.mount && this === player && G.state === 'PLAY' && !G.near && wmWolfNear(this) && (inP('INT') || (inP('UP') && this.on))) wmMount(this);
    if (!wmRiding() || this !== player) { if (G.mount && !wmRiding()) G.mount = null; return U.call(this, dt); }
    if (!wmPre(this, dt)) return U.call(this, dt);
    const r = U.call(this, dt);
    if (G.mount) wmPost(this, dt);
    return r;
  };
  // THE ALPHA TAKES THE BLOWS while she rides
  Player.prototype.hurt = function (d, fromX, src, foe) {
    if (!wmRiding() || this !== player) return H.call(this, d, fromX, src, foe);
    if (this.dead || this.iT > 0) return;
    const M = G.mount;
    M.stam -= WOLF_MOUNT.hit * Math.max(1, d || 1);
    this.iT = WOLF_MOUNT.iT; this.hurtPoseT = 0;
    this.vx = Math.sign((this.x + this.w / 2) - (fromX == null ? this.x : fromX) || 1) * 220; this.vy = Math.min(this.vy, -160);
    cam.shake = Math.max(cam.shake || 0, 4);
    if (typeof sfx === 'function') sfx('alpha_rendwarn');
    try { G.dmgLog = G.dmgLog || {}; G.dmgLog['wolf:' + (src || '?')] = (G.dmgLog['wolf:' + (src || '?')] | 0) + 1; } catch (e) {}
    if (M.stam <= 0) wmDismount(this, true);
  };
  // riding, the picture is ONE filmed image: the Alpha with her on him (packtree.js ptRideDraw).
  // Her own body is not drawn, and neither is his — never a composite of the two.
  Player.prototype.draw = function (c2) {
    if (!wmRiding() || this !== player) return D.call(this, c2);
    ptRideDraw(c2, this);
  };
})();
// ---- her words, five languages (measured by tests/text-budget.cjs as part of TEXT_LITE) -----
// (s_packup* stay for Ratchet's row while she has no pack; the row's name follows the next rung
// of the ladder once she does: pk_n_* in js/packtree.js)
const WM_TEXT = {
  en: { wm_ride: 'Ride', wm_wolf: 'ALPHA', wm_tired: 'The Alpha is spent.', wm_how: 'Attack: claws. Arm: howl. Down + jump: off.',
        wm_learn: 'THE HARNESS', wm_learnd: 'Patch-7 sells the ride on his shelf.',
        s_packup: 'A Stronger Wolf', s_packupd: 'Your wolf stays longer and bites harder.', s_packup_wait: 'For the pack the Alpha gives.', s_packup_now: 'Your wolf stays longer now.',
        q_ask_patch_harness: ['The Alpha trusts you. He could carry you.', 'Let him bring down three of my machines.'],
        q_goal_patch_harness: 'Your Alpha downs %n machines', q_thanks_patch_harness: 'He fights for you. His harness is ready.' },
  ar: { wm_ride: 'اركبي', wm_wolf: 'الألفا', wm_tired: 'الألفا أُنهك.', wm_how: 'الهجوم: مخالب. الذراع: عواء. أسفل + قفز: نزول.',
        wm_learn: 'اللجام', wm_learnd: 'يبيع ترقيع-7 الركوب على رفّه.',
        s_packup: 'ذئب أقوى', s_packupd: 'يبقى ذئبكِ أطول ويعضّ أقوى.', s_packup_wait: 'للقطيع الذي يمنحه الألفا.', s_packup_now: 'ذئبكِ يبقى أطول الآن.',
        q_ask_patch_harness: ['الألفا يثق بكِ. قد يحملكِ.', 'دعيه يُسقط ثلاثاً من آلاتي.'],
        q_goal_patch_harness: 'الألفا يُسقط %n آلات', q_thanks_patch_harness: 'إنه يقاتل لأجلكِ. لجامه جاهز.' },
  tr: { wm_ride: 'Bin', wm_wolf: 'ALFA', wm_tired: 'Alfa tükendi.', wm_how: 'Saldırı: pençe. Kol: uluma. Aşağı + zıpla: in.',
        wm_learn: 'KOŞUM', wm_learnd: 'Patch-7 binişi rafında satıyor.',
        s_packup: 'Daha Güçlü Kurt', s_packupd: 'Kurdun daha uzun kalır, daha sert ısırır.', s_packup_wait: 'Alfa\'nın verdiği sürü için.', s_packup_now: 'Kurdun artık daha uzun kalıyor.',
        q_ask_patch_harness: ['Alfa sana güveniyor. Seni taşıyabilir.', 'Makinelerimden üçünü devirsin.'],
        q_goal_patch_harness: 'Alfan %n makine devirsin', q_thanks_patch_harness: 'Senin için dövüşüyor. Koşumu hazır.' },
  zh: { wm_ride: '骑乘', wm_wolf: '头狼', wm_tired: '头狼累垮了。', wm_how: '攻击：爪击。战衣：嚎叫。下+跳：下来。',
        wm_learn: '挽具', wm_learnd: '帕奇-7的货架上出售骑乘。',
        s_packup: '更强的狼', s_packupd: '你的狼停留更久，咬得更狠。', s_packup_wait: '给头狼赠予的狼群。', s_packup_now: '你的狼现在停留更久。',
        q_ask_patch_harness: ['头狼信任你。它能驮着你。', '让它撂倒我三台机器。'],
        q_goal_patch_harness: '你的头狼撂倒 %n 台机器', q_thanks_patch_harness: '它为你而战。它的挽具好了。' },
  ru: { wm_ride: 'Верхом', wm_wolf: 'АЛЬФА', wm_tired: 'Альфа выбился из сил.', wm_how: 'Атака: когти. Костюм: вой. Вниз + прыжок: слезть.',
        wm_learn: 'УПРЯЖЬ', wm_learnd: 'Патч-7 продаёт езду на своей полке.',
        s_packup: 'Волк сильнее', s_packupd: 'Твой волк держится дольше и кусает сильнее.', s_packup_wait: 'Для стаи, что даст Альфа.', s_packup_now: 'Теперь твой волк держится дольше.',
        q_ask_patch_harness: ['Альфа верит тебе. Он может нести тебя.', 'Пусть свалит три моих машины.'],
        q_goal_patch_harness: 'Твой Альфа валит машин: %n', q_thanks_patch_harness: 'Он бьётся за тебя. Упряжь готова.' },
};
if (typeof TEXT_LITE !== 'undefined') for (const L of Object.keys(WM_TEXT)) Object.assign(TEXT_LITE[L] = TEXT_LITE[L] || {}, WM_TEXT[L]);
