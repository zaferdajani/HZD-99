// THE LEDGER IS THE MEMORY, AND IT STAYS SHORT.
// Owner, 2026-11-17: "Why do you not remember what I told you and improve?"
// No session remembers the last. What carries over is CLAUDE.md, which every
// session is handed before anything else — and it had grown to 44 KB, where a
// rule he had given three times sat on line 228 of 619. It is now a table of
// what he has had to say more than once, in his words, with a count; the rest
// was moved, unedited, to skills and documents that load when the work touches
// them. This holds that arrangement, because a rules file grows back.
//   A  the ledger is the first thing in the file
//   B  every row has a count, his words, and something that holds it — and every
//      harness or skill a row names EXISTS (a guard that was renamed guards nothing)
//   C  the worst is first: rows are in order of how often he has had to say it
//   D  the correction procedure is there: fix, sweep, record, guard, report
//   E  the file is short enough to be read first, and the table short enough to be read
//   F  nothing was lost: every section that was moved is where the index says it is
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
const read = (f) => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return null; } };
const md = read('CLAUDE.md'), lines = md.split('\n');
const harnesses = new Set([...read('tests/run.cjs').matchAll(/^\s*\[\s*'([a-z0-9-]+)'\s*,/gm)].map(m => m[1]));
const skills = new Set(fs.readdirSync(path.join(ROOT, '.claude', 'skills')).filter(d => fs.existsSync(path.join(ROOT, '.claude', 'skills', d, 'SKILL.md'))));
console.log('── ledger  — what the owner has had to repeat is the first thing a session reads, and the rules file stays short');
const at = lines.findIndex(l => /^## THE LEDGER/.test(l)), firstH2 = lines.findIndex(l => /^## /.test(l));
check('A  the ledger is the first section of the rules file', at >= 0 && at === firstH2 && at <= 12, { line: at + 1 });
const end = lines.findIndex((l, i) => i > at && /^## /.test(l));
const rows = lines.slice(at, end).filter(l => /^\|\s*\d+×\s*\|/.test(l)).map(l => { const c = l.split('|').slice(1, -1).map(s => s.trim());
  return { n: parseInt(c[0], 10), rule: (c[1].match(/\*\*(.+?)\*\*/) || [])[1], quotes: (c[2].match(/"[^"]+"/g) || []), guards: [...c[3].matchAll(/`([^`]+)`/g)].map(m => m[1]), none: /no harness/.test(c[3]) }; });
check('B  every row has a count, a rule and his own words', rows.length >= 10 && rows.every(r => r.n >= 1 && r.rule && r.quotes.length >= 1), rows.length + ' rows');
const missing = []; for (const r of rows) { if (!r.guards.length && !r.none) missing.push(r.rule + ': nothing holds it'); for (const g of r.guards) if (!harnesses.has(g) && !skills.has(g)) missing.push(r.rule + ': `' + g + '` is not a harness or a skill'); }
check('   ...and everything a row says holds it exists', missing.length === 0, missing.slice(0, 4));
check('   ...at most one row is held by nothing but a check before reporting', rows.filter(r => r.none).length <= 1, rows.filter(r => r.none).map(r => r.rule));
check('C  the worst is first: rows in order of how often he has said it', rows.every((r, i) => i === 0 || r.n <= rows[i - 1].n), rows.map(r => r.n).join(' '));
const proc = lines.slice(at, end).join('\n');
check('D  the procedure for a correction is there: fix, sweep, record, guard, report', ['Fix what he pointed at', 'Sweep', 'Put it in this table', 'Give it a harness', 'Tell him what the sweep found'].every(s => proc.includes(s)));
check('E  the rules file is short enough to be read first (at most 160 lines, 12 KB)', lines.length <= 160 && Buffer.byteLength(md) <= 12000, { lines: lines.length, bytes: Buffer.byteLength(md) });
check('   ...and the table short enough to be read (at most 20 rows)', rows.length <= 20, rows.length);
const moved = [['docs/OWNER_ORDERS.md', ['NO BACKLOG RECITALS', 'NO LIGHT ROUND A BODY', 'ART IS HIGGSFIELD', 'THE STUDIO IS VIBESOLUTIONS', 'THE LIVE LINK', 'A CORRECTION IS A RULE']],
  ['docs/SESSION_FLEET.md', ['ONE BRANCH', 'THE SESSION FLEET', 'KINGDOMS ARE THE UNIT']],
  ['.claude/skills/terrain-doors/SKILL.md', ['NO RIGHT ANGLES', 'THE ROOF LAW', 'MACHINE RING']],
  ['.claude/skills/platform-delivery/SKILL.md', ['RULE ZERO', 'RULE ONE']],
  ['.claude/skills/engine-map/SKILL.md', ['## Architecture', '## Audio', 'How the build works', 'gravehorn.js']]];
const lost = []; for (const [f, keys] of moved) { const t = read(f); if (!t) { lost.push(f + ' is missing'); continue; } for (const k of keys) if (!t.includes(k)) lost.push(f + ' has lost "' + k + '"'); if (!md.includes(f.replace('.claude/skills/', '').replace('/SKILL.md', '')) && !md.includes(f)) lost.push('the index does not point to ' + f); }
check('F  nothing was lost: every moved section is where the index says', lost.length === 0, lost.slice(0, 4));
const idx = [...md.slice(md.indexOf('## Where the rest is')).matchAll(/skills? ((?:`[a-z-]+`[, ]*)+)/g)].flatMap(m => [...m[1].matchAll(/`([a-z-]+)`/g)].map(q => q[1]));
check('   ...and every skill the index names exists', idx.length >= 6 && idx.every(s => skills.has(s)), idx.filter(s => !skills.has(s)));
if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
console.log('\nOK — the ledger is first, guarded and short, and what was moved is all there');
