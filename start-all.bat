@echo off
echo ** BUNKER BOATS **

rem Kill processes
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

rem Start backend
cd server
start cmd /c npm start
cd ..

rem Start React
ping 127.0.0.1 -n 2 >nul
start cmd /c npm run start

rem Start Electron
ping 127.0.0.1 -n 10 >nul
start cmd /c npm run electron:dev

echo Started all components! 