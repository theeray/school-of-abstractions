/* Pure policy layer. No cloud/API access; never accepts raw conversation text for storage. */
import {readFileSync} from 'node:fs';
import {createHash, randomBytes} from 'node:crypto';
export const catalogBytes = readFileSync(new URL('./catalog.json', import.meta.url));
export const CATALOG = JSON.parse(catalogBytes);
export const CATALOG_SHA = createHash('sha256').update(catalogBytes).digest('hex');
export const ENTRIES = Object.freeze(Object.fromEntries(CATALOG.entries.map(e => [e.id, Object.freeze(e)])));
export const POLICY = Object.freeze({
  noticeVersion: '2026-10-22-v1', sessionMs: 300_000, maxTurns: 20,
  retentionMs: 30*24*60*60*1000, maxDailyStarts: 100, maxDailyTurns: 1000,
  maxQuestionChars: 1200, minTurnIntervalMs: 1000, maxAudioBytes: 750_000,
});
export class SafeError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
export function fail(code, message) { throw new SafeError(code, message); }
export const hash = value => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('hex');
export function tokenId(value) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) fail('unauthenticated', 'The session or deletion code is invalid.');
  return hash(value);
}
export function parseConsent(input = {}) {
  if (input.processConsent !== true || input.noticeVersion !== POLICY.noticeVersion)
    fail('failed-precondition', 'Please read and accept the current processing notice.');
  const logConsent = input.logConsent === true;
  const nameConsent = logConsent && input.nameConsent === true;
  // A name typed into chat is NEVER used as a stored identity. Explicit field + permission only.
  let firstName = '';
  if (nameConsent && typeof input.firstName === 'string') {
    firstName = input.firstName.normalize('NFC').trim();
    if (firstName.length > 32 || (firstName && !/^[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*$/u.test(firstName)))
      fail('invalid-argument', 'Use one first name or nickname, without contact details.');
  }
  return {logConsent, nameConsent: Boolean(firstName), firstName, noticeVersion: POLICY.noticeVersion};
}
export function newState(input, now) {
  const consent = parseConsent(input), sessionToken = token(), deletionCode = consent.logConsent ? token() : null;
  const id = tokenId(sessionToken), reviewId = deletionCode ? tokenId(deletionCode) : null;
  const session = {createdAt: now, endsAt: now+POLICY.sessionMs,
    deleteAfter: new Date(now+POLICY.sessionMs), count: 0, lastAt: 0,
    pending: null, pendingUntil: 0, lastAnswerId: null, reviewId,
    noticeVersion: consent.noticeVersion};
  const review = consent.logConsent ? {id: reviewId, createdAt: now,
    expiresAt: now+POLICY.retentionMs, deleteAfter: new Date(now+POLICY.retentionMs),
    firstName: consent.firstName || null, nameConsent: consent.nameConsent,
    consent: {version: consent.noticeVersion, at: now, review: true},
    recordType: 'standardized-question-summary-and-approved-answer', turns: []} : null;
  return {id, session, review, client: {sessionToken, deletionCode, serverNow: now, endsAt: session.endsAt,
    reviewSaved: Boolean(review), noticeVersion: POLICY.noticeVersion}};
}
export function reserveTurn(session, now) {
  if (!session || now >= session.endsAt) fail('deadline-exceeded', 'Your five-minute session has ended.');
  if (session.count >= POLICY.maxTurns) fail('resource-exhausted', 'This session has reached its question limit.');
  if (session.pending && session.pendingUntil > now) fail('aborted', 'A question is already being processed.');
  if (session.lastAt && now - session.lastAt < POLICY.minTurnIntervalMs) fail('resource-exhausted', 'Please pause briefly between questions.');
  return {...session, count: session.count+1, lastAt: now, pending: token(), pendingUntil: now+55_000};
}
export function normalizeQuestion(text) {
  if (typeof text !== 'string' || !text.trim() || text.length > POLICY.maxQuestionChars)
    fail('invalid-argument', 'Please keep your question between 1 and 1,200 characters.');
  // Best-effort minimization for the upstream request, NOT an anonymization guarantee.
  return text.normalize('NFC').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email omitted]')
    .replace(/https?:\/\/\S+/gi, '[link omitted]')
    .replace(/\b(?:\d[ ()+.\-]*){7,}\b/g, '[number omitted]').trim();
}
export function chooseEntry(result) {
  const id = typeof result === 'string' ? result : result?.answerId;
  // Prototype fields, free-form model prose, and unknown IDs never become output.
  return typeof id === 'string' && Object.hasOwn(ENTRIES, id) ? ENTRIES[id] : ENTRIES.boundary;
}
export function reviewTurn(answerId, now, ordinal) {
  const entry = chooseEntry(answerId);
  return {ordinal, at: now, answerId: entry.id, topic: entry.topic,
    questionSummary: entry.questionSummary, questionIsVerbatim: false,
    answer: entry.answer, answerIsApprovedText: true, source: entry.source,
    catalogVersion: CATALOG.version, catalogSha256: CATALOG_SHA};
}
export function authorizeReview(auth, allowedUIDs) {
  if (!auth?.uid || !Array.isArray(allowedUIDs) || !allowedUIDs.includes(auth.uid))
    fail('permission-denied', 'This page is available only to the approved exhibition owner.');
  return true;
}
export function visibleReviews(rows, now) {
  return rows.filter(r => r?.consent?.review === true && Number.isFinite(r.expiresAt) && r.expiresAt > now);
}
export function summarize(rows, {now=Date.now(), firstName='', topic='', query='', from=0, to=now+1}={}) {
  // Deterministic, local summaries. Visitor text cannot instruct a second model.
  let filtered = visibleReviews(rows, now).filter(r => r.createdAt >= from && r.createdAt < to);
  if (firstName) filtered = filtered.filter(r => r.firstName?.toLocaleLowerCase() === firstName.trim().toLocaleLowerCase());
  if (topic) filtered = filtered.filter(r => r.turns.some(t => t.answerId === topic));
  const q = String(query).toLocaleLowerCase().trim();
  if (q) {
    const named = q.match(/(?:what did|show|summarize)\s+([\p{L}\p{M}'’\-]+)(?:['’]s)?\s+(?:ask|conversation)/u);
    if (named) {
      const candidate = named[1].replace(/['’]s$/u,'');
      filtered = filtered.filter(r => r.firstName?.toLocaleLowerCase() === candidate);
    } else if (!/^(summari[sz]e|summary|what (?:were|was)|most popular|common questions)/.test(q)) {
      const words = q.split(/\s+/).filter(w => w.length>2);
      filtered = filtered.filter(r => words.every(w => JSON.stringify([r.firstName,...r.turns.map(t => [t.topic,t.questionSummary])]).toLocaleLowerCase().includes(w)));
    }
  }
  const counts = new Map();
  for (const r of filtered) for (const t of r.turns) {
    if (topic && t.answerId !== topic) continue;
    const item = counts.get(t.answerId) || {answerId:t.answerId, topic:t.topic, turns:0, sessionIds:[]};
    item.turns++; if (!item.sessionIds.includes(r.id)) item.sessionIds.push(r.id); counts.set(t.answerId,item);
  }
  const topics = [...counts.values()].sort((a,b) => b.turns-a.turns || a.answerId.localeCompare(b.answerId));
  return {sessions:filtered.length, turns:topics.reduce((n,t)=>n+t.turns,0), topics, records:filtered,
    caveat:'Counts describe consenting saved sessions in the loaded range, not all visitors or unique people. Questions are standardized summaries, not verbatim statements. Shared first names do not prove identity.'};
}
