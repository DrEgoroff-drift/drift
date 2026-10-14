# Лаборатория «Дрейфа» — запуск без Claude (ярлык на рабочем столе: lab\lab-shortcut.ps1).
# Меню: сколько копий, сколько минут, режим, ветка; лог бежит в окне и пишется в файл.
# Настройки помнятся в %USERPROFILE%\drift-data\lab\launcher.json.
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$env:PYTHONIOENCODING = "utf-8"
$Host.UI.RawUI.WindowTitle = "Лаборатория Дрейфа"

$Here   = Split-Path -Parent $MyInvocation.MyCommand.Path
$Runner = Join-Path $Here "lab-local.py"
$Data   = Join-Path $env:USERPROFILE "drift-data\lab"
$Logs   = Join-Path $Data "logs"
$Cfg    = Join-Path $Data "launcher.json"
$Port   = 8790
New-Item -ItemType Directory -Force $Logs | Out-Null

$Py = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $Py) { $Py = Join-Path $env:LOCALAPPDATA "Programs\Python\Python312\python.exe" }
if (-not (Test-Path $Py)) { Write-Host "Не найден Python 3.12" -ForegroundColor Red; Read-Host "Enter — выход"; exit 1 }

$Cores = [Environment]::ProcessorCount
$S = @{ jobs = [Math]::Max(2, [int]($Cores / 4)); minutes = 60; mode = "full"; ref = "lab-local"; steps = 60 }
if (Test-Path $Cfg) {
    try { (Get-Content $Cfg -Raw | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $S[$_.Name] = $_.Value } } catch {}
}
function Save { $S | ConvertTo-Json | Set-Content -Encoding UTF8 $Cfg }

$ModeName = @{ full = "полный круг + охота"; quick = "быстрый (ядро, зрение, лёгкие)"; hunt = "только охота ботом" }

function Ask($text, $now) {
    $v = Read-Host "$text [сейчас $now]"
    if ($v -eq "") { return $now } else { return $v }
}

function Show-Page {
    $site = Join-Path $env:USERPROFILE "drift-data\site\lab\index.html"
    if (-not (Test-Path $site)) { Write-Host "Страницы ещё нет — сначала запусти прогон." -ForegroundColor Yellow; return }
    $busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $busy) {
        Start-Process -WindowStyle Minimized -FilePath $Py -ArgumentList @("`"$Runner`"", "--serve", "$Port")
        Start-Sleep -Milliseconds 800
    }
    Start-Process "http://127.0.0.1:$Port/lab/"
}

function Run-Lab {
    $log = Join-Path $Logs ("lab-" + (Get-Date -Format "yyyy-MM-dd_HH-mm") + ".log")
    $pa = @("-u", "`"$Runner`"", "--jobs", "$($S.jobs)", "--budget", "$($S.minutes)", "--ref", "$($S.ref)",
              "--steps", "$($S.steps)", "--log", "`"$log`"")
    if ($S.mode -eq "quick") { $pa += "--quick" }
    if ($S.mode -eq "hunt")  { $pa += "--hunt-only" }
    Write-Host ""
    Write-Host "Запуск: $($S.jobs) копий · $($S.minutes) мин · $($ModeName[$S.mode]) · ветка $($S.ref)" -ForegroundColor Cyan
    Write-Host "Лог: $log" -ForegroundColor DarkGray
    Write-Host "Остановить: Ctrl+C (свои Chrome погаснут, твой Chrome не трогается)" -ForegroundColor DarkGray
    Write-Host ""
    & $Py @args
    Write-Host ""
    Write-Host "Готово. Ошибки: $(Join-Path $env:USERPROFILE 'drift-data\site\lab\errors.txt')" -ForegroundColor Green
}

while ($true) {
    Clear-Host
    Write-Host "  ЛАБОРАТОРИЯ ДРЕЙФА" -ForegroundColor Cyan
    Write-Host "  ─────────────────────────────────────────────"
    Write-Host ("  1  копий Chrome одновременно   {0}   (ядер в машине: {1})" -f $S.jobs, $Cores)
    Write-Host ("  2  сколько минут               {0}" -f $S.minutes)
    Write-Host ("  3  режим                       {0}" -f $ModeName[$S.mode])
    Write-Host ("  4  ветка                       {0}" -f $S.ref)
    Write-Host ("  5  шагов бота на зерно охоты   {0}" -f $S.steps)
    Write-Host "  ─────────────────────────────────────────────"
    Write-Host "  Enter  ЗАПУСТИТЬ" -ForegroundColor Green
    Write-Host "  P      открыть страницу результатов"
    Write-Host "  L      открыть папку логов"
    Write-Host "  0      выход"
    Write-Host ""
    $c = Read-Host "Выбор"
    switch ($c.Trim().ToUpper()) {
        ""  { Save; Run-Lab; Read-Host "Enter — в меню" | Out-Null }
        "1" { $v = Ask "Копий (1–$Cores; больше — быстрее, но машина тяжелее)" $S.jobs; if ($v -match '^\d+$' -and [int]$v -ge 1) { $S.jobs = [int]$v }; Save }
        "2" { $v = Ask "Минут (охота добирает время до конца)" $S.minutes; if ($v -match '^\d+$' -and [int]$v -ge 5) { $S.minutes = [int]$v }; Save }
        "3" { Write-Host "  f — полный круг + охота   q — быстрый   h — только охота"
              $v = (Read-Host "Режим").Trim().ToLower()
              if ($v -eq "f") { $S.mode = "full" } elseif ($v -eq "q") { $S.mode = "quick" } elseif ($v -eq "h") { $S.mode = "hunt" }; Save }
        "4" { $v = Ask "Ветка (lab-local, planet-main, main…)" $S.ref; $S.ref = $v.Trim(); Save }
        "5" { $v = Ask "Шагов бота (10–400)" $S.steps; if ($v -match '^\d+$') { $S.steps = [Math]::Min(400, [Math]::Max(10, [int]$v)) }; Save }
        "P" { Show-Page; Start-Sleep 1 }
        "L" { Start-Process explorer.exe $Logs }
        "0" { exit 0 }
    }
}
