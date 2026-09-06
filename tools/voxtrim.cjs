// Turn a text-to-speech take into a GAME BARK.
//
// A generated line is not a sound effect. It arrives with a beat of room tone
// before the voice starts, a tail of silence after it, in stereo, at 44.1 kHz,
// at whatever level the model felt like. Played on the frame she swings, the
// leading silence IS latency — the shout lands after the claw, which reads as a
// dropped input rather than as a character.
//
// So each take is: decoded, downmixed to mono, trimmed to the first and last
// sample that actually carry signal, given a 6 ms fade in and a 25 ms fade out
// so the cut does not click, peak-normalised to a headroom that leaves room for
// the mix, capped in length, and written as a 32 kHz mono WAV — which
// decodeAudioData reads natively and which is smaller than the mp3 it came
// from once the silence is gone.
//
// The browser is the codec here for the same reason tools/img-crush.cjs uses
// it: this repo ships nothing from npm and has no ffmpeg.
//
//   node tools/voxtrim.cjs <in.mp3> <out.wav> [peak 0-1] [maxSeconds]
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [inp, out, peakArg, maxArg] = process.argv.slice(2);
  if (!inp || !out) { console.log('usage: voxtrim.cjs <in> <out.wav> [peak] [maxSec]'); process.exit(1); }
  const peak = parseFloat(peakArg || '0.85'), maxSec = parseFloat(maxArg || '1.6');
  const b64 = fs.readFileSync(inp).toString('base64');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const res = await page.evaluate(async ({ b64, peak, maxSec }) => {
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const AC = new (window.AudioContext || window.webkitAudioContext)();
    const src = await AC.decodeAudioData(buf.buffer);
    const SR = 32000;
    // mono downmix at the source rate first, so the trim points are found on
    // the real signal rather than on a resampled approximation of it
    const n0 = src.length, ch = src.numberOfChannels;
    const mono = new Float32Array(n0);
    for (let c = 0; c < ch; c++) {
      const d = src.getChannelData(c);
      for (let i = 0; i < n0; i++) mono[i] += d[i] / ch;
    }
    // TRIM ON A SHORT-WINDOW ENVELOPE, not on single samples. A single sample
    // above a threshold can be a click in the room tone; a 5 ms window that is
    // above it is a voice.
    const W = Math.max(1, Math.round(src.sampleRate * 0.005));
    // RELATIVE to the take's own peak, not absolute. These come back anywhere
    // between 0.10 and 0.67 peak, and one absolute gate either keeps a second
    // of breath on the quiet ones or eats the start of the loud ones.
    let pk = 0; for (let i = 0; i < n0; i++) { const a2 = Math.abs(mono[i]); if (a2 > pk) pk = a2; }
    const gate = Math.max(0.006, pk * 0.10);
    let lo = 0, hi = n0 - 1;
    for (let i = 0; i + W < n0; i += W) {
      let m = 0; for (let j = 0; j < W; j++) m = Math.max(m, Math.abs(mono[i + j]));
      if (m > gate) { lo = i; break; }
    }
    for (let i = n0 - W; i > 0; i -= W) {
      let m = 0; for (let j = 0; j < W; j++) m = Math.max(m, Math.abs(mono[i + j]));
      if (m > gate) { hi = i + W; break; }
    }
    lo = Math.max(0, lo - Math.round(src.sampleRate * 0.008));   // a breath of pre-roll
    hi = Math.min(n0, hi + Math.round(src.sampleRate * 0.03));
    const cutN = Math.max(1, hi - lo);
    // resample to 32k by linear interpolation, capped
    const outN = Math.min(Math.round(maxSec * SR), Math.round(cutN * SR / src.sampleRate));
    const o = new Float32Array(outN);
    for (let i = 0; i < outN; i++) {
      const t = lo + i * src.sampleRate / SR;
      const a = t | 0, f = t - a;
      o[i] = (mono[a] || 0) * (1 - f) + (mono[a + 1] || 0) * f;
    }
    // fades: 6 ms in, 25 ms out — enough to kill the cut click, short enough
    // that the attack of the consonant survives
    const fi = Math.round(SR * 0.006), fo = Math.round(SR * 0.025);
    for (let i = 0; i < fi && i < outN; i++) o[i] *= i / fi;
    for (let i = 0; i < fo && i < outN; i++) o[outN - 1 - i] *= i / fo;
    // peak normalise
    let mx = 0; for (let i = 0; i < outN; i++) mx = Math.max(mx, Math.abs(o[i]));
    const g = mx > 1e-5 ? peak / mx : 1;
    // ---- WAV, 16-bit mono ----
    const bytes = 44 + outN * 2;
    const ab = new ArrayBuffer(bytes), dv = new DataView(ab);
    const str = (off, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); dv.setUint32(4, bytes - 8, true); str(8, 'WAVE');
    str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
    dv.setUint16(22, 1, true); dv.setUint32(24, SR, true);
    dv.setUint32(28, SR * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
    str(36, 'data'); dv.setUint32(40, outN * 2, true);
    for (let i = 0; i < outN; i++) {
      const v = Math.max(-1, Math.min(1, o[i] * g));
      dv.setInt16(44 + i * 2, v < 0 ? v * 32768 : v * 32767, true);
    }
    let s2 = ''; const u8 = new Uint8Array(ab);
    for (let i = 0; i < u8.length; i += 0x8000)
      s2 += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return { b64: btoa(s2), srcSec: +(n0 / src.sampleRate).toFixed(2),
             outSec: +(outN / SR).toFixed(2), peak: +mx.toFixed(3) };
  }, { b64, peak, maxSec });
  await browser.close();
  fs.writeFileSync(out, Buffer.from(res.b64, 'base64'));
  console.log(inp.split('/').pop() + '  ' + res.srcSec + 's -> ' + out.split('/').pop()
    + '  ' + res.outSec + 's  (was peaking ' + res.peak + ')');
})().catch(e => { console.error(e); process.exit(1); });
