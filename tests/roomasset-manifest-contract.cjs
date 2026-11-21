// Newly fired room art must be in the cold-load manifest with current bytes.
const fs = require('fs');
const m = JSON.parse(fs.readFileSync('assets/roomassets.json', 'utf8'));
const fail = [];
const gateBytes = fs.statSync('assets/backgrounds/gate_city.jpg').size;
if (m.bytes.gateCity !== gateBytes) fail.push(`gateCity bytes ${m.bytes.gateCity} != ${gateBytes}`);
const ga = new Set((m.rooms.GA1D && m.rooms.GA1D.keys) || []);
for (const key of ['agTallyHitHigh', 'agTallyHitLow']) if (!ga.has(key)) fail.push(`GA1D missing ${key}`);
if (fail.length) throw new Error(fail.join('; '));
console.log('PASS gate bytes and TALLYMAN first-hit plates are current in the room preload manifest');
