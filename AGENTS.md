# Project instructions

## Hosting: Firebase only

Eric never wants ChatGPT Sites or a substitute hosting provider. Use the existing Firebase project `project-6c1d195b-969f-4318-8f2`, Hosting site `school-of-abstractions`, and public URL `https://school-of-abstractions.web.app`. Do not create projects, switch accounts, link/unlink billing, or alter other applications when publishing this site.

The owner has successfully published this site from Cloud Shell. That is not evidence that a later commit is live. A release must complete and its public pages and assets must be verified.

## Current design decisions

The painting-first exhibition is the home page. Saige is a separate navigation destination at `saige.html`, entered deliberately after exploring the artwork. Preserve the exhibition title and calm cream/green identity. Every visible Saige name receives a restrained warm accent on the letters `ai`. Preserve the exact welcome: `I’m Saige. Eric and I made School of Abstractions together.` The second sentence is italicized.

The user has now requested the saved high-resolution master, the supplied faceted portrait as the favicon/small header icon, Steve's supplied headshot with a speech bubble, and the actual TAD logo above its history section. Saige's own portrait remains in her separate section. Read `docs/HD-UPDATE.md` before deployment: the new image derivatives are a separately supplied checksummed ZIP. `scripts/redeploy-hd.sh` verifies that package, downloads and verifies the three historical reference images, runs tests, then deploys and verifies every public asset. No missing media should be represented as installed. A fresh clone needs the media ZIP installed once; never discard the existing working checkout's untracked media.

Keep twenty painting detail targets, six thematic routes, selected dialogue, process writing, and source/reference notes. Independent face-centered card crops must not move hotspots. The active source is the existing 9,000 x 6,000 studio master with its documented Euclid repair, once the media is installed. Never fabricate missing detail or perform new generative edits when exporting web assets.

References include Raphael under **The Original Dialogue**, Blake's **The Ancient of Days** (not Newton), and Michelangelo's **Pietà**. Display original imagery with attribution, licensed photo credits, and links to the related painting details. Blake's work is a hand-colored print; Michelangelo's is sculpture. Distinguish historical sources from the artist's allusions.

The user rejected the particular gender-balance quote card, not the women-and-recognition theme. Its replacement is **Changing one statue changed the question**, a clearly labeled compositional summary of replacing Athena with Dionysus, not an invented exact prompt.

Saige remains the public persona for the AI collaborator, not a generic guide and not a claim of persistent human-like consciousness. Exact quoted excerpts, new narration, artist interpretations, and historical sources remain distinguishable.

## Safety and editorial boundaries

This release uses curated written answers. No live model, speech synthesis, microphone, paid API, analytics, or private-data connector is enabled. Do not claim otherwise. Keep credentials and private project records out of public code and Git history. Do not activate additional services as part of static redeployment.

The forty-hour time figure is a retrospective estimate, not a time log. Steve Sundahl's supplied statement distinguishes Vienna Secession as the primary inspiration and Bauhaus primary colors as another inspiration. De Stijl affinities are exhibition interpretations. Preserve the full source quotation in the curated record. For the featured speech bubble, Eric approved an excerpt on October 20, 2026: omit only `I will just say that `, begin with three literal periods (`...part of the inspiration`), and leave all remaining words unchanged. Its attribution ends with `Statement on creative inspiration`, not `verbatim statement`. The source note must identify the opening omission rather than call the featured excerpt the complete statement. The monogram sheet is from the 1902 XIV exhibition catalogue; do not label it as a Ver Sacrum page or assert that every journal contribution used a monogram.

Run the current tests before deployment. Review desktop/phone layouts, high-resolution loading, touch zoom, separate-page navigation, exact welcome, and name styling after changes.
