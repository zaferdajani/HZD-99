// The Alpha covenant may not replay after a real page/app reload.
const fs = require('fs');
const src = fs.readFileSync('js/packcall.js', 'utf8');
if (!/f\.alphaBowed\s*=\s*1\s*;[\s\S]{0,240}?persist\s*\(\s*\)/.test(src)) throw new Error('alphaBowed is not persisted when the ceremony starts');
console.log('PASS Alpha covenant ceremony is persisted once per save');

