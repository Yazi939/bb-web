@echo off
chcp 1251
cls
echo *************************************
echo * Освобождение портов Fuel Manager *
echo *************************************

cd %~dp0

echo [1/3] Поиск процессов, использующих порты 5000 и 5173...

echo - Проверка порта 5000 (API сервер)...
netstat -ano | findstr ":5000"
echo.

echo - Проверка порта 5173 (Vite сервер)...
netstat -ano | findstr ":5173"
echo.

echo [2/3] Принудительное освобождение портов...

:: Освобождаем порт 5000
set PORT=5000
FOR /F "tokens=5" %%a IN ('netstat -ano ^| findstr ":%PORT%"') DO (
    echo - Завершение процесса с PID %%a (порт %PORT%)
    taskkill /F /PID %%a
)

:: Освобождаем порт 5173
set PORT=5173
FOR /F "tokens=5" %%a IN ('netstat -ano ^| findstr ":%PORT%"') DO (
    echo - Завершение процесса с PID %%a (порт %PORT%)
    taskkill /F /PID %%a
)

echo.
echo [3/3] Проверка результатов...

echo - Проверка порта 5000...
netstat -ano | findstr ":5000"
if %errorlevel% neq 0 (
    echo Порт 5000 успешно освобожден.
) else (
    echo ВНИМАНИЕ: Порт 5000 все еще занят!
)

echo - Проверка порта 5173...
netstat -ano | findstr ":5173"
if %errorlevel% neq 0 (
    echo Порт 5173 успешно освобожден.
) else (
    echo ВНИМАНИЕ: Порт 5173 все еще занят!
)

echo.
echo Операция завершена. Теперь можно запустить приложение с помощью start.bat
echo.
pause 