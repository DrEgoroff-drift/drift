# Публикация «Дрейфа» на drift-game.ru.
#
# Игра — один самодостаточный файл, поэтому вся выкладка это сборка плюс одна
# копия в корень сайта. Ключ и адрес живут в ~/.ssh/config под именем `drift`,
# пароль не нужен и здесь не хранится.
#
#   powershell -ExecutionPolicy Bypass -File deploy.ps1
#   powershell -ExecutionPolicy Bypass -File deploy.ps1 -SkipBuild
#
# Откат на заглушку хостера: ssh drift "cp ~/drift-game.ru/docs/_hoster-stub.html ~/drift-game.ru/docs/index.html"

param([switch]$SkipBuild)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$file = Join-Path $root "drift.html"
$dest = "drift:drift-game.ru/docs/index.html"

if (-not $SkipBuild) {
  & powershell -ExecutionPolicy Bypass -File (Join-Path $root "build.ps1")
}
if (-not (Test-Path $file)) { throw "нет drift.html — сборка не прошла" }

# версия берётся из самой сборки: то, что уедет на сайт, и есть источник правды
$ver = (Select-String -Path (Join-Path $root "src\01-core.js") -Pattern 'VER="([0-9.]+)"').Matches[0].Groups[1].Value
$kb  = [math]::Round((Get-Item $file).Length / 1KB)

scp $file $dest
if ($LASTEXITCODE -ne 0) { throw "scp вернул $LASTEXITCODE — выкладка не состоялась" }

# проверка, а не надежда: спрашиваем у сервера, что там теперь лежит
$onServer = ssh drift "grep -o 'VER=\`"[0-9.]*\`"' drift-game.ru/docs/index.html | head -1"
"{0}  выложено {1} КБ · на сервере {2} · https://drift-game.ru" -f (Get-Date -Format "HH:mm:ss"), $kb, $onServer
if ($onServer -notmatch [regex]::Escape($ver)) {
  Write-Warning "на сайте не та версия, что в src/01-core.js ($ver) — проверьте вручную"
}
