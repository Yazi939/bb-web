@echo off
chcp 1251
cls
echo *************************************
echo * Отладка приложения Fuel Manager *
echo *************************************

cd %~dp0

echo [1/2] Остановка всех процессов...
call stop.bat
timeout /t 2 /nobreak >nul

echo [2/2] Запуск в режиме отладки...

echo - Запуск сервера API с выводом логов...
cd server
start cmd /k npm run dev
cd ..
timeout /t 3 /nobreak >nul

echo - Запуск Vite с выводом логов...
start cmd /k npm run start
timeout /t 5 /nobreak >nul

echo - Запуск Electron с DevTools...
set DEBUG=electron*
set ELECTRON_ENABLE_LOGGING=true
start cmd /k npm run electron:dev

echo.
echo ВАЖНО: В этом режиме все логи выводятся в консоли.
echo Все окна консолей должны оставаться открытыми.
echo Для остановки закройте все консоли или используйте stop.bat.
echo.
echo Запуск завершен, проверьте окна консолей на наличие ошибок.
echo.
pause 