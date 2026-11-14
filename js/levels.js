// Author edits this file only: append one object per question.
// Types: choice {answers, correct} | click {hotspot} | wait {seconds, answers?} | type {accept} | custom {setup(stage, game)}
// Optional on any level: image, sound, bomb (seconds), fakeout (message shown on a wrong answer)
export const levels = [
  { type: "choice", q: "What is 2 + 2?", answers: ["4", "5", "Fish", "Evan"], correct: 3, fakeout: "It was obviously Evan." },
  { type: "type", q: "Name a famous cheese.", accept: ["cheese", "Cheddar"] },
  { type: "wait", q: "Don't touch anything.", seconds: 5, answers: ["Do not click me", "Seriously"], fakeout: "You touched something." },
];
