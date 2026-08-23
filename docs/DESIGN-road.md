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
