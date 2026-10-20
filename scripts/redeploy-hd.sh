#!/usr/bin/env bash
# Existing site only. No project creation, billing changes, AI, or audio activation.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
PROJECT='project-6c1d195b-969f-4318-8f2'
SITE='school-of-abstractions'
python3 scripts/install-hd-media.py --check
python3 scripts/fetch-reference-images.py
node scripts/verify-hd-media.mjs --local
npm test
if command -v firebase >/dev/null; then FB=(firebase); else FB=(npx --yes firebase-tools@latest); fi
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
trap 'echo "Stopped: the high-resolution release has not been fully verified. No alternate host was used." >&2' ERR
"${FB[@]}" hosting:sites:list --project "$PROJECT" --json --non-interactive > "$TMP/sites.json"
node - "$TMP/sites.json" <<'JS'
const fs=require('node:fs'),d=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
if(d.status!=='success'||!Array.isArray(d.result?.sites)||!d.result.sites.some(s=>s.name?.endsWith('/sites/school-of-abstractions')))throw new Error('The existing Hosting site could not be verified in the selected project.');
JS
"${FB[@]}" target:apply hosting "$SITE" "$SITE" --project "$PROJECT" --non-interactive
FIREBASE_HOSTING_UPLOAD_CONCURRENCY=1 "${FB[@]}" deploy --only "hosting:${SITE}" --project "$PROJECT" --non-interactive
node scripts/verify-hd-media.mjs
