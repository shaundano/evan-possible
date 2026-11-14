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
const boxes = (answers, fn) => { // long answer sets get a compact layout
  play.classList.toggle("dense", answers.join("").length > 200);
  answers.forEach((a, i) => { el("ans", play, a, "button").onclick = () => fn(i); });
};

// absolutely positioned image; falls back to a labelled box if the file is missing
function sprite(src, { x = 0, y = 0, w = 64, h = 64 } = {}) {
  const e = el("sprite", play), img = el("", e, "", "img");
  Object.assign(e.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
  img.src = src.includes("/") ? src : `assets/${src}`;
  img.onerror = () => { img.remove(); e.classList.add("missing"); e.textContent = src; };
  const on = (ev, fn) => e.addEventListener(ev, ev2 => { ev2.stopPropagation(); fn(ev2); });
  return { el: e, onClick: fn => on("click", fn), onHover: fn => on("mouseenter", fn),
    moveRandom() { e.style.left = Math.random() * (550 - w) + "px"; e.style.top = Math.random() * (368 - h - 24) + "px"; } };
}

// level types: (level, stage, game) => render into stage.el
const types = {
  choice: (lv, st, game) => boxes(lv.answers, i => [].concat(lv.correct).includes(i) ? game.win() : game.lose()),
  type(lv, st, game) {
    const input = el("input", play, "", "input"), submit = () =>
      lv.accept.some(a => a.toLowerCase() === input.value.trim().toLowerCase()) ? game.win() : game.lose();
    input.onkeydown = e => e.key === "Enter" && submit();
    el("btn", play, "Submit", "button").onclick = submit;
    input.focus();
  },
  click(lv, st, game) { // hotspot: a word in q, or a sprite {src, x, y, w, h}
    const h = lv.hotspot;
    if (typeof h !== "string") return sprite(h.src, h).onClick(game.win);
    const q = play.querySelector(".q"), at = lv.q.indexOf(h);
    if (at < 0) return console.warn("hotspot not found in q:", h);
    const hot = el("hot", q, h, "span");
    hot.onclick = game.win;
    q.replaceChildren(lv.q.slice(0, at), hot, lv.q.slice(at + h.length));
  },
  wait(lv, st, game) { // clicking anything in the play area loses; surviving wins
    boxes(lv.answers ?? [], () => {});
    play.onclick = () => game.lose();
    game.timer(lv.seconds, game.win);
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
  if (!lv) return screen("\u{1F382} Happy Birthday Evan! \u{1F382}\n(end screen TBD)", "Play again", start);
  qnum.textContent = `Q${s.i + 1}/${levels.length}`;
  lives.textContent = "\u2665".repeat(s.lives);
  skipBtn.textContent = `Skip (${s.skips})`;
  play.replaceChildren(); play.onclick = null;
  play.classList.toggle("withpic", !!lv.image); // image on the left, answers on the right
  el("q", play, lv.q);
  if (lv.image) { const im = el("pic", play, "", "img"); im.src = lv.image; im.onerror = () => im.remove(); }
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
  types[lv.type](lv, { el: play, sprite }, game);
}

function start(i = 0) { s = { i, lives: 3, skips: 3 }; load(); }

// ?q=N debug jump
const q = +new URLSearchParams(location.search).get("q");
start(q > 0 ? Math.min(q, levels.length) - 1 : 0);
