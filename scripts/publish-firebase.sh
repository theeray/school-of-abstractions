#!/usr/bin/env bash
# Compatibility entry point: all deployments now use the already-created, verified project.
set -euo pipefail
exec bash "$(dirname "${BASH_SOURCE[0]}")/redeploy.sh"
