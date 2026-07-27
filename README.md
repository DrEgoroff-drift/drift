# Drift

**Drift** is a procedural space-exploration and mining game that runs entirely in a single HTML file — no build step, no dependencies, no frameworks. Pilot a lone survey probe through an endless procedurally generated galaxy: prospect planets, tunnel into their crust, strip asteroid belts, run trade routes across a living market, leave drones working while you're away, and decide whether the pirates on the frontier are worth fighting.

## Gameplay

**Flying**
- **Autopilot** — tap any object to approach, close in, and dock automatically.
- **Manual control** — direct thrust, rotation, and a brake that kills velocity outright.
- **Branching star map** — systems are laid out organically with connecting lanes, each with generated flavor text describing its worlds, belt, and station.

**Getting ore**
- **Surface prospecting** — land and mine visible deposits, and scan alien flora for research data.
- **Deep shafts** — sink a mine anywhere on bare ground and tunnel down through three depth tiers. Deeper rock is roughly 2× and 4× richer, gated behind drilling tech, and pressured by suit wear and occasional cave-ins. Damage underground costs your suit, never your ship.
- **Asteroid belts** — a full 3D flight mode; cut ore straight out of procedurally meshed rocks.

**Making it pay**
- **Living economy** — every station's prices sag when you dump cargo there and recover over time, so where you sell actually matters and trade routes are worth planning.
- **Mining drones** — buy one, drop it on a deposit or asteroid, fly away. It keeps working in real time, hauls to the nearest station, and sells at live prices without you.
- **Barter shop** — a station tab where unique gear costs specific raw resources instead of credits.

**Getting stronger**
- **Ships** — eight hand-built hulls plus one-off procedurally generated ships that turn up at some stations and rotate over time.
- **Modules** — seven upgrade tracks (engine, tanks, hold, armor, drill, hyperdrive, gun), four levels each.
- **Tech tree** — research paid for with survey data, including repeatable tracks that keep scaling so there's always something left to chase.
- **Return beacon** — researched tech that teleports you back to your lander from anywhere on the planet, on a cooldown.

**Danger (optional)**
- **Pirates** — absent near home, increasingly common the further out you push. Fighting is a bonus activity with its own gun module and bounty tech; outrunning or jumping away is always cheap and always valid.

**Persistence**
- Local autosave, portable base64 save codes for moving between devices, and optional cloud sync against your own server.

## Project structure

| File | Purpose |
|---|---|
| [`drift.html`](drift.html) | The entire game — rendering, simulation, UI, and save/load logic in one file. Open it directly in a browser to play. |
| [`server.js`](server.js) | Optional zero-dependency Node.js server (Node 18+) for self-hosting the game and persisting cloud saves to a `./saves` folder. |
| [`worker.js`](worker.js) | Optional Cloudflare Worker alternative to `server.js`, storing saves in a KV namespace. |

## Running it

**Just play it:** open `drift.html` in any modern browser.

**Self-host with cloud saves:**

```bash
node server.js
```

Then point the `CLOUD` config inside `drift.html` at your server's `/save` endpoint to enable cross-device cloud saves instead of manual save codes. Set `PORT` to use something other than 8080.

## Status

Actively evolving — mechanics, content, and balance are still being iterated on. Saves are format `v4`; new features are added with safe defaults so older saves keep loading.
