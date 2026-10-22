/* Portable (survival craft) VHF simulator: the radio, the liferaft, the rescue ship NESHER, the scenarios and everything on screen.
   One file, run once when the page loads. */
(function(){
  "use strict";
  var root = document.getElementById("pvhf-sim");
  if (!root) return;
  var $ = function(s){ return root.querySelector(s); };
  var $$ = function(s){ return Array.prototype.slice.call(root.querySelectorAll(s)); };

  var CHANNELS = [6,8,10,12,13,14,15,16,17,67,69,71,72,73,77];
  var CHNAME = {16:"Distress, safety and calling", 6:"Intership · SAR on-scene", 13:"Bridge-to-bridge safety", 15:"On-board · 1 W max", 17:"On-board · 1 W max"};
  var NOISE = 2;                 // squelch at or below this: open, you hear hiss
  var TXR = {bracket:6, hand:6, raft:5};    // nm a ship can hear you, HIGH power
  var RXR = {bracket:15, hand:15, raft:10};  // nm you can hear the rescue ship
  var LOW_F = 0.5;
  var CAP = {prim:89280, rech:70000};                  // prim: 8 h at 1:1:8, high power
  var LOC_NAMES = {bracket:"In bracket", hand:"In hand, on deck", raft:"In the liferaft"};
  var POSE = {bracket:{x:58,y:96,r:0}, hand:{x:120,y:104,r:8}, raft:{x:226,y:176,r:-78}};
  var SHIP_KN = 14;

  function now(){ return performance.now(); }
  function pad(n){ return String(n).padStart(2,"0"); }
  function fmtT(s){ s = Math.max(0, Math.floor(s)); var h = Math.floor(s/3600), m = Math.floor(s%3600/60), x = s%60; return h ? h+":"+pad(m)+":"+pad(x) : m+":"+pad(x); }
  function addMonths(d, n){ return new Date(d.getFullYear(), d.getMonth()+n, 1); }
  function fmtMY(d){ return pad(d.getMonth()+1)+"/"+d.getFullYear(); }
  var DIG = ["zero","one","two","three","four","five","six","seven","eight","nine"];
  function spellCh(c){ return pad(c).split("").map(function(d){ return DIG[+d]; }).join("-"); }
  function chStr(c){ return pad(c); }
  var TODAY = new Date();

  // ---------- sound ----------
  var actx = null, soundOn = false, noiseGain = null;
  function beep(freq, dur, vol){
    if (!soundOn || !actx) return;
    try{
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = "square"; o.frequency.value = freq || 1200;
      g.gain.setValueAtTime(vol || 0.04, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (dur || 0.1));
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + (dur || 0.1) + 0.02);
    }catch(e){}
  }
  function startNoise(){
    try{
      var len = actx.sampleRate * 2, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      var src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
      var f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2200; f.Q.value = 0.6;
      noiseGain = actx.createGain(); noiseGain.gain.value = 0;
      src.connect(f); f.connect(noiseGain); noiseGain.connect(actx.destination); src.start();
    }catch(e){ noiseGain = null; }
  }
  function setNoise(level){
    if (!noiseGain || !actx) return;
    try{ noiseGain.gain.setTargetAtTime(soundOn ? level : 0, actx.currentTime, 0.05); }catch(e){}
  }
  var VOICES = {nesher:{pitch:0.8, rate:1.05}, bridge:{pitch:1.1, rate:1.1}, haifa:{pitch:0.95, rate:1}};
  function speak(text, who){
    if (!soundOn || !("speechSynthesis" in window)) return;
    try{
      var u = new SpeechSynthesisUtterance(text.replace(/-/g, " "));
      var v = VOICES[who] || {pitch:1, rate:1};
      u.pitch = v.pitch; u.rate = v.rate; u.volume = Math.min(1, 0.3 + st.vol / 10);
      u.lang = "en-GB";
      window.speechSynthesis.speak(u);
    }catch(e){}
  }
  function hush(){ try{ if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }catch(e){} }

  // ---------- state ----------
  var st, gen = 0;
  function freshState(){
    return {
      simT:0, speed:10, paused:false,
      on:false, ch:16, vol:5, sq:3, hi:true, batt:"rech",
      packs:{rech:{pct:100}, prim:{pct:100, sealed:true}},
      loc:"bracket", dead:false,
      keyed:false, keyedAt:0, txUntil:0, txSec:0, txCount:0,
      rxUntil:0, rxFrom:null,
      everHiss:false, spareTaken:false,
      ship:null, nesherCh:16, nesherCalls:false, callEvery:180, nextCallT:0, phase:"none", sawLight:false, bridgeOn:true,
      checkReplied:false, awaiting:null,
      c:{on:null, w16:null, heard:null, heardYou:null, ch06:null, rec:null},
      msgs:[], msgsDirty:true,
      log:[], logDirty:true, stepsDirty:true, labelDirty:true,
      label:null, labelChecked:{bat:false, seal:false, type:false, rech:false}, reported:false,
      scenario:"free", steps:[], done:false,
      feedback:{text:"", kind:"info"}, feedbackDirty:true, hintShown:{}
    };
  }
  function makeLabel(bad){
    var l = {
      bat:{name:"Sealed battery expiry", d:addMonths(TODAY, 22), expired:false},
      seal:{name:"Sealed battery seal", text:"Intact", expired:false},
      type:{name:"Type", text:"Two-way VHF · survival craft · GMDSS", expired:false},
      rech:{name:"Rechargeable pack", text:"Charged, in the charger", expired:false}
    };
    if (bad === "bat"){ l.bat.d = addMonths(TODAY, -3); l.bat.expired = true; }
    if (bad === "seal"){ l.seal.text = "Broken: battery used"; l.seal.expired = true; }
    return l;
  }

  // ---------- helpers ----------
  function later(ms, fn){ var g = gen; setTimeout(function(){ if (g === gen) fn(); }, ms); }
  function addLog(text, kind){ st.log.unshift({t:st.simT, text:text, kind:kind||"info"}); if (st.log.length > 100) st.log.pop(); st.logDirty = true; news("log"); }
  function say(text, kind){ st.feedback = {text:text, kind:kind||"info"}; st.feedbackDirty = true; }
  function pushMsg(m){ st.msgs.push(m); if (st.msgs.length > 40) st.msgs.shift(); st.msgsDirty = true; }
  var activeTab = "steps";
  function news(tab){ if (tab !== activeTab){ var b = root.querySelector('.es-tab[data-tab="'+tab+'"]'); if (b) b.classList.add("has-news"); } }
  function onOwnVessel(){ return st.loc === "bracket" || st.loc === "hand"; }
  function pack(){ return st.packs[st.batt]; }
  function txActive(){ return now() < st.txUntil; }
  function rxActive(){ return now() < st.rxUntil; }
  function txRange(){ return TXR[st.loc] * (st.hi ? 1 : LOW_F); }
  function shipD(){ return st.ship ? st.ship.d : null; }
  function powered(){ return st.on && !st.dead; }
  function bridgeHere(){ return st.bridgeOn && onOwnVessel(); }
  function etaMin(){ return Math.max(2, Math.round(shipD() / SHIP_KN * 60)); }
  function miles(d){ return d < 1.5 ? d.toFixed(1) : String(Math.round(d)); }

  var STN = {nesher:"NESHER", bridge:"Bridge", haifa:"Haifa Radio"};

  // signal strength of a station at your radio, 0 = not heard at all
  function strength(from){
    if (from === "bridge") return bridgeHere() ? 9 : 0;
    if (from === "haifa") return onOwnVessel() ? 5 : 0;
    var d = shipD(), R = RXR[st.loc];
    if (d == null || d > R) return 0;
    return 3 + 6 * (1 - d / R);
  }
  function rxReason(from, ch){
    if (!st.on) return "off";
    if (st.dead) return "batt";
    if (st.keyed || txActive()) return "tx";
    if (ch !== st.ch) return "ch";
    var S = strength(from);
    if (S <= 0) return "range";
    if (S <= st.sq) return "sq";
    if (st.vol < 2) return "vol";
    return null;
  }
  var WHY_MISSED = {
    off:function(){ return "your radio was off"; },
    batt:function(){ return "your battery is flat"; },
    tx:function(){ return "you were transmitting at the time"; },
    ch:function(f, ch){ return "you're on channel " + chStr(st.ch) + " and the call was on channel " + chStr(ch); },
    range:function(){ return "the ship is too far away to hear from " + LOC_NAMES[st.loc].toLowerCase(); },
    sq:function(){ return "the squelch (" + st.sq + ") is set too high for that weak signal"; },
    vol:function(){ return "the volume is too low to hear it"; }
  };

  // a station transmits
  function incoming(from, ch, text, onHeard){
    var reason = rxReason(from, ch);
    var dur = Math.min(8000, Math.max(2400, text.length * 38));
    if (!reason){
      st.rxUntil = now() + dur; st.rxFrom = from;
      pushMsg({who:STN[from] + " · ch " + chStr(ch), text:text});
      speak(text, from);
      rxFx();
      if (onHeard) onHeard();
    } else {
      addLog("Missed: " + STN[from] + " transmitted on ch " + chStr(ch) + ", but " + WHY_MISSED[reason](from, ch) + ".", "warn");
      if (from === "nesher" && st.scenario !== "hear"){
        var key = reason + ch;
        if (!st.hintShown[key]){ st.hintShown[key] = true; say("NESHER is calling, but you can't hear her: " + WHY_MISSED[reason](from, ch) + ".", "warn"); }
      }
      if (from === "nesher" && st.scenario === "hear" && !st.hintShown.hear){ st.hintShown.hear = true; say("Silence. NESHER should be calling you. Check the channel, the volume and the squelch.", "warn"); }
    }
    return !reason;
  }

  // ---------- scenarios ----------
  var SCEN = {
    free:{ name:"Free practice",
      brief:"Try anything. The bridge listens on channel 15 for radio checks. The rescue ship NESHER is about 4 nm away, listening on channel 16, if you take the radio into the liferaft and call for help.",
      setup:function(){ st.ship = {d:4, v:0}; }, steps:[] },
    monthly:{
      name:"Monthly check",
      brief:"Test survival craft radio no. 2 with the bridge, on its rechargeable battery so the sealed emergency battery stays unused. The bridge listens on channel 15.",
      setup:function(){ st.sq = 6; st.vol = 4; st.ch = 16; },
      steps:[
        {t:"Check the sealed battery's expiry date and seal (Label tab)", ev:function(e){ return e.type==="label" && st.labelChecked.bat && st.labelChecked.seal; }},
        {t:"Switch the radio on", ev:function(e){ return e.type==="state" && st.on; }},
        {t:"Set the squelch: down until you hear the hiss, then up until it just stops", ev:function(e){ return e.type==="sqset"; }},
        {t:"Select channel 15 or 17 and LOW power", ev:function(e){ return e.type==="state" && st.on && (st.ch===15 || st.ch===17) && !st.hi; }},
        {t:"Call the bridge for a radio check and hear the reply", ev:function(e){ return e.type==="check-ok"; }},
        {t:"Switch off and put it back in its bracket", ev:function(e){ return e.type==="state" && !st.on && st.loc==="bracket" && st.checkReplied; }},
        {t:"Record the check in the radio log (Log tab)", ev:function(e){ return e.type==="logged"; }}
      ],
      win:"Check done. The radio works on its rechargeable battery and the sealed emergency battery is still unused and in date. Tests stay off channel 16, on low power."
    },
    abandon:{
      name:"Abandon ship",
      brief:"Fire is out of control and the master has ordered abandon ship. A DSC distress alert has gone out, and the rescue ship NESHER is on her way, about 9 nm off. Take survival craft radio no. 2 into the liferaft, and take its sealed spare battery with you.",
      // left as it was after the last monthly test: channel 15, low power, squelch high
      setup:function(){ st.ship = {d:9, v:SHIP_KN}; st.nesherCalls = true; st.callEvery = 180; st.nextCallT = 90; st.ch = 15; st.hi = false; st.sq = 6; st.bridgeOn = false; },
      steps:[
        {t:"Take the radio from its bracket", ev:function(e){ return e.type==="loc" && e.loc==="hand"; }},
        {t:"Take the sealed spare battery with you", ev:function(e){ return e.type==="spare"; }},
        {t:"Get into the liferaft", ev:function(e){ return e.type==="loc" && e.loc==="raft"; }},
        {t:"Switch the radio on", ev:function(e){ return e.type==="state" && st.on; }},
        // switch-on checks, in this order: squelch, channel 16, high power
        {t:"Set the squelch: down until you hear the hiss, then up until it just stops", ev:function(e){ return e.type==="sqset"; }},
        {t:"Select channel 16", ev:function(e){ return e.type==="state" && st.on && st.ch===16 && stepDone(4); }},
        {t:"Make sure it's on HIGH power", ev:function(e){ return e.type==="state" && st.on && st.hi && stepDone(5); }},
        {t:"Answer NESHER on channel 16", ev:function(e){ return e.type==="contact"; }},
        {t:"Change to channel 06 when asked, and check in", ev:function(e){ return e.type==="ch06"; }},
        {t:"NESHER comes alongside", ev:function(e){ return e.type==="recovered"; }}
      ],
      win:"Rescued. From the liferaft, low to the water, your radio on high power reached NESHER at about 5 nm. You heard her well before she heard you: her set has more power and a much higher aerial."
    },
    hear:{
      name:"Can't hear a thing",
      brief:"You're in the liferaft. The radio is on, but it's silent. NESHER is searching about 4.5 nm away and calling you on channel 16. Find out why you can't hear her, then answer.",
      setup:function(){
        st.ship = {d:4.5, v:0}; st.nesherCalls = true; st.callEvery = 90; st.nextCallT = 20; st.bridgeOn = false;
        st.loc = "raft"; st.batt = "prim"; st.spareTaken = true; st.packs.prim.sealed = false; st.packs.prim.pct = 92;
        st.on = true; st.ch = 13; st.vol = 1; st.sq = 9; st.c.on = 0;
      },
      steps:[
        {t:"Select channel 16", ev:function(e){ return e.type==="state" && st.on && st.ch===16; }},
        {t:"Turn the volume up", ev:function(e){ return e.type==="state" && st.vol >= 4; }},
        {t:"Turn the squelch down until you hear the hiss", ev:function(e){ return e.type==="hiss"; }},
        {t:"Turn it back up until the hiss just stops", ev:function(e){ return e.type==="sqset"; }},
        {t:"Hear NESHER calling you", ev:function(e){ return e.type==="heard"; }},
        {t:"Answer her", ev:function(e){ return e.type==="contact"; }}
      ],
      win:"Contact. The squelch was set so high that it shut out NESHER's weak signal. Set it just above the hiss: low enough for weak stations, high enough to stop the noise."
    },
    inspect:{
      name:"Pre-departure inspection",
      brief:"Check survival craft radio no. 2 before sailing (Label tab). One item is not right. Find it and report it.",
      steps:[
        {t:"Check the sealed battery's expiry date", ev:function(e){ return e.type==="label" && e.k==="bat"; }},
        {t:"Check the sealed battery's seal", ev:function(e){ return e.type==="label" && e.k==="seal"; }},
        {t:"Check it is a GMDSS survival craft VHF", ev:function(e){ return e.type==="label" && e.k==="type"; }},
        {t:"Check the rechargeable pack", ev:function(e){ return e.type==="label" && e.k==="rech"; }},
        {t:"Report the problem", ev:function(e){ return e.type==="report"; }}
      ],
      win:"Don't sail relying on this radio until it's sorted. The sealed battery must be in date and unused, because it has to give 8 hours of operation in an emergency."
    }
  };

  function stepDone(i){ return !!(st.steps[i] && st.steps[i].done); }
  function emit(e){
    if (e.type === "state" && st.on && st.ch === 16 && st.c.w16 == null){ st.c.w16 = st.simT; }
    if (st.done) return;
    var changed = false;
    st.steps.forEach(function(s){ if (!s.done && s.ev(e)){ s.done = true; changed = true; } });
    if (changed){
      st.stepsDirty = true; news("steps");
      if (st.steps.length && st.steps.every(function(s){ return s.done; })){ st.done = true; say("Scenario complete. " + SCEN[st.scenario].win, "ok"); }
    }
  }
  function state(){ emit({type:"state"}); }

  // ---------- what you can say ----------
  var ME = "AMALIA LIFERAFT";
  function msgMayday(){ return "MAYDAY MAYDAY MAYDAY. This is " + ME + ", " + ME + ", " + ME + ". MAYDAY " + ME + ". Ship abandoned after fire, about 10 miles west of Haifa. 14 persons in one liferaft, two injured. Over."; }
  function sayOptions(){
    if (onOwnVessel()){
      var o = [
        {text:"Bridge, this is survival craft radio two. Radio check on channel " + spellCh(st.ch) + ". Over.", act:"check"},
        {text:"Testing, testing, one, two, three.", bad:"There's no call and no identification. Always say who you're calling and who you are."},
        {text:"MAYDAY MAYDAY MAYDAY. This is AMALIA, AMALIA, AMALIA. Radio check. Over.", bad:"That's a false distress call. MAYDAY is only for grave and imminent danger. Never use it for a test."}
      ];
      if (st.checkReplied) o.push({text:"Bridge, this is survival craft radio two. Thank you. Out.", act:"close"});
      return o;
    }
    var ph = st.phase;
    if (ph === "go06") return [
      {text:"MAYDAY. NESHER, this is " + ME + ", on channel zero-six. Over.", act:"ack06"},
      {text:"MAYDAY RELAY, MAYDAY RELAY, MAYDAY RELAY. This is " + ME + ". Over.", bad:"MAYDAY RELAY passes on another vessel's distress. You are the station in distress."},
      {text:"NESHER, NESHER. Over and out.", bad:"Over asks for a reply and Out ends the exchange. Use one or the other, never both. You also need to say who you are."}
    ];
    if (ph === "on06") return [
      {text:"MAYDAY. NESHER, this is " + ME + ". Understood, we will show a light. Over.", act:"light"},
      {text:"SILENCE FINI. Thank you NESHER. Out.", bad:"SILENCE FINI ends radio silence after distress traffic, and only the station in control sends it."},
      {text:"Roger roger, see you soon!", bad:"No MAYDAY, no names. In distress traffic every message starts with MAYDAY and says who is calling whom."}
    ];
    if (ph === "acked" || ph === "light" || ph === "done16") return [
      {text:"MAYDAY. NESHER, this is " + ME + ". All persons still well. Over.", act:"status"},
      {text:"Hello? Are you still there? Please hurry!", bad:"No MAYDAY and no names. Keep transmissions short, structured and to the point."},
      {text:"PAN PAN, PAN PAN, PAN PAN. All stations, this is " + ME + ". Over.", bad:"PAN PAN is the urgency signal. Your distress is already acknowledged: keep working with NESHER under MAYDAY."}
    ];
    if (ph === "called") return [
      {text:"MAYDAY. NESHER, NESHER, NESHER. This is " + ME + ", " + ME + ", " + ME + ". Receiving you. 14 persons in one liferaft, two injured. Over.", act:"ack"},
      {text:"Help! We're here, we can hear you, please hurry!", bad:"That doesn't say who you're calling or who you are. Start with MAYDAY, name the station, give your own name, then your information."},
      {text:"SEELONCE MAYDAY.", bad:"SEELONCE MAYDAY is used by the station in control of distress traffic to impose silence. It isn't a reply."}
    ];
    return [
      {text:msgMayday(), act:"mayday"},
      {text:"Hello? Is anybody there? Please help us!", bad:"No distress signal, no name, no position. Say MAYDAY three times, your name three times, then where you are, what happened and how many people."},
      {text:"PAN PAN, PAN PAN, PAN PAN. All stations, this is " + ME + ". We need assistance. Over.", bad:"PAN PAN is the urgency signal. Your ship is abandoned and people are in a liferaft: that's grave and imminent danger, so MAYDAY."}
    ];
  }

  // ---------- transmitting ----------
  function keyUp(){
    if (st.keyed){ release(false); return; }
    if (txActive()) return;
    if (!st.on){ say("The radio is off. Switch it on first.", "warn"); return; }
    if (st.dead){ say("The battery is flat. Nothing happens.", "warn"); return; }
    if (rxActive()){
      addLog("You keyed up over " + STN[st.rxFrom] + ": their message was lost.", "warn");
      say("Someone was talking. Pressing PTT blocked them, and you lost the message. Listen first, then transmit.", "warn");
      st.rxUntil = 0; hush();
    }
    st.keyed = true; st.keyedAt = now(); st.txCount++;
    beep(1400, 0.04, 0.03);
    renderSay();
  }
  function release(spoke){
    if (!st.keyed) return;
    st.keyed = false;
    if (!spoke){ addLog("PTT released without speaking: a dead carrier on ch " + chStr(st.ch) + ".", "info"); }
    $("#pv-say").hidden = true;
  }
  function transmit(opt){
    if (!st.keyed) return;
    var dur = Math.min(6000, Math.max(1800, opt.text.length * 32));
    st.keyed = false; $("#pv-say").hidden = true;
    st.txUntil = now() + dur;
    pushMsg({who:"You · ch " + chStr(st.ch) + " · " + (st.hi ? "HI" : "LO"), text:opt.text, me:true, bad:!!opt.bad});
    addLog("You transmitted on ch " + chStr(st.ch) + " (" + (st.hi ? "high" : "low") + " power).", "tx");
    txFx();
    if (opt.bad){ say(opt.bad, "warn"); }
    later(dur + 300, function(){ deliver(opt); });
  }

  function nesherHears(){
    return st.ship && !st.ship.rec && st.ch === st.nesherCh && shipD() <= txRange();
  }
  function noReply(target){
    var why;
    if (target === "nesher"){
      if (!st.ship) why = "No one is listening.";
      else if (st.ship.rec) why = "NESHER is already alongside.";
      else if (st.ch !== st.nesherCh) why = "NESHER is listening on channel " + chStr(st.nesherCh) + ", not " + chStr(st.ch) + ".";
      else why = "NESHER is " + shipD().toFixed(1) + " nm away. " + (st.loc === "raft" ? "From the liferaft" : LOC_NAMES[st.loc]) + " on " + (st.hi ? "high" : "low") + " power, your radio reaches only about " + txRange() + " nm." + (!st.hi ? " Switch to HIGH." : st.loc === "raft" ? " Keep listening and call again as she closes." : "");
    } else why = "Nobody is listening on channel " + chStr(st.ch) + ". The bridge keeps its on-board radio on channel 15.";
    later(3500, function(){ pushMsg({sys:true, text:"No reply."}); addLog("No reply. " + why, "warn"); say("No reply. " + why, "warn"); });
  }
  function deliver(opt){
    if (opt.bad){
      if (!onOwnVessel() && opt.text.indexOf("PAN PAN") === 0 && nesherHears() && st.phase === "none") later(1200, function(){ nesherSays(st.nesherCh, "Station calling PAN PAN, this is NESHER. Say again your name and nature of your problem. Over."); });
      return;
    }
    var a = opt.act;
    if (a === "check"){
      if (st.ch === 16){
        later(1500, function(){ incoming("haifa", 16, "Station calling for a radio check on channel one-six, this is Haifa Radio. Channel one-six is for distress, urgency, safety and calling only. Use a working channel. Out."); });
        say("Never use channel 16 for a test. The bridge listens on channel 15 for on-board traffic.", "warn");
        return;
      }
      if ((st.ch === 15 || st.ch === 17) && bridgeHere()){
        if (st.hi) say("Channels 15 and 17 are for on-board use at 1 W or less. Switch to LOW.", "warn");
        later(1400, function(){
          incoming("bridge", st.ch, "Survival craft radio two, this is Bridge. Reading you loud and clear. Over.", function(){
            st.checkReplied = true; addLog("Radio check with the bridge: loud and clear.", "ok"); emit({type:"check-ok"});
          });
        });
        return;
      }
      if (!bridgeHere() && (st.ch === 15 || st.ch === 17)){ later(3500, function(){ pushMsg({sys:true, text:"No reply."}); say("No reply. The bridge can't hear you from here.", "warn"); }); return; }
      noReply("bridge"); return;
    }
    if (a === "close") return;
    if (!nesherHears()){ noReply("nesher"); return; }
    var c = st.c;
    if (a === "mayday" || a === "ack"){
      if (st.phase !== "none" && st.phase !== "called") return;
      st.phase = "acked"; if (c.heardYou == null) c.heardYou = st.simT;
      st.ship.v = SHIP_KN; news("status");
      addLog("NESHER heard you at " + shipD().toFixed(1) + " nm.", "ok");
      emit({type:"contact"});
      var head = a === "mayday"
        ? "MAYDAY. " + ME + ", " + ME + ", " + ME + ". This is NESHER, NESHER, NESHER. RECEIVED MAYDAY. "
        : "MAYDAY. " + ME + ", this is NESHER. Received. ";
      var tail = st.scenario === "hear" ? "I am steering for you, ETA " + etaMin() + " minutes. Keep listening on channel one-six. Out."
        : "I am " + miles(shipD()) + " miles from you, ETA " + etaMin() + " minutes. Change to channel zero-six for on-scene communication. Over.";
      later(1500, function(){
        nesherSays(16, head + tail);
        if (st.scenario === "hear"){ st.phase = "done16"; return; }
        st.phase = "go06"; st.nesherCh = 6; st.nextCallT = st.simT + 120; lastCallReal = now();
      });
      return;
    }
    if (a === "ack06"){
      if (st.phase !== "go06") return;
      st.phase = "on06"; if (c.ch06 == null) c.ch06 = st.simT; news("status");
      emit({type:"ch06"});
      later(1500, function(){ nesherSays(6, "MAYDAY. " + ME + ", this is NESHER. Loud and clear on channel zero-six. I have your SART on radar, " + miles(shipD()) + " miles. Show a light when you see us. Over."); });
      return;
    }
    if (a === "light"){
      st.phase = "light";
      later(1400, function(){ nesherSays(st.nesherCh, "MAYDAY. " + ME + ", this is NESHER. Roger. Out."); });
      return;
    }
    if (a === "status"){
      later(1400, function(){ nesherSays(st.nesherCh, "MAYDAY. " + ME + ", this is NESHER. Roger, " + miles(shipD()) + " miles to go. Out."); });
    }
  }
  function nesherSays(ch, text){
    return incoming("nesher", ch, text, function(){
      if (st.c.heard == null){ st.c.heard = st.simT; news("status"); }
      emit({type:"heard"});
    });
  }
  function nesherCall(){
    if (st.phase === "none" || st.phase === "called"){
      nesherSays(16, "MAYDAY. " + ME + ", " + ME + ", " + ME + ". This is NESHER, NESHER, NESHER. Do you read me? Over.");
      if (st.c.heard != null && st.phase === "none") st.phase = "called";
    } else if (st.phase === "go06"){
      nesherSays(6, "MAYDAY. " + ME + ", this is NESHER on channel zero-six. How do you read? Over.");
    }
  }

  // ---------- controls ----------
  function setPower(on){
    if (on === st.on) return;
    if (st.keyed) release(false);
    st.on = on;
    if (on){
      if (st.c.on == null) st.c.on = st.simT;
      if (pack().pct <= 0){ st.dead = true; addLog("Switched on, but the battery is flat.", "warn"); say("Nothing on the display. The battery is flat.", "warn"); }
      else {
        st.dead = false; beep(1600, 0.06);
        addLog("Radio ON, channel " + chStr(st.ch) + ", " + (st.batt === "prim" ? "sealed emergency battery" : "rechargeable battery") + ".", "info");
        if (st.sq <= NOISE) st.everHiss = true;
        if (!onOwnVessel()) say("Radio on. Now check, in this order: squelch, channel 16, HIGH power.", "info");
      }
    } else { addLog("Radio OFF.", "info"); hush(); }
    state();
  }
  function setBatt(b){
    if (b === st.batt) return;
    if (st.on){ say("Switch the radio off before you change the battery.", "warn"); return; }
    st.batt = b;
    if (b === "prim"){
      if (st.packs.prim.sealed){
        st.packs.prim.sealed = false; st.labelDirty = true;
        addLog("Seal broken: sealed emergency battery fitted. It must be replaced with a new sealed battery after use.", st.scenario === "monthly" || st.scenario === "free" && onOwnVessel() ? "warn" : "info");
        if (st.scenario === "monthly") say("That breaks the seal on the emergency battery. Routine tests use the rechargeable pack. Now the sealed battery has to be replaced.", "warn");
        else say("Sealed emergency battery fitted: 8 hours at full power with a duty cycle of 1:9.", "info");
      } else addLog("Emergency battery fitted (seal already broken).", "info");
      if (st.label.bat.expired) say("This battery is past its expiry date. It may not last.", "warn");
    } else addLog("Rechargeable battery fitted.", "info");
    if (b === "prim" && !st.spareTaken){ st.spareTaken = true; emit({type:"spare"}); }
    emit({type:"batt", b:b});
  }
  function key(k){
    if (!st.on || st.dead){ say("The radio is off.", "info"); return; }
    if (st.keyed || txActive()){ say("You're transmitting. Release PTT first.", "info"); return; }
    beep(2000, 0.02, 0.02);
    if (st.scenario === "abandon" && !onOwnVessel()){
      if ((k === "up" || k === "down" || k === "16" || k === "hl") && !stepDone(4) && !st.hintShown.sqFirst){ st.hintShown.sqFirst = true; say("Squelch first: SQ − until you hear the hiss, then SQ + until it just stops. Then channel 16, then HIGH power.", "info"); }
      else if (k === "hl" && stepDone(4) && !stepDone(5) && !st.hintShown.chFirst){ st.hintShown.chFirst = true; say("Channel 16 first, then check the power.", "info"); }
    }
    if (k === "up" || k === "down"){
      var i = CHANNELS.indexOf(st.ch); i = (i + (k === "up" ? 1 : CHANNELS.length - 1)) % CHANNELS.length; st.ch = CHANNELS[i];
    } else if (k === "16"){ st.ch = 16; }
    else if (k === "hl"){
      st.hi = !st.hi;
      addLog("Power " + (st.hi ? "HIGH" : "LOW") + ".", "info");
      if (st.hi && (st.ch === 15 || st.ch === 17) && onOwnVessel()) say("Channels 15 and 17 are for on-board use at 1 W or less. Keep LOW here.", "warn");
      else if (st.hi && !onOwnVessel()) say("HIGH power: full range, about " + txRange() + " nm from the liferaft.", "ok");
      else if (!st.hi && st.ship && !onOwnVessel() && shipD() > TXR[st.loc] * LOW_F) say("Low power saves the battery, but your range halves. Use HIGH until the ship is close.", "info");
    }
    else if (k === "vol+") st.vol = Math.min(9, st.vol + 1);
    else if (k === "vol-") st.vol = Math.max(0, st.vol - 1);
    else if (k === "sq+" || k === "sq-"){
      st.sq = Math.max(0, Math.min(9, st.sq + (k === "sq+" ? 1 : -1)));
      if (st.sq <= NOISE){ if (!st.everHiss) say("Hiss: the squelch is open. Now turn it up until the hiss just stops.", "info"); st.everHiss = true; emit({type:"hiss"}); }
      else if (st.sq === NOISE + 1 && st.everHiss && k === "sq+"){ say("Hiss gone. Squelch set just above the noise: weak stations still get through.", "ok"); emit({type:"sqset"}); }
      else if (st.sq >= 6 && k === "sq+") say("Squelch high. Weak stations will be cut out.", "warn");
    }
    if (k === "up" || k === "down" || k === "16"){
      if (st.ch === 6 && st.phase === "go06") say("Channel 06. Now check in with NESHER.", "info");
    }
    state();
  }
  function moveTo(loc, txt, fb, kind){
    st.loc = loc; addLog(txt, "info"); say(fb, kind || "info"); emit({type:"loc", loc:loc}); state();
  }
  function btnRemove(){
    if (st.loc === "bracket") moveTo("hand", "Radio taken out of its bracket.", "Out of the bracket." + (st.scenario === "abandon" && !st.spareTaken ? " Take the sealed spare battery with you too." : ""));
    else if (st.loc === "hand") moveTo("bracket", "Radio returned to its bracket.", "Back in its bracket.");
  }
  function btnRaft(){
    if (st.loc === "hand") moveTo("raft", "Radio taken into the liferaft.", "In the liferaft the radio is low to the water: on HIGH power a ship can hear you about " + TXR.raft + " nm away." + (st.scenario === "abandon" && !st.spareTaken ? " The sealed spare battery is still on board: go back on deck for it." : ""), (st.scenario === "abandon" && !st.spareTaken) ? "warn" : "info");
    else if (st.loc === "raft") moveTo("hand", "Radio taken back on deck.", "Back on deck.");
  }
  function btnSpare(){
    if (st.spareTaken) return;
    if (st.loc === "raft"){ say("The spare battery is on board. Go back on deck to get it.", "warn"); return; }
    st.spareTaken = true;
    addLog("Sealed spare battery taken, still sealed.", "info");
    say("Sealed spare battery with you, seal intact. Fit it only if the radio's own battery runs low.", "ok");
    emit({type:"spare"}); state();
  }
  function recordLog(){
    var txt = st.checkReplied ? "Radio log: survival craft VHF no. 2 tested with the bridge on ch " + chStr(st.ch) + ", rechargeable battery, loud and clear." : st.c.heardYou != null ? "Radio log: distress communications with NESHER recorded." : "Radio log: survival craft VHF no. 2 checked.";
    addLog(txt, "ok"); say("Entry made in the GMDSS radio log.", "ok"); emit({type:"logged"});
  }
  function checkLabel(k){
    st.labelChecked[k] = true; st.labelDirty = true;
    var it = st.label[k];
    if (it.expired) say(it.name + (k === "seal" ? " is broken. The emergency battery has been used and must be replaced." : " is past its date. Sort this out before sailing."), "warn");
    emit({type:"label", k:k});
  }
  function report(){
    if (st.reported) return;
    st.reported = true; st.labelDirty = true;
    addLog(st.label.bat.expired ? "Reported: sealed battery out of date, replacement ordered." : "Reported: sealed battery seal broken, new battery ordered.", "ok");
    emit({type:"report"});
  }

  // ---------- scene fx ----------
  var SVGNS = "http://www.w3.org/2000/svg";
  var fxG = $("#pv-fx");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function tip(){ var p = POSE[st.loc]; return {x:p.x, y:p.y}; }
  function shipPose(){ var d = Math.min(shipD(), 12), f = d / 12; return {x:305 + 100*f, s:0.25 + 0.75*(1 - f)*(1 - f)}; }
  function ring(x, y, color, delay){
    var c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 5); c.setAttribute("fill", "none");
    c.style.stroke = color; c.setAttribute("stroke-width", 2); c.style.transformBox = "fill-box"; c.style.transformOrigin = "center"; c.style.opacity = 0;
    fxG.appendChild(c);
    if (c.animate && !reduceMotion){
      var an = c.animate([{transform:"scale(1)", opacity:.95},{transform:"scale(7)", opacity:0}], {duration:1400, delay:delay||0, easing:"ease-out"});
      an.onfinish = function(){ c.remove(); };
    } else { c.style.opacity = .8; setTimeout(function(){ c.remove(); }, 700); }
  }
  function txFx(){ var t = tip(); for (var i = 0; i < 3; i++) ring(t.x, t.y, "var(--coral)", i * 450); }
  function rxFx(){
    var t;
    if (st.rxFrom === "nesher" && st.ship && shipD() <= 12){ var p = shipPose(); t = {x:p.x + 76*p.s, y:200 - 70*p.s}; }
    else if (st.rxFrom === "bridge" || st.rxFrom === "haifa"){ t = {x:20, y:8}; }
    else return;
    for (var i = 0; i < 3; i++) ring(t.x, t.y, "var(--teal)", i * 450);
  }

  // ---------- static UI ----------
  var CHAIN = [
    {k:"on", n:"Radio on", s:"Battery fitted, switched on"},
    {k:"w16", n:"Watching channel 16", s:"Listening where they'll call"},
    {k:"heard", n:"You hear NESHER", s:"Her signal reaches you"},
    {k:"heardYou", n:"NESHER hears you", s:"You're within your radio's range"},
    {k:"ch06", n:"On channel 06", s:"On-scene communication"},
    {k:"rec", n:"Alongside", s:"Survivors recovered"}
  ];
  $("#pv-chain").innerHTML = CHAIN.map(function(c){ return '<li data-k="'+c.k+'"><div><b>'+c.n+'</b><span>'+c.s+'</span></div><em>—</em></li>'; }).join("");
  var chainLis = {}; $$("#pv-chain li").forEach(function(li){ chainLis[li.dataset.k] = li; });

  function selectTab(name){
    activeTab = name;
    $$(".es-tab").forEach(function(b){ var on = b.dataset.tab === name; b.setAttribute("aria-selected", on ? "true" : "false"); if (on) b.classList.remove("has-news"); });
    $$(".es-pane").forEach(function(p){ p.classList.toggle("is-off", p.dataset.pane !== name); });
  }

  // ---------- load scenario ----------
  function loadScenario(key){
    gen++; hush(); lastCallReal = -1e9;
    var sp = st ? st.speed : 10;
    st = freshState(); st.speed = sp; st.scenario = key;
    st.label = makeLabel(key === "inspect" ? (Math.random() < 0.5 ? "bat" : "seal") : null);
    if (key === "inspect" && st.label.seal.expired) st.packs.prim.sealed = false;
    var sc = SCEN[key];
    st.steps = sc.steps.map(function(s){ return {t:s.t, ev:s.ev, done:false}; });
    while (fxG.firstChild) fxG.removeChild(fxG.firstChild);
    $("#pv-say").hidden = true;
    $("#pv-sc-h").textContent = sc.name;
    $("#pv-brief").textContent = sc.brief;
    addLog("Scenario: " + sc.name + ".", "info");
    if (sc.setup) sc.setup();
    if (key === "hear") addLog("Radio on, in the liferaft, sealed battery in use.", "info");
    say(key === "hear" || key === "abandon" ? sc.brief : "", "info");
    $$(".es-tab").forEach(function(b){ b.classList.remove("has-news"); });
    selectTab(key === "inspect" ? "label" : "steps");
    lastPose = "";
    renderAll();
  }

  // ---------- rendering ----------
  var el = {
    svg:$("#pv-svg"), radioG:$("#pv-radio-g"), rship:$("#pv-rship"), shipT:$("#pv-ship-t"), rangeT:$("#pv-range-t"), locT:$("#pv-loc-t"),
    lcdSvg:$("#pv-lcd-svg"), txdot:$("#pv-txdot"),
    btnRemove:$("#pv-btn-remove"), btnRaft:$("#pv-btn-raft"), btnSpare:$("#pv-btn-spare"),
    feedback:$("#pv-feedback"), knob:$("#pv-knob"),
    lcd:$("#pv-lcd"), fHi:$("#pv-f-hi"), fLo:$("#pv-f-lo"), fBusy:$("#pv-f-busy"), fTx:$("#pv-f-tx"), battIco:$("#pv-batt-ico"),
    lcdCh:$("#pv-lcd-ch"), lcdName:$("#pv-lcd-name"), lcdVol:$("#pv-lcd-vol"), lcdSq:$("#pv-lcd-sq"), lcdBatt:$("#pv-lcd-batt"),
    ptt:$("#pv-ptt"), pttHelp:$("#pv-ptt-help"),
    mode:$("#pv-mode"), clock:$("#pv-clock"), stripShip:$("#pv-strip-ship"),
    trCh:$("#pv-tr-ch"), trState:$("#pv-tr-state"), msgs:$("#pv-msgs"), hint:$("#pv-hint"),
    rCh:$("#pv-r-ch"), rBatt:$("#pv-r-batt"), rTx:$("#pv-r-tx"), rRx:$("#pv-r-rx"),
    rLoc:$("#pv-r-loc"), rBt:$("#pv-r-bt"), rSeal:$("#pv-r-seal"), rSpare:$("#pv-r-spare"), rPw:$("#pv-r-pw"), rSq:$("#pv-r-sq"), rTxt:$("#pv-r-txt"),
    chainNote:$("#pv-chain-note"), steps:$("#pv-steps"), banner:$("#pv-banner"),
    labelRows:$("#pv-label-rows"), reportWrap:$("#pv-report-wrap"), log:$("#pv-log")
  };
  var lastPose = "", lastText = 0;
  function setText(node, t){ if (node.textContent !== t) node.textContent = t; }
  function hissing(){ return powered() && st.sq <= NOISE && !txActive() && !st.keyed; }

  function renderSay(){
    var box = $("#pv-say");
    if (!st.keyed){ box.hidden = true; return; }
    $("#pv-say-h").textContent = "Transmitting on CH " + chStr(st.ch) + " · " + (st.hi ? "HIGH" : "LOW") + ". What do you say?";
    var opts = sayOptions();
    // shuffle so the right answer isn't always first
    var order = opts.map(function(o, i){ return {o:o, r:(i * 7919 + st.txCount * 31) % 13}; }).sort(function(a, b){ return a.r - b.r; }).map(function(x){ return x.o; });
    curOpts = order;
    $("#pv-opts").innerHTML = order.map(function(o, i){ var d = document.createElement("div"); d.textContent = o.text; return '<button type="button" class="pv-opt" data-i="' + i + '">' + d.innerHTML + '</button>'; }).join("");
    box.hidden = false;
  }
  var curOpts = [];

  function renderScene(w){
    var p = POSE[st.loc], t = "translate(" + p.x + "px," + p.y + "px) rotate(" + p.r + "deg)";
    if (t !== lastPose){ el.radioG.style.transform = t; lastPose = t; }
    if (st.ship){
      var d = shipD();
      if (d > 12){ el.rship.style.opacity = 0; setText(el.shipT, "NESHER " + d.toFixed(1) + " nm · over the horizon"); }
      else {
        var sp = shipPose(); el.rship.style.opacity = 1;
        el.rship.style.transform = "translate(" + sp.x.toFixed(1) + "px,200px) scale(" + sp.s.toFixed(3) + ")";
        setText(el.shipT, st.ship.rec ? "NESHER alongside" : "NESHER " + d.toFixed(1) + " nm");
      }
    } else { el.rship.style.opacity = 0; setText(el.shipT, ""); }
    setText(el.rangeT, "Ship hears you ≈ " + txRange() + " nm");
    setText(el.locT, LOC_NAMES[st.loc].toUpperCase());
    var tx = txActive() || st.keyed;
    el.lcdSvg.setAttribute("fill", powered() ? (rxActive() ? "#e2f0b6" : "#b6cc86") : "#3a4448");
    el.txdot.setAttribute("fill", tx && (w % 600) < 380 ? "#ff3b2f" : rxActive() ? "#5df08f" : "#5a2207");
  }

  function renderControls(){
    var on = powered(), tx = txActive() || st.keyed, rx = rxActive();
    $$("#pv-switch .es-pos").forEach(function(b){ b.setAttribute("aria-checked", (b.dataset.pos === "ON") === st.on ? "true" : "false"); });
    el.knob.style.transform = "translateX(" + (st.on ? 100 : 0) + "%)";
    $$("#pv-battsel button").forEach(function(b){ b.setAttribute("aria-pressed", String(b.dataset.b === st.batt)); });
    el.lcd.classList.toggle("off", !on);
    el.lcd.classList.toggle("lit", on && rx);
    el.fHi.classList.toggle("on", st.hi); el.fLo.classList.toggle("on", !st.hi);
    el.fBusy.classList.toggle("on", on && (rx || hissing()));
    el.fTx.classList.toggle("on", tx);
    var pct = pack().pct, bars = pct > 66 ? 3 : pct > 33 ? 2 : pct > 0 ? 1 : 0;
    Array.prototype.forEach.call(el.battIco.querySelectorAll("i"), function(i, k){ i.classList.toggle("on", k < bars); });
    el.battIco.classList.toggle("low", pct < 15);
    setText(el.lcdCh, chStr(st.ch));
    setText(el.lcdName, CHNAME[st.ch] || "Intership working");
    setText(el.lcdVol, "VOL " + st.vol);
    setText(el.lcdSq, "SQ " + st.sq);
    setText(el.lcdBatt, st.batt === "prim" ? "EMERG BATT" : "RECH");
    el.ptt.classList.toggle("live", tx);
    el.ptt.setAttribute("aria-pressed", String(st.keyed));
    setText(el.pttHelp, st.keyed ? "Tap again to release" : txActive() ? "Talking…" : "Tap to talk");
    setText(el.btnRemove, st.loc === "hand" ? "Return to bracket" : "Remove from bracket");
    el.btnRemove.disabled = !onOwnVessel();
    setText(el.btnRaft, st.loc === "raft" ? "Back on deck" : "Take into liferaft");
    el.btnRaft.disabled = !(st.loc === "hand" || st.loc === "raft");
    setText(el.btnSpare, st.spareTaken ? "Spare battery taken ✓" : "Take spare battery");
    el.btnSpare.disabled = st.spareTaken;
    setNoise(hissing() ? 0.012 * st.vol : 0);
  }

  function renderStatus(){
    var on = powered(), mode, s;
    if (txActive() || st.keyed){ mode = "Transmitting"; s = "tx"; }
    else if (on && rxActive()){ mode = "Receiving"; s = "rx"; }
    else if (on){ mode = "Listening"; s = "armed"; }
    else if (st.on && st.dead){ mode = "Battery flat"; s = "off"; }
    else { mode = "Off"; s = "off"; }
    setText(el.mode, mode); el.mode.dataset.s = s;
    setText(el.clock, "T+" + fmtT(st.simT) + (st.paused ? " ❚❚" : ""));
    var d = shipD();
    setText(el.stripShip, d == null ? "—" : st.ship.rec ? "alongside" : d.toFixed(1) + " nm");
    setText(el.trCh, "CH " + chStr(st.ch) + " · " + (CHNAME[st.ch] || "Intership working"));
    setText(el.trState, !on ? (st.dead ? "Battery flat" : "Radio off") : mode === "Listening" ? (hissing() ? "Hiss: squelch open" : "Quiet") : mode);
    setText(el.hint, st.keyed ? "Choose what to say below." : !on ? "Switch the radio on to listen." : "Listen first. Then tap PTT, choose what to say, and listen for the reply.");

    setText(el.rCh, chStr(st.ch));
    var p = pack();
    setText(el.rBatt, st.batt === "prim" && st.label.bat.expired ? "Expired" : Math.max(0, p.pct).toFixed(p.pct < 99.5 && p.pct > 0 ? 1 : 0) + "%");
    setText(el.rTx, "≈ " + txRange() + " nm");
    setText(el.rRx, "≈ " + RXR[st.loc] + " nm");
    setText(el.rLoc, LOC_NAMES[st.loc]);
    setText(el.rBt, st.batt === "prim" ? "Sealed emergency" : "Rechargeable");
    setText(el.rSeal, st.packs.prim.sealed ? "Intact" : "Broken (replace)");
    setText(el.rSpare, st.batt === "prim" ? "Fitted in the radio" : st.spareTaken ? "With you" : "On board");
    setText(el.rPw, st.hi ? "High" : "Low (1 W or less)");
    setText(el.rSq, st.sq + (st.sq <= NOISE ? " · open, hissing" : st.sq === NOISE + 1 ? " · just closed" : st.sq >= 6 ? " · high" : ""));
    setText(el.rTxt, Math.round(st.txSec) + " s");

    var c = st.c;
    CHAIN.forEach(function(item){
      var li = chainLis[item.k], t = c[item.k], cls = t != null ? (item.k === "rec" ? "stood" : "on") : "";
      if (li.className !== cls) li.className = cls;
      setText(li.querySelector("em"), t != null ? "T+" + fmtT(t) : "—");
    });
    var note;
    if (!st.ship) note = "No rescue ship in this scenario.";
    else if (st.ship.rec) note = "NESHER alongside. Survivors recovered.";
    else if (!st.on) note = "The radio is off.";
    else if (st.dead) note = "The battery is flat.";
    else if (onOwnVessel()) note = "NESHER is " + d.toFixed(1) + " nm away. You're still on board.";
    else if (d > RXR[st.loc]) note = "NESHER is " + d.toFixed(1) + " nm away: too far to hear from " + LOC_NAMES[st.loc].toLowerCase() + " (about " + RXR[st.loc] + " nm).";
    else if (d > txRange()) note = "You can hear NESHER at " + d.toFixed(1) + " nm, but she can't hear you yet. Your radio reaches about " + txRange() + " nm from here.";
    else note = "In range both ways. NESHER is listening on channel " + chStr(st.nesherCh) + ".";
    setText(el.chainNote, note);
  }

  function renderMsgs(){
    if (!st.msgsDirty) return; st.msgsDirty = false;
    el.msgs.innerHTML = st.msgs.map(function(m){
      var d = document.createElement("div"); d.textContent = m.text;
      if (m.sys) return '<li class="pv-msg sys"><p>' + d.innerHTML + '</p></li>';
      return '<li class="pv-msg' + (m.me ? " me" : "") + (m.bad ? " bad" : "") + '"><span class="who">' + m.who + '</span><p>' + d.innerHTML + '</p></li>';
    }).join("");
    el.msgs.scrollTop = el.msgs.scrollHeight;
  }
  function renderSteps(){
    if (!st.stepsDirty) return; st.stepsDirty = false;
    if (!st.steps.length) el.steps.innerHTML = '<li class="es-none"><p class="es-empty">No checklist in free practice. Pick a scenario above for guided steps.</p></li>';
    else {
      var cur = -1; st.steps.some(function(s, i){ if (!s.done){ cur = i; return true; } return false; });
      el.steps.innerHTML = st.steps.map(function(s, i){ return '<li class="' + (s.done ? "done" : i === cur ? "current" : "") + '">' + s.t + '</li>'; }).join("");
    }
    if (st.done){ el.banner.hidden = false; el.banner.className = "es-banner ok"; el.banner.textContent = "Scenario complete. " + SCEN[st.scenario].win; }
    else el.banner.hidden = true;
  }
  function renderLabel(){
    if (!st.labelDirty) return; st.labelDirty = false;
    el.labelRows.innerHTML = ["bat","seal","type","rech"].map(function(k){
      var it = st.label[k], checked = st.labelChecked[k];
      var text = k === "seal" ? (st.packs.prim.sealed ? "Intact" : "Broken: battery used") : (it.text || fmtMY(it.d));
      var bad = it.expired || (k === "seal" && !st.packs.prim.sealed);
      var tag = !checked ? '<span class="es-tag">Check</span>' : bad ? '<span class="es-tag bad">' + (k === "seal" ? "BROKEN" : "EXPIRED") + '</span>' : '<span class="es-tag ok">OK</span>';
      return '<button type="button" class="es-lrow" data-k="' + k + '"><span><small>' + it.name + '</small><strong>' + text + '</strong></span>' + tag + '</button>';
    }).join("");
    var seen = (st.label.bat.expired && st.labelChecked.bat) || (st.label.seal.expired && st.labelChecked.seal);
    if (seen && st.scenario === "inspect"){
      el.reportWrap.hidden = false;
      el.reportWrap.innerHTML = st.reported ? '<span class="es-tag ok">Reported</span>' : '<button type="button" class="btn" id="pv-report">Report it</button>';
    } else el.reportWrap.hidden = true;
  }
  function renderLog(){
    if (!st.logDirty) return; st.logDirty = false;
    el.log.innerHTML = st.log.map(function(l){
      var d = document.createElement("div"); d.textContent = l.text;
      return '<li data-k="' + l.kind + '"><time>T+' + fmtT(l.t) + '</time><span>' + d.innerHTML + '</span></li>';
    }).join("");
  }
  function renderFeedback(){
    if (!st.feedbackDirty) return; st.feedbackDirty = false;
    el.feedback.textContent = st.feedback.text; el.feedback.dataset.kind = st.feedback.kind;
  }
  function renderSpeed(){
    $$("#pv-speed button").forEach(function(b){
      var v = b.dataset.v;
      b.setAttribute("aria-pressed", v === "pause" ? String(st.paused) : String(!st.paused && +v === st.speed));
    });
    var pb = $("#pv-pause"); pb.textContent = st.paused ? "▶" : "❚❚"; pb.setAttribute("aria-label", st.paused ? "Resume" : "Pause");
  }
  function renderAll(){
    st.stepsDirty = st.labelDirty = st.logDirty = st.feedbackDirty = st.msgsDirty = true;
    renderScene(now()); renderControls(); renderStatus(); renderSteps(); renderLabel(); renderLog(); renderFeedback(); renderSpeed(); renderMsgs();
  }

  // ---------- main loop ----------
  var last = now(), lastCallReal = -1e9;
  function frame(){
    var w = now(), dt = (w - last)/1000; last = w; if (dt > 0.5) dt = 0.5;
    if (!st.paused){
      var sd = dt * st.speed;
      st.simT += sd;
      // battery
      if (powered()){
        var tx = txActive() || st.keyed;
        var rate = tx ? (st.hi ? 20 : 6) : (rxActive() || hissing()) ? 3 : 1;
        if (tx) st.txSec += dt;
        var p = pack(), cap = CAP[st.batt] * (st.batt === "prim" && st.label.bat.expired ? 0.15 : 1);
        p.pct -= (tx ? dt : sd) * rate / cap * 100;
        if (p.pct <= 0){ p.pct = 0; st.dead = true; if (st.keyed) release(false); hush(); addLog("Battery flat. The radio has stopped.", "warn"); say("The battery is flat." + (st.batt === "prim" ? " Keep transmissions short to make it last." : ""), "warn"); }
      }
      // ship
      var s = st.ship;
      if (s && !s.rec){
        if (s.v > 0){ s.d = Math.max(0, s.d - s.v * sd / 3600); if (s.d < 1.2) s.v = Math.max(3, s.d * 12); }
        if (s.d < 0.4 && !st.sawLight && st.phase !== "none" && st.phase !== "called"){
          st.sawLight = true;
          nesherSays(st.nesherCh, "MAYDAY. " + ME + ", this is NESHER. We have your light in sight. Coming alongside now, stand by. Out.");
        }
        if (s.d <= 0.03){
          s.d = 0; s.v = 0; s.rec = true; st.c.rec = st.simT; news("status");
          addLog("NESHER alongside the liferaft. Survivors recovered.", "ok");
          if (!st.steps.length) say("NESHER alongside. Survivors recovered.", "ok");
          emit({type:"recovered"});
        }
        if (st.nesherCalls && st.simT >= st.nextCallT && w - lastCallReal > 15000 && !txActive() && !st.keyed && !rxActive()){
          lastCallReal = w;
          st.nextCallT = st.simT + (st.phase === "go06" ? 120 : st.callEvery);
          if (st.phase === "none" || st.phase === "called" || st.phase === "go06") nesherCall();
        }
      }
    }
    if (st.keyed && w - st.keyedAt > 25000){
      release(false); addLog("Transmitter released after 25 s with nothing said.", "warn");
      say("A key held down with nothing said blocks the channel for everyone. Release PTT when you aren't speaking.", "warn");
    }
    renderScene(w);
    if (w - lastText > 120){ lastText = w; renderControls(); renderStatus(); }
    renderSteps(); renderLabel(); renderLog(); renderFeedback(); renderMsgs();
    requestAnimationFrame(frame);
  }

  // ---------- wiring ----------
  $("#pv-scenario").addEventListener("change", function(e){ loadScenario(e.target.value); });
  $$("#pv-speed button").forEach(function(b){
    b.addEventListener("click", function(){
      if (b.dataset.v === "pause") st.paused = !st.paused; else { st.speed = +b.dataset.v; st.paused = false; }
      renderSpeed(); renderStatus();
    });
  });
  $("#pv-sound").addEventListener("click", function(e){
    soundOn = !soundOn;
    if (soundOn && !actx){ try{ actx = new (window.AudioContext || window.webkitAudioContext)(); startNoise(); }catch(err){ soundOn = false; } }
    if (actx && actx.state === "suspended") actx.resume();
    if (!soundOn){ hush(); setNoise(0); }
    e.currentTarget.setAttribute("aria-pressed", String(soundOn));
    e.currentTarget.textContent = soundOn ? "Sound on" : "Sound off";
    if (soundOn) beep(1200, 0.08);
  });
  $$(".es-tab").forEach(function(b){ b.addEventListener("click", function(){ selectTab(b.dataset.tab); }); });
  $("#pv-up").addEventListener("click", function(){ $("#pv-device").scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block:"start"}); });
  $$("#pv-switch .es-pos").forEach(function(b){ b.addEventListener("click", function(){ setPower(b.dataset.pos === "ON"); renderControls(); renderStatus(); }); });
  $$("#pv-battsel button").forEach(function(b){ b.addEventListener("click", function(){ setBatt(b.dataset.b); renderControls(); renderStatus(); }); });
  $$(".pv-key").forEach(function(b){ b.addEventListener("click", function(){ key(b.dataset.k); renderControls(); renderStatus(); }); });
  el.ptt.addEventListener("click", function(){ keyUp(); renderControls(); renderStatus(); });
  $("#pv-opts").addEventListener("click", function(e){ var b = e.target.closest(".pv-opt"); if (b){ transmit(curOpts[+b.dataset.i]); renderControls(); renderStatus(); } });
  $("#pv-release").addEventListener("click", function(){ release(false); renderControls(); renderStatus(); });
  el.btnRemove.addEventListener("click", function(){ btnRemove(); renderControls(); });
  el.btnRaft.addEventListener("click", function(){ btnRaft(); renderControls(); });
  el.btnSpare.addEventListener("click", function(){ btnSpare(); renderControls(); renderStatus(); });
  $("#pv-btn-reset").addEventListener("click", function(){ loadScenario(st.scenario); });
  $("#pv-record").addEventListener("click", recordLog);
  el.labelRows.addEventListener("click", function(e){ var b = e.target.closest(".es-lrow"); if (b) checkLabel(b.dataset.k); });
  el.reportWrap.addEventListener("click", function(e){ if (e.target.closest("#pv-report")) report(); });

  loadScenario("free");
  requestAnimationFrame(frame);
})();
