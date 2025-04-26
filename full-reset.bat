@echo off
echo *** ПОЛНЫЙ СБРОС BUNKER BOATS ***
echo.
echo ВНИМАНИЕ: Этот скрипт остановит все процессы и очистит временные файлы.
echo.
echo Нажмите любую клавишу, чтобы продолжить, или закройте окно для отмены.
pause >nul
echo.

echo [1/5] Остановка всех процессов...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo Все процессы остановлены.
echo.

echo [2/5] Очистка временных файлов...
del /f /q electron_log.txt >nul 2>&1
del /f /q electron-simple.log >nul 2>&1
del /f /q main-emergency.js >nul 2>&1
del /f /q index-emergency.html >nul 2>&1
del /f /q %TEMP%\bunker-boats-*.html >nul 2>&1
echo Временные файлы удалены.
echo.

echo [3/5] Ожидание завершения всех процессов...
timeout /t 5 /nobreak >nul
echo Завершено.
echo.

echo [4/5] Проверка доступности портов...
echo Порт 3000: 
netstat -an | find "3000"
echo.
echo Порт 5000:
netstat -an | find "5000"
echo.

echo [5/5] Готово! Система сброшена. Теперь вы можете:
echo.
echo 1. Запустить экстренный запуск: emergency-start.bat
echo 2. Запустить обычный запуск: restart-full.bat
echo 3. Выполнить ручной запуск последовательно:
echo    - cd server && npm start
echo    - npm run start
echo    - npm run electron:dev
echo.

echo =================================================
echo Нажмите любую клавишу, чтобы закрыть это окно.
echo =================================================
pause >nul 