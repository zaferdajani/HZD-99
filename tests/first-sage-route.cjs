const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});try{const p=await b.newPage();await p.goto('http://127.0.0.1:8220/index.html');await p.waitForFunction(()=>typeof startGame==='function');const result=await p.evaluate(()=>{
window.requestAnimationFrame=()=>0;const s=newSave(1);s.time=99;s.flags.woke=s.flags.tut=1;startGame(s);
const check=(v,n)=>{if(!v)throw Error(n)};const enter=r=>{loadRoom(r);G.state='PLAY';G.wake=G.cut=G.dialog=G.trans=null;G.enemies=[];G.boss=null;G.projs=[];for(const k in keys)delete keys[k];for(const k in keysP)delete keysP[k];};
// (2026-11-16: the maintenance ring STANDS in the quarry from the start, dark — a door is woken, not popped in. Before the forge it is not a way through.)
enter('CV3');check(!gateDoors().some(d=>d.to==='GA1T'&&!gateLocked(d)),'no maintenance shortcut before forge');
{const d0=gateDoors().find(d=>d.to==='GA1T');if(d0){player.x=gateWorldX(d0)-player.w/2;const g0=groundColumnAt(player.x+player.w/2);player.y=Math.min(...g0)-player.h;player.on=true;check(!gateEnter()&&G.roomId==='CV3','the dark ring refuses her');G.dialog=null;G.state='PLAY';}}
// This harness isolates geometry; chapter-one obtains this sword through Ratchet.
grantWeapon('single');
// (the agent's ring wakes when the bell is silent: the bell before the agent, owner 2026-11-25)
{enter('CV3');const d1=gateDoors().find(d=>d.to==='GA1T');check(d1&&gateLocked(d1),'with the blade alone the ring is still dark');}
G.save.flags.bossChime=1;check(!G.save.flags.bossGlitch&&!G.save.flags.dash&&!G.save.flags.djump,'no guardian powers in fixture');
const out=[];
for(const [from,to,tx] of [['CV3','GA1T',30],['GA1T','CV3',16]]){
enter(from);const d=gateDoors().find(d=>d.to===to);check(d,'maintenance entrance exists');
player.x=tx*TILE;const ground=groundColumnAt(player.x+player.w/2);player.y=Math.min(...ground)-player.h;player.vx=player.vy=0;player.on=true;
const goal=gateWorldX(d)-player.w/2;keys.ArrowRight=true;let last=player.x,stuck=0;
for(let i=0;i<900&&player.x<goal-8;i++){keys.Space=!!(stuck>8&&player.on);keysP.Space=keys.Space;player.update(1/60);delete keysP.Space;stuck=Math.abs(player.x-last)<.1?stuck+1:0;last=player.x;}
for(const k in keys)delete keys[k];check(Math.abs(player.x-goal)<40,'door reached by walking and basic jump');
player.vx=0;for(let w=0;w<400&&(ringAsleep(d)||G.ringWake);w++)ringWakeStep(1/60);player.stunT=0;const accepted=gateEnter();check(accepted,'door accepts interaction');for(let i=0;i<400&&G.gateWalk;i++)updateGateWalk(1/60);check(G.roomId===to,'gate walk arrives');out.push({from,to,x:player.x});
}
check(!G.save.flags.bossGlitch,'guardian still undefeated');return out;
});console.log('PASS first-sage maintenance route before guardian',result);}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
