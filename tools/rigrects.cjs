// Read a guardian's rect table out of its own source file.
//
// Never a hand-copied list. The rects ARE the rig, and a copy that drifts from
// the source by one number dislocates the boss in a way nothing downstream can
// detect — so the table is parsed from the file the game itself reads.
//
// Two shapes exist in this codebase: name -> [x,y,w,h], and name -> [[..],[..]]
// where a key is a run of animation frames. The second is flattened to
// name_0, name_1, ... so every rect gets its own plate either way.
//
//   node tools/rigrects.cjs <js/file.js> <CONST_NAME> <out.json>
const fs = require('fs');
const [file, name, out] = process.argv.slice(2);
const src = fs.readFileSync(file, 'utf8');
const m = src.match(new RegExp('const ' + name + '\\s*=\\s*\\{([\\s\\S]*?)\\n\\};'));
if (!m) { console.error('no ' + name + ' in ' + file); process.exit(1); }
const table = eval('({' + m[1].replace(/\/\/.*$/gm, '') + '})');
const flat = {};
for (const [k, v] of Object.entries(table)) {
  if (Array.isArray(v) && Array.isArray(v[0])) v.forEach((r, i) => { flat[k + '_' + i] = r; });
  else if (Array.isArray(v) && v.length === 4 && v.every(n => typeof n === 'number')) flat[k] = v;
}
fs.writeFileSync(out, JSON.stringify(flat));
console.log(name + ': ' + Object.keys(flat).length + ' rects');
