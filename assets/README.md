# Assets

Extracted from The Impossible Quiz 1 (Splapp-me-do) with JPEXS. Source SWF: archive.org `impossiblequiz` (550x400, 24fps, white background). Sound mapping is a best guess from timeline context; verify by ear.

## Stage and palette

- Stage 550x400, background `#ffffff`.
- Blue `#281efb`: question text, answer box border, wires.
- Pink `#f8caff`: answer box fill. Hover state is an orange/yellow radial gradient.
- Red `#ff1a1a`: question number circle. `#ff0000`: "WRONG!" text.
- Yellow `#f2e002` with red outline `#cb0303`: "LIVES:" label.
- Green `#49ee3c` (outline `#1aa00e`): lives digit. `#bef365`: skip arrow. `#7dfba3`: "Try again?".
- Black `#000`: answer text, chalkboard, game over splat. Bomb fill `#1f1841`.

## sounds/ (SWF sound id)

| File | Use |
|---|---|
| `correct.mp3` (198) | correct answer, played on each question transition |
| `wrong.mp3` (342) | wrong answer |
| `life-lost.mp3` (157) | lives counter animation |
| `game-over.mp3` (168) | game over |
| `victory.mp3` (2898) | "Complete" screen |
| `bgm.mp3` (33) | background music loop |
| `bomb.mp3` (1105) | bomb countdown |
| `click.mp3` (936) | answer button click |

## img/

| File | Use |
|---|---|
| `answer-box.svg` | answer button, text removed (pink box, blue border, wires) |
| `skip.svg` | skip arrow icon |
| `lives-label.svg` | "LIVES:" label |
| `lives-digit-3.svg` | lives digit (green, 3 lives) |
| `wrong.svg` | "WRONG! -1 LIFE!" chalkboard |
| `game-over.svg` | game over splat |
| `bomb.svg`, `bomb-lit.svg` | bomb frames (timer 10, timer 5) |

## fonts/

- `Akbar.ttf`: hand-drawn font used in the SWF. It is a glyph subset, so some characters may be missing.

Added for the TIQ look (hand-built from the decompiled `answer-box.svg` / `skip.svg` paths): `img/pegs.svg` (answer box wire pegs, left side; mirrored in CSS for the right), `img/skip-grey.svg` (grey skip arrow).

## sounds/beatbox-*.mp3 (real vocal hits, issues #19, #22)

Ten 0.1-0.38s mono 128k mp3s cut from two Wikimedia Commons recordings, leading silence trimmed, low-end/presence EQ, light compression, loudnorm to -14 LUFS (peaks about -2 dB).

| File | Source (start in source) |
|---|---|
| `beatbox-a` (kick), `-f` (low pop), `-4` (mid pop), `-5` (bass boom) | "Mouth percussion.ogg" by stilgar, public domain (1.8s, 0.33s, 16.97s, 4.36s) |
| `beatbox-s` (snare), `-d` (hat), `-space` (accent), `-1`, `-2`, `-3` | "Beatboxset1 pepouni.ogg" by Pepouni, CC BY-SA 3.0 (2.23s, 6.82s, 11.59s, 6.24s, 13.16s, 1.77s) |

Attribution: "Beatboxset1" by Pepouni, https://commons.wikimedia.org/wiki/File:Beatboxset1_pepouni.ogg, licensed CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/); excerpts trimmed, EQ'd and normalized; the Pepouni-derived files are shared under the same license. "Mouth percussion" by stilgar: https://commons.wikimedia.org/wiki/File:Mouth_percussion.ogg (public domain).
