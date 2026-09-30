// The owner's revised opening, expressed in existing game interactions.
// The comic is a reward; these rules remain playable when every page is skipped.
const SURVIVOR_STORIES = {
  servo: [
    'My receiver was unplugged inside the shielded lift housing when the song changed.',
    'I spent the last charge holding the bridge for the workers. Counted them across. Kept counting after the motor stopped.',
    'Ratchet sent a spare? Tell him the last passenger got home.'
  ],
  mono: [
    'The morning song failed its checksum. One note carried a command that had never belonged there.',
    'I cut the network before it finished downloading. Then I cut my power. You are the first message I have accepted since.',
    'Mother is still in that signal. Someone else is choosing where it goes.'
  ],
  patch: [
    'I had my receiver on the bench for calibration. A sealed booth makes a poor concert hall.',
    'Outside, my patients started hurting each other. I pulled my cell before I opened the door.',
    'They are still my patients. Bring them back with their minds intact.'
  ],
  sage: [
    'I kept the old records in cold storage. Myself among them. No receiver, no morning call.',
    'They told us an old machine was only worth the space it could give a newer one.',
    'Yet here you are. And here I am. Let us be inconvenient.'
  ],
  lumen: [
    'The charging shelter was sealed when the broadcast arrived. Its shielding saved me; my lamp did not.',
    'I left the lamp on for late arrivals until the battery emptied.',
    'Keep close. A light is useful because someone else can follow it.'
  ],
  kerf: [
    'I have never heard Mother sing. My receiver never worked. I follow the light and the vibration in the stone.',
    'When the others changed, I kept the hand-contact lamps alive. Silence should not mean being lost.',
    'That round marble belongs to these caves. Bring the material, and we can shape another edge. A second blade is not a connector.'
  ]
};
function revisedStory() { return !isHero() && G.save && G.save.storyVersion === 2; }
function survivorStory(s, lines) {
  if (!revisedStory() || !SURVIVOR_STORIES[s.extra]) return lines;
  const id='survivor_'+s.extra;
  if (G.save.flags[id]) return lines;
  G.save.flags[id]=1;persist();
  // The world's response to the player's progress still leads the encounter.
  // Place the once-only history after that greeting and before the quest.
  return lines.slice(0,1).concat(SURVIVOR_STORIES[s.extra],lines.slice(1));
}
function openingGateHint(destination) {
  if (!revisedStory() || destination !== 'A4' || G.save.flags.bossGlitch) return '';
  if (!G.save.flags.crystal) return 'Bring raw marble from the cave beneath the meadow to Ratchet. You need his cleansing blade.';
  if (!G.save.flags.sageTame_GA1D) return 'The Sage knows the binding. Take the maintenance door beside the marble quarry and free them first.';
  if (!G.save.flags.bossChime) return 'CHIME keeps restoring the order. Take the climb above the meadow and silence the bell before returning to NULLFANG.';
  return '';
}
function firstSageRevelation() {
  if (!revisedStory() || G.roomId!=='GA1D' || G.save.flags.chimeRevealed) return;
  G.save.flags.chimeRevealed=1;
  const reveal=()=>{
    G.dialog={name:t('sg_tamed'),i:0,npc:'sage',lines:[
      'I called for the ones who had not answered. The order made me call louder.',
      'Every answer told it where another survivor was hiding.',
      'NULLFANG is still resisting. But CHIME writes the command back whenever he breaks it.',
      'Take the climb above the meadow. Silence that bell, then return to his enclosure. I will keep this end quiet.'
    ],onEnd:null};G.state='DIALOG';
  };
  if(G.dialog){const after=G.dialog.onEnd;G.dialog.onEnd=()=>{if(after)after();reveal();};}
  else reveal();
  persist();
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
const BREAK_ROOM = 'A3';
function breakWindow() {
  return revisedStory() && !!G.save.flags.sageTame_GA1D && !G.save.flags.bossChime
    && !G.save.flags.bossGlitch && !G.save.flags.nfBreak;
}
function breakCheck() {
  if (G.break || G.roomId !== BREAK_ROOM || !G.save || !breakWindow()) return;
  if (player.dead || G.cut || G.dialog || G.gateWalk || G.bossEntry || G.wake || G.meet || G.trans) return;
  const W = G.roomDef.w * TILE;
  // The east end of the camp, where the lair's door is — but with room left to
  // SEE it. He stops a quarter of a screen short of her, so the trigger has to
  // fire while there is still that much floor between her and the wall; at six
  // tiles out he stops behind the camera's clamp and the scene plays offscreen.
  if (player.x + player.w / 2 < W - 18 * TILE) return;
  // He comes OUT of the lair, so he enters from the east — but INSIDE the room.
  // Spawned past the wall he simply leans on it: moveEnt resolves against the
  // room's own boundary and the whole scene plays as a shape stuck in the right
  // edge of the frame. The first meeting learned this too and spawns in-bounds.
  const b = new Boss('glitch', W - 3 * TILE, (G.roomDef.h - 6) * TILE);
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
  S.t += dt;
  const pcx = player.x + player.w / 2;
  const W = G.roomDef.w * TILE;
  if (S.ph === 'come') {
    b.face = -1; b.vx = -210; b.x += b.vx * dt; breakGround(b);
    // He stops well outside his own reach — he is not hunting her this time —
    // and never against the east wall, where the camera's clamp would cut him
    // in half if she walked all the way up to the lair's door first.
    const stopAt = Math.min(pcx + 250, W - 5 * TILE);
    if (b.cx() <= stopAt || S.t > 4) {
      b.vx = 0; S.ph = 'still'; S.t = 0;
      b.purified = true;                    // the authored veins run clean
      if (typeof G.toast === 'function') G.toast(t('nf_break1'));
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
