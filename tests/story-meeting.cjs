const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});try{const p=await b.newPage();await p.goto('http://127.0.0.1:8220/index.html');await p.waitForFunction(()=>typeof startGame==='function');const result=await p.evaluate(()=>{
window.requestAnimationFrame=()=>0;const s=newSave(1);s.time=99;s.flags.woke=s.flags.tut=1;startGame(s);loadRoom('A2');G.wake=G.cut=G.dialog=G.trans=null;G.state='PLAY';G.enemies=[];G.projs=[];
player.x=MEET_X;const g=groundColumnAt(player.x+player.w/2);player.y=Math.min(...g)-player.h;player.vx=player.vy=0;player.on=true;const hits=[];const hurt=player.hurt.bind(player);player.hurt=(...args)=>{hits.push({args,x:player.x,y:player.y,phase:G.meet&&G.meet.ph});return hurt(...args)};const cores=player.cores;meetCheck();const start=player.x,phases=new Set();keys.ArrowLeft=false;
for(let i=0;i<1000&&G.meet;i++){phases.add(G.meet.ph);keys.ArrowLeft=G.meet.ph==='wind'||G.meet.ph==='swipe';update(1/60);for(const k in keysP)delete keysP[k];}
delete keys.ArrowLeft;
if(G.meet)throw Error('meeting did not end');if(player.x>=start-80)throw Error('movement was held');if(player.cores!==cores)throw Error('escaping caused damage '+JSON.stringify(hits));
// Contact case: use the same production swipe at its last tell frame.
const boss=new Boss('glitch',player.x+150,player.y+player.h);boss.face=-1;boss.meet=true;boss.st='swipe';boss.t=.19;G.boss=boss;G.meet={ph:'swipe',t:0,hit:false,interactive:true};
player.x=boss.x-55;player.y=boss.y+boss.h-player.h;player.iT=0;const before=player.cores;meetStep(.02);
if(player.cores!==before-1)throw Error('actual paw contact caused no damage');
return {phases:[...phases],escapedWithoutDamage:true,movement:start-player.x,contactDamage:before-player.cores};
});console.log('PASS readable and escapable first guardian',result);}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
