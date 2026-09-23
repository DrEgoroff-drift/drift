<!-- docs/done/done-24.md — part 24 of 30 of the done work, in the order it was written; see README.md -->

## Stage 0 — THE FRAME FIRST (moved 2026-09-17) (cont.)

СВОБОДЕН») every time; `G.msg` is left exactly as some unrelated system last set it (untouched by
the edge branch) and `"edgeWarned" in G` is `false` — the field is never created any more. Grepped
`src/`, `tests/`, `docs/` for `edgeWarned` afterward: no remaining reference anywhere.

**P5 follow-up — the journal excerpt was dark glass in disguise (2026-09-18).** Control's line-by-
line review of the P5 diff caught what the contrast measurement missed: `.smena .journal` (the
block-quoted log excerpts inside a chapter, e.g. «Сдал 40 ед. Цена 0,82 от справочной...») kept
`color:#c9a05b` on `background:rgba(20,15,9,.3)` — gold text on a near-black plate, unchanged by
the pass that repainted everything around it. It read fine on its own (gold on near-black has
plenty of contrast), which is exactly why the body-text contrast check didn't flag it — the bug
wasn't illegible text, it was a rectangle of the dark glass panel sitting on the cream page, the
same "screen colours on paper" mistake one selector further in.

Repainted to match the journal's own convention for a quoted line (`body.table #loglist
.li.talk span`, `#4a3a24`) and given a light warm tint instead of a dark one —
`background:rgba(120,96,56,.10)`, the same brown used for the sheet's own paper-grain texture
earlier in the file, just at higher opacity, so the excerpt reads as *slightly shaded paper*, not
a hole in it. Verified in the browser: opened chapter 2 (the first with a journal excerpt),
computed contrast against both ends of the sheet gradient (composited with the 10% tint) — 7.86:1
top, 6.59:1 bottom, both comfortably past WCAG AA. Screenshot confirms it by eye.

**P4 follow-up — a chip's ease follows its edge, not a straight line (2026-09-18).** The Designer
froze the ship in a headless probe and stepped the clock by hand, screenshotting `fillRect` calls
frame by frame. Same-edge motion and the fade-on-far-jump both held up exactly as built. But a
short cross-edge move didn't: when the logical slot crossed from one edge to an adjacent one at a
distance under the old fade threshold (half an edge's length), the (x,y) lerp is still a straight
line between two points that don't share an edge, so the drawn chip cut through the middle of the
frame — her probe measured a path from (402,342) to (308,486) sitting at (355,414) on frame 62,
47 px in from the right edge and 93 px above the bottom one, for roughly 0.8 s. A chip hanging in
open space contradicts the entire point of P4: it's supposed to always read as "on the edge."

Two fixes were on the table. The Designer's own suggestion was to ease along the rectangle's
*perimeter* — reparametrize position as a single arc-length coordinate around the loop, so motion
through a corner is two edge-segments joined, never a chord through the middle. Control chose the
simpler rule instead: stop asking "how far" and ask "which edge." A chip's cached place
(`CHIP_POS[key]`) now carries a fourth field, `edge` (0-3 for left/right/top/bottom, read off which
side of `inset` the box is pinned to — `chipEdge(x,y,cw,ch)`); easing along a shared edge is
unchanged, but the fade trigger changed from `dist>edgeLen*.5` to `st.edge!==targetEdge`, so *any*
edge change fades, however short the on-screen distance, and a same-edge move never fades however
far it travels. One phrase covers the whole rule: rides along its edge, blinks between edges.

This is a smaller change than perimeter reparametrization (no arc-length math, no piecewise
inverse to convert back to `x,y` for drawing) and reads as one sentence, which was the deciding
factor — the perimeter version is more precise about *where* a mid-transition chip sits, but this
codebase's own rule already lives with occasional cosmetic overlap during a transition (noted
separately: `placed` uses the logical slot, drawing uses the eased one, so two chips can touch
for an instant — accepted, since the *placement* stays collision-free by construction, only the
transient visual does not, and that is what a stable layout requires in the first place).

Verified in the browser pane: forced a chip's drawn state onto the right edge, then retargeted it
to the bottom edge 285 px away — under the old ~304 px half-edge threshold, so the previous rule
would have kept lerping it straight through the interior — and confirmed `fading` flips true on
the very next frame. A same-edge retarget at a much smaller distance still eases with `fading`
staying false, unchanged from before.

**0.3 follow-up — the cost was per pointer event, not per frame (2026-09-18).** 0.3 closed on a
measurement that held at the time: thirty frames, thirty pointer moves, zero `getBoundingClientRect`
calls. Two things happened since. New code added its own uncached duplicates of the same read
(`fleetPromptRect()` in 12ai-fleet.js, once per visible fleet ship; `helmLift()` in 15b-helm-draw.js,
while the stick is live) — found by wrapping `Element.prototype.getBoundingClientRect` with a
stack-capturing proxy per Control's standing rule ("ask the page for stacks, don't guess"), fixed
by routing both through 08-state's `promptEl()`/`promptRect()` cache (8a3f6ff).

That fix alone didn't close the gap the Tester kept measuring on the S23 (still 6-8 reads/frame
under a finger). His own isolation nailed the actual shape of it: a stick held perfectly still,
fully live, thrust and haze running, cost *nothing* — 100% cadence, zero long frames. Moving it
cost everything, and the cost scaled linearly with how often it moved: 83 events/s gave 82.6%
cadence and 178 long frames in 20s, 17 events/s gave 88.6%. A frame-scoped cache cannot explain a
cost that scales with sub-frame event frequency — the bug had to be *inside* the event handler
itself, firing on every event rather than every frame.

It was. `helmCanvasXY(e)` — called from `pointermove` on every touch move, not once per frame —
calls `cvsRect()` on each invocation. A touch sensor reports at up to 120 Hz against a 60 Hz
render, so a single rendered frame could see two or more of these calls. Individually cheap
(cached) most of the time, but `helmLift()` writes `document.body.style.setProperty("--helmlift",…)`
once a frame whenever the computed lift changes — and a live, moving stick changes it often. A
style write anywhere dirties the browser's own internal layout state for the whole page,
independent of whatever our own JS-level `CVS_RECT`/`PROMPT_RECT` cache thinks; the next
`getBoundingClientRect` call the engine actually executes after that write is a forced synchronous
layout recompute, not a free cache hit, regardless of how many synthetic caching layers sit above
it in `src/`. With multiple such calls firing per frame during active steering, multiple forced
recomputes could stack up inside a single frame's budget.

The fix follows Control's diagnosis exactly: the `pointermove` handler no longer computes or reads
anything — it only records the touch's raw `clientX`/`clientY` onto `HELM.S`/`HELM.P`. A new
`helmSyncPointer()`, called once at the top of `helmTick()` (itself already once-per-frame),
performs the one conversion the frame needs: `helmCanvasXY()` (one `cvsRect()` call), then
`helmDrag()`/`helmTrail()` for a live stick, or the `HELM_TAKE` distance check for a pending press.
However many `pointermove` events arrive between two frames, only the *last* one's coordinates
survive to be processed — earlier ones in the same frame are silently superseded, which is exactly
right: only the final position matters for where the stick actually is when the frame renders.
`helmLift()`'s written value is now rounded (`Math.round`) before the change-comparison too, so a
sub-pixel jitter in the foot's position — which the old unrounded comparison would have treated as
"changed" — can no longer trigger a spurious style write on its own; only a real, whole-pixel
change does.

Manually-constructed `HELM.S`/`HELM.P` objects (the way `tests/91zzzw-helm.js` drives `helmTick()`
directly, bypassing real pointer events) never get a `rawX`/`rawY` field, so `helmSyncPointer()`
correctly leaves them untouched — the test suite's calling convention (already-converted canvas
coordinates) needed no changes, verified green (`test.ps1 -Only штурвал`, 108/7 both before and
after).

Verified structurally in the browser pane (real wall-clock cadence needs the Tester's S23 — the
pane was hidden this session, which pauses `requestAnimationFrame` entirely, `document.hidden`
already guards the game's own loop against exactly this): armed a synthetic touch into a live
stick, then fired 8 synthetic `pointermove` events before each of six manual `helmTick()` calls —
every call produced at most one `getBoundingClientRect` (often zero, cache still warm) and at most
one `--helmlift` style write, never eight. `HELM.lift`/the style value tracked the touch position
correctly throughout (0 → 85 → 0 → 89 → 0 → 99 as the synthetic foot moved on and off the prompt's
rect), confirming the consolidation didn't change *what* gets computed, only *how often*.

**Release blocker closed — the DOM stub, not test order or caching (2026-09-18).** Three plausible
theories chased this in sequence, each testing the wrong layer.

The Tester's first read: an async `MutationObserver` resetting `scrOpen()`'s cache too late for
synchronous, clock-frozen tests. Control's read, after his own code review: the cache was wrong to
exist at all — a class-selector query isn't a layout cost, so drop `SCR_OPEN` and query fresh every
call. Both diagnoses are sound engineering in general and the second is a real, kept improvement
(`scrOpen()` in `08-state.js` no longer caches — a plain `document.querySelector(".scr.open")` per
call, since a selector match costs nothing a forced-layout read does). Neither fixed the failure:
verified by removing the cache alone and re-running the full suite — same four red, unchanged down
to the exact assertion values.

The actual bug lived one layer down, in the Node test harness's DOM stub (`test-node.js`), not in
game code at all. Two compounding mistakes in `qs()`, the stub's `querySelector`/`querySelectorAll`
backing function:

1. Its selector matcher split a compound class selector on EVERY delimiter including `.` itself, so
   `.scr.open` reduced to checking for class `scr` only — `.open` was parsed off and discarded.
   Any element carrying class `scr`, with or without `open`, satisfied `.scr.open`.
2. `document.querySelector`'s fallback — "nothing matched this selector in the markup, fabricate a
   stand-in element and remember it" — exists so modules that grab `.pads`/`.rail` unconditionally
   at load time get an inert element instead of a crashing `null`. It does not distinguish a
   *structural singleton* (exactly one, should always exist) from a *state query* (normally absent,
   and rightly so): `.scr.open` asks "is any screen currently open", and "no" is the common, correct
   answer, not a hole in the markup. Every time nothing was genuinely open, this fallback minted a
   fresh permanent element with classes `scr open` anyway.

Combined, these two bugs made `scrOpen()` return `true` forever after the first call in a process,
regardless of caching, regardless of `resetWorld()`'s existing cleanup line
(`document.querySelectorAll(".scr.open").forEach(e=>e.classList.remove("open"))`) — that cleanup
fired correctly and found real matches under the fixed matcher, but had no way to stop the very next
`scrOpen()` call from fabricating a brand new one. `helmScreenOpen()` in `15a-helm.js` reading
`scrOpen()===true` when nothing was open blocked `G.ctl.head` from ever being set from the cursor —
exactly the four assertions that failed.

Confirmed with a throwaway probe in `helmShip()` (`tests/91zzzw-helm.js`, removed after use):
printed `scrOpen()`, the live count of `.scr` elements, and the live count of `.scr.open` elements
on every call. Before the fix: `openCount` pinned at exactly 1 across dozens of prints, immune to
`resetWorld()`'s cleanup running immediately beforehand — proof the match itself was wrong, not its
timing. After fixing `qs()`'s matcher alone: unchanged, still stuck at `openCount=1` — proof there
were two independent bugs, not one. After also restricting the fabrication fallback to simple
(single `#id` or single `.class`) selectors: `scrOpen()` reads `false` consistently, `scrCount`
stops climbing.

Full suite: `16332` passed with 4 red → `16336` passed, 0 red. The lesson for `test-node.js`
specifically: a DOM stub built to make "the element always exists" true for structural singletons
is the wrong tool for "is anything currently in state X" — those need either a real (if partial)
selector engine or an honest `null`, never an invented match.

**P6 — five loose ends from the interface bug list (2026-09-18).** §1.5, §1.6, §4.4 of the
playtest report, bundled as one milestone; each item stood alone, one commit apiece.

*Hints cut at 411 px (§1.5).* `#prompt`'s phone rule (`src/style.css`, the `@media (max-width:760px)`
block) clamped to `-webkit-line-clamp:2`. Several of the cited strings carry their own line break
already (`cue("ГАЗОВЫЙ ГИГАНТ · ПОСАДКИ НЕТ\nДЕЙСТВИЕ — ЗАХОД ЗА ЛЕТУЧИМИ ГАЗАМИ",CUE_ACT)` in
`17-mode-system.js`, similar composed strings in `21a8-base-world.js` and `21e-surface-draw.js`) —
the clamp counts *visual* lines after wrapping, not the author's `\n` count, so if either half of
a two-line message alone wrapped past one line at a narrow width, the second half vanished behind
`text-overflow:ellipsis`. Raised to 3, matching the sibling `#msg` toast's clamp three rules
earlier in the same file (that element hit the identical problem once, back in M360a, and was
fixed the same way then). Verified in the browser pane at 411×823: all four strings quoted in the
playtest report now render with `scrollHeight === clientHeight` (no clipping) — one of them didn't
even need the third line, it turned out to only need room to *try* wrapping to 3 without being cut
off if it did; a synthetic 15-word forced-long string confirmed the ceiling itself still works
(clamps at 3, doesn't grow unbounded).

*МАСШТАБ under a chip (§1.5).* Already fixed before this session, in 0.448 per the plan's own
note. Confirmed rather than assumed: `#zoomlbl` lives in the top masthead (`.locus`), its
`getBoundingClientRect()` reads y 36–48 in a 411-wide phone frame; the compass chips drawn by
`drawSysHud` never sit above `inset.y0 = 76`. The two can't overlap by construction. Nothing to do.

*The beacon offered and wasted at the ship (§1.6).* `useBeacon()`/`beaconTick()`
(`src/23-mode-dig.js`) had no distance gate at all — the button read "→ КОРАБЛЬ" and, on tap,
teleported the player from wherever they stood straight to `S.shipX`, burning the full cooldown
(38 s at base, less with the tech) even when already standing on the ship's own tile, logging the
self-evidently useless «Маяк: возврат к кораблю с 0 м». Every other "close enough to act" check on
the surface (`21-mode-surface.js`, half a dozen call sites) already uses
`Math.abs(S.x - S.shipX) < shipZoneR()`, a ship-length-scaled radius — reused it here, but *only*
when `G.mode==="surface"`: in `dig`/`cave` mode `S.x`/`S.shipX` describe the surface entry point,
not where the player physically is underground, and being "near the ship" has no meaning down
there — the beacon should always be offered underground, which is its entire point. Verified with
a synthetic `G.surf`: the button is `display:none` standing on the ship on the surface, shown when
far away on the surface, and shown unconditionally in `dig` mode regardless of `S.x`; a direct
`useBeacon()` call while standing on the ship leaves `S.beacon` at 0 (no cooldown spent, confirming
the function-level guard, not just the button's visibility, blocks the no-op case).

*КНИЖКА: «хулк» and «командировочные … за 0 км» (§4.4).* «Хулк» turned out to be deliberate
jargon, not a typo — `12x-suit.js` and `17b-finds.js` both use it as the name for a class of salvaged
gear, consistently. Left alone. «Командировочные … за 0 км» was real: `roadFinish()`
(`27k-road.js`) shows the trip's distance with `.toFixed(1)` in the toast the player sees at the
moment (`tell("money","Дорога: +"+cr+" кр за поездку · "+km.toFixed(1)+" км"...)`) but with
`.toFixed(0)` in the permanent record line two statements later — a short trip that still earned
credit (`cr>0`, since credit accrues from a separate fractional accumulator, `RD.crFrac`, not
directly from displayed km) could round to a literal "0 км" in the book while the toast the player
had just read said something like "0.3 км". Matched the record's precision to the toast's.

*`celDay` column out of order (§4.4).* `celDay()` (`06a-celest.js`) returns an *absolute* sky-day
count since the game's epoch, not a per-record running index, and several systems advance it in
bulk (`11ab-institute.js`, `29f-winter.js`, `29h-spa.js`, `11n-quiet.js`, all `G.t += CEL_DAY*n`).
`renderRecord()` (`11aa-record.js`) labelled its `em` column `"день "+x.d` — the word plus a number
that only grows over a long career. The column itself is hard-capped at 34 px
(`body.table #loglist .li em`, `style.css`) by a real design constraint six pixels further right:
the sheet's own red margin rule sits at `left:48px`, "по нему лист опознают раньше, чем прочтут" —
moving it wasn't an option without disturbing that identity mark. Every sibling page sharing the
same column convention (the journal's `logTime()`, sector coordinates elsewhere) already uses a
bare, compact label rather than a labelled word+number; matched that convention here too — dropped
"день ", kept the bare number, which fits the 34 px column at any digit count this career will
plausibly reach.

`test.ps1`: 16336/16336 across all five, no regressions.


## Moved 2026-09-18 — the closed items of the WORKING PLAN (Stage 0 and 0b), bodies kept verbatim

- [x] **0.1 Cadence** — the world's *ship* steps in whole 1/120 s quanta (`WORLD_SUB`, the loop
  in `updateSystem`), the leftover carried and allowed half a quantum negative, the count by
  `Math.round`. Everything else in `stepWorld` keeps one call a frame with the summed `dt`, which
  also keeps `recTick` at one entry per frame. The first cut stepped the *whole* world n times and
  was a regression on the phone; the tester's numbers and the fix are in `docs/PLAN-archive.md`.
  Emission back at base (6/32 against 6/30); nose-step spread 9.5× → 2.9× → one step almost
  everywhere.

- [x] **0.1b An even tact** — 60 by default, i.e. every second vsync on a 120 Hz phone; 120 only
  while frame work stays under 6 ms **and** the interval of drawn frames sits under 1.2 of the tact
  period, dropping back over 7 ms or 1.5 of the period. The player's cap always wins. A latent bug
  fell out: the stride was `ceil` against a display-period estimate that tracks the *shortest*
  interval, so a jittery 120 Hz asked for every third vsync — 40 fps instead of 60.

- [x] **0.2 Raster** — the wake and the thrust ribbon were a stroke per segment (two for the
  wake: halo and core). They now go in steps of fade per lane, one path per step, the halo and the
  core sharing that path. The step is chosen by the *mean of age and brightness*, 32 steps on the
  wake and 24 on the ribbon: steps even in age banded the bright end (the designer measured a saw
  with a dip every 30 px along the tail), steps even in brightness lumped the whole dim half of a
  lane into one step and left a seam where it began. Quantisation error of the drawn alpha against
  the exact one: ≤ 2.4 % of peak on the wake core, 2.1 % on its halo, 2.3 % on the ribbon — about
  three units of 255 where the designer allows eight. Strokes per frame on a filled wake (1 560
  wake points, 156 trail): 3 391 → 565, paths 3 476 → 458. Each step averages the finished alpha
  and width, not the age. Body in `docs/PLAN-archive.md`. Frame acceptance is the designer's paired
  `straight_cmp` shot; `hud`, `drawHull` and `drawSystem` were left alone (laptop `g11` drifts
  10–20 fps between runs of the same build, so their 6–25 ms/s cannot be told from the noise —
  the S23 is the meter for them).

- [x] **0.2a The haze over the nozzles — the frame's real bill.** The tester found it on the S23
  with one tab and mute-one-function passes: with `exhaustHaze` the game ran 33.5 fps at 67 %
  cadence with 492 frames over 24 ms; **without it, 59.8 fps at 99.6 % with five** — one function
  held the whole Stage 0 gate, and everything done in 0.1–0.4 is worth about 7 fps beside it.
  `heatHaze` drew the canvas into itself up to nine times per nozzle (eighteen on a two-engine
  hull), and each read of the freshly drawn canvas stalls the GPU pipeline. The author's condition
  was to optimise, not to cut («это красиво»), so the look is untouched: the union rect of all
  nozzles is copied **once** into a small offscreen and the strips are drawn from there, with the
  same strip count, the same alpha and the same sine of `G.t`. Self-copies of the main canvas per
  frame: 6 → 0 (one grab into the offscreen instead), strips unchanged. Accept: the tester on the
  S23 (fps ≥ 55, cadence ≥ 95 %) and the designer's paired haze frame.

- [x] **0.3 Layout in the frame** — zero DOM reads per frame and per pointer event, measured:
  `system`, thirty steady frames and thirty pointer moves in flight and on foot, all counters 0
  (before: 5 `getBoundingClientRect` + 5 selector queries **per frame**). The canvas and pad rects
  live in a cache invalidated by `resize()`, orientation, scroll, tab change and a narrow
  MutationObserver; «is a screen open» is a cached flag behind an observer instead of three
  `querySelector(".scr.open")` calls a frame; the floor/band measurement runs only on a dirty
  layout. The counter itself is in the game (`15d-domread`, `?domread`, asleep otherwise) so a
  detector can assert it. Body in `docs/PLAN-archive.md`.
  Follow-up (Tester + Control, 18.09): 0.3 held for STATIC layout reads, but new code since
  (fleet labels, P4's ship/pads guards, the anchor hint) added fresh ones, and the real cost turned
  out to be per-POINTER-EVENT, not per-frame: `helmCanvasXY()` called `cvsRect()` on every
  `pointermove`, and a touch sensor sends those at up to 120 Hz against a 60 Hz frame — a still
  finger was free (100% cadence), moving one wasn't (82.6% at 83 events/s, worse the faster it
  moved). `fleetPromptRect()`/`helmLift()`'s own uncached reads (8a3f6ff) and the pointer handler
  are now both fixed: two dead-cache duplicates route through 08-state's cache, and the pointer
  handler stores raw coordinates only — conversion, `helmDrag`, `helmTrail` and the `--helmlift`
  write all run once per frame (`helmSyncPointer`), not once per event. `helmLift`'s written value
  is now rounded before the change-check too, closing a sub-pixel-jitter path to the same style
  write. Verified structurally (real touchscreen numbers are the Tester's): firing 8 synthetic
  `pointermove` events between two `helmTick()` calls still produces at most one `getBoundingClientRect`
  and one style write, not eight.
  Two follow-ups from code review, both checked by the numbers Control asked for, not assumed.
  Trail length: `helmTrail` samples by distance (push a point once ≥3px from the last one), not by
  a fixed step, so halving the call rate (once/frame vs up to twice) does not halve the trail —
  each call now carries the *whole* frame's movement instead of half of it, so the points are
  farther apart, not fewer. Measured with a synthetic 240px drag at the same real speed: old-style
  (60 sub-frame calls, 4px each) → 7 points spanning 24px; new-style (30 per-frame calls, 8px each)
  → 7 points spanning 48px — *longer*, not shorter, at a fast drag; at a slow one neither style
  pushes fast enough for the difference to matter. The a-priori worry (halve the call rate, halve
  the trail) didn't account for each surviving call also carrying twice the distance. Second: the
  first trail point used to wait one frame after a stick was born (`helmTake()` never pushed one
  itself, in either the old or new code) — `helmSyncPointer()` now pushes it immediately on take,
  zero delay.

- [x] **0.4 Resolution that comes back** — the climb window is 5 s (was 20), the two-climbs-a-session
  cap is gone, and both thresholds are now fractions of the *target* frame rather than fixed
  milliseconds: down above 1.45× (24 ms at sixty, as before), up below 1.05× (17.5 ms, i.e. 57 fps
  — the old 13 ms is unreachable on the phone even at ×1). Dither is held by a penalty, not a cap:
  a climb that survives less than 30 s counts as a mistake and the next attempt waits a minute,
  then two, up to a quarter hour; a climb that lives resets the penalty. The voice speaks of a
  change at most once a minute. A latent bug fell out with it: with the player's 30 fps cap the
  steady 33 ms interval read as a stall and the game kept dropping its own resolution. Checked by
  driving `resAuto` with synthetic intervals: 12 s heavy → ×1, 14 s light → ×2, a climb knocked
  down inside 30 s arms a 60 s wait and then doubles it, steady 18 ms moves nothing, 33 ms under a
  30 fps cap moves nothing. **Not verified:** «`RES_AUTO ≥ 2` held for 10 min» needs the S23.

- [x] **0.5 Sound** — the convolution reverb held about 250 ms of every second on the S23. Its
  cost is linear in the impulse, and the impulse was 5.5 s in stereo (528 000 samples against every
  input sample), while past the third second there is silence under the engine anyway. On a large
  screen the impulse is now 2.2 s at the same decay (211 200 samples, 2.5× less work) and the long
  tail is still written by the feedback delay that already lives on that bus. On a phone
  (`W<=760`) there is **no convolver at all**: the room is two independent short delay loops
  (137 and 211 ms, each with its own lowpass and its own feedback under 1), six nodes instead of
  half a million multiplications. Measured with an analyser on the room's output: the first
  version, with both delays through one shared filter, had a loop gain of 1.1 and **diverged** —
  1.9·10²² a tenth of a second after one click, 3·10²³ after a second and a half. Decoupled, one
  click peaks at 0.11 and decays to 0.003 by 2.4 s. Body in `docs/PLAN-archive.md`.

- [x] **P1 Scroll, globally** (§1.1) — every rebuild of a desk page now goes through one door
  (`keepScroll`, `27i-ui-table`) that remembers the scroll before the rebuild and puts it back
  after, clamped to the new height; and a journal line only rebuilds **the page it touches**
  (`tableShowsLog`/`tableShowsRecord`), instead of rebuilding the desk whatever was open. The
  direct re-renders keep it too: ОПИСЬ (`opisRerender`, 29 call sites), «Смена» when a channel
  opens, the relay list after parking. Measured in the browser at 375×812: reading the middle of
  the notebook at `scrollTop` 3823, a line on the same page, a line on another page and a record
  entry all leave it at 3823, and the other page's line no longer rebuilds this one at all; in
  ОПИСЬ, `scrollTop` 447 survives `opisRerender()` and an unrelated journal line. Caught on the
  way: the scroller is `#tableBody`, not `#loglist` — the first version held the scroll of a node
  that does not scroll, so `keepScroll` now keeps the ancestors as well.

- [x] **P2** ОПИСЬ — an opened card no longer swallows the scroll (§1.2). It carried
  `touch-action:none`, so the card plus its row of actions was about 150 px of dead zone in the
  middle of the list: a finger landing there panned nothing. Vertical pans now go to the browser,
  exactly as on a closed card (`pan-y`), and the lift survives because it waits 380 ms **without
  movement** — more than 14 px cancels it anyway. While an item is actually in hand, panning is
  suppressed across the whole list (`body.op-lift`), so the browser and the drag do not fight. And
  the lift is guarded against a rebuild: `opisRerender()` during a drag only sets a pending flag
  and runs after the drop, because replacing the card's node would drop the pointer capture and
  leave the item hanging as a ghost. Measured in the browser: `touch-action` reads `pan-y` closed,
  `pan-y` open (was `none`), `none` while carrying.
  Live on the S23 (Tester, 17.09): scroll holds 300→300 on open, pan over the open card
  131 px, no dead zone, lift survives an ether line. Two notes handed to the worker: the lift
  is silent when the finger lands on a button inside the card; the item drops after ~24 px.

- [x] **P3** ОПИСЬ tab strip (§1.3) — it took its width from its content, so four words sat in
  277 px of a 396 px cloth with a hundred pixels of emptiness beside them; it now stretches across
  the cloth (`align-self:stretch`, buttons `flex:1 0 auto` — grow, never shrink, so a fifth tab
  would scroll rather than squeeze below the finger rule). At 375 px the strip went 277 → 321 px
  with buttons of 85/79/90/67 and a height of 44; at 430 px, 277 → 368. And it now goes through
  `tabsSync` like the desk's and the station's strips: without that its right-edge fade never
  cleared, so the last tab stayed pale even with nothing left to scroll, and a selected tab could
  sit off the edge. `tail` now reads true with the mask off.
  Live on the S23 (Tester, 17.09): strip 360 of 387 cloth (was 288), ТРЮМ out of the shade, 13/14 px margins.

- [x] **P4** Compass chips stay on the frame's edge (§1.4). The bottom edge itself used to move:
  every stick foot pulled it up, and since a finger is born anywhere in the lower half, the chips
  crawled to mid-screen — where a chip no longer says «the target is out there, past the edge».
  Rule (Control, 17.09): the edge stays the edge, moving inward no more than 12 px beyond its
  normal inset; the stick foot and the live hint line are now *obstacles in the same list as the
  chips*, so a chip dodges them **along** the edge, in both directions from its ideal spot; and if
  the whole edge is taken, it jumps to the neighbouring edge toward the target. Measured in the
  browser at 375×812: clean, three chips sit on the top edge at y = 76 (the inset itself); with a
  blocker on the left of that edge they slide along it (x 104 → 114, 188 → 198) and y stays 76;
  with the whole top edge blocked all three jump to the side edges (y 466–486, x on the left and
  right insets); and with a foot in the middle of the lower half the chips are free to stand at
  y = 556 and 576 — the bottom edge no longer follows the finger. The sweep covers the whole edge
  now: a shorter one left a chip sitting inside a large obstacle instead of jumping.
  Control's review (17.09) asked for three more things, done in the same milestone: the chip's
  own place now *eases* toward its target at up to 200 px/s instead of snapping along its own
  edge, and fades out/in over 0.15 s whenever its edge changes (see the follow-up below — the rule
  moved from "the path is long" to "the edge is different" after a shorter-path bug); the ship's
  own nose is now a taken
  rectangle, so a side-edge chip cannot sit on top of it; and the stick pads at rest (`padsRect`),
  not only their finger-drawn trace, are taken too.
  One more report from the phone (Tester, S23) landed mid-review: the chip order along an edge
  reshuffled from frame to frame even though nothing moved but a stick foot. Chips used to search
  their own free spot independently, so displacing one could flip another to the opposite side of
  it for no reason visible on screen. Fixed by processing chips in one fixed order (nearest target
  first) and having every chip after the first stack flush against the one before it, growing the
  row in a single direction rather than re-searching both ways each frame; only the front chip of
  a row, and a chip whose whole row ran out of edge, still searches both ways from its ideal spot.
  Follow-up (Designer's frame-by-frame headless probe, 18.09): the (x,y) ease above moved in a
  straight line, so a SHORT cross-edge move (target crosses from the right edge to the bottom one,
  say) cut across the frame's interior instead of following the edge — 0.8 s hanging 47-93 px
  inside the frame in her probe, which a phone turn at ×2.4 would trigger constantly. Control's
  fix, simpler than tracking the edge as a path: a chip's cached place now remembers which of the
  four edges it's drawn on; easing only happens when the new slot shares that edge, and ANY edge
  change fades regardless of distance (`dist>edgeLen*.5` replaced by `st.edge!==targetEdge`).
  Verified in the browser: a right-edge chip retargeted to the bottom edge 285 px away (under the
  old half-edge threshold of ~304, so it would NOT have faded before) now fades immediately; a
  same-edge retarget still eases as before.

- [x] **P5** «Смена» text is ink now, not screen-glow (§5.1). `.smena` was written (M353) before
  the desk became paper (M151a) and kept `var(--text)`/`var(--dim)` — colours meant for a dark
  glass panel — on the new cream sheet, giving a body-text contrast of about 1.1:1 (unreadable) and
  no right margin at all (`margin:6px 0 14px 28px`, the `0` is the right side). Both are page
  styling the M151a pass never touched because `.smena` lives in its own stylesheet block, not in
  the `#loglist .li` rules that pass rewrote. Fixed with the same ink already used for the journal
  on the same sheet (`#loglist .li span`'s `#2f2718`, and `#8b7d61`/`#6a5c44` for the scene-break
  mark and italic captions), and a matching 28px right margin. Measured in the browser: body text
  contrast 1.09:1 → 12.06:1 against the sheet's top tone (9.99:1 against the bottom, the gradient's
  darker end); margins now 28px both sides (were 28/0).
  Follow-up (Control's code review, 18.09): `.smena .journal` survived the pass — gold text on a
  near-black `rgba(20,15,9,.3)` plate, the same dark-glass sin one rule up, just hiding inside a
  single selector. Repainted with the journal's own ink (`#4a3a24`, matching `.li.talk span`) and a
  light warm tint (`rgba(120,96,56,.10)`) instead of a dark overlay — contrast 7.86:1 / 6.59:1
  against the sheet's two gradient ends.

- [x] **RELEASE BLOCKER closed: the four «штурвал» failures were a `test-node.js` stub bug, not
  pollution, not caching.** Neither the Tester's async-observer theory nor Control's "0.3 cached the
  wrong thing" theory was it, though both were reasonable reads of the symptom (confirmed by testing
  each: removing the `scrOpen()` cache alone did not fix it). The real bug was in `qs()`, the DOM-stub
  selector matcher: for a compound class selector like `.scr.open`, it checked only the FIRST class
  fragment (`.scr`) and silently ignored the rest — any element with class `scr` matched `.scr.open`
  whether or not it also had `open`. Worse, `document.querySelector`'s "nothing matched, fabricate a
  stand-in" fallback (meant for always-present singletons like `.pads`) fired on `.scr.open` every
  time nothing was genuinely open — which is the normal case — permanently planting a fresh
  `scr open` element after every `resetWorld()` cleanup undid the last one. Confirmed by instrumenting
  `helmShip()` to print `scrOpen()`/element counts: `openCount` stayed pinned at exactly 1 forever,
  immune to `resetWorld()`'s own `classList.remove("open")` cleanup, which fired but matched (and
  fixed) nothing else. Fixed both in `test-node.js`: `qs()`'s matcher now ANDs every class/id/tag
  fragment in a compound selector; the fabrication fallback now only fires for a single simple
  selector (one `#id` or one `.class`), never a compound one — "nothing open" is a real answer, not
  missing markup. `test.ps1`: 16336/16336, was 16332 with 4 red.

- [x] **P6** Five items. Hints cut at 411 px: `#prompt`'s 2-line clamp cut text carrying its own
  line break when either half alone wrapped — raised to 3, matching `#msg`. МАСШТАБ: already fixed
  (0.448), structurally apart from the chips — nothing to do. The beacon: no distance check at all
  — gated on the surface (not dig/cave) by the same `dShip<shipZoneR()` used everywhere else there.
  КНИЖКА: «хулк» is deliberate jargon, left alone; «командировочные … за 0 км» was a precision
  mismatch, toast `.toFixed(1)` vs record `.toFixed(0)` — matched. `celDay` column: hard-capped at
  34 px by the sheet's own margin rule, so shortened the label (`"день "+x.d` → bare number,
  matching sibling pages in the same column) instead of widening. Body in the archive.

- [x] **P7** One voice for the gravity anchor. Control offered a choice — drop the ship-side toast
  or cut it to two words — and dropping it was the cleaner fix: the bottom `cue()` line already
  says the whole thing («ГРАВИТАЦИОННЫЙ ЯКОРЬ · КРАЙ СИСТЕМЫ · КУРС К ЗВЕЗДЕ СВОБОДЕН») every frame
  the ship is past the edge, while the `say()` toast fired once per throttle window with its own
  wording — one event, two voices. Removed the `say()` call and its now-pointless `G.edgeWarned`
  throttle (one field, one read site, both gone) rather than repositioning the toast to the edge:
  the generic `#msg` toast is used by many unrelated events, so moving *it* would have reached far
  past this one bug. With the toast gone, the "text on the edge, not on the ship" and "register it
  in `placed`" parts of the review no longer apply — there is nothing left near the ship to place.
  The "chips must keep a stable order" note was already closed by the P4 order-follow-up above.
  Accepted on the live phone (Designer on the Tester's S23 frame, 18.09): no teal toast at the
  hull, one bottom line about the anchor, the field around the ship clear and the trail not crossed.
  Verified in the browser: crossing the edge now only ever sets `G.prompt` (the bottom line);
  `G.msg`/`G.edgeWarned` are untouched by it.
