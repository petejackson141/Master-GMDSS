# Master GMDSS

A suite of GMDSS training tools, built as one installable web app (PWA).
Version 1.6.0. Styled like Sail la Vie (Space Grotesk, Inter, Playfair Display; navy, teal and coral).

The home screen has four sections, each with its own menu page:

| Section | Menu page | Modules |
|---|---|---|
| Study | `study/` | Cheat sheets (one section at a time, including call signs), equipment cards (including NAVTEX) |
| Simulators | `simulators/` | VHF / DSC (`vhf/`), NAVTEX (`navtex/`), EPIRB (`epirb/`), Radar SART (`sart/`), portable VHF (`portable/`). Coming soon: AIS-SART / AIS-EPIRB / AIS |
| Exams | `exams/` | Multiple-choice exams (`quiz/`), written-answer exams (`written/`) |
| Scenarios | `scenarios/` | Coming soon: Mayday, abandon ship |

## What each file does

```
master-gmdss/
├─ index.html              Home screen: the four section buttons, then shortcuts
├─ manifest.webmanifest    App name, icons and colours. This is what makes the phone offer "Install"
├─ sw.js                   Service worker: saves the app on the phone for offline use and picks up updates
├─ .nojekyll               Tells GitHub Pages to serve the files exactly as they are
├─ icons/                  App icons (home screen, Android, iPhone)
├─ shared/                 Used by every module
│  ├─ css/base.css         The theme: fonts, colours (light and dark), background, Home button, menu rows
│  ├─ css/study.css        Puts the study pages onto the theme (loaded after their own styles)
│  ├─ img/contour.svg      Faint depth-contour background (same as Sail la Vie)
│  ├─ js/app.js            Registers the service worker, "Install app" button, version number
│  └─ js/study.js          Study pages: shows one section at a time, with Previous / Next
├─ study/index.html        Study menu
├─ simulators/index.html   Simulators menu
├─ exams/index.html        Exams menu
├─ scenarios/index.html    Scenarios menu (coming soon)
├─ vhf/                    VHF / DSC Simulator
│  ├─ index.html           The page: radio drawing, buttons, panels
│  ├─ css/vhf.css          Layout, radio, LCD screens, results
│  └─ js/                  Loaded in this order:
│     ├─ core.js           Small helpers, your vessel name/MMSI, how numbers are spoken
│     ├─ checking.js       Cleans up speech-recognition text and checks each part of a call
│     ├─ scenarios.js      All practice situations: facts, steps, model calls, checks
│     ├─ voice.js          The other station speaking, and listening to you (PTT)
│     ├─ radio.js          The radio itself: screens, keys, DSC menus, distress button
│     └─ trainer.js        Runs a scenario: guided steps, advanced mode, results, reset
├─ navtex/                 NAVTEX Simulator
│  ├─ index.html
│  ├─ css/navtex.css       The receiver drawing, green screens, exercises, quiz
│  └─ js/                  Loaded in this order:
│     ├─ data.js           Stations, message types, all message texts, broadcasts
│     ├─ receiver.js       The receiver: keys, every screen, settings, reception rules
│     ├─ docs.js           Instruction book and station map
│     └─ trainer.js        Free practice, exercises, decoding quiz, reception log
├─ epirb/                  EPIRB Simulator (float-free 406 MHz beacon, Cospas-Sarsat alert chain)
│  ├─ index.html           The page: scene, unit controls, status strip, tabs
│  ├─ css/epirb.css        Phone-first layout; two columns from 900px
│  └─ js/epirb.js          The beacon, alert chain, scenarios and screen updates
├─ sart/                   Radar SART Simulator (9 GHz SART and the rescue ship's radar)
│  ├─ index.html           The page: scene, unit controls, radar screen, status strip, tabs
│  ├─ css/sart.css         Same layout as the EPIRB module, plus the radar screen
│  └─ js/sart.js           The SART, rescue ship, radar drawing, scenarios and screen updates
├─ portable/               Portable VHF Simulator (survival craft VHF, liferaft, rescue ship NESHER)
│  ├─ index.html           The page: scene, handheld radio, status strip, tabs
│  ├─ css/portable.css     Same layout as the EPIRB and SART modules, plus the radio front panel
│  └─ js/portable.js       The radio, liferaft, rescue ship, scenarios and screen updates
├─ quiz/                   Multiple-choice exams
│  ├─ index.html
│  ├─ css/quiz.css
│  └─ js/questions.js      All questions, answer keys, explanations and topics
│     js/quiz.js           Runs the exams; progress saved on the phone
├─ written/                Written-answer (scenario) exams
│  ├─ index.html
│  ├─ css/written.css
│  └─ js/data.js           The 8 exam papers and model answers (as on the answer sheets), Learn-mode "why" notes
│     js/written.js        Exam mode (timer, writing, marking), Learn mode, model answer; progress saved on the phone
└─ study/                  Study pages (read on the phone one section at a time, or print)
```

## Making changes

1. Edit the files.
2. Open `sw.js` and raise `VERSION` (for example `v1.0.0` → `v1.0.1`). Also update `MG_VERSION` in `shared/js/app.js`.
   Without this, phones keep showing the old saved copy.
3. If you add a new file, add it to the `FILES` list in `sw.js` so it works offline.
4. Upload / push to GitHub. The site updates in about a minute.
5. Note what changed in `CHANGELOG.md`.

## Adding a new module

Create a folder (for example `sart/`) with its own `index.html`. In its `<head>` link
`../manifest.webmanifest`, `../shared/css/base.css`, and at the end of `<body>` load `../shared/js/app.js`.
Start the page with the Home button and the back pill to its section (copy the `<nav class="mg-topnav">` from `epirb/index.html`).
Use only the theme's colour names from `base.css` (no new fonts or colours), and check it at phone width in light and dark.
Then add a row for it on its section menu (for example `simulators/index.html`, replacing the "Coming soon" row),
and add its files to `FILES` in `sw.js`.

## Content

Procedures follow the Yam Sailing GMDSS course notes. Station replies, practice MMSIs and some
"how to check" steps were written for this app and should be reviewed by an instructor before students rely on them.
