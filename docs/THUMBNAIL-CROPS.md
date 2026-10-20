# Face-centered card thumbnails

The **People & the details** cards now have their own composition settings. The
painting's `point`, `zoom`, numbered pins, guided tours, and selected-detail views
are unchanged. Do not substitute hotspot coordinates for thumbnail coordinates.

The reviewed table is stored as `ExhibitionThumbnails.crops` at the beginning of
`public/exhibition.js`. It is kept separate from `EXHIBITION.details`, so an edit
to a card cannot accidentally move a hotspot. No additional runtime file or
hosting asset is needed; the existing redeployment verification already checks
`exhibition.js`.

`thumbPoint` is a normalized source-image position, measured from the top-left.
`thumbWidth` is the source-image width fraction visible through the card (smaller
means closer). `thumbAlign` puts faces at the horizontal center and slightly above
the vertical center. The layout helper converts these to pixel offsets using each
card's actual dimensions, instead of treating CSS background-position percentages
as if they were literal crop-center coordinates.

| # | Card | thumbPoint | thumbWidth | Treatment |
|---|---|---|---|---|
| 01 | Piet Mondrian | [0.401, 0.220] | 0.155 | Face and shoulders |
| 02 | Jackson Pollock | [0.579, 0.244] | 0.170 | Face and upper body |
| 03 | Lee Krasner | [0.479, 0.466] | 0.175 | Face and upper body |
| 04 | Janet Sobel | [0.756, 0.571] | 0.205 | Face, hair, and shoulders |
| 05 | Agnes Martin | [0.358, 0.465] | 0.160 | Face and shoulders |
| 06 | Hilma af Klint | [0.495, 0.376] | 0.075 | Distant head and shoulders |
| 07 | Theo van Doesburg | [0.279, 0.346] | 0.160 | Face with some glass context |
| 08 | Euclid | [0.266, 0.598] | 0.200 | Head, beard, and upper body |
| 09 | Benoit Mandelbrot | [0.649, 0.494] | 0.180 | Face and upper body |
| 10 | LeWitt wall drawing | [0.862, 0.464] | 0.225 | Wall detail |
| 11 | Apollo | [0.239, 0.128] | 0.180 | Statue head and shoulders |
| 12 | Dionysus | [0.756, 0.130] | 0.180 | Statue head and shoulders |
| 13 | TAD emblem | [0.220, 0.573] | 0.800 | Broad view of the forms |
| 14 | T | [0.115, 0.537] | 0.270 | Built form |
| 15 | A | [0.344, 0.355] | 0.275 | Glass form |
| 16 | D | [0.302, 0.813] | 0.275 | Foreground form |
| 17 | Equations | [0.112, 0.259] | 0.115 | Left inscription |
| 18 | Squares to droplets | [0.543, 0.365] | 0.250 | Transition of marks |
| 19 | Before the academy | [0.813, 0.815] | 0.250 | Handprint |
| 20 | School of Athens | [0.500, 0.500] | 1.000 | Complete painting, contain |

These settings use the current temporary 1200 x 800 study image. In particular,
Hilma's original painted head is very small: centering it cannot restore missing
source detail. No face was replaced, reconstructed, or generated. Recheck the
crop table and the visual regression regions if a later master changes the
composition, not just the image resolution.

## Validation and release

`node --test tests/thumbnails.test.mjs` runs thirteen focused regression tests:
all twenty entries, all eleven portrait regions, responsive centering, full head
bounds at five card sizes, edge clamping, full-image reference framing, invalid
geometry, hotspot independence, resize handling, and retained section links.

The patched current renderer was also checked in an isolated, inline browser
preview at 1360, 768, 390, and 320 pixel viewport widths, with the unchanged card
layout and study asset. These checks cover twenty cards, head centering, overflow,
card navigation, the original detail target, zoom/fit, and expanded view. Local
browser navigation is restricted in this build environment; this is not a live
Firebase test or a claim that the entire latest site has been deployed.

This update changes only the renderer, adds its focused tests, and records the
crop settings. The latest TAD quote/history, gods section, source text, shared
branding, separate Saige tab, and Firebase deployment configuration are preserved.
Run the existing `scripts/redeploy.sh` in the owner's authorized Cloud Shell; it
runs the full current repository test suite and verifies the deployed runtime
files. A GitHub commit alone is not a live release.
