<!-- docs/done/done-11.md — part 11 of 30 of the done work, in the order it was written; see README.md -->

# QUEUE: the fourteenth pass — the kit, the lodger, the expedition (M152–M166)

Designs (2026-08-23): [`docs/DESIGN-ui.md`](docs/DESIGN-ui.md), [`docs/DESIGN-economy.md`](docs/DESIGN-economy.md), [`docs/DESIGN-suit.md`](docs/DESIGN-suit.md),
[`docs/DESIGN-vega.md`](docs/DESIGN-vega.md), [`docs/DESIGN-act2.md`](docs/DESIGN-act2.md),
[`docs/DESIGN-after.md`](docs/DESIGN-after.md). Order as listed; each is a version with tests and
a commit. The joys (M164–M166) may be slotted between big milestones as breathers.

- **M151a the console and the table** — **built (0.111.0)**: the release look per
  [`docs/DESIGN-ui.md`](docs/DESIGN-ui.md). A bottom console on every screen (receiver moved out
  of the cantina · action prompt · the seat of whoever flies with you); one full-screen **СТОЛ**
  reachable from any mode (logbook with ЭФИР/БОРТ/ЛЮДИ, tapes, letters, things, record book,
  clippings); the station gets **ДОСКА** as its first group; the menu shrinks to five; `logwin`,
  `lorewin`, `parrotwin` removed; `say()` only for prompts and emergencies, `etherLine()` /
  `peopleLine()` for voices; `29-ui-table`, `29a-console`, `91f-ui` rewritten once; `91zzv`.
- **M152e the economy without a debt** — **built (0.112.0)**: per
  [`docs/DESIGN-economy.md`](docs/DESIGN-economy.md). Measure first (`91zzw-economy`, 60 minutes
  under three profiles, cr/min per source and drain); then: no manager salary — the cut only,
  hires paid per run; station need (×2 for one delivery, heard and posted); one order per
  station on ДОСКА; the first «Вьюк» by allocation at 3 000 turnover; tails on the table and in
  the home case; a find handed to the institute for 25%; the rationalisation premium; prices on
  the charts; slower market fill. Target: mod at 10 min, «Вьюк» at 20, hire at 1 h, manager at
  2–3 h, garage by hour 5–6.
- **M152 the kit** — **built (0.113.0)**: the suit as six places with trade-offs, pieces with models/class/wear/mods,
  issued/found/given, the workshop tier repairs and modernises; `12x-suit`, `11y-kit`, `91zzg`.
- **M153 Vega** — **built (0.114.0)**: the lodger who cannot be evicted: the one-shot device on the flea, three acts,
  the mirror, flying with her (right seat, HUD line, help/hinder/quarrel/gift/outings), the
  seven-day ending; `11w-vega`, `12k-vega`, `91zzh`.
- **M154 the Ring** — **built (0.115.0)**: a structured signal from outside on the receiver, recorded on tape, never
  explained; `11x-ring`, `91zzi`.
- **M155 misclosure** — **built (0.116.0)**: the region where the counts diverge; tapes together draw a figure on
  the table; `11z-misclosure`, `91zzj`.
- **M156 circular** — **built (0.117.0)**: the expedition demand through queues, prices, barges, settlements, crew,
  rumours for sixty days; barge passenger as a channel; `11x-expedition`, `G.exp`, `91zzk`.
- **M157 the sixth** — **built (0.118.0)**: five rival traces as links drawing one route to the sixth, who gets a
  face and goes with the expedition; `12k-stories-d`, `91zzl`.
- **M158 last run** — **built (0.119.0)**: the Tin closes; one person per region; ten letters with content read
  aloud by the addressee; `12k-letters`, `91zzm`.
- **M159 departure** — **built (0.120.0)**: the quiet minute, the nameless board line, the once-offered ending, the
  unsigned tape a year later; `91zzn`.
- **M160 the Island** — **built (0.121.0)**: pirates as those who left; landing with a letter as the second door;
  three names return; `91zzo`.
- **M161 record book** — **built (0.122.0)**: the player's biography written by others, boards of honour, ageing
  and the medical board as the quiet ending; `11aa-record`, `91zzp`.
- **M162 institute** — **built (0.123.0)**: topics, labs, forms, the voucher to the sanatorium planet; `11ab-institute`, `91zzq`.
- **M163 trainee** — **built (0.124.0)**: the stowaway boy on the right seat, learns, gets a diploma, leaves; `11ac-trainee`, `91zzr`.
- **M164 zoo** (joy) — **built (0.125.0)**: beasts brought home, pens, the zoo station; `11ad-zoo`, `91zzs`.
- **M165 wall paper & concert** (joy) — **built (0.126.0)**: the wall newspaper on the counter, the request concert
  on the receiver; `11ae-concert`, `91zzt`.
- **M166 dominoes** (joy) — **built (0.127.0)**: dominoes at the table with rivals, the mate and Vega; `11af-domino`, `91zzu`.
- **M167 mobile** — **built (0.128.0)**: the phone edition of the console look, per the Mobile section of
  [`docs/DESIGN-ui.md`](docs/DESIGN-ui.md): receiver → one-line ticker in the console (no
  floating window); buttons into thumb zones, zoom = pinch, no ghost buttons; fit screen split
  КОРАБЛЬ | СКАФАНДР with row/clipping fixes; the suit as an RPG paperdoll composited from the
  six equipped pieces (one outline, one light) — the same composite walks the surface; one hint
  slot above the console; distance markers as edge arrow chips; mechanics.html mobile CSS.
- **M168 road companion** — **built (0.129.0–0.132.0)**: the living screensaver for real travel — credits by the kilometre with a ×3 combo, acceleration and braking on the hull, the mood wave — per
  [`docs/DESIGN-road.md`](docs/DESIGN-road.md) — the player's hull flies by GPS, banks by the
  gyroscope, shakes with the road, an equalizer breathes by the microphone; a kilometre of
  road is a unit of ice, 40 a day; `27k-road`, `91zzy`. Passes b–j moved it to credits, tiers,
  nose-up flight, an honest turn measure through a crooked cradle and the «моя волна» bloom.
  **M168k (0.155.1)** — the ninth pass, from six filmed minutes of city driving and three
  corrections from the author (a rich palette, the game's sound off, stars that read as flight):
  hue was being averaged like a number and so every track painted the sky green; the bloom made
  the footer buttons unreadable; the exhaust was white by construction; the travel scale was taken
  from 120 km/h while a city drive is 15–45. Plus a truth window for the sensors (long-press or
  `?road=diag`) — through the whole drive the hull never left the centre and the screen could not
  say why — and a stand, `docs/mkroad.ps1`. Sky split off into `27la-road-sky`. **0.156.0**: the
  author lifted the mode's battery budget («делай максимум, всё равно тел на зарядке»), so the
  glow became a per-pixel field with domain-warped noise (`27lb-road-bloom`) — the shader recipe
  he brought, written on `ImageData`, measured down from 17.9 ms a frame to 2.6. **0.157.0**: the
  halo round the hull killed, the exhaust given two habits (breath below 22 km/h, afterburner
  above), lanes merged into one filled body, and proportions equalised across every hull — the
  road is now a step in the `?g11` probe and reads 60 fps.

- **Road economy — done (0.158.0)**, from «хочется больше кредитов, я еду 5 км до дома как-то
  скучно за 20 кредитов, мож комбо за повороты там, за движение назад». Six credits a kilometre
  instead of two, a one-off bonus per real corner (paid by its peak, once, on the way out of the
  arc), and ×1.5 once the trip turns back toward where it started. Five kilometres home is ~130
  credits now against 20. The trip and the day are separate numbers on screen (0.158.1 — the label
  «за поездку» had been showing the day since the second pass). And the daily cap became a **tank**
  (0.159.0): 2 200 flows in a day, it fills to 14 000, a trip spends what accumulated — so a week
  of commuting pays for a weekend run to the dacha, while driving all day every day settles at the
  daily inflow. **Open for the author to judge on the road:** the inflow and the tank size.
- **Release look** — after M161: the table as paper, removal of the overlay HUD.

# QUEUE: after the graphics campaign

- **M171 someone else's mark** — **built (0.137.0)**: the first thing in the game left by another
  living player, and it arrives without a word — `11ag-trace`, `a=trace` in `site/api.php`, suite
  `91zzza-trace`, design in [`docs/DESIGN-trace.md`](docs/DESIGN-trace.md). A pilot cuts his mark
  into a stone beside his ship and leaves up to five units of cargo at its foot; the next person to
  land there takes it, and it is gone for everyone. Nothing a human types ever crosses: what
  crosses is a mark (one of twelve, derived from the anonymous pilot id — not chosen, never
  explained), a six-character hand, a resource key and a count. Recognition is the hand and
  nothing more; feedback is one ether line counting how many of yours were taken. Three per day,
  eight per place, thirty days, one request per landing. Offline the feature does not exist and
  the interface never mentions it.
  **Left open by design**: only the surface carries a mark (the station counter, the settlement
  wall and the cave mouth would each take one); no recognition beyond the hand — anything more
  becomes a friends list; no way to leave a thing *for* somebody, because that is trade.

- **M170 the home as a place** — **built (0.136.0)**: `21f-home-out` (the house on its planet:
  terrace, footing, roof, smoking chimney, lit window, porch lamp, garage, display case, workbench,
  beacon mast; cleared yard, kept away from the settlement; ДОМ marker in the navigator) and
  `29c-home-in` + `29d-home-draw` (a walkable mode: eight tiers as eight rooms, openings that show
  the next room, per-room floors, things to look at, residents who sit, work, walk and answer —
  Vega in her dress and headscarf). Suite `91zzz-home-in`. Remaining passes if the author wants
  more: furniture depth in the hall and dock, a second storey for the living part, sounds indoors.
  Original ask below.
- ~~**M170 the home as a place**~~ (author, 2026-08-24) — the home stops being a screen of cards and
  becomes a house standing on its planet: you land, you walk to it on foot, you go in, you walk
  its rooms and look at what is in them, and the people who live there are drawn living in it —
  Vega sits, gets up, walks, works. "Полноценный Симс" in the author's words. Ten passes, the
  last of them performance. Depends on: the surface pass (M169+), `27e-ui-home`/`21ac-base-draw`
  for the room language, `11ac-trainee`/`11w-vega` for who is inside.

# QUEUE: the thirteenth pass — the galaxy as a book of stories (M122–M151) — CLOSED

Built in 0.72.0–0.108.0. The per-milestone notes that used to sit here (M129–M151, the regions,
the hundred, the instruments) moved to [`docs/PLAN-archive.md`](docs/PLAN-archive.md) on
2026-08-25 — they are documentation of decisions taken, and this file is read every session.
Grep the archive for a milestone number.

# QUEUE: written 2026-08-25 for the next session — verified findings, in order

Everything below was **read in the code, not remembered**. Line numbers are omitted on purpose;
the function names are the address.

## 12. Biology — **BUILT (0.141.0, M174)**. `20e-species`, suite `91zzzb-bio`, stand `docs/mkbio.ps1`

A species is a property of the planet: `floraOf(p)` (3–5 plant species, fixed form, proportions,
branching, colour, growth range, wet/dry preference), `faunaOf(p)` (2–4 beast species, archetypes
never repeating). A specimen is species + age + place. Age is a body — seedling without flower or
fruit, old with a wider crown, dead branches and litter. Vigour comes from the strip's wetness and
the local hollow; lean comes from where the star stands. The name is derived from the drawn form
and the real flags, so it cannot lie — which immediately exposed three real lies (spiral and
ribbon plants never drew their glow, no alien beast drew glow, spines did not exist) and they were
drawn rather than renamed. The register counts species, not bushes; a save without `bioV:2` loads
with `G.species` emptied.

**Left open by design:** the *drawn* forms still number twelve for the whole galaxy — a species is
a fixed point in that catalogue, not a new shape, and a generator of forms is a pass of its own.
Litter is a few leaves at the foot, not a ground layer. Beasts do not eat, breed or avoid each
other: fauna has species now, it does not have behaviour.

### The original finding, kept for the record



The game keeps a species *record* — `G.species`, `+9 данных` for a plant, `+14` for a beast,
the `G.bio` counter, the line «Новый вид: …» — but there is no species *entity*. Verified in
`20-life`:

- **`genPlant`**: every trait is an independent `r()` roll per specimen — `cap`, `turns`, `ribs`,
  `balls`, `ribbons`, `pods`, `facets`, `blobs`, `glow`, `bloom`, leaf colour, height. Two plants
  "of one species" share nothing. `genBeast` is the same: `shape=Math.floor(r()*BEAST_SHAPES.length)`,
  fur colour and size rolled per animal.
- **Eight of the twelve plant forms have no branching at all** — `nb` is 0 for `kind>=4`. They are
  a stem plus a hardcoded ornament.
- **No age.** `sizeMul` is a random multiplier: a small plant is not a young plant, it is the same
  plant scaled. No seedlings, no old specimens, no dead matter.
- **No light.** `lean=(r()-.5)*.5` is random, although since 0.138.0 the game knows where the star
  stands (`sunSpot`).
- **No ground.** `tr.wet` drives only how many plants there are, never what one plant is like: the
  same specimen in a wet hollow and on a dry ridge.
- **The name lies to the player.** `PLANT_FORM` has six words for twelve drawn forms, and the word
  is chosen by `pick(PLANT_FORM,r)` independently of what is actually drawn; the trait word
  «светящийся» is rolled independently of the `glow` flag. That name is then shown as a discovery
  and stored in `G.species` for good. **The game keeps a register of species that do not exist**,
  and that is not cosmetics.

**The pass**, in order: (a) a species becomes a property of the planet next to `planetBiome(p)` —
three to five per world, each with fixed proportions, colour, growth range, branching, name; a
specimen is species + age + place, and the name is derived from the real form and the real flags,
so it cannot lie by construction; a second specimen of a known species is no longer a discovery.
(b) age: a seedling has fewer segments and no fruit, an old one a wider crown and dead branches.
(c) the specimen answers the world: leaning toward the star, taller and lusher in a wet hollow,
stunted and harder on a dry ridge, litter and deadwood at the foot.

## 13. Planet light — **BUILT (0.142.0, M175)**. `planetSunRot` in `07-planet`, stand `docs/mkplight.ps1`

The baked shading layer is rotated at draw time by the planet's angle to the star; the disc cache
takes the sun angle into its rebuild key. No extra bake. The softness of the terminator was left
as it was — a true half-phase is art direction and belongs to the author.

### The original finding, kept for the record



`planetLight` (`07-planet`) bakes the shading layer with a hardcoded vector:

```
const light = clamp(nx*-.52 + ny*-.42 + nz*.74, 0, 1);
```

So **every planet is lit from the upper left whatever the star does** — a planet to the left of
the star and one to its right are shaded identically. This is exactly the fault M172 fixed on the
surface ("the light had an hour but no direction"), still standing on the screen the player looks
at most after the cockpit.

The fix is cheap and exact: the terminator seen from above is a straight line through the disc
centre, perpendicular to the direction to the star — so the baked light layer stays baked once and
is **rotated** by the planet's angle to the star at draw time. No extra bake, no cache explosion.
How hard the terminator should be (a soft light as now, or a true half-phase) is art direction and
belongs to the author.

## 14. Release look, passes A2 and A3 (the design, agreed with the author 2026-08-24)

Pass 1 is done (on foot, the ship's instruments are hidden). What the rest means, decided after
the author pushed back on "nothing at the top" — the goal is not an empty top, it is **the top of
the frame is the world**:

- **A2 — BUILT (0.143.0, M176).** The top panel is gone; state left of the console, place and purse
  right, hairline bars over a bottom slope instead of a glass plate; composition per screen (suit
  and hold on foot, pod in flight only); the rail came down; on a phone one line of numbers and the
  message back at the top. Stand `docs/mkview.ps1` + `docs/pageshot.ps1` (whole page, interface
  included); `test.ps1 -Mobile` measures the phone layout for real. Original text below.

- **A2. The state moves down.** The top glass panel goes; fuel/hull/hold live as hairline bars
  with a number to the left of the console, place and purse to the right. It fades to a third and
  wakes for two seconds on change, staying open while an alarm holds — `hudWake` already does
  this, it only moves. **The composition changes per screen**: on foot the ship's fuel and hull
  decide nothing, so it is the suit, the hold and the distance to the ship; the region instrument
  pod (`ipod`) is a cockpit instrument and shows in flight only. The edge navigation chips stay —
  they are about the world, not about the interface.
  **On a phone**: hairline bars are unreadable at that size, so it is one line of numbers only,
  above the console, between the thumb zones, colliding with neither the pads nor the buttons.
- **A3 — BUILT (0.144.0, M177).** `27i-ui-table` + `body.table` styles: the notebook is a sheet
  with a margin and red rule, ink per kind of record; things and tapes lie on the wood as objects
  with shadows, rotation and a wax dot for unread; a clipping and a plate got their own silhouettes;
  the active tab is a paper label. Checks in `91zzv-table`.

- **A3. The table becomes paper**: `29-ui-table` stops being a dark window of lists — a sheet,
  bills in a pile, letters as envelopes, tapes as reels, clippings. Full screen on a phone, tabs
  no smaller than 44 px.

The overlap guard `91f-ui` measures `.vitals`, `.locus`, `.rail` and both `.pads` groups against
each other and against the screen edge — it will have to be re-pointed, not disabled.

## Order

12 (biology) — **done, 0.141.0** → 13 (planet light) — **done, 0.142.0** →
14 A2 — **done, 0.143.0** → 14 A3 — **done, 0.144.0** →
**9 (second storey) → 10 (world heard)** → **then M178–M186 below** → graphics debt one at a
time → split debt.

Order fixed by the author on 2026-08-25, in his words: «сначала старые вехи закончи потом всё что
накидал. Потом проверка по беседе и ещё раз пройтись» — so the open items of the old queue come
first, the night orders after them, and the walk-through last.

---

---

# Moved out of PLAN.md on 2026-08-27 (0.186.0) — the 26.08 queue, M188–M206, all built

The online postcard (M188–M192), the world alive (M193–M196), the places (M197–M199) and the
joys (M201–M206) — written with the author on 2026-08-26 and finished by 0.186.0. Their five
surviving "still open" tails were carried back into the live plan.

# QUEUE: written 2026-08-26 with the author — the online postcard, the world alive, the joys

Agreed in conversation over three messages. The order below is the order of work; forks the
author has already settled are marked as settled, and nothing here waits on him except where
it says so.

## Done in this run

- **M187 — the instruments at the top, and the lamp that means something** — **built (0.160.0).**
  See `PATCHNOTES.md`. Two rules now guarded by `91f-ui`: *the top answers "who and where am I",
  the bottom answers "what can I do", the middle is the world*; and *an instrument that cannot be
  read is not an instrument* (resting opacity, bar height and the empty middle are all measured,
  not trusted). The lamp: "arrived since your last visit" (goes out on the visit), separate from
  the wax dot "unread" (goes out when the item is looked at), separate again from the per-tab
  counter that says which shelf the news is on.

## The postcard — the online part (M188–M192)

Rules of this block, settled by the author on 2026-08-26 and not to be re-opened without him:

- **No names.** No hands, no address book, no way to look anyone up. A postcard goes to the pool
  and is caught out of the ether; a reply travels back through the server without either side ever
  seeing an identity. Continuity is a stack of cards clipped together on the table, and you know
  your correspondent by how they cross out and what they photograph. Go quiet and you are gone for
  good. One button about a person: "не принимать" on the stack.
- **No parcels.** Trade between players was designed and then cut — it would have been the only
  hole in the market, and the author said no.
- **Nothing a human types ever crosses.** The payload is a form id, a bitmask of crossings-out,
  glyphs, and a scene snapshot. This is what makes the whole feature need no moderation at all.

- **M188 — the camera** — **built (0.171.0), first pass.** A photograph is not pixels but a **snapshot of the scene**: mode, world
  seeds, hour, weather, camera point, `VER` — about 200 bytes, re-rendered by the receiver's own
  engine. Three reasons, in order: the server carries bytes instead of megabytes; nothing but the
  game's own world can physically cross the boundary; and an old card re-rendered by a newer engine
  comes out slightly not-the-same, which is what an old photograph does. Button ФОТО on the
  console, an album of twelve on the table. Offline, needs no server — a joy on its own.

  **Checked before starting, 2026-08-26, and it does not start where it looks like it starts.** The
  design rests on "the engine can re-render any past scene", and today it cannot — not because the
  world is not deterministic (it is: `enterSurface` rebuilds terrain from the planet's seed), but
  because **drawing is welded to globals**: every draw path paints into the single `ctx` at the
  single `W`/`H`, reading the single live `G`. Rendering a stored scene into a thumbnail means
  either swapping the whole world under the renderer and restoring it afterwards — a save-corrupting
  class of bug — or giving the postcard **its own painter**, one function that takes a snapshot and
  a target context and owes nothing to `G`.

  The alternative that avoids all of it — storing captured pixels — was measured and rejected: a
  480×300 JPEG is ~25 KB, twelve of them ~300 KB, and the album persists into a save that also goes
  to the cloud. That is not an album, that is a new save-format problem.

  So the milestone's first pass is `drawPostcard(ctx, snap, w, h)` — a *view*, not a re-run of the
  mode. **BUILT (0.171.0):** `25g-postcard`, suite `91zzzi-postcard`, stands `docs/mkpost.ps1` and
  `pageshot view -Q "?s=album"`. The painter owes `G` nothing and a test proves it (same snapshot,
  pixel-identical frames before and after the live world is moved elsewhere). ФОТО on the console
  where there is something to shoot, an album of twelve on the desk that only exists once there is
  a first photograph; whole album under three kilobytes in the save (`G.album`).

  Five passes on the card, each against the game's own frame: it had to be rebuilt around a **body
  of ground with strata**, not a hazy distant ridge; the ground takes its colour from the upper
  middle of `T.pal`, since the low steps of that ramp are ocean and an earthlike world came out
  blue; the vertical scale is isotropic with the horizontal, because a card is a third the width of
  the game frame and was stretching relief threefold; strata flatten with depth and reach the
  bottom edge; and clouds went in as soft radial blobs — filled ellipses gave a chain of identical
  lozenges, and at this size anything with a contour reads as a blot.

  **Still open:** the wire format and the receiver's side, which belong to M190; modes other than
  ground and approach (cave, mine, belt, system, scoop) are not photographable yet.
- **M189 — the forms** — **built (0.172.0).** A form is a title plus lines; a line is a set of variants; tapping a
  variant crosses the others out. **Every line ships with a sensible default, so a card can be sent
  without a single tap** — that is what "чтобы не париться" means in practice. About thirty in this
  milestone, to a hundred over later passes: road, holiday, wintering, household, lyrical,
  scientific, official ("Форма №7"), children's. A postscript of up to three settlement glyphs,
  whose meaning the players work out among themselves. A place stamp, never a name.

  **BUILT (0.172.0):** `25h-post-forms` (the table), `25i-post-back` (the back, as markup rather
  than canvas — a variant has to be hit with a finger, and text in markup stays text at any size),
  suite `91zzzi-postcard`, stand `pageshot view -Q "?s=pcback"`. Thirty blanks, all eight kinds,
  flipped one at a time in the header. Struck-out variants stay visible — a stranger's card tells
  you about them by what they crossed out. The address side is empty on purpose and says so in
  print: *адресат не указывается · карточка идёт в общую почту*. On the snapshot: `f` blank,
  `c` choices, `g` glyphs — under a third of a kilobyte per card. Measured at 375 px: fits, no
  overflow, no touch target under the size rule.

  Two collisions, both invisible to the eye: the choices were first written into `s.m`, which is
  the snapshot's *shooting mode*, so a signed approach card lost its lander; and the variant
  buttons carried `class="v"`, which the game already uses for an instrument row (`display:grid`,
  64/88/46), so every variant inherited that grid and stretched to a quarter of the card.

  **Still open:** a hundred blanks over later passes (thirty are in); and the card cannot be sent
  anywhere yet — that is M190.
- **M190 — the post** — **built (0.173.0).** `a=post` in `api.php`, `25j-post-wire` and
  `25k-post-mail` on the client, suite `91zzzi-postcard`, stand `pageshot view -Q "?s=mail"`.
  The card goes to the pool; a reply travels back down the chain anonymously. Three a day, two
  caught, thirty days of life, a sweeper on the clock, one request per docking (the M171 rule).
  Offline the feature does not exist and the interface never mentions it.

  The card is rebuilt field by field ON THE SERVER — every number range-checked, anything
  unexpected rejected rather than trimmed — so "nothing typed crosses" is enforced rather than
  trusted from the client. The sender's mark never leaves the server; the reply is routed there.
  «Не принимать» kills the chain and tells the other end nothing.

  Also landed here, and it should have landed years ago: **`php -l site/api.php` on the runner
  before the upload step.** There is no PHP on this machine, so the one file the whole backend
  lives in had been going to the live site unparsed, and the existing smoke check only notices
  after it is up. New risks written into `docs/DESIGN-online-risks.md` D2 — the pool is global, so
  a flooder pushes cards in front of everyone rather than in front of one place.

  **Still open:** catching happens on the docking trip; M191 moves it into the evening ether and
  gives it its own presentation.
- **M191 — the night ether** — **built (0.174.0).** `25l-post-ether`, suite `91zzzi-postcard`,
  stand `pageshot view -Q "?s=ether"`. A fifth band at the very bottom of the dial that exists only
  after nine in the evening and only online — **by the real clock**, because a window measured in
  game days (a minute each) is a flicker, not a window. The announcer reads a card a line at a
  time: the blank's name, each line as it was left standing, the postscript glyphs, the place.
  Leave the wavelength halfway and you get nothing. Two a night, counted on the evening's calendar
  so one in the morning still belongs to last night. A card read to the end lands on the table as a
  stack with the reply already open — the screen does not open itself. No notification: the dial
  lights its own label and that is all. Catching moved out of docking, where M190 had parked it.
- **M192 — chess by post** — **built (0.186.0).** `25n-chess`, suite `91zzzt-chess`, tab ПАРТИЯ on
  the desk. The same pipe carries a second kind of thing: a game with a stranger, one move per card.
  A move is `{f,t,p}` — three small numbers — so the "nothing typed crosses" rule holds without a
  new exception, and the wire stays as dumb as it was. **The board is neither sent nor stored**: the
  list of moves persists and the position is replayed from it, the way the world is replayed from a
  seed; a corrupt move truncates the list rather than poisoning the game. Full rules — castling with
  real rights, en passant with the pawn removed, promotion to four pieces, шах/мат/пат, and the
  expensive one: you may not leave your own king attacked. The server (`api.php`) validates and
  carries `mv` through `put`/`reply`/`ask`/`in` and is never trusted — legality is re-checked on the
  client before a move touches a game. Caught in the night ether, the move lands on the board while
  the announcer is still reading the card. The plan asked for this *after* the post had bedded in;
  it was built now on the author's instruction to work the whole queue through.

## The world alive (M193–M196)

- **M193 — beasts begin to live** — **built (0.168.0).** Biology gave fauna species (0.141.0) and no behaviour. Herds
  that graze, a predator that walks the herd, bolting or staring at the walker by the species'
  temper, feeding on the plants they actually prefer, activity by the hour, tracks, burrows and
  nests as things in the world. On `20e-species` / `20f-fauna`, stand `docs/mkbio.ps1`, frame
  budget checked in every pass.
- **M194 — marks in other places** — **built (0.169.0) as «ляпнул лишнего»**: the player became a
  source of rumours rather than a second surface field. Telling the counter where you dug buys a
  named offer at three times the money now, and three days later a barge is working that place and
  one line goes out on the air that never names you. **Still open from the original ask:** marks in
  the places themselves — the settlement wall, the cave mouth — which M171 left open and this took
  a different road around.
- **M195 — the sky watch** — **built (0.170.0).** `11ak-skywatch`, suite `91w-celest`. The
  institute hands out a watch order at a science counter — a place, a kind of event and a day read
  out of `celestAt` itself by stepping forward at a step matched to the width of the window
  (`skyFind`). Being there writes the tape; an eclipse means standing on that particular planet.
  It is a race: six days after the event the institute publishes its own calculated bulletin, and
  a report after that is half pay. A comet reported first takes a name out of the record book —
  which other people write, so the player cannot name one after himself. Persisted in `G.duty`
  (order, tally, comet names); the sky itself still reaches no save.
- **M196 — the pennant** — **built (0.175.0).** `25m-probe`, suite `91zzzi-postcard`. Build an
  automatic probe in the lab, launch it at a star you will never reach, forget it — and forgetting
  is mechanics, not a phrase: no marker, no counter, no "days left" anywhere. Weeks of real time
  later (lazily, from `Date.now()`; nothing is simulated) the receiver catches its weakening voice
  once on the ЭФИР band, and the probe sends back a snapshot photograph of where it got to — drawn
  by M188's painter, from the seed of the target system, a place no person has stood in. A line in
  the record book, and then the probe is removed from the save entirely: what remains of it is the
  entry and the picture, not a row of state. The only thing in the game with no reward and no use.

## Places (M197–M199)

- **M197 — the wintering** — **built (0.176.0).** `29f-winter` and `29g-winter-draw`, suite
  `91zzzj-winter`, stands `pageshot view -Q "?s=winter"` and `"?s=winterlow"`. A contract off the
  board: a month alone on a far station — hold the power balance, keep a diary in the form language
  (the postcard blanks, 25h), listen to the wall (`09a-roomtone` got its `winter` tone), wait for
  the barge. One room on purpose: solitude IS one room you do not leave for a month, and the rest
  of the station lives in the instruments and the sound behind the wall.

  The balance is a choice: the reactor gives less every week, four consumers all needed, and by the
  end something living has to go off. Turning the lamp down makes the room genuinely harder to
  see — three light sources, all of them the player's to set. A calendar on the wall carries the
  days crossed off by hand, because the interface keeps no countdown. Faults cost the reactor a
  unit each and a repair eats the day (no diary that evening). The wall talks iron early and almost
  words by the end, with the explanation always available.

  **Art pass, 0.178.1:** the figure is a person now — a padded coat with three breaks in the
  silhouette (shoulders, belt, skirt), felt boots wider at the foot than the shin, an ear-flapped
  cap and a cheek-sized patch of face lit by the stove. The berth got thickness: side rail, gap to
  the floor, mattress overhanging the frame, blanket turned back off a light sheet. The stove got
  legs to the floor and a contact shadow.
- **M198 — the observer's choice** — **built (0.177.0).** `12td-settle-hand`, suite `91zzzk-hand`,
  stand `docs/shot.ps1 settle` (fifth row). One irreversible button at a settlement of stage 2 or
  more: take it in hand. Everything measurable improves — faster growth, it raises what pays, twice
  the barn, steadier giving. What is lost is in no number: the glyph speech goes (the collected
  vocabulary has nothing to do here, the answer is «принято»), its own will in choosing a building
  goes, and the crooked street goes — yards in a line, roofs to one height and one pattern, no
  communal hearth, a mast with your house mark. Not one word of morality, no confirmation, no undo.

  Caught while wiring: the save rebuilds a settlement field by field from a whitelist, so `mine` was
  dropped on load — the manager-field class of bug, third repeat.

  **Still open:** at street scale the difference reads, but weakly. The frame could say it louder.
- **M199 — the sanatorium** — **built (0.178.0).** `29h-spa` and `29i-spa-draw`, suite
  `91zzzl-spa`, stand `pageshot view -Q "?s=spa"`. The voucher stopped being a line of code and
  became a place: a veranda over the sea, a timetable on a board, an oxygen cocktail, a quiet hour,
  chess. Nothing happens, and that is the only place in the game where resting is allowed — skip a
  treatment and nothing follows, leave mid-minute and nothing follows either. Weight comes from
  ageing: the record book counts the years and these three days are not coming back, and the game
  never mentions it. No attendance points, no relaxation bar, no completion award — a test guards
  it: doing everything and doing nothing end in the same state. Vega comes if she is aboard.

  **Art pass, 0.178.1:** the deck is filled by the thing that belongs there at noon — the slanted
  grid of the railing.s shadow, which also says where the sun is. The deck chair reads from its
  KNEE: back up and away, seat near-flat, one piece of fabric bending across both planes, plus
  crossed legs and an armrest. The man at the rail wears a light shirt and trousers, has hair and
  the back of his head to us, and his forearms lie along the handrail.

## Joys — ALL BUILT (0.179.0–0.184.0, M201–M206)

The whole block went in on the night of 2026-08-26/27, one milestone per commit. Every one of them
obeys the same rule and it is the point of the block: **none of them gives anything.** No money, no
data, no reputation, no points, no completion award. They exist so that the game has evenings in it.

- **Holidays on the real calendar** — **built (0.179.0, M201).** `11am-holiday`, suite
  `91zzzm-holiday`, stand `pageshot view -Q "?s=tree"`. New Year (31.12–02.01) and Cosmonautics
  Day (12.04) by the player's real local date. A tree in the cantina and in the living room at
  home, mandarins, congratulations in the ether, and radiograms from the people who wrote in your
  record book — whoever was not there does not congratulate you. The holiday gives nothing:
  no discount, no bonus, no double reward. Done well before 31.12, as the note asked.
- **The travelling cinema** — **built (0.183.0, M205).** `27da-kino`, suite `91zzzq-kino`, stand
  `pageshot view -Q "?s=kino"`. A newsreel rather than a film: six announcer-captioned frames, each
  about something the game actually has. The hall is not rebuilt, it goes dark — screen on the back
  wall, a dusty beam across the room, chair backs and the backs of heads in the foreground, a
  poster saying СЕГОДНЯ. Where and when is computed from the station and the calendar week; only
  which showings you attended is stored, for one line in the record book. Gives nothing.
- **The bookshelf** — **built (0.180.0, M202).** `12ub-books`, suite `91zzzn-books`. Forty books
  found in wreckage — hulk, container, barge — each a title, an imprint and one paragraph, all
  written by hand, because generated prose gives itself away by the third line. Forty different
  voices, not one invented book: regulation, pilot book, children's story, commission report,
  poems, cookbook, an unfinished novel, a first reader with a child's pencil in the margin. One
  wreck always yields the same book (its seed decides), about one wreck in three has one. Shelf on
  the table, the only number is how many of the forty. No award for completing it.
- **QSL cards** — **built (0.181.0, M203).** `11an-qsl`, suite `91zzzo-qsl`. Twenty operators, all
  of them people of this game — winterers, the expedition, far settlements, a lighthouse, an
  observatory, a barge, a children's club allowed on the air for five minutes. Catch one by ear on
  ЭФИР and the callsign is yours: no "note it down" button, because an operator keeps a callsign in
  his head from having heard it, and the dial is the whole mechanism. Send a card from the table,
  wait weeks of real time (lazy, like the pennant), the answer goes on the wall at home. No score,
  no reward: the wall fills up and afterwards shows where you were heard.
- **The travelling pennant** — **built (0.184.0, M206).** `21h-pennant`, suite `91zzzr-penn`. Once
  a quarter the best base — most built, best balanced, NOT most profitable — gets a banner drawn on
  its wall and one line in the ether. Gives nothing at all. Who holds it is computed from the state
  of the bases and the quarter number; only the announced quarters are stored. A test caught the
  tie-breaker being hashed from the key's LENGTH, which is equal for all base keys — the banner
  would have grown onto one base forever.
- **The greenhouse** — **built (0.182.0, M204).** `21g-greenhouse`, suite `91zzzp-green`. Four beds
  beside the house; sowing costs one biological sample and puts in the last species you described
  that is not yet in the ground. Growth is by real days, lazily from `Date.now()`, and Vega waters
  them — with her it grows about twice as fast. The form is reconstructed from the species NAME,
  which in this game is its passport, so one name always grows the same plant. It gives nothing:
  no harvest, no sale, no accelerant.


---

# Moved out of PLAN.md on 2026-08-27 (0.186.0) — the night orders M178–M186, and the closed tails ledger
