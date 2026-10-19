// Evidence integrity only. A complete record of failures is not a release pass.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..'),auto=path.join(__dirname,'automated');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const result=read(path.join(auto,'results.json')),identity=read(path.join(__dirname,'identity.json'));
assert(result.finished_utc,'collector must have finished');
assert.equal(result.complete_requested_scope,true,'no requested harness omitted');
const source=fs.readFileSync(path.join(root,'tests/run.cjs'),'utf8').match(/const SUITE = \[([\s\S]*?)\n\];/)[1];
const names=[...source.matchAll(/^\s*\['([^']+)'/gm)].map(m=>m[1]);
for(const name of names)assert.equal(result.results.filter(r=>r.name===name).length,1,'exactly one '+name);
const logChecks=result.results.filter(r=>r.log).map(entry=>({name:entry.name,file:entry.log,expected:entry.sha256,actual:hash(path.join(auto,entry.log))}));
const mismatches=logChecks.filter(entry=>entry.expected!==entry.actual);
for(const [file,sha] of Object.entries(identity.files))assert.equal(hash(path.join(root,file)),sha,'frozen source '+file);
for(const stage of ['start','end']){
 const entry=result.results.find(r=>r.name==='server-identity'&&r.when===stage);
 assert.equal(entry.status,'pass',stage+' HTTP identity');
 for(const [file,sha] of Object.entries(entry.files))assert.equal(hash(path.join(root,file)),sha,stage+' selected HTTP byte hash '+file);
}
const campaign=read(path.join(auto,'campaign-ch1/result.json'));
assert.deepEqual(result.results.find(r=>r.name==='campaign-ch1').campaign,campaign,'campaign embedded record equals artifact');
for(const doc of ['REPORT.md','CLAUDE_PROMPT.md'])assert(!/VALIDATION_PENDING/.test(fs.readFileSync(path.join(__dirname,doc),'utf8')),doc+' has no placeholder');
const failed=result.results.filter(r=>r.status!=='pass').map(r=>({name:r.name,status:r.status}));
assert.equal(result.passed,result.complete_requested_scope&&failed.length===0,'aggregate verdict matches evidence');
const proof={scope:'Evidence integrity, not release/art/device approval. Mismatched original logs are not repaired by later reruns.',build:identity.build,registeredHarnesses:names.length,checkedLogHashes:logChecks.length,matchedLogHashes:logChecks.length-mismatches.length,mismatches,frozenSourceHashes:Object.keys(identity.files).length,selectedHttpFiles:5,failed,campaignCertified:campaign.certified,collectorPassed:result.passed,integrity:mismatches.length?'fail':'pass'};
fs.writeFileSync(path.join(__dirname,'evidence-integrity.json'),JSON.stringify(proof,null,2)+'\n');
console.log(JSON.stringify(proof,null,2));
assert.equal(mismatches.length,0,'Every original log must match its collector hash; retain/report mismatches, never silently replace with a rerun');
