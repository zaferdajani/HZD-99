// Reuse the prior gallery unchanged except exact baseline SHA/output directory.
// Parent19 and candidate are served together; no worktree rewind or asset edit.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const oldPath=path.resolve(__dirname,'../../2026-10-19/flier-states.cjs');
let src=fs.readFileSync(oldPath,'utf8');
for(const [before,after] of [
 ["out=path.join(__dirname,'graphics')","out="+JSON.stringify(path.resolve(__dirname,'../graphics'))],
 ["parent='69640ed83d72d451cfb6f0b59fafb2c029cc5802'","parent='f19aee0bc93400944402aeee45db00068abd8ebd'"]
]){if(src.split(before).length!==2)throw Error('Gallery injection drift');src=src.replace(before,after);}
const m=new Module(oldPath,module);m.filename=oldPath;m.paths=Module._nodeModulePaths(path.dirname(oldPath));m._compile(src,oldPath);
