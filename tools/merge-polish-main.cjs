const fs=require('node:fs'),{execFileSync,spawnSync}=require('node:child_process');
const main='2fefc881265520e288ee4dd4a1216dc963e1509a';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
if(spawnSync('git',['merge-base','--is-ancestor',main,'HEAD']).status===0){console.log('Reviewed main changes already integrated');process.exit(0);}
if(git('rev-parse','origin/main')!==main)throw Error('main changed again; review new commits before merging');
const ownBuild=fs.readFileSync('build.cjs','utf8'),ownGait=fs.readFileSync('tests/gait.cjs','utf8');
const incomingBuild=execFileSync('git',['show',main+':build.cjs'],{encoding:'utf8'});
git('config','user.name','github-actions[bot]');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');
const merged=spawnSync('git',['merge','--no-commit','--no-ff',main],{stdio:'inherit'});
if(merged.status!==0&&merged.status!==1)throw Error('Merge command failed');
const conflicts=git('diff','--name-only','--diff-filter=U').split('\n').filter(Boolean);
const generated=['index.html','odyssey.html','forge.html','forge-odyssey.html'];
const allowed=new Set([...generated,'build.cjs','tests/gait.cjs']);
if(conflicts.some(f=>!allowed.has(f)))throw Error('Unreviewed conflict: '+conflicts.join(','));
// main changes only seoBlock in the build script; keep that exact function
// together with staging's embedded animation and content-aware build identity.
const seo=incomingBuild.split('\n').find(line=>line.startsWith('function seoBlock('));
if(!seo)throw Error('Missing reviewed SEO function');
fs.writeFileSync('build.cjs',ownBuild.split('\n').map(line=>line.startsWith('function seoBlock(')?seo:line).join('\n'));
// Retain main's authored-gait observation AND staging's stronger assertions
// on opaque foot travel and unique frames; do not substitute the weaker OR.
let gait=ownGait;
if(!gait.includes('let authoredGait = false;'))gait=gait.replace('    const strideStart = player.stridePh || 0, animStart = player.anim;','    let authoredGait = false;\n    const strideStart = player.stridePh || 0, animStart = player.anim;');
if(!gait.includes('if (player._authoredGait) authoredGait = true;'))gait=gait.replace('      lifts.push(player._stepLift || 0);','      lifts.push(player._stepLift || 0);\n      if (player._authoredGait) authoredGait = true;');
if(!gait.includes('return { authoredGait, actualFootLift'))gait=gait.replace('return { actualFootLift,','return { authoredGait, actualFootLift,');
if(!gait.includes('r.actualFootLift >= 1.5')||!gait.includes('r.uniqueStrideFrames >= 8'))throw Error('Measured gait requirements lost');
fs.writeFileSync('tests/gait.cjs',gait);
for(const file of generated)if(conflicts.includes(file))git('checkout','--ours','--',file);
execFileSync(process.execPath,['build.cjs'],{stdio:'inherit'});
git('add','build.cjs','tests/gait.cjs',...generated);
if(git('diff','--name-only','--diff-filter=U'))throw Error('Unresolved merge conflict');
git('diff','--check','--cached');
git('commit','-m','Integrate reviewed main changes: preserve boss diagnostics, metadata and art-review backlog; retain stronger gait checks');
console.log('Merged source',git('rev-parse','HEAD'));
