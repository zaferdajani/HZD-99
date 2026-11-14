// THE APP ICON AND THE LAUNCH SCREEN, DERIVED.
//
// One master — assets/source/brand/appicon.png, 1024 square, opaque — and every
// size either store or either launcher asks for is cut from it here. Both
// native shells shipped Capacitor's placeholder (a blue X on white) until
// 2026-11-14, which App Review rejects on sight and which made the installed
// game look like a template.
//
// iOS:      AppIcon (one 1024, no alpha — the App Store refuses an alpha
//           channel in the marketing icon) and the three launch images.
// Android:  the legacy and round launcher icons at five densities, the
//           adaptive foreground (the art inside the 66% safe zone), and every
//           splash drawable at the size it already is.
//
//   node tools/appicon.cjs
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'assets/source/brand/appicon.png');
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]);
const probe = (f) => execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f]).toString().trim().split(',').map(Number);
if (!fs.existsSync(SRC)) { console.error('missing ' + SRC); process.exit(1); }
let n = 0;
// ---- iOS ----
const ios = path.join(ROOT, 'ios/App/App/Assets.xcassets');
if (fs.existsSync(ios)) {
  ff(['-i', SRC, '-vf', 'scale=1024:1024:flags=lanczos,format=rgb24', path.join(ios, 'AppIcon.appiconset/AppIcon-512@2x.png')]); n++;
  // the launch storyboard aspect-fills one square image; in landscape it shows
  // the middle band of it, which is where her face is
  for (const f of fs.readdirSync(path.join(ios, 'Splash.imageset')).filter(f => /\.png$/.test(f))) {
    ff(['-i', SRC, '-vf', 'scale=2732:2732:flags=lanczos,format=rgb24', path.join(ios, 'Splash.imageset', f)]); n++;
  }
}
// ---- Android ----
const res = path.join(ROOT, 'android/app/src/main/res');
if (fs.existsSync(res)) {
  const dens = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const d in dens) {
    const s = dens[d], dir = path.join(res, 'mipmap-' + d), fg = Math.round(s * 108 / 48), art = Math.round(fg * 0.66);
    if (!fs.existsSync(dir)) continue;
    ff(['-i', SRC, '-vf', `scale=${s}:${s}:flags=lanczos`, path.join(dir, 'ic_launcher.png')]);
    ff(['-i', SRC, '-vf', `scale=${s}:${s}:flags=lanczos,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*lte(hypot(X-${s / 2},Y-${s / 2}),${s / 2})'`, path.join(dir, 'ic_launcher_round.png')]);
    ff(['-i', SRC, '-vf', `scale=${art}:${art}:flags=lanczos,format=rgba,pad=${fg}:${fg}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`, path.join(dir, 'ic_launcher_foreground.png')]);
    n += 3;
  }
  for (const d of fs.readdirSync(res).filter(d => /^drawable/.test(d))) {
    const f = path.join(res, d, 'splash.png'); if (!fs.existsSync(f)) continue;
    const [w, h] = probe(f), m = Math.max(w, h);
    ff(['-i', SRC, '-vf', `scale=${m}:${m}:flags=lanczos,crop=${w}:${h}`, f + '.tmp.png']); fs.renameSync(f + '.tmp.png', f); n++;
  }
}
console.log('derived ' + n + ' icon and launch images from assets/source/brand/appicon.png');
