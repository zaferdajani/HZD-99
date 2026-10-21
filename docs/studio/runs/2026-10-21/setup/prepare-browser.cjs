// Local reproducible browser only, never a game dependency.
const fs=require('node:fs'),zlib=require('node:zlib'),{pipeline}=require('node:stream/promises');
const root='/tmp/clawbyte-21-browser';
(async()=>{for(const [input,target] of [['chromium.br','chromium'],['swiftshader.tar.br','swiftshader.tar'],['fonts.tar.br','fonts.tar']])await pipeline(fs.createReadStream(root+'/node_modules/@sparticuz/chromium/bin/'+input),zlib.createBrotliDecompress(),fs.createWriteStream(root+'/'+target,{mode:0o700}));})().catch(e=>{console.error(e);process.exitCode=1});
