# Handoff: planet branch, 02.10.2026

The planet and the cave are reinvented for the WebGPU engine, solo, in the worktree
`C:\Claude\drift-planet`, branch `planet`. Commits are local. The branch lives on GitHub as
`claude/planet` (the `claude/**` prefix keeps it off the deploy workflow) — **do not push it
as `planet`**, that would roll the work onto dev.html. `main` only through the Control
session.

## Read first

| What | Where |
|---|---|
| the plan, the stages M600–M652, the laws of the picture | `docs/DESIGN-planet.md` (§7 stages, §11 laws) |
| how the look stands in the game, decisions, modules, **the state** | `docs/DESIGN-planet-engine.md` (§2, §3, §6) |
| the style in numbers, the kit as built | `docs/DESIGN-planet-style.md` (§10) |
| how to shoot the game's frame | `docs/look/game/README.md` |

## Where it stands

Stage 0 (the look on the stand) is closed and M600 is accepted by the author. Since
27.09 frames are not agreed one by one: «кадры не надо со мной согласовывать, направление
верное, делай все». He asked for pictures to be left in the chat after every pass.

Stage 1: **M610–M614 are done** (the sky by the hour, the bodies of the sky, the
weather's light, the eclipse — `docs/DESIGN-planet-engine.md` §2.11; the eleven worlds on
one sheet, their water, their far world and their flora — §2.22–§2.25; the cost: the
tiers and the build by frames — §2.26–§2.27, the numbers in §6). Stage 2: **M620 (the
man) and M621 (the ship and the descent) are done** — the rig of `21pha`, §2.28; the open
decisions of the plan's §8 were handed to me on 02.10 and are decided there; the ship from
the game's hull and the descent as the surface's own frame, §2.29–§2.30; the flora — the
twelve anatomies, the colour law, the wild drifts and the tree weights of a world,
§2.31–§2.33; stone parted by light, the ground's dress and the water, §2.34–§2.36; the beasts — anatomies on one leg law, the book of poses, far herds and
flocks, §2.41–§2.45; the weather as cards in the scene's air, lamp drops, lightning, wet ground and sheets, §2.46–§2.50.
**M627 (landmarks) is next**, then M628–M629 and stages 3–5. The new look runs in the game behind
`?pln=1` or `PLN.on=true`, off by default; the old painter is untouched.

## Rules that hold

- New modules only, every top-level name begins with `pln` / `PLN`. Old painters, the
  fleet's sky (`src/19*`, `11ak-skywatch`, `27la-road-sky`) and the nebula (`16gay`,
  `16gb`) are read and never edited.
- Gameplay, physics, generation and the save do not move.
- Method: concept → first frame → the pair «было / стало» → harsh self-critique → the
  next pass. Graphics only improve.
- Pictures never enter git. Scripts are files, not heredocs.
- On this machine the browser tier is red on two golden frames of the old look («база ·
  пусто 52% против 74%», «грунт день 3.1%»): known, not to be fixed here.
