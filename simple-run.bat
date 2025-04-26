@echo off
echo Starting Bunker Boats...
start cmd /c "cd server && npm run dev"
timeout /t 3 /nobreak
start cmd /c "npm run dev"
timeout /t 7 /nobreak
start cmd /c "npm run electron:dev" 