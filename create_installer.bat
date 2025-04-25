@echo off
echo Создание установщика приложения Bunker Boats с Node.js

echo Проверка наличия Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ОШИБКА: Node.js не найден!
    echo Для создания установщика нужен Node.js
    echo Однако созданный установщик сможет автоматически установить Node.js на целевом компьютере
    pause
    exit /b 1
)

echo Установка зависимостей...
call npm install
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось установить зависимости!
    pause
    exit /b 1
)

echo Сборка React-приложения...
call npm run build
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось собрать React-приложение!
    pause
    exit /b 1
)

echo Проверка наличия необходимых файлов...
if not exist main.js (
    echo ОШИБКА: Файл main.js не найден!
    pause
    exit /b 1
)

if not exist preload.js (
    echo ОШИБКА: Файл preload.js не найден!
    pause
    exit /b 1
)

echo Установка плагина NSIS для скачивания...
mkdir nsis-plugins\Plugins\x86-unicode 2>nul
echo Скачивание плагина InetC.dll...
powershell -Command "Invoke-WebRequest -Uri 'https://nsis.sourceforge.io/mediawiki/images/c/c9/Inetc.zip' -OutFile '%TEMP%\Inetc.zip'"
echo Распаковка...
powershell -Command "Expand-Archive -Path '%TEMP%\Inetc.zip' -DestinationPath '%TEMP%\Inetc' -Force"
copy /Y "%TEMP%\Inetc\Plugins\x86-unicode\InetC.dll" "nsis-plugins\Plugins\x86-unicode\" >nul

echo Копирование main.js и preload.js в папку dist...
copy main.js dist\main.js /Y
copy preload.js dist\preload.js /Y

echo Создание package.json в папке dist...
echo {
echo   "main": "main.js",
echo   "name": "fuel",
echo   "private": true,
echo   "version": "1.0.0", 
echo   "dependencies": {} 
echo } > dist\package.json

echo Сборка установщика...
call npm run package
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось создать установщик!
    pause
    exit /b 1
)

echo.
echo Готово! Установщик создан: dist\BunkerBoats-Setup.exe
echo Этот установщик автоматически загрузит и установит Node.js на целевом компьютере.
echo.

pause 