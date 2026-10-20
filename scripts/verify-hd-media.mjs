import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../public/',import.meta.url);
const origin='https://school-of-abstractions.web.app';
async function paths(dir,prefix=''){
 const out=[];
 for(const item of await readdir(new URL(dir,root),{withFileTypes:true})){
  if(item.name.startsWith('.')||item.name==='node_modules')continue;
  if(item.isSymbolicLink())throw new Error('Unexpected symbolic link in public assets.');
  const name=prefix+item.name;
  if(item.isDirectory())out.push(...await paths(name+'/',name+'/'));
  else if(item.isFile())out.push(name);
 }
 return out;
}
const list=await paths('');let cursor=0,verified=0;
if(process.argv.includes('--local')){
 const manifest=JSON.parse(await readFile(new URL('art/hd-v1/manifest.json',root),'utf8'));
 for(const [path,info]of Object.entries(manifest.files)){const data=await readFile(new URL('art/hd-v1/'+path,root));if(data.length!==info.bytes||createHash('sha256').update(data).digest('hex')!==info.sha256)throw new Error('Local media mismatch: '+path);}
 const refs=JSON.parse(await readFile(new URL('art/reference-originals/sources.json',root),'utf8'));if(Object.keys(refs).length!==3)throw new Error('Missing reference metadata.');
 for(const [path,info]of Object.entries(refs)){const data=await readFile(new URL('art/reference-originals/'+path,root));if(data.length!==info.bytes||createHash('sha256').update(data).digest('hex')!==info.sha256)throw new Error('Local reference mismatch: '+path);}
 console.log('All master media and historical-reference bytes verified locally.');process.exit(0);
}
const sha=b=>createHash('sha256').update(b).digest('hex');
async function worker(){
 while(cursor<list.length){
  const path=list[cursor++],local=await readFile(new URL(path,root));let ok=false;
  for(let attempt=0;attempt<3&&!ok;attempt++){
   try{
    const url=origin+'/'+path.split('/').map(encodeURIComponent).join('/')+'?verify='+Date.now()+'-'+attempt;
    const r=await fetch(url,{signal:AbortSignal.timeout(45000),cache:'no-store'});
    if(r.ok){const remote=Buffer.from(await r.arrayBuffer());ok=remote.length===local.length&&sha(remote)===sha(local);}
   }catch{/* Retry at most twice; never announce unverified content as published. */}
   if(!ok&&attempt<2)await new Promise(r=>setTimeout(r,1500));
  }
  if(!ok)throw new Error('Live file verification failed: '+path);
  verified++;
 }
}
try{
 await Promise.all(Array.from({length:3},worker));
 console.log(`High-resolution release verified: ${verified} public files match the local release.`);
 console.log(origin);
}catch(e){console.error('The deployment is NOT fully verified. '+e.message);process.exitCode=1;}
