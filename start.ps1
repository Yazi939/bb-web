try {
    Set-Location -Path $PSScriptRoot
    $npxPath = "C:\Program Files\nodejs\npx.cmd"
    if (Test-Path $npxPath) {
        & $npxPath electron .
    } else {
        Write-Host "Ошибка: npx не найден. Убедитесь, что Node.js установлен."
    }
} catch {
    Write-Host "Произошла ошибка: $_"
}
Write-Host "Нажмите любую клавишу для выхода..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 