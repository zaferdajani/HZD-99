// CLAWBYTE — the desktop shell.
//
// Same game, same build, in an Electron window. There is no port here and no
// second copy of anything: `tools/pack-www.cjs` assembles exactly what the web
// gets into www/, and this loads it.
//
// TWO DECISIONS WORTH THE WORDS.
//
// It serves over http://127.0.0.1 rather than opening www/index.html as a
// file:// URL. file:// looks simpler and is a trap: media elements, ranged
// requests for the streamed score, and anything the browser treats as
// cross-origin all behave differently there, so the desktop build would be
// subtly its own platform with its own bugs. A four-line static server on a
// random free port means the shipped game runs on precisely the same terms it
// was tested on.
//
// And `autoplayPolicy: 'no-user-gesture-required'`. On the web no browser will
// play audio nobody asked for, which is why the game carries a "tap for sound"
// badge — and it is why a player on a controller got a silent game, since a pad
// press is not a user gesture. Inside our own shell that policy is ours to set,
// and the opening simply begins with its score.
const { app, BrowserWindow, shell } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, 'www');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
};

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent((req.url || '/').split('?')[0]);
      if (p === '/' || p === '') p = '/index.html';
      // never serve outside www/, whatever the request says
      const file = path.join(ROOT, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
      if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
      fs.stat(file, (err, st) => {
        if (err || !st.isFile()) { res.writeHead(404).end('not found'); return; }
        const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
        // ranged requests: the score is STREAMED through <audio>, and a server
        // that ignores Range makes every seek re-download the whole track
        const range = req.headers.range;
        if (range) {
          const m = /bytes=(\d*)-(\d*)/.exec(range);
          const start = m && m[1] ? parseInt(m[1], 10) : 0;
          const end = m && m[2] ? parseInt(m[2], 10) : st.size - 1;
          res.writeHead(206, {
            'Content-Type': type,
            'Content-Range': `bytes ${start}-${end}/${st.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
          });
          fs.createReadStream(file, { start, end }).pipe(res);
          return;
        }
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
        fs.createReadStream(file).pipe(res);
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv.address().port));
  });
}

async function makeWindow() {
  const port = await serve();
  const win = new BrowserWindow({
    width: 1280, height: 720,
    minWidth: 640, minHeight: 360,
    backgroundColor: '#04060a',
    autoHideMenuBar: true,
    show: false,
    title: 'CLAWBYTE',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,   // a paused simulation in an unfocused window is a bug
      autoplayPolicy: 'no-user-gesture-required',
    },
  });
  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => win.show());
  // F11 fullscreen, Escape leaves it — the game's own Escape is the pause menu,
  // so it is only intercepted while actually fullscreen
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { e.preventDefault(); win.setFullScreen(!win.isFullScreen()); }
    else if (input.key === 'Escape' && win.isFullScreen()) { e.preventDefault(); win.setFullScreen(false); }
  });
  // nothing in this game should ever open a second window
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });

  // GRANT THE PAGE A USER ACTIVATION, ONCE, AT LOAD.
  //
  // Chromium gates more than audio behind "has the user interacted with this
  // page yet" — the GAMEPAD API is behind the same gate. navigator.getGamepads()
  // returns an empty rack until activation is granted, no matter what is
  // plugged in.
  //
  // On the web that never shows, because the "tap for sound" badge makes every
  // player click before they reach the game. Here we deliberately removed the
  // need to click, so the score could start with the picture — and the
  // unintended consequence was that a player holding a controller and touching
  // nothing else was never granted activation, and their controller genuinely
  // did not exist as far as the page could tell. Silent, and impossible to
  // guess at from inside the game.
  //
  // executeJavaScript's second argument is exactly this: run trivial script
  // WITH a user gesture. It costs nothing and it is the shell's business to
  // decide, the same way the autoplay policy above is.
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript('void 0', true).catch(() => {});
    win.focus();
  });
  win.loadURL(`http://127.0.0.1:${port}/index.html`);
}

app.whenReady().then(makeWindow);
app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) makeWindow(); });
