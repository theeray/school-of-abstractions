import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../public/',import.meta.url);
const brand=await readFile(new URL('branding.js',root),'utf8');
const css=await readFile(new URL('artwork-media.css',root),'utf8');
const rule=selector=>{
 const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const found=css.match(new RegExp(escaped+'\\{([^}]+)\\}'));
 assert.ok(found,'Missing rule: '+selector);return found[1];
};
test('invitation label grouping is scoped and idempotent',()=>{
 assert.match(brand,/const selector='\.saige-invitation \.button'/);
 assert.match(brand,/classList\.contains\('button-label'\)/);
 assert.match(brand,/button\.insertBefore\(label,nodes\[0\]\)/);
 assert.match(brand,/node\.matches\('\[aria-hidden="true"\]'\)/);
 assert.doesNotMatch(brand,/\.innerHTML\s*=/);
});
test('possessive suffix stays with Saige without changing the ai accent',()=>{
 assert.ok(brand.includes("split(/(Saige(?:['’]s)?)/g)"));
 assert.ok(brand.includes("span.append(ai,'ge',part.slice(5))"));
 assert.match(brand,/ai\.className='ai-accent';ai\.textContent='ai'/);
 assert.match(brand,/\[data-no-brand\]/);
});
test('invitation label can shrink on phones without flexing its arrow',()=>{
 assert.match(rule('.saige-invitation .button'),/max-width:100%/);
 assert.match(rule('.saige-invitation .button-label'),/min-width:0/);
 assert.match(rule('.saige-invitation .button>[aria-hidden="true"]'),/flex:none/);
});
test('glass reference has an edge-to-edge near-square cover image',()=>{
 const frame=rule('#ref-glass>.reference-image-link');
 assert.match(frame,/padding:0/);assert.match(frame,/aspect-ratio:1\/1/);
 assert.match(frame,/overflow:hidden/);
 const image=rule('#ref-glass>.reference-image-link img');
 for(const setting of ['width:100%','height:100%','object-fit:cover','object-position:50% 50%'])assert.ok(image.includes(setting),setting);
});
test('glass card is not stretched to match the longer Raphael copy',()=>{
 assert.match(rule('#ref-glass'),/align-self:start/);
});
test('Raphael, Blake and Pieta keep their whole-artwork layout',()=>{
 assert.match(rule('#ref-raphael .reference-image-link img'),/height:auto/);
 assert.match(rule('#ref-raphael .reference-image-link img'),/object-fit:contain/);
 assert.match(rule('.historical-reference .reference-image-link img'),/object-fit:contain/);
});
test('same-origin media bootstrap and speech bubble remain enabled',()=>{
 assert.match(brand,/new URL\('artwork-media.js',root\)/);
 assert.match(brand,/script.onerror/);
 assert.match(css,/\.designer-bubble::before\{/);
});
