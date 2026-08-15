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
  // ---- THE PURIFIER BRANCH -----------------------------------------------
  // A new tree grows when the crystal does (the owner's ruling: the sword is
  // "a new fighting skill, a new finding mood... a new tree will appear in
  // the skills"). `need` names the save flag that makes a node EXIST — not
  // merely locked but absent, so a player without the crystal never sees a
  // tree for a weapon they have not met. The teaching order follows
  // combat-education §5: each node is a verb, and no verb is required the
  // room after it is learned.
  { id: 'purity', cost: 30, tier: 1, need: 'crystal' },    // slashes cleanse the infected
  { id: 'risecut', cost: 45, tier: 1, need: 'crystal' },   // the up-slash becomes a launcher
  { id: 'plunge', cost: 60, tier: 2, need: 'crystal' },    // the down-slash lands a shockwave
  { id: 'boomer', cost: 90, tier: 2, need: 'crystal2' },   // the joined blade flies and returns
];
// The tree as SHE sees it: only nodes whose weapon she holds. Every reader of
// SKILLS — the screen, the HUD nudge, the affordable/next pair — goes through
// here, so the four can never disagree about what exists.
function skillPool() {
  const f = (typeof G !== 'undefined' && G.save && G.save.flags) || {};
  return SKILLS.filter(sk => !sk.need || f[sk.need]);
}
function tierOpen(tier, unlocked) { return tier === 0 || (tier === 1 && unlocked >= 1) || (tier === 2 && unlocked >= 3); }

// Relics — bonus items: 'drop' from enemy wrecks, boss trophies, or hidden glimmers
const RELIC_DROPS = ['bell', 'lens', 'coolant', 'spring'];
const RELIC_TROPHY = { glitch: 'fang', brood: 'silk', atlas: 'ember', zero: 'shard', prism: 'whisker', mother: 'silent' };
const RELIC_ICONS = { bell: '🔔', lens: '◐', coolant: '🧪', spring: '〰', fang: '⟅', silk: '❋', ember: '🔥', shard: '❆', whisker: '⌇', silent: '●', collar: '◍', coin: '◎', star: '✦', sigil1: '⚿', sigil2: '⚿', sigil3: '⚿', aegis: '⛨' };
