@echo off
echo Publishing Bunkering boat to GitHub Releases...

REM Устанавливаем GitHub токен (замените YOUR_GITHUB_TOKEN на ваш реальный токен)
REM set GH_TOKEN=YOUR_GITHUB_TOKEN

REM Проверяем, что токен установлен
if "%GH_TOKEN%"=="" (
    echo ERROR: GitHub token not set!
    echo Please set GH_TOKEN environment variable with your GitHub Personal Access Token
    echo Example: set GH_TOKEN=your_github_token_here
    pause
    exit /b 1
)

REM Собираем и публикуем приложение
npm run build
npm run build:backend
npm run publish

echo Done!
pause 