// Staged arena, actual keyboard events and the normal real-time game loop.
// This does not claim a fresh-save campaign traversal.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
 try{
 const p=await b.newPage({viewport:{width:960,height:540}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8220/index.html');await p.waitForFunction(()=>typeof startGame==='function');
 await p.evaluate(()=>{const sv=newSave(1);sv.time=99;sv.flags.tut=sv.flags.woke=sv.flags.heal=1;startGame(sv);loadRoom('A1');G.dialog=G.wake=G.cut=G.meet=G.bossEntry=null;G.state='PLAY';G.enemies=[];G.boss=null;G.statics=[];G.tut=null;});
 await p.waitForTimeout(1000);
 await p.evaluate(()=>{
  window.__sounds=[];const orig=sfx;window.sfx=function(id,...args){__sounds.push(id);return orig(id,...args);};
  window.__home={x:player.x,y:player.y};
  window.__stage=()=>{
   G.state='PLAY';G.dialog=G.wake=G.cut=G.meet=G.bossEntry=null;G.hitStop=0;G.boomer=null;COMBAT_LOG=[];parts.length=0;
   Object.assign(player,{...__home,vx:0,vy:0,on:true,face:1,faceVis:1,swing:null,swingVis:null,atkCD:0,atkBuf:0,combo:0,comboT:0,chargeT:0,swirlT:0,volts:99,iT:999,grap:null,dashT:0,healT:0,guardT:0,stunT:0});
   const e=new Enemy('crawler',player.x+player.w+4,player.y+player.h-24);e.y=player.y+player.h-e.h;e.hp=e.hpMax=1000;e.update=()=>{};G.enemies=[e];window.__target=e;
  };__stage();
 });
 await p.keyboard.press('KeyX');await p.waitForTimeout(350);
 const normal=await p.evaluate(()=>({events:COMBAT_LOG.slice(),sounds:__sounds.slice(),enemyVx:__target.vx}));
 assert.ok(normal.events.some(e=>e.move==='slash'&&e.lost===12),'tap lands normal claw');assert.ok(normal.enemyVx>0,'normal hit knocks enemy away');
 await p.evaluate(()=>{__stage();__sounds=[];});
 await p.keyboard.down('KeyX');await p.waitForTimeout(950);
 const charge=await p.evaluate(()=>player.chargeT);await p.keyboard.up('KeyX');await p.waitForTimeout(350);
 const special=await p.evaluate(()=>({events:COMBAT_LOG.slice(),sounds:__sounds.slice(),enemyVx:__target.vx,build:BUILD_ID}));
 assert.ok(charge>=.6,'held real input reaches charge threshold');assert.ok(special.events.some(e=>e.move==='burst'&&e.lost===38),'release lands charged damage');
 assert.ok(special.sounds.includes('chargedHit')&&special.sounds.includes('bosshit'),'release and heavy contact audio both fire');
 await p.waitForTimeout(900);const expired=await p.evaluate(()=>parts.filter(x=>x.metal).length);assert.equal(expired,0);assert.deepEqual(errors,[]);
 fs.mkdirSync('docs/combat/impact-2026-10-16/input',{recursive:true});fs.writeFileSync('docs/combat/impact-2026-10-16/input/result.json',JSON.stringify({scope:'staged real-keyboard combat, normal game loop',normal,charge,special,expired,errors},null,2)+'\n');
 console.log('PASS real keyboard tap and held/released charge: damage, knockback, release/contact audio, particle expiry');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
