# Merge status — 2026-10-06

The painting-first exhibition and separate Saige destination are implemented. The entry design follows the original exported exhibition structure and opening text, not the earlier Saige-first hero. The unavailable original source was reconstructed rather than misrepresented as recovered verbatim.

Included: twenty bounded detail targets; six working tours; eight selected conversation moments; exact studio-process statement and estimate; source/reference gallery; pan, pinch, keyboard and expanded image controls; Saige's approved portrait and exact welcome; restrained `ai` accent including dynamic text; contextual written-note hand-offs.

The temporary study image is 1200 pixels wide. It is deliberately not described as the approved Topaz master. Fine detail remains limited by the study image. External source-image loading has a credited-link fallback.

Saige's nineteen-topic conversation is deterministic and local. No live generative service, microphone, audio, paid model call, private-data connector, or analytics was enabled.

## Verification

The merge was tested locally through Node regression tests and browser rendering/interaction checks on desktop and phone layouts. Browser navigation to local URLs was prohibited in this runtime, so browser checks used the same local files in an isolated inline document. Static routing/link targets and HTTP responses were checked independently with the local server. External reference-image failures were deliberately exercised. No live model call was used in testing.

## Publication

The owner had already successfully deployed the preceding version to the correct Firebase site. This merge is not a confirmed release until the signed-in deployment helper succeeds and verifies both pages and the asset bytes. No Firebase authentication is present in the build session. `scripts/redeploy.sh` pins the already-created project and site; it will not create projects or touch billing. Record the actual redeploy result after it runs in the authenticated Cloud Shell.

Remaining editorial work: approved Topaz web master, final hotspot calibration against it, and Steve Sundahl's supplied statement. AI conversation and audio are separate future features.
