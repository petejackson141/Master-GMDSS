# Master GMDSS — backup and restore steps

Written 30 October 2026, for version **1.8.5** (live). Backup steps updated 14 November 2026
(one-click Monday backup, RAR files). Keep a copy of this file
in Google Drive and on the recovery USB stick, as well as here in the project.

## What there is to back up

| What | Where it lives | Backed up by |
|---|---|---|
| The app's code (all pages, simulators, exams, icons) | `C:\Users\Pete\master-gmdss` on the laptop | **GitHub**: `github.com/petejackson141/master-gmdss` (public). Every double-click of `save-and-publish.bat` sends the latest copy there. |
| The live app | GitHub Pages: **https://petejackson141.github.io/master-gmdss/** | Rebuilt automatically from GitHub. Nothing extra to keep. |
| A full copy of the code, with its Git history | `master-gmdss-backup-DD.MM.YYYY.rar`, made every Monday by `Documents\App backups\Back up ALL apps.bat` (older copies are `.zip`) | Master GMDSS Google Drive: **Maintenance**, and the recovery USB stick (Master GMDSS folder) |
| The backup scripts themselves | `backup-scripts-DD.MM.YYYY.rar`, made in the same Monday run | Recovery USB stick (Backup scripts) and main Google Drive (petejackson141) > Backup scripts |
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

**If GitHub itself were ever gone:** extract the latest `master-gmdss-backup-DD.MM.YYYY.rar`
from Google Drive into `C:\Users\Pete` (right-click > WinRAR > Extract Here; it holds the
`master-gmdss` folder itself), make a new empty repository called `master-gmdss` on GitHub,
and follow `SETUP.md` (steps 1 to 3) to put it online again. An older `.zip` backup is
unzipped into `C:\Users\Pete\master-gmdss` instead.

**Getting the one-click backup back:** if the whole laptop was lost, install WinRAR, then
extract the newest `backup-scripts-DD.MM.YYYY.rar` (USB stick > Backup scripts, or Google
Drive > Backup scripts) into `C:\Users\Pete\Documents\App backups`.

## Keeping the backup up to date

- **Every change:** double-click `save-and-publish.bat` (it sends everything to GitHub).
- **Every Monday at 19:00:** double-click `Documents\App backups\Back up ALL apps.bat`. It makes a
  tested `master-gmdss-backup-DD.MM.YYYY.rar` (and `backup-scripts-DD.MM.YYYY.rar`); copy them to
  Google Drive and the recovery USB stick as the "Backup procedure: Master GMDSS" doc says.
- After a restore, do a **practice restore test** once on another laptop (like Interval Studio),
  then remove the files and GitHub sign-in from that laptop afterwards.
