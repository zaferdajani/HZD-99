// NOSTOS — comic cutscenes: colorful manga-style story panels.
// A backstory comic plays before the main story; each guardian gets a
// reveal comic the first time it is approached. All panels are drawn in
// code (bold flat colors, halftone screentones, speed lines, splash
// onomatopoeia); captions are original writing, en + ar.
const TAU = Math.PI * 2;
const CX = { on: false, id: null, panels: [], i: 0, t: 0, onEnd: null };

function CX_START(id, onEnd) {
  const def = COMIC_BOOK[id];
  if (!def) { if (onEnd) onEnd(); return; }
  CX.on = true; CX.id = id; CX.panels = def; CX.i = 0; CX.t = 0;
  CX.onEnd = onEnd || null;
  CX.prevState = G.state;
  G.state = 'COMIC';
  sfx('ui');
}
function cxEnd() {
  CX.on = false;
  G.state = 'PLAY';
  const cb = CX.onEnd; CX.onEnd = null;
  if (cb) cb();
}
function updateComic(dt) {
  CX.t += dt;
  if (inP('BACK')) { cxEnd(); return; }
  if (inP('OK') || inP('ATK') || inP('INT') || CX.t > 5.2) {
    CX.i++; CX.t = 0;
    if (CX.i >= CX.panels.length) { cxEnd(); return; }
    sfx('ui');
  }
}

// ---------- comic drawing helpers ----------
function cxHalftone(x, y, w, h, color, sp, r0) {
  c.save(); c.fillStyle = color; c.globalAlpha = 0.35;
  for (let yy = y; yy < y + h; yy += sp)
    for (let xx = x + (yy / sp % 2) * sp / 2; xx < x + w; xx += sp) {
      c.beginPath(); c.arc(xx, yy, r0 || 1.6, 0, 7); c.fill();
    }
  c.restore();
}
function cxSpeedlines(cx2, cy2, color, n) {
  c.save(); c.strokeStyle = color; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < (n || 22); i++) {
    const a = i / (n || 22) * Math.PI * 2 + 0.13;
    const r1 = 120 + hash2(i, 8) * 120, r2 = 640;
    c.globalAlpha = 0.5 + hash2(i, 9) * 0.4;
    c.beginPath();
    c.moveTo(cx2 + Math.cos(a) * r1, cy2 + Math.sin(a) * r1);
    c.lineTo(cx2 + Math.cos(a) * r2, cy2 + Math.sin(a) * r2);
    c.stroke();
  }
  c.restore();
}
function cxSplash(x, y, text, fill, size) {
  // jagged star burst with bold onomatopoeia
  c.save(); c.translate(x, y);
  const R = (size || 64) * 1.5;
  c.fillStyle = fill; c.strokeStyle = '#181008'; c.lineWidth = 4;
  c.beginPath();
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2;
    const rr2 = i % 2 ? R * 0.62 : R * (0.9 + hash2(i, 3) * 0.25);
    c.lineTo(Math.cos(a) * rr2 * 1.35, Math.sin(a) * rr2 * 0.8);
  }
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#181008';
  c.font = '900 ' + (size || 64) * 0.42 + 'px "Arial Black", "Segoe UI", sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.save(); c.rotate(-0.08); c.fillText(text, 0, 0); c.restore();
  c.restore();
}
// silhouette hero head (used in several panels): crested helmet profile
function cxHeroHead(x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-16, 10); c.quadraticCurveTo(-18, -14, 0, -16);
  c.quadraticCurveTo(16, -14, 15, 0); c.lineTo(10, 2); c.lineTo(10, -4);
  c.lineTo(-2, -4); c.lineTo(-4, 10); c.closePath(); c.fill();
  c.fillStyle = '#c0303a';
  c.beginPath(); c.moveTo(-14, -12); c.quadraticCurveTo(0, -26, 16, -11);
  c.quadraticCurveTo(2, -18, -12, -8); c.closePath(); c.fill();
  c.restore();
}
// deep eye close-up (the "meaningful eye" panel)
function cxEyeCloseup(x, y, w, k) {
  c.save(); c.translate(x, y);
  // almond
  c.fillStyle = '#181008';
  c.beginPath(); c.moveTo(-w, 0);
  c.quadraticCurveTo(0, -w * 0.62, w, -w * 0.06);
  c.quadraticCurveTo(0, w * 0.5, -w, 0); c.closePath(); c.fill();
  const sg3 = c.createLinearGradient(-w, -w * 0.4, w, w * 0.3);
  sg3.addColorStop(0, '#b8a888'); sg3.addColorStop(0.4, '#f4ecd8'); sg3.addColorStop(1, '#d8c8a8');
  c.fillStyle = sg3;
  c.beginPath(); c.moveTo(-w * 0.88, 0);
  c.quadraticCurveTo(0, -w * 0.54, w * 0.9, -w * 0.05);
  c.quadraticCurveTo(0, w * 0.42, -w * 0.88, 0); c.closePath(); c.fill();
  // iris
  const ir = w * 0.34;
  const ig = c.createRadialGradient(w * 0.06 - ir * 0.25, -ir * 0.3, ir * 0.1, w * 0.06, 0, ir);
  ig.addColorStop(0, '#9ec4d8'); ig.addColorStop(0.3, '#2a5a74'); ig.addColorStop(0.85, '#1a3a4c'); ig.addColorStop(1, '#0a1418');
  c.fillStyle = ig; c.beginPath(); c.arc(w * 0.06, 0, ir, 0, 7); c.fill();
  c.fillStyle = '#060a0c'; c.beginPath(); c.arc(w * 0.06, 0, ir * 0.44, 0, 7); c.fill();
  // reflected storm inside the pupil — memory of the sea
  c.strokeStyle = 'rgba(158,220,240,0.7)'; c.lineWidth = w * 0.02;
  c.beginPath(); c.arc(w * 0.06, ir * 0.1, ir * 0.62, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.95)';
  c.beginPath(); c.arc(w * 0.06 - ir * 0.35, -ir * 0.35, ir * 0.16, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.4)';
  c.beginPath(); c.arc(w * 0.06 + ir * 0.3, ir * 0.25, ir * 0.09, 0, 7); c.fill();
  // upper lid shadow + lashes
  c.fillStyle = 'rgba(24,16,8,' + (0.35 + k * 0.1) + ')';
  c.beginPath(); c.moveTo(-w * 0.88, -w * 0.06);
  c.quadraticCurveTo(0, -w * 0.56, w * 0.9, -w * 0.08);
  c.quadraticCurveTo(0, -w * 0.34, -w * 0.88, -w * 0.06); c.closePath(); c.fill();
  c.strokeStyle = '#181008'; c.lineWidth = w * 0.05; c.lineCap = 'round';
  c.beginPath(); c.moveTo(w * 0.82, -w * 0.14); c.lineTo(w * 1.05, -w * 0.3); c.stroke();
  // brow
  c.strokeStyle = '#241a0c'; c.lineWidth = w * 0.09;
  c.beginPath(); c.moveTo(-w * 0.8, -w * 0.52); c.quadraticCurveTo(0, -w * 0.78, w * 0.85, -w * 0.42); c.stroke();
  c.restore();
}

// ---------- the panels ----------
// Each panel: { bg(t), cap:{en,ar}, sfx?:{t,x,y,c,size} }
const COMIC_BOOK = {
  intro: [
    { cap: { en: 'Ten years of war. For a wooden horse and a burning city, they will sing forever.',
             ar: 'عشر سنين من الحرب. حصانٌ خشبي ومدينةٌ تحترق — وسيغنّون بذلك إلى الأبد.' },
      sfx: { t: 'TROY FALLS', x: 480, y: 120, c: '#ffb84a', size: 52 },
      bg(t) {
        const sky = c.createLinearGradient(0, 0, 0, 540);
        sky.addColorStop(0, '#2a0a0a'); sky.addColorStop(0.6, '#8a2c14'); sky.addColorStop(1, '#e8742c');
        c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
        cxHalftone(0, 0, 960, 200, '#4a0a0a', 14, 2.4);
        // burning city silhouette
        c.fillStyle = '#180a06';
        for (let i = 0; i < 9; i++) {
          const bx = 40 + i * 105, bh = 120 + hash2(i, 2) * 160;
          c.fillRect(bx, 540 - bh, 70, bh);
          if (i % 3 === 0) { c.beginPath(); c.moveTo(bx - 10, 540 - bh); c.lineTo(bx + 35, 540 - bh - 50); c.lineTo(bx + 80, 540 - bh); c.closePath(); c.fill(); }
        }
        // flames licking up, animated
        for (let i = 0; i < 14; i++) {
          const fxx = 60 + i * 66, fh = 60 + Math.sin(t * 6 + i * 2) * 22 + hash2(i, 5) * 60;
          const fg = c.createLinearGradient(0, 540 - fh, 0, 540);
          fg.addColorStop(0, 'rgba(255,220,120,0.9)'); fg.addColorStop(1, 'rgba(200,50,20,0.1)');
          c.fillStyle = fg;
          c.beginPath(); c.moveTo(fxx - 18, 540);
          c.quadraticCurveTo(fxx - 14, 540 - fh * 0.5, fxx + Math.sin(t * 8 + i) * 8, 540 - fh);
          c.quadraticCurveTo(fxx + 16, 540 - fh * 0.4, fxx + 20, 540); c.closePath(); c.fill();
        }
        // the horse silhouette on the hill
        c.fillStyle = '#0c0604';
        c.save(); c.translate(700, 300); c.scale(1.5, 1.5);
        c.fillRect(-40, -20, 80, 34); // body
        c.fillRect(-40, 14, 12, 40); c.fillRect(28, 14, 12, 40); // legs
        c.beginPath(); c.moveTo(38, -18); c.lineTo(64, -46); c.lineTo(70, -30); c.lineTo(48, -8); c.closePath(); c.fill(); // neck+head
        c.restore();
      } },
    { cap: { en: 'But one god watched the victors sail. Poseidon does not forgive — and the sea is very large.',
             ar: 'لكن إلهًا واحدًا راقب المنتصرين وهم يبحرون. بوسيدون لا يغفر — والبحر واسعٌ جدًا.' },
      sfx: { t: 'KRA-KOOM!', x: 700, y: 100, c: '#7ad4ff', size: 56 },
      bg(t) {
        const sky = c.createLinearGradient(0, 0, 0, 540);
        sky.addColorStop(0, '#060a18'); sky.addColorStop(0.5, '#10244a'); sky.addColorStop(1, '#0a3a44');
        c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
        // lightning
        if (Math.sin(t * 9) > 0.55) {
          c.fillStyle = 'rgba(210,235,255,0.25)'; c.fillRect(0, 0, 960, 540);
          c.strokeStyle = '#eaf6ff'; c.lineWidth = 5; c.lineCap = 'round';
          c.beginPath(); c.moveTo(250, 0); c.lineTo(300, 130); c.lineTo(260, 150); c.lineTo(330, 300); c.stroke();
        }
        // colossal trident rising from the waves
        c.fillStyle = '#0c2a30';
        for (let i = 0; i < 5; i++) {
          const wy = 340 + i * 44;
          c.beginPath(); c.moveTo(0, wy);
          for (let x = 0; x <= 960; x += 60) c.quadraticCurveTo(x + 30, wy - 26 + Math.sin(t * 3 + x + i) * 10, x + 60, wy);
          c.lineTo(960, 540); c.lineTo(0, 540); c.closePath(); c.fill();
        }
        c.fillStyle = '#0e3c46';
        c.save(); c.translate(680, 60 + Math.sin(t * 1.4) * 8);
        c.fillRect(-14, 40, 28, 400);
        for (const px of [-58, 0, 58]) {
          c.fillRect(px - 11, -40, 22, 110);
          c.beginPath(); c.moveTo(px - 11, -40); c.lineTo(px, -84); c.lineTo(px + 11, -40); c.closePath(); c.fill();
        }
        c.fillRect(-70, 62, 140, 22);
        c.restore();
        // tiny ship tossed on the crest
        c.fillStyle = '#181008';
        c.save(); c.translate(300, 330 + Math.sin(t * 3 + 2) * 14); c.rotate(Math.sin(t * 2.4) * 0.25);
        c.beginPath(); c.moveTo(-46, 0); c.quadraticCurveTo(0, 16, 46, -2); c.lineTo(34, -12); c.lineTo(-38, -10); c.closePath(); c.fill();
        c.fillRect(-3, -44, 5, 34);
        c.beginPath(); c.moveTo(2, -44); c.quadraticCurveTo(30, -30, 2, -16); c.closePath(); c.fill();
        c.restore();
        cxHalftone(0, 380, 960, 160, '#04141c', 12, 2);
      } },
    { cap: { en: 'Ships, crew, spoils — the sea kept them all. It spat one man onto a shore with no name.',
             ar: 'السفن والرجال والغنائم — أخذها البحر كلها. وقذف رجلًا واحدًا إلى شاطئ بلا اسم.' },
      bg(t) {
        const sky = c.createLinearGradient(0, 0, 0, 540);
        sky.addColorStop(0, '#16324a'); sky.addColorStop(0.65, '#2c6b74'); sky.addColorStop(1, '#e8b96a');
        c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
        c.fillStyle = '#ffcf6a'; c.globalAlpha = 0.9;
        c.beginPath(); c.arc(760, 150, 52, 0, 7); c.fill(); c.globalAlpha = 1;
        // beach
        c.fillStyle = '#8a6f46'; c.fillRect(0, 400, 960, 140);
        c.fillStyle = '#a8895c';
        c.beginPath(); c.moveTo(0, 420); c.quadraticCurveTo(480, 388, 960, 424); c.lineTo(960, 540); c.lineTo(0, 540); c.closePath(); c.fill();
        // surf
        for (let i = 0; i < 3; i++) {
          c.strokeStyle = 'rgba(220,244,244,' + (0.7 - i * 0.2) + ')'; c.lineWidth = 6 - i * 1.4;
          c.beginPath();
          const wy = 402 + i * 12 + Math.sin(t * 2 + i) * 4;
          c.moveTo(0, wy);
          for (let x = 0; x <= 960; x += 80) c.quadraticCurveTo(x + 40, wy - 8, x + 80, wy);
          c.stroke();
        }
        // wreck debris + the fallen hero
        c.fillStyle = '#4a3018';
        c.save(); c.translate(620, 430); c.rotate(0.15);
        c.beginPath(); c.moveTo(-90, 0); c.quadraticCurveTo(0, 26, 100, -8); c.lineTo(80, -26); c.lineTo(-80, -20); c.closePath(); c.fill();
        c.restore();
        c.save(); c.translate(330, 452);
        c.fillStyle = '#e0a877';
        c.fillRect(-34, -8, 50, 9);                     // prone body
        c.beginPath(); c.arc(24, -6, 10, 0, 7); c.fill(); // head
        c.fillStyle = '#8f2f38';
        c.beginPath(); c.moveTo(-36, -10); c.quadraticCurveTo(-10, -22, 12, -10); c.lineTo(8, 0); c.lineTo(-30, 0); c.closePath(); c.fill(); // sodden cloak
        c.restore();
        // gulls
        c.strokeStyle = '#f0e8d4'; c.lineWidth = 3;
        for (const [gx, gy] of [[200, 120], [260, 90], [700, 240]]) {
          c.beginPath(); c.moveTo(gx - 12, gy); c.quadraticCurveTo(gx - 4, gy - 8, gx, gy);
          c.quadraticCurveTo(gx + 4, gy - 8, gx + 12, gy); c.stroke();
        }
        cxHalftone(0, 0, 960, 130, '#0c2430', 15, 2);
      } },
    { cap: { en: 'His name is Odysseus, king of Ithaca — and the sea has NOT finished with him. Nor he with it.',
             ar: 'اسمه أوديسيوس، ملك إيثاكا — والبحر لم ينتهِ منه بعد. ولا هو من البحر.' },
      sfx: { t: 'RISE!', x: 760, y: 420, c: '#ffcf6a', size: 60 },
      bg(t) {
        const sky = c.createLinearGradient(0, 0, 0, 540);
        sky.addColorStop(0, '#1a1006'); sky.addColorStop(1, '#5a2c18');
        c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
        cxSpeedlines(480, 270, 'rgba(232,194,106,0.35)', 26);
        // the meaningful eye — storm reflected in the pupil
        cxEyeCloseup(440, 260, 240, Math.min(1, t / 1.2));
        cxHalftone(0, 400, 960, 140, '#2a1408', 13, 2.2);
      } },
  ],
};
// guardian reveal panels: one custom tease + a shared name-splash reveal
function cxReveal(kind, silhouette, glow, accent) {
  return { cap: { en: I18N.en['b_' + kind], ar: I18N.ar['b_' + kind] },
    sfx: null,
    bg(t) {
      const P2 = PAL[G.roomDef ? G.roomDef.zone : 'A'];
      const sky = c.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, '#0c0a06'); sky.addColorStop(1, '#241505');
      c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
      cxSpeedlines(480, 260, accent, 30);
      const k = Math.min(1, t / 0.5);
      c.save(); c.translate(480, 300); c.scale(2.6 * (0.6 + k * 0.4), 2.6 * (0.6 + k * 0.4));
      c.shadowColor = glow; c.shadowBlur = 30;
      silhouette(t); c.restore();
      cxHalftone(0, 0, 960, 120, accent, 13, 2);
      cxHalftone(0, 430, 960, 110, accent, 13, 2);
      drawGlyphText(c, GREEK_B[kind] || '', 480, 92, 22, glow, glow);
    } };
}
COMIC_BOOK.glitch = [
  { cap: { en: 'The tide pulls backward. The gulls have gone silent. Something under the shallows is drinking the sea.',
           ar: 'المدّ يرتدّ إلى الخلف. صمتت النوارس. شيءٌ تحت الضحضاح يشرب البحر.' },
    sfx: { t: 'GLURRRK…', x: 700, y: 140, c: '#4dd0c0', size: 44 },
    bg(t) {
      const sky = c.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, '#0a1e28'); sky.addColorStop(1, '#164a4e');
      c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
      // spiral vortex
      c.save(); c.translate(480, 330);
      for (let i = 0; i < 5; i++) {
        c.strokeStyle = i % 2 ? '#2e7d8a' : '#4dd0c0'; c.lineWidth = 14 - i * 2;
        c.beginPath();
        for (let a = 0; a < TAU * 2.4; a += 0.15) {
          const r2 = 30 + a * 34 - i * 8;
          c.lineTo(Math.cos(a + t * 2 + i) * r2 * 1.4, Math.sin(a + t * 2 + i) * r2 * 0.5);
        }
        c.stroke();
      }
      c.fillStyle = '#06222a'; c.beginPath(); c.ellipse(0, 0, 60, 26, 0, 0, 7); c.fill();
      c.restore();
      cxHalftone(0, 0, 960, 150, '#06303a', 13, 2);
    } },
  cxReveal('glitch', t => {
    for (let ring2 = 3; ring2 >= 0; ring2--) {
      c.strokeStyle = ring2 % 2 ? '#2e7d8a' : '#4dd0c0'; c.lineWidth = 5 - ring2;
      c.beginPath(); c.arc(0, 0, 10 + ring2 * 8, t * 3, t * 3 + 4.6); c.stroke();
    }
    c.fillStyle = '#06222a'; c.beginPath(); c.ellipse(4, 2, 16, 12, 0, 0, 7); c.fill();
    c.fillStyle = '#eefcff';
    for (let k = 0; k < 5; k++) {
      c.beginPath(); c.moveTo(-7 + k * 5, -9); c.lineTo(-5 + k * 5, -3); c.lineTo(-3 + k * 5, -9); c.closePath(); c.fill();
    }
    c.fillStyle = '#ff9c4a'; c.beginPath(); c.arc(9, 1, 4, 0, 7); c.fill();
  }, '#4dd0c0', 'rgba(77,208,192,0.5)'),
];
COMIC_BOOK.atlas = [
  { cap: { en: 'The flock scatters. A boulder the size of a house grinds aside — and the cave breathes out.',
           ar: 'يتفرّق القطيع. صخرةٌ بحجم بيت تنزاح جانبًا — ويتنفّس الكهف.' },
    sfx: { t: 'GRRND!', x: 240, y: 130, c: '#ff9c4a', size: 50 },
    bg(t) {
      const sky = c.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, '#241d16'); sky.addColorStop(1, '#503a22');
      c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
      // cave mouth filling the frame
      c.fillStyle = '#180f06';
      c.beginPath(); c.moveTo(80, 540); c.quadraticCurveTo(140, 100, 480, 70);
      c.quadraticCurveTo(820, 100, 880, 540); c.closePath(); c.fill();
      c.fillStyle = '#060402';
      c.beginPath(); c.moveTo(240, 540); c.quadraticCurveTo(300, 220, 480, 200);
      c.quadraticCurveTo(660, 220, 720, 540); c.closePath(); c.fill();
      // THE eye opening in the dark
      const open = clamp((Math.sin(t * 1.2) + 1) / 2 + 0.3, 0, 1);
      c.fillStyle = '#ffe9c8'; c.shadowColor = '#ff9c4a'; c.shadowBlur = 40;
      c.beginPath(); c.ellipse(480, 350, 70, 46 * open, 0, 0, 7); c.fill(); c.shadowBlur = 0;
      c.fillStyle = '#3a2210'; c.beginPath(); c.arc(480 + Math.sin(t) * 12, 350, 26 * open + 2, 0, 7); c.fill();
      // fleeing sheep
      for (const [sx2, sy2] of [[150, 480], [230, 500], [820, 490]]) {
        c.fillStyle = '#d8d0bc'; c.beginPath(); c.ellipse(sx2, sy2, 26, 16, 0, 0, 7); c.fill();
        c.fillStyle = '#b8ac90'; c.beginPath(); c.arc(sx2 + 22, sy2 - 8, 9, 0, 7); c.fill();
      }
      cxHalftone(0, 0, 960, 540, '#0c0804', 17, 2);
    } },
  cxReveal('atlas', t => {
    c.fillStyle = '#a8744a'; rr(c, -22, -30, 44, 52, 10); c.fill();
    c.fillStyle = '#b07c4e'; rr(c, -13, -44, 28, 18, 6); c.fill();
    c.fillStyle = '#ffe9c8'; c.shadowColor = '#ff9c4a'; c.shadowBlur = 16;
    c.beginPath(); c.arc(1, -35, 7, 0, 7); c.fill(); c.shadowBlur = 0;
    c.fillStyle = '#3a2210'; c.beginPath(); c.arc(1, -35, 3, 0, 7); c.fill();
    c.fillStyle = '#6b4a2a';
    c.save(); c.rotate(0.5 + Math.sin(t * 2) * 0.1); rr(c, 18, -6, 8, 26, 4); c.fill(); c.restore();
  }, '#ff9c4a', 'rgba(255,156,74,0.5)'),
];
COMIC_BOOK.zero = [
  { cap: { en: '"Drink, strangers." The cup is sweet. The smile is sweeter. The men who drank before you… are watching from the hedges.',
           ar: '«اشربوا أيها الغرباء». الكأس حلوة، والابتسامة أحلى. والرجال الذين شربوا قبلكم… يراقبون من بين الشجيرات.' },
    sfx: null,
    bg(t) {
      const sky = c.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, '#150f26'); sky.addColorStop(1, '#2e2150');
      c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
      // giant offered cup, steaming
      c.save(); c.translate(480, 300);
      c.fillStyle = '#c8963c';
      c.beginPath(); c.moveTo(-90, -60); c.lineTo(90, -60); c.quadraticCurveTo(70, 30, 0, 40);
      c.quadraticCurveTo(-70, 30, -90, -60); c.closePath(); c.fill();
      c.fillStyle = '#8a6428'; c.fillRect(-14, 40, 28, 50); c.fillRect(-44, 90, 88, 14);
      c.fillStyle = '#6a2a4a';
      c.beginPath(); c.ellipse(0, -60, 88, 18, 0, 0, 7); c.fill();
      for (let i = 0; i < 3; i++) {
        c.strokeStyle = 'rgba(200,162,255,' + (0.5 - i * 0.13) + ')'; c.lineWidth = 6;
        c.beginPath();
        const sx2 = -30 + i * 30;
        c.moveTo(sx2, -84);
        c.quadraticCurveTo(sx2 + Math.sin(t * 2 + i) * 20, -140, sx2 + 10, -190 - i * 16);
        c.stroke();
      }
      c.restore();
      // beast eyes in the hedges
      for (const [ex, ey] of [[120, 420], [180, 460], [800, 430], [860, 470], [90, 250]]) {
        c.fillStyle = '#6aff9e'; c.shadowColor = '#6aff9e'; c.shadowBlur = 10;
        c.beginPath(); c.arc(ex, ey, 5, 0, 7); c.arc(ex + 16, ey, 5, 0, 7); c.fill(); c.shadowBlur = 0;
      }
      cxHalftone(0, 380, 960, 160, '#0a0614', 14, 2.2);
    } },
  cxReveal('zero', t => {
    const rg = c.createLinearGradient(0, -28, 0, 30);
    rg.addColorStop(0, 'rgba(120,74,160,0.95)'); rg.addColorStop(1, 'rgba(70,42,110,0.6)');
    c.fillStyle = rg;
    c.beginPath(); c.moveTo(-16, -24); c.lineTo(16, -24);
    c.quadraticCurveTo(22, 6, 16, 30); c.lineTo(-16, 30);
    c.quadraticCurveTo(-22, 6, -16, -24); c.closePath(); c.fill();
    c.fillStyle = '#e8b890'; c.beginPath(); c.arc(0, -30, 9, 0, 7); c.fill();
    c.fillStyle = '#2a1a30';
    c.beginPath(); c.moveTo(-9, -36); c.quadraticCurveTo(0, -44, 9, -36);
    c.quadraticCurveTo(12, -18, 9, -6); c.lineTo(-9, -6); c.quadraticCurveTo(-12, -18, -9, -36); c.closePath(); c.fill();
    c.strokeStyle = '#8a6a28'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(12, -18); c.lineTo(26, -34 + Math.sin(t * 3) * 3); c.stroke();
    c.fillStyle = '#6aff9e'; c.shadowColor = '#6aff9e'; c.shadowBlur = 14;
    c.beginPath(); c.arc(27, -35 + Math.sin(t * 3) * 3, 4, 0, 7); c.fill(); c.shadowBlur = 0;
  }, '#b46aff', 'rgba(180,106,255,0.5)'),
];
COMIC_BOOK.brood = [
  { cap: { en: 'Six shadows glide across the mist. Six hungers. One gate — and she is wrapped around it.',
           ar: 'ستة ظلال تنزلق فوق الضباب. ستة أفواه جائعة. بوابة واحدة — وهي ملتفّة حولها.' },
    sfx: { t: 'HSSSSS', x: 720, y: 120, c: '#7deac8', size: 46 },
    bg(t) {
      const sky = c.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, '#0c1014'); sky.addColorStop(1, '#1e2831');
      c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
      // mist
      for (let i = 0; i < 5; i++) {
        c.fillStyle = 'rgba(125,234,200,0.06)';
        c.beginPath(); c.ellipse(((i * 260 + t * 30) % 1100) - 70, 380 + i * 26, 240, 40, 0, 0, 7); c.fill();
      }
      // six neck shadows descending
      for (let i = 0; i < 6; i++) {
        const nx = 160 + i * 130, wob = Math.sin(t * 2 + i * 1.4) * 30;
        c.strokeStyle = 'rgba(10,16,20,0.9)'; c.lineWidth = 26 - i % 3 * 4;
        c.beginPath(); c.moveTo(nx, -20);
        c.quadraticCurveTo(nx + wob, 200, nx - wob * 0.6, 330 + Math.sin(t * 3 + i) * 24);
        c.stroke();
        // eyes at the tips
        c.fillStyle = '#ff6a5a'; c.shadowColor = '#ff6a5a'; c.shadowBlur = 12;
        c.beginPath(); c.arc(nx - wob * 0.6 - 6, 336 + Math.sin(t * 3 + i) * 24, 4, 0, 7);
        c.arc(nx - wob * 0.6 + 6, 336 + Math.sin(t * 3 + i) * 24, 4, 0, 7); c.fill(); c.shadowBlur = 0;
      }
      cxHalftone(0, 0, 960, 540, '#04141c', 16, 2),
      drawGlyphText(c, 'ΕΞ ΚΕΦΑΛΑΙ', 480, 480, 15, 'rgba(200,232,232,0.5)');
    } },
  cxReveal('brood', t => {
    c.fillStyle = '#3a4a52'; c.beginPath(); c.ellipse(0, -10, 26, 20, 0, 0, 7); c.fill();
    for (let i = 0; i < 6; i++) {
      const wob = Math.sin(t * 3 + i * 1.7) * 8, nx = -20 + i * 8;
      c.strokeStyle = '#46606b'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(nx, 4); c.quadraticCurveTo(nx + wob, 22, nx - wob, 38); c.stroke();
      c.fillStyle = '#33454e'; c.beginPath(); c.ellipse(nx - wob, 40, 5, 4, 0, 0, 7); c.fill();
      c.fillStyle = '#ff6a5a'; c.beginPath(); c.arc(nx - wob + 1.6, 39, 1.3, 0, 7); c.fill();
    }
    c.fillStyle = '#c8e8e8'; c.shadowColor = '#7deac8'; c.shadowBlur = 10;
    c.beginPath(); c.arc(-6, -14, 3.4, 0, 7); c.arc(6, -14, 3.4, 0, 7); c.fill(); c.shadowBlur = 0;
  }, '#7deac8', 'rgba(125,234,200,0.5)'),
];
COMIC_BOOK.prism = [
  { cap: { en: 'You hear it before you see her: a song promising everything you ever lost. The bones on the rocks heard it too.',
           ar: 'تسمعها قبل أن تراها: أغنية تعدك بكل ما فقدته يومًا. والعظام فوق الصخور سمعتها من قبل.' },
    sfx: { t: '♪ ♫ ♪', x: 250, y: 120, c: '#ffd76a', size: 52 },
    bg(t) {
      const sky = c.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, '#0a1428'); sky.addColorStop(1, '#16305a');
      c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
      c.fillStyle = '#cfe8ff'; c.globalAlpha = 0.9;
      c.beginPath(); c.arc(720, 120, 44, 0, 7); c.fill(); c.globalAlpha = 1;
      // sea stacks + moonlit water
      for (const [sx2, sh] of [[160, 300], [420, 380], [800, 340]]) {
        c.fillStyle = '#122a44';
        c.beginPath(); c.moveTo(sx2 - 70, 540); c.quadraticCurveTo(sx2 - 30, 540 - sh, sx2, 540 - sh - 20);
        c.lineTo(sx2 + 26, 540 - sh); c.quadraticCurveTo(sx2 + 60, 540 - sh * 0.4, sx2 + 80, 540); c.closePath(); c.fill();
      }
      for (let i = 0; i < 4; i++) {
        c.strokeStyle = 'rgba(168,228,255,0.3)'; c.lineWidth = 3;
        const wy = 440 + i * 22;
        c.beginPath(); c.moveTo(0, wy);
        for (let x = 0; x <= 960; x += 70) c.quadraticCurveTo(x + 35, wy - 10 + Math.sin(t * 2 + x + i) * 5, x + 70, wy);
        c.stroke();
      }
      // floating song notes
      for (let i = 0; i < 7; i++) {
        const nx = ((i * 150 + t * 60) % 1000) - 20, ny = 180 + Math.sin(t * 2 + i * 2) * 40 + i * 18;
        c.fillStyle = 'rgba(255,215,106,' + (0.5 + Math.sin(t * 3 + i) * 0.3) + ')';
        c.font = '700 ' + (22 + (i % 3) * 8) + 'px Georgia'; c.textAlign = 'center';
        c.fillText(i % 2 ? '♪' : '♫', nx, ny);
      }
      // bones on the near rock
      c.strokeStyle = '#e0e4dc'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(80, 500); c.lineTo(180, 480); c.stroke();
      c.fillStyle = '#e0e4dc'; c.beginPath(); c.arc(200, 476, 16, 0, 7); c.fill();
      c.fillStyle = '#0a1428'; c.beginPath(); c.arc(194, 472, 5, 0, 7); c.arc(208, 474, 5, 0, 7); c.fill();
      cxHalftone(0, 0, 960, 150, '#0a2038', 14, 2);
    } },
  cxReveal('prism', t => {
    const wb2 = Math.sin(t * 6) * 8;
    for (const wdir of [-1, 1]) {
      c.fillStyle = wdir < 0 ? 'rgba(168,228,255,0.6)' : 'rgba(200,240,255,0.75)';
      c.beginPath(); c.moveTo(-4, -6);
      c.quadraticCurveTo(-22 * wdir - 4, -26 - wb2 * wdir, -36 * wdir - 2, -10 - wb2);
      c.quadraticCurveTo(-24 * wdir - 2, -2, -4, 2); c.closePath(); c.fill();
    }
    c.fillStyle = '#2e4a5c'; rr(c, -18, -10, 36, 20, 9); c.fill();
    c.fillStyle = '#f0dcc8'; c.beginPath(); c.arc(10, -16, 8, 0, 7); c.fill();
    c.fillStyle = '#ffd76a';
    c.beginPath(); c.moveTo(3, -20); c.quadraticCurveTo(10, -28, 18, -20);
    c.quadraticCurveTo(20, -10, 16, -5); c.lineTo(4, -7); c.closePath(); c.fill();
    c.fillStyle = '#7ad4ff'; c.fillRect(7, -18, 3, 2.6); c.fillRect(12.5, -18, 3, 2.6);
    c.fillStyle = '#3a2a30'; c.beginPath(); c.ellipse(10, -11.5, 2, 3, 0, 0, 7); c.fill();
  }, '#7ad4ff', 'rgba(122,212,255,0.5)'),
];
COMIC_BOOK.mother = [
  { cap: { en: 'Twenty years they have eaten at your table and courted your queen. The beggar at the door sets down his rags… and picks up a bow no man could string.',
           ar: 'عشرين سنة أكلوا على مائدتك وخطبوا مليكتك. الشحّاذ الواقف عند الباب يُلقي أسماله… ويرفع قوسًا لم يستطع أحدٌ أن يوتّره.' },
    sfx: { t: 'TWANG!', x: 730, y: 140, c: '#ffb84a', size: 54 },
    bg(t) {
      const sky = c.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, '#2a1410'); sky.addColorStop(1, '#5a2c18');
      c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
      // hall columns + long table
      for (let k = 0; k < 4; k++) {
        c.fillStyle = '#8a5530';
        c.fillRect(90 + k * 240, 80, 34, 380);
        c.fillRect(80 + k * 240, 66, 54, 18);
      }
      c.fillStyle = '#6b4525'; c.fillRect(180, 380, 600, 26);
      c.fillStyle = '#4a3018'; c.fillRect(200, 406, 20, 70); c.fillRect(740, 406, 20, 70);
      // scattered cups + spilled wine
      for (const [cx2, cy2] of [[260, 372], [380, 368], [560, 370], [680, 366]]) {
        c.fillStyle = '#c8963c';
        c.beginPath(); c.moveTo(cx2 - 8, cy2); c.lineTo(cx2 + 8, cy2); c.lineTo(cx2 + 5, cy2 + 10); c.lineTo(cx2 - 5, cy2 + 10); c.closePath(); c.fill();
      }
      c.fillStyle = 'rgba(106,42,74,0.8)';
      c.beginPath(); c.ellipse(470, 384, 46, 7, 0, 0, 7); c.fill();
      // the hero silhouette in the doorway, bow raised
      const dg = c.createLinearGradient(0, 0, 0, 540);
      dg.addColorStop(0, '#ffcf6a'); dg.addColorStop(1, '#e8742c');
      c.fillStyle = dg; c.fillRect(30, 120, 150, 340);
      c.fillStyle = '#181008';
      c.save(); c.translate(105, 380); c.scale(1.25, 1.25);
      c.fillRect(-14, -70, 28, 70);
      cxHeroHead(0, -84, 1.1, '#181008');
      c.strokeStyle = '#181008'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(10, -60); c.quadraticCurveTo(46, -40, 10, -6); c.stroke();  // the great bow
      c.strokeStyle = 'rgba(24,16,8,0.8)'; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(12, -58); c.lineTo(12 - Math.sin(t * 2) * 8, -32); c.lineTo(12, -8); c.stroke();
      c.restore();
      cxHalftone(0, 0, 960, 100, '#180a04', 14, 2.2);
    } },
  cxReveal('mother', t => {
    c.fillStyle = '#8a5530'; c.beginPath(); c.arc(0, 4, 34, 0, 7); c.fill();
    c.fillStyle = '#c8963c'; c.beginPath(); c.arc(0, 4, 28, 0, 7); c.fill();
    c.fillStyle = '#8a5530'; c.beginPath(); c.arc(0, 4, 9, 0, 7); c.fill();
    c.fillStyle = '#b0805a'; rr(c, -10, -34, 20, 18, 6); c.fill();
    const hg2 = c.createLinearGradient(0, -50, 0, -30);
    hg2.addColorStop(0, '#e8c26a'); hg2.addColorStop(1, '#a8853f');
    c.fillStyle = hg2;
    c.beginPath(); c.moveTo(-9, -30); c.quadraticCurveTo(-9, -48, 0, -48);
    c.quadraticCurveTo(9, -48, 9, -30); c.closePath(); c.fill();
    c.fillStyle = '#c0303a';
    c.beginPath(); c.moveTo(-11, -44); c.quadraticCurveTo(0, -58 - Math.sin(t * 4) * 3, 12, -43);
    c.quadraticCurveTo(2, -50, -11, -40); c.closePath(); c.fill();
    c.fillStyle = '#ffd76a'; c.shadowColor = '#ffd76a'; c.shadowBlur = 12;
    c.fillRect(-5, -40, 10, 2.6); c.shadowBlur = 0;
    c.save(); c.rotate(Math.sin(t) * 0.1 + 0.4);
    c.strokeStyle = '#6b4a2a'; c.lineWidth = 3.4;
    c.beginPath(); c.moveTo(14, 0); c.lineTo(58, 0); c.stroke();
    c.fillStyle = '#e8e2d0'; c.beginPath(); c.moveTo(58, -3.4); c.lineTo(70, 0); c.lineTo(58, 3.4); c.closePath(); c.fill();
    c.restore();
  }, '#ffb84a', 'rgba(255,184,74,0.5)'),
];

// ---------- page renderer ----------
function drawComic() {
  const p = CX.panels[CX.i];
  if (!p) return;
  const t = CX.t;
  // paper ground
  c.fillStyle = '#efe6cf'; c.fillRect(0, 0, 960, 540);
  // slight page grain
  c.globalAlpha = 0.05; c.fillStyle = '#8a6f46';
  for (let i = 0; i < 40; i++) c.fillRect(hash2(i, 1) * 960, hash2(i, 2) * 540, 2, 2);
  c.globalAlpha = 1;
  // panel with dramatic tilt + zoom entrance
  const k = Math.min(1, t / 0.35);
  const ease2 = 1 - Math.pow(1 - k, 3);
  c.save();
  c.translate(480, 260);
  c.rotate((CX.i % 2 ? 1 : -1) * 0.012);
  c.scale(0.92 + 0.08 * ease2, 0.92 + 0.08 * ease2);
  c.translate(-480, -260);
  // frame
  c.save();
  c.beginPath();
  c.moveTo(36, 30); c.lineTo(930, 22); c.lineTo(922, 452); c.lineTo(28, 460);
  c.closePath();
  c.save(); c.clip();
  c.translate(0, -10);
  p.bg(t);
  c.restore();
  c.lineWidth = 7; c.strokeStyle = '#181008'; c.stroke();
  c.lineWidth = 2; c.strokeStyle = '#efe6cf';
  c.beginPath(); c.moveTo(42, 36); c.lineTo(924, 28); c.lineTo(916, 446); c.lineTo(34, 454); c.closePath(); c.stroke();
  c.restore();
  // onomatopoeia splash pops in
  if (p.sfx && t > 0.35) {
    const sk2 = Math.min(1, (t - 0.35) / 0.18);
    c.save(); c.translate(p.sfx.x, p.sfx.y); c.scale(0.5 + sk2 * 0.5 + Math.sin(t * 10) * 0.015, 0.5 + sk2 * 0.5);
    cxSplash(0, 0, p.sfx.t, p.sfx.c, p.sfx.size);
    c.restore();
  }
  c.restore();
  // caption box (typed-in text)
  const cap = p.cap[LANG] || p.cap.en;
  c.save();
  c.fillStyle = '#fdf8ea';
  c.strokeStyle = '#181008'; c.lineWidth = 4;
  const bx = 60, by = 462, bw = 840, bh = 64;
  c.beginPath();
  c.moveTo(bx, by + 4); c.lineTo(bx + bw, by); c.lineTo(bx + bw - 6, by + bh); c.lineTo(bx + 4, by + bh - 2);
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#181008';
  const shown = cap.slice(0, Math.floor((t - 0.15) * 60));
  c.font = '600 17px Georgia, "Times New Roman", serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  wrapText(shown, bw - 60, 17).slice(0, 2).forEach((ln, i2) =>
    c.fillText(ln, 480, by + 22 + i2 * 22));
  c.restore();
  // page dots + hints
  for (let i = 0; i < CX.panels.length; i++) {
    c.fillStyle = i === CX.i ? '#c0303a' : 'rgba(24,16,8,0.3)';
    c.beginPath(); c.arc(480 - (CX.panels.length - 1) * 9 + i * 18, 16, 5, 0, 7); c.fill();
  }
  c.fillStyle = 'rgba(24,16,8,0.55)'; c.font = '600 12px Georgia';
  c.textAlign = 'right'; c.fillText(t2k('cx_next'), 930, 528);
  c.textAlign = 'left'; c.fillText(t2k('cx_skip'), 30, 528);
}
function t2k(k) { return t(k); }
