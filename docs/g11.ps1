# Замер кадра: прогон ?g11 без рук.
#
# Пробник живёт в игре (28z-fps-probe): он обходит режимы, меряет rAF и шлёт
# итог на стенд (docs/stand.ps1, порт 8777), который кладёт его в
# docs/shots/g11.png. Здесь только запуск и ожидание.
#
# ВАЖНО, и это ошибка, которая уже съедала замеры:
#  * никакого --virtual-time-budget: он перематывает таймеры, и rAF меряет
#    не кадр, а перемотку. Стенды им пользуются, замер — никогда;
#  * окно должно быть одно. Забытые headless-хромы с флагами против
#    троттлинга продолжают рисовать в фоне и топят любой следующий прогон;
#  * свой профиль (--user-data-dir), и убиваем только процессы с ним:
#    браузер пользователя трогать нельзя.
param([int]$WaitSec = 240, [switch]$Deep)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
$name = if ($Deep) { "g11deep" } else { "g11" }
$out  = Join-Path $root ("docs\shots\" + $name + ".png")
$prof = Join-Path $env:TEMP "drift-g11-profile"

if (Test-Path $out) { Remove-Item -LiteralPath $out -Force }

$chrome = @("C:\Program Files\Google\Chrome\Application\chrome.exe",
            "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") |
          Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "no headless browser found" }

$url  = "http://localhost:8777/drift.html?g11"
if ($Deep) { $url = $url + "=deep" }
$argv = @("--headless=new", "--no-sandbox", "--window-size=1280,800",
          "--force-device-scale-factor=2", "--user-data-dir=$prof",
          "--no-first-run", "--no-default-browser-check",
          "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
          "--disable-backgrounding-occluded-windows", $url)

function Stop-Probe {
  Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" |
    Where-Object { $_.CommandLine -like "*drift-g11-profile*" } |
    ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" |
    Where-Object { $_.CommandLine -like "*drift-g11-profile*" } |
    ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }
}

Stop-Probe                     # чужих прогонов быть не должно — своих тоже
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
throw "замер не пришёл за $WaitSec с"
