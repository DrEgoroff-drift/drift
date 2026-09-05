# Локальный стенд «Дрейфа»: раздаёт репозиторий на :8777 и принимает кадры.
#
# Зачем сервер вообще: file:// в браузере ломает часть игры (fetch, canvas
# с чужих картинок), поэтому стенды и тесты открываются только по http.
#
#   powershell -ExecutionPolicy Bypass -File docs\stand.ps1
#   → http://localhost:8777/drift.html
#     http://localhost:8777/tests.html
#     http://localhost:8777/site/index.html
#
# Приём кадров нужен потому, что снять экран получается не всегда: страница
# умеет отдать содержимое канвы сама, а сервер кладёт её на диск.
#
#   POST /shot?n=surface        тело — dataURL или голый base64
#   → docs/shots/surface.webp   (расширение из типа dataURL)
#
# Останавливается Ctrl+C или POST /stop.

param([int]$Port = 8777)

$ErrorActionPreference = "Stop"
$root  = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$shots = Join-Path $root "docs\shots"
if (-not (Test-Path $shots)) { New-Item -ItemType Directory $shots | Out-Null }

$mime = @{
  ".html"="text/html; charset=utf-8"; ".js"="text/javascript; charset=utf-8";
  ".css"="text/css; charset=utf-8";   ".json"="application/json; charset=utf-8";
  ".png"="image/png"; ".webp"="image/webp"; ".jpg"="image/jpeg"; ".svg"="image/svg+xml";
  ".ico"="image/x-icon"; ".php"="text/plain; charset=utf-8"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "стенд на http://localhost:$Port/  (Ctrl+C чтобы остановить)"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  $res.Headers.Add("Access-Control-Allow-Origin", "*")
  $res.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
  $res.Headers.Add("Cache-Control", "no-store")

  try {
    if ($req.HttpMethod -eq "OPTIONS") { $res.StatusCode = 204; $res.Close(); continue }

    if ($req.Url.AbsolutePath -eq "/stop") {
      $res.StatusCode = 200; $res.Close(); $listener.Stop(); break
    }

    # ── приём кадра ──
    # старые стенды (docs/mk*.ps1) шлют POST /имя.png — принимаем и их
    $legacy = $req.HttpMethod -eq "POST" -and $req.Url.AbsolutePath -match "^/([a-zA-Z0-9_-]+)\.(png|webp|jpg)$"
    if (($req.Url.AbsolutePath -eq "/shot" -or $legacy) -and $req.HttpMethod -eq "POST") {
      $name = if ($legacy) { $matches[1] } else { ($req.QueryString["n"] -replace '[^a-zA-Z0-9_-]', '') }
      if (-not $name) { $name = "shot" }
      $reader = New-Object System.IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)
      $body = $reader.ReadToEnd(); $reader.Close()

      $ext = ".png"
      if ($body -match '^data:image/([a-z]+);base64,') {
        $ext = "." + $matches[1]
        $body = $body -replace '^data:image/[a-z]+;base64,', ''
      }
      if ($ext -eq ".jpeg") { $ext = ".jpg" }

      $bytes = [Convert]::FromBase64String(($body -replace '\s', ''))
      $out = Join-Path $shots ($name + $ext)
      [IO.File]::WriteAllBytes($out, $bytes)

      $msg = [Text.Encoding]::UTF8.GetBytes('{"ok":true,"bytes":' + $bytes.Length + '}')
      $res.ContentType = "application/json"
      $res.OutputStream.Write($msg, 0, $msg.Length)
      $res.Close()
      Write-Output ("  кадр {0}{1} · {2} КБ" -f $name, $ext, [math]::Round($bytes.Length/1KB))
      continue
    }

    # ── статика ──
    $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($path -eq "/") { $path = "/drift.html" }
    $file = Join-Path $root ($path.TrimStart("/") -replace "/", "\")
    if (-not $file.StartsWith($root)) { $res.StatusCode = 403; $res.Close(); continue }

    # Страницы сайта ссылаются на свои файлы от корня домена (/site.css, /shots/…),
    # а здесь корень — весь репозиторий. Поэтому не нашли наверху — ищем в site/.
    if (-not (Test-Path $file -PathType Leaf)) {
      $alt = Join-Path (Join-Path $root "site") ($path.TrimStart("/") -replace "/", "\")
      if (Test-Path $alt -PathType Leaf) { $file = $alt }
    }

    if (Test-Path $file -PathType Leaf) {
      $bytes = [IO.File]::ReadAllBytes($file)
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $res.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" })
      $res.ContentLength64 = $bytes.Length
      # на HEAD тело писать нельзя — иначе .NET отдаёт 500 вместо заголовков
      if ($req.HttpMethod -ne "HEAD") { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
    } else {
      $res.StatusCode = 404
      $b = [Text.Encoding]::UTF8.GetBytes("не найдено: $path")
      $res.OutputStream.Write($b, 0, $b.Length)
    }
    $res.Close()
  } catch {
    try { $res.StatusCode = 500; $res.Close() } catch {}
    Write-Output ("  ошибка: " + $_.Exception.Message)
  }
}
$listener.Close()
Write-Output "стенд остановлен"
