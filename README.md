# Drift

**Drift** is a procedural space-exploration and mining game that runs entirely in a single HTML file — no build step, no dependencies. Pilot a lone survey probe through a procedurally generated sector, dock with stations and derelicts, mine asteroids, and manage fuel, hull integrity, and cargo hold as you push further from home.

## Gameplay

- **Autopilot navigation** — tap any object on screen to automatically approach, close in, and dock with it.
- **Manual control** — direct thrust and rotation for fine maneuvering.
- **Brake** — bleeds off velocity to a full stop.
- **Action button** — context-sensitive: land, drill, or enter an asteroid belt.
- **Asteroid belts** — switch to a full 3D flight mode and mine ore straight out of the rocks.
- **Economy** — trade ore and salvage, manage a wallet, and upgrade your probe.
- **Save codes** — export/import a portable save code to move progress between devices without a server.

## Project structure

| File | Purpose |
|---|---|
| [`drift.html`](drift.html) | The entire game — rendering, simulation, UI, and save/load logic in one file. Open it directly in a browser to play. |
| [`server.js`](server.js) | Optional zero-dependency Node.js server (Node 18+) for self-hosting the game and persisting cloud saves to a `./saves` folder. |
| [`worker.js`](worker.js) | Background worker used by the game (e.g. offloaded computation for the simulation). |

## Running it

**Just play it:** open `drift.html` in any modern browser.

**Self-host with cloud saves:**

```bash
node server.js            # starts on port 8080
PORT=3000 node server.js  # or pick a custom port
```

Then point the `CLOUD` config inside `drift.html` at your server's `/save` endpoint to enable cross-device cloud saves instead of manual save codes.

## Status

Actively evolving — mechanics, content, and balance are still being iterated on.
