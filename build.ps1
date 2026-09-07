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

# Порядок склейки — по байтам (ordinal), а не по культуре: Sort-Object Name на
# Windows ставит «12v-wander-shop» раньше «12v-wander-shop-cosm», а pwsh на
# ubuntu-раннере — наоборот, и 0.359.0 уехал на сайт с TDZ на WANDER_CAT.
# Один порядок на обеих машинах, и тесты гоняют ровно тот файл, что уедет.
function Sort-Ordinal($items) {
  $a = @($items); [Array]::Sort($a, [System.Comparison[object]]{ param($x, $y) [string]::CompareOrdinal($x.Name, $y.Name) }); return $a
}

function Build {
  $shell = [System.IO.File]::ReadAllText((Join-Path $src "index.html"), $enc)
  $css   = [System.IO.File]::ReadAllText((Join-Path $src "style.css"),  $enc)

  $files = Sort-Ordinal (Get-ChildItem (Join-Path $src "*.js"))
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
    $tfiles = Sort-Ordinal (Get-ChildItem (Join-Path $tsrc "*.js"))
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
# Замер обновлён 2026-08-15: файлы подросли на своих вехах, и сторож начал
# кричать на каждой сборке — а крик, который не ведёт к действию, учит его
# не замечать. Здесь записано новое «сколько есть», и молчание снова значит
# «не растёт». Долг на распил при этом никуда не делся и записан в PLAN.md:
# `23-mode-dig` и `27e-ui-home` перешагнули порог и ждут своей очереди.
# 2026-08-16: `21aa-base-rooms` распилен по шву (кисти и `drawModule` здесь,
# восемь помещений — в `21ab-base-interiors`) и вышел из списка совсем: долг
# отдан, а не переписан. `21a-mode-base` при этом подрос за проходы по базе и
# в список НЕ вносится — пусть кричит, он следующий на очереди.
# 2026-08-25: отдано ещё пять долгов — `12tb-settle-draw` (промыслы →
# `12tc-settle-crafts`), `23a-dig-draw` (порода → `23aa-dig-rock`), `20-life`
# (звери → `20f-fauna`), `21b-surface-deco` (формы примет → `21ba-deco-shapes`)
# и `26-ui-station` (четыре вкладки → `26b-ui-station-work`). Двое последних
# вышли из этого списка СОВСЕМ (26-ui-station 36 КБ, 23-mode-dig 15 КБ после
# давнего распила): поблажка снимается вместе с долгом, иначе она вечная.
$BULK_OLD = @{     # известные крупные; замер обновлён 2026-09-02 (было 3 имени от 2026-08-15,
                   # сторож кричал на 17 модулей каждую сборку — см. правило выше: молчание = «не растёт»)
  "14-save.js" = 58
  "12ud-smena-text.js" = 560   # текст романа (M353): таблица, не делится
  "21ac-base-draw.js" = 48   # 0.410.0: небо, гора и порода уехали в 21ab1-base-ground
  "26-ui-station.js" = 50
  "24aa-raid-draw.js" = 50
  "12c-mgr-core.js" = 48
  "27k-road.js" = 47
  "21e-surface-draw.js" = 47
  "25g-postcard.js" = 45
  "27c-ui-hq.js" = 44
  "27e-ui-home.js" = 44
  "21-mode-surface.js" = 44
  "27l-road-draw.js" = 44
  "12y-parrot-face.js" = 42
  "27f-hq-room.js" = 42
  "29d-home-draw.js" = 41
  "22-mode-cave.js" = 41
  "23a-dig-draw.js" = 41
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
  # ── кодировка скриптов ──
  # Windows PowerShell 5.1 читает .ps1 БЕЗ BOM как ANSI-кодировку системы, и
  # весь русский в файле превращается в кракозябры — молча, без ошибки. Так
  # уже уехал стенд, у которого подписи на листе стали "Р”Р’Р•РќРђР”Р¦РђРўР¬".
  # Проверять глазами бесполезно: в редакторе файл выглядит правильно.
  # Читаем байты через .NET, а НЕ через `Get-Content -Encoding Byte`: этого
  # параметра нет в PowerShell Core, и на ubuntu-раннере сборка падала на нём с
  # ошибкой привязки параметра. Падала молча для человека: локально всё
  # собиралось (5.1 параметр знает), а выкладка не уезжала на сайт шесть версий
  # подряд. Один и тот же скрипт обязан работать в обеих оболочках.
  $noBom = @(Get-ChildItem $root -Recurse -Filter *.ps1 |
    Where-Object { $_.FullName -notmatch '[\\/](node_modules|\.git)[\\/]' } |
    Where-Object {
      $raw = [IO.File]::ReadAllBytes($_.FullName)
      if ($raw.Length -ge 3 -and $raw[0] -eq 0xEF -and $raw[1] -eq 0xBB -and $raw[2] -eq 0xBF) { return $false }
      # есть хоть один байт >127 — значит в файле есть не-ASCII, то есть русский
      foreach ($b in $raw) { if ($b -gt 127) { return $true } }
      $false
    })
  if ($noBom.Count) {
    "  ! .ps1 с русским текстом и БЕЗ BOM (5.1 прочтёт как ANSI): {0}" -f
      (($noBom | ForEach-Object { $_.Name }) -join ", ")
  }
  # ── вызов в никуда ──
  # `if (typeof foo === "function") foo()` — привычная в этом проекте оговорка:
  # модули собираются в один файл, и защита почти всегда лишняя. Но если такой
  # функции НЕТ, проверка глотает вызов молча, и игра продолжает обещать то,
  # чего не делает. Так сделка «Он пришёл к вам в звено — даром» три десятка
  # версий не давала наёмника (25.08.2026, `crewGift`). Правило проекта про
  # перки — «подпись без кода это ложь» — тут ровно то же самое.
  $srcAll = ($files | ForEach-Object { [IO.File]::ReadAllText($_.FullName, [Text.Encoding]::UTF8) }) -join "`n"
  $ghosts = @()
  foreach ($nm in ([regex]::Matches($srcAll, 'typeof\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*===?\s*"function"') |
                   ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)) {
    $decl = "(function\s+$nm\s*\(|(const|let|var)\s+$nm\s*=|\b$nm\s*=\s*function)"
    if (-not [regex]::IsMatch($srcAll, $decl)) { $ghosts += $nm }
  }
  if ($ghosts.Count) {
    "  ! typeof-проверка бережёт несуществующую функцию (вызов не сработает НИКОГДА): {0}" -f
      ($ghosts -join ", ")
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

# Птица одним файлом. На сайте `parrot.html` тянет стиль и код ссылками — это
# правильно для сайта и неправильно для «скачайте себе»: скачанная страница
# офлайн осталась бы пустой. Поэтому самодостаточный `treplo.html` собирается
# здесь же, из тех же исходников, и на сайте лежит рядом.
function Bird {
  $s = Join-Path $root "site"
  $src = Join-Path $s "parrot.html"
  if (-not (Test-Path $src)) { return "птицы нет" }
  $h = [System.IO.File]::ReadAllText($src, $enc)

  foreach ($pair in @(@("/site.css","style"), @("/planets.js","script"),
                      @("/sky.js","script"), @("/parrot.js","script"))) {
    $file = Join-Path $s ($pair[0].TrimStart("/"))
    if (-not (Test-Path $file)) { throw "нет $file — птица не соберётся" }
    $body = [System.IO.File]::ReadAllText($file, $enc)
    if ($pair[1] -eq "style") {
      $h = $h.Replace('<link rel="stylesheet" href="/site.css">', "<style>`n$body`n</style>")
    } else {
      $h = $h.Replace('<script src="' + $pair[0] + '"></script>', "<script>`n$body`n</script>")
    }
  }
  # то, что вне файла не работает: манифест, установка, значки с сайта
  $h = $h -replace '<link rel="manifest"[^>]*>', ''
  $h = $h -replace '<link rel="(icon|alternate icon|apple-touch-icon)"[^>]*>', ''
  # ссылки на сайт делаем абсолютными — из файла относительные ведут в никуда
  $h = $h -replace 'href="/([^"]*)"', 'href="https://drift-game.ru/$1"'
  $h = $h.Replace('href="https://drift-game.ru/parrot.html" download="treplo.html"',
                  'href="https://drift-game.ru/treplo.html" download="treplo.html"')

  $out = Join-Path $s "treplo.html"
  [System.IO.File]::WriteAllText($out, $h, $enc)
  "treplo.html: {0} КБ" -f [math]::Round((Get-Item $out).Length / 1KB)
}

# Летопись войны для сайта (M411). Карта на drift-game.ru/war.html повторяет
# ту же историю, что и клиенты, — тем же кодом: здесь из src/ склеивается
# `site/war.js` — заголовок с заглушками (`site/war-head.js`) плюс модули
# летописи в порядке склейки игры. Список явный: страница не должна тянуть
# шесть мегабайт игры ради трёхсот систем и шести агентов.
$WAR_MODULES = @("01-core.js", "03a-hull-maker.js", "12al-powers.js",
  "12am-chron-agents.js", "12am-chron-director.js", "12am-chron-lines.js", "12am-chron.js",
  "12at-vote.js", "12au-rites.js", "12av-boss.js", "12aw-circ.js", "12b0-fx-pow.js", "14b-war-net.js")
function War {
  $s = Join-Path $root "site"
  $head = Join-Path $s "war-head.js"
  if (-not (Test-Path $head)) { return "летописи для сайта нет" }
  $parts = @([System.IO.File]::ReadAllText($head, $enc))
  foreach ($m in $WAR_MODULES) {
    $f = Join-Path $src $m
    if (-not (Test-Path $f)) { throw "нет $f — war.js не соберётся" }
    $parts += [System.IO.File]::ReadAllText($f, $enc)
  }
  $out = Join-Path $s "war.js"
  [System.IO.File]::WriteAllText($out, ($parts -join "`n"), $enc)
  "war.js: {0} КБ из {1} модулей" -f [math]::Round((Get-Item $out).Length / 1KB), $WAR_MODULES.Count
}

Build
Bird
War

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
