// Mono integration services: no draw, clearP or findNear monkey patches.
// Called by the ordinary interaction resolver and NPC world-render pass.
function monoTarget() {
  if (!G || !['B3','B3B'].includes(G.roomId) || !player || player.dead) return null;
  return (G.statics || []).find(s => s.type === 'npc' && s.extra === 'mono') || null;
}
function monoNearTarget(xPad = 92, yPad = 96) {
  const s = monoTarget();
  if (!s) return null;
  const dx = player.x + player.w/2 - s.x - s.w/2;
  const dy = player.y + player.h/2 - s.y - s.h/2;
  return Math.abs(dx) <= xPad && Math.abs(dy) <= yPad ? s : null;
}
function drawMonoWorldAccent(ctx, s) {
  if (!s || s !== monoTarget()) return;
  // Absolute world coordinates: drawStatics already owns the camera transform;
  // presentWorld will project this once together with Mono and the floor.
  const atlas = typeof atlasOf === 'function' && atlasOf(s.extra);
  const k = atlas && atlas.sub[s.extra] ? atlas.sub[s.extra].k : 2;
  const height = s.h * k, cx = s.x + s.w/2, feet = s.y+s.h;
  ctx.save();
  try {
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(cx, feet-height*.48, 4, cx, feet-height*.48, Math.max(50,height*.7));
    glow.addColorStop(0,'rgba(125,235,255,.16)');
    glow.addColorStop(.45,'rgba(75,175,255,.10)');
    glow.addColorStop(1,'rgba(75,175,255,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(cx,feet-height*.48,Math.max(36,height*.42),height*.63,0,0,Math.PI*2);ctx.fill();
    if (G.state !== 'PLAY' || G.dialog || !monoNearTarget(130,120)) return;
    const bob=Math.sin(performance.now()/1000*4.2)*3;
    ctx.globalCompositeOperation='source-over';ctx.translate(cx,feet-height-20+bob);
    ctx.shadowColor='#73f7ff';ctx.shadowBlur=10;
    ctx.fillStyle='#0d1c26';ctx.strokeStyle='#73f7ff';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-9,-7);ctx.lineTo(9,-7);ctx.lineTo(9,4);ctx.lineTo(0,13);ctx.lineTo(-9,4);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#c9ffff';ctx.beginPath();ctx.arc(0,-1,2.4,0,Math.PI*2);ctx.fill();
  } finally { ctx.restore(); }
}
