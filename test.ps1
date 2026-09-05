# Headless run of tests.html — the cheap way to verify.
#
#   powershell -ExecutionPolicy Bypass -File test.ps1            # build + run, print verdict
#   powershell -ExecutionPolicy Bypass -File test.ps1 -NoBuild   # run the existing tests.html
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Only роща # suites whose name contains the text
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Mobile    # same, in a 390x844 window
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Size 1440,1440  # tall window: UI zoom at its ceiling
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Fuzz 4000 # long fuzz over every mode
#
# Prints only the head line and the FAILURES block; exit code 1 on any failure.
# Window must be 1280x800: at Chrome's default 800x600 the UI-overlap suite
# (91f-ui) fails for real — the rail and the pads do overlap on a small screen.
# -Mobile runs the same suites in a phone window instead: the layout guards are
# written to skip themselves when the window is not a phone, so without this
# switch the phone half of the interface is never actually measured.
param([switch]$NoBuild, [string]$Only = "", [switch]$Mobile, [int]$Fuzz = 0, [int]$Seed = 0, [string]$Size = "")

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $NoBuild) { & (Join-Path $root "build.ps1") | Out-Null }

$chrome = @("C:\Program Files\Google\Chrome\Application\chrome.exe",
            "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") |
          Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "no headless browser found (Chrome/Edge)" }

$url = "file:///" + ((Join-Path $root "tests.html") -replace "\\", "/")
if ($Only) { $url += "?only=" + [uri]::EscapeDataString($Only) }
# Фуззер (91zzzz-fuzz) на сборке гоняет короткий прогон — иначе он один стоит
# дороже всех остальных наборов. -Fuzz 4000 включает длинный: его запускают
# руками, когда ищут падение, и seed у него постоянный, так что провал
# повторяется точь-в-точь.
if ($Fuzz -gt 0) {
  $sep = if ($url -match "\?") { "&" } else { "?" }
  $url += "$sep" + "fuzz=$Fuzz"
}
# Зерно рук (M339): по умолчанию прежнее, -Seed N даёт другую тропу целиком.
# Длинный прогон с одним зерном проверяет ту же последовательность, только
# дольше; охота идёт по нескольким зёрнам.
if ($Seed -gt 0) {
  $sep = if ($url -match "\?") { "&" } else { "?" }
  $url += "$sep" + "fseed=$Seed"
}
$dom = Join-Path $env:TEMP "drift-tests-dom.html"
$err = Join-Path $env:TEMP "drift-tests-err.txt"
# -Size "W,H" — третий размер окна. Мерка интерфейса (--ui = clamp(H/760,1,1.75))
# на 1280x800 почти единица, то есть режим увеличенного интерфейса — высокий
# экран, 4K, планшет — не мерился ничем. -Size "1440,1440" даёт --ui 1.75.
$win = if ($Size) { $Size } elseif ($Mobile) { "390,844" } else { "1280,800" }
$argv = @("--headless=new", "--disable-gpu", "--no-sandbox", "--window-size=$win",
          "--user-data-dir=$($env:TEMP)\drift-tests-profile",
          "--no-first-run", "--no-default-browser-check",
          "--virtual-time-budget=20000", "--timeout=60000", "--dump-dom", $url)
# Секунды считаем ЗДЕСЬ: внутри страницы часы стоят (--virtual-time-budget), и
# отчёт годами печатал «0 мс». Снаружи время настоящее, вместе со стартом Chrome.
$sw = [Diagnostics.Stopwatch]::StartNew()
Start-Process -FilePath $chrome -ArgumentList $argv -NoNewWindow -Wait `
  -RedirectStandardOutput $dom -RedirectStandardError $err | Out-Null
$sw.Stop()
$html = [System.IO.File]::ReadAllText($dom, [System.Text.Encoding]::UTF8)

$m = [regex]::Match($html, '<pre id="testout"[^>]*>([\s\S]*?)</pre>')
if (-not $m.Success) {
  Write-Host "no test report in DOM: the page crashed before runTests (open tests.html in a browser)"
  exit 2
}
$text = [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value)
$lines = $text -split "`n"
"{0} · {1:N1} с" -f $lines[0].TrimEnd(), $sw.Elapsed.TotalSeconds
# Head is "FAILED N · passed P" or "ALL GREEN · passed P": a digit before the first dot means failures.
# The failures block follows the head after one blank line and ends at the next blank line.
if ($lines[0] -match '^\S+ \d+ ') {
  $j = 2
  while ($j -lt $lines.Count -and $lines[$j] -notmatch '^\s*$') { $lines[$j].TrimEnd(); $j++ }
  exit 1
}
exit 0
