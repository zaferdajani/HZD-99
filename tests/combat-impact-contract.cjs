const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
let time = 1000, debris = [], sounds = [];
const no = () => {};
const ctx = vm.createContext({console, performance:{now:()=>time}, TILE:32, PAL:{A:{glow:'#fff'}},
  inD:()=>false, inP:()=>false, clamp:(n,a,b)=>Math.max(a,Math.min(n,b)), lerp:(a,b,k)=>a+(b-a)*k,
  rnd:(a,b)=>(a+b)/2, chance:()=>false, isHero:()=>false, burst:no, addPart:no,
  sfx:n=>sounds.push(n), metalBurst:(...v)=>debris.push(v), cam:{shake:0},
  infEyeReduced:()=>false, player:{vx:0,face:1},
  G:{save:{diff:1,equip:[],abil:{},skills:[],relics:[],flags:{},broken:{},coresMax:5,weaponVersion:1,weaponMode:'claws',time:1},
    roomId:'A1',roomDef:{zone:'A',w:60,h:20},grid:Array.from({length:20},(_,i)=>(i===15?'#':'.').repeat(60)),
    enemies:[],projs:[],statics:[],plats:[],hitStop:0,addRing:no,toast:no}});
for(const name of ['types','weapons','entities','combat-stats']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+name+'.js'),'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
run('var pl = new Player(200,400); player = pl; var e = new Enemy("crawler",250,400); e.hp=100; e.hpMax0=100;');
assert.equal(run('e.defense'),0);
assert.equal(run('dealDmg(e,12,null,250,400,true,"slash")'),12);
assert.equal(run('e.hp'),88); assert.equal(run('e.impactUntil'),1045); assert.equal(debris.length,1);
run('e.defense=25');
assert.equal(run('dealDmg(e,12,null,250,400,true,"slash")'),9);
assert.equal(run('combatDamage(0,50)'),0); assert.equal(run('combatDamage(NaN,50)'),0);
assert.equal(run('combatDamage(10,1000)'),3,'defense bounded at 75%');
const before=run('e.hp'); const debrisBefore=debris.length;
for(const state of ['rescued','friendly','dead','disabled','tame','meet']){
  run(`e.${state}=true`); assert.equal(run('dealDmg(e,100,null,250,400,true,"burst")'),0); run(`e.${state}=false`);
}
assert.equal(run('e.hp'),before); assert.equal(debris.length,debrisBefore);
run('e.calm=true; e.mechanism="winch"');
assert.equal(run('combatProtected(e)'),false,'calm tutorial winch remains strikeable');
run('e.mechanism=null'); assert.equal(run('combatProtected(e)'),true);
run('e.calm=false');
run('player.burstImpactDone=false; player.vx=0; G.hitStop=0; combatImpact(e,250,400,"burst")');
assert.equal(run('G.hitStop'),.12); assert.equal(run('player.vx'),-90); assert.equal(run('e.impactUntil'),1085);
assert.equal(debris.at(-1)[2],14);
run('combatImpact(e,250,400,"burst")'); assert.equal(run('player.vx'),-90,'area burst recoils once, not once per victim');
run('player.swirlImpactDone=false; player.vx=0; combatImpact(e,250,400,"swirl"); combatImpact(e,250,400,"swirl")');
assert.equal(run('player.vx'),-90,'hurricane contact does not stack recoil');
ctx.infEyeReduced=()=>true;
run('G.hitStop=0; player.burstImpactDone=false; combatImpact(e,250,400,"burst")');
assert.equal(run('G.hitStop'),0); assert.equal(run('e.impactUntil'),time); assert.equal(debris.at(-1)[2],2);
ctx.infEyeReduced=()=>false;
run('e.guard=true; e.dir=1; e.defense=0'); const n=debris.length;
assert.equal(run('dealDmg(e,12,null,e.x+e.w, e.y+e.h/2,true,"slash")'),0);
assert.equal(debris.length,n,'blocked shield chip has no successful-hit debris');
for(const zone of ['A','B','C','D','E','X']) {
  ctx.G.roomDef.zone=zone;
  run('var z = new Enemy("guard",0,0)');
  assert.ok(run('Number.isFinite(z.hp)&&Number.isFinite(z.defense)&&Number.isFinite(z.attackPower)&&Number.isFinite(z.attackSpeed)'));
}
run('for(let i=0;i<250;i++) combatLog(e,12,9,"slash")'); assert.equal(run('COMBAT_LOG.length'),200);
assert.equal(run('combatLogData().version'),'2026-10-16.1');
ctx.G.save.flags={crystal:1,crystal2:1,connector:1};
const values=[];
for(const mode of ['claws','single','dual','joined']) { ctx.G.save.weaponMode=mode; values.push(run('player.dmg()')); }
assert.deepEqual(values,[12,16,19,23]);
ctx.G.save.weaponMode='claws'; assert.equal(run('player.attackDmg("burst")'),38);
assert.ok(run('player.attackDmg("burst") >= 2 * player.attackDmg("slash")'));
console.log('PASS production combat: damage/armor, protected targets, charged contact, bounded effects/log, weapon progression');
