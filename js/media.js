// CLAWBYTE — media manager: CC0 image/audio assets (see assets/CREDITS.md)
// Multi-file mode loads from assets/…; the single-file build injects
// window.EMBEDDED_MEDIA with data: URIs and these paths are overridden.
const MEDIA_SRC = {
  images: {
    bgFar: 'assets/backgrounds/sci_fi_bg1.jpg',
    bgMid: 'assets/backgrounds/scifi_platform_BG1.jpg',
    indFar: 'assets/backgrounds/ind_far.webp',
    indMid: 'assets/backgrounds/ind_mid.webp',
    indFg: 'assets/backgrounds/ind_fg.webp',
    heroIdle: 'assets/characters/gothic-hero-idle.png',
    heroRun: 'assets/characters/gothic-hero-run.png',
    heroJump: 'assets/characters/gothic-hero-jump.webp',
    heroAtk: 'assets/characters/gothic-hero-attack.png',
    houndRun: 'assets/characters/hell-hound-run.webp',
    houndIdle: 'assets/characters/hell-hound-idle.png',
    ghost: 'assets/characters/ghost-idle.webp',
    skull: 'assets/characters/fire-skull.png',
    beast: 'assets/characters/hell-beast-idle.png',
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
    // THE PACK. The first thing in the game that is ALIVE rather than
    // industrial — three plates for the wolf and three for the one that leads
    // it, keyed off black by tools/blackkey.cjs so each has real alpha.
    //
    // Three and not two: a wolf's whole read is coil-then-pounce, and the
    // pounce happens in the air where a grounded plate cannot go. Rest, coil,
    // lunge — one per phase of the only move it has.
    wolfRest: 'assets/characters/beasts/wolf.webp',
    // ...and the two WALK frames, because a plate that slides is a wolf on
    // treads. See wolfPose(): the cycle is driven by ground travelled.
    wolfWalkA: 'assets/characters/beasts/wolf_walka.webp',
    wolfWalkB: 'assets/characters/beasts/wolf_walkb.webp',
    wolfCoil: 'assets/characters/beasts/wolf_coil.webp',
    wolfLunge: 'assets/characters/beasts/wolf_lunge.webp',
    // NINE PLATES FOR THE ALPHA, one per state, because it has five skills and
    // two of them have their own recovery. A boss with five moves sharing two
    // drawings is a boss with two moves as far as the player's eye is concerned.
    alphaRest: 'assets/characters/beasts/alpha.webp',        // prowling
    alphaRoar: 'assets/characters/beasts/alpha_roar.webp',   // the stunning roar
    alphaHowl: 'assets/characters/beasts/alpha_howl.webp',   // calling the betas
    alphaLeap: 'assets/characters/beasts/alpha_leap.webp',   // the spiral, airborne
    alphaClaw: 'assets/characters/beasts/alpha_claw.webp',   // the swipe
    alphaBite: 'assets/characters/beasts/alpha_bite.webp',   // the bite lands
    alphaClinch: 'assets/characters/beasts/alpha_clinch.webp', // ...and worries it
    alphaRecoil: 'assets/characters/beasts/alpha_recoil.webp', // landed a hit — kicks back
    alphaTurn: 'assets/characters/beasts/alpha_turn.webp',   // missed — spins to face her
    alphaFree: 'assets/characters/beasts/alpha_free.webp',   // after it yields
    // THE FLORA. Two species per kingdom, generated in 3D and keyed off black,
    // so a room reads as somewhere that GROWS things rather than as a corridor
    // with a vista behind it. Fetched when she walks into the zone, never at
    // boot — see floraPreload().
    floraA1: 'assets/characters/flora/a1.webp',   // scrap-meadow bloom
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
    // GATE SHAPES (§2f) — one monumental doorway per kingdom, no two the
    // same shape, and none of them a rectangle. The CITY gate is gate_city
    // above: the one epic multilayer monument, deliberately not re-fired.
    gateFoundry: 'assets/backgrounds/gate_foundry.jpg',
    gateArchives: 'assets/backgrounds/gate_archives.jpg',
    gateConduits: 'assets/backgrounds/gate_conduits.jpg',
    gateNest: 'assets/backgrounds/gate_nest.jpg',
    gateDeep: 'assets/backgrounds/gate_deep.jpg',
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
    sageCoil: 'assets/characters/sage/coil.webp',
    sageLunge: 'assets/characters/sage/lunge.webp',
    sageGather: 'assets/characters/sage/gather.webp',
    sageLock: 'assets/characters/sage/lock.webp',
    sagePure: 'assets/characters/sage/pure.webp',
    // THE ROBOT BAT (§2d) — five authored states replacing drawBat's
    // procedural body. hang is the only one with its optic dark.
    batHang: 'assets/characters/bat/hang.webp',
    batShiver: 'assets/characters/bat/shiver.webp',
    batDive: 'assets/characters/bat/dive.webp',
    batFlapUp: 'assets/characters/bat/flap_up.webp',
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
    // drawTinkerForge fetches forgeFront, wolves.js resolves wolfRunA, and so
    // on — so these entries are what switch the authored art on. Lazy like
    // everything else; each renderer keeps its procedural fallback for the
    // frames before the file lands.
    //
    // §1b-i the crystal slash light-sheets. BLACK-FIELD, additive: they are
    // drawn with 'lighter' where brightness IS the alpha, exactly like the
    // rake sheet, so they must never be alpha-keyed.
    slashH: 'assets/fx/slash_h.webp',
    slashD: 'assets/fx/slash_d.webp',
    slashU: 'assets/fx/slash_u.webp',
    slashDn: 'assets/fx/slash_dn.webp',
    // §1c the back-jet gear: the pack as equipment, and at full burn. The
    // plume itself stays procedural additive light (§0.0).
    jetpack: 'assets/characters/gear/jetpack.webp',
    jetpackFire: 'assets/characters/gear/jetpack_fire.webp',
    // §2j Servo's winch, and §2r the Tinker's bench — objects, not vistas.
    winchHouse: 'assets/backgrounds/winch_house.webp',
    forgeTable: 'assets/backgrounds/forge_table.webp',
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
    // §3m boss motion — a travel pose and a wind-up per guardian. MOTHER-V is
    // stationary and exempt.
    nullfangWalk: 'assets/characters/guardians/nullfang_walk.webp',
    nullfangCoil: 'assets/characters/guardians/nullfang_coil.webp',
    glaciereTravel: 'assets/characters/guardians/glaciere_travel.webp',
    glaciereCoil: 'assets/characters/guardians/glaciere_coil.webp',
    choirDrift: 'assets/characters/guardians/choir_drift.webp',
    choirClench: 'assets/characters/guardians/choir_clench.webp',
    talonhostGlide: 'assets/characters/guardians/talonhost_glide.webp',
    talonhostStrike: 'assets/characters/guardians/talonhost_strike.webp',
    prismStalk: 'assets/characters/guardians/prism_stalk.webp',
    prismCoil: 'assets/characters/guardians/prism_coil.webp',
    // §2q the beast RUN pairs — reach and gather. js/wolves.js already
    // resolves these names and falls back to the walk pair without them.
    wolfRunA: 'assets/characters/beasts/wolf_runa.webp',
    wolfRunB: 'assets/characters/beasts/wolf_runb.webp',
    cheetahRunA: 'assets/characters/beasts/cheetah_runa.webp',
    cheetahRunB: 'assets/characters/beasts/cheetah_runb.webp',
    // NPC DIALOGUE BUSTS, cut from npc_6yaw.png by tools/npcbusts.cjs. They
    // exist so drawDialog can show the SPEAKER's face instead of always
    // drawing HZD-99's (owner 2026-08-16).
    bustServo: 'assets/characters/npc/bust/servo.webp',
    bustRatchet: 'assets/characters/npc/bust/ratchet.webp',
    bustMono: 'assets/characters/npc/bust/mono.webp',
    bustPatch: 'assets/characters/npc/bust/patch.webp',
    bustSage: 'assets/characters/npc/bust/sage.webp',
    bustLumen: 'assets/characters/npc/bust/lumen.webp',
    // ===================================================================
    // §2s TERRAIN DEPTH PLANES — the authored answer to a floor that reads as a
    // bar. edge_ is the band she stands on and draws behind the cast; fore_
    // crosses in front of her. Named per zone; a zone without a pair simply
    // draws nothing, which is the same fallback every other plate takes.
    edgeA: 'assets/backgrounds/edge_a.webp',
    foreA: 'assets/backgrounds/fore_a.webp',
    edgeC: 'assets/backgrounds/edge_c.webp',
    foreC: 'assets/backgrounds/fore_c.webp',
    boothFront: 'assets/backgrounds/booth_front.webp',
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
    ratchetLoop: 'assets/characters/npc/ratchet/work_loop.webp',
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
    swingClaw1: 'assets/characters/hero/swing/claw_1.webp',
    swingClaw2: 'assets/characters/hero/swing/claw_2.webp',
    swingFinisher: 'assets/characters/hero/swing/finisher.webp',
    swingBurst: 'assets/characters/hero/swing/burst.webp',
    servoLoop: 'assets/characters/npc/servo/work_loop.webp',
    monoLoop: 'assets/characters/npc/mono/work_loop.webp',
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
    // HER FULL 8-YAW TURNAROUND — the sheet the back plates were bred from,
    // in the manifest at last because the gate walk turns her THROUGH it now:
    // profile (col 0/4), three-quarter back (col 5/3), full back (col 6).
    heroYaw: 'assets/characters/hzd_8yaw.webp',
    heroYawBare: 'assets/characters/hzd_8yaw_bare.webp',
    heroBackA: 'assets/characters/hero/backwalk_a.webp',
    heroBackB: 'assets/characters/hero/backwalk_b.webp',
    heroBareBackA: 'assets/characters/hero/bare_bwalk_a.webp',
    heroBareBackB: 'assets/characters/hero/bare_bwalk_b.webp',
    swordGround: 'assets/characters/hero/sword_ground.webp',
    // THE CHEETAH LINE — the second animal, for the kingdoms past the meadow.
    // No alpha, nothing to tame: these came off the same line as the wolves and
    // whatever was in them is gone. Three plates, same grammar as the wolf.
    cheetahRest: 'assets/characters/beasts/cheetah.webp',
    cheetahWalkA: 'assets/characters/beasts/cheetah_walka.webp',
    cheetahWalkB: 'assets/characters/beasts/cheetah_walkb.webp',
    cheetahWarn: 'assets/characters/beasts/cheetah_warn.webp',
    cheetahRun: 'assets/characters/beasts/cheetah_run.webp',
    // (the §2q RUN pairs, the §3m guardian motion plates, the §2r forge
    // table and the Mind Node monument are registered in the fired-plates
    // section above — both sessions wired the same batch and this comment
    // marks the dedupe, so nobody re-adds them here.)
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
    driller: 'assets/characters/driller_12x6.webp',
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
    strataRubble: 'assets/backgrounds/strata_rubble.jpg',
    strataIceA: 'assets/backgrounds/strata_iceA.jpg',
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
    boss: 'assets/music/epic_combat.ogg',
    ambient: 'assets/music/ambient_observing_the_star.ogg',
  }, (typeof window !== 'undefined' && window.MUS_FILES) || {}),
  audio: {
    hz_swing1: 'assets/sfx/hz_swing1.ogg',
    hz_swing2: 'assets/sfx/hz_swing2.ogg',
    hz_fin: 'assets/sfx/hz_fin.ogg',
    hz_burst: 'assets/sfx/hz_burst.ogg',
    hz_dash: 'assets/sfx/hz_dash.ogg',
    hz_charge: 'assets/sfx/hz_charge.ogg',
    hz_ready: 'assets/sfx/hz_ready.ogg',
    hz_jump: 'assets/sfx/hz_jump.ogg',
    hz_land: 'assets/sfx/hz_land.ogg',
    hz_evosting: 'assets/sfx/hz_evosting.ogg',
    hz_winsting: 'assets/sfx/hz_winsting.ogg',
    hz_step1: 'assets/sfx/hz_step1.ogg',
    hz_step2: 'assets/sfx/hz_step2.ogg',
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
  // the tile layer is baked once per room — a sheet that lands after that
  // first render would never appear, so force a repaint when art arrives
  if (k === 'platforms' || k === 'strataRubble' || k === 'strataIceB' || k === 'strataLava') {
    try { tileDirty = true; } catch (e) {}
  }
}
function mediaLow(k) {
  const L = (typeof window !== 'undefined') && window.LOWRES;
  if (!L || !L[k] || MEDIA_RAW[k] || MEDIA_LOW[k]) return;
  MEDIA_LOW[k] = 1;
  const im = new Image();
  im.onload = () => {
    if (MEDIA_RAW[k]) return;              // the full one won the race
    MEDIA_RAW[k] = im; MEDIA_LOW[k] = 2;
    mediaDirty(k);
  };
  im.onerror = () => { MEDIA_LOW[k] = 0; };  // no webp on this browser: no loss
  im.src = L[k];
}
// `urgent` means SOMETHING IS DRAWING THIS RIGHT NOW — the lazy map's own
// accessor sets it. Only then is the small copy worth a second request; the
// prefetcher has time and asks for full size directly.
function mediaFetch(k, urgent) {
  if (urgent) mediaLow(k);
  if (MEDIA_RAW[k] && MEDIA_LOW[k] !== 2) return;   // a stand-in still wants the real one
  if (MEDIA_PEND[k] || !MEDIA_SRC.images[k]) return;
  MEDIA_PEND[k] = 1;
  const im = new Image();
  im.onload = () => {
    const wasLow = MEDIA_LOW[k] === 2;
    MEDIA_RAW[k] = im; MEDIA_LOW[k] = 3;
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
  im.src = MEDIA_SRC.images[k];
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
// `driller` is deliberately NOT in here any more. Nothing in the CLAWBYTE build
// draws it — the legacy procedural bosses are unreachable (see Boss.draw) — so
// preloading it spent a request on a sprite sheet whose only remaining job was
// to occasionally appear instead of the right creature.
['roster', 'npcs', 'platforms', 'slashFx'].forEach(mediaFetch);
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

function popArt(key, src, lift) {
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
      const id = x.getImageData(0, 0, cv.width, cv.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]];
      }
      x.putImageData(id, 0, 0);
    }
    cv.naturalWidth = cv.width; cv.naturalHeight = cv.height;
    out = cv;
  } catch (e) {}                                           // tainted: ship it raw
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
function drawStripCell(c, key, cell, cells, cx, base, h, flip) {
  mediaFetch(key);
  const im = MEDIA_RAW[key];
  if (!im || !im.naturalWidth) return false;
  const cw = im.naturalWidth / cells, ch = im.naturalHeight;
  const i = ((cell % cells) + cells) % cells;
  const dw = h * (cw / ch);
  c.save();
  c.translate(cx, base);
  if (flip) c.scale(-1, 1);
  c.drawImage(im, i * cw, 0, cw, ch, -dw / 2, -h, dw, h);
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
  c.restore();
  return true;
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
const MBUF_PEND = {};
function mediaAudio(k) {
  if (MBUF[k] || MBUF_PEND[k] || !MEDIA_SRC.audio[k]) return;
  if (typeof AC === 'undefined' || !AC) return;
  MBUF_PEND[k] = 1;
  fetch(MEDIA_SRC.audio[k])
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
