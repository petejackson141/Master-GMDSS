/* The practice situations: facts, steps, model calls and what each step checks */
/* ---------- scenario content ---------- */
const OTHER=['Vered','Dana','Galil','Marlin','Albatross'];
const DISTRESS=[
  {nature:'Fire on board, in danger of sinking',key:/\bfire\b/,short:'fire on board',dsc:'Fire & Explosion',nat:['Fire & Explosion']},
  {nature:'Taking water, sinking',key:/\b(sinking|water|flooding)\b/,short:'sinking',dsc:'Sinking',nat:['Sinking','Flooding']},
  {nature:'Collision, taking water',key:/\b(collision|water|sinking)\b/,short:'collision',dsc:'Collision',nat:['Collision']},
  {nature:'Aground on rocks, hull breached',key:/\b(aground|ground|grounding|rocks)\b/,short:'aground',dsc:'Grounding',nat:['Grounding']},
  {nature:'Capsizing',key:/\b(capsiz\w*|listing)\b/,short:'capsizing',dsc:'Listing & Capsizing',nat:['Listing & Capsizing']},
];
const TECH=[
  {prob:'Mast fell down, no engine, drifting south',key:/\b(mast|engine|drifting)\b/,need:'Need towing urgently',needKey:/\b(tow|towing)\b/},
  {prob:'No engine, drifting towards the shore',key:/\b(engine|drifting)\b/,need:'Need towing',needKey:/\b(tow|towing)\b/},
  {prob:'Rudder broken, unable to steer',key:/\b(rudder|steer\w*)\b/,need:'Need towing',needKey:/\b(tow|towing)\b/},
  {prob:'Taking water slowly, pumps coping',key:/\b(water|pump\w*)\b/,need:'Request a vessel to stand by',needKey:/\b(standby|assist\w*|tow\w*|pump)\b/},
];
const MED=[
  {desc:'Male, 26 years, body temperature low, blood pressure low, hit on the head, uncontrolled bleeding, unconscious',age:26,key:/\b(bleeding|head|unconscious)\b/,sum:'a 26-year-old man hit his head, is bleeding badly and is unconscious'},
  {desc:'Female, 54 years, chest pain, sweating, blood pressure high, gave aspirin',age:54,key:/\b(chest|pain)\b/,sum:'a 54-year-old woman has chest pain and is sweating; you gave aspirin'},
  {desc:'Male, 40 years, deep cut to the hand, bleeding controlled with pressure bandage',age:40,key:/\b(cut|hand|bleeding)\b/,sum:'a 40-year-old man has a deep cut on his hand; bleeding is controlled with a pressure bandage'},
];
const HAZ=[['floating container','container'],['floating log','log'],['drifting barrel','barrel'],['buoy adrift, unlit','buoy']];
const PORTS=[['Tel Aviv marina','Antalya, Turkey','Limassol, Cyprus'],['Herzliya marina','Larnaca, Cyprus',null],['Haifa','Paphos, Cyprus',null],['Ashkelon marina','Limassol, Cyprus','Larnaca, Cyprus']];

const TYPE_Q=(ans,extra)=>({type:'quiz',title:'What kind of call is this?',q:'Look at the situation above. Which priority does it need?',options:extra||['MAYDAY (distress)','PANPAN (urgency)','SECURITE (safety)','ROUTINE'],correct:ans,
  explain:{0:'Distress: immediate danger to the vessel or to life, and immediate help is needed.',1:'Urgency: the safety of the vessel or a person is at risk, but there is no danger to life yet and the situation is under control.',2:'Safety: information about safety of navigation, such as navigational or weather warnings.',3:'Routine: traffic lists, radio calls or voyage details.'}});

let OWNPOS=null;
function build(mode){
  const v=me(), p=randPos(), o=rnd(OTHER), pob=ri(2,8);
  const N=v.name, M=v.mmsi;
  OWNPOS=(mode==='relay')?randPos():p;
  if(mode==='mayday'){
    const d=rnd(DISTRESS);
    return {title:'Mayday: distress',color:'#c8261f',facts:[['Vessel',N],['MMSI',M],['Position',posShow(p)],['On board',pob+' persons'],['Situation',d.nature]],
      brief:`${d.nature}. You need immediate help.`,
      steps:[
        TYPE_Q(0),
        {type:'radio',title:'Send the DSC distress alert',prompt:`Use the radio to send a DSC distress alert on Channel 70. The nature is ${d.dsc}.`,
          how:['Press ON if the radio is off','Press MENU: the cursor starts on Distress Setting → ENT',`Select the nature of distress (${d.dsc}) with the arrows → ENT`,'GPS = ON shows the position and time → ENT','Distress Call / Push for 5 sec: open the red cover and hold the button 5 seconds','Quick way in a hurry: open the cover and hold 5 seconds without the menu (sends Undesignated)'],
          accept:ev=>ev.type==='distress',
          grade:ev=>d.nat.includes(ev.nature)?{ok:true,msg:`Distress alert sent with nature ${ev.nature}. The radio switched to Channel 16: check you are on 25 W, then give the distress call by voice.`}:ev.nature==='Undesignated'?{ok:true,msg:`Quick alert sent as Undesignated. Fine in a hurry, but a full alert with the nature (${d.dsc}) gives rescuers more information. Now check 25 W and give the call on Channel 16.`}:{ok:false,msg:`The alert went out as ${ev.nature}, but the situation is ${d.dsc}. Select the right nature next time.`}},
        {type:'say',who:'You',title:'Distress call and message',radio:{ch:16,hi:true},prompt:'Make the distress call and message on Channel 16.',
          checks:[C.word3('mayday'),C.thisIs(),C.nameN(N,3),C.mmsi(M),C.pos(p),C.any('Nature of distress',d.key,`Say what is happening: ${d.nature}`),C.any('Assistance required',/\b(assistance|assist|help)\b/,'Say REQUIRE IMMEDIATE ASSISTANCE'),C.pob(pob),C.endWith('over')],
          model:`Mayday, Mayday, Mayday\nThis is ${x3(N)}, ${spell(M)}\nMayday ${N}\n${posText(p)}\n${d.nature}\nRequire immediate assistance\n${W[pob]} persons on board\nOver`},
        {type:'hear',who:`Sailboat ${o}`,text:`Mayday\n${x3(N)}\nThis is sailboat ${o}, sailboat ${o}, sailboat ${o}\nReceived Mayday\nOver`},
        {type:'say',who:'You',title:'Ask for their distance and ETA',radio:{ch:16,hi:true},prompt:`Sailboat ${o} has confirmed receipt. Ask for their distance and ETA.`,
          checks:[C.word1('mayday'),C.nameN(o,1,`“${o}”`),C.thisIs(),C.nameN(N,2),C.any('Distance and ETA',/\b(eta|distance)\b/,'Ask: YOUR DISTANCE AND ETA'),C.endWith('over')],
          model:`Mayday\nSailboat ${o}\nThis is ${x2(N)}\nYour distance and ETA\nOver`},
        {type:'hear',who:`Sailboat ${o}`,text:`Mayday\n${N}\nThis is sailboat ${o}, sailboat ${o}\nI am ten miles north from you, speed ten knots, ETA six zero minutes from now\nOver`},
        {type:'say',who:'You',title:'Tell them to proceed',radio:{ch:16,hi:true},prompt:`Tell ${o} to proceed and stand by on Channel 16.`,
          checks:[C.word1('mayday'),C.nameN(o,1,`“${o}”`),C.thisIs(),C.nameN(N,2),C.any('Proceed',/\bproceed\b/,'Say PROCEED'),{label:'Stand by on channel 16',hint:'Say STAND BY ON CHANNEL ONE SIX',test:t=>/\bstandby\b/.test(t)&&numbers(t).includes('16')},C.endWith('over')],
          model:`Mayday\nSailboat ${o}\nThis is ${x2(N)}\nProceed and stand by on channel one six\nOver`},
        {type:'hear',who:`Sailboat ${o}`,text:`Mayday\n${N}\nThis is sailboat ${o}, sailboat ${o}\nProceeding at full speed to your position and standing by on channel one six`},
      ]};
  }
  if(mode==='relay'){
    const d=rnd(DISTRESS), yacht=rnd(['Tami','Orion','Aurora']), ym='233'+ri(100000,999999);
    return {title:'Mayday Relay',color:'#c8261f',facts:[['Your vessel',N],['Your MMSI',M],['Heard from',`Yacht ${yacht}, MMSI ${ym}`],['Their position',posShow(p)],['Their situation',d.nature],['On board',pob+' persons']],
      brief:`You heard a Mayday from yacht ${yacht} on Channel 16. Nobody has answered it.`,
      steps:[
        {type:'quiz',title:'What do you do?',q:`Yacht ${yacht} sent a Mayday and nobody answered. What should you do?`,options:['Transmit a MAYDAY RELAY on Channel 16','Ignore it, the coast station will hear it','Send a SECURITE warning','Call them on Channel 72'],correct:0,explain:{0:'A distress call that is heard and not answered is one of the reasons to send a Mayday Relay. It goes to a coast station first if one is in range.'}},
        {type:'say',who:'You',title:'Mayday Relay',radio:{ch:16,hi:true},prompt:`Relay yacht ${yacht}'s distress message on Channel 16.`,
          checks:[{label:'MAYDAY RELAY ×3',hint:'Say MAYDAY RELAY three times',test:t=>fcount(t,'mayday')>=3&&fcount(t,'relay')>=3},C.thisIs(),C.nameN(N,3),C.mmsi(M),C.any('“Following received from…”',/\bfollowing received\b/,`Say FOLLOWING RECEIVED FROM YACHT ${yacht.toUpperCase()}`),C.nameN(yacht,1,`Yacht “${yacht}”`),C.any('Quote … Unquote',/\bquote\b.*\bunquote\b/,'Put their message between QUOTE and UNQUOTE'),C.pos(p),C.any('Nature of distress',d.key,`Say: ${d.nature}`),C.pob(pob),C.any('Ships in vicinity report and assist',/\bvicinity\b|\breport and assist\b/,'Say SHIPS IN VICINITY REPORT AND ASSIST'),C.endWith('over')],
          model:`Mayday Relay, Mayday Relay, Mayday Relay\nThis is ${x3(N)}, ${spell(M)}\nFollowing received from yacht ${yacht} ${spell(ym)} on channel one six\nQuote: Mayday ${yacht}\n${posText(p)}\n${d.nature}, require immediate assistance\n${W[pob]} persons on board. Unquote\nShips in vicinity report and assist\nOver`},
        {type:'hear',who:'RCC Haifa',text:`Mayday\n${x3(N)}\nThis is RCC Haifa, RCC Haifa, RCC Haifa\nReceived Mayday\nOver`},
      ]};
  }
  if(mode==='panpan'){
    const f=rnd(TECH);
    return {title:'Pan Pan: urgency',color:'#e2941b',facts:[['Vessel',N],['MMSI',M],['Position',posShow(p)],['Problem',f.prob],['You need',f.need]],
      brief:`${f.prob}. Nobody is hurt and there's no immediate danger yet.`,
      steps:[
        TYPE_Q(1),
        {type:'radio',title:'Send the DSC urgency call',prompt:'Use the radio to send a DSC urgency call before your voice message.',how:['Press ON if the radio is off','Press MENU, then ▼ to All Ships CALL (DSC MENU - 2) → ENT','Select priority Urgency → ENT','ALL SHIPS CALL READY → ENT to transmit','The radio moves to channel 16: give your message by voice','(Or Individual Call → Urgency → Select Address → RCC Haifa)'],accept:ev=>ev.type==='dsc',grade:ev=>{ if(ev.type!=='dsc') return {ok:false,msg:'That was not a DSC call.'}; if(ev.cat!=='Urgency') return {ok:false,msg:`You sent ${ev.cat==='Urgency'?'an':'a'} ${ev.cat.toUpperCase()} call. This situation needs URGENCY. Send it again with the right category.`}; if(ev.kind==='all'||(ev.to&&ev.to.mmsi===RCC.mmsi)) return {ok:true,msg:`DSC urgency call sent${ev.kind==='all'?' to all ships':' to RCC Haifa'}. Now give the PANPAN message by voice on Channel 16.`}; return {ok:false,msg:'Urgency call sent, but to the wrong station. Send it to all ships or to RCC Haifa.'} }},
        {type:'say',who:'You',title:'Urgency message to RCC Haifa',radio:{ch:16},prompt:'Send the PANPAN message to RCC Haifa on Channel 16.',
          checks:[C.word3('panpan','PANPAN ×3'),{label:'RCC Haifa ×3',hint:'Call RCC HAIFA three times',test:t=>fcount(t,'haifa')>=3},C.thisIs(),C.nameN(N,3),C.mmsi(M),C.pos(p),C.any('What the problem is',f.key,`Describe the problem: ${f.prob}`),C.any('What you need',f.needKey,`Say what you need: ${f.need}`),C.endWith('over')],
          model:`PANPAN, PANPAN, PANPAN\nRCC Haifa, RCC Haifa, RCC Haifa\nThis is ${x3(N)}, ${spell(M)}\n${posText(p)}\n${f.prob}\n${f.need}\nOver`},
        {type:'hear',who:'RCC Haifa',text:`PANPAN\n${x3(N)}\nThis is RCC Haifa, RCC Haifa, RCC Haifa\nReceived, standby on channel one six\nOver`},
      ]};
  }
  if(mode==='medico'){
    const m=rnd(MED);
    return {title:'Pan Pan: Medico',color:'#e2941b',facts:[['Vessel',N],['MMSI',M],['Casualty',m.desc]],
      brief:`Someone on board needs medical advice: ${m.sum}.`,
      steps:[
        TYPE_Q(1),
        {type:'radio',title:'Send the DSC urgency call',prompt:'A Medico is an urgency message. Send the DSC urgency call first.',how:['Press ON if the radio is off','Press MENU, then ▼ to All Ships CALL (DSC MENU - 2) → ENT','Select priority Urgency → ENT','ALL SHIPS CALL READY → ENT to transmit','The radio moves to channel 16: give your message by voice','(Or Individual Call → Urgency → Select Address → RCC Haifa)'],accept:ev=>ev.type==='dsc',grade:ev=>{ if(ev.type!=='dsc') return {ok:false,msg:'That was not a DSC call.'}; if(ev.cat!=='Urgency') return {ok:false,msg:`You sent ${ev.cat==='Urgency'?'an':'a'} ${ev.cat.toUpperCase()} call. This situation needs URGENCY. Send it again with the right category.`}; if(ev.kind==='all'||(ev.to&&ev.to.mmsi===RCC.mmsi)) return {ok:true,msg:`DSC urgency call sent${ev.kind==='all'?' to all ships':' to RCC Haifa'}. Now give the PANPAN message by voice on Channel 16.`}; return {ok:false,msg:'Urgency call sent, but to the wrong station. Send it to all ships or to RCC Haifa.'} }},
        {type:'say',who:'You',title:'Medico call',radio:{ch:16},prompt:'Call RCC Haifa and tell them you have a Medico.',
          checks:[C.word3('panpan','PANPAN ×3'),{label:'RCC Haifa ×3',hint:'Call RCC HAIFA three times',test:t=>fcount(t,'haifa')>=3},C.thisIs(),C.nameN(N,3),C.mmsi(M),C.any('MEDICO',/\bmedico\b|\bmedical\b/,'Say MEDICO'),C.endWith('over')],
          model:`PANPAN, PANPAN, PANPAN\nRCC Haifa, RCC Haifa, RCC Haifa\nThis is ${x3(N)}, ${spell(M)}\nMedico\nOver`},
        {type:'hear',who:'RCC Haifa',text:`PANPAN\n${x3(N)}\nThis is RCC Haifa, RCC Haifa, RCC Haifa\nGo ahead\nOver`},
        {type:'say',who:'You',title:'Medico message',radio:{ch:16},prompt:'Give the Medico message.',
          checks:[C.word1('panpan','PANPAN'),C.any('RCC Haifa ×1',/\bhaifa\b/,'Name the station once: RCC HAIFA'),C.thisIs(),C.nameN(N,2),C.any('“Medico message begins”',/\bbegins?\b/,'Say MEDICO MESSAGE BEGINS'),C.num('Age',m.age,`Give the age: ${m.age} years`),C.any('Condition / what happened',m.key,'Describe the condition and what happened'),C.any('“Medico message ends”',/\bends?\b/,'Say MEDICO MESSAGE ENDS'),C.endWith('over')],
          model:`PANPAN\nRCC Haifa\nThis is ${x2(N)}\nMedico message begins:\n${m.desc}\nMedico message ends\nOver`},
        {type:'hear',who:'RCC Haifa',text:`PANPAN\n${N}\nThis is RCC Haifa, RCC Haifa\nReceived medico, standby on channel one six\nOver`},
      ]};
  }
  if(mode==='securite'){
    const [h,hk]=rnd(HAZ);
    return {title:'Sécurité: safety',color:'#1f7fc4',facts:[['Vessel',N],['MMSI',M],['Hazard',h],['Position',posShow(p)]],
      brief:`You pass a ${h} that could damage other vessels.`,
      steps:[
        TYPE_Q(2),
        {type:'radio',title:'Send the DSC safety call',prompt:'Use the radio to send a DSC safety (SECURITE) call to all ships.',how:['Press ON if the radio is off','Press MENU, then ▼ to All Ships CALL (DSC MENU - 2) → ENT','Select priority Safety → ENT','ALL SHIPS CALL READY → ENT to transmit','The radio moves to channel 16: give your message by voice'],accept:ev=>ev.type==='dsc',
          grade:ev=>ev.cat!=='Safety'?{ok:false,msg:`You sent ${ev.cat==='Urgency'?'an':'a'} ${ev.cat.toUpperCase()} call. A navigational warning is SAFETY. Send it again with the right category.`}:ev.kind!=='all'?{ok:false,msg:'Safety call sent, but a navigational warning goes to ALL SHIPS.'}:{ok:true,msg:'DSC safety call sent to all ships. Now broadcast the SECURITE message on Channel 16.'}},
        {type:'say',who:'You',title:'Navigational warning',radio:{ch:16},prompt:'Broadcast the navigational warning to all stations on Channel 16.',
          checks:[C.word3('securite','SECURITE ×3'),C.any('All stations ×3',/(all\s*stations?.*){3}/,'Say ALL STATIONS three times'),C.thisIs(),C.nameN(N,3),C.mmsi(M),C.any('“Navigational warning”',/\bnavigation(al)? warning\b/,'Say NAVIGATIONAL WARNING'),C.any('The hazard',new RegExp('\\b'+hk+'s?\\b'),`Name the hazard: ${h}`),C.pos(p),C.any('Dangerous for navigation',/\bdanger\w*\b/,'Say DANGEROUS FOR NAVIGATION'),C.any('Keep sharp lookout',/\blook ?out\b/,'Say SHIPS IN VICINITY KEEP SHARP LOOKOUT'),C.endWith('out','over')],
          model:`SECURITE, SECURITE, SECURITE\nAll stations, All stations, All stations\nThis is ${x3(N)}, ${spell(M)}\nNavigational warning\n${h[0].toUpperCase()+h.slice(1)}\n${posText(p)}\nDangerous for navigation\nShips in vicinity keep sharp lookout\nOut`},
      ]};
  }
  if(mode==='abandon'){
    const st=rnd([{n:'RCC Cyprus',k:'cyprus'},{n:'US Navy ship Augusta',k:'augusta'},{n:'RCC Haifa',k:'haifa'}]);
    return {title:'Abandon ship: transfer of control',color:'#c8261f',facts:[['Vessel',N],['MMSI',M],['Position',posShow(p)],['Situation','Fire out of control, abandoning ship'],['Answered your Mayday',st.n],['Taking with you','Portable VHF']],
      brief:`You sent a Mayday and ${st.n} answered. The fire is out of control and you are abandoning ship to the life raft with a portable VHF. Hand control of the distress to ${st.n}.`,
      steps:[
        {type:'quiz',title:'Who takes control?',q:'You are abandoning ship. Who should you hand control of the distress situation to?',options:[`The station that answered your Mayday (${st.n})`,'Nobody, keep control from the life raft','Any ship you can see'],correct:0,explain:{0:'When you decide to abandon ship, transfer control to the most suitable station that answered your distress call: a Rescue Coordination Centre or a responding vessel.'}},
        {type:'radio',title:'Check the radio',prompt:'Before you talk: Channel 16, high power.',need:[{label:'Radio switched on',test:()=>R.on},{label:'Channel 16',test:()=>R.on&&R.ch===16},{label:'High power (25 W)',test:()=>R.on&&R.pwr==='HI'}],how:['Press ON','Press the red 16 key','Press HI/LO on the handset until it shows 25W'],okMsg:'Radio ready on Channel 16, high power.'},
        {type:'say',who:'You',title:'Transfer control',radio:{ch:16,hi:true},prompt:`Tell ${st.n} you are abandoning ship and ask them to take over control.`,
          checks:[C.word1('mayday','MAYDAY'),{label:`${st.n} ×3`,hint:`Call ${st.n} three times`,test:t=>fcount(t,st.k)>=3},C.thisIs(),C.nameN(N,3),C.any('Abandoning ship to life raft',/\babandon\w*\b.*\b(life raft|raft)\b/,'Say ABANDONING SHIP TO LIFE RAFT'),C.any('With portable VHF',/\bportable\b|\bhandheld\b|\bvhf\b/,'Say WITH PORTABLE VHF'),C.any('“Take over control”',/\btakeover\b.*\bcontrol\b|\btake\s*control\b/,'Say TAKE OVER CONTROL'),C.endWith('over')],
          model:`Mayday\n${x3(st.n)}\nThis is ${x3(N)}\nAbandoning ship to life raft with portable VHF\nTake over control\nOver`},
        {type:'hear',who:st.n,text:`Mayday\n${x3(N)}\nThis is ${x2(st.n)}\nReceived. I am taking over control\nOver`},
      ]};
  }
  if(mode==='raftsart'||mode==='raftship'){
    const raft=N+' life raft', kind=rnd(['Radar SART','AIS SART']);
    const ships=[{d:'Black container ship with white bridge',k:'container'},{d:'Red tanker with black funnel',k:'tanker'},{d:'White ferry with blue funnel',k:'ferry'},{d:'Grey warship',k:'warship'}];
    const sh=rnd(ships), side=rnd(['port','starboard']);
    const prep={type:'radio',title:'Set up the portable VHF',prompt:'In the life raft: switch the portable VHF on, set high power, Channel 16, and adjust the squelch to cut background noise.',
      need:[{label:'Radio switched on',test:()=>R.on},{label:'High power',test:()=>R.on&&R.pwr==='HI'},{label:'Channel 16',test:()=>R.on&&R.ch===16},{label:'Squelch adjusted (SQL)',test:()=>R.on&&!!R.sqlTouched}],
      how:['Press ON','Press HI/LO on the handset until it shows 25W','Press the red 16 key','Press SQL to adjust the squelch'],okMsg:'Portable VHF ready: high power, Channel 16, squelch set.'};
    if(mode==='raftsart') return {title:'Life raft: SART signal',color:'#c8261f',facts:[['Life raft',raft],['On board',pob+' persons'],['You hear','Your '+kind+' beeping: a ship’s radar or AIS has picked it up']],
      brief:`You are in the life raft. Your ${kind} starts beeping, so a ship has detected it. You can't see the ship.`,
      steps:[prep,
        {type:'say',who:'You',title:'Call the ship that detected your SART',radio:{ch:16,hi:true},prompt:'Call the ship that received your SART signal.',
          checks:[C.word3('mayday'),{label:`“Ship who received my ${kind} signal” ×3`,hint:`Say SHIP WHO RECEIVED MY ${kind.toUpperCase()} SIGNAL three times`,test:t=>fcount(t,'sart')>=3||fcount(t,'received')>=3},C.thisIs(),{label:`“${raft}” ×3`,hint:`Say THIS IS ${raft.toUpperCase()} three times`,test:t=>nameCount(t,N)>=3&&fcount(t,'raft')>=3},C.any('Assistance required',/\b(assistance|assist|help)\b/,'Say REQUIRE IMMEDIATE ASSISTANCE'),C.pob(pob),C.endWith('over')],
          model:`Mayday, Mayday, Mayday\n${x3('Ship who received my '+kind+' signal')}\nThis is ${x3(raft)}\nRequire immediate assistance\n${cap(W[pob])} persons on board\nOver`},
        {type:'hear',who:'Unknown ship',text:`Mayday\n${x2(raft)}\nThis is motor vessel Orion, motor vessel Orion\nI have your SART on my radar. Proceeding to your position\nOver`},
      ]};
    return {title:'Life raft: ship in sight',color:'#c8261f',facts:[['Life raft',raft],['On board',pob+' persons'],['You see',sh.d],['The ship is passing you on its',side+' side']],
      brief:`You are in the life raft and you can see a ${sh.d.toLowerCase()} close by. You are on its ${side} side.`,
      steps:[prep,
        {type:'say',who:'You',title:'Call the ship you can see',radio:{ch:16,hi:true},prompt:'Call the ship by describing it, and tell it where you are.',
          checks:[C.word3('mayday'),{label:`Ship description ×3 (${sh.d.toLowerCase()})`,hint:`Describe the ship three times: ${sh.d.toUpperCase()}`,test:t=>fcount(t,sh.k)>=3},C.thisIs(),{label:`“${raft}” ×3`,hint:`Say THIS IS ${raft.toUpperCase()} three times`,test:t=>nameCount(t,N)>=3&&fcount(t,'raft')>=3},C.any(`“I am on your ${side} side”`,new RegExp('\\b'+side+'\\b'),`Say I AM ON YOUR ${side.toUpperCase()} SIDE`),C.any('Assistance required',/\b(assistance|assist|help)\b/,'Say REQUIRE IMMEDIATE ASSISTANCE'),C.pob(pob),C.endWith('over')],
          model:`Mayday, Mayday, Mayday\n${x3(sh.d)}\nThis is ${x3(raft)}\nI am on your ${side} side\nRequire immediate assistance\n${cap(W[pob])} persons on board\nOver`},
        {type:'hear',who:sh.d,text:`Mayday\n${x2(raft)}\nThis is the ${sh.d.toLowerCase()}\nI see you on my ${side} side. Stopping to pick you up\nOver`},
      ]};
  }
  if(mode==='portctl'){
    const pc=rnd([{n:'Haifa Port Control',k:'haifa'},{n:'Ashdod Port Control',k:'ashdod'},{n:'Bangkok Port Control',k:'bangkok'}]);
    const SB='Sailboat '+N.replace(/^(sail\s*boat|sailboat)\s+/i,'');
    return {title:'Reply to Port Control',color:'#c8261f',facts:[['Vessel',SB],['MMSI',M],['Position',posShow(p)],['Situation','Taking water fast, crew must be evacuated'],['Acknowledged by',pc.n]],
      brief:`You sent a Mayday. ${pc.n} has acknowledged and asks what you need. Your crew must be taken off the boat.`,
      steps:[
        {type:'radio',title:'Check the radio',prompt:'Stay on Channel 16, high power, for distress traffic.',need:[{label:'Radio switched on',test:()=>R.on},{label:'Channel 16',test:()=>R.on&&R.ch===16},{label:'High power (25 W)',test:()=>R.on&&R.pwr==='HI'}],how:['Press ON','Press the red 16 key','Press HI/LO on the handset until it shows 25W'],okMsg:'Radio ready on Channel 16, high power.'},
        {type:'hear',who:pc.n,text:`Mayday\n${x3(SB)}\nThis is ${x3(pc.n)}\nReceived Mayday. What assistance do you require?\nOver`},
        {type:'say',who:'You',title:`Answer ${pc.n}`,radio:{ch:16,hi:true},prompt:`Reply to ${pc.n}: ask them to send fast ships to evacuate the crew.`,
          checks:[C.word1('mayday','MAYDAY'),{label:`${pc.n} ×1`,hint:`Name the station once: ${pc.n.toUpperCase()}`,test:t=>fcount(t,pc.k)>=1},C.thisIs(),C.nameN(N,2),C.any('Send fast ships to the distress area',/\b(fast|ships?|vessels?|boats?)\b.*\b(distress|area|position|evacuat\w*)\b/,'Say SEND FAST SHIPS TO THE DISTRESS AREA'),C.any('To evacuate the crew',/\bevacuat\w*\b|\b(take|pick)\s*(off|up)\b/,'Say TO EVACUATE THE CREW'),C.endWith('over')],
          model:`Mayday\n${pc.n}\nThis is ${x2(SB)}\nSend fast ships to the distress area to evacuate the crew\nOver`},
        {type:'hear',who:pc.n,text:`Mayday\n${SB}\nThis is ${pc.n}\nReceived. Fast boats are on their way to your position\nOver`},
      ]};
  }
  // routine
  const [from,to,via]=rnd(PORTS);
  return {title:'Routine: Tango Romeo',color:'#1f8a3b',facts:[['Vessel',N],['MMSI',M],['Leaving',from],['Bound',to],...(via?[['Via',via]]:[]),['On board',pob+' persons']],
    brief:'You are leaving port and need to report your voyage details (Tango Romeo) to RCC Haifa.',
    steps:[
      TYPE_Q(3),
      {type:'radio',title:'DSC routine call to RCC Haifa',prompt:'Make a DSC individual routine call to RCC Haifa. A coast station chooses the working channel: when it acknowledges, the radio moves to the public duplex channel it picks (24, 25, 26 or 27).',
        how:['Press ON if the radio is off','Press MENU, then ▼ to Individual Call (DSC MENU - 2) → ENT','Select priority Routine → ENT','Select Address → ENT, then RCC Haifa 004281234 → ENT','Select Channel shows SET BY STATION → ENT','Individual Call Ready → ENT to transmit','Wait for the ACK: the radio moves to the working channel RCC Haifa sets'],
        accept:ev=>ev.type==='ack'||(ev.type==='dsc'&&!(ev.kind==='individual'&&ev.to&&ev.to.mmsi===RCC.mmsi&&ev.cat==='Routine')),
        grade:ev=>{ if(ev.kind!=='individual') return {ok:false,msg:'Use an INDIVIDUAL call for a routine call to one station.'}; if(!ev.to||ev.to.mmsi!==RCC.mmsi) return {ok:false,msg:`You called ${ev.to?ev.to.name:'someone else'}. Call RCC Haifa (004281234).`}; if(ev.cat!=='Routine') return {ok:false,msg:`You sent ${ev.cat.toUpperCase()}. Voyage details are ROUTINE.`}; cur.workCh=ev.ch; return {ok:true,msg:`RCC Haifa acknowledged and chose working channel ${ev.ch} (public duplex). The radio is now on Channel ${ev.ch}: give your voice call there.`} }},
      {type:'say',who:'You',title:'Call RCC Haifa',radio:{ch:'work'},prompt:'Call RCC Haifa and tell them you have a Tango Romeo.',
        checks:[{label:'RCC Haifa ×3',hint:'Call RCC HAIFA three times',test:t=>fcount(t,'haifa')>=3},C.thisIs(),C.nameN(N,3),C.mmsi(M),C.any('TANGO ROMEO',/\btangoromeo\b/,'Say TANGO ROMEO'),C.endWith('over')],
        model:`RCC Haifa, RCC Haifa, RCC Haifa\nThis is ${x3(N)}, ${spell(M)}\nTango Romeo\nOver`},
      {type:'hear',who:'RCC Haifa',text:`${x3(N)}\nThis is RCC Haifa, RCC Haifa, RCC Haifa\nGo ahead\nOver`},
      {type:'say',who:'You',title:'Voyage details',radio:{ch:'work'},prompt:'Give your Tango Romeo: where from, where to, stopover, persons on board.',
        checks:[C.any('RCC Haifa ×1',/\bhaifa\b/,'Name the station: RCC HAIFA'),C.thisIs(),C.nameN(N,2),C.any('“Tango Romeo begins”',/\btangoromeo\b/,'Say TANGO ROMEO BEGINS'),C.any('Port of departure',new RegExp('\\b'+norm(from.split(' ')[0])+'\\b'),`Say LEAVING ${from.toUpperCase()}`),C.any('Destination',new RegExp('\\b'+norm(to.split(',')[0])+'\\b'),`Say BOUND ${to.toUpperCase()}`),...(via?[C.any('Stopover',new RegExp('\\b'+norm(via.split(',')[0])+'\\b'),`Say VIA ${via.toUpperCase()}`)]:[]),C.pob(pob),C.endWith('over')],
        model:`RCC Haifa\nThis is ${x2(N)}\nTango Romeo begins:\nLeaving ${from} bound ${to}${via?' via '+via:''}\n${W[pob][0].toUpperCase()+W[pob].slice(1)} persons on board\nOver`},
      {type:'hear',who:'RCC Haifa',text:`${N}\nThis is RCC Haifa\nTango Romeo received, good voyage\nOut`},
    ]};
}
