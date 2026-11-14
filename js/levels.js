// Author edits this file only: append one object per question.
const btn = (stage, text, fn) => stage.el.append(Object.assign(document.createElement("button"), { textContent: text, onclick: fn }));
export const levels = [
  { type: "custom", q: "Placeholder 1: win or lose?", fakeout: "You picked wrong!",
    setup(stage, game) { btn(stage, "Win", () => game.win()); btn(stage, "Lose", () => game.lose()); } },
  { type: "custom", q: "Placeholder 2: win or lose?",
    setup(stage, game) { btn(stage, "Win", () => game.win()); btn(stage, "Lose", () => game.lose("Nope.")); } },
];
