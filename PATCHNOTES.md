# Drift — patch notes

The game version is shown on the title screen. It has nothing to do with the save format
(`v:4`): records written by earlier versions keep loading.

Entries from 0.45.0 onward are written in English (docs are English, the game stays Russian);
older entries below are left as they were written — translating history would cost more than it
could ever save.
## Unreleased (planet-main)
n- **M803b Plates stay near their thing.** The leader is at most a quarter of the frame height; a plate may stand beside its body inside the centre band when its middle is in the middle third (the vision knows it); lines wrap to fit; a landmark plate drops the name when the world label is within 200 px. Debt found: the surface hint band of `21e` draws at U² instead of U (left as is).

- **M803 Words hang on things.** Discovery, arrival, the border stamp, the landing readout,
  the scoop and belt briefings and the surface «what» line are plates on their object with a
  leader (`08bj` `ovHang`); the centre 40 % of the frame stays empty, the vision checks it.
- **M804 — the night side of the orbs.** The dark half of every planet is filled by its own
  sky (cold blue where there is no air, the air's hue where there is) so it reads as a shape;
  the terminator is a warm rim whose width follows the air; polar caps are grain with cracks
  rather than a white blot; moons take their tint from the parent's palette (`gorMoonPal`).
- **M800c — the planet is the default view.** The engine's surface (`PLN`, M600–M627) is on
  unless `?pln=0`; the old painter stays behind that switch until M890. Its overlay tags now scale
  by the frame's ruler (`UIK`) — at 2560 the vision found them at 8.5 px. The travel-cache suite
  warms the region table and the wanderer's loop before counting (both are one-time tables, not
  the road) and allows the rail net's stops along the road.
- **M800b — city lights on the night side.** Each building light was a 2-px dot dropped whole when
  its centre fell into the shader's sea, and the terran world's own city pattern faded to nothing
  below r ≈ 300 px, so 24 lights read as one faint dot. Now a settlement lights the land around it
  (a soft halo on the sphere) with a two-scale city pattern that averages, rather than vanishes,
  once a scale is under two pixels; only land, only past the terminator, dimmed under cloud.
  The per-pixel land test per city is gone, so the loop is cheaper too.
- **M801 One astronaut: the rig card.** `rigCard()` (`21phc`) draws the planet's man rig to a
  texture in any pose of its book, any facing and the caller's light; the base, the cave and the
  raid lay it in place of their own figure (`RIG_CARD.on`, the old brush stays until M890).

## 0.492.1 - the world no longer dies after a jump

- **M800a — the world no longer dies after a jump.** The bind-group cache (`gpuBind`) checked the
  name and the resources but not the pipeline; the orb keys its group by planet index while its
  pipeline is per world family, so a jump where planet 0 changed family set a group of another
  pipeline's layout — 12 validation errors and a black frame until reload. The cache now checks the
  pipeline (no other per-family or per-blend pipeline can repeat it), and the orb's key carries
  the family so two families never thrash one slot. A new browser suite flies a jump between two
  such systems and checks at encode time that no group meets a pipeline it was not built for.

## 0.492.0 - the nebula «смело»

- **The nebula «смело» (GPU-2).** The look the author chose on 26.09 («B с розовым») sat ready on an unpushed
  branch and is in the game now: far layers turn toward the system's own shadow tone, near layers warmer; near the
  star the gas goes lavender with a pink transition at the rim; the side of a mass facing the star is lighter;
  bright strands follow the gas. Every turn of tone is a short arc toward a near tone — no olive, no raspberry.
- **No black thread where dust bodies meet.** Where a pillar grows out of the dust wall, the edge's distance was
  divided by a slope that vanished on the joint: a black thread of beads ran along it, and on the lit side a
  straight light ray from the star. The slope is now taken so it cannot vanish on a crease; the rest of the frame
  is unchanged.

## 0.491.0 - the station on the board, parts on the mounts, the cantina in 3D, faces that live

- **The station joins the board (M720–M721).** One face and one chamfered window for every station screen; on a wide
  screen three columns — sections with nested tabs, the tab, the ship card (fuel over ЗАПРАВКА, hull over the repair,
  hold over the tape, ОТСТЫКОВКА at the foot). The «Сурик» palette: graphite, cream ink, one red-lead accent, crimson
  only for alarm; one market table; the station head's ether is one framed line — tuning belongs to flight.
- **Parts in volume on the mounts (M722).** Every fitted part is a model in the hull mesh, under its light and
  shadow: turrets of six maker houses with twenty gun heads, towers, rails with copper coils, the shield's prongs, the
  reactor with radiators, a VLS with red noses, plates and engines — sitting on the real surface.
- **The hangar (M723).** ОПИСЬ's third zone is a graphite bay: the fitted ship in studio 3D (drag to turn), numbered
  mount markers, slot cards with leader lines, the inspector and the spare-parts tray. The studio renders at the
  frame's own size, sharp at 4K and cheaper on the phone.
- **Part thumbnails (M724).** Every card that names a part shows the part itself on a studio turntable.
- **The cantina in full 3D (M725).** The hall, its people and their portraits are engine scenes: lamps over the
  frame edge with soft haze, candidates on the stools, the keeper behind the counter. People are built from the
  manager's seed in role kits. The 2D hall is gone.
- **Faces that live (M729, first part).** The head is one sculpted skin — lids over the eyeballs, a real nose and
  lips, teeth behind them — and it moves by skinning: blinks, saccades, glances away, breathing, and six emotions
  (calm, glad, angry, sad, surprised, sly) read from the person's loyalty and character. Portraits on the cards are
  alive. The generator for every NPC and the wardrobe come next.
- **Recovered from old branches**: three open items of 28.09 that never reached the plan (the metro board against
  the fare, «КРАЙ» over a stop name, the yard calibration findings).

## 0.490.0 - «Борт»: the flight interface made anew

- **One material for everything over the world (M720).** Vitals, the place, the receiver, the rail,
  the pads and the menu are instrument plates: smoky glass, a cut corner, an edge hair and a glowing
  role tick; one narrow face with tabular digits; hierarchy by size. Laws in `docs/DESIGN-space.md`.
- **Keys are drawn on the buttons.** Every pad and rail button with a key shows its keycap, read
  live from the key map, so a rebind shows at once; the action plate says ПРОБЕЛ, the lock TAB. Hidden
  on a phone and under a finger.
- **The collapsed instruments are a piece of the rack.** Five cream dials under glass with amber
  needles, the misclose window and an `I` keycap, top-centre — instead of a tape gadget.
- **The open rack stands under the plates, at the plates' size.** It no longer hides behind the top
  row, it scales with the interface ruler at 4K, world labels stay off it, the message line goes under
  it; on a phone its eight gauges stand in two rows and it ends above the rail.
- **The menu is a plate too, and `Esc` opens it.** It opens under the top row instead of over the
  place plate.
- **The receiver finds its own place**: at the left edge, right after the left pads, or in the
  middle — wherever the pad row leaves room; on the map it no longer floats over the chart.

## 0.489.0 - gas giants of their own, crowds in volume, the dish

- **Every gas giant has its own weather (M703).** One of eight palettes per world (ochre, toffee,
  turquoise, deep blue, rust, sulphur, lilac, ammonia green) instead of one lilac for the whole
  galaxy; belts of uneven width and edge, mottled polar caps, from none to three storms at seeded
  places, bright ovals or dark eyes. A warm star tints the clouds less, so giants no longer all
  slide into one yellow.
- **Crowds stay in volume (M713).** When the frame runs out of full-size 3D layers, the next hull
  takes a smaller layer instead of dropping to the flat sprite beside its 3D neighbours.
- **The dish is a dish (M712)**: a paraboloid on a boom with its feed on three legs. Banked hulls
  roll at .6 of the game's bank, so a hard turn no longer lays a ship on its side into a dark stick.
- Fixed: the radio's tuning sweep never played - a second `radioTune` in the receiver module
  replaced the first, so each change of piece snapped the dial straight to the station.

## 0.488.0 - ships in 3D, planets on the engine, and the yards of the five powers

- **Ships in flight are real 3D meshes (M710).** The hull is built from `hullOf` as a loft with
  wings, nacelles, nozzles and boxes; the old bake becomes its paint. Star light, body shadow,
  belly paint, side seams and a flame light cone. Layer classes 128/256/512 keep big hulls in 3D.
  GT's tow hook is a tube now, not a stroke on the paint.
- **Pirates in 3D.** A welded lump on a height map: every plate a prism, holes cut through where
  the bake is empty, engines as barrels with an ember, turrets as spheres.
- **Planets and moons from orbit redrawn on the engine (M700-M702),** with an octave early-out and
  detail by CSS pixel for cost.
- **The yards of the five powers (M714).** Компания, Орднунг, Коммуна, Рассвет and Хай-Фронт each
  sell a line of 24 hulls with their own classes, stat character, prices, palette, proportions,
  naming habit (`Юнион Про™`, `Шлюз 4/Б`, `Розетта II`, `Наби v2.3`) and lore. A power's line is
  in its own stations and sold only after an episode with that power; in Ялта all five, at x2.
  The row is shown with the lock named.
- **Shapes.** Each power now has four or five airframe schemes instead of two or three, and the
  courier class is wider and shorter: it was a wire with no body in 3D.
- **Fix: a station's power was unknown until it was drawn.** `station.by` was set only when the
  station body was painted, so counters, unique hulls, the cantina and the ammo stamp all read
  ГЛАВТРАССА until the first look. It is now resolved on first read.
- Reversed `smoothstep` edges flipped in the hull and orb shaders.
- **The planet orb compiles per world family.** All twelve worlds in one shader took 3.1-3.5 s to
  compile and held the start gate; nine family shaders cost 0.2-1.2 s each, the ones a flight
  needs are warmed (warm-up 1.6 s), the rest build in the background while the old orb stands in.

## 0.487.0 - the fleet lands: the world off #c and onto the GPU

- **The surface, the cave and the mine draw on the engine.** Deposits, the landed ship, dust motes,
  the out-of-focus foreground, near weather and the final grade, the ground-edge grass, the night
  field, world labels and the drill bar, the hint band and edge chips: each moved off the 2D canvas
  into GPU shapes, lit bakes or the `#ovl` overlay. The cave and the mine now issue no 2D calls; a
  per-scene 2D census probe (`-Probe`) counts what is left.
- **The stand layer.** GPU twins of upright things cast shadows and take the world's light. Relief
  forms are baked per light and bent by wind in strips; buildings, the approach, the cave entrance,
  the mine head, the walker and the pennant are drawn the same way.
- **The player's base outside has volume.** Side face, chamfered roof, floor seams, lit windows,
  a door with a light slit, solar panels and a mast with a live beacon. One bake per light, with the
  beacon and label live on top.
- **The home outside is one bake.** Smoke, guy ropes and the washing stay live and are pushed as
  shapes (`VSINK`); shadows and lamps come from sinks recorded while baking.
- **Ground.** Narrow notches no longer extrude dark vertical shadow columns: slope and shade are
  smoothed over five segments.
- **The map is drawn with a pen.** Shapes go to the GPU and marks and text to `#ovl`, so `#c` is
  idle on the map. It merges with 0.486.0's late labels: `mapLateFlush` now draws plates and
  strings with the pen, rotated arm names through `ovTextRot`, and the late labels keep the pen's
  transparency.
- **The sky black hole redrawn.** A thin streaked disc across the shadow, a lensed arc, a photon
  ring and a brighter Doppler side, with no seams between the disc halves.

## 0.486.0 - the vision: the interface judged as numbers, and what it found

- **The vision.** The tests were green while every button in the build was overrun by its own text. The
  interface is now read as numbers before the raster: `test-geom.js` walks 17 windows (phones 320–421,
  landscape 568 and 780, tablets, PC 900–2560, the native font, DPR 1 against 3), ~110 screens and ~75 taps
  each, and holds every DOM box, 2D-canvas line, engine layer and bake against inequalities — overflow, cut,
  screen edge, overlap, covered, see-through, tap target, contrast, size under 8 px, squeeze, garbage, frame
  crash, DPR drift — plus composition notes (alignment, step, φ). It plants one defect per law first and goes
  «СЛЕПО» if it misses one. ~6 s; a rotated canvas line is measured as its own quad; a frame in which the game
  changed its layout is followed by one more, and that one is judged.
- **Tests cut to the stability core.** 248 files → 29 (save, money, time, travel, cloud, the frame guard,
  GPU loss, detectors); golden frames and the mutant zoo are gone. `test.ps1` with no flags — build, Node,
  smoke, the vision — runs in ~13 s and is the release gate with `-Full` (~26 s).
- **What the vision found, fixed:**
  - **the map:** labels lay over labels — thirteen modules, each placing from its own point. Own marks now
    register their ink; world captions (arm and nebula names, giants, rumour areas, prices, change tags, jump
    rings, the search circle, notches, ГЛАВТРАССА) are placed last on the first free spot of several, or not at
    all; a system's tags stack in rows inside the ruler frame; map type never under 8 px; the header and the
    footer on solid plates. The address row and the header share the top through one placer (on a phone the
    row used to cover the header whole), and the message line sits on a frosted plate under them — on a low
    window, in a column on the left when the radio leaves no room below;
  - long road hints on a tablet were wider than the glyph atlas and froze the road: runs are split by words,
    and a road frame that throws is now named and survived like the main frame; the road's instruments keep
    8 px on a 320-px landscape sheet;
  - the home's progress line came out at 3 px on a phone and the room shrank to a third at DPR 3; the base's
    «МЕСТО ПОД ЗАСТРОЙКУ» left its dashed cell at 1920 (now two lines when it must); instrument labels under
    8 px; hull lettering is paint, not interface, and is no longer measured as text;
  - layout: window footers and a module card's actions wrap instead of squeezing («СНЯТЬ УР.» stuck out of
    its button); the things table gets its own width from 900 up (at 2560 the labels left their cards); the
    ОПИСЬ parts grid stacks at 761–899; the radio scale is 8 px; on low windows (568×320, 780×360) the rail
    hangs between the vitals and the pads, «КАРТА» and «МЕНЮ» first (it grew off the top over the place line
    and the wallet), the menu starts under the vitals and scrolls instead of running off the bottom, and on
    touch the zoom buttons give way to pinch; on touch screens wider than 760 the console and the prompt stand
    above the pads (the console sat on ИМПУЛЬС); the jump pad says «Прыжок»/«Вверх» in a word that fits.
- VER 0.486.0.

## 0.485.0 - far galaxies instead of the big spiral

- **The big spiral galaxy is gone from the system sky.** It was one of the three landmarks a system can get
  (about a third of them had it) and read as a sticker on top of the sky rather than something far behind it
  (the author: «всратая галактика»). The landmark roll is untouched, so comets, remnants and the hole's jets stay
  where they were; a system that had the spiral now has open gas there.
- **Eight far galaxies in every system, at the edge of seeing.** Spiral, elliptical, edge-on with a dust lane
  and irregular, 2–5% of the frame tall, drawn in the nebula's full-resolution compose pass behind the gas: dense
  gas covers them, dust dims them, the star's glare hides them, and they move least of all with the camera
  (parallax .004). New module `16gaza-gpu-fargal`; the look came from the three.js probe on the `three` branch,
  where the rest of the probe's nebula lost to ours and was not taken.

## 0.484.0 - the fleet lands: the other modes on the engine, and a new sky

- **The cloud fleet's zones are in.** What the cloud sessions moved onto the GPU (G6–G13) now ships, after the
  merge with main, the regressions fixed and a census of 2D calls after `gpuWorld` at 0 in all 25 scenes:
  - **landing and surface:** near ground chunks as GPU textures lit per pixel, a third far ridge, gullies, a warm
    key and a cold fill; braking flames, dust, the lander's shadow and flame light on the ground; what stands is lit
    by the world's light and casts a shadow; the lake mirrors; the foreground band goes out of focus;
  - **underground:** cave rock, far wall and mine rock bake on the GPU with stalactites, curtains and lichens; cave
    water catches the lamp; the mine's lamps throw rock shadows, day falls down the shaft, ore glows — in main's colour;
  - **the belt:** asteroids in real 3D under the star, the maw landmark a 3D rock, the cockpit frame a GPU bake lit
    through the glass; **the raid** with depth-tested compartments and a per-pixel torch;
  - **rooms:** home, HQ, the cantina, kino, chess, «Сорока», the spa and the base — baked rooms, lamp light per
    pixel, air; people and lettering come after the room's light; the base's machines are baked bodies with live
    motion, and the fridge room splits the same way;
  - **the road, the map, the scoop, the rail:** the road's sky and bloom on the GPU, the galaxy made of stars with
    dust lanes and your rails burning, the scoop's heat bow shock and plumes, the rail scheme and the ride on the GPU.
- **A new sky, drawn by the engine.** Every landing composes its own sky from the world's seed: bodies, cumulus as
  merged round puffs with a flat base, a high deck, haze and far weather — all fields on the GPU; clouds sink into the
  night, a low sun glows through the ridge haze. The 2D sky is removed.
- **Phone budget.** On a phone the clouds bake at reduced density and composite once, and the surface skips its
  mid-frame canvas snapshots (cast, relight, near blur), which stalled the S23 to 31 fps at noon. Against 0.480.0 on
  the S23: night 58.2, noon 59.6, cave, winter and the system 60 fps, p99 16.8 ms everywhere.
- **Tests.** The harness names the suite where the GPU dropped and prints the GPU state at the start; the bake pool
  has a ceiling checked per suite; `test.ps1` runs on Linux (the cloud, CI) through SwiftShader.

### Disputed

- **Golden frames are not re-accepted**: 11 scenes differ from their reference by the new sky and the fleet's
  light. Контроль re-shoots them after a look; they gate no deploy.

## 0.483.0 - the §12 remainder and the §9 seams

- **§12, the last seams.** A drone now picks its market by the price you saw there and is paid that price (it used to choose by the seen price and be paid the live one). A seen price counts for 30 world days; after that the drone goes by the live counter. Selling pressure on a counter now decays by the world clock (`now()`), so it also eases while you are out of the game. The half-life is still three hours. The economy probe gained «маршруты по кругу»: the player skips a leg whose quote has gone negative, moves to the next route, and waits ten minutes when every leg is down. The numbers are in `docs/ECONOMY-AUDIT.md` (27.09).

- **§9 seams, checked against the code and closed.**
  - **Drones and far goods:** a drone no longer mines band-2/3 far goods (osmium and beyond). Neither the belt nor the surface offers the ДРОН button for them. A band-1 far good (he3, palladium, amber) is sold by the drone at half its price (`droneMayMine`, `DRONE_FAR_MUL`).
  - **The stamp and the metro:** the stamp already landed only on a jump or on ВЫЙТИ. The ring's «Стыковка?» hail now fires only for a ship heading into the ring: by its motion, or by its nose when stopped. A ship just let out of the train no longer gets hailed as it leaves (`railHeadingIn`).
  - **The first hour:** at the first docking in the heart, the замполит hands over one жетон («первый — за счёт трассы») and says where the ring is. The first metro ride is free, and the ticket button reads ЖЕТОН ЗАМПОЛИТА. The token does not work for the express or the маршрутка. It is kept in `G.first`, so no new save field.
  - **Rescue and rails:** a dry ship in a system with a rail stop gets a third exit, НА МЕТРО. It is a ticket, at the ticket's price, to the stop the cashier sells that lies nearest home; the ring takes the ship on board.
  - **The scheme's scope:** the paper opens on your stretch: you and everything the cashier sells, with a margin. The wheel or a pinch widens it to the whole net. «Край» was already per player (your own visits).

- **Picture pass.** The rescue window's НА МЕТРО row had no icon and printed «undefined»; it now shows a ring on a line. The ticket buttons read ЖЕТОН where the price stands, and the section head says once what the замполит's token is; a long ticket line wraps instead of running off the button. The scheme's title and legend sit on paper plates, since the lines now run under them; on a phone the legend wraps by « · » clear of the line samples, and the captions under the paper wrap by phrase, clear of the Меню button. The empty-tank test counts the fourth exit where a stop stands.

### Disputed (cautious variants taken; the author may overturn)

- **Drone paid at the seen price for 30 days** (§12): the cautious reading of «продаёт по ним». The other option was min(seen, live), which never lets a stale ×2 need pay out, but then a drone could never be sent to a better market it had seen. Counters saved before this change carry a frame-clock stamp; the first read resets it to now, which loses at most one decay step.
- **Half-life kept at 3 h on the world clock**, not the 6 h A4 suggested: the probe numbers did not ask for a slower recovery.
- **The token is also handed to old saves** (§9) at their next docking in the heart, since a save carries no reliable age. It is worth one 5-credit ride.
- **The scheme's scope is the cashier's reach** (§9): the stops `railDestinations` sells, rather than a graph of «rings met and their neighbours». Those rings cross that window anyway, and the rule needs no second walk of the net.

## 0.482.0 - stage 7: the giants, small things and the economy seams

- **M464 — one giant per arm (§8).** The six giants now stand on the galaxy model's real arms: two arms, two branches each, one giant per branch at 19–22 sectors and two more nearer the core at 14–15; the hollow moon stays at the core. Where the arms cross, the placement walks along its own branch in half-sector steps until the model names the spot as that arm (or a nebula of that arm) and it is at least 8 sectors from the others. The discovery log line names the arm.
- **The ruler in the frame.** Under the giant's name in the system: «≈ N ваших корпусов в длину», counted from the hull you fly.
- **Docking and visiting.** Within 760 of the body the cue offers ПРИЧАЛИТЬ. The visit window gives a paragraph of the place, a rumour from its people (seeded by the giant and a three-day bucket, logged once, НА КАРТУ like a station rumour) and, on the first visit only, a keepsake in ВЕЩИ (`G.giantsSeen[k]=2`, no new save field). The Дом водителя also lets you stay the night: 150 кр, hull +15 %, a full tank.

- **Stage-6 picture pass.** The shipyard's built-in cell in the КБ drawing is now a pale blueprint stamp (fill at .15, dashed edge, letters in the same pale #dce8f4), quieter than the ochre frames of the things. The «Иней» cabinets in the base cross-section drop a step from pure white towards the wall tone and fall off under the lamp: lit at the top, about 28 % darker at the floor. The display and the padlock are unchanged.

- **§11 small things.** The belt entry note folds the icy ring into the ore line («руда: … · и кристаллы льда»), so on the phone's three-line message «тяните по стеклу — обзор» is no longer pushed out. A good's name in lists and prices takes its own text shade (`resTxt`): the same hue mixed towards light until it reads at 4.5:1 on the panel. Тёмное стекло, углеволокно, графит and чернозём change; the rest keep their colour.
- Closed as already done on this branch: station shuttles draw (`t.mk`, came with main), and chips avoid each other while gliding to their slots (the `chipDrawn` pass, 24.09).

- **§12 economy audit: the faucets closed.**
  - **Liberation prize:** paid in full only when the freed system will hold. While an occupied neighbour (not calmed by a suppressed nest, not under the трасса) can take it back, the station pays half: «вернутся».
  - **Hotel night:** costs half of what the dock charges for the same tenth of hull (was a flat 12 кр), one night per station per shift. The mark lives in the station's holding record; the free night below a third of hull stays.
  - **Plan and order:** one ledger, «bought here this shift» (the appetite's `here`), read by the state plan and the order. Units bought at the same counter pay the bid, not the premium; for the order they also get no per-sector fee.
  - **A visit is (station, shift), not a docking.** Undocking and docking again in the same shift continues the visit: the ГЛАВТРАССА fuel norm, the Company fee, the scrip cap and the cooperative cap carry over from the station's holding record.
  - **Escort:** half at accept, half when the run arrives (the barge lives its chord beside you, 90 s, or you drive off its attackers). Leaving the system with the contract fails it, and a barge is hired once.
  - **Hired hands' fines and debts** take what is on the account and never go below zero.
  - **Sale multipliers:** need, monopoly, expedition, occupation and spy are capped together at ×2.2. The blockade takes the larger of itself and need, not both.
  - **Smaller seams:** a drone's delivery closes a need window; an order's deadline counts from the taking; the factor's margin floor no longer grows with level and perks; the dead `evacuate()` is gone.
  - **Gate:** three nets in `91zzzzy2-money`: freeing twice pays at most half the second time; buy-and-hand-in for the plan or the order never nets positive; the balance is never below zero after any row of the hired hands' event table.
- **Whose voice on the approach (the author, 27.09):** the lane (billboard, hotel, parked fleet, queue) now dresses by the land's owner, `stampOwnerAt`; the builder shows only in the station's own body. Rule in docs/DECISIONS.md.

### Disputed (cautious variants taken; the author may overturn)
- M464: only the Дом водителя sells a service (the night); the other six give a paragraph, a rumour and a keepsake. Trade or jobs inside a giant were left for a later pass.
- M464: the giant's length for the ruler is one fixed number (GIANT_LEN 1300) for all seven, not per body.
- M464: the six arm giants left their old ring positions (only the moon stayed); a save that already found one keeps `giantsSeen`, but its landmark is somewhere else on the map now.
- §11 «planet angles follow the frame rate»: closed with no code change. Since the fixed quanta, `dt` is `steps × QUANT_DT` taken from real time, so `ang` already follows game time as `G.t` does. The only difference from `ang0 + w·G.t` is that orbits stand still on the surface, in the map and in the other off-system modes. A pure function would make the planet jump away from a ship taking off, and the clamp depends on the hull's thrust. `ang` is not in the save.
- §12 liberation prize: chose «half while it can be retaken» over «full once per system, then fading». The latter needs a per-system memory, and there is no save field for it. A first liberation next to a live front also pays half.
- §12 debts: chose a floor, as `lawDock` has, over a real debt like ПАЛАТА's `P.debt`. A broke player gets off a fine lighter than before.
- §12 escort: the «destination» is 90 s of the barge's chord in this system, since barges are not simulated across systems. Rescue also completes the run.
- §12 multipliers: the ×2.2 cap is my number, a little above need alone (×2).
- §12 per visit: the norm, scrip and co-op leftovers are stored on undock in `G.hold[station].vis`, an existing saved structure.
- Lane owner: the lane is cached in the system, so a land that changes hands re-dresses the lane only when the system is regenerated.

## 0.481.0 - stage 6: the story and the rest

- «Смена» (P15): a landing in a new kind of place only arms the next chapter («где-то здесь. Отойдите от корабля»); walking 480 px from the ship lives it. The arming stays in the surface state, not in the save: leave without stepping out and the chapter waits. The 72-kinds-of-place check was already a suite (r ≤ 20).

- Receiver at the border (M457): entering a power's land, the ether log speaks its `air` line once per crossing («Приёмник · ГЛАВТРАССА: «На трассе спокойно»»). The ear pass on the six motifs stays for the release run.
- Yards at work (M480), on ordered hulls only: a Рассвет hull patches itself from a pirate downed within 600 px (+6 % hull, «на соплях, но держит»); a Хай-Фронт hull's firmware moves one unwelded thing of the plan to another free deck cell once per сводка («обновление установлено… так удобнее»). The сводка mark lives in the order itself.

- The special system (M484): every ship card in the yard names its ability — «особое · СБРОС — груз за борт приманкой… · долгое ДЕЙСТВИЕ или V · раз в 25 с». СИРЕНА is answered only by the ships actually in the frame, each in its own voice: a pirate threatens, a power's patrol answers with its `air` line, a ГЛАВТРАССА liner asks to turn the music down, the black derelict never answers; an empty frame — «эфир молчит».

- Scars on captured pirate hulls (M482): a crewman's «пригнал трофейный корпус» no longer hands over a clean catalogue hull — it is a build of its own (a maker by seed, «трофейный корпус», «Отбит у пиратов…») with 1–3 scars, repaired at a yard like the towed and the bazaar hulls. The trophy shelf and the thing card name it.

- Утильсбор, the rest (M513): once the transit runs out the paper plate hangs from one corner, crooked; while the hull is on transit plates, the КБ at a yard of your own flag refuses to re-plan it («сначала номера, потом чертёж»), and the instruments' warranty is void — the broken-instruments list says «гарантия аннулирована: корпус не на учёте» and ТЕХПОДДЕРЖКА is not offered.

- **M463 the bazaar: odd lots and a rumour at the stalls.** Beside the random part, РАЗНОЕ now carries a plate off a hull broken up here («Табличка с остова «…»», 40–90 кр, goes to ВЕЩИ, changes nothing — memory, not gain). Every other shift a separate counter sells one rarity from the barge-hold table (6–12 k кр), only one nobody holds yet; bought, it counts toward the hundred like a find and stays on the counter as ПРОДАНО. Under the awnings a junk-dealer tells one rumour per shift — seeded by the bazaar and the shift, so it never repeats the station of the same system — logged to ЛЮДИ, remembered on the map, with a НА КАРТУ button. `rumoursHere(seed)` takes an optional seed.

- **M487 подписка: the cold store and the rush in a fight.** New base module «Иней» (`21ac4-base-fridge`), sold two ways in the build menu: bought outright (3 400 кр + 4 alloy, +4 good харч every shift for ever) or «по подписке» — 10 % up front and 136 кр per shift, only where Компания or Хай-Фронт own the base's system; the card says «к 23-й смене вы заплатите полную цену». When the fee does not go through, the door is locked: no харч that shift, and what it already gave stays («перестаёт давать, а не отнимает»). The journal warns a shift ahead (balance below the next fee), every 25th shift the tariff is «обновлён» with one trifle turned into an add-on. In the cut the owned fridge shows a green panel, the unpaid one a red panel and padlocks. In a fight, a subscribed instrument that is locked is offered on the prompt: «ЭКСТРЕННОЕ ПРОДЛЕНИЕ · ×3» — one ДЕЙСТВИЕ, triple fee, unlocked now.

- **M480 the free cells.** An ordered hull from Хай-Фронт or Орднунг now carries its yard's built-in on the blueprint: a pale dashed stamp in the frontmost free nose cell nearest the axis — «дальний захват» (ПР, an instrument in the nose third, sight one palladium step up, no cargo spent) or «лобовой щит» (ЩТ, on the nose plating; its number stays the +8 % nose armour of the yard). It needs no part, is not in the hold, cannot be taken or covered («встроено верфью · не снимается»), shows in the tray and counts in ЯЧЕЙКИ. Catalogue hulls and old saves are untouched; nothing new is saved — the cell is chosen by the yard from the packer's layout each time.

- **Dead rarity calls removed.** Void containers and hulks called `rareTake("cont")` / `rareTake("hulk")`, places that `RARE_WHERE` never had — they never gave anything. Removed rather than populated: the hundred live in six places, each named on the showcase, and a new place would reshuffle every rarity's address (`i % places`). A hulk's finds stay the parrot, the foreign kit piece, the book and the matchbox.

### Disputed (cautious variants taken; the author may overturn)

- M482 доводка stays paid with нейтронная крошка + 800 кр (M478), not with a node as DESIGN-shipyard §6 says: spending a node would break a set the player is collecting. Two welds per hull, +1 tier — already so.
- M463: the rarity counter draws from the barge-hold pool, because the six places of `RARE_WHERE` are the only pools (the dead «hulk»/«cont» calls in `17b-finds` are removed). A bought rarity pre-empts that one barge find; the cautious take is one every other shift at 6–12 k.
- M487: no subscription state is saved — base cells persist as `{k,hp}` only, so the subscribed fridge is its own kind (`fridgesub`) and whether it is locked is read from the balance each shift. Other base modules are not offered by subscription yet: each needs its own «stops giving» hook. In a long absence (bulk catch-up) the fridge, like the garden and the vat, neither feeds nor charges.
- M480: Орднунг's front shield cell adds no number of its own — the yard's +8 % hull already is «носовая броня даром», and a second bonus would pay twice; the calibration pass may move it to the shield.

## 0.480.0 - stages 2 to 5: whose land, the road, the ship, the voice and the joke

- **M453: the stamp page can be filled.** Ялта now gives its own round stamp (six signatures in a ring, weapons
  sealed). That also makes the diplomatic passport reachable: it wanted all six powers and Ялта, and Ялта never
  stamped. The pirates' scratch «ГОНИ ГРУЗ» lands on entering a system with a pirate base. The land under a base
  stays whose it was, so the scratch comes 1.3 s after the power's stamp, never instead of it. The empty cells
  say where to go (Ялта's sector, «царапина у пиратской базы»). Stamps have an uneven ink grain; the receipt has
  none. `stampOwnerAt` still answers «whose land» for the laws and names; the stamp asks `stampKeyAt`.
- **P14: the record book is a document.** A series and number, one line on what it is for (records are made by
  others; three from a station put you on its board of honour; after 12 years of sky, the medical board). Stations
  one or two records short of the board are named. Leave: 28 days per year of service, the sanatorium takes its
  three, and at the medical board the unused days are paid out (40 кр a day) with a line from «бухгалтерия». The
  page says how many years remain to the board, or shows the board's conclusion. Institutions' entries carry a
  round «м.п.» seal, people's a hand signature.

- **M454: the station is built by the land's owner, in the builder's hand.** A station's builder used to be
  picked from the system's seed, so a station said nothing about whose land it stood on. Now it is the owner
  of the land; one station in five is foreign-built, and the wild builds whatever it gets. The builder's
  grammar reaches past the plate to every module and the core. The module hulls take the builder's ground. The
  profile law rounds the core's ends for Компания, Коммуна and Хай-Фронт and keeps the right angle for
  ГЛАВТРАССА and Орднунг. Each builder marks its seams: Орднунг's black numbered ribs now run over the modules,
  not hidden under them; ГЛАВТРАССА a stencil stripe and number; Компания a logo band; Коммуна an arc of warm
  windows; Рассвет a patch of other paint; Хай-Фронт white, light from under, the odd red dot. The joint where
  a module meets its rod is drawn in the hull grammar (clamp, flush, flange, fillet, weld, gap). The picture is
  a draft for the graphics pass.

- **M450: the galaxy overview.** The map pinches past zoom 5, up to 14. There the sheet of systems goes out:
  its per-frame loop cannot walk fifteen thousand sectors. What remains is the whole disk with its arm and nebula
  names, and the only glyphs on it: «ВЫ ЗДЕСЬ» with your address, the core, the settled circle, the danger rim
  at r = 40, Ялта (where its stamp is), your matches and rumour areas. A tap on the disk takes the map there at
  zoom 3; the prompt line says so. The overview finds where to look; it does not jump.

- **M458: borders on the map in the owner's pattern.** Where a sector's owner differs from its neighbour's, each
  side draws its half of the edge just inside its own cell, in its own pattern: ГЛАВТРАССА a chain of tiny stars,
  Компания a thin line with rings, Орднунг a precise dash with ticks (every third one long), Коммуна a wave,
  Рассвет uneven dashes with small suns, Хай-Фронт dots. Two powers meeting read as two patterns side by side;
  against the wild, one. Where they are at war the red front stays instead. Far out, where no pattern fits, a
  thin line in the owner's colour. The emblem chip grows at near zoom to a readable 14–18 px. The station's
  compass chip and the station header carry the land owner's glyph (★ ◎ ▦ ∿ ☼ ●). The picture is a draft.

- **M466: янтарь in the cave, жемчуг on the hunt, the reading everywhere, the vein told.** A cave on a planet
  with an янтарь deposit now has warm resin knots on its walls, at the branch ends and along both galleries;
  walking up to one takes it. How many knots there are follows what is left in the deposit, so a worked cave is
  poorer next time. A stunned beast's sample on a planet with a жемчуг deposit carries a few grains, until the
  deposit runs out; a beast taken alive for the farm gives none. The planet's approach line reads «ЗАЛЕЖЬ:
  осмий 40–160» from orbit, and the dig entry shows the instrument plate the belt already had. A new science,
  «Линза тёмного стекла», halves every reading's spread; it costs data and one piece of тёмное стекло from the
  hold. A struck жила is told: after one сводка (a shift) stations within twelve sectors carry the rumour
  «жила — космический янтарь, говорят, на двадцать трюмов», and from then on the approach to that system has
  one or two extra hulls. No new save field: a struck vein is a grade-3 deposit in `G.farTaken`, and the
  strike time is the rush's (`G.rush`).

- **M467: far goods on sale in the heart, rarely and dear.** Inside r 10, about one station in four puts out an
  «ИЗ ДАЛИ» stall for three days: two to six units of one far good at three times what the same counter pays
  for it. The lot is rolled from the station and the three-day window; what was bought is kept in the station's
  market record, so no save field is new. A player who never goes out can still buy one piece of osmium for the
  shipyard, and selling it straight back loses two thirds.

- **M469: the eaters speak, and the hotel shop eats.** A far good's sell row no longer says «×1,5»; the eater
  says who takes it and why: the Коммуна's jewellers' artel for янтарь, the Компания's «стойка роскоши™» for
  жемчуг, Хай-Фронт's optics shop for тёмное стекло. At a yard the reactor shop takes солнечный газ, the
  instrument shop белая руда, the armour shop осмий, the finishers нейтронная крошка. By land it is
  ГЛАВТРАССА's armour shop for осмий, Орднунг's rail gangs for магнитная пыль and the дачный кооператив for
  чернозём; any power's navy takes the traps. Without an eater the weigher keeps his line about the scales. The
  hotel's shop buys up to three жемчуг per visit, at one and a half times the local counter; the desk prompt says
  so before the tap, and the market never sees those grains.

- **M470: «Край» and КУДА ВАМ on the scheme.** The paper scheme is now where the trip is chosen: a tap on a stop
  opens one ticket button under the paper, «ДО «ЛУТИАЛ» · 3 ОСТ. · 20 КР», and a tap past the paper folds it. The
  stops the ticket office sells from here wear a thin red ring. On every line that runs outward, the furthest
  stop you have stood at is marked «КРАЙ» in red, and the line past it is drawn dashed, «не езжено», until you ride
  further. What counts as stood at is the station visit count that already persists, so the save is untouched.
  Stop names by the land owner (M489) were already in place.

- **M471: the bare rim platform; the helm helps in the cone.** Past r 40 a stop is a полустанок. There is no
  vestibule block: a plank platform, a bench and one lamp on a post with its own warm circle of light. The glide
  path has three lamps a side instead of nine, and the plate reads «ПОЛУСТАНОК · ЛИНИЯ …». Its screen is bare
  and dark, «скамья и фонарь · буфета нет», and has no buffet. When docking, inside the cone of lights the helm
  damps speed above the mark (×0.965 a frame, the way the autopilot eases), so holding under the mark is a
  matter of aim, not of fighting the throttle. On a phone the cone is 1.4× wider. The picture is a draft; the
  plate label sits over the platform when the vestibule side faces down, which it always did.

- **M472: the board flips; крупногабаритный ×3.** The ТАБЛО is a split-flap board now: every redraw, a letter that
  changed since the last one turns over like a plate (a quarter-second squash), and the rest stand still. «через
  0:14» → «через 0:13» flips only the last digit. The ticket office charges baggage ×3 as «крупногабарит» when the
  hold carries anything heavy (осмий, нейтронная крошка), and the ticket button says so.

- **M473: the held pad ×2.** On a run between stops, holding ДЕЙСТВИЕ makes the train go twice as fast. It never
  skips a stop, and a stop still takes its two seconds. Under the top line of the ride a quiet hint says
  «ДЕЙСТВИЕ ЗАЖАТЬ — ВДВОЕ БЫСТРЕЕ»; while held it reads «×2 · ПЭД ЗАЖАТ» in turquoise.

- **M474: Рассвет's маршрутка, EXPRESS™ on the scheme, the front shuts stops.** At a Рассвет station every ticket
  has a twin, «МАРШРУТКА «ДО КУДА?»»: the same line, slower, and on a run a tap of ДЕЙСТВИЕ («водитель, остановите
  здесь») drops you at the nearest star by the road, station or not (never the one you just left). Holding the pad
  does not speed a маршрутка up. The Коммуна compensation маршрутка stops on request too. The scheme draws a blue
  dashed line beside every stretch whose both ends are Компания land (that is where EXPRESS™ runs) and a red cross
  on every stop at the front. A front stop is shut: the ticket office does not sell it, trains pass it with an
  announcement, and at a front station the office itself is closed, «ФРОНТ · ОСТАНОВКА ЗАКРЫТА», with no маршрутка
  offered.

- **M508: the pirates respect a sealed hold.** Ordnung's seal no longer comes off when you step off the train. It
  stays on the hatch until you dock at a station, where an inspector takes it off («претензий нет»). While it is on,
  selling is still refused, and the pirates weigh the protocol: half the usual raid turns up, and the screen says
  «Пломба Орднунга на люке · часть пиратов отвернула». Riding Ordnung with a full hold is now also an escort home.
- **M510: the front cuts the line.** A stretch whose both ends are front stops is cut: the war runs along the rails.
  The ticket office sells nothing through it (transfers included), and a train already on its way stops short at the
  last whole stop, «дальше путь перерезан · поезд дальше не идёт». The scheme draws a red break across the stretch.

- **M475: the holding extends the line.** A new holding building, «Путевой пост» (family E, 3200 кр + сплав 10 +
  арматура 6): when it stands, ГЛАВТРАССА lays a two-stop branch from the nearest line station (up to 8 sectors) to
  your site, and the site becomes your полустанок. The branch has a name from the name generator («Ветка «Кваора»»),
  it transfers to the rest of the net like any line, and the journal records the deed once: «ГЛАВТРАССА: проложена
  Ветка … до вашей площадки». The seeded net is untouched; branches lie over it and vanish with the post.

- **M476: the hold is green.** The legend under ЧЕРТЁЖ always said «зелёное — трюм», but the hold was a pale
  white hatch. It is now a green wash with green hatching, in ОПИСЬ and in КБ alike.
- **M477: the КБ grows up.** Things keep their shapes: a two-cell thing lies in a line, a four-cell thing is a
  square, anchored at the cell you tap. Tap the thing you are holding once more to turn a two-cell thing; at an
  Орднунг yard the answer is «поворот не предусмотрен формуляром». The numbers strip reads ЯЧЕЙКИ · ТРЮМ · БАК ·
  ЭНЕРГИЯ · РАЗГОН, each green or red with its change since you opened the КБ. Three ПРОЕКТЫ per hull, РЕЙСОВЫЙ,
  БОЕВОЙ and ПУСТОЙ ТРЮМ, switch with one tap; ТИПОВОЙ no longer wipes them. A foreign yard (not your flag) bills
  12 кр per cell moved, shown above the plan and paid at ГОТОВО; if you cannot pay, the plan goes back to what it
  was. Under the tray, «В ТРЮМЕ» lists the spare parts from your inventory: hold a placed part, tap a spare of the
  same kind, and it is fitted in the same place. The station's ОСНАСТКА row is now «КОРПУС · ОСНАСТКА И ЧЕРТЁЖ»,
  with a КБ button next to ОПИСЬ.

- **M478: the far goods go into the hull.** The КБ has a new row, «ДАЛЬНИЕ ГРУЗЫ В ДЕЛО · ПЛОТНОСТЬ». One unit
  from the hold raises a density one step, up to three per hull: гелий-3 → КОТЁЛ (energy +12 % a step), палладий
  → ПРИБОРЫ (sight +6 %), осмий → БРОНЯ (hull +8 %), магнитная пыль → ЩИТ (shield +12 %). Нейтронная крошка is
  доводка instead of a node: hold a module in the КБ, press ДОВОДКА · ВВАРИТЬ (крошка + 800 кр), and the module
  works one level higher and never moves again («вварено — не двигается»); a dashed weld seam rings it on the
  plan. Two welds per hull. Densities and welds belong to the hull: projects and ТИПОВОЙ keep them.

- **M479: the plan decides which side takes it.** A hit from behind is now «двигатели принимают»: on top of
  the damage it adds to the ship's wear, the one number that makes a worn machine answer the stick worse, and
  the screen says so (at most every five seconds). A hit on a side where the plan has armour on the skin (a
  «корпус» part or the armour module on that side's rim) loses 15 % to the armour. Hits on the nose are as
  before. Where you lay the armour in the КБ now matters.

- **M483: the new-part mark.** In the КБ's «В ТРЮМЕ» row every spare part now says where it would go and what it
  would give, as its biggest change in one coloured figure: «Резонансный реактор Р-12 · ЭНЕРГИЯ +28», «ТП-82
  «Веретено» · ОГОНЬ/С +7.9». Parts that would improve the ship are lit and their slot is ringed in green on the
  plan. Tap such a part with nothing held, and the КБ picks up what stands in that slot and shows the place; tap
  the part again to fit it. Into a free slot it goes straight away.

- **M485: the barge and the tug have machines at the wheel.** Your barge's autopilot now has a name and a quirk
  from the drones' table: «Шаланда» · автопилот Кузя · торопыга. The quirk works both ways. A торопыга sometimes
  makes an extra leg in the same shift and stands more often («Кузя встал. Спешил.»); an осторожный one rarely
  stands and never hurries. The rescue tug's call line names its autopilot as well («буксир «…», автопилот Глаша
  (ленивый, но живучий)»).

- **M486: the кулибин and tape on a part.** About one hired hand or manager in seven is a кулибин (it shows on the
  crew card). While one is on staff, he tapes the hull over the radio without a roll, and it holds at 60 %. A
  broken instrument taped by a кулибин keeps its гарантия («так замотаю, что не видно»), and every taped
  instrument adds a strip to the hull. The ИЗОЛЕНТА block shows whenever the hull is below half, so a new player learns
  in the first hour that tape works anywhere and where to buy it.

- **M495: the triangle closes.** Firm instruments («Сирин», «Веха») now fail on their own: once a shift each
  one draws from its seed, rarely while under гарантия (8 %) and often in the two shifts after it runs out (35 %,
  «гарантия кончилась вчера, прибор — сегодня»). The ТЕХПОДДЕРЖКА call plays one bar of hold music, eight
  square notes through a phone-line filter, the last one a quarter tone flat. At some Рассвет and Коммуна
  stations an old master sits by the repair counter: СТАРЫЙ МАСТЕР · ДАРОМ re-sews a taped instrument to near new
  («изоленту вашу я оставлю, она тут уже несущая»), once a shift per instrument, without bringing back the
  гарантия.

- **M489: the sign says whose it is.** The station header now reads by the owner of the land, as the metro stops
  already did: «ПГТ УРНЕЙУР», «САРИС-СИТИ», «БЕЦИРК КСИДРАЭШ № 6», «СЕН-КОРЭШ», «КООПЕРАТИВ «КАЗЕОРН»»,
  «ПИВЕКСИН-4 V5.9». When the flag changes the sign is repainted. Your own settlement takes the owner's form too
  and stays «посёлок X» on land nobody holds. A holding without a name you gave it is announced by its sign. A
  subscription names the firm behind it («Вязьма Аэроспейс»), one invented firm per station.

- **M492: Космопочта carries more than hulls, and it has a queue.** A good part a hired hand takes off a foreign
  hull now travels by post: «снял с чужого борта: ТО-41 «Оса» · выслал Космопочтой», and a notice waits in
  ПОЧТА. A registered co-operative sometimes sends its members a share by post once a shift, more often and
  bigger when its spirit is high («посылка кооператива «Ласточка»: лёд ×8»). At the window you take a ticket
  first. The number of people ahead depends on the post hour, with a rush at opening and after lunch, and each
  one takes a third of a post hour. Leave the station and the ticket is gone. The kind clerk still keeps a late
  parcel a day longer, once. A parcel past that goes back to the sender.

- **M460, M491, P12: the billboard and the сводка talk about you.** The crawling line on a station's billboard
  now takes turns: the best price nearby, then the latest сводка in the owner's voice («ЦИРКУЛЯР № 17: …»,
  «FEED // …», «ГАЗЕТА «КОММУНА»: …»), then your own holding within three jumps advertising itself («СТАНЦИЯ
  «КВАИТЭЛЬ» — ТОПЛИВО ЕСТЬ · 1 ПРЫЖОК»). An empty turn yields to the price. The two voices that retell your deed
  (M491) are now written into the сводка too, so ЧТО РАССКАЗЫВАЮТ in the cantina keeps them, and the billboard
  repeats them. As before, the game never says which of them is true.

- **M455: the peacetime fleet keeps the chronicle's calendar.** ГЛАВТРАССА's субботник no longer runs every day.
  It happens on the chronicle's Saturday (a chronicle day is four сводки) and on days the Director has declared a
  «субботник» for ГЛАВТРАССА. On other days the two tugs stand at the dock facing the station. The субботник
  itself moved into view: the tugs now lead rocks on a small arc behind the station instead of out on the far
  belt, where nobody at the dock could see them. Any other rite the chronicle has running for the land's owner
  hangs as a line over the scene («АМНИСТИЯ · …», «ПЕРЕПИСЬ · ответить на вопрос»). The Коммуна strike was already
  driven by the society incidents and stays so.

- **M456: the last three laws are heard.** Рассвет has its rule now, «сделаем из ваших». Its stations sell no
  parts; instead the workshop takes two of your spare parts of one kind and builds one a step better, with the
  Рассвет stamp, for 60 кр a step («из «…» и «…» собрали «Силовое поле, собран из трёх»»). Fitted parts are
  never taken. An Орднунг speeding fine is no longer a journal line: it comes as a paper in ВЕЩИ, «Квитанция
  Орднунга № 4171», with the paragraph, the speed, and «экз. 2 и 3 вам не выдаются». The Коммуна lunch hour now
  shows on the market tab itself («ОБЕД · 13:00–14:00 · топливо продаём — топливо не обед»), not only as a
  refusal when you try to sell.

- **M512: societies have duties, three more of them, and the desk does the sums.** Three new societies, each
  with a deed, a perk wired to code and a joke. ДОСО (30 jumps, 1 % dues) adds 10 units to ГЛАВТРАССА's fuel
  norm. Спасатели (you were towed three times) makes Рассвет's repair tug pull your hull to 70 % instead of 60 %.
  The Общество читателей (5 books on the shelf) reads aloud in the cantina, which gives a free rumour on some
  dockings. Two duties arrive with them. The Профсоюз водителей expects you at a ГЛАВТРАССА station on a
  субботник day once a chronicle week, and a member who misses two is expelled («ничего личного, товарищ»). The
  Партнёрская программа™ sends a weekly parcel to ПОЧТА, and 100 points that convert to points. Leave it
  uncollected and participation is suspended, «баллы сгорели™». On the КНИЖКА page each membership now shows its
  arithmetic: dues paid, what the perk gave in кр, how many times it worked, and the total.

- Station chip: the owner glyph goes after the name, so the chip reads like the tables (M458 fix).
- Far stall «КУПИТЬ 1»: a refused purchase says why (no credits / hold full) instead of staying silent.
- Tape button at the repair row keeps its width: the label is fixed, the roll count is a corner badge (99+); buying many rolls no longer pushes the neighbours.
- Tests: the GPU-loss atlas suite picks a station whose dress writes text (ГЛАВТРАССА, Компания, Орднунг — M454); the button sweeps close the KB window they may open; LOOK_BASE «карта» empty 61 → 41 (M458 borders).

### Disputed (cautious variants taken; the author may overturn)
- M453: the pirates' scratch is earned by entering a pirate-base system; it could instead come from a fight
  survived. Leave pay is 40 кр a day, a fixed number rather than tied to wages. People and institutions are
  told apart by initials plus a short list (Вега, попугай, замполит, неизвестные).
- M454: the builder is the owner at the first look of the session. A station keeps no memory of who built it,
  so after a conquest it redraws as the new owner's on the next session. The other reading, a station
  that stays the loser's until rebuilt, needs a saved field.
- M458: the glyph beside the station name is the land owner's, not the builder's; after M454 they agree four
  times in five. The glyphs are Unicode text (★ ◎ ▦ ∿ ☼ ●), so their look depends on the device font; the
  canvas emblem stays the map's own. Орднунг's «numbered» dashes are ticks, not digits: digits at 9 px on an
  edge were noise in the draft.
- M466: «тёмное стекло in the instruments» is a science bought with data plus one piece of glass, not a
  shipyard tier-8 part; the shipyard is stage 4, and this keeps the save untouched. The «company on the
  approach» is one or two extra pirates, not prospectors: there is no neutral traffic to borrow yet. The vein
  rumour never lies (the ordinary 15 % do); the vein is real. A vein struck before the latest rush is told at
  once, since only the latest strike has a time.
- M467: «dear» is ×3 of the counter's own buying price, one unit per tap. The stall shows any far good but the
  amber chips, antimatter and neutron included; a price list might want the deepest two kept out of the heart.
- M469: the yard densities (reactor, armour, shields, instruments) and доводка by крошка are left to stage 4.
  They are the shipyard's own mechanics, and the resources design queues M469 «with the shipyard». The
  greenhouse does not eat чернозём: its header forbids «удобрить за 200 кр», so the дачники's voice at the
  counter is the only greenhouse eater for now. The hotel shop stacks on the land's eater (жемчуг in Компания
  land pays about ×2.2 of the heart base there); it is capped at three grains a visit.
- M470: lines beyond r 60 are not built. The net is computed whole and synchronously (146 ms to r 60 on this
  machine); to r 120 it would be about four times that, seconds on a phone. It needs the lazy per-region build
  of the design, and that goes with M474's «infinite» net. «Край» is personal (your own visits), not
  «anyone's»: there is no shared ride record, and online stays a postcard.
- M473: a save mid-ride still wakes at the origin. Waking at the destination means `snapshot()` writing the
  ride's end instead of `G.sx`/`G.sy`, which is the save, and the save is not to be touched. The ticket is lost
  with the ride; it is a few кредитов.
- M474: the net past r 60 stays unbuilt. A lazy per-region build touches the net's shape everywhere (junctions,
  loops, the scheme's bounds), and the whole build to r 60 already costs 146 ms; it stays in the plan. A маршрутка
  drop lands you at the star's edge like a hyperjump arrival, not at a platform.
- M508: the seal halves the raid rather than stopping it. A seal that kept every pirate away would make Ordnung's
  line a free shield for any cargo; a baron still comes. The halving is rounded down, so a lone jackal turns away.
- M510: the line is cut only where both ends of a stretch are on the front. A single front stop is closed and
  passed (M474); cutting at every front stop would sever most lines near a busy front.
- M475: a branch is a straight two-stop line, not a detour of the existing line; a real rerouting would change the
  seeded net that the chronicle and the tests read. Fares, baggage and the size rule are not yet tuned against the
  oracle's rail line: that is a measuring job for the release run, and it stays in the plan.
- M477: the packer still lays things as it always did, not in the three shapes, so an old save's plan and its
  numbers stay exactly as they were; shapes apply from the first move in the КБ. Switching ПРОЕКТЫ is billed by the
  cells it moves, like any other change, rather than by a separate fee. Projects live inside `G.draft[shipId]`
  (`pr`, `cur`), which is already saved, so no new save field was added. The foreign-yard bill is 12 кр per cell,
  a guess for the calibration pass.
- M478: this is the far-goods half only. Fuel from tank cells, energy from reactor cells and sight from
  nose-third instruments would move today's numbers for anyone who has already edited a plan; that needs the
  mapping table and the fixpoint suite in the release run, so it stays in the plan. Densities and welds are kept
  inside `G.draft[shipId]` (`dens`, `weld`); with neither present every factor is exactly 1. The step sizes are
  guesses for the calibration pass. A project switch may move a welded module's cells; the weld's effect stays.
- M479: parts have no wear of their own, and giving them one would be a new save field. So «the rim part takes
  its side's wear» became: the ship's single wear number takes the rear hits (engines), and side armour soaks
  side hits. Guns on a hit side are not affected yet.
- M483: NPC and pirate ships are not yet built by the packer. Their plan would show only in their silhouette,
  which is picture work for the graphics pass, so it stays in the plan.
- M485: the tug's quirk is words only. Its tow is five minutes by the author's word, and its flight is physics,
  so no number moves there. The barge's quirk is rolled per leg from the hired hand's seed and the route cursor,
  both already saved, so the save's barge whitelist is untouched.
- M486: the кулибин is derived from the hand's seed (one in seven), not added to the trait table, so seeded hiring
  and the save stay as they were. There is no free first-hour roll: the block only shows early with a pointer to
  the station repair shop.
- M495: «part failures» are built on the firm instruments, the only firm parts that carry a гарантия; hull
  parts and modules still break only from hits. The old master sits at one Рассвет/Коммуна station in three,
  chosen by the station's seed. His free seam needs tape on the instrument first, so it rewards the cheap road
  rather than replacing the yard.
- M489: the sign changes only the header, the holding announcements, the settlement and the metro. Ether lines,
  the journal and records keep the bare toponym, the way people say a place's name aloud. Names the player gave
  (G.names) are never overwritten.
- M492: parcels live inside the already-saved stapel record (G.stapel.pk, the ticket in G.stapel.q), not in a
  new save field. Only the high-tier part event goes by post; the low-tier one still lands in the hold. If the
  post has six parcels waiting, the part falls back to the hold. The queue does not refresh the window by itself.
  The hull from the stapel now needs a ticket too.
- M460: prices on the billboard stay live station prices. Whether the billboard should show the player's stale
  knowledge (a fork) is left to the author. The hull tint near a billboard and the second and third signs are
  picture work for the graphics pass.
- M455: «the chronicle's days» is read as the chronicle's day of the week plus the Director's declared rites.
  The субботник's rocks near the station are a stand-in drawn with the same dark disc as before, which is draft
  picture work.
- M456: the fine's ticket goes to ВЕЩИ (the desk's papers), because ПОЧТА on the desk holds postcards and has no
  place for official paper. «Two of yours → one better» takes your two best spares of a kind. The new part is one
  tier above the better of the two, capped at 5. Рассвет's «no deadlines» for jobs taken there is not done yet.
- M512: the дачники society waits for M493 (дачники traffic, deferred with the base-side birchpunk). The perks
  that save no money (ДОСО's norm, the tug, tape, readings) count only times on the desk, not кр. A chronicle
  week is seven chronicle days, which is one real week, so the union duty is slow by design.

## 0.479.0 - mail cards and the smena plate on the engine

- **Postcards in the mail and the picture of a «Смена» chapter** are the same card as in the album now: baked
  once and laid into an engine canvas. They look the same and are sharper on DPR 3 screens.
- **Nets**: the album scene of the «0 вызовов 2D» gate also draws a mail card and a chapter picture; a new
  mutant (mail-2d) is killed.

## 0.478.0 - the album on the engine

- **The album draws on the engine** (GPU-3): each card is the same postcard brush, baked once and laid into
  its own engine canvas. The filters ПЛЁНКА, СЕПИЯ, ХОЛОД and НОЧЬ are the same formulas as before, now a
  colour matrix with grain on the video card instead of a pass over every pixel. The cards look the same, and
  the sheet builds six to ten times faster: the lightbox with a filter no longer stalls for a third of a second.
- **СОХРАНИТЬ СЕБЕ** saves the same picture: the card comes from the video card, the album page around it
  (paper, corners, caption) is drawn as before.
- **Nets**: the «0 вызовов 2D» gate has an album scene (sheet, lightbox, all five filters), and the zoo has two
  new mutants (album-2d, album-grain); both are killed.

## 0.477.0 - the shipyard showcase, ОПИСЬ and the suit doll on the engine

- **The shipyard showcase is one engine canvas** (GPU-3): every hull on the ВЕРФЬ tab is the same studio hull
  as in flight, drawn into one canvas over the list. Before, each card baked its own small 2D picture. The
  hulls are sharper on DPR 2 and 3 and keep their places while the list scrolls.
- **ОПИСЬ pictures on the GPU**: the hold piles, the kit laid out, the hatch, the matchbox, the cosmetics box
  and the ship plan keep their brushes and are baked at screen density. They were 1× canvases and looked
  soft. The layout does not move: a dense canvas once pushed the card grid twice as wide, so the canvas now
  keeps its logical size for the layout.
- **The suit doll too**: the body keeps its brush and is baked once per kit and visor tone; the dark outline
  is the same bake filled with ink. It is sharp on DPR 2 and 3, and its outline is cleaner.
- **«NaN / 40» over the hold** came from a test scene that left the hold with missing resource keys (a save
  always fills them). The hold weight now counts a missing key as zero, and the scene keeps every key.
- **The ВЕРФЬ tab opens without a hitch**: the slipway sheet's glow pipeline is warmed with the others at the
  title screen, instead of being compiled the first time the tab opens.
- **Nets**: the «0 вызовов 2D» gate has scenes for the showcase, ОПИСЬ and the doll. A new guard reads every
  ОПИСЬ tab, with the hold empty and full, for «NaN» and «undefined». The zoo has four new mutants for them
  (yard-2d, opis-2d, doll-2d, opis-nan); all are killed.

## 0.476.0 - the stapel, the home room and the maker's eye on the engine

- **The stapel draws on the engine** (GPU-f): the sheet is one webgpu canvas, the hull and the sheet are two GPU
  bakes of the same brushes, made once per sheet by the frame while the station is open. The stapel measures the
  hull without the running-light halos (стапель меряет корпус без ореолов огней): the box is the body itself, read
  from the engine's own vertices, so the hull on the sheet comes out 2–3 % larger and the metre labels read the
  body — against the bake itself the worst of 84 hulls is 0.42 % of length.
- **Dragging a stapel slider shows a draft**: while the thumb moves, the sheet is an ink drawing drawn in the frame —
  the clean sheet, rails at the hull's width, a dash-dot axis, the hull in thin ink along its own brushes with body
  and wings in a bold line, and dimension lines whose metres change live. On release one full sheet is baked on the
  same canvas, same frame and scale, and fades in over the draft in 120 ms; nothing in the layout jumps. At CPU ×4
  the drag holds p95 25–31 ms with no sheet baked until release.
- **The home room is baked by the engine**, the garage ship by the body brushes; the tap zones come from the bake
  itself, byte-identical to before.
- **A left ship's trace (12as) has no 2D fallback**: no scene pass means no ghost, instead of a second picture.
- **The maker's eye looks at the engine's picture**: the gate that checks each maker's hulls read as its own now
  sees them lit by the studio, as ОПИСЬ shows them (14 per class 91.1 → 91.7 %; ГЛАВТРАССА 86.7 → 84.8 %), and runs
  twice as fast. If that gate falls, the maker's look is fixed, not the studio light.
- **The overlay layer grows two tools**: `ovImage` takes a colour matrix and seeded grain (sepia, cold and night
  as the album computes them), and `ovPaint`/`ovRead` put one overlay pass into a canvas — in the frame or out
  of it — and read it back in the same task.

## 0.475.0 - the nebula glides in flight

- **The nebula no longer steps while you fly** (GPU-2; the author 26.09: «кажется как будто тормозит, когда туманность
  начинает появляться рядом с кораблём»). The frames were clean — the gas was not: its volume was regenerated only after
  the camera had moved 5.6 CSS px, so between 80 and 333 px/s of screen speed it held for 2–5 frames and then jumped
  (a whole device pixel every 5th frame at 80 px/s; 1.6 px every 3rd–5th frame zoomed out) while the stars and the ship
  glided at 60. Now it is regenerated every frame whenever the camera moves faster than 20 px/s — the same cost fast
  flight always paid — and a still camera keeps its once-in-six cross-fade; setting off in the middle of that fade
  finishes it over three frames instead of cutting it. Guarded by the suite `91zzzzzzy7-gpu-nebmove` (40–400 px/s at
  zoom 1 and .3) and the mutant `neb-step-move`. On the author's phone, cold, full battery, no heat: the 30-s gate and the
  four routes (hotel and star, zoom 1 and .3) — 100 % of frames ≤ 18 ms, max 16.8–16.9 ms, none ≥ 33 (0.473.0 had
  one ≥ 33 on two of them). The goldens' order leak surfaced by the new suite's shard shift is closed by the
  worker's e4532f66 (resetWorld drops pending prebakes), carried here.

## 0.474.0 - the parrot, the seat and the desk on the engine

- **The parrot flies on the GPU** (GPU-3): its window and its perch icon draw from one atlas baked once, and a
  pose is a handful of instances. It no longer runs its own animation loop beside the game, and its pipelines
  are warmed at the title screen, so the first flight has no hitch.
- **The perch icon shows the whole bird**: in a bow, with the crest up or in a roll the parrot went past
  the icon's edge and was cut off; now such a pose shrinks a little and stays centred.
- **The console seat is a portrait, not a repaint**: Vega, a trainee or a passenger is baked once for each
  mood and shown until that mood changes. Before, it was redrawn once a second for the whole trip. It is
  sharp on a DPR 2 screen now; the old 56 px image was soft.
- **The desk draws on the GPU**: the boards, the desk-top items, the strips, the mis figure and the thing
  icons keep their brushes and are baked once when the desk opens. Thing icons are at screen density now,
  so they no longer blur on the desk.
- **The post window and the КБ plan too**: the post window is sharp on DPR 2. «ЗАКРЫТО» now hangs as a
  plate on the grille; on the shutter the bars used to cut through the word.
- **Nets**:
  - The «0 вызовов 2D» gate sees the world canvas again (the 08c hook had hidden its calls). It has scenes
    for the seat, the desk, and the post window with КБ.
  - The overlay atlas is guarded: a steady frame of any scene bakes no new glyph rows.
  - Five zoo mutants are anchored to today's code again, and each is killed.

## 0.473.0 - the ship in ОПИСЬ on the engine

- **ОПИСЬ shows your ship the way it flies** (the worker): the hull on the table is drawn by the same GPU
  hull as in flight, in a studio light from the upper left — its edge catches the light, the canopy glints,
  the lamps glow — instead of the flat 2D drawing. Slots, their colours and taps are exactly where they were.
- **One studio for every hull on display**: the same function will draw the ship in the station showroom,
  at home and on the road as they move off the old 2D bake.

## 0.472.0 - a nebula that stops pulsing

- **Standing still, the nebula flows instead of stepping** (GPU-2): the gas was rebuilt every third
  frame and jumped a little each time; now it is rebuilt every sixth frame into a spare texture and
  the old picture blends into the new one over those six frames. The frame-to-frame step of the gas
  fell from 0.05 to 0.017 px with no pulse, and on the S23 the rebuild costs 0.93 ms a frame instead
  of 1.81. In flight nothing changed yet.
- **The GPU probe has 64 timestamp slots** (GPU-2): on the phone 32 ran out before the nebula's
  blend pass, so it went unmeasured.

## 0.471.0 - ships in the system's light

- **Ships are lit by the star, not painted light** (the worker; hull mode on the GPU canvas): every face keeps
  its paint and stays even; the star shows on the edges — a one-pixel rim toward it, a darker silhouette edge
  away from it — and bare metal glints only on that rim, so nothing blinks as a ship turns.
- **A planet's shadow is dark**: in full shadow a hull loses the star entirely and keeps only the dim fill,
  its windows and its flame — about a quarter of its lit brightness, where it used to be two fifths.
- **Gas tints the shade**: the fill takes the colour of the cloud a ship flies in — warm in orange gas,
  cold in blue — one tone per hull, no pattern. Silhouettes are exactly as before.

## 0.470.0 - «Дружба» gets its own building, a quiet strip chart, full hotel names

- **Турбаза «Дружба» stands in its own body** (the designer; GPU-3 merged it after a pair): Рассвет's
  hotel is a concrete drum of three loggia floors on three legs grown into an asteroid, with a restaurant
  ring, a beacon hub and people by the door, instead of a borrowed Космос with its sign. Its rooms light
  by the hour like the others': at three in the morning one window in fifty.
- **The turbaza's sign is paint, not neon** (GPU-3): red letters on a cream board, lit from above by the
  bulb string with a warm fall-off, so the word reads dark on light at any hour. Neon stays ГЛАВТРАССА's.
- **Hotel names are whole in the HUD and the journal** (GPU-3): «ГОСТИНИЦА «КОСМОС»», not the sign's
  «ГОС ИНИЦА». The dead letter lives only in the neon.
- **The strip chart under the gauges is dark paper** (GPU-3): the pod's strip was a light-grey slab, the
  brightest dead patch at the top of the frame; now the paper sits in the panel's tone and only the pen
  traces are bright. The belt cockpit keeps its light paper under the lamp.
- **Phone gate tools in the repo** (GPU-3): `docs/phone/` measures a local copy on a real phone; each
  session takes its own port. The 0.468.0 gate on the S23, cold: 30 s at 100 % of frames on time, five
  minutes at 99.98 %, no frame of 50 ms.

## 0.469.0 - a star with a real edge, gas giants with jets, dust without beads

- **The star's disc darkens toward its edge** (GPU-2): an ordinary star's limb goes red instead of
  ending in a bright ring, the corona sits behind the disc, and the disc is the brightest thing in the
  sky. A hot star stays white-blue to the edge instead of reading as a grey bubble.
- **The corona is cut only up close** (GPU-2): from afar a giant star keeps its halo, as before.
- **Gas giants get thin jets along the flow** (GPU-2): streaks follow the curls around the storms and
  carry the neighbouring band's colour; they fade out from afar, so nothing ripples.
- **No scan lines on a ring seen edge-on** (GPU-2): the ring's front arc over the planet is smoothed
  across a pixel instead of breaking into rows.
- **Dust pillars have blunt heads and no beads** (GPU-2): thin crests no longer sparkle with a bright
  rim, gas-less globules stop glowing, and a dim warm light reaches in from the rim.

## 0.468.0 - the instrument pod no longer eats video memory, lighter frames

- **The instrument pod stops taking 6.6 MB of video memory for good** (GPU-3): since 0.466.0 its first
  frame claimed a new slot in the bake pool that stayed there; the pod's face is now baked once, like
  the rack's, and the warmed-up pool stays as it was.
- **Frames make less garbage** (GPU-3): pictures drawn on the GPU no longer rebuild their bindings when
  the texture changes (8 a frame in a system, now none), and the per-call arrays are gone (30 a frame, now 4).
  The picture is the same to the pixel.
- **Tests**: a fresh page in the map scene lays the whole rail net before the shot, and the hail and
  fuel windows close between suites - the phone run in four parts is green again.

## 0.467.0 - ships in a planet's shadow, hulls of real material

- **A planet shades ships** (GPU-1): fly behind a planet and your ship and everyone near it go dark,
  with a soft edge where the shadow begins. A planet just off the screen still casts its shadow in.
- **Hulls are baked with a material once** (GPU-1): panel seams and plates catch the star's edge instead
  of only the outline, and cockpit glass glints. Lamps are told from paint by being brighter than the
  hull around them, so red trim no longer glows while windows and nav lights do. Pirates, barges, the
  wanderer's sail-ship and the station get the same material; barge containers stop shining like lamps
  in the dark. The video card now does 5 lookups a pixel for this instead of 20.
- **No hitch when a bright building comes into view** (GPU-1): the hotel, neon signs and the belt's
  labels are now baked one piece per frame.

## 0.466.0 - the pirate base as a building, sparks without a rainbow, the last 2D layer gone

- **The pirate base is a building now** (GPU-2): instead of a red pentagon mark it is a low five-sided
  hall of dark metal with a pyramid roof, a mast and four docking trusses with pods. Each face catches the
  star on its own, so the facets stay apart even in shadow. Red is kept for the lights: corner beacons,
  a thin stripe under the eaves, the pod lamps. The windows are scattered, some dark. The name below it
  is red again, only quieter.
- **Explosion sparks fly unevenly** (GPU-2): a few long heavy streaks at their own angles and many short
  ones, instead of an even star. Each streak thins and fades toward its tail like a small comet. The
  cyan-and-crimson fringe that thin sparks got from the shock wave is gone.
- **The last 2D interface layer is gone** (GPU-3): the thumb sticks and the «НАБЛЮДЕНИЕ» watch line are
  drawn by the video card. The watch line now sits above the pads and the console; before, the round
  «Цель» pad covered its end on the phone. On the phone this frees about 12 MB of video memory.
- **The instrument pod is drawn by the video card** (GPU-3): the gauges and the paper tape in the
  instrument row go out with the frame instead of as a separate 2D canvas. The pod is still redrawn only
  when a needle or the tape moves, and never while a screen is open.

## 0.465.0 - the pirate base is back, hulls stop glowing from their paint

- **The pirate base is visible again** (GPU-2): on 0.464.0 it was still drawn in 2D under the video card's
  frame and could not be seen at all. It is drawn in the scene now, with a thread of star colour on the
  edges that face the star and its name on the label layer; the flight gate has a «пиратская база» scene.
- **The other ships are lit by the star** (GPU-2): a fleet ship that fades (the lane rush, docking) stays
  the same lit ship instead of dropping to a flat picture; «Сорока»'s hull is one baked, lit body instead of
  about 150 flat shapes, its gondola lamp on top.
- **Hulls no longer glow from their paint.** The glow around stations, barges, pirates, fleet ships and
  the hotel's facade came from their grey and white paint, a milky haze over the metal; now only what is
  lit glows — lamps, windows, the sign, the flame. Your own ship keeps half, as before. A station reads
  about 9 % darker and crisper, the hotel's towers lose their pink haze.
- **Drone captions** are drawn on the label layer: in a system with drones the old 2D captions made the
  frame upload a whole layer every frame.

## 0.464.0 - the rack and the belt cockpit on the video card, wrecks as hulls

- **The instrument rack and «Глобус» are drawn by the video card** (GPU-3): the still parts are one bake,
  the needles, carriages, pens and glyphs a queue on the interface layer — 2D on the HUD canvas went from
  1887 calls a frame to 0. The bake is split into parts over the opening frames: the worst first-open
  frame is 12.5–18.8 ms at 760 and 18.2–19.3 ms on a 390 phone (was 48 / 56.5 ms); opening it again bakes
  nothing (4 ms). On the phone every channel keeps its number next to the dot.
- **The belt cockpit and its glass are drawn by the video card** (GPU-3): frame, panel, tape and glass HUD
  are baked in four bands by the oven, one step a frame, and fade in over 10 frames; the live parts are
  interface-layer primitives. The belt sky no longer compiles on the entry frame (key 43 in the warm
  table): the worst entry frame is 20.6 ms at 760 and 17.8–18.4 ms at 390 (was 26.5 / 25.7 ms), and under
  load 24–26 ms instead of 55–75.
- **A wreck after a battle is the ship that died**, not a dark disc: its own broken hull, charred darker
  than a live ship, two torn breaches whose rims smoulder, a thin haze of smoke, lit by the star and slowly
  tumbling. The «КОРПУС» label became an edge chip for the nearest wreck off screen; a tap sends the
  autopilot there.
- **Edge chips no longer jump.** A visible chip never moves faster than its glide speed: chips are laid
  and nudged in a fixed order, a chip that changed edges glides after its slot, and a chip that has to
  hop past a neighbour fades out and back in instead of teleporting.

## 0.463.0 - the billboard and the Cheburek stall leave 2D

- **The billboard and «Чебуречная» are drawn by the video card** (GPU-3): the ПЛАН panel, its running line
  and the stall's boat, light and sign are GPU bakes, made ahead while they are still off screen — flying
  past the billboard creates 3 textures in the frame instead of 19–22, none of them its own. The picture is
  the same (at most 13/255, 2 pixels over 8).
- **A station never loses its body.** Its master is baked one layer per frame; if the text atlas was reset
  in between, the next layer bound a destroyed page and came out transparent. The body is now recorded
  again when the atlas changes.
- **Less work for a planet with cities.** The city lights looked for their latitude windows every frame (up
  to 63 000 tests); the windows are now kept until the light moves on or the star side changes.
- **A frame-sized texture nobody wrote is gone** (the old interface target): 2.6 MB less video memory on a
  phone, 32 MB at 4K.

## 0.462.0 - the WebGPU line meets the phone speed-up

- **0.461.0 merged into the WebGPU line** (`gpu`): orbits as a band and fields reading `fu.v[k]` in place
  come together with the pipeline funnel (`08b0`) — every lazily created pipeline goes through
  `gpuPipeline(key, recipe)`, and `gpuInit` warms the key table behind the title with
  `createRenderPipelineAsync`; the start buttons wait for it at most 2.5 s. The station/pirate light's
  unsharp mask (flag 2/4 in `17c`) keeps its 25.09 form, rewritten to `fu.v[3]`.
- **Flight HUD redrawn** (`gpu-hud`): sentence case, one warm accent, fuel and hull set large; the rail
  buttons and prompts no longer touch.
- **Pipelines are ready before the first flight.** A detector flies every scene that used to compile a
  pipeline mid-flight (hotel, billboard, fleet, pirates, dock, the wall at the system's edge, the shield at
  x1.5, a real first flight with pirates and allies) and fills the warm table `08b1` (40 keys). After load
  no pipeline is created lazily.
- **No hitch at the hotel.** The texture pool keeps its 1024² bake set, allocated and cleared behind the
  title; big prebakes go one per frame under a GPU budget (`PB_PX`); the 512×128 shadow set is warm too.
  On the S23 with a cold shader cache (DPR 1.5, 30 s of flight) 99.94 % of frames fit 16.7 ms and none
  reaches 50 ms; before, the approach made one 67 ms frame.
- **A failing frame no longer takes the video card down.** An exception while the world is drawn drops that
  frame and goes to the frame guard («СБОЙ · …»); only a lost device or an API error drops the device, and
  the art caches (hulls, fleet, pirates, barges, lit sprites) are baked again on the new one. If the card
  stops answering mid-game, the notice says so and that the save is intact, instead of blaming the
  browser. The warm-up gate is armed from load, so a start pressed before the device exists waits too.
- **Video memory stays flat over a long game.** Art caches have caps (fleet 24, pirates 24, barges 12,
  hulls 8, bakes 32; a system holds at most 7, 3, 1 and 1). A bake dropped while still in use is baked
  again where it is drawn.
- **The searchlight is a field**, not a 1000-px multisampled bake; the picture is the same (6/255 at most).
- **iPhone: reversed `smoothstep`.** Eleven calls had their edges the wrong way round, which WGSL leaves
  undefined and Metal draws wrong; they read `1.-smoothstep(b,a,x)` now, and a Node test scans the game
  for new ones.
- **Watching a crewmate is drawn by the video card**: the view makes no 2D calls; your ship's barrels and
  launcher are GPU bakes, text widths come from `gcMeasure`.
- **The ground has its grain again on the landing and the surface.** Since the planets moved to the video
  card only the system view stepped the ground material, so after landing the tile stayed at its first row.
  The material now bakes itself a portion per frame wherever it is used; the planet frame makes no 2D calls.
- README and the site name the WebGPU requirement and the browsers; the key list on the mechanics page
  says Space for the action and G for a missile.

## 0.461.0 - `under` on the phone: 3.3 → 2.2 ms, the picture the same

- **Orbits as a band along the ellipse** (`17g`): each orbit was a bounding quad with `atan2` and the ellipse
  distance per pixel — 1.2 ms on the S23 for lines a few pixels wide. Now the vertex shader lays a band of
  160 segments along the ellipse (width = line + glow + 4 px) and the fragment does the same maths only where
  the line is: 1.2 → 0.02 ms, pair `system` max|d| 0.
- **No copy of the constants array in the field shaders** (`17g`, `16ga`, `16gb`, `17`, `17c`, `17c2`, `19ca`):
  `let V=fu.v;` materialised the whole `array<vec4f,15>` uniform (60 floats) per fragment, and on Adreno that
  costs ~1 ms of a full-screen field — the star's field with `star()` returning 0 still took 1.27 ms; without
  the copy 0.32. Every field now reads `fu.v[k]` in place. S23, DPR 1.5, `?g11=deep`: star 2.25 → 1.57 ms,
  nebComp 1.29 → 1.17, world 0.68 → 0.62, frame 9.1 → 8.55 ms; pairs `system`/`surface`/`night`
  max|d| 0/1/2 of 255.
- **The star's frame constants on the CPU** (`17g`, `gsyStar` → `fu.v[9..11]`): breath, streamer phases,
  corona rotation, flare strength and cycle, ray lengths — no per-pixel `sin`/`fract` for values that do not
  vary across the frame; `pow(x,2.)` → `x*x`; the flare block skipped while it is dark. Look-preserving
  (pair max|d| 2); on its own within the phone's noise (2.34 → 2.25 ms), kept as hygiene.
- **The probe splits `under`** (`17g`, `28z`): `orbits`, `belt`, `star` are separate segments in `?g11=deep`;
  `GSY.v = 1..5` strips the star's blocks one by one (corona → prominences → flare/halo/rays → photosphere →
  all) for attribution on a device. Measured: corona ≈0.65 ms, flare/halo/rays ≈0.22, photosphere ≈0.14.
- **Tried and reverted**: the corona's noise on the nebula's baked tile — 2.41 → 2.34 ms, inside the noise,
  and it changed the noise pattern; the cost was never the hash.

## 0.460.0 - the ladder's sum in one pass; the phone measured

- **The bloom's upper levels summed in one pass** (`08b`): 0.459.0 made the final read five mip levels at full
  resolution, and the S23 answered with +0.34 ms on the final, while the ten tiny ladder passes it had replaced
  had cost 0.12 ms together — a pass on Adreno 7xx is cheap, full-frame taps are not. Now one pass at ⅛
  resolution sums levels 1..n (`fsMipUp1` → `bloomU`, 0.02 ms) and the final reads two taps. Post passes a
  frame: 12 → 8 (laptop) / 7 (phone); the frame on the S23 at DPR 1.5: 9.8 → 9.6 ms (`?g11=deep`, A/B/A);
  the pair unchanged (max|d| 3 of 255, laptop and S23 emulation).
- **`shader-f16` measured and left off** (research P2): with the feature requested every pass on the S23 ran
  ~6 % slower (nebula 2.43 → 2.63 ms, `under` 3.30 → 3.50) and the ladder itself gained nothing — it is bound
  by texture taps, not ALU. The ladder's functions stay written over `H`/`H3` aliases that compile to f32;
  `?f16=1` requests the feature for a re-measure on another device.
- **The probe names the video card** (`28z`, `docs/shot.py`): `?g11=deep` and `shot.py` report `adapter.info`
  (`qualcomm/adreno-7xx`, `amd/gcn-5`) with the f16 and transient flags; the 3D pass's depth is a transient
  attachment where Chrome knows the flag (it never leaves the tile).
- **Measuring rule learned**: a pair is only a pair when the two frames are shot one after the other and at
  the same geometry — a second headless Chrome beside the first moves the stepped clock, and 412×892 is not
  390×844. The phone's per-pass numbers drift ±5 % between runs; A/B/A or nothing.

## 0.459.0 - the bloom ladder in six passes

- **Bloom without the up-passes** (`08b`, research P1): the ladder is one rgba16f texture with mip levels
  (¼ res down to 6 texels: five levels on a phone, six on a laptop); each level is a 5-tap Kawase of the one
  above, and the final pass sums the levels itself with the old tent weights and the old warmth per level.
  The five `fsMipUp` passes and the dead `blurH`/`blurV` pipelines are gone: 12 post passes a frame → 7
  (laptop) / 6 (phone). The pair on `system` is unchanged (max|d| 2 of 255); with bloom switched off the same
  frame differs by 70 on a fifth of the pixels, so the pair does see the bloom.

## 0.458.0 - the whole world on the video card

- **Everything in flight on the GPU** (`08b`, `08bh`, `16ga`, `17l`, `03e`): hulls, the fleet, the lane,
  finds and buoys, stations, the hotel and the Cheburek are drawn by the video card from masters baked
  once; outside a fight the 2D layer over the sky stays empty. Lamps, windows and the neon sign glow by their own
  light, not by their paint; the hotel's windows light up and go dark without re-uploading the house.
- **The interface on its own layer** (`08bh`): the instruments and the rack sit on a sharp layer at the
  screen's own density, redrawn only when a number changes; world labels and edge chips are small DOM
  pieces on whole device pixels, as crisp as before.
- **Planets close up** (G3b): a living gas giant, a terminator with a wedge step, and cities - each
  holding light is a city of its own. A planet's shadow in the gas is a cone, at most half dark; the shock
  ring and the haze bend the backdrop, never a hull.
- **The phone first** (P1): the density cap reads the window's short side (1.5 on a phone), the nebula's
  fine detail reads a baked noise tile, clear sky skips the fine pass, the dust dims the stars in their own
  shader; the stick's band no longer covers the course.
- **The wake** cools to the old 2D brightness at the stern; the player's hull and flame are back to their
  colour.
- **Fights on the GPU too** (`13`, `12i`, `16b`, `15b`, `13d`, `12as`): the pirates' live layer, hp bars, lock brackets, missile
  bodies and loot are in the scene pass; after a fight the NPC wrecks and what was left (a hull trace, a
  marker with its caption) stay there as well - the 2D layer is empty in battle and after it.
- **The rest of flight** (`17c`, `17m`, `12al2`, `12l`, `16c`, `12v`, `18f`; a scripted tour counted every 2D
  paint in flight and each was moved): belt rocks as lit facets; the peace fleets with their flag, star and
  captions; Орднунг's law ring; trade barges lit by the star; the rescue tow with its rope and a flame of the
  brush's teardrop shape; «Сорока» - the gold foil sails computed per pixel, sharp at every zoom; the rail
  ring with its lamps and spiral. Captions ride the label layer. Belt mode itself is next.
- **ГЛАВТРАССА ships' captions** (`12ai`): the name, number and line under a fleet ship ride the label layer
  too - the tour never met a fleet ship, and its caption was the last text written on the 2D layer in flight.
- **Hired hands drawn on the GPU** (`12a`): an ally's hull went through the 2D layer and its light was copied off the screen mid-pass - every ally in view cost a copy of the whole frame, two more submits, and could turn the frame black. Now allies are drawn like your own ship: lit towards the star, sharper, one submit per frame.

## 0.457.0 - the world on the video card

- **WebGPU** (`08b`, `08c`, `16ga`, `16gb`, `17ga`): the sky is drawn on the video card - the nebula
  and its dust live and drift, light is HDR with a soft bloom, hulls catch the star on their rims,
  exhaust and bursts are particles, and the star itself is alive. Needs a browser with WebGPU; without
  one the game says so plainly instead of drawing a world.

## 0.456.0 - the design pass, closed

- **Slipway** (`26e1`, `26e2`, M481): the order lies on a slipway sheet - concrete slabs in the
  maker's ground, rails on sleepers, raked timber shores, a gantry crane, two hard-hats for scale,
  white-ink dimensions measured from the hull's pixels, the power's emblem. In work the hull is
  plated from the stern by the share of the shift, the rest a red-lead frame with a weld spark;
  ready - a red «ГОТОВ» stamp, and collecting throws one across the screen. The sliders are
  boxwood scales; the numbers are a strip of differences against the ship you fly.
- **Ordered hulls** (`03e`, M480): each yard leaves its mark - «ПЛАН — ЗАКОН» on the flank, the
  Company's ad strip, Орднунг nose armour, the Commune's painted curve, Рассвет's welded extra
  plate, Хай-Фронт's firmware dome.
- **Орднунг** (`12al2`, M456): the speed ring that fines you is drawn - a dashed ring at 600 with
  eight numbered «4.5» signs; the nearest lights while you speed.
- **Drones** (`12e`, M485): a plate in both lists - a state lamp, the name stencilled in the cargo
  colour, the board number, the quirk pencilled on a paper tag.
- **Rented core** (`12f1`, `27c`): its adverts are glossy Хай-Фронт inserts in the manager's feed.
- **Billboard** (`17k`, M503): the ГЛАВТРАССА plan is a kumach decree with a gold star; its two
  lines stand while the adverts run.
- **Album** (`25g1`): the filters show themselves as thumbnails (one repaint and five small pixel
  passes); СОХРАНИТЬ СЕБЕ saves an album page - the card on four mounts, the caption in white pencil.
- **Belt** (`06e`, `24`): the entry reading is an instrument plate - each deposit a scale, its range
  a lit band as wide as the instrument is coarse.
- **Railway** (`18e`, `18g`, M510): lines gain weight as the map comes close; in the ride the other
  lines stay pale and your own is a rail; the compensation minibus is a cream ПАЗик on a dashed road.
- **Чебуречная** (`17j`, M462): a kiosk afloat - rust rim, a patched plate, steam, a garland, a
  hand-painted sign on strings; its window used to blink and now breathes.
- **Rush** (`17g`, M504): after a vein the approach fills - a file of prospectors from the entry and
  a second, wider waiting ring.
- **Membership cards** (`12al4`, `27i`, M512): embossed covers per society; the Партнёрская
  программа™ is glossy plastic with a magnetic stripe.
- **«Смена»** (`12ud`, P15): a chapter reads as a book - its header, the folio, leafing through the
  open chapters.
- **Weather** (`19d`): precipitation falls in four depth planes, each with its own parallax, one path
  per plane - up to 8 strokes a frame instead of ~160.
- **Plants** (`20-life`): gusts travel across the field along the wind; the plants they pass bend,
  and their own sway quiets as the wind rises.
- **Fix** (`17g`): the approach lane - buoys, queue, billboard, hotel, the Чебуречная - stayed where
  the station was first seen and drifted about 60 units a minute off its orbiting dock; it now
  follows the station.
- **Perf** (`18c`, `19e`): tiles draw only their occupied rows, and additive cloud glow below
  0.002 is skipped - pixel-identical.

## 0.455.0 - the khrushchevka, one flag, and a lighter frame

- **Hotel** (`17l`): a five-storey khrushchevka in three-quarter view - panel seams, a hip slate
  roof with brick chimneys and wire-strung aerials, glazed balconies each in its own colour,
  curtains, «ПРОДАЮ», entrances with benches. Windows follow the hour of the world-day, each
  with its own threshold, and one changes its mind every few seconds. Baked once per window
  mask - one drawImage a frame.
- **Commune** (`17m`): the line of four ferries is one red flag on a mast that waves; on a
  strike day it hangs.
- **Perf** (measured on an AMD iGPU at x2, GPU-process ms per frame, 30.6 -> 34.9 fps):
  wake and trail stroke per shared bucket instead of per lane; bloom is blurred on its quarter
  canvas (same picture within 8/255); the main canvas is opaque; the film grain is not laid on
  black-sky scenes, where it changed 0.1% of subpixels by 1/255.

## 0.454.0 - air around the lane

- **Fix** (`17g`, `17l`, `17k`, `17m`): the hotel stood on a fixed side of the lane while the holding
  queue picked its side by seed - on half the systems the two, the billboard and the parked fleet
  piled into one heap (the author's screenshot, 19.09). Now the queue keeps its side at 300 from the
  axis with the parked fleet behind it at 560; the hotel (280) and the billboard (200, further down
  the lane) always stand on the other side.
- **Fix** (`28-loop`): the flat-60 schedule reset itself when the clock stepped back (stands and the
  test motor drive frames with their own time) - the shot stand drew a black world on 0.453.0.

## 0.453.0 - a flat 60, and the lane that stopped shouting from afar

- **Fix** (`28-loop`): the frame cap estimated the display period from the *shortest* recent
  interval; under a saturated GPU a late frame is followed by a catch-up 6-9 ms later, the estimate
  slid to 120 Hz and the game skipped every other vsync itself - locked 30 fps in stretches on the
  phone and the desktop (simulated: 5% late frames -> 23 of 60). Now a flat 60 by schedule (author:
  «принудительно просто 60»): a frame goes when its slot is due (4 ms slack), the grid is not moved
  by a late frame, 120 Hz tact is off.
- **Fix** (`17k`, `17l`, `17g`): at far zoom the billboard is an unlettered plate and the hotel name
  is gone (letters fade in towards x0.5); the hotel and the lane queue shrink with the world instead
  of stacking at a size floor.

## 0.452.0 - the radio: pieces with form, a generator that assembles them, silence in a hidden tab

- **Radio** (`10a-radio`, settings ЗВУК → «Что играет»): a second voice beside the ambient layers of
  `10-music` — pieces with a form (intro, theme, counter-line, bridge, return), dial tuning between
  them. Twenty named tracks on ten dark archetypes (Zodiac, Berlin school, Solaris, Stalker, Through
  Thorns, music box, Jarre, waltz, Letters from a Dead Man, Siberiade); the first six take key, tempo
  and bar chords from the author's Suno references, «Безмолвная орбита» its melody contour from 1:00.
  The generator is the default: each piece assembled from parts — pad, soloist, drums or none, two
  bass figures, figuration, melody manner and contour, a random chord walk, a random form, mood drift
  at section boundaries (tempo, minor mode, key), a pivot chord (dominant sus4-7 of the new key)
  before every key change. Slow (32–45 bpm), minor only, one long bass note per three bars, chord held
  as long as the bass, every voice's tail cut to the chord change or the note rests. Beacon (a muffled
  buoy ping with fading echoes, on the bar's chord), bells, overtone clouds on the chord root (partials
  2 3 4 6 8 9 12 16 19 24 only — the ones that sit in a minor scale). Danger tilts to phrygian with
  timpani, the cantina to dorian with brushes; the map and the ground drop the drums. Music defaults
  to 20 %. Audited in the page: every oscillator pitch on the scale.
- **Fix** (`09-audio`): a hidden tab is silent — the context suspends on `visibilitychange` and resumes
  when shown; a second tab used to keep six layers playing over the live game at half a core.
- **Save**: `G.opts.audio.src` (`gen`/`tracks`/`ambient`), `track`, `genN` with defaults in `applySave`.

## 0.451.0 - red suites closed, the phone stick and the signs that shrank

- **Fix** (`16c-abil`): the special system's cooldown lived in `G.t` across a new game, so the ability
  started on cooldown and ФОРСАЖ fired only in the first run (`abilStale()`).
- **Fix** (`15a`/`15b`, `17-mode-system`): the touch stick is born in the frame, not in the event;
  compass chips grow to the 44 px touch size before placement, not after; the prompt lift no longer
  flips 0↔91 px every other frame (a per-frame style write under the finger).
- **Fix** (`17k-billboard`, `17l-hotel`): the lane billboard and the hotel sign follow the UI ruler
  (`UIK`) and stop shrinking below it — on a 2560 px screen they read at 7 px.
- **Fix** (`18-mode-map`): «останется N» under the jump price gets its own backing plate; its
  contrast was decided by the galaxy behind it.
- **Tests**: helm suite reads `HELM_DEAD`; the stagnation law honours the driver's mute table; the
  parallax law skips blocks the drag uncovered (on a phone that was 40% of the frame); the zoom law
  accepts the ship as the zoom centre; `resetWorld` clears the rail network and ride state (the
  system golden depended on suite order); the `instr-lies` mutant retargeted.

## 0.450.1 - a plan that could go negative

- **Fix** (`17k1-gosplan`, `18i-rail-life`): the plan quantity and the fellow passenger's line took a
  signed shift of an unsigned hash; for hashes above 2^31 the plan came out negative (the deploy of
  0.450.0 failed on the Linux runner, whose clock put the station in such a bucket). Both shifts are
  unsigned now.

## 0.450.0 - the design pass on the S23, and stage 7 of the base

- **The design queue D1–D26, walked on the author's S23 over Wi-Fi** (Control, 18.09). A sustaining
  plume under the finger (`helm.idle` — the engine fired only while accelerating, 135 frames of 266),
  the wake kept out of the HUD, star rays feathered in three wedges, the nav row fading instead of a
  flat cut, the ready pad breathing red under a risk hail and green under a safe one, the ability
  name over the pad only in the system, the lane buoy as an instrument (belt, reflector, mast with
  a radar cross, caged lamp), map glyphs shrinking with the cell so the galaxy shows at ×5,
  «Долгий рукав» / «Рыжий рукав» lettered along the arms and ten nebulae named in the cabin's voice
  («Печка», «Молоко», «Синяя вдова», «Гнилой угол»…) with the place in the system card, the ten far
  goods as their own objects in ТРЮМ, the six giants baked with human-scale detail and lit from the
  star, the blueprint as a синька (Prussian blue, mm grid, ochre stamps with kind letters),
  black glossy tape, the station's ground colour by builder down to the panels and containers,
  scars and the transit plate on the hull, the peace fleet's ad ferry with a screen and Хай-Фронт
  camera drones, the system edge as a teal band the ship leans on. Paper: album page with corner
  mounts, rent card, bordeaux passport, Космопочта notice paper, six vestibule finishes by owner,
  rail-life rows as a paper tag, a punched card and a phosphor silhouette; the carriage shows only
  ВЫЙТИ.
- **M497 Баня and чайный гриб** (`21ac1-base-banya`): a bath night every six shifts takes water
  and gives spirit, the base manager's flaw sleeps twelve shifts after it, the ПАЛАТА inspector finds
  one item fewer; the greenhouse culture overgrows (food ×2 for three shifts, then it eats organics)
  until an аврал cuts it into «Чайный гриб», which Рассвет buys ×1.5. The parlour is drawn.
- **M496 Ферма** (`21ac2-base-farm`): a stunned beast is taken alive when an empty farm waits,
  moves in with a name and the ПАЛАТА клеймо, and gives its world's good only while someone talks
  to it; a broken farm never loses it. The pen with the real beast, the name board and the plate.
- **M511 Волокита** (`12al5-vol`): animals aboard ride the rail and cross borders only with papers —
  N documents rolled 2–10 and never told; the pile on the КНИЖКА desk as paper sheets, a different
  office per document, Орднунг in three copies, Коммуна at lunch, jam that changes nothing, the last
  official signing without reading and the only one with a name.
- **M498 «Буханка»** (`21ac3-base-van`): the base's named van with one quirk for ever, drawn at the
  pad and on the plateau, renamed from the table at the station desk; blockade pickets now hail and
  are outrun at two thirds of full speed, alloys sell ×2 in a blockade.
- **Rail**: transfers through a junction with one fare and a 3 s stop where the train changes line,
  the scheme unfolded on paper from the vestibule (`18k-rail-scheme`), the hyper flash at departure,
  stops and exit, the dispatcher's voice reading the stops (`18g`).
- **Smaller design**: the tower mount reads as a turret (barbette, dome, mantlet), the Орднунг seal
  on the hull, a подстаканник at the tea buffet, the recall letter and the subscription letter in
  ВЕЩИ, «ЗАБЛОКИРОВАНО» stamped over a locked instrument, the post window drawn on the notice paper,
  the bazaar's hulks as real dead hulls under sagging canvas and swinging lamps with the stall as a
  table, scars anchored to their blueprint cells with «корпус помнит» rows in ОПИСЬ.
- **Tests**: base2 suites for M497/M496/M498, the record suite for M511, the rail suite for
  transfers; the golden frames re-shot in all three windows. Known red in the browser tier, older
  than this release (verified on `d1028d1`): the helm M410 cruise suite, the same-hash determinism
  suite, the broke double-tap on СДАТЬ, the map-A detector and the phone stick suites — listed in
  PLAN under release tails.
## 0.449.0 - the wake and the system edge

- **The wake** (`16-flight` `wakeStep`/`drawWake`): a second tail that comes from speed, not from
  the nozzle. At cruise the stick's assist cuts the engine and the plume dies with it — the ship
  flew as a bare silhouette. Now the hull cuts the thin gas of the system: threads peel off its
  edges — wing tips, nacelles, pods (edges that sit in one spot count once) and one from the
  stern — and open in a V with age, wider from the outer edges. A point lives 60 frames at low
  speed and 260 at cruise, so the tail runs past the screen. Cold key with a whisper of the hull
  accent (the warm accent stays with the plume), a two-layer body — a core that fades by the cube
  and a halo that widens — drawn as quadratic arcs through segment midpoints, so a turn leaves no
  corners; nothing twinkles. Drawn under the plume and under the hull. «Стриж», «Топор», «Обод»,
  «Мамонт» trail five threads, «Клинок», «Игла», «Вьюк» three.
- **The system edge** (`sysEdge` in `17-mode-system`): the gravity anchor stands at 1.6 of the
  outermost body — planet, belt or station — floor 3840. It used to be the belt or a fixed 2400,
  so without a belt the edge ignored the layout: home had 822 units of room past its outer planet
  (the phone video of 12.09: the stick pushed outward, the anchor bent the course back, the helm
  read the bent course as a brake and the ship crawled at a tenth of cruise burning fuel), and in
  29 systems of 625 the outer planet sat at or beyond the anchor. Home now has 1811 of room; no
  system got tighter.
- **Tests**: the wake suite in 91a-flight (empty at rest, longer than 1500 units at cruise and three
  times the low-speed length, threads on both sides and from the stern, the V opens with age); the
  anchor suite measures against `sysEdge` and aims the reverse course at the star, not at −X.

## 0.448.0 - the first hour, the world zoom, and the design tails of the phone playtest

- **The first hour** (`firstHour`, `G.flownMs` < 60 min): repair is two buttons — «ДО 50% · N» and
  «ПОЛНОСТЬЮ · N», the price on the button, and in the first hour the full repair costs no more than
  half the cash; a failed landing is a hard landing (−20 % of the hull at most, never to zero, the
  cargo kept) instead of a wreck; the pirate front does not grow until your first liberation; a job
  taken from the board lives at least fifteen real minutes by the game clock (offers no longer count
  frames) and ДЕЛО lists it with the minutes left; the first probe is free («ЗОНД ДАРОМ» on the pad).
- **A wreck rebuilds the hull no higher than it was**: 45 % or the level held for ten seconds
  before the trouble, whichever is lower, never below 10 %.
- **Scale**: the world zooms to ×4.5 while the ship stops at .8 (floor .7) — «close» is half a
  planet in the frame, not the ship across the screen; the disc is the physical one again (the body
  growth and moon caps of 0.447.0 are gone); fleet, pirates, barges and your own ships share the cap.
  МАСШТАБ moved from a plate over the world to the masthead under the purse.
- **Design tails**: the ДЕЙСТВИЕ pad always names the action (two words and a number); prompts fold
  to two lines on touch and the belt hint names no keys there; while a hail is open one undimmed
  edge arrow names the hailing ship; a planet's or moon's name sits on the far side of the disc
  from the ship, and an NPC's name moves above the hull when it would cross a body name or a chip;
  ОПИСЬ on a phone has four tabs (КОРАБЛЬ · СНЯТОЕ · КОМПЛЕКТ · ТРЮМ), the slots come before
  ПРИБОРЫ, an empty slot says where to buy, СНЯТЬ lives under the hull only; ДЕЛО shows a manager's
  share in the money column and drones as a table; tape strips stack without a gap; the СТОЛ button
  keeps one width and wears «99+» over its corner; a board card reads where and until when, the
  cargo paper names the destination sector; the fusion button says «В ПЛАВКУ»; a maxed module is one
  line; the got card reads «/с» and sits in the lower third; the haul passes its planet at 1.15 r on
  the ship's left; a barge box meets the hull with a dark seam.
- **The stand does not write into the live world**: `dev.html` (and `?test=1`) marks every POST
  `test:1`; `api.php` (road, traces, postcards), `war.php` and `log.php` answer as usual and write
  nothing. Account saves are unaffected.
- **Later tails**: what you dug does not grow back on the next landing (`G.mined`, saved); the key
  rebind button cancels on a second tap; «ТРЮМ ПУСТ» only when the hold is empty (rare stock is
  cargo); «привезли лёд, когда его не было» agrees with the goods; a half-price fuel coupon per two
  hours of active flight a week (`G.actWk`, shown on the station's fuel line).
- Tests follow: offers expire by the game clock, the scale suite states the decided form, probe
  suites run past the first hour, `resetWorld` knows the new fields.

## 0.447.0 - the exits window, the tow as a scene, and what the bots found

- **Empty tank**: the nose no longer turns without fuel; a turn (pad or A/D/arrows) opens the
  exits window like thrust and brake; the thrust and turn pads and the stick dim, and the stick
  says «БАК ПУСТ». The ДЕЙСТВИЕ pad reads «ВЫХОДЫ».
- **The exits window** stands in the lower third over the pads; × is 44 px, Escape and a tap outside
  close it; the head says where the tow goes and how far (a foreign station in jumps), a pursuit
  first; icons per exit; «в баке будет» is what the jump gives; the armed СБРОС is red with a 4 s bar
  and comes back; the window follows the world while open and closes itself with «Ход есть» once the
  tank is not empty. On the rope it does not open at all, and a tap there sets no autopilot. СБРОС
  takes only the lost hull's parts and is not offered on a bare «Стриж»; a dock under your own power
  in a foreign system cools the jump counter once per system; 1–7 fuel on the ground is not «ноль».
  Tow, ДОМОЙ and СБРОС put the ship by the station, not 2000 away. What the station says on docking
  and the «СБОЙ» toast show over any screen. The hail waits under this window too.
- **The tow**: the barge comes from behind and overtakes beside the ship, nose first; the rope runs
  from a boom behind the nozzles; the dry ship keeps its nose until the rope turns it; the crew never
  repeats a line; the camera and the zoom ease; at the end the barge unhooks and burns away. The tow
  runs on its own seeded stream: a run with frames and one without end in the same world.
- **Bots' findings**: the probe takes a second tap and the ЦЕЛЬ pad names its price («ЗОНД 300 КР» →
  «ТОЧНО? 300 КР»); the surface sign is offered only where nothing else takes ДЕЙСТВИЕ and is left by
  holding; a jump arrives at rest (an idle ship drifted into the corona); a wreck names its cause in
  the journal and the corona says «Корпус горит» once per entry. The ether names the speaker once, in
  one case.
- Tests: the «R2–R6» suites in `91zzxa-playable`; the picture detector skips dimmed text only under
  an open modal window.
- **Still open** (known — no need to report): the first hour (repair in two buttons, a soft first-hour
  landing, the galaxy goal frozen until the first liberation, board cargo ≥ 15 min with a timer in
  ДЕЛО, the first probe free), a wreck no longer repairing above the hull before the trouble, the world
  zoom ×4–5, and the design tails of R6 (pad labels, ОПИСЬ sub-tabs, the barge seam, story-line
  agreement, the cargo paper's destination sector).

## 0.446.0 - playable on a phone (the author's playtest of 11.09 and the review block of 12.09)

- **Empty tank** is one window: ДОМОЙ (priced by jumps), БУКСИР, СБРОС — thrust or ДЕЙСТВИЕ opens
  it. The tow is a scene: a big barge with burning engines, a sagging rope, bits breaking off, crew
  talk, the camera easing out; the haul is saved and the route passes a planet before the station.
- **One prompt, one action.** Flight writes the prompt through `cue(text, level)` — info < warning
  < action < trouble — so the empty tank is heard past the system edge and beside a planet. An
  equal action keeps the first offer, and every interactor acts only when its own line is on
  screen: ДЕЙСТВИЕ does exactly what the prompt says (belt by a planet, a hail at the pad, a
  tanker next to someone else's offer). World toasts wait behind an open screen.
- **The start picket «Коммуна»** hails in a window with the question, a countdown and two answers
  (ПРОХОДОМ / ПО ДЕЛУ, the same verbs on the pads); 15 s to answer on a phone. In the start
  system silence earns a warning volley on the shield and fire never takes the hull below half.
  While СТОЛ, ОПИСЬ or a station is open the hail waits, no new hail starts and nobody fires at
  the player; the window stands over every screen. Compass chips dim and take no taps under the
  hail and empty-tank windows. First tank rung 500, first hold 900.
- **Scale**: the ship never draws smaller than .7, bodies grow ×(1+0.8·(Z−1)) on the near zoom,
  a planet never grows onto its nearest moon.
- **Screens on a phone**: the station header is one line plus ЕЩЁ; ОПИСЬ puts the ship first with
  a legend and instruments in groups; ДЕЛО adds up (one unit, the header is the sum of the rows);
  the СТОЛ sheet names itself and ЛЕНТЫ tear on the sheet; a module is a card with one verb button
  and СПЛАВ promises exactly what the fuse gives; after a fight the loot is a card with НАДЕТЬ.
- **Economy**: a drone costs 9000·1.6ⁿ by the fleet you own; hired people earn only while the game
  runs (a sleeping tab pays nobody).
- Tests: `91zzxa-playable` — «the player does X → sees Y» suites, the phone ones in the phone
  window, each bug of the review block red first. The picture detector no longer judges text
  dimmed below .2 on purpose (chips under a modal window).
- The first push of 0.446.0 failed the deploy at the Node tier: the hail window reached into the
  test DOM stub, which cannot resolve `b em`. `hailWinSync` now leaves when its parts are missing;
  the site stayed on 0.445.0 until the fix. Lesson for the release list: `-Full` runs Chrome
  only — the default `test.ps1` (Node + smoke) is what the deploy runs, and it goes too.
- **Still open in 0.446.0** (known — no need to report): R2 — the nose still turns on an empty
  tank, the stick and move pads do not dim; R3 — the rescue window opens on the rope and breaks
  the haul, does not redraw when the state changes, its × is 19 px, СБРОС on a bare «Стриж»
  costs as if it took something, «в баке будет 40» instead of the maximum; R4 — the rope leaves
  from the nozzle, the barge comes through the ship, the haul does not end at the station; R5 —
  the probe is bought with one tap, a surface sign goes silently, a wreck works as a free repair,
  a jump can arrive in the corona; R6 — pad labels, chips under windows, ОПИСЬ sub-tabs. Scale
  (as built or a world zoom ×4–5) waits for the author. Since 0.446.0 (dev only): the hail also
  waits under the empty-tank window.

## 0.445.0 - the nearest compass chip takes the tap

- The compass chips at the screen edge are 16 px plates set 20 px apart, and each one's tap
  zone is grown to 44 px for a finger — so neighbours' zones overlap by 24. The first chip in
  the list took the tap: on a 390×844 phone (no window frame) the three chips stacked on the
  left edge and a finger on the planet plate's centre set the autopilot to the station.
  Of the zones hit, the chip whose centre is nearest now wins.
- «система: по метке можно ткнуть…» taps every chip at its centre and checks two synthetic
  overlapping zones, so the laptop's 1280×800 run catches it too. Found by the server lab
  (11.09); the laptop's phone window loses ~160 px to the frame and laid the chips in a row.

## 0.444.0 - the phone stick draws again

- 0.439.0 deleted «twenty-two dead names» from `src/`; four of them were alive. `HELM_BAND`,
  `HELM_BAND0`, `HELM_GAP` and `HELM_TRAIL` are read by the stick's band (`15b-helm-draw`) and
  by `helmTrail`, so on a phone every touch move threw `ReferenceError` after steering, and
  every frame with a live stick threw into the frame guard («СБОЙ») at the band. The four
  constants are back in `15a-helm.js`. No player report in `crash.log` since 0.439.0.
- Found by the server lab (session 11.09, «телефон: стик не ложится на приборы и подсказку ·
  HELM_GAP is not defined»). The laptop's default run is the 1280×800 window and never met
  it; `test.ps1 -Mobile` does.

## 0.443.0 - one picture oracle instead of two

- The old net «картина: ни одна сцена не уехала от эталона кадра» (M336: tones, masses,
  contrast and emptiness per scene against a pinned table) re-rendered every scene the golden
  suite had just settled — 11 s of a 230 s run. Its numbers are now taken inside the golden
  loop from the same settled frame, in the same 1280×800 window, with the same tolerances.
- For that the golden suite left quarantine: it judges now. A golden shot on another platform
  (the block grid differs — the server's headless has no window frame) is reported as «no
  golden here», not as a failure; a missing golden stays red.
- The zoo's «resetWorld оставляет поле» mutant had no named killer and died only when the leaked
  field happened to land on a sensitive neighbour — after «картина» left the order, it survived.
  The resetWorld suite now marks every ephemeral list (pirates, shots, loot, barges…) before the
  reset and demands them empty after; the mutant names it. The net's first catch: `G.barges`
  was never reset and rode from suite to suite.
## 0.442.0 - four fields that were lost on load, and a lab that runs all day

- **Four fields now survive a save:** the kill count (the clearance exam and a manager's
  «six kills» job counted from it and restarted from zero after every load), the order stamp
  (the «silence on the air» job compared against it and failed at once after a load), the
  base-visit counter (the seed of the next аврал), and the receiver's frequency — the one
  thing the console said it kept. An old save without them loads with zeros and an untuned
  dial. The save net's seven «?» fields are settled: these four persist, `hailLog`,
  `quietGone` and `logNewBy` stay per session, with reasons beside them.
- **The lab runs four sessions a day** instead of one a night, in smaller units — twelve
  light shards, the phone and the tall window in four each, one heavy suite per Chrome — and
  the fuzz hunt no longer stops itself; a seed the host killed does not count as «nothing
  new». After every unit the leftover Chrome processes are killed and the memory counter is
  waited down: `timeout` killed only the parent, and the renderer it left behind was the
  likely reason one OOM followed another.
- **The lab page shows what became of each bug:** open, «починено в 0.441.0», «не повторяется
  с …» (set by the lab itself when the same run goes green in a newer build), «не баг: …».
  Tiles, the bugs, what ran into the host, one row per session — the charts and the raw
  run list are gone. Staged suites no longer land in the error log.
## 0.441.0 - the map answers on your own sector, and one silence less

- **On the map, ДЕЙСТВИЕ with your own sector selected now says «Вы уже здесь — выберите
  другой сектор»** instead of nothing. The prompt promised ПРЫЖОК and the game stayed silent;
  the promise suite saw it the moment the map started stepping in `updateMap` (0.438.0)
  rather than inside its frame.
- **The base scene puts the cage on the second level**, so W is judged there — the detectors'
  «base · W is silent by right» is gone (the cage stood on the top level with nowhere to go).
  The first attempt was blocked by the promise suite, and that was the suite's fault: it hashed
  the first 4 000 characters of the mode's JSON, and the base object comes first, so an opening
  menu never fit. It hashes the whole mode state now (`stateHash`).
- The «Сорока» scene stays at the ladder for now: two steps in, the same-hash suite goes red
  under seeded hands — something on the corridor's buy path reads real chance or real time.
  Named in `PLAN.md`. The three goldens were re-shot for the moved base scene.
## 0.440.0 - golden frames keyed by the window you asked for

- **A golden frame is looked up by the window `test.ps1` requested** (`?win=1280,800`), not by
  the `W×H` the page measured — that number was the headless window's own (1280,800 came out as
  1248×641; on another machine it differs, the golden «was not found», and the suite passed on
  a count). The three files in `docs/golden/` are renamed to the requested sizes, and a window
  without a golden is now red with the exact `-Accept` command to take one.
- **`stateHash` no longer depends on the order techs were bought**: `Set` and `Map` members that
  are primitives are hashed sorted. Two identical worlds with different histories hash alike.
## 0.439.0 - tiers by evidence, and twenty-two dead names

- **A suite's tier is decided by what its body touches, not by a word in its name.** 132 suites
  that never read a pixel, the DOM, audio or the network moved from Chrome to Node (137 were
  tried; five went red under the stubs and stayed where they were); five Node suites that read
  `getBoundingClientRect`, `ctx.`, `drawWorld` or an element's style moved to Chrome, where their
  numbers are real. Node tier 481 → 616 suites (22 → 25 s), Chrome tier 295 → 168.
- **Twenty-two top-level names nothing called** are gone from `src/` — `BASE_STANDBY`,
  `chessCanMove`, `crewHostages`, `deltaHtml`, `drawHoldMods`, `ethReset`, `mailDrop`, `namesBlock`,
  `recOn`, `rungDef` and twelve more — after one grep each across sources, tests, site, tools and docs.
## 0.438.0 - the audit of the night's tooling, and the save net

Four hostile reviews of 0.428.0–0.437.0 and a survey of `src/`; the milestones stand, the
tooling around them had holes. Fixed here:

- **`test.ps1 -Mutants` no longer erases uncommitted work** — it restored a mutated file with
  `git checkout --`, which rolled back the whole file; now it writes back the text it read.
- **`-Changed` cannot pass by running nothing** — no matching suite means the fast tier, and a
  change to `tests/90*` (harness, tools, detectors) means the full corpus, not «the file itself».
- **A shard has a ceiling** — 900 s, then its own Chromes are killed and the part is reported as
  hung; `--timeout` never worked under the new headless (the 33-minute GPU spin of 10.09).
- **`resetWorld` restores the player's options** (`OPTS_BOOT`) — the two drivers' private
  workaround is gone, and the hostile-save suite no longer leaks a text pad size into its neighbours.
- **The clock law also refuses** `Math["random"]`, `Date["now"]`, `new Date` without parens; a
  `typeof` check on a function that does not exist now fails the build instead of warning.
- **The map jumps on the world step** (`updateMap`), not inside `drawMap` — the world changed in
  drawing, so without a frame (hidden tab, a suite without pixels, the bot) there was no jump.
- **The save net** (`91zzzzzzzzz-savenet`): every field on `G` is either in `snapshot()` or named in
  `SAVE_EPHEMERAL` (`14a2`) with a reason — 260 fields checked, seven marked «?» for the author;
  save→load→save is a fixpoint; numbers that the PHP cloud returns as strings are numbers again
  for every option (`optsNumify`), not only the pad size.
- `T.bot("undock")` can go red (no button was «leave()»), `T.replay` refuses a recording from
  another version, the trips oracle has absolute anchors beside its own-median thresholds,
  `detRuler` runs last, a broken desk item goes to the crash log instead of silence.
- `docs/INDEX.md` names where a symbol ends (`file:start-end`), so a session reads a function by
  exact offset; `PLAN.md` back to 52 KB (the closed «Сорока» queue archived); docs stopped saying
  there is no `node` on this machine. The audit's queue and the rejected refactors: `PLAN.md`,
  «Refactor audit».
## 0.437.0 - the recorder sees the screen's buttons too (M444)

A click on any button while `?rec=1` is on becomes a frame event — the button's id and label
at that frame — and `T.replay` presses it on whatever screen is open when that frame comes
(by id first, then by label); events after the last frame, a button pressed once docked, are
pressed after the last frame. The bot now opens the trade section by its button ТОРГОВЛЯ instead
of assigning the tab, so a recorded sale replays: the new suite records a flight to the station,
the docking and ПРОДАТЬ ВСЁ, replays it and gets the same credits. Drags and the wheel are still
not recorded.

## 0.436.0 - the same trip in twelve worlds, and the distribution it leaves (M446, first oracle)

`tests/91zzzzzzzzc-trips.js` sends the bot on one round trip — to the planet, land, drill a
deposit, back to the ship, launch, to the station, dock — in each of the first twelve station
systems with a habitable planet, and judges the *distribution*: frames, fuel and ore per world.
Red when a trip does not close, takes three times the median, drinks more than 80 % of the tank,
or yields under a quarter of the median ore. Today: every trip closes, median 2 152 frames, 26
fuel of 100, 12 ore; two seconds in Node, `?worlds=N` for the lab. Staged until 2026-09-18 —
the thresholds are first guesses, the lab's history sets them.

## 0.435.0 - four more paths for the bot: a fight, the base, the home, the wanderer's shelf (M444)

`T.bot("fight", frames)` turns the nose onto the nearest pirate, thrusts from afar and fires
inside a cone until the enemy is hurt or gone; the walk finds the first system on rings 18–27
where a patrol spawns, arms the ship and fights for six hundred frames. Three more walks drive
the base's lift and compartments, the home's room up to a thing worth looking at, and the
wanderer's shelf with a lot bought for matches. Twelve paths under all six detectors, about
twenty seconds in either window; nothing new to fix this time.

## 0.434.0 - the last minute of input, recorded by frame and replayed to the point (M444, part three)

`?rec=1` turns on the recorder (`src/15c-rec.js`): every world frame stores the key mask and the
step, in segments of thirty seconds; each segment carries a head — a copy of the world snapshot,
the position of the game's chance (`rndState`), the clock and `G.t` — and the autopilot targets a
tap sets are kept as frame events. A segment only ends in a stable mode (flight, dock, map),
because the snapshot deliberately keeps nothing ephemeral: a head cut mid-drilling would restore a
different strip. F8, or `recMark()` in the console, puts the last minute into `localStorage`
`drift.rec` and the console. `T.replay(rec, {seed, hour, each})` in the tools restores a head,
then feeds the same keys at the same step — on the same seed the world arrives at the same
point, on another seed or hour it just has to live, under the detectors. The suite
`91zzzzzzzzb-replay` (Node, 0.7 s) records a bot's flight, landing and drilling, replays it to
the same cargo, position and fuel, and replays it again at three in the morning on seed 5.
Found on the way: `snapshot()` returns an object that shares references with `G` — a kept
snapshot drifts with the world (the replay began with thirteen ice it had not mined yet);
the recorder copies, and `docs/GOTCHAS.md` says why. Screens' clicks are not recorded — that is
the recorder's boundary, named in the module.

## 0.433.0 - the mutant zoo, and a run that knows what you touched (M445, M444 part two)

`tests/mutants.json` holds eleven one-line breakages, each a bug from the project's history: a
`zoomStep` that does nothing, map type without the ruler, the sky riding with the sheet, W without
thrust, a lying fuel readout, an icon button without a word, a manager field off the save
whitelist, a perk nobody reads, a mode drawing an empty frame, a bare label on a day sky,
`resetWorld` leaving a field. `test.ps1 -Mutants` applies each in place, builds, runs the suites
it names as its killers (`?only=a|b` now matches any of several fragments) and restores the file
through git; one line per mutant — killed by which failure, or ВЫЖИЛ. First run: ten of eleven
died in 266 s; the survivor, the button without a word, was a hole in the detectors — the law
detector now refuses any visible control with neither text nor `aria-label` nor `title`, and
the eleventh dies too. A survivor is fixed in a detector, never by dropping the mutant.

`test.ps1 -Changed` runs only what your edit touches: `build.ps1` writes `docs/TESTMAP.json`
(for every test file, the `src/` modules whose top-level symbols it names) and stamps each test
file into `tests.html` as `TEST_FILE`; `-Changed` reads `git diff HEAD` plus untracked files under
`src/` and `tests/`, picks the test files that name a changed module, and runs them in Node and in
Chrome — heavy suites included, usually in seconds (`-Files "91a-flight|91c-mgr"` picks by hand).

## 0.432.0 - a bot walks the player's paths, and the detectors judge every step (M444, part one)

`T.bot(goal)` in `tests/90a-tools.js` is no longer a stub: `star`, `station`, `planet`, `dock`,
`undock`, `sell`, `land`, `mine`, `ship`, `launch`, `dig`, `up`, `jump`, `save` — each through
the player's own controls (the autopilot a tap sets, ДЕЙСТВИЕ by edge at the pier and the mine
mouth, keys to walk and drill, the held ВЗЛЁТ button, ПРОДАТЬ ВСЁ on the counter), each
answering `{ok, frames, why}` so a scenario says *where* it stuck rather than throwing.
`tests/91zzzzzzzza-walks.js` writes eight paths in five lines each — first minutes (К ЗВЕЗДЕ,
the station, dock, undock), landing and a deposit to a full hold and back into orbit, the mine
three tiers down and up, trade, a jump to a neighbour, the belt under random hands, fire in
flight, save and reload — and runs all six detectors after every step, keeping the screens a
step opened. The run prints a coverage map (mode × step in this window). The first pass found
three labels the scene runs never saw: «МАСШТАБ ×0.70» over a planet disc in orbit (contrast
2.1, and still 2.4 on the phone behind a half-transparent plaque), «ШАХТА» at the mine mouth and
«ПЕЩЕРА» at the cave entrance on a day sky (1.9 and 2.2) — all three on a plaque now. The
blink/pop detector no longer judges a frame whose camera is moving (after launch or a jump the
ship is under way, and bodies entering at the frame's edge are a pan, not a flicker). Left for
part two:
`?rec=1` recordings with a «bug here» key, replay under perturbation, `test.ps1 -Changed` from
`docs/TESTMAP.json`.

## 0.431.0 - the fifth and fourth oracles: golden frames and a hundred worlds (M443 closed)

Two oracles that judge no case and no law, only *difference*. **Golden frames**
(`tests/91zzzzzzzzz-golden.js`): every `lookScenes` scene is reduced to a block signature (the
quarter-size luma the detectors already grab, one byte per 8×8 block) and compared with
`docs/golden/<W>x<H>.json`; a scene is red when more than 3 % of blocks moved beyond 18/255.
Baselines exist for the three windows the harness runs (1280×800, the phone, the tall one);
`test.ps1 -Accept [-Mobile|-Size]` re-shoots one window after a deliberate picture change and
writes the file — kilobytes of text, no PNG in git. **A hundred worlds**
(`tests/91zzzzzzzzz-worlds.js`, Node, 0.3 s): every station in six rings from the start is asked
the same three questions — is there a station within one jump on a full tank, does any neighbour
pay more than ×4.5 for what this counter sells, is fuel here more than ×3 the median — and the
run prints the distribution of the best one-hop deal (median 3 352 net per full hold today).
Both are staged until 2026-09-18: they print, they do not decide the verdict, and the lab's
history sets their thresholds.

Also: the same-hash suite now runs each scene twice *under seeded hands* (input timestamps,
edge latches and the ghost click are on the game clock since M441 — this proves it); an
exception inside a scene's settle is a «сбой» with the scene's name instead of a silently
half-baked frame; the tools' self-test no longer expects the «+ −» box and a three-button rail
on the phone (it was red in `-Mobile`, and would have been red in the lab tonight).

## 0.430.0 - one set of hands and eyes for every test, and rules the harness enforces itself (M442)

`tests/90a-tools.js` gathers what five suites each wrote for themselves: actuators `T.go(scene, seed)`,
`press`, `hands`, `tap`, `drag`, `wheel`, `wait`, `advance`, `window`, `give`, `board`/`leave`, and
observers `T.frame`/`diff`, `state` (the game's `stateHash()`), `look`, `ledger`, `text`, `controls`,
`clock`; the old names (`fuzzRich`, `prSpoke`, `e2eHands`, `clkShift` …) stay as one-line wrappers, and
the clock tools move the game's own clock instead of patching `Date.now`. `docs/stand.py` drives one
headless Chrome over CDP (stdlib websocket) through every scene and window size. A suite now declares
its tier in place — `suite(name, {tier, win, stage}, fn)` — and `SLOW_SUITES`/`NODE_BROWSER`/`NODE_SKIP`
are gone; `stage` is quarantine (reported on its own line, never the verdict). A suite with no assertion
is red, and a net over the test sources keeps `ok(true` and `typeof`-guards at zero (there were 126 and
190). `?shuffle=seed` (`test.ps1 -Shuffle N`) runs the suites in a reproducible order and `?pick=i,j`
bisects it; the shuffle found page state outside `G` leaking between suites (a picked hull, a stuck
«ghost click» mark that swallowed every button for the rest of the page) — restored after every suite now.

## 0.429.0 - the tests judge laws, not cases: four detectors and the ten bugs they found first (M443)

After every step of every `lookScenes` scene × five gestures (idle, W, A, drag, wheel/«+»), plus the menu
doors and an armed ship, detectors now check: **crash** (frame guard, `onerror`, console, with the stack's
place); **stuck** (a mode without its state, a screen its own close control cannot shut, a frame that did
not move under a key); **law** (NaN/∞ and type changes in `G`, a `Proxy` prototype counting reads of fields
nobody writes, 291 on-screen readings checked against their fields — «РАКЕТА 0» with missiles aboard dies
here — and what W, A, «+» and a map drag must *do* on screen); **picture** (empty or burnt frame, idle
blink and pop, contrast ≥ 3, text ≥ 8 px × the UI ruler in a 2560×1440 frame, canvas sharpness, one human
height on foot). The whole pass costs 8–12 s. Its first run found, and this version fixes: type that
ignored the UI ruler at 1920 and up in six places (system names, the belt cockpit and glass HUD, the scoop
heat gauge, the base board and note card, the home room name, «Сорока»'s chalk prices at 7 px); unreadable
ground labels on a day sky (contrast 1.2), the sanatorium schedule, «ПОЛОСА СБОРА» on the gas, the map's
scale and stats line on a phone; and НАСТРОЙКИ, which would not open once a cloud save had brought the pad
size back as text («1.25») — the loader now turns it back into a number.

## 0.428.0 - the game owns its chance and its clock (M441)

`rnd()`/`rndFx()`/`rndSeed()` and `now()`/`clockSet()`/`clockAdvance()` live in `01-core`, with named
real-clock escapes (`wallMs`, `wallNow`, `uidRand`). All ~400 raw `Math.random`/`Date.now`/
`performance.now`/`new Date()` calls in `src/` were migrated by class (state, picture, game time,
real time), and `build.ps1` now refuses a raw call anywhere else, or the world's `rnd()` inside a draw
function. On a pinned clock the frame step is fixed, so two runs of each of the 15 `lookScenes` on one
seed give the same `stateHash()` (`08a-statehash`) every hundred steps; that test found and closed three
leaks between suites (`G.logNew`, `G.msgT`, the radio console's own once-a-second phase). Suites start at
one seed and one minute (`?hour=` moves it): «план: комбинат» asserts exact numbers again and `bNoDir` is
deleted from the seven base suites. The build's two slowest checks became single regex passes: 116 s → 5 s.
Players see nothing: both streams are seeded from the real clock at boot and nothing new is saved.

## 0.427.2 - the lab's first night, answered: two reds, one law, and the log learns to tell host from game

The three-hour session of 10.09 (127 runs, 65 fuzz seeds) left eleven open keys. Two were the game's:

- **Ceramic armour overshot the hull.** Buying «Керамическая броня» did `G.hull+=30` flat; a worn
  hull (12s-wear) has a lower ceiling than the formula, and the gift climbed over it - «корпус 280
  из 250» under the full-hold sweep. The gift is clamped to `stat().hullMax`, read after the tech
  is written.
- **«Ничто не спорит со звездой» went red by the wind.** The suite cleared the storm but not the
  clouds: a cumulus drifting over the disc dimmed it to 0.52 while its lit neighbour read 0.69
  (Нейэль I). Bisected on the host by switching painters off one at a time - not the giant, not
  the shafts, not the haze; the clouds. The game gets a door, `CLOUDS_OFF` in `19e-clouds`, the
  same kind as `CHRON_FREEZE`, and the suite measures the sky through it. Clouds keep their own
  paint law in the suite above.
- **And a law the bisect found on the way:** a gas giant lit by a red star was painted with the
  yellow-star palette, so its rim and rings read brighter than the disc that lights them (law 7).
  `skyGiant` now scales lit side, shadow, rings and rim by the star's luminance against the
  yellow default - unity for a yellow star, the picture unchanged there.

The rest were the host's 768 MB, not the game's, and the log now says so: an OOM or a timeout
carries class `host`, the page opens on «игра» and keeps «хост: память и время» a click away.
`lab.py fix <key>` closes a key by hand; a key not seen for three finished sessions goes quiet by
itself and reopens the moment it is seen again. The fuzz timeout drops to 150 s - a live seed
takes ~105, and nine dead ones cost the first night forty-five minutes.

---
## 0.427.1 - the lab's first catch: a base suite that went red by the hour

The lab's first session on the host (Node 16, 23:50 UTC) and the deploy of 0.427.0 both failed
on «база M391: воздух и вода» - «получено 52, ждали 108» - while the same build was green at
22:03. The suite measured three shifts of breathing with the director (M397) switched on, and
the director is seeded by the number of the *real* shift: at some hours of the day he vents the
air. The file's own rule since M418 is that a measurement of arithmetic runs without weather
(`bNoDir`); the four `baseResolve` calls of that suite now do. Nothing in the game changed.

---
## 0.427.0 (M440) - the lab: the tests run on the server at night and keep a log that does not fill up

The author, 10.09.2026: «надо сделать на сервере какую-то штуку, которая будет гонять тесты и
писать в лог ошибки… чтобы не долбилась в одну ошибку и не засирала лог… лаборатория — раздел
на сайте, графики, прогоны». Nothing in the game changed but `VER`.

**The host was measured first** (`docs/LAB.md`): shared hosting, 500 MB for the account, no
cron, no Chrome, and every process dies with the ssh session. Chrome runs there anyway -
`chrome-headless-shell` plus seven libraries unpacked from Rocky 8 RPMs into `~/chrome/lib`
without root; the Node tier runs in 18 s, a light shard in 10 s, the heavy nets one per
process («печь» 70 s, «память» 31 s, the fuzzer 22 s). Six Chromes at once die; one at a time
lives. So: **one Chrome, one heavy suite per process, and a session that somebody holds open**
- `lab.ps1` from the laptop by day, `.github/workflows/lab.yml` at 02:00 Moscow for up to six
hours. The deploy is untouched: the lab writes `~/drift-lab`, `~/drift-data/lab` and `/lab/`.

**A session** (`lab/lab.sh --budget N`): node, six light shards, the phone window and the tall
window - the two the laptop never runs by default - then every `SLOW_SUITES` name alone, then
the fuzzer on fresh seeds until the budget ends. Memory is sampled every two seconds; the page
republishes after every unit.

**The log counts keys, not lines** (`lab/lab.py`): an error is `sha1(suite | message with the
numbers replaced)`, and a known key is counted, not logged. A heavy suite that went red or gave
no report is not run again in that version. The fuzz hunt stops itself when five seeds in a row
find nothing new, and a fixed error that returns is reopened with the version it returned in.
`/lab/errors.txt` is the human form, newest last-seen first, with the detail block - the file
a fixing session reads.

**The page** `site/lab.html` at https://drift-game.ru/lab/ - three canvases in the site's
palette (sessions, the eight slowest nets over time, memory peaks against the 500 MB line), the
error table with filters and detail on click, the hunt per version, the last sixty runs. It
reads one `data.json` and has no build step. `test-node.js` gained a `fetch` stub for Node 16.

---
## 0.426.0 (M439) - the run measures itself, splits into parts, and the parts find what one page hid

The author, 09.09.2026: «У тебя там тестов на 4 минуты, зачем они нужны если все равно такие баги.
Перепридумай тесты». 0.424.0 answered the bugs; this one answers the four minutes. `-Full` now
takes **93 s instead of 292 s**, and on the way it turned four long-green suites red for good
reasons. Nothing in the game changed but `VER`.

**First the bill, because nobody had ever seen it.** The harness has had a «САМЫЕ ДОЛГИЕ» block
for a year and it has never once printed: `test.ps1` runs Chrome under `--virtual-time-budget`,
and inside a synchronous block that clock does not move, so every suite measured 0 ms and the
block was filtered away empty. The switch the harness comment pointed at - `test.ps1 -Times` -
did not exist. It does now: real clock, the thirty slowest suites, added up across parts. The
bill, 807 suites over 280 s: the ten dearest are 205 s of it, the five dearest are 139 s, and
four hundred suites do not reach a millisecond. **What costs is `drawWorld()`** - some 3 600 full
frames at ~40 ms apiece - and not scene set-up, which is what this file and PLAN had guessed
since May. Guessing is what happens when the clock is stopped.

**`--disable-gpu` was paying for three quarters of the picture.** It had stood in `test.ps1`
since the first headless run, for no reason anyone recorded. Without it headless Chrome takes the
real card: the dearest suite of all («печь: вечер») goes 49 s → 17 s, and the whole run 280 → 230.

**The corpus splits across Chromes.** Suites are independent by design - every one starts with
`resetWorld()` - so `?shard=i/N` deals them out and `-Jobs N` runs N headless Chromes at once,
adding their reports into one verdict. Heavy and light are dealt round-robin **apart**: the
forty-five heavy ones lie in clumps, and one counter would have handed a third of the run to one
part. Measured on sixteen cores: 1 part 230 s, 4 parts 131 s, **6 parts 97 s**, 8 parts 114 s,
12 parts 147 s - past six the Chromes fight over one card and lose. `-Full` takes half the cores,
capped at six.

**And the split found four things one page had been hiding.** A different split is a different
order, and the first `-Jobs 8` run turned three suites red that had been green for months:

- **The isolation net cleaned the world but not the page.** `resetWorld()` reset `G` and closed
  the road, the menu and the table - but a `.scr` left open by somebody's click sweep stayed open,
  and the next suite measured its layout through a window that was not its own, silently. The
  sweep is part of the reset now. The suite meant to guard exactly this («утечки: страница не
  остаётся в чужом режиме») had been passing on luck: it asserted a property `resetWorld` never
  had.
- **The station remembers its tab outside `G`.** `tab`, `stGroup` and `tableTab` are plain module
  variables, so a suite that walked off the station on «ЭКИПАЖ» handed the next one the ЛЮДИ
  group. The harness now puts all three back to the values they held when the page booted - the
  same rule as `G_BOOT_KEYS`, and for the same reason.
- **«станция: ДОСКА у всех» had been passing for the wrong reason.** It looked for the ДОСКА
  button on the second rail, which shows the tabs of the *current* group - and ДОСКА is a group of
  its own, one tab wide. That button is visible exactly when the player is already on the board,
  so the check held only while the previous suite happened to leave the station there. It asks
  what «у всех» means now: the group is on the first rail at every station, and it opens the board.
- **One assertion was decided by the clock ticking over.** «план: комбинат не останавливается»
  tops the shift up to 50 and then demanded `T.run >= 50`, while `tinTick` burns the shift by real
  time: one millisecond between the two `Date.now()` calls and it is 49.9993. It had been falling
  once in a few runs, it took down the 0.361.0 deploy, and under eight busy Chromes it fell twice
  as often. It asks for the rule now, not for the tick.

**Four suites that could not go red.** «проба · …» - the economy stands - are `ok(true, …)` from
top to bottom: they print rates, slices and caps and assert nothing at all. They cost 12 s of
every full run for numbers nobody reads. They live behind `test.ps1 -Probe` now, and the rule is
by name: call a suite «проба · …» and you have said it prints rather than judges.

**Two suites stopped paying for hope.** The reference-frame suite spent forty frames per scene so
the planet's strip could finish baking - seventeen scenes, 680 full frames, 21 s, the dearest
suite in the browser tier. It asks the oven now (`settle()`: run until the strip and material
queues are empty, floor six, ceiling forty). The fuzzer drew every eighth frame - 544 draws, most
of them the same scene twice - and now draws where drawing is dangerous: the first frame after a
mode change, plus one in sixteen for the background. On the clock: the reference frame 21.5 → 6.7 s,
the fuzzer 23.7 → 2.2 s, and the work inside one page 280 → 104 s before a single part is dealt.

**Two small ones.** The head line says how many suites actually ran, not how many are registered
(«наборов 804 из 807»). And a new guard reads the tier lists back: a name in `SLOW_SUITES` or
`NODE_BROWSER` that no longer belongs to a live suite is a failure, because a renamed suite
changes tier in silence. There was one such name, left from a suite folded into the doors matrix
in 0.359.2.

---
## 0.425.0 (M438) - the sky stands still in the world, the sheet slides in front of it

The author, 09.09.2026, over a screenshot of the map: «карта двигается вместе с этой полосой и
слоем звёзд… выглядит не очень», and «полосу чуть притуши, она типа как бы должна на фоне быть».

The backdrop was nailed to the screen. The Galaxy band and the rhumb net were baked as
screen-sized layers drawn at 0,0; the nebula and the star grit moved only when the SHIP moved.
Drag the map and the sheet slid while the sky sat still - sheet and sky read as one flat plane,
and the motion looked like a diagram crawling over wallpaper.

The law now: **the sky stands in the world, the sheet slides in front of it.** The sky is
anchored to the ship - where you are in the galaxy is what the arm looks like - and panning the
map moves it by a fraction of the sheet's travel, the smaller the further the layer sits: grit
~.4 of the sheet, nebula ~.14, band ~.05. The shift saturates through `mapSkyShift` (tanh): a
small drag is honestly proportional, a long one eases into a ceiling, because there is nowhere
for an infinitely distant sky to go. The band layer is drawn with a margin along the edge, so
the shift never opens a bare rim; the nebula's field grew to match.

The rhumb net moved the other way. It belongs to the SHEET, not the screen: sixteen bearings now
radiate from YOUR system wherever the pan has taken it, and travel with the map 1:1 - the contrast
between that and the barely-moving band is what makes the depth read. Sixteen lines per frame
cost less than the full-screen layer composite they replace.

And the band is quieter: drawn at .62 alpha, it is what the addresses lie AGAINST, no longer a
glow competing with the grid and the captions. `site/war.html` keeps its own .38 - untouched.

---
## 0.424.0 (M437) - the map answers the hand, and its captions grow with the frame

The author, 09.09.2026, over a screenshot of the map: «ищи баги смотри шрифт как то размывает,
карта не увеличивается. У тебя там тестов на 4 минуты, зачем они нужны если все равно такие
баги. Перепридумай тесты, эти ничего не ловят». Three fixes, and the fourth item is the point.

**+ and − did nothing on the map.** They were wired to `setZoom` - the flight camera - while
the map has had a scale of its own since M299 (`G.mapZoom`, pinch and wheel). On the map the
pair silently rescaled the system view behind the player's back: press, nothing moves, and the
next flight starts in a scale nobody chose. They now take the scale of whatever is on screen
(`zoomStep`), and where there is no scale at all - the ground, the cave, the mine, the belt,
the base - the box leaves the rail rather than standing there as a promise nobody can keep.

**The map was the only screen whose captions ignored the interface ruler.** «One ruler, and it
is the frame» (M221): whatever the canvas draws as *interface* goes through `withScale(UIK,…)`,
as the system view and the ground do. The map never did. In a 1920 window the rail, the panels
and the hint grow by 1.42 while the map's own rulers, header, footer, course badge and system
card stayed at 8-9 px - small, thin and out of step with everything around them, which is what
«шрифт как-то размывает» looks like. The map cannot go inside `withScale` whole: its rulers and
captions hang off the sector grid, and the grid is the world - scaling it would change the map's
own scale. So the ruler enters the *type* and the interface paddings (`mapU`, `mapFont`), never
the grid coordinates.

**Auto-resolution comes back now.** It dropped after three heavy seconds and never returned by
design («чётко - мыльно - чётко хуже ровной картинки»). The price turned out to be higher than
the flicker: one landing, one first bake of chunks, one other tab stealing a frame, and the rest
of the evening is soft - including the map, which costs pennies. Down still takes three seconds;
up takes twenty seconds of a frame twice as light as the drop threshold, at most twice a session,
and the first three seconds after a scene change are not judged at all - those frames bake the
raster once and are heavy by design.

**And the tests are re-thought, because 806 suites had missed all of it** (`tests/91zzzzzzz-hands`).
Three structural holes, not three forgotten cases. Buttons were found *by their caption*, so «+»
- an icon with an aria-label and no text - existed for no suite at all. The judge was the *state*:
`prDelta` compares fields of `G`, and the dead button did change a field (`G.zoom`), just not one
the player can see. And every sweep opened `.scr` screens, while the rail lives *over* the world
and was never swept. The new contract: **the frame is the judge**. Every visible, enabled control
of the rail is clicked in every scene of `lookScenes()`, and the answer must be something the
player sees - the picture changes beyond the world's own motion, the game speaks, a window opens,
or the mode changes. A changed field is not an answer. On the code as it stood the suite reports
28 dead presses; the zoom suite fails four ways; the resolution suite measures the canvas against
the window and the drop against the return.

---
## 0.423.0 (M436) - one helm layout: the nose is the keyboard's, the cursor is the right button's

The author, 09.09.2026: «сломал управление… продумай логику, что на WASD, что на QE, мож
стрелки нахер не нужны, посмотри как сделаны другие игры». There were two keyboard schemes -
mouse (nose to cursor always, WASD along the screen axes) and arrows (everything from the
nose) - and they switched by themselves: any mouse motion over the full-screen canvas picked
the first, so W stopped meaning «forward» the moment a hand brushed the mouse, and A/D stopped
steering at all because the nose was already the cursor's. Nobody builds it that way: Endless
Sky, Starsector and Escape Velocity steer from the nose and hand the nose to the mouse by an
explicit gesture.

Now there is one layout. W is throttle, S is the brake, A/D turn, Q/E strafe, Shift puts every
thrust through the thrusters; the arrows are the same keys under other caps, not a second
scheme. The mouse leads the nose only while the right button is held (Starsector's Shift), and
while it is held A/D become strafes - the rudder is the cursor's. The missile moves to G. And
letting go is the same for every input - the ship coasts: the .55 rule («below cruise a
released throttle brakes by itself») followed the stick out, because one gesture with two
outcomes by a speed threshold read as «the ship sometimes brakes on its own». The brake is a
gesture - S, ТОРМОЗ, the thumb pulled back or held still - and it is one brake for all of
them, at the stick's `HELM_STOP`, nose-blind and undimmed by an empty energy bar. The phone
helm of 0.418.0 is untouched. The title-screen table says the new layout; `docs/DESIGN-war.md`
§1.2 is rewritten.

---
## 0.422.0 (M435) - the planet is lit by its star and rimmed by its own sky

The last consumer named in the grisaille row. Seen from orbit, a planet's day side was lifted
by a constant near-white and its limb glowed the same blue on every world that has a surface -
on the airless rock as on the ocean world. The lift is now the colour of the star (the same
`starRGB` that lights the ground since 0.420.0), the limb is the world's own daylight sky
lifted toward white, a gas giant is rimmed by the top of its palette, and a world with no
atmosphere has no limb glow at all: there is nothing there to scatter, and its terminator is
the sharper for it. The light bake carries the star in its key, so a planet seen under a
different star is baked again.

Housekeeping in the same release: two files cut at their seams. `19-mode-landing` had grown to
50 KB and now keeps the descent, the sky and the frame, while the cross-section painters -
the three-pass bake, crumbs, grass, boulders - live in `19-mode-landing-ground`; `07-planet`
keeps the orbit view and hands the relief - `RELIEF_MIX`, `LAND_ARC`, `genTerrain`,
`groundAt` - to `07a-terrain`. Nothing moved but text; the build orders them by bytes.

---
## 0.421.1 (M434) - what stands in the shadow goes into it

0.421.0 put the evening on the ground and left everything standing on it in the noon: a bush,
a column, a tuft of grass on a flank that had gone into the ridge's shadow kept its full light,
because those are drawn in the frame and not in the chunk. The shadow map is now kept per chunk
in a small memo and answered by world x, so the deco (through its colour helper), the plants
(through their tone) and the grass (a second, dimmer stroke) darken inside the shadow to half
their light and no further - the sky stays. The contact ellipse under a deco fades with the
shadow, since nothing is left to cast it. One array read per object; the map is the one the
ground already baked. The walker keeps his own light on purpose: he carries a lamp, and he is
what the eye is for.

Also: the parrot suite went red twice today by the luck of the draw. `step` is the place on the
perch, not a pose, and it slides back at .995 a frame - twenty-eight seconds from a jump - while
the suite gave the bird two seconds to settle and read whatever the neighbouring suite had left
it doing. The poses are still checked at two seconds; the place is checked at half a minute, and
the slow one is named rather than hidden.

---
## 0.421.0 (M433) - evening arrives: the ground shadows itself

Since 0.420.0 the cross-section has real light - sky in the shadow, star in the light - and that
showed what was still missing: nothing stood between a point and the star. A ridge at sunset was
as bright at its foot as at its crest, the valley behind it was lit as if the ridge were glass,
and a boulder cast nothing but the ellipse under itself. Evening was a dimmer, not a direction.

Now every sample of the ground marches a ray toward the sun and asks whether the relief or a
boulder rises above it. Where it does, the sample gets sky and no star: in the slope strip, in
the crust highlight and the движки (none in shadow), in the boulder's body, and as a mask on the
body under the shadowed edge that fades with depth, the way a ridge's shadow lies on the slope
behind it. All of it is grey in the form pass, so the glaze of 0.420.0 makes the shadow the
colour of the sky - blue on ice, green on a toxic world, black where there is no air.

It costs the frame nothing. The chunk was already keyed by the sun's side and the day's height,
so the map is computed once per chunk bake, kept on the terrain and read by every drawer of that
chunk; the ray stops at 900 px, at night no map is built, and at the zenith the ray goes straight
up and meets nothing. A suite holds the geometry: a ridge shadows the slope away from the sun and
not the one toward it, a lower sun throws a longer shadow, a boulder is a shield too, and the
penumbra is a share and never a step.

Measured at a forced low sun on three worlds (almanac issue VII): mass and contrast up by a point
or two, the pair down by as much because a shadow is cold - and the right flanks of the ridges
finally in the evening. Plants and deco are drawn live and keep their own light inside a cast
shadow; that is a tail, and it is written down.

---
## 0.420.0 (M432) - the ground is painted by its light, not by its palette

The tenth and last craft law. Every drawer of the landing cross-section used to pick its own
colour out of the world's palette - the ground, the boulders, the beds, the material tile, the
hatch - so light and colour lived in one brush stroke. What followed was visible in every frame:
the light on most of the picture was a **constant** (a fixed black under a boulder, a fixed cream
on a bedding contact), while real illumination was computed for the slope strips alone, one ribbon
out of the whole section.

Now the form bakes in **grey** and one glaze per chunk turns grey `v` into `dark + v·(light −
dark)`, where `dark` is the sky and `light` is the star. It is the same light model the game
already had: `litRGB` is linear in its Lambert term, so the two stops *are* `litRGB` with that term
read off the grey pass instead of off the slope - the new suite asserts exactly that, by requiring
the real `litRGB` to land between the two stops. Two `fillRect`s and one `drawImage`, no pixel
readback: reading a canvas would drop the chunk into software rasterisation.

Nine kinds of detail cannot survive a trip through luminance - a vein and a facet edge share a
lightness - so veins, the lava and ice seams, oxide streaks, facet dispersion and lichen are drawn
in a third pass, after the glaze, and it never touches them. **Grey means «paint me», colour means
«I know my own hue».**

What it costs is named rather than hidden, and it was the author's call: within one world the
palette's hue ramp collapses to one hue lit from two sides, so a terran world goes from olive to
terracotta and `tones` falls 5 → 4 at noon. What it buys, on the same meter, is `mass` and
`contrast` up on every daylight frame and an ice world going 5 → 13 on mass and 6 → 39 on pair -
the beds finally reading as beds. The five-frame, three-palette sheet is almanac issue VI.

Found while measuring and fixed here: the shadow floor was flat, which is right at noon - the sky
cannot reach into a crack past the lit rock - and wrong at midnight, where the sky is the only
light and nothing occludes it. The night frame came out a black void with one lit island at the
suit. The floor now walks with the day.

**And three things found on the way in.** `PATCHNOTES.md` had carried committed merge markers since
`f434e3b`, with both sides wanted and neither chosen. The base's «выброс» halved the air whether or
not anyone was aboard, so a base founded and left became a ruin - a store of air is a store *for
people*, the rule that already governed the atmosphere leak and the fire's term on an empty base.
And the desk's «seen» mark was written to the save through `|0`: `Date.now()` has not fitted in 32
bits for decades, so the mark was stored as a different number, negative for half of every 49 days
- which is why its own suite went red by the calendar rather than by the code.

---
## 0.419.3 - a bulletin is a story, not an inventory

The feed used to say «Коммуна объявила обряд „регата“» and stop there, so the player never
learned that the fair is −18 % on one station in eight, that the strike leaves only the fuel
pump open, or that the swarm eats whoever stands still. Every one of those consequences was
already computed by the mechanic families (`12ax`–`12b1`); the bulletin simply did not say so.

`src/12an-chron-news.js` turns each chronicle record into a three-part note: what happened, in
detail the record does not carry but can be derived (the system's name, the pretext, the outcome
of an arc); what it means for you, with the real number and the real span; and a closing line in
the power's own voice - the only part allowed to lie, and all six lie differently. Nothing is
stored: the note is computed from the record and the bulletin number, so it is the same for
everyone, needs no network and costs nothing in the save. Variety comes from combinatorics -
three parts times three or four variants times six voices.

On `war.html` the headline became a rubric («РЕГАТА · КОММУНА») so it no longer repeats the note
under it; in the game the ether block in the cantina carries one note per bulletin. Suite:
`tests/91zzzw-news` - every kind of record is told, no unfilled template survives, and the span
in the text is checked against the family's constant, so shortening a fair breaks the test
instead of lying to the player.

---
## 0.419.2 - the mark of the open сводка stopped disappearing

`drift_war_v1` holds four things with four owners: the chronicle's state cache, the ledgers, the
circulars and — since 0.419.0 — the marks that say which ledger is only a snapshot of a сводка
still open. Whoever writes his own field must carry the others over, and `chronSave` carried the
ledgers and the circulars but not the marks: the mark died on the first save of the state, and the
snapshot became «closed forever» again, which is the very thing 0.419.0 set out to stop. A suite
now writes all four into the key and checks that saving the state leaves the other three alone.

---
## 0.419.1 - the old cache is not a cache, it is another history

Found on the live site minutes after 0.419.0 went out, in one tab: `chronHash(CHRON_BASE)` and
`chronHash(chronReplay(1000,null))` disagreed — a state carried over from a cache written by the
previous build, which had been computed without the chronicle's lines and therefore without
grievances or incidents. A cache like that is never rebuilt on its own: it is only invalidated
when a ledger arrives for a сводка it already covers, so a client could keep arguing with its
neighbours for days. The cache record is now `v:2`, and `v:1` is not read at all — a replay from
zero costs milliseconds, and it is the same history for everybody.

---
## 0.419.0 - M423: the log told the truth, the drones went back to work, and the chronicle stopped drifting

The author, 08.09.2026: «а посмотри мои логи в игре». Four days of `~/drift-data/crash.log`: 116
lines and not one real crash — but a hundred of those lines were the game talking to itself, and
behind the noise stood three defects. All three are fixed here, each with a suite that fails on
the old code.

**The ship's journal is not the error log.** Since 0.359.0 a hook in `28-loop` posted every `warn`
line of the journal to the server: «просто пиши всё, потом разберём». We разобрали. A drone in
the dock, pirates digging into a sector, a управляющий grumbling about his bare percentage — news,
not trouble, and a real clue was no longer findable in that wall. The hook is gone; `logShip`
(`01a-crashlog`) writes the journal line and posts the letter in one call, and it is used by the
eight places that mean a defect: storage refusing to write, a save that would not assemble or fit,
the cloud gone stale, conflicting or too large, and the chronicle disagreeing with the majority.
Suite `91zzzzzz-crashlog` reads the build itself: exactly one place in it may post the journal.

**A repaired drone is a healthy drone.** Wear was counted over the whole life of the machine —
`d.trips`, which never resets — and a drone's circle is 25 to 240 seconds, so one offline day the
loop catches up adds more than a thousand circles. After a week the break chance had climbed from
1.5% to 11–15%, and eight minutes of dock ate the shift: the author entered the game to find eight
of his thirteen machines standing at «Лухаара», three sessions running. Wear now counts from the
last repair (`d.wear`, zeroed where the loop repairs), while `d.trips` stays the machine's service
record. Suite: five days of catch-up, thousands of circles, and the break chance stays where a
healthy machine's is.

**How the chronicle could diverge at all.** It could not, by design: `step()` is integers only, the
seed is one for everybody, and replaying сводки 0…N gives the same galaxy byte for byte. But the
disk cache did not store the chronicle's own lines, and the lines are not decoration: `chronGrudge`
counts a power's grievances over the last 24 сводки from them, and the mechanic families read
incidents up to 40 сводки back. A client rising from cache stepped on with no memory of either and
walked into its own history; a client opening the game for the first time replayed from zero and
walked into another. That is the whole of «Летопись разошлась с большинством», which had fired on
every release from 0.376.0 to 0.418.0. `chronSave` now carries the tail of the lines
(`CHRON_LINE_KEEP`, wider than the longest span that reads them), and a new suite replays 400
сводки from zero, from a disk cache written at 200, and from two landings in a row: one hash.

Three more repairs around the same report, so it can be trusted next time:

- The verdict is counted **per game version** (`war.php`, buckets under `v`). The rules of the
  chronicle change with releases; a build that follows new rules is not a minority, it is a
  different history, and it used to be told off for it forty releases running.
- **No verdict below a quorum of four**, and a tie is agreement. A lone first report used to agree
  with itself, and the second, different one was declared a minority at 1:1.
- The read-modify-write of the hash ledger now runs **under `flock`**, so simultaneous reports stop
  overwriting each other along with the evidence.

And the ledger of the **open** сводка is marked as what it is — a snapshot. It used to be filed
next to the closed ones, so `since` stopped asking about that сводка forever: the client kept half
of other people's deeds in its replay while a neighbour who arrived an hour later got the whole of
it. Marked provisional, it arrives a second time, closed, and the hash for a сводка still held as a
snapshot is not reported at all.

---
## 0.418.0 - M422: the thumb goes anywhere, and pulling back is the brake

The author on the phone: «управление на мобилке говно… из любого места на экране пальцем
двигаешь и корабль туда летил… коротко назад он тормозит… за пальцем идёт широкая полоска,
чтобы понимать как оно». M410's idea was right — the stick says «fly there», not «push there» —
and five numbers around it were wrong.

**The stick is born anywhere on the canvas.** The left half was the whole rule before, so a right
hand could not reach the helm at all. A finger becomes a stick by moving 10 px or by lying still
past 420 ms — outside the 400 ms tap window, so a tap is still a tap on both halves: autopilot to
a planet, lock on a hull, the compass chips. Two fingers still pinch; the waiting finger steps
aside for them.

**Its centre runs after the finger.** Drag 250 px and the way back used to cost 250 px of thumb.
The centre now trails 82 px behind, so the way back always costs the same 82 px — «коротко назад»
falls out of the geometry instead of being a gesture of its own.

**Pulling back is the brake, and the brake is stronger than the throttle.** Thrust against the
nose went through maneuvering jets at .4: braking by pulling back took 4.1 s, while simply
resting the thumb in the dead zone took 2.3 s — the one correct guess about a phone, punished.
Braking now takes the same road as the dead zone and the ТОРМОЗ pad, regardless of where the nose
points: a full stop in 1.4 s against 1.6 s to full speed. An empty energy bar does not weaken it.

**The nose no longer spins while stopping.** It used to swing 180° to follow the thumb, and
halfway through the turn the physics jumped from maneuvering jets to the main engine. While
braking the nose holds the course; a locked mark still owns it, as before.

**A released stick always coasts.** One gesture with two outcomes depending on speed read as «the
ship sometimes brakes by itself». The .55 rule stays with mouse and arrows.

**And the drag draws a ribbon.** Its body is the wanted velocity — length and width; the fill
inside it is the actual one, so you watch the ship catch up with your thumb; its colour turns
amber when you are braking, and the dead zone becomes a «СТОП» ring that drains with the speed. A
tail follows the finger, and the same vector is drawn short at the ship, where the eye already is.
The camera also walks the ship out from under the thumb when the finger lands on top of it.

Taking a hull into the lock now costs 44 px of miss, not 40 — the interface's own finger rule,
which the helm had quietly undercut. `15a-helm` split at 40 KB: the drawing half moved to
`15b-helm-draw`.

---
## 0.417.4 - the war page speaks lore, not engineering

The lead on `war.html` talked about seeds, servers and code. It now says who holds what around
Yalta, that a bulletin reaches Yalta every six hours, that weapons are sealed there and peace is
signed there over lunch, and that the six waves tell the same story as their own victory. The
panel's «Последние двое суток» repeated the feed under the map word for word and is gone; the
panel is «Ведомость», «Войны», «Что идёт сейчас». The feed's truth option reads «летопись».

## 0.417.3 - the war map is a nebula, and the feed sits under it

The map was a checkerboard: flat squares, hard seams, identical dots. Holdings are now drawn on a
layer and blurred twice (a wide veil and a tighter core) so each power is a body with a soft edge,
cached per bulletin and width; seams between neighbours are a faint dark line, fronts still burn.
Stars vary in size by seed and unowned ones sit back. The page is a two-area grid — map over feed
on the left, the six powers on the right — so the column under the map is no longer empty; on a
phone it stacks map, panel, feed.

## 0.417.2 - the war page reads like a person wrote it

`war.html` loaded the whole «кто куда когда» feed at once — four hundred lines, a seventeen-thousand-pixel
page. Now it shows the last eight bulletins (two days) and a «ещё двое суток» button adds two more days
at a time. The truth lines were database fields («Компания: эмбарго», «Хай-Фронт заняла … была у
Рассвет»); `war-map.js` now declines the six powers (gender, genitive, dative, instrumental) and
phrases every event kind: «Хай-Фронт отбил у Рассвета «Раий»», «началась экспедиция Рассвета»,
«у Орднунга забастовка». The panel's sub-lines («на исходе · с 4 сен») were glued to the text
without a space — `.li s` is a block now. Game code untouched; the chronicle hash is the same.

## 0.417.1 - the guard reads the prose too

The control-character scan of 0.416.0 covered `src/` and `tests/`. It should have covered the
documents from the start: the two survivors it could not see were in `PATCHNOTES.md` and
`PLAN.md`, and both sat inside the sentence that **describes this very bug** - «`/кр\b/` never
matches» - carrying a raw 0x08 where the escape belonged, so the sentence read as garbage in the
one place a reader would go to understand it. Repaired, and the scan now walks `PLAN.md`,
`PATCHNOTES.md`, `CLAUDE.md`, `README.md` and every `docs/*.md`. Verified by planting a byte in
`docs/DESIGN-arc.md` and watching the build name the file and the line.

These documents are read every session; an invisible byte costs more there than in code, where at
least a regex will fail loudly enough to be chased.

---
## 0.417.0 - M421: the whole parrot, once a second, for forty-four pixels

While measuring the bakes for M418 I timed the console's perch icon and left it alone because it
was not the freeze. It is still a real cost, and now that the log is quiet it is the loudest thing
left: **the console refreshes once a second, and every refresh redrew the entire procedural
parrot** - the whole of `12y-parrot-face`, quills, plumes, scales, beads - into a 44-pixel icon.
Measured in a live browser: 4.9 ms warm on this desktop, so roughly twenty on a phone, once a
second, for as long as the player owns the bird.

At that size the pose does not read at all. The icon is redrawn every five seconds; in between,
the canvas simply stands, which is no work rather than fast work.

Pinned by counting **calls, not milliseconds** (the harness has no clock): eight console refreshes
in a row must produce one draw, and one more after the interval. Verified the way every guard
written since 0.416.0 is verified - by planting the failure. With the throttle removed the suite
reports nine draws where it wants one.

One nicety the test itself found: a world whose clock has restarted (`G.t` below the last draw's
stamp) redraws at once, or a new game would show an empty perch for five seconds.

**And the throttle shook a real bug out of the bird.** Slowing the icon's redraw changed which
suite ran with the parrot mid-gesture, and «трепло: репертуар» went red on `bow` - it asserts that
at rest every degree of freedom is zero, but it was reading live module state that `resetWorld`
does not touch. Repaired into two checks that are about different things: the *declared* rest is
read out of the `PAR` table in the page's own source, and the *return* to rest is measured by
clearing the gesture, muting new ones and letting the springs settle.

The second check failed on its first honest run, on the phone tier: **`PAR.turn` never decayed.**
It was not in the decay list at all - the gestures that use it zero it themselves, one explicitly
at the end and two by ending on a bell curve. That holds only while a gesture runs to completion;
interrupt one (close the window, reset the world, clear `act`) and the bird stayed turned for
ever, at 0.55 of a full turn. It decays like everything else now, before `parActs`, so a running
gesture still overwrites it on the same frame.

Full tier green: 17822 full / 17541 browser / 17631 phone / 11859 node over 788 suites, plus two
long fuzzer runs on different seeds.

---
## 0.416.0 - M420: the byte you cannot see, and the last suite that claimed milliseconds

Two consequences of 0.415.0's finding that the harness has no clock, and one of them bit me while
I was writing the guard against it.

**The only suite in the repository that asserted milliseconds was mine**, in `91zzzw-fx`: «шестьдесят
сводок с курсом считаются мгновенно», `Date.now()-t0<3000`. Vacuous - always true, catching
nothing. What it was actually guarding is worth guarding, so it now counts **work**: a wrapper on
`chronReplay` proves that sixty chronicle steps do not each trigger a full replay. That is the
failure it was written for, and now it can see it.

**And a guard was added so no suite can claim milliseconds again** - it reads the page's own
source, finds every time comparison, and fails if one sits inside `ok`/`eq`/`near`. Waiting on a
clock stays legal: between `setTimeout` calls virtual time does advance, which is why `99-run`'s
wait for the first frame is correct and must not be flagged.

**Then the guard came out green, and it was lying too.** Written through a shell heredoc, its
`\b` had been eaten and replaced by a literal 0x08 byte, so the regex read «backspace, then ok»
and matched nothing, ever. This trap is written down in `CLAUDE.md` - it has cost this project a
green-looking regex before - and the rule still did not stop me, because a rule that is only
prose is checked by nobody.

So it is checked now. `build.ps1` scans every source and suite for control characters other than
tab and newline and names the file and line:

    ! управляющий символ в исходнике (съеденная обратная косая? см. CLAUDE.md): 02-world.js:2 0x08

Verified by planting one and watching it be found. A sweep of everything touched today turned up
no others in code; the two in `PATCHNOTES.md` and `PLAN.md` are older prose *describing this very
bug* and carrying it - left as they are, since they are quotations of the accident.

Full tier green: 17811 assertions over 787 suites.

---
## 0.415.1 - two notes from the parallel session, both right

- **The probe took the press only when it could afford it.** `probeClaim` returned whatever
  `probeBuy` returned, and `probeBuy` returns false on an empty account — so on a poor ship the
  same press produced «Зонд стоит 900 кр» *and* «ЦЕЛЕЙ НЕТ», one over the other, in one frame.
  What claims a press is the fact that the probe was on offer here, not the luck of the purchase.
- **The walk hint was a third prompt line in every compartment, every time.** It is teaching, and
  teaching ends when it has been used: it now disappears the moment the player takes their first
  step inside the base, not after a timer. Two lines again.

Both found by the session working the war layer in a parallel worktree, reading the frame rather
than the diff. `site/war.js` joins this and every later commit of mine, at that session's request:
the deploy rebuilds it regardless, but the repository should not disagree with the site.

---
## 0.415.0 - M419: what the oven does in one go, and the harness has no clock

M418 found a 383 ms synchronous bake that had been in the game for three hundred versions. Nothing
caught it: the tile came out correct, no frame crashed, no exception was thrown. The game simply
stopped for a moment, which is not a thing any suite was looking for.

`tests/91zzzzy-bake` has measured the oven since M358 - how much raster the game holds and how
often it re-bakes - but never **what it does in one go**. That is the gap, and it now holds one
property: every heavy bake has either a budget or speed. The new suites assert that a cold ask for the ground material bakes *no rows at all* (it
queues), that one slice is bounded, that the budgets are declared as numbers rather than assumed,
and that the synchronous path exists only for stands — `planetMatNow` must not be called from
anywhere in `src/`, checked against the page's own source the way the names net checks that a perk
without code is a lie.

**And writing it turned up something that invalidates a whole category of test.** The net's first
draft asserted milliseconds. It passed - and then kept passing when it should not have. The
harness has no clock: `test.ps1` runs Chrome with `--virtual-time-budget`, and inside a
synchronous block time does not move. Measured: thirty million square roots between two reads give
`performance.now()` 0.00 ms and `Date.now()` 0 ms.

Two consequences, both now written into `CLAUDE.md`:

- **any suite asserting «this took under N ms» is vacuous there** - not flaky, always true;
- worse, **code that paces itself by the clock degenerates in that harness to doing everything at
  once.** `matTick` did exactly that: with a frozen clock its «until the budget runs out» loop
  never ran out, so the tests exercised the whole-tile bake - the very path M418 removed - while
  the real browser ran the sliced one. The suite was testing a code path no player ever executes.

So the bake is now capped by *work* as well as by time: `MAT_CAP=8` rows beside `MAT_MS=3` ms. In
a real browser the clock stops the slice first (two or three rows) and the cap never binds; where
the clock is frozen or coarse, the cap does. The net asserts the cap, because that is the part it
can actually see.

`test.ps1:90` already counted its seconds outside the page for this reason. The knowledge existed;
it had just never been carried across to what a suite is allowed to claim.

Full tier green: 17789 assertions over 781 suites.

---
## 0.414.0 - M418: the freeze had a cause, and it was 383 milliseconds of noise

0.413.0 cleared the crash log of its own false alarms and left one real line in it: **2766 ms on
a Pixel 8, nine seconds into the page, mode `system`.** This is that stall, found and measured
rather than guessed.

`planetMat` - the planet's ground material, a 256×256 tile with two to five multi-octave noises
per pixel - runs **as one synchronous block, and it takes 383 ms on this desktop.** Measured in
a real browser, not under virtual time. On a phone that is comfortably two to three seconds:
exactly the stall in the log, at exactly the moment the world first needs ground.

It is now baked the way the game already bakes the planet's own texture (`planetStripTick`,
`07-planet`): sliced into rows, a couple of milliseconds of each frame, and until it is ready the
ground is drawn *without* it. Nothing disappears - every caller already handled a missing
material, because `drawGround` falls back to a flat silhouette fill and `drawRocks` to a boulder
without rock. For the first second or so the ground has no grain. That is the whole cost.

**The budget was measured, not decided.** The first cut checked the clock every eight rows: one
slice measured 11-14 ms, i.e. the entire frame, so a single freeze became thirty-three stutters -
worse, not better. A row costs about 1.4 ms here, so the clock is checked every row; the worst
slice is then 6.2 ms and the median 4.6, across 108 slices. And because the budget is in real
milliseconds, it scales itself: a slower phone does fewer rows per frame and takes longer, but
never blows a frame.

Two things the pinning suite caught while being written, both real:

- **a stale job blocked every later one.** `if(!MAT_JOB)` meant that once a bake was in flight,
  asking for a *different* planet's material returned null for ever - the player standing on a
  new world would never get ground grain. The newest planet asked for now wins.
- **`docs/shot.py` came out without grain**, because a stand runs six frames and six frames bake
  twenty rows of two hundred and fifty-six. Stands and suites pay the 383 ms in one piece through
  `planetMatNow`, which exists for exactly the places where there is no frame to spread across.
  The frame meter on `surface` reads identically to before the change - 4 tones, pair 7, contrast
  .55, mass 11, empty 40 - which is the proof that nothing about the picture moved.

Full tier green: 17782 assertions over 781 suites; browser and phone tiers too.

---
## 0.413.0 - M417: the instruments that lied

`PLAN.md` has carried one line for weeks: «The author's freeze has no cause yet… Next step is to
read `crash.log` after the next freeze.» So I read it. Seventy-eight entries, and this is what
they were:

| kind | n | what it actually was |
|---|---|---|
| `journal` | 70 | «Летопись разошлась с большинством» - a false alarm, every single time |
| `stall` | 2 | one real 2.8 s hitch on a Pixel 8; one 11.7-minute «stall» that was a hidden tab |
| `probe` | 4 | |
| `beat` | 1 | «fps Infinity» |
| `outside` | 1 | |

**Three instruments were broken, all in the same way: they fired always, and so meant nothing.**

**The frame-stall detector counted a hidden tab as a freeze.** The guard did carry
`&& !document.hidden`, but it asked at the wrong moment: `requestAnimationFrame` wakes up *after*
the tab is restored, so by that line the tab is visible again and the gap it measures is the whole
time it spent hidden. That is where «кадр стоял 701631 мс» came from - eleven and a half minutes
of a minimised window, filed as a freeze, in the log kept specifically to catch a freeze. The
hidden period is now remembered *when it happens*: a `visibilitychange` handler clears the frame
mark, and the first frame after a return is not measured.

**The fps pulse had never measured anything.** `frameLastAt=now` sat one line above the
accumulator, so `now-frameLastAt` inside it was always zero: the sum of frame times never grew,
`1000/0` went to the server as «fps Infinity», and the server stored it as 0. The whole
«measure what players actually see on their own phones» instrument had produced exactly one row
in `digest.json` - `{"0.360.0 system desk": {"n":1, "avg":0, "min":0}}` - since the day it
shipped. It now counts from the previous mark, like the stall, and refuses to send anything that
is not a finite number in range.

**And the third is not ours to fix, so it was reported with the proof.** «Летопись разошлась с
большинством» fires on every load. The live tally on the server for сводка 995 is
`{"h":{"3714082066":22}}` - one hash, twenty-two agreements, i.e. *everybody agrees* - and the
server still answers `agree:false`. `site/war.php` writes the client's hash string as an array
key, and PHP casts numeric string keys to int; `array_key_first` then returns an int, `$h` is
still a string, and `===` is strict. Verified on the host itself: `$top === $h` is `false`,
`(string)$top === $h` is `true`. The chronicle has, as far as this instrument can tell, never
diverged - and 70 of the 78 log entries were this.

What is left in the log once the noise is gone is the one real thing: **2766 ms on a Pixel 8,
nine seconds in, in system mode, right after «В вещах нашлось живое: трепло «Пискля»».** That is
the first honest lead the freeze hunt has ever had, and it is written down here rather than
chased on a hunch.

Guarded by three suites in `91zzzzzp-clocks`: the previous mark is taken before it is
overwritten, the pulse counts from it, and nothing that is not a finite number is sent.

**A fourth clock-dependent instrument, found the same hour and in our own suite.** «база M408:
реестр считает всегда» went red on a change that had nothing to do with ПАЛАТА: it took the shift
number from `baseShift()` - i.e. from the wall clock - and then called `palStep(B, n+3)`. When
that window happened to land on the middle of the reporting period, the inspector arrived with his
fine and «пеня 180» read «300». The suite was red because of the time of day. `bShift(k)` in the
base helpers now returns the current shift *aligned down to a multiple of k*, so the absolute
number still tracks now (a test that resolves from `B.t0` to `Date.now()` needs that) while the
position inside every schedule is pinned. The rule is in the helper's own comment: a suite that
does arithmetic on a shift number takes it through `bShift(X)`; bare `baseShift()` is only for a
number that goes no further than a journal line.

Full tier green: 17770 assertions over 779 suites.

---
## 0.412.0 - M416: the pacing guard, and the line that could arrive on day one

P8, the last craft law that was actually blocked rather than a fork. Its own contract forbade
building it before the first ending of the second act existed; that has been true since 0.216.0,
and the guard was still waiting. It is built now, and the wiring found exactly the fault the law
was written to prevent.

**Part VI's «Вы просто не тянете» had no window at all.** The heaviest line in the game — the one
man who says it to your face, once per game, and whom the game confirms with nothing because he
is wrong — was unlocked by three shut doors and nothing else. Three doors can be shut in a first
evening. It could arrive before anything had been lived: the textbook case of what Emily Short
calls the disease of salience architecture, a player satisfying an ending's preconditions more or
less by accident.

It now needs its three doors **twenty sky-days apart** and **two hundred days lived**. A shut door
is a deed; three of them in one evening is a bad evening, not a life.

`src/11d-clocks.js` executes the contract in `docs/DESIGN-arc.md` word for word: `CLOCKS` is the
one table where every ending's window is declared, a segment advances only on a named deed and
only after the minimum gap, and **the guard writes nothing** - no line, no journal entry, no hint
that a window exists. It only withholds. Preconditions met early simply wait.

The other two endings keep their numbers exactly: the medical board (twelve years of стаж, the
core counter) and «Тихоня» (five deeds in the kindness ledger, a year, a home). The yacht's clock
*reads the ledger* rather than keeping a second count of the same deeds - two counts of one thing
drift apart in about ten versions.

The point of a table, though, is not the three rows in it. It is that a fourth ending cannot be
written without one, and `tests/91zzzzzp-clocks` fails if it is. That suite also pins the parts
that are about what does *not* happen: fifty observations advance no clock, the guard leaves
`G.msg` and the journal untouched, and a corrupt save cannot inject a segment. `91zzzx-late`, the
suite that used to reach part VI by shutting three doors on day zero, now has to live the life.

Full tier green: 17756 assertions over 776 suites.

---
## 0.411.0 - M415: the split debt, and two guards that stopped crying wolf

The four biggest modules were past the size the build records for them, and the plan has carried
them as named debt since 2026-08-25. Cut along the seams the audit already named - nothing moved
that was not already a separate thing:

| module | was | now |
|---|---|---|
| `12ai-fleet` | 58 KB | 27 + `12ai1-fleet-art` 33 - the sprite conveyor, house makers, trade glyphs and the lit hull knew nothing about passes, fuel norms or call-signs |
| `26-ui-station` | 67 KB | 41 + `26e-ui-station-trade` 26 - board, market and yard were the last three tabs still inline; the other five have lived in `26b`/`26c` for versions |
| `21e-surface-draw` | 60 KB | 18 + `21e1-surface-world` 43 - `drawSurfaceWorld` is the world, the rest is the frame around it |
| `14-save` | 70 KB | 44 + `14a1-save-rest` 27 - `applySave` splits in exactly one place, where no local crosses the border (`seen` ends earlier, `pn` too, `st` is declared past the seam) |

**And two guards that had started to lie.**

`build.ps1` warns about a module past its recorded size, and the record was last taken on
2026-09-02; by today it was shouting thirteen names every build. A guard that always shouts is
not a guard - the note in the table says so itself, from the last time this happened. The
measurements are retaken, so silence means «not growing» again. `21e1-surface-world` is recorded
at 43 KB with its own next seams named in the comment (the mine mouth, the tracks, the night):
it is one 590-line function, and splitting a coherent function on a byte count would be worse
than carrying it.

The ghost guard - `typeof foo==="function"` around a name nothing declares, the pattern that
turned `mgrHire(mgrRoll(...))` into a silently empty screen - was reporting two names on every
build, and both were noise: `addEventListener` is a host global, honestly guarded because the
Node tier has no DOM. It now knows the browser globals by name, and shouts only about ours. The
one real ghost it was hiding, `stat0Gun` in `05-parts` (`const st=(typeof stat0Gun==="function")
?null:null` - both branches null, the variable never read), is gone.

Full tier green: 17722 assertions over 772 suites.

---
## 0.410.0 - M413: the base scene reads

The same review that produced 0.409.1 ended with six notes about the base scene. None of them
were about rules; all six were about a frame you have to decode instead of read. Fixed together,
because they were one fault in six places: **the frame was saying things in the wrong register
and in the wrong place.**

- **The entry journal lay across the top row of the base.** «What happened while you were away»
  is why the player flies here at all (§12), and it was printed through `say()` — centred, at a
  quarter of the height, i.e. exactly over the grid. It now has its own card in the free sky at
  the right, under the header, and fades on its own. The walk hint that followed it moved down
  to the prompt, where every other «what can I do here» lives, and is shown once per session.
- **The prompt had grown to five lines** and covered the bottom row. Energy, store and forecast
  are the base's *state*, not an answer to a keypress: they moved to the instrument board. The
  prompt is two lines again - what is under the cursor, and what the button will do.
- **The gauges were three-letter stumps** - ВЗД, ВОД, ХРЧ. There was room for the words all
  along. The board is now the base's one instrument: four gauges by name, a rule, and under it
  the three numbers the prompt used to carry.
- **The ГЛАВТРАССА pennant was the loudest patch in the frame** - full-strength red the size of
  half a compartment, hanging in mid-rock, in a scene that is otherwise brown and turquoise
  under one light. It gives nothing and should demand nothing: a quarter the size, hung by the
  gates, and lit by the same light as the rock.
- **The shaft read as an empty grey square** - a dark fill, an outline at 0.14 and ties at 0.10,
  a body with no detail anyone could name. It is a shaft now: a depth gradient, two rails with
  a highlight, a cable to the cage, rungs up the left wall, numbered levels, and a cage with a
  floor, a handrail, a door facing the compartments and one lamp that throws a cone at its feet.
- **The adjacency pipes were too faint to read as connections.** A pipe is a body and a
  highlight, not a line: a dark bed against the rock, a coloured top that names it, a coupling
  at the middle.

**And one real fault the pass uncovered.** Stepping into the shaft hit an early `return` that
was meant to drop the cursor and dropped everything after it: pipes, frost, the emergency marker
and the whole instrument board. From the lift, where the base is seen whole, the player could
see the least. Only the cursor goes now.

---
## 0.409.1 - the base queue read back, by another pair of eyes

A parallel session read M390-M409 and the war queue against the design docs and sent three
letters. Fifteen of its findings were real; this version is all of them, plus the ones my own
new pinning suites turned up while fixing them. No new mechanics - every change here makes an
existing rule true that was only written down.

**The base layer.**

- The director rolled twice: `baseEventAt` decided an event, and `baseEventApply` rolled the
  same probability again, so a forecast could name a raid that never came. `force` now removes
  the probability roll and nothing else - the *place* checks (a raid needs danger, a storm needs
  weather) survive, because forcing them let storms onto gas worlds.
- A deep catch-up (over 72 shifts) only mined: nobody ate, nobody paid, nobody burned. It now
  runs `baseLifeBulk`, `palStep` and `baseRuinCheck` too, so a base you left for a fortnight can
  be found dead, in debt, or a ruin - the states it could always reach one shift at a time.
- **Numbers on a base are bought, and the stock receiver never buys them.** `baseSharp` keyed on
  `instrQuality("radio")>1.05`, but a per-instance spread (`.85+r()*.3`) and the hull's
  profession push the stock `kazenny` past any such threshold: everyone had digits from the first
  minute, and "most of them fly on adjectives" stayed a line in a header. It keys on the *works*
  now - a receiver better than the one the yard fits, and not worn out - or on a radist. The
  СВЯЗЬ report obeys the same lever instead of printing figures of its own.
- Fire on an emptied base spread for ever with nobody to fight it. It still walks, and it dies
  after three shifts alone (`FIRE_ALONE`): nothing left to burn.
- Ice was counted twice - once into the store, once as water. It goes to the store, and water
  comes through the melter.
- Turnover never accumulated: `baseCollect` moved goods and told nobody what they were worth, so
  the manager's cut and ПАЛАТА's share were always taken from zero. It now sums by `RES.price`
  into `_turn`/`_earned`, and those fields (with `spend` and `devSaid`) are in the `14-save`
  whitelist - without that a reload zeroed both the share and the day's building cap.
- **Deregistration was a dominant strategy**: 800 credits once and the joke was over for good,
  with the base working exactly as before. A plot outside the register is a plot the counter
  will not take goods from: output at `PAL_OFF` (.55), no foreign hulls on the pad, never a
  forward post. Silence costs tempo.
- A ПАЛАТА inspection arrived with a fine and no warning, though the comment claimed it was
  announced. Four shifts before, the journal writes a line the player can read over СВЯЗЬ.
- A seized plot came back for free: `21b0` knew squatters and pirates but not the registrar.
  Buying it back costs the debt plus the closing fee.
- The manager left on the first unpaid shift - come back from a week's run with an empty account
  and he is gone, learned about afterwards. Unpaid wages accrue like a hired hand's; he leaves
  after four shifts without money (`BMGR_DUE`).
- «Не спрашивая» is the point of a manager who builds, but with no ceiling a decent one bought
  four reactors in a day and the player's first thought was theft. 9000 credits a day
  (`DEV_CAP`), and the first time he does it he says so out loud.
- `theOneId` ran four thousand rolls with a name generator on every `resetWorld`, because its
  cache lived in `G`. He is a property of the galaxy, not of a world: the cache is on the module.
- **The base refuelled below any counter, for ever.** One ice gave two fuel; ice costs 7 on the
  counter and fuel 5-12, and ice can be hauled *to* the base. That is not "at cost", that is a
  pump. One to one - the blockade is what makes the base's counter matter (§43), not the price.
- Minor: a raw newcomer could steal on his first shift; `dialLeak` applied twice; a person could
  not be moved between posts inside one base; `avrRoll` was seeded off wall-clock seconds.

**The war layer.** A power's warship attacked the player instead of its enemy (`npcFoeFor` now
picks a target among other NPCs when `p.iff` is set); `fleetFire` shot at dummies, envoys, powers
and friendly hulls; `riteLoanSettle` paid out for silence rather than for the deed, and now
compares the issuer's holdings against `G.bondHold`; `natSwarmTick` read `st.maxSp`, which does
not exist, so the swarm's speed was `NaN`.

**Three regressions my own new suites caught while fixing the above** are worth naming, because
they are the same shape as the bugs they were fixing: forcing the director bypassed the place
checks; the ice test still asserted the old double count; and the empty-base fire branch stopped
the fire spreading at all instead of letting it burn out.

---
## 0.409.0 - M409: the expedition names your base, and the base queue closes

The expedition of `11x-expedition` states its own honest cruelty in its header: «Игрок не герой
экспедиции. Он — один из тысячи рук.» The base is the one thing that changes it.

An expedition into the far dark cannot be mounted from stations alone: it needs a **forward post**
on the way out — a pad, a mast, housing, closed life support, at least two people living there, and
standing beyond the ninth ring rather than in the comfortable middle. The world has candidates of
its own, all mediocre. If yours qualifies, the circular names **it**:

> «…опорный пункт экспедиции — участок «Тишина», БЗ-417, система 12:3. Всем бортам: приём и
> заправка там.»

And it is paid for in the only currency that arc accepts. The world's traffic reroutes through your
pad: a ship lands every few shifts, pays for reception and refuelling, **and eats from your stores**
— so the reward is not a prize you collect but a place that is suddenly busy, and busy in your
name. Run the food down and nobody lands, because there is nothing to feed them with. Your call
sign is said on a channel you did not pay for, for sixty days.

With this the base queue **M390–M409 is closed**: the shift and the journal, four stores, heat and
the planet's formulary, adjacency and halls, the director, the аврал, the charter, ruins, the
payoff, the hundred управляющих and the one, the ПАЛАТА — and, at the end of it, a place the whole
world flies through. Full tier green: 17 571 assertions over 756 suites.

---
## 0.408.0 - M408: ПАЛАТА — the register, the fee, and the notice that arrives anyway

The deadpan law is withdrawn on the author's instruction and the joke is played to the end. What
replaces it is a craft rule, because loud comedy fails faster than quiet comedy: **the absurdity is
always bureaucratic logic taken seriously to its conclusion, never a joke from outside the world.**
The ПАЛАТА is funny because it is *consistent*, and the player laughs at an institution that is
sincerely doing its best.

Six of §28's eight instruments now exist. **Участковый сбор** is charged per period **per registered
site** — while the base is parked, while it is buried, while it is a ruin, because it is a fee on
being in the register and not on producing anything. **Доля с оборота** takes one percent of
everything above a threshold, so success raises the bill by itself. **Сводка** is due every forty
shifts and is filed by a радист or a управляющий; nobody files it otherwise and the пеня compounds
quietly in a place the player is not looking. **Проверка** arrives mid-period; the inspector is
polite, competent, has a name, is promoted every nine hundred shifts, and finds something. There is
always something: «Форма 1-ПРИЛ, лист 3 из 2: перечень листов».

**Режим** is the real strategy and a direct lift of choosing your tax regime: **простой** (tiny fee,
one drill counts, no hired hands, and genuine peace), **патент** (expensive, known in advance, no
share of turnover — the regime of a solved base), **общий** (small fee plus the share and
everything else). It can be changed no oftener than every two hundred shifts, and the default is
общий, because of course it is.

And §30's harshest line, now true: **abandoning a base does not close it.** A ruin stays in the
register and keeps billing until it is deregistered for 800 credits — or until the debt reaches nine
thousand and the ПАЛАТА seizes the site, moves in, and encloses an inventory.

---
## 0.407.0 - M407: he builds and develops, and that is where the trap is

A hired keeper stops a base idling. The real one **develops** it — every few shifts, out of your
account, without asking: he repairs what is broken before he builds anything new, puts up what the
planet's formulary demands (a радиатор on a hot world **before** a second drill, a second reactor
on a cold one), orders ice and food before the stores run out rather than after, and refuses to
grow past what the place can hold.

And here is the trap the whole hunt exists for: **everybody builds.** The bad ones build too, with
the same money, on the same schedule. The difference is only in *what* goes up — the bad one works
down the same list from the wrong end, so the third склад stands where the радиатор had to be, and
it is built, and it is paid for. It does not read as an error. It reads as a base that is quietly
wrong for forty shifts.

The three flaws that needed building now exist: **строит не то** (the list, reversed), **боится
глубины** (the lower row simply does not exist for him — the best ore is never touched), and
**паникует** (perfect until the first fire, then half the store goes on a scratch). With M405's
three, all six of §34.1 are wired.

Found here: `baseLifeNeed` returned air and water and no **food**, so anything asking for
`need.food` compared against `undefined` and silently did nothing. The supply routine did exactly
that, and the suite caught it on the first run.

---
## 0.406.0 - M406: the hunt — he does not advertise, and he moves

The hundred stand at counters selling themselves. **The real one does not.** He is working
somewhere, and a player who only ever interviews at counters will meet the best of the fakes and
nobody else — which is the trap the whole layer is built around.

He is a **function of time**, not a record: where he is at any shift is computed from the seed and
the shift number. His route is a chain of jobs a few hundred shifts long each, always at a real
station, and he works whether you are looking or not. That is the whole difficulty of the hunt:
every piece of evidence describes where he **was**.

Two channels carry it, and both were already in the game:

- **Пеленг** on the receiver: a direction and **not one word about distance**, wrong by up to
  fifteen degrees, and the error is its own in every system and every shift — two bearings from the
  same spot refine nothing. Two bearings from two distant systems, taken within a few shifts of each
  other, cross where he is now. That is a real plan: fly wide, listen, fly wider, listen again, draw
  the cross, go.
- **Слух** in the ordinary rumour feed: a region of three to five systems and a **time** — «с месяц
  назад», «прошлой зимой». Half of them are about one of the dozen ordinary-but-famous смотрители
  the galaxy also holds, fifteen percent are simply wrong, and a true one points at a job he has
  already left.

And the accident stands, ungated: **if you walk into the station where he happens to be, he is
standing among the candidates** with the same kind of line as everybody else. Nothing marks him.
The only tell is the one M405 built: he asks about the place before he answers about himself.

---
## 0.405.0 - M405: a hundred управляющих, and one

The whole layer demands the player's attention, and there is exactly one way to buy it back: a
**person**, not an upgrade. About a hundred of them exist in a galaxy; all of them call themselves
управляющий, all have a call-sign and references, all are hireable. One is real.

They are not three buckets but a **curve** (§48): every candidate is a roll, and «плохой ·
сносный · настоящий» are places on it. `q = .12 + .78·r()^2.6` is the whole design in one
expression — the mass sits at the bottom, the tail is thin, and there is no visible ceiling.
Measured over four thousand rolls: 56 % below a third of the potential, 3 % above .85, a real middle
that makes hiring a decent man a permanent and viable strategy, and a flaw on about two thirds.

**The interview has one tell, and it is the only one in the game:** the real one asks about the
place before he answers about himself — what is the heat, is there ice, what does the charter say.
The fakes flatter and agree to everything. Some of the fakes have learned to imitate a question, so
it is a strong signal and never a proof — the suite pins exactly that: every perceptive candidate
asks, most fakes flatter, and a few fakes ask anyway.

A hired man is charged **per shift** in wages and takes his **share** of what the base earns, and
his flaw surfaces only after his own срок of shifts under load. Три of the six are wired here:
**тащит** (the store never matches the drill, by a few percent, forever), **пишет красиво** (the
report from a distance is excellent and the base is not — fly there and see for yourself), and
**молчит** (the journal simply stops). And a bad manager is deliberately **worse than none**: he
pulls his fraction of the base's potential, and most fractions are small.

Not paying him ends it his way: he leaves. Ending it yours costs six shifts of severance, and the
ПАЛАТА will want a form about it too.

---
## 0.404.0 - M404: the craft pass over the base, and Almanac issue V

Fourteen passes of mechanics went into the base and not one of them was drawn: shifts, stores,
heat, the formulary, adjacency, halls, the director, the аврал, the charter, ruins and the unique
output all lived in the prompt line and the desk row. A layer whose whole point is a cross-section
was being read instead of looked at.

**Four gauges in the room** — воздух, вода, харч, дух — as bars, in screen space at the left edge.
Their position took three attempts, and both failures were the same one: put in world space they
were sliced by the frame edge when the camera followed the captain into the shaft, and buried under
the prompt when moved below the grid. They are interface, not an object in the rock.

**The nine adjacency rules are drawn**: a short pipe between two cells that give each other
something, in the colour of what passes along it, and a dashed diagonal between two that harm each
other. The plan of a base stops being a list of modules and becomes a diagram.

**A hall is one room.** M396 merged three identical modules into a зал and the drawing kept putting
a bulkhead between them; the inner walls are gone now, exactly as §7 wrote it, and the outer wall
stays thick so the row still reads as a череда помещений.

**And the heat scale is two-sided in the frame**: a blue cast and frost along every upper edge below
the calm band, a warm haze rising from the floor above it. You know which it is before reading a
word.

Almanac issue V holds all of it against the craft codex, and the frame ledger for «база» is
unchanged and still green — which is the honest reading of what was added: accents and interface,
not new mass.

---
## 0.403.0 - M403: what a solved base pays, and the blockade it carries you through

The rule the whole layer is charging for: **a good base does not print credits — it makes what
cannot be bought.** This economy has already been burned once by the other shape (the солнечная
ферма of M240, where money made money with no attention and no ceiling), so the payoff is built to
that rule and checked against it by the suite.

A **solved** base makes something nobody stocks: техкомпоненты from a volcanic base drilled deep
with a smelter, гидразин from a toxic world's laboratory, криоген where the cold is already
outside, карбид where a heavy world lets the drill reach. One unit every four shifts each — a
handful in a day, a batch in a week. Not income: **supply**.

Here the design contradicted itself and the suite caught it. §23.1 names иридий and ксенобиом, and
both have a **price** in `RES` — any counter buys them. A base making those would print credits,
which is precisely what §23's first line forbids. So the list is built from what genuinely has
`price:0`, and every row is asserted to have it.

**Блокада (§43).** When the war layer closes a system there is no fuel, no repairs, and the nearest
open station is four jumps the wrong way. A base is then the only supply the player controls: at
the ледоплавка or электролизёр you fill the tanks with your own ice (ЦЕЛЬ, two fuel per unit), and
at the мастерская you repair the hull with your own alloy. Both cost the base's stores — the point
is not that it is free, but that it is **yours**. A player with a working base flies through a war;
a player without one is grounded and watches, which in this game is the worse fate.

---
## 0.402.0 - M402: a base can be lost, and can always be got back

Losing a base has to hurt. Losing it **forever** must be impossible — that is §39, and it is
stronger than any drama: nothing is ever deleted from the account, and there is no state from which
a base cannot be restarted.

A base that has genuinely been abandoned — no people, no stores, a full day in that condition —
becomes a **развалина**: what you built stands there broken, and the journal says so. That takes
neglect, not absence: a base you simply flew away from parks itself and waits (§13), and a base
with a single person on it never gets there at all.

After a few shifts somebody moves in — **поселенцы** or a **пиратская застава**, the odds set by
how dangerous the sector is. The outpost is the war layer's target built out of your own walls.

And you can always come back. An empty ruin costs nothing. Settlers move out for 2 200. The outpost
leaves for 6 500 — **or for nothing at all** if you fly in and clear every pirate in the system,
which is not a new scene but the war that is already in the game. Then the compartments are
repaired from zero at a quarter of the build cost, one at a time, and none of them was ever lost.

What a loss actually costs is time, money, the people who left, and the story of having lost it.
That is enough.
## 0.401.3 - M411: the war on the site

The author (2026-09-07): «надо на сайте сделать карту, чё там у них происходит, прям онлайн,
чтобы видеть, чё с галактикой, кто куда когда, какие планеты завоёваны».

`drift-game.ru/war.html`. There is no second chronicle behind it: `build.ps1` glues the game's
own chronicle modules into `site/war.js`, and the page calls the same `chronStep` the clients
call, with the ledgers and circulars from `war.php`, so it shows what every game shows — byte
for byte. The map: the circle of ~317 systems filled by owner (Коммуна hatched, since the game
gives it and Компания the same blue), borders, war borders in fire, stars in the owner's colour
placed as the game's map places them, the six homes as their emblems, fronts breathing, the
previous flag's corner on a system taken within two days, «Ялта» marked as nobody's, the
players' hand as ticks on systems with a ledger, rallies, «Ревизия». Hover a system: its name,
owner and since when, what happened there. The panel: six powers with holdings against home,
needs, strength, tension and relations; wars with takes on each side; notes with deadlines;
arcs and rites; the last two days' incidents. The line «кто куда когда» tells the truth — or
any of the six waves' versions of it. A slider walks the last 720 сводки; the whole history
replays in milliseconds. Offline it works from the seed alone and says so.

---
## 0.401.2 - M412: the war runs by itself

The author (2026-09-07): «там появилась вселенная и война, которая сама идёт, надо чтобы сама шла
естественно». A Node replay of the chronicle (`docs/warsim.js`, the same `site/war.js` bundle the
site's map uses) showed it did not: the agents' needs pinned at zero after the first month, every
move was a quarrel or a war — 24 wars a month against §15's two to four — while the Director's
strength regen pulled every power to ~900 and the fronts flipped coins.

**The economy breathes.** Needs decline by what a power wants and grow by what it holds, balanced
at home size, with a seeded jitter so equilibrium is not a dead point; war costs strength, goods
and hulls every сводка; the Director's incidents move needs (a vein or a find brings ore, an
embargo or a strike takes goods, a storm takes link) so scarcity arrives from outside and not only
from arithmetic. Moves are drawn by probability, not by the first condition that matches: a power
in need trades first, quarrels second, and declares war only with relations below −250, strength
above 450, holdings at least half its home, no war of its own and fewer than two in the galaxy.
Truce grows likelier with every сводка of war; a home's systems are defended a third of the time.
Strength regenerates toward the cap its holdings set, not toward 1000; a power's tension cools by
a share, not by three points. Relations revert at 5 % per сводка, as §15 says. A year replays in
0.3 s: about ten wars a month, thirty systems taken, eight net changes, needs around 450, calm
months and busy ones. Suite: `91zzzw-chron2` «в меру, а не нулём и не лавиной».

**The players' hand actually enters the replay.** `chronState` used to cache the open сводка as
the base of every later replay: it was stepped once with whatever ledger was on hand at that
second and never again, and clients diverged by when they first looked. Now only the closed state
(N−1) is cached and written to disk; the open сводка is stepped on top on every call, and a ledger
or a circular arriving for a сводка already stepped throws the base away (`chronInvalidate`).
`warPull` hashes the closed base instead of replaying from zero.

**Circulars apply once.** `circApply` applied the latest circular every сводка for ever — needs
crept +30 % a сводка to a thousand and a single `truce` ended every war until the end of time.
Needs and events now apply at the сводка the paper is stamped with; the `season` is standing, lives
in the chronicle state (clone, cache, hash) and is what the Director reads. **Бунт, находка and
откол** are now in the Director's table — three families read them and nobody ever announced them.
The pinned hashes in `91zzzw-chron` are re-recorded with the change, deliberately.

---
## 0.401.1 - M410: one thumb

The two-stick helm of M360 asked the right hand to hold the thrust while the left held the
nose, and on a phone that is two jobs for two thumbs that also want to tap. The author's verdict
(2026-09-07): «управление получилось не очень… джойстик внизу, левой рукой… куда джойстик
двигаешь, туда и летит, нос сам потом на цель наводится».

**One stick, left thumb.** It is born where the thumb lands on the left half; the right half is
for taps — lock, autopilot, chips, pads; two fingers on the right are a pinch again. When no
thumb is down a pale ring shows where the stick rests: where it last was, and before that the
empty lower-left corner.

**«Fly there», not «push there».** The stick's vector is the wanted velocity — direction and
fraction of cruise. The physics computes the thrust that closes the gap and decomposes it as it
always did: along the nose the main engine, sideways the thrusters. Speed reached — engines off,
nothing burns. Thumb resting in the dead zone — the ship stops: that is the ТОРМОЗ the system row
lost in M360. Release above half cruise coasts, below brakes, as before.

**The nose is never the thumb's job.** With a mark it stays on the mark; without one it turns to
where the ship flies. Combat on a phone is: tap the hull, fly — the guns fire themselves inside
their cones. Mouse and arrows are untouched: the assist is a property of the stick, not of the
device. Suites: `91zzzw-helm` M410, `91zzx-mobile` (the resting point lands on the canvas).

---
## 0.401.0 - M401: three laws that were missing, and the guard over all nine

Hard is not big numbers; big numbers are tedium. Six of §22's nine laws were already standing —
everything touches three gauges, the feedback is delayed by shifts, space is the dearest currency,
failure cascades, the planet is the difficulty, and the second base is a trap nobody warns you
about. Three were missing, and all three are about what the player does **not** have.

**Сведения покупаются.** Without a радист on the base and a working приёмник on the ship, the
gauges read «воздух — впритык · вода — хватает · харч — мало» and not one digit. With one of them
you get numbers; with both, the forecast names the event and its shift instead of muttering about
the barograph. Precision is a person and a thing, and most of the game will be flown on adjectives.

**Изнашивается всё.** One compartment a shift loses a little hp, chosen by the shift number and
never by the frame, and the further heat is from the calm band the faster it goes. A base in
perfect balance leaves perfect balance by itself; an engineer and a мастерская cover the drift, and
an abandoned base reaches the floor in about a week rather than in an evening. The first
measurement made it a fault rather than a law — 0.3 hp a shift on a hot base wiped compartments in
a dozen shifts — and it was retuned against exactly that.

**Люди — не множители.** A вахтовик carries traits derived from his own seed and stored nowhere:
боится тесноты, пьёт, не спит у реактора, нелюдим. Each has its own reason and its own condition —
the crowded base, the reactor next to housing, the full compartment — so the best crew list is no
longer the list with the highest skills.

And the guard over all nine: **hard, never obscure.** The desk now carries a «почему» line for every
base, always, in whatever vocabulary you have paid for: «нечего есть · воздуха на исходе · жарко ·
людям тут не по себе», or «всё в порядке: дух 84%». If a player cannot say what killed a base, the
pass is not finished.

---
## 0.400.0 - M400: the planet is the difficulty setting

«Дрейф» will never have a difficulty slider. It has a galaxy in which some rocks will kill you, and
from this version the rock says which kind it is. Eight dials — тепло, свет, давление, тяжесть,
ветер, дрожь, лёд, порода — derived from what a planet already has (type, star, seed, and the site
inside the planet) and stored nowhere.

Every dial does something: heat sets the base's baseline, light sets what a solar panel is worth,
pressure leaks air every shift whether or not anyone is breathing it, gravity makes building dearer
and drilling better, wind and tremor weight the director's storms and quakes, ice decides whether
water is free or flown in, and ore decides what the drill is worth. Two bases on the same planet are
not the same base: the site shifts the dials too.

The reading that matters is §21.2's: **the free thing on a world is never the thing that makes it
rich.** A comfortable planet is poor; a planet that pays is trying to kill you. That curve is drawn
by the table rather than tuned by hand, and the suite checks the character of each world against it.

**Разведка перед закладкой.** From orbit you get three words and not one number — «жарко · ветрено ·
порода богатая». A **зонд** costs 300 credits (ЦЕЛЬ on approach) and shows five of the eight dials
in numbers. Landing shows all eight, because you measured them yourself. So the first mistake every
player makes is founding a base on the strength of three words, and the probe is the cheapest
tuition in the game.

---
