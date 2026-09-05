# Прогон прибора кадра без рук: drift.html?look → lookAll() по всем сценам,
# таблица уходит POST-ом на стенд (docs/stand.ps1) и печатается здесь JSON-ом.
#
#   powershell -ExecutionPolicy Bypass -File docs\lookrun.ps1
#
# Точная копия дисциплины g11.ps1: живой headless без виртуального времени
# (lookAll — тяжёлый синхронный проход, перемотка ему не судья), свой профиль,
# убиваем только свои процессы. Стенд должен быть поднят (порт 8777).
param([int]$WaitSec = 300)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
$out  = Join-Path $root "docs\shots\look.png"
$prof = Join-Path $env:TEMP "drift-look-profile"

if (Test-Path $out) { Remove-Item -LiteralPath $out -Force }

$chrome = @("C:\Program Files\Google\Chrome\Application\chrome.exe",
            "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") |
          Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "no headless browser found" }

$url  = "http://localhost:8777/drift.html?look"
$argv = @("--headless=new", "--no-sandbox", "--window-size=1280,800",
          "--force-device-scale-factor=2", "--user-data-dir=$prof",
          "--no-first-run", "--no-default-browser-check",
          "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
          "--disable-backgrounding-occluded-windows", $url)

function Stop-Probe {
  Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='msedge.exe'" |
    Where-Object { $_.CommandLine -like "*drift-look-profile*" } |
    ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }
}

Stop-Probe
$proc = Start-Process -FilePath $chrome -ArgumentList $argv -NoNewWindow -PassThru

$t0 = Get-Date
while (((Get-Date) - $t0).TotalSeconds -lt $WaitSec) {
  if (Test-Path $out) {
    Start-Sleep -Milliseconds 300
    Stop-Probe
    $raw = [IO.File]::ReadAllText($out)
    try { $raw = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($raw)) } catch {}
    Write-Output $raw
    exit 0
  }
  Start-Sleep -Milliseconds 1000
}
Stop-Probe
Write-Output "LOOK: не дождались за $WaitSec с"
exit 1
