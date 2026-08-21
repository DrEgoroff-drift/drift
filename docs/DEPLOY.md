# Deploying to drift-game.ru

The game is one self-contained file, so "deploying" means copying `drift.html` into the domain's
web root. No build step runs on the server, no dependencies are installed there.

## Where things are

| What | Path |
|---|---|
| host | `ssh.dri7887661.nichost.ru`, user `dri7887661` (shared hosting, Nichost) |
| web root | `~/drift-game.ru/docs/` — served as both `http://drift-game.ru` and `https://drift-game.ru` |
| the game | `docs/index.html` (a copy of `drift.html`), also reachable as `/drift.html` |
| hoster's placeholder | `docs/_hoster-stub.html` — the "Не опубликован" page that was there first, kept so the site can be reverted in one `cp` |
| node on the server | `/usr/bin/node` **v16.18.1**, plus `/usr/bin/passenger`; no `crontab` |

## Publishing a new build

```bash
powershell -ExecutionPolicy Bypass -File build.ps1
scp -o HostKeyAlgorithms=+ssh-rsa drift.html dri7887661@ssh.dri7887661.nichost.ru:drift-game.ru/docs/index.html
```

The host offers only an `ssh-rsa` host key, which current OpenSSH refuses by default — hence
`-o HostKeyAlgorithms=+ssh-rsa` on every `ssh`/`scp` call. Authentication is by password; there is
no key installed for this account yet. Installing one (`ssh-copy-id`, or the hosting panel) would
make deploys non-interactive and is worth doing before automating anything.

To put the placeholder back: `cp _hoster-stub.html index.html` in `docs/`.

## Cloud saves are not running yet

`server.js` is written for a VPS with **Node 18+** and a long-lived process (systemd + nginx, see
its header). This account is shared hosting with Node 16 and Passenger, so the file cannot simply
be started with `node server.js` and left running. Until that is settled the game uses local
saves, exactly as it does when opened from disk — nothing on the page depends on the server.
