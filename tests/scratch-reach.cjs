// Exercise real Player.update input, then inspect both rendering paths.
// No DOM or browser is needed: scene/audio services are inert, but the player,
// combo clocks, attack buffer, pose selector and strip selector are production
// code. The visual harness separately measures the resulting artwork.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const held = new Set(), pressed = new Set(), draws = [];
const noop = () => {};
const ctx = vm.createContext({
  console, TILE: 32, PAL: { A: { glow: '#ffffff' } },
  inD: k => held.has(k), inP: k => pressed.has(k),
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, k) => a + (b - a) * k,
  rnd: (a, b) => (a + b) / 2, chance: () => false,
  isHero: () => false, addPart: noop, burst: noop, sfx: noop,
  cam: { shake: 0 },
  G: {
    save: { diff: 1, equip: [], abil: {}, skills: [], relics: [],
      flags: {}, broken: {}, coresMax: 5 },
    roomId: 'TEST', roomDef: { zone: 'A', w: 80, h: 20 },
    grid: Array.from({ length: 20 }, (_, y) => (y === 15 ? '#' : '.').repeat(80)),
    enemies: [], projs: [], statics: [], plats: [], addRing: noop,
  },
  drawStripCell: (...args) => { draws.push(args); return true; },
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/weapons.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(process.argv[2] || path.join(__dirname, '../js/entities.js'), 'utf8'), ctx);
vm.runInContext('var player = new Player(300, 444); player.on = true;', ctx);
const player = ctx.player;
function tick(dt = 1 / 60) { player.update(dt); pressed.clear(); }
function attack() {
  held.add('ATK'); pressed.add('ATK'); tick(); held.delete('ATK');
  return { combo: player.swingVis.combo, pose: player.heroState(false) };
}
function advance(seconds) { for (let t = 0; t < seconds; t += 1 / 60) tick(); }

// Real Player.update collision processing at an exact boundary, with inert
// audio/scene services. The effect never owns or repeats damage.
ctx.hurtBoxOf=e=>e;ctx.dealDmg=(e,d)=>{e.hp-=d;return d};
ctx.armEl=()=>null;
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/engine.js'),'utf8').match(/function aabb\(a, b\) \{[^\n]+/)[0],ctx);
player.dmg=()=>10;
const samples=[];
for(const face of [1,-1])for(const combo of [0,1,2]){
  player.x=300;player.y=444;player.face=player.faceVis=face;player.vx=player.vy=0;player.on=true;
  player.swing={t:.15,ax:face,ay:0,ang:face>0?0:Math.PI,combo,wield:0,set:new Set()};
  player.swingVis={t:.24,t0:.24,ang:player.swing.ang,combo,wield:0,weaponMode:'claws'};
  player.startScratchWake(player.swingVis);
  const box=player.hitbox(),cx=player.x+player.w/2,reach=face>0?box.x+box.w-cx:cx-box.x;
  assert.equal(reach,combo===2?100:86);
  assert.equal(player.scratchWake.reach,reach,'visible wake shares contact reach');
  const enemy=x=>({x,y:player.y+player.h/2-1,w:1,h:2,hp:100,vx:0,vy:0,kind:'turret'});
  const inside=enemy(cx+face*(reach-.5)-(face<0?1:0));
  const outside=enemy(cx+face*(reach+1)-(face<0?1:0));
  ctx.G.enemies=[inside,outside];tick(0);
  assert.ok(inside.hp<100,'inside boundary is hit');assert.equal(outside.hp,100,'outside boundary misses');
  const hp=inside.hp;tick(0);assert.equal(inside.hp,hp,'same swing cannot double-hit');
  ctx.G.enemies=[];player.vx=0;advance(.26);
  assert.equal(player.swingVis,null);assert.ok(player.scratchWake?.t>0,'trail remains after body recovers');
  ctx.G.enemies=[outside];tick(0);assert.equal(outside.hp,100,'after-trail never deals damage');
  ctx.G.enemies=[];advance(.20);assert.equal(player.scratchWake,null,'trail expires');
  samples.push({face,combo,reach});
}
for(const face of [-1,1]){
 player.face=face;player.startScratchWake({t0:.32,charged:true,weaponMode:'claws',ang:0});
 assert.equal(player.scratchWake.reach,165);assert.equal(Math.sign(Math.cos(player.scratchWake.ang)),face,'charged fan faces target');
}
const wake=player.scratchWake;
for(const props of [{wield:1,weaponMode:'single'},{wield:0,air:true},{swirl:true}]){
 player.startScratchWake({t0:.24,...props});assert.equal(player.scratchWake,wake,'other attack families keep their own effects');
}
console.log('PASS scratch contact boundaries, both facings, charge direction, no repeated damage, 180ms recovery wake:',JSON.stringify(samples));
