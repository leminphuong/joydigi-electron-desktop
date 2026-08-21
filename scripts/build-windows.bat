@echo off
setlocal
cd /d "%~dp0\.."

echo ========================================
echo JoyDigi Electron - Windows Builder
echo ========================================

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js chua duoc cai.
  echo Tai Node.js LTS tai https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm khong co trong PATH.
  pause
  exit /b 1
)

echo [1/2] Installing dependencies...
call npm install
if errorlevel 1 goto :error

echo [2/2] Building Windows NSIS installer...
call npm run build:win
if errorlevel 1 goto :error

echo.
echo DONE. Kiem tra file EXE trong:
echo %CD%\dist
pause
exit /b 0

:error
echo.
echo BUILD FAILED.
pause
exit /b 1
