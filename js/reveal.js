// ===========================================================================
// THE REVEAL ENGINE — words arrive at a reading pace, and never leave unread.
//
// The owner's order (2026-10-09): dialogue and captions appear letter by
// letter at a comfortable, configurable speed; the first confirm shows the
// whole page at once, and only a SEPARATE later confirm moves on; long speeches
// are broken into short pages; there is an instant-text and a reduced-motion
// option; Arabic shapes and reads right to left; Chinese wraps inside the box.
//
// One engine for every reader: the dialogue box and item cards (js/overlay.js),
// the opening's captions (drawCine / drawCut in js/game.js) and the manhwa
// panels (js/panels.js). None of them owns a typewriter of its own.
//
// ---- API --------------------------------------------------------------------
//   textSpeedId()                  'slow' | 'normal' | 'fast' | 'instant'
//   textCps()                      graphemes per second (Infinity = instant)
//   reduceMotion()                 the player's choice, else prefers-reduced-motion
//
//   wrapLines(ctx, text, width, font)        -> [line, ...]   honours '\n';
//        breaks at spaces, and between any two CJK characters (never before
//        closing punctuation), so zh/ja wrap inside the box
//   paginate(ctx, text, width, maxLines, font) -> [[line, ...], ...]  pages
//
//   R = revealStart(textOrLines, opts)       opts: { cps, lang, instant }
//        a string or an array of already-wrapped lines (one page). Arabic is
//        revealed WHOLE WORDS at a time so letters never break their joining;
//        everything else by grapheme (Intl.Segmenter, so emoji and combining
//        marks are never split).
//   revealTick(R, dt)              advance by dt seconds
//   revealDone(R)                  everything visible?
//   revealSkip(R)                  show it all now (the first confirm)
//   revealLines(R)                 the visible part of each line, same count
//   revealText(R)                  the visible part as one string
//
//   drawRevealLines(ctx, R, x, y, lh, align, drawFn)
//        draws the visible text without reflow: centred/RTL lines are anchored
//        where the FULL line will sit, so words never slide while typing.
//        drawFn(str, x, y, align) does the actual fillText (ftxt, usually).
// ===========================================================================
const TEXT_SPEEDS = ['slow', 'normal', 'fast', 'instant'];
const TEXT_CPS = { slow: 22, normal: 45, fast: 95, instant: Infinity };
function textOptsObj() {
  if (typeof G === 'undefined' || !G || !G.save) return null;
  return G.save.opts || (G.save.opts = {});
}
function textSpeedId() {
  const o = textOptsObj();
  const id = o && o.textSpeed;
  return TEXT_SPEEDS.indexOf(id) >= 0 ? id : 'normal';
}
let RV_RM = null;
function reduceMotionOS() {
  if (RV_RM === null) {
    try { RV_RM = (typeof matchMedia === 'function') ? matchMedia('(prefers-reduced-motion: reduce)') : false; }
    catch (e) { RV_RM = false; }
  }
  return !!(RV_RM && RV_RM.matches);
}
// An explicit choice wins either way; until one is made the OS setting decides.
function reduceMotion() {
  const o = textOptsObj();
  if (o && o.reduceMotion != null) return !!o.reduceMotion;
  return reduceMotionOS();
}
function textCps() {
  if (reduceMotion()) return Infinity;
  return TEXT_CPS[textSpeedId()];
}
function textLang() { return typeof LANG !== 'undefined' ? LANG : 'en'; }
function textRTL(lang) {
  const l = lang || textLang();
  if (typeof LANGS !== 'undefined' && LANGS.find) { const e = LANGS.find(x => x.id === l); if (e) return !!e.rtl; }
  return l === 'ar' || l === 'he' || l === 'fa';
}
// ---- segmentation ---------------------------------------------------------
let RV_SEG = null;
function graphemes(str) {
  str = String(str == null ? '' : str);
  if (RV_SEG === null) {
    try { RV_SEG = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : false; }
    catch (e) { RV_SEG = false; }
  }
  if (RV_SEG) { const out = []; for (const s of RV_SEG.segment(str)) out.push(s.segment); return out; }
  return Array.from(str);
}
// CJK ideographs, kana, hangul, fullwidth forms and CJK punctuation: a line
// may break on either side of any of them.
function isCJK(ch) {
  const cp = ch.codePointAt(0);
  return (cp >= 0x2E80 && cp <= 0x9FFF) || (cp >= 0xAC00 && cp <= 0xD7AF) ||
         (cp >= 0xF900 && cp <= 0xFAFF) || (cp >= 0xFE30 && cp <= 0xFE4F) ||
         (cp >= 0xFF00 && cp <= 0xFFEF) || (cp >= 0x20000 && cp <= 0x2FFFF);
}
// never at the start of a line (kinsoku): closing marks and small kana
const RV_NOSTART = '，。、；：！？）」』】》〉…—～·．,.;:!?)]}%’”';
// Break units: a unit is the smallest piece a line may not be broken inside.
// A Latin/Arabic word carries its trailing space; each CJK character is its own
// unit, with any closing punctuation that follows glued onto it.
function breakUnits(str) {
  const g = graphemes(str), units = [];
  let cur = '', curCJK = false;
  const flush = () => { if (cur) units.push(cur); cur = ''; curCJK = false; };
  for (const ch of g) {
    if (ch === '\n') { flush(); units.push('\n'); continue; }
    if (RV_NOSTART.indexOf(ch) >= 0 && cur) { cur += ch; continue; }
    if (isCJK(ch)) { flush(); cur = ch; curCJK = true; continue; }
    if (ch === ' ') { cur += ch; flush(); continue; }
    if (curCJK) flush();
    cur += ch;
  }
  flush();
  return units;
}
function wrapLines(ctx, text, width, font) {
  if (font) ctx.font = font;
  const units = breakUnits(String(text == null ? '' : text)), lines = [];
  let line = '';
  const fits = s => ctx.measureText(s.replace(/\s+$/, '')).width <= width;
  for (const u of units) {
    if (u === '\n') { lines.push(line.replace(/\s+$/, '')); line = ''; continue; }
    const test = line + u;
    if (!line || fits(test)) {
      // a single unit wider than the whole box (a long name, a URL) is cut by
      // grapheme rather than pushed off the edge
      if (!line && !fits(u)) {
        let part = '';
        for (const ch of graphemes(u)) {
          if (part && !fits(part + ch)) { lines.push(part); part = ''; }
          part += ch;
        }
        line = part;
      } else line = test;
    } else { lines.push(line.replace(/\s+$/, '')); line = u.replace(/^\s+/, ''); }
  }
  if (line.replace(/\s+$/, '') || !lines.length) lines.push(line.replace(/\s+$/, ''));
  return lines;
}
function paginate(ctx, text, width, maxLines, font) {
  const lines = wrapLines(ctx, text, width, font), pages = [], max = Math.max(1, maxLines | 0);
  // balanced, so a speech never ends on a page holding one stray line: five
  // lines at four a page read as three and two, not four and one
  const nPages = Math.ceil(lines.length / max), n = Math.ceil(lines.length / Math.max(1, nPages));
  for (let i = 0; i < lines.length; i += n) pages.push(lines.slice(i, i + n));
  return pages.length ? pages : [['']];
}
// ---- the reveal -----------------------------------------------------------
// Each line is a list of reveal units with a weight in graphemes, so the pace
// is the same whether the units are letters or whole Arabic words.
function revealUnits(line, rtl) {
  if (!rtl) return graphemes(line).map(s => ({ s, w: 1 }));
  const out = [], parts = String(line).split(/(\s+)/);
  for (const p of parts) if (p) out.push({ s: p, w: /^\s+$/.test(p) ? 0 : graphemes(p).length });
  return out;
}
function revealStart(textOrLines, opts) {
  opts = opts || {};
  const lines = Array.isArray(textOrLines) ? textOrLines.map(String) : [String(textOrLines == null ? '' : textOrLines)];
  const lang = opts.lang || textLang();
  const rtl = opts.rtl != null ? !!opts.rtl : textRTL(lang);
  const units = lines.map(l => revealUnits(l, rtl));
  let total = 0;
  for (const u of units) for (const x of u) total += x.w;
  // CJK carries more per character; the same setting reads at a similar pace
  const cjk = /^(zh|ja|ko)/.test(lang) ? 0.55 : 1;
  const cps = opts.instant ? Infinity : (opts.cps != null ? opts.cps : textCps()) * cjk;
  const R = { lines, units, total, shown: 0, cps, rtl, lang, doneAt: -1, t: 0 };
  if (!(cps < Infinity) || total === 0) { R.shown = total; R.doneAt = 0; }
  return R;
}
function revealTick(R, dt) {
  if (!R) return;
  R.t += dt;
  if (R.shown < R.total) {
    R.shown = Math.min(R.total, R.shown + R.cps * dt);
    if (R.shown >= R.total && R.doneAt < 0) R.doneAt = R.t;
  }
}
function revealDone(R) { return !R || R.shown >= R.total; }
function revealSkip(R) { if (R && R.shown < R.total) { R.shown = R.total; R.doneAt = R.t; } }
// seconds since the whole page became visible (-1 while still typing)
function revealSince(R) { return !R ? 1e9 : (R.shown >= R.total ? R.t - Math.max(0, R.doneAt) : -1); }
function revealLines(R) {
  if (!R) return [];
  let left = R.shown;
  return R.units.map(us => {
    let s = '';
    for (const u of us) {
      if (left <= 1e-6) break;
      if (u.w === 0) { s += u.s; continue; }
      // a unit appears whole or not at all: a grapheme, or an Arabic word
      if (left >= u.w - 1e-6) { s += u.s; left -= u.w; } else { left = 0; break; }
    }
    return s.replace(/\s+$/, '');
  });
}
function revealText(R) { return revealLines(R).join('\n'); }
function drawRevealLines(ctx, R, x, y, lh, align, drawFn) {
  const vis = revealLines(R);
  R.lines.forEach((full, i) => {
    const s = vis[i];
    if (!s) return;
    let ax = x, al = align || 'left';
    if (al === 'center') {
      // anchor at where the finished line starts, so typing never re-centres
      const w = ctx.measureText(full).width;
      if (R.rtl) { ax = x + w / 2; al = 'right'; } else { ax = x - w / 2; al = 'left'; }
    }
    drawFn(s, ax, y + i * lh, al);
  });
}
// reading time a caption deserves before anything may take it away: generous,
// because the reader we are protecting is the slow one
function readingTime(text) {
  const n = graphemes(text).length;
  return 2 + n * 0.06;
}
