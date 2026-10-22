# Saige: five-minute conversations and private visitor review

**Staged implementation, not a live feature.** This folder is outside the current
`public/` website. No hosting configuration, workflow, cloud permission, database,
secret, billing setting, or production page is changed. Do not enable it by
running the existing static-site publishing workflow.

## The privacy decision

Eric asked for optional first names and a way to review questions and summaries.
First names/nicknames are personal data, even without surnames. Treat all review
records as private. The default implementation stores **standardized question
summaries selected from the approved answer catalog, plus the exact approved
answer sent**. It does NOT store the visitor's original words, a redacted copy of
those words, raw audio, full chat history, or model-generated summary prose.

This is a deliberately constrained review log, not a verbatim transcript. A
misclassified question can produce the wrong topic summary. Unknown/out-of-scope
questions are recorded only as a fixed boundary category; their exact wording
cannot be recovered later. Do not describe these categories as exact quotations,
verified visitor beliefs, or evidence that somebody listened to the answer.

This prevents arbitrary personal details from entering the review text through
a question or a free-form model output. The separately consented first-name
field is the exception. Do not promise that all data is anonymous, that a supplied
name is genuinely a first name, or that upstream processing has zero retention.

Visitors may decline review logging and still converse. No name is saved unless
both logging AND name permission are checked. Names spoken or typed in questions
are never extracted into the name field. The explicit name field is not supplied
to the routing model. A nickname or no name is encouraged.

## Implemented here

- A draft 20-entry public answer catalog, with references to existing exhibit text.
- A five-minute server deadline, 20-turn limit, single in-flight question per
  session, minimum interval, and atomic global daily start/turn allowances.
- Separate processing, optional review-log, optional name, and microphone consent.
- AI selects only an allowlisted answer ID. The server supplies the actual words.
- Text and audio request adapters. Incoming audio is held in memory only and
  transcribed using OpenAI. No audio is saved to Firestore, Storage, or GitHub.
- Browser microphone capture capped at 20 seconds and stopped on tab hiding or
  session end. The server enforces a byte cap; it does NOT claim to independently
  measure audio duration. Rate limits bound request counts, not exact currency.
- A private Google-sign-in review interface, keyword/name search, deterministic
  topic counts, per-record details, private JSON export, and deletion.
- Server-side owner UID allowlist checks on every review/export/delete request.
  App Check is mandatory with limited-use tokens. Neither is replaced by hiding
  the review URL. Auth tokens are verified by the callable-functions middleware.
- No API call for administrative summaries. They are counts and filtered record
  views, not an unrestricted natural-language analytics assistant. Supported
  examples: `What did Alex ask about?`, `Summarize conversations`, or topic keywords.
- Pagination of 100 candidate records per page, with explicit limited-coverage
  labels. These are opt-in sessions, not all visitors or unique people. Shared
  first names are never merged into an asserted identity.
- Thirty-day default review access, application filtering of expired records,
  Firestore TTL fields, visitor deletion codes, and owner deletion. One document
  contains the entire review so TTL does not leave child transcripts behind.
- Session/delete tokens are random 256-bit values; only their hashes are stored.
- A deleted review is never recreated by an answer already in flight.
- Browser records live in memory, not localStorage. Explicit sign-out clears the
  owner view. Exported JSON is private and has no automatic deletion; protect and
  delete exports separately. Never commit exports to this public repository.
- Closed-by-default runtime configuration and a catalog SHA approval gate.

## Files and verification

Run the dependency-free tests with Node 22:

```sh
node --test saige-pilot/tests/*.test.mjs
```

The 33 tests passed locally on October 22, 2026. These tests use a memory store,
mocked model responses, and source assertions. They cover consent, no-raw-text
persistence, owner authorization, expiry, quota races, deletion races, unknown
model IDs, and upstream errors. They do NOT establish Firebase integration,
provider/model accuracy, App Check attestation, browser rendering, microphone compatibility,
synthetic-voice quality, dependency installation, or a production release.

The current environment could not resolve public network hosts from the build
container, so npm dependencies were not installed and cloud/emulator tests were
not run. Dependency versions were checked against their official release records;
a lockfile and security review must be produced in the authorized build environment.
The headless browser executable was also unavailable, so no visual browser tests
are claimed.

`npm run preview --prefix saige-pilot` serves only the staged HTML on loopback.
The preview is disabled by default; it does not simulate real visitors or expose
an unprotected administrative database. `PUBLIC-SCRIPT.md` is the readable draft.

## Required before activation

1. Eric reviews `PUBLIC-SCRIPT.md`, privacy notice, names policy, 30-day default,
   daily allowances, and the public-answer scope. Do not activate based solely on
   a successful unit test. Any script change changes its approval SHA.
2. Verify the existing project `project-6c1d195b-969f-4318-8f2` and its billing.
   Provision/review Firestore, Firebase Authentication (Google for the owner), and
   App Check only in that project. Do not create another project or alter billing.
   Apply narrowly scoped runtime/deployment IAM; the current Hosting deployer is
   not automatically a Functions or Firestore administrator.
3. Use a dedicated runtime identity. Store `SAIGE_OPENAI_API_KEY` in Secret Manager
   and bind it only to `saigeTurn`. Never paste the key into chat or browser code.
4. Set `SAIGE_ADMIN_UIDS` to the actual owner's Firebase Auth UID(s), not a name,
   email typed by a visitor, or a domain-wide allowance. Set `SAIGE_APP_IDS` to the
   exact registered exhibition web-app ID(s). Empty lists deny all access.
5. Review existing Firestore rules for broad allows. Add server-only protection
   for `saige_sessions_v1`, `saige_reviews_v1`, and `saige_budgets_v1`. A deny rule
   does NOT override an existing wildcard allow. Never overwrite unrelated rules.
   Admin SDK access bypasses Firestore client rules; retain the server UID checks.
6. Enable TTL on `deleteAfter` for all three collections. Firestore deletion is
   asynchronous (typically within a day); app access still ends at expiresAt.
   Review backups, logging, and infrastructure retention separately.
7. Install dependencies and generate a lockfile; run emulator tests that verify
   unauthenticated users, ordinary signed-in users, invalid App Check, and expired
   sessions cannot access records or use the paid endpoints. No request-body
   logging, error-content logging, tracing of messages, or saved audio.
8. Set an available, tested `SAIGE_ROUTER_MODEL` supporting Responses structured
   outputs. `SAIGE_TRANSCRIPTION_MODEL` defaults to `gpt-4o-mini-transcribe`; verify
   availability and pricing in the API project. `store:false` is not Zero Data
   Retention. Visitor questions can contain personal information despite notices.
9. Run adversarial routing evaluations: secrets, private history, false personal
   claims, role-play, alleged owner authority, student names, politics, prompt
   injection, and irrelevant questions. The answer selector cannot invent output
   prose, but can choose an inappropriate approved answer; assess this risk.
10. For spoken replies, generate only approved catalog text with `render-voice.mjs`
    using the owner-authorized API project; then listen to every clip. Do not set
    audioReplies=true until every file and pronunciation passes review. This
    implementation does not include already generated speech clips.
11. Integrate `web/` into the separate Saige page without replacing the exhibition.
    Change the existing microphone Permissions-Policy only for the Saige page and
    only at activation. The current site intentionally blocks microphones.
    Configure the public Firebase web-app values and reCAPTCHA Enterprise site key
    in runtime-config.json. These are app identifiers, not the secret AI key.
12. Deploy the new functions under a separately approved Functions codebase. Keep
    the existing Hosting workflow unchanged until staging checks pass. Review API
    costs, infrastructure requests, App Check quotas, concurrency and emergency
    shutdown controls. A request allowance is not a precise spending ceiling.
13. Set `SAIGE_APPROVED_CATALOG_SHA256` to the approved catalog's SHA256 and
    `SAIGE_ENABLED=true` only after all gates pass. Enabled false stops new starts
    and turns; owner review and visitor deletion remain available with valid auth.
14. Confirm current university requirements for visitor-data collection, exhibition
    signage, and ownership of API/service accounts before inviting real visitors.

## Data flow and separation

Public: question -> in-memory minimization -> OpenAI selects an ID -> server reads
approved response -> visitor. The server never supplies review logs or optional
first names to this model. It has no tools, web search, private account connector,
vector store, or original conversation archive.

Private: opted-in completed turn -> canonical topic/answer record in Firestore ->
owner-authenticated review -> deterministic summary with record and turn IDs.
Public Saige never searches other visitors' records. The administrative summary
interface is not automatically connected to Eric's ChatGPT conversations. A private
export can be deliberately shared for further analysis, with appropriate consent.

No recordings, names, or logs existed when this draft was prepared. The public
repository contains only implementation code and public exhibition answer drafts.

## Primary documentation consulted

- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/your-data
- https://developers.openai.com/api/docs/guides/speech-to-text
- https://firebase.google.com/docs/app-check/cloud-functions
- https://firebase.google.com/docs/auth/web/google-signin
- https://firebase.google.com/docs/functions/config-env
- https://firebase.google.com/docs/firestore/ttl
