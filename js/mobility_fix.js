// Charged locomotion VFX. State selection and idle timing live in Player,
// not in monkey patches that temporarily rewrite simulation state.
(() => {
  if (typeof Player === 'undefined' || Player.prototype.__chargeEffectsInstalled) return;
  Player.prototype.__chargeEffectsInstalled = true;
  const draw = Player.prototype.draw;
  Player.prototype.draw = function(ctx) {
    const out = draw.call(this, ctx);
        if (this.chargeT > 0.25 && ctx && typeof ctx.save === 'function' && typeof G !== 'undefined' && G.state === 'PLAY') {
          const k = Math.min(1, (this.chargeT - 0.25) / 0.35);
          const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
          const cx = this.x + this.w / 2, cy = this.y + this.h * 0.48;
          const dir = this.face || 1;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.lineCap = 'round';
          const glow = (G.roomDef && typeof PAL !== 'undefined' && PAL[G.roomDef.zone] && PAL[G.roomDef.zone].glow) || '#37ffd0';
          ctx.shadowColor = glow; ctx.shadowBlur = 10 + 10 * k;
          ctx.strokeStyle = glow; ctx.lineWidth = 1.5 + 1.2 * k;
          ctx.globalAlpha = 0.38 + 0.34 * k;
          for (let i = 0; i < 3; i++) {
            const a = t * (3.2 + i * .55) + i * 2.1;
            const rx = 17 + i * 5 + k * 5, ry = 10 + i * 3 + k * 3;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, a * .18, a, a + 1.65);
            ctx.stroke();
          }
          // The charge is held FORWARD even while the legs run underneath it.
          const hx = cx + dir * (18 + 8 * k), hy = cy - 4 + Math.sin(t * 8) * 1.5;
          const g = ctx.createRadialGradient(hx, hy, 1, hx, hy, 9 + 6 * k);
          g.addColorStop(0, 'rgba(255,255,255,.95)');
          g.addColorStop(.28, glow);
          g.addColorStop(1, 'rgba(55,255,208,0)');
          ctx.fillStyle = g; ctx.globalAlpha = .78;
          ctx.beginPath(); ctx.arc(hx, hy, 9 + 6 * k, 0, Math.PI * 2); ctx.fill();
          // Motion ribbon makes a charged run/jump read as a charged MOVE, not
          // a normal gait with an unrelated circle pasted on top.
          if (Math.abs(this.vx || 0) > 34 || !this.on) {
            ctx.strokeStyle = glow; ctx.lineWidth = 2 + k; ctx.globalAlpha = .28 + .25 * k;
            ctx.beginPath();
            ctx.moveTo(cx - dir * 7, cy + 7);
            ctx.quadraticCurveTo(cx - dir * 23, cy + Math.sin(t * 7) * 5, cx - dir * (35 + Math.min(20, Math.abs(this.vx || 0) * .04)), cy + 2);
            ctx.stroke();
          }
          ctx.restore();
        }
    return out;
  };
})();
