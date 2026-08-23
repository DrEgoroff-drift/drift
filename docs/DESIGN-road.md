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
