// Assemble www/ — what actually ships inside the app.
//
// The web build and the app build are the SAME game; this only decides what
// goes in the package. Two differences, both deliberate:
//
//   The service worker is left out. It exists to keep a web player on the
//   newest code and to survive being offline — inside an app the code IS the
//   package and there is nothing to be newer than, so a worker caching a page
//   it was shipped with is pure risk.
//
//   assets/ is COPIED, not streamed. On the web a 71 MB library arrives a file
//   at a time as the player reaches it; in an app it is already on the phone,
//   which is what kills the buffering the opening film used to fight.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), WWW = path.join(ROOT, 'www');

// ...and assets/source/ is NOT. It is the generation archive — every plate the
// art pipeline ever produced, kept permanently so a claim about the art can be
// checked (assets/source/README.md). Nothing in js/ loads a single byte of it,
// and the tree walk that copies assets/ was copying all of it into the phone:
// megabytes of reference JPEGs shipped to a player who can never see them. The
// exclusion is by NAME rather than by a copy allowlist, deliberately — an
// allowlist is a list somebody has to remember to add to, and forgetting it
// means a new asset silently missing on Android while the web build is fine.
// Excluding is safe by default; including is not.
const SKIP = new Set(['source']);
function copyDir(from, to, top) {
  fs.mkdirSync(to, { recursive: true });
  let n = 0, bytes = 0;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (top && SKIP.has(e.name)) continue;
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { const r = copyDir(a, b); n += r.n; bytes += r.bytes; }
    else { fs.copyFileSync(a, b); n++; bytes += fs.statSync(a).size; }
  }
  return { n, bytes };
}

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

for (const f of ['index.html', 'odyssey.html']) {
  if (!fs.existsSync(path.join(ROOT, f))) throw new Error('run `node build.cjs` first: ' + f + ' is missing');
  // strip the service-worker registration out of the packaged copy
  let html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  html = html.replace(/navigator\.serviceWorker\.register\('sw\.js'\)/g, 'void 0');
  fs.writeFileSync(path.join(WWW, f), html);
}
const a = copyDir(path.join(ROOT, 'assets'), path.join(WWW, 'assets'), true);

const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
const html = fs.statSync(path.join(WWW, 'index.html')).size + fs.statSync(path.join(WWW, 'odyssey.html')).size;
console.log('www/  ' + a.n + ' assets (' + mb(a.bytes) + ') + 2 pages (' + mb(html) + ')  =  ' + mb(a.bytes + html));
