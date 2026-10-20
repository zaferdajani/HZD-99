// Pure, isolated source evaluation. Does not attach to or change the live run.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../../..'),world=fs.readFileSync(path.join(root,'js/world.js'),'utf8'),campaign=fs.readFileSync(path.join(root,'tests/campaign-ch1.cjs'),'utf8'),entities=fs.readFileSync(path.join(root,'js/entities.js'),'utf8');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const context=vm.createContext({});
vm.runInContext(world+'\nglobalThis.__raw={room:ROOMS.CV1B,rows:buildRoom("CV1B").map(r=>r.join("")),tile:TILE};',context,{timeout:5000});
const raw=JSON.parse(JSON.stringify(context.__raw));
const begin=campaign.indexOf('const TL = 32, PW = 24, PH = 36;'),end=campaign.indexOf('async function snap()');assert(begin>0&&end>begin,'Exact planner block bounds');
const planner=campaign.slice(begin,end);vm.runInContext('const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));\n'+planner,context,{timeout:5000});
context.__input={id:'CV1B',w:raw.room.w,h:raw.room.h,rows:raw.rows,exits:{}};
vm.runInContext(`
 const scenarios=[];
 for(const step of [1/60,1/30]){
  DT=step;const M=roomModel(__input),start={x:896,y:156,vx:0,vy:0,on:true};
  const cell=M.cellOf(start.x,start.y),programs=[];
  for(const dir of [-1,0,1])for(const hold of [0,.12,.2,.3,2]){
   const program={dir,hold,d0:0,d1:dir?9:0,vx0:0};
   programs.push({program,result:simulate(M,start,program,3)});
  }
  const target=n=>n.x>=19&&n.x<=21&&n.y>=12;
  const D=distTo(M,{test:target}),route=[];let cur=cell;
  for(let i=0;i<12&&cur>=0&&Number.isFinite(D[cur])&&!target(M.nodes[cur]);i++){
   let best=null,bestD=Infinity;
   for(const edge of M.edges[cur])if(edge.to!=null&&edge.cost+D[edge.to]<bestD){best=edge;bestD=edge.cost+D[edge.to];}
   if(!best)break;route.push({from:M.nodes[cur],to:M.nodes[best.to],program:best.prog||{walk:best.walk}});cur=best.to;
  }
  scenarios.push({step,nodeIndex:cell,node:cell>=0?M.nodes[cell]:null,nodeEdges:cell>=0?M.edges[cell]:[],programs,benchRegionReachable:cell>=0&&Number.isFinite(D[cell]),benchRegionRoute:route,routeReachedTarget:cur>=0&&target(M.nodes[cur])});
 }
 globalThis.__planned={scenarios};
`,context,{timeout:10000});
const planned=JSON.parse(JSON.stringify(context.__planned));
const cells=[];for(let y=3;y<=9;y++)for(let x=23;x<=32;x++)cells.push({x,y,tile:raw.rows[y][x],worldBounds:[x*32,y*32,(x+1)*32,(y+1)*32]});
const body={x:896,y:156,w:24,h:36},leftBodyRows=[Math.floor(body.y/32),Math.floor((body.y+body.h-1)/32)];
const result={scope:'Exact buildRoom(CV1B) output from unchanged world.js evaluated in a fresh Node VM with no browser/DOM/live state. Conservative copied-as-source campaign planner predictions are NOT production input execution, live grid/heightfield capture or proof of physical escape.',sourceSha256:{world:hash(world),campaign:hash(campaign),entities:hash(entities),evaluatedPlannerBlock:hash(planner)},room:{id:'CV1B',w:raw.room.w,h:raw.room.h,tile:raw.tile,ents:raw.room.ents},rows:raw.rows,bodyAssumption:{...body,source:'Rounded invariant campaign log sample, not exact live subpixel coordinates.',leftBodyRows},adjacentLeftTiles:leftBodyRows.map(y=>({x:27,y,tile:raw.rows[y][27]})),localCells:cells,planner:{step:'Separate initial default1/60 and observed campaign1/30 predictions; neither runs the production simulation.',...planned},limitations:['Does not capture the current running G.grid, mutations to breakable tiles, surface heightfields, gate/rubble geometry, moving actors or input delivery.','The campaign planner uses jump velocity905 instead of production920 and is an approximation, not the full Player.update/moveEnt.','The starting x896/y156 is rounded from the log; the actual body may sit at a .01 collision margin.','No browser was started, no input dispatched, and no running process or production/test source modified.']};
fs.writeFileSync(path.join(__dirname,'cv1b-static.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({room:result.room,adjacentLeftTiles:result.adjacentLeftTiles,scenarios:planned.scenarios.map(s=>({step:s.step,node:s.node,nodeEdges:s.nodeEdges,rightWalk:s.programs.find(p=>p.program.dir===1&&p.program.hold===0),benchRegionReachable:s.benchRegionReachable,benchRegionRoute:s.benchRegionRoute,routeReachedTarget:s.routeReachedTarget}))},null,2));
