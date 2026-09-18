const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html');
 const result=await page.evaluate(async()=>{
  const keys=['heroStates','gaitWalk','gaitRun','hzdIdle','heroFidget','hzdGuard','hzdHurt','hzdHeal','hzdDeath','transAir','transLand','transDash','transSkid','transWall','transTakeoff','swingAir','swingDown','heroRecharge','heroDeparture'];
  keys.forEach(k=>mediaFetch(k,1));for(let i=0;i<100&&!keys.every(k=>MEDIA_RAW[k]?.naturalWidth);i++)await new Promise(r=>setTimeout(r,100));
  if(!keys.every(k=>MEDIA_RAW[k]?.naturalWidth))throw Error('Unloaded move art');
  const sv=newSave(1);sv.flags.tut=1;sv.flags.woke=1;startGame(sv);G.wake=null;G.artProbe=true;
  const cases=[['idle','hzdIdle',{anim:.2}],['walk','gaitWalk',{vx:150,stridePh:1}],['run','gaitRun',{vx:340,stridePh:2}],
   ['takeoff','transTakeoff',{on:false,vy:-600,takeoffT:.06,takeoff0:.12}],['rise','transAir',{on:false,vy:-400}],['apex','transAir',{on:false,vy:0}],['fall','transAir',{on:false,vy:400}],
   ['land','transLand',{landT:.06,land0:.12}],['dash','transDash',{dashT:.08,dash0:.16}],['skid','transSkid',{skidT:.07,skid0:.14}],['wall','transWall',{on:false,wallSlide:1}],
   ['guard','hzdGuard',{guardT:1}],['hurt','hzdHurt',{hurtPoseT:.15}],['heal','hzdHeal',{healT:.4}],['idle variation','heroFidget',{idleT:FIDGET_AFTER+.7}],
   ['air attack','swingAir',{on:false,swingVis:{t:.12,t0:.24,combo:0,air:true,ay:0,weaponMode:'claws'}}],
   ['plunge','swingDown',{on:false,swingVis:{t:.06,t0:.24,combo:0,air:true,ay:1,weaponMode:'claws'}}],
   ['death','hzdDeath',{dead:true}],['recharge','heroRecharge',{}]];
  const cv=document.createElement('canvas');cv.width=1200;cv.height=1000;const c=cv.getContext('2d');c.fillStyle='#253440';c.fillRect(0,0,1200,1000);const rows=[];
  for(let i=0;i<cases.length;i++){const [name,key,props]=cases[i],p=new Player(0,0);p.on=true;p.face=p.faceVis=1;Object.assign(p,props);G.recharge=name==='recharge'?{phase:'charge',t:.6,dur:1}:null;
   c.save();c.translate(i%5*240+110,Math.floor(i/5)*250+215);c.scale(2.6,2.6);
   if(p.dead){G.deadT=1.2;c.translate(-p.w/2,-p.h);p.drawDeath(c);}else p.drawRoboPlate(c,Math.abs(p.vx)>200);c.restore();
   c.fillStyle='white';c.font='15px sans-serif';c.fillText(name,i%5*240+10,Math.floor(i/5)*250+22);rows.push({name,key,drawn:G.heroDrawn});
  }
  G.recharge=null;loadRoom('W2');player.x=G.roomDef.w*TILE*GATE_ROOM.W2.at-12;player.on=true;gateEnter();
  G.gateWalk.align=1;G.gateWalk.turn=1;G.gateWalk.t=GATE_WALK*.5;drawGateWalk();
  return {rows,gate:G.gateBackKey,png:cv.toDataURL(),build:BUILD_ID};
 });
 for(const row of result.rows)assert.ok(row.drawn?.startsWith(row.key+':'),JSON.stringify(row));
 assert.equal(result.gate,'heroDeparture');assert.deepEqual(errors,[]);
 fs.mkdirSync('release-evidence',{recursive:true});fs.writeFileSync('release-evidence/hero-move-coverage.png',Buffer.from(result.png.split(',')[1],'base64'));delete result.png;
 fs.writeFileSync('release-evidence/hero-move-coverage.json',JSON.stringify(result,null,2));
 console.log('PASS '+result.rows.length+' actual-renderer move selections and supplied departure art');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
