#!/bin/bash
# Lumio deploy script: merges dev into main and pushes
set -e
echo "🔀 Merging dev → main..."
git checkout main
git merge dev --no-ff -m "chore: merge dev → main for production deploy"
git push origin main
git checkout dev
echo "✅ Deployed to production. Back on dev branch."
