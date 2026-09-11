'use strict';
// One-time, baseline-checked release repair. Never overwrite unrelated edits.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const BASE = '8ff272bbfca1d36601018cdd2e16f5aef7c29abf';
const changes = [];
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
function original(p) { return cp.execFileSync('git', ['show', BASE + ':' + p], {maxBuffer:32*1024*1024}); }
function writeChecked(p, old, next) {
  const current = fs.readFileSync(p);
  assert.ok(current.equals(old) || current.equals(next), 'Unrelated changes at '+p+'; refusing to overwrite');
  if (!current.equals(next)) fs.writeFileSync(p,next);
  changes.push({path:p,before:hash(old),after:hash(next)});
}
function replaceOnce(s, old, next) {
  assert.equal(s.split(old).length,2,'Expected exactly one source anchor: '+old.slice(0,80));
  return s.replace(old,next);
}
function edit(p, fn) { const old=original(p); writeChecked(p,old,Buffer.from(fn(old.toString('utf8')))); }
edit('js/game.js', s => replaceOnce(s,
  '  const prompt = tutPrompt(s);\n  if (!prompt) return true;\n  const action = prompt.action || s.action;',
  "  const prompt = tutPrompt(s);\n  if (!prompt) return true;\n  // The contextual card changes to MOVE after takeoff. Continue reading\n  // the held jump during ascent, otherwise the tutorial itself applies\n  // JUMP_CUT on the launch frame and the obstacle cannot be cleared.\n  if (a === 'JUMP' && s.id === 'jump' && G.tut.jumps > 0 && player &&\n      !player.on && player.vy < 0) return true;\n  const action = prompt.action || s.action;"));
edit('tests/tutorial-controller.cjs', s => replaceOnce(s,
  "// An old patch's lock never survives a save, room, or pure guidance frame.",
  "// A committed jump must retain its held input and lateral air control.\nctx.G.tut.jumps = 1; ctx.player.on = false; ctx.player.vy = -920;\nassert.equal(ctx.tutAllows('JUMP'), true);\nassert.equal(ctx.tutAllows('MOVE'), true);\nassert.equal(ctx.tutorialApplyLock(), false);\nctx.player.on = true; ctx.player.vy = 0;\n\n// An old patch's lock never survives a save, room, or pure guidance frame."));
edit('tests/frames.cjs', s => {
  const start=s.indexOf('    const W = 150, H = 150;');
  const end=s.indexOf('    // a mask of ',start);
  assert.ok(start>=0 && end>start,'Actor measurement anchors are missing');
  s=s.slice(0,start)+`    // Use the actual production Player.draw renderer, but isolate its body.
    // The former world crop ignored camera zoom and counted scenery as the
    // character. The release-polish harness separately checks screen scale.
    const W = 256, H = 256;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const cx2 = cv.getContext('2d', { willReadFrequently: true });
    const shot = () => {
      cx2.clearRect(0, 0, W, H);
      cx2.save();
      cx2.translate(W / 2, H - 24);
      cx2.scale(2, 2);
      cx2.translate(-(player.x + player.w / 2 - cam.x), -(player.y + player.h - cam.y));
      const previousProbe = G.artProbe;
      G.artProbe = 1;
      try { player.draw(cx2); }
      finally { G.artProbe = previousProbe; cx2.restore(); }
      return cx2.getImageData(0, 0, W, H).data;
    };
`+s.slice(end);
  s=replaceOnce(s,'        G.artProbe = 1;\n        draw();\n        G.artProbe = 0;\n        masks.push(mask(shot()));','        masks.push(mask(shot()));');
  // Keep the original motion thresholds. No threshold relaxation is allowed.
  assert.ok(s.includes('r.mean >= 6 && max >= 12'));
  return s;
});
// Restore a consistent young robotic character voice, not random adult barks.
// Attack 2 is a modest variation of the matching attack-1 performance. Yalla
// keeps its original word, duration and performance, with a register correction.
const ffmpeg=process.env.FFMPEG_BIN || '/usr/bin/ffmpeg';
cp.execFileSync(ffmpeg,['-version'],{stdio:'ignore'});
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'clawbyte-voice-'));
try {
  const recipes=[
    {target:'hzd_atk2',source:'hzd_atk1',filter:'rubberband=pitch=1.06:tempo=0.86:formant=preserved,afade=t=in:d=0.004,afade=t=out:st=0.28:d=0.065,alimiter=limit=0.85:level=false'},
    {target:'hzd_yalla',source:'hzd_yalla',filter:'rubberband=pitch=1.5:tempo=1:formant=shifted,afade=t=in:d=0.004,afade=t=out:st=0.99:d=0.1,alimiter=limit=0.85:level=false'}
  ];
  for(const r of recipes){
    const target='assets/audio/vox/'+r.target+'.wav';
    const source=original('assets/audio/vox/'+r.source+'.wav');
    const input=path.join(dir,r.source+'-source.wav'), output=path.join(dir,r.target+'-result.wav');
    fs.writeFileSync(input,source);
    cp.execFileSync(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-y','-i',input,'-af',r.filter,'-ar','44100','-ac','1','-c:a','pcm_s16le',output],{stdio:'inherit'});
    writeChecked(target,original(target),fs.readFileSync(output));
  }
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
fs.mkdirSync('release-evidence',{recursive:true});
fs.writeFileSync('release-evidence/followup-changes.json',JSON.stringify({baseline:BASE,changes},null,2));
console.log('Applied baseline-checked follow-up repairs:',JSON.stringify(changes,null,2));
