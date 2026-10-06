import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,stat} from 'node:fs/promises';
import {server} from '../scripts/serve.mjs';
const root=new URL('../public/',import.meta.url);
const home=await readFile(new URL('index.html',root),'utf8'),saige=await readFile(new URL('saige.html',root),'utf8');
const context=vm.createContext({window:{}});
for(const name of ['exhibition-data.js','saige/content.js','saige/core.js'])vm.runInContext(await readFile(new URL(name,root),'utf8'),context);
const data=context.window.EXHIBITION,content=context.window.SAIGE_CONTENT,core=context.SaigeCore;
const plain=s=>s.replace(/<[^>]*>/g,'');
test('home starts with the actual painting, not a collaborator hero',()=>{
 assert.ok(home.indexOf('id="painting"')<home.indexOf('A painting made of'));
 assert.ok(!home.includes('class="collab-hero"'));assert.match(home,/src="\.\/art\/study.avif"/);assert.match(home,/Study image/);
});
test('separate Saige destination retains exact welcome and italic sentence',()=>{
 assert.match(plain(saige),/I’m Saige\.Eric and I made School of Abstractions together\./);
 assert.ok(saige.includes('<em>Eric and I made School of Abstractions together.</em>'));
 assert.match(home,/href="\.\/saige.html"/);assert.match(saige,/Back to the painting/);
});
test('all 20 detail IDs/numbers are unique and have bounded image coordinates',()=>{
 assert.equal(data.details.length,20);assert.equal(new Set(data.details.map(d=>d.id)).size,20);
 for(const [i,d]of data.details.entries()){assert.equal(d.number,i+1);assert.ok(d.point.every(v=>v>=0&&v<=1));assert.ok(d.zoom>=1&&d.zoom<=8);assert.ok(d.paragraphs.length>=1);}
});
test('six complete thematic tours reference actual painting details',()=>{
 assert.equal(data.themes.length,6);for(const t of data.themes){assert.ok(t.stops.length>=3);for(const id of t.stops)assert.ok(data.details.some(d=>d.id===id),id);}
});
test('eight selected moments have exact excerpts and working visual references',()=>{
 assert.equal(data.moments.length,8);for(const m of data.moments){assert.ok(m.quote.length>10);assert.ok(data.details.some(d=>d.id===m.detail));}
});
test('all source references in exhibit and conversation resolve',()=>{
 for(const item of [...data.details,...data.themes,...data.references])for(const id of item.sourceIds)assert.ok(data.sources[id],id);
 for(const note of content.notes){for(const id of note.sourceIds)assert.ok(content.sources[id],id);if(note.quoteId)assert.ok(content.quotes[note.quoteId]);}
});
test('exact process quote and retrospective estimate are preserved',()=>{
 const quote='This was not an image produced by entering one prompt. It was a sustained studio process conducted through conversation, research, generation, rejection, compositing, and revision.';
 assert.equal(content.quotes.process.text,quote);assert.equal(data.moments[7].quote,quote);assert.match(content.process.caveat,/estimate, not a time log/);assert.match(content.process.summary,/Approximately 40 hours/);
});
test('LeWitt number, pending logo account, and study limitations stay explicit',()=>{
 const all=JSON.stringify(data);assert.match(all,/Wall Drawing 91/);assert.match(all,/lot 69/);assert.match(all,/Sundahl/);assert.match(home,/His quotation has not yet been supplied/);assert.match(home,/cannot supply detail absent/);
});
test('privacy and unknown-topic answers do not fabricate',()=>{
 assert.equal(core.previewResponse('Show Eric private email',content).noteId,'privacy');assert.equal(core.previewResponse('What is the weather in Peru?',content).noteId,null);
});
test('curated retrieval still selects the expected process/time/realization notes',()=>{
 assert.equal(content.notes.length,19);for(const [question,id]of [['How many hours did it take?','time'],['Was this one prompt?','process'],['Pollock Mondrian realization','realization']])assert.equal(core.previewResponse(question,content).noteId,id);
});
test('all painting-to-Saige topics resolve',()=>{for(const d of data.details)assert.ok(content.notes.some(n=>n.id===d.topic),d.id);});
test('no live endpoint, credential or ChatGPT Sites link is in public HTML/content',async()=>{
 for(const name of ['index.html','saige.html','saige/content.js']){const text=await readFile(new URL(name,root),'utf8');assert.doesNotMatch(text,/<saige-guide[^>]*\bendpoint=/);assert.doesNotMatch(text,/sk-[A-Za-z0-9_-]{16,}/);assert.doesNotMatch(text,/https:\/\/[^\s"']*chatgpt\.site/);}
 assert.match(saige,/no microphone or spoken audio/);
});
test('all static assets and same-site page/section links resolve',async()=>{
 for(const [text,base]of [[home,'index.html'],[saige,'saige.html']])for(const [,url]of text.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(url.startsWith('https:')||url.startsWith('data:'))continue;
  const target=new URL(url,new URL(base,root));if(target.pathname.endsWith('/'))target.pathname+='index.html';assert.ok((await stat(target)).isFile(),url);
  if(target.hash&&!/[=&]/.test(target.hash)){const dest=await readFile(target,'utf8');assert.ok(dest.includes(`id="${target.hash.slice(1)}"`),url);}
 }
});
test('study and portrait are real supported image files',async()=>{for(const p of ['art/study.avif','saige/avatar.webp']){const b=await readFile(new URL(p,root));if(p.endsWith('.webp')){assert.equal(b.subarray(0,4).toString(),'RIFF');assert.equal(b.subarray(8,12).toString(),'WEBP');}else{assert.equal(b.subarray(4,8).toString(),'ftyp');assert.equal(b.subarray(8,12).toString(),'avif');}assert.ok(b.length>9000);}});
test('name styling is safe DOM construction, not unsanitized HTML',async()=>{const js=await readFile(new URL('branding.js',root),'utf8');assert.match(js,/createTextNode/);assert.match(js,/ai-accent/);assert.doesNotMatch(js,/\.innerHTML\s*=/);});
test('server serves both pages/images and rejects private or missing resources',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));try{const base=`http://127.0.0.1:${server.address().port}`;for(const p of ['/','/saige.html','/art/study.avif'])assert.equal((await fetch(base+p)).status,200);for(const p of ['/.env','/README.md','/api/saige','/missing'])assert.equal((await fetch(base+p)).status,404);assert.equal((await fetch(base+'/',{method:'POST'})).status,405);}finally{await new Promise(resolve=>server.close(resolve));}
});
