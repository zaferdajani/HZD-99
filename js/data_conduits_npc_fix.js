// CLAWBYTE — Data Conduits NPC visibility + interaction repair
// Owner report 2026-09-10: Mono is hard to see and cannot be interacted with.
// This hotfix deliberately targets only the Data Conduits archivist NPC.
(() => {
  const isMono = o => !!(o && o.type === 'npc' && o.extra === 'mono');
  const mono = () => ((typeof G !== 'undefined' && G.statics) || []).find(isMono) || null;
  const inMonoRoom = () => typeof G !== 'undefined' && (G.roomId === 'B3B' || G.roomId === 'B3');

  function nearMono(m, xPad = 92, yPad = 96) {
    if (!m || typeof player === 'undefined' || !player) return false;
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    const mx = m.x + (m.w || 32) / 2, my = m.y + (m.h || 40) / 2;
    return Math.abs(px - mx) <= xPad && Math.abs(py - my) <= yPad;
  }

  // Interaction reliability: if the generic proximity resolver misses Mono,
  // return him explicitly once the hero is inside a sane conversational radius.
  try {
    if (typeof findNear === 'function' && !window.__monoFindNearFix) {
      window.__monoFindNearFix = true;
      const oldFindNear = findNear;
      findNear = function() {
        const got = oldFindNear.apply(this, arguments);
        if (got || !inMonoRoom()) return got;
        const m = mono();
        return nearMono(m) ? m : null;
      };
    }
  } catch (e) {}

  // Make sure keyboard/touch interaction sees the repaired target every frame,
  // even if another update path did not refresh G.near yet.
  try {
    if (typeof clearP === 'function' && !window.__monoNearTickFix) {
      window.__monoNearTickFix = true;
      const oldClearP = clearP;
      clearP = function() {
        if (inMonoRoom()) {
          const m = mono();
          if (m && nearMono(m) && (!G.near || isMono(G.near))) G.near = m;
        }
        return oldClearP.apply(this, arguments);
      };
    }
  } catch (e) {}

  // Visibility: Mono was dissolving into the blue/violet Data Conduits scene.
  // Draw a restrained local rim/ground light behind him, plus a tiny cyan
  // interaction beacon only while the player is within approach distance.
  // This preserves his authored sprite instead of replacing it with UI art.
  try {
    if (typeof draw === 'function' && !window.__monoVisibilityFix) {
      window.__monoVisibilityFix = true;
      const oldDraw = draw;
      draw = function() {
        if (inMonoRoom() && typeof c !== 'undefined' && typeof cam !== 'undefined') {
          const m = mono();
          if (m) {
            const cx = m.x + (m.w || 32) / 2 - cam.x;
            const feet = m.y + (m.h || 40) - cam.y;
            c.save();
            c.globalCompositeOperation = 'lighter';
            const g = c.createRadialGradient(cx, feet - 24, 4, cx, feet - 24, 62);
            g.addColorStop(0, 'rgba(125,235,255,.28)');
            g.addColorStop(.45, 'rgba(75,175,255,.16)');
            g.addColorStop(1, 'rgba(75,175,255,0)');
            c.fillStyle = g;
            c.beginPath(); c.ellipse(cx, feet - 24, 52, 66, 0, 0, Math.PI * 2); c.fill();
            c.restore();
          }
        }

        const out = oldDraw.apply(this, arguments);

        if (inMonoRoom() && typeof c !== 'undefined' && typeof cam !== 'undefined') {
          const m = mono();
          if (m) {
            const cx = m.x + (m.w || 32) / 2 - cam.x;
            const top = m.y - cam.y;
            const close = nearMono(m, 130, 120);
            if (close) {
              const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
              const bob = Math.sin(t * 4.2) * 3;
              c.save();
              c.translate(cx, top - 20 + bob);
              c.shadowColor = '#73f7ff'; c.shadowBlur = 10;
              c.fillStyle = '#0d1c26'; c.strokeStyle = '#73f7ff'; c.lineWidth = 2;
              c.beginPath(); c.moveTo(-9,-7); c.lineTo(9,-7); c.lineTo(9,4); c.lineTo(0,13); c.lineTo(-9,4); c.closePath(); c.fill(); c.stroke();
              c.fillStyle = '#c9ffff'; c.beginPath(); c.arc(0,-1,2.4,0,Math.PI*2); c.fill();
              c.restore();
            }
          }
        }
        return out;
      };
    }
  } catch (e) {}

  // Last-resort interaction guard: if the global interaction function is called
  // without a target in Mono's room but the hero is standing next to him, route
  // that press to Mono. This prevents a dead E/interact button caused by a stale
  // G.near value.
  try {
    if (typeof doInteract === 'function' && !window.__monoInteractGuard) {
      window.__monoInteractGuard = true;
      const oldInteract = doInteract;
      doInteract = function(target) {
        if (!target && inMonoRoom()) {
          const m = mono();
          if (nearMono(m)) target = m;
        }
        return oldInteract.call(this, target);
      };
    }
  } catch (e) {}
})();
