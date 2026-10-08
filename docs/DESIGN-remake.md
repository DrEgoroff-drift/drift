# The whole game by «Сцена» — the remake programme (M800–M899)

Branch `planet-main` (worktree `C:\Claude\drift-merge`): the planet branch plus main 0.492.0.
Milestones **M800–M899** are reserved for this programme; M600–M652 stay the planet's
(`DESIGN-planet.md`), M700–M729 were the space branch's (`DESIGN-space.md`).

## 1. Why

The author, 08.10.2026: «Забери всё, что делала „Графика для игры на новом движке“, тебе на
ревью. Оно всё влило в мейн. Ты можешь критиковать и делать по-другому. Теперь переделываем
всю игру по нашим правилам — по которым ты сейчас рисуешь. Составь план, всё подвергай критике
со стороны текущих правил. Переделывать можно всё.» And on the method: the design, the forks
and the critique are mine; an Opus agent builds; a Sonnet agent merges branches.

So the planet's method («Сцена», `DESIGN-planet.md` §3–§6: reinvent from purpose, never port a
picture) now applies to every frame of the game: flight, the station, the rooms, the ways down,
the interface. What the player sees is judged by one set of laws; what the player does, the
physics, the generation and the save do not move.

## 2. The laws

Binding, in this order:
1. **«Сцена»** — `DESIGN-planet.md` §3 (ten laws), §6 (the bar), `DESIGN-planet-style.md` (the
   numbers: value bands, chroma ceiling .22, the man .085 of a broad frame).
2. **The craft rules** — `DESIGN-craft.md`: the eight laws of the frame and the ten rules of
   laying paint; «rules may be broken for beauty, and the gain line says what was broken».
3. **The interface rules** — `CLAUDE.md` (size and colour, 44 px, only what is needed hangs over
   the world, one ruler) and the plate material of M720 (`DESIGN-space.md` «The interface»).

Six laws that carry «Сцена» beyond the planet (new, 08.10):

- **L1 A place, not a form.** Every screen is a scene with plates over it. The station, the HQ,
  the home, the hangar and the cantina are rooms the player is in; the table, the list and the
  card are plates that hang in that room and never hide it whole. A form with no room behind it
  is a bug of the picture.
- **L2 One astronaut everywhere.** The man is the planet's rig (`21pha`), rendered to the frame
  in 3D or to a card where the mode is flat. No second painter of the man anywhere: not in the
  base, the cave, the dig, the raid, the home, the postcard.
- **L3 One person generator everywhere.** Every face and body of an NPC is `27f3`/`27f3a`
  (the space branch's people). The HQ's 2D dolls, the crew lists, the story figures, the road's
  keeper all take it.
- **L4 One body kit, one light.** Bodies are procedural meshes in one vertex format lit by one
  pass per scene (the planet's kit `21pg*` on the ground, `17c2a`/`h3dKit` for hulls and parts,
  `27f2` for interiors). A sprite beside a body is a port, not a picture: pirates, barges, the
  station body, the belt rocks all become bodies.
- **L5 Words hang on things.** A prompt, a discovery, an arrival line sit on the object they
  are about, with a leader line if the object is small; nothing stands in the centre of the
  frame; no text over text.
- **L6 The frame has one hero.** The brightest, sharpest, most saturated spot is the thing the
  player is about to act on. The hero stands against air (a value and hue gap), never against
  its own colour.

### 2.1 Already built — replace, do not rebuild

The author, 08.10: «учти, что у тебя уже есть, чтобы заменить просто… не надо старую трогать,
а просто новой заменить. Вся игра должна быть в новом стиле. Если людей в 3D уже построили —
принимаем и критикуем по новым правилам». So every old thing falls into one of three kinds,
and each kind has one rule:

1. **The planet branch already built it** (the table below) — the new thing goes in the old
   thing's place whole. The old module is switched off and later deleted, never patched or
   repainted: not one hour goes into the Canvas 2D cave, landing, figure or drill.
2. **The space branch built it** (3D people, hulls, rooms, the orb, «Борт») — accepted as the
   body and judged by §2's laws; what fails a law is fixed in that body, not replaced by a
   third one. The verdicts of §3 are those judgements.
3. **Nobody built it yet** (the station hall, the cave, the dig, own base, the road's place) —
   built new, by the laws of §2 and from the kits of kind 1 and 2. The old 2D version is not a
   reference and is not compared with (the rule of 06.10); it is read once for what the player
   does there, then left alone until the new one replaces it.

The map of replacements:

| Already built | Replaces | Where |
|---|---|---|
| the man's rig `21pha` (bones, suit parts, poses, flame, lamps) | every figure of the player: base, cave, dig, raid, home, winter, spa, the postcard's box-man | M801 |
| the ship on its gear and the descent `21phb` + `21pza` (already wraps `drawLanding`) | the landing approach (slab, strata, lollipop trees, the lander bake); the ship of the road and the postcard | M830, M851, M832 |
| the frame and the lens `21pz` (far/near lens, the glide, the hour's five acts, the sky bodies) | the landing camera, the cave's push into the rock, the base's cross-section opening, the hour of the base's surface strip | M830, E |
| the planet's sky (clouds, eclipse and corona, hours, weather look) | `19b-sky`, `19e-clouds`, `19ca–cc` of the landing; the road's sky over a planet | M830, M851 |
| the ground kit `21pg*` (facets, the world's dress, water, crags, the wing) | the landing ground, the base's mountain and earth, the dig's cut (the same rock kit in section) | M830, E |
| plants `21pia`/`21pgd`, trees `21pgb` | the landing's trees, the greenhouse and the farm room of the base | M830, E |
| beasts `21pib`/`21piba` | any creature of the cave or the landing | E |
| the drill `21pic`, tracks `21pid`, the deposit boulder | the dig's drill and bite, the base's drill room | E |
| landmarks `21pie` — the people's grammar (grey steel, rust and soot, orange belts, concrete, lamps by the night key) and the ancients' | the base's modules and the settlement (M628), home and fence, the station hall's props, the postcard's places | E, M810 |
| weather cards `21pk` | the landing's rain streaks, the base's surface weather | M830, E |
| the planet's light (one shadow map, sky fill, lamps, fog, bloom) | the cave's, the dig's and the base's light passes | E |
| the interior renderer `27f2` (MRT haze, shadows, bloom) | the station hall, HQ, home, winter, spa, «Сорока» | M810, M850 |
| people `27f3`/`27f3a`/`27f6` (seed → body, face, emotions) | HQ's dolls, crew lists, story figures, the keeper, the road's voices | M802 |
| hulls `17c2a` + `h3dKit` + parts `17c2b/c` | pirates, barges, traffic, the station body, the road's sprite, ВЕРФЬ's thumbnails | M820, M812 |
| the hangar studio `h3dStudioRT`, `partThumb` | any card that shows a thing: ВЕРФЬ hulls, ПРИБОРЫ dials, the site's silhouette | M812–M814 |
| the orb `17gab` | the map's planet icons, the station window's view of the planet | M822, M810 |
| the plate material of M720 and `#ovl` | every prompt, discovery and arrival line (`ovHang`), the map's status lines | M803, M822 |

## 3. The verdict on main 0.492.0 (the space branch's work, reviewed 08.10)

Four reviewers (Sonnet, read-only, by `scratchpad/review_brief.md`) shot ~70 frames of main on
the real GPU; I read the sheets. The frames with their reports stay in the scratchpad
(`review/<area>/`); nothing goes into git. Author's decisions quoted with a date in
`DESIGN-space.md` are kept as decisions.

### 3.1 Flight (the system view)

| Thing | Verdict | Why (the law) |
|---|---|---|
| **The world dies after a jump** (`gpuBind("gor."+key)` reuses a bind group across orb families: 12 validation errors, the frame goes black until reload) | **fix first, hotfix to main** | the game is broken on the live site for most jumps |
| Planets from orbit: twelve forms, one key light, OKLab chroma ceiling, nothing blinks | keep | the law is already there |
| The night side of every planet: black, no sky fill, no warm terminator | remake | 4, 5 — the disc loses its silhouette |
| Polar caps blown white with a hard edge; a translucent ellipse on the terran land | remake | grain, not fill |
| Crystal (green marble, no facet, no violet), ice (no lineae), jungle (chroma over the ceiling), rocky (neutral grey in a blue frame) | remake, each in its own pass | 1, 3 |
| Gas giant with a ring | keep; ring shadow on the disc | — |
| Moons: one grey ball for every moon of every parent | remake | 2, 3 — the ramp from the parent's palette and type |
| City lights on the night side: not seen in two tries | fix | the design says they show |
| Star and corona | keep; add a limb and granulation | 1 |
| Nebula near the star («смело», the author 26.09) | keep | the author's choice |
| Nebula far from the star: flat peach shards, no depth ramp, straight streaks | remake | 5 |
| Own ship in 3D with parts on the mounts | keep; tint away from the nebula's brown, a brighter silhouette edge | 6 |
| Pirates, barges, traffic: sprites beside a 3D hero; friend and foe differ by a label bar (09.10: pirates, NPC and allies are already bodies — M710; barges, traffic, the station are not) | reinvent | L4, 2 — bodies, a hostile form that reads without the bar |
| Station body: a flat grey top-down sprite, no lamp, no shadow | reinvent | L4, 4 — the one thing people live in is the dullest |
| Belt rocks sprayed, a straight lighter band across the frame at zoom 2 | remake | 1 |
| Discovery, arrival, prompt text in the centre; a stamp over a line | remake | L5 |
| The camera's «body in frame» parks a planet under the rail at 760 | tune | interface |

### 3.2 The interface («Борт», the station screens, the hangar)

| Thing | Verdict | Why |
|---|---|---|
| The plate material (smoky graphite, cut corner, role tick), «Сурик», hierarchy by size, keycaps, corners as addresses, the pod of five dials, the phone HUD | keep | one material that holds across DOM and engine; the phone frame is the cleanest of the set |
| Eight plate groups over the world at once; the receiver as a full plate with a dead «ШУМ» strip; «Фото» permanent | trim | only what is needed hangs over the world |
| The tutorial banner over the receiver's tabs (text on text, a glyph drops) | fix | L5 |
| The open rack: brushed metal, screws, blank cream chart on half the frame, repeating the pod's numbers | remake | one material; nothing in the centre; the chart is the brightest mass |
| The menu's door names in tracked caps | tune | size, not caps |
| The map: status lines in raw monospace on the world, the hint hung on nothing, a field of equal icons | remake | L5, L6 — three weights (yours, the route, the rest) |
| Station screens: a calm graphite table that hides the station whole («a dock with no dock») | **reinvent** | L1 — the station is a place; the screen is a plate over its hall |
| ВЕРФЬ: 70 px hull thumbnails under 20 px class caps | remake | size — the hull first, at ≥160 px, from the hangar's studio |
| ПРИБОРЫ: five prose rows, no instrument on the instruments' screen | reinvent | texture says what a thing is — the dials as objects with their drift |
| СТРОЙКА empty: one line and 70 % void | remake | show the site's silhouette and what blocks it |
| РЫНОК, МОДУЛИ cards; ДОСКА | keep; fill the level pips; one level of caps | — |
| The hangar bay: 3D ship, markers, leader lines, cards | keep | the best screen of the area |
| The hangar's stage title across the hull; wood + felt + navy blueprint around a graphite bay; four typefaces | remake | L5, one material, no navy |
| Part thumbnails | keep; pedestal at half glow, picture twice as large | — |
| Phone: 9 px action sub-label, the invisible joystick ring, the clipped first tab | fix | 44 px, legibility |

### 3.3 People and rooms

| Thing | Verdict | Why |
|---|---|---|
| The interior renderer (`27f2`: lamps with haze, shadows, bloom, ACES) | keep | it is the room kit of L4 |
| The cantina hall: one mannequin on four stools, no hero, the sign in the centre, the hall a letterbox at a fifth of the screen | remake | 1, 4, 6, 10; L1 — the hall is the station's room, the cards hang in it |
| Clothing kits, portraits' studios | keep | — |
| Faces: saw-tooth hairline, hair as streaks over a cap, no nostrils, gaze 15° off, lip-corner notches, a slab beard, a glowing-eye variant | fix in one pass | 3; the generator is right, the sculpt needs its second pass |
| HQ room: 2D parka dolls beside a 3D bust of the same person | reinvent | L2, L3 |
| Home: a black roof on 55 % of the frame, a 40 px paper figure, the hint in the centre | reinvent (the planet's M628 base/home) | 1, 6, 10 |
| «Сорока»: the corridor, the curtain, the keeper under his lamp | keep; the line to his head; a face for the keeper | L3, 10 |
| Winter, spa: flat 2D rooms, a cut-out person | reinvent on `27f2` with the rig | 1, 4; L2 |
| The road companion: hard-edged cloud lumps, a 2D ship, a rainbow spectrum bar, teal text | remake | the soft-nebula rule; L2; 3 |

### 3.4 On and under the ground (outside the surface walk)

| Thing | Verdict | Why |
|---|---|---|
| Landing approach: an extruded slab with strata, lollipop trees, the lander a bake, the readout in the centre | **reinvent as the planet's own descent** (`21phb`, M621: the ship comes down over the planet renderer's far lens) | 1, 2, 4, 6; L5 — one world seen from height |
| Landing sky, sun, haze, weather fields | keep where the planet's sky does not already do it | — |
| Scoop in a gas giant | keep; a dark near plume, warm light on the ship, the prompt on the ship | 6, 10 |
| Cave: hatched navy slab with holes for rooms, pale ovals, light from nowhere | reinvent (planet's M630+) | 1, 2, 3, 6 |
| Cave light model (albedo × light), props, flora, crystals | keep as mechanics; re-light from the lamp | — |
| Dig/mine: black rectangles, a wedge lamp, a light shaft through rock, ore specks, a sky strip that ends at x=1000 | reinvent; fix the strip first | 1, 4 |
| Base in cross-section: the dollhouse reads; twelve rooms of one grey box, brown paper ground, a panel over the HUD | reinvent dressing and ground (planet's M628), keep the grid, power, lift, crew | 1, 6 |
| Raid: real 3D, correct perspective, the hangar frame well composed; one maroon wash, plain boxes | keep; one key light, lit facets, a body per foe role | 4, 3 |
| Belt mining: faceted bodies, one sun | keep; haze by depth, three size lanes, the prompt on the rock | 5, 10 |
| Postcard painter: a second flat language with a box-man | reinvent — the card is painted from the live engine frame; the 200-byte snapshot, the frame, the caption and the filters stay | L2, 2 |

### 3.5 What the planet branch owes (its own weak spots, same law)

The old 2D surface is still the default (`PLN.on` false unless `?pln=1`): M800 flips it. The
cave, the base and the home are the planet's M628–M652 and keep their numbers. The twelve
landmarks are in M627b (interactions, `DESIGN-marks.md`). The surface's own frame debts are in
`DESIGN-planet-engine.md` §6.

## 4. The programme — stages, milestones, gates

Each milestone is built like the planet's: purpose → silhouette ideas → key frame on a stand →
three passes with written self-critique → the pair at 760 and 390 → the gate (§5). Order by what
the player meets first and by what one reinvention gives to the next.

### Stage A — the foundation (M800–M809)

- **M800 Hotfix + hand-over of the planet.** The orb bind-group cache keyed by family (and
  moons), the jump repro green; city lights seen on the night side; the dig's sky strip. Then
  `PLN.on` true by default, `?pln=0` the old painter until M890; the P1 phone gate re-run.
  Gate: a jump, a landing and a walk in one session with `errs 0`; test.ps1 green.
  - *Stage A, done — M800a:* `gpuBind` (`08c-gpu-kit`) keys its cache by the pipeline as well as
    the resources, and the orb's group carries its family (`"gor"+fam+"."+key`, `17gab`); a jump
    into a system whose planet 0 is of another family no longer reuses a foreign bind group —
    `errs 12` → `errs 0`, guarded at encode time by «видеокарта: после прыжка группы привязок — своего конвейера».
    Shipped alone as the hotfix release **0.492.1** (9a9bc13a, cherry-picked onto origin/main, dev → main).
  - *Stage A, done — M800b:* city lights in the orb (`17gab` `cityLit`, the `nc` block of `fs`): a
    settlement lights the land around it (a ~.17 rad halo on the sphere) with a city pattern whose
    sub-pixel scales fade to their mean instead of to zero; sea, caps and the lit side stay dark.
    24 lights at zoom 2.5: one faint dot → a field of warm specks on the night land (`night_lights.png`).
  - *Stage A, done — M800c:* `PLN.on` is true by default (`21p-pln`), `?pln=0` keeps the old
    painter until M890; the planet overlay's tags follow the frame's ruler `UIK` (the кегль law
    at 2560 found them at 8.5 px); the travel suite warms the two one-time tables (regions,
    «Сорока») before it counts the road and allows the rail net's stops along it. The dig's sky
    strip is *not* patched: the dig is a kind-3 thing (§2.1) and gets the planet's sky whole in
    Stage E. The P1 phone gate is run with the hotfix release, not here.
- **M801 One astronaut everywhere.** The rig of `21pha` rendered to a card (`rigCard(pose,
  lens)`) and used by the base, the cave, the dig, the raid, the home, the winter, the spa and
  the postcard in place of their own figures. Gate: the man at the same size in men across the
  modes; no second painter of the man left in `src/`.
  *Done, first part (08.10, remake-a2):* `21phc` `rigCard()` renders the rig to a card (all
  seven poses of the book, walk in eight phase steps, cache ≤ 24); takers behind `RIG_CARD.on`:
  the base (player and the standing/walking shift in issue grey; seated and bare-headed still
  the old brush — the rig cannot sit), the cave (headlamp light), the raid (a card from behind,
  tilted to the camera). The man is 1.8 m everywhere; frame share at 1080: base .022, cave .042,
  raid .209 — base and cave under .05 by the modes' own scales. Open: dig, home, winter, spa,
  postcard; the old painters stay until M890. Suite `91qb-rig-card`.
- **M802 One person generator everywhere.** `npcMake(seed, brief)` of `27f3` for the HQ, crew
  lists, story figures, the keeper of «Сорока», the road's voices. Gate: no `mgrFace` 2D call
  left.
- **M803 Words hang on things.** One overlay rule for every mode: the prompt, the discovery and
  the arrival line are leader-lined plates on their object (`OVL`), the centre of the frame
  kept empty; the tutorial banner finds a free band. Gate: `test-geom` asserts no prompt box
  intersects the centre 40 % of the frame in any scene.
  *Done (08.10, remake-a2):* `08bj` `ovHang()` / `hangSay()` — M720 plates (graphite, cut
  corner, cream ink, the verb in accent) laid out per frame off the centre band, the HUD, the
  rail, world labels, chips, the #msg line, the surface hint and the man; leader when stood
  off; hidden when nothing fits. Takers: discovery (on the planet), arrival and stamp (on the
  ship, stamp in its power's ink), landing readout and gravity, scoop in/out, belt in (on the
  target rock), the surface «what» line of a landmark or a deposit. Without WebGPU the old
  `say()`. Vision law «центр» in `90b2-geom` with a planted plate. Open: the old
  tutorial banner and `G.prompt` stay as they were (brief); only the wreck has act lines.
- **M804 The night side.** Sky fill and a warm terminator on every orb; caps as grain; moons
  from the parent's palette. Gate: a pair of five worlds at 760.
  - *Done (four passes, `17gab`):* the night side is filled by its own sky — a cold blue
    for an airless rock, the air's hue (`chromaCap`) where there is air — so the dark half is
    a shape, not a hole; the terminator is a warm *rim* (`termB`, a gaussian in `m0g` whose
    width grows with `thick`), not a band — pass 3 smeared a brown belt over the night land
    and pass 4 narrowed it to an edge; the polar cap is grain with cracks (`n3` at 70 and
    120, a cold tint in the hollows) instead of a white blot — judged on an ice world, since
    the terran's pole sits under its clouds; a moon's palette is `GOR_MOON` pulled towards
    the parent's hue (`gorMoonPal`, .55 of the chroma, cached by the parent's seed) — the
    ice moon of a crystal world reads mauve. Frames: `orb_n5_*` in the scratchpad; the
    gate pair at 760 is folded into the hotfix release's P1 run.

### Stage B — the station as a place (M810–M819)

Design: `docs/DESIGN-hall.md` (09.10) — the bones, the seven dressings, the camera stations, the plate.

- **M810 The hall behind the screens.** One interior scene per station type (`27f2`, props
  from the people's grammar of `21pie`, the planet through the window by `17gab`): the
  counter, the yard window, the board wall, the cantina door, the office. The camera glides to
  the section's place; the screen is a plate over the hall at 60 % of the width, the hall and
  the station body (through the window) always visible. Gate: the dock pair at 1920 and 390.
- **M811 The counter (ТОРГОВЛЯ)** — the keeper (`27f3`) behind it, goods as crates on the
  counter; the table as a plate. **M812 The yard (ВЕРФЬ)** — hulls on the hangar studio at
  ≥160 px, the class as a tag. **M813 ПРИБОРЫ** — the five dials as objects with their drift
  on a plate; prose gone. **M814 ДОСКА, ЛЮДИ, ВЛАДЕНИЯ, СТРОЙКА** — the board on the wall, the
  cantina as the hall itself (M725 composed anew: poses, one hero, the sign off centre), the
  site's silhouette. **M815 The phone reflow** of all of the above.

### Stage C — flight (M820–M829)

Design: `docs/DESIGN-bodies.md` (09.10) — pirates are already bodies (M710, kind 2); barges, traffic and the station become bodies of the hull kit; the hostile form without a bar.

- **M820 Bodies for everyone.** Pirates, barges, traffic and the station as meshes of the hull
  kit with a maker grammar; hostile forms that read without the bar; the station with lamps
  (the only warm light of people) and a cast shadow. Gate: the foes pair at 760.
  *Done (08.10, remake-a2):* `17c2e` kit (`BODY.on`, `sysLightDir`, `bodyBar`, fleet by
  class, shuttle), `17c2f` barge 3–6 frames and the broken wreck, `17c2g` station per
  `ST_TYPES` and maker assembly, `17c2h` hostile dressing, the clean power ship and the
  target frame by the body; seams in `12l` `13` `17f` `12ai1` `17c` `12i` `15b`; suite
  `91qd-bodies`. Not here: drones (unchanged), the fleet `node`/`derelict` and ships fading
  at dock keep the bake; the barge distress cue still speaks from the centre (a cue, M826).
- **M821 The rack** as a side plate of the pod's dials, chart paper dimmed, the centre free.
- **M822 The map** with three weights, plates for the status lines, the hint on the selected
  object.
- **M823 The nebula far from the star**: inner structure and a depth ramp, no straight streaks
  (the look near the star is the author's and stays). **M824 Belt**: rocks clustered round the
  actor, haze instead of the band. **M825 The orbs' second pass**: crystal, ice, jungle, rocky,
  the ring's shadow, the star's limb. **M826 The HUD trimmed**: the receiver folded to a chip,
  «Фото» into the menu, the camera's body-in-frame rule aware of the rail; the barge's distress
  cue as a plate at its callsign (the cue stays the source of the action button, only its place
  moves); on the phone the lens glides to the target in a fight (the planet's `plnGlide` rule),
  so a pirate is never a 40 px spot (decided 08.10 after M820).

### Stage D — the way down (M830–M839)

- **M830 Landing by the planet's descent.** `21pza` already wraps `drawLanding` with the planet
  renderer's far lens and the 3D ship coming down (`21phb`, M621), so with `PLN.on` the old
  approach is replaced, not rebuilt: M830 is its hand-over — the seams (the readout, weather,
  the pad, the touchdown into the surface frame without a cut) done in the planet's modules,
  then the strata slab, the lollipop trees, the landing bake and the 2D sky (`19b/19e/19c*`)
  switched off for good; whatever they did that the planet's sky lacks is built in `21pz`,
  not kept. The autoland rule and controls stay. Gate: the landing pair; the S23 budget.
  - *Done (M830 pass 1, `21pza`/`21pz`):* the touchdown is one shot — the descent's lens
    (`plnDescLens`) stores its window centre, ground line, ruler and near share in `PLN.hand`;
    the first surface frame takes them whole and `plnHandAge`/`plnHandWin` ease centre, ground
    line and ruler to the walk lens over `PLN_HAND_S` (1.2 s of wall clock from the first surface
    frame, not from the touch, so the touchdown count does not eat it), and `PLN.glide` starts
    from the descent's near share. The descent's lens closes in near the ground (`o.near`,
    0.6 · smooth(30 m → 6 m)). The pad is a body (`plnPadFrame`, by `o.extra` on the descent and
    in the surface branch): a slab with a rounded edge (superquadric, `PLN_LPAD`), top 0.35 m
    over the levelled ground or over the water (`plnPadTop`), its foot 3.2 m deep as a berm, a
    metre behind the ship so its near edge stays off the walk line's slope; 32 amber dashes on the
    edge, two lamps on posts at the far corners (lamps light it only at dusk, `PLN.sun.night`);
    to `PLN_TO.all`, so it casts. The ship is set on its top on the descent and on the surface
    (`plnPadLift`), its feet find the slab (`o.floor` in `plnShipFrame`), the flora clears it
    (`plnPlantThings`). The approach wave (`plnPadGlow`) runs the dashes and dies over the
    touchdown count. The exhaust's wash is a lamp on the ground under the nozzles from 24 m down;
    at dusk a landing flood stands 4.5 m before the ship toward the lens (the pad lamps light its
    back). The overlap net of `91zzzb-land` counts the readout in the row as part of the row.
    Words on things (L5): the say line under the descent is a plate over the ship
    (`plnDescOver`, in window pixels like 21pj's plates) and `#msg` is hidden (`body.plnland`);
    the readout (`plnLandRead`, wrapping `updateLanding`) speaks metres and m/s in two lines and
    is moved into the pads row before ТОРМОЗ on a plate (`plnLandUi`, wrapping `hud`; on a phone
    it stays above the row). The landing's place line gets the weather (`27z`, one line, as on
    the surface). The zenith darkens with height (`o.zen`, up to a third at 70 m). Everything
    else the old approach did the planet frame already does (the haze, the far ranges, the
    stars), and with `PLN.on` the 2D sky, strata, trees and lander bake are not called at all —
    the wrapper of `drawLanding` falls back to them only without the GPU or after three failures.
    Cost (desktop, pc 1600×900, GPU ms per frame): desert surface 2.54 → 2.55, desert descent 2.43 → 2.45, ocean surface 4.05 → 4.06, ocean descent 3.70 → 3.72 (the slab, its dashes and lamps cost about 0.02 ms). Tests `91qc-descent` (Node):
    the first surface lens equals the last descent lens to 1e-6 and the near share carries over,
    the pad is in frame at touchdown, the ship stands on the slab (land, water, off the pad), the
    readout's units, the dashes and lamps never go dark, and `?pln=0` draws the old approach while
    `PLN.on` never touches it. Tools: `cost.py js=` measures a descent snippet; `descent.py fn=`
    shoots the n-th surface frame.
  - *Done (M830 tail, `21pza`/`21pzb`/`21e`/`style.css`):* the dashes go to the frame only at dusk
    (`PLN.sun.night`), at `PLN_LPAD_DASH` = 0.4 of the wave's glow; the wave's share is
    smooth(2.5 → 3.5 m) of altitude, zero after the touch. The post bulbs are the key (`plnPadBulb`
    4.8 ± 0.9, radius 0.21, lamps r 10, k 2.2 · dusk, pushed before the flood) and two glint streaks
    lie on the far edge under them in the dash batch. `plnDescOver` hangs the approach lines with
    `ovHang("land", …)` at the ship's middle (window px = `plnOverAt` × `G.viewK`). `21pzb-pln-words`
    wraps `msgHeld` (silent while `PLN.hand` and `PLN_WORDS_HUSH` s after it — the message's clock
    waits), `enterSurface` (the «залежей: n» line moves into the tip plate), `surfaceHint` (the tip
    leaves the band) and `hangSurface` (the tip at the nearest deposit in frame; an action line
    nobody hung goes to the ship within `shipZoneR`, else to the man), and toggles `body.plnwords`
    (hides `#prompt`) and `body.plnhush` (hides `#msg`). `21e` skips near ticks under the planet
    frame and all chips during the hush. Test: the third suite of `91qc-descent`.
- **M831 Scoop**: a dark near plume, warm light on the ship, the prompt on the ship.
- **M832 Postcard from the frame**: the card is the live engine frame through the album's
  filters; the painter deleted.

### Stage E — under the ground and the base (the planet's own numbers)

Built from §2.1, not anew: the rock and ground kit in section, the planet's light pass, the
people's grammar of `21pie` for modules and props, the rig for the figures. M628 own base and
home, M630+ the cave, the dig as lit rooms (one source through air only,
veins as three or four large forms), the raid's light: these are built in `DESIGN-planet.md`'s
queue by the same builder, in this order after Stage D: base and home → cave → dig → raid.
Design for the first two steps: `docs/DESIGN-base-scene.md` (09.10) — own things as bodies of the people's grammar on the engine's land (M628a/b), the section as the rock kit cut by a plane with lit rooms and two lenses (M632a–c), entry by the gate without a cut; the base's game (`DESIGN-base.md`) untouched.
The third step: `docs/DESIGN-cave-scene.md` (09.10) — the stand's M601 scene fed by the game's grid (one density from `C.g`, the cut face as a page, the lamp as the key with shadows and a cone, the day by a second map, three lenses), the way in as a push through the arch without a cut; `CAVE3.on`/`?cave=0` (M630a–d).
The fourth: `docs/DESIGN-dig-scene.md` (09.10) — the dig as a vertical section on the cave's kit, dug cells as rooms each under one source, ore bodies as three or four large forms, the planet's sky whole at the top, the way in as a pan down; `DIG3.on`/`?dig=0` (M631a–c). The last: `docs/DESIGN-raid-scene.md` (09.10) — the raid on the interior renderer `27f2` (one key with shadows per room, materials and palette per room kind), foes by the generator in a hostile kit with walk/aim, the rig ported to `r3Kit`, the push through the gate; `RAID3.on`/`?raid=0` (**M633a–c**, a planet-range number so the same builder's queue reads in order).

### Stage F — rooms and people (M850–M859)

- **M850 HQ, home, winter, spa** on `27f2` with the rig and the generator: one key lamp with
  shadows, a hero object, the room's own palette round the wheel.
- **M851 «Сорока» and the road**: the keeper's face, the line on his head; the road's sky soft,
  its ship the 3D hull, one hue and one accent.
- **M852 Faces, second pass**: hairline, hair volume, nostrils, gaze into the lens, lip
  corners, the beard grown from the jaw; the wardrobe of M729.
- **M853 The cantina composed**: three or four seated poses, hands on the counter, the lamp on
  the hero's face, the depth ramp on the bar.

Design for M850–M851: `docs/DESIGN-rooms.md` (09.10) — the four rooms as scenes of `27f2` drawn full-bleed under the HUD the hall's way (one module `29r-rooms-r3.js`, camera stations, the breath and the glide, hit rectangles published for `15-input`), one key with shadows per room and the room's second light as the fill, the pilot as one person (`CP_KIT.pilot`, a saved gene, clothes by room, the live face by the room's state), new window kinds `planet`/`snow`/`sea`/`yard`, poses `lie`/`recline`/`walk`; «Сорока» keeps its room and gets the keeper's body and face, the road the 3D hull; `ROOM3.on`/`?room=0` (M850a–d, M851).

### Stage G — the phone and the cost (M870–M879)

After every stage: the P1 gate (`PLAN.md` §1) on the S23 by A/B/A; a stage that costs is not
closed. **M870** the parts' bill on small distant hulls; **M871** the station hall's cost on
the phone; **M872** the descent's cost.

### Stage H — the hand-over (M890)

The old painters deleted (the author 25.09: no 2D canvas anywhere), `?pln=0`, `?orb=0`,
`?h3d=0` and the other switches gone; `DESIGN-space.md` and `DESIGN-planet.md` folded into
`DECISIONS.md`; the patchnote; the release.

## 5. Method and roles

- **I design and judge.** The purpose, the silhouette ideas, the forks, the key frames' laws;
  after every pass I read the frames, write the critique (harder on our own than on others'),
  send pictures to the author in chat and brief the next pass. The gate is mine (the author
  27.09: «кадры не надо со мной согласовывать»); his word overrides anything here.
- **An Opus agent builds**, one pass at a time, from a brief that names the files, the
  read-only files, the stand, the frames to shoot and the report's shape (the M627b briefs are
  the model). It commits locally, never pushes.
- **A Sonnet agent merges**: `planet` → `planet-main` after each landmark pass; `origin/main` →
  `planet-main` whenever main moves; conflicts in artefacts rebuilt, VER and PATCHNOTES by hand,
  hooks never dropped.
- **Releases** are mine: build, `test.ps1 -Full`, the Node tier, dev first, then main; the
  hotfix of M800 goes out as its own release.
- **Work rules** as before: new modules behind switches until the hand-over, read-only files
  wrapped not edited, modules under 40 KB, scripts as files, no pictures in git, the stand's
  frames in the scratchpad, UTF-8 wrappers, no red calls.

## 6. Not touched

Gameplay, physics, economy, world generation, the save format, texts and names, the sound. The
nebula near the star and the eleven world palettes of the planet. The tests' oracles.

## 7. The first brief (Stage A, M800–M804)

The builder starts in `C:\Claude\drift-merge` on `planet-main`:
1. M800 the orb bind-group fix with the jump repro as a test; the city lights; the dig strip;
   `PLN.on` default; the P1 gate.
2. M801 the rig card (`21pha` → `rigCard`) and its first three takers: base, cave, raid.
3. M803 the overlay rule for prompts, discovery and arrival; the `test-geom` net.
4. M804 the night side of the orbs.
Report with frames; then Stage B.
