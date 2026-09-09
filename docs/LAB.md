# The lab — tests that run without us

The lab is a long test session on the game's own server. It runs the same `tests.html` the
laptop runs, but for hours instead of seconds, writes what it finds into a deduplicated error
log, and publishes everything at **https://drift-game.ru/lab/**. It never touches the deploy:
`deploy.yml` is the only thing that writes `play.html`, `api.php` and `version.json`; the lab
writes `~/drift-lab/`, `~/drift-data/lab/` and `/lab/` and nothing else.

## What the host is (measured 2026-09-10)

Shared hosting at Nichost, RHEL 8, 64 cores shared with everybody, **500 MB of memory for
the account** (the cgroup says 768 MB; the plan says 500 — the lab is sized for 500), no
`crontab`, no Chrome, Node 16, Python 3.6, `rpm2cpio` present but useless (it cannot read
`/usr/lib/rpm/rpmrc`). Two facts decide the design:

- **Processes die with the ssh session.** `nohup` and `setsid` both got killed at
  disconnect. So the lab is not a daemon: somebody holds an ssh session open and the work runs
  inside it. At night that somebody is `.github/workflows/lab.yml` (up to six hours); by day it
  is `lab.ps1` from the laptop.
- **One Chrome at a time.** Six shards in parallel die without a report; a full shard with
  the heavy suites back to back dies at ~95 s; the same heavy suites alone are green
  («печь» 70 s, «память» 31 s, the fuzzer 22 s). So the heavy suites run one per process,
  memory is sampled every two seconds, and the page shows the peak against the 500 MB line.

Headless Chrome is `chrome-headless-shell` from Chrome for Testing in `~/chrome/`, with the
seven libraries the host lacks (nss, nspr, at-spi2, gbm, xkbcommon) unpacked from Rocky 8
RPMs into `~/chrome/lib` by a small Python extractor — no root needed. Drawing without a GPU
costs about what `--disable-gpu` costs on the laptop.

## What a session does

`lab/lab.sh --budget N` (minutes), under a lock so two sessions cannot overlap:

1. **`node`** — `test-node.js --full`, the formula tier (~18 s on the host).
2. **`light i/6`** — the browser tier in six shards, one Chrome each (~10 s a shard).
3. **`mobile`** and **`tall`** — the same browser tier in a 390×844 and a 1440×1440 window:
   the phone guards and the UI-zoom ceiling that the laptop never runs by default.
4. **`heavy <name>`** — every name in `SLOW_SUITES`, one Chrome per suite.
5. **`fuzz <seed>`** — the rest of the budget: the fuzzer on fresh seeds (`day-of-year × 100 +
   n`, so every night starts elsewhere), until the hunt is exhausted (below).

Before each unit the script checks the budget; after each unit it republishes the page, so
the site shows a session while it runs (a pulsing dot in the header).

## The error log, and why it does not fill up

`lab.py report` parses each report — the `<pre id="testout">` of the page, or node's stdout —
and turns every ✗ line into a key: `sha1(suite | message with numbers replaced by #)`. The
key is the unit of counting, not the line:

- **A known error is counted, not logged.** `errors.json` keeps one record per key: first
  seen, last seen, count, per-version counts, the first detail block, the first eight fuzz
  seeds that hit it. `runs.jsonl` keeps one line per unit run (rotated at 4 000 lines).
- **A heavy suite that went red, gave no report or timed out is not run again in that
  version** (`state.json → skip`). The next version clears the skip. That is the rule
  against hammering one failure for four hours.
- **The fuzz hunt stops itself.** A seed that finds a *new* key resets a streak; a seed that
  only hits known keys advances it; five in a row and the version is marked *exhausted* — more
  seeds would only walk into the same hole. A new version starts a new hunt.
- **A fixed error that comes back is reopened**, with the version it came back in.
- **No report is an error too**, with its own key, so a suite that kills the renderer shows
  up in the same table as a suite that fails.

The human-readable form is `/lab/errors.txt`: one block per open error, newest last-seen
first, with the detail lines. That file is what the next fixing session reads.

## The page

`site/lab.html`, served at `/lab/` from `~/drift-game.ru/docs/lab/` together with
`data.json` and `errors.txt`. It draws three canvases in the site's palette — sessions as
stacked bars with new-error ticks, the eight slowest heavy suites as lines over sessions,
memory peaks as dots against the 500 MB line — then the error table (click a row for the
detail, filter by unit kind or by «за сутки»), the fuzz hunt per version, and the last sixty
runs. Nothing is fetched but `/lab/data.json`; the page has no build step.

## Running it

```bash
powershell -ExecutionPolicy Bypass -File lab.ps1 -Budget 15 -Quick    # node + light shards, from the laptop
powershell -ExecutionPolicy Bypass -File lab.ps1                       # a full four-hour session
powershell -ExecutionPolicy Bypass -File lab.ps1 -Upload               # fresh build + page only
ssh drift "python3 drift-lab/lab.py publish"                           # rebuild data.json by hand
ssh drift "cat drift-game.ru/docs/lab/errors.txt"                      # the log
```

The nightly run is `lab.yml`: 02:00 Moscow, budget 300 minutes, `workflow_dispatch` with a
budget and a `quick` switch for a manual start. It uses the same `DRIFT_SSH_KEY` as the
deploy and nothing else from it.

## What it is not (yet)

It runs the suites that exist. The nets of PLAN §«tests» — determinism, the test API, the
five oracles, scenarios, mutants — are the next milestones and will run here when they exist;
the lab is the place, not the content. Until then its value is three things the laptop never
does: the phone and tall windows every night, the heavy nets every night, and a fuzz hunt on
new seeds every night.
