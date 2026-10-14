# Playtest surface, 0.493.3 (local 127.0.0.1:8814, tab tab-7)

Status: PARTIAL. Only launch, start and landing entry were checked. Walking, mining, fauna, weather, base, mine and takeoff were NOT played.

## Steps done
1. Opened http://127.0.0.1:8814/drift.html in own tab tab-7. Title OK. document.hidden/visibilityState overridden to visible.
2. start(true) (easy landing). Mode "system", intro hidden.
3. startLanding(first non-gas planet, type terran). After 3 s mode = "landing", screenshot shows the landing HUD (fuel, hull, cargo, grid, nav pane) and dark terrain. No JS exceptions counted.
4. Held key 'd' for 1.5 s in landing: no visible reaction measured yet (ship x/y not read, so unverified).

## Console
- warn: requestAdapter powerPreference ignored on Windows (browser, harmless).
- error x2: 501 "Unsupported method (POST)" on POST /log.php. Source: src/01a-crashlog.js:35 (crash log send), plus telemetry in 11ag-trace.js:84, 14a-cloud.js:73, 25j-post-wire.js:50. The local static server rejects POST. Not a game bug on drift-game.ru, but crash logs and traces silently fail on this stand. Suggestion: return 200 on the stand or skip POST when location is 127.0.0.1.

## Not checked (todo for next pass)
- Walking on surface, stick/keys, collision with terrain and rocks.
- Hanging or buried objects: no check done.
- Mining, creatures, weather, base/house, mine, takeoff.
- Frame rate in landing (no measure taken).

## Suggestion
Next pass: read G.ship position before and after key hold to confirm movement; read dbg() on landing; then walk and mine on the planet surface.
