# Что сейчас лежит на сайте.
#
# Выкладка идёт сама на push (.github/workflows/deploy.yml), и именно поэтому
# её поломку легко не заметить: локально всё собирается и все тесты зелёные, а
# на drift-game.ru остаётся версия недельной давности. Так и вышло — сборка на
# ubuntu-раннере падала шесть версий подряд, и никто не смотрел.
#
#   powershell -ExecutionPolicy Bypass -File docs\live.ps1
#
# Печатает одну строку: что в исходниках, что на сайте, сходится или нет.
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here

$src = [IO.File]::ReadAllText((Join-Path $root "src\01-core.js"), [Text.Encoding]::UTF8)
$want = if ($src -match 'const VER="([^"]+)"') { $matches[1] } else { "?" }

$got = "не отвечает"
try {
  $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 40 `
       -Headers @{ "Cache-Control" = "no-cache" } `
       -Uri ("https://drift-game.ru/play.html?v=" + (Get-Random))
  if ($r.Content -match 'const VER="([^"]+)"') { $got = $matches[1] }
  else { $got = "версия не найдена" }
} catch { $got = "ошибка: " + $_.Exception.Message }

if ($want -eq $got) { "СХОДИТСЯ · в исходниках $want, на сайте $got" }
else { "РАЗОШЛИСЬ · в исходниках $want, на сайте $got  → смотри прогон deploy на GitHub" }
