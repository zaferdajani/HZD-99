// THE SKILLED BOT for GRAVEHORN (CV3). Fair play: every decision about HIM reads ctx.seen (the
// rhino as he was 15 frames = 250 ms ago); her own body (P) and the horns/rocks/shocks in flight
// are read live. One prediction is made the way a human makes it: during the charge she
// extrapolates his seen position by his seen velocity over the 250 ms she is behind.
const bot = function (bo, P, ctx) {
  const s = ctx.seen, F = ctx.frame;
  const LAG = 0.25, WALLX = 1696;
  const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2, feet = P.y + P.h;
  const face = s.face || -1, p2 = (ctx.p2 = ctx.p2 || (s.st === 'rage'));
  const front = (Math.sign(pcx - s.cx) || face) === face;
  const snout = s.cx + face * 150, rump = s.cx - face * 100;
  const dSn = Math.abs(pcx - snout), dR = Math.abs(pcx - rump);
  const dirTo = Math.sign(s.cx - pcx) || 1;                 // which way he is from her
  if (ctx.JT == null) { ctx.JT = 0.24; ctx.JD = 1; ctx.MODE = 'close'; }
  const L = (msg) => { if (typeof __TR !== 'undefined' && __TR.length < 4000) __TR.push(['BOT', F, msg]); };
  // ---- the hands ----
  const hold = (d) => { if (d > 0) keys.ArrowRight = 1; else if (d < 0) keys.ArrowLeft = 1; };
  const goTo = (x, tol) => { x = Math.max(50, Math.min(WALLX - 30, x)); if (Math.abs(x - pcx) > (tol || 10)) { hold(Math.sign(x - pcx)); return false; } return true; };
  const strike = (d, up) => { if (P.dizzyT > 0) return; if (d) hold(d); if (up) keys.ArrowUp = 1; keysP.KeyX = 1; keys.KeyX = 1; ctx.lastSwingF = F; };
  const jump = (n, d) => { if (!P.on) return; keysP.Space = 1; keys.Space = 1; ctx.jumpF = n; ctx.jumpDir = d || 0; };
  // the jump she is in: keep the button held for height, steer as asked
  if (ctx.jumpF > 0) { ctx.jumpF--; keys.Space = 1; hold(ctx.jumpDir); }
  // ---- what he is doing, as she saw it ----
  if (s.st !== ctx.lastSt) { ctx.lastSt = s.st; ctx.stF = F;
    if (s.st === 'hornfire') { ctx.fireF = F - 15; ctx.rdir = null; }
    if (s.st === 'tossprep') ctx.lastMove = 'toss'; else if (s.st === 'hornprep') ctx.lastMove = 'missile'; else if (s.st === 'chargewarn') ctx.lastMove = 'charge'; else if (s.st === 'kickprep') ctx.lastMove = 'kick'; else if (s.st === 'rage' || s.st === 'rest') ctx.lastMove = s.st;
    L(s.st + ' t=' + (+s.t).toFixed(2) + ' dSn=' + Math.round(dSn) + ' front=' + front); }
  const rem = (s.t || 0) - LAG;                              // what is left of his state, now
  if (/^(dorm|ghwake|ghspeak|ghbellow)$/.test(s.st)) { if (s.st === 'dorm') hold(1); return; }
  if (/^(kneel|rage|beaten|ghspeak2|retreat)$/.test(s.st)) { goTo(s.cx + (pcx < s.cx ? -260 : 260), 20); return; }
  if (P.dizzyT > 0) { goTo(pcx - dirTo * 200, 10); return; }  // stars: she can only walk, so away
  // ---- 1. THINGS IN THE AIR (read live; the 'eyes' variant sees them 250 ms late too, moved on by their velocity) ----
  let MS = bo.missiles || [];
  if (ctx.PLAG) {
    const H = ctx.mh || (ctx.mh = []);
    H.push((bo.missiles || []).map(m => ({ which: m.which, ph: m.ph, x: m.x, y: m.y, vx: m.vx, vy: m.vy, locked: m.locked, boomT: m.boomT, swatT: m.swatT })));
    if (H.length > 16) H.shift();
    MS = H[0].map(m => Object.assign({}, m, { x: m.x + (m.ph === 'fly' ? m.vx * LAG : 0), y: m.y + (m.ph === 'fly' ? m.vy * LAG : 0), boomT: m.boomT - LAG, swatT: (m.swatT || 0) - LAG }));
  }
  // the rhythm of the horn, learned: it LOCKS 0.35 s after it leaves and dives; in phase two the
  // small horn leaves 0.45 s after the big one, straight at her. A player who cannot see the lock in
  // time runs on the count instead (the 'eyes' variant)
  if (ctx.PLAG && ctx.fireF != null) {
    const tl = (F - ctx.fireF) / 60;
    if (tl >= 0.30 && tl <= (p2 ? 0.80 : 0.68)) {
      if (ctx.rdir == null) { const a = -dirTo; ctx.rdir = (pcx + a * 140 > WALLX - 30 || pcx + a * 140 < 50) ? -a : a; }
      hold(ctx.rdir);
      if (p2 && tl >= 0.44 && tl <= 0.50) jump(14, ctx.rdir);
      return;
    }
    if (tl > 0.8) ctx.rdir = null;
  }
  for (const m of MS) {
    const dx = m.x - pcx, dy = m.y - pcy, d = Math.hypot(dx, dy);
    if (m.ph === 'fly') {
      const closing = -(dx * m.vx + dy * m.vy) > 0;
      if (m.which === 'small') {
        // the small horn flies straight at her, fast: knock it out of the air
        if (closing && d < 105 && !(P.atkCD > 0)) { strike(Math.sign(dx) || P.face); L('swat small d=' + Math.round(d)); return; }
        if (closing && d < 150 && P.atkCD > 0 && P.on) { jump(14, 0); L('jump small'); return; }
        continue;
      }
      if (m.locked && closing && d < 300) {
        // the big horn has locked and is diving: knock it down if it is overhead, else run out from under it
        // (phase two keeps her blade for the small horn right behind it)
        if (!p2 && d < 92 && Math.abs(dx) < 60 && !(P.atkCD > 0)) { strike(0, true); L('swat big d=' + Math.round(d)); return; }
        if (!ctx.dodge || F - ctx.dodge.f > 40) { const away = Math.abs(m.x - s.cx) < 140 ? -dirTo : (Math.sign(pcx - m.x) || -dirTo); const dd = (pcx + away * 120 > WALLX - 40 || pcx + away * 120 < 50) ? -away : away; ctx.dodge = { f: F, d: dd }; L('dodge big ' + dd); }
        hold(ctx.dodge.d); return;
      }
    } else if ((m.ph === 'ret' && !(m.swatT > 0)) || (m.ph === 'boom' && m.boomT < 0.3)) {
      // a spent horn goes home from where it burst, and it still cuts: bat it aside, or give it room
      if (m.ph === 'ret' && d < 70 && !(P.atkCD > 0)) { strike(Math.sign(dx) || P.face, dy < -30 && Math.abs(dx) < 40); L('swat ret d=' + Math.round(d)); return; }
      if (d < 66) { const aw = Math.sign(pcx - m.x) || -dirTo; hold((pcx + aw * 60 > WALLX - 30 || pcx + aw * 60 < 50) ? -aw : aw); L('clear ' + m.ph + ' d=' + Math.round(d)); return; }
    }
  }
  for (const sh of (bo.shocks || [])) {
    const toward = (pcx - sh.x) * sh.dir > 0, dd = Math.abs(pcx - sh.x);
    if (toward && dd < 110 && P.on) { jump(8, 0); L('hop shock'); return; }
  }
  for (const r of (bo.rocks || [])) {
    if (Math.abs(r.x - pcx) < r.r + 22) { hold(Math.sign(pcx - r.x) || -dirTo); return; }
  }
  // ---- 2. HIS MOVES ----
  const st = s.st;
  // THE CHARGE, timed the way a player times it: she knows how long the scrape lasts and how a
  // rhino gathers speed, so from what she saw she runs the charge forward in her head and jumps
  // when the nose is JT seconds from her
  if (st === 'chargewarn' || st === 'rush') {
    const top = p2 ? 830 : 640, acc = 2600 / 60;
    let x = s.cx, v = st === 'rush' ? (s.vx || face * 120) : 0, wait = st === 'chargewarn' ? Math.max(0, s.t) : 0, f = 0, ttc = 99;
    const dir = st === 'rush' ? (Math.sign(v) || face) : face;
    if ((pcx - s.cx) * dir > 0) {
      for (; f < 120; f++) {
        if (wait > 0) { wait -= 1 / 60; if (wait <= 0) v = dir * 120; continue; }
        v += Math.max(-acc, Math.min(acc, dir * top - v)); x += v / 60;
        if (f >= 15 && (pcx - (x + dir * 150)) * dir <= 12) { ttc = (f - 15) / 60; break; }
      }
    }
    if (ttc <= ctx.JT && P.on && !(ctx.jumpF > 0)) { jump(22, ctx.JD ? dirTo : 0); L('jump charge ttc=' + ttc.toFixed(2)); }
    else if (P.face !== dirTo && P.on && st === 'chargewarn') hold(dirTo);
    return;
  }
  if (st === 'tossprep' || st === 'toss') {
    // THE PARRY: one clean strike on the horn as the head comes up
    const inReach = front && dSn < 100;
    if (inReach && !ctx.parried && (P.sinceSwing == null || P.sinceSwing >= 0.52) && ((st === 'tossprep' && rem <= 0.10) || (st === 'toss' && (F - ctx.stF) / 60 + LAG < 0.14))) {
      strike(dirTo); ctx.parried = true; L('parry swing rem=' + rem.toFixed(2) + ' since=' + (+P.sinceSwing).toFixed(2) + ' cd=' + (+P.atkCD).toFixed(2) + ' face=' + P.face + ' sw=' + !!P.swing);
    } else if (P.face !== dirTo && P.on && !(P.swing && P.swing.t > 0)) hold(dirTo);
    return;
  }
  ctx.parried = false;
  // the clash opened her counter (her own state): take it at once
  if (P.counterT > 0 && !P.counterAct) { keysP.KeyX = 1; keys.KeyX = 1; ctx.lastSwingF = F; L('counter'); return; }
  if (st === 'kickprep' || st === 'kick') { goTo(rump - face * 170, 10); return; }
  if (st === 'hornprep' || st === 'hornfire') {
    // the horn is coming: hold her ground at his head (or out of the small horn's short line in p2)
    if (p2 && front && dSn < 120) { goTo(snout + face * 130, 10); return; }
    return;
  }
  const OPEN = /^(hornless|hornseat|stunned|recover|skid|tossrecover|kickrecover|stagger|daze|rest|wallslam|turn|idle|walk)$/;
  if (OPEN.test(st)) {
    // the head when she is on its side, the rump when she is behind
    const headSide = front;
    const tx = headSide ? snout + face * 12 : rump - face * 26;
    // phase two: never be behind him when he decides (the kick has 100 ms she can see)
    const neutral = st === 'idle' || st === 'walk' || st === 'rest';
    // how long until he CHOOSES his next blow, from what she saw (the idle he rests in after each state)
    const AFTER = p2 ? { stagger: 0.22, recover: 0.27, tossrecover: 0.25, kickrecover: 0.22, hornseat: 0.31, turn: 0.25, stunned: 0.62, skid: 0.62, daze: 0.67, wallslam: 1.6 }
                     : { stagger: 0.37, recover: 0.44, tossrecover: 0.41, kickrecover: 0.37, hornseat: 0.52, turn: 0.35, stunned: 0.79, skid: 1.06, daze: 0.84, wallslam: 2.0 };
    const toDecide = st === 'hornless' ? 9 : rem + (AFTER[st] || 0);
    if (p2 && !front && toDecide < 0.25) { goTo(rump - face * 190, 10); return; }
    // before a toss can come (he did not just toss), her blade must be quiet before he decides
    const tossNext = ctx.lastMove !== 'toss';
    // RANGE MODE (the variant that asks for the charge): between his blows she keeps a wall at her back
    if (ctx.MODE === 'range' && (neutral || toDecide < 0.3)) {
      const far = s.cx < WALLX / 2 ? WALLX - 110 : Math.max(60, s.cx - 470);
      if (!goTo(far, 16) ) return; if (P.face !== dirTo && P.on) hold(dirTo); return;
    }
    if (tossNext && toDecide < 0.24) { if (front) { goTo(snout + face * 18, 14); if (P.face !== dirTo && P.on) hold(dirTo); } return; }
    if (st === 'hornseat' && front && tossNext) { goTo(snout + face * 18, 14); return; }
    if (!goTo(tx, 22)) return;
    if (P.face !== dirTo) { hold(dirTo); return; }
    if (toDecide < 0.05) return;                  // he is about to choose: no blow into the wind-up's plate
    if (P.atkCD > 0) return;                      // a press now would start late (buffered): wait for it
    strike(0);
    return;
  }
};
module.exports = { boss: 'horn', bot: bot.toString() };
// the same player, but keeping her distance between blows so that he charges (proves the jump)
module.exports.eyes = bot.toString().replace("ctx.MODE = 'close';", "ctx.MODE = 'close'; ctx.PLAG = 1;");
module.exports.range = bot.toString().replace("ctx.MODE = 'close'", "ctx.MODE = 'range'");
