const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/entities.js'), 'utf8');
let ground = null, tiles = {}, platforms = [];
const ctx = vm.createContext({TILE:32, Number, Math, G:{get plats(){return platforms;}}, groundColumnAt:()=>ground,
  solidAt:(x,y)=>tiles[y] === '#',tileAt:(x,y)=>tiles[y] || '.'});
vm.runInContext(source.slice(source.indexOf('function shadowGroundY('),source.indexOf('function touchingWall(')),ctx);
const b = {x:10,y:54,w:20,h:32};
ground=[86,128];tiles={4:'#'};assert.equal(ctx.shadowGroundY(b),86,'raised ground contact');
ground=[280,256];tiles={8:'#'};assert.equal(ctx.shadowGroundY(b),256,'dip follows effective collider');
ground=[256,256];tiles={4:'=',8:'#'};assert.equal(ctx.shadowGroundY(b),128,'shelf above room floor');
platforms=[{x:0,y:100,w:80}];assert.equal(ctx.shadowGroundY(b),100,'moving platform wins nearest support');
platforms=[];ground=null;tiles={};assert.equal(ctx.shadowGroundY(b),null,'no imaginary floor in pit');
ground=[500,512];assert.equal(ctx.shadowGroundY(b),null,'distant floor has no contact shadow');
console.log('PASS: shadows follow curved support, shelves, moving platforms and pits');
