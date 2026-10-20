// Pin source, environment and inherited evidence gap before the full collector.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../../../..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const files=[...fs.readdirSync(path.join(root,'js')).filter(x=>x.endsWith('.js')).map(x=>'js/'+x),
 ...fs.readdirSync(path.join(root,'tests')).filter(x=>x.endsWith('.cjs')).map(x=>'tests/'+x),
 'build.cjs','tools/studio/audit.py','tools/studio/test_audit.py',
 'docs/studio/runs/2026-10-20/setup/browser-wrapper.cjs','docs/studio/runs/2026-10-20/setup/fonts.conf'];
const identity={date:'2026-10-20',branch:git('branch','--show-current'),parent:git('rev-parse','HEAD'),
 main_at_intake:'62d75d204c6f6264f25150bb419fc262ff2c18ea',integration_at_intake:'62d75d204c6f6264f25150bb419fc262ff2c18ea',
 build:fs.readFileSync(path.join(root,'index.html'),'utf8').match(/BUILD_ID\s*=\s*['"]([^'"]+)/)?.[1],
 files:Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(path.join(root,f)))])),
 environment:{node:process.version,chromium:'153.0.8010.0',dependency:'external @sparticuz/chromium153.0.0',CJK:'host Droid Sans Fallback, provenance in setup',campaignVideo:false,physicalDevices:false},
 scope:'Review only; no main/integration/production writes.'};
fs.writeFileSync(path.join(__dirname,'identity.json'),JSON.stringify(identity,null,2)+'\n');
const old=JSON.parse(fs.readFileSync(path.join(__dirname,'../2026-10-19/automated/results.json')));
const logs=old.results.filter(x=>x.log).map(x=>{const p=path.join(__dirname,'../2026-10-19/automated',x.log);return{file:x.log,expected:x.sha256,actual:hash(fs.readFileSync(p))};});
fs.writeFileSync(path.join(__dirname,'setup/inherited-log-integrity.json'),JSON.stringify({scope:'Read-only comparison of retained original19 logs. No reruns/substitution.',checked:logs.length,mismatches:logs.filter(x=>x.expected!==x.actual)},null,2)+'\n');
console.log(JSON.stringify({build:identity.build,frozenFiles:files.length,inheritedLogMismatches:logs.filter(x=>x.expected!==x.actual)},null,2));
