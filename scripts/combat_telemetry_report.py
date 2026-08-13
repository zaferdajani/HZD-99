#!/usr/bin/env python3
"""Read CLAWBYTE's combat telemetry and say what it means.

A table of numbers is not a finding. The point of this script is the diagnostic
rules in docs/combat/TELEMETRY_SPEC.md section 3 — above all the one that
separates the two failures that look identical from the outside:

    high death share + a FLAT curve across attempts  ->  unreadable, not hard
    high death share + a FALLING curve               ->  working as designed

Those two produce the same complaint from a player ("this boss is unfair") and
want opposite fixes. Reaching for damage numbers when the curve is flat makes a
fight that is invisible AND easy, which is the worst version of it.

Input is the JSON exported from the game (localStorage key `cb_tel`):

    python3 scripts/combat_telemetry_report.py telemetry.json
    python3 scripts/combat_telemetry_report.py -            # read stdin
"""
import json
import sys
from collections import defaultdict

# her cycle: 150 ms active + 230 ms recovery. Kept here as one constant because
# every "how many hits fit" answer in the combat docs is derived from it.
PLAYER_CYCLE_MS = 380
REACTION_FLOOR_MS = 250


def load(path):
    raw = sys.stdin.read() if path == "-" else open(path, encoding="utf-8").read()
    data = json.loads(raw)
    return data if isinstance(data, list) else data.get("attempts", [])


def trend(values):
    """Is this getting better? Least-squares slope, normalised by the mean.

    Returns a number where clearly negative means 'players are improving'. The
    whole flat-vs-falling rule rests on this, so it is deliberately simple and
    reported alongside the raw series rather than on its own.
    """
    n = len(values)
    if n < 3:
        return None
    mean_x = (n - 1) / 2
    mean_y = sum(values) / n
    num = sum((i - mean_x) * (v - mean_y) for i, v in enumerate(values))
    den = sum((i - mean_x) ** 2 for i in range(n))
    if den == 0 or mean_y == 0:
        return None
    return (num / den) / mean_y


def report(attempts):
    by_boss = defaultdict(list)
    for a in attempts:
        by_boss[a.get("boss", "?")].append(a)

    findings = []
    for boss, runs in sorted(by_boss.items()):
        runs.sort(key=lambda r: r.get("attempt", 0))
        deaths = [r for r in runs if r.get("outcome") == "death"]
        share = len(deaths) / len(runs) if runs else 0
        print(f"\n=== {boss}   {len(runs)} attempts, {len(deaths)} deaths "
              f"({share:.0%})")

        # --- is it getting better? -------------------------------------------
        hp = [r.get("hp_at_death", 0) for r in deaths]
        slope = trend(hp)
        if hp:
            print(f"  cores left at death, by attempt: {hp}")
        if slope is not None:
            direction = ("FLAT" if abs(slope) < 0.05
                         else "improving" if slope > 0 else "worsening")
            print(f"  learning curve: {direction} (slope {slope:+.2f})")
            if share > 0.5 and direction == "FLAT":
                findings.append(
                    f"{boss}: {share:.0%} deaths and a FLAT curve — this reads as "
                    f"UNREADABLE, not hard. Fix the telegraph (longer, or a bigger "
                    f"silhouette change). Do not touch damage.")

        # --- what is actually killing people ---------------------------------
        dmg = defaultdict(int)
        for r in runs:
            for k, v in (r.get("dmg_by_id") or {}).items():
                dmg[k] += v
        total = sum(dmg.values())
        if total:
            print("  damage taken by move:")
            for k, v in sorted(dmg.items(), key=lambda kv: -kv[1]):
                frac = v / total
                flag = "   <-- over 40%: telegraph problem" if frac > 0.40 else ""
                print(f"    {k:<22} {v:>4}  {frac:>5.0%}{flag}")
                if frac > 0.40:
                    findings.append(
                        f"{boss}: {k} is {frac:.0%} of all damage taken — above the "
                        f"40% heuristic, which is a telegraph problem rather than a "
                        f"tuning one.")

        # --- greed -----------------------------------------------------------
        greed = defaultdict(lambda: [0, 0])
        for r in runs:
            for k, g in (r.get("greed") or {}).items():
                greed[k][0] += g.get("attempted", 0)
                greed[k][1] += g.get("available", 0)
        if greed:
            print("  greed (hits attempted / hits safely available):")
            for k, (att, avail) in sorted(greed.items()):
                if not avail:
                    continue
                ratio = att / avail
                note = ("   too safe: nobody is being tempted" if ratio < 1.15 else
                        "   punished for correct reads" if ratio > 2.75 else "")
                print(f"    {k:<22} {ratio:>5.2f}{note}")
                if ratio < 1.15:
                    findings.append(f"{boss}: {k} greed {ratio:.2f} — the window is "
                                    f"too safe; shorten the recovery or move the "
                                    f"punish position into the next attack's path.")
                elif ratio > 2.75:
                    findings.append(f"{boss}: {k} greed {ratio:.2f} — players are "
                                    f"being punished for correct reads; lengthen the "
                                    f"recovery.")

        # --- is there anywhere to engage? ------------------------------------
        for r in runs[:1]:
            for i, ms in enumerate(r.get("retreat_ms") or []):
                span = (r.get("phase_ms") or [0])[i] if i < len(r.get("phase_ms") or []) else 0
                if span and ms / span > 0.6:
                    findings.append(
                        f"{boss} phase {i}: {ms / span:.0%} of it spent out of reach "
                        f"— there is no viable engagement window. Add one.")

    print("\n" + "=" * 68)
    if findings:
        print("FINDINGS\n")
        for f in findings:
            print("  - " + f)
    else:
        print("No rule fired. Either it is well tuned, or there is not enough data "
              "yet — check the attempt counts above before believing it.")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    attempts = load(sys.argv[1])
    if not attempts:
        print("no attempts in that file")
        sys.exit(1)
    report(attempts)


if __name__ == "__main__":
    main()
