// ===========================================================================
// ONE THING ON SCREEN AT A TIME — the overlay queue, the dialogue reader, and
// the story notes (owner, 2026-10-09):
//   "Do not overlap dialogue, item cards, shop windows, tutorials, quest offers
//    and cinematics. Queue them deliberately. Important instructions must
//    remain available until acknowledged or completed."
//
// THE QUEUE. Anything that takes the screen — a dialogue, an item card, the
// shop, a guardian's offer, a film, the repair panel, a trial — is an overlay.
// When one is asked for while another is open, it waits in OVERLAY_Q and opens
// when the screen is free again (G.state back to PLAY), in the order asked.
//   overlayRequest(openFn, kind)  open now if the screen is free, else queue
//   overlayBusy()                 something is open, or already waiting
//   dialogOpen(d)                 open a dialogue object through the queue
//   storyNote(text, key)          a blocking narrator card (no speaker)
// Existing call sites keep their signatures: showItem() queues by itself, and
// assigning G.dialog while another dialogue is mid-read queues the new one
// (the accessor installed below) instead of overwriting it.
//
// THE READER. A dialogue line is wrapped to the box and cut into pages of at
// most DLG_LINES lines (js/reveal.js paginate); each page types itself out at
// the player's text speed. The first confirm shows the page; only a SEPARATE
// later confirm turns it — never the same press, never within DLG_DWELL of the
// page completing, never a press that follows the last one by less than
// DLG_GAP (a mash), and nothing at all in the first DLG_GRACE of a new page.
// So attack-mashing through a fight that ends in a conversation cannot throw
// the conversation away unread.
//
// While any of this is open the world is frozen: update() simulates entities
// only in PLAY, and every overlay here is a non-PLAY state.
// ===========================================================================
const OVERLAY_Q = [];
const OVERLAY_STATES = { DIALOG: 1, SHOP: 1, OFFER: 1, CUT: 1, CINE: 1, REPAIR: 1, TRIAL: 1 };
// a card raised FROM one of these menus (a purchase, a learned skill) is shown
// in place of the menu and hands back to it when read
const CARD_RETURN = { SHOP: 1, SKILLS: 1, CREST: 1, BAG: 1, RELICS: 1, PAUSE: 1, MAP: 1, BRAID: 1 };
// Another workstream's full-screen reader (js/panels.js, a DOM overlay...)
// joins the rule by pushing a function that answers "am I open?" here, and
// opens itself through overlayRequest(fn, 'panels') — or, if it runs as a
// G.state of its own, by adding that state: OVERLAY_STATES.PANELS = 1.
const OVERLAY_BUSY_HOOKS = [];
function overlayOpenNow() {
  if (typeof G === 'undefined') return false;
  if (G.dialog || G.cut || OVERLAY_STATES[G.state]) return true;
  if (typeof ComicRewards !== 'undefined' && ComicRewards && ComicRewards.active) return true;
  for (const h of OVERLAY_BUSY_HOOKS) { try { if (h()) return true; } catch (e) {} }
  return false;
}
function overlayBusy() { return overlayOpenNow() || OVERLAY_Q.length > 0; }
function overlayRequest(open, kind) {
  if (overlayBusy()) { OVERLAY_Q.push({ open, kind: kind || 'overlay' }); return false; }
  open();
  return true;
}
// Called at the top of update(): the next waiting overlay opens on the first
// free PLAY frame — never mid-crossing, never over another.
function overlayPump() {
  // AN ORPHANED CARD IS SHOWN, NOT LOST. Something that switched the state
  // straight to PLAY over an open dialogue (a film started from inside one,
  // say) would leave it invisible, the queue stuck behind it and the tutorial
  // hidden by it — so it comes back on screen to be read and closed.
  if (G.state === 'PLAY' && G.dialog && !G.cut && G.dialog.lines && (G.dialog.i | 0) < G.dialog.lines.length) {
    G.state = 'DIALOG'; return;
  }
  if (!OVERLAY_Q.length || G.state !== 'PLAY' || overlayOpenNow() || G.trans) return;
  const n = OVERLAY_Q.shift();
  try { n.open(); } catch (e) { if (typeof console !== 'undefined') console.error(e); }
}
function overlayClear() { OVERLAY_Q.length = 0; }
function dialogOpen(d) {
  return overlayRequest(() => { G.dialog = d; G.state = 'DIALOG'; }, 'dialog');
}
// THE ACCESSOR. Two dozen call sites open a dialogue by assignment. Replacing a
// conversation the player is still reading is the overlap the owner ruled out,
// so a NEW dialogue assigned over an open one waits its turn instead.
(function installDialogGuard() {
  if (typeof G === 'undefined') return;
  const desc = Object.getOwnPropertyDescriptor(G, 'dialog');
  if (desc && desc.get) return;
  let cur = G.dialog;
  Object.defineProperty(G, 'dialog', {
    configurable: true, enumerable: true,
    get() { return cur; },
    set(v) {
      if (v && cur && v !== cur && G.state === 'DIALOG') {
        const next = v;
        OVERLAY_Q.push({ kind: 'dialog', open: () => { G.dialog = next; G.state = 'DIALOG'; } });
        return;
      }
      cur = v;
    },
  });
})();
// ---- the reader -----------------------------------------------------------
const DLG_GRACE = 0.15;   // a new page ignores every press this long
const DLG_DWELL = 0.25;   // a complete page must have been visible this long
const DLG_GAP = 0.22;     // a press this soon after the last one is a mash
const DLG_LINES = 4;      // lines per page
const DLG_W = 548, DLG_NOTE_W = 660;
function dlgFont(d) { return '600 ' + (d.rs ? 15 : 16) + 'px "Segoe UI", Tahoma, sans-serif'; }
function dlgLineText(d) {
  const s = d.lines[d.i];
  return Array.isArray(s) ? s.join(' ') : String(s == null ? '' : s);
}
function dlgPages(d) {
  const L = typeof LANG !== 'undefined' ? LANG : 'en';
  const txt = dlgLineText(d);
  const key = d.i + '|' + L + '|' + txt;
  if (d._pk !== key) {
    d._pk = key;
    d._pages = paginate(c, txt, d.note ? DLG_NOTE_W : DLG_W, DLG_LINES, dlgFont(d));
    if (!(d.pg >= 0) || d.pg >= d._pages.length) d.pg = 0;
    d._rv = null;
  }
  return d._pages;
}
function dlgReveal(d) {
  const pages = dlgPages(d);
  if (!d._rv) { d._rv = revealStart(pages[d.pg] || [''], {}); d._age = 0; }
  return d._rv;
}
function dialogClose(d) {
  const cb = d.onEnd;
  G.dialog = null;
  G.state = (d.ret && CARD_RETURN[d.ret]) ? d.ret : 'PLAY';
  if (typeof npcHush === 'function') npcHush();                 // cut the line short with the box
  if (d.ackKey && G.save) { (G.save.ackd || (G.save.ackd = {}))[d.ackKey] = 1; if (typeof persist === 'function') persist(); }
  // ...and what was asked for first is shown first: a card that arrived while
  // this was open goes before this conversation's own continuation
  if (cb) { if (OVERLAY_Q.length) OVERLAY_Q.push({ kind: 'cont', open: cb }); else cb(); }
  // and the next in line opens now, not a frame later: no gap for a stray
  // input to land in, and no frame of the world running between two cards
  if (G.state === 'PLAY') overlayPump();
}
function dialogAdvance(d) {
  const pages = dlgPages(d);
  d._rv = null;
  if (d.pg + 1 < pages.length) { d.pg++; if (typeof sfx === 'function') sfx('ui'); return; }
  d.pg = 0;
  d.i++;
  if (d.i >= d.lines.length) { dialogClose(d); return; }
  if (d.npc && typeof npcSay === 'function') npcSay(d.npc, d.i);
  else if (typeof sfx === 'function') sfx('ui');
}
function dialogUpdate(dt) {
  const d = G.dialog;
  if (!d) { G.state = 'PLAY'; return; }
  if (!d.lines || !d.lines.length) { d.i = 0; d.lines = d.lines || []; dialogClose(d); return; }
  if (!(d.i >= 0)) d.i = 0;
  if (d.i >= d.lines.length) { dialogClose(d); return; }
  const R = dlgReveal(d);
  revealTick(R, dt);
  d._age += dt;
  G.dlgClock = (G.dlgClock || 0) + dt;
  if (!(inP('OK') || inP('INT') || inP('ATK'))) return;
  const gap = G.dlgClock - (G.dlgLast == null ? -1e9 : G.dlgLast);
  G.dlgLast = G.dlgClock;
  if (d._age < DLG_GRACE) return;                     // the page just arrived
  if (!revealDone(R)) { revealSkip(R); return; }      // first press: show it all
  if (revealSince(R) < DLG_DWELL || gap < DLG_GAP) return;
  dialogAdvance(d);
}
// what the box draws: the current page, typed so far, and whether to prompt
function dialogView(d) {
  const pages = dlgPages(d), R = dlgReveal(d);
  return { pages, page: pages[d.pg] || [''], R, more: d.pg + 1 < pages.length || d.i + 1 < d.lines.length,
           done: revealDone(R) };
}
// ---- story notes ------------------------------------------------------------
// Story-critical lines used to be three-second toasts — the sentence that tells
// her where the sword comes from, or that the lion just let go, gone before a
// slow reader reached its end. They are cards now. 'always' lines are events
// (they happen once); 'once' lines are instructions repeated at a locked door:
// the first is a card she must acknowledge, every later reminder a toast.
// 'scene' lines narrate a staged moment that deliberately never takes her
// controls (the guardian's break: tests/guardian-break.cjs, the audit's rule
// about a silent hero's agency). They are not cards; they are captions that
// stay on screen until they have been read, and the scene waits for them
// (sceneCaptionRead, polled by the scene's own step).
const STORY_NOTE_KEYS = {
  nf_break1: 'scene', nf_break2: 'scene', nf_break1_road: 'scene', npc_woke: 'always',
  gh_marble: 'once', gh_sage: 'once', gh_chime: 'once', sage_need_forge: 'once',
  story_need_blade: 'once', gate_conduits: 'once', q_taken: 'once',
};
function storyNoteKey(text) {
  if (typeof t !== 'function' || typeof text !== 'string') return null;
  for (const k in STORY_NOTE_KEYS) {
    const v = t(k);
    if (typeof v !== 'string' || !v || v === k) continue;
    const at = v.indexOf('%s');
    if (at >= 0) {
      const a = v.slice(0, at), b = v.slice(at + 2);
      if (text.length > a.length + b.length && text.startsWith(a) && text.endsWith(b)) return k;
    } else if (text === v) return k;
  }
  return null;
}
// G.toast's gate: true when the text was taken as a note instead
function storyToast(text) {
  const k = storyNoteKey(text);
  if (!k || typeof G === 'undefined' || !G.save) return false;
  if (STORY_NOTE_KEYS[k] === 'once' && G.save.ackd && G.save.ackd[k]) return false;
  if (STORY_NOTE_KEYS[k] === 'scene') { sceneCaption(text); return true; }
  storyNote(text, k);
  return true;
}
// ---- scene captions -------------------------------------------------------
// Typed, wrapped, paged like every caption, and held on screen until read
// (each page its reading time after it is whole), then a soft second to fade.
// A scene keeps its own pace: it waits only until its line has been TYPED
// out (sceneCaptionShown) — the reading happens while the caption stays up,
// and a second line arriving meanwhile is stacked under the first rather than
// replacing it unread.
function sceneCaption(text) {
  const cr = capReader(text); cr.fade = 0;
  (G.sceneCaps || (G.sceneCaps = [])).push(cr);
  while (G.sceneCaps.length > 3) G.sceneCaps.shift();          // never a wall of text
}
function sceneCaptionShown() {
  return !(G.sceneCaps || []).some(cr => !(cr.pg + 1 >= cr.pages.length && revealDone(cr.R)));
}
function sceneCaptionRead() { return !(G.sceneCaps || []).some(cr => !capRead(cr)); }
function sceneCaptionTick(dt) {
  const L = G.sceneCaps;
  if (!L || !L.length) return;
  for (const cr of L) {
    capTick(cr, dt); capAutoTurn(cr);
    if (capRead(cr)) cr.fade += dt;
  }
  G.sceneCaps = L.filter(cr => cr.fade <= 1.2);
}
function drawSceneCaption() {
  const L = G.sceneCaps;
  if (!L || !L.length || G.state !== 'PLAY') return;
  let y = 168;
  for (const cr of L) {
    const n = (cr.pages[cr.pg] || []).length || 1;
    y += (n - 1) * CAP_LH / 2;
    drawCaption(cr, Math.min(1, cr.R.t / 0.4) * Math.max(0, 1 - Math.max(0, cr.fade - 0.4) / 0.8), y);
    y += (n - 1) * CAP_LH / 2 + CAP_LH + 18;
  }
}
function storyNote(text, key) {
  const d = { name: '', lines: [text], i: 0, onEnd: null, note: true, ackKey: key || null };
  overlayRequest(() => { G.dialog = d; G.state = 'DIALOG'; if (typeof sfx === 'function') sfx('ui'); }, 'note');
  return d;
}
// ---- toasts inside menus ----------------------------------------------------
// "Not enough scrap" said while the shop was open went to a toast the shop is
// drawn over — the refusal was invisible exactly where it mattered.
const MENU_MSG_STATES = { SHOP: 1, SKILLS: 1, CREST: 1, BAG: 1, RELICS: 1, TRIAL: 1 };
function menuMsgSet(text) { if (MENU_MSG_STATES[G.state]) G.menuMsg = { text, t: Math.max(2.6, toastLife(text) - 0.4), st: G.state }; }
function menuMsgTick(dt) { if (G.menuMsg && (G.menuMsg.t -= dt) <= 0) G.menuMsg = null; }
function drawMenuMsg() {
  const m = G.menuMsg;
  if (!m || m.st !== G.state) return;
  const a = Math.min(1, m.t * 2.5);
  c.save();
  c.globalAlpha = a;
  const lines = wrapLines(c, m.text, 640, '700 15px "Segoe UI", Tahoma, sans-serif');
  const h = 16 + lines.length * 20, y = 514 - h / 2 - (lines.length - 1) * 4;
  let w = 0; for (const l of lines) w = Math.max(w, c.measureText(l).width);
  w = Math.min(700, w + 40);
  c.fillStyle = 'rgba(40,14,12,0.94)'; rr(c, 480 - w / 2, y - h / 2, w, h, 8); c.fill();
  c.strokeStyle = 'rgba(255,150,110,0.8)'; c.lineWidth = 1.5; rr(c, 480 - w / 2, y - h / 2, w, h, 8); c.stroke();
  lines.forEach((l, i) => ftxt(l, 480, y - (lines.length - 1) * 10 + i * 20, 15, '#ffe2d6', 'center'));
  c.restore();
}
// a toast lives long enough to be read: three seconds, or more for a long one
function toastLife(text) {
  const n = typeof graphemes === 'function' ? graphemes(text).length : String(text).length;
  return Math.max(3, 1.6 + n * 0.055);
}
// ---- options ----------------------------------------------------------------
function textSpeedCycle(d) {
  const o = textOptsObj(); if (!o) return;
  const i = TEXT_SPEEDS.indexOf(textSpeedId()), n = TEXT_SPEEDS.length;
  o.textSpeed = TEXT_SPEEDS[(((i + (d || 1)) % n) + n) % n];
}
function reduceMotionToggle() {
  const o = textOptsObj(); if (!o) return;
  o.reduceMotion = !reduceMotion();
}
// ---- captions (the opening film, its held stills, and any other reel) -------
// A caption used to be ONE line at any length — a long sentence ran off both
// edges of the frame, and Chinese, which has no spaces, never wrapped at all.
// It is wrapped to the frame now, paged at three lines, and typed out; a
// reader object carries all of that so the film and the stills share it.
const CAP_FONT = '600 17px "Segoe UI", Tahoma, sans-serif';
const CAP_W = 820, CAP_LINES = 3, CAP_LH = 23;
function capReader(text) {
  const pages = paginate(c, String(text || ''), CAP_W, CAP_LINES, CAP_FONT);
  return { text: String(text || ''), pages, pg: 0, R: revealStart(pages[0], {}), last: -1e9, clock: 0 };
}
function capTick(cr, dt) { if (!cr) return; cr.clock += dt; revealTick(cr.R, dt); }
// Spend a press on the caption: reveal the page, or turn to the next one.
// Returns false when the caption is finished with and the press belongs to the
// reel (next shot). A mash (two presses inside DLG_GAP) never gets that far.
function capPress(cr) {
  if (!cr) return false;
  const gap = cr.clock - cr.last; cr.last = cr.clock;
  if (cr.R.t < DLG_GRACE) return true;
  if (!revealDone(cr.R)) { revealSkip(cr.R); return true; }
  if (revealSince(cr.R) < DLG_DWELL || gap < DLG_GAP) return true;
  if (cr.pg + 1 < cr.pages.length) { cr.pg++; cr.R = revealStart(cr.pages[cr.pg], {}); return true; }
  return false;
}
// has the reader had the whole caption, and long enough to read the last page?
function capRead(cr) {
  if (!cr) return true;
  return cr.pg + 1 >= cr.pages.length && revealDone(cr.R) &&
    revealSince(cr.R) >= readingTime(cr.pages[cr.pg].join(' '));
}
// a film does not wait for a press between its own pages: a page that has been
// on screen for its reading time turns by itself (the LAST one never leaves
// until capRead is true — see updateCut)
function capAutoTurn(cr) {
  if (cr && cr.pg + 1 < cr.pages.length && revealDone(cr.R) &&
      revealSince(cr.R) >= readingTime(cr.pages[cr.pg].join(' '))) {
    cr.pg++; cr.R = revealStart(cr.pages[cr.pg], {});
  }
}
function drawCaption(cr, alpha, yBase) {
  if (!cr || alpha <= 0.01) return;
  const lines = cr.pages[cr.pg] || [];
  c.save();
  c.globalAlpha = alpha;
  c.font = CAP_FONT;
  let w = 0; for (const l of lines) w = Math.max(w, c.measureText(l).width);
  const n = Math.max(1, lines.length), h = 44 + n * CAP_LH;
  const yMid = (yBase || 470) - (n - 1) * CAP_LH / 2, top = yMid - h / 2;
  const w2 = Math.min(900, w + 40);
  const g2 = c.createLinearGradient(0, top, 0, top + h);
  g2.addColorStop(0, 'rgba(4,8,12,0)'); g2.addColorStop(0.5, 'rgba(4,8,12,0.74)');
  g2.addColorStop(1, 'rgba(4,8,12,0)');
  c.fillStyle = g2; c.fillRect(480 - w2 / 2 - 30, top, w2 + 60, h);
  const y0 = yMid - (n - 1) * CAP_LH / 2;
  drawRevealLines(c, cr.R, 480, y0, CAP_LH, 'center',
    (str, x, y, al) => ftxt(str, x, y, 17, '#eaf4ff', al, 'rgba(0,0,0,0.85)', '600'));
  c.restore();
  c.globalAlpha = 1;
}
