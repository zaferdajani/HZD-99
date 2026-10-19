// Run ONLY after the full collector: same runtime/fixture, separate font environment.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..'),{chromium}=require(path.join(root,'node_modules/playwright'));
const result=JSON.parse(fs.readFileSync(path.join(__dirname,'automated/results.json')));
assert(result.finished_utc,'Do not launch extra browser or alter environment during collector');
const source=fs.readFileSync(path.join(root,'tests/textreveal.cjs'),'utf8'),text=source.match(/const ZH = '([^']+)'/)[1];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),index=fs.readFileSync(path.join(root,'index.html'));
const out=path.join(__dirname,'setup/cjk-diagnostic');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{let name=new URL(req.url,'http://localhost').pathname;if(name==='/')name='/index.html';const file=path.resolve(root,'.'+decodeURIComponent(name));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});});
(async()=>{const output={scope:'Post-collector font diagnostic: unchanged canvas wrapping plus DOM platform-font trace for the exact same text/font; not full-suite, physical-device or canvas per-glyph certification.',servedIndexSha256:result.server_sha256,fixtureSha256:hash(text),samples:[]};
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/index.html';
 assert.equal(hash(Buffer.from(await(await fetch(url)).arrayBuffer())),hash(index),'owned served index');
 for(const [name,wrapper]of [['original','browser-wrapper.cjs'],['cjk','cjk-browser-wrapper.cjs']]){
  const browser=await chromium.launch({executablePath:path.join(__dirname,'setup',wrapper)});
  try{const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof dlgFont==='function'&&typeof wrapLines==='function');
   const sample=await page.evaluate(text=>{const font=dlgFont({rs:false}),ctx=document.createElement('canvas').getContext('2d');ctx.font=font;const lines=wrapLines(ctx,text,DLG_W),el=document.createElement('div');el.id='studio-cjk-fixture';el.textContent=text;Object.assign(el.style,{position:'fixed',left:'100px',top:'100px',width:DLG_W+'px',font,color:'white',background:'black',zIndex:2147483647});document.body.appendChild(el);return {font,box:DLG_W,fullWidth:ctx.measureText(text).width,lines:lines.length,widest:Math.max(...lines.map(l=>ctx.measureText(l).width)),textPreserved:lines.join('')===text,build:window.BUILD_ID};},text);
   await page.evaluate(()=>document.fonts.ready);const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const doc=await cdp.send('DOM.getDocument'),node=await cdp.send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#studio-cjk-fixture'});sample.domPlatformFonts=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId:node.nodeId})).fonts;
   sample.name=name;sample.wrapper=wrapper;sample.errors=errors;sample.screenshot=name+'.png';await page.screenshot({path:path.join(out,sample.screenshot)});output.samples.push(sample);
  }finally{await browser.close();}
 }
}finally{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});
