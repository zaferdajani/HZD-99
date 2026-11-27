// Ownership and equipment are independent. Flags remain compatible with quest
// saves; the version prevents a newly found second sword from inventing a join.
function weaponOwned(mode, save = G.save) {
  const f = save && save.flags || {};
  if (mode === 'claws') return true;
  if (mode === 'single') return !!f.crystal;
  if (mode === 'dual') return !!(f.crystal && f.crystal2);
  if (mode === 'joined') return !!(f.crystal && f.crystal2 && f.connector);
  return false;
}
function bestWeaponMode(save) {
  return weaponOwned('joined', save) ? 'joined' : weaponOwned('dual', save) ? 'dual' : weaponOwned('single', save) ? 'single' : 'claws';
}
function migrateWeapons(save) {
  if (!save) return save;
  save.flags = save.flags || {};
  if (!save.weaponVersion) {
    // Prior releases awarded a joined purifier at crystal2. Preserve that
    // earned form only for those old saves; never repeat this inference.
    if (save.flags.crystal2) { save.flags.crystal = 1; save.flags.connector = 1; }
    save.weaponVersion = 1;
    save.weaponMode = bestWeaponMode(save);
  }
  if (!weaponOwned(save.weaponMode, save)) save.weaponMode = bestWeaponMode(save);
  return save;
}
// NO BLOCK BEFORE THE SWORD (owner, 2026-11-20: "Later on, when there is a
// sword, you can add block, but for now there is no block. But it's only
// claw."). The guard — and the parry it opens — comes with the first blade.
// NOSTOS's hero carries hers from the start.
function guardUnlocked(save = G.save) {
  if (typeof isHero === 'function' && isHero()) return true;
  return weaponOwned('single', save);           // the first blade, held or not
}
function weaponMode(save = G.save) {
  if (!save) return 'claws';
  // Read-only: callers rendering a frame must not mutate or migrate a save.
  return weaponOwned(save.weaponMode, save) ? save.weaponMode : bestWeaponMode(save);
}
// THE NEXT WEAPON IS AN ANSWER, NOT A COSTUME (owner, 2026-09-18: "enemies
// should get stronger and tougher and getting next weapon for character should
// improve atk points to compensate").
//
// Until now a weapon tier changed the MOVESET and nothing else: the same 12
// points of damage came out of a bare paw and out of the joined purifier, so
// every sword she earned was an animation change and the deeper kingdoms got
// slower to chew through rather than harder to survive. That is the wrong kind
// of difficulty — the fight does not get more dangerous, it gets longer.
//
// So the tier carries the damage curve, and ZONE_K's escalation is raised to
// meet it (see entities.js). A player who quests for her weapons keeps roughly
// the same time-to-kill all the way down; a player who skips them feels every
// kingdom she walks into. It multiplies dmg(), so it reaches the combo, the
// finisher, the burst, the hurricane and the throw at once rather than being
// re-applied at six call sites that would drift apart.
//
// Equipped, not owned: she can carry the joined blade and choose to fight with
// one, and the number follows what is actually in her paws.
//
// A STRONGER BLADE, A SHORTER FIGHT (owner, 2026-11-27, playing chapter one on an iPad: "the bosses
// are taking so much time to fight and win against, and it's hard to beat, especially for someone
// who's starting to play ... boring to wait until you win. Maybe at least you start with a stronger
// sword so that my attack is stronger ... I will need less hits to beat it. The fight is nice, but
// the sword is weak"). The crystal sword hit for 16 and now for 27 (x1.69), and the later blades keep
// their step above it (dual 32, joined 38). The claws she meets the rhino with: 12 -> 19. That first
// let a player who only presses ATTACK beat GRAVEHORN (tests/boss-skill.cjs), so his toss — the blow
// that answers standing at his snout — now costs two cores, and three blows in a breath in front of him
// bring it at once (js/gravehorn.js GH.tossCores, greedN). At 1.8 the masher won again on one seed.
// Measured with the boss ladder's own bots (tests/boss-ladder.cjs, tests/hit-count.cjs): a
// chapter-one guardian falls to roughly 40% fewer blows. No boss lost a move, a tell or an opening:
// the fight is the same fight, shorter.
const WEAPON_ATK = { claws: 1.6, single: 2.25, dual: 2.7, joined: 3.2 };
function weaponAtk(save = G.save) {
  return WEAPON_ATK[weaponMode(save)] || 1;
}
function equipWeapon(mode, save = G.save) {
  if (!save || !weaponOwned(mode, save)) return false;
  save.weaponMode = mode;
  if(typeof warmHeroWeaponArt==='function')warmHeroWeaponArt(mode);
  return true;
}
function grantWeapon(stage, save = G.save) {
  if (!save) return false;
  migrateWeapons(save);
  const f = save.flags;
  if (stage === 'single') f.crystal = 1;
  else if (stage === 'dual' && f.crystal) f.crystal2 = 1;
  else if (stage === 'joined' && f.crystal && f.crystal2) f.connector = 1;
  else return false;
  save.weaponMode = stage;
  if(typeof warmHeroWeaponArt==='function')warmHeroWeaponArt(stage);
  return true;
}
