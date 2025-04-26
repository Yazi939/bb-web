@echo off
echo Starting Bunker Boats application...

cd %~dp0

rem Start server in background
echo Starting server...
start cmd /c "cd server && npm run dev"

rem Wait a moment
echo Waiting for server to initialize...
ping 127.0.0.1 -n 4 > nul

rem Start electron app
echo Starting application...
cd %~dp0
npm run electron:dev

echo Press any key to exit
pause > nul 