# The shipyard — «КБ», the ship as a plan (2026-09-14)

The author, 14.09.2026, after a look at Remember Tomorrow: «мне нравится конструктор кораблей там +
конструктор кораблей Starsector, надо всё исследовать и добавить нам». This is the research, what
we already have, the laws, the design, one fork and the queue К1–К8. Nothing is built yet.

Companion document: `docs/DESIGN-borders.md` — the powers' character in the world. The two meet
at the yard (§5 here): a power's character reaches the player's hands through the hull it builds.

## 0. The two games, one screen each

**Remember Tomorrow** («Помни будущее», SoftWarWare, St Petersburg, 1997–98; remade as Polaris
Sector, 2016). A hull is a volume on up to **five decks**. The player places every component —
engines, shields, reactors, scanners, fuel tanks, colony module, fighter bay, cloak, anti-gravity —
into it; the only limit is the compartments' volume. **The top deck carries weapons with a 360° arc;
guns on the inner decks see ~90°.** The equipment's amount and kind set speed, manoeuvrability and
energy draw. Players' favourite trick: an anti-gravity drive on a battle station — a mobile gun
platform. The remake added energy per area and mass → speed. **Loved:** the hull is engineered, not
filled in — where a gun sits decides what it can hit. **Hated:** re-designing scouts and colony
ships from scratch every game, re-fitting the whole roster by hand after each technology.

**Starsector** (the refit screen). The hull is a fixed chassis: mounts (position, size S/M/L, type
ballistic/energy/missile and hybrids, turret or hardpoint with its arc), built-in hullmods, a unique
ship system, base flux, fighter bays, and **one ordnance-point budget that nothing can raise**
(frigate ≈50, destroyer ≈100, cruiser ≈150, capital 300–400). Weapons, wings, hullmods, flux vents
(+10 dissipation for 1 OP) and capacitors (+200 capacity for 1 OP) all draw on it — every choice
trades against every other; that closed budget *is* the puzzle. Hullmods: built-in (free),
S-mods (a story point welds a mod in and refunds its OP; green bars on the icon), D-mods (scars on
recovered wrecks, cheaper to run, removable for money at a yard). Variants are saved loadouts;
**autofit** fills a hull from stock. Factions read by tech level + palette + weapon lean (low-tech
Hegemony: armour and ballistics, blocky; high-tech Tri-Tachyon: energy, shields, sleek) — an
enemy fleet is identified before any label. **Criticised:** the manual tuning time.

**The shared lesson:** the puzzle is the fun, the repetition is the cost. Both games' top complaint
is redoing the same design; the fast path (autofit, typical designs) is not an extra, it is half of
the feature.

## 1. What we already have (0.449.0)

| piece | where | what it does |
|---|---|---|
| hulls | `03-ships` `SHIPS` (8 hand-built), `04b-fleet` (100 by seed, six tiers), unique, fused (lab) | `thr turn fuel cargo hull` are the hull's constants |
| profession | `03f-hull-role` | six roles derived from the hull — they change which stories are open, not numbers |
| maker | `03a-hull-maker` `HULL_MAKER` | six powers' form grammar, eight dimensions — **look only** |
| slots | `05-parts` `slotsOf` | 4–8 categorical slots by seed + one missile slot, stable order |
| points on the hull | `slotAnchors`, `05d-mounts` `mountsOf` | real geometry; size L/M/H by hull mass (wing tips a step lighter); **жёсткая** on the axis (cone ×.5, dmg ×1.25), **турель** on the sides |
| parts | `05-parts` `{s,t,k,g,i}` | seven kinds, affixes, tiers 1–5, each with a `.cap` |
| one budget | `capOf` 30–48 | modules and parts share it (floor: fully upgraded modules fit any hull) |
| modules | `04-mods` `MODS` | engine, tank, hold, armor, drill, hyper, weapon — station upgrades by tier |
| energy | DESIGN-war §4 | **one bar**: no flux, no venting, no overload (decided, not reopened) |
| shields, hit location | DESIGN-war §4 | three behaviours; a hit from behind ×1.6, from the front ×.7 |
| seen before told | `03e-hull-draw` | fitted guns, shields, engine colour are drawn in flight |
| where you fit | `27j-ui-opis` ОПИСЬ (anywhere), ОСНАСТКА at the dock, `24d-range` стрельбище at every dock | |

**Missing, measured against the two games:** the *plan* (where a thing sits inside and what that
means), the *trade* (the hold against the guns), the maker's *character* beyond its look, the
hull's *history*, and the *fast path*. Starsector's mounts we mostly have; Remember Tomorrow's
decks we have not at all.

## 2. Laws

1. **The hull is a chassis with a plan, and the plan is read from the hull** (`hullOf`), never
   stored. What the player decides — what goes where — is the only thing saved.
2. **One budget, and it is a picture:** the plan's cells. Everything takes cells — guns, reactor,
   tanks, and the hold too. Free cells are free budget; the player sees the budget, not a number.
3. **Where a thing sits changes three things, no more:** its arc (guns), its exposure (the rim
   takes the hits from its side), its sight (instruments in the nose third).
4. **The maker is a character:** one built-in, one limit, one habit — the Remember Tomorrow race
   rule (the Gavaken cannot build a dreadnought and has the best fighters).
5. **The hull remembers:** scars from a wreck, the master's welds — drawn on the silhouette.
6. **No tedium:** ТИПОВОЙ fills any hull from the hold in one tap; three saved проекты per hull; a
   new part shows where it would sit and what it would change.
7. **One energy bar stays.** The plan's energy balance is said in seconds: «в бою садится за 11 с».
8. **Seen before told.** What is placed shows in flight; a pirate's build is read by its silhouette.

## 3. The plan — «чертёж»

**Plan view, nose up** (as the ship flies on the phone), the silhouette from `hullOf` rasterised
onto square cells. Cell side = hull length / N, N = 8 (light) … 14 (heavy); a cell is inside if its
centre is inside `profW(prof,x)` of the body (wings and pods are rim, see below). The widest hull is
~7 cells across, so on a 390 px phone a cell is ≥ 48 px — the 44 px rule holds without zoom; the
plan scrolls lengthwise.

**Decks** (Remember Tomorrow's floors, as tabs): **ОБШИВКА · ПАЛУБА 1 · 2 · 3**.
- **ОБШИВКА** — the rim and the spine. Mounts live here and only here:
  - **нос** (rim cells of the nose third, on the axis) — **жёсткая**, as today;
  - **борт** (rim cells on the sides, wing tips, pods) — **турель**, the arc opens outward
    (90–180° by how far out it sits), as today;
  - **хребет** (spine cells on the axis behind the nose third) — **БАШНЯ**, new: 360°, Remember
    Tomorrow's top deck. Its price is spatial: the barbette goes down through every deck beneath
    it and takes that cell on each. A heavy башня on a three-deck hull costs four cells.
  Mount size stays `mountsOf`'s (hull mass, a step lighter on the wing).
- **ПАЛУБЫ** — one to three inner decks by size (light 1, medium 2, heavy 3), each the silhouette
  shrunk by one cell per deck from the rim (upper floors are narrower). Everything that is not a
  gun lives here.

**Footprints** — three shapes only: **1** (a cell), **2** (two in a line, turns), **4** (a square).
Enough for a packing puzzle (the Resident Evil case, the backpack games that sell on phones), not
enough to become Tetris homework.

**Rules of place** (each one a sentence on the card when it refuses):
- engines sit on the **stern row** of the lowest deck — the nozzle has to go through the skin;
- the reactor never sits on the rim — «реактор у борта не ставят»;
- instruments see from the **nose third** only — elsewhere they are cargo;
- a thing on the rim takes that side's hits: when the hull is hit from a side, the rim part on that
  side takes wear (`12s-wear`) — the rear ×1.6 of §4 now also means «engines take it»;
- **the hold is what is left**: free inner cells are ТРЮМ; one tap paints/unpaints a free cell as
  hold, the rest stays empty (empty cells are lighter — see mass).

**The ship's numbers are the plan's sum:**

| number | from |
|---|---|
| cargo | hold cells × the hold module's density (tier = density: a tier-3 hold packs more per cell) |
| fuel, jump | tank cells × tank density |
| energy | reactor cells × reactor output (the `weapon` module becomes the reactor, as §4 already says) |
| hull points | the hull's own + armour parts (kind `hull`) |
| thrust, turn | the hull's own × **mass factor**, clamped to .8…1.1 — mass is the plan's sum against the typical plan's mass |
| sight | instruments in the nose third |

**The fixpoint that protects every save:** the hull's current numbers (`SHIPS`, `FLEET`, unique,
fused) are what its **typical plan** gives. The packer (§7) turns every existing fit into a plan;
for an unchanged old save every number equals today's ±1, and nothing that fits today unfits.
Only a deliberate re-plan moves the numbers. The floor rule of `capOf` survives as «a fully
upgraded module set fits any hull's plan».

**Bounds, so trade does not break:** cargo never above ×1.4 of the hull's nominal (the hold module
density is capped by hull size); the worlds oracle (`91zzzzzzzzz-worlds`) gets a line for the
best one-hop deal on a stripped hauler.

## 4. The maker's character — three lines per yard

The same class drawn by six conveyors already looks six ways (`HULL_MAKER`). Now it also *works*
six ways. **Built-in** is free and cannot be removed; **limit** is the price; **habit** is how the
plan is shaped. Numbers are starting points for К5's calibration pass.

| yard | built-in | limit | habit of the plan |
|---|---|---|---|
| **ГЛАВТРАССА** | **бронепояс по ГОСТу**: +25 % hull points, +8 % mass | **по разнарядке**: the yard sells only typical plans; a hull of yours may be re-planned anywhere, but a new one comes standard | square cells, the most decks per length, the cheapest hull; a slogan along heavy hulls |
| **Компания** | **спонсор на борту**: −15 % hull price; a running line along your hull in flight; Компания docks free | **всё платно**: every cell moved at a Компания yard is billed, a receipt comes in ПОЧТА | capsule profile — rounded corners, fewer corner cells; one extra missile mount |
| **Орднунг** | **лобовой щит в комплекте**: a front shield cell that needs no part | **по формуляру**: every thing sits on the numbered grid, footprints do not turn | rectangular plan — the most cells for the length; the most жёсткие |
| **Коммуна** | **лишняя кривизна**: turrets turn +30° wider | beauty eats volume: −15 % cells; the yard is shut at lunch and during a strike (`12ay-fx-soc`) | long swan hulls, names instead of numbers |
| **Рассвет** | **ремонт из хлама**: hull points come back from debris in a fight | no башня above medium — «мы тараном» | **the only yard that welds on**: adds a pod (+2–4 cells) to *any* hull — «собран из трёх»; irregular plan |
| **Хай-Фронт** | **дальний захват**: a free instrument cell in the nose, sight +1 step | fragile: −15 % hull points; the yard never sells the same hull twice (stock turns every сводка — «сняли с производства вчера») | minimal plan, antennas longer than the hull, light from under the plating |

Pirates have no yard. Their hulls are other people's, and they come with scars (§6).

## 5. Where it lives

- **ОПИСЬ** (anywhere, in flight): the plan is shown as it is; a part can be swapped for one of the
  same footprint on the same cell. Nothing moves. (Starsector refits only at a market; our field
  swap is the courier's convenience and stays.)
- **КБ** — a station tab wherever there is a yard: the full editor — place, move, turn, paint hold,
  ТИПОВОЙ, ПРОЕКТЫ. Free at your own flag's yard; a foreign yard bills by cells moved and its
  maker's limit applies to its work.
- **СТАПЕЛЬ** — order a new hull, **only at a power's yard in its territory**: class (the seven
  `HULL_CLASS`) × size (light / medium / heavy) × two sliders inside the maker's grammar (length,
  width or wing). The generator draws it live as the sliders move; the price is on the button.
  The order is ready after one сводка, a line in ПОЧТА says so. **Persisted: only the order**
  `{by, cls, size, l, w, seed}` — the hull is regenerated from it (never persist the derived).
  This is how the powers' character reaches the player: to fly a Хай-Фронт hull you go to Хай-Фронт.

## 6. The hull remembers

- **Шрамы** (Starsector's D-mods): a hull taken from a wreck, towed or captured has 1–3 scars —
  a burnt cell (unusable), a bent mount (arc −30 %), a leaky tank cell (fuel −1 %/min while that
  cell holds a tank). Drawn on the silhouette where they are. A yard repairs a scar for money; a
  scarred hull is cheaper to buy. Scars persist (they are the hull's history, not derived).
- **Доводка** (Starsector's S-mods): a master at a yard welds one placed thing into the hull — it
  gains one tier of effect and can never be moved again; a weld seam is drawn around it. Two per
  hull at most. Paid with money and a **node** (`05a-nodes`), so it stays rare and tied to the
  dangerous sectors where nodes drop.

## 7. The fast path

- **ТИПОВОЙ** — one tap packs the plan from the hold by the maker's habit: engines astern, reactor
  in the middle, instruments forward, the best gun per mount size, tanks to the nominal fuel, the
  rest hold. **The same packer** migrates old saves (§3's fixpoint), fits the fleet and NPC ships,
  and fits pirates — so a pirate's plan follows the rules the player plays by, and its silhouette
  tells the truth about it.
- **ПРОЕКТЫ** — three named plans per hull («рейсовый», «боевой», «пустой трюм» by default,
  renameable); switching is free at your own yard, billed at a foreign one.
- **A new part in the hold** is marked on the plan where it would fit, with the delta — the
  ПРИБОРЫ future panel (`opisShipFuture`) already computes it.

## 8. On the phone

Nose up, the plan fills the width; deck tabs on top; under the plan the **tray** — the things in
the hold that fit the selected cell glow, the rest are dimmed. Tap a thing, tap a cell — placed;
long-press lifts, as in ОПИСЬ; a refusal is one line of the rule of place. One strip of numbers
under the tabs: **ЯЧЕЙКИ 34/40 · ТРЮМ 90 · БАК 140 · ЭНЕРГИЯ «в бою 12 с» · РАЗГОН ×0.94**, each
coloured by its delta from the saved plan. «Проверить» → the стрельбище, as today.

The drawing of the plan is a new visual system and gets its own almanac issue: the plan is a
blueprint on paper (the КНИЖКА/ОПИСЬ cloth), cells as a pencil grid under the silhouette ink,
things as inked stamps of their kind — a «Техника — молодёжи» centrefold, not a spreadsheet.

## 9. The fork — decided by the author, 14.09.2026: **yes, cells**

**Do the hold and the tanks become cells?** — i.e. can the player strip the guns off a hauler to
carry more, or strip the hold off a warship to arm it.
- **Yes (recommended).** Laws 2 and 3 are the whole point; without it the plan is a drawing of
  `capOf`. Cost: the economy guard in §3 (cargo ≤ ×1.4 nominal) and one calibration pass.
- **No.** Cargo and fuel stay the hull's constants; the plan decides only guns, shields, reactor,
  instruments. Cheaper by one pass; the trade is gone and Remember Tomorrow's essence with it.

The rest was decided on the author's behalf: two sliders on СТАПЕЛЬ, not free drawing (the maker
grammar is what makes a hull read as a power's); three footprints; mass clamped to .8–1.1 so
flight feel under the finger does not drift (the phone playtest's P8); one energy bar.

## 10. The queue — К1–К8, each playable on /dev

- **К1 the plan, read-only.** Cells and decks from `hullOf`; rim/spine/deck classification; the
  packer; the fixpoint suite (every hull in `SHIPS`, a fleet sample, unique, fused: numbers equal
  today's ±1); ОПИСЬ shows the plan. No new save field yet.
- **К2 the КБ editor.** Tray, place/move/turn, hold paint, the rules of place with their refusal
  lines, the numbers strip; the save field `G.plan[shipId]` (list of `[thing, deck, cx, cy, turn]`)
  in `snapshot()` with the packer as `applySave` default; ОСНАСТКА's hull section becomes КБ.
- **К3 the numbers from the plan.** Cargo, fuel, energy, mass → thrust/turn; module tiers become
  densities; the bounds; the worlds oracle line.
- **К4 башня, exposure, sight.** The spine mount through the decks and its drawing in flight
  (a round turret on the back — the loadout read by silhouette); rim parts take their side's wear;
  instruments count only forward.
- **К5 the six yards' character.** Built-ins, limits, habits; calibration by the worlds oracle and
  the стрельбище.
- **К6 СТАПЕЛЬ.** Hull orders at a power's yard in its territory; the live preview; the order in
  the save; ПОЧТА line; delivery.
- **К7 the hull remembers.** Scars on wrecks and captured hulls, repair; доводка with a node.
- **К8 the fast path everywhere.** ПРОЕКТЫ; NPC and pirate ships built by the packer; the new-part
  mark.

Each pass: the craft codex for anything drawn (§1 layer order, §13 body-outline-one-light), the
phone at 390×844, and the old-save load.
