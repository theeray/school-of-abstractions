#!/usr/bin/env bash
# Publishes only the approved Firebase Hosting site. Run in your own signed-in shell.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
SITE_ID="school-of-abstractions"
PROJECT_ID="${FIREBASE_PROJECT_ID:-school-of-abstractions}"
URL="https://${SITE_ID}.web.app"
[[ "$PROJECT_ID" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]] || { echo 'Invalid Firebase project ID.' >&2; exit 1; }
command -v node >/dev/null || { echo 'Node.js 22 or newer is required.' >&2; exit 1; }
node -e 'if(Number(process.versions.node.split(".")[0]) < 22) { console.error("Node.js 22 or newer is required."); process.exit(1); }'
command -v curl >/dev/null || { echo 'curl is required to verify the published page.' >&2; exit 1; }
if command -v firebase >/dev/null; then
  FIREBASE=(firebase)
else
  FIREBASE=(npx --yes firebase-tools@latest)
fi
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
trap 'echo "Stopped: publishing and verification have not both succeeded. No alternate host was used." >&2' ERR

# Do not provision or publish anything when the checked-in site fails its tests.
npm test
printf '\nChecking Firebase access for project %s.\n' "$PROJECT_ID"
if ! "${FIREBASE[@]}" projects:list --json --non-interactive > "$TMP/projects.json"; then
  echo 'Firebase access could not be verified. In your own Google Cloud Shell, authorize Google access and retry. Do not paste credentials into chat.' >&2
  exit 1
fi
HAS_PROJECT="$(node - "$TMP/projects.json" "$PROJECT_ID" <<'JS'
const fs = require('node:fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (data.status !== 'success' || !Array.isArray(data.result)) throw new Error('Unrecognized Firebase project-list response; stopping.');
console.log(data.result.some(p => p.projectId === process.argv[3]) ? 'yes' : 'no');
JS
)"
if [[ "$HAS_PROJECT" == no ]]; then
  echo "Creating project ${PROJECT_ID}; no billing account will be linked by this script."
  "${FIREBASE[@]}" projects:create "$PROJECT_ID" --display-name 'The School of Abstractions' --non-interactive
fi

# Failed reads are errors, never evidence that the site is absent or available.
"${FIREBASE[@]}" hosting:sites:list --project "$PROJECT_ID" --json --non-interactive > "$TMP/sites.json"
HAS_SITE="$(node - "$TMP/sites.json" "$SITE_ID" <<'JS'
const fs = require('node:fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (data.status !== 'success' || !Array.isArray(data.result?.sites)) throw new Error('Unrecognized Firebase site-list response; stopping.');
console.log(data.result.sites.some(s => s.name?.split('/').pop() === process.argv[3]) ? 'yes' : 'no');
JS
)"
if [[ "$HAS_SITE" == no ]]; then
  "${FIREBASE[@]}" hosting:sites:create "$SITE_ID" --project "$PROJECT_ID" --non-interactive
fi
"${FIREBASE[@]}" target:apply hosting "$SITE_ID" "$SITE_ID" --project "$PROJECT_ID" --non-interactive
FIREBASE_HOSTING_UPLOAD_CONCURRENCY=1 "${FIREBASE[@]}" deploy --only "hosting:${SITE_ID}" --project "$PROJECT_ID" --non-interactive

# Verify the live HTML against the exact local page; never announce success on a placeholder.
VERIFIED=no
for attempt in 1 2 3 4; do
  if curl --fail --silent --show-error --max-time 30 "${URL}/?verify=$(date +%s)-${attempt}" -o "$TMP/live.html" && cmp -s public/index.html "$TMP/live.html"; then
    VERIFIED=yes
    break
  fi
  [[ "$attempt" == 4 ]] || sleep 3
done
if [[ "$VERIFIED" != yes ]]; then
  echo "Firebase's deploy command succeeded, but the exact live page could not be verified. Check ${URL} before announcing it as live." >&2
  exit 1
fi
printf '\nPublished and verified: %s\n' "$URL"
