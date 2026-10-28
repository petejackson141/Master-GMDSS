/* NAVTEX simulator: Instruction book (translated from the course's Hebrew operating instructions) and the station map */

const DOCS = (() => {
  const book = `
<h2>NAVTEX: operating instructions</h2>
<h3>1. Switching on</h3><ul><li>Press <b>Power</b>. The start screen shows the frequency, dimmer and alarm.</li></ul>
<h3>2. Choosing the receive frequency</h3><ul><li>Press <b>FRQ</b>, pick the frequency with the arrows, press <b>ENTER</b>.</li>
<li>518 kHz: English, international. 490 kHz: local language, national. 4209.5 kHz: tropical zone, international.</li></ul>
<h3>3. Screen dimmer</h3><ul><li>Press <b>DIM</b> to dim the screen. There are 3 brightness levels.</li></ul>
<h3>4. Reading messages (DISPLAY)</h3><ul><li>Press <b>DISPL</b>: the list of message codes stored in memory appears (up to 132).</li>
<li>Choose a message and press <b>ENTER</b>. Use ▲▼ to scroll a long message. Leave with <b>MENU</b>.</li></ul>
<h3>5. Preparing the NAVTEX for a passage: setting up</h3>
<p>Press <b>MENU</b>. Choose with ▲▼ and press <b>ENTER</b>. <b>MENU</b> always goes back one level.</p>
<ul><li><b>Station selection.</b> Two modes: <b>AUTO</b> (the set takes the nearby stations) or <b>MANUAL</b> (you choose). In MANUAL every station letter starts on Receive; ENTER confirms and moves to the next letter, ◀▶ jump between letters, choose <b>Ignore</b> and ENTER to stop receiving a station.</li>
<li><b>Message selection.</b> Types <b>A, B, D and L are always received</b> and can't be switched off. All other types start on Receive; choose Ignore and ENTER to stop receiving a type. ◀▶ jump between types.</li>
<li><b>Functions.</b>
  <ul><li><b>Received alarm:</b> on or off.</li>
  <li><b>Error rate:</b> the highest percentage of errors at which a message still counts as good. Its code is then stored and it won't be received again. Default 4.9%. Change with ▲▼, save with ENTER.</li>
  <li><b>Save msg to PC:</b> saves a message as a text file.</li>
  <li><b>Scrolling:</b> sets the scroll speed of the screen (not active in the simulator).</li></ul></li>
<li><b>System menu.</b>
  <ul><li><b>Time display:</b> shows date and time; you can correct them (◀▶ choose the field, ▲▼ change).</li>
  <li><b>Default setting:</b> returns the set to the maker's settings.</li>
  <li><b>Delete all msgs:</b> deletes every message and its code from memory. Recommended at the start of a new passage.</li>
  <li><b>Delete msg:</b> delete one message: choose it and press ENTER.</li>
  <li><b>Test:</b> runs the set's internal self-test.</li>
  <li><b>Status:</b> shows how the set is programmed (messages and stations it will receive, and so on).</li></ul></li>
<li><b>User display.</b>
  <ul><li><b>Rcvd msg log:</b> the list of all messages in memory.</li>
  <li><b>Time display:</b> 12 or 24 hour clock.</li>
  <li><b>All clear:</b> deletes all messages and returns the maker's settings.</li></ul></li></ul>
<h3>6. Receiving a message</h3>
<ul><li>While the set is on, messages arrive on their own. If the settings accept one, it appears on the screen with an alarm (if switched on). Press <b>MENU</b> to stop the beep.</li>
<li>If the settings don't accept it (wrong frequency, station or type set to Ignore, already in memory, too many errors), nothing is printed.</li></ul>`;

  // ---- map: simple equirectangular sketch of the Eastern Mediterranean ----
  const W = 640, LON0 = 22, LON1 = 37, LAT0 = 30, LAT1 = 41.5;
  const KX = W / (LON1 - LON0), KY = KX / Math.cos(36 * Math.PI / 180), H = Math.round((LAT1 - LAT0) * KY);
  const X = lon => ((lon - LON0) * KX).toFixed(1), Y = lat => ((LAT1 - lat) * KY).toFixed(1);
  const poly = pts => pts.map(([lo, la]) => X(lo) + ',' + Y(la)).join(' ');
  const LAND = {
    turkeyLevantAfrica: [[26.0,41.5],[26.0,40.8],[26.2,40.4],[26.4,40.1],[26.2,39.6],[26.8,39.2],[26.9,38.6],[27.1,38.45],[26.3,38.3],[26.6,38.0],[27.2,37.9],[27.3,37.1],[27.6,37.0],[28.0,36.8],[28.3,36.7],[29.1,36.6],[29.6,36.2],[30.4,36.25],[30.6,36.85],[31.5,36.75],[32.0,36.55],[32.8,36.05],[33.6,36.15],[34.2,36.45],[34.65,36.8],[35.4,36.6],[35.9,36.85],[36.2,36.6],[35.8,36.0],[35.9,35.5],[35.9,35.0],[35.85,34.6],[35.5,33.9],[35.2,33.3],[35.1,33.0],[34.95,32.82],[34.9,32.5],[34.75,32.05],[34.55,31.65],[34.3,31.35],[33.8,31.15],[32.6,31.1],[32.3,31.3],[31.8,31.55],[30.9,31.6],[30.3,31.5],[29.9,31.2],[29.0,30.9],[28.0,31.1],[27.2,31.4],[25.2,31.6],[24.0,32.0],[23.0,32.6],[22.0,32.9],[22,30],[37,30],[37,41.5]],
    greece: [[22,41.5],[26.0,41.5],[26.0,40.8],[25.0,40.95],[24.4,40.9],[23.7,40.7],[22.9,40.6],[22.6,40.3],[22.6,40.0],[22.9,39.5],[23.3,39.2],[22.9,38.9],[23.5,38.5],[24.1,38.2],[24.0,37.7],[23.5,38.0],[23.1,37.9],[23.2,37.6],[22.8,37.5],[23.0,36.5],[22.5,36.4],[22.0,36.9]],
    crete: [[23.5,35.6],[24.2,35.55],[25.0,35.4],[25.8,35.3],[26.3,35.25],[26.2,35.0],[25.0,35.0],[24.0,35.2],[23.5,35.3]],
    cyprus: [[32.3,34.8],[32.4,35.1],[32.9,35.2],[33.4,35.35],[34.0,35.45],[34.6,35.7],[34.1,35.25],[34.0,34.95],[33.6,34.85],[33.0,34.6],[32.6,34.65]],
    rhodes: [[27.75,36.45],[28.2,36.45],[28.1,35.9],[27.8,36.1]],
    limnos: [[25.05,39.95],[25.4,40.0],[25.4,39.8],[25.1,39.8]],
    lesbos: [[25.85,39.35],[26.4,39.35],[26.6,39.05],[26.0,39.1]],
    chios: [[25.9,38.6],[26.15,38.55],[26.0,38.2],[25.85,38.35]]
  };
  function map() {
    const st = NX.stations, near = NX.autoStations;
    const r400 = 400 / 60 * KY; // 400 NM in px (1° latitude = 60 NM)
    const dots = Object.entries(st).filter(([k]) => k !== 'D').map(([k, s]) => {
      const x = X(s.lon), y = Y(s.lat), letters = k === 'F' ? 'F · D(490)' : k;
      return `<g><circle cx="${x}" cy="${y}" r="7" fill="${near.includes(k) ? '#DE4457' : '#5C7A8F'}" stroke="#fff" stroke-width="2"/>
        <text x="${+x + 10}" y="${+y - 8}" font-size="15" font-weight="700" fill="#16324F">${letters}</text>
        <text x="${+x + 10}" y="${+y + 9}" font-size="12" fill="#16324F">${s.name.replace(' (Turkish)', '')}${s.lat === 31.2 ? ' (suspended)' : ''}</text></g>`;
    }).join('');
    const zone = (t, lon, lat) => `<text x="${X(lon)}" y="${Y(lat)}" font-size="14" font-style="italic" fill="#17758F" text-anchor="middle">${t}</text>`;
    return `<h2>NAVTEX stations: Eastern Mediterranean</h2>
<div class="map"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of NAVTEX stations in the Eastern Mediterranean">
<rect width="${W}" height="${H}" fill="#CFEAF2"/>
<circle cx="${X(34.99)}" cy="${Y(32.82)}" r="${r400.toFixed(0)}" fill="rgba(222,68,87,.06)" stroke="#DE4457" stroke-width="1.5" stroke-dasharray="6 6"/>
${Object.values(LAND).map(p => `<polygon points="${poly(p)}" fill="#F3E3C8" stroke="#B9A27C" stroke-width="1"/>`).join('')}
${zone('Crusade', 34.2, 33.4)}${zone('Delta', 30.9, 32.2)}${zone('Matruch', 27.2, 32.2)}${zone('Taurus', 31.6, 35.6)}
<text x="${X(28.6)}" y="${Y(33.6)}" font-size="12" fill="#DE4457">≈400 NM from Haifa</text>
<g transform="translate(${X(34.55)} ${Y(32.2)})"><path d="M-10 0h20l-4 5h-12z" fill="#16324F"/><path d="M0 -1v-14l8 13z" fill="#fff" stroke="#16324F" stroke-width="1.5"/><text x="-14" y="18" font-size="12" fill="#16324F">You</text></g>
${dots}
<text x="${W - 8}" y="${H - 8}" font-size="11" fill="#5C7A8F" text-anchor="end">Sketch only, not for navigation</text>
</svg></div>
<p><span style="color:#DE4457;font-weight:700">●</span> taken in <b>AUTO</b> mode off Israel (P, M, F, and D on 490 kHz) &nbsp; <span style="color:#5C7A8F;font-weight:700">●</span> other stations: you need MANUAL to choose them.</p>
<table><tr><th>B1</th><th>Station</th><th>Frequency</th></tr>
${Object.entries(st).map(([k, s]) => `<tr><td><b>${k}</b></td><td>${s.name}, ${s.country}</td><td>${s.freq.join(', ')} kHz${s.national ? ' (national language)' : ''}</td></tr>`).join('')}</table>
<p>NAVTEX range is about 400 NM, best at night. Stations with the same letter are about 800 NM apart, so you never receive both. Each station transmits every 4 hours, for up to 10 minutes. Weather areas such as <i>Crusade</i> (off Israel) and <i>Delta</i> appear in the forecasts; their positions here are approximate.</p>`;
  }

  return { book: () => book, map };
})();
