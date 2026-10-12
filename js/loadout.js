// CLAWBYTE — THE LOADOUT, COLOUR-CODED (handoff Part 2 C2).
//
// Arms (attack), crests (combat passives) and relics (exploration) are three
// systems, and every screen that listed them listed them the same way: a line
// of text. A build could not be read at a glance because nothing said which
// system a line belonged to. Each system now owns ONE hue and ONE frame shape,
// defined here and nowhere else — call sites name LOADOUT_COL.arm, never the
// hex — and docs/combat/GLOBAL_REGISTRY.md §2 lists them as the "UI loadout"
// block, so no fight can borrow them and no menu can borrow a fight's.
//
// WHY THESE THREE HUES. The registry already spends amber (telegraph), red
// (danger), pale cyan (lock), violet (void), frost blue (cold), mint (repair),
// gold (reward) and lime (parry), and every one of those is a promise the
// player reads in combat. The free room left on the wheel is narrow:
//   - ORANGE was the obvious "attack" colour and is the one that cannot be
//     had: it sits between telegraph amber and danger red (ΔE 30 to amber), and
//     it IS Kingdom C's glow and the slag arm's element (ΔE 5 / 11).
//   - arm   CORAL  #ffb4a5 — a pale warm coral, warm without being amber, red
//     or gold: ΔE 41 from danger red, 47 from reward gold, 50 from telegraph
//     amber. It replaced ROSE #ff45b4 (owner, 2026-10-12), which sat ΔE 9 from
//     Kingdom X's own glow (#ff5ec8) — an arm frame in the rift read as part of
//     the room. Searched, not picked: the free room between eight reserved hues
//     and six kingdom palettes is narrow (the best a full RGB sweep finds is
//     ΔE ≈ 32, and that is a yellow wedged between amber and lime). Coral is the
//     best of what is not yellow: ΔE ≥ 42 from every kingdom's glow and edge
//     (C's orange edge is the nearest), and pale, so it stands at 3:1 or better
//     against every kingdom's ground colours on a HUD laid over the world.
//   - crest COBALT #4a7bff — a deep saturated blue, far from the PALE blues
//     (frost ΔE 64, lock cyan ΔE 86) because those are pastels and this is not.
//   - relic TRAIL  #4fe36a — a saturated path-green: lime ΔE 46, repair mint
//     ΔE 53. Relics used to share reward gold, which belongs to the moment of
//     getting a thing; the relic's FRAME is what it is once you carry it.
//   Pairwise the three are ΔE 93 (coral/cobalt), 151 (cobalt/green) and 94
//   (coral/green). tests/loadout.cjs re-measures all of this from the canvas,
//   and measures the arm hue against every kingdom's palette and painted rooms.
//
// WHY A SHAPE AS WELL. Roughly one man in twelve cannot separate some of these
// hues, so the colour is never the only cue: an arm sits in a HEX (the
// machined bezel the suit wheel already drew), a crest in a DIAMOND (the
// socket the crest port already drew), a relic in a round double-ringed SEAL.
// Three, four and no corners: the silhouettes still differ at HUD size, and
// filled / empty / locked read by fill and dash rather than by hue.
//
// THESE ARE STAND-INS. A stroked frame is UI chrome; the authored frames are
// queued in docs/ART_QUEUE.md §2bm, and drawLoadoutFrame is the one function
// the plates replace.
const LOADOUT_COL = Object.freeze({ arm: '#ffb4a5', crest: '#4a7bff', relic: '#4fe36a' });
const LOADOUT_SHAPE = Object.freeze({ arm: 'hex', crest: 'diamond', relic: 'seal' });

// the same hue at an alpha, derived from the one constant (selection plates,
// dim states) — so a tint never has to spell the colour out a second time
const LOADOUT_RGB = {};
function loadoutRGBA(kind, a) {
  const hex = LOADOUT_COL[kind];
  if (!hex) return 'rgba(140,160,180,' + a + ')';
  let rgb = LOADOUT_RGB[kind];
  if (!rgb) rgb = LOADOUT_RGB[kind] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
  return 'rgba(' + rgb + ',' + a + ')';
}

// which system an id belongs to, for screens that list mixed things (the shop
// sells crests, cells and cores on one list; the Gear screen holds crests next
// to permanent traversal hardware and weapons)
function loadoutKindOf(type, id) {
  if (type === 'arm') return 'arm';
  if (type === 'relic') return 'relic';
  if (type === 'crest' || type === 'slot') return 'crest';   // a slot is crest port width
  if (type === 'gear') return (typeof CRESTS !== 'undefined' && Object.prototype.hasOwnProperty.call(CRESTS, id)) ? 'crest' : null;
  return null;
}

// the outline alone, centred on x,y with radius r
function loadoutPath(c, kind, x, y, r) {
  c.beginPath();
  if (LOADOUT_SHAPE[kind] === 'hex') {
    for (let i = 0; i < 6; i++) {
      const an = i / 6 * Math.PI * 2 - Math.PI / 2;
      c[i ? 'lineTo' : 'moveTo'](x + Math.cos(an) * r, y + Math.sin(an) * r);
    }
    c.closePath();
  } else if (LOADOUT_SHAPE[kind] === 'diamond') {
    c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath();
  } else {
    c.arc(x, y, r * 0.92, 0, Math.PI * 2);
  }
}

// ONE FRAME. state: 'filled' (owned and worn/seated), 'empty' (owned or on
// offer, not worn — a dashed rim), 'locked' (not hers yet — the same frame,
// faint). glyph is optional: an arm's element, a relic's icon. No shadowBlur:
// the HUD draws these every frame and tests/glowcost.cjs counts blurred draws.
function drawLoadoutFrame(c, kind, x, y, r, state, glyph, glyphCol) {
  const col = LOADOUT_COL[kind]; if (!col) return;
  const st = state || 'filled';
  c.save();
  loadoutPath(c, kind, x, y, r);
  c.fillStyle = 'rgba(8,12,18,0.86)'; c.fill();
  if (st === 'filled') { c.fillStyle = loadoutRGBA(kind, 0.26); c.fill(); }
  if (st === 'locked') c.globalAlpha = 0.38;
  c.strokeStyle = col;
  c.lineWidth = Math.max(st === 'filled' ? 2 : 1.6, r * (st === 'filled' ? 0.15 : 0.11));
  if (st === 'empty') c.setLineDash([Math.max(2, r * 0.42), Math.max(1.5, r * 0.22)]);
  c.lineJoin = 'round';
  c.stroke();
  c.setLineDash([]);
  // the seal's second ring: what keeps a small seal from reading as a small hex
  if (LOADOUT_SHAPE[kind] === 'seal' && r >= 6) {
    c.lineWidth = Math.max(1, r * 0.07);
    c.beginPath(); c.arc(x, y, r * 0.64, 0, Math.PI * 2); c.stroke();
  }
  // a seated crest shows a jewel in its socket
  if (LOADOUT_SHAPE[kind] === 'diamond' && st === 'filled' && !glyph) {
    c.fillStyle = col;
    loadoutPath(c, 'crest', x, y, r * 0.38); c.fill();
  }
  if (glyph) {
    c.font = '700 ' + Math.round(r * 0.95) + 'px "Segoe UI", Tahoma, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = glyphCol || col;
    c.fillText(glyph, x, y + 1);
  }
  c.restore();
}

// what the HUD strip carries: worn crests, carried relics. The arms keep their
// own wheel row (drawHUD) and share its line.
function loadoutHudItems() {
  const s = (typeof G !== 'undefined' && G.save) || null;
  if (!s) return { crests: [], relics: 0 };
  return { crests: (s.equip || []).slice(), relics: (s.relics || []).length };
}
// is the HUD's loadout row on screen? (js/opening.js keeps its goal line off it)
function loadoutHudRow() {
  const sl = typeof armSlots === 'function' ? armSlots() : [null];
  const it = loadoutHudItems();
  return sl.length > 1 || it.crests.length > 0 || it.relics > 0;
}
// ONE GEOMETRY for the HUD row, read by the drawing and by tests/loadout.cjs:
// the suit badges first (their positions are drawHUD's, unchanged), then a
// worn crest's diamond each, then one relic seal with the count beside it.
function loadoutHudLayout() {
  const sl = typeof armSlots === 'function' ? armSlots() : [null];
  const it = loadoutHudItems();
  const arms = Math.max(0, sl.length - 1);
  let x = arms ? 44 + (arms - 1) * 42 + 32 : 30;
  const y = 118, crests = [];
  for (const id of it.crests) { crests.push({ id, x, y, r: 8 }); x += 20; }
  const relic = it.relics ? { x: x + (crests.length ? 6 : 0), y, r: 8, n: it.relics } : null;
  return { y, crests, relic };
}
function drawLoadoutHud(c) {
  const L = loadoutHudLayout();
  for (const k of L.crests) drawLoadoutFrame(c, 'crest', k.x, k.y, k.r, 'filled');
  if (L.relic) {
    drawLoadoutFrame(c, 'relic', L.relic.x, L.relic.y, L.relic.r, 'filled');
    c.save();
    c.font = '700 12px "Segoe UI", Tahoma, sans-serif';
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillStyle = LOADOUT_COL.relic;
    c.fillText(String(L.relic.n), L.relic.x + 12, L.relic.y + 1);
    c.restore();
  }
}

// The handover card: which system the thing she was just given belongs to.
// Set on the card showItem() returns (G.grantRelic, grantCrest, the boss's arm).
function loadoutTagCard(card, kind, id) {
  if (card && LOADOUT_COL[kind]) { card.lo = kind; card.loId = id; }
  return card;
}
// the system's name, in her language and her world's words (Gear / Tokens /
// Crests; Treasures / Relics) — the arms have their own key (lo_arm below)
function loadoutLabel(kind) {
  return t(kind === 'arm' ? 'lo_arm' : kind === 'crest' ? 'pm_crests' : 'pm_relics');
}
function loadoutGlyph(kind, id) {
  if (kind === 'relic') return (typeof RELIC_ICONS !== 'undefined' && RELIC_ICONS[id]) || '◆';
  return null;
}
// the card's picture column: the frame, large, and the system's name under it
function drawLoadoutCard(c, d, px, top) {
  const kind = d.lo, cx = px + 32, cy = top + 30, r = 26;
  if (kind === 'arm' && typeof drawArmBadge === 'function' && typeof armDef === 'function' && armDef(d.loId)) {
    c.save(); c.translate(cx, cy); drawArmBadge(c, d.loId, r, true); c.restore();
  } else drawLoadoutFrame(c, kind, cx, cy, r, 'filled', loadoutGlyph(kind, d.loId));
  ftxt(loadoutLabel(kind), cx, cy + r + 14, 12, LOADOUT_COL[kind]);
}

TEXT_LAYERS.push({
  en: { lo_arm: 'Arm' },
  ar: { lo_arm: 'سلاح' },
  tr: { lo_arm: 'Silah' },
  zh: { lo_arm: '武装' },
  ru: { lo_arm: 'Оружие' },
});
