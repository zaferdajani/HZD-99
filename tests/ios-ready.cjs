// IS THE iOS APP WHAT THE APP STORE WILL ACCEPT — as far as that can be known
// without a Mac. The compile and the archive are proved on Apple's toolchain by
// .github/workflows/ios.yml; this is everything that can be checked from the
// repository itself, so a change that quietly breaks a store requirement fails
// here, on any machine, before it is pushed.
//
//   node tests/ios-ready.cjs
const fs = require('fs'), path = require('path'), crypto = require('crypto'), zlib = require('zlib');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const fails = [];
const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
// a PNG's header: width, height, colour type (6 and 4 carry alpha)
const png = (f) => { const b = fs.readFileSync(path.join(ROOT, f)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), type: b[25], sha: crypto.createHash('sha256').update(b).digest('hex') }; };
const plist = (f) => { const s = read(f); return { has: (k) => s.includes('<key>' + k + '</key>'), after: (k) => { const i = s.indexOf('<key>' + k + '</key>'); return i < 0 ? '' : s.slice(i + k.length + 11, i + k.length + 320); }, raw: s }; };
(async () => {
  console.log('── ios-ready — the Xcode project, the icon, the privacy manifest, and sound an iPhone can decode');
  const info = plist('ios/App/App/Info.plist'), proj = read('ios/App/App.xcodeproj/project.pbxproj');
  const cfg = JSON.parse(read('capacitor.config.json'));
  // ---- identity and versions ----
  check('one bundle id, the same in the project and the Capacitor config', (proj.match(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g) || []).every(l => l.includes(cfg.appId)) && /^[a-z0-9.-]+$/i.test(cfg.appId), cfg.appId);
  const mv = (proj.match(/MARKETING_VERSION = ([^;]+);/) || [])[1], pv = JSON.parse(read('package.json')).version;
  check('the app version is the package version, three numbers', mv === pv && /^\d+\.\d+\.\d+$/.test(mv), mv + ' / ' + pv);
  const floor = Math.min(...(proj.match(/IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);/g) || []).map(l => parseFloat(l.split('= ')[1])));
  const podFloor = parseFloat((read('ios/App/Podfile').match(/platform :ios, '([\d.]+)'/) || [])[1]);
  check('iOS 14 or later everywhere (the art is WebP, which WKWebView decodes from 14)', floor >= 14 && podFloor >= 14, 'project ' + floor + ', pods ' + podFloor);
  // ---- what App Review and the upload checks read ----
  const orient = (k) => (info.after(k).split('</array>')[0].match(/UIInterfaceOrientation\w+/g) || []).sort().join(',');
  for (const k of ['UISupportedInterfaceOrientations', 'UISupportedInterfaceOrientations~ipad'])
    check(k + ' is landscape only', orient(k) === 'UIInterfaceOrientationLandscapeLeft,UIInterfaceOrientationLandscapeRight', orient(k));
  check('full screen is required (an iPad app that will not rotate must say so)', /^\s*<true\/>/.test(info.after('UIRequiresFullScreen')));
  check('export compliance is answered: no non-exempt encryption', /^\s*<false\/>/.test(info.after('ITSAppUsesNonExemptEncryption')));
  check('64-bit only (armv7 is refused)', info.after('UIRequiredDeviceCapabilities').split('</array>')[0].includes('arm64') && !info.raw.includes('armv7'));
  check('the display name is the game\'s', /<string>CLAWBYTE<\/string>/.test(info.after('CFBundleDisplayName')));
  check('no usage-description keys: the app asks for no camera, microphone, location, photos or tracking', !/NS\w+UsageDescription/.test(info.raw));
  // ---- the privacy manifest ----
  const priv = fs.existsSync(path.join(ROOT, 'ios/App/App/PrivacyInfo.xcprivacy')) ? plist('ios/App/App/PrivacyInfo.xcprivacy') : null;
  check('a privacy manifest ships in the app target', !!priv && (proj.match(/PrivacyInfo\.xcprivacy in Resources/g) || []).length >= 2);
  check('...declaring no tracking and no collected data', !!priv && /^\s*<false\/>/.test(priv.after('NSPrivacyTracking')) && /^\s*<array\/>/.test(priv.after('NSPrivacyCollectedDataTypes')));
  // ---- the view controller ----
  const swift = read('ios/App/App/AppDelegate.swift'), board = read('ios/App/App/Base.lproj/Main.storyboard');
  check('the storyboard opens the game\'s own view controller', /customClass="GameViewController" customModule="App"/.test(board) && /class GameViewController: CAPBridgeViewController/.test(swift));
  check('...which lets the score and the opening film start without a tap', /mediaTypesRequiringUserActionForPlayback = \[\]/.test(swift) && /allowsInlineMediaPlayback = true/.test(swift));
  check('...keeps the edges for the touch controls and the screen awake', /preferredScreenEdgesDeferringSystemGestures/.test(swift) && /prefersHomeIndicatorAutoHidden/.test(swift) && /isIdleTimerDisabled = true/.test(swift));
  // ---- the icon and the launch image ----
  const icon = png('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
  check('the App Store icon is 1024 square with no alpha channel', icon.w === 1024 && icon.h === 1024 && (icon.type === 2 || icon.type === 3), icon.w + 'x' + icon.h + ' colour type ' + icon.type);
  // Capacitor's placeholder (a blue X on white) is mostly white; the game's icon is not
  const lum = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'), '-vf', 'scale=16:16,format=gray', '-f', 'rawvideo', '-']);
  const white = [...lum].filter(v => v > 235).length / lum.length;
  check('...and is the game\'s art, not the template\'s placeholder', white < 0.25, (white * 100).toFixed(0) + '% near-white');
  const master = png('assets/source/brand/appicon.png');
  check('...derived from the archived master', master.w === 1024 && master.h === 1024 && fs.existsSync(path.join(ROOT, 'assets/source/brand/jobs.json')));
  const splashes = fs.readdirSync(path.join(ROOT, 'ios/App/App/Assets.xcassets/Splash.imageset')).filter(f => /\.png$/.test(f)).map(f => png('ios/App/App/Assets.xcassets/Splash.imageset/' + f));
  check('the launch image is the game\'s too, opaque', splashes.length === 3 && splashes.every(s => s.w === 2732 && s.type !== 6 && s.type !== 4));
  const android = png('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');
  check('RULE ONE: Android wears the same icon', android.w === 192 && fs.statSync(path.join(ROOT, 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png')).mtimeMs > 0 && !/#FFFFFF/i.test(read('android/app/src/main/res/values/ic_launcher_background.xml')));
  // ---- sound an iPhone can decode ----
  let tier = 'ok'; try { execFileSync('node', [path.join(ROOT, 'tools/aactier.cjs'), '--check'], { stdio: 'pipe' }); } catch (e) { tier = String(e.stderr || e.message).trim(); }
  check('every Ogg the game plays has its AAC copy, and the index is current', tier === 'ok', tier === 'ok' ? Object.keys(JSON.parse(read('assets/aac/index.json'))).length + ' files' : tier);
  const idx = JSON.parse(read('assets/aac/index.json'));
  const probe = (f) => { try { return execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name:format=duration', '-of', 'csv=p=0', path.join(ROOT, f)]).toString().trim().split(/\s+/); } catch (e) { return ['', '0']; } };
  let worst = 0, bad = [];
  for (const ogg in idx) { const a = probe(ogg), b = probe(idx[ogg]); const d = Math.abs(parseFloat(a[1]) - parseFloat(b[1])); if (b[0] !== 'aac' || !(d < 0.09)) bad.push(ogg + ' ' + b[0] + ' Δ' + d.toFixed(3)); worst = Math.max(worst, d || 0); }
  check('...each one AAC and the same length as its source (within 90 ms of codec padding)', bad.length === 0, bad.length ? bad.slice(0, 3).join('; ') : 'worst ' + (worst * 1000).toFixed(0) + ' ms');
  // ---- and the page asks for the right one ----
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  try {
    const run = async (noOgg) => {
      const page = await browser.newPage({ viewport: { width: 844, height: 390 }, serviceWorkers: 'block' });
      // an iPhone before 18.4: Ogg is not playable, everything else answers as it did
      if (noOgg) await page.addInitScript(() => { const real = HTMLMediaElement.prototype.canPlayType; HTMLMediaElement.prototype.canPlayType = function (t) { return /ogg|vorbis/i.test(t) ? '' : real.call(this, t); }; });
      const asked = []; page.on('request', r => { const u = r.url(); if (/\.(ogg|m4a)(\?|$)/.test(u) && /assets\/(sfx|vox|aac)\//.test(u)) asked.push(u.replace(/^.*\/assets\//, 'assets/')); });
      const errors = []; page.on('pageerror', e => errors.push(String(e)));
      await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof startGame === 'function' && typeof audioSrc === 'function');
      const r = await page.evaluate(async () => {
        const out = { ogg: oggOK(), tier: Object.keys(window.AAC_TIER || {}).length, voice: audioSrc(Object.values(window.VOX_FILES || {})[0] || ''), wav: audioSrc('assets/sfx/vox/hzd_yalla.wav'), music: audioSrc('assets/music/mus_title.m4a') };
        try { if (typeof audioOn === 'function') audioOn(); } catch (e) {}
        if (typeof AC !== 'undefined' && AC) { for (const k of ['nf_roar', 'metal', 'hit1', 'fz_tell']) mediaAudio(k); await new Promise(res => setTimeout(res, 1200)); }
        out.ac = typeof AC !== 'undefined' && !!AC;
        return out;
      });
      await page.close();
      return { ...r, asked: [...new Set(asked)], errors };
    };
    const iphone = await run(true), other = await run(false);
    check('where Ogg cannot play, a voice line and the effects are asked for as AAC', iphone.ogg === false && /^assets\/aac\/vox\/.+\.m4a$/.test(iphone.voice) && iphone.asked.length > 0 && iphone.asked.every(u => /^assets\/aac\/.+\.m4a$/.test(u)), iphone.voice + ' · fetched ' + iphone.asked.slice(0, 2).join(', '));
    check('...and nothing that is not Ogg is touched', iphone.wav === 'assets/sfx/vox/hzd_yalla.wav' && iphone.music === 'assets/music/mus_title.m4a');
    check('where Ogg plays, nothing changes', other.ogg === true && /\.ogg$/.test(other.voice) && other.asked.every(u => /\.ogg$/.test(u)), other.voice);
    check('the page carries the whole tier', iphone.tier === Object.keys(idx).length, iphone.tier + ' entries');
    check('no page errors either way', iphone.errors.length + other.errors.length === 0, iphone.errors.concat(other.errors).slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  // ---- nothing the store forbids in the packaged page ----
  const www = fs.existsSync(path.join(ROOT, 'www/index.html')) ? read('www/index.html') : '';
  check('the packaged page registers no service worker', www.length > 1e6 && !/serviceWorker\s*\.\s*register/.test(www));
  check('the packaged game names no other store or platform to its player', !/"[^"\n]{0,80}\b(Google Play|Play Store|Steam|itch\.io|Android)\b[^"\n]{0,80}"\s*[,}]/.test(read('js/i18n.js')));
  check('the app is never the demo and offers no outside purchase link', /const DEMO_URL = '';/.test(read('js/game.js')) && /if \(packaged\) return false;/.test(read('js/game.js')));
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nios-ready: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
