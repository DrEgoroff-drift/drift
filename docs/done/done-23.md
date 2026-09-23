<!-- docs/done/done-23.md — part 23 of 30 of the done work, in the order it was written; see README.md -->

## Stage 0 — THE FRAME FIRST (moved 2026-09-17)

**0.1 Cadence.** Frame intervals scattered over 1–3 vsyncs (4.17 ms bins: 313/503/496/235/168…,
long and short alternating) while the camera itself was steady (p95 1.8 px) — the judder was the
world, not the view: `frameBody` (`28-loop`) stepped it by the raw rAF `dt`, so the nose turned
0.08 rad on a short frame and 0.16 on a long one (160 jumps > 4.6° a minute on manual helm).
Fix: `QUANT_MS = 1000/120`, an accumulator (`quantAcc`) that carries the leftover, and
`stepWorld` called n times with the identical `QUANT_DT` step. What is deliberately *not*
quantised: sound, the interface `*Tick` chain and autosave run once per frame with the summed
`dt` — they never juddered, and a second call of that chain costs real milliseconds on a phone.
A frame worth zero quanta returns before drawing (the picture would be identical, the raster
full price); a gap longer than six quanta is not chased at all, because catching up costs a
frame and the spiral does not end. The pinned-clock path (tests, `clockPinned()`) keeps its
single `dt=1` step, so replay and same-hash suites are untouched.

**0.2 Raster.** GPU raster was the bottleneck (`DoEndRasterCHROMIUM` p90 5.4 ms, max 17) and
`drawWake` owned the JS too (31–56 ms/s on the S23). The reason was one stroke per segment: a
cruising wake holds up to 2 000 points in nine lanes, each segment stroked twice (halo, core), so
a frame issued about 3 400 strokes. Brightness and width change *slowly* along a lane — the whole
difference inside one eighth of a life is half a pixel of width and a couple of units of alpha —
so segments are now collected into eight steps by age and each step is a single path; `stroke()`
does not clear the path, so the halo and the core reuse it. The thrust ribbon (`drawTrail`) got
the same treatment in eight steps, which also stopped `mixc` allocating a colour per segment.
Each step averages the *finished* alpha and width rather than the age: alpha is a quartic of age,
so the alpha of a mean age was a third dimmer than the mean alpha at the bright end, and the
white-hot root at the nozzle visibly lost its peak (caught on the side-by-side shot, fixed before
the commit). Geometry goes into module-level flat arrays that grow once, which also removes two
`rgba` strings and two mid-point arrays per segment from the frame's allocation load (item 0.6).
Measured by counting canvas calls, not by the clock: `docs/shot.py system` with a filled wake,
`ctx.stroke`/`beginPath` wrapped — 3 391 → 245 strokes and 3 476 → 287 paths per frame, wake and
trail populations identical. `g11` on this laptop could not judge it: repeat runs of the *same*
build read 24–37 fps on `surface` and 33–58 on `belt`, so a control build of the previous commit
was measured back to back and read the same as the new one.

**0.3 Layout in the frame.** The S23 trace showed `getBoundingClientRect` 10–15 ms/s,
`querySelectorAll` 4–5 ms/s and 2 096 `UpdateLayoutTree` (937 ms), with the finger doubling
style+layout from 27 to 52 ms/s — because the reads sat in `hud()` and in the pointer handlers,
which under a finger fire 120 times a second. A rect read after any style write forces the
browser to recompute layout there and then; that, not the call, is the bill.

What was done. `08-state` gained `cvsRect()`/`padsRect()` (cached rects), `scrOpen()` (cached
«a screen is open») and `rectsDirty()`; invalidation comes from `resize()`, `orientationchange`,
capture-phase `scroll`, `visibilitychange` and two MutationObservers. The observers are split on
purpose: classes and added nodes are watched over the whole body (that is how a screen opening is
noticed), but the `style` attribute only on the six nodes that actually set the floor, rail and
top band (`#prompt`, `#console`, `.pads`, `.rail`, `.vitals`, `.locus`). The first version watched
`style` across the body and was no better than no cache at all: the fuel bar writes its own width
every frame, so the layout was dirty every frame. `hudFloorMeasure()` now runs only on a dirty
layout and took the top-band measurement (`--hudband`) in with it; `padsFit()` forces it. The last
five per-frame reads were found by wrapping the DOM methods and printing the stack, not by
reading code: `cbtn.querySelector("s")`, rects on `.vitals`/`.locus`, `[data-k=act]` and the four
`.pads` buttons — all now looked up once and kept.

The meter is in the game: `15d-domread` wraps `getBoundingClientRect`, `getClientRects`,
`getComputedStyle` and the four `querySelector*` and counts them in three buckets, asleep unless
`?domread` or `domReadWatch(true)`; `domReadZero()`/`domReadCount()` are what a detector should
assert around a frame. Measured with `docs/shot.py system`: before 5 rect + 5 selector calls per
frame; after, thirty steady frames give 0/0/0, and thirty pointer moves give 0/0/0 both in flight
and on foot. Warm-up frames still measure once — that is the point of the flag, not a leak.
Gotcha found on the way: a probe must call `frameBody()`, never `frame()`, because every `frame()`
schedules another rAF and under `--virtual-time-budget` the page then never drains (the shot hung
at 120 s twice before this was understood).

**0.4 Resolution that comes back.** On the S23 `resAuto` fell to `RES_AUTO=1` (411×742, a seventh
of the pixels) and stayed there for good. Three reasons, all three fixed: the climb threshold of
13 ms is unreachable on a phone even at ×1 (the cheapest raster there still costs about twenty
milliseconds); twenty consecutive seconds of a light frame never happen in play, because in twenty
seconds the player turns and one heavy frame zeroes the count; and `resUps<2` means «never again»
in a long session. Now: thresholds are fractions of the target frame (`resTarget()` — 60 Hz, or
the player's own frame cap when lower), down above 1.45× and up below 1.05×, so the descent keeps
its old 24 ms at sixty hertz while the climb relaxes from 13 to 17.5 ms; the climb window is 5 s;
the cap on climbs is gone. Dither is held by a penalty instead: a climb that survives less than
`RES_HOLD_MS` (30 s) is treated as a mistake, the next attempt waits `RES_WAIT0` (60 s) and the
wait doubles up to a quarter of an hour, while a climb that lives past 30 s clears the penalty. So
an expensive scene takes the sharpness once instead of for the evening, and a pendulum every eight
seconds cannot happen. After any change the EMA is set to the neutral 1.25× and a 1.5 s grace runs,
so neither direction starts primed. The voice announces a change at most once a minute — the change
itself is visible, and a line over the world in every scene would be worse than the softness.
Tying the thresholds to the target frame also fixed a bug nobody had reported: with the player's
30 fps cap the steady 33 ms interval sat above the fixed 24 ms threshold, so the game read its own
frame cap as a stall and kept lowering the resolution. Checked by feeding `resAuto` synthetic
intervals in the page (12 s at 40 ms → ×1; 14 s at 10 ms → ×2; climb, knock it down inside 30 s,
see a 60 s wait and the next penalty at 120 s, then a climb after the wait; 40 s of steady 18 ms
moves nothing; 30 s of 33 ms under a 30 fps cap moves nothing). The accept line of the item —
`RES_AUTO ≥ 2` held for ten minutes — is a phone measurement and is still open.

**0.1 fixes (2026-09-17).** The first cut of 0.1 called the whole `stepWorld` n times a frame.
On the author's S23 that was a regression, not an improvement: `stepWorld` went from 0.71 ms a
frame to 9.77 (c70a745) and 14.68 (f350b0f), `WAKE` from 492 points to 1938, cadence from 68 % to
50–63 %, and `RES_AUTO` fell to 1 within thirty seconds. The mechanism is a spiral: emitters seed
one point *per call*, so two calls a frame double the particles, the raster grows, the frame gets
longer, a longer frame buys more quanta, and round it goes. On the laptop all of this hid inside
the measurement noise (0.67 → 2.9 ms) — which is why the verdict on a frame now comes from the
phone. What the phone also showed is that the idea was right where it was aimed: the spread of the
nose step per frame fell from 9.5× to 2.9×.

So the quantum now wraps *only* the ship's integration — helm, speed, the velocity-toward-nose
easing, the gravitational anchor's turn, position — inside `updateSystem`, driven by `WORLD_SUB`
(declared in `08-state`, set by `frameBody` for the duration of one `stepWorld` call). Everything
else keeps its single call with the summed `dt`, which also puts `recTick` back to one entry per
frame, so `15c-rec` recordings and replays keep their shape. Two more corrections from the review:
the step count is `Math.round` and the carried remainder may go down to half a quantum negative
(with `floor`, a 120 Hz interval jittering around 8.33 ms alternated 0 and 2 steps — the same
judder moved from the frame into the world), and the early return for a frame worth no quantum now
clears `FRAME_IN` itself, because `frameBody` is also called from stands and probes where nobody
clears it after.

Measured: the six-frame emission probe (`shot.py system --js "keys.thrust=true;keys.left=true"`,
`WAKE.length/TRAIL.length`) reads 6/32 against 6/30 on `main` and 60/74 before the fix; the step
histogram over 2 400 frames at 120 Hz with ±1 ms jitter is one step in 92.6 % of frames, zero in
3.7 %, two in 3.7 %, and at 60 Hz with ±2 ms jitter two steps in 90.2 %. The remaining unevenness
is what an integer number of quanta per frame costs; the even-tact item (0.1b) removes the reason
for it by aiming at every second vsync instead of every one.

Also in this commit, from the designer's verdict on 0.4: the resolution's climb is **silent** (the
picture getting better is the message; a toast about a thing the player never touched is noise),
and the descent speaks once a session rather than once a minute — under the new penalty a
descent-climb-descent would otherwise put three toasts on screen inside two minutes of steering.

**0.2 fix — where the step of fade belongs (2026-09-17).** The first cut put the steps at even
intervals of *age*. Alpha is a quartic of age, so that packed the bright end of a lane into a few
huge brightness jumps and spread the dim end over almost none: on a straight run the designer read
the ribbon as tiles, with a dip every 30 px along the tail, and the far end held brighter than on
`main` (the mean over a wide age bucket is above the brightness of the tail itself). The obvious
correction — even intervals of *brightness* — is wrong the other way: alpha at the dim end changes
so slowly that the lowest bucket swallowed everything below about half the life, which flattened
the tail and put a visible seam where that bucket began (the one the designer caught at 110 px).
What works is the mean of the two: the bucket key is `(u + alpha/alphaPeak)/2`, so neither age nor
brightness can step more than twice the bucket width, with 32 steps on the wake and 24 on the
ribbon. Empty buckets cost nothing, so a short ribbon lane ends up nearly one step per segment,
exactly as `main` drew it.

Measured, and not by the picture: the drawn alpha against the exact alpha per segment, over 240
frames of straight thrust — max error 0.0133 absolute (2.4 % of peak) on the wake core, 0.0038
(2.1 %) on the halo, 0.0182 (2.3 %) on the ribbon. The ribbon's peak reads about 120 of 255, so
that is roughly three units against the designer's tolerance of eight. Strokes per frame 3 391 →
565 and paths 3 476 → 458 (the 8-step version was 245 strokes — the smoothness costs about 320
strokes a frame and is worth it). A note on measurement: a profile of the second-brightest pixel
per column, sampled every 10 px behind the stern, does **not** judge this — it oscillates with a
30 px period on `main` too, because it samples three thin threads at sub-pixel positions. The
paired frames of the two builds look identical at ×0.5, and the verdict on the look stays with the
designer's own narrow-screen shot.

**0.1b An even tact (2026-09-17).** The author, after two passes: «на тел дергается все прогоны,
плавный полет нужен». The phone's screen is 120 Hz, which asks the whole frame to fit in 8.3 ms;
it does not, so frames arrive at 16.7 or 33.3 ms, and that swing is what the eye reads as judder.
Sixty even frames are smoother than seventy-five ragged ones, so the game now sets its own tact:
`tactHz` 60 by default — every second vsync on a 120 Hz display — promoted to 120 only while the
EMA of frame *work* (`FRAME_JS`, drawn frames only, skipped ones cost pennies and would drag the
estimate down) stays under 6 ms for five seconds, and dropped back when it passes 7 ms for a
second. Between 6 and 7 is the dead band that keeps the tact itself from dithering, the same shape
as the resolution's in 0.4. The player's own frame cap is never raised by this.

The measurement earned its keep twice. First it showed the tact working (an expensive frame on a
120 Hz display draws 300 of 600 and holds 60; a cheap one promotes after five seconds; an expensive
one again drops back inside a second; a 30 fps cap takes every fourth vsync). Then, tracing the
interval and the quantum count of every drawn frame, it showed the tact overshooting: intervals of
24–27 ms instead of 16.7, three quanta instead of two. The cause is the pair of `ceil` and the
display-period estimate: that estimate deliberately tracks the *shortest* recent interval, so with
jitter it slides below the true period (7.6 ms against 8.33), and `ceil` then asks for every third
vsync — 40 fps. A cap is a promise and keeps rounding up; a tact is an aim and now rounds to the
nearest, and the two strides are combined by taking the larger, because a cap may not be exceeded.
After the fix every drawn frame is 15–18 ms apart and worth exactly two quanta, 2 steps in 89 % of
frames under a synthetic ±1 ms vsync jitter (which is harsher than the real one).

**0.2a The haze over the nozzles (2026-09-17).** The author kept saying the ship judders in every
mode, and he named the place himself: «не от хвоста, а от огня двигателя и марева». The tester
confirmed it on a real S23 with a single tab, muting one draw function at a time over 20 s of
steering: with the haze, 33.5 fps / 67 % cadence / 492 frames over 24 ms and `RES_AUTO` sliding
2 → 1; without the haze, 59.8 fps / 99.6 % / five such frames and the resolution holding. Muting
the flame, the wake or the trail changed almost nothing by comparison. So one function held the
whole Stage 0 gate, and the cadence and raster work of 0.1–0.4 is worth about 7 fps beside it.

Why it cost that much: `heatHaze` sliced the rect behind each nozzle into up to nine strips and
drew each strip with `ctx.drawImage(cvs, …)` — the canvas into itself. Every such read of the
canvas Chrome has just drawn into forces the raster to finish and the frame to land in memory
first; nine times per nozzle, eighteen on a two-engine hull. On a laptop this hides in the noise;
on a phone it is a third of the frame.

The author's condition was to optimise, not to cut, so nothing about the look changed: the union
rectangle of all nozzles is grabbed **once** per frame into a small offscreen (`hazeGrab`, growing
canvas, `globalCompositeOperation="copy"`, no per-frame allocation), and every nozzle's strips are
then blitted out of that offscreen (`heatHazeFrom`) with the same strip count, alpha and sine
phase. `heatHaze` stays as a one-rect wrapper for any other caller. One consequence is arguably an
improvement: the strips now read the *untouched* frame instead of one another's output, so a
second nozzle no longer distorts the first nozzle's distortion.

Measured by counting `ctx.drawImage` calls whose source is the canvas itself, one frame under
thrust: 6 → 0, with the single grab going into the offscreen instead and the number of strips
unchanged (six). A whole-frame pixel diff between the two builds is *not* a valid check here and
was discarded: the two runs drift apart in world state (the ship sits a few pixels off) and the
starfield is regenerated per load, so 2 % of pixels differ over the whole frame, corners included.
The paired-frame verdict belongs to the designer's own method.

**Determinism of the ship's path after the quantum (checked 2026-09-17).** The designer saw 240
straight `stepWorld(1)` calls end on a different heading than on `main`, and that would move every
same-hash suite and every replay. Checked with `stateHash()` and the ship's own numbers rather
than by eye: with `WORLD_SUB=1` our build gives exactly `main`'s figures (heading −2.83681,
x 92.4268, y −382.5588, vx −5.48957, vy −5.81933 — every printed digit), because `sdt = dt/1` is
`dt` and the order of operations inside the loop is unchanged. One run in four drifts by about
3·10⁻² in x, and it drifts on repeated runs of *one* build too, so that is the harness, not the
code: `docs/shot.py` runs the scene on the real clock and `stateHash` here includes parts that
move between loads. In play, where a frame is worth two or three quanta, the path does differ from
`main` slightly — that is what quantising means — but every suite and replay runs on the pinned
clock, where `frameBody` takes its single-step branch and `WORLD_SUB` stays 1, so the hash corpus
is untouched.

**The compass chip that «went missing».** A chip is drawn only when its target is *off* screen
(`if(x>-20&&x<W+20&&y>-20&&y<H+20)continue;` in `drawSystem`), so a probe that ends with the star
inside the frame legitimately shows no «ЗВЕЗДА» chip. Not a defect — a different ship position.
Found while checking it, though: `drawSystem` read `#prompt`'s rectangle *in the frame* whenever
the hint line had text, so the chips would not overlap it. The 0.3 measurement missed it because
the probe's scene had no hint text. It now goes through a cached `promptRect()` (and a cached
element), invalidated with the rest.

**0.5 Sound (2026-09-17).** The phone trace named «Reverb convolution background» at roughly
250 ms of every second — a quarter of a core for one echo. Convolution costs in proportion to the
impulse, and `makeIR(c,5.5,2.4)` built a 5.5-second stereo impulse: about 528 000 samples weighed
against every input sample, while past the third second the tail is under the engine noise and
nobody can hear it. On a large screen the impulse is now 2.2 s with the same decay curve (211 200
samples, two and a half times less work); the long wash is not lost, because the feedback delay on
the same bus (0.66 s at 0.44 through a lowpass) already writes a tail of several seconds.

On a phone (`W<=760`) the convolver is gone altogether. The room is built from two *independent*
delay loops — 137 ms and 211 ms, incommensurable so the pattern does not beat — each with its own
lowpass and its own feedback gain below one, both summed into one wet mix: six nodes instead of
half a million multiplications per sample. It is not the same hall down to the sample, but it is
the same diffuse tail without rhythm, and on a phone speaker the difference drowns in the first
engine noise.

The first version of that room was **broken in a way no screenshot would show**: both delays fed
back through one shared lowpass, so the loops coupled and the round-trip gain became .58 + .52 —
above unity. An analyser on the room's output, with the music layers muted and a single 20 ms
click sent in, read 1.9·10²² a tenth of a second later and 3·10²³ after a second and a half: a
howling runaway into the compressor for the rest of the session. Giving each loop its own filter
fixed it; the same measurement then reads a peak of 0.11 around 0.9 s and 0.003 by 2.4 s. Method
worth keeping: the browser pane, `initAudio()`/`musicInit()`, an `AnalyserNode` on the wet output
and `setInterval` writing the tail into an array — `docs/shot.py --eval` cannot do it, because
rendering audio is asynchronous and its `--eval` runs in the same tick.

**0.6 GC — what was hoisted, and why the number is missing (2026-09-17).** The phone trace showed
major collections of 14–28 ms inside the longest frame gaps, so the frame was asked to stop making
garbage. Three sources were removed. First and largest: the instruments. `setSt`/`setTx` refuse to
write an unchanged value, which reads as frugal, but the *string* was glued before the comparison —
`clamp(fr*100,0,100).toFixed(1)+"%"` and `Math.round(G.fuel)+"/"+Math.round(st.fuelMax)` for every
gauge, every frame, sixty times a second on a full tank with nothing to report. The comparison now
happens on numbers (`setPct`, `setPair`, the `HUD_NUM` table) at the same granularity the display
has — tenths of a percent for a bar, whole units for a label — and a string is created only when
it is about to be shown. Second: `toUpperCase()` for the compass chips ran per frame per chip; the
uppercase name is now memoised on the body as `_up`, which is safe because `stateHash` skips keys
beginning with an underscore and the objects it lives on are regenerated from the seed anyway.
Third, already landed in 0.2: two `rgba` strings and two mid-point arrays per wake segment.

No local number, deliberately. `performance.memory.usedJSHeapSize` is frozen in this build — 900
frames of steering report a zero heap delta and zero GC drops, so it cannot even see the garbage
that certainly exists; and the allocating helpers (`mixc`, `rgba`, `hex2rgb`) are `const`, so they
cannot be wrapped with counters from a probe. The honest meter is the allocation sampler in the
phone trace, which is the tester's instrument, so the item stays open until his before/after on GC
pauses arrives.

**P1 Scroll, globally (2026-09-17).** The author's rule from the phone playtest is that no screen
may lose its scroll, and the desk lost it 448 times in one session. Two separate causes. The
pages rebuild themselves whole (`textContent=""`), and a journal line can arrive at any moment —
so a reader halfway down the notebook was thrown to the top. And `logAdd`/`recordAdd` rebuilt the
**entire** desk regardless of which thing was open: a line about a drone in one notebook rebuilt
ОПИСЬ under the reader's finger.

Both are fixed at the single door. `keepScroll(el,paint)` in `27i-ui-table` remembers the scroll
of the element *and its scrolling ancestors*, runs the rebuild, then restores each one clamped to
the new height; `tableRender` is now a thin wrapper that calls the old body through it, so every
page — journal, ОПИСЬ, strips, things, album, «Смена», relays, record — is covered by one change.
The three direct re-renders that bypass `tableRender` (`opisRerender` with its 29 call sites,
«Смена» opening a channel, the relay list after parking) call `keepScroll` themselves. And the
journal only re-renders the page its line belongs to (`tableShowsLog()` for ether/bort/folk,
`tableShowsRecord()` for the report) — otherwise nothing is rebuilt at all.

Two things the measurement taught, both invisible in code review. First, the scrolling element is
`#tableBody`, not `#loglist`: the list has `overflow:auto` but its `scrollHeight` equals its
`clientHeight`, so the first version dutifully preserved the scroll of a node that never scrolls.
Walking up the ancestors fixed it. Second, and worse: the previous commit shipped a build that
**crashed at load** — `resize()` runs at the bottom of `08-state`, my `rectsDirty()` called
`hudNumDirty()`, and `HUD_NUM` was a `const` in the later `27z-telemetry`, so the whole game died
with «Cannot access 'HUD_NUM' before initialization». The guard `typeof hudNumDirty==="function"`
passed, because a function declaration hoists while the `const` it touches does not. The table now
lives in `08-state` above `rectsDirty`. The lesson is the cheap one: **look at the console right
after the build, not before the push** — the browser pane showed it in one call.
Measured after the fix, at 375×812: `scrollTop` 3823 in the notebook survives a same-page line, an
other-page line and a record entry; ОПИСЬ keeps 447 through `opisRerender()` and an unrelated
journal line.

**P2 ОПИСЬ — the opened card's dead zone (2026-09-17).** `.opis .op-card.on` set
`touch-action:none`, which is the right thing for a node you drag and the wrong thing for a node
that fills the middle of a scrolling list: the opened card with its row of actions is about 150 px
tall, and a finger that started there panned nothing at all (phone playtest, §1.2). The card is
now `pan-y`, the same as when closed, so vertical pans belong to the browser. The lift does not
suffer, because it is a long press: 380 ms with the finger still, and more than 14 px of movement
cancels it — so a pan and a lift can never both be meant. Once an item is genuinely in hand,
`body.op-lift` sets `touch-action:none` across the list, so the drag is not fought by the
scroller.

One more thing the drag needed: `opisRerender()` is called from 29 places, and any of them firing
mid-drag replaced the card's DOM node — the node holding the pointer capture — after which finger
movement arrived nowhere and the item hung as a ghost until a tap into empty space. During a drag
the rebuild now only raises `OPIS.rerenderPending`, and `opisDropEnd()` runs it once the item is
put down. Verified in the browser pane: `touch-action` is `pan-y` closed, `pan-y` open (it was
`none`), `none` while carrying; a rebuild during a fake drag defers and then happens.

**P3 ОПИСЬ tab strip (2026-09-17).** Two defects in one strip. It was built as a flex row inside
the cloth but took its width from its content: measured at 430 px of screen, the strip was 277 px
inside a 396 px cloth, four words pushed left with a hundred pixels of nothing to their right, and
each target narrower than it could have been. `align-self:stretch` plus `width:100%` on the nav
and `flex:1 0 auto` on the buttons fixes it — grow but never shrink, so if a fifth tab ever
appears the strip scrolls instead of squeezing the words under the 44 px finger rule. After:
277 → 321 px at 375 px of screen (buttons 85/79/90/67, height 44) and 277 → 368 px at 430.
The first attempt only touched the buttons and changed nothing at all, because the nav itself was
the narrow box — worth remembering: stretch the container before stretching what is inside it.

Second, the strip skipped `tabsSync`, which the desk's and the station's strips both call. That
function does two things: it scrolls the selected tab into view, and it drops the fade mask on the
right edge once there is nothing left to scroll. Without it the last tab of ОПИСЬ was permanently
pale, as if more tabs were hiding behind it, and a selected tab could sit off the edge with no
highlight visible anywhere. One call after the strip is built; `tail` now reads true with the mask
off.

**P4 The compass chips and the moving edge (2026-09-17).** A chip at the frame's edge means «the
target is out there, past the edge»; a chip in the middle of the frame means nothing. The chips
crawled inward because the *edge* was computed from the interface: `inY1` took the minimum over
every stick foot (`helmStickFoot`) and the hint line, and a finger on a phone is born anywhere in
the lower half, so on every steer the bottom edge jumped to mid-screen and took the chips with it
(playtest, §1.4).

Control's rule, implemented as written: the edge stays the edge and may move inward by at most
`CHIP_IN = 12` px beyond its usual inset; interface nodes are dodged **along** the edge; if there
is no room along it, the chip jumps to the neighbouring edge in the direction of its target. So
the stick feet and the live hint line now go into `placed` — the same list of taken rectangles the
chips themselves use — instead of bending the inset, and the placement sweep (`slide`) walks the
edge in both directions from the ideal spot rather than only forward. Walking both ways matters:
the old loop stepped one way and, on reaching a busy end of the edge, wrapped to its start, which
read as a chip teleporting across the screen because of one finger. The label's side and the
arrow's anchor are taken from where the chip actually ended up, not from the ray's intersection,
since after a jump those disagree.

Measured in the browser pane at 375×812 (`drawWorld()` directly, because a hidden pane's
`frameBody` returns before drawing): with nothing in the way three chips sit on the top edge at
y = 76, which is the inset; with a blocker over the left of that edge they slide along it —
x 104 → 114 and 188 → 198 with y unchanged at 76; with the whole top edge blocked all three jump
to the side edges at y 466–486; and with a stick foot in the middle of the lower half the chips
are free to stand at y = 556 and 576, i.e. the bottom edge is no longer dragged up to 451. One
bug found by that last test: the sweep was a fixed ±300 px, so a large obstacle left the chip
standing inside it instead of jumping; the sweep now spans the whole edge.

**P4 follow-up — the chip eases instead of snapping (2026-09-17/18).** Control's review of P4
(c2f73a3, the Designer's three conditions) found the first version correct in its logic but wrong
on the phone: a chip's slot could change by 10-100 px in a single frame whenever a stick foot
moved, and a place that changes without moving reads as a jerk, not a slide.

The fix keys each chip by its target (`star`, `station`, `planet:<name>`, `target`, `hail`) and
keeps its last *drawn* place in `CHIP_POS`, separate from the logical slot the placement sweep
computes every frame. A same-edge move eases toward the logical slot at up to 200 px/s (real time,
`wallNow()` — this is a draw effect, not world simulation, so a paused world must not freeze it
mid-slide and a resumed one must not jump). A cross-edge jump is the case the Designer called out
by name: sliding a chip in a straight line across the frame when its target moves from one side of
the ship to the other would cut through the middle of the screen, past the ship and every other
chip. When the straight-line distance exceeds half the edge span — the signal that this is a jump,
not a slide — the chip instead fades out at the old spot and back in at the new one over 0.15 s.

A first appearance (a target chip born off-screen with no prior frame) still snaps straight to its
slot, as asked — there is nothing to ease from.

Two more taken rectangles went into `placed`, both read from Control's review: the ship's own hull
(a fixed screen-space guard around its projected point, since computing its actual on-screen
silhouette needs `hullOf`/`shipScaleAt` machinery this function has no reason to duplicate for one
avoidance box) and the stick pads at rest via the cached `padsRect()` — before this only a
finger's *trace* on a pad counted as taken, so a chip could sit on an idle pad in the instant
before a finger arrived.

One bug the browser pane caught that had nothing to do with the three conditions: a chip's cached
position is only ever moved by the "ease toward" arithmetic, and arithmetic on `NaN` never
converges — `Math.hypot(NaN, …)` is `NaN`, and every comparison against `NaN` is false, so a chip
that ever received one bad frame (an autopilot target briefly missing its `kind`, say) would stay
invisibly stuck at `NaN` forever, never fading and never easing back. Reproduced by feeding
`G.ap={x:100,y:100}` (no `kind`) for one frame and watching `CHIP_POS` stay `{x:null,y:null,…}`
(JSON's spelling of `NaN`) for eighty subsequent good frames. Fixed by treating a non-finite cached
position the same as "no record yet" — it snaps to the current slot and resumes easing normally
next frame, so one bad frame can only ever cost one bad frame.

Verified in the browser pane (`drawWorld()` called directly, since a hidden pane's `frameBody`
never draws): a chip that moves 60 px along its edge in 0.1 s of simulated time covers ~20 px, the
200 px/s cap; a target thrown to the opposite side of the ship starts fading rather than sliding
and completes to the new slot once enough time has passed; and a synthetic 140-frame run with the
station and a fake autopilot target sweeping in circles, plus the one poisoned frame above, threw
no exception and healed within one frame.

**P4 follow-up — a stable order along the edge (2026-09-18).** The lerp fix above made a chip's
*own* motion smooth, but the Tester's phone still showed the compass reshuffling: three chips read
432/457/321 on one frame and a visibly different order on the next, with nothing steering except a
stick foot moving under a still finger. The cause was structural, not a missing ease: each chip
independently called `slide()` from its own ideal ray position, searching both directions for a
free spot — so when chip A's obstacle changed, chip B (whose own ideal spot never moved) could
still end up on the opposite side of A, because A's new position changed which side had room.
Two chips that never asked to swap places would swap, and the eased motion just made the swap
slower, not honest.

The fix treats a row of chips on one edge as one object with a direction, not N independent
searches. `cands` collects every off-screen mark with its ray-cast edge point and distance to the
ship, then sorts by that distance once (`cands.sort((a,b)=>a.dist-b.dist)`) — nearest target
first, and that order does not depend on where anything is currently drawn, so it cannot flip
frame to frame on its own. The first chip of a new row still searches both directions from its
ideal spot, same as before (`slide(onSide,rx,ry,cw,ch,0)`) — it has no row to defer to. Every chip
after it first tries to sit flush against the current front of the row, continuing in the row's
established direction (`slide(onSide,x0,y0,cw,ch,stack.dir)`, where `x0,y0` is the front's edge
plus the new chip's own half-width/height plus a 4px gap); if that direction has run out of edge,
it tries the *other* side of the row's own anchor — the first chip placed, not the current front —
before falling back to the old edge-jump. `slide()` gained a `dirOnly` argument for this: `0`
still means "search both ways" for the first-chip and edge-jump cases, ±1 restricts the walk to
one direction for a chip extending a row.

One consequence worth stating plainly: when the sort order itself changes — the autopilot target
gets closer than the station, say — the chip that becomes "first" *does* relocate to the front of
the row, and the others slide down to make room. This is still correct: it is a real change in
which target is nearest, not a rendering glitch, and the existing per-chip ease (P4's other
follow-up, same milestone) makes that transition a slide rather than a cut. Verified in the
browser pane: three synthetic targets (station, nearest planet, autopilot target) settle into a
column with an exact 20px pitch (chip height 16 + 4px gap) in a fixed order; walking the autopilot
target's distance down past the other two over 30 frames produces a continuous re-sort — every
step stays under the 200px/s cap and the 20px pitch never breaks, confirming two chips never
occupy overlapping rectangles at any point (`fits()` makes that structurally impossible — it is
checked against everything already in `placed` before a spot is accepted) and the reported
"НЕЙЭЛЬ II / 3056 / 40" overlap and the general chip-order reshuffle are the same bug, closed by
the same fix.

**P5 «Смена» reads on paper, not on glass (2026-09-18).** `.smena` (M353, `12ud-smena.js`'s
chapter reader) was written against the desk of its day — a dark list window — and coloured itself
with `var(--text)`/`var(--dim)`, the palette for text glowing on black glass. M151a later turned
the whole desk into a paper sheet (`#loglist`/`#lorelist` got a warm cream gradient background and
every other piece of text on it — the journal's `.li span` — was repainted as ink), but `.smena`
sits in its own block further down `style.css` and that pass never touched it, so its body text
kept shining pale cyan on cream: measured contrast about 1.1:1, functionally invisible except for
the gold drop-cap, which was already a fixed hex colour and unaffected.

Fixed by pointing `.smena`, `.smena hr.scene::before` and `.smena .cap` at the same inks the
journal already uses on this exact paper: `#2f2718` for body text (matches `#loglist .li span`),
`#8b7d61` for the "· · ·" scene-break mark (matches `.li.dim span`), `#6a5c44` for italic captions
(matches `.lorelist .li.note span`). `.journal` (the in-text quoted log excerpts) was left alone —
it already carries its own dark background box, so gold-on-black there was never the bug.

The margin was a plainer slip: `margin:6px 0 14px 28px` is top/right/bottom/left, and the `0` is
the right side — there never was one, so a line ran flush to the sheet's own edge. Set to 28px to
match the left, the same figure §5.1 already measured as the margin's usual width.

Verified in the browser pane: opened chapter 1 live (`tableToggle(true,"smena")`, `smenaOpenCh=1`),
read the rendered `color` off a `<p>` and computed WCAG contrast against both ends of the sheet's
gradient — 1.09:1 before the fix (matches §5.1's field measurement exactly) to 12.06:1 / 9.99:1
after; measured the `.smena` block's actual left/right gap to `#loglist`'s edge — 28px both sides,
was 28/0. Screenshot confirms it by eye: dark serif body text, gold drop-cap, on the cream sheet.

**P7 The gravity anchor keeps one voice (2026-09-18).** The Designer's S23 frames caught the edge
warning speaking twice at once: a teal toast at the ship (`say()`, `17-mode-system.js`, throttled
to once per 900 game-ticks on entry) and an orange line at the bottom of the screen (`cue()`,
fired every frame the ship is past the edge) — different wording for the same event, and the toast
sat wherever `#msg`'s fixed `top:25%` position happened to land relative to the ship and its trail,
sometimes across the hull, sometimes overlapping a compass chip's own label with a zero-px gap.

Control's review offered two ways to close it: drop the ship-side voice, or cut it to two words.
Dropping it was the better fit here specifically because the bottom line already carries the full
sentence continuously for as long as the condition holds, where the toast only fired once on entry
and then faded — the toast was not adding information, only a second rendering of the same one.
Cutting it to two words would still have left a second, differently-worded announcement of the
same fact, and would have required the edge-case work the review also flagged: repositioning a
*generic* toast mechanism (`say()`/`#msg`, used across the whole game for unrelated messages, most
recently for crash reports in `28-loop.js`) to sit at the frame's edge and registering it as a
taken rectangle for the compass chips — machinery built for one caller among many, and one that
would need re-justifying every time some other `say()` call also happened to fire near an edge.

The fix is a subtraction: the `say()` call and the `if(!G.edgeWarned||...)` throttle that gated it
are gone, along with `G.edgeWarned`'s one line in the ephemeral-fields whitelist
(`14a2-save-ephemeral.js`) — a field with no remaining reader is dead weight, not a future hook.
Nothing else in `updateSystem`'s edge branch changes: the turn-toward-star behaviour, `atEdge`, and
the `cue()` call three lines later are untouched.

The review's other two conditions — keep the text off the ship, register what remains in `placed`
— talk about what to do with the ship-side text *if it survives*; with it removed outright, both
are vacuously satisfied, there is nothing left to place. The review's closing note, that chips must
hold a stable order along the edge, was a restatement of the same bug the P4 order-follow-up above
already closed (same milestone, same review pass) — nothing further needed here.

Verified in the browser pane: parked the ship past `sysEdge()` and ran `stepWorld()` for ten ticks.
`G.prompt` reads the full bottom line («ГРАВИТАЦИОННЫЙ ЯКОРЬ · КРАЙ СИСТЕМЫ / КУРС К ЗВЕЗДЕ
