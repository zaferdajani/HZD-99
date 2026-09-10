const fs=require('node:fs');
const file='js/tutorial_enforce.js';let text=fs.readFileSync(file,'utf8');
if(!text.includes('Reachable one-way shelves are jump opportunities')){
 const old="  const edge = dir > 0 ? player.x + player.w : player.x;\n  for (let dx = 6; dx <= 60; dx += 6) {";
 const replacement=`  const edge = dir > 0 ? player.x + player.w : player.x;
  // Reachable one-way shelves are jump opportunities, not collision walls.
  // W2's authored lesson is the row-11 shelf; its later hull is a walkable
  // ramp. Requiring a >24px solid face could never announce the actual lesson.
  if (typeof tileAt === 'function') {
    const pc = player.x + player.w / 2;
    const reach = typeof JUMP_V === 'number' ? Math.min(200, JUMP_V * JUMP_V / 4400) : 190;
    for (let tx = Math.floor((pc-40)/TILE); tx <= Math.floor((pc+40)/TILE); tx++) {
      for (let ty = Math.floor((feet-reach)/TILE); ty <= Math.floor((feet-48)/TILE); ty++) {
        if (tileAt(tx,ty) !== '=') continue;
        // A platform behind a solid ceiling is not reachable from this side.
        let clear = true;
        for (let y=ty+1; y<=row; y++) if (solidAt(tx,y)) { clear=false; break; }
        if (clear) return true;
      }
    }
  }
  for (let dx = 6; dx <= 60; dx += 6) {`;
 if(text.split(old).length!==2)throw Error('Changed tutorial geometry baseline');
 fs.writeFileSync(file,text.replace(old,replacement));
}
const game='js/game.js';text=fs.readFileSync(game,'utf8');
const old="point(G.roomId === 'W2' ? 13 * TILE : 17 * TILE + 12, 14 * TILE + 12, '#37ffd0', 34);";
const replacement="point(G.roomId === 'W2' ? 13 * TILE : 17 * TILE + 12, G.roomId === 'W2' ? 11 * TILE : 14 * TILE + 12, '#37ffd0', 34);";
if(!text.includes(replacement)){if(text.split(old).length!==2)throw Error('Changed jump marker');fs.writeFileSync(game,text.replace(old,replacement));}
const test='tests/tutorial-controller.cjs';text=fs.readFileSync(test,'utf8');
if(!text.includes('actual W2 one-way shelf')){
 const anchor='// Completed or dead/paused players never retain enemy wrappers.';
 const checks=`// The actual W2 one-way shelf is usable even without a solid floor wall.
c.G.save.flags.tut=0;step('jump');c.player.x=360;c.player.y=400;c.player.on=true;
c.solidAt=()=>false;c.tileAt=(tx,ty)=>tx>=10&&tx<=15&&ty===11?'=':'.';
assert(c.tutJumpAtObstacle(),'actual W2 one-way shelf must announce jump');
c.tutorialTick();assert.equal(c.G.tutorialLock.action,'JUMP');
assert.equal(prompt().target.y,11*32,'marker points to the shelf rather than empty ground');
c.solidAt=(tx,ty)=>ty===12;
assert(!c.tutJumpAtObstacle(),'a ceiling makes the shelf unreachable');
c.solidAt=()=>false;c.player.x=20;
assert(!c.tutJumpAtObstacle(),'shelf must be within horizontal jumping reach');
`;
 if(!text.includes(anchor))throw Error('Changed tutorial regression boundary');
 fs.writeFileSync(test,text.replace(anchor,checks+anchor));
}
console.log('Jump lesson now points at and detects the authored reachable shelf');
