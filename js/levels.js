// Author edits this file only: append one object per question.
// Types: choice {answers, correct} | click {hotspot} | wait {seconds, answers?} | type {accept} | custom {setup(stage, game)}
// Optional on any level: image, sound, bomb (seconds), fakeout (message shown on a wrong answer)
export const levels = [
  { type: "choice", q: "What is 2 + 2?", answers: ["4", "5", "Fish", "Evan"], correct: 3, fakeout: "It was obviously Evan." },
  { type: "type", q: "Name a famous cheese.", accept: ["cheese", "Cheddar"] },
  { type: "click", q: "Click the duck.", hotspot: "duck" },
  { type: "click", q: "Find Evan.", hotspot: { src: "evan.png", x: 400, y: 250 } },
  { type: "wait", q: "Don't touch anything.", seconds: 5, answers: ["Do not click me", "Seriously"], fakeout: "You touched something." },
  { type: "custom", q: "Catch Evan.", bomb: 10,
    setup(stage, game) {
      const evan = stage.sprite("evan.png", { x: 240, y: 150 });
      evan.onHover(() => evan.moveRandom());
      evan.onClick(() => game.win());
    } },
];
