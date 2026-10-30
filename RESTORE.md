# Master GMDSS — backup and restore steps

Written 30 October 2026, for version **1.8.5** (live). Keep a copy of this file
in Google Drive and on the recovery USB stick, as well as here in the project.

## What there is to back up

| What | Where it lives | Backed up by |
|---|---|---|
| The app's code (all pages, simulators, exams, icons) | `C:\Users\Pete\master-gmdss` on the laptop | **GitHub**: `github.com/petejackson141/master-gmdss` (public). Every double-click of `save-and-publish.bat` sends the latest copy there. |
| The live app | GitHub Pages: **https://petejackson141.github.io/master-gmdss/** | Rebuilt automatically from GitHub. Nothing extra to keep. |
| A full copy of the code without Git | `master-gmdss-backup-<date>.zip` | Google Drive: **Apps > Master GMDSS > Maintenance**, and the recovery USB stick |
| Login | GitHub account `petejackson141` (two-factor sign-in with Google Authenticator) | **Bitwarden**, plus the recovery codes on paper |

**Not needed for this app:** no database (no Supabase), no Android signing key,
no Google Play or Apple accounts, no secret keys. Everything a student does
(exam scores, progress) is saved on their own phone only.

## Tools needed on a new laptop

1. **Git for Windows**: https://git-scm.com/download/win (all the default options are fine).
2. **A browser** (Chrome) to check the live app.
3. Optional: **Visual Studio Code** to look at or edit the files.

Node.js and Android Studio are **not** needed for Master GMDSS (they are for Sail la Vie and Interval Studio).

## Restore on a new laptop (about 10 minutes)

1. Install Git (above).
2. Open **Command Prompt** and run, one line at a time:
   ```
   cd C:\Users\Pete
   git clone https://github.com/petejackson141/master-gmdss.git
   cd master-gmdss
   git config user.name "Pete Jackson"
   git config user.email "petejackson141@gmail.com"
   ```
   This makes the folder `C:\Users\Pete\master-gmdss` with everything in it.
3. Check it's all there: the folder has `index.html`, `sw.js`, `save-and-publish.bat`,
   `CHANGELOG.md` and the module folders (`vhf`, `navtex`, `epirb`, `sart`, `portable`,
   `ais`, `ais-sart`, `ais-epirb`, `quiz`, `written`, `study` and the rest).
   The top of `CHANGELOG.md` shows the latest version.
4. **Test that publishing works:** add a line to `CHANGELOG.md` (for example
   "Restore test"), save it, then double-click `save-and-publish.bat`.
   The first time, a window asks you to sign in to GitHub: sign in with the
   details from Bitwarden. It should end with "Done. Live in about a minute".
5. Open https://petejackson141.github.io/master-gmdss/ in Chrome and check the app opens.

**If GitHub itself were ever gone:** unzip the latest `master-gmdss-backup-<date>.zip`
from Google Drive into `C:\Users\Pete\master-gmdss`, make a new empty repository called
`master-gmdss` on GitHub, and follow `SETUP.md` (steps 1 to 3) to put it online again.

## Keeping the backup up to date

- **Every change:** double-click `save-and-publish.bat` (it sends everything to GitHub).
- **Every few weeks, or after a big change:** ask Claude for a fresh
  `master-gmdss-backup-<date>.zip` and move it to Google Drive (Apps > Master GMDSS > Maintenance),
  and copy it onto the recovery USB stick.
- After a restore, do a **practice restore test** once on another laptop (like Interval Studio),
  then remove the files and GitHub sign-in from that laptop afterwards.
