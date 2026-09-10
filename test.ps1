# Headless run of tests.html — the cheap way to verify.
#
#   powershell -ExecutionPolicy Bypass -File test.ps1            # build + run, print verdict
#   powershell -ExecutionPolicy Bypass -File test.ps1 -NoBuild   # run the existing tests.html
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Only роща # suites whose name contains the text
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Mobile    # same, in a 390x844 window
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Size 1440,1440  # tall window: UI zoom at its ceiling
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Fuzz 4000 # long fuzz over every mode
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Full -Jobs 6  # split the run across six Chromes
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Full -Times   # real clock: the thirty slowest suites
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Probe         # the "проба" stands: economy numbers, no verdict
#   powershell -ExecutionPolicy Bypass -File test.ps1 -Full -Jobs 2 -Shuffle 7  # suites in a shuffled order (one seed, one order)
#
# Prints only the head line and the FAILURES block; exit code 1 on any failure.
# Window must be 1280x800: at Chrome's default 800x600 the UI-overlap suite
# (91f-ui) fails for real — the rail and the pads do overlap on a small screen.
# -Mobile runs the same suites in a phone window instead: the layout guards are
# declared {win:"phone"} and do not run in a desktop window at all, so without
# this switch the phone half of the interface is never actually measured.
param([switch]$NoBuild, [string]$Only = "", [switch]$Mobile, [int]$Fuzz = 0, [int]$Seed = 0, [string]$Size = "", [switch]$Full, [switch]$Browser, [int]$Jobs = 0, [switch]$Times, [switch]$Probe, [string]$Shuffle = "")
# ── три яруса (0.359.3; автор 06.09: «в разработке никто хром не запускает», «быстрый — 20 с») ──
#   test.ps1            Node: формулы и данные (325 наборов, ~5 с) + дым в Хроме: игра сама
#                       прожила кадр (~2 с). Итого под десять секунд. Это прогон на каждую правку.
#   test.ps1 -Browser   Хром, картинка и интерфейс без тяжёлых сетей (~30 с) — после правок в рисовании и вёрстке.
#   test.ps1 -Full      Хром, всё, включая тяжёлые сети (~95 с) — по просьбе, перед релизом.
#   -Only/-Mobile/-Fuzz/-Size идут в Хром, как раньше.
# ── и с 0.426.0 прогон делится (замер 10.09.2026, шестнадцать ядер) ──
#   -Full шёл 292 с одной страницей. Три вещи по очереди: убран --disable-gpu
#   (280 → 230 с), прогон роздан шести Хромам (230 → 97 с), и из самих наборов
#   вынуто лишнее ожидание (в странице 280 → 104 с работы). Итог — 93 с.
#   -Jobs N задаёт число частей руками, -Jobs 1 возвращает одну страницу.
#   -Times меряет по настоящим часам и печатает тридцать самых долгих наборов;
#   -Probe зовёт стенды «проба · …», которые ничего не утверждают.
$root0 = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodeExe -and (Test-Path "C:\Claude\tools\node\node.exe")) { $nodeExe = "C:\Claude\tools\node\node.exe" }
$nodeTier = -not ($Full -or $Browser -or $Only -or $Mobile -or $Fuzz -or $Size -or $Times -or $Jobs -or $Probe)
if ($nodeTier -and -not $nodeExe) { "node не найден (C:\Claude\tools\node или PATH) — идём через Хром"; $nodeTier = $false; $Browser = $true }
if ($nodeTier) {
  [Console]::OutputEncoding = [Text.Encoding]::UTF8   # node пишет UTF-8; консоль 5.1 по умолчанию cp866
  if (-not $NoBuild) { & powershell -ExecutionPolicy Bypass -File (Join-Path $root0 "build.ps1") | Out-Null }
  $nargs = @((Join-Path $root0 "test-node.js")); if ($Shuffle) { $nargs += "--shuffle=$Shuffle" }
  & $nodeExe @nargs
  $nodeRc = $LASTEXITCODE
  # и дым: страница в Хроме открылась, цикл прожил кадр, сторож молчит — то, чего Node не видит
  $NoBuild = $true; $Only = "игра запустилась сама"
}

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
# -Full — все наборы, включая тяжёлые (ярус heavy объявляет сам набор, 90-harness); по умолчанию быстрый ярус
if ($Full) { $sep = if ($url -match "\?") { "&" } else { "?" }; $url += "$sep" + "full=1" }
# «проба · …» — стенды, а не проверки: они печатают числа экономики и не судят
# ничего (ok(true,…) целиком). Обычный прогон их не зовёт, -Probe зовёт.
if ($Probe) { $sep = if ($url -match "\?") { "&" } else { "?" }; $url += "$sep" + "probe=1" }
# -Shuffle N: наборы в перемешанном порядке (?shuffle=N, M442). Одно зерно — один
# порядок, и все части прогона мешают одинаково, так что раздача по частям сходится.
# Набор, который краснеет только в перемешке, зелёный лишь после соседа — это утечка.
if ($Shuffle) { $sep = if ($url -match "\?") { "&" } else { "?" }; $url += "$sep" + "shuffle=$Shuffle" }
# Замер говорит странице, что часы настоящие: тогда прогон идёт синхронно,
# и Chrome не успевает снять разметку до отчёта (99-run.js объясняет).
if ($Times) { $sep = if ($url -match "\?") { "&" } else { "?" }; $url += "$sep" + "times=1" }
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
# ── сколько частей и с какими часами ──
# Наборы независимы по замыслу (каждый начинается с resetWorld), поэтому их
# можно раздать НЕСКОЛЬКИМ Хромам сразу: машина шестнадцатиядерная, а прогон
# всю жизнь шёл в одну страницу. Делим только тяжёлые прогоны — короткому
# дым-прогону старт второго Хрома стоит дороже самой работы, а -Only и -Fuzz
# и без того гоняют один-два набора.
# Шесть частей — не круглое число, а замер 10.09.2026 на шестнадцати ядрах:
# 1 часть 230 с, 4 — 131 с, 6 — 97 с, 8 — 114 с, 12 — 147 с. Дальше шести
# Хромы дерутся за одну видеокарту и мешают друг другу больше, чем помогают.
# На машине поменьше берём половину ядер, но не больше шести и не меньше двух.
$cores = [int]$env:NUMBER_OF_PROCESSORS; if ($cores -lt 2) { $cores = 2 }
if ($Jobs -le 0) { $Jobs = if (($Full -or $Browser) -and -not $Only -and -not $Fuzz) { [Math]::Min(6, [Math]::Max(2, [Math]::Floor($cores / 2))) } else { 1 } }
if ($Only -or $Fuzz) { $Jobs = 1 }
# Замер идёт ОДНОЙ страницей, и не ради простоты: шесть Хромов дерутся за
# видеокарту, и время набора в такой толпе — время очереди, а не набора. Плюс
# без виртуальных часов страница не обязана дождаться конца прогона, прежде чем
# отдать разметку: свободная минута на старте — и Chrome снимает пустой отчёт.
# Одна страница занимает поток сразу и этой минуты не даёт.
if ($Times) { $Jobs = 1 }
# -Times: те же наборы, но с НАСТОЯЩИМИ часами. Под --virtual-time-budget время
# внутри синхронного блока стоит, и отчёт годами печатал «0 мс» — а значит
# «самые долгие» никто никогда не видел, и список тяжёлых наборов держался
# на памяти, а не на замере. Без бюджета часы идут, прогон дольше, зато
# видно, за что платим.
$vt = if ($Times) { @() } else { @("--virtual-time-budget=20000") }

# ── у каждого прогона свои файлы и свой профиль ──
# Дамп, поток ошибок и профиль Chrome были ОБЩИЕ на всю машину, и два сеанса
# в одном дереве мешали друг другу молча: занятый профиль — Chrome не встаёт и
# не пишет ничего, а харнесс читает дамп ЧУЖОГО прогона и бодро печатает «ВСЁ
# ЗЕЛЁНОЕ» про сборку, которой в этот момент нет. Так и вышло 05.09.2026 у обоих
# сеансов сразу, и стоило это часа на двоих. Суффикс из PID разводит прогоны;
# дамп всё равно сносится до старта, чтобы пустой запуск нельзя было прочитать
# как удачный. Часть прогона добавляет к суффиксу свой номер.
$tag = $PID
# Профили копятся в TEMP: чистим свой и чужие брошенные старше суток, чтобы
# папка не росла прогонами, которых давно нет.
Get-ChildItem (Join-Path $env:TEMP "drift-tests-profile-*") -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-1) } |
  ForEach-Object { Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }
# -Size "W,H" — третий размер окна. Мерка интерфейса (--ui = clamp(H/760,1,1.75))
# на 1280x800 почти единица, то есть режим увеличенного интерфейса — высокий
# экран, 4K, планшет — не мерился ничем. -Size "1440,1440" даёт --ui 1.75.
$win = if ($Size) { $Size } elseif ($Mobile) { "390,844" } else { "1280,800" }

# ── картинку печёт видеокарта, а не процессор ──
# `--disable-gpu` стоял здесь с первого дня и стоил втрое: в headless без него
# Chrome берёт настоящую карту, и канва рисуется аппаратно. Замер 09.09.2026 на
# самом дорогом наборе («печь: вечер»): 49 с с флагом и 17 с без него. Наборов,
# которые рисуют, в прогоне тысячи кадров — отсюда и весь счёт. Если карты нет,
# Chrome сам сходит на SwiftShader: флаг не нужен и там.
$runs = @()
for ($k = 0; $k -lt $Jobs; $k++) {
  $u = $url
  if ($Jobs -gt 1) { $sep = if ($u -match "\?") { "&" } else { "?" }; $u += "$sep" + "shard=$k/$Jobs" }
  $dom = Join-Path $env:TEMP "drift-tests-dom-$tag-$k.html"
  Remove-Item $dom -Force -ErrorAction SilentlyContinue
  $errf = Join-Path $env:TEMP "drift-tests-err-$tag-$k.txt"
  $argv = @("--headless=new", "--no-sandbox", "--window-size=$win",
            "--user-data-dir=$($env:TEMP)\drift-tests-profile-$tag-$k",
            "--no-first-run", "--no-default-browser-check", "--timeout=900000") +
          $vt + @("--dump-dom", $u)
  $proc = Start-Process -FilePath $chrome -ArgumentList $argv -NoNewWindow -PassThru -RedirectStandardOutput $dom -RedirectStandardError $errf
  $runs += [pscustomobject]@{ proc = $proc; dom = $dom; k = $k }
}
# Секунды считаем ЗДЕСЬ: внутри страницы часы стоят (--virtual-time-budget), и
# отчёт годами печатал «0 мс». Снаружи время настоящее, вместе со стартом Chrome.
$sw = [Diagnostics.Stopwatch]::StartNew()
foreach ($r in $runs) { $r.proc.WaitForExit() }
$sw.Stop()

# Chrome выходит НЕ мгновенно: дочерний процесс (crashpad, utility) держит
# унаследованный дескриптор перенаправленного вывода ещё секунду-другую после
# того, как процесс завершился. Чтение сразу падало с IOException, а иногда
# успевало прочитать пустой файл и соврать «страница упала до runTests». На
# коротком прогоне (-Only) не воспроизводилось никогда, на полном — стабильно.
function Read-Dump($dom) {
  $html = ""
  for ($i = 0; $i -lt 60; $i++) {
    try { $html = if (Test-Path $dom) { [System.IO.File]::ReadAllText($dom, [System.Text.Encoding]::UTF8) } else { "" } } catch { $html = "" }
    # ждём не появления тега, а ЗАКРЫТОГО блока: файл дописывается порциями, и
    # по одному открывающему тегу можно прочитать обрезанный отчёт
    if ($html -match '(?s)id="testout"[^>]*>.*?</pre>') { break }
    Start-Sleep -Milliseconds 250
  }
  if ($html.Length -eq 0) { return $null }
  $m = [regex]::Match($html, '<pre id="testout"[^>]*>([\s\S]*?)</pre>')
  if (-not $m.Success) { return "" }
  return [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value)
}

# ── отчёты частей складываются в один ──
# Заголовок части: «ПРОВАЛЕНО N · пройдено P · наборов R из S …» либо «ВСЁ ЗЕЛЁНОЕ · …».
# Блок провалов идёт после заголовка через пустую строку и кончается пустой строкой.
$pass = 0; $fail = 0; $ran = 0; $all = 0; $tail = ""; $fails = @(); $slowest = @()
# карантин (опция stage у набора, M442): провалы печатаются своей строкой и не решают вердикт
$stRan = 0; $stFail = 0; $staged = @(); $offWin = 0
foreach ($r in $runs) {
  $text = Read-Dump $r.dom
  if ($null -eq $text) {
    Write-Host "chrome wrote no DOM at all: the headless run did not start (stale profile?) — retry"
    exit 2
  }
  if ($text -eq "") {
    Write-Host "no test report in DOM: the page crashed before runTests (open tests.html in a browser)"
    exit 2
  }
  $lines = $text -split "`n"
  $h = $lines[0].TrimEnd()
  if ($h -match 'пройдено (\d+)')         { $pass += [int]$Matches[1] }
  if ($h -match '^ПРОВАЛЕНО (\d+)')       { $fail += [int]$Matches[1] }
  if ($h -match 'наборов (\d+) из (\d+)') { $ran += [int]$Matches[1]; $all = [int]$Matches[2] }
  # хвост заголовка (без тяжёлых / полный / без картинки) один на все части
  if ($h -match ' · карантин (\d+)') { $stRan += [int]$Matches[1] }
  if ($h -match ' · не в своём окне (\d+)') { $offWin += [int]$Matches[1] }
  if ($h -match ' · карантин \d+ \(провалов (\d+)\)') { $stFail += [int]$Matches[1] }
  if ($h -match 'из \d+(.*)$') { $t = $Matches[1] -replace ' · часть \d+/\d+', '' -replace ' · карантин \d+( \(провалов \d+\))?', '' -replace ' · не в своём окне \d+ \(win\)', ''; if ($t.Length -gt $tail.Length) { $tail = $t } }
  for ($i = 1; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^КАРАНТИН') { for ($i++; $i -lt $lines.Count -and $lines[$i] -notmatch '^\s*$'; $i++) { $staged += $lines[$i].TrimEnd() }; break }
  }
  if ($lines[0] -match '^\S+ \d+ ') {
    $j = 2
    while ($j -lt $lines.Count -and $lines[$j] -notmatch '^\s*$') { $fails += $lines[$j].TrimEnd(); $j++ }
  }
  if ($Times) {
    for ($i = 0; $i -lt $lines.Count; $i++) {
      if ($lines[$i] -match '^САМЫЕ ДОЛГИЕ') {
        for ($i++; $i -lt $lines.Count -and $lines[$i] -match '^\s+(\d+)\s\s(.+)$'; $i++) { $slowest += , @([int]$Matches[1], $Matches[2].TrimEnd()) }
        break
      }
    }
  }
}
# наборы не в своём окне (опция win) складываются по частям, как и карантин
if ($offWin) { $tail += " · не в своём окне $offWin (win)" }
"{0} · пройдено {1} · наборов {2} из {3}{4}{5} · {6:N1} с" -f $(if ($fail) { "ПРОВАЛЕНО $fail" } else { "ВСЁ ЗЕЛЁНОЕ" }), $pass, $ran, $all, $tail, $(if ($Jobs -gt 1) { " · частей $Jobs" } else { "" }), $sw.Elapsed.TotalSeconds
if ($stRan) { "карантин (в вердикт не идёт): наборов $stRan, провалов $stFail"; $staged | ForEach-Object { $_ } }
if ($Times -and $slowest.Count) {
  "САМЫЕ ДОЛГИЕ (мс):"
  $slowest | Sort-Object { - $_[0] } | Select-Object -First 30 | ForEach-Object { "  {0,6}  {1}" -f $_[0], $_[1] }
}
if ($fail) { $fails | ForEach-Object { $_ }; exit 1 }
if ($nodeTier -and $nodeRc -ne 0) { exit 1 }
exit 0
