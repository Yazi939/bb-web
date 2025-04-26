@echo off
echo ******************************************
echo *                                        *
echo *   BUNKER BOATS FULL RESTART            *
echo *                                        *
echo ******************************************
echo.

echo [1/6] Остановка всех процессов...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo    Готово!
echo.

echo [2/6] Очистка временных файлов...
del /f /q electron_log.txt >nul 2>&1
del /f /q %TEMP%\bunker-boats-*.html >nul 2>&1
echo    Готово!
echo.

echo [3/6] Ожидание 5 секунд для полной остановки всех процессов...
ping 127.0.0.1 -n 6 >nul
echo    Готово!
echo.

echo [4/6] Запуск сервера...
cd server
start "Сервер Bunker Boats" cmd /c "npm start"
cd ..
echo    Сервер запущен!
echo.

echo [5/6] Ожидание запуска сервера (10 секунд)...
ping 127.0.0.1 -n 11 >nul
echo    Готово!
echo.

echo [6/6] Запуск React и Electron...
start "React" cmd /c "npm run start"
echo    React запущен, ожидание 15 секунд перед запуском Electron...
ping 127.0.0.1 -n 16 >nul
start "Electron" cmd /c "npm run electron:dev"
echo    Electron запущен!
echo.

echo Все компоненты запущены успешно!
echo ------------------------------------------------
echo Приложение должно автоматически открыться.
echo Если нет, проверьте запущенные окна команд.
echo.
echo Нажмите любую клавишу, чтобы закрыть это окно...
pause >nul 