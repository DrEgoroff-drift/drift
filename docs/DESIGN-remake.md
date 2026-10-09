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
  Not only the rig but its look: lit by the scene's key (sun, lamp, headlamp), a contact
  shadow under the feet, a rim from the sky or the lamp, a body gradient of >= .12 value —
  never a flat fill; sized by the scene's human measure (1.8 m). The hall's people and
  pilot are this rig too (M814), the flat modes take the card (M801, second part).
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
- **L7 One water everywhere.** *Author, 08.10, pointing at the lake of the planet stand:
  «make the water module itself like that, and put it everywhere».* The stand's water
  (`fs_water` of `21pc`, the mirror pass of `21pe`: the sky and the near things mirrored
  and broken by ripples, Fresnel between the body and the mirror, the shallows and the
  wet rim, mist on it at night) becomes one module, `21pw-pln-water`, with one call per
  scene — level, murk, wind, bottom colours, mist — and every water of the game is drawn
  by it: planet lakes and the ocean worlds' sea to the horizon, the cave lake, the base's
  water, the spa's sea, the postcard. No second painter of water anywhere; a flat tinted
  plane is a defect (M634).
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
  *Done, second part (09.10):* the dig walks the rig card (`rigCardCave(ao,"dig")`, the cave's
  scale and headlamp, the drill pose under the cutter; .042 of the frame at 1080). The 2D
  headlamp beam left `drawAstronaut` for `astroBeam(f)`, laid after the card: the card's layer
  pastes the 2D darkness over anything laid before it, the GPU beam included. The postcard's
  man is the rig too: the brush (`25g`, `pcMan` of `25g-post-under`) only records where he
  stands (`pcRigAt`: feet, height in card units, light) and the album lays the card over the
  bake under the same filter (`albumRig`, `25g1`, in `albumPut` and `albumSave`). His light is
  the old silhouette's backlight: on the ground the star from behind and aside, its colour
  (`pcRigSky`); underground the bright end of the drift behind him, the vault cooling the rim,
  the headlamp lit (`pcRigUnder`). The lander's figure stays the brush's (it sits in a hatch).
  Open: home (the head of `homeFigure` is null), winter and spa — the rig cannot sit, take the
  helmet off or wear clothes; the designer chooses between growing the rig and the 27f3 people.
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
  *Urgent takes the middle (designer, 08.10, M826b):* one alarm plate (barge under fire, attack,
  SOS — any «now or never») may stand in the centre band while the alarm lasts, beside its body
  with a leader, never on it; calm plates go to the left third meanwhile and come back 45 frames
  after the alarm ends (`HANG_ALARM_HOLD`, as `rackBodies`). Squeezing the chapter or seating the
  alarm by the shield are rejected. Vision: one urgent plate in the band is clean, two are
  «центр» («две тревоги»); two plates sharing a row (vertical overlap ≥ 60 % of the smaller,
  gap < 120 px) are «ряд».
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
  - *Done (three passes, remake-a3):* `27f4a-hall` (layout, light, camera stations, the loop),
    `27f4b-hall-dress` (the bones and the seven dressings: trade, combine, yard, science,
    outpost, fuel, bazaar), `27f4c-hall-sky` (the planet bake through `17gab`); three hooks in
    `26-ui-station` (open, close, tab). The counter runs to the back wall with the keeper at the
    bar (pose `bar`, hands on the wood) under one key lamp with a real shade, rim and cord; the
    back shelf carries goods and a sconce, the board stands right of the counter, the window
    shows the system's planet and the dock (a hull with a bow and portholes, `27f2`). The bar is
    the cantina scene shifted 10 m down the hall, with at most three lamps. The camera glides
    on the real clock (`wallMs`: the game clock stands still in a pause and on the stand),
    700–900 ms. The plate takes the right 60 % on a PC but never leaves the layout under 880 px
    (`hallHero`, same rule in CSS); below 900 px the hall is a 36 % strip that the plate
    overruns to 24 % on scroll. `?hall=0` keeps the old desk. Removed on the way: the door
    fill (a lamp behind the camera mirrored as a moon in the window glass), the girder columns
    (they fell on the board), the weld's air glow (a point light 8 cm above the plate burned a
    white ball; it is now a spot aimed down). Suite `91qc-hall`; frames `hall_*` in the
    scratchpad.
    *Pass 2:* the camera stations carry a vertical field (`fy`) instead of a half-width, so a
    person at the station's place is .21 of the frame at any PC width (the suite checks
    .18–.23 and the width independence); the phone narrows the field (`HALL_PH_FY`). The
    pilot is a `27f3` person (cmd kit, seed `HALL_PILOT_M`) at `HALL_PILOT_AT[place]`, one
    instance slot kept for him; his jacket is the stand's suit colour `#ee7326` through a new
    optional `m.jac` in `cpBody` (one line). Judged beside `night.html`/`planet.html` the hall
    was brown in black: the sky term is now a cool fill (.8 of the ambient, mixed .55 toward
    blue-grey) against the warm lamps, the floor bounce is warm, the wall wash is stronger, and
    the trade wall turned neutral-cool so the lamp and goods are the warm notes. The night shift (`hallNight`, a 24 game-minute day, or
    `?hallnight`) dims the window, the wall wash and the ambient and lifts the sconce; the bar
    does not change (it lives at night). A wall wash (three shadowless spots, last in the
    list so a type with many lamps drops it first) puts people on a lit wall instead of
    black; its spots stand off the window, whose glass mirrored the middle one as a sun on the
    planet. The cantina camera is wider (people .19 seated). The window light is aimed steeply down: aimed at the camera, the polished floor
    mirrored it as a blob at the frame's foot. Tags (`hallTagsDraw`) are DOM plates over the
    hall canvas, projected from the thing, hidden while the camera moves and on the phone.
    *Pass 3 (the designer's seven points):* day and night are two lightings, not one dimmed.
    By day the sky term is the dock light (1.25 of the ambient, cool) and the ground term is a
    light floor bounce, so the ceiling and beams read; the window key hangs high under the
    opening with dust in its beam (`vol` by day). At night the ambient falls to .18, the window
    to .38 and deep blue, and the counter lamp, board light, sconce, the pilasters' cage lamps
    (night only, last in the list) and the bar carry the room. Measured on the left 40 % of the
    1920 frames, day is 2.3–3.5x night on every type and place; the suite checks the sky term is
    at least 2x. The three wash spots are gone, and the light over the key lamp's open top puts
    a pool on the ceiling. `gnd.w` is the renderer's fog density, not the bounce weight; it was
    back at .03. A new module, `27f4d-hall-props`, holds the shared dressing in the `21pie`
    colours: steel, rust, soot, orange and concrete pipes with brackets and bands; a cable tray;
    a vent duct in tall halls; enamel and hazard plates; cage lamps; an extinguisher; a crate
    stack with a painted container at the counter end; drums; floor lines. Two working people
    join the keeper: a visitor at the board and a loader at the bench. Three poses join `27f3`
    (`elbow`, `hips`, `frame`), and `HALL_PILOT_AT` uses them, plus `folk`, a stool at the
    bar's right end. The window and site cameras are `fy` 1.0, so the pilot by the glass stays
    .20. The cantina is recomposed as the hall's far end:
    - candidates sit on plain four-legged stools (`hallStool`, no round base) and turn to the
      counter at three quarters;
    - the table with two sitting moved into the bar camera's foreground (`HALL_BAR_TABLE`);
    - three lamps aim down at the counter with `vol` .08, not cones in smoke;
    - the sign sits over the bar door, dimmed (`HALL_SGN`, `sgn2.y`);
    - by day, a fill from the bar window reaches it.
    The dock view in `27f2 outside` (kinds 0 and 2) is rewritten: a hull at the berth lit from
    above, with panel seams, a lit top edge and warm portholes (the yard adds open ribs and a
    weld flash); a truss tower and boom with the lit chord toward the floodlight; a floodlight
    cone in the dock haze; slow beacons; berth lights. The truss grid on black is gone. The
    planet is placed lower and capped at r 3.1, so it sits whole in the opening with its
    terminator; science stays big. Window glass reflects .2. A `say()` toast in the hall on a
    PC is a plate at the right edge of the screens (≤ 420 px), checked by a browser suite in
    `91qc-hall`.
    *Pass 4 (polish):* the day tone stays; colour comes from warm notes of things. The trade
    counter wood is `[120,62,32]`; shelf goods take the `GOODS` palette (crates with stencil
    plates, tins with label bands, cloth rolls); the loader wears orange (`m.jac`); the sky term
    is a bluer dock light and the ground term a warm bounce (cold key, warm bounce). The key lamp
    moved to the counter's front edge (`HALL_KEYX` -5.2): straight over the keeper it burned his
    head white and he read as a mannequin. The keeper's seed is re-rolled until he has hair
    (style not 0/4/5), dark hair and skin no paler than middle (`hallLum`). The bar has two
    tables (`HALL_BAR_TABLES`), the second in the middle ground right, both always with two
    sitting. The sign moved over the door and dimmed (`sgn2.y` .32). The floor in
    `27f4d-hall-props` has tile joints every 1.2 m and soft patches (`hallSmudge`: a flat fan
    in the floor material, the centre its own colour, the rim exactly the floor colour, so
    there is no edge): a worn path along the counter and to the board, oil stains. Measured on
    the left 40 % of the 1920 frames, day is 2.1–3.4x night. The suite checks the keeper's hair,
    that the lamp is not over his head, and two sitters at each bar table.
- **M811 The counter (ТОРГОВЛЯ)** — the keeper (`27f3`) behind it, goods as crates on the
  counter; the table as a plate. *Done:* a new module, `27f4e-hall-goods`, lays one shallow
  crate per market row (`hallGoodsKeys`: the trade keys, then the far keys in the hold, the
  same order as `stTabMarket`) in two rows on the counter's near end (`hallGoodsAt`). A crate
  is a tray .13 m deep, because the counter camera looks almost along the top and a deep box
  hid its goods. Goods in the hold fill it to the rim with a heap whose height is the amount;
  an empty crate shows its bottom. A label in the goods' table colour faces the hall. The rows
  carry `data-k`; pointing at one (`pointerover`/`pointerdown` on the plate) sets
  `HALL_GOODS.hot`, which gives its crate a rim in the plate's accent (`--c-acc`, the colour
  of the row highlight) and a small lamp in the goods' colour, second in the light list so the
  limit never cuts it. A colour glow alone washed light goods to white. The crates are their
  own mesh, keyed by type, hold and hot row, drawn on the hall's instance 0; the trade
  dressing's sacks and crate left the counter for them. In the hall, the market's prose line
  is gone (an empty hold keeps one short line), the table is a plate (`#station.hall .mk`),
  and the СТОЙКА tag moved to the counter's front panel. `91qc-hall` checks the row order,
  the slots on the top, a full crate, the hot rim and that its lamp reaches the frame.
  *M811 follow-up (in the M812 pass):* the lens (`hallLens` in `27f4e`): the general plan is
  never zoomed; a hot row eases the target to the midpoint of the keeper and its crate and
  narrows the field ×1.31 (the keeper .27 of the frame, measured by `91qc-hall`), with
  plnGlide's constants (.45 s in, .7 s out) and a 750 ms (45-frame) hold after release; on a
  phone `pointerleave` from a lifted finger no longer clears the row, so a tap holds it. The
  shelf goods are by material, one note to a shelf, the top shelf dustier. The crate stencil
  is the diamond colour capped at 45 % HSV saturation (`hallStencil`), no glow. The cable
  tray went warm and matte: by day it measures .41 of the shade's brightness, was .58 and
  blue-white.
  **M812 The yard (ВЕРФЬ)** — hulls on the hangar studio at
  ≥160 px, the class as a tag. *Done:* `27f4f-hall-yard` turns `shipRow` into a card in the
  hall (`hallShipList` wraps every yard loop of `26e`); its `.yth.big` place is 170 px high,
  and `hallYardFit` gives places ≥120 px the 3D hull of `17c2a` in the hangar's view (yaw .5,
  tilt .98) framed by the hull's own bounds (`hgUnits`), small places keep the top view.
  Every stock hull measures ≥160 px along its long side. The hall gets a work lamp over the
  window bench (`HALL_WORK`, a two-thirds copy of the counter's shade, .7 m nearer the camera
  than the heads): third in the light list so the limit never cuts it, the night key of the
  КОРАБЛЬ and СТРОЙКА places. **M813 ПРИБОРЫ** — the five dials as objects with their drift
  on a plate; prose gone. *Done:* `27f4g-hall-instr` puts five housings on the window bench
  (`hallInstrAt`, all five clear of the people from the КОРАБЛЬ eye, which is where the ПРИБОРЫ
  tab lives) as one instance whose parts 1–5 are needles; `hallInstrNeedle` = true mark + a slow
  swell of `(.04+.3·wear)·drift` + a tremble of `.01·jit·(1+wear)`, never past ±.95 rad; ticks
  follow the resolution. `hallInstrDress` (hooked at the end of `stTabInstr`) turns the rows into
  cards with an SVG dial whose needle is a CSS swing (off under reduced motion); the counter's
  rows get «лучше»/«хуже»/«как ваш» as a tag, the subscription prose moves to the button's title.
  The lens is general now (`hallLensAim`): a hot instrument row glides it to the dial, midway
  with the pilot. Yard gaps closed with it: night planes ≥ .08 except the vignette's four corner
  cells (.07), a cold bounce from the window; day ceiling and floor take the planet's ochre
  (h 23–28) on a neutral wall; the hull card's place is a lit galvanised floor rendered at 2×;
  mullions 1.2 cm (≤ 3 px at 1920) with the work lamp mirrored faintly in the glass; the work
  lamp is out of the counter's range (0 of its key); on a phone `say()` goes to the ether strip
  (`hallMsgEther`). *Follow-up:* five bodies (`HALL_INSTR_BODY`, silhouette proportions differ
  ≥ 12 % pairwise) in the maker's material (`HALL_INSTR_MAT`), needles as rotation (dial, rose,
  arc) or a slide (rider, frequency mark) through `hallInstrXf`; the row starts at x .5 and every
  body is ≥ 90 % visible from the КОРАБЛЬ eye past the people (ray test, r .3). The post pass's
  fringe takes an optical centre and strength in `v[12]` (default unchanged for the cantina and
  portraits); the hall puts the centre on the lens target, `HALL_CA` .004. The plate's backdrop
  is opaque. Night planes are measured with the vignette's corner cells masked: min .08.
  **M814a** (first pass of M814, the designer's three gaps of M813b) *Done:* the plate's
  bodies take one key (`HALL_DIAL_KEY`, a copy of each body fill on top, top − bottom ≥ .12
  value per maker), a highlight by material (`HALL_INSTR_HL`) masked to the body, a radial
  contact shadow and glass arcs. On a PC the hall's canvas is the hero zone only
  (`hallDrawW`; `hallCrop` squeezes the full-frame projection, vignette and fringe use the
  full-frame uv through `v[13]`), its density is the screen's up to 2 within 3.2 Mpx
  (`hallDpr`), and the post pass sharpens (`HALL_SHARP` .8, clamped to the four neighbours,
  `v[13].z`; off for the cantina). Bench edge / plate edge on a DPR 2 frame: 1.13 (≤ 1.2).
  At night the work lamp's inner cone takes all five dials and a cold rim light sits behind
  the row under the sill (`rim:1`, ship and know places only). People: the pilot goes to the
  rig 21pha (L2), the keeper and the crowd stay 27f3 (L3) under the same light bar.
  **M814b** *Done:* the board as sheets on cork (no pilot there, `HALL_BOARD_MAX`); the cantina
  with a hero lamp and tables off the sightline; ВЛАДЕНИЯ as a chart on the office desk
  (`27f4i`: `hallHoldPins` home + bases, rows `data-pin` ↔ tokens, the hot token's lamp kept
  inside the 12-lamp cap, lens to the pin, paper albedo held so the lamp's pool stays ≤ .81
  median value); the site as a near layer in `outside()` (`flm2.w` = three base-6 digits per
  cradle, 216 = no sites yet, fuel stations none; value contrast against the hull ≥ .13 day
  and night, own floodlights not scaled by day). The pilot is rig 21pha remapped to hall axes
  (`27f4j`, bones as parts, poses per place). Light bar: the last part of each person
  instance carries a passport (footing x/z, contact radius, rim; `hallManMark`); the shader
  adds a rim from the room's sky term plus a floor, ×3.2 at night, and darkens the floor under
  the feet. Measured p90 − p10 value: keeper .42 day / .48 night, the dark-clad visitor at the
  board .137 / .122. The counter keeper wears `CP_KIT.clerk` (waistcoat with a geometric V,
  tie and badge in `m.acc`, sleeve garters). Night bench edge / plate edge on DPR 2: 1.14.
  **M815** *Done (PC part):* the strip and the plate stand since M810 (`#station.hall` 36vh / 24vh
  `.up`, `HALL_STRIP` .36); every target in view at 390 is ≥ 44 px. `27f4k`: `hallNavSync` after
  `syncTabs` scrolls `#stGroups` to the *visible* active button (`tabsSync` measured the hidden
  `.on` tab of a single-tab section, rect 0). `hallCost(sec)` wraps `hallFrame` with two empty
  timestamped compute passes, each in its own submit (the hall's own encoder bypasses `gpuTs`);
  CPU on the shooter's real clock. `hallDpr` caps the hall at DPR 2 and `HALL_PX`, so at 390 the
  strip renders 780 × 608 at DPR 2 and at 2.625 alike. RTX (Blackwell), GPU median / p90 ms:
  390 @ 2.625 — market 1.36 / 1.61, cantina 1.50 / 1.76, board 1.35 / 1.69; 1920 — 1.16 / 1.80,
  1.03 / 1.26, 0.95 / 1.16; night the same within .2; CPU ≈ 0.9. *Open:* the P1 gate itself
  (≤ 4 ms on the S23) needs the phone over adb — run `hallCost(3)` in the hall there.
  **M814 ДОСКА, ЛЮДИ, ВЛАДЕНИЯ, СТРОЙКА** — the board on the wall, the
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
  *Done (08.10, remake-a2):* `25d` rewritten: `rackGeo` side (PC, x ≥ 70 % of the width,
  between `HUD_BAND` and `HUD_FLOOR`, left of `HUD_RAIL`; a narrow window gives up part of
  the middle) or shelf (phone, down to ~30 % height, `body.rackon` only there); five dials,
  the globe cell (`rackGlobe`, live parts still `globusDraw`), no screen dimming, no shadow.
  The pod's metal helpers moved to `25c`. Pass 2: the shelf without tape, `rackBodies` (the plate
  never over a body, suite `91qe-rack`), `rackLate` from `ovFlush` (drawn last; `OVL.hushR`
  skips world labels and chips on it), the globe's bearings, whole minutes.
- **M822 The map** with three weights, plates for the status lines, the hint on the selected
  object. Done 08.10: `MAP_W` and `mpWeight` (17z4) weigh every pen stroke; `mapSelHang` (new module `18l-map-plate`) hangs
  the selection plate (`ovHang`, id `map.sel`), `mapHintHung` silences `#prompt`; the plate avoids
  only what stays while it hangs (its fallbacks — the prompt, the footer's selection rows, the
  course label — do not hold its place) and world labels yield to it; `mpPlate`, `mapFace` and
  `mapTW` (widths as the layer draws digits) for the header, footer, tag and card.
- **M823 The nebula far from the star**: inner structure and a depth ramp, no straight streaks
  (the look near the star is the author's and stays). **M824 Belt**: rocks clustered round the
  actor, haze instead of the band. **M825 The orbs' second pass**: crystal, ice, jungle, rocky,
  the ring's shadow, the star's limb. **M826 The HUD trimmed**: the receiver folded to a chip,
  «Фото» into the menu, the camera's body-in-frame rule aware of the rail; the barge's distress
  cue as a plate at its callsign (the cue stays the source of the action button, only its place
  moves); on the phone the lens glides to the target in a fight (the planet's `plnGlide` rule),
  so a pirate is never a 40 px spot (decided 08.10 after M820).
  *M826 done (08.10, remake-a2):* `#rx` chip/ticker/sheet states (style.css, `27j`); `#camBtn` in
  `#menu`; `25c` pod in plate graphite (`rackCr`, `HANG.FACE`). Plates at things (`08bj`):
  `say(s,d,obj)` → `hangMsg` (anchor `MSG_OBJ`, else `HANG_MSG_AT[mode]`: ship / scoop / man /
  you), `smenaAct` → `hangSay("smena")`, `cueAt(id,obj,name,dy)` → `hangCue` (laid out before the
  message; barge r ≥ 40 px clears the hull bar; the callsign label is skipped while it hangs),
  `HANG.hint` → `hangHint` (phone: top centre, `o.free`, no leash; edge chips in `21e` hold
  `hangBlock`); `#prompt` silent when it is `ДЕЙСТВИЕ — <two words>`. New module `17p-cam-frame`:
  `camFree`/`camReach` (body rule in `17` minus rail and rack), `fightLens` (phone only, drives
  `G.zoomT`, steps back if the player zooms). Map: jump ring `mpCircle` .5 teal, lamp shader
  darkens outside only (`U[11]` ≤ .04), holdings fill .05 / hatch .14 (`18b`), `mapSelBlock(n0,
  hung)` blocks always, the price line on `Rr`. The centre law (M803) holds: a barge beside you on
  the PC hangs its plate below the band on a long leash; an exemption is the designer's call.
  *M826b (08.10):* the exemption granted — `cueAt(...,urg)` → `o.urg` skips the band;
  `hangLayout` sorts urgent first, keeps `HANG.alarmF`, and gives calm plates `C.xMax=W/3` with no
  leash limit (a far one hangs `free`); fallback anywhere but the band. Map: `hangAt("course")` at
  the far third of the course; without a course or on the phone `18` writes the message as rows
  in the «ВЫ» tag (`HANG.msgTagF`; inside the sheet frame, pushes the tag stack, falls back to a
  plate when it does not fit). Ground: `HANG.msgJoin` appends the message to the hint plate.
  Vision `90b2`: `hurg` per item, «две тревоги», law «ряд», plants for each.
  *M823 done (08.10, remake-a2):* everything rides one weight `far=smoothstep(.8,1.6,sd)` in
  `GNB_GEN` (`16gb`), so the frame near the star is the author's to the pixel (diff 0 against
  the frame before). Far: `fillE`/`densE` thin a fill system; per plane a silhouette `mL` from the
  mass field with its own noise, threshold softer and wider; `d` drops two octaves only at the rim
  (`1-smoothstep(.5,.72,d0)`); core `cr` (mass × density) whitens and brightens, filaments `fil`
  (ridged noise); hue: `lav` toward the shadow hue, then `hto` turns the gas's own YIQ angle away
  from green by a region field `hz` (warm → rose, cool → blue, ≤ .72 rad, chroma held). The
  cavity glow and ion rim of `dustAt` (the «peach shards») and `dk` fade far; the comet's ion tail
  waves, widens and breaks. `GNB_FILC` (`16gay`) lets the strands into bright gas far away and
  darkens between them. `GPU.kill.neb` skips `gpuNebulaGen` for a frame without the nebula: the
  diff is how the pass was judged (the nebula a correction to the field, not a fill).
  *M823b (08.10):* the four gaps. `GNB_FARC` (`16gay`, full resolution, far only) — dust lanes
  as ridges of a warped field darken bright gas ×.5, a sharper ridge lifts the strands; on thin
  gas (`l0<.25`) a two-level warped ridge field turns the rim into wisps (rotated strands alias
  into hatching — rejected). Rim octave drop `.45*far`. Ion tail: three Gaussian strands round
  a parabola `bend*xp²` that part with `xp`, flicker by noise, bright at the head. The centre
  law in `GNB_EMI`: the ship's screen point rides `c[53..54]`; within `R=.37·min(W,H)` with a
  noise-ragged radius and a wide fade the light is pulled toward a floor `.3·.05/(cy+.05)`,
  near the star only to .75. Measured cover>24 in r400 round the ship: 0–14 % on 1920, ≤ 2 %
  on 390; mass value spread .27–.39.
  *Judged 08.10:* the pocket reads as a black cavity round the ship with the nebula pushed
  into a ring (s0 at ×1 and ×0.5). The centre law is rewritten for M825: not a cover cap but a
  value cap — inside r 400 px the nebula keeps its lanes and strands at value ≤ .18, full
  strength from r 700, a smooth ramp between; the ship stands on quiet gas, never on black.
  Also for M825: the comet's dust tail is screen-locked (a beige smear top right of s0) — it
  goes to world coordinates at the comet's head; the belt at ×1 is two dotted strands — three
  depth layers, density toward the axis, a power law of sizes, clump haze ≥ .10; rocks are
  round potatoes — a third elongated 1:1.6–2.5 with chips, slow tumbling near; the core's
  lanes are wide and soft — 2–6 px twisting dark lanes, a hue drift, a knot ≥ .15 brighter.
  *M824 done (08.10, remake-a2):* `17gc-sys-belt` (the belt left `17c`). Clumps are derived from
  the belt seed per arc cell of 560 (55 % on, σ 70–180 along the arc, radial width 34–64, offset
  ±40, density .45–1), cached on the belt; `sbeltDens` adds a thin ring floor. Rocks: a world grid
  of 34, a per-cell threshold against density × an actor term (a ring of extra density at
  ≈ .2·min(W,H) round the ship, a clearing under it, plus the bare ring there) — the soft edge of
  that threshold is the alpha, so nothing pops. Bodies go through the `24be` pool: camera
  straight down at `D=2400/Z`, `F=Z·D` (the world lands on screen exactly as 2D), basis right
  (1,0,0) up (0,−1,0) fwd (0,0,1); `brockCam` gained `lz` (the star lifted toward the camera,
  `.2·dist+150`, so a terminator shows) and `fogD`; 12 `makeRock` meshes per belt, six tints
  round the wheel, the star colour softened 40 % toward white for rocks; faded rocks in the
  `rockf` pipe. The 2D path keeps `ROCK_SHAPES` for no GPU. The orbit band in `gsyOrbits` is
  gone; the haze is the field `gsy.belt`: the ring floor (.035) and up to 12 on-screen clumps as
  arc-stretched blobs, arc-space noise (the `atan2` seam hidden by blending two unwrappings), torn
  by a round world-space puff mask — a first try without it read as the very band it replaced.
  Belt dots carry their density in alpha.
  *M825a (08.10), the designer's five gaps:* (1) the centre law is now value ≤ .18 inside r400
  with structure kept, full beyond r700: `GNB_EMI` compresses luminance by a soft knee
  `.1·(1−e^(−y/.1))` (order kept) under `1−smoothstep(.37,.65,d/min(W,H))`, the star keeps .6;
  measured p90 .169, spread .11 inside on s0 ×1. (2) The comet landmark rides parallax .09 (the
  gas plane), its axis from the rest place so it does not turn with the camera. (3–4) Belt layers
  `SBELT_LAY` at depth .2/0/−.16·D under the top camera — the projection gives the parallax;
  an axis floor in density, power-law radii `r0·(1−u)^−.55`, a third stretched by scaling the
  rotation columns (1:1.6–2.5), meshes 8–11 chipped (`sbeltChip`: two planar cuts and a dent),
  spin period 20–60 s near, ×3 and ×6 slower behind. (5) `GNB_FARC`: lanes are the zero contour
  of a warped field, distance in px by finite difference (no `fwidth` in that branch), dark side
  sharp at 1.6 px, light side soft over 5 px, two scales under slow masks; a tone drift toward
  blue by a slow field and toward warm with a lighter knot where the gas is brightest.
  *M825 (08.10), the orbs:* `17gab` — crystal: `vor` facets ×3.2 with a druse mask (fbm ×1.6)
  adding facets ×9.5, seams pale, one facet in ~2.5 glints (`glow` .09·seam), hue between rose
  and blue-violet by facet id, spec 1/rough .16. Ice: 13 great circles, offset ±.25, wobble two
  octaves (.05/.015), cut along their length by noise, width .006–.022 squared toward thin, a
  double ridge (dark core, umber `rust` .3/.21/.16) over a pale halo. Jungle: chroma cap .1/.065
  on land, .09/.055 on air. Rocky: warm regolith (two hues by seed) against cool maria. `crat`
  walks the 27 cells and takes the smallest d/rc among live cells — the nearest Voronoi point
  had cut big craters along a straight seam. The terminator's warm rim is multiplied by `airK`:
  airless bodies keep a hard terminator. Ring shadow: the shadow ray uses the sun with its
  elevation over the ring plane squeezed (×.3, at least .25) — a cheat: the true high sun casts
  it on the hidden side and a sun in the plane casts a thread under the ring; the band on the
  lit disc is what reads. `17g` star: limb `1−(.52..62)μ'−(.2..28)μ'²`, Voronoi granulation
  (`gcell`, drifting centres, cells ×1.4–2.4 of the old grain, fade under 2–6 px per cell),
  all gated by `near` = smoothstep(20,70) of the disc radius in px; the lens streaks and the
  white core in `08b` shrink by the same `near`. Nebula tails: lanes two-octave (×2.63) and cut
  to 60–200 px by noise, a second lane set under its own mask, lanes gated by `fl`
  (smoothstep(.15,.45) of the star distance) instead of the far law. Belt haze: two-scale torn
  edge, mottling, grain 2–4 px at ±.08 alpha, strength .40.
  *M825c (09.10), the orbs' second pass:* `17gab` — crystal: three facet scales by field level
  (`vor` ×2.3 large, ×6 medium where level > .3, ×15 druse where > .62, faded by `fw`), tilt per
  facet id; a chipped step between large fields whose heights (`h3(id).y`) differ by > .1: the
  higher side gets a lit lip, the lower a shadow of width ∝ height gap ÷ sun elevation; glow only
  on facets facing the star (`dot(nf,L)` .35–.75) and one in ~2.2 by id; glass hue from palette
  luminance × violet (.78,.6,1.3)–(.62,.64,1.36), the lit body takes 8 % of the star's hue
  (`sunB`) and the crystal's air is chroma-capped at .02 — measured hue −60.4° against the glass
  −62…−78° (OKLab). The fracture planes are gone (they drew arcs across many facets). Ice:
  albedo fields snow/bare/frost by two warped fields, value spread > .10; four cracks on a
  seed-rotated tetrahedron's axes (seven random axes bunched into rope bundles), half-width
  .012–.035, dark `rust` floor, walls tilted by `o.b` (×1.1), levees, pressure ridges ×26 at
  .25. Jungle: relief `(1−|fbm×1.8|)²` with its gradient by finite differences (`dpdx` on `hs`
  is per 2×2 quad and laid a staircase on ridges and coasts); coast width +3`fw`; rivers are
  zero lines of two warped fields (×5 main, ×9.5 tributaries, half-width .005/.0035 or .75`fw`)
  torn by their own masks, albedo .22 × deep sea — measured on lit land (V ≥ .25) at 1920:
  contrast .086 value (median), width 3 px; clouds `cloudJ` with a ragged edge and a shadow
  offset 3 % of the radius toward the star; the warm terminator is a tone on the lit side
  (`warmT`, air only) instead of an added band, which read as a second limb. `17g` star: rays
  capped at .35·min(W,H) (measured ends ≈ 380 px at 1080); the disc (r·1.12) is a
  `hangBlock` obstacle when > 16 px, so the hint plate sits outside its rim. Giant: two
  granule scales (×.62 and ×1.75) mixed by a mask, lanes soft over 1.2 of the cell, brightness
  ±.08 by id ramped in from the lane, cells smaller and darker toward the limb (`1+.8·lk²`),
  faculae toward the limb. Splits: `16gb`→`16gba` (the comp pass), `17gab`→`17gab1` (pipelines
  and drawing).

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

  - *Done (M628a pass 1, `21pig-pln-own` — the design's `21pif` was taken by the landmarks' acts):*
    `OWN` (`?own=0`) builds the base and the home once per landing and per make-up (key: the
    top row's kinds, battery, pennant; the beds' growth in eighths) through `plnGeo/plnInst/plnRec`
    like `21pie`; `plnOwnFrame` beside `plnMarksFrame` culls by the lens, pushes the body, the light
    (windows and the gate, warmer by night), the battery's charge light (`basePower.eff`) or the
    home's breathing beacon, the grow light and the pennant, two blots each, and at night the porch
    and pier lamps (a lamp beyond the frame's edge gives its slot up). `plnOwnBaseX` re-measures
    `builtSpot`'s seed in metres: 28 seeded places, the flattest footprint, ≥ 33 m from the pad and
    clear of the yard, the POIs, the settlement and the shaft, cached on the profile. The deck rides
    1.2 m over the footprint's highest ground (or 1.6 m over water); the yard by the landmarks' rule
    but tighter (sole ≥ crest − 1 m, a rock mound takes the rest). Entry: `updateSurface` is wrapped
    — the ship branch's `enterBase` is refused away from the gate and its line becomes a pointer;
    within 40 units of the gate «ДЕЙСТВИЕ — ВОЙТИ В БАЗУ» (it beats the mine's founding); `enterDig`
    is refused at the gate, under the deck and in the yard. `plnAtThing` → 1 at the gate and the
    porch, and always on a phone except on the jet. `21pj` draws `drawBuilt`/`drawHomeOut` only with
    `?own=0`; `21pga` clears the flora under the deck and the yard (`plnOwnPads`); `21e` adds the
    «БАЗА» chip at the gate; `21pzb` hangs the gate and porch plates on the things. Test: `91qe-own`.
  - *Done (M628b pass 1):* the porch lantern is the frame's one lamp with a shadow — capsule
    occluders (the man within the lamp's reach, the porch posts, the front fence posts near the
    door) go to the tail of `F.blobs` as two `vec4` each (`a, r` / `b, strength`), `blobs.n.y` their
    count, `blobs.n.z` the lamp's slot + 1; `plnOwnOcc` writes them last in `21pz` (blots are capped
    below the tail), and `21pc`'s lamp loop multiplies that lamp by `lampShade` (segment–segment
    distance, the penumbra widening with the distance from the occluder, an occluder never shades
    itself). Own lamps are wished per item and two are taken by rank: porch, pier, gate light, grow
    lamp. The light record is `.12 + .6·night` (brighter glass the grade turns salmon); glass colours
    `OWN_WIN` are given lighter because vertex colours are read as sRGB. Test: `91qe-own`
    (two own lamps of three wished, the lantern's occluders, none by day).
  - *Done (M630a pass 1, `22d`/`22da`/`22db`/`22dbw` — the scene file took `22d` so `22dc` stays
    free for the halls' dress):* `CAVE3` (`?cave=0` keeps the old painter, play untouched) wraps
    `drawCave`. One density `cave3Den` from `C.g`: the grid's signed distance (`C.f3.sd`), the
    gallery's half-height `hl` (clamped .6–4.5) as a tube's depth `zd ≤ zcap−4`, strata ledges and
    joints by the world's style (`CAVE3_STY` sed/volc/rock/ice/sand), grit, and lumps deeper than
    1–3 m behind the cut so the lamp has form to rake (the cut itself stays on the grid). Chunks of
    8 m, voxel .25, built lazily around the window (≤ 8 ms a frame, the rest next frame), cached on
    the cave; the chunk's skip test is an exact scan of the grid's cells under it. The cut face is a
    sheet at z=0 (strata, soil under the surface, the lip that takes the void's light). The lens of
    §3: the window lies on the walk plane, x eased (.45 s) with the tap corrected by the ease's lag;
    the share is .085 broad / .077 tall. The man is the rig with the lamp as key: a 128° shadow map
    from the helmet, the cone and its falloff by the kit (`cave3Reach` 12–27 m), a second ortho map
    for the day under the mouth (shafts by `dayK`), air scattering at half size, bloom, the engine's
    grade into `gpuScene()`. Plants and fauna are bodies in the scene (M630c); the find marker stays 2D. A
    pipeline that fails validation drops the cave to the old painter with the reason in `CAVE3.err`.
    Leaving the cave starts the surface's glide. Test `91qg-cave` (density vs `caveSolidAt` on 400
    cells, the cut sheet on the grid's rock, rock at the grid's faces, shares, feet on the walk line,
    reach, the switch); stand tools `cave.py` + `eval-cave.js`.
    *Pass 2:* the lens to §3's variant B (26 × 14.5 m broad, 6.6 × 14.5 m tall, the man .124;
    ×1.6 nearer while `G.prompt` calls ДЕЙСТВИЕ, .45 s in / .7 s out); the cut page is stone
    (`CAVE3_CUT` lifted to 14–18 % value, the edge dim to .7, a cool fill from the mouth by
    `dayK`); bedding lines off the back wall (a soft tone per bed only), ledges thrown out further
    behind the cut (×1.8 by depth) and the lamp turned to 19° into the depth so they cast. Words:
    `22d` wraps `hangSurface`/`enterCave`/`hud` — the action line hangs at the mouth, the wall, the
    find, the plant, the shaft (the walk help only by a shaft or the mouth in frame), else at the
    man; the entry hint at the shaft in frame; `#prompt` and that `#msg` hide under
    `body.cavewords`/`cavehush`.
  - *Done (M630b pass 1, `22dc`):* the dress keyed to `caveDeco` — `tips` (hang / mite / column),
    `curtains`, `crystals`, `veins` — plus wall items every 26 px by the zone's `drip`; each is
    placed behind the walk line (z 1.5 … zd−1.1) by `cave3Up`/`cave3Down` on the density and
    skipped under a shaft. Builders `cave3Band/Caps/Bells/Flute/Hang/Mite/Column/Veil/Cluster`
    (the stand's `cv*`, rims `cave3Lobes`, ≥ 7 ring sides a lobe); clumps of 2–6 around each hanging
    tip. Crystals mauve, light r 8+5·size; lights sorted by distance into the frame's twelve.
    Veins are flat tubes and grains at z −.03 (material 5, dimmed with the face). Shader: material
    15 (veil), moss on rock with `dayMask`, back-wall fluting for rock facing the lens deeper than
    1 m. Bins of 16 m on `C.dr3`, ≤ 14 kept, freed with the device. Gate frames: five zones at the
    broad lens on sed and volc, errs 0. The lake mirror, the amber crawl, the far lane and the far
    lens follow in the next passes.
  - *Done (M630b pass 2, `22dd`):* the lake — `cave3LakeGeo` per water zone from `cavePool`: a surface
    grid (0.5 m, material 13, depth from the density in the spare slot, quads only where a corner is in
    air by > 3 cm) and the body pane at z .04 (material 14, depth 0 at the top, water − bed at the
    bottom); cached on `C.lk3`. `22db`: the scene layout gains `reflTex`/`linSamp` (bindings 4–5), a
    half-frame mirror target, `bodyR` (no MSAA) drawing the draws marked `refl` (rock, man, dress) with
    `VP·mirrorY(water)` and the clip `misc.xy = [water + .02, 1]`, and `water` (alpha blend, no depth
    write) after the body; `sunDir.w` carries the water level. Globals grew to 280 floats: `zone[4]` =
    the halls in frame `[x0, x1, finish]` for the rock shader (0 ribs, 1 druse, 2 plain, 3 polished).
    Dripstone by world: `CAVE3_DRIP` (sed/volc/rock/ice/sand → light, dark, oxide, wet, material;
    ice uses the veil material 15); drip ambient × .45, rim × .1. Crystal lights reach ≤ 4 m, halo
    k .55, width .8 + .25·size.
  - *Done (M630b pass 3, `22de`):* the far lane — `cave3FarSite` picks one spot in the first
    dripstone / vein / crystal hall (20–80 % along it, ≥ 25 m from the mouth, clear of shafts, the
    floor ≥ 6 px over the pool, the highest gap); `cave3FarVoid` = an arch tunnel widening ×1.2 into
    the depth, a chamber ellipsoid (R 12/9/9 at z 27, strata ledges of the world's style, flat floor)
    and a skylight cylinder; `cave3Den` and `cave3Field` are wrapped, chunks at the arch run the full
    depth (`zcap`). The chamber is one surface-nets mesh (vox .35, box ax ± 18.5 m, z ≥ 15.4) cached on
    `C.far3`, with a 7-tier cap stack under its day and two small ones. Its day is analytic (no shadow
    map — the window is its shadow): `farDay`/`farK` in the globals (288 floats), lit on rock, moss and
    a beam in the air pass. The far lens (100 m, 24°, 75.6 × 42.5 m, the man 4.2 %, walk line .40)
    eases in on the map key in the cave on a wide window (`cave3FarOk`), .8 s in / .7 s out, with 160
    chunks kept. Amber (`cave3AmberGeo`): a honey body lit from inside (crystal material, glow 2.2),
    grains about it, 2–3 drops on threads from a roof within 5 m (the stand's `cvAmber`: glow 3.2), the
    stand's light r 3.8 [.5,.27,.07] and halo k .35 s 1.1. The lake body takes the stand's section
    shader (ambient × 2 into it, teal under the surface, a pale meniscus) so the far lens reads water,
    not a hole. Light is never negative: `fs_main` clamps before the haze and the bloom's first step
    drops negatives and non-numbers — one negative pixel on a sliver had bloomed into a dark ball at
    the arch. Stand: `cave.py` x = `arch` / `amber`, `far=0|1`.
  - *Done (M630b pass 4, `22df`):* the cut page holds the stand's `cvInk` by the world's stone —
    swimmer bones and shells in sedimentary (6 + 16) and sandstone (3 + 9), gas vesicles in volcanic
    (24 clusters), bubble strings in ice (18), nodules in bedrock (14), placed 1–4.5 m under a
    gallery floor or over the upper ceiling and only where the whole piece lies in stone; roots come
    down from the surface every 4–12 m on worlds with flora and stop where the stone opens. Veins are
    a dark seam (r .034 + .012·w, its width wandering by the metre, not by the run) with rare dim
    grains (1.6 per metre, ore × .05–.25), never a chain of dots. The vault (`cave3VaultLift`) may rise
    up to 3 m above the grid's ceiling, in patches along the gallery (×.75 at the cut, full from 2.5 m
    in): the grid's void is pulled straight up, never sideways or down, never within 1.6 m of the world's
    top and never into a void 1.2 m above; floor, walls and the walk line stay the grid's (91qg: the
    sign at z 0 and z .7 off the vault, the floor at the walk line, nothing laid, nothing over +3 m).
    The lamp is warm only near: `lampTint` turns its light on stone to a cool grey of the same strength
    between 4 and 8.5 m (`farK.yz`), the shadowless spill is cool grey (r 17), the warm part is a pool
    on the floor 2.6 m ahead (r 4.2) and a touch on the man (r 1.9); a cool fill over the man (r 9) and
    behind him (r 18); the beam tilts down (−.24). Measured on the gallery frame: the page hue 208°, the
    stone outside the near circle 208–215°, the pool 35°. In the far lens the find's flat glint is not
    drawn (life is drawn as bodies since M630c). The scan label hangs at the plant the game picked and is
    silent when that plant is not in frame (never at the man). Amber's threads reach 8 m; a higher roof
    leaves the honey alone.
  - *Done (M630b pass 5, light; `22dbx`):* domes stand at places, not by noise: one per hall centre,
    the mouth, the find, each amber deposit and the far lane's arch (height 2.4–3 m, half-width 5.5–8.5 m,
    seeded by place), and small domes split every stretch until any 12 m of the walk line rises ≥ 1.5 m
    (91qg measures it where the roof leaves room). The lamp's warm falls from 2.6 to 8.5 m into a cool
    grey of the same strength; the lamp's reach is `(1 + d/3.2)^-1.55`. The page is the darkest thing in
    frame (×.55, the mouth's cool fill on it short — e-fold 6.5 m): page .11–.12 (HSV value), stone off
    the cone .17–.19, walls in the cone .31–.34 (the stand's key: .12 / .13–.25 / .36). A thin cool rim
    of the day on the shoulders of upper faces (24 m from the mouth, 18 m from the arch) parts far stone
    from the page by an edge. The cone in air: core wider (.82–.97), slower fade (14 m), denser by the
    helmet and ×(1 + 1.3·wet) — wet is 1 near the lake, .6 in a water hall, .45 in a dripstone hall
    (`farK.w`). The day's second half: a cool bounce at the foot of the shaft (r 13) and under the arch
    (r 12) — walls there .21–.24. The far lens keeps two light events in its 72 m (mouth, arch, lake,
    crystal clusters parted by > 12 m, amber), sliding up to .6 of a half frame; where no two are
    within reach it leans to the nearest light (91qg counts both cases). The post shaders moved to
    `22dbx` (22dbw had reached 38.7 KB).
  - *Done (M630c, life as bodies; `22dg`, `22dh`):* plants and beasts are bodies in the 22d scene —
    the surface's own meshes (`plnHerbMesh`, `plnBeastMesh` with its pose book), one instance buffer per
    book, at the cave map's scale (a plant of `q.h` map px stands `q.h/CAVE_PPM` m; a beast's radius is
    `b.r/CAVE_PPM`, at least .28 m). Plants stand 1.25–2.05 m deep on the picture's floor (nearer to the
    cut where the rock leaves no room); a beast's `y` is its floor, fliers hang `hover` map px above it.
    The 2D brushes for life are gone from `cave3Over` (the find's glint stays). The near lens (×1.6)
    looks at the midpoint between the man and the thing that calls ДЕЙСТВИЕ (unscanned plant, stunned
    beast, find, amber). **Light in every gap:** any 30 m of the walk line holds a light event; where
    the events of pass 5 leave a longer gap, `22dh` puts one in its middle by the world's stone —
    glowworm threads off the roof (sedimentary), a warm vent crack in the back wall (volcanic), a day
    window through thin ice high in the back wall (ice), a wet wall that catches the lamp (any other;
    the quietest). Their softness is light close to the stone, never a flat halo mesh — those read as
    cut-outs. **The wedge:** air glows only inside the inner cone with a crisp edge, ×(1 + .6·wet):
    air in the wedge .25–.39, beside it ≤ .22, stone through it keeps a luma spread ≥ .068. Twelve
    lights by rank: the lamp's seven always, the rest by strength × reach over distance to the frame.
  - *Done (M630d, the designer's eight gaps):* the wedge is a correction to the stone, not a layer —
    brightest at the lamp, `3.2/(1+d²/3)`, ×(.7+.9·wet), dust-modulated, a 2–3° soft edge (air .33–.35,
    stone spread through it .14–.20). Stone is faceted by a warped Voronoi in `22dbw` mat 1 (slabs by
    strata, a druse in the grotto, sparse cracks fading below a pixel); dripstone (mat 11) is faceted,
    ribbed, wet on the crests; `pointSpec` gives every point light a glint on wet stone. Beasts: hide
    `.36/.33/.31`, a rim from point lights. Crystals: core > edge, a violet point light of 3–3.8 m;
    lights and dress ranked by x **and** y distance. `hudDim` (zone[i].w carry the HUD plates in frame
    px, measured in a `hudFloorMeasure` wrapper) dims glow to 8 % under the plates. Gap events grew:
    glowworm threads 2–4 m with beads and a floor light, a vent crack .26–.36 m with branches, sparks
    and a lip light, wet runs. Words: the tip at the shaft or mouth, «КУСАЧИЕ» above the nearest hostile
    beast (`cave3Biter`), the lit part of a gap event is a `hangBlock`; a line equal to the action
    button's verb is dropped (cave and `21pzb`). The far lens caps the top at the surface even on the
    back wall 15 m behind (`fBack`, walk line ≤ .5 of the frame). Ore strokes on the cut removed. Old
    plants' dry twigs start on the stem and droop (`21pia`).

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
