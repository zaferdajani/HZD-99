const fs = require('node:fs'), path = require('node:path');
const { Readable } = require('node:stream');
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
  '.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.ogg':'audio/ogg',
  '.mp3':'audio/mpeg','.m4a':'audio/mp4','.wav':'audio/wav','.mp4':'video/mp4',
  '.webm':'video/webm','.woff2':'font/woff2','.woff':'font/woff'};
function inside(root, file) {
  const rel = path.relative(root, file);
  return rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel);
}
function resolveAsset(root, input) {
  try {
    const raw = decodeURIComponent(String(input).split('?')[0].split('#')[0]);
    if (/[\x00-\x1f\\]/.test(raw) || raw.split('/').includes('..')) return null;
    const u = new URL(input);
    if (u.protocol !== 'app:' || u.hostname !== 'clawbyte' || u.port || u.username || u.password) return null;
    let name = decodeURIComponent(u.pathname);
    if (name === '/' || !name) name = '/index.html';
    if (/[\x00-\x1f\\:]/.test(name)) return null;
    const file = path.resolve(root, '.' + name);
    return inside(path.resolve(root), file) ? file : null;
  } catch { return null; }
}
function parseRange(header, size) {
  if (header == null) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!m || (!m[1] && !m[2]) || !size) return false;
  let start, end;
  if (!m[1]) {
    const suffix = Number(m[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return false;
    start = Math.max(0, size - suffix); end = size - 1;
  } else {
    start = Number(m[1]); end = m[2] ? Number(m[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) return false;
    end = Math.min(end, size - 1);
  }
  return {start, end};
}
async function serveAsset(root, request) {
  const file = resolveAsset(root, request.url);
  if (!file) return new Response(null, {status:403});
  const method = request.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') return new Response(null, {status:405,headers:{Allow:'GET, HEAD'}});
  try {
    const [realRoot, realFile] = await Promise.all([fs.promises.realpath(root),fs.promises.realpath(file)]);
    if (!inside(realRoot, realFile)) return new Response(null,{status:403});
    const st = await fs.promises.stat(realFile);
    if (!st.isFile()) return new Response(null,{status:404});
    const range = method === 'GET' ? parseRange(request.headers.get('range'),st.size) : null;
    if (range === false) return new Response(null,{status:416,headers:{'Content-Range':`bytes */${st.size}`}});
    const headers = {'Content-Type':MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length':String(range ? range.end-range.start+1 : st.size),'Accept-Ranges':'bytes',
      'X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':"default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'"};
    if (range) headers['Content-Range']=`bytes ${range.start}-${range.end}/${st.size}`;
    const body = method === 'HEAD' || !st.size ? null : Readable.toWeb(fs.createReadStream(realFile,range || {}));
    return new Response(body,{status:range?206:200,headers});
  } catch (err) { return new Response(null,{status:err.code==='EACCES'?403:404}); }
}
module.exports = {resolveAsset,parseRange,serveAsset};
