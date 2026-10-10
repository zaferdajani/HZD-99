// What tools/eyemap.cjs measures: every piece of art a HOSTILE body is drawn
// from, with the colour its eye glows in and where on the body an eye can be.
//
//   key     the name js/infection-eyes.js looks the eye up by (infEyeArt)
//   img     the media key, when it differs from `key`
//   table/fig   a figure cut from a parts atlas (EAGLE_P, GLC_P, DRG_P, MVA)
//   cells / cols, rows, onlyRows    how the image is divided
//   col     colour families of the eye's glow: red|orange|amber|purple|cyan|white
//   rule    front  — profile facing LEFT: the glow nearest the snout tip
//           frontR — profile facing RIGHT
//           top    — seen front-on: the highest glow (and its partner)
//           core   — the body IS the eye (a core): the largest glow
//           none   — this cell has no eye to anchor (back views)
//   region  [x0,y0,x1,y1] fractions of the silhouette's box an eye may be in
//   eyes    how many to keep (default 1 in profile, 2 front-on)
//   at      {cell: [x,y,...]} hand-placed points that override detection —
//           used only where the art's eye does not glow, and said so below
const P = { col: 'red', rule: 'front' };
const strips = (keys, o) => keys.map(k => Object.assign({ key: k }, P, o || {}));
module.exports = [
  // ---- the pack ------------------------------------------------------------
  // the filmed pack (2026-10-09): every hostile state. The purify and sit
  // strips are the TAMED wolf, which has no infection and so no anchor.
  ...strips(['wolfIdle6', 'wolfProwl8', 'wolfGallop6', 'wolfCoil6', 'wolfBite6', 'wolfCrouch4',
             'wolfLeap6', 'wolfLanding4', 'wolfRecoil6', 'wolfPant6'], { region: [0, 0, 0.45, 0.6] }),
  // cheetahWarn: crouched so low the forepaw sits nearer the snout tip than
  // the eye does — placed from a grid render; cheetahRun (silver, unused by
  // the drawing code) has no lit eye and is placed the same way
  { key: 'cheetahWarn', col: 'red', rule: 'front', at: { 0: [0.10, 0.33] } },
  { key: 'cheetahRun', col: 'red', rule: 'front', at: { 0: [0.33, 0.16] } },
  ...strips(['cheetahRest',
             'cheetahWalk8', 'cheetahRun6', 'cheetahWinded6', 'cheetahLand4'], { col: 'red|orange|amber', region: [0, 0, 0.45, 0.6] }),
  // ---- the Alpha (a guardian: purple at runtime, whatever the art paints) ----
  // the pack's breed, filmed 2026-10-10 (ALPHA_STRIP): its eyes and seams glow
  // VIOLET in the art itself now. The strips do not carry their cell count in
  // their names. The yield's lying-down cells are the Alpha turning friendly.
  ...[['alRest', 9], ['alProwl', 16], ['alRoar', 12], ['alHowl', 12], ['alLeap', 9], ['alAir', 6], ['alClaw', 12],
      ['alBite', 12], ['alClinch', 12], ['alYield', 12]].map(([k, n]) =>
    ({ key: k, cells: n, col: 'purple', rule: 'front', region: [0, 0, 0.45, 0.7], fill: true,
       // the violet collar seam glows as bright as the eye when the roar
       // throws the head back: two cells picked the collar (checked large)
       // the clinch's lunge drops the head faster than a neighbour can follow:
       // its four lunge cells are placed from a 10% grid render
       at: k === 'alRoar' ? { 7: [0.105, 0.135], 9: [0.105, 0.13] }
         : k === 'alClinch' ? { 1: [0.22, 0.31], 2: [0.135, 0.44], 3: [0.125, 0.50], 4: [0.10, 0.48] } : undefined })),
  // ---- the Eye's constructs (drawMini) — placed from a grid render: the
  // chime's lens, the courier's camera, the moth's head, the lattice's core,
  // the lens's pupil. Their wind-up plates are separate drawings, placed alone.
  { key: 'eyeChime', col: 'white', rule: 'top', at: { 0: [0.586, 0.277] } },
  { key: 'eyeChimeW', col: 'white', rule: 'top', at: { 0: [0.63, 0.21] } },
  { key: 'eyeCarrier', col: 'white', rule: 'front', at: { 0: [0.176, 0.55] } },
  { key: 'eyeCarrierW', col: 'white', rule: 'front', at: { 0: [0.75, 0.76] } },
  { key: 'eyeMoth', col: 'white', rule: 'top', at: { 0: [0.507, 0.354] } },
  { key: 'eyeMothW', col: 'white', rule: 'top', at: { 0: [0.505, 0.40] } },
  { key: 'eyeLattice', col: 'white', rule: 'core', at: { 0: [0.496, 0.457] } },
  { key: 'eyeLatticeW', col: 'white', rule: 'core', at: { 0: [0.45, 0.41] } },
  { key: 'eyeLens', col: 'white', rule: 'core', at: { 0: [0.551, 0.473] } },
  { key: 'eyeLensW', col: 'white', rule: 'core', at: { 0: [0.617, 0.462] } },
  // CHIME's filmed moves: the lens at the centre of the housing — placed per
  // cell from a grid render (detection takes the housing's rim highlight)
  { key: 'chRest', cells: 9, col: 'cyan|white', rule: 'top', at: Object.fromEntries([...Array(9).keys()].map(i => [i, [0.53, 0.28]])) },
  { key: 'chRing', cells: 12, col: 'cyan|white', rule: 'top', at: { 0: [0.50, 0.63], 1: [0.50, 0.62], 2: [0.51, 0.66], 3: [0.52, 0.66],
    4: [0.51, 0.66], 5: [0.51, 0.66], 6: [0.50, 0.66], 7: [0.52, 0.65], 8: [0.50, 0.66], 9: [0.49, 0.64], 10: [0.49, 0.63], 11: [0.50, 0.62] } },
  { key: 'chNote', cells: 12, col: 'cyan|white', rule: 'top', at: Object.fromEntries([...Array(12).keys()].map(i => [i, [0.55, 0.52]])) },
  // ---- the roster's filmed walks -------------------------------------------
  { key: 'guardWalk8', col: 'red', rule: 'front', aspect: 4.5, region: [0, 0, 0.6, 0.5] },
  // the blob's lava seams are red too, and its lens barely moves through the
  // crawl (measured on cells 0 and 4): placed
  { key: 'blobCrawl8', rule: 'none', at: Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7].map(i => [i, [0.22, 0.67]])) },
  // ---- the roster turntable: blob, flier, turret (the crawler and hopper rows
  // are drawn by nothing — those two are always the pack or the cheetahs) ---
  // 8 angles: 0 faces right, 2 faces the camera, 4 faces left, 5-7 the back
  // Too many things on these sheets glow red — the blob's lava, the flier's
  // whole lens, the turret's coils — for detection to be trusted, so every
  // angle the renderer reaches (0-4) is PLACED, read off a 10% grid render of
  // the cell. Angles 5-7 are the back and are never drawn. The turret's red
  // lens shows only from angle 1; the other angles hide it and get none.
  { key: 'roster', cols: 8, rows: 11, onlyRows: [3, 4, 5], col: 'red', rule: 'none', at: {
    24: [0.28, 0.51], 25: [0.34, 0.49], 26: [0.48, 0.52], 27: [0.55, 0.49], 28: [0.52, 0.56],   // blob
    32: [0.34, 0.43], 33: [0.46, 0.46], 34: [0.52, 0.46], 35: [0.50, 0.48], 36: [0.40, 0.46],   // flier
    41: [0.13, 0.33] } },                                                                         // turret
  { key: 'npcs', cols: 6, rows: 8, onlyRows: [6], col: 'red', aspect: 4.5,
    colRule: { 0: 'frontR', 1: 'none', 2: 'top', 3: 'front', 4: 'front', 5: 'none' }, region: [0, 0, 1, 0.6],
    at: { 38: [0.46, 0.26] } },
  // ---- the cave bat --------------------------------------------------------
  ...strips(['batFlapUp', 'batFlapDn', 'batFlight6'], { col: 'orange|amber|red', region: [0, 0.1, 0.6, 0.9] }),
  { key: 'batDive', col: 'orange|amber|red', rule: 'frontR', region: [0.4, 0, 1, 1] },
  ...strips(['batHang', 'batShiver'], { col: 'orange|amber|red', rule: 'top', eyes: 1 }),
  // ---- the flying minion and TALONHOST: front-on, head in the middle -------
  // the mini's head is the bright cluster left of the body; its shoulders
  // carry red lenses too, so the head is PLACED per cell from grid renders
  { key: 'talonMiniCruise8', col: 'red', rule: 'none', at: { 0: [0.32, 0.72], 1: [0.32, 0.70], 2: [0.31, 0.68],
    3: [0.33, 0.65], 4: [0.33, 0.65], 5: [0.34, 0.63], 6: [0.32, 0.66], 7: [0.34, 0.66] } },
  { key: 'talonMiniChase6', col: 'red', rule: 'none', at: { 0: [0.30, 0.71], 1: [0.30, 0.70], 2: [0.31, 0.67],
    3: [0.30, 0.66], 4: [0.30, 0.67], 5: [0.31, 0.69] } },
  { key: 'talonMiniPerch', col: 'red', rule: 'front', region: [0, 0, 0.45, 0.5] },
  // TALONHOST's eyes are the two holes in its white skull mask; the mount,
  // shoulders and chest core all glow red too, so the figures are placed
  ...Object.entries({ pIdle: [0.46, 0.31, 0.54, 0.31], pDown: [0.46, 0.30, 0.54, 0.30], pUp: [0.49, 0.43],
      pShoot: [0.47, 0.29, 0.53, 0.29], kCharge: [0.47, 0.31, 0.53, 0.31], kFire: [0.47, 0.33, 0.53, 0.33],
      kRecover: [0.47, 0.34, 0.53, 0.34], pRest: [0.47, 0.27, 0.53, 0.27] }).map(([f, pts]) =>
    ({ key: 'eagleParts:' + f, img: 'eagleParts', table: 'EAGLE_P', fig: f, rule: 'none', at: { 0: pts } })),
  // ---- the sage duelist: amber eyes in a hood --------------------------------
  ...strips(['sageStand', 'sageCoil', 'sageLunge', 'sageGather', 'sageLock'],
    { col: 'amber|orange|red', rule: 'top', eyes: 2, region: [0, 0, 1, 0.35] }),
  // the walk and the exhale were filmed with the eyes unlit inside the hood:
  // placed by the head, the same drop below the hood's crown as the stand
  ...strips(['sageWalk8'], { rule: 'hood', hoodY: 0.085 }),
  ...strips(['sageExhale'], { rule: 'hood', hoodY: 0.10 }),
  // ---- the kingdom machines --------------------------------------------------
  // Rooted machines with no face. Each has one sensor that reads as its eye
  // — the breaker's window, the kiln's mouth, the rime's cap, the snare's
  // core — and the infection looks out through that. Placed from grid renders.
  ...[['breakerRest', 0.62, 0.55], ['breakerTell', 0.63, 0.58], ['breakerVented', 0.62, 0.58],
      ['kilnRest', 0.50, 0.18], ['kilnTell', 0.50, 0.18], ['kilnSpent', 0.50, 0.22],
      ['rimeRest', 0.50, 0.30], ['rimeTell', 0.50, 0.28], ['rimeDark', 0.50, 0.30],
      ['snareRest', 0.50, 0.45], ['snareTell', 0.53, 0.47], ['snareLimp', 0.47, 0.52]].map(([k, x, y]) =>
    ({ key: k, rule: 'none', at: { 0: [x, y] } })),
  // ---- NULLFANG ----------------------------------------------------------------
  ...[['beastStudioStalk', 24], ['beastGallop', 24], ['beastStudioLeap', 30], ['beastStudioRoar', 30],
      ['beastStudioSwipe', 24], ['beastRearSwipe', 30], ['beastHurt', 12], ['beastFall', 12]].map(([k, n]) =>
    ({ key: k, cells: n, col: 'red|orange|purple', rule: 'front', region: [0, 0, 0.3, 0.6],
       // the pounce's two landing frames bury the face in the mane: placed
       at: k === 'beastStudioLeap' ? { 15: [0.15, 0.50], 24: [0.16, 0.70], 25: [0.15, 0.70] } : null })),
  // ---- GLACIERE (faces left), the FURNACE dragon (faces right) ---------------
  { key: 'glaciereParts:hero', img: 'glaciereParts', table: 'GLC_P', fig: 'hero', col: 'cyan|white|purple|red', rule: 'front', region: [0, 0, 0.45, 0.45] },
  // the horn tip outshines the eye on the walking figure: placed
  { key: 'glaciereParts:asm', img: 'glaciereParts', table: 'GLC_P', fig: 'asm', rule: 'none', at: { 0: [0.05, 0.26] } },
  ...['hero', 'walk', 'fly'].map(f => ({ key: 'dragonParts:' + f, img: 'dragonParts', table: 'DRG_P', fig: f,
    col: 'amber|orange|red', rule: 'frontR', region: [0.55, 0, 1, 0.5] })),
  { key: 'dragonParts:idle', img: 'dragonParts', table: 'DRG_P', fig: 'idle', rule: 'none', at: { 0: [0.80, 0.20] } },
  // ---- MOTHER-V: the core is the eye -------------------------------------------
  ...['coreS', 'coreB', 'coreD'].map(f => ({ key: 'motherParts:' + f, img: 'motherParts', table: 'MVA', fig: f,
    col: 'red|purple|orange|white', rule: 'core', eyes: 1, maxFrac: 0.6, aspect: 9 })),
  // ---- PRISM PROWLER: every frame of her sheet (nose RIGHT) -------------------
  // PRISM PROWLER's sheet is a loose collage of frames (PRZ_FR): her eyes are
  // red slits in a white mask beside red crystals, which no detector separates
  // reliably. Every INFECTED frame is placed from a grid render; the blue
  // frames are her purified self (no infection, no eyes to anchor), and the
  // burst and vortex frames have no face.
  { key: 'prismParts', rects: 'PRZ_FR', rule: 'none', atRect: {
    '702,739': [0.86, 0.52], '543,739': [0.78, 0.52], '592,165': [0.73, 0.34, 0.81, 0.34],
    '425,295': [0.65, 0.26, 0.73, 0.26], '849,295': [0.69, 0.36, 0.82, 0.36], '573,295': [0.70, 0.40, 0.81, 0.40],
    '317,295': [0.83, 0.42], '834,165': [0.68, 0.35, 0.78, 0.35], '700,165': [0.85, 0.45],
    '124,526': [0.73, 0.29, 0.83, 0.29], '166,295': [0.74, 0.46, 0.82, 0.46], '693,295': [0.71, 0.43, 0.80, 0.42],
    '356,414': [0.75, 0.36, 0.82, 0.36], '583,635': [0.74, 0.32, 0.81, 0.32], '210,2': [0.78, 0.25],
    '506,2': [0.82, 0.22], '695,2': [0.76, 0.24], '2,2': [0.45, 0.42], '330,2': [0.80, 0.52],
    '396,165': [0.86, 0.45], '2,835': [0.08, 0.62] } },
  // ---- the NOSTOS creatures (hero world) ---------------------------------------
  // pixel-art NOSTOS creatures: the eye is a single cyan pixel cluster, too
  // small for the detector at their size — placed, and the cells between the
  // placed ones take the nearest placed point (fill), since a run is continuous
  { key: 'houndRun', cells: 5, rule: 'none', fill: true, at: { 0: [0.30, 0.26], 2: [0.22, 0.40], 4: [0.22, 0.39] } },
  { key: 'houndIdle', cells: 6, rule: 'none', fill: true, at: { 0: [0.25, 0.34], 3: [0.18, 0.42] } },
  { key: 'ghost', cells: 7, rule: 'none', fill: true, at: { 0: [0.50, 0.40], 3: [0.50, 0.42] } },
  { key: 'skull', cells: 12, col: 'red|orange|amber|cyan|white', rule: 'top', eyes: 2, fill: true,
    at: { 0: [0.40, 0.53], 6: [0.44, 0.53] } },
];
