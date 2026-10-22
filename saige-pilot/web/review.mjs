import {connect,node,friendly} from './client.mjs';
const $=id=>document.getElementById(id);let api,next=null,page=null;
const status=t=>$('status').textContent=t;
function clear(){page=null;next=null;$('records').replaceChildren();$('summary').replaceChildren();$('workspace').hidden=true;$('next').disabled=true;$('export').disabled=true;}
async function load(cursor=null){
 try{const data=await api.call('saigeReview',{cursor,firstName:$('name-filter').value,query:$('query').value});page=data;next=data.nextCursor;$('workspace').hidden=false;
  $('summary').replaceChildren(node('h2',`${data.sessions} saved sessions · ${data.turns} recognized questions`),node('p',data.coverage),node('p',data.caveat,'note'));
  for(const t of data.topics)$('summary').append(node('p',`${t.topic}: ${t.turns} replies across ${t.sessionIds.length} saved sessions.`));
  $('records').replaceChildren();
  for(const r of data.records){const article=node('article',undefined,'card');article.append(node('h2',r.firstName||'Guest (no saved name)'),node('p',new Date(r.createdAt).toLocaleString()),node('p',`Record ${r.id.slice(0,12)} · expires ${new Date(r.expiresAt).toLocaleDateString()}`,'note'));
   for(const t of r.turns){const block=node('details');block.append(node('summary',`Recognized topic: ${t.topic}`),node('p',`Standardized question summary: ${t.questionSummary}`),node('p',`Approved reply sent: ${t.answer}`),node('p',`Evidence: record ${r.id}, turn ${t.ordinal}; script ${t.catalogVersion}`,'note'));article.append(block);}
   const remove=node('button','Delete this saved session','secondary');remove.onclick=async()=>{if(!confirm('Delete this session’s review record and any saved name?'))return;try{await api.call('saigeRemoveReview',{id:r.id});await load();}catch(e){status(friendly(e));}};article.append(remove);$('records').append(article);
  }
  $('next').disabled=!next;$('export').disabled=false;status('Private records loaded. They are not available to public Saige.');
 }catch(e){clear();status(friendly(e));}
}
$('login').onclick=async()=>{try{await api.login();$('logout').hidden=false;await load();}catch(e){clear();status(friendly(e));}};
$('logout').onclick=async()=>{clear();await api.logout();$('logout').hidden=true;status('Signed out. Conversation records were removed from this view.');};
$('filters').onsubmit=e=>{e.preventDefault();load();};$('next').onclick=()=>load(next);
$('export').onclick=()=>{if(!page)return;const safe={...page,exportedAt:new Date().toISOString(),warning:'Private visitor review data. Do not upload to the public repository or share without appropriate permission.'};const blob=new Blob([JSON.stringify(safe,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='saige-private-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('pagehide',clear);
try{api=await connect();$('login').disabled=false;status('Sign in using the approved owner account.');}catch(e){status(friendly(e));}
