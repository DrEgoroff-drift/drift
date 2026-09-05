# Публикация «Дрейфа» на drift-game.ru.
#
# На сайте три файла и у каждого своя судьба:
#   index.html  — заглавная (site/index.html), меняется редко
#   play.html   — сама игра (drift.html), меняется каждую сборку
#   api.php     — учётные записи и облачные сохранения (site/api.php)
#
# Ключ и адрес живут в ~/.ssh/config под именем `drift`, пароль не нужен и здесь
# не хранится. Ровно то же самое делает GitHub Actions на каждый push в main —
# этот скрипт нужен для выкладки вручную, когда ждать сборку неохота.
#
#   powershell -ExecutionPolicy Bypass -File deploy.ps1
#   powershell -ExecutionPolicy Bypass -File deploy.ps1 -SkipBuild
#   powershell -ExecutionPolicy Bypass -File deploy.ps1 -SiteOnly   # только заглавная и api
#
# Откат на заглушку хостера:
#   ssh drift "cp ~/drift-game.ru/docs/_hoster-stub.html ~/drift-game.ru/docs/index.html"

param([switch]$SkipBuild, [switch]$SiteOnly)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$file = Join-Path $root "drift.html"
$web  = "drift:drift-game.ru/docs"

if (-not $SkipBuild -and -not $SiteOnly) {
  & powershell -ExecutionPolicy Bypass -File (Join-Path $root "build.ps1")
  if ($LASTEXITCODE -ne 0) { throw "build.ps1 вернул $LASTEXITCODE — заливка отменена" }
}

function Put($local, $remote) {
  if (-not (Test-Path $local)) { throw "нет файла $local" }
  scp $local "$web/$remote"
  if ($LASTEXITCODE -ne 0) { throw "scp $remote вернул $LASTEXITCODE — выкладка не состоялась" }
}

$ver = (Select-String -Path (Join-Path $root "src\01-core.js") -Pattern 'VER="([0-9.]+)"').Matches[0].Groups[1].Value

# version.json пишет тот, кто выкладывает: заглавная показывает не то, что лежит
# в исходниках, а то, что действительно уехало на сайт.
$vj = Join-Path $root "version.json"
'{{"ver":"{0}","date":"{1}"}}' -f $ver, (Get-Date -Format "dd.MM.yyyy") |
  Set-Content -Path $vj -Encoding utf8 -NoNewline

# Сайт уезжает целиком: страниц и картинок стало больше одной, и перечислять их
# по именам — способ однажды забыть новую.
ssh drift "mkdir -p drift-game.ru/docs/shots drift-game.ru/docs/icons"
if ($LASTEXITCODE -ne 0) { throw "не удалось подготовить папки на сервере" }
scp -r (Join-Path $root "site\*") "$web/"
if ($LASTEXITCODE -ne 0) { throw "scp site вернул $LASTEXITCODE — выкладка не состоялась" }
Put $vj "version.json"
Put (Join-Path $root "site\.htaccess") ".htaccess"   # glob scp точечные файлы не берёт
if (-not $SiteOnly) { ssh drift "cd drift-game.ru/docs && { cp -f play.html play.prev.html; cp -f play.html.gz play.prev.html.gz; } 2>/dev/null; true" }   # прежняя игра — на откат
if (-not $SiteOnly) { Put $file "play.html" }
if (-not $SiteOnly) { ssh drift "cd drift-game.ru/docs && gzip -kf9 play.html" }   # mod_deflate нет, см. DEPLOY.md

# Проверка, а не надежда: спрашиваем у сервера, что там теперь лежит.
$kb  = [math]::Round((Get-Item $file).Length / 1KB)
$onServer = ssh drift "grep -o 'VER=\`"[0-9.]*\`"' drift-game.ru/docs/play.html | head -1"
# и байт в байт: 0.359.0 «совпадал по версии» и был другой склейкой
$md5Here = (Get-FileHash $file -Algorithm MD5).Hash.ToLower()
$md5There = (ssh drift "md5sum drift-game.ru/docs/play.html" | ForEach-Object { $_.Split(" ")[0] })
if (-not $SiteOnly -and $md5Here -ne $md5There) { throw "на сервере другой файл: $md5There, здесь $md5Here" }
"{0}  выложено {1} КБ · на сервере {2} · https://drift-game.ru" -f (Get-Date -Format "HH:mm:ss"), $kb, $onServer
if (-not $SiteOnly -and $onServer -notmatch [regex]::Escape($ver)) {
  Write-Warning "на сайте не та версия, что в src/01-core.js ($ver) — проверьте вручную"
}
