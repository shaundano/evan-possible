// Author edits this file only: append one object per question.
// Types: choice {answers, correct (index or array of indexes)} | click {hotspot} | wait {seconds, answers?} | type {accept} | custom {setup(stage, game)}
// Optional on any level: image, sound, bomb (seconds), fakeout (message shown on a wrong answer)

// art: box with assets/levels/<src>, or the emoji placeholder until the file exists
const art = (parent, src, emoji, cls, css) => {
  const d = Object.assign(document.createElement("div"), { className: "art " + cls });
  if (src) {
    const img = Object.assign(new Image(), { src: "assets/levels/" + src });
    d.append(img);
    if (emoji) img.onerror = () => { img.remove(); d.textContent = emoji; };
  } else if (emoji) {
    d.textContent = emoji;
  }
  Object.assign(d.style, css); parent.append(d); return d;
};
["garfield.png", "pipe.png"].forEach(f => new Image().src = "assets/levels/" + f); // preload so nothing pops in
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
      art(stage.el, "garfield.png", "", "garfield", { left: "275px", top: "100px", width: "250px", height: "222px" });
      const mouth = art(stage.el, "", "", "mouth", { left: "290px", top: "125px", width: "80px", height: "50px", background: "none" }); // hotspot over his muzzle
      const pipe = art(stage.el, "pipe.png", "", "pipe", { left: "60px", top: "200px", width: "120px", height: "55px" });
      let won = false;
      drag(pipe, stage.el, () => {
        const pr = pipe.getBoundingClientRect(), mr = mouth.getBoundingClientRect(), x = pr.right - 4, y = pr.top + pr.height * .12; // stem tip
        if (won || !(x > mr.left && x < mr.right && y > mr.top && y < mr.bottom)) return;
        won = true; pipe.onpointerdown = null;
        Object.assign(pipe.style, { left: "210px", top: "141px" }); // stem in his mouth, bowl outside
        const puff = () => { const p = Object.assign(document.createElement("div"), { className: "smoke-puff" }); Object.assign(p.style, { left: 226 + Math.random() * 8 + "px", top: "141px" }); p.onanimationend = () => p.remove(); stage.el.append(p); };
        puff(); const t = setInterval(puff, 250);
        setTimeout(() => { clearInterval(t); game.win(); }, 3000); // hold 3s while smoking
      });
    } },
  { type: "choice", q: "A bear walks into a bar and orders a grilled ...", answers: ["cheese", "steak", "couple & their dog", "lettuce"], correct: 0 },
  { type: "custom", q: "Drag the movies into Rotten Tomatoes order, best first",
    setup(stage, game) {
      const films = [["Spaceballs", "spaceballs", "#c33"], ["Blade Runner 2049", "blade-runner-2049", "#e80"], ["Ducktales the Movie", "ducktales", "#27c"], ["The Gambler", "the-gambler", "#555"]];
      const div = (cls, parent, css = {}) => { const d = Object.assign(document.createElement("div"), { className: cls }); Object.assign(d.style, css); parent.append(d); return d; };
      const cin = div("cinema", stage.el), X = i => 131 + i * 84; // curtains, screen, seats behind the 4 slots
      for (let r = 0; r < 3; r++) for (let c = 0; c < 11; c++) div("seat", cin, { left: 78 + c * 44 + r % 2 * 22 + "px", top: 258 + r * 34 + "px" });
      div("curtain", cin, { left: 0, width: "90px" }); div("curtain", cin, { left: "494px", width: "56px" }); div("screen", cin); div("valance", cin);
      const slots = films.map((_, i) => { const d = div("slot", cin, { left: X(i) + "px", top: "148px" }); d.textContent = i + 1; return d; });
      const where = films.map(() => -1), bgm = new Audio("assets/levels/starwars.mp3");
      game.cleanup(() => { bgm.pause(); game.bgm.play().catch(() => {}); }); // elevator music until the level is torn down
      bgm.loop = true; bgm.volume = .5; bgm.play().catch(() => {}); game.bgm.pause(); // swap the theme for elevator music
      const submit = Object.assign(document.createElement("button"), { className: "btn", textContent: "Submit", disabled: true }); cin.append(submit);
      const layout = () => { posters.forEach((p, i) => Object.assign(p.style, where[i] < 0 ? { left: X(i) + 2 + "px", top: "262px" } : { left: X(where[i]) + 2 + "px", top: "150px" })); submit.disabled = where.includes(-1); };
      const posters = films.map(([title, file, bg], i) => { const p = art(cin, `poster-${file}.jpg`, title, "poster", { background: bg });
        drag(p, cin, () => { const t = slots.findIndex(sl => inside(p, sl)), o = where.indexOf(t); // drop in a slot (swapping its occupant back) or off it
          if (t >= 0 && o >= 0 && o !== i) where[o] = where[i]; where[i] = t; layout(); });
        return p; });
      layout();
      submit.onclick = () => [0, 1, 2, 3].map(t => films[where.indexOf(t)][0]).join() === RANKING.join() ? game.win() : game.lose();
    } },
  { type: "custom", q: "Mash any key to Beatbox",
    setup(stage, game) {
      const GOAL = 15, IDLE = 7000, root = Object.assign(document.createElement("div"), { className: "beat" });
      root.innerHTML = '<div class="board">BEATBOX 101</div><div class="guy"><img src="assets/img/school-child.svg" alt="school child"></div><div class="desk"></div>';
      stage.el.append(root);
      const guy = root.querySelector(".guy");
      let n = 0, idle;
      const names = ["a", "s", "d", "f", "1", "2", "3", "4", "5"], snd = k => "beatbox-" + (k === " " ? "space" : names[(k.charCodeAt(0) - 97) % names.length]); // letters cycle the set, space accents
      const beats = Object.fromEntries([..."abcdefghijklmnopqrstuvwxyz "].map(k => [k, new Audio(`assets/sounds/${snd(k)}.mp3`)]));
      const playBeat = k => {
        try { const a = beats[k].cloneNode(); a.volume = .9; a.play().catch(() => {}); }
        catch { game.sound(snd(k)); }
      };
      const confetti = () => { for (let i = 0; i < 50; i++) { const c = document.createElement("i"); c.className = "confetti";
        c.style.cssText = `left:${Math.random() * 100}%;background:hsl(${Math.random() * 360},90%,55%);animation-delay:${Math.random() * .5}s`; root.append(c); } };
      const stop = () => { clearTimeout(idle); removeEventListener("keydown", press); };
      const arm = () => { clearTimeout(idle); idle = setTimeout(() => { stop(); game.lose("Too slow! No beats for 7 seconds."); }, IDLE); };
      function press(e) {
        if (!root.isConnected) return stop(); // level was skipped
        const k = e.key === " " ? " " : e.key.toLowerCase();
        if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || !/^[a-z ]$/.test(k)) return;
        e.preventDefault(); playBeat(k); arm();
        guy.classList.remove("hit"); void guy.offsetWidth; guy.classList.add("hit");
        if (++n >= GOAL) { stop(); confetti(); game.sound("yay"); setTimeout(game.win, 1500); }
      }
      addEventListener("keydown", press); game.cleanup(stop); arm();
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
  { type: "custom", q: "Hey it's me your old property manager Tom. It's gonna be $150 for bedbug removal.",
    setup(stage, game) {
      const bug = art(stage.el, "", "\u{1FAB2}", "", { left: "-60px", top: "250px", width: "50px", height: "50px", fontSize: "40px", cursor: "pointer", display: "none", transition: "left 5s linear" });
      ["No", "No", "No", "No"].forEach((a, i) => { const b = art(stage.el, "", a, "", { left: 45 + i * 120 + "px", top: "160px", width: "90px", height: "50px", fontSize: "30px", background: "#f8caff", border: "6px solid #281efb", boxSizing: "border-box", cursor: "pointer" }); b.onclick = () => {}; });
      game.timer(7, () => { bug.style.display = "block"; void bug.offsetWidth; bug.style.left = "560px"; game.timer(5.2, () => game.lose("The bedbug got away. $150.")); });
      bug.onclick = () => { bug.style.transition = "none"; bug.style.left = bug.getBoundingClientRect().left / (stage.el.getBoundingClientRect().width / 550) - stage.el.getBoundingClientRect().left / (stage.el.getBoundingClientRect().width / 550) + "px"; bug.textContent = "\u{1FA78}\u{1F480}"; bug.style.width = "100px"; bug.onclick = null; setTimeout(game.win, 2000); };
    } },
  { type: "choice", q: "Which is a real Robert Luxenberg quote?", image: "assets/levels/luxenberg.jpg", pictop: true, correct: 1, answers: [
    "\"Evan, I'm on the bean diet\"",
    "\"With the students, when we started thinking like them, it was privacy, a place to hang out so we did a lot of things we knew they wanted, but we also thought about the secondary market: their parents. So we’ve put in 90 security cameras.\"",
    "\"The more you learn, the more you earn\"",
    "\"I think the issue with young people these days is they think they can get a degree and be rich, but school won't teach you how to be rich.\"",
  ] },
  // DRAFT
  { type: "choice", q: "What is 2+2?", answers: ["6, 7", "21", "5", "Quick maths"], correct: 3, fakeout: "4 minus 1 that's 3" },
  // DRAFT
  { type: "choice", q: "I am your...", answers: ["Dad", "Father", "Mother", "Nephew"], correct: 0, fakeout: "No. That's not true. That's impossible!" },
  // DRAFT
  { type: "custom", q: "Click the Lizard Wizard", fakeout: "Not a Lizard Wizard.",
    setup(stage, game) {
      const need = new Set(["\u{1F98E}", "\u{1F9D9}"]); // lizard + wizard
      ["\u{1F40D}", "\u{1F98E}", "\u{1F40A}", "\u{1F9D9}"].forEach((e, i) => {
        const a = art(stage.el, "", e, "", { left: 25 + i * 130 + "px", top: "120px", width: "110px", height: "110px", cursor: "pointer" });
        a.onclick = () => { if (!need.has(e)) return game.lose("Not a Lizard Wizard."); need.delete(e); a.style.opacity = .3; need.size || game.win(); };
      });
    } },
  // DRAFT
  { type: "custom", q: "Please release 5 albums this year",
    setup(stage, game) {
      let n = 0; const cnt = art(stage.el, "", "\u{1F4BF} 0/5", "", { left: 0, top: "90px", width: "550px", fontSize: "56px" });
      const b = Object.assign(document.createElement("button"), { className: "btn", textContent: "Release album" }); b.style.width = "220px"; b.style.left = "165px"; stage.el.append(b);
      b.onclick = () => { cnt.textContent = `\u{1F4BF} ${++n}/5`; n >= 5 && game.win(); };
      game.timer(6, () => game.lose(`Only ${n} albums. Lazy.`));
    } },
  { type: "choice", q: "What restaurant is this?", image: "assets/levels/dagwoods.jpg", answers: ["Dag's", "Dag's", "Dag's", "I don't know"], correct: [0, 1, 2] },
  { type: "custom", q: "A long time ago in a galaxy far, far away...", // crawl: slow until 1/3 on screen, then tape-speeds-up; click it before it leaves
    setup(stage, game) {
      const t = art(stage.el, "", "Click Me", "", { left: 0, width: "550px", top: "400px", fontSize: "60px", color: "#ffe81f", background: "none", cursor: "pointer", whiteSpace: "nowrap", transform: "perspective(300px) rotateX(35deg)" });
      const m = game.sound("levels/starwars.mp3"); m.loop = true; game.cleanup(() => m.pause());
      let y = 400, v = 13, last = performance.now(), raf;
      t.onclick = () => { cancelAnimationFrame(raf); game.win(); };
      game.cleanup(() => cancelAnimationFrame(raf));
      const step = now => { const dt = (now - last) / 1000; last = now;
        if (y < 280) v *= 1 + 1.6 * dt; // entered the screen: speed up
        m.playbackRate = Math.min(4, v / 13); y -= v * dt; t.style.top = y + "px";
        y < -70 ? game.lose("It crawled away.") : raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    } },
  { type: "custom", q: "Name all the LCC houses", bomb: 60,
    setup(stage, game) {
      const H = ["beveridge", "claxton", "drummond", "french", "harper", "heward", "russel", "woods"], got = new Set();
      const input = Object.assign(document.createElement("input"), { className: "input", autocomplete: "off" }); Object.assign(input.style, { left: "20px", width: "230px", top: "170px" }); stage.el.append(input); input.focus();
      const slots = H.map((h, i) => art(stage.el, "", "", "", { left: 290 + (i % 2) * 130 + "px", top: 90 + (i >> 1) * 62 + "px", width: "120px", height: "50px", border: "4px solid #281efb", background: "#f8caff", boxSizing: "border-box", fontSize: "20px" }));
      input.oninput = () => { const v = input.value.trim().toLowerCase().replace(/^russell$/, "russel"), i = H.indexOf(v);
        if (i < 0 || got.has(i)) return; got.add(i); slots[i].textContent = H[i]; input.value = ""; got.size === 8 && game.win(); };
    } },
  { type: "choice", q: "Which Vibrant Reset song has the most plays on SoundCloud?", answers: ["Dragonhead", "Do I Wanna Know cover", "Do You Miss Me Too", "Junkie"], correct: 1 },
  // DRAFT: final boss
  { type: "choice", q: "Whose birthday is it?", answers: ["Garfield", "Whomst've", "The Lizard Wizard", "Evan"], correct: 3, bomb: 10, fakeout: "Wrong. Evan's feelings are hurt." },
];

// END SCREEN (author: replace these two): message under "HAPPY BIRTHDAY EVAN", and an optional image path like "assets/levels/end.jpg" (or "")
export const END_MESSAGE = "Placeholder: your birthday message goes here.";
export const END_IMAGE = "";
