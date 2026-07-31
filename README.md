<div align="center">

# Дрейф · Drift

**A procedural space game in a single HTML file.**
No build step, no dependencies, no frameworks, not one asset file — every pixel and every sound
is generated at runtime from seeds.

<img src="docs/shots/cockpit1.png" alt="Mining ship cockpit in an asteroid belt" width="100%">

</div>

Pilot a lone survey probe through an endless generated galaxy: prospect planets, tunnel into their
crust, strip asteroid belts, skim gas giants, run trade routes across a living market, found bases,
hire a crew that works while you are away, and board pirate stations on foot.

> **Play it now:** download [`drift.html`](drift.html) and double-click it. That's the whole game —
> one file, offline, no server.

---

## What it looks like

Nothing below is hand-drawn. Hulls, cockpits, terrain, cloud bands, star fields and interiors are
all built from the same seed that names the system you are in.

<table>
<tr>
<td width="50%" valign="top">
<img src="docs/shots/map.png" alt="Galaxy map" width="100%">
<b>The galaxy map is a night sky, not a diagram.</b> Stars emit light instead of sitting on the
background — halo, colour and diffraction spikes come from the spectral class. Depth is darkness:
distant sectors dim, unreachable ones halve. The jump radius is a lit area rather than a hairline
circle, and lanes are drawn only where they mean something.
</td>
<td width="50%" valign="top">
<img src="docs/shots/system.png" alt="Flying through a system" width="100%">
<b>Flight leaves a wake.</b> The exhaust ribbon lives in system coordinates, so a turn draws the
trajectory you actually flew. Its colour comes from the hull and its length from engine thrust and
the fitted engine module — an upgrade is visible in flight, not just in a number.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<img src="docs/shots/cockpit2.png" alt="Research ship cockpit" width="100%">
<b>The cockpit tells you what you fly.</b> A survey ship gets a thin frame, clean plastics and a
hologram over the dash; the miner at the top of this page gets heavy pillars, a cross beam, rivets,
grime and hazard stripes. The canopy opening has real thickness — an outer and an inner contour with
a lit bevel between them.
</td>
<td width="50%" valign="top">
<img src="docs/shots/scoop.png" alt="Skimming a gas giant" width="100%">
<b>Gas giants are flown, not looked at.</b> Latitude bands are not drawn as shapes — they are
stripes warped sideways by two scales of noise, with storms bending the same field, so festoons and
vortices appear on their own. Two parallax echelons give the speed; the collection corridor is a
glowing layer of denser gas you fly inside.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<img src="docs/shots/base.png" alt="Base cross-section" width="100%">
<b>Bases are a cut through the ground.</b> Compartments are carved out of rock as a single path —
planet material over drifting strata, light spilling from the reactor onto the stone. Cells you
never dug are simply not drawn: there is no grid, only rock.
</td>
<td width="50%" valign="top">
<img src="docs/shots/raid.png" alt="Boarding a pirate base" width="100%">
<b>Pirate stations are boarded on foot.</b> The same projection and painter sort the asteroid belt
uses, with walls shaded top-to-bottom, distance haze, ceiling lamps and dust hanging in the beam of
your helmet lamp. The gun you fitted to your ship is the gun you carry.
</td>
</tr>
</table>

---


## Gameplay

### Flying

- **Autopilot** — tap any object to approach, close in, and dock automatically. It aims at an intercept point rather than where the target is right now, so it converges instead of chasing a moving body around its orbit. Near a planet or moon it captures a stable co-rotating circular orbit and holds it until you throttle, brake or turn.
- **Manual control** — thrust, a brake that kills velocity outright, and turning with real angular inertia: the ship carves an arc and banks into it rather than pivoting on the spot. Every key is rebindable (separate layouts for flight and for the belt), and on-screen buttons auto-hide when you are driving from a keyboard.
- **Branching star map** — systems laid out organically with connecting lanes, each with generated flavour text describing its worlds, belt and station. Planets follow elliptical Keplerian orbits; orbital speeds are capped by *tangential* velocity so every body stays catchable even in the starter ship, while distant worlds still move more slowly than close ones.
- **Gravitic anchor** — drift too far from the star and a gentle pull, plus an on-screen compass to the star, station and current target, brings you back. A one-tap "TO STAR" autopilot works from anywhere.
- **Stranded restart** — out of fuel with no way to refuel, you can pay for emergency evacuation; without the credits you get a fresh starter ship at the origin system rather than a dead save.

### Getting materials

- **Surface prospecting** — land on generated terrain (ridges, mesas, dunes, cratered plains, canyons, mixed to suit the world type), mine visible deposits, and scan alien flora and fauna for research data. Click-to-walk works alongside the keyboard; launch lives on its own hold-to-confirm button.
- **Wildlife** — every planet has a genome biasing its plant and animal forms, sizes and hues, so worlds look distinct — ankle-high moss and crystal druses on one, giant trees and oversized fauna on another. Underground the same stock bites through your suit; an EMP pulse stuns them, and a stunned one can be sampled for carbon and rare xenobiome that no rock will ever yield.
- **Deep shafts** — sink a mine on bare ground and tunnel through three depth tiers. Ore lives in scattered veins, highlighted through rock when close or from range with the geo-scanner. Deeper rock is roughly 2× and 4× richer, gated behind drilling tech and pressured by suit wear and cave-ins. Damage underground costs your suit, never your ship.
- **Cave systems** — some planets hide a walkable cave mouth: a winding natural passage lit only by your suit lamp and glowing flora, with hostile fauna and a one-off data find at the far end.
- **Asteroid belts** — a full 3D flight mode flown from a generated cockpit. Pitch, yaw and roll with inertia, the horizon banking into your turns. Rocks break into drifting debris as you mine or shoot them apart.
- **Gas skimming** — gas giants can't be landed on, but you can enter their upper atmosphere and collect volatiles. The scene is a narrow altitude corridor: above it the scoop takes nothing, below it hull heat climbs until the ship burns, and turbulence keeps pushing you out of the band. Flying it is the mechanic, not a progress bar.

### Rare materials

Ordinary ore is cargo looking for a buyer. Four rare materials are the opposite — **the market refuses them entirely**, so they stay goals rather than expensive rows in the hold, and cannot inflate prices. Each has its own verb:

| Material | Source |
|---|---|
| Volatiles | atmospheric skimming on gas giants |
| Ice crystals | belts on distant, cold orbits only |
| Alloys | never mined — smelted from ore at industrial stations or a base refinery |
| Tech components | boarding a pirate base, and nowhere else |

They are spent on the laboratory, base construction and hull fusion. Drones only work materials they can sell, and pirate wrecks never drop rare stock.

### Stations

Six station types, chosen by system seed and how dangerous the sector is. **The type decides which tabs exist at all**, not just what the place looks like:

| Type | What it is for |
|---|---|
| Trade hub | best prices, broad market, weak yard — thins out toward the frontier |
| Industrial | smelts ore into alloys, repairs at half price |
| Shipyard | the only place that builds a one-off unique hull |
| Science | tech tree and the fusion laboratory |
| Frontier outpost | combat crews, weapons, poor prices — common in dangerous space |
| Fuel depot | no tabs whatsoever: fuel and repair only, but found far out |

Each type draws itself procedurally the way hulls do — a shared skeleton of core, dock and lights with the silhouette from the type and the details from the system seed: warehouse pods and cargo booms, blast furnaces with a flare stack, an open slipway with a crane crawling along it, dish antennas and radiator grids, gun turrets, or a bare tank.

### Crew and fleet

Old hulls sitting in your hangar stop being dead weight: **a hire needs one of your ships**, which is the decision the whole system turns on.

- **Mercenaries are generated people** — name, specialty (combat, mining, hauling), two or three traits that are pure multipliers and thresholds. A veteran costs more and comes back. The careful one breaks off early and brings less. The greedy one skims the hold. The stubborn one ignores your first order.
- **Orders** — hunt pirates, mine, run a route, work a base, or sit idle. Each carries a sector and resolves the way drones do: from elapsed time, capped at eight hours offline. No NPCs fly around in the background.
- **Wages and consequences** — pay is drawn on the same lazy clock that pays out. Run dry and debt accrues, morale slips, the log warns you, they work at half strength, then abandon the order, then leave and take the ship against what they are owed. Every step is visible before the last one lands.
- **Damage and repair** — dangerous orders cost hull. Repair is free and slow while idle, instant for credits. A hull reaching zero loses the ship and only sometimes returns the person.
- **Experience** raises both what they produce and what they demand, so a cheap hire becomes an expensive veteran you would rather not lose. Fleet size is a researched licence.
- **Meeting them in space** — fly into a sector where your crew is working and they spawn as a real ship alongside you, built on the pirate NPC frame, shooting at pirates.
- Everything they do lands in the ship's log: deliveries, bounties, damage, warnings.

### Bases

The planet stays flat 2D; the volume comes from **a cut through the ground** — sky and surface on top, buried compartments below, a lift shaft down the middle.

- **The grid is the game.** An empty cell is rock you dig out to place one module: reactor, solar array, drill, storage, habitat, refinery, landing pad.
- **Power is the whole problem.** Running short is not a line in a table — the lights dim across the entire cut and the drill stops turning.
- **Adjacency matters.** A drill wired to a neighbouring reactor loses less; a habitat pressed against one is a worse place to live.
- **Staff** — crew can be posted to a base instead of a ship, in four roles: driller, engineer, guard, logist. Any role is open to anyone, but working outside your speciality halves your contribution.
- **Raids** — pirates come for what is stored there, more often the deeper into dangerous space the base sits. An unguarded raid carries off part of the store and sometimes wrecks a compartment, which sits dark and crossed out until an engineer rebuilds it.
- **The network** — a station panel shows every base, what it digs, how full it is and what is wrong with it. Build a landing pad and you can jump straight there for fuel and credits; station a logist and you can collect the store without flying out.

### Boarding pirate bases

Dangerous sectors hold pirate stations you can board on foot. The map is a 2D grid — rooms carved out, corridors drawn between them so connectivity holds by construction — but it **draws as polygons** through the same projection and painter sort the asteroid belt uses, so this is reuse rather than a second renderer.

- **The gun you fitted to your ship is the gun you carry**, so the build you fly decides how the boarding goes. The suit is your health, the same one the mine models.
- **Four enemy types** share one AI and differ only in numbers: rushers close to arm's length, heavies hold back and hit hard, and the bridge keeps a boss. Which compartment you are in decides who is waiting.
- **Supplies are finite** — ammunition runs out, so the store room matters; medkits and armour plating lie where they make sense and are picked up by walking through them.
- **Rooms have mezzanines** with ramps up, which is what the polygonal renderer was chosen for: floors at two heights, real edges on the drop, camera following you up. Corridors get door jambs, reactor bays pulse with emergency lighting, and a helmet lamp lights whatever you face.
- **Loot is the stake** — reach the hangar to leave with it, or get your suit punctured and lose half on the way out. Progress itself is never rolled back.

### Getting stronger

- **Ships** — eight hand-built hulls plus one-off generated ships that turn up at shipyards and rotate over time.
- **Modules** — seven upgrade tracks (engine, tanks, hold, armour, drill, hyperdrive, gun), four levels each. Buying a level is permanent; fitting it is not.
- **Parts and rigging capacity** — every hull has a rigging budget that modules *and* parts draw from, so you cannot run everything at once. Parts are generated across six categories with one to three affixes, and the strong ones carry a real drawback — a drill that outpaces your turn rate, a shield that costs you thrust. They drop from pirates as containers you fly through, and stations sell a rotating handful.
- **Ship screen** — slots are drawn on the hull itself: a gun point on the wingtip, an engine block at the nacelle, a reactor in the belly. Every candidate part states exactly what it would do to your numbers before you commit.
- **Laboratory** — at science stations, two ships from your hangar plus rare material fuse into a third. Stats blend weighted toward the stronger parent rather than summing, surplus rare stock adds a percentage, and both originals are consumed. Each generation costs 1.8× more and adds a fraction as much, so it is a ladder with a top. The same bench crafts parts from rare material at three tiers.
- **Tech tree** — research paid for with survey data, including repeatable tracks that keep scaling.
- **Return beacon** — researched tech that teleports you back to your lander from anywhere on the planet, on a cooldown.

### Economy and logistics

- **Living market** — every station's prices sag when you dump cargo there and recover over time, so where you sell matters and routes are worth planning. Station type shifts prices on top of that.
- **Mining drones** — buy one, drop it on a deposit or asteroid, fly away. It works in real time, hauls to the nearest station and sells at live prices.
- **Barter shop** — a tab where unique gear costs specific raw resources instead of credits.
- **Ship's log** — a collapsible panel recording what actually happened: kills, drone deliveries, sales, research, discoveries, crew reports, base raids, wrecks. It persists with your save.

### Danger is optional

Pirates are absent near home and increasingly common the further out you push. Fighting has its own gun module and bounty tech, but outrunning or jumping away is always cheap and always valid. Bases, boarding and mercenary hunts are opt-in layers on top, not gates.

## How it looks and sounds

- Every hull is generated from its seed: multi-station fuselage profile, swept wings, engine nacelles, canopy, panel lines, greebles, livery, blinking navigation lights. Banking is a real roll — the silhouette squashes and a shaded belly peeks out. Pirates get their hulls the same way.
- The belt cockpit is generated per hull class: canopy shape, frame weight, metal, wear, hazard striping, holography and indicator colour all follow what you fly, and a laboratory-fused hull gets an asymmetric organic frame nothing else has. The opening has thickness, the glass carries tint, glare, a reflection of the dash and scratches, and the yoke and throttle move with your inputs. What it never does is cover the view: everything laid on the glass is transparent, and the six instruments left on the dash are the ones nothing else already tells you. The ship that sets down on a planet is the ship you fly, on deployed legs.
- Plants, creatures and boulders are generated per world: branching stems with ferns, pods or crowns; critters with their own colours, crests, tails and leg counts; layered strata showing through rock.
- Layered engine flames and an exhaust ribbon that hangs in space where you burned, tinted by the hull and stretched by the engine module. Attitude jets fire against the turn, the way a real pair does — bow thruster one way, stern thruster the other — and braking uses the bow jets instead of spinning the ship around. Faceted rotating asteroids lit by the system's own star, ringed gas giants, a generated nebula and coloured twinkling starfields.
- A graphics page dials draw distance, model detail, particle density and surface life density up or down, with presets, to trade looks for performance.
- **Every sound is synthesised at runtime** — there is not one audio file in the project. Oscillators, filtered noise and envelopes make the engine hum that rises with throttle, weapon fire, hull hits, the drill, footsteps that follow your actual walk cycle, low-fuel warnings. Guns take their timbre from the fitted part's seed, and each creature's call comes from its own seed. Music, effects and engine get separate volume sliders.
- **Generative music** — no tracks, just six layers (drone, bass, motif, beacons, percussion, atmosphere) drifting in and out, so there is no loop to notice. Notes swell over a second or more and trail into synthesised reverb and feedback delay. The beacon voice is brown noise squeezed through a very narrow band-pass filter, which turns noise into a pitch that breathes. The melody is a real phrase that walks the scale, sometimes answered a beat later by a third or a fifth. Sixteen modes are in play; each location has its own mode and tempo — lydian and unhurried in open space, whole-tone on the star map, locrian and sparse in caves — and planets pick theirs from the same genome that decides their plants, so every world sounds the same each time you return. A single tension value (pirates closing, a battered hull, mine depth) tightens the rhythmic grid and thickens percussion on its own, instead of switching to a combat track.

## Persistence

Local autosave, portable base64 save codes for moving between devices, and optional cloud sync against your own server. The save format is `v4` and stays that way: **every new feature is added with a safe default**, so a save written before crews, bases, alloys or fusion existed still loads — it simply has none of them. Anything derivable from a seed (systems, orbits, belts, station types, pirate bases, base geology) is regenerated rather than stored; only your decisions and what you carried home persist.

## Project structure

| File | Purpose |
|---|---|
| [`drift.html`](drift.html) | The entire game in one self-contained file — open it directly to play. **Built from `src/`; don't edit it by hand.** |
| [`src/`](src) | The sources: `index.html` shell, `style.css`, and 52 JavaScript modules (core maths and RNG, galaxy, planets, ships, parts, audio, music, economy, crew, save, one per game mode, UI). Concatenated in filename order, since it all shares one scope. |
| [`build.ps1`](build.ps1) | Rebuilds `drift.html` from `src/`. No dependencies — PowerShell, because Node isn't assumed. Pass `-Watch` to rebuild on save. |
| [`server.js`](server.js) | Optional zero-dependency Node.js server (Node 18+) for self-hosting and persisting cloud saves to a `./saves` folder. |
| [`worker.js`](worker.js) | Optional Cloudflare Worker alternative, storing saves in a KV namespace. |
| [`CLAUDE.md`](CLAUDE.md) | House rules for working on the code: what lives where, what must not change, how to verify. |
| [`PLAN.md`](PLAN.md) | The design log — each milestone, what problem it solved and why it was built that way. |
| [`PATCHNOTES.md`](PATCHNOTES.md) | One entry per version, in plain language: what changed and what it fixed. |

## Running it

**Just play it:** open `drift.html` in any modern browser. No server, no build, no dependencies.

**Work on it:** edit files under `src/`, then rebuild.

```bash
powershell -ExecutionPolicy Bypass -File build.ps1
```

Module order matters — the whole game shares one scope, so constants and tables must be declared before anything reads them at top level. A new module gets a new numeric prefix in the right place; fractional steps (`19a-`) avoid renaming its neighbours.

**Self-host with cloud saves:**

```bash
node server.js
```

Then point the `CLOUD` config inside `drift.html` at your server's `/save` endpoint to enable cross-device saves instead of manual codes. Set `PORT` to use something other than 8080.

## Status

Actively evolving. The planned milestone queue — celestial mechanics, station types, rare materials, mercenaries, bases, the laboratory and the boarding mode — is complete; mechanics, content and balance are still being iterated on. Balance numbers in particular are tuned against measurements rather than long play sessions, so they move.
