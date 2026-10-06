import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../public/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.avif':'image/avif','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
export const server=createServer(async(req,res)=>{
 const fail=(status)=>{res.writeHead(status,{'Content-Type':'text/plain'});res.end(status===404?'Not found':'Request not allowed');};
 if(!['GET','HEAD'].includes(req.method)){fail(405);return;}
 try{
  const url=new URL(req.url,'http://localhost');let path=decodeURIComponent(url.pathname);if(path.endsWith('/'))path+='index.html';
  if(path.split('/').some(part=>part.startsWith('.'))){fail(404);return;}
  const target=resolve(root,'.'+path);if(!target.startsWith(root.endsWith(sep)?root:root+sep)){fail(404);return;}
  if(!(await stat(target)).isFile()){fail(404);return;}
  const bytes=await readFile(target);res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);
 }catch{fail(404);}
});
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))server.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+(process.env.PORT||4173)));
