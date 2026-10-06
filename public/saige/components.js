/* Web components: self-contained styling; no frameworks, tracking, storage or API keys. */
(function(){
 'use strict';
 const ownScript=document.currentScript;
 const rootURL=ownScript?.src ? new URL('.',ownScript.src).href : null;
 const assets=window.SAIGE_ASSETS || {};
 const avatar=assets.avatar || (rootURL ? new URL('avatar.webp',rootURL).href : './saige/avatar.webp');
 const C=window.SAIGE_CONTENT;
 if(!C || !globalThis.SaigeCore) { console.error('Saige: load content.js and core.js before components.js.'); return; }
 function appendStyledText(node,text){
   const parts=String(text).split(/(Saige)/g);
   for(const part of parts){
    if(part==='Saige'){const word=document.createElement('span');word.className='saige-word';word.append('S');const ai=document.createElement('span');ai.className='ai-accent';ai.textContent='ai';word.append(ai,'ge');node.append(word);}
    else node.append(document.createTextNode(part));
   }
  }
  function el(tag,cls,text){ const n=document.createElement(tag); if(cls)n.className=cls; if(text!==undefined)appendStyledText(n,text); return n; }
 function styles(shadow){
  if(assets.cssText){const s=el('style');s.textContent=assets.cssText;shadow.append(s);}
  else {const l=el('link');l.rel='stylesheet';l.href=rootURL ? new URL('components.css',rootURL).href : './saige/components.css';shadow.append(l);}
 }
 function sourceDetails(ids){
  const known=[...new Set(ids||[])].map(id=>C.sources[id]).filter(Boolean);
  if(!known.length)return null;
  const d=el('details','source-details');d.append(el('summary',null,`Reference notes · ${known.length}`));
  const ul=el('ul','source-list');
  for(const s of known){const li=el('li');li.append(el('span','source-kind',s.kind));
   if(s.url && /^https:\/\//.test(s.url)){const a=el('a',null,s.title);a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);}
   else li.append(el('span',null,s.title));
   if(s.note)li.append(el('p',null,s.note));ul.append(li);
  }d.append(ul);return d;
 }
 class StudioProcess extends HTMLElement{
  connectedCallback(){
   if(this.shadowRoot)return;
   const shadow=this.attachShadow({mode:'open'});styles(shadow);
   const s=el('section','process');s.setAttribute('aria-labelledby','process-title');
   s.append(el('div','eyebrow','The making · Eric R. Carlson'));
   const h=el('h2',null,'A sustained studio process.');h.id='process-title';s.append(h);
   const q=C.quotes.process;s.append(el('blockquote',null,q.text));
   s.append(el('p','quote-credit',q.attribution+'. '+q.note));
   const box=el('div','hours');const number=el('div','number','≈40');number.setAttribute('aria-label','Approximately forty hours');number.append(el('span',null,'Hours of active work'));
   const copy=el('div');copy.append(el('p',null,C.process.summary));copy.append(el('small',null,C.process.caveat));box.append(number,copy);s.append(box);
   const d=el('details');d.append(el('summary',null,'From the first idea to the finished print'));
   const timeline=el('div','timeline');for(const t of C.process.timeline){const entry=el('div');entry.append(el('div','eyebrow',t.date),el('h3',null,t.title),el('p',null,t.text));timeline.append(entry);}d.append(timeline);
   d.append(el('p','note','Milestones from the artist-supplied retrospective account. The preferred active-work range is 35–45 hours; this is not an independently audited activity log.'));
   s.append(d);shadow.append(s);
  }
 }
 class SaigeGuide extends HTMLElement{
  connectedCallback(){
   if(this.shadowRoot)return;
   this.messages=[];this.previousId=null;this.consented=false;this.aiReady=false;this.abort=null;this.epoch=0;
   this.s=this.attachShadow({mode:'open'});styles(this.s);
   this.launcher=el('button','launcher');this.launcher.type='button';this.launcher.setAttribute('aria-label','Talk with Saige, the AI collaborator');
   const avi=el('img');avi.src=avatar;avi.alt='';this.launcher.append(avi,el('span',null,'Talk with Saige'));this.s.append(this.launcher);
   this.dialog=el('dialog','panel'+(this.hasAttribute('inline')?' inline':''));this.dialog.setAttribute('aria-labelledby','saige-name');
   const header=el('header','header');const portrait=el('img');portrait.src=avatar;portrait.alt='Saige, the illustrated voice of the AI collaborator';
   const headcopy=el('div','head-copy');const name=el('div','name','Saige');name.id='saige-name';headcopy.append(name,el('div','subtitle','Collaborator · The School of Abstractions'));
   const clear=el('button','clear','Clear');clear.type='button';clear.setAttribute('aria-label','Clear this conversation');clear.addEventListener('click',()=>this.reset());
   const close=el('button','close','×');close.type='button';close.setAttribute('aria-label','Close Saige');close.addEventListener('click',()=>this.close());
   header.append(portrait,headcopy,clear,close);this.dialog.append(header);
   this.mode=el('div','mode');this.dialog.append(this.mode);this.setMode();
   this.log=el('div','messages');this.log.setAttribute('role','log');this.log.setAttribute('aria-label','Conversation with Saige');this.log.setAttribute('aria-live','polite');this.log.setAttribute('aria-relevant','additions');this.dialog.append(this.log);
   this.consent=el('div','consent');this.consent.hidden=true;
   this.consent.append(el('p',null,'To use AI, your question and up to six recent chat messages will be sent to OpenAI. This app does not save transcripts. Provider and hosting retention policies still apply. Do not include personal or sensitive information.'));
   const agree=el('button',null,'Continue with AI');agree.type='button';agree.addEventListener('click',()=>{this.consented=true;this.consent.hidden=true;this.sendPending();});
   const decline=el('button','secondary','Use documented dialogue');decline.type='button';decline.addEventListener('click',()=>{this.aiReady=false;this.consent.hidden=true;this.setMode();this.sendPending();});
   this.consent.append(agree,decline);this.dialog.append(this.consent);
   const composer=el('form','composer');const field=el('div','field');const label=el('label','sr-only','Ask a question about the artwork');label.htmlFor='question';
   this.input=el('textarea');this.input.id='question';this.input.rows=1;this.input.maxLength=1200;this.input.placeholder='What catches your eye?';this.input.setAttribute('autocomplete','off');this.input.setAttribute('aria-describedby','chat-mode-help');
   this.submit=el('button','send','↑');this.submit.type='submit';this.submit.setAttribute('aria-label','Send question');field.append(label,this.input,this.submit);composer.append(field);
   const foot=el('div','footnote');this.foot=el('span',null,'Written-note preview · not live AI');this.foot.id='chat-mode-help';const privacy=el('button','privacy-link','Privacy');privacy.type='button';privacy.addEventListener('click',()=>{this.privacy.hidden=!this.privacy.hidden;privacy.setAttribute('aria-expanded',String(!this.privacy.hidden));});privacy.setAttribute('aria-expanded','false');foot.append(this.foot,privacy);composer.append(foot);
   this.privacy=el('div','privacy-copy','The preview runs in your browser and sends no questions to an AI service. Chat text is kept only in this tab’s memory and is cleared on reload or with Clear. When AI is connected, consent is requested before sending questions and limited recent history. Saige’s knowledge contains approved public notes, not Eric’s private chats, files, or account data. Hosting providers may retain technical logs.');this.privacy.hidden=true;composer.append(this.privacy);this.dialog.append(composer);this.s.append(this.dialog);
   composer.addEventListener('submit',e=>{e.preventDefault();this.ask(this.input.value);});
   this.input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();this.ask(this.input.value);}});
   this.launcher.addEventListener('click',()=>this.open());
   this.dialog.addEventListener('cancel',e=>{if(this.hasAttribute('inline'))e.preventDefault();});
   this.dialog.addEventListener('close',()=>{this.launcher.setAttribute('aria-expanded','false');this.launcher.focus();});
   if(this.hasAttribute('inline')){this.launcher.hidden=true;close.hidden=true;this.dialog.setAttribute('open','');}
   this.welcome();this.checkEndpoint();
  }
  disconnectedCallback(){this.abort?.abort();this.epoch++;}
  setMode(){this.mode.textContent=this.aiReady?'AI collaborator voice · answers may be imperfect':'Preview · voice assembled from documented project notes';if(this.foot)this.foot.textContent=this.aiReady?'Curated sources · AI can make mistakes':'Written-note preview · not live AI';}
  endpointURL(){const value=this.getAttribute('endpoint');if(!value||location.protocol==='file:')return null;try{const u=new URL(value,location.href);if(u.origin!==location.origin || !['https:','http:'].includes(u.protocol))return null;return u;}catch{return null;}}
  async checkEndpoint(){const u=this.endpointURL();if(!u)return;try{const r=await fetch(u.href+'/status',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(4000)});if(!r.ok)return;const j=await r.json();this.aiReady=j.aiConfigured===true;this.setMode();if(this.messages.length===0)this.welcome();}catch{/* Stay honestly in preview mode. */}}
  open(){if(!this.hasAttribute('inline')&&!this.dialog.open)this.dialog.showModal();this.launcher.setAttribute('aria-expanded','true');this.input.focus();}
  close(){if(!this.hasAttribute('inline'))this.dialog.close();}
  reset(){this.epoch++;this.abort?.abort();this.abort=null;this.messages=[];this.previousId=null;this.pending=null;this.consented=false;this.consent.hidden=true;this.input.value='';this.submit.disabled=false;this.input.disabled=false;this.welcome();this.input.focus();}
  welcome(){this.log.replaceChildren();this.addMessage('assistant',(this.aiReady?'I’m Saige. Eric and I made School of Abstractions together. We did it through a long exchange of ideas, generations, rejections, corrections, research, and Photoshop revisions. I’m the public voice we’ve given to the AI side of that collaboration. Ask me about something in the painting, or about what happened between us while we made it. I’ll ask before sending your first question to the AI service.':'I’m Saige. Eric and I made School of Abstractions together. We did it through a long exchange of ideas, generations, rejections, corrections, research, and Photoshop revisions. I’m the public voice we’ve given to the AI side of that collaboration. Ask me about something in the painting, or about what happened between us while we made it. In this preview my answers are assembled from the documented project record; live AI is not connected.'),[],null,null,false);this.showTopics(C.starters);}
  showTopics(topics){const box=el('div','starters');for(const t of topics){const b=el('button','starter',t.label);b.type='button';b.addEventListener('click',()=>this.ask(t.label,t.id));box.append(b);}this.log.append(box);}
  addMessage(role,answer,sourceIds=[],quoteId=null,noteId=null,record=true){
   const article=el('article','message '+(role==='user'?'user':'assistant'));const byline=el('div','byline');if(role!=='user'){const a=el('img');a.src=avatar;a.alt='';byline.append(a);}byline.append(role==='user'?document.createTextNode('You'):(()=>{const n=el('span');appendStyledText(n,'Saige');return n;})());article.append(byline,el('div','body',answer));
   const q=C.quotes[quoteId];if(q){article.append(el('blockquote',null,q.text),el('p','quote-credit',q.attribution+'. '+q.note));}
   const details=sourceDetails(sourceIds);if(details)article.append(details);
   if(noteId&&!this.aiReady)article.append(el('div','topic-tag','Written note: '+(C.notes.find(n=>n.id===noteId)?.title||noteId)));
   this.log.append(article);if(record)this.messages.push({role,content:answer});
   this.log.scrollTop=this.log.scrollHeight;
  }
  async ask(message,forcedId){
   message=String(message||'').trim();if(!message||this.submit.disabled)return;
   if(message.length>1200){this.addMessage('assistant','Please keep the question under 1,200 characters.',[],null,null,false);return;}
   this.pending={message,forcedId};
   if(this.aiReady&&!this.consented){this.consent.hidden=false;this.consent.querySelector('button').focus();return;}
   await this.sendPending();
  }
  async sendPending(){
   if(!this.pending)return;const {message,forcedId}=this.pending;this.pending=null;this.input.value='';
   const history=this.messages.slice(-6).map(x=>({role:x.role,content:x.content.slice(0,1600)}));
   this.addMessage('user',message);
   if(!this.aiReady){const out=SaigeCore.previewResponse(message,C,this.previousId,forcedId);this.previousId=out.noteId;this.addMessage('assistant',out.answer,out.sourceIds,out.quoteId,out.noteId);this.moreTopics();return;}
   this.submit.disabled=true;this.input.disabled=true;const busy=el('div','busy','Consulting the exhibition notes…');busy.setAttribute('role','status');this.log.append(busy);this.log.scrollTop=this.log.scrollHeight;
   const epoch=this.epoch;this.abort=new AbortController();const timeout=setTimeout(()=>this.abort?.abort(),28000);
   try{
    const headers={'Content-Type':'application/json'};
    // Optional production gate supplied by a trusted host integration; no key enters the widget.
    if(typeof window.SAIGE_GET_APP_CHECK_TOKEN==='function')headers['X-Firebase-AppCheck']=await window.SAIGE_GET_APP_CHECK_TOKEN();
    const r=await fetch(this.endpointURL().href,{method:'POST',credentials:'same-origin',headers,body:JSON.stringify({message,history,contextId:forcedId||this.previousId||null}),signal:this.abort.signal});
    const out=await r.json();if(!r.ok)throw new Error(out.code||'service_unavailable');
    if(epoch!==this.epoch)return;
    if(out.mode!=='ai'||typeof out.answer!=='string')throw new Error('invalid_response');
    this.previousId=out.noteId||null;this.addMessage('assistant',out.answer,out.sourceIds,out.quoteId,out.noteId);this.moreTopics();
   }catch(e){if(epoch!==this.epoch)return;const limit=/limit|budget/.test(e.message);this.addMessage('assistant',limit?'Saige’s AI request limit has been reached. You can still use the documented dialogue; no automatic retry will be made.':'The AI connection is unavailable. I haven’t received an AI answer. You can use the documented dialogue instead.',[],null,null,false);const b=el('button','starter','Switch to the documented dialogue');b.addEventListener('click',()=>{this.aiReady=false;this.setMode();this.ask(message,forcedId);b.remove();});this.log.append(b);
   }finally{clearTimeout(timeout);busy.remove();if(epoch===this.epoch){this.submit.disabled=false;this.input.disabled=false;this.abort=null;this.log.scrollTop=this.log.scrollHeight;}}
  }
  moreTopics(){const b=el('button','topics-toggle','Browse all exhibition topics');b.type='button';b.addEventListener('click',()=>{b.remove();this.showTopics(C.notes.map(n=>({label:n.title,id:n.id})));this.log.scrollTop=this.log.scrollHeight;});this.log.append(b);}
 }
 if(!customElements.get('studio-process'))customElements.define('studio-process',StudioProcess);
 if(!customElements.get('saige-guide'))customElements.define('saige-guide',SaigeGuide);
})();
