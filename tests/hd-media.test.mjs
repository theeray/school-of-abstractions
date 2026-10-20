import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const root=new URL('../public/',import.meta.url);
const script=await readFile(new URL('artwork-media.js',root),'utf8');
const css=await readFile(new URL('artwork-media.css',root),'utf8');
const context=vm.createContext({window:{}});vm.runInContext(script,context);
const {visibleTiles,raphael}=context.window.ArtworkMedia;
const s=(zoom=1,cx=.5,cy=.5)=>({zoom,cx,cy});
test('media math is available without running browser code',()=>assert.equal(typeof visibleTiles,'function'));
test('overview and close-up request appropriate real image resolutions',()=>{
 assert.equal(visibleTiles(1000,667,s(),1).level,2250);
 assert.equal(visibleTiles(1000,667,s(3),1).level,4500);
 assert.equal(visibleTiles(1000,667,s(3.7),2).level,9000);
});
test('high-DPI requests never exceed the existing nine-thousand-pixel source',()=>{
 assert.equal(visibleTiles(1800,1200,s(8),4).level,9000);
});
test('invalid and hidden viewports do not emit image requests',()=>{
 for(const args of [[0,300,s(),1],[300,0,s(),1],[NaN,400,s(),1],[300,400,s(Infinity),1]])assert.equal(visibleTiles(...args),null);
});
test('tile file paths are bounded coordinates at known levels',()=>{
 for(const [w,h,z,dpr]of [[350,233,1,3],[900,600,3.7,2],[1500,900,8,1],[600,900,2,2]]){
  const v=visibleTiles(w,h,s(z),dpr);assert.ok(v.tiles.length>0&&v.tiles.length<=54);
  for(const t of v.tiles){assert.match(t.src,/^\.\/art\/hd-v1\/tiles\/(2250|4500|9000)\/\d+_\d+\.jpg$/);assert.ok(t.width>0&&t.height>0);}
 }
});
test('visible source area has no gaps between loaded tile rectangles',()=>{
 for(const [w,h,z,cx,cy]of [[1000,600,3.7,.644,.551],[390,260,5,.495,.409],[1800,1000,1,.5,.5]]){
  const v=visibleTiles(w,h,s(z,cx,cy),2);
  for(let y=10;y<h;y+=29)for(let x=10;x<w;x+=31){
   if(x<v.left||y<v.top||x>v.left+v.width||y>v.top+v.height)continue;
   assert.ok(v.tiles.some(t=>x>=t.x&&x<=t.x+t.width&&y>=t.y&&y<=t.y+t.height),`gap at ${x},${y}`);
  }
 }
});
test('existing master and no-new-generation descriptions remain explicit',()=>{
 assert.match(script,/9,000 × 6,000/);assert.match(script,/No new AI generation, face replacement, or compositional changes/);
});
test('Raphael is the historical source image and has a numbered external guide',()=>{
 assert.match(raphael.image,/Raffael_058\.jpg$/);assert.equal(raphael.width,6045);assert.equal(raphael.height,4671);
 assert.match(raphael.guide,/Raffaello_Scuola_di_Atene_numbered\.svg$/);assert.match(script,/The Original Dialogue/);
});
test('new header identity does not target Saige’s collaborator portrait',()=>{
 assert.match(script,/querySelectorAll\('\.brand>img'\)/);
 assert.match(script,/brand\/favicon.ico/);assert.doesNotMatch(script,/querySelectorAll\('\.collab-portrait/);
});
test('Steve quotation nodes are moved intact into a responsive speech bubble',()=>{
 assert.match(script,/while\(account.firstChild\)bubble.append\(account.firstChild\)/);
 assert.match(script,/brand\/steve-sundahl.webp/);assert.match(script,/brand\/tad-logo.png/);
 assert.match(css,/designer-bubble::before/);assert.match(css,/@media\(max-width:540px\)/);
});
test('replacement revision is labeled a summary, never a fabricated prompt',()=>{
 assert.match(script,/Changing one statue changed the question/);
 assert.match(script,/not a verbatim prompt/);assert.match(script,/quote:null/);
 assert.doesNotMatch(script,/\.innerHTML\s*=/);
});
test('media bootstrap is same-origin and failure-safe',async()=>{
 const b=await readFile(new URL('branding.js',root),'utf8');
 assert.match(b,/new URL\('artwork-media.js',root\)/);assert.match(b,/script.onerror/);
});
test('Blake and Pietà are actual historical references with correct media and targets',()=>{
 const refs=context.window.ArtworkMedia.references;
 assert.equal(refs.length,2);
 const [blake,pieta]=refs;
 assert.match(blake.title,/The Ancient of Days/);assert.match(blake.text,/relief etching/);assert.equal(blake.detail,'euclid');
 assert.match(pieta.title,/Pietà/);assert.match(pieta.text,/marble/);assert.equal(pieta.detail,'krasner');
 assert.match(blake.museum,/britishmuseum\.org/);assert.match(pieta.museum,/basilicasanpietro\.va/);
});
test('historical images have separate local file paths, high-resolution originals and credits',()=>{
 const refs=[context.window.ArtworkMedia.raphael,...context.window.ArtworkMedia.references];
 assert.equal(new Set(refs.map(r=>r.local)).size,3);
 for(const r of refs){assert.match(r.local,/^\.\/art\/reference-originals\//);assert.match(r.image,/^https:\/\/upload\.wikimedia\.org\//);assert.ok(r.width>1500&&r.height>1500);assert.match(r.record,/commons\.wikimedia\.org/);}
 assert.match(context.window.ArtworkMedia.references[1].credit,/Stanislav Traykov/);
 assert.match(context.window.ArtworkMedia.references[1].license,/licenses\/by\/2\.5/);
});
test('reference cards preserve the whole artwork and link back to the relevant painting details',()=>{
 assert.match(css,/\.historical-reference \.reference-image-link img\{[^}]*object-fit:contain/);
 assert.match(script,/locator\.href='#detail='\+r\.detail/);
 assert.match(script,/\.historical-reference-link/);
 assert.match(script,/sourceImage\(im,r/);
});
test('women material is not removed when the selected dialogue card is replaced',()=>{
 assert.match(script,/m\.title===oldTitle/);assert.doesNotMatch(script,/\.themes\.splice|\.notes\.splice|women.*\.remove\(/);
});
