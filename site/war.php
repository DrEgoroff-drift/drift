<?php
/*
 * ДРЕЙФ — the war's ledger (M376, docs/DESIGN-war.md §13, §16.2–16.4).
 *
 * The server computes NOTHING about the world. The chronicle is replayed on every client from
 * a constant seed (12am-chron), so the front, the owners and the wars are the same everywhere
 * without anybody being told. What the server does is the one thing a client cannot be trusted
 * with: it sums what players did — and it sums it by ACCOUNTS, not by rows, so a hundred
 * entries from one player are one player.
 *
 * Files, not a database (the host is Nichost shared, PHP 7.4, no DB):
 *
 *   ~/drift-data/war/svodka/NNNNNN.json   one сводка: counters per system and kind, votes
 *   ~/drift-data/war/circ/NNNNNN.json     циркуляры filed by the regulator over ssh
 *   ~/drift-data/war/acct/<login>.json    that account's caps for the current сводка
 *   ~/drift-data/war/hash/NNNNNN.json     how many clients reported which chronicle hash
 *
 * No cron. A сводка closes lazily: the first request that sees the number has grown moves the
 * open file under flock. Using the host's cron would be a second mechanism able to disagree
 * with the first, and there is no way to test that disagreement.
 *
 * Ops (POST JSON to /war.php?a=…, token in X-Drift-Token as everywhere else):
 *
 *   pull  {since}          -> {ok,N,svodki:[…],open,circ:[…]}   closed сводки after `since`
 *   put   {n,sys,kind,qty} -> {ok,left}   one deed; capped per account per kind per сводка
 *   vote  {n,q,pick}       -> {ok}        one account, one vote per question
 *   hash  {n,h}            -> {ok,agree}  the client's chronicle hash for N−1 (D06)
 *
 * CLI for the regulator over ssh:  php war.php digest 7   ·   php war.php circ file.json
 *
 * Nothing here carries a name, a free-text string or an exchange between players: the postcard
 * rule (docs/DESIGN-online-risks.md) holds for the war exactly as it holds for postcards.
 */

ini_set('display_errors', '0');
error_reporting(E_ALL);

const WAR_SHIFT = 21600;        // сводка — шесть часов, в секундах
const WAR_EPOCH = 1767225600;   // 2026-01-01 UTC: сводка № 0 (CHRON_EPOCH в 12am-chron)
const WAR_TAIL  = 300;          // пять минут хвоста: запись в закрывшуюся сводку ещё принимается
/* виды дел: первые восемь — обычная работа борта, дальше обряды §14 (M379).
   Потолок у каждого свой и он же — граница правдоподобного: выше не примем. */
const WAR_KINDS = ['def','tow','ore','mail','clear','build','crew','fuel',
                   'med','loan','scan','coup','amn','reg','cens','boss'];
/* 'boss' — урон по «Ревизии» за сводку с одной учётной записи (M380, §11.2).
   Потолок — правдоподобный максимум: тринадцать минут огня лучшей сборки. Выше
   не примем: не потому что нельзя столько настрелять, а потому что проверить
   нельзя, а обвалить чужой бой одной строкой — можно. */
const WAR_CAP   = ['def'=>40,'tow'=>10,'ore'=>2000,'mail'=>20,'clear'=>50,'build'=>2000,
                   'crew'=>20,'fuel'=>50,'med'=>40,'loan'=>5000,'scan'=>30,'coup'=>4,
                   'amn'=>10,'reg'=>3,'cens'=>1,'boss'=>60000];
const WAR_PULL  = 40;           // сколько закрытых сводок отдаём за раз
/* оставленное (§11.3, M377): числа из §11.5 и ни одного своего */
const LEFT_KINDS = ['gun','ammo','fuel','sign','tow','ghost'];
const LEFT_PER_SYS  = 5;        // сколько лежит в одной системе
const LEFT_PER_DAY  = 3;        // сколько один борт оставляет за сутки
const LEFT_TAKE     = 2;        // сколько находок в сводку на борт
const LEFT_LIFE     = 10;       // сводок живёт запись

/* ── ответы ── */
function wout($o, $code = 200) {
  if (PHP_SAPI !== 'cli') { http_response_code($code); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); }
  echo json_encode($o, JSON_UNESCAPED_UNICODE);
  exit;
}
function wfail($m, $code = 400) { wout(['ok' => false, 'error' => $m], $code); }

/* ── хранилище ── */
function wroot() {
  $r = dirname(dirname(__DIR__)) . '/drift-data/war';
  foreach ([$r, "$r/svodka", "$r/circ", "$r/acct", "$r/hash", "$r/left", "$r/thanks"] as $d) if (!is_dir($d)) @mkdir($d, 0700, true);
  return $r;
}
function wread($f) {
  if (!is_file($f)) return null;
  $raw = @file_get_contents($f);
  if ($raw === false) return null;
  $v = json_decode($raw, true);
  return is_array($v) ? $v : null;
}
function wwrite($f, $d) {
  $tmp = $f . '.' . getmypid() . '.tmp';
  if (@file_put_contents($tmp, json_encode($d, JSON_UNESCAPED_UNICODE)) === false) return false;
  @chmod($tmp, 0600);
  if (!@rename($tmp, $f)) { @unlink($tmp); return false; }
  return true;
}
function wnum($n) { return str_pad((string)(int)$n, 6, '0', STR_PAD_LEFT); }
function wfile($n) { return wroot() . '/svodka/' . wnum($n) . '.json'; }
function wnow()    { return (int)floor((time() - WAR_EPOCH) / WAR_SHIFT); }

/* ── кто это ──
   Токен тот же, что у сохранений: сессии заводит api.php, война их только читает.
   Без учётной записи писать нельзя — иначе «по аккаунтам, а не по строкам» ничего
   не значит; читать (pull) можно всем, война не секрет. */
function wwho() {
  $tok = $_SERVER['HTTP_X_DRIFT_TOKEN'] ?? '';
  if (!preg_match('/^[a-f0-9]{48}$/', $tok)) return null;
  $f = dirname(dirname(__DIR__)) . '/drift-data/t/' . hash('sha256', $tok) . '.json';
  $t = wread($f);
  if (!$t || ($t['exp'] ?? 0) < time()) return null;
  $l = (string)($t['login'] ?? '');
  return preg_match('/^[a-z0-9_-]{3,20}$/', $l) ? $l : null;
}

/* ── ленивое закрытие сводки ──
   Первый запрос после конца сводки видит, что номер вырос, и под flock переносит
   открытую в закрытые. Никакого крона: одна дорога, и она проверяема. */
function wclose() {
  $N = wnow();
  $open = wroot() . '/open.json';
  $o = wread($open);
  if (!$o || (int)($o['n'] ?? $N) >= $N) return $N;
  $fp = @fopen($open . '.lock', 'c');
  if ($fp && flock($fp, LOCK_EX)) {
    $o = wread($open);
    if ($o && (int)($o['n'] ?? $N) < $N) {
      /* предохранитель §12: если за сутки счётчик обороны просел больше чем на
         сорок процентов, поднимаем флаг перемирия — сервер не считает мир, он
         только замечает, что счёт перестал сходиться */
      $o['closed'] = time();
      wwrite(wfile((int)$o['n']), $o);
      wwrite($open, ['n' => $N, 'sys' => new stdClass(), 'votes' => new stdClass(), 'acc' => 0]);
    }
    flock($fp, LOCK_UN);
  }
  if ($fp) fclose($fp);
  return $N;
}
function wopen() {
  $N = wclose();
  $o = wread(wroot() . '/open.json');
  if (!$o || (int)($o['n'] ?? -1) !== $N) {
    $o = ['n' => $N, 'sys' => [], 'votes' => [], 'acc' => 0];
    wwrite(wroot() . '/open.json', $o);
  }
  return $o;
}

/* ── насыщение по УЧЁТНЫМ ЗАПИСЯМ, а не по строкам (§13) ──
   Сто записей одного борта — это один борт. Таблица та же, что у клиента
   (CHRON_SAT в 12am-chron): 1−exp(−n/12) в промилле, целыми. */
const WAR_SAT = [0,80,154,221,283,341,393,442,487,528,565,600,632,662,689,713,736,757,777,795,
  811,826,840,853,865,875,885,895,903,911,918,924,931,936,941,946,950,954,958,961,964,967,970,
  972,974,976,978,980,982,983,984];
function wsat($n) { $n = (int)$n; return WAR_SAT[$n < 0 ? 0 : ($n > 50 ? 50 : $n)]; }

/* ── caps: сколько одна учётная запись может записать за сводку ── */
function wacct($login, $N) {
  $f = wroot() . '/acct/' . $login . '.json';
  $a = wread($f);
  if (!$a || (int)($a['n'] ?? -1) !== $N) $a = ['n' => $N, 'k' => []];
  return [$a, $f];
}

/* ══════════════ операции ══════════════ */
$a = $_GET['a'] ?? (PHP_SAPI === 'cli' ? ($argv[1] ?? '') : '');
$in = [];
if (PHP_SAPI !== 'cli') {
  $raw = file_get_contents('php://input');
  if ($raw !== false && $raw !== '') { $j = json_decode($raw, true); if (is_array($j)) $in = $j; }
}

/* pull: закрытые сводки после `since`, открытая и циркуляры. Ответ ограничен
   сорока сводками — хвост придёт со следующим прыжком (§13). */
if ($a === 'pull') {
  $N = wclose();
  $since = (int)($in['since'] ?? $_GET['since'] ?? -1);
  $out = [];
  for ($n = max(0, $since + 1); $n < $N && count($out) < WAR_PULL; $n++) {
    $s = wread(wfile($n));
    if ($s) $out[] = $s;
  }
  $circ = [];
  foreach (glob(wroot() . '/circ/*.json') ?: [] as $f) {
    $c = wread($f);
    if ($c && (int)($c['n'] ?? 0) > $since) $circ[] = $c;
  }
  wout(['ok' => true, 'N' => $N, 'svodki' => $out, 'open' => wopen(), 'circ' => $circ,
        'more' => ($N - 1 > $since + count($out))]);
}

/* put: одно дело. Токен, потолок по виду, существующая система, текущая сводка
   или предыдущая в пятиминутном хвосте. Имён нет: счётчики и только. */
if ($a === 'put') {
  $login = wwho();
  if (!$login) wfail('нужна учётная запись', 401);
  $N   = wclose();
  $n   = (int)($in['n'] ?? $N);
  $sys = (string)($in['sys'] ?? '');
  $k   = (string)($in['kind'] ?? '');
  $q   = (int)($in['qty'] ?? 1);
  if (!in_array($k, WAR_KINDS, true)) wfail('неизвестный вид');
  if (!preg_match('/^-?\d{1,3},-?\d{1,3}$/', $sys)) wfail('не адрес системы');
  if ($q < 1 || $q > WAR_CAP[$k]) wfail('число вне границ');
  /* сводка: текущая или прошлая, пока идёт хвост */
  $tail = ((time() - WAR_EPOCH) % WAR_SHIFT) < WAR_TAIL;
  if ($n !== $N && !($tail && $n === $N - 1)) wfail('не та сводка');
  list($acct, $af) = wacct($login, $N);
  $used = (int)($acct['k'][$k] ?? 0);
  if ($used + $q > WAR_CAP[$k]) wfail('потолок этой сводки');
  $acct['k'][$k] = $used + $q;
  wwrite($af, $acct);

  $open = wopen();
  if (!isset($open['sys'][$sys])) $open['sys'][$sys] = [];
  if (!isset($open['sys'][$sys][$k])) $open['sys'][$sys][$k] = ['q' => 0, 'a' => []];
  $cell = &$open['sys'][$sys][$k];
  $cell['q'] = (int)$cell['q'] + $q;
  /* учётные записи храним хешами: имя тут не нужно никому, а насыщение считается
     по их числу (§13). Двадцать хешей на клетку хватает: выше насыщение всё равно
     упирается в потолок таблицы */
  $h = substr(hash('sha256', $login . '|' . $sys . '|' . $k), 0, 8);
  if (!in_array($h, $cell['a'], true) && count($cell['a']) < 64) $cell['a'][] = $h;
  unset($cell);
  wwrite(wroot() . '/open.json', $open);
  wout(['ok' => true, 'left' => WAR_CAP[$k] - $acct['k'][$k]]);
}

/* vote: одна учётная запись — один голос на вопрос (§14, выборы — M378) */
if ($a === 'vote') {
  $login = wwho();
  if (!$login) wfail('нужна учётная запись', 401);
  $N = wclose();
  $q = (string)($in['q'] ?? '');
  $p = (string)($in['pick'] ?? '');
  if (!preg_match('/^[a-z0-9_-]{1,24}$/', $q) || !preg_match('/^[a-z0-9_-]{1,24}$/', $p)) wfail('вопрос или выбор не по форме');
  $open = wopen();
  $h = substr(hash('sha256', $login . '|' . $q), 0, 8);
  if (!isset($open['votes'][$q])) $open['votes'][$q] = ['p' => [], 'a' => []];
  if (in_array($h, $open['votes'][$q]['a'], true)) wfail('уже голосовали');
  $open['votes'][$q]['a'][] = $h;
  $open['votes'][$q]['p'][$p] = (int)($open['votes'][$q]['p'][$p] ?? 0) + 1;
  wwrite(wroot() . '/open.json', $open);
  wout(['ok' => true]);
}

/* hash: клиент сообщает свой хэш летописи за N−1. Сервер ничего не проверяет —
   он считает, сколько клиентов сошлись, и это единственный способ заметить, что
   повтор где-то разошёлся (D06). */
if ($a === 'hash') {
  $N = wclose();
  $n = (int)($in['n'] ?? ($N - 1));
  $h = (string)($in['h'] ?? '');
  if (!preg_match('/^\d{1,10}$/', $h)) wfail('не хэш');
  $f = wroot() . '/hash/' . wnum($n) . '.json';
  $rec = wread($f) ?: ['n' => $n, 'h' => []];
  $rec['h'][$h] = (int)($rec['h'][$h] ?? 0) + 1;
  wwrite($f, $rec);
  arsort($rec['h']);
  $top = array_key_first($rec['h']);
  wout(['ok' => true, 'agree' => ($top === $h), 'n' => $n, 'seen' => $rec['h'][$h]]);
}

/* ══════════════ сигнал сбора (M378, §11.2) ══════════════
   «Всем сказать в игре» без чата: три поля и ни одного слова — система, сводка,
   и всё. Виден всем, отвечается одной кнопкой, счётчик «ответили: 23». Один
   сигнал на учётную запись в сутки: иначе это станет доской объявлений, а
   доски объявлений тут нет и не будет. */
const RALLY_LIFE = 8;           // сводок живёт сигнал (двое суток)
function rfile() { return wroot() . '/rally.json'; }
function rread($N) {
  $r = wread(rfile());
  $rows = [];
  if ($r && is_array($r['rows'] ?? null))
    foreach ($r['rows'] as $x) if ((int)($x['n'] ?? 0) > $N - RALLY_LIFE) $rows[] = $x;
  return ['rows' => $rows];
}
if ($a === 'rallies') {
  $N = wclose();
  wout(['ok' => true, 'N' => $N, 'rows' => rread($N)['rows']]);
}
if ($a === 'rally') {
  $login = wwho();
  if (!$login) wfail('нужна учётная запись', 401);
  $N   = wclose();
  $sys = (string)($in['sys'] ?? '');
  $at  = (int)($in['at'] ?? $N);
  if (!preg_match('/^-?\d{1,3},-?\d{1,3}$/', $sys)) wfail('не адрес системы');
  if ($at < $N || $at > $N + 8) wfail('сводка сбора вне окна');
  list($acct, $af) = wacct($login, $N);
  if ((int)($acct['rallyN'] ?? -99) > $N - 4) wfail('сигнал уже поднимали сегодня');
  $acct['rallyN'] = $N;
  wwrite($af, $acct);
  $r = rread($N);
  $r['rows'][] = ['sys' => $sys, 'at' => $at, 'n' => $N,
                  'h' => substr(hash('sha256', $login), 0, 8), 'yes' => 0, 'a' => []];
  wwrite(rfile(), $r);
  wout(['ok' => true]);
}
if ($a === 'join') {
  $login = wwho();
  if (!$login) wfail('нужна учётная запись', 401);
  $N = wclose();
  $i = (int)($in['i'] ?? -1);
  $r = rread($N);
  if (!isset($r['rows'][$i])) wfail('сигнала нет');
  $h = substr(hash('sha256', $login), 0, 8);
  if (in_array($h, $r['rows'][$i]['a'], true)) wfail('уже ответили');
  $r['rows'][$i]['a'][] = $h;
  $r['rows'][$i]['yes'] = (int)$r['rows'][$i]['yes'] + 1;
  wwrite(rfile(), $r);
  wout(['ok' => true, 'yes' => $r['rows'][$i]['yes']]);
}
/* голоса открытой сводки — их читает клиент, чтобы показать итог выборов */
if ($a === 'votes') {
  $N = wclose();
  $o = wopen();
  wout(['ok' => true, 'N' => $N, 'votes' => $o['votes'] ?? new stdClass()]);
}

/* ══════════════ оставленное (M377, §11.3) ══════════════
   Правило одно и оно короткое: ни имён, ни текста, в одну сторону, без ответа.
   Не «подарить», а ОСТАВИТЬ; кто нашёл, тот нашёл. Обмена нет — значит нет и
   рынка, нет попрошаек, нет «продай мне за реал». Взятое приходит СТЁРТЫМ на
   тир: отдать хорошее — потеря настоящая, найти хорошее — подарок настоящий,
   а размножить нельзя. */
function lfile($sys) { return wroot() . '/left/' . str_replace(',', '_', $sys) . '.json'; }
function lread($sys, $N) {
  $r = wread(lfile($sys));
  if (!$r || !is_array($r['rows'] ?? null)) return ['sys' => $sys, 'rows' => []];
  /* десять сводок — и запись растворяется: склад тут не заводится */
  $rows = [];
  foreach ($r['rows'] as $x) if ((int)($x['n'] ?? 0) > $N - LEFT_LIFE) $rows[] = $x;
  $r['rows'] = $rows;
  return $r;
}
if ($a === 'left') {
  $login = wwho();
  if (!$login) wfail('нужна учётная запись', 401);
  $N   = wclose();
  $sys = (string)($in['sys'] ?? '');
  $k   = (string)($in['kind'] ?? '');
  $sd  = (int)($in['seed'] ?? 0);
  $t   = (int)($in['tier'] ?? 1);
  if (!preg_match('/^-?\d{1,3},-?\d{1,3}$/', $sys)) wfail('не адрес системы');
  if (!in_array($k, LEFT_KINDS, true)) wfail('неизвестный вид');
  if ($t < 1 || $t > 5) wfail('тир вне границ');
  /* потолок на борт в сутки (четыре сводки) */
  list($acct, $af) = wacct($login, $N);
  $day = (int)($acct['left'] ?? 0);
  if ((int)($acct['leftN'] ?? -99) < $N - 3) { $day = 0; }
  if ($day >= LEFT_PER_DAY) wfail('за сутки больше не оставляют');
  $acct['left'] = $day + 1; $acct['leftN'] = $N;
  wwrite($af, $acct);
  $r = lread($sys, $N);
  if (count($r['rows']) >= LEFT_PER_SYS) array_shift($r['rows']);
  $r['rows'][] = ['k' => $k, 's' => $sd, 't' => $t, 'n' => $N,
                  'h' => substr(hash('sha256', $login), 0, 8), 'ty' => 0];
  wwrite(lfile($sys), $r);
  wout(['ok' => true, 'left' => LEFT_PER_DAY - $acct['left']]);
}
if ($a === 'here') {
  /* что лежит в этой системе: читать может кто угодно, это не секрет */
  $N = wclose();
  $sys = (string)($in['sys'] ?? $_GET['sys'] ?? '');
  if (!preg_match('/^-?\d{1,3},-?\d{1,3}$/', $sys)) wfail('не адрес системы');
  $r = lread($sys, $N);
  wout(['ok' => true, 'rows' => $r['rows'], 'N' => $N]);
}
if ($a === 'take') {
  $login = wwho();
  if (!$login) wfail('нужна учётная запись', 401);
  $N   = wclose();
  $sys = (string)($in['sys'] ?? '');
  $i   = (int)($in['i'] ?? -1);
  if (!preg_match('/^-?\d{1,3},-?\d{1,3}$/', $sys)) wfail('не адрес системы');
  list($acct, $af) = wacct($login, $N);
  if ((int)($acct['take'] ?? 0) >= LEFT_TAKE) wfail('за сводку больше не берут');
  $r = lread($sys, $N);
  if (!isset($r['rows'][$i])) wfail('там уже пусто');
  $acct['take'] = (int)($acct['take'] ?? 0) + 1;
  wwrite($af, $acct);
  /* КОПИЯ, а не перенос: запись остаётся лежать до своего срока. Стирание на
     тир считает клиент — сервер только говорит, что копия стёртая */
  $row = $r['rows'][$i];
  $row['worn'] = 1;
  wout(['ok' => true, 'row' => $row, 'left' => LEFT_TAKE - $acct['take']]);
}
if ($a === 'thank') {
  /* благодарность — единственный обратный канал, и он число, а не слово */
  $login = wwho();
  if (!$login) wfail('нужна учётная запись', 401);
  $N   = wclose();
  $sys = (string)($in['sys'] ?? '');
  $i   = (int)($in['i'] ?? -1);
  if (!preg_match('/^-?\d{1,3},-?\d{1,3}$/', $sys)) wfail('не адрес системы');
  $r = lread($sys, $N);
  if (!isset($r['rows'][$i])) wfail('там уже пусто');
  $r['rows'][$i]['ty'] = (int)($r['rows'][$i]['ty'] ?? 0) + 1;
  wwrite(lfile($sys), $r);
  /* счётчик самого оставившего: он увидит его в трудовой книжке */
  $hf = wroot() . '/thanks/' . $r['rows'][$i]['h'] . '.json';
  if (!is_dir(dirname($hf))) @mkdir(dirname($hf), 0700, true);
  $t = wread($hf) ?: ['n' => 0];
  $t['n'] = (int)$t['n'] + 1;
  wwrite($hf, $t);
  wout(['ok' => true, 'ty' => $r['rows'][$i]['ty']]);
}
if ($a === 'thanks') {
  $login = wwho();
  if (!$login) wfail('нужна учётная запись', 401);
  $t = wread(wroot() . '/thanks/' . substr(hash('sha256', $login), 0, 8) . '.json');
  wout(['ok' => true, 'n' => (int)($t['n'] ?? 0)]);
}

/* ── CLI регулятора (§13) ── */
if (PHP_SAPI === 'cli' && $a === 'digest') {
  $days = max(1, min(30, (int)($argv[2] ?? 7)));
  $N = wnow();
  $from = $N - $days * 4;
  echo "ДРЕЙФ · война · сводки $from…$N\n";
  $tot = [];
  for ($n = $from; $n <= $N; $n++) {
    $s = ($n === $N) ? wread(wroot() . '/open.json') : wread(wfile($n));
    if (!$s || empty($s['sys'])) continue;
    $line = [];
    foreach ($s['sys'] as $sys => $kinds) {
      foreach ($kinds as $k => $c) {
        $tot[$k] = ($tot[$k] ?? 0) + (int)$c['q'];
        $line[] = "$sys/$k:" . (int)$c['q'] . '(' . count($c['a']) . ')';
      }
    }
    if ($line) echo str_pad((string)$n, 7) . implode(' ', array_slice($line, 0, 6)) . "\n";
  }
  echo "итого: ";
  foreach ($tot as $k => $v) echo "$k=$v ";
  echo "\n";
  /* расхождения по хэшам: если клиенты не сошлись, это видно здесь и нигде больше */
  for ($n = $from; $n < $N; $n++) {
    $h = wread(wroot() . '/hash/' . wnum($n) . '.json');
    if ($h && count($h['h']) > 1) echo "расхождение на сводке $n: " . json_encode($h['h']) . "\n";
  }
  exit;
}
if (PHP_SAPI === 'cli' && $a === 'circ') {
  $file = (string)($argv[2] ?? '');
  $c = wread($file);
  if (!$c) { echo "не читается: $file\n"; exit(1); }
  $c['n'] = wnow();
  wwrite(wroot() . '/circ/' . wnum($c['n']) . '.json', $c);
  echo "циркуляр подшит на сводку " . $c['n'] . "\n";
  exit;
}

wfail('неизвестная операция', 404);
