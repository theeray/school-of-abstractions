# The School of Abstractions

**Saige is the public voice of the AI collaborator, not a museum-guide add-on.**

This is the approved Saige-centered design for Eric R. Carlson's *The School of Abstractions*: a prominent portrait and first-person welcome, four narrative paths, the Pollock–Mondrian realization, the studio-process statement, and a central written conversation interface.

## Hosting requirement

**Firebase Hosting only, at `school-of-abstractions.web.app`. Never use ChatGPT Sites.** Eric explicitly requested this preference on October 5, 2026. It is also recorded in `AGENTS.md` for future work. Do not substitute another hosting provider without approval.

Source code being committed is not proof of a live deployment. The Firebase site must be created/verified in the authorized Google account before it can be published.

## Run

Node.js 22 or newer; no third-party runtime packages and no API key required.

```sh
npm start
# Open http://127.0.0.1:4173
npm test
npm run build
```

`npm run build` copies only the public website to `dist/`. It does not deploy anything. Firebase Hosting serves `public/` directly.

## Publish to Firebase

Open the normal [Google Cloud Shell](https://shell.cloud.google.com), sign in with the Google account used for Firebase, and approve Google authorization if prompted. Use the normal shell rather than an automatic non-Google repository link: those links may start an isolated environment without account credentials.

Paste this block; it clones the latest source into a new directory without modifying any existing checkout:

```sh
workdir="$(mktemp -d "$HOME/saige-publish.XXXXXX")" &&
git clone https://github.com/theeray/school-of-abstractions.git "$workdir" &&
cd "$workdir" &&
bash scripts/publish-firebase.sh
```

The script runs the tests, verifies Firebase access, creates the `school-of-abstractions` project and Hosting site if absent and available, applies the exact Hosting target, publishes only that site, then compares the public HTML to the local page. It does not link billing or enable live AI, audio, databases, or functions. Missing authorization, creation errors, occupied names, failed tests, or failed verification stop the process rather than switching hosts or claiming success.

If the correct authorized Firebase project has a different ID, set it explicitly while keeping the required public hostname:

```sh
FIREBASE_PROJECT_ID=YOUR_EXISTING_PROJECT_ID bash scripts/publish-firebase.sh
```

Do not invent a replacement hostname if the requested site ID is unavailable. Resolve the project/site ownership first. The script uses a preinstalled Firebase CLI when available, otherwise `npx --yes firebase-tools@latest`. It requires Bash, Node.js 22+, npm, and curl. The target mapping is stored locally in `.firebaserc` only after authenticated setup; no project ownership is inferred from a public URL or a configuration file.

Success is the final line `Published and verified: https://school-of-abstractions.web.app`. The deployment helper's tests mock Firebase and the web request; passing tests is not evidence of a real deployment.

Official references:
- https://firebase.google.com/docs/cli
- https://firebase.google.com/docs/hosting/multisites
- https://docs.cloud.google.com/shell/docs/open-in-cloud-shell

## What works now

- Saige's approved portrait, collaborator-first introduction and mobile-friendly narrative layout.
- Four paths: **Look with me**, **How we changed each other**, **How we made it**, and **Ask me yourself**.
- The exact artist-supplied process quotation and approximately 40 hours, explicitly identified as a retrospective estimate.
- Nineteen curated written-note topics, source notes, starter questions, follow-up topic selection and clear-conversation controls.
- Story buttons that lead into Saige's relevant written answer.

## What is not connected

**This is a design and written-note preview, not a live generative or speaking agent.** There is no microphone input, synthesized audio, paid API call, server-side agent, or deployment credential in this repository. The `saige-guide` component retains a future same-origin endpoint hook with a consent step, but the page does not enable it.

The earlier twenty-point painting viewer, full reference gallery and full dialogue timeline have not yet been merged into this architecture. The approved painting master and its deep-zoom assets remain a separate integration step; no placeholder is presented as the final artwork.

## Edit

| File | Purpose |
| --- | --- |
| `public/index.html` | First-person narrative, section order, quotations and navigation |
| `public/styles.css` | Site layout and responsive styling |
| `public/site.js` | Story-to-conversation actions |
| `public/saige/avatar.webp` | Approved Saige illustration, reused without redesign |
| `public/saige/content.js` | Curated public notes, approved quotations and source metadata |
| `public/saige/core.js` | Deterministic written-note retrieval; not a language model |
| `public/saige/components.js` | Conversation and studio-process web components |
| `public/saige/components.css` | Component styling inside shadow roots |
| `scripts/publish-firebase.sh` | Authenticated Firebase-only publishing and page verification |
| `AGENTS.md` | Owner's hosting preference and project instructions |
| `docs/STATUS.md` | Remaining integration and publishing work |

The approved self-contained preview has been split into editable files. Mobile navigation and focus styles were improved; repeated portrait data was replaced with one local image. There are no CDN dependencies, analytics, browser storage, or private account connectors.

## Attribution and editorial boundaries

Saige is a persona for the AI role in the documented collaboration, not a claim of one continuously conscious individual behind every model response. The expanded explanation remains available without dominating the introduction. Historical claims and the artist's interpretations stay distinct. The Sundahl quotation and confirmation of the TAD logo's actual influences are still pending; visual resemblance is not proof of influence.

Artwork, avatar and artist-supplied material are included for this project. No open-source or third-party image license is asserted by this repository. Review rights before reuse outside the exhibition.
