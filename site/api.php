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
function rateHit($tag) {
  $ip  = $_SERVER['REMOTE_ADDR'] ?? '0';
  $f   = root() . '/rate/' . $tag . '_' . sha1($ip) . '.json';
  $now = time();
  $r   = readJson($f);
  if (!$r || ($r['t'] ?? 0) < $now - TRY_WIN) $r = ['t' => $now, 'n' => 0];
  $r['n']++;
  writeJson($f, $r);
  return $r['n'] <= TRY_MAX;
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
  if ($old && ($old['ts'] ?? 0) > $ts && empty($b['force'])) {
    out(['ok' => false, 'reason' => 'в облаке запись новее', 'ts' => $old['ts']]);
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
  if (mt_rand(1, 50) === 1)
    foreach (glob("$dir/*.json") as $g) if ($now - (int)@filemtime($g) > 600) @unlink($g);
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
  foreach ([$dir, "$dir/p", "$dir/u"] as $d) if (!is_dir($d)) @mkdir($d, 0700, true);
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

  if ($op === 'put') {
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
    if (mt_rand(1, 50) === 1)
      foreach (glob("$dir/p/*.json") as $g)
        if ($now - (int)@filemtime($g) > 2592000) @unlink($g);
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

fail('неизвестное действие', 404);
