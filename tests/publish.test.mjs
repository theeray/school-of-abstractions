import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const source=new URL('../scripts/redeploy.sh',import.meta.url);
function run(flags={}){
 const dir=mkdtempSync(join(tmpdir(),'soa-redeploy-'));
 try{
  for(const p of ['scripts','public','public/art','public/saige','bin'])mkdirSync(join(dir,p));copyFileSync(source,join(dir,'scripts/redeploy.sh'));
  for(const name of ['index.html','saige.html','exhibition-data.js','exhibition.js','branding.js','styles.css','saige-page.js','saige/content.js','saige/core.js','saige/components.js','saige/components.css','saige/avatar.webp','art/study.avif'])writeFileSync(join(dir,'public',name),'fixture '+name);
  const executable=(name,text)=>writeFileSync(join(dir,'bin',name),text,{mode:0o755});
  executable('npm','#!/bin/sh\necho tests >> "$CALLS"\nexit "${FAIL_TESTS:-0}"\n');
  executable('sleep','#!/bin/sh\nexit 0\n');
  executable('firebase',`#!/usr/bin/env node
const fs=require('node:fs'),a=process.argv.slice(2),e=process.env;fs.appendFileSync(e.CALLS,a.join(' ')+'\\n');
if(a[0]==='hosting:sites:list'){
 if(e.FAIL_AUTH==='1')process.exit(1);
 if(e.BAD_JSON==='1'){console.log('{}');process.exit(0);}
 console.log(JSON.stringify({status:'success',result:{sites:e.MISSING_SITE==='1'?[]:[{name:'projects/project-6c1d195b-969f-4318-8f2/sites/school-of-abstractions'}]}}));
}else if(a[0]==='target:apply'&&e.FAIL_MAPPING==='1')process.exit(1);
else if(a[0]==='deploy'&&e.FAIL_DEPLOY==='1')process.exit(1);
`);
  executable('curl',`#!/usr/bin/env node
const fs=require('node:fs'),a=process.argv.slice(2),e=process.env;const url=a.find(v=>v.startsWith('https://')),path=new URL(url).pathname.slice(1),out=a[a.indexOf('-o')+1];fs.appendFileSync(e.CALLS,'verify '+path+'\\n');fs.writeFileSync(out,e.BAD_PAGE==='1'||e.BAD_ASSET===path?'wrong':fs.readFileSync('public/'+path));
`);
  const proc=spawnSync('bash',['scripts/redeploy.sh'],{cwd:dir,encoding:'utf8',timeout:20000,env:{...process.env,...flags,CALLS:join(dir,'calls'),PATH:join(dir,'bin')+':'+process.env.PATH}});let calls='';try{calls=readFileSync(join(dir,'calls'),'utf8');}catch{}return{...proc,calls};
 }finally{rmSync(dir,{recursive:true,force:true});}
}
test('redeploy uses only the exact established Firebase project and site',()=>{const r=run();assert.equal(r.status,0,r.stderr);assert.match(r.calls,/deploy --only hosting:school-of-abstractions --project project-6c1d195b-969f-4318-8f2/);assert.doesNotMatch(r.calls,/projects:create|sites:create|billing|functions/);assert.match(r.stdout,/Published and verified/);});
test('both pages and all local runtime assets are verified after deployment',()=>{const r=run();assert.equal(r.status,0,r.stderr);assert.equal((r.calls.match(/^verify /gm)||[]).length,13);assert.match(r.calls,/verify saige.html/);assert.match(r.calls,/verify art\/study.avif/);});
for(const [name,flags]of Object.entries({'failed tests':{FAIL_TESTS:'1'},'missing authentication':{FAIL_AUTH:'1'},'malformed site list':{BAD_JSON:'1'},'missing expected site':{MISSING_SITE:'1'},'failed local target mapping':{FAIL_MAPPING:'1'}}))test(name+' stops before deployment',()=>{const r=run(flags);assert.notEqual(r.status,0);assert.doesNotMatch(r.calls,/^deploy /m);assert.doesNotMatch(r.stdout,/Published and verified/);});
test('deployment failure never reports success',()=>{const r=run({FAIL_DEPLOY:'1'});assert.notEqual(r.status,0);assert.doesNotMatch(r.stdout,/Published and verified/);});
test('mismatched home page never reports a verified release',()=>{const r=run({BAD_PAGE:'1'});assert.notEqual(r.status,0);assert.doesNotMatch(r.stdout,/Published and verified/);});
test('mismatched Saige page is detected separately',()=>{const r=run({BAD_ASSET:'saige.html'});assert.notEqual(r.status,0);assert.doesNotMatch(r.stdout,/Published and verified/);});
test('mismatched painting bytes are detected',()=>{const r=run({BAD_ASSET:'art/study.avif'});assert.notEqual(r.status,0);assert.doesNotMatch(r.stdout,/Published and verified/);});
