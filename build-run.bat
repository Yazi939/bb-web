@echo off
echo Building and starting Bunker Boats application...

cd %~dp0

echo Building frontend...
call npm run build
if %ERRORLEVEL% neq 0 (
  echo Build failed with error code %ERRORLEVEL%
  pause
  exit /b %ERRORLEVEL%
)

echo Starting server...
start /min cmd /c "cd server && npm run dev"

echo Starting Electron app...
npm run electron:dev 