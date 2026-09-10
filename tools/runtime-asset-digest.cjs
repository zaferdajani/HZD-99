const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
// Stable across OS and checkout times. Generation archives and credit prose
// are not runtime bytes; same-name audio/image replacements absolutely are.
module.exports = function runtimeAssetDigest(root = 'assets') {
  const hash = createHash('sha256');
  const walk = (dir, prefix = '') => {
    for (const name of fs.readdirSync(dir).sort()) {
      if (!prefix && name === 'source') continue;
      const file = path.join(dir, name), relative = prefix + name;
      const stat = fs.lstatSync(file);
      if (stat.isSymbolicLink()) throw new Error('Runtime asset cannot be a symlink: ' + relative);
      if (stat.isDirectory()) { walk(file, relative + '/'); continue; }
      if (!stat.isFile() || /\.md$/i.test(name)) continue;
      const bytes = fs.readFileSync(file);
      hash.update(JSON.stringify([relative, bytes.length]));
      hash.update(createHash('sha256').update(bytes).digest());
    }
  };
  walk(root);
  return hash.digest('hex');
};
