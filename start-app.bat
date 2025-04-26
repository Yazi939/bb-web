@echo off
echo.
echo  ************************************
echo  *                                  *
echo  *      Bunker Boats Starter       *
echo  *                                  *
echo  ************************************
echo.

rem Kill existing processes
echo [1/3] Stopping existing processes...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo Done!
echo.

rem Start all components
echo [2/3] Starting application components...
echo - Starting backend server...
start "Backend Server" cmd /c "cd server && npm run dev"

echo - Starting Vite development server...
start "Vite Dev Server" cmd /c "npm run dev"

echo - Starting Electron application...
start "Electron App" cmd /c "npm run electron:dev"
echo Done!
echo.

echo [3/3] Application started successfully!
echo.
echo  Running services:
echo  - Backend API: http://localhost:5000
echo  - Frontend Dev: http://localhost:5173
echo  - Electron App: Connected to frontend
echo.
echo  To stop all services, close this window and all opened command prompts
echo.
echo Press any key to close this window...
pause >nul 