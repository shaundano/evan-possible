# The Evan-Possible Quiz — Spec

A birthday gift for Evan: a 25-question browser game in the style of *The Impossible Quiz* (TIQ1, Splapp-me-do), full of meme answers and in-jokes.

**Deadline:** Monday 2026-11-16. Timeline is a guide; best effort.

## Decisions

| Area | Decision |
|---|---|
| Length | 25 questions: ~15 multiple choice, ~10 "funky" (click / wait / type / custom) |
| Reference game | The Impossible Quiz **1** |
| Rules | Authentic: 3 lives, a few skips; wrong answer = -1 life + modal, retry same question; game over → back to Q1 |
| Ending | Q25 = birthday "final boss"; win → end screen (content TBD by author) |
| Stack | Plain HTML + vanilla JS, DOM rendering, no build step |
| Stage | Fixed 550×400, scaled to fit window |
| Platform | Desktop only |
| Hosting | GitHub Pages, public repo, `noindex` |
| Assets | UI chrome, sounds, icons (skip, lives, bomb) extracted from TIQ1 SWF via JPEXS. Level content = Evan photos/memes + text/emoji |
| Debug | `?q=N` jumps to question N |

## Level format (`levels.js`)

One exported array. The author only edits this file (plus `assets/`).

```js
// multiple choice — joke answer is correct
{ type: "choice", q: "...", answers: ["a","b","c","d"], correct: 3 }

// click a hidden hotspot (word in the question or a sprite)
{ type: "click", q: "Click the duck.", hotspot: "duck" }

// do nothing until timer expires; clicking anything loses
{ type: "wait", q: "Don't touch anything.", seconds: 8, answers: [...] }

// typed answer, case-insensitive
{ type: "type", q: "...", accept: ["cheese"] }

// escape hatch for funky levels
{ type: "custom", q: "Catch Evan.",
  setup(stage, game) {
    const evan = stage.sprite("evan.png", { x: 100, y: 200 });
    evan.onHover(() => evan.moveRandom());
    evan.onClick(() => game.win());
  } }
```

**Common optional fields:** `bomb: seconds` (countdown → lose), `image`, `sound`, `fakeout` (custom death message on wrong answer).

**`game` API:** `win()`, `lose(msg)`, `skip()`, `sound(name)`, `timer(sec, fn)`.

## Milestones

| # | Milestone | Owner |
|---|---|---|
| M1 | Repo + Pages deploy; download TIQ1 SWF, extract assets with JPEXS → `reference/`, curated → `assets/` | Claude |
| M2 | Engine: stage scaling, lives, skips, game over reset, bomb timer, sound, `?q=` | Claude |
| M3 | Level types: choice, click, wait, type, custom + 3 example levels | Claude |
| M4 | Write 25 questions in `levels.js` | Chris |
| M5 | End screen content, full playthrough, fixes | Both |

## Out of scope (v1)

Mobile, save/checkpoints, TIQ2 features (fusesticks), build tooling, analytics.
