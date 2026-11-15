import { levels, END_MESSAGE, END_IMAGE } from "./levels.js";

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
const over = el("over", stage), title = el("title", stage);
over.hidden = true;

let s, cur, lvSnd; // run state { i, lives, skips }; current level game
// shrink text until it fits its box
const fitText = (box, t, max, min = 4) => { for (let f = max; f >= min; f--) { t.style.fontSize = f + "px"; if (t.offsetHeight <= box.clientHeight - 4) break; } };
// answer fit: biggest font where no word splits and text fits the box; prefers one line if that stays >=60% of max
const fits = (box, t) => t.scrollWidth <= t.clientWidth && t.offsetHeight <= box.clientHeight - 6;
const fitAns = (box, t, max = 28, min = 4) => {
  for (const ws of ["nowrap", "normal"]) { t.style.whiteSpace = ws;
    for (let f = max; f >= (ws == "nowrap" ? max * .6 : min); f -= .5) { t.style.fontSize = f + "px"; if (fits(box, t)) return; } }
};
const refit = []; // answer boxes on the current level, refit once fonts finish loading
document.fonts.ready.then(() => refit.forEach(f => f()));
const boxes = (answers, fn) => { // 2x2 grid; long answer sets get taller boxes, >4 shrink
  const grid = el("grid", play);
  play.classList.toggle("dense", answers.join("").length > 200);
  play.classList.toggle("many", answers.length > 4);
  play.classList.toggle("pics", answers[0].startsWith("img:"));
  answers.forEach((a, i) => {
    const b = el("ans " + (play.classList.contains("withpic") ? "r" : i % 2 ? "r" : "l"), grid, "", "button");
    if (a.startsWith("img:")) { b.classList.add("imgans"); el("", b, "", "img").src = a.slice(4); b.onclick = () => fn(i); return; } // picture answer
    const t = el("t", b, a); b.onclick = () => fn(i); fitAns(b, t); refit.push(() => fitAns(b, t));
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
  custom: (lv, st, game) => { if (lv.answers) boxes(lv.answers, () => {}); lv.setup(st, game); },
};

// full-stage message: a button, or (no label) auto-continues after 1.6s / on click
let tm;
function screen(msg, label, fn, cls = "") {
  clearTimeout(tm); over.replaceChildren(); over.hidden = false; over.className = "over " + cls;
  if (cls === "wrong") { const b = el("board", over); el("", b, "Wrong!", "b"); b.append(msg); } else el("msg", over, msg);
  const go = () => { if (over.hidden) return; clearTimeout(tm); over.hidden = true; over.onclick = null; fn(); };
  if (label) return el("btn", over, label, "button").onclick = go;
  over.onclick = go; tm = setTimeout(go, 1600);
}

// play assets/sounds/<name>(.mp3), or assets/<path> if name has a "/"; silently ignored if missing.
// keep=true: if autoplay is blocked (no gesture yet), retry on the first click/key
let held, bgmOn = false, overSnd, obama, obamaT, quiet = false; // quiet: this level deliberately silences the theme
setInterval(() => { if (bgmOn && !quiet && bgm.paused) bgm.play().catch(() => {}); }, 1000); // watchdog: theme must always be playing
const sound = (name, keep) => { try { const a = new Audio(`assets/${name.includes("/") ? "" : "sounds/"}${name}${name.includes(".") ? "" : ".mp3"}`);
  a.preload = "auto"; a.play().catch(e => { if (keep && e.name === "NotAllowedError") held = a; }); return a; } catch {} };
["pointerdown", "keydown"].forEach(ev => addEventListener(ev, () => { held?.play().catch(() => {}); held = null; }));

// background music: loops quietly, starts on the first click (browser autoplay rules)
const bgm = Object.assign(new Audio("assets/sounds/bgm.mp3"), { loop: true, volume: .25 });


// "no skipping" tape banner
const nope = () => { const b = el("nope", stage, "Sorry, no skipping!"); setTimeout(() => b.remove(), 1800); };
const next = () => { s.i++; load(); };

// wrong answer: last life goes straight to game over, else lose a life and show the modal over the question
function die(msg, all) {
  s.lives = all ? 0 : s.lives - 1; lives.querySelector(".n").textContent = s.lives;
  if (!s.lives) return gameOver();
  sound("wrong"); screen(msg === "Wrong!" ? "-1 life!" : msg, "", load, "wrong");
}

function gameOver() { // splat; click anywhere to retry
  overSnd = sound("bomb"); clearTimeout(tm); over.replaceChildren(); over.hidden = false; over.className = "over gameover";
  el("", over, "", "img").src = "assets/img/game-over.svg";
  over.onclick = () => { overSnd?.pause(); over.hidden = true; over.onclick = null; start(); };
}

// birthday end screen: confetti, victory sound, author message/image, Play Again returns to the title card
function endScreen() {
  clearTimeout(tm); bgmOn = false; bgm.pause(); overSnd = Object.assign(sound("mom-cat2"), { loop: true, volume: .3 }); // theme lower; ducks further while the Obama clip (the birthday message) plays
  clearTimeout(obamaT); obamaT = setTimeout(() => { overSnd.volume = .12; obama = sound("obama"); obama.onended = () => overSnd.volume = .3; }, 1200); over.replaceChildren(); over.hidden = false; over.className = "over end";
  for (let i = 0; i < 70; i++) el("confetti", over, "", "i").style.cssText = `left:${Math.random() * 100}%;background:hsl(${Math.random() * 360},90%,55%);animation-delay:${Math.random() * 3}s`;
  el("h", over, "HAPPY BIRTHDAY").append(el("b", over, "EVAN", "b"));
  if (END_IMAGE) el("pic", over, "", "img").src = END_IMAGE;
  const cat = el("cat", over, "", "img"); let f = 0; const cats = ["cat1d", "cat2", "cat1d", "cat3"]; cat.src = "assets/img/cat1d.png"; const ci = setInterval(() => over.isConnected && !over.hidden ? cat.src = `assets/img/${cats[f++ % 4]}.png` : clearInterval(ci), 250);
  el("note", over, END_MESSAGE);
  el("btn", over, "Play again", "button").onclick = () => { clearTimeout(obamaT); obama?.pause(); overSnd?.pause(); over.hidden = true; hud.style.visibility = "hidden"; title.hidden = false; };
  el("credits", over, 'Music: Kevin MacLeod (CC BY 4.0), "Local Forecast - Elevator"; beatbox: Pepouni (CC BY-SA 3.0) & stilgar (PD); inspired by The Impossible Quiz by Splapp-me-do');
}

function load() {
  const lv = levels[s.i];
  cur?.teardown(); lvSnd?.pause(); held = null; // previous level's clip must not leak into this one
  if (!lv) return endScreen();
  qnum.lastChild.textContent = `${s.i + 1}.`;
  lives.querySelector(".n").textContent = s.lives;
  if ([13].includes(s.i) && !s.got.has(s.i)) { s.got.add(s.i); s.skips++; }
  skips.replaceChildren(); for (let k = 0; k < 1; k++) { const b = el(k < s.skips ? "on" : "", skips, "", "button"); b.onclick = k < s.skips ? () => lv.noskip ? nope() : cur?.skip() : () => lv.noskip && nope(); b.tabIndex = k < s.skips ? 0 : -1; } // grey arrows do nothing except show the no-skipping tape
  refit.length = 0; play.replaceChildren(area); area.replaceChildren(); play.onclick = null; play.className = "play";
  play.classList.toggle("withpic", !!lv.image && !lv.pictop && !lv.qright); play.classList.toggle("pictop", !!lv.pictop); play.classList.toggle("qright", !!lv.qright); // image on the left, answers on the right
  const q = el("q", play), qt = el("qt", q, lv.q);
  fitText(q, qt, lv.pictop ? 26 : lv.qright ? 30 : lv.q.length > 70 ? 34 : 48, 16);
  if (lv.image) { const im = el("pic", play, "", "img"); im.src = lv.image; im.onerror = () => im.remove(); }
  let done = false;
  const ids = [], fns = []; // pending timers (cleared when the level ends) and cleanup hooks (run before the next load)
  const end = f => (...a) => { if (!done) { done = true; ids.forEach(clearTimeout); f(...a); } };
  const game = { win: end(() => { sound("correct"); next(); }), lose: end((msg = "Wrong!", all) => die(msg, all)),
    cashSkips() { s.lives += s.skips; s.skips = 0; lives.querySelector(".n").textContent = s.lives; skips.querySelectorAll("button").forEach(b => { b.className = ""; b.disabled = true; b.onclick = null; }); },
    hit() { if (done) return; s.lives--; lives.querySelector(".n").textContent = s.lives; // lose a life, level keeps going
      if (s.lives > 0) return sound("life-lost"); done = true; game.dead = true; ids.forEach(clearTimeout); gameOver(); },
    sound, bgm, cleanup: f => fns.push(f), teardown: () => fns.splice(0).forEach(f => f()),
    timer(sec, fn) { ids.push(setTimeout(() => done || fn(), sec * 1000)); },
    skip() { if (s.skips > 0 && !done) { s.skips--; end(next)(); } } };
  cur = game;
  bomb.textContent = "";
  if (lv.bomb) { // bomb: N counts down in the HUD, lose at 0
    let n = lv.bomb;
    const tick = () => { bomb.textContent = `\u{1F4A3} ${n}`; if (!n--) return game.lose(undefined, true); game.timer(1, tick); };
    tick();
  }
  quiet = !!(lv.sound && !lv.keepBgm || lv.quiet); bgm.volume = .25; lv.sound && !lv.keepBgm ? bgm.pause() : bgmOn && bgm.play().catch(() => addEventListener("pointerdown", () => bgmOn && bgm.play(), { once: true })); // retry on next click if blocked
  lvSnd = lv.sound ? sound(lv.sound, true) : null;
  if (lv.sound) { const rp = el("replay", play, "\u25B6 Replay", "button"); rp.onclick = e => { e.stopPropagation(); lvSnd.pause(); lvSnd = sound(lv.sound); }; }
  types[lv.type](lv, { el: area, sprite }, game);
}

function start(i = 0) { hud.style.visibility = ""; bgm.currentTime = 0; s = { i, lives: 3, skips: 0, got: new Set() }; load(); }

// title card; Play is the first gesture, so music (and the first clip) can start
await document.fonts.load("46px Akbar");
const q = +new URLSearchParams(location.search).get("q"); // ?q=N debug jump skips the title
title.innerHTML = "<h1>THE EVAN-POSSIBLE<b>QUIZ</b></h1>";
hud.style.visibility = "hidden"; // no HUD behind the menu
const pk = el("", title, "a birthday gift for Evan", "p"), intro = el("title intro", stage), bg = el("begin", intro, "Begin", "button");
const go = el("ans l r btn", title, "Play", "button"); title.insertBefore(go, pk);
title.hidden = true; // white screen with only Begin; fart, then the menu and music
const fartA = Object.assign(new Audio("assets/sounds/fart3.mp3"), { preload: "auto" }); // preloaded so the click farts instantly
const menu = () => { intro.hidden = true; title.hidden = false; title.classList.add("fade"); bgmOn = true; bgm.volume = 0; bgm.play().catch(() => {});
  let v = 0; const r = setInterval(() => { bgm.volume = Math.min(.25, v += .01); v >= .25 && clearInterval(r); }, 40); }; // music fades in under the menu
bg.onclick = () => { bg.disabled = true; bg.classList.add("out"); fartA.play().catch(() => {}); setTimeout(menu, 2200); };
go.onclick = () => { title.hidden = true; bgm.currentTime = 0; bgmOn = true; bgm.play().catch(() => {}); start(); };
if (q > 0) { intro.hidden = true; title.hidden = true; start(Math.min(q, levels.length) - 1); }
