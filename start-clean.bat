@echo off
echo Starting Bunker Boats...

rem Start Backend Server
echo Starting backend server...
cd server
start cmd /c npm start
cd ..

rem Wait a bit
echo Waiting for server to start...
timeout /t 3 /nobreak

rem Start React
echo Starting React application...
start cmd /c npm run start

rem Wait for React to start
echo Waiting for React to start...
timeout /t 5 /nobreak

rem Start Electron
echo Starting Electron...
start cmd /c npm run electron:dev

echo All components started. Close this window when done. 