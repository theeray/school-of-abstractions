import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const root=new URL('../public/',import.meta.url);
const source=await readFile(new URL('exhibition.js',root),'utf8');
const sandbox=vm.createContext({window:{}});
// The pure thumbnail helper is exported before the optional exhibition DOM.
vm.runInContext(source,sandbox);
const {crops,layout}=sandbox.window.ExhibitionThumbnails;
vm.runInContext(await readFile(new URL('exhibition-data.js',root),'utf8'),sandbox);
const details=sandbox.window.EXHIBITION.details;
const portraitIds=['mondrian','pollock','krasner','sobel','martin','hilma','theo','euclid','mandelbrot','apollo','dionysus'];
// Manually reviewed head/face bounds in the current 1200 x 800 study image.
// These are visual-composition regression regions, not biometric detections.
const faces={
 mondrian:[465,153,500,197],pollock:[678,172,716,213],
 krasner:[548,344,595,396],sobel:[875,412,952,489],
 martin:[405,343,450,398],hilma:[585,294,602,311],
 theo:[317,258,352,302],euclid:[296,442,343,512],
 mandelbrot:[754,365,802,418],apollo:[272,79,305,126],
 dionysus:[887,78,934,129]
};
const sizes=[[282,127],[300,143],[200,99],[170,103],[146,103]];

test('every one of the twenty cards has an explicit independent crop',()=>{
 assert.equal(Object.keys(crops).length,20);
 assert.deepEqual(Object.keys(crops).sort(),Array.from(details,d=>d.id).sort());
});
test('all named figure cards use portrait crops, and other cards do not',()=>{
 assert.deepEqual(Object.keys(crops).filter(id=>crops[id].kind==='portrait').sort(),portraitIds.sort());
 assert.equal(crops.lewitt.kind,'object');assert.equal(crops.raphael.kind,'overview');
});
test('crop settings are bounded and immutable',()=>{
 assert.ok(Object.isFrozen(crops));
 for(const c of Object.values(crops)){
  assert.ok(Object.isFrozen(c));assert.ok(Object.isFrozen(c.thumbPoint));
  assert.ok(c.thumbPoint.every(n=>Number.isFinite(n)&&n>=0&&n<=1));
  assert.ok(c.thumbWidth>0&&c.thumbWidth<=1);
 }
});
test('portrait focal points stay centered at every desktop and phone card size',()=>{
 for(const [w,h]of sizes)for(const id of portraitIds){
  const c=crops[id],b=layout(w,h,1200,800,c);
  assert.ok(Math.abs(b.x+c.thumbPoint[0]*b.width-w*.5)<.0001,id+' x');
  assert.ok(Math.abs(b.y+c.thumbPoint[1]*b.height-h*c.thumbAlign[1])<.0001,id+' y');
 }
});
test('reviewed full head regions are not cut off at any tested card size',()=>{
 for(const [w,h]of sizes)for(const [id,[l,t,r,bottom]]of Object.entries(faces)){
  const b=layout(w,h,1200,800,crops[id]),sx=b.width/1200,sy=b.height/800;
  assert.ok(b.x+l*sx>=-1,id+' left at '+w);
  assert.ok(b.y+t*sy>=-1,id+' top at '+w);
  assert.ok(b.x+r*sx<=w+1,id+' right at '+w);
  assert.ok(b.y+bottom*sy<=h+1,id+' bottom at '+w);
 }
});
test('cropped backgrounds fill the card with no uncovered edges',()=>{
 for(const [w,h]of sizes)for(const c of Object.values(crops)){
  if(c.thumbFit==='contain')continue;
  const b=layout(w,h,1200,800,c);
  assert.ok(b.width>=w&&b.height>=h);assert.ok(b.x<=0&&b.y<=0);
  assert.ok(b.x+b.width>=w-.0001&&b.y+b.height>=h-.0001);
 }
});
test('whole-painting reference uses contain instead of cutting off its boundaries',()=>{
 for(const [w,h]of sizes){const b=layout(w,h,1200,800,crops.raphael);
  assert.ok(b.x>=0&&b.y>=0);assert.ok(b.width<=w+.0001&&b.height<=h+.0001);
  assert.ok(Math.abs(b.width/b.height-1.5)<.0001);
 }
});
test('edge focal points clamp safely within the original image',()=>{
 for(const point of [[0,0],[1,1],[0,1],[1,0]]){
  const b=layout(280,128,1200,800,{thumbPoint:point,thumbWidth:.2});
  assert.ok(b.x<=0&&b.y<=0&&b.x+b.width>=280&&b.y+b.height>=128);
 }
});
test('higher resolution of the same composition preserves crop geometry',()=>{
 for(const c of Object.values(crops))assert.deepEqual(layout(280,128,1200,800,c),layout(280,128,2400,1600,c));
});
test('hidden and invalid geometry never produce NaN style values',()=>{
 for(const args of [[0,128,1200,800],[-1,128,1200,800],[280,0,1200,800],[280,128,0,800],[280,128,1200,NaN]])assert.equal(layout(...args,crops.mondrian),null);
 assert.equal(layout(280,128,1200,800,{thumbPoint:[NaN,0],thumbWidth:.2}),null);
 assert.equal(layout(280,128,1200,800,{thumbPoint:[.5,.5],thumbWidth:0}),null);
});
test('thumbnail helper does not modify painting hotspots or detail zoom',()=>{
 const original=JSON.stringify(details);
 for(const d of details)layout(280,128,1200,800,crops[d.id]);
 assert.equal(JSON.stringify(details),original);
 const cardCode=source.slice(source.indexOf("const a=link('', '#detail='"),source.indexOf(' scheduleThumbnails();\n function metrics()'));
 assert.doesNotMatch(cardCode,/d\.point|d\.zoom/);
 assert.match(source,/setView\(d\.point,d\.zoom\)/);
});
test('card resize and painting load both schedule recomposition',()=>{
 assert.match(source,/new ResizeObserver\(scheduleThumbnails\)/);
 assert.match(source,/image\.addEventListener\('load',scheduleThumbnails\)/);
 assert.match(source,/thumbnailObserver\.observe\(thumb\)/);
});
test('later logo-history and gods links remain in the unmodified viewer',()=>{
 assert.match(source,/Read the illustrated TAD logo history/);
 assert.match(source,/Why the gods changed/);
});
