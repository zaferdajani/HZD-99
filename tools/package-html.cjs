module.exports = function packageHTML(html) {
  if (typeof html !== 'string') throw new TypeError('Expected game HTML');
  const out = html.replace(/if \('serviceWorker' in navigator && location\.protocol === 'https:'\) \{\r?\n[\s\S]*?\r?\n\}/g,
    '// Native package owns its code and assets; no service-worker registration.');
  if (/navigator\.serviceWorker\.register\s*\(/.test(out))
    throw new Error('Unrecognized service-worker registration in native payload');
  return out;
};
