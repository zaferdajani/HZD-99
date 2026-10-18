// Supplementary reruns only, never a replacement for the retained full result.
// Wait for the full collector to finish so browser work cannot compete with it.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../../../..');
const fullFile = path.join(__dirname, 'automated/results.json');
const out = path.join(__dirname, 'rerun');
const summary = {scope: 'Separate same-build unchanged-test reruns and read-only diagnostics; not an all-pass full suite.', checks: []};
const iso = () => new Date().toISOString();
async function waitForCollector() {
  const deadline = Date.now() + 80 * 60 * 1000;
  while (Date.now() < deadline) {
    try {
      const full = JSON.parse(fs.readFileSync(fullFile, 'utf8'));
      if (full.finished_utc) return full;
    } catch (_) { /* Collector may be between JSON writes. */ }
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  throw Error('Full collector has not finished; no supplementary browser work started.');
}
async function run(name, args) {
  const log = path.join(out, name + '.log');
  const fd = fs.openSync(log, 'w');
  const entry = {name, command: [process.execPath, ...args], startedUTC: iso(), log: path.relative(__dirname, log)};
  const env = {...process.env, SERVED_IDENTITY_EXPECT: path.join(__dirname, 'automated/served-identity.json')};
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, {cwd: root, env, stdio: ['ignore', fd, fd]});
      child.on('error', reject);
      child.on('close', (code, signal) => {entry.exitCode = code; entry.signal = signal; resolve();});
    });
  } catch (error) { entry.error = String(error.stack || error); }
  finally { fs.closeSync(fd); }
  entry.finishedUTC = iso(); summary.checks.push(entry);
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(entry));
}
(async () => {
  if (!process.env.CHROMIUM_PATH) throw Error('CHROMIUM_PATH must identify the reviewed wrapper.');
  const full = await waitForCollector();
  fs.mkdirSync(out, {recursive: true});
  summary.startedUTC = iso(); summary.fullFinishedUTC = full.finished_utc;
  await run('unchanged-subset', ['tests/run.cjs', 'combat-impact-input', 'mobile-platform', 'winch-purpose', 'panels', 'filmflow', 'script-route']);
  await run('charge-diagnostic', [path.join(__dirname, 'charge-diagnostic.cjs')]);
  await run('flier-diagnostic', [path.join(__dirname, 'flier-diagnostic.cjs')]);
  summary.finishedUTC = iso();
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(summary, null, 2) + '\n');
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
