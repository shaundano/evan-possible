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
const SW = Object.assign(new Audio("assets/levels/starwars.mp3"), { preload: "auto" }); // preloaded so the crawl music starts instantly
const RAM = Object.assign(new Audio("assets/levels/ram-ranch.mp3"), { preload: "auto" }); // final-boss music, preloaded
const RANKING = ["Blade Runner 2049", "Ducktales the Movie", "Spaceballs", "The Gambler"];

export const levels = [
  { type: "choice", q: "What year was Deloitte founded?", answers: ["1902", "1919", "1845", "1873"], correct: 2 },
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
  { type: "custom", noskip: true, quiet: true, q: "Drag the movies into Rotten Tomatoes order, best first",
    setup(stage, game) {
      const films = [["Spaceballs", "spaceballs", "#c33"], ["Blade Runner 2049", "blade-runner-2049", "#e80"], ["Ducktales the Movie", "ducktales", "#27c"], ["The Gambler", "the-gambler", "#555"]];
      const div = (cls, parent, css = {}) => { const d = Object.assign(document.createElement("div"), { className: cls }); Object.assign(d.style, css); parent.append(d); return d; };
      const cin = div("cinema", stage.el), X = i => 131 + i * 84; // curtains, screen, seats behind the 4 slots
      for (let r = 0; r < 3; r++) for (let c = 0; c < 11; c++) div("seat", cin, { left: 78 + c * 44 + r % 2 * 22 + "px", top: 258 + r * 34 + "px" });
      div("curtain", cin, { left: 0, width: "90px" }); div("curtain", cin, { left: "494px", width: "56px" }); div("screen", cin); div("valance", cin);
      const slots = films.map((_, i) => { const d = div("slot", cin, { left: X(i) + "px", top: "148px" }); d.textContent = i + 1; return d; });
      const where = films.map(() => -1), bgm = new Audio("assets/levels/elevator-music.mp3");
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
      const arm = () => { clearTimeout(idle); idle = setTimeout(() => { stop(); game.lose(); }, IDLE); };
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
  { type: "type", q: "Spell this word: (spoken)", sound: "levels/whomst-ve2.mp3", keepBgm: true, accept: ["whomst've", "whomst'd've", "whomstve"] },
  { type: "choice", q: "What's he doing", image: "assets/levels/evan-bench.jpg", correct: 1,
    answers: ["Contemplating the meaning of life", "\"I should start a podcast\"", "Posing for a photo", "\"I don't think the waiter who poured my wine was Jewish\""] },
  { type: "choice", q: "Which is a real Tony Robbins quote?", correct: 1, answers: [
    "\"Didn't get promoted? Good. More time to get better.\"",
    "\"I'm not knocking the Me Too movement, I'm knocking victimhood.\"",
    "\"If I leave here with anybody liking me, I failed. I'm not here to be your friend—if you want a friend, go get a f*cking dog. I'm here to drag your sorry ass across the goal line no matter what it takes.\"",
    "\"Sleep is for broke people. You can rest when you're dead, or when your bank account has enough zeros to buy the hospital.\"",
  ] },
  { type: "custom", q: "Hey it's me your old property manager Tom. It's gonna be $150 for bedbug removal.", answers: ["No", "No", "No", "No"],
    setup(stage, game) { // the boxes do nothing; after 7s a bug crosses, click it to squash
      let x = -30, raf, alive = true;
      const bug = art(stage.el, "bedbug2.png", "\u{1FAB2}", "", { left: x + "px", top: "326px", width: "28px", height: "28px", cursor: "pointer", display: "none", zIndex: 5, transform: "scaleX(-1)" });
      game.cleanup(() => cancelAnimationFrame(raf));
      game.timer(7, () => { bug.style.display = "flex"; let last = performance.now(); // crosses at 110px/s; escaping costs a life
        const walk = now => { if (!alive) return; x += 110 * (now - last) / 1000; last = now; bug.style.left = x + "px"; x > 560 ? game.lose() : raf = requestAnimationFrame(walk); }; raf = requestAnimationFrame(walk); });
      bug.onclick = () => { alive = false; cancelAnimationFrame(raf); bug.style.transform = "scaleX(-1) scaleY(-1)"; bug.onclick = null; game.sound("squish");
        const blood = art(stage.el, "", "", "", { left: x - 14 + "px", top: "348px", width: "56px", height: "18px", zIndex: 4 });
        blood.innerHTML = '<svg viewBox="0 0 90 30"><path d="M5 12C15 2 30 6 45 3c15-2 30 4 40 10-6 6-4 12-14 13-8 1-10-3-18-1-10 3-20 3-30 0C14 24 2 20 5 12Z" fill="#b00000"/><circle cx="12" cy="26" r="3" fill="#b00000"/><circle cx="76" cy="27" r="2.5" fill="#b00000"/><circle cx="48" cy="28" r="2" fill="#8a0000"/></svg>';
        setTimeout(game.win, 2000); };
    } },
  { type: "choice", q: "Which is a real Robert Luxenberg quote?", image: "assets/levels/luxenberg.jpg", pictop: true, correct: 1, answers: [
    "\"Evan, I'm on the bean diet\"",
    "\"With the students, when we started thinking like them, it was privacy, a place to hang out so we did a lot of things we knew they wanted, but we also thought about the secondary market: their parents. So we’ve put in 90 security cameras.\"",
    "\"The more you learn, the more you earn\"",
    "\"I think the issue with young people these days is they think they can get a degree and be rich, but school won't teach you how to be rich.\"",
  ] },
  // DRAFT
  { type: "choice", q: "What is 2+2?", answers: ["6, 7", "21", "5", "Quick maths"], correct: 3 },
  // DRAFT
  { type: "chain", q: "I am your...", steps: [[["Father's", "Mother's", "Son's", "Dad"], 0], [["Sister's", "Uncle's", "Brother's", "Cousin's"], 2], [["Niece's", "Nephew's", "Aunt's", "Grandpa's"], 1], [["Dog's", "Boss's", "Twin's", "Cousin's"], 3], [["Dad", "Current roommate", "Former roommate", "Landlord"], 2]] },
  { type: "custom", tick: true, q: "Please release 5 albums this year", // mash RELEASE: 50 clicks beat the 365-day bomb; every 10 clicks reveals a 2017 Gizzard album
    setup(stage, game) {
      const A = stage.el, NEED = 50, EVERY = 10, ALBUMS = ["album-fmb.jpg", "album-motu.jpg", "album-sketches.jpg", "album-polygon.jpg", "album-gumboot.jpg"]; // 2017 release order; album-sketches.jpg = Sketches of Brunswick East (add the file)
      let n = 0, days = 365, over = false;
      const txt = (css, s) => { const d = Object.assign(document.createElement("div"), { textContent: s }); Object.assign(d.style, { position: "absolute", left: 0, width: "550px", textAlign: "center", ...css }); A.append(d); return d; };
      const bombT = txt({ top: "98px", fontSize: "30px" }, "\u{1F4A3} 365"), prog = txt({ top: "296px", fontSize: "22px" }, "MASH THE BUTTON!");
      const slots = ALBUMS.map((f, i) => art(A, "", "?", "", { left: 21 + i * 104 + "px", top: "138px", width: "96px", height: "96px", fontSize: "48px", border: "4px solid #281efb", background: "#f8caff", boxSizing: "border-box", color: "#281efb", opacity: .55 }));
      const b = Object.assign(document.createElement("button"), { className: "btn", textContent: "RELEASE" }); Object.assign(b.style, { left: "165px", top: "244px", width: "220px", height: "46px", fontSize: "30px" }); A.append(b);
      const tick = setInterval(() => { if (over) return; bombT.textContent = "\u{1F4A3} " + --days; if (days <= 0) { over = true; clearInterval(tick); game.lose(undefined, true); } }, 32.5); // ~14s for 365 days
      game.cleanup(() => clearInterval(tick));
      b.onclick = () => { if (over) return; n++; 
        if (n % EVERY === 0) { const k = n / EVERY - 1, s = slots[k]; game.sound("correct"); s.style.opacity = 1; s.textContent = ""; const im = Object.assign(new Image(), { src: "assets/levels/" + ALBUMS[k] }); Object.assign(im.style, { width: "100%", height: "100%", objectFit: "cover" }); im.onerror = () => { im.remove(); s.textContent = "\u{1F4BF}"; }; s.append(im); }
        if (n >= NEED) { over = true; clearInterval(tick); setTimeout(game.win, 1200); } };
    } },
  { type: "choice", q: "What restaurant is this?", image: "assets/levels/dagwoods.jpg", answers: ["Dag's", "Dag's", "Dag's", "I don't know"], correct: 3 },
  { type: "custom", noskip: true, q: "", // crawl: slow while offscreen, then 50x the moment it is in view; click it
    setup(stage, game) {
      document.fonts.load("64px StarJedi");
      const sky = art(stage.el, "", "", "", { left: 0, top: "-32px", width: "550px", height: "400px", zIndex: 0, background: "#000" });
      for (let i = 0; i < 90; i++) Object.assign(sky.appendChild(document.createElement("i")).style, { position: "absolute", left: Math.random() * 100 + "%", top: Math.random() * 100 + "%", width: 1 + Math.random() * 2 + "px", height: 1 + Math.random() * 2 + "px", background: "#fff", borderRadius: "50%", opacity: .4 + Math.random() * .6 });
      const t = art(stage.el, "", "Click Me", "", { left: 0, width: "550px", top: "420px", zIndex: 2, fontFamily: "StarJedi, Akbar", fontSize: "64px", color: "#ffe81f", background: "none", cursor: "pointer", whiteSpace: "nowrap", transform: "perspective(260px) rotateX(55deg) skewX(-12deg)" });
      const m = SW; game.bgm.volume = 0; // mute (not pause) the theme so it resumes cleanly
       m.currentTime = 0; m.playbackRate = 1; m.play().catch(() => {}); game.cleanup(() => m.pause());
      let y = 518, v = 14, fast = false, seen = 0, last = performance.now(), raf;
      t.style.pointerEvents = "none"; t.style.lineHeight = 1; t.textContent = ""; // only the glyphs are clickable, not the full-width row
      const word = Object.assign(document.createElement("span"), { textContent: "Click Me" }); word.style.cssText = "pointer-events:auto;display:inline-block"; t.append(word);
      word.onclick = () => { cancelAnimationFrame(raf); game.win(); };
      game.cleanup(() => cancelAnimationFrame(raf));
      const step = now => { const dt = (now - last) / 1000; last = now;
        if (y < 368 && !seen) seen = now; // text peeks in: let it be read for 2s, then 50x
        if (!fast && seen && now - seen > 2000) { fast = true; v *= 50; m.playbackRate = 3; }
        y -= v * dt; t.style.top = y + "px";
        y < -90 ? game.lose() : raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    } },
  { type: "custom", noskip: true, q: "Name all the LCC houses", bomb: 60,
    setup(stage, game) {
      const H = ["beveridge", "claxton", "drummond", "french", "harper", "heward", "russel", "woods"], got = new Set();
      const input = Object.assign(document.createElement("input"), { className: "input", autocomplete: "off" }); Object.assign(input.style, { left: "20px", width: "230px", top: "170px" }); stage.el.append(input); input.focus();
      const slots = H.map((h, i) => art(stage.el, "", "", "", { left: 290 + (i % 2) * 130 + "px", top: 90 + (i >> 1) * 62 + "px", width: "120px", height: "50px", border: "4px solid #281efb", background: "#f8caff", boxSizing: "border-box", fontSize: "20px" }));
      input.oninput = () => { const v = input.value.trim().toLowerCase().replace(/^russell$/, "russel"), i = H.indexOf(v);
        if (i < 0 || got.has(i)) return; got.add(i); slots[i].textContent = H[i]; input.value = ""; got.size === 8 && game.win(); };
    } },
  { type: "choice", q: "Which Vibrant Reset song has the most plays on SoundCloud?", answers: ["Dragonhead", "Do I Wanna Know cover", "Do You Miss Me Too", "Junkie"], correct: 1 },
  { type: "choice", q: "HALT. Who are you voting for in the 2028 election?", image: "assets/levels/octopus.jpg", qright: true, correct: 2, answers: ["Democrats", "Republicans", "Octopus Party", "I'm not voting"] },
  { type: "choice", q: "Which one of these men is the Rebbe?", answers: ["img:assets/levels/man-b.jpg", "img:assets/levels/man-c.jpg", "img:assets/levels/man-a.jpg", "img:assets/levels/man-d.jpg"], correct: 2 },
  { type: "custom", q: "How big is Pete?", // hand cursor; a red line marks the cursor height; click in the top 15% of the scroll
    setup(stage, game) {
      const A = stage.el, SH = 352, SW = 92, SX = 440, ST = 8, mk = (tag) => A.appendChild(document.createElement(tag));
      const scroll = mk("img"); scroll.src = "assets/levels/scroll3.png"; scroll.style.cssText = `position:absolute;left:${SX}px;top:${ST}px;width:${SW}px;height:${SH}px;object-fit:contain;pointer-events:none`;
      const line = mk("div"); line.style.cssText = "position:absolute;height:3px;background:#ff1a1a;pointer-events:none;display:none";
      const hand = mk("img"); hand.src = "assets/levels/hand.jpg"; hand.style.cssText = "position:absolute;width:96px;height:62px;mix-blend-mode:multiply;pointer-events:none;display:none";
      const P = A.parentElement; P.style.cursor = "none"; // listen on the whole play area so the hand can slide under the question text
      game.cleanup(() => { P.style.cursor = ""; P.removeEventListener("pointermove", mv); P.removeEventListener("click", ck); });
      let y = null; const pos = e => { const r = A.getBoundingClientRect(), k = r.width / 550; return [(e.clientX - r.left) / k, (e.clientY - r.top) / k]; };
      const mv = e => { let x; [x, y] = pos(e);
        hand.style.cssText += `;display:block;left:${x - 95}px;top:${y - 6}px`; // fingertip on the cursor
        line.style.cssText += `;display:block;left:${x}px;top:${y - 1}px;width:${Math.max(0, SX + 42 - x)}px`; };
      const born = performance.now(); // 1s guard: the click that answered the previous question must not count here
      const ck = e => { if (performance.now() - born < 1000) return; const [, cy] = pos(e); cy >= ST && cy <= ST + SH * .15 ? game.win() : game.lose(); };
      P.addEventListener("pointermove", mv); P.addEventListener("click", ck);
    } },
  { type: "custom", q: "How many particles are there in the universe that we can observe?", // calculator: digits plus a MILLION key; answer is 10 then 9 millions
    setup(stage, game) {
      const A = stage.el; let num = "", mil = 0;
      const mk = (txt, x, y, w, h, fn, fs = 24) => { const b = Object.assign(document.createElement("button"), { className: "btn", textContent: txt, onclick: fn }); Object.assign(b.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px", fontSize: fs + "px" }); A.append(b); return b; };
      const disp = Object.assign(document.createElement("div"), { className: "calc" }); Object.assign(disp.style, { position: "absolute", left: "25px", top: "100px", width: "500px", height: "74px", boxSizing: "border-box", border: "6px solid #281efb", background: "#fff", color: "#000", padding: "4px 10px", textAlign: "right", overflow: "hidden", lineHeight: "1" }); A.append(disp);
      const show = () => { disp.textContent = (num || "0") + " million".repeat(mil); for (let f = 34; f >= 10; f--) { disp.style.fontSize = f + "px"; if (disp.scrollHeight <= disp.clientHeight) break; } }; show(); // biggest font that fits, so it only shrinks when it must
      [..."1234567890"].forEach((d, i) => mk(d, 30 + (i % 5) * 100, 184 + (i >> 2 > 1 ? 1 : i >= 5 ? 1 : 0) * 46, 92, 40, () => { if (num.length < 12 && !mil) num += d; show(); }, 26));
      mk("million", 30, 276, 200, 40, () => { if (num && mil < 20) mil++; show(); }, 26);
      mk("Clear", 240, 276, 120, 40, () => { num = ""; mil = 0; show(); }, 24);
      mk("Enter", 370, 276, 150, 40, () => num === "10" && mil === 9 ? game.win() : game.lose(), 26);
    } },
  // DRAFT: final boss
  { type: "choice", q: "Whose birthday is it?", answers: ["Garfield", "Whomst've", "The Lizard Wizard", "Evan"], correct: 3, bomb: 10 },
  { type: "choice", q: "What was the location of the answer in question 1?", answers: ["This one", "This one", "This one", "This one"], correct: 2 },
  // FINAL BOSS: bullet hell. Mouse/arrows steer the Camry (auto-fires up); hold SPACE to fire (1 dmg per hit) to drop The Wrangler's 100 HP; getting hit costs a life but the fight goes on
  { type: "custom", noskip: true, notape: true, q: "",
    setup(stage, game) {
      const A = stage.el, W = 550, H = 400, cv = Object.assign(document.createElement("canvas"), { width: W, height: H }), c = cv.getContext("2d");
      Object.assign(cv.style, { position: "absolute", left: 0, top: "-32px", zIndex: 0, cursor: "none" }); stage.el.append(cv);
      const img = s => Object.assign(new Image(), { src: "assets/levels/" + s }), WR = img("wrangler.png"), CAM = img("camry.png");
      game.cashSkips(); // unused skips become extra lives for this fight
      game.bgm.volume = 0; RAM.currentTime = 0; RAM.play().catch(() => {}); game.cleanup(() => RAM.pause());
      const P = { x: W / 2, y: 340 }, keys = {}, B = [], M = []; // enemy bullets, my bullets
      let tx = P.x, ty = P.y, t = 0, gone = false, last = performance.now(), raf, inv = 0, spin = 0, cd = 0, mcd = 0, hp = 100, flash = 0, done = false;
      cv.onpointermove = e => { const r = cv.getBoundingClientRect(), k = r.width / W; tx = (e.clientX - r.left) / k; ty = (e.clientY - r.top) / k; };
      const kd = e => { keys[e.key] = true; if (e.key === " ") e.preventDefault(); }, ku = e => keys[e.key] = false; addEventListener("keydown", kd); addEventListener("keyup", ku);
      game.cleanup(() => { removeEventListener("keydown", kd); removeEventListener("keyup", ku); cancelAnimationFrame(raf); });
      const shot = (x, y, a, v, e, r = 8) => B.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, e, r });
      let bt = 0; // boss clock: stops when he dies
      const boss = () => ({ x: W / 2 + 170 * Math.sin(bt * .7), y: 126 });
      const boom = b => { const e = Object.assign(document.createElement("img"), { src: "assets/levels/explosion.gif?" + Date.now() }); Object.assign(e.style, { position: "absolute", height: "230px", left: b.x - 82 + "px", top: b.y - 32 - 115 + "px", zIndex: 6, pointerEvents: "none", mixBlendMode: "multiply" }); A.append(e); setTimeout(() => { gone = true; }, 900); }; // explosion over him, then he vanishes
      function fire(dt) { // three patterns cycle every 9s, speeding up as he weakens
        const b = boss(), ph = Math.floor(t / 9) % 3, f = 1 + (100 - hp) / 100 * .5; cd -= dt;
        if (ph === 0 && cd <= 0) { cd = .95 / f; const a = Math.atan2(P.y - b.y, P.x - b.x); [-.25, 0, .25].forEach(o => shot(b.x, b.y + 30, a + o, 150 * f, "\u{1F40E}")); }
        if (ph === 1 && cd <= 0) { cd = .13 / f; spin += .55; shot(b.x, b.y + 20, spin, 105 * f, "\u{1F40F}"); shot(b.x, b.y + 20, spin + Math.PI, 105 * f, "\u{1F40F}"); }
        if (ph === 2 && cd <= 0) { cd = .2 / f; shot(Math.random() * W, -10, Math.PI / 2, (130 + Math.random() * 70) * f, "\u{1F335}"); }
      }
      function step(now) {
        const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; if (!done) bt += dt; inv -= dt; flash -= dt;
        const v = 260 * dt; if (keys.ArrowLeft || keys.a) tx -= v; if (keys.ArrowRight || keys.d) tx += v; if (keys.ArrowUp || keys.w) ty -= v; if (keys.ArrowDown || keys.s) ty += v;
        tx = Math.max(30, Math.min(W - 30, tx)); ty = Math.max(220, Math.min(H - 40, ty));
        P.x += (tx - P.x) * Math.min(1, dt * 14); P.y += (ty - P.y) * Math.min(1, dt * 14);
        if (!done) { if (t > 1.5) fire(dt); mcd -= dt; if (mcd <= 0 && keys[" "]) { mcd = .13; M.push({ x: P.x, y: P.y - 12 }); } }
        B.forEach(o => { o.x += o.vx * dt; o.y += o.vy * dt; }); M.forEach(o => o.y -= 420 * dt);
        for (let i = B.length - 1; i >= 0; i--) if (B[i].x < -20 || B[i].x > W + 20 || B[i].y > H + 20 || B[i].y < -20) B.splice(i, 1);
        const b = boss();
        for (let i = M.length - 1; i >= 0; i--) { const m = M[i];
          if (!done && Math.abs(m.x - b.x) < 38 && m.y < 196 && m.y > 56) { M.splice(i, 1); hp -= 1; flash = .08; if (hp <= 0) { done = true; B.length = 0; game.sound("bomb"); boom(b); setTimeout(game.win, 2400); } }
          else if (m.y < -10) M.splice(i, 1); }
        if (!done && inv <= 0 && B.some(o => ((o.x - P.x + 5) / (20 + 2)) ** 2 + ((o.y - P.y) / (7 + 2)) ** 2 < 1) /* oval hurtbox inside the car, centred 5px toward the back (20x7 half-axes) plus a 2px bullet core */) { inv = 2; game.hit(); if (game.dead) return; }
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#ff9a4a"); g.addColorStop(.6, "#ffd9a0"); g.addColorStop(1, "#c98a4a"); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = "#a0642c"; c.fillRect(0, 290, W, 110);
        c.save(); if (flash > 0) c.filter = "brightness(2.5)"; c.globalAlpha = gone ? 0 : 1; c.drawImage(WR, b.x - 48 + (flash > 0 ? 3 : 0), 56, 96, 143); c.restore(); // The Wrangler
        c.fillStyle = "#ffe81f"; M.forEach(m => { c.beginPath(); c.roundRect(m.x - 2, m.y - 7, 4, 14, 2); c.fill(); });
        c.font = "20px serif"; c.textAlign = "center"; c.textBaseline = "middle"; B.forEach(o => c.fillText(o.e, o.x, o.y));
        c.save(); if (inv > 0 && Math.floor(inv * 20) % 2) c.globalAlpha = .35; c.drawImage(CAM, P.x - 36, P.y - 16, 72, 32); c.restore(); // the '97 Camry
                c.fillStyle = "#000"; c.fillRect(110, 36, 330, 14); c.fillStyle = "#ff1a1a"; c.fillRect(112, 38, 326 * Math.max(0, hp / 100), 10);
        c.fillStyle = "#fff"; c.font = "16px Akbar"; c.fillText(done ? "YEEHAW!" : "THE WRANGLER", W / 2, 24);
        if (!done && t < 8) { c.fillStyle = "#000"; c.font = "18px Akbar"; c.fillText("HOLD SPACE TO FIRE", 350, 346); }
        raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    } },
];

// END SCREEN (author: replace these two): message under "HAPPY BIRTHDAY EVAN", and an optional image path like "assets/levels/end.jpg" (or "")
export const END_MESSAGE = ""; // the Obama clip (assets/sounds/obama.mp3) plays here instead of text
export const END_IMAGE = "";

export const CAPTIONS = [[0.0, "Hello Evan, this is uh..."], [1.12, "Obama speaking. My fellow American,"], [3.92, "just wanted to wish you"], [5.36, "a happy birthday. You're a"], [6.88, "good kid, I have seen"], [7.8, "you grow up and meet"], [8.76, "every challenge with courage."], [11.7, "It's no surprise that you"], [13.94, "have found great friends in"], [15.16, "Toronto, and a partner ready"], [16.88, "to take on life's thrills"], [18.3, "with you. It has been"], [20.32, "the privilege of my own"], [21.62, "life to be your friend."], [23.68, "Happy 28th birthday"], [25.26, "and remember, when you vape"], [26.6, "with your heart,"], [27.76, "anything is possible."], [29.18, ""]]; // [start seconds, text] for the Obama clip, ~5 words each
