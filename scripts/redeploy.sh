#!/usr/bin/env bash
# Existing project/site only. Never create resources or touch billing in a redeployment.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
PROJECT='project-6c1d195b-969f-4318-8f2'
SITE='school-of-abstractions'
URL="https://${SITE}.web.app"
if command -v firebase >/dev/null; then FB=(firebase); else FB=(npx --yes firebase-tools@latest); fi
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
trap 'echo "Stopped: the new release has not been fully verified. No alternate host was used." >&2' ERR
npm test
"${FB[@]}" hosting:sites:list --project "$PROJECT" --json --non-interactive > "$TMP/sites.json"
node - "$TMP/sites.json" <<'JS'
const fs=require('node:fs');const d=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));if(d.status!=='success'||!Array.isArray(d.result?.sites)||!d.result.sites.some(s=>s.name==='projects/project-6c1d195b-969f-4318-8f2/sites/school-of-abstractions'||s.name?.endsWith('/sites/school-of-abstractions')))throw new Error('The expected Hosting site could not be verified in the selected project. No deployment attempted.');
JS
# target:apply writes a local mapping; it neither creates nor changes cloud resources.
"${FB[@]}" target:apply hosting "$SITE" "$SITE" --project "$PROJECT" --non-interactive
FIREBASE_HOSTING_UPLOAD_CONCURRENCY=1 "${FB[@]}" deploy --only "hosting:${SITE}" --project "$PROJECT" --non-interactive
# Verify both pages and the actual local JS/CSS/image bytes, not just the deploy message.
for path in index.html saige.html exhibition-data.js exhibition.js branding.js styles.css saige-page.js saige/content.js saige/core.js saige/components.js saige/components.css saige/avatar.webp art/study.avif art/tad-history/secession-monograms.jpg art/tad-history/ver-sacrum-tree.jpg art/tad-history/theo-glass-iii.jpg art/tad-history/kandinsky-yellow-red-blue.jpg; do
 verified=no
 for attempt in 1 2 3 4; do
  if curl --fail --silent --show-error --max-time 35 "${URL}/${path}?verify=$(date +%s)-${attempt}" -o "$TMP/live" && cmp -s "public/$path" "$TMP/live"; then verified=yes; break; fi
  [[ "$attempt" == 4 ]] || sleep 2
 done
 if [[ "$verified" != yes ]]; then echo "Deployment command succeeded, but ${path} could not be verified. Do not announce a fully verified release." >&2; exit 1; fi
done
printf '\nPublished and verified: %s\nSaige section: %s/saige.html\n' "$URL" "$URL"
