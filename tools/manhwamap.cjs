// tools/manhwamap.cjs — write "## The map" of docs/MANHWA_EVENT_MAP.md from
// PANEL_SEQ itself (js/panels.js) and the captions (js/text-manhwa.js), so the
// document for people cannot drift from the runtime map.   node tools/manhwamap.cjs
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const ctx = { TEXT_LAYERS: [], G: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/text-manhwa.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/panels.js'), 'utf8') + '\nthis.PANEL_SEQ = PANEL_SEQ;', ctx);
const L = ctx.TEXT_LAYERS.find(l => l.en && l.en.pn_menu).en;
let md = '## The map\n\n';
for (const s of ctx.PANEL_SEQ) {
  md += '### ' + s.id + ' — ' + (L[s.title] || s.title) + '\n\n';
  md += '- **Event / trigger:** ' + s.event + '. Plays in room `' + s.room + '`' + (s.alsoRoom ? ' (or `' + s.alsoRoom + '`)' : '') + ' at the first safe moment.\n';
  md += '- **Completion flag:** `G.save.panels.seen.' + s.id + '` (set when it starts; `past.' + s.id + '` if the save had already passed the event).\n\n';
  md += '| # | Source asset | Crop [x, y, w, h] | Caption key | Caption (en) |\n|---|---|---|---|---|\n';
  s.panels.forEach((p, i) => {
    const src = p.src ? '`' + p.src + '` (' + p.ref + ')' : p.ref;
    const crop = p.crop ? '[' + p.crop.join(', ') + ']' : '—';
    const cap = p.cap ? '`' + p.cap + '`' + (p.who ? ' (' + p.who + ')' : '') + (p.cond ? ' · conditional' : '') : '— (silent)';
    md += '| ' + (i + 1) + ' | ' + src + ' | ' + crop + ' | ' + cap + ' | ' + (p.cap ? (L[p.cap] || '').replace(/\|/g, '\\|') : '') + ' |\n';
  });
  md += '\n';
}
const f = path.join(root, 'docs/MANHWA_EVENT_MAP.md');
let doc = fs.readFileSync(f, 'utf8');
const a = doc.indexOf('## The map'), b = doc.indexOf('\n## ', a + 5);
doc = doc.slice(0, a) + md.trimEnd() + '\n' + doc.slice(b);
fs.writeFileSync(f, doc);
console.log('wrote', ctx.PANEL_SEQ.length, 'sequences');
