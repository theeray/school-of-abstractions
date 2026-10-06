/* Contextual hand-off from the exhibition. The topic ID is allow-listed. */
(function(){
 'use strict';
 async function ask(question,topic){
  await customElements.whenDefined('saige-guide');const guide=document.querySelector('saige-guide');if(!guide)return;
  const note=window.SAIGE_CONTENT.notes.find(n=>n.id===topic);if(!note)return;
  document.querySelector('#talk').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  await guide.ask(question||note.title,note.id);guide.input.focus({preventScroll:true});
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-saige-topic]');if(b)ask(b.dataset.saigeQuestion,b.dataset.saigeTopic);});
 const topic=new URLSearchParams(location.search).get('topic');
 if(topic&&window.SAIGE_CONTENT.notes.some(n=>n.id===topic))ask(null,topic);
})();
