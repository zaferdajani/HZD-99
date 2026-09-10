// CLAWBYTE — Ratchet/shop interaction repair
// Owner report 2026-09-10: first NPC flow can trap the player in the market;
// controller Back does not reliably leave, Escape falls through to Pause, and
// the tutorial keeps the shop open after its one required purchase.
(() => {
  if (typeof G === 'undefined') return;

  const rawPressed = (codes) => {
    try {
      for (const k of codes) if ((typeof keysP !== 'undefined' && keysP[k]) || (typeof keys !== 'undefined' && keys[k])) return true;
    } catch (e) {}
    return false;
  };
  const BACK_CODES = ['Escape','VBACK','GP_BACK'];
  const OK_CODES = ['Enter','KeyZ','Space','VOK','GP_OK'];

  function clearCodes(codes) {
    for (const k of codes) {
      try { if (typeof keys !== 'undefined') keys[k] = 0; } catch(e) {}
      try { if (typeof keysP !== 'undefined') keysP[k] = 0; } catch(e) {}
    }
  }

  function leaveShop() {
    G.state = 'PLAY';
    G.dialog = null;
    G.shopExitGuardUntil = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 180;
    clearCodes(BACK_CODES.concat(OK_CODES));
    try { if (typeof sfx === 'function') sfx('ui'); } catch(e) {}
  }

  // Shop input must be able to leave even while a tutorial input filter is
  // active. inP('BACK') intentionally runs through tutAllows(); this raw check
  // is the emergency/navigation layer and therefore bypasses lesson filtering.
  if (typeof updateShop === 'function' && !updateShop.__ratchetExitFixed) {
    const base = updateShop;
    const fixed = function() {
      if (rawPressed(BACK_CODES)) { leaveShop(); return; }

      // The final OK used to page Ratchet's last dialogue could remain held for
      // the first shop frame, instantly opening/buying the selected market row.
      // Consume a short entry guard so the player sees the shop before choosing.
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (G.shopEntryGuardUntil && now < G.shopEntryGuardUntil) {
        clearCodes(OK_CODES);
        return;
      }

      const hadTutorialPurchase = !!(G.save && G.save.flags && G.save.flags.tutBuy);
      const out = base.apply(this, arguments);
      const hasTutorialPurchase = !!(G.save && G.save.flags && G.save.flags.tutBuy);

      // The first shop lesson is ONE purchase, not a prison. Once the volt cell
      // is bought, hand control back to gameplay immediately so the next lesson
      // (heal) can happen in-world. The old test had to force G.state='PLAY'
      // manually after updateShop(), which hid this production UX bug.
      if (!hadTutorialPurchase && hasTutorialPurchase && G.state === 'SHOP') leaveShop();
      return out;
    };
    fixed.__ratchetExitFixed = true;
    updateShop = fixed;
  }

  // Detect entry into SHOP from dialogue and arm the one-shot input guard. We
  // do this at the frame boundary rather than rewriting Ratchet's quest logic,
  // so normal later visits to the merchant still work.
  if (typeof clearP === 'function' && !clearP.__shopEntryGuardFixed) {
    const baseClear = clearP;
    let prevState = G.state;
    const wrapped = function() {
      const nowState = G.state;
      if (nowState === 'SHOP' && prevState !== 'SHOP') {
        G.shopEntryGuardUntil = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 220;
        clearCodes(OK_CODES);
      }
      prevState = nowState;
      return baseClear.apply(this, arguments);
    };
    wrapped.__shopEntryGuardFixed = true;
    clearP = wrapped;
  }

  // Tutorial enforcement previously treated the `buy` step as pure travel,
  // which could suppress OK/Interact at the exact screen where it is required.
  // Back must always remain a navigation escape; OK must exist while SHOP owns
  // the screen. Wrap the current policy last so this remains true regardless of
  // which enforcement layer installed before us.
  if (typeof tutAllows === 'function' && !tutAllows.__shopExitFixed) {
    const baseAllows = tutAllows;
    const wrappedAllows = function(a) {
      if (G && G.state === 'SHOP') {
        if (a === 'BACK' || a === 'PAUSE') return true;
        if (a === 'OK' || a === 'INT') return true;
      }
      return baseAllows(a);
    };
    wrappedAllows.__shopExitFixed = true;
    tutAllows = wrappedAllows;
  }

  window.__shopExitRepair = {
    leave: leaveShop,
    backCodes: BACK_CODES.slice(),
    tutorialPurchaseAutoExit: true
  };
})();
