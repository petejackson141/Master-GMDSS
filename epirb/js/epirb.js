/* EPIRB simulator: the beacon, the Cospas-Sarsat alert chain, the scenarios and everything on screen.
   One file, run once when the page loads. */
(function(){
  "use strict";
  var root = document.getElementById("epirb-sim");
  if (!root) return;
  var $ = function(s){ return root.querySelector(s); };
  var $$ = function(s){ return Array.prototype.slice.call(root.querySelectorAll(s)); };

  var POS = "32°52.4′N 034°48.6′E";
  var POS_APPROX = "32°53′N 034°47′E";
  var HEX_ID = "B58E62A4D00FFBF";
  var PX_PER_M = 40, SEA_Y = 360, HRU_Y = 219;
  var LOC_NAMES = {bracket:"In bracket", hand:"In hand", water:"Floating in water"};

  function now(){ return performance.now(); }
  function pad(n){ return String(n).padStart(2,"0"); }
  function fmtT(s){ s = Math.max(0, Math.floor(s)); var h = Math.floor(s/3600), m = Math.floor(s%3600/60), x = s%60; return h ? h+":"+pad(m)+":"+pad(x) : m+":"+pad(x); }
  function addMonths(d, n){ return new Date(d.getFullYear(), d.getMonth()+n, 1); }
  function fmtMY(d){ return pad(d.getMonth()+1)+"/"+d.getFullYear(); }
  var TODAY = new Date();

  // ---------- sound ----------
  var actx = null, soundOn = false;
  function beep(freq, dur){
    if (!soundOn || !actx) return;
    try{
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = "square"; o.frequency.value = freq || 1200;
      g.gain.setValueAtTime(0.05, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (dur || 0.12));
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + (dur || 0.12) + 0.02);
    }catch(e){}
  }

  // ---------- state ----------
  var st, gen = 0;
  function freshState(){
    return {
      simT:0, speed:10, paused:false,
      sw:"READY", guardUp:false, loc:"bracket",
      shipDy:0, sinking:false, sunk:false, releaseDepth:1.5 + Math.random()*2.5,
      active:false, everActive:false, activeAt:null, txSec:0, bursts:0, nextBurstAt:null,
      gnss:"off", gnssFix:false, gnssTest:"off", homing:false,
      chain:{started:false, sat:null, lut:null, mcc:null, rcc:null, sar:null, onscene:null, cancelled:false},
      events:[], log:[], logDirty:true, stepsDirty:true, labelDirty:true,
      selfTests:0, testing:false,
      flashUntil:0, passUntil:0, failUntil:0, burstLedUntil:0,
      label:null, labelChecked:{hru:false, bat:false, svc:false, reg:false}, reported:false,
      scenario:"free", steps:[], done:false, failed:false,
      feedback:{text:"", kind:"info"}, feedbackDirty:true
    };
  }
  function makeLabel(expiredKey){
    var l = {
      hru:{name:"HRU expiry", d:addMonths(TODAY, 14), expired:false},
      bat:{name:"Battery expiry", d:addMonths(TODAY, 38), expired:false},
      svc:{name:"Shore-based maintenance due", d:addMonths(TODAY, 26), expired:false},
      reg:{name:"Registration", text:"Registered · Israel (MID 428)", expired:false}
    };
    if (expiredKey){ l[expiredKey].d = addMonths(TODAY, -2); l[expiredKey].expired = true; }
    return l;
  }

  // ---------- scheduler ----------
  function schedule(delay, fn, tag){ st.events.push({t:st.simT + delay, fn:fn, tag:tag||""}); st.events.sort(function(a,b){ return a.t-b.t; }); }
  function removeTag(tag){ st.events = st.events.filter(function(e){ return e.tag !== tag; }); }
  function runEvents(){ var g = gen; while (st.events.length && st.events[0].t <= st.simT){ var e = st.events.shift(); e.fn(); if (g !== gen) return; } }
  function later(ms, fn){ var g = gen; setTimeout(function(){ if (g === gen) fn(); }, ms); }

  // ---------- log, feedback, tab news ----------
  function addLog(text, kind){ st.log.unshift({t:st.simT, text:text, kind:kind||"info"}); if (st.log.length > 80) st.log.pop(); st.logDirty = true; news("log"); }
  function say(text, kind){ st.feedback = {text:text, kind:kind||"info"}; st.feedbackDirty = true; }
  var activeTab = "steps";
  function news(tab){ if (tab !== activeTab){ var b = root.querySelector('.es-tab[data-tab="'+tab+'"]'); if (b) b.classList.add("has-news"); } }

  // ---------- scenarios ----------
  var SCEN = {
    free:{ name:"Free practice", brief:"Try anything: arm the beacon, run a self-test, take it out of the bracket, drop it in the sea or sink the vessel.", steps:[] },
    selftest:{
      name:"Monthly self-test",
      brief:"Do the routine monthly check before the vessel's next trip. The beacon stays in its bracket.",
      steps:[
        {t:"Check the HRU and battery expiry dates (Label tab)", ev:function(e){ return e.type==="label" && st.labelChecked.hru && st.labelChecked.bat; }},
        {t:"Hold TEST for 1 second to start the self-test", ev:function(e){ return e.type==="selftest-start"; }},
        {t:"Confirm the green PASS light", ev:function(e){ return e.type==="selftest-result" && e.pass; }},
        {t:"Record the test in the radio log (Log tab)", ev:function(e){ return e.type==="logged"; }}
      ],
      win:"The beacon passed and the test is in the log. The 406 MHz test burst uses a test format, so no alert reached the rescue services."
    },
    abandon:{
      name:"Abandon ship (manual)",
      brief:"You are abandoning ship into the liferaft and have time to take the EPIRB with you. Activate it yourself.",
      steps:[
        {t:"Remove the EPIRB from its bracket", ev:function(e){ return e.type==="removed"; }},
        {t:"Activate it: lift the guard and set the switch to ON", ev:function(e){ return e.type==="activated"; }},
        {t:"Put it in the water, tethered to the liferaft", ev:function(e){ return e.type==="water"; }},
        {t:"Wait for the first 406 MHz burst", ev:function(e){ return e.type==="burst"; }},
        {t:"The RCC receives the distress alert", ev:function(e){ return e.type==="rcc" && !e.cancelled; }}
      ],
      win:"The RCC has your alert. Keep the beacon floating upright and clear of the canopy: it keeps sending 406 MHz bursts and the 121.5 MHz homing signal for at least 48 hours."
    },
    floatfree:{
      name:"Vessel sinks (float-free)",
      brief:"The vessel sinks before anyone can reach the EPIRB. Check it is armed, then sink the vessel and let the HRU do its job.",
      setup:function(){ st.sw = "OFF"; },
      steps:[
        {t:"Set the switch to READY so it can activate by itself", ev:function(e){ return e.type==="switch" && e.pos==="READY"; }},
        {t:"Press Vessel sinks", ev:function(e){ return e.type==="sink"; }},
        {t:"The HRU releases the EPIRB at 1.5–4 m", ev:function(e){ return e.type==="hru"; }},
        {t:"The sea switch activates the beacon", ev:function(e){ return e.type==="activated"; }},
        {t:"The RCC receives the distress alert", ev:function(e){ return e.type==="rcc" && !e.cancelled; }}
      ],
      win:"Float-free release worked. Nobody touched the beacon after the vessel sank: the HRU freed it, the sea switch turned it on and the alert reached the RCC."
    },
    "false":{
      name:"Accidental activation",
      brief:"A crew member knocked the switch to ON while cleaning the deck. The beacon is transmitting a distress alert. Deal with it properly.",
      setup:function(){ st.loc = "hand"; st.guardUp = true; st.sw = "ON"; activate("switch knocked to ON by accident", 14); },
      steps:[
        {t:"Switch the EPIRB OFF", ev:function(e){ return e.type==="switch" && e.pos==="OFF"; }},
        {t:"Call the RCC or coast station to cancel (Alert tab)", ev:function(e){ return e.type==="cancel"; }},
        {t:"Record the false alert in the radio log (Log tab)", ev:function(e){ return e.type==="logged"; }}
      ],
      win:"False alert handled correctly. Even one burst can reach the satellites, so the call to the RCC is what stops a rescue being launched."
    },
    inspect:{
      name:"Pre-departure inspection",
      brief:"Check the EPIRB label before sailing (Label tab). One item is out of date. Find it and report it.",
      steps:[
        {t:"Check the HRU expiry date", ev:function(e){ return e.type==="label" && e.k==="hru"; }},
        {t:"Check the battery expiry date", ev:function(e){ return e.type==="label" && e.k==="bat"; }},
        {t:"Check when shore-based maintenance is due", ev:function(e){ return e.type==="label" && e.k==="svc"; }},
        {t:"Check the beacon is registered", ev:function(e){ return e.type==="label" && e.k==="reg"; }},
        {t:"Report the out-of-date item for replacement", ev:function(e){ return e.type==="report"; }}
      ],
      win:"Don't sail until the expired part is replaced: an expired HRU may not release, and an expired battery may not last 48 hours."
    }
  };

  function emit(e){
    if (st.done || st.failed) return;
    var changed = false;
    st.steps.forEach(function(s){ if (!s.done && s.ev(e)){ s.done = true; changed = true; } });
    if (changed){
      st.stepsDirty = true; news("steps");
      if (st.steps.length && st.steps.every(function(s){ return s.done; })){ st.done = true; say("Scenario complete. " + SCEN[st.scenario].win, "ok"); }
    }
  }

  // ---------- beacon behaviour ----------
  function shouldBeActive(){ return st.sw === "ON" || (st.sw === "READY" && st.loc === "water"); }
  function evaluate(){
    var s = shouldBeActive();
    if (s && !st.active) activate(st.sw === "ON" ? "switch turned to ON (manual)" : "sea switch closed: floating in water with switch at READY");
    else if (!s && st.active) deactivate(st.sw === "OFF" ? "switched OFF" : "out of the water, sea switch open");
  }
  function activate(cause, firstDelay){
    if (st.active) return;
    st.active = true; st.everActive = true; st.activeAt = st.simT; st.homing = true; st.gnss = "search";
    addLog("ACTIVATED: " + cause + ". Strobe flashing, 121.5 MHz homing on.", "alert");
    var d = firstDelay || 50;
    st.nextBurstAt = st.simT + d;
    schedule(d, burst, "beacon");
    schedule(40 + Math.random()*80, function(){ st.gnss = "fix"; st.gnssFix = true; addLog("GNSS fix " + POS + ". Position now encoded in every 406 MHz burst.", "ok"); }, "beacon");
    beep(900, 0.25);
    emit({type:"activated", cause:cause});
  }
  function deactivate(reason){
    st.active = false; st.homing = false; st.gnss = "off"; st.gnssFix = false; st.nextBurstAt = null;
    removeTag("beacon");
    addLog("Transmission stopped: " + reason + ".", "warn");
    emit({type:"deactivated"});
  }
  function burst(){
    st.bursts++;
    addLog("406 MHz burst #" + st.bursts + ": HEX ID " + HEX_ID + ", " + (st.gnssFix ? "with GNSS position " + POS : "no position yet (GNSS searching)") + ".", "tx");
    st.burstLedUntil = now() + 500;
    ringFx(false); beep(1500, 0.06);
    if (!st.chain.started) startChain();
    else if (st.bursts === 3 && !st.gnssFix) addLog("MEOSAR: independent location computed from several bursts, about " + POS_APPROX + " (±5 km).", "ok");
    var gap = 47.5 + Math.random()*5;
    st.nextBurstAt = st.simT + gap;
    schedule(gap, burst, "beacon");
    emit({type:"burst"});
  }
  function startChain(){
    var c = st.chain; c.started = true; c.sat = st.simT; news("alert");
    addLog("Satellite received the burst and relayed it to a ground station.", "info");
    schedule(30, function(){ c.lut = st.simT; news("alert"); addLog("Ground station (LUT) processed the message and passed it to the Mission Control Centre.", "info"); }, "chain");
    schedule(75, function(){ c.mcc = st.simT; news("alert"); addLog("MCC checked the HEX ID (country 428, Israel) and routed the alert to the responsible RCC.", "info"); }, "chain");
    schedule(120, rccAlert, "chain");
  }
  function posText(){
    if (st.gnssFix) return POS + " (GNSS)";
    if (st.bursts >= 3) return POS_APPROX + " (±5 km)";
    return "not known yet";
  }
  function rccAlert(){
    var c = st.chain; c.rcc = st.simT; news("alert");
    if (c.cancelled){ addLog("RCC received the alert and matched it to your cancellation call. No rescue launched.", "ok"); emit({type:"rcc", cancelled:true}); return; }
    addLog("RCC ALERTED: distress from SV Amalia (from the registration database). Position " + posText() + ".", "alert");
    emit({type:"rcc", cancelled:false});
    schedule(300, function(){ if (c.cancelled) return; c.sar = st.simT; news("alert"); addLog("RCC tasked a rescue helicopter, broadcast to nearby ships and called the vessel's emergency contacts.", "info"); }, "chain");
    schedule(1800, function(){
      if (c.cancelled) return; c.onscene = st.simT; news("alert");
      if (st.active) addLog("Rescue helicopter on scene: homed in on 121.5 MHz and sighted the strobe.", "ok");
      else addLog("Rescue unit searching the last known position. The beacon is off, so there is no homing signal to follow.", "warn");
      emit({type:"onscene"});
    }, "chain");
  }

  // ---------- user actions ----------
  function setSwitch(pos){
    if (st.testing || pos === st.sw) return;
    if (pos === "ON" && !st.guardUp){ say("Lift the red guard first. It stops the switch being knocked to ON by accident.", "warn"); return; }
    st.sw = pos;
    addLog("Switch set to " + pos + ".", "info");
    emit({type:"switch", pos:pos});
    evaluate();
    if (pos === "READY" && st.loc === "bracket") say("Armed. In the bracket a magnet keeps the sea switch inactive; it activates only after it comes out and floats.", "info");
  }
  function toggleGuard(){
    if (st.guardUp && st.sw === "ON"){ say("Move the switch off ON before closing the guard.", "warn"); return; }
    st.guardUp = !st.guardUp;
    emit({type:"guard", up:st.guardUp});
  }
  function removeOrReturn(){
    if (st.loc === "bracket"){
      if (st.sinking) return;
      st.loc = "hand"; addLog("EPIRB removed from its bracket.", "info"); emit({type:"removed"}); evaluate();
    } else if (st.loc === "hand"){
      if (st.sunk || st.sinking){ say("The vessel and its bracket have gone down.", "warn"); return; }
      st.loc = "bracket"; addLog("EPIRB returned to its bracket.", "info"); emit({type:"returned"}); evaluate();
    }
  }
  function waterToggle(){
    if (st.loc === "hand"){
      st.loc = "water"; addLog("EPIRB in the water, floating upright (tethered).", "info"); emit({type:"water"}); evaluate();
      if (st.sw === "OFF") say("It is floating but switched OFF. Nothing will be sent unless it is set to READY or ON.", "warn");
    } else if (st.loc === "water"){
      st.loc = "hand"; addLog("EPIRB lifted out of the water.", "info"); emit({type:"lifted"}); evaluate();
    }
  }
  function sink(){
    if (st.sunk || st.sinking) return;
    st.sinking = true;
    addLog("Vessel sinking. The EPIRB bracket is going under.", "alert");
    emit({type:"sink"});
  }
  function hruRelease(depth){
    st.loc = "water";
    addLog("HRU released the EPIRB at " + depth.toFixed(1) + " m. It floats to the surface.", "info");
    emit({type:"hru"});
    if (st.sw === "OFF"){
      addLog("The beacon is floating but switched OFF. No alert will be sent.", "warn");
      if (st.scenario === "floatfree"){ st.failed = true; st.stepsDirty = true; news("steps"); }
      say("The beacon floated free switched OFF, so nobody knows you are in trouble. Reset and set it to READY before sailing.", "alert");
    }
    evaluate();
  }
  function cancelCall(){
    if (!st.everActive){ say("Nothing to cancel. The beacon has not transmitted.", "info"); return; }
    if (st.active){ say("Switch the EPIRB OFF first, then call the RCC.", "warn"); return; }
    if (st.chain.cancelled) return;
    st.chain.cancelled = true;
    addLog("Called the RCC: EPIRB HEX ID " + HEX_ID + " from SV Amalia activated in error, position " + POS + ". Please cancel.", "ok");
    if (st.chain.rcc) addLog("RCC: false alert cancelled. Rescue stood down.", "ok");
    say("Cancellation received by the RCC.", "ok");
    emit({type:"cancel"});
  }
  function recordLog(){
    var txt = st.everActive ? "Radio log: EPIRB " + (st.chain.cancelled ? "false alert, RCC informed and alert cancelled." : "activation recorded.") : (st.selfTests ? "Radio log: EPIRB self-test carried out, result recorded." : "Radio log: EPIRB checked.");
    addLog(txt, "ok");
    say("Entry made in the GMDSS radio log.", "ok");
    emit({type:"logged"});
  }
  function checkLabel(k){
    st.labelChecked[k] = true; st.labelDirty = true;
    var item = st.label[k];
    if (item.expired) say(item.name + " is past its date. This item must be replaced before sailing.", "warn");
    emit({type:"label", k:k});
  }
  function report(){
    if (st.reported) return;
    st.reported = true; st.labelDirty = true;
    var k = st.label.hru.expired ? "hru" : "bat";
    addLog("Reported: " + st.label[k].name.replace(" expiry","") + " out of date, replacement ordered. Vessel not to sail until fitted.", "ok");
    emit({type:"report"});
  }

  // ---------- self-tests ----------
  function selfTest(){
    if (st.active){ say("The beacon is transmitting. A self-test is not possible while it is active.", "warn"); return; }
    if (st.testing) return;
    st.testing = true;
    addLog("Self-test started.", "info");
    emit({type:"selftest-start"});
    st.flashUntil = now() + 160; beep(1200, 0.15);
    later(500, function(){ addLog("406 MHz self-test burst sent in test format. Satellites ignore it, so no alert is raised.", "tx"); ringFx(true); });
    later(1300, function(){ addLog("121.5 MHz homing transmitter checked.", "info"); });
    later(2400, function(){
      var fail = st.label.bat.expired;
      st.testing = false; st.selfTests++;
      if (fail){ st.failUntil = now() + 3200; addLog("Self-test FAILED (red light): battery past its expiry date.", "warn"); beep(300, 0.5); say("Self-test failed. Do not rely on this beacon until the battery is replaced.", "warn"); }
      else { st.passUntil = now() + 3200; addLog("Self-test PASSED (green light).", "ok"); say("Self-test passed: green light.", "ok"); beep(1600, 0.1); later(220, function(){ beep(1600, 0.1); }); }
      emit({type:"selftest-result", pass:!fail});
    });
  }
  function gnssTest(){
    if (st.active || st.gnssTest !== "off") return;
    st.gnssTest = "search";
    addLog("GNSS self-test started. It takes a few minutes in real life and uses extra battery, so only do it as often as the manufacturer allows.", "info");
    later(6000, function(){ st.gnssTest = "fix"; addLog("GNSS self-test PASSED: fix " + POS + ".", "ok"); beep(1600, 0.1); });
    later(10000, function(){ st.gnssTest = "off"; });
  }

  // ---------- fx ----------
  var SVGNS = "http://www.w3.org/2000/svg";
  var fxG = $("#es-fx"), beam = $("#es-beam");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function beaconPose(){
    if (st.loc === "bracket") return {x:65, y:52 + st.shipDy, r:0};
    if (st.loc === "hand") return {x:262, y:84, r:5};
    return {x:290, y:185, r:0};
  }
  function antennaTip(){ var p = beaconPose(); return {x:p.x + 40, y:p.y + 2}; }
  function ringFx(isTest){
    var a = antennaTip();
    var c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("cx", a.x); c.setAttribute("cy", a.y); c.setAttribute("r", 8); c.setAttribute("fill", "none");
    c.style.stroke = "var(--gold)"; c.setAttribute("stroke-width", isTest ? 1.5 : 2.5);
    c.style.transformBox = "fill-box"; c.style.transformOrigin = "center";
    fxG.appendChild(c);
    if (c.animate && !reduceMotion){
      var an = c.animate([{transform:"scale(1)", opacity:1},{transform:"scale(" + (isTest ? 4 : 9) + ")", opacity:0}], {duration:1600, easing:"ease-out"});
      an.onfinish = function(){ c.remove(); };
    } else setTimeout(function(){ c.remove(); }, 800);
    if (!isTest){
      beam.setAttribute("x1", a.x); beam.setAttribute("y1", a.y);
      if (beam.animate && !reduceMotion) beam.animate([{opacity:0},{opacity:.95},{opacity:0}], {duration:1400});
    }
  }

  // ---------- static UI ----------
  var CHAIN = [
    {k:"beacon", n:"EPIRB", s:"406 MHz burst"},
    {k:"sat", n:"Satellite", s:"MEOSAR / GEOSAR"},
    {k:"lut", n:"LUT", s:"Ground station"},
    {k:"mcc", n:"MCC", s:"Mission control centre"},
    {k:"rcc", n:"RCC", s:"Rescue coordination centre"},
    {k:"sar", n:"Rescue unit", s:"Homes in on 121.5 MHz"}
  ];
  $("#es-chain").innerHTML = CHAIN.map(function(c){ return '<li data-k="'+c.k+'"><span></span><div><b>'+c.n+'</b><span>'+c.s+'</span></div><em>—</em></li>'; }).join("");
  // grid: marker (::before), text, time — remove the placeholder span so ::before takes column 1
  $$("#es-chain li > span:first-child").forEach(function(s){ s.remove(); });
  var chainLis = {}; $$("#es-chain li").forEach(function(li){ chainLis[li.dataset.k] = li; });

  // ---------- tabs ----------
  function selectTab(name){
    activeTab = name;
    $$(".es-tab").forEach(function(b){ var on = b.dataset.tab === name; b.setAttribute("aria-selected", on ? "true" : "false"); if (on) b.classList.remove("has-news"); });
    $$(".es-pane").forEach(function(p){ p.classList.toggle("is-off", p.dataset.pane !== name); });
  }

  // ---------- load scenario ----------
  function loadScenario(key){
    gen++;
    var sp = st ? st.speed : 10;
    st = freshState(); st.speed = sp; st.scenario = key;
    st.label = makeLabel(key === "inspect" ? (Math.random() < 0.5 ? "hru" : "bat") : null);
    var sc = SCEN[key];
    st.steps = sc.steps.map(function(s){ return {t:s.t, ev:s.ev, done:false}; });
    while (fxG.firstChild) fxG.removeChild(fxG.firstChild);
    $("#es-sc-h").textContent = sc.name;
    $("#es-brief").textContent = sc.brief;
    addLog("Scenario: " + sc.name + ".", "info");
    if (sc.setup) sc.setup();
    if (key === "false") say(sc.brief, "alert"); else say("", "info");
    $$(".es-tab").forEach(function(b){ b.classList.remove("has-news"); });
    selectTab(key === "inspect" ? "label" : "steps");
    lastBeaconT = ""; lastShipT = ""; el.msg.dataset.k = "";
    renderAll();
  }

  // ---------- rendering ----------
  var el = {
    svg:$("#es-svg"), ship:$("#es-ship"), beacon:$("#es-beacon"), strap:$("#es-strap"), homing:$("#es-homing"),
    strobe:$("#es-strobe"), knobSvg:$("#es-knob-svg"), guardSvg:$("#es-guard-svg"),
    ledOkSvg:$("#es-led-ok-svg"), ledGnssSvg:$("#es-led-gnss-svg"), ledFaultSvg:$("#es-led-fault-svg"),
    depth:$("#es-depth"), depthT:$("#es-depth-t"), locT:$("#es-loc-t"),
    btnRemove:$("#es-btn-remove"), btnWater:$("#es-btn-water"), btnSink:$("#es-btn-sink"),
    feedback:$("#es-feedback"), knob:$("#es-knob"), guard:$("#es-guard"), guardClose:$("#es-guard-close"), swHelp:$("#es-sw-help"),
    lStrobe:$("#es-l-strobe"), lOk:$("#es-l-ok"), lGnss:$("#es-l-gnss"), lFault:$("#es-l-fault"),
    mode:$("#es-mode"), clock:$("#es-clock"), stripNext:$("#es-strip-next"),
    rLoc:$("#es-r-loc"), rSince:$("#es-r-since"), rBursts:$("#es-r-bursts"), rNext:$("#es-r-next"),
    rHoming:$("#es-r-homing"), rGnss:$("#es-r-gnss"), rBatt:$("#es-r-batt"), rTests:$("#es-r-tests"),
    chainNote:$("#es-chain-note"), cancel:$("#es-cancel"), msg:$("#es-msg"), steps:$("#es-steps"), banner:$("#es-banner"),
    labelRows:$("#es-label-rows"), reportWrap:$("#es-report-wrap"), log:$("#es-log")
  };
  var lastBeaconT = "", lastShipT = "", lastText = 0;
  function setText(node, t){ if (node.textContent !== t) node.textContent = t; }
  function setLed(node, svgNode, on, color){ node.classList.toggle("on", !!on); svgNode.setAttribute("fill", on ? color : "#152027"); }

  function renderScene(w){
    var shipT = "translate(0px," + st.shipDy.toFixed(1) + "px)";
    if (shipT !== lastShipT){ el.ship.style.transform = shipT; el.strap.style.transform = shipT; lastShipT = shipT; }
    el.strap.style.display = st.loc === "bracket" ? "" : "none";
    var p = beaconPose();
    var bt = "translate(" + p.x + "px," + p.y.toFixed(1) + "px) rotate(" + p.r + "deg) scale(1)";
    if (bt !== lastBeaconT){
      el.beacon.style.transition = (st.sinking && st.loc === "bracket") ? "none" : "";
      el.beacon.style.transform = bt; lastBeaconT = bt;
    }
    el.svg.classList.toggle("in-water", st.loc === "water");
    el.svg.classList.toggle("tx", st.homing);
    var a = antennaTip();
    el.homing.setAttribute("transform", "translate(" + a.x + " " + a.y + ")");
    var depth = (HRU_Y + st.shipDy - SEA_Y) / PX_PER_M;
    var showDepth = (st.sinking || st.sunk) && depth > -1;
    el.depth.setAttribute("opacity", showDepth ? 1 : 0);
    if (showDepth) setText(el.depthT, "HRU depth " + Math.max(0, depth).toFixed(1) + " m");
    setText(el.locT, (st.sunk ? "VESSEL SUNK · " : "") + LOC_NAMES[st.loc].toUpperCase());
    el.knobSvg.setAttribute("cx", st.sw === "OFF" ? 25 : st.sw === "READY" ? 40 : 55);
    el.guardSvg.setAttribute("transform", st.guardUp ? "translate(0 -11)" : "");
    el.guardSvg.setAttribute("opacity", st.guardUp ? 0.75 : 1);
    var strobe = (st.active && (w % 2400) < 110) || w < st.flashUntil;
    el.strobe.setAttribute("opacity", strobe ? 1 : 0);
    var ok = (st.active && (w % 3000) < 120) || w < st.burstLedUntil || (w < st.passUntil && (w % 500) < 280);
    var gstate = st.gnssTest !== "off" ? st.gnssTest : st.gnss;
    var gn = (gstate === "search" && (w % 1000) < 450) || gstate === "fix";
    var fault = w < st.failUntil && (w % 500) < 280;
    el.lStrobe.classList.toggle("on", strobe);
    setLed(el.lOk, el.ledOkSvg, ok, "#5df08f");
    setLed(el.lGnss, el.ledGnssSvg, gn, "#62b7ff");
    setLed(el.lFault, el.ledFaultSvg, fault, "#ff5a4a");
  }

  function renderControls(){
    $$("#es-switch .es-pos").forEach(function(b){ b.setAttribute("aria-checked", b.dataset.pos === st.sw ? "true" : "false"); });
    var idx = st.sw === "OFF" ? 0 : st.sw === "READY" ? 1 : 2;
    el.knob.style.transform = "translateX(" + (idx*100) + "%)";
    el.guard.classList.toggle("up", st.guardUp);
    el.guard.setAttribute("aria-hidden", st.guardUp ? "true" : "false");
    el.guard.tabIndex = st.guardUp ? -1 : 0;
    el.guardClose.hidden = !st.guardUp;
    setText(el.swHelp, st.sw === "OFF" ? "OFF: will not activate, even in water." : st.sw === "READY" ? "READY: activates by itself when floating in water." : "ON: transmitting a distress alert now.");
    setText(el.btnRemove, st.loc === "bracket" ? "Remove from bracket" : "Return to bracket");
    el.btnRemove.disabled = st.loc === "water" || st.sinking || (st.loc === "hand" && st.sunk);
    setText(el.btnWater, st.loc === "water" ? "Lift out of water" : "Put in the water");
    el.btnWater.disabled = st.loc === "bracket";
    el.btnSink.disabled = st.sinking || st.sunk;
    setText(el.btnSink, st.sunk ? "Vessel sunk" : st.sinking ? "Sinking…" : "Vessel sinks");
  }

  function renderStatus(){
    var mode, s;
    if (st.testing || st.gnssTest !== "off"){ mode = "Self-test"; s = "test"; }
    else if (st.active){ mode = "Transmitting"; s = "tx"; }
    else if (st.sw === "READY"){ mode = "Armed"; s = "armed"; }
    else { mode = "Off"; s = "off"; }
    setText(el.mode, mode); el.mode.dataset.s = s;
    setText(el.clock, "T+" + fmtT(st.simT) + (st.paused ? " ❚❚" : ""));
    var next = st.active && st.nextBurstAt != null ? Math.max(0, Math.ceil(st.nextBurstAt - st.simT)) + " s" : "—";
    setText(el.stripNext, next);
    setText(el.rNext, next);
    setText(el.rLoc, LOC_NAMES[st.loc]);
    setText(el.rSince, st.active ? fmtT(st.simT - st.activeAt) : "—");
    setText(el.rBursts, String(st.bursts));
    setText(el.rHoming, st.homing ? "On · 50 mW" : "Off");
    setText(el.rGnss, st.gnss === "fix" ? POS : st.gnss === "search" ? "Searching…" : "Off");
    setText(el.rBatt, st.label.bat.expired ? "Expired" : (st.txSec > 0 ? (48 - st.txSec/3600).toFixed(1) + " h" : "48 h"));
    setText(el.rTests, String(st.selfTests));
    var c = st.chain;
    var times = {beacon:c.sat, sat:c.sat, lut:c.lut, mcc:c.mcc, rcc:c.rcc, sar:c.onscene != null ? c.onscene : c.sar};
    CHAIN.forEach(function(item){
      var li = chainLis[item.k], t = times[item.k], cls = "", label = t != null ? "T+" + fmtT(t) : "—";
      if (t != null) cls = (item.k === "rcc" && !c.cancelled) ? "alert" : "on";
      if (item.k === "sar" && c.sar != null && c.onscene == null) label = "tasked " + fmtT(c.sar);
      if (item.k === "sar" && c.onscene != null) label = "on scene " + fmtT(c.onscene);
      if (c.cancelled && c.rcc != null && (item.k === "rcc" || item.k === "sar")){ cls = "stood"; if (item.k === "sar") label = "stood down"; }
      if (li.className !== cls) li.className = cls;
      setText(li.querySelector("em"), label);
    });
    var note;
    if (c.cancelled) note = c.rcc != null ? "False alert cancelled with the RCC. No rescue needed." : "RCC informed. When the alert arrives it will be matched to your call and cancelled.";
    else if (c.onscene != null) note = st.active ? "Rescue on scene, homing on 121.5 MHz." : "Rescue searching. The beacon is off, so there is nothing to home in on.";
    else if (c.rcc != null) note = "RCC has the alert. Position: " + posText() + ".";
    else if (c.started) note = "Alert on its way through the ground segment.";
    else if (st.active) note = "Beacon active. First 406 MHz burst in " + next + ".";
    else note = "Nothing sent yet. The first 406 MHz burst goes out about 50 seconds after activation.";
    setText(el.chainNote, note);
    el.cancel.disabled = !st.everActive || c.cancelled;
    var msgKey = st.bursts > 0 ? (st.gnssFix ? "g" : "n") + (st.bursts >= 3 ? "3" : "1") : "none";
    if (el.msg.dataset.k !== msgKey){
      el.msg.dataset.k = msgKey;
      if (st.bursts === 0) el.msg.innerHTML = '<p class="es-empty">Appears after the first 406 MHz burst.</p>';
      else el.msg.innerHTML =
        '<dl class="es-msg">' +
        '<div><dt>HEX ID</dt><dd>' + HEX_ID + ' (example)</dd></div>' +
        '<div><dt>Protocol</dt><dd>Standard location · MMSI</dd></div>' +
        '<div><dt>Country</dt><dd>428 · Israel</dd></div>' +
        '<div><dt>MMSI</dt><dd>428 123 456</dd></div>' +
        '<div><dt>Beacon</dt><dd>EPIRB, float-free (Cat I)</dd></div>' +
        '<div><dt>Position</dt><dd>' + posText() + '</dd></div>' +
        '</dl><p class="es-small">The vessel name, owner and emergency contacts are not in the message. The RCC finds them in the registration database using the HEX ID, which is why registration matters.</p>';
    }
  }

  function renderSteps(){
    if (!st.stepsDirty) return; st.stepsDirty = false;
    if (!st.steps.length) el.steps.innerHTML = '<li class="es-none"><p class="es-empty">No checklist in free practice. Pick a scenario above for guided steps.</p></li>';
    else {
      var cur = -1; st.steps.some(function(s, i){ if (!s.done){ cur = i; return true; } return false; });
      el.steps.innerHTML = st.steps.map(function(s, i){ return '<li class="' + (s.done ? "done" : i === cur && !st.failed ? "current" : "") + '">' + s.t + '</li>'; }).join("");
    }
    if (st.done){ el.banner.hidden = false; el.banner.className = "es-banner ok"; el.banner.textContent = "Scenario complete. " + SCEN[st.scenario].win; }
    else if (st.failed){ el.banner.hidden = false; el.banner.className = "es-banner fail"; el.banner.textContent = "No alert was sent. The beacon floated free with the switch at OFF. Press Reset and arm it at READY first."; }
    else el.banner.hidden = true;
  }

  function renderLabel(){
    if (!st.labelDirty) return; st.labelDirty = false;
    el.labelRows.innerHTML = ["hru","bat","svc","reg"].map(function(k){
      var it = st.label[k], checked = st.labelChecked[k];
      var tag = !checked ? '<span class="es-tag">Check</span>' : it.expired ? '<span class="es-tag bad">EXPIRED</span>' : '<span class="es-tag ok">OK</span>';
      return '<button type="button" class="es-lrow" data-k="' + k + '"><span><small>' + it.name + '</small><strong>' + (it.text || fmtMY(it.d)) + '</strong></span>' + tag + '</button>';
    }).join("");
    var expiredSeen = (st.label.hru.expired && st.labelChecked.hru) || (st.label.bat.expired && st.labelChecked.bat);
    if (expiredSeen){
      el.reportWrap.hidden = false;
      el.reportWrap.innerHTML = st.reported ? '<span class="es-tag ok">Reported for replacement</span>' : '<button type="button" class="btn" id="es-report">Report for replacement</button>';
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
    el.feedback.textContent = st.feedback.text;
    el.feedback.dataset.kind = st.feedback.kind;
  }
  function renderSpeed(){
    $$("#es-speed button").forEach(function(b){
      var v = b.dataset.v;
      b.setAttribute("aria-pressed", v === "pause" ? String(st.paused) : String(!st.paused && +v === st.speed));
    });
    var pb = $("#es-pause"); pb.textContent = st.paused ? "▶" : "❚❚"; pb.setAttribute("aria-label", st.paused ? "Resume" : "Pause");
  }
  function renderAll(){
    st.stepsDirty = st.labelDirty = st.logDirty = st.feedbackDirty = true;
    renderScene(now()); renderControls(); renderStatus(); renderSteps(); renderLabel(); renderLog(); renderFeedback(); renderSpeed();
  }

  // ---------- main loop ----------
  var last = now();
  function frame(){
    var w = now(), dt = (w - last)/1000; last = w; if (dt > 0.5) dt = 0.5;
    if (!st.paused){
      var sd = dt * st.speed;
      st.simT += sd;
      if (st.active) st.txSec += sd;
      runEvents();
      if (st.sinking){
        st.shipDy += 46 * dt;
        var depth = (HRU_Y + st.shipDy - SEA_Y) / PX_PER_M;
        if (st.loc === "bracket" && depth >= st.releaseDepth) hruRelease(depth);
        if (st.shipDy > 360){ st.sinking = false; st.sunk = true; }
      }
    }
    renderScene(w);
    if (w - lastText > 120){ lastText = w; renderControls(); renderStatus(); }
    renderSteps(); renderLabel(); renderLog(); renderFeedback();
    requestAnimationFrame(frame);
  }

  // ---------- wiring ----------
  $("#es-scenario").addEventListener("change", function(e){ loadScenario(e.target.value); });
  $$("#es-speed button").forEach(function(b){
    b.addEventListener("click", function(){
      if (b.dataset.v === "pause") st.paused = !st.paused; else { st.speed = +b.dataset.v; st.paused = false; }
      renderSpeed(); renderStatus();
    });
  });
  $("#es-sound").addEventListener("click", function(e){
    soundOn = !soundOn;
    if (soundOn && !actx){ try{ actx = new (window.AudioContext || window.webkitAudioContext)(); }catch(err){ soundOn = false; } }
    if (actx && actx.state === "suspended") actx.resume();
    e.currentTarget.setAttribute("aria-pressed", String(soundOn));
    e.currentTarget.textContent = soundOn ? "Sound on" : "Sound off";
    if (soundOn) beep(1200, 0.08);
  });
  $$(".es-tab").forEach(function(b){ b.addEventListener("click", function(){ selectTab(b.dataset.tab); }); });
  $("#es-up").addEventListener("click", function(){ $("#es-device").scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block:"start"}); });
  $$("#es-switch .es-pos").forEach(function(b){ b.addEventListener("click", function(){ setSwitch(b.dataset.pos); renderControls(); renderStatus(); }); });
  el.guard.addEventListener("click", function(){ toggleGuard(); renderControls(); });
  el.guardClose.addEventListener("click", function(){ toggleGuard(); renderControls(); });
  el.btnRemove.addEventListener("click", function(){ removeOrReturn(); renderControls(); });
  el.btnWater.addEventListener("click", function(){ waterToggle(); renderControls(); });
  el.btnSink.addEventListener("click", function(){ sink(); renderControls(); });
  $("#es-btn-reset").addEventListener("click", function(){ loadScenario(st.scenario); });
  el.cancel.addEventListener("click", cancelCall);
  $("#es-record").addEventListener("click", recordLog);
  el.labelRows.addEventListener("click", function(e){ var b = e.target.closest(".es-lrow"); if (b) checkLabel(b.dataset.k); });
  el.reportWrap.addEventListener("click", function(e){ if (e.target.closest("#es-report")) report(); });

  var testBtn = $("#es-test"), hold1 = null, hold5 = null, started = false, holding = false;
  function testDown(e){
    if (e) e.preventDefault();
    if (holding) return;
    holding = true; started = false;
    testBtn.classList.add("pressed");
    hold1 = setTimeout(function(){ started = true; selfTest(); }, 1000);
    hold5 = setTimeout(function(){ gnssTest(); }, 5000);
  }
  function testUp(){
    if (!holding) return;
    holding = false;
    clearTimeout(hold1); clearTimeout(hold5);
    testBtn.classList.remove("pressed");
    if (!started) say("Hold TEST for a full second to start the self-test.", "info");
  }
  testBtn.addEventListener("pointerdown", function(e){ try{ testBtn.setPointerCapture(e.pointerId); }catch(err){} testDown(e); });
  testBtn.addEventListener("pointerup", testUp);
  testBtn.addEventListener("pointercancel", testUp);
  testBtn.addEventListener("contextmenu", function(e){ e.preventDefault(); });
  testBtn.addEventListener("keydown", function(e){ if ((e.key === " " || e.key === "Enter") && !e.repeat) testDown(e); });
  testBtn.addEventListener("keyup", function(e){ if (e.key === " " || e.key === "Enter") testUp(); });

  loadScenario("free");
  requestAnimationFrame(frame);
})();
