# Roster and required movement skills

Verified against 71509477db8cebf5615bb4e3bcb14bfd350f87fd. These are motion
profiles, not a new design/attack-approval list. Current source and approved
assets override stale prose. All planned rows except GA1D remain future work.

| Actor / body | Movement skills | Attack / recovery skills | Current owner |
|---|---|---|---|
| Meadow Sage, GA1D — robed biped | foot plants, forward/backward step phase, planted turn, same body scale | committed double lunge, readable replant, ground-ring release, safe exhale, kneel/cleanse | first pass: sage-motion.js + Enemy sage case |
| Pack / Canal / Foundry / Archive / Crystal / Nest Sages | same biped baseline, individual future choreography; no new animal identity inferred | preserve rescue, identities, network and gifts | GA2D/GB1D/GC1D/GD1D/GX1D/GE1D — unchanged in this pass |
| NULLFANG — lion | feline stalk/crouch, hindquarters load, pounce, forepaw landing, tail balance | distinct paw/roar tells, committed swipe, stop/recover, purified return | beast.js |
| Alpha — wolf | canine gait, leap arc, braking/turn, grounded rebound | bite/clinch/release, claw sequence, hit-versus-miss recovery | wolves.js |
| TALONHOST — eagle | articulated wing beat, bank/dive/brake, cable dynamics | volley release, swoop, brood call, low recovery | eagle.js |
| FURNACE CHOIR — dragon | heavy four-leg gait, wings, neck/tail lag | body-driven slam, breath/forge release, legible spent beat | furnace.js/furnace-fight.js |
| GLACIERE — unicorn | equine support and deliberate magical hover, banks/settles | horn lance, nova, charged rush, recovery at player reach | glaciere.js |
| PRISM PROWLER — rival robo-cat | feline pose changes, direction-owned turn, leap phases | dash/pounce/spread identification, actual landing, planted recovery | prism.js |
| GRAVEHORN — rhinoceros | heavy acceleration/braking, foreleg stop, rear-kick load | horn missile socket/return, wall collision, stagger, phase change | gravehorn.js |
| MOTHER-V — transmission/core | radial machine/halo/tendril choreography, no fabricated animal gait | channel, hold, release, charge interrupt and aftermath | mother.js |
| CHIME and Eye constructs | mechanism-specific hinges/orbit/recoil | distinct warning/contact/recovery by instrument, no shared generic roar | mini-boss source in entities.js |

# External skills reviewed and their boundaries

- MengTo/Skills `design-action-combat`: explicit contact/state/timing contracts,
  deterministic edge cases and actual-camera verification; applicable now.
- MengTo/Skills `game-dev-combat-animation`: numbered standards, before/after
  captures, follow-through, testing the actual source of the defect. Its 3D arm
  probes and joint limits are specific to its original rig, not executable here.
- arjun988/blender-skills `animation`: reference/block/breakdown/polish workflow,
  root-motion documentation, cycle seams, mechanical pivots. This repository is
  Canvas2D with rendered artwork; no migration to Blender or dependency installed.
- JCaraballo113/agent-skills `blender-character/ANIMATION.md`: planted contact,
  root/stance cancellation, tail lag and stops. Its sample diagonal gait is one
  creature example, not a biological rule for every lion, wolf, horse or rhino.
- Animation Apprentice's bird/dragon/animal-reference index supplies specialist
  motion references, not an installable coding skill. No tutorial media copied.
- Installed fal-gamedev skill: asset consistency, clean alpha and game-scale
  validation. Production artwork still follows this project's approved Higgsfield
  pipeline; this pass reuses existing art instead of generating a substitute.

Sources: see docs/combat/research/creature-motion-skills-2026-11-13.json and
https://www.animationapprentice.org/blog/animating-birds.html .
