# The School of Abstractions

A painting-first exhibition by Eric R. Carlson, with **Saige in a separate collaborator section**.

**Home:** https://school-of-abstractions.web.app  
**Saige:** https://school-of-abstractions.web.app/saige.html  
**Hosting:** Firebase only. Never use ChatGPT Sites.

## This merge

- Painting-first home with the original exhibition title, introductory text, navigation structure, and approved Saige portrait used in the shared identity.
- Twenty selectable details; pinch/drag/keyboard zoom, fit, pins, expanded view, and contextual reading panels.
- Six thematic tours with next/previous stops; eight concise selected dialogue moments; process statement and retrospective time estimate; source notes and credited reference-image links.
- Separate `saige.html` retaining the collaborator voice, exact welcome, four narrative routes, and nineteen curated written-response topics.
- A subtle copper accent on the `ai` in every visible Saige name, including dynamic conversation text.
- Deep links from painting details to the matching Saige note, and links back into the artwork.

The initial website's complete source archive could not be recovered. This merges a reconstructed painting-first exhibition, grounded in its exported text and approved project material, with the approved collaborator component. It is not claimed to be a byte-for-byte restoration of the original source or CSS.

## Run and test

Node.js 22+; no runtime package install or API key needed.

```sh
npm start
# http://127.0.0.1:4173
npm test
npm run build
```

`public/` contains the complete static website. Build copies it to `dist/` without deploying.

The temporary painting is a compressed 1200-pixel AVIF study. The portrait is the approved WebP asset. Museum/gallery reference photographs load from credited external sources, with a link fallback when loading fails. No image is presented as the final approved high-resolution Topaz master.

## Publish the already-created site

Use the owner's signed-in Google Cloud Shell. The established project is `project-6c1d195b-969f-4318-8f2`; the site is `school-of-abstractions`. The script never provisions another project or touches billing.

From the checkout used for the previous successful publication:

```sh
cd ~/saige-publish.cpSRbp &&
git pull --ff-only &&
bash scripts/redeploy.sh
```

The helper runs the tests, verifies that the expected Hosting site exists in the selected project, applies its local target mapping, deploys only that Hosting site, and compares both published pages and all local runtime assets with the source files. `.firebaserc` is deliberately local/ignored so pulling the repository does not overwrite the owner's existing untracked target map.

No live release is implied by a source commit. Success ends with:

```text
Published and verified: https://school-of-abstractions.web.app
Saige section: https://school-of-abstractions.web.app/saige.html
```

Official deployment reference: https://firebase.google.com/docs/hosting/multisites

## Edit

- `public/index.html`: exhibition home and original opening text.
- `public/exhibition-data.js`: twenty details, six tours, eight dialogue moments, credited references and sources.
- `public/exhibition.js`: image navigation, reading panels, tours and source rendering.
- `public/styles.css`: shared identity and responsive layout.
- `public/saige.html`: separate collaborator section and exact welcome.
- `public/saige-page.js`: allow-listed painting-to-conversation context.
- `public/branding.js`: safe visible-name accent in ordinary and shadow DOM.
- `public/saige/`: approved portrait, public notes, deterministic response matching and components.
- `scripts/redeploy.sh`: pinned existing-project deployment and verification.

## Not activated

Saige has curated **written responses**, not a live generative connection or speaking voice. No microphone, audio synthesis, API calls, tracking, browser-persistent chat history, or private account connection is enabled. The future same-origin endpoint hook remains dormant without an endpoint attribute and positive status check. A generated AI response would require a separately reviewed server, consent, abuse/rate controls, and budget constraints.

Steve Sundahl's quote is pending. The logo's Bauhaus / De Stijl connections remain interpretive, not confirmed influence. Exact dialogue and new exhibition prose are labelled separately. The time estimate does not claim a measured activity log.

Artwork and portrait are supplied for this project. No blanket open-source or third-party image license is asserted.
