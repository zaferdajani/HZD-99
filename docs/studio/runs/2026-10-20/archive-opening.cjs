// Retain byte-exact opening evidence, explicitly including failed/partial runs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..'),auto=path.join(__dirname,'automated'),r=JSON.parse(fs.readFileSync(path.join(auto,'results.json')));
// Safe while the later campaign runs: this completed harness owns a separate
// output directory. Copying its closed files launches no browser or game input.
const opening=r.results.find(x=>x.name==='opening-order');
assert(opening&&['pass','fail'].includes(opening.status),'harness must have closed');
const source=path.join(root,'tests/out/opening-order'),out=path.join(auto,'opening-frames');fs.mkdirSync(out,{recursive:true});
const previous=JSON.parse(fs.readFileSync(path.join(__dirname,'../2026-10-19/automated/opening-frames/manifest.json')));
const selected=new Set(previous.files.filter(x=>x.archived).map(x=>x.file));
for(const name of ['desktop-11-note-int.png','desktop-16-repair-int.png','phone-11-note-int.png','phone-16-repair-int.png'])selected.add(name);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=fs.readdirSync(source).filter(x=>x.endsWith('.png')).sort().map(file=>{const p=path.join(source,file),data=fs.readFileSync(p),archived=selected.has(file);if(archived)fs.copyFileSync(p,path.join(out,file));return{file,bytes:data.length,sha256:hash(data),mtimeUtc:fs.statSync(p).mtime.toISOString(),archived};});
const missingSelected=[...selected].filter(name=>!files.some(x=>x.file===name));
if(opening.status==='pass')assert.deepEqual(missingSelected,[],'passed opening must contain every selected milestone');
const manifest={scope:'Closed opening-order, not assumed complete: status below governs. Exact selected raw captures archived; other hashes only. Keyboard phone viewport is not physical touch.',openingHarnessStatus:opening.status,complete:opening.status==='pass',build:'5b19cbfbf709',openingLogSha256:hash(fs.readFileSync(path.join(auto,'opening-order.log'))),missingSelected,files};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({captured:files.length,archived:files.filter(x=>x.archived).length}));
