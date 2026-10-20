/* NAVTEX receiver: settings, message memory, every screen and key of the set, and the reception rules.
   The trainer (trainer.js) listens to its events through RX.on(fn). */

const RX = (() => {
  const KEY = 'mg-navtex-v1';
  const FREQS = [518, 490, 4209.5];
  const MAX_MSGS = 132;
  const listeners = [];
  const emit = (type, data = {}) => listeners.forEach(f => { try { f(type, data); } catch (e) { console.error(e); } });

  const defaults = () => ({ freq: 518, alarm: true, err: 4.9, stMode: 'auto', stIgnore: [], tyIgnore: [], clock24: true, timeOffset: 0 });
  const factory = () => ({ ...defaults(), log: NX.factoryLog.map(id => ({ id, isNew: NX.factoryNew.includes(id) })) });

  let st = load();
  let on = false, dim = 0;
  let ui = { s: 'off' };
  let beepTimer = null, audio = null;

  function load() {
    try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && Array.isArray(v.log)) return { ...factory(), ...v }; } catch (e) {}
    return factory();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  // ---------- helpers ----------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fq = f => (f === 4209.5 ? '4209.5' : String(f)) + ' khz';
  const now = () => new Date(Date.now() + st.timeOffset);
  const p2 = n => String(n).padStart(2, '0');
  function clock() {
    const d = now(); let h = d.getUTCHours(); const m = p2(d.getUTCMinutes());
    if (st.clock24) return p2(h) + m + ' UTC';
    const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + m + ' ' + ap + ' UTC';
  }
  const findMsg = id => st.log.find(m => m.id === id);
  const stationOk = b1 => st.stMode === 'auto' ? NX.autoStations.includes(b1) : !st.stIgnore.includes(b1);
  const typeOk = b2 => (NX.types[b2] && NX.types[b2].fixed) || !st.tyIgnore.includes(b2);
  const acceptedTypes = () => NX.typeOrder.filter(t => typeOk(t));
  const acceptedStations = () => st.stMode === 'auto' ? NX.autoStations.slice() : NX.letters.filter(l => !st.stIgnore.includes(l));
  const foot = (a = 'Menu > Exit', b = 'Enter > Select') => `<div class="foot"><span>${a}</span><span>${b}</span></div>`;
  const list = (items, sel, cls = '') => `<ul class="ls ${cls}">${items.map((t, i) => `<li class="${i === sel ? 'cur' : ''}">${t}</li>`).join('')}</ul>`;

  // ---------- screens ----------
  const MAIN = ['STATION SELECTION', 'MESSAGE SELECTION', 'FUNCTIONS', 'SYSTEM MENU', 'USER DISPLAY'];
  const FN = ['RCVR ALARM', 'ERROR RATE', 'SAVE MSG TO PC', 'SCROLLING'];
  const SYS = ['TIME DISPLAY', 'DEFAULT SETTING', 'DELETE ALL MSGS', 'DELETE MSG', 'TEST', 'STATUS'];
  const UD = ['RCVD MSG LOG', 'TIME DISPLAY', 'ALL CLEAR'];

  function logRows(sel) {
    if (!st.log.length) return '<p class="mid">NO MESSAGES ON HAND</p>';
    const top = Math.max(0, Math.min(sel - 4, st.log.length - 8));
    return '<table class="lg">' + st.log.slice(top, top + 8).map((m, k) => {
      const i = top + k, msg = NX.messages[m.id] || {};
      return `<tr class="${i === sel ? 'hl' : ''}"><td>${m.id}</td><td>${m.isNew ? 'NEW' : ''}</td><td>${msg.freq || 518}</td><td>${m.id[1] === 'D' ? 'SAR' : ''}</td></tr>`;
    }).join('') + '</table>';
  }

  function msgView(id, footA) {
    const msg = NX.messages[id] || { lines: ['ZCZC ' + id, 'NNNN'], cer: 0 };
    const t = NX.types[id[1]] || {};
    const isNew = (findMsg(id) || {}).isNew;
    return `<div class="bar"><span>${id}</span><span>${esc(t.short || '')}</span><span>${isNew ? 'NEW' : ''}</span></div>
      <div class="mtext" data-scroll>${msg.lines.map(esc).join('<br>')}&nbsp;&nbsp; CER ${msg.cer}%</div>
      <div class="foot b"><span>${footA}</span>${ui.s === 'rx' ? '' : '<span>▲▼ Scroll</span>'}</div>`;
  }

  function screen() {
    const s = ui.s;
    switch (s) {
      case 'off': return '';
      case 'home': return `<div class="clk">${clock()}</div><div class="logo">NAVTEX</div>
        <div class="hb"><span>${fq(st.freq)}</span><span>Dim &gt;on</span><span>Alarm &gt; ${st.alarm ? 'on' : 'off'}</span></div>`;
      case 'freq': return `<div class="t dk">Select frequency</div>${list(FREQS.map(f => `${f === 4209.5 ? '4209.5' : f}&nbsp;&nbsp;khz${f === st.freq ? ' ✓' : ''}`), ui.sel, 'box mid2')}${foot()}`;
      case 'log': return `<div class="t dk sm2">RECEIVED MESSAGE LOG<br><small>Display message</small></div>${logRows(ui.sel)}${foot()}`;
      case 'msg': return msgView(ui.id, 'Menu > Exit');
      case 'rx': return msgView(ui.id, ui.beeping ? 'Menu > Stop Beep' : 'Menu > Exit');
      case 'menu': return `<div class="t">MENU</div>${list(MAIN, ui.sel, 'arrow')}${foot()}`;
      case 'stMode': return `<div class="t dk">Station Selection<br><small><b>MODE</b></small></div>${list(['AUTO', 'MANUAL'].map(x => x + (st.stMode === x.toLowerCase() ? ' ✓' : '')), ui.sel, 'box mid2 big')}${foot()}`;
      case 'stList': {
        const L = NX.letters[ui.i], ign = st.stIgnore.includes(L), nm = NX.stations[L] ? NX.stations[L].name : '';
        return `<div class="t dk">Station Selection<br><small class="red">${L}${nm ? ' · ' + esc(nm) : ''} (${ui.i + 1}/${NX.letters.length})</small></div>
          ${list([`${L} : Receive${!ign ? ' ✓' : ''}`, `${L} : Ignore${ign ? ' ✓' : ''}`], ui.sel, 'box mid2 big')}${foot('Menu > Exit', 'Enter > Next')}`;
      }
      case 'tyList': {
        const T = NX.typeOrder[ui.i], ty = NX.types[T], ign = st.tyIgnore.includes(T);
        const opts = ty.fixed ? [`${T} : Receive ✓`] : [`${T} : Receive${!ign ? ' ✓' : ''}`, `${T} : Ignore${ign ? ' ✓' : ''}`];
        return `<div class="t dk">Message Selection<br><small class="red">${esc(ty.name)}</small></div>
          ${list(opts, ty.fixed ? 0 : ui.sel, 'box mid2 big')}
          ${ty.fixed ? '<p class="note">Always received: cannot be switched off</p>' : ty.note ? `<p class="note">${ty.note}</p>` : ''}
          ${foot('Menu > Exit', 'Enter > Next')}`;
      }
      case 'fn': return `<div class="t dk bold">FUNCTIONS</div>${list(FN, ui.sel, 'box bold')}${foot()}`;
      case 'alarm': return `<div class="t dk">RECEIVED ALARM</div>${list(['ON', 'OFF'].map(x => x + ((st.alarm ? 'ON' : 'OFF') === x ? ' ✓' : '')), ui.sel, 'box mid2 big')}${foot()}`;
      case 'err': return `<div class="t dk">ERROR RATE</div><div class="er"><span>Default - %</span><b>4.9</b><span>Setting - %</span><b class="cur">${ui.val.toFixed(1)}</b></div>
        <p class="note">▲▼ change · messages with more errors are not stored</p>${foot('Menu > Exit', 'Enter > Save')}`;
      case 'saveList': return `<div class="t dk">SAVE MSG TO PC</div>${st.log.length ? list(st.log.map(m => m.id), ui.sel, 'box cols') : '<p class="mid">NO MESSAGES ON HAND</p>'}${foot('Menu > Exit', 'Enter > Save')}`;
      case 'scrollNote': return `<div class="t dk">SCROLLING</div><p class="mid">Sets the scrolling speed of the screen.<br>Not active in the simulator.</p>${foot('Menu > Exit', '')}`;
      case 'sys': return `<div class="t dk">SYSTEM MENU</div>${list(SYS, ui.sel, 'box')}${foot()}`;
      case 'time': {
        const d = now(), f = ui.field;
        const v = [p2(d.getUTCHours()) + p2(d.getUTCMinutes()), d.getUTCDate(), d.getUTCMonth() + 1, d.getUTCFullYear()];
        const n = ['TIME UTC', 'DATE', 'MONTH', 'YEAR'];
        return `<div class="t dk">TIME DISPLAY</div><div class="tm">${n.map((x, i) => `<span>${x}</span><b class="${i === f ? 'cur' : ''}">${v[i]}</b>`).join('')}</div>
          <p class="note">◀▶ field · ▲▼ change</p>${foot('Menu > Exit', 'Enter > Next')}`;
      }
      case 'confirm': return `<div class="t dk">${ui.title}</div><p class="mid">${ui.title === 'DEFAULT SETTING' ? 'DEFAULT SETTING' : ui.title}<br><br>ARE YOU SURE?</p>
        <div class="yn"><span class="${ui.sel === 0 ? 'cur' : ''}">YES</span><span class="${ui.sel === 1 ? 'cur' : ''}">NO</span></div>${foot()}`;
      case 'delMsg': return `<div class="t dk">DELETE MESSAGE</div>${st.log.length ? list(st.log.map(m => m.id), ui.sel, 'box cols') : '<p class="mid">NO MESSAGES ON HAND</p>'}${foot('Menu > Exit', 'Enter > Delete')}`;
      case 'test': return `<div class="t dk">NAVTEX TEST</div><div class="big3">RECEIVER = OK<br>ALARM = OK<br>DIM = OK<br>ABCDEFGHIJKLMNOPQRSTU<br>VWXYZ%-/*<br>NAVTEX TESTED FOUND OK</div>${foot('Menu > Exit', '')}`;
      case 'status': return `<div class="t dk">NAVTEX STATUS</div><div class="big3 sm3">
          RECEIVE MSG: ${acceptedTypes().filter(t => t !== 'Z').join('-')}<br>
          RECEIVE STNS: ${st.stMode === 'auto' ? 'AUTO (' + NX.autoStations.join('-') + ')' : (acceptedStations().length === 24 ? 'ALL' : acceptedStations().join('-') || 'NONE')}<br>
          FREQUENCY = ${fq(st.freq).toUpperCase()}<br>ALARM = ${st.alarm ? 'ON' : 'OFF'} · ERROR RATE = ${st.err.toFixed(1)}%<br>
          MSGS: ${st.log.length ? st.log.length + ' ON HAND' : 'NO MESSAGES ON HAND'}</div>${foot('Menu > Exit', '')}`;
      case 'ud': return `<div class="t dk">USER DISPLAY</div>${list(UD, ui.sel, 'box big')}${foot()}`;
      case 'ud12': return `<div class="t dk">USER DISPLAY<br><small>TIME DISPLAY</small></div>${list(['12 HOUR', '24 HOUR'].map(x => x + ((st.clock24 ? '24 HOUR' : '12 HOUR') === x ? ' ✓' : '')), ui.sel, 'box mid2 big')}${foot()}`;
      case 'flash': return `<p class="mid big">${ui.text}</p>`;
    }
    return '';
  }

  // ---------- rendering ----------
  const lcds = () => document.querySelectorAll('[data-lcd]');
  function render() {
    const html = on ? screen() : '';
    lcds().forEach(el => {
      el.className = 'lcd ' + (on ? 'on dim' + dim : 'off') + (ui.beeping ? ' alarm' : '') + ' s-' + ui.s;
      el.innerHTML = html;
      const sc = el.querySelector('[data-scroll]'); if (sc && ui.scroll) sc.scrollTop = ui.scroll;
    });
    emit('render', { screen: ui.s });
  }
  function go(s, extra = {}) { ui = { s, sel: 0, ...extra }; render(); emit('screen', { screen: s, ...extra }); }
  function flash(text, then, ms = 1300) { go('flash', { text }); setTimeout(() => { if (ui.s === 'flash') then(); }, ms); }

  // ---------- alarm sound ----------
  function beepOnce() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 2100; o.type = 'square'; g.gain.value = 0.05;
      o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.18);
    } catch (e) {}
  }
  function startBeep() {
    stopBeep(); ui.beeping = true; let n = 0;
    beepOnce(); beepTimer = setInterval(() => { if (++n > 30) return stopBeep(true); beepOnce(); }, 500);
  }
  function stopBeep(rerender) { if (beepTimer) clearInterval(beepTimer); beepTimer = null; if (ui.beeping) { ui.beeping = false; if (rerender) render(); } }

  // ---------- keys ----------
  function move(d, n) { ui.sel = (ui.sel + d + n) % n; render(); }

  function key(k) {
    if (k === 'power') return power(!on);
    if (k === 'navtex') return emit('navtexKey');
    if (!on) return;
    // keys that work from any screen
    if (k === 'dim') { dim = (dim + 1) % 3; render(); emit('dim', { level: dim }); return; }
    if (k === 'displ') { stopBeep(); return go('log', { from: 'displ' }); }
    if (k === 'frq') { stopBeep(); return go('freq', { sel: FREQS.indexOf(st.freq) }); }
    const s = ui.s, up = k === 'up', dn = k === 'down', ent = k === 'enter', men = k === 'menu';
    const lr = k === 'left' ? -1 : k === 'right' ? 1 : 0;
    const vert = up ? -1 : dn ? 1 : 0;

    switch (s) {
      case 'home': if (men) go('menu'); else if (ent) go('menu'); return;
      case 'flash': return;
      case 'freq':
        if (vert) return move(vert, 3);
        if (ent) { st.freq = FREQS[ui.sel]; save(); emit('setting', { what: 'freq', value: st.freq }); return go('home'); }
        if (men) return go('home');
        return;
      case 'log':
        if (vert && st.log.length) return move(vert, st.log.length);
        if (ent && st.log.length) { const m = st.log[ui.sel]; return openMsg(m.id, 'log', ui.sel); }
        if (men) return ui.from === 'ud' ? go('ud') : go('home');
        return;
      case 'msg': case 'rx':
        if (vert) { const el = document.querySelector('[data-lcd] [data-scroll]'); if (el) { el.scrollTop += vert * el.clientHeight * 0.6; ui.scroll = el.scrollTop; } return; }
        if (men) {
          if (ui.beeping) { stopBeep(); render(); emit('stopBeep'); return; }
          if (s === 'rx') return go('home');
          return go('log', { sel: ui.back || 0, from: ui.from });
        }
        return;
      case 'menu':
        if (vert) return move(vert, MAIN.length);
        if (men) return go('home');
        if (ent) return [() => go('stMode', { sel: st.stMode === 'auto' ? 0 : 1 }), () => go('tyList', { i: 0, sel: 0 }), () => go('fn'), () => go('sys'), () => go('ud')][ui.sel]();
        return;
      case 'stMode':
        if (vert) return move(vert, 2);
        if (men) return go('menu', { sel: 0 });
        if (ent) {
          st.stMode = ui.sel === 0 ? 'auto' : 'manual'; save(); emit('setting', { what: 'stMode', value: st.stMode });
          if (st.stMode === 'auto') return flash('AUTO<br><small>Nearby stations ' + NX.autoStations.join('-') + '</small>', () => go('menu', { sel: 0 }));
          return go('stList', { i: NX.letters.indexOf('A'), sel: st.stIgnore.includes('A') ? 1 : 0 });
        }
        return;
      case 'stList': {
        const L = NX.letters[ui.i];
        if (vert) return move(vert, 2);
        if (lr) { const i = (ui.i + lr + NX.letters.length) % NX.letters.length; return go('stList', { i, sel: st.stIgnore.includes(NX.letters[i]) ? 1 : 0 }); }
        if (men) return go('menu', { sel: 0 });
        if (ent) {
          st.stIgnore = st.stIgnore.filter(x => x !== L); if (ui.sel === 1) st.stIgnore.push(L); save();
          emit('setting', { what: 'station', letter: L, value: ui.sel === 1 ? 'ignore' : 'receive' });
          const i = (ui.i + 1) % NX.letters.length;
          return go('stList', { i, sel: st.stIgnore.includes(NX.letters[i]) ? 1 : 0 });
        }
        return;
      }
      case 'tyList': {
        const T = NX.typeOrder[ui.i], ty = NX.types[T];
        if (vert && !ty.fixed) return move(vert, 2);
        if (lr) { const i = (ui.i + lr + NX.typeOrder.length) % NX.typeOrder.length; return go('tyList', { i, sel: st.tyIgnore.includes(NX.typeOrder[i]) ? 1 : 0 }); }
        if (men) return go('menu', { sel: 1 });
        if (ent) {
          if (ty.fixed) emit('fixedType', { type: T });
          else { st.tyIgnore = st.tyIgnore.filter(x => x !== T); if (ui.sel === 1) st.tyIgnore.push(T); save(); emit('setting', { what: 'type', type: T, value: ui.sel === 1 ? 'ignore' : 'receive' }); }
          const i = (ui.i + 1) % NX.typeOrder.length;
          return go('tyList', { i, sel: st.tyIgnore.includes(NX.typeOrder[i]) ? 1 : 0 });
        }
        return;
      }
      case 'fn':
        if (vert) return move(vert, FN.length);
        if (men) return go('menu', { sel: 2 });
        if (ent) return [() => go('alarm', { sel: st.alarm ? 0 : 1 }), () => go('err', { val: st.err }), () => go('saveList'), () => go('scrollNote')][ui.sel]();
        return;
      case 'alarm':
        if (vert) return move(vert, 2);
        if (men) return go('fn', { sel: 0 });
        if (ent) { st.alarm = ui.sel === 0; save(); emit('setting', { what: 'alarm', value: st.alarm }); return go('fn', { sel: 0 }); }
        return;
      case 'err':
        if (vert) { ui.val = Math.min(9.9, Math.max(1, Math.round((ui.val - vert * 0.1) * 10) / 10)); return render(); }
        if (men) return go('fn', { sel: 1 });
        if (ent) { st.err = ui.val; save(); emit('setting', { what: 'err', value: st.err }); return flash('ERROR RATE<br>' + st.err.toFixed(1) + ' %', () => go('fn', { sel: 1 })); }
        return;
      case 'saveList':
        if (vert && st.log.length) return move(vert, st.log.length);
        if (men) return go('fn', { sel: 2 });
        if (ent && st.log.length) { download(st.log[ui.sel].id); const back = ui.sel; return flash('MESSAGE SAVED', () => go('saveList', { sel: back })); }
        return;
      case 'scrollNote': if (men || ent) go('fn', { sel: 3 }); return;
      case 'sys':
        if (vert) return move(vert, SYS.length);
        if (men) return go('menu', { sel: 3 });
        if (ent) return [
          () => go('time', { field: 0 }),
          () => go('confirm', { title: 'DEFAULT SETTING', act: 'default', back: ['sys', 1] }),
          () => go('confirm', { title: 'DELETE ALL MESSAGES', act: 'delAll', back: ['sys', 2] }),
          () => go('delMsg'),
          () => { go('test'); emit('test'); },
          () => { go('status'); emit('status'); }][ui.sel]();
        return;
      case 'time':
        if (lr || ent) { ui.field = (ui.field + (lr || 1) + 4) % 4; return render(); }
        if (vert) {
          const d = now(), stepMin = [1, 1440, 0, 0][ui.field];
          if (ui.field === 2) d.setUTCMonth(d.getUTCMonth() - vert); else if (ui.field === 3) d.setUTCFullYear(d.getUTCFullYear() - vert);
          else d.setTime(d.getTime() - vert * stepMin * 60000);
          st.timeOffset = d.getTime() - Date.now(); save(); return render();
        }
        if (men) return go('sys', { sel: 0 });
        return;
      case 'confirm':
        if (vert || lr) return move(vert || lr, 2);
        if (men || (ent && ui.sel === 1)) return go(ui.back[0], { sel: ui.back[1] });
        if (ent) return doConfirm(ui.act, ui.back);
        return;
      case 'delMsg':
        if (vert && st.log.length) return move(vert, st.log.length);
        if (men) return go('sys', { sel: 3 });
        if (ent && st.log.length) {
          const id = st.log[ui.sel].id; st.log.splice(ui.sel, 1); save(); emit('deleted', { id });
          const back = Math.min(ui.sel, st.log.length - 1);
          return flash(id + ' DELETED', () => go('delMsg', { sel: Math.max(0, back) }));
        }
        return;
      case 'test': case 'status': if (men) go('sys', { sel: s === 'test' ? 4 : 5 }); return;
      case 'ud':
        if (vert) return move(vert, UD.length);
        if (men) return go('menu', { sel: 4 });
        if (ent) return [() => go('log', { from: 'ud' }), () => go('ud12', { sel: st.clock24 ? 1 : 0 }), () => go('confirm', { title: 'ALL CLEAR', act: 'allClear', back: ['ud', 2] })][ui.sel]();
        return;
      case 'ud12':
        if (vert) return move(vert, 2);
        if (men) return go('ud', { sel: 1 });
        if (ent) { st.clock24 = ui.sel === 1; save(); emit('setting', { what: 'clock', value: st.clock24 ? 24 : 12 }); return go('ud', { sel: 1 }); }
        return;
    }
  }

  function doConfirm(act, back) {
    if (act === 'default') { const log = st.log; st = { ...defaults(), log }; save(); emit('default'); return flash('DEFAULT SETTING<br>RESTORED', () => go(back[0], { sel: back[1] })); }
    if (act === 'delAll') { st.log = []; save(); emit('deleteAll'); return flash('ALL MESSAGES<br>DELETED', () => go(back[0], { sel: back[1] })); }
    if (act === 'allClear') { st = { ...defaults(), log: [] }; save(); emit('allClear'); return flash('ALL CLEAR', () => go(back[0], { sel: back[1] })); }
  }

  function openMsg(id, from, back) {
    const m = findMsg(id); const wasNew = m && m.isNew;
    go('msg', { id, from: from === 'log' ? ui.from : from, back });
    if (m && m.isNew) { m.isNew = false; save(); }
    emit('openMsg', { id, wasNew });
  }

  function download(id) {
    const msg = NX.messages[id]; if (!msg) return;
    const txt = msg.lines.join('\r\n') + '\r\nCER ' + msg.cer + '%\r\n';
    try {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
      a.download = 'NAVTEX-' + id + '.txt'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    } catch (e) {}
    emit('saved', { id });
  }

  function power(v) {
    stopBeep(); on = v;
    if (on) { dim = 0; ui = { s: 'home' }; render(); }
    else { ui = { s: 'off' }; render(); }
    emit('power', { on });
  }

  // ---------- reception rules ----------
  // returns { ok, reason, code } and, when ok, stores + shows the message
  function check(id) {
    const msg = NX.messages[id]; const { b1, b2, nr } = NX.idParts(id); const sn = NX.stationName(b1);
    const tn = (NX.types[b2] || {}).name || ('type ' + b2);
    if (!on) return { ok: false, code: 'off', reason: 'The receiver is switched off, so nothing was received.' };
    if (msg.freq !== st.freq) return { ok: false, code: 'freq', reason: `${id} was sent on ${msg.freq} kHz but the receiver is tuned to ${st.freq} kHz.` };
    if (!stationOk(b1)) return { ok: false, code: 'station', reason: st.stMode === 'auto'
      ? `Station ${b1} (${sn}) is out of range. In AUTO the receiver only takes the nearby stations ${NX.autoStations.join(', ')}.`
      : `You set station ${b1} (${sn}) to Ignore in Station Selection.` };
    if (!typeOk(b2)) return { ok: false, code: 'type', reason: `Message type ${b2} (${tn}) is set to Ignore in Message Selection.` };
    if (findMsg(id) && nr !== '00') return { ok: false, code: 'dup', reason: `${id} is already in memory. A message with the same ID is only printed once.` };
    if (msg.cer > st.err) return { ok: false, code: 'cer', reason: `${id} had too many errors (CER ${msg.cer}% is above the ${st.err.toFixed(1)}% limit). It is not stored and will be received again at the next broadcast.` };
    return { ok: true, code: nr === '00' ? 'priority' : 'ok', reason: nr === '00'
      ? `${id} received. Number 00 means a VITAL message: it is always printed, even if already received.`
      : `${id} received and stored (${tn} from ${sn}).` };
  }

  function transmit(id) {
    const r = check(id);
    if (r.ok) {
      st.log = st.log.filter(m => m.id !== id);
      st.log.unshift({ id, isNew: true });
      if (st.log.length > MAX_MSGS) st.log.length = MAX_MSGS;
      save();
      ui = { s: 'rx', id, sel: 0 }; render();
      if (st.alarm) { startBeep(); render(); }
    }
    emit(r.ok ? 'received' : 'rejected', { id, ...r });
    return r;
  }

  function reset() { stopBeep(); st = factory(); save(); on = false; dim = 0; ui = { s: 'off' }; render(); emit('reset'); }

  return {
    key, transmit, check, reset, render, power,
    on: fn => listeners.push(fn),
    get state() { return st; }, get isOn() { return on; }, get screen() { return ui.s; }, get ui() { return ui; },
    stationOk, typeOk, findMsg, FREQS
  };
})();
