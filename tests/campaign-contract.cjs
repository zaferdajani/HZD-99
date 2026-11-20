// The long campaign's certificate must fail closed independently for every
// evidence class. campaign-ch1 remains the uninterrupted real-input run.
const { campaignCertification, REQUIRED_PANELS } = require('./campaign-ch1.cjs');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name);
};

const good = () => REQUIRED_PANELS.slice();
let r = campaignCertification('complete', good(), [], [], null, null);
check('clean complete route certifies', r.certified && r.result === 'complete', JSON.stringify(r));

r = campaignCertification('complete', good().filter(x => x !== 'sage'), [], [], null, null);
check('missing required sage pages fails', !r.certified && r.missing.includes('sage'), JSON.stringify(r));

r = campaignCertification('complete', good(), ['meet'], [], null, null);
check('a timed-out story beat fails', !r.certified && r.result === 'complete-with-missed-panels', JSON.stringify(r));

r = campaignCertification('complete', good(), [], ['ReferenceError: test'], null, null);
check('a page error fails', !r.certified && r.result === 'complete-with-page-errors', JSON.stringify(r));

const late = good(); late.splice(late.indexOf('meet'), 1); late.splice(late.indexOf('chime') + 1, 0, 'meet');
r = campaignCertification('complete', late, [], [], null, null);
check('a late corridor meeting fails chronology', !r.certified && r.orderErrors.length > 0, JSON.stringify(r));

r = campaignCertification('complete', good(), [], [], '/tmp/save.json', null);
check('restored segment is diagnostic, never a full certificate', !r.certified && r.result === 'partial-diagnostic', JSON.stringify(r));

r = campaignCertification('complete', good(), [], [], null, 'forge');
check('developer stop is diagnostic, never a full certificate', !r.certified && r.result === 'partial-diagnostic', JSON.stringify(r));

console.log('\n' + (fails.length ? fails.length + ' FAILED' : 'all campaign certificate checks passed'));
process.exit(fails.length ? 1 : 0);
