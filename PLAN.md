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

1. **The mine from inside** — *first pass done, not finished.* `23-mode-dig`. The entry above was
   stale: strata, veins, the void path and the wall edges had grown in since. What the stand
   (`docs/mkmine.ps1` → `docs/shots/mine.png`) showed instead, in words:

   - ~~**the lamp lit through solid rock**~~ — fixed. The cone spilled past the edge of the
     working and lit half a screen of strata: underground, that is a lie in the loudest place in
     frame. Cone and dust are now clipped to the void;
   - ~~**the working was a black rectangle**~~ — fixed. There is a floor now where the drift ends
     in rock: a band of spoil, broken stone lying coarser against the walls, a contact shadow and
     a hair of light along the edge. Plus a vertical gradient inside the void, because air has a
     top and a bottom;
   - ~~**light that landed nowhere**~~ — fixed. A pool on the floor in front of the man and a close
     bounce around him: light that lights nothing is a film over the frame, not light;
   - ~~**timber was an orange bracket, the ladder a zip fastener**~~ — fixed. The set is two posts
     and a cap with corner braces, leaning slightly with age, grain on the posts; it stands in the
     drifts too, and (after a second fault, that the "roof above is solid" test wiped it out of the
     shaft entirely) in the shaft as well. The ladder is stiles nailed to the wall, four-metre
     lengths with a clamp at the joint and a shadow behind it.

   **Second pass, same stand, same list:**

   - ~~**the ore body was a shapeless blue blob**~~ — fixed. Ore in rock is disseminated: grains and
     small lenses tilted along the bed, denser toward the middle of the body, each with a
     highlight, because underground ore is not a lamp — what gives it away is reflected glint. The
     body-wide glow that remains is at .07 alpha, just enough to catch the eye;
   - ~~**the far end of a drift was flat black**~~ — fixed. Black with no gradient is a hole, not
     depth. A faint haze grows with distance from the man and turns it into air being looked
     through;
   - ~~**nothing said work had happened here**~~ — fixed. A track on the drift floor — sleepers and
     two rails running under the wall, so the working plainly went further — one tub per working
     placed by seed, and a pick left against the wall at a dead end;
   - ~~**the shaft was monotonous**~~ — partly fixed: a ventilation pipe runs the wall with a clamp
     at each joint, and a plank landing every eighth metre;
   - **the grain at the face** was strengthened (more chips, higher alpha) but is still modest.

   **Fault the second pass introduced and fixed in the same sitting:** the halo of altered rock
   around an ore body was painted as a filled cell rectangle, and the frame grew exactly the grid
   this mode exists to avoid — visible squares and crosses across the stone. It is a cornerless
   blob now, and weaker than the grain: a hint, not a marking.

   **Still open:** the landings in the shaft barely read; a tub sitting in a cell dug below the
   drift floor looks like a crate in a pit; and a long shaft is still a long shaft — niches and a
   change of section would do more for it than any amount of texture.
2. **Ships by class and faction** — *class done, faction not started.* `03-ships`. The stand
   (`docs/mkhulls.ps1` → `docs/shots/hulls.png`: seven class rows, six seeds each) showed the
   complaint was true for four classes of seven — hauler, miner and courier read at once, while
   scout, frigate, yacht and surveyor were one and the same arrow-with-wings.

   **The cause was not proportion but placement.** Every class mark — dish, guns, panels, windows
   — was drawn *inside* the outline and drowned in the greebles. A silhouette is an outline, so a
   class mark has to stick out of it. Fixed by giving four classes something that breaks the
   contour: an instrument boom running forward past the nose (scout — the only hull whose nose
   continues beyond the envelope); sponsons carrying the guns outboard, barrels forward (frigate);
   no wing at all and nacelles on thin pylons, so the gap between hull and nacelle is what
   identifies it (yacht); and panels opened square across the hull on brackets plus a big dish on
   a long boom (surveyor — right angles against everyone else's sweep).

   **Bug found on the same stand and fixed:** navigation lights were placed at the first wing tip,
   and with no wings they fell back to ±`bw`\*1.6 — plainly *outside* the hull. On a hauler and a
   yacht two lights hung in empty space beside the ship. They are now computed off the profile.

   **Third pass — form and material, not line weight.** The self-criticism that drove it: these
   were aeroplanes, not spacecraft. Every hull had nose-wings-nozzles; the hull table said the
   `Обод` is *"a frame around a drill shaft"* and the silhouette drew a solid teardrop, so either
   the description or the picture was lying; every nose was pointed, which is a demand made by air
   and not by vacuum; the whole ship was painted in one `col`, so plating, tank, container,
   radiator and ceramic were indistinguishable; there was no heat rejection anywhere, though a
   real ship must have it; nothing said the thing was built by people — no airlock, no handrail,
   no hull number; and everything was perfectly mirror-symmetric, which reads as a coat of arms
   rather than a working machine.

   What that turned into:

   - **a wing is now a licence, not a decoration**: only `atm` classes (scout, courier, yacht)
     have one, because only they land in air. The rest got **radiators** instead — thin dark
     plates carried out on two struts with a brace, ribbed across so they read as heat rejection
     rather than as wings;
   - **blunt noses** for everyone who never enters atmosphere;
   - **the miner got its frame**: two beams down the sides with cross-ties, so the shaft is
     visibly inside a cage and the hull table stops lying;
   - **four materials instead of one paint**: bare `steel` for hardware (containers are somebody
     else's freight and carry no owner colour at all), `foil` for a patch of crumpled thermal
     blanket — only on ships that never land, since an entry would strip it — near-black `radm`
     for radiators, and `cer` held for ceramic. This is what removes the plastic look;
   - **evidence of people**: an airlock with a handrail, a manipulator arm — both on **one** side
     only, which is the first asymmetry any of these hulls has had — and a stencilled hull number.

   **Faults found on the stand during the pass and fixed in it:** the thermal blanket first landed
   in the same place on every hull at full saturation and became the loudest thing in frame (now
   seed-placed, muted, and denied to landers); the frigate's barrels were a line with a ball on
   the end and read as mushrooms on stalks (now breech, tapering tube and a muzzle swell);
   radiators hung off a single strut like combs in mid-air.

   **Fourth pass — height, and four more things a ship needs.** The criticism this time: nothing
   cast a shadow, so a nacelle and a rectangle painted on the plating had the same depth; every
   class wore the same fighter canopy, including the ore hauler; the nozzles were identical
   although thrust is exactly what separates a freighter from a courier; and the ship spends the
   whole game docking at stations while having nothing to dock **with**.

   - **shadows give the height.** One light direction for every hull (upper left, as on a planet
     surface), so shadows fall down-and-right and their length *is* the part's height. Cast by
     nacelles, side boxes, containers and sponsons — and longer under the bridge, which stands
     highest. Clipped to the hull outline: a shadow has nothing to land on outside the ship.
   - **a bridge instead of a canopy** on hulls that carry (`cont`) or fight (`armor`): a raised
     block with a dark skirt at its base, a lit top face and a row of forward windows. Tiering is
     the other half of volume — the part gets a bottom and a top instead of being a patch.
   - **nozzles by the work**: a freighter has few and large, a courier one long one on the axis,
     a frigate a cluster of small ones it can steer with.
   - **a docking ring** with three latches on the cheek.

   **Fault caught at 6× and fixed:** the stencilled hull number came out upside down — the hull is
   already drawn rotated nose-forward, so the text had to turn the other way.

   **Fifth pass through tenth — the luxe yacht alone** (`docs/mkyacht.ps1` →
   `docs/shots/yachts.png`). The complaint that started it: the one hull bought for its look was
   an arrow wearing a strip of identical yellow windows. What the passes changed, in order:
   form (long thin body, beam aft of midships, a tail running to a thread), materials (lacquer
   with metallic grain, teak, brass, pearl and carbon — four surfaces no other hull has), deck
   zoning and glazing (teak only where a person walks; continuous panorama with light spilling
   onto the deck), the fittings (spindle nacelles, tender port, name in brass instead of a
   stencilled number), then a second series over the silhouette: a manta wing grown out of the
   hull by a strake, nacelles standing **on** the wing with needles forward, and three engine
   schools with cool thrust.

   **Faults found by looking and fixed inside the same passes:** teak planked the whole ship and
   read as parquet; the superstructure was measured off half-beam and came out a plank a third of
   the deck wide; the carbon weave read as gauze in a chequer; the metallic grain read as dust on
   the bow; the first spindles hung in empty space beside the wing because they were placed by
   hull coordinate rather than by where the plate actually is.

   **Still open:** the yacht's own docking ring and airlock are the fleet's grey washers, unchanged
   on a hull where everything else is finished; and the promenade railing barely reads below 3×.

   **Not done:** faction. There is still one visual language for everybody, and in a system only
   pirates fly. Per the queue below, factions come after stations.
3. **Cantinas should differ.** A pirate dive, a miners' tavern, an upper-tier lounge: light,
   crowd, music. Right now there is one for the whole galaxy (`26-ui-station`, `renderCantina`).
4. **New world types:** crystalline, jungle, metallic, ruin. The machinery is already ready to
   take them — `TYPES` (02-world), `PROFILE`, `RELIEF_MIX` (07-planet), `GEO_TPL` (18b),
   `WEATHER_BY_TYPE` (19d), `POI_KINDS.on` (20a), flora and fauna leanings (20-life).
5. ~~**Finds in flight:** a distress signal, an abandoned satellite, a drifting container, the
   wreckage of an expedition.~~ — DONE at M108 (`17b-finds`).
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

## M106–M108 — built (0.56.0–0.58.0)

**M106 obelisks.** The map is opened, not scanned: a hundred pieces of the previous expedition's
report, dealt from one closed pool so none is unreachable, each paying on the spot in an address, a
price sheet, a word of their pidgin or survey data — never in credits. `12q-lore.js`, POI kind
`obelisk` (`ЗАРУБКА`), marks drawn over the map, `91p-lore.js`.

**M107 the sky keeps a calendar.** Eclipse, parade and comet, computed from the system seed and
never stored (`06a-celest.js`). The sky's one right to touch mechanics is light — and the notch's
**second, dated answer**: read a slab while the sky is doing what it was dated against and it names
the next address in the same chapter.

**M108 finds in flight.** Four finds in the void — capsule, satellite, container, hulk — and the
satellite is theirs (`17b-finds.js`).

**The tail was closed later:** the tally on the notches, the base shadow, the stand
(`docs/mkstone.ps1`, `docs/shots/stone.png`) and the fragment board (`27h-ui-lore.js` — the place
where the collected record is read, gaps kept as gaps).

Full text, the decisions taken along the way, the faults found by looking and the two original
specs the built versions departed from are in [`docs/PLAN-archive.md`](docs/PLAN-archive.md) —
grep it for `M106`.

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

---

# QUEUE: the thirteenth pass — the galaxy as a book of stories

M106–M120 gave the arm one long story told in fragments. This pass gives it **many short ones**,
and a body to fly them in. Today a distant system differs from a near one by `sysDanger` and, after
the twelfth pass, by whether a fragment sits in it. That is still a coefficient and a table. What is
missing is the sentence a player says out loud: *"oh — and what is going on here?"*

Versions run 0.71.0 (M121) to **1.00.0 (M150)**. This pass is the release.

## The principle behind this queue

**A place is remembered for what you lived through in it, not for what it contained.** Everything
below serves one sentence: the player, opening the map at hour eighty, reads his own names on it —
*there lives Грохотун · there is the town where nobody speaks · there I met the man who waited
forty-two years for a parcel · there — no idea what that was.*

Three consequences, binding:

- **The unit is a region, not a planet.** A lone strange world is an attraction: look, leave,
  forget. Six to ten systems on one theme, with a gradient, is a place you can move into.
- **The hand-made part is the core only.** The periphery is procedural: one theme, a few
  parameters. Fifteen regions cost fifteen built cores and a hundred cheap neighbours.
- **Everyday life outweighs every wonder.** A wonder lands once in ten hours; a broken coffee
  machine lands every landing. The hundred (M128–M130) is the load-bearing wall of this pass, not
  its decoration.

## What this pass deliberately repeals

The twelfth pass closed with *"nobody in `Drift` has dialogue, and this pass does not introduce
it"*. **M127 repeals that, narrowly and on purpose**, and the narrowness is the whole design: no
wheel, no branches, no checks, no portraits, no reply the player chooses. One line per landing out
of a queue, and the only thing the player "says" is what he puts on the table — a tape, a thing, a
rumour, a name. Everything the twelfth pass built stays true: witnesses still answer in goods,
glyphs, logs and light. What is added is that people who see you eight times start talking to you
like somebody they know.

## The gradient rule («уклон»)

Every system in a region carries a hidden distance-from-core, and it shows up in three registers at
once, always in this order of discovery:

1. **In people first**, and explained away by habit. *"Clocks run wrong out here, bad relay, you get
   used to it."* At the edge the phenomenon must be dismissible as ordinary. If the player does not
   first decide it is nothing, arriving at the core is a corridor, not a discovery.
2. **In the world second** — the same effect, no longer dismissible.
3. **In the instruments always** — numerically, from the first system to the last.

Which means: **the periphery points at the core**, and finding it needs no marker, no scan and no
quest log. This is the second axis the galaxy has been missing; `sysDanger` stays what it is.

## M121 (0.71.0). The panel: five needles and a misclosure

The instrument set is the spine of everything below and is built first. Not a detector: **work
first, meaning as a by-product.** No beep, ever, in the whole game.

- **Хронометр** — schedules, contract deadlines, local day length, when it gets dark. Reads: time
  runs at the wrong rate, or from the wrong moment.
- **Курсограф** — jump plotting, drift correction, fuel. Reads: dead reckoning disagrees with the
  star fix.
- **Масс-детектор** — ore, rocks, cargo mass (`12l-barge`). Reads: mass where nothing is visible.
- **Приёмник со шкалой шума** — prices, traffic, weather, and rumours (M147). Reads: the ether is
  too clean, or has one voice too many.
- **Актинометр** — charge, landing safety, greenhouse yield. Reads: more light arrives than the
  local stars emit.
- **`невязка`** — one small number, the surveyors' misclosure: the ship fixes its own time and
  place five ways and prints how badly they disagree. Near zero in normal space; **it climbs
  smoothly across a region toward the core**, over several systems, never in a jump. Each region
  owns exactly one needle, so after twenty hours a player reads the panel as terrain.
- Lives in `25-cockpit` as instrument state, not as HUD. Not persisted — derived from position and
  region tables (cross-cutting rule: never persist the ephemeral).

Suite **"needles"** — misclosure is monotone toward every core; no region owns two needles; no
instrument ever raises a message, a sound or a colour change.

## M122 (0.72.0). The recorder: paper, five pens, and the memory of observation

The honest answer to *"how does a player compare something he saw forty hours ago"*. Not a camera —
the ship writes by itself.

- A paper strip recorder to the left of the panel: the player turns his head to look at it. Five
  traces, scrollable back, **no labels and no interpretation** — curves and graduations only.
- It is the only proof in several stories: the slow valley (M142) is invisible to the eye and shows
  as a moving trace; the quiet county (M141) prints a dead flat line where a day should be.
- **The tape is an object.** It can be put in front of a person (M127), given to a cartographer,
  attached to a parcel. It is a fragment on the back of a useful thing, which satisfies the
  no-lore-item rule: a strip sells, and a good strip sells well.
- The only ticking sound in the cockpit is the pen. When its rhythm changes the player looks up on
  his own, with no prompt.

## M123 (0.73.0). Everything the player sees is in the cockpit

- **No overlay HUD, no popup, no notification.** If a fact has no physical surface to sit on, the
  player does not get it. Reworks `25-cockpit` and the HUD parts of `28-loop`.
- Four surfaces: **panel** (M121), **recorder** (M122), **table**, **window**.
- The **table** carries the map as paper with the player's own captions written over the printed
  ones (`18-mode-map`), cargo as bills of lading with stamps instead of an inventory grid, rumours
  as a weighted-down pile of notes, and the roster (M138) if he signed it.
- The **receiver is physical**: frequency is tuned by hand, noise between stations. Rumours, prices
  and weather are found by tuning, not by opening a tab.
- **No progress counters anywhere** — no reputation bar, no "explored 3/8", no task list. What the
  player remembers is what exists; the notes on the table are the one concession, and he writes
  them.
- Pause is not a menu: it is the engine off. Cockpit, silence, the pen.

## M124 (0.74.0). The ship as a home, and the keepsake shelf

- Two zones you walk between: **рубка** (panel, recorder, table, window) and **кубрик** (bunk,
  locker, kettle, shelf).
- **The кубрик is the archive of the playthrough.** Objects from the hundred (M128–M130) move in
  here: a child's drawing of your own hull, a tomato in a jar, a nose plate off a dead man's ship,
  a guitar string, a medal nobody here can identify, the sack of ordinary soil you never delivered.
- It accumulates from conduct alone — nothing is bought, nothing is a collectible with a counter —
  and it is the last thing in shot every time the player sits down. This is what replaces a camera.
- Persisted (`14-save`, `v:4` field with a safe default): keepsakes are player decisions, exactly
  what the save format is for.

## M125 (0.75.0). Hull classes are professions, not tiers

Removes the cheap→expensive ladder from `03-ships` and replaces it with roles that change **which
stories are available**, not which numbers are bigger.

- **Буксир** — slow, tows other people's trouble, known by everyone on the lane.
- **Рудовоз** — hold, heavy, blind.
- **Почтовик** — fast, tiny hold, the best receiver in the game: on it you hear the galaxy.
- **Изыскатель** — best panel and recorder, poor lift: you see misclosure before anyone.
- **Вахтовка** — carries people, and is the only hull where passengers talk in flight.

## M126 (0.76.0). Instruments are merchandise

- Instruments differ **by works and by age**: one needle twitches, one has a finer scale, one pen
  writes thinner. Bought, swapped, repaired, lost — a table shaped like `MODS`/`PARTS`.
- A bad chronometer is not "−5%": it literally makes the time-drift region harder to read. Progress
  without levels — the player assembles a panel around what he is curious about.
- Wear (`12s-wear`) applies: hull patches, a replacement hatch in the wrong colour, previous
  owners' stencils under the paint. By hour a hundred the ship is not upgraded, it is **lived in**.

## M127 (0.77.0). Speech: a queue of lines, and putting things on the table

- **A queue, not a conversation.** Each person holds a short queue of lines and spends **one per
  landing**. Come back, hear the next. A twenty-hour conversation for the price of a string table.
- **The player never picks words. He puts something down:** a tape, a thing, a rumour, a name. The
  person reacts to the object. That is the entire input surface, and it is also a puzzle and a
  characterisation.
- **Three registers.** *Service* — the ether: dry, by callsign. *Everyday* — in person: short,
  grumbling, and a need is mentioned in passing (*"could do with a valve"*), never ordered. *Rare* —
  **one long line in a whole story**, held by the keeper (M138), the last addressee (M132), the
  returnee (M146). One. It lands because everything else is short.
- **People change how they address you**: "pilot" → callsign → name, on visit and kindness counters
  (M131 memory of place). Nothing else is needed to make a player feel local.
- **Silence is a line.** A pause after your tape; a man who looks and says nothing. First-class
  entry in the table.
- **Alien language is never translated.** Not in a subtitle, not in a "decode". Understanding
  happens through action (the M116 rule, unchanged).
- Half of all speech is **the ether**: faceless voices, other people's traffic, dispatcher swearing,
  forecasts. The cheapest life in the game — no models, no animation, no scenes.

## M128 (0.78.0). The hundred: the frame, and the first thirty

One template, applied a hundred times: **a need said out loud → one act by the player → a delayed
effect → one line on return.** No journal, no marker, no money, ever. Delay matures on **distance
travelled, not wall-clock** — landings elsewhere and jumps, so short sessions are not punished and
waiting in place cannot farm it.

They are dealt in **clusters**: three or four on a busy station, none at all on a bleak one. That
distribution is itself characterisation.

*Breakdowns.* 1 the coffee machine a mechanic has been fixing for three years · 2 a rattling
extractor fan and a dispatcher who has not slept in four months · 3 a lift that only goes down, and
an old woman on the ninth floor · 4 the tower clock stopped, meetings are set by the shadow of a
post — fix it and half the town grumbles it was better before · 5 a greenhouse pump; payment is two
tomatoes · 6 the canteen speaker crackles — fixed, the station is audible on approach · 7 one
welder for three settlements, carried between them in turn · 8 the only tipper is dead and ore is
carried in buckets; later they name the tipper after your callsign · 9 the landing floodlight is
out, they land by bonfires — fixed, it is a new point of light from far off · 10 a hangar frozen
shut since winter with a stranger's ship inside: the owner is dead, you get it for parts on
condition you never cut off the nose plate.

*Waiting.* 11 a woman waiting for a husband whose run was cancelled twelve years ago; nobody told
her · 12 an old man who walks out to meet every landing, and in time is meeting yours · 13 a boy
asks whether the planet his father described is real — it is, and there is nothing on it · 14 a
dispatcher keeps a flight on the board because *"while it is on the board it counts as flying"* ·
15 a family keeping a room ready for a son who will come back younger than they are · 16 regards to
be passed to a dead man; the addressee is his son, who does not know · 17 a relief crew eight months
overdue because the run does not pay — you can fly it yourself · 18 two men agreed to meet in thirty
years; one came; you meet the other in another region · 19 a dog at the airlock; the owner is not
coming back; the locals feed it and lie to it · 20 a couple saving for a ticket home to a place that
is no longer a settlement.

*Things.* 21 a suitcase you are asked not to open — books · 22 a guitar with no strings; later you
hear singing · 23 a man looking for his own photograph, lost in a move; it turns up at a dealer's ·
24 a tool engraved with somebody else's name, returnable to a family · 25 a crate marked THIS WAY UP
with something clearly alive in it · 26 a sewing machine on its way to a fourth owner · 27 someone
asks for soil. Just soil, a sack of it · 28 a jar of jam that must arrive unshaken (genuinely
fragile cargo) · 29 a child's bicycle outgrown, and another child two regions away · 30 a wall
calendar for a year already over — they hang it anyway.

## M129 (0.79.0). The hundred: forty more

*Table and warmth.* 31 a cook wants a spice that does not grow here; the canteen menu changes for
good · 32 concentrates only, and somebody dreams about an onion · 33 a baker lost his starter; an
old woman two regions over has it · 34 a still in a compartment; the boss knows and says nothing ·
35 a man growing one tree in a container, asking for a stronger lamp · 36 a shortage of socks as a
region-wide running joke · 37 a holiday kept on the wrong day: they got it wrong at founding ·
38 a bathhouse on a far station that pilots detour for · 39 a cat to be moved, which hates
acceleration · 40 a canteen that feeds everyone free, because the first manager set it up that way.

*Machines.* 41 a vending machine giving correct change to people gone forty years · 42 a loader
driving around a warehouse that was demolished · 43 a weather station broadcasting forecasts for a
dead colony · 44 a cleaning robot dressed up by children, still walking around dressed · 45 a beacon
singing a non-standard signal — somebody retuned it to a tune · 46 a door that opens to a dead man's
name · 47 a sorting hub shipping freight to nowhere; it can be redirected · 48 a tractor that has
ploughed one field for forty years; the field is perfect · 49 a station answering machine in the
voice of a man long gone; changing it is too much trouble · 50 the terminal clock runs backwards.
It is not broken.

*Children.* 51 children playing "trader" and copying your mannerisms · 52 a child's drawing of your
ship — it hangs in the кубрик · 53 a ship the children built out of scrap behind the settlement ·
54 a girl keeping an arrivals log who knows more about pilots than the dispatcher · 55 a boy asks to
come along; he can't; sixty hours later he is on another station, having left on his own · 56 a
class of six and one teacher across three generations · 57 children speaking ether jargon to each
other · 58 a child afraid of the dark on a world where dark lasts forty days.

*The old.* 59 an old man's account of a war that is in no database · 60 a woman holding a song
nobody else knows; it can be carried away · 61 a veteran with a medal nobody here can identify ·
62 the last speaker of his settlement's language · 63 a cemetery where all the dates are the same;
everyone asks, nobody answers · 64 an old man asks you to carry his ashes — not now; tens of hours
later, now · 65 a captain stripped of his licence who repairs other people's ships better than
anyone · 66 a library of forty books, every one read by everybody.

*Work.* 67 a brigade overshot the plan and is now afraid the quota will be raised · 68 a supply
clerk skimming and sharing it with the settlement; you cannot turn him in · 69 an inspector is
inbound — warn them or don't · 70 two men forty years into a boundary dispute, both having forgotten
the cause · 71 a manager filing reports to an authority that no longer exists · 72 a meeting of
three people that runs four hours · 73 one doctor for five systems, never in time; you can carry
him · 74 a storekeeper, the only person who understands the store, holding everyone by it · 75 a
watch nobody was ever sent to relieve (rhymes with M138) · 76 a man who turned down promotion so as
not to move.

## M130 (0.80.0). The hundred: the last thirty, and the shelf wired up

*Custom.* 77 they greet each other once a day and that is all · 78 names are not spoken on the air
here · 79 years are counted from the first rain, not from founding · 80 once a year the houses are
moved two hundred metres · 81 nobody here looks at one of the two suns. They simply do not · 82 they
do not say goodbye; people leave in silence, and it is not rudeness · 83 whoever brings a new thing
names it, and the name sticks · 84 they bury objects, not people · 85 everyone in the settlement
knows the same one card trick · 86 the feast of the year's first ship — you can be it.

*Living things.* 87 a herd walking strictly along a road that is not visible · 88 birds imitating
the sound of a pump · 89 an animal that follows ships and steals fasteners · 90 insects building out
of the rubbish you dumped · 91 a fish in the canteen tank, the station mascot · 92 a herd that
scatters from a floodlight · 93 something living in your ship's shadow, seen only at the edge of
vision · 94 a plant that flowers only while an engine runs nearby.

*The ether.* 95 a voice reading numbers; nobody knows why · 96 a pilot who always lies about his
finds, and once told the truth · 97 a callsign that answers on every frequency and never twice ·
98 a radio amateur archiving other people's traffic · 99 somebody broadcasting a forecast for a
planet that does not exist · 100 a rumour about **you**, come back through ten systems
unrecognisable.

Plus the wiring: every story that ends in an object routes it to the кубрик shelf (M124).

Suite **"the hundred"** — every entry has a need, an act, a delay and a return line; no entry pays
credits; no entry writes to a journal; every object-ending entry has a shelf slot.

## M131 (0.81.0). Regions: theme, gradient, procedural edge, built core

The frame all fifteen sit in. A region table like `NODES`: fixed, finite, seed-generated, swept for
reachability.

- Per region: theme, owned needle, gradient function, an edge generator (parameters over existing
  world types), and **one hand-built core system**.
- **Memory of place** (persisted, `v:4`): first visit, visit count, and three coarse counters —
  **taking** (how much you dug out and hauled off), **violence** (shot, blasted), **care** (repaired,
  brought, left behind). Not karma, never shown, no UI. It is the raw material for delayed
  consequence: the grove remembers the shot, the insects build from what you threw away, people
  change how they address you.
- **Maturation is measured in landings elsewhere and jumps**, never in real time.
- Layers on a surface come in two distinct kinds and are not confused: a **presence mask** (the
  object exists in this layer or does not) and a **revelation mask** (the object is always there but
  answers only to one light source). The second is nearly free; the first is not.
- **A layer never switches around the player.** Only out of sight — entering a building, around a
  corner, during the blackout of an eclipse. Layer change is directed, not physical.

Suite **"regions"** — misclosure monotone to every core; every core reachable on stock fuel; no two
cores within N jumps; each region has at least one edge system that is simply a normal, pleasant
place to trade in.

## M132 (0.82.0). Почтовый круг — the postal round

A network of people who have been passing things along for decades because that is how it is done.
The one region where **the instruments say nothing at all**, and that has to be noticeable.

- 5–6 links scattered across the arm, always delivered in passing. No timer, no failure state.
- The parcel is an ordinary object — a tool, a jar, a wrapped bundle. Each carrier says **one line,
  about himself, never about the parcel**: *"It was handed to me in sixty-three. I was on Прибой
  then."*
- It can be opened. The chain continues, but the last man notices. He does not reproach you. He
  notices.
- The core is the last addressee: *"I have been waiting for it forty-two years."* Nothing is paid.

## M133 (0.83.0). Зеркало — the mirror

- An empty transit region everyone flies through, known only for atrocious comms. Edge: scraps of
  other people's ether with no source; dispatchers wave it off as reflection.
- **The core is not the source, it is the mirror**: a place where old reflections pile up, dozens of
  them overlapped, from every heading and every era. Always 37 seconds. The source lies outside the
  sphere, further than anyone can fly.
- Content is **domestic**: a time signal, a phrase repeated without inflection, a duty roll-call.
  Domestic on purpose — *they are probably long gone* only lands through the ordinary.
- Reuses the M108 in-flight find family and the M116 rule that a phrase is never invented.
- The reward is a coordinate you cannot reach.

## M134 (0.84.0). Три света — three lights

The region that makes the calendar (M107) pay, and the one M117 was always pointing at.

- Edge: multiple-star systems, endless dusk, colonies that sleep by light rather than by clock,
  shutters as ordinary architecture that nobody explains.
- Core: a world with no night. A day before conjunction the inhabitants close everything and sit
  inside — an observable sign, so the event can be anticipated.
- At conjunction a third light **reveals** ancient roads and foundations — not a postcard: a
  **physical entrance** that cannot be found in ordinary light.
- **The player misses it the first time. Always.** The second visit is his own reckoning and his own
  intent, and that is the whole point. An event is never rescheduled to suit an arrival — the moment
  it obliges, the world becomes scenery.

## M135 (0.85.0). Расхождение времён — the drift of hours

- An old mining county that lives by shifts and hooters — which is exactly why a slipping schedule
  shows here. Edge: a dispatcher apologising for the clocks; a shift that turns out ten minutes off;
  a village living by the hooter because clocks are not trusted.
- Core: a fully working settlement with nobody in it. Automation feeds the stock, the canteen food
  is hot, the machine gives correct change. **The offset grows toward the centre** — minutes at the
  edge, hours by the reactor.
- The people are here, each in his own layer: one settlement by day, another by night, a third
  during an eclipse (M107 again).
- The ship's own chronometer drifts as you walk inward: the instrument is the evidence, and the tape
  keeps the hump.
- Once, during the eclipse, a man walks past, stops, **sees you** for a second, and walks on. It
  never happens again.
- **Not a horror.** No jump scare, no note, no body.

## M136 (0.86.0). Свет, который помнит — the region around Подглядка

M117 built the meadow. This builds the county it sits in, so that finding it is a slope rather than
a coincidence.

- The luminous flora is **a trade good**: lamps are made of it, landing pads are lit with it. Edge
  worlds glow evenly at night and nobody thinks anything of it.
- Closer in it glows in patches, and the patches repeat shapes: a wheel rut, the outline of a
  machine, the rectangle of a foundation. Farmers know and shrug: *"it always glows like that after
  the machinery."*
- Core is the M117 valley, with one addition that costs nothing and doubles it: **scenes replay in
  order of brightness, not of time.** The loudest first — a launch, a fire, a floodlight; the quiet
  ones visible only up close and in the dark. The player learns the ending first and walks downhill
  through volume to the beginning.
- Every scene is ambiguous in meaning and exact in information: a man runs at a cliff and vanishes —
  meaning "panic", information "there is a way in", and the player is inside before he understands
  what he watched. That is the fragment rule made literal.

## M137 (0.87.0). Роща — the grove

- Asteroid-belt mining country (`24-mode-belt`). Edge: isolated growths everyone takes for mineral
  and cuts for sale; then thickets that spoil handling and get sworn at on the air.
- Core: a grove that reacts to ships. Thrust and light are the language. On the main drive it
  ignores you; cut the engine and it closes in slowly. **No damage at all** — at most it makes
  leaving awkward, and giving thrust makes it flinch back.
- **It remembers your hull.** Next visit it turns sooner. Shoot once and it parts for you and never
  approaches again. Cut one for cargo and it closes for good — and the cargo must be genuinely
  worth it, or there is no choice being made.
- Needle: mass detector, mass where the charts say nothing.

## M138 (0.88.0). Линия смотрителей — the line of keepers

Not physics: **infrastructure**. A chain of beacons along a busy lane through several regions, which
everyone navigates by. Fuel, repairs, tea.

- A man on each. Ordinary. Gives fuel, coordinates, small repairs, and asks you to bring one
  consumable now and then. Talk is about supply and weather.
- **Habit over 6–8 visits** (M127 queue, M131 counters): silent handover; then he knows what you
  need before you say it; then a second mug on the table; then the crate already out.
- **He goes quietly.** Mug washed and turned upside down, bunk made. A man who tidied before
  leaving. No body is ever shown, and that is tact, not mystery.
- **The first payoff is consequence, not information.** The lane begins to go dark: the курсограф
  wanders across those systems, plotting costs more fuel, strangers get lost on the air, a convoy
  turns back. For forty years one elderly man and his consumable held the navigation of a whole
  county together.
- **The second is the roster on his bulkhead.** Twelve names struck through, decades apart. He is
  the twelfth. Nobody was ever sent to relieve him; they simply stopped sending. He was not living
  out there — he was **standing a watch**, and you do not leave a post before your relief.
- **The third is the blank line at the bottom.** You can sign it. It is not a quest: it is hauling
  the consumable, forever, unpaid, and it is dull. That dullness is how a player understands what
  the man did for forty years. Decline and the lane goes dark; the county gets dearer and more
  dangerous for everyone including you, and nobody blames you and nobody notices.
- **A rhyme instead of an explanation.** Far away, a second such station and a second such man,
  alive. Not one word of exposition — the role simply becomes visible as a phenomenon rather than a
  trick played with one character. If you are on the roster, he greets you as one of his own.

## M139 (0.89.0). Большой уезд — the large county

- Archaeology-and-looting country: digging, hauling, forging and selling "antiquities". Edge: heavy
  masonry being taken for building stone; then four-metre doors and twelve-tonne lifts already
  repurposed as warehouses.
- Core: an entire town with no buttons — everything answers to sound. The interface is **noise**:
  the horn, a struck girder, engine thrust. The player learns to speak in loudness.
- The turn: the nursery is small. The inhabitants were our size. So the scale was **never for the
  residents — it was for a guest.**
- The town is still listening. You may make as much noise as you like. Some time, not here and not
  soon, something answers.

## M140 (0.90.0). Несогласие карт — the charts disagree

- Border country with bad pilotage, living on smuggling and grey navigation. People here lie
  professionally, which matters: the player must first decide he is being had.
- Edge: small discrepancies written off as old data. Then a system missing from the new base. Then
  one missing from every base.
- Core: an ordinary, inhabited planet that exists in no record — not the base, not the old charts,
  not the obelisks (M106). **No mechanism is ever hinted at.** No rift, no radiation, no exotic
  physics. Only the disagreement.
- The locals are polite and faintly sorry for you. They offer to compare instruments, do so, and
  gently observe that you seem fine — you have simply arrived from nowhere.
- **Their chart can be traded for.** While it is in the hold your navigator does not show your home
  system. Quietly, with no message. Throw it out and it comes back.
- **Scheduled late on purpose.** It only works if the player has learned to trust records, and what
  teaches him that is the hundred.

## M141 (0.91.0). Тихий уезд — the quiet county

- A prosperous, well-kept, agricultural county. Genuinely pleasant; the first hours there are a
  rest. Pilots recommend it to each other.
- Edge: nobody robs you, prices are level, machinery does not break, papers are not asked for.
- Core: a colony that **hides nothing.** *"Yes, none of us remembers why we came. It stopped
  mattering."* No hypnosis, no cult, no villain — the detective story is refused deliberately,
  because a player solves "perfect equals sinister" in two minutes and then waits out the play.
- **The price is mechanical.** There the ship's log stops writing, the recorder draws a flat line,
  and on departure noticeably more days have passed than you lived: fuel gone, crops elsewhere
  ripened, the man you meant to visit no longer there. Nothing was taken. Time simply does not
  accumulate there.
- The offer to stay is sincere and **is never withdrawn** — good at hour two hundred, after any
  loss. A full alternative ending is out of scope; the open door is the content.

## M142 (0.92.0). Медленный — the slow one

Replaces the imitation-creature idea entirely; that one was expensive and twee.

- A poor county: biologists and two supply stations, living off raw material that grows over
  centuries. Edge: sluggish fauna, plants that "seem to move", scientists complaining that a tour of
  duty is too short to measure anything.
- Core: a valley that is one organism whose single beat of thought takes days. **You are a flicker
  to it.**
- **The mechanic is correspondence.** Lay out a figure of objects, fly off about your business, come
  back after a maturation cycle — something has been laid out in reply. Five or six exchanges across
  tens of hours: first a copy, then a continuation, then a **meaningful mistake** — it adds something
  you did not put there but which fits. Read plainly, the first real reply asks *"are you alive?"* —
  everything fast here has previously been wind and rockfall.
- Tone correction, load-bearing: **it is not the pupil, you are the impatient one.** The game never
  says this; it simply becomes obvious.
- Nothing is visible to the eye. The first proof that the valley is alive comes **off the paper
  tape**.
- Abandon it and nothing happens — it has other time. Come back at hour two hundred and the reply is
  there, laid out long after you stopped coming.

## M143 (0.93.0). Перевал — the pass

- An isolated county almost nobody flies to: expensive and pointless. Edge: settlements with odd
  habits; then an instrument treated as a relic and "fed"; then a language where an operating manual
  has become liturgy and the crew list has become the names of saints.
- Core: the ship itself, visited on pilgrimage. Inside, everything is intact and entirely legible to
  **you**, and entirely opaque to them, though they came out of it.
- You can switch the lights on. It will be the largest thing that has happened here in a century.
- **A fork with no correct answer**: explaining takes from them the only thing that held them
  together; not explaining leaves it as it is. The game neither hints nor rewards.

## M144 (0.94.0). Другое взросление — the other growing-up

- A protected county with a no-interference rule everybody breaks in small ways. Edge: settlements
  of one people at different stages — that it is one people can only be worked out by visiting
  several.
- Core: the stage they are about to reach, which you can take part in — bring an instrument, seed,
  repair an old mechanism (M109's giving loop, unchanged).
- **Reciprocity is mandatory.** The instrument is used for the wrong thing and it turns out
  cleverer; the seed is planted "wrongly" and yields better. Without it this becomes the
  cosmonaut-enlightens-the-natives story, which is the exact opposite of the intent.

## M145 (0.95.0). План — the region around Жестянка

M118 built one machine still on shift. This builds the industrial county it belongs to.

- Edge: an automatic mine shipping ore into vacuum; a sorting hub grading freight nobody accepts; a
  loader driving around a demolished warehouse. Looters and dealers live off the skim.
- Core: a combine that has been producing an article for two hundred years, and a horizon of
  warehouses. The article is meaningless out of context: identical units for something unknown.
- **No villain and no satire in the face.** The order was never cancelled because there is nobody
  left to cancel it.
- It cannot be stopped. It can be worked out **what the thing is good for**, and hauled — and then
  two hundred years of work are, for the first time, not wasted.
- Needle: the noise meter. The ether is packed with machines talking to each other in the language
  of delivery notes.

## M146 (0.96.0). Возвращение — the returners

- Long-haul country: yards, transfer stations, offices writing "long" contracts. Edge: talk of ships
  people are waiting for; families waiting on a third generation; rooms kept ready.
- Core: a station of returners — people younger than their own grandchildren. The world they left
  does not exist and they know it. **No tragedy played to camera**: they play dominoes, work, and
  complain about supply.
- An arrivals board where half the lines are long overdue, and nobody clears it.
- Needle: the chronometer — the same one as M135, behaving differently. It is meant to mislead the
  player exactly once.

## M147 (0.97.0). Rumours: how anyone learns a place exists

The one discovery channel, and the reason the space between wonders is not empty.

- A rumour is **an area, never a point** — three to five systems — plus one image, one human detail
  and a source. Caught in cantinas (`27d-ui-cantina`) and by tuning the receiver (M123).
- **Rumours distort in retelling**, and about fifteen per cent are simply wrong — not to cheat the
  player but because that is what rumours are. Two independent sources agreeing is the strongest
  signal in the game, and the player works that out himself.
- Second channel: the needle on approach. Third: somebody in a bar showing you **his** tape.
- No markers. No "unexplored anomaly" in any list.

## M148 (0.98.0). The names travel

- A system can be **renamed by the player**, and his caption is what the map shows in place of the
  procedural code.
- The game may offer to rename after something large, and **never suggests a name.**
- The ship's log records facts only — coordinate, date, what you did. Not one interpretation.
- **A name you tell in a bar travels with the rumour**, and twenty hours later a dispatcher at the
  far end of the arm uses **your word**, slightly mangled. The galaxy takes up your toponymy: you
  are not an explorer, you are the source other people learn the map from.
- Text only, length-capped so nothing breaks; no voice.

## M149 (0.99.0). Design passports: the small things are the work

Not final polish — an entry condition. Half of this pass rests on a needle looking like a needle
from a factory rather than like a UI element.

- **The provenance rule**, extended from rooms to props: every object answers four questions or it
  does not get made — *what it is for, what it is made of, who made it and when, what is written on
  it.* No object exists because it looks nice.
- **Instruments** are dial gauges, never digital. Round and rectangular scales, glass with a
  highlight and a scratch, a brass bezel, the cockpit reflected in it. Every instrument is a product
  of a specific works: its own scale, its own digit shapes, its own needle manner. A new
  instrument's needle stands dead; an old one's floats.
- Labels are **stencilled, Russian, clerical, unglamorous**: `ХРОНОМЕТР`, `НЕВЯЗКА`, an inventory
  number. No icons, no pictograms — words and numbers only.
- **Palette and material**: painted metal in three shades (light grey, pale green, ochre), enamel
  chipped through to primer, brass, ebonite, glass, canvas, and wood wherever a person made
  something for himself. Warm filament light inside against cold stars outside — the only permanent
  colour conflict in frame. No neon, no blue holograms.
- **Four wear layers on every object**: factory → use (rubbed where hands go, soot by the exhaust) →
  repair (someone else's part in the wrong colour) → **personal** (a sticker, a scratch, a nickname
  on the hull, somebody's drawing). The fourth layer is what separates a world people lived in from
  a world that was generated.
- **One type family**: stencil for machinery, typewriter for documents, handwriting for notes. All
  of it Russian and all of it legible. On alien objects, not an "alien font" but **no writing at
  all** — silence instead of ornament.
- **Sound**: quieter than is usual. A constant bed of hum, the recorder's pen, relay clicks, ether
  noise between stations. Instruments make no sound whatsoever. Music is rare and almost always
  diegetic — the canteen speaker, a guitar in a bar, the song one woman remembers.
- **People**: work clothes in layers, pocketed and mended. A real range of ages, not a population of
  thirty-year-olds. No armour, no faction uniforms; a county is told apart by knitted versus canvas,
  by a cap versus a headscarf, by what has been used to patch the elbow.

## M150 (1.00.0). And what was that, exactly

- Single places, outside every region, placed by hand — one per major milestone, never in a batch.
- **Unique for the whole game.** Not a rare generation type: a specific place with coordinates. Meet
  a second one and the first is retroactively cheapened, and that cannot be undone.
- Nothing is explained, nothing is rewarded, nothing is logged. The only trace they leave is the
  name the player gives them (M148) and the fact that other people start using it.

## Rules this pass adds

- **Instruments never speak.** Not one beep in the whole game; not one colour change; not one alert.
- **The world does not congratulate.** No "mystery solved", no chime, no counter. A mystery is
  solved when the player decides it is.
- **One explanation per region, and never in text.**
- **The reward is access, fuel, a coordinate, a changed place.** Not credits.
- **Nothing scales to the player.** A place is what it is at hour five and at hour two hundred.
- **An event is never rescheduled to suit the player's arrival.** He misses it the first time.

## The proportions this pass is balanced to

- Counted in **player hours, not in systems**: ordinary life must stay above roughly two thirds, or
  the wonders devalue each other and the galaxy becomes a theme park.
- One large wonder every eight to twelve hours; something from the hundred every second or third
  landing; rumours running constantly underneath, so the gaps are spent **intending** to go
  somewhere.
- Cores are placed, not rolled: minimum distance from the start, minimum distance from each other,
  reachable on stock fuel — and **some of them in safe far systems**, so that "far" stops meaning
  "dangerous" and starts meaning "I have a story from there".

## Tone anchors

Classic Russian and Soviet science fiction — the films, the animation and the books — taken for
architecture only, never for plot, character or phrase: a cosmos that is inhabited and curious
first, where the enormous or the frightening arrives through a domestic detail, and where nobody
explains anything all the way to the end. Nothing of anyone else's work enters the game: the names,
places, creatures and lines here are our own.
