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

const hud = el("hud", stage), qnum = el("qnum", hud);
const play = el("play", stage), over = el("over", stage);
over.hidden = true;

let s; // run state: { i }
const types = { custom: (lv, st, game) => lv.setup(st, game) };

// full-stage message with one button
function screen(msg, label, fn) {
  over.replaceChildren(); over.hidden = false;
  el("msg", over, msg);
  el("btn", over, label, "button").onclick = () => { over.hidden = true; fn(); };
}

function load() {
  const lv = levels[s.i];
  if (!lv) return screen("The end! (end screen TBD)", "Play again", start);
  qnum.textContent = `Q${s.i + 1}/${levels.length}`;
  play.replaceChildren();
  el("q", play, lv.q);
  let done = false;
  const game = { win() { if (!done) { done = true; s.i++; load(); } } };
  types[lv.type](lv, { el: play }, game);
}

function start(i = 0) { s = { i }; load(); }

// ?q=N debug jump
const q = +new URLSearchParams(location.search).get("q");
start(q > 0 ? Math.min(q, levels.length) - 1 : 0);
