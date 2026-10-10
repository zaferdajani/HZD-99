// ===========================================================================
// ERRANDS — what makes a kingdom a place instead of a corridor.
//
// The world was a line: every room had one way on, and the only reason to
// enter a room was that it stood between you and the next one. Nobody in it
// ever wanted anything. The machine folk had lines of dialogue, which is not
// the same as having something to say to you a second time.
//
// An errand is deliberately small: somebody asks, you go somewhere you were
// not going to go, you come back, they are different afterwards. Four kinds,
// each checkable from state the game already keeps:
//
//   FETCH   bring back a thing that exists in exactly one place
//   CULL    deal with a number of a particular machine, in this kingdom
//   REACH   stand somewhere that is not on the way to anything
//   READ    find and read one particular terminal (the evidence, not the room)
//
// Most are optional side errands. ratchet_forge is the main-story exception:
// it earns the cleansing sword required before meeting the first sage.
// See docs/STORY_CANON.md for the owner's narrative contract.
// ===========================================================================
const QUESTS = [
  {id:'alpha_pack', npc:'ratchet', zone:'A', after:'ratchet_forge', kind:'flag', flag:'alpha', reward:{}},
  {
    // THE GAME'S FIRST QUEST — the sword is EARNED, not handed over.
    // Ratchet's inherited marble slowed the infection but could not stop it.
    // He removed his own battery; the hero retrieves it from his drawer and
    // restores him. Rounded raw marble from the early cave lets him forge
    // the Purifier before the first Sage. Claws can stop machines, but only
    // the earned sword cleanses them. See docs/STORY_CANON.md.
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
    // A3 — the drop nobody takes. What he wants from the bottom of it is the
    // quarrymen's SURVEY (terminal 20, ROOMS.A7): the chart of the white seam
    // and the chalk road. It used to be a REACH, finished by falling into the
    // room — so the coin was paid on arrival, before the one thing down there
    // worth seeing, and a player could take it without ever reading the
    // survey at all (studio review MIS-01). It is finished by reading it now.
    id: 'ratchet_deep',
    npc: 'ratchet', zone: 'A', after: 'ratchet_forge',
    kind: 'read', room: 'A7', term: 20,
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
  // THE ERRAND STARTS WHEN IT IS GIVEN (plan §4.9). Progress used to read the
  // run's all-time counters, so "deal with six crawlers" was finished the
  // moment it was asked by a player who had broken six crawlers on the way in,
  // and "stand in the shaft" by one who already had. Accepting snapshots the
  // counter the errand reads; progress is measured from there.
  if (v === 'active' && G.save.quests[id] !== 'active') questSnap(id);
  G.save.quests[id] = v;
  persist();
}
function questSnap(id) {
  const q = questById(id);
  if (!q) return;
  const base = G.save.qbase = G.save.qbase || {};
  if (q.kind === 'cull') base[id] = { n: (G.save.culls && G.save.culls[q.foe]) | 0 };
  // a place counts once she stands in it AFTER being asked (questVisit)
  else if (q.kind === 'reach') base[id] = { reached: 0 };
  // Fetch items may already be in the bag before the request; questItemLive
  // allows early discovery and questFoundEarly handles the NPC response.
  // There is no fetch counter to snapshot. A READ is the same: a terminal
  // read before the ask is a discovery the asker remembers (questFoundEarly
  // pays it on the ask), so there is nothing to measure from.
}
// ---- READ: the terminal is the evidence ------------------------------------
// doInteract's terminal branch reports every read here. The read is recorded
// per terminal id in the save (flags.termRead), so it is remembered whether or
// not anybody has asked yet — that record IS the early discovery. Standing in
// the room records nothing: the room is where the evidence is, not the
// evidence.
function questRead(room, term) {
  if (!G.save || term == null) return;
  const f = G.save.flags = G.save.flags || {};
  const rd = f.termRead = f.termRead || {};
  const fresh = !rd[term];
  rd[term] = 1;
  if (fresh) {
    for (const q of QUESTS)
      if (q.kind === 'read' && q.term == term && (!q.room || q.room === room) && qState(q.id) === 'active') G.toast(t('q_ready'));
  }
  persist();
}
function qReadDone(q) {
  const rd = G.save && G.save.flags && G.save.flags.termRead;
  return !!(rd && rd[q.term]);
}
// THE SURVEY'S SAVE RULE (MIS-01). Brought onto every save at startGame, once
// or a hundred times — it only ever removes residue:
//   * paid under the old visit rule ('done'): untouched. questFor skips a
//     finished errand and questPay only runs for an open one, so it is never
//     offered again and never paid twice.
//   * active, and she already dropped into A7 without reading: the old rule
//     left a snapshot saying the place was reached. Nothing reads it any more
//     (qProgress for a READ looks only at the terminal), but it is dropped so
//     no later reach-shaped code can mistake it for the evidence. The errand
//     stays open until the survey is read — it does not complete on load.
//   * never asked, but visited A7: nothing to change — the early-discovery
//     path now asks about the survey, not the room.
function questMigrate(save) {
  if (!save || !save.qbase) return save;
  for (const q of QUESTS)
    if (q.kind === 'read' && save.qbase[q.id] && save.qbase[q.id].reached != null) delete save.qbase[q.id];
  return save;
}
// loadRoom tells the errands where she is standing
function questVisit(room) {
  if (!G.save || !G.save.quests) return;
  for (const q of QUESTS) {
    if (q.kind !== 'reach' || q.room !== room || qState(q.id) !== 'active') continue;
    const b = G.save.qbase && G.save.qbase[q.id];
    if (b && !b.reached) { b.reached = 1; G.toast(t('q_ready')); }
  }
}
// is this errand item allowed to lie in the world? From the start of the run
// until it is handed in — never twice. It used to appear only once somebody
// asked for it, which made the player who explored first come BACK to an
// empty room after the ask (owner, 2026-10-09: "Reward early exploration:
// remember discoveries and adapt later quest dialogue rather than making
// players revisit an empty room"). Found early, it waits in the bag, and the
// asker says so when they ask (questFoundEarly, js/progress.js).
function questItemLive(item) {
  if (G.save.bag && G.save.bag[item]) return false;
  for (const q of QUESTS) if (q.kind === 'fetch' && q.item === item) return qState(q.id) !== 'done';
  return true;
}
// what this NPC has to say about work, if anything
function questFor(npc) {
  // DURING THE LESSON the errand may SPEAK — it may not take over. The old
  // guard here silenced every quest until the tutorial ended, which cost the
  // game its first story beat: Ratchet wakes on the waking floor and says
  // NOTHING about the song, the chest crystal, or the sword — the owner's
  // exact report ("it doesn't have a story"). The bug the guard was patched
  // in for was `after` being OVERWRITTEN so the shop lesson never opened;
  // doInteract chains base() after the errand now, so the ask can play and
  // the shop still opens behind it. The one thing still held back during the
  // walk is everyone EXCEPT the trader — side errands can wait for the
  // kingdom; his story cannot.
  if (G.save && G.save.flags && !G.save.flags.tut && npc !== 'ratchet') return null;
  for (const q of QUESTS) {
    if (q.id === 'alpha_pack' || q.npc !== npc) continue;
    if (qState(q.id) === 'done') continue;
    if (q.after && qState(q.after) !== 'done') continue;
    return q;
  }
  return null;
}
function qProgress(q) {
  if (q.kind === 'flag') return G.save.flags[q.flag] ? 1 : 0;
  if (q.kind === 'fetch') return (G.save.bag && G.save.bag[q.item]) ? 1 : 0;
  // measured from the snapshot taken when it was accepted; an errand accepted
  // before snapshots existed (an older save) keeps counting from zero, as it did
  const b = G.save.qbase && G.save.qbase[q.id];
  if (q.kind === 'cull') return Math.max(0, Math.min(q.count, ((G.save.culls && G.save.culls[q.foe]) | 0) - (b ? b.n | 0 : 0)));
  if (q.kind === 'reach') return b ? (b.reached ? 1 : 0) : ((G.save.visited && G.save.visited[q.room]) ? 1 : 0);
  // the survey read, never the room visited — whenever it was read
  if (q.kind === 'read') return qReadDone(q) ? 1 : 0;
  return 0;
}
function qGoal(q) { return q.kind === 'cull' ? q.count : 1; }
function qDone(q) { return qProgress(q) >= qGoal(q); }
// one line, in the player's language, describing what is being asked
function qText(q) {
  if (q.kind === 'flag') return t('q_goal_' + q.id);
  if (q.kind === 'fetch') return t('q_fetch').replace('%s', t('it_' + q.item));
  if (q.kind === 'cull') return t('q_cull').replace('%n', q.count).replace('%s', t('e_' + q.foe));
  if (q.kind === 'read') { const k = 'q_goal_' + q.id, v = t(k); if (v !== k) return v; }
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
  let wanted = false;
  for (const q of QUESTS)
    if (q.kind === 'fetch' && q.item === item && qState(q.id) === 'active') { G.toast(t('q_ready')); wanted = true; }
  // found before anybody asked: it is somebody's, and she keeps it for them
  if (!wanted && t('pg_keep_it') !== 'pg_keep_it') G.toast(t('pg_keep_it'));
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
