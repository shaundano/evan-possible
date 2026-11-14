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

export const levels = [
  { type: "choice", q: "Which Shaggs song is this?", sound: "levels/shaggs-who-are-parents.mp3", correct: 1,
    answers: ["Philosophy of the World", "Who Are Parents?", "My Pal Foot Foot", "It's Halloween"] },
  { type: "custom", q: "Put the pipe in old Garfield's mouth",
    setup(stage, game) {
      art(stage.el, "garfield.png", "\u{1F431}", "garfield", { left: "300px", top: "70px", width: "200px", height: "200px" });
      const mouth = art(stage.el, "", "", "mouth", { left: "375px", top: "228px", width: "50px", height: "26px" }); // MOUTH hotspot: tweak to match the art
      const pipe = art(stage.el, "pipe.png", "\u{1FA88}", "pipe", { left: "60px", top: "220px", width: "80px", height: "80px" });
      drag(pipe, stage.el, () => inside(pipe, mouth) && game.win());
    } },
  { type: "choice", q: "A bear walks into a bar and orders a grilled ...", answers: ["cheese", "steak", "couple & their dog", "lettuce"], correct: 0 },
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
