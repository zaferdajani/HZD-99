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
function equipWeapon(mode, save = G.save) {
  if (!save || !weaponOwned(mode, save)) return false;
  save.weaponMode = mode;
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
  return true;
}
