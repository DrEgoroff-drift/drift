# Drift

**Drift** is a procedural space-exploration and mining game that runs entirely in a single HTML file — no build step, no dependencies, no frameworks. Pilot a lone survey probe through an endless procedurally generated galaxy: prospect planets, tunnel into their crust, strip asteroid belts, run trade routes across a living market, leave drones working while you're away, and decide whether the pirates on the frontier are worth fighting.

## Gameplay

**Flying**
- **Autopilot** — tap any object to approach, close in, and dock automatically.
- **Manual control** — thrust, a brake that kills velocity outright, and turning with real angular inertia: the ship carves an arc and banks into it rather than pivoting on the spot.
- **Branching star map** — systems are laid out organically with connecting lanes, each with generated flavor text describing its worlds, belt, and station.

**Getting ore**
- **Surface prospecting** — land on generated terrain (ridges, mesas, dunes, cratered plains and canyons, all mixed to suit the world type), mine visible deposits, and scan alien flora and fauna for research data.
- **Wildlife** — harmless generated creatures graze on the surface and wander off if you crowd them. The same stock underground is not harmless: burrowers bite through your suit. An EMP pulse stuns them, and a stunned one can be sampled for carbon and rare xenobiome, which no rock or asteroid will ever yield.
- **Deep shafts** — sink a mine anywhere on bare ground and tunnel down through three depth tiers. Deeper rock is roughly 2× and 4× richer, gated behind drilling tech, and pressured by suit wear and occasional cave-ins. Damage underground costs your suit, never your ship.
- **Asteroid belts** — a full 3D flight mode flown from a procedurally built cockpit. Pitch, yaw and roll with inertia; the horizon banks into your turns. Rocks are scattered far enough that reaching them is the trip, and they break into drifting debris when you mine them out or shoot them apart — the chunks are harmless and fade on their own.

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

**Keeping track**
- **Ship's log** — a collapsible panel that records what actually happened: kills, drone deliveries, sales, purchases, research, discoveries, jumps, cave-ins and wrecks. It persists with your save, so you can come back after a week and read what you were doing.

**Looking at it**
- Every hull is generated from its seed — a multi-station fuselage profile, swept wings, engine nacelles, canopy, panel lines, hull greebles, livery and blinking navigation lights. Pirates get their own hulls the same way, so no two raiders look alike.
- The belt cockpit is generated too: canopy frame, overhead thruster housings, side screens, a raised console with button grids, and a yoke and throttle that move with your inputs. Its proportions follow the ship you are flying.
- The ship that sets down on a planet is the ship you actually fly — same generated hull, on deployed landing legs.
- Plants, creatures and boulders are all generated per world: branching stems with ferns, pods or crowns, critters with their own colours, crests, tails and leg counts, and layered strata showing through the rock.
- Layered engine flames, an exhaust trail that hangs in space where you burned, and thruster puffs when you turn by hand.
- Faceted rotating rocks in asteroid rings, ringed gas giants, a generated nebula, coloured twinkling starfields.

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
