const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({G:{save:{storyVersion:2,flags:{}},roomId:'GA1D',state:'PLAY'},isHero:()=>false,persist(){},t:k=>k});
vm.runInContext(fs.readFileSync('js/story-opening.js','utf8'),ctx);
assert.match(ctx.openingGateHint('A4'),/raw marble/);
ctx.G.save.flags.crystal=1;assert.match(ctx.openingGateHint('A4'),/Sage/);
ctx.G.save.flags.sageTame_GA1D=1;assert.match(ctx.openingGateHint('A4'),/CHIME/);
ctx.G.save.flags.bossChime=1;assert.equal(ctx.openingGateHint('A4'),'');
ctx.G.save.flags={};assert.equal(ctx.openingGateHint('A2'),'','early encounter and return routes remain open');
ctx.G.save.flags.bossGlitch=1;assert.equal(ctx.openingGateHint('A4'),'','completed old encounter stays accessible');
delete ctx.G.save.storyVersion;assert.equal(ctx.openingGateHint('A4'),'','legacy saves keep their route');
ctx.G.save.storyVersion=2;ctx.G.save.flags={};
for(const npc of ['servo','mono','patch','sage','lumen','kerf']) {
 const lines=ctx.survivorStory({extra:npc},['existing quest']);
 assert(lines.length>1);assert.equal(lines.at(-1),'existing quest');
 assert.equal(ctx.survivorStory({extra:npc},['existing quest']).length,1,'survival story only once per save');
}
let oldCallback=0;ctx.G.dialog={onEnd:()=>oldCallback++};ctx.firstSageRevelation();
assert.equal(ctx.G.save.flags.chimeRevealed,1);ctx.G.dialog.onEnd();assert.equal(oldCallback,1);
assert(ctx.G.dialog.lines.some(s=>s.includes('CHIME')));assert.equal(ctx.G.state,'DIALOG');
const previous=ctx.G.dialog;ctx.firstSageRevelation();assert.equal(ctx.G.dialog,previous);
console.log('PASS opening: earned marble/sword/sage/CHIME order, legacy routes, six distinct survivor histories, once-only reveal preserving reward callback');
