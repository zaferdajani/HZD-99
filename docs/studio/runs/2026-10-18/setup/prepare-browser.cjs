// Expand the packaged Chromium executable. No privileged package installation.
const fs=require('node:fs'),zlib=require('node:zlib'),{pipeline}=require('node:stream/promises');
(async()=>{for(const [input,target] of [['chromium.br','chromium'],['swiftshader.tar.br','swiftshader.tar'],['fonts.tar.br','fonts.tar']])await pipeline(fs.createReadStream('/tmp/clawbyte-18-browser/node_modules/@sparticuz/chromium/bin/'+input),zlib.createBrotliDecompress(),fs.createWriteStream('/tmp/clawbyte-18-browser/'+target,{mode:0o700}));})().catch(e=>{console.error(e);process.exitCode=1});
