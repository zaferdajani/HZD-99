# Chapter One — what this run actually played

This is the observed route from one fresh browser, driven by keyboard input and a route-aware automated player. It reads game state to choose inputs; it does not inject inventory, flags, positions or damage. Difficulty is Kitten, selected through the real menu. This is reachability evidence, not a blind human discovery or difficulty review.

The chapter completed at 13:36 elapsed; `result.json` says 13:37 because it was written after the video closed. There was one death, five recoverable “STUCK” planner diagnostics and no JavaScript page errors. All eight planned missions completed. Twelve of 13 story sequences appeared; `passage` did not. The cave introduction was also late.

| Elapsed | What happened through normal controls | Why the next step followed |
|---|---|---|
|00:00–00:56|The real title/intro and difficulty menu led into W1; the first objective was “Reach the city gates.”|The hero wakes after the power fault and learns movement.|
|01:00–01:20|The player followed movement/jump cues through W2 and the gate. Bay and gate panels played.|The new objective named Ratchet’s booth rather than leaving the next destination implicit.|
|01:28–01:45|Ratchet’s letter, his drawer and his own battery led to the repair board. Keyboard focus placed the cell, positive wire, negative wire and relay bridge, then restored power.|This is Ratchet’s removed battery, separate from the later purchased Volt Pack. The board’s hint names each connection.|
|01:46–02:15|Ratchet woke; explanatory dialogue and five Ratchet panels followed. The player used his pod; the savepoint changed from W1 to A0B.|The pod is explicitly introduced as the save/recharge step.|
|02:17–02:39|The objective asked for the Volt Pack. Its card and tutorial taught healing, striking and charging/releasing a burst; the road winch stopped.|The purchase grants capabilities used to open the route and later extract marble.|
|02:40–02:49|The monument’s memory puzzle played its notes and accepted the keyboard answer. It awarded IQ, then the objective sent the player east.|The monument is on the forward tutorial route, followed by entry into the meadow.|
|02:49–02:56|Old Servo was awakened and his introduction/coil errand handled; the main objective remained finding raw marble beneath the meadow.|Servo now has an interaction and task. This run did not complete his remote coil retrieval; the staged opening hand-in is separate evidence.|
|03:08–04:26|The player descended through A5, cleared rubble, entered CV1/CV1B/CV2/CV3, used the cave pod, fought creatures and reached the marble. Claws failed; the displayed hint called for a charged attack. A Volt Burst freed it.|The objective changed to bringing the raw marble to Ratchet. The required material is genuinely before the Sage/lion route.|
|04:32–05:00|Marble panels played, followed later by the cave-introduction panels during the return through CV1.|This is CIN-2: the cave introduction arrived after the important cave discovery. A complete “seen” list would not fix this chronology.|
|05:44–06:03|Ratchet forged the blade; the weapon changed from claws to single sword. The forge sequence played. The next objective named the first Sage and the door beside the quarry.|The material has a visible purpose and grants the purification weapon before the encounter.|
|06:09–08:23|The route revisited the quarry chain and entered the maintenance passage GA1T, then GA1D.|The cave rooms have rewards, but the repeated traversal deserves pacing review. The maintenance-passage story sequence did not appear at any point in this run.|
|08:23–10:09|The player fought the Sage, died at 08:52 and returned from the CV1B checkpoint. It then completed the song-locked purification/rescue sequence.|The Sage is explicitly rescued rather than destroyed. Damage was retained across death; that is a policy observation, not automatically a bug.|
|10:11–11:36|Sage panels explained CHIME; the objective named the bell climb. The run crossed the quarry again, encountered NULLFANG in A2, saved in A3, and saw the meet/break scenes on its way back.|The lion encounter foreshadows the later den rather than replacing the current bell objective.|
|11:45–11:58|The climb reached CHIME in A9. Charged attacks resolved the encounter; bossChime was set and the CHIME panels played.|The main progression gate now allows the final guardian encounter.|
|12:01–12:58|The player reached A4 and purified NULLFANG. The game stated “cleansed, not killed,” granted Dash Jets and NULLFANG’s Oath, and showed the freed sequence.|The camp climb opened as a consequence of rescue. The optional Alpha was not required or visited.|
|13:25–13:36|The player returned to A3, climbed, deliberately lingered for the chapter transition, and advanced through all five teaser panels.|Chapter One ends at the Chapter Two teaser. This is not a full Chapter Two playthrough.|

## What this proves and what it does not

- Proves one input-only critical route can reach the teaser on the tested frozen build, including repair, save, purchase, puzzle, marble, forge, rescue and guardian gates.
- Does not erase `opening-order` failing in both viewport cases. That separate test still needs a diagnosed correction.
- Does not prove scene parity: the maintenance scene is missing and the cave introduction is late. `review.json` derives the missing set from the13 current sequence definitions; the harness’s own `panelsMissed:[]` is incomplete evidence.
- Does not cover the optional Alpha, A7 survey, A11/A12/A13 rewards, full Servo coil collection or every optional cave in one uninterrupted run. Their staged checks and source census are labeled separately.
- Does not prove touch operation, phone hardware performance, readable pacing in every language, subjective animation quality, audio or haptics. The bot advances dialogue quickly and knows the map.
- Sage damage retention is fresh: first sampled HP 417, last sampled before death 367, re-entry 233. The exact death-instant HP was not sampled. This run had no CHIME/NULLFANG deaths, so their reset comparison remains historical.
- The five planner “STUCK” diagnostics recovered through controls. They are not five confirmed game softlocks. Relevant frames are preserved, including A1, CV2 and A4 exits.

## Preserved evidence

`campaign.log` is the complete elapsed-time event log, `result.json` is the unmodified harness result and `review.json` is the stricter narrative interpretation. All 22 original PNG frames are retained under `frames/`, with checksums in `frames-manifest.json`. The original roughly 92 MiB WebM was recorded locally; its size/hash are in `recording-metadata.json`. It is not committed or offered as a durable delivered video. Do not claim the report branch contains that recording.
