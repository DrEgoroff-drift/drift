# Drift — 3D inventory (Stage 1 of the art audit)

Branch `art/3d-audit`. This file is the catalogue required by stage 1 of the art brief: every 3D
entity in Drift, where it lives, how it is built, where it is used, how close the camera gets, what
materials and animation it has, and how hard it would be to replace.

Nothing in this document has been changed in the game yet. It is a map, not a plan — the A/B/C/D
verdicts and the rework plan are stage 3 and live in `ART-3D-PLAN.md`.

---

## 0. How 3D is built in Drift — this decides what Blender can even do

Drift has **no asset loader**. There is no GLB/OBJ/FBX path, no texture files for models, no
material graphs. Two engines build everything at runtime:

| Pipeline | Entry point | What it makes | Where |
|---|---|---|---|
| **`h3dKit`** — the mesh kit | `17c2a-hull3d.js:27` | verts/colours in one interleaved buffer: `loft`, `lathe`, `box`, `prism`, `tube`, `face` | ships, station bodies, props, giants, rail |
| **`bodyMesh`** — the mesh cache | `17c2e-body-kit.js:58` | keeps the last N meshes per key, evicts the oldest, throws buffers to `GPU.trash` | every `body*` builder |
| **`r3`** — the interior renderer | `27f2-room3d.js` | MRT haze, mip bloom, shadows, materials-as-patterns, two-part skinning | rooms, people, cantina hall, faces |
| **GPU passes** — procedural surfaces | `17g` (system), `21pe` (planet surface), `22d` (cave), `24be` (belt), `24aa1` (raid) | everything that is a *place*, not a *body* | planets, terrain, caves, asteroid fields |

Consequences for the audit, stated plainly:

- A Blender model **cannot be dropped into the game**. It has to be converted into `h3dKit`
  primitives (`V`/`C` arrays) or into an `r3` mesh, offline. That converter does not exist yet.
- Colour is **per-vertex**, not per-material. There are no PBR maps, no roughness textures, no
  normal maps for any body in the game. Materials are faked with vertex colour + a lit shader
  (`17c2a` material, `08cd-gpu-mat`).
- Therefore "add PBR textures" from the brief is **not available** without first building a
  texture path in the renderer. Any art upgrade has to work with vertex colour and silhouette.
- Every mesh is **procedural and seeded**: the same hull id always produces the same ship. Replacing
  a builder changes the whole population, not one instance.

---

## 1. Player and NPC ships

| Object | Builder | Used by | Camera | Source | Materials | Replace |
|---|---|---|---|---|---|---|
| Player hulls (all classes) | `h3dMesh` (`17c2a-hull3d.js:135`) via `h3dParts` (`17c2b`) | flight, dock, yard, ОПИСЬ | 40–400 px, close at the yard | procedural from `hullOf(id)` | vertex colour, one lit material | **hard** — the hull is the game's silhouette and every part slot rides on it |
| Ship parts / modules | `h3dPartsGen` (`17c2b-parts3d.js:158`) | fitted parts, yard | close (yard, ОПИСЬ panel) | procedural | vertex colour | medium — isolated builder, own gear table |
| Fleet hulls | `bodyFleetHull` (`17c2e:72`) | NPC traffic, lanes, escorts | 60–300 px | procedural | vertex colour | medium |
| Shuttles | `bodyShuttleMesh` (`17c2e:91`) | stations, surface | 80–300 px | procedural | vertex colour | medium |
| Pirates | `h3dPirMesh` (`17c2a:684`) + `bodyPirDress` (`17c2h`) | combat | 80–400 px, close in combat | procedural, per-rank dress | vertex colour | medium |
| Barges and wrecks | `h3dBargeMesh` / `h3dBargeWreck` (`17c2f`) | trade routes, salvage | 100–400 px | procedural from cap + owner | vertex colour | medium |
| Giants (7 kinds) | `h3dGiantMesh` (`17o-giants.js:98`) | system backdrop | 200–800 px, never close | procedural from seed | vertex colour | **large** — these are the biggest silhouettes in the game |
| Rail car / ring | `18gb-rail-car`, `18fa-rail-ring` | travel | 80–300 px | procedural | vertex colour | medium |

## 2. Stations

| Object | Builder | Used by | Camera | Notes |
|---|---|---|---|---|
| Station body (all types) | `h3dStationMesh` (`17c2g-body-station.js:113`) | dock, orbit, lanes | 100–600 px; close in the hall | ring + modules from `stype`, owner and seed |
| Station craft on the slipway | `bodyStCraft` (`17c2g1`) | hall, yard | close | small |

## 3. Props and small bodies

| Object | Builder | Notes |
|---|---|---|
| Buoys | `bodyBuoyMesh` (`17c2j`) | lane markers, seen constantly at distance |
| Gesture post | `bodyGestPostMesh` (`17c2l`) | the owner's post at the system entry |
| Finds | `bodyFindMesh` (`17c2i`) | 416-line builder, the largest prop |
| Cheburek stall | `bodyChebMesh` (`17c2k`) | |
| Bulletins | `bodyBbMesh` (`17c2m`) | |
| Relay body | `11apa-relay-body` | the mast, seen from far |
| Drones, motes, belt rocks | `16ga`, `24be`, GPU passes | instances, not meshes |

## 4. Interiors and people — the brief's priority

This is the weakest area and the one the brief singles out.

| Object | Builder | LOD / cost | Notes |
|---|---|---|---|
| Room (cantina hall, cabin, HQ) | `27f2-room3d` — `hallRoomMesh`, materials as patterns | MSAA 4×, shadows, bloom | engine-quality geometry, but the room is a **box with props** |
| Person body | `cpBody` (`27f3-person3d.js:128`) — `cpBodyGen`, `cpTorsoAt`, `cpBand` | `lod` parameter, `cpMesh` cache + `cpTwinPump` | a lofted torso with banded rings; **no hands with fingers, no feet with toes** |
| Person head | `cpHead` (`27f3a-face3d.js:190`) — `cpHeadGen`, `cpSculpt`, `cpSkin`, `cpTeeth` | lod | sculpted from a parametric face; eyes, mouth, teeth, hairline, hair clumps |
| Face rig / emotion | `cpFaceRig` (`27f3a:71`), `27f6-face-live` | | six emotions, blinks, gaze |
| Cloth | `cpCloth` (`27f3-person3d.js:46`) | | banded strips over the torso |
| Poses | `cpPose` (`27f3-person3d.js:53`) | | a small hand-authored set |
| Portraits | `27f5-portrait3d` | | the same head, painted outside the frame |

Honest assessment of the people, ahead of stage 2's grades: the **head** is a genuine effort — it is
sculpted, rigged and animated, with teeth and a hairline. The **body** is a lofted tube with banded
cloth; there are no articulated hands, and the figure is read at 300–900 px in the cantina. The
brief's "mannequin" test therefore applies to the **body**, not the head.

## 5. Places (GPU passes, not meshes)

| Place | Module | Notes |
|---|---|---|
| System backdrop, planets, moons | `17g`, `17ga`, `17gb` (planet strip) | procedural shading, no textures |
| Nebula | `16gb`, `16gba`, `16gbb`, `16gc` | 407-line WGSL generator |
| Planet surface | `21pe-pln-gpu` — 18 pipelines (`pln.*`) | terrain, sky, water, shafts, bloom |
| Cave | `22d-cave-pln` + `22dbw` WGSL | |
| Belt | `24be-belt-rock-gpu` | rocks as instances |
| Raid | `24aa1-raid-gpu` | |

## 6. The parrot (Говорун)

Two completely separate things, which the brief asked to keep apart:

| Version | Where | What |
|---|---|---|
| **3D, HD** | `_scratch/kimi3d/app/public/assets/Govorun_HD.glb` (68 MB), 903 670 tris, 67 bones, 19 clips | the site viewer. Built by Tripo + Blender. **Not in the game.** |
| **2D, in game** | `12x-parrot.js`, `12y-parrot-face.js`, `12y1-parrot-gpu.js`, `12z-parrot-acts.js` | sprite plates on the GPU, 6 wing plates on one hinge |

Blender work done so far on the HD model (branch `art/3d-audit`, nothing shipped):

- imported headless, rig and clips verified, poses rendered (`_scratch/kimi3d/pose/bl_*.png`);
- `Wing_Flap` really spreads and raises the wings — the clip is not broken;
- the artefact the author circled is **part of the wing/chest surface**, not a torn island: a
  stretch scan over 29 155 islands found only two stretched pieces, and neither is it;
- therefore the fix is **re-modelling** (category C), not weight painting.

## 7. What this means for the plan

1. **A converter is the gate.** No Blender model reaches the game until there is an offline path
   from `.blend`/`.glb` to `h3dKit` `V`/`C` arrays (or to an `r3` mesh). That is the first
   technical deliverable, and it is what makes stage 4 possible at all.
2. **Vertex colour is the medium.** The brief asks for PBR; the renderer has no texture path for
   bodies. Either the plan accepts vertex colour + silhouette work, or it also schedules a texture
   path in `17c2a` — a renderer change the brief explicitly warns against making for one model.
3. **The people need a body, not a face.** The head already carries the character. The body is a
   lofted tube; that is where "mannequin" reads.
4. **The parrot's HD model is a reference, not a candidate.** 68 MB and 903 k triangles cannot ship;
   its value is proportion, palette and the wing shape.

## 8. What is still unmeasured

- Nothing has been graded yet (stage 2). Every row above needs a rendered image at a game distance
  before it can be graded 1–10.
- Frame cost per object group is not measured per object; only the whole frame has numbers
  (`?g11=near`: system 4.2 ms p50, 8.3 ms max after the last round).
- Triangle counts per builder are known only for the HD parrot (903 670). The engine's counts have
  to be read from `PLN.stat`/`H3D` counters or exported.
