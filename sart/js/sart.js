/* Radar SART simulator: the SART, the rescue ship, its radar screen, the scenarios and everything on screen.
   One file, run once when the page loads. */
(function(){
  "use strict";
  var root = document.getElementById("sart-sim");
  if (!root) return;
  var $ = function(s){ return root.querySelector(s); };
  var $$ = function(s){ return Array.prototype.slice.call(root.querySelectorAll(s)); };

  var TAU = Math.PI * 2;
  var ROT = 2.4;               // radar scanner: seconds per revolution (real time)
  var DOT_GAP = 0.64, FIRST = 0.08;
  var DET = {bracket:10, hand:9, raft:4, pole:9, water:3};
  var HEIGHT = {bracket:"≈ 10 m (bridge)", hand:"≈ 3 m (deck)", raft:"≈ 0.5 m (in the canopy)", pole:"1 m+ (on its pole)", water:"≈ 0.1 m (floating)"};
  var HEIGHT_SHORT = {bracket:"Height ≈ 10 m", hand:"Height ≈ 3 m", raft:"Height ≈ 0.5 m", pole:"Height 1 m+", water:"Height ≈ 0.1 m"};
  var LOC_NAMES = {bracket:"In bracket", hand:"In hand, on deck", raft:"Inside the liferaft", pole:"On the pole", water:"Floating in the sea"};
  var POSE = {bracket:{x:52,y:91,r:0}, hand:{x:118,y:92,r:4}, raft:{x:238,y:166,r:0}, pole:{x:238,y:44,r:0}, water:{x:300,y:197,r:-78}};
  var CONTACTS = [{x:4.5, y:6.5}, {x:-8.5, y:-1.5}, {x:7, y:-5}];

  function now(){ return performance.now(); }
  function pad(n){ return String(n).padStart(2,"0"); }
  function fmtT(s){ s = Math.max(0, Math.floor(s)); var h = Math.floor(s/3600), m = Math.floor(s%3600/60), x = s%60; return h ? h+":"+pad(m)+":"+pad(x) : m+":"+pad(x); }
  function addMonths(d, n){ return new Date(d.getFullYear(), d.getMonth()+n, 1); }
  function fmtMY(d){ return pad(d.getMonth()+1)+"/"+d.getFullYear(); }
  function wrap(a){ a %= TAU; return a < 0 ? a + TAU : a; }
  function angDist(a, b){ return Math.abs(wrap(a - b + Math.PI) - Math.PI); }
  function deg(a){ return pad3(Math.round(wrap(a) * 180 / Math.PI) % 360) + "°"; }
  function pad3(n){ return String(n).padStart(3,"0"); }
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
      simT:0, speed:60, paused:false,
      sw:"OFF", guardUp:false, loc:"bracket", everOn:false,
      ship:null,
      radar:{band:"X", range:12, sea:"low", rain:"off"},
      mark:null, markOk:false,
      lastInterr:-1e9, responses:0, rescueHits:0, stbySec:0, respSec:0,
      c:{on:null, interr:null, dots:null, homing:null, arcs:null, circles:null, rec:null},
      log:[], logDirty:true, stepsDirty:true, labelDirty:true,
      selfTests:0, testing:false, testResp:0, testRings:false, testEndLogged:true,
      flashUntil:0, passUntil:0, failUntil:0,
      label:null, labelChecked:{bat:false, svc:false, type:false, kit:false}, reported:false,
      scenario:"free", steps:[], done:false,
      feedback:{text:"", kind:"info"}, feedbackDirty:true
    };
  }
  function makeLabel(expiredKey){
    var l = {
      bat:{name:"Battery expiry", d:addMonths(TODAY, 31), expired:false},
      svc:{name:"Annual check due", d:addMonths(TODAY, 7), expired:false},
      type:{name:"Type", text:"9 GHz radar SART · IMO", expired:false},
      kit:{name:"Pole and lanyard", text:"Stowed with the unit", expired:false}
    };
    if (expiredKey){ l[expiredKey].d = addMonths(TODAY, -2); l[expiredKey].expired = true; }
    return l;
  }
  function mkShip(x, y, vx, hdg){ return {x:x, y:y, vx:vx, vy:0, hdg:hdg != null ? hdg : (vx >= 0 ? Math.PI/2 : -Math.PI/2), homing:false, recovered:false}; }

  // ---------- helpers ----------
  function later(ms, fn){ var g = gen; setTimeout(function(){ if (g === gen) fn(); }, ms); }
  function addLog(text, kind){ st.log.unshift({t:st.simT, text:text, kind:kind||"info"}); if (st.log.length > 80) st.log.pop(); st.logDirty = true; news("log"); }
  function say(text, kind){ st.feedback = {text:text, kind:kind||"info"}; st.feedbackDirty = true; }
  var activeTab = "steps";
  function news(tab){ if (tab !== activeTab){ var b = root.querySelector('.es-tab[data-tab="'+tab+'"]'); if (b) b.classList.add("has-news"); } }
  function onOwnVessel(){ return st.loc === "bracket" || st.loc === "hand"; }
  function shipDist(){ return st.ship ? Math.hypot(st.ship.x, st.ship.y) : null; }
  function shipBearing(){ return Math.atan2(-st.ship.x, -st.ship.y); } // from ship to SART (SART at origin)
  function shipSpeed(){ return st.ship ? Math.hypot(st.ship.vx, st.ship.vy) : 0; }
  function testActive(){ return now() < st.testResp; }
  function radarView(){ return (testActive() || !st.ship) ? "own" : "rescue"; }
  function sartRel(view){
    if (view === "rescue") return {r:shipDist(), b:shipBearing()};
    return {r:onOwnVessel() ? 0 : 0.05, b:0};
  }
  function answering(view){
    if (st.radar.band !== "X") return false;
    if (view === "own" && testActive()) return true;
    if (st.sw !== "ON") return false;
    return view === "own" ? true : shipDist() <= DET[st.loc];
  }
  function radarRecent(){ return now() - st.lastInterr < 3000; }
  function respKind(r){ return r >= 2 ? "dots" : r > 0.2 ? "arcs" : "circles"; }

  // ---------- scenarios ----------
  var SCEN = {
    free:{ name:"Free practice", brief:"Try anything: switch the SART on, run a self-test, take it into the liferaft, mount it on its pole, and play with the rescue ship's radar settings.",
      setup:function(){ st.ship = mkShip(-11, 4, 10); }, steps:[] },
    selftest:{
      name:"Monthly test",
      brief:"Do the routine check from the bridge. The SART stays in its bracket and you test it against your own radar.",
      setup:function(){ st.radar = {band:"X", range:3, sea:"low", rain:"off"}; },
      steps:[
        {t:"Check the battery expiry date (Label tab)", ev:function(e){ return e.type==="label" && st.labelChecked.bat; }},
        {t:"Hold TEST for 1 second", ev:function(e){ return e.type==="selftest-start"; }},
        {t:"See the rings round the centre of your radar", ev:function(e){ return e.type==="test-rings"; }},
        {t:"Record the test in the radio log (Log tab)", ev:function(e){ return e.type==="logged"; }}
      ],
      win:"Test done and logged. The rings round the centre of your own radar show the SART is answering. Keep tests short: ships nearby see the rings too."
    },
    abandon:{
      name:"Abandon ship",
      brief:"You are abandoning ship into the liferaft and can take the SART with you. A rescue ship is searching a few miles away.",
      setup:function(){ st.ship = mkShip(-13, 4, 10); },
      steps:[
        {t:"Remove the SART from its bracket", ev:function(e){ return e.type==="loc" && e.loc==="hand"; }},
        {t:"Switch it ON: pull the safety tab first", ev:function(e){ return e.type==="switch" && e.pos==="ON"; }},
        {t:"Take it into the liferaft", ev:function(e){ return e.type==="loc" && e.loc==="raft"; }},
        {t:"Mount it on its pole, at least 1 m above the sea", ev:function(e){ return e.type==="loc" && e.loc==="pole"; }},
        {t:"Watch the Radar light: a ship's radar has reached you", ev:function(e){ return e.type==="interrogated"; }},
        {t:"The rescue ship homes in and comes alongside", ev:function(e){ return e.type==="recovered"; }}
      ],
      win:"Rescued. On its pole the SART answered the rescue ship's X-band radar from about 9 nm. Inside the canopy or floating in the sea, that drops to 3–4 nm."
    },
    height:{
      name:"Get it higher",
      brief:"You're in the liferaft. The SART is on, but it is floating in the sea beside you, only a few centimetres above the water. A rescue ship is searching a few miles away.",
      setup:function(){ st.ship = mkShip(-6.5, 4, 10); st.loc = "water"; st.guardUp = true; st.sw = "ON"; st.everOn = true; st.c.on = 0; },
      steps:[
        {t:"Lift the SART out of the water into the raft", ev:function(e){ return e.type==="loc" && e.loc==="raft"; }},
        {t:"Mount it on its pole, at least 1 m above the sea", ev:function(e){ return e.type==="loc" && e.loc==="pole"; }},
        {t:"The rescue ship's radar reaches you: the Radar light flashes", ev:function(e){ return e.type==="interrogated"; }},
        {t:"The rescue ship homes in and comes alongside", ev:function(e){ return e.type==="recovered"; }}
      ],
      win:"Height made the difference. Floating, the SART could only be seen from about 3 nm, so the ship would have passed by. On its pole it was picked up from about 9 nm."
    },
    search:{
      name:"On the rescue ship's radar",
      brief:"You're on the bridge of the rescue ship, which has slowed down in the search area. A liferaft's SART is somewhere within about 6 nm. Pick a range that reaches it, then mark it on the screen.",
      setup:function(){
        st.ship = mkShip(-3, -2.6, 0, 0.9); st.loc = "pole"; st.guardUp = true; st.sw = "ON"; st.everOn = true; st.c.on = 0;
        st.radar = {band:"X", range:3, sea:"low", rain:"off"};
      },
      steps:[
        {t:"Choose a range scale that reaches the SART (6 or 12 nm)", ev:function(e){ return e.type==="radar" && st.radar.range >= 6; }},
        {t:"Tap the SART's position on the radar screen", ev:function(e){ return e.type==="mark" && e.ok; }},
        {t:"Close in: watch the dots become arcs, then circles", ev:function(e){ return e.type==="circles"; }}
      ],
      win:"Found. The 12 dots point away from the SART, which sits at the dot nearest your ship. As you closed in, they spread into arcs and then circles."
    },
    inspect:{
      name:"Pre-departure inspection",
      brief:"Check the SART's label before sailing (Label tab). One item is out of date. Find it and report it.",
      steps:[
        {t:"Check the battery expiry date", ev:function(e){ return e.type==="label" && e.k==="bat"; }},
        {t:"Check when the annual check is due", ev:function(e){ return e.type==="label" && e.k==="svc"; }},
        {t:"Check it is a 9 GHz radar SART", ev:function(e){ return e.type==="label" && e.k==="type"; }},
        {t:"Check the pole and lanyard are with it", ev:function(e){ return e.type==="label" && e.k==="kit"; }},
        {t:"Report the out-of-date item", ev:function(e){ return e.type==="report"; }}
      ],
      win:"Don't rely on this SART until the item is sorted. An expired battery may not give 96 hours on standby plus 8 hours answering radar, and an overdue check means nobody has confirmed it still works."
    }
  };

  function emit(e){
    if (st.done) return;
    var changed = false;
    st.steps.forEach(function(s){ if (!s.done && s.ev(e)){ s.done = true; changed = true; } });
    if (changed){
      st.stepsDirty = true; news("steps");
      if (st.steps.length && st.steps.every(function(s){ return s.done; })){ st.done = true; say("Scenario complete. " + SCEN[st.scenario].win, "ok"); }
    }
  }

  // ---------- rescue ship ----------
  function updateShip(sd){
    var s = st.ship; if (!s || s.recovered) return;
    var d = shipDist();
    if (s.homing){
      if (d < 0.03){
        s.vx = s.vy = 0; s.recovered = true; st.c.rec = st.simT; news("rescue");
        addLog("Rescue ship alongside" + (onOwnVessel() ? " your vessel" : " the liferaft") + ". Survivors recovered.", "ok");
        if (!st.steps.length) say("Rescue ship alongside. Survivors recovered.", "ok");
        emit({type:"recovered"});
        return;
      }
      var v = Math.min(14, Math.max(1.5, d * 20));
      s.vx = -s.x / d * v; s.vy = -s.y / d * v; s.hdg = Math.atan2(s.vx, s.vy);
    } else if (s.vx !== 0){
      if ((s.vx > 0 && s.x > 9) || (s.vx < 0 && s.x < -9)){
        s.vx = -s.vx; var ny = Math.sign(s.y || 1) * Math.max(1, Math.abs(s.y) - 1.5);
        addLog("Rescue ship turns onto a new search leg, " + Math.abs(s.y - ny).toFixed(1) + " nm closer to the search centre.", "info");
        s.y = ny; s.hdg = Math.atan2(s.vx, s.vy);
      }
    }
    s.x += s.vx * sd / 3600; s.y += s.vy * sd / 3600;
  }
  function startHoming(why){
    var s = st.ship; if (!s || s.homing) return;
    s.homing = true; st.c.homing = st.simT; news("rescue");
    addLog("Rescue ship alters course for the SART" + (why ? " (" + why + ")" : "") + ": bearing " + deg(shipBearing()) + ", " + shipDist().toFixed(1) + " nm.", "alert");
    emit({type:"homing"});
  }

  function onInterrogated(view){
    st.lastInterr = now(); st.responses++;
    beep(1900, 0.05);
    pingFx(view);
    if (view === "own"){
      if (testActive() && !st.testRings){ st.testRings = true; addLog("Rings round the centre of your own radar: the SART is answering in test mode.", "tx"); emit({type:"test-rings"}); }
      else if (!testActive() && st.sw === "ON" && st.responses === 1) addLog("Your own radar shows rings round the centre: the SART on board is answering it. Ships nearby see a distress signal too.", "warn");
      return;
    }
    st.rescueHits++;
    var c = st.c;
    if (c.interr == null){
      c.interr = st.simT; news("rescue");
      addLog("Rescue ship's X-band radar reached the SART at " + shipDist().toFixed(1) + " nm. The Radar light flashes and the beeper sounds: survivors know a ship is close.", "alert");
      emit({type:"interrogated"});
    }
    if (c.dots == null && dotsShowing()){
      c.dots = st.simT; news("rescue");
      addLog("12-dot line on the rescue ship's radar, starting " + (shipDist() + FIRST).toFixed(1) + " nm away.", "tx");
      emit({type:"dots"});
    }
    if (st.scenario !== "search" && st.rescueHits >= 2) startHoming("radar operator saw the 12-dot line");
  }
  function dotsShowing(){
    var view = radarView(); if (!answering(view)) return false;
    var r = sartRel(view).r;
    for (var k = 0; k < 12; k++){ var rk = r + FIRST + DOT_GAP*k; if (rk > st.radar.range) return false; if (!(st.radar.sea === "high" && rk < 1.5)) return true; }
    return false;
  }

  // ---------- user actions ----------
  function setSwitch(pos){
    if (st.testing || pos === st.sw) return;
    if (pos === "ON" && !st.guardUp){ say("Pull the safety tab off first. It stops the SART being switched on by accident.", "warn"); return; }
    st.sw = pos;
    emit({type:"switch", pos:pos});
    if (pos === "ON"){
      st.everOn = true; if (st.c.on == null) st.c.on = st.simT; news("rescue");
      addLog("SART switched ON: standby. It stays silent until an X-band radar sweeps it, then answers every sweep.", "alert");
      if (onOwnVessel()) say("On standby. Take it into the liferaft and get it up on its pole.", "info");
      else say("On standby, waiting for a radar.", "info");
    } else {
      addLog("SART switched OFF.", st.ship && st.ship.homing && !st.ship.recovered ? "warn" : "info");
      if (st.ship && st.ship.homing && !st.ship.recovered) say("Switched off while the ship is homing in. It can still head for the last position, but nothing guides it the last part of the way.", "warn");
      else say("", "info");
    }
  }
  function toggleGuard(){
    if (st.guardUp && st.sw === "ON"){ say("Switch it OFF before refitting the safety tab.", "warn"); return; }
    st.guardUp = !st.guardUp;
  }
  var LOC_SAY = {
    hand:"Out of the bracket.",
    raft:"Inside the canopy it sits low and the canopy is in the way: range drops to 3–4 nm.",
    pole:"Up on its pole, about 1 m above the sea: a ship's radar can pick it up from about 8–10 nm.",
    water:"Floating, it is only a few centimetres above the water. Waves block it and range drops to about 3 nm.",
    bracket:"Back in its bracket."
  };
  var LOC_LOG = {
    hand:"SART removed from its bracket.", bracket:"SART returned to its bracket.", raft:"SART taken into the liferaft.",
    pole:"SART mounted on its pole above the canopy.", water:"SART put in the sea, floating on its lanyard."
  };
  function moveTo(loc, logText){
    st.loc = loc;
    addLog(logText || LOC_LOG[loc], "info");
    say(LOC_SAY[loc] + (st.sw === "OFF" && loc !== "bracket" && loc !== "hand" ? " It is still switched OFF, though." : ""), loc === "water" || loc === "raft" ? "warn" : "info");
    emit({type:"loc", loc:loc});
  }
  function btnRemove(){ if (st.loc === "bracket") moveTo("hand"); else if (st.loc === "hand") moveTo("bracket"); }
  function btnRaft(){ if (st.loc === "hand") moveTo("raft"); else if (st.loc === "raft") moveTo("hand", "SART taken back on deck."); }
  function btnPole(){ if (st.loc === "raft") moveTo("pole"); else if (st.loc === "pole") moveTo("raft", "SART taken down off its pole."); }
  function btnWater(){ if (st.loc === "raft") moveTo("water"); else if (st.loc === "water") moveTo("raft", "SART lifted out of the sea into the raft."); }

  function setRadar(ctl, v){
    if (ctl === "range") v = +v;
    if (st.radar[ctl] === v) return;
    st.radar[ctl] = v;
    if (ctl === "range" || ctl === "band") clearTrail();
    if (ctl === "band" && v === "S" && st.sw === "ON") say("S-band (10 cm) radar does not trigger a SART. It stays silent.", "warn");
    if (ctl === "sea" && v === "high") say("High sea clutter suppression wipes out weak echoes near your ship, SART dots included.", "warn");
    if (ctl === "rain" && v === "on") say("Rain clutter on: the SART dots go faint and broken.", "warn");
    emit({type:"radar", ctl:ctl, v:v});
  }
  function markAt(fx, fy){
    if (radarView() !== "rescue"){ say("Marking works on the rescue ship's radar. You're looking at your own radar now.", "info"); return; }
    if (st.markOk) return;
    var R = cv.clientWidth / 2 * 0.97, cx = cv.clientWidth / 2;
    var dx = (fx - cx) / R * st.radar.range, dy = -(fy - cx) / R * st.radar.range;
    if (Math.hypot(dx, dy) > st.radar.range){ return; }
    st.mark = {x:st.ship.x + dx, y:st.ship.y + dy};
    var errNm = Math.hypot(st.mark.x, st.mark.y);
    var view = "rescue", rel = sartRel(view), ok = false, onLine = false;
    if (dotsShowing()){
      var p1 = {x:Math.sin(rel.b) * (rel.r + FIRST), y:Math.cos(rel.b) * (rel.r + FIRST)};
      var p2 = {x:Math.sin(rel.b) * (rel.r + FIRST + DOT_GAP), y:Math.cos(rel.b) * (rel.r + FIRST + DOT_GAP)};
      var d1 = Math.hypot(dx - p1.x, dy - p1.y), d2 = Math.hypot(dx - p2.x, dy - p2.y);
      var pxPerNm = R / st.radar.range;
      ok = errNm < 0.36 || (d1 * pxPerNm <= 16 && d1 < d2);
      for (var k = 1; k < 12 && !ok; k++){
        var rk = rel.r + FIRST + DOT_GAP * k;
        if (Math.hypot(dx - Math.sin(rel.b) * rk, dy - Math.cos(rel.b) * rk) * pxPerNm <= 14) onLine = true;
      }
    }
    if (ok){
      st.markOk = true; st.mark = {x:0, y:0};
      addLog("SART marked on the radar: bearing " + deg(shipBearing()) + ", " + shipDist().toFixed(1) + " nm.", "ok");
      say("Spot on: that's the dot nearest your ship. Heading for it now.", "ok");
      emit({type:"mark", ok:true});
      startHoming("you marked it on the radar");
    } else if (onLine){
      say("That's on the SART's line, but further out. The SART is at the dot nearest your ship.", "warn");
      emit({type:"mark", ok:false});
    } else {
      say(dotsShowing() ? "No SART there. Look for a straight line of 12 evenly spaced dots, then tap the one nearest the centre." : "Nothing to mark yet. Choose a range scale that reaches the SART first.", "warn");
      emit({type:"mark", ok:false});
    }
  }
  function recordLog(){
    var txt = st.selfTests ? "Radio log: SART tested against own X-band radar, result recorded." : st.everOn ? "Radio log: SART activated, details recorded." : "Radio log: SART checked.";
    addLog(txt, "ok");
    say("Entry made in the GMDSS radio log.", "ok");
    emit({type:"logged"});
  }
  function checkLabel(k){
    st.labelChecked[k] = true; st.labelDirty = true;
    var item = st.label[k];
    if (item.expired) say(item.name + " is past its date. Sort this out before sailing.", "warn");
    emit({type:"label", k:k});
  }
  function report(){
    if (st.reported) return;
    st.reported = true; st.labelDirty = true;
    var k = st.label.bat.expired ? "bat" : "svc";
    addLog(k === "bat" ? "Reported: SART battery out of date, replacement ordered." : "Reported: SART annual check overdue, booked in.", "ok");
    emit({type:"report"});
  }

  // ---------- self-test ----------
  function selfTest(){
    if (st.sw === "ON"){ say("Switch the SART OFF before running a self-test.", "warn"); return; }
    if (st.testing) return;
    st.testing = true; st.testRings = false;
    addLog("Self-test started: lamp and beeper check.", "info");
    emit({type:"selftest-start"});
    st.flashUntil = now() + 500; beep(1200, 0.15);
    later(600, function(){
      if (onOwnVessel()){
        st.testResp = now() + 9000; st.testEndLogged = false; clearTrail();
        addLog("Test mode: the SART will answer your own radar for a few seconds.", "info");
        if (st.radar.band !== "X") say("Your radar is on S-band (10 cm), so no rings will show. A SART only answers X-band (3 cm). Switch to X-band.", "warn");
      } else addLog("Test mode on, but your own ship's radar is out of reach here, so only the lamp and beeper are checked.", "info");
    });
    later(2600, function(){
      var fail = st.label.bat.expired;
      st.testing = false; st.selfTests++;
      if (fail){ st.failUntil = now() + 3200; addLog("Self-test FAILED (red light): battery past its expiry date.", "warn"); beep(300, 0.5); say("Self-test failed. Don't rely on this SART until the battery is replaced.", "warn"); }
      else { st.passUntil = now() + 3200; addLog("Self-test PASSED.", "ok"); beep(1600, 0.1); later(220, function(){ beep(1600, 0.1); }); if (st.radar.band === "X" || !onOwnVessel()) say("Self-test passed." + (onOwnVessel() ? " Look at your radar for the rings round the centre." : ""), "ok"); }
      emit({type:"selftest-result", pass:!fail});
    });
  }

  // ---------- scene fx ----------
  var SVGNS = "http://www.w3.org/2000/svg";
  var fxG = $("#ss-fx"), ping = $("#ss-ping");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function lampPos(){
    var p = POSE[st.loc], t = p.r * Math.PI / 180;
    return {x:p.x + 12*Math.cos(t) - 1*Math.sin(t), y:p.y + 12*Math.sin(t) + 1*Math.cos(t)};
  }
  function shipPose(){
    var d = Math.min(shipDist(), 12), f = d / 12;
    return {x:305 + 100*f, s:0.25 + 0.75*(1 - f)*(1 - f)};
  }
  function pingFx(view){
    var a = lampPos(), from;
    if (view === "rescue"){ if (shipDist() > 12) from = null; else { var p = shipPose(); from = {x:p.x + 76*p.s, y:200 - 58*p.s}; } }
    else from = {x:20, y:21};
    var c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("cx", a.x); c.setAttribute("cy", a.y); c.setAttribute("r", 6); c.setAttribute("fill", "none");
    c.style.stroke = "var(--gold)"; c.setAttribute("stroke-width", 2);
    c.style.transformBox = "fill-box"; c.style.transformOrigin = "center";
    fxG.appendChild(c);
    if (c.animate && !reduceMotion){
      var an = c.animate([{transform:"scale(1)", opacity:1},{transform:"scale(6)", opacity:0}], {duration:1300, easing:"ease-out"});
      an.onfinish = function(){ c.remove(); };
    } else setTimeout(function(){ c.remove(); }, 700);
    if (from){
      ping.setAttribute("x1", from.x); ping.setAttribute("y1", from.y); ping.setAttribute("x2", a.x); ping.setAttribute("y2", a.y);
      if (ping.animate && !reduceMotion) ping.animate([{opacity:0},{opacity:.95},{opacity:0}], {duration:900});
    }
  }

  // ---------- radar ----------
  var cv = $("#ss-radar"), ctx = cv.getContext("2d");
  var trail = document.createElement("canvas"), tctx = trail.getContext("2d");
  var RD = {px:0, dpr:1, ang:0, last:now()};
  function sizeRadar(){
    var w = cv.clientWidth || 300, dpr = Math.min(2, window.devicePixelRatio || 1), px = Math.max(120, Math.round(w * dpr));
    if (px !== RD.px){ RD.px = px; RD.dpr = dpr; cv.width = cv.height = trail.width = trail.height = px; }
  }
  function clearTrail(){ tctx.clearRect(0, 0, trail.width, trail.height); }
  function inWedge(b, a0, span){ return wrap(b - a0) <= span; }
  function P(c, R, rn, rg, b){ var rp = rn / rg * R; return [c + rp*Math.sin(b), c - rp*Math.cos(b)]; }
  var PH = "125,255,168";

  function drawRadar(w, frozen){
    sizeRadar();
    var dt = (w - RD.last) / 1000; RD.last = w; if (dt > 0.25) dt = 0.25; if (dt < 0 || frozen) dt = 0;
    var S = RD.px, c = S / 2, R = c * 0.97, d = RD.dpr, rg = st.radar.range;
    var a0 = RD.ang, span = TAU * dt / ROT; RD.ang = wrap(a0 + span);
    var view = radarView();

    // afterglow fade
    tctx.globalCompositeOperation = "destination-out";
    tctx.fillStyle = "rgba(0,0,0," + (1 - Math.exp(-dt / 1.3)).toFixed(4) + ")";
    tctx.fillRect(0, 0, S, S);
    tctx.globalCompositeOperation = "source-over";

    if (span > 0){
      // sea clutter near the centre
      if (st.radar.sea === "low"){
        var n = Math.round(span / TAU * 260);
        tctx.fillStyle = "rgba(" + PH + ",.5)";
        for (var i = 0; i < n; i++){
          var ca = a0 + Math.random() * span, cr = 1.6 * Math.pow(Math.random(), 2.2);
          if (cr > rg) continue;
          var cp = P(c, R, cr, rg, ca); tctx.fillRect(cp[0], cp[1], 2*d, 2*d);
        }
      }
      // other ships
      if (view === "rescue"){
        tctx.fillStyle = "rgb(" + PH + ")";
        CONTACTS.forEach(function(k){
          var dx = k.x - st.ship.x, dy = k.y - st.ship.y, rn = Math.hypot(dx, dy), b = Math.atan2(dx, dy);
          if (rn <= rg && inWedge(b, a0, span)){ var p = P(c, R, rn, rg, b); tctx.beginPath(); tctx.ellipse(p[0], p[1], 5*d, 3*d, b, 0, TAU); tctx.fill(); }
        });
      }
      // SART response
      if (answering(view)){
        var rel = sartRel(view), r = rel.r, b = rel.b;
        if (inWedge(b, a0, span)) onInterrogated(view);
        var hw = r >= 1 ? 0 : r <= 0.2 ? Math.PI : Math.min(Math.PI, 0.12 / (r*r));
        var faint = st.radar.rain === "on";
        tctx.fillStyle = tctx.strokeStyle = faint ? "rgba(" + PH + ",.35)" : "rgb(" + PH + ")";
        tctx.lineWidth = (faint ? 1.4 : 3) * d;
        var step = 0.6 * Math.PI / 180;
        for (var k = 0; k < 12; k++){
          var rk = r + FIRST + DOT_GAP * k;
          if (rk > rg) break;
          if (st.radar.sea === "high" && rk < 1.5) continue;
          if (hw === 0){
            if (inWedge(b, a0, span)){
              var p = P(c, R, rk, rg, b);
              tctx.beginPath(); tctx.arc(p[0], p[1], (faint ? 1.6 : 3.4) * d, 0, TAU); tctx.fill();
              if (faint && Math.random() < 0.5){ tctx.clearRect(p[0] - 2*d, p[1] - 2*d, 4*d, 4*d); }
            }
          } else {
            for (var a = a0; a < a0 + span; a += step){
              var seg = Math.min(step, a0 + span - a);
              if (angDist(a + seg/2, b) <= hw && !(faint && Math.random() < 0.4)){
                tctx.beginPath(); tctx.arc(c, c, rk / rg * R, a - Math.PI/2, a + seg - Math.PI/2); tctx.stroke();
              }
            }
          }
        }
      }
    }

    // screen
    ctx.clearRect(0, 0, S, S);
    var g = ctx.createRadialGradient(c, c, 0, c, c, R);
    g.addColorStop(0, "#07291c"); g.addColorStop(1, "#021109");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(" + PH + ",.22)"; ctx.lineWidth = d;
    for (var ri = 1; ri <= 3; ri++){ ctx.beginPath(); ctx.arc(c, c, R * ri / 3, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = "rgba(" + PH + ",.4)";
    for (var dg = 0; dg < 360; dg += 10){
      var t = dg * Math.PI / 180, len = (dg % 30 ? 4 : 9) * d;
      ctx.beginPath(); ctx.moveTo(c + R*Math.sin(t), c - R*Math.cos(t)); ctx.lineTo(c + (R-len)*Math.sin(t), c - (R-len)*Math.cos(t)); ctx.stroke();
    }
    var hd = view === "rescue" ? st.ship.hdg : 0;
    ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.2*d;
    ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(c + R*Math.sin(hd), c - R*Math.cos(hd)); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(c, c, R, 0, TAU); ctx.clip();
    ctx.drawImage(trail, 0, 0);
    var sw = RD.ang;
    ctx.fillStyle = "rgba(" + PH + ",.10)";
    ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, R, sw - Math.PI/2 - 0.45, sw - Math.PI/2); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(" + PH + ",.85)"; ctx.lineWidth = 1.5*d;
    ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(c + R*Math.sin(sw), c - R*Math.cos(sw)); ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(c, c, 3*d, 0, TAU); ctx.fill();
    if (st.mark && view === "rescue"){
      var mx = st.mark.x - st.ship.x, my = st.mark.y - st.ship.y, mr = Math.hypot(mx, my);
      if (mr <= rg){
        var mp = P(c, R, mr, rg, Math.atan2(mx, my)), s = 9*d;
        ctx.strokeStyle = st.markOk ? "#ffd36b" : "#ff8a7a"; ctx.lineWidth = 2*d;
        ctx.beginPath(); ctx.arc(mp[0], mp[1], s, 0, TAU); ctx.moveTo(mp[0]-s-4*d, mp[1]); ctx.lineTo(mp[0]-s+3*d, mp[1]); ctx.moveTo(mp[0]+s-3*d, mp[1]); ctx.lineTo(mp[0]+s+4*d, mp[1]);
        ctx.moveTo(mp[0], mp[1]-s-4*d); ctx.lineTo(mp[0], mp[1]-s+3*d); ctx.moveTo(mp[0], mp[1]+s-3*d); ctx.lineTo(mp[0], mp[1]+s+4*d); ctx.stroke();
      }
    }
  }

  // ---------- static UI ----------
  var CHAIN = [
    {k:"on", n:"SART on", s:"Standby, waiting for a radar"},
    {k:"interr", n:"Radar reaches it", s:"Light and beeper change"},
    {k:"dots", n:"12 dots on radar", s:"Rescue ship sees the line"},
    {k:"homing", n:"Ship alters course", s:"Heads for the nearest dot"},
    {k:"arcs", n:"Arcs", s:"Within about 1–5 nm"},
    {k:"circles", n:"Circles", s:"Very close"},
    {k:"rec", n:"Alongside", s:"Survivors recovered"}
  ];
  $("#ss-chain").innerHTML = CHAIN.map(function(c){ return '<li data-k="'+c.k+'"><div><b>'+c.n+'</b><span>'+c.s+'</span></div><em>—</em></li>'; }).join("");
  var chainLis = {}; $$("#ss-chain li").forEach(function(li){ chainLis[li.dataset.k] = li; });

  // ---------- tabs ----------
  function selectTab(name){
    activeTab = name;
    $$(".es-tab").forEach(function(b){ var on = b.dataset.tab === name; b.setAttribute("aria-selected", on ? "true" : "false"); if (on) b.classList.remove("has-news"); });
    $$(".es-pane").forEach(function(p){ p.classList.toggle("is-off", p.dataset.pane !== name); });
  }

  // ---------- load scenario ----------
  function loadScenario(key){
    gen++;
    var sp = st ? st.speed : 60;
    st = freshState(); st.speed = sp; st.scenario = key;
    st.label = makeLabel(key === "inspect" ? (Math.random() < 0.5 ? "bat" : "svc") : null);
    var sc = SCEN[key];
    st.steps = sc.steps.map(function(s){ return {t:s.t, ev:s.ev, done:false}; });
    while (fxG.firstChild) fxG.removeChild(fxG.firstChild);
    clearTrail();
    $("#ss-sc-h").textContent = sc.name;
    $("#ss-brief").textContent = sc.brief;
    addLog("Scenario: " + sc.name + ".", "info");
    if (sc.setup) sc.setup();
    if (key === "height") addLog("SART is on, floating in the sea on its lanyard.", "warn");
    say(key === "search" || key === "height" ? sc.brief : "", "info");
    $$(".es-tab").forEach(function(b){ b.classList.remove("has-news"); });
    selectTab(key === "inspect" ? "label" : "steps");
    lastSartT = ""; picKey = "";
    renderAll();
  }

  // ---------- rendering ----------
  var el = {
    svg:$("#ss-svg"), sart:$("#ss-sart"), rship:$("#ss-rship"), shipT:$("#ss-ship-t"), lamp:$("#ss-lamp"), flash:$("#ss-flash"),
    heightT:$("#ss-height-t"), locT:$("#ss-loc-t"),
    btnRemove:$("#ss-btn-remove"), btnRaft:$("#ss-btn-raft"), btnPole:$("#ss-btn-pole"), btnWater:$("#ss-btn-water"),
    feedback:$("#ss-feedback"), knob:$("#ss-knob"), guard:$("#ss-guard"), guardClose:$("#ss-guard-close"), swHelp:$("#ss-sw-help"),
    lStby:$("#ss-l-stby"), lRadar:$("#ss-l-radar"), lPass:$("#ss-l-pass"), lFault:$("#ss-l-fault"),
    mode:$("#ss-mode"), clock:$("#ss-clock"), stripShip:$("#ss-strip-ship"),
    rResp:$("#ss-r-resp"), rShip:$("#ss-r-ship"), rDet:$("#ss-r-det"), rBatt:$("#ss-r-batt"),
    rLoc:$("#ss-r-loc"), rHeight:$("#ss-r-height"), rMode:$("#ss-r-mode"), rTests:$("#ss-r-tests"),
    chainNote:$("#ss-chain-note"), pic:$("#ss-pic"), steps:$("#ss-steps"), banner:$("#ss-banner"),
    labelRows:$("#ss-label-rows"), reportWrap:$("#ss-report-wrap"), log:$("#ss-log"),
    radarH:$("#ss-radar-h"), radarSub:$("#ss-radar-sub"), radarHdg:$("#ss-radar-hdg"),
    tagBand:$("#ss-tag-band"), tagRange:$("#ss-tag-range"), tagRings:$("#ss-tag-rings"), tagMark:$("#ss-tag-mark"), hint:$("#ss-hint")
  };
  var lastSartT = "", lastText = 0, picKey = "";
  function setText(node, t){ if (node.textContent !== t) node.textContent = t; }

  function lights(w){
    var lampTest = w < st.flashUntil;
    var on = st.sw === "ON";
    var radar = (on || testActive()) && radarRecent() && (w % 400) < 220;
    var stby = lampTest || (on && !radarRecent() && (w % 2000) < 160);
    var pass = lampTest || (w < st.passUntil && (w % 500) < 280);
    var fault = lampTest || (w < st.failUntil && (w % 500) < 280);
    return {stby:stby, radar:radar || lampTest, pass:pass, fault:fault};
  }

  function renderScene(w){
    var p = POSE[st.loc];
    var t = "translate(" + p.x + "px," + p.y + "px) rotate(" + p.r + "deg)";
    if (t !== lastSartT){ el.sart.style.transform = t; lastSartT = t; }
    el.svg.classList.toggle("in-water", st.loc === "water");
    el.svg.classList.toggle("on-pole", st.loc === "pole");
    if (st.ship){
      var d = shipDist();
      if (d > 12){ el.rship.style.opacity = 0; setText(el.shipT, "Rescue ship " + d.toFixed(1) + " nm · over the horizon"); }
      else {
        var sp = shipPose(); el.rship.style.opacity = 1;
        el.rship.style.transform = "translate(" + sp.x.toFixed(1) + "px,200px) scale(" + sp.s.toFixed(3) + ")";
        setText(el.shipT, st.ship.recovered ? "Rescue ship alongside" : "Rescue ship " + d.toFixed(1) + " nm");
      }
    } else { el.rship.style.opacity = 0; setText(el.shipT, ""); }
    setText(el.heightT, HEIGHT_SHORT[st.loc]);
    setText(el.locT, LOC_NAMES[st.loc].toUpperCase());
    var L = lights(w);
    var col = L.fault && w < st.failUntil ? "#ff5a4a" : L.radar ? "#ffb84d" : L.pass && w < st.passUntil ? "#ffffff" : L.stby ? "#5df08f" : (w < st.flashUntil ? "#ffffff" : "#152027");
    el.lamp.setAttribute("fill", col);
    el.flash.setAttribute("opacity", L.radar ? 1 : 0);
    el.lStby.classList.toggle("on", L.stby);
    el.lRadar.classList.toggle("on", L.radar);
    el.lPass.classList.toggle("on", L.pass);
    el.lFault.classList.toggle("on", L.fault);
  }

  function renderControls(){
    $$("#ss-switch .es-pos").forEach(function(b){ b.setAttribute("aria-checked", b.dataset.pos === st.sw ? "true" : "false"); });
    el.knob.style.transform = "translateX(" + (st.sw === "ON" ? 100 : 0) + "%)";
    el.guard.classList.toggle("up", st.guardUp);
    el.guard.setAttribute("aria-hidden", st.guardUp ? "true" : "false");
    el.guard.tabIndex = st.guardUp ? -1 : 0;
    el.guardClose.hidden = !st.guardUp;
    setText(el.swHelp, st.sw === "OFF" ? "OFF: the SART will not answer any radar." : radarRecent() ? "ON: answering radar now." : "ON: standby, waiting for an X-band radar.");
    var deck = onOwnVessel(), raftish = st.loc === "raft" || st.loc === "pole" || st.loc === "water";
    setText(el.btnRemove, st.loc === "hand" ? "Return to bracket" : "Remove from bracket");
    el.btnRemove.disabled = !deck;
    setText(el.btnRaft, st.loc === "raft" ? "Back on deck" : "Take into liferaft");
    el.btnRaft.disabled = !(st.loc === "hand" || st.loc === "raft");
    setText(el.btnPole, st.loc === "pole" ? "Take off pole" : "Mount on pole");
    el.btnPole.disabled = !(st.loc === "raft" || st.loc === "pole");
    setText(el.btnWater, st.loc === "water" ? "Lift into raft" : "Into the water");
    el.btnWater.disabled = !(st.loc === "raft" || st.loc === "water");
    $$(".ss-rctl .es-seg").forEach(function(g){
      var ctl = g.dataset.ctl;
      Array.prototype.forEach.call(g.querySelectorAll("button"), function(b){ b.setAttribute("aria-pressed", String(String(st.radar[ctl]) === b.dataset.v)); });
    });
    void raftish;
  }

  function renderStatus(){
    var mode, s;
    if (st.testing || testActive()){ mode = "Test"; s = "test"; }
    else if (st.sw === "ON" && radarRecent()){ mode = "Responding"; s = "resp"; }
    else if (st.sw === "ON"){ mode = "Standby"; s = "armed"; }
    else { mode = "Off"; s = "off"; }
    setText(el.mode, mode); el.mode.dataset.s = s;
    setText(el.clock, "T+" + fmtT(st.simT) + (st.paused ? " ❚❚" : ""));
    var d = shipDist();
    setText(el.stripShip, d == null ? "—" : st.ship.recovered ? "alongside" : d.toFixed(1) + " nm");
    setText(el.rResp, String(st.responses));
    setText(el.rShip, d == null ? "None" : st.ship.recovered ? "Alongside" : d.toFixed(1) + " nm");
    setText(el.rDet, "~" + DET[st.loc] + " nm");
    var used = st.stbySec / (96*3600) + st.respSec / (8*3600);
    setText(el.rBatt, st.label.bat.expired ? "Expired" : Math.max(0, 100 - used*100).toFixed(used > 0.005 ? 1 : 0) + "%");
    setText(el.rLoc, LOC_NAMES[st.loc]);
    setText(el.rHeight, HEIGHT[st.loc]);
    setText(el.rMode, mode === "Responding" ? "Answering radar" : mode === "Test" ? "Test mode" : mode);
    setText(el.rTests, String(st.selfTests));

    // rescue chain
    var c = st.c;
    CHAIN.forEach(function(item){
      var li = chainLis[item.k], t = c[item.k], cls = t != null ? (item.k === "rec" ? "stood" : item.k === "interr" ? "alert" : "on") : "";
      if (li.className !== cls) li.className = cls;
      setText(li.querySelector("em"), t != null ? "T+" + fmtT(t) : "—");
    });
    var view = radarView(), ans = answering(view), note;
    if (!st.ship) note = st.sw === "ON" ? "No rescue ship in this scenario. Your own radar shows the SART on board as rings round the centre." : "No rescue ship in this scenario.";
    else if (st.ship.recovered) note = "Rescue ship alongside. Survivors recovered.";
    else if (st.sw !== "ON") note = st.everOn ? "The SART is off, so it can't answer the rescue ship's radar." : "The SART is off. Nothing to see on any radar yet.";
    else if (st.radar.band !== "X") note = "The rescue ship's radar is on S-band. The SART only answers X-band, so it stays silent.";
    else if (d > DET[st.loc]) note = "Rescue ship " + d.toFixed(1) + " nm away, out of reach. From " + LOC_NAMES[st.loc].toLowerCase() + " the SART can be seen from about " + DET[st.loc] + " nm.";
    else if (st.ship.homing) note = "Rescue ship homing in on the SART, " + d.toFixed(1) + " nm to go.";
    else note = "The rescue ship's radar is reaching the SART.";
    setText(el.chainNote, note);
    $$("#ss-guide div").forEach(function(g){ g.classList.toggle("on", view === "rescue" && ans && respKind(d) === g.dataset.g); });
    var hideBrg = st.scenario === "search" && !st.markOk;
    var key = [view, ans, d == null ? "" : d.toFixed(1), hideBrg, st.radar.band, st.radar.range, st.radar.sea, st.radar.rain].join("|");
    if (key !== picKey){
      picKey = key;
      var rows;
      if (view !== "rescue") rows = [["Radar", "Your own ship"], ["Response", ans ? "Rings round the centre" : "None"], ["Range scale", st.radar.range + " nm"]];
      else rows = [
        ["Response", ans ? (respKind(d) === "dots" ? "Line of 12 dots" : respKind(d) === "arcs" ? "Arcs" : "Circles") : "None"],
        ["Bearing from ship", hideBrg ? "Mark it on the radar first" : deg(shipBearing())],
        ["SART range", hideBrg ? "Mark it on the radar first" : d.toFixed(1) + " nm"],
        ["Line length", "≈ " + (FIRST + DOT_GAP*11).toFixed(1) + " nm (12 dots)"],
        ["Range scale", st.radar.range + " nm"]
      ];
      el.pic.innerHTML = '<dl class="es-msg">' + rows.map(function(r){ return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join("") + '</dl>' +
        '<p class="es-small">The SART is at the dot nearest the radar\'s own ship. The line points away from the ship along the SART\'s bearing.</p>';
    }

    // radar header
    setText(el.radarH, view === "rescue" ? "Rescue ship's radar" : testActive() ? "Your own radar · test" : "Your own radar");
    setText(el.radarSub, view === "rescue" ? "North up · " + (st.ship.recovered ? "stopped" : shipSpeed().toFixed(0) + " kn") : "North up · own ship at centre");
    setText(el.radarHdg, "HDG " + deg(view === "rescue" ? st.ship.hdg : 0));
    setText(el.tagBand, st.radar.band + "-BAND");
    setText(el.tagRange, st.radar.range + " NM");
    setText(el.tagRings, "RINGS " + (st.radar.range / 3) + " NM");
    setText(el.tagMark, view === "rescue" ? (st.markOk ? "MARKED" : "TAP = MARK") : "OWN SHIP");
    setText(el.hint, view === "rescue" ? (st.markOk ? "Marked. The ship is heading for it." : "Tap the screen to mark where you think the SART is.") : "Your own ship is at the centre. A SART on board shows as rings round it.");
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
    el.labelRows.innerHTML = ["bat","svc","type","kit"].map(function(k){
      var it = st.label[k], checked = st.labelChecked[k];
      var tag = !checked ? '<span class="es-tag">Check</span>' : it.expired ? '<span class="es-tag bad">' + (k === "svc" ? "OVERDUE" : "EXPIRED") + '</span>' : '<span class="es-tag ok">OK</span>';
      return '<button type="button" class="es-lrow" data-k="' + k + '"><span><small>' + it.name + '</small><strong>' + (it.text || fmtMY(it.d)) + '</strong></span>' + tag + '</button>';
    }).join("");
    var expiredSeen = (st.label.bat.expired && st.labelChecked.bat) || (st.label.svc.expired && st.labelChecked.svc);
    if (expiredSeen){
      el.reportWrap.hidden = false;
      el.reportWrap.innerHTML = st.reported ? '<span class="es-tag ok">Reported</span>' : '<button type="button" class="btn" id="ss-report">Report it</button>';
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
    $$("#ss-speed button").forEach(function(b){
      var v = b.dataset.v;
      b.setAttribute("aria-pressed", v === "pause" ? String(st.paused) : String(!st.paused && +v === st.speed));
    });
    var pb = $("#ss-pause"); pb.textContent = st.paused ? "▶" : "❚❚"; pb.setAttribute("aria-label", st.paused ? "Resume" : "Pause");
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
      if (st.sw === "ON"){ if (radarRecent()) st.respSec += sd; else st.stbySec += sd; }
      updateShip(sd);
      if (st.ship && !st.ship.recovered && radarView() === "rescue" && answering("rescue")){
        var d = shipDist();
        if (d < 2 && st.c.arcs == null){ st.c.arcs = st.simT; news("rescue"); addLog("The SART's dots have spread into arcs: the rescue ship is close (arcs show somewhere between 1 and 5 nm).", "tx"); emit({type:"arcs"}); }
        if (d < 0.2 && st.c.circles == null){ st.c.circles = st.simT; news("rescue"); addLog("Arcs have closed into circles round the centre of the radar: the SART is very close.", "tx"); emit({type:"circles"}); }
        if (d < 1.5 && st.radar.sea === "high" && st.ship.homing && !st.warnedSea){ st.warnedSea = true; say("Sea clutter suppression is on High: the SART's dots near your ship are being wiped out. Turn it down.", "warn"); }
      }
    }
    if (st.testResp && !testActive() && !st.testEndLogged){ st.testEndLogged = true; clearTrail(); addLog("Test mode ended. Keep tests short: ships nearby see the rings too.", "info"); }
    drawRadar(w, st.paused);
    renderScene(w);
    if (w - lastText > 120){ lastText = w; renderControls(); renderStatus(); }
    renderSteps(); renderLabel(); renderLog(); renderFeedback();
    requestAnimationFrame(frame);
  }

  // ---------- wiring ----------
  $("#ss-scenario").addEventListener("change", function(e){ loadScenario(e.target.value); });
  $$("#ss-speed button").forEach(function(b){
    b.addEventListener("click", function(){
      if (b.dataset.v === "pause") st.paused = !st.paused; else { st.speed = +b.dataset.v; st.paused = false; }
      renderSpeed(); renderStatus();
    });
  });
  $("#ss-sound").addEventListener("click", function(e){
    soundOn = !soundOn;
    if (soundOn && !actx){ try{ actx = new (window.AudioContext || window.webkitAudioContext)(); }catch(err){ soundOn = false; } }
    if (actx && actx.state === "suspended") actx.resume();
    e.currentTarget.setAttribute("aria-pressed", String(soundOn));
    e.currentTarget.textContent = soundOn ? "Sound on" : "Sound off";
    if (soundOn) beep(1200, 0.08);
  });
  $$(".es-tab").forEach(function(b){ b.addEventListener("click", function(){ selectTab(b.dataset.tab); }); });
  $("#ss-up").addEventListener("click", function(){ $("#ss-device").scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block:"start"}); });
  $$("#ss-switch .es-pos").forEach(function(b){ b.addEventListener("click", function(){ setSwitch(b.dataset.pos); renderControls(); renderStatus(); }); });
  el.guard.addEventListener("click", function(){ toggleGuard(); renderControls(); });
  el.guardClose.addEventListener("click", function(){ toggleGuard(); renderControls(); });
  el.btnRemove.addEventListener("click", function(){ btnRemove(); renderControls(); });
  el.btnRaft.addEventListener("click", function(){ btnRaft(); renderControls(); });
  el.btnPole.addEventListener("click", function(){ btnPole(); renderControls(); });
  el.btnWater.addEventListener("click", function(){ btnWater(); renderControls(); });
  $("#ss-btn-reset").addEventListener("click", function(){ loadScenario(st.scenario); });
  $("#ss-record").addEventListener("click", recordLog);
  el.labelRows.addEventListener("click", function(e){ var b = e.target.closest(".es-lrow"); if (b) checkLabel(b.dataset.k); });
  el.reportWrap.addEventListener("click", function(e){ if (e.target.closest("#ss-report")) report(); });
  $$(".ss-rctl .es-seg").forEach(function(g){
    g.addEventListener("click", function(e){ var b = e.target.closest("button"); if (b){ setRadar(g.dataset.ctl, b.dataset.v); renderControls(); renderStatus(); } });
  });
  cv.addEventListener("click", function(e){ var r = cv.getBoundingClientRect(); markAt(e.clientX - r.left, e.clientY - r.top); });

  var testBtn = $("#ss-test"), hold1 = null, started = false, holding = false;
  function testDown(e){
    if (e) e.preventDefault();
    if (holding) return;
    holding = true; started = false;
    testBtn.classList.add("pressed");
    hold1 = setTimeout(function(){ started = true; selfTest(); }, 1000);
  }
  function testUp(){
    if (!holding) return;
    holding = false;
    clearTimeout(hold1);
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
