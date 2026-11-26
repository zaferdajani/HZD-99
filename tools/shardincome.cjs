// HOW MANY SHARDS DOES SHE HAVE, KINGDOM BY KINGDOM? (owner, 2026-11-26: "Shard amounts will be
// tested to see if they're appropriate to the effort to get them. It should not be easy, but it
// should not be hard.")
//
// Counted from the game itself, in a browser, so it moves when the world does: every room is
// given to the kingdom it belongs to (its zone; a cave or a chamber takes the kingdom of the room
// whose exit or ring leads into it), and every source of shards in it is priced the way the code
// pays it:
//   - a person-machine she binds and purifies: 14 (Enemy.finishCleanse), and the purification
//     ladder on top at its counts (PURE_GIFTS);
//   - an empty construct broken: its wreck bursts into 4-9 (6.5 on average; a slag blob splits
//     into two more); the waking floor's yard winch pays its knocks;
//   - scrap lying in a room (its own amount), a quarry cache (80);
//   - a boss: bossScrap, plus the Alpha's 60 and a mini-boss's 40 (G.onBossDead);
//   - an agent purified: what SAGE_GIFT hands over; an errand: its paid reward (QUESTS);
//   - a woken NPC that has no gift of its own: 25 (NPC_GIFT['*']).
// That is a CLEAN SWEEP: every room once, every foe, every errand. A player who backtracks meets
// the constructs again (they come back on every visit) and one who skips rooms or dies with a full
// pouch has less: docs/OWNER_ORDERS.md (THE PACK LADDER) sets that against what the owner reported
// from his own play, and tests/pack-prices.cjs holds the shelf's wolf prices to the band.
//
//   node tools/shardincome.cjs            (the repo served on TEST_PORT, default 8220)
// The page function is exported for the harness: require('./tools/shardincome.cjs').PAGE_FN
const PAGE_FN = function shardIncomePage() {
  const ZK = { A: 1, B: 2, C: 3, D: 4, E: 5 };
  const adj = {}, K = {};
  const link = (a, b) => {
    if (!a || !b || !ROOMS[a] || !ROOMS[b]) return;
    (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a);
  };
  for (const [id, R] of Object.entries(ROOMS)) for (const v of Object.values(R.exits || {})) link(id, typeof v === 'string' ? v : v && v.to);
  if (typeof GATE_ROOM !== 'undefined') for (const [id, g] of Object.entries(GATE_ROOM)) for (const d of [].concat(g)) link(id, d && d.to);
  for (const id of Object.keys(ROOMS)) if (ZK[ROOMS[id].zone]) K[id] = ZK[ROOMS[id].zone];
  for (let pass = 0; pass < 12; pass++) for (const id of Object.keys(ROOMS)) if (!K[id]) for (const n of adj[id] || []) if (K[n]) { K[id] = K[n]; break; }
  // what one agent's gift pays, run against a scratch save
  const sageScrap = (room) => {
    const f = typeof SAGE_GIFT !== 'undefined' && SAGE_GIFT[room]; if (!f) return 0;
    const keep = { save: G.save, inv: window.invAdd, relic: G.grantRelic };
    G.save = { scrap: 0, iq: 0, flags: {}, bag: {}, relics: [], arms: [], inv: {} };
    window.invAdd = () => {}; G.grantRelic = () => {};
    try { f(); } catch (e) {}
    const s = G.save.scrap | 0;
    G.save = keep.save; window.invAdd = keep.inv; G.grantRelic = keep.relic;
    return s;
  };
  const role = (k) => (typeof STORY_ACTOR_ROLES !== 'undefined' && STORY_ACTOR_ROLES[k]) || '';
  const out = {};
  const perRoom = {};
  const row = (k) => out[k] || (out[k] = { rooms: 0, purify: 0, people: 0, wrecks: 0, constructs: 0, floor: 0, caches: 0, bosses: 0, bossList: [], agents: 0, errands: 0, npcs: 0, ladder: 0, total: 0 });
  const giftKeys = typeof NPC_GIFT !== 'undefined' ? Object.keys(NPC_GIFT) : [];
  for (const [id, R] of Object.entries(ROOMS)) {
    const k = K[id]; if (!k) continue;
    const r = row(k); r.rooms++;
    const t0 = () => r.purify + r.wrecks + r.floor + r.caches + r.bosses + r.agents + r.npcs;
    const before = t0();
    for (const d of R.ents || []) {
      const [kind, , , extra] = d;
      if (kind === 'gone') continue;
      if (EKIND[kind] && kind !== 'sage') {
        const rl = role(kind);
        if (rl === 'infected-person') { r.people++; r.purify += 14; }
        else if (id === 'A0') r.wrecks += (typeof WINCH_KNOCKS !== 'undefined' ? WINCH_KNOCKS * WINCH_KNOCK_SCRAP : 12);
        else { r.constructs++; r.wrecks += kind === 'blob' ? 6.5 * 3 : 6.5; }
      } else if (kind === 'sage') r.agents += sageScrap(id);
      else if (kind === 'scrap') r.floor += (extra || 10);
      else if (kind === 'chest' && extra === 'core') r.caches += 80;
      else if (kind === 'boss') {
        const b = { kind: extra };
        const extraPay = extra === 'alpha' ? 60 : ((typeof MINIS !== 'undefined' && MINIS[extra]) || extra === 'mirejaw') ? 40 : 0;
        r.bosses += bossScrap(b) + extraPay; r.bossList.push(extra);
      } else if (kind === 'npc' && extra && !giftKeys.some(g => g === id + '|' + extra) && extra !== 'ratchet' && extra !== 'servo') r.npcs += 25;
    }
    perRoom[id] = { k, shards: Math.round(t0() - before), people: (R.ents || []).filter(d => EKIND[d[0]] && role(d[0]) === 'infected-person').length };
  }
  for (const q of QUESTS) { const k = ZK[q.zone]; if (k && q.reward && q.reward.scrap) row(k).errands += q.reward.scrap; }
  // the purification ladder, kingdom by kingdom in the order she meets them
  let n = 0;
  for (const k of Object.keys(out).sort()) {
    const r = out[k], n1 = n + r.people;
    for (const g of PURE_GIFTS) if (g[0] > n && g[0] <= n1 && g[1] === 'scrap') r.ladder += g[2];
    n = n1;
  }
  for (const r of Object.values(out)) { r.wrecks = Math.round(r.wrecks); r.total = r.purify + r.wrecks + r.floor + r.caches + r.bosses + r.agents + r.errands + r.npcs + r.ladder; }
  return { kingdoms: out, rooms: perRoom, errands: QUESTS.filter(q => q.reward && q.reward.scrap).map(q => ({ id: q.id, k: ZK[q.zone], scrap: q.reward.scrap })) };
};
module.exports = { PAGE_FN };
if (require.main === module) {
  const { chromium } = require('playwright');
  const PORT = process.env.TEST_PORT || 8220;
  (async () => {
    const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
    const p = await b.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
    await p.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
    const r = (await p.evaluate('(' + PAGE_FN.toString() + ')()')).kingdoms;
    console.log('kingdom  rooms  purify(n)  wrecks(n)  floor  caches  bosses            agents  errands  npcs  ladder  | CLEAN SWEEP   cumulative');
    let cum = 0;
    for (const k of Object.keys(r).sort()) {
      const q = r[k]; cum += q.total;
      console.log(['K' + k, q.rooms, q.purify + '(' + q.people + ')', q.wrecks + '(' + q.constructs + ')', q.floor, q.caches, q.bosses + ' ' + q.bossList.join(','), q.agents, q.errands, q.npcs, q.ladder, '| ' + q.total, cum].join('  '));
    }
    await b.close();
  })().catch(e => { console.error(e); process.exit(1); });
}
