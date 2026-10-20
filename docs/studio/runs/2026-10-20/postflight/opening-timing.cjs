// Pure filesystem analysis. No browser, simulation, test or source mutation.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const run=path.dirname(__dirname),root=path.resolve(run,'../../../..'),manifestFile=path.join(run,'automated/opening-frames/manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestFile));
const sourceFile=path.join(root,'tests/opening-order.cjs'),source=fs.readFileSync(sourceFile),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=manifest.files||[];
const find=file=>files.find(x=>x.file===file)||null;
const modes={};
for(const mode of ['desktop','phone']){
 const frames=files.filter(x=>x.file.startsWith(mode+'-')&&!x.file.includes('-portrait-')).sort((a,b)=>a.mtimeUtc.localeCompare(b.mtimeUtc));
 const first=frames[0]||null,last=frames.at(-1)||null,charging=frames.filter(x=>x.file.includes('burst-charging'));
 modes[mode]={frameCount:frames.length,first,last,charging,frameMarkerSpanSeconds:first&&last?(Date.parse(last.mtimeUtc)-Date.parse(first.mtimeUtc))/1000:null};
}
const portrait=find('phone-portrait-390x844.png'),charge=find('phone-36-burst-charging.png');
const result={scope:'Archived original screenshot mtimeUtc markers from the closed full-run opening manifest. These are filesystem write times, NOT logged loop start/end, monotonic input timestamps, delivered charge duration, or proof of repeated failed releases.',manifestSha256:hash(fs.readFileSync(manifestFile)),testSha256:hash(source),build:manifest.build,harnessStatus:manifest.openingHarnessStatus,complete:manifest.complete,sourceLoopBudgetSeconds:240,runnerHarnessTimeoutSeconds:900,modes,phonePortraitMarker:portrait,phoneChargeMarker:charge,phonePortraitToChargeSeconds:portrait&&charge?(Date.parse(charge.mtimeUtc)-Date.parse(portrait.mtimeUtc))/1000:null,warnings:['The portrait capture occurs before returning to landscape and before the case loop deadline is initialized.','The burst-charging screenshot is inside the held-key branch, before key release and the subsequent400ms wait.','There is one archived phone burst-charging filename. This does not prove repeated unsuccessful charge/release attempts.','No actual per-case loop-start, input-dispatch, charge simulation time, release result or explicit deadline-expiry record is retained in the original harness output.','Most phone traversal is ordinary keyboard input in touch/mobile viewport emulation; this is not physical touch play.']};
const output=path.join(__dirname,'opening-timing.json');fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
