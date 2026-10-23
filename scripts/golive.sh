#!/bin/bash
# Production deploy: build on the Mac, ship the standalone output to the VPS.
#
# The VPS no longer builds. On 23 Oct 2026 a build there left 81 MB of RAM free
# and pushed other apps into swap, and the server is shared (cleannewmalden,
# Spoiler Room). Building here also means a failed build never touches the
# live site.
#
#   npm run golive              merge dev -> main, build, ship, restart, check
#   npm run golive -- --dry-run build and check locally only; no merge, no upload
#
# The old server-side build is kept as `npm run golive:vps-build`.
set -euo pipefail

HOST=lumio@46.224.227.190
SSH_OPTS="-i $HOME/.ssh/lumio_vps -o BatchMode=yes"
LIVE=/home/lumio/apps/lumio
STAGE=/home/lumio/apps/lumio-release      # uploaded here first, then swapped in
SMOKE_PORT=3090                           # free port for the pre-swap check
SITE=https://lumiosports.com
NODE20=/opt/homebrew/opt/node@20/bin      # same Node as the VPS (20.20.2)
BUILD_DIR="$HOME/.lumio-build"            # clean clone: no .env.local, no local drift

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

[ -x "$NODE20/node" ] || { echo "❌ Node 20 not found. Run: brew install node@20"; exit 1; }
export PATH="$NODE20:$PATH"
echo "Using Node $(node -v)"

REPO_DIR=$(git rev-parse --show-toplevel)
REPO_URL=$(git -C "$REPO_DIR" remote get-url origin)

# 1. Merge dev into main and push, then go straight back to dev.
if [ $DRY_RUN -eq 0 ]; then
  echo "🔀 Merging dev → main..."
  git -C "$REPO_DIR" checkout main
  git -C "$REPO_DIR" merge dev
  git -C "$REPO_DIR" push origin main
  git -C "$REPO_DIR" checkout dev
fi

# 2. Clean build of exactly what's on origin/main, with the server's env.
#    NEXT_PUBLIC_* values are baked in at build time, so they must be the
#    production ones. The env file is removed as soon as the script ends.
if [ ! -d "$BUILD_DIR/.git" ]; then
  echo "🆕 Creating build clone at $BUILD_DIR (one-time)..."
  git clone "$REPO_URL" "$BUILD_DIR"
fi
cd "$BUILD_DIR"
trap 'rm -f "$BUILD_DIR/.env.production"' EXIT
git fetch origin main
git reset --hard origin/main
echo "Building $(git log --oneline -1)"
(umask 077; ssh $SSH_OPTS "$HOST" "cat $LIVE/.env.production" > .env.production)

echo "📦 Installing deps (npm ci)..."
npm ci
echo "🏗️  Building..."
npm run build

SA=.next/standalone
echo "📂 Copying static + public into standalone..."
rm -rf "$SA/.next/static" "$SA/public"
cp -r .next/static "$SA/.next/static"
cp -r public "$SA/public"

# 3. Swap sharp's macOS binaries for the Linux x64 (glibc) ones at the same version.
if [ -d "$SA/node_modules/@img" ]; then
  SHARP_VER=$(node -p 'require("./node_modules/sharp/package.json").version')
  VIPS_VER=$(node -p 'require("./node_modules/sharp/package.json").optionalDependencies["@img/sharp-libvips-linux-x64"]')
  echo "🔧 Replacing sharp binaries with linux-x64 (sharp $SHARP_VER, libvips $VIPS_VER)..."
  TMP=$(mktemp -d)
  (cd "$TMP" && npm pack --silent "@img/sharp-linux-x64@$SHARP_VER" "@img/sharp-libvips-linux-x64@$VIPS_VER" >/dev/null)
  rm -rf "$SA"/node_modules/@img/sharp-darwin-* "$SA"/node_modules/@img/sharp-libvips-darwin-*
  mkdir -p "$SA/node_modules/@img/sharp-linux-x64" "$SA/node_modules/@img/sharp-libvips-linux-x64"
  tar -xzf "$TMP/img-sharp-linux-x64-$SHARP_VER.tgz" -C "$SA/node_modules/@img/sharp-linux-x64" --strip-components=1
  tar -xzf "$TMP/img-sharp-libvips-linux-x64-$VIPS_VER.tgz" -C "$SA/node_modules/@img/sharp-libvips-linux-x64" --strip-components=1
  rm -rf "$TMP"
fi

# Any other native module built for macOS would crash on the server, so refuse to ship it.
BAD=$(find "$SA" -name "*.node" -not -path "*linux-x64*" || true)
if [ -n "$BAD" ]; then
  echo "❌ Native modules not built for linux-x64:"; echo "$BAD"; exit 1
fi
rm -f "$SA/.env.production"   # the server adds its own copy

if [ $DRY_RUN -eq 1 ]; then
  echo "✅ Dry run complete: built and checked $BUILD_DIR/$SA. Nothing uploaded."
  exit 0
fi

# 4. Upload to staging, start it on a spare port and check it before touching live.
echo "⬆️  Uploading to $STAGE..."
rsync -az --delete -e "ssh $SSH_OPTS" "$SA/" "$HOST:$STAGE/"
IMG=$(cd public && ls *.png | head -1)
echo "🧪 Smoke-testing the new build on port $SMOKE_PORT..."
ssh $SSH_OPTS "$HOST" "set -e
  cp $LIVE/.env.production $STAGE/.env.production
  cd $STAGE
  PORT=$SMOKE_PORT HOSTNAME=127.0.0.1 node server.js > /tmp/lumio-smoke.log 2>&1 &
  PID=\$!
  trap 'kill \$PID 2>/dev/null || true' EXIT
  for i in \$(seq 1 30); do curl -s -o /dev/null http://127.0.0.1:$SMOKE_PORT/ && break; sleep 1; done
  PAGE=\$(curl -s -o /dev/null -w '%{http_code}' -L http://127.0.0.1:$SMOKE_PORT/)
  IMGTYPE=\$(curl -s -o /dev/null -w '%{http_code} %{content_type}' 'http://127.0.0.1:$SMOKE_PORT/_next/image?url=%2F$IMG&w=64&q=75')
  echo \"  page: \$PAGE   image: \$IMGTYPE\"
  [ \"\$PAGE\" = 200 ] || { echo '❌ Page check failed'; tail -20 /tmp/lumio-smoke.log; exit 1; }
  case \"\$IMGTYPE\" in 200\ image/*) ;; *) echo '❌ Image check failed (sharp?)'; tail -20 /tmp/lumio-smoke.log; exit 1;; esac"

# 5. Swap into live and restart. Only reached if the smoke test passed.
echo "🔄 Swapping into live and restarting..."
ssh $SSH_OPTS "$HOST" "set -e
  rsync -a --delete $STAGE/ $LIVE/.next/standalone/
  git -C $LIVE pull --ff-only origin main
  pm2 restart lumio --update-env
  pm2 status"

# 6. Check the live site.
for i in $(seq 1 15); do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "$SITE" || true)
  [ "$CODE" = 200 ] && { echo "✅ Deploy complete: $SITE returned 200."; exit 0; }
  sleep 2
done
echo "❌ $SITE returned $CODE after the restart. Check: ssh lumio@46.224.227.190 'pm2 logs lumio --lines 50'"
exit 1
