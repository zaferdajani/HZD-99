// ===========================================================================
// GLACIERE, THE FROZEN PURIFIER — the corrupted unicorn of the void.
// Every pixel here is the owner's sheet: two full authored figures (the
// galloping hero pose for flight, the standing assembly for gathered
// moments), the parts row (which she SHATTERS INTO when she dies), and the
// authored effects — void lance, ice shards, nova crystals, void orbs.
// Nothing is guessed; the sheet is ground truth.
// ===========================================================================
const GLC_P = {
  hero: [6, 6, 610, 413],      // galloping flight pose (faces LEFT)
  head: [622, 6, 114, 129], neck: [742, 6, 63, 130], body: [811, 6, 192, 123],
  legF: [1009, 6, 68, 130], legH: [1083, 6, 71, 135], tail: [1160, 6, 136, 84],
  asm: [6, 425, 445, 294],     // standing assembly (faces LEFT)
  lance: [457, 425, 128, 43],
  shard1: [610, 427, 77, 36],  // one arrow from the authored fan
  novaCr: [693, 425, 85, 95],
  orb: [784, 425, 20, 25],
};
function glcImg() { return typeof MEDIA_IMG !== 'undefined' ? MEDIA_IMG.glaciereParts : null; }

// draw one authored figure bottom-anchored in local space (art faces LEFT)
function glcFig(c, key, rot, shake, alpha) {
  const im = glcImg(); if (!im || !im.naturalWidth) return false;
  const s = GLC_P[key];
  c.save();
  if (alpha != null) c.globalAlpha *= alpha;
  if (shake) c.translate(rnd(-shake, shake), rnd(-shake, shake));
  if (rot) c.rotate(rot);
  c.drawImage(im, s[0], s[1], s[2], s[3], -s[2] / 2, -s[3], s[2], s[3]);
  c.restore();
  return true;
}

// the horn tip in hero-figure local space (art faces LEFT, bottom-anchored):
// measured off the sheet — the spiral horn ends near the top-left corner
function glcHornLocal() { return { x: -GLC_P.hero[2] * 0.44, y: -GLC_P.hero[3] * 0.94 }; }

function drawGlaciere(c, b) {
  const im = glcImg(); if (!im || !im.naturalWidth) return false;
  c.save();
  try {
    const H = b.h * 1.9;                       // drawn height over the hitbox
    const S = H / GLC_P.hero[3];
    const cx = b.x + b.w / 2, footY = b.y + b.h;
    const fv = b.faceVis == null ? (b.face || 1) : b.faceVis;
    const sgn = fv < 0 ? 1 : -1;               // authored art faces LEFT
    const ta = Math.max(0.001, Math.abs(fv));
    c.translate(cx, footY);
    // THE TURN LAW, tier 3: no authored front exists, so the flex never
    // drops below 0.85, the pivot crouches into the hooves, and the update
    // side kicks dust on the crossing frame
    c.translate(0, (1 - ta) * 6);
    c.scale(sgn * (0.85 + 0.15 * ta) * S, (1 - (1 - ta) * 0.05) * S);
    if (b.hurtT > 0) c.globalAlpha = 0.72;
    // hover shadow, faint — she floats
    c.save(); c.globalAlpha *= 0.22; c.fillStyle = '#04070b';
    c.beginPath(); c.ellipse(0, 2, 200, 16, 0, 0, 7); c.fill(); c.restore();
    if (b.dead) {
      // DEATH: she breaks into the sheet's own parts row — head, neck,
      // body, legs, tail tumbling apart as the void lets go of her
      const k = 1 - clamp((b.deathAnimT || 0) / 1.6, 0, 1);
      if (!b.glcShatter) {
        b.glcShatter = ['head', 'neck', 'body', 'legF', 'legH', 'tail'].map((pk, i) => ({
          pk,
          x: (i - 2.5) * 30, y: -220 + (i % 3) * 60,
          vx: (i - 2.5) * 90 + rnd(-40, 40), vy: rnd(-260, -80),
          rot: 0, vr: rnd(-3, 3),
        }));
      }
      for (const sh of b.glcShatter) {
        sh.x += sh.vx * k * 0.032; sh.y += (sh.vy + 900 * k) * 0.032;
        sh.rot += sh.vr * 0.032;
        const sp = GLC_P[sh.pk];
        c.save();
        c.globalAlpha *= Math.max(0, 1 - k * 0.75);
        c.translate(sh.x, Math.min(sh.y, -sp[3] / 2));
        c.rotate(sh.rot);
        c.drawImage(im, sp[0], sp[1], sp[2], sp[3], -sp[2] / 2, -sp[3] / 2, sp[2], sp[3]);
        c.restore();
      }
      c.restore(); return true;
    }
    const bob = Math.sin(b.anim * 1.7) * 7;
    const pitch = clamp((b.vy || 0) / -1400, -0.16, 0.16) + Math.sin(b.anim * 1.1) * 0.03;
    c.translate(0, -14 + bob);                 // she rides above the ground line
    if (b.st === 'novawarn' || b.st === 'orbs' || b.st === 'azhush') {
      // gathered: the standing assembly, trembling as power collects
      glcFig(c, 'asm', 0, b.st === 'novawarn' ? 2 : 0.8);
    } else if (b.st === 'dash') {
      // the charge: stretched into her own speed, nose into the line
      c.scale(1.07, 0.96);
      glcFig(c, 'hero', clamp((b.vy || 0) / 2200, -0.3, 0.3), 0);
    } else if (b.st === 'dashwarn') {
      glcFig(c, 'hero', -0.06, 1.6);           // coiling, aimed — the tell
    } else if (b.st === 'lancewarn' || b.st === 'shardwarn') {
      glcFig(c, 'hero', -0.03, 1.2);
    } else {
      glcFig(c, 'hero', pitch, 0);
    }
    // horn charge glow: the lance tell builds at the horn tip
    if (b.st === 'lancewarn') {
      const hp2 = glcHornLocal();
      const k = clamp(1 - (b.t || 0) / 0.7, 0, 1);
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(hp2.x, hp2.y, 2, hp2.x, hp2.y, 26 + k * 40);
      g.addColorStop(0, 'rgba(240,160,255,' + (0.5 + k * 0.5) + ')');
      g.addColorStop(0.5, 'rgba(190,80,240,' + (0.3 + k * 0.35) + ')');
      g.addColorStop(1, 'rgba(120,30,200,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(hp2.x, hp2.y, 26 + k * 40, 0, 7); c.fill();
      c.restore();
    }
    if (b.st === 'shardwarn') {
      // ice gathers along the spine crystals — the shard tell
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha *= 0.35 + Math.sin(b.anim * 16) * 0.2;
      const g = c.createRadialGradient(30, -300, 8, 30, -300, 150);
      g.addColorStop(0, 'rgba(165,216,255,0.5)'); g.addColorStop(1, 'rgba(165,216,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(30, -300, 150, 0, 7); c.fill();
      c.restore();
    }
    c.restore();
    return true;
  } catch (e) { c.restore(); return false; }
}

// authored projectiles: the void lance and one shard from the sheet's fan
function drawGlcProj(c, pr) {
  const im = glcImg(); if (!im || !im.naturalWidth) return false;
  const s = pr.glcFx === 'lance' ? GLC_P.lance : GLC_P.shard1;
  const k = pr.glcFx === 'lance' ? 0.9 : 0.55;
  c.save();
  c.translate(pr.x, pr.y);
  c.rotate(Math.atan2(pr.vy, pr.vx));          // both sprites point RIGHT
  c.shadowColor = pr.glcFx === 'lance' ? '#d24bff' : '#a5d8ff'; c.shadowBlur = 12;
  c.drawImage(im, s[0], s[1], s[2], s[3], -s[2] * k * 0.5, -s[3] * k * 0.5, s[2] * k, s[3] * k);
  c.restore();
  return true;
}

// the authored void orb, pulsing
function drawGlcOrb(c, x, y, t) {
  const im = glcImg(); if (!im || !im.naturalWidth) return false;
  const s = GLC_P.orb, k = 1.5 + Math.sin(t * 6) * 0.18;
  c.save();
  c.translate(x, y);
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(0, 0, 1, 0, 0, 22);
  g.addColorStop(0, 'rgba(220,120,255,0.5)'); g.addColorStop(1, 'rgba(150,40,220,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 22, 0, 7); c.fill();
  c.restore();
  c.drawImage(im, s[0], s[1], s[2], s[3], -s[2] * k * 0.5, -s[3] * k * 0.5, s[2] * k, s[3] * k);
  c.restore();
  return true;
}

// the authored nova crystals, planted as an ice trail / nova burst piece
function drawGlcCrystal(c, x, y, sc, alpha) {
  const im = glcImg(); if (!im || !im.naturalWidth) return false;
  const s = GLC_P.novaCr;
  c.save();
  c.globalAlpha *= alpha == null ? 1 : alpha;
  c.translate(x, y);
  c.drawImage(im, s[0], s[1], s[2], s[3], -s[2] * sc * 0.5, -s[3] * sc, s[2] * sc, s[3] * sc);
  c.restore();
  return true;
}
