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
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false } catch {}   # вывод в UTF-8: в консоли cp437/cp866 русское печаталось «?» (новый комп, 27.09.2026)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $root "bird"
# путь собирается через Join-Path по частям: обратный слеш внутри строки на
# линуксовом раннере не разделитель, а часть имени — сборка в CI молча писала
# файл «site	replo3d.html» в корень, а на сайт уезжала прежняя птица
$out  = Join-Path (Join-Path $root "site") "treplo3d.html"
$enc  = New-Object System.Text.UTF8Encoding($false)

function Build {
  $shell = [System.IO.File]::ReadAllText((Join-Path $src "index.html"), $enc)
  $css   = [System.IO.File]::ReadAllText((Join-Path $src "style.css"),  $enc)
  $files = Get-ChildItem (Join-Path $src "*.js") | Sort-Object Name
  if ($files.Count -eq 0) { throw "no .js in bird/" }
  $parts = foreach ($f in $files) { "/* ===== " + $f.Name + " ===== */`n" + [System.IO.File]::ReadAllText($f.FullName, $enc) }
  $js = $parts -join "`n"

  foreach ($mark in @("/*{{STYLE}}*/", "//{{SCRIPT}}")) {
    if ($shell -notmatch [regex]::Escape($mark)) { throw "no marker $mark in bird/index.html" }
  }
  $html = $shell.Replace("/*{{STYLE}}*/", $css).Replace("//{{SCRIPT}}", $js)
  [System.IO.File]::WriteAllText($out, $html, $enc)

  $kb = [math]::Round((Get-Item $out).Length / 1KB)
  Write-Output ("{0}  bird built from {1} modules, {2} KB" -f (Get-Date -Format "HH:mm:ss"), $files.Count, $kb)

  foreach ($f in $files) {
    $k = [math]::Round($f.Length / 1KB)
    if ($k -gt 40) { Write-Output ("  ! {0} — {1} KB, time to split" -f $f.Name, $k) }
  }
}

Build
if ($Watch) {
  $w = New-Object System.IO.FileSystemWatcher $src
  $w.Filter = "*.*"; $w.EnableRaisingEvents = $true
  Write-Output "waiting for edits in bird/ … Ctrl+C to quit"
  while ($true) {
    $r = $w.WaitForChanged([System.IO.WatcherChangeTypes]::Changed, 2000)
    if (-not $r.TimedOut) { Start-Sleep -Milliseconds 120; try { Build } catch { Write-Output $_.Exception.Message } }
  }
}