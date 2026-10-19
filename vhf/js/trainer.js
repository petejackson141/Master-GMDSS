/* Running a scenario: guided steps, advanced free play, results, reset and debrief */
/* ---------- log ---------- */
function log(who,text,cls){const d=document.createElement('div');d.className='msg '+(cls||'');d.innerHTML=`<span class="who"></span><p></p>`;d.querySelector('.who').textContent=who;d.querySelector('p').textContent=text;$('#log').appendChild(d);$('#log').scrollTop=$('#log').scrollHeight}

/* ---------- flow ---------- */
let cur=null;
function start(mode,seed){
  if(listening) stopRec(false);
  if(window.speechSynthesis) speechSynthesis.cancel();
  if(seed==null) seed=Math.floor(Math.random()*2147483647);
  RNG=seeded(seed);
  const m=mode==='random'?rnd(['mayday','relay','panpan','medico','securite','routine','abandon','raftsart','raftship','portctl']):mode;
  document.querySelectorAll('.mode').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===mode));
  const s=build(m);
  cur={mode,real:m,s,i:0,pts:0,max:0,step:null,seed};
  const sc=$('#scen'); sc.style.borderLeftColor=s.color;
  sc.innerHTML=`<span class="eyebrow">Scenario</span><h2></h2><p class="brief"></p><div class="facts"></div>
    <div class="scenbar"><button class="btn" data-reset>↺ Reset situation</button><button class="btn ghost" data-newsit>Choose new situation ↑</button></div>`;
  sc.querySelector('h2').textContent=mode==='random'?'Surprise scenario':s.title;
  sc.querySelector('.brief').textContent=s.brief;
  sc.querySelector('.facts').innerHTML=s.facts.map(([k,v])=>`<span><span class="k">${k}</span><b></b></span>`).join('');
  sc.querySelectorAll('.facts b').forEach((b,i)=>b.textContent=s.facts[i][1]);
  $('#log').innerHTML='';
  // the radio is left on a random channel and power, as it would be after normal use
  resetRadio(); R.sqlTouched=false; R.pos=OWNPOS||randPos(); const startCh=rnd([72,9,13,6,8,77]); R.userPwr=rnd(['HI','LO']); setCh(startCh);
  R.utc0=Date.now(); R.utcBase=ri(6,17)*60+ri(0,59); render();
  RNG=Math.random;
  hideCompose(); const rs=$('#results'); rs.hidden=true; rs.innerHTML='';
  cur.evs=[]; cur.tx=[]; cur.adv=(LEVEL==='adv'); cur.played=new Set();
  if(cur.adv) advTask(); else next();
  if(window.matchMedia('(max-width:900px)').matches) setTimeout(()=>$('#scen').scrollIntoView({behavior:'smooth',block:'start'}),50);
}
function hideCompose(){const c=$('#compose');c.hidden=true;c.innerHTML=''}
function showResults(html){const r=$('#results');r.hidden=false;r.innerHTML=html;return r}
const narrow=()=>window.matchMedia('(max-width:900px)').matches;
function scrollToEl(el){ if(narrow()&&el) setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),60) }
document.addEventListener('click',e=>{
  if(e.target.closest('[data-reset]')){ if(cur) start(cur.mode,cur.seed) }
  else if(e.target.closest('[data-newsit]')){ window.scrollTo({top:0,behavior:'smooth'}) }
});
function compose(title,btnLabel,extra){
  const c=$('#compose'); c.hidden=false;
  c.innerHTML=`<h4>${escH(title)}</h4><textarea id="say" placeholder="Press PTT and speak, or type your transmission here…" aria-label="Your transmission"></textarea>
    <p class="fixnote" id="fixNote" hidden></p><div class="acts"><button class="btn primary" id="send">${btnLabel}</button>${extra||''}</div><div id="hintBox"></div>`;
  $('#send').onclick=()=>{if(listening)stopRec(false);check()};
  $('#say').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();check()}});
}
function next(){
  if(!cur) return;
  if(cur.i>=cur.s.steps.length) return finish();
  const st=cur.s.steps[cur.i++]; cur.step=st; const T=$('#task');
  if(st.type!=='hear'){ hideCompose(); const rs=$('#results'); rs.hidden=true; rs.innerHTML=''; if(cur.i>1) scrollToEl($('#scen')) }
  if(st.type==='hear'){
    T.innerHTML=`<h3>Listening…</h3><p class="q"></p>`; T.querySelector('.q').textContent=`${st.who} is replying.`;
    lcd({rx:true,status:st.who.toUpperCase()});
    log(st.who,st.text);
    say(st.text,()=>{lcd({rx:false,status:''});next()});
    if(!speakerOn) setTimeout(()=>{},0);
    return;
  }
  if(st.type==='quiz'){
    T.innerHTML=`<h3></h3><p class="q"></p><div class="opts"></div><div class="fb"></div>`;
    T.querySelector('h3').textContent=st.title; T.querySelector('.q').textContent=st.q;
    const box=T.querySelector('.opts');
    st.options.forEach((o,idx)=>{const b=document.createElement('button');b.className='opt';b.textContent=o;b.onclick=()=>answer(idx,b);box.appendChild(b)});
    return;
  }
  if(st.type==='radio'){
    T.innerHTML=`<h3></h3><p class="q"></p><ul class="radiochk" id="rchk"></ul><details><summary>Show me the button presses</summary><ol class="howto"></ol></details><div id="rres"></div>`;
    if(st.need) setTimeout(updRadioTask,0);
    T.querySelector('h3').textContent=st.title; T.querySelector('.q').textContent=st.prompt;
    T.querySelector('.howto').innerHTML=st.how.map(h=>`<li>${escH(h)}</li>`).join('');
    st.done=false; updRadioTask();
    return;
  }
  // say
  T.innerHTML=`<h3></h3><p class="q"></p><p class="foot">Use the radio below, then speak (PTT) or type your call in the box under it.</p>`;
  T.querySelector('h3').textContent=st.title; T.querySelector('.q').textContent=st.prompt;
  compose('Your transmission','Send transmission','<button class="btn" id="hintB">Show structure</button><button class="btn ghost" id="skipB">Show model answer</button>');
  setVocab(st.model+' '+st.checks.map(c=>c.label).join(' '));
  $('#hintB').onclick=()=>{const h=$('#hintBox');h.innerHTML=h.innerHTML?'':`<div class="hint"></div>`;if(h.firstChild)h.firstChild.textContent=st.checks.map((c,i)=>`${i+1}. ${c.label}`).join('\n')};
  $('#skipB').onclick=()=>showResult(null);
  pttUI(); $('#ptt').disabled=false;
}
function updRadioTask(){
  if(!cur||!cur.step||cur.step.type!=='radio') return; const st=cur.step, ul=$('#rchk'); if(!ul) return;
  if(st.need){
    const res=st.need.map(n=>[n.test(),n.label]);
    ul.innerHTML=res.map(([ok,l])=>`<li class="${ok?'ok':'wait'}"><b>${ok?'✓':'○'}</b><span>${l}</span></li>`).join('');
    if(!st.done&&res.every(r=>r[0])){ st.done=true; if(!st.scored){cur.max++;cur.pts++;st.scored=true}
      const rr=$('#rres'); rr.innerHTML=`<p class="explain" style="background:var(--ok-soft)"></p><div class="acts" style="margin-top:10px"><button class="btn primary" id="rcont">Continue</button></div>`;
      rr.querySelector('.explain').textContent='✓ '+st.okMsg; $('#rcont').onclick=()=>next(); }
    return;
  }
  const items=[[R.on,'Radio switched on (ON)'],[st.done,'DSC call sent on Channel 70']];
  ul.innerHTML=items.map(([ok,l])=>`<li class="${ok?'ok':'wait'}"><b>${ok?'✓':'○'}</b><span>${l}</span></li>`).join('');
}
window.__radioHook=()=>{updRadioTask();advHook()};
radioListeners.push(ev=>{
  if(!cur) return; ev.t=Date.now(); cur.evs.push(ev);
  if(ev.type==='ack') cur.workCh=ev.ch;
  if(ev.type==='dsc'||ev.type==='distress') log('DSC · '+me().name, ev.type==='distress'?`DISTRESS ALERT · ${ev.nature}`:`${ev.kind==='all'?'ALL SHIPS':ev.kind.toUpperCase()+' → '+ev.to.name} · ${ev.cat.toUpperCase()}${ev.ch?' · CH '+ev.ch:''}`,'me sys');
  if(ev.type==='ack') log(ev.to.name,`DSC ACK · working channel ${ev.ch}`,'sys');
  if(cur.adv) return;
  const st=cur.step; if(!st||st.type!=='radio'||!st.accept||!st.accept(ev)) return;
  const g=st.grade(ev); if(!st.scored){cur.max++; if(g.ok) cur.pts++; st.scored=true}
  st.done=true; updRadioTask();
  const rr=$('#rres'); rr.innerHTML=`<p class="explain" style="background:${g.ok?'var(--ok-soft)':'var(--bad-soft)'}"></p><div class="acts" style="margin-top:10px"><button class="btn primary" id="rcont">Continue</button></div>`;
  rr.querySelector('.explain').textContent=(g.ok?'✓ ':'✗ ')+g.msg;
  $('#rcont').onclick=()=>next();
});
function answer(idx,btn){
  const st=cur.step; const T=$('#task'); if(T.dataset.locked==='1') return;
  const ok=idx===st.correct;
  btn.classList.add(ok?'right':'wrong');
  if(!st.tried){cur.max++; if(ok) cur.pts++;}
  st.tried=true;
  if(!ok) return;
  T.dataset.locked='1';
  if(st.lcd) lcd(st.lcd);
  const fb=T.querySelector('.fb'); fb.innerHTML=`<p class="explain"></p><div class="acts" style="margin-top:10px"><button class="btn primary">Continue</button></div>`;
  fb.querySelector('.explain').textContent=(st.explain[idx]||'')+'';
  fb.querySelector('button').onclick=()=>{T.dataset.locked='';next()};
  fb.querySelector('button').focus();
}
function check(){
  const ta=$('#say'); if(!ta) return; const raw=ta.value.trim();
  if(!raw){ta.focus();return}
  if(cur&&cur.adv) return advSend(raw);
  showResult(raw);
}
function sayChecks(st){
  const rchecks=[];
  if(st.radio){ const want=st.radio.ch==='work'?(cur.workCh||null):st.radio.ch;
    rchecks.push({label:'Radio switched on',hint:'Press ON to switch the radio on before you talk',test:()=>R.on});
    if(want) rchecks.push({label:`Transmitting on channel ${want}`,hint:`Select channel ${want} before you talk${want===16?' (press 16)':''}`,test:()=>R.on&&R.ch===want});
    if(st.radio.hi) rchecks.push({label:'High power (25 W)',hint:'Press HI/LO on the handset to switch to 25 W for distress traffic',test:()=>R.on&&R.pwr==='HI'}); }
  return [...st.checks,...rchecks];
}
function showResult(raw){
  const st=cur.step; const res=showResults('');
  let passed=0; const t=raw?norm(raw):'';
  const allc=sayChecks(st);
  const rows=allc.map(c=>{const ok=raw?c.test(t):false; if(ok)passed++; return {c,ok,self:false}});
  const counts=!st.scored;
  if(!st.scored){cur.max+=allc.length; cur.pts+=raw?passed:0; st.scored=true}
  if(raw){log('You ('+me().name+')',raw,'me')}
  const draw=()=>{
    const n=rows.filter(r=>r.ok).length, pct=Math.round(n/allc.length*100);
    res.innerHTML=`<h4 class="rt">Result: ${escH(st.title)}</h4>${raw?`<p class="score ${pct>=80?'good':'poor'}">${n} / ${allc.length} elements correct</p><p class="fixnote">If you said something and the radio misheard it, tap the ✗ to mark it correct.</p>`:''}
    <ul class="checks">${rows.map((r,i)=>`<li data-i="${i}" class="${r.ok?(r.self?'ok self':'ok'):'no'}${raw?' tog':''}"><b>${r.ok?'✓':'✗'}</b><span>${r.c.label}${r.self?' <small>marked by you</small>':''}${r.ok||!raw?'':`<small>${r.c.hint}</small>`}</span></li>`).join('')}</ul>
    <p class="eyebrow" style="margin-top:12px">Model transmission</p><div class="model"></div>
    <div class="acts" style="margin-top:10px"><button class="btn" id="playM">Hear model</button><button class="btn" id="retry">Try again</button><button class="btn primary" id="cont">Continue</button></div>`;
    res.querySelector('.model').textContent=st.model;
    if(raw) res.querySelectorAll('li.tog').forEach(li=>li.onclick=()=>{const r=rows[+li.dataset.i]; if(r.ok&&!r.self) return;
      r.ok=!r.ok; r.self=r.ok; if(counts) cur.pts+=r.ok?1:-1; draw()});
    $('#playM').onclick=()=>{const s=speakerOn;speakerOn=true;say(st.model);speakerOn=s};
    $('#retry').onclick=()=>{res.innerHTML='';res.hidden=true;$('#say').value='';$('#say').focus();scrollToEl($('#compose'))};
    $('#cont').onclick=()=>{if(listening)stopRec(false);$('#ptt').disabled=false;next()};
  };
  draw(); scrollToEl(res);
}
/* ---------- advanced level: free play, debrief at the end ---------- */
let LEVEL=store.get('c16.level')==='adv'?'adv':'guided';
function setLevel(l){LEVEL=l;store.set('c16.level',l);document.querySelectorAll('.lvl').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lvl===l));
  $('#lvlNote').textContent=l==='adv'?'No prompts. Handle it yourself, then get a debrief at the end.':'Step-by-step prompts, checked as you go.'}
document.querySelectorAll('.lvl').forEach(b=>b.onclick=()=>{setLevel(b.dataset.lvl); if(cur) start(cur.mode)});
setLevel(LEVEL);
const saySteps=()=>cur.s.steps.map((st,i)=>({st,i})).filter(x=>x.st.type==='say');
function advTask(){
  cur.step=null;
  const T=$('#task');
  T.innerHTML=`<h3>Advanced: you are on your own</h3><p class="q">Handle the situation as you would at sea. Use the radio (DSC, channel, power) and make your voice calls with PTT. Other stations answer when they hear you. Press <b>Finish and debrief</b> when you are done.</p>`;
  compose('Your transmission','Transmit','<button class="btn" id="finishB">Finish and debrief</button>');
  $('#compose').insertAdjacentHTML('beforeend','<p class="foot" id="advInfo">Transmissions so far: 0</p>');
  setVocab(saySteps().map(x=>x.st.model).join(' '));
  $('#finishB').onclick=()=>{if(listening)stopRec(false);debrief()};
  pttUI(); advHook();
}
function playHear(list,done){ if(!list.length){done&&done();return} const h=list.shift(); lcd({rx:true,status:h.who.toUpperCase()}); log(h.who,h.text); say(h.text,()=>{lcd({rx:false,status:''});setTimeout(()=>playHear(list,done),400)}) }
function hearAfter(idx){const out=[];for(let j=idx+1;j<cur.s.steps.length&&cur.s.steps[j].type==='hear';j++){if(!cur.played.has(j)){cur.played.add(j);out.push(cur.s.steps[j])}}return out}
function advHook(){
  if(!cur||!cur.adv||cur.debriefed) return;
  // stations that call you first (before your first call) are heard once you listen on channel 16
  const first=cur.s.steps.findIndex(st=>st.type==='say');
  if(R.on&&R.ch===16&&!cur.preHeard){ const pre=[]; for(let j=0;j<first;j++) if(cur.s.steps[j].type==='hear'&&!cur.played.has(j)){cur.played.add(j);pre.push(cur.s.steps[j])}
    if(pre.length){cur.preHeard=true; setTimeout(()=>playHear(pre),1500)} else cur.preHeard=true; }
}
function advSend(raw){
  const ss=saySteps(), heardN=cur.tx.filter(x=>x.heard).length, target=ss[heardN];
  const want=target&&target.st.radio?(target.st.radio.ch==='work'?(cur.workCh||null):target.st.radio.ch):null;
  const heard=!!target&&R.on&&(!want||R.ch===want);
  cur.tx.push({text:raw,on:R.on,ch:R.ch,pwr:R.pwr,sqlTouched:R.sqlTouched,t:Date.now(),heard});
  log(`You (${me().name})${R.on?' · CH '+pad(R.ch,2)+' · '+(R.pwr==='HI'?'25W':'1W'):' · radio off'}`,raw,'me');
  $('#say').value=''; const n=$('#fixNote'); if(n) n.hidden=true;
  $('#advInfo').textContent=`Transmissions so far: ${cur.tx.length}`+(target?'':' · all expected calls made: press Finish');
  if(!R.on) return;
  if(heard){ const reps=hearAfter(target.i); if(reps.length) setTimeout(()=>playHear(reps,()=>{ if(!saySteps()[heardN+1]) $('#advInfo').textContent+=' · all expected calls made: press Finish' }),900) }
}
function withState(snap,fn){const keys=['on','ch','pwr','sqlTouched'],saved={};keys.forEach(k=>saved[k]=R[k]);if(snap)keys.forEach(k=>R[k]=snap[k]);try{return fn()}finally{keys.forEach(k=>R[k]=saved[k])}}
function debrief(){
  cur.debriefed=true; const secs=[]; let pass=0,total=0;
  const heardTx=cur.tx.filter(x=>x.heard), firstTx=cur.tx[0]||null; let si=0;
  const add=(title,rows,extra)=>{rows.forEach(r=>{total++;if(r.ok)pass++});secs.push({title,rows,extra})};
  for(const st of cur.s.steps){
    if(st.type==='quiz'||st.type==='hear') continue;
    if(st.type==='radio'&&st.need){ add(st.title,st.need.map(nd=>({label:nd.label,ok:!!firstTx&&withState(firstTx,nd.test),hint:'Before your first transmission: '+st.how.join(' · ')}))); continue }
    if(st.type==='radio'){
      const acc=cur.evs.filter(e=>st.accept(e)); const graded=acc.map(e=>({e,g:st.grade(e)})); const pick=graded.find(x=>x.g.ok)||graded[0];
      if(!pick){ add(st.title,[{label:'DSC call sent',ok:false,hint:'No DSC call was made. '+st.how.join(' → ')}]); continue }
      const before=!firstTx||pick.e.t<firstTx.t;
      add(st.title,[{label:'Right DSC call',ok:pick.g.ok,hint:pick.g.msg},{label:'Made before your voice call',ok:before,hint:'Send the DSC call on channel 70 first, then speak.'}]); continue;
    }
    if(st.type==='say'){
      const tx=heardTx[si++];
      if(!tx){ add(st.title,[{label:'Call made',ok:false,hint:'This call was not made, or nobody heard it.'}],st.model); continue }
      const t=norm(tx.text); const rows=sayChecks(st).map(c=>({label:c.label,ok:withState(tx,()=>c.test(t)),hint:c.hint}));
      add(st.title,rows,st.model,tx.text); secs[secs.length-1].said=tx.text;
    }
  }
  const unheard=cur.tx.filter(x=>!x.heard);
  if(unheard.length) add('Calls nobody answered',unheard.map(x=>({label:x.on?`On channel ${x.ch}: “${x.text.slice(0,60)}${x.text.length>60?'…':''}”`:'Radio was off: nothing was transmitted',ok:false,hint:x.on?'Wrong channel for this call, or an extra call.':'Press ON first.'})));
  const pct=total?Math.round(pass/total*100):0;
  $('#task').innerHTML=`<h3>Debrief ready</h3><p class="q">Your results are at the bottom.</p><div class="scenbar"><button class="btn" data-reset>↺ Try this situation again</button><button class="btn ghost" data-newsit>Choose new situation ↑</button></div>`;
  hideCompose();
  const T=showResults('');
  T.innerHTML=`<div class="done"><span class="eyebrow">Debrief</span><span class="big">${pct}%</span><p>${pass} of ${total} items correct.</p></div><div id="dsecs"></div>
    <div class="acts" style="justify-content:center;margin-top:10px"><button class="btn primary" data-reset>↺ Try this situation again</button><button class="btn" id="again">New scenario, same type</button><button class="btn" id="same">Practise this one guided</button><button class="btn ghost" data-newsit>Choose new situation ↑</button></div>`;
  const box=$('#dsecs');
  secs.forEach(sc=>{const d=document.createElement('div');d.className='dsec';
    d.innerHTML=`<h4></h4><ul class="checks">${sc.rows.map(r=>`<li class="${r.ok?'ok':'no'}"><b>${r.ok?'✓':'✗'}</b><span>${escH(r.label)}${r.ok?'':`<small>${escH(r.hint||'')}</small>`}</span></li>`).join('')}</ul>${sc.extra?`<details><summary>Model transmission${sc.said?' and what you said':''}</summary>${sc.said?`<p class="eyebrow" style="margin-top:8px">You said</p><div class="model"></div>`:''}<p class="eyebrow" style="margin-top:8px">Model</p><div class="model"></div></details>`:''}`;
    d.querySelector('h4').textContent=sc.title; const ms=d.querySelectorAll('.model'); if(sc.said){ms[0].textContent=sc.said;ms[1].textContent=sc.extra} else if(ms[0]) ms[0].textContent=sc.extra;
    box.appendChild(d)});
  $('#again').onclick=()=>start(cur.mode);
  $('#same').onclick=()=>{setLevel('guided');start(cur.mode,cur.seed)};
  lcd({status:''}); scrollToEl(T);
}
function finish(){
  cur.step=null; lcd({status:'CALL COMPLETE'});
  const pct=cur.max?Math.round(cur.pts/cur.max*100):0;
  $('#task').innerHTML=`<h3>Scenario complete</h3><p class="q">Your score is at the bottom.</p>`;
  hideCompose();
  const T=showResults('');
  T.innerHTML=`<div class="done"><span class="eyebrow">Scenario complete</span><span class="big">${pct}%</span><p>${cur.pts} of ${cur.max} points. ${pct>=90?'Excellent radio procedure.':pct>=70?'Good. Check the ✗ items and try another.':'Keep practising: open “Show structure” before you speak.'}</p>
  <div class="acts" style="justify-content:center"><button class="btn primary" data-reset>↺ Same situation again</button><button class="btn" id="again">Same type, new scenario</button><button class="btn" id="rand">Surprise me</button><button class="btn ghost" data-newsit>Choose new situation ↑</button></div></div>`;
  $('#again').onclick=()=>start(cur.mode);
  $('#rand').onclick=()=>start('random');
  scrollToEl(T);
}
document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>start(b.dataset.mode));

// initial state: show Mayday ready
$('#task').innerHTML=`<h3>How it works</h3><ol style="margin:0;padding-left:20px;display:grid;gap:6px">
<li>Set your vessel name and MMSI at the top (or keep the example).</li>
<li>Pick a message type above. Each run gives you a new situation, and the radio is left on a random channel and power, like after normal use.</li>
<li>Switch the radio on with <b>ON</b>. Send the DSC call as on the real set: <b>MENU</b> for the DSC menus, or open the red cover and hold the distress button for 5 seconds. <b>Instruction Book</b> under the radio explains every button.</li>
<li>Check the channel and power, then press <b>PTT</b> on the handset and speak your message. Fix any misheard words and press <b>Send</b>.</li>
<li>Each transmission is checked: the wording, the channel you were on and, for distress, 25 W. The other station answers out loud.</li></ol>
<p class="foot">Try the radio any time: CH then the arrows (or CHANNEL ▲▼ on the handset) change channel, the red 16 key jumps to 16, HI/LO on the handset switches 25 W / 1 W, MENU opens the DSC menu, CLR goes back.</p>`;
