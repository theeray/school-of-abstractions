/* Public exhibition media. Existing artwork, not new generative image editing. */
(function(global){
 'use strict';
 const ROOT='./art/hd-v1/', LEVELS=[2250,4500,9000], TILE=1024;
 const RAPHAEL=Object.freeze({
  image:'https://upload.wikimedia.org/wikipedia/commons/6/68/Raffael_058.jpg',
  record:'https://commons.wikimedia.org/wiki/File:Raffael_058.jpg',
  guide:'https://commons.wikimedia.org/wiki/File:Raffaello_Scuola_di_Atene_numbered.svg',
  local:'./art/reference-originals/raphael-school-of-athens.jpg',width:6045,height:4671
 });

 const REFERENCES=Object.freeze([
  Object.freeze({
   id:'ref-blake',title:'The Ancient of Days · 1794',byline:'William Blake · the measuring figure',
   image:'https://upload.wikimedia.org/wikipedia/commons/f/f6/Europe_a_Prophecy%2C_copy_D%2C_object_1_%28Bentley_1%2C_Erdman_i%2C_Keynes_i%29_British_Museum.jpg',
   local:'./art/reference-originals/blake-ancient-of-days.jpg',width:2975,height:4109,
   record:'https://commons.wikimedia.org/wiki/File:Europe_a_Prophecy,_copy_D,_object_1_(Bentley_1,_Erdman_i,_Keynes_i)_British_Museum.jpg',
   museum:'https://www.britishmuseum.org/collection/object/P_1859-0625-72',
   museumLabel:'British Museum · the original print',
   text:'A bearded figure, usually identified as Urizen, reaches from a luminous circle with a compass. Blake made this as the frontispiece to Europe a Prophecy: a color-printed relief etching with hand coloring, rather than an oil painting. This reproduction shows copy D in the British Museum.',
   connection:'In School of Abstractions, the crouching, reaching geometry of Euclid’s pose recalls this image. The compass can be read as an instrument of discovery or of imposed limits. That is an artistic allusion, not a claim that Euclid and Blake’s Urizen held the same beliefs.',
   credit:'William Blake, Europe a Prophecy, copy D, frontispiece. Public-domain reproduction via Wikimedia Commons / the William Blake Archive; original in the British Museum. Shown without cropping.',
   license:'https://creativecommons.org/publicdomain/mark/1.0/',licenseLabel:'Public-domain image',
   detail:'euclid',detailLabel:'Find the measuring pose →'
  }),
  Object.freeze({
   id:'ref-pieta',title:'Pietà · 1498–1499',byline:'Michelangelo · the central arrangement',
   image:'https://upload.wikimedia.org/wikipedia/commons/1/1f/Michelangelo%27s_Pieta_5450_cropncleaned_edit.jpg',
   local:'./art/reference-originals/michelangelo-pieta.jpg',width:1584,height:1660,
   record:'https://commons.wikimedia.org/wiki/File:Michelangelo%27s_Pieta_5450_cropncleaned_edit.jpg',
   museum:'https://www.basilicasanpietro.va/en/san-pietro/the-pieta-of-saint-peter-s',
   museumLabel:'St. Peter’s Basilica · the sculpture',
   text:'Michelangelo’s marble group shows Mary holding the body of Christ across her lap. The seated figure, weight across the lap, and deeply folded drapery give the work its concentrated central arrangement. The sculpture is in St. Peter’s Basilica.',
   connection:'Krasner’s seated placement and the material draped across her lap echo that arrangement. Here, the figure cuts and recomposes an image rather than holding a body: care becomes an active process of making. The allusion is compositional, not a literal religious scene or a reduction of Krasner to a supporting role.',
   credit:'Photograph: Stanislav Traykov, via Wikimedia Commons, CC BY 2.5. This is the credited crop-and-cleaned Commons version, with background distractions removed by its contributors; no further retouching or cropping is applied here.',
   license:'https://creativecommons.org/licenses/by/2.5/',licenseLabel:'CC BY 2.5 photo license',
   detail:'krasner',detailLabel:'Find the central arrangement →'
  })
 ]);
 function referencePaths(){return [RAPHAEL,...REFERENCES].map(r=>({image:r.image,local:r.local,width:r.width,height:r.height,record:r.record}));}
 function visibleTiles(w,h,state,dpr=1){
  if(![w,h,state?.zoom,state?.cx,state?.cy,dpr].every(Number.isFinite)||w<=0||h<=0)return null;
  const scale=Math.min(w/9000,h/6000)*Math.max(1,state.zoom),dw=9000*scale,dh=6000*scale;
  const left=w/2-state.cx*dw,top=h/2-state.cy*dh,required=dw*Math.min(3,Math.max(1,dpr));
  const level=LEVELS.find(n=>n>=required)||9000,lh=level*2/3,ratio=dw/level;
  const cols=Math.ceil(level/TILE),rows=Math.ceil(lh/TILE),tiles=[];
  const x0=Math.max(0,Math.floor(-left/ratio/TILE)),x1=Math.min(cols-1,Math.floor((w-left)/ratio/TILE));
  const y0=Math.max(0,Math.floor(-top/ratio/TILE)),y1=Math.min(rows-1,Math.floor((h-top)/ratio/TILE));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const l=Math.max(0,x*TILE-1),t=Math.max(0,y*TILE-1),r=Math.min(level,(x+1)*TILE+1),b=Math.min(lh,(y+1)*TILE+1);
   tiles.push({key:`${level}/${x}_${y}`,src:ROOT+`tiles/${level}/${x}_${y}.jpg`,x:left+l*ratio,y:top+t*ratio,width:(r-l)*ratio,height:(b-t)*ratio});
  }
  return {level,tiles,left,top,width:dw,height:dh,required};
 }
 global.ArtworkMedia=Object.freeze({root:ROOT,raphael:RAPHAEL,references:REFERENCES,referencePaths,visibleTiles});
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id);
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 function external(label,url,cls='button secondary'){const a=el('a',cls,label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
 function sourceImage(im,spec,onFinalError){
  let fallback=false;
  im.onerror=()=>{if(!fallback){fallback=true;im.src=spec.image;}else onFinalError?.();};
  im.src=spec.local;
 }
 function updateIdentity(){
  // Load the supplied image before replacing the existing header identity.
  const test=new Image();test.onload=()=>{
   document.querySelectorAll('.brand>img').forEach(im=>{im.src=ROOT+'brand/header.webp';im.alt='';});
   document.querySelectorAll('link[rel~="icon"],link[rel="apple-touch-icon"]').forEach(n=>n.remove());
   const icon=el('link');icon.rel='icon';icon.type='image/x-icon';icon.href=ROOT+'brand/favicon.ico';document.head.append(icon);
   const touch=el('link');touch.rel='apple-touch-icon';touch.sizes='180x180';touch.href=ROOT+'brand/apple-touch-icon.png';document.head.append(touch);
  };test.src=ROOT+'brand/header.webp';
 }
 function updateSteve(){
  const section=$('tad-logo'),account=section?.querySelector('.logo-account');
  if(!section||!account||account.dataset.portrait==='true')return;
  const mark=el('figure','tad-section-mark'),logo=el('img');logo.src=ROOT+'brand/tad-logo.png';logo.width=1158;logo.height=480;logo.alt='TAD — School of Technology, Art & Design';logo.loading='lazy';
  logo.onerror=()=>{mark.hidden=true;};mark.append(logo);section.prepend(mark);
  const portrait=el('figure','designer-portrait'),im=el('img');im.src=ROOT+'brand/steve-sundahl.webp';im.width=600;im.height=900;im.loading='lazy';im.alt='Steve Sundahl, designer of the TAD logo';
  const credit=el('figcaption',null,'Steve Sundahl');credit.append(el('span',null,'Designer of the TAD logo'));portrait.append(im,credit);
  im.onerror=()=>{im.hidden=true;};
  const bubble=el('div','designer-bubble');while(account.firstChild)bubble.append(account.firstChild);
  account.classList.add('designer-voice');account.dataset.portrait='true';account.append(portrait,bubble);
  // Existing blockquote and attribution are moved intact, not paraphrased.
 }
 function updateOriginalDialogue(){
  const ref=$('ref-raphael');if(!ref||ref.dataset.original==='true')return;ref.dataset.original='true';
  const data=global.EXHIBITION?.references?.find(r=>r.id==='ref-raphael');if(data){data.image=RAPHAEL.local;data.referenceTitle='The Original Dialogue';data.identificationGuide=RAPHAEL.guide;}
  const old=ref.querySelector('.reference-monogram,.reference-image-link');
  const media=el('div','original-dialogue-media');media.append(el('h3','original-dialogue-title','The Original Dialogue'));
  const a=external('',RAPHAEL.image,'reference-image-link');a.setAttribute('aria-label','Open the high-resolution School of Athens by Raphael');
  const im=el('img','original-image');im.width=RAPHAEL.width;im.height=RAPHAEL.height;im.alt='Raphael’s School of Athens: philosophers gathered in a vaulted classical hall.';im.loading='lazy';im.decoding='async';im.referrerPolicy='no-referrer';
  sourceImage(im,RAPHAEL,()=>{im.hidden=true;a.href=RAPHAEL.record;a.append(el('span','original-load-note','View the original at Wikimedia Commons ↗'));});
  a.append(im);media.append(a);if(old)old.replaceWith(media);else ref.prepend(media);
  const copy=ref.querySelector('.reference-copy');if(!copy)return;
  const p=copy.querySelector('p:not(.eyebrow):not(.credit)');if(p)p.textContent='Raphael’s School of Athens is the original visual dialogue behind School of Abstractions. Compare the arrangement of figures, the great architectural space, and the measuring gesture with Eric’s reinterpretation.';
  const links=el('div','original-links');links.append(external('Who’s who in Raphael’s painting ↗',RAPHAEL.guide),external('Open the 6,045-pixel original ↗',RAPHAEL.image));
  const loc=copy.querySelector('.button');if(loc)loc.before(links);else copy.append(links);
  const credit=el('p','credit','Raphael, The School of Athens. 6,045 × 4,671-pixel reproduction via Wikimedia Commons. ');credit.append(external('Image and rights record',RAPHAEL.record,'text-link'));copy.append(credit,el('p','credit','The external numbered guide includes proposed alternatives where identifications remain disputed.'));
 }

 function addVisualReferences(){
  const grid=$('reference-grid');if(!grid)return;
  for(const r of REFERENCES){
   if($(r.id))continue;
   const card=el('article','reference-card historical-reference');card.id=r.id;
   const media=external('',r.image,'reference-image-link');media.setAttribute('aria-label','Open the full-resolution reference: '+r.title);
   const im=el('img');im.alt=r.id==='ref-blake'?'William Blake’s The Ancient of Days: a white-bearded figure reaching downward with compasses from a bright circular field.':'Michelangelo’s Pietà: the seated Virgin Mary holding Christ across her lap, surrounded by folded marble drapery.';
   im.width=r.width;im.height=r.height;im.loading='lazy';im.decoding='async';im.referrerPolicy='no-referrer';
   sourceImage(im,r,()=>{im.hidden=true;media.href=r.record;media.append(el('span','original-load-note','Open the credited reference image ↗'));});media.append(im);
   const copy=el('div','reference-copy');copy.append(el('p','eyebrow',r.byline),el('h3',null,r.title),el('p',null,r.text));
   copy.append(el('p','eyebrow reference-connection-label','Within School of Abstractions'),el('p',null,r.connection));
   const cite=el('p','credit',r.credit+' ');cite.append(external('Image record',r.record,'text-link'),document.createTextNode(' · '),external(r.licenseLabel,r.license,'text-link'));
   copy.append(cite,external(r.museumLabel+' ↗',r.museum),document.createTextNode(' '));
   const locator=el('a','button secondary',r.detailLabel);locator.href='#detail='+r.detail;copy.append(locator);card.append(media,copy);grid.append(card);
   const source={title:r.museumLabel,kind:'Historical collection record',url:r.museum,note:'The connection to Eric’s composition is an artist-selected allusion, not a historical meeting.'};
   if(global.EXHIBITION){global.EXHIBITION.sources[r.id]=source;if(!global.EXHIBITION.references.some(x=>x.id===r.id))global.EXHIBITION.references.push({...r,sourceIds:[r.id]});}
   const item=el('div','source-entry');item.append(el('span','source-kind',source.kind),external(source.title,source.url,'text-link'),el('p',null,source.note));$('source-list')?.append(item);
  }
  // Offer source links from the related details without changing their image targets.
  const panel=$('detail-panel');
  function linkDetail(){if(!panel||panel.hidden)return;const id=global.ExhibitionView?.state().selected,r=REFERENCES.find(x=>x.detail===id);if(!r||panel.querySelector('.historical-reference-link'))return;
   const a=el('a','button secondary historical-reference-link','Compare with '+(id==='euclid'?'Blake’s The Ancient of Days':'Michelangelo’s Pietà')+' →');a.href='#'+r.id;panel.querySelector('.source-mini')?.before(a);
  }
  if(panel)new MutationObserver(linkDetail).observe(panel,{childList:true});linkDetail();
  const C=global.SAIGE_CONTENT;
  if(C){for(const r of REFERENCES){C.sources[r.id]={title:r.museumLabel,kind:'Historical collection record',url:r.museum};const note=C.notes.find(n=>n.id===r.detail);if(note){note.sourceIds=[...new Set([...note.sourceIds,r.id])];const paragraph=r.id==='ref-blake'?' The relevant Blake reference is The Ancient of Days, the 1794 frontispiece to Europe a Prophecy. The compass pose is an artistic allusion, not a claim that Euclid is Urizen.':' The central, lap-spanning arrangement alludes to Michelangelo’s Pietà, a marble sculpture, while Krasner’s action remains cutting and recomposing an image.';if(!note.text.includes(paragraph))note.text+=paragraph;}}}
 }
 function updateRevision(){
  const oldTitle='Making room changes the argument';
  const heading='Changing one statue changed the question';
  const body='Replacing Athena with Dionysus kept Raphael’s classical setting but redirected its meaning. The pairing no longer simply frames a gathering of knowledge: Apollo and Dionysus bring contrasting artistic impulses into the room. A change to one statue changed the conversation of the whole painting.';
  const moment=global.EXHIBITION?.moments?.find(m=>m.title===oldTitle);
  if(moment)Object.assign(moment,{title:heading,date:'A compositional revision',speaker:'Exhibition summary',quote:null,text:body,detail:'dionysus',isSummary:true});
  const card=[...document.querySelectorAll('.moment-card')].find(n=>n.querySelector('h3')?.textContent===oldTitle);
  if(!card)return;
  const meta=el('p','moment-meta','03 / A compositional revision');
  const summary=el('p','revision-summary',body);
  const note=el('p','quote-label','New exhibition summary of the documented change—not a verbatim prompt.');
  const a=el('a',null,'See the revised pairing →');a.href='#gods';
  card.replaceChildren(meta,el('h3',null,heading),summary,note,a);
  const intro=document.querySelector('#dialogue .section-heading>p');if(intro)intro.textContent='Selected short excerpts and a compositional revision from the making. Quoted passages preserve the recorded words; the statue revision is a clearly labeled summary, not a reconstructed prompt.';
 }
 function installMasterNotes(){
  const copy=$('image-note')?.querySelector('.dialog-inner');
  if(copy&&!copy.querySelector('.master-file-link'))copy.append(external('Open the 9,000-pixel master ↗',ROOT+'full.jpg','button secondary master-file-link'));
  const title=$('image-note-title');if(title)title.textContent='The high-resolution studio master.';
  const ps=$('image-note')?.querySelectorAll('p:not(.eyebrow)');
  if(ps?.[0])ps[0].textContent='This viewer uses web derivatives of Eric’s saved 9,000 × 6,000-pixel master, including the documented Euclid repair. The overview loads first; detailed image tiles load as you zoom.';
  if(ps?.[1])ps[1].textContent='No new AI generation, face replacement, or compositional changes were made for this update. Very small features remain limited by the detail already present in the master. Raphael’s historical fresco is displayed separately under The Original Dialogue.';
  document.querySelectorAll('#sources .source-collection p').forEach(p=>{
   if(p.textContent.startsWith('The painting shown here is an optimized temporary study image.'))p.textContent='The painting uses web derivatives of the existing 9,000 × 6,000 studio master. Image tiles preserve its available detail when zooming. Cropping and compression are for web delivery; no new generative changes were made.';
   if(p.textContent.startsWith('The twenty figure and symbol labels follow Eric'))p.textContent='The twenty figure and symbol labels follow Eric’s stated intentions. Hotspot positions and portrait framing are preserved against the existing composition. The references are historical sources and artistic allusions, not a claim that the figures actually gathered together.';
  });
  const hilma=global.EXHIBITION?.details?.find(d=>d.id==='hilma');
  if(hilma)hilma.paragraphs=hilma.paragraphs.map(p=>p.replace('The high-resolution web master will make this especially small detail easier to study.','The high-resolution master is now available in the viewer, although this is still a very small figure within the composition.'));
  const note=global.SAIGE_CONTENT?.notes?.find(n=>n.id==='image-status');if(note){note.title='The high-resolution master';note.text='The exhibition uses web derivatives of Eric’s saved 9,000 × 6,000 master with the documented Euclid repair. Higher-resolution tiles load when visitors zoom. This update makes no new AI generation or compositional changes. Small features remain limited by the detail in that saved master. Raphael’s separate historical fresco appears under The Original Dialogue.';}
 }
 function startHD(){
  const stage=$('painting-stage'),image=$('painting');if(!stage||!image||!global.ExhibitionView||stage.querySelector('.hd-tile-layer'))return;
  const layer=el('div','hd-tile-layer');layer.setAttribute('aria-hidden','true');stage.insertBefore(layer,$('hotspots'));
  const status=el('p','hd-media-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');$('viewer-shell').append(status);
  let frame=null,ready=false,lastStatus='';const tileNodes=new Map();
  function message(text){if(text!==lastStatus){status.textContent=text;lastStatus=text;}}
  function draw(){
   frame=null;if(!ready)return;
   const v=visibleTiles(stage.clientWidth,stage.clientHeight,global.ExhibitionView.state(),global.devicePixelRatio||1);if(!v)return;
   if(v.level===2250){tileNodes.forEach(n=>n.remove());tileNodes.clear();message('9,000 × 6,000 master · zoom in for full detail');return;}
   const wanted=new Set(v.tiles.map(t=>t.key));for(const [key,n]of tileNodes)if(!wanted.has(key)){n.remove();tileNodes.delete(key);}
   let pending=0,failed=0;
   for(const t of v.tiles){let n=tileNodes.get(t.key);if(!n){n=el('img');n.alt='';n.draggable=false;n.decoding='async';n.dataset.state='loading';n.style.visibility='hidden';
    n.onload=()=>{n.dataset.state='ready';n.style.visibility='visible';schedule();};n.onerror=()=>{n.dataset.state='error';schedule();};n.src=t.src;layer.append(n);tileNodes.set(t.key,n);}
    n.style.left=t.x+'px';n.style.top=t.y+'px';n.style.width=t.width+'px';n.style.height=t.height+'px';pending+=n.dataset.state==='loading';failed+=n.dataset.state==='error';
   }
   message(failed?'Some detailed image tiles did not load. The overview remains visible.':pending?'Loading high-resolution detail…':`High-resolution detail · ${v.level.toLocaleString('en-US')}-pixel layer`);
  }
  function schedule(){if(frame===null)frame=requestAnimationFrame(draw);}
  new MutationObserver(schedule).observe(image,{attributes:true,attributeFilter:['style']});new ResizeObserver(schedule).observe(stage);global.addEventListener('resize',schedule);global.addEventListener('hashchange',schedule);
  const probe=new Image();probe.onload=()=>{
   if(probe.naturalWidth!==2250||probe.naturalHeight!==1500){message('The media overview did not have the expected dimensions.');return;}
   image.addEventListener('load',()=>{if(image.naturalWidth===2250){ready=true;image.width=2250;image.height=1500;$('image-error').hidden=true;installMasterNotes();const tag=document.querySelector('.viewer-topline .study-label');if(tag)tag.textContent='9,000 × 6,000 master';schedule();}},{once:true});
   image.src=ROOT+'preview.jpg';
   for(const card of document.querySelectorAll('.detail-card[data-detail]')){
    const id=card.dataset.detail,thumb=card.querySelector('.detail-thumb');if(!thumb||!/^[a-z-]+$/.test(id))continue;
    const im=el('img');im.alt='';im.loading='lazy';im.decoding='async';im.src=ROOT+(id==='raphael'?'preview.jpg':`thumbs/${id}.jpg`);im.width=id==='raphael'?2250:900;im.height=id==='raphael'?1500:660;
    const ay=global.ExhibitionThumbnails?.crops[id]?.thumbAlign?.[1]||.5;im.style.objectPosition=`50% ${ay*100}%`;if(id==='raphael')im.style.objectFit='contain';
    im.onerror=()=>{im.remove();thumb.classList.remove('hd-card');};thumb.classList.add('hd-card');thumb.replaceChildren(im);
   }
  };probe.onerror=()=>message('The high-resolution media files are not installed on this host yet.');probe.src=ROOT+'preview.jpg';
  global.ArtworkMediaState=()=>({ready,tiles:tileNodes.size,source:image.getAttribute('src')});
 }
 function boot(){updateIdentity();updateSteve();updateOriginalDialogue();addVisualReferences();updateRevision();startHD();
  // The same public note is used in Saige’s separate section once media is present.
  if(!$('painting-stage')){
   const C=global.SAIGE_CONTENT;if(C)for(const r of REFERENCES){C.sources[r.id]={title:r.museumLabel,kind:'Historical collection record',url:r.museum};const n=C.notes.find(x=>x.id===r.detail);if(n){n.sourceIds=[...new Set([...n.sourceIds,r.id])];n.text+=' '+r.connection;}}
   const p=new Image();p.onload=()=>{if(p.naturalWidth===2250)installMasterNotes();};p.src=ROOT+'preview.jpg';}
 }
 let attempts=0,booted=false;
 function whenReady(){if(booted)return;if($('painting-stage')&&!global.ExhibitionView&&attempts++<60){setTimeout(whenReady,50);return;}booted=true;boot();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',whenReady,{once:true});else whenReady();
})(window);
