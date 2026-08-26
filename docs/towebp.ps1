# Перегон снимка в webp руками Chrome (страница — docs/towebp.html).
#
# Кодировщика webp на машине нет: ImageMagick и cwebp не стоят, а `convert` в
# PATH — это конвертер файловой системы Windows. Chrome же умеет, и стенд уже
# умеет принимать кадр POST'ом. Здесь только запуск.
#
#   powershell -ExecutionPolicy Bypass -File docs\towebp.ps1 -Src docs/shots/road.png -Name road -W 720 -H 900
#   powershell -ExecutionPolicy Bypass -File docs\towebp.ps1 -Src docs/shots/road.png -Name road -Crop "0,0,460,800"
#
# Результат — docs/shots/<Name>.webp. Стенд обязан быть поднят (docs\stand.ps1).
param([Parameter(Mandatory=$true)][string]$Src,
      [Parameter(Mandatory=$true)][string]$Name,
      [int]$W = 0, [int]$H = 0,
      [string]$Crop = "", [string]$Fit = "cover", [string]$Bg = "",
      [double]$Q = 0.9, [int]$WaitSec = 12)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$out  = Join-Path $root ("docs\shots\" + $Name + ".webp")
if (Test-Path $out) { Remove-Item -LiteralPath $out -Force }

$qs = "?src=/" + $Src.Replace("\", "/") + "&n=" + $Name + "&q=$Q&fit=$Fit"
if ($W -gt 0) { $qs += "&w=$W" }
if ($H -gt 0) { $qs += "&h=$H" }
if ($Crop)    { $qs += "&crop=$Crop" }
if ($Bg)      { $qs += "&bg=" + [uri]::EscapeDataString($Bg) }

$chrome = @("C:\Program Files\Google\Chrome\Application\chrome.exe",
            "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") |
          Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "нет браузера" }

# Свой профиль: чужой Chrome пользователя не трогаем ни при каких условиях.
$prof = Join-Path $env:TEMP "drift-towebp-profile"
$url  = "http://localhost:8777/docs/towebp.html" + $qs
$argv = @("--headless=new", "--disable-gpu", "--no-sandbox", "--window-size=800,600",
          "--user-data-dir=$prof", "--no-first-run", "--no-default-browser-check",
          "--virtual-time-budget=$($WaitSec * 1000)", $url)
$proc = Start-Process -FilePath $chrome -ArgumentList $argv -NoNewWindow -PassThru `
        -RedirectStandardOutput (Join-Path $env:TEMP "drift-towebp-out.txt") `
        -RedirectStandardError  (Join-Path $env:TEMP "drift-towebp-err.txt")
$deadline = (Get-Date).AddSeconds($WaitSec + 20)
while (-not $proc.HasExited -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 250 }
if (-not $proc.HasExited) { try { Stop-Process -Id $proc.Id -Force } catch {} }
Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='msedge.exe'" |
  Where-Object { $_.CommandLine -like "*$prof*" } |
  ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }

if (Test-Path $out) {
  "{0}  {1:N0} КБ" -f $out, ((Get-Item $out).Length / 1KB)
} else { throw "webp не получился — поднят ли стенд?" }
