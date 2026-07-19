// NOSTOS — the Old Tongue: real Greek lettering, carved-stone rendering.
// Ambient Greek text appears on votive tablets, friezes, the title and HUD so
// the world reads as lived-in Greek. Every line is short, meaningful, and
// composed for this game from ancient (public-domain) vocabulary; a
// translation always appears beneath it in-game.
const RS_LEX = {
  // transliterated Homeric vocabulary used across the game's writing
  nostos: 'homecoming', thalassa: 'sea', xenos: 'stranger/guest', kleos: 'glory',
  metis: 'cunning wisdom', oikos: 'home/household', kyma: 'wave', anemos: 'wind',
  psyche: 'soul/shade', moly: 'the herb of Hermes', xiphos: 'sword',
  aspis: 'shield', obolos: 'obol (small coin)', ichor: 'blood of the gods',
};
// The three votive tablets (real Greek; translations shown below them in-game)
const RS_TERM = {
  1: 'Η ΒΑΘΕΙΑ ΠΥΛΗ ΚΕΚΛΕΙΣΤΑΙ · ΜΗ ΑΜΕΙΒΕΟ ΤΗΝ ΑΟΙΔΗΝ',
  2: 'ΤΟ ΑΝΘΟΣ ΟΥ ΚΤΕΙΝΕΙ · ΛΗΘΗΝ ΝΟΣΤΟΥ ΦΕΡΕΙ',
  3: 'Η ΠΤΕΡΟΕΣΣΑ ΑΟΙΔΟΣ ΕΚΛΕΨΕ ΔΩΡΟΝ ΘΕΩΝ',
};
const RS_TITLE = 'ΝΟΣΤΟΣ ΟΔΥΣΣΗΟΣ';   // "the homecoming of Odysseus"

// Greek names for zones and bosses — carved beneath their Latin/Arabic names
const GREEK_Z = { A: 'ΑΚΤΑΙ', B: 'ΚΥΚΛΩΨ', C: 'ΑΙΑΙΑ', D: 'ΑΙΔΗΣ', E: 'ΙΘΑΚΗ', X: 'ΣΕΙΡΗΝΕΣ' };
const GREEK_B = { glitch: 'ΧΑΡΥΒΔΙΣ', atlas: 'ΠΟΛΥΦΗΜΟΣ', zero: 'ΚΙΡΚΗ', brood: 'ΣΚΥΛΛΑ', prism: 'ΣΕΙΡΗΝ', mother: 'ΑΝΤΙΝΟΟΣ' };
const GREEK_ALPHA = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ'];
// Greek acrophonic-style numerals for small HUD flourishes (1-20 is plenty)
function greekNum(n) {
  const ones = ['', 'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ϛ', 'Ζ', 'Η', 'Θ'];
  const tens = ['', 'Ι', 'Κ', 'Λ'];
  if (n <= 0 || n > 39) return String(n);
  return tens[Math.floor(n / 10)] + ones[n % 10];
}

// carved-stone Greek text: chisel shadow above, lit face below, faint gilding
function drawGlyphText(c, str, x, y, size, color, glow) {
  c.save();
  c.font = '700 ' + size * 1.35 + 'px Georgia, "Times New Roman", serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // recessed shadow (the chisel cut)
  c.fillStyle = 'rgba(0,0,0,0.55)';
  c.fillText(str, x, y + Math.max(1, size * 0.09));
  // lit face
  if (glow) { c.shadowColor = glow; c.shadowBlur = 10; }
  c.fillStyle = color;
  c.fillText(str, x, y);
  c.restore();
}

// meander (Greek key) frieze — the border pattern of the whole game's UI
function drawMeander(c, x0, y, w, size, color, alpha) {
  const s = size || 8;
  c.save();
  c.globalAlpha = alpha == null ? 0.5 : alpha;
  c.strokeStyle = color; c.lineWidth = Math.max(1, s * 0.16); c.lineJoin = 'miter';
  const step = s * 2;
  c.beginPath();
  for (let x = x0; x + step <= x0 + w; x += step) {
    // one meander unit: an interlocking hook
    c.moveTo(x, y + s);
    c.lineTo(x, y);
    c.lineTo(x + step * 0.75, y);
    c.lineTo(x + step * 0.75, y + s * 0.6);
    c.lineTo(x + step * 0.3, y + s * 0.6);
    c.lineTo(x + step * 0.3, y + s * 0.28);
    c.lineTo(x + step * 0.55, y + s * 0.28);
  }
  c.stroke();
  c.restore();
}
