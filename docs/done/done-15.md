<!-- docs/done/done-15.md — part 15 of 30 of the done work, in the order it was written; see README.md -->

## Closed

The swept tails of 2026-08-23 (0.100.3 → 0.100.8) are in
[`docs/PLAN-archive.md`](docs/PLAN-archive.md), under “the night orders M178–M186, and the closed
tails ledger”. Nothing there is outstanding.


## Closed queues: 14th/13th pass, night orders M178–M186, the 26.08 queue M188–M206 (moved 2026-09-02)

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
  ~~**Still open there:** warm work lamps with pools on the deck, and rust or colour on some
  crates~~ — **done (0.199.0).** The ceiling strip was visible and lit nothing; its pool now lies on
  the plate and takes the shape of the fixture (a square over the whole cell filled the camera's own
  foreground and read as a brown rug). Crates take a tint from the cell seed, with rust rarer than
  paint. The room has a temperature now instead of one grey. Stands `?s=raidfoe`, `?s=raidhangar`;
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


## After the outside playtest 2026-08-26: items 1–4 (closed) (moved 2026-09-02)

# QUEUE: after the outside playtest, 2026-08-26

An outside playtest arrived (`PLAYTEST-REPORT.md`, `PLAYTEST-01.md`; played on 0.160.0). Its
value is not the list — it is that someone who does not know the game looked at it. What follows
is what survived checking, what did not, and what is still open.

## Open, in the order I would take them

1. ~~**The walker is 3 % of the frame.**~~ — **closed by M217 (0.202.0).** The complaint was
   measured twice and held: the walker is ~26 px drawn 1:1, i.e. 3.6% of a 720-high frame and 1.8%
   on a 1440p monitor — the better the screen, the harder to find yourself. The cause was the
   *ruler*: the surface camera went pixel-for-pixel, so a person's height was measured by the
   monitor rather than by the frame.

   **The route taken (the author's call, 27.08.2026): the scale goes into the transform, and the
   scale goes into the chunk key.** `withScale(k,fn)` (`18c-chunks`) scales the context and, for
   the duration of the world's drawing, sets `W`/`H` to *how much world is visible* (`W/k`, `H/k`).
   Nothing inside knows: every cull, `SURF_HOR`, the far ridge's "measured by the screen" rule and
   the camera's own arithmetic are all computed against the visible world and stay correct — the
   same trick `withCtx` has always used for tiles. The other two routes were rejected on their own
   terms: a smaller buffer blitted up costs the game's best screen its crispness, and multiplying
   every world→screen conversion by hand is the invasive version this note predicted.

   **The raster is baked denser instead of stretched.** `SCK` is how much denser than a CSS pixel
   a cached raster is baked; it multiplies `DPR` inside `mkCanvas`/`withCtx` and enters the key of
   every store, so a slice baked for another scale can never surface stretched. Density is capped
   (`RAST_MAX=3`): on a retina `DPR` already gives two, and baking four times over is memory by the
   gigabyte for a difference nobody can see. Measured cost: `?g11` reads 60 fps in every mode,
   errors empty.

   **The ruler itself:** `surfScale()` = `clamp(min(H/560, W/1000), 1, 2.4)` — the width half added by
   M222 after the phone was asked and answered that height alone is not a ruler. 560 is where the game already sat, so
   small windows change by nothing; 2.4 is the ceiling, past which the road to a target stops
   fitting in the frame and the world becomes a room. The walker now holds ~4.6% of frame height on
   any screen. The cave is scaled by the same ruler (`22-mode-cave`): it is the same man in the same
   world, and having him shrink on the way down would read as a change of game. Input divides by the
   same `G.viewK`, and both round trips are guarded in `91q-planet`.

   **The mine followed in M219** (0.204.0) — the reason for holding it back argued the other way
   once measured: a scaled cell is a bigger target, not a smaller one. **And the interface followed
   in M221** (0.206.0): it now has a ruler of its own off the same frame (`--ui`, applied with `zoom`
   so layout and finger targets move together), deliberately slower than the world, and the canvas
   half of it — target chips, hint band, compass chips, the zoom readout — is drawn in that measure
   too. The phone is left alone.
2. ~~**A full-screen panel with a screenful of nothing.**~~ — **closed by M223 (0.208.0), the
   decision made and applied.** Panels keep their full height — `.scr` carries the `91f-ui` overlap
   guard and every station tab overflows anyway — and a short screen gives its true content the
   height it actually has. The census: the only reachable short standalone screen was the HQ (the
   empty crew screen exists but its button is hidden until crew exists). The HQ room now takes the
   height the panel really offers instead of its old 270 px cap, leaving room for the rows below —
   and it re-measures on window resize, because the first render often happens against an unlaid or
   stale layout (in headless, against the 640×480 fallback the page starts from).

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
   **The two tails are closed by M219 (0.204.0).** The sky boundary was a RULER: a dead straight
   horizontal across the whole frame, sky above, rock below. It now ends where the ground begins —
   one curve (`digSurfY`), and both sides compute it with the same function, because if they ever
   disagree a seam runs the width of the frame. Under it a real profile: turf, loose subsoil with
   stones and roots, then a weathering crust that is BROKEN rather than merely tinted, dissolving
   into fresh rock. It comes from the world, not from taste — the top tone is the planet's own
   palette, the bottom the first geological layer, and on an airless world there is no turf at all,
   only regolith and gravel with not one root. What stands ON the line — tufts of grass, or gravel —
   is drawn in the frame after the sky, because the tile cannot: the sky is laid over the tiles and
   would paint it out.

   The abandoned chambers had their gradient running dark-at-top to darker-at-bottom, i.e. the FLOOR
   was the blackest thing in the cavity, which is exactly backwards and read as a paper cutout. Now
   the roof is nearly black, a back wall of the same rock three times darker stands behind, with its
   own grain, and the collapse pile is the lightest thing there — with slopes broken out of the hash
   instead of a scissor-cut triangle.

   **And the mine now scales like the rest of the world** (the tail M217 left open). The reason it
   was held back — tapping a cell — turned out to argue the other way: the cell gets BIGGER on
   screen, so it is easier to hit, and the conversion divides by the same `G.viewK`. Measuring it
   found a real defect underneath: the tap used `Math.round`, so a cell was owned by the half-cell
   band to its left — aiming at the middle of a drawn cell dug the one to the right and below.
   `Math.floor` now, and it is guarded.
4. ~~**Instruments nobody can read.**~~ — **closed by M213 (0.195.0).** The caption was six pixels
   at 45%% opacity (`6*FS`, `FS` from 1) — not a label, a texture; nine now, and it SHORTENS to a
   three-letter code when the cell is too narrow rather than shrinking further, measured per cell.
   The misclosure got a scale bar rather than a unit, because it has no unit — it is dimensionless;
   what it lacked was any way to see that zero is an end of a range and not a missing reading.
   Stand `?s=cockpit`.

## Трепло in the round (M200) (moved 2026-09-02)

# QUEUE: Трепло in the round (M200) — DONE whole, moved to the archive 2026-08-27

The site's 3D bird: sources in bird/, built by bird.ps1 into site/treplo3d.html. Twenty-odd passes, sound (M228), down layer, page, behaviours, phone budget; per-feather AO closed by the author. The traps that cost time are in the archive - grep it for M200. Stand: docs/bird.html, /dev/treplo3d.html.



## The evening of 2026-08-30/31: M285–M298 and the holding steps as built (moved 2026-09-02)

# QUEUE: the evening of 2026-08-30/31 — what is built, what is designed, what is next

One long session with the author, from a phone screenshot of a crash to a full economic layer on
paper. Written out because the next session starts cold.

## Built and in production

- **M285 (0.282.0)** — a save that cannot kill the flight (`saveText` never throws, names the
  guilty section, writes the rest); a crash line now carries an address; the star's glow made
  continuous (measured 17.4 → 25.4 step, now a monotone fall); the map footer laid out from
  `HUD_FLOOR`/`HUD_RAIL` read off the DOM, with `MAP_BOX` so `91f-ui` can compare canvas against
  markup; `tabsSync`; drones under a blockade say so; an idle hire says so; the «КРИСТАЛЛЫ
  КРИСТАЛЛЫ» stutter.
- **M286 (0.283.0)** — **ДЕЛО** (`27n-ui-deal`): one screen for everything that works for you,
  the drawer back to five doors, ЭКИПАЖ as one man's card, seven 31×40 ghost buttons gone.
- **M287 (0.284.0)** — the actual cause of the crash: the cloud (PHP) returns an empty `{}` as
  `[]`, `poiSeen` became an array, a `hashi>>>0` key stretched it to three billion. `asMap` on
  load for all thirty map-shaped fields; `poiInspect` heals a live session; the quiet half of the
  same bug (string keys on an array are never printed by `JSON.stringify`) is closed with it.
- **M288 (0.285.0)** — **the desk is a desk**: things on the boards, a thing's own tabs only
  inside it, the lamp a pool again, РЕЙСЫ moved into ДЕЛО and `renderFleetRuns` deleted.
- **Almanac issue II** (`docs/ALMANAC.md`) — the interface audited screen by screen against the
  project's own laws (И1…И11), with measurements and a queue.

## Next, in this order — designed, not built

**1–3. Three interface fixes** — spelled out in `docs/DESIGN-ui.md`, section «Three fixes queued
from the playtest of 2026-08-30/31»:

1. **The table in the cantina.** `putOnTable` gives the same line all visit (the seed holds
   `visitHere()`), one reply in five is deliberate silence, and the answer prints into a small grey
   row below the button. The consequences (`placeNote("care")`, `peopleLine`) are invisible. Fix:
   the reply replaces the button, silence looks like an answer, each row says what the move is for,
   and the trace is shown.
2. **Rumour addresses.** «искать у сектора −9:18» cannot be aimed at: off-map, unselectable, no
   coordinate entry, jump range ~3 pc. Fix: the notebook counts distance and jumps and offers «НА
   КАРТУ» (which moves the viewport and draws the search circle, never marks the wonder), and the
   rumour speaks in directions and jumps.
3. **The map.** Measured 31.7% of a 393×830 phone is interface; the system card is 250×110 over
   the reach circle. Fix: the card becomes a footer line with details on a second tap, it stands
   where the view is empty, and a double tap on empty space clears the sky.

**4. The holding — the rebuilt plan.** `docs/CRITIQUE-holding.md` (2026-08-31, six lenses, 37
findings) rebuilt the evening's eight steps; on 2026-09-02 the author settled its forks —
**1(б)** the +X% stays and the share exists but is never paid for surcharged units, **2(б)** the
ПЕРЕПЛАВКА recipes go, **3(б)** all 82 buildings and 48 materials designed at once with numbers,
**4 — later** (the fleet stays bracketed) — and `docs/DESIGN-holding.md` was revised against the
critique the same day. Its §19 is the queue; the numbers are in §4, §9, §10 and §16 there. The
order, each step shipping on its own:

0. **Paper** — done 2026-09-02 (the revision itself).
1. **The route as an order** — R1…R5; КУРС and В МАРШРУТ as two verbs; a leg carries its own
   price note and shows a stale one as a fork; `ROUTE_MAX = 6`; a heard note does not found a leg;
   `earned` and `soldSets` in `G.trade`; the road is not bought twice; only a walked route is sold
   or handed on.
2. **«БЕРЁТ»** — the station's appetite by type, one norm object in place of five mechanics,
   `HOLD_SHIFT = 20 min` with lazy catch-up, the surcharge as an addend in the pressure clamp,
   buying pushes pressure up. «Цены растут» in the first hour.
3. **The site, the hopper and the cargo families** — rung 11 from existing counters; `BLD`
   families A–D (56 rows on one mechanism); `RES` gets 46 industrial keys with `ind`; the hold
   row names the nearest eater; the station's body with the first building; share and stock as
   rows in ДЕЛО, no new screen; **`SMELT` and the smelt tab deleted here.** First share ≤ 40 min
   after rung 11.
4. **The ladder visible** — `RUNGS` with effects at ★ only; the ring from ★5 by five-year plans;
   the moments on the air; the footer ≤ 2 lines; the address tied to the place.
5. **Measure** — `91zzw` «холдинг» against §16 with numbers. Nothing below ships without it.
6. **Your own barge** — feeds, does not trade; the pilot by `CREW_YIELD`; the hull by allocation.
7. **The non-cargo families E–I** — 26 rows, each with its hook and a `bldHas` test.
8. **The station's body — the codex pass.**
9. **КУРС, rumours, news.**

The evening's own eight-step text and the fleet section are kept in the design as the record;
nothing from §18 is queued.

**M289 (0.286.0) — step 1 built 2026-09-02:** a leg only on a seen note, copied into the leg
and shown as a fork when stale; the map from the first leg with the next leg lit and «ПРЫЖОК ПО
МАРШРУТУ»; «ПО МАРШРУТУ · взять/сдать» rows with `buyCargo` (6% spread, an ask that rises with
purchases and touches the buy price only); a walked road sold for two average loops of what it
earned, never twice; `ROUTE_MAX = 6`.

**M290 (0.287.0) — step 2 built 2026-09-02:** `12ab-hold` — `HOLD_SHIFT`, the appetite by
station type (+35% on the first N a shift, an addend inside the pressure clamp via
`marketPrice`), `normsOf` as the one demand object, `sellQuote` behind the hold row and the
button, the ДОСКА «БЕРЁТ» block, the ether line, `G.hold` as the layer's one map.

**M291 (0.288.0) — step 3 built 2026-09-02:** `12ac-bld` (BLD, families A–D, 56 rows, shadow
prices), `12ad-site` (rung from counters with gates, sites by rung, the hopper, feeding on sale,
collecting, промысел stock at 0.7×, industrial goods into a shop, nearest eater, ДЕЛО rows, the
built body), `26c-ui-station-site` (СТРОЙКА under ВЛАДЕНИЯ); 46 `ind` keys in RES; `SMELT` and the
smelt tab deleted. Deeds not yet counted (no counter exists): pirate bases boarded, monuments,
nodes — they join the score when their hooks are written.

**M292 (0.289.0) — step 4 built 2026-09-02:** `12ae-ladder` — RUNGS (30 names, six ★),
`rungHas` as the one door to an effect with a test that every ★ is asked, the ring on the map by
five-year plans with the lights column, the Roman numeral in the footer, moments at docking, the
board's line, the buoy's ether line; ★10 patches the hull at docking.

**M293 (0.290.0) — step 5, the measurement, 2026-09-02:** `91zzw-holding` prints the layer
against §16 and holds three targets as rules; tier-1 assembly cut from two shifts to one so the
first share lands inside forty minutes.

**M294 (0.291.0) — step 6, the barge, 2026-09-02:** `12af-barge` — `ORDERS.barge`, a hire on a
hauler hull, the walked route with your shops on it, a shift-by-shift tick that tips her cargo into
hoppers (blockade skipped), loading and unloading at the counter, the row in ЭКИПАЖ and in ДЕЛО,
the hire whitelist. A sold road does not yet spawn a rival barge on its legs (§2 R4) — that joins
step 9 with the rumours.

**M295 (0.292.0) — step 7, families E–I, 2026-09-02:** `12ag-holdfx` — `bldHas` as the one door,
26 hooks in 19 modules, a test that every id is asked; four effects replaced by honest ones where
the code had nothing to hook (Дружина, Архив, Личный причал, Диспетчерская) and the design says so.
**M296 (0.293.0) — step 8, the body, a first pass, 2026-09-02:** `17e-station-body` — the
moored barge at a Причал, warm lights on the planet's night side; the built forms on the outer
ring judged on the `hold` stand (`docs/shots/hold.png`). Still open in §13: the dump, the dome,
the strip; baking the forms; the codex pass with the author's eye on `/dev`.
**M297 (0.294.0) — step 9, 2026-09-02:** `12ah-holdnews` — news with a cause on laying and
raising a shop (+0.2 on its inputs, a map pin), rumours of the уклад and of where a промысел
would stand, rival barges on a sold road eating the appetite once a shift. «КУРС as the route and
a rumour in one» is the interface fix 2 (rumour addresses → НА КАРТУ). The holding plan's nine
steps are built; the codex pass over the body (step 8) waits for the author's eye on `/dev`.
**M298 (0.295.0) — the three interface fixes, 2026-09-02:** the table answers in the row and
says why; rumours carry distance and jumps and «НА КАРТУ» with a search circle (`G.mapView`,
`G.mapSearch`); the map card is a footer line, the description on a second tap, a double tap on
empty sky clears it (`body.mapclean`). The playtest queue of 30–31.08 is closed.

## First three — built; they turned the present sandbox into Act I

All three organs exist and are guarded (found stale in this list on 27.08.2026 and checked
against `src/` — the queue below is what actually remains):

- ~~**M189 — возможность.**~~ Built: `11ah-offer` — the offer as an entity with a face and a
  silent window, named offers three times richer than cold ones, folk memory as two booleans and
  never a number. Arrives through the counter and the ether, never marked, expires without
  comment. Guarded in `91zzzf-offer`.
- ~~**M190 — игрок как источник слухов.**~~ Built as «ляпнул лишнего» (M194, 0.169.0): what he
  says at a counter travels and comes back days later wearing someone else's face.
- ~~**M191 — тетрадь доброты.**~~ Built: `11ai-ledger` — write-only, never shown anywhere,
  `deedAdd` refuses a deed without a cost, and helping while broke weighs more. Writers already
  live in `11ag-trace` (cargo left at a mark) and `12l-barge` (souls off a dying hull).

## Done

M1–M32 — the base game (see git history). M33 parts and total rig capacity · M34 ship screen with
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
Here is only what is still live — cross-cutting rules, the visual queue and the milestone queue.

---

### What not to do

Depth of field, chromatic aberration, motion blur, lens dirt. In canvas 2D these either don't
read, or read as a defect, and blur requires an offscreen redraw with a filter — expensive.
Vignette and colour shift already give almost the same thing.

### Rules that are easy to break

Same as in M54: expensive things are computed once and cached on the object; structure before
material; the loudness budget; the frame camera is the single source of truth for both drawing
and input (`G.viewX/viewY`, `G.viewCX/viewCY`); fake it instead of computing it; star exoticism
never touches arithmetic; station modules don't unlock services.

---
