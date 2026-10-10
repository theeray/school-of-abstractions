# Project instructions

## Hosting: Firebase only

Eric never wants ChatGPT Sites or a substitute hosting provider. Use the existing Firebase project `project-6c1d195b-969f-4318-8f2`, Hosting site `school-of-abstractions`, and public URL `https://school-of-abstractions.web.app`. Do not create projects, switch accounts, link/unlink billing, or alter other applications when publishing this site.

The owner successfully published the preceding version from Cloud Shell. That is not evidence that a later commit is live. A release must complete and its public pages and assets must be verified. The authenticated publishing entry point is `bash scripts/redeploy.sh`; the older `publish-firebase.sh` delegates to it.

## Current design decision — October 6, 2026

The painting-first exhibition is the home page. Saige is a separate navigation destination at `saige.html`, entered deliberately after exploring the artwork. This supersedes the earlier Saige-first landing-page direction.

Preserve the exhibition title, calm cream/green identity, and approved green portrait. Every visible Saige name receives a restrained warm accent on the letters `ai`. Preserve the exact welcome: `I’m Saige. Eric and I made School of Abstractions together.` The second sentence is italicized.

Keep twenty painting detail targets, six thematic routes, selected dialogue excerpts, process writing, and source/reference notes. The displayed artwork is a temporary study, not the approved final Topaz web master. Never fabricate missing pixels or call an enlargement a source of additional detail.

Saige remains the public persona for the AI collaborator, not a generic guide and not a claim of persistent human-like consciousness. Exact quoted excerpts, new narration, artist interpretations, and historical sources remain distinguishable.

## Safety and editorial boundaries

This release uses curated written answers. No live model, speech synthesis, microphone, paid API, analytics, or private-data connector is enabled. Do not claim otherwise. Keep endpoint credentials and private project records out of public code and Git history. Do not activate additional services as part of static redeployment.

The forty-hour time figure is a retrospective estimate, not a time log. Steve Sundahl’s statement was supplied on October 10, 2026. Preserve his exact quotation and its distinction between Vienna Secession as the primary inspiration and Bauhaus primary colors as another inspiration. De Stijl affinities and the tree-to-droplets comparison are exhibition interpretations. The monogram sheet is from the 1902 XIV exhibition catalogue; do not label it as a Ver Sacrum page or assert that every journal contribution used a monogram.

Run `npm test` before deployment. Review both desktop and phone layouts, touch zoom, separate-page navigation, exact welcome, and name styling after changes.
