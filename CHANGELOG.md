# Changelog

## 1.4.1 — 22 October 2026
- Radar SART facts corrected to match how the course teaches it: range from a ship about 8–10 nm, from an aircraft about 30–40 nm, dots become arcs somewhere between 1 and 5 nm.
- Simulator ranges raised to match: about 9 nm on the pole, 3–4 nm in the canopy, about 3 nm floating. Arcs now appear from 2 nm.

## 1.4.0 — 21 October 2026
- New module: Radar SART Simulator (sart/). A 9 GHz radar SART drawn like the real orange unit: OFF / ON switch under a safety tab, press-and-hold self-test, Standby / Radar / Pass / Fault lights. Take it from the bracket into the liferaft, onto its pole or into the sea; height changes how far away it can be seen (about 2 nm floating, 6 nm on the pole).
- Live X-band radar screen with a 3 / 6 / 12 nm range: the SART shows as a line of 12 dots, then arcs within about 1 nm, then circles when very close. A rescue ship searches, picks it up and homes in. Tap the screen to mark the SART.
- Six scenarios: free practice, monthly test (rings on your own radar), abandon ship, get it higher, on the rescue ship's radar, pre-departure label inspection.
- Simulators menu: SART is now live (was "Coming soon"). App shortcut added.

## 1.3.0 — 21 October 2026
- New home screen with four sections: Study, Simulators, Exams and Scenarios. Each opens its own menu page; planned modules show as "Coming soon".
- New module: EPIRB Simulator (epirb/). Float-free 406 MHz Cat I beacon: guarded OFF / READY / ON switch, press-and-hold self-test and GNSS test, HRU release at 1.5–4 m, sea switch, 406 MHz bursts every ~50 s, 121.5 MHz homing, strobe, GNSS fix, and the Cospas-Sarsat chain (satellite, LUT, MCC, RCC, rescue). Six scenarios: free practice, monthly self-test, abandon ship, vessel sinks, accidental activation (with cancelling the false alert), pre-departure label inspection. Built for phones first.
- NAVTEX Simulator now sits in the Simulators menu (with VHF / DSC and EPIRB).
- Study pages moved onto the app's theme (they still had the old orange look and their Home button was unstyled). Cheat sheets, equipment cards and call signs now show one section at a time with Previous / Next; "All" shows everything, and printing still prints every section.
- Every module has a second pill next to Home that goes back to its section menu.
- Dark mode: menu icons sit on a light chip so they stay visible.
- App shortcuts: Simulators, Exams, Study, EPIRB Simulator.

## 1.2.0 — 20 October 2026
- New module: NAVTEX Simulator (navtex/). A receiver that works like the course's Flash simulator: Power, FRQ (518 / 490 / 4209.5 kHz), DIM, DISPL message log, and the full MENU (station selection AUTO/MANUAL, message selection with A, B, D, L fixed, receive alarm, error rate, save message, time display, default setting, delete all / one, test, status, 12/24 hour, all clear).
- "On the air" broadcasts: transmit a message and the receiver applies the real rules (frequency, station, message type, duplicates, VITAL 00, error rate). The reception log says why each one was or wasn't printed.
- 8 exercises with step ticks and questions, and a decoding quiz (10 random questions).
- Instruction book (English version of the course's NAVTEX instructions) and an Eastern Mediterranean station map.
- Home screen: NAVTEX button and card are now live; app shortcut added.

## 1.1.3 — 20 October 2026
- New logo and app icons: a sailboat sending radio waves from the masthead, on a light sky-to-dawn background. Source drawing saved as icons/logo.svg.

## 1.1.2 — 20 October 2026
- Clear Home button (house icon) at the top of the simulator, exams and study pages; it stays visible while scrolling.

## 1.1.1 — 20 October 2026
- Home: Multiple-choice exams button now the same style and size as the VHF/DSC Simulator button.
- VHF page: restored the side margins and spacing (header, vessel/MMSI fields, scenario box).

## 1.1.0 — 20 October 2026
- Whole app restyled to match Sail la Vie: fonts, colours, ivory cards, pill buttons, reef background with depth contours, light and dark mode.
- New home screen in the Sail la Vie layout.
- Multiple-choice exams added as a module (quiz/): 24 exams, topic practice, mistakes list.
- Icon recoloured to the new palette.

## 1.0.0 — 19 October 2026
- First version as the Master GMDSS suite (installable web app).
- VHF / DSC Simulator: guided and advanced levels, 10 situations, DSC menus as in the course simulator,
  voice recognition with PTT, reset situation, debrief.
- Study cards: GMDSS cheat sheets, equipment cards, call signs and NAVTEX.
- Works offline after the first visit (voice recognition needs internet).
