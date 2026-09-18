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
const WEAPON_ATK = { claws: 1, single: 1.3, dual: 1.6, joined: 1.95 };
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
