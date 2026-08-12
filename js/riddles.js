// CLAWBYTE — the Neural Tree (IQ → skills) and the relic table.
//
// The word riddles that used to live here are gone. They asked the player to
// solve a pun in English — a vocabulary test wearing a puzzle's clothes, which
// a young player or a player reading the Arabic could not attempt at all, and
// which could not be translated honestly because a pun does not survive the
// journey. Mind Nodes now hand out one interactive puzzle each (NODES in
// trials.js): remember the lights, read the cubes, weigh the objects.
// Neural Tree — skills unlocked with accumulated IQ
const SKILLS = [
  { id: 'mind', cost: 10, tier: 0 },    // +1 crest socket
  { id: 'calc', cost: 20, tier: 0 },    // stronger combo finisher
  { id: 'reflex', cost: 30, tier: 1 },  // longer invincibility after hits
  { id: 'router', cost: 40, tier: 1 },  // cheaper EMP
  { id: 'reach', cost: 50, tier: 1 },   // the finisher becomes the long rake
  { id: 'triple', cost: 60, tier: 2 },  // third jump
  { id: 'wave', cost: 80, tier: 2 },    // slashes fire an energy wave
];
function tierOpen(tier, unlocked) { return tier === 0 || (tier === 1 && unlocked >= 1) || (tier === 2 && unlocked >= 3); }

// Relics — bonus items: 'drop' from enemy wrecks, boss trophies, or hidden glimmers
const RELIC_DROPS = ['bell', 'lens', 'coolant', 'spring'];
const RELIC_TROPHY = { glitch: 'fang', brood: 'silk', atlas: 'ember', zero: 'shard', prism: 'whisker', mother: 'silent' };
const RELIC_ICONS = { bell: '🔔', lens: '◐', coolant: '🧪', spring: '〰', fang: '⟅', silk: '❋', ember: '🔥', shard: '❆', whisker: '⌇', silent: '●', collar: '◍', coin: '◎', star: '✦', sigil1: '⚿', sigil2: '⚿', sigil3: '⚿', aegis: '⛨' };
