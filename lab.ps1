# Лаборатория на сервере — запуск с ноутбука (docs/LAB.md).
#
#   powershell -ExecutionPolicy Bypass -File lab.ps1                 # сборка, заливка, сессия на 240 мин
#   powershell -ExecutionPolicy Bypass -File lab.ps1 -Budget 15 -Quick   # короткая: node + лёгкие шарды
#   powershell -ExecutionPolicy Bypass -File lab.ps1 -Upload         # только залить свежую сборку и страницу
#   powershell -ExecutionPolicy Bypass -File lab.ps1 -Publish        # только пересобрать страницу из данных
#
# Сессия живёт, пока открыт ssh: закрыть окно — значит остановить лабораторию.
# Ночью то же самое делает .github/workflows/lab.yml, держа сессию до шести часов.
param([int]$Budget = 240, [switch]$Quick, [switch]$Upload, [switch]$Publish, [switch]$NoBuild)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($Publish) { ssh drift "python3 drift-lab/lab.py publish"; exit $LASTEXITCODE }
if (-not $NoBuild) { & (Join-Path $root "build.ps1") | Out-Null }
ssh drift "mkdir -p drift-lab/build drift-data/lab"
scp (Join-Path $root "lab\lab.sh") (Join-Path $root "lab\lab.py") "drift:drift-lab/"
scp (Join-Path $root "tests.html") (Join-Path $root "test-node.js") (Join-Path $root "site\lab.html") "drift:drift-lab/build/"
if ($LASTEXITCODE -ne 0) { throw "scp вернул $LASTEXITCODE" }
ssh drift "python3 drift-lab/lab.py publish"
if ($Upload) { exit 0 }
$q = if ($Quick) { "--quick" } else { "" }
ssh drift "bash drift-lab/lab.sh --budget $Budget $q"
