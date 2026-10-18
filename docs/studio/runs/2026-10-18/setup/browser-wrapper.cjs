#!/usr/bin/env node
const {spawn}=require('node:child_process');
import('/tmp/clawbyte-18-browser/node_modules/@sparticuz/chromium/build/index.js').then(({default:chromium})=>{
 const flags=chromium.args.filter(x=>!['--single-process','--in-process-gpu','--disable-web-security','--disable-site-isolation-trials'].includes(x));
 const child=spawn('/tmp/clawbyte-18-browser/chromium',[...flags,'--disable-gpu',...process.argv.slice(2)],{stdio:['inherit','inherit','inherit',3,4]});
 child.on('exit',(code,signal)=>{if(signal)process.kill(process.pid,signal);else process.exit(code??1)});
 for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
});
