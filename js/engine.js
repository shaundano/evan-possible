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

const play = el("play", stage), area = el("area", play), hud = el("hud", stage);
const qnum = el("qnum", hud), lives = el("lives", hud), bomb = el("bomb", hud), skips = el("skips", hud);
qnum.innerHTML = '<svg viewBox="0 0 76 84"><path d="M40 4C18 2 4 20 5 44c1 24 18 37 38 36 22-1 30-22 28-42C69 18 56 5 38 6" fill="none" stroke="#ff1a1a" stroke-width="4" stroke-linecap="round"/></svg><span></span>';
lives.innerHTML = '<img src="assets/img/lives-label.svg" alt=""><span class="n"></span>';
const over = el("over", stage);
over.hidden = true;

let s, cur, lvSnd; // run state { i, lives, skips }; current level game
// shrink text until it fits its box
const fitText = (box, t, max, min) => { for (let f = max; f > min; f--) { t.style.fontSize = f + "px"; if (t.offsetHeight <= box.clientHeight - 6) break; } };
const boxes = (answers, fn) => { // 2x2 grid; long answer sets get taller boxes, >4 shrink
  const grid = el("grid", play);
  play.classList.toggle("dense", answers.join("").length > 200);
  play.classList.toggle("many", answers.length > 4);
  answers.forEach((a, i) => {
    const b = el("ans " + (play.classList.contains("withpic") ? "r" : i % 2 ? "r" : "l"), grid, "", "button");
    b.onclick = () => fn(i); fitText(b, el("t", b, a), 28, 8);
  });
};

// absolutely positioned image; falls back to a labelled box if the file is missing
function sprite(src, { x = 0, y = 0, w = 64, h = 64 } = {}) {
  const e = el("sprite", area), img = el("", e, "", "img");
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
    input.onkeydown = e => { if (e.key === "Enter") submit(); }; // returning false would block typing
    el("btn", play, "Submit", "button").onclick = submit;
    input.focus();
  },
  click(lv, st, game) { // hotspot: a word in q, or a sprite {src, x, y, w, h}
    const h = lv.hotspot;
    if (typeof h !== "string") return sprite(h.src, h).onClick(game.win);
    const q = play.querySelector(".qt"), at = lv.q.indexOf(h);
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

// full-stage message: a button, or (no label) auto-continues after 1.6s / on click
function screen(msg, label, fn, cls = "") {
  over.replaceChildren(); over.hidden = false; over.className = "over " + cls;
  if (cls === "wrong") { const b = el("board", over); el("", b, "Wrong!", "b"); b.append(msg); } else el("msg", over, msg);
  const go = () => { if (over.hidden) return; over.hidden = true; over.onclick = null; fn(); };
  if (label) return el("btn", over, label, "button").onclick = go;
  over.onclick = go; setTimeout(go, 1600);
}

// play assets/sounds/<name>(.mp3), or assets/<path> if name has a "/"; silently ignored if missing.
// keep=true: if autoplay is blocked (no gesture yet), retry on the first click/key
let held;
const sound = (name, keep) => { try { const a = new Audio(`assets/${name.includes("/") ? "" : "sounds/"}${name}${name.includes(".") ? "" : ".mp3"}`);
  a.preload = "auto"; a.play().catch(e => { if (keep && e.name === "NotAllowedError") held = a; }); return a; } catch {} };
["pointerdown", "keydown"].forEach(ev => addEventListener(ev, () => { held?.play().catch(() => {}); held = null; }));

// background music: loops quietly, starts on the first click (browser autoplay rules)
const bgm = Object.assign(new Audio("assets/sounds/bgm.mp3"), { loop: true, volume: .25 });
addEventListener("pointerdown", () => bgm.play().catch(() => {}), { once: true });

const next = () => { s.i++; load(); };

// wrong answer: lose a life, show the message, then continue or game over
function die(msg) {
  s.lives--; sound("wrong"); lives.querySelector(".n").textContent = s.lives;
  screen(msg === "Wrong!" ? "-1 life!" : msg, "", () => s.lives > 0 ? next() : gameOver(), "wrong");
}

function gameOver() { // splat; click anywhere to retry
  sound("game-over"); over.replaceChildren(); over.hidden = false; over.className = "over gameover";
  el("", over, "", "img").src = "assets/img/game-over.svg";
  over.onclick = () => { over.hidden = true; over.onclick = null; start(); };
}

function load() {
  const lv = levels[s.i];
  lvSnd?.pause(); held = null; // previous level's clip must not leak into this one
  if (!lv) return screen("\u{1F382} Happy Birthday Evan! \u{1F382}\n(end screen TBD)", "Play again", start);
  qnum.lastChild.textContent = `${s.i + 1}.`;
  lives.querySelector(".n").textContent = s.lives;
  skips.replaceChildren(); for (let k = 0; k < s.skips; k++) el("", skips, "", "button").onclick = () => cur?.skip();
  play.replaceChildren(area); area.replaceChildren(); play.onclick = null; play.className = "play";
  play.classList.toggle("withpic", !!lv.image); // image on the left, answers on the right
  const q = el("q", play), qt = el("qt", q, lv.q);
  fitText(q, qt, lv.q.length > 70 ? 34 : 48, 16);
  if (lv.image) { const im = el("pic", play, "", "img"); im.src = lv.image; im.onerror = () => im.remove(); }
  let done = false;
  const ids = []; // pending timers, cleared when the level ends
  const end = f => (...a) => { if (!done) { done = true; ids.forEach(clearTimeout); f(...a); } };
  const game = { win: end(() => { sound("correct"); next(); }), lose: end((msg = lv.fakeout ?? "Wrong!") => die(msg)),
    sound, bgm,
    timer(sec, fn) { ids.push(setTimeout(() => done || fn(), sec * 1000)); },
    skip() { if (s.skips > 0 && !done) { s.skips--; end(next)(); } } };
  cur = game;
  bomb.textContent = "";
  if (lv.bomb) { // bomb: N counts down in the HUD, lose at 0
    let n = lv.bomb;
    const tick = () => { bomb.textContent = `\u{1F4A3} ${n}`; if (!n--) return game.lose("The bomb went off!"); game.timer(1, tick); };
    tick();
  }
  lvSnd = lv.sound ? sound(lv.sound, true) : null;
  types[lv.type](lv, { el: area, sprite }, game);
}

function start(i = 0) { s = { i, lives: 3, skips: 3 }; load(); }

// ?q=N debug jump
const q = +new URLSearchParams(location.search).get("q");
await document.fonts.load("46px Akbar");
start(q > 0 ? Math.min(q, levels.length) - 1 : 0);
