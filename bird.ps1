# Сборка site/treplo3d.html из bird/.
#
# Птица в объёме — отдельный от игры модуль со своей сборкой, но по тем же
# правилам: исходники модулями в bird/, на выходе ОДИН самодостаточный файл.
# Его можно скачать, положить на рабочий стол и открыть двойным кликом —
# ни сервера, ни зависимостей, ни единой внешней картинки.
#
#   powershell -ExecutionPolicy Bypass -File bird.ps1
#   powershell -ExecutionPolicy Bypass -File bird.ps1 -Watch
#
# Порядок склейки — по именам файлов: весь код живёт в одной области видимости.

param([switch]$Watch)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $root "bird"
$out  = Join-Path $root "site\treplo3d.html"
$enc  = New-Object System.Text.UTF8Encoding($false)

function Build {
  $shell = [System.IO.File]::ReadAllText((Join-Path $src "index.html"), $enc)
  $css   = [System.IO.File]::ReadAllText((Join-Path $src "style.css"),  $enc)
  $files = Get-ChildItem (Join-Path $src "*.js") | Sort-Object Name
  if ($files.Count -eq 0) { throw "в bird/ нет ни одного .js" }
  $parts = foreach ($f in $files) { "/* ===== " + $f.Name + " ===== */`n" + [System.IO.File]::ReadAllText($f.FullName, $enc) }
  $js = $parts -join "`n"

  foreach ($mark in @("/*{{STYLE}}*/", "//{{SCRIPT}}")) {
    if ($shell -notmatch [regex]::Escape($mark)) { throw "в bird/index.html нет маркера $mark" }
  }
  $html = $shell.Replace("/*{{STYLE}}*/", $css).Replace("//{{SCRIPT}}", $js)
  [System.IO.File]::WriteAllText($out, $html, $enc)

  $kb = [math]::Round((Get-Item $out).Length / 1KB)
  Write-Output ("{0}  птица собрана из {1} модулей, {2} КБ" -f (Get-Date -Format "HH:mm:ss"), $files.Count, $kb)

  foreach ($f in $files) {
    $k = [math]::Round($f.Length / 1KB)
    if ($k -gt 40) { Write-Output ("  ! {0} — {1} КБ, пора делить" -f $f.Name, $k) }
  }
}

Build
if ($Watch) {
  $w = New-Object System.IO.FileSystemWatcher $src
  $w.Filter = "*.*"; $w.EnableRaisingEvents = $true
  Write-Output "жду правок в bird/ … Ctrl+C чтобы выйти"
  while ($true) {
    $r = $w.WaitForChanged([System.IO.WatcherChangeTypes]::Changed, 2000)
    if (-not $r.TimedOut) { Start-Sleep -Milliseconds 120; try { Build } catch { Write-Output $_.Exception.Message } }
  }
}