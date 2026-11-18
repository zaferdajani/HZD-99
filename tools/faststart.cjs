#!/usr/bin/env node
// EVERY SHIPPED TRACK AND FILM STARTS AT ONCE, SEEKS AND LOOPS ON EVERY PLAYER.
//
// Owner, 2026-11-17, in the rhino's room: "why music stoped ?". The stop could not be
// reproduced on a desktop browser. What WAS found: the rhino's theme (mus_eye) and the
// Alpha's truce (mus_alphatame) were FRAGMENTED MP4s — three thousand little moof/mdat
// pairs, the form a live stream is cut into — and eleven more tracks and three films kept
// their index (moov) at the END of the file. A desktop browser plays both. A phone's
// player is where they are known to fail: a fragmented file may not loop or seek (and this
// game seeks every kingdom's theme back to where it left off), and an index at the end
// means nothing sounds until the whole file has arrived.
//
// This rewrites the CONTAINER only — the audio and video inside are copied bit for bit
// (checked: the decoded stream's md5 is the same before and after) — to one plain MP4
// with its index first.
//
//   node tools/faststart.cjs            fix whatever needs it
//   node tools/faststart.cjs --check    list what needs it, exit 1 if anything does
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), DIRS = ['assets/music', 'assets/video', 'assets/aac', 'assets/sfx', 'assets/vox', 'assets/intro'];
function atoms(file) {
  const fd = fs.openSync(file, 'r'), size = fs.statSync(file).size, head = Buffer.alloc(16); let pos = 0, moof = 0; const order = [];
  while (pos + 8 <= size) { fs.readSync(fd, head, 0, 16, pos); let sz = head.readUInt32BE(0); const typ = head.toString('latin1', 4, 8);
    if (sz === 1) sz = Number(head.readBigUInt64BE(8)); if (sz < 8) break;
    if (typ === 'moof') moof++; if ((typ === 'moov' || typ === 'mdat') && !order.includes(typ)) order.push(typ); pos += sz; }
  fs.closeSync(fd); return { moof, order };
}
function state(file) { const a = atoms(file); return a.moof ? 'fragmented' : a.order[0] === 'moov' ? 'ok' : a.order.length ? 'index-last' : 'not-mp4'; }
function walk(dir, out) { if (!fs.existsSync(dir)) return out; for (const n of fs.readdirSync(dir)) { const f = path.join(dir, n); if (fs.statSync(f).isDirectory()) walk(f, out); else if (/\.(m4a|mp4|m4v|mov)$/i.test(n)) out.push(f); } return out; }
function list() { const out = []; for (const d of DIRS) walk(path.join(ROOT, d), out); return out.sort().map(f => ({ file: path.relative(ROOT, f), state: state(f) })); }
module.exports = { list, state };
if (require.main === module) {
  const need = list().filter(q => q.state !== 'ok' && q.state !== 'not-mp4');
  if (process.argv.includes('--check')) { for (const q of need) console.log(q.state.padEnd(11), q.file); console.log(need.length ? need.length + ' file(s) need node tools/faststart.cjs' : 'every track and film is a plain MP4 with its index first'); process.exit(need.length ? 1 : 0); }
  const md5 = f => execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-map', '0', '-c', 'copy', '-f', 'md5', '-'], { encoding: 'utf8' }).trim();
  for (const q of need) { const f = path.join(ROOT, q.file), tmp = f.replace(/(\.\w+)$/, '.faststart$1');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', f, '-map', '0', '-c', 'copy', '-movflags', '+faststart', tmp]);
    const a = md5(f), b = md5(tmp);
    if (a !== b || state(tmp) !== 'ok') { fs.unlinkSync(tmp); console.error('NOT REPLACED (the copy differs or is still not plain): ' + q.file); process.exitCode = 1; continue; }
    fs.renameSync(tmp, f); console.log(q.state.padEnd(11), '->  ok  ', q.file, '(stream ' + a.replace('MD5=', '').slice(0, 8) + ' unchanged)'); }
  if (!need.length) console.log('nothing to do');
}
