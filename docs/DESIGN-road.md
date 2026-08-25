# DESIGN-road — the road companion (author's idea, 2026-08-23, captured from voice)

Not a milestone yet; a design to hold the idea until its own pass. Nothing in the current
queue depends on it.

## The idea in one line

When the player is actually travelling in the real world — riding in a car, a bus, a train —
the game turns into a living screensaver: **your own ship** (the one you bought, with its
skin and its wings) flies across the screen, and the real trip feeds it.

## What the screen shows

- The player's current ship, large, in flight — the same drawn hull the fleet uses, flapping /
  banking, beautiful; this is the whole screen, a companion mode, not a menu.
- **Speed**: real GPS speed, extrapolated to a cosmic figure (say ×1 000 000 → km/s style
  numbers). Not the honest 90 km/h — a translated, fantastic speed that still moves when the
  car moves.
- **Distance counter**: how far you have "flown" this trip, in the game's units, integrated
  from the same feed.
- **Turns and bumps**: phone accelerometer/gyroscope. A real right turn banks the ship right;
  road vibration shakes the hull, the wings answer. The ship visibly reacts to the road.
- **Music bar**: a panel along the bottom, an equalizer/visualizer driven by the microphone —
  if music plays in the car, the ship flies to it.

## What it gives back in the game

- Real distance travelled converts into an in-game bonus (the author said "воду" — likely
  water/fuel/credits; exact resource is the author's call). Fly far in life — collect
  something in the game.
- The trip syncs with the save: the bonus lands in the same account (the site already has
  PHP accounts, see docs/DEPLOY.md), so the phone companion and the desktop game meet.

## Feasibility notes (2026-08-23, not binding)

All of it is reachable from the existing single-file web game on a phone browser:

- GPS: Geolocation API (`watchPosition`), needs HTTPS — drift-game.ru already is.
- Tilt/shake: `DeviceMotionEvent` / `DeviceOrientationEvent`; iOS needs a one-tap permission
  (`requestPermission()`), so the mode starts from a button.
- Music: Web Audio + `getUserMedia` microphone → `AnalyserNode` for the equalizer. Mic
  permission prompt; degrade gracefully to a synthetic idle pulse when denied.
- Ship drawing: the fleet hulls are already procedural (`hulls`, parrot-style pose work);
  a flight loop with banking is a new small renderer, not new art language — keep
  docs/DESIGN-* art direction (one body, one light).
- Sync: the accounts endpoint already exists; the bonus is one signed counter per trip.
  **Anti-cheat is the real design question** — GPS is trivially faked; cap the bonus per day
  and keep it a pleasantry, not an economy source (the economy rules in DESIGN-economy.md
  must not be undermined by a car ride).
- Screen: keep-awake via Wake Lock API; battery is the cost, say so on entry.

## Open questions for the author

1. What exactly is the reward resource, and its daily cap?
2. Is this a mode inside drift.html (a fourth screen) or a separate small page on the site?
3. Does the companion need the save loaded, or only the account (which ship you own)?

## Built (M168, 0.129.0) — decisions taken on the autonomous run (reversible)

1. **Reward: ice** («воду» taken literally) — one unit per real kilometre, capped 40 a day
   (≤ ~280 cr: a pleasantry, the economy rules stand). Granted into the hold on leaving the
   mode; a record-book line «привезён лёд с дороги».
2. **A mode inside drift.html** (`27k-road`, screen `#roadwin`, the МЕНЮ door «В ДОРОГУ»):
   the phone already plays drift-game.ru, so the companion shares the save natively — no
   separate page, no account round-trip, nothing for anti-cheat to sign.
3. **Speed sanity as the anti-cheat**: 3–300 km/h counts (standing and planes do not), the
   daily cap does the rest.

What the screen does: the player's own hull large (same `drawHull`, banked by the gyroscope,
shaken by the road, flames by speed), stars streaming by speed, the cosmic figure
(90 km/h × 1 000 000 → «25 000 км/с»), the trip in millions of km, the ice counter, a
microphone equalizer along the bottom (synthetic pulse when denied). Sensors start from the
РАЗРЕШИТЬ ДАТЧИКИ button (iOS gesture rule); GPS speed comes from `watchPosition` (falls back
to haversine between fixes); Wake Lock keeps the screen on and the entry line says the battery
is the price. Suite `91zzy`.

## Second pass (M168b, 0.130.0) — credits, combo, acceleration, the wave

Author's corrections. **Credits instead of ice**: two credits a real kilometre, a live ticking
counter on screen; **combo** grows with uninterrupted driving to ×3 over twenty minutes and
burns after two minutes standing; the daily cap is soft (1500) — «взломают и хрен с ним, сами
дураки» is the author's recorded call, so speed sanity (3–300 km/h) is the only guard.
**Acceleration and braking** reach the hull: the speed derivative smooths into a pitch (nose up
on throttle, a forward dip on brake), the flame grows with acceleration and the nose thrusters
fire on braking (the fleet's own `drawHull` braking flames). **The wave** replaces the equalizer
after a self-critique pass (linear bins mostly dead, boxy bars alien to the art language, no
temporal smoothing, one deaf colour): a smooth glowing curve of log-spaced smoothed bins breathes
along the bottom, and the **nebulae change colour with the music's mood** — energy (RMS with
fast attack, slow release) × brightness (spectral centroid) pick the hue from violet-cyan (calm)
to magenta-amber (energetic), blended 28% with the player's own hull colour, the way Яндекс
«Моя волна» blends the track's colour with the listener's. Loud beats spawn stars along the
path; touching the screen makes a white pulse, like the Волна does. Composite «lighter», small
blobs in the upper two thirds — the first draft washed the whole sky flat green and the critique
pass caught it.

## Third pass (M168c, 0.131.0) — gradations

The author on the 3–300 window: «нихрена себе у тебя здравый смысл» — a car tops at ~200. Now
three tiers with a four-second hysteresis so an overtake does not flicker the label:
**ДОРОГА** 3–200 (car/bus, as before), **ЭКСПРЕСС** 200–400 (a train, if GPS catches it —
star streaks stretch double), **ГИПЕРДРАЙВ** 400–1000 (a plane: a star tunnel converging on
the course, a light cocoon around the hull, the flame a step up — and the figure switches to
fractions of light, because 850 km/h × 1 000 000 is honestly **0.79 световой**). Above 1000 —
not believed. Pay rate is the same everywhere; the cap does the balancing.

## Fourth pass (M168d, 0.132.0) — nose up, the trail, the dart

From the author's first real phone run («Заебись! только летит вверх а не в бок»). The ship now
flies **nose up** — portrait screen, the road is ahead: stars stream downward, the warp tunnel
converges above, the beat stars fall from the top. From the nozzles — the **trail stripes** in
the very colours the game's flight trail uses (`trailTint`: core/mid/edge of your hull's
accent). In a real turn the hull **darts sideways** from the centre — lateral g from the
accelerometer plus the tilt — up to a fifth of the screen, then eases back home slowly (fast
out, slow return). A NaN on the first frame of the dart was caught by the suite.

## Fifth pass (M168g, 0.136.1) — measuring the road through a crooked cradle

Watched four and a half minutes of real driving, frame by frame. Three faults.

### How a turn is measured now

A cradle is never level. Gravity leaking into the lateral axis at a tilt of φ is
`9.81·sin φ`:

| tilt | on the lateral axis | reads as |
|---|---|---|
| 5° | 0.85 m/s² | 0.09 g |
| 10° | 1.70 | 0.17 g |
| 15° | 2.54 | 0.26 g |
| 20° | 3.35 | 0.34 g |
| 30° | 4.90 | 0.50 g |

against what a car actually pulls sideways:

| manoeuvre | lateral |
|---|---|
| unhurried city corner | 0.10–0.20 g |
| roundabout, motorway exit | 0.25–0.40 g |
| brisk corner | 0.45–0.60 g |
| grip limit, dry tarmac | 0.8–0.9 g |

A cradle 10° out of true therefore lies harder than a real gentle corner is worth, and
no amount of dividing fixes it — the divisor flattens both. Three rules instead:

1. **Auto-zero.** A slow mean of `accelerationIncludingGravity` (τ = 20 s, first 3 s
   grabbed at τ = 0.6 s) is the cradle's resting gravity vector. It learns **only on the
   straight** (residual < 0.08 g and yaw < 4 °/s) — otherwise a long curve would be
   absorbed into the baseline and the corner would vanish.
2. **A frame built from gravity, not from the screen.** "Right" is the screen X axis with
   its component along gravity removed, renormalised. Any static tilt of the cradle is
   then subtracted on both axes at once. The measure only fails when the screen's X axis
   itself approaches vertical (`|x̂·ĝ| > 0.75`, about 49°) — the app says so rather than
   inventing a turn.
3. **The turn is yaw rate about the vertical** — `rotationRate` projected on gravity —
   which is indifferent to how the phone is mounted. Converted to lateral acceleration by
   `a = v·ω`, so both sensors share one scale in m/s². Agreeing, the larger wins;
   contradicting (opposite signs, both above the dead zone), the smaller does.

Scales: full swerve at **0.30 g**, ceiling 0.60 g, dead zone 0.04 g, raw gyro clamped at
60 °/s. Below 8 km/h the swerve is gated off and fades in by 20 km/h — a car park and a
phone picked up out of the cradle must not fling the ship. The *bank* is not gated, so
tilting the phone in your hand still rolls the ship while parked.

`gamma` from `deviceorientation` is not used at all: a cradle stands the phone nearly
upright, next to the singularity of the Z-X'-Y'' decomposition (`beta = ±90°`), where
`gamma` swings on any nudge.

### The trail

One filled body per nozzle with a lengthwise gradient — never a chain of strokes under
`lighter`, which piles up at every joint and turns gas into masonry. Falloff quadratic
(`u²·.30 + u⁴·.5`), as in flight. Lifetime is derived from flow so the ribbon is always
`ROAD_TRAIL_LEN` of the screen and burns out inside the frame; the bottom `ROAD_MASK`
fades to background so the footer is never crossed. Points are laid at a fixed step along
the path, which makes density identical at 30, 60 and 120 Hz.

### Rules that came out of this pass

- Time comes from the real frame `dt`. A hard-coded 1/60 doubles trail density and halves
  every timeout on a 120 Hz screen.
- The road day is the **calendar** day. The game day is sixty seconds long, and on it the
  trip counter reset mid-drive.
- Shake is read from acceleration with the cradle's tilt already removed, dead zone
  0.35 m/s², full scale 2.5; the visible tremble is a smooth two-tone wobble plus a kick
  on a real pothole. Per-frame `Math.random()` reads as twitching, not vibration.
- The swerve limit is the hull's **measured** half-width (`roadHullHalf`), not `h.bw`:
  pods and pylons run about 2.3× wider than the body, and the old guard cut the ship at
  the edge.

## Sixth pass (M168h, 0.136.2) — the microphone is a separate yes

Android Auto connected: the head unit sees an open audio capture, decides a call is in
progress, and ducks or stops the music. There is no web API that reports "a car head unit
is attached", so this cannot be detected and worked around — it has to be a choice.

The microphone only ever fed the mood colour; without it the wave breathes on its own and
the nebulae still live. So:

1. **Two consents, not one.** The button turns on GPS, motion and wake lock. The
   microphone is a second, deliberate tap and is **off by default**. The button names the
   next action ("СЛУШАТЬ МУЗЫКУ" → "ВЫКЛЮЧИТЬ МИКРОФОН"), so it can be killed mid-drive.
2. **Raw capture when on:** `echoCancellation`, `noiseSuppression`, `autoGainControl` all
   `false`. Echo cancellation is what puts the stream on the voice route, and it is the
   voice route the head unit reads as a call.
3. **Its own `AudioContext`.** If the system switches a context into communication mode,
   it should be the empty analyser context, not the one the game plays through.
4. **The cost is on screen before the tap.** Never let the driver find this out on the
   motorway.

Remembered in `G.road.mic`.

## Seventh pass (M168i, 0.136.3) — the quiet microphone, the invisible engines

From a second filmed drive, with the microphone on.

### Software gain

Raw capture (the Android Auto rule) means no AGC, and music from car speakers lands
on a phone microphone at RMS 0.05–0.15. Absolute thresholds are therefore wrong by
construction. The analyser normalises against its own peak with a slow decay
(`RD.pk`, τ ≈ 30 s): energy and the beat both work on `rms/pk`. The spectral
centroid (brightness) is scale-invariant and stays as it was. Rule: **never put an
absolute audio threshold in this file** — the input level is unknowable.

### Which microphone

Capturing from a Bluetooth microphone flips the headset into the hands-free profile
(HFP/SCO), which cannot carry A2DP music — the music dies for the whole car, and the
head unit shows a call on top. After permission is granted the device list is
re-checked: if the active capture is a bluetooth/hands-free/headset device,
`roadMicPick` (pure, tested) chooses the phone's built-in microphone and the capture
is reopened with `deviceId: {exact}`. The track is marked `contentHint="music"`.
What this does NOT fix: a head unit that flags any open capture as a call — that is
its own guess, and declining it from the wheel is harmless now.

### Manoeuvring jets

At road scale the hull's drawn thrusters are invisible, so the road draws its own,
in screen space, before the hull (nozzle cut hidden under the plating):

- **brake** — two cold cones forward from the shoulders (`h.nose*.66`,
  `±h.bw*.42`), splayed ±0.16 rad so they never merge into one central spear,
  pulsing out of phase;
- **turn** — one short lateral puff from the nose on the side opposite the swerve,
  gated by the same speed gate as the swerve itself;
- both in the cold jet palette (`205,232,246`), never the warm main-engine tint.

### Stars

Brightness floor `.30+depth*.62`, bright palette (`#eef7fc`/`#a8bccb`), per-star
twinkle phase; a large near star gets a cross-glint **only near standstill** — on a
moving streak the cross reads as a pinned "T".

## Eighth pass (M168j, 0.136.4) — the bloom

Reference: the "Моя волна" cover — light radiating from a centre, several
distinct colours at once, palette following the track's mood.

Structure, bottom-centre anchored, additive:

1. **Core** — mood hue, radius `H*(.24+en*.30)`, beat pushes it.
2. **Two satellites** at `±.34W`, hues `±115°` off the mood, same order of
   brightness as the core — this is what makes it read as *multicoloured*
   rather than one wash; their weights lean on spectral brightness, so a bassy
   track and a bright one split the triad differently.
3. **Seven rays**, fanned `±0.78 rad`, each ray's length driven by its own band
   of `RD.wave` — the 28-band log-frequency curve finally drawn.
4. A thin single-hue strip at the very edge lays light under the buttons.

Lessons from tuning: at additive blending over a dark sky, satellite blobs need
core-level alpha and a full `±115°` hue split, or everything averages into one
green wash; and the first version failed exactly that way at half alpha and
`±100°` with overlapping centres.

## Ninth pass (M168k, 0.155.0) — the colour was arithmetic, not taste

Six minutes of a real city drive, filmed with the microphone on, plus the author's three
corrections: a rich palette, the game's own sound off, and stars that read as flight rather
than blinking. What the footage showed, and what came out of it.

### The sky was green for six minutes because hue was averaged like a number

`roadMoodHue` interpolated **degrees on a line**: `calm = 265 − 75·bright` (violet → cyan)
and `hot = 320 − 280·bright` (magenta → amber). On a bright track that is a walk from 190 to
40 — straight through 150 and 100, which is green. Every track, any energy, one salad wash.
The intent ("violet-cyan → magenta-amber") was never reachable by that formula.

The hot end is now written **past 360** (`320 + 80·bright`, so amber is 400 ≡ 40). The path
from calm therefore always rises — violet, magenta, red, amber — and never touches green.
The accent blend is a proper circular mix (`roadHueMix`, shortest arc). `roadMoodPath` is
pure and tested: a 11 × 21 grid of (energy, brightness) must not produce a single hue in
50…185.

Richness needed a second fix. Three nebulae at `hue`, `hue+42`, `hue+84` are neighbours of
one family and add up under `lighter` to one wash; they are now spread round the circle
(`ROAD_SKY_H = [0, 132, −118]`) with their own saturations. The bloom's satellites were
±115° apart in hue but only ±0.34 W apart in space with radii of 0.8 R₀ — overlapping cores
average to a white lump, which is exactly what the eighth pass thought it had fixed. They now
stand at ±0.46 W with radius 0.62 R₀: farther apart than they are wide.

### The footer was unreadable

The bloom was anchored at `H·1.02` and a tinted strip up to `0.24 H` tall, alpha up to 0.49,
was laid over the buttons in normal blending. On the footage a light ray cut through
«ВЫКЛЮЧИТЬ МИКРОФОН» and «НАЗАД» stood in amber on bright green. These are pressed at the
wheel, without looking.

The first answer was to raise the light to the footer line and paint the band below it dark.
The author looked and said no, rightly: it read as a horizon with a searchlight and a dark road
running into the distance — a scene, not a glow.

The second answer took its shape from the author's own references («моя волна» covers) and is
the one that shipped: **the bottom edge itself glows, across the whole width**, plumes rise out
of it, and above them is black. Legibility is not bought by cutting a hole in the picture — it
is the footer's own glass (`body.road .scr footer`) that carries the buttons, so the canvas is
free to be beautiful right down to the last pixel.

The first version of this glow was a composition of soft lobes: five narrow plumes, three
noise-offset lobes each. It worked, and it was the right thing to build under a battery budget.
Then the author lifted the budget — «в этом режиме делай максимум, всё равно тел на зарядке» —
and the honest answer to that is not "more lobes". It is a **field**.

`27lb-road-bloom` computes the light **per pixel**: the shader from the recipe, written on
`ImageData`. What is left of the composition is one even band of mood-hue light along the very
edge, so the bottom glows even in total silence.

- **Domain warp** — `fbm2` inside `fbm2`. One noise gives clouds; a noise that displaces the
  coordinates of a second gives *viscosity*: strands that curl and pour. Without the warp the
  field is fog; with it, liquid. This is the single thing that separates the effect from a
  gradient.
- **Colour comes from the warp**, not from position. A 64-step table is built each frame as a
  closed loop through the five palette hues around the mood (`ROAD_BLOOM_H`), and the index is
  driven mostly by the low-frequency warp — so tones come in patches that flow with the light.
  Both extremes were tried and both are wrong: index by position and you get a rainbow strip,
  index by the fine noise and you get psychedelic marble. The loop is closed on purpose: an
  arbitrary arc round the circle would drag the palette through green, and that lesson is
  already paid for.
- **The spectrum enters by X.** The height of the light over each point of the edge is that
  point's own `RD.wave` band. The equaliser is not drawn as bars — it is dissolved into the
  light.
- Contrast is `n²`, not `n`: light needs bright strands and dark gaps, or the field reads as
  even fog.

Height grows with energy only weakly, on purpose. The author's verdict on the standstill frame
was that it is the best one — and standing still is exactly where there is little light and it
does not flood the frame.

**And the ship is lit by it.** A soft bounce under the hull in the mood hue, as much of it as
there is light below: without it the hull reads as cut out and pasted onto the glow.

### What it costs, measured

"Battery does not matter" does not mean "the frame does not matter" — thirty hertz in a cradle
is visible instantly. First measurement: **17.9 ms** a frame out of the 16.7 available, 95% of it
the field. Three measures, none of which takes anything off the screen:

1. **Two octaves instead of three.** The third runs at four times the frequency and carries a
   seventh of the weight — after the field is stretched sixfold it lies inside one pixel.
2. **A narrower field**: 88 points across instead of 124. The stretch *is* the blur; the screen
   cannot tell, and there are half as many points.
3. **The field lives at its own 26 Hz.** The flow is slow — a second of it crosses a tenth of the
   noise — so there is nothing to recompute every frame; between recomputes the same bitmap is
   laid down again. The frame stays 60 Hz: hull, trail, stars and numbers all keep moving.

Measured after: **5.5 ms per recompute, 0.19 ms to lay it down, ≈2.6 ms a frame amortised.**

### The bands, and what each one is allowed to touch

Until now everything hung off one number (`energy`) plus the 28-bin wave. Now the wave also
yields three bands (`roadBands`, pure and tested) — and they are given separate jobs, because
one number moving everything is what makes a visualiser look mechanical:

- **bass** — the height of the glow and the *speed of the noise flow*: the low end moves mass;
- **treble** — a fast fine ripple on the plumes' edges, nothing else;
- **mid** — overall density.

The bands come from the wave rather than from the spectrum a second time: the wave is already
normalised against its own peak (the M168i rule — never an absolute audio threshold here) and
smoothed in time, so the bands inherit both, and the stand drives them together with the wave.

A touch is now a **flash**, not a diagram: local light in the mood hue decaying by `exp(−t/τ)`,
with a thin white ring on the front. It used to be the ring alone.

### The trail was two plastic tubes

Three causes, all measured:

1. Alpha peaked at 0.80 under `lighter`; two lanes overlapping gave 1.6 and every channel
   clipped — the tint was destroyed by construction, and doubly so now that the bloom lights
   the lower screen (the falloff had been tuned against a black sky). Peak is now 0.32.
2. `col(u)` used `T.core` for `u > .78`, and the visible ribbon lies almost entirely there.
   `T.core` is the accent mixed 82% into white — so the exhaust was white whatever the hull.
   The core is now confined to `u > .93`, the body carries `mid`/`edge`.
3. The two lanes ran parallel to the bottom of the screen. Each point now eases toward the
   axis it was emitted on (τ = 1 s): one flame, not two pipes. Width tapers harder as well.

### Stars: blinking is a trick for standing still

`fast` divided speed by 120 km/h in the first tier, but a city drive is 15–45: the scale read
0.2, a star's streak came out three pixels, and the only thing moving was a sine on alpha.
The reference is now the speed that tier actually sees (`ROAD_FAST_REF = [60, 330, 900]`),
streaks are longer, the flow is faster, and the twinkle amplitude falls to zero by half the
scale. The cross-glint fades out smoothly instead of switching at 30 km/h — in stop-and-go it
blinked at every light.

### The swerve never fired, and the screen could not say why

Across the whole filmed drive — 45 consecutive seconds sampled frame by frame, 35 samples over
six minutes — the hull never left the centre and never banked, while the "phone is on its side"
hint stayed off, so the measure was not blind. Whether the road was straight or the measure
reads zero is not knowable from the screen, and tuning thresholds blind is guessing.

So: a **truth window** — long-press the screen, or `?road=diag`. Six lines: lateral in g (and
the accelerometer's own reading beside the fused one), yaw rate, `|x̂·ĝ|`, the swerve, the speed
gate, the offset in screen widths, bank, shake, the travel scale, the auto-zero's age and the
real frame rate. Nobody sees it on an ordinary drive.

Two thresholds moved with it, and both are reversible. `ROAD_LAT_FULL` 0.30 g → **0.24 g**: an
unhurried city corner (0.10–0.20 g) now carries the hull past half its travel. Lower is wrong —
at 0.18 g a motorway curve already pins the scale, and the suite catches it. `ROAD_MOVE_FULL`
20 → **14 km/h**: in stop-and-go half the drive sat under the old ceiling, so the gate was shut
exactly where a car turns.

### The rest of what the footage showed

- **The game does not sound in the road.** `audioHush` mutes the buses and stops the music
  without touching the player's setting; a companion mode shows, it does not play. The sound
  belongs to whatever is playing in the car.
- **Nothing but the screensaver exists.** `body.road > *:not(#roadwin) {display:none}` — twice
  an explicit list turned out to be incomplete (the pads leaked, then the parrot window), and
  opacity is no defence because it rides on frames. The main loop also **stops drawing the
  world** while `RD` is up: it is invisible under a full-screen mode and battery is the stated
  price of this one.
- **Full screen** on the sensor tap — the browser's furniture ate a seventh of the screen of a
  mode that stands in a cradle for the whole trip. The gesture already exists.
- **The reward became visible without becoming bigger.** 21 → 25 credits over six minutes gave
  no sign of life. Each credit now flies from the hull into the counter, and the combo chip says
  what it buys («×1.7 КОМБО · 3.4 кр/км») instead of an abstract multiplier.
- The hull went **smaller**, not larger. It was raised 15% first, on the reading that it looked
  like a toy in an empty sky; the author, seeing it, asked for smaller still. He is right and the
  first reading was wrong: the emptiness was the problem, not the size, and the sky is no longer
  empty now that the edge glows. `0.46 → 0.41` of the fitting scale.
- **The swerve limit was wrong and nobody could have seen it.** `maxOff` used `W·ROAD_SWERVE`
  where the constant says «доля полуширины экрана» — twice the intended travel. Only the edge
  guard held it, so at a full dart the hull stood exactly in the screen edge and bank and shake
  cut it off. It never showed on the road because the swerve never fired; it showed on the stand
  within a minute of the measure becoming more sensitive. Now `W·0.5·ROAD_SWERVE`.
- The microphone hint faded after ten seconds (it had hung for the whole six minutes) and comes
  back on a touch; faults never fade. The system name no longer stands on screen twice — the HUD
  line crossfades in as the centre announcement goes out.

### The stand

`docs/mkroad.ps1` → `docs/road.html`: the road screen with synthetic music and a synthetic
speed, so the frame that gets edited every pass can be looked at from the desk instead of
costing half an hour of traffic. `?kmh= &turn= &en= &br= &diag=` set the case.

```bash
powershell -ExecutionPolicy Bypass -File docs\pageshot.ps1 road -Width 420 -Height 880 -Q "?kmh=48&turn=0.85"
```

### One thing the footage suggested that turned out not to be ours

A rounded, outlined box hung off the right edge in every frame of the video. Checked in the
browser at a phone viewport: no element overflows the viewport, `scrollWidth` equals
`innerWidth`, and the page cannot scroll (`html,body` are `overflow:hidden; touch-action:none`).
It is the phone's own edge panel handle. Written down so the next pass does not chase it again.

## The shader question, answered on paper (2026-08-25)

The author brought a recipe for this effect written for WebGL: a fullscreen fragment shader,
Perlin/simplex noise for the liquid deformation, `mix`/`smoothstep` between two palettes,
`AnalyserNode` split into bass/mid/treble as uniforms, an `exp(−t)` flash at the tap. It is a
good recipe and it describes the right *effect*. Four of its five ideas are now in the game —
they turned out to be independent of the technology:

| the recipe | what it is here |
|---|---|
| Perlin/simplex in the fragment shader | `fbm2` from `01-core`, five samples a frame instead of a million pixels |
| `u_time` keeps it alive on pause | `RD.flow`, and the wave breathes on its own with no microphone |
| two palettes mixed with `mix`/`smoothstep` | mood hue × the player's own hull colour, blended on the hue **circle** |
| `u_bass` / `u_mid` / `u_treble` | `roadBands` — bass moves height and flow speed, treble ripples the edges, mid the density |
| `exp(−t)` flash at `u_mouse` | the touch flash in `27la-road-sky` |

The one thing that does **not** transfer is the renderer, and that is the actual decision. What
a shader would buy: per-pixel noise, so the light could be genuinely turbulent rather than a
composition of soft lobes; and it would be cheaper per frame at high blur radii.

What it would cost, honestly:

- the project's first rule is canvas 2D and vanilla JS (`docs/` art direction, `CLAUDE.md`); this
  would be the only WebGL surface in the game, so the language of the frame would split in two;
- a second context on the same page, plus context-loss handling, plus a 2D fallback for phones
  that refuse WebGL — the fallback then has to be kept looking like the shader, forever;
- this mode runs for an hour in a cradle and battery is its stated price. A fullscreen fragment
  shader at 60 Hz on a phone GPU is not obviously cheaper than the current composition, and it is
  much easier to make accidentally expensive.

Recommendation: **stay in 2D.** The frame the author signed off on was reached without a shader,
and the remaining gap is turbulence, not colour — which can be closed by warping the lobes with
more noise octaves if it ever matters. If the author wants the shader anyway, the honest scope is
"one WebGL layer behind the road canvas, road mode only, with a 2D fallback kept alive" — that is
a milestone of its own, not a tweak, and it is his call to make.

## Tenth pass (M168k, 0.157.0) — the exhaust, and every hull checked

Three things from the author on the field-bloom frame: kill the glow around the ship, rework the
exhaust ("bigger and more visible, longer, and from thirty it should start becoming different"),
and check the other hulls — "they are longer and all that, maybe a proportion".

### The halo around the hull is gone

The idea behind it was right — the ship flies over a lit field, the light should land on it — but
the execution was not: any patch of light around a silhouette reads as a **nimbus**, that is, as a
separate object, not as illumination. Light lands on the ship where it belongs: the flame out of
the nozzles and the trail below.

### The exhaust has two habits, not one setting

At a standstill and in traffic it is a **breath**: short, wide, spreading softly. From 22 km/h an
**afterburner** takes over — the ribbon doubles in length, stops spreading (near-parallel edges
read as a lance, not a cloud), a white-hot thread lights inside it, and the gas starts to shear
sideways. By 55 the habit is new entirely. The crossover is a smoothstep so nothing clicks at the
boundary; at 30 it is already clearly under way, which is what the author asked for.

Three faults were found and fixed on the way, each visible only once the hulls were laid side by
side:

1. **The lanes were adding up.** Each nozzle drew its own filled body, and where the jets converge
   `lighter` summed them — double brightness for two nozzles, sixfold for the Топор's six. The tone
   burned out to white and the trail read as a wall of smoke. All lanes of one burst are now
   **subpaths of a single path, filled once**: overlap adds nothing. The same rule as everywhere
   else in this project — many pieces, one body.
2. **Alpha and colour were pointing in opposite directions.** Brightness lives at the nozzle
   (`u→1`), and there `col` returned `T.mid` — the accent already 42% into cream — and then
   `T.core`, 82% into white. The coloured part of the ribbon (`T.edge`, the hull's own accent) sat
   in the tail where alpha is 0.07. The eye got milk; the colour was where it could not be seen.
   The fix is in the palette, not in the exponents: on the road the middle is pulled back toward
   the accent and only the nozzle cut goes white-hot. The Стриж is mint now, the Вьюк amber — like
   their hulls.
3. **Gas does not have an outline.** One fill, however correctly shaped, reads as a cut-out. The
   same body is now laid **twice** — a wide pale halo and the main body inside it. Two-step falloff
   dissolves the silhouette without a blur and without more points.

### Proportions: length is shared, width is a ceiling

The old fit put the hull in a box, `min(W/bw, H/len)` — and wide ships therefore came out
**shorter** than slim ones: the Вьюк's length on screen was 0.106 of the height against the
Стриж's 0.171, though it is a tug. Now the length is the same for everybody
(`ROAD_SHIP_LEN`) and the width is a ceiling (`ROAD_SHIP_WID`); whoever hits their limit gives up
the slack. Width is measured honestly, by `roadHullHalf` — pylons and tanks — not by the body.

The exhaust was worse. It came off the nozzle radius, and nozzles differ per hull: the combined
jet width ranged from 0.032 of the screen (Клинок) to 0.241 (Топор) — a sevenfold spread, and on
wide hulls the trail was a wall of light across half the screen. Now the **sum** of the jet radii
is a fraction of the hull's half-width, the shares between nozzles stay as drawn, and there are
stops at both ends: a needle must not have a thread for a flame, a slab must not have a bonfire.

### What it costs

Measured with a raster flush, `imageSmoothingQuality:"high"` on the field's upscale cost **19.7 ms**
a frame by itself — in Chrome that is a CPU resampling path, and at a sixfold magnification of a
soft glow it is indistinguishable from bilinear, which costs a third of that. Quality is no longer
set at all. The field is also blitted **only where it glows**: the top 57% is empty by
construction, and compositing it under `lighter` was 43% of the pixels for nothing.

Then the honest number, from the project's own probe (`?g11`, real rAF, GPU on): **60 fps**, level
with every other mode. The flushed figures had been over-stating badly — `getImageData` serialises
the pipeline, so it measures a stall, not a frame. The road is now a permanent step in that probe:
it has the most expensive frame in the game and it lives on a phone.

## Eleventh pass (M168k, 0.158.0) — the money, and paying for what you actually do

The author: «хочется больше кредитов, я еду 5 км до дома как-то скучно за 20 кредитов, мож комбо
за повороты там, за движение назад что-то такое придумай прикольное».

He is right, and the boredom was not only in the size of the number. Two credits a kilometre on a
×1 combo pays ten for a drive home, and the only thing that changed it was **elapsed time** —
sitting on a motorway earned the same multiplier as threading through town. Nothing you did at the
wheel mattered.

Three changes, in ascending order of how much they matter:

1. **The rate is three times what it was** — six credits a kilometre, on the combo.
2. **A corner pays.** Every real corner earns a one-off bonus scaled by its peak, paid **once**,
   on the way out of the arc: while the wheel is turning the peak accumulates, and when the swerve
   falls back below the threshold the bonus lands. Small corrections below the threshold are not
   corners, and below the speed gate nothing pays at all — in a car park there are plenty of
   "corners" and no driving. It lands as a flying credit and a short «ПОВОРОТ +N» by the hull:
   money should be an *event*, which is exactly what the slow counter never was.
3. **The way home pays better.** When the trip's distance from its starting point has grown and
   then falls back by a quarter kilometre, the mode decides you have **turned for home** and the
   rate goes ×1.5 for the rest of the trip. The drive back from work is worth more than the drive
   to it — and the drive back is precisely the one this mode gets switched on for.

What this is worth in practice: five kilometres home, seven or eight minutes, with a few corners
comes to roughly **130 credits** against the old 20.

**The cap, honestly.** It went 1500 → 3000. It does not bind on a commute (a drive home is ~130,
a two-way day ~250) — it binds on a long road trip, which is the case it exists for. The rule from
the very first pass stands: this is a pleasantry, and the economy in
[`docs/DESIGN-economy.md`](DESIGN-economy.md) must not be undermined by a car ride. Speed sanity
(3–1000 km/h, tiered) remains the only other guard, as the author decided on the second pass.
Worth knowing while driving: at the cap, a day of long-distance driving is about half the price of
the Игла. If that turns out to be too much once he has driven with it, the lever to pull is the
cap, not the rate — the rate is what he can feel.

### A trip and a day are different numbers (0.158.1)

The author, straight after: «каждая поездка новые кредиты или в день ограничить, а то не
понятно». It was not clear for a good reason — the screen showed the **day's** total under a line
that said «за поездку». One of those was a lie, and it had been there since the second pass.

Both numbers exist and both matter, so both are on screen and each says what it is:

- **The trip** is the big counter and the kilometres line. It starts at zero every time the mode
  is opened, and it is what a driver actually feels.
- **The day** is a quiet line beneath: «за сутки N из 3 000 кр». The cap becomes something you can
  see approaching instead of a wall you hit. On the first trip of a day the line is hidden — the
  two numbers are equal and repeating one twice says nothing.
- **The journal** reports the trip first, with the day beside it when they differ.

The cap remains a **daily** limit: that is the thing that keeps a car ride from turning into an
income stream, and it is unchanged in kind since the first pass. Credits are earned fresh on every
trip; what is limited is how much a day of driving can be worth.

### Not a cap but a tank (0.159.0)

The author: «ну ты 2 раза ездишь на работу с работы, выходные на дачу далеко, давай поднимем
потолок + типо учтём колебания такие».

A flat daily cap cannot do swings, by construction — it cuts a weekday and a trip to the dacha the
same way, and nobody drives evenly. So it is not a cap any more, it is a **tank**. Every day
`ROAD_DAY_ADD` (2 200) flows into it, it fills up to `ROAD_BANK_MAX` (14 000, about a week), and a
trip spends what has accumulated. The inflow is continuous rather than at midnight — set off in
the morning after a night and part of a day is already in the tank. Clocks moved backwards accrue
nothing.

What falls out of that shape on its own:

| | spends | against an inflow of 2 200 |
|---|---|---|
| a weekday, two commutes | 300–600 | the tank grows |
| a working week | ~2 500 | ends near full |
| the dacha, 300 km there and back | ~6 700 | paid in full out of the week |
| driving all day, every day | — | the sustained ceiling is the daily inflow, and no more |

That last row is the point: this is not a cap that punishes a big day, it is a reservoir that
rewards *not* having driven. And it stays a pleasantry against the game's own numbers — one trade
leg is 300–600 credits and a fully staffed HQ burns 300+ a minute, so the road's whole daily
inflow is about seven minutes of upkeep ([`docs/DESIGN-economy.md`](DESIGN-economy.md)).

On screen the tank is a quiet line under the trip's counter — «запас 14 000 кр» — so it can be
watched going down instead of hitting a wall. Empty, it says so and the mode goes on being
beautiful for free.

A bug the suite caught while this was being written: the accrual read its timestamp as
`R.bts||t`, and a stored zero is falsy — the elapsed time became zero and nothing ever accrued for
that save. `==null` now, as it should have been.
