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

## M97 (0.48.0). A planet for the collection: a node, not a checkbox — DONE

New module `12n-planet.js`. Built, all green (1815 assertions), suite `91q-planet`. The hundredth
rarity grants the planet you are standing on (`planetGrant` from `rareTake`); stock accrues lazily
by real time and is capped per resource; `planetHaul` only works in the node's own system. The
barge router takes the node as a stop (`planetStop` inside `bargeSysAt`, a leg in `bargeLegs`), and
a passing barge carries your goods to you for free (`planetBargeLoad`/`planetTakeLoad`) — a
delivery, never a purchase. Persisted through `G.pnode`; the save format stayed `v:4`.

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

## M98 (0.49.0). The shadow of reputation: the hunter and his lair — DONE

New module `12o-hunter.js`, suite `91r-hunter`, all green (1837 assertions). `huntMark` is the only
entrance and it is called from a deed (`bargeSunk` by the player), never from a number; `huntHere`
keeps him inside `HUNT_RADIUS` of his own sector; `huntSpawn` puts him into `G.pirates` through the
one entry point everybody uses, with the flagship bake (12i) for the silhouette. `huntDefeated`
writes `dead`/`paid` — the bounty is one-off and survives saves. The lair got its owner: in his
sector the base takes his name and colour outside and one more tier of guard inside.

**Deliberately left for the visual queue:** his crew's marks on the lair plating and its own dock
outline. Today the difference outside is name, colour and guard — real, but not yet drawn.

## M98 (0.48.0). The shadow of reputation — original spec

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

## M99 (0.50.0). The world moves without you: the retelling — DONE

New module `12p-news.js` (12o went to the hunter), suite `91s-news`, all green (2820 assertions).
Five kinds of change, each applying real state before it says a word: market pressure, an owner
swap, a barge wreck added to `G.wrecks`, a sector quieted through `occCalm`/`occSet`, and the rival
collector. Rolled lazily off `G.newsT`, at most three per return, heard in the cantina. Every
rumour drops a `newsMark`, and the map draws that layer (M92 tail closed). The rival takes only
rarities you have not found, never the last free one, flies his own sector as an ordinary
`G.pirates` entry and yields the piece when beaten — `rareTake` on his address tells you who has it
instead of going silent.

## M99 (0.49.0). The world moves without you — original spec

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

## M100 (0.51.0). A lived-in house — DONE

Suite `91t-home-live`, all green (2846). Hit zones (`HOME_HIT`/`homeHitAt`/`homeSceneClick`) are
emitted by the drawing pass itself — one description of the geometry, not two. The hallway grew to
50 units and got a real doorway, coats with shoulders, boots and a shelf; the garage got a
workbench, a tool board, a drum and a puddle. Crew at home are drawn as `hqFigure` bodies with
morale in the pose (`homeCrewFigure`). The housemate (`homeMate*` in 12j) gives one thing per tier,
remembered in `H.mateTier` through the save. The museum wall hangs in the study, with the progress
log in the panel below.

**Faults found by eye in this pass** (worth more than a list of achievements): coats read as a
bottle in a 40-unit hallway; the tool board sat inside the ship's hull; the ship floated above its
trestles; the power cable crossed the silhouette; the museum wall shouted over the room until its
colours were mixed into the wall.

## M100 (0.50.0). A lived-in house — original spec

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

## M101 (0.52.0). Nodes and crowns in hand — DONE

`nodeHold`/`nodeHolder` in `05a-nodes`, drawn live in `drawCockpit` (not in the baked dash texture:
the node changes and it sways). Persisted as `G.nodeShow`, validated against the collection on
load. Tests added to `91m-nodes` — "the holder: the thing stands where you look": a node you do not
own cannot be put in, the holder never touches `stat()`, and a node that leaves the collection
leaves the holder. **Fault found by eye:** on the central stack the node collided with the pitch
ladder and the hull nose and read as a rock outside the glass; it moved to the left pillar.

## M101 (0.51.0). Nodes and crowns in hand — original spec

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

## M105 (0.47.0). Inspecting a monument remembers why you came — DONE

Taken out of order, ahead of M97–M104: it is the ground the obelisks (M106) stand on, and a
monument with no memory cannot carry a second, dated answer. Built, 1348 green (was 1340), empty
console, live scenario on the surface: walk up, inspect, walk away, come back and read it.

`G.poiSeen[seed]` now holds `{k, got, t}` instead of `1`, read through the new `poiMemo(seed)`
(`20a-poi`). The save format does not change (`v:4`): an old save holds `1`, and `poiMemo` reads
that honestly as "inspected, but what it gave is no longer remembered" — guarded by the suite.
On approach the prompt shows the monument's own answer instead of a bare "ОСМОТРЕНО"
(`21-mode-surface`).

**Found on the way, and it is the bigger half of this milestone.** The surface had its own,
cut-down inspection inline in `21-mode-surface` — data plus a node — and never called
`poiInspect`. So the whole `POI_FIND` table was dead in the actual game: the temple's coordinate,
the observatory's prices, the factory's warehouse, the gates' fuel and the rarity hook (`rareTake`,
M96) fired only in tests, which called `poiInspect` directly and therefore reported green. Ten
shapes on the horizon really were ten ways to get the same thing. The surface now goes through the
single door. The lesson is worth keeping: **a suite that calls the function instead of the path
proves the function, not the game.**

**Left as a tail (into M106):** a monument's memory is per-seed and lives only on the ground —
nothing shows on the map that this planet has already been read. The obelisk needs exactly that
layer, so it is built there rather than patched in here.

# QUEUE: the twelfth pass — the thing that is found in pieces

M94–M105 gave a body to numbers that already existed. This pass gives the galaxy a **reason to be
crossed**. Today the far corner differs from the near one by a coefficient (`sysDanger`) and
nothing else: no place is worth reaching for its own sake. Everything below exists to fix that,
and it hangs on one long story the player assembles out of fragments.

## The principle behind this queue

**A fragment is useful before it is understood.** A piece of the story never arrives as a piece of
the story. It arrives as a coordinate, a price, a schematic, a word of their language — something
that pays on the spot. Only later does it turn out that the twenty things that paid were one
account of what happened here. The player assembles the story out of greed, not politeness.

Three consequences, and they are binding:

- **No lore item.** Nothing in the game is picked up whose only property is text. A fragment lives
  on the back of a thing that already has a use (an address, a rate, a vocabulary entry). If a
  fragment can be deleted without any mechanic noticing, it is a lie in the sense of the perk rule.
- **The story is closed and finite**, like `NODES` and `RARE`: a fixed table generated from a fixed
  seed, with a guard sweeping for reachability. An infinite generated story is noise.
- **The end changes the map, not the text.** The last answer is a state of the world — a layer, a
  route, a settlement that lives or doesn't — not a screen with the truth on it.

## The shape it is told in: a survey that turns into an investigation

The structure this pass follows is the one classic Russian children's science fiction uses — a
collecting expedition that stumbles into a mystery and solves it by **interviewing witnesses**,
each of whom holds one piece and none of whom can simply tell you. Nothing is borrowed but the
architecture: the names, the places and the creatures here are our own, and no character, phrase
or plot of anyone else's book enters the game. What we take is a way of building, and it is worth
spelling out because it is stricter than "collect fragments":

1. **The question comes before the fragments.** The player is not handed a mystery to be curious
   about; he walks into an incident in the first hours — something happened here, plainly, and it
   was aimed at somebody. Everything after that is him asking about it while doing his job.
2. **Every witness is partial and none of them lies.** One repeats a phrase it does not
   understand. One saw the end and not the beginning. One was there and no longer remembers,
   because that is what was done to him. Contradictions come from vantage, never from deceit —
   a lying source teaches the player to distrust sources, which kills the whole structure.
3. **The witnesses are places and creatures, not text boxes.** A mined-out world with a machine
   still transmitting to nobody. An animal that repeats what it heard. A settlement that remembers
   a face. All of these are things the game already knows how to build.
4. **The villain is someone the player already knows and has been dealing with comfortably.** Not
   a hidden power: a familiar figure with a plausible trade. The reveal costs the player something
   he had come to rely on, which is the only kind of reveal that lands in a game.
5. **The truth is a person, not an event.** At the end of the chain there is someone the
   expedition left behind — alive, and unable to say so.

## The spine

Kept here so every milestone below can be checked against it. The player never reads this; he
reconstructs it.

The obelisks were not put up by aliens. They were put up by the **expedition before yours** —
people with the same job, the same barges, the same debts. They mapped this arm, seeded settlements,
built system defences, and left their survey the only way that survives without power: cut into
stone, addressed by sky events rather than by coordinates, because coordinates drift and the sky
does not. Then they stopped arriving.

The locals remember them — not as gods, as the people who used to come. Their language is the
expedition's pidgin, worn down; that is why fragments teach you to speak with them.

What the expedition found, and what their obelisks are dated against, is a thing on a schedule.
That is why the story is a **calendar**, not a treasure map — and why the last chapter is an
evacuation and not a boss. The player's own settlement is the fork: repeat their run, or do the
one thing they failed to do.

**They did not all die, and that is the answer at the end of the chain.** The expedition was cut
apart on its last leg by people who traded with it — and one of its officers came out alive, with
his record wiped, and has been in the galaxy ever since doing small work at the tables. He is not
hidden anywhere: the player meets him early and cheaply, as one more face in a cantina. He cannot
tell his own story because it was taken from him; the fragments the player collects are the pieces
of it, and what returns him is having his own account read back to him. That is why the ending
needs no revelation screen — the payoff is that a man the player had been walking past for twenty
hours stands up and finishes the survey.

**And it was not pirates.** The ones who cut «Долгий Ход» apart were its counterparties — the
trading house that ran its supply legs, `«Ласковый»`. Which means the reveal costs the player
something he uses daily, not something he was already fighting. The survivor is **Тихоня**; the
thing on schedule is **Прибой**; the names are set out in full below.

## M106 (0.56.0). Obelisks: the map is opened, not scanned

New module `12q-lore.js` (after `12n-planet`, before `13-pirates`), plus a new kind in
`POI_KINDS.on` (`20a-poi`) and a layer in `18-mode-map`.

- **`LORE` — a closed table of exactly 100 fragments**, generated deterministically from a fixed
  seed and frozen, exactly like `NODES`/`RARE`. Each `{id, ru, gives, chap, word}`: `gives` is the
  useful payload, `chap` its place in the account, `word` the pidgin entry it teaches (M109/M116).

**What a hundred forces, and these are decisions, not notes.** Forty fragments could each be a
separate trip. A hundred cannot: at ten minutes apiece that is a second job, and the last thirty
would be filler by arithmetic. So the number changes the design in four places:

- **Fragments come in clutches.** A satellite hands over three or four at once, a machine world's
  log a dozen, the meadow (M117) a whole scene's worth. The unit of travel is a **site**, not a
  fragment; roughly 25–30 sites hold the hundred. This is what keeps the pace of forty with the
  density of a hundred.
- **Eight chapters, and a chapter reads as soon as it is whole.** `chap` groups the hundred into
  eight accounts of about a dozen each. The player never waits for 100/100 to understand anything:
  a finished chapter is a finished thought, and the assembled record (M115) is the eight together.
  A hundred-piece story with one payoff at the end is a hundred-piece story nobody finishes.
- **Completion is not required, and the guard enforces it.** Every chapter is legible from any
  two-thirds of its fragments — the missing third repeats what its neighbours already said, from
  another vantage. A hundred mandatory pieces would make the ending hostage to one unlucky address.
  The full hundred earns the survey layer's last quarter and nothing else.
- **The vocabulary is a subset.** Only about 30 of the hundred carry a `word`; the rest pay in
  addresses, prices and schematics. If every fragment taught a word, the pidgin would be readable
  long before the story was, and M116's retroactive decoding would fire all at once instead of
  arriving in waves.

**And it must not become a second `RARE`.** There are already a hundred rarities (M96), and two
hundreds side by side read as one grind unless they differ in kind. They do, and the difference is
load-bearing: a rarity is **taken from a place**, one address, and is over. A fragment is **heard
from a witness** — it can arrive twice from two vantages, it can decode later than it was
collected (M116), and it is worthless alone and worth a lot in a chapter. Rarities are a
collection; fragments are testimony. Any edit that makes fragments droppable loot breaks this.
- **Addressing follows M96's decision**, which is now proven: not a precomputed point but
  `loreAtPlace(where,key)` over the place key. An obelisk's key is its system key, so the same
  obelisk always says the same thing and reload-farming can't touch it.
- **What an obelisk gives is an address, never a fact.** The reveal on the map is one system with a
  name and one thing actually in it — not a scanned area. And it is always **outside the current
  jump radius**: an obelisk that reveals a neighbour is a decoration. The layer is `G.loreKnown`
  (list of ids + revealed system keys, persisted, default `[]`).
- **The obelisk is a monument**, so it inherits M105 for free: on approach it shows what it already
  gave you. Its repeat answer is a rarity address (M96), not a second fragment.
- **The second answer is dated.** Part of what an obelisk holds does not open until a sky event
  (M107) is standing over it. Then the same monument, in the same place, says a second thing. This
  is the single hook that makes the calendar a mechanic instead of a light show.

Suite **"the obelisks: every fragment has an address"** — the table holds exactly 100 records, ids
unique, every fragment reachable by sweeping keys, no fragment obtainable twice, every revealed
system exists and holds the thing that was promised, no reveal lands inside the current jump
radius, all eight chapters are non-empty, and no chapter needs more than two-thirds of its own
fragments to read. The same guard that found 500 unreachable nodes at M91.

### M106 — state on pause (built, green, not finished)

Built and pushed at 1780 green (was 1348), empty console, live scenario walked on the ground:
approach → inspect → fragment taken → address recorded outside the jump radius → map drawn with
the mark. New module `12q-lore.js`, new POI kind `obelisk` (`ЗАРУБКА`), `drawLoreMarks` called from
`18-mode-map`, `G.loreFound`/`G.loreMarks` in the save with safe defaults (`v:4` untouched), suite
`91p-lore.js` in four parts.

**Decision taken along the way.** The plan wanted a per-witness pool like `RARE_BY_WHERE`. Dropped:
obelisks are the only witness that exists today, so five of six pools would be unreachable until
M116–M118 and the guard would have to be weakened to stay green. `loreAtPlace(key)` therefore maps
any place key over all hundred — every fragment reachable from day one, and later witnesses add
density instead of unlocking regions.

**Also done:** `20a-poi.js` crossed the 40 KB guard the moment the obelisk was added, so it was cut
at its natural seam — `20b-poi-find.js` now holds the inspection half (`POI_FIND`, `poiInspect`,
`poiMemo`); `20a` keeps generation and drawing.

**Faults found by looking at the stand, in words, and only half fixed:**

1. three obelisks on three seeds were indistinguishable — tilt was ±0.04 and width constant.
   Fixed: width ±35%, real lean, cut angle and fall direction all come from the seed;
2. the body was drawn near-black and read as a hole cut out of the terrain rather than as stone.
   Fixed: it fills with the rock colour and takes a side gradient (sun on the right, per
   `drawSkyLayer`), plus a lit edge and a light lower lip on each notch;
3. **not fixed — the notches still read as wallpaper.** Even rows of even hatching across the whole
   face. They must read as a tally: grouped, uneven, thinning downward, some rows struck through.
   This is the difference between "a decorated stone" and "somebody was counting something here";
4. **not fixed — the base shadow is a round black blob**, too dark and too circular for a stone
   that has been standing in dust;
5. **not captured — there is no stand shot in `docs/shots`** and no `docs/mkstone.ps1` alongside the
   other stand scripts. The stand was assembled by hand in the console; it should be a script like
   `mkfoes.ps1` so the next pass can look at the same frame.

**Remaining tail for the next session:** faults 3–5 above; the obelisk's second, dated answer
(needs M107); and the fragment board — a hundred pieces and eight chapters are collected with no
place to read them, so the record currently lives only in `tell()` and the journal.

## M107 (0.57.0). The sky keeps a calendar

New module `06a-celest.js` (after `06-galaxy`, before `07-planet`) — pure arithmetic over the
orbits M43 already computes honestly. Drawing hooks into `19-mode-landing` (sky), `25-cockpit` and
`20-life`.

- **Four events, all computed, none rolled:** conjunction (a parade — three or more bodies inside
  an angular window), eclipse (a moon crosses the star from the surface point you stand on), a
  comet on a long ellipse, and the nebula the system already sits in read as weather rather than
  backdrop.
- **`celestAt(sys, t)` is a function of time, not a state.** Nothing about it enters `snapshot()` —
  cross-cutting rule. A date is a number the obelisk can name and the player can wait for.
- **It is light, not UI.** An eclipse drops the key light and lifts ambient blue; the astronaut's
  shadow shortens and dies; flora that leans on light closes (`20-life`), fauna quiets. A parade is
  a line of discs in the sky with the loudness budget respected — the sky does not start shouting.
- **Almost no arithmetic.** The rule from exotic stars stands: the sky never touches prices or
  yields. Its one mechanical right is opening an obelisk's second answer (M106) — a date is worth
  travelling to because of what stands there, not because of a bonus.

Suite **"the calendar: the sky is computed"** — the same system and time always give the same
event; an eclipse only ever occurs where a moon can actually cross; no celestial state persists;
no event changes a price or a yield.

## M108 (0.58.0). Finds in flight, and half of them are theirs

Closes item 5 of the visual queue (`M55`) — the space between planets is empty — and pays the
story's rent at the same time. `17-mode-system`, reusing `POI_FIND` (`20a-poi`) and the M95 wreck
machinery rather than growing a second one.

- Four kinds: a distress signal, a dead satellite still transmitting, a drifting container, the
  wreck of a survey ship. All are approached the way a barge wreck already is.
- **The satellite is the expedition's**: it is the one find that carries a fragment, and what it
  transmits is a bearing you can fly. The other three pay in the ordinary currency of the game.
- A find is deterministic per system key + a coarse time bucket, so the space is not a slot machine
  and cannot be farmed by re-entering.

## M109 (0.59.0). The settlement: you give, they decide

New module `12p-settle.js`. The largest thing in this pass, and the one most at risk of becoming a
second base system. It must not be.

- **`G.settle["sx,sy"] = {seed, stage, mood, stock, built[], lastTick}`** — persisted, sparse, keyed
  like everything else. Growth is a lazy roll over `Date.now()-lastTick` with the offline cap, the
  `tickDrones()` model, never a live simulation.
- **You cannot order.** The whole difference from your own base (M37/M38) is authority: you hand
  over resources and they choose what to raise, by their own leaning (from `seed`) tilted by what
  you kept giving. Handing them ore for ten hours makes a different village than handing them
  volatiles. The player's control is a diet, not a build menu.
- **They pay in goods, on their terms.** No wage, no percentage, no steady line: you fly in and ask,
  and `mood` decides how much is ready. The hired-hand rule applies unchanged — this is a bet, not
  an income stream. Edits that make the settlement a reliable earner break the design.
- **At stage 3 they become a point on the factor's map** and barges start calling (M94), exactly as
  the player's planet does at M97. That is the real reward: you put a node on the map that trades
  without you.
- **Their speech is the expedition's pidgin.** No translated text ever. A settlement answers in
  glyphs drawn from its seed; each `LORE` fragment (M106) unlocks one word, and an unlocked word
  turns a guess into a request you can actually make. This is what stops fragments from being lore:
  vocabulary is the interface.

Suite **"the settlement: a gift, not an order"** — no call path lets the player choose a building;
the settlement never pays credits; growth respects the offline cap; a settlement below stage 3 is
invisible to the barge router; every glyph shown corresponds to an owned fragment.

## M110 (0.60.0). The ones who live here stand between you and the fauna

Small, and it is what makes M109 felt on foot rather than in a tally.

- Inside a settlement's biome, hostile fauna (`20-life`) keeps its distance — not a buff on the
  player but a fact about the ground: their watchers are out there, and you can see them working.
- It cuts the other way. Pirates you pull in over their heads land on them: a raid in a settled
  system costs the village `mood` and buildings, and that is the price of using them as cover.
- The tie into M98: a hunter who follows you here does not care whose roof it is.

## M111 (0.61.0). System defence: the battery that is built, not bought

A building in the base cross-section (`21a-mode-base`), inside the existing power balance — it eats
reactor output, so defence competes with production and is a real decision.

- It fires at pirates in **its own system**, visible from `17-mode-system` as a line from the ground.
- **It cuts the small raids only.** Killing pirates as content is not on the table: the battery
  clears the noise so the player stops flying home for nuisances, and does nothing against a baron
  or a hunter (M98). Edits that let a battery hold a system break the design.
- The expedition built these too, and the ruined ones are on the ground already — a dead battery is
  one of the places `loreAtPlace` answers.

## M112 (0.62.0). Missiles

A new part kind in `05-parts` with its own slot behaviour, not another number on the existing gun.

- **Ammunition is cargo.** A missile takes hold space, so arming up is paid for in the same currency
  as trading — the decision is logistics, not a purchase. That is the whole reason this is
  interesting; a missile that fires forever is just a bigger gun.
- Crafting sits with the lab (`12h-relic`) alongside part crafting, so warheads come out of the
  system that already exists.

## M113 (0.63.0). Local scrip and a rate that moves for reasons

`12-economy` plus the retelling (M99). The riskiest idea in the pass, so the guard rails come first.

- A faction's scrip is not a second wallet — it is a **claim on that faction's stations**, bought
  and sold at a spread. Holding it is a bet on that faction's fortunes.
- **The rate only moves on events that really happened** (M99 rolls them anyway): a station changes
  owner, a baron goes broke, a route is cut, a settlement of yours reaches stage 3. No random walk,
  no drift term. If the rate can be predicted from noise, it is free money, and free money kills
  the market the game already has.
- The spread and a per-visit conversion cap make round-tripping a loss, the same way M94 made barge
  arbitrage a loss. The player's edge is knowing the news first — which he does, because he causes
  most of it.

Suite **"scrip: the rate has reasons"** — every rate move traces to a recorded world event;
buy-then-sell without an intervening event is never profitable; the wallet cannot go negative.

## M114 (0.64.0). Evacuation: a world that ends on schedule

The chapter M106 and M107 are both built to reach, and the point where the story stops being
background. Only fires for a settlement the player actually raised.

- The obelisks' calendar names a date for a system. When it comes, that world ends — the event is
  the one the expedition was measuring, and it was never mysterious to them, only unavoidable.
- **The player can lift them.** Hold space, trips, time — the ordinary machinery of the game used
  for something that is not cargo. Nobody assists: managers and hired hands can be assigned, and
  the number carried is the number you organised.
- **Where they land is the outcome.** A rehomed settlement restarts elsewhere at reduced stage,
  keeping its vocabulary and its memory of who came. Not lifting them is a permitted ending: the
  system stays on the map, empty, and their glyphs stop being answerable.
- This is the fork the spine promised: the expedition measured the date and left. You have the same
  date and a ship.

## M115 (0.65.0). The assembled account

The last milestone of the pass, and deliberately cheap in code — everything it needs exists by then.

- With the fragments in hand, obelisks stop being separate: the map layer joins into **the
  expedition's own survey**, drawn in their notation over yours, including the places they marked
  that you have never visited.
- The museum wall (M100) gains its final shelf: not a hundred rarities but one account, assembled
  in the order the player actually found it, which is different for every player.
- **No revelation screen.** The reward is the survey layer, the settlement that lives, and the
  glyphs you can now read. If the ending needs a paragraph to land, this pass failed.

Suite **"the account: assembled, not narrated"** — the survey layer only shows what fragments were
earned; no fragment is required twice; the pass is completable without M114 having succeeded.

# The witnesses: five things that carry the story instead of text

Everything above says the story arrives on the back of useful things. This section says **which
things**. Each is a witness in the sense of the detective shape: partial, honest, and unable to
explain itself. Four of them are archetypes from the same tradition, rebuilt on our machinery —
a worked-out world of machines, a bazaar where the dead captain's belongings are resold, an animal
that repeats what it heard, and a flora that replays what stood in front of it. The names below
are ours; the roles are the classic ones.

**Why these four and not a quest log.** Each is already half-built in `Drift`: we have fauna and
flora with species (`20-life`), station types (`26-ui-station`), settlements coming in M109 and a
light model good enough that an eclipse can be a plot device. A witness costs a table and a hook.
A quest log costs a subsystem and reads as homework.

## The names

In-game names are Russian, like everything the player sees, and they lean the way the game already
leans: plain, slightly rude, funny by understatement rather than by joke. A name here is a working
label a spacer would actually use, not a title.

| Role | Name in game | Why |
|---|---|---|
| the previous expedition | **«Долгий Ход»** | how a crew names its own worst contract |
| the thing on schedule | **Прибой** | it comes in, it goes out, it is not personal |
| an obelisk | **зарубка** (player) · **камушек** (the digger's word) | a survey mark, not a monument |
| the digger | **Грохотун**, by trade a **копач** | eight limbs, one volume setting |
| what he takes as payment | **настойка** (barrels of `xeno`) | he calls it medicine, everyone else calls it a problem |
| the repeater animal | **трепло ушастое** | mock-taxonomic, exactly how a species table reads |
| the flora that replays light | **подглядка зеркальная** | it was watching the whole time |
| the worked-out machine world | **Жестянка** | what is left when a world is a container |
| the bazaar station type | **блошинец** | a flea market with a docking clamp |
| the trading house that cut them apart | **торговый дом «Ласковый»** | the nicest name on the invoice |
| the survivor at the tables | **Тихоня** | a nickname, because his record is blank |

`Прибой` and `«Долгий Ход»` are the only two the player has to piece together; the rest he hears in
the first hours. The joke in every one of them is that nothing in space gets a grand name — it gets
the name the third shift gave it.

## M116 (0.66.0). Трепло: an animal that carries a sentence it does not understand

The single best fit in the whole pass, because it turns a fragment into an object with a lifetime.

- **A fauna species** (`20-life`) that repeats sound it has heard: prices shouted at a dock, a
  bearing read aloud, a phrase in the expedition's pidgin. It is not caught in the wild first —
  the first one is **bought at a bazaar (M120) out of a dead man's effects**, which is how the
  player learns there was a dead man.
- **It pays before it is understood.** What it repeats includes things with immediate cash value —
  a station's prices from before you got there, a bearing to a find. That is its rent.
- **Retroactive comprehension is the mechanic.** Phrases in the pidgin are stored verbatim as
  glyphs (`G.heard`, persisted). They cannot be read until vocabulary arrives from fragments and
  the settlement (M109). Every new word **re-reads everything already stored**: a bird bought in
  hour two starts speaking in hour twenty, without the player going anywhere. Nothing else in the
  game gets better while sitting still, and that alone justifies the milestone.
- It repeats what it hears **from the player too** — including at the wrong moment, in front of the
  wrong faction. A witness that can testify against you is a witness worth having.

Suite **"the repeater: it says only what it heard"** — every stored phrase traces to a real event
the player was present for; a phrase is never invented; a decoded phrase matches the vocabulary
owned at the moment of decoding, not at the moment of hearing.

## M117 (0.67.0). Подглядка: the meadow that remembers light

The one place where the expedition is **seen** rather than read about, and the payoff that makes
the calendar (M107) matter.

- A flora species on a small number of worlds whose surface replays the light that fell on it: what
  stood here, once, as a moving silhouette in the existing surface renderer — our own figures
  (`hqFigure` scale rules), no new art language.
- **It only replays in the dark**, so it replays during an eclipse (M107) or not at all. A player
  can stand on the right planet for hours and see nothing; an obelisk that names the date is
  suddenly the most valuable thing he owns. This is the hook that ties the whole calendar together.
- What it shows is never captioned. A figure, a number of them, what they carried, which way they
  went. The player reads it or he doesn't.

## M118 (0.68.0). Жестянка: machines still on shift

- A world type variant: mined out to nothing, atmosphere sour, and the automation from the previous
  owner still running with nobody to run it for. It transmits (M108's satellite family) on a loop.
- **It asks for one consumable** and it asks in the wrong units, because whoever set the request up
  is not there to fix it. Supplying it restarts a small piece of production — a settlement (M109)
  with no mood and no opinions, the cheap version, and a good place to learn the giving loop before
  a living village is at stake.
- **Its log is the honest witness.** Machines record everything and understand none of it: the log
  gives exact times and headings for events it cannot describe. Times feed the calendar; headings
  feed the map.

## M119 (0.69.0). Грохотун: the one partner who does not work for money

A recurring figure — loud, many-limbed, delighted to see you, catastrophically indiscreet — who
digs the expedition's sites for a living and knows what an obelisk **is** while knowing nothing
about who left it.

- **He is a run, not a crew member.** Reuses the hired-hand machinery (`12a-crew`): hand him a site
  from your map layer, fly away, come back to a result. He never joins the ship and never takes a
  seat: the four-manager rule stands untouched.
- **He is not paid in credits.** He takes a specific good, in quantity, and the quantity is
  unreasonable — the one supply line in the game that exists for a person rather than a profit.
  The monument-is-not-an-ATM rule, seen from the other side.
- **His flaw is the content.** A dig is loud and slow: it draws pirates to a system you care about,
  and he talks about your finds at the tables, which is one of the ways the antagonist knows where
  you have been (M98). Sending him somewhere is a real decision, not a free errand.
- He is also the tutor: the first fragment the player cannot use is explained by him, once.

## M120 (0.70.0). Блошинец: a station type where everything is somebody's

A seventh station type (`26-ui-station`), and the only one whose stock is **used goods**.

- Parts with previous owners, the odd rarity out of an estate, living creatures, and information
  sold as merchandise — including information about you, which is how the antagonist buys your
  route.
- **Everything here has provenance**, and provenance is where fragments hide: a part off a hull
  nobody scrapped, a bird out of a dead captain's effects. The tag is one line and it is real —
  it names a place the player can go.
- It is the natural home for scrip (M113): a bazaar quotes in its own paper by default and in
  credits at a penalty.

Suite **"the bazaar: every lot came from somewhere"** — no lot without a provenance record; every
provenance names a reachable place; buying the same estate lot twice is impossible.

## What this section deliberately does not take

- **No comic double act, no bumbling villain pair.** Our antagonist is a counterparty the player
  trades with (M98, the spine); making him funny makes the reveal free.
- **No child aboard, no zoo.** The player flies alone and collects rarities already (M96); a second
  collection funnel of live animals would compete with the hundred and with the planet (M97). The
  repeater is one species with a job, not a menagerie.
- **No talking-to-everyone.** Nobody in `Drift` has dialogue, and this pass does not introduce it.
  Every witness above answers in goods, glyphs, logs or light.

## Rules this queue does not repeal

- a perk, a node, a drop site or a table row without code is a lie, and the suites guard it
  (`nodes: every drop site is alive`, the perk tree);
- the house has no prices, a hired hand has no steady profit, manager seats are always four —
  edits that break this break the design;
- every graphics rework goes in passes over frames, and the faults found are written down in
  words: a list of faults is worth more than a list of achievements.
