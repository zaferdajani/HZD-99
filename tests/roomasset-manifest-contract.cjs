// Dynamically selected duel and boss plates must already be resident when the
// encounter begins. Cold-cache tests may not preload their own proof away.
const fs = require('fs');
const m = JSON.parse(fs.readFileSync('assets/roomassets.json', 'utf8'));
const fail = [];
const gateBytes = fs.statSync('assets/backgrounds/gate_city.jpg').size;
if (m.bytes.gateCity !== gateBytes) fail.push(`gateCity bytes ${m.bytes.gateCity} != ${gateBytes}`);
const rooms = { GA1D:'agTally', GA2D:'agLeash', GB1D:'agUndertow', GC1D:'agSlag', GD1D:'agRedact', GX1D:'agLapid', GE1D:'agPupil' };
for (const [room, prefix] of Object.entries(rooms)) {
  const got = new Set((m.rooms[room] && m.rooms[room].keys) || []);
  for (const key of Object.keys(m.bytes).filter(k => k.startsWith(prefix))) if (!got.has(key)) fail.push(`${room} missing ${key}`);
}
const swamp = new Set((m.rooms.SW3 && m.rooms.SW3.keys) || []);
for (const key of Object.keys(m.bytes).filter(k => k.startsWith('mj'))) if (!swamp.has(key)) fail.push(`SW3 missing ${key}`);
for (const key of ['heroHeldBare','heroHeldSingle','heroHeldDual','heroHeldJoined'])
  if (!new Set(m.boot || []).has(key)) fail.push(`boot missing ${key}`);
if (fail.length) throw new Error(fail.join('; '));
console.log('PASS gate bytes and complete agent/MIREJAW/held-hero families are current in the preload manifest');
