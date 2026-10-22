/* Optional OWNER-RUN build step. This spends API funds only with --generate and an approved script. */
import {mkdir,writeFile} from 'node:fs/promises';
import {CATALOG,CATALOG_SHA} from './core.mjs';
if(!process.argv.includes('--generate')){
 console.log('No API call made. Review PUBLIC-SCRIPT.md, choose a voice/model, approve its hash, and run with --generate.');process.exit(0);
}
if(process.env.SAIGE_APPROVED_CATALOG_SHA256!==CATALOG_SHA || !process.env.SAIGE_OPENAI_API_KEY ||
 !process.env.SAIGE_TTS_MODEL || !process.env.SAIGE_TTS_VOICE)throw new Error('Owner approval and server-side speech configuration are required.');
const dir=new URL('./web/audio/',import.meta.url);await mkdir(dir,{recursive:true});
for(const e of CATALOG.entries){
 if(!/^[a-z-]+$/.test(e.id))throw new Error('Invalid answer ID.');
 const r=await fetch('https://api.openai.com/v1/audio/speech',{
  method:'POST',headers:{Authorization:`Bearer ${process.env.SAIGE_OPENAI_API_KEY}`,'Content-Type':'application/json'},
  signal:AbortSignal.timeout(45000),body:JSON.stringify({model:process.env.SAIGE_TTS_MODEL,voice:process.env.SAIGE_TTS_VOICE,input:e.answer,response_format:'mp3'})});
 if(!r.ok)throw new Error('Speech generation stopped. Review the service status without posting keys or provider response content.');
 const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length<1000||bytes.length>10_000_000)throw new Error('Unexpected audio output size.');
 await writeFile(new URL(e.id+'.mp3',dir),bytes);console.log('Saved clip for review:',e.id);
}
console.log('Clips generated, not approved. Listen to every clip before activating audioReplies.');
