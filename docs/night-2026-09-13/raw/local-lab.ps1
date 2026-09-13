# Локальная лаборатория (без ssh, без удалённого хоста — тот "остановлен" по
# памяти drift-lab, тариф 50% CPU). Тот же дух, что docs/LAB.md: полный прогон,
# телефон, высокое окно, фуззер на свежих зёрнах — по кругу, budget минут,
# на этой машине через test.ps1. Дедуп ошибок — как lab.py: счётчик по тексту
# без чисел, а не бесконечный список.
param([int]$BudgetMin = 360, [string]$OutDir = ".\out")
$ErrorActionPreference = "Continue"
$root = "C:\Claude\files"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$reportPath = Join-Path $OutDir "local-lab.txt"
$logDir = Join-Path $OutDir "local-lab-runs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$known = @{}   # key(text-без-чисел) -> @{count; first; last; text}
$runs = 0
$t0 = Get-Date

function Normalize($s) { return [regex]::Replace($s, '-?\d+(\.\d+)?', '#') }

function Note-Line($line) {
  $key = Normalize($line)
  if (-not $known.ContainsKey($key)) { $known[$key] = @{count = 0; first = (Get-Date); text = $line} }
  $known[$key].count++
  $known[$key].last = Get-Date
}

function Write-Report() {
  $elapsed = [Math]::Round(((Get-Date) - $t0).TotalMinutes, 1)
  $lines = @()
  $lines += "Локальная лаборатория · бюджет $BudgetMin мин · прошло $elapsed мин · прогонов $runs"
  $lines += ""
  foreach ($k in ($known.Keys | Sort-Object { $known[$_].last } -Descending)) {
    $r = $known[$k]
    $lines += ("×{0} · впервые {1} · последний {2}" -f $r.count, $r.first.ToString("o"), $r.last.ToString("o"))
    $lines += "  $($r.text)"
    $lines += ""
  }
  [System.IO.File]::WriteAllText($reportPath, ($lines -join "`n"), (New-Object System.Text.UTF8Encoding $true))
}

# по кругу: полный прогон (десктоп) → телефон → высокое окно → фуззер на свежем зерне
# -Jobs 2 (не авто min(6,cores/2)=6): рядом всю ночь крутятся 6 соук-ботов
# (тоже CPU-жадные Node-процессы), и на полном параллелизме первый же прогон
# завис — часть 2/6 не ответила за 900 с (docs/GOTCHAS.md уже знает похожее:
# сеть ярусов дерётся за один Chrome). Меньше шардов — медленнее, но честно.
$variants = @(
  @{name = "full"; args = @("-Full", "-Jobs", "2")},
  @{name = "mobile"; args = @("-Full", "-Mobile", "-Jobs", "2")},
  @{name = "tall"; args = @("-Full", "-Size", "1440,1440", "-Jobs", "2")},
  @{name = "fuzz"; args = @("-Fuzz", "6000")}
)
$vi = 0
while (((Get-Date) - $t0).TotalMinutes -lt $BudgetMin) {
  $v = $variants[$vi % $variants.Count]; $vi++
  $seed = Get-Random -Minimum 1 -Maximum 999999
  $args2 = @("-ExecutionPolicy", "Bypass", "-File", (Join-Path $root "test.ps1"), "-NoBuild") + $v.args
  if ($v.name -ne "fuzz") { $args2 += @("-Shuffle", "$seed") }
  $stamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
  $logFile = Join-Path $logDir "$stamp-$($v.name).txt"
  try {
    $out = & powershell @args2 2>&1 | Out-String
  } catch {
    $out = "ЗАПУСК УПАЛ: $_"
  }
  [System.IO.File]::WriteAllText($logFile, $out, (New-Object System.Text.UTF8Encoding $false))
  $runs++
  foreach ($line in ($out -split "`r?`n")) {
    if ($line -match "^\s*[✗?]\s") { Note-Line($line.Trim()) }
    elseif ($line -match "не кончилась за.*ВИСИТ") { Note-Line($line.Trim()) }
  }
  Write-Report
}
Write-Report
"локальная лаборатория закончена: $runs прогонов" | Out-File -FilePath (Join-Path $OutDir "local-lab-done.txt") -Encoding utf8
