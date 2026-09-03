// ===========================================================================
// THE WARP — `?room=<id>` on either game page (owner's tool, 2026-09-03).
//
// The owner asked to be able to LOOK at a room without playing down to it.
// The Crystal Cache sits behind a guardian and two breakable walls, and
// "walk for an hour to see whether the new character reads" is not a review
// loop — it is the reason art gets reviewed once and then never again.
//
// FOUR THINGS KEEP IT FROM BEING A CHEAT CODE IN A SHIPPED GAME.
//
//   1. THE BASE GAME MUST NOT KNOW. With no `?room=` this file does nothing
//      at all — nothing wrapped, nothing shadowed, no cost, not one branch
//      taken. That is the rule js/packs.js is built to and the first thing
//      tests/warp.cjs measures.
//   2. IT IS LOCKED, with the lock that already exists. The Forge's
//      passphrase gate (js/editor.js) stamps `cb_forge_ok` into localStorage
//      when the owner opens the editor; a browser carrying that stamp may
//      warp, and so may a URL carrying the word itself (`&key=`), which is
//      what makes this usable on a phone the Forge has never been opened on.
//      The hash is repeated here rather than shared because editor.js is
//      compiled into forge*.html ONLY — the game pages have never seen it,
//      and pulling the whole editor into the game to reach one constant
//      would be the tail wagging the dog. Same door as the Forge, and the
//      same honest admission it makes about itself: a door, not a vault.
//   3. IT CANNOT EAT HIS RUN. The save key is swapped for the warp's own the
//      instant a warp actually starts — never before, or the title screen
//      would read the wrong slot and offer him no Continue.
//   4. IT DOES NOT TOUCH THE MENU. No wrapper on startGame: picking New Game
//      after a warp gives an ordinary new game, in his ordinary save.
//
// And it refuses OUT LOUD. A tool that silently does nothing when the lock
// is shut or the id is misspelt is a tool you debug instead of use.
// ===========================================================================
(function warpBoot() {
  let want = null, key = null;
  try {
    const q = new URLSearchParams(location.search);
    want = q.get('room'); key = q.get('key');
  } catch (e) { return; }
  if (!want) return;                          // the base game must not know
  if (!/^[A-Za-z0-9_]{1,12}$/.test(want)) return;

  const HASH = 'b094c73df45f79dd62879ff8c7a4816be4c785a842e784caa37c8fa3dfc875c4';
  const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');

  // A ROOM IS NOT A RECTANGLE OF FLOOR. Dropping her at the middle of the
  // room puts her inside a mound about as often as on top of one, and a body
  // that starts inside rock is a body the resolver has to shove somewhere.
  // So the spot is FOUND: from the middle outward, the first column with
  // standing room over solid ground — the question the room already answers
  // for every other body in it.
  function stand() {
    const W = G.roomDef.w, H = G.roomDef.h;
    for (let d = 0; d <= (W >> 1); d++) {
      for (const tx of (d ? [(W >> 1) - d, (W >> 1) + d] : [W >> 1])) {
        if (tx < 1 || tx >= W - 1) continue;
        for (let ty = H - 2; ty > 2; ty--) {
          if (!solidAt(tx, ty)) continue;
          if (solidAt(tx, ty - 1) || solidAt(tx, ty - 2)) continue;   // headroom
          return { x: tx * TILE + 2, y: (ty - 2) * TILE };
        }
      }
    }
    return { x: TILE * 2, y: TILE * 2 };
  }

  function go() {
    // the warp's own save slot, swapped HERE and not a moment earlier
    const _saveKeyFor = saveKeyFor;
    saveKeyFor = (theme) => _saveKeyFor(theme) + '_warp';
    const sv = newSave(1);
    // Everything open, because the point is to LOOK at a room rather than to
    // earn it: every power, every guardian answered — which is what makes the
    // grotto doors exist at all — both buried mouths dug out, and cells and
    // scrap to spend on whoever is standing in there.
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    sv.items = { batt: 3 };
    sv.scrap = 999;
    sv.time = 99;
    for (const f of ['tut', 'woke', 'bossGlitch', 'bossBrood', 'bossAtlas', 'bossZero',
                     'bossPrism', 'bossMother', 'alpha', 'crystal', 'crystal2',
                     'rubbleA5', 'rubbleCV1B']) sv.flags[f] = 1;
    sv.bench = { room: want, x: 96, y: 96 };
    startGame(sv);
    // ...AND IT DOES NOT OPEN ON A CUTSCENE. Setting every guardian flag is
    // what makes the grotto doors exist, and it is also five evolutions'
    // worth of growth arriving in one frame — so the warp landed inside the
    // evolution card, which is a fine thing to earn and a silly thing to
    // dismiss before you can look at a room. Her tier is adopted rather than
    // celebrated: checkEvo only speaks when the tier RISES past what the save
    // already knows.
    G.save.evo = evoTier(); G.save.evoCard = 0;
    if (G.roomId === want && player) {
      const s = stand();
      player.x = s.x; player.y = s.y; player.vx = 0; player.vy = 0;
      player.lastSafe = { x: player.x, y: player.y };
      updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
    }
    G.state = 'PLAY';
    G.wake = null; G.dialog = null; G.bossEntry = null; G.gateWalk = null;
    G.toast('WARP — ' + want);
  }

  function refuse(why) {
    // the page stays an ordinary session; it just says why it stayed one
    try { G.toast(why); } catch (e) {}
    try { console.warn('warp: ' + why); } catch (e) {}
  }

  // crypto.subtle is a promise and the page boots on a frame, so the warp
  // waits for both rather than racing either.
  (async () => {
    let ok = false;
    try { ok = localStorage.getItem('cb_forge_ok') === HASH; } catch (e) {}
    if (!ok && key) {
      try {
        ok = (await sha(key)) === HASH;
        // a good word remembers itself, exactly as opening the Forge does, so
        // it only has to go in the address bar once per device
        if (ok) localStorage.setItem('cb_forge_ok', HASH);
      } catch (e) {}
    }
    const ready = () => typeof startGame === 'function' && typeof ROOMS !== 'undefined'
                        && typeof G !== 'undefined' && !!G.toast;
    for (let i = 0; i < 600 && !ready(); i++) await new Promise((r) => requestAnimationFrame(r));
    if (!ready()) return;
    if (!ok) return refuse('warp refused — this browser has no Forge key');
    if (!ROOMS[want]) return refuse('warp — no room "' + want + '"');
    go();
  })();
})();
