// CLAWBYTE — media manager: CC0 image/audio assets (see assets/CREDITS.md)
// Multi-file mode loads from assets/…; the single-file build injects
// window.EMBEDDED_MEDIA with data: URIs and these paths are overridden.
const MEDIA_SRC = {
  images: {
    bgFar: 'assets/backgrounds/sci_fi_bg1.jpg',
    heroIdle: 'assets/characters/gothic-hero-idle.png',
    heroRun: 'assets/characters/gothic-hero-run.png',
    heroJump: 'assets/characters/gothic-hero-jump.webp',
    heroAtk: 'assets/characters/gothic-hero-attack.png',
    houndRun: 'assets/characters/hell-hound-run.webp',
    houndIdle: 'assets/characters/hell-hound-idle.png',
    ghost: 'assets/characters/ghost-idle.webp',
    skull: 'assets/characters/fire-skull.png',
    beast: 'assets/characters/hell-beast-idle.png',
    // NULLFANG'S MOVES, FILMED (ART_QUEUE §2ax): one continuous take per
    // move, cut to a strip, 320-px cells, feet on the cell floor, facing
    // LEFT like the rig. Drawn by beastStrip in js/beast.js over the state's
    // own clock; the parts rig draws whenever a strip is not here.
    beastGallop: 'assets/characters/beast/studio-gallop.webp',
    beastStudioSwipe: 'assets/characters/beast/studio-swipe.webp',
    beastStudioStalk: 'assets/characters/beast/studio-stalk.webp',
    beastStudioLeap: 'assets/characters/beast/studio-pounce.webp',
    beastStudioRoar: 'assets/characters/beast/studio-roar.webp',
    beastRearSwipe: 'assets/characters/beast/studio-rake.webp',
    beastStudioRear: 'assets/characters/beast/studio-rear.webp',   // up on his hind legs, two swats, the slam (2026-11-21)
    beastHurt: 'assets/characters/beast/studio-hurt.webp',
    // the turn (a planted pivot through the front, LEFT to RIGHT) and the
    // standing idle — filmed 2026-11-13 from the same standing frame
    beastStudioTurn: 'assets/characters/beast/studio-turn.webp',
    beastStudioIdle: 'assets/characters/beast/studio-idle.webp',
    beastFall: 'assets/characters/beast/fall.webp',
    demon: 'assets/characters/demon-idle.png',
    // pre-rendered 3D turnaround atlas: 11 subjects x 8 yaw angles
    roster: 'assets/characters/roster_8yaw.webp',
    // the second turnaround sheet: the six machine folk and the shield guard,
    // 6 yaw angles each, assembled by tools/turnsheet.cjs from two half-turns
    npcs: 'assets/characters/npc_6yaw.webp',
    // 3D-rendered zone vistas: 2 cols x 3 rows, A B / C D / E X
    zones: 'assets/backgrounds/zones_far.jpg',
    // the ROOF of each kingdom, rendered from directly below with real
    // overhangs, so a room has a top as well as a bottom. One plate per zone;
    // ceilTex() wraps and fades them, and ceilWeather() decides what drips off.
    ceilA: 'assets/backgrounds/ceil_a.jpg',
    ceilB: 'assets/backgrounds/ceil_b.jpg',
    ceilC: 'assets/backgrounds/ceil_c.jpg',
    ceilD: 'assets/backgrounds/ceil_d.jpg',
    ceilE: 'assets/backgrounds/ceil_e.jpg',
    ceilX: 'assets/backgrounds/ceil_x.jpg',
    // THE EYE'S CONSTRUCTS. Two plates each — at rest, and wound up — so the
    // wind-up is a different DRAWING and not the same drawing tinted, which is
    // the silhouette law applied to a class that has no rig to pose.
    // THE ALPHA'S MOVES, FILMED (ART_QUEUE §2ax, Kingdom 1): one take per
    // move, 320-px cells, feet on the cell floor, facing LEFT. Drawn by
    // drawAlpha in js/wolves.js over the state's own clock, and the Alpha's
    // only body: the nine still plates that once stood in were retired.
    wakeLamp: 'assets/characters/gear/wake_lamp.webp',
    alRest: 'assets/characters/alpha/rest.webp',
    alProwl: 'assets/characters/alpha/prowl.webp',
    alRoar: 'assets/characters/alpha/roar.webp',
    alHowl: 'assets/characters/alpha/howl.webp',
    alLeap: 'assets/characters/alpha/leap.webp',
    alAir: 'assets/characters/alpha/air.webp',
    alClaw: 'assets/characters/alpha/claw.webp',
    alBite: 'assets/characters/alpha/bite.webp',
    alClinch: 'assets/characters/alpha/clinch.webp',
    alYield: 'assets/characters/alpha/yield.webp',
    // ...and CHIME's four (same batch): the hover, the ring, the note, the fall
    chRest: 'assets/characters/chime/rest.webp',
    chRing: 'assets/characters/chime/ring.webp',
    chNote: 'assets/characters/chime/note.webp',
    chFall: 'assets/characters/chime/fall.webp',
    // the opening's two objects (js/opening.js opArt): Servo's spare cell and
    // the handful of scrap Ratchet pays for the repair
    spareCell: 'assets/characters/gear/spare_cell.webp',
    scrapPile: 'assets/characters/gear/scrap_pile.webp',
    eyeChime: 'assets/characters/eye/chime.webp',
    eyeChimeW: 'assets/characters/eye/chime_w.webp',
    eyeCarrier: 'assets/characters/eye/carrier.webp',
    eyeCarrierW: 'assets/characters/eye/carrier_w.webp',
    eyeMoth: 'assets/characters/eye/moth.webp',
    eyeMothW: 'assets/characters/eye/moth_w.webp',
    eyeLattice: 'assets/characters/eye/lattice.webp',
    eyeLatticeW: 'assets/characters/eye/lattice_w.webp',
    eyeLens: 'assets/characters/eye/lens.webp',
    eyeLensW: 'assets/characters/eye/lens_w.webp',
    // THE PACK, FILMED WHOLE (2026-10-09, the owner's new wolf design). Every
    // state is a strip cut from one Higgsfield take series off ONE start plate,
    // at ONE scale and ONE floor line (scratch tools2/fixcut.py), so a wolf
    // that goes from prowl to coil to bite to winded never changes size or
    // sinks. The older plates (wolf.webp, walk/run pairs, coil, lunge, the
    // first walk8/run6/winded6/land4) were a different animal and are deleted.
    wolfIdle6: 'assets/characters/beasts/wolf_idle6.webp',
    wolfProwl8: 'assets/characters/beasts/wolf_prowl8.webp',
    wolfGallop6: 'assets/characters/beasts/wolf_gallop6.webp',
    wolfCoil6: 'assets/characters/beasts/wolf_coil6.webp',
    wolfBite6: 'assets/characters/beasts/wolf_bite6.webp',
    wolfCrouch4: 'assets/characters/beasts/wolf_crouch4.webp',
    wolfLeap6: 'assets/characters/beasts/wolf_leap6.webp',
    wolfLanding4: 'assets/characters/beasts/wolf_landing4.webp',
    wolfRecoil6: 'assets/characters/beasts/wolf_recoil6.webp',
    wolfPant6: 'assets/characters/beasts/wolf_pant6.webp',
    wolfPurify6: 'assets/characters/beasts/wolf_purify6.webp',
    wolfSit6: 'assets/characters/beasts/wolf_sit6.webp',
    // THE AGGRESSIVE SET (2026-11-15, assets/source/beasts/wolf3/): the same
    // wolf re-filmed over real-wolf motion references — the threat display,
    // the lunge, the bite held and thrashed, the low snarl it holds at bay,
    // the roll when it is thrown, and the hunting stalk and charge. Same cell
    // scale and floor line as the set above (tools/fixcut.py).
    wolfSnarl8: 'assets/characters/beasts/wolf_snarl8.webp',
    wolfLunge6: 'assets/characters/beasts/wolf_lunge6.webp',
    wolfThrash8: 'assets/characters/beasts/wolf_thrash8.webp',
    wolfBay6: 'assets/characters/beasts/wolf_bay6.webp',
    wolfRoll12: 'assets/characters/beasts/wolf_roll12.webp',
    wolfStalk10: 'assets/characters/beasts/wolf_stalk10.webp',
    wolfCharge8: 'assets/characters/beasts/wolf_charge8.webp',
    cheetahWalk8: 'assets/characters/beasts/cheetah_walk8.webp',
    cheetahRun6: 'assets/characters/beasts/cheetah_run6.webp',
    cheetahWinded6: 'assets/characters/beasts/cheetah_winded6.webp',
    cheetahLand4: 'assets/characters/beasts/cheetah_land4.webp',
    // the cat folds down and lies there (ART_QUEUE §2bv): six beats of one take
    cheetahDown6: 'assets/characters/beasts/cheetah_down6.webp',
    // THE ROSTER'S WALKS AND THE MINI'S FLIGHT (ART_QUEUE §2cc-iv/v/vi): filmed
    // strides, every cell measured distinct before it was cut
    guardWalk8: 'assets/characters/roster/guard_walk8.webp',
    blobCrawl8: 'assets/characters/roster/blob_crawl8.webp',
    talonMiniCruise8: 'assets/characters/talon/cruise8.webp',
    talonMiniChase6: 'assets/characters/talon/chase6.webp',
    talonMiniPerch: 'assets/characters/talon/perch.webp',
    // THE FLORA. Two species per kingdom, generated in 3D and keyed off black,
    // so a room reads as somewhere that GROWS things rather than as a corridor
    // with a vista behind it. Fetched when she walks into the zone, never at
    // boot — see floraPreload().
    floraA1: 'assets/characters/flora/a1.webp',   // scrap-meadow bloom
    // NULLFANG'S COVER (js/nfcover.js): the metal banana clumps of his arena and the six
    // leaves the rig hangs in front of them (tools/nfcover.py, from assets/source/nfcover/)
    coverClumpA: 'assets/characters/cover/clump_a.webp',
    coverClumpB: 'assets/characters/cover/clump_b.webp',
    coverLeaf0: 'assets/characters/cover/leaf0.webp',
    coverLeaf1: 'assets/characters/cover/leaf1.webp',
    coverLeaf2: 'assets/characters/cover/leaf2.webp',
    coverLeaf3: 'assets/characters/cover/leaf3.webp',
    coverLeaf4: 'assets/characters/cover/leaf4.webp',
    coverLeaf5: 'assets/characters/cover/leaf5.webp',
    floraA2: 'assets/characters/flora/a2.webp',   // cable creeper
    floraB1: 'assets/characters/flora/b1.webp',   // conduit reed
    floraB2: 'assets/characters/flora/b2.webp',   // conduit fan
    floraC1: 'assets/characters/flora/c1.webp',   // foundry torch
    floraC2: 'assets/characters/flora/c2.webp',   // ember-grass
    floraD1: 'assets/characters/flora/d1.webp',   // archive frond
    floraD2: 'assets/characters/flora/d2.webp',   // ice spindle
    floraE1: 'assets/characters/flora/e1.webp',   // deep lantern
    floraE2: 'assets/characters/flora/e2.webp',   // deep coral
    floraX1: 'assets/characters/flora/x1.webp',   // prism lily
    floraX2: 'assets/characters/flora/x2.webp',   // prism thicket
    // THE THRUST BOOTS. The dash is a bolt-on, and this is the bolt-on: idle,
    // and at full burn under her while she crosses the gap.
    bootsIdle: 'assets/characters/gear/boots.webp',
    bootsFire: 'assets/characters/gear/boots_fire.webp',
    // THE SAVE POD, at the size a save point deserves. Dormant, and awake.
    pod: 'assets/characters/gear/pod.webp',
    podOn: 'assets/characters/gear/pod_on.webp',
    // THE CRADLE she wakes out of, still hooked and just released, and the
    // CITY GATES at the end of the walk. Both belong to the two rooms in front
    // of the meadow and are fetched only when she is standing in them.
    cradle: 'assets/characters/gear/cradle.webp',
    cradleOpen: 'assets/characters/gear/cradle_open.webp',
    gateCity: 'assets/backgrounds/gate_city.jpg',
    // THE CRYSTAL CAVE (§2c) — both sides of the rock, and the pillar. The
    // mouth and exit are full-bleed vistas (ROOM_VISTA A5 / CV1); the pillar
    // is a matted plate replacing the procedural light spears in drawStatics.
    caveMouth: 'assets/backgrounds/cave_mouth.jpg',
    caveExit: 'assets/backgrounds/cave_exit.jpg',
    pillarPlate: 'assets/characters/gear/pillar.webp',
    rawMarble: 'assets/characters/gear/raw_marble.png',
    // GATE SHAPES (§2f) — one monumental doorway per kingdom, no two the
    // same shape, and none of them a rectangle. The CITY gate is gate_city
    // above: the one epic multilayer monument, deliberately not re-fired.
    gateFoundry: 'assets/backgrounds/gate_foundry.jpg',
    gateArchives: 'assets/backgrounds/gate_archives.jpg',
    gateConduits: 'assets/backgrounds/gate_conduits.jpg',
    gateNest: 'assets/backgrounds/gate_nest.jpg',
    gateDeep: 'assets/backgrounds/gate_deep.jpg',
    // THE RING GATES — the machine ring every walk-in passage wears (drawRingGate,
    // js/game.js): a fired plate with a real hole in it, the live field drawn
    // behind it by the engine. Cut and measured by tools/ringgate.cjs.
    ringCave: 'assets/backgrounds/ring_cave.webp',
    ringDen: 'assets/backgrounds/ring_den.webp',
    ringMeadow: 'assets/backgrounds/ring_meadow.webp',
    ringQuarry: 'assets/backgrounds/ring_quarry.webp',
    // CAVE MOUTHS (§2f) — irregular rock openings, never doors, one material
    // family per grotto network, all sharing one composition so one anchor
    // rule covers the family.
    caveMouthA: 'assets/backgrounds/cave_mouth_a.jpg',
    caveMouthB: 'assets/backgrounds/cave_mouth_b.jpg',
    caveMouthC: 'assets/backgrounds/cave_mouth_c.jpg',
    caveMouthD: 'assets/backgrounds/cave_mouth_d.jpg',
    caveMouthE: 'assets/backgrounds/cave_mouth_e.jpg',
    // THE SAGE (§2e) — six authored states replacing drawSage's procedural
    // body at the same anchor. Amber on exactly the three telegraph states.
    sageStand: 'assets/characters/sage/stand.webp',
    // filmed walk + authored exhale (ART_QUEUE §2cc-vii), three-quarter LEFT
    sageWalk8: 'assets/characters/sage/walk8.webp',
    sageExhale: 'assets/characters/sage/exhale.webp',
    sageCoil: 'assets/characters/sage/coil.webp',
    sageLunge: 'assets/characters/sage/lunge.webp',
    sageGather: 'assets/characters/sage/gather.webp',
    sageLock: 'assets/characters/sage/lock.webp',
    sagePure: 'assets/characters/sage/pure.webp',
    // THE EYE'S AGENTS, EACH ITS OWN BODY (ART_QUEUE §2bu, fired 2026-11-17): the same
    // eight states as the set above, per agent — see AGENT_ART in js/sage-motion.js
    agTallyStand: 'assets/characters/agents/tally/stand.webp',
    agTallyWalk8: 'assets/characters/agents/tally/walk8.webp',
    agTallyExhale: 'assets/characters/agents/tally/exhale.webp',
    agTallyCoil: 'assets/characters/agents/tally/coil.webp',
    agTallyLunge: 'assets/characters/agents/tally/lunge.webp',
    agTallyGather: 'assets/characters/agents/tally/gather.webp',
    agTallyLock: 'assets/characters/agents/tally/lock.webp',
    agTallyPure: 'assets/characters/agents/tally/pure.webp',
    agTallyHitHigh: 'assets/characters/agents/tally/hithigh.webp',   // struck: head snapped back, arm flung
    agTallyHitLow: 'assets/characters/agents/tally/hitlow.webp',     // staggered: doubled round the abacus, a knee gone
    agLeashStand: 'assets/characters/agents/leash/stand.webp',
    agLeashWalk8: 'assets/characters/agents/leash/walk8.webp',
    agLeashExhale: 'assets/characters/agents/leash/exhale.webp',
    agLeashCoil: 'assets/characters/agents/leash/coil.webp',
    agLeashLunge: 'assets/characters/agents/leash/lunge.webp',
    agLeashGather: 'assets/characters/agents/leash/gather.webp',
    agLeashLock: 'assets/characters/agents/leash/lock.webp',
    agLeashPure: 'assets/characters/agents/leash/pure.webp',
    agUndertowStand: 'assets/characters/agents/undertow/stand.webp',
    agUndertowWalk8: 'assets/characters/agents/undertow/walk8.webp',
    agUndertowExhale: 'assets/characters/agents/undertow/exhale.webp',
    agUndertowCoil: 'assets/characters/agents/undertow/coil.webp',
    agUndertowLunge: 'assets/characters/agents/undertow/lunge.webp',
    agUndertowGather: 'assets/characters/agents/undertow/gather.webp',
    agUndertowLock: 'assets/characters/agents/undertow/lock.webp',
    agUndertowPure: 'assets/characters/agents/undertow/pure.webp',
    agSlagStand: 'assets/characters/agents/slag/stand.webp',
    agSlagWalk8: 'assets/characters/agents/slag/walk8.webp',
    agSlagExhale: 'assets/characters/agents/slag/exhale.webp',
    agSlagCoil: 'assets/characters/agents/slag/coil.webp',
    agSlagLunge: 'assets/characters/agents/slag/lunge.webp',
    agSlagGather: 'assets/characters/agents/slag/gather.webp',
    agSlagLock: 'assets/characters/agents/slag/lock.webp',
    agSlagPure: 'assets/characters/agents/slag/pure.webp',
    agRedactStand: 'assets/characters/agents/redact/stand.webp',
    agRedactWalk8: 'assets/characters/agents/redact/walk8.webp',
    agRedactExhale: 'assets/characters/agents/redact/exhale.webp',
    agRedactCoil: 'assets/characters/agents/redact/coil.webp',
    agRedactLunge: 'assets/characters/agents/redact/lunge.webp',
    agRedactGather: 'assets/characters/agents/redact/gather.webp',
    agRedactLock: 'assets/characters/agents/redact/lock.webp',
    agRedactPure: 'assets/characters/agents/redact/pure.webp',
    agLapidStand: 'assets/characters/agents/lapid/stand.webp',
    agLapidWalk8: 'assets/characters/agents/lapid/walk8.webp',
    agLapidExhale: 'assets/characters/agents/lapid/exhale.webp',
    agLapidCoil: 'assets/characters/agents/lapid/coil.webp',
    agLapidLunge: 'assets/characters/agents/lapid/lunge.webp',
    agLapidGather: 'assets/characters/agents/lapid/gather.webp',
    agLapidLock: 'assets/characters/agents/lapid/lock.webp',
    agLapidPure: 'assets/characters/agents/lapid/pure.webp',
    agPupilStand: 'assets/characters/agents/pupil/stand.webp',
    agPupilWalk8: 'assets/characters/agents/pupil/walk8.webp',
    agPupilExhale: 'assets/characters/agents/pupil/exhale.webp',
    agPupilCoil: 'assets/characters/agents/pupil/coil.webp',
    agPupilLunge: 'assets/characters/agents/pupil/lunge.webp',
    agPupilGather: 'assets/characters/agents/pupil/gather.webp',
    agPupilLock: 'assets/characters/agents/pupil/lock.webp',
    agPupilPure: 'assets/characters/agents/pupil/pure.webp',
    // THE ROBOT BAT (§2d) — five authored states replacing drawBat's
    // procedural body. hang is the only one with its optic dark.
    batHang: 'assets/characters/bat/hang.webp',
    batShiver: 'assets/characters/bat/shiver.webp',
    batDive: 'assets/characters/bat/dive.webp',
    batFlapUp: 'assets/characters/bat/flap_up.webp',
    batFlight6: 'assets/characters/bat/flight6.webp',     // one filmed wingbeat (§2cc-vii)
    batFlapDn: 'assets/characters/bat/flap_dn.webp',
    // THE ORACLE'S SHRINE + PARLOR (§2h) — the cable shrine standing in B3
    // (drawOracleBooth's hook was live before the plate) and the data-den
    // backdrop behind it (ROOM_VISTA B3B).
    oracleBooth: 'assets/backgrounds/oracle_booth.webp',
    oracleInterior: 'assets/backgrounds/oracle_interior.jpg',
    // THE BREAKER (§2i) — the Conduits' own machine in its three reads:
    // latched flat, fins flared (the tell), vents fallen open (the spend).
    breakerRest: 'assets/characters/breaker/rest.webp',
    breakerTell: 'assets/characters/breaker/tell.webp',
    breakerVented: 'assets/characters/breaker/vented.webp',
    // THE TRADER'S BOOTH AND DEN (§2g) — fired 2026-08-16, owner-approved.
    // ratchetResting is the art session's v2 — fired from his own npc_6yaw
    // row as reference, matted by Higgsfield rather than keyed (his shadowed
    // far leg defeats every threshold). Drawn at the A0B anchor while he is
    // a dark unit; the plate IS the powered-down read, so it skips the
    // grayscale treatment the other dark units get.
    // ===== THE ART SESSION'S 2026-08-16 BATCH ==========================
    // Every draw site below was already written and waiting on its key —
    // drawTinkerForge fetches forgeFront, and so
    // on — so these entries are what switch the authored art on. Lazy like
    // everything else; each renderer keeps its procedural fallback for the
    // frames before the file lands.
    //
    // §1c the back-jet gear: the pack as equipment. The plume is procedural
    // additive light (§0.0).
    jetpack: 'assets/characters/gear/jetpack.webp',
    // §2r the Tinker's bench — an object, not a vista.
    forgeTable: 'assets/backgrounds/forge_table.webp',
    // THE TOOLBOX on the den floor (owner, 2026-11-15): the box his battery is
    // in, shut with its light leaking out, and open and empty once she has it.
    // Two plates of ONE box, cut on one scale with one floor line and one right
    // edge (game.js drawDenToolbox draws them by width, not by height).
    denToolbox: 'assets/backgrounds/toolbox.webp',
    denToolboxOpen: 'assets/backgrounds/toolbox_open.webp',
    // THE MIND NODE as a monument (owner 2026-08-16: "it should be like a
    // monument, not a small object"). The plate only pays off once the node
    // itself moves out of the NPC's room.
    mindNode: 'assets/backgrounds/mindnode_obelisk.webp',
    // §2k / §2m / §2o — kingdoms 3, 4 and 5 get their doorways and dens.
    forgeFront: 'assets/backgrounds/forge_front.webp',
    forgeInterior: 'assets/backgrounds/forge_interior.jpg',
    carrelFront: 'assets/backgrounds/carrel_front.webp',
    carrelInterior: 'assets/backgrounds/carrel_interior.jpg',
    hollowFront: 'assets/backgrounds/hollow_front.webp',
    hollowInterior: 'assets/backgrounds/hollow_interior.jpg',
    // §2l / §2n / §2p — one machine per kingdom, three states each: at rest,
    // the tell, and spent. The tell is the pose; the amber wash is code.
    kilnRest: 'assets/characters/kiln/rest.webp',
    kilnTell: 'assets/characters/kiln/tell.webp',
    kilnSpent: 'assets/characters/kiln/spent.webp',
    rimeRest: 'assets/characters/rime/rest.webp',
    rimeTell: 'assets/characters/rime/tell.webp',
    rimeDark: 'assets/characters/rime/dark.webp',
    snareRest: 'assets/characters/snare/rest.webp',
    snareTell: 'assets/characters/snare/tell.webp',
    snareLimp: 'assets/characters/snare/limp.webp',
    // NPC DIALOGUE BUSTS, cut from npc_6yaw.png by tools/npcbusts.cjs. They
    // exist so drawDialog can show the SPEAKER's face instead of always
    // drawing HZD-99's (owner 2026-08-16).
    bustServo: 'assets/characters/npc/bust/servo.webp',
    bustRatchet: 'assets/characters/npc/bust/ratchet.webp',
    bustMono: 'assets/characters/npc/bust/mono.webp',
    bustPatch: 'assets/characters/npc/bust/patch.webp',
    bustSage: 'assets/characters/npc/bust/sage.webp',
    bustLumen: 'assets/characters/npc/bust/lumen.webp',
    bustKerf: 'assets/characters/npc/bust/kerf.webp',
    // ===================================================================
    // §2s TERRAIN DEPTH PLANES — fore_ crosses in front of her (drawDepthPlane,
    // 'fore' + zone). Only A and C have one; a zone without a plate draws
    // nothing, which is the same fallback every other plate takes.
    foreA: 'assets/backgrounds/fore_a.webp',
    foreC: 'assets/backgrounds/fore_c.webp',
    boothFront: 'assets/backgrounds/booth_front.webp',
    // THE KERF — kingdom X's structure, fired 2026-09-29 to ART_QUEUE §2aq's
    // brief. drawKerfStone has carried the mediaFetch hook and the procedural
    // fallback since the room was built; this is the plate it was waiting for.
    kerfFront: 'assets/backgrounds/kerf_front.webp',
    // ...and the inside of it: V1B, the one-room cutting shop (§2aq).
    // ROOM_VISTA.V1B, INDOOR_ART's floorKerf and INTERIOR_FIT have all pointed
    // here since the room was built.
    kerfInterior: 'assets/backgrounds/kerf_interior.jpg',
    // her work loop — THE CUT (§2aq), eight cells
    kerfLoop: 'assets/characters/npc/kerf/work_loop.webp',
    denInterior: 'assets/backgrounds/den_interior.jpg',
    ratchetResting: 'assets/characters/npc/ratchet_resting.webp',
    // THE TINKER AT WORK (owner, 2026-08-21: "give it a character... keep it
    // busy until I talk to it"). Ratchet stops being a standing atlas row and
    // becomes a PLATE SET: seven poses of one body, fired against
    // ratchet_resting.png so it is the same unit that was slumped in the
    // chair, and matted rather than keyed for the reason §2g already records.
    // The loop, the interruption and the fault are all in here; the smoke is
    // not, because additive light handed to a model comes back as a solid
    // object (art-prompts §0) and the vent is drawn in code over the plate.
    ratchetWork1: 'assets/characters/npc/ratchet/work_1.webp',
    ratchetWork2: 'assets/characters/npc/ratchet/work_2.webp',
    ratchetTic: 'assets/characters/npc/ratchet/tic.webp',
    ratchetNotice: 'assets/characters/npc/ratchet/notice.webp',
    ratchetTalk1: 'assets/characters/npc/ratchet/talk_1.webp',
    ratchetTalk2: 'assets/characters/npc/ratchet/talk_2.webp',
    ratchetVent: 'assets/characters/npc/ratchet/vent.webp',
    // THE WORK LOOP, 12 cells on one strip. The owner's report on the pose
    // set was 'looks as a slide show gif instead of a live machine doing its
    // work', and he was describing the arithmetic: seven stills held about a
    // second each is 1 fps. These twelve are frames of a generated clip of
    // this same body working, cut and keyed by tools/vidstrip.cjs — one
    // image, bottom-aligned, so the feet never move between cells.
    ratchetLoop: 'assets/characters/npc/ratchet/work_loop_six.webp',
    ratchetWristRelease: 'assets/characters/npc/ratchet/wrist_release.webp',
    yardWinchBase: 'assets/characters/props/winch/base.png',
    yardWinchArm: 'assets/characters/props/winch/arm.png',
    // ...AND THE SAME TREATMENT FOR EVERYONE ELSE STANDING IN A ROOM. The
    // trader was the first NPC the owner met and the first he called a slide
    // show; the other five were WORSE, because they were not a slide show at
    // all — they were ONE atlas cell with a procedural breathe on it, a
    // statue that swelled. Each of these is twelve frames of that same
    // machine doing its own job: the warden reads its console, the archivist
    // draws tape through its hands, the tinker welds, the orrery turns, the
    // nymph breathes light. Wired through NPC_LOOP in js/game.js, and lazy
    // like everything else — the atlas covers the frames before the strip
    // lands, exactly as it always did.
    // HER SWING, AS A MOVE. The attack cells claw_1/claw_2/finisher/burst are
    // POSES: heroState returns one of them and holds it for the whole 240 ms of
    // swingVis without ever reading swingVis.t, so her body is identical from
    // the first millisecond of a blow to the last and then snaps back. The
    // owner's report is that exact arithmetic — "three kind of hits with three
    // moves that changes from still to hit without transitions in between".
    //
    // These are six frames cut from a clip of that same body actually throwing
    // the blow: guard, wind-up, the SMEAR with the arm stretched long through
    // the arc, contact fully extended, follow-through, recovery. At 240 ms that
    // is 40 ms a frame, which is the "milliseconds from one frame to another"
    // he asked for.
    //
    // NO LIGHT IS BAKED IN. The first take came back with a glowing crescent
    // trailing the claw and it was refused for two reasons: the arc encircles
    // background the flood-fill key cannot reach from the border, so it keyed
    // with black halos around it; and the game already draws its own slash
    // sheets, which can react to the hit in a way a baked streak never will.
    // Light stays in code, the body stays in the plate (ART_BIBLE §0).
    swingDual: 'assets/characters/hero/swing/dual.webp',
    swingDualCharge: 'assets/characters/hero/swing/dual_charge.webp',
    swingDualFx: 'assets/characters/hero/swing/dual_fx.webp',
    swingJoined: 'assets/characters/hero/swing/joined.webp',
    heroJoinedProjectile: 'assets/characters/hero/swing/joined_projectile.webp',
    heroJoinedThrow: 'assets/characters/hero/swing/joined_throw.webp',
    swingSingle: 'assets/characters/hero/swing/single.webp',
    swingSingleCharge: 'assets/characters/hero/swing/single_charge.webp',
    swingSingleFx: 'assets/characters/hero/swing/single_fx.webp',
    swingClaw1: 'assets/characters/hero/swing/claw_1.webp',
    swingClawJab: 'assets/characters/hero/swing/claw_jab.webp',
    swingAir: 'assets/characters/hero/swing/air.webp',
    swingDown: 'assets/characters/hero/swing/down.webp',
    // the same dive with a blade in her paws (HERO_PLUNGE)
    swingDownSingle: 'assets/characters/hero/swing/down_single.webp',
    swingDownDual: 'assets/characters/hero/swing/down_dual.webp',
    swingDownJoined: 'assets/characters/hero/swing/down_joined.webp',
    swingClawChargeAlt: 'assets/characters/hero/swing/claw_charge_alt.webp',
    swingClawCharge: 'assets/characters/hero/swing/claw_charge.webp',
    // THE SUPERCHARGE'S ENERGY, as 19 drawn plates over the 12-cell body strip.
    // The two counts do not match and do not need to: both are sampled by the
    // swing's own progress, so the energy has its own cadence over the same
    // window. See HERO_BURST_FX in js/entities.js.
    swingBurstFx: 'assets/characters/hero/swing/burst_fx.webp',
    // THE SILT MIRE (js/conduits-road.js, js/mirejaw.js; owner, 2026-11-21):
    // its three paintings, the drain culvert that is its door, Bilge and his
    // raft, the insects, and MIREJAW's filmed takes (assets/source/swamp/)
    swampFar: 'assets/backgrounds/swamp_far.jpg',
    swampWallow: 'assets/backgrounds/swamp_wallow.jpg',
    swampOutfall: 'assets/backgrounds/swamp_outfall.jpg',
    culvertMouth: 'assets/characters/swamp/culvert.webp',
    // THE SEWER (js/sewer.js; owner, 2026-11-24): its three paintings, the floor
    // hatch, Rivet the pipe-smith, MIREJAW's shed skin and the shell made of it
    sewerGallery: 'assets/backgrounds/sewer_gallery.jpg',
    sewerTunnel: 'assets/backgrounds/sewer_tunnel.jpg',
    sewerCistern: 'assets/backgrounds/sewer_cistern.jpg',
    sewerHatch: 'assets/characters/sewer/hatch.webp',
    sewerSmithTalk: 'assets/characters/sewer/smith_talk.webp',
    sewerSmith: 'assets/characters/sewer/smith.webp',
    sewerSkin: 'assets/characters/sewer/skin.webp',
    sewerShellSide: 'assets/characters/sewer/shell_side.webp',
    sewerShellBack: 'assets/characters/sewer/shell_back.webp',
    raftPlate: 'assets/characters/swamp/raft.webp',
    bilgePole: 'assets/characters/swamp/bilge_pole.webp',
    bilgeTalk: 'assets/characters/swamp/bilge_talk.webp',
    dragonfly: 'assets/characters/swamp/dragonfly.webp',
    mosquito: 'assets/characters/swamp/mosquito.webp',
    mjIdle: 'assets/characters/croc/idle.webp',
    mjWalk: 'assets/characters/croc/walk.webp',
    mjSwim: 'assets/characters/croc/swim.webp',
    mjBite: 'assets/characters/croc/bite.webp',
    mjLeap: 'assets/characters/croc/leap.webp',
    mjRoll: 'assets/characters/croc/roll.webp',
    // the rest of his move set (docs/SPECIES_MOVESET.md, assets/movesets.json)
    mjRun: 'assets/characters/croc/run.webp', mjTurn: 'assets/characters/croc/turn.webp',
    mjNotice: 'assets/characters/croc/notice.webp', mjCrouch: 'assets/characters/croc/crouch.webp',
    mjLand: 'assets/characters/croc/land.webp', mjGape: 'assets/characters/croc/gape.webp',
    mjDaze: 'assets/characters/croc/daze.webp',
    // HER, caught at the waist in his jaws and spun in the death roll (per weapon tier)
    heroHeldBare: 'assets/characters/hero/held_roll_bare.webp', heroHeldSingle: 'assets/characters/hero/held_roll_single.webp',
    heroHeldDual: 'assets/characters/hero/held_roll_dual.webp', heroHeldJoined: 'assets/characters/hero/held_roll_joined.webp',
    mjTail: 'assets/characters/croc/tailslam.webp',
    mjBellow: 'assets/characters/croc/bellow.webp',
    mjHurt: 'assets/characters/croc/hurt.webp',
    mjDown: 'assets/characters/croc/down.webp',
    servoLoop: 'assets/characters/npc/servo/work_loop.webp',
    monoLoop: 'assets/characters/npc/mono/work_loop.webp',
    // the Oracle's plates (ART_QUEUE §2bv): powered down, and a talking pair
    monoResting: 'assets/characters/npc/mono/resting.webp',
    monoTalk1: 'assets/characters/npc/mono/talk_1.webp',
    monoTalk2: 'assets/characters/npc/mono/talk_2.webp',
    patchLoop: 'assets/characters/npc/patch/work_loop.webp',
    sageLoop: 'assets/characters/npc/sage/work_loop.webp',
    lumenLoop: 'assets/characters/npc/lumen/work_loop.webp',
    // HER OWN BACK — generated from her live body (assets/source/ref/), the
    // first authored plates of the hero herself. Two stride frames armed, two
    // unarmed (the sword becomes a pickup — task #78), and the sword waiting
    // on the ground. The full 8-yaw turnarounds live in assets/characters/
    // as hzd_8yaw.png / hzd_8yaw_bare.png for the atlas conversion.
    // HER BODY. One keyed, foot-aligned cell per state, assembled by
    // tools/herostates.cjs; HERO_CELL in entities.js indexes it by state name.
    // Lazy like everything else, and the procedural body draws until it lands —
    // which is the same arrangement NOSTOS's hero already uses (drawHeroSprite
    // first, drawHeroRig as the fallback), pointed at her for the first time.
    heroStates: 'assets/characters/hero/states.webp',
    // HER MOVES AS FILMED TAKES (ART_QUEUE §2aw, shipped 2026-09-05): the
    // walk and run cycles (HERO_GAIT), the standing idle loop (HERO_IDLE),
    // the knockback (HERO_TRANS.hurt), and the three punches that drive the
    // hit string (SWING_STRIP) — all facing the house three-quarter,
    // screen-right, except the idle which is a front view like the fidget.
    gaitWalk: 'assets/characters/hero/gait/walk.webp',
    gaitRun: 'assets/characters/hero/gait/run.webp',
    hzdIdle: 'assets/characters/hero/idle.webp',
    hzdHurt: 'assets/characters/hero/hurt.webp',
    // THE DEATH SEQUENCE (owner brief, 2026-09-14): three fired stills, same
    // treatment as HERO_AIR_STRIP's jump arc — stagger, buckle, and down.
    // The only state in her whole roster that shipped with zero art; see
    // HERO_DEATH_STRIP in entities.js for how G.deadT indexes into it.
    hzdDeath: 'assets/characters/hero/death.webp',
    // THE GUARD (owner sheet, 2026-09-15: BLOCK/GUARD row). One fired still,
    // same treatment as the charge pose; see HERO_TRANS.guard in entities.js.
    hzdGuard: 'assets/characters/hero/guard.webp',
    heroRecharge: 'assets/characters/hero/swing/recharge.webp',
    heroDeparture: 'assets/characters/hero/swing/departure.webp',
    swingUppercut: 'assets/characters/hero/swing/uppercut.webp',
    // HER FULL 8-YAW TURNAROUND — the sheet the back plates were bred from,
    // in the manifest at last because the gate walk turns her THROUGH it now:
    // profile (col 0/4), three-quarter back (col 5/3), full back (col 6).
    heroYaw: 'assets/characters/hzd_8yaw.webp',
    heroYawBare: 'assets/characters/hzd_8yaw_bare.webp',
    // THE IMPATIENT WAIT — 16 cells: 0-6 cross the arms, 7-15 bounce and tap.
    heroFidget: 'assets/characters/hero/fidget.webp',
    // SHE CROSSES HER ARMS AND TAPS HER FOOT (owner, 2026-11-14) — 8 cells, a
    // three-quarter view facing right: 0 settle · 1/3/5 toe up · 2/4 toe down ·
    // 6 toe down, eyes open at the player · 7 the same with an ear flicked.
    // The bout "yalla" is said over (HERO_IMPATIENT, js/entities.js).
    heroImpatient: 'assets/characters/hero/impatient.webp',
    // THE TRANSITION STRIPS (ART_QUEUE §2x, census order) — the in-betweens
    // the body was missing: the jump arc, the landing, the skid turn, the
    // wall slide, the dash. Each is a content-cut strip from a 5s take.
    transAir: 'assets/characters/hero/trans_air.webp',
    transLand: 'assets/characters/hero/trans_land.webp',
    transSkid: 'assets/characters/hero/trans_skid.webp',
    transWall: 'assets/characters/hero/trans_wall.webp',
    transDash: 'assets/characters/hero/trans_dash.webp',
    // The push off the ground, and the mend. Deliberately NOT in
    // HERO_MOTION_KEYS: that list gates PLAY on its contents having decoded, and
    // neither of these is on screen often enough to hold the game at a loading
    // bar for. Both fall through to the pose cell until they arrive.
    transTakeoff: 'assets/characters/hero/trans_takeoff.webp',
    hzdHeal: 'assets/characters/hero/heal.webp',
    // The heal's LIGHT, as five drawn plates rather than a stroked circle. It is
    // the one delivered sheet that is pure additive glow, which the art-prompts
    // skill flags as the thing generation gets wrong — but it got this one
    // right, and a bloom composites as light perfectly well when it is blended
    // as light. Drawn with 'lighter' over the body; the ring it replaces stays
    // as the fallback.
    hzdHealFx: 'assets/characters/hero/heal_fx.webp',
    // THE WALK-AWAY, AUTHORED (2026-09-15). Eight drawn cells: 0-3 are the TURN
    // from front-on to fully behind, 4-7 the back-view stride. The four back
    // plates below stay as the fallback — they are what drew this for months and
    // a browser that has them and not this should still see her back.
    heroGateWalk: 'assets/characters/hero/gate_walk.webp',
    // ...and the RUN-AWAY, for cave mouths. See GATE_CLIP in js/game.js.
    heroGateRun: 'assets/characters/hero/gate_run.webp',
    // ARMED, one per weapon tier — weaponMode() returns exactly these names, so
    // the clip she leaves the world in carries the blade she actually earned.
    heroGateSingle: 'assets/characters/hero/gate_walk_single.webp',
    heroGateDual:   'assets/characters/hero/gate_walk_dual.webp',
    heroGateJoined: 'assets/characters/hero/gate_walk_joined.webp',
    // the step up into a raised door, from behind, per weapon tier (js/game.js GATE_STEP)
    heroClimbBare: 'assets/characters/hero/gate_climb_bare.webp', heroClimbSingle: 'assets/characters/hero/gate_climb_single.webp',
    heroClimbDual: 'assets/characters/hero/gate_climb_dual.webp', heroClimbJoined: 'assets/characters/hero/gate_climb_joined.webp',
    // SHE OPENS THE SEWER HATCH (js/sewer.js): crouch, haul, push it over, hop, drop
    heroHatchBare: 'assets/characters/hero/hatch_bare.webp', heroHatchSingle: 'assets/characters/hero/hatch_single.webp',
    heroHatchDual: 'assets/characters/hero/hatch_dual.webp', heroHatchJoined: 'assets/characters/hero/hatch_joined.webp',
    heroHopBare: 'assets/characters/hero/gate_hop_bare.webp', heroHopSingle: 'assets/characters/hero/gate_hop_single.webp',
    heroHopDual: 'assets/characters/hero/gate_hop_dual.webp', heroHopJoined: 'assets/characters/hero/gate_hop_joined.webp',
    heroBackA: 'assets/characters/hero/backwalk_a.webp',
    heroBackB: 'assets/characters/hero/backwalk_b.webp',
    heroBareBackA: 'assets/characters/hero/bare_bwalk_a.webp',
    heroBareBackB: 'assets/characters/hero/bare_bwalk_b.webp',
    // THE CHEETAH LINE — the second animal, for the kingdoms past the meadow.
    // No alpha, nothing to tame: these came off the same line as the wolves and
    // whatever was in them is gone. Same grammar as the wolf.
    cheetahRest: 'assets/characters/beasts/cheetah.webp',
    cheetahWarn: 'assets/characters/beasts/cheetah_warn.webp',
    cheetahRun: 'assets/characters/beasts/cheetah_run.webp',
    // (the §2r forge table and the Mind Node monument are registered in the
    // fired-plates section above — this comment marks the dedupe.)
    // THE LAIRS. One authored prop per guardian, keyed off its generation
    // plate's black field by tools/blackkey.cjs, so each has real alpha and
    // occludes the room properly. Lazy like everything else: a lair is only
    // ever fetched when you are standing in the arena that has it.
    lairDen: 'assets/backgrounds/lair_den.webp',        // NULLFANG    — scrap den
    lairNest: 'assets/backgrounds/lair_nest.webp',      // TALONHOST   — mast nest
    lairForge: 'assets/backgrounds/lair_forge.webp',    // FURNACE     — the crucible
    lairPeak: 'assets/backgrounds/lair_peak.webp',      // GLACIERE    — ice over a frozen spring
    lairVault: 'assets/backgrounds/lair_vault.webp',    // PRISM       — geode shelf
    lairCradle: 'assets/backgrounds/lair_cradle.webp',  // MOTHER-V    — fibre cradle
    // full-frame futuristic vistas (newer set; the gloomy atlas stays for later)
    vistaCity: 'assets/backgrounds/vista_city.jpg',
    vistaCrystal: 'assets/backgrounds/vista_crystal.jpg',
    // the first boss: virus-infected robot beast, parts atlas for the cutout rig
    beastParts: 'assets/characters/beast_parts.webp',
    // boss 01: virus-infected robot eagle, parts atlas for the cutout rig
    eagleParts: 'assets/characters/eagle_parts.webp',
    // the frost boss: GLACIERE, corrupted unicorn — figures, parts and fx
    glaciereParts: 'assets/characters/glaciere_parts.webp',
    // the forge boss: FURNACE CHOIR, corrupted mecha dragon — poses, parts,
    // the glow core and the lava ring
    dragonParts: 'assets/characters/dragon_parts.webp',
    // the crystal boss: PRISM PROWLER, authored pose atlas. Unlike the other
    // guardians this sheet carries BOTH halves of the character — the virus-lit
    // red cat it became, and the clear blue cat underneath it
    prismParts: 'assets/characters/prism_parts.webp',
    motherParts: 'assets/characters/mother_parts.webp',
    // HZD-99's claw arc, painted as glowing light on pure black so it can be
    // composited additively with no alpha channel to cut
    slashFx: 'assets/fx/slash.webp',
    // THE GRASS: a CC0 painted card (para, OpenGameArt), tinted per kingdom by tools/grasstint.py,
    // drawn as columns that bend when a body walks through them (js/grass.js)
    grassMeadow: 'assets/fx/grass/grass_meadow.webp',
    grassFrond: 'assets/fx/grass/grass_frond.webp',
    // the bosses' attacks, generated and drawn as light (js/bossvfx.js, tools/vfxstrip.py)
    bvfx_agent_bolt: 'assets/fx/boss/agent_bolt.webp',
    bvfx_agent_burst: 'assets/fx/boss/agent_burst.webp',
    bvfx_agent_pillar: 'assets/fx/boss/agent_pillar.webp',
    bvfx_agent_slash: 'assets/fx/boss/agent_slash.webp',
    bvfx_agent_wave: 'assets/fx/boss/agent_wave.webp',
    bvfx_nf_shock: 'assets/fx/boss/nf_shock.webp',
    bvfx_nf_bolt: 'assets/fx/boss/nf_bolt.webp',
    bvfx_nf_claw: 'assets/fx/boss/nf_claw.webp',
    bvfx_nf_burst: 'assets/fx/boss/nf_burst.webp',
    bvfx_alpha_bite: 'assets/fx/boss/alpha_bite.webp',
    bvfx_alpha_land: 'assets/fx/boss/alpha_land.webp',
    bvfx_chime_shard: 'assets/fx/boss/chime_shard.webp',
    bvfx_chime_burst: 'assets/fx/boss/chime_burst.webp',
    // THE ROCK, drawn. One slab per kingdom, and every solid tile in the game —
    // floor, wall, ceiling — is cut from it, so these six files are the whole
    // world's surface. Lazy like everything else: js/game.js bakes its
    // procedural slab until the plate lands and swaps to the plate when it does.
    rockA: 'assets/backgrounds/rock_a.jpg',
    rockB: 'assets/backgrounds/rock_b.jpg',
    rockC: 'assets/backgrounds/rock_c.jpg',
    rockD: 'assets/backgrounds/rock_d.jpg',
    rockE: 'assets/backgrounds/rock_e.jpg',
    rockX: 'assets/backgrounds/rock_x.jpg',
    // authored STRATA: four platform decks (clean / virus-grown / forge /
    // frozen) cut from the owner's sheet, and the four scene bands behind them
    platforms: 'assets/tiles/platforms.webp',
    // PLATFORMS AS OBJECTS (ART_QUEUE §2bt): three whole decks a zone, cut by tools/platobj.cjs
    platObjA: 'assets/tiles/platobj_a.webp',
    platObjX: 'assets/tiles/platobj_x.webp',
    platObjB: 'assets/tiles/platobj_b.webp',
    strataRubble: 'assets/backgrounds/strata_rubble.jpg',
    strataLava: 'assets/backgrounds/strata_lava.jpg',
    strataIceB: 'assets/backgrounds/strata_iceB.jpg',
    // ONE FRAME LIFTED FROM EACH SHOT OF THE OPENING FILM. A browser that
    // cannot decode the video still gets the same eight images in the same
    // order, so the story is never replaced by a different one.
    introS1: 'assets/intro/intro1.jpg',
    introS2: 'assets/intro/intro2.jpg',
    introS3: 'assets/intro/intro3.jpg',
    introS4: 'assets/intro/intro4.jpg',
    introS5: 'assets/intro/intro5.jpg',
    introS6: 'assets/intro/intro6.jpg',
    introS7: 'assets/intro/intro7.jpg',
    introS8: 'assets/intro/intro8.jpg',
  },
  // Music is STREAMED, never decoded. decodeAudioData turns a 2 MB ogg into
  // ~60 MB of raw float PCM and holds it in RAM for the whole session — on a
  // phone that is the single most expensive thing this game did.
  // Anything in assets/music/ is available under its own basename: the build
  // scans the directory and hands the list over, so a new score is turned on by
  // dropping the file in and rebuilding. Nothing here ever names a file that is
  // not on disk — a missing stream would start an <audio> that silently never
  // plays instead of falling back to the synth score.
  stream: Object.assign({
  }, (typeof window !== 'undefined' && window.MUS_FILES) || {}),
  // STREAMED, NEVER DECODED — the same ruling the eighteen spoken lines got.
  // These two are ten seconds each: as decoded PCM they are a third of every
  // sound effect in the game put together, for a quote that plays at a tier-up
  // and at a guardian's death and is never heard twice in a row. They are NOT
  // in `audio` below on purpose: loadMedia decodes everything in that map.
  // A ROOM'S AIR: long recorded beds, STREAMED and looped by ambPlay (audio.js),
  // never decoded — forty-odd seconds held as PCM is megabytes a room
  amb: {
    k2_amb: 'assets/sfx/swamp/k2_amb.ogg',
    sw_amb: 'assets/sfx/sewer/sw_amb.ogg',
  },
  sting: {
    hz_evosting: 'assets/sfx/hz_evosting.ogg',
    hz_winsting: 'assets/sfx/hz_winsting.ogg',
  },
  audio: {
    // THE ALPHA'S OWN VOICE (owner, 2026-11-20: "It sounds like I'm listening
    // to piano or electric ... instead of an actual animalistic, wolf-like
    // howlings"). The howl and the far howl are real wolves — public-domain
    // National Park Service recordings (Denali; Yellowstone, a pack) — and the
    // rest are generated wolf recordings (Higgsfield). assets/source/audio/alpha.
    // STRUCK METAL, MANY VOICES (owner, 2026-11-20: "multiple metallic hitting
    // sounds for more diversities ... for different enemies and bosses"): three
    // takes of each body's impact, CC0 (Kenney, Impact Sounds) — audio.js HIT_BANK
    hk_metal_light_0: 'assets/sfx/hits/metal_light_0.ogg',
    hk_metal_light_1: 'assets/sfx/hits/metal_light_1.ogg',
    hk_metal_light_2: 'assets/sfx/hits/metal_light_2.ogg',
    hk_metal_medium_0: 'assets/sfx/hits/metal_medium_0.ogg',
    hk_metal_medium_1: 'assets/sfx/hits/metal_medium_1.ogg',
    hk_metal_medium_2: 'assets/sfx/hits/metal_medium_2.ogg',
    hk_metal_heavy_0: 'assets/sfx/hits/metal_heavy_0.ogg',
    hk_metal_heavy_1: 'assets/sfx/hits/metal_heavy_1.ogg',
    hk_metal_heavy_2: 'assets/sfx/hits/metal_heavy_2.ogg',
    hk_plate_light_0: 'assets/sfx/hits/plate_light_0.ogg',
    hk_plate_light_1: 'assets/sfx/hits/plate_light_1.ogg',
    hk_plate_light_2: 'assets/sfx/hits/plate_light_2.ogg',
    hk_plate_medium_0: 'assets/sfx/hits/plate_medium_0.ogg',
    hk_plate_medium_1: 'assets/sfx/hits/plate_medium_1.ogg',
    hk_plate_medium_2: 'assets/sfx/hits/plate_medium_2.ogg',
    hk_plate_heavy_0: 'assets/sfx/hits/plate_heavy_0.ogg',
    hk_plate_heavy_1: 'assets/sfx/hits/plate_heavy_1.ogg',
    hk_plate_heavy_2: 'assets/sfx/hits/plate_heavy_2.ogg',
    hk_tin_medium_0: 'assets/sfx/hits/tin_medium_0.ogg',
    hk_tin_medium_1: 'assets/sfx/hits/tin_medium_1.ogg',
    hk_tin_medium_2: 'assets/sfx/hits/tin_medium_2.ogg',
    hk_punch_medium_0: 'assets/sfx/hits/punch_medium_0.ogg',
    hk_punch_medium_1: 'assets/sfx/hits/punch_medium_1.ogg',
    hk_punch_medium_2: 'assets/sfx/hits/punch_medium_2.ogg',
    hk_punch_heavy_0: 'assets/sfx/hits/punch_heavy_0.ogg',
    hk_punch_heavy_1: 'assets/sfx/hits/punch_heavy_1.ogg',
    hk_punch_heavy_2: 'assets/sfx/hits/punch_heavy_2.ogg',
    hk_glass_light_0: 'assets/sfx/hits/glass_light_0.ogg',
    hk_glass_light_1: 'assets/sfx/hits/glass_light_1.ogg',
    hk_glass_light_2: 'assets/sfx/hits/glass_light_2.ogg',
    hk_glass_medium_0: 'assets/sfx/hits/glass_medium_0.ogg',
    hk_glass_medium_1: 'assets/sfx/hits/glass_medium_1.ogg',
    hk_glass_medium_2: 'assets/sfx/hits/glass_medium_2.ogg',
    hk_glass_heavy_0: 'assets/sfx/hits/glass_heavy_0.ogg',
    hk_glass_heavy_1: 'assets/sfx/hits/glass_heavy_1.ogg',
    hk_glass_heavy_2: 'assets/sfx/hits/glass_heavy_2.ogg',
    hk_soft_medium_0: 'assets/sfx/hits/soft_medium_0.ogg',
    hk_soft_medium_1: 'assets/sfx/hits/soft_medium_1.ogg',
    hk_soft_medium_2: 'assets/sfx/hits/soft_medium_2.ogg',
    hk_bell_heavy_0: 'assets/sfx/hits/bell_heavy_0.ogg',
    hk_bell_heavy_1: 'assets/sfx/hits/bell_heavy_1.ogg',
    hk_bell_heavy_2: 'assets/sfx/hits/bell_heavy_2.ogg',
    hk_generic_light_0: 'assets/sfx/hits/generic_light_0.ogg',
    hk_generic_light_1: 'assets/sfx/hits/generic_light_1.ogg',
    hk_generic_light_2: 'assets/sfx/hits/generic_light_2.ogg',
    al_howl: 'assets/sfx/alpha/howl.ogg',
    al_howl_far: 'assets/sfx/alpha/howl_far.ogg',
    al_bark: 'assets/sfx/alpha/bark.ogg',
    al_snap: 'assets/sfx/alpha/snap.ogg',
    al_bite: 'assets/sfx/alpha/bite.ogg',
    al_claw: 'assets/sfx/alpha/claw.ogg',
    al_leap: 'assets/sfx/alpha/leap.ogg',
    al_growl: 'assets/sfx/alpha/growl.ogg',
    al_fury: 'assets/sfx/alpha/fury.ogg',
    al_rend: 'assets/sfx/alpha/rend.ogg',
    nf_step: 'assets/sfx/nullfang/step.ogg',
    nf_coil: 'assets/sfx/nullfang/coil.ogg',
    nf_leap: 'assets/sfx/nullfang/leap.ogg',
    nf_swipe: 'assets/sfx/nullfang/swipe.ogg',
    nf_land: 'assets/sfx/nullfang/land.ogg',
    nf_hurt: 'assets/sfx/nullfang/hurt.ogg',
    nf_roar: 'assets/sfx/nullfang/roar.ogg',
    nf_arrive: 'assets/sfx/nullfang/arrive.ogg',
    nf_awake: 'assets/sfx/nullfang/awake.ogg',
    nf_breath: 'assets/sfx/nullfang/breath.ogg',
    // A REAL LION (owner, 2026-11-21: "a roar that you should download from any library of
    // a lion roar"). One wild bout, recorded in the field (Freesound 69570, CC0): three of its
    // full roars, the pair of them that opens his second phase, and three of its closing grunts.
    // the swamp and its crocodile: real recordings, CC0 / US public domain
    // (assets/CREDITS.md) — an Everglades alligator, a film-library hiss
    mj_bellow: 'assets/sfx/swamp/mj_bellow.ogg', mj_growl: 'assets/sfx/swamp/mj_growl.ogg',
    mj_hiss: 'assets/sfx/swamp/mj_hiss.ogg', mj_snap: 'assets/sfx/swamp/mj_snap.ogg',
    mj_splash: 'assets/sfx/swamp/mj_splash.ogg', mj_slap: 'assets/sfx/swamp/mj_slap.ogg',
    k2_mosq: 'assets/sfx/swamp/k2_mosq.ogg',
    k2_punt: 'assets/sfx/swamp/k2_punt.ogg', k2_splash: 'assets/sfx/swamp/k2_splash.ogg',
    // the sewer: a manhole scrape under a rusty gate's groan, a steel door's
    // slam, storm-drain water (Freesound, CC0 — assets/CREDITS.md)
    sw_creak: 'assets/sfx/sewer/sw_creak.ogg', sw_clang: 'assets/sfx/sewer/sw_clang.ogg',
    nf_lroar1: 'assets/sfx/nullfang/lion/roar1.ogg',
    nf_lroar2: 'assets/sfx/nullfang/lion/roar2.ogg',
    nf_lroar3: 'assets/sfx/nullfang/lion/roar3.ogg',
    nf_lroar_big: 'assets/sfx/nullfang/lion/roar_big.ogg',
    nf_lgrunt1: 'assets/sfx/nullfang/lion/grunt1.ogg',
    nf_lgrunt2: 'assets/sfx/nullfang/lion/grunt2.ogg',
    nf_lgrunt3: 'assets/sfx/nullfang/lion/grunt3.ogg',

    hz_swing1: 'assets/sfx/hz_swing1.ogg',
    hz_swing2: 'assets/sfx/hz_swing2.ogg',
    hz_fin: 'assets/sfx/hz_fin.ogg',
    hz_burst: 'assets/sfx/hz_burst.ogg',
    hz_dash: 'assets/sfx/hz_dash.ogg',
    hz_charge: 'assets/sfx/hz_charge.ogg',
    hz_ready: 'assets/sfx/hz_ready.ogg',
    hz_jump: 'assets/sfx/hz_jump.ogg',
    hz_land: 'assets/sfx/hz_land.ogg',
    hum_servo: 'assets/sfx/hum_servo.ogg',
    hum_ratchet: 'assets/sfx/hum_ratchet.ogg',
    hum_mono: 'assets/sfx/hum_mono.ogg',
    hum_sage: 'assets/sfx/hum_sage.ogg',
    hum_patch: 'assets/sfx/hum_patch.ogg',
    hum_lumen: 'assets/sfx/hum_lumen.ogg',
    fz_tell: 'assets/sfx/fz_tell.ogg',
    fz_tellmid: 'assets/sfx/fz_tellmid.ogg',
    fz_tellbig: 'assets/sfx/fz_tellbig.ogg',
    fz_slam: 'assets/sfx/fz_slam.ogg',
    fz_phase: 'assets/sfx/fz_phase.ogg',
    fz_wave: 'assets/sfx/fz_wave.ogg',
    fz_spikeup: 'assets/sfx/fz_spikeup.ogg',
    fz_summon: 'assets/sfx/fz_summon.ogg',
    fz_wreck: 'assets/sfx/fz_wreck.ogg',
    fz_break: 'assets/sfx/fz_break.ogg',
    fz_roar: 'assets/sfx/fz_roar.ogg',
    fz_castarc: 'assets/sfx/fz_castarc.ogg',
    fz_castice: 'assets/sfx/fz_castice.ogg',
    fz_castnull: 'assets/sfx/fz_castnull.ogg',
    fz_roar_glitch: 'assets/sfx/fz_roar_glitch.ogg',
    fz_roar_brood: 'assets/sfx/fz_roar_brood.ogg',
    fz_roar_atlas: 'assets/sfx/fz_roar_atlas.ogg',
    fz_roar_zero: 'assets/sfx/fz_roar_zero.ogg',
    fz_roar_prism: 'assets/sfx/fz_roar_prism.ogg',
    fz_roar_mother: 'assets/sfx/fz_roar_mother.ogg',
    hz_step1: 'assets/sfx/hz_step1.ogg',
    hz_step2: 'assets/sfx/hz_step2.ogg',
    hz_stepgrass1: 'assets/sfx/hz_stepgrass1.ogg',
    hz_stepgrass2: 'assets/sfx/hz_stepgrass2.ogg',
    hz_steprock1: 'assets/sfx/hz_steprock1.ogg',
    hz_steprock2: 'assets/sfx/hz_steprock2.ogg',
    hz_stepice1: 'assets/sfx/hz_stepice1.ogg',
    hz_stepice2: 'assets/sfx/hz_stepice2.ogg',
    hz_steporg1: 'assets/sfx/hz_steporg1.ogg',
    hz_steporg2: 'assets/sfx/hz_steporg2.ogg',
    hit1: 'assets/sfx/hit_01.ogg',
    hit2: 'assets/sfx/hit_02.ogg',
    metal: 'assets/sfx/metal_05.ogg',
    explosion: 'assets/sfx/explosion.ogg',
    laser: 'assets/sfx/laser2.mp3',
    zap: 'assets/sfx/zapTwoTone.mp3',
    // NPC proximity voices: drop a loopable file at any of these paths and
    // it replaces that character's synthesized hum automatically (a missing
    // file 404s silently and the synth voice keeps singing instead).
    // These are OVERRIDE SLOTS, not missing assets — see MEDIA_OPTIONAL below,
    // which is how that promise stops being a comment and becomes something
    // tests/platform.cjs can tell apart from a genuine hole in the package.
    hum_servo: 'assets/sfx/hum_servo.ogg',
    hum_ratchet: 'assets/sfx/hum_ratchet.ogg',
    hum_mono: 'assets/sfx/hum_mono.ogg',
    hum_sage: 'assets/sfx/hum_sage.ogg',
    hum_patch: 'assets/sfx/hum_patch.ogg',
    hum_lumen: 'assets/sfx/hum_lumen.ogg',
    // HZD-99's voice and the guardians' roars. Short, mono, decoded once — about
    // 2.5 MB of PCM for the whole cast, against the 62 MB the music used to cost
    // before it was moved to streaming.
    // HZD-99's OWN VOICE. Cloned from a reference the game's owner supplied and
    // spoken WORDLESSLY on purpose — sharp exhales, a cry, a sigh — for the two
    // reasons that agree: it is the Silksong register (a character who sounds
    // rather than speaks), and this game ships in five languages, so a bark
    // with a word in it is a bark that is wrong in four of them.
    // Trimmed to the frame the voice starts by tools/voxtrim.cjs, because the
    // room tone in front of a generated take IS latency on a combat sound.
    hzd_yalla: 'assets/sfx/vox/hzd_yalla.wav',
    hzd_atk1: 'assets/sfx/vox/hzd_atk1.wav',
    hzd_atk2: 'assets/sfx/vox/hzd_atk2.wav',
    hzd_atk3: 'assets/sfx/vox/hzd_atk3.wav',
    hzd_hurt: 'assets/sfx/vox/hzd_hurt.wav',
    hzd_hurtbad: 'assets/sfx/vox/hzd_hurtbad.wav',
    hzd_die: 'assets/sfx/vox/hzd_die.wav',
    hzd_dash: 'assets/sfx/vox/hzd_dash.wav',
    hzd_djump: 'assets/sfx/vox/hzd_djump.wav',
    hzd_land: 'assets/sfx/vox/hzd_land.wav',
    hzd_heal: 'assets/sfx/vox/hzd_heal.wav',
    hzd_evo: 'assets/sfx/vox/hzd_evo.wav',
    hzd_win: 'assets/sfx/vox/hzd_win2.wav',
    hzd_purr: 'assets/sfx/vox/hzd_purr2.wav',
    // the long press: a held note while the burst builds, and the shout she
    // spends it on
    hzd_jump: 'assets/sfx/vox/hzd_jump.wav',
    hzd_charge: 'assets/sfx/vox/hzd_charge.wav',
    hzd_release: 'assets/sfx/vox/hzd_release.wav',
    vox_win: 'assets/sfx/vox/win.ogg',
    vox_purr: 'assets/sfx/vox/purr.ogg',
    vox_roar_beast: 'assets/sfx/vox/roar_beast.ogg',
    vox_roar_eagle: 'assets/sfx/vox/roar_eagle.ogg',
    vox_roar_glc: 'assets/sfx/vox/roar_glc.ogg',
    vox_roar_drg: 'assets/sfx/vox/roar_drg.ogg',
    vox_roar_prism: 'assets/sfx/vox/roar_prism.ogg',
    vox_roar_mother: 'assets/sfx/vox/roar_mother.ogg',
    // Impacts stay recorded — a hit has to sound like it hit something. Her
    // small cues do not: jumping, landing, dashing, picking up, getting hurt
    // and killing something are played, not sampled (see CUE in audio.js), so
    // the samples they used to use are no longer fetched or decoded here.
  },
};
// Sheet layouts changed when the owner's art was integrated. A new page can
// still be controlled briefly by the previous service worker, whose image
// cache is cache-first. Never combine this renderer with that cached sheet.
function mediaRevisionUrl(src) {
  if (!src || /^(data:|blob:)/.test(src) || typeof BUILD_ID === 'undefined') return src;
  return src + (src.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(BUILD_ID);
}
function heroSheetCompatible(key, im) {
  const cells = {hzdIdle:8, swingUppercut:6, swingClawJab:5, swingClaw1:6}[key];
  return !cells || (im.naturalWidth === cells * im.naturalHeight);
}
for (const key in MEDIA_SRC.images) {
  if (MEDIA_SRC.images[key].startsWith('assets/characters/hero/'))
    MEDIA_SRC.images[key] = mediaRevisionUrl(MEDIA_SRC.images[key]);
}
MEDIA_SRC.audio.hzd_yalla = mediaRevisionUrl(MEDIA_SRC.audio.hzd_yalla);
MEDIA_SRC.audio.hzd_win = mediaRevisionUrl(MEDIA_SRC.audio.hzd_win);
if (typeof window !== 'undefined' && window.EMBEDDED_MEDIA) {
  for (const k in window.EMBEDDED_MEDIA) {
    if (MEDIA_SRC.images[k]) MEDIA_SRC.images[k] = window.EMBEDDED_MEDIA[k];
    else MEDIA_SRC.audio[k] = window.EMBEDDED_MEDIA[k];
  }
}
// ---------------------------------------------------------------------------
// ART ON DEMAND. Every sheet in the manifest used to start downloading the
// instant this file parsed — the Foundry dragon, the Archive unicorn, all of it,
// before the player had touched anything, whether or not they would ever get
// there. That is how a cloud game ends up behaving like a bundled one.
//
// The store is now a lazy map: asking for a sheet is what starts fetching it,
// and until it lands the answer is undefined. Every renderer in the codebase
// already guards on that (`if (!im || !im.naturalWidth) return`) because sheets
// have always been able to arrive late, so nothing else had to change.
// ---------------------------------------------------------------------------
// SLOTS THAT ARE ALLOWED TO BE EMPTY. Everything else in MEDIA_SRC must exist
// on disk and must be in the package on every platform (RULE ONE in CLAUDE.md,
// checked by tests/platform.cjs). These six are extension points by design: the
// game synthesises each NPC's voice, and dropping a file at the path takes over.
// Declaring that here rather than only in a comment is the difference between a
// harness that can enforce the rule and one that has to be told to ignore things.
const MEDIA_OPTIONAL = new Set([
  'hum_servo', 'hum_ratchet', 'hum_mono', 'hum_sage', 'hum_patch', 'hum_lumen',
]);
const MEDIA_RAW = {}, MEDIA_PEND = {}, MBUF = {};
// ---------------------------------------------------------------------------
// TWO RESOLUTIONS, AND WHICHEVER ARRIVES FIRST IS DRAWN.
//
// Until now a sheet that had not landed meant the PROCEDURAL fallback was
// drawn — a different picture, not a rougher one — and the swap when the real
// art arrived read as the room changing its mind. tools/lowres.cjs bakes a
// quarter-scale copy of every sheet that is safe to have one, and the whole
// game's art at that size is 0.55 MB against 24.2 MB. So a phone can hold the
// entire world at low resolution for less than one of today's heavy rooms.
//
//   MEDIA_LOW[k]  0/undefined  nothing tried
//                 1            the small copy is in flight
//                 2            the small copy is STANDING IN for the full one
//                 3            the full sheet is here; nothing more to do
//
// Everything downstream is dimension-agnostic on purpose: sheets are sliced
// proportionally (`im.width / cols`) everywhere except the six guardian parts
// atlases, which use absolute pixel rectangles — and those six have no small
// copy at all. tests/lowres.cjs re-derives that exclusion from the source, so
// a seventh atlas with a rect table cannot quietly acquire one.
const MEDIA_LOW = {};
// A stand-in has to be forgotten by everything that CACHED a derivative of it,
// or the room keeps the soft version forever and the upgrade never shows.
function mediaDirty(k) {
  try { delete SOFT_ART[k]; } catch (e) {}
  try { delete ATLAS_PROC[k]; } catch (e) {}
  // ...and the pop grade, which is cached under the media key itself by every
  // body that grades its own plate (the pack, the roster's walks): kept, it
  // would hold the quarter-size stand-in on screen after the sheet landed
  try { delete POP_ART[k]; } catch (e) {}
  // the tile layer is baked once per room — a sheet that lands after that
  // first render would never appear, so force a repaint when art arrives
  if (k === 'platforms' || k === 'strataRubble' || k === 'strataIceB' || k === 'strataLava') {
    try { tileDirty = true; } catch (e) {}
  }
}
// ===========================================================================
// DECODED BEFORE IT IS DRAWN (owner, 2026-11-15, playing the APK: "the screen
// was not very smooth when it moved. Some frames felt like it's not glitching
// but lagging to point of a second").
//
// A sheet that has "loaded" is a file in memory. Its PIXELS do not exist until
// something draws it, and the canvas decodes them there and then, on the main
// thread, inside the frame that asked. Measured on a desktop CPU, per first
// draw: the roster sheet (2496x2508) 184 ms, the people 126 ms, a guardian's
// film strip (13440x256) 64 ms, her own states sheet 46 ms — and a phone is
// several times slower than that. Every new machine, every new backdrop, every
// first use of one of her moves was one of those frames. The web page softens
// it with the quarter-size copies; the packaged app does not use them ("no
// race to win locally"), so there every sheet's first frame was the full one.
//
// Three things were measured before anything was changed (the numbers are for
// the 13440x256 strip; the others scale the same way):
//   img.decode()               returns at once, resolves in 61 ms — and the
//                              first canvas draw STILL takes 64 ms. It warms
//                              the page compositor's cache, which a canvas
//                              does not draw from. (js/atlas.js asked for it
//                              and got nothing for it.)
//   createImageBitmap(<img>)   the first draw is then 3 ms — and the call
//                              itself blocks the main thread for 68 ms. The
//                              same hitch, moved.
//   createImageBitmap(Blob)    returns in 0.2 ms, the main thread never
//                              stalls more than 4 ms, and the first draw is
//                              3 ms. The decode happens on another thread.
//
// So once a sheet has loaded, its bytes are read a second time as a Blob — from
// the HTTP cache, the service worker's cache or the package, never the network
// twice — made into an ImageBitmap off the main thread, and hung on the <img>
// as `__bm`. (Loading the <img> itself FROM the blob, to save that second
// read, was tried: it is one request, and it delivers the sheet late enough
// that the quarter-size stand-in starts winning races it used to lose.)
// The <img> stays the object every renderer holds, tests and guards exactly as
// before; ONE patched drawImage swaps in the bitmap when there is one. A sheet
// with no bitmap draws as it always did, so nothing here can make a picture
// wrong — only late, and then no later than it used to be.
//
// WHEN: a sheet is published the moment it loads, as it always was, and its
// bitmap follows a few tens of milliseconds behind it. What makes that enough
// is that nearly nothing is drawn the instant it loads: the prefetcher brings
// a room's art in while she is still a room away, preloadRoom names the art
// within a door of her (artBmNear) and it is decoded three at a time, and her
// own body's sheets are always in that set. A sheet drawn in the gap before
// its bitmap lands is decoded on the frame, the way every sheet used to be.
// A sheet the prefetcher brought in for a FAR room is not decoded at all until
// she comes within a door of it.
//
// ON A WORKER, SO IT IS TRUE ON AN iPHONE TOO (owner, 2026-11-15: "make sure
// that fixing the lag applies to the iOS too"). The table above is Chromium's
// — Android's WebView and the desktop shell. WebKit, which is every browser on
// iOS and the iOS app, does not promise that createImageBitmap(Blob) called on
// the page leaves the page's thread alone, and no WebKit could be run where
// this was written to find out. Called inside a Worker it cannot touch the
// main thread in ANY engine: the decode runs on the worker's thread and the
// finished bitmap is handed back (it is transferable, so nothing is copied).
// So that is where it is made, everywhere. If the worker cannot be had, a
// Chromium page falls back to the measured call above and every other engine
// turns the whole scheme off and draws as it did before today — never a
// decode moved onto the main thread at a moment of this code's choosing.
// The same caution sets WebKit's ceiling lowest, and three failures of any
// kind (a bitmap that will not be made, or comes back the wrong size) turn it
// off for the session.
//
// MEMORY: every sheet in the game decoded is 861 MB, so the bitmaps live under
// a ceiling — the device's, not the game's — and the least recently drawn one
// that is not within a door of her is closed to make room. Its <img> remains
// and draws the old way if it is ever needed before it is warmed again.
// ===========================================================================
const ART_BM = { t: 0, bytes: 0, n: 0, made: 0, evict: 0, failed: 0, cap: 0, items: [], near: {}, q: [], busy: 0,
  worker: null, jobs: {}, jobN: 0, onWorker: 0, onPage: 0,
  // Chromium (Android's WebView, Chrome, the desktop shell) or not: the one
  // engine where the page-side call was measured to stay off the main thread
  chromium: typeof navigator !== 'undefined' && /Chrome\/|Chromium\//.test(navigator.userAgent || ''),
  off: typeof createImageBitmap !== 'function' || typeof fetch !== 'function'
    || (typeof location !== 'undefined' && /[?&]nobm=1/.test(location.search || '')) };
function artBmCap() {
  if (ART_BM.cap) return ART_BM.cap;
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const mem = nav.deviceMemory || 0, touch = (nav.maxTouchPoints || 0) > 0;
  // (a touch device that is not Chromium is an iPhone or an iPad: the engine
  // this could not be measured on, and the one with the hardest memory limits
  // — it gets the careful number. Her body and the room she is in fit in it.)
  ART_BM.cap = (touch && !ART_BM.chromium ? 96 : mem && mem <= 2 ? 112 : touch ? (mem >= 8 ? 288 : mem >= 4 ? 208 : 160) : 512) * 1048576;
  return ART_BM.cap;
}
function artBmDrop(im) {
  const bm = im.__bm;
  if (!bm) return;
  im.__bm = null; ART_BM.bytes -= im.__bmB || 0; ART_BM.n--; ART_BM.evict++;
  try { bm.close(); } catch (e) {}
}
// make room for `need` bytes: the least recently drawn first. Never one drawn
// in the last few seconds. One within a door of her goes only if nothing else
// will do AND it has not been drawn for twenty seconds — which is what a raw
// sheet looks like once its cleaned or graded copy has taken over the drawing
// (the roster and the people are 47 MB of exactly that).
function artBmEvict(need) {
  const cap = artBmCap();
  if (ART_BM.bytes + need <= cap) return true;
  const L = ART_BM.items.filter(im => im.__bm);
  L.sort((a, b) => (a.__use || 0) - (b.__use || 0));
  for (const pass of [0, 1]) for (const im of L) {
    if (ART_BM.bytes + need <= cap) break;
    if (!im.__bm) continue;
    const idle = ART_BM.t - (im.__use || 0);
    if (idle < 240 || (ART_BM.near[im.__k] && (!pass || idle < 1200))) continue;
    artBmDrop(im);
  }
  ART_BM.items = L.filter(im => im.__bm);
  return ART_BM.bytes + need <= cap;
}
// THE DECODE, ON ANOTHER THREAD. A worker made from a few lines of text (no
// file to ship, nothing for a packer to forget): it is posted the Blob, makes
// the bitmap, and transfers it back.
function artBmWorker() {
  if (ART_BM.worker !== null) return ART_BM.worker;       // false: cannot be had
  try {
    const src = 'self.onmessage=function(e){var d=e.data;try{createImageBitmap(d.b).then(function(bm){try{self.postMessage({i:d.i,bm:bm},[bm]);}catch(x){self.postMessage({i:d.i});}},function(){self.postMessage({i:d.i});});}catch(x){self.postMessage({i:d.i});}};';
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const w = new Worker(url);
    w.onmessage = (e) => { const d = e.data || {}, j = ART_BM.jobs[d.i]; delete ART_BM.jobs[d.i]; if (j) j(d.bm || null); };
    w.onerror = () => {                                   // it died: everything it was holding fails, and it is not asked again
      ART_BM.worker = false;
      const J = ART_BM.jobs; ART_BM.jobs = {};
      for (const i in J) J[i](null);
    };
    ART_BM.worker = w;
  } catch (e) { ART_BM.worker = false; }
  return ART_BM.worker;
}
// Blob -> ImageBitmap (or null), never on the main thread
function artBmDecode(blob) {
  const w = artBmWorker();
  if (w) {
    return new Promise((res) => {
      const i = ++ART_BM.jobN;
      ART_BM.jobs[i] = (bm) => { if (bm) ART_BM.onWorker++; res(bm); };
      try { w.postMessage({ i, b: blob }); } catch (e) { delete ART_BM.jobs[i]; res(null); }
    });
  }
  // no worker. Chromium's own call was measured to stay off the main thread;
  // nobody else's was, so nobody else gets one.
  if (!ART_BM.chromium) { ART_BM.off = true; return Promise.resolve(null); }
  return createImageBitmap(blob).then((bm) => { ART_BM.onPage++; return bm; }, () => null);
}
// `then` is called exactly once: when the bitmap is on the image, when it
// cannot be made, or after 2.5 s — a promise a parked tab never settles must
// not keep a sheet off the screen. A bitmap that arrives after that is kept.
function artBmMake(im, then) {
  let told = false;
  const tell = () => { if (!told) { told = true; if (then) then(); } };
  if (ART_BM.off || !im || im.__bm) return tell();
  if (im.__bmP) { im.__bmP.push(tell); return; }
  const bytes = (im.naturalWidth | 0) * (im.naturalHeight | 0) * 4, src = im.__url || im.currentSrc || im.src;
  if (!bytes || !(im.__blob || src) || !artBmEvict(bytes)) return tell();
  im.__bmP = [tell];
  const fin = (bm) => {
    const w = im.__bmP; im.__bmP = null;
    // (it must be the same picture at the same size, or it is not used)
    const right = bm && bm.width === im.naturalWidth && bm.height === im.naturalHeight;
    if (right && !im.__bm && artBmEvict(bytes)) {
      im.__bm = bm; im.__bmB = bytes; im.__use = ART_BM.t;
      ART_BM.bytes += bytes; ART_BM.n++; ART_BM.made++; ART_BM.items.push(im);
    } else if (bm) { try { bm.close(); } catch (e) {} if (!right) ART_BM.failed++; }
    else ART_BM.failed++;
    // three failures and it is not this engine's day: back to how it was
    if (ART_BM.failed >= 3 && !ART_BM.off) { ART_BM.off = true; ART_BM.q = []; for (const q of ART_BM.items.slice()) artBmDrop(q); ART_BM.items = []; }
    if (w) for (const f of w) f();
  };
  try {
    (im.__blob ? Promise.resolve(im.__blob)
               : fetch(src).then(r => { if (!r.ok) throw new Error('art'); return r.blob(); }).then(b => (im.__blob = b)))
      .then(b => artBmDecode(b)).then(fin, () => fin(null));
  } catch (e) { fin(null); }
  setTimeout(tell, 2500);
}
// The art within a door of her (and her own body's). Called when a room loads:
// what is already here and has no pixels yet is given them, nearest first.
function artBmNear(keys) {
  const near = {};
  for (const k of keys) near[k] = 1;
  ART_BM.near = near;
  // (a sheet whose cleaned copy already exists is not drawn raw again)
  ART_BM.q = keys.filter(k => { const im = MEDIA_RAW[k]; return im && im.tagName === 'IMG' && !im.__bm && !im.__bmP && MEDIA_LOW[k] !== 2
    && !(typeof ATLAS_PROC !== 'undefined' && ATLAS_PROC[k]); });
}
// once a frame (js/preload.js preloadTick): the clock the "recently drawn"
// reading runs on, and at most three decodes in flight (they are on other
// threads; three is what a phone has to spare beside the game)
function artBmTick() {
  ART_BM.t++;
  while (ART_BM.q.length && ART_BM.busy < 3) {
    const im = MEDIA_RAW[ART_BM.q.shift()];
    if (!im || im.tagName !== 'IMG' || im.__bm || im.__bmP) continue;
    ART_BM.busy++;
    artBmMake(im, () => { ART_BM.busy = Math.max(0, ART_BM.busy - 1); });
  }
}
// THE ONE PLACE A BITMAP IS USED. Every draw in the game goes through
// c.drawImage(im, ...) with the <img>; where that <img> has its pixels ready
// they are what is drawn. Same size, same pixels, no decode.
(function () {
  if (typeof CanvasRenderingContext2D === 'undefined') return;
  const P = CanvasRenderingContext2D.prototype, raw = P.drawImage;
  if (raw.__artBm) return;
  P.drawImage = function (im, a, b, c2, d, e, f, g, h) {
    const bm = im && im.__bm;
    if (bm) { im.__use = ART_BM.t; im = bm; }
    const n = arguments.length;
    return n >= 9 ? raw.call(this, im, a, b, c2, d, e, f, g, h) : n >= 5 ? raw.call(this, im, a, b, c2, d) : raw.call(this, im, a, b);
  };
  P.drawImage.__artBm = 1;
})();
function mediaLow(k) {
  const L = (typeof window !== 'undefined') && window.LOWRES;
  if (!L || !L[k] || MEDIA_RAW[k] || MEDIA_LOW[k]) return;
  MEDIA_LOW[k] = 1;
  const im = new Image();
  im.onload = () => {
    if (MEDIA_RAW[k]) return;              // the full one won the race
    if (!heroSheetCompatible(k, im)) { MEDIA_LOW[k] = 0; return; }
    MEDIA_RAW[k] = im; MEDIA_LOW[k] = 2;
    mediaDirty(k);
  };
  im.onerror = () => { MEDIA_LOW[k] = 0; };  // no webp on this browser: no loss
  im.src = mediaRevisionUrl(L[k]);
}
// `urgent` means SOMETHING IS DRAWING THIS RIGHT NOW — the lazy map's own
// accessor sets it. Only then is the small copy worth a second request; the
// prefetcher has time and asks for full size directly.
//
// `bust` exists because sw.js serves an image request cache-first with no
// network fallback (`if (hit && !code) return hit;` — images are never
// `code`). A response cached from a single bad transfer — a dropped VPN hop,
// a corrupted intermediary, anything that finishes as a valid 200 with wrong
// bytes — is then served identically FOREVER: every retry re-requests the
// same URL, the worker matches the same cache entry, and the player is
// stranded with no recourse except manually clearing site storage, which the
// loading screen's own "Retry" prompt cannot ask them to do. A cache-busting
// query string makes the retry a genuinely different request, so it can
// actually reach the network past a poisoned entry. Only the user-triggered
// "it has been stuck for 12 seconds, try again" path uses this — the quiet
// per-second poll while still within the normal window must not spam fresh
// cache entries for a merely-slow connection.
// `far` is the prefetcher saying "nobody is near this yet" (js/preload.js): the
// sheet is fetched and published as it always was, and its pixels are decoded
// later, when she comes within a door of it — see DECODED BEFORE IT IS DRAWN.
function mediaFetch(k, urgent, bust, far) {
  if (urgent) mediaLow(k);
  if (MEDIA_RAW[k] && MEDIA_LOW[k] !== 2) return;   // a stand-in still wants the real one
  if (MEDIA_PEND[k]) { if (!far) MEDIA_PEND[k] = 2; return; }   // somebody nearer wants it: decode it on arrival
  if (!MEDIA_SRC.images[k]) return;
  MEDIA_PEND[k] = far ? 1 : 2;
  const im = new Image();
  im.__k = k;
  im.onload = () => {
    if (!heroSheetCompatible(k, im)) {
      delete MEDIA_PEND[k];
      if (!bust) mediaFetch(k, urgent, true);
      return;
    }
    // PUBLISHED THE MOMENT IT LOADS, exactly as it always was — and its pixels
    // are made alongside, off the frame, unless the prefetcher fetched it for
    // a room she is nowhere near. (Holding it back until the bitmap was ready
    // was tried first: it moved when art appears, and the floor's bake, the
    // stand-ins and a dozen harnesses are all timed to the old moment.)
    const want = MEDIA_PEND[k] === 2 || ART_BM.near[k];
    land();
    if (want) artBmMake(im);
  };
  const land = () => {
    if (MEDIA_RAW[k] === im) return;
    const wasLow = MEDIA_LOW[k] === 2;
    MEDIA_RAW[k] = im; MEDIA_LOW[k] = 3;
    // PENDING ENDS WHEN IT LANDS. Kept, the key stayed "pending" forever, and
    // every wait-for-art written as "until MEDIA_PEND is empty" (roomassets,
    // the eye harnesses) sat out its whole ceiling on art already drawn. The
    // guard above (RAW present and not a stand-in) is what stops a refetch.
    delete MEDIA_PEND[k];
    // the tile layer is BAKED, so a sheet that lands after the bake changes
    // nothing until the bake is thrown away. The rock slabs belong here for
    // exactly that reason: they are the surface itself.
    //
    // AND IT IS NOT AN `else`. A sheet that arrives over a low-tier stand-in
    // takes the mediaDirty path, and that path does not touch the bake — so a
    // quarter-scale rock slab landed first, got baked, and the full-size one
    // that followed it was never drawn. Both things have to happen.
    if (k === 'platforms' || k === 'strataRubble' || k === 'strataIceB' || k === 'strataLava'
        || /^rock[A-EX]$/.test(k)) {
      try { tileDirty = true; } catch (e) {}
    }
    if (wasLow) mediaDirty(k);
  };
  im.onerror = () => {
    // A failed request must not permanently lock a visible image out.
    setTimeout(() => { delete MEDIA_PEND[k]; }, 3000);
  };
  im.__url = bust ? MEDIA_SRC.images[k] + (MEDIA_SRC.images[k].indexOf('?') < 0 ? '?' : '&') + 'r=' + Date.now()
                   : MEDIA_SRC.images[k];
  im.src = im.__url;
}
const MEDIA_IMG = (typeof Proxy === 'function') ? new Proxy(MEDIA_RAW, {
  get(t, k) {
    if (typeof k !== 'string') return t[k];
    if (t[k]) return t[k];
    mediaFetch(k, true);
    return undefined;
  },
}) : MEDIA_RAW;
// the handful that must never pop in late: the shared turnaround atlas, the
// player's own sheets and the decks she is standing on
// one argument each: forEach would pass the index as `urgent` and the array as `bust`,
// fetching three of the four as urgent with a cache-busting query on every boot
['roster', 'npcs', 'platforms', 'slashFx'].forEach(k => mediaFetch(k));
// Asking "is this sheet here yet?" must NOT be what fetches it. Several guards
// test four boss atlases in one condition to decide which renderer to use, and
// through the lazy map that innocent-looking check pulled 2.7 MB of art for
// guardians that were not even in the room.
function mediaHas(k) { return !!MEDIA_RAW[k]; }

// ---------------------------------------------------------------------------
// SOFT EDGES. The guardians' art arrived as figures cut out of a painted
// background, and a cut-out has a hard edge: every pixel is either fully opaque
// or fully gone. Against a dark room that reads as a sticker laid on the scene —
// which is exactly how it looked next to the cat, who is drawn with vector
// shapes and is anti-aliased for free.
//
// Two things happen here, once per sheet, and both only touch the boundary:
//
//   FEATHER — a pixel's alpha is capped at the average alpha around it, so a
//   solid interior is untouched and the rim ramps out over a pixel or two.
//   CLEAN   — the outermost pixels of a keyed cut-out carry a halo of whatever
//   was behind them. Those are pulled toward their opaque neighbours, so the
//   ghost of the old background stops outlining the figure.
// ---------------------------------------------------------------------------
const SOFT_ART = {};
function softArt(key) {
  if (SOFT_ART[key] !== undefined) return SOFT_ART[key];
  const im = MEDIA_RAW[key];
  if (!im || !im.naturalWidth) return null;              // not here yet; ask again
  let out = im;
  try {
    const W = im.naturalWidth, H = im.naturalHeight;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    x.drawImage(im, 0, 0);
    const img = x.getImageData(0, 0, W, H), d = img.data;
    const a0 = new Uint8ClampedArray(W * H);
    for (let i = 0, p = 3; i < W * H; i++, p += 4) a0[i] = d[p];
    for (let y = 0; y < H; y++) {
      for (let xx = 0; xx < W; xx++) {
        const i = y * W + xx;
        if (!a0[i]) continue;                            // already empty
        let sum = 0, n = 0, br = 0, bg = 0, bb = 0, bw = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy; if (yy < 0 || yy >= H) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const x2 = xx + dx; if (x2 < 0 || x2 >= W) continue;
            const j = yy * W + x2;
            sum += a0[j]; n++;
            if (a0[j] === 255 && j !== i) {              // a solidly interior neighbour
              bw++; br += d[j * 4]; bg += d[j * 4 + 1]; bb += d[j * 4 + 2];
            }
          }
        }
        const mean = sum / n;
        if (mean < 255) {
          d[i * 4 + 3] = Math.min(a0[i], mean);          // feather
          if (bw && a0[i] < 250) {                       // and de-fringe the rim
            d[i * 4] = (d[i * 4] + br / bw) / 2;
            d[i * 4 + 1] = (d[i * 4 + 1] + bg / bw) / 2;
            d[i * 4 + 2] = (d[i * 4 + 2] + bb / bw) / 2;
          }
        }
      }
    }
    x.putImageData(img, 0, 0);
    // every renderer in the game tests im.naturalWidth to know whether a sheet
    // has arrived, and sizes its own scratch copies from it. A canvas has no
    // such property, so it is given one and stays a drop-in for the image.
    cv.naturalWidth = W; cv.naturalHeight = H;
    out = cv;
  } catch (e) { out = im; }                              // tainted canvas: ship it raw
  SOFT_ART[key] = out;
  return out;
}
// ---------------------------------------------------------------------------
// PLATE ANCHORING. A matted plate arrives with unpredictable margins, and a
// figure that must stand with its feet on the floor (tests/artbible.cjs
// measures exactly that) cannot be anchored by the frame edge — it anchors by
// where the body actually ends. The opaque bounding box is measured once per
// plate at 1/8 scale (the answer only steers a drawImage; a pixel of slack is
// invisible, and a full-resolution scan of a 1024² plate is not free) and
// cached as fractions of the frame.
// ---------------------------------------------------------------------------
const PLATE_BOX = {};
function plateBox(key) {
  if (PLATE_BOX[key]) return PLATE_BOX[key];
  const im = MEDIA_RAW[key];
  if (!im || !im.naturalWidth) return null;
  try {
    const S = 8;
    const W = Math.max(1, Math.round(im.naturalWidth / S));
    const H = Math.max(1, Math.round(im.naturalHeight / S));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d', { willReadFrequently: true });
    x.drawImage(im, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H).data;
    let minX = W, maxX = -1, minY = H, maxY = -1;
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
      if (d[(y * W + xx) * 4 + 3] > 24) {
        if (xx < minX) minX = xx; if (xx > maxX) maxX = xx;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) return null;                         // nothing opaque yet
    PLATE_BOX[key] = {
      x: minX * S / im.naturalWidth, y: minY * S / im.naturalHeight,
      w: (maxX - minX + 1) * S / im.naturalWidth,
      h: (maxY - minY + 1) * S / im.naturalHeight,
    };
  } catch (e) { PLATE_BOX[key] = { x: 0, y: 0, w: 1, h: 1 }; }  // tainted: whole frame
  return PLATE_BOX[key];
}
// ---------------------------------------------------------------------------
// THE POP GRADE. The room grade pulls everything toward the kingdom's palette,
// which is right for scenery and wrong for the cast: an enemy that blends into
// the backdrop is an ambush the player was never meant to be in (the owner:
// "their light exposure is dull, so they blend with the background instead of
// showing as true enemies"). Once per sheet, cached: the image blended over
// ITSELF in overlay raises midtone contrast and saturation — the cartoon pop,
// not a new look — and a whisper of screen lifts the exposure. Composite blend
// modes rather than ctx.filter on purpose: filter is dead on iOS Safari, and
// the phone is where the dullness was reported. Self-blending cannot grow
// outside the subject's own alpha, so no masking is needed.
// ---------------------------------------------------------------------------
const POP_ART = {};
// A BACKDROP THAT CAN BE SEEN, without a grey veil over the whole frame.
//
// The owner, four times now, most recently: "Background is toooooo dark and
// faded" and "can't even see the door artwork". Measured, on the room in his
// screenshot: the frame reads 11.6% luminance with 77% of its pixels crushed
// below 12% BEFORE the screen-lift dial — and the plates themselves are the
// floor of it. gateCity, the painting the door he cannot see is painted into,
// is 16.2% mean luminance with 31% of its own pixels already crushed. Four
// darkening passes then run over it, and the frame-budget dial had switched
// OFF the only pass that puts light back.
//
// The fix that reads as light rather than as fog is a GAMMA LIFT: raise the
// mid-tones and leave white alone, on the plate, once, cached. That is what a
// grade does. What the screen-lift dial does instead is add a flat grey to
// every pixel including the black ones, which is precisely the definition of
// faded — and it is why three previous attempts at this ended with a brighter
// number and the same complaint.
//
// Same LUT as popArt's `lift`, without popArt's contrast passes: those exist to
// make a hostile body shout, and a backdrop shouting is the opposite of what
// §9.1 asks for. The plate keeps its alpha and its size.
const BG_LIFT = {};
function bgLift(key, src, gamma) {
  const ck = key + '@' + gamma;
  if (BG_LIFT[ck] !== undefined) return BG_LIFT[ck];
  const im = src || MEDIA_RAW[key];
  if (!im || !im.naturalWidth) return null;                // not here yet; ask again
  let out = im;
  try {
    const cv = document.createElement('canvas');
    cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    const x = cv.getContext('2d', { willReadFrequently: true });
    x.drawImage(im, 0, 0);
    const lut = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) lut[i] = 255 * Math.pow(i / 255, gamma);
    const id = x.getImageData(0, 0, cv.width, cv.height), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]];
    }
    x.putImageData(id, 0, 0);
    cv.naturalWidth = cv.width; cv.naturalHeight = cv.height;
    out = cv;
  } catch (e) {}                                           // tainted: ship it raw
  BG_LIFT[ck] = out;
  return out;
}

// ...as steps too (see processSheetSteps in atlas.js): the lifted sheets read
// back and rewrite every pixel, so the idle prebake runs them in bands, and an
// on-demand call finishes a paused one instead of starting over.
const POP_RUN = {};
function popArt(key, src, lift) {
  if (POP_ART[key] !== undefined) return POP_ART[key];
  const run = POP_RUN[key];
  delete POP_RUN[key];
  const it = run || popArtSteps(key, src, lift);
  let r; do { r = it.next(); } while (!r.done);
  return POP_ART[key] !== undefined ? POP_ART[key] : (r.value || null);
}
function* popArtSteps(key, src, lift) {
  if (POP_ART[key] !== undefined) return POP_ART[key];
  const im = src || MEDIA_RAW[key];
  if (!im || !im.naturalWidth) return null;               // not here yet; ask again
  let out = im;
  try {
    const cv = document.createElement('canvas');
    cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    const x = cv.getContext('2d');
    x.drawImage(im, 0, 0);
    x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.32; x.drawImage(im, 0, 0);
    x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.14; x.drawImage(im, 0, 0);
    // `lift` is a gamma exponent (<1) for art that is DARK ON DARK — the
    // machine folk are rusty bronze in the dimmest rooms in the game, and
    // screen/overlay passes move near-black pixels almost nowhere (screening
    // dark with dark stays dark — that is just the math). A real shadow lift
    // needs the pixels: one cached LUT pass, gamma-up on RGB, alpha kept.
    // Same-origin sheets only, and the try/catch already ships raw if not.
    if (lift) {
      const lut = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) lut[i] = 255 * Math.pow(i / 255, lift);
      // a per-pixel LUT is the same answer in bands as in one piece
      for (let y0 = 0; y0 < cv.height; y0 += 256) {
        yield;
        const bh = Math.min(256, cv.height - y0);
        const id = x.getImageData(0, y0, cv.width, bh), d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          if (!d[i + 3]) continue;
          d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]];
        }
        x.putImageData(id, 0, y0);
      }
    }
    cv.naturalWidth = cv.width; cv.naturalHeight = cv.height;
    out = cv;
  } catch (e) {}                                           // tainted: ship it raw
  if (!src && MEDIA_RAW[key] !== im) return null;          // replaced while it ran
  POP_ART[key] = out;
  return out;
}

// Draw a matted plate so its opaque box stands on `base`, centred on `cx`,
// scaled so the box is `targetH` world-pixels tall. Returns false while the
// plate has not arrived, which is every caller's cue to draw the procedural
// body instead — the same arrangement every renderer in this game uses.
// `pop` runs the plate through the pop grade — hostile bodies only; props and
// friendly faces keep the room's own light.
// ...and the same plate anchored by its MIDDLE rather than its feet. A serpent
// riding the air, a bell hanging from a cable and a bird in a stoop have no
// contact point to stand on; anchoring those by the box's bottom edge hangs
// them off whatever y they were handed. `anchor` is 'foot' (default) or 'mid'.
function drawPlateAnchored(c, key, cx, base, targetH, flip, pop, anchor) {
  mediaFetch(key);
  let im = softArt(key);
  if (!im || !im.naturalWidth) return false;
  if (pop) im = popArt('soft:' + key, im) || im;
  const box = plateBox(key);
  if (!box) return false;
  const scale = targetH / (box.h * im.naturalHeight);
  const dw = im.naturalWidth * scale, dh = im.naturalHeight * scale;
  c.save();
  c.translate(cx, base);
  if (flip) c.scale(-1, 1);
  const ay = anchor === 'mid' ? (box.y + box.h / 2) : (box.y + box.h);
  c.drawImage(im, -(box.x + box.w / 2) * dw, -ay * dh, dw, dh);
  infEyeArt(c, key, 0, -(box.x + box.w / 2) * dw, -ay * dh, dw, dh);
  c.restore();
  return true;
}

// ---------------------------------------------------------------------------
// A PLATE SET IS NOT A COLLECTION OF PLATES.
//
// drawPlateAnchored normalises every key to the same drawn HEIGHT. That is
// right for unrelated art and exactly wrong for several poses of ONE body: the
// hunched frame gets scaled up until it matches the standing one, and the
// character PUMPS between sizes every time the loop cycles. art-prompts §3
// names this as the worst of the aspect behaviours for a reason — a boss that
// changes size between frames reads as broken in a way that no proportion
// drift does.
//
// So a set shares ONE scale. The frames come off one camera at one distance,
// so the FRAME is the scale, and whatever the model drew inside it is the
// relative size it meant. Each plate then anchors on its OWN FEET:
//
//   - the floor line is the bottom of the alpha mask, not the bottom of the
//     frame, so a crop that leaves different margin does not float him;
//   - the horizontal is the centroid of the mask's bottom slice, NOT the
//     centre of the bounding box, because an arm thrown out sideways — which
//     is the whole point of the tic plate — moves the box a long way and must
//     not drag the body with it.
//
// And the scale is derived from SILHOUETTE AREA, not from the frame and not
// from the bounding box. Two attempts got this wrong first. The frame is not
// the scale, because the generator decides for itself how much of the frame to
// fill and varies it by a third between plates of the same character. The
// bounding box is not the scale either, and that one is worth remembering:
// every pose measured within 2% by box height while one of them was visibly a
// third smaller, because this character's box is topped by his canister rack —
// a small body under a high rack measures the same as a big body under a low
// one. Area is what the eye compares. Folding a body over does cost some area
// to self-occlusion, so a crouch comes out a few percent large; that is the
// residual, and it is a tenth of what it replaced.
//
// The payoff is that a re-fired plate registers itself. Nothing has to be
// re-cropped, no per-key table has to be maintained, and the next person to
// replace one of these does not have to know any of this.
//
// Measured once per key and cached; the mask is read at 1/8 scale like
// plateBox, which is plenty for an anchor and costs nothing.
const PLATE_FOOT = {};
function plateFoot(key) {
  if (PLATE_FOOT[key]) return PLATE_FOOT[key];
  const im = MEDIA_RAW[key];
  if (!im || !im.naturalWidth) return null;
  try {
    const S = 8;
    const W = Math.max(1, Math.round(im.naturalWidth / S));
    const H = Math.max(1, Math.round(im.naturalHeight / S));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d', { willReadFrequently: true });
    x.drawImage(im, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H).data;
    let minY = H, maxY = -1;
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
      if (d[(y * W + xx) * 4 + 3] > 24) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    if (maxY < 0) return null;                          // nothing opaque yet
    // the feet: the bottom tenth of the body, never less than two rows
    const band = Math.max(2, Math.round((maxY - minY + 1) * 0.10));
    let sx = 0, n = 0;
    for (let y = Math.max(minY, maxY - band + 1); y <= maxY; y++)
      for (let xx = 0; xx < W; xx++) if (d[(y * W + xx) * 4 + 3] > 24) { sx += xx; n++; }
    let solid = 0;
    for (let i = 0; i < W * H; i++) if (d[i * 4 + 3] > 24) solid++;
    PLATE_FOOT[key] = {
      cx: (n ? sx / n : W / 2) / W,
      y: (maxY + 1) / H,
      area: solid / (W * H),                            // the scale landmark
    };
  } catch (e) { PLATE_FOOT[key] = { cx: 0.5, y: 1, area: 0 }; }  // tainted
  return PLATE_FOOT[key];
}

// Draw one plate of a set. `frameH` is the drawn frame height that puts the
// REFERENCE plate at the size the room wants; every other key in the set is
// then scaled so its silhouette covers the same area as the reference's, which
// is what keeps them one character rather than one height.
// One cell of a horizontal strip, anchored on its foot line.
//
// A strip needs no plateFoot: tools/vidstrip.cjs writes square cells with the
// subject bottom-aligned and centred, so the anchor IS the bottom centre of the
// cell. That is the whole reason the strip is built that way — a per-cell foot
// measurement would wander by a pixel or two per frame, and an idle loop that
// wanders is worse than one that does not move at all.
// THE INFECTION'S COLOUR, WASHED OUT. A guardian freed by the Purifier keeps
// its body and loses the virus: the violet the art burns at every joint is
// re-lit teal, once per sheet (keyed by the image itself, so the full sheet
// that replaces a low-tier copy is recoloured again rather than missed). A
// derivation of the authored frames, like popArt's grade — nothing redrawn.
const PURE_ART = new WeakMap();
function pureArt(im) {
  if (!im || !(im.naturalWidth || im.width)) return im;
  const hit = PURE_ART.get(im);
  if (hit) return hit;
  let out = im;
  try {
    const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const id = x.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (d[i + 3] && b > 80 && b > g * 1.35 && r > g * 1.05) {
        const v = Math.max(r, b);
        d[i] = v * 0.24; d[i + 1] = Math.min(255, v * 0.86); d[i + 2] = Math.min(255, v * 0.78);
      }
    }
    x.putImageData(id, 0, 0);
    cv.naturalWidth = w; cv.naturalHeight = h;
    out = cv;
  } catch (err) { out = im; }
  PURE_ART.set(im, out);
  return out;
}
// HIS SECOND PHASE IS SEEN (owner, 2026-11-21: "I can only see one phase of nilfang").
// From the roar that opens it, every authored violet light on NULLFANG — eyes, veins,
// joints — burns the red of his dash: the same body, enraged. A recolour of the art's own
// pixels (as pureArt washes them teal when he is purified), cached once per sheet.
const RAGE_ART = new WeakMap();
function rageArt(im) {
  if (!im || !(im.naturalWidth || im.width)) return im;
  const hit = RAGE_ART.get(im); if (hit) return hit;
  let out = im;
  try {
    const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const id = x.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (d[i + 3] && b > 80 && b > g * 1.35 && r > g * 1.05) {
        const v = Math.max(r, b);
        d[i] = Math.min(255, v * 1.05); d[i + 1] = v * 0.26; d[i + 2] = v * 0.2;
      }
    }
    x.putImageData(id, 0, 0);
    cv.naturalWidth = w; cv.naturalHeight = h;
    out = cv;
  } catch (err) { out = im; }
  RAGE_ART.set(im, out);
  return out;
}
function drawStripCell(c, key, cell, cells, cx, base, h, flip, pure) {
  // URGENT: a strip is asked for the frame it is needed, and a body that
  // waits a quarter-megabyte for its run cycle on a phone connection draws
  // its pose cells for a second first. The quarter-scale copy lands in a
  // fraction of that and the full sheet sharpens it from behind, which is
  // what the low tier exists for.
  mediaFetch(key, 1);
  const raw = MEDIA_RAW[key];
  if (!raw || !raw.naturalWidth || !heroSheetCompatible(key, raw)) return false;
  const im = pure === 'rage' ? rageArt(raw) : pure ? pureArt(raw) : raw;
  // what drew the body, for the diag panel: the owner's "nothing changed"
  // is answered by a screenshot that names the strip and the cell
  if (typeof G !== 'undefined') G.lastStrip = key + ':' + (((cell % cells) + cells) % cells);
  const cw = im.naturalWidth / cells, ch = im.naturalHeight;
  const i = ((cell % cells) + cells) % cells;
  const dw = h * (cw / ch);
  // (her own cell, remembered while her body is being drawn: the dash's echo)
  if (typeof HERO_ECHO !== 'undefined' && HERO_ECHO.rec) HERO_ECHO.last = { key, f: i, cells, cx, base, height: h, flip: !!flip };
  c.save();
  c.translate(cx, base);
  if (flip) c.scale(-1, 1);
  c.drawImage(im, i * cw, 0, cw, ch, -dw / 2, -h, dw, h);
  if (NPC_SHEEN.on) npcSheen(c, im, i * cw, 0, cw, ch, -dw / 2, -h, dw, h);
  infEyeArt(c, key, i, -dw / 2, -h, dw, h);             // the eyes in this cell, for the infection
  c.restore();
  return true;
}

function drawSetPlate(c, key, cx, base, frameH, flip, refKey) {
  mediaFetch(key);
  // RAW, NOT softArt. softArt exists to feather a HARD key — a cut-out whose
  // every pixel is either fully opaque or fully gone, with a halo of the old
  // background around the rim. These plates were MATTED by the generator, so
  // the alpha is already soft and the pass buys an edge nobody can see. What
  // it costs is a full-resolution scratch canvas per key, and a set is seven
  // of them: 29 MB of canvas on a phone for a cosmetic rim.
  const im = MEDIA_RAW[key];
  if (!im || !im.naturalWidth) return false;
  const ft = plateFoot(key);
  if (!ft) return false;
  let k = 1;
  if (refKey && refKey !== key) {
    const rf = plateFoot(refKey);
    // no reference yet is not a reason to draw nothing — draw him unregistered
    // for the frame or two before it lands, exactly as every other plate here
    // degrades while its art is in flight
    if (rf && rf.area > 0 && ft.area > 0) k = Math.sqrt(rf.area / ft.area);
  }
  const dh = frameH * k, dw = dh * (im.naturalWidth / im.naturalHeight);
  c.save();
  c.translate(cx, base);
  if (flip) c.scale(-1, 1);
  c.drawImage(im, -ft.cx * dw, -ft.y * dh, dw, dh);
  if (NPC_SHEEN.on) npcSheen(c, im, 0, 0, im.naturalWidth, im.naturalHeight, -ft.cx * dw, -ft.y * dh, dw, dh);
  infEyeArt(c, key, 0, -ft.cx * dw, -ft.y * dh, dw, dh);
  c.restore();
  return true;
}

// ---------------------------------------------------------------------------
// THE MACHINE FOLK ARE METAL (owner, 2026-11-14, of Ratchet in his den: "not
// well defined... like scrap of metal blended with the background. It does not
// have its own identity or presence in the screen. The colors are very dull...
// give it the metallic, nice metallic tint... a little bit of shine here and
// there, make it more lively").
//
// Measured first: switching off every full-frame pass (the interior dark, the
// lift, the light pass, the fringe, the bloom) moved his region by a few points
// at most — the room was not what dulled him. His plates and his work strip are
// drawn RAW (see drawSetPlate), while the old NPC sheet always took popArt's
// lift, so the newest art of him was the flattest thing on screen.
//
// Two layers, both render-side, both on the art he already has:
//  - NPC_LOOK, a canvas filter the caller sets around the body: brighter,
//    richer, harder — copper reads as copper and not as the wall behind it;
//  - the SHEEN, drawn here: his own highlights, isolated by a hard contrast and
//    masked by a slow diagonal band, added as light. Shadows stay where they
//    are, so it is shine on the metal and not a wash over the figure.
// The repaint itself (rust patches, a second metal, real speculars) is a plate
// job — ART_QUEUE §2r-ii — and this keeps working over whatever it delivers.
// Skipped where canvas has no filter (older Safari) and below the quality dial's
// glow floor, so a struggling phone pays nothing for it.
const NPC_LOOK = 'brightness(1.16) saturate(1.35) contrast(1.14)';
// ONCE THE PAINT IS RICH, THE FILTER STEPS BACK (2026-11-15). Ratchet's plates
// were repainted as metal — a second and third material, rust, real speculars
// (ART_QUEUE §2r-ii) — and the look that rescued one flat copper overcooks that:
// measured in his den, the belly plate clipped to a single orange and the steel
// pack went warm. A repainted machine keeps a touch of lift against the room's
// dark and a quieter travelling shine; the others keep the full look until their
// own repaint lands, and move into this table when it does.
const NPC_LOOK_PAINTED = { ratchet: 'brightness(1.06) saturate(1.05) contrast(1.05)' };
const NPC_SHEEN_K = 0.42, NPC_SHEEN_K_PAINTED = 0.26;
function npcLook(kind) { return NPC_LOOK_PAINTED[kind] || NPC_LOOK; }
const NPC_SHEEN = { on: false, t: 0, k: NPC_SHEEN_K, cv: null };
function npcSheen(c, im, sx, sy, sw, sh, dx, dy, dw, dh) {
  if (typeof c.filter !== 'string') return;
  const W = Math.ceil(Math.abs(dw)), H = Math.ceil(Math.abs(dh));
  if (W < 2 || H < 2 || W > 1024 || H > 1024) return;
  let cv = NPC_SHEEN.cv;
  if (!cv) cv = NPC_SHEEN.cv = document.createElement('canvas');
  if (cv.width < W) cv.width = W;
  if (cv.height < H) cv.height = H;
  const x = cv.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  x.clearRect(0, 0, W, H);
  // highlights only: a hard contrast sends the dark half of the body to black,
  // which adds nothing under 'lighter'
  x.filter = 'brightness(1.45) contrast(2.4) saturate(0.75)';
  x.drawImage(im, sx, sy, sw, sh, 0, 0, W, H);
  x.filter = 'none';
  // the band crosses the body every 3.4s, a quarter of the time in view; the
  // floor of 0.3 keeps every highlight a little hot between passes
  const ph = ((NPC_SHEEN.t % 3.4) / 3.4) * 2.4 - 0.7;
  const g = x.createLinearGradient(W * (ph - 0.45), 0, W * (ph + 0.45), H * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0.3)');
  g.addColorStop(0.5, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0.3)');
  x.globalCompositeOperation = 'destination-in';
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  c.save();
  c.filter = 'none';
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha *= NPC_SHEEN.k;
  c.drawImage(cv, 0, 0, W, H, dx, dy, dw, dh);
  c.restore();
}

// ---------------------------------------------------------------------------
// SOUND, IN TWO WAVES.
//
// This used to open all 36 audio requests on the same frame as the first tap —
// 1.18 MB, and six of them guaranteed 404s (the NPC hum override slots, which
// are empty by design). Bytes were never the problem; SIMULTANEITY was. A phone
// on a slow link opening three dozen sockets at once finishes all of them later
// than it would finish the six that matter, and the six that matter are the
// only ones needed in the first minute of play.
//
// So: her voice and the impacts go out immediately, and the rest — the six
// guardian roars, the ending takes, the hum override slots — drain a few at a
// time behind them. Nothing is ever permanently absent: playBuf() pulls a
// missing buffer forward on first use, and until it lands sfx() falls through
// to the synthesised version of the same sound, which is the fallback the whole
// audio engine is already built on.
//
// The optional slots stay in the SECOND wave on purpose. They are expected to
// 404, and a 404 that happens forty seconds in costs nothing; six of them
// racing the player's first hit sound cost something.
const AUDIO_CORE = [
  'hit1', 'hit2', 'metal', 'explosion', 'laser', 'zap',
  'hzd_atk1', 'hzd_atk2', 'hzd_atk3', 'hzd_hurt', 'hzd_hurtbad', 'hzd_die',
  'hzd_dash', 'hzd_djump', 'hzd_land', 'hzd_heal', 'hzd_jump', 'hzd_charge',
  'hzd_release', 'hzd_evo',
];
// AN OGG, OR ITS AAC COPY WHERE OGG CANNOT PLAY. iOS before 18.4 decodes no Ogg
// at all and says so only by rejecting the decode, which the loader below (and
// an <audio> element's error event) swallows: every recorded effect fell back
// to its synth stand-in and every NPC line was silent, on most iPhones, with no
// error anywhere. tools/aactier.cjs derives one .m4a per .ogg; this hands it
// out only when the device itself says it cannot play Ogg Vorbis.
let OGG_OK = null;
function oggOK() {
  if (OGG_OK == null) {
    try { OGG_OK = document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"') !== ''; }
    catch (e) { OGG_OK = true; }
  }
  return OGG_OK;
}
function audioSrc(p) {
  if (typeof p !== 'string' || !/\.ogg$/i.test(p) || oggOK()) return p;
  const tier = typeof window !== 'undefined' && window.AAC_TIER;
  return (tier && tier[p]) || p;
}
const MBUF_PEND = {};
function mediaAudio(k) {
  if (MBUF[k] || MBUF_PEND[k] || !MEDIA_SRC.audio[k]) return;
  if (typeof AC === 'undefined' || !AC) return;
  MBUF_PEND[k] = 1;
  fetch(audioSrc(MEDIA_SRC.audio[k]))
    .then(r => r.arrayBuffer())
    .then(b => AC.decodeAudioData(b))
    .then(buf => { MBUF[k] = buf; })
    .catch(() => {});
}
let mediaAudioLoaded = false;
function loadMedia() {
  if (mediaAudioLoaded || typeof AC === 'undefined' || !AC) return;
  mediaAudioLoaded = true;
  for (const k of AUDIO_CORE) mediaAudio(k);
  const rest = [];
  for (const k in MEDIA_SRC.audio) if (!MBUF_PEND[k]) rest.push(k);
  // four at a time, a third of a second apart: the tail is fully in memory
  // about a second and a half later, without ever being in competition with
  // the sounds the player can already trigger
  const drain = () => {
    for (let i = 0; i < 4 && rest.length; i++) mediaAudio(rest.shift());
    if (rest.length) setTimeout(drain, 320);
  };
  setTimeout(drain, 320);
}
