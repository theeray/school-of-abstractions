/* Link the prepared story to Saige's documented responses. */
'use strict';
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-saige-question]');
  if (!button) return;
  await customElements.whenDefined('saige-guide');
  const guide = document.querySelector('saige-guide');
  if (!guide) return;
  document.querySelector('#talk').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  await guide.ask(button.dataset.saigeQuestion, button.dataset.saigeTopic);
  guide.input.focus({preventScroll: true});
});

/* Style every visible rendering of Saige so the embedded “ai” reads subtly. */
(function styleSaigeNames(){
  const wrapTextNode=node=>{
    if(!node.nodeValue || !node.nodeValue.includes('Saige')) return;
    const parent=node.parentElement;
    if(!parent || ['SCRIPT','STYLE','TEXTAREA'].includes(parent.tagName)) return;
    const frag=document.createDocumentFragment();
    const parts=node.nodeValue.split(/(Saige)/g);
    for(const part of parts){
      if(part==='Saige'){
        const word=document.createElement('span');word.className='saige-word';word.append('S');
        const ai=document.createElement('span');ai.className='ai-accent';ai.textContent='ai';word.append(ai,'ge');frag.append(word);
      } else frag.append(document.createTextNode(part));
    }
    node.replaceWith(frag);
  };
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(wrapTextNode);
})();
