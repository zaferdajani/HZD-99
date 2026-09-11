# Reconciliation verification corrections

The first candidate CI run 34581220625 failed two checks and did not push
the candidate. The full failure evidence remains in artifact 10191751638.

1. platform: www was not assembled. The candidate workflow now runs the
   project's normal pack-www tool before the test; no assertion is removed.
2. beacon: the old crop ignored 1.9 world zoom and sampled different rendered
   scenes 600 ms apart. The corrected test waits for full-quality assets,
   computes the projected resting-plate torso, freezes time and simulation,
   and pairs renders that differ only in marker availability. A repeated
   control checks scene stability. An injected additive full-body wash must
   fail, proving the measurement detects the reported defect. Original
   brightness <=8 and retained contrast >=80% thresholds are unchanged.

Local paired result: brightness delta 0, retained contrast 100%, repeated
control drift 0; deliberately broken glow measured mean250.54/sd1.66 and
was rejected. The existing mobile backbuffer test is retained. This changes
test isolation, not any game colour/brightness setting or approved artwork.
