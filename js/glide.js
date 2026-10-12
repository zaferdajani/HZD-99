// THE GLIDE (handoff Part 2 B3) — Silksong's Drifter's Cloak, in machine terms:
// hover jets. With the double jump spent, holding JUMP while falling caps her
// fall speed, so a drop becomes a distance and a pit becomes a choice.
//
// It needs no new input and no unlock of its own: it is what the jetpack does
// once its burst is used, so it arrives with the double jump (mod `djump`).
// The cap is tuned by feel (no Silksong value was measured): at 170 px/s a
// glide from the double jump's apex carries her about two and a half times the
// distance a plain fall does — far enough to matter, short of trivialising
// the gaps the double jump was meant to gate (tests/climbout.cjs reports
// every gate it opens).
const GLIDE = {
  fall: 170,       // px/s: the fall-speed cap while gliding
  steer: 0.85,     // her air speed while gliding, x normal: the jets hold her up, not forward
};
// Player.update, right after gravity: caps the fall, keeps the timer.
function glideStep(p, dt) {
  const can = !p.on && p.vy > 0 && hasMod('djump') && (p.airJumps || 0) <= 0
    && inD('JUMP') && !(p.dashT > 0) && !p.grap && !p.soar && !p.wallSlide && !p.dead
    && !G.bossEntry && !G.gateWalk && !G.wake;
  if (!can) { p.glideT = 0; return false; }
  p.vy = Math.min(p.vy, GLIDE.fall);
  const cap = p.speed() * GLIDE.steer;
  if (Math.abs(p.vx) > cap) p.vx = Math.sign(p.vx) * cap;
  p.glideT = (p.glideT || 0) + dt;
  if (p.glideT <= dt && G.save && G.save.flags && !G.save.flags.glideTold) {
    G.save.flags.glideTold = 1;
    if (G.toast) G.toast(t('glide_told'));
  }
  return true;
}
// After the double jump fires, once: the hint that the jets can hold her.
function glideHint() {
  if (G.save && G.save.flags && !G.save.flags.glideTold && !G.save.flags.glideHint && G.toast) {
    G.save.flags.glideHint = 1; G.toast(t('glide_hint'));
  }
}
// game.js, after she is drawn: the hover jets — two short cones under the pack,
// additive light (ART_BIBLE §0.0: the jets stay procedural), flickering.
function drawGlideJets(c, p) {
  if (!(p.glideT > 0) || p.dead) return;
  const k = Math.min(1, p.glideT / 0.12);
  const bx = p.x + p.w / 2 - (p.faceVis || p.face || 1) * 5, by = p.y + p.h * 0.5;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const off of [-4, 4]) {
    const len = (14 + Math.sin((G.time || 0) * 50 + off) * 3) * k;
    const g = c.createLinearGradient(bx + off, by, bx + off, by + len);
    g.addColorStop(0, 'rgba(255,240,200,0.9)');
    g.addColorStop(0.4, 'rgba(255,170,80,0.6)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(bx + off - 2.6, by); c.lineTo(bx + off + 2.6, by); c.lineTo(bx + off, by + len); c.closePath(); c.fill();
  }
  c.restore();
}

TEXT_LAYERS.push({
  en: { glide_hint: 'Keep holding JUMP as you fall: the jets will hold you up.', glide_told: 'GLIDE: holding JUMP after the double jump slows your fall.' },
  ar: { glide_hint: 'واصل الضغط على القفز أثناء السقوط: ستحملك النفاثات.', glide_told: 'انزلاق: الضغط على القفز بعد القفزة المزدوجة يبطئ سقوطك.' },
  tr: { glide_hint: 'Düşerken ZIPLA’yı basılı tut: jetler seni taşır.', glide_told: 'SÜZÜLME: çift zıplamadan sonra ZIPLA’yı basılı tutmak düşüşünü yavaşlatır.' },
  zh: { glide_hint: '下落时继续按住“跳”：喷射器会托住你。', glide_told: '滑翔：二段跳之后按住“跳”可以减缓下落。' },
  ru: { glide_hint: 'Держите ПРЫЖОК при падении — двигатели удержат вас.', glide_told: 'ПЛАНИРОВАНИЕ: удерживайте ПРЫЖОК после двойного прыжка, чтобы падать медленнее.' },
});
