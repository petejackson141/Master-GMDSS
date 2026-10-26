/* Written-answer exams: list of scenarios, Exam mode (15-minute timer, write, then tick the model answer),
   Learn mode (build the answer step by step) and the plain model answer. Progress is saved on this device. */

// ---------- storage ----------
const WKEY = 'mg-written-v1';
function wLoad() { try { const s = JSON.parse(localStorage.getItem(WKEY)); if (s && s.results) { s.drafts = s.drafts || {}; return s; } } catch (e) {} return { results: {}, drafts: {} }; }
function wSave() { try { localStorage.setItem(WKEY, JSON.stringify(W)); } catch (e) {} }
let W = wLoad();

// ---------- helpers ----------
const app = document.getElementById('app');
const EXAM_MIN = 15;
let ticker = null;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nl = s => esc(s).replace(/\n/g, '<br>');
const byId = id => WRITTEN.find(x => x.id === id);
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function stopClock() { clearInterval(ticker); ticker = null; }
function toTop() { window.scrollTo(0, 0); }
function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

// ---------- pieces shared by every view ----------
function paperHtml(ex) {
  return `<div class="paper">
    ${ex.paper.map((l, i) => `<div class="${i ? 'ph2' : 'ph1'}">${esc(l)}</div>`).join('')}
    ${ex.rules.length ? `<div class="rules"><b>Instructions for the Candidate:</b><ol type="a">${ex.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol></div>` : ''}
    ${ex.story.map(p => typeof p === 'string' ? `<p>${nl(p)}</p>` : `<blockquote>“${nl(p.text)}”</blockquote>`).join('')}
  </div>`;
}
function partQ(p) {
  return `<div class="pq"><span class="plabel">${esc(p.label)}</span><div>${nl(p.text)}</div></div>`;
}

// The model answer for one part. With check=true every line gets a tick box (notes never do).
function answerHtml(blocks, check, prefix) {
  let k = 0;
  const box = (html, cls = '') => {
    if (!check) return `<div class="al ${cls}">${html}</div>`;
    const id = `${prefix}-${k++}`;
    return `<label class="al ck ${cls}"><input type="checkbox" data-ck="${id}"><span>${html}</span></label>`;
  };
  const msg = lines => `<div class="msg">${lines.map(l => box(esc(l), 'ml')).join('')}</div>`;
  const notes = ns => (ns || []).map(n => `<div class="anote">${esc(n)}</div>`).join('');
  return blocks.map(b => {
    if (b.step) return `<div class="astep">${box(`<b>${esc(b.step)}</b> ${esc(b.text)}`)}${b.detail ? box(esc(b.detail), 'det') : ''}${b.msg ? msg(b.msg) : ''}${b.list ? `<div class="alist">${b.list.map(x => box(esc(x))).join('')}</div>` : ''}${notes(b.notes)}</div>`;
    if (b.p) return box(esc(b.p));
    if (b.msg) return msg(b.msg);
    if (b.list) return `<div class="alist">${b.list.map(x => box(esc(x))).join('')}</div>`;
    if (b.note) return notes([b.note]);
    if (b.choice) return box(`Circle: <b>${esc(b.choice)}</b>`);
    return '';
  }).join('');
}
function countChecks(ex) {
  return ex.answer.reduce((n, part) => n + part.blocks.reduce((m, b) => {
    if (b.step) return m + 1 + (b.detail ? 1 : 0) + (b.msg || []).length + (b.list || []).length;
    if (b.p || b.choice) return m + 1;
    return m + (b.msg || b.list || []).length;
  }, 0), 0);
}

// ---------- home: the list of scenarios ----------
function home() {
  stopClock();
    app.innerHTML = `<div class="stack">
    <header><h1>Written-answer exams</h1>
      <p class="sub">${WRITTEN.length} scenario exams like the real SRC paper: read the situation, then write the full procedure and radio messages.</p></header>
    <div class="modes">
      <p><b>Exam mode:</b> 15-minute timer. Write your answer, then tick it against the model answer for a score.</p>
      <p><b>Learn mode:</b> build the answer step by step: put the steps in order, then put each radio message together line by line.</p>
      <p class="modes-pick">Pick an exam below, then choose a mode.</p>
    </div>
    ${[['exam', 'Exam papers'], ['practice', 'Practice procedures (course book)']].map(([set, title]) => {
      const list = WRITTEN.filter(x => (x.set || 'exam') === set);
      if (!list.length) return '';
      const n = list.filter(x => W.results[x.id] && W.results[x.id].best != null).length;
      return `<div class="label">${title} · ${n}/${list.length} tried</div>
    <div class="wlist">${list.map(x => {
      const r = W.results[x.id] || {};
      const chip = r.best != null ? `<span class="chip ${r.best >= 75 ? 'pass' : 'fail'}">Best <span class="mono">${r.best}%</span></span>` : '<span class="chip none">Not tried</span>';
      const lr = r.learned ? '<span class="chip learned">Learned</span>' : '';
      const draft = W.drafts[x.id] && W.drafts[x.id].startedAt && !W.drafts[x.id].marked ? '<span class="chip draft">In progress</span>' : '';
      return `<button class="wtile" data-open="${x.id}"><span class="wt"><b>${esc(x.name)}</b><small>${esc(x.what)}</small></span><span class="wchips">${chip}${lr}${draft}</span></button>`;
    }).join('')}</div>`;
    }).join('')}
    <p class="foot">Exam paper answers are from the course answer sheets; practice procedure answers are from the practice procedures answer sheet. Progress is saved in this browser only.</p>
  </div>`;
  app.querySelectorAll('[data-open]').forEach(b => b.onclick = () => go('#' + b.dataset.open));
  toTop();
}

// ---------- one scenario: read it, pick a mode ----------
function overview(ex) {
  stopClock();
  const r = W.results[ex.id] || {};
  const d = W.drafts[ex.id];
  const resume = d && d.startedAt && !d.marked;
  app.innerHTML = `<div class="stack">
    <div class="crumbs"><button class="btn ghost small" id="back">‹ All written exams</button></div>
    <header><h1>${esc(ex.name)}</h1><p class="sub">${esc(ex.what)}${r.best != null ? ` · best score <span class="mono">${r.best}%</span>` : ''}</p></header>
    <div class="card">${paperHtml(ex)}${ex.parts.map(partQ).join('')}</div>
    <div class="choose">
      <button class="btn" id="exam">${resume ? 'Continue exam' : 'Exam mode'}<small>${resume ? 'Your answer and the clock are where you left them' : `${EXAM_MIN} minutes, then mark it yourself`}</small></button>
      <button class="btn alt" id="learn">Learn mode<small>Build the answer step by step</small></button>
      <button class="btn ghost" id="model">Show the model answer</button>
    </div>
  </div>`;
  document.getElementById('back').onclick = () => go('#');
  document.getElementById('exam').onclick = () => go(`#${ex.id}/exam`);
  document.getElementById('learn').onclick = () => go(`#${ex.id}/learn`);
  document.getElementById('model').onclick = () => go(`#${ex.id}/answer`);
  toTop();
}

// ---------- the plain model answer ----------
function modelAnswer(ex) {
  stopClock();
  app.innerHTML = `<div class="stack">
    <div class="crumbs"><button class="btn ghost small" id="back">‹ ${esc(ex.name)}</button></div>
    <header><h1>Model answer</h1><p class="sub">${esc(ex.name)} · ${esc(ex.src || 'from the course answer sheet')}</p></header>
    ${ex.answer.map((a, i) => `<div class="card">${partQ(ex.parts[i])}<div class="ans">${answerHtml(a.blocks, false)}</div></div>`).join('')}
    <div class="choose"><button class="btn" id="exam">Try it in Exam mode</button></div>
  </div>`;
  document.getElementById('back').onclick = () => go('#' + ex.id);
  document.getElementById('exam').onclick = () => go(`#${ex.id}/exam`);
  toTop();
}

// ---------- Exam mode: timer + writing ----------
function exam(ex) {
  stopClock();
  let d = W.drafts[ex.id];
  if (!d || !d.startedAt || d.marked) { d = W.drafts[ex.id] = { startedAt: Date.now(), text: {}, pick: {} }; wSave(); }
  app.innerHTML = `<div class="stack">
    <div class="timerbar" id="tbar"><span class="tl">Time left</span><span class="clock mono" id="clock">15:00</span>
      <span class="trow"><button class="btn ghost small" id="restart">Start over</button><button class="btn small" id="finish">Finish and mark</button></span></div>
    <div id="confirm"></div>
    <div class="card">${paperHtml(ex)}</div>
    ${ex.parts.map(p => `<div class="card">${partQ(p)}${p.options
      ? `<div class="opts">${p.options.map((o, i) => `<label class="opt"><input type="radio" name="pick-${p.label}" value="${i}" ${d.pick[p.label] == i ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`
      : `<textarea class="write" data-part="${esc(p.label)}" rows="10" placeholder="Write your answer for part ${esc(p.label)} here…" spellcheck="false" autocapitalize="characters">${esc(d.text[p.label] || '')}</textarea>`}</div>`).join('')}
    <button class="btn wide" id="finish2">Finish and mark</button>
  </div>`;
  app.querySelectorAll('textarea.write').forEach(t => {
    const fit = () => { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight + 2, 180) + 'px'; };
    t.oninput = () => { d.text[t.dataset.part] = t.value; wSave(); fit(); };
    fit();
  });
  app.querySelectorAll('input[type=radio]').forEach(r => r.onchange = () => { d.pick[r.name.slice(5)] = +r.value; wSave(); });
  const clock = document.getElementById('clock'), bar = document.getElementById('tbar');
  const tick = () => {
    const left = EXAM_MIN * 60 - Math.floor((Date.now() - d.startedAt) / 1000);
    const a = Math.abs(left), t = `${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`;
    clock.textContent = left >= 0 ? t : '+' + t;
    bar.classList.toggle('low', left < 120 && left >= 0);
    bar.classList.toggle('over', left < 0);
    bar.querySelector('.tl').textContent = left >= 0 ? 'Time left' : 'Time’s up · over by';
  };
  tick(); ticker = setInterval(tick, 1000);
  const finish = () => { d.endedAt = Date.now(); d.marked = true; d.ticks = {}; wSave(); go(`#${ex.id}/mark`); };
  document.getElementById('finish').onclick = finish;
  document.getElementById('finish2').onclick = finish;
  document.getElementById('restart').onclick = () => {
    document.getElementById('confirm').innerHTML = `<div class="confirm"><span>Clear your answer and restart the clock?</span><span class="trow"><button class="btn small" id="yes">Start over</button><button class="btn ghost small" id="no">Cancel</button></span></div>`;
    document.getElementById('yes').onclick = () => { delete W.drafts[ex.id]; wSave(); exam(ex); };
    document.getElementById('no').onclick = () => document.getElementById('confirm').innerHTML = '';
  };
  toTop();
}

// ---------- Exam mode: marking against the model answer ----------
function mark(ex) {
  stopClock();
  const d = W.drafts[ex.id];
  if (!d || !d.marked) return go(`#${ex.id}/exam`);
  d.ticks = d.ticks || {};
  const total = countChecks(ex);
  const used = d.endedAt && d.startedAt ? Math.round((d.endedAt - d.startedAt) / 60000) : null;
  app.innerHTML = `<div class="stack">
    <div class="crumbs"><button class="btn ghost small" id="back">‹ ${esc(ex.name)}</button></div>
    <header><h1>Mark your answer</h1><p class="sub">Tick every line of the model answer that you also wrote.${used != null ? ` You took <span class="mono">${used}</span> min.` : ''}</p></header>
    <div class="scorebar" id="sbar"><span><b class="mono" id="sc">0/${total}</b> lines</span><span class="big mono" id="pc">0%</span>
      <span class="trow"><button class="btn ghost small" id="all">Tick all</button><button class="btn ghost small" id="none">Clear</button></span></div>
    ${ex.answer.map((a, i) => {
      const p = ex.parts[i];
      let mine;
      if (p.options) { const k = d.pick[p.label]; mine = k == null ? '<i>No answer</i>' : esc(p.options[k]); }
      else mine = (d.text[p.label] || '').trim() ? nl(d.text[p.label]) : '<i>No answer</i>';
      return `<div class="card">${partQ(p)}
        <div class="two"><div class="mine"><div class="label">Your answer</div><div class="minetext">${mine}</div></div>
        <div class="ans"><div class="label">Model answer · tick what you got</div>${answerHtml(a.blocks, true, i)}</div></div></div>`;
    }).join('')}
    <div class="choose"><button class="btn" id="save">Save score</button><button class="btn ghost" id="again">Try this exam again</button></div>
  </div>`;
  // a circle-the-answer question marks itself
  ex.parts.forEach((p, i) => { if (p.options) { const right = ex.answer[i].blocks.find(b => b.choice); if (right && p.options[d.pick[p.label]] === right.choice) d.ticks[`${i}-0`] = true; } });
  const boxes = [...app.querySelectorAll('[data-ck]')];
  const update = () => {
    const n = boxes.filter(b => b.checked).length, pc = Math.round(n / total * 100);
    document.getElementById('sc').textContent = `${n}/${total}`;
    document.getElementById('pc').textContent = pc + '%';
    document.getElementById('sbar').className = 'scorebar ' + (pc >= 75 ? 'good' : '');
    return pc;
  };
  boxes.forEach(b => {
    b.checked = !!d.ticks[b.dataset.ck];
    b.onchange = () => { d.ticks[b.dataset.ck] = b.checked; wSave(); update(); };
  });
  update();
  document.getElementById('all').onclick = () => { boxes.forEach(b => { b.checked = true; d.ticks[b.dataset.ck] = true; }); wSave(); update(); };
  document.getElementById('none').onclick = () => { boxes.forEach(b => { b.checked = false; d.ticks[b.dataset.ck] = false; }); wSave(); update(); };
  document.getElementById('save').onclick = () => {
    const pc = update(), r = W.results[ex.id] = W.results[ex.id] || {};
    r.last = pc; r.best = Math.max(pc, r.best != null ? r.best : 0); r.at = Date.now();
    wSave();
    document.getElementById('save').textContent = 'Saved ✓';
    setTimeout(() => go('#'), 700);
  };
  document.getElementById('again').onclick = () => { delete W.drafts[ex.id]; wSave(); go(`#${ex.id}/exam`); };
  document.getElementById('back').onclick = () => go('#' + ex.id);
  toTop();
}

// ---------- Learn mode ----------
// Turns the model answer into a list of cards: read the scenario, then for each part
// order the steps, each step with its "why", each radio message put together line by line.
function learnCards(ex) {
  const cards = [{ t: 'story' }];
  ex.parts.forEach((p, i) => {
    const blocks = ex.answer[i].blocks;
    cards.push({ t: 'part', p });
    const steps = blocks.filter(b => b.step);
    if (steps.length > 1) cards.push({ t: 'order', p, title: 'Put the steps in order', items: steps.map(s => KIND_SHORT[s.kind] || s.text) });
    let buf = [];
    const flush = () => {
      if (!buf.length) return;
      const last = cards[cards.length - 1];
      // notes on their own belong to the card before them (for example a note under a radio message)
      if (buf.every(b => b.note) && last && last.p === p && last.t !== 'part') last.notes = (last.notes || []).concat(buf.map(b => b.note));
      else cards.push({ t: 'reveal', p, blocks: buf });
      buf = [];
    };
    blocks.forEach(b => {
      if (b.step) {
        flush();
        cards.push({ t: 'step', p, b });
        if (b.msg) cards.push({ t: 'lines', p, title: 'Put the message together', lead: b.text, items: b.msg });
      } else if (b.msg) {
        flush();
        cards.push({ t: 'lines', p, title: 'Put the message together', items: b.msg, after: true });
      } else if (b.choice) {
        flush();
        cards.push({ t: 'choose', p, answer: b.choice });
      } else buf.push(b);
    });
    flush();
  });
  cards.push({ t: 'done' });
  return cards;
}

function learn(ex, at) {
  stopClock();
  const cards = learnCards(ex);
  const i = Math.max(0, Math.min(at || 0, cards.length - 1));
  const c = cards[i];
  let body = '', ready = true;
  const head = c.p ? `<div class="ptag">Part ${esc(c.p.label)}</div>` : '';
  if (c.t === 'story') body = `<h2>Read the scenario</h2>${paperHtml(ex)}<p class="hint">Pick out the details you will need: name, MMSI, position, what is wrong, how many people on board.</p>`;
  else if (c.t === 'part') body = `${partQ(c.p)}<p class="hint">Think about how you would answer, then go on to build it.</p>`;
  else if (c.t === 'order' || c.t === 'lines') {
    ready = false;
    body = `${head}<h2>${esc(c.title)}</h2>${c.lead ? `<p class="lead">${esc(c.lead)}</p>` : ''}
      <p class="hint">Tap the ${c.t === 'order' ? 'steps' : 'lines'} in the order you would ${c.t === 'order' ? 'do them' : 'say them'}.</p>
      <div class="built ${c.t === 'lines' ? 'msg' : ''}" id="built"></div>
      <div class="pool" id="pool"></div>
      <div class="row"><span class="slips" id="slips"></span><button class="btn ghost small" id="hint">Show next</button></div>
      <div id="after" hidden>${(c.notes || []).map(n => `<div class="anote">${esc(n)}</div>`).join('')}</div>`;
  } else if (c.t === 'step') {
    const why = WHY[c.b.kind];
    body = `${head}<h2>${why ? esc(why.title) : 'Step ' + esc(c.b.step)}</h2>
      <div class="ans">${answerHtml([{ step: c.b.step, text: c.b.text, detail: c.b.detail, list: c.b.list, notes: c.b.notes }], false)}</div>
      ${why ? `<div class="why"><b>Why</b> ${esc(why.text)}</div><div class="sims">${why.sims.map(s => `<a class="btn ghost small" href="${s[1]}">Try it: ${esc(s[0])} ›</a>`).join('')}</div>` : ''}`;
  } else if (c.t === 'reveal') {
    ready = false;
    body = `${head}${partQ(c.p)}<p class="hint">Say or write your answer, then check it.</p>
      <div id="rv" hidden><div class="label">From the answer sheet</div><div class="ans">${answerHtml(c.blocks, false)}</div></div>
      <button class="btn" id="show">Show the answer</button>`;
  } else if (c.t === 'choose') {
    ready = false;
    body = `${head}${partQ(c.p)}<div class="opts">${c.p.options.map((o, k) => `<button class="opt pickable" data-k="${k}"><span>${esc(o)}</span></button>`).join('')}</div><div id="fb" class="fb"></div>`;
  } else if (c.t === 'done') {
    const r = W.results[ex.id] = W.results[ex.id] || {}; r.learned = true; wSave();
    body = `<h2>Well done</h2><p>You have built the whole answer for ${esc(ex.name)}. Now try it from memory, against the clock.</p>
      <div class="choose"><button class="btn" id="toexam">Exam mode</button><button class="btn ghost" id="toans">Show the model answer</button><button class="btn ghost" id="tolist">All written exams</button></div>`;
  }
  app.innerHTML = `<div class="stack">
    <div class="crumbs"><button class="btn ghost small" id="back">‹ ${esc(ex.name)}</button><span class="mono prog">${i + 1}/${cards.length}</span></div>
    <div class="bar"><i style="width:${(i + 1) / cards.length * 100}%"></i></div>
    <div class="card lcard">${body}</div>
    ${c.t !== 'done' ? `<div class="nav"><button class="btn ghost" id="prev" ${i ? '' : 'disabled'}>← Back</button><button class="btn" id="next" ${ready ? '' : 'disabled'}>Next →</button></div>` : ''}
  </div>`;
  const nextBtn = document.getElementById('next');
  const unlock = () => { if (nextBtn) nextBtn.disabled = false; };
  document.getElementById('back').onclick = () => go('#' + ex.id);
  if (document.getElementById('prev')) document.getElementById('prev').onclick = () => go(`#${ex.id}/learn/${i - 1}`);
  if (nextBtn) nextBtn.onclick = () => go(`#${ex.id}/learn/${i + 1}`);

  if (c.t === 'order' || c.t === 'lines') orderGame(c.items, c.t === 'lines', () => { document.getElementById('after').hidden = false; unlock(); });
  if (c.t === 'reveal') document.getElementById('show').onclick = e => { document.getElementById('rv').hidden = false; e.target.remove(); unlock(); };
  if (c.t === 'choose') app.querySelectorAll('.pickable').forEach(b => b.onclick = () => {
    const ok = c.p.options[+b.dataset.k] === c.answer;
    app.querySelectorAll('.pickable').forEach(x => { x.disabled = true; if (c.p.options[+x.dataset.k] === c.answer) x.classList.add('right'); });
    if (!ok) b.classList.add('wrong');
    const fb = document.getElementById('fb'); fb.className = 'fb ' + (ok ? 'ok' : 'no');
    fb.textContent = ok ? 'Correct ✓' : `The answer sheet circles: ${c.answer}`;
    unlock();
  });
  if (c.t === 'done') {
    document.getElementById('toexam').onclick = () => go(`#${ex.id}/exam`);
    document.getElementById('toans').onclick = () => go(`#${ex.id}/answer`);
    document.getElementById('tolist').onclick = () => go('#');
  }
  toTop();
}

// Tap the items in the right order. A wrong tap shakes and counts as a slip; "Show next" places the next one.
function orderGame(items, isMsg, onDone) {
  const built = document.getElementById('built'), pool = document.getElementById('pool'), slipsEl = document.getElementById('slips');
  let pos = 0, slips = 0;
  let order = shuffle(items.map((_, k) => k));
  if (items.length > 1 && order.every((v, k) => v === k)) order.push(order.shift()); // never start already in order
  pool.innerHTML = order.map(k => `<button class="chipline ${isMsg ? 'ml' : ''}" data-k="${k}">${esc(items[k])}</button>`).join('');
  const place = btn => {
    built.insertAdjacentHTML('beforeend', `<div class="placed ${isMsg ? 'ml' : ''}"><span class="n mono">${pos + 1}</span>${esc(items[pos])}</div>`);
    btn.remove(); pos++;
    if (pos === items.length) {
      slipsEl.textContent = slips ? `Done · ${slips} slip${slips > 1 ? 's' : ''}` : 'Done · no slips ✓';
      slipsEl.className = 'slips ' + (slips ? '' : 'ok');
      document.getElementById('hint').remove();
      onDone();
    }
  };
  pool.querySelectorAll('.chipline').forEach(b => b.onclick = () => {
    if (items[+b.dataset.k] === items[pos]) return place(b);   // same text counts as right
    slips++; slipsEl.textContent = `${slips} slip${slips > 1 ? 's' : ''}`; slipsEl.className = 'slips';
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
  });
  document.getElementById('hint').onclick = () => {
    const b = [...pool.querySelectorAll('.chipline')].find(x => items[+x.dataset.k] === items[pos]);
    if (b) { slips++; place(b); if (pos < items.length) { slipsEl.textContent = `${slips} slip${slips > 1 ? 's' : ''}`; slipsEl.className = 'slips'; } }
  };
}

// ---------- routing: #  ·  #id  ·  #id/exam  ·  #id/mark  ·  #id/learn/3  ·  #id/answer ----------
function route() {
  const [id, view, n] = location.hash.replace(/^#/, '').split('/');
  const ex = id && byId(id);
  if (!ex) return home();
  if (view === 'exam') return exam(ex);
  if (view === 'mark') return mark(ex);
  if (view === 'learn') return learn(ex, +n || 0);
  if (view === 'answer') return modelAnswer(ex);
  overview(ex);
}
window.addEventListener('hashchange', route);
route();
