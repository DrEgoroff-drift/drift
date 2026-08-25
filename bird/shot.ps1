# Снимок объёмной птицы: headless Chrome с настоящим WebGL.
#
#   powershell -ExecutionPolicy Bypass -File bird\shot.ps1
#   powershell -ExecutionPolicy Bypass -File bird\shot.ps1 -Q "?a=1.6" -Out bird3d-side
#
# Стенд обязан быть поднят: powershell docs\stand.ps1 (порт 8777).
# --disable-gpu здесь НЕЛЬЗЯ: без него ANGLE берёт SwiftShader и WebGL 2
# работает, а с ним контекст не выдаётся вовсе и снимок выходит чёрным.
param([string]$Out = "bird3d", [string]$Q = "", [int]$Width = 1100, [int]$Height = 900,
      [int]$WaitSec = 12, [switch]$NoBuild)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not $NoBuild) { & powershell -ExecutionPolicy Bypass -File (Join-Path $root "bird.ps1") | Out-Null }

$shot = Join-Path $root ("docs\shots\" + $Out + ".png")
if (Test-Path $shot) { Remove-Item -LiteralPath $shot -Force }
$chrome = @("C:\Program Files\Google\Chrome\Application\chrome.exe",
            "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") |
          Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "нет браузера для снимка" }

# Свой профиль: чужой Chrome пользователя не трогаем ни при каких условиях.
$prof = Join-Path $env:TEMP "drift-bird-profile"
$url  = "http://localhost:8777/site/treplo3d.html" + $Q
$argv = @("--headless=new", "--no-sandbox", "--use-angle=swiftshader",
          "--enable-unsafe-swiftshader", "--window-size=$Width,$Height",
          "--force-device-scale-factor=1", "--user-data-dir=$prof",
          "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
          "--virtual-time-budget=$($WaitSec * 1000)", "--screenshot=$shot", $url)
$proc = Start-Process -FilePath $chrome -ArgumentList $argv -NoNewWindow -PassThru `
        -RedirectStandardOutput (Join-Path $env:TEMP "bird-out.txt") `
        -RedirectStandardError  (Join-Path $env:TEMP "bird-err.txt")
$deadline = (Get-Date).AddSeconds($WaitSec + 25)
while (-not $proc.HasExited -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 250 }
if (-not $proc.HasExited) { try { Stop-Process -Id $proc.Id -Force } catch {} }
Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='msedge.exe'" |
  Where-Object { $_.CommandLine -like "*$prof*" } |
  ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }

if (Test-Path $shot) { Write-Output $shot } else { throw "снимок не получился" }
