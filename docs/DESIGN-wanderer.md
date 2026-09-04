# The Wanderer — «Сорока», the ship where rare is traded

Design note, 2026-09-04. Answers the open item in `PLAN.md` («Карта чужой руки» has no code):
"where they trade rare" is **one ship**, not a station type. Nothing here is built yet.

## 1. What it is in one paragraph

A single sail-ship, «Сорока» (magpie), that has been collecting rare things since before the
Long Walk (`12q-lore`). It parks in orbit of one planet in one system for several real days, then
moves on under solar sails — slowly, a few sectors at a time. It never comes to you; you find it
by rumour, by the glint of its sails, or by the artifact that was written for it. Inside is a
long room of cabinets and hanging things: rare parts, nodes, relics, books, addresses. Three
counters: credits, maker's matches earned by dismantling parts, and one barter lot per stop.

## 2. Legend (what the keepers say, and what is true)

- **Told in cantinas:** a survey hull from before the Long Walk lost its engine fuel when the old
  refineries died; the crew rigged foil sails from the hull's own thermal blankets and kept the
  survey going — except that they stopped surveying places and started surveying *things*. Three
  generations later nobody aboard remembers the home port; the log is a catalogue.
- **The rule of the ship:** nothing aboard was bought. Every piece came in exchange for another
  piece, and the log records both sides of every swap — who gave what, where, for what. That log
  is the real cargo: the keepers know the address of every rare thing they ever declined.
- **Why it stands so long:** a sail-ship can only leave when the star pushes in the right
  direction. In lore the keepers "wait for the wind"; mechanically the stop length is fixed by
  epoch (below), and the departure is dressed as a flare in the sky watch (`11ak-skywatch`).
- **Why it never goes far:** foil sails give a handful of sectors per crossing. The route is a
  loop through inhabited space, because inhabited space is where things worth swapping come from.
- **Who is aboard:** one keeper at the counter (drawn), the rest "asleep in the spine". The keeper
  has no name and gives none; they call every visitor «гость» and every item by its provenance.

## 3. Finding it — three channels, none of them a marker

The game has no markers and no "unexplored anomaly" (`11t-rumours`, rule 0). Same here.

1. **Rumour** (`11t`, existing format: who / what / where / why believe). New rumour image:
   «паруса у планеты, которые не гаснут ночью». Area, not a point: 2–3 sectors around the true
   stop (tighter than ordinary rumours because sails are hard to mistake). Fifteen percent still
   wrong, as everywhere. Appears in cantinas within ~6 jumps of the stop while the ship stands.
2. **Sky watch** (`11ak`). From any system adjacent to the stop, the telescope lists «яркая
   точка без номера в каталоге» with the direction — one sector of ambiguity. This is the
   "two independent sources converge" moment the rumour module already relies on.
3. **The artifact** «Карта чужой руки» (`12h-relic`, `chart`), finally wired:
   - line one («на карте видно, где торгуют редким»): the galaxy map shows the current stop as a
     small sail glyph — exact system, exact planet;
   - line two, with the researcher's «чтение» perk («и то, чего там ещё нет»): the *next* stop
     is shown too, so a player can wait for it instead of chasing.

Reachability rule: every stop is within 4 jumps of at least one station of rung ≥ 6, and each
hop is 3–5 sectors from the previous stop. A player who arrives to an empty orbit can follow the
sail on the next stop; a player who never chases will still meet it: the loop crosses the home
region of every seed at least once per ~12 stops.

## 4. Time — deterministic, nothing persisted

Same model as everything else: position is a function of time, computed lazily.

| quantity | value | why |
|---|---|---|
| stop length | 3 real days | rumours already cycle on 3 days per station (`11t` rule 1) |
| transit | 1 real day | visible from the departed system as a receding glint; not dockable |
| epoch | `floor((now - WORLD_T0) / 4d)` | stop index; the loop is `WANDER_LOOP[epoch % L]` |
| loop | ~24 stops, seeded once from the world seed | fixed forever, like `NODES` and `12m-rare` |
| stock | seeded from `(worldSeed, epoch)` | same shelf for everyone at that stop; reload changes nothing |

Persisted: only `G.wander = {got:[id…], gave:[id…], chit:epoch|0}` — what you took, what you
left, and whether you bought the letter (below).

## 5. The fork at departure

Two things branch, one for the world and one for the player.

**World fork (every 4th stop):** instead of the next inhabited stop the ship "goes harvesting" —
one stop in a dark system (`sysDanger > .5`, no station). No rumours reach there, the sky watch
sees it only from the dark side. The chart's second line is the only way to know in advance.
At a dark stop the shelf is half empty but holds the one class of item that never appears in
inhabited space: **a piece from a baron's lair** (`RARE_WHERE lair`) and story fragments of the
Long Walk (`12q`) that are not in the hundred.

**Player fork (while docked):** the keeper offers, once per stop, «письмо вдогонку» — for a
small swap (any common node), the ship will post you its next address through the mail
(`11e-post`, `25j-post-wire`). The letter arrives with the mail's own slowness — sometimes after
the ship has already moved. So the choice is: pay and wait for a letter that may be late, or
trust rumours and chase. Both are honest; neither is a marker.

## 6. Trade — three counters, no recipes (revised 2026-09-04)

Author's worry: a swap economy means remembering a recipe and grinding for it, and this game does
not grind well. So the shelf is split into three counters, and only one of them swaps.

**A. Credits.** The ordinary shelf: parts of the region's top tier, nodes, books, area charts,
and *pages of the log*. Prices are 2–4× the nearest market analogue — you pay for the address,
not for the metal. Rare raw material is still not sold for credits (M39 stands).

**B. Спички (matches) — the second currency, born in the hangar.** Every part above
"добротная" carries a maker's plate. When you dismantle such a part (`27-ui-ship`, already
exists) the plate survives and goes to a new wallet `G.matches`. The ship also *buys* for matches
the one thing nobody else buys: rare raw material. So:

| you give | matches |
|---|---|
| dismantle a part, tier 3 / 4 / 5 | 1 / 3 / 8 |
| 40 units of volatiles, ice crystals or alloy (≤200 units per stop — «кладу из своего коробка») | 1 |
| 20 units of tech components (same cap) | 1 |
| one rarity from the hundred (`12m`) handed over | 4 (and it stays in `rareFound` — the ship copies, it does not take) |

Matches are spent only aboard «Сорока». They are not a wallet (no negative, no market, no rate),
so they cannot inflate anything. The legendary tools and the unique hull parts (§11) are priced
in matches, 12–60 each. A steady player accumulates 10–20 matches per real day of ordinary play
without aiming at it — the point is that you *already have* the currency when you find the ship.

**C. Barter — one lot per stop, one categorical ask.** Only the wild card swaps, and its ask is
never a recipe: «любая часть не ниже отменной», «любые три редкости», «книга, которой у нас нет».
The card says what it wants in plain words, and the game already prints what you carry. If you
do not have it, the lot waits for the next player of that seed.

Selling *to* the ship is counter B. Three sales earn "known guest": an eighth lot and the log
page at half price. Bought is gone for everyone in that save; nothing returns.

## 7. The ship (exterior, in-system scene)

Drawn in the language of the craft codex: body, outline, one light. Parked at the lit limb of
a planet, so the planet is the cold key and the sails are the warm accent.

- **Spine:** a long thin keel, eight to ten hull-lengths of the player's ship, built of ring
  frames with crates and bundles lashed between them — a caravan, not a hull. Read as a dark
  silhouette with rivet rows; nothing glows on it but one lantern at the bow gondola.
- **Sails:** four triangular foil gores on a cross yard amidships, gold-orange, wrinkled — the
  texture is orientated noise along the gore (rule 6), highlights are hard counted strokes, not a
  gradient (rule 2). They turn to face the star over minutes: movement, not blinking. From an
  adjacent system they are the "bright point without a number".
- **Gondola:** a glass nose at the bow, warm from inside; the keeper's lamp is the one warm
  light. The dock porch is under the keel, aft of the yard: a hanging ladder and a ring of
  small steady lights (steady — no blinking).
- **Traffic:** while it stands, `17f-sys-traffic` adds one extra shuttle arc between the ship
  and the station if there is one — the locals trade too.
- **Departure:** over the last hour of the stop the sails swing to the departure heading; on
  departure the ship shrinks along a straight line out of the system over a real day. If you are
  in-system at that moment you see it go. That is the whole "cutscene".

## 8. The room (new `G.mode = "wanderer"`)

A large new scene is a new mode, its own `update*/draw*` (cross-cutting rule). Room rules from
M74–M76 apply: human scale set first (~55 px, cantina scale), back wall mandatory, paint order
is the scene, light from somewhere.

- **Shape:** the inside of the spine — a long low corridor seen in section, perspective running
  away from the viewer to the keeper's counter at the far end. Ring frames every few metres
  give the depth marks. Above, a slit window shows the planet's limb turning; its cold light
  falls in bars across the floor. Below the slit, gold light from the sails leaks in and paints
  the upper cabinets warm. Two lights, two temperatures, one source each.
- **Cabinets:** both walls are cases — glass fronts with brass corners, each holding one thing
  on a cloth, lit by a tiny lamp inside (the only "many lights", and they are steady). Shelf
  items are the actual lots: a part drawn with the hull-part painter, a node as its glyph, a
  book as a spine, an address page as a folded chart. Empty cases stay empty with a chalk tag
  — a swapped lot leaves a hole, and the hole is the memory.
- **Hanging things:** in weightlessness the surplus hangs on lines from the ceiling — bundles,
  a bird cage (empty; the parrot's own lock is elsewhere), a tin lantern, a coil of cable. They
  drift a few pixels on long periods, never twinkle.
- **The keeper:** one figure behind a low counter at the vanishing point, drawn as a body
  (trapezoid suit, pack, helmet off and hanging), a ledger open under a green-shaded lamp. The
  lamp is the warm accent of the whole frame; everything else is cold planet-bars and gold
  leakage. Dust in the light bars. Vignette last.
- **UI:** the flea-market row model (`12ua`): walk the corridor with ←/→, the case in front of
  you shows its card — provenance, what it wants, one line from the log. No shop grid.
- **Sound:** foil ticking as the sails heat, a slow hull creak, the ledger page. No music
  stinger on entry; the ship is quiet by rule.

## 9. What it borrows and what it must not break

- Borrows: rumour format and distortion (`11t`), provenance cards and "bought is gone" (`12ua`),
  fixed addresses (`12m`), mail slowness (`11e/25j`), sky watch listing (`11ak`), traffic arcs
  (`17f`), artifact hooks (`12h`).
- Must not: add a marker; sell rare raw for credits; persist anything derived from seed+epoch;
  simulate the ship's motion outside the frame (position is a function of time).
- Tests to write with it: reachability of every loop stop (≤4 jumps from a rung-6 station);
  shelf determinism per epoch; artifact `chart` now reported wired by `91zzzzy-names`; a shifted
  clock (`91zzzzy-time`) moves the ship but never breaks the loop.

## 10. Open choices left to the author

- Name: «Сорока» (magpie: the bird that collects shiny things — fits the parrot thread). Alt:
  «Долгий Ход» itself, if the lore should say this *is* the survey ship of the report.
- Stop length 3 days vs 5. Three matches rumours; five is kinder to weekend players.
- Whether the eighth "known guest" lot can ever be a hull.

## 11. Legendary things — the catalogue

Rules: every effect is small and never credits (as `RARE_FX`). Every item has a provenance line
the keeper says aloud. Unique items are one per save. Prices: **с** matches, **кр** credits,
**обмен** barter. Hooks name the module that would read the flag.

### Tools (matches, small stat effects — read from `stat()`)
| item | provenance | effect | price |
|---|---|---|---|
| Секстант Долгого Хода | «с борта, который дошёл; второго такого не было» | jump +1 into systems with `sysDanger>.5` | 30 с |
| Штурманский карандаш | «стёрт до половины; хозяйка мерила им слухи» | rumour spread one sector tighter (`11t`) | 14 с |
| Гирокомпас без номера | «снят с гондолы при ремонте; номер стёрли мы» | turn +5 % | 16 с |
| Термоодеяло разведчика | «ткань наших парусов, лоскут» | gun cools +6 % | 12 с |
| Клапан старой заправки | «с последней станции, где ещё лили топливо» | tank +7 | 18 с |
| Парусная игла | «ей шили гроты; шьёт и корпус» | slow hull self-repair in flight, 1 hp/min, never in combat | 24 с |
| Колокол вахты | «звонил при каждой новой точке в каталоге» | sky watch lists one sector further (`11ak`) | 20 с |
| Медный шар курьера | «почтовый; внутри до сих пор чьё-то письмо» | mail arrives one relay hop sooner (`25j`) | 22 с |
| Слепок печати дома | «дом не признаёт, но станции узнают» | one scrip exchange per stop without spread (`12u`) | 26 с |
| Тетрадь ветра | «здесь записано, когда мы уходим» | exact departure countdown of «Сорока» in the HUD | 10 с |
| Табличка «НЕ КУПЛЕНО» | «вешали на трюм, чтоб не спрашивали» | flea lot about *your* route is never sold to the hunter (`12ua` rule 4, `12o`) | 28 с |

### Unique hull parts (matches; one per save; drawn by the part painter with their own mark)
| item | provenance | effect | price |
|---|---|---|---|
| Стеклянная гондола | «наша запасная; смотрит дальше, чем надо» | radar +120, cabin visibly glass in the hull frame | 60 с |
| Якорь караванщика | «на нём висел весь наш излишек» | cargo +12 % | 48 с |
| Рей с фольгой | «четверть паруса; тянет, когда звезда близко» | thrust +8 % inside the inner orbits, cosmetic gold gore on the player's hull | 44 с |
| Тихий маршевый | «снят с борта, что ушёл без звука» | pirates detect you one ring later (`13-pirates`) | 52 с |
| Печь-крошка | «плавильня в ладонь; долго и мало» | smelts alloy from iron in the hold, 1 per hour | 40 с |

### Papers (credits — the ship sells addresses, the metal is a bonus)
| item | what it is | price |
|---|---|---|
| Страница журнала | one rarity address from the hundred with **zero** error — the only such rumour in the game | 2400 кр |
| Список отказов | three lots the ship declined: three exact addresses of rare parts still lying where they were | 1800 кр |
| Карта области | reveals a 3×3 of sectors on the galaxy map, names included | 900 кр |
| Каталожная карточка | the provenance card of one item you already own: adds a story line to it in the hold | 300 кр |
| Перечень погибших бортов | names the pirate hulls in the region and whose they were (`12i`) | 1200 кр |

### Barter (the wild card; one per stop; one plain ask)
| item | ask | note |
|---|---|---|
| any of the seven artifacts (`12h`) | «любые три редкости» or «часть легендарная» | only while the player holds fewer than three |
| a rarity from the hundred that this save's galaxy put out of reach | «любая часть не ниже отменной» | the ship has been where you have not |
| Ковчежец Долгого Хода | «книга, которой у нас нет» | a story fragment outside `12q`'s hundred; reading it reveals the 25th, hidden stop of the loop |
| Сорочье перо | «редкость с памятника» | the parrot wears it (`12x-parrot`); nothing else, and that is the point |
| Пустая птичья клетка | «ничего; забирайте» | hangs in your cabin; the lock on the living bird stays where it is (`parrotFind`) |

### Dark-stop exclusives (every 4th stop, §5)
- Вещь из логова барона (`RARE_WHERE lair`) — one, for matches, 35 с.
- Кусок отчёта Долгого Хода вне сотни — credits, 1500 кр.
- Second wild card that asks «сплавы, сколько есть» — the only lot that takes rare raw as the ask itself.

## 12. Revision 2026-09-04 (evening): currency name, breadth, cosmetics, one table, the locker

- **Currency is «ярлык»** (tag), plural ярлыки; fallback «жетон». Lore: every worthy part carries
  a tag — maker, hull it stood on, where it was taken off. The ship collects matches; the log is matches.
- **Catalogue ~120 items in six families; 8 lots per stop**: 2 cosmetics, 2 late-game eases,
  1 unique part (50 %), 2 papers, 1 barter wild card. ~7 % of the catalogue per stop. Some items are
  bound to the stop kind (gas giant / dark system / a house's home station). The log page shows the
  last three shelves so rotation is felt, not guessed.
- **Cosmetics (matches 6–20, no stats):** eight exhausts with their own flame shapes; jump trails;
  suit finishes (gold, blackened, mirror, porcelain with painting, house crest) and visor tints;
  rare hull paint/marks (`03d-hull-marks`), a real maker's plate; nav/landing light patterns;
  cabin objects; parrot accessories; own docking chime and receiver tone.
- **Late-game eases (matches 15–40):** Ключ причала (dock from anywhere in-system), Шланг соседа
  (refuel at own base from orbit), Слуховая трубка (rumours on the receiver in flight), Автопилот
  по слуху (rumour area as autopilot target), Список цен (prices within 3 jumps on the map),
  Вторая рука (one order to the whole fleet), Ретранслятор, Мастерская рука (wear −⅓), Печатный
  шаблон (postcard blanks never run out), Второй ящик, Полка шире, plus the earlier tools.
- **Books:** no reading bonus ever (`12ub` rule). Instead the ship sometimes carries a *missing
  book* for credits — the shelf at home closes, nothing else.
- **Barter adds Второй журнал**: a second artifact slot for one manager, ask «часть легендарная».
- **One table, «ОПИСЬ»** (desk tab): hold as piles + kit laid out + parts/tools/cosmetics zone
  (drag a cosmetic onto the hull silhouette or the kit to apply) + a jettison hatch in the corner
  instead of a button (confirm only above «добротная»). Matches lie in the corner as a bundle.
- **Locker («ящик»)** slides in as a fifth zone when docked: 24 slots, one per player, any station
  with rung ≥ 6, instant. Lore: the houses' transport office; fee 1 %/day of contents' value; after
  30 days unvisited the office sells the contents to the flea market, where they resurface as lots
  «залог, за которым не пришли» (`12ua`). Ship tools work only from the cabin shelf (6 places);
  the rest live in the locker — the one soft choice, «what to take on this run».
- Open: locker fee 1 %/day vs none; cosmetics also for credits or matches only.

## 13. Matches — the currency and its lore (decided 2026-09-04)

**Why there are none.** Open fire is forbidden everywhere — station, hull, base — older than the
Long Walk, written in the station charter (§9: fire-making means are surrendered at the gate and
kept in a sealed box — hence the office locker of §12). No fire, no need for matches; the
factories stood on the old worlds, the last lots went a generation ago, nobody restored the
chemistry. A match is the only fire you can hold in your hand: not money, but the thing money
cannot make. A struck match is gone; only whole ones count.

**Where the player's come from.** The mechanics' custom of the old worlds: one match under the
cowl of every good part, «чтоб стояла». Dismantle a part above «добротная» and find it:
tier 3 → 1, tier 4 → 3, tier 5 → 5 (rarely a whole box of 8). Cheap and new parts are empty —
so the rule is self-explaining and the market never touches matches. The ship buys rare raw for
matches from its own three-hundred-year store.

**What the ship does with them.** One match per departure: the keeper strikes it in the glass
gondola and goes where the flame leans — that *is* «ждать ветра», and a player aboard in the last
hour sees the flash. A swap is sealed by a whole match laid on the counter; whoever strikes it
has broken the deal. Nobody strikes it.

**Boxes.** Empty boxes of the old factories (~20 labels, one line each) are a side collection on
the home shelf beside the books, «коробков: N из 20»; found in wrecks, at the flea, aboard. A
full box of fifty whole matches is a legend the keeper mentions and never sells — a possible
wild card, once.

**In-game lines** (Russian, ready to use): keeper — «Спички считаем целыми. Чиркнутая уже не
спичка, а история.» · «Огня в космосе нет уже сто лет. Есть только то, что положили внутрь до
нас.» · «За гондолу шестьдесят. Не торгуюсь, у меня их тоже не делают.» · on raw: «Летучих на
двадцать спичек. Кладу из своего коробка, помните это.» · on departure: «Сейчас узнаем, куда
ветер.» — flash — «Туда.» Hold on dismantle — «Разобрано. Под кожухом спичка: мастер клал, чтоб
стояла.» / «Разобрано. Внутри пусто, новая работа.» Rumour — «…видел борт, где платят спичками.
Клялся, что там ещё чиркают.» HUD/desk: «спичек: 14», a matchbox in the table corner with the
count as a pile caption.
