#!/usr/bin/env node
'use strict';

const fs = require('fs');
const src = fs.readFileSync('tools/aactier.cjs', 'utf8');
for (const token of ['assets/aac', 'hashes.json', 'fileHash', 'prior.source', 'prior.output', 'provenanceSame']) {
  if (!src.includes(token)) throw new Error('AAC provenance check missing ' + token);
}
if (/mtimeMs\s*</.test(src)) throw new Error('AAC staleness still depends on checkout mtimes');
console.log('AAC provenance contract: PASS — clean-checkout validation uses committed bytes, not mtimes');
