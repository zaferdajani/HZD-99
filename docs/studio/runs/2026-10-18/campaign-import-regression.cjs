// Import the actual campaign module in an isolated child. No browser or game
// state is created. An import must never erase another run's evidence.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../../..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawbyte-campaign-import-'));
const marker = 'existing continuous-playthrough evidence\n';
const existing = path.join(dir, 'existing'); fs.mkdirSync(existing);
fs.writeFileSync(path.join(existing, 'campaign.log'), marker);
const absent = path.join(dir, 'not-created');
const run = output => spawnSync(process.execPath, ['-e', 'require("./tests/campaign-ch1.cjs")'],
  {cwd: root, env: {...process.env, CAMPAIGN_OUT: output}, encoding: 'utf8'});
const first = run(existing), second = run(absent);
const result = {scope: 'Actual module import in isolated subprocess; not gameplay.',
  existingLogPreserved: fs.readFileSync(path.join(existing, 'campaign.log'), 'utf8') === marker,
  absentOutputRemainsAbsent: !fs.existsSync(absent),
  importExitCodes: [first.status, second.status],
  importErrors: [first.stderr, second.stderr].filter(Boolean)};
const file = process.env.CAMPAIGN_IMPORT_OUT;
if (file) fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
assert.deepEqual(result.importExitCodes, [0, 0]);
assert.ok(result.existingLogPreserved, 'module import must preserve campaign.log');
assert.ok(result.absentOutputRemainsAbsent, 'module import must not create an evidence directory');
