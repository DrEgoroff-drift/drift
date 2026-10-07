# Bodies for everyone — the system view's ships and the station (M820)

Design for Stage C's first milestone (`DESIGN-remake.md` §4). Written 09.10.2026 from the
scout of `17-mode-system`, `17c-system-draw`, `17c2a-hull3d`, `12i-pirate-hull`, `12l-barge`,
`17f-sys-traffic`, `12ai-fleet`, `13-pirates` (`scratchpad/scout/flight_bodies.md`). The laws
are those of `DESIGN-remake.md` §2; nothing here overrides them.

## 1. What is there today (corrected verdict)

The §3.1 verdict said «sprites beside a 3D hero». Half of it was wrong: **pirates, NPC power
ships, allies and NPC wrecks are already bodies** (M710: `gpuPirateBody` → `h3dPirate` →
`h3dPirMesh`, a loft of the 2D art's polygons with plates, barrels and turret balls). They are
kind 2 (§2.1): accepted, judged, fixed in place. What is still flat: **barges** (`gpuBargeBody`,
a lit sprite of a 2D bake), **barge wrecks** (2D polygons), **shuttles** (10×6 sprite), **lane
and fleet ships** (`fleetShipAt`, flat), **drones** (lights only — and they stay lights), and
**the station** — a top-down 2D bake of 160·s px (272 px at zoom 1) with bright coloured
squares, drawn by `gpuLitSprite`, lit by its own lamps as shapes. Lighting: 16 point lights
(`gpuLight`) and circle occluders (`GPU.oc`) exist and already shade hulls; there is no
body-on-body shadow and no `sunDir` — every caller computes the direction to the star at
(0,0).

What reads wrong on the frames (`s_foes.png`, `st_station.png`): the station is a flat
patchwork of saturated chips, not a thing in the dark; the barge is a flat strip of coloured
crates; a pirate at 760 is a 20 px smear whose only hostile sign is a red bar; the player's
hero hull is the one body with volume, so everything else looks like a port.

## 2. The idea in one paragraph

Everything that flies or stands in the system is a **body** under the same star: a loft of
the hull kit, lit from the star's direction, shaded by itself and by the occluders, with its
own lamps. A **hostile** ship is hostile by its **form and its light**, not by a bar: dark hull,
rust and soot, spikes and asymmetry, dirty orange running lights and exhaust. A **neutral**
power ship is clean and symmetric in its power's colours. A **barge** is a spine with cargo
frames and a tug head, slow and heavy. The **station** is the biggest body of the system: a
spine, a ring or a slab by its type, modules along the spine by its maker, a dock mast, and
**warm windows** — the only warm light of people in the dark — with its modules shadowing each
other and the station shading what passes behind it. Bars appear only for the hurt and the
targeted.

## 3. The bodies

| What | Today | M820 | Builder |
|---|---|---|---|
| player | `hullGpuDraw` → `h3dDraw` | unchanged | — |
| pirates, NPC, allies | `h3dPirMesh` | kept; the hostile dressing (§4); LOD below 14 px | `12i`, `17c2a` |
| barges | 2D bake sprite | `h3dBargeMesh`: spine tube, 3–6 cargo frames (boxes with a rib), a tug head (short loft of the maker's profile), engines; the maker's ground and stripe | new `17c2d-body-barge.js` |
| barge wrecks | 2D polygons | the barge mesh broken: two halves, the frames scattered within 1.5 L, soot | same module |
| shuttles | 10×6 sprite | a 3-piece body (hull box, two pods) at ≥ 14 px; a two-light dot below | `17f` via the new kit |
| lane / fleet ships | flat `fleetShipAt` | `hullGpuDraw` of the fleet hull (FLEET rows carry `by`) at ≥ 14 px; a lit dot below | `12ai1`, `17g` |
| drones | lights + tails | unchanged (a light is a light) | — |
| station | top-down 2D bake | `h3dStationMesh` (§5), 272 px at zoom 1 as now, cache per station | new `17c2e-body-station.js` |

All new meshes go through `h3dKit` (12-float vertices, `h3dPack`) and `h3dRun`, so they
share the hull shader, the star direction, the 16 point lights and the occluders. The switch
is `BODY.on` (true by default; `?body=0` the old sprites until M890).

## 4. The hostile form and the bars

A pirate reads hostile at 760 without any bar:
- **Form.** Asymmetric: one spike or ram longer than the other side, a turret ball off axis,
  plates missing on one flank (the existing plates-on-heightmap, with holes by seed).
- **Material.** Dark base (value ≤ .35), rust and soot (the `21pie` people's palette), one
  accent only — orange, never the player's blue.
- **Light.** Running lights dirty orange, two, not symmetric; exhaust orange-brown with soot
  motes, longer than a neutral's. A neutral power ship: white nav lights, a clean blue-white
  exhaust, the power's colour on the fin.
- **Bars.** The red hp bar is drawn only for the **targeted** pirate and for any pirate **hurt
  below 70 %**; unhurt, unaware pirates show nothing but the name label (the label is M826's
  business). NPC power ships never get a red bar unless they are hostile by `iff`.
- **Rogue / hunter** keep their marks (the thread above), as today.

## 5. The station body

The station is built per type and maker, from the same bones so the dock mast and the moored
barge find their places:
- **Spine**: a tube along the station's axis, length 1.0 L; **dock mast** at the near end
  with four lamp heads (warm) and the moored barge's berth (`drawMooredBarge` keeps its
  offset).
- **Core by type**: trade — a ring around the spine (lathe), windows in a band; indust — a
  slab with two chimneys and a hot vent (orange emissive); yard — an open hangar frame (two
  rails and a crane beam) with a hull on the slip (a FLEET hull at .6 scale); sci — a sphere
  with a dish; outpost — a short spine, a gun turret, one lamp; fuel — spine + four tanks
  (lathes) and a hose arm; bazaar — the ring, hung with cloth panels of three colours and
  twice the lamps.
- **Modules** along the spine by the maker's forms (`makerForms`), 4–9 boxes with ribs, the
  maker's ground, stripe and wear.
- **Lamps**: warm windows as emissive panels in the mesh (the only warm light), plus 2–4
  `gpuLight` points (the dock mast, the hangar) so the moored barge and docking ships are lit by
  them; cold tube lamps only on indust and sci.
- **Shadow**: the modules shadow each other and the spine in the h3d self-shadow; the station
  keeps its circle occluder so ships behind it are in its shade; no further shadow map.
- **Size**: 272 px at zoom 1 as today (`s=clamp(Z,.4,1.5)*1.7`), the label at the same place.

## 6. Light rule for the system

One star. Every body computes `(lx,ly)` to (0,0) as today — M820 adds one helper
`sysLightDir(x,y)` in the new kit module so no caller repeats the maths and the fallback
`(-.86,-.51)` disappears. The point lights are people's lamps (station, barges' nav lights,
the hero's). Nothing else emits.

## 7. Gate and tests

- **Gate**: the foes pair at 760 — one frame with the station, a barge, two pirates (one
  targeted) and a neutral power ship, at zoom 1 and zoom 2.4; a frame at 1920 of the station
  alone at zoom 3. Judged: the station reads as a thing in the dark with people's windows;
  the pirate reads hostile without a bar; the barge is heavy. `errs 0`, `test.ps1` green,
  vision clean (the bars are canvas interface — they stay inside `withScale(UIK)`).
- **Tests** (`tests/91qd-bodies.js`, Node): every `ST_TYPES.id` builds a station mesh under the
  h3d limits; every FLEET class resolves to a hull for `hullGpuDraw`; the barge mesh has
  3–6 frames by capacity; `?body=0` leaves the draw calls as before; the hp bar predicate is
  false for an unhurt, untargeted, unaware pirate and for an NPC with friendly `iff`.
- **Cost**: the station mesh is baked once per station (cache 4), barges per `by`+cap (cache
  12); fleet hulls through the existing LRU. Below 14 px no mesh is drawn.
