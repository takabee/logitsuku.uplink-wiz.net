@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "VENV_PY=%SCRIPT_DIR%.venv\Scripts\python.exe"
set "SRC_DIR=%SCRIPT_DIR%windows-src"

cd /d "%SCRIPT_DIR%"

if exist "%VENV_PY%" goto :run_app

echo [INFO] First-time setup started...
where py >nul 2>&1
if %errorlevel%==0 (
  py -3 -m venv ".venv"
) else (
  where python >nul 2>&1
  if %errorlevel%==0 (
    python -m venv ".venv"
  ) else (
    echo [ERROR] Python 3 is required. Install from:
    echo https://www.python.org/downloads/windows/
    pause
    exit /b 1
  )
)

call ".venv\Scripts\activate.bat"
python -m pip install --upgrade pip
pip install -r "%SRC_DIR%\requirements.txt"
if errorlevel 1 (
  echo [ERROR] Dependency installation failed.
  pause
  exit /b 1
)

:run_app
call ".venv\Scripts\activate.bat"
start "" "http://127.0.0.1:5001"
python "%SRC_DIR%\app.py"
if errorlevel 1 (
  echo.
  echo [ERROR] Failed to start the app. See logs above.
  pause
  exit /b 1
)
