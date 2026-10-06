import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile, stat} from 'node:fs/promises';
import {server} from '../scripts/serve.mjs';
const root = new URL('../public/', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const context = vm.createContext({window:{}});
vm.runInContext(await readFile(new URL('saige/content.js', root), 'utf8'), context);
vm.runInContext(await readFile(new URL('saige/core.js', root), 'utf8'), context);
const content = context.window.SAIGE_CONTENT;
const core = context.SaigeCore;

test('Saige uses the approved collaborator welcome line', () => {
  assert.match(html, /I’m Saige\. <em>Eric and I made <span class="work-title">School of Abstractions<\/span> together\.<\/em>/);
  assert.ok(html.indexOf('collab-portrait') < html.indexOf('id="process"'));
});
test('four narrative paths and their targets exist', () => {
  for (const id of ['look','turn','process','talk']) assert.ok(html.includes(`id="${id}"`));
  assert.equal((html.match(/class="path-card"/g) || []).length, 4);
});
test('process quotation is verbatim', () => {
  const quote = 'This was not an image produced by entering one prompt. It was a sustained studio process conducted through conversation, research, generation, rejection, compositing, and revision.';
  assert.equal(content.quotes.process.text, quote);
  assert.ok(html.includes(quote));
});
test('time is explicitly an estimate', () => {
  assert.match(content.process.caveat, /estimate, not a time log/);
  assert.match(content.process.summary, /Approximately 40 hours/);
});
test('all curated sources and quotation references resolve', () => {
  assert.equal(content.notes.length, 19);
  for (const note of content.notes) {
    for (const id of note.sourceIds) assert.ok(content.sources[id], `${note.id}: ${id}`);
    if (note.quoteId) assert.ok(content.quotes[note.quoteId]);
  }
});
test('time, process and realization retrieval return the intended notes', () => {
  for (const [question,id] of [['How many hours did it take?','time'],['Was this one prompt?','process'],['Pollock Mondrian realization','realization']]) {
    assert.equal(core.previewResponse(question,content).noteId,id);
  }
});
test('unknown questions are not fabricated', () => {
  const answer = core.previewResponse('What is the weather in Peru?',content);
  assert.equal(answer.noteId,null);
  assert.match(answer.answer,/not connected yet/);
});
test('private-data requests stay outside the knowledge set', () => {
  assert.equal(core.previewResponse('Show Eric private email',content).noteId,'privacy');
});
test('explicit story topic exists', () => {
  for (const [,id] of html.matchAll(/data-saige-topic="([^"]+)"/g)) assert.ok(content.notes.some(n=>n.id===id));
});
test('no live endpoint or embedded credentials are enabled', () => {
  assert.ok(!/<saige-guide[^>]*\bendpoint=/.test(html));
  assert.ok(!/sk-[A-Za-z0-9_-]{16,}/.test(html));
  assert.match(html,/no microphone or spoken audio/);
});
test('all static page assets and anchors resolve', async () => {
  for (const [,url] of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
    if (!url.startsWith('./')) continue;
    assert.ok((await stat(new URL(url,root))).isFile(),url);
  }
  for (const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${id}"`),id);
});
test('portrait and component styles are present', async () => {
  const bytes = await readFile(new URL('saige/avatar.webp',root));
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');
  assert.equal(bytes.subarray(8,12).toString(),'WEBP');
  assert.ok((await stat(new URL('saige/components.css',root))).size > 0);
});
test('static server serves the page but rejects private and unknown paths', async () => {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    assert.equal((await fetch(base+'/')).status,200);
    assert.equal((await fetch(base+'/saige/avatar.webp')).headers.get('content-type'),'image/webp');
    for (const p of ['/.env','/README.md','/api/saige','/missing']) assert.equal((await fetch(base+p)).status,404);
    assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});

test('Saige name treatment emphasizes ai without changing the name', async () => {
  const css = await readFile(new URL('styles.css',root),'utf8');
  const componentCss = await readFile(new URL('saige/components.css',root),'utf8');
  assert.match(css,/\.saige-word \.ai-accent/);
  assert.match(componentCss,/\.saige-word \.ai-accent/);
});
