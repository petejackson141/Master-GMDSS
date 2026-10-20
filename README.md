# Master GMDSS

A suite of GMDSS training tools, built as one installable web app (PWA).
Version 1.1.0. Styled like Sail la Vie (Space Grotesk, Inter, Playfair Display; navy, teal and coral).

| Module | Folder | Status |
|---|---|---|
| VHF / DSC Simulator | `vhf/` | Ready |
| Study cards (cheat sheets, equipment cards, call signs & NAVTEX) | `study/` | Ready |
| NAVTEX Simulator | `navtex/` | Planned |
| Multiple-choice exams (24 SRC exams, topic practice, mistakes list) | `quiz/` | Ready |
| Written-answer exams | `written/` | Planned |

## What each file does

```
master-gmdss/
├─ index.html              Home screen: one card per module
├─ manifest.webmanifest    App name, icons and colours. This is what makes the phone offer "Install"
├─ sw.js                   Service worker: saves the app on the phone for offline use and picks up updates
├─ .nojekyll               Tells GitHub Pages to serve the files exactly as they are
├─ icons/                  App icons (home screen, Android, iPhone)
├─ shared/                 Used by every module
│  ├─ css/base.css         The theme: fonts, colours (light and dark), background, shared pieces
│  ├─ img/contour.svg      Faint depth-contour background (same as Sail la Vie)
│  └─ js/app.js            Registers the service worker, "Install app" button, version number
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
├─ quiz/                   Multiple-choice exams
│  ├─ index.html
│  ├─ css/quiz.css
│  └─ js/questions.js      All questions, answer keys, explanations and topics
│     js/quiz.js           Runs the exams; progress saved on the phone
└─ study/                  Printable study pages
```

## Making changes

1. Edit the files.
2. Open `sw.js` and raise `VERSION` (for example `v1.0.0` → `v1.0.1`). Also update `MG_VERSION` in `shared/js/app.js`.
   Without this, phones keep showing the old saved copy.
3. If you add a new file, add it to the `FILES` list in `sw.js` so it works offline.
4. Upload / push to GitHub. The site updates in about a minute.
5. Note what changed in `CHANGELOG.md`.

## Adding a new module

Create a folder (for example `navtex/`) with its own `index.html`. In its `<head>` link
`../manifest.webmanifest`, `../shared/css/base.css`, and at the end of `<body>` load `../shared/js/app.js`.
Then add a card for it on the home `index.html`, and add its files to `FILES` in `sw.js`.

## Content

Procedures follow the Yam Sailing GMDSS course notes. Station replies, practice MMSIs and some
"how to check" steps were written for this app and should be reviewed by an instructor before students rely on them.
