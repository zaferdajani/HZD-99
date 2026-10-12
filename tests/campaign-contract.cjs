// The long campaign's certificate must fail closed independently for each
// evidence class. This is a pure contract test; campaign-ch1 remains the only
// uninterrupted real-input playthrough.
const { campaignCertification, REQUIRED_PANELS } = require('./campaign-ch1.cjs');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name);
};

const good = () => REQUIRED_PANELS.slice();
let r = campaignCertification('complete', good(), [], [], null, null);
check('clean complete route certifies', r.certified && r.result === 'complete', JSON.stringify(r));

r = campaignCertification('complete', good().filter(x => x !== 'passage'), [], [], null, null);
check('missing required passage fails', !r.certified && r.missing.includes('passage'), JSON.stringify(r));

r = campaignCertification('complete', good(), ['cave'], [], null, null);
check('a timed-out story beat fails', !r.certified && r.result === 'complete-with-missed-panels', JSON.stringify(r));

r = campaignCertification('complete', good(), [], ['ReferenceError: test'], null, null);
check('a page error fails', !r.certified && r.result === 'complete-with-page-errors', JSON.stringify(r));

const late = good(); late.splice(late.indexOf('cave'), 1); late.splice(late.indexOf('forge') + 1, 0, 'cave');
r = campaignCertification('complete', late, [], [], null, null);
check('a late cave introduction fails chronology', !r.certified && r.orderErrors.includes('marble'), JSON.stringify(r));

r = campaignCertification('complete', good(), [], [], '/tmp/save.json', null);
check('restored segment is diagnostic, never a full certificate', !r.certified && r.result === 'partial-diagnostic', JSON.stringify(r));

r = campaignCertification('complete', good(), [], [], null, 'forge');
check('developer stop is diagnostic, never a full certificate', !r.certified && r.result === 'partial-diagnostic', JSON.stringify(r));

console.log('\n' + (fails.length ? fails.length + ' FAILED' : 'all campaign certificate checks passed'));
process.exit(fails.length ? 1 : 0);
