# Deploying to drift-game.ru

The site and the game are separate files, which is what lets the front page survive every build:
the game changes on every push, the pages around it almost never, and the backend is its own thing.

| URL | file in repo | what it is |
|---|---|---|
| `/` | `site/index.html` | landing page: pitch, screenshots, the loop, the parrot, sign-in |
| `/mechanics.html` | `site/mechanics.html` | how to play, in plain language |
| `/parrot.html` | `site/parrot.html` | the bird as an installable app |
| `/treplo.html` | built by `build.ps1` | the same bird as one self-contained offline file |
| `/reset.html` | `site/reset.html` | where a password-recovery link lands |
| `/play.html` | `drift.html` (built from `src/`) | the game itself, one self-contained file |
| `/api.php` | `site/api.php` | accounts, cloud saves, password recovery |
| `/drift.webmanifest`, `/drift-sw.js` | `site/` | the game as an installable app: manifest and a network-first cache of `play.html` |

Everything under `site/` is copied to the web root as it stands, so a new page or picture needs no
change to the deploy — only `treplo.html` is generated, by `build.ps1`, because a downloadable
bird has to carry its own stylesheet and code instead of linking to the site's.

## Where things are

| What | Path |
|---|---|
| host | `ssh.dri7887661.nichost.ru`, user `dri7887661` (shared hosting, Nichost) |
| web root | `~/drift-game.ru/docs/` — served as `http://` and `https://drift-game.ru` |
| player data | `~/drift-data/` — **outside** the web root, mode 0700, unreachable over HTTP |
| hoster's placeholder | `docs/_hoster-stub.html`, kept so the site can be reverted in one `cp` |
| PHP | 7.4.33, always on, `password_hash` available |

## Publishing

Every push to `main` that touches `src/`, `site/`, `tests/` or `build.ps1` rebuilds and publishes
by itself — see `.github/workflows/deploy.yml`. It builds with the same `build.ps1` used locally
(ubuntu runners ship PowerShell Core), copies the three files, then asks the live site whether the
version it serves matches `VER` in `src/01-core.js` and fails loudly if it does not.

The workflow needs one repository secret:

| secret | value |
|---|---|
| `DRIFT_SSH_KEY` | the whole of `~/.ssh/drift`, BEGIN and END lines included |

By hand, when waiting for CI is not worth it:

```bash
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

`-SkipBuild` publishes the existing build; `-SiteOnly` pushes just the landing page and the API.

## Access

Key authentication, no password: `~/.ssh/drift` (ed25519, comment `drift-deploy`, no passphrase —
it is a deploy key) is installed in the account's `~/.ssh/authorized_keys`. The `drift` alias in
`~/.ssh/config` carries the one flag this host needs: it offers only an `ssh-rsa` host key, which
current OpenSSH refuses by default, hence `HostKeyAlgorithms +ssh-rsa`.

Neither the key nor any password lives in this repository. To move the setup to another machine,
copy `~/.ssh/drift*` and the config block; to revoke it, drop the line from `authorized_keys` on
the server.

## Why the backend is PHP

Not preference — the host leaves no choice, and the choice it leaves is a good one.

There is no Node application mode here. `/usr/bin/node` exists (v16.18.1) and Passenger 6.0.4 is
installed, but openresty sits in front of Apache and a `.htaccess` carrying `PassengerAppRoot`
answers **500**; `cgi_module` is listed in the panel but switched off, so a Node CGI script 404s.
There is no `crontab` either, so nothing can be kept alive on a timer.

PHP 7.4 is simply on, needs no panel change, and `password_hash`/`password_verify` are exactly the
part that would be dangerous to write by hand. So `site/api.php` is the whole backend: one file,
same origin as the game (no CORS, no second service to keep running), storing everything in
`~/drift-data/`.

`server.js` (VPS + systemd) and `worker.js` (Cloudflare KV) used to hold that place and were
removed when this landed — they never ran, and two competing answers to "where do saves live" is
one too many. They are in the history if a VPS ever happens.

## Accounts and saves

Protocol: `POST /api.php?a=<action>`, JSON in, JSON out. The session token travels in the
`X-Drift-Token` header, not `Authorization`, because shared hosts habitually strip the latter.

| action | needs token | does |
|---|---|---|
| `register` | — | `{login,pass}` → `{ok,token,login}` |
| `login` | — | `{login,pass}` → `{ok,token,login,ts}` |
| `me` | yes | who am I, and how fresh is the cloud save |
| `pull` | yes | the stored snapshot |
| `push` | yes | store a snapshot; refuses to overwrite a **newer** one |
| `logout` | yes | drops that one token |
| `forgot` | — | `{login}` → mails a one-hour, one-use link, if that account left an address. The reply is identical either way, so the form cannot be used to find out who is registered |
| `reset` | — | `{login,key,pass}` → new password; every other device is signed out, which is also how a stolen account is taken back |
| `setmail` | yes | add or change the address afterwards |

Recovery mail goes out over authenticated SMTP to the domain's own mail server, from the real
`noreply@drift-game.ru` mailbox. The host's `sendmail` is not used: the domain's SPF record
authorises only `dc1/dc2.nicmail.ru`, so a message sent from the web server fails the recipient's
check and Gmail drops it silently — which is exactly how the first recovery letters went missing.
Sent through the mailbox instead, the message is DKIM-signed by the mail server and passes.

The mailbox password lives in `~/drift-data/mail.json`, outside the web root and outside this
repository:

```json
{ "host": "smtp.nicmail.ru", "port": 465, "user": "noreply@drift-game.ru", "pass": "…" }
```

Port 465 talks TLS from the first byte; 587 is also supported and switches to TLS with `STARTTLS`.
Without the file the code falls back to `mail()`, so recovery keeps working after a fashion rather
than breaking outright. Every attempt is appended to `~/drift-data/mail.log` with its outcome —
sent, refused (with the server's own words), or skipped because the account has no address. That
log is the first place to look when someone reports a letter that never came.

An address is optional at registration: without one the account simply cannot be recovered. The
form says so and asks for a second click before creating such an account, and the signed-in player
is offered a place to add an address later.

On disk, under `~/drift-data/`: `u/<login>.json` (login, password hash, live token hashes),
`s/<login>.json` (the snapshot as the game writes it), `t/<sha256>.json` (token → login, so
recognising a player costs one file read rather than a scan), `rate/` (login attempts per IP —
twelve per quarter hour).

Nothing reversible is stored: the password is a `password_hash`, and tokens are kept as their
sha256, so a leaked copy of the folder still does not let anyone in.

The client side lives in `src/14-save.js`. It reads the token the landing page left in
`localStorage` on the same origin — nothing is passed between the two pages explicitly. Opened
from disk (`file://`) the game is entirely local and never mentions the cloud. Pushes are silent
and throttled to one per twenty seconds; on boot the game pulls, and adopts the cloud snapshot
only when it is genuinely newer than the local one.

## Rolling back

```bash
ssh drift "cp ~/drift-game.ru/docs/_hoster-stub.html ~/drift-game.ru/docs/index.html"
```

## Compression (added 2026-08-22)

The host has no `mod_deflate` and the openresty in front does not gzip either: `play.html` went
out as 2.1 MB raw. `site/.htaccess` (copied explicitly — `scp -r site/*` skips dotfiles) rewrites
a request for `play.html` to `play.html.gz` when the browser accepts gzip and sets
`Content-Encoding` via `mod_headers`; the `.gz` is produced on the server right after the upload
(`gzip -kf9 play.html`, in both `deploy.yml` and `deploy.ps1`). The workflow prints the
compressed size and warns — does not fail — if it still sees the raw one. `Cache-Control` is a
minute for pages and scripts, a week for images.
