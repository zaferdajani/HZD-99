# First Sage — research-led movement and attack pass

Baseline: 71509477db8cebf5615bb4e3bcb14bfd350f87fd / BUILD_ID 353de4462b99.
Only the Meadow Sage (GA1D) receives this profile. The six other chamber sages
and the distinct animal guardians are not renamed, replaced or automatically
retuned. The research adapter is .claude/skills/creature-motion-combat/SKILL.md;
its roster maps the actual biped/animal/mechanical types and the required skills.

## Confirmed before/after behavior

The old lunge artwork mirrored from the player's CURRENT side, not the committed
strike. Its second lunge could reverse instantly; one update retained velocity
after switching to the recovery picture. Its advertised 700ms exhale still fell
through the normal enemy contact-damage code. The ring origin and collision
followed the moving caster, while its drawing was a fixed-height ground wave.
It also compared radial distance to the player's body centre, not the depicted
floor lane. The Sage's eight-frame walk got an additional vertical bob, and its
lunge portrait was scaled to 62% of the collider height versus112% at rest.

The new profile stores committed facing, inserts a stopped180ms replant before
the second strike, stops at a wall, and zeros lunge velocity before exhale. The
700ms exhale remains intact and is now genuinely contact-safe. Ring origin is
captured at release; rendering and collision use that same point. Jumping and
separate elevated floors are safe. A550ms release recovery gives the ring action
a visible end. No ring creates a new hitbox during drawing. The published lunge
speed multiplier, damage, HP, decision beat, purity amount and gifts are preserved.

Existing art is reused at fixed floor pivots; the coil compresses before release,
the strike carries through, and the exhale settles. The lunge's height is now
105% of the collider rather than62%, avoiding half-size body changes. This is
registration/pose choreography, not newly authored limb animation. An interrupted wind-up/strike cancels into a350ms recovery rather than
resuming an untold lunge; released rings keep their own clock through knockback.
The original
artwork, hero gait, audio files and previous boss-motion pass remain untouched.
The freed Sage can use the existing walking strip while its calm AI moves it;
its kneeling portrait remains for rest. The warm stride pixels receive a cached
purified-blue grade, retaining the source alpha and registration; the initial
visual review caught the infected walk palette returning after the blue rest pose. No animal species was invented for it.

## Changed timing / behavior values

| Value | Before | After | Reason |
|---|---|---|---|
| Follow-up lunge redirection | instantaneous |180ms stopped replant | visibly commit the second direction |
| Double-lunge recovery |700ms |700ms | protect the learned window |
| Lunge duration / velocity |220ms / spd×2.2 |unchanged | not a new difficulty retune |
| Ring gather |700ms |unchanged | preserve warning budget |
| Ring release recovery |no explicit recovery |550ms | provide follow-through and a learnable opening |
| Ring origin |caster's live centre |release world point | picture and hit agree |
| Ring collision plane |radial distance to body centre |horizontal wavefront plus floor-lane test | match the ground ellipse; jumping is valid |
| Interrupted strike |pending timer could resume |cancel to350ms recovery |no stale attack after interruption |
| Body damage |neutral/tell/recovery included |active lunge only | no invisible damage inside a promised opening |
| Lunge artwork height |0.62 hitboxes |1.05 hitboxes | preserve body/head presence across poses |
| Additional walk bob |±1.6 world units |none | authored feet remain planted |

## Verification

New tests compare the same compiled baseline and candidate, measure real damage,
render-facing calls and opaque feet, and keep the unchanged Player.update,
heroState, moveEnt and Boss.update hashes. Existing sage/specials/network/reload,
first-sage-route, art bible, hero gait and production checks remain required.
Screenshots and motion samples are staged in the actual GA1D renderer; they are
not concept art or proof of a complete campaign playthrough. Input aliases are
not a substitute for certification on every physical controller.

The skill sources were read and content-hashed, not installed as executable
plugins. No unreviewed third-party installer, borrowed account constraint or
unrelated 3D rig threshold is shipped. This is the first implemented roster row;
subsequent animal-specific artwork/choreography remains separately scoped work.
