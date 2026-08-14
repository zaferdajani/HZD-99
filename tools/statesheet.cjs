const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  p.on('pageerror', e => console.log('ERR', String(e).slice(0, 200)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const url = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    sv.arms = ['shard','jet','slag','frost','arc']; sv.armIdx = 1;
    startGame(sv); loadRoom('A0');
    await new Promise(r => setTimeout(r, 1200));
    G.wake = null;
    const P = [
      ['idle',        p2 => { p2.vx = 0; }],
      ['walk',        p2 => { p2.vx = 150; }],
      ['run',         p2 => { p2.vx = 330; }],
      ['skid',        p2 => { p2.vx = 300; p2.skidT = 0.2; }],
      ['rise',        p2 => { p2.vy = -420; p2.on = false; p2.takeoffT = 0.1; }],
      ['apex',        p2 => { p2.vy = -20;  p2.on = false; }],
      ['fall',        p2 => { p2.vy = 430;  p2.on = false; }],
      ['double jump', p2 => { p2.vy = -300; p2.on = false; p2.flipT = 0.22; p2.jetT = 0.3; }],
      ['land',        p2 => { p2.landT = 0.10; p2.land0 = 0.12; }],
      ['dash',        p2 => { p2.dashT = 0.12; p2.vx = 640; p2.jetT = 0.2; }],
      ['wall cling',  p2 => { p2.vy = 60; p2.on = false; p2.wallSide = 1; p2.wallT = 0.2; }],
      ['claw 1',      p2 => { p2.swing = { t: 0.10, t0: 0.24, combo: 0, ang: -0.35 }; p2.swingVis = p2.swing; }],
      ['claw 2',      p2 => { p2.swing = { t: 0.10, t0: 0.24, combo: 1, ang: 0.20 }; p2.swingVis = p2.swing; }],
      ['finisher',    p2 => { p2.swing = { t: 0.09, t0: 0.26, combo: 2, ang: 0.45 }; p2.swingVis = p2.swing; }],
      ['charging',    p2 => { p2.chargeT = 0.45; p2.chargeOk = true; p2.volts = 99; }],
      ['burst',       p2 => { p2.chargeT = 0; p2.burstT = 0.2; p2.volts = 40; }],
      ['arm: shard',  p2 => { G.save.armIdx = 1; p2.armCD = 0.2; }],
      ['arm: frost',  p2 => { G.save.armIdx = 4; p2.armCD = 0.2; }],
      ['arm: arc',    p2 => { G.save.armIdx = 5; p2.armCD = 0.2; }],
      ['the Song',    p2 => { p2.songT = 0.5; }],
      ['heal',        p2 => { p2.healT = 0.55; p2.iT = 0.2; }],
      ['hurt',        p2 => { p2.hurtT = 0.28; p2.iT = 0.35; }],
      ['low health',  p2 => { p2.cores = 1; }],
      ['crouch/idle2',p2 => { p2.idleT = 6; p2.lookX = 0.8; }],
    ];
    const CW = 150, CH = 190, COLS = 8;
    const rows = Math.ceil(P.length * 2 / COLS);
    const cv2 = document.createElement('canvas');
    cv2.width = COLS * CW; cv2.height = rows * CH + 40;
    const x = cv2.getContext('2d');
    x.fillStyle = '#0a0e14'; x.fillRect(0, 0, cv2.width, cv2.height);
    x.font = 'bold 15px monospace'; x.fillStyle = '#9fe8ff';
    x.fillText('HZD-99 — every state, both facings, drawn from the live game', 12, 25);
    let i = 0;
    for (const [name, fn] of P) for (const face of [1, -1]) {
      const cx2 = (i % COLS) * CW, cy2 = 40 + Math.floor(i / COLS) * CH;
      i++;
      player.vx = 0; player.vy = 0; player.on = true; player.dashT = 0; player.swing = null;
      player.swingVis = null; player.hurtT = 0; player.healT = 0; player.songT = 0;
      player.flipT = 0; player.landT = 0; player.jetT = 0; player.skidT = 0;
      player.chargeT = 0; player.burstT = 0; player.armCD = 0; player.wallT = 0;
      player.takeoffT = 0; player.idleT = 0; player.cores = player.maxCores();
      player.iT = 0; player.anim = 1.35;
      player.face = face; player.faceVis = face;
      fn(player);
      // a blinking state (hurt, heal) can legitimately be invisible on the
      // frame we sample — step the blink until she is actually on screen, or
      // the sheet shows a hole where a pose is
      for (let ph = 0; ph < 10; ph++) {
        const probe = document.createElement('canvas');
        probe.width = 90; probe.height = 90;
        const q = probe.getContext('2d');
        q.save(); q.translate(45, 74); q.scale(1.4, 1.4);
        q.translate(-(player.x + player.w / 2), -(player.y + player.h));
        player.draw(q); q.restore();
        const dd = q.getImageData(0, 0, 90, 90).data;
        let any = 0;
        for (let k = 3; k < dd.length; k += 4 * 11) if (dd[k] > 40) { any = 1; break; }
        if (any) break;
        player.iT = Math.max(0, (player.iT || 0) - 0.07);
        player.anim += 0.05;
      }
      x.save();
      x.beginPath(); x.rect(cx2 + 2, cy2 + 2, CW - 4, CH - 22); x.clip();
      x.fillStyle = '#101722'; x.fillRect(cx2 + 2, cy2 + 2, CW - 4, CH - 22);
      x.translate(cx2 + CW / 2, cy2 + CH - 34);
      x.scale(2.5, 2.5);
      x.translate(-(player.x + player.w / 2), -(player.y + player.h));
      player.draw(x);
      x.restore();
      x.font = '11px monospace'; x.fillStyle = '#c9d6e6';
      x.fillText(name + (face > 0 ? ' ▶' : ' ◀'), cx2 + 8, cy2 + CH - 8);
    }
    return cv2.toDataURL('image/png');
  });
  require('fs').writeFileSync(process.argv[2], Buffer.from(url.split(',')[1], 'base64'));
  await b.close();
  console.log('sheet written');
})();
