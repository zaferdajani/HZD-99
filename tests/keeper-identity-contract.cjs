// Owner ruling, 2026-11-14: NULLFANG is the Meadow Sage. The hooded GA1D
// character is the Meadow Keeper. Internal sage* save/entity names remain
// stable, but player-facing copy must never swap those identities again.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const opening = read('js/text-opening.js');
const manhwa = read('js/text-manhwa.js');
const i18n = read('js/i18n.js');
const script = read('docs/STORY_SCRIPT.md');
const caves = read('docs/CAVES_CH1.md');

for (const [label, value] of [
  ['English', 'Free the Meadow Keeper'],
  ['Arabic', 'حرّري حارس المروج'],
  ['Turkish', 'Çayır Bekçisini özgür bırak'],
  ['Chinese', '解放草原看守者'],
  ['Russian', 'Освободи Хранителя Лугов'],
]) {
  if (!opening.includes(value)) throw new Error(label + ' objective does not identify the Meadow Keeper');
}

for (const old of ['Free the first sage', 'حرّري الحكيم الأول', 'İlk bilgeyi özgür bırak',
  '解放第一位贤者', 'Освободи первого мудреца']) {
  if (opening.includes(old)) throw new Error('obsolete first-Sage objective remains: ' + old);
}

if (!manhwa.includes("pn_s_sage: 'The Meadow Keeper'")) throw new Error('GA1D panel title is not the Meadow Keeper');
if (/pn_s_sage: 'The Meadow Sage'/.test(manhwa)) throw new Error('GA1D panel still claims NULLFANG\'s Sage title');
if (!i18n.includes('NULLFANG, the Meadow Sage')) throw new Error('player-facing English no longer identifies NULLFANG as Sage');
if (!script.includes('NULLFANG, the Meadow Sage') || !caves.includes('first Sage')) {
  throw new Error('story authority does not preserve NULLFANG as the first Sage');
}
if (!script.includes('Meadow Keeper') || !caves.includes('Meadow Keeper')) {
  throw new Error('story authority does not identify the pre-lion informant as Keeper');
}

console.log('PASS keeper-identity-contract: five objectives, manhwa captions and story authority agree that GA1D is the Meadow Keeper and NULLFANG is the first Sage');
