@echo off
REM ============================================================
REM  Master GMDSS - save and publish
REM  Put this file in C:\Users\Pete\Master-GMDSS and double-click it.
REM  It uploads all your changes (files AND folders) to GitHub.
REM  GitHub Pages then updates the live app in about a minute.
REM ============================================================

REM Work in the folder this file is in
cd /d "%~dp0"

echo.
echo  Master GMDSS - save and publish
echo  -------------------------------
echo  Current app version in sw.js:
findstr /C:"const VERSION" sw.js
echo.
echo  REMINDER: if you changed the app, raise VERSION in sw.js first
echo  (and MG_VERSION in shared\js\app.js), or phones keep the old copy.
echo.

set "MSG="
set /p MSG=Describe the change (or just press Enter): 
if "%MSG%"=="" set "MSG=Update %date% %time:~0,5%"

echo.
echo  1/3  Adding all files and folders...
git add .

echo  2/3  Saving the change: "%MSG%"
git commit -m "%MSG%"

echo  3/3  Uploading to GitHub...
git push
if errorlevel 1 (
  echo.
  echo  *** Upload FAILED. Copy the red/white text above and send it to Claude. ***
) else (
  echo.
  echo  Done. Live in about a minute at:
  echo  https://petejackson141.github.io/Master-GMDSS/
)
echo.
pause
