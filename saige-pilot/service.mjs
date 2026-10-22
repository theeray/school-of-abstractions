/* Store contract: atomic(keys, fn), scan(collection, limit, cursor). All reads precede writes. */
import {POLICY, CATALOG_SHA, newState, tokenId, reserveTurn, normalizeQuestion,
  chooseEntry, reviewTurn, authorizeReview, summarize, fail} from './core.mjs';
export const COLLECTIONS = Object.freeze({sessions:'saige_sessions_v1',reviews:'saige_reviews_v1',budgets:'saige_budgets_v1'});
const path = (kind,id) => COLLECTIONS[kind]+'/'+id;
const dayKey = now => new Date(now).toISOString().slice(0,10);
export function createService({store, select, transcribe, clock=Date.now, adminUIDs=[]}) {
  const sessionKey = t => path('sessions',tokenId(t));
  return {
    async start(input) {
      const now=clock(), state=newState(input,now), budgetKey=path('budgets',dayKey(now));
      const sk=path('sessions',state.id), rk=state.review?path('reviews',state.review.id):null;
      await store.atomic([budgetKey,sk,...rk?[rk]:[]], records => {
        const b=records[budgetKey]||{starts:0,turns:0,deleteAfter:new Date(now+2*86400000)};
        if(b.starts>=POLICY.maxDailyStarts)fail('resource-exhausted','The exhibition has reached its daily session allowance.');
        return {set:{[budgetKey]:{...b,starts:b.starts+1},[sk]:state.session,...rk?{[rk]:state.review}:{}},value:null};
      });
      return state.client;
    },
    async turn(sessionToken, input) {
      // Reject malformed or oversized data before consuming a paid request.
      const isAudio = input?.audio !== undefined;
      let question = isAudio ? null : normalizeQuestion(input?.question);
      if (isAudio) {
        if(input.audioConsent!==true)fail('failed-precondition','Please accept audio processing before recording.');
        if(!input.audio || typeof input.audio.base64!=='string' || input.audio.base64.length>Math.ceil(POLICY.maxAudioBytes/3)*4 ||
          !/^(audio\/webm|audio\/mp4|audio\/ogg|audio\/wav)$/.test(input.audio.mime||'') ||
          !/^[A-Za-z0-9+/]+={0,2}$/.test(input.audio.base64))
          fail('invalid-argument','The audio recording is unsupported or too large.');
      }
      const now=clock(), sk=sessionKey(sessionToken), bk=path('budgets',dayKey(now));
      const reserved=await store.atomic([sk,bk], records => {
        const next=reserveTurn(records[sk],now), b=records[bk]||{starts:0,turns:0,deleteAfter:new Date(now+2*86400000)};
        if(b.turns>=POLICY.maxDailyTurns)fail('resource-exhausted','The exhibition has reached its daily request allowance.');
        return {set:{[sk]:next,[bk]:{...b,turns:b.turns+1}},value:next};
      });
      let selected;
      try {
        if(isAudio) question=normalizeQuestion(await transcribe(input.audio));
        // Pass only this question and a trusted topic ID. No explicit name field, saved logs, private chat history, or tools.
        selected=chooseEntry(await select(question,reserved.lastAnswerId));
      } catch { selected=chooseEntry('unavailable'); }
      question=null;
      const rk=reserved.reviewId?path('reviews',reserved.reviewId):null;
      return store.atomic([sk,...rk?[rk]:[]], records => {
        const s=records[sk], finished=clock();
        if(!s || finished>=s.endsAt || s.pending!==reserved.pending)
          fail('deadline-exceeded','The session ended before this answer was ready.');
        const next={...s,pending:null,pendingUntil:0,lastAnswerId:selected.id}, set={[sk]:next};
        const review=rk?records[rk]:null;
        // A deleted record is never recreated, including if deletion raced a model request.
        if(review?.consent?.review && review.expiresAt>finished)
          set[rk]={...review,turns:[...review.turns,reviewTurn(selected.id,finished,s.count)]};
        return {set,value:{answerId:selected.id,answer:selected.answer,source:selected.source,serverNow:finished,endsAt:s.endsAt,
          reviewSaved:Boolean(review?.consent?.review && review.expiresAt>finished),
          questionSummary:selected.questionSummary,questionIsVerbatim:false}};
      });
    },
    async end(sessionToken) {
      const sk=sessionKey(sessionToken);
      return store.atomic([sk], records => ({del:records[sk]?[sk]:[],value:{ended:true}}));
    },
    async forget(deletionCode) {
      const rk=path('reviews',tokenId(deletionCode));
      return store.atomic([rk], () => ({del:[rk],value:{deleted:true}}));
    },
    async review(auth, input={}) {
      authorizeReview(auth,adminUIDs);
      const limit=100;
      const page=await store.scan(COLLECTIONS.reviews,limit,input.cursor||null);
      const filter={now:clock(),firstName:input.firstName||'',topic:input.topic||'',query:input.query||'',
        ...(Number.isFinite(input.from)?{from:input.from}:{}),...(Number.isFinite(input.to)?{to:input.to}:{})};
      return {...summarize(page.records,filter),nextCursor:page.nextCursor,
        coverage:'Only this page of up to 100 saved sessions. Load more pages for a wider review.'};
    },
    async removeReview(auth,id) {
      authorizeReview(auth,adminUIDs);
      if(typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id))fail('invalid-argument','Invalid record identifier.');
      const rk=path('reviews',id);
      return store.atomic([rk],()=>({del:[rk],value:{deleted:true}}));
    },
    status: () => ({sessionSeconds:POLICY.sessionMs/1000,retentionDays:POLICY.retentionMs/86400000,
      noticeVersion:POLICY.noticeVersion,catalogSha256:CATALOG_SHA}),
  };
}

/* Tests/local preview only; NOT a production database or persistent log. */
export class MemoryStore {
  data=new Map(); queue=Promise.resolve();
  atomic(keys,fn) {
    const task=this.queue.then(()=>{
      const records=Object.fromEntries(keys.map(k=>[k,structuredClone(this.data.get(k)||null)]));
      const changes=fn(records);
      for(const [k,v]of Object.entries(changes.set||{}))this.data.set(k,structuredClone(v));
      for(const k of changes.del||[])this.data.delete(k);
      return structuredClone(changes.value);
    });
    this.queue=task.catch(()=>{});return task;
  }
  async scan(collection,limit,cursor) {
    const records=[...this.data.entries()].filter(([k])=>k.startsWith(collection+'/'))
      .map(([k,v])=>({...structuredClone(v),id:k.split('/')[1]})).sort((a,b)=>a.id.localeCompare(b.id));
    const remaining=records.filter(r=>!cursor||r.id>cursor), page=remaining.slice(0,limit);
    return {records:page,nextCursor:remaining.length>limit?page.at(-1).id:null};
  }
}
