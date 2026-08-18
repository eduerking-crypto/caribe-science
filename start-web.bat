@echo off
REM CARIBE SCIENCE - web launcher
cd /d "%~dp0apps\web"
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
echo Starting web on http://localhost:3000 ...
call npm run dev
pause