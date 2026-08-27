# Drift â work plan

Living document: finished milestones collapse to a line, unfinished ones are spelled out.
Links point at modules in `src/`, never at line numbers â numbers go stale after the first
edit, module names don't.

Written in English on purpose: this file is read almost every session, and English costs about
half the tokens. The game itself, its UI and its code comments stay Russian.

## Cross-cutting rules

- **What does not move is painted once.** The frame's cost on canvas is raster, not JS (0.87
  measurement: logic â¤4 ms in every mode; the surface ran at 23 fps because of fifteen full-screen
  fills under a 200-vertex clip, every frame). Anything static under a moving camera goes through
  `18c-chunks`: world-X chunks (`chunkStore`/`drawChunks`) for long strips â ground, cave rock â
  and `screenLayer(key, paint)` for screen-space constants â the star's glow, the storm veil. Before
  adding a full-screen gradient, pattern or clipped fill to a draw path, ask whether it changes
  between frames; if not, it is a layer. `prof()` in the console (28-loop) tells where a frame goes,
  JS and raster apart; `prof(30,"drawGround")` tells what one function costs in raster.

- **Save format is `v:4`.** `server.js:95` and `worker.js:66` reject anything else. A new
  persistent field goes into `snapshot()` and gets a safe default in `applySave()` (`14-save`).
- **Never persist the ephemeral.** Whatever derives from a seed is regenerated. Only player
  decisions and carried loot persist.
- **Sparse overlays** keyed `"sx,sy"`, like `G.market`. Bases and hired hands are stored the same way.
- **New tables** follow `RES`/`MODS`/`TECH`: a flat const, `ru` + `note`, price/effect.
- **Gradient from the start.** `sysDanger(sx,sy)` (`01-core`) sets part tier, base level, resource
  rarity, quality of hired hands and station type.
- **A large new scene is a new `G.mode`** with its own `update*`/`draw*`, not a rework of an old one.
- **Background activity is computed lazily** from `Date.now()-lastTick` with an offline cap. No
  real-time simulation â the model is `tickDrones()` (`12-economy`).
- **After every milestone:** parse check, empty console, a manual scenario, loading an old save.
  Canvas screenshots are not trusted.
- **Design in passes, not in one shot** (author, 2026-08-23). Any design — a screen, a
  component, a drawn thing — gets a draft and then several self-critique passes along the way:
  look at the result as a user/with the art direction, name what is wrong, redo, repeat until a
  pass finds nothing. Optimisation is part of every pass, not an afterthought — check the
  raster/JS budget (`prof()`, the "painted once" rule) before calling a pass clean.

## Done

M1âM32 â the base game (see git history). M33 parts and total rig capacity Â· M34 ship screen with
hull slots Â· M41 WebAudio sound engine Â· M42 generative music with beacons and reverb. Plus the
split into modules and the `build.ps1` build.

**The whole queue below is finished** (July 2026, one milestone per commit):
M43 celestial mechanics and autopilot lead Â· M44 six station types with type-driven tabs Â·
M39 rare resources, gas scooping, smelting Â· M45 hiring, fleet, orders, lazy simulation Â·
M46 wages, debt, morale, repair Â· M37 base in cross-section with power balance Â· M38 base network
and transfer Â· M47 base staff, roles, raids Â· M40 the lab: hull fusion and part crafting Â·
M35 boarding a pirate base on polygons Â· M36 enemy types, consumables, mezzanines.

Descriptions of finished milestones live in [`docs/PLAN-archive.md`](docs/PLAN-archive.md): they
remain documentation of the decisions taken, but sit apart so this file can be read in one go.
Here is only what is still live â cross-cutting rules, the visual queue and the milestone queue.

---

## M55. Visual work queue (live)

Where we stopped. Everything above the line is built, tested and pushed; everything below is
not started.

### Done (0.14.0 onward)

Points of interest on planets and in the belt, rock material, geology in cross-section, light and
air, sky with a loudness budget, the look of a system and exotic stars, the feel of flight, alien
flora and fauna, a living camera, station modules, weather.

### Remaining, by descending payoff

1. **The mine from inside** â two passes done (`23-mode-dig`). Strata, ore in grains, the working
   floor, timber and ladder, track and tub, haze at the far end. **Still open → swept, see the tails ledger:** the landings in
   the shaft barely read; a tub in a cell dug below the floor looks like a crate in a pit; and a
   long shaft is still a long shaft â niches and a change of section would do more than texture.
2. **Ships** â done in two series of ten passes (`03-ships` and its split, `03a`â¦`03e`). Class
   reads by silhouette, the fleet is painted like industrial hardware (bone skin, panel plating,
   graphite engines, stencils), the planform is a scheme of its own (delta, cross, catamaran, slab,
   disc, trident, swept) so there are about fifty silhouettes, and the luxe yacht is its own craft
   entirely. **Still open → swept, see the tails ledger: faction** â one visual language for everybody, and per the queue below
   factions come after stations.
3. **Cantinas** â done. Light is a layout (how many lamps, what tone, how wide the cone, what
   happens between them), the crowd is counted per station type, what stands behind the counter is
   what the place deals in, and the music leans by type. **Still open → swept, see the tails ledger:** the counter is the same
   length and shape in every hall.
4. ~~**New world types:** crystalline, jungle, metallic, ruin.~~ â DONE: all four are in `TYPES` (02-world) with profiles, relief and geology.
5. ~~**Finds in flight:** a distress signal, an abandoned satellite, a drifting container, the
   wreckage of an expedition.~~ â DONE at M108 (`17b-finds`).
6. **`base` and `scoop`** â twelve passes on the base (`21a-mode-base`, `21aa-base-rooms`,
   `21ab-base-interiors`; stands `docs/mkbase.ps1`, `docs/mkroom.ps1`) and a first ever pass on
   `scoop` (`19a-mode-scoop`, stand `docs/mkscoop.ps1`). The narrative of what each pass fixed is
   in [`docs/PLAN-archive.md`](docs/PLAN-archive.md) â grep it for `M55`. Open debt only, below.
7. **Factions as a language of shapes** â only after ships and stations, or there is nothing to
   tell apart.
8. ~~**Redo the clouds.**~~ â DONE: `19e-clouds` is a density field in perspective, called from `drawSkyLayer`.
9. ~~**The world on foot**~~ — DONE at M172 (0.138.0): `sunSpot`, night as a value structure, the
   lamp as a cone, far ridges with their own amplitude, `SURF_HOR`. Stand: `docs/mkfoot.ps1`.
10. **Split debt.** `23-mode-dig` and `27e-ui-home` have crossed the 40 KB line; `build.ps1` was
   re-baselined on 2026-08-15 so the guard stays quiet, which is a loan, not a payment. One
   payment made on 2026-08-16: `21aa-base-rooms` (60 KB) was cut along its seam into the brushes
   plus `drawModule` (24 KB) and `21ab-base-interiors`, the eight compartments (37 KB), and left
   the guard's list instead of being re-baselined inside it. **Next: `21a-mode-base`, 52 KB** â
   it grew over the base passes and is deliberately left shouting on every build.

### M169 — the graphics campaign of 2026-08-24 (settlement, mine, cantina, ground, giant)

Written after the author called the settlement "пиздец" and asked for every screen to be looked
at again, five passes deep, with self-criticism instead of "this one is already fine".

Closed here: **settlement** rebuilt as a place (`12tb-settle-draw`: terrace, street, a body per
craft, four dwelling plans, villagers with a gait, communal fire, fence, night light pools);
**mine** rock given a mass (`digRockMass`: cloudy tone, world-space jointing, dyke, damp stains,
abandoned collapsed workings roughly one per screen); **cantina** given a host (barkeep with work
that changes on an eight-second cycle, patron poses, bottle silhouettes); **deposits** turned from
interface icons into outcrops with a form per raw material (`drawDeposit` in 21b); **ground
cross-section** broken by faults with lenses inside the strata (18b); **gas giant** shear edges
grown rolls (19a).

Measured after all of it **and after M170**, clean machine, maximized window at ×2: system 58,
belt 60, landing 54, surface 52, dig 60, cave 60, scoop 58 — the same as, or a shade better than,
the pre-campaign baseline (55/60/51/48/60/60/55). Measure like for like: the same window size and
scale, nothing else running. A 1550×900 window instead of maximized reads ten frames lower, and a
run with `--force-device-scale-factor=2` that lands on a 2.5× display reads a third lower — those
are the window, not the code. The "regression" seen
mid-run (system 45, landing 40) was the browser pane running the game in background tabs while
the probe measured: **no other instance of the game may be open during a measurement.** The one
pass worth optimising if surface ever drops below 45 is `drawPlant` (4–13 fps by the deep probe);
bake per-plant sprites and shear them for the wind rather than redrawing paths per frame.

Tooling from this campaign: `docs/shot.ps1` (headless capture of any stand, kills its browser
after), stands rewritten to compare — `mksettle` (three stages plus night plus a ×3.2 close-up),
`mkcant` (all five hall types in one sheet).
- **road companion (M168g, 0.136.1)** — closed by looking at four minutes of real driving: the exhaust
  was a stack of bricks composited to opacity, the trip counter reset every game-minute, and a
  crooked cradle was read as a permanent turn. Measurement rebuilt (auto-zero, gravity frame, yaw
  rate), ribbon is one body per nozzle, footer no longer crossed. See docs/DESIGN-road.md, fifth
  pass. Left open: the hull reads as grey mass at this size — plates all one value, white hairline
  on every edge, and the ТП-68 plate is the brightest thing in the optical centre. Art direction,
  needs the author.


### M173 — the author's own walkthrough, 2026-08-24 (live queue)

The author played the dev build and pointed at things one at a time. Each line is a fault **he
saw on his own screen**, in the order he found them; they are worked through in passes, in this
order, and struck out as they close. This is the live queue — new finds go at the bottom.

1. ~~**A black polygon in the ground, "what is this at all"**~~ — done. It was the near-plane
   boulder of `drawForeground` (21b), filled at `amb×.30` with no contour and no material. On dark
   ground it stopped being an object and read as a tear in the render. **The rule is wider than
   one rock: any silhouette in this game must carry an edge that caught the sky** — without one
   the eye reads "nothing was drawn here", not "a dark thing".
2. **"The plants are ugly, and they clump"** — **half done, and the half that is left is the
   harder one.** *Clumping: fixed.* Cluster centres were chosen as the best of three throws
   across the whole strip, lowest ground wins; a strip has one hollow, so every cluster walked
   into it — half the screen a wall of foliage, the other half bare. The strip is now divided
   into as many stretches as there are clusters and each looks for its own low spot inside its
   own stretch; plants inside a cluster are spaced instead of thrown, and each carries a depth —
   far ones smaller and fading into the air, near ones full.
   *Ugly: not addressed.* The forms themselves (`drawPlant`, 20-life) are flat cut-outs in one
   acid green: no shading across a leaf, no value difference between stem and crown, the same
   hue whatever the world. That is a pass of its own on the plant body, not on where it stands.
3. ~~**"This is rubbish too" — the ringed planet in the sky**~~ — done (`skyGiant`, 19b). Three
   causes: the body took the colour of the planet *underfoot* (dark world → black disc, plus a
   .86 terminator — a hole again); the light always came from the right regardless of the star;
   and the ring was two thin arcs of equal brightness front and back, no planet shadow on them,
   no divisions — that is exactly what makes a hoop. Now the body is lit from where the star
   actually is (`sunSpot`), mixes the star's colour so it can never go black, and the rings are
   five bands of different width and brightness with the planet's shadow across them, the far
   half dimmer, and the near half half-transparent over the disc.
4. ~~**The home reads as a warehouse**~~ — done. The wall was bare from waist to ceiling and the
   eye measures height by things, not by paint: a dado, a skirting and a beam give it three
   horizontals. The ceiling came down from 2.6 man-heights to 2.3. Every room got one object
   **in front of** the walker, cropped by the bottom edge, so the room has a front and a back
   instead of one flat plane. Residents got depth and elbow room — five of them used to stand on
   one line, shoulder to shoulder, reading as a row of identical cut-outs.
5. ~~**"The lamp just doesn't light anything"**~~ — done, and it was the M172 cone's own fault.
   A milky wedge was laid over the world — over the sky as well — and nothing under it got
   brighter. Light does not work that way: what you see is not the beam, it is **the lit thing**.
   The work moved to the ground: a strip along the terrain profile in front of the walker now
   really brightens (added over the rock, so the material still shows), falling off with distance.
   The airborne beam stayed but faint and narrow — as much as dust actually scatters — and only
   where there is an atmosphere to scatter in.
6. ~~**"Look at it from the dev stand, don't raise a local one"**~~ — done: `dev.ps1` publishes
   this build to `/dev.html` and the sheets to `/dev/`, and the four recurring tooling errors are
   fixed and written into `CLAUDE.md` (ssh noise, `.ps1` BOM, parameter shadowing, probe flags).
7. **Release look, pass 1: the instruments stop hanging over every screen** — **done, on dev,
   awaiting the author's eye.** On foot (surface, cave, dig, base, home, raid) fuel, hull and
   shield are hidden — they are the ship's, and the ship is somewhere else; the hold stays,
   because on foot it is exactly what fills up, and fuel comes back by itself when it goes
   critical. The rest of the release look (the table as paper, the remaining overlay) is passes
   2+; the author took it "in passes" on 2026-08-24.
8. ~~**The plant body itself**~~ — done in 0.140.0, but only the skin. `stemC`/`leafC` stopped
   being flat colour strings and became gradients in the plant's own coordinates, so all twelve
   forms got light and shade in one edit, lit from where the star actually is (`sunSpot`); tone
   varies ±12% between neighbours from a hash of the place, so a thicket is no longer one patch
   of paint. What this does **not** fix is item 12.
9. ~~**A second storey for the living part**~~ — done (0.145.0, M178-9): `29e-home-up`, two rooms
   over study and living, a real stair, the house drawn as a cross-section (roof, attic, joists),
   Vega at the loft window. Suite `91zzzc-home-up`.
10. ~~**The world heard**~~ — done (0.146.0, M178-10): `09a-roomtone` — wind by weatherPower
   (storm heard before seen), rock by depth, the house warm with creaks and the weather through
   the wall, ventilation on the base, absolute silence in vacuum. Suite `91zzzd-roomtone`,
   verified live by AnalyserNode RMS.
11. **Save format v:5** — the author said break it (2026-08-24). Then measured: all 119 persisted
   fields are still read, there is exactly one legacy branch (`modsOwned` falling back to
   `mods`), and the 71 "defensive defaults" are validation of untrusted input — a save comes from
   localStorage and from the cloud — so they stay at any version. Breaking now costs every
   existing save and buys almost nothing. **Held until the release look actually changes what is
   persisted**, then broken once, together with the cleanup. The author has the call.
12. ~~**"The instruments would sit better at the top"**~~ — **decided and done (0.160.0, M187).**
   The author settled it on 2026-08-26 in one line: «приборы сверху, сейчас очень плохо не видно».
   Everything below is the argument as it stood before the call; what was actually built, and the
   two rules that replaced A2's, are in `PATCHNOTES.md` 0.160.0 and at the head of the instrument
   block in `style.css`. The reversal was done in one go across every mode, as the note demanded —
   the composition per screen survived, only the edge changed.

12a. *The argument as it stood before the call* (author, 2026-08-25 → settled 2026-08-26): A2 had
   put the state at the bottom on the ground that the top edge belongs to the world; the author's
   eye said the bottom band was already the noisiest strip of the frame. The full reasoning, the
   cost of the reversal and the two rules that replaced A2's are in `PATCHNOTES.md` 0.160.0 and at
   the head of the instrument block in `style.css`.

13. ~~**The raid reads as if the man stood on the ceiling**~~ — **done (0.161.0, M180 pass 2).**
   He was right literally: the camera's up vector pointed down, and every raid frame since M35 was
   drawn mirrored about the horizontal. Three of the four suspects below turned out to be one bug
   (the inverted value order, the missing contact shadows and the "hanging boxes" were all the
   flip); the fourth — pitch and principal point doing one job twice — was **not** the fault, since
   floor and ceiling converge to one horizon either way, but the framing numbers were re-derived
   anyway once the flip was fixed. Found while looking at the corrected frames: loot crates had
   never been drawn at all (queued into the polygon list after it was painted), marks drew through
   bulkheads, and bodies were four times too small for the compartment. All in `PATCHNOTES.md`
   0.161.0; guards in `91zzze-raid-view`. Original text:

13a. **The raid reads as if the man stood on the ceiling** — the author, 2026-08-25, on the
   pirate-base frame: «не очень понятно, посмотри на перспективу». The complaint is about the
   legibility of the space, not about the bodies. Four suspects, in the order to check them
   (`24aa-raid-draw`):
   - **Pitch and principal point do one job twice.** The camera is tilted down
     (`fwd=[…,-.16,…]`) *and* the principal point is lifted (`CY=H*.44`, M180). Shifting the
     principal point is the architectural trick precisely because it keeps verticals straight
     without a tilt; doing both leaves floor and ceiling converging at nearly the same rate, and a
     plane that recedes upward stops reading as ground.
   - **The value order is inverted.** The ceiling carries the light panels and the pale slabs, the
     near floor is almost black — so the brightest receding plane in the frame is the one the man
     is *not* standing on, and the eye takes that for the ground.
   - **The player may be losing his contact shadow.** The pirates have theirs and read grounded;
     the ellipse under the suit is drawn only when the floor point projects below the body
     (`pm.y>m.p.y+4*s`), a guard this camera height can fail. Measure it before assuming it.
   - **Hanging boxes look like floor boxes.** Crates on the upper wall carry the same silhouette,
     tone and contour as the ones on the deck, so they add no up/down evidence either.
   One frame is not a diagnosis: reproduce it on the stand (`docs/mkview.ps1`, `?s=raid`), and fix
   the reading of the space — a horizon the floor alone owns — before touching anything else.

### Graphics debt (open faults, one line each)

Written down on 2026-08-16 so the picture stops being an open-ended errand: everything below is a
**fault someone found by looking**, not a wish. The queue moves on to mechanics; these are taken
one at a time when a pass is due, and nothing here blocks a milestone.

- **base, tight rooms** â in the reactor, the quarters and the lab the machine fills wall and
  floor, so neither the wall trace (`bDress`) nor the leftovers (`bJunk`) show at all. The fix is
  a free strip in those rooms' own layout, not drawing things over the equipment.
- **`scoop`, soft texture** â the giant is baked at 512Ã256 and stretched to one and a half
  screens: not one crisp edge belongs to the cloud itself, and the shear edges are shadows laid
  over that softness. Also: the floor is lighter than the design wants, and nothing but the
  palette changes between types of giant.
- **mine** â landings in the shaft barely read; a tub in a cell below the floor looks like a crate
  in a pit; a long shaft is still a long shaft (niches and a change of section beat texture).
  **Checked 27.08.2026 on the new stand `?s=shaft`: the landings part is STALE** — a later pass had
  already rebuilt them into a proper landing (a beam across the shaft on brackets, a lamp that
  really lights, a depth plate, a box on every other one), and they read. The other two stand, and
  the landings every eighth row are the only rhythm a long shaft has.
- **cantina** â ~~the counter is the same length and shape in every hall~~ done in 0.99.0
  (`cantCounter`). Pass 2 (0.99.3): hall lifted, crowd in colour, floor with light pools. Next: a barkeep
  who moves; glasses and bottles on the counter per type; a second window plane.
- **Ð¿Ð¾Ð´Ð³Ð»ÑÐ´ÐºÐ°** (M118) â the walker's trail dissolves into the mat's glow; the mat is identical
  on every world; an arm at rest merges into the torso; the crate rides near the chin.
- **ÐÐµÑÑÑÐ½ÐºÐ°** (M119) â the plume is three evenly spaced puffs; the plant is the same shape on
  every world; the drum's hoops do not read as turning.
- **ÐÑÐ¾ÑÐ¾ÑÑÐ½** (M120) â at 64 px, the size he is actually seen at, the three eyes merge into a
  smudge; the hide is flat khaki with no dust streaks; the working arms hide behind the torso.
- **ships** â no faction language; it comes after stations by the queue above.
- ~~**the world on foot**~~ — **closed in 0.138.0 (M172)**: the star got a place in the sky (`sunSpot`, one
  source for glow/disc/clouds/shafts/rim), night became a value structure instead of a flat wash,
  the suit lamp became a cone with a pool on the ground, the far ridges got their own amplitude,
  the horizon moved to `SURF_HOR`. Stand `docs/mkfoot.ps1`. Left open: the day palette itself —
  noon still reads overcast on every world, and that is art direction, not a fault.
- **split debt** â `21a-mode-base` 52 KB, `23-mode-dig`, `27e-ui-home` (see item 10).

### The graphics & performance pass (G1–G12) — closed, moved to the archive 2026-08-26

Every line of it is closed (see the tails ledger below). The measurements, the faults seen in
each frame and the fix chosen for each are in [`docs/PLAN-archive.md`](docs/PLAN-archive.md) —
grep it for `G1` … `G12`. The rules that came out of G0 live on in "Cross-cutting rules" above.

### What not to do

Depth of field, chromatic aberration, motion blur, lens dirt. In canvas 2D these either don't
read, or read as a defect, and blur requires an offscreen redraw with a filter â expensive.
Vignette and colour shift already give almost the same thing.

### Rules that are easy to break

Same as in M54: expensive things are computed once and cached on the object; structure before
material; the loudness budget; the frame camera is the single source of truth for both drawing
and input (`G.viewX/viewY`, `G.viewCX/viewCY`); fake it instead of computing it; star exoticism
never touches arithmetic; station modules don't unlock services.

---

# Tails ledger — every "Still open" swept on 2026-08-23 (0.100.3 → 0.100.8)

One line per tail, in one place, so nothing below has to be re-read to know what is left. "Closed"
names the version; "by design" means the tail is not a defect but a decision that belongs to the
author or to a later pass, and it is carried here on purpose rather than silently dropped.

## Closed

The swept tails of 2026-08-23 (0.100.3 → 0.100.8) are in
[`docs/PLAN-archive.md`](docs/PLAN-archive.md), under “the night orders M178–M186, and the closed
tails ledger”. Nothing there is outstanding.

## Open by design (not defects; each needs the author or a pass of its own)

- **The road companion** (author, 2026-08-23): phone mode where a real car trip flies your ship —
  GPS speed extrapolated to cosmic, accelerometer banks the hull, mic-driven equalizer, real
  distance → a capped in-game bonus synced through the site accounts. Captured in
  [`docs/DESIGN-road.md`](docs/DESIGN-road.md); needs its own pass and the author's answers
  (reward resource, cap, in-game vs separate page).
- **Factions as a language of shapes**: closed (0.109.0) — `17d-house-shapes`: a mark per house on the station and the settlement wall, pennant in the house colour.
- **Base "like Fallout Shelter"**: it is one; what differs is a question for the author.
- **Yacht railing below 3×, fully flat-on view** (archive, ships): the fleet is drawn flat-on by
  design; the hull now has a top light and one asymmetric boom, the rest is the reference-sheet
  richness a rotation pass would give.
- **M124 spec remainder**: receiver with a knob — closed (0.110.0, `25e-receiver`); "pause is the engine off" — closed by fact (there is no pause menu to replace). Left by decision (2026-08-23, autonomous run): the table as paper/bills/pile and the removal of the overlay HUD — both rewrite the whole interface and its autotests for a release look the author has not seen; kept as the release design, not done blind.
- **M125**: rack as a surface inside the cockpit (it is an overlay), re-bake on resize, CH5
  saturation — cosmetic; the rack is not persisted by rule.
- **M126**: the vanilla `SHIPS` ladder stays under the professions; passenger talk is one table
  (the hundred owns per-person talk).
- **M127**: a pirate hit can now knock a socket; instruments as loot beyond that waits for the
  spec's "lost" pass.
- **M132**: edge generator and hand-built cores per region, surface layer masks — each region's
  own milestone (M135+).
- **M131**: barge passenger as a channel, settlement glyph overrides, per-region colouring — left
  open in the hundred's design.
- **Split debt**: paid (0.108.1) — `17c-system-draw`, `19f-lander`, `21e-surface-draw`, `23a-dig-draw`, `24aa-raid-draw`. Paid again (0.153.0, the audit) — `12tc-settle-crafts`, `23aa-dig-rock`, `20f-fauna`, `21ba-deco-shapes`, `26b-ui-station-work`; `26-ui-station` and `23-mode-dig` left the guard's concession list entirely. **Still on the list, with their seams named** (2026-08-25): `27d-ui-cantina` 45 KB (the hall's own drawing vs the counter/patrons UI), `12tb-settle-draw` 44 (brushes + `sdDwell` vs the street pass), `27e-ui-home` 44 (the cards vs the estate's own tables), `28-loop` 42 (`hud()` is half the file and is not the loop), `12y-parrot-face` 42 and `21ab-base-interiors` 42 (both one `const` table — do not split a table, leave them), `14-save` 42 (`snapshot`/`applySave` are one pair — leave). So the real remaining work is four files, not seven.
- **Star disc on the surface**: closed (0.102.0) — was the dark sky tone since before the split; now the star colour.
- **G11**: **closed by measurement (2026-08-24, 0.133.0).** The game now carries its own probe:
  `?g11` runs the mode tour and measures rAF fps in a visible tab (`28z-fps-probe`), `?g11=deep`
  noops draw passes one at a time with paired baselines. Clean run (single fresh-profile Chrome,
  `--force-device-scale-factor=2`, anti-throttling flags, dpr 2, warm cruise after 4 s settle):
  system 56, belt 60, surface(jungle) 55, dig 60, cave 60, landing 52, scoop 47–60 across runs.
  No mode is solidly <50, so the 20-life sprite bake is not justified — matching the earlier JS
  read. The scary first read (system 46, surface 44) was the **cold start while chunks bake**,
  not cruise. Deep pass: no single pass dominates (paired deltas ≤+2, only `drawBuilt` +8 ≈ 2 ms).
  Measurement discipline learned: leftover probe windows with anti-throttling flags keep rendering
  when occluded and sink every later run to ~22 fps flat — kill them before measuring.
- **M112**: nothing else — belt missiles and the hull mark closed it.
- **M135 "three lights"**: built (0.101.0). **M136-hours**: built (0.102.0). **M137-glow**: built (0.103.0). **M138-grove**: built (0.104.0). **M139-keepers**: built (0.105.0). **M140–M142**: built (0.106.0). **M143–M151**: built (0.107.0–0.108.0) — the thirteenth pass is closed. Next: the tails ledger (factions as a language of shapes; M124 remainder), then the split debt, then G11.

---

# QUEUE: the fourteenth pass, the thirteenth pass, biology, planet light, release look — CLOSED

All built and moved to [`docs/PLAN-archive.md`](docs/PLAN-archive.md) on 2026-08-27 (0.186.0),
under the header “Moved out of PLAN.md on 2026-08-27” — grep it there for M152–M177, the
fourteenth pass, the kit/lodger/expedition, biology (M174), planet light (M175) or A2/A3.
Two things they left open **by design**, carried here so they are not lost:

- only the **surface** carries a mark of where the player dug; the station counter and the
  settlement do not, and M194 went around that rather than through it (see M194);
- the **drawn** landmark forms still number twelve for the whole galaxy: a species is described
  procedurally, but its shape comes from one of twelve brushes.


# QUEUE: the author's night orders, 2026-08-25 (M178–M186) — ALL DONE (0.147.0–0.162.1)

Written from the author's own crops; finished over 0.147.0–0.162.1 and moved to
[`docs/PLAN-archive.md`](docs/PLAN-archive.md) on 2026-08-27. Grep it there for M178–M186. Five
things they left standing, and these are the graphics debt in its shortest form:

- ~~the **suit kit** is still a paperdoll on the ship screen~~ — **closed by M216 (0.198.0).**
  `27j-ui-kitlay`: one wide layout above the cargo on the ТРЮМ tab. A doll answers *how do I look*
  and a layout answers *what have I got*, and on a mannequin half the kit is invisible precisely
  because it is worn. One canvas rather than six cards — the kit is one thing taken apart, not six
  independent ones — and every piece is coloured by `kitColOf`, so model and wear-layer show through
  exactly as they do on the doll and on the walker;
- the **pirate base** (M180 pass 2) — **mostly closed (0.191.0).** Bodies: legs taper into boots and
  stand in a seeded stance, the belt follows the body, a yoke marks the shoulders — but the thing
  that actually read as "blocky" was that nothing on the figure was lit, so seven flat fills fell
  apart on a dark deck; one rim along the crown and shoulders stitches them into a body. Hangar: it
  was never empty (containers, trusses, gantry, wrecked shuttle, barrels were all there) — it was
  one temperature, 46–80 on all three channels, and what a hangar has that a warehouse does not is
  **paint**. Two things measured rather than argued: marking only along bulkheads yielded exactly one
  yellow pixel in frame, and the line has to run across the bay because the camera looks down it.
  **Still open there:** warm work lamps with pools on the deck, and rust or colour on some crates —
  the room is still one temperature away from the paint. Stands `?s=raidfoe`, `?s=raidhangar`;
- ~~the **far ridge** on the surface is flat (M186)~~ — **closed by M211 (0.190.0).** It was not
  flat, it was *familiar*: both layers were the local ground profile amplified about its mean, so
  the eye recognised the curve and stopped measuring distance with it. Now ridged noise with
  octave-weighted detail and a separate seed per layer — peaks instead of waves. Two things the
  first count got wrong and the second measured: the frequency must be reckoned from the layer's
  on-screen step (a period of ~20 samples), and the field's mean must be subtracted or the whole
  range lifts by a third of its amplitude and covers the sky. Guarded in `91q-planet`;
- the **receiver console** sits over an open panel's title bar — put there deliberately by M151a,
  so it wants the author's eye rather than a silent change;
- **perf**: the night probe read system 43 / surface 39, the same as 0.144 — see the perf note in
  the archive before treating any of it as a regression.

# QUEUE: the 26.08 queue, M188–M206 — ALL BUILT (0.171.0–0.186.0)

The online postcard, the world alive, the places and the joys. Moved to
[`docs/PLAN-archive.md`](docs/PLAN-archive.md) on 2026-08-27 under the header “the 26.08 queue,
M188–M206” — grep it there for any of them. What they left open, in the order I would take it:

- ~~**photographable modes** (M188)~~ — **closed by M208 (0.187.0).** `25ga-post-scenes`, suite
  `91zzzu-post-scenes`, stand `docs\shot.ps1 scenes`. Five painters — cave, mine, belt, orbit,
  gas-giant air — sharing one light kit passed in as an argument, each with an object of known
  size in it. The snapshot did not grow: `cx`/`cy` mean something different per place instead of
  a new pair of fields per mode, and terrain is now computed only where it is drawn. Four passes;
  what was wrong in the first three is written down in the module.
- ~~**a hundred blanks** (M189)~~ — **closed by M209 (0.188.0).** `25h-post-forms2`, seventy more,
  with two kinds that could not exist before M208 gave the camera the cave, the mine and the void.
  Two real bugs fell out of writing them: the default blank was chosen from `G.mode` (so a mine
  photograph was offered «С ДОРОГИ», and a *received* card had no live mode at all), and kind alone
  was too coarse a sieve — «В АТМОСФЕРЕ» under a shot taken from orbit. A blank now carries the
  letters of the places it suits.
- ~~**marks in the places themselves** (M171, M194)~~ — **closed by M210 (0.189.0).** `11ah-wall`,
  `wall`/`sign` on `a=trace`, suite `91zzzv-wall`. Built as the opposite of the cache: a cache
  disappears when it is taken, so M171's whole point reached a player once in many landings, while
  a wall **accumulates** — twelve hands is one reward, not twelve, and a stronger one. Nothing to
  take, nothing to leave, one mark per person per wall. The settlement gets a boundary stone rather
  than its retaining wall (measured: the terrace is a cut, not a fill — there is no face to carve,
  and M171 had already settled that a side-on world needs a vertical stone); the cave mouth needed
  no such thing. Twelve rather than twenty-four, because two dozen at world scale is scratch-noise.
- ~~**the winter frame** (M197)~~ — **closed (0.193.0).** It was saying the right thing in a
  whisper: the warm/cold split was mixed at .22/.16, so a surface moved toward its own light by a
  fifth and the room came out flat brown, and the cold reached only 2.6 body-widths from the window.
  Cold now carries more weight than warm (the room's general light is a lamp, and a lamp is warm, so
  the cold must be louder to register at all), and the window's light is additive — it was tinting
  the floor blue instead of lighting it.
- **the release board** below is the live list; these five are debts against it, not blockers.

## To the release

- **The newcomer's first hour** — **first pass done (0.185.0, M207).** The walkthrough is
  `docs/DESIGN-first-hour.md`, measured in the running game. Worst finding: the suit and the fuel
  are countdowns that kill and **neither was ever named** — the bars are drawn and silent. Fixed by
  `11ao-firsthour` (suite `91zzzs-first`): four lines in the ether, each once per save and tied to
  an occasion, said by people and never by the game. No arrows, no modals, no tutorial flag.

  **Second pass done (0.192.0, M212)** — the hour AFTER the opening, walked; findings and
  non-findings in [`docs/DESIGN-hours.md`](docs/DESIGN-hours.md). Three fixes: every
  overflowing list now shows that it continues (`27m-scroll-cue` — measured: the board is 1229 px in
  a 407 px window, the cantina 2086 in 408, and nothing said so); the hire screen stopped arguing
  with itself (`xp` was `Math.floor(r()*40)`, bound to nothing, so «неопытен · опыт 22» stood beside
  «ветеран · опыт 7» — it now follows the traits it is printed next to); and ФОТО stopped hanging
  over open screens, a one-day-old regression from M208 widening the camera to flight.

  **Still open:** the board's eight sections on a first dock — untouched, thinning it is the
  author's call; what changed is only that the player can now see there is more. The landing prompt
  offering «СКАНИРОВАТЬ ОРГАНИЗМ» beside twenty-two deposits was checked and is **not** a priority
  bug — `dep` is tested before `plant`; it only happens when no deposit is within reach and a plant
  is. The station's group row can fall out of step with its tab if future code sets `tab` without
  calling `syncTabs()` — not reachable today, but a trap for the first "jump to this tab" feature.
  The third hour was walked in M215 (0.197.0): the same contradiction came back through
  `stationMercs` (reputation stamped `xp` over the traits), and a newcomer paid for a hand before
  learning he needs a hull of his own. **Its back half was walked too and is healthy:** a trip closes
  in ~9 min of real time, the journal names every event as it happens, and the *"he loses money, is
  he broken?"* reading does not survive contact — the journal shows where the profit lives (a
  salvaged part, a trophy hull) while it happens. Caution for the next walker: `crewTick` runs on the
  **wall clock**, not `G.t`; stub `Date.now` and set `c.tMs` to the fake now, or the hand silently
  stops and it looks exactly like "crew events never reach the journal" (they do, all sixteen).
  **The fourth hour was walked too, 27.08.2026, and the screen is healthy:** two managers at their
  consoles with their domain boards («ЗВЕНО 0/0», «ПЛЕЧ 0/2 — маршрут не собран»), a portrait card
  with level, loyalty, cut and salary, and a header that answers the newcomer's fear outright —
  «оклады 134 кр/мин — из долей доменов, не из вашей кассы». What was broken was the STAND: `hqfull`
  called `mgrHire(mgrRoll(…))`, neither of which exists, wrapped in a `typeof` guard that swallowed
  it — so it had been rendering the empty HQ, the same picture as `?s=hq`. Two more of the same were
  found and fixed (`crewPool`/`crewHire` in `?s=hire`, `cockpitOn` in `?s=cockpit`); the lesson is
  in CLAUDE.md.
- **v:5 and the last of the overlay**, in one go, now that the edge question is settled.
- **A clean performance measurement** by the M169 rules (one window, nothing else running) as the
  release check.

**Standing rule:** the Ring (M154) is never explained. An answer to it would kill it.

---

# QUEUE: after the outside playtest, 2026-08-26

An outside playtest arrived (`PLAYTEST-REPORT.md`, `PLAYTEST-01.md`; played on 0.160.0). Its
value is not the list — it is that someone who does not know the game looked at it. What follows
is what survived checking, what did not, and what is still open.

## Checked and did not reproduce — do not "fix" these again

- **«ПРОДОЛЖИТЬ ПОЛЁТ» with no save.** The button is `display:none` in the markup and shown only
  `if(hasSave())`; measured on a cleared browser, it is absent. Restoring also announces itself.
  The tester had a save from their own first fifteen minutes.
- **The instruments vanish in calm flight.** Measured after nine simulated seconds of nothing
  changing: opacity 0.86, fully readable. True before 0.160.0, not since.
- **The world stops living in a background tab.** Crew run off `Date.now()` with a 24-hour cap
  (`CREW_OFFLINE_CAP`). The tab catching up on return is the design working.

## Closed in 0.163.0

The first minute (chips are buttons, a miss does not cancel the autopilot, hit-testing in screen
pixels, the nearest planet in the compass); the empty HQ draws its own empty control room; the
orphaned `#parrotwin`; the receiver docked into the panel header; the mine's doubled hint; the
action button naming hold-actions. See `PATCHNOTES.md` 0.163.0.

## Open, in the order I would take them

1. **The walker is 3 % of the frame.** Measured: 25 px on an 840 px frame, and the tester spent
   twenty seconds unable to find himself on the surface. The *ratio* to the lander is right; what
   is wrong is that the surface camera does not scale with the window, so a bigger desktop window
   just shows more world and shrinks everyone in it. The fix is a camera scale tied to frame
   height — and it touches the world-x chunk cache, which is baked 1:1, so it is a milestone with
   its own passes, not a patch.

   **Re-measured 27.08.2026 and the numbers hold.** The walker is ~26 px drawn 1:1 (`drawAstronaut`
   is called under a bare `translate`, with no scale anywhere), so it is **3.6% of a 720-high frame,
   3.0% of the tester's 840, and 1.8% on a 1440p monitor** — it gets worse the better your screen.
   Two routes, and they trade against each other, which is why this wants the author's eye rather
   than a silent overnight change:

   - **Render the world into a smaller buffer and blit it up.** One change at the top of
     `drawSurface`; every cull and every `W`/`H` inside stays correct because the code sees the
     buffer's size (`withCtx` already does this trick for tiles), and it is *cheaper* to draw. The
     price is softness: at ×1.4 the world is drawn at 914×514 and upscaled — on flat shapes that may
     even read well, but it is the game's best screen and it would no longer be pixel-crisp.
   - **Multiply every world→screen conversion by the scale.** Keeps full resolution and costs
     nothing, but touches every cull, every `groundAt` reader and the chunk cache's baking — the
     invasive version the note above already predicted.

   Cheap and unrelated to either: the chunk key already includes `H`, so a scale can join it without
   inventing anything.
2. **A full-screen panel with a screenful of nothing.** The HQ is fixed by drawing its room, but
   the class remains: `.scr` is `inset:22px …`, so every screen is full height whatever it holds.
   Either panels shrink to their content, or every short screen needs something true to show.
   Decide once, apply everywhere.

   **Measured 27.08.2026, and it narrows the choice a lot.** Every station tab already overflows
   its viewport — board 1229/452, yard 2094/407, cantina 2093/407, market 835, mods 990, instr 759,
   scrip 530, crew 441, barter 452, bases 452. Not one is short. So "panels shrink to content" would
   change **nothing** on the screen the player spends most of their time in, and the whole question
   is really about the handful of standalone panels (HQ and its kin). That makes "give the short
   screens something true to show" the narrower and cheaper job of the two — and the HQ already
   proved it works. Left for the author: this is a look-and-feel decision about every panel in the
   game, and `.scr` sizing also carries the `91f-ui` overlap guard.
   (Related, and already done: an overflowing list now *says* it continues — `27m-scroll-cue`,
   M212. That was the half of this complaint that was a plain defect rather than a decision.)
3. ~~**The mine is still the weakest screen**~~ — **largely closed by M214 (0.196.0).** It was not
   underbuilt but unlit and unbedded: one stratum fills the frame at shallow depth (where a player
   first arrives), so the rock came out a flat wash; and the massif had one brightness for the whole
   frame, so the screen had no centre. Partings inside a layer, following its own wave — laid AFTER
   `fillMaterial`, which ate them on the first attempt exactly as it once ate the cracks. Plus a
   falloff from the walker, per frame, measured at 0.4%% of a 0.92 ms frame. Stand `?s=dig`.
   **Still open:** the boundary with the sky is a hard cut with no soil profile, and the insides of
   the workings are flat.
4. ~~**Instruments nobody can read.**~~ — **closed by M213 (0.195.0).** The caption was six pixels
   at 45%% opacity (`6*FS`, `FS` from 1) — not a label, a texture; nine now, and it SHORTENS to a
   three-letter code when the cell is too narrow rather than shrinking further, measured per cell.
   The misclosure got a scale bar rather than a unit, because it has no unit — it is dimensionless;
   what it lacked was any way to see that zero is an end of a range and not a missing reading.
   Stand `?s=cockpit`.
5. **«Зачем лететь» lives inside the station.** The board (needs, tips, prices) is the game's
   motor and it only runs after landing, docking and switching a tab. **The fix must stay in the
   game's language:** the tester's own strongest praise was «ничто из этого не обращено к
   игроку — и поэтому работает». Quest markers and objective banners would buy the metric and
   sell the game. The receiver already broadcasts prices and rumours — make what it says
   actionable, and let the navigator act on what was overheard. This is also where the author's
   own idea belongs (below).

## The author's receivers, 2026-08-26 — needs one confirmation before building

Asked where the receiver should sit when a screen is open, the author answered with something
larger: «давай отдельную панель приемники и они дают доход или бонусы или нихуя не дают, просто
ты знаешь где они и можешь как в навигаторе проложить маршрут».

**My reading, to be confirmed:** receivers become *places*. Relays, beacons, far stations and
wintering posts that you have heard on the air get a panel of their own; each has a location, and
from that panel you can send it to the navigator exactly like a station. Some pay a little for
being serviced, some improve reception in their region, some only ever give a voice. That would
also answer finding 5 above without a single objective marker: you fly somewhere because you
heard something, not because the game told you to.

If that is the wrong reading, say so before it is built — everything else in this section can
proceed without it.

---

# QUEUE: the through-line — the arc of Восьмой (author's pitch, 2026-08-26)

The story lives in the saga, not here: [`docs/saga/ДУГА.md`](docs/saga/ДУГА.md) — the Lie, the
Truth, the single value, and how it lands on the eight parts of «Смена». The machinery it needs in
`src/` is [`docs/DESIGN-arc.md`](docs/DESIGN-arc.md). If the two ever disagree, the saga wins.

It runs *underneath* the world's story that `DESIGN-act2.md` tells: that act is about a common
undertaking and says outright the player is one of a thousand hands, not the hero. This one is
about the man. They do not compete — the expedition is the world, the fool is the person.

**The rule the arc stands on:** вселенная прощает, люди помнят. The world's offers never dry up,
whatever he did; the human doors close one at a time, quietly, and nobody shouts at him. Every
stake in the arc lives in the gap between those two ledgers.

**The economic law it makes:** the game never hands out credits, it hands out **access** — a
berth, a name to drop, a route nobody works, a bay in a garage, an introduction. Always attached
to a person, always with a real window that closes.

## First three, and only these — they turn the present sandbox into Act I

- **M189 — возможность.** The offer as an entity: kind, person, place, window, taken/lost. Arrives
  the way everything arrives here (ether line, counter queue, letter on the table), never marked
  on a map, expires without comment. Nothing else in the arc can be built before it.
- **M190 — игрок как источник слухов.** The rumour pipes (`11t`) exist and run one way: he only
  receives. Make him a source — what he says at the counter travels and comes back days later
  wearing someone else's face. The cheapest of the three squanders, and the one that teaches
  fastest that this world remembers.
- **M191 — тетрадь доброты.** Invisible, write-only, never displayed, never confirmed. It must
  exist early or the ending cannot pay. First entry is already in the game: leaving cargo at a
  mark for a stranger who will never know it was you (`11ag`, M171). Three guards: never shown; it
  must cost at the moment of the deed; and calculated kindness weighs less than kindness while
  broke.

## After those, in order

Act II (the first real loss, by his own hand, everyone kind about it) → the offers deepening
through the expedition → Act IV (doors closed, the world still offering, nobody left to vouch) →
the yacht last, because an ending cannot be built before the middle.

**Held back on purpose:** none of this goes in before the first hour works. The playtest put the
game's weakest point at minute two, and this arc lives on a scale of hours — building it first
would be building the roof.

# QUEUE: Трепло in the round — a separate 3D module (M200)

The author, 2026-08-26: the in-game parrot stays exactly as it is; the site's "take the bird
home" page gets a **separate module** with real 3D — shaders, pixels, no self-imposed limits,
"as beautiful as it can be". It is not part of the game and never talks to it: the only things
it borrows are the breed (cobalt back, cream breast, amber shoulder, swept crest with cold
beads) and the lighting rule (warm key above, cold fill from the left, rim behind).

**Where it lives.** Sources in `bird/`, built by `bird.ps1` into **one** self-contained file,
`site/treplo3d.html` — no server, no dependencies, not one external image, so the bird can be
downloaded as a single file and kept on a desktop. Same rules as the game's own build: modules
in filename order, one scope, 40 KB guard.

- `10-math` vectors/matrices/splines · `11-gl` WebGL2 wrappers · `15-geom` mesh box, tube,
  sphere, disc · `20-body` the breed: eleven spine stations, colour as a function of (t,a),
  the skin lofted 22 mm *under* the plumage · `21-parts` beak, cere, eyes, perch, zygodactyl
  feet, crest beads · `22-feather` one feather mesh, ~2000 instances laid out as a coat plus
  wing, tail and crest · `30-shade` GLSL · `40-pose` springs · `50-render` shadow → HDR →
  bloom → ACES · `60-app` camera, hands, error overlay.

**Built (first pass, 2026-08-26).** A parrot on a branch: hooked beak, ringed eye, folded wing
whose primaries converge behind the tail, layered tail, crest quills each carrying a glowing
bead, shadow-mapped warm key, HDR bloom on the beads, orbit camera, poke reaction.

**The traps that cost time, written down so they are not repeated:**
- *Sampler precision.* `sampler2DShadow` without an explicit `precision` is a compile error and
  the page goes black; the preamble in `11-gl` now declares it.
- *Frame transport.* A swept tube must carry its **X** axis along the path, not Y — carrying Y
  swaps the axes at the first bend and the beak came out a flat plate turned sideways.
- *One normal for skin and feathers.* They were computed twice, disagreed in sign on the crown,
  the skin turned inside out over the plumage and the head rendered bald. `bodyNormal` is now
  the single source, and "outward" is measured from a point pulled back along the spine —
  measuring it from the section axis is unstable exactly at the crown.
- *A feather is longer than its row spacing*, by about three times: a bird shows feather **tips**,
  not feathers. Equal length and spacing reads as a mosaic of paper chips.
- *The skin sits under the plumage*, 22 mm in. At the same surface the depth buffer fights itself
  and the coat comes through in torn patches.

**Still to do:** softer light in the gaps (ambient occlusion between feathers), the down layer,
the page around the bird (install/download, the same voice as `site/treplo.html`), behaviours
from `12z-parrot-acts` ported to the rig, sound, and the frame budget on a phone.

## M200a — the breed sheet, twenty passes (2026-08-26)

The author brought the character sheet for «Птица Говоруна» and asked for twenty passes of
"render → compare → fix", criticising the model against the sheet each time. What the sheet
said that the first build did not:

- **The crest is two objects, not one.** Long plumes swept back in an arc, *and* separate thin
  whiskers each carrying a cold bead. Building only the first gave a mohawk of short leaves.
- **The face is cream** — forehead, cheek and throat — with cobalt kept to crown and nape.
  Without the mask the bird reads as a blue lump no matter how good the beak is.
- **Ivory beak, not yellow**, with a raised keel, a dark tip, a painted nostril and a visible
  mouth corner; a dark interior with a tongue behind it so an open beak is not a hole.
- **Legs are long, grey-brown and scaly**, half-covered by thigh feathers; the toes wrap the
  branch by its own radius and end in real claws.
- **The tail is a stack**, not a plank: fifteen narrow feathers with stepped tips and two
  streamers of their own.

Things that cost a pass each, worth remembering:

- *A feather is longer than its row spacing, and its tip is what you see.* Twice the coat was
  fixed by changing tip shape, not by adding feathers.
- *Density on the head is a separate number.* Head feathers are small; at body density the skin
  shows through, and the head goes bald — twice.
- *Where the loft's sections vanish, so does everything laid out by `t`.* The crest roots all
  collapsed into one point at the crown until they were spread along the real arc instead.
- *A painted spot beats a modelled bead* for the nostril: the beak's sections are tilted, so a
  sphere placed "on the surface" kept ending up inside the horn.
- *Whisker and bead must share one sway phase.* A smooth phase from vertex position drifted the
  bead off its own thread; a coarse step over |x| keeps them together.
- *Back light belongs to the body, not to the plumage.* At full strength on translucent feathers
  the tail turned into a white skirt seen from behind.

Quality now degrades by itself: window width and touch pick the tier, and if the frame does not
hold, the page drops pixel density and then the bloom ladder — one way only, never oscillating.

## M200b — the joints, and the game's habits on top of them (2026-08-26)

The author: no quality fallback, the beak is small against the sheet, and **all the habits must
come from the game** — poke it and it flaps. The last point is the one that mattered: the model
had a head, a jaw and eyelids and nothing else, so the game's table of fifty habits had nothing
to drive. That is why twenty passes of colour and shape still read as "as it was, so it stayed".

**The rig now has the same degrees of freedom as the game's bird** (`12z-parrot-acts`):
`flap`, `stretch`, `fan`, `crest`, `tuck`, `step`, `footUp`, `hop`, `turn`, `peck`, `hang`,
plus the head, jaw and lids it already had. Wing, tail and crest are three joints applied
*before* the body pose, because they are local; the foot is lifted on one side only, chosen by
`footSide`; hang rotates the whole bird around the branch's own axis.

**The habit table is ported one to one** — same names, weights, durations, moods. Habits set
targets every frame, springs do the moving, and a few of them hit *velocity* (`flapV`, `hopV`,
`crestV`) so a wing-clap is a blow rather than a smooth lift. Mood works as in the game: `x`
when she has been touched, `s` as sleep builds up, cleared by a poke.

**The poke has zones again.** A ray from the cursor against six spheres — crest, beak, head,
wing, tail, body — and each answers differently, because one reaction for every click is a
button, not an animal.

Traps of this pass:

- *A joint's axis has to match what it moves.* The wing was first rotated around Z — the axis
  the folded feathers already lie along — so it barely moved and vanished into the body. It
  opens around **Y**: from lying back to pointing sideways.
- *Fan the feathers inside the wing's plane, not by moving the wing's own angle.* Spreading the
  main angle per feather threw the far primaries up over the head.
- *Flight feathers grow from the wrist.* With their roots smeared along the whole flank, one
  shoulder pivot scattered them like a star. Roots into a tight bunch, tips along the body.
- *A dead stand server serves from the browser's cache.* Three renders in a row "proved" the
  wings were broken; the page was simply the previous build.

## M200c — the art director's pass: silhouette over detail (2026-08-26)

The author's read of the model: technically strong, but it had become a *mechanical bird made of
voxel feathers* rather than the character — everything sat at the same level of importance, so
the eye had nothing to hold on to. His order of priorities, adopted verbatim:

    silhouette ↑↑↑ → big forms ↑↑ → character ↑↑ → small detail ↓

and, explicitly: **do not make it more realistic**. The strength here is stylised creature
design — a fluffy exotic bird plus something alien plus a little biomechanics, not a real parrot
rendered in 3D. The palette was declared correct and untouched.

What changed:

- **Coat: five times fewer feathers, each a plate instead of a scale** (34 rows × 52 against
  72 × 142). Per-feather colour jitter cut to a third: an even block of colour is the point, and
  the jitter was what turned the body into noise.
- **Crest: seven big plumes** instead of twenty-odd needles, with a length table so three of them
  carry the outline. The crest is now recognisable by its *contour*.
- **Whiskers: two pairs**, thick at the root and tapering, one pair swept back, beads a third
  smaller — an alien sensory organ, not wires glued to a bird.
- **Wing in three tiers**: five large primaries, five secondaries, two rows of six coverts, plus
  a pale mirror and a narrow amber leading edge. Colour in blocks; nothing multicoloured
  per-feather.
- **Tail: five long feathers**, the middle pair longest.
- **Beak a fifth shorter and thicker at the base**, hook sharper: it should be part of the
  character rather than the character being built around it.
- **Eye smaller and set deeper**, dark iris with a thin amber ring around the pupil.
- **Legs of a creature**: longer and thinner tarsus, three toes forward and one back, segmented,
  smaller claws, warm brown-gold.

**And the hole in the head was real.** A loft is a tube: its poles were never closed, and while
the plumage was dense and small nobody saw it. Enlarging the feathers opened a window straight
into the skull from above. Fixed twice over — the caps are built now, and a *crown* of nine
feathers is laid over the pole where the loft's sections degenerate to a point.

---

# QUEUE: сага против игры — что есть, чего нет (сверено по коду 26.08.2026)

Проверено не по памяти: все модули, которые называет разбивка `docs/SAGA-BOOK.md`, найдены
в `src/` по префиксу — **не отсутствует ни один**. Значит, дело не в коде, а в том, что внутри
готовых органов не хватает конкретных событий. Ниже честная разница.

## Есть и работает

Почтовый круг (`11e-post`, приборы там молчат через `06c`) · восемь глав отчёта и учёт
прочитанного (`12q-lore`) · смотритель (`11k-keepers`) · табло вернувшихся (`11s-returners`) ·
Вега, ученик, трепло, трудовая книжка · и построенное в этот заход: возможность как работа,
невидимая тетрадь, тихо закрывающаяся дверь, четверо (0.164.0–0.166.0).

## Есть модуль — нет ключевого события

| Что | Где | Чего не хватает | Цена |
|---|---|---|---|
| Строка без имени | `11s-returners` | среди просроченных строк табло нет ни одной с позывным шлюпки «Долгого Хода» | одна запись данных |
| Восьмая графа | `12q-lore` | восемь глав есть, но графа не спрашивает **имя принявшего**, и заполнить её нечем | средняя |
| Ирония трепла | `12z-parrot-*` | нет таблицы «своё событие → строка отчёта»: птица не повторяет чужую главу в минуту, когда та совпала с твоей | данные, один файл |
| Концовка смотрителя | `11k-keepers` | игла области не связана с присутствием игрока — скрытой концовки нет | обе механики уже есть |

## Нет вовсе

| Что | Почему это важно | Цена |
|---|---|---|
| **«Глобус»** | центральный предмет книги: латунь, щелчок раз в секунду, вторая стрелка — куда сядешь, если затормозить сейчас. В `25a-instr` его нет ни строкой | малая |
| **Игрок как источник слухов** | третий просёр («ляпнул лишнего»). Трубы `11t` есть и текут в одну сторону | средняя |
| **Ночи дома** | финал книги — он ни разу за двенадцать лет не ночевал в своём доме. Счётчика нет | малая |
| **Зимовка** | месяц одному: держать реактор, слушать стену, дождаться баржи | средняя |
| **Лезвие** | один заход, где можно не вернуться, и по своей вине | средняя |
| **Заступа** | шестая соперница: имя в слухах с части I, лицо и один разговор в VI | вечер |

## Противоречие, которое надо решить

**`G.name` уже существует и показывается на экране штаба** (`27c-ui-hq`, «ВАШЕ ИМЯ»), а книга
требует обратного: все зовут по позывному, имя игрок читает **один раз в самом конце**, чужой
рукой, в трудовой книжке. Построенное и замысел прямо расходятся. По замыслу имя надо перестать
показывать; это решение автора, потому что экран уже живёт.

## Порядок работ

1. **«Глобус»** — дёшево, видно глазами, и это тот самый предмет, ради которого писалась четвёртая глава.
2. **Строка без имени** — одна запись, платит через всю часть VII.
3. **Игрок как источник слухов** — следующий по приговору `docs/saga/СУД.md`.
4. **Восьмая графа** — главный поворот книги.
5. Ночи дома · ирония трепла · концовка смотрителя · Заступа · зимовка · лезвие.

## M200d — the ruler: a real macaw against ours (2026-08-26)

The author dropped in a rigged scarlet-macaw FBX (Tripo reconstruction, 56 MB, 970k vertices,
plumage *painted* rather than modelled). It cannot go into the module and was never meant to:
the module is one downloadable file, its pose lives on fifteen joints, and its colour is a
function of the breed. What the model is good for is a **ruler**.

- `docs/fbx.ps1` reads binary FBX (7400) directly — nested records, zlib-deflated arrays — and
  writes the mesh out raw. Two traps: `New-Object Type($a,$b,$c)` parses the parentheses as one
  array and arithmetic inside them lands on the array (`op_Subtraction on Object[]`), so
  arguments go through `-ArgumentList`; and converting three million doubles to float32 in
  PowerShell takes minutes, so the arrays are written as they are and the browser reads them as
  `Float64Array`.
- `docs/macaw-stand.html` draws three orthographic projections of the point cloud. A slice
  through the middle plane was useless — the model flies diagonally in its own file, so the cut
  went across it; whole projections are honest.

**Measured, then applied.** Wingspan 0.98 against body length 0.89: a wing is about as long as
the body, and ours reached a third of it. Fixed, and with it two things the ruler exposed:

- *Folded flight feathers are a stack, not a fan.* Their directions are nearly parallel and only
  the length differs; ours already fanned at rest, so opening the wing turned it into a star
  around the bird instead of a blade.
- *A tail fans from where the feathers grow.* The spread was computed from vertex x, and on a
  long feather the tip crosses the centre line, flipping the sign mid-feather — the tail opened
  as a cross. It now uses the instance's own root.

Also this pass, on the author's note that the bird had become a mechanical thing made of voxel
feathers: the coat is laid in **two layers** — dense small down underneath, big plates over it —
and the feather profile was rebuilt from a real contour feather: a thread-thin calamus, quick
widening, the broadest point below the middle, a soft oval tip, and asymmetric vanes.

## M200e — the wing has its own axes (2026-08-26)

The author drew the direction of the feathers straight onto the reference: they do not run along
the body, they fan **from the leading edge back and outward**, in overlapping rows. Everything
laid out along the body's spine parameter therefore read as ribbons down the flank, however many
feathers were in it.

The wing now has its own frame: `axis` from shoulder to wingtip, `across` from leading edge to
trailing, and a table of five rows — amber coverts on the edge, then violet-grey, the cream
band, pale-blue secondaries and long primaries — each row shifted back, longer, and rotated a
little less. Colours from the sheet; the deep cobalt trailing edge closes the stack.

Also: the beak follows the author's photograph now — bone at the base washing into warm amber
toward the hook, dark horn at the very tip, and the lower mandible as a short **darker** wedge.
A pale lower mandible merges into the upper one and the mouth disappears.

## M200f — five passes against the sheet, and why the site lagged (2026-08-26)

Five rounds of render → critique → fix → verify, each against the breed sheet's «Сбоку» view:

1. The folded wing lay as a horizontal plank longer than the tail; on the sheet it angles down
   and back and ends before the tail does. Wing axis tilted, rows shortened.
2. The beak was too big and almost white — warmed to the photograph's amber and cut down; belly
   tucked so it stops overhanging the feet.
3. Overcorrected: the beak had become a duck's nose with no hook. Height and hook restored, and
   the tail's five feathers given scattered lengths — an even fan of identical feathers reads as
   one blue plank.
4. Wing and tail merged into a single horizontal mass. The wing went up onto the back, the tail
   down and back; the crest grew a fifth.
5. Primaries converged to a point — a besom, not a wing tip. They splay now, and the culmen was
   slimmed where it had gone bulbous.

**And the reason the live site kept lagging a commit:** `bird.ps1` built its output path as
`Join-Path $root "site\treplo3d.html"`. On the Linux runner the backslash is not a separator but
part of a filename, so CI wrote a file literally named `site\treplo3d.html` into the repo root and
uploaded the *previous* committed page. Paths are composed part by part now.

## M200g — the pole plugged for good, seven times the feathers (2026-08-26)

- **The hole in the crown, third and last time.** The loft's poles are closed by a fan of
  triangles, but that fan's winding is easy to get backwards, and then face culling eats the cap
  and the window into the skull is back. The poles are now simply **plugged with spheres** —
  closed at any winding, twenty vertices each, sunk under the skin so nothing shows through the
  plumage. A sphere sticking out reads as a dark bead on the crown, so it sits 30 mm in.
- **Feathers ×7** (3 300 → ~22 000: 6 200 plates and ~15 900 of down), and **fluffier**: the tip
  of every feather is lifted higher, its angle scattered in all three axes, and the plates are
  narrower so the down shows between them. Quality never falls back on the fly — the phone tier
  is set once, at about a third of the count.
- The beak is pushed a further 30 mm forward, hook and all.

## M200h — six notes from the author, and the dark bead that was the hole (2026-08-26)

Six marks on a screenshot: the eye, the hole in the crown, invisible fluff, too few feathers on
the wing, one stray wing feather, and whiskers that did not glow.

- **The eye sat in a pit — and the pit was arithmetic.** The coat cut a bare disc of radius 0.118
  around the eye, while the bare-skin ring ended at 0.098. Between them lay naked *body*, and the
  body is painted as the dark mass under the plumage (material 0, albedo ×0.30): a flat blue
  patch half a cheek wide. The rule is now the other way round — the ring (0.134) is always wider
  than the cut (0.120), so feathers land *on* its edge.
- **The iris is the eyeball now, and the pupil a dome on top.** Both used to be flat discs floated
  in front of the sphere. The clearance only worked at the rim; in the middle the sphere pushed
  through, so from any angle but dead-on the warm ring was reduced to a crescent and the eye read
  as a black smudge. A dome stays a dome from every side, and it gives the cornea its bulge.
- **The hole in the crown was never geometry — it was colour.** The plug spheres passed
  `bodyColor × 0.30`, and material 0 darkens albedo by another 0.30 in the shader: 0.09, near
  black. The plug *was* the dark spot everyone kept seeing. Colour goes in plain now; the crown
  also gets four overlapping feather rings (17/14/11/8 quills, staggered) plus four caps over the
  pole itself.
- **Fluff is a shape, not a count.** Three tiers of the same oval give armour plating however many
  you lay down. Down is now its own profile — wide at the root, tapering to a hair — its own
  length (a plate's on average, every fourteenth one 1.7×), its own scatter, and its own light in
  the shader: the edge is lit rather than darkened, translucency 0.94, barbs sparse. Fluff reads
  where the silhouette breaks and light passes between the tips. First attempt overdid it and the
  bird came out a thistle: the taper exponent was the culprit, 1.55 gives a spike.
- **The wing: 59 feathers per side → 152.** Six layers instead of five (a row of marginal coverts
  along the leading edge covers everyone else's roots), each narrower, with the step jittered —
  thirty evenly spaced feathers read as a rack of teeth.
- **The stray feather across the breast.** The light piping along the coverts was built "from a
  point on the chest to a point in mid-air", and its length came out of the distance between
  them: on the shoulder that was a single feather a quarter of the bird long, lying across the
  white breast. Piping is piping — short feathers along the flow down the wing's leading edge.
  The amber epaulette moved back onto the shoulder for the same reason: near zero azimuth it
  crawled onto the chest and read as a bib.
- **The whiskers light up.** They were "a near-black thread, warmed at the tip": the warmth was
  lost in the general light and never crossed the bloom threshold (1.55), so the beads glowed and
  the whiskers hung there like wires. The thread is a source now — an even core, a run-up toward
  the tip, a halo along the grazing angle, pulsing at 1.7 Hz in step with the bead.

## M200i — the iris off the photograph, and why sixty was not sixty (2026-08-26)

- **The iris is painted, not modelled.** Third attempt at the eye, and the first that holds from
  every angle: the eyeball is one smooth sphere and everything on it — the round pupil, the
  radial fibres, the magenta band, the dark limbus — is computed in the fragment shader from the
  **local** position (`vL`, before the rig). Geometry could not do this: discs floated over the
  sphere had the sphere push through them in the middle, and fibres would have cost thousands of
  vertices on something the size of a fingernail. A local frame also means the pattern never
  drifts, however the head turns. First take came out a neon marble — a fully lit iris; the
  photograph has a dark plum mass and magenta only in a ring near the rim, so the ramp goes
  deep → mid → band → limbus, and the fibres modulate ±26%.
- **"It jerks unevenly."** It did, and the average frame rate said nothing: 60 fps at the median,
  33.4 ms at the 90th percentile — one frame in ten dropped, a few 50 ms. Profiling by canvas
  size found it fill-bound, not CPU: at 1024×768 the frame was rock solid, at 2419×1520 it was
  not. Three fixes, none of them visible:
  - **Feathers take the shadow with four samples instead of nine** (`SH_FAST` in the feather
    program). Nine PCF taps was the most expensive line in the frame — paid by every pixel of
    every feather, and feathers lie ten deep on a pixel.
  - **Down casts no shadow.** Sixteen thousand instances in the shadow map cost more than
    everything else together, and the plates underneath cast the same shadow anyway. The soft
    shading it used to give between feathers is bought back for free: the root of a down feather
    is darkened to 0.64.
  - **The canvas is capped by area, not by pixel density** (3.15 Mpix desktop, 1.35 mobile).
    Density 1.5 against 2.0 cannot be told apart; dropped frames can.
  - Result at the same window: 90th percentile 33.4 ms → 16.8 ms, dropped frames 10% → 0.9%.

## M200j — the eye stops being a sticker (2026-08-26)

"Ugly around the eye", with the spot circled. Three things were wrong at once, and all three were
the same mistake — solving a plumage problem with a bare patch.

- **The bare ring was a pancake.** 0.134 across is a third of the cheek: a smooth, unshaded blob
  with a hard rim where the feathers stopped. Narrowed to 0.098, and the dark inner ring to 0.068
  so it reads as a liner rather than a puddle.
- **The brow "fold" was a black blade.** It was geometry — a near-black crescent standing 22 mm
  proud of the skin, which from most angles read as a hole in the head above the eye. Deleted;
  the crease is drawn on the skin in the shader now, along with the rows of fine dots real bare
  parrot skin has. Both cost ten lines and no vertices.
- **Plate feathers are gone from the whole ring, and a rosette owns it.** Plates lie *along the
  flow* — backwards — so any plate rooted in front of the eye covers it with its tip: cutting the
  bare zone down to 86 mm simply grew the eye over. A wide cut is what the pancake was. So plates
  are cut out to 150 mm and the ring belongs to a rosette laid on the same (t,a) as the rest of
  the coat — it lands on the surface and takes the common colouring — but pointed **away from the
  eye centre** instead of along the flow. Feathers that radiate cannot cover the eye, and the cut
  edge disappears under their tips. Down keeps a narrow 100 mm cut: it is small and soft.

## M201 — the extras shelf: two birds and the road (2026-08-26)

The bird block on the front page becomes a shelf of three things that live outside the flight,
each with its own preview of the same proportion:

- **Трепло, flat** — the live canvas that was already there, poked with a finger, linking to
  `/parrot.html`. Kept as its own card rather than replaced: the 3D module is a second version,
  not a successor, and both stay.
- **Трепло in the round** — `/treplo3d.html`, preview rendered by `bird/shot.ps1`.
- **В дорогу** — the companion screen, shot off the `docs/mkroad.ps1` stand. It opens inside the
  game (systems → «В ДОРОГУ»), and the card says so rather than pretending to be a launcher.

**`docs/towebp.html` + `docs/towebp.ps1`.** There is no webp encoder on this machine — no
ImageMagick, no cwebp, and the `convert` in PATH is Windows' filesystem converter. Chrome has one:
the page loads a PNG off the stand, draws it into a canvas of the requested size and crop, and
POSTs `canvas.toDataURL("image/webp")` to `/shot` — the same route the front-page frames already
use (`docs/mksiteshots.ps1`). 397 KB PNG → 37 KB webp. Trap on the way: a local `$q` in a script
that also declares a `[double]$Q` parameter is the *same variable* in PowerShell, and the string
assignment fails with a type error that names neither.
