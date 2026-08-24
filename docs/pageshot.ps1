# Снимок ВСЕЙ страницы, а не одной канвы.
#
# docs/shot.ps1 снимает то, что стенд сам нарисовал на канве и отправил на
# локальный сервер, — и потому не показывает ни одного элемента интерфейса:
# приборы, пульт, пэды и правый борт живут в DOM. Для релизного вида смотреть
# надо именно на них, поэтому здесь честный --screenshot самого Chrome.
#
#   powershell -ExecutionPolicy Bypass -File docs\pageshot.ps1 view
#   → строит docs/view.html через docs/mkview.ps1, снимает docs/shots/view.png
#
# Стенд обязан быть поднят: powershell docs\stand.ps1 (порт 8777).
param([Parameter(Mandatory=$true)][string]$Name,
      [string]$Out = "",
      [string]$Q = "",
      [int]$Width = 1280,
      [int]$Height = 800,
      [int]$WaitSec = 25,
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
Remove-Item $shot -ErrorAction SilentlyContinue

$chrome = @("C:\Program Files\Google\Chrome\Application\chrome.exe",
            "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") |
          Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "no headless browser found" }

# Свой профиль: чужой Chrome пользователя трогать нельзя ни при каких условиях.
$prof = Join-Path $env:TEMP "drift-pageshot-profile"
$url  = "http://localhost:8777/docs/$Name.html" + $Q
$argv = @("--headless=new", "--disable-gpu", "--no-sandbox",
          "--window-size=$Width,$Height", "--force-device-scale-factor=1",
          "--user-data-dir=$prof", "--no-first-run", "--no-default-browser-check",
          "--hide-scrollbars", "--virtual-time-budget=$($WaitSec * 1000)",
          "--screenshot=$shot", $url)
$proc = Start-Process -FilePath $chrome -ArgumentList $argv -NoNewWindow -PassThru `
        -RedirectStandardOutput (Join-Path $env:TEMP "drift-pageshot-out.txt") `
        -RedirectStandardError  (Join-Path $env:TEMP "drift-pageshot-err.txt")

$deadline = (Get-Date).AddSeconds($WaitSec + 20)
while (-not $proc.HasExited -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 250 }
if (-not $proc.HasExited) { try { Stop-Process -Id $proc.Id -Force } catch {} }
# и добить своё дерево по своему же профилю (M169: забытые хромы съедают машину)
Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='msedge.exe'" |
  Where-Object { $_.CommandLine -like "*$prof*" } |
  ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }

if (Test-Path $shot) { Write-Output $shot } else { throw "снимок не получился" }
