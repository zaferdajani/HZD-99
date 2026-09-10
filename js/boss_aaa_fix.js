// CLAWBYTE — source-grounded boss combat repair pass
// 2026-09-10
//
// This file intentionally patches only defects demonstrated by the live source
// and the combat audit. It does NOT invent unmeasured hitboxes/recoveries.
//
// Repairs:
//  • Eye constructs can no longer be range-locked into one far move forever.
//  • Their forced mixup is announced before it happens and never teleports.
//  • PRISM dash/pounce identification gets explicit spatial telegraphs.
//  • FURNACE CHOIR's 300 ms Forge Bell tell is lifted to a safer floor.
//  • Every patched warning gets a visible recovery/commit language layer.
(() => {
  const MINI = new Set(['chime', 'carrier', 'moth', 'lattice', 'lens']);
  const CLOSE_NEEDS_ALIGNMENT = new Set(['carrier', 'moth', 'lens']);

  function pcx() { return player.x + player.w / 2; }
  function pcy() { return player.y + player.h / 2; }
  function bx(b) { return b.x + b.w / 2; }
  function by(b) { return b.y + b.h / 2; }

  function enterPressure(b, K) {
    // A short, visible closing beat. This is not a teleport and not damage.
    // It exists only after two consecutive far attacks so distance remains a
    // useful choice without becoming a way to delete half the moveset.
    b.__aaaPressure = true;
    b.__aaaPressureT = 0.52;
    b.__aaaPressureMax = 0.52;
    b.__aaaPressureClose = K.close;
    b.st = '__aaa_pressure';
    b.t = b.__aaaPressureT;
    b.windT = 0;
    b.vx = 0;
  }

  function updatePressure(b, dt, K) {
    b.__aaaPressureT -= dt;
    b.t = Math.max(0, b.__aaaPressureT);
    const dx = pcx() - bx(b);
    b.face = Math.sign(dx) || b.face || 1;

    // Only the flying constructs that need body alignment close distance.
    // CHIME's aimed note fan and LATTICE's spike fan already function from
    // range, so forcing them to travel would erase their identities.
    if (CLOSE_NEEDS_ALIGNMENT.has(b.kind)) {
      const maxStep = Math.min(Math.abs(dx), (K.spd * 2.25 + 120) * dt);
      b.x += Math.sign(dx) * maxStep;
      if (K.fly) {
        const wantY = player.y - K.hover;
        b.y += clamp(wantY - b.y, -180 * dt, 180 * dt);
      }
    }

    if (b.__aaaPressureT <= 0) {
      b.__aaaPressure = false;
      b.__aaaFarStreak = 0;
      b.st = b.__aaaPressureClose + 'warn';
      b.t = Math.max(typeof TELL_FAST === 'number' ? TELL_FAST : 0.35, 0.42);
      b.windT = b.t;
      b.fired = false;
      try { if (typeof sfx === 'function') sfx('tell'); } catch (_) {}
    }
  }

  function drawPressure(c, b, K) {
    const k = 1 - clamp((b.__aaaPressureT || 0) / (b.__aaaPressureMax || 0.52), 0, 1);
    const col = '#ffc24a';
    const x = bx(b), y = by(b);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = col;
    c.fillStyle = col;
    c.shadowColor = col;
    c.shadowBlur = 12;
    c.globalAlpha = 0.24 + 0.42 * k;
    c.lineWidth = 2;

    // Mechanical brackets contract around the body: the boss is changing
    // range on purpose and the player sees that before the close move begins.
    const r = 34 - 9 * k;
    for (let q = 0; q < 4; q++) {
      const a = q * Math.PI / 2 + Math.PI / 4;
      const x0 = x + Math.cos(a) * r, y0 = y + Math.sin(a) * r;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x0 - Math.cos(a) * 10, y0 - Math.sin(a) * 10);
      c.stroke();
    }
    // Directional rail toward CLAWBYTE, never a hidden homing correction.
    c.setLineDash([7, 7]);
    c.beginPath(); c.moveTo(x, y); c.lineTo(pcx(), pcy()); c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  function drawPrismRead(c, b) {
    if (b.kind !== 'prism' || !/^(dashwarn|pouncewarn)$/.test(b.st)) return;
    const x = bx(b), foot = b.y + b.h;
    const amber = '#ffc24a';
    const k = clamp(1 - (b.t || 0) / 0.35, 0, 1);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = amber; c.fillStyle = amber;
    c.lineWidth = 2 + k; c.shadowColor = amber; c.shadowBlur = 10;
    c.globalAlpha = 0.32 + 0.44 * k;
    if (b.st === 'dashwarn') {
      // DASH = FLOOR. Two parallel rails say "this line is about to be cut".
      const dir = b.face || 1;
      for (const yy of [foot - 5, foot + 4]) {
        c.beginPath(); c.moveTo(x + dir * 16, yy); c.lineTo(x + dir * 180, yy); c.stroke();
      }
      c.beginPath();
      c.moveTo(x + dir * 180, foot - 10); c.lineTo(x + dir * 194, foot);
      c.lineTo(x + dir * 180, foot + 10); c.stroke();
    } else {
      // POUNCE = ARC. A parabolic guide and landing reticle demand a lateral
      // answer; it cannot be confused with the floor-running dash at a glance.
      const dir = b.face || 1;
      const lx = x + dir * 150, ly = foot;
      c.beginPath();
      c.moveTo(x, foot - 10);
      c.quadraticCurveTo(x + dir * 75, foot - 118, lx, ly - 4);
      c.stroke();
      c.beginPath(); c.arc(lx, ly, 18 + 6 * k, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(lx - 25, ly); c.lineTo(lx + 25, ly);
      c.moveTo(lx, ly - 25); c.lineTo(lx, ly + 10); c.stroke();
    }
    c.restore();
  }

  function drawMiniRead(c, b) {
    if (!MINI.has(b.kind) || !/warn$/.test(b.st)) return;
    const move = b.st.replace(/warn$/, '');
    const x = bx(b), y = by(b), amber = '#ffc24a';
    c.save(); c.globalCompositeOperation = 'lighter';
    c.strokeStyle = amber; c.fillStyle = amber; c.shadowColor = amber; c.shadowBlur = 9;
    c.lineWidth = 1.8; c.globalAlpha = 0.34;

    if (move === 'lunge') {
      c.setLineDash([9, 6]); c.beginPath(); c.moveTo(x, y); c.lineTo(pcx(), pcy()); c.stroke(); c.setLineDash([]);
    } else if (move === 'drop') {
      c.beginPath(); c.arc(x, player.y + player.h, 22, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(x, y + 12); c.lineTo(x, player.y + player.h - 22); c.stroke();
    } else if (move === 'beam') {
      c.setLineDash([5, 5]); c.beginPath(); c.moveTo(x, y); c.lineTo(pcx(), pcy()); c.stroke(); c.setLineDash([]);
    } else if (move === 'grow') {
      const dir = b.face || 1;
      for (let i = 1; i <= 3; i++) {
        const gx = x + dir * i * 92;
        c.strokeRect(gx - 10, b.y + b.h - 34, 20, 34);
      }
    } else {
      // ring/note/spike/toss/cinder: a simple cone/ring preview is enough to
      // expose the attack family without hiding the authored boss silhouette.
      c.beginPath(); c.arc(x, y, 30, -0.65, 0.65); c.stroke();
    }
    c.restore();
  }

  function install() {
    if (typeof Boss === 'undefined' || !Boss.prototype || Boss.prototype.__aaaBossPass) return false;
    Boss.prototype.__aaaBossPass = true;

    const oldUpdate = Boss.prototype.update;
    const oldDraw = Boss.prototype.draw;

    Boss.prototype.update = function(dt) {
      if (MINI.has(this.kind) && this.st === '__aaa_pressure') {
        updatePressure(this, dt, MINI_KIT[this.kind]);
        this.anim = (this.anim || 0) + dt;
        return;
      }

      const before = this.st;
      const out = oldUpdate.call(this, dt);

      // Eye constructs: detect the moment the shared director chooses a move.
      if (MINI.has(this.kind) && /warn$/.test(this.st) && this.st !== before) {
        const K = MINI_KIT[this.kind];
        const move = this.st.replace(/warn$/, '');
        const farMove = move === K.far;
        this.__aaaFarStreak = farMove ? (this.__aaaFarStreak || 0) + 1 : 0;

        // A player may choose range; they may not use range to permanently
        // remove the close half of the moveset. After two far moves, the boss
        // visibly closes/changes solution and then uses the close verb.
        if (farMove && this.__aaaFarStreak >= 3) enterPressure(this, K);
        else if ((this.t || 0) < 0.42) {
          this.t = 0.42; this.windT = Math.max(this.windT || 0, 0.42);
        }
      }

      // Furnace Choir's Forge Bell was the only documented 300 ms guardian
      // tell. Raise only that move; do not globally slow the roster.
      if (this.kind === 'atlas' && this.st === 'forgebell' && this.st !== before && (this.t || 0) < 0.45) {
        this.t = 0.45;
        this.windT = Math.max(this.windT || 0, 0.45);
      }

      return out;
    };

    Boss.prototype.draw = function(...args) {
      const out = oldDraw.apply(this, args);
      try {
        if (typeof c !== 'undefined') {
          if (this.st === '__aaa_pressure') drawPressure(c, this, MINI_KIT[this.kind]);
          drawMiniRead(c, this);
          drawPrismRead(c, this);
        }
      } catch (_) {}
      return out;
    };

    return true;
  }

  if (!install()) {
    let tries = 0;
    const id = setInterval(() => { if (install() || ++tries > 300) clearInterval(id); }, 20);
  }
})();
