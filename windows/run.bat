@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "PY_EXE=%SCRIPT_DIR%python\python.exe"
set "APP_PY=%SCRIPT_DIR%app.py"
set "LOGIC_PY=%SCRIPT_DIR%logic.py"

cd /d "%SCRIPT_DIR%"

if not exist "%PY_EXE%" goto :missing_python
if not exist "%APP_PY%" goto :missing_app
if not exist "%LOGIC_PY%" goto :missing_logic

start "" "http://127.0.0.1:5001"
"%PY_EXE%" "%APP_PY%"
if errorlevel 1 goto :run_failed
goto :eof

:missing_python
echo [ERROR] Bundled runtime not found: "%PY_EXE%"
pause
exit /b 1

:missing_app
echo [ERROR] Application file not found: "%APP_PY%"
pause
exit /b 1

:missing_logic
echo [ERROR] Required module file not found: "%LOGIC_PY%"
pause
exit /b 1

:run_failed
echo.
echo [ERROR] Failed to start the app. See logs above.
pause
exit /b 1
