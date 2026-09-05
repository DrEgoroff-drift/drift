<?php
/*
 * ДРЕЙФ — accounts and cloud saves.
 *
 * Written in PHP on purpose. The host (Nichost shared) runs openresty in front of Apache and
 * offers no Node application mode: `.htaccess` with Passenger directives answers 500 and
 * cgi_module is switched off in the panel. PHP 7.4 is there, always on, with password_hash()
 * built in — so the whole backend is this one file, and it lives on the same origin as the
 * game, which means no CORS and no second service to keep alive.
 *
 * Deployed to the site root as /api.php. Everything it stores lives in ~/drift-data, one level
 * ABOVE the web root, so no save and no password hash is ever reachable over HTTP.
 *
 * Protocol: POST JSON to /api.php?a=<action>. The session token travels in the X-Drift-Token
 * header rather than Authorization, because shared hosts habitually strip the latter.
 *
 *   register {login,pass}      -> {ok,token,login}
 *   login    {login,pass}      -> {ok,token,login}
 *   me       (token)           -> {ok,login,ts}
 *   pull     (token)           -> {ok,save}
 *   push     (token,save)      -> {ok,ts} | {ok:false,reason} when the cloud holds a newer one
 *   logout   (token)           -> {ok}
 */

/* Заметки и предупреждения PHP не должны попадать в ответ: они ломают JSON
   на стороне игры. Пишем их в лог сервера, а наружу отдаём только наш ответ. */
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const DATA_DIR   = '/drift-data';
const MAX_SAVE   = 1048576;   // 1 МБ — снимок «Дрейфа» на длинной игре заметно больше 64 КБ
const TOKEN_DAYS = 90;
const TRY_MAX    = 12;        // попыток входа с одного адреса
const TRY_WIN    = 900;       // за 15 минут

/* ── ответы ── */
function out($obj, $code = 200) {
  http_response_code($code);
  echo json_encode($obj, JSON_UNESCAPED_UNICODE);
  exit;
}
function fail($msg, $code = 400) { out(['ok' => false, 'error' => $msg], $code); }

/* ── хранилище ── */
function root() {
  $r = dirname(dirname(__DIR__)) . DATA_DIR;   // .../drift-game.ru/docs -> ~/drift-data
  foreach ([$r, "$r/u", "$r/s", "$r/t", "$r/rate"] as $d) if (!is_dir($d)) @mkdir($d, 0700, true);
  return $r;
}
function userFile($login) { return root() . '/u/' . $login . '.json'; }
function saveFile($login) { return root() . '/s/' . $login . '.json'; }

function readJson($file) {
  if (!is_file($file)) return null;
  $raw = @file_get_contents($file);
  if ($raw === false) return null;
  $v = json_decode($raw, true);
  return is_array($v) ? $v : null;
}
/* запись через временный файл: оборванный запрос не оставит половину сохранения */
function writeJson($file, $data) {
  $tmp = $file . '.' . getmypid() . '.tmp';
  if (@file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE)) === false) return false;
  @chmod($tmp, 0600);
  if (!@rename($tmp, $file)) { @unlink($tmp); return false; }
  return true;
}

/* ── имя и пароль ──
   Логин нормализуется в нижний регистр: иначе «Andrey» и «andrey» — два разных игрока,
   и второй будет уверен, что у него украли прогресс. */
function cleanLogin($s) {
  $s = strtolower(trim((string)$s));
  return preg_match('/^[a-z0-9_-]{3,20}$/', $s) ? $s : null;
}
/* Почта необязательна и нужна ровно для одного — вернуть забытый пароль.
   Поэтому проверка простая: адрес либо похож на адрес, либо его нет. */
function cleanMail($s) {
  $s = trim((string)$s);
  if ($s === '') return '';
  $s = mb_strtolower($s);
  return (strlen($s) <= 100 && filter_var($s, FILTER_VALIDATE_EMAIL)) ? $s : null;
}

/* ── письмо ──
   Отправляем не через sendmail хостинга, а по SMTP с авторизацией на почтовом
   сервере домена. Причина простая: SPF домена разрешает только серверы nicmail,
   веб-хостинг в этот список не входит, и письмо от noreply@drift-game.ru,
   ушедшее с веб-сервера, у Gmail не проходит проверку и тихо пропадает.
   Отправленное же через свой ящик письмо подписывается DKIM самим сервером.

   Пароль ящика лежит в ~/drift-data/mail.json — вне веб-корня и вне репозитория:
   {"host":"mail.nic.ru","port":465,"user":"noreply@drift-game.ru","pass":"…"}
   Файла нет — откатываемся на mail(), чтобы восстановление не отваливалось совсем. */
function mailCfg() {
  static $c = null;
  if ($c === null) $c = readJson(root() . '/mail.json') ?: [];
  return $c;
}
/* Отправку логируем: без этого «письмо не пришло» неотличимо от «письма не было». */
function mailLog($line) {
  @file_put_contents(root() . '/mail.log', gmdate('Y-m-d H:i:s') . ' ' . $line . "\n",
                     FILE_APPEND | LOCK_EX);
}

/* Одна реплика диалога. Ответ сервера бывает многострочным: продолжение помечено
   дефисом на четвёртом знаке, и читать надо до строки без него. */
function smtpTalk($fp, $cmd, $expect, &$err) {
  if ($cmd !== null && fwrite($fp, $cmd . "\r\n") === false) { $err = 'обрыв при отправке'; return false; }
  do {
    $line = fgets($fp, 2048);
    if ($line === false) { $err = 'сервер молчит'; return false; }
  } while (isset($line[3]) && $line[3] === '-');
  if (strncmp($line, $expect, strlen($expect)) !== 0) { $err = trim($line); return false; }
  return true;
}

function smtpSend($cfg, $to, $subj, $text, &$err, $html = null) {
  $host = $cfg['host'] ?? 'mail.nic.ru';
  $port = (int)($cfg['port'] ?? 465);
  $user = (string)($cfg['user'] ?? '');
  $pass = (string)($cfg['pass'] ?? '');
  $from = (string)($cfg['from'] ?? $user);

  $fp = @stream_socket_client(($port === 465 ? 'ssl://' : 'tcp://') . "$host:$port",
                              $en, $es, 20, STREAM_CLIENT_CONNECT);
  if (!$fp) { $err = "нет связи с $host:$port ($es)"; return false; }
  stream_set_timeout($fp, 20);

  $ok = smtpTalk($fp, null, '220', $err)
     && smtpTalk($fp, 'EHLO drift-game.ru', '250', $err);
  /* 587 — открытый порт с последующим переходом на шифрование; 465 шифрован сразу */
  if ($ok && $port !== 465) {
    $ok = smtpTalk($fp, 'STARTTLS', '220', $err)
       && @stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)
       && smtpTalk($fp, 'EHLO drift-game.ru', '250', $err);
    if (!$ok && $err === '') $err = 'не удалось включить шифрование';
  }
  $ok = $ok
     && smtpTalk($fp, 'AUTH LOGIN', '334', $err)
     && smtpTalk($fp, base64_encode($user), '334', $err)
     && smtpTalk($fp, base64_encode($pass), '235', $err)
     && smtpTalk($fp, "MAIL FROM:<$from>", '250', $err)
     && smtpTalk($fp, "RCPT TO:<$to>", '250', $err)
     && smtpTalk($fp, 'DATA', '354', $err);

  if ($ok) {
    $head = "Date: " . date('r') . "\r\n"
          . "From: =?UTF-8?B?" . base64_encode('Дрейф') . "?= <$from>\r\n"
          . "To: <$to>\r\n"
          . "Subject: =?UTF-8?B?" . base64_encode($subj) . "?=\r\n"
          . "Message-ID: <" . bin2hex(random_bytes(12)) . "@drift-game.ru>\r\n"
          . "MIME-Version: 1.0\r\n"
          . "X-Mailer: drift\r\n";
    list($ct, $body) = mailBody($text, $html);
    $head .= $ct;
    /* Точка в начале строки означала бы конец письма — по правилам SMTP её удваивают. */
    $body = preg_replace("/^\./m", '..', $body);
    fwrite($fp, $head . "\r\n" . $body . "\r\n.\r\n");
    $ok = smtpTalk($fp, null, '250', $err);
  }
  @fwrite($fp, "QUIT\r\n");
  @fclose($fp);
  return $ok;
}

/* Тело письма: текст всегда, HTML — если дали. Две части в multipart/alternative,
   почтовик сам выберет, что показать; кто читает в терминале, получит текст. */
function mailBody($text, $html) {
  $nl = function ($t) { return str_replace("\n", "\r\n", str_replace("\r\n", "\n", $t)); };
  if ($html === null)
    return ["Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n", $nl($text)];
  $b = 'drift-' . bin2hex(random_bytes(8));
  $body = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n"
        . $nl($text) . "\r\n--$b\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n"
        . $nl($html) . "\r\n--$b--";
  return ["Content-Type: multipart/alternative; boundary=\"$b\"\r\n", $body];
}

/* Вёрстка письма в духе сайта: ночь, фосфор, моноширинный. Всё инлайном —
   стили из <head> и внешние файлы почтовики режут; таблица — потому что у
   Outlook до сих пор движок Word. $paras — абзацы, $btn — [надпись, ссылка]. */
function mailHtml($title, $paras, $btn = null) {
  $e = function ($t) { return htmlspecialchars($t, ENT_QUOTES, 'UTF-8'); };
  $mono = 'ui-monospace,Menlo,Consolas,monospace';
  $h = '';
  foreach ($paras as $p)
    $h .= '<p style="margin:0 0 14px;font:14px/1.65 ' . $mono . ';color:#cfe3ea">' . nl2br($e($p)) . '</p>';
  if ($btn) {
    $h .= '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 24px"><tr>'
        . '<td style="border:1px solid #7fe6d8;border-radius:3px;background:#0c1a1f">'
        . '<a href="' . $e($btn[1]) . '" style="display:block;padding:13px 24px;font:bold 13px/1 ' . $mono
        . ';letter-spacing:.16em;text-transform:uppercase;color:#7fe6d8;text-decoration:none">' . $e($btn[0]) . '</a>'
        . '</td></tr></table>'
        . '<p style="margin:0 0 14px;font:12px/1.6 ' . $mono . ';color:#6d8494">Если кнопка не работает, ссылка целиком:<br>'
        . '<a href="' . $e($btn[1]) . '" style="color:#7fe6d8;word-break:break-all">' . $e($btn[1]) . '</a></p>';
  }
  return '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">'
       . '<title>' . $e($title) . '</title></head>'
       . '<body style="margin:0;padding:0;background:#05070c">'
       . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05070c"><tr>'
       . '<td align="center" style="padding:36px 16px">'
       . '<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%">'
       . '<tr><td style="padding:0 0 22px;font:bold 12px/1 ' . $mono . ';letter-spacing:.28em;text-transform:uppercase;color:#7fe6d8">&#9670; Дрейф</td></tr>'
       . '<tr><td style="padding:26px 28px;background:#080d16;border:1px solid #1a3a3c;border-radius:4px">'
       . '<h1 style="margin:0 0 18px;font:bold 19px/1.3 ' . $mono . ';letter-spacing:.03em;color:#cfe3ea">' . $e($title) . '</h1>'
       . $h . '</td></tr>'
       . '<tr><td style="padding:18px 4px 0;font:11px/1.6 ' . $mono . ';letter-spacing:.12em;text-transform:uppercase;color:#6d8494">'
       . 'Письмо отправлено само собой — отвечать некому.<br><a href="https://drift-game.ru" style="color:#6d8494">drift-game.ru</a></td></tr>'
       . '</table></td></tr></table></body></html>';
}

function sendMail($to, $subj, $text, $html = null) {
  $cfg = mailCfg();
  if (!empty($cfg['user']) && !empty($cfg['pass'])) {
    $err = '';
    $ok  = smtpSend($cfg, $to, $subj, $text, $err, $html);
    mailLog(($ok ? 'ok   smtp ' : 'FAIL smtp ') . $to . ($ok ? '' : ' — ' . $err));
    if ($ok) return true;
    /* Если почтовый сервер не принял письмо, пробовать sendmail бессмысленно:
       именно от него письма и пропадали. Честнее вернуть неудачу. */
    return false;
  }
  $from = 'noreply@drift-game.ru';
  $head = "From: =?UTF-8?B?" . base64_encode('Дрейф') . "?= <$from>\r\n"
        . "Reply-To: $from\r\n"
        . "MIME-Version: 1.0\r\n"
        . "X-Mailer: drift\r\n";
  list($ct, $body) = mailBody($text, $html);
  $s  = "=?UTF-8?B?" . base64_encode($subj) . "?=";
  $ok = @mail($to, $s, $body, $head . rtrim($ct, "\r\n"), "-f$from");
  mailLog(($ok ? 'ok   mail() ' : 'FAIL mail() ') . $to . ' — нет mail.json, отправка через sendmail');
  return $ok;
}

/* ── ограничение попыток ──
   Считаем по адресу, а не по логину: перебор пароля к чужому имени дороже, чем
   собственная забывчивость, и блокировать надо стучащего, а не жертву. */
function rateHit($tag, $max = TRY_MAX) {
  $ip  = $_SERVER['REMOTE_ADDR'] ?? '0';
  $f   = root() . '/rate/' . $tag . '_' . sha1($ip) . '.json';
  $now = time();
  $r   = readJson($f);
  if (!$r || ($r['t'] ?? 0) < $now - TRY_WIN) $r = ['t' => $now, 'n' => 0];
  $r['n']++;
  writeJson($f, $r);
  return $r['n'] <= $max;
}

/* ── метла ──
   Раньше мусор подметался броском кубика (`mt_rand(1,50)===1`) в самих
   действиях. Для редких действий это работает, но `road` и `trace` заводят
   файлы БЕЗ учётной записи, а значит их может заводить кто угодно и сколько
   угодно: скрипт создаёт файлы быстрее, чем кубик их выметает. На дешёвом
   хостинге первым кончается не место, а инодов — и тогда `writeJson` перестаёт
   писать ВСЁ, включая чужие сохранения. Поэтому метла теперь по часам, а не по
   случаю: не чаще раза в `$every` секунд, зато наверняка, и её работа не
   зависит от того, повезло ли запросу. */
function sweepDir($dir, $ageSec, $every) {
  if (!is_dir($dir)) return;
  $stamp = $dir . '/.swept';
  $now   = time();
  if (is_file($stamp) && $now - (int)@filemtime($stamp) < $every) return;
  @touch($stamp);
  foreach (glob("$dir/*.json") as $g)
    if ($now - (int)@filemtime($g) > $ageSec) @unlink($g);
}

/* ── сессии ──
   Токен нигде не хранится в открытом виде: и в учётной записи, и в указателе лежит его
   sha256, так что утёкшая копия папки не даёт войти. Указатель `t/<хеш>.json` нужен, чтобы
   узнавание игрока стоило одного чтения файла, а не обхода всех учётных записей. */
function tokenFile($h) { return root() . '/t/' . $h . '.json'; }

function tokenNew(&$user) {
  $tok = bin2hex(random_bytes(24));
  $exp = time() + TOKEN_DAYS * 86400;
  $h   = hash('sha256', $tok);
  if (!isset($user['tokens']) || !is_array($user['tokens'])) $user['tokens'] = [];
  /* просроченные выносим и из учётной записи, и из указателя — иначе папка t/ растёт вечно */
  foreach ($user['tokens'] as $old => $e) if ($e < time()) {
    unset($user['tokens'][$old]);
    @unlink(tokenFile($old));
  }
  $user['tokens'][$h] = $exp;
  writeJson(tokenFile($h), ['login' => $user['login'], 'exp' => $exp]);
  return $tok;
}
function tokenDrop($h, &$user) {
  unset($user['tokens'][$h]);
  @unlink(tokenFile($h));
}
function whoami() {
  $tok = $_SERVER['HTTP_X_DRIFT_TOKEN'] ?? '';
  if (!preg_match('/^[a-f0-9]{48}$/', $tok)) return null;
  $t = readJson(tokenFile(hash('sha256', $tok)));
  if (!$t || ($t['exp'] ?? 0) < time()) return null;
  $login = cleanLogin($t['login'] ?? '');
  return $login ? readJson(userFile($login)) : null;
}
function need() {
  $u = whoami();
  if (!$u) fail('нужен вход', 401);
  return $u;
}

/* ── тело запроса ── */
function body() {
  $raw = file_get_contents('php://input');
  if (strlen($raw) > MAX_SAVE) fail('слишком большая запись', 413);
  $v = json_decode($raw, true);
  return is_array($v) ? $v : [];
}

$a = $_GET['a'] ?? '';

if ($a === 'register') {
  if (!rateHit('reg')) fail('слишком много попыток, подождите четверть часа', 429);
  $b     = body();
  $login = cleanLogin($b['login'] ?? '');
  $pass  = (string)($b['pass'] ?? '');
  $mail  = cleanMail($b['mail'] ?? '');
  if (!$login) fail('имя: 3–20 знаков, латиница, цифры, дефис или подчёркивание');
  if (strlen($pass) < 6) fail('пароль короче шести знаков');
  if (($b['mail'] ?? '') !== '' && !$mail) fail('почта выглядит неправильно');
  if (is_file(userFile($login))) fail('такое имя уже занято');
  $user = [
    'login'   => $login,
    'hash'    => password_hash($pass, PASSWORD_DEFAULT),
    'mail'    => $mail,
    'created' => time(),
    'tokens'  => []
  ];
  $tok = tokenNew($user);
  if (!writeJson(userFile($login), $user)) fail('не удалось создать запись', 500);
  out(['ok' => true, 'token' => $tok, 'login' => $login]);
}

if ($a === 'login') {
  if (!rateHit('log')) fail('слишком много попыток, подождите четверть часа', 429);
  $b     = body();
  $login = cleanLogin($b['login'] ?? '');
  $pass  = (string)($b['pass'] ?? '');
  $user  = $login ? readJson(userFile($login)) : null;
  /* один и тот же текст на «нет такого имени» и «не тот пароль»: иначе форма
     превращается в справочник существующих логинов */
  if (!$user || !password_verify($pass, $user['hash'] ?? '')) fail('имя или пароль не подходят', 401);
  $tok = tokenNew($user);
  writeJson(userFile($login), $user);
  $s = readJson(saveFile($login));
  out(['ok' => true, 'token' => $tok, 'login' => $login, 'ts' => $s['ts'] ?? 0]);
}

if ($a === 'me') {
  $u = need();
  $s = readJson(saveFile($u['login']));
  out(['ok' => true, 'login' => $u['login'], 'ts' => $s['ts'] ?? 0,
       'mail' => !empty($u['mail'])]);
}

if ($a === 'logout') {
  $u   = whoami();
  $tok = $_SERVER['HTTP_X_DRIFT_TOKEN'] ?? '';
  if ($u) {
    tokenDrop(hash('sha256', $tok), $u);
    writeJson(userFile($u['login']), $u);
  }
  out(['ok' => true]);
}

/* ── забытый пароль ──
   Ответ всегда одинаковый и всегда бодрый: иначе форма превращается в способ
   узнать, у кого из игроков какая почта. Ссылка живёт час и сгорает после
   первого использования. */
if ($a === 'forgot') {
  if (!rateHit('forgot')) fail('слишком много попыток, подождите четверть часа', 429);
  $b     = body();
  $login = cleanLogin($b['login'] ?? '');
  $user  = $login ? readJson(userFile($login)) : null;
  if ($user && !empty($user['mail'])) {
    $key = bin2hex(random_bytes(16));
    $user['reset'] = ['h' => hash('sha256', $key), 'exp' => time() + 3600];
    writeJson(userFile($login), $user);
    $link = 'https://drift-game.ru/reset.html?k=' . $key . '&u=' . rawurlencode($login);
    $p1 = "Кто-то (надеемся, вы) попросил сменить пароль для записи «{$login}».";
    $p2 = "Ссылка работает один час и один раз.";
    $p3 = "Если это были не вы, просто удалите письмо: пока по ссылке не перешли, старый пароль работает как работал.";
    sendMail($user['mail'], 'Дрейф — новый пароль',
      "$p1\n\n$p2\n$link\n\n$p3\n\n— Дрейф, drift-game.ru",
      mailHtml('Новый пароль', [$p1, $p2, $p3], ['Сменить пароль', $link]));
  } else {
    mailLog('skip forgot — у записи «' . ($login ?: '?') . '» нет почты или её вовсе нет');
  }
  out(['ok' => true, 'sent' => true]);
}

if ($a === 'reset') {
  if (!rateHit('reset')) fail('слишком много попыток, подождите четверть часа', 429);
  $b     = body();
  $login = cleanLogin($b['login'] ?? '');
  $key   = (string)($b['key'] ?? '');
  $pass  = (string)($b['pass'] ?? '');
  $user  = $login ? readJson(userFile($login)) : null;
  if (strlen($pass) < 6) fail('пароль короче шести знаков');
  if (!$user || empty($user['reset'])) fail('ссылка уже не работает');
  if (($user['reset']['exp'] ?? 0) < time()) fail('ссылка просрочена — попросите новую');
  if (!hash_equals($user['reset']['h'], hash('sha256', $key))) fail('ссылка не подходит');
  $user['hash'] = password_hash($pass, PASSWORD_DEFAULT);
  unset($user['reset']);
  /* Меняя пароль, разлогиниваем все устройства: если запись увели, этим
     ходом её и возвращают. */
  foreach (($user['tokens'] ?? []) as $h => $e) @unlink(tokenFile($h));
  $user['tokens'] = [];
  $tok = tokenNew($user);
  writeJson(userFile($login), $user);
  out(['ok' => true, 'token' => $tok, 'login' => $login]);
}

/* Почту можно добавить и позже — из игры или с сайта, уже войдя.
   Пустое значение отвергаем: раньше оно молча стирало адрес, а вместе с ним и
   единственную возможность вернуть пароль. Стирание — не то, что просят
   случайно, поэтому его тут просто нет. */
if ($a === 'setmail') {
  $u    = need();
  $b    = body();
  $mail = cleanMail($b['mail'] ?? '');
  if ($mail === null || $mail === '') fail('почта выглядит неправильно');
  $u['mail'] = $mail;
  writeJson(userFile($u['login']), $u);
  out(['ok' => true, 'mail' => $mail]);
}

/* ── уйти совсем ──
   Способа удалить запись не было вовсе: человек, попросивший стереть его данные,
   упирался в переписку и ручную работу. Просим пароль — не из недоверия к токену,
   а потому что это последнее необратимое действие в игре, и оно должно стоить
   осознанного усилия. Уносим всё: учётную запись, сохранение, суточные копии и
   все сессии на всех устройствах. */
if ($a === 'delete') {
  if (!rateHit('del')) fail('слишком много попыток, подождите четверть часа', 429);
  $u    = need();
  $b    = body();
  $pass = (string)($b['pass'] ?? '');
  if (!password_verify($pass, $u['hash'] ?? '')) fail('пароль не подходит', 401);
  $login = $u['login'];
  foreach (($u['tokens'] ?? []) as $h => $e) @unlink(tokenFile($h));
  @unlink(saveFile($login));
  $bak = root() . '/bak/' . $login;
  if (is_dir($bak)) { foreach (glob("$bak/*.json") as $g) @unlink($g); @rmdir($bak); }
  @unlink(userFile($login));
  out(['ok' => true, 'deleted' => $login]);
}

if ($a === 'pull') {
  $u = need();
  $s = readJson(saveFile($u['login']));
  if (!$s) out(['ok' => false, 'reason' => 'записи нет']);
  out(['ok' => true, 'save' => $s]);
}

if ($a === 'push') {
  $u    = need();
  $b    = body();
  $save = $b['save'] ?? null;
  if (!is_array($save) || !isset($save['v'])) fail('это не снимок игры');
  /* Не затираем запись, сделанную позже с другого устройства — иначе телефон,
     пролежавший день с открытой вкладкой, съест вечерний прогресс с компьютера. */
  $old = readJson(saveFile($u['login']));
  $ts  = (int)($save['ts'] ?? 0);
  /* ── время приходит с устройства, и оно бывает сломано ──
     `ts` — это `Date.now()` того, кто прислал (`snapshot`, 14-save), а спор
     двух устройств решается «чей ts новее». Телефон со сбитыми часами или
     севшей батарейкой присылает 2091 год — и облако становится НЕПЕРЕЗАПИСЫВАЕМЫМ
     навсегда: любая честная запись всегда «старее». Метка из будущего дальше
     суток — это не игрок обогнал время, это часы врут; берём своё. */
  if ($ts > (time() + 86400) * 1000) { $ts = (int)round(microtime(true) * 1000); $save['ts'] = $ts; }
  if ($old && ($old['ts'] ?? 0) > $ts && empty($b['force'])) {
    out(['ok' => false, 'reason' => 'в облаке запись новее', 'ts' => $old['ts']]);
  }
  /* ── суточная копия ПРЕДЫДУЩЕЙ записи ──
     Одно сохранение на игрока и одна перезапись поверх: если клиент пришлёт
     испорченный или полупустой снимок, настоящей игры больше нигде нет. Раз в
     сутки, перед первой перезаписью, откладываем то, что лежало ДО неё, — так в
     папке остаётся по слепку на каждый прожитый день, а не копия сегодняшней
     беды. Данных на всю игру — десятки килобайт, места это не стоит.
     Держим две недели: дальше человек уже не вспомнит, к какому дню возвращаться. */
  if ($old) {
    $bak = root() . '/bak/' . $u['login'];
    if (!is_dir($bak)) @mkdir($bak, 0700, true);
    $today = $bak . '/' . gmdate('Y-m-d') . '.json';
    if (!is_file($today)) {
      writeJson($today, $old);
      $all = glob("$bak/*.json");
      sort($all);
      while (count($all) > 14) @unlink(array_shift($all));
    }
  }
  if (!writeJson(saveFile($u['login']), $save)) fail('не удалось записать', 500);
  out(['ok' => true, 'ts' => $ts]);
}

/* ── дорога: кто ещё в этом секторе (M168c) ──
   Пилот раз в полминуты шлёт номер сектора (~клетка 2.8 км, не координаты)
   и анонимную метку. Ответ — сколько других отметилось там за три минуты.
   Аккаунт не нужен: метка случайная, восстановить по ней человека нельзя.
   Файл на сектор, чистится сам; редкая метла сметает отлежавшиеся файлы. */
if ($a === 'road') {
  /* Предел щедрый нарочно: пилот шлёт раз в полминуты, то есть 30 раз за
     четверть часа, и за одним адресом провайдера может сидеть несколько
     человек. 300 — это десяток честных пилотов и всё ещё стена для скрипта,
     который иначе завёл бы миллион файлов-секторов за минуту. */
  if (!rateHit('road', 300)) fail('слишком часто', 429);
  $b   = body();
  $sec = (string)($b['sec'] ?? '');
  $id  = (string)($b['id'] ?? '');
  if (!preg_match('/^-?\d{1,7}:-?\d{1,7}$/', $sec)) fail('сектор не читается');
  if (!preg_match('/^[a-f0-9]{8,32}$/', $id)) fail('нет метки пилота');
  $dir = root() . '/road';
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
  $f   = $dir . '/' . str_replace(['-', ':'], ['m', '_'], $sec) . '.json';
  $now = time();
  $p   = readJson($f);
  if (!is_array($p)) $p = [];
  foreach ($p as $k => $ts) if (!is_int($ts) || $now - $ts > 180) unset($p[$k]);
  $p[$id] = $now;
  if (count($p) > 200) $p = array_slice($p, -200, null, true);
  writeJson($f, $p);
  sweepDir($dir, 600, 60);                 /* сектора живут 10 минут, метла раз в минуту */
  sweepDir(root() . '/rate', TRY_WIN * 2, 3600);   /* счётчики попыток дольше окна не нужны */
  out(['ok' => true, 'n' => count($p) - 1]);
}

/* ── чужой след: знак и вещь, оставленные в месте (M171) ──
   Учётная запись не нужна: метка пилота случайна и заведена в localStorage той
   же строкой, что у дороги. Наружу от человека не уходит НИ ОДНОГО НАПЕЧАТАННОГО
   ЗНАКА — только номер фигуры, шесть знаков «руки», ключ ресурса и счёт единиц.
   Модерировать нечего. Замысел: docs/DESIGN-trace.md */
if ($a === 'trace') {
  $b   = body();
  $op  = (string)($b['op'] ?? '');
  $id  = (string)($b['id'] ?? '');
  $key = (string)($b['key'] ?? '');
  if (!preg_match('/^[a-f0-9]{8,32}$/', $id))                       fail('нет метки пилота');
  if (!preg_match('/^-?\d{1,6},-?\d{1,6}(\/\d{1,4})?$/', $key))     fail('место не читается');

  $dir = root() . '/trace';
  foreach ([$dir, "$dir/p", "$dir/u", "$dir/w"] as $d) if (!is_dir($d)) @mkdir($d, 0700, true);
  $pf  = "$dir/p/" . str_replace([',', '/', '-'], ['_', 'p', 'm'], $key) . '.json';
  $uf  = "$dir/u/$id.json";
  $now = time();

  $list = readJson($pf);  if (!is_array($list)) $list = [];
  $me   = readJson($uf);  if (!is_array($me))   $me   = [];
  $day  = gmdate('Y-m-d');
  if (($me['day'] ?? '') !== $day) { $me['day'] = $day; $me['n'] = 0; }

  /* просрочка: тридцать дней — и следа нет. Метла редкая, как у дороги */
  $keep = [];
  foreach ($list as $t) if (is_array($t) && $now - (int)($t['t'] ?? 0) < 2592000) $keep[] = $t;
  $stale = count($keep) !== count($list);
  $list  = $keep;

  /* ── стена (M210) ──
     Тайник (put/ask/take) исчезает, как только его подняли, и потому чужой
     знак почти никогда не виден: он либо ещё не оставлен, либо уже унесён.
     Стена — обратное: знаки НАКАПЛИВАЮТСЯ. Брать с неё нечего и класть на неё
     нечего; на ней расписываются, и вся награда в том, чтобы увидеть, сколько
     народу тут уже стояло. Поэтому и хранится она дольше тайника, и вмещает
     не восьмерых, а дюжину.

     Наружу не уходит ни метка пилота, ни время: только знак, рука и признак
     «это твой». Признание — рука и ничего больше, как в M171. */
  if ($op === 'wall' || $op === 'sign') {
    $wk = (string)($b['w'] ?? '');
    if ($wk !== 's' && $wk !== 'c') fail('такой стены нет');
    $wf = "$dir/w/" . $wk . '_' . str_replace([',', '/', '-'], ['_', 'p', 'm'], $key) . '.json';
    $wall = readJson($wf); if (!is_array($wall)) $wall = [];
    $wkeep = [];
    /* девяносто дней: стена помнит дольше тайника — она запись, а не запас */
    foreach ($wall as $t) if (is_array($t) && $now - (int)($t['t'] ?? 0) < 7776000) $wkeep[] = $t;
    $wstale = count($wkeep) !== count($wall);
    $wall = $wkeep;

    if ($op === 'sign') {
      if (!rateHit('twall', 40)) fail('слишком часто', 429);
      $m = (int)($b['m'] ?? -1);
      $h = (string)($b['h'] ?? '');
      if ($m < 0 || $m > 31)                  fail('знака такого нет');
      if (!preg_match('/^[a-f0-9]{6}$/', $h)) fail('нет руки');
      /* один знак на стену от одного человека: стена своих же подписей —
         не запись о людях, а тщеславие */
      foreach ($wall as $t) if (($t['o'] ?? '') === $id) out(['ok' => false, 'reason' => 'ваш знак тут уже есть']);
      $wall[] = ['m' => $m, 'h' => $h, 't' => $now, 'o' => $id];
      if (count($wall) > 12) $wall = array_slice($wall, -12);
      writeJson($wf, $wall);
    } elseif ($wstale) {
      writeJson($wf, $wall);
    }
    sweepDir("$dir/w", 7776000, 86400);
    $outw = [];
    foreach ($wall as $t)
      $outw[] = ['m' => (int)($t['m'] ?? 0), 'h' => (string)($t['h'] ?? ''),
                 'me' => (($t['o'] ?? '') === $id) ? 1 : 0];
    out(['ok' => true, 'w' => $outw]);
  }

  if ($op === 'put') {
    /* Оставить след можно трижды в сутки — но счёт ведётся по метке пилота,
       которую клиент сам себе и выдумывает (`traceId`, 11ag-trace). Стереть
       одну строку в хранилище — и метка новая. Поэтому вторая, независимая
       граница: по адресу. Честному человеку её не заметить (три следа в день),
       а скрипт упирается в неё сразу — и не заводит месячных файлов пачками. */
    if (!rateHit('tput', 30)) fail('слишком часто', 429);
    $m = (int)($b['m'] ?? -1);
    $h = (string)($b['h'] ?? '');
    $r = (string)($b['r'] ?? '');
    $n = (int)($b['n'] ?? 0);
    if ($m < 0 || $m > 31)                     fail('знака такого нет');
    if (!preg_match('/^[a-f0-9]{6}$/', $h))    fail('нет руки');
    if (!preg_match('/^[a-z]{2,12}$/', $r))    fail('это не груз');
    if ($n < 1 || $n > 5)                      fail('столько не оставляют');
    if ((int)($me['n'] ?? 0) >= 3) out(['ok' => false, 'reason' => 'на сегодня хватит']);
    $list[] = ['i' => $now . substr($id, 0, 4), 'm' => $m, 'h' => $h, 'r' => $r, 'n' => $n,
               't' => $now, 'o' => $id];
    if (count($list) > 8) $list = array_slice($list, -8);   /* место помнит восьмерых */
    $me['n'] = (int)($me['n'] ?? 0) + 1;
    writeJson($pf, $list); writeJson($uf, $me);
    out(['ok' => true]);
  }

  if ($op === 'ask') {
    /* самый старый чужой — первым пришедшим и достаётся */
    $t = null;
    foreach ($list as $c) if (($c['o'] ?? '') !== $id) { $t = $c; break; }
    $took = (int)($me['took'] ?? 0);
    if ($took > 0) { $me['took'] = 0; writeJson($uf, $me); }
    /* Пишем ТОЛЬКО если что-то протухло. Иначе каждая посадка в пустом месте
       заводила бы пустой файл — а посадок за игру тысячи. */
    if ($stale) writeJson($pf, $list);
    sweepDir("$dir/p", 2592000, 3600);     /* место помнит след тридцать дней */
    /* А `u/<метка>.json` не подметался вовсе: файл на каждую метку пилота,
       навсегда, при том что метки бесплатны. Полгода без единого следа — и
       помнить о ней нечего. */
    sweepDir("$dir/u", 15552000, 86400);
    out(['ok' => true, 'took' => $took,
         't'  => $t ? ['i' => $t['i'], 'm' => (int)$t['m'], 'h' => $t['h'],
                       'r' => $t['r'], 'n' => (int)$t['n']] : null]);
  }

  if ($op === 'take') {
    $i = (string)($b['i'] ?? '');
    $out = []; $owner = '';
    foreach ($list as $c) {
      if ($owner === '' && (string)($c['i'] ?? '') === $i && ($c['o'] ?? '') !== $id) { $owner = (string)$c['o']; continue; }
      $out[] = $c;
    }
    if ($owner === '') out(['ok' => false, 'reason' => 'этого следа уже нет']);
    writeJson($pf, $out);
    /* оставившему — только счёт: кто и где, не сообщается никогда */
    if (preg_match('/^[a-f0-9]{8,32}$/', $owner)) {
      $of = "$dir/u/$owner.json";
      $o  = readJson($of); if (!is_array($o)) $o = [];
      $o['took'] = (int)($o['took'] ?? 0) + 1;
      writeJson($of, $o);
    }
    out(['ok' => true]);
  }

  fail('неизвестная операция следа');
}

/* ── почта: открытка уходит в общую кучу (M190) ──
   Учётная запись не нужна, как у следа и у дороги: метка пилота случайна и
   живёт в localStorage. Наружу от человека не уходит НИ ОДНОГО НАПЕЧАТАННОГО
   ЗНАКА — номер бланка, номера вычеркнутых вариантов, до трёх номеров глифов
   и числа снимка сцены. Модерировать физически нечего, и это не удобство, а
   условие: свободная строка между незнакомцами потребовала бы людей на
   разборе жалоб, то есть превратила бы игру в сервис.

   ИМЁН НЕТ НИГДЕ. В пуле у карточки лежит метка отправителя, но она НИКОГДА
   не уходит наружу: поймавший получает только саму карточку и номер цепочки.
   Ответ сервер кладёт на другой конец цепочки сам. Ни одна сторона не может
   ни узнать, ни найти, ни позвать другую. Замолчал — и тебя нет насовсем.

   ЦЕПОЧКА — два конца и ничего больше: `a` завёл, `b` поймал. Третьего в неё
   не пускают, поэтому «переписка» не превращается в комнату.

   ГРАНИЦЫ. Три карточки в сутки на метку (положить и ответить считаются
   вместе), две пойманных, и вторая граница по адресу — как у следа: метку
   игрок выдумывает себе сам, а адрес нет.

   ХРАНЕНИЕ. Карточка — отдельный файл: одновременные «положить» не затирают
   друг друга, а метла по часам сносит всё старше тридцати суток. */
if ($a === 'post') {
  $b  = body();
  $op = (string)($b['op'] ?? '');
  $id = (string)($b['id'] ?? '');
  if (!preg_match('/^[a-f0-9]{8,32}$/', $id)) fail('нет метки пилота');

  $dir = root() . '/post';
  foreach ([$dir, "$dir/pool", "$dir/ch", "$dir/u"] as $d) if (!is_dir($d)) @mkdir($d, 0700, true);
  $uf  = "$dir/u/$id.json";
  $now = time();
  $me  = readJson($uf); if (!is_array($me)) $me = [];
  $day = gmdate('Y-m-d');
  if (($me['day'] ?? '') !== $day) { $me['day'] = $day; $me['put'] = 0; $me['got'] = 0; }

  /* Разбор карточки: объект собирается ПОЛЕ ЗА ПОЛЕМ, а не берётся целиком.
     Взять присланное как есть значило бы пустить через сервер что угодно —
     а весь смысл затеи в том, что через него не проходит ничего, кроме чисел,
     которые игра сама же и рисует. */
  $card = function ($c) {
    if (!is_array($c)) return null;
    $s = (string)($c['m'] ?? '');
    if ($s !== 's' && $s !== 'l')                                 return null;
    if (!preg_match('/^[a-z0-9]{1,8}$/', (string)($c['f'] ?? ''))) return null;
    if (!preg_match('/^[0-9][0-9.]{1,11}$/', (string)($c['ver'] ?? ''))) return null;
    $sx = (int)($c['sx'] ?? 0); $sy = (int)($c['sy'] ?? 0);
    $pi = (int)($c['pi'] ?? 0); $mi = (int)($c['mi'] ?? -1);
    $cx = (int)($c['cx'] ?? 0); $t  = (int)($c['t'] ?? 0);
    if (abs($sx) > 9999 || abs($sy) > 9999)   return null;
    if ($pi < 0 || $pi > 31 || $mi < -1 || $mi > 15) return null;
    if ($cx < 0 || $cx > 20000000)            return null;
    if ($t  < 0 || $t  > 1099511627776)       return null;
    $lon = $c['lon'];
    if ($lon !== null) {
      if (!is_numeric($lon)) return null;
      $lon = round((float)$lon, 3);
      if ($lon < -7.0 || $lon > 7.0) return null;
    }
    $ch = [];
    foreach ((array)($c['c'] ?? []) as $v) {
      $v = (int)$v; if ($v < 0 || $v > 7) return null;
      $ch[] = $v; if (count($ch) > 8) return null;
    }
    $gl = [];
    foreach ((array)($c['g'] ?? []) as $v) {
      $v = (int)$v; if ($v < 0 || $v > 31) return null;
      $gl[] = $v; if (count($gl) > 3) return null;
    }
    return ['v' => 1, 'm' => $s, 'sx' => $sx, 'sy' => $sy, 'pi' => $pi, 'mi' => $mi,
            'lon' => $lon, 'cx' => $cx, 't' => $t, 'ver' => (string)$c['ver'],
            'f' => (string)$c['f'], 'c' => $ch, 'g' => $gl];
  };

  /* метла: карточка живёт тридцать суток, цепочка — столько же от последнего
     слова, метка — полгода без единой карточки */
  sweepDir("$dir/pool", 2592000, 3600);
  sweepDir("$dir/ch",   2592000, 86400);
  sweepDir("$dir/u",    15552000, 86400);

  /* ── ход в партии по переписке (M192) ──
     Три маленьких числа рядом с карточкой. Ход — это данные, поэтому правило
     «ничего напечатанного человеком не проходит» держится без единой оговорки,
     и разбирается он так же строго, как сама карточка: поле за полем. */
  $move = function ($v) {
    if ($v === null) return null;
    if (!is_array($v)) return false;
    $f = (int)($v['f'] ?? -1); $t = (int)($v['t'] ?? -1); $p = (int)($v['p'] ?? 0);
    if ($f < 0 || $f > 63 || $t < 0 || $t > 63 || $f === $t) return false;
    if ($p < 0 || $p > 3) return false;
    return ['f' => $f, 't' => $t, 'p' => $p];
  };

  if ($op === 'put' || $op === 'reply') {
    if (!rateHit('post', 40)) fail('слишком часто', 429);
    if ((int)($me['put'] ?? 0) >= 3) out(['ok' => false, 'reason' => 'три карточки в сутки']);
    $c = $card($b['card'] ?? null);
    if (!$c) fail('карточка не читается');
    $mv = $move($b['mv'] ?? null);
    if ($mv === false) fail('ход не читается');

    if ($op === 'reply') {
      /* ответ идёт НА ДРУГОЙ КОНЕЦ цепочки, и класть его туда — дело сервера:
         ни одна сторона не знает метки другой и не может её узнать */
      $chId = (string)($b['ch'] ?? '');
      if (!preg_match('/^[a-f0-9]{12}$/', $chId)) fail('цепочки такой нет');
      $cf = "$dir/ch/$chId.json";
      $C  = readJson($cf);
      if (!is_array($C)) out(['ok' => false, 'reason' => 'цепочка оборвалась']);
      if (!empty($C['dead']))        out(['ok' => false, 'reason' => 'на том конце не принимают']);
      /* поймавший становится вторым концом при первом ответе */
      if (($C['a'] ?? '') !== $id && ($C['b'] ?? '') === '') $C['b'] = $id;
      $to = (($C['a'] ?? '') === $id) ? (string)($C['b'] ?? '') : (string)($C['a'] ?? '');
      if ($to === '' || $to === $id) out(['ok' => false, 'reason' => 'отвечать некому']);
      $tf = "$dir/u/$to.json";
      $T  = readJson($tf); if (!is_array($T)) $T = [];
      $in = (array)($T['in'] ?? []);
      /* ящик не резиновый: восемь карточек, дальше самая старая выпадает */
      $one = ['ch' => $chId, 'card' => $c, 't' => $now];
      if ($mv) $one['mv'] = $mv;
      $in[] = $one;
      if (count($in) > 8) $in = array_slice($in, -8);
      $T['in'] = $in;
      writeJson($tf, $T);
      $C['t'] = $now;
      writeJson($cf, $C);
      $me['put'] = (int)($me['put'] ?? 0) + 1;
      writeJson($uf, $me);
      out(['ok' => true]);
    }

    /* положить в общую кучу */
    if (count(glob("$dir/pool/*.json") ?: []) > 4000) out(['ok' => false, 'reason' => 'почта переполнена']);
    $chId = bin2hex(random_bytes(6));
    writeJson("$dir/ch/$chId.json", ['a' => $id, 'b' => '', 't' => $now]);
    $cid  = $now . substr(sha1($id . $chId), 0, 8);
    $entry = ['i' => $cid, 'ch' => $chId, 'o' => $id, 't' => $now, 'card' => $c];
    if ($mv) $entry['mv'] = $mv;                      /* партия по переписке (M192) */
    writeJson("$dir/pool/$cid.json", $entry);
    $me['put'] = (int)($me['put'] ?? 0) + 1;
    writeJson($uf, $me);
    out(['ok' => true, 'ch' => $chId]);
  }

  if ($op === 'ask') {
    /* поймать одну из кучи. Самая старая чужая достаётся первому пришедшему —
       и уходит из кучи: карточка одна, копий у неё не бывает */
    if (!rateHit('postask', 60)) fail('слишком часто', 429);
    if ((int)($me['got'] ?? 0) >= 2) out(['ok' => true, 'card' => null, 'reason' => 'на сегодня хватит']);
    $files = glob("$dir/pool/*.json") ?: [];
    sort($files);
    foreach ($files as $g) {
      $P = readJson($g);
      if (!is_array($P) || ($P['o'] ?? '') === $id) continue;
      @unlink($g);
      $me['got'] = (int)($me['got'] ?? 0) + 1;
      writeJson($uf, $me);
      /* наружу — карточка и номер цепочки. Метка отправителя остаётся здесь */
      $res = ['ok' => true, 'card' => $P['card'], 'ch' => (string)$P['ch']];
      if (!empty($P['mv'])) $res['mv'] = $P['mv'];    /* партия по переписке (M192) */
      out($res);
    }
    out(['ok' => true, 'card' => null]);
  }

  if ($op === 'in') {
    /* забрать ответы и очистить ящик: одно чтение на стыковку (правило M171) */
    $in = (array)($me['in'] ?? []);
    if ($in) { $me['in'] = []; writeJson($uf, $me); }
    $outL = [];
    foreach ($in as $r) {
      if (is_array($r) && isset($r['card'])) {
        $row = ['ch' => (string)($r['ch'] ?? ''), 'card' => $r['card']];
        if (!empty($r['mv'])) $row['mv'] = $r['mv'];  /* партия по переписке (M192) */
        $outL[] = $row;
      }
    }
    out(['ok' => true, 'in' => $outL]);
  }

  if ($op === 'mute') {
    /* «не принимать» — единственная кнопка про человека во всей затее.
       Цепочка умирает с обоих концов, и тому концу не сообщается ничего:
       его карточки просто перестают доходить, как это и бывает */
    $chId = (string)($b['ch'] ?? '');
    if (!preg_match('/^[a-f0-9]{12}$/', $chId)) fail('цепочки такой нет');
    $cf = "$dir/ch/$chId.json";
    $C  = readJson($cf);
    if (is_array($C) && (($C['a'] ?? '') === $id || ($C['b'] ?? '') === $id)) {
      $C['dead'] = 1; $C['t'] = $now;
      writeJson($cf, $C);
    }
    out(['ok' => true]);
  }

  fail('неизвестная операция почты');
}

fail('неизвестное действие', 404);
