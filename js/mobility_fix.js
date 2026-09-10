// CLAWBYTE — mobility continuity + impatient idle repair
// Owner ruling 2026-09-10:
// 1) a planted/crouched pose may never slide across the floor;
// 2) charging must preserve real locomotion while moving/jumping/falling;
// 3) the impatient stomp/Yalla beat starts only after five continuous seconds
//    of genuine inactivity, and any player action resets that patience clock.
(() => {
  const install = () => {
    if (typeof Player === 'undefined' || !Player.prototype || Player.prototype.__mobilityContinuityInstalled) return false;
    const P = Player.prototype;
    P.__mobilityContinuityInstalled = true;

    const baseState = P.heroState;
    if (typeof baseState === 'function') {
      P.heroState = function(run) {
        const moving = Math.abs(this.vx || 0) > 34;
        const airborne = !this.on;

        // A landing compression is an IMPACT, not a locomotion state. The old
        // priority kept returning `land` while horizontal physics continued,
        // so a crouched body visibly skated along the floor. The instant the
        // player is still holding movement, ask the normal state machine what
        // it would draw without the stale landing timer: rise into the gait.
        if (this.landT > 0 && moving && this.dashT <= 0 && !this.swingVis) {
          const keep = this.landT;
          this.landT = 0;
          const s = baseState.call(this, run);
          this.landT = keep;
          return s;
        }

        // Charge is an upper-body/combat intention, not a crouch that replaces
        // the legs. While travelling, use the already-authored locomotion art
        // (walk/run/rise/apex/fall) and let the charge energy layer below carry
        // the special-move read. Stationary charging keeps its dedicated brace.
        if (this.chargeT > 0 && (moving || airborne) && this.dashT <= 0 && !this.swingVis && this.swirlT <= 0) {
          const keep = this.chargeT;
          this.chargeT = 0;
          const s = baseState.call(this, run);
          this.chargeT = keep;
          return s;
        }
        return baseState.call(this, run);
      };
    }

    // The charge needs to remain visually unmistakable after its legs are
    // routed through locomotion art. This layer moves WITH the body: orbiting
    // machine arcs, a forward-held core and a trailing energy ribbon. No pose
    // translation, no fake crouch skating, and it works on ground and in air.
    const baseDraw = P.draw;
    if (typeof baseDraw === 'function') {
      P.draw = function(...args) {
        // Force the authored impatient fidget to own the body from five seconds
        // onward. We alter the timer only for drawing, never for simulation.
        const realIdle = this.idleT || 0;
        if (realIdle >= 5 && this.on && Math.abs(this.vx || 0) < 30 && !this.swingVis && this.dashT <= 0 && this.healT <= 0 && this.chargeT <= 0) {
          this.idleT = Math.max(realIdle, 999);
        }
        let out;
        try { out = baseDraw.apply(this, args); }
        finally { this.idleT = realIdle; }

        if (this.chargeT > 0.25 && typeof c !== 'undefined' && typeof G !== 'undefined' && G.state === 'PLAY') {
          const k = Math.min(1, (this.chargeT - 0.25) / 0.35);
          const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
          const cx = this.x + this.w / 2, cy = this.y + this.h * 0.48;
          const dir = this.face || 1;
          c.save();
          c.globalCompositeOperation = 'lighter';
          c.lineCap = 'round';
          const glow = (G.roomDef && typeof PAL !== 'undefined' && PAL[G.roomDef.zone] && PAL[G.roomDef.zone].glow) || '#37ffd0';
          c.shadowColor = glow; c.shadowBlur = 10 + 10 * k;
          c.strokeStyle = glow; c.lineWidth = 1.5 + 1.2 * k;
          c.globalAlpha = 0.38 + 0.34 * k;
          for (let i = 0; i < 3; i++) {
            const a = t * (3.2 + i * .55) + i * 2.1;
            const rx = 17 + i * 5 + k * 5, ry = 10 + i * 3 + k * 3;
            c.beginPath();
            c.ellipse(cx, cy, rx, ry, a * .18, a, a + 1.65);
            c.stroke();
          }
          // The charge is held FORWARD even while the legs run underneath it.
          const hx = cx + dir * (18 + 8 * k), hy = cy - 4 + Math.sin(t * 8) * 1.5;
          const g = c.createRadialGradient(hx, hy, 1, hx, hy, 9 + 6 * k);
          g.addColorStop(0, 'rgba(255,255,255,.95)');
          g.addColorStop(.28, glow);
          g.addColorStop(1, 'rgba(55,255,208,0)');
          c.fillStyle = g; c.globalAlpha = .78;
          c.beginPath(); c.arc(hx, hy, 9 + 6 * k, 0, Math.PI * 2); c.fill();
          // Motion ribbon makes a charged run/jump read as a charged MOVE, not
          // a normal gait with an unrelated circle pasted on top.
          if (Math.abs(this.vx || 0) > 34 || !this.on) {
            c.strokeStyle = glow; c.lineWidth = 2 + k; c.globalAlpha = .28 + .25 * k;
            c.beginPath();
            c.moveTo(cx - dir * 7, cy + 7);
            c.quadraticCurveTo(cx - dir * 23, cy + Math.sin(t * 7) * 5, cx - dir * (35 + Math.min(20, Math.abs(this.vx || 0) * .04)), cy + 2);
            c.stroke();
          }
          c.restore();
        }
        return out;
      };
    }

    const baseUpdate = P.update;
    if (typeof baseUpdate === 'function') {
      P.update = function(dt) {
        const out = baseUpdate.call(this, dt);
        const genuineIdle = G && G.state === 'PLAY' && this.on && Math.abs(this.vx || 0) < 30
          && Math.abs(this.vy || 0) < 1 && !this.swing && !this.swingVis && this.dashT <= 0
          && this.healT <= 0 && this.chargeT <= 0 && this.swirlT <= 0 && !G.dialog
          && !G.cut && !G.gateWalk && !G.bossEntry && !G.wake;

        if (!genuineIdle) {
          this.__yallaFiveDone = false;
        } else if ((this.idleT || 0) >= 5 && !this.__yallaFiveDone) {
          this.__yallaFiveDone = true;
          // Stop the older eleven-second scheduler from adding a second Yalla
          // immediately after this authored five-second impatience beat.
          this.yallaIn = 999;
          if (typeof hzdSay === 'function') hzdSay('yalla', 600);
        } else if (genuineIdle && this.__yallaFiveDone) {
          this.yallaIn = Math.max(this.yallaIn || 0, 998);
        }
        return out;
      };
    }

    // The repository's current hzd_yalla take is measurably below the rest of
    // her voice register (documented by hzdvox). Until the approved replacement
    // recording itself is present in the repo, lift ONLY this one playback into
    // the bottom of her established register instead of continuing to emit the
    // known-old bass take unchanged. This is deliberately isolated so dropping
    // the approved replacement asset later needs no state-machine change.
    if (typeof hzdSay === 'function' && typeof playBuf === 'function' && !window.__yallaRegisterGuard) {
      window.__yallaRegisterGuard = true;
      const oldSay = hzdSay;
      hzdSay = function(key, gapMs) {
        if (key !== 'yalla') return oldSay.apply(this, arguments);
        try {
          if (typeof narrativeAudioActive === 'function' && narrativeAudioActive()) return false;
          const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          if (typeof HZDT !== 'undefined' && now < HZDT) return false;
          if (typeof HZDT !== 'undefined') HZDT = now + Math.max(90, gapMs == null ? 90 : gapMs);
          // 216 Hz * 1.45 ~= 313 Hz: clears the project's 300 Hz register floor
          // without the chipmunk jump a full octave correction would create.
          return playBuf('hzd_yalla', 0.5, 1.45);
        } catch (e) { return oldSay.apply(this, arguments); }
      };
    }

    return true;
  };

  if (!install()) {
    let tries = 0;
    const timer = setInterval(() => {
      if (install() || ++tries > 300) clearInterval(timer);
    }, 20);
  }
})();
