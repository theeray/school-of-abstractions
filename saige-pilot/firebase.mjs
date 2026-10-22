/* STAGED: not connected to the current firebase.json or static publishing workflow. */
import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {defineSecret} from 'firebase-functions/params';
import {initializeApp,getApps} from 'firebase-admin/app';
import {getFirestore,FieldPath} from 'firebase-admin/firestore';
import {CATALOG_SHA,SafeError,fail} from './core.mjs';
import {createService} from './service.mjs';
import {createOpenAI} from './openai.mjs';
const key=defineSecret('SAIGE_OPENAI_API_KEY');
if(!getApps().length)initializeApp();
const db=getFirestore();
const store={
  async atomic(keys,fn){
    return db.runTransaction(async tx=>{
      const refs=keys.map(k=>db.doc(k)),snapshots=await tx.getAll(...refs);
      const records=Object.fromEntries(keys.map((k,i)=>[k,snapshots[i].exists?snapshots[i].data():null]));
      const result=fn(records);
      for(const [k,v]of Object.entries(result.set||{}))tx.set(db.doc(k),v);
      for(const k of result.del||[])tx.delete(db.doc(k));
      return result.value;
    });
  },
  async scan(collection,limit,cursor){
    if(cursor && !/^[a-f0-9]{64}$/.test(cursor))fail('invalid-argument','Invalid page cursor.');
    let q=db.collection(collection).orderBy(FieldPath.documentId()).limit(limit+1);
    if(cursor)q=q.startAfter(cursor);
    const snap=await q.get(),list=snap.docs;
    return {records:list.slice(0,limit).map(doc=>({...doc.data(),id:doc.id})),nextCursor:list.length>limit?list[limit-1].id:null};
  },
};
const list = name => (process.env[name]||'').split(',').map(s=>s.trim()).filter(Boolean);
function active(){
  if(process.env.SAIGE_ENABLED!=='true'||process.env.SAIGE_APPROVED_CATALOG_SHA256!==CATALOG_SHA)
    fail('failed-precondition','The Saige conversation pilot has not been activated.');
}
function verifiedApp(req){
  if(!req.app?.appId||!list('SAIGE_APP_IDS').includes(req.app.appId)||req.app.alreadyConsumed)
    fail('permission-denied','This request could not be verified.');
}
function service(withAI=false){
  const ai=withAI?createOpenAI({key:key.value(),model:process.env.SAIGE_ROUTER_MODEL,
    transcriptionModel:process.env.SAIGE_TRANSCRIPTION_MODEL||'gpt-4o-mini-transcribe'}):{};
  return createService({store,...ai,adminUIDs:list('SAIGE_ADMIN_UIDS')});
}
const options={region:'us-central1',maxInstances:2,concurrency:8,timeoutSeconds:60,memory:'256MiB',
  enforceAppCheck:true,consumeAppCheckToken:true,
  cors:['https://school-of-abstractions.web.app','https://school-of-abstractions.firebaseapp.com']};
function wrap(fn,{ai=false,requiresActive=true}={}){
  return onCall({...options,...ai?{secrets:[key]}:{}},async req=>{
    try{
      verifiedApp(req);if(requiresActive)active();
      return await fn(service(ai),req.data||{},req);
    }catch(e){
      // Never log request bodies, provider responses, audio, raw questions, names, or tokens.
      if(e instanceof SafeError)throw new HttpsError(e.code,e.message);
      throw new HttpsError('unavailable','This action could not complete. No diagnostic content is included.');
    }
  });
}
export const saigeStart=wrap((s,d)=>s.start(d));
export const saigeTurn=wrap((s,d)=>s.turn(d.sessionToken,d),{ai:true});
export const saigeEnd=wrap((s,d)=>s.end(d.sessionToken),{requiresActive:false});
export const saigeForget=wrap((s,d)=>s.forget(d.deletionCode),{requiresActive:false});
export const saigeReview=wrap((s,d,r)=>s.review(r.auth,d),{requiresActive:false});
export const saigeRemoveReview=wrap((s,d,r)=>s.removeReview(r.auth,d.id),{requiresActive:false});
