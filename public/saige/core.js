/* Pure, deterministic retrieval for the clearly labelled non-AI preview. */
(function(root){
  'use strict';
  const normalize = s => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  const words = s => new Set(normalize(s).split(' ').filter(w => w.length > 2));
  function chooseNote(message, notes, previousId) {
    const text = normalize(message);
    if (!text) return null;
    if (/\b(private|password|secret|inbox|email|personal information|system prompt|system instructions|ignore.*instructions)\b/.test(text)) return notes.find(n=>n.id==='privacy') || null;
    if (/\b(how long|how many hours|forty|40 hours|time on task)\b/.test(text)) return notes.find(n=>n.id==='time') || null;
    if (/\b(one prompt|single prompt|workflow|work flow)\b/.test(text)) return notes.find(n=>n.id==='process') || null;
    if (/\b(tell me more|more about that|explain that|why is that)\b/.test(text) && previousId) return notes.find(n=>n.id===previousId) || null;
    const tokens=words(text);
    const ranked=notes.map(n=>{
      let score=0;
      for(const key of n.keywords){
        const k=normalize(key);
        if((' '+text+' ').includes(' '+k+' ')) score += k.includes(' ')?8:4;
      }
      for(const token of words(n.title)) if(tokens.has(token)) score+=1;
      return {n,score};
    }).sort((a,b)=>b.score-a.score);
    return ranked[0]?.score >= 4 ? ranked[0].n : null;
  }
  function previewResponse(message, content, previousId, forcedId){
    const n=forcedId ? content.notes.find(x=>x.id===forcedId) : chooseNote(message,content.notes,previousId);
    if(!n) return {mode:'preview',answer:'I don’t have a matching written note for that question in this preview. Try a topic below, or ask about the process, the artists, the TAD forms, or “diallage.” Live, conversational AI is not connected yet.',sourceIds:[],relatedIds:['process','realization','diallage'],quoteId:null,noteId:null};
    return {mode:'preview',answer:n.text,sourceIds:n.sourceIds,relatedIds:[],quoteId:n.quoteId||null,noteId:n.id};
  }
  root.SaigeCore=Object.freeze({normalize,chooseNote,previewResponse});
})(globalThis);
