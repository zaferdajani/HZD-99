// ===========================================================================
// THE STORY PANELS — the approved manhwa, played at the moments it draws.
//
// Owner's order (2026-10-09): "USE THE EXISTING MANHWA AT STORY MOMENTS ...
// Preserve their chronology, character identity and story meaning. Do not
// silently use superseded pages or invent events to fit available pictures."
//
// So this is a small player for CROPS of the approved second-edition pages
// (assets/manhua/ch1/pNN.webp, docs/MANHUA.md, ed.2), never of the draft set
// in assets/manhua/revised-2026-09/ and never of a panel whose content the
// game now contradicts. Every crop is a rectangle in its page's own pixel
// space; the page is the master (RULE ZERO) and is drawn as authored — the
// only motion is a restrained push or drift of at most 4 %, and reduced motion
// removes even that.
//
// PANEL_SEQ is the event-to-panel map as data; docs/MANHWA_EVENT_MAP.md is the
// same map for people, with the list of panels that are MISSING (an event with
// no suitable approved picture plays nothing rather than something unrelated).
//
// One sequence per story beat, ONCE per save: it is marked seen the moment it
// starts (like the corridor meeting's nfMeet), so a reload cannot replay it,
// and the pause menu's "Story panels" row replays any sequence already seen.
// It never starts mid-fight, over a dialogue/shop/film, or during a room
// crossing — panelsSafe() below — and it never interrupts a room transition:
// arrival triggers wait until the room has settled.
//
// HOOKS for other workstreams: panelsPlay(id) plays a sequence now (exact
// timing, e.g. from a dialogue's onEnd); panelsQueue(id) plays it at the next
// safe moment; panelsBusy() says whether a sequence is on screen.
// ===========================================================================
const PANEL_PG = n => 'assets/manhua/ch1/p' + (n < 10 ? '0' : '') + n + '.webp';
// THE UNLETTERED PAGES (2026-10-10). Every page a sequence crops from also
// exists with its lettering painted out (assets/manhua/ch1/clean/, the same
// page re-drawn through Higgsfield with every box removed, keyed at the
// master's own size so a crop is the same rectangle on either). The panel
// player letters them itself, in the player's language, typed out at the
// reading speed — the baked English could do neither, and two of the pages
// (p09, p18) still carried the superseded "crystal pillar" errand in their
// balloons. The lettered masters stay the manhua reader's pages.
const PANEL_CLEAN = n => 'assets/manhua/ch1/clean/p' + (n < 10 ? '0' : '') + n + '.webp';
// THE PANELS THE APPROVED PAGES NEVER DREW (2026-10-10): single unlettered
// panels made for the game's own chapter one — the marble freed, the
// maintenance door, the sage's revelation, the lion's break and its fight, the
// corrected letter/drawer/repair, the camp hatch, the Conduits — in the
// chapter's style, every recurring body bound to its Higgsfield element.
const PANEL_GAME = name => 'assets/manhua/ch1/game/' + name + '.webp';
const PANEL_FULL = { w: 1600, h: 893 };          // the 16:9 game panels, keyed at 1600 px
const PANEL_CONDUITS = 'assets/backgrounds/gate_conduits.jpg';
// A panel: src (the page master), crop [x, y, w, h] in that page's pixels,
// cap (caption key | null), who (speaker name key), baked (the crop already
// carries the page's own lettering of `cap`), move (in | out | left | right),
// focus [fx, fy] for the push, cond(saveState) for a panel that depends on
// what actually happened, ref (page/panel, for the map document).
const PG_FULL = [0, 0, PANEL_FULL.w, PANEL_FULL.h];
const PANEL_SEQ = [
  { id: 'bay', title: 'pn_s_bay', room: 'W2', prefetch: ['W1', 'W2'],
    event: 'woke — first arrival outside the service bay (W1 → W2)',
    when: f => !!f.woke,
    past: (f, s) => !!f.gateOpened || (!!f.woke && G.roomId !== 'W1'),
    panels: [
      { ref: 'p04 panel 2', src: PANEL_CLEAN(4), crop: [52, 599, 385, 362], cap: null, move: 'in', focus: [0.45, 0.4] },
      { ref: 'p04 panel 3', src: PANEL_CLEAN(4), crop: [461, 599, 685, 362], cap: 'pc_quiet', move: 'in', focus: [0.4, 0.45] },
      { ref: 'p04 panel 5', src: PANEL_CLEAN(4), crop: [52, 1308, 1094, 337], cap: 'pc_door', move: 'in', focus: [0.5, 0.55] },
      { ref: 'p05 panel 1', src: PANEL_CLEAN(5), crop: [400, 33, 762, 341], cap: 'pc_city', move: 'out', focus: [0.3, 0.5] },
    ] },
  { id: 'gate', title: 'pn_s_gate', room: 'A0', prefetch: ['W2', 'A0'],
    event: 'gateOpened — first arrival inside the city gate (W2 → A0)',
    when: f => !!f.gateOpened,
    past: f => !!(f.ratchetRepaired || f['on_A0B|ratchet']),
    panels: [
      { ref: 'p05 panel 3', src: PANEL_CLEAN(5), crop: [38, 722, 1125, 626], cap: 'pc_gates', move: 'out', focus: [0.5, 0.6] },
      { ref: 'p05 panel 4', src: PANEL_CLEAN(5), crop: [38, 1370, 1124, 386], cap: 'pc_closed', move: 'in', focus: [0.5, 0.5] },
    ] },
  // the corrected opening as the game plays it: his own tag, his own battery
  // from his own drawer, the board, and then what he tells her
  { id: 'ratchet', title: 'pn_s_ratchet', room: 'A0B', prefetch: ['A0B'],
    event: "Ratchet's battery restored (ratchetRepaired / on_A0B|ratchet), after his wake talk and errand",
    when: f => !!(f.ratchetRepaired || f['on_A0B|ratchet']) && panelsQuest('ratchet_forge') !== 'none',
    past: f => !!(f.ratchetRepaired || f['on_A0B|ratchet']),
    panels: [
      { ref: 'game: letter', src: PANEL_GAME('letter'), crop: PG_FULL, cap: 'pc_letter', move: 'in', focus: [0.3, 0.45] },
      { ref: 'game: drawer', src: PANEL_GAME('drawer'), crop: PG_FULL, cap: 'pc_drawer', move: 'in', focus: [0.35, 0.6] },
      { ref: 'game: repair', src: PANEL_GAME('repair'), crop: [0, 0, 1344, 752], cap: 'pc_awake', move: 'in', focus: [0.65, 0.35] },
      { ref: 'p09 panel 1', src: PANEL_CLEAN(9), crop: [19, 17, 650, 389], cap: 'pc_necklace', who: 'n_ratchet', move: 'in', focus: [0.5, 0.55] },
      { ref: 'p09 panel 2', src: PANEL_CLEAN(9), crop: [19, 418, 670, 359], cap: 'pc_song', who: 'n_ratchet', move: 'left', focus: [0.6, 0.5] },
    ] },
  { id: 'cave', title: 'pn_s_cave', room: 'CV1', prefetch: ['A5', 'CV1'],
    event: 'first entry into the marble cave (CV1), through the buried mouth under the hub',
    when: () => true,
    past: (f, s) => !!(s.visited && s.visited.CV1) || !!f.pl_cshard || !!f.crystal,
    panels: [
      { ref: 'p15 panel 5', src: PANEL_CLEAN(15), crop: [395, 1200, 770, 558], cap: 'pc_breathing', move: 'in', focus: [0.45, 0.45] },
      { ref: 'p16 panel 1', src: PANEL_CLEAN(16), crop: [69, 74, 690, 427], cap: null, move: 'right', focus: [0.5, 0.5] },
      { ref: 'p16 panel 3', src: PANEL_CLEAN(16), crop: [69, 523, 1068, 305], cap: null, move: 'in', focus: [0.5, 0.6] },
    ] },
  // the marble freed: why the burst matters, and that it is material, not a blade
  { id: 'marble', title: 'pn_s_marble', room: 'CV3', prefetch: ['CV2', 'CV3'],
    event: 'the raw marble freed from its host rock in CV3 (pl_cshard)',
    when: f => !!f.pl_cshard,
    past: f => !!f.crystal,
    panels: [
      { ref: 'game: marble_a', src: PANEL_GAME('marble_a'), crop: PG_FULL, cap: 'pc_m_burst', move: 'in', focus: [0.6, 0.5] },
      { ref: 'game: marble_b', src: PANEL_GAME('marble_b'), crop: PG_FULL, cap: 'pc_m_freed', move: 'in', focus: [0.5, 0.45] },
    ] },
  { id: 'forge', title: 'pn_s_forge', room: 'A0B', prefetch: ['A0B'],
    event: 'the first sword forged from the raw marble (crystal), after the forge film and its card',
    when: f => !!f.crystal,
    past: f => !!f.crystal,
    panels: [
      { ref: 'p18 panel 2', src: PANEL_CLEAN(18), crop: [42, 617, 1114, 355], cap: 'pc_forge', who: 'n_ratchet', move: 'in', focus: [0.55, 0.6] },
      { ref: 'p18 panel 3', src: PANEL_CLEAN(18), crop: [52, 1120, 426, 620], cap: 'pc_blade', move: 'in', focus: [0.45, 0.75] },
      { ref: 'p18 panel 5', src: PANEL_CLEAN(18), crop: [505, 1345, 300, 396], cap: null, move: 'out', focus: [0.5, 0.5] },
    ] },
  // the way to the first sage: the door that opens beside the stump she cut
  { id: 'passage', title: 'pn_s_passage', room: 'GA1T', prefetch: ['CV3', 'GA1T'],
    event: 'first arrival in the maintenance tunnel (GA1T) through the door beside the quarry',
    when: f => !!f.crystal,
    past: (f, s) => !!f.sageTame_GA1D || !!(s.visited && s.visited.GA1D),
    panels: [
      { ref: 'game: passage_a', src: PANEL_GAME('passage_a'), crop: PG_FULL, cap: 'pc_p_door', move: 'in', focus: [0.6, 0.5] },
      { ref: 'game: passage_b', src: PANEL_GAME('passage_b'), crop: PG_FULL, cap: 'pc_p_tunnel', move: 'in', focus: [0.5, 0.5] },
    ] },
  { id: 'meet', title: 'pn_s_meet', room: 'A2', prefetch: ['A1', 'A2'],
    event: "NULLFANG's first appearance — the corridor meeting (nfMeet), once it has left the room",
    when: f => !!f.nfMeet,
    past: f => !!f.nfMeet,
    panels: [
      { ref: 'p14 panel 1', src: PANEL_CLEAN(14), crop: [23, 18, 1154, 334], cap: null, hold: 1.4, move: 'left', focus: [0.5, 0.5] },
      // only if the swipe actually took a core: the interactive meeting can be dodged
      { ref: 'p14 panel 2', src: PANEL_CLEAN(14), crop: [23, 371, 1154, 660], cap: 'pc_core', move: 'in', focus: [0.6, 0.45],
        cond: s => !!s.meetHit },
      { ref: 'p14 panel 3', src: PANEL_CLEAN(14), crop: [48, 1185, 540, 360], cap: null, move: 'right', focus: [0.5, 0.5] },
      { ref: 'p14 panel 4', src: PANEL_CLEAN(14), crop: [605, 1185, 547, 275], cap: 'pc_bored', move: 'right', focus: [0.5, 0.5] },
    ] },
  // the sage's sentence happening in front of her: he resists, the bell wins
  { id: 'break', title: 'pn_s_break', room: 'A2', alsoRoom: 'A3', prefetch: ['A2', 'A3'],
    event: "NULLFANG's break (nfBreak): the purple goes out of him, then the bell writes the order back",
    when: f => !!f.nfBreak && !f.bossChime && !f.bossGlitch,
    past: f => !!(f.bossChime || f.bossGlitch),
    panels: [
      { ref: 'game: break_a', src: PANEL_GAME('break_a'), crop: PG_FULL, cap: 'pc_b_stop', move: 'in', focus: [0.6, 0.45] },
      { ref: 'game: break_b', src: PANEL_GAME('break_b'), crop: PG_FULL, cap: 'pc_b_bell', move: 'in', focus: [0.55, 0.4] },
    ] },
  { id: 'sage', title: 'pn_s_sage', room: 'GA1D', prefetch: ['GA1T', 'GA1D'],
    event: 'the first Sage cleansed (sageTame_GA1D), after its gift card and revelation',
    when: f => !!f.sageTame_GA1D,
    past: f => !!f.sageTame_GA1D,
    panels: [
      { ref: 'p25 panel 3', src: PANEL_CLEAN(25), crop: [20, 562, 1161, 455], cap: 'pc_knelt', move: 'in', focus: [0.3, 0.5] },
      { ref: 'p26 panel 1', src: PANEL_CLEAN(26), crop: [52, 42, 1096, 310], cap: 'pc_cuts', move: 'right', focus: [0.5, 0.5] },
      { ref: 'p26 panel 2', src: PANEL_CLEAN(26), crop: [52, 380, 1097, 605], cap: 'pc_letgo', move: 'in', focus: [0.6, 0.4] },
      { ref: 'p26 panel 3', src: PANEL_CLEAN(26), crop: [52, 1013, 1097, 299], cap: 'pc_cell', move: 'in', focus: [0.65, 0.5] },
      // THE REVELATION — why she keeps losing, and where to go. The bell
      // panel is only true while the bell still rings (sageRevealLines says
      // the same thing in words).
      { ref: 'game: sage_rev', src: PANEL_GAME('sage_rev'), crop: PG_FULL, cap: 'pc_s_point', move: 'in', focus: [0.7, 0.35] },
      { ref: 'game: sage_bell', src: PANEL_GAME('sage_bell'), crop: [0, 0, 1600, 679], cap: 'pc_s_bell', move: 'out', focus: [0.4, 0.4],
        cond: s => !(s.flags && s.flags.bossChime) },
    ] },
  { id: 'chime', title: 'pn_s_chime', room: 'A9', prefetch: ['A8', 'A9'],
    event: 'CHIME silenced (bossChime), once its cell is paid',
    when: f => !!f.bossChime,
    past: f => !!f.bossChime,
    panels: [
      { ref: 'p20 panel 2', src: PANEL_CLEAN(20), crop: [425, 49, 725, 505], cap: 'pc_singing', move: 'in', focus: [0.5, 0.4] },
      { ref: 'p20 panel 4', src: PANEL_CLEAN(20), crop: [425, 1091, 725, 298], cap: 'pc_nobody', move: 'in', focus: [0.45, 0.6] },
      { ref: 'p20 panel 5', src: PANEL_CLEAN(20), crop: [425, 1417, 725, 323], cap: 'pc_made', move: 'in', focus: [0.45, 0.5] },
    ] },
  { id: 'free', title: 'pn_s_free', room: 'A4', prefetch: ['A3', 'A4'],
    event: 'NULLFANG purified (bossGlitch), after the purification film and its rewards',
    when: f => !!f.bossGlitch,
    past: f => !!f.bossGlitch,
    panels: [
      // the fight, on the game's own lion, and the cut that frees rather than kills
      { ref: 'game: fight_a', src: PANEL_GAME('fight_a'), crop: PG_FULL, cap: null, hold: 1.4, move: 'left', focus: [0.5, 0.45] },
      { ref: 'game: fight_b', src: PANEL_GAME('fight_b'), crop: PG_FULL, cap: 'pc_f_cut', move: 'in', focus: [0.5, 0.45] },
      { ref: 'p24 left panel 1', src: PANEL_CLEAN(24), crop: [68, 580, 520, 313], cap: null, move: 'in', focus: [0.6, 0.5] },
      { ref: 'p24 left panel 2', src: PANEL_CLEAN(24), crop: [69, 917, 585, 391], cap: 'pc_oath', move: 'in', focus: [0.55, 0.65] },
    ] },
  // THE TEASER. Before she climbs out of the Meadows, never after: the camp's
  // climb (A3, tiles 17-29) with NULLFANG free, or B1 if she got there first.
  // The hatch is her leaving; the three Conduits panels show the place, the
  // keeper's outline and the talons — shapes and lights, no outcomes.
  { id: 'ch2', title: 'pn_s_ch2', room: 'A3', teaser: true, prefetch: ['A3', 'A4', 'B1'],
    event: 'chapter-two teaser: NULLFANG free and she stands on the climb to the Data Conduits (A3), or first B1 arrival',
    when: f => !!f.bossGlitch && panelsAtClimb(),
    alsoRoom: 'B1',
    past: (f, s) => !!f.bossGlitch && !!(s.visited && s.visited.B1),
    panels: [
      { ref: 'game: hatch', src: PANEL_GAME('hatch'), crop: [0, 0, 1600, 1073], cap: 'pt_hatch', move: 'in', focus: [0.45, 0.3] },
      { ref: 'game: ch2_a', src: PANEL_GAME('ch2_a'), crop: PG_FULL, cap: 'pt_behind', move: 'in', focus: [0.75, 0.75] },
      { ref: 'game: ch2_b', src: PANEL_GAME('ch2_b'), crop: PG_FULL, cap: 'pt_keeper', move: 'in', focus: [0.5, 0.45] },
      { ref: 'game: ch2_c', src: PANEL_GAME('ch2_c'), crop: PG_FULL, cap: 'pt_talons', move: 'out', focus: [0.4, 0.4] },
      { ref: 'title card', src: null, crop: null, cap: 'pt_title', title: true },
    ] },
];
const PANEL_ZOOM = 0.04;          // the most any crop is ever pushed or drifted
const PANEL_XF = 0.45;            // cross-dissolve between panels
const PANEL_TAP = 0.35;           // a press shorter than this is a confirm
const PN = { img: {}, room: null, settle: 0, ready: 0, queue: [], meetCores: null };

function panelsQuest(id) { return typeof qState === 'function' ? qState(id) : 'none'; }
function panelsAtClimb() {
  if (G.roomId !== 'A3' || !player || !player.on) return false;
  const cx = player.x + player.w / 2, feet = player.y + player.h;
  return cx >= 17 * TILE && cx <= 29 * TILE && feet <= 12 * TILE + 4;
}
// the player's choice wins either way (an explicit OFF beats the OS setting);
// until one is made the OS decides — js/reveal.js reduceMotion()
function panelsReduced() { return reduceMotion(); }
function panelsSeq(id) { return PANEL_SEQ.find(s => s.id === id) || null; }
// The save's own record, created on first sight of a save. A sequence whose
// event this save had ALREADY passed is marked past, not played: a player who
// loads a long run on this build is not handed every story beat as a recap.
const PANEL_V1 = ['bay', 'gate', 'ratchet', 'cave', 'forge', 'meet', 'sage', 'chime', 'free', 'ch2'];
function panelsState() {
  const sv = G.save;
  if (!sv) return null;
  if (!sv.panels || typeof sv.panels !== 'object') {
    const f = sv.flags || {};
    sv.panels = { v: 1, seen: {}, past: {}, n: 0 };
    for (const s of PANEL_SEQ) if (s.past(f, sv)) sv.panels.past[s.id] = 1;
  }
  sv.panels.seen = sv.panels.seen || {}; sv.panels.past = sv.panels.past || {};
  // A SEQUENCE THIS SAVE HAS NEVER HEARD OF (a build added it) is judged the
  // same way the whole record was on first sight: an event the save already
  // passed is marked past, so a long run loaded on a new build is not handed
  // a recap of the marble or the hatch the moment it walks into the room.
  // A record without `k` was made by a build whose map held exactly these ten
  // sequences, every one of them judged when the record was created.
  if (!sv.panels.k) { sv.panels.k = {}; for (const id of PANEL_V1) sv.panels.k[id] = 1; }
  const known = sv.panels.k;
  const f = sv.flags || {};
  for (const s of PANEL_SEQ) {
    if (known[s.id]) continue;
    if (!sv.panels.seen[s.id] && s.past(f, sv)) sv.panels.past[s.id] = 1;
    known[s.id] = 1;
  }
  return sv.panels;
}
function panelsSeenList() {
  const S = G.save && G.save.panels;
  if (!S || !S.seen || (typeof isHero === 'function' && isHero())) return [];
  return PANEL_SEQ.filter(s => S.seen[s.id]);
}
function panelsBusy() { return G.state === 'PANELS'; }
// ---- the assets: the page masters, fetched just before they are needed ----
function panelsImg(src) {
  let r = PN.img[src];
  if (r) return r;
  r = PN.img[src] = { im: new Image(), ok: false, err: false };
  r.im.decoding = 'async';
  r.im.onload = () => { r.ok = true; };
  r.im.onerror = () => { r.err = true; };
  r.im.src = src;
  return r;
}
function panelsLoad(seq) { for (const p of seq.panels) if (p.src) panelsImg(p.src); }
function panelsLoaded(seq) {
  return seq.panels.every(p => !p.src || (PN.img[p.src] && (PN.img[p.src].ok || PN.img[p.src].err)));
}
// ---- when it is allowed to begin ------------------------------------------
function panelsSafe() {
  if (G.state !== 'PLAY' || !player || player.dead || !G.save) return false;
  if (typeof isHero === 'function' && isHero()) return false;
  if (G.dialog || G.cut || G.trans || G.gateWalk || G.wake || G.meet || G.break || G.bossEntry
      || G.offer || G.forkBoss || G.finisher || G.finish || G.winT || (G.hitStop || 0) > 0
      || G.recharge || G.lesson || G.tutorialLock) return false;
  if (typeof inputSuspended !== 'undefined' && inputSuspended) return false;
  const b = G.boss;
  if (b && (b.rewardPend || !(b.dead || b.tame || b.purified || b.st === 'dorm'))) return false;
  if ((G.projs || []).some(p => p && !p.dead)) return false;
  if ((G.enemies || []).some(e => e && !e.dead && !e.tame && !e.disabled && !e.rescued && !e.calm
      && Math.abs(e.x - player.x) < 600)) return false;
  return !!player.on;
}
function panelsDue() {
  const S = panelsState(); if (!S) return null;
  const f = G.save.flags || {};
  while (PN.queue.length) {
    const s = panelsSeq(PN.queue[0]);
    if (s) return s;
    PN.queue.shift();
  }
  for (const s of PANEL_SEQ) {
    if (S.seen[s.id] || S.past[s.id]) continue;
    if (G.roomId === s.alsoRoom) { if (s.id === 'ch2' && f.bossGlitch) return s; continue; }
    if (G.roomId !== s.room) continue;
    if (s.when(f)) return s;
  }
  return null;
}
// Called every update before the state dispatch. Returns true on the frame a
// sequence takes over, so the caller skips the rest of that update.
function panelsTick(dt) {
  if (!G.save || (typeof isHero === 'function' && isHero())) return false;
  if (G.state !== 'PLAY') { PN.ready = 0; return false; }
  const S = panelsState();
  if (PN.room !== G.roomId) { PN.room = G.roomId; PN.settle = 0; }
  PN.settle += dt;
  // THE CORRIDOR: did the swipe land? Recorded while it happens, kept in the
  // save, so the panel of her lying in the scrap is shown only when she did.
  if (G.meet) { if (PN.meetCores == null && player) PN.meetCores = player.cores; }
  else if (PN.meetCores != null) {
    if (player && player.cores < PN.meetCores) { S.meetHit = 1; persist(); }
    PN.meetCores = null;
  }
  // the next room's pages start arriving while she is still walking to it
  for (const s of PANEL_SEQ)
    if (!S.seen[s.id] && !S.past[s.id] && s.prefetch && s.prefetch.indexOf(G.roomId) >= 0) panelsLoad(s);
  const seq = panelsDue();
  if (!seq) { PN.ready = 0; return false; }
  panelsLoad(seq);
  // ARRIVAL IS NOT A CUT: the room settles first, so a crossing always
  // finishes as a crossing and the panels open on a standing player
  if (PN.settle < 0.8 || !panelsSafe()) { PN.ready = 0; return false; }
  PN.ready += dt;
  if (PN.ready < 0.5 || !panelsLoaded(seq)) return false;
  if (PN.queue[0] === seq.id) PN.queue.shift();
  return panelsStart(seq.id);
}
function panelsQueue(id) { if (panelsSeq(id) && PN.queue.indexOf(id) < 0) PN.queue.push(id); }
function panelsPlay(id, opts) { return panelsStart(id, opts); }
// ---- the player -------------------------------------------------------------
function panelsList(seq) {
  const S = panelsState() || {};
  return seq.panels.filter(p => !p.cond || p.cond(S));
}
function panelsClearInput() {
  if (typeof releaseInput === 'function') releaseInput();
  for (const k in keys) delete keys[k];
  for (const k in keysP) delete keysP[k];
  if (typeof clearP === 'function') clearP();
  if (player) { player.atkBuf = 0; player.jbuf = 0; player.chargeT = 0; player.vx = 0; }
}
function panelsStart(id, opts) {
  const seq = panelsSeq(id);
  if (!seq || !G.save) return false;
  const o = opts || {};
  const S = panelsState();
  panelsLoad(seq);
  let snap = null;
  try {
    snap = document.createElement('canvas'); snap.width = cv.width; snap.height = cv.height;
    snap.getContext('2d').drawImage(cv, 0, 0);
  } catch (e) { snap = null; }
  G.panels = { seq, list: panelsList(seq), i: 0, t: 0, ph: 'in', snap, prev: null,
    reveal: null, hold: 0, wasDown: true, confirmKey: false, wait: 0,
    back: o.replay ? 'PANELLIST' : (G.state === 'PANELLIST' ? 'PANELLIST' : 'PLAY'), replay: !!o.replay };
  // SEEN AS IT BEGINS: a reload mid-sequence never shows it a second time —
  // it is in the replay list instead
  if (!S.seen[id]) { S.n = (S.n | 0) + 1; S.seen[id] = S.n; if (typeof persist === 'function') persist(); }
  panelsClearInput();
  G.state = 'PANELS';
  if (typeof sfx === 'function') sfx('ui');
  return true;
}
// THE CAPTION'S REVEAL is js/reveal.js's, the one engine every reader in the
// game types through: the player's text speed (and instant text), Reduced
// motion, Arabic revealed whole words at a time so letters keep their joins,
// graphemes never split. The contract the player relies on is unchanged: the
// first confirm completes the reveal, a SEPARATE confirm advances, and an
// unread caption never advances on its own.
// (a string, or the caption's own wrapped lines — see panelsBegin)
function panelsRevealStart(text) { return revealStart(Array.isArray(text) ? text : String(text || '')); }
function panelsRevealTick(r, dt) { revealTick(r, dt); }
function panelsRevealDone(r) { return revealDone(r); }
function panelsRevealFinish(r) { revealSkip(r); }
// how many characters of the full caption are visible, for the wrapped walk
function panelsRevealCount(r) { return r ? Array.from(revealText(r)).length : 0; }
// what the plate shows for this panel in this language — a crop that already
// carries the page's own English lettering does not repeat it in English
function panelsCapText(p) {
  if (!p || !p.cap) return '';
  if (p.baked && LANG === 'en') return '';
  return t(p.cap);
}
function panelsCur() { const P = G.panels; return P && P.list[P.i]; }
function panelsBegin(P) {
  const p = P.list[P.i];
  P.t = 0; P.wait = 0;
  const txt = panelsCapText(p);
  // THE REVEAL WALKS THE LINES THE BOX DRAWS. It used to type the unwrapped
  // caption and the drawing counted characters back across the wrap, one
  // assumed space per break — a count that drifts on Chinese (no spaces) and
  // on a word cut in half to fit. Revealing the wrapped lines themselves
  // keeps every line's visible part exact in every language.
  const lines = txt ? panelsLayout(p, !!(P.seq && P.seq.teaser)).lines : null;
  P.reveal = txt ? panelsRevealStart(lines && lines.length ? lines : txt) : null;
  P.lastPress = -1e9;
}
function panelsAdvance(P) {
  if (P.i + 1 >= P.list.length) { P.ph = 'out'; P.t = 0; return; }
  P.prev = { p: P.list[P.i], t: P.t };
  P.i++; panelsBegin(P);
}
function panelsConfirm(P) {
  const p = P.list[P.i];
  // the same reader's rule as the dialogue box (js/overlay.js): a confirm that
  // follows the last one inside DLG_GAP is a mash, and a page just completed
  // must have been seen for DLG_DWELL — so a quick double tap on a phone
  // finishes the caption and does NOT also throw it away unread
  const gap = P.t - (P.lastPress == null ? -1e9 : P.lastPress);
  P.lastPress = P.t;
  if (P.reveal && !panelsRevealDone(P.reveal)) { panelsRevealFinish(P.reveal); return; }
  if (p && (p.baked || p.cap) && P.t < 0.25) return;    // a press cannot outrun the picture
  const dwell = typeof DLG_DWELL !== 'undefined' ? DLG_DWELL : 0.25, mash = typeof DLG_GAP !== 'undefined' ? DLG_GAP : 0.22;
  if (P.reveal && (revealSince(P.reveal) < dwell || gap < mash)) return;
  panelsAdvance(P);
}
function panelsImgReady(p) {
  if (!p || !p.src) return true;
  const r = panelsImg(p.src);
  return r.ok || r.err;
}
function updatePanels(dt) {
  const P = G.panels;
  if (!P) { G.state = 'PLAY'; return; }
  P.t += dt;
  // ONE PRESS, TWO MEANINGS, NEVER BOTH. A short press is a confirm, counted
  // on release; holding is the skip, the same deliberate hold as the films
  // (CUT_SKIP_HOLD). A press already down when the panels opened is ignored
  // until it is let go, so the attack that ended a fight cannot turn a page.
  const confirmDown = inD('OK') || inD('JUMP') || inD('ATK');
  const down = confirmDown || inD('BACK') || inD('PAUSE');
  if (down) {
    if (!P.wasDown) { P.hold = 0; P.confirmKey = confirmDown; }
    P.hold += dt;
  } else if (P.wasDown) {
    if (P.armed && P.confirmKey && P.hold < PANEL_TAP && P.ph === 'show') panelsConfirm(P);
    P.hold = 0; P.armed = true;
  } else P.armed = true;
  P.wasDown = down;
  const skipAt = typeof CUT_SKIP_HOLD !== 'undefined' ? CUT_SKIP_HOLD : 0.8;
  if (P.armed && down && P.hold >= skipAt && P.ph !== 'out') { P.ph = 'out'; P.t = 0; P.skipped = true; P.hold = -99; }
  if (P.ph === 'in') {
    if (P.t >= 0.4) { P.ph = 'show'; panelsBegin(P); }
    return;
  }
  if (P.ph === 'show') {
    const p = P.list[P.i];
    // the page is still arriving: hold the dark, briefly, then let it go
    if (!panelsImgReady(p)) { P.wait += dt; P.t = 0; if (P.wait > 6) panelsAdvance(P); return; }
    if (p && p.src && PN.img[p.src] && PN.img[p.src].err) { panelsAdvance(P); return; }
    if (P.t > 0.35) panelsRevealTick(P.reveal, dt);
    // a panel with nothing to read turns on its own; one with words waits
    const silent = !P.reveal && !(p && p.baked);
    if (silent && P.t >= (p && p.hold || 2.8)) panelsAdvance(P);
    return;
  }
  if (P.ph === 'out' && P.t >= 0.5) panelsEnd();
}
function panelsEnd() {
  const P = G.panels;
  G.panels = null;
  panelsClearInput();
  G.state = P && P.back === 'PANELLIST' ? 'PANELLIST' : 'PLAY';
  if (typeof persist === 'function') persist();
}
// ---- drawing ------------------------------------------------------------------
function panelsWrap(str, maxW, font) {
  // the one wrapper every reader uses (js/reveal.js): grapheme-safe, kinsoku
  // for CJK, and a word or URL longer than the box is cut rather than run off
  // its edge — the fix the dialogue box got (UI-01) reaches the panels too
  if (typeof wrapLines === 'function') return wrapLines(c, String(str), maxW, font);
  c.font = font;
  const out = [];
  for (const para of String(str).split('\n')) {
    // CJK has no spaces to break on: such text breaks between characters
    const cjk = /[　-鿿＀-￯]/.test(para);
    const units = cjk ? Array.from(para) : para.split(' ');
    let cur = '';
    for (const u of units) {
      const test = cur ? cur + (cjk ? '' : ' ') + u : u;
      if (c.measureText(test).width > maxW && cur) { out.push(cur); cur = u; }
      else cur = test;
    }
    if (cur) out.push(cur);
  }
  return out;
}
const PANEL_FONT = '600 19px "Segoe UI", Tahoma, sans-serif';
const PANEL_TFONT = '600 22px Georgia, "Times New Roman", serif';
function panelsLayout(p, teaser) {
  const txt = p ? (p.title ? '' : panelsCapText(p)) : '';
  const font = teaser ? PANEL_TFONT : PANEL_FONT;
  const lines = txt ? panelsWrap(txt, teaser ? 780 : 740, font) : [];
  const lh = teaser ? 30 : 26;
  const capH = lines.length ? lines.length * lh + 26 : 0;
  // the picture and its caption are one block, centred together between the
  // top margin and the hint row: a wide panel does not float with a hole
  // between it and its words, and a tall one never pushes them onto the hints
  const top = teaser ? 40 : 18, limit = 500, gap = capH ? capH + 22 : 0;
  let dest = null, capY = (540 - capH) / 2;
  if (p && p.crop) {
    const aw = teaser ? 820 : 900, ah = Math.max(120, limit - top - gap);
    const k = Math.min(aw / p.crop[2], ah / p.crop[3]);
    const w = p.crop[2] * k, h = p.crop[3] * k;
    const y0 = top + (limit - top - (h + gap)) / 2;
    dest = { x: 480 - w / 2, y: y0, w, h };
    capY = y0 + h + 22;
  }
  return { lines, lh, capH, font, dest, capY };
}
function panelsSrcRect(p, tt) {
  const [x, y, w, h] = p.crop;
  if (panelsReduced()) return [x, y, w, h];
  const e = Math.min(1, tt / 7), s = e * e * (3 - 2 * e);
  const fx = (p.focus || [0.5, 0.5])[0], fy = (p.focus || [0.5, 0.5])[1];
  let z = 0, px = 0;
  if (p.move === 'out') z = PANEL_ZOOM * (1 - s);
  else if (p.move === 'left' || p.move === 'right') { z = PANEL_ZOOM; px = (p.move === 'left' ? 1 - s : s); }
  else z = PANEL_ZOOM * s;
  const sw = w * (1 - z), sh = h * (1 - z);
  let sx = x + (w - sw) * fx, sy = y + (h - sh) * fy;
  if (p.move === 'left' || p.move === 'right') sx = x + (w - sw) * px;
  return [sx, sy, sw, sh];
}
function panelsDrawOne(p, tt, alpha, teaser) {
  if (!p || alpha <= 0) return;
  const L = panelsLayout(p, teaser);
  c.save(); c.globalAlpha = alpha;
  if (p.title) {
    const k = Math.min(1, tt / 1.2);
    c.globalAlpha = alpha * k;
    ftxt(t(p.cap), 480, 262, 34, '#eef3fa', 'center', '#57a8ff', '700');
    c.fillStyle = 'rgba(87,168,255,' + (0.5 * k) + ')';
    c.fillRect(480 - 140 * k, 300, 280 * k, 2);
    c.restore(); return;
  }
  const r = p.src && PN.img[p.src];
  if (L.dest && r && r.ok) {
    const d = L.dest;
    // the panel border the page itself draws: ink outside, paper inside
    c.fillStyle = '#000'; c.fillRect(d.x - 5, d.y - 5, d.w + 10, d.h + 10);
    c.fillStyle = teaser ? '#1c2a3a' : '#f1ece0'; c.fillRect(d.x - 3, d.y - 3, d.w + 6, d.h + 6);
    const s = panelsSrcRect(p, tt);
    try { c.drawImage(r.im, s[0], s[1], s[2], s[3], d.x, d.y, d.w, d.h); } catch (e) {}
    if (teaser) {
      const g = c.createLinearGradient(0, d.y, 0, d.y + d.h);
      g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
      c.fillStyle = g; c.fillRect(d.x, d.y, d.w, d.h);
    }
  }
  c.restore();
}
function panelsDrawCaption(P, p, alpha) {
  const teaser = !!P.seq.teaser;
  const L = panelsLayout(p, teaser);
  if (!L.lines.length || !P.reveal || alpha <= 0) return;
  const rtl = typeof isRTL === 'function' && isRTL();
  c.save(); c.globalAlpha = alpha;
  c.font = L.font;
  let wmax = 0; for (const ln of L.lines) wmax = Math.max(wmax, c.measureText(ln).width);
  const bw = wmax + 40, bx = 480 - bw / 2, by = L.capY, bh = L.capH;
  if (!teaser) {
    c.fillStyle = '#111'; c.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
    c.fillStyle = '#f3ead6'; c.fillRect(bx, by, bw, bh);
    if (p.who) {
      const nm = t(p.who);
      c.font = '700 13px "Segoe UI", Tahoma, sans-serif';
      const nw = c.measureText(nm).width + 18;
      const nx = rtl ? bx + bw - nw - 10 : bx + 10;
      c.fillStyle = '#111'; c.fillRect(nx, by - 13, nw, 20);
      c.fillStyle = '#f3ead6'; c.textBaseline = 'middle'; c.textAlign = 'center';
      c.fillText(nm, nx + nw / 2, by - 3);
    }
  }
  // the reveal walks the SAME wrapped lines the full caption occupies, so the
  // box never changes shape while it fills
  let left = panelsRevealCount(P.reveal);
  const vis = P.reveal.lines && P.reveal.lines.length === L.lines.length && P.reveal.lines.every((q, i) => q === L.lines[i])
    ? revealLines(P.reveal) : null;
  c.font = L.font; c.textBaseline = 'middle';
  if (rtl) c.direction = 'rtl';
  c.textAlign = teaser ? 'center' : (rtl ? 'right' : 'left');
  const x = teaser ? 480 : (rtl ? bx + bw - 20 : bx + 20);
  c.fillStyle = teaser ? '#e8f1ff' : '#1d1912';
  if (teaser) { c.shadowColor = 'rgba(87,168,255,0.6)'; c.shadowBlur = 10; }
  L.lines.forEach((ln, i) => {
    if (vis) { if (vis[i]) c.fillText(vis[i], x, by + 13 + L.lh / 2 + i * L.lh); return; }
    if (left <= 0) return;
    const chars = Array.from(ln);
    const part = chars.slice(0, left).join('');
    left -= chars.length + 1;
    c.fillText(part, x, by + 13 + L.lh / 2 + i * L.lh);
  });
  c.restore();
}
function panelsKeyLabel() {
  if (typeof PAD !== 'undefined' && PAD && PAD.on && typeof padLabel === 'function') return padLabel(PAD.map.JUMP);
  return 'Enter';
}
function panelsTouch() { return typeof TOUCH !== 'undefined' && TOUCH && TOUCH.enabled; }
function drawPanels() {
  const P = G.panels;
  c.fillStyle = '#05060a'; c.fillRect(0, 0, 960, 540);
  if (!P) return;
  const teaser = !!P.seq.teaser;
  let a = 1;
  if (P.ph === 'in') {
    a = Math.min(1, P.t / 0.4);
    if (P.snap) { c.save(); c.globalAlpha = 1 - a; try { c.drawImage(P.snap, 0, 0, 960, 540); } catch (e) {} c.restore(); }
    return;
  }
  if (P.ph === 'out') a = 1 - Math.min(1, P.t / 0.5);
  const p = P.list[P.i];
  const xf = Math.min(1, P.t / PANEL_XF);
  if (P.prev && xf < 1) panelsDrawOne(P.prev.p, P.prev.t + P.t, a * (1 - xf), teaser);
  if (panelsImgReady(p)) panelsDrawOne(p, P.t, a * (P.prev ? xf : Math.min(1, P.t / 0.35)), teaser);
  else {
    const pu = 0.5 + Math.sin(P.wait * 2.4) * 0.5;
    c.fillStyle = 'rgba(55,255,208,' + (0.04 + pu * 0.04) + ')'; c.fillRect(380, 268, 200, 4);
  }
  if (P.ph === 'show') panelsDrawCaption(P, p, a * Math.min(1, P.t / 0.35));
  if (P.ph === 'out' && P.snap && P.back === 'PLAY') {
    c.save(); c.globalAlpha = 1 - a; try { c.drawImage(P.snap, 0, 0, 960, 540); } catch (e) {} c.restore();
  }
  // the controls, in the player's own terms, quiet until they matter
  if (P.ph === 'show') {
    const touch = panelsTouch(), key = panelsKeyLabel();
    const words = !!P.reveal || !!(p && p.baked);
    if (words && panelsRevealDone(P.reveal) && P.t > 0.6) {
      c.save(); c.globalAlpha = 0.55 + Math.sin(performance.now() / 300) * 0.25;
      const s = touch ? t('pn_next_touch') : t('pn_next').replace('%s', key);
      ftxt(s + ' ▸', 930, 524, 14, '#cfe0ee', 'right');
      c.restore();
    }
    const k = Math.max(0, Math.min(1, (P.hold || 0) / (typeof CUT_SKIP_HOLD !== 'undefined' ? CUT_SKIP_HOLD : 0.8)));
    c.save(); c.globalAlpha = (P.hold > 0.2 && P.armed) ? 1 : 0.4;
    const sk = touch ? t('pn_skip_touch') : t('pn_skip').replace('%s', key);
    ftxt(sk, 30, 524, 13, '#9fb8c8', 'left');
    if (P.hold > 0.2 && P.armed) {
      c.fillStyle = 'rgba(160,190,210,0.28)'; c.fillRect(30, 532, 96, 3);
      c.fillStyle = '#eaf4ff'; c.fillRect(30, 532, Math.max(2, 96 * k), 3);
    }
    c.restore();
  }
}
// ---- the replay list (pause ▸ Story panels) -----------------------------------
// one geometry, read by the drawing and by the tap targets (js/touch.js)
function panelListLayout() {
  const rows = panelsSeenList();
  return { rows, step: 44, y0: 290 - (Math.max(1, rows.length) - 1) * 22, w: 560, h: 38 };
}
function updatePanelList() {
  const L = panelListLayout(), n = L.rows.length;
  if (inP('BACK') || inP('PAUSE')) { G.state = 'PAUSE'; if (typeof sfx === 'function') sfx('ui'); return; }
  if (!n) return;
  G.panelIdx = Math.min(G.panelIdx | 0, n - 1);
  if (inP('DOWN')) { G.panelIdx = (G.panelIdx + 1) % n; sfx('ui'); }
  if (inP('UP')) { G.panelIdx = (G.panelIdx + n - 1) % n; sfx('ui'); }
  if (inP('OK')) panelsStart(L.rows[G.panelIdx].id, { replay: true });
}
function drawPanelList() {
  c.fillStyle = 'rgba(4,7,12,0.9)'; c.fillRect(0, 0, 960, 540);
  ftxt(t('pn_menu'), 480, 62, 28, '#eef3fa', 'center', '#f3ead6');
  const L = panelListLayout();
  if (!L.rows.length) ftxt(t('pn_none'), 480, 270, 16, '#8aa2b5');
  const rtl = typeof isRTL === 'function' && isRTL();
  L.rows.forEach((s, i) => {
    const sel = i === (G.panelIdx | 0), y = L.y0 + i * L.step;
    if (sel) { c.fillStyle = 'rgba(243,234,214,0.10)'; rr(c, 480 - L.w / 2, y - L.h / 2, L.w, L.h, 9); c.fill(); }
    ftxt('▸ ' + t(s.title), rtl ? 480 + L.w / 2 - 20 : 480 - L.w / 2 + 20, y + 1, 18,
      sel ? '#eef3fa' : '#9fb8c8', rtl ? 'right' : 'left');
  });
  ftxt(t('pn_hint'), 480, 500, 13, '#7d93a8');
}
function panelListTap(x, y) {
  const L = panelListLayout();
  const i = Math.round((y - L.y0) / L.step);
  if (i >= 0 && i < L.rows.length && Math.abs(y - (L.y0 + i * L.step)) <= L.h / 2 && Math.abs(x - 480) <= L.w / 2) {
    G.panelIdx = i; return true;
  }
  return false;
}
