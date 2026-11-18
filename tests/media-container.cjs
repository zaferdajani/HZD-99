// EVERY SHIPPED TRACK AND FILM IS A PLAIN MP4 WITH ITS INDEX FIRST.
// Owner, 2026-11-17, in the rhino's room: "why music stoped ?". The rhino's theme and the
// Alpha's truce were fragmented MP4s (the form a live stream is cut into) and eleven tracks
// and three films carried their index at the end. A desktop browser plays those; a phone's
// player may not loop or seek the first and stays silent until the second has fully arrived.
// tools/faststart.cjs rewrites the container (never the audio). This holds it:
//   A  no shipped .m4a / .mp4 is fragmented
//   B  none keeps its index (moov) after its data
//   C  the score is all there: every track the game can ask for is one of them
const path = require('path'), fs = require('fs');
const { list } = require('../tools/faststart.cjs');
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null && d !== '' ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
console.log('── media-container — a track starts at once, seeks and loops on every player');
const L = list().filter(q => q.state !== 'not-mp4');
const frag = L.filter(q => q.state === 'fragmented').map(q => q.file), last = L.filter(q => q.state === 'index-last').map(q => q.file);
check('A  no shipped track or film is a fragmented MP4', frag.length === 0, frag.length ? frag : L.length + ' files');
check('B  ...and every one carries its index before its data', last.length === 0, last);
const music = L.filter(q => q.file.startsWith('assets/music/')).map(q => path.basename(q.file, '.m4a'));
const audio = fs.readFileSync(path.join(__dirname, '..', 'js/audio.js'), 'utf8'), asked = [...new Set([...audio.matchAll(/\['(mus_[a-z]+)', [0-9.]+\]/g)].map(m => m[1]))];
check('C  every track the game can ask for is on disk in that form', asked.length >= 15 && asked.every(k => music.includes(k)), asked.filter(k => !music.includes(k)));
if (bad) { console.log('\nFAILED: ' + bad + '  (run: node tools/faststart.cjs)'); process.exit(1); }
console.log('\nOK — ' + L.length + ' tracks and films, all plain and index-first');
