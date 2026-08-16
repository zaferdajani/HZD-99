// Fetch the free locomotion reference listed in docs/MOVEMENT_SOURCES.md.
//
// This does NOT put anything in assets/. Third-party art belongs in the repo
// only once the game actually draws it and CREDITS.md names it — a folder of
// maybes is how a licence gets lost. Everything lands in reference/movement/,
// which is gitignored, and gets copied into assets/ by hand if it earns a place.
//
// Only the sources that can be fetched without a browser are here. Quaternius
// and CMU come through itch.io and a university download form, which need a
// click; their URLs are printed at the end instead of being faked.
//
//   node tools/fetch-movement.cjs
const fs = require('fs'), path = require('path'), https = require('https');

const OUT = 'reference/movement';

// Each entry carries its licence with it. A download whose licence lives only
// in a chat message is an undocumented download.
const SOURCES = [
  {
    dir: 'wild-animals',
    file: 'All.zip',
    url: 'https://opengameart.org/sites/default/files/All.zip',
    licence: 'CC0',
    who: 'ScratchIO',
    page: 'https://opengameart.org/content/animated-wild-animals',
    note: 'wolf/bear/boar/fox/deer/rabbit, side view, idle+walk+run, wolf also howls',
  },
  {
    dir: 'forest-animals',
    file: 'enemies_081719_zp.png',
    url: 'https://opengameart.org/sites/default/files/enemies_081719_zp.png',
    licence: 'CC0',
    who: 'Vomdrache',
    page: 'https://opengameart.org/content/forest-animals-sprite-sheet',
    note: 'wolf/bear/rat/boar from the Rising Spire RPG',
  },
];

// Sources that exist and are free but cannot be reached by a script.
const BY_HAND = [
  ['Quaternius — Universal Animation Library (CC0, 120+ humanoid animations)',
   'https://quaternius.itch.io/universal-animation-library'],
  ['Quaternius — LowPoly Animated Animals (CC0, FBX/OBJ/Blend)',
   'https://quaternius.itch.io/lowpoly-animated-animals'],
  ['Quaternius — Ultimate Animated Animal Pack (CC0, 12 animals x 12+ animations)',
   'https://quaternius.com/packs/ultimateanimatedanimals.html'],
  ['CMU Motion Capture Database (free commercially, 2548 motions; BVH via cgspeed)',
   'https://sites.google.com/a/cgspeed.com/cgspeed/motion-capture'],
  ['luizmelo — Martial Hero 2 and siblings (CC0 hero cycles)',
   'https://luizmelo.itch.io/martial-hero-2'],
  ['ansimuz — Sunny Land / Warped packs (CC0, same hand as our Odyssey hero)',
   'https://opengameart.org/users/ansimuz'],
];

// One redirect-following GET. No dependency, and no retry loop: a failure here
// is a source that moved, which is a thing to read about, not to hammer.
function get(url, dest, hops = 0) {
  return new Promise((resolve, reject) => {
    if (hops > 5) return reject(new Error('too many redirects'));
    https.get(url, { headers: { 'User-Agent': 'clawbyte-fetch-movement' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(get(new URL(res.headers.location, url).href, dest, hops + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const tmp = dest + '.part';
      const f = fs.createWriteStream(tmp);
      res.pipe(f);
      f.on('finish', () => f.close(() => { fs.renameSync(tmp, dest); resolve(fs.statSync(dest).size); }));
      f.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  for (const s of SOURCES) {
    const dir = path.join(OUT, s.dir);
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, s.file);
    if (fs.existsSync(dest)) { console.log('have  ' + dest); continue; }
    try {
      const n = await get(s.url, dest);
      console.log('got   ' + dest + '  (' + n + ' bytes, ' + s.licence + ', ' + s.who + ')');
    } catch (e) {
      console.log('FAIL  ' + dest + '  ' + e.message + '  — see ' + s.page);
      continue;
    }
    // The licence travels with the files, so a folder found in six months
    // still says what may be done with it.
    fs.writeFileSync(path.join(dir, 'LICENCE.txt'),
      s.who + ' — ' + s.licence + '\n' + s.page + '\n' + s.note + '\n');
  }
  console.log('\nFree, but need a browser click:');
  for (const [what, where] of BY_HAND) console.log('  ' + what + '\n    ' + where);
  console.log('\nWhy each of these, and what to do with it: docs/MOVEMENT_SOURCES.md');
})();
