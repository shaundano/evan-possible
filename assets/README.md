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
