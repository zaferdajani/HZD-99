# No-progress stop attempt — blocked, no signal sent

The producer considered a bounded external stop after the campaign stayed at
CV1B x896/y156 with the same bat/health for more than seven minutes. The helper
`stop-stalled-campaign.cjs` refused to act without checking the exact owned
process, checkout and runner parent.

Its first execution stopped at the ownership check:

```text
Error: EACCES: permission denied, readlink '/proc/51711/cwd'
    at Object.<anonymous> (.../postflight/stop-stalled-campaign.cjs:13:17)
code: 'EACCES'; syscall: 'readlink'; path: '/proc/51711/cwd'
```

Exit1 occurred BEFORE creating `campaign-interruption.json` or sending ANY
signal. No retry, alternate signal route, ownership-check removal or permission
escalation was attempted. The original continuous test remains running under
its original55-minute internal deadline and60-minute runner budget. This note
is a process-control limitation, NOT a campaign outcome or game defect. The
closed collector record must determine the eventual result.

The failed attempt's source is retained as `stop-stalled-campaign.cjs.txt`, an
EVIDENCE-ONLY archive, not a runnable pipeline stage. Do not execute it against
later processes or use a historical stalled trace as a reason to stop a new run.
