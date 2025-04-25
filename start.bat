@echo off
title Запуск Fuel Calculator
echo *** Запуск приложения Fuel Calculator ***

rem Запуск сервера разработки в скрытом окне
echo Запуск сервера разработки...
start /min cmd /c "npm run dev && pause"

rem Даем серверу время на запуск
echo Ожидаем запуск сервера (7 секунд)...
timeout /t 7 /nobreak >nul

rem Запуск electron приложения
echo Запуск приложения...
start /min cmd /c "npm run electron:dev"

rem Завершение работы с батником
echo.
echo Приложение запущено! Этот терминал можно закрыть.
echo Для завершения работы закройте окно приложения и скрытые консоли.
timeout /t 3 >nul
exit 