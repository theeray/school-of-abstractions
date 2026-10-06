import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const source = new URL('../scripts/publish-firebase.sh', import.meta.url);
function run(flags = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'saige-publish-test-'));
  try {
    for (const p of ['scripts', 'public', 'bin']) mkdirSync(join(dir, p));
    copyFileSync(source, join(dir, 'scripts/publish-firebase.sh'));
    writeFileSync(join(dir, 'public/index.html'), '<h1>Saige test fixture</h1>');
    const executable = (name, text) => writeFileSync(join(dir, 'bin', name), text, {mode:0o755});
    executable('npm', '#!/bin/sh\necho tests >> "$CALLS"\nexit "${FAIL_TESTS:-0}"\n');
    executable('sleep', '#!/bin/sh\nexit 0\n');
    executable('curl', '#!/bin/sh\nwhile [ "$#" -gt 0 ]; do if [ "$1" = -o ]; then shift; if [ "${BAD_PAGE:-0}" = 1 ]; then echo placeholder > "$1"; else cp public/index.html "$1"; fi; exit 0; fi; shift; done\nexit 1\n');
    executable('firebase', `#!/usr/bin/env node
const fs=require('node:fs');
const a=process.argv.slice(2), e=process.env, cmd=a[0];
fs.appendFileSync(e.CALLS,a.join(' ')+'\\n');
if(cmd==='projects:list') {
 if(e.FAIL_AUTH==='1') process.exit(1);
 console.log(JSON.stringify({status:'success',result:e.NEW_PROJECT==='1'?[]:[{projectId:e.FIREBASE_PROJECT_ID||'school-of-abstractions'}]}));
} else if(cmd==='projects:create' && e.FAIL_CREATE==='1') process.exit(1);
else if(cmd==='hosting:sites:list') {
 if(e.BAD_JSON==='1') {console.log('{}');process.exit(0);}
 if(e.FAIL_SITES==='1') process.exit(1);
 console.log(JSON.stringify({status:'success',result:{sites:e.NEW_SITE==='1'?[]:[{name:'projects/project/sites/school-of-abstractions'}]}}));
} else if(cmd==='hosting:sites:create' && e.FAIL_SITE_CREATE==='1') process.exit(1);
else if(cmd==='deploy' && e.FAIL_DEPLOY==='1') process.exit(1);
`);
    const proc = spawnSync('bash', ['scripts/publish-firebase.sh'], {
      cwd:dir, encoding:'utf8', timeout:20000,
      env:{...process.env, FIREBASE_PROJECT_ID:'school-of-abstractions', ...flags, CALLS:join(dir,'calls'), PATH:join(dir,'bin')+':'+process.env.PATH}
    });
    let calls=''; try {calls=readFileSync(join(dir,'calls'),'utf8');} catch {}
    return {...proc,calls};
  } finally {rmSync(dir,{recursive:true,force:true});}
}
test('existing project/site: deploy exact Hosting target and verify', () => {
 const r=run(); assert.equal(r.status,0,r.stderr); assert.match(r.stdout,/Published and verified: https:\/\/school-of-abstractions.web.app/);
 assert.match(r.calls,/deploy --only hosting:school-of-abstractions --project school-of-abstractions/);
 assert.doesNotMatch(r.calls,/projects:create|hosting:sites:create/);
});
test('missing project and site are explicitly created before deployment',()=>{
 const r=run({NEW_PROJECT:'1',NEW_SITE:'1'}); assert.equal(r.status,0,r.stderr);
 assert.match(r.calls,/projects:create school-of-abstractions/); assert.match(r.calls,/hosting:sites:create school-of-abstractions/);
});
for(const [name,flags] of Object.entries({
 'tests fail':{FAIL_TESTS:'1'}, 'authentication fails':{FAIL_AUTH:'1'},
 'project creation fails':{NEW_PROJECT:'1',FAIL_CREATE:'1'},
 'site read fails':{FAIL_SITES:'1'}, 'site response is malformed':{BAD_JSON:'1'},
 'site name cannot be created':{NEW_SITE:'1',FAIL_SITE_CREATE:'1'}
})) test(name+' stops before deploy',()=>{
 const r=run(flags); assert.notEqual(r.status,0); assert.doesNotMatch(r.calls,/^deploy /m); assert.doesNotMatch(r.stdout,/Published and verified/);
});
test('deployment error is not announced as success',()=>{
 const r=run({FAIL_DEPLOY:'1'}); assert.notEqual(r.status,0); assert.doesNotMatch(r.stdout,/Published and verified/);
});
test('wrong live HTML is not announced as verified',()=>{
 const r=run({BAD_PAGE:'1'}); assert.notEqual(r.status,0); assert.match(r.stderr,/exact live page could not be verified/);
});
test('explicit alternative project preserves exact public hostname',()=>{
 const r=run({FIREBASE_PROJECT_ID:'eric-art-project'}); assert.equal(r.status,0,r.stderr);
 assert.match(r.calls,/deploy --only hosting:school-of-abstractions --project eric-art-project/);
 assert.match(r.stdout,/https:\/\/school-of-abstractions.web.app/);
});
