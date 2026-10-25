/* Running the quiz: home screen, random exams, topic practice, mistakes list, results (progress saved on this device).
   The 24 fixed exams are still here but hidden (SHOW_FIXED_EXAMS); set it to true to bring them back. */
const SHOW_FIXED_EXAMS = false;
const RANDOM_SIZE = 20, RANDOM_MIN_PER_GROUP = 2;
// ---------- storage ----------
const SKEY = "gmdss-practice-en-v1";
function loadStore() { try { const s = JSON.parse(localStorage.getItem(SKEY)); if (s && s.results) { s.topics = s.topics || {}; s.random = s.random || { taken: 0, passed: 0, best: null, last: null }; return s; } } catch (e) {} return freshStore(); }
function freshStore() { return { results: {}, wrong: [], topics: {}, random: { taken: 0, passed: 0, best: null, last: null } }; }
function saveStore() { try { localStorage.setItem(SKEY, JSON.stringify(store)); } catch (e) {} }
let store = loadStore();
const wid = (e, q) => e + "-" + q;
function markWrong(e, q, isWrong) {
  const id = wid(e, q), i = store.wrong.indexOf(id);
  if (isWrong && i < 0) store.wrong.push(id);
  if (!isWrong && i >= 0) store.wrong.splice(i, 1);
}

// ---------- view ----------
const app = document.getElementById("app");
let quiz = null, timer = null, confirmReset = false;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pct = (c, t) => Math.round(c / t * 100);

function home() {
  clearTimeout(timer); quiz = null;
  const done = Object.keys(store.results).length;
  const passed = Object.values(store.results).filter(r => pct(r.score, r.total) >= PASS).length;
  const nW = store.wrong.length, rs = store.random;
  let tiles = "";
  for (let e = 0; e < EXAMS.length; e++) {
    const r = store.results[e];
    let cls = "", chip = '<span class="chip none">Not taken</span>', meta = `${EXAMS[e].length} questions`;
    if (r) {
      const p = pct(r.score, r.total), ok = p >= PASS;
      cls = ok ? "pass" : "fail";
      chip = `<span class="chip ${cls}">${ok ? "Pass" : "Fail"} · <span class="mono">${p}</span></span>`;
      meta = `<span class="mono">${r.score}/${r.total}</span> correct` + (r.best > r.score ? ` · best <span class="mono">${r.best}</span>` : "");
    }
    tiles += `<button class="tile ${cls}" data-exam="${e}"><span class="t">Exam ${e + 1}</span>${chip}<span class="m">${meta}</span></button>`;
  }
  app.innerHTML = `
  <div class="stack">
    <header>
      <h1>Multiple-choice exams</h1>
      <div class="sub">SRC-GMDSS · Part A/2 · <span class="mono">${UNIQUE.length}</span> questions · pass mark <span class="mono">${PASS}</span></div>
    </header>
    <div class="practice exam-start">
      <div><h2>Random exam</h2><p><span class="mono">${RANDOM_SIZE}</span> questions from the whole bank, spread across every topic. A new mix each time.</p></div>
      <button class="btn" id="random">Start exam</button>
    </div>
    <div class="stats">
      <div class="stat"><b>${rs.taken}</b><span>Exams taken</span></div>
      <div class="stat"><b style="color:var(--ok)">${rs.passed}</b><span>Passed</span></div>
      <div class="stat"><b>${rs.best == null ? "—" : rs.best}</b><span>Best score</span></div>
    </div>
    <div class="practice">
      <div><h2>Mistake practice</h2><p>${nW ? `<span class="mono">${nW}</span> questions you got wrong. Answer one correctly and it leaves the list.` : "Questions you get wrong in exams and topic practice will appear here."}</p></div>
      <button class="btn" id="practice" ${nW ? "" : "disabled"}>Start practice</button>
    </div>
    <div class="label">Question banks by topic</div>
    <div class="grid">${topicTiles()}</div>
    ${SHOW_FIXED_EXAMS ? `<div class="label">Exams</div><div class="grid">${tiles}</div>` : ""}
    <div id="resetBox">${confirmReset
      ? `<div class="confirm row"><span>Delete all scores and the mistakes list?</span><button class="btn small" id="doReset">Delete</button><button class="btn ghost small" id="noReset">Cancel</button></div>`
      : `<button class="btn ghost small" id="reset">Reset progress</button>`}</div>
    <div class="foot">Progress is saved in this browser only.</div>
  </div>`;
  app.querySelectorAll("[data-exam]").forEach(b => b.onclick = () => startExam(+b.dataset.exam));
  app.querySelectorAll("[data-topic]").forEach(b => b.onclick = () => startTopic(b.dataset.topic));
  const p = document.getElementById("practice"); if (p) p.onclick = startPractice;
  document.getElementById("random").onclick = startRandom;
  const r = document.getElementById("reset"); if (r) r.onclick = () => { confirmReset = true; home(); };
  const d = document.getElementById("doReset"); if (d) d.onclick = () => { store = freshStore(); saveStore(); confirmReset = false; home(); };
  const n = document.getElementById("noReset"); if (n) n.onclick = () => { confirmReset = false; home(); };
  window.scrollTo(0, 0);
}

function topicTiles() {
  return TOPICS.map(t => {
    const r = store.topics[t.id], n = BANK[t.id].length;
    let cls = "", chip = `<span class="chip none"><span class="mono">${n}</span> questions</span>`, meta = esc(t.note);
    if (r) {
      const p = pct(r.score, r.total), ok = p >= PASS;
      cls = ok ? "pass" : "fail";
      chip = `<span class="chip ${cls}">${ok ? "Pass" : "Fail"} · <span class="mono">${p}</span></span>`;
      meta = `<span class="mono">${r.score}/${r.total}</span> correct · <span class="mono">${n}</span> questions`;
    }
    return `<button class="tile ${cls}" data-topic="${t.id}"><span class="t">${esc(t.name)}</span>${chip}<span class="m">${meta}</span></button>`;
  }).join("");
}
function startTopic(id) { quiz = { mode: "topic", topic: id, list: shuffle(BANK[id].slice()), i: 0, picks: [] }; confirmReset = false; question(); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// ---------- random exam: 20 questions from the whole pool, spread over every topic ----------
// Each question gets one group: its rarest topic if it has several (so small topics still get their share),
// or "general" if it has none (AIS, GMDSS basics, publications).
const GROUPS = (() => {
  const g = {};
  TOPICS.forEach(t => g[t.id] = []); g.general = [];
  UNIQUE.forEach(Q => {
    const tags = TOPICS.filter(t => BANK[t.id].includes(Q)).sort((a, b) => BANK[a.id].length - BANK[b.id].length);
    g[tags.length ? tags[0].id : "general"].push(Q);
  });
  return g;
})();
const GROUP_NAME = id => id === "general" ? "General GMDSS" : TOPICS.find(t => t.id === id).name;
function topicOf(Q) {
  for (const id in GROUPS) if (GROUPS[id].includes(Q)) return GROUP_NAME(id);
  return "";
}
function buildRandom() {
  const ids = Object.keys(GROUPS).filter(id => GROUPS[id].length);
  const quota = {}; let used = 0;
  ids.forEach(id => { quota[id] = Math.min(RANDOM_MIN_PER_GROUP, GROUPS[id].length); used += quota[id]; });
  // share the rest by group size (largest remainder), never more than a group has
  const total = ids.reduce((n, id) => n + GROUPS[id].length, 0), rest = RANDOM_SIZE - used;
  const share = ids.map(id => ({ id, x: rest * GROUPS[id].length / total }));
  share.forEach(o => { const add = Math.min(Math.floor(o.x), GROUPS[o.id].length - quota[o.id]); quota[o.id] += add; used += add; });
  share.sort((a, b) => (b.x - Math.floor(b.x)) - (a.x - Math.floor(a.x)));
  for (let i = 0; used < RANDOM_SIZE && i < share.length * 3; i++) { const o = share[i % share.length]; if (quota[o.id] < GROUPS[o.id].length){ quota[o.id]++; used++; } }
  let list = [];
  ids.forEach(id => { list = list.concat(shuffle(GROUPS[id].slice()).slice(0, quota[id])); });
  return shuffle(list);
}
function startRandom() { quiz = { mode: "random", list: buildRandom(), i: 0, picks: [] }; confirmReset = false; question(); }

function startExam(e) { quiz = { mode: "exam", e, list: EXAMS[e], i: 0, picks: [] }; confirmReset = false; question(); }
function startPractice() {
  const list = store.wrong.map(id => { const [e, q] = id.split("-").map(Number); return EXAMS[e][q]; });
  quiz = { mode: "practice", list: shuffle(list), i: 0, picks: [] }; confirmReset = false; question();
}

function question() {
  clearTimeout(timer);
  const z = quiz, Q = z.list[z.i], n = z.list.length;
  const good = z.picks.filter(p => p && p.ok).length, bad = z.picks.filter(p => p && !p.ok).length;
  const left = n - good - bad;
  const dots = z.list.map((_, j) => { const p = z.picks[j]; return `<button class="dot${p ? (p.ok ? " ok" : " no") : ""}${j === z.i ? " cur" : ""}" data-go="${j}" aria-label="Question ${j + 1}">${j + 1}</button>`; }).join("");
  const title = z.mode === "exam" ? `Exam ${z.e + 1}` : z.mode === "random" ? "Random exam" : z.mode === "topic" ? `Topic: ${TOPICS.find(t => t.id === z.topic).name}` : "Mistake practice";
  const num = z.mode === "exam" ? Q.q + 1 : z.i + 1;
  const src = z.mode === "random" || z.mode === "practice" ? ` · ${topicOf(Q)}` : "";
  app.innerHTML = `
  <div class="stack">
    <div class="top"><h2>${title}</h2><div class="row"><button class="btn ghost small" id="end">Finish</button><button class="btn ghost small" id="exit">Exit</button></div></div>
    <div id="endBox"></div>
    <div class="top"><span class="mono">${z.i + 1}/${n}</span><span class="tally"><span class="g">✓ ${good}</span><span class="r">✗ ${bad}</span></span></div>
    <div class="bar"><i style="width:${(good + bad) / n * 100}%"></i></div>
    <div class="card">
      <div class="qnum">Question ${num}${src}</div>
      <div class="qtext">${esc(Q.text)}</div>
      <div class="opts">${Q.opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="l">${L[k]}</span><span class="tx">${esc(o)}</span></button>`).join("")}</div>
      <div class="fb" id="fb"></div>
      <div class="nav">
        <button class="btn ghost small" id="prev" ${z.i === 0 ? "disabled" : ""}>← Previous</button>
        <button class="btn ghost small" id="fwd" ${z.i === n - 1 ? "disabled" : ""}>Next →</button>
      </div>
    </div>
    <div class="dots">${dots}</div>
  </div>`;
  document.getElementById("exit").onclick = home;
  document.getElementById("end").onclick = () => {
    if (!left) return finish();
    document.getElementById("endBox").innerHTML = `<div class="confirm row"><span><span class="mono">${left}</span> questions are still unanswered. They will count as wrong in the score.</span><button class="btn small" id="endYes">Finish anyway</button><button class="btn ghost small" id="endNo">Keep answering</button></div>`;
    document.getElementById("endYes").onclick = finish;
    document.getElementById("endNo").onclick = () => document.getElementById("endBox").innerHTML = "";
  };
  document.getElementById("prev").onclick = () => go(z.i - 1);
  document.getElementById("fwd").onclick = () => go(z.i + 1);
  app.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(+b.dataset.go));
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => answer(+b.dataset.k));
  if (z.picks[z.i]) showAnswer(z.picks[z.i]);
  window.scrollTo(0, 0);
}

function go(j) { if (!quiz || j < 0 || j >= quiz.list.length) return; quiz.i = j; question(); }

function showAnswer(p) {
  const Q = p.Q;
  app.querySelectorAll(".opt").forEach((b, i) => {
    b.disabled = true;
    if (i === Q.ans) b.classList.add("right");
    else if (i === p.k) b.classList.add("wrong");
    else b.classList.add("dim");
  });
  const fb = document.getElementById("fb");
  fb.className = "fb " + (p.ok ? "ok" : "no");
  fb.innerHTML = `<span>${p.ok ? "Correct ✓" : `Incorrect. The correct answer is ${L[Q.ans]}`}</span>`;
  if (!p.ok && Q.expl) fb.insertAdjacentHTML("afterend", `<div class="expl"><b>Explanation:</b> ${esc(Q.expl)}</div>`);
}

function answer(k) {
  const z = quiz, Q = z.list[z.i];
  if (z.picks[z.i]) return;
  const p = { Q, k, ok: k === Q.ans };
  z.picks[z.i] = p;
  markWrong(Q.e, Q.q, !p.ok); saveStore();
  question();
  // wrong answers wait for the reader; only correct ones auto-advance
  if (p.ok || !Q.expl) timer = setTimeout(next, p.ok ? 900 : 2200);
  else {
    const fb = document.getElementById("fb");
    fb.insertAdjacentHTML("beforeend", `<button class="btn small" id="cont">Continue →</button>`);
    document.getElementById("cont").onclick = next;
  }
}

// after answering: go to the next unanswered question, finish when none are left
function next() {
  clearTimeout(timer);
  if (!quiz) return;
  const n = quiz.list.length;
  for (let s = 1; s <= n; s++) { const j = (quiz.i + s) % n; if (!quiz.picks[j]) return go(j); }
  finish();
}

function finish() {
  clearTimeout(timer);
  const z = quiz, total = z.list.length, score = z.picks.filter(p => p && p.ok).length, p = pct(score, total);
  const skipped = total - z.picks.filter(Boolean).length;
  let head;
  if (z.mode === "exam") {
    const prev = store.results[z.e];
    store.results[z.e] = { score, total, best: Math.max(score, prev ? prev.best || prev.score : 0), at: Date.now() };
    saveStore();
    const ok = p >= PASS;
    head = `<div class="card result"><div class="label">Exam ${z.e + 1}</div>
      <div class="big" style="color:var(${ok ? "--ok" : "--bad"})">${p}</div>
      <div class="sub"><span class="mono">${score}/${total}</span> correct answers</div>
      <div class="verdict ${ok ? "pass" : "fail"}">${ok ? "Pass" : "Fail"}</div></div>`;
  } else if (z.mode === "random") {
    const ok = p >= PASS, r = store.random;
    r.taken++; if (ok) r.passed++; r.best = r.best == null ? p : Math.max(r.best, p); r.last = { score, total, at: Date.now() };
    saveStore();
    const by = {};
    z.list.forEach((Q, j) => { const t = topicOf(Q); by[t] = by[t] || { n: 0, ok: 0 }; by[t].n++; if (z.picks[j] && z.picks[j].ok) by[t].ok++; });
    head = `<div class="card result"><div class="label">Random exam</div>
      <div class="big" style="color:var(${ok ? "--ok" : "--bad"})">${p}</div>
      <div class="sub"><span class="mono">${score}/${total}</span> correct answers</div>
      <div class="verdict ${ok ? "pass" : "fail"}">${ok ? "Pass" : "Fail"}</div></div>
      <div class="label">By topic</div><div class="bytopic">${Object.keys(by).map(t => `<div class="${by[t].ok === by[t].n ? "all" : by[t].ok ? "" : "none"}"><span>${esc(t)}</span><b class="mono">${by[t].ok}/${by[t].n}</b></div>`).join("")}</div>`;
  } else if (z.mode === "topic") {
    const t = TOPICS.find(t => t.id === z.topic);
    store.topics[z.topic] = { score, total, at: Date.now() };
    saveStore();
    const ok = p >= PASS;
    head = `<div class="card result"><div class="label">Topic: ${esc(t.name)}</div>
      <div class="big" style="color:var(${ok ? "--ok" : "--bad"})">${p}</div>
      <div class="sub"><span class="mono">${score}/${total}</span> correct answers</div>
      <div class="verdict ${ok ? "pass" : "fail"}">${ok ? "Pass" : "Fail"}</div></div>`;
  } else {
    head = `<div class="card result"><div class="label">Mistake practice</div>
      <div class="big">${score}/${total}</div>
      <div class="sub">${score} questions removed from the list · <span class="mono">${store.wrong.length}</span> left</div></div>`;
  }
  if (skipped) head += `<div class="sub" style="text-align:center"><span class="mono">${skipped}</span> questions were left unanswered and counted as wrong</div>`;
  const wrongs = z.picks.filter(x => x && !x.ok);
  const review = wrongs.length ? `<div class="label">Questions you got wrong (${wrongs.length})</div><div class="review">${wrongs.map(x => `
    <div class="rv"><div class="q">${z.mode === "exam" ? x.Q.q + 1 : z.list.indexOf(x.Q) + 1}. ${esc(x.Q.text)}</div>
    <div class="y">✗ ${L[x.k]}. ${esc(x.Q.opts[x.k])}</div>
    <div class="c">✓ ${L[x.Q.ans]}. ${esc(x.Q.opts[x.Q.ans])}</div>${x.Q.expl ? `<div class="expl"><b>Explanation:</b> ${esc(x.Q.expl)}</div>` : ""}</div>`).join("")}</div>` : "";
  const again = z.mode === "exam" ? `<button class="btn" id="again">Retake exam ${z.e + 1}</button>`
    : z.mode === "random" ? `<button class="btn" id="again">New random exam</button>`
    : z.mode === "topic" ? `<button class="btn" id="again">Retake this topic</button>`
    : (store.wrong.length ? `<button class="btn" id="again">Another mistakes round</button>` : "");
  app.innerHTML = `<div class="stack">${head}
    <div class="row">${again}${z.mode === "random" && store.wrong.length ? `<button class="btn ghost" id="mist">Practise my mistakes (${store.wrong.length})</button>` : ""}<button class="btn ghost" id="back">Back</button></div>${review}</div>`;
  const a = document.getElementById("again");
  if (a) a.onclick = () => z.mode === "exam" ? startExam(z.e) : z.mode === "random" ? startRandom() : z.mode === "topic" ? startTopic(z.topic) : startPractice();
  const m = document.getElementById("mist"); if (m) m.onclick = startPractice;
  document.getElementById("back").onclick = home;
  window.scrollTo(0, 0);
}

home();
