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
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

That builds `drift.html`, copies it to the site root and then **asks the server which version now
lies there**, warning if it disagrees with `VER` in `src/01-core.js`. `-SkipBuild` publishes the
existing build without rebuilding.

By hand it is one line, because the host lives in `~/.ssh/config` as `drift`:

```bash
scp drift.html drift:drift-game.ru/docs/index.html
```

## Access

Key authentication, no password: `~/.ssh/drift` (ed25519, comment `drift-deploy`, no passphrase —
it is a deploy key) is installed in the account's `~/.ssh/authorized_keys`. The `drift` alias in
`~/.ssh/config` carries the one flag this host needs: it offers only an `ssh-rsa` host key, which
current OpenSSH refuses by default, hence `HostKeyAlgorithms +ssh-rsa`.

Neither the key nor any password lives in this repository. To move the setup to another machine,
copy `~/.ssh/drift*` and the config block; to revoke it, drop the line from `authorized_keys` on
the server.

To put the placeholder back: `cp _hoster-stub.html index.html` in `docs/`.

## Cloud saves are not running yet

`server.js` is written for a VPS with **Node 18+** and a long-lived process (systemd + nginx, see
its header). This account is shared hosting with Node 16 and Passenger, so the file cannot simply
be started with `node server.js` and left running. Until that is settled the game uses local
saves, exactly as it does when opened from disk — nothing on the page depends on the server.
