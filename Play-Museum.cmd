@echo off
cd /d "%~dp0"
if not exist node_modules\vite\bin\vite.js (
  call npm.cmd ci
  if errorlevel 1 goto failed
)
call npm.cmd run dev -- --host 127.0.0.1 --open
if errorlevel 1 goto failed
exit /b 0
:failed
echo The museum could not start. Check the message above.
pause
exit /b 1
