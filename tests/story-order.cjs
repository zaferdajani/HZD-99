// THE STORY IN ORDER, WALKED (plan §4 "process fix", §5 "who points you there").
//
// The owner kept finding loopholes by playing: the Conduits open from the
// camp, a whole game finished without the sword, a sage telling her to silence
// a bell she had already silenced, an errand finished before it was given. Each
// was a rule that existed only in prose. This harness makes the prose a table
// (tests/story-sheet.json, human copy docs/STORY_SHEET.md) and walks the REAL
// build against it:
//
//   1. the sheet itself: every beat has a room, a speaker, what they know and
//      who points the player there — never empty — and every line it names
//      resolves in all five languages
//   2. the room graph, through production gates only (checkTransitions,
//      gateEnter, the beat's own predicate): a beat that becomes possible
//      before its required flags is a failure, and every non-optional beat must
//      become possible. Walked twice — greedily (everything the moment it is
//      reachable, the way a player who ignores directions plays) and on the
//      route the Meadow Sage gives
//   3. every line, evaluated at the moment it is said, may only name what the
//      player has met — or what that very line introduces
//   4. the specific loopholes of the plan, each driven through production code:
//      save migration, the Conduits gate, the blade for taming, one Ratchet,
//      the wrong-order lines, the vault's side door, errand snapshots, bound
//      keys in speech, the canon finale
//
//   node tests/story-order.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SHEET = JSON.parse(fs.readFileSync(path.join(__dirname, 'story-sheet.json'), 'utf8'));

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof migrateStory === 'function', { timeout: 30000 });

  const r = await page.evaluate((SHEET) => {
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail) });
    // the game's own loop must not run between the steps of a staged measurement
    window.requestAnimationFrame = () => 0;
    demoOn = () => false;                       // the full game, not the free chapter
    const fresh = (flags) => {
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { woke: 1, tut: 1 }, flags || {});
      sv.comics = {};
      for (const ch of ((window.COMIC_MANIFEST || {}).chapters || [])) sv.comics[ch.id] = { offered: true, revision: ch.revision };
      startGame(sv);
      G.wake = G.cut = G.dialog = G.trans = G.meet = G.break = G.gateWalk = G.bossEntry = null; G.tut = null; G.state = 'PLAY';
      return sv;
    };
    const LANGS_ = LANGS.map(l => l.id);
    const say = (k) => { const v = t(k); return Array.isArray(v) ? v : [v]; };

    // ---- 1. THE SHEET ---------------------------------------------------
    const beats = SHEET.beats;
    for (const b of beats) {
      const empty = ['room', 'speaker', 'knows', 'pointer'].filter(k => !b[k] || !String(b[k]).trim());
      if (empty.length) check('beat ' + b.id + ' has every column', false, 'empty: ' + empty.join(','));
      if (b.room && !ROOMS[b.room]) check('beat ' + b.id + ' stands in a real room', false, b.room);
      for (const k of b.lines || []) {
        if (k[0] === '@') continue;
        for (const l of LANGS_) {
          LANG = l;
          const v = t(k);
          if (v === k || v == null || (Array.isArray(v) && !v.length)) check('line ' + k + ' resolves in ' + l, false, b.id);
        }
        LANG = 'en';
      }
    }
    check('the sheet: every beat has room, speaker, what they know and who points there', !checks.length,
      beats.length + ' beats');

    // every key of the ordered story's own table is complete in every language
    // and actually translated — an English line wearing a flag is a missing line
    {
      const bad = [];
      const en = STORY_ORDER_TEXT.en;
      for (const l of LANGS_) for (const k in en) {
        const v = (STORY_ORDER_TEXT[l] || {})[k];
        if (v == null) { bad.push(l + ':' + k + ' missing'); continue; }
        if (Array.isArray(en[k]) !== Array.isArray(v) || (Array.isArray(v) && v.length !== en[k].length)) bad.push(l + ':' + k + ' shape');
        if (l !== 'en' && JSON.stringify(v) === JSON.stringify(en[k])) bad.push(l + ':' + k + ' untranslated');
      }
      check('every ordered-story line exists, in the same shape, in all ' + LANGS_.length + ' languages', !bad.length, bad.slice(0, 6).join(' | ') || Object.keys(en).length + ' keys');
    }

    // ---- 2. THE ROOM GRAPH ----------------------------------------------
    fresh();
    const rubble = {};
    for (const id in GATE_ROOM) for (const d of gateDoorsAll(id)) if (d.rubble) rubble[d.rubble] = 1;   // a pile is physics, not story
    const crossings = (id) => {
      const def = ROOMS[id], out = [];
      G.roomId = id; G.roomDef = def; G.grid = buildRoom(id); G.boss = null; G.trans = null;
      G.statics = []; G.rubbles = []; G.gateWalk = null; G.tut = null; G.toasts = [];
      // THE SHAFT IS ONE PLACE now (js/game.js VERTICAL LINKS): an open up/down
      // pair is crossed by a silent handover, not a G.trans cut, and the way up
      // needs a ledge in the room above. Mirror what loadRoom sets (the links),
      // record a handover as the crossing it is instead of performing it, and
      // cut the hatches over each way up — like rubble, a hatch is physics the
      // player clears with a strike, not story. Production's gate decision
      // (exitOpen inside checkTransitions / vlinkSeamless) is untouched.
      G.vlink = vlinkFor(id);
      const realHand = window.vlinkHandover;
      window.vlinkHandover = (sd, dest) => { G.trans = { to: dest, side: sd, seam: true }; };
      const brokeKeep = Object.assign({}, G.save.broken);
      for (const sd of ['T', 'B']) {
        let up = (def.exits || {})[sd]; if (up && typeof up === 'object') up = up.to;
        if (!up || !ROOMS[up]) continue;
        const U = buildRoom(up), rows = sd === 'T' ? [U.length - 3, U.length - 2, U.length - 1] : [0, 1, 2];
        for (const ty of rows) for (let tx = 0; tx < U[0].length; tx++)
          if (U[ty] && (U[ty][tx] === 'B' || U[ty][tx] === 'v')) G.save.broken[up + ':' + tx + ',' + ty] = 1;
      }
      const W = def.w * TILE, H = def.h * TILE;
      for (const side of Object.keys(def.exits || {})) {
        G.trans = null; player.vx = 0; player.vy = 0; player.lastSafe = { x: 40, y: 40 };
        if (side === 'L') { player.x = -player.w - 4; player.y = (def.h - 4) * TILE; }
        else if (side === 'R') { player.x = W + 4; player.y = (def.h - 4) * TILE; }
        else if (side === 'T') {
          // under the OPENING, the only place a body can rise through: the way
          // up now ends on a ledge or not at all (checkTransitions/topLedge),
          // so a probe at mid-room in a roofed room is a probe inside rock
          let gap = G.grid.tGap;
          if (!gap) {
            const row = G.grid[0]; let a = -1, b2 = -1;
            for (let x = 0; x < row.length; x++) if (row[x] === '.') { if (a < 0) a = x; b2 = x; } else if (a >= 0) break;
            if (a >= 0) gap = [a, b2];
          }
          player.x = gap ? ((gap[0] + gap[1] + 1) / 2) * TILE - player.w / 2 : W / 2;
          player.y = -player.h - 4;
        } else { player.x = W / 2; player.y = H + 50; }
        checkTransitions();
        if (G.trans) out.push(G.trans.to);
      }
      window.vlinkHandover = realHand;
      G.save.broken = brokeKeep;
      G.trans = null;
      for (const d of gateDoorsAll(id)) {
        G.gateWalk = null;
        player.x = gateWorldX(d) - player.w / 2; player.y = (def.h - 3) * TILE; player.vx = 0;
        if (gateEnter() && G.gateWalk && G.gateWalk.to === d.to) out.push(d.to);
        G.gateWalk = null;
      }
      return out;
    };
    const bossFlag = (k) => (k === 'alpha' ? 'alpha' : 'boss' + k.charAt(0).toUpperCase() + k.slice(1));
    const reach = (F) => {
      G.save.flags = Object.assign({}, F); G.save.visited = {};      // no gate is open because it was once walked
      const seen = new Set(['W1']), q = ['W1'];
      while (q.length) {
        const id = q.shift();
        // AN ARENA HOLDS HER until its guardian is resolved
        const be = (ROOMS[id].ents || []).find(e => e[0] === 'boss');
        if (be && !F[bossFlag(be[3])]) continue;
        for (const to of crossings(id)) if (ROOMS[to] && !seen.has(to)) { seen.add(to); q.push(to); }
      }
      return seen;
    };
    const riddleRooms = Object.keys(ROOMS).filter(id => (ROOMS[id].ents || []).some(e => e[0] === 'riddle'));
    const ratchetAt = (room, F) => {
      G.save.flags = Object.assign({}, F);
      const s = { type: 'npc', room, extra: 'ratchet' };
      return npcPlaced(room, 'ratchet') && npcLive(s);
    };
    const when = (w, room, F, R, b) => {
      G.save.flags = Object.assign({}, F); G.roomId = room; G.roomDef = ROOMS[room];
      G.save.relics = (F.__relics || []).slice();
      if (w === 'ratchetAwake') return ratchetAt(room, F);
      // a standing line is said when he is there AND his own selector picks it
      if (w === 'ratchetSays') return ratchetAt(room, F) && ratchetStandingKey(F, 'tier') === b.key;
      if (w === 'spareCell') return !!F.ratchetSpareGiven;
      if (w === 'burst') return burstUnlocked();
      if (w === 'forgeReady') {
        G.save.bag = F.pl_cshard ? { cshard: 1 } : {};
        G.save.quests = { ratchet_forge: 'active' };
        const ok = qDone(questById('ratchet_forge')) && ratchetAt('A0B', F);
        G.save.bag = {}; G.save.quests = {};
        return ok;
      }
      if (w === 'breakWindow') return breakWindow() && (!BREAK_SPOTS[room].meet || !!F.nfMeet);
      if (w === 'vault') return ['sigil1', 'sigil2', 'sigil3'].every(id => relicHas(id));
      if (w === 'allNodeRooms') return riddleRooms.every(id => R.has(id));
      throw new Error('unknown predicate ' + w);
    };
    const ENT = Object.entries(SHEET.entities).map(([n, e]) => ({ n, re: new RegExp(e.re), known: e.known }));
    const resolve = (k, F) => {
      G.save.flags = Object.assign({}, F);
      if (k === '@sageReveal') return sageRevealLines(F);
      if (k === '@ratchetStanding') return say(ratchetStandingKey(F, 'sl_ratchet_' + standingTier()));
      return say(k);
    };
    const simulate = (hold) => {
      const F = Object.assign({ __relics: [] }, rubble), fired = {}, order = [], bad = [], named = [];
      for (let round = 0; round < 80; round++) {
        const R = reach(F);
        let changed = false;
        for (const b of beats) {
          if (fired[b.id]) continue;
          const room = [b.room].concat(b.alt ? [b.alt] : []).find(x => R.has(x));
          if (!room) continue;
          if (hold[b.id] && !F[hold[b.id]]) continue;
          if (b.when && !when(b.when, room, F, R, b)) continue;
          const missing = b.requires.filter(f => !F[f]);
          if (missing.length) bad.push(b.id + ' possible in ' + room + ' before ' + missing.join('+'));
          // what is SAID here, at this moment, may only name what she has met
          LANG = 'en';
          for (const k of b.lines || []) for (const line of resolve(k, F)) {
            const text = ctlFill(line);
            for (const e of ENT) {
              if (!e.re.test(text)) continue;
              const met = !e.known.length || e.known.some(f => F[f]);
              if (!met && !(b.introduces || []).includes(e.n)) named.push(b.id + ' names ' + e.n + ' before it is met: "' + text.slice(0, 70) + '"');
            }
          }
          fired[b.id] = room; order.push(b.id); changed = true;
          for (const f of b.sets) F[f] = 1;
          for (const rl of b.relics || []) F.__relics.push(rl);
        }
        if (!changed) break;
      }
      const unfired = beats.filter(b => !fired[b.id] && !b.optional).map(b => b.id);
      return { order, bad, named, unfired, fired };
    };
    const greedy = simulate({});
    // the route the Meadow Sage gives: from the sage to the climb in the hub
    // (where he comes out), and only then up to the bell
    const route = simulate({ chime: 'nfBreak' });
    for (const [label, s] of [['greedy', greedy], ['sage route', route]]) {
      check(label + ': no beat is possible before its required flags', !s.bad.length, s.bad.slice(0, 4).join(' | ') || s.order.length + ' beats in order');
      check(label + ': every beat on the sheet can be reached', !s.unfired.length, s.unfired.join(',') || 'all');
      check(label + ': no line names something she has not met', !s.named.length, s.named.slice(0, 3).join(' | ') || 'clean');
    }
    check('the sage route passes the break where the sage sends her (the hub, under the climb)',
      route.fired.break === 'A2', 'break fired in ' + route.fired.break);
    check('...and in canon order: forge < sage < bell < NULLFANG < Conduits',
      ['forge', 'first_sage', 'chime', 'nullfang', 'conduits'].map(id => route.order.indexOf(id)).every((v, i, a) => v >= 0 && (!i || v > a[i - 1])),
      route.order.join(' > '));

    // ---- 4. THE LOOPHOLES, ONE BY ONE ------------------------------------
    // 4.1 SAVE MIGRATION: an old save is brought onto the current story on load
    {
      const key = saveKeyFor('robo');
      const old = newSave(1); delete old.storyVersion;
      Object.assign(old, { items: { batt: 1 }, quests: {}, theme: 'robo' });
      Object.assign(old.flags, { tut: 1, woke: 1, 'on_A3|ratchet': 1, crystal: 1, nfMeet: 1, sageTame_GA1D: 1, bossGlitch: 1 });
      localStorage.setItem(key, JSON.stringify(old));
      const m = loadStored('robo');
      check('migration: an old save becomes the current story version', m.storyVersion === STORY_VERSION, m.storyVersion);
      check('migration: the camp waking is Ratchet\'s one waking (one flag, no second revival)',
        m.flags['on_A0B|ratchet'] && m.flags.ratchetRepaired && m.flags.ratchetCamp, JSON.stringify(m.flags));
      check('migration: nothing earned is stripped (blade, sage, lion, cell kept)',
        m.flags.crystal && m.flags.sageTame_GA1D && m.flags.bossGlitch && m.items.batt === 1);
      check('migration: nothing is paid twice (no Draft 2 spare, forge errand closed, pack kept)',
        m.flags.ratchetSpareGiven && m.quests.ratchet_forge === 'done' && m.flags.heal);
      check('migration: beats the old route passed are not replayed', m.flags.chimeRevealed && m.flags.nfBreak);
      localStorage.setItem(key, JSON.stringify(m));
      const again = loadStored('robo');
      check('migration runs once (a migrated save is left as it is)', JSON.stringify(again) === JSON.stringify(m));
      // a legacy save that has not woken him, whose drawer cell is gone
      const o2 = newSave(1); delete o2.storyVersion; o2.items = { batt: 1 }; o2.flags.ch_A0B_1 = 1; o2.flags.tut = 1;
      localStorage.setItem(key, JSON.stringify(o2));
      const m2 = loadStored('robo');
      // two cells existed in the old economy (her start cell and the drawer's);
      // one is spent, the one she holds becomes his, and the spare is the spent one
      check('migration: the drawer cell she already took is his cell again (no locked workshop)',
        m2.items.ratchetCell === 1 && !m2.items.batt && m2.flags.ratchetSpareGiven === 1, JSON.stringify(m2.items));
      const o3 = newSave(1); delete o3.storyVersion; o3.items = {}; o3.flags.ch_A0B_1 = 1;
      localStorage.setItem(key, JSON.stringify(o3));
      const m3 = loadStored('robo');
      check('migration: ...or, every cell spent, the drawer holds it again', !m3.flags.ch_A0B_1 && !m3.items.ratchetCell);
      const h = newSave(1); delete h.storyVersion; h.theme = 'hero';
      localStorage.setItem(saveKeyFor('hero'), JSON.stringify(h));
      check('migration leaves NOSTOS saves alone', loadStored('hero').storyVersion === undefined);
      localStorage.removeItem(key); localStorage.removeItem(saveKeyFor('hero'));
    }

    // 4.2 THE CONDUITS GATE, through the real crossing
    {
      const up = (flags) => {
        fresh(flags); loadRoom('A3'); G.dialog = null; G.state = 'PLAY'; G.toasts = []; G.gateWhyAt = 0;
        const gap = G.grid.tGap;
        player.x = ((gap[0] + gap[1] + 1) / 2) * TILE - player.w / 2; player.y = -player.h - 6; player.vy = -300;
        G.trans = null; checkTransitions();
        // the first refusal is a CARD she acknowledges (js/overlay.js storyNote,
        // owner 2026-10-09: important instructions stay until acknowledged);
        // later bumps are toasts — either one says why
        const said = (G.toasts || []).map(x => x.text)
          .concat(G.dialog && G.dialog.note ? G.dialog.lines : []).join(' | ');
        // an open shaft is crossed by the silent handover (VERTICAL LINKS): the
        // room really changes, with no G.trans cut — count either as crossing
        return { to: (G.trans && G.trans.to) || (G.roomId !== 'A3' ? G.roomId : null), said };
      };
      const a = up({ crystal: 1, sageTame_GA1D: 1, bossChime: 1 });
      check('the climb to the Conduits refuses before NULLFANG is free', !a.to, a.to);
      check('...and says why, in the player\'s language', a.said.indexOf(t('gate_conduits').slice(0, 20)) >= 0, a.said.slice(0, 120));
      const b = up({ bossGlitch: 1 });
      check('...and still refuses a save that never forged the blade', !b.to, b.to);
      const c = up({ bossGlitch: 1, crystal: 1 });
      check('...and opens once the lion is free and the blade forged', c.to === 'B1', c.to);
    }

    // 4.3 THE BLADE FOR TAMING, and the ledger stays exact
    {
      fresh({}); loadRoom('A4'); G.state = 'PLAY';
      const b = G.boss;
      const before = JSON.stringify(braid());
      b.hp = 0; b.die();
      const held = !b.dead && b.hp >= 1 && !b.tamed && !b.forkAsked && G.forkBoss !== b;
      check('without the forged blade a guardian cannot be freed (the song holds it)', held, 'hp ' + b.hp + ' dead ' + b.dead + ' tamed ' + !!b.tamed);
      check('...and nothing is written to the braid for a fork never reached', JSON.stringify(braid()) === before);
      G.save.flags.crystal = 1;
      b.hp = 0; b.die();
      check('with the blade the same blow frees it, and the braid records the fork',
        b.tamed && braid().forks === 1, 'tamed ' + !!b.tamed + ' forks ' + braid().forks);
    }

    // 4.4 ONE RATCHET
    {
      const where = (flags) => {
        fresh(flags);
        loadRoom('A0B'); const den = G.statics.filter(s => s.type === 'npc' && s.extra === 'ratchet');
        loadRoom('A3'); const camp = G.statics.filter(s => s.type === 'npc' && s.extra === 'ratchet');
        return { den: den.length, camp: camp.length, campLive: camp[0] ? npcLive(camp[0]) : null, campKey: camp[0] ? npcKey(camp[0]) : null };
      };
      const a = where({});
      check('a new run: Ratchet stands in his workshop, and nowhere else', a.den === 1 && a.camp === 0, JSON.stringify(a));
      const b = where({ 'on_A0B|ratchet': 1, crystal: 1, ratchetCamp: 1 });
      check('after the forge he has moved to the camp — one body, still awake on the one waking',
        b.den === 0 && b.camp === 1 && b.campLive === true && b.campKey === 'A0B|ratchet', JSON.stringify(b));
      // the forge itself moves him, and he says so
      fresh({ 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1 });
      loadRoom('A0B'); G.state = 'PLAY';
      G.save.bag = { cshard: 1 }; G.save.quests.ratchet_forge = 'active';
      doInteract(G.statics.find(s => s.extra === 'ratchet'));
      const lines = (G.dialog && G.dialog.lines) || [];
      check('handing over the marble, he says he is moving to the camp', lines.indexOf(t('sl_ratchet_moving')) >= 0, lines.length + ' lines');
      let n = 0; while (G.dialog && n++ < 20) { const cb = G.dialog.onEnd; G.dialog = null; G.state = 'PLAY'; if (cb) cb(); }
      if (G.cut) { try { G.cut.v.pause(); } catch (e) {} G.cut = null; }
      check('...and the forge moves him', G.save.flags.crystal && G.save.flags.ratchetCamp);
    }

    // 4.5 WRONG-ORDER LINES, through the production selectors
    {
      const K = (f) => ratchetStandingKey(f, 'tier');
      check('Ratchet does not send claws at NULLFANG before the forge',
        K({ nfMeet: 1 }) !== 'sl_ratchet_rematch' && K({ nfMeet: 1, crystal: 1 }) !== 'sl_ratchet_rematch'
        && K({ nfMeet: 1, crystal: 1, sageTame_GA1D: 1 }) !== 'sl_ratchet_rematch',
        [K({ nfMeet: 1 }), K({ nfMeet: 1, crystal: 1 })].join(','));
      check('...he does once the sage is free and the bell silent',
        K({ nfMeet: 1, crystal: 1, sageTame_GA1D: 1, bossChime: 1 }) === 'sl_ratchet_rematch');
      check('...and after the lion, he points up to the Conduits', K({ bossGlitch: 1, crystal: 1 }) === 'sl_ratchet_conduits');
      const bell = t('sg_rev4');
      check('the first sage says "silence that bell" only while the bell still rings',
        sageRevealLines({}).indexOf(bell) >= 0 && sageRevealLines({ bossChime: 1 }).indexOf(bell) < 0
        && sageRevealLines({ bossChime: 1, bossGlitch: 1 }).indexOf(bell) < 0);
      // the break, live, where the sage sends her
      const brk = (flags) => {
        fresh(flags); loadRoom('A2'); G.state = 'PLAY'; G.enemies = []; G.projs = []; G.boss = null; G.break = null;
        player.x = 13 * TILE - player.w / 2;
        const col = groundColumnAt(player.x + player.w / 2); player.y = Math.min.apply(null, col) - player.h;
        player.vx = player.vy = 0; player.on = true;
        for (let i = 0; i < 240 && !G.break; i++) update(1 / 60);
        const on = !!G.break; G.break = null; G.boss = null;
        return on;
      };
      check('NULLFANG\'s break happens on the sage\'s route, under the climb in the hub',
        brk({ crystal: 1, sageTame_GA1D: 1, nfMeet: 1 }));
      check('...never before he has been met, and never after the bell',
        !brk({ crystal: 1, sageTame_GA1D: 1 }) && !brk({ crystal: 1, sageTame_GA1D: 1, nfMeet: 1, bossChime: 1 }));
    }

    // 4.6 THE VAULT'S SIDE DOOR
    {
      const side = (flags) => {
        fresh(flags); loadRoom('B5'); G.state = 'PLAY'; G.trans = null;
        player.x = G.roomDef.w * TILE + 4; player.y = 13 * TILE; checkTransitions();
        const inside = player.x <= G.roomDef.w * TILE - player.w;
        return { to: G.trans && G.trans.to, inside };
      };
      const a = side({ bossGlitch: 1 }), b = side({ bossGlitch: 1, vaultOpen: 1 });
      check('B5\'s east side does not walk around the three-sigil vault', !a.to && a.inside, JSON.stringify(a));
      check('...and opens with the vault', b.to === 'V1', b.to);
      // VAULT SIGIL III lives in ONE place, the Foundry tower (owner, 2026-10-08)
      const at3 = [];
      for (const [id, def] of Object.entries(ROOMS))
        for (const e of def.ents || []) if (e[0] === 'secret' && e[3] === 'sigil3') at3.push(id);
      check('Vault Sigil III is placed once, in the Foundry tower (C1)', at3.length === 1 && at3[0] === 'C1', at3.join(','));
      // ...and the door says where it lies to a player who walked past it
      const knock = (relics) => {
        fresh({ bossGlitch: 1, bossPrism: 1 }); G.save.relics = relics.slice();
        loadRoom('B5'); G.state = 'PLAY'; G.toasts = []; G.trans = null;
        const v = (G.statics || []).find(s => s.type === 'vault');
        if (!v) return null;
        doInteract(v);
        return (G.toasts || []).map(x => x.text).join(' | ');
      };
      const where = t('vault_where3');
      const miss = knock(['sigil1', 'sigil2']), held = knock(['sigil1', 'sigil3']);
      check('the locked vault points a player missing Sigil III to the Foundry tower',
        miss != null && miss.indexOf(where) >= 0 && held != null && held.indexOf(where) < 0,
        'without: ' + miss + ' / with: ' + held);
    }

    // 4.7 ERRANDS START WHEN THEY ARE GIVEN
    {
      fresh({});
      G.save.culls = { crawler: 9 };
      qSet('servo_swarm', 'active');
      const q = questById('servo_swarm');
      const p0 = qProgress(q);
      for (let i = 0; i < 6; i++) questKill('crawler');
      check('a cull counts from the moment it was accepted, not from the start of the run', p0 === 0 && qDone(q), p0 + ' then ' + qProgress(q));
      // SUPERSEDED RULE (MIS-01): ratchet_deep was a REACH, finished by
      // standing in A7 after the ask. It is a READ now — the survey in A7
      // (terminal 20) is the evidence; the room is only where it lies.
      G.save.visited.A7 = 1;
      qSet('ratchet_deep', 'active');
      const d = questById('ratchet_deep'), r0 = qDone(d);
      loadRoom('A7'); G.state = 'PLAY';
      const r1 = qDone(d);
      doInteract(G.statics.find(s => s.type === 'term' && s.extra === 20));
      { let n = 0; while (G.dialog && n++ < 20) { const cb = G.dialog.onEnd; G.dialog = null; G.state = 'PLAY'; if (cb) cb(); } }
      check('the survey errand counts once she READS the survey after being asked — standing in the shaft is not enough',
        !r0 && !r1 && qDone(d), 'before ' + r0 + ' standing ' + r1 + ' read ' + qDone(d));
      // THE OWNER'S RULE CHANGED (2026-10-09): "reward early exploration —
      // remember discoveries and adapt later quest dialogue rather than making
      // players revisit an empty room". The object used to appear only once it
      // was asked for; it now lies in the world from the start until it is
      // handed in, and a find made before the ask is remembered by the asker.
      loadRoom('A6');
      const before = G.statics.some(s => s.type === 'item' && s.extra === 'coil');
      qSet('servo_coil', 'active'); loadRoom('A6');
      const during = G.statics.some(s => s.type === 'item' && s.extra === 'coil');
      qSet('servo_coil', 'done'); loadRoom('A6');
      const after = G.statics.some(s => s.type === 'item' && s.extra === 'coil');
      check('an errand\'s object lies in the world from the start until it is handed in', before && during && !after,
        'before ' + before + ' during ' + during + ' after ' + after);
      // ...and found before the ask, the asker says so and pays at once
      delete G.save.quests.servo_coil; G.save.bag = { coil: 1 };
      fresh({ 'on_A1|servo': 1 }); G.save.bag = { coil: 1 }; loadRoom('A1'); G.state = 'PLAY';
      const sv2 = G.statics.find(s => s.extra === 'servo');
      doInteract(sv2);
      const early = ((G.dialog && G.dialog.lines) || []).join(' ');
      let n2 = 0; while (G.dialog && n2++ < 20) { const cb = G.dialog.onEnd; G.dialog = null; G.state = 'PLAY'; if (cb) cb(); }
      check('...a coil found before Servo asks is handed over on the ask, in his own words',
        early.indexOf(t('q_early_servo_coil')) >= 0 && G.save.quests.servo_coil === 'done' && !(G.save.bag || {}).coil, early.slice(0, 90));
      // an errand accepted before snapshots existed keeps counting as it did
      G.save.quests.servo_swarm = 'active'; delete G.save.qbase.servo_swarm; G.save.culls.crawler = 6;
      check('...and an errand accepted on an older save keeps its progress', qDone(q));
    }

    // 4.8 HER OWN CONTROLS IN SPEECH. A line that names a control names the
    // one she has: the keyboard key she bound, the pad button she bound. Old
    // Servo used to carry this ("leap with Z") in a second controls speech
    // straight after Ratchet's; the rebuilt opening (owner, 2026-10-09: "do
    // not force a second long tutorial speech") moved the controls to where
    // they are first USED — Ratchet's Volt Pack pitch, {HEAL} and {ATK}.
    {
      fresh({ 'on_A0B|ratchet': 1, ratchetRepaired: 1, opTold: 1, opPod: 1 }); loadRoom('A0B'); G.state = 'PLAY';
      const r = G.statics.find(s => s.extra === 'ratchet');
      doInteract(r);
      const kb = ((G.dialog && G.dialog.lines) || []).join(' ');
      G.dialog = null; G.state = 'PLAY';
      const keyH = KEYB.HEAL.find(c => /^Key/.test(c)).replace('Key', '');
      const keyA = KEYB.ATK.find(c => /^Key/.test(c)).replace('Key', '');
      check('Ratchet names the keyboard\'s own heal and attack keys and no placeholder survives',
        kb.indexOf('{') < 0 && kb.indexOf('hold ' + keyH + ' ') >= 0 && kb.indexOf('hold ' + keyA + ' ') >= 0, kb.slice(0, 200));
      const wasOn = PAD.on, wasH = PAD.map.HEAL;
      PAD.on = true; PAD.map.HEAL = 3;
      doInteract(r);
      const pad = ((G.dialog && G.dialog.lines) || []).join(' ');
      G.dialog = null; G.state = 'PLAY';
      PAD.on = wasOn; PAD.map.HEAL = wasH;
      check('...and, on a remapped controller, the button she bound', pad.indexOf(padLabel(3)) >= 0, pad.slice(0, 200));
    }

    // 4.9 CONTRADICTIONS AND THE FINALE (English is the source; the other
    // languages are checked complete above)
    {
      LANG = 'en';
      check('GLACIERE\'s title is not the sword\'s name', !/purifier/i.test(t('b_zero')), t('b_zero'));
      check('the Archives sage names GLACIERE, not a different "Archivist"', /GLACIERE/.test(t('d_sage').join(' ')) && !/Archivist/.test(t('d_sage').join(' ')));
      const guardians = Object.keys(BSTAT).filter(k => !MINIS[k] && BSTAT[k].zone !== 'A' && k !== 'mother').length;
      const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
      check('the free chapter counts the guardians that are actually left', new RegExp('\\b' + words[guardians] + ' more guardians', 'i').test(t('demo_end3')), guardians + ': ' + t('demo_end3'));
      check('Mono does not blame MOTHER for the order', !/voice called MOTHER/.test(t('d_mono').join(' ')));
      check('the Prowler was never infected, and nothing says it was', !/virus is destroyed/i.test(t('pure_prism')));
      check('Kerf never split a purifier in two', !/split|half of the|buried half/i.test(t('d_kerf').join(' ').replace('never half of anything', '')));
      const fin = [t('b_mother'), t('win2'), t('win2b'), t('pure_mother')].join(' ');
      check('the finale cleanses and frees MOTHER — no "Null Core" is killed', !/Null Core/i.test(fin) && /free/i.test(t('win2')), fin.slice(0, 120));
      check('...and is truthful about the Eye: exposed, not defeated', /Eye/.test(t('win2b')) && !/defeat|destroy/i.test(t('win2b')));
      check('marble, not crystal, in the quarry\'s own words', /marble/i.test(t('pl_hint')) && !/crystal/i.test(t('pl_hint')));
    }
    return { checks };
  }, SHEET);

  let fails = 0;
  console.log('── story-order — the story sheet, walked through the real build');
  for (const c of r.checks) {
    console.log('  ' + (c.ok ? 'ok   ' : 'FAIL ') + c.name + (c.detail ? '  ' + c.detail : ''));
    if (!c.ok) fails++;
  }
  if (errs.length) { console.log('  FAIL page errors: ' + errs.slice(0, 3).join(' | ')); fails++; }
  await browser.close();
  if (fails) { console.log('\nFAILED: ' + fails + ' check(s)'); process.exit(1); }
  console.log('\nOK — every beat in its order, every gate says why, every line names only what she has met');
})().catch(e => { console.error(e); process.exit(1); });
