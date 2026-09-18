// Rebuild approved hero assets from immutable source rectangles and measured scales.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium}=require('playwright');
const {isolateFigure}=require('./hero-isolate.cjs');
const {cleanHeroEyes}=require('./hero-eye-cleaner.cjs');
const eyeAnchors=require('./heroeye.json');
const ROOT=path.resolve(__dirname,'..');
async function build(manifestPath,check=false,options={}){
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
 try{
 const page=await browser.newPage();await page.addScriptTag({content:isolateFigure.toString()});await page.addScriptTag({content:cleanHeroEyes.toString()});const sources={};
 for(const [file,expected]of Object.entries(manifest.sources)){
  const bytes=fs.readFileSync(path.join(ROOT,file));
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('Source changed: '+file);
  sources[file]='data:image/png;base64,'+bytes.toString('base64');
 }
 const report=[];
 for(const sheet of manifest.sheets){
  let result=await page.evaluate(async({sheet,sources})=>{
   const cell=sheet.cell||320,cv=document.createElement('canvas');cv.width=cell*sheet.frames.length;cv.height=cell;
   const c=cv.getContext('2d');c.imageSmoothingQuality='high';const measured=[];
   for(let i=0;i<sheet.frames.length;i++){
    const f=sheet.frames[i],im=new Image();im.src=sources[f.source];await im.decode();
    const [sx,sy,sw,sh]=f.rect,k=f.scale,w=sw*k,h=sh*k;
    let drawable=im,ox=0,oy=0;
    if(f.cut){const [cx,cy,cw,ch]=f.cut;const tmp=document.createElement('canvas');tmp.width=cw;tmp.height=ch;const tc=tmp.getContext('2d');tc.drawImage(im,cx,cy,cw,ch,0,0,cw,ch);tc.putImageData(isolateFigure(tc.getImageData(0,0,cw,ch)),0,0);drawable=tmp;ox=cx;oy=cy;}
    const dx=cell/2-(f.foot-sx)*k,dy=f.air?(cell-h)/2:(sheet.floor||312)-h-(f.lift||0);
    if(dx<0||dx+w>cell||dy<0||dy+h>cell)throw Error(sheet.path+' frame '+i+' overflows cell');
    c.save();c.beginPath();c.rect(i*cell,0,cell,cell);c.clip();c.drawImage(drawable,sx-ox,sy-oy,sw,sh,i*cell+dx,dy,w,h);c.restore();
    measured.push({name:f.name||String(i),scale:k,x:dx,y:dy,w,h,air:!!f.air});
   }
   return {png:cv.toDataURL('image/png'),webp:cv.toDataURL('image/webp',.95),measured};
  },{sheet,sources});
  if(options.pngDir&&!check){const master=path.join(options.pngDir,sheet.path.replace('assets/characters/hero/','').replace(/\.webp$/,'.png'));fs.mkdirSync(path.dirname(master),{recursive:true});fs.writeFileSync(master,Buffer.from(result.png.split(',')[1],'base64'));}
  if(!options.rawStates&&sheet.path.endsWith('/states.webp')){const cleaned=await page.evaluate(arg=>cleanHeroEyes(arg),{b64:result.png.split(',')[1],EYE:eyeAnchors,NAMES:Object.keys(eyeAnchors),PAD:1.55});result={...result,...cleaned};}
  const png=Buffer.from(result.png.split(',')[1],'base64'),webp=Buffer.from(result.webp.split(',')[1],'base64');
  const dest=path.join(ROOT,sheet.path);const bytes=sheet.path.endsWith('.png')?png:webp;
  if(check&&(!fs.existsSync(dest)||!fs.readFileSync(dest).equals(bytes)))throw Error('Prepared asset differs: '+sheet.path);
  if(!check){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);}
  report.push({path:sheet.path,cells:sheet.frames.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),frames:result.measured});
 }
 return report;
 }finally{await browser.close();}
}
if(require.main===module){const m=(process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:null)||path.join(ROOT,'assets/source/hero/delivery-2026-09-18/manifest.json');build(m,process.argv.includes('--check'),{rawStates:process.argv.includes('--raw-states'),pngDir:process.argv.includes('--png-dir')?path.resolve(process.argv[process.argv.indexOf('--png-dir')+1]):null}).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exit(1)});}
module.exports={build};

