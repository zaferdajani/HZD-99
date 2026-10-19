// Importing campaign helpers must never erase the previous real-input trace.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'clawbyte-campaign-import-'));
const existing=path.join(dir,'existing'),absent=path.join(dir,'absent'),marker='existing continuous-playthrough evidence\n';
fs.mkdirSync(existing);fs.writeFileSync(path.join(existing,'campaign.log'),marker);
const run=output=>spawnSync(process.execPath,['-e','require("./tests/campaign-ch1.cjs")'],{cwd:root,env:{...process.env,CAMPAIGN_OUT:output},encoding:'utf8'});
const first=run(existing),second=run(absent);
const result={scope:'Actual module import, isolated subprocess/filesystem, no gameplay.',existingLogPreserved:fs.readFileSync(path.join(existing,'campaign.log'),'utf8')===marker,absentOutputRemainsAbsent:!fs.existsSync(absent),exitCodes:[first.status,second.status],errors:[first.stderr,second.stderr].filter(Boolean)};
if(process.env.CAMPAIGN_IMPORT_OUT)fs.writeFileSync(process.env.CAMPAIGN_IMPORT_OUT,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));assert.deepEqual(result.exitCodes,[0,0]);assert.ok(result.existingLogPreserved);assert.ok(result.absentOutputRemainsAbsent);assert.deepEqual(result.errors,[]);
