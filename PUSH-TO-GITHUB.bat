@echo off
REM ============================================================
REM  DESIGNRUN — GitHub push helper
REM  Double-click karo. Sirf GitHub username + repo naam daalo,
REM  baaki sab (init/add/commit/push) khud ho jayega.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================
echo   DESIGNRUN ko GitHub par push karna hai
echo ============================================
echo.

set /p GHUSER=Apna GitHub username daalo: 
if "%GHUSER%"=="" (
  echo [ERROR] Username tush1019.
  pause & exit /b 1
)

set /p REPO=Repo naam daalo ^(default: designrun^): 
if "%REPO%"=="" set REPO=designrun

set REMOTE=https://github.com/%GHUSER%/%REPO%.git

echo.
echo Username : %GHUSER%
echo Repo     : %REPO%
echo Remote   : %REMOTE%
echo.

echo [1/5] git init ...
git init

echo [2/5] git add .
git add .

echo [3/5] git commit ...
git commit -m "DESIGNRUN ready to deploy"

echo [4/5] branch main ...
git branch -M main

echo [5/5] push to GitHub ...
git remote remove origin 2>nul
git remote add origin %REMOTE%
git push -u origin main

echo.
if %errorlevel%==0 (
  echo ============================================
  echo   SUCCESS! Code GitHub par chala gaya.
  echo   Ab Render.com par deploy karo.
  echo ============================================
) else (
  echo ============================================
  echo   Push FAILHUA. Upar error dekho.
  echo   Aksar wajah: username/repo galat, ya
  echo   GitHub login window nahi khula.
  echo ============================================
)
echo.
pause
