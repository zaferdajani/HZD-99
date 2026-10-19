// Archive selected completed opening captures, never touches the active campaign.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..'),from=path.join(root,'tests/out/opening-order'),to=path.join(__dirname,'automated/opening-frames');
const results=JSON.parse(fs.readFileSync(path.join(__dirname,'automated/results.json')));
assert.equal(results.results.find(r=>r.name==='opening-order')?.status,'pass','archive only completed opening');
const tails=['18-repair-board','22-pod-move','28-counter','36-burst-charging','39-monument-puzzle','42-servo-dark-cue','45-servo-awake','46-servo-coil-home'];
const selected=['desktop','phone'].flatMap(mode=>tails.map(t=>mode+'-'+t+'.png')).concat('phone-portrait-390x844.png');
const all=fs.readdirSync(from).filter(n=>/^(desktop|phone)-.*\.png$/.test(n)).sort();fs.mkdirSync(to,{recursive:true});
const files=all.map(name=>{const data=fs.readFileSync(path.join(from,name)),keep=selected.includes(name);if(keep)fs.copyFileSync(path.join(from,name),path.join(to,name));return {file:name,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex'),archived:keep};});
for(const name of selected)assert(files.some(f=>f.file===name&&f.archived),'selected capture exists '+name);
const result={scope:'Fresh completed opening-order: selected raw screenshots archived; remaining capture hashes retained, not all image bytes archived. Desktop/phone viewport input is keyboard, not physical touch approval.',openingLogSha256:results.results.find(r=>r.name==='opening-order').sha256,files};
fs.writeFileSync(path.join(to,'manifest.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({captured:files.length,archived:files.filter(f=>f.archived).length}));
