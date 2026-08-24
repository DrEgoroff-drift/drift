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
