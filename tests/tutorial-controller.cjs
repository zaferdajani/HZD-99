// Regression of the assembled production tutorial, including the final controller.
const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const src=fs.readFileSync('js/game.js','utf8');
const start=src.indexOf('const TUT_STEPS ='), end=src.indexOf('const MOD_LESSON =',start);
const c={G:{state:'PLAY',roomId:'A0',roomDef:{w:64,exits:{R:'A1'}},save:{flags:{},iq:0},
  enemies:[],statics:[],near:null},player:{x:250,y:400,w:24,h:36,on:true,vx:160,vy:0,volts:33,cores:3,maxCores:()=>5},
  window:{},TILE:32,PLAYER_STEP_UP:24,keys:{ArrowRight:1},keysP:{ArrowUp:1},inputSuspended:false,
  gateWorldX:d=>d.x,door:{x:640,style:'booth'},gateDoors(){return[this.door];},
  gateHere(){return Math.abs(c.player.x+12-c.door.x)<90?c.door:null;},
  solidAt:(tx,ty)=>tx===13&&ty>=12,
  TOUCH:{enabled:false},PAD:{on:false},performance:{now:()=>100},cam:{x:0,y:0},
  sfx(){},persist(){},burst(){},addPart(){},rnd:()=>0,inD:()=>false, t:k=>k};
// VM globals have their own this; use closures for fixtures, not this-binding.
c.gateDoors=()=>[c.door];
vm.createContext(c);vm.runInContext(src.slice(start,end),c);
vm.runInContext(fs.readFileSync('js/tutorial_enforce.js','utf8'),c);
const run=s=>vm.runInContext(s,c);
const step=id=>{c.G.tut={i:run(`TUT_STEPS.findIndex(s=>s.id===${JSON.stringify(id)})`),hold:0,t:1};};
const prompt=()=>c.tutPrompt(run('TUT_STEPS[G.tut.i]'));
// Exact reported screenshot: saved buy step, approach outside the workshop.
step('buy');c.G.walkthroughLock={x:250,active:true};c.G.tutHardLock={x:250,active:true};
assert.equal(prompt().label,'tut_approach');assert.equal(prompt().action,'MOVE');
c.tutorialTick();assert.equal(c.tutAllows('RIGHT'),true);assert.equal(c.tutAllows('LEFT'),true);
assert.equal(c.player.x,250);assert.equal(c.player.vx,160);assert.equal(c.keys.ArrowRight,1);
assert.equal(c.G.walkthroughLock,null);assert.equal(c.G.tutHardLock,null);
// Arrive at the actual door: UP is the only gameplay action; its edge survives.
c.player.x=628;c.tutorialTick();assert.equal(c.G.tutorialLock.action,'UP');
assert(c.tutAllows('UP'));assert(!c.tutAllows('RIGHT'));assert.equal(c.keysP.ArrowUp,1);
assert(c.tutAllows('PAUSE'));assert(c.tutAllows('BACK'));
// Entering another room releases the old action even though the saved step stays buy.
c.G.roomId='A0B';c.player.x=100;
const npc={type:'npc',extra:'ratchet',x:300,y:400,w:32,h:36};c.G.statics=[npc];
c.tutorialTick();assert.equal(prompt().action,'MOVE');assert.equal(c.G.tutorialLock,null);assert(c.tutAllows('RIGHT'));
c.G.near={x:100,y:400,w:32,h:36};c.tutorialTick();assert.equal(c.G.tutorialLock,null,'unrelated nearby object does not lock');
c.G.near=npc;c.tutorialTick();assert.equal(c.G.tutorialLock.action,'INT');assert(c.tutAllows('INT'));
// Shop and other UI controls cannot be captured by a gameplay lesson.
for(const state of ['SHOP','PAUSE','SKILL','DIALOG','RIDDLE','DEATH']) {
 c.G.state=state;c.tutorialTick();assert.equal(c.G.tutorialLock,null);
 for(const input of ['UP','DOWN','LEFT','RIGHT','OK','BACK','PAUSE']) assert(c.tutAllows(input),state+' '+input);
}
c.G.state='PLAY';c.G.dialog={};c.tutorialTick();assert(c.tutAllows('OK'));c.G.dialog=null;
// Approaching an enemy never announces attack before it is in actual range.
c.G.roomId='A0';c.G.near=null;step('atk');c.player.x=10;
const update=()=>{}, enemy={x:200,y:400,w:24,h:36,hp:3,vx:30,vy:0,update};c.G.enemies=[enemy];
assert.equal(prompt().action,'MOVE');c.tutorialTick();assert.equal(c.G.tutorialLock,null);
c.player.x=150;c.tutorialTick();assert.equal(prompt().action,'ATK');assert(c.tutAllows('ATK'));
assert(!c.tutAllows('RIGHT'));assert.notEqual(enemy.update,update);assert.equal(enemy.vx,0);
// A successful blow's knockback is never erased by releasing the lesson.
enemy.vx=120;c.G.tut.hold=.7;c.tutorialTick();assert.equal(enemy.update,update);assert.equal(enemy.vx,120);
assert(c.tutAllows('RIGHT'),'acknowledgement permits steering');
// The jump is demonstrated at a real rise, not merely anywhere in W2.
c.G.enemies=[];c.G.roomId='W2';step('jump');c.player.x=20;c.player.y=400;c.player.on=true;
assert.equal(prompt().action,'MOVE');c.tutorialTick();assert.equal(c.G.tutorialLock,null);
c.player.on=false;c.player.vy=-200;assert(!run('TUT_STEPS[G.tut.i].done()'),'early unrelated jump cannot pass lesson');
c.player.on=true;c.player.vy=0;c.player.x=360;c.tutorialTick();assert.equal(prompt().action,'JUMP');
assert(c.G.tut.jumpShown);assert(c.tutAllows('JUMP'));assert(!c.tutAllows('RIGHT'));
c.player.on=false;c.player.vy=-800;c.tutorialTick();assert.equal(c.G.tutorialLock,null);
assert(c.tutAllows('RIGHT'));assert(run('TUT_STEPS[G.tut.i].done()'));
// A 12px lip is a walkable irregularity, never a jump lock.
c.player.on=true;c.player.y=360;c.player.vy=0;c.tutorialTick();assert.equal(c.G.tutorialLock,null);
// The actual W2 one-way shelf is usable even without a solid floor wall.
c.G.save.flags.tut=0;step('jump');c.player.x=360;c.player.y=400;c.player.on=true;
c.solidAt=()=>false;c.tileAt=(tx,ty)=>tx>=10&&tx<=15&&ty===11?'=':'.';
assert(c.tutJumpAtObstacle(),'actual W2 one-way shelf must announce jump');
c.tutorialTick();assert.equal(c.G.tutorialLock.action,'JUMP');
assert.equal(prompt().target.y,11*32,'marker points to the shelf rather than empty ground');
c.solidAt=(tx,ty)=>ty===12;
assert(!c.tutJumpAtObstacle(),'a ceiling makes the shelf unreachable');
c.solidAt=()=>false;c.player.x=20;
assert(!c.tutJumpAtObstacle(),'shelf must be within horizontal jumping reach');
// Completed or dead/paused players never retain enemy wrappers.
c.G.save.flags.tut=1;c.tutorialTick();assert(c.tutAllows('RIGHT'));assert.equal(c.G.tutorialLock,null);
console.log('PASS: complete tutorial controller — workshop travel, exact usable verbs, saved steps, menus, jump readiness, enemy restoration and input edges');
