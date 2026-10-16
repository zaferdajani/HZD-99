// Rebuild the owner's illustrated stat ledger from the assembled game.
// Portraits are the game's own renderers, not generated replacement artwork.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/combat/impact-2026-10-16');
async function main(){
 fs.mkdirSync(path.join(out,'portraits'),{recursive:true});
 const server=http.createServer((req,res)=>{try{
  const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!p.startsWith(root+path.sep))throw Error('path');
  const served=process.env.COMBAT_BUILD_DIR && ['index.html','odyssey.html','forge.html','forge-odyssey.html'].includes(path.basename(p)) ? path.join(process.env.COMBAT_BUILD_DIR,path.basename(p)) : p;
  const data=fs.readFileSync(served);res.setHeader('Content-Type',p.endsWith('.html')?'text/html':p.endsWith('.webp')?'image/webp':p.endsWith('.png')?'image/png':'application/octet-stream');res.end(data);
 }catch(e){res.statusCode=404;res.end('missing')}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r)); let browser;
 try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
 const page=await browser.newPage({viewport:{width:960,height:540},serviceWorkers:'block'}), errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
 await page.waitForFunction(()=>typeof startGame==='function');
 const data=await page.evaluate(async()=>{
  const sv=newSave(1);sv.time=99;sv.flags.tut=sv.flags.woke=1;startGame(sv);loadRoom('A1');
  // Explicit staging. No campaign completion or natural encounter claim.
  window.update=()=>{};G.state='PLAY';G.dialog=G.wake=G.bossEntry=G.cut=null;G.enemies=[];G.boss=null;
  for(const k of Object.keys(MEDIA_SRC.images))mediaFetch(k,1);
  await new Promise(r=>setTimeout(r,4500));
  const rows=[],cv=document.createElement('canvas');cv.width=600;cv.height=400;const q=cv.getContext('2d');
  const portrait=(e,npc)=>{
   q.setTransform(1,0,0,1,0,0);q.clearRect(0,0,600,400);q.save();G.artProbe=true;
   const scale=npc?3.4:Math.min(4,270/Math.max(e.w*1.7,e.h*2.2));
   q.translate(300,340);q.scale(scale,scale);
   if(npc){
    const im=MEDIA_RAW['bust'+npc[0].toUpperCase()+npc.slice(1)];
    if(im){const s=Math.min(110/im.width,90/im.height);q.drawImage(im,-im.width*s/2,-im.height*s,im.width*s,im.height*s);}else drawNPCBody(q,npc,1,false);
   }else{e.x=-e.w/2;e.y=-e.h;e.draw(q);}
   q.restore();G.artProbe=false;return cv.toDataURL('image/png');
  };
  const normalNames={crawler:'Volt Wolf',guard:'Shield Guard',flier:'Survey Flier',turret:'Arc Turret',hopper:'Cheetah',blob:'Slag Crawler',bat:'Cave Bat',surge:'Line Breaker',kiln:'Kiln Vent',rime:'Rime Coil',snare:'Nest Snare',sage:'Infected Sage'};
  for(const mode of ['claws','single','dual','joined']){
   G.save.flags={crystal:mode!=='claws',crystal2:mode==='dual'||mode==='joined',connector:mode==='joined'};G.save.weaponMode=mode;
   player.swing=player.swingVis=null;player.chargeT=0;player.face=player.faceVis=1;player.on=true;player.dead=false;
   const wield=mode==='joined'?2:mode==='claws'?0:1;
   rows.push({id:'hero-'+mode,name:'HZD-99 / '+mode,role:'Hero',zone:'A',...combatStats(player),
    normal:player.attackDmg('slash',{wield}),finisher:player.attackDmg('finisher',{wield}),
    special:mode==='dual'?'Hurricane: '+player.attackDmg('swirl')+' HP per pass':mode==='joined'?'Returning blade: '+player.attackDmg('throw')+' HP per pass':'Burst: '+player.attackDmg('burst')+' raw HP',
    image:portrait(player)});
  }
  G.save.flags={};G.save.weaponMode='claws';
  const zones={surge:'B',kiln:'C',rime:'D',snare:'E'};
  for(const kind of Object.keys(EKIND)){
   G.roomDef={...G.roomDef,zone:zones[kind]||'A'};
   const random=Math.random;Math.random=()=>.99;const e=new Enemy(kind,0,0);Math.random=random;
   e.faceVis=e.dir=1;e.on=true;e.anim=1;
   rows.push({id:kind,name:normalNames[kind]||kind,role:'Creature',zone:G.roomDef.zone,...combatStats(e),image:portrait(e)});
  }
  for(const kind of Object.keys(BSTAT)){
   G.roomDef={...G.roomDef,zone:BSTAT[kind].zone||'A'};const e=new Boss(kind,300,340);e.st=kind==='glitch'?'stalk':'idle';e.t=1;e.face=e.faceVis=-1;e.anim=1;
   if(kind==='horn'&&typeof ghInit==='function')ghInit(e);
   const name=t('b_'+kind);rows.push({id:kind,name:name==='b_'+kind?kind.toUpperCase():name,role:MINIS[kind]?'Construct boss':'Boss',zone:G.roomDef.zone,...combatStats(e),
    note:kind==='horn'?'Two health phases. Current procedural rig; authored plates pending.':kind==='alpha'?'Optional encounter; taming makes the pack friendly.':'',image:portrait(e)});
  }
  G.roomDef={...G.roomDef,zone:'A'};
  const winch=new YardWinch(0,0);rows.push({id:'winch',name:'Yard Winch',role:'Tutorial machine',zone:'A',...combatStats(winch),image:portrait(winch)});
  for(const kind of ['ratchet','servo','mono','patch','sage','lumen','kerf']){
   const e={type:'npc',extra:kind,friendly:true,hp:100,hpMax:100,defense:100};rows.push({id:'npc-'+kind,name:t('n_'+kind),role:'Protected NPC',zone:'Story',...combatStats(e),image:portrait(e,kind)});
  }
  return {version:COMBAT_VERSION,build:window.BUILD_ID,scope:'Normal difficulty; fresh save, no random traits or upgrades; staged renderer portraits',rows,
   armor:COMBAT_ARMOR,zoneArmor:COMBAT_ZONE_ARMOR,weaponMultipliers:WEAPON_ATK,attacks:ATTACKS,
   missingMedia:Object.keys(MEDIA_PEND).filter(k=>!MEDIA_RAW[k])};
 });
 for(const row of data.rows){fs.writeFileSync(path.join(out,'portraits',row.id+'.png'),Buffer.from(row.image.split(',')[1],'base64'));delete row.image;}
 data.pageErrors=errors;fs.writeFileSync(path.join(out,'stats.json'),JSON.stringify(data,null,2)+'\n');
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({cards:data.rows.length,build:data.build,missingMedia:data.missingMedia.length}));
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1});
