// Local browser-test server: no shell, downloads or external dependencies.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html', '.js':'application/javascript', '.json':'application/json',
  '.css':'text/css', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg',
  '.ogg':'audio/ogg', '.mp3':'audio/mpeg', '.wav':'audio/wav', '.mp4':'video/mp4', '.webm':'video/webm'};
http.createServer((req, res) => {
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (file !== root && !file.startsWith(root + path.sep)) throw new Error('Outside root');
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const stat = fs.statSync(file);
    if (!stat.isFile()) throw new Error('Not a file');
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    // which checkout this is: tests/served-identity.cjs prints it when the bytes
    // do not match, so "another worktree owns :8220" names the worktree
    res.setHeader('X-Served-Root', root);
    res.setHeader('Accept-Ranges', 'bytes');
    let start = 0, end = stat.size - 1;
    if (req.headers.range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      if (!match) { res.writeHead(416); return res.end(); }
      start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end;
      if (start > end) { res.writeHead(416, {'Content-Range': `bytes */${stat.size}`}); return res.end(); }
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    }
    res.setHeader('Content-Length', Math.max(0, end-start+1));
    if (req.method === 'HEAD' || stat.size === 0) return res.end();
    fs.createReadStream(file, {start, end}).on('error', () => res.destroy()).pipe(res);
  } catch (_) { res.writeHead(404); res.end(); }
}).on('error', (e) => {
  // most often EADDRINUSE: some other server (maybe another checkout's) holds
  // the port. tests/run.cjs then verifies by content whether it is this build.
  console.error('Test server not started: ' + e.message); process.exit(1);
}).listen(8220, '127.0.0.1', () => console.log('Test server: http://127.0.0.1:8220 serving ' + root));
