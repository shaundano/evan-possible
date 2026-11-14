import { levels } from "./levels.js";

const stage = document.getElementById("stage");
const el = (cls, parent, text = "", tag = "div") => {
  const e = document.createElement(tag);
  e.className = cls; e.textContent = text; parent.append(e);
  return e;
};

// scale the fixed stage to the window
const fit = () => stage.style.setProperty("--s", Math.min(innerWidth / 550, innerHeight / 400));
addEventListener("resize", fit);
fit();

const hud = el("hud", stage), qnum = el("qnum", hud), lives = el("lives", hud), bomb = el("bomb", hud);
const skipBtn = el("skip", hud, "", "button");
const play = el("play", stage), over = el("over", stage);
over.hidden = true;

let s, cur; // run state { i, lives, skips }; current level game
skipBtn.onclick = () => cur?.skip();
const boxes = (answers, fn) => answers.forEach((a, i) => { el("ans", play, a, "button").onclick = () => fn(i); });

// level types: (level, stage, game) => render into stage.el
const types = {
  choice: (lv, st, game) => boxes(lv.answers, i => i === lv.correct ? game.win() : game.lose()),
  type(lv, st, game) {
    const input = el("input", play, "", "input"), submit = () =>
      lv.accept.some(a => a.toLowerCase() === input.value.trim().toLowerCase()) ? game.win() : game.lose();
    input.onkeydown = e => e.key === "Enter" && submit();
    el("btn", play, "Submit", "button").onclick = submit;
    input.focus();
  },
  custom: (lv, st, game) => lv.setup(st, game),
};

// full-stage message with one button
function screen(msg, label, fn) {
  over.replaceChildren(); over.hidden = false;
  el("msg", over, msg);
  el("btn", over, label, "button").onclick = () => { over.hidden = true; fn(); };
}

// play assets/sounds/<name>(.mp3); silently ignored if missing or blocked
const sound = name => { try { new Audio(`assets/sounds/${name}${name.includes(".") ? "" : ".mp3"}`).play().catch(() => {}); } catch {} };

const next = () => { s.i++; load(); };

// wrong answer: lose a life, show the message, then continue or game over
function die(msg) {
  s.lives--; sound("wrong");
  screen(msg, "Continue", () => s.lives > 0 ? next() : (sound("gameover"), screen("GAME OVER", "Try again", start)));
}

function load() {
  const lv = levels[s.i];
  if (!lv) return screen("The end! (end screen TBD)", "Play again", start);
  qnum.textContent = `Q${s.i + 1}/${levels.length}`;
  lives.textContent = "\u2665".repeat(s.lives);
  skipBtn.textContent = `Skip (${s.skips})`;
  play.replaceChildren();
  el("q", play, lv.q);
  let done = false;
  const ids = []; // pending timers, cleared when the level ends
  const end = f => (...a) => { if (!done) { done = true; ids.forEach(clearTimeout); f(...a); } };
  const game = { win: end(() => { sound("correct"); next(); }), lose: end((msg = lv.fakeout ?? "Wrong!") => die(msg)),
    sound,
    timer(sec, fn) { ids.push(setTimeout(() => done || fn(), sec * 1000)); },
    skip() { if (s.skips > 0 && !done) { s.skips--; end(next)(); } } };
  cur = game;
  bomb.textContent = "";
  if (lv.bomb) { // bomb: N counts down in the HUD, lose at 0
    let n = lv.bomb;
    const tick = () => { bomb.textContent = `\u{1F4A3} ${n}`; if (!n--) return game.lose("The bomb went off!"); game.timer(1, tick); };
    tick();
  }
  if (lv.sound) sound(lv.sound);
  types[lv.type](lv, { el: play }, game);
}

function start(i = 0) { s = { i, lives: 3, skips: 3 }; load(); }

// ?q=N debug jump
const q = +new URLSearchParams(location.search).get("q");
start(q > 0 ? Math.min(q, levels.length) - 1 : 0);
