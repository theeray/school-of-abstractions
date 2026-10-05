# The School of Abstractions

**Saige is the public voice of the AI collaborator, not a museum-guide add-on.**

This is the approved Saige-centered design for Eric R. Carlson's *The School of Abstractions*: a prominent portrait and first-person welcome, four narrative paths, the Pollock–Mondrian realization, the studio-process statement, and a central written conversation interface.

## Run

Node.js 22 or newer; no third-party runtime packages and no API key required.

```sh
npm start
# Open http://127.0.0.1:4173
npm test
npm run build
```

`npm run build` copies only the public website to `dist/`. It does not deploy anything. Any static host can serve `public/` directly; asset URLs also work under a repository subpath.

## What works now

- Saige's approved portrait, collaborator-first introduction and mobile-friendly narrative layout.
- Four paths: **Look with me**, **How we changed each other**, **How we made it**, and **Ask me yourself**.
- The exact artist-supplied process quotation and approximately 40 hours, explicitly identified as a retrospective estimate.
- Nineteen curated written-note topics, source notes, starter questions, follow-up topic selection and clear-conversation controls.
- Story buttons that lead into Saige's relevant written answer.

## What is not connected

**This is a design and written-note preview, not a live generative or speaking agent.** There is no microphone input, synthesized audio, paid API call, server-side agent, or deployment credential in this repository. The `saige-guide` component retains a future same-origin endpoint hook with a consent step, but the page does not enable it.

The earlier twenty-point painting viewer, full reference gallery and full dialogue timeline have not yet been merged into this architecture. The approved painting master and its deep-zoom assets remain a separate integration step; no placeholder is presented as the final artwork.

A commit to this repository does **not** replace the earlier ChatGPT-hosted exhibition or create `school-of-abstractions.web.app`.

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
| `docs/STATUS.md` | Remaining integration and publishing work |

The approved self-contained preview has been split into editable files. Mobile navigation and focus styles were improved; repeated portrait data was replaced with one local image. There are no CDN dependencies, analytics, browser storage, or private account connectors.

## Publishing

The included `firebase.json` serves `public/` only. No Firebase project ID or site ownership is assumed. Select the authorized Firebase project and verify the intended Hosting site before running a deployment. The configuration does not provision or reserve a domain.

Official documentation:
- https://firebase.google.com/docs/hosting/quickstart
- https://firebase.google.com/docs/hosting/full-config
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Attribution and editorial boundaries

Saige is a persona for the AI role in the documented collaboration, not a claim of one continuously conscious individual behind every model response. The expanded explanation remains available without dominating the introduction. Historical claims and the artist's interpretations stay distinct. The Sundahl quotation and confirmation of the TAD logo's actual influences are still pending; visual resemblance is not proof of influence.

Artwork, avatar and artist-supplied material are included for this project. No open-source or third-party image license is asserted by this repository. Review rights before reuse outside the exhibition.
