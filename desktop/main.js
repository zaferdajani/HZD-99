// One packaged game, stable origin and save directory across installs/launches.
const {app, BrowserWindow, protocol, session, dialog} = require('electron');
const fs = require('node:fs'), path = require('node:path');
const {serveAsset} = require('./protocol.cjs');
const ROOT = path.join(__dirname,'www'), GAME_URL='app://clawbyte/index.html';
const arg = key => process.argv.find(v=>v.startsWith('--'+key+'='))?.slice(key.length+3);
const smokeReport=arg('smoke-test'), smokePhase=arg('smoke-phase'), smokeProfile=arg('smoke-profile');
app.setName('CLAWBYTE');
if (smokeReport) {
  if (!path.isAbsolute(smokeReport) || !smokeProfile || !path.isAbsolute(smokeProfile) ||
      !['write','read'].includes(smokePhase)) throw new Error('Smoke test requires absolute report/profile and write/read phase');
  fs.mkdirSync(smokeProfile,{recursive:true}); app.setPath('userData',smokeProfile);
} else {
  const profile=path.join(app.getPath('appData'),'CLAWBYTE');
  fs.mkdirSync(profile,{recursive:true}); app.setPath('userData',profile);
}
protocol.registerSchemesAsPrivileged([{scheme:'app',privileges:{
  standard:true,secure:true,supportFetchAPI:true,stream:true,codeCache:true
}}]);
let win, finished=false;
const errors=[];
function fail(error) {
  errors.push(String(error));
  if (smokeReport) finish({ok:false,errors});
  else { dialog.showErrorBox('CLAWBYTE could not start',String(error)); app.quit(); }
}
function finish(report) {
  if (finished) return; finished=true;
  fs.mkdirSync(path.dirname(smokeReport),{recursive:true});
  fs.writeFileSync(smokeReport,JSON.stringify({...report,phase:smokePhase,electron:process.versions.electron},null,2));
  app.exit(report.ok?0:1);
}
function localURL(url) {
  try { const u=new URL(url);return u.protocol==='app:' && u.host==='clawbyte' && !u.username && !u.password; }
  catch { return false; }
}
async function smoke() {
  const timeout=setTimeout(()=>fail('Desktop smoke test timed out'),60000);
  try {
    for(let i=0;i<150;i++) {
      if(await win.webContents.executeJavaScript("typeof startGame==='function' && typeof loadStored==='function'")) break;
      await new Promise(r=>setTimeout(r,100));
    }
    const tracks=fs.readdirSync(path.join(ROOT,'assets/music')).filter(f=>/\.(ogg|mp3|m4a)$/.test(f));
    if(!tracks.length) throw new Error('No packaged music');
    const mediaURL=GAME_URL.replace('index.html','assets/music/'+encodeURIComponent(tracks[0]));
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const phase=${JSON.stringify(smokePhase)}, mediaURL=${JSON.stringify(mediaURL)};
      let save;
      if(phase==='write') {
        save=newSave(1); save.flags.woke=1;save.flags.tut=1;save.flags.desktopSmoke=true;save.time=99;
        startGame(save);persist();
      } else {
        save=loadStored('robo');
        if(!save?.flags?.desktopSmoke)throw Error('Saved game did not survive executable restart');
        startGame(save);
      }
      G.dialog=null;G.state='PLAY';G.enemies=[];G.boss=null;
      const start=player.x;
      keys.ArrowRight=true;
      for(let i=0;i<30;i++)player.update(1/60);
      delete keys.ArrowRight;
      if(player.x<=start)throw Error('Keyboard movement did not advance player');
      const response=await fetch(mediaURL,{headers:{Range:'bytes=0-15'}});
      if(response.status!==206||(await response.arrayBuffer()).byteLength!==16)throw Error('Packaged media range failed');
      let remoteBlocked=false;try{await fetch('https://example.com/');}catch{remoteBlocked=true;}
      if(!remoteBlocked)throw Error('Remote network not blocked');
      return {ok:true,build:BUILD_ID,saveRecovered:phase==='read',movement:true,mediaRange:true,
        offline:true,gamepadAPI:typeof navigator.getGamepads==='function',origin:location.href};
    })()`,true);
    if(errors.length)throw Error(errors.join('\n'));
    await session.defaultSession.flushStorageData();
    clearTimeout(timeout);finish(result);
  } catch(error) {clearTimeout(timeout);fail(error);}
}
async function makeWindow() {
  const ses=session.defaultSession;
  protocol.handle('app',request=>serveAsset(ROOT,request));
  ses.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
  ses.setPermissionCheckHandler(()=>false);
  // Runtime is self-contained. No remote page, tracking, or update script runs in it.
  ses.webRequest.onBeforeRequest((details,callback)=>{
    callback({cancel:!localURL(details.url)&&!details.url.startsWith('data:')&&!details.url.startsWith('blob:')});
  });
  win=new BrowserWindow({width:1280,height:720,minWidth:800,minHeight:450,backgroundColor:'#04060a',
    title:'CLAWBYTE',show:false,autoHideMenuBar:true,webPreferences:{
      contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,
      webviewTag:false,devTools:!app.isPackaged,backgroundThrottling:true,
      autoplayPolicy:'no-user-gesture-required'
    }});
  win.setMenuBarVisibility(false);
  if(!smokeReport)win.once('ready-to-show',()=>win.show());
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{if(!localURL(url))event.preventDefault();});
  win.webContents.on('will-attach-webview',event=>event.preventDefault());
  win.webContents.on('before-input-event',(event,input)=>{
    if(input.type==='keyDown'&&input.key==='F11'){event.preventDefault();win.setFullScreen(!win.isFullScreen());}
  });
  win.on('blur',()=>win.webContents.executeJavaScript(`
    if(typeof suspendInput==='function')suspendInput();
    if(typeof hzdQuiet==='function')hzdQuiet();
    if(typeof G!=='undefined'&&G.state==='PLAY'){G.state='PAUSE';G.pauseIdx=0;}
  `).catch(()=>{}));
  win.webContents.on('render-process-gone',(_event,details)=>fail('Renderer exited: '+details.reason));
  win.webContents.on('did-fail-load',(_event,code,description)=>{if(code!==-3)fail(description);});
  win.webContents.on('did-finish-load',async()=>{
    await win.webContents.executeJavaScript('void 0',true);
    if(smokeReport)await smoke(); else win.focus();
  });
  await win.loadURL(GAME_URL);
}
if(!app.requestSingleInstanceLock())app.quit();
else {
  app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus();}});
  app.whenReady().then(makeWindow).catch(fail);
  app.on('window-all-closed',()=>app.quit());
}
