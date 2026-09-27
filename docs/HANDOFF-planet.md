# Handoff: planet branch, 27.09

Moved to another computer mid-stage. Branch `planet` lives on GitHub as `claude/planet`
(the `claude/**` prefix keeps it off the deploy workflow — do not push it as `planet`,
that would roll the WIP onto dev.html).

## Where it stands (M610, the new ground inside the game)
- New surface runs in the game behind the `PLN.on` switch (off by default, old view untouched):
  ground, water, ship, human, shadows, game UI on top. Modules `src/21p*.js`,
  design in `docs/DESIGN-planet-engine.md`, plan in `docs/DESIGN-planet.md` (M600–M652),
  style sheet `docs/DESIGN-planet-style.md`.
- Second pass shot in four views (by the ship, by the lake, far along the lane, tall 390×844):
  no frame or GPU errors. Past the walk line there is now a shelf, not a sharp edge; path lighter.

## What is bad in the frames
- Ground is smooth, "plasticine": no grass, trees, rocks, so no scale — that is M611.
- Steep bumps of the game relief far from the ship read as grey cones.
- The pond by the lake reads as a rectangular trough.

## Not done
Before/after pair in the game, frame cost on a real clock, tests, dusk and night.

## Next
Before/after pair and cost measurement, then a local commit and M611.
Stand: `docs/look` (not for pushing to main). Frame shots of the last pass stayed on the old machine.
