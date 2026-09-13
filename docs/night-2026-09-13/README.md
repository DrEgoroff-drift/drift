# Night of 2026-09-12/13 — the local lab and the Node soak (unread, nothing fixed)

The phone playtest that followed (the author plays on an S23, Claude measures):
[`docs/PLAYTEST-2026-09-13.md`](../PLAYTEST-2026-09-13.md); its measuring scripts are in
`raw/phone-tools/`.

Build under test: `VER 0.447.0`, working tree over HEAD `c09436a`. Session `f7170c30`.
Both jobs ran on the laptop (the server lab is stopped, see `docs/LAB.md`); no network,
no live site. Raw output and both scripts are in `raw/` — the scratchpad copies are ephemeral.

**Both died early, at about the same minute (≈02:25–02:31 MSK):** the lab had a 340-min budget
and ran 126 (no `local-lab-done.txt`), the soak had 480 and ran 155 (no node process left).
Most likely the laptop slept or the session closed — not a crash of either script.

## 1. Node soak (`raw/soak.js`, 6 shards, T.bot under `test-node.js` stubs)

| shard | jumps | docks | mines | ore | exceptions | distinct findings |
|---|---|---|---|---|---|---|
| 0 | 31 878 | 2 760 | 74 | 724 | 0 | 8 |
| 1 | 31 123 | 2 754 | 343 | 3 451 | 0 | 18 |
| 2 | 27 918 | 2 444 | 181 | 1 847 | 0 | 12 |
| 3 | 29 611 | 2 607 | 275 | 2 711 | 0 | 15 |
| 4 | 29 111 | 2 545 | 178 | 1 794 | 0 | 12 |
| 5 | 30 918 | 2 815 | 691 | 6 759 | 0 | 27 |

`systemsVisited` is 20 000 on every shard — a counter cap, not a measurement.

**What it proves:** ~180 k jumps and ~16 k dockings across six sky regions, zero exceptions —
galaxy generation, jumps and docking do not throw.

**What went wrong — the soak idled for 2.5 hours.** About two minutes in, on every shard, a picket
hail (`src/12ar-hail.js:129`, cue «ОКЛИК · ДЕЙСТВИЕ — ПРОХОДОМ · ЦЕЛЬ — ПО ДЕЛУ») took the action
slot, and every later landing failed with «у планеты нет подсказки посадки» — 25–29 k times per
shard. From then on the loop was only jump → dock → fake sell; all mining happened in the first
minutes. In the game the hail clears itself (warning, then `hailAnger` sets `G.hail=null`), so it
should not stick. **Unverified hypothesis:** under the Node stub `worldCovered()`
(`src/08-state.js:257`) reads «a screen is open», so `H.t` never counts down (`12ar-hail.js:126`);
also the bot never answers a hail. Stand gap, probably not a game bug — check before trusting it.
**Counter-evidence (live phone, 13.09 02:47):** on a real S23 a fresh easy start in 0,0 was hailed
by Коммуна within seconds — hails on arrival are common, so the 27 k may simply be «a hail in
nearly every new system + a bot that never answers», with nothing wrong in the stand.

Other soak findings are bot orchestration, not game: «до корабля не дошёл», «до станции N ед.»,
«до залежи не дошёл», and mining next to a landmark (ЗАВОД/ХРАМ/ВРАТА/ОСТОВ…) where ДЕЙСТВИЕ offers
«ОСМОТРЕТЬ» instead of drilling (already known). One odd one: shard 4 got «ПИРАТСКАЯ БАЗА · БАЗА
УРРАТАР» as the landing prompt once.

**Before the next soak:** make the bot answer hails (or clear `G.hail`), check `worldCovered()`
on the stub, count «stuck on one failure» as a stop condition, drop the 20 000 cap.

## 2. Local lab (`raw/local-lab.ps1`, 22 runs, `test.ps1 -NoBuild` in a circle)

Variants: full (`-Full -Jobs 2`), mobile (`+ -Mobile`), tall (`-Size 1440,1440`), fuzz
(`-Fuzz 6000`). Each run had its own `-Shuffle` seed; the six soak processes were running alongside
the whole time (CPU pressure). **All reds are intermittent** — none is red on every run, and every
fuzz run was green. Order-dependent → read them as isolation leaks until proven otherwise.

To reproduce a red: `test.ps1 -NoBuild <variant flags> -Shuffle <seed>` with the seed below.

| finding | runs (variant · seed) | first read |
|---|---|---|
| **Empty tank: gas opens the window with home / tow / reset** — «газ на пустом баке открыл окно» fails; exits come as `tow` only (expected `home,tow,reset`); exception `Cannot read properties of null (reading 'disabled')`; «ДОМОЙ без денег не нажать» | full · 525236, full · 875273 | the loudest group; the null `.disabled` is a missing button — likely a leak of state from a previous suite |
| **Empty tank: hull on the tow rope** — «с корпусом на тросе газ всё равно открывает окно» | tall · 648166, full · 696984, tall · 914293 | same family |
| **R2 empty tank: turning opens the exits window** | mobile · 317401 | same family, phone |
| **Clean start: something hangs over the world** — `parrotwin` 228×242 / 186×198, `hailwin` 360×156; «окно трепла» is `block` | full · 875273, tall · 914293, full · 496733 | leak from an earlier suite (parrot / hail left open) or a real clean-start overlay — check which |
| **Bake: the game re-bakes canvases while standing still** — 81 and 53 canvases in 150 frames | tall · 534259, tall · 914293 | real perf candidate, only on 1440×1440 |
| **Soft raster `perchcv`** — 44×44 on a 54×54 frame (detector «картина», caught in «сцены × пять жестов» and «двенадцать путей») | tall · 310032, tall · 914293 | real picture finding: the parrot perch canvas is probably not multiplied by `UIK` |
| **Frame guard caught «проба сторожа»** from suite «R3c голос экрана» | mobile · 813112, 133809, 484762 | the R3c probe leaks into the cross-cutting net — test artifact, not a game fault |
| **System: tap a marker, a miss keeps the target** — exception `reading 'x'`, «в пустоте у кромки есть фишки (0)» | full · 525236 (first run only) | once; check whether it is still reachable |

Deduplicated list with counts: `raw/local-lab.txt`; every run's full output: `raw/lab-runs/`.
