# Rustsong (Mrr-Koda) — the language of the Machine Depths

A complete constructed language invented for CLAWBYTE. It is the tongue of the
old fabricator machines; the robo-cats inherited it and added the purr. In-game
it appears as circuit-glyph script on lore terminals and the title screen
(rendered by `js/lang.js`), always with a translation beneath.

## 1. Phonology

- **Consonants (11):** k · t · r · m · n · s · sh · z · v · h · g
- **Vowels (4):** a · i · u · o — there is no *e*; machines consider it wasteful.
- **The purr `rr`** is its own letter — a rolled, resonant hum. Words containing
  `rr` are "warm words" (living things, feelings, music).
- Syllables are (C)V(C). Words prefer to end in **-k** (a relay click),
  **-t** (a latch), or **-rr** (a purr).

## 2. Script

Each letter is a single angular glyph of 3 connected strokes, like traces on a
circuit board. Two systematic marks:

- a **dot above** marks "charged" letters (fixed per letter),
- a **bar below** marks every vowel.

Text runs left to right. There is no upper/lower case; names are prefixed with
the glyph of `mrr` when spoken with respect.

## 3. Grammar

| Rule | How it works | Example |
|---|---|---|
| Word order | Subject – Object – Verb (SOV) | *mi vizrr karv* — "I fight the virus" |
| Plural | reduplicate first syllable | *tekk* machine → *tetekk* machines |
| Past tense | suffix **-ta** | *vakta* — went |
| Future tense | suffix **-su** | *vaksu* — will go |
| Negation | prefix **nu-** | *nu-sirr* — does not see |
| "of" (possession) | possessor **va** possessed | *karrn va tekk* — claw of the machine |
| Adjectives | follow the noun | *gorrt vorn* — old gate |
| Participle ("-ed/-ing") | suffix **-u** | *krantu* — broken |
| "again / back" | prefix **os-** | *os-kodav* — answer (speak-back) |
| and · or · if | **ko** · **ur** · **hej** | *hej tu sirr* — if you see |

## 4. Numbers — base 8 (machines count on eight relays)

0 **nul** · 1 **ka** · 2 **zu** · 3 **mir** · 4 **tov** · 5 **hesh** · 6 **rin** · 7 **sav** · 8 **okta**

Larger numbers are read digit-by-digit in base 8:
47₁₀ = 57₈ = *hesh-okta-sav* · 1042₁₀ = 2022₈ = *zu-nul-zu-zu*.

## 5. Lexicon (~140 words)

**Pronouns:** mi I · tu you · za it/he/she · mimi we · tutu you.pl · zaza they ·
zam this · zon that · kim who · kam what

**Beings & world:** mrrka cat · mrr purr/soul · tekk machine · vizrr virus ·
korv core/heart · dunvo the Depths · skarn scrap/metal · karrn claw ·
gorrt gate/door · kivt key · zolt light · shurk dark · surn day · nokk night ·
hark stone · vann water/coolant · zizt spark/electricity · volk volt/energy ·
runt wire · pett fragment/shard · nota log/record · zakk maintenance ·
arkiv archive · signa signal · koda speech/language · krest crest/badge ·
krizt crystal · shipp workshop · tavu maker/fabricator · morr-vo grave/rust-place ·
domm home/dock · vorr elder · nikk child/kitten · drakk hound · brut brood ·
okk eye · hant hand/gripper · futt leg · katt head · rukk back · tarr tail ·
himm sky/ceiling · gruv floor · murr music · sonn sound · namm name

**Life & state:** havk life · nurrk death · sommk sleep · orrvo waking ·
sant health · krank wound · fyrr fire/heat *(loan-click)* → prefer **hott** heat ·
hulk cold · glazz ice · dust rust · gramm weight

**Verbs:** vak go · kom come · sirr see · horr hear · kodav speak · karv fight ·
zuvak purge/cleanse · krant break · tavk make/build · gavt give · takk take ·
orrv wake · sommka sleep(v) · murrn remember · vergess→**nu-murrn** forget ·
shuk seal · offk open · jump→**hupp** leap · rennk run · flugg fly · fallk fall ·
essk consume/eat · trikk trick · helpk aid · varrt wait · suchk seek ·
findk find · losk lose · winnk win · sterrb→**nurrka** die · livv→**havka** live ·
glow→**zolta** shine · hidek→**shurka** hide

**Adjectives:** vorn old · nir new · muk strange · gutt good · slek bad ·
gross big · klin small · snell fast · lang long · kort short · dunu deep ·
hoch high · krantu broken · vizru infected · klaru clean · sterk strong ·
svak weak · varm warm · kalt cold *(= hulk as adj.)* · tott dead · vach awake

**Particles:** ko and · ur or · hej if/when · nu- not · va of · os- again/back ·
po at/in · zum toward · fon from · mit with · onn without

## 6. Sample phrases

| Rustsong | English |
|---|---|
| *Mrr-koda tu kodav?* | Do you speak Rustsong? |
| *Mi mrrka, tu tekk — mimi domm ka.* | I am cat, you are machine — our home is one. |
| *Vizrr nu krant; vizrr os tavk.* | The virus does not destroy; it remakes. |
| *Karrn va tekk* | Claw of the machine *(the game's title glyph-line)* |
| *Hej tu dunvo vak, kivt takk.* | If you go to the Depths, take a key. |
| *Za morr-vo po sommka — nu orrv za!* | It sleeps in the rust-grave — do not wake it! |
| *Nikk, volk klin gavt, murr gross takk.* | Kitten: give a little energy, take back great music. |
| *Zolt fon shurk kom.* | Light comes from the dark. *(fabricator proverb)* |
| *Mi sav havk losk-ta; zam va ka murrn.* | I have lost seven lives; this one I remember. |

## 7. The three terminal texts (as seen in-game)

1. *zakk nota hesh-okta-sav — dun gorrt shukta — signa muk sirrta — hej tu za
   sirr, nu os-kodav za* — "Maintenance log 47: the deep gate was sealed. A
   strange signal was seen. If you see it, do not answer it."
2. *arkiv pett, surn zu-nul-zu-zu — vizrr nu krant — vizrr os tavk — zat vor
   nurrku* — "Archive fragment, day 1042: the virus does not destroy; it
   remakes. That is worse than death."
3. *hulk skarn nota — prizmrr sav va krest skratta — za krizt dunvo vakta* —
   "Cold-storage note: the Prism-cat stole the seventh crest; it went to the
   crystal deep."
