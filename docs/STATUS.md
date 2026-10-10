# Project status — 2026-10-10

The painting-first exhibition and separate Saige destination are implemented. The entry design follows the original exported exhibition structure and opening text, not the earlier Saige-first hero. The unavailable original source was reconstructed rather than misrepresented as recovered verbatim.

Included: twenty bounded detail targets; six working tours; eight selected conversation moments; exact studio-process statement and estimate; source/reference gallery; pan, pinch, keyboard and expanded image controls; Saige's approved portrait and exact welcome; restrained `ai` accent including dynamic text; contextual written-note hand-offs.

The temporary study image is 1200 pixels wide. It is deliberately not described as the approved Topaz master. Fine detail remains limited by the study image. External source-image loading has a credited-link fallback.

Saige's nineteen-topic conversation is deterministic and local. No live generative service, microphone, audio, paid model call, private-data connector, or analytics was enabled.

## Verification

The merge was tested locally through Node regression tests and browser rendering/interaction checks on desktop and phone layouts. Browser navigation to local URLs was prohibited in this runtime, so browser checks used the same local files in an isolated inline document. Static routing/link targets and HTTP responses were checked independently with the local server. External reference-image failures were deliberately exercised. No live model call was used in testing.

## Publication

The owner had already successfully deployed the preceding version to the correct Firebase site. This merge is not a confirmed release until the signed-in deployment helper succeeds and verifies both pages and the asset bytes. No Firebase authentication is present in the build session. `scripts/redeploy.sh` pins the already-created project and site; it will not create projects or touch billing. Record the actual redeploy result after it runs in the authenticated Cloud Shell.

## TAD logo history update

The TAD Logo navigation section now preserves Steve Sundahl's supplied statement verbatim and includes four locally hosted historical reproductions: the 1902 Secession catalogue monograms, Alfred Roller's first Ver Sacrum cover (1898), Theo van Doesburg's Stained-Glass Composition III (1917), and Kandinsky's Yellow–Red–Blue (1925). Captions identify the artwork, collection or reproduction source, and historical context. The monogram sheet is explicitly identified as catalogue evidence, rather than a Ver Sacrum page. The tree comparison and De Stijl affinities are identified as exhibition interpretations, rather than design sources named by Sundahl.

The TAD detail, thematic route, reference gallery, and Saige's local TAD response now agree with the supplied account. Other tours, hotspots, dialogue excerpts, and Saige's welcome remain intact.

Validation: all 38 Node checks pass; the static build and git diff checks pass. The four downloaded reproductions were visually inspected. This session's cloud browser cannot reach the local preview server, so a new desktop/phone browser review could not be completed here. The prior merge's browser checks described above do not establish browser validation of this new section.

Publication attempt on 2026-10-10: the existing Firebase helper stopped before deployment. The CLI explicitly reported `Failed to authenticate, have you run firebase login?`. Cloud Shell is also unavailable in this session's connected browser. No alternate hosting was used. Deploy the tested source from the owner's authenticated checkout using `bash scripts/redeploy.sh`; this verifies both pages and all 17 runtime assets, including the new historical images, before reporting success.

Remaining editorial work: approved Topaz web master and final hotspot calibration against it. AI conversation and audio are separate future features.
