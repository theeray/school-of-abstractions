/* Painting-first exhibition. Local data and images; no model/API calls. */
(function(){
 'use strict';
 const D=window.EXHIBITION;if(!D)return;
 const $=id=>document.getElementById(id), el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const details=new Map(D.details.map(d=>[d.id,d]));
 function link(label,href,cls){const a=el('a',cls,label);a.href=href;return a;}
 function sourceItem(id){const s=D.sources[id];if(!s)return null;const box=el('div','source-entry');box.append(el('span','source-kind',s.kind));if(s.url){const a=link(s.title,s.url);a.target='_blank';a.rel='noopener noreferrer';box.append(a);}else box.append(el('strong',null,s.title));if(s.note)box.append(el('p',null,s.note));return box;}
 function sources(ids){const box=el('details','source-mini');const valid=[...new Set(ids||[])].filter(id=>D.sources[id]);if(!valid.length)return el('span');box.append(el('summary',null,`Source notes · ${valid.length}`));for(const id of valid)box.append(sourceItem(id));return box;}
 const state={zoom:1,cx:.5,cy:.5,pins:true,selected:null,tour:null,stop:0};
 const stage=$('painting-stage'),image=$('painting'),overlay=$('hotspots');const pinNodes=new Map();let width=0,height=0,base=1,frame=null,statusTimer=null;
 const minor=new Set(['tad','t','a','d','equations','droplets','raphael']);
 for(const d of D.details){
  const pin=el('button','hotspot',String(d.number));pin.type='button';pin.title=`${d.number}. ${d.name}`;pin.setAttribute('aria-label',pin.title);pin.setAttribute('aria-pressed','false');pin.dataset.minor=String(minor.has(d.id));pin.dataset.detail=d.id;pin.addEventListener('click',()=>{location.hash='detail='+d.id;});pinNodes.set(d.id,pin);overlay.append(pin);
  const ribbon=link('', '#detail='+d.id,'ribbon-item');ribbon.dataset.detail=d.id;ribbon.append(el('b',null,String(d.number).padStart(2,'0')),document.createTextNode(d.name));$('detail-ribbon').append(ribbon);
  const a=link('', '#detail='+d.id,'detail-card');a.dataset.detail=d.id;const thumb=el('div','detail-thumb');thumb.setAttribute('aria-hidden','true');thumb.style.backgroundPosition=`${d.point[0]*100}% ${d.point[1]*100}%`;if(d.id==='raphael')thumb.style.backgroundSize='cover';const copy=el('div','detail-card-copy');copy.append(el('span','number-label',String(d.number).padStart(2,'0')),el('h3',null,d.name),el('p',null,d.subtitle));a.append(thumb,copy);$('detail-grid').append(a);
 }
 function metrics(){width=stage.clientWidth;height=stage.clientHeight;base=Math.min(width/(image.naturalWidth||1200),height/(image.naturalHeight||800));}
 function render(){
  frame=null;metrics();const iw=image.naturalWidth||1200,ih=image.naturalHeight||800,dw=iw*base*state.zoom,dh=ih*base*state.zoom;
  const minX=Math.min(.5,width/(2*dw)),minY=Math.min(.5,height/(2*dh));state.cx=Math.max(minX,Math.min(1-minX,state.cx));state.cy=Math.max(minY,Math.min(1-minY,state.cy));
  const tx=width/2-state.cx*dw,ty=height/2-state.cy*dh;image.style.width=iw+'px';image.style.height=ih+'px';image.style.transform=`translate(${tx}px,${ty}px) scale(${base*state.zoom})`;
  overlay.hidden=!state.pins;overlay.classList.toggle('show-all',state.zoom>1.8);
  for(const d of D.details){const p=pinNodes.get(d.id),x=tx+d.point[0]*dw,y=ty+d.point[1]*dh;p.style.left=x+'px';p.style.top=y+'px';p.hidden=x<0||y<0||x>width||y>height;p.style.display=d.id===state.selected?'grid':'';p.setAttribute('aria-pressed',String(d.id===state.selected));}
  $('zoom-out').disabled=state.zoom<=1;$('zoom-in').disabled=state.zoom>=8;
  clearTimeout(statusTimer);statusTimer=setTimeout(()=>{$('zoom-status').textContent=`Painting zoom ${Math.round(state.zoom*100)} percent.`;},180);
 }
 function schedule(){if(frame===null)frame=requestAnimationFrame(render);}
 function setView(point=[.5,.5],zoom=1){state.cx=point[0];state.cy=point[1];state.zoom=Math.max(1,Math.min(8,zoom));schedule();}
 function zoomAt(factor,px=width/2,py=height/2){metrics();const iw=image.naturalWidth||1200,ih=image.naturalHeight||800,old=state.zoom,next=Math.max(1,Math.min(8,old*factor));const x=state.cx+(px-width/2)/(iw*base*old),y=state.cy+(py-height/2)/(ih*base*old);state.zoom=next;state.cx=x-(px-width/2)/(iw*base*next);state.cy=y-(py-height/2)/(ih*base*next);schedule();}
 $('zoom-in').addEventListener('click',()=>zoomAt(1.35));$('zoom-out').addEventListener('click',()=>zoomAt(1/1.35));$('fit').addEventListener('click',()=>setView());
 $('toggle-pins').addEventListener('click',()=>{state.pins=!state.pins;$('toggle-pins').setAttribute('aria-pressed',String(state.pins));schedule();});
 const pointers=new Map();let gesture=null;
 function beginGesture(){const ps=[...pointers.values()];if(ps.length===1)gesture={x:ps[0].x,y:ps[0].y,cx:state.cx,cy:state.cy,z:state.zoom};else if(ps.length>=2){const rect=stage.getBoundingClientRect();const mx=(ps[0].x+ps[1].x)/2-rect.left,my=(ps[0].y+ps[1].y)/2-rect.top;gesture={distance:Math.hypot(ps[1].x-ps[0].x,ps[1].y-ps[0].y),z:state.zoom,anchorX:state.cx+(mx-width/2)/((image.naturalWidth||1200)*base*state.zoom),anchorY:state.cy+(my-height/2)/((image.naturalHeight||800)*base*state.zoom)};}}
 stage.addEventListener('pointerdown',e=>{if(e.button>0)return;metrics();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,target:e.target.closest('.hotspot')?.dataset.detail,multi:false,moved:false});if(pointers.size>1)for(const point of pointers.values())point.multi=true;stage.setPointerCapture(e.pointerId);stage.classList.add('dragging');beginGesture();});
 stage.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;const point=pointers.get(e.pointerId);point.moved ||= Math.hypot(e.clientX-point.x0,e.clientY-point.y0)>6;point.x=e.clientX;point.y=e.clientY;const ps=[...pointers.values()];if(ps.length===1){state.cx=gesture.cx-(ps[0].x-gesture.x)/((image.naturalWidth||1200)*base*gesture.z);state.cy=gesture.cy-(ps[0].y-gesture.y)/((image.naturalHeight||800)*base*gesture.z);}else{const rect=stage.getBoundingClientRect(),mx=(ps[0].x+ps[1].x)/2-rect.left,my=(ps[0].y+ps[1].y)/2-rect.top;state.zoom=Math.max(1,Math.min(8,gesture.z*Math.hypot(ps[1].x-ps[0].x,ps[1].y-ps[0].y)/Math.max(1,gesture.distance)));state.cx=gesture.anchorX-(mx-width/2)/((image.naturalWidth||1200)*base*state.zoom);state.cy=gesture.anchorY-(my-height/2)/((image.naturalHeight||800)*base*state.zoom);}schedule();});
 function endPointer(e){const point=pointers.get(e.pointerId);if(e.type==='pointerup'&&point?.target&&!point.multi&&!point.moved)location.hash='detail='+point.target;pointers.delete(e.pointerId);if(pointers.size)beginGesture();else{gesture=null;stage.classList.remove('dragging');}}
 stage.addEventListener('pointerup',endPointer);stage.addEventListener('pointercancel',endPointer);stage.addEventListener('lostpointercapture',endPointer);
 stage.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey&&!e.altKey)return;e.preventDefault();const r=stage.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*.004),e.clientX-r.left,e.clientY-r.top);},{passive:false});
 stage.addEventListener('dblclick',e=>{if(e.target.closest('button'))return;const r=stage.getBoundingClientRect();zoomAt(1.7,e.clientX-r.left,e.clientY-r.top);});
 stage.addEventListener('keydown',e=>{if(e.target!==stage)return;const actions={'+':()=>zoomAt(1.3),'=':()=>zoomAt(1.3),'-':()=>zoomAt(1/1.3),'0':()=>setView(),'ArrowLeft':()=>{state.cx-=.07/state.zoom;schedule();},'ArrowRight':()=>{state.cx+=.07/state.zoom;schedule();},'ArrowUp':()=>{state.cy-=.07/state.zoom;schedule();},'ArrowDown':()=>{state.cy+=.07/state.zoom;schedule();}};if(actions[e.key]){e.preventDefault();actions[e.key]();}});
 const fullscreen=$('painting-dialog'),shell=$('viewer-shell'),home=$('painting-column');
 $('expand').addEventListener('click',()=>{if(fullscreen.open)return;$('fullscreen-slot').append(shell);fullscreen.showModal();document.body.classList.add('locked-scroll');schedule();stage.focus({preventScroll:true});});
 function closePainting(){if(fullscreen.open)fullscreen.close();}
 $('close-painting').addEventListener('click',closePainting);fullscreen.addEventListener('close',()=>{home.prepend(shell);document.body.classList.remove('locked-scroll');schedule();$('expand').focus({preventScroll:true});});
 const imageNote=$('image-note');$('about-image').addEventListener('click',()=>imageNote.showModal());imageNote.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>imageNote.close()));
 image.addEventListener('load',schedule);image.addEventListener('error',()=>{$('image-error').hidden=false;overlay.hidden=true;});new ResizeObserver(schedule).observe(stage);schedule();
 function choose(id,tour=null,stop=0,scroll=true){
  const d=details.get(id);if(!d)return;state.selected=id;state.tour=tour;state.stop=stop;setView(d.point,d.zoom);$('viewer-label').textContent=`${String(d.number).padStart(2,'0')} · ${d.name}`;$('overview').hidden=true;const panel=$('detail-panel');panel.hidden=false;panel.replaceChildren();
  panel.append(link('← The complete work','#explore','detail-back'));
  if(tour){const t=D.themes.find(t=>t.id===tour),bar=el('div','tour-controls');bar.append(el('span','tour-name',`${t.title} · ${stop+1} of ${t.stops.length}`));for(const [label,delta]of [['←',-1],['→',1]]){const b=el('button',null,label);b.type='button';b.setAttribute('aria-label',delta<0?'Previous tour stop':'Next tour stop');b.disabled=stop+delta<0||stop+delta>=t.stops.length;b.addEventListener('click',()=>{location.hash=`tour=${t.id}&stop=${stop+delta}`;});bar.append(b);}panel.append(bar);}
  panel.append(el('p','eyebrow',`Detail ${String(d.number).padStart(2,'0')} / 20`),el('h1',null,d.name),el('p','subtitle',d.subtitle));for(const p of d.paragraphs)panel.append(el('p',null,p));
  if(d.views?.length){const opts=el('div','view-options');for(const v of d.views){const b=el('button',null,v.label);b.type='button';b.addEventListener('click',()=>setView(v.point,v.zoom||d.zoom));opts.append(b);}panel.append(opts);}
  if(['tad','t','a','d','theo'].includes(d.id))panel.append(link('Read the illustrated TAD logo history →','#tad-logo','button secondary logo-detail-link'));
  panel.append(sources(d.sourceIds));panel.append(link('Ask Saige about this →',`./saige.html?topic=${encodeURIComponent(d.topic||'marks')}#talk`,'button secondary ask-link'));panel.append(el('p','reading-note','This note combines the artist’s interpretation with the sources identified above. The scene is an invented gathering.'));
  const pages=el('div','detail-paging');const i=D.details.indexOf(d);if(i>0)pages.append(link('← Previous detail','#detail='+D.details[i-1].id,'button secondary'));if(i<D.details.length-1)pages.append(link('Next detail →','#detail='+D.details[i+1].id,'button secondary'));panel.append(pages);
  document.querySelectorAll('.ribbon-item').forEach(a=>a.setAttribute('aria-current',String(a.dataset.detail===id)));window.SaigeBrand?.apply(panel);
  if(scroll&&!fullscreen.open)$('explore').scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});
 }
 function reset(){state.selected=null;state.tour=null;state.stop=0;setView();$('viewer-label').textContent='The complete work';$('overview').hidden=false;$('detail-panel').hidden=true;document.querySelectorAll('.ribbon-item').forEach(a=>a.removeAttribute('aria-current'));}
 function route(){const hash=location.hash.slice(1),params=new URLSearchParams(hash);if(params.has('detail')){const id=params.get('detail');if(details.has(id))choose(id,null,0,true);else reset();}else if(params.has('tour')){const t=D.themes.find(t=>t.id===params.get('tour'));if(!t){reset();return;}const n=Number.parseInt(params.get('stop')||'0',10),step=Number.isFinite(n)?Math.max(0,Math.min(t.stops.length-1,n)):0;choose(t.stops[step],t.id,step,true);}else if(hash==='explore'||!hash)reset();}
 window.addEventListener('hashchange',route);
 for(const [i,t]of D.themes.entries()){const card=el('article','theme-card');card.append(el('p','eyebrow',`${String(i+1).padStart(2,'0')} / ${t.stops.length} stops`),el('h3',null,t.title),el('p',null,t.subtitle),el('p',null,t.paragraphs[0]));if(t.paragraphs.length>1||t.quote){const more=el('details');more.append(el('summary',null,'Read the idea behind this route'));for(const p of t.paragraphs.slice(1))more.append(el('p',null,p));if(t.quote){const q=el('blockquote',null,t.quote.text);q.append(el('cite',null,t.quote.credit));more.append(q);}more.append(sources(t.sourceIds));card.append(more);}card.append(link('Follow this theme →','#tour='+t.id,'button secondary'));$('theme-grid').append(card);}
 for(const [i,m]of D.moments.entries()){const card=el('article','moment-card');card.append(el('p','moment-meta',`${String(i+1).padStart(2,'0')} / ${m.date}`),el('h3',null,m.title));const q=el('blockquote',null,m.quote);card.append(q,el('p','quote-label',m.speaker+' · exact selected excerpt'),el('p',null,m.text),link('See the related detail →','#detail='+m.detail));if(m.extraSource)card.append(sources([m.extraSource]));$('moment-list').append(card);}
 for(const r of D.references){const card=el('article','reference-card');card.id=r.id;if(r.image){const target=D.sources[r.sourceIds.find(s=>D.sources[s].url)]?.url;const a=link('',target,'reference-image-link');a.target='_blank';a.rel='noopener noreferrer';const im=el('img');im.src=r.image;im.alt=r.alt;im.loading='lazy';im.referrerPolicy='no-referrer';im.addEventListener('error',()=>{im.remove();a.append(el('span',null,'Open the credited collection to view the original image ↗'));},{once:true});a.append(im);card.append(a);}else{card.append(el('div','reference-monogram',r.id==='ref-glass'?'Light / form':'A gathering'));}
  const copy=el('div','reference-copy');copy.append(el('p','eyebrow',r.byline),el('h3',null,r.title),el('p',null,r.text));if(r.quote){copy.append(el('blockquote',null,r.quote),el('p','credit',r.quoteCredit));}if(r.note)copy.append(el('p',null,r.note));copy.append(el('p','credit',r.credit),sources(r.sourceIds),link('Locate the allusion →','#detail='+r.detail,'button secondary'));card.append(copy);$('reference-grid').append(card);
 }
 for(const id of Object.keys(D.sources))$('source-list').append(sourceItem(id));
 window.SaigeBrand?.apply(document.body);route();
 // Read-only state for regression tests, not a command/AI execution interface.
 window.ExhibitionView={state:()=>({...state}),fit:()=>setView()};
})();
