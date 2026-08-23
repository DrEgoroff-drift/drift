# Снять кадр со стенда — без рук и без видимого окна.
#
# Стенды (docs/mk*.ps1) строят страницу, которая рисует сцену и шлёт картинку
# на локальный сервер (docs/stand.ps1). Раньше её открывали руками; здесь то же
# самое делает headless Chrome, а скрипт ждёт появления файла и печатает путь.
#
#   powershell -ExecutionPolicy Bypass -File docs\shot.ps1 settle
#   → строит docs/settle.html через docs/mksettle.ps1, снимает docs/shots/settle.png
#
# Стенд обязан быть уже поднят: powershell docs\stand.ps1 (порт 8777).
param([Parameter(Mandatory=$true)][string]$Name,
      [string]$Out = "",
      [int]$WaitSec = 40,
      [switch]$NoMake)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
if (-not $Out) { $Out = $Name }

if (-not $NoMake) {
  $mk = Join-Path $here ("mk" + $Name + ".ps1")
  if (Test-Path $mk) { & powershell -ExecutionPolicy Bypass -File $mk | Out-Null }
}

$shot = Join-Path $root ("docs\shots\" + $Out + ".png")
$webp = Join-Path $root ("docs\shots\" + $Out + ".webp")
Remove-Item $shot, $webp -ErrorAction SilentlyContinue

$chrome = @("C:\Program Files\Google\Chrome\Application\chrome.exe",
            "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") |
          Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "no headless browser found" }

$url  = "http://localhost:8777/docs/$Name.html"
$argv = @("--headless=new", "--disable-gpu", "--no-sandbox", "--window-size=1280,800",
          "--virtual-time-budget=$($WaitSec * 1000)", "--dump-dom", $url)
# Браузер обязательно убить за собой: страница стенда держит rAF, и с
# --dump-dom процесс не выходит сам. Двадцать забытых headless-хромов съедали
# машину так, что сборка шла четыре минуты вместо двух секунд (M169).
$proc = Start-Process -FilePath $chrome -ArgumentList $argv -NoNewWindow -PassThru `
        -RedirectStandardOutput (Join-Path $env:TEMP "drift-shot-dom.html") `
        -RedirectStandardError  (Join-Path $env:TEMP "drift-shot-err.txt")

function Stop-Shot {
  param($p)
  if ($p -and -not $p.HasExited) { try { Stop-Process -Id $p.Id -Force -ErrorAction Stop } catch {} }
  Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" |
    Where-Object { $_.CommandLine -like "*--headless*" -and $_.CommandLine -like "*localhost:8777*" } |
    ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }
}

$t0 = Get-Date
while (((Get-Date) - $t0).TotalSeconds -lt $WaitSec) {
  if (Test-Path $shot) { Stop-Shot $proc; Write-Output $shot; exit 0 }
  if (Test-Path $webp) { Stop-Shot $proc; Write-Output $webp; exit 0 }
  Start-Sleep -Milliseconds 500
}
Stop-Shot $proc
Write-Output "нет кадра: стенд не ответил за $WaitSec с (поднят ли docs\stand.ps1?)"
exit 1
