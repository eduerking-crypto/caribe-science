@echo off
REM CARIBE SCIENCE - backend launcher
cd /d "%~dp0apps\backend"
if not exist .venv (
  echo Creating virtual environment...
  python -m venv .venv
  .\.venv\Scripts\pip install -r requirements.txt
)
echo Seeding demo data...
.\.venv\Scripts\python -m app.seed
echo Starting API on http://127.0.0.1:8000 ...
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause