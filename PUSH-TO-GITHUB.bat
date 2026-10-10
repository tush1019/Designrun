@echo off
REM ============================================================
REM  DESIGNRUN — GitHub push helper (git auto-find + safe)
REM  Double-click karo. Username + repo naam daalo, baaki auto.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

REM --- git dhoondo: PATH me nahi hai toh standard install path se ---
set GIT=git
where git >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\Git\cmd\git.exe"     set GIT="C:\Program Files\Git\cmd\git.exe"
  if exist "C:\Program Files (x86)\Git\cmd\git.exe" set GIT="C:\Program Files (x86)\Git\cmd\git.exe"
)

echo.
echo ============================================
echo   DESIGNRUN ko GitHub par push karna hai
echo ============================================
echo.

set /p GHUSER=GitHub username daalo ^(jaise tush1019^): 
if "%GHUSER%"=="" (
  echo [ERROR] Username khaali nahi ho sakta.
  pause & exit /b 1
)

set /p REPO=Repo naam daalo ^(default: designrun^): 
if "%REPO%"=="" set REPO=designrun

echo.
echo Kya tera repo naya aur KHAALI hai?
echo   Y  = naya khali repo  (normal push)
echo   N  = purana DESIGNRUN repo, usme daal ke REPLACE karna hai (force push)
set /p NEWREPO=Type Y ya N, phir Enter: 

set REMOTE=https://github.com/%GHUSER%/%REPO%.git

echo.
echo Username : %GHUSER%
echo Repo     : %REPO%
echo Remote   : %REMOTE%
echo.

echo [1/5] git init ...
%GIT% init
echo [2/5] git add ...
%GIT% add -A
echo [3/5] git commit ...
%GIT% commit -m "DESIGNRUN ready to deploy"
echo [4/5] branch main ...
%GIT% branch -M main
echo [5/5] push to GitHub ...
%GIT% remote remove origin 2>nul
%GIT% remote add origin %REMOTE%

if /I "%NEWREPO%"=="N" (
  echo (Force push — purana content replace ho jayega)
  %GIT% push -u origin main --force
) else (
  %GIT% push -u origin main
)

echo.
if %errorlevel%==0 (
  echo ============================================
  echo   SUCCESS! Code GitHub par chala gaya.
  echo   Ab Render.com par deploy karo.
  echo ============================================
) else (
  echo ============================================
  echo   Push FAIL HUA. Upar error dekho.
  echo   Aksar wajah: username/repo galat, login
  echo   window band kar di, ya internet off.
  echo ============================================
)
echo.
pause
