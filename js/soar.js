// VOLT SOAR (handoff Part 2 B2) — CLAWBYTE's answer to Silksong's Silk Soar.
//
// UP + GRAPPLE with her feet on the ground fires the claw's winch into the
// pack instead of the cable: she launches STRAIGHT UP about six tiles, cutting
// whatever she passes for a fixed blow, and stops at the first ceiling. It is
// a late key: it opens vertical secrets the claw (eleven tiles, but it needs
// something to bite) and the double jump cannot, so it unlocks with the EMP
// module the Atlas guardian carries — two kingdoms after the claw itself.
//
// It rides the claw's own input and cooldown (js/grapple.js calls soarStep
// first and soarTry before a throw), so it adds no button, no touch seat and
// no pad binding: every platform has it the moment it has the claw.
const SOAR = {
  rise: 192,       // px: six tiles
  // px/s straight up — and NEVER more than a tile per simulation step: at
  // SIM_STEP (1/30 s) 980 px/s moved 32.7 px, the resolver checks the row the
  // head lands in, and a slow frame carried her through a two-tile roof
  speed: 900,
  carry: -220,     // vy she keeps at the top, so the arc rounds off instead of stopping dead
  dmg: 48,         // FIXED, four plain slashes (Silk Soar is 20 flat on a 5 needle)
  maxT: 0.4,       // s: never longer than this, whatever happens
  cd: 0.5,         // s before the claw or the soar again
};
function soarUnlocked() {
  return typeof grapUnlocked === 'function' && grapUnlocked() && !!(G.save && G.save.abil && (G.save.abil.soar || G.save.abil.emp));
}
// grapUpdate, before anything else: true while the soar owns her motion,
// null when there is no soar.
function soarStep(p, dt) {
  if (soarUnlocked() && G.save.flags && !G.save.flags.soarSeen) {
    G.save.flags.soarSeen = 1;
    if (G.toast) G.toast(t('soar_on'));
  }
  const s = p.soar;
  if (!s) return null;
  if (s.room !== G.roomId || (p.stunT || 0) > 0 || p.dead) { p.soar = null; return null; }
  s.t += dt;
  const risen = s.y0 - p.y;
  // the first ceiling: the resolver's own word for it (moveEnt's col.u,
  // kept by Player.update as lastCol) — not inferred from her not rising,
  // which a frame that steps twice read as rock in open air
  const bonked = s.t > 0 && !!(p.lastCol && p.lastCol.u);
  if (risen >= SOAR.rise || bonked || s.t >= SOAR.maxT) {
    p.vy = bonked ? 0 : SOAR.carry;
    s.end = bonked ? 'ceiling' : risen >= SOAR.rise ? 'height' : 'time';
    G.soarLast = { risen: Math.round(risen), end: s.end, hit: s.hit.length };
    if (bonked) { cam.shake = Math.max(cam.shake, 3); sfx('hit'); burst(p.x + p.w / 2, p.y, 8, '#cfe0f0', 180, 0.3, 200, 2, true); }
    p.soar = null;
    return false;
  }
  p.vx *= Math.pow(0.002, dt);
  p.vy = -SOAR.speed;
  // THE CUT: everything she passes, once each, for the fixed blow
  const box = { x: p.x - 8, y: p.y - 10, w: p.w + 16, h: p.h + 10 };
  const list = G.boss ? G.enemies.concat([G.boss]) : G.enemies;
  for (const e of list) {
    if (!e || e.dead || e.disabled || e.rescued || s.hit.indexOf(e) >= 0) continue;
    const hb = hurtBoxOf(e);
    if (!aabb(box, hb)) continue;
    s.hit.push(e);
    const dm = dealDmg(e, SOAR.dmg, null, hb.x + hb.w / 2, hb.y + hb.h / 2, true);
    s.dealt.push(dm);
    sfx(e instanceof Boss ? 'bosshit' : 'hit');
    G.hitStop = Math.max(G.hitStop || 0, 0.04);
    burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 12, '#fff2a8', 260, 0.3, 200, 2.6, true);
    if (typeof p.gainVolts === 'function') p.gainVolts(11);
    if (!(e instanceof Boss) && e.kind !== 'turret') { e.kbT = 0.3; e.vy = Math.min(e.vy || 0, 0) - 320; }
    if (e.hp <= 0 && typeof e.die === 'function') e.die(0, -1);
  }
  // the wake under her: the pack's exhaust, drawn as sparks
  if (chance(0.9)) addPart(p.x + p.w / 2 + rnd(-6, 6), p.y + p.h, rnd(-40, 40), rnd(80, 200), 0.3, '#ffd08a', 2.2, 0, true);
  return true;
}
// grapUpdate's fire branch, before a throw: true if the press became a soar.
function soarTry(p, ax, ay) {
  if (ay >= 0 || ax || !p.on || !soarUnlocked()) return false;
  p.soar = { t: 0, y0: p.y, room: G.roomId, hit: [], dealt: [] }; p.lastCol = null;
  p.on = false; p.vy = -SOAR.speed; p.dashT = 0; p.swing = null;
  p.grapCD = SOAR.cd;
  sfx('djump'); cam.shake = Math.max(cam.shake, 2);
  if (typeof padRumble === 'function') padRumble(0.35, 0.3, 90);
  burst(p.x + p.w / 2, p.y + p.h, 14, '#ffd08a', 260, 0.35, 300, 2.6, true);
  return true;
}

TEXT_LAYERS.push({
  en: { soar_on: 'VOLT SOAR online: hold UP and fire the claw on the ground to launch straight up.' },
  ar: { soar_on: 'الانطلاق الكهربائي جاهز: اضغط للأعلى وأطلق المخلب وأنت على الأرض لتنطلق عموديًا.' },
  tr: { soar_on: 'VOLT YÜKSELİŞİ hazır: yerdeyken YUKARI’yı tut ve pençeyi ateşle, dimdik fırla.' },
  zh: { soar_on: '电弧腾跃已就绪：站在地面上按住“上”并发射抓钩，即可垂直冲天。' },
  ru: { soar_on: 'ВОЛЬТ-ВЗЛЁТ готов: на земле зажмите ВВЕРХ и выпустите коготь — взлёт строго вверх.' },
});
