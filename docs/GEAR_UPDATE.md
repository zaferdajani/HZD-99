# Gear interface — 2026-09-06

CLAWBYTE now routes the former crest screen to Gear. The implementation is
`js/gear.js`; gameplay and existing saved inventory IDs remain compatible.
The NOSTOS token screen is unchanged.

- Character preview with current hand, boot and jet equipment labels, plus
  existing Higgsfield boot/jet artwork for acquired upgrade inspection.
- Standard boots installed from the start; the existing later double-jump
  unlock upgrades the displayed boots. The actual jump capability still comes
  from the same production ability flag used by the movement controller.
- Dash jets remain awarded after NULLFANG. A phase coil needs those jets before
  it can be installed; it retains the existing dash invulnerability behavior.
- Wall magnets, pulse hardware and key hardware appear as further equipment.
- Owned optional parts install/remove using the existing persistent loadout.
  Equipment power capacity replaces the presentation of crest sockets.
- Essential traversal hardware stays installed to avoid trapping the player.
- Keyboard/pad navigation and touch use the same six-row scrolling layout.
- Gear menus, pickup explanations, shop regulator and English controls use the
  equipment terminology. English and Arabic Gear copy is supplied; new keys
  in other languages currently fall back to English.

Validation: Node tests cover locked jets, phase prerequisites, power limits,
upgraded boots, saved-loadout round trip and scrolled touch bounds. A Chromium
check of the built game exercised fresh equipment, actual grantMod calls,
phase installation and English/Arabic drawing without page errors. The English
screen was visually inspected. All four builds and native staging pass.

The preview uses the existing authored cat with equipment labels. It does not
yet repaint each physical part on the cat. Proper attachment-specific art is
still an artwork task; no unapproved gear was painted procedurally. The sword
labels reflect current runtime flags; the separate sword-story migration in
SWORD_STORY.md is not implemented by this UI change.

No deployment or all-suite pass is claimed. The previously recorded release
failures remain a gate; this patch is a tested working-build change.
