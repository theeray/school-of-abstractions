import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.json':'application/json; charset=utf-8'};
export const server = http.createServer(async (req, res) => {
  const headers = {'X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, {...headers, Allow:'GET, HEAD'}); return res.end(); }
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes('\0') || pathname.split('/').some(part => part.startsWith('.'))) throw new Error('Invalid path');
    const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root) || !(await stat(file)).isFile()) throw new Error('Not found');
    const body = await readFile(file);
    res.writeHead(200, {...headers, 'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, {...headers, 'Content-Type':'text/plain; charset=utf-8'});
    res.end('Not found');
  }
});
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  server.listen(port, '127.0.0.1', () => console.log(`Saige preview: http://127.0.0.1:${port}`));
}
