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
