const fs = require('fs');
const path = require('path');
const read = name => fs.readFileSync(path.join(__dirname, '..', 'js', name), 'utf8');

const ritual = read('purification.js');
const opening = read('text-opening.js');
const manhwa = read('text-manhwa.js');
const progress = read('text-progress.js');
const selected = [
  ...ritual.split('\n').filter(line => /^\s*(en|ar|tr|zh|ru): \[/.test(line) || line.includes("setAttribute('aria-label'")),
  ...opening.split('\n').filter(line => line.includes('op_o_lion:')),
  ...manhwa.split('\n').filter(line => /pn_s_free:|pc_blade:|pc_oath:/.test(line)),
  ...progress.split('\n').filter(line => line.includes('pure_beast:')),
].join('\n');

for (const [name, pattern] of [
  ['English free', /\bfree(?:s|d)?\b/i],
  ['Arabic free', /حر[ّ]?ر|تحر[ّ]?ر|حرّ/],
  ['Turkish free', /özgür|kurtar/i],
  ['Chinese free', /自由|解放/],
  ['Russian free', /освобод|свобод/i],
]) {
  if (pattern.test(selected)) throw new Error(name + ' remains in purification copy');
}
for (const required of ['Purify the guardian', 'طهّر الحارس', 'Muhafızı arındır', '净化守护者', 'Очистите стража']) {
  if (!selected.includes(required)) throw new Error('missing localized purification action: ' + required);
}
if (!ritual.includes("setAttribute('aria-label', purificationText(0))"))
  throw new Error('purification accessibility label is not localized from the action copy');
console.log('PASS purification is named consistently in all five languages and accessibility copy');
