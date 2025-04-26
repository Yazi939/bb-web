@echo off
echo.
echo **************************************
echo *                                    *
echo *      BUNKER BOATS STARTUP          *
echo *                                    *
echo **************************************
echo.

rem Kill processes
echo [1/4] Killing existing processes...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo    Done!

rem Start backend
echo [2/4] Starting backend server...
cd server
start "Backend Server" cmd /c npm start
cd ..
echo    Started backend server
echo.

rem Wait for backend
echo [3/4] Starting React dev server...
echo    Please wait while React server starts (10 seconds)
echo    [0%%]
for /l %%i in (1, 1, 10) do (
  echo    [%%i0%%]
  ping 127.0.0.1 -n 2 >nul
)
start "React" cmd /c npm run start
echo    Started React server
echo.

rem Start Electron
echo [4/4] Starting Electron app...
start "Electron" cmd /c npm run electron:dev
echo    Started Electron app
echo.

echo All components started!
echo.
echo * To stop application:
echo   - Close all command windows
echo   - Or press any key to quit all processes
echo.
pause >nul

echo Shutting down all processes...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo Done! All processes terminated.
echo.
pause 