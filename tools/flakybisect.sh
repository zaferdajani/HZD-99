#!/bin/bash
# RUN ONE HARNESS N TIMES AGAINST AN ARBITRARY COMMIT.
#
# Written the day a regression hid behind a flaky test. The full suite came back
# with seven failures; five turned out to predate the work entirely, one passed
# on re-run, and exactly one was real — and there was no way to tell those apart
# by reading the output, because a harness that fails two runs in three looks
# identical to a harness that fails because you broke it.
#
# So: build a commit in its own worktree, serve it, run the harness N times, and
# report the pass/fail split. A commit that is clean N times and a commit that
# fails some of the time are then different-looking things.
#
#   tools/flakybisect.sh <commit> <harness> [runs=3]
#
# Two details that cost a debugging cycle each:
#
#   The harnesses hardcode port 8220, so the worktree's server must own that
#   port — and it is stopped by PID, never by `pkill -f http-server`, because
#   that pattern also matches the shell running this script and kills it (exit
#   144, which is what sent me looking).
#
#   node_modules is symlinked rather than installed: playwright is 100MB+ and a
#   bisect makes a worktree per step.
set -u
REPO=$(cd "$(dirname "$0")/.." && pwd)
C=${1:?usage: flakybisect.sh <commit> <harness> [runs]}
T=${2:?usage: flakybisect.sh <commit> <harness> [runs]}
N=${3:-3}
WT=/tmp/flakybisect_$C

cleanup() {
  [ -n "${SRV:-}" ] && kill "$SRV" 2>/dev/null
  cd "$REPO" && git worktree remove --force "$WT" >/dev/null 2>&1
}
trap cleanup EXIT

rm -rf "$WT"
cd "$REPO" || exit 1
git worktree add -f "$WT" "$C" >/dev/null 2>&1 || { echo "$C: cannot check out"; exit 1; }
ln -sfn "$REPO/node_modules" "$WT/node_modules"
( cd "$WT" && node build.cjs ) >/dev/null 2>&1 || { echo "$C: build failed"; exit 1; }

# the previous server must be gone before this one can bind 8220
for pid in $(pgrep -f "http-server -p 8220" 2>/dev/null); do
  [ "$pid" = "$$" ] || kill "$pid" 2>/dev/null
done
sleep 1
( cd "$WT" && exec npx http-server -p 8220 -s ) >/dev/null 2>&1 &
SRV=$!
sleep 8
curl -s -o /dev/null http://127.0.0.1:8220/index.html || { echo "$C: server never came up"; exit 1; }

PASS=0; FAIL=0
for _ in $(seq "$N"); do
  if ( cd "$WT" && timeout 420 node "tests/$T.cjs" ) >/dev/null 2>&1; then
    PASS=$((PASS+1))
  else
    FAIL=$((FAIL+1))
  fi
done
echo "$C  $T:  pass=$PASS  fail=$FAIL  (of $N)"
