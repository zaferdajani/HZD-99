// The owner's revised opening, expressed in existing game interactions.
// The comic is a reward; these rules remain playable when every page is skipped.
// Every line below lives in js/i18n.js (STORY_ORDER_TEXT): this file decides
// WHEN a line is said and never what it says, so all five languages follow.
const SURVIVORS = new Set(['servo', 'mono', 'patch', 'sage', 'lumen', 'kerf']);
function revisedStory() { return !isHero() && G.save && G.save.storyVersion >= 2; }
function survivorStory(s, lines) {
  if (!revisedStory() || !SURVIVORS.has(s.extra)) return lines;
  const id='survivor_'+s.extra;
  if (G.save.flags[id]) return lines;
  G.save.flags[id]=1;persist();
  // The world's response to the player's progress still leads the encounter.
  // Place the once-only history after that greeting and before the quest.
  return lines.slice(0,1).concat(t('sv_'+s.extra),lines.slice(1));
}
function openingGateHint(destination) {
  if (!revisedStory() || destination !== 'A4' || G.save.flags.bossGlitch) return '';
  if (!G.save.flags.crystal) return t('gh_marble');
  if (!G.save.flags.sageTame_GA1D) return t('gh_sage');
  if (!G.save.flags.bossChime) return t('gh_chime');
  return '';
}
// THE SAGE TELLS HER WHAT IS TRUE WHEN SHE STANDS UP — not what was true in
// the order the script happened to be written in. The bell can be silenced
// before the sage is freed (the climb is open from the hub), and an old save
// may even have freed the lion first; "silence that bell" said to a player who
// already did is the wrong-order line the plan found.
function sageRevealLines(f) {
  const L = [t('sg_rev1'), t('sg_rev2')];
  if (f.bossGlitch) L.push(t(f.bossChime ? 'sg_rev_free' : 'sg_rev_bell'));
  else if (f.bossChime) L.push(t('sg_rev_chime'), t('sg_rev_go'));
  else L.push(t('sg_rev3'), t('sg_rev4'));
  return L;
}
function firstSageRevelation() {
  if (!revisedStory() || G.roomId!=='GA1D' || G.save.flags.chimeRevealed) return;
  G.save.flags.chimeRevealed=1;
  const reveal=()=>{
    G.dialog={name:t('sg_tamed'),i:0,npc:'sage',lines:sageRevealLines(G.save.flags),onEnd:null};G.state='DIALOG';
  };
  if(G.dialog){const after=G.dialog.onEnd;G.dialog.onEnd=()=>{if(after)after();reveal();};}
  else reveal();
  persist();
}

// ---------------------------------------------------------------------------
// RATCHET IS ONE MACHINE (plan §4.5). He used to stand in two rooms — his den
// and the camp by the lion's door — with two powered-on flags, so the player
// revived him twice. Canon (docs/STORY_CANON.md) gives him one home, his
// workshop, and one battery. He wakes there; when the blade is forged he packs
// his tools and MOVES to the camp, where the chapter ends (Draft 2: he grounds
// the surge at NULLFANG's enclosure). So he stands in exactly one place, and
// both places read one flag: npcKey names his den wherever he stands.
const RATCHET_HOME = 'A0B', RATCHET_CAMP = 'A3';
function npcPlaced(room, who) {
  if (who !== 'ratchet' || isHero() || !revisedStory()) return true;
  const camp = !!G.save.flags.ratchetCamp;
  if (room === RATCHET_CAMP) return camp;
  if (room === RATCHET_HOME) return !camp;
  return true;
}
// What he makes of her NOW, chosen by the story's own order. The wrong-order
// line was "go and put one in it" before the forge — sending a cat with claws
// at the guardian his blade exists to free. It is only said once the sage and
// the bell have made the lion winnable; before the forge the same dent earns
// "not with claws". After the lion, he is the one who points up the climb.
function ratchetStandingKey(f, tierKey) {
  if (!revisedStory()) {
    if (f.sageTame_GA1D) return 'sl_ratchet_sage';
    if (f.crystal) return 'sl_ratchet_forged';
    if (f.nfMeet && !f.bossGlitch) return 'sl_ratchet_rematch';
    return tierKey;
  }
  if (f.bossGlitch) return 'sl_ratchet_conduits';
  if (f.sageTame_GA1D && f.bossChime && f.nfMeet) return 'sl_ratchet_rematch';
  if (f.sageTame_GA1D) return 'sl_ratchet_sage';
  if (f.crystal) return 'sl_ratchet_forged';
  if (f.nfMeet) return 'sl_ratchet_dent';
  return tierKey;
}

// ---------------------------------------------------------------------------
// THE PLAYER'S OWN CONTROLS, IN SPEECH. Old Servo used to say "leap with Z" to
// a player holding a controller he had remapped. A line that names a control
// carries {ACTION}; this fills it from the device actually in use — the pad's
// bound button (howToOpen reads PAD.map), the on-screen glyph on touch, the
// key otherwise — so the words can never describe a control she does not have.
const CTL_TOUCH = { MOVE: '◀ ▶', JUMP: '⤒', HEAL: '✚', DOWN: '▼', UP: '▲' };
function ctlName(a) {
  const touch = typeof TOUCH !== 'undefined' && TOUCH && TOUCH.enabled;
  const pad = typeof PAD !== 'undefined' && PAD && PAD.on;
  // the d-pad is not remappable (engine.js reads buttons 14/15 directly)
  if (a === 'MOVE') return touch ? CTL_TOUCH.MOVE : pad ? padLabel(14) + ' / ' + padLabel(15) : '← →';
  if (pad && typeof howToOpen === 'function') return howToOpen(a, t('pa_' + a));
  if (touch) return CTL_TOUCH[a] || t('pa_' + a);
  const codes = (typeof KEYB !== 'undefined' && KEYB[a]) || [];
  const k = codes.find(c => /^Key|^Space$|^Arrow/.test(c));
  return k ? k.replace(/^Key/, '').replace(/^Arrow/, '') : t('pa_' + a);
}
function ctlFill(line) {
  return typeof line === 'string' && line.indexOf('{') >= 0
    ? line.replace(/\{(MOVE|JUMP|ATK|HEAL|DOWN|UP|INT|DASH)\}/g, (m, a) => ctlName(a)) : line;
}

// ---------------------------------------------------------------------------
// EVERY SAVE PLAYS THE SAME STORY (plan §4.1). Draft 2 used to apply only to
// saves made after it shipped (storyVersion 2 in newSave), so anyone testing
// on an older save kept walking the old storyline. This runs once per save,
// on load, and moves it onto the current story WITHOUT taking anything away
// and without paying anything twice: every flag below is derived from what
// the old save already earned.
function migrateStory(save) {
  if (!save || typeof save !== 'object' || save.theme === 'hero') return save;
  if ((save.storyVersion | 0) >= STORY_VERSION) return save;
  const f = save.flags = save.flags || {};
  save.items = save.items || {};
  save.quests = save.quests || {};
  const legacy = !((save.storyVersion | 0) >= 2);
  // RATCHET'S ONE FLAG. Either old waking (den or camp) is the one waking.
  const awake = !!(f['on_A0B|ratchet'] || f['on_A3|ratchet'] || f.ratchetRepaired);
  if (awake) { f['on_A0B|ratchet'] = 1; f.ratchetRepaired = 1; }
  if (legacy) {
    if (awake) {
      // He was woken under the old rules; the Draft 2 spare he hands over on
      // waking would be a second payment for the same rescue.
      f.ratchetSpareGiven = 1;
    } else {
      // Not woken yet. Draft 2's waking needs HIS cell (the drawer) and then
      // gives her a spare for Servo. Every old save started her with a cell;
      // that cell — carried or already spent — was the spare, so the spare is
      // not paid twice...
      f.ratchetSpareGiven = 1;
      // ...and if the old drawer cell was already taken, it WAS his cell: one
      // carried cell becomes his again, or — if every cell was spent on other
      // machines — the drawer holds it once more. Never a locked workshop.
      if (f.ch_A0B_1 && !(save.items.ratchetCell | 0)) {
        if ((save.items.batt | 0) > 0) {
          save.items.batt -= 1; if (save.items.batt <= 0) delete save.items.batt;
          save.items.ratchetCell = 1;
        } else delete f.ch_A0B_1;
      }
    }
    // The old opening counted the finished tutorial as the volt pack; the new
    // one records the purchase. A player who finished it keeps both verbs.
    if (f.tut) f.heal = 1;
    // A blade the old story handed over is still hers; the errand that would
    // forge it again is closed rather than offered twice.
    if (f.crystal && save.quests.ratchet_forge !== 'done') save.quests.ratchet_forge = 'done';
  }
  // Ratchet moves to the camp once the blade exists (npcPlaced).
  if (awake && f.crystal) f.ratchetCamp = 1;
  // Beats the old route already passed are not replayed out of order.
  if (f.sageTame_GA1D && (f.bossChime || f.bossGlitch)) f.chimeRevealed = 1;
  if (f.bossChime || f.bossGlitch) f.nfBreak = 1;
  save.storyVersion = STORY_VERSION;
  return save;
}

// ---------------------------------------------------------------------------
// THE BREAK — comic page 29, "a brief break in control", made playable.
//
// The parity audit had this page drawn and unstaged, and that is the worst of
// both: the reader is shown a thing the game never does. It is also the page
// the kingdom's whole route turns on. The Meadow Sage makes a CLAIM —
// "NULLFANG is still resisting. But CHIME writes the command back whenever he
// breaks it." — and a claim the player is only told is a caption. This is the
// one time the sentence happens in front of her, between freeing the sage and
// silencing the bell, which is exactly the window the route leaves open.
//
// He does not speak. Nothing in this game has ever given him a word (§2.7 of
// docs/STORY_SCRIPT.md: "Not one word is spoken"), so the beat is carried by
// art the game already owns: `purified` runs the authored virus veins clean
// teal, and the bell puts the purple back. No new plate, no line in his mouth.
//
// It costs her nothing, holds no input and can be walked away from — the
// audit's own rule about preserving a silent hero's agency. She may simply
// keep walking east; the scene resolves and the lair is still shut.
//
// ON THE ROUTE THE SAGE GIVES (plan §4.6). It used to fire only at the camp's
// east end, by the lair — the one place the sage had just told her NOT to go
// yet ("take the climb above the meadow"). The climb rises out of the hub's
// west end (A2's ceiling at 11-14), so that is where he comes out now, with
// the bell answering from directly overhead; the camp keeps its spot for a
// player who walks east anyway. Whichever she reaches first, it happens once.
// In the hub it waits for the corridor meeting: he must have been met before
// he can be seen to let go.
const BREAK_SPOTS = {
  A2: { meet: true, line: 'nf_break1_road', at: (pcx) => pcx < 30 * TILE },
  A3: { meet: false, line: 'nf_break1', at: (pcx, W) => pcx >= W - 18 * TILE },
};
function breakWindow() {
  return revisedStory() && !!G.save.flags.sageTame_GA1D && !G.save.flags.bossChime
    && !G.save.flags.bossGlitch && !G.save.flags.nfBreak;
}
function breakCheck() {
  const spot = BREAK_SPOTS[G.roomId];
  if (G.break || !spot || !G.save || !breakWindow()) return;
  if (spot.meet && !G.save.flags.nfMeet) return;
  if (player.dead || G.cut || G.dialog || G.gateWalk || G.bossEntry || G.wake || G.meet || G.trans) return;
  const W = G.roomDef.w * TILE, pcx = player.x + player.w / 2;
  // At the camp: the east end, where the lair's door is — but with room left to
  // SEE it. He stops a quarter of a screen short of her, so the trigger has to
  // fire while there is still that much floor between her and the wall; at six
  // tiles out he stops behind the camera's clamp and the scene plays offscreen.
  if (!spot.at(pcx, W)) return;
  // He comes from the east, toward the lair — but INSIDE the room, and just
  // off the edge of her screen rather than at a far wall he would take longer
  // than the beat to cross. Spawned past the wall he simply leans on it:
  // moveEnt resolves against the room's own boundary and the whole scene plays
  // as a shape stuck in the right edge of the frame. The first meeting learned
  // this too and spawns in-bounds.
  const b = new Boss('glitch', Math.min(W - 3 * TILE, pcx + 14 * TILE), (G.roomDef.h - 6) * TILE);
  b.meet = true;                 // drives Boss.update off entirely — this is staged, not a fight
  b.st = 'stalk'; b.face = -1; b.vx = 0; b.vy = 0; b.t = 9;
  G.boss = b;
  G.break = { t: 0, ph: 'come' };
  G.save.flags.nfBreak = 1;      // set as it BEGINS, like the first meeting: a reload mid-beat keeps the sentence
  persist();
  if (typeof stopMusic === 'function') stopMusic();
}
// He WALKS THE SURFACE, he does not solve it. A3 is an outdoor heightfield of
// mounds (NO RIGHT ANGLES), and a 84x56 collider pushed west by moveEnt stops
// dead against the first rise between them: measured, he covered 118 px of the
// 186 he needed and then stood there waiting out the timeout, half outside the
// frame. A staged body is allowed to be placed rather than simulated, so this
// snaps him to the ground column under his own centre — the same call the
// player's own resolver uses — and the mounds read as walked over.
function breakGround(b) {
  if (typeof groundColumnAt !== 'function') return;
  const col = groundColumnAt(b.cx());
  if (!col || !col.length) return;
  const top = Math.min.apply(null, col);
  if (isFinite(top)) { b.y = top - b.h; b.vy = 0; }
}
function breakStep(dt) {
  const S = G.break, b = G.boss;
  if (!S || !b || !b.meet) { G.break = null; return; }
  // HE WALKS, HE DOES NOT SLIDE. `meet` switches Boss.update off, and with it
  // the bookkeeping that turns ground covered into stride — so the stalk strip
  // sat on one frame while he crossed the room at 210 px/s. The first meeting
  // (meetStep) brackets its step with the same two calls; this one now does.
  beastMotionBegin(b);
  breakPhase(S, b, dt);
  beastMotionEnd(b, dt);
}
function breakPhase(S, b, dt) {
  S.t += dt;
  const pcx = player.x + player.w / 2;
  const W = G.roomDef.w * TILE;
  if (S.ph === 'come') {
    b.st = 'stalk';
    b.face = -1; b.vx = -210; b.x += b.vx * dt; breakGround(b);
    // He stops well outside his own reach — he is not hunting her this time —
    // and never against the east wall, where the camera's clamp would cut him
    // in half if she walked all the way up to the lair's door first.
    const stopAt = Math.min(pcx + 250, W - 5 * TILE);
    if (b.cx() <= stopAt || S.t > 4) {
      b.vx = 0; S.ph = 'still'; S.t = 0;
      b.st = 'idle';                        // standing is standing, not a frozen step
      b.purified = true;                    // the authored veins run clean
      if (typeof G.toast === 'function') G.toast(t((BREAK_SPOTS[G.roomId] || BREAK_SPOTS.A3).line));
    }
  } else if (S.ph === 'still') {
    // he stands and lets go. Nothing attacks, nothing is taken from her.
    b.face = pcx < b.cx() ? -1 : 1; b.vx = 0; breakGround(b);
    if (S.t > 2.6) {
      S.ph = 'bell'; S.t = 0;
      b.purified = false;                   // and the bell writes the order back
      if (typeof sfx === 'function') sfx('tellbig');
      G.flash = Math.max(G.flash || 0, 0.35);
      cam.shake = Math.max(cam.shake, 7);
      if (typeof padRumble === 'function') padRumble(0.7, 0.5, 320);
      if (typeof G.toast === 'function') G.toast(t('nf_break2'));
    }
  } else if (S.ph === 'bell') {
    b.face = 1; b.vx = 0; breakGround(b);
    if (S.t > 0.85) {
      b.st = 'pounce'; b.face = 1; b.vx = 900; b.vy = -700; S.ph = 'leave'; S.t = 0;
      if (typeof sfx === 'function') sfx('dash');
      cam.shake = Math.max(cam.shake, 6);
    }
  } else if (S.ph === 'leave') {
    // he goes back into the enclosure. No walls on the way out — he is
    // leaving the room, not bouncing off it.
    b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 900 * dt;
    if (b.x > W + 60 || S.t > 1.8) {
      G.boss = null; G.break = null;
      if (typeof setMusic === 'function') setMusic(G.roomDef.zone);
      persist();
    }
  }
}
