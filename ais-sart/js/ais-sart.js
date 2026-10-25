/* AIS-SART simulator: the AIS-SART, the rescue ship, its AIS display, the scenarios and everything on screen.
   Built on the Radar SART module (same layout, same es-* classes). One file, run once when the page loads. */
(function(){
  "use strict";
  var root = document.getElementById("ais-sart-sim");
  if (!root) return;
  var $ = function(s){ return root.querySelector(s); };
  var $$ = function(s){ return Array.prototype.slice.call(root.querySelectorAll(s)); };

  var TAU = Math.PI * 2;
  var BURST = 60;               // seconds between bursts (sim time): one burst of 8 messages a minute
  var FIX_AFTER = 50;           // seconds from switch-on to a GNSS fix (sim time)
  var MMSI = "970012345", MMSI_TXT = "970 01 2345";
  var DET = {bracket:10, hand:9, raft:4, pole:8, water:3};
  var HEIGHT = {bracket:"≈ 10 m (bridge)", hand:"≈ 3 m (deck)", raft:"≈ 0.5 m (in the canopy)", pole:"1 m+ (on its pole)", water:"≈ 0.1 m (floating)"};
  var HEIGHT_SHORT = {bracket:"Height ≈ 10 m", hand:"Height ≈ 3 m", raft:"Height ≈ 0.5 m", pole:"Height 1 m+", water:"Height ≈ 0.1 m"};
  var LOC_NAMES = {bracket:"In bracket", hand:"In hand, on deck", raft:"Inside the liferaft", pole:"On the pole", water:"Floating in the sea"};
  var POSE = {bracket:{x:52,y:91,r:0}, hand:{x:118,y:92,r:4}, raft:{x:238,y:166,r:0}, pole:{x:238,y:44,r:0}, water:{x:300,y:197,r:-78}};
  // other AIS targets (nm from the SART: x east, y north)
  var CONTACTS = [
    {x:4.5, y:6.5, hdg:200, name:"MV CARMEL STAR", mmsi:"428 765 210", sog:12, type:"Cargo"},
    {x:-8.5, y:-1.5, hdg:75, name:"FV GALIL", mmsi:"428 330 917", sog:6, type:"Fishing"},
    {x:7, y:-5, hdg:320, name:"MV NEGEV BAY", mmsi:"636 092 118", sog:14, type:"Tanker"}
  ];
  var SART_LAT = 32 + 35/60, SART_LON = 34 + 40/60;   // off the Israeli coast

  function now(){ return performance.now(); }
  function pad(n){ return String(n).padStart(2,"0"); }
  function pad3(n){ return String(n).padStart(3,"0"); }
  function fmtT(s){ s = Math.max(0, Math.floor(s)); var h = Math.floor(s/3600), m = Math.floor(s%3600/60), x = s%60; return h ? h+":"+pad(m)+":"+pad(x) : m+":"+pad(x); }
  function addMonths(d, n){ return new Date(d.getFullYear(), d.getMonth()+n, 1); }
  function fmtMY(d){ return pad(d.getMonth()+1)+"/"+d.getFullYear(); }
  function wrap(a){ a %= TAU; return a < 0 ? a + TAU : a; }
  function deg(a){ return pad3(Math.round(wrap(a) * 180 / Math.PI) % 360) + "°"; }
  function rad(d){ return d * Math.PI / 180; }
  function latLon(xNm, yNm){
    var lat = SART_LAT + yNm / 60, lon = SART_LON + xNm / (60 * Math.cos(rad(SART_LAT)));
    function f(v, w, h){ var d = Math.floor(v), m = (v - d) * 60; return String(d).padStart(w, "0") + "°" + m.toFixed(2).padStart(5, "0") + "′" + h; }
    return f(lat, 2, "N") + " " + f(lon, 3, "E");
  }
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
      onAt:null, fix:false, nextBurst:null, bursts:0, lastBurst:-1e9, onSec:0,
      ship:null,
      plot:{range:12},
      rx:{count:0, last:null, fixed:false, acked:false, alarm:false},   // what the rescue ship has received
      own:{alarm:false, acked:false, testSeen:false},
      sel:null,
      c:{on:null, fix:null, rx:null, ack:null, homing:null, close:null, rec:null},
      log:[], logDirty:true, stepsDirty:true, labelDirty:true,
      selfTests:0, testing:false, testUntil:0, testEndLogged:true, testBurstAt:0,
      flashUntil:0, passUntil:0, failUntil:0, txUntil:0,
      label:null, labelChecked:{bat:false, svc:false, type:false, kit:false}, reported:false,
      scenario:"free", steps:[], done:false,
      feedback:{text:"", kind:"info"}, feedbackDirty:true
    };
  }
  function makeLabel(expiredKey){
    var l = {
      bat:{name:"Battery expiry", d:addMonths(TODAY, 31), expired:false},
      svc:{name:"Annual check due", d:addMonths(TODAY, 7), expired:false},
      type:{name:"Type", text:"AIS-SART · MMSI " + MMSI_TXT, expired:false},
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
  function testActive(){ return now() < st.testUntil; }
  function plotView(){ return (testActive() || !st.ship) ? "own" : "rescue"; }
  function txRecent(){ return st.simT - st.lastBurst < 4 * BURST; }
  function inReach(){ return st.ship && shipDist() <= DET[st.loc]; }

  // ---------- scenarios ----------
  var SCEN = {
    free:{ name:"Free practice", brief:"Try anything: switch the AIS-SART on, run a self-test, take it into the liferaft, mount it on its pole, and watch the rescue ship's AIS display.",
      setup:function(){ st.ship = mkShip(-11, 4, 10); }, steps:[] },
    selftest:{
      name:"Monthly test",
      brief:"Do the routine check from the bridge. The AIS-SART stays in its bracket and you test it with the TEST button, watching your own AIS display.",
      setup:function(){ st.plot.range = 3; },
      steps:[
        {t:"Check the battery expiry date (Label tab)", ev:function(e){ return e.type==="label" && st.labelChecked.bat; }},
        {t:"Hold TEST for 1 second (not the ON switch)", ev:function(e){ return e.type==="selftest-start"; }},
        {t:"See SART TEST appear on your own AIS display", ev:function(e){ return e.type==="test-seen"; }},
        {t:"Record the test in the radio log (Log tab)", ev:function(e){ return e.type==="logged"; }}
      ],
      win:"Test done and logged. SART TEST on your own AIS shows the unit is transmitting. Keep tests short: ships nearby may see it too."
    },
    abandon:{
      name:"Abandon ship",
      brief:"You are abandoning ship into the liferaft and can take the AIS-SART with you. A rescue ship is searching a few miles away.",
      setup:function(){ st.ship = mkShip(-13, 4, 10); },
      steps:[
        {t:"Remove the AIS-SART from its bracket", ev:function(e){ return e.type==="loc" && e.loc==="hand"; }},
        {t:"Switch it ON: pull the safety tab first", ev:function(e){ return e.type==="switch" && e.pos==="ON"; }},
        {t:"Take it into the liferaft", ev:function(e){ return e.type==="loc" && e.loc==="raft"; }},
        {t:"Mount it on its pole, at least 1 m above the sea", ev:function(e){ return e.type==="loc" && e.loc==="pole"; }},
        {t:"GNSS light steady: it has a position fix", ev:function(e){ return e.type==="fix"; }},
        {t:"The rescue ship's AIS shows SART ACTIVE", ev:function(e){ return e.type==="received"; }},
        {t:"The rescue ship homes in and comes alongside", ev:function(e){ return e.type==="recovered"; }}
      ],
      win:"Rescued. On its pole the AIS-SART reached the rescue ship's AIS from about 8 nm, with an exact GNSS position. Inside the canopy or floating in the sea, that drops to 3–4 nm."
    },
    height:{
      name:"Get it higher",
      brief:"You're in the liferaft. The AIS-SART is on, but it is floating in the sea beside you, only a few centimetres above the water. A rescue ship is searching a few miles away.",
      setup:function(){ st.ship = mkShip(-6.5, 4, 10); st.loc = "water"; st.guardUp = true; switchOnNow(-120); },
      steps:[
        {t:"Lift the AIS-SART out of the water into the raft", ev:function(e){ return e.type==="loc" && e.loc==="raft"; }},
        {t:"Mount it on its pole, at least 1 m above the sea", ev:function(e){ return e.type==="loc" && e.loc==="pole"; }},
        {t:"The rescue ship's AIS shows SART ACTIVE", ev:function(e){ return e.type==="received"; }},
        {t:"The rescue ship homes in and comes alongside", ev:function(e){ return e.type==="recovered"; }}
      ],
      win:"Height made the difference. Floating, the AIS-SART only reached about 3 nm, so the ship would have passed by. On its pole it was received from about 8 nm."
    },
    search:{
      name:"On the rescue ship's AIS",
      brief:"You're on the bridge of the rescue ship, which has slowed down in the search area. An AIS alarm is sounding. Acknowledge it, find the target, check it really is an AIS-SART, and head for it.",
      setup:function(){
        st.ship = mkShip(-3.6, -3.2, 0, 0.9); st.loc = "pole"; st.guardUp = true; switchOnNow(-300);
        st.plot.range = 3;
      },
      steps:[
        {t:"Acknowledge the alarm (ACK)", ev:function(e){ return e.type==="ack"; }},
        {t:"Choose a range scale that shows the target (6 or 12 nm)", ev:function(e){ return e.type==="range" && st.plot.range >= 6; }},
        {t:"Tap the circle with a cross and check its MMSI starts with 970", ev:function(e){ return e.type==="select" && e.sart; }},
        {t:"Head for it and come alongside", ev:function(e){ return e.type==="recovered"; }}
      ],
      win:"Found. An MMSI starting 970 means an AIS-SART: survivors, not a ship. The AIS target gave you their GNSS position, so you could steer straight to it."
    },
    inspect:{
      name:"Pre-departure inspection",
      brief:"Check the AIS-SART's label before sailing (Label tab). One item is out of date. Find it and report it.",
      steps:[
        {t:"Check the battery expiry date", ev:function(e){ return e.type==="label" && e.k==="bat"; }},
        {t:"Check when the annual check is due", ev:function(e){ return e.type==="label" && e.k==="svc"; }},
        {t:"Check it is an AIS-SART (MMSI 970…)", ev:function(e){ return e.type==="label" && e.k==="type"; }},
        {t:"Check the pole and lanyard are with it", ev:function(e){ return e.type==="label" && e.k==="kit"; }},
        {t:"Report the out-of-date item", ev:function(e){ return e.type==="report"; }}
      ],
      win:"Don't rely on this AIS-SART until the item is sorted. An expired battery may not last the 96 hours, and an overdue check means nobody has confirmed it still works."
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

  // ---------- switching on, GNSS fix, bursts ----------
  function switchOnNow(ago){
    // used by scenarios that start with the SART already on (ago = seconds it has been on, negative)
    st.sw = "ON"; st.everOn = true; st.onAt = ago; st.c.on = 0;
    if (-ago >= FIX_AFTER){ st.fix = true; st.c.fix = 0; }
    st.nextBurst = 2;
  }
  function burst(){
    st.bursts++; st.lastBurst = st.simT; st.txUntil = now() + 650;
    beep(2200, 0.04);
    burstFx(null);
    if (onOwnVessel() && !testActive()){
      if (!st.own.alarm){ st.own.alarm = true; st.own.acked = false; beep(880, 0.4);
        addLog("Your own AIS display shows a SART ACTIVE alarm: the AIS-SART on board is transmitting. Ships nearby see a distress target too.", "warn"); }
    }
    if (st.ship && !st.ship.recovered && inReach()){
      burstFx("rescue");
      var r = st.rx, c = st.c, wasFixed = r.fixed;
      r.count++; r.last = st.simT;
      if (st.fix) r.fixed = true;
      if (c.rx == null){
        c.rx = st.simT; r.alarm = true; news("rescue"); beep(880, 0.5);
        addLog("Rescue ship's AIS received the burst at " + shipDist().toFixed(1) + " nm: alarm, SART ACTIVE, MMSI " + MMSI_TXT + (st.fix ? "." : ", position not available yet."), "alert");
        emit({type:"received"});
      } else if (r.fixed && !wasFixed){
        addLog("AIS-SART position received: the target is now plotted on the rescue ship's display.", "tx");
      }
      if (st.scenario !== "search" && r.count >= 2 && r.fixed){
        if (!r.acked) ackRescue(true);
        startHoming("bridge crew saw the SART ACTIVE target");
      }
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
      if (d < 1 && st.c.close == null){ st.c.close = st.simT; news("rescue"); addLog("Rescue ship within 1 nm of the AIS-SART. Lookouts searching for the liferaft.", "tx"); }
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
    var s = st.ship; if (!s || s.homing || s.recovered) return;
    s.homing = true; st.c.homing = st.simT; news("rescue");
    addLog("Rescue ship alters course for the AIS-SART" + (why ? " (" + why + ")" : "") + ": bearing " + deg(shipBearing()) + ", " + shipDist().toFixed(1) + " nm.", "alert");
    emit({type:"homing"});
  }
  function ackRescue(auto){
    var r = st.rx; if (!r.alarm || r.acked) return;
    r.acked = true; st.c.ack = st.simT;
    addLog(auto ? "Rescue ship's bridge acknowledges the AIS-SART alarm." : "Alarm acknowledged. The SART target stays on the display.", "info");
    if (!auto) say("Alarm silenced. Now find the target on the display.", "info");
    emit({type:"ack"});
  }

  // ---------- user actions ----------
  function setSwitch(pos){
    if (st.testing || pos === st.sw) return;
    if (pos === "ON" && !st.guardUp){ say("Pull the safety tab off first. It stops the AIS-SART being switched on by accident.", "warn"); return; }
    st.sw = pos;
    emit({type:"switch", pos:pos});
    if (pos === "ON"){
      st.everOn = true; st.onAt = st.simT; st.fix = false; st.nextBurst = st.simT + 20;
      if (st.c.on == null) st.c.on = st.simT; news("rescue");
      addLog("AIS-SART switched ON. GNSS searching for a position; first burst within a minute.", "alert");
      if (onOwnVessel()) say("On and transmitting. Take it into the liferaft and get it up on its pole.", "info");
      else say("On. It transmits by itself once a minute; no radar needed.", "info");
    } else {
      st.nextBurst = null; st.fix = false;
      addLog("AIS-SART switched OFF.", st.ship && st.ship.homing && !st.ship.recovered ? "warn" : "info");
      if (st.ship && st.ship.homing && !st.ship.recovered) say("Switched off while the ship is homing in. It can still head for the last position it received, but it gets no more updates.", "warn");
      else if (st.own.alarm) say("Switched off. Ships nearby will already have seen a SART ACTIVE alarm.", "warn");
      else say("", "info");
    }
  }
  function toggleGuard(){
    if (st.guardUp && st.sw === "ON"){ say("Switch it OFF before refitting the safety tab.", "warn"); return; }
    st.guardUp = !st.guardUp;
  }
  var LOC_SAY = {
    hand:"Out of the bracket.",
    raft:"Inside the canopy it sits low and the canopy is in the way: range drops to about 4 nm.",
    pole:"Up on its pole, at least 1 m above the sea: a ship's AIS can receive it from about 5–10 nm.",
    water:"Floating, it is only a few centimetres above the water. Waves block it and range drops to about 3 nm.",
    bracket:"Back in its bracket."
  };
  var LOC_LOG = {
    hand:"AIS-SART removed from its bracket.", bracket:"AIS-SART returned to its bracket.", raft:"AIS-SART taken into the liferaft.",
    pole:"AIS-SART mounted on its pole above the canopy.", water:"AIS-SART put in the sea, floating on its lanyard."
  };
  function moveTo(loc, logText){
    st.loc = loc;
    addLog(logText || LOC_LOG[loc], "info");
    say(LOC_SAY[loc] + (st.sw === "OFF" && loc !== "bracket" && loc !== "hand" ? " It is still switched OFF, though." : ""), loc === "water" || loc === "raft" ? "warn" : "info");
    emit({type:"loc", loc:loc});
  }
  function btnRemove(){ if (st.loc === "bracket") moveTo("hand"); else if (st.loc === "hand") moveTo("bracket"); }
  function btnRaft(){ if (st.loc === "hand") moveTo("raft"); else if (st.loc === "raft") moveTo("hand", "AIS-SART taken back on deck."); }
  function btnPole(){ if (st.loc === "raft") moveTo("pole"); else if (st.loc === "pole") moveTo("raft", "AIS-SART taken down off its pole."); }
  function btnWater(){ if (st.loc === "raft") moveTo("water"); else if (st.loc === "water") moveTo("raft", "AIS-SART lifted out of the sea into the raft."); }

  function setRange(v){
    v = +v; if (st.plot.range === v) return;
    st.plot.range = v;
    emit({type:"range", v:v});
  }
  function ack(){
    if (plotView() === "own"){ if (st.own.alarm && !st.own.acked){ st.own.acked = true; addLog("Own AIS alarm acknowledged.", "info"); } return; }
    ackRescue(false);
  }

  // ---------- tapping targets ----------
  function targets(){
    // everything drawn on the current display, in nm relative to the display centre
    var view = plotView(), list = [];
    var cx = view === "rescue" ? st.ship.x : 0, cy = view === "rescue" ? st.ship.y : 0;
    CONTACTS.forEach(function(k, i){ list.push({kind:"ship", i:i, x:k.x - cx, y:k.y - cy}); });
    var sartPlotted = view === "rescue" ? st.rx.fixed : (onOwnVessel() && ((testActive() && st.own.testSeen) || (st.sw === "ON" && st.own.alarm && st.fix)));
    if (sartPlotted){
      var off = view === "rescue" ? 0 : ownOff();
      list.push({kind:"sart", x:off - cx, y:off - cy});
    }
    return list;
  }
  function tapAt(fx, fy){
    var W = cv.clientWidth, c = W / 2, R = c * 0.94, rg = st.plot.range, best = null, bestPx = 1e9;
    targets().forEach(function(t){
      var r = Math.hypot(t.x, t.y); if (r > rg * 1.05) return;
      var px = c + t.x / rg * R, py = c - t.y / rg * R, dpx = Math.hypot(fx - px, fy - py);
      if (dpx < bestPx){ bestPx = dpx; best = t; }
    });
    if (!best || bestPx > 26){
      st.sel = null;
      if (plotView() === "rescue" && st.rx.alarm && !st.rx.fixed) say("The alarm is up, but no position yet: the SART is still waiting for its GNSS fix.", "info");
      else if (plotView() === "rescue" && st.rx.fixed && Math.hypot(st.ship.x, st.ship.y) > rg) say("Nothing there. The SART target is off this range scale: try a longer range.", "warn");
      else say("No target there. Tap right on a symbol.", "info");
      return;
    }
    st.sel = best.kind === "ship" ? {kind:"ship", i:best.i} : {kind:"sart"};
    if (best.kind === "ship"){
      var k = CONTACTS[best.i];
      say(k.name + " is a ship: its MMSI " + k.mmsi + " starts with a country code (" + (k.mmsi.indexOf("428") === 0 ? "428 = Israel" : "636 = Liberia") + "). An AIS-SART's MMSI starts with 970.", "info");
      emit({type:"select", sart:false});
    } else {
      if (plotView() === "rescue"){
        say("MMSI " + MMSI_TXT + ": starts with 970, so it's an AIS-SART. Survivors. Heading for it now.", "ok");
        addLog("AIS-SART target checked: MMSI " + MMSI_TXT + ", bearing " + deg(shipBearing()) + ", " + shipDist().toFixed(1) + " nm.", "ok");
        emit({type:"select", sart:true});
        if (st.scenario === "search" && !st.rx.acked){ say("Acknowledge the alarm first (ACK), then head for it.", "warn"); }
        else startHoming("you checked the target");
      } else {
        say(testActive() ? "SART TEST from your own AIS-SART: MMSI " + MMSI_TXT + "." : "That's your own AIS-SART, transmitting SART ACTIVE.", "info");
      }
    }
  }

  function recordLog(){
    var txt = st.selfTests ? "Radio log: AIS-SART tested with the TEST button, SART TEST seen on own AIS, result recorded." : st.everOn ? "Radio log: AIS-SART activated, details recorded." : "Radio log: AIS-SART checked.";
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
    addLog(k === "bat" ? "Reported: AIS-SART battery out of date, replacement ordered." : "Reported: AIS-SART annual check overdue, booked in.", "ok");
    emit({type:"report"});
  }

  // ---------- self-test ----------
  function selfTest(){
    if (st.sw === "ON"){ say("Switch the AIS-SART OFF before running a self-test.", "warn"); return; }
    if (st.testing) return;
    st.testing = true; st.own.testSeen = false;
    addLog("Self-test started: lights, battery and transmitter check.", "info");
    emit({type:"selftest-start"});
    st.flashUntil = now() + 500; beep(1200, 0.15);
    later(900, function(){
      st.testUntil = now() + 9000; st.testEndLogged = false; st.txUntil = now() + 650; burstFx(null);
      if (onOwnVessel() && !st.label.bat.expired){
        st.own.testSeen = true;
        addLog("Test burst sent: your own AIS display shows SART TEST, MMSI " + MMSI_TXT + ".", "tx");
        emit({type:"test-seen"});
      } else if (!onOwnVessel()) addLog("Test burst sent, but your own ship's AIS is out of reach here, so only the lights are checked.", "info");
    });
    later(2600, function(){
      var fail = st.label.bat.expired;
      st.testing = false; st.selfTests++;
      if (fail){ st.testUntil = 0; st.failUntil = now() + 3200; addLog("Self-test FAILED (red light): battery past its expiry date.", "warn"); beep(300, 0.5); say("Self-test failed. Don't rely on this AIS-SART until the battery is replaced.", "warn"); }
      else { st.passUntil = now() + 3200; addLog("Self-test PASSED.", "ok"); beep(1600, 0.1); later(220, function(){ beep(1600, 0.1); }); say("Self-test passed." + (onOwnVessel() ? " Look at your AIS display for SART TEST." : ""), "ok"); }
      emit({type:"selftest-result", pass:!fail});
    });
  }

  // ---------- scene fx ----------
  var SVGNS = "http://www.w3.org/2000/svg";
  var fxG = $("#as-fx"), ping = $("#as-ping");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function antPos(){
    var p = POSE[st.loc], t = p.r * Math.PI / 180;
    return {x:p.x + 12*Math.cos(t) - 1*Math.sin(t), y:p.y + 12*Math.sin(t) + 1*Math.cos(t)};
  }
  function shipPose(){
    var d = Math.min(shipDist(), 12), f = d / 12;
    return {x:305 + 100*f, s:0.25 + 0.75*(1 - f)*(1 - f)};
  }
  function burstFx(view){
    var a = antPos();
    if (view !== "rescue"){
      var c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", a.x); c.setAttribute("cy", a.y); c.setAttribute("r", 6); c.setAttribute("fill", "none");
      c.style.stroke = "var(--gold)"; c.setAttribute("stroke-width", 2);
      c.style.transformBox = "fill-box"; c.style.transformOrigin = "center";
      fxG.appendChild(c);
      if (c.animate && !reduceMotion){
        var an = c.animate([{transform:"scale(1)", opacity:1},{transform:"scale(6)", opacity:0}], {duration:1300, easing:"ease-out"});
        an.onfinish = function(){ c.remove(); };
      } else setTimeout(function(){ c.remove(); }, 700);
      return;
    }
    if (shipDist() > 12) return;
    var p = shipPose(), to = {x:p.x + 70*p.s, y:200 - 64*p.s};
    ping.setAttribute("x1", a.x); ping.setAttribute("y1", a.y); ping.setAttribute("x2", to.x); ping.setAttribute("y2", to.y);
    if (ping.animate && !reduceMotion) ping.animate([{opacity:0},{opacity:.95},{opacity:0}], {duration:900});
  }

  // ---------- AIS display ----------
  var cv = $("#as-plot"), ctx = cv.getContext("2d");
  var PD = {px:0, dpr:1};
  function sizePlot(){
    var w = cv.clientWidth || 300, dpr = Math.min(2, window.devicePixelRatio || 1), px = Math.max(120, Math.round(w * dpr));
    if (px !== PD.px){ PD.px = px; PD.dpr = dpr; cv.width = cv.height = px; }
  }
  function shipSym(x, y, hdg, d, col, fill, len){
    ctx.save(); ctx.translate(x, y); ctx.rotate(hdg);
    ctx.beginPath(); ctx.moveTo(0, -9*d); ctx.lineTo(6*d, 8*d); ctx.lineTo(0, 5*d); ctx.lineTo(-6*d, 8*d); ctx.closePath();
    ctx.lineJoin = "round"; ctx.lineWidth = 1.8*d; ctx.strokeStyle = col;
    if (fill){ ctx.fillStyle = fill; ctx.fill(); }
    ctx.stroke();
    if (len){ ctx.beginPath(); ctx.moveTo(0, -9*d); ctx.lineTo(0, -9*d - len); ctx.stroke(); }
    ctx.restore();
  }
  function sartSym(x, y, d, col, dashed){
    var r = 9*d, k = r * 0.71;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.4*d;
    if (dashed) ctx.setLineDash([4*d, 3*d]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x - k, y - k); ctx.lineTo(x + k, y + k); ctx.moveTo(x + k, y - k); ctx.lineTo(x - k, y + k); ctx.stroke();
    ctx.restore();
  }
  function selBox(x, y, d){
    var s = 14*d, l = 5*d;
    ctx.save(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.6*d; ctx.beginPath();
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(q){ ctx.moveTo(x + q[0]*s, y + q[1]*(s - l)); ctx.lineTo(x + q[0]*s, y + q[1]*s); ctx.lineTo(x + q[0]*(s - l), y + q[1]*s); });
    ctx.stroke(); ctx.restore();
  }
  function tag(text, x, y, d, col, below){
    // label beside a target; flips to the left when it would run off the screen
    var S = PD.px, wTxt = ctx.measureText(text).width, right = x + 12*d + wTxt < S * 0.95;
    ctx.fillStyle = col; ctx.textAlign = right ? "left" : "right";
    ctx.fillText(text, right ? x + 12*d : x - 12*d, y + (below ? 14*d : -10*d));
    ctx.textAlign = "left";
  }
  function ownOff(){ return st.plot.range * 0.07; }   // own AIS-SART drawn just off own ship, so the symbols don't overlap
  function drawPlot(w){
    sizePlot();
    var S = PD.px, c = S / 2, R = c * 0.94, d = PD.dpr, rg = st.plot.range, view = plotView();
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = "#0b2036"; ctx.fillRect(0, 0, S, S);
    // range rings and bearing ticks
    ctx.strokeStyle = "rgba(159,224,255,.18)"; ctx.lineWidth = d;
    for (var ri = 1; ri <= 3; ri++){ ctx.beginPath(); ctx.arc(c, c, R * ri / 3, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = "rgba(159,224,255,.35)";
    for (var dg = 0; dg < 360; dg += 10){
      var t = rad(dg), len = (dg % 30 ? 4 : 9) * d;
      ctx.beginPath(); ctx.moveTo(c + R*Math.sin(t), c - R*Math.cos(t)); ctx.lineTo(c + (R-len)*Math.sin(t), c - (R-len)*Math.cos(t)); ctx.stroke();
    }
    ctx.fillStyle = "rgba(159,224,255,.55)"; ctx.font = "700 " + (10*d) + "px Space Grotesk, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("N", c, c - R + 20*d);
    var cx = view === "rescue" ? st.ship.x : 0, cy = view === "rescue" ? st.ship.y : 0;
    function P(x, y){ return [c + (x - cx) / rg * R, c - (y - cy) / rg * R]; }
    function inside(x, y){ return Math.hypot(x - cx, y - cy) <= rg; }
    ctx.save(); ctx.beginPath(); ctx.arc(c, c, R, 0, TAU); ctx.clip();
    // ship targets
    ctx.textAlign = "left"; ctx.font = "600 " + (9.5*d) + "px Space Grotesk, sans-serif";
    CONTACTS.forEach(function(k, i){
      if (!inside(k.x, k.y)) return;
      var p = P(k.x, k.y);
      shipSym(p[0], p[1], rad(k.hdg), d, "#9fe0ff", null, 10*d);
      tag(k.name, p[0], p[1], d, "rgba(159,224,255,.75)", true);
      if (st.sel && st.sel.kind === "ship" && st.sel.i === i) selBox(p[0], p[1], d);
    });
    // the AIS-SART
    var blink = (w % 1000) < 750;
    if (view === "rescue" && st.rx.fixed && inside(0, 0)){
      var q = P(0, 0), stale = st.sw !== "ON" && st.simT - st.rx.last > 6 * BURST;
      if (blink || stale) sartSym(q[0], q[1], d, stale ? "#8a6a6a" : "#ff5a4a", false);
      ctx.font = "700 " + (9.5*d) + "px Space Grotesk, sans-serif";
      tag(stale ? "SART · LOST" : "SART ACTIVE", q[0], q[1], d, stale ? "#8a6a6a" : "#ff8a7a");
      if (st.sel && st.sel.kind === "sart") selBox(q[0], q[1], d);
    }
    if (view === "own" && onOwnVessel()){
      var o = P(ownOff(), ownOff());
      if (testActive() && st.own.testSeen){
        sartSym(o[0], o[1], d, "#ffc94d", true);
        ctx.font = "700 " + (9.5*d) + "px Space Grotesk, sans-serif"; tag("SART TEST", o[0], o[1], d, "#ffc94d");
        if (st.sel && st.sel.kind === "sart") selBox(o[0], o[1], d);
      } else if (st.sw === "ON" && st.own.alarm && st.fix){
        if (blink) sartSym(o[0], o[1], d, "#ff5a4a", false);
        ctx.font = "700 " + (9.5*d) + "px Space Grotesk, sans-serif"; tag("SART ACTIVE", o[0], o[1], d, "#ff8a7a");
      }
    }
    ctx.restore();
    // own ship (centre)
    var hd = view === "rescue" ? st.ship.hdg : 0;
    shipSym(c, c, hd, d, "#ffffff", "rgba(255,255,255,.18)", R * 0.18);
  }

  // ---------- static UI ----------
  var CHAIN = [
    {k:"on", n:"AIS-SART on", s:"Transmitting once a minute"},
    {k:"fix", n:"GNSS fix", s:"Its own position is in every burst"},
    {k:"rx", n:"Ship's AIS receives it", s:"Alarm: SART ACTIVE"},
    {k:"ack", n:"Alarm acknowledged", s:"Target checked: MMSI 970…"},
    {k:"homing", n:"Ship alters course", s:"Steers for the target"},
    {k:"close", n:"Within 1 nm", s:"Lookouts search for the raft"},
    {k:"rec", n:"Alongside", s:"Survivors recovered"}
  ];
  $("#as-chain").innerHTML = CHAIN.map(function(c){ return '<li data-k="'+c.k+'"><div><b>'+c.n+'</b><span>'+c.s+'</span></div><em>—</em></li>'; }).join("");
  var chainLis = {}; $$("#as-chain li").forEach(function(li){ chainLis[li.dataset.k] = li; });

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
    $("#as-sc-h").textContent = sc.name;
    $("#as-brief").textContent = sc.brief;
    addLog("Scenario: " + sc.name + ".", "info");
    if (sc.setup) sc.setup();
    if (key === "height") addLog("AIS-SART is on, floating in the sea on its lanyard.", "warn");
    say(key === "search" || key === "height" ? sc.brief : "", "info");
    $$(".es-tab").forEach(function(b){ b.classList.remove("has-news"); });
    selectTab(key === "inspect" ? "label" : "steps");
    lastSartT = ""; picKey = ""; targetKey = "";
    renderAll();
  }

  // ---------- rendering ----------
  var el = {
    svg:$("#as-svg"), sart:$("#as-sart"), rship:$("#as-rship"), shipT:$("#as-ship-t"), lamp:$("#as-lamp"), flash:$("#as-flash"),
    heightT:$("#as-height-t"), locT:$("#as-loc-t"),
    btnRemove:$("#as-btn-remove"), btnRaft:$("#as-btn-raft"), btnPole:$("#as-btn-pole"), btnWater:$("#as-btn-water"),
    feedback:$("#as-feedback"), knob:$("#as-knob"), guard:$("#as-guard"), guardClose:$("#as-guard-close"), swHelp:$("#as-sw-help"),
    lGnss:$("#as-l-gnss"), lTx:$("#as-l-tx"), lPass:$("#as-l-pass"), lFault:$("#as-l-fault"),
    mode:$("#as-mode"), clock:$("#as-clock"), stripShip:$("#as-strip-ship"),
    rBursts:$("#as-r-bursts"), rShip:$("#as-r-ship"), rDet:$("#as-r-det"), rBatt:$("#as-r-batt"),
    rLoc:$("#as-r-loc"), rHeight:$("#as-r-height"), rMode:$("#as-r-mode"), rGnss:$("#as-r-gnss"), rTests:$("#as-r-tests"),
    chainNote:$("#as-chain-note"), pic:$("#as-pic"), steps:$("#as-steps"), banner:$("#as-banner"),
    labelRows:$("#as-label-rows"), reportWrap:$("#as-report-wrap"), log:$("#as-log"),
    radarH:$("#as-radar-h"), radarSub:$("#as-radar-sub"), radarHdg:$("#as-radar-hdg"),
    tagRange:$("#as-tag-range"), tagRings:$("#as-tag-rings"), tagMark:$("#as-tag-mark"), hint:$("#as-hint"),
    alarm:$("#as-alarm"), alarmT:$("#as-alarm-t"), ackBtn:$("#as-ack"), target:$("#as-target")
  };
  var lastSartT = "", lastText = 0, picKey = "", targetKey = "";
  function setText(node, t){ if (node.textContent !== t) node.textContent = t; }

  function lights(w){
    var lampTest = w < st.flashUntil;
    var on = st.sw === "ON" || st.testing || testActive();
    var gnss = lampTest || (on && (st.fix || testActive() ? true : (w % 500) < 250));
    var tx = lampTest || w < st.txUntil;
    var pass = lampTest || (w < st.passUntil && (w % 500) < 280);
    var fault = lampTest || (w < st.failUntil && (w % 500) < 280);
    return {gnss:gnss, tx:tx, pass:pass, fault:fault};
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
    var col = L.fault && w < st.failUntil ? "#ff5a4a" : L.tx ? "#ffb84d" : L.pass && w < st.passUntil ? "#ffffff" : L.gnss ? "#5df08f" : (w < st.flashUntil ? "#ffffff" : "#152027");
    el.lamp.setAttribute("fill", col);
    el.flash.setAttribute("opacity", L.tx ? 1 : 0);
    el.lGnss.classList.toggle("on", L.gnss);
    el.lTx.classList.toggle("on", L.tx);
    el.lPass.classList.toggle("on", L.pass);
    el.lFault.classList.toggle("on", L.fault);
  }

  function renderControls(){
    $$("#as-switch .es-pos").forEach(function(b){ b.setAttribute("aria-checked", b.dataset.pos === st.sw ? "true" : "false"); });
    el.knob.style.transform = "translateX(" + (st.sw === "ON" ? 100 : 0) + "%)";
    el.guard.classList.toggle("up", st.guardUp);
    el.guard.setAttribute("aria-hidden", st.guardUp ? "true" : "false");
    el.guard.tabIndex = st.guardUp ? -1 : 0;
    el.guardClose.hidden = !st.guardUp;
    setText(el.swHelp, st.sw === "OFF" ? "OFF: the AIS-SART is not transmitting." : st.fix ? "ON: transmitting SART ACTIVE with its position, once a minute." : "ON: transmitting, GNSS still searching for a position.");
    var deck = onOwnVessel();
    setText(el.btnRemove, st.loc === "hand" ? "Return to bracket" : "Remove from bracket");
    el.btnRemove.disabled = !deck;
    setText(el.btnRaft, st.loc === "raft" ? "Back on deck" : "Take into liferaft");
    el.btnRaft.disabled = !(st.loc === "hand" || st.loc === "raft");
    setText(el.btnPole, st.loc === "pole" ? "Take off pole" : "Mount on pole");
    el.btnPole.disabled = !(st.loc === "raft" || st.loc === "pole");
    setText(el.btnWater, st.loc === "water" ? "Lift into raft" : "Into the water");
    el.btnWater.disabled = !(st.loc === "raft" || st.loc === "water");
    $$(".as-rctl .es-seg button").forEach(function(b){ b.setAttribute("aria-pressed", String(String(st.plot.range) === b.dataset.v)); });
  }

  function targetRows(){
    var view = plotView();
    if (!st.sel) return null;
    if (st.sel.kind === "ship"){
      var k = CONTACTS[st.sel.i], cx = view === "rescue" ? st.ship.x : 0, cy = view === "rescue" ? st.ship.y : 0;
      var dx = k.x - cx, dy = k.y - cy;
      return {sart:false, h:k.name, rows:[["MMSI", k.mmsi], ["Type", k.type], ["Course / speed", pad3(k.hdg) + "° / " + k.sog + " kn"], ["Bearing / range", deg(Math.atan2(dx, dy)) + " / " + Math.hypot(dx, dy).toFixed(1) + " nm"]]};
    }
    if (view === "rescue") return {sart:true, h:"SART ACTIVE", rows:[["MMSI", MMSI_TXT + " (970 = AIS-SART)"], ["Nav status", "14 · AIS-SART active"], ["Position", latLon(0, 0)], ["Bearing / range", deg(shipBearing()) + " / " + shipDist().toFixed(1) + " nm"]]};
    return {sart:true, h:testActive() ? "SART TEST" : "SART ACTIVE", rows:[["MMSI", MMSI_TXT + " (your own unit)"], ["Position", latLon(0, 0)]]};
  }

  function renderStatus(){
    var mode, s;
    if (st.testing || testActive()){ mode = "Test"; s = "test"; }
    else if (st.sw === "ON" && st.fix){ mode = "Transmitting"; s = "tx"; }
    else if (st.sw === "ON"){ mode = "GNSS search"; s = "armed"; }
    else { mode = "Off"; s = "off"; }
    setText(el.mode, mode); el.mode.dataset.s = s;
    setText(el.clock, "T+" + fmtT(st.simT) + (st.paused ? " ❚❚" : ""));
    var d = shipDist();
    setText(el.stripShip, d == null ? "—" : st.ship.recovered ? "alongside" : d.toFixed(1) + " nm");
    setText(el.rBursts, String(st.bursts));
    setText(el.rShip, d == null ? "None" : st.ship.recovered ? "Alongside" : d.toFixed(1) + " nm");
    setText(el.rDet, "~" + DET[st.loc] + " nm");
    var used = st.onSec / (96*3600);
    setText(el.rBatt, st.label.bat.expired ? "Expired" : Math.max(0, 100 - used*100).toFixed(used > 0.005 ? 1 : 0) + "%");
    setText(el.rLoc, LOC_NAMES[st.loc]);
    setText(el.rHeight, HEIGHT[st.loc]);
    setText(el.rMode, mode === "Transmitting" ? "SART ACTIVE, once a minute" : mode === "Test" ? "SART TEST" : mode === "GNSS search" ? "On, no position yet" : "Off");
    setText(el.rGnss, st.sw === "ON" ? (st.fix ? latLon(0, 0) : "Searching…") : "—");
    setText(el.rTests, String(st.selfTests));

    // rescue chain
    var c = st.c;
    CHAIN.forEach(function(item){
      var li = chainLis[item.k], t = c[item.k], cls = t != null ? (item.k === "rec" ? "stood" : item.k === "rx" ? "alert" : "on") : "";
      if (li.className !== cls) li.className = cls;
      setText(li.querySelector("em"), t != null ? "T+" + fmtT(t) : "—");
    });
    var view = plotView(), note;
    if (!st.ship) note = st.sw === "ON" ? "No rescue ship in this scenario. Your own AIS shows the AIS-SART on board as SART ACTIVE." : "No rescue ship in this scenario.";
    else if (st.ship.recovered) note = "Rescue ship alongside. Survivors recovered.";
    else if (st.sw !== "ON") note = st.everOn ? "The AIS-SART is off, so the rescue ship gets no more position updates." : "The AIS-SART is off. Nothing on any AIS display yet.";
    else if (d > DET[st.loc]) note = "Rescue ship " + d.toFixed(1) + " nm away, out of reach. From " + LOC_NAMES[st.loc].toLowerCase() + " the AIS-SART reaches about " + DET[st.loc] + " nm.";
    else if (!st.rx.count) note = "Rescue ship in reach. Waiting for the next burst (once a minute).";
    else if (!st.rx.fixed) note = "The rescue ship has the alarm, but no position yet: the AIS-SART is still getting its GNSS fix.";
    else if (st.ship.homing) note = "Rescue ship steering for the AIS-SART target, " + d.toFixed(1) + " nm to go.";
    else note = "The rescue ship's AIS is showing SART ACTIVE.";
    setText(el.chainNote, note);
    var g = view === "own" ? (testActive() && st.own.testSeen ? "test" : st.own.alarm && st.sw === "ON" ? "active" : "") : (st.rx.fixed ? "active" : "");
    if (st.sel && st.sel.kind === "ship") g = "ship";
    $$("#as-guide div").forEach(function(x){ x.classList.toggle("on", x.dataset.g === g); });
    var hide = st.scenario === "search" && !(st.sel && st.sel.kind === "sart") && !st.ship.homing;
    var key = [view, st.rx.count, st.rx.fixed, d == null ? "" : d.toFixed(1), hide, st.sw].join("|");
    if (key !== picKey){
      picKey = key;
      var rows;
      if (view !== "rescue") rows = [["Display", "Your own ship"], ["Shows", testActive() && st.own.testSeen ? "SART TEST" : st.own.alarm && st.sw === "ON" ? "SART ACTIVE (your own unit)" : "Nothing"], ["MMSI", MMSI_TXT]];
      else if (!st.rx.count) rows = [["Received", "Nothing yet"], ["MMSI", "—"]];
      else rows = [
        ["Message", "SART ACTIVE"],
        ["MMSI", MMSI_TXT],
        ["Position", st.rx.fixed ? latLon(0, 0) : "Not available yet"],
        ["Bearing from ship", !st.rx.fixed ? "—" : hide ? "Tap the target first" : deg(shipBearing())],
        ["Range", !st.rx.fixed ? "—" : hide ? "Tap the target first" : d.toFixed(1) + " nm"],
        ["Bursts received", String(st.rx.count)]
      ];
      el.pic.innerHTML = '<dl class="es-msg">' + rows.map(function(r){ return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join("") + '</dl>' +
        '<p class="es-small">Unlike a radar SART, an AIS-SART sends its own GNSS position, so the rescue ship can steer straight for it.</p>';
    }

    // display header, alarm and selected target
    setText(el.radarH, view === "rescue" ? "Rescue ship's AIS display" : testActive() ? "Your own AIS display · test" : "Your own AIS display");
    setText(el.radarSub, view === "rescue" ? "North up · " + (st.ship.recovered ? "stopped" : shipSpeed().toFixed(0) + " kn") : "North up · own ship at centre");
    setText(el.radarHdg, "HDG " + deg(view === "rescue" ? st.ship.hdg : 0));
    setText(el.tagRange, st.plot.range + " NM");
    setText(el.tagRings, "RINGS " + (st.plot.range / 3) + " NM");
    setText(el.tagMark, view === "rescue" ? "TAP = INFO" : "OWN SHIP");
    var al = view === "rescue" ? (st.rx.alarm ? {on:true, acked:st.rx.acked} : null) : (st.own.alarm && st.sw === "ON" && !testActive() ? {on:true, acked:st.own.acked} : null);
    el.alarm.hidden = !al;
    if (al){
      el.alarm.classList.toggle("blink", !al.acked); el.alarm.classList.toggle("acked", al.acked);
      var sub = view === "rescue" && !st.rx.fixed ? "MMSI " + MMSI_TXT + " · position not available" : "MMSI " + MMSI_TXT;
      el.alarmT.innerHTML = "⚠ AIS-SART ACTIVE<small>" + sub + "</small>";
      el.ackBtn.disabled = al.acked; setText(el.ackBtn, al.acked ? "ACKED" : "ACK");
    }
    var tr = targetRows(), tk = tr ? JSON.stringify(tr) : "";
    if (tk !== targetKey){
      targetKey = tk; el.target.hidden = !tr;
      if (tr){ el.target.classList.toggle("is-sart", tr.sart); el.target.innerHTML = '<h3>' + tr.h + '</h3><dl class="es-msg">' + tr.rows.map(function(r){ return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join("") + '</dl>'; }
    }
    setText(el.hint, view === "rescue" ? (st.ship.homing ? "Heading for the AIS-SART target." : "Tap a target to see its details.") : "Your own ship is at the centre. Your own AIS-SART shows right next to it.");
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
      el.reportWrap.innerHTML = st.reported ? '<span class="es-tag ok">Reported</span>' : '<button type="button" class="btn" id="as-report">Report it</button>';
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
    $$("#as-speed button").forEach(function(b){
      var v = b.dataset.v;
      b.setAttribute("aria-pressed", v === "pause" ? String(st.paused) : String(!st.paused && +v === st.speed));
    });
    var pb = $("#as-pause"); pb.textContent = st.paused ? "▶" : "❚❚"; pb.setAttribute("aria-label", st.paused ? "Resume" : "Pause");
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
      if (st.sw === "ON"){
        st.onSec += sd;
        if (!st.fix && st.simT - st.onAt >= FIX_AFTER){
          st.fix = true; if (st.c.fix == null) st.c.fix = st.simT; news("rescue");
          addLog("GNSS fix: " + latLon(0, 0) + ". Every burst now carries the position.", "tx");
          emit({type:"fix"});
        }
        if (st.nextBurst != null && st.simT >= st.nextBurst){ st.nextBurst += BURST; if (st.nextBurst < st.simT) st.nextBurst = st.simT + BURST; burst(); }
      }
      updateShip(sd);
    }
    if (st.testUntil && !testActive() && !st.testEndLogged){ st.testEndLogged = true; addLog("Test mode ended. Keep tests short: ships nearby may see SART TEST too.", "info"); }
    drawPlot(w);
    renderScene(w);
    if (w - lastText > 120){ lastText = w; renderControls(); renderStatus(); }
    renderSteps(); renderLabel(); renderLog(); renderFeedback();
    requestAnimationFrame(frame);
  }

  // ---------- wiring ----------
  $("#as-scenario").addEventListener("change", function(e){ loadScenario(e.target.value); });
  $$("#as-speed button").forEach(function(b){
    b.addEventListener("click", function(){
      if (b.dataset.v === "pause") st.paused = !st.paused; else { st.speed = +b.dataset.v; st.paused = false; }
      renderSpeed(); renderStatus();
    });
  });
  $("#as-sound").addEventListener("click", function(e){
    soundOn = !soundOn;
    if (soundOn && !actx){ try{ actx = new (window.AudioContext || window.webkitAudioContext)(); }catch(err){ soundOn = false; } }
    if (actx && actx.state === "suspended") actx.resume();
    e.currentTarget.setAttribute("aria-pressed", String(soundOn));
    e.currentTarget.textContent = soundOn ? "Sound on" : "Sound off";
    if (soundOn) beep(1200, 0.08);
  });
  $$(".es-tab").forEach(function(b){ b.addEventListener("click", function(){ selectTab(b.dataset.tab); }); });
  $("#as-up").addEventListener("click", function(){ $("#as-device").scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block:"start"}); });
  $$("#as-switch .es-pos").forEach(function(b){ b.addEventListener("click", function(){ setSwitch(b.dataset.pos); renderControls(); renderStatus(); }); });
  el.guard.addEventListener("click", function(){ toggleGuard(); renderControls(); });
  el.guardClose.addEventListener("click", function(){ toggleGuard(); renderControls(); });
  el.btnRemove.addEventListener("click", function(){ btnRemove(); renderControls(); });
  el.btnRaft.addEventListener("click", function(){ btnRaft(); renderControls(); });
  el.btnPole.addEventListener("click", function(){ btnPole(); renderControls(); });
  el.btnWater.addEventListener("click", function(){ btnWater(); renderControls(); });
  $("#as-btn-reset").addEventListener("click", function(){ loadScenario(st.scenario); });
  $("#as-record").addEventListener("click", recordLog);
  el.ackBtn.addEventListener("click", function(){ ack(); renderStatus(); });
  el.labelRows.addEventListener("click", function(e){ var b = e.target.closest(".es-lrow"); if (b) checkLabel(b.dataset.k); });
  el.reportWrap.addEventListener("click", function(e){ if (e.target.closest("#as-report")) report(); });
  $$(".as-rctl .es-seg").forEach(function(g){
    g.addEventListener("click", function(e){ var b = e.target.closest("button"); if (b){ setRange(b.dataset.v); renderControls(); renderStatus(); } });
  });
  cv.addEventListener("click", function(e){ var r = cv.getBoundingClientRect(); tapAt(e.clientX - r.left, e.clientY - r.top); renderStatus(); });

  var testBtn = $("#as-test"), hold1 = null, started = false, holding = false;
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
