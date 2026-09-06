// WHAT TRACK IS ACTUALLY PLAYING, AND IS IT ONE WE COMMISSIONED?
//
// This file used to only PRINT, which is why it watched the regression it was
// written for go past: a table edit moved `epic_combat` — a CC0 track the whole
// authored score was written to replace — to the front of five of the six
// guardian slots. pickRecorded takes the first candidate that plays, so
// mus_nullfang, mus_talonhost, mus_furnace, mus_glaciere and mus_prism became
// unreachable: five commissioned themes on disk, in the manifest, and never
// heard. The owner found it by ear ("audio and music reverted to old library
// which should have been deleted!") because nothing here could fail.
//
// So it has laws now, and they are about REACHABILITY rather than about what
// is playing this second:
//   - every slot the game can ask for resolves to a track that exists;
//   - every track shipped in assets/music is reachable from some slot — a
//     score nothing can select is the same defect wearing the other face;
//   - and no slot names a track outside the authored set.
//
//   node tests/whatplays.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const chk = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── whatplays — every slot leads with the score we commissioned\n');
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; startGame(sv);
    await new Promise(k => setTimeout(k, 900));
    const files = Object.keys(window.MUS_FILES || {});
    const slots = {}, named = new Set();
    for (const k in RECORDED_TRACKS) {
      slots[k] = RECORDED_TRACKS[k].map(c => c[0]);
      for (const c of RECORDED_TRACKS[k]) named.add(c[0]);
    }
    // what each slot LEADS with, and whether that lead is on disk
    const leads = {};
    for (const k in slots) leads[k] = { lead: slots[k][0], onDisk: files.includes(slots[k][0]) };
    return { files: files.sort(), slots, leads,
      named: [...named].sort(),
      unreachable: files.filter(f => !named.has(f)),
      missing: [...named].filter(n => !files.includes(n)),
      fallSlots: Object.values(typeof MUS_FALL !== 'undefined' ? MUS_FALL : {}),
      slotKeys: Object.keys(slots).sort() };
  });

  console.log('  ' + r.files.length + ' tracks in assets/music, ' + r.slotKeys.length + ' slots\n');
  for (const k of r.slotKeys) console.log('    ' + k.padEnd(13) + r.slots[k].join(' -> '));
  console.log('');

  // 1. every track a slot names is really there
  chk('every track a slot names is on disk', r.missing.length === 0,
    r.missing.join(', ') || r.named.length + ' named, all present');

  // 2. every track shipped is reachable. A score nothing can select is the
  //    same defect as a slot naming a file that is not there — it just costs
  //    disk instead of throwing.
  chk('every track shipped is reachable from some slot', r.unreachable.length === 0,
    r.unreachable.join(', ') || r.files.length + ' shipped, all reachable');

  // 3. and it is OUR score. The authored set is mus_*; anything else in this
  //    table is library music standing in front of something commissioned.
  const foreign = r.named.filter(n => !/^mus_/.test(n));
  chk('no slot reaches for a track outside the authored score',
    foreign.length === 0, foreign.join(', ') || 'every candidate is a mus_ track');

  // 4. each guardian LEADS with its own name theme, not a shared one
  const GUARDIAN = { boss_glitch: 'mus_nullfang', boss_brood: 'mus_talonhost',
                     boss_atlas: 'mus_furnace', boss_zero: 'mus_glaciere',
                     boss_prism: 'mus_prism', boss_mother: 'mus_mother',
                     boss_alpha: 'mus_alpha' };
  const wrongLead = Object.entries(GUARDIAN)
    .filter(([slot, want]) => !r.leads[slot] || r.leads[slot].lead !== want)
    .map(([slot, want]) => slot + ' leads with ' + ((r.leads[slot] || {}).lead || 'nothing') + ', wants ' + want);
  chk('every guardian leads with its own name theme',
    wrongLead.length === 0, wrongLead.join('; ') || Object.keys(GUARDIAN).length + ' fights, each with its own');

  // 5. ...and what is on the stream where the player actually stands
  const heard = [];
  for (const z of ['A', 'B', 'C', 'D', 'E', 'X']) {
    heard.push(await p.evaluate(async (z) => {
      MUS.name = null; if (typeof stopRecorded === 'function') stopRecorded();
      setMusic(z);
      await new Promise(k => setTimeout(k, 350));
      return z + ':' + ((typeof RECNODE !== 'undefined' && RECNODE && RECNODE.key) || '-');
    }, z));
  }
  const silent = heard.filter(h => h.endsWith(':-'));
  chk('every kingdom puts a track on the stream', silent.length === 0,
    heard.join('  '));

  if (errs.length) chk('no page errors', false, errs[0]);
  await b.close();
  if (fails.length) { console.log('\n' + fails.length + ' failure(s)'); process.exit(1); }
  console.log('\nOK — every slot leads with the score we commissioned');
})();
