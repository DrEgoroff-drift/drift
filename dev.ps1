# Дев-стенд на сервере: текущая сборка и листы сравнения по своему адресу.
#
#   powershell -ExecutionPolicy Bypass -File dev.ps1
#   powershell -ExecutionPolicy Bypass -File dev.ps1 -SkipBuild
#   powershell -ExecutionPolicy Bypass -File dev.ps1 -Shots        # только листы
#
# Зачем. Смотреть работу через headless-снимки — способ спорить с картинкой
# вместо того, чтобы её видеть: PNG не походишь ногами, ночь в нём не подождёшь,
# на телефоне не откроешь. Здесь то же самое, но руками:
#
#   https://drift-game.ru/dev.html   — ИМЕННО ЭТА сборка, играется как обычно
#   https://drift-game.ru/dev/       — все листы стендов, свежесть каждого
#
# Боевую игру не трогает вовсе: play.html, index.html, api.php остаются как
# были, выкладка идёт в отдельные имена. Поэтому сюда можно класть сломанное.
param([switch]$SkipBuild, [switch]$Shots)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$file = Join-Path $root "drift.html"
$web  = "drift:drift-game.ru/docs"

if (-not $SkipBuild -and -not $Shots) {
  & powershell -ExecutionPolicy Bypass -File (Join-Path $root "build.ps1")
}

$ver = (Select-String -Path (Join-Path $root "src\01-core.js") -Pattern 'VER="([0-9.]+)"').Matches[0].Groups[1].Value
$now = Get-Date -Format "dd.MM.yyyy HH:mm"

ssh drift "mkdir -p drift-game.ru/docs/dev/shots"
if ($LASTEXITCODE -ne 0) { throw "не удалось создать папку стенда" }

# ── листы стендов ──
$shotDir = Join-Path $root "docs\shots"
$sheets = Get-ChildItem $shotDir |
         Where-Object { -not $_.PSIsContainer -and $_.Name -match '\.(png|webp|jpg)$' } |
         Sort-Object LastWriteTime -Descending

# ── страница стенда ──
# Собирается здесь, а не на сервере: PHP для списка картинок не нужен, а
# статическая страница переживает любой сбой бэкенда.
$rows = ($sheets | ForEach-Object {
  $kb = [math]::Round($_.Length / 1KB)
  $age = [math]::Round(((Get-Date) - $_.LastWriteTime).TotalHours, 1)
  @"
<figure>
  <figcaption><b>$($_.BaseName)</b> <span>$($_.LastWriteTime.ToString('dd.MM HH:mm')) · $kb КБ · $age ч назад</span></figcaption>
  <a href="shots/$($_.Name)" target="_blank"><img loading="lazy" src="shots/$($_.Name)" alt="$($_.BaseName)"></a>
</figure>
"@
}) -join "`n"

$html = @"
<!doctype html><html lang="ru"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Дрейф · дев-стенд $ver</title>
<style>
:root{--bg:#0b0e12;--fg:#c9d6df;--dim:#6d7a86;--acc:#7fe6d8;--line:#1b232c}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
header{position:sticky;top:0;background:rgba(11,14,18,.94);border-bottom:1px solid var(--line);padding:14px 18px;z-index:2}
h1{margin:0 0 4px;font-size:16px;letter-spacing:.04em}
header p{margin:0;color:var(--dim);font-size:12px}
a{color:var(--acc);text-decoration:none}
a:hover{text-decoration:underline}
.play{display:inline-block;margin-top:10px;padding:9px 16px;border:1px solid var(--acc);border-radius:3px;min-height:44px;line-height:26px}
main{padding:18px;display:grid;gap:22px;grid-template-columns:1fr}
figure{margin:0;border:1px solid var(--line);border-radius:4px;overflow:hidden;background:#070a0d}
figcaption{padding:8px 10px;border-bottom:1px solid var(--line);font-size:12px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
figcaption span{color:var(--dim)}
img{display:block;width:100%;height:auto}
footer{padding:18px;color:var(--dim);font-size:12px;border-top:1px solid var(--line)}
</style></head><body>
<header>
  <h1>ДРЕЙФ · ДЕВ-СТЕНД</h1>
  <p>сборка $ver · выложена $now · боевая игра на <a href="/play.html">/play.html</a> не тронута</p>
  <a class="play" href="/dev.html">ИГРАТЬ ЭТУ СБОРКУ →</a>
</header>
<main>
$rows
</main>
<footer>Листы строятся docs/mk*.ps1, снимаются docs/shot.ps1, выкладываются dev.ps1.</footer>
</body></html>
"@

$tmp = Join-Path $env:TEMP "drift-dev-index.html"
[IO.File]::WriteAllText($tmp, $html, (New-Object Text.UTF8Encoding $false))

scp $tmp "$web/dev/index.html"
if ($LASTEXITCODE -ne 0) { throw "scp index стенда вернул $LASTEXITCODE" }
if ($sheets.Count -gt 0) {
  scp ($sheets.FullName) "$web/dev/shots/"
  if ($LASTEXITCODE -ne 0) { throw "scp листов вернул $LASTEXITCODE" }
}

if (-not $Shots) {
  scp $file "$web/dev.html"
  if ($LASTEXITCODE -ne 0) { throw "scp сборки вернул $LASTEXITCODE" }
  ssh drift "cd drift-game.ru/docs && gzip -kf9 dev.html"
}

$kb = [math]::Round((Get-Item $file).Length / 1KB)
"{0}  дев-стенд {1} · сборка {2} КБ · листов {3}" -f (Get-Date -Format "HH:mm:ss"), $ver, $kb, $sheets.Count
"           https://drift-game.ru/dev/      — листы"
"           https://drift-game.ru/dev.html  — играть эту сборку"
