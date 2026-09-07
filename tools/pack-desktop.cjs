// npm ci --prefix desktop --ignore-scripts
// node tools/pack-desktop.cjs win32
// A portable folder containing CLAWBYTE.exe and required runtime/resources.
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const STAGE = path.join(ROOT, 'build', 'app');
const OUT = path.join(ROOT, 'build', 'dist');
const desktopRequire = createRequire(path.join(ROOT, 'desktop', 'package.json'));
const platform = process.argv[2] || 'win32';
if (!['win32', 'linux', 'darwin'].includes(platform)) throw new Error('Expected win32, linux or darwin');
const sha256 = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function files(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en')).flatMap(e => {
    const name = prefix + e.name;
    return e.isDirectory() ? files(path.join(dir, e.name), name + '/') : [name];
  });
}
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const name of files(from)) {
    const target = path.join(to, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(from, name), target);
  }
}
(async () => {
  const toolchain = desktopRequire('./package.json');
  const elecVer = desktopRequire('electron/package.json').version;
  const packagerVer = JSON.parse(fs.readFileSync(path.join(ROOT, 'desktop/node_modules/@electron/packager/package.json'), 'utf8')).version;
  if (elecVer !== toolchain.devDependencies.electron || packagerVer !== toolchain.devDependencies['@electron/packager']) {
    throw new Error('Desktop toolchain differs from pins. Run npm ci --prefix desktop --ignore-scripts');
  }
  const { packager } = await import(pathToFileURL(desktopRequire.resolve('@electron/packager')).href);
  execFileSync(process.execPath, [path.join(ROOT, 'build.cjs')], { cwd: ROOT, stdio: 'inherit' });
  execFileSync(process.execPath, [path.join(__dirname, 'pack-www.cjs')], { cwd: ROOT, stdio: 'inherit' });
  // Only this generated staging tree is cleared. Never package the repository,
  // generation archive, or developer dependencies.
  fs.rmSync(STAGE, { recursive: true, force: true });
  fs.mkdirSync(STAGE, { recursive: true });
  for (const name of fs.readdirSync(path.join(ROOT, 'desktop')).filter(n => /\.(?:js|cjs)$/.test(n))) {
    fs.copyFileSync(path.join(ROOT, 'desktop', name), path.join(STAGE, name));
  }
  const ver = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  fs.writeFileSync(path.join(STAGE, 'package.json'), JSON.stringify({
    name: 'clawbyte', productName: 'CLAWBYTE', version: ver,
    description: 'CLAWBYTE — a robo-cat metroidvania', main: 'main.js',
    author: 'Zafer Dajani', license: 'UNLICENSED'
  }, null, 2) + '\n');
  copyDir(path.join(ROOT, 'www'), path.join(STAGE, 'www'));
  let commit = 'unknown', dirty = true;
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
    dirty = !!execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch { /* source archives can build, but cannot claim a commit */ }
  const manifest = {
    game: 'CLAWBYTE', packageVersion: ver, commit, dirty,
    platform, arch: 'x64', electron: elecVer, packager: packagerVer,
    node: process.version, signed: false,
    gameFiles: Object.fromEntries(files(path.join(STAGE, 'www')).map(n => [n, sha256(path.join(STAGE, 'www', n))]))
  };
  fs.writeFileSync(path.join(STAGE, 'build-info.json'), JSON.stringify(manifest, null, 2) + '\n');
  if (process.argv.includes('--stage-only')) {
    console.log('Desktop staging verified: ' + Object.keys(manifest.gameFiles).length + ' game files');
    return;
  }
  const opts = {
    dir: STAGE, out: OUT, platform, arch: 'x64', electronVersion: elecVer,
    name: 'CLAWBYTE', executableName: 'CLAWBYTE',
    overwrite: true, prune: false, asar: true,
    appVersion: ver, appCopyright: 'Copyright (c) 2026 Zafer Dajani'
  };
  const paths = await packager(opts);
  for (const dir of paths) {
    fs.copyFileSync(path.join(STAGE, 'build-info.json'), path.join(dir, 'build-info.json'));
    fs.copyFileSync(path.join(ROOT, 'desktop', 'PLAYER_README.txt'), path.join(dir, 'PLAYER_README.txt'));
    const checksums = files(dir).filter(n => n !== 'SHA256SUMS.txt').map(n => sha256(path.join(dir, n)) + '  ' + n).join('\n');
    fs.writeFileSync(path.join(dir, 'SHA256SUMS.txt'), checksums + '\n');
    console.log('Portable desktop build: ' + dir);
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
