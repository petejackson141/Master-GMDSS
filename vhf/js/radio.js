/* The VHF/DSC radio: screens, keys, DSC menus, distress button and channel/power logic */
/* ---------- VHF / DSC radio (same layout and menus as the course simulator) ---------- */
const RCC={name:'RCC Haifa',mmsi:'004281234'};
const IND_BOOK=[RCC,{name:'Haifa Radio',mmsi:'004280001'},{name:'Cyprus Radio',mmsi:'002091000'},{name:'Antalya Radio',mmsi:'002713000'},{name:'Marina Tel Aviv',mmsi:'004280003'},{name:'Marina Ashdod',mmsi:'004280002'},{name:'Marina Herzliya',mmsi:'004280005'},{name:'Sailboat Vered',mmsi:'428555101'},{name:'Sailboat Dana',mmsi:'428555202'},{name:'Motor yacht Galil',mmsi:'428555303'}];
const GROUP_BOOK=[{name:'Zimline Ships',mmsi:'042822222'},{name:'Opher Ships',mmsi:'042833333'},{name:'All Isr Ships',mmsi:'042811111'},{name:'Israeli Navy',mmsi:'042844444'},{name:'Yam Sailing club',mmsi:'042812345'}];
const DIR=IND_BOOK;
const NATURES=['Undesignated','Sinking','Collision','Fire & Explosion','Disable & Adrift','Flooding','Grounding','Listing & Capsizing','Piracy','Abandoning Ship','Man Overboard'];
const CHANNELS=[...Array.from({length:28},(_,i)=>i+1),...Array.from({length:27},(_,i)=>i+60)].filter(c=>c!==70);
const LOW_ONLY=[15,17,75,76];
const SHIP_CH=[6,8,69,72,77];
const isCoast=m=>/^00/.test(m);
const R={on:false,ch:72,pwr:'HI',userPwr:'HI',chMode:false,dw:false,screen:{t:'main'},msg:'',tx:false,rx:false,alarm:false,armed:null,holding:false,
  utc0:Date.now(),utcBase:12*60+30,pos:{la:32,lam:5,lo:34,lom:40,ns:'N',ew:'E'},gps:true,timers:[],sql:true,sqlTouched:false,distWait:false,
  rcvd:{dist:['Distress sinking 32.17N 034.16E 1805 Feb 5th MMSI 375000234','Distress flooding 31.46N 032.13E 1932 Feb 5th MMSI 238000193','Distress listing 33.24N 034.21E 0600 Feb 1st MMSI 264000245'],
        other:['All Ships Urgency 32.19N 034.25E 0300 Feb 6th MMSI 253000123','All Ships Urgency 31.46N 034.27E 0743 Feb 6th MMSI 428000193','Routine from MMSI 004280001 1124 Feb 6th','Routine from MMSI 002320012 1520 Feb 6th']}};
const lcds=[$('#lcd'),$('#lcdZ')];
const later=(fn,ms)=>{const id=setTimeout(fn,ms);R.timers.push(id);return id};
function clearTimers(){R.timers.forEach(clearTimeout);R.timers=[]}
const utc=()=>{const m=(R.utcBase+Math.floor((Date.now()-R.utc0)/60000))%1440;return pad(Math.floor(m/60),2)+pad(m%60,2)};
const latS=()=>`${pad(R.pos.la,2)}.${pad(R.pos.lam,2)}${R.pos.ns||'N'}`, lonS=()=>`${pad(R.pos.lo,3)}.${pad(R.pos.lom,2)}${R.pos.ew||'E'}`;
const escH=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* sounds */
function tone(f,d,when=0,vol=.08){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.type='square';o.frequency.value=f;g.gain.value=vol;o.connect(g).connect(actx.destination);const t=actx.currentTime+when;o.start(t);o.stop(t+d)}catch(e){}}
const beep=()=>tone(2200,.04);
function alarmTone(){for(let i=0;i<6;i++){tone(2100,.22,i*.5,.06);tone(1300,.22,i*.5+.25,.06)}}
function dscBurst(){for(let i=0;i<10;i++)tone(i%2?1300:2100,.06,i*.07,.04)}
let noiseNode=null;
function noise(on){try{
  if(on&&!noiseNode){actx=actx||new (window.AudioContext||window.webkitAudioContext)();const len=actx.sampleRate*2,b=actx.createBuffer(1,len,actx.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    const s=actx.createBufferSource();s.buffer=b;s.loop=true;const f=actx.createBiquadFilter();f.type='bandpass';f.frequency.value=1600;const g=actx.createGain();g.gain.value=.035;s.connect(f).connect(g).connect(actx.destination);s.start();noiseNode=s}
  if(!on&&noiseNode){noiseNode.stop();noiseNode=null}}catch(e){}}
const updNoise=()=>noise(R.on&&!R.sql);

/* screen building helpers (positions are % of the LCD) */
const ab=(x,y,html,cls='',extra='')=>`<span class="ab ${cls}" style="left:${x}%;top:${y}%;${extra}">${html}</span>`;
const abR=(x,y,html,cls='')=>`<span class="ab ${cls}" style="right:${x}%;top:${y}%">${html}</span>`;
const triU=(side='r')=>`<span class="tri u" style="${side==='r'?'right':'left'}:3%;top:5%"></span>`;
const triD=(side='r')=>`<span class="tri d" style="${side==='r'?'right':'left'}:3%;bottom:7%"></span>`;
const L=[3,17,31,47,64,81];
function screenHTML(){
  const sc=R.screen;
  if(sc.t==='main'){
    const p=R.pwr==='HI'?'25W':'1W', st=[];
    if(R.tx) st.push('<span class="tx">TX</span>'); else if(R.rx) st.push('RX');
    let h='';
    if(R.chMode){
      h+=triU('l')+triD('l')+ab(9,12,pad(R.ch,2),'big');
      if(R.dw) h+=ab(47,L[0],'CH &gt; DW off','sm');
      h+=ab(47,L[1],'INT &nbsp;CH')+ab(47,L[2],p)+(R.dw?ab(47,L[3]-2,'DW on'):ab(47,L[3]-2,'CH &gt; DW','sm'))+abR(3,L[3]-2,'Exit &gt; Clear','sm');
    } else {
      h+=ab(5,10,pad(R.ch,2),'big')+(R.ch===16?ab(8,82,'CALLING','sm'):'');
      h+=ab(47,L[0]+2,'INT'+(R.dw?' &nbsp;DW':''))+ab(47,L[1]+1,p)+ab(47,L[2]+3,escH(R.msg||(R.distWait?'WAIT ACK':(R.sql?'CH > Select Channel':'SQL OFF'))),R.msg||R.distWait?'':'sm');
    }
    h+=ab(47,L[4],latS())+ab(47,L[5],lonS())+abR(3,L[5],utc()+' UTC');
    if(st.length) h+=abR(4,L[0]+2,st.join(' '));
    return h;
  }
  if(sc.t==='menu'){
    const m2=sc.idx>=4, items=m2?['Individual Call','Group Call','All Ships &nbsp;CALL']:['Polling Request','Received Calls','Distress Setting','Set &nbsp;Up'], off=m2?4:0;
    return ab(0,2,`DSC MENU - ${m2?2:1}`,'xs','width:100%;text-align:center')+ab(4,14,'SELECT :')+items.map((it,i)=>ab(4,30+i*15.5,it,(i+off===sc.idx?'sel':''),'font-weight:400')).join('')
      +ab(52,48,'Enter &gt; Select','sm')+ab(52,63,'Clear &gt; Exit','sm')+triU()+triD();
  }
  if(sc.t==='list'){
    const vis=sc.vis||5, start=Math.max(0,Math.min(sc.idx-vis+2,sc.items.length-vis)), items=sc.items.slice(start,start+vis);
    if(sc.center) return triU('l')+triD('l')+ab(0,10,escH(sc.title||''),'','width:100%;text-align:center;font-weight:400')+items.map((it,i)=>ab(14,(sc.title?36:24)+i*(sc.title?16:30),escH(it),start+i===sc.idx?'sel':'','font-weight:400')).join('')+ab(5,84,'Clear &gt; Exit','sm')+abR(4,84,'Enter &gt; Select','sm');
    return ab(4,3,escH(sc.title),sc.title.length>18?'xs':'')+items.map((it,i)=>ab(4,19+i*15.5,escH(it),start+i===sc.idx?'sel':'','font-weight:400')).join('')+ab(54,48,'Enter &gt; Select','sm')+ab(54,63,'Clear &gt; Exit','sm')+triU()+triD();
  }
  if(sc.t==='book'){
    const vis=6,start=Math.max(0,Math.min(sc.idx-3,sc.items.length-vis));
    return `<div class="rows" style="top:6%;left:6%">${sc.items.slice(start,start+vis).map((a,i)=>`<div class="${start+i===sc.idx?'sel':''}" style="font-weight:400"><span style="display:inline-block;width:44%">${a.mmsi}</span>${escH(a.name)}</div>`).join('')}</div>`+ab(5,86,'Clear &gt; Exit','sm')+abR(4,86,'Enter &gt; Select','sm');
  }
  if(sc.t==='selch'){
    return triU('l')+triD('l')+ab(0,3,'Select Channel','','width:100%;text-align:center;font-weight:400')+(sc.ch?ab(36,22,pad(sc.ch,2),'big'):ab(18,30,'SET BY STATION','','font-size:8cqw'))+ab(5,86,sc.ch?'Clear &gt; Omit':'','sm')+abR(4,86,'Enter &gt; cont','sm');
  }
  if(sc.t==='mmsi'){
    return ab(0,8,'Manual Input','','width:100%;text-align:center;font-weight:400')+ab(8,36,sc.d.map((c,i)=>`<span class="box${i===sc.pos?' cur':''}" style="min-width:8cqw">${c}</span>`).join(''),'','font-size:0')+ab(5,86,'Clear &gt; Back','sm')+abR(4,86,'Enter &gt; Next','sm');
  }
  if(sc.t==='gps'){
    return ab(12,5,'GPS &nbsp;= ON',sc.sel===0?'sel':'')+ab(12,21,'LAT')+ab(36,21,latS())+ab(12,36,'LONG')+ab(36,36,lonS())+ab(12,51,'TIME')+ab(36,51,utc()+' UTC')+ab(12,79,'GPS = OFF',sc.sel===1?'sel':'')
      +ab(62,26,'Enter &gt; Select','sm')+ab(62,41,'Clear &gt; Exit','sm')+triU()+triD();
  }
  if(sc.t==='man'){
    const f=sc.f, box=(from,len)=>`<span class="box${sc.pos>=from&&sc.pos<from+len?' cur':''}">${f.slice(from,from+len).join('')}</span>`;
    return ab(4,12,'TIME UTC','xs')+ab(38,6,box(0,4),'','font-size:0')+ab(62,4,'GPS = 0ff','xs')+ab(62,17,'Enter &gt; Cnt','xs')
      +ab(4,44,'LATITUDE','xs')+ab(38,38,box(4,2)+'<b style="font-size:6cqw"> . </b>'+box(6,2)+' '+box(8,1),'','font-size:0')
      +ab(4,74,'LONGITUDE','xs')+ab(38,68,box(9,3)+'<b style="font-size:6cqw"> . </b>'+box(12,2)+' '+box(14,1),'','font-size:0');
  }
  if(sc.t==='msg'){
    return `<div class="ctr ${sc.navy?'navy':''}">${sc.lines.map(l=>`<b>${escH(l)}</b>`).join('')}${(sc.sub||[]).map(l=>`<span style="font-size:5.6cqw;font-weight:400;color:#3a2a20">${escH(l)}</span>`).join('')}</div>`
      +(sc.hl?ab(5,86,escH(sc.hl),'sm'):'')+(sc.hr?abR(4,86,escH(sc.hr),'sm'):'');
  }
  if(sc.t==='rows'){
    const vis=6,start=sc.top||0;
    return ab(0,2,escH(sc.title),'xs','width:100%;text-align:center')+`<div class="rows" style="top:16%">${(sc.lines.length?sc.lines:['(none)']).slice(start,start+vis).map(l=>`<div>${escH(l)}</div>`).join('')}</div>`+triU()+triD();
  }
  if(sc.t==='hold') return `<div class="ctr"><b>Distress Call</b><span style="font-size:22cqw;color:#b4290f;line-height:1">${sc.left}</span><b>Keep holding</b></div>`;
  return '';
}
function render(){
  const html=R.on?`<div class="scr">${screenHTML()}</div>`:'';
  lcds.forEach(el=>{ if(!el) return; el.className='lcd'+(R.on?'':' off')+(R.alarm?' alarm':''); el.innerHTML=html });
  document.querySelectorAll('.knob[data-k="pwr"]').forEach(k=>k.classList.toggle('lit',R.on));
  document.querySelectorAll('.dist').forEach(d=>d.classList.toggle('armed',!!R.armed));
  hookRadio();
}
setInterval(()=>{if(R.on&&R.screen.t==='main')render()},1000);
function go(sc){R.screen=sc;render()}
function home(msg){R.screen={t:'main'};R.chMode=false;if(msg!==undefined)R.msg=msg;render()}
function list(title,items,onEnt,onClr,o){go(Object.assign({t:'list',title,items,idx:0,onEnt,onClr},o||{}))}
function msgScr(lines,o){go(Object.assign({t:'msg',lines},o||{}))}

/* channel + power */
function setCh(c){R.ch=c;R.pwr=LOW_ONLY.includes(c)?'LO':R.userPwr}
function stepCh(dir){let i=CHANNELS.indexOf(R.ch);if(i<0)i=0;i=(i+dir+CHANNELS.length)%CHANNELS.length;setCh(CHANNELS[i]);R.msg='';render()}
function togglePwr(){ if(LOW_ONLY.includes(R.ch)){R.pwr='LO';R.msg=`CH ${R.ch}: 1W ONLY`} else {R.userPwr=R.pwr=R.pwr==='HI'?'LO':'HI';R.msg=''} render() }

/* keys */
function key(k){
  if(k==='pwr') return power();
  if(!R.on||R.holding) return;
  beep();
  const sc=R.screen;
  if(k==='sql'){R.sql=!R.sql;R.sqlTouched=true;updNoise();if(sc.t==='main'){R.msg='';render()}return}
  if(k==='mhl') return togglePwr();
  if(k==='16'){ setCh(16); R.dw=false; R.chMode=false; if(!sc.sticky) R.screen={t:'main'}; R.msg=''; render(); return }
  if((k==='mup'||k==='mdn')&&sc.t==='main'){ stepCh(k==='mup'?1:-1); return }
  if(k==='mup') k='up'; if(k==='mdn') k='down';
  if(sc.t==='main'){
    if(k==='ch'){ if(!R.chMode) R.chMode=true; else R.dw=!R.dw; R.msg=''; render() }
    else if((k==='up'||k==='down')&&R.chMode) stepCh(k==='up'?1:-1);
    else if(k==='clr'){ if(R.chMode){R.chMode=false;render()} else if(R.distWait) cancelAsk(); else {R.msg='';render()} }
    else if(k==='menu') go({t:'menu',idx:2});
    else if(k==='scan') msgScr(['Scan Operation'],{sub:['Tri-watch: ch 16 + 2 channels','Scan: ch 16 + up to 6 channels','Not available in the simulator'],hl:'Clear > exit',onClr:()=>home(''),navy:true});
    return;
  }
  if(sc.t==='menu'){
    if(k==='up'){sc.idx=(sc.idx+6)%7;render()} else if(k==='down'){sc.idx=(sc.idx+1)%7;render()}
    else if(k==='clr') home('');
    else if(k==='ent') [polling,received,distressSetting,setupMenu,individual,groupCall,allShips][sc.idx]();
    return;
  }
  if(sc.t==='list'||sc.t==='book'){
    const n=sc.items.length;
    if(k==='up'){sc.idx=(sc.idx-1+n)%n;render()} else if(k==='down'){sc.idx=(sc.idx+1)%n;render()}
    else if(k==='ent') sc.onEnt(sc.items[sc.idx],sc.idx); else if(k==='clr') (sc.onClr||home)();
    return;
  }
  if(sc.t==='selch'){
    if((k==='up'||k==='down')&&sc.ch){const l=sc.chs,i=l.indexOf(sc.ch);sc.ch=l[(i+(k==='up'?1:-1)+l.length)%l.length];render()}
    else if(k==='ent') sc.onEnt(sc.ch); else if(k==='clr') sc.onEnt(null);
    return;
  }
  if(sc.t==='mmsi'){
    if(k==='up'||k==='down'){sc.d[sc.pos]=String((+sc.d[sc.pos]+(k==='up'?1:9))%10);render()}
    else if(k==='ent'){ if(sc.pos<8){sc.pos++;render()} else sc.onEnt(sc.d.join('')) }
    else if(k==='clr'){ if(sc.pos>0){sc.pos--;render()} else (sc.onClr||home)() }
    return;
  }
  if(sc.t==='gps'){
    if(k==='up'||k==='down'){sc.sel=1-sc.sel;render()} else if(k==='ent') sc.onEnt(sc.sel); else if(k==='clr') (sc.onClr||home)();
    return;
  }
  if(sc.t==='man'){
    const p=sc.pos;
    if(k==='up'||k==='down'){ if(p===8) sc.f[8]=sc.f[8]==='N'?'S':'N'; else if(p===14) sc.f[14]=sc.f[14]==='E'?'W':'E'; else sc.f[p]=String((+sc.f[p]+(k==='up'?1:9))%10); render() }
    else if(k==='ent'){ if(p<14){sc.pos++;render()} else sc.onEnt(sc.f) }
    else if(k==='clr'){ if(p>0){sc.pos--;render()} else (sc.onClr||home)() }
    return;
  }
  if(sc.t==='rows'){
    if(k==='down'&&(sc.top||0)<sc.lines.length-6){sc.top=(sc.top||0)+1;render()} else if(k==='up'&&sc.top>0){sc.top--;render()}
    else if(k==='clr'||k==='ent') (sc.onClr||home)();
    return;
  }
  if(sc.t==='msg'){ if(k==='ent'&&sc.onEnt) sc.onEnt(); else if(k==='clr') (sc.onClr||home)(); }
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-k]'); if(b&&b.closest('.radio')){ key(b.dataset.k); b.blur&&b.blur() }});
document.addEventListener('keydown',e=>{ if(!R.on||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; const sc=R.screen;
  if((sc.t==='mmsi'||sc.t==='man')&&/^\d$/.test(e.key)){ const arr=sc.t==='mmsi'?sc.d:sc.f; if(!(sc.t==='man'&&(sc.pos===8||sc.pos===14))){arr[sc.pos]=e.key;if(sc.pos<arr.length-1)sc.pos++;beep();render();e.preventDefault()} } });

/* power */
function power(){
  if(R.on){clearTimers();stopHold(true);R.on=false;R.alarm=false;R.armed=null;R.tx=R.rx=false;R.distWait=false;R.chMode=false;updNoise();render();return}
  R.on=true;R.msg='';R.chMode=false;msgScr(['SELF TEST'],{sub:['MMSI '+me().mmsi,'GPS OK']});tone(1800,.08);later(()=>home(''),1000);updNoise();
}

/* DSC menu */
function pickPriority(title,cb,back){list(title,['Routine','Safety','Urgency'],it=>cb(it),back)}
function addrSel(book,cb,back){
  list('',['Select Address','Manual Input'],(it,i)=>{
    if(i===0) go({t:'book',items:book,idx:0,onEnt:a=>cb(a),onClr:()=>addrSel(book,cb,back)});
    else go({t:'mmsi',d:'000000000'.split(''),pos:0,onEnt:m=>cb([...IND_BOOK,...GROUP_BOOK].find(a=>a.mmsi===m)||{name:'MMSI '+m,mmsi:m,unknown:true}),onClr:()=>addrSel(book,cb,back)});
  },back,{center:true});
}
function selCh(cat,addr,cb){
  if(isCoast(addr.mmsi)&&cat==='Routine') return go({t:'selch',ch:null,onEnt:()=>cb(null)});
  const chs=cat==='Routine'?SHIP_CH:[16,...SHIP_CH];
  go({t:'selch',ch:chs[0],chs,onEnt:ch=>cb(ch)});
}
function individual(){pickPriority('Select Priority',cat=>addrSel(IND_BOOK,a=>selCh(cat,a,ch=>
  msgScr(['Individual Call Ready'],{sub:['ENT : TO TRANSMIT','CLR : TO EXIT'],onEnt:()=>sendInd({kind:'individual',to:a,cat,ch}),onClr:()=>home('')})),individual),()=>go({t:'menu',idx:4}))}
function groupCall(){pickPriority('Select Priority',cat=>addrSel(GROUP_BOOK,a=>selCh(cat,a,ch=>
  msgScr(['Group Call Ready'],{sub:['ENT : TO TRANSMIT','CLR : TO EXIT'],onEnt:()=>sendGroup({kind:'group',to:a,cat,ch:ch||16}),onClr:()=>home('')})),groupCall),()=>go({t:'menu',idx:5}))}
function allShips(){pickPriority('SELECT  PRIORITY:',cat=>msgScr(['ALL SHIPS CALL READY'],{hl:'Clear > Exit',hr:'Enter > Transmit',onEnt:()=>sendAll({kind:'all',cat,ch:16}),onClr:()=>home('')}),()=>go({t:'menu',idx:6}))}
function txBurst(after){ R.tx=true; msgScr(['Transmitting'],{sub:['DSC on channel 70']}); dscBurst(); later(()=>{R.tx=false;after()},1300) }
function sendAll(c){ txBurst(()=>{ emit({type:'dsc',...c}); msgScr(['ALL SHIPS CALL','COMPLETED']); later(()=>{setCh(16);R.dw=false;home(c.cat.toUpperCase()+' CALL SENT')},1600) }) }
function sendGroup(c){ txBurst(()=>{ emit({type:'dsc',...c}); msgScr(['Group Call','Completed']); later(()=>{setCh(c.ch);home('GROUP CALL SENT')},1600) }) }
function sendInd(c){
  txBurst(()=>{
    emit({type:'dsc',...c});
    msgScr(['Individual   Call Transmitted','Wait for ACK','Clear to  Exit'],{onClr:()=>home('WAIT ACK')});
    const known=!c.to.unknown;
    later(()=>{
      if(!known){ msgScr(['NO ACK RECEIVED'],{sub:['ENT : RESEND','CLR : EXIT'],onEnt:()=>sendInd(c),onClr:()=>home('')}); return }
      if(!c.ch) c.ch=isCoast(c.to.mmsi)?(c.cat==='Routine'?rnd([24,25,26,27]):16):(c.cat==='Routine'?rnd(SHIP_CH):16);
      R.rx=true; tone(1900,.15);tone(1900,.15,.25); setCh(c.ch); R.dw=false;
      R.rcvd.other.unshift(`ACK from ${c.to.name} ${c.to.mmsi} CH ${pad(c.ch,2)} ${utc()}`);
      msgScr(['ACK RECEIVED'],{sub:[c.to.name+'  '+c.to.mmsi,'Working channel '+pad(c.ch,2)],hr:'Enter > OK',onEnt:()=>{R.rx=false;home('ACK RCVD')},onClr:()=>{R.rx=false;home('ACK RCVD')}});
      emit({type:'ack',...c});
    }, known?2600:6000);
  });
}
function polling(){
  addrSel(IND_BOOK.filter(a=>!isCoast(a.mmsi)),a=>{
    const reply=()=>{R.rx=true;tone(1900,.15);go({t:'rows',title:'Position Reply',lines:[a.name+'  '+a.mmsi,`LAT  ${pad(R.pos.la,2)}.${pad((R.pos.lam+7)%60,2)}N`,`LONG ${pad(R.pos.lo,3)}.${pad((R.pos.lom+4)%60,2)}E`,`TIME ${utc()} UTC`],onClr:()=>{R.rx=false;home('')}})};
    msgScr(['Polling Call Ready'],{sub:['ENT : TO TRANSMIT','CLR : TO EXIT'],onClr:()=>home(''),onEnt:()=>txBurst(()=>{msgScr(['Polling Call Transmitted','Wait for reply']);later(reply,2600)})});
  },()=>go({t:'menu',idx:0}));
}
function received(){list('Select Rcvd Msg',['Distress','Others'],(it,i)=>go({t:'rows',title:'Received  Calls',lines:i?R.rcvd.other:R.rcvd.dist,onClr:received}),()=>go({t:'menu',idx:1}),{center:true})}
function setupMenu(){list('Set Up Menu:',['Indv  ID','Group ID','Set Time & Position','MMSI Check','Test'],(it,i)=>{
  if(i===0) go({t:'rows',title:'Indv ID',lines:IND_BOOK.map(a=>a.mmsi+'  '+a.name),onClr:setupMenu});
  else if(i===1) go({t:'rows',title:'Group ID',lines:GROUP_BOOK.map(a=>a.mmsi+'  '+a.name),onClr:setupMenu});
  else if(i===2) manualPos(()=>{msgScr(['TIME & POSITION SET'],{onEnt:setupMenu,onClr:setupMenu,hr:'Enter > OK'})},setupMenu);
  else if(i===3) msgScr(['MMSI CHECK',me().mmsi],{onClr:setupMenu,onEnt:setupMenu,hl:'Clear > Exit'});
  else { msgScr(['TEST'],{sub:['Checking…']}); later(()=>msgScr(['TEST','OK'],{onClr:setupMenu,onEnt:setupMenu,hl:'Clear > Exit'}),1200) }
},()=>go({t:'menu',idx:3}))}
function manualPos(done,back){
  const t=utc(), f=[...t,...pad(R.pos.la,2),...pad(R.pos.lam,2),R.pos.ns||'N',...pad(R.pos.lo,3),...pad(R.pos.lom,2),R.pos.ew||'E'];
  go({t:'man',f,pos:0,onClr:back,onEnt:f=>{
    const n=(a,b)=>parseInt(f.slice(a,b).join(''),10);
    const hh=Math.min(23,n(0,2)), mm=Math.min(59,n(2,4)); R.utcBase=hh*60+mm; R.utc0=Date.now();
    R.pos={la:Math.min(89,n(4,6)),lam:Math.min(59,n(6,8)),ns:f[8],lo:Math.min(179,n(9,12)),lom:Math.min(59,n(12,14)),ew:f[14]}; R.gps=false; done();
  }});
}
function distressSetting(){list('SELECT NATURE OF DISTRESS:',NATURES,n=>{
  const ready=()=>{R.armed=n;msgScr(['Distress Call','Push For 5 sec.'],{onClr:()=>{R.armed=null;home('')}})};
  go({t:'gps',sel:0,onClr:distressSetting,onEnt:sel=>sel===0?ready():manualPos(ready,distressSetting)});
},()=>go({t:'menu',idx:2}))}

/* distress button: open the cover, then hold 5 seconds */
let holdT=null, holdPrev=null, holdStart=0, holdBtn=null;
document.querySelectorAll('[data-cover]').forEach(c=>c.addEventListener('click',()=>{document.querySelectorAll('.dist').forEach(d=>d.classList.add('open'));beep()}));
function startHold(e,btn){ if(e) e.preventDefault(); if(!R.on||R.holding) return;
  R.holding=true; holdBtn=btn; holdStart=Date.now(); holdPrev=R.screen; tone(2400,.08);
  go({t:'hold',left:5});
  holdT=setInterval(()=>{const el=(Date.now()-holdStart)/1000; document.querySelectorAll('.dbtn .fill').forEach(f=>f.style.height=Math.min(100,el/5*100)+'%');
    const left=Math.max(0,5-Math.floor(el)); if(R.screen.left!==left){R.screen.left=left;render();tone(2400,.06)}
    if(el>=5){stopHold(false);sendDistress(R.armed||'Undesignated')}},100);
}
function stopHold(cancel){ if(!R.holding) return; clearInterval(holdT); R.holding=false; document.querySelectorAll('.dbtn .fill').forEach(f=>f.style.height='0');
  if(cancel){ R.screen=holdPrev&&holdPrev.t!=='hold'?holdPrev:{t:'main'}; if(R.screen.t==='main') R.msg='HOLD 5 SEC'; render() } }
document.querySelectorAll('[data-dist]').forEach(b=>{
  b.addEventListener('pointerdown',e=>startHold(e,b));
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>stopHold(true)));
  b.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat)startHold(e,b)});
  b.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')stopHold(true)});
  b.addEventListener('contextmenu',e=>e.preventDefault());
});
function sendDistress(n){
  R.armed=null; R.tx=true; R.alarm=true; setCh(16); R.dw=false; R.chMode=false; alarmTone(); R.distWait=true;
  R.rcvd.dist.unshift(`SENT: Distress ${n.toLowerCase()} ${latS()} ${lonS()} ${utc()}`);
  msgScr(['Distress Call  Transmission','Completed','Now Waiting For ACK']);
  later(()=>{R.tx=false;home('')},2500);
  emit({type:'distress',nature:n});
  later(()=>{ R.alarm=false; R.distWait=false; R.rx=true; tone(1900,.2);tone(1900,.2,.3);tone(1900,.2,.6);
    R.rcvd.dist.unshift(`ACK from RCC Haifa ${RCC.mmsi} ${utc()}`);
    msgScr(['DISTRESS ACK RECEIVED'],{sub:['From RCC Haifa',RCC.mmsi,'Continue on channel 16'],hr:'Enter > OK',sticky:true,onEnt:()=>{R.rx=false;home('ACK RCVD')},onClr:()=>{R.rx=false;home('ACK RCVD')}});
    emit({type:'distress-ack'}) },7500);
}
function cancelAsk(){msgScr(['CANCEL DISTRESS ALERT?'],{sub:['Only for a false alarm.','Then report on CH 16','to all stations.'],hl:'Clear > No',hr:'Enter > Yes',onClr:()=>home(''),
  onEnt:()=>{clearTimers();R.alarm=false;R.tx=false;R.distWait=false;emit({type:'distress-cancel'});home('ALERT CANCELLED')}})}
function resetRadio(){clearTimers();stopHold(true);R.alarm=false;R.armed=null;R.tx=R.rx=false;R.distWait=false;R.chMode=false;R.dw=false;R.sql=true;updNoise();
  document.querySelectorAll('.dist').forEach(d=>d.classList.remove('open'));R.screen={t:'main'};R.msg='';render()}
let radioListeners=[];
function emit(ev){radioListeners.forEach(f=>f(ev))}
function hookRadio(){ if(window.__radioHook) window.__radioHook() }

/* instruction book + channel list */
const DOCS={book:`<h3>Instruction book</h3>
<p><b>Switch on:</b> press ON. <b>Change channel:</b> press CH, then the arrows, or use CHANNEL ▲▼ on the handset. <b>Power 25 W / 1 W:</b> HI/LO on the handset. <b>Dual watch:</b> after choosing the working channel press CH again (DW on), press it again to cancel. <b>Squelch:</b> SQL on by default, press SQL to open it, press again to close. <b>Channel 16:</b> red 16 key. <b>CLR</b> leaves any menu.</p>
<p><b>Quick distress:</b> open the red cover and hold the button 5 seconds. It sends Undesignated with the GPS position.</p>
<p><b>DSC menu:</b> press MENU, choose with the arrows, ENT to enter, CLR to leave.</p>
<table><tr><td>Polling Request</td><td>Ask another ship for its position.</td></tr>
<tr><td>Received Calls</td><td>Distress or Others: the DSC log.</td></tr>
<tr><td>Distress Setting</td><td>Choose the nature of distress → ENT shows GPS time and position (GPS = OFF to type them yourself) → ENT → open the cover and hold 5 seconds.</td></tr>
<tr><td>Set Up</td><td>Indv ID, Group ID, Set Time &amp; Position, MMSI Check, Test.</td></tr>
<tr><td>Individual Call</td><td>Select priority (Routine, Safety, Urgency) → Select Address from the book, or Manual Input → Select Channel (CLR to omit; a coast station sets the channel itself) → ENT to transmit → wait for the ACK. The radio then moves to the working channel set by the called station.</td></tr>
<tr><td>Group Call</td><td>Same steps as Individual Call.</td></tr>
<tr><td>All Ships Call</td><td>Select priority → ALL SHIPS CALL READY → ENT to transmit. The radio moves straight to channel 16. No ACK is expected: carry on on channel 16.</td></tr></table>`,
ch:`<h3>VHF channels</h3><table>
<tr><td>6</td><td>First choice: ship-to-ship and ship-to-aircraft SAR</td></tr><tr><td>8</td><td>Second choice ship-to-ship</td></tr>
<tr><td>11</td><td>Vessel movements in Israel (Israeli Navy)</td></tr><tr><td>12, 14</td><td>Port operations</td></tr><tr><td>13</td><td>Bridge-to-bridge safety</td></tr>
<tr><td>15, 17</td><td>On-board communications, 1 W</td></tr><tr><td>16</td><td>Distress, urgency, safety and calling</td></tr>
<tr><td>24–27</td><td>Public correspondence (duplex), coast stations</td></tr><tr><td>67, 73</td><td>Fishing vessels</td></tr>
<tr><td>70</td><td>DSC only, no voice</td></tr><tr><td>75, 76</td><td>Guard bands for 16, 1 W</td></tr><tr><td>AIS 1 / AIS 2</td><td>87B / 88B</td></tr></table>`};
document.querySelectorAll('[data-doc]').forEach(b=>b.addEventListener('click',()=>{const d=$('#docdlg');$('#dlgbody').innerHTML=DOCS[b.dataset.doc];try{d.showModal()}catch(e){d.setAttribute('open','')}}));
$('#pttSide').addEventListener('click',()=>$('#ptt').click());
render();

/* compatibility with the voice trainer's status updates */
function lcd(o){ if('tx' in o) R.tx=!!o.tx; if('rx' in o) R.rx=!!o.rx; if(o.status!==undefined) R.msg=(o.status==='STANDBY'?'':o.status); if(R.on) render() }
