# Drift — work plan

Living document: finished milestones collapse to a line, unfinished ones are spelled out.
Links point at modules in `src/`, never at line numbers — numbers go stale after the first
edit, module names don't.

Written in English on purpose: this file is read almost every session, and English costs about
half the tokens. The game itself, its UI and its code comments stay Russian.

## Cross-cutting rules

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
  real-time simulation — the model is `tickDrones()` (`12-economy`).
- **After every milestone:** parse check, empty console, a manual scenario, loading an old save.
  Canvas screenshots are not trusted.

## Done

M1–M32 — the base game (see git history). M33 parts and total rig capacity · M34 ship screen with
hull slots · M41 WebAudio sound engine · M42 generative music with beacons and reverb. Plus the
split into modules and the `build.ps1` build.

**The whole queue below is finished** (July 2026, one milestone per commit):
M43 celestial mechanics and autopilot lead · M44 six station types with type-driven tabs ·
M39 rare resources, gas scooping, smelting · M45 hiring, fleet, orders, lazy simulation ·
M46 wages, debt, morale, repair · M37 base in cross-section with power balance · M38 base network
and transfer · M47 base staff, roles, raids · M40 the lab: hull fusion and part crafting ·
M35 boarding a pirate base on polygons · M36 enemy types, consumables, mezzanines.

Descriptions of finished milestones live in [`docs/PLAN-archive.md`](docs/PLAN-archive.md): they
remain documentation of the decisions taken, but sit apart so this file can be read in one go.
Here is only what is still live — cross-cutting rules, the visual queue and the milestone queue.

---

## M55. Visual work queue (live)

Where we stopped. Everything above the line is built, tested and pushed; everything below is
not started.

### Done (0.14.0 onward)

Points of interest on planets and in the belt, rock material, geology in cross-section, light and
air, sky with a loudness budget, the look of a system and exotic stars, the feel of flight, alien
flora and fauna, a living camera, station modules, weather.

### Remaining, by descending payoff

1. **The mine from inside.** The cave is done (M56), the mine is not: it is still just face
   material. `23-mode-dig`.
2. **Ships by class and faction.** Hulls exist (`03-ships`, `hullOf`/`drawHull`), but the
   silhouette doesn't say who you're looking at: ore hauler, frigate, yacht, surveyor. Only
   pirates fly in a system, and they all look alike.
3. **Cantinas should differ.** A pirate dive, a miners' tavern, an upper-tier lounge: light,
   crowd, music. Right now there is one for the whole galaxy (`26-ui-station`, `renderCantina`).
4. **New world types:** crystalline, jungle, metallic, ruin. The machinery is already ready to
   take them — `TYPES` (02-world), `PROFILE`, `RELIEF_MIX` (07-planet), `GEO_TPL` (18b),
   `WEATHER_BY_TYPE` (19d), `POI_KINDS.on` (20a), flora and fauna leanings (20-life).
5. **Finds in flight:** a distress signal, an abandoned satellite, a drifting container, the
   wreckage of an expedition. The space between planets is currently empty.
6. **The `scoop` and `base` modes** are still on the old graphics.
7. **Factions as a language of shapes** — only after ships and stations, or there is nothing to
   tell apart.
8. **Redo the clouds.** The current blobs of radial gradients don't satisfy the player. Look at a
   value-noise field computed offscreen once per planet, scrolled with a soft threshold (like
   `nebula`/`planetMat`), rather than a set of ellipses. They live in `drawSkyLayer`
   (19-mode-landing).

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

# QUEUE: what is left today

A summary of the M83–M93 tails plus the intent of the eleventh pass. Kept here so a session
starts in one place instead of reading the whole plan. Same rule as before: one milestone, one
commit, and a tail is either done or closed by a decision. There is no separate tail list any
more — **every tail is assigned to the milestone** inside which it closes by meaning, rather than
as a one-off patch.

## The principle behind this queue

The new is the old given a body. The game has accumulated abstractions that spin under the hood
and have no form anywhere: the trade factor computes routes, reputation computes attitude,
`earn()` computes turnover. None of them can be seen, touched or lost. So milestones M94–M105
don't start parallel systems — they give a body to numbers that already exist:

- **the barge** — the body of the trade factor (M94–M95);
- **the rarity** — a line in the monument's existing answer table, only without the right to
  repeat (M96);
- **the planet** — a second growth counter, driven by completeness rather than turnover (M97);
- **the hunter** — the far side of reputation, which it has never had (M98);
- **the retelling** — the body of the time that passes while the player flies the other way (M99).

Hence the order: first the things the rest leans on.

## M94 (0.44.0). Barges: the trade factor gets a hull — DONE

New module `12l-barge.js` (after `12k-rep`, before `13-pirates`). Built, 1307 green, hull stand
captured (`scratchpad/barge-stand2.png`). Legs are taken from the factor; on an empty route there
is an honest fallback (the nearest OTHER station, not the same one: `nearestStation` returned the
current one and the leg collapsed — that was the single failure on the run). Spawning at the end
of `spawnPirates()` — one entry point for all modes. Captain temper, trade without docking, a dot
on the map, the suite `"barges: the route is real"`.

**Found by the stand:** the first exhaust was drawn as overlapping translucent circles — at the
stern they merged into "soap bubbles". A nozzle needs a dark throat and a compact glow, and the
rings must not overlap.

**Left as a tail (into M95):** the barge only flies and trades — pirates don't see it, there is no
escort contract, no wreckage and no passenger. Captain temper in combat (flee / shoot) is declared
by the `BARGE_TEMPER` table but is never read while the barge takes no part in fights. The intent was:

- `G.barges` — a live list, at most six per galaxy; each `{seed, from, to, t, good, qty, cap,
  temper, hp}`. Ephemeral: derived from the galaxy seed and time, never in `snapshot()`
  (cross-cutting rule).
- **The route comes from the real factor**, not invented: the station pair is the one `12-economy`
  would compute. A barge must be a visible consequence of the economy, otherwise it is scenery
  with cargo.
- On the map (`18-mode-map`) — a slow dot between two stations, loaded out and empty back. In a
  system (`17-mode-system`) — an object you can approach.
- The hull is baked by the `12i-pirate-hull` machinery with a new "barge" class: a long body, a
  spine of containers, no weapons. The three assembly rules are mandatory — body first, fittings
  inside the outline, one light as the last layer.
- **Trade without docking.** Price = the destination station's price, 8–12% worse in your
  direction; volume limited by cargo. The player's gain is time, not money: the arbitrage "buy
  from the barge, sell at that same station" must be a loss.
- The captain has a name and a temper (`temper`: greedy / cowardly / fighting) — it drives the
  discount, whether he runs from pirates and whether he shoots first.
- A deal with a faction barge moves reputation (`12k-rep`) like a small station deal.

Suite: **"barges: the route is real"** — every barge's `from`/`to` exist and differ; a barge price
is never better than the destination station; the barge count never exceeds the cap; a barge never
enters the save.

## M95 (0.45.0). A barge in distress, escort runs, wreckage — DONE

Built, 1313 green, the scene frame (crippled barge + wreck) renders without errors; the
distress → rescue → reward pipeline ran as a live cycle. All in `12l-barge.js` plus hooks: your
shot hitting a barge in `updateCombat` (13-pirates), approaching and drawing a wreck in
`17-mode-system`, the rescued passenger as a candidate in `stationMercs` (12a-crew). Wrecks and
passengers persist (`G.wrecks`, `G.bargePax` in 14-save). Suite `"a barge: death leaves a trace"`.

**Decisions taken along the way:**
- a rescue counts ONLY for a barge that pirates were mauling (`wasPirateDistress`): nobody
  "rescues" a barge the player shot up himself — otherwise firing on a peaceful barge would pay;
- under fire the counter is closed (no trading mid-fight): approaching a barge in distress you see
  its hull in percent and the choice "drive them off or finish her";
- a wreck is searched through the `POI_FIND.wreck` branch — the same reward as a planet-side
  "ship wreck", so as not to breed a second source of parts.

**Left as a tail:** captain temper (`BARGE_TEMPER`) is still not read in combat — the timid one
should pull the barge away from pirates, the fighter should shoot back; today temper lives only in
haggling. Finishing off a faction baron is declared as "the way into M98", but the revenge itself
doesn't exist yet — that is M98.

### Original M95 intent

- **Interception.** Pirates (`13-pirates`) see barges. Arriving in a system you may walk into a
  fight. Three outcomes, all counted as deeds: join in (reputation, a share of cargo, the captain
  remembers), pass by (nothing), finish her yourself (reputation drops sharply, the cargo is yours
  — the way into M98).
- **An escort contract** through `11a-quests`: paid up front, route known in advance. Failure
  doesn't take credits — it takes reputation. There is no steady profit here, same as with a hired hand.
- **Wreckage.** A sunk barge leaves a wreck, searched later through the "ship wreck" branch of
  `POI_FIND` (`20a-poi`) — exactly once.
- **A passenger.** Now and then a barge carries a person rather than cargo. Deliver them and they
  surface in the cantina (`27d-ui-cantina`) as a hired hand (`12a-crew`) with their own line about
  that run. This is the only hired hand who comes to you.

Suite: **"a barge: death leaves a trace"** — a sunk barge yields exactly one searchable wreck; a
failed escort pays no credits; a rescue moves reputation within the cap; a passenger never appears twice.

## M96 (0.46.0). A hundred rarities: a table of addresses, not a roulette — DONE

Built, 1340 green (was 1313), parse check and empty console. Module `12m-rare.js` after
`12l-barge`, before `13-pirates`. `RARE` — a hundred records, generated deterministically from a
fixed seed (like `NODES`) and frozen. Persistence is `G.rareFound` (list of ids, default `[]`, in
`snapshot`/`applySave`), cleared by `resetWorld`. Effects are read from `stat()` through
`rareSum(tag)` — the same place as modules and crowns. The rarity board hangs next to the node
sets (`rareRender` called from `nodesRender`).

**The addressing decision.** The galaxy is universal and deterministic (there is no per-save
seed), so an "address" is not a precomputed point but a deterministic function of the place key:
`rareAtPlace(where,key)=pool[hashi(key…)%pool.length]`. The same place (a monument's `q.seed`, a
cave face, a rock seed, a lair's system, a barge wreck seed) always yields the same rarity —
reload-farming can't touch it. A rarity therefore has many addresses rather than one: with
infinite keys and a hundred rarities every one is guaranteed reachable (pigeonhole). The strict
"exactly one address" of the original intent was replaced by "a deterministic answer per place +
guaranteed reachability" — which is honest for an infinite procedural world, and is what the
guard checks (sweeping keys reaches all hundred).

**Hooks (six places, `typeof rareTake==="function"`):** inspecting a monument (`poiInspect`, as
`poi`; a temple with a known coordinate as `temple`, closing the M92 tail), a cave find
(`22-mode-cave`), a worked-out belt rock (`24-mode-belt`), killing a baron while boarding
(`24a-mode-raid`), searching a barge wreck (`12l-barge`). The effect is a small property of a
thing, never credits.

**Left as a tail (into M97/M100):** a museum wall for the hundred rarities belongs in the house
(`27e-ui-home`), with the circumstances of each find; today the board only counts by place and
shows the last six. The planet for a full set is M97 itself.

### Original intent

New module `12m-rare.js`. `RARE` — a closed table of exactly a hundred records
`{id, ru, note, where, effect}`.

- **No drop chance at all.** At world generation every rarity gets exactly one address,
  deterministic from the save seed. Either it is there or it isn't. `G.rareFound` is what has been
  carried off (persisted, default `[]`).
- **Places are taken from the living ones** — like `NODE_WHERE` for nodes: a monument (all ten
  types), the depth of a cave (`22-mode-cave`), the belt (`24b-belt-poi`), a barge (M94), a
  baron's lair (M87), a temple with a known coordinate.
- **Closes the tail "the temple stays silent when the coordinate is known" (M92):** it hands over
  a rarity if the address is here, and that is its repeat answer.
- **Closes the tail "the baron has no trophy of his own" (M87):** the baron's trophy is one of the
  hundred, not a separate system. The other monuments' "repeat answers" close the same way: a
  repeat is a rarity's address, not a second draw.
- **The showcase effect** is small, singular in the meaning of the thing, and never credits. A
  monument is not an ATM, and neither is the showcase.

Suite: **"rarities: a hundred addresses, not one repeat"** — the table holds exactly 100 records,
ids are unique, every `where` value exists among the living places and actually yields a rarity;
none of them pays credits; none can be taken twice. The same guard that found 500 unreachable
nodes at M91.

## M97 (0.47.0). A planet for the collection: a node, not a checkbox

New module `12n-planet.js`.

- **Only for the full set.** 100 out of 100, with no partial handouts: partial progress is already
  rewarded by the wall in the house (M100). A planet can't be bought, just as a house can't.
- **It is the second growth counter.** The house grows from turnover (`earn()`), the planet from
  completeness. The two funnels don't mix.
- **The planet's job is to be a point on the factor's map.** It produces goods like a station, and
  barges start calling on it (M94). The player stops being a client of the system and becomes a
  node of it — that is the reward, not an income line.
- The planet's yield comes as goods, not credits: haul them yourself or wait for a barge.

Suite: **"the planet: full set only"** — nothing is granted below a hundred; the planet never pays
credits directly; the barge router accepts the player's node on equal terms with a station.

## M98 (0.48.0). The shadow of reputation: the hunter and his lair

Today reputation only helps — cheaper hardware, more people at the tables. There is no far side,
and so hostility costs nothing.

- **A personal score.** Attacking a barge or faction ships creates
  `G.hunted[faction] = {cap, seed, tier}` — not an abstract minus on a number but a captain with a
  name who comes after you.
- The hunter's hull is baked by the M82 machinery as a distinct silhouette: he is recognised in a fight.
- **Closes the tail "a lair looks like an ordinary base from outside" (M87):** the lair gets an
  owner, and therefore a reason to look different from outside — his crew's marks on the plating,
  its own dock outline.
- **A contract on a specific captain** — the reward is one-off, never obtainable a second time.

Suite: **"the hunter: comes only for a debt"** — without a hostile deed no hunter appears; a killed
one never respawns; the bounty is paid once.

## M99 (0.49.0). The world moves without you: the retelling

Not a simulation — rolls over elapsed time, told in words. An extension of `12b-crew-events` or a
new `12o-news`. Faking beats computing: the player only ever sees the outcome.

- What happens while you're away: a baron went broke, another faction bought out a station (prices
  and stock changed), someone else sank a pirate captain, a barge vanished on its route, a rival
  collector took a rarity.
- **The decision about the rival:** he does not close a slot forever — otherwise a hundred out of a
  hundred becomes unreachable and the planet (M97) hangs. A taken rarity changes address: it is his
  now, and he becomes the address. A rival is a transfer, not a loss.
- You hear it in the cantina, the same way people already sit there by reputation.
- **Closes the tail "the observatory marks nothing on the map" (M92):** knowledge becomes a layer
  on the map — "prices known", "tip is stale", "the owner changed here".

Suite: **"the retelling: rumours don't lie"** — behind every rumour stands a real state change; no
rumour makes a hundred out of a hundred unreachable.

## M100 (0.50.0). A lived-in house

Collects three debts at once (tails 1, 2 and intent 7 of the previous queue).

- **The things can be poked.** Hit zones right in the scene (`27e-ui-home`): the garage parks a
  ship, the showcase puts out the rare. The buttons in HOLDINGS stay, but stop being the only way.
- **The hallway and the garage become concrete** — after M93 the other seven steps are lived in,
  and these two fall out of the room's language.
- **Hired hands are visible at home.** Whoever is not on a job sits in the living quarters as a
  `hqFigure` body, squeezed to the room's scale (one language of figures across the whole game).
  Morale stops being an invisible multiplier.
- **A housemate** offers something once a pass: a tip, a spare part, a rumour. Livens a step up
  without a new window.
- **The museum wall** for the hundred rarities: not a counter but a ship's log — what was taken,
  where, and under what circumstances. Trophies already hang by zone (M93), the hundred rarities
  belong there too. The progress board goes in the study, not on a separate screen.

## M101 (0.51.0). Nodes and crowns in hand

Intent 8. Crowns are worn as a bar aboard (M91), but the player never sees the thing itself
outside a list. Show it in the cockpit (`25-cockpit`): a holder under the instruments, the active
node visible from where the player spends all their time.

## M102 (0.52.0). Reputation drives who sits in the cantina

Intent 9. Reputation changes the number of tables and the prices, but not WHO walks in. Among your
own, better managers and hired hands with longer run records appear; among strangers, nothing but
random folk. Reputation still doesn't touch the content of the deals: that would turn into access
progression.

## M103 (0.53.0). A trade branch of your own

Intent 10, formerly M84. Now that barges are the factor's body, the player's branch is its mirror:
your own route with legs, run by hand rather than as a spread on the map. A route is an object: it
can be written down, sold and lost.

## M104 (0.54.0). The ship ages

The garage (M93) has no reason to exist while the ship is only repaired after a fight. Hours flown
accumulate layers on the hull — scuffs, dust trails, sun-bleached paint (the live damage layer of
M82 already does this for pirates). You come home because it has piled up, not because something broke.

## M105 (0.55.0). Inspecting a monument remembers why you came

The last remnant of M92: inspection has no memory of its own beyond `G.poiSeen`. If a temple gave
a coordinate, an observatory gave prices and a plant gave a warehouse, that is worth showing on the
monument itself on approach, not only in the journal.

## Rules this queue does not repeal

- a perk, a node, a drop site or a table row without code is a lie, and the suites guard it
  (`nodes: every drop site is alive`, the perk tree);
- the house has no prices, a hired hand has no steady profit, manager seats are always four —
  edits that break this break the design;
- every graphics rework goes in passes over frames, and the faults found are written down in
  words: a list of faults is worth more than a list of achievements.
