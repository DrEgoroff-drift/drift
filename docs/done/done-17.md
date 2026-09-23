<!-- docs/done/done-17.md — part 17 of 30 of the done work, in the order it was written; see README.md -->

## M347 — the map speaks in addresses (0.346.0, 2026-09-05)

- **M347 — the map speaks in addresses** (author 2026-09-04: «на карте не понятно, что за сектора и
  адреса»). `18-mode-map`. (1) A sector grid, one cell per sector, under the same darkness law as the
  stars — bright by the player, fading to nothing at the jump edge; every fifth line a touch brighter.
  (2) Rulers along the top (X) and left (Y) edges that scroll with the window, chart-style; the
  player's and the selected sector's coordinates underlined in colour on the rulers — coordinates are
  read from the rulers, never printed on every cell. (3) Header line «ВЫ · сектор 4:−7 · «Имя»», under
  it the selection «сектор 6:−9 · 3 сектора · 2 прыжка · 3,1 пк»; «секторов» is the same measure the
  rumours use for «в N секторах вокруг». (4) An empty cell is selectable (address + distance; no course
  into emptiness). (5) Rumour areas drawn as pale hatched squares «в N секторах вокруг X:Y» with source;
  two rumours overlapping is visible by itself. (6) Faint range rings «2 прыжка», «3 прыжка» outside the
  lit jump area. (7) Address search: a small «сектор __:__» field (numeric keypad on phone) that slides
  the window and outlines the cell; every address in game text (rumours, notebook, flea provenance,
  «Сорока» papers) becomes tappable → map centres on it (extend the rumour hook of M298). (8) A small
  rose in a corner: +X, +Y and «к ядру». (9) **Decided (author 2026-09-04): no text notes — a wordless mark, and it is a match.** The player
  lays a match from the wallet on a cell (`G.mapMarks=[{sx,sy}]`, ≤10, persisted); it stays until
  taken back. Not spent: the same match, out of the wallet while it lies on the map, so a mark costs
  something without a rule — one you cannot pay with aboard «Сорока». Drawn as a small match lying on
  the cell, warm head, no glow; tap the cell again to pick it up. Zero matches — no mark, and the game
  says so in one line.
  Tests: grid/rulers agree with `mapViewC`; selection of an empty cell yields the right address; the
  rumour square matches `11t` spread; `91f-ui` on phone — rulers do not overlap the deck or rail.

**Decided while building:** one formula (`mapCellXY`) serves the grid, the rulers, the tap and the search,
so they cannot drift apart. The grid fades to nothing at 1.6 jumps (the star law uses the view range;
the grid is about *your* reach). Rumour areas need a memory the game did not have — `G.rumours`
(≤12, {sx,sy,rad,img,src,day}) is written by `rumourBlock` when a rumour is logged; the player never
learns which are the fifteen percent that lie, so `wrong` is not stored. The mark button first went to
the rail and pushed the phone's rail into the prompt (the floors suite caught it), so the address
field became a small map-tools strip under the rulers at the right — «сектор __:__ →» plus
«ОТМЕТИТЬ»/«СНЯТЬ МЕТКУ» — and the canvas header trims its tail by « · » to leave it room; the strip
joined the canvas-vs-DOM guard in `91f-ui`. A jump into an empty selected cell is refused by the same
`bad` flag that refuses an empty tank. Tappable addresses: `addrify(root)` wraps «сектор x:y» in text
nodes of the desk and the station body into `u.addr`, one delegated click handler each → `gotoSector`.

## M348 — holdings on the map (0.347.0, 2026-09-05)

- **M348 — holdings on the map** (author 2026-09-04). Three languages, because the state is a line,
  houses are patches and pirates are foci — never one fill. **Houses:** a sector with a house station
  and its 1-jump neighbours washed in the house colour (`HOUSES.col`), two-colour hatching where two
  houses overlap (both scrips accepted there), house form glyphs stay (`17d`); under the darkness law
  — bright by the player, gone beyond the jump edge except where seen/heard. **ГЛАВТРАССА:** трассы as
  a thin double line between nodes with milestone ticks, name written once along the line like a
  river; sectors along it are «под трассой» (fleet, norm, pirates do not hold) — a band, not a fill
  (`12ai`). **Pirates:** rusty diagonal hatch over occupied sectors (labels ПОД ПИРАТАМИ/БЛОКАДА
  already exist, `13b`); where hatch meets a house patch the front line is a touch brighter.
  **Own:** sectors with own bases/holding stations get a thin frame in the player's colour, visible
  even in the dark. **Changed hands:** a sector whose owner changed since the last visit carries a
  small tag «с 12-го дня: «Ковш» → пираты», fading over three days (the same delta `12p-news`
  records). **Layers:** a СЛОИ button on the map — ВЛАДЕНИЯ / ЦЕНЫ / СЛУХИ, each toggled; one at a time
  on the phone. Regions (`06b`) stay unlabelled — by rule. Tests: house patch = station ∪ 1-jump;
  a sector under a трасса is never marked occupied for long; the tag appears only on a real change.

**Decided while building:** the three languages are kept apart in code as in the picture — patches
(`mapHousePatch`: a house station and its eight neighbours, a second house as hatching of its colour),
the line (`drawFleetMap` in `12ai` now draws a thin double line with quarter-ticks; `18b` adds the band
under it and writes «ГЛАВТРАССА» once along the longest visible leg), and foci (rusty hatch over
`occLvl>0`, the cell outlined brighter where it lies inside a house patch). Own sectors are read from
`G.bases` and `G.hold[key].bld`. The «changed hands» tag reuses the mark `12p-news` already writes
(«сменился хозяин», with its real-time stamp) and fades over three days; no new state. «Under the
трасса» became a rule in `13b`: an occupied system with a fleet station (rung ≥ 5) loses a level per
tick instead of strengthening, and expansion never steps onto one. Layers: one cycling button in the
map strip (ВСЕ → ВЛАДЕНИЯ → ЦЕНЫ → СЛУХИ) on both layouts rather than three toggles — the phone strip
had no room for three, and one control that behaves the same everywhere is easier to learn; the
ЦЕНЫ layer prints each seen station's best price under its star (own cargo amber), the СЛУХИ layer
gates M347's hatched squares. Regions stay unlabelled by rule.

## M349 + M349a — «Маяк ГЛАВТРАССЫ» and the receiver's voice (0.348.0, 2026-09-05)

- **M349 — «Маяк ГЛАВТРАССЫ»** (author 2026-09-04): the official voice in the ether, one bulletin per
  shift (`HOLD_SHIFT`, 20 real minutes) plus holidays (`11am`). Poster tone: a Mayakovsky «лесенка»
  headline, then a dry summary — see the sample in the chat of 2026-09-04 (МАЯК ГЛАВТРАССЫ. СМЕНА 412.
  Сектор 4:−7, станция «Ласковый-2»: принято / тысяча тонн / титана. План смены — сто двенадцать
  процентов. Слава сдавшим!). Rules: (1) every line has a real state delta behind it, stored as a
  `cause` like `G.scripLog` — tonnage from the holding's appetite and what drones/the player handed
  in, «очищен» from `13b`, scrip moves from the rate log, holidays from the calendar; a line without a
  delta is forbidden (the `12p` rule). (2) Exact but lying by omission: a lost sector is «переведён на
  особый режим», «Сорока» is never mentioned, a ruined артель never named — cantina rumours tell what
  the beacon will not, so the two channels never duplicate. (3) The player appears: over-norm delivery
  in a shift names the hull («экипаж борта «Стриж» перевыполнил план по титану»); player-given names
  (`11u`) are used («сектор «Тихая»»). (4) Holidays have an effect: double fleet norm that day, and the
  beacon announces it. (5) Heard in ЭФИР on the desk, by the receiver voice in flight and on the road
  (`27k`), and as a paper sheet on the cantina wall; every address in it is tappable (M347). Module
  `12pa-beacon.js` after `12p`; table of phrase moulds is hand-written, not generated. Tests: no line
  without a cause; the beacon never names `wander*`; holiday doubles the norm exactly one day.
  **M349a — the beacon speaks** (author 2026-09-04: «если ты мне ещё и голосом — ваще кайф»). Browser
  `speechSynthesis`, `lang:"ru-RU"`, no asset — the zero-assets rule holds. Voice only in flight and on
  the road (`27k`), never on the desk or in the cantina; framed by the receiver's own crackle before
  and a short tone after (`09-audio`) — the synth output cannot be routed through WebAudio, so the
  «radio» is framing and pace (slow, pauses on the лесенка line breaks), not a filter. Three roles pick
  distinct voices when the device offers several (beacon: male, even; «Сорока»'s keeper: quiet;
  station dispatcher: female), else one voice for all. Setting «голос приёмника» in options, default
  on; the first bulletin says where to turn it off. Queue one utterance at a time, cancel on mode
  change. Tests: text reaches the queue (mock `speechSynthesis.speak`), and with no voices the game
  stays silent without an error; nothing is spoken while `G.mode` is a desk/station screen.
  **Heard by the author (2026-09-04, the scratchpad proba `mayak-demo.html`): «как рипово, давай только
  тихо, пусть болтает».** So: the voice is a background murmur, not an announcement — `volume≈.35`,
  `rate 1.0` (the demo's .88 was already «slow» to the author), `pitch≈.9`, crackle framing quieter still; it talks on its own whenever a bulletin is
  due in flight, never interrupts game sound, never demands attention; ducked (not cut) under the
  frame guard's «СБОЙ» and combat. The demo's structure is the reference: crackle 1.4 s → lines one
  utterance each → longer pause on лесенка steps → two-tone sign-off → crackle tail.
  **Voices are the system's, not the game's** (author 2026-09-04): settings list the device's
  voices, one picker per role (beacon, keeper, dispatcher) plus rate and volume; a device with one
  Russian voice shows a list of one. Players add voices by installing them in the OS (Windows
  Павел/Ирина/Дмитрий and the Edge neural voices, Android TTS engines, iOS) — the game sees them by
  itself, so «voice plugins» need no code. No voice files inside the game (zero-assets rule); a
  branded voice, if ever, would be pre-rendered files on the site — a separate decision, not now.
  Persist the choice by voice *name* with a fallback to the first `ru` voice when it is gone.

**Decided while building:** the bulletin is composed when a frame first sees a new `holdShift()` and
covers the shift that ended; with no causes it is not spoken at all — silence is the honest form of
«no line without a delta». Causes and their sources: tonnage from `G.hold[key].ate[k]=[n,shift]` (the
station with the most taken in that shift; the plan percent is `n / appetite norm`), the player's sales
from a new per-shift ledger `G.shiftLog` written by `sellCargo`, freed sectors from `G.freedLog` written
by `occKill`, «переведён на особый режим» from `G.occ[key].t` falling inside the shift, scrip moves
summed per house from `G.scripLog`, the holiday from `holNow()`. The head is «МАЯК ГЛАВТРАССЫ. СМЕНА N.»
(N = shift mod 1000, the author's sample had three digits); the first line carries the лесенка as « / »
separators, split for the voice and for the cantina sheet. Player names from `11u` are used for sectors.
The fleet norm on a holiday is two refuels per shift: `G.fleetLog[key]` became `{s,n}` (a bare number
from old saves reads as one refuel). Voice: `voiceSay(lines,role)` queues one utterance per лесенка step
with a 220 ms pause, crackle SFX before and `signoff` after, volume .35 × .5 when pirates are aware or
the frame guard has failed, only while `G.mode` is `system` or `road`; a mode change cancels the queue.
Role voices are picked by saved name, else by a name heuristic (Pavel/Dmitry… for the beacon,
Irina/Svetlana… for the dispatcher), else the first Russian voice; no Russian voice — silence, no error.
Settings live in ЗВУК: on/off, volume, rate (.85/1/1.15), one picker per role with ПРОБА.

## M351 — the cooperative (0.349.0, 2026-09-05)

- **M351 — the cooperative** (`docs/DESIGN-coop.md`; author 2026-09-04: «на дядю → лицензия кооператив
  → свой маршрут, найм»). Stage 1 kept as is: the house's order and assigned leg on the house's
  account, counter closed, station prints «взять товар могут только кооперативы · оборот N из
  12 000». Registration at a house station: name typed by the player, 1 500 cr, `G.soldTotal ≥
  12 000`, stamp in КНИЖКА, `G.coop` persisted. After it: counter buying of any tradeable good with
  sliced pricing (A2) and a per-visit cap by rank (I 60 / II 150 / III none); the route on the map
  becomes the player's own calculator (R3 gate dropped, reminder row kept); hiring opens and
  `crewCap` reads the rank (1/3/5) instead of the «license» tech. Ranks: I Кооператив, II Артель
  (100 000 since registration + 2 asks granted, drone shops sell 2 per two days), III Товарищество
  (500 000 + 4 asks, `BUY_SPREAD` 1.03). ДЕЛА gets the cooperative block first: members from the
  lists that exist, a per-shift ledger from `earn(why)` and payroll, three open asks generated from
  composition and pointing at family-G buildings (столовая, ангар, отдел кадров, красный уголок,
  медпункт, учебный пункт) plus two non-building asks (holiday off, name plate), spirit 0…5 as
  words with ±1 % per point on drone output and hired gross. Modules: new `12aj-coop.js`, edits in
  `12r`, `12-economy`, `26-ui-station`, `11-log`, `14-save`; suite `91zzzzb-coop`. Re-measure
  trade with `91zzw-eco-probe` after; the caps are the brake for open buying.

**Decided while building:** «отдел кадров» does not exist among the buildings, so the manager's ask points at
the красный уголок; the asks are столовая (≥3 hands), ангар (≥5 drones), красный уголок (a manager),
медпункт (hands captured twice), учебный пункт (≥10 drones), a holiday off and the name plate (the
«Сорока» cosmetic `mk_plate` worn). A building ask is granted the moment the building stands on any of
the player's holding stations (`bldHas`), checked when the page is read — no separate button; the holiday
off is a button on the page during a holiday and makes the hands' yield zero that day (they rest; wages
run). Sliced pricing (A2) applies to the cooperative's buying and to *every* sale's non-appetite part
(3 % per ten units, floor .7, revenue rounded to whole credits); the appetite's premium units keep their
price. `crewCap` is 0 without a cooperative and rank + licence + manager with one, so the old formula
holds exactly at rank I; suites that hire stamp a cooperative through `coopStamp()` in the harness. The
old route row «ПО МАРШРУТУ · взять» stays as the house's assigned leg on the house's account (stage 1);
R3 was never a gate in code, so nothing was dropped there. `12r`'s calculator is untouched. The eco
probe (`91zzw`) was not re-measured in this pass — the caps are the brake and remain to be measured.

## M352 — one big thing per biome (0.350.0, 2026-09-05)

Closed the last item of the 2026-09-04 queue. The PLAN body as it stood when the work started:

- **M352 — more trees like these** (author 2026-09-04, on a surface frame of a jungle world: two
  low-poly canopies with hanging lianas, a monolith with tally marks, the astronaut for scale —
  «оч нравится и размер и стиль отрисовки»). The reference is fixed: flat faceted crowns in two or
  three lobes, a dark trunk with roots spread on the ground, lianas as straight hanging rods, crown
  size five to eight astronaut heights, the whole thing a silhouette against the sky haze, no
  outlines. Do: (1) this tree becomes a *family* in `20-life` — three to five crown shapes and two
  trunk builds on the same grammar, seeded per plant, so a grove reads as one species with
  variation; (2) plant them more — a jungle/terran surface carries two to four such trees per screen
  where today it carries one, and other biomes get their own family in the same language (desert:
  fewer, thinner, one crown; ocean shore: leaning; toxic: bare with hanging pods); (3) a touch more
  detail, not more objects: a second facet tone on the crown's lit side, one or two leaf clusters
  hanging below the canopy, the root shadow on the ground (law: everything standing casts a shadow);
  proportions stay exactly as in the frame. Judge by the frame (`drift-shots-as-audit`): shoot the
  same scene before and after, the astronaut in it. No new biome, no new mechanic — density and
  family only.
  **One big thing per biome (author 2026-09-04: «кристаллы большие, каменюги»).** The jungle crown's
  role — five to eight astronaut heights, silhouette against the haze, a shadow on the ground, no
  outline — is given to each of the ten land biomes with its own family of 3–5 shapes, 2–4 per
  screen: crystal — druses of 3–5 facets from one root, a second lit facet, scree between; rocky —
  boulders stacked in 2–3 tiers with a crack and a dark underside, lichen as a flat patch on top;
  desert — table buttes on a thin neck with strata bands, one dry one-crown tree bent by the wind;
  ice — hummocks and spires with a translucent edge, blue shadow inside, a snow cornice on one side;
  volcanic — black cinder cones with a warm-lit crack, a straight smoke column, a «lava tree» of
  frozen runs; toxic — bare trunks with hanging pods, blister growths, a glowing pool at the roots;
  ocean — shore trees leaning to the water on stilt roots, coral towers on the shoal; ruin — wall
  fragments, the tally-marked stela of the frame, beams, an antenna, a stair to nowhere; terran —
  the jungle crowns sparser and rounder plus lone boulders; jungle — the reference itself. Same
  grammar everywhere, biome only changes the family.

**What was built.** `src/21bb-deco-biomes.js` (the name extends the `21b-surface-deco` stem
on purpose: `21bb-` would sort *before* it under the culture-aware compare and die on
`DECO_KINDS.push` — the hyphen trap from CLAUDE.md, met again). Eighteen painters on the codex
grammar — dark mass first, body in the world palette through `dcol`, one lit edge on the star's
side, detail by count, no outline — registered in `DECO_FN` and appended to `DECO_KINDS`:
desert butte + dry tree; rocky stack + lone boulder + scree; ice hummock + spire; volcanic cone +
lava tree; toxic pod tree + blister; ocean shore tree + coral; ruin stela (the tally-marked one of
the author's frame) + antenna + stair; crystal scree; terran round crown + lone boulder; jungle
twin canopy. `drawDeco` looks the painter up in `DECO_FN` before the old if/else chain.
`decoCanopy` gained `round` (fewer, rounder masses, no lianas) and `twin` (two lobes, six lianas).

**Placement.** Clusters per ~1000 world units instead of 1600; the old «insurance» of three forms
became a top-up to `W/1280·2.4·share`, because rough worlds (rocky, volcanic, metal) found a flat
spot one time in five and lived on 0.2 forms per screen. Neighbours in a cluster now keep
`max(h)·.7+30` apart — the first desert frame had a dry tree 19 px inside a butte, and at the
world's edge `clamp` had put two hummocks on the same x. The pad rule is checked per candidate,
not per cluster centre (a jungle test caught a form 400 px from the pad).

**Frames and fixes from them** (`scratchpad/m352shot.py`, one biome per shot, camera at the
tallest form, astronaut in frame): butte strata went from five bright bands («a plank table») to
three at .28; boulders were a grey rectangle clipped by the polygon over a dark half — «floating
slabs» — and became a whole body with a base gradient; the ocean crown was one disc with a clean
white ellipse («an umbrella, a UFO») and became three ragged masses with short streaks in the shoal
tone; the stela was a light block lost in the sky and became a dark silhouette with a broken
shoulder and light etched marks; stairs were dark bodies with light edges («an equaliser») and
became light blocks with dark risers; the terran crown took the palette's two water blues and came
out blue — it gets its own earth-and-green palette. Seen in passing and fixed at once
(`drift-fix-what-you-saw`): a near-mark's label was drawn across the second edge chip of the same
column («ОСТОВ КОРАБЛЯ» over «ПЕЩЕРА 5592 м») — the chips are now drawn in two passes, near-marks
start below the chip columns and right-align at the right edge.

**Decisions.** The family lives in DECO (the middle scale, 21b), not in `20-life` plants: plants are
the small scale and their painter is per-frame per-plant; a second trunk build and «two or three
leaf clusters hanging below» were not added — the canopy already has drop masses and every deco form
casts `groundShadow`. Heights are 5–12 astronaut heights rather than 5–8: the world multiplies
`K.h` by .6–1.2, and the author's reference canopy is 180 itself. `TYPES.metal` keeps its slab/truss
family untouched.

**Tests.** `91zzzzn-deco-biomes`: every land biome has ≥2 kinds with one at 5–12 heights; every
`DECO_KINDS` name has a painter and every painter a table row; each painter runs directly on every
palette; per biome the average per 1280-px screen is 1.2–5 away from the pad and every kind met is
drawn through `drawSurface`. `91j-art` updated: rocky is no longer «no forms», ice+ruin mix keeps
ice as the host. Suite 13 910 desktop / 14 007 phone, green.

**Second pass (0.350.1).** The six kinds not yet seen in a frame — coral, lava tree, blister, dry
tree, boulder stack, crystal scree — were shot one by one (`m352shot.py biome:kind`). Coral had
pointed towers and read as crystal in the ocean's blue: now a trunk with three to five branches
ending in knobs, lit rim to the star. The dry tree's one flat disc read as a parasol: now three small
tufts on short branches, all blown the same way. The other four passed. The eco probe was also
re-measured after the cooperative in the same session (`docs/ECONOMY-AUDIT.md` §6).

## Pass 2026-09-05 — «Сорока» and the desk (0.351.0)

Author, on a frame of «Сорока» at the lit limb: a sketch of four huge curved lobes around the mast,
«давай ещё проходу по столу, сороке, графику надо подтянуть на уровень … чтобы оч красиво было».
**Exterior** (`drawWanderer`, 12v-wander): the sails are a four-blade heliogyro from a hub on the
yard, R = 1.5 keel, blade width by a sine of the length, a quadratic bend toward the tip, a slow
turn (`now/900000`), gradient dark-to-light across the blade, ribs as dark strokes, three hard
highlights, the keel's shadow clipped onto the blade, spar and stay; drawn before the keel; the
cull margin widened to 1.7 L. **Room** (`drawWanderRoom`, 24c-mode-wanderer-draw): panel seams
with rivets, brass floor strip, deck planks and cross seams, a warm runner, a curtain with the
magpie mark and jar shelves behind the counter, six bales/crates along the walls, icons ×1.15 with
a chalk price per case, vignette .62 → .5. A TDZ on `zc` (declared later in the function) killed
the first frame — the new block reads `g.zc`. **Desk** (`27j-ui-opis`, style.css): two thin
repeating gradients as weave, a dashed hem inset 13 px, the hull panel with a radial lamp and
min-height 240, and the matchbox moved out of the hold into its own zone 5 «СПИЧКИ» that takes the
`side` area whenever the office locker is absent (at a locker station it stays in the hold). Judged
on frames: `soroka-ext.png`, `soroka-room.png`, `opis-desk.png` in the session scratchpad.

**Third look (0.351.1–0.351.2).** The author rejected the heliogyro on sight («бананы убрать») and
asked for flat triangular gold sails as in space films. Reference taken: IKAROS (a square kite of
four panels on crossed booms), Dooku's sloop and the Treasure Planet surfer (gold foil, straight
edges). `drawWanderer` now draws a square of half-diagonal 96 keel-units on the yard and the keel's
extension; per-panel lit factor from the star's direction in hull coordinates (`.62+.5·cos`), a
gradient toward the hub, five fold lines and one radial, a single soft sheen band across the lit
panels, the booms' shadow, tip masses. Cull margin 1.1 L. Frame staging that finally worked for the
exterior: `G.watch=1` with `allyOf` stubbed to «Сорока»'s position — setting the player's ship
position is undone by the loop. Every catalogue tool got a silhouette (`WAN_ICON`).

**Fourth look (0.351.3).** The square kite was wrong too: the author drew four separate triangles
from a hub near the bow, at 45° to the keel, and asked for gold that does not look like a cartoon
fill. `drawWanderer`: hub at x = 26, four blades LB 168 × HW 46 at π/4 + i·π/2; the metal is a
six-stop gradient across the blade (bronze–gold–pale–gold–bronze) times a per-blade lit factor from
the star direction, seven lengthwise strips at ±.08 alpha, 26 seeded crinkle pairs (light beside
dark), one radial specular on blades facing the star, the keel's shadow clipped in, a dark rim with
a lit thread on the star side, a spar per blade, tip masses, stays to the keel ends. Cull 2.2 L.

---
# The war — M360–M388, closed 0.388.0 (2026-09-06)

Moved out of `PLAN.md` when the queue closed. What each pass actually did and measured is in
`docs/DESIGN-war.md` §18; this is the plan as it was written and struck.
