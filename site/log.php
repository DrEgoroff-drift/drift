<?php
/* ── журнал сбоев: игра шлёт, сервер складывает ──
   Автор, 2026-09-05: «просто пиши на сервер лог, все ошибки, всё что можно —
   потом разбирать будем». Зависание автора так и не нашло причины (PLAN, Systems):
   строка «СБОЙ · …» встаёт на экране, но экран закрывают, и улики нет. Здесь
   каждая такая строка — и каждый стоп кадра дольше двух секунд — ложится в
   ~/drift-data/crash.log, по одной JSON-строке, и лежит, пока не разберут.

   Отдельный файл, а не действие в api.php: тот держит живые учётные записи и
   не трогается (docs/DEPLOY.md). Учётной записи не нужно; наружу от человека
   уходит только текст ошибки, стек нашего же кода, режим, версия и браузер.
   Никакого текста, набранного игроком. Читать: ssh drift 'tail ~/drift-data/crash.log'. */
header('Content-Type: application/json; charset=utf-8');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); echo '{"ok":false}'; exit; }

$raw = file_get_contents('php://input');
if (strlen($raw) > 8192) { http_response_code(413); echo '{"ok":false}'; exit; }
$b = json_decode($raw, true);
if (!is_array($b)) { http_response_code(400); echo '{"ok":false}'; exit; }

$root = dirname(dirname(__DIR__)) . '/drift-data';
if (!is_dir($root)) @mkdir($root, 0700, true);
$rate = "$root/rate"; if (!is_dir($rate)) @mkdir($rate, 0700, true);

/* не больше трёхсот строк с одного адреса в сутки: одна игра в вечном сбое
   шлёт раз в минуту, этого хватает; поток из цикла — нет */
$ip  = $_SERVER['REMOTE_ADDR'] ?? '0';
$rf  = "$rate/log_" . md5($ip) . '.json';
$day = gmdate('Y-m-d');
$r   = @json_decode(@file_get_contents($rf), true); if (!is_array($r) || ($r['day'] ?? '') !== $day) $r = ['day' => $day, 'n' => 0];
if (++$r['n'] > 300) { http_response_code(429); echo '{"ok":false}'; exit; }
@file_put_contents($rf, json_encode($r));

$cut = function ($k, $n) use ($b) { $v = $b[$k] ?? ''; return is_scalar($v) ? mb_substr((string)$v, 0, $n) : ''; };
$row = [
  't'    => gmdate('Y-m-d H:i:s'),
  'ip'   => substr(md5($ip), 0, 8),
  'ver'  => $cut('ver', 16),
  'kind' => $cut('kind', 16),     // crash | stall | rejection | outside
  'msg'  => $cut('msg', 600),
  'at'   => $cut('at', 800),      // стек, только наши кадры
  'mode' => $cut('mode', 16),
  'n'    => (int)($b['n'] ?? 0),  // сколько раз повторилось до отправки
  'up'   => (int)($b['up'] ?? 0), // секунд с открытия страницы
  'gap'  => (int)($b['gap'] ?? 0),// для stall: миллисекунд без кадра
  'win'  => $cut('win', 24),
  'ua'   => $cut('ua', 200),
  'log'  => $cut('log', 800),     // последние строки судового журнала
  'fps'  => (int)($b['fps'] ?? 0), // для kind=beat
];

/* файл не растёт без края: пять мегабайт — и прежний уходит в crash.log.1 */
$f = "$root/crash.log";
if (is_file($f) && filesize($f) > 5 * 1024 * 1024) @rename($f, "$f.1");
@file_put_contents($f, json_encode($row, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
echo '{"ok":true}';

/* ── дайджест без cron (его на хосте нет): раз в час тот, кто пишет, пересчитывает
   ~/drift-data/digest.json — за 14 дней по версиям и видам: сколько раз, с
   какого числа адресов; средний и худший fps по режимам с пульса; десять
   свежих не-пульсовых строк. Строки старше 14 дней выбрасываются из crash.log
   тут же, так что файл не растёт дальше двух недель (и 5 МБ, см. выше).
   Читать: docs/evidence.ps1. */
$dg = "$root/digest.json";
if (!is_file($dg) || time() - filemtime($dg) > 3600) {
  @touch($dg);
  $keep = []; $agg = []; $fps = []; $fresh = []; $cut14 = time() - 14 * 86400; $total = 0;
  foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
    $total++;
    $r = json_decode($line, true); if (!is_array($r)) continue;
    if (strtotime($r['t'] ?? '') < $cut14) continue;
    $keep[] = $line;
    $phone = preg_match('/Mobile|Android|iPhone/', $r['ua'] ?? '') ? 'phone' : 'desk';
    if (($r['kind'] ?? '') === 'beat') {
      $k = ($r['ver'] ?? '?') . ' ' . ($r['mode'] ?? '?') . ' ' . $phone;
      $fps[$k] = $fps[$k] ?? ['n' => 0, 'sum' => 0, 'min' => 999];
      $fps[$k]['n']++; $fps[$k]['sum'] += (int)$r['fps']; $fps[$k]['min'] = min($fps[$k]['min'], (int)$r['fps']);
      continue;
    }
    $k = ($r['ver'] ?? '?') . ' | ' . ($r['kind'] ?? '?') . ' | ' . mb_substr($r['msg'] ?? '', 0, 90);
    $agg[$k] = $agg[$k] ?? ['n' => 0, 'ips' => [], 'last' => '', 'mode' => $r['mode'] ?? '', 'dev' => $phone];
    $agg[$k]['n'] += max(1, (int)($r['n'] ?? 1)); $agg[$k]['ips'][$r['ip'] ?? '?'] = 1; $agg[$k]['last'] = $r['t'] ?? '';
    $fresh[] = $line;
  }
  uasort($agg, function ($a, $b) { return $b['n'] - $a['n']; });
  $out = ['made' => gmdate('Y-m-d H:i:s'), 'days' => 14, 'lines' => count($keep), 'top' => [], 'fps' => new stdClass(), 'fresh' => array_slice($fresh, -10)];
  foreach (array_slice($agg, 0, 40, true) as $k => $v) $out['top'][] = ['what' => $k, 'n' => $v['n'], 'ips' => count($v['ips']), 'last' => $v['last'], 'mode' => $v['mode'], 'dev' => $v['dev']];
  foreach ($fps as $k => $v) $out['fps']->$k = ['n' => $v['n'], 'avg' => round($v['sum'] / max(1, $v['n'])), 'min' => $v['min']];
  @file_put_contents($dg, json_encode($out, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
  if (count($keep) < $total) @file_put_contents($f, implode(PHP_EOL, $keep) . PHP_EOL, LOCK_EX);
}
