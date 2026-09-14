// Deterministic owner-sheet integration. No edits to gameplay update functions.
'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'..'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected={
 'js/entities.js':'47a0fe9f53bb030fb3eed033f14fda852a768710dd798a7df48e2306b0a30d0b',
 'js/media.js':'a977f86404a657537139d0b0da9e10e6b1812668c53be6c20f82848dbdaf5900',
 'js/mobility_fix.js':'d0015307ad0188da22dd1fa76aa39706a6756f3063e7e5319fdf168c86ee4276',
 'build.cjs':'22f6e7b34a377bf7ed1a354d40bf251eb725a4d2f21ea74b3b4a19c077954918',
 'dev.html':'ff69a373fb3bb2d81c42bd975a12229b907d8419634ad412f2abe611dcdcbc00',
 'source-files.json':'bb1a07a3d8b35e72fa78f8ddd9fd72ef0e7992df8d6226feafbde4b69c77fe70'
};
for(const [p,h] of Object.entries(expected))assert.equal(hash(fs.readFileSync(p)),h,'Concurrent source change: '+p);
const prepared='assets/characters/hero/owner-20260914';
cp.execFileSync('python3',['tools/extract-owner-hero.py','assets/source/hero/owner-20260914/original.png',prepared],{stdio:'inherit'});
// Tight transparent packing saves texture memory without changing source pixels.
// Registration stays in the original 256px reference coordinates.
cp.execFileSync('python3',['-c',`
from pathlib import Path
from PIL import Image
import json, math, hashlib
p=Path('${prepared}')
m=json.loads((p/'frames.json').read_text())
source=Image.open(p/'atlas.webp').convert('RGBA')
items=[]
for f in m['frames']:
 x,y,w,h=f['atlas'];tile=source.crop((x,y,x+w,y+h));box=tile.getbbox()
 if box is None: raise RuntimeError('Empty frame '+str(f['id']))
 items.append((f,tile.crop(box),box))
items.sort(key=lambda it:(-it[1].height,it[0]['id']))
placements=[];x=y=4;rowh=0
for f,tile,box in items:
 if x+tile.width+4>1024:x=4;y+=rowh+8;rowh=0
 placements.append((f,tile,box,x,y));x+=tile.width+8;rowh=max(rowh,tile.height)
height=2**math.ceil(math.log2(y+rowh+4))
atlas=Image.new('RGBA',(1024,height),(0,0,0,0))
for f,tile,box,x,y in placements:
 atlas.paste(tile,(x,y));f['atlas']=[x,y,tile.width,tile.height];f['trim_offset']=[box[0],box[1]]
atlas.save(p/'atlas.webp','WEBP',lossless=True,method=6)
m['atlas_sha256']=hashlib.sha256((p/'atlas.webp').read_bytes()).hexdigest()
m['atlas_dimensions']=list(atlas.size)
(p/'frames.json').write_text(json.dumps(m,indent=2)+'\\n')
(p/'frames.js').write_text('const OWNER_HERO_SHEET = Object.freeze('+json.dumps(m,separators=(',',':'))+');\\n')
print('Packed owner atlas:',atlas.size,m['atlas_sha256'])
`],{stdio:'inherit'});
function edit(p,a,b){const s=fs.readFileSync(p,'utf8');assert.equal(s.split(a).length,2,'Unique source anchor: '+p+' '+a.slice(0,50));fs.writeFileSync(p,s.replace(a,b));}
edit('js/entities.js','  drawRoboSwing(c) {\n',"  drawRoboSwing(c) {\n    if (typeof ownerHeroDrawSwing === 'function' && ownerHeroDrawSwing(this, c)) return true;\n");
edit('js/entities.js','  drawRoboTrans(c, st) {\n',"  drawRoboTrans(c, st) {\n    if (typeof ownerHeroDrawMovement === 'function' && ownerHeroDrawMovement(this, c, st)) return true;\n");
edit('js/entities.js','  draw(c) {\n    if (this.dead) return;\n',
`  draw(c) {
    this.ownerSheetSwingDrawn = false;
    if (this.dead) {
      if (typeof ownerHeroDrawDeath === 'function') ownerHeroDrawDeath(this, c);
      return;
    }
`);
edit('js/entities.js','    // volt-blade slashes — sharp tapered anime CUTS through space, not rings\n    if (this.swingVis) {',
'    // Owner claw frames already contain their arcs; other weapon effects remain.\n    // volt-blade slashes — sharp tapered anime CUTS through space, not rings\n    if (this.swingVis && !this.ownerSheetSwingDrawn) {');
edit('js/media.js',"    gaitWalk: 'assets/characters/hero/gait/walk.webp',","    heroOwnerAtlas: 'assets/characters/hero/owner-20260914/atlas.webp',\n    gaitWalk: 'assets/characters/hero/gait/walk.webp',");
edit('js/mobility_fix.js',"  'heroStates', 'hzdIdle', 'gaitWalk', 'gaitRun', 'transAir', 'transLand',","  'heroOwnerAtlas', 'heroStates', 'hzdIdle', 'gaitWalk', 'gaitRun', 'transAir', 'transLand',");
edit('build.cjs',"{heroStates:'states.webp', gaitWalk:'gait/walk.webp', gaitRun:'gait/run.webp', hzdIdle:'idle.webp'}",
"{heroOwnerAtlas:'owner-20260914/atlas.webp', heroStates:'states.webp', gaitWalk:'gait/walk.webp', gaitRun:'gait/run.webp', hzdIdle:'idle.webp'}");
const files=JSON.parse(fs.readFileSync('source-files.json','utf8'));assert.equal(files.filter(f=>f==='boot').length,1);
files.splice(files.indexOf('boot'),0,'owner_hero_frames','hero_artwork');fs.writeFileSync('source-files.json',JSON.stringify(files,null,2)+'\n');
edit('dev.html','<script src="js/boot.js"></script>','<script src="js/owner_hero_frames.js"></script>\n<script src="js/hero_artwork.js"></script>\n<script src="js/boot.js"></script>');
fs.copyFileSync(prepared+'/frames.js','js/owner_hero_frames.js');
fs.copyFileSync('tools/owner-hero-runtime.js','js/hero_artwork.js');
// Adapt the fixed registration canvas to tightly packed source rectangles.
edit('js/hero_artwork.js','  const base = airborne ? -18 : HERO_FLOOR;','  const base = airborne ? -18 : HERO_FLOOR;\n  const trim = f.trim_offset || [0,0];');
edit('js/hero_artwork.js','-OWNER_HERO_SHEET.anchor_x * s, base - anchorY * s','(trim[0]-OWNER_HERO_SHEET.anchor_x) * s, base + (trim[1]-anchorY) * s');
edit('js/hero_artwork.js',"  G.lastStrip = 'owner:' + clip + ':' + n;","  p._motionPose = null; p._motionBlend = null; // do not resume a stale gait blend after another action\n  G.lastStrip = 'owner:' + clip + ':' + n;");
const gait={
 'assets/characters/hero/gait/walk.webp':'312d78c1e20f25232c8ef8b35a0b7aefbb3dd31110742b51968a0493fead5590',
 'assets/characters/hero/gait/run.webp':'6fbb5c1ef0c64a56a5ab67c36cf0b1253b8eedae36a784af71942b5bbb9307c2'};
for(const [p,h] of Object.entries(gait))assert.equal(hash(fs.readFileSync(p)),h,'Protected gait changed');
fs.mkdirSync('docs/artwork',{recursive:true});
fs.writeFileSync('docs/artwork/owner-sheet-20260914.json',JSON.stringify({
 source_share:'https://chatgpt.com/s/m_6aa84bf00514819189f0346b47f8e176',
 source_sha256:hash(fs.readFileSync('assets/source/hero/owner-20260914/original.png')),
 protected_gait:gait,physics:'Player.update, heroState and movement/collision constants unchanged',
 implemented:['idle','jump/rise/apex/fall','stationary landing recovery','dash','hurt','death','claw jab','double slash','uppercut','stationary charge hold','charged claw release','air claw','downward claw'],
 preserved_due_to_motion_or_missing_art:['walk','run','skid','wall cling','Yalla foot-tap','heal/song','single sword','dual swords','joined weapon'],
 exclusions:['No guard mechanic created','No sword artwork fabricated','No FX-only cell substitutes for the body','No title/story/audio or progression changes'],
 source_files_before:expected
},null,2)+'\n');
console.log('Owner art integrated; gait assets and physics code remain protected.');
