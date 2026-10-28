# Automated collector transport/interference note

The workspace execution transport closed while the full collector was running,
but its process continued. Because it was no longer visible, later isolated work
rebuilt the served pages while the original collector's tail was still active.
The original collector therefore finished with a blocked end identity and failed
overall log integrity and must not be treated as a certificate.

- Final raw summary: 174 pass, 26 fail, one blocked final server identity.
- Ten substantive failures occurred before `campaign-ch1`.
- `campaign-ch1` produced `timeout`, `certified:false`, wall 40:04, zero deaths,
  zero page errors. It completed Ratchet repair/story, pod, and Volt Pack purchase,
  then repeatedly held `F` without completing the heal lesson.
- Fifteen later tail failures completed in about 0.45 seconds each because the
  runner correctly refused the changed served build; they are infrastructure
  refusals, not product verdicts.
- All 18 affected non-campaign tail checks were rerun in `reruns/tail` on a new
  pinned identity and passed with an integrity-valid manifest.
- `campaign-contract` was rerun in `reruns/quick` and passed.
- `automated/log-integrity.json` is false because one captured log changed after
  capture, so the aggregate remains non-certifying.

Use the individual isolated rerun directories for certifying rerun claims. Treat
the clean campaign's held-heal loop as a preserved observation, not a green or
integrity-valid campaign certificate.

