/* Written-answer exams: the scenario questions and the model answers, typed from the course answer sheets.
   The answers are kept exactly as on the sheets (including the notes about what was crossed out on the originals).

   Each exam has:
     paper:     the heading lines of the exam paper
     rules:     the "Instructions for the Candidate" (empty if the paper has none)
     story:     the scenario text, one paragraph per item ({quote:true} = a heard radio call)
     parts:     the questions (label + text, options for a circle-the-answer question)
     answer:    the model answer, part by part. Each part is a list of blocks:
       {step:'1.', kind, text, detail, msg:[...], list:[...], notes:[...]}  a procedure step
       {p:'...'}           a line of text
       {msg:[...]}         a radio message, one line per item
       {list:[...]}        a list of points
       {note:'...'}        a note about the original sheet (shown in italics, not marked)
       {choice:'...'}      the right option of a circle-the-answer question
   kind (for steps) links Learn mode to its "why" and to the matching simulator:
       epirb, dsc, mayday, abandon */

const MINISTRY = ['Ministry of Communications Israel', 'Examination for Restricted Radiotelephone Operator (VHF) in relation to Global Maritime Distress and Safety System (GMDSS) (Maritime Service)'];
const RULES = ['Answer all questions. You have 15 minutes.', 'Use a blue/black pen. Ensure your handwriting is legible.'];

const WRITTEN = [
{
  id: 'devora', name: 'DEVORA', what: 'Flooding, danger of sinking',
  paper: MINISTRY, rules: RULES,
  story: [
    'At position 34°09’ N 34°01’ E, at local time 12:01, your yacht DEVORA, MMSI 428000747, is in danger of sinking due to water flooding the vessel. The skipper instructs you to obtain immediate assistance. Your vessel is equipped according to GMDSS requirements for Sea Area A1.'
  ],
  parts: [
    { label: 'a', text: 'Prepare and write the type of message you would transmit, including all procedures. All transmitted numbers and call signs be transmitted phonetically.' },
    { label: 'b', text: 'You receive the following single response:\n“MAYDAY DEVORA X3 THIS IS BONY X3 RECEIVED MAYDAY OVER”\nYou urgently require assistance from the responding vessel. What would you request from it?' }
  ],
  answer: [
    { label: 'a', blocks: [
      { step: '1.', kind: 'epirb', text: 'Activate EPIRB ASAP.' },
      { step: '2.', kind: 'dsc', text: 'DSC on Ch 70, high power / 25 W:', detail: 'Menu → Distress → Flooding → verify time + position → press DSC button for 5 seconds.' },
      { step: '3.', kind: 'mayday', text: 'Mayday call + message, VHF Ch 16, high power / 25 W:', msg: [
        'MAYDAY, MAYDAY, MAYDAY',
        'THIS IS DEVORA, DEVORA, DEVORA',
        'FOUR TWO EIGHT ZERO ZERO ZERO SEVEN FOUR SEVEN',
        'MAYDAY DEVORA',
        'THREE FOUR DEGREES ZERO NINE MINUTES NORTH',
        'ZERO THREE FOUR DEGREES ZERO ONE MINUTES EAST',
        'WATER FLOODING THE VESSEL, IN DANGER OF SINKING',
        'REQUIRE IMMEDIATE ASSISTANCE',
        'TWO PERSONS ON BOARD',
        'OVER'] },
      { step: '4.', kind: 'abandon', text: 'In case of abandonment:', list: [
        '1) Attach activated EPIRB and place in water.',
        '2) Attach activated SART and mount as high as possible on the life raft.',
        '3) Activate portable VHF, Ch 16, high power, + spare battery.'] }
    ] },
    { label: 'b', blocks: [
      { p: 'Request distance and ETA. VHF Ch 16, high power / 25 W:' },
      { msg: ['MAYDAY BONY', 'THIS IS DEVORA, DEVORA', 'YOUR DISTANCE AND ETA', 'OVER'] }
    ] }
  ]
},
{
  id: 'jasmin', name: 'JASMIN', what: 'Lost propeller, disabled and adrift',
  paper: MINISTRY, rules: RULES,
  story: [
    'At night, at 23:45 UTC, the yacht JASMIN, call sign WSDA, MMSI 366000371, located at position 34°23’ N 34°22’ E, carrying 13 crew members and passengers, has lost its propeller and is without control and in danger of sinking. The skipper instructs you to immediately initiate a proper distress request. The yacht is authorized to sail in Sea Area A1 and is equipped according to GMDSS requirements.'
  ],
  parts: [
    { label: 'a', text: 'Prepare and write the type of message you would transmit, including all procedures. All transmitted numbers and call signs be transmitted phonetically.' },
    { label: 'b', text: 'At the end of transmitting the distress message, you receive the following call on Channel 16:\n“Mayday Jasmin x3 this is Rakefet x3 please repeat your position over”\nWhat is the meaning of this call, and how would you respond?' }
  ],
  answer: [
    { label: 'a', blocks: [
      { step: '1.', kind: 'epirb', text: 'Activate EPIRB ASAP.' },
      { step: '2.', kind: 'dsc', text: 'DSC, VHF Ch 70, high power / 25 W:', detail: 'Menu → Disabled and adrift → verify time + position → long press on button to transmit (5 seconds).' },
      { step: '3.', kind: 'mayday', text: 'Mayday call + message, VHF Ch 16, high power / 25 W:', msg: [
        'MAYDAY, MAYDAY, MAYDAY',
        'THIS IS JASMIN, JASMIN, JASMIN',
        'THREE SIX SIX ZERO ZERO ZERO THREE SEVEN ONE',
        'MAYDAY JASMIN',
        'THREE FOUR DEGREES TWO THREE MINUTES NORTH',
        'ZERO THREE FOUR DEGREES TWO TWO MINUTES EAST',
        'LOST PROPELLER AND NO CONTROL, DISABLED AND ADRIFT',
        'IN DANGER OF SINKING',
        'REQUIRE IMMEDIATE ASSISTANCE',
        'ONE THREE PERSONS ON BOARD',
        'OVER'],
        notes: ['On the original, the call sign WHISKEY SIERRA DELTA ALPHA was written after the MMSI and then crossed out.'] },
      { step: '4.', kind: 'abandon', text: 'In case of abandonment:', list: [
        '1) Take activated EPIRB, attach to life raft and place in water.',
        '2) Take activated SART and attach as high as possible to the life raft.',
        '3) Take portable VHF, activated on Ch 16, high power, + spare battery.'] }
    ] },
    { label: 'b', blocks: [
      { p: 'Meaning: the vessel Rakefet wants me to repeat my position. Maybe the message was unclear, or they did not write it down in time.' },
      { p: 'Response on VHF Ch 16, high power / 25 W (Mayday once, names ×3):' },
      { msg: ['MAYDAY', 'RAKEFET, RAKEFET, RAKEFET', 'THIS IS JASMIN, JASMIN, JASMIN', 'I REPEAT POSITION',
        'THREE FOUR DEGREES TWO THREE MINUTES NORTH', 'ZERO THREE FOUR DEGREES TWO TWO MINUTES EAST', 'OVER'] }
    ] }
  ]
},
{
  id: 'jasmin-mast', name: 'JASMIN (mast fell)', what: 'Mast down, not under command',
  paper: MINISTRY, rules: RULES,
  story: [
    'As a result of the mast falling, the yacht JASMIN, 428070371, is not under command in rough seas and is in danger of sinking. The yacht is in position 34°41’ N, 34°11’ E, with 11 crew members and passengers on board. The skipper instructs you to make an orderly and immediate request for assistance. The yacht is certified to sail in Sea Area A1 and is equipped in accordance with GMDSS requirements.'
  ],
  parts: [
    { label: 'a', text: 'Prepare and write the type of message you would transmit, including all relevant procedures. Digits and call signs must be transmitted phonetically.' },
    { label: 'b', text: 'By which communication system and channel, and how, will the vessel HARMONY, 428000898, 4XEE, finish the distress situation of the vessel DEVORA at 16:00 UTC after the rescue operations have been completed? (Write the appropriate wording for finishing the distress situation in this case).' }
  ],
  answer: [
    { label: 'a', blocks: [
      { step: '1.', kind: 'epirb', text: 'Activate EPIRB ASAP.' },
      { step: '2.', kind: 'dsc', text: 'DSC, Channel 70 VHF, high power / 25 W:', detail: 'Press Menu → Distress → Disabled + adrift → check time and location are correct → press 5 seconds on button.' },
      { step: '3.', kind: 'mayday', text: 'Move to Channel 16, high power / 25 W, for distress call + message:', msg: [
        'MAYDAY, MAYDAY, MAYDAY',
        'THIS IS YACHT JASMIN, YACHT JASMIN, YACHT JASMIN',
        'FOUR TWO EIGHT ZERO SEVEN ZERO THREE SEVEN ONE',
        'MAYDAY JASMIN',
        'THREE FOUR DEGREES FOUR ONE MINUTES NORTH',
        'ZERO THREE FOUR DEGREES ONE ONE MINUTES EAST',
        'MAST FELL DOWN, DISABLED AND ADRIFT, IN DANGER OF SINKING',
        'IMMEDIATE ASSISTANCE REQUIRED',
        'ELEVEN PERSONS ON BOARD',
        'OVER'] },
      { step: '4.', kind: 'abandon', text: 'In case of abandonment:', list: [
        'Activated EPIRB in the water next to the life raft.',
        'Attach activated SART as high as possible on the life raft.',
        'Take portable VHF + spare battery, on Channel 16, full power 1 W.'] }
    ] },
    { label: 'b', blocks: [
      { p: 'Channel 16 VHF, high power / 25 W:' },
      { msg: ['MAYDAY', 'ALL STATIONS, ALL STATIONS, ALL STATIONS', 'THIS IS HARMONY, HARMONY, HARMONY',
        'FOUR TWO EIGHT ZERO ZERO ZERO EIGHT NINE EIGHT', 'FOUR XRAY ECHO ECHO', 'TIME ONE SIX ZERO ZERO UTC',
        'DEVORA SEELONCE FEENEE', 'OUT'] }
    ] }
  ]
},
{
  id: 'nesher', name: 'NESHER', what: 'Flooding off Tel Aviv',
  paper: ['DISTRESS, URGENCY, SAFETY AND MEDICO'], rules: [],
  story: [
    'The vessel NESHER, MMSI 428666007, on which you are currently sailing, is located west of Tel Aviv Marina at position 32°07’ N 34°31’ E. The vessel is flooding and in immediate danger, threatening the lives of the twelve persons on board. The yacht is authorized for operation in Sea Area A1 and equipped according to GMDSS requirements.'
  ],
  parts: [
    { label: 'A', text: 'Prepare and write the type of message you would transmit, including all procedures.' },
    { label: 'B', text: 'Which of the following terms is used to indicate the end of distress traffic? (circle the correct term)',
      options: ['Seelonce Mayday', 'Seelonce Feenee', 'Mayday Relay', 'Mayday Feenee', 'Received Mayday'] }
  ],
  answer: [
    { label: 'A', blocks: [
      { step: '1)', kind: 'epirb', text: 'Activate EPIRB ASAP.' },
      { step: '2)', kind: 'dsc', text: 'DSC call, Ch 70, high power / 25 W:', detail: 'Press Menu → Distress → Flooding → verify location + time → long press 5 seconds on DSC button.' },
      { step: '3)', kind: 'mayday', text: 'VHF call + message, Ch 16, 25 W:', msg: [
        'MAYDAY, MAYDAY, MAYDAY',
        'THIS IS NESHER, NESHER, NESHER 428666007',
        'MAYDAY NESHER',
        '32 DEGREES 07 MINUTES NORTH, 034 DEGREES 31 MINUTES EAST',
        'FLOODING, IN DANGER OF SINKING',
        'REQUIRE IMMEDIATE ASSISTANCE',
        'TWELVE PERSONS ON BOARD',
        'OVER'] },
      { step: '4)', kind: 'abandon', text: 'In case of abandonment, take:', list: [
        'a. Activated EPIRB, attach to life raft and place in the water.',
        'b. Activated SART, attached as high as possible on the life raft.',
        'c. Portable VHF, Ch 16, high / 1 W + spare battery.'] }
    ] },
    { label: 'B', blocks: [ { choice: 'Seelonce Feenee' } ] }
  ]
},
{
  id: 'tabor', name: 'TABOR', what: 'Man overboard',
  paper: MINISTRY, rules: RULES,
  story: [
    'You are sailing on the yacht TABOR, MMSI 428000666. You are informed that a 35-year-old male passenger is missing and is presumed to have fallen overboard. He was last seen today at 01:30 UTC. The skipper instructs you to immediately request assistance.',
    'The vessel’s position is 36°24’ N 25°28’ E. You are sailing on course 043° at a speed of 6 knots. There are 9 persons on board. Your vessel is equipped according to GMDSS requirements for Sea Area A1.'
  ],
  parts: [
    { label: 'a', text: 'Prepare and write the type of message you would transmit, including all procedures. Numbers must be transmitted phonetically.' },
    { label: 'b', text: 'A few minutes later, after completing Part A in full, the skipper informs you that the passenger has been found drunk and asleep. State what actions you would take.' }
  ],
  answer: [
    { label: 'a', blocks: [
      { step: '1.', kind: 'epirb', text: 'Activate EPIRB ASAP.' },
      { step: '2.', kind: 'dsc', text: 'DSC, Ch 70, high power / 25 W:', detail: 'Menu → Distress → MOB → verify location + time → long press 5 seconds.' },
      { step: '3.', kind: 'mayday', text: 'VHF call + message, Ch 16, high power / 25 W:', msg: [
        'MAYDAY, MAYDAY, MAYDAY',
        'THIS IS TABOR, TABOR, TABOR',
        'FOUR TWO EIGHT ZERO ZERO ZERO SIX SIX SIX',
        'MAYDAY TABOR',
        'MAN OVERBOARD',
        'CURRENT POSITION THREE SIX DEGREES TWO FOUR MINUTES NORTH,',
        'ZERO TWO FIVE DEGREES TWO EIGHT MINUTES EAST',
        'REQUIRE IMMEDIATE ASSISTANCE',
        'LAST SEEN 01:30 UTC, 35-YEAR-OLD MALE',
        'SAILING ON COURSE ZERO FOUR THREE DEGREES AT SPEED NINE KNOTS',
        'ALL SHIPS IN VICINITY REPORT AND ASSIST',
        'OVER'],
        notes: ['Written as “nine knots” on the original – the question says 6 knots (9 is the number of persons on board).'] }
    ] },
    { label: 'b', blocks: [
      { list: ['Turn off EPIRB + DSC.', 'VHF Ch 16, high power / 25 W.', 'Regular ending to the Mayday call: best to cancel the call by closing it normally. Close EPIRB.'] },
      { note: 'On the original, a full written cancellation message (“All stations … cancel my false distress alert …”) was crossed out.' }
    ] }
  ]
},
{
  id: 'rafsody', name: 'RAFSODY', what: 'Hit by a naval shell, abandoning',
  paper: MINISTRY, rules: [...RULES.slice(0, 1), RULES[1] + ' Numbers must be transmitted phonetically.'],
  story: [
    'On Wednesday, at 04:00 UTC, the yacht RAFSODY, 235090807, was hit by a naval shell at her bow and began to sink. The yacht’s position is 34°20′ North, 034°47′ East. The skipper orders the abandonment of the vessel.',
    'There are 3 crew members and 3 passengers on board the yacht. The yacht is certified to sail in Sea Area A1 and is equipped in accordance with GMDSS requirements.'
  ],
  parts: [
    { label: 'a', text: 'Prepare and write down all the procedures required to obtain immediate assistance, including the preparations you would make in case of abandonment.' },
    { label: 'b', text: 'It is likely that RAFSODY entered a naval firing area. By what means can a skipper know in advance about firing areas such as these?' },
    { label: 'c', text: 'On which channel/channels could you notify the Navy that you have been hit, in order to try to prevent additional shells from being fired toward you?' }
  ],
  answer: [
    { label: 'a', blocks: [
      { step: '1.', kind: 'epirb', text: 'Activate EPIRB ASAP.' },
      { step: '2.', kind: 'dsc', text: 'DSC, Ch 70, 25 W / high:', detail: 'Menu → Distress → Sinking → verify time + position → 5-second press on DSC button.',
        notes: ['Note on the original: “Sinking” is circled with an arrow to “Fire + explosion (better)”.'] },
      { step: '3.', kind: 'mayday', text: 'VHF Ch 16, high power / 25 W, Mayday call + message:', msg: [
        'MAYDAY, MAYDAY, MAYDAY',
        'THIS IS RAFSODY, RAFSODY, RAFSODY',
        'TWO THREE FIVE ZERO NINE ZERO EIGHT ZERO SEVEN',
        'MAYDAY RAFSODY',
        'THREE FOUR DEGREES TWO ZERO MINUTES NORTH',
        'ZERO THREE FOUR DEGREES FOUR SEVEN MINUTES EAST',
        'HIT BY NAVAL SHELL, SINKING, ABANDONING TO LIFE RAFT',
        'REQUIRE IMMEDIATE ASSISTANCE',
        'SIX PERSONS ON BOARD',
        'OVER'] },
      { step: '4.', kind: 'abandon', text: 'Abandoning to life raft:', list: [
        'Attach activated EPIRB and place in water.',
        'Attach activated SART and mount as high as possible.',
        'Activate portable VHF, Ch 16, high / 1 W.'] }
    ] },
    { label: 'b', blocks: [
      { list: ['Could have checked NAVTEX messages.', 'Could have checked the RCC Haifa website.', 'Navigational charts.', 'Marina noticeboard has navy messages.'] }
    ] },
    { label: 'c', blocks: [
      { p: 'Can contact the Navy on:' },
      { list: ['VHF Ch 16, high power / 25 W', 'VHF Ch 11, high power / 25 W'] },
      { note: '“DSC Ch 70” was written first and crossed out.' }
    ] }
  ]
},
{
  id: 'amalia', name: 'AMALIA', what: 'Grounded in the Strait of Gibraltar',
  paper: MINISTRY, rules: RULES,
  story: [
    'While exiting the Strait of Gibraltar westbound, at position 36°02’ N 6°24’W, at local time 00:40, your vessel Amalia 234555044 encounters sunken rock, water is penetrating, and there is danger to the boat and six (6) crew members. The skipper requires you to obtain immediate help.',
    'Your vessel is equipped in accordance with GMDSS requirements for operation in Sea Area A1.'
  ],
  parts: [
    { label: 'a', text: 'Edit and write down the type of message you will transmit, including all the procedures.' },
    { label: 'b', text: 'Assuming that the rescue operations were successful, how will the ship Devora announce the end of the distress situation' }
  ],
  answer: [
    { label: 'a', blocks: [
      { step: '1.', kind: 'epirb', text: 'Activate EPIRB ASAP.' },
      { step: '2.', kind: 'dsc', text: 'Digital Selective Call (DSC), VHF Ch 70, high power / 25 W:', detail: 'Select Distress → Grounding → verify location + time → press DSC button 5 seconds.' },
      { step: '3.', kind: 'mayday', text: 'Distress call + message, VHF Ch 16, high power / 25 W:', msg: [
        'MAYDAY, MAYDAY, MAYDAY',
        'THIS IS AMALIA, AMALIA, AMALIA',
        'TWO THREE FOUR FIVE FIVE FIVE ZERO FOUR FOUR',
        'MAYDAY AMALIA',
        'THREE SIX DEGREES ZERO TWO MINUTES NORTH',
        'ZERO ZERO SIX DEGREES TWO FOUR MINUTES WEST',
        'GROUNDED ON SUNKEN ROCKS, WATER ON BOARD, DANGER OF SINKING',
        'REQUIRE IMMEDIATE ASSISTANCE',
        'SIX PERSONS ON BOARD',
        'OVER'] },
      { step: '4.', kind: 'abandon', text: 'In case of abandonment:', list: [
        'Attach EPIRB to life raft and place in the water beside the life raft.',
        'Attach SART as high as possible to the life raft.',
        'Take portable VHF on Ch 16, 1 W high, + spare battery.'] }
    ] },
    { label: 'b', blocks: [
      { msg: ['MAYDAY', 'ALL STATIONS, ALL STATIONS, ALL STATIONS', 'THIS IS DEVORA, DEVORA, DEVORA', 'TIME 11:40 UTC', 'AMALIA SEELONCE FEENEE', 'OUT'] },
      { note: 'On the original, “00:40 UTC” was crossed out and replaced with “11:40 UTC”.' }
    ] }
  ]
},
{
  id: 'pacific', name: 'PACIFIC / HORIZON', what: 'You are the helper: fire on a passenger ship',
  paper: MINISTRY, rules: RULES,
  story: [
    'The passenger vessel PACIFIC, 209221000, is on fire.',
    'You are aboard the yacht HORIZON, 428150052, and are at the scene.',
    'You hear the following distress call on VHF Channel 16:',
    { quote: true, text: 'Mayday Mayday Mayday this is Pacific Pacific Pacific 209221000\nMayday Pacific\nPosition 13°30’ N 50°15’ W on fire require immediate assistance\n365 persons on board, unable to use my radio station EPIRB activated\nOver' },
    'You do not hear anyone acknowledging the distress call.'
  ],
  parts: [
    { label: '1', text: 'Respond to the distress call according to regulations.' },
    { label: '2', text: 'You learn that the fire broke out on the bridge and they are unable to use their radio equipment. You are requested to relay the distress message on their behalf.' },
    { label: '3', text: 'Who controls the distress traffic in this case?' }
  ],
  answer: [
    { label: '1', blocks: [
      { p: 'VHF Channel 16, high power / 25 W:' },
      { msg: ['MAYDAY', 'PACIFIC, PACIFIC, PACIFIC', 'THIS IS HORIZON, HORIZON, HORIZON', 'RECEIVED YOUR MAYDAY', 'OVER'] },
      { note: 'Note written beside the question: “Using portable VHF. Send DSC [word unclear – looks like “undesignated”] instead if I am at the location.”' }
    ] },
    { label: '2', blocks: [
      { p: 'VHF Ch 16, high power / 25 W (“DSC” is also circled with an arrow pointing here):' },
      { msg: ['MAYDAY RELAY, MAYDAY RELAY, MAYDAY RELAY', 'THIS IS HORIZON, HORIZON, HORIZON 428150052',
        'FOLLOWING RECEIVED FROM PASSENGER VESSEL PACIFIC 209221000 ON CHANNEL ONE SIX', 'QUOTE', 'MAYDAY PACIFIC',
        'POSITION 13°30′ N 050°15′ W', 'ON FIRE, REQUIRE IMMEDIATE ASSISTANCE', '365 PERSONS ON BOARD, UNABLE TO USE MY RADIO STATION',
        'EPIRB ACTIVATED', 'UNQUOTE', 'SHIPS IN THE VICINITY REPORT AND ASSIST', 'OVER'] }
    ] },
    { label: '3', blocks: [ { p: 'Being on site, the Horizon controls the distress traffic.' } ] }
  ]
}
];

/* Learn mode: a short "why" for each kind of step, and the simulator to try it on.
   These are study notes written for the app, not part of the model answers. */
const WHY = {
  epirb:   { title: 'Activate the EPIRB', text: 'The EPIRB sends your distress alert by satellite to a rescue centre, with your identity and position, and keeps sending even if the radio stops working.', sims: [['EPIRB Simulator', '../epirb/']] },
  dsc:     { title: 'DSC distress alert on channel 70', text: 'A DSC distress alert is picked up automatically by every DSC radio and coast station in range, with your MMSI, position, time and the nature of distress. That is why you check the time and position before you send it.', sims: [['VHF / DSC Simulator', '../vhf/']] },
  mayday:  { title: 'Mayday call and message on channel 16', text: 'After the DSC alarm, everyone listening on channel 16 needs the details by voice: who you are, where you are, what is wrong, what help you need and how many people are on board.', sims: [['VHF / DSC Simulator', '../vhf/']] },
  abandon: { title: 'In case of abandonment', text: 'In the life raft the EPIRB keeps the satellite alert going, the SART shows up on rescue ships’ radar (higher means seen from further away), and the portable VHF lets you talk to the rescuers on channel 16.', sims: [['EPIRB', '../epirb/'], ['SART', '../sart/'], ['Portable VHF', '../portable/']] }
};
const KIND_SHORT = { epirb: 'Activate the EPIRB', dsc: 'DSC distress alert, channel 70', mayday: 'Mayday call + message, channel 16', abandon: 'Prepare for abandonment' };

/* Practice procedures 1–13 from the course book ("Process Exercise" questions), with Pete's model answers
   (SRC-GMDSS Practice Procedures – Model Answers, 6 Oct 2026). Answers kept exactly as on that sheet.
   set: 'practice' puts them in their own list on the exams page. */
const PP = ['DISTRESS, URGENCY, SAFETY AND MEDICO'];
const PP_SRC = 'from the practice procedures answer sheet';
const ABANDON_THEN = (text) => ({ step: '4.', kind: 'abandon', text: 'Then: ' + text });
const ABANDON_IF = { step: '4.', kind: 'abandon', text: 'If abandoning EPIRB tied to the raft in the water, SART high on the raft, portable VHF on Ch 16 High with spare battery' };
const EPIRB_STEP = { step: '1.', kind: 'epirb', text: 'EPIRB – activate ASAP.' };
const dscStep = (nature) => ({ step: '2.', kind: 'dsc', text: 'DSC, Ch 70, High/25 W – nature: ' + nature + ' > verify time & position > DISTRESS 5 sec.' });
const vhfStep = (msg, extra) => ({ step: '3.', kind: 'mayday', text: 'VHF, Ch 16, High/25 W' + (extra || '') + ':', msg });

const PRACTICE = [
{
  id: 'pp1-brigit', set: 'practice', src: PP_SRC, name: '1 · BRIGIT', what: 'Adrift onto rocks',
  paper: ['Process Exercise #1', ...PP], rules: [],
  story: ['The yacht BRIGIT 235090807 MMSI is drifting onto a rocky shore and is in danger of sinking after losing control. The yacht’s position is 34 degrees 20 minutes North, 34 degrees 47 minutes East. There are 3 crew members and 3 passengers on board. The yacht is licensed to sail in area A1 and is equipped in accordance with GMDSS requirements.'],
  parts: [
    { label: 'A', text: 'Prepare and record all necessary procedures for obtaining immediate assistance, indicating your preparations in the event of abandonment.' },
    { label: 'B', text: 'Assuming that the rescue operations have been successful, how will the yacht BRIGIT signal the end of the distress situation?' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'BRIGIT, MMSI 235090807, 34°20\'N 034°47\'E, lost control and drifting onto a rocky shore, 6 persons on board (3 crew + 3 passengers). Message type: MAYDAY (distress).' },
      EPIRB_STEP, dscStep('Disabled & Adrift'),
      vhfStep(['MAYDAY MAYDAY MAYDAY', 'THIS IS BRIGIT BRIGIT BRIGIT 235090807', 'MAYDAY BRIGIT', 'Three four degrees two zero minutes North', 'Zero three four degrees four seven minutes East', 'Lost control, drifting onto rocks, in danger of sinking', 'Require immediate assistance', 'Six persons on board', 'OVER']),
      ABANDON_THEN('EPIRB activated, tied to the raft, floating in the water · SART activated, as high as possible on the raft · portable VHF on Ch 16, High (1 W), with the spare battery.')
    ] },
    { label: 'B', blocks: [
      { p: 'As the station controlling its own distress, BRIGIT cancels it on Ch 16 with SEELONCE FEENEE:' },
      { msg: ['MAYDAY', 'ALL STATIONS ALL STATIONS ALL STATIONS', 'THIS IS BRIGIT BRIGIT BRIGIT 235090807', 'Time <hh mm> UTC', 'BRIGIT SEELONCE FEENEE', 'OUT'] },
      { p: 'If a coast station / RCC took over control, that station transmits the Seelonce Feenee instead.' }
    ] }
  ]
},
{
  id: 'pp2-bonny', set: 'practice', src: PP_SRC, name: '2 · BONNY', what: 'Flooding',
  paper: ['Process Exercise No. 2', ...PP], rules: [],
  story: ['Today at 08:22 local time you are on the yacht BONNY 279000321 MMSI as a crew member authorized to operate the communication facilities. Water is entering the ship and it is in danger of sinking. The skipper gives you an order to call for immediate help. The location of the incident is 34 degrees and 4 minutes East, 36 degrees and 3 minutes North. There are 7 people on board your yacht. Your ship is equipped according to GMDSS requirements for sailing in the 1A AREA.'],
  parts: [
    { label: 'A', text: 'Prepare and record all the necessary procedures for obtaining immediate help, indicating your actions in the event of abandonment.' },
    { label: 'B', text: 'On which channel and how will the ship ALON acknowledge the distress message? Give an example.' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'BONNY, MMSI 279000321, 08:22 local (05:22 UTC in summer), water entering, in danger of sinking, 7 persons on board. Position written latitude first: 36°03\'N 034°04\'E. Message type: MAYDAY.' },
      EPIRB_STEP, dscStep('Flooding'),
      vhfStep(['MAYDAY MAYDAY MAYDAY', 'THIS IS BONNY BONNY BONNY 279000321', 'MAYDAY BONNY', 'Three six degrees zero three minutes North', 'Zero three four degrees zero four minutes East', 'Taking water, in danger of sinking', 'Require immediate assistance', 'Seven persons on board', 'OVER']),
      ABANDON_THEN('EPIRB activated, tied to the raft, floating in the water · SART activated, high on the raft · portable VHF on Ch 16, High (1 W), spare battery.')
    ] },
    { label: 'B', blocks: [
      { p: 'On Channel 16 by voice (small craft do not acknowledge the DSC alert on Ch 70; that is left to the coast station):' },
      { msg: ['MAYDAY', 'BONNY BONNY BONNY', 'THIS IS ALON ALON ALON', 'RECEIVED MAYDAY', 'OVER'] },
      { p: 'BONNY then asks for distance and ETA, and ALON reports, for example: “MAYDAY BONNY, this is ALON ALON, I am eight miles south of you, speed ten knots, ETA four eight minutes, OVER.”' }
    ] }
  ]
},
{
  id: 'pp3-sondra', set: 'practice', src: PP_SRC, name: '3 · SONDRA', what: 'Storm, sinking',
  paper: ['Practice Procedure No. 3', ...PP], rules: [],
  story: ['You are sailing on the yacht SONDRA 356004422 MMSI. The yacht is in stormy weather and in danger of sinking. The location of the incident is 35 degrees and 44 minutes North 32 degrees and 59 minutes East. There are 8 people on board your yacht. Your vessel is equipped according to GMDSS requirements for sailing in the 1A AREA.'],
  parts: [
    { label: 'A', text: 'Prepare and record all the necessary procedures for obtaining immediate help, indicating your actions in the event that you receive an order to abandon ship.' },
    { label: 'B/C', text: 'B. After transmitting the distress call and the distress message, only one vessel responded to you as follows:\n“Mayday Sondra this is Ronit received mayday”\nC. What will you ask the vessel and how will you respond to it?' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'SONDRA, MMSI 356004422, 35°44\'N 032°59\'E, stormy weather, in danger of sinking, 8 persons on board. Message type: MAYDAY.' },
      EPIRB_STEP, dscStep('Sinking (or Undesignated)'),
      vhfStep(['MAYDAY MAYDAY MAYDAY', 'THIS IS SONDRA SONDRA SONDRA 356004422', 'MAYDAY SONDRA', 'Three five degrees four four minutes North', 'Zero three two degrees five nine minutes East', 'Stormy weather, in danger of sinking', 'Require immediate assistance', 'Eight persons on board', 'OVER']),
      ABANDON_THEN('EPIRB activated, tied to the raft, floating in the water · SART activated, high on the raft · portable VHF on Ch 16, High (1 W), spare battery.')
    ] },
    { label: 'B/C', blocks: [
      { p: 'Ask for her distance and ETA:' },
      { msg: ['MAYDAY', 'RONIT', 'THIS IS SONDRA SONDRA', 'Your distance and ETA', 'OVER'] },
      { p: 'After RONIT reports her position and ETA, answer:' },
      { msg: ['MAYDAY', 'RONIT', 'THIS IS SONDRA SONDRA', 'Proceed and stand by on channel one six', 'OVER'] },
      { p: 'Because no coast station answered, SONDRA can also ask RONIT to pass the distress to RCC Haifa (Mayday Relay).' }
    ] }
  ]
},
{
  id: 'pp4-dagger', set: 'practice', src: PP_SRC, name: '4 · DAGGER', what: 'Listing, in danger of capsizing',
  paper: ['Process Exercise #4', ...PP], rules: [],
  story: ['You are sailing on the yacht DAGGER MMSI 428777999. At 00:22 local time the yacht is listing on its side and in danger of capsizing. The skipper gives the order to call for immediate help. The location of the incident is 34 degrees and 13 minutes north, 34 degrees and 10 minutes east. On board your yacht there are 7 people. Your vessel is equipped according to GMDSS requirements for sailing in area 1AREA A.'],
  parts: [
    { label: 'A', text: 'Prepare and record the type of message you will transmit including all procedures.' },
    { label: 'B', text: 'Briefly explain what the message means:\n“Mayday Dagger this is Dugit ETA to distress position 45 minutes over.”' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'DAGGER, MMSI 428777999, 00:22 local (21:22 UTC the previous day, in summer), listing and in danger of capsizing, 34°13\'N 034°10\'E, 7 persons on board. Message type: MAYDAY (distress) – immediate danger to life.' },
      EPIRB_STEP, dscStep('Listing & Capsizing'),
      vhfStep(['MAYDAY MAYDAY MAYDAY', 'THIS IS DAGGER DAGGER DAGGER 428777999', 'MAYDAY DAGGER', 'Three four degrees one three minutes North', 'Zero three four degrees one zero minutes East', 'Listing, in danger of capsizing', 'Require immediate assistance', 'Seven persons on board', 'OVER']),
      ABANDON_IF
    ] },
    { label: 'B', blocks: [
      { p: 'DUGIT has received DAGGER’s distress and is reporting that she will reach the distress position in 45 minutes. The word MAYDAY marks it as distress traffic. DAGGER answers:' },
      { msg: ['MAYDAY', 'DUGIT', 'THIS IS DAGGER DAGGER', 'Proceed and stand by on channel one six', 'OVER'] }
    ] }
  ]
},
{
  id: 'pp5-rafsody', set: 'practice', src: PP_SRC, name: '5 · RAFSODY', what: 'Hit by a naval shell',
  paper: ['Process Exercise No. 5', ...PP], rules: [],
  story: ['On Wednesday at 04:00 UTC, the yacht RAFSODY 235090807 MMSI struck a naval shell in the bow and began to sink. The yacht’s position is 34 degrees 20 minutes North, 34 degrees 47 minutes East. The skipper is in command of abandoning the vessel. There are 3 crew members and 3 passengers on board. The yacht is authorized to sail in AREA 1A and is equipped in accordance with GMDSS requirements.'],
  parts: [
    { label: 'A', text: 'Prepare and record all procedures necessary to obtain immediate assistance, indicating your preparations in the event of abandonment.' },
    { label: 'B', text: 'It is likely that RAFSODY has entered a naval firing zone. By what means does a mariner know in advance about such firing zones?' },
    { label: 'C', text: 'On which channel(s) can you notify the Navy that you are hit in order to try to prevent further shells from being fired at you?' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'RAFSODY, MMSI 235090807, Wednesday 04:00 UTC, hit by a naval shell in the bow and sinking, 34°20\'N 034°47\'E, 6 persons on board (3 crew + 3 passengers), skipper ordering abandon ship. Message type: MAYDAY.' },
      EPIRB_STEP, dscStep('Sinking (Abandoning ship if the order is already given)'),
      vhfStep(['MAYDAY MAYDAY MAYDAY', 'THIS IS RAFSODY RAFSODY RAFSODY 235090807', 'MAYDAY RAFSODY', 'Three four degrees two zero minutes North', 'Zero three four degrees four seven minutes East', 'Hit by a shell, sinking, abandoning ship', 'Require immediate assistance', 'Six persons on board', 'OVER']),
      ABANDON_IF
    ] },
    { label: 'B', blocks: [
      { list: ['NAVTEX navigational warnings (message type A) on 518 kHz.', 'SECURITE navigational warnings broadcast by the coast station (Haifa Radio) on Ch 16, then a working channel.', 'Notices to Mariners (Israeli “NX” notices) and NAVAREA warnings – Israel is in NAVAREA III.', 'Firing practice areas marked on the nautical chart.'] }
    ] },
    { label: 'C', blocks: [
      { list: ['Channel 16 – distress channel, monitored by the Navy and RCC Haifa.', 'Channel 11 – used by the Israeli Navy for vessel-movement traffic.', 'The DSC alert on Channel 70 also reaches them automatically.'] }
    ] }
  ]
},
{
  id: 'pp6-nesher', set: 'practice', src: PP_SRC, name: '6 · NESHER', what: 'Fire, off Herzliya',
  paper: ['Process Exercise No. 6', ...PP], rules: [],
  story: ['The vessel you are sailing on 7 NESHER 42866600 4XSA is located 12 nautical miles west of the Herzliya Marina. The vessel is on fire and there is an immediate danger to the lives of the five people on board. The skipper intends to abandon ship and instructs you to execute an orderly and immediate request for help. The yacht is authorized to sail in the 1A AREA and is equipped in accordance with the GMDSS requirements.'],
  parts: [
    { label: 'A', text: 'Prepare and record the type of message you will transmit, including all procedures.' },
    { label: 'B', text: 'In the midst of the distress traffic, LEA hears on channel 16:\n“Haifa Radio this is Oren TR over”\nHow will LEA respond?' },
    { label: 'C', text: 'The Haifa Coast Station allows for a cautious termination of the distress situation. What communication term will she use?' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'NESHER, call sign 4XSA, MMSI read as 428666007 (the question text is scrambled – use the MMSI you are given), 12 nm west of Herzliya Marina, on fire, 5 persons on board, skipper intends to abandon. Message type: MAYDAY.' },
      EPIRB_STEP, dscStep('Fire & Explosion'),
      vhfStep(['MAYDAY MAYDAY MAYDAY', 'THIS IS NESHER NESHER NESHER 428666007', 'MAYDAY NESHER', 'One two miles west of Herzliya Marina', 'Fire on board, in danger of sinking', 'Require immediate assistance', 'Five persons on board', 'OVER'], ' (a relative position is acceptable)'),
      ABANDON_IF
    ] },
    { label: 'B', blocks: [
      { p: 'OREN is sending routine traffic (Tango Romeo) on Ch 16 during radio silence. LEA is neither the vessel in distress nor the controlling station, so she uses SEELONCE DISTRESS:' },
      { msg: ['MAYDAY', 'OREN', 'SEELONCE DISTRESS', 'THIS IS LEA'] },
      { p: '(If NESHER or Haifa Radio silenced OREN, they would say “OREN SEELONCE MAYDAY”.)' }
    ] },
    { label: 'C', blocks: [
      { p: 'Cautious end of distress – PRUDONCE:' },
      { msg: ['MAYDAY', 'ALL STATIONS ALL STATIONS ALL STATIONS', 'THIS IS HAIFA RADIO HAIFA RADIO HAIFA RADIO', 'Time <hh mm> UTC', 'NESHER PRUDONCE', 'OUT'] },
      { p: 'PRUDONCE means restricted, careful working may resume on Ch 16, but the distress is not yet over.' }
    ] }
  ]
},
{
  id: 'pp7-shoshi', set: 'practice', src: PP_SRC, name: '7 · SHOSHI', what: 'Collision',
  paper: ['Process Exercise #7', ...PP], rules: [],
  story: ['The yacht SHOSHI 428555011 MMSI was located at position 034˚19΄E 34˚31΄N at 02:00 UTC when a large vessel touched her bow and continued on. SHOSHI is in danger of sinking. The skipper directs you to obtain immediate assistance. Your vessel is authorized to sail in AREA A1 and is equipped in accordance with the requirements of the GMDSS.'],
  parts: [
    { label: 'A', text: 'Prepare and record the type of message you will transmit, including all procedures.' },
    { label: 'B', text: 'Explain in detail the meaning of the following message:\nMAYDAY\nALL STATIONS x3\nTHIS IS\nVERED x3\nTIME ONE SIX THREE TWO SHOSHI 428555011 PRUDONCE' },
    { label: 'C', text: 'Explain the following terms\n- MAYDAY RELAY\n- SEELONCE DISTRESS\n- TOWAGE' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'SHOSHI, MMSI 428555011, 02:00 UTC, hit on the bow by a large vessel that carried on, in danger of sinking. The question writes the position longitude-first; on air it is 34°31\'N 034°19\'E. Number aboard not given. Message type: MAYDAY.' },
      EPIRB_STEP, dscStep('Collision'),
      vhfStep(['MAYDAY MAYDAY MAYDAY', 'THIS IS SHOSHI SHOSHI SHOSHI 428555011', 'MAYDAY SHOSHI', 'Three four degrees three one minutes North', 'Zero three four degrees one nine minutes East', 'Collision with unknown vessel, in danger of sinking', 'Require immediate assistance', '<Number> persons on board', 'OVER']),
      ABANDON_IF
    ] },
    { label: 'B', blocks: [
      { list: ['MAYDAY – the message belongs to distress traffic.', 'ALL STATIONS ×3 / THIS IS VERED ×3 – VERED is the station controlling SHOSHI’s distress and is speaking to everyone.', 'TIME ONE SIX THREE TWO – the time of the announcement (16:32 UTC).', 'SHOSHI 428555011 – the distress it refers to.', 'PRUDONCE – restricted, careful use of Ch 16 may resume. The distress is not over, so radio discipline still applies.'] }
    ] },
    { label: 'C', blocks: [
      { list: ['MAYDAY RELAY – a distress message sent by a station that is not in distress on behalf of one that is. Used when a distress call goes unanswered, is cut off, the vessel cannot transmit, or the vessel, a coast station or the controlling station asks for a relay.', 'SEELONCE DISTRESS – an order to stop interfering with distress traffic, given by any station other than the vessel in distress or the controlling station (they use SEELONCE MAYDAY).', 'TOWAGE – one vessel pulling another, e.g. after engine, rudder or mast failure. Requested as urgency traffic: PANPAN … “Need towing urgently”.'] }
    ] }
  ]
},
{
  id: 'pp8-zodiak', set: 'practice', src: PP_SRC, name: '8 · ZODIAK', what: 'Water ingress',
  paper: ['Process Exercise No. 8', ...PP], rules: [],
  story: ['The yacht ZODIAK 366000818 MMSI is located at 33°51´N 033°59´E at 02:00 local time. The vessel is in danger of sinking due to water ingress. The skipper directs you to obtain immediate assistance. The yacht is authorized to sail in AREA A1 and is equipped in accordance with GMDSS requirements.'],
  parts: [
    { label: 'A', text: 'Prepare and record the type of message you will transmit including all procedures.' },
    { label: 'B', text: 'Explain in detail the meaning of the following message:\n“PANPAN at 03:37 15 miles west of TEL AVIV marina lost rudder drifting west at 2 knots”' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'ZODIAK, MMSI 366000818, 33°51\'N 033°59\'E, 02:00 local (23:00 UTC the previous day, in summer), in danger of sinking from water ingress. Number aboard not given. Message type: MAYDAY.' },
      EPIRB_STEP, dscStep('Flooding'),
      vhfStep(['MAYDAY MAYDAY MAYDAY', 'THIS IS ZODIAK ZODIAK ZODIAK 366000818', 'MAYDAY ZODIAK', 'Three three degrees five one minutes North', 'Zero three three degrees five nine minutes East', 'Taking water, in danger of sinking', 'Require immediate assistance', '<Number> persons on board', 'OVER']),
      ABANDON_IF
    ] },
    { label: 'B', blocks: [
      { list: ['PANPAN – an urgency message (second priority): the vessel has a problem but there is no immediate danger to life.', 'At 03:37 – time of the event / report.', '15 miles west of Tel Aviv Marina – its position, given relative to a known point.', 'Lost rudder – the problem: it cannot steer.', 'Drifting west at 2 knots – its drift, so rescuers can predict where it will be.'] },
      { p: 'The vessel will usually need a tow. A full PANPAN would also include PANPAN ×3, the addressee ×3, “this is” + name ×3 and MMSI, and the help needed.' }
    ] }
  ]
},
{
  id: 'pp9-saute', set: 'practice', src: PP_SRC, name: '9 · SAUTE', what: 'Rapid flooding, not abandoning yet',
  paper: ['Process Exercise No. 9', ...PP], rules: [],
  story: ['You are sailing on the yacht SAUTE 233211211. Water is rapidly entering the vessel. The skipper gives you an order to call for immediate help and informs you not to abandon the vessel. The location of the incident is 34 degrees 44 minutes north 33 degrees 59 minutes east. There are 7 people on board your yacht. Your vessel is authorized to sail in AREA A1 and is equipped in accordance with the requirements of the GMDSS.'],
  parts: [
    { label: 'A', text: 'Prepare and record all the procedures necessary to obtain immediate help, indicating your actions in the event of abandonment.' },
    { label: 'B', text: 'The distress situation has ended and you are supervising your distress. Who will you notify when the distress situation has ended?' },
    { label: 'C', text: 'On which channel will this announcement be made?' },
    { label: 'D', text: 'What is the media term for the end of a state of emergency?' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'SAUTE, MMSI 233211211, 34°44\'N 033°59\'E, water rapidly entering, 7 persons on board; skipper says do not abandon yet. Message type: MAYDAY.' },
      EPIRB_STEP, dscStep('Flooding'),
      vhfStep(['MAYDAY MAYDAY MAYDAY', 'THIS IS SAUTE SAUTE SAUTE 233211211', 'MAYDAY SAUTE', 'Three four degrees four four minutes North', 'Zero three three degrees five nine minutes East', 'Taking water rapidly, in danger of sinking', 'Require immediate assistance', 'Seven persons on board', 'OVER']),
      ABANDON_IF
    ] },
    { label: 'B', blocks: [ { p: 'As the station controlling the distress, you notify all stations (including RCC Haifa / Haifa Radio and every unit that took part).' } ] },
    { label: 'C', blocks: [ { p: 'Channel 16, High power.' } ] },
    { label: 'D', blocks: [
      { p: 'SEELONCE FEENEE:' },
      { msg: ['MAYDAY', 'ALL STATIONS ALL STATIONS ALL STATIONS', 'THIS IS SAUTE SAUTE SAUTE 233211211', 'Time <hh mm> UTC', 'SAUTE SEELONCE FEENEE', 'OUT'] }
    ] }
  ]
},
{
  id: 'pp10-runner', set: 'practice', src: PP_SRC, name: '10 · RUNNER', what: 'Struck a submerged rock',
  paper: ['Process Exercise #10', 'DISTRESS, URGENCY, SAFETY AND MEDICAL'], rules: [],
  story: ['At position 34°21\'N 034°29\'E, your vessel 234555044 RUNNER has struck a submerged rock, water is entering the vessel and there is danger to the vessel and crew. You are required by the skipper to obtain immediate assistance and at the same time the skipper informs the 5-person crew to prepare to abandon ship within a few minutes. Your ship is authorized to sail in AREA A1 and is equipped in accordance with GMDSS requirements.'],
  parts: [
    { label: 'A', text: 'Prepare and record the type of message you will transmit, including all procedures.' },
    { label: 'B', text: 'Explain the following phrases/terms:\n- NAVAREA\n- Gale warning\n- Spell your name\n- Floating mine\n- OSC' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'RUNNER, MMSI 234555044, 34°21\'N 034°29\'E, struck a submerged rock, water entering, 5 persons on board, preparing to abandon within minutes. Message type: MAYDAY.' },
      EPIRB_STEP, dscStep('Grounding (or Flooding)'),
      vhfStep(['MAYDAY MAYDAY MAYDAY', 'THIS IS RUNNER RUNNER RUNNER 234555044', 'MAYDAY RUNNER', 'Three four degrees two one minutes North', 'Zero three four degrees two nine minutes East', 'Struck submerged rock, taking water, in danger of sinking', 'Preparing to abandon ship', 'Require immediate assistance', 'Five persons on board', 'OVER']),
      ABANDON_IF
    ] },
    { label: 'B', blocks: [
      { list: ['NAVAREA – one of 21 world areas (16 + 5 Arctic areas added in 2010) used to coordinate navigational and weather warnings. Israel is in NAVAREA III (Mediterranean and Black Sea).', 'Gale warning – a meteorological warning of wind of Beaufort force 8 (34–40 knots) or more. Sent by SECURITE on Ch 16 and by NAVTEX (type B).', 'Spell your name – a request to spell your vessel’s name with the phonetic alphabet, e.g. “I spell: Romeo Uniform November November Echo Romeo”.', 'Floating mine – a danger to navigation, reported as a SECURITE navigational warning: “SECURITE ×3, All stations ×3, This is …, Navigational warning, Floating mine, position …, Dangerous for navigation, Ships in vicinity keep sharp lookout, OUT”.', 'OSC (On-Scene Commander) – the person appointed by the RCC to coordinate the search and rescue units at the scene.'] }
    ] }
  ]
},
{
  id: 'pp11-vera', set: 'practice', src: PP_SRC, name: '11 · VERA', what: 'You are the helper: Mayday cut off, no answer',
  paper: ['Process Exercise No. 11', ...PP], rules: [],
  story: ['You are sailing and hear on the radio:', { quote: true, text: 'Mayday x3\nThis is Vera x3 428123456\nMayday Vera\nPosition 32°53\' N' }],
  parts: [
    { label: 'A', text: 'The contact has been lost, you continue to listen. The contact is not renewed and there is no response from other stations. What should you do?' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'You heard a fragment of VERA’s distress (MMSI 428123456, “position 32°53\'N”), contact was lost and nobody answered. You must send a MAYDAY RELAY.' },
      { list: ['1. Note the time and everything heard in the log.', '2. On Ch 16, High/25 W, send a Mayday Relay – to the coast station first (RCC Haifa) if in range, otherwise to all stations.', '3. Keep listening on Ch 16 and proceed towards the area if you can help safely.'] },
      { msg: ['MAYDAY RELAY MAYDAY RELAY MAYDAY RELAY', 'RCC HAIFA RCC HAIFA RCC HAIFA (or ALL STATIONS x3)', 'THIS IS <MY VESSEL> <MY VESSEL> <MY VESSEL> <MY MMSI>', 'Following received from VERA 428123456', 'on channel one six at time <hh mm> UTC', 'Quote "MAYDAY VERA, position three two degrees five three minutes North" Unquote', 'Rest of message not received, contact lost', 'Ships in vicinity report and assist', 'OVER'] }
    ] }
  ]
},
{
  id: 'pp12-dryx', set: 'practice', src: PP_SRC, name: '12 · DRYX MARIOS', what: 'Fire, 16 on board',
  paper: ['Process Exercise No. 12', ...PP], rules: [],
  story: ['Tuesday 23/12/08 UTC 08:31 Your vessel DRYX MARIOS 211206777 MMSI is in position 33.40 North 33.25 East and is on fire. The vessel is in danger of sinking. The captain gives the order to obtain immediate assistance. On board the vessel there are 16 crew and passengers. The vessel is authorized to sail in AREA A1 and is equipped in accordance with the requirements of the GMDSS.'],
  parts: [
    { label: 'A', text: 'Describe your actions to obtain the necessary assistance' },
    { label: 'B', text: 'Justify the use of the term PANPAN' },
    { label: 'C', text: 'Justify the use of the term SEELONCE DISTRESS' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'DRYX MARIOS, MMSI 211206777, Tuesday 23/12/08 08:31 UTC, 33°40\'N 033°25\'E, on fire and in danger of sinking, 16 persons on board. Message type: MAYDAY.' },
      EPIRB_STEP, dscStep('Fire & Explosion'),
      vhfStep(['MAYDAY MAYDAY MAYDAY', 'THIS IS DRYX MARIOS DRYX MARIOS DRYX MARIOS 211206777', 'MAYDAY DRYX MARIOS', 'Three three degrees four zero minutes North', 'Zero three three degrees two five minutes East', 'Fire on board, in danger of sinking', 'Require immediate assistance', 'One six persons on board', 'OVER']),
      ABANDON_IF
    ] },
    { label: 'B', blocks: [
      { p: 'PANPAN is the urgency signal (second priority): a problem with the safety of a vessel or person without immediate danger to life – e.g. machinery failure, a medical case (MEDICO), or a need for a tow. It is not right here: the fire puts 16 lives in immediate danger, so MAYDAY is required. PANPAN would only fit if the fire were under control and you wanted a coast station on standby.' }
    ] },
    { label: 'C', blocks: [
      { p: 'SEELONCE DISTRESS orders a station interfering with distress traffic to stop transmitting. It is used by any station other than the vessel in distress or the controlling station. DRYX MARIOS itself would use SEELONCE MAYDAY:' },
      { msg: ['MAYDAY', 'ALL STATIONS SEELONCE MAYDAY'] }
    ] }
  ]
},
{
  id: 'pp13-rita', set: 'practice', src: PP_SRC, name: '13 · RITA', what: 'Dangerous list',
  paper: ['Practice Procedure No. 13', ...PP], rules: [],
  story: ['At position 34001 \'N 34019 \'E, at local time 12:12 (on the yacht MMSI 428666022, RITA) your vessel with 5 passengers is in danger of sinking due to a dangerous inclination on its side. The skipper directs you to obtain immediate assistance. Your vessel is equipped according to GMDSS requirements in AREA 1A.'],
  parts: [
    { label: 'A', text: 'Prepare and record the type of message you will transmit including all procedures' },
    { label: 'B', text: 'The distress situation has ended and you are monitoring your distress, to whom will you notify the end of the distress situation?' },
    { label: 'C', text: 'On which channel will you announce this message?' },
    { label: 'D', text: 'What is the communication term expressing the end of a distress situation?' }
  ],
  answer: [
    { label: 'A', blocks: [
      { p: 'RITA, MMSI 428666022, 34°01\'N 034°19\'E (“34001 \'N 34019 \'E” in the question), 12:12 local (09:12 UTC in summer), dangerous list, in danger of sinking, 5 passengers. Message type: MAYDAY.' },
      EPIRB_STEP, dscStep('Listing & Capsizing'),
      vhfStep(['MAYDAY MAYDAY MAYDAY', 'THIS IS RITA RITA RITA 428666022', 'MAYDAY RITA', 'Three four degrees zero one minutes North', 'Zero three four degrees one nine minutes East', 'Dangerous list, in danger of sinking', 'Require immediate assistance', 'Five persons on board', 'OVER']),
      ABANDON_IF
    ] },
    { label: 'B', blocks: [ { p: 'All stations (including RCC Haifa and all units that took part), because you are the station controlling the distress.' } ] },
    { label: 'C', blocks: [ { p: 'Channel 16.' } ] },
    { label: 'D', blocks: [
      { p: 'SEELONCE FEENEE:' },
      { msg: ['MAYDAY', 'ALL STATIONS ALL STATIONS ALL STATIONS', 'THIS IS RITA RITA RITA 428666022', 'Time <hh mm> UTC', 'RITA SEELONCE FEENEE', 'OUT'] }
    ] }
  ]
}
];
WRITTEN.push(...PRACTICE);
