# NOSTOS — an Odyssey metroidvania

An original browser game in the classic metroidvania genre, built on **Homer's
Odyssey** (the ancient, public-domain epic — see `ODYSSEY_SOURCE.md` for the
research base and full story mapping). You are **Odysseus**, king of Ithaca,
cast alone onto a strange shore by Poseidon's wrath, fighting the long way
home. All names of original constructs, dialogue, riddles, art and Arabic
translations were written for this project; nothing is copied from any modern
adaptation.

## Play

Open `play.html` in any browser (single self-contained file, no server
needed), or serve the folder and open `index.html` (modular source).
Keyboard or touch (mobile auto-detected).

## The voyage

- **6 zones, 20 interconnected rooms**: the Storm-Wrecked Shores, the
  Cyclops' Island, Circe's Isle, the Underworld, Ithaca — and the hidden
  Sirens' Strait, found only by those who follow the song.
- **6 guardians with phased special moves** (the final duel has three
  phases): Charybdis, Polyphemus, Circe's Trial, Scylla, the Siren Queen,
  and Antinous, Champion of the Suitors. Every guardian yields a reward:
  a god-gift ability and a trophy treasure.
- **Abilities**: Wind of Aeolus (dash) · Winged Sandals of Hermes (double
  jump) · Grip of the Fig Tree (wall-cling) · Aegis Pulse · Key of
  Persephone.
- **Blessings of the Gods**: 8 equippable blessings on a socket budget.
- **Treasures of the Voyage**: 13 relics — the Ram's Fleece, a Sprig of
  Moly, Scylla's Sinew, the Great Bow…
- **Riddles of the Oracle** (8, original) grant **Metis** to unlock the
  Gifts of Cunning skill tree.
- **The Trials of Wisdom** — four fully animated mini-games at stations
  along the road (falling marble in *Stones of the Mason*, a tilting golden
  beam held by Themis in *Scales of Themis*, chisel-carved *Numbers of the
  Oracle*, and the playable four-string lyre of *Song of the Sirens*), plus
  a Full Trial at the temple: 45-second rounds, ramping difficulty, streak
  bonuses, and a laurel-crowned marble bust for your result. Metis is earned
  by surpassing your finest measure.
- **World systems**: hearths of Hestia (rest + save + respawn), Hermes'
  trading post, 7 NPCs (Athena, Hermes, Eurylochus, Elpenor, the shade of
  Tiresias, Eumaeus, Penelope), obols dropped Souls-style on death, auto-map
  (Tab), Greek-lettered friezes and carved votive tablets, zone-tinted
  parallax of temples, aqueducts and wine-dark sea.
- **3 difficulties**: Lotus-Eater, Wayfarer, and **Wrath of Poseidon**
  (double damage, faster foes, exactly nine threads of life — then the
  save is unwoven).
- **Bilingual**: full English + Arabic UI and dialogue (toggle in menu),
  with ambient ancient-Greek lettering (ΝΟΣΤΟΣ · ΙΘΑΚΗ · α β γ δ).
- **Original OST** (10 synthesized tracks) layered with CC0/CC-BY recorded
  music and SFX — every third-party asset license-verified and credited in
  `assets/CREDITS.md`.
- **Workshop of Daedalus**: a developer door on the title menu that jumps
  straight to any guardian, trial, or riddle for playtesting.

## Controls

Move: arrows / A-D · Jump: Z / Space · Attack: X / J (+Up/Down to aim) ·
Dash: C / Shift · Aegis Pulse: V / K · Bind wounds: hold F / H ·
Interact: E · Map: Tab / M · Blessings: I · Pause: Esc

## Tech

Vanilla JS + Canvas 2D, zero dependencies. `play.html` is `index.html`
with the eleven `js/` files inlined and the media embedded as data: URIs
(`node build.cjs` rebuilds it). Engine lineage: ported from the CLAWBYTE
engine (same repo owner) and fully re-themed at every layer.
