/* NAVTEX simulator: page wiring, incoming messages, free practice, exercises and the decoding quiz.
   The simulator is only about receiving: messages reach the aerial on their own and the receiver's settings decide what prints. */

(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.random() * a.length | 0];
  const PKEY = 'mg-navtex-progress';
  let prog = {}; try { prog = JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) {}
  const saveProg = () => { try { localStorage.setItem(PKEY, JSON.stringify(prog)); } catch (e) {} };

  // ---------- receiver keys ----------
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-k]'); if (b) { RX.key(b.dataset.k); return; }
    const d = e.target.closest('[data-doc]'); if (d) openDoc(d.dataset.doc);
  });
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,select,textarea') || e.metaKey || e.ctrlKey || e.altKey || $('#docdlg').open) return;
    const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'enter', Escape: 'menu', d: 'displ', D: 'displ' }[e.key];
    if (!m) return;
    if (e.key === 'Enter' && e.target.closest('button,a')) return; // let Enter press the focused button
    e.preventDefault(); RX.key(m);
  });

  // ---------- incoming messages ----------
  // Free practice: while the set is on, a message reaches the aerial every so often.
  let freeT = null;
  function freeTraffic(run) {
    clearInterval(freeT); freeT = null;
    if (run) freeT = setInterval(() => { if (RX.isOn) RX.incoming(pick(NX.traffic)); }, 25000);
  }
  // Exercises: when the current step is waiting for a message, it arrives a few seconds later,
  // and again every few seconds (the next broadcast) until the step is done.
  let arrT = null, arrKey = '';
  function stopArrivals() { clearTimeout(arrT); arrT = null; arrKey = ''; }
  function arrivals() {
    const i = cur ? cur.done.indexOf(false) : -1, step = i >= 0 ? cur.ex.steps[i] : null;
    if (!step || !step.bc) return stopArrivals();
    const key = cur.i + ':' + i; if (key === arrKey) return;
    stopArrivals(); arrKey = key; let n = 0;
    const tick = () => { if (arrKey !== key) return; RX.incoming(step.bc[n++ % step.bc.length]); if (arrKey === key) arrT = setTimeout(tick, 8000); };
    arrT = setTimeout(tick, 3000);
  }

  RX.on((type, d) => {
    if (type === 'received' && window.innerWidth < 980) $('.unit').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (tab === 'free' && type !== 'render') drawFree();
    if (tab === 'ex' && cur && type !== 'render') exEvent(type, d);
  });

  // ---------- docs ----------
  function openDoc(which) {
    $('#dlgbody').innerHTML = which === 'map' ? DOCS.map() : DOCS.book();
    const dl = $('#docdlg'); if (dl.showModal) dl.showModal(); else dl.setAttribute('open', '');
  }

  // ---------- tabs ----------
  let tab = 'free';
  $$('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  function setTab(t) {
    tab = t; $$('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t));
    freeTraffic(t === 'free'); if (t !== 'ex') stopArrivals();
    if (t === 'free') { cur = null; drawFree(); }
    if (t === 'ex') { cur ? drawEx() : drawExList(); }
    if (t === 'quiz') { cur = null; startQuiz(); }
  }

  // ---------- free practice ----------
  function drawFree() {
    const s = RX.state;
    const ign = s.tyIgnore.length ? s.tyIgnore.join(', ') : 'none';
    $('#panel').innerHTML = `<h2>Free practice</h2>
      <p>Use the receiver like the real set: switch on with <b>Power</b>, set it up with <b>MENU</b>, read stored messages with <b>DISPL</b>. While it is on, new messages come in every so often. Your settings decide which ones print.</p>
      <h3>Receiver now</h3>
      <ul>
        <li>Power: <b>${RX.isOn ? 'on' : 'off'}</b> · Frequency: <b>${s.freq} kHz</b></li>
        <li>Stations: <b>${s.stMode === 'auto' ? 'AUTO (' + NX.autoStations.join(', ') + ')' : 'MANUAL' + (s.stIgnore.length ? ', ignoring ' + s.stIgnore.join(', ') : ', all letters')}</b></li>
        <li>Message types ignored: <b>${ign}</b></li>
        <li>Alarm: <b>${s.alarm ? 'on' : 'off'}</b> · Error rate limit: <b>${s.err.toFixed(1)}%</b></li>
        <li>Messages in memory: <b>${s.log.length}</b>${s.log.some(m => m.isNew) ? ` (${s.log.filter(m => m.isNew).length} new)` : ''}</li>
      </ul>
      <h3>Things to try</h3>
      <ul>
        <li>Read the SAR message <b>PD00</b> in the message log.</li>
        <li>Switch off pilot messages (F). The Haifa pilot message <b>PF10</b> won't print when it comes in.</li>
        <li>Try to switch off navigational warnings (A). Why can't you?</li>
        <li>The garbled warning <b>PA25</b> isn't kept. Raise the error rate and wait for it to come in again.</li>
        <li>Switch to MANUAL station selection to get messages from stations further away, like Iraklion (H).</li>
      </ul>
      <div class="row"><button class="btn" data-doc="book">Instruction book</button><button class="btn" data-doc="map">Station map</button><button class="btn" id="resetRx">Reset receiver</button></div>`;
    $('#resetRx').onclick = () => { if (confirm('Reset the receiver to how it came out of the box? Stored messages and settings go back to the start.')) RX.reset(); };
  }

  // ---------- exercises ----------
  const isOn = () => RX.isOn, S = () => RX.state;
  const EX = [
    { id: 'start', title: 'Switch on and self-test', sub: 'Power, TEST, STATUS, DIM',
      scenario: "You've just come aboard. Before you rely on the NAVTEX, check that it works and see how it is set up.",
      steps: [
        { t: 'Switch the receiver on.', hint: 'Press Power.', ok: c => isOn() },
        { t: 'Run the self-test.', hint: 'MENU › SYSTEM MENU › TEST. Move with ▼, choose with ENTER.', ok: c => c.has('test') },
        { t: 'Check how the set is programmed.', hint: 'Press MENU to leave the test, then choose STATUS.', ok: c => c.has('status') },
        { t: 'Dim the screen for night use, then back to full brightness.', hint: 'Press DIM three times.', ok: c => c.count('dim') >= 3 }
      ],
      qs: [
        { q: 'The status page lists the message types the set receives. Which of them can you never switch off?', o: ['A, B, D and L', 'A, B, C and D', 'Only D', 'All of them can be switched off'], ex: 'Navigational warnings (A), meteorological warnings (B), search and rescue information (D) and additional navigational warnings (L) are always received.' },
        { q: 'Which frequency carries the international NAVTEX broadcasts in English?', o: ['518 kHz', '490 kHz', '4209.5 kHz', '2182 kHz'], ex: '518 kHz: English, international. 490 kHz: local language. 4209.5 kHz: tropical zone.' }
      ] },
    { id: 'prep', title: 'Prepare for a passage', sub: 'Delete old messages, 518 kHz, AUTO, alarm',
      scenario: "Tomorrow you sail from Herzliya to Limassol. Last trip's messages are still in memory. Set the receiver up and let it collect the latest messages.",
      steps: [
        { t: 'Switch the receiver on.', hint: 'Press Power.', ok: c => isOn() },
        { t: 'Delete all the old messages.', hint: 'MENU › SYSTEM MENU › DELETE ALL MSGS › YES › ENTER.', ok: c => c.has('deleteAll') || c.has('allClear') },
        { t: 'Set the frequency to 518 kHz.', hint: 'Press FRQ, choose 518 with ▲▼, press ENTER.', ok: c => c.has('setting', d => d.what === 'freq' && d.value === 518) && S().freq === 518 },
        { t: 'Set station selection to AUTO.', hint: 'MENU › STATION SELECTION › AUTO › ENTER.', ok: c => c.has('setting', d => d.what === 'stMode' && d.value === 'auto') && S().stMode === 'auto' },
        { t: 'Make sure the alarm is on.', hint: 'MENU › FUNCTIONS › RCVR ALARM › ON › ENTER.', ok: c => c.has('screen', d => d.screen === 'alarm') && S().alarm },
        { t: 'Receive the latest messages PA24 and MB03.', hint: 'They come in on their own once the receiver is set up. Watch the screen.', bc: ['PA24', 'MB03'], ok: c => c.has('received', d => d.id === 'PA24') && c.has('received', d => d.id === 'MB03') }
      ],
      qs: [
        { q: 'How long before sailing do the course notes say to switch NAVTEX on?', o: ['4–12 hours, to get a full round of broadcasts', '10 minutes', 'Only once you are at sea', 'Exactly 24 hours'], ex: 'Each station transmits every 4 hours, so leaving it on 4–12 hours catches a full round of messages.' },
        { q: 'Which station sent MB03?', o: ['Cyprus (M)', 'Haifa (P)', 'Antalya (F)', 'Iraklion (H)'], ex: 'B1, the first letter after ZCZC, is the station: M = Cyprus.' },
        { q: 'Roughly how far out can you receive NAVTEX?', o: ['About 400 NM', 'About 40 NM', 'About 1,000 NM', 'Only in sight of the station'], ex: 'About 400 NM, with the longest range at night.' }
      ] },
    { id: 'filter', title: 'Filter what you receive', sub: 'Message selection: Ignore and the fixed types',
      scenario: "You're not going into Haifa port, so you don't need pilot messages. Switch them off, and find out what the set won't let you switch off.",
      steps: [
        { t: 'Switch the receiver on.', hint: 'Press Power.', ok: c => isOn() },
        { t: 'Set pilot service messages (F) to Ignore.', hint: 'MENU › MESSAGE SELECTION. Press ▶ until F, choose Ignore with ▼, press ENTER.', ok: c => S().tyIgnore.includes('F') },
        { t: 'Try to switch off meteorological warnings (B).', hint: 'In MESSAGE SELECTION press ◀ until B, then ENTER. It stays on Receive.', ok: c => c.has('fixedType', d => d.type === 'B') || c.has('screen', d => d.screen === 'tyList' && d.i === 1) },
        { t: 'Wait for PF10, a Haifa pilot message, to come in.', hint: 'It arrives in a few seconds. Does it print?', bc: ['PF10'], ok: c => c.has('rejected', d => d.id === 'PF10' && d.code === 'type') },
        { t: 'Wait for PL05, an additional navigational warning.', hint: 'It arrives in a few seconds.', bc: ['PL05'], ok: c => c.has('received', d => d.id === 'PL05') || c.has('rejected', d => d.id === 'PL05' && d.code === 'dup') }
      ],
      qs: [
        { q: "Why wasn't PF10 printed?", o: ['Type F (pilot) is set to Ignore', 'Haifa is out of range', 'It had too many errors', 'Wrong frequency'], ex: 'You switched type F off in Message Selection.' },
        { q: 'Which message types can never be switched off?', o: ['A, B, D and L', 'A, B, C and E', 'D only', 'E and F'], ex: 'A, B, D and L are always received.' },
        { q: 'Which type is it recommended NOT to switch off, even though you can?', o: ['E: meteorological forecasts', 'F: pilot messages', 'G: Decca messages', 'Z: no message on hand'], ex: 'The course notes: E, recommended not to delete.' }
      ] },
    { id: 'manage', title: 'Find, read and delete a message', sub: 'DISPL, open, DELETE MSG',
      scenario: 'A crew member asks where the buoy that is off station is. Find the warning, read it, then delete it once you have plotted it.',
      steps: [
        { t: 'Switch the receiver on.', hint: 'Press Power.', ok: c => isOn() },
        { t: 'Make sure PA24 is in memory.', hint: 'If it is not in the DISPL list, wait: it is sent again and will come in.', bc: ['PA24'], ok: c => !!RX.findMsg('PA24') || c.has('deleted', d => d.id === 'PA24') },
        { t: 'Open PA24 from the message list.', hint: 'Press DISPL, ▼ to PA24, ENTER.', ok: c => c.has('openMsg', d => d.id === 'PA24') },
        { t: 'Delete PA24, and only PA24.', hint: 'MENU › SYSTEM MENU › DELETE MSG, ▼ to PA24, ENTER.', ok: c => c.has('deleted', d => d.id === 'PA24') && !c.has('deleteAll') }
      ],
      qs: [
        { q: 'Where is the buoy that is off station?', o: ['32.52N 034.58E, in Haifa Bay', '33.45N 029.55E', '35.26N 033.57E', '32.44N 034.21E'], ex: 'PA24: HAIFA BAY. LIGHT BUOY NR 3 IN POSITION 32.52N 034.58E OFF STATION.' },
        { q: 'When is DELETE ALL MSGS most useful?', o: ['At the start of a new passage', 'Every hour', 'Never', 'After every SAR message'], ex: 'The instructions recommend it when starting a passage.' }
      ] },
    { id: 'cer', title: 'Error rate (CER)', sub: 'Garbled messages and the error limit',
      scenario: 'PA25 keeps arriving garbled. See how the error-rate limit decides what is kept.',
      steps: [
        { t: 'Switch the receiver on.', hint: 'Press Power.', ok: c => isOn() },
        { t: 'Let PA25 come in with the limit at 4.9%.', hint: 'Check the limit in MENU › FUNCTIONS › ERROR RATE. PA25 arrives in a few seconds. Does it print?', bc: ['PA25'], ok: c => c.has('rejected', d => d.id === 'PA25' && d.code === 'cer') },
        { t: 'Raise the error rate to 7.5% or more.', hint: 'MENU › FUNCTIONS › ERROR RATE, ▲ to raise it, ENTER.', ok: c => S().err >= 7.5 || c.has('received', d => d.id === 'PA25') },
        { t: 'Wait for PA25 to come in again, and read it.', hint: 'It is sent again in a few seconds.', bc: ['PA25'], ok: c => c.has('received', d => d.id === 'PA25') },
        { t: 'Set the error rate back to 4.9%.', hint: 'MENU › FUNCTIONS › ERROR RATE, ▼ to 4.9, ENTER. (Or SYSTEM MENU › DEFAULT SETTING.)', ok: c => c.has('received', d => d.id === 'PA25') && Math.abs(S().err - 4.9) < 0.05 }
      ],
      qs: [
        { q: 'What does CER stand for?', o: ['Character Error Rate', 'Coast Emergency Relay', 'Channel Error Report', 'Coverage Estimate Range'], ex: 'The share of characters the receiver could not decode.' },
        { q: 'PA25 came in with stars, like HA*FA. What do the stars mean?', o: ['Characters the receiver could not decode', 'Important words', 'A VITAL message', 'The end of the message'], ex: 'Each * is a character lost to interference.' },
        { q: 'With the default setting, what happens to a message with 5% errors or more?', o: ['It is not kept, and is received again at the next broadcast', 'It is printed and stored', 'It is saved to the PC', 'It is stored as NEW'], ex: '≤4.9% kept (delete it yourself if unreadable); 5%+ not kept.' }
      ] }
  ];

  let cur = null; // { ex, ev:[], done:[], qi, answers:[], hints }
  let hints = true;
  function ctx() {
    const ev = cur.ev;
    return {
      has: (t, f) => ev.some(e => e.type === t && (!f || f(e.d))),
      count: t => ev.filter(e => e.type === t).length,
      after: (fa, t, f) => { const i = ev.findIndex(e => (e.type === 'received' || e.type === 'rejected') && fa(e.d)); return i >= 0 && ev.slice(i + 1).some(e => e.type === t && (!f || f(e.d))); }
    };
  }
  function evalSteps() {
    const c = ctx(); let changed = false;
    cur.ex.steps.forEach((s, i) => {
      if (cur.done[i]) return;
      const prevDone = cur.done.slice(0, i).every(Boolean);
      if (prevDone && s.ok(c)) { cur.done[i] = true; changed = true; }
    });
    // a later step may now pass because an earlier one just did
    if (changed) evalSteps();
    return changed;
  }
  function exEvent(type, d) {
    cur.ev.push({ type, d });
    const before = cur.done.filter(Boolean).length;
    evalSteps();
    if (cur.done.filter(Boolean).length !== before || ['screen'].indexOf(type) < 0) drawEx();
  }

  function drawExList() {
    stopArrivals();
    $('#panel').innerHTML = `<h2>Exercises</h2><p>Each exercise gives you a situation and a few tasks on the receiver. Ticks appear as you do them. Then a few questions check you understood what happened.</p>
      <div class="exlist">${EX.map((e, i) => `<button class="excard" data-ex="${i}"><span class="n">${i + 1}</span><b>${esc(e.title)}</b><small>${esc(e.sub)}</small>${prog[e.id] ? `<span class="ok" title="Best score">✓ ${prog[e.id]}</span>` : '<span></span>'}</button>`).join('')}</div>`;
    $$('[data-ex]').forEach(b => b.onclick = () => startEx(+b.dataset.ex));
  }
  function startEx(i) {
    const ex = EX[i];
    cur = { i, ex, ev: [], done: ex.steps.map(() => false), qi: -1, answers: [] };
    evalSteps(); drawEx();
    $('#panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function drawEx() {
    const ex = cur.ex, allDone = cur.done.every(Boolean);
    const firstOpen = cur.done.indexOf(false);
    if (allDone && cur.qi < 0) cur.qi = 0;
    let qhtml = '';
    if (allDone) {
      if (cur.qi < ex.qs.length) {
        const q = ex.qs[cur.qi]; if (!q.sh) q.sh = shuffle(q.o.map((t, k) => ({ t, k })));
        const a = cur.answers[cur.qi];
        qhtml = `<div class="q"><h3>Question ${cur.qi + 1} of ${ex.qs.length}</h3><p class="qt">${esc(q.q)}</p><div class="opts">${q.sh.map(o =>
          `<button class="opt${a != null ? (o.k === 0 ? ' right' : o.k === a ? ' wrong' : '') : ''}" data-a="${o.k}"${a != null ? ' disabled' : ''}>${esc(o.t)}</button>`).join('')}</div>
          ${a != null ? `<p class="explain">${a === 0 ? '✓ Correct. ' : '✗ Not quite. '}${esc(q.ex)}</p><div class="row"><button class="btn primary" id="qNext">${cur.qi + 1 < ex.qs.length ? 'Next question' : 'See result'}</button></div>` : ''}</div>`;
      } else {
        const right = cur.answers.filter(a => a === 0).length, n = ex.qs.length;
        const sc = right + '/' + n;
        if (!prog[ex.id] || +prog[ex.id].split('/')[0] < right) { prog[ex.id] = sc; saveProg(); }
        qhtml = `<div class="q"><h3>Exercise complete</h3><p class="score">${sc}</p><p>All receiver tasks done, ${right} of ${n} questions right.</p>
          <div class="row">${cur.i + 1 < EX.length ? '<button class="btn primary" id="exNext">Next exercise</button>' : ''}<button class="btn" id="exAgain">Try again</button><button class="btn" id="exList">All exercises</button></div></div>`;
      }
    }
    $('#panel').innerHTML = `<div class="row" style="justify-content:space-between"><button class="lnk" id="exBack">‹ All exercises</button><label class="chk"><input type="checkbox" id="hints"${hints ? ' checked' : ''}> Show button hints</label></div>
      <h2>${cur.i + 1}. ${esc(ex.title)}</h2><p class="scenario">${esc(ex.scenario)}</p>
      <ol class="steps">${ex.steps.map((s, i) => `<li class="step${cur.done[i] ? ' done' : i === firstOpen ? ' cur' : ''}"><span class="tick">${cur.done[i] ? '✓' : i + 1}</span><div><b>${esc(s.t)}</b>${i === firstOpen && hints ? `<span class="hint">${esc(s.hint)}</span>` : ''}${i === firstOpen ? lastWhy(s) : ''}</div></li>`).join('')}</ol>
      ${qhtml}`;
    $('#exBack').onclick = () => { cur = null; drawExList(); };
    $('#hints').onchange = e => { hints = e.target.checked; drawEx(); };
    $$('.opt[data-a]').forEach(b => b.onclick = () => { cur.answers[cur.qi] = +b.dataset.a; drawEx(); });
    const qn = $('#qNext'); if (qn) qn.onclick = () => { cur.qi++; drawEx(); };
    const en = $('#exNext'); if (en) en.onclick = () => startEx(cur.i + 1);
    const ea = $('#exAgain'); if (ea) ea.onclick = () => { cur.ex.qs.forEach(q => delete q.sh); startEx(cur.i); };
    const el = $('#exList'); if (el) el.onclick = () => { cur = null; drawExList(); };
    arrivals();
  }
  // if the current step is waiting for a message, say whether the last one printed and why not
  function lastWhy(s) {
    if (!s.bc) return '';
    const last = [...cur.ev].reverse().find(e => (e.type === 'rejected' || e.type === 'received') && s.bc.includes(e.d.id));
    return last ? `<span class="why">${last.type === 'rejected' ? 'Not printed: ' : ''}${esc(last.d.reason)}</span>` : '<span class="why">Waiting for the message to come in…</span>';
  }

  // ---------- decoding quiz ----------
  const ST_KEYS = Object.keys(NX.stations);
  const typeName = t => NX.types[t].name;
  const mcq = (q, right, wrong, ex) => ({ q, o: [right, ...shuffle(wrong).slice(0, 3)], ex });
  const BANK = [
    () => { const id = pick(Object.keys(NX.messages)); const b1 = id[0], s = NX.stations[b1];
      return mcq(`<span class="hdr">ZCZC ${id}</span> Which station sent this message?`, `${s.name} (${b1})`,
        ST_KEYS.filter(k => k !== b1 && !(b1 === 'F' && k === 'D') && !(b1 === 'D' && k === 'F')).map(k => `${NX.stations[k].name} (${k})`),
        `B1, the first letter after ZCZC, is the station: ${b1} = ${s.name}.`); },
    () => { const id = pick(Object.keys(NX.messages).filter(k => k[1] !== 'Z')); const t = id[1];
      return mcq(`<span class="hdr">ZCZC ${id}</span> What type of message is it?`, `${t}: ${typeName(t)}`,
        'ABCDEFL'.split('').filter(x => x !== t).map(x => `${x}: ${typeName(x)}`), `B2, the second letter, is the message type: ${t} = ${typeName(t)}.`); },
    () => { const t = pick('ABCDEFJKL'.split(''));
      return mcq(`Which B2 letter means <b>${typeName(t).toLowerCase()}</b>?`, t, 'ABCDEFGHJKLZ'.split('').filter(x => x !== t), `${t} = ${typeName(t)}.`); },
    () => { const id = pick(['PA23', 'MB02', 'PE55', 'FA13', 'IE21']);
      return mcq(`<span class="hdr">ZCZC ${id}</span> What is <b>${id.slice(2)}</b>?`, 'The message number (B3 B4)', ['The station number', 'The time it was sent', 'The error rate', 'The NAVAREA'], 'B3 B4 is the message number, 01–99.'); },
    () => mcq('A message is numbered <b>00</b>, like PD00. What does that mean?', 'VITAL: transmitted immediately and always printed', ['Routine: sent at the next scheduled time', 'A test transmission', 'The message has been cancelled'], 'Number 00 = VITAL priority.'),
    () => { const f = pick([[518, 'English, international'], [490, 'Local language, national'], [4209.5, 'Tropical zone, international (HF)']]);
      return mcq(`What is <b>${f[0]} kHz</b> used for in NAVTEX?`, f[1], ['English, international', 'Local language, national', 'Tropical zone, international (HF)', 'DSC distress alerts'].filter(x => x !== f[1]), '518 kHz English international · 490 kHz local language · 4209.5 kHz tropical zone.'); },
    () => mcq('About how far out can NAVTEX be received?', 'About 400 NM, longest at night', ['About 40 NM', 'About 1,200 NM', 'Only within VHF range'], 'Around 400 NM; reception is best at night.'),
    () => mcq('How often does each NAVTEX station transmit?', 'Every 4 hours, for up to 10 minutes', ['Every hour, for 1 minute', 'Once a day', 'Continuously'], 'Stations time-share the frequency: every 4 hours, up to 10 minutes each.'),
    () => mcq('Two stations use the same B1 letter. Why is that not a problem?', 'They are about 800 NM apart, so you never receive both', ['They use different frequencies', 'Only one is ever on the air', 'The receiver merges them'], 'Same-letter stations are around 800 NM apart, beyond reception range of each other.'),
    () => mcq('Which message types can never be switched off on the receiver?', 'A, B, D and L', ['A, B, C and D', 'D and E', 'All types can be switched off'], 'Navigational warnings, meteorological warnings, SAR information and additional navigational warnings.'),
    () => mcq('With the default 4.9% limit, a message arrives with 6% errors. What happens?', 'It is not kept and will be received again next broadcast', ['It is stored and printed', 'It is stored with a warning', 'The receiver asks the station to repeat it'], 'CER 5% or more: not kept. 4.9% or less: kept.'),
    () => pick([
      mcq('What marks the <b>start</b> of a NAVTEX message?', 'ZCZC', ['NNNN', 'QRU', 'SECURITE'], 'ZCZC starts it, NNNN ends it.'),
      mcq('What marks the <b>end</b> of a NAVTEX message?', 'NNNN', ['ZCZC', 'QRU', 'OUT'], 'ZCZC starts it, NNNN ends it.')]),
    () => { const d = 1 + (Math.random() * 28 | 0), h = Math.random() * 24 | 0, m = Math.random() * 60 | 0, p = n => String(n).padStart(2, '0');
      const code = p(d) + p(h) + p(m);
      return mcq(`A message is dated <b>${code} UTC</b>. What does that mean?`, `Day ${d} of the month, ${p(h)}:${p(m)} UTC`, [`${p(d)}:${p(h)} UTC on day ${m}`, `Message number ${code}`, `Position ${p(d)}°${p(h)}'N`], 'Date-time groups are ddHHmm: day, hours, minutes.'); },
    () => mcq("What is Haifa's NAVTEX station letter?", 'P', ['H', 'M', 'F'], 'Haifa P · Cyprus M · Antalya F · Iraklion H.'),
    () => mcq('How long before sailing should you switch NAVTEX on?', '4–12 hours', ['5 minutes', 'Only at sea', '48 hours'], 'Long enough to catch a full round of broadcasts.'),
    () => mcq('You are in sea area A1 but outside NAVTEX coverage. How do you get maritime safety information?', 'By HF, telex or INMARSAT', ['On VHF channel 16 only', 'You can not', 'By SART'], 'From the course notes.'),
    () => mcq('When did NAVTEX become part of GMDSS?', '1999', ['1983', '1988', '2010'], 'Introduced in Boston in 1983, part of GMDSS since 1999.'),
    () => mcq('What does type <b>Z</b> mean?', 'No message on hand (QRU)', ['SAR information', 'Special services', 'Navigational warning'], 'Z = QRU, nothing to send.')
  ];
  let qz = null;
  function startQuiz() {
    const gens = shuffle(BANK).slice(0, 10);
    qz = { qs: gens.map(g => { const q = g(); q.sh = shuffle(q.o.map((t, k) => ({ t, k }))); return q; }), i: 0, a: [] };
    drawQuiz();
  }
  function drawQuiz() {
    if (qz.i >= qz.qs.length) {
      const r = qz.a.filter(a => a === 0).length;
      if (!prog.quizBest || prog.quizBest < r) { prog.quizBest = r; saveProg(); }
      $('#panel').innerHTML = `<h2>Decoding quiz</h2><p class="score">${r}/10</p><p>Best so far: ${prog.quizBest}/10.</p><div class="row"><button class="btn primary" id="qzAgain">New quiz</button></div>`;
      $('#qzAgain').onclick = startQuiz; return;
    }
    const q = qz.qs[qz.i], a = qz.a[qz.i];
    $('#panel').innerHTML = `<h2>Decoding quiz</h2><p>10 questions on reading NAVTEX headers, stations, message types and the rules. A new mix every time.</p>
      <div class="q"><h3>Question ${qz.i + 1} of 10</h3><p class="qt">${q.q}</p><div class="opts">${q.sh.map(o =>
        `<button class="opt${a != null ? (o.k === 0 ? ' right' : o.k === a ? ' wrong' : '') : ''}" data-a="${o.k}"${a != null ? ' disabled' : ''}>${esc(o.t)}</button>`).join('')}</div>
      ${a != null ? `<p class="explain">${a === 0 ? '✓ Correct. ' : '✗ Not quite. '}${esc(q.ex)}</p><div class="row"><button class="btn primary" id="qzNext">${qz.i < 9 ? 'Next question' : 'See result'}</button></div>` : ''}</div>`;
    $$('.opt[data-a]').forEach(b => b.onclick = () => { qz.a[qz.i] = +b.dataset.a; drawQuiz(); });
    const n = $('#qzNext'); if (n) n.onclick = () => { qz.i++; drawQuiz(); };
  }

  // ---------- start ----------
  setTab('free'); RX.render();
})();
