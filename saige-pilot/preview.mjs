/* Loopback-only static design preview. No mock authentication or public log endpoint. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const allowed=new Set(['index.html','review.html','visitor.mjs','review.mjs','client.mjs','ui.css','runtime-config.json']);
const types={html:'text/html; charset=utf-8',mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json'};
createServer(async(req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(req.method!=='GET'||!allowed.has(p)){res.writeHead(404);return res.end('Not found');}const b=await readFile(new URL('./web/'+p,import.meta.url));res.writeHead(200,{'Content-Type':types[p.split('.').at(-1)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(b);}catch{res.writeHead(404);res.end('Not found');}}).listen(4174,'127.0.0.1',()=>console.log('Disabled pilot preview: http://127.0.0.1:4174 — owner page /review.html'));
