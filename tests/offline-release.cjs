const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const handlers={}, all=new Map();let denied=false, network;
function cacheFor(name){if(!all.has(name))all.set(name,new Map()); const map=all.get(name);return {
 put:async(r,v)=>map.set(r.url,v.clone()),keys:async()=>[...map.keys()].map(url=>({url})),
 match:async(r,opts)=>{const key=[...map.keys()].find(k=>opts&&opts.ignoreSearch?k.split('?')[0]===r.url.split('?')[0]:k===r.url);return key&&map.get(key).clone();},
 delete:async(r)=>map.delete(r.url)
};}
const ctx={URL,Response,console,self:{location:new URL('https://example.test/HZD-99/sw.js?v=new-build'),
 registration:{scope:'https://example.test/HZD-99/'},addEventListener:(k,f)=>handlers[k]=f,skipWaiting:()=>{},clients:{claim:async()=>{}}},
 caches:{open:async n=>{if(denied)throw Error('denied');return cacheFor(n);},keys:async()=>[...all.keys()],delete:async n=>all.delete(n)},
 fetch:(...args)=>network(...args)};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('sw.js','utf8'),ctx);
async function request(path,opts={}){let response,pending=[];handlers.fetch({request:{url:'https://example.test'+path,method:opts.method||'GET',headers:new Headers(opts.headers||{}),mode:opts.mode||'cors'},respondWith:p=>response=p,waitUntil:p=>pending.push(p)});const out=await response;await Promise.all(pending);return out;}
(async()=>{
 all.set('clawbyte:/HZD-99/:old',new Map());all.set('other-app',new Map());all.set('clawbyte:/another-app/:active',new Map());all.set('clawbyte-v2',new Map());
 let activation;handlers.activate({waitUntil:p=>activation=p});await activation;
 assert(!all.has('clawbyte:/HZD-99/:old'));assert(all.has('other-app'));assert(all.has('clawbyte:/another-app/:active'));
 network=async()=>new Response('version-A');assert.equal(await(await request('/HZD-99/version.json')).text(),'version-A');
 network=async()=>new Response('version-B');assert.equal(await(await request('/HZD-99/version.json')).text(),'version-B','manifest is network-first');
 network=async()=>{throw Error('offline');};assert.equal(await(await request('/HZD-99/version.json?fresh=1')).text(),'version-B');
 assert.equal((await request('/HZD-99/missing.webp')).status,503);
 assert.equal(await request('/HZD-99/intro.mp4',{headers:{Range:'bytes=0-128'}}),undefined,'range requests bypass partial cache');
 assert.equal(await request('/elsewhere/app.js'),undefined,'foreign app untouched');
 assert.equal(await request('/HZD-99/save',{method:'POST'}),undefined);
 denied=true;network=async()=>new Response('online-without-cache');assert.equal(await(await request('/HZD-99/index.html',{mode:'navigate'})).text(),'online-without-cache');
 denied=false;network=async()=>new Response('asset');await request('/HZD-99/a.webp');network=async()=>{throw Error('offline');};assert.equal(await(await request('/HZD-99/a.webp')).text(),'asset');
 const before=(await ctx.caches.open('clawbyte:/HZD-99/:new-build')).keys();
 await vm.runInContext("store({url:'https://example.test/HZD-99/partial.webm'},new Response('partial',{status:206}))",ctx);
 assert.equal((await(await ctx.caches.open('clawbyte:/HZD-99/:new-build')).keys()).length,(await before).length);
 console.log('PASS: versioned app-only caches, fresh manifests, media seeking, offline fallback, cache denial and no partial-response corruption');
})().catch(e=>{console.error(e);process.exitCode=1;});
