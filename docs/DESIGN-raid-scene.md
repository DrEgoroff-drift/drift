# The raid in one light (M633)

Design for the last step of Stage E of the remake (`DESIGN-remake.md` §4: base and home →
cave → dig → **raid**). Written 09.10.2026 from the scout of `24a-mode-raid`, `24aa`,
`24aa1`, `24ab`, `27f2`, `27f3`, `21phc` (`scratchpad/scout/raid.md`). The laws are
`DESIGN-remake.md` §2 (L2 one astronaut, L3 one generator, L4 one kit and one light, L5 words
on things, L6 one hero) and the hostile form of `DESIGN-bodies.md` §4. The raid's *game* —
the grid, the rooms and corridors, the tank controls, the foes' AI, loot and pickups, the
bag, hostages, the baron — stays whole. Verdict (`DESIGN-remake.md` §3): **keep; one key
light, lit facets, a body per foe role.**

## 1. What is wrong today

`review/ground/raid_a.png`: one hue — a magenta-brown over the floor, the walls, the ceiling
and the fog — because the light is an ambient falloff from the player plus his torch, with no
shadows and no key; so every facet has the same value and the room is a box, not a place. The
foes are paper: a 2D figure baked to a billboard (`raidFoeSprite`), orange with a red band,
standing *on* the loot crate in the frame. The player is a card from behind (`rigCardRaid`),
white against the brown. The only shaped light is the hangar gate's cone. The hero of the
frame is the crate because it is the only saturated thing. The share of the man is right
(.209); the prompt is a line at the bottom. One bug: `rigCardRaid` reads the surface suit
(`G.surf.suit`) for its low-suit look, not the raid's (`21phc:332`).

## 2. The idea in one paragraph

The raid moves onto the **interior renderer** (`r3Frame`, `27f2`) — the same renderer as the
station hall of Stage B, HQ and home of Stage F — so interiors have one kit and one light
pass (L4): walls, floors and props as `r3Kit` bodies in metres, **one key lamp per room with a
shadow map** (at most six in a frame), the man's torch as his own pool and cone, haze and
bloom from the renderer. Every room kind gets its own palette round the wheel and its own
key: the hangar steel-blue under the gate's cold light, the living room amber and rust under
one hanging lamp, the reactor soot lit teal by its core, the store sodium over crates, the
bridge black with cold screens. Foes are **people of the generator** (`27f3`) in a hostile
kit — asymmetric, dark base, rust and soot, one orange accent, two dirty-orange lights, never
the player's blue — a variant per role; the player is **the rig** (`21pha`) in 3D. The way
in is a push through the hangar gate's light, never a cut.

## 3. Composition and the human measure

The raid's metre is the man: 23.6 units = 1.8 m, so `RCELL` = 6.9 m and `RAID_H` = 8.4 m —
tall rooms by design (a pirate base is a hollowed rock); the loft at 52 units is 4 m. The
camera stays third person behind the man (236 units = 18 m back, 78 units = 6 m up, pitch
−.16) and pulls in on wall hits as now; the man keeps his .2 share. The lens is a perspective
of 46° (`r3Persp`), the near plane .3 m. On the phone the camera is 2 m closer and 1 m
higher so the man's feet clear the pads.

The hero is **what the player is about to act on** (L6): the targeted foe, the crate under the
cursor, the gate when leaving — it takes the key's brightest patch and the one saturated
accent; the rest of the room is value, not hue. The man stands against air: his suit's blue
against a dark wall, never against the blue of the bridge's screens (the bridge's key is
cold white, its screens cyan but dim).

## 4. Bones and dressings

New modules after `24ab`: `24ac-raid-r3.js` (the scene on `r3Frame`: the camera, the room
bodies, the lights, the switch `RAID3.on`/`?raid=0`), `24ad-raid-r3-cast.js` (the foes' kit
and poses, the rig's port, loot and pickups as bodies) — each ≤ 40 KB. The old pass (`24aa`'s
quads, `24aa1`'s shader, `24ab`'s sprite) goes behind the switch, never edited.

| Room (`RAID_ROOMS`) | Material | Key light | Dressing |
|---|---|---|---|
| hangar | steel plates, soot, the gate's orange belt | the gate: cold white from outside with a shadow, a cone in the haze | the player's own hull seen through the gate (`hullStudio` of `G.ship` as the far layer), fuel drums, a gantry, chains |
| living | rust panels, a cloth curtain, bunks | one hanging lamp, warm, swinging a little | bunks, a table with bottles, a hung flag of the lair's power, graffiti as decals |
| reactor | soot, pipes, a cage | the core: teal emissive in a cage, its light with a shadow | pipes along the ceiling, a vent's steam (`smoke`), a fuse wall |
| store | grey steel shelves, crates with one orange belt each | a sodium lamp over the shelves | crates, sacks, the loot crate as the hero when near |
| bridge | black panels, cold screens | a cold white key from the console, screens dim cyan | the console, a chair, a star chart on the wall, the baron's seat |
| corridors | concrete, a cable duct with an amber vein (kept), door jambs | the next room's spill only; a lamp every fourth cell | the fuse box, stencils as decals, beacons as small lights |

Fog stays (`r3Frame` haze) but takes the room's key colour, not one tint. Dust motes in the
torch's cone only. The contact shadows of the old pass are replaced by the renderer's maps.

**The foes** (`24ad`): `CP_KIT.pir` with four variants by `FOE_KINDS` — grunt (a plated vest, a
mask), rusher (bare arms, a sprinter's crouch), heavy (a frame of plates, a shoulder lamp),
boss/baron (a long coat, the brand, a second light) — all by `DESIGN-bodies.md` §4; the
generator gains `walk` and `aim` poses (the first walking people of the game; the hall's
keeper of M810 does not walk). Their hp bar shows only when targeted or below 70 %; «БАРОН»
is a plate on him with a leader. **The player**: the rig's bones and parts as `r3Kit` meshes
under the renderer's part matrices (≤ 32; the rig has 13 bones) — `rigR3Mesh()` in `24ad`, the
first 3D port of the rig outside the planet's pass; poses stand/walk/aim/hurt from play; the
torch on the helmet is a spot light of the renderer (no shadow; `vol` on for the cone).
`rigCardRaid` is superseded; its suit bug is fixed in `21phc` in passing (one token).

**Loot and pickups**: crates and kits as bodies with one orange belt; a crate under the cursor
takes the key's hot spot. Shots: short bright rods with a small light at the muzzle; hits a
flash on the body hit, not a screen tint; the hurt flash becomes a red vignette of the
renderer's post, brief.

## 5. The way in and out

Today the mode flips from the system view to the interior. Now the first frame is the camera
**outside the gate** looking in — the hangar's cold light spilling out, the player's hull
behind the camera — and in 600 ms the camera pushes through the gate to its place behind the
man; the system view underneath is not seen (the gate's light fills the frame at the
crossing, white-warm, never black). Leaving is the reverse through the gate into its light,
then the system frame. `enterRaid`/`raidLeave` keep their logic.

## 6. What stays, what goes

- **Stays:** `genRaid`, the cells, `updateRaid` whole (controls, AI, hits, loot, prompts),
  `raidLeave`, hostages and `occSuppress`, the HUD, the 2D marks (beacons, stencils) as
  decals.
- **Goes behind the switch:** `drawRaid`'s quad builders, `raidGpuDraw`, `RAID_WGSL_COMMON`,
  `raidFoeSprite`, `rigCardRaid`'s taker, the 2D hp bar and the hurt flash.
- **Changes:** `cpPose` gains `walk` and `aim`; `CP_KIT` gains `pir`; the rig gets an `r3`
  mesh port; `r3Frame` is called with a moving `vp` for the first time (the hall's camera
  glides; here it follows).

## 7. Milestones

- **M633a The rooms in one light** — `24ac`: the scene on `r3Frame`, bodies per room kind with
  materials, one key per room with shadows, the torch, haze by key, the camera. Gate: the
  five rooms at 1920 and 390; `errs 0`; the lamp count ≤ 6 per frame; vision clean.
- **M633b The people** — `24ad`: the foes by the generator in the hostile kit with walk/aim,
  the rig ported, loot and pickups as bodies, the bar predicate, plates. Gate: a contact
  sheet of the four roles beside the man in the living room's key; the man against air.
- **M633c The gate and the cost** — the push in and out, the hull through the gate, the raid
  ≤ the hall's cost at the same window (`cost.py`), the phone's camera.

## 8. Tests

A Node suite `91qi-raid`: every `RAID_ROOMS` kind has a material set and a key; every
`FOE_KINDS` id has a kit variant; the player's mesh is the rig (no second painter under
`RAID3.on`); the hp bar predicate (targeted or < 70 %); the first frame's camera is outside
the gate and reaches its place within 700 ms of game time; lamps ≤ 6 per frame; `?raid=0`
leaves the old path and the old suite table whole; the `91qb-rig-card` raid taker still
passes with the switch off. A browser suite: enter, cross three rooms, fire, loot, leave —
`errs 0`, no bind group meets a foreign pipeline.
