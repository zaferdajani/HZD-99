// CLAWBYTE — complete first-time tutorial enforcement
// Owner ruling 2026-09-10: no first-use instruction is allowed to become a
// vague suggestion. Approach cards point at the exact target; action cards
// freeze at the usable moment; unrelated gameplay input is rejected; the
// required action releases the lock and progression continues.
(() => {
  if (typeof G === 'undefined') return;

  const ACTIONS = new Set(['LEFT','RIGHT','UP','DOWN','JUMP','ATK','INT','HEAL','SKILL','MAP','PAUSE','BACK']);
  const MOVE_ACTIONS = new Set(['LEFT','RIGHT','JUMP','PAUSE','BACK']);
  let lastStepId = null;

  function step() {
    try { return G.tut && typeof TUT_STEPS !== 'undefined' ? TUT_STEPS[G.tut.i] : null; }
    catch (e) { return null; }
  }
  function promptFor(s) {
    try { return s && typeof tutPrompt === 'function' ? tutPrompt(s) : null; }
    catch (e) { return null; }
  }
  function pcx() { return player ? player.x + player.w / 2 : 0; }
  function pcy() { return player ? player.y + player.h / 2 : 0; }
  function targetNear(p, xPad = 78, yPad = 78) {
    if (!p || !p.target || !player) return false;
    return Math.abs(pcx() - p.target.x) <= xPad && Math.abs(pcy() - p.target.y) <= yPad;
  }
  function liveEnemy() {
    return (G.enemies || []).find(e => e && !e.dead && e.hp > 0) || null;
  }
  function enemyInRange() {
    const e = liveEnemy(); if (!e || !player) return false;
    return Math.abs((e.x + e.w/2) - pcx()) <= 68 && Math.abs((e.y + e.h/2) - pcy()) <= 58;
  }
  function injured() {
    return !!(player && typeof player.maxCores === 'function' && player.cores < player.maxCores());
  }
  function hasIQ() { return !!(G.save && G.save.iq > 0); }

  function actionFromPrompt(s, p) {
    if (!s) return null;
    // Strong semantic mapping first: these are the tutorial's actual verbs.
    if (s.id === 'jump') return 'JUMP';
    if (s.id === 'atk' || s.id === 'kill') return 'ATK';
    if (s.id === 'heal') return 'HEAL';
    if (s.id === 'skill') return 'SKILL';

    const ctl = p && String(p.control || p.keys || '').toUpperCase();
    if (ctl) {
      if (ctl.includes('↑') || /(^|\s)(UP|W)(\s|$)/.test(ctl)) return 'UP';
      if (ctl.includes('E') || ctl.includes('ENTER') || ctl.includes('INTERACT')) return 'INT';
      if (ctl.includes('X') || ctl.includes('ATK') || ctl.includes('ATTACK')) return 'ATK';
      if (ctl.includes('F') || ctl.includes('HEAL')) return 'HEAL';
      if (ctl.includes('T') || ctl.includes('SKILL')) return 'SKILL';
    }

    // Gate is an UP action even when its card is currently in approach mode.
    if (s.id === 'gate') return 'UP';
    return null;
  }

  function actionReady(s, p, action) {
    if (!s || G.state !== 'PLAY' || G.dialog || G.cut || G.gateWalk || !player) return false;
    if (s.id === 'jump') {
      try { if (typeof tutJumpAtObstacle === 'function') return tutJumpAtObstacle(); } catch(e) {}
      return false;
    }
    if (s.id === 'atk' || s.id === 'kill') return enemyInRange();
    if (s.id === 'heal') return injured();
    if (s.id === 'skill') return hasIQ();
    if (action === 'UP') {
      try { if (typeof gateHere === 'function' && gateHere()) return true; } catch(e) {}
      return targetNear(p, 72, 100);
    }
    if (action === 'INT') return !!G.near || targetNear(p, 72, 96);
    return false;
  }

  function freezeEnemies(on) {
    for (const e of (G.enemies || [])) {
      if (!e || e.dead) continue;
      if (on) {
        if (!e.__walkthroughFrozen) {
          e.__walkthroughFrozen = { update:e.update, vx:e.vx, vy:e.vy };
          if (typeof e.update === 'function') e.update = function(){};
        }
        e.vx = 0; e.vy = 0;
      } else if (e.__walkthroughFrozen) {
        if (e.__walkthroughFrozen.update) e.update = e.__walkthroughFrozen.update;
        e.vx = e.__walkthroughFrozen.vx || 0;
        e.vy = e.__walkthroughFrozen.vy || 0;
        delete e.__walkthroughFrozen;
      }
    }
  }

  function clearMovement() {
    const names = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','VL','VR','VU','VD','GP_L','GP_R','GP_U','GP_D'];
    for (const k of names) {
      try { if (typeof keys !== 'undefined') keys[k] = 0; } catch(e) {}
      try { if (typeof keysP !== 'undefined') keysP[k] = 0; } catch(e) {}
    }
  }

  function release() {
    freezeEnemies(false);
    if (G.walkthroughLock) G.walkthroughLock = null;
    // Also release the older lock layer so two systems never fight over x.
    if (G.tutHardLock && (!step() || G.tutHardLock.id !== step().id)) {
      try { if (typeof tutReleaseLock === 'function') tutReleaseLock(); else G.tutHardLock = null; } catch(e) { G.tutHardLock = null; }
    }
  }

  function engage(s, action) {
    if (!s || !player || !action) return;
    if (G.walkthroughLock && G.walkthroughLock.id === s.id && G.walkthroughLock.action === action) return;
    release();
    G.walkthroughLock = { id:s.id, action, x:player.x, y:player.y, on:!!player.on };
    player.vx = 0;
    if (player.on) player.vy = 0;
    clearMovement();
    freezeEnemies(true);
  }

  function tick() {
    const s = step();
    if (!s || !G.save || (G.save.flags && G.save.flags.tut)) { release(); lastStepId = null; return; }
    if (lastStepId !== s.id) { release(); lastStepId = s.id; }
    if (G.state !== 'PLAY') { freezeEnemies(false); return; }

    const p = promptFor(s);
    const action = actionFromPrompt(s, p);
    if (!G.walkthroughLock && action && actionReady(s, p, action)) engage(s, action);

    const L = G.walkthroughLock;
    if (L) {
      // A tutorial freeze is positional, not just velocity=0. This prevents a
      // held stick, step-up correction or previous-frame motion from slipping
      // the player past the teaching point while the card is visible.
      if (Number.isFinite(L.x)) player.x = L.x;
      player.vx = 0;
      if (L.on && player.on) player.vy = 0;
      freezeEnemies(true);
    }
  }

  // Dynamic input policy. While approaching a target, only navigation verbs
  // already learned are accepted. At an action point, only that exact action
  // (plus Pause/Back) is accepted. No attack-in-the-shop, early interaction,
  // heal mashing, skill mashing or gate skipping can satisfy another lesson.
  if (typeof tutAllows === 'function') {
    const baseAllows = tutAllows;
    tutAllows = function(a) {
      tick();
      const s = step();
      if (!s || !G.save || (G.save.flags && G.save.flags.tut)) return baseAllows(a);
      if (!ACTIONS.has(a)) return baseAllows(a);
      if (a === 'PAUSE' || a === 'BACK') return true;

      const L = G.walkthroughLock || G.tutHardLock;
      if (L && L.active !== false) return a === L.action;

      // MOVE is the first lesson: nothing except actual movement exists yet.
      if (s.id === 'move') return a === 'LEFT' || a === 'RIGHT';

      // Pure travel/collection/approach steps. Jump remains available only
      // because it was already taught and may be required by terrain.
      if (['out','coin','buy','node'].includes(s.id)) {
        const p = promptFor(s), action = actionFromPrompt(s, p);
        if (action && actionReady(s, p, action)) return a === action;
        return MOVE_ACTIONS.has(a);
      }

      // Before an action trigger, let the player approach but do not let them
      // fire the new verb early. Once ready, tick() has already hard-locked it.
      if (['jump','gate','atk','kill','heal','skill'].includes(s.id)) {
        if (s.id === 'heal' || s.id === 'skill') return false;
        return MOVE_ACTIONS.has(a);
      }
      return baseAllows(a);
    };
  }

  // Replace tutorial target circles with the game's mechanical arrow language.
  // The existing shop-specific arrow renderer is reused so all first-time
  // targets look like one coherent guidance system rather than mixed symbols.
  if (typeof drawTutor === 'function') {
    const baseDraw = drawTutor;
    drawTutor = function() {
      tick();
      const s = step();
      if (!s) return baseDraw();
      const p = promptFor(s);
      const oldSetDash = c.setLineDash.bind(c);
      const oldStroke = c.stroke.bind(c);
      let dashed = false;
      c.setLineDash = function(v) { dashed = !!(v && v.length); return oldSetDash(v); };
      c.stroke = function() { if (dashed) return; return oldStroke(); };
      try { baseDraw(); }
      finally { c.setLineDash = oldSetDash; c.stroke = oldStroke; try { oldSetDash([]); } catch(e) {} }

      if (p && p.target && typeof drawMechanicalTutorialArrow === 'function') {
        // The previous layer already draws the shop arrow. Avoid doubling it.
        let shop = false;
        try { shop = !!(typeof isFirstShopApproachPrompt === 'function' && isFirstShopApproachPrompt(s)); } catch(e) {}
        if (!shop) drawMechanicalTutorialArrow(p.target);
      }
    };
  }

  // Run once per frame even if no input is being polled. This catches a player
  // coasting into a trigger with a held key and guarantees immediate release
  // after the lesson advances.
  if (typeof clearP === 'function') {
    const baseClearP = clearP;
    clearP = function() { tick(); return baseClearP(); };
  }

  // Expose a tiny diagnostic for ?diag=1 and automated checks.
  window.__tutorialEnforcement = {
    step: () => { const s = step(); return s && s.id; },
    lock: () => G.walkthroughLock ? { ...G.walkthroughLock } : null,
    prompt: () => { const s = step(), p = promptFor(s); return p ? { label:p.label, hint:p.hint, control:p.control, target:p.target } : null; }
  };
})();
