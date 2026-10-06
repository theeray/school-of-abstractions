/* Brand ordinary text safely, without innerHTML, changing quotes, or editing form values. */
(function(){
 'use strict';
 const CSS='.saige-word{white-space:nowrap}.saige-word .ai-accent{color:var(--saige-ai,#975d32)}.launcher .saige-word .ai-accent{color:#f1c185}';
 const observed=new WeakSet();
 function mark(node){
  if(node.nodeType!==Node.TEXT_NODE||!node.nodeValue.includes('Saige'))return;
  const parent=node.parentElement;
  if(!parent||parent.closest('script,style,textarea,input,select,option,title,.saige-word,[data-no-brand],[contenteditable]'))return;
  const fragment=document.createDocumentFragment();
  for(const part of node.nodeValue.split(/(Saige)/g)){
   if(part!=='Saige'){fragment.append(document.createTextNode(part));continue;}
   const span=document.createElement('span');span.className='saige-word';span.append('S');
   const ai=document.createElement('span');ai.className='ai-accent';ai.textContent='ai';span.append(ai,'ge');fragment.append(span);
  }
  node.replaceWith(fragment);
 }
 function walk(root){
  if(root.nodeType===Node.TEXT_NODE){mark(root);return;}
  if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
  if(root.nodeType===Node.ELEMENT_NODE&&root.matches('script,style,textarea,input,select,title,.saige-word'))return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(mark);
  if(root.shadowRoot)observe(root.shadowRoot);
  root.querySelectorAll?.('*').forEach(el=>{if(el.shadowRoot)observe(el.shadowRoot);});
 }
 function observe(root){
  if(observed.has(root))return;observed.add(root);
  if(root instanceof ShadowRoot){const style=document.createElement('style');style.textContent=CSS;root.append(style);}
  walk(root);
  new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')mark(record.target);else record.addedNodes.forEach(walk);}}).observe(root,{subtree:true,childList:true,characterData:true});
 }
 window.SaigeBrand={apply:walk};observe(document.body);
})();
