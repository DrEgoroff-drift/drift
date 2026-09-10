# Tests — the architecture (2026-09-10)

The author, 09.09–10.09.2026: «у тебя там тестов на 4 минуты, зачем они нужны если всё равно
такие баги… перепридумай тесты» → «тесты должны проходить быстро, должны предсказывать, должны
ловить баги, которые есть, но их не заметили, а не только баги, связанные с выкаткой. Тесты
должны заменять ручное тестирование». This file is the answer: the diagnosis, the skeleton every
future check goes into, what the industry does and what of it fits a one-person game, the budget
per tier, and the queue. The live queue lives in `PLAN.md` §«Tests»; this is the reasoning.

## 1. Diagnosis — why 809 suites missed what the author sees

Measured on 0.426.0: 809 suites, ~7 000 assertions, 1.85 MB of tests against 6.9 MB of game.
Node tier 474 suites in 10 s, `-Browser` ~30 s, `-Full` 93 s in six shards (M439). The seven
cross-cutting nets are the right idea and have caught real things (the raster leak, a softlock,
a money printer, a screen trap).

The fifteen bugs the author reported last are of one kind: five about the *meaning* of a
control (dead «+» on the map, the helm layout switching itself, the .55 auto-brake, resolution
never coming back), four about visual *laws* (map type ignoring the UI ruler, the sky sliding
with the sheet, the perch, sharpness), three about *state and economy* (Vega NaN → null, the
counter printing money, drones idle), two about *instruments that lie* («РАКЕТА 0»), one freeze.
Every one is a violation of a law already written in words — in a module header or a
`docs/DESIGN-*.md` — and never written as a check. Structural holes, not forgotten cases:

- **The judge is the state, not the player.** 11 of 200 test files call `drawWorld`, 15 read
  pixels, none looks at a font, two mention `UIK`. «One ruler, and it is the frame» (M221) is
  guarded by nothing.
- **One window.** Everything is measured at 1280×800 where the UI ruler is ~1. 1920, 4K and the
  phone were never measured by default (the lab now runs the phone and the tall window nightly).
- **Nondeterminism.** 114 `Math.random` and 245 `Date.now` in `src/`; the harness overrides
  neither. Frame baselines need wide tolerances; suites flake by the wall clock («план:
  комбинат», and the M391 air suite that went red by the hour on the lab's first night).
- **Assertions that cannot fail.** `ok(true` ×126; `typeof f==="function"` ×119 inside tests
  (a renamed function is a silent green); tiers assigned by name regexes and three string lists.
- **A stopwatch that does not run.** Under `--virtual-time-budget` there is no clock, and there
  is no draw-call counter either; `prof()` only ranks.
- **No tests of the tests.** No known bug has been turned into a mutant the run must kill.
- **Suite selection by hand** (`-Only текст`) while `docs/INDEX.md` gives the symbol→module map
  for free.

The corpus is characterisation written by the same author as the code: it verifies the model's
model of the game, not the player's experience. More suites of the same sort give the same
result. What finds *latent* bugs is an oracle independent of the implementer: a law, the previous
version, a seed distribution, a second window, real players.

## 2. What the industry does, and what of it fits

- **Riot, League of Legends** — ~5 500 tests in 18 min per build; three layers (executor,
  game driver, Python scripts) over RPC endpoints the game exposes; no sleeps, conditional waits;
  a new test sits in staging for a week before it may block; automation finds half the blockers,
  misses are coverage gaps, not bad tests.
- **Rare, Sea of Thieves** — unit, integration on test maps, multiplayer overnight on virtual
  clients, perf; tests gate the commit; QA stops doing regression and looks at the experience.
- **Factorio** — started with the trickiest code, not with coverage; determinism as the main tool:
  a CRC of the whole map every tick, replays until divergence; a daily test release; the server
  blames the breaking commit itself.
- **Bots** — DICE AutoPlayers and The Division (soak and scripted), King (bots that imitate a
  human, −95 % manual level tuning), EA SEED and Ubisoft (imitation / curiosity learning for
  coverage). NetEase «Wuji» studied 1 349 real bugs of four games and derived four oracles:
  crash, stuck, rule violation, imbalance.
- **Pictures** — Unreal Gauntlet and Playwright+pixelmatch: golden screenshots with a perceptual
  threshold, a pinned browser build, and a site where a human flips through *diffs*, not frames.
  Sony Santa Monica TestMonkey: Visual, Smoke, ASAN, Determinism, Gameplay, Integration, plus a
  results site.
- **Indies** — automation for tech, logic and perf; «is it fun» and picture quality stay human;
  feature-bound tests break on every rebuild.

What fits «Дрейф»: the Riot layering (a test API in the page, scripts outside), Factorio's
determinism, Wuji's four oracles plus a picture oracle, golden diffs with a triage page, a
quarantine for new checks, and a results site with history — which the lab now is. What does
not: trained bots (a scripted goal bot and the author's recordings replayed under perturbation
give the same for a day's work), and speed work — 93 s for the full run already beats the
industry; the time goes into coverage now.

Sources: riotgames.com/en/news/automated-testing-league-legends; gamedeveloper.com (Rare, GDC 2019
and «How Rare automates testing», part 4); factorio.com/blog/post/fff-60 and fff-62; GDC Vault
1026308 (Battlefield V bots), 1026382 (The Division), 1028866 (TestMonkey); github.com/
NeteaseFuxiRL/wuji; dev.epicgames.com (Gauntlet); ea.com/seed (imitation learning).

## 3. The skeleton — four layers

Every future check goes into exactly one of these. The rule of place: **a law becomes a
detector** (and at once applies to every scenario); **a player's path becomes a scenario** (and
at once passes through every detector); **a formula becomes a Node suite**. Nothing else becomes
a suite. The existing 809 are frozen: fix reds, extract tools, do not extend.

### 3.1 Tools — written once, then called (`tests/90a-tools.js`, `docs/stand.py`)

Actuators change the world: `go(scene, seed)`, `press(key, frames)`, `tap(label|id)`,
`drag(dx,dy)`, `wheel(n)`, `wait(frames)`, `advance(days)`, `window(w,h)`, `give(credits|cargo|
module)`, `board(station)`, `bot(goal)`. Observers read it: `frame()` (the frame signature),
`state()` (hash and snapshot of `G`), `look()`, `ledger()` (canvas call counts and font sizes per
frame), `text()` (all visible text), `controls()` (every visible control with its name),
`clock()`. Two thirds exist already inside `hands`, `promise`, `look`, `fuzz`, `keys` — extract,
do not rewrite. `docs/stand.py` drives one Chrome over CDP (`--remote-debugging-port`,
`pip install websocket-client`, PIL is present) for windows and screenshots, instead of a process
per frame. This is Riot's executor/driver/scripts split; the page is the RPC endpoint.

### 3.2 Detectors — the five oracles, running after every step of every scenario

1. **Crash** — the frame guard, `window.onerror`, the console. Exists.
2. **Stuck** — no progress toward the goal for N frames; a screen that cannot close; a mode
   whose state object is missing (the silent freeze `keys` describes).
3. **Law** — NaN, undefined, a string where a number was, a field the page did not boot with, a
   field whose type changed between steps; a `Proxy` over `G` in the test tier counting reads of
   fields that do not exist (the cheapest typo catcher there is); *instruments*: every number on
   screen (DOM and `fillText`) checked against the field it must read from, one short table
   («РАКЕТА 0» dies here); *controls*: after an actuator the frame must change beyond the
   world's own motion, by class — W moves along the nose, A turns counter-clockwise, «+» raises
   edge density at the centre — or the game must speak, open a window or change mode; a changed
   field is not an answer (M437); *picture laws*: the `look()` laws plus text legible (contrast
   and size × ruler), layers move by depth on drag, sharpness matches the canvas resolution, an
   idle frame does not flicker, nothing pops in or out in one frame without a mode change, one
   human height in every mode.
4. **Imbalance** — money adds up per deal; fuel, time-to-goal and money as *distributions* over
   a hundred seeds with thresholds; an outlier world is a bug found before a player finds it.
5. **Picture** — a golden frame per scene in three windows, a perceptual threshold (pixelmatch's
   YIQ distance), the same Chrome build, `accept` promotes a new baseline; a human looks only at
   the diff sheet, which the lab publishes.

### 3.3 Scenarios — five lines each, readable by the author

Three sources, every one passing through every detector, in three windows, on several seeds:
**walks** (fifteen from the playtest briefs and `91zzy-walk`: start to hand-over, landing, mine,
fight, home); **recordings** (`?rec=1` in `15-input` records inputs by frame, a «bug here» key
dumps the last thirty seconds; replayed on the same seed and then under perturbation — another
seed, window, hour — which is generalisation without training); **a goal bot** (six goals through
the same keys and taps: reach, sell, land, mine, return, save). The fuzzer stays as the fourth.
The build prints a **coverage map**: mode × gesture × window × detector, a tick where at least
one scenario drove it. Empty cells are the work list; nobody has to guess.

### 3.4 Oracles where the model writes no assertion

The **previous version** from git (same scenario on `HEAD~1` and the working tree; print only
what differs — regressions). **Seed distributions** (outliers). **Three windows** (the state
after a scenario must agree; layout may not change logic). **Live players** (`crashShip` already
sends crashes; add `look()` numbers and frame time once a minute, no text, no names; the lab
shows version × scene over the week). **Static laws in Node in one second**: a function called
by string that does not exist; a `G` field written in code and missing from the `applySave`
whitelist; an id in JS without an element in the markup; a class toggled but never styled; a key
in `15-input` without a line in the title table; `Date.now` inside a draw function; a number
put on screen without formatting.

### 3.5 Determinism in the game, not in the harness

`rnd()` and `now()` in `01-core`; the 114 `Math.random` and 245 `Date.now` migrated by script; a
static law forbids the raw calls. Then the Factorio test: two runs of one scenario on one seed
give the same hash of `G` every hundred frames. Everything else — replays, golden frames, the
cloud save — stands on this, which is why it goes first. Hiding the overrides in the harness
would make the *tests* repeatable and leave the *game* on sand.

### 3.6 Quarantine and history

A new detector or scenario writes to the report, not the verdict, for a week, and is promoted
by its history (Riot's staging). Without history there is no notion of a flake — the lab's page
and `runs.jsonl` are that history now. The deploy of 0.361.0 fell to a flake that had no
staging; so did 0.427.0's first deploy.

## 4. Where things run, and the budget

| where | what | budget |
|---|---|---|
| laptop, every edit | static laws, Node, smoke, scenarios of the changed modules (`-Changed` via `docs/TESTMAP.json` from `INDEX.md`) | ≤ 20 s |
| laptop, before push | browser tier in shards, two windows | ≤ 60 s |
| GitHub Actions, on push | full tier as a six-shard matrix; red does not deploy | 2–3 min wall |
| the lab (server, night) | node, light shards, phone, tall, heavy nets one per Chrome, fuzz on fresh seeds; later: seeds ×100, mutants, previous version, three-window scenarios | ≤ 5 h |
| live site, all week | `log.php` crashes now; `look()` numbers per minute later | free |

The host (`docs/LAB.md`): 768 MB per session, no cron, no daemon — a session is held by
`lab.yml` at night or `lab.ps1` by day. One Chrome at a time; a hung or OOM-killed suite goes
solo automatically.

## 5. Acceptance

One measure, Riot's: **the share of the author's bugs the run found first.** Today 0 of 15.
After the detectors and the mutant zoo, each of the fifteen is reproduced by a mutant and killed
by a detector. After the scenarios, the coverage map has no empty cell by mode. After the lab's
oracles, the first bug found at night or in the players' numbers before any human saw it.

## 6. The queue (mirrored one line each in `PLAN.md`)

- **M441 determinism in the game** — `rnd()`/`now()`, the migration script, the static law, the
  same-hash test over `lookScenes`; harness clock and seed become thin wrappers over them.
  Acceptance: hash equal on all scenes; «план: комбинат» and the M391 air suite need no
  `bNoDir`-style exemptions any more.
- **M442 the test API and the coverage map** — `tests/90a-tools.js` extracted from `hands`,
  `promise`, `look`, `fuzz`, `keys`; `docs/stand.py` over CDP; the harness rules «a suite with
  zero assertions is red», `ok(true` and `typeof`-guards in tests are zero (a names-net over the
  test sources), `suite(name, fn, {tier, win, stage})` replacing the three lists; `?shuffle=seed`.
  Acceptance: stand shoots 17 scenes in 10 s; lists gone; shuffle green twice.
- **M443 the five oracles as detectors** — §3.2, run over `lookScenes` × five gestures first.
  New reds here are real bugs; fix them in their own commits. Acceptance: each of the fifteen
  history bugs is caught by at least one detector (proved in M445).
- **M444 scenarios** — walks, `?rec=1` recordings with perturbation, the goal bot, three windows;
  the coverage map printed by the build; `-Changed` and `docs/TESTMAP.json`. Acceptance: every
  mode in `lookScenes` covered by a walk and by the 1920 window.
- **M445 the mutant zoo and the freeze** — ten mutants from the fifteen bugs (`zoomStep` no-op,
  `mapFont` without `UIK`, `mapSkyShift(d)=d`, W without effect, resolution never returns, a rail
  button without `aria-label`, a manager field off the `applySave` whitelist, a perk without a
  reader, one mode drawing an empty frame, `resetWorld` leaving a field); `test.ps1 -Mutants`
  nightly in the lab; the old 809 frozen. Acceptance: all mutants killed.
- **M446 the lab's oracles** — previous-version diff, seeds ×100 on two scenarios, `look()`
  telemetry from players into `log.php` and the lab page; error auto-close («not seen for three
  sessions»), `lab.py fix <key>`, a `host` class for OOM/timeouts so host limits do not mix with
  game bugs, fuzz timeout 150 s, Chrome memory flags. Acceptance: the first bug found at night
  before a human.
