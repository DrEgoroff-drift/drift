# Drift — 3D art grades and rework plan (stages 2–3)

Branch `art/3d-audit`. Companion to `ART-3D-INVENTORY.md`.

Grades are 1–10 on the brief's five axes, collapsed into one number. Only objects that were
actually **looked at** are graded; everything else says D (needs evidence) rather than guessing.
Evidence is a file under `docs/shots/` or `_scratch/kimi3d/pose/` — a number without a picture here
is gossip.

| # | Object | Grade | Class | Evidence | Why |
|---|---|---|---|---|---|
| 1 | **People on the surface** (astronaut, NPCs, haulers) | **3** | **C** | `docs/shots/peep.png` | Grey mannequins: no face, no hands, rectangular head, tube limbs, no cloth breaks. They read as placeholders at 300–900 px and get *worse* in close beats (a load for two, a crate alone). This is the weakest thing in the game and it is in the player's face during play. |
| 2 | **Cantina people — body** | **4** | **C** | `docs/shots/cantina.png` | A lofted torso with banded cloth; in the hall the figures are near-black silhouettes, so anatomy is invisible — which hides the flaws but also kills character. No articulated hands. |
| 3 | **Cantina people — head** | **7** | **B** | `docs/shots/cantina-types.png`, `hq.png` | Genuinely built: sculpted face, teeth, hairline, rig, six emotions. Needs proportion and material passes, not a remake. |
| 4 | **Player + NPC ships** | **7** | **B** | `docs/shots/x_fleet.png` | The strongest art in the game: rounded industrial hulls, cream + orange stripes, distinct silhouettes (tanker barrel, flat platform, solar wings). Limitation is the medium — vertex colour only, so close-ups read flat. |
| 5 | **Gas giants / planets** | **7** | **B** | `docs/shots/system.png` | Bands and ring read well; the banding is soft and slightly psychedelic up close, and there is no surface detail at the limb. |
| 6 | **Nebula / backdrop** | **8** | **A** | `docs/shots/system.png`, `map.png` | The best-looking layer in the project. Leave it alone. |
| 7 | Pirates, stations (close), giants, barges, wrecks, props (buoys, posts, finds, cheburek), rail, cave, belt, raid, interiors other than the cantina | — | **D** | none yet | Not rendered at game distance. Grading them now would be invention. |
| 8 | **Parrot — in game (sprite)** | **6** | **B** | `docs/shots/parrotwin.png` | Charming, but the wing is six flat plates on one hinge; the flap fold was just fixed in code (`1687dc11`). |
| 9 | **Parrot — HD model** | **5** | **C** | `_scratch/kimi3d/pose/bl_f33.png` | 903 k tris, 67 bones, 19 clips, good proportions and palette — and a wing that turns into a sheet with protruding spars when spread. Part of the wing/chest surface, not a torn island (29 155 islands scanned). Needs re-modelling, and it cannot ship at 68 MB anyway. |

## What the grades say

**The ships are not the problem.** The brief anticipated a wholesale rebuild; the evidence says the
opposite. The industrial hulls already carry the game's identity — that is the look the brief
describes (Стругацкие, освоение, обжитое). Touching them is the highest-risk, lowest-reward move in
the list.

**The people are the problem, and they are two different problems.** The head is already sculpted
and rigged; the body is a tube and the surface figures are not even that. One rework does not fix
both.

**Nothing can ship until a converter exists.** See `ART-3D-INVENTORY.md` §0. This is the real gate.

## Priority order (brief §9, applied)

1. **Surface people** — the player stands next to them, they move, they are seen every landing.
   Category C. Also the cheapest to make dramatically better, because the bar is on the floor.
2. **Cantina body** — seen at 300–900 px every dock. Category C for the body only; keep the head.
3. **Parrot HD wings** — a named character with an existing 3D implementation; the brief says
   compare before replacing. Category C, and blocked on the converter for shipping.
4. Everything in D — measure first, then grade.

## The technical gate, stated once

Before stage 4 has any point, one of these must exist:

- **A: an offline converter** `.blend`/`.glb` → `h3dKit` `V`/`C` arrays (position, normal, vertex
  colour, index), emitted as a generated `src/` module. Keeps the current renderer untouched, keeps
  draw calls and materials as they are, supports LOD by emitting several meshes.
- **B: an `r3` mesh path** for characters only, reusing the interior renderer's material system —
  higher quality, but it pulls the cantina renderer into the surface scene.

**A is the recommendation.** It respects the brief's "do not break the renderer for one model",
gives one pipeline for every future model, and its output is diffable in git.

## Pilot (stage 4) — cosmonaut, built in code

`tools/make_man.py` builds a suited figure from lofted profiles (rings of varying radius, not
stacked cylinders), exports GLB, and `tools/art2kit.py` turns it into `h3dKit` vertices.

Current state: **3 944 tris**, six materials (suit, dark suit, metal, glass, boot, skin), helmet with
visor, ribs, backpack with tanks, gloves with four fingers and a thumb.

![фас](_scratch/kimi3d/pose/man4_front.png)

Tracked defects, in order of how much they hurt:

| # | Defect | Cause |
|---|---|---|
| 1 | Reads as a wooden mannequin in a suit, not a person | no sculpting: primitives assembled, then smoothed |
| 2 | Torso is a barrel with two belts | ribs are separate lofts larger than the body |
| 3 | Arms are straight tubes, no elbow bend | profile is a straight line in Z |
| 4 | Helmet has no rim, chin, or collar | plain sphere with a second sphere for the visor |
| 5 | Hands still read as mittens at game distance | palm is a box, fingers are 6-sided cones |

**Honest grade for the pilot as it stands: 5/10 — category B.** It is a large step over the 3/10
surface mannequin (`docs/shots/peep.png`) because it has a silhouette, cloth breaks, boots and
fingers; it is nowhere near a finished character, and primitive assembly cannot get there. A
competitive figure needs sculpting and retopology with a hand on the mouse — that is a session of
its own, not a loop artefact.



- PBR textures for bodies: the renderer has no texture path for them. Adding one is a renderer
  change, and the brief forbids that for a single model.
- Rebuilding the ships: they are the game's identity and already good.
- Raising polygon counts as the fix: irrelevant to every defect found above. The mannequins are not
  low-poly, they are *unmodelled*.
