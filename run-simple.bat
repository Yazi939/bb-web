@echo off
echo Starting Bunker Boats application...

cd %~dp0
start /min cmd /c "cd server && npm run dev"

rem Wait using another approach
echo Waiting 3 seconds...
set /a count=0
:loop
set /a count+=1
if %count% LSS 100000 goto loop

echo Starting main application...
start cmd /c "npm run electron:dev"

echo Done! Application should start in a moment. 