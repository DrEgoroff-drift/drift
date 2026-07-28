# Сборка drift.html из src/.
#
# Игра остаётся одним самодостаточным файлом — открывается двойным кликом,
# без сервера и без зависимостей. Раздельные исходники нужны только для работы
# над кодом: править надо src/, а drift.html пересобирается.
#
#   powershell -ExecutionPolicy Bypass -File build.ps1
#   powershell -ExecutionPolicy Bypass -File build.ps1 -Watch
#
# Порядок склейки задан именами файлов (числовой префикс), потому что весь код
# живёт в одной области видимости: константы и таблицы должны быть объявлены
# раньше, чем их читают на верхнем уровне.

param([switch]$Watch)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $root "src"
$out  = Join-Path $root "drift.html"
$enc  = New-Object System.Text.UTF8Encoding($false)   # без BOM: посреди склейки он бы сломал JS

function Build {
  $shell = [System.IO.File]::ReadAllText((Join-Path $src "index.html"), $enc)
  $css   = [System.IO.File]::ReadAllText((Join-Path $src "style.css"),  $enc)

  $files = Get-ChildItem (Join-Path $src "*.js") | Sort-Object Name
  if ($files.Count -eq 0) { throw "в src/ нет ни одного .js — собирать нечего" }

  $parts = foreach ($f in $files) { [System.IO.File]::ReadAllText($f.FullName, $enc) }
  $js = $parts -join "`n"

  foreach ($mark in @("/*{{STYLE}}*/", "//{{SCRIPT}}")) {
    if ($shell -notmatch [regex]::Escape($mark)) { throw "в src/index.html нет маркера $mark" }
  }
  $html = $shell.Replace("/*{{STYLE}}*/", $css).Replace("//{{SCRIPT}}", $js)

  [System.IO.File]::WriteAllText($out, $html, $enc)
  $kb = [math]::Round((Get-Item $out).Length / 1KB)
  "{0}  собран из {1} модулей, {2} КБ" -f (Get-Date -Format "HH:mm:ss"), $files.Count, $kb
}

Build

if ($Watch) {
  "слежу за src/ — Ctrl+C чтобы остановить"
  $last = @{}
  while ($true) {
    Start-Sleep -Milliseconds 500
    $changed = $false
    foreach ($f in Get-ChildItem (Join-Path $src "*")) {
      if ($last[$f.FullName] -ne $f.LastWriteTimeUtc) {
        if ($last.ContainsKey($f.FullName)) { $changed = $true }
        $last[$f.FullName] = $f.LastWriteTimeUtc
      }
    }
    if ($changed) {
      try { Build } catch { "ошибка сборки: $_" }
    }
  }
}
