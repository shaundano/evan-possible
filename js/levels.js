// Author edits this file only: append one object per question.
export const levels = [
  { type: "custom", q: "Placeholder 1: click the button.",
    setup(stage, game) { stage.el.append(Object.assign(document.createElement("button"), { textContent: "Win", onclick: () => game.win() })); } },
  { type: "custom", q: "Placeholder 2: click the button.",
    setup(stage, game) { stage.el.append(Object.assign(document.createElement("button"), { textContent: "Win", onclick: () => game.win() })); } },
];
