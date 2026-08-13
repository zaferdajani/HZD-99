// Build the desktop app — a real .exe you can double-click.
//
//   node tools/pack-desktop.cjs win32      Windows x64  (default)
//   node tools/pack-desktop.cjs linux      Linux x64
//   node tools/pack-desktop.cjs darwin     macOS
//
// CROSS-BUILDING WINDOWS FROM LINUX, without Wine. @electron/packager does not
// compile anything: it downloads the prebuilt Electron runtime for the target
// platform and lays your files beside it. That is why a Windows .exe can be
// produced from this container at all. The one thing it cannot do without Wine
// is rewrite the .exe's embedded icon and version resource — those need
// `rcedit`, which is a Windows binary — so on a non-Windows host we skip them
// and the app ships with Electron's default icon. It runs identically; it just
// wears the wrong hat until it is built on Windows or with Wine present.
//
// The app is assembled into a staging directory rather than packaged from the
// repo, because the repo contains the whole toolchain — node_modules, the test
// harnesses, six thousand lines of source — and none of that belongs in a
// player's download.
const { packager } = require('@electron/packager');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const STAGE = path.join(ROOT, 'build', 'app');
const OUT = path.join(ROOT, 'build', 'dist');
const platform = (process.argv[2] || 'win32').replace('windows', 'win32');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  let n = 0, bytes = 0;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { const r = copyDir(a, b); n += r.n; bytes += r.bytes; }
    else { fs.copyFileSync(a, b); n++; bytes += fs.statSync(a).size; }
  }
  return { n, bytes };
}

(async () => {
  // 1. the game itself, exactly what the web gets
  console.log('building…');
  execFileSync('node', [path.join(ROOT, 'build.cjs')], { stdio: 'inherit' });
  execFileSync('node', [path.join(__dirname, 'pack-www.cjs')], { stdio: 'inherit' });

  // 2. stage: the shell, the game, and a package.json with NO dependencies —
  //    main.js uses only Node built-ins and electron itself, so the packaged
  //    app carries no node_modules at all
  fs.rmSync(STAGE, { recursive: true, force: true });
  fs.mkdirSync(STAGE, { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'desktop', 'main.js'), path.join(STAGE, 'main.js'));
  const ver = (JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version) || '1.0.0';
  fs.writeFileSync(path.join(STAGE, 'package.json'), JSON.stringify({
    name: 'clawbyte', productName: 'CLAWBYTE', version: ver,
    description: 'CLAWBYTE — a robo-cat metroidvania',
    main: 'main.js', author: 'Zafer Dajani', license: 'UNLICENSED',
  }, null, 2));
  const r = copyDir(path.join(ROOT, 'www'), path.join(STAGE, 'www'));
  console.log('staged ' + r.n + ' files, ' + (r.bytes / 1048576).toFixed(1) + ' MB of game');

  // 3. package
  fs.mkdirSync(OUT, { recursive: true });
  // The staged package.json deliberately has no dependencies, so the packager
  // cannot infer which Electron to fetch from it. Told explicitly, from the one
  // installed in this repo — the shell and the runtime stay in step.
  const elecVer = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'node_modules', 'electron', 'package.json'), 'utf8')).version;
  console.log('electron ' + elecVer + ' -> ' + platform + ' x64');
  // PRE-FETCHED RUNTIMES. The packager will download the target platform's
  // Electron itself, and through this container's proxy that download arrives
  // truncated and dies inside undici with an assertion that says nothing about
  // what went wrong. curl handles the proxy correctly, so the zip is fetched
  // beside the build and handed over — which also makes the build repeatable
  // offline, and makes it obvious what is being shipped.
  //
  //   curl -L -o build/zips/electron-v<ver>-<platform>-x64.zip \
  //     https://github.com/electron/electron/releases/download/v<ver>/electron-v<ver>-<platform>-x64.zip
  const zipDir = path.join(ROOT, 'build', 'zips');
  const zip = path.join(zipDir, `electron-v${elecVer}-${platform}-x64.zip`);
  const haveZip = fs.existsSync(zip);
  if (haveZip) console.log('using pre-fetched runtime: ' + path.basename(zip));
  const opts = {
    dir: STAGE, out: OUT, platform, arch: 'x64',
    electronVersion: elecVer,
    ...(haveZip ? { electronZipDir: zipDir } : {}),
    name: 'CLAWBYTE', appVersion: ver,
    overwrite: true, prune: false, asar: true,
    appCopyright: 'Copyright (c) ' + new Date(2026, 0, 1).getFullYear() + ' Zafer Dajani',
  };
  // win32 metadata is written by rcedit, a Windows executable. Asking for it on
  // Linux without Wine fails the whole build, so it is simply not asked for.
  if (platform === 'win32' && process.platform !== 'win32') {
    console.log('note: building win32 from ' + process.platform +
      ' — skipping icon/version resources (they need rcedit, a Windows binary)');
    opts.win32metadata = undefined;
  }
  const paths = await packager(opts);
  for (const p of paths) {
    let n = 0, bytes = 0;
    const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f); else { n++; bytes += fs.statSync(f).size; }
    } };
    walk(p);
    console.log('\n' + p);
    console.log('  ' + n + ' files, ' + (bytes / 1048576).toFixed(1) + ' MB');
    const exe = fs.readdirSync(p).filter(f => /\.exe$/i.test(f));
    if (exe.length) console.log('  run: ' + exe.join(', '));
  }
})().catch(e => { console.error(e); process.exit(1); });
