import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {extractErrors, redact} from '../scripts/diagnose-firebase.mjs';

const body = e => '[debug] [timestamp] <<< [apiv2][body] POST https://cloudresourcemanager.googleapis.com/v1/projects '+JSON.stringify({error:e});

test('extracts an HTTP project-creation error without assuming the cause', () => {
  assert.deepEqual(extractErrors(body({code:409,status:'ALREADY_EXISTS',message:'Requested entity already exists'})),
    [{message:'Requested entity already exists',code:409,status:'ALREADY_EXISTS'}]);
});
test('handles failed asynchronous operations and reason codes', () => {
  const line = '[debug] '+JSON.stringify({name:'operations/example',done:true,error:{code:8,message:'Project quota exceeded',details:[{reason:'QUOTA_EXCEEDED',metadata:{credential:'must-not-print'}}]}});
  assert.deepEqual(extractErrors(line),[{message:'Project quota exceeded',code:8,reasons:['QUOTA_EXCEEDED']}]);
});
test('handles nested result and operation response wrappers', () => {
  for (const wrapper of ['result','operation']) {
    assert.equal(extractErrors(JSON.stringify({[wrapper]:{error:{code:7,message:'Permission denied'}}}))[0].code,7);
  }
});
test('never prints headers, requests, or arbitrary error properties', () => {
  const log = '[debug] headers '+JSON.stringify({authorization:'Bearer do-not-print',cookie:'do-not-print'})+'\n'+body({code:403,message:'Permission denied',headers:{token:'do-not-print'},metadata:'do-not-print'});
  assert.doesNotMatch(JSON.stringify(extractErrors(log)),/do-not-print|authorization|cookie|headers/);
});
test('redacts common credentials, URLs, emails, and terminal controls in messages', () => {
  const text = 'Bearer sample-secret https://example.test/?token=secret person@example.test access_token="secret" password=secret ya29.example-token 1//refresh-token sk-example-key \u001b[31mDenied\u001b[0m';
  const result = redact(text);
  for (const secret of ['sample-secret','example.test','person@','example-token','refresh-token','example-key','\u001b']) assert.ok(!result.includes(secret));
  assert.match(result,/Denied/);
});
test('prefers underlying API error to generic CLI failure and removes duplicates', () => {
  const specific=body({code:403,status:'PERMISSION_DENIED',message:'Permission denied'});
  assert.equal(extractErrors(specific+'\n'+specific+'\n'+body({message:'Failed to create project'})).length,1);
  assert.equal(extractErrors(specific+'\n'+body({message:'Failed to create project'}))[0].code,403);
});
test('does not invent errors from plain logger lines or successful responses', () => {
  assert.deepEqual(extractErrors('[error] Failed to create project\nmalformed {\n'+JSON.stringify({done:true})),[]);
});
test('bounds the number and size of output messages', () => {
  const errors=extractErrors(Array.from({length:8},(_,i)=>body({code:400,message:('word '.repeat(500))+i})).join('\n'));
  assert.ok(errors.length<=3); assert.ok(errors.every(e=>e.message.length<=1600));
});
test('CLI reads the original log without changing it, and handles missing logs', () => {
  const dir=mkdtempSync(join(tmpdir(),'saige-diagnostic-'));
  try {
    const script=fileURLToPath(new URL('../scripts/diagnose-firebase.mjs',import.meta.url));
    const log=body({code:409,status:'ALREADY_EXISTS',message:'Requested entity already exists'});
    writeFileSync(join(dir,'firebase-debug.log'),log);
    const r=spawnSync(process.execPath,[script],{cwd:dir,encoding:'utf8'});
    assert.equal(r.status,0,r.stderr); assert.match(r.stdout,/ALREADY_EXISTS/);
    assert.equal(readFileSync(join(dir,'firebase-debug.log'),'utf8'),log);
    const missing=spawnSync(process.execPath,[script,'not-present.log'],{cwd:dir,encoding:'utf8'});
    assert.equal(missing.status,2); assert.match(missing.stderr,/Could not read/);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
