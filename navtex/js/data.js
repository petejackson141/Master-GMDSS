/* NAVTEX simulator: stations, message types, stored messages and the messages that arrive at the receiver.
   Facts follow the Yam Sailing GMDSS course notes (NAVTEX slides). Message texts are the ones from the
   course's Flash simulator, with typos fixed. A few '*' characters are left in on purpose: that is how a
   receiver shows characters it could not decode, and it is what the CER (character error rate) measures. */

const NX = {};

// B1: transmitting station. 'near' = taken by the receiver in AUTO mode for a boat off Israel.
NX.stations = {
  P: { name: 'Haifa', country: 'Israel', freq: [518], lat: 32.82, lon: 34.99, near: true },
  M: { name: 'Cyprus', country: 'Cyprus', freq: [518], lat: 34.96, lon: 34.08, near: true },
  F: { name: 'Antalya', country: 'Turkey', freq: [518], lat: 36.88, lon: 30.70, near: true },
  D: { name: 'Antalya (Turkish)', country: 'Turkey', freq: [490], lat: 36.88, lon: 30.70, near: true, national: true },
  H: { name: 'Iraklion', country: 'Greece', freq: [518], lat: 35.34, lon: 25.13, near: false },
  I: { name: 'Izmir', country: 'Turkey', freq: [518], lat: 38.42, lon: 27.14, near: false },
  L: { name: 'Limnos', country: 'Greece', freq: [518], lat: 39.90, lon: 25.20, near: false },
  N: { name: 'Alexandria', country: 'Egypt', freq: [518], lat: 31.20, lon: 29.90, near: false }
};
NX.autoStations = ['P', 'M', 'F', 'D'];
NX.letters = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');

// B2: message type (names as in the course notes). 'fixed' types can't be switched off.
NX.types = {
  A: { name: 'Navigational warnings', short: 'NAV WRNG', fixed: true },
  B: { name: 'Meteorological warnings', short: 'METEO WRNG', fixed: true },
  C: { name: 'Ice reports', short: 'ICE' },
  D: { name: 'Search and rescue information', short: 'SAR', fixed: true },
  E: { name: 'Meteorological forecasts', short: 'METEO FRCST', note: 'recommended not to switch off' },
  F: { name: 'Pilot service messages', short: 'PILOT' },
  G: { name: 'Decca messages', short: 'DECCA' },
  H: { name: 'Loran messages', short: 'LORAN' },
  I: { name: 'Omega messages', short: 'OMEGA' },
  J: { name: 'Satnav messages', short: 'SATNAV' },
  K: { name: 'Other electronic navaid messages', short: 'NAVAID' },
  L: { name: 'Additional navigational warnings', short: 'NAV WRNG', fixed: true },
  V: { name: 'Special services', short: 'SPECIAL' },
  W: { name: 'Special services', short: 'SPECIAL' },
  X: { name: 'Special services', short: 'SPECIAL' },
  Y: { name: 'Special services', short: 'SPECIAL' },
  Z: { name: 'No message on hand (QRU)', short: 'QRU' }
};
NX.typeOrder = 'ABCDEFGHIJKLVWXYZ'.split('');

// Every message the simulator knows. id = B1 B2 B3 B4.
NX.messages = {
  PA23: { freq: 518, cer: 2, lines: [
    'ZCZC PA23',
    '091220 UTC JUNE 2007',
    'HAIFA NAVIGATIONAL WARNING',
    'NR 1243/2007',
    'FIRING PRA*TICE WILL TAKE PLACE NOV',
    '10 TO NOV 12 BE*WEEN 32.44N 034.21E',
    'AND 32.10N 033.56E AND 32.05N 032.44E',
    'NNNN'] },
  PD00: { freq: 518, cer: 0, lines: [
    'ZCZC PD00',
    '151705 UTC JUNE 2007',
    'HAIFARADIO MRCC DISTRESS ALERT',
    'RECEIVING EPIRB SIGNALS FROM GALIT',
    'MMSI 428000798 ESTIMATED PSN 33.45N',
    '029.55E NO FURTHER INFORMATION.',
    'SHIPS IN VICINITY ASSIST AND REPORT',
    'TO HAIFARADIO MRCC',
    'NNNN'] },
  MD00: { freq: 518, cer: 0.7, lines: [
    'ZCZC MD00',
    '092200 UTC JUNE 2007',
    'CYPRUSRADIO MRCC EAST MED NR 72/07',
    'TO ALL SHIPS PASSING GIVEN POSITION',
    'SUBJECT: DSC ALERT WAS INTERCEPTED ON',
    'CH70 ON 9TH JUNE 2100 UTC FROM VESSEL',
    'MMSI 232465778 FLOODING POSITION',
    '3314N 03245E. VESSELS PASSING AREA ARE',
    'REQUESTED TO MAKE CONTACT WITH THE',
    'DISTRESSED VESSEL AND REPORT TO MRCC',
    'NNNN'] },
  MB02: { freq: 518, cer: 0, lines: [
    'ZCZC MB02',
    '081400 UTC NOV 2006',
    'CYPRUS GALE WARNING',
    'NR A4565/2006',
    'GALE WARNING FOR TAURUS. WESTERLY',
    'WINDS FORCE 6 TO 7 INCREASING TO 8.',
    'ROUGH SEA, VISIBILITY 3 MILES',
    'NNNN'] },
  PE55: { freq: 518, cer: 1.5, lines: [
    'ZCZC PE55',
    '081220 UTC NOV 2006 NR 856',
    'HAIFA WEATHER FO*ECAST',
    'FOR DELTA AND CRUSADE',
    'NORTHWESTERLY WINDS F*RCE 2 TO 3.',
    'MODERATE SEA, VISIBILITY GOOD.',
    'OUTLOOK SIMILAR',
    'NNNN'] },
  FA13: { freq: 518, cer: 0.6, lines: [
    'ZCZC FA13',
    '081250 UTC NOV 2006',
    'ANTALYA NAVIGATIONAL WARNING',
    'NR 782/06',
    'FLOATING CONTAINER POSITION 35.26N',
    '033.57E DRIFTING NORTHEAST 2 KNOTS.',
    'DANGEROUS TO NAVIGATION',
    'NNNN'] },
  IE21: { freq: 518, cer: 0, lines: [
    'ZCZC IE21',
    '081320 UTC NOV 2006 NR 1254/2006',
    'IZMIR WEATHER FORECAST',
    'FOR TAURUS AND CRUSADE',
    'NORTHEASTERLY WINDS FORCE 1 TO 2',
    'VEERING NORTHWEST. SMOOTH SEA,',
    'VISIBILITY GOOD. OUTLOOK SIMILAR',
    'NNNN'] },
  PB02: { freq: 518, cer: 2, lines: [
    'ZCZC PB02',
    '080820 UTC NOV 2006 NR 1232',
    'HAIFA GALE WARNING',
    'FOR CRUSADE AND DELTA',
    'NORTHERLY WINDS FORCE 7 TO 8 V*ERING',
    'WEST FORCE 6 TO 7. SCATTERED SHOWERS.',
    'VERY ROUGH SEA, POOR VISIBILITY',
    'NNNN'] },

  // extra messages that arrive during free practice and the exercises
  PA24: { freq: 518, cer: 0.8, lines: [
    'ZCZC PA24',
    '201015 UTC JUNE 2007',
    'HAIFA NAVIGATIONAL WARNING',
    'NR 1251/2007',
    'HAIFA BAY. LIGHT BUOY NR 3 IN',
    'POSITION 32.52N 034.58E OFF STATION.',
    'MARINERS ADVISED TO KEEP CLEAR',
    'NNNN'] },
  PA25: { freq: 518, cer: 7.2, lines: [
    'ZCZC PA25',
    '2*1*30 UTC J*NE 2007',
    'HA*FA N*VIG*TIONAL W*RN*NG',
    'NR 12*2/20*7',
    'ASHD*D AP*ROACH. WR*CK IN P*SITION',
    '31.*9N 03*.36E. *ARK*D BY *UOY',
    'NNNN'] },
  MB03: { freq: 518, cer: 0, lines: [
    'ZCZC MB03',
    '201600 UTC JUNE 2007',
    'CYPRUS GALE WARNING',
    'NR A4621/2007',
    'GALE WARNING FOR CRUSADE. SOUTHWEST',
    'WINDS FORCE 7 INCREASING TO 8 IN THE',
    'NEXT 12 HOURS. ROUGH TO VERY ROUGH SEA',
    'NNNN'] },
  PF10: { freq: 518, cer: 0, lines: [
    'ZCZC PF10',
    '200900 UTC JUNE 2007',
    'HAIFA PILOT SERVICE',
    'PILOT BOARDING POSITION FOR HAIFA',
    'PORT TEMPORARILY MOVED TO 32.51N',
    '034.57E UNTIL FURTHER NOTICE',
    'NNNN'] },
  PL05: { freq: 518, cer: 0, lines: [
    'ZCZC PL05',
    '201130 UTC JUNE 2007',
    'HAIFA NAVIGATIONAL WARNING (ADDITIONAL)',
    'SURVEY VESSEL WORKING CABLE OPERATIONS',
    '10 NM WEST OF HADERA. PASS AT SLOW',
    'SPEED AND KEEP 1 NM CLEAR',
    'NNNN'] },
  HE30: { freq: 518, cer: 0, lines: [
    'ZCZC HE30',
    '200600 UTC JUNE 2007',
    'IRAKLION WEATHER FORECAST',
    'FOR SOUTH AEGEAN AND WEST CRETE',
    'NORTH WINDS FORCE 4 TO 5. MODERATE SEA',
    'NNNN'] },
  DA41: { freq: 490, cer: 0, lines: [
    'ZCZC DA41',
    '201400 UTC HAZIRAN 2007',
    'ANTALYA SEYIR UYARISI',
    'NR 455/07',
    'KEMER ACIKLARINDA ATIS TALIMI.',
    'BOLGEDEN UZAK DURUNUZ',
    'NNNN'] },
  MZ00: { freq: 518, cer: 0, lines: [
    'ZCZC MZ00',
    '201200 UTC JUNE 2007',
    'CYPRUS RADIO. QRU',
    'NO MESSAGES ON HAND',
    'NNNN'] }
};

// what is already in memory when the receiver comes out of the box (as in the Flash simulator)
NX.factoryLog = ['PA23', 'PD00', 'MD00', 'MB02', 'PE55', 'FA13', 'IE21', 'PB02'];
NX.factoryNew = ['PA23', 'PD00'];

// messages that reach the aerial now and then in free practice (the receiver's settings decide what prints)
NX.traffic = ['PA24', 'PA25', 'MB03', 'PF10', 'PL05', 'HE30', 'DA41', 'MZ00'];

NX.idParts = id => ({ b1: id[0], b2: id[1], nr: id.slice(2) });
NX.typeShort = id => (NX.types[id[1]] || {}).short || '';
NX.stationName = b1 => (NX.stations[b1] || {}).name || ('Station ' + b1);
