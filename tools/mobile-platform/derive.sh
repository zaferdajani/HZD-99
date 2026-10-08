#!/bin/sh
# Re-derive js/mobile-platform.js from the TypeScript masters beside this file.
#
# RULE ZERO (CLAUDE.md): the master is authored at full quality and the shipped
# tier is DERIVED. The master here is TypeScript; the tier is one IIFE in js/.
#
# The toolchain is deliberately NOT in package.json. Nothing a player loads and
# nothing in tests/ needs TypeScript or esbuild — only this script does, and it
# runs by hand when the master changes. Installing them into the project would
# put a compiler in the dependency tree of a game that ships vanilla ES6.
#
#   sh tools/mobile-platform/derive.sh [workdir]
#
# It installs the toolchain into a throwaway directory (default: a temp dir),
# type-checks at the strictest setting, and only then overwrites the shipped
# file. A type error leaves js/mobile-platform.js untouched.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)
WORK=${1:-$(mktemp -d)}

mkdir -p "$WORK"
cd "$WORK"
[ -f package.json ] || npm init -y >/dev/null 2>&1
npm install --no-audit --no-fund typescript esbuild >/dev/null

rm -rf src && cp -r "$HERE/src" src
cp "$HERE/tsconfig.json" tsconfig.json

echo "type-checking (strict + isolatedModules + verbatimModuleSyntax + ...)"
./node_modules/.bin/tsc -p tsconfig.json

echo "bundling"
./node_modules/.bin/esbuild src/index.ts \
  --bundle --format=iife --global-name=MobilePlatform --target=es2020 \
  --banner:js="$(cat "$HERE/banner.txt")" \
  --outfile="$ROOT/js/mobile-platform.js"

node --check "$ROOT/js/mobile-platform.js"
echo "js/mobile-platform.js re-derived; now: node build.cjs && node tests/run.cjs mobile-platform"
