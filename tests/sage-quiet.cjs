// "I WILL KEEP THIS END QUIET" — the sage's promise, measured.
//
// The parity audit's note against comic page 26 was that the reveal exists and
// the coordinated shutdown does not: the Meadow Sage promised to close its end
// of the calling network and the tunnel she walked back out through was exactly
// as hostile as the one she walked in through. A promise a player can walk
// straight through is a caption.
//
// Two halves, and both matter. The moment: everything still hunting her in the
// chamber stands down as the halo turns, because that is the only frame where
// the shutdown is visibly the SAGE's doing. The persistence: the whole network
// wakes calm afterwards, from the save fact, on a fresh load.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  try {
    const p = await b.newPage();
    await p.goto('http://127.0.0.1:8220/index.html');
    await p.waitForFunction(() => typeof startGame === 'function');
    const r = await p.evaluate(() => {
      window.requestAnimationFrame = () => 0;
      const stage = (flags, room) => {
        const s = newSave(1); s.time = 99; s.storyVersion = 2;
        Object.assign(s.flags, { woke: 1, tut: 1, crystal: 1 }, flags);
        startGame(s); loadRoom(room);
        G.wake = G.cut = G.dialog = G.trans = null; G.state = 'PLAY';
        return s;
      };
      const hostiles = () => (G.enemies || []).filter(e => e && !e.dead && e.kind !== 'sage' && !e.calm).length;
      const others = () => (G.enemies || []).filter(e => e && !e.dead && e.kind !== 'sage').length;

      // BEFORE: the network is hostile. If it is not, the rest proves nothing.
      stage({}, 'GA1D');
      const before = { chamber: hostiles(), n: others() };
      stage({}, 'GA1T');
      const beforeTunnel = hostiles();

      // THE MOMENT: purify the sage with company still in the room.
      stage({}, 'GA1D');
      const sage = (G.enemies || []).find(e => e && e.kind === 'sage');
      if (!sage) throw Error('no sage in the chamber');
      const company = others();
      sageTame(sage);
      const afterMoment = hostiles();

      // PERSISTENCE: a fresh load of every room in the network.
      const net = {};
      for (const room of ['GA1', 'GA1T', 'GA1D']) {
        stage({ sageTame_GA1D: 1 }, room);
        net[room] = { hostile: hostiles(), total: others() };
      }
      // ...and a network whose sage is still kneeling is untouched by it.
      stage({ sageTame_GA1D: 1 }, 'GA2T');
      const otherNet = hostiles();
      // nor is ordinary ground anywhere near it
      stage({ sageTame_GA1D: 1 }, 'A1');
      const meadow = hostiles();

      return { before, beforeTunnel, company, afterMoment, net, otherNet, meadow,
               flagged: !!G.save.flags.sageTame_GA1D };
    });

    assert(r.before.chamber > 0, 'the chamber must start hostile or this measures nothing');
    assert(r.beforeTunnel > 0, 'so must the tunnel');
    assert(r.company > 0, 'the sage must have company for the shutdown to be visible');
    assert.equal(r.afterMoment, 0, 'everything still hunting her stands down as the halo turns');
    for (const room of ['GA1', 'GA1T', 'GA1D']) {
      assert.equal(r.net[room].hostile, 0, room + ' is still hostile after the sage stood up');
    }
    // the grotto is a rest and a dig, so it is allowed to be empty; the two
    // rooms she actually fights through are not, or the check is vacuous.
    for (const room of ['GA1T', 'GA1D']) {
      assert(r.net[room].total > 0, room + ' has nobody in it — the check is vacuous');
    }
    assert(r.otherNet > 0, "one sage does not quiet another network's cave");
    assert(r.meadow > 0, 'nor the meadow above it');
    console.log('PASS sage-quiet: the chamber stands down in the moment (' + r.company +
                ' machines), all three rooms of the network wake calm on a fresh load, and no other cave or surface is touched', r);
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
