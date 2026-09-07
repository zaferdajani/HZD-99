# Dialogue and opening audio repair

The opening reused voice cues without checking what the scene was saying.
`npcSay(id, index)` selected the same `id0` recording for an unpowered NPC's
written note, the tutorial, and a quest. Arabic or missing recordings fell
back to three randomized synthesizer chirps. A failed old media promise could
also fire those chirps after the player had already dismissed its dialogue.
Nearby NPC voice loops and player barks could continue underneath all of it.

The voice channel now belongs to the story during dialogue, the scripted wake,
and cutscenes. Entering those states fades active player vocals and held charge
voices, silences proximity voice loops, and suppresses incidental confirmation
chirps. Normal combat sound cues remain available during play.

NPC playback checks the displayed English sentence against that character's
existing recorded dialogue list before choosing its take. Written notes,
new quest/tutorial lines, and languages without a matching recording stay
unvoiced. This does not fabricate speech or pretend an unrelated take matches
new text. Advancing to any page stops the preceding line. Stale playback
failures cannot restart a voice or cancel a newer sentence. Media voice graphs
are disconnected when dismissed, including their chassis oscillators.

The automatic purr at the end of waking and at every doorway was removed.
The wake retains its power-up and release mechanism cues; doors retain their
own gate cues. No recordings were generated, pitch-shifted, or replaced.

`tests/dialogue-audio.cjs` executes the production audio code with controlled
media objects to verify text matching, unpowered notes, unmatched languages,
page changes, stale promise failures, and fading an already-playing player
voice on entry to a story scene.
