// Owner combat brief, 2026-10-16. Runtime stats and the printable field guide
// share these records. HP still comes from EKIND/BSTAT and the existing save
// scaling; we do not invent a second health pool or change earned equipment.
const COMBAT_VERSION = '2026-10-16.1';
const COMBAT_ARMOR = Object.freeze({ crawler: 0, guard: 12, flier: 0, turret: 12,
  hopper: 4, blob: 8, bat: 0, surge: 10, kiln: 12, rime: 10, snare: 8, sage: 8,
  glitch: 8, alpha: 10, horn: 18, brood: 12, atlas: 18, zero: 16, prism: 12,
  mother: 20, chime: 6, carrier: 8, moth: 10, lattice: 14, lens: 12, winch: 0 });
const COMBAT_ZONE_ARMOR = Object.freeze({ A: 0, B: 2, C: 4, D: 6, E: 8, X: 8 });
const COMBAT_HERO_CD = Object.freeze([0.26, 0.23, 0.33]);
const COMBAT_IMPACT = Object.freeze({
  normal: { flash: 0.045, fragments: 5, shake: 2.5, stop: 0.05 },
  heavy: { flash: 0.065, fragments: 9, shake: 5, stop: 0.085 },
  charged: { flash: 0.085, fragments: 14, shake: 7, stop: 0.12 },
});
function combatProfile(e) {
  const kind = e && (e.mechanism === 'winch' ? 'winch' : e.kind) || 'npc';
  const boss = typeof BSTAT !== 'undefined' && BSTAT[kind];
  const zone = boss && boss.zone || e && e.combatZone || (typeof G !== 'undefined' && G.roomDef && G.roomDef.zone) || 'A';
  return { kind, defense: Math.min(35, (COMBAT_ARMOR[kind] || 0) + (COMBAT_ZONE_ARMOR[zone] || 0)),
    // A cadence multiplier, NOT a fabricated attacks/sec figure. Each authored
    // state machine retains its tells, recovery, range and phase timing.
    attackSpeed: boss && typeof BOSS_AGGRO !== 'undefined' ? BOSS_AGGRO[kind] || 1 : 1,
    attackPower: typeof DF === 'function' ? DF().edmg : 1 };
}
function combatInit(e) {
  e.combatZone = (G.roomDef && G.roomDef.zone) || 'A';
  const s = combatProfile(e);
  e.defense = typeof isHero === 'function' && isHero() ? 0 : s.defense;
  e.attackPower = s.attackPower; e.attackSpeed = s.attackSpeed;
}
function combatDefense(e) { return Math.max(0, Math.min(75, Number.isFinite(e.defense) ? e.defense : 0)); }
function combatIncoming(d, foe, src) {
  // Explicit attacker wins. Named attack sources can recover an actor; hazard
  // damage with no actor keeps its own authored value, never a guessed boss.
  if (!foe && typeof src === 'string' && typeof G !== 'undefined') {
    const kind = src.split('.')[0];
    foe = (G.enemies || []).concat(G.boss ? [G.boss] : []).find(e => e.kind === kind && !e.dead);
  }
  return foe && Number.isFinite(foe.attackPower) ? Math.max(1, d * foe.attackPower / DF().edmg) : d;
}
function combatDamage(raw, defense) {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.max(1, Math.round(raw * (1 - Math.max(0, Math.min(75, defense || 0)) / 100)));
}
function combatProtected(e) {
  return !e || e.dead || e.disabled || e.rescued || e.friendly || e.tame || (e.calm && e.mechanism !== 'winch') || e.meet
    || e.st === 'purified' || e.st === 'yield'
    || (typeof isPet === 'function' && isPet(e))
    || (typeof isWolf === 'function' && isWolf(e) && typeof packTamed === 'function' && packTamed());
}
function combatStats(e) {
  if (typeof player !== 'undefined' && e === player) {
    const cd = COMBAT_HERO_CD.map(v => v * (hasCrest('over') ? 0.7 : 1));
    const style = crestStyleNow(), block = style && typeof crestAttackOf === 'function' && crestAttackOf(style);
    const factor = block && block.cd || 1;
    const mode = weaponMode(), wield = mode === 'joined' ? 2 : mode === 'claws' ? 0 : 1;
    const chain = block && block.chain === 2 ? [cd[0], cd[2]] : cd;
    return { kind: 'HZD-99', hp: e.cores, hpMax: e.maxCores(), hpUnit: 'cores', defense: 0,
      // Inspection never rolls crits or creates combat particles.
      basePower: e.dmg(), attackPower: Math.round(e.dmg() * ATK_MOD.wield[wield]),
      attackSpeed: +(chain.length / (chain.reduce((a,b)=>a+b,0) * factor)).toFixed(2),
      speedUnit: 'swings/second before hit-stop', weapon: weaponMode(), guard: 'front blocks; brace breaks on third hit',
      burst: e.attackDmg('burst'), specialPower: e.attackDmg(mode === 'dual' ? 'swirl' : mode === 'joined' ? 'throw' : 'burst'),
      specialPerPass: mode === 'dual' || mode === 'joined', protected: false };
  }
  const p = combatProfile(e), npc = e && e.type === 'npc';
  return { kind: npc ? e.extra : p.kind, hp: npc ? 100 : Math.max(0, e.hp || 0),
    hpMax: npc ? e.hpMax || 100 : e.hpMax || e.hpMax0 || e.hp || 0, hpUnit: npc ? 'integrity (protected)' : 'HP',
    defense: npc ? 100 : combatDefense(e), attackPower: npc || combatProtected(e) ? 0 : e.attackPower || p.attackPower,
    powerUnit: 'cores/contact on hero', attackSpeed: npc || combatProtected(e) ? 0 : e.attackSpeed || 1,
    speedUnit: 'authored cadence multiplier', protected: npc || !!combatProtected(e) };
}
// A bounded session ledger. Persistent copies are local only; no network or
// save-slot schema changes. Export includes the exact equipped stats and build.
let COMBAT_LOG = [];
function combatLog(e, raw, lost, move, result) {
  if (typeof G === 'undefined') return;
  COMBAT_LOG.push({ time: +(G.save && G.save.time || 0).toFixed(3), room: G.roomId,
    target: e.kind || 'HZD-99', move: move || 'contact', raw, defense: combatDefense(e), lost,
    hp: Number.isFinite(e.hp) ? Math.max(0, e.hp) : e.cores, result: result || 'hit',
    weapon: typeof weaponMode === 'function' ? weaponMode() : null });
  if (COMBAT_LOG.length > 200) COMBAT_LOG.splice(0, COMBAT_LOG.length - 200);
}
function combatLogData() {
  return { version: COMBAT_VERSION, build: typeof BUILD_ID !== 'undefined' ? BUILD_ID : null,
    hero: typeof player !== 'undefined' && player ? combatStats(player) : null, events: COMBAT_LOG.slice() };
}
function combatLogPersist() { try { localStorage.setItem('clawbyte.combat.last', JSON.stringify(combatLogData())); } catch (_) {} }
function exportCombatLog() {
  combatLogPersist();
  const a = document.createElement('a'), u = URL.createObjectURL(new Blob([JSON.stringify(combatLogData(), null, 2)], {type:'application/json'}));
  a.href = u; a.download = 'CLAWBYTE-combat-log.json'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
}
if (typeof window !== 'undefined') window.addEventListener('pagehide', combatLogPersist);

function combatImpact(e, x, y, move) {
  if (typeof isHero === 'function' && isHero()) return;
  if (!e || e.rescued || e.tame || e.st === 'purified') return;
  const charged = ['burst','swirl','throw','throwBack'].includes(move);
  const p = COMBAT_IMPACT[charged ? 'charged' : move === 'finisher' ? 'heavy' : 'normal'];
  const reduced = typeof infEyeReduced === 'function' && infEyeReduced();
  // Real time: the short white flash ends even while the combat clock pauses.
  e.impactUntil = performance.now() + (reduced ? 0 : p.flash * 1000);
  if (typeof metalBurst === 'function') metalBurst(x, y, reduced ? 2 : p.fragments, charged);
  // Existing move callers own normal contact sounds, knockback and hit-stop.
  // Charged release may light up on a miss, but the impact pause only happens
  // here, AFTER damage. Multi-hit specials pause only their first contact.
  if (charged && typeof player !== 'undefined') {
    const key = move === 'throwBack' ? 'throw' : move;
    const token = key === 'swirl' ? player.swirlImpactDone : key === 'throw' ? G.boomer && G.boomer.impactDone : player.burstImpactDone;
    if (!token) {
      if (!reduced) { G.hitStop = Math.max(G.hitStop || 0, p.stop); cam.shake = Math.max(cam.shake || 0, p.shake); }
      player.vx -= (player.face || 1) * 90;
      if (typeof padRumble === 'function') padRumble(0.55, 0.7, 140);
      sfx('bosshit');
      if (key === 'throw' && G.boomer) G.boomer.impactDone = true;
      if (key === 'burst') player.burstImpactDone = true;
      if (key === 'swirl') player.swirlImpactDone = true;
    }
  }
}
