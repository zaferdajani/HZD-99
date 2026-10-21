# Postflight diagnostics — 2026-10-21

These diagnostics were run **after** `automated/results.json` closed. They do not edit, replace or reclassify that original execution.

## Font readiness diagnosis

The original wrapper set only `FONTCONFIG_PATH=/tmp/clawbyte-21-browser`. That directory contains a package-supplied `fonts.conf` whose font paths point at unrelated deployment directories. Browser canvas evidence:

- before explicit review config: `measureText('hello world').width === 0`;
- after `FONTCONFIG_FILE=<run>/setup/fonts.conf`: width `90`.

The wrapper was corrected to resolve its checked-in `fonts.conf` relative to `__dirname`.

## Corrected short rerun

Command:

`CHROMIUM_PATH=$PWD/docs/studio/runs/2026-10-21/setup/browser-wrapper.cjs node tests/run.cjs comic-rewards textreveal foescale forge`

Exit: `0`; four harnesses ran.

| Harness | Result | Material evidence |
|---|---|---|
| comic-rewards | Pass | Live content update, phone zoom, reduced motion, missing-art retry and offline fallback. |
| textreveal | Pass | 2 pages; 3–4 lines/page; widest 543≤548; distinct reveal/advance; CJK 544≤548; RTL Arabic; overlay queue; pause persistence; held-still reader. |
| foescale | Pass | 71px idle hero; 160 full wingbeat samples; band 0.507–0.958; 0 bad eye anchors. This does not close nondeterministic hero-frame or historical 73px bank scope. |
| forge | Pass | Gate, isolated save, live new/main room edits, painting, JSON ops, no API credential/request and room-brief export. |

## Corrected opening-order rerun

Command:

`CHROMIUM_PATH=$PWD/docs/studio/runs/2026-10-21/setup/browser-wrapper.cjs node tests/run.cjs opening-order`

Exit: `1`; inner duration `482.6s`.

- Desktop steps: move, out, jump, gate, booth, note, drawer, repair, pod, pack; ended A0B before purchase/heal/monument/Servo.
- Phone viewport with keyboard input: move, out, jump, gate, booth, note, drawer, repair, pod, pack, heal, attack, Burst, monument, go; ended A0 before Servo.
- Reached order/content assertions passed; no page errors.
- This remains staged keyboard evidence and its coil hand-in is injected. It is not physical-touch or real coil-acquisition proof.

## Raw-log retention

The frozen result contains 198 recorded log snapshots. Every snapshot validates against its own hash. Current raw mismatches at collector close: `servo-presence.log`, `mapexits.log`, `kingdom1.log`. No file was repaired or re-hashed.
