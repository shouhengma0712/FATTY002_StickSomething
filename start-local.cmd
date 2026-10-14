@echo off
cd /d "%~dp0"
set "STICK_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  set "STICK_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)
"%STICK_NODE%" scripts/serve.mjs
pause
