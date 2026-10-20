// Audit the deliverable, not a release-quality certificate.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../..'),git=(...a)=>cp.execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const changed=git('diff','--cached','--name-only').split('\n').filter(Boolean),allowed=new Set(['docs/studio/PIPELINE.md','js/entities.js','js/touch.js','js/world.js','tests/foescale.cjs','tests/portrait-rotation.cjs','tests/studio-collector.cjs','tests/run.cjs','tools/studio/audit.py','tools/studio/test_audit.py','index.html','odyssey.html','forge.html','forge-odyssey.html']);
for(const file of changed)assert(allowed.has(file)||file.startsWith('docs/studio/runs/2026-10-20/'),'unexpected staged path '+file);
const syntax=changed.filter(x=>/\.(?:js|cjs)$/.test(x));for(const file of syntax)cp.execFileSync(process.execPath,['--check',file],{cwd:root});
let links=0;
for(const file of changed.filter(x=>x.endsWith('.md'))){const text=fs.readFileSync(path.join(root,file),'utf8');for(const m of text.matchAll(/\]\(([^)]+)\)/g)){const p=m[1].split('#')[0];if(!p||/^(?:https?:|sandbox:)/.test(p))continue;assert(fs.existsSync(path.resolve(root,path.dirname(file),p)),'missing local link '+file+' '+p);links++;}}
for(const file of ['REPORT.md','CLAUDE_PROMPT.md'])assert(!/VALIDATION_PENDING|PUBLICATION_PENDING/.test(fs.readFileSync(path.join(__dirname,file),'utf8')),'unresolved placeholder '+file);
assert.equal((fs.readFileSync(path.join(__dirname,'CLAUDE_PROMPT.md'),'utf8').match(/^```text$/gm)||[]).length,1,'one copyable prompt');
assert.equal(git('diff','--cached','--name-only','--','assets','package.json','package-lock.json'),'','no tracked assets/dependencies changed');
const opening=JSON.parse(fs.readFileSync(path.join(__dirname,'automated/opening-frames/manifest.json')));
const full=JSON.parse(fs.readFileSync(path.join(__dirname,'automated/results.json')));
assert.equal(opening.openingHarnessStatus,full.results.find(x=>x.name==='opening-order').status,'archive keeps failed opening verdict');
const archived=opening.files.filter(x=>x.archived);
for(const e of archived)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'automated/opening-frames',e.file))).digest('hex'),e.sha256,'raw opening frame '+e.file);
const result={scope:'Deliverable coherence, not game/device/art approval',stagedPaths:changed.length,syntaxFiles:syntax.length,localLinks:links,singlePrompt:true,approvedAssetBytesUnchanged:true,dependencyFilesUnchanged:true,openingHarnessStatus:opening.openingHarnessStatus,archivedOpeningFrameHashes:archived.length};
fs.writeFileSync(path.join(__dirname,'handoff-check.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
