// ===========================================================================
// THE WOLF MOUNT — she rides the wolf the pack sends her.
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
// THE ROAD TO IT: the Alpha gives THE PACK (js/packcall.js: one wolf for ten seconds). Ratchet
// sells THE PACK, LONGER for shards (a longer stay, a harder bite). In the Foundry (Kingdom 3) the
// Tinker, who builds things, fits a wolf with a harness once it has shown it fights for her: his
// errand (js/quests.js patch_harness) is that her called wolf brings down three machines. Then
// G.save.flags.wolfMount, and from then on her called wolf can be ridden.
//
// RIDING: the called wolf comes to her; beside it, the interact key (or UP on the ground) puts her
// on its back. She keeps her own body and her own controls — the resolver, the doors, the rooms —
// scaled to the animal under her: its run, its longer leap, and her DASH becomes its lunge, which
// carries its weight into what it meets. ATTACK is its SCRATCH, the claws thrown forward (the hit
// is the reach of the drawn forelegs). The arm key is its HOWL (a recorded wolf): the machines
// near her stagger, briefly; a guardian only flinches. DOWN + JUMP gets her off.
// THE WOLF TAKES THE BLOWS: a hit while she rides costs its stamina, not her cores, and it tires
// on its own as it runs. Spent, it bucks her down onto her feet and lopes off; the call's own
// cooldown stands.
// THE ART is what we have: the wolf is the pack's filmed wolf (js/wolves.js, its gait paced by the
// ground it covers), and she sits on its back in her own landing crouch (the absorb cell of her
// drawn land strip), bobbing with its stride and leaning into its leaps. No light round either.
// ===========================================================================
const WOLF_MOUNT = {
  stam: 100,          // the wolf's stamina
  drain: 2.2,         // per second of riding (about 45 s of an unhurt ride)
  hit: 24,            // a blow she takes while riding
  iT: 0.7,            // ...and the breath before the next can land
  spdK: 1.45,         // its run against hers
  jumpK: 1.22,        // its leap against her jump
  dashK: 1.4,         // its lunge against her dash
  dashDmg: 14,        // what the lunge's weight does to what it meets
  reach: 140,         // how close the called wolf must be for her to get on (it heels at 120)
  scratch: { cd: 0.45, t: 0.2, reach: 74, h: 40, dmg: 16 },
  howl: { cd: 6, r: 280, stun: 1.2, boss: 0.35, cost: 10 },
  size: 1.9,          // a wolf she can ride: the called wolf grows to carry her (its box; the art follows it)
  // its back, measured off the filmed wolf as drawn (tools: scratchpad measure): 1.9x its box
  // height above its feet standing or running, 0.74x above its middle in a leap (drawn centred)
  back: 1.88,
  backAir: 0.72,
  straddle: 16,       // px of her legs that hang down its flank: she sits ON it, astride, not stood on top
};
function wmLearned() { return !(typeof isHero === 'function' && isHero()) && !!(G.save && G.save.flags && G.save.flags.wolfMount); }
function wmRiding() { return !!(G.mount && G.mount.w && G.packWolf === G.mount.w); }
function wmWolfNear(p) {
  const w = G.packWolf;
  if (!w || w.leaveT > 0 || !wmLearned()) return null;
  return Math.abs(w.x + w.w / 2 - (p.x + p.w / 2)) < WOLF_MOUNT.reach && Math.abs(w.y + w.h - (p.y + p.h)) < 40 ? w : null;
}
// ON: she climbs on; the wolf stops hunting and carries her
function wmMount(p) {
  const w = G.packWolf; if (!w) return false;
  G.mount = { w, stam: WOLF_MOUNT.stam, scrT: 0, scrCD: 0, howlCD: 0, hitSet: null, lastVy: 0, dashB: false, bob: 0 };
  w.mounted = 1; w.coilT = 0; w.lungeT = 0; w.bit = null; w.hunt = 0;
  if (!w.w0) { w.w0 = w.w; w.h0 = w.h; }
  const foot = w.y + w.h; w.w = Math.round(w.w0 * WOLF_MOUNT.size); w.h = Math.round(w.h0 * WOLF_MOUNT.size); w.y = foot - w.h;
  p.x = w.x + w.w / 2 - p.w / 2; p.vx = 0;
  if (typeof sfx === 'function') sfx('alpha_bark');
  if (typeof burst === 'function') burst(p.x + p.w / 2, p.y + p.h, 8, '#b9a88a', 140, 0.4, 300, 2.2, true);
  if (G.save && G.save.flags && !G.save.flags.wmTold) { G.save.flags.wmTold = 1; G.toast(t('wm_how')); }
  return true;
}
// OFF: of her own will (a hop off its back) or thrown when it is spent (set down on her feet)
function wmDismount(p, spent) {
  const M = G.mount; if (!M) return;
  const w = M.w;
  G.mount = null;
  if (w) {
    w.mounted = 0;
    if (w.w0) { const foot = w.y + w.h; w.w = w.w0; w.h = w.h0; w.y = foot - w.h; }
    w.x = p.x + p.w / 2 - w.w / 2; w.y = p.y + p.h - w.h; w.vx = p.vx; w.vy = 0;
    // its time is up when it is spent: the lope away (packStep's own)
    if (spent) { w.t = 0; w.leaveT = PACK_CALL.leave; }
  }
  if (spent) {
    p.vy = -300; p.vx = -(p.face || 1) * 140; p.on = false; p.iT = Math.max(p.iT || 0, 0.8);
    if (typeof sfx === 'function') sfx('alpha_bark');
    G.toast(t('wm_tired'));
  } else { p.vy = -420; p.on = false; }
  // spent, the call waits its whole cooldown again (a ride can outlast the one it started with)
  const packArm = typeof ARMS !== 'undefined' && ARMS.find ? ARMS.find(a => a.id === 'pack') : null;
  p.armCD = Math.max(p.armCD || 0, spent ? ((packArm && packArm.cd) || 16) : 1.5);
}
// the claws' reach, in front of the wolf at the height of its forelegs — the drawn shape
function wmScratchBox(p) {
  const S = WOLF_MOUNT.scratch, w = G.mount.w, f = p.face || 1;
  const cx = w.x + w.w / 2, x0 = f > 0 ? cx + w.w * 0.2 : cx - w.w * 0.2 - S.reach;
  return { x: x0, y: w.y + w.h - S.h - 6, w: S.reach, h: S.h };
}
function wmFoes() {
  const out = (G.enemies || []).filter(e => e && !e.dead && !e.rescued && !e.calm && !(typeof isPet === 'function' && isPet(e))
    && !(typeof isWolf === 'function' && isWolf(e) && typeof packTamed === 'function' && packTamed()));
  if (G.boss && !G.boss.dead && !G.boss.purified && typeof bossActive === 'function' && bossActive()) out.push(G.boss);
  return out;
}
function wmHitFoe(q, dmg, dir, src) {
  const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
  const dm = Math.round(dmg * ((typeof DF === 'function' && DF().pdmg) || 1));
  dealDmg(q, dm, null, b.x + b.w / 2, b.y + b.h / 2, true, src);
  if (!(typeof Boss !== 'undefined' && q instanceof Boss) && q.kind !== 'turret') { q.kbT = Math.max(q.kbT || 0, 0.18); q.vx = (q.vx || 0) + dir * 220; q.vy = (q.vy || 0) - 80; }
  if (q.hp <= 0 && !q.dead && typeof q.die === 'function') q.die(dir, -0.3);
}
// THE HOWL: a recorded wolf; the machines near her stagger, a guardian only flinches
// where she is DRAWN while riding (her body box stays on the ground, under the wolf): its back,
// off the drawn body — stood on its feet on the ground, centred in a leap — bobbing with its stride
function wmSeatY(p) {
  const W = G.mount.w, run = Math.abs(p.vx) > 40 && p.on;
  const bob = run ? Math.abs(Math.sin((W._ph || W.anim * 6) * Math.PI)) * 3 : 0;
  const seat = W.on ? W.y + W.h - W.h * WOLF_MOUNT.back : W.y + W.h / 2 - W.h * WOLF_MOUNT.backAir;
  return seat + WOLF_MOUNT.straddle - p.h - bob;
}
function wmHowl(p) {
  const H = WOLF_MOUNT.howl, M = G.mount;
  M.howlCD = H.cd; M.stam = Math.max(1, M.stam - H.cost);
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
  if (inP('ATK') && M.scrCD <= 0) {
    M.scrT = S.t; M.scrCD = S.cd; M.hitSet = new Set();
    if (typeof sfx === 'function') sfx('alpha_claw');
  }
  if (inP('CAST') && M.howlCD <= 0) wmHowl(p);
  return true;
}
function wmPost(p, dt) {
  const M = G.mount, W = M.w;
  // its leap: the jump that just left the ground goes higher and further
  if (M.lastVy > -120 && p.vy < -JUMP_V * 0.9 && !p.on) { p.vy *= WOLF_MOUNT.jumpK; if (typeof sfx === 'function') sfx('alpha_leap'); }
  M.lastVy = p.vy;
  // its lunge: her dash, with its weight behind it — and what it runs into feels it
  if (p.dashT > 0) {
    if (!M.dashB) {
      M.dashB = true; p.dashVX = (p.dashVX || 0) * WOLF_MOUNT.dashK; M.lungeSet = new Set();
      // a wolf's lunge is weight, not light: none of her dash's ring, sparks or wake
      p.dashFx = null;
      if (typeof RIPPLES !== 'undefined') for (let i = RIPPLES.length - 1; i >= 0; i--) if (RIPPLES[i].col === '#8ff6ff' && RIPPLES[i].t <= 0.05) RIPPLES.splice(i, 1);
      if (typeof parts !== 'undefined') for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; if (q.life > q.life0 - 0.03 && /8ff6ff|ffffff/i.test(q.color || '')) parts.splice(i, 1); }
      if (typeof burst === 'function') burst(W.x + W.w / 2, W.y + W.h, 8, '#8a7a62', 160, 0.45, 500, 2.2, false);   // the earth it kicks off
    }
    // ...and no ghosts of her hung behind it
    p.dashTrailT = 1; if (p.trail) p.trail.length = 0;
    for (const q of wmFoes()) {
      if (M.lungeSet.has(q)) continue;
      const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
      if (aabb({ x: W.x - 10, y: W.y, w: W.w + 20, h: W.h }, b)) { M.lungeSet.add(q); wmHitFoe(q, WOLF_MOUNT.dashDmg, p.face || 1, 'mount'); }
    }
  } else M.dashB = false;
  // the scratch: the claws reach once, each foe once
  if (M.scrT > 0) {
    M.scrT -= dt;
    const box = wmScratchBox(p);
    for (const q of wmFoes()) {
      if (M.hitSet.has(q)) continue;
      const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
      if (aabb(box, b)) { M.hitSet.add(q); wmHitFoe(q, WOLF_MOUNT.scratch.dmg, p.face || 1, 'mount'); if (typeof sfx === 'function') sfx('wolf_bite'); }
    }
  }
  // it tires as it runs
  M.stam -= WOLF_MOUNT.drain * dt;
  // the wolf is under her: its body goes where hers does, its gait paced by the ground covered
  W.x = p.x + p.w / 2 - W.w / 2; W.y = p.y + p.h - W.h; W.vx = p.vx; W.vy = p.vy; W.on = p.on;
  W.dir = p.face || W.dir || 1; W.faceVis = W.dir; W.anim = (W.anim || 0) + dt; W.t = Math.max(W.t || 0, 1);
  W.airT = p.on ? 0 : (W.airT || 0) + dt;
  W.lungeT = M.scrT > 0 ? M.scrT : (p.dashT > 0 ? p.dashT : 0);
  if (M.stam <= 0) wmDismount(p, true);
}
// the stamina, near her cores: a short bar in the wolf's own fur, one word over it
function drawWolfMountHud() {
  const M = G.mount; if (!M || typeof c === 'undefined') return;
  const k = clamp(M.stam / WOLF_MOUNT.stam, 0, 1), x = 22, y = 104, w = 120, h = 8;
  c.save();
  c.fillStyle = 'rgba(4,8,12,0.7)'; rr(c, x - 3, y - 3, w + 6, h + 6, 5); c.fill();
  c.fillStyle = k < 0.25 ? '#c46b4a' : '#b9a88a'; rr(c, x, y, Math.max(2, w * k), h, 4); c.fill();
  ftxt(t('wm_wolf'), x, y - 9, 11, '#d8cdb8', 'left', 'rgba(0,0,0,0.7)', '700');
  c.restore();
}
// the prompt beside her called wolf: one word
function drawWolfMountPrompt(c2) {
  if (G.mount || !player || !wmWolfNear(player)) return;
  const w = G.packWolf;
  ftxt('▲ ' + t('wm_ride'), w.x + w.w / 2, w.y - 34, 12, '#eef3fa', 'center', 'rgba(0,0,0,0.75)', '700');
}
(function wmInstall() {
  if (typeof Player === 'undefined' || Player.prototype.__wm) return;
  Player.prototype.__wm = true;
  const U = Player.prototype.update, H = Player.prototype.hurt, D = Player.prototype.draw, S = Player.prototype.speed;
  Player.prototype.speed = function () { const v = S.call(this); return G.mount && this === player ? v * WOLF_MOUNT.spdK : v; };
  Player.prototype.update = function (dt) {
    // she gets on beside her called wolf (the interact key, or UP on the ground)
    if (!G.mount && this === player && G.state === 'PLAY' && !G.near && wmWolfNear(this) && (inP('INT') || (inP('UP') && this.on))) wmMount(this);
    if (!wmRiding() || this !== player) { if (G.mount && !wmRiding()) G.mount = null; return U.call(this, dt); }
    if (!wmPre(this, dt)) return U.call(this, dt);
    const r = U.call(this, dt);
    if (G.mount) wmPost(this, dt);
    return r;
  };
  // THE WOLF TAKES THE BLOWS while she rides
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
    // she sits ON its back in her landing crouch, bobbing with its stride, leaning into a leap
  Player.prototype.draw = function (c2) {
    if (!wmRiding() || this !== player) return D.call(this, c2);
    const keep = { y: this.y, vx: this.vx, on: this.on, landT: this.landT, land0: this.land0, dashT: this.dashT, hurtPoseT: this.hurtPoseT, swingVis: this.swingVis, skidT: this.skidT, takeoffT: this.takeoffT };
    this.y = wmSeatY(this);
    this.vx = 0; this.on = true; this.land0 = 0.12; this.landT = 0.12 * 0.62; this.dashT = 0; this.hurtPoseT = 0; this.swingVis = false; this.skidT = 0; this.takeoffT = 0;
    const lean = clamp(this.vy / 2600, -0.22, 0.22) * (this.face || 1);
    c2.save();
    const pivX = this.x + this.w / 2, pivY = this.y + this.h;
    c2.translate(pivX, pivY); c2.rotate(lean); c2.translate(-pivX, -pivY);
    let r;
    try { r = D.call(this, c2); } finally { c2.restore(); Object.assign(this, keep); }
    return r;
  };
})();
// ---- her words, five languages (measured by tests/text-budget.cjs as part of TEXT_LITE) -----
const WM_TEXT = {
  en: { wm_ride: 'Ride', wm_wolf: 'WOLF', wm_tired: 'Your wolf is spent.', wm_how: 'Attack: claws. Arm: howl. Down + jump: off.',
        wm_learn: 'RIDE THE PACK', wm_learnd: 'Call your wolf, then climb on beside it.',
        s_packup: 'The Pack, Longer', s_packupd: 'Your wolf stays longer and bites harder.', s_packup_wait: 'For the pack the Alpha gives.', s_packup_now: 'Your wolf stays longer now.',
        q_ask_patch_harness: ['A wolf that trusts you will carry you.', 'Let yours bring down three of my machines.'],
        q_goal_patch_harness: 'Your wolf downs %n machines', q_thanks_patch_harness: 'It fights for you. Here, its harness: ride.' },
  ar: { wm_ride: 'اركبي', wm_wolf: 'الذئب', wm_tired: 'ذئبكِ أُنهك.', wm_how: 'الهجوم: مخالب. الذراع: عواء. أسفل + قفز: نزول.',
        wm_learn: 'اركبي القطيع', wm_learnd: 'نادي ذئبكِ، ثم اركبي بجانبه.',
        s_packup: 'القطيع، أطول', s_packupd: 'يبقى ذئبكِ أطول ويعضّ أقوى.', s_packup_wait: 'للقطيع الذي يمنحه الألفا.', s_packup_now: 'ذئبكِ يبقى أطول الآن.',
        q_ask_patch_harness: ['الذئب الذي يثق بكِ سيحملكِ.', 'دعي ذئبكِ يُسقط ثلاثاً من آلاتي.'],
        q_goal_patch_harness: 'ذئبكِ يُسقط %n آلات', q_thanks_patch_harness: 'إنه يقاتل لأجلكِ. خذي لجامه: اركبي.' },
  tr: { wm_ride: 'Bin', wm_wolf: 'KURT', wm_tired: 'Kurdun tükendi.', wm_how: 'Saldırı: pençe. Kol: uluma. Aşağı + zıpla: in.',
        wm_learn: 'SÜRÜYÜ SÜR', wm_learnd: 'Kurdunu çağır, sonra yanında üstüne çık.',
        s_packup: 'Sürü, Daha Uzun', s_packupd: 'Kurdun daha uzun kalır, daha sert ısırır.', s_packup_wait: 'Alfa\'nın verdiği sürü için.', s_packup_now: 'Kurdun artık daha uzun kalıyor.',
        q_ask_patch_harness: ['Sana güvenen kurt seni taşır.', 'Seninki makinelerimden üçünü devirsin.'],
        q_goal_patch_harness: 'Kurdun %n makine devirsin', q_thanks_patch_harness: 'Senin için dövüşüyor. Al, koşum takımı: bin.' },
  zh: { wm_ride: '骑乘', wm_wolf: '狼', wm_tired: '你的狼累垮了。', wm_how: '攻击：爪击。战衣：嚎叫。下+跳：下来。',
        wm_learn: '驾驭狼群', wm_learnd: '召唤你的狼，在它身旁骑上去。',
        s_packup: '狼群·更久', s_packupd: '你的狼停留更久，咬得更狠。', s_packup_wait: '给头狼赠予的狼群。', s_packup_now: '你的狼现在停留更久。',
        q_ask_patch_harness: ['信任你的狼会驮着你。', '让你的狼撂倒我三台机器。'],
        q_goal_patch_harness: '你的狼撂倒 %n 台机器', q_thanks_patch_harness: '它为你而战。拿着，它的挽具：骑吧。' },
  ru: { wm_ride: 'Верхом', wm_wolf: 'ВОЛК', wm_tired: 'Твой волк выбился из сил.', wm_how: 'Атака: когти. Костюм: вой. Вниз + прыжок: слезть.',
        wm_learn: 'ВЕРХОМ НА СТАЕ', wm_learnd: 'Позови волка и сядь на него рядом.',
        s_packup: 'Стая, дольше', s_packupd: 'Твой волк держится дольше и кусает сильнее.', s_packup_wait: 'Для стаи, что даст Альфа.', s_packup_now: 'Теперь твой волк держится дольше.',
        q_ask_patch_harness: ['Волк, что верит тебе, тебя понесёт.', 'Пусть твой свалит три моих машины.'],
        q_goal_patch_harness: 'Твой волк валит машин: %n', q_thanks_patch_harness: 'Он бьётся за тебя. Вот его упряжь: садись.' },
};
if (typeof TEXT_LITE !== 'undefined') for (const L of Object.keys(WM_TEXT)) Object.assign(TEXT_LITE[L] = TEXT_LITE[L] || {}, WM_TEXT[L]);
