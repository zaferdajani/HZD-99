// Keep reproducible media identity without duplicating embedded image payloads
// in a diagnostic JSON. This never rewrites image/game asset bytes.
const fs = require('node:fs'), crypto = require('node:crypto');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function compact(value) {
  if (typeof value === 'string' && /^data:[^,]*;base64,/.test(value)) {
    const comma = value.indexOf(','), bytes = Buffer.from(value.slice(comma + 1), 'base64');
    return {type: 'embedded-media-reference', mimeType: value.slice(5, value.indexOf(';')),
      bytes: bytes.length, sha256: digest(bytes), dataURLSha256: digest(value)};
  }
  if (Array.isArray(value)) return value.map(compact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,compact(v)]));
  return value;
}
module.exports = compact;
if (require.main === module) {
  const file = process.argv[2]; if (!file) throw Error('Supply a diagnostic JSON path.');
  const result = compact(JSON.parse(fs.readFileSync(file, 'utf8')));
  result.embeddedURLPolicy = 'Embedded base64 media replaced with MIME, byte count, content and URL SHA-256; original asset bytes untouched.';
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({file,bytes:fs.statSync(file).size}));
}
