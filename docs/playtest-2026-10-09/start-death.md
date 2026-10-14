# Start-death playtest (build 0.493.3, local copy 127.0.0.1:8814)

Complaint: "killed right at the start". Question: how fast, by what, what the player sees in the first 60 s.

## Method

- Own tab `tab-2` on http://127.0.0.1:8814/drift.html. Tab `seed` not touched.
- The tab is reported `document.hidden`, so rAF never runs and `G.t` stays 0. Workaround for this test only:
  - `Object.defineProperty(document,'hidden',{get:()=>false})`
  - `CLOCK_PIN=0` (pinned clock, `frameBody(0)` steps one frame per call, 5 s of game time per frame).
  - `say` wrapped to log messages with `G.t`.
- Start: `#startEasy` (easy landing) or `#startHard`. Note: `gpuAfterWarm` defers the start, so the start callback may not run in the same tick as the click.
- localStorage cleared before each run.

## Runs

| # | Start | Game time observed | Hull | Outcome |
|---|-------|-------------------|------|---------|
| 1 | easy | 352 s (idle, ship drifting at 1.1) | 100 -> 100 | no damage |
| 2 | easy | 120 s (idle) | 100 -> 100 | no damage |
| 3 | hard (`startHard`) | 120 s (idle) | 100 -> 100 | no damage |
| 4 | easy, flown at 3 u/s straight at pirate 0 | 150 s | 100 -> 100 | no damage, pirate never `aware` |

Only 4 runs, not the 3 repeats for each mode that was asked for. Run 3 showed a stale-instance problem (see below), so the timings are not clean.

## Numbers from the runs

- Start sector 0:0. Ship at spawn (x 132, y -760), speed 1.1 (drift), `mode` = system.
- NAT_STAND stayed 0 for the whole run. `natSwarmHere()` = false, `natInc("swarm")` = null, `chronOwner(0,0)` = 0 (nobody owns the sector). So no swarm event exists in sector 0:0 at the start. The swarm code in `12az-fx-nat.js` cannot bite there.
- Pirates: 2 at start, distances 2042 and 2937 units, `aware` = false. Their `see` range is 1040, so neither can see the ship.
- Hull never changed in any run. The first message is "Система Нейэль · ткните по объекту — автопилот доведёт". The "РОЙ · НЕ СТОЙТЕ НА МЕСТЕ" line never appeared.

## Why the death the author describes does not show up here

1. Idle start on this seed is safe for at least 352 s. The author's "right at the start" is therefore not an idle-at-0:0 effect in this build.
2. The swarm (`NAT_SWARM` in 12az) needs a chronicle "swarm" event on the sector. None exists at 0:0 for this seed. If the author started on a seed where 0:0 has a swarm, the code path is: stand still, warn at 60 s stand, bite from 300 s, full from 600 s, grace until `10*CEL_DAY` game time. Hard to reach in 60 s. Check whether the grace is tied to game time (`G.t`), not to the stand timer.
3. Flying at pirates: flight at 3 u/s for 150 s did not get the ship within pirate see range (the test loop was short and did not track the distance; this needs a proper rerun).
4. Other hull sinks in system mode: `17-mode-system.js:269` (star heat, 0.9/s inside `sys.radius+30`) and `13-pirates.js` heat. A ship that drifts toward a star dies in ~20 s at full hull. Not checked here, but this is the most likely "dies fast" path for a player who does not know the rules.

## Problems noticed (not start deaths)

- `14a-cloud.js` "other tab" lock: the newly opened tab takes over saving and the old instance shows "ИГРА ОТКРЫТА В ДРУГОЙ ВКЛАДКЕ, запись остановлена". My runs hit this in tab-2, so the saves of those runs are not live. Gameplay still runs.
- `#startEasy` / `#startHard` are deferred by `gpuAfterWarm`: a scripted click does not start the game synchronously, so harness code must wait a frame before reading `G.mode` / `G.t`.

## Suggestions

1. Reproduce the complaint with a real flight: player clicks an object, autopilot flies, and the log should record distance to pirates and star per second. Current harness does not do that.
2. Add a visible "stand still" warning earlier if the swarm can bite at all in the first hour; the current 60 s warn / 300 s bite is fine on paper, so the author's report probably comes from a different hull sink (star heat or a pirate fight after autopilot).
3. Make the other-tab takeover safe for testers: the tester's own tab must not steal saves from the author's session, or should say which tab is live in the first second.
4. Check the star-heat line in `17-mode-system.js:262-270` for a start-time drift path before changing swarm numbers.
