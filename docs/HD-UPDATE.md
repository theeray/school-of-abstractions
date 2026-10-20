# High-resolution artwork and reference update

This update keeps the painting-first home, separate Saige destination, existing hotspot coordinates, original material, and the current TAD/Sundahl and gods sections. A small media layer, loaded by the shared branding script, adds the new assets and presentation after the original renderer is ready. It does not regenerate the artwork or replace any faces.

## Included changes

- A 9,000 x 6,000 saved studio master replaces the 1,200 x 800 study for viewing. The exact source is `School_of_Abstractions_9000x6000_Euclid_Donor_Repair.png`, recovered from the artist's Library. Web-only JPEG encoding, downsampling, tiles and crops were performed; no generative modification.
- A 2,250-pixel overview loads first, then visible tiles from 4,500- and 9,000-pixel layers. Retain the original aspect ratio and hotspot targets. Full-resolution source is also linked from About this image.
- Nineteen card crops derive from the same master; the twentieth remains a complete-image reference. Face-centered framing is retained.
- Raphael's reference banner becomes **The Original Dialogue**, with the actual 6,045 x 4,671 School of Athens reproduction and an external numbered identification guide. Proposed alternatives are acknowledged.
- William Blake's **The Ancient of Days** (1794), the color-printed and hand-colored frontispiece to Europe a Prophecy, is linked to the Euclid compass pose. It is not called an oil painting or confused with Blake's Newton.
- Michelangelo's **Pietà** (1498–1499), a marble sculpture, is linked to Krasner's seated, lap-spanning arrangement. Preserve its religious subject while clearly identifying Eric's reuse as compositional rather than literal.
- Steve's supplied `20BSU_TAD_Steve_Sundahl.jpg` accompanies his exact existing quotation in a responsive speech bubble. The actual full-color TAD logo, extracted from page 2 of the supplied 2024 brand guidelines, sits above the section.
- The supplied `Faceted portrait in De Stijl(1).png` becomes the small shared header image and favicon, with ICO and Apple touch icon variants. Saige's separate collaborator portrait is untouched.
- Only the selected "Making room changes the argument" moment is replaced. The new entry, **Changing one statue changed the question**, explains the Athena-to-Dionysus revision. It is explicitly a new summary of a documented change, not a recovered exact prompt. Women-and-recognition material is not removed.

## Install media once, then redeploy

The large artwork derivatives and supplied brand photographs are delivered separately as `School-of-Abstractions-HD-Update.zip` (about 43 MiB). They are not embedded as base64 in Git or fetched from temporary chat URLs. Keep the ZIP in the artist's Library and install it in each fresh checkout; subsequent pulls in that checkout retain the files. The package contains only files under `public/art/hd-v1/` and a pinned checksummed manifest. The original Library artwork is unchanged.

Upload the ZIP through the already-authorized Cloud Shell's file-upload control, into the home directory. In the known working checkout:

```bash
cd ~/saige-publish.cpSRbp &&
git pull --ff-only &&
python3 scripts/install-hd-media.py "$HOME/School-of-Abstractions-HD-Update.zip" &&
npm exec --yes --package=firebase-tools@latest -- bash scripts/redeploy-hd.sh
```

For another checkout use its actual path. No new Firebase account, project, billing link, paid API, microphone or audio feature is required. The script pins the existing project `project-6c1d195b-969f-4318-8f2` and Hosting site `school-of-abstractions`.

Before publishing, the script downloads the three credited historical JPEGs from their Wikimedia originals, validates their dimensions, and records source credits and SHA256 checksums. It stops instead of publishing if any required media is missing or invalid. It then runs the full current Node suite and compares every deployed public file with its local bytes. A code commit or package creation is not a live deployment. A successful release ends with **High-resolution release verified** and the Firebase URL.

## Historical image records

- Raphael, School of Athens: https://commons.wikimedia.org/wiki/File:Raffael_058.jpg ; numbered guide: https://commons.wikimedia.org/wiki/File:Raffaello_Scuola_di_Atene_numbered.svg
- Blake, The Ancient of Days, copy D: https://www.britishmuseum.org/collection/object/P_1859-0625-72 ; reproduction metadata is linked in the interface and download script.
- Michelangelo, Pietà: https://www.basilicasanpietro.va/en/san-pietro/the-pieta-of-saint-peter-s . Photograph by Stanislav Traykov, CC BY 2.5, edited Commons version; attribution, license and source-version changes are displayed beside it.

The browser prefers installed local historical images, with one attempt at the credited remote original and then a visible source link on failure. It does not substitute generated reconstructions.

## Verification performed in this session

- 16 focused Node tests passed: tile selection/coverage, high-DPI bounds, reference definitions, targets and credits, favicon scope, exact quote-node preservation, labeled summary, and bootstrap behavior.
- 12 Python tests passed: manifest validation, safe extraction, checksum/missing-file failures, JPEG header parsing, expected dimensions, and fixed reference-source metadata.
- The actual master package's 101 media files were installed and checked against the pinned manifest.
- Isolated Chromium checks passed at 1440, 768, 390 and 320 pixels, including high-DPI phones. Tests used the local exhibition snapshot and a fixture of the current quote block; this is not a claim that the full current remote site was tested end to end. Original pages/data/CSS in the current branch are retained rather than overwritten.
- Confirmed 20 cards, six reference cards after the two additions, full quote text preservation, updated icon scope, responsive layout without horizontal overflow, detail tiles, zoom/fit and expanded view. External-image failure links were exercised.
- Network access for downloading original reference JPEG bytes was unavailable in the build session. Their collection records and URLs were verified through web research; actual JPEG download/dimension verification is a deployment preflight, not claimed complete here.

No authenticated Firebase tool is exposed in this conversation despite the desktop plugin being installed. No live release is claimed by this commit.
