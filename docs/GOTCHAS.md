# Tooling gotchas that cost real time

Each of these cost a session at least once. `CLAUDE.md` keeps the one-line map;
this file keeps the evidence and the fix.

- **A `.ps1` with Russian text MUST be saved UTF-8 *with* BOM.** Windows
  PowerShell 5.1 reads a BOM-less file as the system ANSI codepage and turns
  every Cyrillic literal into mojibake — silently, no error, and the file still
  looks right in an editor. `build.ps1` now flags such files. To fix one:
  `$t=[IO.File]::ReadAllText($p,[Text.Encoding]::UTF8); [IO.File]::WriteAllText($p,$t,(New-Object Text.UTF8Encoding $true))`.
  Files under `src/` are safe — `build.ps1` reads them as UTF-8 explicitly.
- **The build orders `src/` by bytes (`Sort-Ordinal`, 0.359.1), not by `Sort-Object Name`.** The
  culture-aware sort treated `-` as a minor difference and, worse, sorted differently on Windows
  PowerShell and on the ubuntu runner's pwsh: 0.359.0 was green here and dead on the site
  («Cannot access WANDER_CAT before initialization» — the runner glued `12v-wander-shop-cosm`
  before `12v-wander-shop`). Byte order is what `ls` shows in Git Bash: `-` (0x2d) < `.` (0x2e)
  < digits < letters, so `12v-x.js` < `12v.js` < `12va-x.js`. To land *after* an existing module,
  step its letter (`21ba-`, `21bb-`), and check the top-level `const` tables it reads are declared
  earlier in that order. The deploy workflow now opens `tests.html` in headless Chrome and refuses
  to publish on an `Uncaught` — a top-level TDZ stops the whole script and the game shows a title
  screen over a dead loop, which is what «всё упало» looked like.
- **`typeof foo==="function"` around a call you know must exist turns your own typo into silence.**
  It is the right guard for a genuinely optional cross-module call — the pattern the game is full of,
  and it earns its keep there. It is the wrong guard in a stand or a caller that *requires* the
  function: the name is never checked, the `else` branch runs, and the page looks plausible while
  showing something else entirely. `docs/mkview.ps1` had `mgrHire(mgrRoll(…))` — neither function
  exists (they are `hireMgr` and `genMgr`) — wrapped in exactly that guard, so `?s=hqfull` had been
  quietly rendering the **empty** HQ, i.e. the same picture as `?s=hq`, with nothing to compare.
  Two more of the same were introduced the same night (`crewPool`/`crewHire`, `cockpitOn`). To audit
  a file: pull every guarded name and check it against `src/`:
  `grep -o 'typeof [A-Za-z_][A-Za-z0-9_]*==="function"' file | sed 's/typeof //;s/==="function"//' | sort -u`
- **A script parameter shadows a variable of the same name, case-insensitively.**
  `param([switch]$Shots)` plus a later `$shots = Get-ChildItem …` fails with
  "Cannot convert System.Object[] to SwitchParameter".
- **`prof()` cannot say whether a mode is fast — only what a frame does.** It reads the canvas
  with `getImageData` every frame, and after a few readbacks Chrome demotes the canvas to software
  rasterisation: from then on `prof()` measures a CPU raster the player never sees (M319: the home
  interior read 27 ms, then 24–49 ms *with* a full chunk bake in; `?g11` said 60 fps both ways,
  and the bake was reverted). Use it to rank draw functions and to mute one and see the delta;
  for the verdict, `docs/g11.ps1` and nothing else.
- **The test harness has no clock, so no assertion about time means anything there.** `test.ps1`
  runs Chrome with `--virtual-time-budget`, and inside a synchronous block time does not move at
  all: measured 07.09.2026, thirty million square roots between two reads gave `performance.now()`
  0.00 ms and `Date.now()` 0 ms. A suite that asserts «this took under N ms» is not flaky there —
  it is **vacuous**, always true. Worse, production code that paces itself by the clock (a bake
  with a per-frame budget) degenerates in that harness to doing everything at once, so the suite
  exercises a code path no player ever runs. Pace such code by a work cap *as well as* a clock
  (`MAT_CAP` beside `MAT_MS` in `18a-material`), and let the net assert the work, not the time.
  `test.ps1:90` already counted its seconds outside the page for the same reason.
  **Since M441 the game clock is pinned in every suite** (`resetWorld` → `clockSet(TEST_T0)`,
  12:00 10.09.2026 local; `?hour=N` / `test-node.js --hour=N` moves the hour): `now()` moves
  only when the suite moves it (`clockAdvance`, `clockSet`) or a `frameBody` step does. So a
  suite that stamps game state must use `now()`, never `Date.now()`/`performance.now()` — a
  stamp on the real clock is hours away from the pinned one (the helm, HUD and ghost-click
  suites broke exactly that way). `wallMs()` stays the real, frozen-in-a-block clock.
- **Never measure the frame with `--virtual-time-budget`.** It fast-forwards
  timers, so the probe measures the fast-forward. `docs/g11.ps1` runs `?g11`
  correctly; it also leaves the GPU on, because `--disable-gpu` reads ~10 fps in
  every mode and tells you nothing.
- **`docs/pageshot.ps1` does not give an honest narrow width.** Asked for 430×800 it writes a
  430 px PNG, but the page inside is laid out wider and the shot is a crop — the right rail and the
  last pad look cut off when in the real viewport they are not (measured 25.08.2026: rail right
  edge 418 of 430). For anything about the screen's edge — pads, rail, overlap — measure
  `getBoundingClientRect()` in the browser pane at a set viewport, or run `test.ps1 -Mobile`.
  Use `pageshot` for how things *look*, never for whether they *fit*.
- **Long shell one-liners with quotes get mangled.** Write a script to the
  scratchpad and run it instead — a `Remove-Item` once received `"C:\Program`
  as its path. **This includes a long quoted heredoc** (`python - <<'PY' … PY`): a
  hundred-line docs patch with prose in it died with «unexpected EOF while looking for
  matching `'`» before Python ever ran, while a twenty-line one with the same apostrophes
  and backticks passed (2026-09-09) — the cause was not pinned down, so the rule is by
  size, not by content: a short patch inline, anything with paragraphs goes to a `.py` in
  the scratchpad and runs by path.
- **A heredoc through the Bash tool eats backslash escapes.** `<<'EOF'` should pass the
  body through literally, but by the time Python sees it, `\\n` has become `\n` and `\b`
  has become a literal 0x08 byte — which then lands in a source file and is invisible in
  every editor and in `sed` output. Cost a green-looking regex that could never match
  (`/\bон\b/` arrived as `/он/` with control characters around it). When a patch script needs a
  backslash, build it as `chr(92)` instead of typing it, and grep the result for control
  characters before trusting it:
  `any(ord(c)<9 or 10<ord(c)<32 for c in text)`.
- There is **no `node`** on this machine — hence the PowerShell build. Python 3.12 **is**
  there (the older "no python" note was wrong): `python -` with a heredoc is the cheapest
  way to patch a UTF-8 source file. A `.ps1` must be rewritten **with** its BOM
  (`codecs.BOM_UTF8`), or PowerShell 5.1 turns every Cyrillic literal to mojibake.
- `ssh drift` prints a post-quantum key-exchange warning on every connection.
  That is the shared host being old; it is not an error. The louder
  `client_global_hostkeys_prove_confirm` line was silenced with
  `UpdateHostKeys no` in `~/.ssh/config`.
