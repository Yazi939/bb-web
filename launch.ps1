try {
    $psPath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
    $scriptPath = Join-Path $PSScriptRoot "start.ps1"
    if (Test-Path $scriptPath) {
        Start-Process -FilePath $psPath -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" -WorkingDirectory $PSScriptRoot -Wait
    } else {
        Write-Host "Ошибка: файл start.ps1 не найден"
    }
} catch {
    Write-Host "Произошла ошибка: $_"
}
Write-Host "Нажмите любую клавишу для выхода..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 