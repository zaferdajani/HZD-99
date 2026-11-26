#!/usr/bin/env node
'use strict';

const fs = require('fs');
const src = fs.readFileSync('js/sewer.js', 'utf8');
const world = fs.readFileSync('js/game.js', 'utf8');

function must(re, message) {
  if (!re.test(src)) throw new Error(message);
}

must(/SW_CAVES\._gate\s*=\s*GATE_ROOM\.GB1/, 'hero-world GB1 gate is not preserved');
must(/\.\.\.r,\s*to:\s*'B6',\s*ax:\s*26\s*\/\s*32,\s*need:\s*'bossCarrier'/s,
  'robot sewer GB1 return does not target the Carrier relay gallery');
must(/GATE_ROOM\.GB1\s*=\s*on\s*\?\s*plain\s*:\s*SW_CAVES\._gate/,
  'world-specific GB1 gate selection is missing');
if (!/B6:\s*\{[^}]*to:\s*'GB1'[^}]*style:\s*'hatch'[^}]*lock:\s*'bossCarrier'/s.test(world))
  throw new Error('B6 hatch no longer gates entry to the sewer after CARRIER');

console.log('sewer route contract: PASS — B6 hatch and GB1 return form one gated loop');
