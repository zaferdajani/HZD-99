const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=process.argv[2]||'_site',commit=process.env.GITHUB_SHA;
if(!/^[0-9a-f]{40}$/.test(commit||''))throw Error('An exact GITHUB_SHA is required');
const hash=file=>createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const pages=['index.html','odyssey.html','forge.html','forge-odyssey.html'];
for(const file of pages){
 const p=path.join(root,file),text=fs.readFileSync(p,'utf8');
 if(!text.includes('</head>')||text.includes('window.DEPLOY_COMMIT='))throw Error('Unrecognized or already stamped page: '+file);
 fs.writeFileSync(p,text.replace('</head>','<script>window.DEPLOY_COMMIT='+JSON.stringify(commit)+';</script>\n</head>'));
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const match=html.match(/window\.BUILD_ID\s*=\s*["']([^"']+)["']/);
if(!match)throw Error('Compiled build ID missing');
const files=[...pages,'loader.html','sw.js','assets/sfx/vox/hzd_atk2.wav','assets/sfx/vox/hzd_yalla.wav'];
const manifest={commit,build_id:match[1],published_at:new Date().toISOString(),files:Object.fromEntries(files.map(f=>[f,hash(f)]))};
fs.writeFileSync(path.join(root,'release.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
