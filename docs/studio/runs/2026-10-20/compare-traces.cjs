// Read-only duplicate-trace check. Never substitutes a rerun or repairs files.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const base=path.resolve(process.argv[2]||path.join(__dirname,'automated'));
const r=JSON.parse(fs.readFileSync(path.join(base,'results.json'))),entry=r.results.find(x=>x.name==='campaign-ch1');
assert(entry?.campaign,'campaign record must be closed');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const wrapper=fs.readFileSync(path.join(base,entry.log)),nested=fs.readFileSync(path.join(base,'campaign-ch1/campaign.log'));
assert.equal(hash(wrapper),entry.sha256,'original named runner log matches recorded hash');
if(entry.content_base64)assert(wrapper.equals(Buffer.from(entry.content_base64,'base64')),'original snapshot matches raw');
const lines=b=>b.toString('utf8').split('\n').filter(x=>/^\[\d\d:\d\d\] /.test(x));
const counts=a=>{const m=new Map();for(const line of a)m.set(line,(m.get(line)||0)+1);return m;};
const a=lines(wrapper),b=lines(nested),am=counts(a),bm=counts(b);
const missing=[...am].flatMap(([line,n])=>Array(Math.max(0,n-(bm.get(line)||0))).fill(line));
const extra=[...bm].flatMap(([line,n])=>Array(Math.max(0,n-(am.get(line)||0))).fill(line));
const result={scope:'Duplicate timestamped progress-line retention, not fresh gameplay or recovery of unknown lost bytes. Full original runner log remains authoritative and hash-checked.',base,wrapperSha256:hash(wrapper),nestedSha256:hash(nested),wrapperLines:a.length,nestedLines:b.length,missingFromNested:missing,extraInNested:extra,identicalProgressLines:JSON.stringify(a)===JSON.stringify(b),campaignCertified:entry.campaign.certified};
const output=process.argv[3]||path.join(__dirname,'trace-comparison.json');fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
