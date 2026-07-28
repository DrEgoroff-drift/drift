# Drift

**Drift** is a procedural space-exploration and mining game that runs entirely in a single HTML file — no build step, no dependencies, no frameworks. Pilot a lone survey probe through an endless procedurally generated galaxy: prospect planets, tunnel into their crust, strip asteroid belts, run trade routes across a living market, leave drones working while you're away, and decide whether the pirates on the frontier are worth fighting.

## Gameplay

**Flying**
- **Autopilot** — tap any object to approach, close in, and dock automatically. Near a planet or moon it doesn't just get close and stall out — it captures a stable circular orbit around the body and holds it (co-rotating, no drift) until you throttle, brake or turn manually.
- **Manual control** — thrust, a brake that kills velocity outright, and turning with real angular inertia: the ship carves an arc and banks into it rather than pivoting on the spot. Every key is rebindable (separate layouts for flight/planet and for the belt) from Settings, and on-screen buttons can auto-hide whenever you're driving from a keyboard or mouse.
- **Branching star map** — systems are laid out organically with connecting lanes, each with generated flavor text describing its worlds, belt, and station. Planets follow real elliptical (Keplerian) orbits at a slower, calmer pace; gas giants dwarf rocky worlds, and many planets carry their own moons — pick a moon or the planet itself to land on.
- **Gravitic anchor** — drift too far from the star and a gentle pull (plus an on-screen compass to the star, station and current target) brings you back, so the open galaxy never turns into getting lost in empty space. A one-tap "TO STAR" autopilot works from anywhere.
- **Stranded restart** — run out of fuel on a planet with no way to refuel, and you can pay for an emergency evacuation to the nearest station; without the credits for that, you get a fresh starter ship back at the origin system rather than a dead save.

**Getting ore**
- **Surface prospecting** — land on generated terrain (ridges, mesas, dunes, cratered plains and canyons, all mixed to suit the world type), mine visible deposits, and scan alien flora and fauna for research data. Click/tap-to-walk works alongside the keyboard, and launch/evacuation lives on its own hold-to-confirm button so mining next to the lander can't accidentally send you back to orbit.
- **Wildlife** — harmless generated creatures graze on the surface and wander off if you crowd them. Every planet has its own "genome" — a bias toward certain plant and animal forms, sizes and hues — so worlds actually look different from each other, from ankle-high moss and crystal druses to towering giant trees and oversized fauna. The same stock underground is not harmless: burrowers bite through your suit. An EMP pulse stuns them, and a stunned one can be sampled for carbon and rare xenobiome, which no rock or asteroid will ever yield.
- **Deep shafts** — sink a mine anywhere on bare ground and tunnel down through three depth tiers. Ore now lives only in scattered veins (highlighted through the rock once you're close, or from further away with the geo-scanner) rather than everywhere, so finding a rich pocket is the point. Deeper rock is roughly 2× and 4× richer, gated behind drilling tech, and pressured by suit wear and occasional cave-ins. Damage underground costs your suit, never your ship.
- **Cave systems** — some planets hide a walkable cave mouth alongside the mine shaft: a winding natural passage (not a dig) lit only by your suit lamp and glowing cave flora, home to its own hostile fauna and a one-off data find at the far end.
- **Asteroid belts** — a full 3D flight mode flown from a procedurally built cockpit. Pitch, yaw and roll with inertia; the horizon banks into your turns. Rocks are scattered far enough that reaching them is the trip, and they break into drifting debris when you mine them out or shoot them apart — the chunks are harmless and fade on their own.

**Making it pay**
- **Living economy** — every station's prices sag when you dump cargo there and recover over time, so where you sell actually matters and trade routes are worth planning.
- **Mining drones** — buy one, drop it on a deposit or asteroid, fly away. It keeps working in real time, hauls to the nearest station, and sells at live prices without you.
- **Barter shop** — a station tab where unique gear costs specific raw resources instead of credits.

**Getting stronger**
- **Ships** — eight hand-built hulls plus one-off procedurally generated ships that turn up at some stations and rotate over time.
- **Modules** — seven upgrade tracks (engine, tanks, hold, armor, drill, hyperdrive, gun), four levels each. Buying a level is permanent, but fitting it is not: modules can be pulled off and put back at no cost.
- **Parts and rigging capacity** — every hull has a rigging budget that modules *and* parts draw from, so you can't run everything at once. Parts are generated: six categories (gun, shield, engine, plating, reactor, utility), one to three affixes, and the strong ones come with a real drawback — a drill that outpaces your turn rate, a shield that costs you thrust. They drop from destroyed pirates as containers you have to fly through and collect, and stations sell a rotating handful. Hulls have their own slot layouts, so a courier fields two guns where a freighter fields plating and utility bays. Shields absorb damage before your hull and recharge once nobody is shooting at you.
- **Ship screen** — open your ship and the slots are drawn on the hull itself: a gun point on the wingtip, an engine block at the nacelle, a reactor in the belly. Tap a slot to see what fits it, and every candidate part lists exactly what it would do to your numbers — thrust, hull, cargo, drill, cooldown — before you commit. Parts you don't want break down into materials.
- **Tech tree** — research paid for with survey data, including repeatable tracks that keep scaling so there's always something left to chase.
- **Return beacon** — researched tech that teleports you back to your lander from anywhere on the planet, on a cooldown.

**Danger (optional)**
- **Pirates** — absent near home, increasingly common the further out you push. Fighting is a bonus activity with its own gun module and bounty tech; outrunning or jumping away is always cheap and always valid.

**Keeping track**
- **Ship's log** — a collapsible panel that records what actually happened: kills, drone deliveries, sales, purchases, research, discoveries, jumps, cave-ins and wrecks. It persists with your save, so you can come back after a week and read what you were doing.

**Looking at it**
- Every hull is generated from its seed — a multi-station fuselage profile, swept wings, engine nacelles, canopy, panel lines, hull greebles, livery and blinking navigation lights. Banking is a real roll now — the silhouette squashes and a shaded belly peeks out from the side you're leaning into, instead of just skewing sideways. Pirates get their own hulls the same way, so no two raiders look alike.
- A graphics settings page lets you dial draw distance, model detail, particle density and surface plant/animal density up or down (with quick presets), to trade looks for performance on slower machines.
- The belt cockpit is generated too: canopy frame, overhead thruster housings, side screens, a raised console with button grids, and a yoke and throttle that move with your inputs. Its proportions follow the ship you are flying.
- The ship that sets down on a planet is the ship you actually fly — same generated hull, on deployed landing legs.
- Plants, creatures and boulders are all generated per world: branching stems with ferns, pods or crowns, critters with their own colours, crests, tails and leg counts, and layered strata showing through the rock.
- Layered engine flames, an exhaust trail that hangs in space where you burned, and thruster puffs when you turn by hand.
- Faceted rotating rocks in asteroid rings, ringed gas giants, a generated nebula, coloured twinkling starfields.

**Hearing it**
- Every sound is synthesised at runtime — there is not a single audio file in the project. Oscillators, filtered noise and envelopes make the engine hum that rises with your throttle, weapon fire, hull hits, the drill, footsteps that follow your actual walk cycle, and low-fuel warnings. Guns take their timbre from the fitted part's seed, so different weapons sound different for free, and each creature's call comes from its own seed. Music, effects and engine each get their own volume slider — the engine needs one because it is the only continuous sound — and audio only starts after your first input, the way browsers require. The engine is silent unless it is actually firing.
- **Generative music** — no tracks, just five layers (drone, bass, motif, percussion, atmosphere) that drift in and out, so there are no seams and no loop to notice. The melody is a real phrase — a short line that walks the scale rather than picking notes at random — repeated with shifts so it stays recognisable without wearing out. Each location has its own mode and tempo: lydian and unhurried in open space, whole-tone on the star map, locrian and sparse in caves, phrygian and driving in a fight. Planets pick their mode, key and tempo from the same genome that decides their plants and creatures, so every world has its own music and sounds the same each time you return. A single tension value — pirates closing in, a battered hull, mine depth — thickens the percussion and motif on its own, then lets them thin out again, instead of switching to a separate combat track.

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
