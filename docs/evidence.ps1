# Улики с живого сайта: дайджест crash.log за 14 дней (site/log.php считает его сам,
# cron на хосте нет). Одна команда вместо ssh с tail:
#   powershell -ExecutionPolicy Bypass -File docs\evidence.ps1          # дайджест
#   powershell -ExecutionPolicy Bypass -File docs\evidence.ps1 -Raw 40  # последние 40 сырых строк
param([int]$Raw = 0)
if ($Raw -gt 0) { ssh drift "tail -n $Raw ~/drift-data/crash.log"; exit }
$j = ssh drift "cat ~/drift-data/digest.json 2>/dev/null" | Out-String
if (-not $j.Trim()) { "дайджеста ещё нет: никто не писал в log.php после выкладки"; exit }
$d = $j | ConvertFrom-Json
"дайджест $($d.made) · строк за $($d.days) дн: $($d.lines)"
"— fps с пульса (версия режим устройство: замеров, средний, худший) —"
foreach ($p in $d.fps.PSObject.Properties) { "  {0,-34} n={1,-4} avg={2,-4} min={3}" -f $p.Name, $p.Value.n, $p.Value.avg, $p.Value.min }
"— чаще всего (раз, адресов, когда, режим, устройство: версия | вид | текст) —"
foreach ($t in $d.top) { "  {0,4}x {1,2}ip {2} [{3} {4}] {5}" -f $t.n, $t.ips, $t.last.Substring(5,11), $t.mode, $t.dev, $t.what }
