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
   Отправляем через sendmail самого хостинга: своего почтового ящика заводить
   не нужно, а обратный адрес на своём домене проходит проверку у получателя. */
function sendMail($to, $subj, $text) {
  $from = 'noreply@drift-game.ru';
  $head = "From: =?UTF-8?B?" . base64_encode('Дрейф') . "?= <$from>\r\n"
        . "Reply-To: $from\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: 8bit\r\n"
        . "X-Mailer: drift\r\n";
  $s = "=?UTF-8?B?" . base64_encode($subj) . "?=";
  return @mail($to, $s, $text, $head, "-f$from");
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
    sendMail($user['mail'], 'Дрейф — новый пароль',
      "Кто-то (надеемся, вы) попросил сменить пароль для записи «{$login}».\n\n" .
      "Ссылка на смену — она работает один час и один раз:\n$link\n\n" .
      "Если это были не вы, просто удалите письмо: пока по ссылке не перешли,\n" .
      "старый пароль работает как работал.\n\n— Дрейф, drift-game.ru");
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

/* Почту можно добавить и позже — из игры или с сайта, уже войдя. */
if ($a === 'setmail') {
  $u    = need();
  $b    = body();
  $mail = cleanMail($b['mail'] ?? '');
  if ($mail === null) fail('почта выглядит неправильно');
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

fail('неизвестное действие', 404);
