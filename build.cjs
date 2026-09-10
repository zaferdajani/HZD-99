// CLAWBYTE build: emits play.html (single file) with curated CC0 assets
// embedded as data: URIs. Run: node build.cjs
const fs = require('fs');
const EMBED = {
  bgFar: 'assets/backgrounds/sci_fi_bg1.jpg',
  indFar: 'assets/backgrounds/ind_far.webp',
  indMid: 'assets/backgrounds/ind_mid.webp',
  indFg: 'assets/backgrounds/ind_fg.webp',
  roster: 'assets/characters/roster_8yaw.webp',
  zones: 'assets/backgrounds/zones_far.jpg',
  vistaCity: 'assets/backgrounds/vista_city.jpg',
  vistaCrystal: 'assets/backgrounds/vista_crystal.jpg',
  driller: 'assets/characters/driller_12x6.webp',
  beastParts: 'assets/characters/beast_parts.webp',
  eagleParts: 'assets/characters/eagle_parts.webp',
  heroIdle: 'assets/characters/gothic-hero-idle.png',
  heroRun: 'assets/characters/gothic-hero-run.png',
  heroJump: 'assets/characters/gothic-hero-jump.webp',
  heroAtk: 'assets/characters/gothic-hero-attack.png',
  houndRun: 'assets/characters/hell-hound-run.webp',
  houndIdle: 'assets/characters/hell-hound-idle.png',
  ghost: 'assets/characters/ghost-idle.webp',
  skull: 'assets/characters/fire-skull.png',
  beast: 'assets/characters/hell-beast-idle.png',
  demon: 'assets/characters/demon-idle.png',
  hz_swing1: 'assets/sfx/hz_swing1.ogg', hz_swing2: 'assets/sfx/hz_swing2.ogg',
  hz_fin: 'assets/sfx/hz_fin.ogg', hz_burst: 'assets/sfx/hz_burst.ogg',
  hz_dash: 'assets/sfx/hz_dash.ogg', hz_charge: 'assets/sfx/hz_charge.ogg',
  hz_ready: 'assets/sfx/hz_ready.ogg', hz_jump: 'assets/sfx/hz_jump.ogg',
  hz_land: 'assets/sfx/hz_land.ogg', hz_evosting: 'assets/sfx/hz_evosting.ogg',
  hum_servo: 'assets/sfx/hum_servo.ogg', hum_ratchet: 'assets/sfx/hum_ratchet.ogg',
  hum_mono: 'assets/sfx/hum_mono.ogg', hum_sage: 'assets/sfx/hum_sage.ogg',
  hum_patch: 'assets/sfx/hum_patch.ogg', hum_lumen: 'assets/sfx/hum_lumen.ogg',
  fz_tell: 'assets/sfx/fz_tell.ogg', fz_tellmid: 'assets/sfx/fz_tellmid.ogg',
  fz_tellbig: 'assets/sfx/fz_tellbig.ogg', fz_slam: 'assets/sfx/fz_slam.ogg',
  fz_phase: 'assets/sfx/fz_phase.ogg', fz_wave: 'assets/sfx/fz_wave.ogg',
  fz_spikeup: 'assets/sfx/fz_spikeup.ogg', fz_summon: 'assets/sfx/fz_summon.ogg',
  fz_wreck: 'assets/sfx/fz_wreck.ogg', fz_break: 'assets/sfx/fz_break.ogg',
  fz_roar: 'assets/sfx/fz_roar.ogg', fz_castarc: 'assets/sfx/fz_castarc.ogg',
  fz_castice: 'assets/sfx/fz_castice.ogg', fz_castnull: 'assets/sfx/fz_castnull.ogg',
  fz_roar_glitch: 'assets/sfx/fz_roar_glitch.ogg', fz_roar_brood: 'assets/sfx/fz_roar_brood.ogg',
  fz_roar_atlas: 'assets/sfx/fz_roar_atlas.ogg', fz_roar_zero: 'assets/sfx/fz_roar_zero.ogg',
  fz_roar_prism: 'assets/sfx/fz_roar_prism.ogg', fz_roar_mother: 'assets/sfx/fz_roar_mother.ogg',
  hz_winsting: 'assets/sfx/hz_winsting.ogg', hz_step1: 'assets/sfx/hz_step1.ogg', hz_step2: 'assets/sfx/hz_step2.ogg',
  hz_stepgrass1: 'assets/sfx/hz_stepgrass1.ogg', hz_stepgrass2: 'assets/sfx/hz_stepgrass2.ogg',
  hz_steprock1: 'assets/sfx/hz_steprock1.ogg', hz_steprock2: 'assets/sfx/hz_steprock2.ogg',
  hz_stepice1: 'assets/sfx/hz_stepice1.ogg', hz_stepice2: 'assets/sfx/hz_stepice2.ogg',
  hz_steporg1: 'assets/sfx/hz_steporg1.ogg', hz_steporg2: 'assets/sfx/hz_steporg2.ogg',
  hit1: 'assets/sfx/hit_01.ogg', hit2: 'assets/sfx/hit_02.ogg', metal: 'assets/sfx/metal_05.ogg',
  explosion: 'assets/sfx/explosion.ogg', glass: 'assets/sfx/glass_01.ogg', laser: 'assets/sfx/laser2.mp3',
  zap: 'assets/sfx/zapTwoTone.mp3', powerup: 'assets/sfx/powerUp1.mp3', low: 'assets/sfx/lowDown.mp3',
};
const MIME = { jpg: 'image/jpeg', png: 'image/png', ogg: 'audio/ogg', mp3: 'audio/mpeg', wav: 'audio/wav' };
const media = {};
for (const k in EMBED) { const f=EMBED[k], ext=f.split('.').pop().toLowerCase(); media[k]='data:'+MIME[ext]+';base64,'+fs.readFileSync(f).toString('base64'); }

// IMPORTANT: production repairs belong in the compiled source order. Keeping
// them outside this list made Pages, desktop and local builds run different
// games. They are now part of BUILD_ID and every target executes the same code.
const files = ['beast','eagle','glaciere','furnace','mother','theme','mat','prism','types','i18n','weapons','gear','media','quests','atlas','audio','engine','lang','riddles','trials','world','preload','entities','wolves','pets','braid','game','perf','touch','packs','warp','diag','tutorial_enforce','mobility_fix','data_conduits_npc_fix','boss_aaa_fix','npc_shop_exit_fix']
  .map(f => fs.readFileSync('js/' + f + '.js', 'utf8'));
let roomAssets='null'; try{roomAssets=fs.readFileSync('assets/roomassets.json','utf8').trim();}catch(e){}
let lowres='null'; try{lowres=fs.readFileSync('assets/lowres/index.json','utf8').trim();}catch(e){}
const MUS_EXT=/\.(ogg|mp3|m4a|wav)$/i, musFiles={}; try{for(const f of fs.readdirSync('assets/music')) if(MUS_EXT.test(f)) musFiles[f.replace(MUS_EXT,'')]='assets/music/'+f;}catch(e){}
const VID_EXT=/\.(mp4|webm|mov)$/i, vidFiles={},vidAlt={}; try{for(const f of fs.readdirSync('assets/video')){if(!VID_EXT.test(f))continue;const b=f.replace(VID_EXT,'');if(/\.webm$/i.test(f))vidAlt[b]='assets/video/'+f;else vidFiles[b]='assets/video/'+f;}for(const k in vidAlt)if(!vidFiles[k]){vidFiles[k]=vidAlt[k];delete vidAlt[k];}}catch(e){}
let vidLight='null';try{vidLight=fs.readFileSync('assets/video/light/index.json','utf8').trim();}catch(e){}
const VOX_EXT=/\.(ogg|mp3|m4a|wav)$/i,voxFiles={};try{for(const f of fs.readdirSync('assets/vox'))if(VOX_EXT.test(f))voxFiles[f.replace(VOX_EXT,'')]='assets/vox/'+f;}catch(e){}
const html=fs.readFileSync('dev.html','utf8'),loader=fs.readFileSync('loader.html','utf8'),editorJs=fs.readFileSync('js/editor.js','utf8');
const SITE='https://zaferdajani.github.io/HZD-99',STUDIO='VibeSolutions';
function seoBlock(fname,lock,forge){if(forge)return '<meta name="robots" content="noindex,nofollow">\n<meta name="viewport" content="width=device-width,initial-scale=1">';const hero=lock==='hero',url=SITE+(hero?'/odyssey.html':'/'),name=hero?'NOSTOS':'CLAWBYTE',tagline=hero?'An Odyssey metroidvania — the long way home to Ithaca.':'A robo-cat metroidvania in the Machine Depths.',desc=tagline+' A hand-built action game that runs in the browser — no install, no account. Explore, fight guardians, earn skills, and find the way through.',img=SITE+'/assets/social/'+(hero?'nostos':'clawbyte')+'.png',ld=JSON.stringify({'@context':'https://schema.org','@type':'VideoGame',name,description:desc,url,image:img,genre:['Action','Metroidvania','Platformer'],gamePlatform:'Web browser',applicationCategory:'Game',operatingSystem:'Any (modern web browser)',author:{'@type':'Organization',name:STUDIO,url:SITE},publisher:{'@type':'Organization',name:STUDIO,url:SITE},creator:{'@type':'Person',name:'Zafer Dajani'},inLanguage:['en','ar','tr','zh','ru'],offers:{'@type':'Offer',price:'0',priceCurrency:'USD',availability:'https://schema.org/InStock',url}}).replace(/</g,'\\u003c').replace(/>/g,'\\u003e');return ['<meta name="description" content="'+desc+'">','<meta name="author" content="'+STUDIO+'">','<meta name="publisher" content="'+STUDIO+'">','<link rel="canonical" href="'+url+'">','<meta name="robots" content="index,follow">','<meta property="og:type" content="website">','<meta property="og:site_name" content="'+name+'">','<meta property="og:title" content="'+name+' — '+tagline+'">','<meta property="og:description" content="'+desc+'">','<meta property="og:url" content="'+url+'">','<meta property="og:image" content="'+img+'">','<meta property="og:image:width" content="1200">','<meta property="og:image:height" content="630">','<meta property="og:image:alt" content="'+name+' title screen">','<meta name="twitter:card" content="summary_large_image">','<meta name="twitter:title" content="'+name+'">','<meta name="twitter:description" content="'+tagline+'">','<meta name="twitter:image" content="'+img+'">','<meta name="theme-color" content="#04060a">','<script type="application/ld+json">'+ld+'</script>'].join('\n');}
const buildId=require('crypto').createHash('sha256').update(html).update(loader).update(editorJs).update(files.join('\n')).update(JSON.stringify(musFiles)).update(JSON.stringify(vidFiles)).update(JSON.stringify(vidAlt)).update(String(vidLight)).update(JSON.stringify(voxFiles)).update(String(roomAssets)).update(String(lowres)).digest('hex').slice(0,12);
const emit=(fname,lock,forge)=>{let shell=html;if(lock==='hero')shell=shell.replace(/<title>[^<]*<\/title>/,'<title>NOSTOS — an Odyssey metroidvania</title>');if(forge)shell=shell.replace(/<title>[^<]*<\/title>/,'<title>THE FORGE</title>');shell=shell.replace('<!--PCN-SEO-->',seoBlock(fname,lock,forge));const out=shell.replace(/<script src="js\/theme\.js"><\/script>[\s\S]*<\/body>/,()=>loader+'\n<script>window.BUILD_ID='+JSON.stringify(buildId)+(forge?';window.EDITOR=1':'')+';window.GAME_LOCK='+JSON.stringify(lock)+';window.MUS_FILES='+JSON.stringify(musFiles)+';window.VID_FILES='+JSON.stringify(vidFiles)+';window.VID_ALT='+JSON.stringify(vidAlt)+';window.VID_LIGHT='+vidLight+';window.VOX_FILES='+JSON.stringify(voxFiles)+';window.ROOM_ASSETS='+roomAssets+';window.LOWRES='+lowres+'</script>\n<script>\n'+files.join('\n')+(forge?'\n'+editorJs:'')+'\n</script>\n</body>');fs.writeFileSync(fname,out);console.log(fname+' built ('+lock+(forge?'+forge':'')+'):',(fs.statSync(fname).size/1048576).toFixed(2)+'MB');};
emit('index.html','robo');emit('odyssey.html','hero');emit('forge.html','robo',true);emit('forge-odyssey.html','hero',true);
