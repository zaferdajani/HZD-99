// Post-collector observation of the original assertion, not a test rewrite.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../../../../..'),run=path.dirname(__dirname),out=path.resolve(process.env.WINCH_DIAG_OUT||path.join(__dirname,'winch-endpoint'));
assert(JSON.parse(fs.readFileSync(path.join(run,'automated/results.json'))).finished_utc,'Do not launch during the frozen collector');
assert(!fs.existsSync(out)||fs.readdirSync(out).length===0,'Preserve earlier evidence: choose a fresh WINCH_DIAG_OUT');fs.mkdirSync(out,{recursive:true});
const test=path.join(root,'tests/winch-purpose.cjs'),original=fs.readFileSync(test,'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const server=spawn(process.execPath,[path.join(root,'tests/serve.cjs')],{cwd:root,stdio:'ignore'});process.on('exit',()=>server.kill());
global.__studioWinchDone=()=>{server.kill();delete global.__studioWinchDone;};
const replace=(s,n,r)=>{assert.equal(s.split(n).length,2,'Unique instrumentation anchor: '+n);return s.replace(n,r);};
(async()=>{
 await new Promise(r=>setTimeout(r,300));const served=Buffer.from(await(await fetch('http://127.0.0.1:8220/index.html')).arrayBuffer());assert.equal(hash(served),hash(fs.readFileSync(path.join(root,'index.html'))),'served identity');
 fs.writeFileSync(path.join(out,'identity.json'),JSON.stringify({scope:'Original staged winch-purpose assertions retained. Added endpoint observations at final walk sample; no geometry/timing/assertion changes.',servedIndexSha256:hash(served),originalTestSha256:hash(original),diagnosticScriptSha256:hash(fs.readFileSync(__filename))},null,2)+'\n');
 let source=replace(original,"const SHOTS = path.join(__dirname, '..', 'docs', 'studio', 'runs', '2026-10-11', 'images');",'const SHOTS = '+JSON.stringify(out)+';');
 source=replace(source,'const floor = e.y + e.h, cx = e.x + e.w / 2, tip = e.armPoint();','const floor = e.y + e.h, cx = e.x + e.w / 2, tip = e.armPoint(), oldAngle = e.armAngle, oldAnim = e.anim;');
 source=replace(source,'right: player.x + player.w, pc: player.x + player.w / 2, ready: tutorialReady(tutPrompt(TUT_STEPS[G.tut.i]))','right: player.x + player.w, pc: player.x + player.w / 2, oldAngle, oldAnim, currentAnim:e.anim, currentTip:e.armPoint(), staticJamTip:e.armPoint(YARD_WINCH.tip,WINCH_JAM), barrierLimit:e.armPoint(YARD_WINCH.tip,WINCH_JAM).x-1, ready: tutorialReady(tutPrompt(TUT_STEPS[G.tut.i]))');
 const anchor="check('the strike lesson is running at the jammed winch', walkIn.step === 'atk' && walkIn.calm, walkIn);";
 source=replace(source,anchor,"fs.writeFileSync("+JSON.stringify(path.join(out,'endpoint.json'))+",JSON.stringify(walkIn,null,2)+'\\n');\n    "+anchor);
 source=replace(source,'})().catch(e => { console.error(e); process.exit(1); });','})().catch(e => { console.error(e); process.exit(1); }).finally(()=>global.__studioWinchDone());');
 const mod=new Module(test,module);mod.filename=test;mod.paths=Module._nodeModulePaths(path.dirname(test));mod._compile(source,test);
})().catch(e=>{console.error(e);process.exitCode=1;server.kill();});
