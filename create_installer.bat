@echo off
setlocal
cd /d %~dp0
echo Создание установщика для всей директории FE

REM Очищаем и пересоздаём папку dist
if exist "%~dp0dist" rmdir /S /Q "%~dp0dist"
mkdir "%~dp0dist"

REM Очищаем кэш и пересобираем приложение
echo Очистка кэша и пересборка приложения...
call npm run clean
call npm run build
call npm run build:backend

REM Копируем всё кроме dist и служебных файлов через PowerShell
powershell -Command "Get-ChildItem -Path . -Exclude dist,create_installer.bat,installer.nsi,installer.nsh | ForEach-Object { Copy-Item -Path $_.FullName -Destination '%~dp0dist' -Recurse -Force }"

REM Создаём NSIS скрипт
del "%~dp0installer.nsi" 2>nul
(
echo !include "installer.nsh"
echo.
echo OutFile "dist\BunkerBoats-Setup.exe"
echo InstallDir "$PROGRAMFILES\Bunker Boats"
echo.
echo Section "Install"
echo   SetOutPath "$INSTDIR"
echo   File /r "dist\*.*"
echo   !insertmacro customInstall
echo   WriteUninstaller "$INSTDIR\Uninstall.exe"
echo SectionEnd
echo.
echo Section "Uninstall"
echo   RMDir /r "$INSTDIR"
echo   !insertmacro customUnInstall
echo SectionEnd
) > "%~dp0installer.nsi"

echo Сборка установщика...
makensis "%~dp0installer.nsi"
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось создать установщик!
    pause
    exit /b 1
)

echo.
echo Готово! Установщик создан: %~dp0dist\BunkerBoats-Setup.exe
echo Этот установщик содержит всю директорию FE.
echo.

pause
endlocal