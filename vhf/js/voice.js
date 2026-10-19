/* Sound: the other station speaking (text-to-speech) and listening to you (speech recognition, PTT) */
/* ---------- audio ---------- */
let speakerOn=true, lastHeard='';
let actx=null;
function squelch(){
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    const len=actx.sampleRate*0.18, b=actx.createBuffer(1,len,actx.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*0.25*(1-i/len);
    const s=actx.createBufferSource(); s.buffer=b; const f=actx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1800;
    s.connect(f).connect(actx.destination); s.start();}catch(e){}
}
function pickVoice(){
  const vs=(window.speechSynthesis&&speechSynthesis.getVoices())||[];
  return vs.find(v=>/en-GB/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang))||null;
}
function say(text,done){
  lastHeard=text;
  if(!speakerOn||!('speechSynthesis' in window)){done&&done();return}
  squelch();
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text.replace(/\n/g,'. '));
  const v=pickVoice(); if(v) u.voice=v; u.rate=0.95; u.pitch=0.95;
  let fin=false; const end=()=>{if(!fin){fin=true;setTimeout(()=>{squelch();done&&done()},150)}};
  u.onend=end; u.onerror=end;
  speechSynthesis.speak(u);
  setTimeout(end, 1500+text.length*90); // safety net if onend never fires
}
if('speechSynthesis' in window) speechSynthesis.onvoiceschanged=()=>{};

$('#btnVoice').onclick=e=>{speakerOn=!speakerOn;e.currentTarget.setAttribute('aria-pressed',speakerOn);e.currentTarget.textContent=speakerOn?'Speaker on':'Speaker off';if(!speakerOn&&window.speechSynthesis)speechSynthesis.cancel()};
$('#btnHear').onclick=()=>{if(lastHeard){const s=speakerOn;speakerOn=true;say(lastHeard);speakerOn=s}};
$('#btnStop').onclick=()=>{if(window.speechSynthesis)speechSynthesis.cancel()};

/* ---------- speech recognition ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null, listening=false, finalText='', voiceBlocked=!SR;
function setVoiceNote(msg){$('#voiceNote').innerHTML=msg}
if(!SR){setVoiceNote('Voice input is not available in this browser. Type your transmissions in the box instead. For voice, open the downloaded version in Chrome or Edge.')}
let vocab=new Set();
function setVocab(model){vocab=new Set(norm(model).split(' '))}
function altScore(txt){return norm(txt).split(' ').reduce((n,w)=>n+(vocab.has(w)?1:0),0)}
function bestAlt(r){let best=r[0].transcript,bs=-1;for(let j=0;j<r.length;j++){const sc=altScore(r[j].transcript)+(j===0?0.5:0);if(sc>bs){bs=sc;best=r[j].transcript}}return best}
function startRec(){
  const ta=$('#say'); if(!ta) return;
  if(voiceBlocked){ta.focus();voiceHelp();return}
  finalText=ta.value?ta.value.trim()+' ':'';
  const go=()=>{
    rec=new SR(); rec.lang=langSel.value; rec.continuous=true; rec.interimResults=true; rec.maxAlternatives=5;
    rec.onresult=ev=>{let interim='';for(let i=ev.resultIndex;i<ev.results.length;i++){const r=ev.results[i];if(r.isFinal)finalText+=bestAlt(r)+' ';else interim+=r[0].transcript}
      ta.value=(finalText+interim).trim(); lcd({status:'TX '+ta.value.slice(-24).toUpperCase()})};
    rec.onerror=ev=>{if(ev.error==='not-allowed'||ev.error==='service-not-allowed'||ev.error==='audio-capture'){voiceBlocked=true;setVoiceNote('<span class="voicewarn">The microphone is blocked here, so type your transmission instead, or use the microphone key on your phone keyboard.</span>');stopRec(false);voiceHelp();$('#say')&&$('#say').focus()}};
    rec.onend=()=>{ if(listening){ try{go()}catch(e){stopRec(false)} } }; // browser stops after a pause: keep listening until you press again
    rec.start();
  };
  try{go();listening=true;pttUI();lcd({tx:true,status:'TRANSMITTING…'})}catch(e){voiceBlocked=true;ta.focus();voiceHelp()}
}
function stopRec(submit){
  const was=listening; listening=false;
  if(rec){try{rec.onend=null;rec.stop()}catch(e){}} rec=null;
  pttUI(); lcd({tx:false,status:'STANDBY'});
  const ta=$('#say');
  if(submit&&was&&ta&&ta.value.trim()){ if(autoSend.checked) check(); else {ta.focus(); const n=$('#fixNote'); if(n){n.hidden=false;n.textContent='Check what the radio heard. Fix any words it got wrong, then press Send.'}} }
}
function voiceHelp(){const n=$('#fixNote'); if(n){n.hidden=false;n.textContent='Voice input is not available in this view, so the talk button can\u2019t listen. Tap the box and use the microphone key on your phone keyboard, or type. (The talk button works when the app is opened from its own web address.)'} pttUI()}
function pttMsg(t){const m=$('#pttMsg'); if(!m) return; m.textContent=t||''; m.hidden=!t; if(t) setTimeout(()=>{if(m.textContent===t) m.hidden=true},5000)}
function pttUI(){const b=$('#ptt');b.classList.toggle('live',listening);$('#pttSide').classList.toggle('live',listening);$('#pttLabel').textContent=listening?'Release · Stop':'PTT · Talk';$('#pttSub').textContent=listening?'Speaking… press when you finish':(voiceBlocked?'Voice not available here: use your keyboard mic':'Press, speak, press again')}
$('#ptt').onclick=()=>{ const canTalk=cur&&(cur.adv?!!$('#say'):(cur.step&&cur.step.type==='say'));
  if(!canTalk){ pttMsg(cur?'Nothing to say yet: follow the step above first.':'Pick a scenario first.'); return }
  if(!R.on&&!listening){ pttMsg('The radio is off. Press ON first.'); const n=$('#fixNote'); if(n){n.hidden=false;n.textContent='The radio is off. Press ON on the radio first.'} return }
  if(listening) stopRec(true); else startRec(); };
const langSel=$('#lang'), autoSend=$('#autoSend');
if(store.get('c16.lang')) langSel.value=store.get('c16.lang');
langSel.onchange=()=>store.set('c16.lang',langSel.value);
autoSend.checked=store.get('c16.auto')==='1';
autoSend.onchange=()=>store.set('c16.auto',autoSend.checked?'1':'0');
