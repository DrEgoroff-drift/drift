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
  $msg = "{0}  собран из {1} модулей, {2} КБ" -f (Get-Date -Format "HH:mm:ss"), $files.Count, $kb

  # tests.html — та же игра плюс набор проверок в конце. Отдельный файл, чтобы
  # drift.html оставался чистым, и при этом тесты гоняли ровно тот же код.
  $tsrc = Join-Path $root "tests"
  if (Test-Path $tsrc) {
    $tfiles = Get-ChildItem (Join-Path $tsrc "*.js") | Sort-Object Name
    if ($tfiles.Count -gt 0) {
      $tparts = foreach ($f in $tfiles) { [System.IO.File]::ReadAllText($f.FullName, $enc) }
      $tjs = $js + "`n" + ($tparts -join "`n")
      $thtml = $shell.Replace("/*{{STYLE}}*/", $css).Replace("//{{SCRIPT}}", $tjs)
      [System.IO.File]::WriteAllText((Join-Path $root "tests.html"), $thtml, $enc)
      $msg += " · tests.html из {0} наборов" -f $tfiles.Count
    }
  }
  $msg += " · " + (Index $files $tfiles)
  $msg
  Bulk $files $tfiles
}

# Сторож размера. Не ошибка, а напоминание: модуль за 40 КБ уже нельзя прочитать
# целиком дёшево, и следующая веха в нём будет стоить дороже, чем распил. То же
# с живым планом — он обязан читаться за один раз, иначе смысл архива теряется.
#
# Правило про будущее, а не про прошлое. Четыре модуля уже перевалили за порог
# по делу: резать их сейчас — переписывать работающее ради круглого числа.
# Они записаны ниже со своим размером, и сторож молчит, пока они не РАСТУТ.
# Новый модуль, перешагнувший порог, — предупреждается сразу.
$BULK_KB = 40      # порог для модуля src/ и набора tests/
$PLAN_KB = 60      # порог для PLAN.md
$BULK_OLD = @{     # известные крупные, замерены 2026-08-07
  "21aa-base-rooms.js" = 49; "12c-mgr-core.js" = 45
  "26-ui-station.js"   = 44; "27f-hq-room.js"  = 40
}
function Bulk($files, $tfiles) {
  $big = @(@($files) + @($tfiles) | Where-Object {
    if (-not $_) { return $false }
    $kb = [math]::Round($_.Length / 1KB)
    if ($BULK_OLD.ContainsKey($_.Name)) { $kb -gt $BULK_OLD[$_.Name] } else { $kb -gt $BULK_KB }
  } | Sort-Object Length -Descending)
  if ($big.Count) {
    "  ! просятся на распил (>{0} КБ): {1}" -f $BULK_KB,
      (($big | ForEach-Object { "{0} {1} КБ" -f $_.Name, [math]::Round($_.Length / 1KB) }) -join ", ")
  }
  $plan = Join-Path $root "PLAN.md"
  if (Test-Path $plan) {
    $pkb = [math]::Round((Get-Item $plan).Length / 1KB)
    if ($pkb -gt $PLAN_KB) {
      "  ! PLAN.md разросся до {0} КБ: закрытые вехи пора переносить в docs/PLAN-archive.md" -f $pkb
    }
  }
}

# Индекс символов — docs/INDEX.md. Не для чтения человеком и не для загрузки
# целиком: это адресная книга, по которой grep за один вызов отвечает, в каком
# файле и на какой строке живёт функция. Дешевле, чем читать модуль по 80 КБ.
function Index($files, $tfiles) {
  $all = @(@($files) + @($tfiles) | Where-Object { $_ })
  $lines = New-Object System.Collections.ArrayList
  $sym   = New-Object System.Collections.ArrayList
  $n = 0
  foreach ($f in $all) {
    $rel = ($f.FullName.Substring($root.Length + 1)) -replace '\\', '/'
    $text = [System.IO.File]::ReadAllText($f.FullName, $enc)
    $rows = $text -split "`n"
    $kb = [math]::Round($f.Length / 1KB)
    # заголовки разделов /* ═══ имя ═══ */ — крупные вехи внутри файла
    $secs = @()
    for ($i = 0; $i -lt $rows.Count; $i++) {
      if ($rows[$i] -match '^\s*/\*\s*[═=]{3,}\s*(.+?)\s*[═=]{3,}') { $secs += ("{0}:{1}" -f $matches[1], ($i + 1)) }
      if ($rows[$i] -match '^(?:function\s*\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)') {
        [void]$sym.Add(("{0,-28} {1}:{2}" -f $matches[1], $rel, ($i + 1)))
        $n++
      }
    }
    [void]$lines.Add("")
    [void]$lines.Add(("## {0} · {1} КБ" -f $rel, $kb))
    if ($secs.Count) { foreach ($s in $secs) { [void]$lines.Add("  · $s") } }
  }
  $head = @(
    "# Индекс «Дрейфа» — генерируется build.ps1, руками не править",
    "",
    "Адресная книга исходников: где что лежит, с точностью до строки.",
    "Читать целиком не надо — искать grep-ом:",
    "",
    '    grep -n "^rareTake " docs/INDEX.md      # где объявлен символ',
    '    grep -n "^## src/12" docs/INDEX.md      # что за файл и какого размера',
    "",
    ("Файлов: {0} · символов верхнего уровня: {1}" -f $all.Count, $n),
    "",
    "## СИМВОЛЫ",
    ""
  )
  $body = @("", "## ФАЙЛЫ И РАЗДЕЛЫ")
  $doc = ($head + ($sym | Sort-Object) + $body + $lines) -join "`n"
  $dir = Join-Path $root "docs"
  if (-not (Test-Path $dir)) { [void](New-Item -ItemType Directory $dir) }
  [System.IO.File]::WriteAllText((Join-Path $dir "INDEX.md"), $doc, $enc)
  "INDEX.md: {0} символов" -f $n
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
