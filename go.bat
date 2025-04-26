@echo off
start "Server" cmd /c "cd server && npm run dev"
start "Vite" cmd /c "npm run dev"
start "Electron" cmd /c "npm run electron:dev" 