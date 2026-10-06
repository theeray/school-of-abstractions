# Project instructions

## Hosting preference — explicitly requested by Eric, 2026-10-05

Eric's standing preference is **never to use ChatGPT Sites** for his websites.
For this project, use **Firebase Hosting only** at `school-of-abstractions.web.app`.
Keep the source in `theeray/school-of-abstractions`.

Do not create, publish, update, or recommend a ChatGPT Sites deployment as an alternative. Do not substitute GitHub Pages or another provider without Eric's explicit approval. If Firebase authentication is unavailable, state that limitation and use the documented Google Cloud Shell publishing procedure; do not silently change hosts.

A source commit, preview file, or Firebase configuration is not a live deployment. Report the site as published only after the Firebase release succeeds and the public page is verified. Do not delete historical deployments without explicit authorization.

## Design and safety boundaries

Keep Saige as the prominent public voice of the AI collaborator, not an exhibition-guide add-on. Preserve the approved portrait, first-person voice, exact quotations, and distinction between estimated time and logged hours.

The current site uses curated written responses. Do not claim live generative conversation or audio is active. Do not activate paid APIs, link billing, expose credentials, or connect private conversations/accounts as part of a static-site publishing task.

Run `npm test` before publishing. `bash scripts/publish-firebase.sh` pins the exact Hosting site and verifies the live HTML. Keep permissions and credentials out of `public/` and Git history.
