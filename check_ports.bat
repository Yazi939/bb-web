@echo off
chcp 1251
cls
echo *************************************
echo *   Проверка портов Fuel Manager   *
echo *************************************

cd %~dp0

echo [1/2] Проверка порта 5000 (API сервер)...
set PORT=5000
set SUCCESS=0

FOR /F "tokens=*" %%i IN ('netstat -ano ^| findstr ":%PORT%"') DO (
  echo Порт %PORT% занят:
  echo %%i
  set SUCCESS=1
)

if %SUCCESS%==0 (
  echo Порт %PORT% свободен
) else (
  echo ВНИМАНИЕ: Порт %PORT% уже используется другим приложением!
  echo Если вы хотите освободить порт, завершите процессы node.exe с помощью stop.bat
)

echo.
echo [2/2] Проверка порта 5173 (Vite сервер)...
set PORT=5173
set SUCCESS=0

FOR /F "tokens=*" %%i IN ('netstat -ano ^| findstr ":%PORT%"') DO (
  echo Порт %PORT% занят:
  echo %%i
  set SUCCESS=1
)

if %SUCCESS%==0 (
  echo Порт %PORT% свободен
) else (
  echo ВНИМАНИЕ: Порт %PORT% уже используется другим приложением!
  echo Если вы хотите освободить порт, завершите процессы node.exe с помощью stop.bat
)

echo.
echo Нажмите любую клавишу для выхода...
pause 