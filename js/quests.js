// ===========================================================================
// ERRANDS — what makes a kingdom a place instead of a corridor.
//
// The world was a line: every room had one way on, and the only reason to
// enter a room was that it stood between you and the next one. Nobody in it
// ever wanted anything. The machine folk had lines of dialogue, which is not
// the same as having something to say to you a second time.
//
// An errand is deliberately small: somebody asks, you go somewhere you were
// not going to go, you come back, they are different afterwards. Three kinds,
// because three is enough to make a kingdom feel inhabited and each one is
// checkable from state the game already keeps:
//
//   FETCH   bring back a thing that exists in exactly one place
//   CULL    deal with a number of a particular machine, in this kingdom
//   REACH   stand somewhere that is not on the way to anything
//
// None of them is required to finish the game, and none of them is a fetch
// quest wearing a hat: each one exists to send you into a wing of the kingdom
// you would otherwise never open.
// ===========================================================================
const QUESTS = [
  {
    // THE GAME'S FIRST QUEST — the sword is EARNED, not handed over.
    // Ratchet's story (the ask text): the corrupted song took every unit
    // around him; the small crystal on his chest lit and burned the song out
    // of him — but it was too small, its charge faded, and before the song
    // could creep back he pulled his own plug. Her cell woke him. He can
    // forge a PURIFIER from pure crystal, if she quarries a shard of the
    // pillar in the crystal cave (the depth door in A5's backdrop). Until
    // then her claws BREAK the small machines but cannot CLEANSE anything —
    // which is the point of the whole errand.
    id: 'ratchet_forge',
    npc: 'ratchet', zone: 'A',
    kind: 'fetch', item: 'cshard',
    reward: { forge: 1, iq: 10 },
  },
  {
    id: 'servo_coil',                    // A1 — sends you UP, into the gantries
    npc: 'servo', zone: 'A',
    kind: 'fetch', item: 'coil',
    reward: { scrap: 60, iq: 10 },
  },
  {
    id: 'servo_swarm',                   // A1 — after the first, and harder
    npc: 'servo', zone: 'A', after: 'servo_coil',
    kind: 'cull', foe: 'crawler', count: 6,
    reward: { scrap: 90, iq: 10 },
  },
  {
    id: 'ratchet_deep',                  // A3 — the drop nobody takes
    npc: 'ratchet', zone: 'A', after: 'ratchet_forge',
    kind: 'reach', room: 'A7',
    reward: { scrap: 80, relic: 'coin' },
  },
  {
    id: 'mono_relay',                    // B3 — sends you UP the cable risers
    npc: 'mono', zone: 'B',
    kind: 'fetch', item: 'relay',
    reward: { scrap: 110, iq: 10 },
  },
  {
    id: 'patch_quiet',                   // C2 — the Foundry's own errand
    npc: 'patch', zone: 'C',
    kind: 'cull', foe: 'turret', count: 4,
    reward: { scrap: 140, iq: 15 },
  },
  {
    id: 'sage_index',                    // D1 — the climb into the cold stacks
    npc: 'sage', zone: 'D',
    kind: 'fetch', item: 'index',
    reward: { scrap: 150, iq: 15 },
  },
  {
    id: 'lumen_light',                   // E1 — the last one, in the Nest
    npc: 'lumen', zone: 'E',
    kind: 'fetch', item: 'lens',
    reward: { scrap: 160, iq: 15 },
  },
];
function questById(id) { for (const q of QUESTS) if (q.id === id) return q; return null; }
function qState(id) {
  const s = G.save && G.save.quests;
  return (s && s[id]) || 'none';                 // none | active | done
}
function qSet(id, v) {
  if (!G.save) return;
  G.save.quests = G.save.quests || {};
  G.save.quests[id] = v;
  persist();
}
// what this NPC has to say about work, if anything
function questFor(npc) {
  // NOT DURING THE LESSON. The waking floor's trader exists to teach that scrap
  // buys things, and the trader is `ratchet`, who also carries an errand —
  // so the tutorial's shop step was answered with "go and stand in a room you
  // cannot reach yet", the shop never opened, the cell could not be bought and
  // the door that waits on that step never lifted. The kingdom's errands start
  // once the kingdom does.
  if (G.save && G.save.flags && !G.save.flags.tut) return null;
  for (const q of QUESTS) {
    if (q.npc !== npc) continue;
    if (qState(q.id) === 'done') continue;
    if (q.after && qState(q.after) !== 'done') continue;
    return q;
  }
  return null;
}
function qProgress(q) {
  if (q.kind === 'fetch') return (G.save.bag && G.save.bag[q.item]) ? 1 : 0;
  if (q.kind === 'cull') return Math.min(q.count, (G.save.culls && G.save.culls[q.foe]) | 0);
  if (q.kind === 'reach') return (G.save.visited && G.save.visited[q.room]) ? 1 : 0;
  return 0;
}
function qGoal(q) { return q.kind === 'cull' ? q.count : 1; }
function qDone(q) { return qProgress(q) >= qGoal(q); }
// one line, in the player's language, describing what is being asked
function qText(q) {
  if (q.kind === 'fetch') return t('q_fetch').replace('%s', t('it_' + q.item));
  if (q.kind === 'cull') return t('q_cull').replace('%n', q.count).replace('%s', t('e_' + q.foe));
  return t('q_reach');
}
// ---------------------------------------------------------------------------
// The bookkeeping the errands read. Culls are counted per KIND and per run;
// the bag holds the one-off things somebody asked for.
// ---------------------------------------------------------------------------
function questKill(kind) {
  if (!G.save) return;
  G.save.culls = G.save.culls || {};
  G.save.culls[kind] = ((G.save.culls[kind] | 0) + 1);
  // tell the player the moment an errand ticks over, or the counting is invisible
  for (const q of QUESTS) {
    if (q.kind !== 'cull' || q.foe !== kind || qState(q.id) !== 'active') continue;
    const n = qProgress(q);
    if (n >= q.count) { G.toast(t('q_ready')); sfx('chargeReady'); }
    else G.toast(n + ' / ' + q.count);
  }
}
function questTake(item) {
  if (!G.save) return;
  G.save.bag = G.save.bag || {};
  G.save.bag[item] = 1;
  G.toast(t('got') + ' — ' + t('it_' + item));
  sfx('chest');
  for (const q of QUESTS)
    if (q.kind === 'fetch' && q.item === item && qState(q.id) === 'active') { G.toast(t('q_ready')); }
  persist();
}
// paid out by the NPC who asked, face to face
function questPay(q) {
  const r = q.reward || {};
  if (r.scrap) { G.save.scrap += r.scrap; G.toast('+' + r.scrap + ' ' + t('scrap')); }
  if (r.iq) { G.save.iq += r.iq; if (typeof iqNudge === 'function') iqNudge(); }
  if (r.relic && typeof G.grantRelic === 'function') G.grantRelic(r.relic);
  if (q.kind === 'fetch' && G.save.bag) delete G.save.bag[q.item];
  qSet(q.id, 'done');
  sfx('win');
  burst(player.x + player.w / 2, player.y, 24, '#ffd76a', 280, 0.8, 120, 4, true);
  // the forge is a REWARD KIND, not a special-cased NPC: any future quest can
  // end in a making (see forgeCrystal in game.js — the cinematic's code hook)
  if (r.forge && typeof forgeCrystal === 'function') forgeCrystal();
}
// how many are open, for the pause screen
function questOpen() {
  let n = 0;
  for (const q of QUESTS) if (qState(q.id) === 'active') n++;
  return n;
}
