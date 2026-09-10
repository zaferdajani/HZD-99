const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const digest = require('../tools/runtime-asset-digest.cjs');
const packageHTML = require('../tools/package-html.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'clawbyte-build-'));
try {
  fs.mkdirSync(path.join(root,'source'));
  fs.writeFileSync(path.join(root,'voice.wav'),'first');
  const first=digest(root); assert.equal(digest(root),first);
  fs.writeFileSync(path.join(root,'source','unused.png'),'generation archive');
  fs.writeFileSync(path.join(root,'CREDITS.md'),'license prose');
  assert.equal(digest(root),first,'non-runtime files are excluded');
  fs.writeFileSync(path.join(root,'voice.wav'),'second');
  const second=digest(root);assert.notEqual(second,first,'same filename with different bytes invalidates cache');
  fs.renameSync(path.join(root,'voice.wav'),path.join(root,'new-voice.wav'));
  assert.notEqual(digest(root),second,'renaming runtime assets changes identity');
  const before='<script>window.keepBefore=1;</script>\n';
  const after='\n<script>window.keepAfter=1;</script>';
  const block="if ('serviceWorker' in navigator && location.protocol === 'https:') {\n  try { navigator.serviceWorker.register('sw.js?v=' + window.BUILD_ID, {updateViaCache:'none'}).catch(() => {}); } catch (e) {}\n}";
  const packed=packageHTML(before+block+after);
  assert(packed.startsWith(before)&&packed.endsWith(after));
  assert(!packed.includes('serviceWorker.register'));
  assert.equal(packageHTML(packed),packed,'native packing is idempotent');
  assert.throws(()=>packageHTML("navigator.serviceWorker.register('another-worker.js')"),/Unrecognized/);
  const game=fs.readFileSync('index.html','utf8');
  assert(game.includes('serviceWorker.register'),'web retains offline support');
  assert(!packageHTML(game).includes('navigator.serviceWorker.register'),'real native page removes current versioned worker');
  console.log('PASS deterministic runtime-asset identity, same-name changes, scoped exclusions and real native worker removal');
} finally { fs.rmSync(root,{recursive:true,force:true}); }
