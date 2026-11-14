// Author edits this file only: append one object per question.
// Types: choice {answers, correct (index or array of indexes)} | click {hotspot} | wait {seconds, answers?} | type {accept} | custom {setup(stage, game)}
// Optional on any level: image, sound, bomb (seconds), fakeout (message shown on a wrong answer)

// art: box with assets/levels/<src>, or the emoji placeholder until the file exists
const art = (parent, src, emoji, cls, css) => {
  const d = Object.assign(document.createElement("div"), { className: "art " + cls, textContent: emoji }), img = new Image();
  if (src) { img.onload = () => d.replaceChildren(img); img.src = "assets/levels/" + src; }
  Object.assign(d.style, css); parent.append(d); return d;
};
// drag: pointer-drag e inside area (works under the scaled stage); drop(e) on release
const drag = (e, area, drop) => e.onpointerdown = ev => {
  const r = area.getBoundingClientRect(), k = r.width / area.offsetWidth, ox = (ev.clientX - r.left) / k - e.offsetLeft, oy = (ev.clientY - r.top) / k - e.offsetTop;
  e.setPointerCapture(ev.pointerId);
  e.onpointermove = m => Object.assign(e.style, { left: (m.clientX - r.left) / k - ox + "px", top: (m.clientY - r.top) / k - oy + "px" });
  e.onpointerup = () => { e.onpointermove = e.onpointerup = null; drop(e); };
};
const inside = (a, b) => { const p = a.getBoundingClientRect(), m = b.getBoundingClientRect(), x = p.x + p.width / 2, y = p.y + p.height / 2; return x > m.left && x < m.right && y > m.top && y < m.bottom; };

// Rotten Tomatoes critic scores (checked 2026-11-14): Blade Runner 2049 88%, DuckTales the Movie 65%, Spaceballs 53%, The Gambler 43%. Highest first.
const RANKING = ["Blade Runner 2049", "Ducktales the Movie", "Spaceballs", "The Gambler"];

export const levels = [
  { type: "choice", q: "Which Shaggs song is this?", sound: "levels/shaggs-who-are-parents.mp3", correct: 1,
    answers: ["Philosophy of the World", "Who Are Parents?", "My Pal Foot Foot", "It's Halloween"] },
  { type: "custom", q: "Put the pipe in old Garfield's mouth",
    setup(stage, game) {
      art(stage.el, "garfield.png", "\u{1F431}", "garfield", { left: "300px", top: "75px", width: "190px", height: "250px" });
      const mouth = art(stage.el, "", "", "mouth", { left: "377px", top: "115px", width: "60px", height: "80px", background: "none" }); // MOUTH hotspot over the open mouth in garfield.png
      const pipe = art(stage.el, "pipe.png", "\u{1FA88}", "pipe", { left: "60px", top: "220px", width: "80px", height: "80px" });
      drag(pipe, stage.el, () => inside(pipe, mouth) && game.win());
    } },
  { type: "choice", q: "A bear walks into a bar and orders a grilled ...", answers: ["cheese", "steak", "couple & their dog", "lettuce"], correct: 0 },
  { type: "custom", q: "Movie night: rank these 4 movies by Rotten Tomato score (click best first)",
    setup(stage, game) {
      const films = [["Spaceballs", "spaceballs", "#c33"], ["Blade Runner 2049", "blade-runner-2049", "#e80"], ["Ducktales the Movie", "ducktales", "#27c"], ["The Gambler", "the-gambler", "#555"]];
      const row = Object.assign(document.createElement("div"), { className: "posters" }), picks = [], badges = [];
      const bgm = new Audio("assets/levels/elevator-music.mp3"), watch = setInterval(() => row.isConnected || (bgm.pause(), game.bgm.play().catch(() => {}), clearInterval(watch)), 300); // loop music until the level ends
      bgm.loop = true; bgm.volume = .5; bgm.play().catch(() => {}); game.bgm.pause(); // swap the theme for elevator music
      const submit = Object.assign(document.createElement("button"), { className: "btn", textContent: "Submit", disabled: true });
      films.forEach(([title, file, bg], i) => {
        const slot = document.createElement("div"), badge = document.createElement("div");
        art(slot,`poster-${file}.jpg`, title, "poster", { background: bg });
        badge.className = "badge"; badges.push(badge); slot.append(badge); row.append(slot);
        slot.onclick = () => { // click to rank, click again to unrank
          picks.includes(i) ? picks.splice(picks.indexOf(i), 1) : picks.push(i);
          badges.forEach((b, j) => b.textContent = picks.indexOf(j) + 1 || "");
          submit.disabled = picks.length < films.length;
        };
      });
      submit.onclick = () => picks.map(i => films[i][0]).join() === RANKING.join() ? game.win() : game.lose();
      stage.el.append(row, submit);
    } },
  { type: "custom", q: "Press asdf + Space to Beatbox",
    setup(stage, game) {
      const GOAL = 15, IDLE = 7000, root = Object.assign(document.createElement("div"), { className: "beat" });
      root.innerHTML = '<div class="board">BEATBOX 101</div><div class="guy">\u{1F9D1}‍\u{1F393}</div><div class="desk"></div><div class="count"></div>';
      stage.el.append(root);
      const guy = root.querySelector(".guy"), count = root.querySelector(".count");
      let n = 0, ac, idle; // presses, audio context, idle timer
      const blip = k => { try { ac ??= new AudioContext(); const o = ac.createOscillator(), g = ac.createGain(); // synth noise per key, no assets
        o.type = "square"; o.frequency.value = 80 + "asdf ".indexOf(k) * 90; g.gain.value = .15; g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .12);
        o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + .12); } catch {} };
      const confetti = () => { for (let i = 0; i < 50; i++) { const c = document.createElement("i"); c.className = "confetti";
        c.style.cssText = `left:${Math.random() * 100}%;background:hsl(${Math.random() * 360},90%,55%);animation-delay:${Math.random() * .5}s`; root.append(c); } };
      const stop = () => { clearTimeout(idle); removeEventListener("keydown", press); };
      const arm = () => { clearTimeout(idle); idle = setTimeout(() => { stop(); game.lose("Too slow! No beats for 7 seconds."); }, IDLE); };
      function press(e) {
        if (!root.isConnected) return stop(); // level was skipped
        const k = e.key === " " ? " " : e.key.toLowerCase();
        if (e.repeat || !"asdf ".includes(k) || k.length !== 1) return;
        e.preventDefault(); blip(k); arm();
        guy.classList.remove("hit"); void guy.offsetWidth; guy.classList.add("hit");
        count.textContent = `${++n}/${GOAL}`;
        if (n >= GOAL) { stop(); confetti(); game.sound("yay"); setTimeout(game.win, 1500); }
      }
      addEventListener("keydown", press); arm();
    } },
  { type: "choice", q: "Oil, what is it?", answers: ["makes french fries tasty", "related to Iran probably", "Oi, let's go to Mandy's", "gives me acne"], correct: 2 },
  { type: "choice", q: "Oldest breakfast place in Montreal?", answers: ["Chez Nick", "Greenspot", "Beauty's", "La Binerie"], correct: 0 },
  { type: "choice", q: "Why is Eeyore sad", answers: ["He has to pooh", "Shrinkflation", "His bones are his money", "He has a nail in his anus"], correct: 3 },
  { type: "type", q: "Spell this word: (spoken)", sound: "levels/whomst-ve.mp3", accept: ["whomst've", "whomst'd've", "whomstve"] },
  { type: "choice", q: "What's he doing", image: "assets/levels/evan-bench.jpg", correct: 1,
    answers: ["Contemplating the meaning of life", "\"I should start a podcast\"", "Posing for a photo", "\"I don't think the waiter who poured my wine was Jewish\""] },
  { type: "choice", q: "Which is a real Tony Robbins quote?", correct: 1, answers: [
    "\"Didn't get promoted? Good. More time to get better.\"",
    "\"I'm not knocking the Me Too movement, I'm knocking victimhood.\"",
    "\"If I leave here with anybody liking me, I failed. I'm not here to be your friend—if you want a friend, go get a f*cking dog. I'm here to drag your sorry ass across the goal line no matter what it takes.\"",
    "\"Sleep is for broke people. You can rest when you're dead, or when your bank account has enough zeros to buy the hospital.\"",
  ] },
  { type: "choice", q: "Hey it's me your old property manager Tom. It's gonna be $150 for bedbug removal.", answers: ["No", "No", "No", "No"], correct: [0, 1, 2, 3] },
  { type: "choice", q: "Which is a real Robert Luxenberg quote?", image: "assets/levels/luxenberg.jpg", correct: 1, answers: [
    "\"Evan, I'm on the bean diet\"",
    "\"With the students, when we started thinking like them, it was privacy, a place to hang out so we did a lot of things we knew they wanted, but we also thought about the secondary market: their parents. So we’ve put in 90 security cameras.\"",
    "\"The more you learn, the more you earn\"",
    "\"I think the issue with young people these days is they think they can get a degree and be rich, but school won't teach you how to be rich.\"",
  ] },
];
