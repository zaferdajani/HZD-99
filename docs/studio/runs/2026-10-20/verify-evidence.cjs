// Strict integrity is separate from a green gameplay/art release certificate.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..'),auto=path.join(__dirname,'automated');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const result=read(path.join(auto,'results.json')),identity=read(path.join(__dirname,'identity.json'));
assert(result.finished_utc,'collector must finish');
assert(result.complete_requested_scope,'all requested scope executed');
const source=fs.readFileSync(path.join(root,'tests/run.cjs'),'utf8').match(/const SUITE = \[([\s\S]*?)\n\];/)[1];
const names=[...source.matchAll(/^\s*\['([^']+)'/gm)].map(m=>m[1]);
for(const name of names)assert.equal(result.results.filter(r=>r.name===name).length,1,'exactly one '+name);
const logs=result.results.filter(x=>x.log).map(x=>{const disk=fs.readFileSync(path.join(auto,x.log)),snapshot=Buffer.from(x.content_base64,'base64');return{name:x.name,raw:hash(disk)===x.sha256,snapshot:hash(snapshot)===x.sha256&&snapshot.length===x.bytes,same:disk.equals(snapshot)};});
for(const [file,sha]of Object.entries(identity.files))assert.equal(hash(fs.readFileSync(path.join(root,file))),sha,'frozen '+file);
for(const stage of ['start','end']){const e=result.results.find(x=>x.name==='server-identity'&&x.when===stage);assert.equal(e.status,'pass');for(const [p,sha]of Object.entries(e.files))assert.equal(hash(fs.readFileSync(path.join(root,p))),sha,stage+' HTTP '+p);}
const campaign=read(path.join(auto,'campaign-ch1/result.json'));
assert.deepEqual(result.results.find(x=>x.name==='campaign-ch1').campaign,campaign);
const failures=result.results.filter(x=>x.status!=='pass').map(x=>({name:x.name,status:x.status}));
assert.equal(result.passed,failures.length===0&&result.log_integrity.ok);
const proof={build:identity.build,registeredHarnesses:names.length,logs:logs.length,mismatches:logs.filter(x=>!x.raw||!x.snapshot||!x.same),frozenFiles:Object.keys(identity.files).length,failed:failures,collectorPassed:result.passed,campaignCertified:campaign.certified,scope:'Integrity, not release quality or device approval'};
fs.writeFileSync(path.join(__dirname,'evidence-integrity.json'),JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof,null,2));
assert.deepEqual(proof.mismatches,[],'no artifact substitution');assert(result.log_integrity.ok);
