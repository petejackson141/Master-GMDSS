/* AIS explainer: an example AIS display. Not a simulator: the targets just drift so it looks alive,
   and tapping one shows what that vessel is sending. One file, run once when the page loads. */
(function(){
  "use strict";
  var cv = document.getElementById("plot");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  var TAU = Math.PI * 2, TIME = 20;              // 1 real second = 20 seconds on the display
  var OWN = {cog:0, sog:10};
  function rad(d){ return d * Math.PI / 180; }
  function pad3(n){ return String(Math.round(n) % 360).padStart(3, "0"); }
  function wrapA(a){ a %= TAU; return a < 0 ? a + TAU : a; }
  function vel(cog, sog){ return {x:Math.sin(rad(cog)) * sog, y:Math.cos(rad(cog)) * sog}; }
  var ownV = vel(OWN.cog, OWN.sog);

  // x = nm east of own ship, y = nm north
  var T = [
    {kind:"ship", name:"MV CARMEL STAR", mmsi:"428 765 210", call:"4XCS2", cls:"A", type:"Cargo ship", status:"Under way using engine", cog:200, sog:12, dest:"HAIFA", eta:"18:30", x:4.5, y:7.5,
      why:"A normal Class A target. Its MMSI starts 428, so it's an Israeli ship."},
    {kind:"ship", name:"MT NEGEV BAY", mmsi:"636 092 118", call:"D5NB7", cls:"A", type:"Tanker", status:"Under way using engine", cog:290, sog:13, dest:"PORT SAID", eta:"21:00", x:5.5, y:2.9,
      why:"Dangerous target: on its present course it passes very close to you. The display turns it red and sounds an alarm. MMSI 636 = Liberia."},
    {kind:"ship", name:"SY MERAV", mmsi:"428 001 234", call:"4X9876", cls:"B", type:"Sailing yacht", status:"Under way sailing", cog:160, sog:6, dest:"HERZLIYA", eta:"17:00", x:-4.5, y:5.2,
      why:"A Class B yacht: lower power (2–5 W), so you only pick it up within about 10–15 NM, and it reports less often."},
    {kind:"ship", name:"FV GALIL", mmsi:"428 330 917", call:"4XGL5", cls:"A", type:"Fishing vessel", status:"Engaged in fishing", cog:75, sog:4, dest:"—", eta:"—", x:-7.5, y:-2.5,
      why:"The navigation status tells you what it's doing: engaged in fishing, so keep clear of its gear."},
    {kind:"ship", name:"MV SHIKMONA", mmsi:"428 220 541", call:"4XSH1", cls:"A", type:"Cargo ship", status:"At anchor", cog:0, sog:0, dest:"HAIFA", eta:"—", x:-3, y:9.5,
      why:"At anchor: no course line, and it only reports every 3 minutes."},
    {kind:"lost", name:"FV DAG", mmsi:"428 330 402", call:"4XDG3", cls:"B", type:"Fishing vessel", status:"Unknown", cog:300, sog:5, dest:"—", eta:"—", x:8.5, y:-1.5,
      why:"Lost target: no report for several minutes. Its AIS may be switched off or out of range. The boat may still be there: keep a lookout."},
    {kind:"sart", name:"SART ACTIVE", mmsi:"970 721 234", status:"14 · AIS-SART active", cog:0, sog:0, x:-6, y:-6,
      why:"MMSI 970 = AIS-SART: a liferaft with survivors. This is a distress alarm.", link:"../ais-sart/", linkTxt:"See it in the AIS-SART Simulator ›"},
    {kind:"epirb", name:"EPIRB ACTIVE", mmsi:"974 721 234", status:"14 · active distress", cog:0, sog:0, x:2.5, y:-6.5,
      why:"MMSI 974 = AIS-EPIRB: a vessel in distress. Its 406 MHz signal has also gone to the rescue centre by satellite.", link:"../ais-epirb/", linkTxt:"See it in the AIS-EPIRB Simulator ›"}
  ];
  T.forEach(function(t){ t.x0 = t.x; t.y0 = t.y; t.v = vel(t.cog, t.sog); });

  var range = 12, sel = null, PD = {px:0, dpr:1};
  function rel(t){ return {x:t.v.x - ownV.x, y:t.v.y - ownV.y}; }
  function cpa(t){
    var v = rel(t), vv = v.x*v.x + v.y*v.y;
    if (vv < 1e-6) return {d:Math.hypot(t.x, t.y), t:0};
    var tc = -(t.x*v.x + t.y*v.y) / vv;
    if (tc < 0) return {d:Math.hypot(t.x, t.y), t:tc};
    return {d:Math.hypot(t.x + v.x*tc, t.y + v.y*tc), t:tc};
  }
  function danger(t){ if (t.kind !== "ship") return false; var c = cpa(t); return c.d < 1 && c.t > 0 && c.t < 0.5; }
  function bearing(t){ return wrapA(Math.atan2(t.x, t.y)); }

  function shipSym(x, y, hdg, d, col, w, len){
    ctx.save(); ctx.translate(x, y); ctx.rotate(hdg);
    ctx.beginPath(); ctx.moveTo(0, -9*d); ctx.lineTo(6*d, 8*d); ctx.lineTo(0, 5*d); ctx.lineTo(-6*d, 8*d); ctx.closePath();
    ctx.lineJoin = "round"; ctx.lineWidth = w*d; ctx.strokeStyle = col; ctx.stroke();
    if (len){ ctx.beginPath(); ctx.moveTo(0, -9*d); ctx.lineTo(0, -9*d - len); ctx.stroke(); }
    ctx.restore();
  }
  function crossSym(x, y, d, col){
    var r = 9*d, k = r * 0.71;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.4*d;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - k, y - k); ctx.lineTo(x + k, y + k); ctx.moveTo(x + k, y - k); ctx.lineTo(x - k, y + k); ctx.stroke();
    ctx.restore();
  }
  function tag(text, x, y, d, col, below){
    // flips to the left when it would run past the edge of the round screen at that height
    var c = PD.px / 2, R = c * 0.94, dy = Math.min(R, Math.abs(y - c)), edge = c + Math.sqrt(R*R - dy*dy) - 6*d;
    var wTxt = ctx.measureText(text).width, right = x + 12*d + wTxt < edge;
    ctx.fillStyle = col; ctx.textAlign = right ? "left" : "right";
    ctx.fillText(text, right ? x + 12*d : x - 12*d, y + (below ? 14*d : -10*d));
    ctx.textAlign = "left";
  }
  function selBox(x, y, d){
    var s = 14*d, l = 5*d;
    ctx.save(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.6*d; ctx.beginPath();
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(q){ ctx.moveTo(x + q[0]*s, y + q[1]*(s - l)); ctx.lineTo(x + q[0]*s, y + q[1]*s); ctx.lineTo(x + q[0]*(s - l), y + q[1]*s); });
    ctx.stroke(); ctx.restore();
  }

  function draw(w){
    var cw = cv.clientWidth || 300, dpr = Math.min(2, window.devicePixelRatio || 1), px = Math.max(120, Math.round(cw * dpr));
    if (px !== PD.px){ PD.px = px; PD.dpr = dpr; cv.width = cv.height = px; }
    var S = PD.px, c = S / 2, R = c * 0.94, d = PD.dpr;
    ctx.fillStyle = "#0b2036"; ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = "rgba(159,224,255,.18)"; ctx.lineWidth = d;
    for (var ri = 1; ri <= 3; ri++){ ctx.beginPath(); ctx.arc(c, c, R * ri / 3, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = "rgba(159,224,255,.35)";
    for (var dg = 0; dg < 360; dg += 10){
      var a = rad(dg), len = (dg % 30 ? 4 : 9) * d;
      ctx.beginPath(); ctx.moveTo(c + R*Math.sin(a), c - R*Math.cos(a)); ctx.lineTo(c + (R-len)*Math.sin(a), c - (R-len)*Math.cos(a)); ctx.stroke();
    }
    ctx.fillStyle = "rgba(159,224,255,.55)"; ctx.font = "700 " + (10*d) + "px Space Grotesk, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("N", c, c - R + 20*d); ctx.textAlign = "left";
    ctx.save(); ctx.beginPath(); ctx.arc(c, c, R, 0, TAU); ctx.clip();
    var blink = (w % 1000) < 750;
    T.forEach(function(t){
      if (Math.hypot(t.x, t.y) > range * 1.02) return;
      var x = c + t.x / range * R, y = c - t.y / range * R;
      ctx.font = "600 " + (9.5*d) + "px Space Grotesk, sans-serif";
      if (t.kind === "sart" || t.kind === "epirb"){
        if (blink) crossSym(x, y, d, "#ff5a4a");
        ctx.font = "700 " + (9.5*d) + "px Space Grotesk, sans-serif"; tag(t.name, x, y, d, "#ff8a7a");
      } else if (t.kind === "lost"){
        shipSym(x, y, rad(t.cog), d, "#7d93a6", 1.6, 0);
        ctx.strokeStyle = "#7d93a6"; ctx.lineWidth = 1.6*d; ctx.beginPath(); ctx.moveTo(x - 10*d, y + 10*d); ctx.lineTo(x + 10*d, y - 10*d); ctx.stroke();
        tag(t.name, x, y, d, "rgba(125,147,166,.9)", true);
      } else {
        var dang = danger(t), col = dang ? "#ff5a4a" : "#9fe0ff";
        var vec = t.sog ? t.sog / 60 * 6 / range * R : 0;          // 6-minute course and speed line
        if (!dang || blink) shipSym(x, y, rad(t.cog), d, col, dang ? 2.6 : 1.8, vec);
        tag(t.name, x, y, d, dang ? "#ff8a7a" : "rgba(159,224,255,.75)", true);
      }
      if (sel === t) selBox(x, y, d);
    });
    ctx.restore();
    shipSym(c, c, 0, d, "#ffffff", 1.8, OWN.sog / 60 * 6 / range * R);
  }

  // ---------- target details ----------
  var box = document.getElementById("target"), boxKey = "";
  function row(k, v){ return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }
  function showTarget(){
    if (!sel){ if (boxKey !== "none"){ boxKey = "none"; box.className = "target"; box.innerHTML = '<p class="empty">Tap a target on the display to see what it sends.</p>'; } return; }
    var t = sel, r = Math.hypot(t.x, t.y), c = cpa(t), html, cls = "target";
    var brg = pad3(bearing(t) * 180 / Math.PI) + "° / " + r.toFixed(1) + " nm";
    if (t.kind === "sart" || t.kind === "epirb"){
      cls += " distress";
      html = '<h3>' + t.name + '</h3><p class="kind">' + (t.kind === "sart" ? "AIS-SART" : "AIS-EPIRB") + ' · distress</p><dl class="kv">' +
        row("MMSI", t.mmsi) + row("Nav status", t.status) + row("Bearing / range", brg) + '</dl>' +
        '<p class="why">' + t.why + '</p><a href="' + t.link + '">' + t.linkTxt + '</a>';
    } else {
      var dang = danger(t); if (dang) cls += " danger";
      var cpaTxt = c.t > 0 ? c.d.toFixed(1) + " nm in " + Math.round(c.t * 60) + " min" : "Opening (moving away)";
      html = '<h3>' + t.name + '</h3><p class="kind">' + t.type + ' · Class ' + t.cls + (t.kind === "lost" ? ' · LOST' : dang ? ' · DANGEROUS' : '') + '</p><dl class="kv">' +
        row("MMSI", t.mmsi) + row("Call sign", t.call) + row("Nav status", t.status) +
        row("COG / SOG", t.sog ? pad3(t.cog) + "° / " + t.sog + " kn" : "— / 0 kn") +
        row("Destination / ETA", t.dest + (t.eta !== "—" ? " · " + t.eta : "")) +
        row("Bearing / range", brg) + row("CPA / TCPA", t.kind === "lost" ? "—" : cpaTxt) + '</dl>' +
        '<p class="why">' + t.why + '</p>';
    }
    var key = html;
    if (key !== boxKey){ boxKey = key; box.className = cls; box.innerHTML = html; }
  }

  // ---------- tapping and range ----------
  cv.addEventListener("click", function(e){
    var b = cv.getBoundingClientRect(), fx = e.clientX - b.left, fy = e.clientY - b.top;
    var c = b.width / 2, R = c * 0.94, best = null, bd = 1e9;
    T.forEach(function(t){
      if (Math.hypot(t.x, t.y) > range * 1.02) return;
      var dd = Math.hypot(fx - (c + t.x / range * R), fy - (c - t.y / range * R));
      if (dd < bd){ bd = dd; best = t; }
    });
    sel = best && bd < 26 ? best : null; boxKey = ""; showTarget();
  });
  var rangeBtns = Array.prototype.slice.call(document.querySelectorAll("#range button"));
  rangeBtns.forEach(function(btn){ btn.addEventListener("click", function(){
    range = +btn.dataset.v;
    rangeBtns.forEach(function(x){ x.setAttribute("aria-pressed", String(x === btn)); });
    document.getElementById("tag-range").textContent = range + " NM";
    document.getElementById("tag-rings").textContent = "RINGS " + (range / 3) + " NM";
  }); });

  // ---------- loop: targets drift relative to own ship ----------
  var last = performance.now(), lastBox = 0;
  function frame(w){
    var dt = Math.min(0.5, (w - last) / 1000); last = w;
    var h = dt * TIME / 3600;
    T.forEach(function(t){
      var v = rel(t); t.x += v.x * h; t.y += v.y * h;
      if (Math.hypot(t.x, t.y) > 13){ t.x = t.x0; t.y = t.y0; }
    });
    draw(w);
    if (w - lastBox > 250){ lastBox = w; showTarget(); }
    requestAnimationFrame(frame);
  }
  showTarget();
  requestAnimationFrame(frame);
})();
