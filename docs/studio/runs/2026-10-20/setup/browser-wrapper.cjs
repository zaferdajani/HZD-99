#!/usr/bin/env node
// Software-rendered host validation, not physical-device certification.
const {spawn}=require('node:child_process');
import('/tmp/clawbyte-20-browser/node_modules/@sparticuz/chromium/build/index.js').then(async({default:chromium})=>{
 const flags=chromium.args.filter(x=>!['--single-process','--in-process-gpu','--disable-web-security','--disable-site-isolation-trials'].includes(x));
 const child=spawn('/tmp/clawbyte-20-browser/chromium',[...flags,'--disable-gpu',...process.argv.slice(2)],{env:{...process.env,LD_LIBRARY_PATH:'/tmp/clawbyte-20-browser',FONTCONFIG_PATH:'/tmp/clawbyte-20-browser'},stdio:['inherit','inherit','inherit',3,4]});
 child.on('exit',(code,signal)=>{if(signal)process.kill(process.pid,signal);else process.exit(code??1)});
 for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
}).catch(e=>{console.error(e);process.exitCode=1});
