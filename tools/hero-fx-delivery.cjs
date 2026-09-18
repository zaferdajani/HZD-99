// Pack additive VFX independently of body silhouettes and their floor registration.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium}=require('playwright');
async function build(){
 const root=path.resolve(__dirname,'..');
 const m=JSON.parse(fs.readFileSync(path.join(root,'assets/source/hero/delivery-2026-09-18/fx-manifest.json'),'utf8'));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
 try {const page=await browser.newPage();for(const s of m.sheets){
  const raw=fs.readFileSync(path.join(root,s.source));
  if(crypto.createHash('sha256').update(raw).digest('hex')!==s.sha256)throw Error('FX source changed: '+s.source);
  const result=await page.evaluate(async({s,b64})=>{const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();
   const cv=document.createElement('canvas');cv.width=s.frames*320;cv.height=320;const c=cv.getContext('2d');
   c.fillStyle='#000';c.fillRect(0,0,cv.width,cv.height);
   for(let i=0;i<s.frames;i++)c.drawImage(im,(i%s.columns)*im.width/s.columns,Math.floor(i/s.columns)*im.height/s.rows,im.width/s.columns,im.height/s.rows,i*320+12,12,296,296);
   return {webp:cv.toDataURL('image/webp',.95),png:cv.toDataURL('image/png')};
  },{s,b64:raw.toString('base64')});
  fs.writeFileSync(path.join(root,s.path),Buffer.from(result.webp.split(',')[1],'base64'));
  if(process.argv[2]){fs.mkdirSync(process.argv[2],{recursive:true});fs.writeFileSync(path.join(process.argv[2],path.basename(s.path,'.webp')+'.png'),Buffer.from(result.png.split(',')[1],'base64'));}
  console.log('Packed '+s.frames+' body-absent FX frames: '+s.path);
 }}finally{await browser.close();}
}
build().catch(e=>{console.error(e);process.exitCode=1;});
