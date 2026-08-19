// THE MEMORY GAME MUST BE HEARABLE — the owner played it and heard nothing.
//
// Two separate faults added up to silence, and both are contracts this
// harness now holds: the notes sat at A3-A4 (220-440 Hz), a register a phone
// speaker physically cannot speak, and the music stream kept playing over
// them at full volume. So: every note the trial plays must sit at or above
// A4 (midi 69), and MUS_DUCK must step the stream back while a trial is open
// and give it back the moment the trial closes. The register is asserted on
// the actual blip() calls the show phase makes, not on the table — a future
// edit that routes the notes elsewhere fails here, not on a phone.
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── memnote — the memory game is audible: register, reply, and the duck');
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A0');
    await new Promise(r => setTimeout(r, 800));
    G.wake = null; G.state = 'PLAY';
    audioOn();                                    // what the first gesture does
    window._notes = [];
    const ob = blip;
    blip = function (m, d, v, del, k) { window._notes.push({ m, v }); return ob(m, d, v, del, k); };
    triStartNode(0, 'mem');
  });

  // WAIT FOR THE SHOW PHASE, DO NOT GUESS HOW LONG IT TAKES. This was a flat
  // 2600 ms, and the check it feeds is named "the show phase actually reaches
  // the synth" -- which is a question about whether the notes arrive at all,
  // not about whether they arrive inside a number somebody typed once.
  //
  // Measured on this build, the three notes land at 1477 / 1867 / 2302 ms, so
  // the margin was 300 ms; a branch that adds startup art pushed them to
  // 2255 / 2660 / 3083 and the harness reported "1 note for a sequence of 3" --
  // a red that says the audio is broken when the audio is fine.
  //
  // Waiting on the note count keeps every assertion below exactly as strict:
  // if the notes never come, this still times out and the same check still
  // fails, with the same message. It only stops the clock being the subject.
  await page.waitForFunction(
    () => window._notes && TRI.memSeq && window._notes.length >= TRI.memSeq.length,
    { timeout: 15000 }).catch(() => {});
  const mid = await page.evaluate(() => ({
    notes: window._notes, duck: MUS_DUCK, st: G.state,
    seqLen: TRI.memSeq.length, ac: AC ? AC.state : 'NO-AC',
  }));

  check('the audio context is live in the harness', mid.ac === 'running', mid.ac);
  check('the show phase actually reaches the synth', mid.notes.length >= mid.seqLen,
    mid.notes.length + ' notes for a sequence of ' + mid.seqLen);
  const low = mid.notes.filter(n => n.m < 69);
  check('every note sits where a phone speaker speaks (midi >= 69 / A4 440Hz)',
    mid.notes.length > 0 && low.length === 0,
    low.length ? 'low notes: ' + JSON.stringify(low) : 'lowest ' + Math.min(...mid.notes.map(n => n.m)));
  check('the notes are not whispered under the mix (gain >= 0.1)',
    mid.notes.every(n => n.v >= 0.1), JSON.stringify(mid.notes.map(n => n.v)));
  check('the music ducks while the trial is open', mid.duck === 0.3, 'MUS_DUCK ' + mid.duck);

  // the player's reply is a fifth up and still in register
  const reply = await page.evaluate(() => {
    window._notes.length = 0;
    TRI.memPhase = 'input'; TRI.memIn = 0;
    sfxMemNote(TRI.memSeq[0], true);
    return window._notes[0];
  });
  check('the reply voice answers a fifth up, still in register',
    reply && reply.m >= 76, JSON.stringify(reply));

  // closing the trial gives the music back
  await page.evaluate(() => { TRI.node = null; TRI.mode = 'full'; G.state = 'PLAY'; });
  await page.waitForTimeout(250);
  const duckAfter = await page.evaluate(() => MUS_DUCK);
  check('...and the duck lifts the moment the trial closes', duckAfter === 1, 'MUS_DUCK ' + duckAfter);

  await browser.close();
  if (fails.length) {
    console.log('\nFAILED:\n' + fails.map(f => '  ' + f).join('\n'));
    process.exit(1);
  }
  console.log('\nOK — four bells a phone can speak, and a stream that steps aside for them');
})().catch(e => { console.error(e); process.exit(1); });
