# Headless run of tests.html — the cheap way to verify.
#
#   powershell -ExecutionPolicy Bypass -File test.ps1            # build + run, print verdict
#   powershell -ExecutionPolicy Bypass -File test.ps1 -NoBuild   # run the existing tests.html
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Only роща # suites whose name contains the text
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Mobile    # same, in a 390x844 window
#
# Prints only the head line and the FAILURES block; exit code 1 on any failure.
# Window must be 1280x800: at Chrome's default 800x600 the UI-overlap suite
# (91f-ui) fails for real — the rail and the pads do overlap on a small screen.
# -Mobile runs the same suites in a phone window instead: the layout guards are
# written to skip themselves when the window is not a phone, so without this
# switch the phone half of the interface is never actually measured.
param([switch]$NoBuild, [string]$Only = "", [switch]$Mobile)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $NoBuild) { & (Join-Path $root "build.ps1") | Out-Null }

$chrome = @("C:\Program Files\Google\Chrome\Application\chrome.exe",
            "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") |
          Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "no headless browser found (Chrome/Edge)" }

$url = "file:///" + ((Join-Path $root "tests.html") -replace "\\", "/")
if ($Only) { $url += "?only=" + [uri]::EscapeDataString($Only) }
$dom = Join-Path $env:TEMP "drift-tests-dom.html"
$err = Join-Path $env:TEMP "drift-tests-err.txt"
$win = if ($Mobile) { "390,844" } else { "1280,800" }
$argv = @("--headless=new", "--disable-gpu", "--no-sandbox", "--window-size=$win",
          "--user-data-dir=$($env:TEMP)\drift-tests-profile",
          "--no-first-run", "--no-default-browser-check",
          "--virtual-time-budget=20000", "--timeout=60000", "--dump-dom", $url)
Start-Process -FilePath $chrome -ArgumentList $argv -NoNewWindow -Wait `
  -RedirectStandardOutput $dom -RedirectStandardError $err | Out-Null
$html = [System.IO.File]::ReadAllText($dom, [System.Text.Encoding]::UTF8)

$m = [regex]::Match($html, '<pre id="testout"[^>]*>([\s\S]*?)</pre>')
if (-not $m.Success) {
  Write-Host "no test report in DOM: the page crashed before runTests (open tests.html in a browser)"
  exit 2
}
$text = [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value)
$lines = $text -split "`n"
$lines[0]
# Head is "FAILED N · passed P" or "ALL GREEN · passed P": a digit before the first dot means failures.
# The failures block follows the head after one blank line and ends at the next blank line.
if ($lines[0] -match '^\S+ \d+ ') {
  $j = 2
  while ($j -lt $lines.Count -and $lines[$j] -notmatch '^\s*$') { $lines[$j].TrimEnd(); $j++ }
  exit 1
}
exit 0
