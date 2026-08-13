// Do the machines actually get smarter AND stronger as the run advances — and
// does the warning stay exactly as long at every level of both?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); loadRoom('C2'); });
  await p.waitForTimeout(500);
  const rows = await p.evaluate(() => {
    const stages = [
      ['fresh out of the film', {}, []],
      ['two powers', { dash: 1, djump: 1 }, []],
      ['two powers, two guardians', { dash: 1, djump: 1 }, ['bossGlitch', 'bossBrood']],
      ['everything but the last', { dash: 1, djump: 1, wall: 1, emp: 1 }, ['bossGlitch', 'bossBrood', 'bossAtlas', 'bossZero', 'bossPrism']],
    ];
    const out = [];
    for (const [label, abil, flags] of stages) {
      G.save.abil = Object.assign({}, abil);
      G.save.flags = {}; for (const f of flags) G.save.flags[f] = 1;
      G.save.skills = flags.length >= 4 ? ['mind', 'calc', 'reflex'] : [];
      // a hundred crawlers, to see the spread the player would actually meet
      let hp = 0, spd = 0, withTrait = 0, two = 0;
      const seen = {};
      for (let i = 0; i < 100; i++) {
        const e = new Enemy('crawler', 100, 100);
        hp += e.hp; spd += e.spd;
        if (e.traits.length) withTrait++;
        if (e.traits.length > 1) two++;
        for (const t of e.traits) seen[t] = (seen[t] | 0) + 1;
      }
      const e0 = new Enemy('crawler', 100, 100);
      out.push({
        stage: label, iq: +foeIQ().toFixed(2), power: +foePow().toFixed(2),
        avgHP: Math.round(hp / 100), avgSpeed: Math.round(spd / 100),
        withATrait: withTrait + '%', withTwo: two + '%',
        tellStaysAt: TELL_FAST,
      });
    }
    return out;
  });
  console.log('stage                          IQ   power   HP  speed  trait  two   tell');
  for (const r of rows)
    console.log(r.stage.padEnd(28), String(r.iq).padStart(4), String(r.power).padStart(6),
      String(r.avgHP).padStart(5), String(r.avgSpeed).padStart(5),
      String(r.withATrait).padStart(6), String(r.withTwo).padStart(5), String(r.tellStaysAt).padStart(6));
  console.log('\npageerrors:', errs.length ? errs.slice(0, 3) : 'none');
  await b.close();
})();
