const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});try{
const p=await b.newPage();await p.addInitScript(()=>window.requestAnimationFrame=()=>0);
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html');await p.waitForFunction(()=>typeof startGame==='function');
const rows=await p.evaluate(async()=>{
 const s=newSave(1);s.flags.tut=s.flags.woke=1;startGame(s);G.wake=G.cut=null;G.state='PLAY';const out=[];
 for(const room of ['A5','CV1','W2']){
  loadRoom(room);G.wake=G.cut=G.dialog=G.gateWalk=null;G.state='PLAY';G.enemies=[];G.boss=null;
  const own=ROOM_VISTA[room];mediaFetch(own,1);
  for(let i=0;i<100&&!MEDIA_RAW[own]?.naturalWidth;i++)await new Promise(r=>setTimeout(r,50));
  if(!MEDIA_RAW[own]?.naturalWidth)throw Error('Missing room art '+room);
  const d=gateDoors().find(d=>d.gx!=null&&d.gy!=null);if(!d)throw Error('No painted doorway '+room);
  player.x=gateWorldX(d)-90;player.y=(G.roomDef.h-2)*TILE-player.h;player.on=true;cam.x=player.x-440;cam.y=player.y-340;cam.shake=0;
  const snap=()=>{draw(2000);const v=G._vista;return {x:v.x,y:v.y,w:v.w,h:v.h,dx:v.x+v.w*d.gx+camSX()-gateWorldX(d),dy:v.y+v.h*d.gy+camSY()-(G.roomDef.h-2)*TILE};};
  const a=snap();cam.x+=75;const z=snap();let mouths=0;
  if(room!=='W2'){const old=drawCaveMouth;drawCaveMouth=()=>{mouths++;};try{drawGateDoor({},d,0);}finally{drawCaveMouth=old;}}
  out.push({room,a,z,mouths});
 }return out;
});
for(const r of rows){assert(Math.abs(r.a.dx)<.01&&Math.abs(r.a.dy)<.01,r.room+' threshold anchor');assert(Math.abs(r.z.x-r.a.x+75)<.01,r.room+' camera drift');assert.equal(r.a.w,r.z.w);assert.equal(r.mouths,0,r.room+' duplicate mouth');}
console.log('PASS painted cave/city thresholds follow world anchors through camera travel; no duplicate cave-mouth overlay');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
