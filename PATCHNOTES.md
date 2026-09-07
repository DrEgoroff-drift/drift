# Drift — patch notes

The game version is shown on the title screen. It has nothing to do with the save format
(`v:4`): records written by earlier versions keep loading.

Entries from 0.45.0 onward are written in English (docs are English, the game stays Russian);
older entries below are left as they were written — translating history would cost more than it
could ever save.
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
## 0.399.0 - M399: устав — four laws, each of them for good

Four laws, taken one at a time as the base grows — at two, four, six and eight built compartments —
and **each irrevocable for that base**. That is what makes a law a decision rather than a slider: a
slider can be moved back.

- **Двойная смена** — a quarter more of everything the base makes, paid for with ten points of
  spirit and two fifths more trouble from the director.
- **Общий котёл** — nobody goes hungry while there is any food at all, paid for with eight percent
  of the output: there are no half-fed halves either.
- **Сухой закон** — the spirit ration goes to technical needs and repairs run twice as fast, paid
  for with twelve points of spirit.
- **Открытая дверь** — twice as many people walk up to the gate, and **one in six of them is not
  the right one**: two days after you take him, a third of the store is gone. That is not a bad
  person; it is what an open door costs.

The keeper's perks are *how well* a base runs; the charter is *what kind of place it is*. They do
not argue and do not add up into one number. The laws are taken at the desk, where the base is
looked at whole, and the journal records each one: «устав: принят закон «Сухой закон». Навсегда».

With this the base's second stage is closed: СВЯЗЬ, the people in the room, adjacency and halls,
the director, the аврал and the charter — M394 through M399.

---
## 0.398.0 - M398: аврал — the one place on a base where your hands matter

Everything else about a base is lazy: however many shifts have passed, that many are resolved, and
the player's hands have nothing to do with it. **Аврал** is the opposite, and it is the answer to
«why open the scene at all».

While you are **inside**, the director can set a compartment burning, venting or flooding. You have
forty seconds to walk there and hold ДЕЙСТВИЕ for two. People working that module hold it with you;
a мастерская next door helps; a гермозатвор beside it helps a little. Miss it and the compartment
takes a beating and the trouble becomes the **walking** kind from M397 — which is exactly what
would have happened if you had not been there at all.

That asymmetry is the design: away, the crew handle it as well as their roles allow; present, you
handle it better than they can. One per visit, about one visit in four, no new mode and no new
machinery — the same walking, the same light, the same camera. The burning cell is drawn with its
own glow, its own frame and the hold bar inside it, where the trouble is, rather than at the edge
of the screen. Nobody dies in an аврал: it is about things, not people. The phone layout was
checked as part of the pass, because holding a button is exactly the kind of thing that is easy on
a keyboard and awkward on glass.

---
## 0.397.0 - M397: the director — weather instead of dice

The base had two rolls, a raid and a storm. Both were dice, neither looked at anything, and both
arrived without warning. They are now one **director**, and the difference is three rules.

**It forecasts.** Every event is decided a shift ahead and goes into the journal before it happens
— «барограф падает», «на орбите чужой транспондер», «порода гудит». The forecast is not mercy; it
is what turns dice into weather, because weather has a sky you can read. A player who is there can
prepare; a player who is away reads how the crew prepared without him.

**It belongs to the planet.** Каменистая gets dust storms that stop the drill, ледяная and
океаническая get a cold snap that takes two steps of heat for six shifts, вулканическая gets a
tremor that damages a cell and can set it alight, ядовитая gets a vent that takes half the air —
and everywhere there is the raid and the storm that were always there. **A quarter of every world's
events are good**: a passing barge leaving cargo, a vein under the base for two days, somebody
walking up to the gate. That share is computed from the world's own table rather than fixed, so a
terran base with two kinds of trouble gets the same quarter as a rocky one with three — a base that
only ever brings bad news stops being a place and becomes a chore.

**Trouble walks.** A fire starts in one cell, eats at it, and moves to a neighbour next shift unless
somebody puts it out or a **гермозатвор** stands in the way — a 600-credit module that produces
nothing and is the only thing that stops it. That is precisely why the layout is a plan and not a
shopping list. Engineers, a мастерская and simply having people about put fires out; two engineers
manage it in a few shifts.

Measured on a modest rocky base (worth 6000, quiet sector): threat 0.065 a shift — about one event
every sixteen shifts, four days — of which roughly a third were good. A rich base in a dangerous
sector runs up to the ceiling of 0.35, one event every three shifts, because trouble scales to what
there is to lose.

---
## 0.396.0 - M396: nine rules of adjacency, halls of three, and a shaft to ride

A base had two adjacency rules, and they lived in the code as two exceptions. Now there are
**nine**, and they live in a table: reactor to drill/electrolyser/cryo saves 22% of the
transmission; reactor next to housing costs spirit; a greenhouse next to housing gives spirit and a
little air; a **лазарет** next to housing gives spirit; a melter feeding an electrolyser saves it
ice; a **радиатор directly above a reactor in the same column** vents three more; a store beside a
drill or a smelter lets 20% more of the haul land; a **мастерская** repairs its neighbour twice as
fast; and a battery next to housing costs spirit, because nobody sleeps beside the gun.

Two of the nine referenced modules that did not exist, so they exist now and do exactly what is
written and nothing more: **лазарет** (+4 spirit next door) and **мастерская** (repairs without an
engineer, doubles a neighbour's repair, and takes 15% off building on that base — the reason to put
it up first).

**Залы.** Three identical modules side by side in a row become a hall: a third less energy for all
three. The price is Fallout Shelter's own price, and it is what makes the hall a decision — a
disaster that reaches a hall takes **the whole hall**, not one cell. A raid or a storm that breaks
one of the three breaks all three.

**Ствол.** The lift shaft is not a module and never was: it is the sixth column, free and always
there, and now it is drawn and can be walked into — which is finally an answer to why one can move
between levels at all. Its first version had the classic off-by-one behind it: column −1 folded into
the end of the previous row, so the game cheerfully drew a frame labelled «РАДИАТОР» over the shaft.
`baseCell` now refuses addresses outside the grid, which is where that belonged all along.

---
## 0.395.0 - M395: the people are in the room

Until today a base was staffed from a menu on a station — another place, another screen — and the
person was a number in a list, «персонал 2/4». Meanwhile the base itself had a little figure drawn
walking about who represented nobody.

Now those two are the same person. **The drawn worker is the assignee**, standing in the module he
works in, with his name over his head. And he is put there **where he stands**: walk up to the
module, press ЦЕЛЬ, and choose who works here — the same ribbon of choices as the build menu, the
same keys. The station menu stays, because it is about the fleet; a base is staffed where you can
see it.

**Roles grow from four to seven**, exactly matching the gauges of the last three passes:

- **жизнеобеспеченец** — air and water come a third more freely;
- **садовод** — two fifths more food, and it never turns poor, even out of the protein vat;
- **радист** — the base is heard further, and calls through a worse signal.

**Маяк** is the one module that brings *people*: once every thirty shifts somebody asks to stay,
scaled by how good the place is to live in, and waits at the gate. Taking them is a decision at the
desk, not a line in the journal — they are a hire like any other, with the same crew ceiling and the
same wages, because a person who costs nothing would not be a person.

---
## 0.394.0 - M394: СВЯЗЬ — the base from anywhere, on the receiver and not on a screen

«Можно посмотреть, из любого места» — and the answer is deliberately not a screen. A base is a
**channel on the receiver**, in the same panel where the galaxy's other masts are caught, and it
tells you exactly as much as the signal carries:

- in its own system — numbers on every gauge and the last two journal lines;
- a few sectors out — one word per gauge («воздух — впритык») and the last line;
- far, or unpowered — one word about the base as a whole: порядок, терпимо, плохо, встали;
- beyond that — «…шшш», and that is information too.

A panel would have shown everything always and made distance, the radio operator and the mast
worthless in one stroke. The receiver makes each of them worth something — and it is how a manager
will be judged when managers arrive (§34): the report says one thing, the gauge says another, and
the difference is audible.

**Мачта** is a surface-row module: with it the base is heard across the circle, without it for
three sectors. Nothing is locked behind it — without a mast you hear badly, not never. That is the
difference between hearing and knowing, which is what the whole game is about.

**The base calls you.** A stop, a departure, a raid, heat that finished a module off — the crew say
it themselves over the ether while you are flying, at whatever quality the signal has, and turning
back is then a decision rather than a line in a panel. Bases are now caught up on **every jump**, so
this happens in the road and not only when you look at them.

**One order per contact**: park a base or raise it from anywhere the signal is good enough — which
is about half the mast's reach. A distant base is genuinely harder to steer, exactly as §38 says,
and that is the cost the real управляющий will one day remove.

---
## 0.393.0 - M393: food has a taste, and the base has a spirit

The fourth gauge is **харч**, and it is the only one with a flavour. **Оранжерея** drinks 6 water,
gives 5 food and 2 air, and has to be sown once with 4 organics — no organics, no bed, and it
stands empty until you bring some. **Белковый бак** turns 4 organics into 8 food: half again as
much, and squarely worse — while the vat is what people are eating, the base's spirit carries a
standing tax. Canned food flown in from the holding counts as good, синтебелок as poor, and both
are the second thing on the list of goods the game finally eats.

**Дух** is the fifth gauge and produces nothing. It reads the other four — hunger, poor food, a
stopped base, air or water down to the last three shifts, heat outside the calm band, housing
pressed against the reactor, a flickering grid — and answers one question: how much longer will
they put up with this. It also drags each person's own morale towards itself, so the base's mood
and the crew's mood stop being two unrelated numbers.

**And when the answer is «no longer», nobody dies.** Дух under a quarter for three shifts running
and **one** person packs up and walks to the station, hireable again from the usual roster, with a
line in the journal in their own voice: «Тут больше нечем дышать. Ушёл» — Гриша, и ушёл. Reaching
that takes everything at once — no air, no water, no food, the food poor, the base stopped and hot
— which is not «I was late», it is «I abandoned them». Dying of the player's absence stays where
`DESIGN-base` §8 put it: in the зимовка, which is opt-in.

---
## 0.392.0 - M392: heat, depth, and the cryogenics shop that was promised

The third gauge, and the only **two-sided** one — one-sided it would just be a second energy bar.
Heat is the sum of four things, all of them visible: the world (лёд −2, вулкан +2), the machines
themselves (реактор +6, бур +3, электролизёр +2, ледоплавка −1), the depth (+0.4 a row, because
the rock below is warm), and whatever sheds it — **радиатор** (−8, surface only, and the storm
takes it first) and **криоцех** (−14, and only while it has gas to run on: a cryo shop without
volatiles is a stopped shop, not a free radiator).

Cold freezes the water: ледоплавка gives nothing at all, which is the point — not «slower», not.
Heat wears the machinery down and, far enough up, stops the drill. Three steps rather than two,
and the thresholds were chosen against the base that players already have rather than out of the
air: a reactor and a drill is **+9**, so that base has to land in the first step — fifteen percent
off the output and no wear — and be cured by **one** radiator at 900 credits, which brings it
exactly into the calm band. §16's own worked example (five people at +11) lands in the second step
and wants the second radiator, exactly as it says. A pass that silently halved the output of every
base already standing would not be a gauge, it would be a confiscation.

**Глубина** now pays as well as costs: every row below the first is +8% to that drill's output and
+0.4 heat. That is the only reason to dig deeper other than room, and it is a real trade.

**Криоцех** finally pays the promise `02-world` has been printing since the rare goods were
written: летучие газы 3 → криоген 1 a shift, and the cryogen can be flown to another base — one
unit is −6 heat for 12 shifts. It is the answer for a hot world, and the one thing on a base that
cools harder than a radiator.

---
## 0.391.0 - M391: the base breathes, and can be starved without being killed

Two gauges and two modules. **Электролизёр** turns 6 ice into 6 air a shift, **ледоплавка** turns
8 ice into 8 water, and both scale with the power they actually get — on one reactor an
electrolyser gives back less than the crew breathes, which is not a bug but the two gauges being
wired to each other. A person breathes 2 and drinks 2 a shift, and **only people consume**: a base
with nobody on it eats nothing and can stand forever, so founding a base and flying away does not
quietly turn it into a ruin.

**Кончился запас — база встаёт.** §13's promise, and it is a promise, not a threat: the store
stops at zero instead of going negative, mining and refining stop, the crew go to «малый ход» and
consume a third, the journal writes the shift it happened, and nothing is destroyed, nobody dies
and no debt accrues. What is lost is tempo. Bring oxygen (1 → 8 air) or ice (1 → 1 water, and it
also lands in the store as feedstock for both machines) and the base wakes by itself — one shift
goes on getting the fires up again, and then it works.

**Консервация as a button**, on the base's row at the home desk: park the base deliberately before
a long flight, and it stops consuming and stops producing until you unpark it. That is the correct
play before a long trip, and it is the same mechanism as the involuntary stop — a base parked by
hand does not wake itself when supplies arrive, because a hand put it there.

This is the pass after which the layer is a game: something can now go wrong at a base while you
are away, and the answer to it is a flight with a hold full of the holding's own oxygen and ice —
the first thing in the game that eats them (`DESIGN-base` §14).

---
## 0.390.0 - M390: the base gets a shift, a replay and a journal

The base used to live on its own clock: `baseTick` counted **minutes** off the wall clock, and
took its raid and storm rolls from the current minute plus a counter inside the base itself. Three
things were wrong with that at once. The layer had no unit — the holding measures in **смены**
(20 minutes) and a player who had learned one arrived at a base and found minutes. The outcome
depended on **how often you looked**: ten one-minute visits and one ten-minute visit rolled
different dice. And none of it could be checked, because the replay did not even reproduce itself.

Now the base's unit is the shift, and a shift is a pure function of its **number**: `baseResolve`
catches up as many shifts as have passed and resolves each one exactly as it would resolve for
anybody else. Ten visits of one shift and one visit of ten now produce the same ore, the same
credits and the same journal, line for line — the new suite `91zzzw-base` checks precisely that,
along with the ceiling of 72 shifts (`CREW_OFFLINE_CAP`, in shifts) and the collapse of everything
older than 24 shifts into arithmetic plus one line.

**Журнал базы.** The base writes a line a shift and keeps the last 24, in the voice of whoever it
concerns: «Пришли двое. Ушли ни с чем» — Нина; «Склад полон, бурить некуда» — Гриша; «буря.
Выбито: Солнечная панель»; «смены 570–575 · база работала сама». Ten kinds of line, and they are
exactly the ten things the base already does — an eleventh kind would be the base lying in its own
log. A quiet shift writes «смена прошла тихо», but only one in four, and by shift number rather
than by visit: otherwise the journal would be a report on the player's habits. Entering the base
now opens with the journal — that is what the visit is for — and the movement hint moved to the
last line.

Nothing new is consumed yet (the stores are M391): this is the same base, resolved differently,
and every old save opens unchanged — the shift is stamped at load exactly as the minute clock was,
so no idle time is credited retroactively.

---
## 0.388.0 - M388: the Director's last family — science and culture, and the war queue closes

**Радиоспектакль «Седьмая смена».** For six days out of every twenty-eight the ether tells a
serial — a chapter a day, six chapters, and each chapter exists in all six voices. One plot: a
watch takes a signal, goes, finds the wrong thing, stays anyway, and comes back to a home it does
not recognise. ГЛАВТРАССА reports it fulfilled at 104 %, the Company counts it as profit that
cannot be sold, the Order files it in triplicate and loses the second copy, and the workshop just
says put the kettle on, this will take a while. On a wave silenced by a leak (M385) there is no
play — the serial goes through the ether, not past it.

**Экспедиция и обрывок «Долгого Хода».** The Director's expedition arc now has something to put
your hands to: 200 `scan` deeds in that power's systems, counted from the сводка the arc began,
and the expedition finds — not an ore body, but a page of somebody else's chronicle. Six
fragments, hand-written like the forty books of M202 and collected the same way, one at a time,
giving nothing but themselves.

**Новая серия завода.** For a month one power's counters carry its own series of guns — a tier
higher and with a name («Ладога-3», «Зубр-70»). The name lives in the board line and not in the
part: a part must rebuild from a save exactly as it was issued, and baking a calendar month into
it would mean a new generator generation for the sake of a label.

**Олимпиада флота.** A race along the трасса, three days out of every fifteen: one button at the
start, one at the finish no nearer than six sectors, and clean elapsed time between them. Your
time is yours and your best is kept; what goes to the crowd is attendance and nothing else — the
postcard rule holds here too, so there is no table of champions and no names in it.

That is the seventh family, and with it the war queue **M360–M388 is closed**: the fight, the
world, everyone, and the Director's seven families of mechanics, in twenty-nine versions.

---
## 0.387.0 - M387: the Director's sixth family — security, and the places with no law in them

**Пиратский король.** For a week out of every twenty-four days the barons hold one area of the
circle — 73 systems of 317, measured — and the power that owns it simply leaves: no pickets at
all, twice the pirates, every one of them a rank higher. He is not a boss and has no hull; he is
a condition, and the only thing that ends him early is the crowd. The `clear` deeds filed inside
his area since the week began are counted against a goal of 150, and the station header carries
the running total, so the counter is visible to everyone flying there for the same reason.

**Шпион на станции.** A leak costs a power three days of a silent wave (M385) — and ten days of
prices that lie. They lie per good and in **both** directions, up to twelve hundredths, which
makes a spied-on station worth visiting rather than avoiding: something there is underpriced. The
lie sits in the one shared price multiplier, so both sides of the counter move together and
«взять дороже, чем сдать» still holds — the suite checks every good.

**Ретранслятор.** M385's silent wave had no cure and simply waited itself out. Now it has one:
120 `scan` deeds in that power's systems repair the relay, the board shows the counter with a
button, and the wave speaks again before its three days are up.

**Досмотр.** While a power is inspecting, its pickets hail from twice the distance. Nothing else
changes — the four rules of M373 are the same four rules.

**Контрабанда как ответ на талоны.** A coupon buys one cheap tank per сводка. The second one is
sold only off the books, at half the counter's price and twice the coupon's — and it is stolen
fuel. The stamp lives a day, and the досмотр of the very power whose coupons those were
recognises its own fuel in your tanks: contraband, and the second of the four rules applies.

Two more members of this family were already written and are only named here: the desertion wave
after a purge is M385, and the blockade is the front — a picket has been turning everyone back
since M373.

---
## 0.386.0 - M386: the Director's fifth family — diplomacy, and war that announces itself

**War no longer starts out of nowhere.** Until today a power decided to fight and fought in the
same сводка; the player learned about it from someone else's battle in the sky. Now a decision
first becomes paper: an **ultimatum with a deadline**, six сводки, visible at the station as a
number. When the deadline expires the war begins by itself and nothing stops it. Two things stop
it before that: a deal or an alliance struck with that very power, or the hunger that started it
going away. The agent's move did not change by a single roll — only the moment did, and the
window it opens is the whole point: a day and a half to move cargo, finish a run, pull a hired
hand out of the wrong system.

Measured over 1000 сводки, with the note against without: **209 wars instead of 286**, systems
changing hands 1851 instead of 2601, a war running somewhere in 914 сводки out of 1001 instead of
987 — the galaxy stays as warlike as it was, it just stops being surprised by it. 179 notes were
filed, 175 ran their срок out into war, 3 were answered, and 34 wars started with no note at all
because three were already pending — the cap does not queue, it steps aside.

**Посольство** crosses a foreign system: a ship that does not hail, does not shoot and does not
answer fire. Stay near it for ten seconds and you have escorted it — an episode with **both**
sides, the one whose ship it was and the one whose space it crossed, because taking a stranger
through a stranger's sky is worth the same to both. Shoot it and it is «не простил» for its own
power and a shot episode for the host: the one consequence in this family that hits, and it hits
only whoever fired first.

**Обмен пленными** — while a truce is fresh, a station of either side gives back a hostage of
yours without a ransom. One exchange per truce.

**Письмо** (гл. 49) — taken at one power's station, handed over at another's. The postcard rule
holds all the way down: the letter has exactly three fields — from, to, and the сводка it was
written in — and no field the player could write into. No payment either way; late still counts,
but only the addressee remembers it.

Six voices for both new lines (the note filed and the note answered), and the ether now names
**both** sides of a quarrel — a line that mentioned one of two was lying by omission.

The chronicle hashes are re-pinned deliberately: the note lives inside the replay (step 4a), in
the state, in the clone, in the cache and in the hash — a divergence about a deadline is a
divergence about whether there is a war tomorrow.

---
## 0.385.0 - M385: the Director's fourth family — who is in charge

**Чистка** takes a third of a power's strength, and **наследник** halves its relations with
everyone both ways — both inside the replay, because they change the state itself and must be the
same for every client.

**Переворот** inverts the course the crowd voted for. It is the only thing in the game that can
overrule a vote, and it costs the power a spike of tension to do it; next month the question is
put again.

After a purge there are **twice as many deserters** in that power's systems — and they are the
ones whose number was painted over cleanly, the mark M369a drew for exactly this.

**Утечка** does not make a wave say something else: it makes it **silent**. That is louder.

**A bug worth naming.** Asking the chronicle a question from inside a step is a replay inside a
replay: the course did exactly that and hung the whole suite. State is now passed down through the
step, and a re-entry guard stands where the next one would land — with the story written next to
it, because this is the kind of mistake that comes back.

Tests: the purge and the successor visible in the state over four hundred сводки; a coup inverting
a voted course and only a coup doing it; a leak silencing exactly one wave; and sixty сводки with
a course computing instantly instead of never.

## 0.384.0 - M384: the Director's third family — weather

Nature stops being scenery.

**Вспышка.** For three days the instruments lie — with the same mark the помеховая already uses,
because inventing a second kind of interference would only mean two things to debug — and the
pickets leave: no patrol, no somebody else's battle, empty sky.

**Рой.** Asteroids cross a system and hit **whoever stands still**. The rule is visible before it
costs anything and the cure is obvious: move. That is the difference between difficulty and
meanness, and it is the only thing in this family that damages you at all.

**Истощение.** A power's belts give **no** ore — not less. An event should feel like an event.

**Находка.** A planet becomes habitable: the surface there yields a quarter more. One kind thing
per family is about right.

Tests: nothing announced meaning nothing happening; the flare jamming and emptying the sky; the
swarm hurting a standing ship and ignoring a moving one; the depletion zeroing ore but not
organics; the find raising the surface yield.

## 0.383.0 - M383: the Director's second family — people

The war reaches the people who were already in the game: the hired hands at the counter, the clerk
at the dock, the keepers who take a station quiet.

**Переселенцы.** After a system is taken, people leave for the neighbours — and in those
neighbouring systems a hired hand costs a quarter less, because there are many of them and they
are not choosing. It is the one place the war touches wages, and it touches them downward.

**Забастовка.** The station stands: everything but the pump is closed, through the same service
gate an occupation uses — because what closes is always the same things. Prices go up a tenth
while it stands.

**Праздник.** A parade, a tenth off the counter, and the wave sings.

**Тихий уезд.** Once a quarter a sect takes a station into silence and nobody robs anyone in that
system for a week — the mechanic from 11n gets its second reason to exist.

**Бунт.** In a freshly taken system a revolt can flip the flag back — but only if the crowd
actually backed it, which is measured the way everything else is: by the defence counter in that
system's ведомость. There is no «press to revolt» button, and there will not be one.

Also: when two incidents of the same kind land on the same сводка, the newer line now wins. The
old rule kept the first, which meant the Director's own strike out-shouted a fresher one.

Tests: nothing announced meaning nothing closed and nothing cheaper; the strike closing the yard
and the lab but not the pump; the holiday discounting and the strike surcharging; the sect
emptying the system; and refugees making labour cheaper next door but never at home.

## 0.382.0 - M382: the Director's first family — money

The Director has been announcing incidents since 0.371.0; from here they start doing things. One
family per pass, and the first is economy.

**A price wave per power.** Every power's prices ride a thirty-сводка saw of ±9 % — not an event,
a background, and the reason carrying the same cargo the same route is not equally worth it every
day. It is built from integers so two clients cannot disagree about it.

**Жила.** For three days after a vein is announced, everything found in that power's systems comes
one tier better — and everybody flies there, pirates included.

**Ярмарка.** One station in eight in that power's space keeps a discount and an extra part on the
counter for two days.

**Эмбарго.** Goods in that power's systems cost a fifth more, and the counter says so before the
air does.

All four live in the **same** shared multiplier the pirate grip and the fresh occupation already
use — the M380 lesson: a price that moves on one side of the counter only turns a station into a
money printer. And all four are computed from the chronicle, so two players who replayed the same
сводки see the same prices without anything being sent.

Tests: the wave inside its nine per cent, shifted per power and stable between calls; no incident
meaning no effect at all; the vein raising the tier only in the announcing power's systems; and
the embargo moving the price up but not by a factor.

## 0.381.0 - M381: the paper from above, and the limit on it

The war's upper layer — the one the regulator writes — now exists, and so does the fence around
it.

**`docs/WAR-CONSTITUTION.md`** says what a циркуляр may do: shift a power's needs by up to thirty
per cent, call one of seven named events, give the six waves their line for the day, move the
dials of §11.5 by up to a fifth, set the month's season. And what it may never do: touch a
player's things or money in any direction, erase an episode or a person from a notebook, undo
«закреплено», name or quote a player, move systems directly, or reach back into history already
replayed.

**The fence is code, not advice.** `circValid()` is written from that file line by line; the same
list is mirrored in `war.php` so a циркуляр filed over ssh is refused before it is ever served;
and a циркуляр that fails is **not applied at all** — not clamped, not partially honoured. The
unknown-field rule is the important one: any key the constitution does not list fails the whole
циркуляр, because otherwise tomorrow there is one more small field.

**In the game it is paper**, in the voice of the wave you are tuned to: ГЛАВТРАССА prints a
«Циркуляр», Компания a press release, Орднунг a numbered order. The satire closes on the
regulator itself, which is right — from inside the world, the upper layer is paper from above.

Tests: every allowed field accepted and every forbidden one refused, a bad циркуляр changing
nothing in a replay, a good one moving exactly the need it names and no other, and the code's own
lists checked closed.

## 0.380.0 - M380: «Ревизия» — the ceiling with a face

The crowd can redraw a quarter of the galaxy in a week and then hits a wall. This is the wall,
and it has a hull: a flagship from the «Долгий Ход» years, automatic, carrying out an order
nobody cancelled — «восстановить план».

**It comes where the map moved most.** A home area whose systems changed by more than a quarter
in three days gets it; that is read from the chronicle, so every client knows where it is without
being told. While it stands, everything the crowd contributes in that area counts for a quarter.

**Why one pilot cannot and a crowd can, with no live multiplayer at all.** Its shield regenerates
faster than the best solo pilot shoots, damage is summed on the server by minutes and by accounts,
and the hull there does not regenerate. Three strong or eight average pilots in the same сводка
push the shield down — and none of them sees the others: each sees the ведомость line «в бою
бортов: 7». **And yet one can**: the shield is импульсный and drops by itself for twenty seconds
every ten minutes. A hundred such windows is seventeen hours of fighting. Possible. Very hard, as
asked.

Damage goes up once a minute, capped at thirteen minutes of the best build per account per
сводка — not because more is impossible but because more cannot be checked, and one line should
not be able to end everyone else's fight.

Also fixed here, found by a net rather than by eye: M372's fresh-occupation price rise was applied
to the selling price only, so on a just-taken station buying became cheaper than selling. It now
lives in the shared multiplier where the pirate grip already lived, and both sides move together.

Tests: an untouched area calling nobody; a redrawn one crossing the quarter and naming its own
home; damage summing across ведомости with the number of hulls that fired; the shield window
twenty seconds in six hundred; one pilot below the regeneration and eight above it; the hull
lasting about half an hour of that; and the crowd's weight quartered inside the area and untouched
outside it.

## 0.379.0 - M379: nine rites, one button each

The rites of §14 exist now, with counters that mean something and effects you can feel.

**Стройка века** takes material out of your hold and keeps «построено бортами: N» when it stands.
**Заём** takes credits and pays them back one and a half times if the campaign closed — or burns
them if it did not; the payout goes through the same funnel as every other income, so the house
and the cooperative see it. **Субботник** and **амнистия** make a system quieter for a сводка.
**Талоны** give one quarter-price tank per сводка, and the second tank the same сводка is at the
usual price. **Карантин** turns the picket back until the medicine arrives. **Перепись**,
**реформа**, **пропажа** and the **регата** carry their counters, and the regatta's button only
works where the regatta is — in «Ялте», where nobody shoots.

Every effect is **read from the ledger, not stored**: two players who pulled the same сводки see
the same rite at the same percentage, and nothing has to be synchronised or trusted. No ledger —
no rite, and the game plays on without one.

The Director announces them by the names §14 uses, three at a time, so the board never shows
everything at once.

Tests: ten rites each with a name, a goal and a kind of deed; an empty ledger giving an empty
counter and no effect at all; a ledger crossing the goal turning the effect on; and the coupon
working exactly once per сводка.

## 0.378.0 - M378: one vote, one signal, and not a single word typed

Two ways for a crowd to push the war, both on one button, both with nothing to type.

**Elections.** Once a month each power decides what it is doing next: «держать фронт» or «строить
и торговать», «добывать» or «связывать узлы», «пускать всех» or «только своих». The question and
its two answers come from the month's own seed, so they are the same for every player without
anything being stored or sent. One vote per account, counted by the server; the winner becomes a
**course** that shifts that power's move thresholds for the month. The crowd does not rule a power
— it pushes, and the push shows up on the map a сводка later.

**Сигнал сбора.** «Всем сказать в игре», with no chat and no message: three fields — a system, a
сводка, and that is all. One signal per account per day, an answer on one button, a counter
«ответили: 23» and a chip on the map with the number in it. This is the whole of gathering a fleet
for «Ревизия», and nothing more is needed for it.

Votes ride the same ведомость as deeds — there is no second channel, and there is no place in
either where a player could put a word.

Tests: the month's question stable, different per power and different next month; no ledger
meaning no result and no course at all; votes in a ledger producing a winner and that winner
becoming the course; and a rally row carrying nothing but a system, a сводка and a count.

## 0.377.0 - M377: what people leave behind, and the ones who did not make it

Death Stranding on the postcard's terms: **no names, no text, one way, no reply.** You do not
give — you **leave**. Whoever finds, finds.

A gun can be left from the hold, in flight, in the system you are standing in; it is gone from
your hold for good. Whoever comes later sees a container out in the dark and may take a **copy** —
one tier down, one affix erased. Nothing is transferred and nothing is duplicated: giving a good
thing away is a real loss, finding one is a real gift, and there is no way to farm either. Five
rows per system, three left per account per day, two finds per сводка, ten сводки before a row
dissolves; the server holds those numbers, because a number the client holds is a wish.

**Благодарность** is the only return channel in the whole game, and it is a **number**: one
button on a thing you found, one counter in the leaver's own book. It cannot carry a word, a
demand or a price.

**And the ghosts.** Where somebody's ship was lost, a hull stays — drawn by the same generator
everyone has, from a seed and a system number and nothing else, at a fifth of the alpha. There is
no position stream, no presence and no chat behind it. The one thing you learn is: here someone
did not make it.

`docs/DESIGN-online-risks.md` gains section G — why none of this can become a market, why a
hundred rows from one account weigh less than five accounts, and why the failure mode of the whole
wire is silence rather than damage.

Tests: the worn copy losing exactly one tier and one affix, a row's place computed from its own
seed so it is the same for everyone and stored nowhere, and a canister refusing to be «worn» at
all because it is not a part.

## 0.376.0 - M376: the war's ledger, and the one thing a client cannot be trusted with

Stage C opens: the war gets a wire. Not a simulation on a server — the chronicle is still
replayed on every client from the same seed, and the server is not told where the front is,
because it cannot be wrong about something it does not know. What travels is **what people did**.

**`site/war.php`** — one file, four ops, no database (the host is PHP 7.4 on shared hosting).
`pull` hands back the closed сводки after the one you hold, the open one and any циркуляры;
`put` files one deed — a defence, a tow, a crew taken off, fuel given — against a system and a
сводка; `vote` takes one vote per account per question; `hash` collects the chronicle hash each
client computed for the previous сводка. A сводка closes **lazily**: the first request that sees
the number has grown moves the open file under `flock`. There is no cron on purpose — a second
mechanism could disagree with the first, and nobody would know which was right.

**Saturation counts accounts, not rows.** A hundred entries from one player are one player: the
server stores short account hashes per cell and the client's pressure grows with their number
through the same 51-entry table the chronicle uses. Caps are per account per kind per сводка.
Nothing carries a name, a free-text string or an exchange between players — the postcard rule
holds here exactly as it holds for postcards.

**On the client**, `14b-war-net` pulls on load and on every jump, keeps the ledger in the same
`drift_war_v1` key beside the chronicle's cache (one key, one owner per field), takes the сводка
number from the server so a moved clock cannot move the war, and feeds the ledger into step 1 of
the replay: defence, clearing and building in a system pull that сводка's front roll toward its
owner — by at most a quarter. One system can be held for one сводка; the war cannot be turned.

**And the divergence log.** Every pull reports the client's own chronicle hash for the previous
сводка. The server counts who agreed with whom; `php war.php digest 7` over ssh prints the week
and names any сводка where clients disagreed. That is the only way a replay drift can ever be
seen, and now it is written down.

Tests: `91zzzw-chron` — the replay unchanged when there is no ledger at all (the wire is
optional), pressure that appears with a ledger and stays under a quarter, four hundred rows from
one account weighing less than five accounts, and the one storage key holding the chronicle cache,
the ledger and the clock offset without any of them overwriting the others. The deploy workflow
now lints `war.php` and smoke-tests `pull` after every release.

## 0.375.0 - M375: the tug is neutral to both sides by definition

Stage B closes with the role the whole layer was built to make possible: the one who does not
fight.

A battle between two powers leaves hulls of **both** sides — up to four, each with a crew still
aboard and an automatic signal on the air. Three deeds sit on the two buttons already under your
thumb: fuel to a ship below a third of its hull, the tow on ДЕЙСТВИЕ, the crew off on ЦЕЛЬ. Each
one writes an episode with **that** side, and towing one hull while taking the crew off the other
after the same battle leaves you with two episodes from two powers who were shooting at each other
an hour ago. That is the only way to be owed something by both, and it is the answer to «зачем
лететь» that the saga has been circling: not a soldier, a person with a ship who happened by.

Tests: `91zzzw-notebook` — two wrecks from one battle giving two episodes with two powers, and the
fuel given to a hurt hull counting as a deed with its side.

## 0.374.0 - M374: they remember deeds, not numbers

There is no reputation number, and now there is what replaces it: **episodes** — what you did,
where, when, and with whom.

**A deed needs a witness.** If none of their hulls survived inside your see range and the parrot
is not aboard, nothing happened — the galaxy does not have an omniscient scorekeeper. **A deed
travels**: three sectors a сводка, along the same lanes the rumours crawl. A picket two days away
has not heard yet; the same picket next week has. **At a place they take the heaviest episode that
reached it, never a sum.** Good and bad do not cancel: if both arrived, the hail says both — «тот
самый, который вытащил на тросе? но и стрелял по их борту. Лети, но мы смотрим».

**The notebook** holds twelve people, oldest pushed out, and each can be asked one thing per
сводка: fuel over the norm, or where the front stands. **«Не простил»** is the one thing nothing
overwrites: kill a person from your own notebook and they leave it for ever, and that is what
their side remembers about you from then on.

**And the doors these open.** The fourth clearance is no longer «not issued yet»: it is issued for
a heavy deed ГЛАВТРАССА knows about. A foreign shipyard sells you a hull once you have an episode
with that power — the gate M369b left as a stub is now answered by the notebook. And once per
power, for a heavy enough deed, they do not sell but **give**: a hull «со списания», with their
grammar and their story on the card.

Tests: new `91zzzw-notebook` — no witness means no episode, the notebook capped at twelve, travel
that arrives late and then arrives, the heaviest episode winning over the sum, good and bad in one
hail line, the clearance gate, the purchase gate, the gift once, and «не простил» surviving a
later good deed.

## 0.373.0 - M373: four rules instead of a reputation bar

There is no reputation number in this game and there will not be one. Instead there are four
rules, and they fit on one line: **a civil hull is not touched unless it fires on them, carries
munitions stamped by their enemy through their picket, docks at their enemy's military node where
a battle is on, or runs a blockade after being told to hold.**

**The hail** is the fleet's callsign generalised to all six powers: once per system per half-hour,
a picket asks who you are in its own words — Орднунг «Идентификация. Формуляр. Ожидайте»,
Рассвет «Заходи, брат, чинить есть что?» — and there are exactly three answers, none of them
typed: ДЕЙСТВИЕ says «проходом», ЦЕЛЬ says «по делу», and saying nothing is the third. Silence
once gets a warning on the air; silence twice and they are within their rights.

**The stamp.** A batch of missiles is stamped by the station that assembled it, and the lab's line
says so. Carrying a batch stamped by a power's enemy through that power's picket ends the
conversation immediately — that is the second rule, and it is the reason to look at the stamp
before flying through a front.

**The blockade.** On a front the answer «проходом» is not an answer: they tell you to hold. Keep
flying and the fourth rule applies. Anger is local — the ships that saw it shoot, and nothing is
written down anywhere yet; the memory that travels along the lanes arrives with M374.

Tests: `91zzzw-combat` — the hail firing once and not repeating, both answers, the warning and
then the fire on silence, a shot at a picket turning it hostile, the stamp mattering exactly when
the two powers are at war, and the blockade counting a departure as running it.

## 0.372.0 - M372: you jump in and the war is already happening

The chronicle knew whose system this is and where the front stands; now you can see it.

**In the rear** — a picket of the owner: two or three ships at the jump point, flying that
power's grammar, not interested in you. **On a front** — a battle already under way between the
owner and whoever it is at war with, up to eight hulls, both sides shooting each other through
the same loop that resolves your own fights. You are a civil hull under your own flag: nobody
touches you until you shoot, and the prompt says exactly that instead of counting eight
«преследуют» at a man who is being ignored. The battle is spawned at jump-in and never resumed,
so a hidden tab or a moved clock cannot make the war jump inside the frame.

**What is left over is yours to take.** A hull that loses its fight stays there, and it can go on
the tow line — the same path as the black derelict, ending at a shipyard.

**Occupation by a power.** For eight сводки after a flag changes, the station header says so,
prices are a quarter higher, and a third of your holding's output in that system goes to the new
owner — the buildings keep working, they are not confiscated. After that they are locals.

**«Ялта».** Six embassies at anchor, one per power, six workshops on one counter — the only place
that sells every power's iron, at twice the price — and not a shot fired: weapons are sealed
there.

Tests: `91zzzw-chron` — a picket in the rear that cannot be locked, the cap of eight on a front,
six embassies with six flags in «Ялта», the requisition multiplier and its absence outside the
chronicle's circle.

## 0.371.0 - M371: the Director, and six voices telling one сводка

The chronicle had events; now it has **pace**, and the war has a voice — six of them.

**The Director** (`12am-chron-director`) is not a plot and not a schedule: it is the thing that
makes sure the galaxy is never silent for more than four сводки, that a peak is followed by
relief, and that nothing runs away. Incidents (one сводка, one line) come from seven families and
never repeat a kind within ten сводки. Arcs run four to twenty сводки with stages and a
**guaranteed** ending — the twentieth сводка ends them whether or not the roll agrees. Rites are
announced three at a time (they do something from M379). Tension is an integer 0…1000 that rises
with wars and incidents and falls in quiet, with a real relief window: the first cut let the same
сводка's incidents refill it immediately, and a measured peak ran forty сводки instead of twelve.

**The season** — eight dials the regulator may set once a month — has a validator: a season with
an out-of-range tension, an unknown arc or no theme is not applied at all, and the month runs on
«автопилот» with a theme from its own seed.

**Six waves.** The same сводка now reads six ways. ГЛАВТРАССА opens every bulletin with «На
трассе спокойно» — including the ones where it lost a system; Компания sees a market opportunity;
Орднунг cites a paragraph; Коммуна writes an essay; Рассвет says it will be ready to repair;
Хай-Фронт apologises for the enemy's losses. The station board carries an ЭФИР block with the
tuned wave and a «ДРУГАЯ ВОЛНА» button, the receiver speaks that wave with its own rate and pitch,
and war lines ride the receiver the way every other rumour does — the war gets no screen of its
own, by design.

**On the map** the front is now a dotted line along the border between two powers actually at war,
not a stain over a region.

Tests: `91zzzw-chron` — half a year of сводки with the longest silence at four, no peak longer
than three days, no arc past twenty, all three kinds of event actually occurring; a bad season
ignored four different ways and a good one applied; and one event rendered in six voices giving
six different lines, with the receiver's knob cycling all six and refusing a wave that does not
exist.

## 0.370.0 - M370: the galaxy lives without you

Stage B's core. Six powers now trade, quarrel, go to war, sign truces and take systems from each
other — and not a single tick runs anywhere.

**The chronicle is a replay, not a simulation.** The state at сводка N is the result of replaying
сводки 0…N with a constant galaxy seed, so every client that replays the same history gets the
same galaxy byte for byte. Nothing runs on a server; nothing is stored in your save. The whole
thing lives in its own key, `drift_war_v1`, and even that is only a cache — lose it and the replay
from zero costs under a millisecond for a year of history.

**Three rules make that possible** (§16.3): integers only, fractions in permille; no exponent,
sine or power anywhere in the module — the saturation curve is a 51-entry table, because browsers
disagree on the last bits of floating point and a chronicle may not; and the сводка is six hours,
numbered from the chronicle's own epoch.

**The agents.** Each power has four needs (ore, goods, hulls, links), a strength, relations to the
other five, and one move per сводка — trade, quarrel, war, truce, alliance, build — chosen by what
it lacks, not by mood. Holding more systems costs more to feed, so expansion is not free; without
that, the first measured run went three hundred сводок without a single war. Fronts move along
borders, wars burn out in three days, and no power ever holds more than three quarters of the
circle. Over a measured year: 79 wars, 79 truces, 342 systems changing hands.

**«Ялта» never changes hands** — the limiters treat it as no one's, and a test walks fifteen
hundred сводок to prove it.

**On the map**, the ВЛАДЕНИЯ layer now carries an emblem chip per system and a red edge where the
front is standing this сводка.

Tests: `91zzzw-chron` — replaying twice gives the same hash, replaying from a cache equals
replaying from zero, the limiters hold over two thousand steps with no number leaving its range,
«Ялта» stays no one's, the chronicle never appears in the save, a lost cache changes nothing, and
two pinned fixture hashes are checked in both the Node and the browser tier — the same numbers in
two engines, which is the whole point. The module's own source is scanned for exp/sin/cos/pow.

## 0.369.2 - M369b: how a foreign thing is actually had

The maker layer stops being a look and becomes property (§19.3).

**A part now has a maker too** (§19.2). It gives three things and no more: the name in that
maker's typographic habit («PowerCore™ 400», «Typ 4/B», «двигатель «Éloise»», «двигатель, собран
из трёх», «ДВИ-4 v2.1»), a ±12 % lean of its own affixes toward its doctrine, and one line on the
опись card. Numbers stay inside the same tier — a maker is a bias, not a second tier. The compact
save writes `b` only when it is not ГЛАВТРАССА, so every part already in a hold reads unchanged
and the generation stays 2.

**A workshop stocks what its power makes** — with about a quarter brought in from elsewhere, which
is the only way to buy foreign iron without flying there.

**A foreign hull is not for sale.** A shipyard of another power wants an episode with it
(«разрешение на покупку»), and episodes do not exist until M374 — `hasEpisode()` asks for the real
function and answers false until it appears. So today a foreign hull is had by **tow**: the black
derelict in a far system can be put on the line, it rides in the save, and a shipyard restores it
for a price — after which it is yours, with the yard it came off still in its grammar. «Ялта» is
the one place that sells across the board, at twice the price.

**The fuse** is where two makers meet on one hull: the heavier parent gives the grammar, the other
is named on the card. And the picket notices: «На компанейском корпусе, а флаг наш? Записываю» —
the flag is a transponder, and it stays yours.

Tests: `91zzzx-maker` — the part's maker in the name, in the bias and through the pack/unpack
circle (and its absence for ГЛАВТРАССА), no foreign hull on any counter while episodes do not
exist, «Ялта» excepted, and the towed hull becoming a ship that remembers its yard while your flag
stays your own.

## 0.369.1 - M369a: the same grammar everywhere else

M369 put the maker on hulls; this pass hands the same table to the other four generators, which
was the whole point of the layer (D24: one grammar, five readers).

**Barges.** The body is built by the maker's profile law, painted with its ground and carries one
of its protrusions — and a Рассвет barge gets its weld seams, so it reads as three barges butted
together rather than one hull with steps. **Stations** get an assembly law instead of a paint job:
the same modules stand as ГЛАВТРАССА's rack around a drum, Орднунг's stack of equal blocks on one
axis, Коммуна's even ring, Рассвет's patchwork of unequal pieces, Хай-Фронт's single spine with
masts across it, Компания's big block with pods around. **Pirate hulls** show whose ship was
stolen: the maker's ground under the gang's paint, wear twice the factory norm, and the number
crossed out with a brush — a `deserter` has it painted over cleanly instead, the way one's own
side does it. **The fleet** carries `by` now and takes the ground and the flare from it; today
every wing is ГЛАВТРАССА's, and a foreign wing needs only that field set. **Domes** glow in the
ground of whoever built them.

**And the papers.** Six foreign books, one per power, each in its own typographic habit — a
ГЛАВТРАССА maintenance manual whose §9 says to keep operating the failed item, a PARTNER™ onboard
guide that tariffs the view out of the window, an Орднунг regulation on the form for filling in
forms, a Коммуна essay on why «по регламенту» is not an answer, a Рассвет master's «how to repair
what you do not have», and Хай-Фронт release notes that discontinued a feature yesterday. The
station header now carries the power's greeting and its accent colour, the cantina says what is
being served today, and kit found on a foreign station comes with that maker's brand.

Tests: `91zzzx-maker` — the barge's law and the seams, the station's assembly law per maker
(masts across the spine, the stack on one axis, the even ring), a station with no record still
getting a maker from the seed, six books that resolve to six powers, and a brand that appears on
foreign kit and never on your own.

## 0.369.0 - M369: every hull now has a maker, and you can see whose it is

Stage B of the war opens (`docs/DESIGN-war.md` §19.1, §19.4, §18). Until now a ship's generator
had one axis: the class — courier, hauler, frigate. Everything else was a seed. Now there is a
second axis across it: **who built it**. A courier of Орднунг and a courier of Коммуны are the
same class and different breeds, and the difference is a grammar of form, not a coat of paint.

**Eight dimensions per maker** (`03a-hull-maker`), and the first three must read as silhouette:
the profile law (ГЛАВТРАССА's ledges and box amidships, Компания's capsule, Орднунг's chamfers,
Коммуна's swan waist, Рассвет's butted modules, Хай-Фронт's spindle); the scheme set — which
airframes that maker will build at all; the signature protrusions that always stick out past the
outline (a tow hook, a fin with the logo, a turret plinth and a rib comb, a bowsprit and a
pennant, exposed tanks on welded braces, antenna masts longer than the hull). Then the joint
grammar — clamp, flush fairing, bolted flange, fillet, weld bead, or a dark gap where the part
floats a pixel off the plating; the surface — ground, stripe, gloss and a wear multiplier; the
marks and lights — a number and «изделие», a logo, stencils in three places, a name and a lit
window band, a hand-painted sun, one glyph and a version; the engine signature — flare colour,
width and trail length; and finally the bank and the engine's hum. That last one is deliberately
small: a maker changes how a ship lays into a turn and how it sounds, never the numbers the
player paid for.

**Nothing about the catalogue changes.** Every ship in `SHIPS` is ГЛАВТРАССА's, so the player's
own hull looks and sounds exactly as it did; the grammar shows up on strangers — pirate hulls,
unique hulls, everything generated from a seed. The hull cache is keyed by maker now, so the
same seed built by two makers is two ships and not whichever was drawn first.

**Is it actually readable?** `makerRead()` in `28y-look` answers with a number instead of an
opinion: it draws each hull into a small canvas and guesses the maker from the pixels — profile
samples, the jumps in it, the ink beyond the body, elongation, and the surface's warmth, value
and dark fraction — with centroids trained on held-out seeds. **92.4 % over 630 hulls**, worst
row 85.7 %. The stand is `python docs/shot.py maker` (a six-row overview) and `?by=<key>` for a
hundred hulls of one maker; almanac issue IV records the sheets and what they forced — the first
cut's bowsprit and antenna masts were long enough to read as scratches across the sheet.

**The six powers** (`12al-powers`) get their table from §7.1: where each comes from, what it
wants, how it fights, its emblem, its one line on the air and its hail at the approach. And the
flag is a transponder, not paint: fly a Коммуна hull all you like, your flag stays ГЛАВТРАССА's —
you were born here.

**«Ялта».** The one system everybody flies to and nobody shoots in. Its address comes from the
galaxy's own seed on the sixth ring, so it is the same for everyone and can be named out loud;
pirates never spawn there, weapons are sealed (the refusal says why), and the front will never
reach it. What is inside it comes with M372.

Tests: `91zzzx-maker` — the eight dimensions row by row, the catalogue being ГЛАВТРАССА's, a
maker that never drifts between calls, the cache telling two makers apart, geometry identical for
the same seed and maker, the profile law leaving ledges where the spindle leaves none, the scheme
filter, the class still reading first, the powers' table against `GUN_FAMILY`, the flag surviving
a foreign hull, and «Ялта»'s address, empty sky and sealed guns; `91j-art` — `makerRead()` above
90 % in the browser tier and over a hundred seeds per class in `-Full`.

## 0.368.0 - M368: a pirate's rank now has a loadout, and you can see it before he fires

The war's ninth pass (`docs/DESIGN-war.md` §5, §18). Rank used to be a habit and a number: the
шакал rushed, the барон stood, each with his own damage. What he was armed with was never asked,
and all four shot the same orange dots.

**The table of §5 is now code.** Шакал: two автопушки and an игольник, no field at all.
Ветеран: тяжёлое, автопушка, гарпун, a solid field. Капитан: лазер, сифон, импульсник,
помеховая and missiles, a frontal field. Барон: рельса, кассетник, зенитка, mines astern, a
pulsed field. The guns are not a pirate edition of anything: they are the same `GUN_FAMILY`
entries your own guns come from, run through the same `gunSpecMake` — so a baron's rail reaches
further than a jackal's autocannon for the same reason yours does.

**Nine habits now work from the other side.** The needle passes your field the way yours passes
theirs (and the hole in `playerHit` that ignored it is closed). The harpoon pulls **you** and
halves your way. The laser burns without a shell in the air, the siphon pours your field into
his, the импульсник drops it to zero for two seconds, and the captain's помеховая breaks your
lock outright — within six hundred of him nothing stays marked, by finger or by Tab. The baron's
rail hits instantly, his cluster shell comes apart halfway, and his mines wait astern in red.

**Зенитка and the launcher are handed out by loadout now, not by rank number.** M367 gave flak to
everyone from captain up; by the table it is the baron's, and the launcher is the captain's. The
baron no longer closes his burst with a missile.

**And it reads before the first shot.** The barrels are baked into the hull from the loadout: the
rail is a long thin tube, the cluster a short fat one, the captain carries a dish instead of a
barrel, the veteran a hook, the baron a mine rack facing astern. The bake is keyed by rank, so the
four ranks are four silhouettes rather than one.

`deserter` (§7) is set at spawn in occupied systems and read by nobody yet — the hull with the
painted-over number comes with M369a.

Tests: `91zzzw-combat` — the §5 table against the code row by row, every family resolving in the
common table, rail out-ranging autocannon, and each of the nine habits landing on the player: the
needle through the field, the harpoon pulling the ship, the laser with no shell in flight, the
siphon moving the field across, the impulse zeroing it, the jam clearing the marks and refusing a
new lock, the cluster splitting, the mine going off on you; plus the field type coming from the
rank on a real spawn, and the barrels differing by rank while fitting inside the bake.

## 0.367.0 - M367: five kinds of missile, and the launcher already knows which

The war's eighth pass (`docs/DESIGN-war.md` §4, §18). The launcher stays one part; what comes out
of it does not. The kind is taken from the launcher's own seed, so a launcher lying in the hold
already knows what it fires, and the опись card says so before you fit it.

**Обычная** — as it was: it knows the mark and leads it. **Роевая** — six small ones a press,
one to each mark you have taken, a third of the damage each; against a single ship it is worse
than a plain missile, against three it is not. **ЭМИ** — almost no damage at all: the field to
zero, no regrowth for two seconds, and the ship itself quiet for the same. **Торпеда** — slow,
dumb (it does not correct its course by a hair after launch) and three times the damage; it hits
what cannot dodge, and it is what a captain's flak shoots down first. **Ловушка** — no damage
and no target: it leaves at an angle to the nose and pulls foreign missiles onto itself.

**And the other side has the same rules.** From капитан up a pirate carries a launcher: his
missile leads you, your flak shoots it down, your ловушка takes it away. From rank two up he also
carries flak of his own — over missiles and plasma alike, the same rule your flak follows — which
is what finally makes the ловушка worth a slot: his flak does not care what it chases, yours does.

**Read off the trail.** All five used to be one white dot and one orange flame. Now the trail says
which: the torpedo is thick and long, the swarm small, the ЭМИ cold blue, the ловушка pale and
blinking — and a foe missile wears the red of a foe shot, because deciding whether to shoot it
down takes half a second and the colour is what you have.

Tests: `91zzzw-msl` — all five kinds fall out of launcher seeds, the swarm splits over the marks,
the ЭМИ empties the field and leaves the hull, the torpedo holds its course to the last decimal
over twenty frames, the ловушка leaves off the nose and takes a foreign missile's guidance, a
captain's missile reaches you, your flak kills it, his flak kills your torpedo and your plasma,
and neither flak ever fires at its own side.

## 0.366.0 - M366: the last six families, twenty named guns, and the reactor debt paid

The war's seventh pass (`docs/DESIGN-war.md` §2.1–§2.2, §18). Twenty families exist now, and
every one of them has code behind its line.

**Against a pack.** **Дуговик** M — a discharge that jumps to the nearest ship within two hundred
and again after that, losing half each jump and never striking the same hull twice. **Плазмомёт**
H — a slow fat blob: blast damage, splash on everyone within a hundred and twenty, and a close
burst breaks the mark's aim for a second. **Зенитка** L — fires by itself and only at what flies:
missiles and plasma; against a hull it is nearly nothing.

**And three that are not quite guns.** **Кассетник** H — a heavy shell that comes apart halfway to
the mark into five; it will never hit a point and will always hit a pack. **Гарпун** H — a tether:
the lighter ship is drawn to the heavier (mass is hull), the tethered one loses half its way, and
the line lets go on its own time or when the distance breaks it. **Таран** H — not a gun at all:
it thickens the bow by a third and turns a collision into damage by relative speed, four times
harder on the other ship than on you.

**Twenty именные.** A named gun is not «the same, only more» — it is a family wearing somebody
else's habit: «Маяк», a rail that pulls instead of piercing; «Вера», a laser that pours a field
instead of burning; «Кузнец», a heavy gun with a cluster warhead. Every habit already had code, so
not one line of that table is a promise without one. They drop only from barons, they carry their
story on the card instead of a factory, and they ride the save (`n` in the packed part — without
that, «Маяк» would come back from a load as an ordinary rail).

**The M362 debt is paid.** The tank moves off the reactor to the utility, jump range to the drive,
and the reactor finally gets what it should always have had: `enCapAdd` and `enRegenAdd`. This is
exactly the change that needed a generation — the affix entries are cloned, because `AFFIX2` is
built from the same objects and editing `kinds` in place would have rewritten the first generation
too. First-generation parts keep the tank and the jump on the reactor for ever, and the twenty
pinned seeds prove it.

Tests: `91zzzw-guns4` — the arc chain and its halving, the plasma's splash and broken aim, the
flak silent with nothing in the air and killing a missile with something in it, the cluster coming
apart halfway, the tether pulling the lighter ship and letting go, the ram doing damage by
collision and taking a quarter of it back, all twenty named guns resolving to a real family and a
real habit, a named gun surviving a save, a baron dropping one and a jackal not, and the affix
move being visible in the second generation and invisible in the first.

## 0.365.0 - M365: seven guns that do not break a hull

The war's sixth pass (`docs/DESIGN-war.md` §2.1, §18) — the roles «cut the shield» and «keep your
distance». Not one of these seven exists to lower a hull bar faster, and that is the point: they
change where you fly and what the other ship can still do.

**Cut the shield.** **Игольник** L — five needles a press, each with its own roll to pass the
field and sit straight in the hull; the ones that fail stick in the field, and against a bare hull
the whole gun is nearly useless. **Сифон** M — a beam that pours the mark's field into yours: no
damage at all, and the mark is left naked. **Импульсник** L — almost no damage; the field drops to
zero and stays down two seconds (it does not regrow while the counter runs), and a third of the
time it knocks something loose — the reverse of `instrKnock`. **Буровой луч** M — the mining drill
turned outward: the field is nothing to it, but it has to be used at arm's length, and it eats
iron from the hold instead of energy, so it belongs to anyone who digs.

**Keep your distance.** **Толкатель** L — a wave with no damage that shoves everything in its
cone: ships, and other people's shots. **Миномёт** — lays a mine behind you for a minute; the only
gun in the game that needs no mark, and it never touches your own. **Помеховая** L — does not
fire: inside six hundred, hostiles lose sight of you and half their shots go into empty space.

Cost written down where it is paid: the drill beam draws породу out of the hold and simply refuses
to start when there is none; the jammer and the pulse drink energy like a laser; the mortar arms
a second after it is laid, so nobody rides their own mine.

Tests: `91zzzw-guns3` — the needle passing and not passing a field, the siphon moving the field
without touching a hull, the pulse holding the field down while the counter runs, the drill
ignoring the field and refusing to fire without iron, the shove moving a ship and an incoming
shot without damage, the mine arming, splashing everyone near it and dying after its minute, and
the jammer blinding the near ship and not the far one. `91zzzw-guns2`'s coverage suite now counts
a mine or a blinding as «it fired» — the jammer fires nothing, and that is its habit, not its
absence.

## 0.364.0 - M364: seven gun families, and a generator that keeps its word

The war's fifth pass (`docs/DESIGN-war.md` §2.1–§2.2, §18) — the first seven of the twenty
families. Until now every gun was the same gun with different numbers.

**`PART_GEN` finally locks.** The constant existed so an already-issued part would not change when
the generator is edited — but `unpackPart` called `genPart(seed, tier, kind)` **without** the
generation, so a part from an old save was rebuilt by whatever generator was current. The promise
was there, the lock was not. `genPart` now takes the generation, `unpackPart` passes the saved
one, and twenty seeds taken from the first generation before this pass are pinned in
`91zzzw-guns` for ever. That is what made the rest of this pass safe.

**Seven families** (`05b-guns`, `13a-guns`), each a multiplier over the same seven numbers plus a
habit — the measured hit curve of M362 is kept, not replaced:
- **автопушка** L, turret — wide cone, quick lead, small damage, visible spread; the starter;
- **тяжёлое орудийное** M, hardpoint — rare, heavy, narrow cone, slow lead;
- **рельсотрон** H, hardpoint — instant, twice the range of an autocannon, six shots' worth of
  reactor each time, and it **pierces** to the next hull if the first came apart from that shot;
- **дробовик** M, turret — seven pellets on one press, a third of the range, ruinous at contact;
- **лазер** M — an instant beam on the mark, small damage often, and it **heats**;
- **тепловик** M — kinetic that heats, sharing the laser's counter;
- **наводящиеся пули** L — the shot bends toward the mark in flight.

**Heat, burning and silence.** One counter per ship. Past a threshold the target catches fire and
burns for seconds without you; past a higher one it overheats and **stops firing** — the seconds
that make a finisher worth carrying. Both are visible: a burning hull carries a flickering orange
line under its bar, an overheated one wears «ПЕРЕГРЕВ» instead of its name. The player's hull runs
the same counter — the matrix is one for everybody.

**A термический damage type** joins the matrix (hull ×1.15, shield ×.35): §2 has three types and
§2.1 says the laser is weak on shields, which the energy row is not. It is deliberately absent
from `DMG_KEYS` — first-generation guns pick their type by `%3`, and a fourth key there would have
changed every one of them.

**Завод and серия** on the card: «АП-23 «Оса» · завод «Красный Путиловец» · серия 1961». The
factory shifts damage, cooldown and spread; the family's own affixes (дальность, конус, наводка,
расход, жар, разброс, отдача) belong to **that** barrel, not to the whole loadout, and live only
in the second generation's affix pool.

Measured (`prof(80)`, phone layout 375×812 @2, on a machine also running another build): JS 4.1 ms
idle, 4.3–4.5 ms with eight armed ships and up to twenty-four beams on screen — the beam layer
costs a few tenths of a millisecond.

Two more wall-clock flakes fixed on the way, both of the same shape as 0.361.0's: the hostile-save
round trip compared manager clocks that `applySave` re-stamps on purpose (an accrual clock that
survived a load would pay for time the game was closed), and `resetWorld` did not reset the fields
M362–M364 added, so a suite that raised its own clearance left it to the next one.

## 0.363.0 - M363: a mount has a size and a habit, and a gun waits for a clearance

The war's fourth pass (`docs/DESIGN-war.md` §3, §11.4, §18). The points on the hull have existed
since parts did; until now they differed only by which kind went where.

**A mount knows two more things** (`05d-mounts`). **Size** L/M/H: heavy does not go into light,
light goes into heavy and is no gift — the place is taken and the numbers stayed light. A point's
size comes from the hull's mass and from where it sits: on a wing tip a mount is always one step
lighter than in the body. **Habit**: жёсткая or турель. A hardpoint looks along the nose — cone
halved, damage ×1.25, because the barrel rests in the frame instead of hanging on a drive; a
turret walks its whole cone. Points on the hull's axis are hardpoints, anything carried out to the
side is a turret, and the guard hull gets one hardpoint on a wing because that is what it is for.
Nothing of this is saved: like the points themselves, it is derived from the hull.

**More than one gun.** `stat().guns` now carries every fitted gun with its own seven numbers,
corrected by its mount; each has its own cooldown and its own barrel angle, and the barrel is
drawn on the hull turning with the lead — the loadout reads from the silhouette before the first
shot. Groups 1–3 («всё», «дальнее», «ближнее», split by range against the loadout's average): the
autofire picks the group the largest share of whose barrels actually reaches the mark, and stops
picking once you pin one at the dock.

**Three totals** on the card and in the опись, because seven numbers per gun cannot be compared in
the head: урон/с по корпусу, урон/с по щиту, урон на энергию — and the опись shows them as deltas
against what you are about to fit, like every other number there.

**Допуск instead of levels** (`05e-clearance`, §11.4). Four classes, and none of them grows by
itself. Find, carry, sell, leave anything; **mount** only within your clearance, and the rest lies
in the hold опечатано with a line saying what it waits for — the nearest unmet gate, not the
gate of its own class. II is the cooperative's exam plus ten kills; III is a hundred flight hours
(the five episodes across three powers arrive with M374); IV is honestly closed until M374/M380.
Flight hours are counted in real milliseconds and only in flight — at a station, time does not
pass. While the twenty families do not exist (M364–M366), a gun's class is read from its tier:
отменное waits for II, легендарное for III, everything else is I. What is already mounted stays
mounted: the rule arrived after the loadout, and taking it back would punish nobody's mistake.

**Стрельбище** (`24d-range`): every dock has a written-off target barge. «ПРОВЕРИТЬ» flies you out
for a minute and back, counting shots, hits and damage a second in the prompt and leaving the
report in the journal. The target is an ordinary record with a `dummy` flag — it knows nothing of
you, never fires and is never a kill, so the range needed no second combat loop.

Tests: `91zzzw-combat` gains five suites — mounts and sizes, the clearance gates and that a
clearance never falls, a gun going into a mount and being refused by size or seal with the reason
said out loud, the groups choosing themselves, and the range's minute end to end. The browser tier
caught two things the Node tier could not: a TDZ in `stat()` and a station screen left open by a
suite, which silenced the helm's mouse branch in the suites that followed.

## 0.362.0 - M362: a gun is a thing with seven numbers, and one bar feeds everything

The war's third pass (`docs/DESIGN-war.md` §2, §4, §18). A gun used to be two numbers — damage and
cooldown — so the whole fight was «keep the nose on him».

**Seven numbers** (`05c-arms`, `stat().gun`), all of them on the card, none hidden: урон and its
тип, откат, дальность, скорость снаряда, конус, скорость наводки, разброс. They come from the
fitted `gun` part's seed and tier, so two guns already differ without a new table (the twenty
families arrive in M364–M366 and replace this unfolding). The barrel now has its own angle: it
lives inside the cone around the nose and walks toward the lead at its own rate — you can no
longer swing the nose and have the gun follow instantly. The lead is honest, computed against the
target's velocity, and a miss is an **angle added to the shot**, visible in flight, not a hidden
roll: the error grows with range and with the target's angular speed. Measured hit curve for the
starting gun: 100 % at 200, 86 % at 400, 43 % at 600, 34 % at the limit — closing in is worth it,
and the numbers say so before you try.

**Damage types.** Kinetic: full to hull, half to shield. Energy: the reverse. Blast: even. One
matrix, and it is the same one that is used against you.

**Энергия — one bar** (§4), shown under hull and shield in the cabin. The reactor gives capacity
and regen (the `weapon` module level plus the fitted `core` part's tier). A shot, the shield's
regeneration and the thrusters all drink from it. Empty is not death: the gun's cooldown doubles,
the shield stops, the thrusters go to half. No venting, no overload. The shield also stopped
depending on «is anybody aware of me» — it now waits out a delay after **a hit**, which is what
the design asked for and what one distant jackal used to prevent for a whole fight.

**Three shield behaviours, not thirty numbers.** сплошной — even all round; лобовой — double in
front, nothing in the stern; импульсный — never grows, returns whole every twenty seconds. The
type is read from the part's own seed, so the field lying in your hold already has a character.
Ranked pirates carry shields too (ветеран .35 of hull, капитан .5, барон .7, шакал none) with the
same three behaviours, drawn as a thin blue thread over the hull bar — so where to hit is
something you see, not something you are told.

Not done here, and why: §4 also asks to move the tank and jump range off the reactor and give it
capacity and regen affixes. That is a `genPart` change — affixes are restored from a seed, so
changing a kind's affix set would silently rewrite parts every player already owns. It opens
`PART_GEN` 2, which is already queued for M364–M366.

Measured (`prof(80)`, phone layout 375×812 @2): JS 2.8–3.0 ms with nobody and with eight armed
ships alike — unchanged from M361 within the noise. `91zzzw-combat` grows three suites: energy
drain, regen and the empty rule; the damage matrix, the three shield behaviours and a лобовой
pirate dying twice as fast from behind; the seven numbers, the barrel walking inside its cone,
honest lead, and the hit curve against distance.

## 0.361.0 - M361: ships shoot each other, and rank is a way of fighting

The war's second pass (`docs/DESIGN-war.md` §5, §0 law 6, §18). Until now a shot was either mine
or somebody's, and every pirate flew the same way with different numbers.

**A shot has an owner** (`13-combat`). `fireShot` writes `owner` — player | pirate | fleet |
power:k later — and one loop resolves every pair of shot and hull, not just "my shot against a
stranger": pirates of different owners hit each other (deserters, the renegade), the escort of
ГЛАВТРАССА answers those who come within 900 of the caravan (`fleetFire`) and a pirate it
destroys carries no bounty, only a line. `s.mine` survives as the short "this one is the
player's" for drawing and for the barge. **Hit location:** by the angle between the shot's course
and the target's nose — ×1.6 into the stern, ×.7 into the bow, ×1 across. It pays to get behind
somebody; it pays for them too, and the same rule hits the player.

**Rank is behaviour, not a multiplier** (`13c-roles`). Шакал dashes in, empties a salvo and
breaks off, and opens the distance under 30 %; ветеран holds 400–600 and circles broadside;
капитан never comes under 700 and fires rarely and heavily; барон stands, fires in threes and at
half hull calls two шакалы — once. Under a quarter of its hull and with no ally within 1200 any
of them runs and jumps out in three or four seconds: the bounty is lost and the journal says so.
Measured bands (browser, 900 frames per role): шакал 39…889, ветеран settles at 480…660 from any
start, капитан 797…870, барон stands at 700 and fires 24 shots in fifteen seconds.

Two defects the measurement found and this pass fixes: the baron's long cooldown between bursts
was set *after* the "time to start a burst" check and therefore never applied — he fired without
a pause, 82 shots where there should be about 20; and the veteran's broadside push accumulated
frame after frame with nothing damping it, so he spiralled out to 1300 instead of holding
400–600. The radial correction now steers by closing speed and is scaled by distance, so he comes
into the band from either side and stays there.

**IFF and the ceiling.** Every ship record carries an `iff` flag; your crew's ships in the system
are `iff:true` and lock, autofire and forced fire all skip them. Eight armed strangers is the
ceiling (`ARMED_CAP`), it is applied at spawn and the baron's call cannot break it. The hull bar
and the name now stand over anyone who is aware of you or is taken as a mark — a pirate hanging
peacefully in the distance wears no label — and the primary mark's bar is wider.

Measured (`prof(60)`, phone layout 375×812 @2, system mode): JS 2.59 ms with nobody, 2.61 ms with
eight armed ships fighting and two marks taken, 2.81 ms with two live sticks on top. The whole
combat layer costs about two tenths of a millisecond — this is the number the rest of the war is
measured against from here on. Note for M362: eight aware ships destroy a standing, unshielded
ship in about fifty frames, which is what the energy and shield pass exists to answer.

New suite `tests/91zzzw-combat.js`: owner resolution in every direction, the fleet's fire and its
missing bounty, the rear and bow multipliers on both a pirate and the player, the distance band
of each role over 900 frames, the flee and the jump-out, the baron's single call, the cap and the
`iff` skip. `91e-rogue`, `91r-hunter`, `91z-missile`, `91n-barge` stay green, and so does the full
tier (222 s).

## 0.360.1 - M360a: the helm frame redone, and the wires M360 forgot

The author's phone shot of 0.360.0: «у меня только разочарование». The pass is the answer to that
frame, item by item, plus the two channels M360 declared and never connected.

- **The stick is not an instrument.** Two 82 px rings with an 11 px knob lay over the compass
  chips, МАСШТАБ, the receiver and the prompt, and read as two gauges painted over the world.
  A stick now says one thing — where and how hard the thumb pulls — and says it with a faint arc
  under the thumb: the arc's angle is the direction, its radius is the force, a 3 px dot is the
  finger. Everything at alpha .16–.30; the whole footprint is 51 px instead of 93 (`HELM_FOOT`,
  `helmStickShape`, `helmStickFoot` in `15a-helm`).
- **What was under the thumb steps aside, instead of arguing with it.** The compass chips and
  МАСШТАБ take the stick footprint into their edge inset (`drawSysHud`); the prompt rises by
  exactly enough to clear the finger and no more — `helmLift()` measures the DOM and writes
  `--helmlift`, capped at .22 of the screen, and it is measured from the unlifted position so the
  line cannot shiver frame to frame; the console (the receiver) steps back to .3 while a finger is
  on the glass (`body.helmstick`). The rail buttons and the pads do not move: you aim at those.
- **Two lines are two lines again.** On the phone `#msg` and `#prompt` carried
  `white-space:nowrap`, so `say("ГРАВИТАЦИОННЫЙ ЯКОРЬ\nдальше корабль не уходит\nкурс
  к звезде свободен")` came out as one edge-to-edge line ending in an ellipsis. Both are `pre-line` with a
  line clamp now (3 lines for the message, 2 for the prompt).
- **The combat hint tells the truth.** It still said «ОГОНЬ — ОТСТРЕЛИВАТЬСЯ» about a pad that no
  longer exists in the system mode. Now: «ЦЕЛЬ ИЛИ ТЫЧОК ПО КОРПУСУ — ЗАХВАТ» under a thumb,
  «TAB ИЛИ ЩЕЛЧОК ПО КОРПУСУ — ЗАХВАТ» under a hand, «ЦЕЛЬ ВЗЯТА · ОГОНЬ САМ» once a mark is
  taken — and the count of pursuers moves to its own second line.
- **The hull bar stands above the lock bracket.** The bar sat at y−26 and the bracket's top edge
  landed on it: the one number the bracket exists to frame was hidden (`helmMarkTop`).
- **The two dead channels.** `HELM_CONE` and `HELM_RANGE` had no reader and `G.ctl.fire`/`.msl`
  had no consumer: the gun only ever fired on `keys.fire`, so the promised autofire on the mark
  did not exist and the mouse scheme's LMB and RMB did nothing. Both ends are joined in
  `updateCombat` now — forced fire along the nose from LMB, F or the ОГОНЬ pad, and fire by itself
  while the primary mark is inside ±20° and 760. The suite `91zzzw-helm` had been red in the
  browser tier since 0.360.0 for exactly this; it is green.

Measured (`prof(60)`, phone layout 375×812 @2): JS 2.0 ms with no stick, 2.7 ms with two live —
the old two-ring drawing cost the same, so the win here is the frame, not the budget. New guards:
`91zzx-mobile` gets the stick footprint against the prompt and the compass chips and the line-break
check for both hint rows; `91zzzw-helm` gets the cone, the range, LMB and RMB.

## 0.360.0 - M360: the helm — four channels, three inputs, no inertia

The war's first pass (`docs/DESIGN-war.md` §1, §18, §20). `15a-helm` writes `G.ctl = {head, turn,
tx, ty, brake, fire, msl, headIdle}` from two floating sticks (phone: left half = heading, right
half = thrust in screen axes, dead zone 12 px, fade on release), the mouse scheme (nose to cursor,
WASD in screen axes, LMB held = forced fire, RMB = missile, Shift = thrusters only) and the arrows
scheme (← → turn, ↑ thrust, ↓ reverse, Q/E strafe); last used wins. Only the system mode reads it
(D08); belt, landing, scoop and the rest keep `keys`, and `keys.*` from the pads is translated into
the same channels in one place. Angular inertia is gone: the nose follows the wanted heading at
`st.turn`, no ramp, no coast; the bank is drawn from the actual turn rate. Thrust is a vector:
full along the nose, .4 through thrusters sideways and back, and the velocity-to-nose drift is off
while thrusters work. Release below `.55·maxSp` brakes as ТОРМОЗ does; above it coasts. Marks:
tap/click a hull within 40 px, Tab or the ЦЕЛЬ pad cycles the nearest aware hostile, Esc or a tap
on empty sky clears, up to three, the shooter auto-locks when nothing is locked; the nose tracks the
primary mark only while heading input is idle (D07). The gun fires by itself when the mark is
inside ±20° and 760 (provisional, M362), forced fire along the nose stays; `placeNote("hurt")` once
per engagement (D16). The missile goes to the primary mark. The system-mode pad row is ЦЕЛЬ ·
ДЕЙСТВИЕ · РАКЕТА (◀ ▶ ▲ ТОРМОЗ ОГОНЬ leave it; other modes untouched); the pad-row key now
includes the mode, and the HUD floor is re-measured after the row changes (the map's footer read a
stale floor for one frame). Two-finger pinch in the system mode is given to the sticks; zoom stays
on the rail buttons. Deviations from the brief, decided here: Space stays ДЕЙСТВИЕ (docking is the
common case; forced fire is F / ОГОНЬ / LMB), and the helm's raw key layer does not follow the
rebinding table (`G.opts.keys`) — the pads and the old `keys` path still do. New suite
`91zzzw-helm`; `91zzx-mobile` and `91a-flight` updated (the 20 px tap test placed the planet off a
phone's frame — pre-existing). Also fixed from the full tier's red: buying a hull, a module, a
part or the recorder drum re-checks the wallet at click time (the button was disabled at render
only, and a second tap took the wallet below zero).

---
## 0.359.3 - the tests, revised: they now test what ships, and they say when they are not looking

Author, after 0.359.0: «у нас игра не запускалась, а у тебя тесты все зелёные — полная ревизия».
The suite was green on a file that never shipped; the file that shipped was never opened by
anything. Five changes, and two things the new order found at once: the lake suite left
`type="terran"` on a cached planet and the seed suite read it forty suites later (resetWorld
now clears `SYS_CACHE`), and `bargePax` survived every reset.

1. **The shipped file is tested, and the site is asked afterwards.** `deploy.yml` runs the full
   suite on the runner's own build (headless Chrome, `tests.html?full=1`) and refuses to publish
   on red; after the upload it fetches `play.html` back, compares it byte for byte with the build,
   loads the live URL and requires `data-alive="<VER>"` on the root. `deploy.ps1` does the byte
   comparison too. 0.359.0 «matched by version» — and was a different glue.
2. **The first suite is «игра запустилась сама».** `28-loop` stamps `data-alive=VER` on the
   document after thirty real `requestAnimationFrame` frames with the frame guard at zero;
   `99-run` waits for that stamp (up to eight seconds) instead of 60 ms, and the first suite
   asserts it: frames ran by themselves, no crash, nothing shipped to the server. A build that
   dies on load or whose loop is dead is red with a report, not «no report in DOM».
3. **Nothing passes silently any more.** 23 suites said `ok(true,"…в этой сборке нет — пропуск")`
   when a function was missing — the exact «perk without code» lie, green forever after a rename;
   they now fail. 30 suites left with a bare `if(!x)return;` when a fixture was not found; `ok()`
   now returns its verdict and those read `if(!ok(x,"нашлось: x"))return;` — a missing fixture is
   a red line.
4. **Rollback and preview.** The previous `play.html` stays on the site as `play.prev.html`;
   if the live check after an upload fails, the runner puts it back. Pushes to any branch other
   than `main` go through the same build and full suite and land on `dev.html` only — the
   preview to look at on a phone before merging (`docs/DEPLOY.md`).
5. **Three tiers, and no Chrome for the everyday run.** Author, 06.09: «в разработке никто хром
   не запускает», «быстрый — 20 с». Node 22 is now on the machine (portable zip in
   `C:\Claude	ools
ode`, outside the repo); `test-node.js` runs the page's own scripts under
   DOM and canvas stubs and executes the 325 «формулы и данные» suites in ~5 s, then `test.ps1`
   adds one Chrome smoke (page boots, frame runs, guard silent): under ten seconds per edit.
   `-Browser` is picture and interface in Chrome (~30 s), `-Full` everything (~4 min) on request.
   The runner does Node plus the smoke. The DOM report in Chrome is now head and failures only —
   fourteen thousand ✓ lines weighed 8 MB and cost more to serialise than the suites did to run.
6. **Two tiers, measured.** Measured: thirty suites take 235 of 254 s, the other six hundred fifteen
   seconds together. Deleting the small ones would save nothing; the big ones are the nets that
   found the freeze, the leaks and the money printer. So `test.ps1` runs the fast tier by default
   (~25 s) and `-Full` (and the runner) runs everything; the head line says which.

---
## 0.359.2 - the parrot on the perch, where rockets come from, and the doors matrix folded in half

Two things the author saw on the phone within a minute of 0.359.1 coming back up, and one
thing the timing pass saw. **The perch icon drew the parrot crooked** — `27j-console` handed
the 44 px `#perchcv` to `parrotDraw`, which lays out the whole 230×304 window scene from its
own centre: at icon size the head went past the top edge and the body sat 4 px right, in a
1× canvas on a 2× screen. Now the icon places the bird's box [19..208]×[43..303] into the
canvas with an 8% margin, at device density, and does not show the hang act (it takes the
bird out of frame). Measured on the dev stand: box 19..71 × 5..81 in 88 px, centred. Guard:
`91f-ui` «жёрдочка: птица в иконке целиком» — nothing touches an edge, height at least half.

**«РАКЕТА 0» and nowhere to read where rockets come from.** They are not bought: the ЛАБОРАТОРИЯ
tab at a station assembles a batch (`16b-missile`, `ammoRow`). The refusal on the button said
only «РАКЕТ В ТРЮМЕ НЕТ»; it now says «РАКЕТ НЕТ · ПАРТИЯ — В ЛАБОРАТОРИИ СТАНЦИИ», and
`91z-missile` checks the refusal names the place.

**The suite timed** (harness: per-suite `performance.now`, printed as «САМЫЕ ДОЛГИЕ» when the
clock runs — in the pane, not under `--virtual-time-budget`). 254 s in the pane: one suite, the
doors matrix, took 77 s, its twin (the save round trip over the same cells) 14 s more, and the
next ten together another 100 s; the remaining 600 suites are noise. The twin is folded into
the first loop — every cell now does frame check, save round trip and the way back in one
scene set-up — and the cell draws twice instead of three times. No assertion was dropped.

**The pane run also showed 18 red that headless does not** — every one an environment
artefact: cloud/wall suites need a network, the receivers read the wall clock (night band),
«руки» needs rAF, which a hidden pane never runs. That is not the suite's fault, but it is a
reason to keep reading results from `test.ps1` only.

---
## 0.359.1 - the site was down for 25 minutes: module order differed between the two builders

`0.359.0` reached drift-game.ru through GitHub Actions and died on load with «Cannot access
WANDER_CAT before initialization» (play.html:29112). The cause was not the code but the glue:
`build.ps1` sorted `src/*.js` with `Sort-Object Name`, which is culture-aware — on Windows it put
`12v-wander-shop.js` before `12v-wander-shop-cosm.js`, on the ubuntu runner the other way round,
so the cosmetics catalogue pushed into a `const` that did not exist yet, the one big script
stopped there, and the game showed the title screen over a dead loop. Worse, the new error
logger lived at the end of the glue and never got born: the site was down and `crash.log`
stayed empty. Author, 23:10: «мне кажется все упало».

Three fixes. The build sorts by bytes (`Sort-Ordinal`, `CompareOrdinal`), identical on both
machines; two modules are renamed so the byte order is the dependency order —
`12v-wander-shop-cosm` → `12va-wander-cosm`, `21b-surface-deco-biomes` → `21bb-deco-biomes`
(`DECO_KINDS` had the same trap, caught by the ordinal build before it shipped). The logger moved
to `01a-crashlog.js`, right after `VER`, with no dependencies: `error` and `unhandledrejection`
are hooked before any module can throw, so a build that dies on load now reports itself as
`outside` with file:line. And the deploy workflow opens `tests.html` in headless Chrome and
refuses to publish if the console shows an `Uncaught` — the exact check that would have stopped
0.359.0. Verified end to end: an error thrown on the live page landed in `~/drift-data/crash.log`
with version, mode and stack.

---
## 0.359.0 - every error goes to the server (author, 2026-09-05: «пиши на сервер лог, все ошибки, любые»)

The author's freeze never got a cause because its only evidence, the «СБОЙ · …» line, lives on a
screen somebody closes. Now everything that looks like an error leaves the page: frame crashes and
out-of-frame errors, unhandled rejections, a frame stall over two seconds (tab visible), console.error
and console.warn, «warn» journal lines, a failed cloud call, a resource that did not load, and a dead
localStorage. Each row carries the version, mode, uptime, window, browser, up to eight stack lines of our
own code and the last six journal lines; never a character the player typed. Receiver is the new
`site/log.php` (api.php untouched), appending JSON lines to `~/drift-data/crash.log`, 5 MB then rotated,
300 rows per address per day. Client side: the same line goes at most once a minute with a repeat count,
eighty rows per page load, nothing from `file:` or the test stand. Read with
`ssh drift 'tail -n 50 ~/drift-data/crash.log'`. Suite in `91zzzzzn-doors`.

## 0.358.0 - bug hunt 2026-09-05: what 115 scanners found and a hand check kept

A fan of Haiku scans over the whole repo (167 raw findings), Sonnet verification for a third of them,
then a hand pass over the rest; the full verdict list is docs/BUGHUNT-2026-09-05.md. Real fixes:

- `instrKnock` was declared inside `instrWearRu`, so the pirate hit never found it: the M127
  "hit knocks out a gauge socket" mechanic had been dead since it was written.
- `G.soldTotal` was never saved or restored: the coop exam turnover reset on every reload.
- The "ВАША БАЗА" mark on the surface looked up bases by the system key while bases are stored
  by system-and-planet key; the mark never appeared.
- Winter: fault lamps were drawn at one set of offsets and hit-tested at another; taps missed.
- Wanderer: the snow behind the ceiling window sat on one line (sign error in the row spread).
- Misclosure figure: strips saved before the `mis` field existed produced NaN; now normalised on load.
- Parrot: the poke handler ignored the hang translate (game, site and the cage page), and the
  cage page scaled clicks by 272 where drawing used 304.
- site/api.php inbox: a brace-less `foreach … if` appended only the last card; several incoming
  cards lost all but one.
- treplo3d: render targets were recreated on every resize without deleting the old ones.
- deploy.ps1 / dev.ps1 now stop when the child build fails instead of shipping a stale drift.html;
  lookrun.ps1 stops the Edge probe too; stand.ps1 escapes the dot in the legacy-upload regex;
  mkview.ps1 loses an unreachable second `hold` branch; prof() knows winter and spa.
- Twelve test assertions that could not fail (`||true`, self-comparison, `?true:true`, `ok(true)`,
  first-three instead of last-three) now assert something; one new suite guards the save fixes.

## 0.357.0 - M359: the evidence, the hands and the things that must not double

Hunting alongside the parallel session (which took the picture and the frame's bakes), this is the
state-and-rules half: five nets, and one change to the frame guard that may be the reason the
author's freeze has never left a trace.

**The guard stopped talking** (`28-loop`). By design the same crash is announced ONCE — a repeat
only counts, so the message does not become a wall. But a freeze is exactly a crash that repeats
every frame: the on-screen line fades in two seconds, the journal keeps a single row, and a minute
later the game that is standing still has nothing to say about it. That is the missing evidence
PLAN has been asking for. Now a repeat still stays quiet, but every fifteen seconds it reminds and
names the count («СБОЙ · … · повторяется · 240 раз»), in the journal too. The contract is pinned by
a suite: a hundred repeats in the same second say nothing, sixteen seconds later one reminder with
a number.

**The hands let go** (`91zzzzzq-input`). Input had no suite at all — and it is the layer where a
bug looks like the game going mad rather than breaking: a stuck key burns fuel while you read mail
in another window. Focus lost and tab hidden release every key; a finger that leaves a pad
(pointercancel/pointerleave) releases it; and the action EDGE lives exactly one frame across a
whole hold — measured on the real frame, because that is where the law lives (with `hasFocus`
stubbed: in headless the frame releases the keys itself, and without the stub the test measures
the guard instead of the edge).

**The cloud does not eat the evening** (`91zzzzzr-cloud`). `14a-cloud` promises in a comment that
boot only stores the record that is NEWER. Nobody checked. Now: an older cloud record never
replaces a fresher local one, a newer one is taken, and ten malformed answers (null, {}, save
null/0/"строка"/[], a string ts, «нужен вход») leave the local record exactly as it was. Both
suites drive a synchronous stand-in for the cloud, because a promise's `.then` runs after the
report is built — the first version of this file passed without checking anything.

**Every promise has a closer** (`91zzzzzs-quests`). The journal of deeds rests on «a deed is closed
by the code that performs it, not by a timer» — so every kind of deed must HAVE that code, or it
is a line in the journal for ever with an eternal «срок вышел». The source is read for every key
that opens a deed against every key that closes one (including keys held in a variable). Plus:
deeds do not double, the journal keeps its cap, every open deed has an address or an honest
«адреса нет», and an expired deadline is words, not a negative number.

**Things do not double** (`91zzzzzt-opis`). Ten rounds of every part into its slot and back: the
census of the hold must be identical, a part is never both listed and fitted, scrapping takes it
out once and pays once, and «за борт» throws exactly what was named — while a tap on people says
why it will not.

## 0.356.0 - M358: what the frame bakes, and how much raster it holds

Hunting the author's freeze together with the parallel session, which took state and rules and left
the picture to this lane. Three suspects were already closed: state lists do not grow (M329), the
document does not grow (M332), the raster in `SYS_CACHE` sits on a shelf (M332). The fourth had
never been measured at all — **the raster of the live frame**: ground chunks, far-ridge tiles, cave
tiles, screen layers. None of it lives in `SYS_CACHE`; all of it hangs on `G`, so the evening-of-jumps
suite walked straight past it.

`tests/91zzzzy-bake` measures work instead of time (inside the page the clock is stopped by
`--virtual-time-budget`, so time cannot be measured there at all) and holds two different failures:

**The oven running every frame.** A layer or chunk key that catches a continuously changing value —
the hour, weather power, an unrounded camera — misses on every frame: the game bakes a full-screen
canvas sixty times a second and throws it away. Neither memory nor the console says a word; only a
count of what was baked does. Standing still the game is allowed a handful over 150 frames (it bakes
7 — the hour moving the air mix, which is right); walking is allowed to bake by **distance**, since
new ground is new ground.

**The level, not the leak.** Measured in a 1248x641 window at DPR 1, the surface after a walk holds
**26.7 screenfuls** of raster — about 85 MB — and each store holds roughly twice what the frame
draws (farA 10 tiles against 6 drawn, farB 16 against 8, the terrain 6 against 3). That margin is
what keeps the camera from re-baking, so it is not a bug to be quietly cut; but it is also not a
number anybody was watching, and it grows as the square of `DPR*SCK`. The guard is set in screenfuls
rather than megabytes, because megabytes mean nothing across screens: it is the same picture on a
retina, and four times the memory.

Nothing is growing without bound, so the freeze is not here — that is the finding, and now it stays
true by assertion rather than by hope.

---
## 0.355.0 - M357: hunting by search, not by list

Author: «ищи ещё баги, как хочешь ищи». Four nets, and this time the method is different: not a
list of cases someone thought of, but properties that must hold for ANY sequence of legal play.

**The wallet has no holes** (`91zzzzzm`). Splitting a deal must not beat doing it whole — selling
twenty one at a time against twenty at once, and buying the same both ways, across six goods; a
buy-and-sell round at one counter must lose money on every station in the settled galaxy (forty
stations × every good); and — the real hunt — six hundred RANDOM sequences of ordinary actions
(buy, sell, scrap, fit, unfit, refuel, repair, locker in and out) with the CLOCK STOPPED, so no
income exists anywhere, while the player's worth is priced at that station's own prices. It may
not grow. It didn't.

**The door matrix** (`91zzzzzn`). PLAN has carried «the author's freeze has no cause yet» for
weeks. `stepWorld` dispatches modes in PAIRS («dig AND G.dig»), so a mode whose state object is
missing does not crash — it stops doing anything at all: no update, no draw, no response, and
nothing in the console. That is exactly what a freeze looks like. So: every scene × every door
(landing, surface, mine, cave, belt, scoop, base, home, wintering, sanatorium, take-off, map,
station) — over a hundred cells, each checked three ways: mode and state agree, the frame lives
for a dozen ticks, and the way back leaves the world whole. Plus a save taken ON the threshold of
every door, read back and stepped. No half-open state anywhere; the freeze is not here.

**Russian numbers** (`91zzzzzo`). `pl3` is checked across the whole hundred including 11–14 and
111–114, and then the game's own text is read: the journal from a run through every scene plus
every board of the desk and the station, and each «number + word» pair is sorted by numeral class.
One word form may not stand after both «1» and «5» — that is disagreement, found without a
dictionary. Oblique cases, stat deltas («+21 бак») and mass nouns are excluded, with reasons.

**The contract** (`91zzzzzp`). The numbers the design rests on are now guarded against silent
drift: `CREW_YIELD` 0.85 («a hired hand is a bet, not an income stream»), the locker's 1 %/day and
thirty-day lapse, the cooperative's 12 000 exam and 1 500 stamp, the counter's 1.06 spread, the
drone-miner's 9 000, the rank caps 60/150/none. Each line names the document it comes from, so a
deliberate rebalance turns red once and asks for PLAN.md to be updated with it.

Nothing found: the economy is tight, the doors are clean, the numbers agree. That is the report.

## 0.354.0 - M355: does the button do what it says

Author: «тесты на логику, каких никогда не делали: действие и ожидаемое поведение — верное
или нет; не «экран открылся», а зачем этот экран, что на нём можно и ради чего». Fourteen
suites in four files, and every one of them asks a question no assertion in this project has
ever asked: not whether a control WORKS, but whether it TELLS THE TRUTH.

**The button does what is written on it** (`91zzzzzi`). Three contracts across every screen at
once: the verb is kept (a sale puts money in the till or takes cargo out of the hold; refuelling
raises the tank; hiring adds a person), the price on the button is the price charged («6 016 кр»,
«30 дан», «НАНЯТЬ · 2 534 кр» — parsed off the label and compared with the actual delta), and
every tap leaves a trace: the world moved, the screen redrew, or the game said something. A tap
that does nothing at all is the rudest answer an interface can give, and nothing was watching for
it. It found one: at the counter «ВЗЯТЬ ВСЁ» with an empty till did exactly nothing and said
nothing, while its own neighbour «ВЗЯТЬ ×N» two lines above refused out loud. Fixed.

**Zachem** (`91zzzzzj`). The instruments show the world and not something of their own (dial and
bar against `stat()`, in flight, at zero, on the ground; the suit gauge only where the suit leaks);
every module level pays what its line promises (engine → thrust, tank → fuel, hold → cargo…, one
hand-written table of what pays what); no technology is a signature without code — half of them
change a number in `stat()`, the rest are read by name in the source, and `lab` is read through a
data field (`needTech`), which counts; the prompt's promise is executed — in every scene where the
prompt says «ДЕЙСТВИЕ — …», pressing it moves the world or explains the refusal (holding, where the
prompt asks to hold); and the scoop fills the hold, because that is what it is for.

**Fairness of the deal** (`91zzzzzk`). The yard hands over the hull you tapped (six purchases, each
verified by name); no hull is dearer than another and worse in every number, which would be a trap
for a newcomer who reads price as quality; every module level costs more than the one below it; and
the game takes no money silently — four days of the clock jumped forward over every lazy ticker,
and each charge must leave a line in the journal.

**A closed door names itself** (`91zzzzzl`). Hiring without a cooperative, the counter without a
stamp, take-off without fuel: the refusal must name the CAUSE, not the fact — and take-off without
fuel is the evacuation (M19), which must name its price. Every disabled button is explained by the
row it sits in (a price, a threshold, «ИЗУЧЕНО», «В РЕЙСЕ»). And the rate is honest: refuelling and
repair charge exactly the advertised price per unit, a full tank takes no money, and a pauper is
told why.

Two more things came out of the run. `planetSpin` fell back to **the wall clock** when `G.t` was 0,
so a staged scene came out different every time and the light and frame-ledger suites flickered on
«заход»; the world's clock is now used whenever there is a world. And one law was written down
after it bit the test itself: in JavaScript a word boundary does not work next to Cyrillic — the
engine does not count Russian letters as word characters — so `/кр/` never matches «−17 кр». A
suite now reads the whole source and holds that nowhere in the game.

## 0.353.0 - M356: the sky in storeys

Author, 2026-09-05, with a photograph of a Petersburg sky: «вот тебе облака, для планет, делай».
The picture holds three cloud populations at once — a dark overcast **deck** across the top third,
a wide blue gap, and a chain of small bright cumulus strung along the roofline. The game had two of
those and neither of them read: the sky was one storey with stickers on it.

**The deck** (`19e-clouds`, `deckSprite`). A third form, and it is not drawn as a body: a layer
straight overhead is seen edge-on, it has no silhouette at all — it has a torn lower edge and a
mass that runs off the top of the frame. So the noise is stretched along the horizon, the threshold
rises downward (solid above, rags below), and a slow wave along the width makes the edge hang low in
places and pull right up in others. Its underside is painted by the air, not by the star: dark and
cold, which is what makes it the counter-mass the bright cumulus were missing (§12). Sheets are laid
overlapping with their ends faded out, so they break into pieces without a seam. How often a world
is lidded is a property of the world (`cover` in `CLOUD_KIND`, mixed through `CLOUD_KEYS`) — over a
third of them it never gathers, and the sky stays roomy (§3) — and bad weather raises one over
anybody: rain used to fall out of clear blue. Baked lazily, on the first frame that has one.

**One condensation line per tier.** The flat base is baked into every cumulus and was then thrown
away on the sky: height scattered over an eighth of the dome, and ten flat bottoms at ten levels
read as ten stickers. A sprite now sits with its base **on** the tier's line, with a jitter small
enough to be air rather than a staircase.

**The cumulus body, rebuilt.** Bodies sat on one string and narrowed at the ends, so the base curved
up and the thing read as a croissant; the metaballs were spaced further apart than they merge, so a
sharper edge turned them into beads. Now: a wide base row whose step is computed **from** the radii
(bodies must merge, not touch), turrets growing over the middle of that row, a sprite baked at
288×168 so the near tier is no longer a magnified blur, and an edge that is cut rather than blurred.

**Volume comes from the body, not from the outline.** Light by density gradient lives only at the
rim; the middle of a cloud had no gradient and came out one flat colour. Four samples along the
direction of the star say how much cloud lies between a point and the light — that is the volume,
and it costs four lookups of a field that is already there.

**Three ways the sky was outshining its own star**, all found by `91zzzzy-light`'s frame guard and
all the same law (§13, §16): the silver rim added *on top of* the M330 ceiling; the shadow side was
mixed from the air and, under a dim star with a bright sky, came out **lighter than the lit side** —
the cloud inside out; and the body reached full light over large areas, so the eye read the cloud as
the source and the small disc as a reflection. Now the rim rises **to** full light and no further,
the shadow is capped at .45 of it (which is also what gives a cumulus its volume), and the body
stops at .80 — a cloud surface scatters light, it does not return all of it.

Also: the horizon chain (sixteen small ones, clumped rather than scattered), the near tier down from
1.95× to 1.55×, and `test.ps1` waits for Chrome to let go of its output file — on a full run a
child process held it for seconds after `-Wait` returned, and the harness reported «the page crashed
before runTests» for a run that was green.

---
## 0.352.0 - Deep tests: a corrupted save, a clock that moved, a button under a panel

Author: «пиши глубокие тесты, все кликай, по интерфейсам, по логике, ищи баги». Twenty-six new
suites in eight files, each one a class of defect nothing was asking about, and four real bugs
out of them — three of which no assertion could ever have caught, because the page they were
measuring was invisible.

**The corrupted save** (`91zzzzza`). The cross-cutting net already loads a save with a field
missing — that is last version's save. This one puts the field back with the WRONG TYPE, one
field at a time, three shapes each: over four hundred loads. Two of them died: `found` and
`species` as an object instead of a list threw «object is not iterable» straight out of
`applySave`, i.e. a white screen for anyone whose local record aged badly; `zoom` as an object
walked into `G.zoom` and stayed there. Both now load. Two more suites in the same file: every
number arriving as a string (PHP can, and `site/api.php` is PHP), and the save→load→save circle
standing still from the second lap — a field that grows on every load is a save that swells.

**The clock that moved** (`91zzzzzb`). Half the world is computed lazily from `Date.now()`:
drones, hired hands, the locker, building, the station's shift. The old net shifted the stamps
INSIDE a save by three days; this one shifts the CLOCK — back three days (a phone's timezone
fixed), forward five years (a laptop woken up), and a save stamped a year ahead. Twenty-four
tickers, run differentially, nothing pays, nothing prints, nothing turns into NaN. Green from the
first run: the offline caps hold.

**The button under the panel** (`91zzzzzg`). Everything that clicks in the tests calls
`el.click()` — and that is not a tap: it hits the node directly, past hit-testing, so a control
buried under a panel answers it happily while the player's finger gets nothing. This suite asks
the browser instead: `elementFromPoint` at each control's centre, in every scene and on every
screen, scrolling the row into view first. It found the «Сорока» panel on a phone: `width:
calc(100vw - 16px)` at z-index 6 over a rail at 5 — aboard the sail-ship, КАРТА and МЕНЮ could
not be pressed at all. The panel now ends where the rail begins, off the same `--railw` the frame
measures. The map's prompt had the same disease in a milder form: a hardcoded `right:128px`
against a rail that is 129 wide on the map, one pixel under it.

**And the reason three suites were lying green.** «В ДОРОГУ» is an ordinary button, so every
sweep that clicks everything eventually enters the road companion — and `body.road` hides the
whole page but its own window. `resetWorld` did not leave it, so from that click on, every later
suite measured an invisible page: layout guards passed because there was nothing to measure, and
one of the new suites reported «0 controls measured» instead of failing. `resetWorld` now leaves
the road, closes the menu and the desk. With the page visible again, two old assertions had to be
taken seriously: the pads/console overlap (a false positive — `.pads` is a full-width strip with
an empty middle; measured by groups now, as the phone suite always did) and the invisible ledger
(someone else's open menu, now closed).

Five more nets, all green: every button pressed twice while broke and with a full hold, and a
stale button that left the screen may not pay a second time (`91zzzzzc`); the world out of its
seed — same system twice, in reverse order, with other generators in between, and nothing
ephemeral inside the save (`91zzzzzd`); every key held alone for seventy frames in every scene,
with the mode and its state object required to agree — a mode without its state is not a crash,
it is a freeze (`91zzzzze`); the counter across the whole galaxy — prices positive everywhere,
taking always dearer than handing in, and no key of any resource able to turn the till into NaN
(`91zzzzzf`); thirty redraws of every board and fifty openings of every screen growing not one
node (`91zzzzzh`).

Two more instruments: `test.ps1 -Size 1440,1440` runs the whole suite in a tall window, where the
interface zoom sits at its ceiling of 1.75 — a regime nothing had ever measured, and it is
healthy; and the frame ledger now judges only in the window its baseline was shot in.

## 0.351.3 - «Сорока»: four gold triangles, and gold that is metal

The author's third sketch: four separate long triangles from one point near the bow, a cross at
45° to the keel, nothing between them — and «а чё золотой не можешь… мультик какой-то». The kite
is gone; the sails are four blades, each 1.7 keels long and a keel wide at the tip, and the colour
is no longer a fill: across each blade the foil runs bronze → gold → near-white → gold → bronze,
seven strips of slightly different tone run its length, twenty-six crinkles of the folding lie as
a light stroke beside a dark one, the two blades facing the star carry one soft mirror highlight
and a lit thread along their star-side edge, the keel throws its shadow across, a spar runs down
each axis to a tip mass with a steady light, stays run from the tips to the keel's ends.

## 0.351.2 - «Сорока»: flat gold sails, as in space

Author, on the second frame: «бананы убрать, паруса треугольные, не гнутые, как в космосе,
золотые». The curved blades are gone. The sail is a square kite of four flat gold triangles on two
crossed booms — the yard and the keel's extension — the hull lying along the kite's diagonal, the
way IKAROS flies and the way the films draw it. Each panel is one tone, darker toward the hub;
the two panels facing the star are brighter than the two in shade, one soft sheen crosses them,
fold lines run parallel to the outer edge, the keel and yard throw their shadow on the foil, and
the four corners carry tip masses with a steady light. Also: the ОПИСЬ hull fills its panel with a
shadow beneath it; the room's walls went from steel to wood and brass, and the goods in the near
cases are the size of goods.

## 0.351.1 - «Сорока», second look

The blades are slimmer at the root and bend harder toward the tip, with a lit outer rim — sabres,
not petals; the keel catches the sails' gold along its top edge. In the room every tool in the
catalogue has its own silhouette on the cloth — sextant, pencil, gyrocompass, blanket, valve,
needle, bell, notebook, sign, mechanical hand, ear trumpet, key, price list, shelf — instead of
one brass box with a dot.

## 0.351.0 - «Сорока» and the desk: the author's sketch, and a second look

The author drew over a frame of «Сорока» (2026-09-05): four huge curved sails fanned around the
mast like a pinwheel, each longer than the hull. The four small foil triangles on the bow side are
gone; the ship is a heliogyro now — four membrane blades from a hub on the yard, each a keel and a
half long, bent toward the tip, the whole wheel turning once a quarter hour, drawn *behind* the
keel with the keel's shadow across them, a dark spar on the leading edge and a stay to the yard's
end. The room got a face: riveted wall panels, deck planks running to the vanishing point, a worn
runner to the counter, a dark-red curtain with the magpie behind the keeper, shelves of jars,
bales and crates along the walls, the goods drawn larger with their price in chalk. The ОПИСЬ
cloth got its weave and a stitched hem, the hull panel a lamp and more room, and away from a
station the matchbox stands in its own zone on the right instead of an empty column.

## 0.350.2 - the трассы on the map, judged on a staged chart

The last unjudged look of the fleet (PLAN: «§14 wants a lived-in save»): the map was staged with
every station at rung 6 and shot. The chain, the milestone ticks and the band held up; what did not
was the darkness law — a трасса beyond the jump edge burned as bright as the road under your keel.
Lines, ticks and the band now drop to a third past the edge (`12ai-fleet`, `18b-map-hold`).

## 0.350.1 - M352, second pass over the frames

The six kinds the first pass had not seen in a frame were shot and two of them redrawn: the ocean's
coral towers were pointed and read as crystal in the blue — they now branch and end in knobs, a
lit rim on the star's side; the desert's dry tree carried one flat disc and read as a parasol on a
stick — three small tufts on short wind-bent branches instead. Lava trees, blisters, boulder stacks
and crystal scree held up as they were.

## 0.350.0 - M352: one big thing per biome

Until now four worlds out of eleven had a large form of their own (crystal druses, metal slabs,
ruin walls, jungle canopies); the other seven differed by ground and small flora and read as one
silhouette from three steps back. Every land biome now carries its own family, five to twelve
astronaut heights, silhouette against the haze, shadow on the ground, no outlines: desert table
buttes and wind-bent one-crown trees; rocky boulder stacks, lone boulders and scree; ice hummocks
and spires with a translucent edge; volcanic cinder cones with a warm crack and frozen «lava trees»;
toxic pod trees and blisters over a glowing pool; ocean shore trees on stilt roots and coral towers;
ruin stelae with tally marks, antennas and stairs to nowhere; terran round crowns; a twin-lobed
canopy for the jungle. Two to four per screen instead of fewer than one; neighbours no longer stand
inside each other. Also: the distance chips at the screen's edge no longer overlap the labels of
nearby marks. Module `21b-surface-deco-biomes`, suite `91zzzzn-deco-biomes`.

## 0.349.0 - M351: the cooperative — buying for yourself, and the people who do it with you

The author's ladder: на дядю → кооператив → своё. The first rung stays as it was: the house's order and
the assigned leg on the house's account. The «Закон о кооперации Главтрассы» says a crew trades and hires
for itself only as a cooperative registered under one of the four houses, and the exam is turnover — the
station says the number before you are ready: «взять товар могут только кооперативы · оборот 3 400 из
12 000». At any house station: 1 500 credits, a name you type yourself, a stamp in КНИЖКА, and the house
becomes your patron. Then the counter opens to any tradeable good, priced in slices — every ten units the
ask rises three percent, and every sale's plain part falls the same way — with a cap per visit by rank:
Кооператив 60, Артель 150 (a hundred thousand of turnover since the stamp and two asks granted),
Товарищество without a cap (five hundred thousand, four asks, and a narrower spread). Hiring opens with
the stamp: the places in your звено come from the rank (1 / 3 / 5) plus the licence and the manager. ДЕЛА
gets the cooperative's page first: who is on the payroll — machines, hands, managers — what they brought
this shift and what they cost, from the same `earn()` that moves the money, and up to three asks that
grow out of the composition and point at the buildings the game already has: столовая when there are three
hands, ангар at five machines, красный уголок for the manager, медпункт after two captures, учебный пункт
at ten machines, a day off in a holiday, a name plate on the hull. Granted, an ask says thanks in ЛЮДИ and
lifts the spirit — 0…5, «кислое / ровное / бодрое», a percent per point on the drones' output and the
hands' gross. The beacon now names the cooperative when it overdelivers.

## 0.348.0 - M349: «Маяк ГЛАВТРАССЫ» — the official voice in the ether, and it speaks

Once a shift (twenty real minutes) the beacon reads its bulletin: «МАЯК ГЛАВТРАССЫ. СМЕНА 412.» and then
the poster's лесенка — «Сектор 4:-7, станция «Ласковый-2»: принято / сто тонн / титана. План смены — сто
двенадцать процентов. Слава сдавшим!» Every line has a real change of the world behind it and carries
it as a cause: the tonnage the stations took into their appetite (from drones and from you), your own
sales when they beat the norm — «экипаж борта «Стриж» перевыполнил план по титану», sectors you cleared,
sectors the pirates took — «переведён на особый режим», never «lost» — the scrip rates that moved, and the
holiday, which doubles the fleet's fuel norm for the day. No changes — no bulletin. «Сорока» is never
mentioned; what the beacon will not say, the cantina tells. It is heard in ЭФИР on the desk, as a sheet
on the cantina wall (its addresses tappable), and — by the author's wish, «если ты мне ещё и голосом» —
aloud: the browser's own speech synthesis, Russian, no sound file in the game. Quiet, as he asked after
the proba («давай только тихо, пусть болтает»): volume 35 %, unhurried, a crackle of the receiver before
and a short two-tone after, half-voice under combat, never on the desk or at a station. The voices are
the system's: the settings list what your device has, one picker per role — the beacon, «Сорока»'s
keeper, the station dispatcher — and a ПРОБА button; install a voice in the OS and the game sees it.
The first bulletin says where to turn it off.

## 0.347.0 - M348: holdings on the map — houses as patches, the трасса as a line, pirates as foci

Who owns what, in three languages, because they are three different things. Houses wash their station's
sector and its neighbours a jump around in the house colour; where two houses overlap the second one
hatches over the first — both scrips are taken there. The wash obeys the darkness law: bright by you,
gone beyond your reach except where you have seen the prices or heard a rumour. ГЛАВТРАССА is a thin
double line between the stations the fleet serves, with milestone ticks and its name written once along
the longest leg like a river's; the sectors along it lie under a faint band, and pirates no longer hold
them — an occupied sector on the line loses a level every tick, and the front never steps onto it.
Occupied sectors carry a rusty diagonal hatch; where the hatch meets a house patch the cell's edge is a
touch brighter — the front line. Your own bases and holding stations wear a thin frame in your colour,
visible even in the dark. Where the news said a station «перешла другим людям», the sector carries a
small tag «сменился хозяин · 2 дня назад» that fades over three days. A СЛОИ button in the map's strip
cycles ВСЕ → ВЛАДЕНИЯ → ЦЕНЫ → СЛУХИ; the ЦЕНЫ layer prints each seen station's best price under its
star, amber when that good is in your hold.

## 0.346.0 - M347: the map speaks in addresses

The author's words: «на карте не понятно, что за сектора и адреса». Now the chart has what an address is
read with. A sector grid under the same darkness law as the stars — bright by you, gone at the edge of
your reach, every fifth line a touch louder. Rulers along the top and the left edge that scroll with the
window; your coordinates are underlined in teal on them, the selected sector's in amber — you read an
address off the rulers, never off the cells. A header: «ВЫ · сектор 4:-7 · «Имя»», and under it the
selection «сектор 6:-9 · 3 сектора · 2 прыжка · 3,1 пк» — «секторов» counted the way rumours count
them. An empty cell can be selected: it has an address and a distance, and no course. Rumours you have
heard lie on the map as pale hatched squares «в N секторах вокруг X:Y · буфетчица»; two that overlap show
it by themselves. Faint rings mark «2 прыжка» and «3 прыжка». A small field «сектор __:__» slides the
window to any address and outlines the cell, and every «сектор x:y» in the game's own text — rumours,
the notebook, flea provenance, «Сорока»'s papers — is now tappable and opens the map there. A rose in the
corner says +X, +Y and «к ядру». And a wordless mark, by the author's decision: a match. You lay one
from the wallet on a cell and it lies there until you take it back — not spent, but not in the wallet
while it lies, so a mark costs something without a rule. Ten at most. No matches — no mark, and the game
says so in one line.

## 0.345.0 - M346: matchboxes — twenty empty boxes of factories that are gone

The last step of the «Сорока» queue and the smallest: a side collection with no use at all. Twenty
labels, each one line — «Красный маяк», «Полярная», «Гагара», «Долгий ход», «Смена», «Стриж»,
«Тишина», «Кедр», «Верфь № 3», «Ласточка», «Первое сентября», «Ковш», «Ясная», «Прибой», «Кочегар»,
«Утро», «Дружина», «Экспедиция», «Последняя партия» — empty boxes turn up in hulks and containers, on
the flea market as a cheap lot, and aboard «Сорока» for a single match. They lie on the shelf at home
beside the books: «коробков: N из 20», the labels tilted, the striking edge red. Nothing counts them.
The keeper has one more line, about a full box of fifty he saw once and will not sell.

## 0.344.0 - M345: the locker — the houses' transport office keeps your things

Dock at a station of the sixth rung or higher and a fifth zone slides onto ОПИСЬ: ЯЩИК, twenty-four
places (forty-eight with the «Второй ящик» tool from «Сорока»), one locker for the whole galaxy, instant.
Spare parts, piles of cargo and «Сорока» tools go in by dragging or by «В ЯЩИК» on the card; «ЗАБРАТЬ»
brings them back. Storage costs one percent of the contents' value per real day, taken when you next
come by, in whole days, and if the till is short the office takes what there is and asks no more — there
is no book of debt. Leave the locker a month untouched and the office hands it over: your parts surface
on the flea markets as lots «залог, за которым не пришли», priced and sold like any other; the raw and
the tools are gone. The hard choice the design wanted — what to take on this run — now has a place.

## 0.343.0 - M344: cosmetics — things that are seen, not counted

The second row of «Сорока»'s shelf: twenty-seven things in seven slots, every one for matches (6–20) and
none of them a number. Eight exhausts with their own flame — blue, needle, fan, twin, copper, green, ring,
white heat; four jump trails (emerald, copper, violet, ice); four suit finishes — gilded, blued, mirror,
porcelain with painting — that recolour the doll on ОПИСЬ and the walker on the ground alike; three visor
tints; three hull marks (a real maker's plate, a red postal stripe, one star at midships) painted after the
stencils; three patterns for the nav lights (steady, double flash, alternating); two docking chimes, a
two-note sign and a bell, synthesised like everything else. The casket on ОПИСЬ opens with the first
purchase: wear by button or drag the thing onto the hull or the kit, take it off the same way. A cosmetic
that changed nothing would be a lie, so a test renders each painter with and without the thing and counts
the pixels.

## 0.342.0 - M343: aboard «Сорока» — the room and the shop

Dock at the porch and you are inside the spine: a long low corridor in one-point perspective, ring
frames marking the depth, glass cases with brass corners along both walls — one thing on green cloth in
each, its own steady lamp above — a skylight in the ceiling where the planet's limb turns and throws cold
bars across the floor, gold leaking from the sails onto the upper walls, bundles and an empty cage
drifting on lines, and at the far end the keeper behind a low counter under a green-shaded lamp, helmet
hanging on its hook. You walk the corridor with ◀ ▶ (or the pads); the case in front of you shows its
card: the keeper's provenance line, what it does, what it costs. Buying leaves an empty case with a chalk
tag — the hole is the memory. Leaving is a button; if the stop ends while you are inside, you are put
back where the ship stood.

What is sold: fourteen tools for matches — Секстант Долгого Хода, Штурманский карандаш, Гирокомпас без
номера, Термоодеяло разведчика, Клапан старой заправки, Парусная игла, Колокол вахты, Тетрадь ветра,
Табличка «НЕ КУПЛЕНО», Мастерская рука, Слуховая трубка, Ключ причала, Список цен, Полка шире — every one
read by the module it names; two papers for credits (Карта области, a book you do not have); and one
wild card per stop asking «любая часть не ниже отменной» for an artifact you lack, or a rarity when you
already hold three. The second counter buys what nobody buys: 40 units of volatiles, ice crystals or
alloy per match, 20 technical components, no more than 200 units per stop, whole matches only; a rarity
shown pays four, once, and stays yours. Tools work only from the six-place shelf on ОПИСЬ («ИНСТРУМЕНТЫ
«СОРОКИ»»); the rest lie in the hold with «НА ПОЛКУ». The keeper speaks the lines of the design: «Спички
считаем целыми…», «Кладу из своего коробка, помните это», and in the last hour strikes a match — «Сейчас
узнаем, куда ветер.» — «Туда.» The scene «сорока» joined the frame meter and the fuzzer.

## 0.341.0 - M342: «Сорока» in the world

The wandering sail-ship exists (`12v-wander`, `docs/DESIGN-wanderer.md` §3–§5, §7). Its position is a
function of the clock and nothing else: a loop of twenty-four stops seeded once from the stars, three
real days at each, one day in transit, every fourth stop a dark system without a station — the loop
circles the core between six and twenty sectors out and passes the home region twice a round. At a stop
it stands at the lit limb of a planet, nose to the star: a long dark keel of ring frames with lashed
crates and rivet rows, four gold-foil gores on a cross yard that sway over minutes and never blink, a
glass gondola at the bow with the one warm lamp, a porch under the keel with a ring of steady lights; the
station's shuttle runs an extra arc to it while it stands. In the last hour the hull turns toward the
next stop; for six hours after departure the departed system shows a receding glint. Approach it like a
station: «СОРОКА · N ед.», drop speed, «ДЕЙСТВИЕ — К ТРАПУ» (the room comes with M343).

Three ways to find it, none a marker: a cantina rumour «паруса у планеты, которые не гаснут ночью»
within six jumps of a stop (spread 2–3 sectors, fifteen percent wrong as always); the institute's sky
watch from an adjacent system lists «яркая точка без номера в каталоге» with the direction; and the
artifact «Карта чужой руки» finally does what it says — its first line draws a sail glyph on the
galaxy map at the current stop, the second, with the researcher's «чтение», also at the next. The last
«perk without code» exception in the names test is gone with it. Save carries only `G.wander`
({got, gave, chit}).

## 0.340.0 - M341: «ОПИСЬ» — one cloth for what you wear, fit and carry

The menu button КОРАБЛЬ is now ОПИСЬ, and it opens a table instead of a screen: dark wood, green
cloth, four numbered zones the way the author drew them. **1 ТРЮМ** — the piles of M179, each with the
best price you have actually seen under it («виденное: 22 кр · 3:-2 · 2 прыжка», tap sets the course;
heard prices say so) and one line «трюм стоит около N, если развезти»; the matchbox lies in the corner
with the count. **2 КОМПЛЕКТ СКАФАНДРА** — the doll and the laid-out kit, the six places, the spare
pieces from the shelf (НАДЕТЬ, or drag them onto the kit). **3 ЧАСТИ И ВЕЩИ** — the hull silhouette
with its slot anchors, slot tags to the left, «СНЯТЫЕ ЧАСТИ» to the right, drag a part onto a slot or
onto the hull. **4 ЛЮК ЗА БОРТ** — a round hatch: a part dropped on it is dismantled (the matches come
out), a pile asks «сколько». Above the cloth the shelf «ИНСТРУМЕНТЫ «СОРОКИ»» (six empty places, chalk)
and the closed «КОСМЕТИКА · шкатулка» wait for M343–M344.

Two panels of ПРИБОРЫ, real `stat()` and `kitStat()` numbers, show the **future**: hover or select a
fitted part and every touched line prints «→ N» for «если снять»; a spare part prints the delta
against the part it would replace and names the slot; a spare kit piece does the same with weight.
Cards carry only name, tier and affixes — comparison lives in the panel. Buttons appear under the
selected card (tap) or under the mouse; a part above «добротная» is dismantled through «ТОЧНО?», a
button that changes its word for three seconds. People are never thrown overboard.

Phone (≤760): one feed — shelf and box as a strip, parts, kit, hold — the hatch is a bar at the bottom
while something is lifted; tap selects, long-press lifts. The old ship screen and the desk paper
НАКЛАДНАЯ are gone; the station's ОСНАСТКА opens ОПИСЬ over the terminal; the map card shows the
station's seen prices with your cargo highlighted, and a ЦЕНЫ button on the map lists every price you
saw, a КУРС per row. Fixed on the way: dismantling a launcher threw (no scrap pool for `missile`).

## 0.339.1 - «Смена», the prose pass

The author's verdict on the book was «интересная, как игра, а не заметки». Read as a critic, the
novel turned out to be mostly scenes already — the parts about the neighbours, the deadline, the
schism and the silence hold. What read as notes were chapters 10, 11 and 16 and the scenes added
yesterday for the new mechanics. Those are now scenes: the drone stuck in quicksand under two
moons and the match found under the cowl; Sivy hired across the counter and found drinking on a
gangway; the base's first night and the battery that gave out at four in the morning; the
cooperative registered in a queue and the counter that gets dearer with the second hundred;
the station that «БЕРЁТ» and the day the premium was lost by a minute. `docs/SMENA-sample-10.md`
holds the sample the author approved.

## 0.339.0 - M353: «Смена» — the novel on the desk, read as it is lived

The book the author wrote on 28.08 (72 chapters in eight parts, the story bible in its appendix)
is now inside the game. It lies on the desk as a bound volume; a chapter opens in ink when the
player has lived it — the trigger is the very module the book says «plays» that chapter: the first
honest sale and the home, the first machine on a point, the first hire, the grove, the renegade on
your flagship, the last-run letters, the commission. Unopened chapters show their title and where
that is heard, never where to fly. Beside each part stands «отчёт: собрано N из M» — the eight parts
of the novel are the eight chapters of the Long Walk's report, and the game still does not say so.
Nine scenes were added for what the game learned after the book was written — the fire box at the
dock and the match under the cowl, the beacon among the ether lines, the drone-miner bought at the
yard, the cooperative's stamp, «Сорока» at the planet's limb, the station that «БЕРЁТ», the
tanker of ГЛАВТРАССА and the black derelict, the flea lot about your own route, the beacon praising
you by name. The prose lives in `docs/SMENA.md`; `docs/mksmena.py` puts it into the build.

## 0.338.0 - M350: the drone-miner — a bottomless point, priced by payback

The economy audit (`docs/ECONOMY-AUDIT.md`) measured drones as the one faucet without a brake:
every machine on the same deposit got its own full pool, so twenty of them earned 581 cr/min for
44 000 cr. The author's answer (2026-09-04) was not a cap but a different machine. «Дрон-добытчик»
works the deposit round the clock and never returns on its own — it is recalled with ВЕРНУТЬ where
it stands. It is priced by payback: 9 000 cr, ~4.5 h on crystals, ~10 h on titanium, a day on
iron, and the station shows those hours from its own prices. Buying is the brake: only a yard or
an industrial station sells one, one machine per station per two days. Every drone now chooses
where to sell within two sectors by the prices on your desk (the keeper's perk still widens it to
three and speeds the turnover), and a drone from a neighbouring sector is drawn arriving at the
station it delivers to. Old drones with a finite pool finish it and come home as before. Hand
trade was re-measured honestly — buying exists only on a route leg (M289) — and stays as it is.

## 0.337.0 - M340: matches — the second currency, found under the cowl

First step of the «Сорока» queue (`PLAN.md`, `docs/DESIGN-wanderer.md`). Open fire is forbidden
everywhere and nobody makes matches any more, so a whole match is the one thing money cannot buy.
The mechanics of the old worlds left one under the cowl of every good part «чтоб стояла»: dismantling
a part above «добротная» now yields matches (1 / 3 / 5, a legendary one sometimes hides a box of 8,
decided by the part's seed, not a roll). New wallet `G.matches`, saved and defaulted; the hold header
reads «спичек: N»; the dismantle message says what was found. Nothing buys or sells them yet — the
ship that does comes with M342–M343.

## 0.336.0 - M339: the holding's arithmetic, and a knob for the fuzzer's hands

The holding (M289–M297) is the youngest and most complicated machine in the game, and every suite
that touched it so far judged it by SCREENS — does the СТРОЙКА tab draw, do its buttons click.
Production has two questions, and neither is about the interface: is anything made out of nothing,
and does anything made get lost on the way to the hold. `tests/91zzzzy-hold` asks them in numbers,
with shifts moved by shifting the record's own stamps — exactly how a player returning an hour
later sees them.

The answers hold: a site opens by the rung and a workshop is paid for in credits AND material (the
suite pays the way a player does); an empty bunker makes nothing over twenty shifts; one shift's
quota yields no more than one shift's output and is eaten exactly once; a hundred shifts stay under
the three-shift ceiling; collecting moves exactly as much into the hold as leaves the workshop; and
with a full hold nothing is taken and nothing evaporates.

Writing it caught a false green in the check itself, worth writing down: `bldTick` takes
`t0=max(B.t0,B.ready)`, so moving one stamp back is not enough — the end of construction lands
after the start of counting and NOT ONE shift passes. «An empty bunker made nothing» was true only
because no shift had run.

Also, a knob the fuzzer never had: its hands were seeded by a constant, so a long run pressed the
same sequence for longer — 4000 frames checked the same path as 260. `test.ps1 -Seed N` gives a
different path entirely; the default is unchanged, so the build's run still repeats exactly. Hunted
across seeds 7, 23 and 91 at 1500 frames over all fourteen scenes: green.

---
## 0.335.0 - M338: the quiet modes join the list too

After the raid (M337), the two remaining modes nobody drove: the wintering and the sanatorium.
Both are whole `G.mode`s with their own update and their own frame, and neither the fuzzer nor the
frame meter had ever seen them. They are staged through the game's own gates (`winTake`,
`enterSpa`) rather than by hand — a half-built record has already once travelled into a stranger's
suite and died there on `toFixed` (M329).

Staging the wintering found a null dereference straight away: `winTake` writes
`recordAdd("станция "+G.st.name, …)`, and the station is only there because the job is taken at a
counter — one reader, no check. Guarded, and the scene now docks first, so it tests the path the
player actually walks.

Fourteen scenes now, each of them covered at once by the fuzzer, the NaN sweep, the save round-trip
from every scene, the blank-frame check, the button sweep and the frame baseline
(wintering 4 tones / mass 34 / contrast .40 / 36% empty; sanatorium 3 / 33 / .56 / 28%).

---
## 0.334.0 - M337: two modes nobody drove, and a test that depended on the clock

`stepWorld` knows thirteen modes; the shared scene list knew eleven. The list belongs to both the
frame meter and the fuzzer, so a whole mode — the boarding raid, the one place with a real
projection, dozens of quadrilaterals depth-sorted every frame — was driven by nobody: no random
hands, no frame numbers, no cross-cutting suite. The staging already existed in the fps probe
(`28z-fps-probe`); it now lives in `lookScenes`, and the raid is instantly covered by the fuzzer,
the NaN sweep, the save round-trip from every scene, the button sweep and the frame baseline
(2 tones / mass 12 / contrast .33 / 56% empty). Twelve scenes now.

And a test that failed at three in the morning without a line of game code changing. «репутация: у
своих садятся стоящие» asserted that with reputation the best mercenary at the counter is better —
from ONE draw. The hall is seeded by a two-day time bucket (`timeBucket`), and in some buckets the
best mercenary is the same with and without reputation. The clock rolled over between the desktop
run and the phone run, and the suite went red. The property being checked is statistical, so it is
now measured that way: ten stations, sums compared, and the count of halls that improved.

---
## 0.333.0 - M336: the frame meter was measuring a different scene every time

A net against silent damage to the picture: the frame ledger's numbers, pinned per scene as a
baseline with wide tolerances (`tests/91zzzzy-look`). It does not judge beauty — the targets in
`LOOK_TARGET` do that, and some scenes honestly miss them. It catches «this became visibly
different from what it was, and nobody noticed»: change a cloud's tone and every daylight sky
darkens; touch a raster cache and a planet stops being baked; reorder layers and contrast leaves.
No existing suite sees any of that — scenes draw non-empty, buttons click, nothing throws.

Building it turned up a defect in the instrument itself. The «система» scene measured contrast
0.88 in one run and 0.15 in another, in the same build: it places the ship RELATIVE TO A PLANET,
and planets live in `SYS_CACHE` and orbit for the whole session. A system entered five minutes in
stands differently from the same system entered at once, so sometimes the star was in frame and
sometimes empty space was. Every number the author reads off `lookAll` has been drifting with how
long the tab had been open — and the fuzzer's promise, «one seed, and the failure repeats exactly»,
was false for the same reason: its scenes are this same list.

The cure is the rule the whole game already runs on: what is derived is regenerated, not stored.
A staged scene now takes its system afresh from the seed, so orbits return to their opening phase
and the scene is the same scene every time. (`lookScenes` in `28y-look`; the scenes that used the
found system's planets after the jump now take them from `G.sys`, since the object was rebuilt.)

The baseline was then measured on a settled frame — 40 frames per scene, because since M332 the
raster of a system left behind is released, and the first frames after arriving show a planet as a
flat disc. The player never sees that frame; the meter should not either.

Suite isolation caught two more fields on the way (`droneIds`, `lastDig`).

---
## 0.332.0 - M335: a promise with no code behind it

«A perk without code is a lie» is a law of this project, written in CLAUDE.md and guarded for the
managers' perk tree since M53. The same law applies to every other table, and nobody was checking
them. The audit is cheap now that a suite can read the game's own source (M333): for each id in a
table, count how many times the game mentions it outside its own declaration. Zero means a line in
a list with nothing behind it — the player sees it, chooses it, and gets nothing.

Of technologies, artifacts and buildings, exactly one came out empty: the artifact **«Карта чужой
руки»** — «on the map you can see where rare goods are traded», and the deep line «and what is not
there yet». `relicOn("chart")` is called nowhere. Six of the seven artifacts are wired; this one
never was.

It is left unwired on purpose, and written down instead of guessed. Rare raw material in this game
is NOT traded at all — that is a design decision with its own comment in `02-world` («рынок их не
берёт вовсе», M39, restated after the 03.09 playtest). So «where they trade rare» must mean
something else — a dock with a rare hull, a bench with rare parts, the rows of the flea market —
and which of those it is, is the author's call, not a guess to be made at three in the morning.
The audit therefore carries exactly one named exception, pointing here and at `PLAN.md`; it
disappears the moment the question is answered.

The two module keys the audit also flagged are a limit of the method, not a finding: module ids
live as properties (`G.mods.hyper`), and text cannot tell a property from any other word. Modules
are out of the audit, with that reason written next to it.

---
## 0.331.0 - M334: someone else's clock, and an autopilot that has to land

Two suites, both about things the game does on its own while nobody is watching.

**Someone else's clock** (`tests/91zzzzy-time`). The game is lazy: drones, the market, news,
shifts and hired hands are all computed from the difference between `Date.now()` and a recorded
moment. On one machine that difference is always small and positive. But the save travels — the
cloud carries it between a phone and a desk, and their clocks differ, so it can arrive FROM THE
FUTURE, and every such difference goes negative. The drones have an explicit guard
(`Math.max(0,…)`); the other two dozen places had never been asked. The suite shifts every epoch
stamp inside the save itself — three days forward and thirty days back — loads it, and lives on:
frames, drone rounds, news. Nothing turns to NaN, the wallet neither goes negative nor balloons,
and the journal keeps no rubbish. A second suite watches the station's shift specifically: rolling
the clock back must not hand out a second helping of the appetite premium — that would be the same
money printer as M331, only through the clock. Both hold.

**The autopilot** has to actually arrive. It burns fuel with no hands on the controls, and an
empty tank is the state that was a hard softlock until M331 — so an autopilot that circles instead
of landing empties the tank in silence. Six approaches from the same start: every planet of the
starting system, the station and the star. All six arrive — 133 to 561 frames, 2.6 to 11 units of
fuel — and none ends dry.

Suite isolation caught one more field on the way (`droneIds`).

---
## 0.330.0 - M333: names that do not exist — the game reads its own source

A typo in a sound's name neither crashes nor goes red: `sfx` simply returns when the table has no
such key. The same holds for a resource key, a journal kind, a station tab — the code calls by
string, the table has never heard of that string, and the mechanic just does not work. There are
thousands of such strings; no eye finds this.

There is exactly one way to check it, and it was available all along: the game reads its own
source. `tests.html` is the game plus the suites in one file, so the whole text of the game is
`document.scripts[0]` (cut at the suites' first line, or the check finds its own examples — the
first run did exactly that). The same trick `build.ps1` uses for `typeof` guards on functions that
do not exist, from the inside and against the tables. `tests/91zzzzy-names`.

Two findings:

- **`sfx("ok")` was called eight times from five modules** — Вега, the island, a closed need, the
  home twice, the planet three times — and there is no `ok` in `SFX`. The confirmation sound has
  never played anywhere it was asked for. Written now in the table's own idiom: a third up, two
  soft triangle notes, longer than the `ui` click so it reads as an answer rather than a press.
- **A dead button in the station's tab strip**: `<button data-tab="smelt">ПЕРЕПЛАВКА</button>`,
  while the string `smelt` appears nowhere else in the entire game. `syncTabs` filters the strip
  by `stTabsHere`, so it could never show — leftover markup from a mechanic that moved. Removed.

Also in this milestone, a lesson already written in CLAUDE.md and paid for again: a heredoc
through the Bash tool ate `` and put a literal 0x08 byte inside a regular expression. It is
invisible in every editor and in `sed`; only `cat -A` showed `^H`. The check looked green and
matched nothing. Anything patched through a heredoc is now grepped for control characters before
it is trusted.

---
## 0.329.0 - M332: what piles up over an evening — the raster, and the freeze it explains

The author's «hard freeze» has been hunted since M238. The fuzzer drives every mode under random
hands and finds no crash; the cross-cutting suites (M329) proved no list in the state grows. What
none of them looked at is the third thing: THE RASTER.

The game bakes pictures — a globe unwrap per planet (up to 512×256), two light overlays (256×256)
and thirteen cloud sprites — and hangs them on the planet objects, which live in `SYS_CACHE`. That
cache has no limit, and it should not have one: a system is a cheap object of numbers, and state
is keyed to it. The raster hanging off it is not cheap. Measured by the new suite
(`tests/91zzzzy-mem`): forty systems flown through = 636 canvases = **28.9 MB**; eighty systems =
**58.8 MB**. Exactly linear, with no ceiling at all. An evening is not forty systems, it is a few
hundred — hundreds of megabytes, and then the tab stops. No exception, no console line: precisely
what the author describes.

The project's own rule already covers it — what is derived is regenerated, not stored. All three
bakeries are lazy and can bake again (`planetStrip` returns null and queues itself, `planetLight`
and `cloudsOf` bake on the spot). So systems stay in the cache for ever, and their raster stays
only for the last six the player was actually in (`sysRasterTick` in `06-galaxy`, called from
`stepWorld`). Returning to a recent system is free; returning to a distant one costs one lazy
re-bake — the same work as the first visit. The map does not bake planet textures at all
(`planetDraw` is called only from the system view), so nothing there changes.

After the fix: 24 systems = 4.8 MB, 48 systems = 9.3 MB, and a system left long ago holds
almost nothing. The steady-state frame is untouched — one string comparison per step, and work
only in the frame where the player changed system.

The same suite also watches the document: twelve full rounds through every desk and station tab
add one node, not a thousand.

---
## 0.328.0 - M331: four questions from game QA, and the four defects they found

The author asked for deep scenario tests «with gamedev experience». That experience comes down to
four questions asked of a game before it is given to people, and none of them is about a single
function: can the player get STUCK; does the game PRINT MONEY; are there DEAD ENDS in the
interface; and what happens AFTER DEATH. `tests/91zzzzy-play` asks all four.

All four found something.

- **Stranded in space was a real softlock.** Fuel burns only on thrust and brake, and the brake
  runs down to a full stop — «killed the last of my speed with the last of my fuel» is an
  ordinary, reachable state, and from it there was not one single move: the rudder needs no fuel
  but changes nothing, synthesis needs ice and a tech, and evacuation lived only on the ground.
  The game did not crash and said nothing; it simply ended. Now the same way out as from a
  planet: a tow to the nearest station for money (`evacCost`/`evacFrom` are shared by both), and
  if there is nothing to pay with, the same total loss — home, or a new «Стриж». The prompt is
  taken last, so anything else nearby still wins it, and the tow is never cheaper than fuel.
- **The counter printed money.** The station's appetite pays +35% for the first units of a shift,
  while the counter sells at +6% — so «buy here, sell here» made about a quarter of the price out
  of thin air, without leaving the desk, every shift. Measured: +46 credits a round where by
  design (M289) every round must be a loss. The premium is payment for BRINGING something, so the
  shift's quota now shrinks by exactly what the player bought at that same counter. Brought from
  elsewhere — full premium, as before. After the fix every round is −10 to −30.
- **The station screen could become a trap.** `closeStation` died on `S.x` and `repairCost` on
  `.stype` when the docking was released under an open screen (a save loaded from the cloud does
  exactly that): the one button that must work in every state — the door — was the one that did
  not. Both now work without a station under them. Found by the crash counter from M329: an
  exception inside a click handler never reaches the `try/catch` around `.click()`.
- **`exitDig`** (M329) was the same family, and this is now a rule with a test: the exit works, or
  the player is left inside.

The suites also nail down what must keep working: an empty tank on a planet always has a way out
(with money, without money, and with a home to return to); every screen lets the player out (the
exit is either named — ЗАКРЫТЬ, НАЗАД, РАЗОЙТИСЬ, ОТМЕНА — or standing in the footer); after a
wreck the player is alive, fuelled, and not left in a loop with the pirates that just took him
apart; and a first run from zero — land, drill a hold full, launch, sell — comes out ahead of what
the fuel cost.

Light: the sun-versus-sky law was moved off the frame and onto the paint. Comparing a big cloud
mass with a small disc through one window is not a fair comparison, and the number drifts with
window size, weather and hour. The hard law is now asked of the colour itself — the lit side of a
cloud is mixed from the star's own colour, and it may not be brighter than the star (checked
across ten stars, dim red ones included; the white base is capped by the star's luminance, so
clouds under a red dwarf are dark rust rather than white). The frame keeps a soft guard: nothing
in the sky may be a quarter brighter than the disc.

---
## 0.327.0 - M330: places, physics, light — three suites that measure the picture, and two defects out of them

The author asked for three more families of cross-cutting tests: things standing in the wrong
place, the world's physics, and glows. All three are about what the frame LOOKS like, and none of
them could be answered from `G` — so they are answered from the canvas and from the world's own
geometry, the way `28y-look` answers about a frame.

**Places** (`tests/91zzzzy-place`). Every deposit, plant and beast stands on the ground on ten
worlds; the herd stays on the ground while it walks; the man never sinks through the surface;
in the cave he is never inside stone (the rock field and the 8x21 body box give an exact answer
every frame); the landing pad is level and unoccupied; the cave mouth is reachable and clear;
and the drawn silhouette agrees with the collision box — boots land on the support point, not
eleven pixels under it.

**Physics** (`tests/91zzzzy-phys`), with the frame step as its own axis: the frame computes
`dt=clamp(...,0,3)`, so on a stuttering frame the world is integrated at triple the step, and
physics that is right at dt=1 and wrong at dt=3 reads to the player as «I fall through the
ground when it lags». Thrust pushes along the nose and burns exactly the stated fuel; coasting
costs nothing; the brake never accelerates; the speed ceiling holds at every step; an empty tank
gives neither thrust nor braking; planets stay on their ellipses and moons on their planets; the
same planet gives the same world twice over (nothing ephemeral is stored, so a second landing
must rebuild the same place); a fall ends on the ground and not under it even at speed 90; stone
stays solid in the cave at every step; and drilling neither loses a unit nor overfills the hold.

**Light** (`tests/91zzzzy-light`): night is measurably darker than day; nothing in the sky
out-shines the star; brightness falls off with distance from the star and from the cave lamp;
glows breathe rather than click between frames; the flare's flame lives and does not strobe (the
author's complaint about 0.325.0, now nailed to numbers); no scene is burnt to white.

Two defects, both invisible to every earlier test:

- **A boulder on the landing pad.** The pad is levelled by height, but the scree was scattered
  across the whole strip with no check at all: a rock of one and a half hull radii lying on the
  landing mark reads exactly as «the ship is standing inside a stone», and it happened on about
  every fourth planet. Rocks over r=4 are now cleared within 54 px of the pad — the cull runs
  after generation, so the `r()` stream does not shift and every other world stays identical.
- **A cloud brighter than the sun.** The lit side of a cloud was mixed toward pure white
  (`lerp(255,…)`), and on a dense-atmosphere world it came out brighter than the solar disc —
  measured 0.85 against 0.79. The eye reads the brightest mass as the source, so the frame had
  two suns while the shadows still came from one: §13 broke exactly where there is most light.
  The cloud top now sits a step below the disc and is still a white cloud.

Suite isolation caught one more field on the way (`rivals`): the guard added in M329 works.

---
## 0.326.0 - M329: eight cross-cutting suites, and the isolation they broke

The author asked for more end-to-end tests. The first cross-cutting suite (91zzza) judges the
picture and the buttons; this one judges what breaks BETWEEN sessions and BY THE END of an
evening, which is what no hand ever catches: `tests/91zzzzz-e2e-life.js`.

Eight suites. NaN never enters the state (every scene, 120 frames of random hands, a deep walk
of `G`). The save writes and reads back from every scene, and loses no field on the way — loss,
not difference: filling `techLvl` with zeroes is the loader's right, dropping the artifact a
manager wears is not. A save without any one field, and with any one field null, still loads,
draws and opens a screen — the tabs rotate through the corruptions so each meets a dozen. No
«undefined», «NaN» or «[object Object]» in the journal, the prompt or anything a tab renders.
Three thousand frames in one flight grow no list and no save. Everything clickable is clicked —
`querySelectorAll("button")` finds nothing on the desk since M299 (things are `div.item` with
`onclick`), so the old «poke every button» suite had been poking the station only. A late world
(rung 25, six buildings, hired hands) renders and clicks. An evening across three systems —
land, mine, cave, launch, jump, save at every stop — runs without one exception.

Three defects came out of it, and all three were of the same family: a number that stopped being
a number.

- **Вега's record**: `applySave` merged the saved object over two defaults, so a field that had
  become NaN (and NaN is written `null` in JSON) came back null and killed the whole БАЗЫ tab on
  `V.att.toFixed(1)`. The set of fields now lives with its owner (`VEGA_DEF` in `11w-vega`), and
  the loader fills what is absent and zeroes what is not a number.
- **`exitDig` died on `G.dig.p`** when the mine was already gone: the frame and the update have
  checked `G.mode==="dig"&&G.dig` for ages, the exit checked nothing. A death inside a click
  handler is invisible — it goes to `window.onerror`, and the player stays underground for good.
- **Suite isolation**: `resetWorld()` reset a hand-written list of fields while half the state is
  created lazily. Thirty names it had never heard of, and fourteen more it simply forgot, rode
  from suite to suite: a half-built Вега from the greenhouse suite reached the late-world suite,
  turned NaN there, and the tab died. The list is replaced by a fact — the names `G` had when the
  page booted; anything newer is deleted. A suite guards it: the world after `resetWorld()` is
  compared with the snapshot taken before the first suite ran.

The frame guard's counter is now read at the end of the whole run: an exception thrown inside a
click handler never reaches the `try/catch` around `b.click()` — it goes to `window.onerror` — so
every «we clicked everything and nothing threw» suite had been half blind by construction.

---
## 0.325.0 - M328: the author's evening list — flame as a body, autoland that lands, a cave that is a cave, swimming

Author's video and list (2026-09-03). The industrial flare was two ellipses jumping by |sin| under a
frozen copy baked into the sprite («кусками дёргается»); it is one bezier tongue now, smooth on
two slow sines, core inside, glow outside, and the heat haze around it is gone — it smeared the
stars into the «white smoke» the author saw. Autoland crashed on rough worlds: the start height
110 sat inside a mountain 450 m from the pad, and the approach held altitude over the ground
below rather than the ridge ahead (`landStartY`, look-ahead in `autoLandInputs`; suite 91zzzb
flies 82 approaches on 21 type·size combinations). At the cave mouth the prompt said «ЗАЛОЖИТЬ
ШАХТУ» while ДЕЙСТВИЕ entered the cave — the later chain overwrote it (`atCave`). The cave mouth
is a rock outcrop with an arch, lip, strata and scree, not a half-ellipse on the ground. Water:
where the lake is deeper than a knee the suit inflates a ring and floats at the waterline, walks
at half speed, ▲ jumps out; algae grow on the bottom and ДЕЙСТВИЕ takes +2 organics per bush
(`waterDeepAt`, `waterAlgae`). Suites 91zzzb/91zzzc cover autoland, panel overlap, button text
overflow, swimming and the cave prompt.
The four house marks on the station are redrawn in one language: a small dark body with a rim
in the house colour on the hull's left shoulder (tanks, scoop, dish, spars) — the «Ковш» bracket
had been half a hull of pure cyan.

## 0.324.0 - M327: the scoop is a road now, and the house speaks plainly

Plannotator pass on the live build (2026-09-03), four notes and a postscript.

**Gas giant scoop.** «И че куда их продавать и нафиг они нужны + легко добываются, сделай прям
на планете, чтобы препятствия там были, чтобы извилисто летать». The collection band no longer
runs flat across the frame: it winds on a long wave (`scoopCenter`), and the ribbon is drawn from
the same numbers the collision uses, so the picture cannot lie about the rules. Across the road
stand three hazards — storm cores that hit the hull and knock you off height, hail clusters that
scratch small and often, and updraft plumes that do no damage but carry, which is worst near the
lower edge where being carried means heat (`19a`).

**What the gases are for.** Rare stock is not sold by design, but the game never said what eats
it: the hold line named only where it was mined. `RES.use` now names the eater — shipyard
assembly and hull fusion, the cryo shop on a holding — and the market's rare section, plus the
line on leaving the atmosphere, print it (`02`, `26`, `19a`).

**Out of fuel is a failed run, not an execution.** With an empty tank below the band the scene
used to wait for the fire: the hull burned to a fifth, the automat cut the run, and the whole
effort read as «ничего не получил». The automat now pulls you out on the remaining momentum with
the cargo aboard; the heat already taken and the empty tank are the price (`19a`).

**Second pass the same evening, on the author's reply.** «Вытягивает если, то груза тоже нет»:
the tow now drops exactly what was collected in that run (cargo carried in from before is not
thrown overboard), so a failed run cannot beat a careful exit. And «продавать нельзя, а трюм
полный… давай пусть баржи берут»: trading barges buy rare stock at the shadow price of the shop
that eats it (`indPrice`, ~27 кр for volatiles) — the market still will not touch it, spending it
yourself is still worth more, but the hold has stopped being a dead end (`12l`, `26`, `19a`).

**The house in human words.** «Оборот» is a word from a ledger: the tier-up line, the progress
line, the holdings card and the station header now say what it is — everything you earned, and
nothing is written off for it (`12j`, `26a`, `13b`).

**Desktop panel.** The receiver band lay across the station header, and the column cap was
counted inside `zoom:var(--ui)`, so on a 2560-wide monitor the «column in the middle» spread to
1890 points — the very thing that block was written to prevent. The cap is divided by the same
`--ui`, and the receiver gets its own row above the header (`style.css`).

---
## 0.323.0 - M326: the house marks as things, not lines

Author's video (2026-09-03): on the industrial station the «Вестовой» mast-and-dish mark stood
on the flare stack's axis and read as smoke from the nozzle with a hook above the flame — it now
hangs on the left conveyor arm (`17c`/`17d`). In the settlement the one-pixel cyan sigil on the
wall (the «галочка» next to the door) became a plaque by the door: shadow, board, faded house
paint, edge highlight; placed from the same `housePlan` that drew the wall (`12t`).

Second pass the same evening, after the author asked why the fix did not bother me: the
«Вестовой» mark itself was the ugliness — an 18-unit mast in pure house colour, taller than the
station. It is now a dish on a bracket at the hull's left shoulder, a dark body with a rim in the
house colour, the size of a porthole. The flare stack finally smokes (`stackSmoke`, a pure
function: rises, drifts one way, grows, fades). Tests: a new end-to-end suite (`91zzza`) walks
every `lookScenes()` scene, checks the frame is not blank, clicks every visible button, and
judges the flare column by pixels (no cold pixels above the nozzle for any house) and the smoke
by its four monotonicities; the report now opens with four groups — сквозные, картинка,
интерфейс, формулы — so a failure says where it is.

## 0.322.0 - M325: the author's effects list, all four — water, heat haze, chromatic hits, the live flare

«Берём все» (2026-09-03). New module `18d-postfx` for the two frame effects; the water lives
with the surface (`21e`), the flare with the station (`17c`).

- **Water with reflections.** There was no water on any surface; the reeds of M316 were waiting
  for it. `waterOf` puts one lake in the deepest hollow of the strip when the strip is wet
  (`tr.wet`, the same field that paints the globe's green) and the world can be wet at all
  (terran, jungle, ocean, rocky, ruin; toxic gets acid of its own colour; airless never). The
  level sits two to three heights below the hollow's rims, the mirror is at least 200 steps or it
  is a puddle; computed once per terrain. The mirror is a self-copy of the frame: the band above
  the waterline flipped under it in eight ribbons with a sine shift (ripple), fading with depth;
  the sky's tone in the body, glints along the wind, a bright thread at the waterline, reeds on
  both banks. Nothing grows inside the mirror (`drawSurfaceWorld` skips those plants).
- **Heat haze over the nozzles.** `heatHaze(x,y,w,h,k,seed)` slices the frame behind each
  nozzle into ribbons across the flame and lays them back with a pixel-and-a-half sine shift —
  refraction, no colour. Only while thrusting (`exhaustHaze`, 16a); the flare pipe gets the same
  shimmer.
- **Chromatic aberration on hits.** `hitFx(k)` from a pirate shot, a rock in the belt, a crash
  landing; `drawHitFx` (after the world, before the HUD) adds a red copy of the frame shifted
  left and a blue one shifted right, tinted by multiply in an offscreen and added with lighter,
  decaying to nothing in about a second. The suite measures the fringes in pixels.
- **The flare flame lives.** The industrial station's sprite is baked per 18 ticks (M304), so
  its flame stood still; the flame is now drawn live over the bake, with a hot core and the haze.
- Stand: the effect frames could not be caught by `shot.py` (the game's own loop overdraws
  before the capture); the chromatic fringe is asserted by `getImageData` in `91zzy-fx` instead.

## 0.321.0 - M324: where a drone sells — the keeper decides, from the prices on your desk

Open since M237 («the nearest station»; a route editor would be micromanagement). The author
said decide and build (2026-09-03). The owner of the choice is the Смотритель: with the perk
«авто-сбыт» and the rule «трюм дрона полон → сдать там, где дороже» he reads `G.seenPrices` -
the prices you saw or heard yourself; he does not open the world for you - within three sectors
of the drone's point, discounts 8% per sector of the way, and sends the drone there if it comes
out at least a tenth dearer. Otherwise, and without him, the nearest station as before.

- `droneMarket` (12-economy): the decision, kept a day per drone in `d.mkt`, saved with it; a
  change of market is one line from him («Д-3 сдаёт на «X»: там дороже»).
- The drone's circle grows by 15 s per sector (`droneTripMs`), it leaves toward that sector
  (`droneHome`), and its caption says where: «Д-3 · ЖЕЛЕЗО → X».
- The perk's note and the rule's text say what they now do. The 1.35 rate of the perk stays.
- Suite `91zzzy-drones` (M324 block): nearest without him; the dearer one with him; nothing
  beyond three sectors; an empty desk means nearest.

## 0.320.0 - M323: the plant as a body, not a skin

The tail of M173 #2. 0.140.0 gave every form a gradient, and a gradient is a skin: a leaf stayed
a paper cut-out with no dark edge against a bright sky, the stem as light as the crown. By the
rule "many pieces, one body" the body comes first: `drawPlant` (20-life) now paints the plant
twice - first the whole form as one dense dark mass (.42 of its tone), shifted away from the
star and down by one to two pixels, then the lit form over it. Every leaf and stem of all twelve
forms gets a shaded side and a contact edge in one place, the way 0.140.0 gave them light. Near
plants only: the far ones already fade into the air. Glow, litter and the druse's white edge
belong to the lit pass alone. The stem's gradient is a step darker than the crown's (1.0 against
1.22), so the crown reads over it.

## 0.319.0 - M322: one house plan for the home and the settlement

`housePlan(seed, p, opt)` in `12tb-settle-draw` is now the only place a dwelling is planned:
width, wall height, pitch, wall and roof material by world (`sdMat`), plan variant (plain,
porch, annex, second and attic window), mirror, window offset, woodpile side, log age, tints.
`homePlan` (21f) takes it and only rescales the wall to the home's two-and-a-half heights;
`sdDwell` (12tb-…draw2) reads its variant, mirror, wall fraction and tints from it.

- **One material table.** The home said tile on rock and plank elsewhere; the settlement on the
  same rock said thatch. `sdMat` now has a rock/volcanic row (stone walls, tile roof) and both
  read it; the home's wall texture follows the material too (was always «log»).
- **The settlement's chimney sits on the slope** — the M242 fix the home had, the izba did not:
  from the ridge, the chimney at .22 of the width floated a cube above the roof.
- **The home takes plan variant 3** — an attic window in the gable.
- The wintering: there is no hut exterior to unify — the wintering is an interior (`29g`); the
  PLAN line was a guess.
- Stand: `docs/shot.py homeout` and `wallset` hang at load in headless Chrome (the same setup
  through `--js` on the `noon` scene draws fine); zombie headless Chromes from a hung shot keep
  the machine busy and poison every later measurement — kill them by `drift-shot` in the
  command line before trusting a number.

## 0.318.0 - M321: the §9 walkthrough as a suite — and the course that lived only a moment

`DESIGN-screens` §9 is now `tests/91zzy-walk`: the six steps of the newcomer's path (dock → rumour
to the map → the room → the counter → the regular → undock) run in both windows, and after every
step no visible text block may exceed 200 characters — the "no step needs a paragraph" rule made
measurable. Steps 1–5 passed as built. Step 6 did not exist: after НА КАРТУ and НАЗАД the game
kept only `G.sel`, so the flight had nothing to call the course by, and `mapReset` dropped the
search circle with the peek.

- **The course is a state.** `gotoSector` sets `G.course` {sx, sy, what, rad}; it survives НАЗАД
  and the save (`14-save`), and clears on arrival in `jump`.
- **«К ЦЕЛИ · N ПРЫЖКОВ»** in the rail's context column while in the system and the course is
  not here; one tap opens the map fitted to you and the sector (`goalbtn`, `15-input`,
  `27z-telemetry`).
- **The search circle** is drawn from the course when the peek's own `mapSearch` is gone.
- PLAN: M301 was already built in 0.298.0 and its line was stale; the cave and the man's height
  stay as they are by the author's word (2026-09-03).

## 0.317.0 - M320: smoke along the field's streamlines — and smoke that can be seen at all

First item off the author's effects list (curl-noise smoke). `dirAt` (01-core) already *is* curl
noise — the gradient of fbm turned a quarter — so a column of smoke is one streamline of that
field, walked upward from the mouth with the field's cross component (weight 1.1, period 140 px)
and a wind drift growing with height. `smokePath` (`12tb-settle-draw2`) bakes the polyline once
per chimney and wind quarter; the puffs slide along it, each at its own pace. The tin smelter's
chimney (`12ta-tin`) uses the same smoke instead of its own ring chain.

What the loupe found on the way: **the settlement's smoke had been invisible since M169.** The
puffs started at .8 px and faded with the cube of age, so a chimney at strength .55 never made a
visible pixel and the hearth's column died under the roof; and the one light tone was invisible
against a daytime sky. Now density grows from the mouth to a peak at .15 of the path and fades to
the top, the path is 70 px per unit of strength, and the tone follows the sky (§16): a step darker
by day, lighter by night. Suite `91y-settle` (M320 block).

Also hunted: the "rectangular seams of the sky layer" from the loose-ends list. A step detector
over the sky third of the frame (night and landing, two window sizes) finds no straight seam; the
only rectangles were the canvas hint band, the chips, and the `wallset` stand's own loupe overlay.
Not reproduced; the detector is a one-line `--eval` in `docs/shot.py` when it returns.

 the ship's zoom floor, the home interior measured — and prof() caught lying

- **The ship at deep zoom-out** (`17-mode-system`): the hull kept a `.55` scale floor while the
  world went to ×0.16, so it read larger than a small planet and far larger than a moon. The floor
  is `.35` now — smaller than a planet at the far end, still found by eye.
- **The home interior measured before baking**, as the loose-ends list asked. `prof()` in the
  browser pane said 27 ms of raster per frame at dpr 2, and a full bake of the room into `18c`
  chunks was built and measured — and `prof()` still said 24–49 ms with the bake in. The `?g11`
  probe, with `homein` added to its tour, says **60 fps with and without the bake** (dpr 2). The
  bake was reverted: no gain to pay for. What was wrong is the instrument — Chrome demotes a canvas
  to software rasterisation after repeated `getImageData`, and `prof()` reads the canvas every
  frame, so on the second call it measures the CPU raster the player never sees (a scaled
  `drawImage` is cheap on the GPU and 10 ms in software). `prof()` stays the tool for *what a
  frame does* (JS by function, raster by muting); *whether a mode is fast* is `docs/g11.ps1` only.
  `prof()` now knows the `homein` mode; the probe's tour has it before the road.

 the fleet's small parts, and the трасса as a chain

The two laws almanac III left open after M317, `12ai-fleet`:

- **§5 four materials at meeting distance.** Strap-on tanks, containers and the лихтеровоз's
  barges lie on the body and merged with it at 8 px because the seam was a half-pixel line. Now
  every such part casts a shadow strip (`shade`, hw·.14, light from −y) onto the body under its
  lower edge — volume by shadow, not by contour (§4). The рефрижератор's ribs are a two-value
  corrugation instead of nine hairlines. Measured on the sprite: under a tank the body is darker
  by more than .2; the corrugation's crest and trough differ by ≥ .06.
- **§14 the chart is an instrument.** Judged on a staged map (rung forced to 12): the трасса
  reads in the fleet's two colours and is a chain of jumps the fleet actually flies — but every
  pair of qualifying neighbours within 1.6 cells got a line, so a cluster of five stations drew
  ten. `drawFleetMap` now links each station to its two nearest fleet neighbours only; the line
  reads as a direction. At zoom 1 the dashes sit under the map's own links in value and are found
  by zooming, as every line on that chart is.

Suite `91zzza` (M318 block). Almanac III addendum 0.315.0 closes the issue's open list.

 the fleet at meeting distance — the six items of almanac III

The 0.313.0 addendum judged the fleet where the player meets it and ordered six things, cheapest
first. All six, in `12ai-fleet`:

- **§3 the label** is placed from the body's visible half-height under its current heading
  (`bx`/`by` measured off the polygons at bake time), not by a constant; when a planet chip or
  the prompt band sits below, it moves above the hull (`fleetLabelY`). Chips are read from
  `SYS_CHIPS`, the prompt from its own DOM rect (rule 27z).
- **§8 the scale** follows `setZoom` to its ceiling (`fleetScale`: 2.4 instead of 1.5); the
  sprite is baked at ×3, so the resolution was already paid for. At ×2.4 the почтовик is now
  larger than the barge beside it.
- **§13 the учебное**: a thicker, lighter truss with two edge lines, a handrail on each side
  binding its three capsules, one shared shadow under the row — and all six capsules inside the
  sprite (two used to hang past the nose, one off the canvas).
- **§2 the паром's wing**: three spanwise strips with a value fall from root to tip, six tile
  rows across, three chord lines converging on the tip.
- **§11/§16 the greys**: hull tones dropped one step inside the greys (`C[0]` 222→204, `C[1]`
  176→162), and the one light now reaches the body — its zero moved from −hw to −.2hw, so the
  top edge sits in VII and the underside falls to III–IV. Measured on the baked sprites: medians
  .31–.50 across the thirteen (were .25–.64), lit side p95 .66–.85 (was .70–.90), shadow side
  p5 .07–.19. The derelict is untouched (.11 / .21 / .26).
- **§9 the emblems** — one construction for all thirteen (`fleetGlyph`, §18.2): a light disc at
  body height, a red rim of one weight, inside one filled figure from a closed alphabet at .62 of
  the disc; rotation and reflection the only operations (the рефрижератор is the танкер's drop
  reflected, the паром the спасатель's palm turned down, the лихтеровоз the плавбаза's ring at
  45°). The госпитальное's full-height cross is now the same roundel as everyone else's. Placement
  is per class, so the disc never lands on the number, a strap-on tank or a hatch.

Suite `91zzza` (M317 block): the scale ceiling, label geometry against chips and the floor, six
capsules inside the sprite, every class with a red figure on a light disc, medians and p95 inside
the band. Almanac III carries the 0.314.0 addendum with the per-class numbers.

---
## 0.313.0 - M316: the surface pass — rocks in three families, cracks by hand, the strata debt struck

The three "Graphics still open" items that did not need the author:

- **Strata parallel to the terrain** — already paid by M267 (0.264.0): strata lie on a datum and the
  relief cuts them. The Loose-ends line was stale; struck.
- **Boulders measured, not rebuilt** (`07-planet`, `rocks`): each rock already had its own polygon
  (6–11 vertices, own radii), so "one silhouette scaled" is false — but the *family* was one, a
  squashed blob. Now three: the blob, a block with a flat, slanted base sitting on the ground
  (`tint<.3`), and a low wide slab (`tint>.82`). The family is chosen by a number already drawn:
  no new RNG calls, no world moves.
- **Cracks in the mine rock by hand** (`23aa-dig-rock`): every 180–300 px ruler segment is split in
  five with a perpendicular offset hashed from world coordinates (the branch too) — continuous
  across tile seams, and reads as a crack following grain instead of a drafting line.
- **All bodies orbit one way** (`06-galaxy`; the author's phone, 2026-09-03: «по идее такого не бывает»): planets and
  moons no longer pick a random sense of rotation; the sign roll stays in the RNG stream unread,
  so eccentricities and phases did not move. Suite `91zzza` (M316 block).
- The reeds by the water stay unbuilt: there is no water on the surface yet (a design addition,
  see the effects list).

---
## 0.312.0 - M315: the system's proportions, the ghost click, the hail at rung 30

Three findings from the author's phone (2026-09-03) and the last step of §18.8:

- **Proportions of the system** (`06-galaxy`, `SYS_K_*`): rocky worlds ×1.9 (34–91), gas giants
  ×1.45, moons ×2.2 (7–20), the star ×1.2, orbits and the belt ×1.55. The station was drawn larger
  than a planet and the ship larger still; a moon was a six-pixel target. World *types* are still
  decided by the unscaled orbit (`far`), so no save changes its planets; the RNG stream is untouched.
  Landing gravity and the ПРМ reading were rescaled to keep their feel.
- **The ghost click** (`15-input`): a finger on ДЕЙСТВИЕ opened the barge screen *under* itself, and
  the browser delivered the click to whatever sat under the touch point at release — РАЗОЙТИСЬ in
  the footer. «Мелькает экран, потом разошлись бортами». Half a second after an act press, clicks on
  any screen are swallowed. Applies to every screen opened by the pad.
- **ДЕЙСТВИЕ** no longer breaks mid-word on a 44 px pad (`keep-all`, no letter-spacing).
- **Кольцо (rung 30) — they hail you first** (`fleetHailFirst`, §18.8): the first fleet ship within
  700 names you by the captain's name, once per window per system; one number in `fleetLog`.
- Suite `91zzza` (M315 block).

---
## 0.311.0 - M314: the fleet's tails — lines on the map, the rescuer's call, wing tiles, the cross

- **Трассы on the map** (`drawFleetMap`, hooked in `18-mode-map` over the lanes, under the
  stars; §14 — a line earned by being steerable): a red-and-white dashed line between neighbouring
  systems where the fleet passes (a station and rung ≥ 5); a square tick with a red stroke at a
  system holding the node station (rung ≥ 25). Nothing stored.
- **Спасатель's «come along»** (§18.7 п.11): if a barge in distress is in the system, the rescuer
  offers ИДТИ НА СИГНАЛ — it names the barge, gives course and distance into the ether and on
  screen, and goes; whether you follow is yours.
- Issue III's small findings: the ferry's wing carries tile rows; the hospital's cross is the
  full height of the body; the name on the hull is bold and a size larger.
- Left of §18.7: 12 заявка (the fleet lends a hull for one run) — needs the crew order model.
- Suite `91zzza` (M314 block).

---
## 0.310.0 - M313: the node station «УЗ-1», the black derelict, the caravan

`12ai-fleet`, the places of §18.4 and interaction 6 of §18.7:

- **«УЗ-1», the node station of the lines.** From rung 25 (Узел трасс) it stands opposite the
  system's station: a long truss with the five modules that got our own names — Погреб (the
  sphere store), Кубрик (quarters, five lit windows), Тамбур (the lock between), Воротник (the
  node with two ports), Короб (the dark cargo box) — and two panel arrays at the end. Its band
  carries the call-sign. Hail: «стоянка есть, торга нет». Drawn by the same pipeline as a still
  body (`still`).
- **The black derelict.** In a quarter of the dangerous sectors without a station (danger ≥ .6):
  a black hull with a hole, no band, no lights, no name, lit only by cold grey. Hailing it gets
  silence into the ether and one line in the record book, once. Its voice is the hull.
- **Караван** (§18.7 п.6). Any passing fleet ship offers ИДТИ КАРАВАНОМ: for twenty minutes,
  while a fleet ship is within 520, pirates do not see you and your top speed is 60% — the
  fleet's pace. Fall behind and the caravan is gone (`fleetCaravanActive`, `G.caravan` persists).
- Suite `91zzza` (M313 block).

---
## 0.309.0 - M312: the whole fleet drawn; mail, the hospital's ransom, the school

`12ai-fleet`, the last seven of §18.3 and three more of §18.7:

- **Seven drawings**: спасатель («Луна-9»: a sphere opening on four petals, the flower airlock),
  рудовоз («Энергия»: a barrel with four containers strapped along it), госпитальное (ТКС: a large
  body with the returnable capsule on the nose, a red cross the full height), учебное («Восток»
  ×6: six spherical capsules on a common truss, each with its own hatch), экспедиционное
  («Салют»: cylinder, a truss of dishes, probes on outriggers), рефрижератор («Прогресс»: the
  почтовик's nose and a long ribbed bay), лихтеровоз («семёрка»: the Korolev cross of four other
  people's barges in their own colours). All thirteen classes now spawn by rung.
- **Three services**: **почта** — hand the mail ship your stack and it brings yours
  (`mailDock`; online only, offline the почтовик just answers); **госпитальное** — a hostage is
  ransomed through the hospital at half the price (ВЫКУП ЧЕРЕЗ ГОСПИТАЛЬ · N КР); **учебное** —
  takes an idle hire for a run and returns him grown (+35 xp), once a shift per system.
- Eleven of the twelve interactions exist in some form; left: 6 караван (formation flight), 11
  спасатель's «come along», 12 заявка (the fleet lends a hull for one run).
- Suite `91zzza` (M312 block).

---
## 0.308.0 - M311: the fleet's second pass — joints, whiter hulls, three more classes, four services

Issue III's two findings and the next three of §18.9, in `12ai-fleet`:

- **§8 one joint grammar**: every appendage — panel, strap-on tank, radiator, wing, dish mast —
  now meets the hull through a drawn joint: a dark tie with a light plate and two rivets, the same
  from the почтовик's panels to the плавбаза's arrays (`joints`). The tanker's strap-on tanks are a
  value step lighter than the body. Hull greys lifted a step toward white (§16: VII on the lit
  side).
- **Three drawings**: сторожевик («Спираль»+«Алмаз»: lifting body with an upturned nose, short
  wings, a cannon under the cheek), паром («Буран»: delta wing, black belly in zone II–III, white
  back, three nozzles), плавбаза («Мир»: cylinders of unequal diameter, the node module, five
  panels at odd angles, a docking port up, lit windows). Six of thirteen are drawn now; the rest
  stay unspawned.
- **Four more of the twelve interactions** (§18.7): **буксир** — a hull under 30% is taken in tow
  and patched to 40% so it makes the yard, once a shift; **плавбаза** — while it is in your system
  it is your station: hull repaired to full once a shift; **сторожевик** — with reputation ≥ +2 it
  offers a convoy (ПРОСИТЬ КОНВОЙ): fifteen minutes in which pirates do not see you
  (`fleetEscortActive`, read in `13-pirates`); with reputation ≤ −2 it inspects the hold and lets
  you go, this time; **паром** hails only. `G.fleetEscort` persists.
- Suite `91zzza` (M311 block).

---
## 0.307.0 - M310: ГЛАВТРАССА — the fleet opens (three classes, the line, the call-sign, the norm)

The fleet was «open by design» since 08-31; the author settled fork 4 on 09-03 (our own names).
`12ai-fleet`:

- **Thirteen classes in one table** (`FLEET_CLASSES`): donor, class mark, the rung from which the
  class passes, a voice of two lines, and an `art` flag — only drawn classes spawn. Names our
  own (`FLEET_NAMES`); the node station's modules Короб/Кубрик/Воротник/Тамбур/Погреб and the
  call-sign «УЗ-1» in `FLEET_PLACES` for the passes to come.
- **The paint pipeline** (`fleetArtOf`, one for all classes, §18.5/§1): санкирь under every
  polygon, greys, the red band the full length, black numerals a third of the hull high, the name
  above the band, the class mark in a circle with one solid, wear (off-shade patches, soot fanned
  from the nozzles, the band burnt on top) under one source-atop light. Baked once per ship.
- **Three drawings**: почтовик («Союз»: bell, sphere, instrument cylinder, two panel wings,
  probe), танкер («Протон»: fat body, strap-on tanks, a ring of fill necks), буксир (reactor on a
  boom forward, two flat radiators, bell aft).
- **Passage by the ladder** (`fleetHere`, `fleetPos`): a system with a station and rung ≥ 5 sees
  a почтовик, ≥ 16 a танкер, ≥ 19 a буксир, each in about half the ten-minute windows, crossing
  the system on a bowed line — position a function of `Date.now()`, nothing stored.
- **Two of the twelve interactions**: ПОЗЫВНОЙ — hail them and they answer in the voice of the
  class into the ether; ЗАПРАВКА ПО НОРМЕ — a tanker fills an empty tank once a shift per system,
  no book of debt (`G.fleetLog` persists only the shift). Under 260 units, before the barge's
  prompt.
- `docs/ALMANAC.md` issue III opened with the verdict on the three (joints and tank values go to
  the next pass). `DESIGN-holding.md` §18 status and §18.4 updated.
- Suite `91zzza` (M310 block).

---
## 0.306.0 - M309: the system — a nebula with a body, and traffic that belongs to the world

The «Graphics still open» line: the system view is 66–79% empty; dust in three planes helped
little; what it needs is a nebula that reads and traffic that belongs to the world.

- **The nebula's blots fan out** (`wcBlots`, `16a-space`). The twelve watercolour layers of a blot
  nearly coincided, so a blot read as a shape cut from paper — one edge for all layers. Each layer
  is now scaled ±25% about the blot's centre: the core, where all layers overlap, stays dense; the
  edge melts through a ladder of layers. Inside, three light filaments along the direction field
  and one dark dust lane laid source-over: the gas has a flow and something that hides it. Baked
  into the same per-system texture; the frame cost is unchanged.
- **Shuttles** (`17f-sys-traffic`). A wild system has none; a station has one; one more per six
  rungs of the ladder, four at most. Each runs station ↔ a solid planet along its own bowed arc,
  slowing at both ends, position a pure function of time — nothing stored, nothing ticked. The
  silhouette is a hull the size of a fingernail: body, nozzle glow, one slow navigation light.
  Drawn after the barges, before the drones.
- Meter (hold scene, Z .7): pair 3 → 20, tones 10 → 9; mass and empty unchanged — space is space.
- Suite `91zzza` (M309 block).

---
## 0.305.0 - M308: the approach by day, the band in two steps, daylight without a verdict

- **A warm source on the approach** (`19-mode-landing`). A terran world at altitude measured
  pair 0 — blue air over blue ground, honestly. Now the haze glows the star's colour at the
  horizon on the sun's side (`SUN_DIR`), strength by the sun's altitude, gone at night: low sun
  through the air's thickness. The meter's «заход» scene is set to daytime and 560 m like the
  others («day is day», M243).
- **The galactic band's second value step** (`18-mode-map`, §16, item 6b of the picture queue): a
  narrow bright core, 260 grains of star-dust in it, and a wavy dark dust lane cutting the band —
  two steps instead of one smooth value, the band reads as a body. Baked in the same
  `screenLayer`.
- **`pair` for natural daylight is reported without a verdict** (`LOOK_DAYLIGHT` in `28y-look`,
  decision of 2026-09-03): «грунт день» and «заход» print «·пара N% (дневной свет, без
  приговора)»; every scene with a man-made light keeps the target. `lookVerdict(m, scene)`.
- Stand: `docs/mkview.ps1` gains `?s=landing` (`&alt=` metres) and `?s=map`.
- Suite `91zzza` (M308 block).

---
## 0.304.0 - M307: the home — furniture out of material, a house out of a plan

Two «Graphics still open» lines: the home's furniture was flat boxes with no material, and the
house outside was assembled by a formula, not a generator (the rule of origin).

- **Furniture out of material** (`hinMaterialize`, `29d-home-draw`). The room's furnishing is two
  hundred `fillRect` calls in one function; rewriting each is a session. Instead, for the duration
  of `hinRoomStuff`/`hinFrontStuff` the context's `fillRect` is replaced: every slab over 5×5
  gets a lighter top third and a darker bottom quarter (one light, from the lamp under the
  ceiling), a lit top/left edge and a dark bottom/right edge; wood (r>g>b) gets two or three grain
  lines along the long side, metal a cold streak; whatever stands on the floor gets a contact
  shadow. Room-wide slabs (floors, walls), holes and translucent fills are skipped. Restored in
  `finally`.
- **The house out of a plan** (`homePlan`, `homeSigns`, `21f-home-out`). Width, wall height, roof
  pitch, roof material (thatch on jungle, tile on rock/desert, plank elsewhere), window offset and
  the porch's side are seeded from the system's coordinates: the same house every visit, a
  different house for every player. Signs of habitation grow with the tier: a woodpile from I,
  barrels from II, fence posts from III.
- Not done, on purpose: baking the interior into a layer. Nothing in the home is baked; the
  frame cost was not measured this pass, and a bake without a number is the rule «measure, don't
  guess» broken. Left in PLAN.
- Suite `91zzza` (M307 block).

---
## 0.303.0 - M306: the station body against the codex; the planet changes too

The holding's «still open» line: the codex pass over the station body (DESIGN-holding §13 — the
dump, the dome, the strip; baking the forms). The forms were baked in M304 (`stationArt`, one
sprite with one light); what was missing was the planet's half of §13 and the verdict.

- **The planet changes too** (`drawPlanetWorks`, `17e-station-body`, called after the night
  lights in `17-mode-system`). Three signs on the day side of the first solid planet, each from
  its own cause and none of them a figure: the **dump** — a pale double patch with a shadow on the
  side away from the sun, when a family-A mine is built on rock (regolith, deep drill, dump works);
  the **dome** — one bright point with a cold halo at the terminator, where a greenhouse or a
  biostation catches low sun; the **strip** — a straight line where straight lines do not occur,
  from rung 6 «Полоса». Screen coordinates over the cached disc, like the lights; nothing stored;
  nothing under r 12 px.
- **The hangar's cyan** (`17a-station-mod`): the dock's edge line and the welding flash were the
  one accent with no source on the station; they are now the station's own warm light and a
  cool grey edge. The verdict on the body is in `docs/ALMANAC.md`, issue I addendum II.
- Suite `91zzza` (M306 block).

---
## 0.302.0 - M305: the cave as a place — round rock, a back wall, and things that lie in it

Three findings after M304 (PLAN «Graphics still open»): the cave was 75–83% empty by the meter
and that was a CONTENT number; its outline was a 5 px cell grid with visible right angles; and
between the rock masses there was nothing — blobs hanging in black.

- **Round rock** (`22b-cave-props`, `caveSmoothPath`). The same cell field, blurred 3×3 and traced
  by marching squares with interpolation at .5, one Chaikin pass on top. Edges are oriented
  «rock on the right», so every loop goes into one `Path2D` and nonzero fill carves the holes by
  itself; a tile is traced with a 3-cell margin of fake rock so loops close along the window and
  the tile's own bounds trim the excess. The grid under it (collision, floor, ceiling) is untouched
  — the picture and the physics differ by at most half a cell. `caveContour` stays for the lamp
  mask only.
- **A back wall with a body** (`drawCaveFar`). The far layer was `#070b11` — black with faint
  blobs, so the cave read as rocks in space. Now a zone-I wall: darker than the near rock but with
  mass, five wandering fissures («a hand, not a grid»), columns, and the planet's own material at
  .09. The near body went `#151b25` → `#202a38`, the depth gradient .45 → .26, the grain step
  24 → 14 so the rock has a surface in every 16 px block.
- **What lies in the cave** (`caveProps`/`drawCaveProps`, drawn before the darkness so the lamp
  lights it): three animal skeletons on the floors (spine, ribs, skull with an eye hole, scatter);
  a rope down each shaft with a stake at the lip and knots every seven points — the shaft's own
  «this leads down, and someone knew»; tally scratches with a scratched arrow beside each shaft
  mouth; an abandoned camp by the stranger's lamp (crate, cold fire ring with ash, pick, cup);
  and at the end of each of the six blind branches — bones, a crate, or nothing, at 45/30/25.
- Lamp: the warm pool centre .26 → .18 and the warm air .34 → .24 — the two stacked into a white
  hole at 1× DPR.
- Meter, 1280×800 at three spots (mouth gallery / deep gallery / lower gallery), before → after:
  mass 8 → 11 / 20 / 5, empty 83 → 63 / 51 / 79, contrast .23 → .35 / .36 / .19. The lower lake
  hall stays the honest shortfall: a vault of 78 over a flat floor, the darkness is its material.
- Tooling: `docs/shot.py` — headless frame shots and `lookFrame()` numbers from `file://`, no
  server, no pane: `python docs/shot.py cave --look --js "G.cave.x=900"`. Stand scenes come from
  `docs/mkview.ps1` unchanged.
- Suite `91zzza-cave-props`.

---
## 0.301.0 - M304: the picture queue, one release

The seven items of the picture queue (PLAN, «re-ordered by the second look», 2026-09-02), built
as one milestone and measured with the stands in `docs/x-scout-*.html` and `lookAll()`. Laws in
`docs/DESIGN-craft.md`.

- **Cave shadows to zone I–II (§16).** The rock body in the baked tile was `#0c1016` under two
  darkening washes: everything outside the lamp pool sat in zone 0 and the grey outline was the
  only structure. Body lifted to `#151b25`, the washes halved, the depth gradient softened; the
  darkness sprite has a ceiling of ~34 instead of 22 and is cold blue, edge alpha .66 → .42. New:
  cold glazes in the tile itself — the light of moss, crystals and veins is laid `source-atop` on
  the rock (radius 3–5× the spot), so the stone next to a source is lit and the void is not; the
  lamp stays the one warm source (warm sprite .26 → .34). Measured outside the pool: median
  luminance .093 → .148, pixels under .1 56% → 12%; meter mass 8 → 21, contrast .23 → .35.
- **Surface day: air band and a second hue (§13, §12).** The haze band ran H*.36→.66 and the
  glow band H*.42→.78 — a third of the sheet; both are a brush at the horizon now (H*.52→.64,
  H*.54→.74). `hueToward()` (19b): the disc in the sky and the planet body take their hue a third
  of the short arc toward the star's colour, s and v kept — no longer the flora's palette cell;
  the zenith mixes .50 toward cold instead of .38. Raora II: zenith 158° → 164°, disc reads olive
  against a cyan-green sky.
- **Landing: ground or a haze floor before 600 m (§16).** At 549 m the frame was one value of
  blue. The far ridges hold the frame's horizon (never below .72H/.80H) instead of following the
  ground out of the frame; the haze floor sits no lower than .86H; above 160 m the zenith darkens
  with altitude (up to .42 of the night sky colour). Contrast at 550 m .18 → .30, at 2000 m
  .18 → .27.
- **Home interior furniture pattern (§11).** Wall: horizontal panel seam and plugs at the section
  corners, dirt dots 70 → 30; floor: boards along the room with staggered end-joints and grain
  instead of slanted ticks; `hinSeams()` on the corner cabinet, the study cabinet and the shop
  bench; the study gets a window and a cold pool on the floor under every window.
- **Station body: fill, shadow side, one light.** The station was an orange wire diagram drawn
  as vectors every frame. `drawStationBody()` is now baked by `stationArt()` into a sprite (key:
  system, type, buildings, zoom step, an 18-frame time step so windows and the flare still move)
  with the barge's convention: material fills per piece, dark edges, gold only on real lights, and
  one light last — `source-atop` gradient along the vector station → star, with a lit rim on the
  plate. `ST_GOLD` is an accent now.
- **Value steps (§16).** The rock around the base rooms gets a soft halo of compressed rock per
  built cell — a second value step where there was one wash. The galactic band on the map stays
  open.
- **Small (§14).** Rain strokes below the horizon are drawn at .45 of the alpha and .7 of the
  length: no more white diagonals across the ground by the house.

Guarded by nothing new: the suite is green (12 846 checks); the frame meter table is in the
milestone body in `PLAN.md`.

---
## 0.300.0 - M303: playtest tails of 2026-09-02

Seven small things a phone playtest (0.299.0) tripped over, fixed the same evening.

- **ВЫСЛУШАТЬ did nothing.** The cantina deal card gave its button the row's own handler, and
  that handler drops clicks that land on a button (so the answers inside an open card do not
  fold it) — including the one it was attached to. The button now opens the card itself.
- **Rumours logged again after every load.** `G.rumLogged` (the "these rumours are already
  in the notebook" tag) was never saved, so a reload or a cloud pull re-logged the same two
  rumours into ЛЮДИ. It rides `snapshot()`/`applySave()` now.
- **The desk over a station.** Rumours and deals land on the desk, and reading them meant
  undocking. A СТОЛ button in the station header opens the desk on top of the station,
  with the same "how much came" chip as the menu; ЗАКРЫТЬ returns to the station.
- **The home beacon from a docked ship.** Its button lives on the station's home tab, but the
  beacon refused with "only from system flight" — and the player asked which flight. The
  button undocks first, then fires; the refusal text also says to undock.
- **The desk lamp lit forever.** Every journal line counted as news: dockings, barge
  approaches and the receiver's ether lines kept the СТОЛ chip at 16. Grey (`dim`) lines and
  `ether` no longer count — the ether is its own notification, on the receiver, live.
- **One line per mail answer.** "Ответ на карточку" and "Пришёл ответ на карточку" were the
  same event written twice; only the latter remains, with the ×N count.
- **The parrot, cropped and crashing.** The feather layer was sized by the window canvas
  (138×104 px after M151a) instead of the bird box (230×304 units), so the head and wings were
  cut off — the "cropped" parrot of the report. The perch also sat in the header strip of every
  screen, drawn as a stub next to the station name, and a tap there opened a window that the
  screen rule hides: canvas of zero size, `drawImage` failure in the journal. The layer follows
  the bird box, the perch is hidden on screens, and both draw paths refuse a zero canvas.

---
## 0.299.0 - M302: two guards from almanac issue II, and a trap closed

- **44 px on every screen.** The finger law used to be asserted on the pads, the rail and the
  menu only; `91zzy-screens` now walks every station tab, the cantina with the counter and a
  candidate open, the HQ, the ship and suit screens and the desk, and fails on any visible button
  under 44 px. The «?» and «В ЗАЛ» heading chips became 44 px targets with a 22 px pill inside.
- **Target chips against the layout.** The edge chips of the system view (`SYS_CHIPS`) are
  measured against the console, pads, rail, vitals and locus - the last seam of «canvas against
  markup».
- **The peek's way back syncs the group row** (`mapBack` calls `syncTabs`) - the trap PLAN named
  for the first "jump to this tab" feature.

## 0.298.0 - M301: person cards in the HQ and the crew tab

- The manager card and the hired hand's row follow the cantina's pattern (`DESIGN-screens` §3):
  words first - role, mood, what he does and on what, traits - and the figures in a block under
  them (level and experience, share and pay; for the hand: the net result first, then wages,
  experience, trips, hull and hold). No more «уровень 2 · до следующего 65 оп · доля 3.0% · оклад
  68 кр/мин из доли» inside a sentence.

## 0.297.0 - M300: the tails of the screens pass

- **Heading cap 24.** `secTidy` splits anything longer at the first « · »; the suite asserts
  24 on every station tab; the ship screen goes through the same pass.
- **One line per compact card.** The cantina's compact hire row says role and level; the
  role's long note («держит наёмников: приказы, ремонт…») lives in the full card only.
- **The map footer stays left of the rail.** A footer line wider than the rail is split at
  « · » into as many rows as fit, instead of running under КАРТА and МЕНЮ.
- **The hauler shuttles.** A hired hand on «перевозка» flies station → planet → station on a
  slow triangle wave, instead of circling the pier at 180 units; the label still names the
  order.

## 0.296.0 - M299: the screens pass — five surfaces, headings, the map that keeps you in frame

`docs/DESIGN-screens.md`: the phone playtest of 02.09 read as one defect - a press with no
visible consequence and no visible place - and this is the pass against it.

- **НА КАРТУ works from the station.** It opened the map *under* the station overlay. Now it is
  a peek: the station hides, the map shows, НАЗАД returns to the same tab; docked state stays and
  a jump from the peek is refused («Сначала отстыкуйтесь»).
- **The map keeps you in frame.** A far rumour zooms the sheet out to fit both you and the search
  circle instead of panning you off the edge; «ВЫ · name» is a labelled teal mark, the selection
  keeps its orange reticle; when the window is dragged away an edge arrow still points at you
  and «К СЕБЕ» brings the sheet back. The sheet is dragged with one finger, pinched or wheeled
  to zoom; a far course draws hop dots every jump range and the footer says how many jumps.
- **Two names untangled.** «ИМЯ СИСТЕМЫ» left the board (its subtitle read as the captain's
  name and players typed their callsign into it); a system is named from the map card's
  «НАЗВАТЬ». The captain's name is asked in a small window from the table row «Ваше имя», is
  saved, and the table also takes a named system to «РАССКАЗАТЬ».
- **The cantina is a room, and the room is the input.** The scene is always drawn; the counter,
  the candidates, the deals and the dock regular (Рыба and friends, now labelled «завсегдатай ·
  у дока» instead of a bare name) are tap targets. Below the scene only the tapped thing
  renders - one card pattern with words first and figures under it; everything else in the hall
  sits behind «ЕЩЁ В ЗАЛЕ». A thing put on the table is answered by the barkeep in a bubble over
  the counter, then in the row. Empty table rows («лент нет», «трюм пуст») are gone; the ether
  line on the table is called «Новость из эфира», not «слух».
- **Headings name, notes explain.** `secHead()` renders a heading with a right-aligned count and
  a one-line note shown on the first visit, then folded behind «?». A post-pass splits every
  inherited «NAME · EXPLANATION · COUNT» chain: head stays a heading (≤ 32 characters, asserted
  by the new suite `91zzy-screens` on every station tab), the tail becomes a sentence-case note,
  the trailing number a counter.
- **The board in three lanes.** К ВАМ / ЗДЕСЬ / ДАЛЕКО, sections sorted by having a verb, seven
  per lane above the fold.
- **The flight HUD no longer shows through open screens** (the locus line and the pod were
  legible through the HQ header's glass).

## 0.295.0 - M298: three interface fixes from the playtest of 30.08

`docs/DESIGN-ui.md`, «Three fixes queued from the playtest» - measured then, built now.

- **The table in the cantina answers.** Each row says what the move is for («НАЗВАТЬ ИМЯ — вас
  начнут узнавать на этой станции»); the reply replaces the button in the same row, in the
  speaker's colour; silence reads as an answer («посмотрел и промолчал — это тоже ответ»); under
  it, the trace that used to be invisible: «место вас запомнило · записано в тетрадь, ЛЮДИ». One
  move per thing per visit, and the reply's seed moves with each press instead of repeating.
- **A rumour can be aimed at.** Its address now says «отсюда 19 секторов, примерно 7 прыжков»,
  and the board's rumour rows have «НА КАРТУ»: the map window moves to the named sector and draws
  a dashed search circle of the rumour's radius - «ИСКАТЬ ЗДЕСЬ». No marker on the wonder itself.
  A course from the notebook to a far sector moves the window the same way.
- **The map gives the sky back.** The system card is a footer line - name, class, planets,
  station, distance, the plan's numeral - in place of the sector line, so the footer keeps two
  rows; the full description opens on a second tap of the same star; a double tap on empty sky
  hides the instruments, pads, console and prompt until the next touch, and the rail and the
  ether line stay.

## 0.294.0 - M297: news with a cause, rumours in other people's words, rivals on a sold road

Step 9 of the holding plan (`docs/DESIGN-holding.md` §2, §11, §15) - the layer speaks through
the world instead of a summary line.

- **News with a cause.** Laying or raising a shop is an event with an address: «„Сардразль“:
  заложен плавильный цех — железо и кремний здесь в цене», in the news and on the map pin, and
  the shop's inputs rise +0.2 at that station - the second way, after the appetite, that what
  you do lifts a price.
- **Rumours.** Once in five the ether speaks of the holding in other people's words: a system
  with two or more buildings of a family has an уклад, an adjective - «„Сардразль“-то заводская,
  туда железо возят»; and where a промысел would stand, the receiver says so - «на „Тегре“
  реголит богатый — разработку бы туда».
- **You sold a road, you bought a rival.** The legs of a sold route join the barge lanes: strange
  barges fly them, and at the destination each one takes part of the station's appetite for the
  shift - the surcharge you would have had goes to her, and the log says so.
- Tests: `91x-hold-news`.

## 0.293.0 - M296: the body - a first pass

Step 8 of the holding plan (`docs/DESIGN-holding.md` §13), taken as far as a stand and a
screenshot can take it; the codex pass proper wants the author's eye on `/dev`.

- **The station grows a body.** Every building hangs a form of its family on the station's outer
  ring (booms 40–50 against the standard modules' 22–38), drawn by the same brush and in the
  same gold as the standard modules, sized by level, smaller while under assembly - one body,
  one light, as the codex asks.
- **The barge stands at the Причал.** At a station with a Причал that lies on your barge's legs,
  she is drawn moored off the hull with a mooring line and the caption «„ТЮК“ · У ПРИЧАЛА» - the
  same art as the factor's barges, unmoving.
- **The planet has lights.** The system's first solid world gets warm points on its night side:
  three per building up to twenty-four, the whole night side from Пояс огней (28). They stand,
  they do not twinkle, and they live outside the cached disc.
- A `hold` scene in `docs/mkview.ps1` seeds a station with six buildings, a moored barge and the
  lights for `pageshot` (`?s=hold`, `&z=` for the zoom).
- Not yet: the dump by the shaft, the greenhouse dome and the landing strip on the planet;
  baking the built forms into an offscreen.

## 0.292.0 - M295: the twenty-six that change one thing each

Step 7 of the holding plan (`docs/DESIGN-holding.md` §10, families E–I). Every building that
does not eat or make cargo is wired to exactly one hook in another module, read through one
door - `bldHas(sx,sy,id)` - and a test holds that each of the twenty-six is asked.

- **Хозяйство:** Накопитель doubles the hopper and the share ceiling (the one ceiling modifier);
  Контора writes the neighbours' prices within four sectors to the paper «со слуха» at docking;
  Касса changes scrip without a spread; Причал lets the barge load herself from your промыслы at
  that leg, at 0.7×; Диспетчерская, with the factor seated, gives the ether a voice about empty
  hoppers and uncollected share.
- **Флот:** Ремонтный док −30% on repair; Заправочный узел −25% on fuel (the market header now
  prints the real price); Мастерская services wear to a yard's floor on trade and yard stations;
  Ангар - the system's drones never break down.
- **Люди:** Дом приезжих +2 hire candidates; Учебный пункт ×1.5 on the good tails of a run from
  here; Медпункт - rest twice as fast, ransom a quarter cheaper; Отдел кадров +2 manager
  candidates; Артель - the errand is always posted and pays +25%; Красный уголок - loyalty does
  not fall while you are docked here; Столовая halves the bad tails.
- **Оборона:** Орудийная батарея - the blockade drops a level at every check; Дозор marks the
  pirate foci that have not yet flared within five sectors on the map; Дружина - one fewer foe in
  every room of a boarding here; Заграждение halves the ambush on approach.
- **Знание:** Обсерватория doubles a sky report filed here; Филиал −15% on tech at a science
  station; Архив puts the system's chronicle on the board; Личный причал works the hours off the
  hull while you stand; Радиомачта makes the system a relay of your own («МАЧТА-N»);
  Метеостанция names the weather on every body before you land.
- Where the design asked for what the code does not have - hands at a boarding, traces per
  system, hours at docking - the effect was replaced by the nearest honest one and the design
  says so. СТРОЙКА shows these rows by what they do; ДЕЛО lists them as «работает».
- Tests: `91x-hold-fx`.

## 0.291.0 - M294: your own barge

Step 6 of the holding plan (`docs/DESIGN-holding.md` §12). The author's «собрать баржу, нанять
туда пилота и сделать маршрут», out of parts the game already had.

- **A barge is a hire on a hauler hull with the order «баржа».** The hull is any `hauler` - the
  «Вьюк» by allocation or a yard's; the route is your own, walked at least once, with at least one
  of your shops on it. Otherwise the order is refused in words: what hull, what road, whom to feed.
- **She feeds, she does not trade.** Once a shift she reaches the next leg and tips what she
  carries into your shops' hoppers there, up to three shifts of their quota; a blockaded system
  she skips with one line. She brings no money: the pilot's wages run as any hire's, a minus in
  his line, and the return is the share that grows while you are elsewhere. Nothing is simulated:
  elapsed shifts in, units in hoppers out, no position stored.
- **You load her at the counter.** ПОГРУЗИТЬ takes from your hold what the shops on her legs
  eat, up to her hull's capacity (150 on a «Вьюк»); ВЫГРУЗИТЬ gives it back. An empty barge says
  so once. Her name is from the cargo row - «Тюк», «Куль», «Кладь», «Волокуша», «Шаланда»,
  «Плашкоут», «Дощаник».
- ДЕЛО lists her with the holding, not with the hires: what she carries, where she goes next,
  how much she has fed. The hire whitelist in the save gains her legs, cursor, shift mark and name.
- Tests: `91x-hold-barge`; `91zzw-holding` prints §16.9.

## 0.290.0 - M293: the measurement

Step 5 of the holding plan: `tests/91zzw-holding` prints the layer against §16 of the design and
holds three of its targets as rules - the first share no later than forty minutes after the site
opens, no tier-1 shop paying back faster than two loops or slower than nine, a route long enough
for a chain of five stations. What the printout said, and what changed because of it:

- **Assembly of a tier-1 shop is one shift, not two.** Two shifts of assembly plus one of feeding
  was an hour; §16.8 asks for forty minutes. Tiers 2 and 3 take three and five.
- The rest is a report, per line: plain trade in credits per minute on a «Стриж», the best and
  the worst tier-1 shop per shift and per unit of hold, the share against trade per unit and per
  hour, payback in loops by tier, the промысел's discount, the station's own appetite against the
  best share. Numbers are printed so the curve is turned by a printout and not by feel.

## 0.289.0 - M292: the ladder visible

Step 4 of the holding plan (`docs/DESIGN-holding.md` §8, §13). The number existed since M291;
now it has names, and it can be seen.

- **Thirty names in six five-year plans**, РАЗВЕДКА → КОЛЬЦО, each with one line of what now
  stands. Six starred rungs carry an effect and are the only ones that do: Буй (5, the automat
  answers on the air), Замкнутый цикл (10, docking patches the hull by a tenth for nothing),
  Монтажная площадка (11), Литейный модуль (15, a second site), Промышленный узел (20, tier 2
  and a third site), Узел трасс (25, tier 3), Кольцо (30, they hail you by the name you gave).
  Every effect is read through one door, `rungHas`, and a test holds that each ★ is asked.
- **The ring on the map** appears at Буй and grows by a segment per closed plan, a notch from
  Рубеж, a column of amber lights beside it for the buildings. Stars merely flown through stay
  bare. The footer gets the plan's Roman numeral and nothing more.
- **Moments, not numbers.** On docking, what you climbed since last time is said once - the top
  rung and every ★ passed, and «СИСТЕМА ПЕРЕШЛА В III ПЯТИЛЕТКУ — МОНТАЖ» at a plan's edge. The
  word «ступень» is not used anywhere the player reads. The ДОСКА carries one line: name, plan,
  what stands, how they call you here.
- Sites and tiers now open through the ★ rungs rather than bare numbers, and a locked tier says
  which plan opens it.
- Tests: `91x-hold-ladder`.

## 0.288.0 - M291: the site, the hopper and the share

Step 3 of the holding plan (`docs/DESIGN-holding.md` §3, §6, §9, §10). The author's sentence
made real: «не по рецептам, а если ты возишь, то тебе производят».

- **A system has a rung, computed from what you did there** - visits, landings, shafts, base
  cells, a retaken sector, a name, a settlement, a home, drones that finished, deposits drilled,
  cargo you docked with, buildings. Nothing new is stored beyond three small deed counters. At
  eleven the **монтажная площадка** opens (one site; two at 15, three at 20), gated on a landing,
  a drilled deposit and a drone. The counter's word for you changes with it.
- **82 buildings designed, 56 shipped** - the four cargo families as one constant `BLD` on one
  mechanism: 8 промыслы that make into a stock sold to you at 0.7×, 22 цеха of tier 1 eating raw
  goods, 18 of tier 2 eating tier 1 (rung 20), 8 участки of tier 3 (rung 25, the Стапель at 22).
  Each row has its quota, intake → output, cost and where it may stand; **no building eats what
  its own system makes** - the site says «здесь это и так делают».
- **The hopper.** Feeding a shop is selling at its station: your units go into its hopper (up to
  three shifts of its quota), each shift it eats them and credits you the same share of its output
  under your name, up to three shifts' worth - then production is nobody's until you come back.
  What you did not bring, the world brings; no fleet is simulated. Sold units the shops ate do not
  push the price down.
- **46 industrial goods** in `RES` with `ind`: invisible to the market, the drones and the errands,
  sold only into a shop that eats them at a shadow price; the hold row names the nearest eater.
- **СТРОЙКА** - a tab under ВЛАДЕНИЯ, no new section: what stands and what it owes you (ЗАБРАТЬ,
  ВЗЯТЬ from a промысел, СДАТЬ В ЦЕХ), what can be laid down here with its price, and one line per
  reason for what cannot. Levels ×2/×3 cost the shop again plus Станочные линии. ДЕЛО lists every
  building; the station grows a family form per building, sized by level.
- **ПЕРЕПЛАВКА is gone** (fork 2б): `SMELT`, the smelt tab and its premium are deleted the day the
  Плавильный цех can pay alloy; alloy also still comes from the base's Плавильня.
- Tests: `91x-hold-site` - the table's integrity and shadow prices, the rung from counters and its
  gates, the §10.1 rule, laying down, the hopper's shift, its ceiling, collecting, the промысел's
  stock and discount, industrial goods into a tier-2 shop, save/load.

## 0.287.0 - M290: «БЕРЁТ» - the station's appetite, and the layer's clock

Step 2 of the holding plan (`docs/DESIGN-holding.md` §0, §4). Until now every price move the
player could make pointed down; a price rose only on news.

- **One clock for the layer.** `HOLD_SHIFT` = 20 minutes of real time; nothing ticks, whoever
  reads catches up from `Date.now()`. A shift is what a quota is counted in.
- **A station eats by its type.** A combine takes iron 10 · silicon 6 · titanium 4 per shift,
  a yard titanium 6 · iridium 2, a science station crystals 3 · isotopes 4, a trade node organics
  6 · ice 8, an outpost ice 6 · organics 4, a bazaar silicon 4 - only what it lists. The first N
  units of a shift pay **+35%**, the rest the ordinary price and the ordinary pressure down.
- **The surcharge adds, it does not multiply**: `marketPrice(sys,k,add)` puts it inside the same
  clamp as pressure, so it stacks with the need and the factor's monopoly without breaking the
  1.8 ceiling. `marketFor` is now a loop over that one function.
- **One object called demand.** `normsOf(sys)` lists the need (one delivery, +100%) and the
  appetite (per shift, +35%) as norms of one shape; buildings will add theirs in step 3.
- **The row tells the truth before the button.** A hold row on such a station says «берут первые
  6 по 15 кр, остальное 11» and its sum is the real quote (`sellQuote`); the ПРОДАТЬ button goes
  gold; the toast names how many went with the surcharge. The ДОСКА gets a «БЕРЁТ» block with what
  is left this shift; the ether says who pays extra nearby.
- Stored: only what you sold into the appetite this shift, in one map `G.hold["sx,sy"].ate` -
  the layer's single save field, loaded through `asMap`.
- Tests: `91x-hold` (first N at +35%, N+1 at the base price, the shift resets, the sale consumes
  the norm, the quote equals the sale, save/load, drones sell plain); `91zzw` prints the
  «холдинг» line.

## 0.286.0 - M289: the route is an order, not a calculator

Step 1 of the rebuilt holding plan (`docs/DESIGN-holding.md` §2, revised the same day against
`docs/CRITIQUE-holding.md` after the author settled its forks: 1б, 2б, 3б, the fleet later).

- **A leg only where you saw the prices.** `В МАРШРУТ` refuses a station whose price list you
  have not taken on docking, and the map button says `ЦЕН НЕ ВИДЕЛИ` before it is pressed. A
  note heard on the air does not found a leg. The leg **copies the note into itself** and is
  priced by it - not by the live market of any star on the map - and a stale note shows as a
  widening fork: «титан 41…58 · записи 6 дн.». The price paper no longer evicts a station that
  is a leg of the live route.
- **The map changes from the first leg.** A number on the star after the first tap, the next leg
  filled and its line brighter, the footer «СЛЕДУЮЩЕЕ ПЛЕЧО · «Сардразль» · 2 прыжка · везём
  титан», and when that star is selected the jump line reads `ПРЫЖОК ПО МАРШРУТУ`. Flying stays
  unconditional: КУРС and В МАРШРУТ are two verbs.
- **The station knows.** First rows of ТОРГОВЛЯ on a route station: «ПО МАРШРУТУ · сдать титан
  ×18» and «ПО МАРШРУТУ · взять титан ×18 - 41 кр/ед · трюм 18/32», one button each, honest when
  short: «денег хватит на 11 из 18». Goods can now be **bought** at a counter (`buyCargo`): at a
  6% spread over what the station pays, always at least one credit dearer, and every purchase
  raises the station's *ask* (`m.ask`, decays with pressure) - the buy price only, so
  sell-buy-sell at one counter loses and «цены растут» where you take from.
- **Only a walked road is sold.** The price is two average loops of what the route actually
  **earned you** (`G.trade.earned`, written on every sale of a leg's good at its station, never
  under a ×2 need), not before two loops; the factor takes a route only after one. A sold road is
  remembered as its set of legs and is not bought twice (two shared legs = the same road).
- `ROUTE_MAX` 4 → 6, so a chain of five stations can exist. Old saves load: a leg without a note
  writes itself one from the paper or from today's price.
- Tests: `91u-route` rewritten - refusal without a note, the heard note, the first-leg footer,
  the fork, the paper's eviction rule, earned/loops/sold-sets, the counter's spread and ask.

## 0.285.0 - M288: the desk is a desk again

The last of the three forks the author settled from almanac issue II, and the largest: not
sections like the station, but the drawn table the release design named in M151a.

- **The top level of СТОЛ is a picture, not a strip.** Eighteen tabs in one row were not a
  decision but a sediment - one per milestone, each right on its own: 777 px of strip inside a
  393 px window, six visible, and the chosen one could sit off the edge. Now things lie on the
  boards: the notebook, the folder of cases, the clipboard, the torn recorder strips, the
  papers, the record book, the album, the postcards, the shelf, the winter diary, the
  receivers, the game, the report. Each is drawn, each is tapped, and a thing the player has
  not got yet does not lie there at all.
- **The notebook carries its own three bookmarks** - ЭФИР, БОРТ, ЛЮДИ - poking out of the top
  edge, because that is exactly what they are. Inside a thing the strip shows only that
  thing's tabs: three for the notebook, two for the clipboard, none for the rest, where a strip
  of one button would be a lie about there being a choice. `← СТОЛ` in the footer goes back to
  the table; Escape climbs one step rather than closing everything.
- **The lamp is a pool again.** Baking the boards at `.22` in the centre and `.06` at
  mid-radius lit the whole panel evenly and the table read as cardboard. Low and close now:
  warm under the lamp with the grain visible, dark at the edges - so a thing separates from
  the boards by tone and not only by its outline (§16 of the almanac).
- **РЕЙСЫ left the desk.** A drone is not paper. The routes were already in ДЕЛО (M286); now a
  route opens its machines there, in place, instead of sending the player to a table on the
  other side of the interface. `renderFleetRuns` is gone with its tab - a renderer with no way
  in is the same debt as a perk with no code.
- `91zzzzd-desk` guards it: the desk opens as itself, a thing that is not there does not lie
  there, a thing's own tabs and no others, the way back, and every one of the twelve drawings
  surviving a call.

---
## 0.284.0 - M287: an empty map comes back from the cloud as a list

The M285 guard did its job: the author reloaded, played, and the journal said out loud what
the first crash could not - "Запись не влезла в строку: раздел «poiSeen» вынут · poiSeen
через край · log 13 КБ · tape 10 КБ". With the section named, the whole chain is visible.

**The chain.** The cloud is PHP (`site/api.php`): `json_decode($raw, true)` turns objects and
lists into the same type, and `json_encode` prints an **empty** map back as `[]`. So every
`{}` in the snapshot - and there are dozens - returns from a cloud round-trip as an **array**.
`applySave` waved it through, because `typeof [] === "object"`. After that one look at a
monument is enough: `poiInspect` writes `G.poiSeen[q.seed]`, and `q.seed` is `hashi(...)>>>0`,
an unsigned 32-bit number. `arr[3000000000] = 1` sets the array's length to three billion, and
the next `JSON.stringify` honestly prints three billion `null`s - `RangeError: Invalid string
length`, thrown inside the frame. Both of the author's crashes (crystals at 20:36, the
accelerator ring at 23:23) came directly after a line reading "Осмотр: …". That is not a
coincidence; it is the mechanism.

**The quieter half of the same bug.** Any other map that came back as a list kept working -
`arr["ключ"] = 1` sets a property - but `JSON.stringify` of an array does **not print
non-index properties**. Prices seen, station reputation, mine shafts, bought parts, deals
done: everything written after a cloud round-trip was dropped from the next save without a
word. Nobody would ever have found this by looking; it only reads as "the game forgets
things sometimes".

- `asMap()` (14-save) turns a list back into a map on load, and all thirty map-shaped fields
  go through it. One place, on the way in, so nothing downstream has to know.
- `poiInspect` heals a live session too: a run that started before this build does not have to
  be restarted for the write to be safe.
- A cloud pull now stores **our** normalised snapshot locally instead of the shape that
  arrived.
- The rescue message names a section once, not once per autosave - the author's screen carried
  four identical lines within seconds.
- `91zzzzb-save` walks the whole path: it turns the empty maps of a real snapshot into lists,
  loads that, examines a monument, and checks both that the map is a map and that the save is
  a save. It fails on the old code.

Left standing, on purpose: the server still re-encodes `{}` as `[]`. Fixing that means either
storing the save as an opaque string or decoding it twice, and `api.php` holds live accounts -
the client is now proof against it either way. Written down in `docs/DEPLOY.md`.

---
## 0.283.0 - M286: ДЕЛО - one screen for everything that works for you

Chosen by the author from the forks of almanac issue II: one screen, not four places; the
crew screen as a roster leading to a card.

- **One question, one address.** "What is working for me right now?" was answered in four
  places - mercenaries in ЭКИПАЖ, managers in ШТАБ, drones in СТОЛ → РЕЙСЫ, bases in
  станция → ВЛАДЕНИЯ. Each was right when it was added; together they were what the author
  called porridge. **ДЕЛО** (`27n-ui-deal`) is a summary, not a control panel: one line per
  worker with its state and its money, and the line leads to the screen that actually
  commands it. It opens with the money answer - "МАШИНЫ ПРИНОСЯТ ≈ N КР/МИН · ЛЮДЯМ
  ПЛАТИТЕ M КР/МИН" - counting only what the game already computes; bases hoard ore, not
  credits, so no credits are invented for them.
- **The drawer is five doors again**, the number the release design (M151a) named: КОРАБЛЬ ·
  ДЕЛО · СТОЛ · В ДОРОГУ · НАСТРОЙКИ. ЭКИПАЖ and ШТАБ were two of the six; they are one now.
  The door carries a mark when something has stopped - an idle hand, a drone under blockade -
  so a stalled holding is visible from flight and not only from an opened screen.
- **ЭКИПАЖ is one man's card.** It used to render every mercenary in full, one after another:
  order, risk, trip history, hull assignment, four module rows with explanations. One man was
  more than a phone screen and four made a scroll in which "which of them is idle" could not
  be answered. The roster moved to ДЕЛО; here you command one, and there is one.
- **No ghosts, and 44 px.** Measured before: with one hired hand and no spare hull the crew
  screen had eight buttons, seven of them disabled, all seven 31×40 px - under the law, and
  all dead. СЛЕДИТЬ is now absent unless the man is in this system; a module's − and + are
  absent unless they can move a level; if nothing can move at all the three rows collapse to
  one line that says so. `.act.sm` is 44×44. Guarded by `91zzzzc-deal`, which checks both
  screens for disabled and undersized buttons - the 44 px guard used to walk only the pads,
  the rail and the drawer, which is how this stood.
- **ФОТО no longer lingers over a screen.** The console throttles itself to about one update
  a second, which is right for the ether line and wrong for a world button that must vanish
  the frame a screen opens over it.

---
## 0.282.0 - M285: a save that cannot kill the flight, a star that dims as you leave, a footer that measures the frame

Playtest 30.08.2026, from the author's phone: a journal line reading "Сбой кадра: Invalid
string length · surface"; "the interfaces are all shifted and overlapping"; "check how the
drones work, how the mercenaries work - on my save they never flew anywhere, it is not
clear"; "when you fly away from the star it is bright, like a halo, and when you fly
towards it, it dims".

- **A save can no longer take the world down with it.** `saveGame` called
  `JSON.stringify(snapshot())` bare, from inside the frame (autosave, and `rareTake` after
  a rarity is found). One over-grown field therefore threw `RangeError` *in the frame*: the
  frame guard (M234) caught it and the game walked on, but from that second it wrote
  **nothing** and said nothing about it. `saveText` (14-save) never throws. It weighs the
  snapshot field by field, drops the one that will not serialise, names it in the journal
  and in a message, and writes the rest; above a megabyte it warns once with the three
  heaviest sections by name. The cloud push went through the same bare stringify inside
  `fetch` and now shares the guarded text. Guarded by `91zzzzb-save`, which poisons a field
  with the author's exact error and checks the flight still lands on disk.
- **A crash now says where it happened.** `crashSay` printed the message and the mode -
  "Invalid string length · surface" names neither a function nor a line, and finding the
  culprit costs a session. It now lifts the two innermost named frames off the stack, so
  the journal line carries an address.
- **The star's glow no longer flashes when the star leaves the frame.** The off-screen
  bleed switched on the moment the star crossed the edge, and switched on at full strength:
  measured mean frame luminance at zoom 0.16 was 17.4 up to 12 star radii and **25.4** at
  20 - a 46% step exactly where the player expects darkness, and a hole when flying back
  in. The threshold was the bug: light has no thresholds. The bleed is now a very wide,
  very weak corona in world coordinates with a hollow centre (the real corona already
  lights that part), so it cannot trip over the edge of the screen: 19.2 / 19.0 / 18.2 /
  16.9 / 16.5 across the same distances, and the near-star frame is within 2% of what it
  was.
- **The map footer is measured, not guessed.** The system card and the jump lines were laid
  out from `PAD_SAFE=104`, while the prompt, the ether line, the pads and the right rail
  are DOM with their own layout. On a 393x830 phone the prompt lay across the system
  description, the ether bar covered "ТЕЛ · ВИДОВ · кр", and the card's corner ran under
  КАРТА and МЕНЮ. `HUD_FLOOR` and `HUD_RAIL` are now read off the DOM once a frame, beside
  `HUD_BAND`; the footer stacks upward from them, the card takes its height from its own
  wrapped text, and the two columns drop into one when they will not fit side by side. The
  map publishes its rectangles (`MAP_BOX`) so `91f-ui` can compare canvas against markup -
  the guard that could not exist before, because half the interface is painted, not marked
  up.
- **The chosen tab is no longer parked off-screen.** The desk carries thirteen tabs: 777 px
  of strip in a 393 px window, six visible. РЕЙСЫ is the eighth, so a player looking at
  the fleet saw no highlighted tab at all. `tabsSync` scrolls the chosen tab into view on
  the desk and the station, and the strip fades at its right edge while there is more to
  the right.
- **Drones stop under a blockade, and they used to stop silently.** Thirteen machines
  deployed, the system taken by pirates, and the only signal was that the money stopped.
  The stop and the restart are now said once per **system**, not per machine, and a stalled
  drone says why in РЕЙСЫ instead of pretending to be under way.
- **A hired hand who cannot work says so.** A mercenary needs a spare hull; with none, the
  hire buys a person who sits in the list forever. The hiring board now counts free hulls
  before the money is taken, and after five minutes of idling the man himself says once
  that he has no ship, no order, or a broken hull.
- **"ОСМОТРЕНО · КРИСТАЛЛЫ КРИСТАЛЛЫ x7"** - the place named itself twice when the find
  repeated its name. Named once now.

---
## 0.281.0 - M284: one house, a marker that tells the truth, and grass at human scale

Playtest 30.08.2026: "the house is drawn like crap... check the markers, the house is
right there and it says 2000-something metres... and it turns out you can't get into the
house"; "when you have picked up a distress signal and a planet drifts past, you can't
land - it says the signal is already taken"; "some grass in the foreground is enormous".

- **The house was drawn twice, in two different places.** `21c-built` still had the old
  placeholder - a brown box with a pitched roof and a `ВАШ ДОМ · ступеней N` label - while
  the real house with its terrace, yard, garage and lit window (M170, `21f-home-out`) stood
  at its own spot a couple of thousand metres away. The navigator marker and the door are
  both computed from the *real* one, which is why the box had no door and the arrow pointed
  away from it. All three complaints were one bug. The placeholder and its drawing code are
  gone; the house outside now has exactly one owner. (The old block also showed the house on
  *any* planet of the home system, since `G.home.pIdx` is never set by anything.)
- **A spent find no longer holds the ДЕЙСТВИЕ prompt hostage.** `findInteract` claimed the
  prompt within 240 units and returned "taken" even when it had nothing left to offer, and
  the planet check sits below it in the list, so landing was unreachable. An examined find
  now only labels itself and yields. An unexamined one yields too when a planet is already
  within landing range - it is not going anywhere, and the player should not have to fly the
  ship away from a planet to be allowed to land on it. Same fix for a searched barge wreck.
- **Foreground grass is measured by a human again.** A tuft was up to 178 px of blade against
  a 17 px astronaut - a plant ten human heights tall, black, across the middle of the frame
  where the player and the prompt live. The foreground here is 1.24x closer than the camera,
  so it is entitled to be a quarter bigger, not ten times. Blades are now three and a half to
  six human heights, rooted at the bottom edge, and they never reach the player or the hint.
  Each blade also got the lit rim the file's own law demands of every silhouette - without it
  the tuft read as black sticks rather than a plant.
- Two new stand scenes for looking at exactly these: `?s=homeout` (the house from outside)
  and `?s=fgrass` (the stand hunts down a foreground tuft instead of hoping one shows up).

---
## 0.280.0 - M283: the cantina you can read, and a rumour that is a sentence

Playtest 30.08.2026, verbatim: "in the cantina nothing is clear at all - you scroll down,
the thing you have to poke is up top, down below you pick something, no idea what is
happening. The screen jumps to the top when you click." And: "the rumour text makes no
damn sense."

- **The screen no longer jumps.** Every click inside a station tab rebuilt `$body` from
  scratch and the scroll went back to zero with it: answer a person in the fifth row and
  you are staring at the header again. `renderTab` now keeps the scroll offset for the
  same tab and only resets it on a tab switch or a new docking. This is a station-wide
  fix, not a cantina one - the market, the board and the crew tab had it too.
- **Selecting someone in the hall no longer hides everyone else.** The pick used to filter
  the list down to one card, so a tap answered by removing two thirds of the screen. It
  highlights the row instead - and the row itself is now clickable, because the hall and
  the list are the same people.
- **The cantina has an order.** It ran up to fifteen identical-looking blocks in a row,
  with the world news *before* the hall - the first thing a visitor read. Now it answers
  three questions top-down: who is here (the hall), who can be hired (the counter), what
  is on offer (the tables); then what you do with your hands - the digger, dominoes, the
  desk; news last, because it is reading, not doing.
- **Buttons name the action.** A bare `4 141 кр` became `НАНЯТЬ · 4 141 кр`, `ЛЁД ×120`
  became `ОТПРАВИТЬ · ЛЁД ×120`, `ПОГОВОРИТЬ` became `РАССПРОСИТЬ`.
- **A rumour is a sentence now.** It used to read as four fragments glued by full stops,
  each starting lower-case, with the source signed at the end like a painting and the
  address written `-9:18` - which reads as a time. It now follows the order people
  actually speak in: WHO said it, ABOUT WHAT, WHERE to look, WHY you would believe them.
  The address always carries the word `сектор`, the spread is words (`в 3 секторах
  вокруг`) rather than a `±` that appears nowhere else in the game, and the teller's
  gender no longer contradicts the detail (a barmaid used to "swear on his mug").
- **A rumour is written down.** Reading the board logs it once per station and three-day
  bucket to the desk, page ЛЮДИ - the player no longer has to copy a sector onto paper.
- **"A rumour for a drink" now buys a rumour.** The deal charged 500 and gave one
  decorative line about "strangers in the next arm" with no place and no sector behind it;
  its `intel:1` was dead code and its button printed the price twice (`КУПИТЬ СЛУХ · 500
  · 500 кр`). The dispatcher now names a real place out of the station's rumours, and it
  lands on the ЛЮДИ page like anything else a person says.

---
## 0.279.0 — M282: the playtest pass — what two hours as a player found

A full player session (menu → land → mine → wreck → anomaly → station → jump → SOS →
belt → broke) surfaced nine wounds; all fixed:

- **The dock forgot everything.** Autosave ran only in free flight, so repairs, refuels,
  sales and hand-ins made while docked vanished if the game was closed at a station
  (reproduced: −416 кр repair rolled back on reload). Autosave now also runs docked and
  on the surface, and undocking writes a save to pair with the one docking already wrote.
- **The gas giant killed the ignorant.** A ship left alone sank and burned from 100 to
  wreck with no instruction. At 100% heat the prompt now names both exits («ТЯГА — ВВЕРХ /
  ВЫХОД»), and an automatic abort surfaces the ship at 18% hull — the burn stays a lesson,
  the wreck is reserved for real crashes.
- **The wreck message was a riddle.** «Аварийный ремонт · трюм был пуст» never said the
  repair is *paid in cargo*; now it does («терять было нечего» / «груз потерян (N ед)»).
- **Rarities lied about where they were.** Any surface POI granted its rarity «на
  памятнике» — found at a ship wreck or an anomaly, the card read like a bug. The find
  card now names the actual place («здесь: остов корабля»); the collection keeps bucket
  addresses.
- **Board needs flickered away.** A need window was 3 in-game days — three real minutes
  (CEL_DAY=60 s), so «Энтурикс · лёд» became «кристаллы» while the player was still
  docked, and no need could outlive the flight to it. NEED_WIN 3→15, ORDER_WIN 2→6.
- **Severance was a surprise.** РАСЧЁТ (fee×.5 + 15 min wages) exceeded the hire fee and
  showed up only after hiring; the hire card now states «расчёт при увольнении N кр».
- **«1 РУК».** Wall/cave hand counts now decline properly (pl3) in all four strings.
- **The belt ground hulls in silence.** Contact damage had a .22-alpha flash and nothing
  else; 45→28 went unnoticed. A hit now sounds (throttled sfx) and ongoing contact
  overrides the prompt: «БОРТ СКРЕБЁТ О КАМЕНЬ · КОРПУС N — ТОРМОЗ И ОТВЕРНИТЕ».
- **Acquitted:** repeat organism scans are per-individual (each pays once — checked, by
  design), an idle merc eats no wages (confirmed «итог 0»), and the dev stand being six
  versions behind prod is deploy hygiene, not code (republished).



All screens walked (station tabs, СТОЛ, оснастка, штаб, доска, кантина, Вега, radio, menu,
settings, intro) with three overlay scenes added to the stand (uimenu/uiopts/uikeys — overlays
are frames too). Findings and fixes:

- **The intro was honest only to keyboards.** The controls table showed «Q E», «ПРОБЕЛ · C»,
  «R · F» to every hand — on a phone those keys don't exist. Now the phone sees its own pads
  («▲ · ТОРМОЗ», «РЕЗАК · ОГОНЬ»), and the roll row — which has no pad — isn't shown there at
  all (no ghost instructions).
- **The open menu dimmed nothing.** Half of КАРТА glowed through the panel's glass — dirt.
  Opening БОРТОВЫЕ СИСТЕМЫ now silences the right rail (opacity .12, no pointer events), the
  same «экран чистый» discipline the pads follow.
- **The settings glass was a shopwindow over a shopwindow.** At .93 opacity a bright station
  bled orange through the option rows. Desktop screen glass raised to .965–.985 — the sheet is
  a sheet (§3), identity kept.
- **Acquitted with reasons:** ВКЛ/ВЫКЛ toggles name the state, not the deed — they are cockpit
  switches, and a switch shows its position (the verb law governs action buttons, not levers);
  hidden ЭКИПАЖ/ШТАБ menu rows before unlock are progression, not ghost buttons; СТОЛ, оснастка,
  штаб, доска and radio passed as built (M264 verbs live everywhere; money stays gold-right;
  the band labels got their squeeze fix in M274).

---
## 0.277.0 — M280: the second expedition — six new laws, two brought home

A new research run outside the project (`DESIGN-craft.md` §11–16, sources listed): Persian
miniature (even light + pattern density is the honest regime for interiors — the furniture debt
should be paid with pattern, not fake shading), Dutch doodverf (the P4 grisaille plan confirmed
as guild law: values first, colour as glazes — gradePass is our final glaze), ukiyo-e bokashi
(a horizon gradient has the width of a brush, not a percentage of the frame) and the key block
(«тело, обвод» confirmed as printmaking law), portolan charts (a map earns beauty by being
steerable), day-for-night cinema (underexpose two stops, blue by Purkinje, sky separate, RIM on
silhouettes), and Adams' zone system (look()'s philosophy, 80 years early: judge tone as
controllable steps; expose dark scenes for the shadows).

Two laws went straight into the game:
- **The chart is an instrument (§14).** The galaxy map now carries a portolan rhumb web —
  sixteen bearings radiating from the current system (the four cardinals a touch louder) over
  a hidden construction circle, under the stars, over the galactic band. A course reads as a
  bearing at one glance.
- **The night rim (§15).** Night silhouettes melted (ledger: contrast .21) — cinema's
  day-for-night answer is the back-light rim. A cold hairline of sky now runs along the terrain
  edge at night, scaled by darkness.

---
## 0.276.0 — M279: the law × surface matrix — no more exhibition pieces

The author's charge: a rule living in three places out of ten is an exhibition, not a law. The
whole game was walked as a matrix of rule × surface; gaps closed or priced.

- **CUN reaches the base rock.** The base cross-section's «сор вдоль слоя» was flat directionless
  specks while the mine NEXT DOOR cuts the same stone with the 皴 brush. The base's grain now
  strokes along the direction field with the world's own manner.
- **Room light bleeds into the rock.** The base read as one dark mass (ledger: mass 7%) — the
  excavation's contour now carries a warm rim, light from windows and seams staining the stone;
  the rooms bind into one luminous body (empty 86→82, and the eye confirms more than the bins).
- **Clouds lean with the wind.** The cumulus drifted along WIND but stood upright — the only
  thing in the sky that ignored direction. A shear transform tilts the body downwind, kin to the
  grass, the dust and the smoke. (On close reading the clouds were otherwise acquitted:
  metaballs with two-scale erosion and a silver rim — not эллипсы.)
- **Priced, not smeared:** the raid's rock walls live in a pseudo-3D quad pipeline — brushing
  them means projecting strokes in wall UV space, a session of its own. Named in the plan.

---
## 0.275.0 — M278: five more frames off the ledger

Working the frame ledger top-down, judged by ?look before and after.

- **Карта**: the star chart was dots on darkness (mass 0, contrast .07) — the sheet now shows
  what the stars are PART OF: a milky band of the galactic plane runs aslant the map, with a
  warm core as the sheet's second temperature. Baked once per screen size. Contrast .07→.21.
- **Шахта**: the vignette gave light a place but no temperature — a saturated warm glow at the
  headlamp itself, same move as the cave. Pair 1→4.
- **Грунт ночь**: the headlamp's ground-light was near-white — neither the instrument nor the
  eye read it as warm. An incandescent tone against the blue night is the temperature pair the
  law asks for. Mass 9→12.
- **Заход**: the braking flame existed but cast NO light — the descending ship is the frame's
  one honest warm source at any hour. A thrust glow now paints the nozzles' zone and the hull
  bottom (источник у света и освещённое у источника). The staged judge misses it (its frame
  catches a non-burning moment) — the note stays in the ledger, the light stays in the game.
- **Система**: the watercolour blots' alternating colour is now always cooled — a warm nebula
  interleaves with its own cooled gas, giving the all-warm frame (тепла 99%) its second
  temperature by construction.

---
## 0.274.0 — M277: every frame gets a judge — and the belt gets its Milky Way

The author's standing order (30.08): the rules now judge WHOLE FRAMES, not elements — and the
critic must flog his own work hardest. This leg builds the judge and fixes the two worst frames.

**?look — the frame judge without hands.** `lookAll()` existed but only in a live console. Now
`drift.html?look` runs the full scene tour and POSTs the verdict table to the stand (same
discipline as ?g11 — no virtual time for a heavy sync pass), and `docs/lookrun.ps1` prints the
JSON. First full table, honest and ugly: 8 of 11 frames fail «холодный ключ + тёплый акцент»
(pair 0–8%), пещера and пояс fail four of five laws, карта has mass 0%. The one exemplary frame:
черпак газов. The table is the per-frame work ledger now (PLAN.md).

**The cave gets warm air.** The lamp's circle was a neutral hole in the darkness — the frame had
no second temperature and no middle mass. A warm glow inside the light radius gives both at once
(pair 0→5, mass 2→8, contrast .14→.23 — direction confirmed, more to come).

**The belt sees its own ring.** The frame was a black field with rocks: mass 3%, pair 0%. Now —
the law that already governed the system view (M242: an off-screen star still bleeds its light
into the frame) reaches the belt, lit facets add the star's warmth quadratically, and the belt
itself is VISIBLE as a band across the sky — from inside the ring you see the ring, like the
Milky Way, warm toward the star and nebula-cold away. Four recorded self-critique failures on
the way: a thread instead of a band (wrong model — far arc, not the plane's horizon), a garland
of discs (round caps on fat segments — literally «кругов дохуя»), total invisibility (a
zero-length gradient when the star sits on the view axis), a three-striped flag (hard-edged
passes). The fifth laying — seven soft steps — stands. Belt contrast .20→.34 ✓; rocks now
silhouette against the glowing band.

---
## 0.273.0 — M276: the belt rock stops being plastic

Style rework, second leg. A belt facet was a flat fill — the codex's own words about what makes
stone read as plastic. Close, large, lit facets now carry dry grain strokes laid along their own
longest edge (the facet dictates the direction of laying — andamento seen facet-wise), and the
single brightest facet takes one hard движок glint (§1 stage 5). Distance keeps its LOD
discipline: far rocks stay clean fills, and a per-frame stroke ceiling (140) protects the belt
budget. Deterministic per facet — no shimmer under rotation beyond what the turning facet
itself does.

---
## 0.272.0 — M275: the style rework begins — watercolour clouds, hard light by count

The author lifted the old brake («по правилам весь стиль переделывай») and called out the truth:
the loudest research findings had never reached the frame. This leg carries two of them, with
the draft→critique→redo passes recorded honestly.

**§6 — the nebula gets edges (watercolour).** The codex diagnosis verbatim: «честный шум, но у
него нет краёв». Now the system nebula's baked composition carries Hobbs blot stacks: one
skeleton polygon per blot, each layer its own deformation, variance assigned PER SEGMENT and
inherited — so one edge of a cloud is crisp and another dissolves in a fan of layers; colours
interleave instead of blending. **The first laying failed its own critique**: 24 layers at .04
in lighter piled into two opaque pink gouache slabs across half the frame — notan killed, the
sky's loudness budget trampled. Redone three times quieter and half the size, with real
per-layer scatter; now they read as dense gas masses sitting IN the sky. Baked once per system —
the frame pays nothing.

**§1 stage 5 — движки on the terrain edge.** The most-looked-at line in the game — the ground
edge the astronaut walks — carried one uniform white glow. Final light is not a stretch: hard
bright marks laid BY COUNT, only on slopes that face the drawn sun, brighter at noon, gone by
dusk. The rock edge glints instead of glowing. And the cliff's 皴 strokes finally speak at full
voice near the lit rim (the first laying was uniformly timid — the author said «изменения не
вижу» and was right), fading with depth like the rock itself.

---
## 0.271.0 — M274: the polish circle — three modes join the album, the language learns to count

The polish pass went where no album had looked.

**Road, winter and spa enter the stand.** Three whole modes had never been screenshot — only
the fps probe visited them. They join `shots.html` through their own honest entries (`winTake`
builds a real contract, spa assembles `enterSpa`'s fields, the road matches the probe). The
frames themselves acquitted: the winter room's lamp cones and panel, the spa deck with railing
shadows, the road's aurora field all hold the laws — and the M264 verb-buttons show everywhere
(СДАТЬ СМЕНУ, СПАТЬ).

**Two collisions caught on the new frames.** The «ЗВЕЗДА · 700» edge chip sat exactly on
«МОЖНО ПРОСТО УЙТИ ИЛИ ПРЫГНУТЬ» — the chip inset now measures the live prompt DOM and stays
above it. And on a Vega-squeezed receiver the scale read «НОЧНАЯ ПОЧТАСЛУХИ» — the night-mail
label shortens to «почта» when the strip is under 300 px.

**The language learns to count.** Four hand-rolled pluralisations, three of them wrong:
«1 прыжка» (needs board and Vega's own line), «1 станция получили», a 21-year record reading
«21 ЛЕТ». One honest `pl3()` in the core now serves jumps, stations, years, world types and
drones — with the 11–14 and 21 cases under test. A typo sweep over every player-facing string
(missing ё, double spaces, hyphen dialogue, homoglyphs, double dots) found nothing else — the
texts were clean.

---
## 0.270.0 — M273: the 10×10 audit closes — the boulders grow their lichen

Second half of the ten-by-ten audit. The last law with an open, solo-closable gap was §10
(grown, not parameterised): the cave grows lichen since M262, while the boulders upstairs — by
light and moisture — stayed bare. Large boulders on living worlds (terran, jungle, ocean,
toxic) now grow 1–2 differential-growth lichen patches (`growLichen` reused from 22a), clipped
to the boulder body, tinted by the world palette, flattened along the upper face. Baked into the
ground chunks — the frame pays nothing.

The full pass-by-law verdict table lives in the session report and PLAN.md; the codex ledgers
already carry the summary. Standing refusals after two full circles: §8 recursion (P9b — needs
eyes over many settlements), §4 raid-prop shadow masks (bakeable per entry; a session of its
own), §6 menu backdrop nebula (a title card, not a scene), §9 notebook (needs the author).

---
## 0.269.0 — M272: the 10×10 audit — the cliff learns the brush, the sky seam is caught

First half of the ten-passes-by-ten-laws audit (graphics passes + the full text/fork audit).

**§5 reaches the cliff.** The cut under the relief — the largest area of a daytime frame — was
the last rock without the 皴 brush: cave (M263) and mine (M267) had it, the surface didn't.
`drawGround` now lays CUN strokes along the direction field in the chunk bake, free per frame.

**The rectangular sky seam — hunted down.** Loose ends carried «rectangular seams of the sky
layer, seen on two screenshots, never chased» — it surfaced on the ice-storm album frame: the
sky-nebula tile (`skyNeb`) is drawn as a stretched square whose fbm alpha never reaches zero at
the borders, so a pale RECTANGLE hung right of the sun. Two sins in one body: the tile now bakes
an oval fade into its own alpha (no seam anywhere, one-off cost), and its hardcoded alpha now
multiplies `dim` — the «weather silences the sky» law (M266) had never reached the nebula, which
glowed through a dust storm as on a clear night.

**The full text-and-fork audit (все 108 историй, каждая развилка).** Verdicts: every fork obeys
the hard law (no trace names the player as cause), the kim-relay cross-confirms kim_paid_by
honestly. Fixed: relay_kim's scene sat on an undocumented `seat:"mid"` silently falling to
centre (now "far", and the lint validates seats); the a-file format header never documented
`when`/`unless`/`else`; d-file story numbers 101–106 collided with c-file's 101–102 (renumbered
103–108, bench_view is 109); two_window got its named refusal (pair-inevitability class). And
the fork law is now MECHANICAL: `storyLint` rejects any trace text matching «потому что вы…» /
«из-за вас» — the suite guards what was until now a discipline.

---
## 0.268.0 — M271: the second circle of critique

The whole pass again, harsher. Four catches, one acquittal.

**The day giant was a watermark, not a sphere (seventh rework).** The «пол по небу» clamps
lifted both lit and shaded sides toward the air and the terminator collapsed to ~30 internal
units — under the .42 daylight alpha that is seventeen on screen, i.e. a flat pale circle with
an edge (the author's «кругов дохуя» in its purest form, caught on the lights scene). After all
the floors, the day side must now beat the night side by 72 internal (≈30 on screen): the disc
reads as a lit body again, its light facing the drawn sun.

**СБОЙ in the rooms scene — the stand broke the crew contract.** The shots stand built crew as
bare `{name,role}`; `crewHas` read `c.traits.some` and the frame guard printed «СБОЙ · reading
'some' · HOMEIN» on every frame. In the game this is impossible (hire and load always produce
the array); the stand now hires real mercs (`genMerc`). The M270 «home hangs headless» tail is
also closed: not a hang — a rare predicate («первый твёрдый — землеподобная») scanning 40 rings
generated thousands of systems synchronously while virtual time stood still. The scan is capped
and falls back.

**Prompts name controls that exist (П0).** The cave said «A D — ИДТИ · W — РАНЕЦ», the mine
«W A S D — КОПАТЬ», the fauna «ОГОНЬ (F)» — on a phone none of those keys exist, and on desktop
a rebound key made the bracket lie. New `ctlHint`: pads by their own names on mobile
(«◀ ▶ — ИДТИ · ▲ — РАНЕЦ», «ВВЕРХ · ВНИЗ · ◀ ▶ — КОПАТЬ»), live-bound key labels on desktop.

**Acquitted:** the scoop's dashed «ПОЛОСА СБОРА» — its file already records the argument and
the verdict («линейка или газ — спор решается в пользу читаемости»), and the dashes run with
the flight. A decided design is not re-litigated by taste.

---
## 0.267.0 — M270: the through-pass closes the marathon (П10)

The full album (20 scenes, headless) was walked against the eight audit laws and the ten craft
laws; both codices got a marathon ledger so the next session knows DONE from designed.

What the album showed: the verb-buttons of M264 live everywhere (ПРЫЖОК on the map, УХОД С
ДОБЫЧЕЙ in the raid hangar); the wide system frame carries one line per orbit and a station
with a body; the sun is a body on approach. No new circle offenders found in map, station,
cantina, HQ, raid, mine, base, belt.

Measured, honestly: `?g11` on this loaded dev machine read 35–60 across modes, lower than the
morning's 43–60; the deep probe (`-Deep`, pass-by-pass noop) decomposed NONE of it into any
single pass — variance ±5 fps, no outlier. Verdict: ambient load, not a regression; **re-measure
on a quiet machine** goes to P0 (the probe's own doc warns exactly about this). Two more P0
tails from the walk: the «home» stand scene hangs headless Chrome reliably (worth one deliberate
hunt — something may spin under virtual time), and the «смотритель…излишек» suite flake from
M266 still stands.

Left for the author, with prices named in PLAN.md: the glyph notebook (P7b), «неделя счисления»
as S6, and the S5 fork — mercs have no figure for усталость; either portraits or the axis goes
to managers.

---
## 0.266.0 — M269: stars streak under way; a postcard makes a place visited

Fourth leg of the marathon (П7 · П8 · П9 · С3).

**П8 — the law finally reaches the starfield.** «Движение, а не мигание» was written into the
rules on 27.08 and never implemented: stars twinkled at full thrust exactly as at anchor. Now a
moving camera stretches every star into a streak along its own parallax vector (near layers
stretch more), twinkle dies with speed and stays a property of standing still. The motion
vector is taken as the frame-to-frame difference of the existing arguments — every mode gets
the law for free, and a mode switch (camera jump) is guarded from painting streaks.

**П7 — checked and acquitted.** The named precondition held the pass: do the base rooms clip?
They do («ничего не вылезает в породу», 21aa:389) — which means the room clip already masks any
lamp glow, no destination-out volumes needed, and the rooms have carried their own lamps since
M247. The cave's CUN moved into the mine a leg ago. Nothing left to do under П7 but write this
down.

**П9 — measured, not styled.** The phone half of the interface is the risk zone; the mobile
suite (390×844) runs green — 12054 checks. No taste-driven HUD churn without an author's gripe.

**С3 — the postcard deed.** New key `card` backed by `G.mailed` (written on a successful
`mailSend`, both system and planet keys, persisted): «отправил карточку этого места» — the
snapshot went to the common mail, and the world saw it. Its story: *bench_view* (№108) — a
viewing bench on a science station; mail a card from there and people start coming («говорят,
где-то это место видели»), never mail one and the bench gets removed for want of sitters.
Nobody ever says «после вашей карточки». Deed-turn count 9, suite floor raised. `sat` refused:
sitting is a scene the game shows, not a deed it remembers.

---
## 0.265.0 — M268: the corridor is light, the shadow rises to meet the ship

Third leg of the marathon (П5 · П6).

**П6 — the approach stops being CAD.** The landing guide was a 3000-px dotted vertical — a
draughtsman's line. Now the landing system is *light*: a narrow column over the pad, wider and
fainter with height; a runner light descends the axis toward the pad (movement, not blinking —
and the movement itself says where down is); the pad is a body with a warm edge and two slow
edge beacons. One narrow trapezoid fill — the frame pays nothing. And the ship's shadow now
**rises to meet it**: during descent a ground shadow grows under the lander with altitude, so
height is felt through the ground, not the altimeter.

**П5 — acquitted with evidence.** The factory already smokes from its one живая труба, tanks
are polygonal cylinders with hoops (the file itself wars on perfect circles), towers carry
crowns, ribs and ladders; POI glow is a designed light source. «Работа видна» holds. No churn
for churn's sake — the pass closes on inspection, and the smelter's curl-noise smoke stays on
the author's effects list where it was.

---
## 0.264.0 — M267: strata lie flat, the mine learns the brush, the wall remembers a hand

Second leg of the marathon (П4 · С2).

**П4 — rock is a body, not wallpaper.** The oldest debt in Loose ends: surface strata were
drawn at a fixed depth below the terrain of each column — geology followed the relief like
wallpaper, and a cliff read as a striped wall. Strata now lie on a near-horizontal datum (four
fifths flat, a fifth of the profile left as drape) and the relief CUTS them: valleys shave the
upper layers off, the full column lies under the peaks. Mineral veins moved to the same datum.
And the mine learned the 皴 brush table (`digCun`): the same CUN grammar the cave got in M263 —
hemp-fibre strokes on sedimentary worlds, axe-cut on volcanic, ribbon on ice, rain-dot on sand —
along the direction field, baked into the rock tiles for free.

**С2 — the wall remembers the hand.** New deed key `wall`: signing a stone (`wallSign`) now
also writes `G.walled[place]` into the save — «я здесь расписался» is a player decision and
persists locally, while the wall itself stays on the server. First reader: *commission* — the
commission that stares at walls and writes lines now leaves a paper that contains, among the
lines, one sign like the one on the stone by the counter — if the player's mark stood there
before they left. Nobody says «because you»; the player recognises their own hand, or doesn't.
Refusals named in place: *null_cabin* (Гедеван is reserved by P7 — the paid shortcut to the
glyphs), *semyon_walk* (the game doesn't remember long walks; a memory for one story is the
kim_debt class). Deed-turn count 8, suite floor raised.

---
## 0.263.0 — M266: the census of circles (П3)

The album (all scenes, headless) was walked looking for every naked circle. Three offenders
fixed; the rest acquitted by name.

- **Weather now silences the sky bodies.** The shafts' law («в вакууме лучей не бывает; осадки
  глушат») never reached `drawSkyBodies`: in a rainstorm the neighbour giant stayed a pale
  circle whose atmosphere rim outlived its body — a bare ring in the sky. Sky bodies now fade
  with `weatherPower` and vanish past heavy weather.
- **The star's off-screen bleed** (system view) had a mid-stop kink drawing a faint ring — the
  same disease as the old sun glow. Power-curve stops now (`bleed2`).
- **The surface sun glow** got 12 stops instead of 8 — piecewise-linear alpha was still able to
  gather into faint banding rings on clean skies.

Acquitted, with reasons written here so the next census doesn't reopen them: the space star's
glare ring (deliberate «очень ярко» sign, 16a), the cave lamp's ellipse (M258's language),
the day-sky giant (six author-driven reworks settled on «тело обязано отличаться от воздуха» —
it stays visible by decree), lamp dots of the glow worlds (lamps are round).

Also noted for P0: the «смотритель: энергия…излишек» suite flaked once (green on rerun, twice).

---
## 0.262.0 — M265: the sun becomes a body, an orbit becomes one line, five turns hear the deed

First leg of the critique marathon (П1 · П2 · С1).

**П1 — the star from the ground.** The sun was a perfect circle with an alpha cliff at the
edge plus a three-stop radial glow whose .12 plateau drew a concentric RING — the exact circles
the author pointed at. Now: the glow falls by a smooth power curve (and in vacuum shrinks to a
tight corona — nothing scatters there); the disc is baked per altitude step with limb darkening,
a soft edge where there is air, a crisp one where there is none; near the horizon it flattens,
reddens and its lower edge is eaten by haze (extinction).

**П2 — one orbit, one line.** M242's comet-tail arc was drawn on a CIRCLE of radius `p.orbit`
while a second pass drew the true Kepler ellipse — every eccentric planet dragged two mismatched
rings. The circle is gone; the fade and the tail now live on the ellipse itself
(`orbPathOf`). The station ring speaks the same language: a whisper of a ring, a tail dying at
the station. The station itself got a hull plate — a dark octagon with an outline under the
modules («много кусков — одно тело»), so at map zoom it reads as a thing, not orange confetti.

**С1 — five turns read deeds (fork never shown).** New condition key `tinfed` (the Tin's
`T.last` is written only by a full order from the player's hands) and a mirror key `any`.
Reworked: *tin_feeders* — the path to the machine overgrows unless the player ever set it
running; *shoal* — the hunter pays for exact times, and a postcard strip of this shore IS one:
photographed — the shoal gets hunted, didn't — he leaves with nothing; *baker_oven* — if the
player ever laid cargo on the Baker's table, the oven door arrives in what was brought;
*forty_two* — she lands only where the player kept landing («мы ей свет оставляем»). Refusals
named in place: *twins* and *busy_freq* stay calendar — inevitability is their point
(two_on_orbit class). Lint now understands flags read through `none`/`any`; the suite counts
deed-turns (7) and the number must grow with С2–С3.

`?g11` after the leg: 43–60 fps across modes on a loaded dev machine, no regression expected —
the system view strokes strictly less than before, the sun is a sprite blit instead of a
per-frame gradient.

---
## 0.261.0 — M264: the button hears the whole prompt; the mouse reveals the pads

Two first-five-minutes bugs, both caught by the author on one screenshot.

**The dead ДЕЙСТВИЕ button.** The button lit up only when the prompt *started* with the word
ДЕЙСТВИЕ (`^`-anchored regex in `27z-telemetry`). Half the game writes the verb elsewhere:
«СИГНАЛ БЕДСТВИЯ⏎ДЕЙСТВИЕ — ПРИНЯТЬ СИГНАЛ», «САНАТОРИЙ · ДЕЙСТВИЕ — …» — distress signals,
gas-giant scooping, boarding, the barge, the relay, the map jump, the cave mouth, the mine, the
greenhouse, the raid hangar, the base build prompts. In every one of those states the keyboard
worked (Space bypasses the button) while phone and mouse players stared at a prompt inviting
them to press a button that was greyed out and click-dead. The verb is now recognised anywhere
in the prompt. One prompt mentioned an action as *reference* («у устья ДЕЙСТВИЕ — наружу», shown
deep in the cave) — reworded so information doesn't light the button. Suite grew the exact
regression cases.

**Pads faded under the cursor.** On desktop, `mousemove` faded the pad row out — so a mouse
player literally could not click a pad: approaching it made it vanish (opacity .14). Author:
«кнопки пусть не исчезают». Now the mouse *reveals* the pads and only the keyboard fades them:
took the keys — clean screen; touched the mouse — buttons are back. The phone behaviour
(never fade) is untouched.
## 0.260.0 — M263: the wheel owns the world; the brush knows the rock

Two fixes, both author-driven.

**The wheel.** Ctrl+wheel and the touchpad pinch (the browser sends it as the same event with
ctrlKey) triggered **page zoom**: the whole interface scaled away and the player saw a bare
world with no instruments — caught live on the prod by the author. The old handler was
`passive:true` and could not block it. Now browser zoom is suppressed everywhere over the game;
the gesture is handed to the world where the world can zoom (system view), and world zoom by
design never touches the instruments (M221 — the DOM lives on its own ruler). A plain wheel
over DOM stays with the browser: lists must scroll. If a browser is already stuck at page
zoom, Ctrl+0 resets it once — the game cannot do that for it.

**皴法.** The cave grain (M253) was laid in one manner on every world. Mountain painting has
kept a table "rock → brush" for centuries and it fits as-is (`CUN`): sedimentary worlds get
long soft fibres (披麻), volcanic — short chopped strokes with scatter (斧劈), ice — even light
ribbons (折带), sand — stippled grit (雨点). The same rock mass on different worlds is now
*made of different stuff*, with no caption anywhere.
---
## 0.259.0 — stories: `hand` reads the story's place, not the player's (author-caught hole)
---
## 0.258.0 — M262: the lichen is grown, not drawn

P9's first piece (DESIGN-craft §10, inconvergent's differential growth). Every organic thing in
the game is parametric — a formula swaying on a sine. The cave lichen is the first thing that
is **grown**: a closed ring of eight points iterates three rules — long edges split, close
points repel, every point creeps outward against a bounding disc — and crumples itself into
lobes the way a real lichen does. Nobody draws the folds; they emerge. Ten rosettes per cave,
computed once at entry (deterministic from the cave seed), drawn as three passes of one
contour — matte body, brighter rim, condensed heart — flattened against vault or floor. This is
stage 点 of the four-stage rock: dots of growth over finished texture, inside the cave's
loudness budget — the lichen does not glow.

P7's first half. `SETTLE_GLYPH` was the Elder Futhark — a real alphabet with known sounds, and
any player who had seen runes read the settlement pidgin as f-u-þ; the constant violated its
own comment ("знаки, а не буквы"). The runes stay in the strings as **carriers** (indices —
saves and the wire don't change), but they no longer reach the eye: every sign is now **drawn
by a grammar** — six asymmetric radicals × four operations (identity, mirror, half-turn,
underline) = 24 signs, the Siromoney/kolam construction. The eye picks out families and
operations — the language visibly has a structure — and there is nothing to pronounce.

The bridge sits in the one door all DOM text passes through — `setTx` — plus the journal line,
the postcard back (dark ink on paper, its own colour) and its glyph picker. Glyph canvases bake
at ×DPR×UIK per the panel-raster rule. Full suite and the mobile layout guards both green.
Second half of P7 — the notebook that collects sightings, understanding as player state — is a
design pass with the author, queued.

The third deed-fork, and the first one that reads the hull's biography. Мадам Крапива sits at
the door with a ticket and watches pilots; a hull carrying four repair seams (M256) is living
proof that people fall and come back. Then she does not buy a ship — one day she simply asks a
barge to take her. The ticket stays on the empty seat, and that is the whole text; the
connection is never named.

New condition key `none:[...]` — "before the turn" is now two non-states when a turn has an
else-outcome, so the waiting traces gate on both. Two decisions of the same pass, recorded:
«Двое на одной орбите» stays calendar-driven **deliberately** — it is a story about
inevitability, and a deed would spoil exactly that; Ким's debt got no fork — no deed in the
story's fabric reaches it, and forcing one is worse than none.

Reconnaissance for the glyph grammar (P7), written down for the next session: the runes flow
through `settleLine` into `say`/`tell`/`hud` as plain text — the fix needs a glyph painter plus
a text-to-fragment bridge in those three renderers, and a narrow-screen check; not an
end-of-day edit.

P6 opens (`DESIGN-story-craft.md` §1). Measured before the work: 108 stories, 18 turns, and
every single turn had the same shape — *seen it, days passed*. No story in the game ever turned
because of something the player **did**.

A turn now takes `when` (fires only while true — waits, never burns) and `unless` (if true at
the due date, the turn quietly does not happen: an `else` flag is set, or a mute marker). The
condition dictionary is the traces' own `STORY_WHEN` — deeds are what the game already
remembers, not new bookkeeping — plus two new keys: `hand` (this system's settlement taken
under the observer's hand) and `seams` (the hull's repair biography, M256 — people can see it).

**The iron rule of the language: a fork is never shown.** No text says "because you did X" —
the player finds things other than they would have been, and cannot know it.

Two forks live already: «Второй стакан» — keep returning to that node (four visits) and
Ноль-семь is waited out: the two glasses stay, the queue starts bringing two; «Лампа на
площадке» — a postcard mailed *from this place* means someone saw the lamp, and the dispatcher
keeps lighting it. Suite 400 guards the mechanics; the story lint checks else-flags are read
and turn conditions exist.

P5's first slice (DESIGN-craft §4). The lamp somebody left on the cave floor glowed in a
circle straight through stone — the far side of a column lit up the same as the near. Its glow
is now a **baked mask**: the same gradient, with shadows eaten out by `destination-out` — a
quad projected from the lamp past every marching-squares edge within radius. O(edges), and
since neither the lamp nor the rock ever moves, the mask bakes once per cave; the light's
breathing is a globalAlpha at blit time.

Named cost, kept deliberately: the player's own headlamp still shines without shadows — it
moves every frame, and a per-frame mask would cost the frame more than the shadows are worth.
The мох glow is a surface patch, not a beam; it needs no occlusion.

Движки reach the live game (P3, DESIGN-craft §1). The cave's wet rim was one uniform stroke
along every contour — a gradient's kind of light, stretched instead of counted. Now the
marching-squares pass also collects horizontal edges by orientation (floor k=3, ceiling k=12),
and a counted few of them get a hard two-tone glint: a puddle's spark on the floor, a hanging
drop under the vault. World-keyed, baked into the tile, capped per tile — sparks, not a
garland. The uniform rim stays underneath as the отборка layer; the pair is exactly the icon
rule: a soft pass, then a few hard marks.

Named and skipped: the hull does NOT get движки — it already carries three discrete lights
(the spine gleam, the light kant of the edge, the greeble lamps), and a fourth would be
decoration, not need.

Repairing and servicing were two different things; now there is a third — wearing. A hull
patched at a station keeps a **visible weld seam**: a light bead over a dark underlay, bent in
two, drawn inside the hull clip on top of the налёт. Servicing strips the grime; nothing ever
strips the seams. A ship through ten repairs reads as a veteran even washed clean — the hull
wears its biography openly, the way the record book is written by others (kintsugi;
`DESIGN-story-craft.md` §7).

Stored per hull as a repair **count** (cap nine — after that new seams lie over old): the
hole's position is ephemeral and is not persisted, per the game's rule; the seam pattern is
deterministic from the hull seed and the seam's number, so old seams never move when a new one
appears. New save field `seams` with a safe default — old saves load with clean hulls. Suite
399 guards the contract: counts per hull, the cap, survival through snapshot/applySave.

Third consumer of the direction field, and the close of P2's raster half. The system nebula's
fibre layer (the ridged pass that keeps it from being a blurred blob) was isotropic — combed by
nothing. Now a coarse 9×9 direction grid is computed once per bake (cos/sin stored — an angle
does not interpolate across ±π), and each pixel's fibre coordinate is rotated to the local
flow, with a higher frequency across the stream than along it: the gas is combed by a current
(andamento, DESIGN-craft §2). The budgeted bake keeps its 2 ms slices; the per-pixel cost is
one bilinear lookup and a rotation.

Also found on inspection, recorded rather than redone: the grass already bends to **one wind**
— `21e-surface-draw` leans every plant by a travelling wave (`G.t*.028+pl.x*.05`), and the
per-plant phase is individual flutter on top. That P2 consumer was satisfied before the plan
named it.

The second consumer of the direction field: each dust grain bakes its flow angle from `dirAt`
into `dustTable` (the M253 rule holds — the field is never sampled in the frame), and the draw
adds a slow drift along it, the same world current on all three layers so parallax divides it
by depth on its own. About 4 px/s at the near layer: parked, the void now lives — neighbouring
grains travel together, a current rather than a shimmer — while flight speed is an order louder
and cannot be confused with it. Motion, not twinkle.

`dirAt(x,y,seed,scale)` lands in `01-core` (DESIGN-craft §2/§5): the angle of flow at a point,
taken from the *isolines* of fbm — the gradient turned a quarter — so streamlines never cross
and flow coherently, combed rather than scattered. Every noise in the game was isotropic; a
fibre, a scratch, bedding could not be expressed at all.

First consumers:

- **The cave rock** (`drawCaveRock`): short two-tone strokes along the field, world-keyed and
  seeded by the planet — tiles join, nothing swims, and it bakes into the tile so the frame
  pays nothing. The stone had form and light but no *material*; now it has a lie of the rock.
  Laid before the depth blue-black, so depth dims the grain too — down there it is dark.
- **The mine's mineral veins** (`digRockPass`): the angle comes from the field instead of a
  fresh random per stroke — veins of one seam flow together, with a small scatter kept.

Queue for the primitive, per the combined plan: dust flow in `16a`, one wind for the grass in
`20`, nebula strata, the andamento background.

The postcard's underground and vacuum kits get their craft brushes, completing P1:

- **Dry brush along the bedding in `pcStrata`** (cave and mine share it): short two-tone
  strokes that follow each band's own tilt — the grain's direction is what says "rock" instead
  of "striped fill". The cave's rule holds: stone underground is grey, the strokes are mixes of
  the same base.
- **The galaxy behind the void** (`pcNebula`, shared): the belt's own comment always said the
  void is not black because the galaxy is at your back — now it is visible: two-three
  watercolour thickenings in deep blue and rust along one diagonal, under the stars. Belt and
  orbit cards both. A layer at 4% has no edge, so it reads as a thickening, not smoke.
- **Cloud banks in the gas giant's air**: three washes between the bands. The kit's hard rule
  survives — air has no sharp edges anywhere — because the wash's layers don't have any.

Own seeded generators everywhere: the stars, bands and feathers of already-taken cards do not
move. First cut measured too faint in the belt (raised to 4.2%) and too loud over the bands
(cut to 4.0%) — judged by eye on a five-card sheet, two passes.

The first promotion out of the atelier: `grainPass` (19c) bakes its 64×64 tile from
`blueNoise()` ranks instead of white `h01`. White noise has low-frequency clumps — neighbouring
grain dots gathered into specks, and on a flat fill the film grain read as dirt; blue-noise
ranks are evenly spread by construction, which also makes a better anti-banding matrix for the
star's corona (the original reason the grain doubles as dither). Same cost — the tile bakes
once — but the cold bake is 77 ms, so it now runs in the title screen's idle half-second after
load instead of landing on the first gameplay frame as a stutter at СТАРТ.
---
## 0.246.0 — M250: the postcard atelier — four craft brushes proved on the card

P1 of the combined plan: new techniques are proved in `drawPostcard` first — isolated, seeded,
cheap, measured — before any live mode gets them. Four went in (helpers split to
`25g-post-craft` along the печать seam):

- **Blue-noise print grain** (`blueNoise()` in `01-core`, void-and-cluster style sequential
  fill): the white-noise sprinkle clumped into pairs and read as dust on film; the blue tile is
  an even scatter, and one tile for every card — the print was *meant* to be identical across
  the album, and per-seed dust quietly wasn't.
- **Watercolour clouds** (`pcWash`): a stack of low-alpha deformations of one polygon replaces
  the radial-blob cluster. The old fix's rule stands — a 4–6% layer has no contour — but the
  edge now varies from soft to firm instead of being uniformly wool.
- **Движки** (icon painting, DESIGN-craft §1): up to seven hard bright strokes on sun-facing
  crests, lifted off the кромка line — placed by count, not by gradient. First cut merged into
  the кромка and vanished; brighter, thicker, offset.
- **Dry brush along the bedding** (§5, 皴-lite): short strokes that follow the strata's own
  `follow` law — relief at the surface, flat at depth. Two tones (crack-dark, bedding-light);
  a single mid-tone had no strength against the strata fills.

Warm card: 5.2 ms measured (budget was 17). Determinism suite green — the card still draws
pixel-identical twice. The five underground/vacuum kits keep the shared print; their washes are
the next atelier pass.

`look()` gains the notan measure (research: `docs/DESIGN-craft.md` §3): value is quantised to
three steps inside the same pixel walk; `mass` is the share of the second-largest step — does
the frame have a counter-mass — and `edge` is the share of transitions between neighbouring
samples — shapes or grit. The `empty ≤45` target repeated the warm-target mistake one line
below that mistake's own post-mortem: open space is *obliged* to be empty, as an ice world is
obliged to be cold. Measured across eleven scenes (mass 6–43, edge 3–11): a mass target at the
watershed, 14, fails exactly the scenes the eye had already named in the loose ends — the map,
the belt, the cave — and passes the empty-but-shaped system and home. `edge ≤18` is a guard
against crumble, not a goal; `empty` stays in the table as a content number (M248).
---
## 0.244.0 — M248: the cave gets narrower, and gets a light of its own

Three ways out of the cave's emptiness were written up for the author; he said do all three. Two
are in, and the third is deliberately not — with the reason.

- **Narrower galleries.** The corridor was 44–70 units wide with a man 17 tall: the walls never
  reached the frame together and the cave read as a map rather than a place. It is 30–52 now, and
  the rock threshold went up (0.47 → 0.53), so the halls between the carved passages are smaller.
  Passage is not at risk: galleries, shafts and the mouth are cut AFTER the noise, as they always
  were.
- **A light of its own.** The cave had exactly one source — the lamp on your helmet — which is why
  the world seemed to end at the edge of its circle. Now there is cold moss on the vault, breathing
  slowly, and a lamp someone left on the floor: warm, with a pool, a body, a bail and a lit glass.
  The second is also a trace of a person — somebody walked here before you.
- **The camera was NOT moved closer**, and that is the honest part. Bringing it in ran straight
  into the rule from M217: the measure of this world is a man, and one of his heights means the
  same thing in the mine, on the surface and in the cave. A test guards it. Breaking that rule for
  one scene costs more than the scene gains — the tighter feeling came from the narrower gallery
  instead.

The numbers moved little (empty 85 → 83, contrast 0.14). The cave is still the emptiest frame in
the game, and the next step there is not lighting but what fills the rock: side passages worth
walking into, water, bones, another person's marks.

Tests: 398 suites green, phone pass included.

---
## 0.243.0 — M247: the home gets a window, and the doorways stop being panels

Two things in the one room the game calls yours.

- **There were no windows on the ground floor at all** — "upstairs a window, downstairs none". So
  the house had no cold source anywhere: the meter read 99% warm and a pair of 1%, a room lit by
  a lamp and nothing else. It also contradicted the outside, where the ground-floor windows are
  lit from the yard. Every second room now has one: night sky, stars, and a cold spill on the
  floor beside the lamp's warm one.
- **The doorways read as pale panels.** The previous pass honestly drew the neighbouring room
  through the opening, but filled the whole thing with ONE light tone and washed it with warm to
  the ceiling — at normal zoom that is a slab with a hairline frame, not a passage. Through a door
  you see a wall in shade, so the far wall is now DARKER than the near one; the floor past the
  threshold is clearly lighter; the warm from next door reaches only the bottom; the reveal of the
  wall's own thickness gives depth, and the hairline frame is now a wooden jamb with a lintel.

Tests: 398 suites green.

---
## 0.242.0 — M246: the cave's far wall moves, and one of my complaints was wrong

- **The far wall of the cave was glued to the glass.** `drawCaveFar` painted a screen-space layer:
  a cluster of blobs that never moved, whatever the player did. Walking through a cave with a
  motionless backdrop is why the mode felt like a drawing. It is a world-space tiled layer now,
  drifting at 38% of the camera, built from the same rock as the walls, with distant masses and
  columns running floor to ceiling.
- **The darkness lets a little through.** At 0.76 alpha with a ceiling of 14 on the tint it buried
  everything outside the lamp — the far wall, the columns and the material never reached the
  screen. A cave must be dark, not empty: you should be able to guess at where you are going.
- **A correction to my own audit.** I had written that the plants are "one silhouette repeated
  eight times" and proposed an L-system. Measured before building it: four to five species per
  planet, the commonest at 29%. The generator already obeys the rule of origin; the impression
  came from two big specimens standing near the camera in one screenshot. No L-system was needed
  and none was written.

Honest result: the cave's numbers barely moved (empty 86 → 85, contrast 0.15 → 0.13). That is
the finding, not a failure of the fix — **the cave's emptiness is composition, not lighting**: the
galleries are wide, the camera is far, and most of the frame is rock that no light will ever
reach. Fixing it means narrower galleries or a closer camera, which is a design decision and is
written up in PLAN for the author rather than guessed at here.

Tests: 398 suites green.

---
## 0.241.0 — M245: rope and cloth on Verlet, dust in three planes

The author sent links to other people's demos — cloth you can pull with the mouse, smoke, orbital
particles — with "people have already invented this for us". Right; what you take is the METHOD,
and you hang it on things in the world rather than on a black background.

- **Verlet integration** (`18d-verlet`): a point remembers where it was, velocity is stored
  nowhere, a link is one subtraction. Thirty points and three constraint passes cost microseconds
  and give what nothing in this game had: sag, inertia and an answer to the wind — the same `WIND`
  that bends the grass, so nothing swings out of step.
- **What it replaced.** The headframe's cable was a parabola with a sine — a rope with no weight,
  swinging like a metronome; it hangs now. The home's mast was a two-pixel stick with three
  crosses; it has two guy-wires that sag and sway. And there is **laundry on a line** in the yard:
  the first real cloth in the game, and the trace of life the house was missing — the five passes
  scored it 2/5, and washing is hung by a person.
- **Dust in three planes** in the system view: near motes fly, far ones barely move. Depth comes
  from the different parallax, not from the number of particles — the count was cut from 70 per
  layer to 46 after the first version cost a millisecond for three percent less emptiness.

Two lessons from the measurements, both written into PLAN: one cache keyed by length is a trap
when three callers want three lengths (the dust table was rebuilt every frame — five milliseconds
out of nowhere), and `globalAlpha` per particle is a context state change: set it once per layer.

Tests: 398 suites green, phone pass included.

---
## 0.240.0 — M244: grain over everything, and light on the rock in the cave

- **One film over nine scenes.** A baked 64×64 noise tile laid as a pattern in `overlay` — grain,
  and dithering at the same time: the meter had caught banding rings on the star's corona, which
  is plain eight-bit gradient banding, and noise breaks the steps. Scenes without a vignette of
  their own (system, belt, mine, cave, base, home) get one here; the ground keeps the one
  `gradePass` gives it. Measured cost: within noise of zero.
- **In the cave the lamp lights the ROCK, not the air.** It was the deadest frame in the game —
  the meter read 0% pair, contrast 0.11, 86% empty — because the only source in the scene shone
  into nothing: a wedge in the air while the floor and the walls stayed black. Now a warm pool
  lies on the floor ahead of the walker (what you see is the LIT THING, not the beam) with dust
  turning slowly inside the beam, and the cold daylight from the mouth gives the frame its second
  temperature.

Tests: 398 suites green.

---
## 0.239.0 — M243: light as a system, and the meter tells the truth about it

Stage two of the graphics work. The meter said the frames were monochrome; this is the pass that
gives every scene a second temperature and gives light somewhere to fall.

- **Shadows fall AWAY from the light.** `groundShadow` — one function under the astronaut, the
  ship, the boulders, the plants and the headframe — drew the same symmetric blob at noon and at
  sunset, which is a plinth, not a shadow. Direction and length now come from the same `SUN_DIR`
  that lights the slopes: low sun, long faint shadow; noon, a tight pool. The same for buildings
  (`sdShadow`), and **the house on a planet finally has one at all** — it was the one structure in
  the game standing on the ground and putting nothing on it.
- **A glow around the bright places (bloom).** The frame is scaled down four times, multiplied by
  itself (a threshold without reading a single pixel), blurred and added back. Three `drawImage`
  calls, measured at 0.16 ms. Lamps, windows, exhausts and stars finally light something.
- **The zenith is colder than the horizon**, and the fill light with it. Eight scenes in ten had
  one temperature because on a desert or volcanic world the sky and the ground come from the same
  family. Any atmosphere scatters the short wavelengths — even over a Martian desert the zenith is
  cooler and the shadows go blue. The horizon keeps the world's own colour, so nothing loses its
  identity.
- **At night the parked ship is alive**: a lit cabin window and a warm pool under its belly. It
  used to be the brightest thing in a night frame with no source at all.
- **The station glows.** The brightest man-made object in the system gave off nothing; now its own
  soft light lies under the hull, so it reads as windows and floodlights rather than a halo.
- **The meter's temperature test was wrong and is fixed.** Hue sectors left green — a third of
  this game's palette — unclassified, so on a green world the meter reported no colour at all.
  Warm and cold are now decided by red against blue, the way a painter decides. And the target is
  no longer "25–75% warm" (which would demand half a fire on an ice world) but the PAIR: the share
  of the smaller of the two temperatures, at least 15%. An ice world may be cold — but it may not
  be one-temperature.

Measured after the stage (contrast, p95−p5): the ground by day 0.17 → 0.48, the mine 0.26 → 0.36,
the base 0.22 → 0.41, the home 0.42 → 0.46, the gas dive 0.59 → 0.68, the system 0.09 → 0.95. The
pair now reads 40% in the base and the gas dive; the cave and the home are still one-temperature
and are the next scenes to get their own light. Frame cost: system 1.87 ms, ground 3.41, cave 0.56.

Tests: 398 suites green.

---
## 0.238.0 — M242: seven places where the drawing contradicted the world

The graphics pass began not with taste but with lies — places where the picture says one thing
and the model another. Seven of them, found by walking the game with the meter and the eye.

- **The game had two suns.** The disc moves across the sky on real mechanics (`sunSpot`→`celSun`),
  while the terrain, the clouds, the settlement, the house and every shadow were lit by a
  CONSTANT — up and to the right, always. At sunset the star sat at the left edge and the slopes
  were still lit from the right. `SUN_DIR` is now recomputed each frame from the same `celSun`,
  and the quantised azimuth went into the ground-chunk key: a slice baked at dawn no longer keeps
  dawn's light at noon. This one fix moves the light in every scene on the ground.
- **A ring with no planet inside it.** The floor under a sky body's colour was "no darker than the
  air", which on a bright day means "exactly the air": the disc vanished and only the ring hung
  there. The requirement is now a DIFFERENCE, not a floor — at least 34 units away from the air
  in whichever direction the body was already going. Measured after: body 121,104,96 against sky
  80,75,67.
- **The chimney floated above the roof.** It was placed from the ridge, but it stands on a slope,
  and on a gable roof that is always a miss upward. It now sits at the roof's height at its own x,
  set three pixels into the roofing, with a cap — and the smoke starts where the chimney is.
- **Orbits led the eye into nothing.** Full bright rings everywhere while the planet is a dot or
  off-screen entirely. The ring is now a comet tail: a barely-there full circle holds the shape of
  the system, and a bright arc burns out exactly at the planet.
- **The lander parked on the house.** The house avoided the pad by 520 px, but the clamp into the
  world's bounds could push it straight back. The gap is 760 now and it is checked AFTER the clamp.
- **The rain fell in front of everything**, ship and captions included, which made the ship look
  transparent. It has two planes now: the far drops fall before the world is drawn, the near ones
  after.
- **The station was the size of the ship** that docks inside it, and its name was printed under
  its own hull. It is 1.7× bigger, and the caption sits below the structure.

Tests: 398 suites green (two new: the disc and the light are always on the same side, at every
hour and on every world; the house is never on the pad).

---
## 0.237.0 — M241: the frame is measured now, not argued about

The author on the graphics: "something about all of it bothers me". Looking at it by eye produced
eleven complaints — that is, nothing anyone can verify. So the frame gets a meter, the way speed
got `prof()`.

- **`look()`** reads the canvas actually on screen and prints four numbers: warm % (warm pixels
  against cold), empty % (16×16 blocks holding no detail at all), contrast (p95 − p5 of value)
  and tones (hue buckets holding at least 5% of the coloured pixels). **`lookAll()`** walks every
  scene and prints the table, then puts the world back exactly as it was — a diagnostic tool has
  no right to move the player's save.
- **The targets** are declared in `LOOK_TARGET` and written into PLAN.md beside the eight laws:
  warm 25–75%, empty ≤45%, contrast ≥0.30, tones ≥5.
- **What the meter says today** (this is the baseline the work will be measured against): warm is
  0–6% or 81–99% in nine scenes out of ten — the picture is monochrome nearly everywhere; empty
  runs 26–86%; contrast 0.07–0.77; tones 2–8 of 36. The cave is the worst frame in the game
  (warm 0, empty 86, contrast 0.10), the gas-giant dive the best (empty 26, contrast 0.59).
- **Two more rules go in beside the numbers**: five passes for a THING (silhouette, break-up,
  material, light with a ground shadow, a trace of life) and the rule of origin — anything that
  occurs more than once is built by a seeded generator, never by a formula. Scored on the day:
  a hull 5/5, the house on a planet 2/5.
- The scene list moved into `28y-look` and the fuzzer now takes it from there: one list for the
  meter and the tests, or they drift apart within a month.

Tests: 396 suites green (one new: the meter measures, the sweep restores the save).

---
## 0.236.0 — M240: the economy counted, and the second hole of the same kind closed

The yard's floor (M235) suggested there were siblings: places where repetition plus credits beats
a design rule. So the whole economy was measured rather than argued about — every income channel
in credits per hour, every price, every payback. The table is in PLAN.md; here is what it found.

- **The base sold power it never made use of.** "Surplus" paid for any spare capacity and never
  asked whether the base was working at all. The best build was therefore a base that did NOTHING:
  a reactor and four solar panels, no consumers — 4 600 credits and 14 alloys in, **2 856 credits
  an hour out, forever, offline, with no attention**, paid back in an hour and a half, and nothing
  capped the number of such farms. That is the yard's hole again, one system over.

  A station now buys the SPILL of a working base: at least one live consumer is required, and it
  buys no more than the base consumes itself (`min(surplus, cons)`). The solar farm sells nothing —
  nobody runs a power line to an empty rock — and a real base earns a few hundred an hour as a
  by-product, which is what "surplus" was always supposed to mean. The perk gate (keeper, "grid")
  is unchanged.

Measured while counting (all at the starting hull, hold 40): hand drilling 90 units/min on the
ground, 108 in the belt, 68 in the mine — the hold fills in about 25 seconds, so the limit is the
hold and the flight, never the drill. A full hold is 640 credits of iron or 5 800 of crystals. The
best trade spread within three jumps is 96% (crystals 74 → 145), i.e. 2 840 credits a run. A drone
earns 576 credits an hour on iron and 5 220 on crystals, and its point holds 5 800 / 17 000 credits
before it comes home. Fuel is 11 a unit (1 100 for a full tank), repair 14 a point of hull.

Tests: 395 suites green; the base suite now asserts that a plant without consumers sells nothing
and that a working base is paid no more than it consumes.

---
## 0.235.0 — M239: the phone measured in every mode, not just on the ground

The phone layout had been checked in ONE mode — standing on a planet. The pad row changes from
mode to mode (eight buttons in the belt, others in the mine, others again at home), and ВЗЛЁТ sat
on top of the console precisely because nobody looked at the bottom floors anywhere else. The
suite now measures every mode, using the fuzzer's scene list — one list for both, or they drift
apart. It found two things immediately:

- **In the belt the console sat on the pads.** There the left group folds into a cross — two rows
  instead of one — and the row is nearly half again as tall, while the floors above it stood on
  numbers measured under a single row (pads 0–86, console 96). The numbers are the same, but they
  now count from the MEASURED height of the row: `padsFit` writes `--padsh`, and console, prompt,
  right rail and ВЗЛЁТ are offsets from it.
- **The belt's warning lamps printed over each other.** Their spacing comes from the width of the
  board, but the width of the word «СБЛИЖЕНИЕ» does not: at 375 px the three captions landed on
  top of one another and read as mush. When the step will not hold the longest word, only the LIT
  lamp is named — a dark lamp means nothing anyway — and if two are lit the caption changes
  between them every two and a half seconds. Motion, not blinking.

Tests: 395 suites green, the phone pass included (`test.ps1 -Mobile`).

---
## 0.234.0 — M238: the fuzzer, and one dispatch table instead of three

The freeze the author hit on inspecting a landmark was never reproduced by hand: four thousand
`poiInspect` runs came back clean, which means it lived in a combination of state nobody types on
purpose. So instead of guessing at it, the game now gets a net.

- **A fuzzer over every mode.** `tests/91zzzz-fuzz` sets up eleven scenes — system, map, landing,
  surface, mine, cave, belt, scoop, base, raid, home — and drives each one with random input for
  hundreds of frames, drawing every eighth. It does not check correctness; it checks that nothing
  THROWS. The randomness is seeded, so a failure repeats exactly, and the message carries the
  mode and the frame number. `test.ps1 -Fuzz 4000` runs the long version by hand; the build runs
  a short one. Measured: 33 000 frames over eleven modes, clean.
- **The same on a lived-in world.** A fresh world is nearly inert — no home, no rarities, no
  report, no drones — so half the code never runs. The second pass builds a played-in state
  (home at tier 6, forty rarities, thirty chapters, a dozen nodes, every landmark inspected, a
  manager hired, three drones in flight, one of them under repair) and fuzzes the modes the
  author actually plays. Clean too.
- **Every tab renders, every button is pressed.** A screen that throws while drawing looks exactly
  like a freeze to the player — he tapped and got nothing. Today the РЕЙСЫ row did precisely that
  on an unknown cargo key and took the whole desk with it. The suite now renders every desk and
  station tab on the lived-in world and then clicks every button inside them, catching whatever
  they throw.
- **One dispatch table.** Which update runs in which mode was written out inside `frame()`, so
  every other runner — stand, probe, fuzzer — repeated the table by hand and repeated it WRONG:
  the fuzzer called `updateDig` after the player had already climbed out to the surface and got
  three "crashes" that do not exist in the game. `stepWorld(dt)` and `drawWorld()` are now that
  table, and the frame calls them like everyone else. A button has one owner; so does a mode.

Tests: 394 suites green.

---
## 0.233.0 — M237 pass 2: four things the drones only showed once they flew

The milestone shipped as a draft; this is the self-critique pass the project owes every design.
Each of these was found by looking at the frame, not by a test.

- **A drone in a system with no station flew into the star.** `droneHome` fell back to (0,0) —
  and (0,0) is where the star is drawn. Now it leaves toward the edge of the system in the
  direction of the sector its station actually sits in: it reads as "gone to the neighbours",
  which is what is happening.
- **The name sank into the star's corona.** The caption was drawn in the cargo's own colour with
  nothing behind it; over the glare "Д-1 · ЖЕЛЕЗО" was a smudge. A one-pixel dark shadow under
  the letters costs nothing and holds the text on any background — the rim law, applied to type.
- **The dots did not grow with the camera.** A fixed 2.6 px meant that zooming in on a route gave
  you a bigger world and the same crumbs; an empty drone (1.8 px, grey) was invisible at any
  zoom. The radius now follows the camera between 0.7 and 1.8.
- **The map badge sat on the selection ring.** On your own system the count landed exactly on the
  reticle and could not be read at all. It moved out past the rings and got the same shadow.

Tests: 390 suites green (one new: with no station in the system the end of the route is nowhere
near the star, and the trip stays finite).

---
## 0.232.0 — M237: the drones fly

Until now a drone was not a machine but a piggy bank: `{sx,sy,res,rate,pool}` — a system, an ore
and a number. It had no place, no path and no trip, and the three-second tick turned "how much has
accrued" straight into credits and a journal line. Both of the author's complaints came from that
one fact: there was nothing to look at, and the desk's БОРТ tab filled with fifty lines of "Дрон
сдал 1 титан · +51 кр" (he sent a screenshot with 54 unread).

- **A drone now works in round trips.** It loads at the point, flies to the station, unloads, flies
  back. The money arrives at the unload, not as a trickle — the same credits per hour, but the
  payment finally has a place and a moment, which is what makes a moving dot worth drawing.
  A fractional hopper carries the remainder between trips, so a short leg still earns exactly what
  it earned before instead of rounding down to nothing.
- **Position is never stored — it is derived.** `phase = ((now − t0) % T) / T`, and from the phase
  come the leg, the point on the arc and the tail. The save keeps only the start of the trip and
  the repair clock; the frame simulates nothing, and the offline catch-up is the same lazy
  `Date.now()` arithmetic as the rest of the background world.
- **What you see.** A dot in the colour of its cargo with a tail that fades along its length,
  loaded bright and coloured, empty dim and grey — the direction of the trade reads without a
  single caption. The arc bends by itself as the planet moves along its orbit. Names appear only
  when the camera is close. On the galaxy map there are no dots at all, only a number by the star:
  how many machines are working for you there.
- **Routes, not drones.** A new desk tab, РЕЙСЫ: one row per route (`ТИТАН · Нейэль II → «Цициин»
  · 2 дрона · в точке осталось 360`), the machines under it with their state, and a header with
  the whole fleet and its credits per minute. The journal stops writing every sale: it now writes
  only what is worth remembering — a point worked out, a drone stopped, a drone back on the route.
- **Breakdowns repair themselves, in time and not in money.** About 1.5% per trip, more in a
  dangerous sector and more for a drone that has flown a lot. It stops at the station where it
  unloads, blinks amber (the alarm lamp is the one blink the game allows) and stands in the dock
  for eight to twenty minutes of real time — twice as fast at a Верфь, faster again under a keeper
  with the sell perk — then goes back on its own. No button, no credit. While it stands, its trips
  do not run.
- **Nothing about the economy changed:** the price of a drone, the rate, the size of a point and
  the credits per hour are what they were. This is a change of spectacle and of limits.

Measured: fourteen drones in frame cost 0.52 ms — about 0.04 ms each. Tests: 389 suites green
(four new: the trip model, an hour's income matching the old trickle to within a tenth, breakdown
and self-repair including offline, routes and pre-M237 saves).

---
## 0.231.0 — the wheel turns the world only over the world

- **Scrolling a list zoomed the map behind it.** The wheel handler hangs on `window` and asked one
  question — `G.mode==="system"` — so paging through the desk's journal with the wheel drove the
  system view into zoom behind the open screen: the list scrolled, the world was mangled, and
  nothing on screen connected the two. A wheel over any DOM (a screen, the console, a panel) does
  not belong to the world: the zoom is taken only from the canvas itself, and only when no screen
  is open over it.

Tests: 385 suites green (one new: the wheel zooms from the canvas, not from a panel, and not at
all while a screen is open).

---
## 0.230.0 — M235: the yard has a floor

- **Money bought a clean ship.** The yard removed HALF the wear for a price, and nothing stopped
  the player from pressing again: 100 → 50 → 25 → 12 → 6, five buttons and about 5 700 credits,
  and the hull was as good as new. The rule the whole mechanic rests on — "only your own garage
  takes it down to nothing" — was for sale, and with it went the reason to fly home. The author
  found it on his second evening.

  The yard now has a FLOOR and never goes below it, whatever you pay. Where you docked decides
  how low: a real Верфь takes the hull almost to fresh (18%), a trade node to a third (32%), an
  industrial combine to 38% — and everywhere out on the frontier the hands are worse (`sysDanger`
  adds up to 18 points). One press does the whole job; the price is charged for what is actually
  removed, and the row names the floor in the text, so a second press is visibly pointless.

  The floor answers the other half of the worry as well — that a capped yard means flying dirty
  forever. At 30% wear the steering and thrust lose 3.6%: not a punishment, just a reason to
  drop in at home one day, where the garage takes it to zero and charges nothing.

Tests: 384 suites green (one new: the floor holds against twenty presses, a real yard's floor is
lower than a trade node's, home still cleans to nothing).

---
## 0.229.0 — ВЗЛЁТ has one owner

- **The launch button stayed on screen after the launch.** It was shown AND hidden by
  `updateSurface` — code that does not run in any other mode — so the moment the mode changed
  (took off, went down a shaft, entered a base) the button was left hanging over space with
  nothing to hide it. Showing it is still the surface's job: it alone knows whether you are
  standing by the ship. Hiding it is the frame's, from every mode except the surface — the same
  rule ОГОНЬ and РАКЕТА already follow: a button has one owner.

Tests: 383 suites green (one new: the button lives only on the surface).

---
## 0.228.0 — M234: five things the author's phone found in one evening

The author played on a phone and sent four screenshots and five lines. Every one of them was a
real defect, and two made the game unplayable rather than ugly.

- **Inspecting a landmark froze the game dead.** Not the inspection: the FRAME. `frame()` had no
  guard of any kind, and the chain of `requestAnimationFrame` calls lived inside the frame body —
  so one exception anywhere (a mode's update, a draw, a tick) ended the chain forever. The buttons
  stayed alive, the world stopped, and nothing said why: nobody opens a console on a phone. The
  frame now catches its own exception, keeps the chain running, names the failure once on screen
  (`СБОЙ · …`) and writes it to the journal; `error` and `unhandledrejection` are caught the same
  way for everything that runs outside the frame. `CLAUDE.md` had listed "crash handling" under
  `28-loop` for a long time — there was none.
- **The jetpack was infinite.** The gauge read 100% all evening because the ground refilled it
  three times faster than flight burned it (1/90 against 1/150), refilled it even in the frame the
  player was already holding thrust, and the push off the ground cost nothing at all. Flight is
  untouched — two and a half seconds — but the ground now takes five, holding thrust on the ground
  fills nothing, and lifting off bites `JET_KICK` (8%): twelve hops on a full tank, and the needle
  moves while you use it.
- **ВЗЛЁТ could not be pressed.** On a phone the button sat 100 px off the bottom — exactly on the
  console strip (96 px), whose ФОТО button takes the taps at `z-index:5`. Leaving the planet was
  impossible. There is no room for a fourth floor at the bottom, so it moves to the left board,
  opposite the right rail. Its label also stopped erasing the hold bar: `textContent` on the
  button killed the `<i>` inside it, so holding showed nothing at all.
- **The shaft was invisible from the surface.** The mine persisted, but nothing on the ground said
  where it was — and "lay a shaft" worked anywhere, dropping the player into that same single
  mine. The mouth now has an address (`x` beside the workings), a headframe standing on it with a
  shadow, a spoil heap next to it and a target chip like the cave's; up close the prompt is
  "СПУСТИТЬСЯ В ШАХТУ", far away it says how many metres back. Saves from before this have no
  address — the next descent assigns it. The pit and the heap are painted by MULTIPLYING over the
  ground already drawn, not in a colour of their own: the visible soil is material plus light, and
  any "own" colour sits next to it as a foreign patch.
- **The footprints blinked.** Two reasons: they were capped at 150 by count while fading by time,
  so the far end of the trail vanished in a batch, and each print was drawn ABOVE the ground line,
  cutting the lit rim of the soil into a dashed hole (law 3). They expire by age now, hold for
  half their life before fading, and lie IN the soil with a light lip on top.

Tests: 382 suites green (three new: the jetpack's economy, the frame surviving an exception, the
shaft's address), plus the phone-layout suite, which now measures ВЗЛЁТ along with the rest.

---
## 0.227.0 — M233 pass 3: the thicket gets depth, the home gets arms, the front page gets the world

- **A jungle was one flat green.** Plants had depth — far ones smaller and faded — but the fade
  was `globalAlpha`: a translucent green leaf over a green sky is the same green, so the whole
  thicket stayed one acid patch with no front and no back. Distance now moves the plant's own
  colour toward the air (`ambRGB`), and the planes separate by value the way air actually
  separates them. Measured before: sky 112,146,121 / plants 103,207,113 / ground 36,65,41 —
  three greens within ten degrees of hue.
- **At home the man had no arms.** Both were stroked in one tone over a torso of the same
  colour; at front-page magnification the figure was a slab with a head and legs. Same rule as
  the legs: the far arm darker, the near one lighter than the body, and a hand at the end of it.
- **The front page showed the interface instead of the world.** Since M221 the target chips,
  the hint band and the base's build cursor are drawn on the CANVAS, so the site frames caught
  «ЦВЕТНЫЕ КРИСТАЛЛЫ — ЗАЛЕЖИ…» and a cyan selection bracket across the picture. A stand flag
  (`SHOT_CLEAN`, false in the game always) drops the canvas UI for those captures.

Tests: 379 suites green.

- **Half the mine screen was a black hole.** The sky over the pit was drawn only while
  `camy<40` — a number with nothing to do with whether the mouth is visible; one step down the
  shaft and the sky stopped being drawn while the rock had not yet begun. It is now asked
  directly whether the surface line is in frame. And the sky over an airless world is nearly
  black BY PALETTE — up top the stars hold that black, in the shaft they were never drawn, so
  the same starfield now stands over the pit (and at night on worlds with air).
- **The scoop's heat gauge was an empty frame with a stray caption.** The plate was 20 px tall
  and the caption printed 2 px BELOW its bottom edge; at zero heat there was no fill at all, so
  the main instrument of the mode read as an unfinished box. Now it has a groove (a scale is
  visible when empty), quarter ticks, a marked fire threshold at 80%, and the caption inside.
- **The pirate hangar floor was a brown checkerboard.** Two "light pools" were drawn per cell —
  an old full-cell square and the newer fixture-shaped strip — and the pool was painted in the
  LAMP's colour at low light, which in this renderer (no additive pass) means a flat brown
  rectangle, not light. The square is gone; the remaining pool is floor colour mixed toward the
  lamp and lifted in value — a plate that is lighter under the fixture. Lamps in the hangar now
  hang every other bay instead of one per plate.
- **In a downpour the settlement stayed dark.** Windows and yard lamps hung on `surfNight`
  alone, so on a green world in the rain there was not one warm patch in the frame (law 7).
  Bad weather darkens the day and people switch the light on: dusk now counts weather.
- **The cave's darkness is made of the cave's own rock**: it was killed with a cold near-black
  (1,4,10) everywhere, taking the material with it. The dark is now the planet's palette driven
  almost to zero — still dark, but this cave's dark.

Measured after: 60 fps in all nine modes, errors empty. Tests: 379 suites green.

Reshooting the README found five real defects. Each is fixed in the game, not in the shot.

- **A straight bright line ran across the sky.** The cloud-horizon haze ramped to half opacity
  at the horizon and then simply STOPPED — on foot the ground hides that edge (it sits exactly
  at `SURF_HOR`), but in flight the ground is elsewhere and the cut hung in mid-air across the
  whole frame. It now fades out below the horizon as well, and takes its colour from today's
  air (19c) instead of the night sky, so by day it is no longer a dark bar across a light sky.
- **On approach you could not see what you were landing on.** The camera kept the ship at 42%
  of the frame and looked nowhere else: at half a kilometre the ground was below the bottom
  edge and the screen was an empty gradient. The camera now slides down far enough to keep the
  ground's edge in frame, and no further than keeping the ship clear of the instrument pod.
- **The far ridges flew up into the sky on approach.** Their offset was a fraction of the
  camera's own `camy`, true only near the ground; from altitude they rose above the terrain and
  their flat wash filled half the frame. Their rise above the near ground is now capped.
- **The flight instrument pod was a ghost with five anonymous dials.** Muted blue-grey at .28
  opacity over sky, and no captions at all — the cockpit had earned three-letter codes back in
  M213, the pod never got them. Now: a dark field behind each dial, a shadowed needle, higher
  contrast, and ХРН/КРС/МСС/ПРМ/АКТ under the scales. No colour, no alarm — as before.
- **At home the owner was a white blot and the doorways were black holes.** He was drawn near
  white (214,222,228): on a dark wall the arms vanished into the torso and the figure fell
  apart into a bright smear and two grey sticks. At home he now wears house clothes with a
  lit shoulder and a shadowed side. The openings into the next room were painted in fractions
  of an already dark palette and read as cupboards; the neighbour's room now shows its own
  lamp — lighter far wall, a clear floor strip, warm light reaching our floor in a pool.

Tests: 379 suites green.

- **HQ**: a free domain is a switched-OFF screen — grey glass, grey tape, grey label, not a
  single spark of the domain's colour. Colour is power, and an empty seat has none.
- **The attic**: the window now throws a defined light pool on the floor with the mullion's
  shadow in it, the light falls off along the brickwork around the frame, and two framed
  photographs hang over the bed — sky over dark ground in each, memories of somewhere landed.
- **The shaft's minerals catch the lamp**: ore stays "not a lamp" by the standing decision, but
  grains now flare their glints near the walker and go back to stone three cells away — the
  light answers movement, not a blink.
- **The sanatorium sea**: two coherent surf bands over the glint scatter, and the railing's
  shadow grate flipped to fall AWAY from the sun — it was arguing with the board's shadow.
  The horizon haze was already there.
- **Instrument needles cast shadows** on their dials — the needle is a thing above the scale.
- **The trade cantina's window**: the moored ship is a ship — hull sweep, superstructure, a
  warm row of lit portholes, a breathing marker light — someone's home stands behind the
  glass, not a grey crate.

**The M232 queue is closed whole.** The eight laws stay as the standing checklist for every
future visual pass.

Tests: 379 suites green.

**The day palette.** The old verdict — «полдень читается пасмурно на всех мирах» — had one
root: the sky and the light never knew the hour. The zenith was painted with the night colour
`sky[1]` around the clock, the ambient fill was the same navy, and the ground's direct light
was a constant. Now the hour enters the palette through one source (`dayK`/`skyDay`, 19c):

- **The sky knows the hour**: at noon the zenith is a light saturated colour of the world's own
  palette and the horizon goes to pale air; toward night the gradient returns to what it was.
  Airless worlds keep a black sky at any hour — there is nothing to scatter.
- **Shadows are coloured, not dead**: the ambient fill is TODAY's sky, so at noon shadows turn
  live blue (or the world's own cast) instead of midnight navy.
- **Direct light rises with the sun** faster than the fill (`df` in `litRGB`): at noon the lit
  slopes burn at ~.96 against the old flat .78 while shadows stay coloured — «тени резче и
  цветнее», both halves of the audit line.
- The far ridges, the haze band, the vignette (lighter by day) and the final grade all read the
  same day key. Everything cached got the quantized hour in its key — ground chunks, far-ridge
  tiles, the grade layer — so nothing baked at dawn survives into noon.

**Weather contradictions:**
- Precipitation kills the light shafts (they fade to nothing by half strength — a downpour
  with god-rays was a weather conflict).
- Far ridges in rain sink into the veil in TWO steps of air — the far layer washes stronger
  than the near one — instead of standing as black cutouts.
- Clouds go slate in a downpour: each sprite has a pre-baked storm variant crossfaded in by
  weather power. Storm sky is dark, not white.
- Edge grass grew three bush forms (single blade, fan tuft, low arc bush), all bowing to the
  same wind.

Measured after: **60 fps in all nine modes** (`?g11`, dpr 2, clean run, errors empty).
Tests: 379 suites green.

The mannequin half of this stage was already closed by 0.221.0 — the raid draws the same
`drawAstronaut`. The environment half:

- **The cable channel is alive.** The wall band that stood for it was mute. Now it carries the
  home base's own signature: an amber power line along the trough — emissive, so the current
  is visible even in the torch-lit dark and a corridor reads as an inhabited house broken
  into, not a stage set; mounting clips near the eye; and on roughly every eighth wall a
  panel box with a steady amber lamp and a feed dropping from the line.
- **Sheet tone varies wall to wall** (law 4): one tone per room was paper even with seams.

The plinth, sheet seams, rivets, ceiling beams, lamps with floor pools and the hangar paint
were already in from G4/M180. The dark stays: corridors without lamps are the design — a
stranger's base explored by head-lamp.

Tests: 379 suites green.

Done before the raid stage because the raid draws the SAME figure large —
`drawAstronaut` is one body everywhere, so every fix lands on the surface, in the
cave, the mine, the base cut and the boarding at once.

- **Knees.** In the swing phase the leg bends — the knee moves forward and up; in stance it is
  nearly straight. Before, the mid-point rode a line and the legs were two sticks.
- **Boots as bodies**: wider than the shin, dark, with a toe cap toward the gaze and a light
  top edge (law 3) — not a third dash.
- **The pack is two tanks with a valve** and a strap, a highlight along the near cylinder; the
  antenna moved outboard and its light breathes instead of blinking (law 6).
- **The visor got its brow highlight** — one hard arc along the top of the glass; without it
  the glass read as a dot.
- **The warm side is structural** (audit: «тёплый бок от солнца — rim усилить структурно»):
  the sun-facing half of the torso and helmet takes a warm fill, the rim line stays as the
  edge. **At night the head-lamp lights the walker himself** — chest and near arm catch the
  reflected light instead of standing black under their own beam.
- **Body lean at a run**: the upper body pitches forward with walk amplitude.
- **Dust from underfoot on dry worlds** (vacuum, thin air, deserts): a puff per step, drifting
  back and dissolving; ephemeral, never persisted.

Tests: 379 suites green.

- **Pad.** The illegible green mass at the left is now the NOSE of a docked shuttle looking in
  from the side bay: hull sweep catching the lamp, glazing, a gear strut on the deck, and a
  breathing green marker light. The crane trolley now travels the beam back and forth — the
  old sawtooth teleported home at the end of each run and read as a glitch, not motion.
- **Battery.** The row of sharp shell heads read as a trap's teeth. The magazine now feeds a
  high-voltage assembly: five insulator stacks — overlapping ceramic discs on a rod with a
  ball top — under a common bus, one slot empty. Once in 8–12 seconds ONE quiet arc runs
  between two neighbouring balls (an event, not a blink). A storage flywheel turns slowly on
  its mount (law 6). The first draft had eight small stacks and they dissolved into a grid of
  dots — an insulator only reads when its discs overlap and the rod shows.
- **Law 2 sweep for the remaining rooms:** contact shadows under the pad's hydraulic
  cylinders, control pult and dispatcher; the battery's pult and assembly plate; the lab's
  bench legs, seated researcher and centrifuge bench neighbours.

Tests: 379 suites green.

- **Warehouse.** The floor was empty and the shelf crates all one height. A front row now:
  stacks of differing height, one under a tarpaulin with tie-downs, one still in its slings —
  not yet unpacked; and a tallyman with a slate whose hand makes a mark every few seconds.
- **Living quarters.** Helmets are OFF — `bWorker` grew a bare head (skin, hair, an eye toward
  the gaze), and the living room is the one place that uses it: the sleeper's head is skin on
  the pillow, the man at the table has a face. The desk lamp's cone now falls ON the table and
  the sitter (law 1: under a cone something must get brighter). Laundry sags on a line between
  the bunk post and the lockers, swaying faintly. The generic crowd is capped at one (`calm`)
  — the room stopped being a lift full of people facing a screen.
- **Smelter.** The shift DOES: a stoker at the hearth drives a poker into the fire on a slow
  cycle (rare sparks answer the thrust), a carrier walks half the room from the molds to the
  rack with a glowing ingot and returns empty. The flame's glow pulses slowly over the whole
  shop's walls. The slag-watcher statue is gone; the remaining crowd stands at the rack.
  Furnace, rack, slag tank and the floor stacks all got contact shadows (law 2).

The first four-in-a-row draft of the smelter shift was caught by its own frame and re-laid:
the carrier's path had degenerated to eight pixels because the molds already stand at the
rack. A walk must be half a room long or the walker is a statue with moving legs.

Tests: 379 suites green.

- **Reactor.** The vessel was a frame around a full-height light column — a prison grille. Now
  it is IRON: a rounded barrel with a domed top and hoops, and only a small bolted viewing
  hatch shows the core burning behind glass, rods in front of it. A relief valve on the dome
  exhales steam once in ten seconds (eased, not a blink); the console gained a needle gauge
  that trembles; the operator's forearm slides along the board; the tank casts its shadow on
  the wall and stands on the floor (law 2).
- **Solar.** The battery bays read as shower stalls with people inside — a bright charge fill
  behind an open niche. They are cabinets now: two shelves of cells with terminal jumpers and
  a narrow creeping charge strip per cabinet; the generic shift moved to the switchboard, and
  a technician with a probe wire to a terminal does a measurement at the far cabinet.
- **Drill.** The conveyor carried six identical beads; lumps now vary in size (a new size for
  every new lump) and hop on the rollers — the belt visibly RUNS. Portal shoes, control post
  and the solar switchboard got contact shadows.

Tests: 379 suites green.

The author handed a full cosmetic audit («КОСМЕТИКА ДО ПРЕДЕЛА», eight laws + a screen-by-screen
list); it is now the live queue in PLAN.md, and this is its first stage — the base frame.

- **The amber "network" lines are gone from the rooms.** They ran through every room at one
  height, over furniture and people — debug markup, not cable. The cable now lives like a real
  one: a channel UNDER the deck plating with mounting clips, a riser up each partition, and in
  the room only a panel box with a steady lamp. The tunnel run lies on its floor the same way.
- **Partitions are concrete, not a spreadsheet grid**: grey body, shaded far edge, a light
  chipped top edge with a cast flaw, bolted plates where they meet the slabs.
- **The ground got a soil profile** (the mine's language, M219): turf → subsoil with stones →
  broken weathering-crust fragments, all following the mountain's silhouette; roots only where
  the air is breathable, regolith and gravel where it is not. The top row of rooms now shows
  the scar of its cutting — crush and pale chips above the ceilings.
- **The base lives as an organism**: occasionally someone walks the tier from one room to
  another, through the doors, behind the partitions. Nobody is invented — it is the shift
  walking, and only where a shift exists.
- **The lift works**: the cage travels the shaft in a slow continuous cycle, ropes above it,
  the counterweight running opposite along the lining; the platform edge nearest the cage
  warms — a floor light without a blink. The smelter got its smoke: a pipe up the partition
  line to a surface cap, where the wind takes it. The pennant flag carries a travelling wave
  (everywhere pennDraw is used). Room light falls into the tunnel at its junction.

Law 6 held throughout: everything moves, nothing blinks. Tests: 379 suites green.

The last piece of the through-line, held back until the middle had been lived with. One day, late —
after a year of this life, with a home to have a pier at — you jump into your home sector and there
is a yacht at your pier. The key is in the lock. There is no note. That is all.

**What pays for it is the invisible ledger** — everything done for free and without witnesses,
weighted by how poor you were at the moment of the deed. The player is never told this. Not a line,
not a hint, not a «за что»: the truth of this game is not spoken, and if a phrase ever appears from
which it follows that the yacht was left for kindness, it is to be deleted together with its scene.

**The gift keeps the design's three rules by construction.** It has no price — none is shown
anywhere, because there is none. It cannot be sold — hulls in this game have no sale path at all,
and this is the one hull for which that is the way of the world rather than a limitation. And the
world does not congratulate: the journal line is flat — «У причала стоит яхта. В замке ключ.
Записки нет» — and the thing on the desk is a key with no name on it.

She is called «Тихоня», which is the name of the book's last part, and she is a true luxe — lacquer,
teak, brass and a name instead of a number, drawn by the same painter as every luxe hull.

With her the arc queue closes end to end: the offers and the ledger (M189–M191), the three
squanders (M194, M225), the kind word after the squandered name (M226), the expedition calling
people by name (M229), the silence and the one who says it (M230), and now the gift nobody
counted. The quiet second ending — the medical board and the pension — has been in since M161.

11843 assertions in 379 suites.
---
## 0.215.0 — the silence, and the one who says it (M230)

Act IV of the arc, finishing what the kind word began. Doors already close one at a time and the
world already keeps offering — what was missing was the two things that make the state *audible*,
both straight from the book.

**The silence.** «Не назван никем. Работы столько же.» When three doors and more are shut, the
counter queue sometimes names somebody — and it is not you: «— Петровича борт? Не Петровича.
Ладно, жду Петровича». You hear naming happen next to you. Not a number, not a reproach, not one
word about you — and none of it sounds while fewer than three doors are shut, because loneliness
has the right to exist only in its own part of the book.

**The one who says it.** The arc's rule: nobody reproaches him; exactly one character says it to
his face, and he is wrong. Once per game, in a cantina, when the world has gone quiet: «Вы просто
не тянете. Я таких видел» — pays and leaves. The game confirms him with nothing: no number moves,
no offer changes, no line follows. Whether he was right is something you can only learn by living
five more years.

The door count is stored nowhere and shown nowhere — it is counted off people's memory when
needed. Guarded in `91zzzx-late`: two doors are not yet silence, the quiet lines contain not one
word about you, the one line fires exactly once and survives the save, and the world offers
afterwards exactly as before.

11827 assertions in 378 suites.
---
## 0.214.0 — the expedition calls people by name (M229)

The act of the expedition (M154–M161) was built before the offers existed, and the two systems did
not know each other: for sixty days the whole world worked on one thing, and the counter kept
offering peacetime runs. Now the circular is heard at the counter too, in three ways.

**The column.** A new offer for the expedition's sixty days: «плечо в колонну» — cargo for her,
taken without a queue, paying half again over a plain run because everything is going to one place
and that place pays. Delivering it hands the station three units toward its collection over and
above the money, and writes a line in the record book in someone else's hand.

**They name you more often.** The world needs hands, and the ones they trust are called first: a
named offer's chance rises from .45 to .70 — for exactly sixty days. Closed doors stay closed: the
expedition opens nothing that a squandered name shut.

**The name in the list.** The deepest access of the act, and it pays not one credit: you are
entered into the expedition's list. A line in the record book — «внесён в список экспедиции · по
представлению» — and on the day of departure the core counter says the two words the whole book
turns on: **«ЕСТЬ МЕСТО · ВАС НАЗЫВАЛИ»** instead of «одно место, если кто хочет». The door is
open either way; the difference is whether you are named in it. Why they named you is never said.

11816 assertions in 376 suites, including: the column appears only during the expedition, the list
writes the book and flips the departure's words, delivery feeds the collection, and a shut door
stays shut even in the hot days.
---
## 0.213.0 — the bird has a voice (M228)

The 3D bird's "still to do" list was audited and almost all of it turned out already built — the
page around the bird, the ported behaviours, the down layer, the phone budget, the soft shadow
between feathers. The one true gap was **sound: the bird was mute.**

Now it cries like the animal it is. A parrot's voice is two-voiced — two carriers a minor third
apart, both gliding — pushed through a bandpass «beak» and torn by hard amplitude modulation,
which is the creaky throat. Pitch, length and the bend of the glide vary from cry to cry: the same
cry twice in a row sounds like a doorbell, not an animal. A chirp goes with the speech bubble; a
lower, falling grumble answers a poke at the crest — displeasure needs no translation.

Synthesized in place, not a sample: the file stays self-contained and downloadable. The
AudioContext is created lazily on the first gesture — until then the bubble works silently, as it
did. And it is deliberately quiet, −33 dB: a bird on a desk, not in an ear. Volume and character
are the author's to tune from here; the one refinement left on the module is true per-feather
ambient occlusion.
---
## 0.212.0 — v:5, and nobody's save burns (M227)

The save format bump the plan had been holding, done the way that costs nothing. The game now
**writes `v:5` and reads both 4 and 5**: every existing save — local or cloud — keeps loading, and
the one v:4 legacy branch (`modsOwned` reconstructed from `mods`) stays alive under its own number.
An unknown future version is refused whole rather than half-read. The localStorage key stays
`drift_save_v4`: it is an address, not a format, and renaming it would orphan every local save.

The investigation found the constraint that had guarded this for months was a ghost: the feared
`server.js:95` and `worker.js:66` **do not exist in this project**. The cloud is `site/api.php`,
and it checks only that a `v` field is present. The rule in CLAUDE.md now describes the real
architecture.

What v:5 buys: a versioned door. When the release look changes the shape of what is persisted,
those changes ride `s.v===5` branches while the v:4 paths keep reading old records — instead of a
single flag-day that eats everyone's progress.

The only exposure: a stale-cached client (old service worker) pulling a fresh v:5 cloud save will
refuse it until the page updates itself — a short window, and refusal is loud, not corrupting.

11805 assertions in 374 suites, including: v:5 round-trips, v:4 loads with its branch working,
v:9 is refused.
---
## 0.211.0 — the kind word after the squandered name (M226)

The door already closed silently: a named offer missed, and the person simply stops naming you —
`folkShut`, built with the offers themselves. What the book has and the game did not was the one
human beat that follows: **the next time you stand at that counter, the person who used to name
you says something kind — and never names you again.** «Никто не сердится — вот что тяжелее всего.»

One line per closed door, ever. It comes ahead of the queue and ahead of story lines — a person
matters more than a plot — and stands for the whole visit. It is kind, it never explains, and the
words «имя», «окно», «долг» do not appear in it: the truth of this game is not spoken. The world
keeps offering — cold offers come as they always did; it is only the naming that has ended.

Guarded in `91zzzx-late`: the journal holds not one word of reproach, the line is one of the kind
ones and none of the forbidden words are in it, it stands the visit, it never repeats, and the
next offer from that person arrives un-named.

11799 assertions in 373 suites.
---
## 0.210.0 — the late hour at the counter (M225)

The first move into the arc's Act II, and with it all three of the book's squanders exist in the
game. «Ляпнул лишнего» has been built since M194. This adds the other two.

**Забухал.** The counter is honestly the best place to learn things: some things are said only late
and only there. Staying is a button in the cantina, it never warns and never asks twice, and each
sit buys something real — a line that exists nowhere else, with a real address or a real price in
half of them, and occasionally a *named* offer leaned across the counter. The price is hours:
`G.t` actually jumps, and every window in the game — offers, shifts, needs, the sky's calendar —
ages silently. Nothing tells you. That is the whole point.

**Пристал не к тому.** Sometimes the person next to you is simply good to sit with and asks for
nothing. Nothing bad happens. An hour and ten is gone, the conversation was the best in a month,
and that is all you get. Nobody is angry — which is what makes it the book's squander and not a
game's penalty.

Three sits per shift, then the counter empties and the barman stacks the stools — the only refusal
this place will ever make. A save does not refill it.

Guarded by what the arc's rules demand rather than what the feature does: the hours are real, an
offer's window measurably narrows while you sit, the journal contains not one word of reproach,
and the truth is never spoken anywhere. 11785 assertions in 372 suites.
---
## 0.209.1 — the fourth payment (M224, tail)

`21ab-base-interiors` 42→26+18 KB. The eight compartments are one `const` table, and tables are
not cut — so the table is not cut: the second file continues it with `Object.assign`, and every
reader still sees one whole `BASE_ROOM`. Concatenation order becomes load-bearing (the second half
must follow the declared const), which the file's header says out loud. The base stand renders all
eight kinds, smelter fire to battery, unchanged.
---
## 0.209.0 — three split payments and the plan back under its guard (M224)

Maintenance, before it stops being maintenance. The 40 KB guard was shouting about twelve modules
on every build; three of them had clean seams and are paid: `28-loop` (47→25 KB — telemetry and
`hud()` moved to `27z-telemetry`, the frame loop keeps the frame), `27d-ui-cantina` (46→26 KB —
the barkeep, wall views, props, tables and counter moved to `27d-ui-cantina-props`; the hall and
its people stayed), and `12tb-settle-draw` (45→23 KB — the buildings, villagers and the settlement
body moved to `12tb-settle-draw2`; the palette and brushes stayed).

`PLAN.md` itself had grown to 83 KB against its 60 guard: the bird's eleven closed passes
(M200a–M200j, M201) and the M169 graphics campaign moved to `docs/PLAN-archive.md`, each leaving a
one-paragraph pointer.

What still shouts is inventoried in the plan's split-debt item with the reason each file is hard:
they are single 400–600-line functions — a redesign each, not a cut. Next clean seam: the eight
base compartments.

11773 assertions in 370 suites.
---
## 0.208.0 — the last screenful of nothing (M223)

The playtest's second complaint, decided and applied. The choice was between shrinking panels to
their content and giving short screens something true to show; measuring settled it back in August —
every station tab overflows its viewport anyway, so shrinking would change nothing — and the census
of standalone screens found exactly one reachable short one: the HQ. (The crew screen can be short
too, but its button does not exist until you have crew.)

The HQ already had its true thing — the drawn control room — and it was capped at 270 px while the
panel offered 580. **The room now takes the height the panel actually has**, leaving room for the
rows beneath; empty or manned, the panel is full of room instead of full of nothing.

One real bug under it: the first render after opening often measures an unlaid or stale layout —
in headless, the 640×480 fallback the page starts from — so the room re-measures itself a frame
later and again on every window resize. Resizing the window with the HQ open used to leave the room
at its old size; that is fixed by the same listener.

11775 assertions in 370 suites.
---
## 0.207.0 — the ruler has to see both sides of the frame (M222)

A defect of my own making, found by asking the phone instead of the monitor.

M217 measured the world by frame **height** alone. A phone has a monitor's height and a third of its
width: at 390×844 the ruler came out at 1.2, the world grew — and what a narrow screen has least of
is width. There was less than three hundred units of world across the frame: not a road any more,
a slot. The same mistake was in the interface's own ruler from M221, one day old.

A frame has two dimensions, so a ruler that reads one of them is not a ruler. **Both now grow by
whichever side is tighter.** The world's proportion — 1000 to 560 — is 16:9 on purpose: on an
ordinary monitor both sides say the same thing and nothing changes, while a narrow screen gets its
1 back and keeps every unit of width it had.

The guard for it lives in the phone suite, because that is the only place it shows —
`test.ps1 -Mobile`, which is only run if you ask for it. That is exactly why this slipped through
for four days.

11775 assertions in 370 suites on the desktop, 11866 on the phone.
---
## 0.206.0 — the instruments grew with the window too (M221)

M217 gave the world a ruler: on a big monitor it now *grows* instead of merely showing more. What
it did not touch was the interface — and after four days that contrast had become the loudest thing
on a 1080p screen. Measured on 1920×1080: the world is nearly twice its old size, while the
instruments, the pads, the rail, the console and every panel stayed at the pixel sizes they were
laid out with. The interface had turned into a thin frill around the edges of a huge frame.

**Now it has its own ruler, taken from the same frame.** `--ui` scales with window height —
`clamp(H/760, 1, 1.75)` — and it deliberately grows *slower* than the world: text doubled in size
stops being text and becomes a poster. A phone is left exactly as it was: its layout was measured
for a narrow screen and has nothing to gain here.

**It is `zoom`, not `transform: scale`,** and that is the whole reason it works: a transform
stretches the picture while leaving the layout and the hit-testing at the old coordinates — a button
would look big and still be pressed by its old, small rectangle. `zoom` changes the used lengths, so
the interface's own rule — *nothing you poke with a finger is under 44 px* — stays true at every
size, and the guard that measures it now measures real pixels.

**And the half of the interface that lives on canvas came along.** The target chips on the surface,
the hint band, the compass chips at the edge of the system view and the zoom readout are drawn in
the same UI measure now — leaving them in raw pixels would have split one interface in two, half of
it grown and half not. Their world coordinates are converted by dividing by that same measure, and
a chip's tap zone is handed back to the input layer in real pixels, which knows nothing of zoom.

Rasters baked inside panels — the desk's boards, the road canvases — are baked that much denser, so
the magnified interface does not come out soft.

11771 assertions in 369 suites, 60 fps in every mode, and the phone layout suite is still green.
---
## 0.205.0 — the mast has a body (M220)

Yesterday's receivers were a line on paper and a voice in the noise. Fly to the address they gave
you and there was **nothing there**. A place with nothing to see in it never becomes a place — it
stays a coordinate, and the paper starts to feel like a lie.

**Now the mast stands in the system.** Its own point, on a fragment of rock, with a silhouette per
kind: a lattice tower with a lamp that blinks, a buoy with fins, a dish on a frame, an observation
box with its tube out, a weather hut, a wintering with crates stacked by the door. The rule is the
one every assembled thing here follows — dark mass first, everything hung inside the outline, one
light last, and the edge that catches the star, because the star is in the middle of the system and
the light always comes from there.

**The inhabited ones you know at a glance, and not from a caption: their window is lit.**

**Payment moved from the jump to the visit.** While it landed on arrival it was a tax on travel;
news is brought to a person by hand, so now you fly up and hand it over — «ДЕЙСТВИЕ — ПРИВЕЗТИ
НОВОСТИ», once in three days, and the unmanned ones simply get listened to.

One defect found by measuring rather than by looking: masts were placed 900–2600 from the star,
while the system's edge is computed from the belt and in a system with a tight belt sits closer
than that. Such a mast stood **outside the gravitational anchor** — the ship turns back before it
and can never arrive. Now the distance is clamped inside the anchor.

11762 assertions in 368 suites.
---
## 0.204.0 — the mine gets a soil profile, and the workings get insides (M219)

Two tails the playtest left on the mine, and the third that M217 parked.

**The sky ended with a ruler.** A dead straight horizontal across the whole frame: sky above, rock
below, nothing between. No ground on this planet is built that way, and the eye knows it instantly.
Now the sky ends where the ground begins — along one gentle curve, computed by the same function on
both sides, because if they ever disagreed a seam would run the width of the frame. Under it there
is a real profile: turf, loose subsoil with stones and roots hanging down out of it, and below that
a weathering crust — the bedrock's own top, broken into pieces with dark gaps between them, going
over into fresh rock without a line anywhere.

**And it comes from the world, not from taste.** The top tone is the planet's own palette, the one
you see from orbit; the bottom is the first layer of its geology. On a world with no air there is
no turf at all — up top lies regolith, lighter than the stone, and not one root. What stands *on*
the line — clumps of grass, or gravel — is drawn in the frame rather than baked into the tile,
because the sky is laid over the tiles and would paint it out.

**The abandoned chambers were lit backwards.** Their gradient went dark at the roof to darker at the
floor, so the blackest thing in the cavity was the heap of rubble on the ground — and the whole
chamber read as a hole cut with scissors. In a real cavity the roof is darkest, a back wall stands
behind, and the floor is the brightest thing there. Now it is those three, with grain on the back
wall and a collapse pile whose slopes are broken out of the hash instead of drawn with a ruler.

**The mine also scales with the window now**, like the surface and the cave. It was held back for
one reason — tapping a cell — and measuring it argued the other way: a scaled cell is a *bigger*
target. Measuring it also turned up a defect that had been there all along: the tap used `Math.round`,
so each cell was owned by the half-cell band to its left, and aiming at the middle of a cell dug the
one to the right and below it. It uses `Math.floor` now, and that is guarded.

11754 assertions in 367 suites. 60 fps in every mode.
---
## 0.203.0 — the receivers became places (M218)

The author's own idea, from the day the question was only "where should the receiver sit when a
screen is open": «давай отдельную панель приемники и они дают доход или бонусы или нихуя не дают,
просто ты знаешь где они и можешь как в навигаторе проложить маршрут». Confirmed, and built.

**There are masts in the world now.** Beacons, buoys, relays, observation posts, weather posts,
winterings — standing by seed where no station is, and thicker the further out you go: the settled
middle gets by on wires, the edge has only the air.

**You find them with the knob, not with a list.** Every mast has its own frequency, and it lies **in
the noise between the fixed bands** — where the receiver has always said only «…шшш…». Turn slowly
and you catch a far mast; turn quickly and you go straight past it. Heard clearly once, it names
itself and its sector, and that is the entire act of writing it down: there is no "record" button
here, any more than there is one for a distant operator's call sign.

**What they give — all three answers, and each is true.** *Nothing*: a beacon burns, a buoy blinks,
a post counts what flies past; the use is that you know where they are. *A clearer ether*: a relay
lifts legibility in its own two sectors, so words stop dropping out at the edges of the bands — it
transmits whether or not you know it exists, and the panel is what explains why reception is good
here. *Money*: the manned ones — a weather post, a wintering — pay for the news you bring, once in
three days, in their own words and never much.

**And there is a panel: ПРИЁМНИКИ, on the desk.** A tapped row lays a course, the same and only
gesture the journal has ever had. Above the list is the scale itself — the fixed bands as blocks,
your caught masts as ticks in the gaps between them, the knob where it stands right now — because
four rows and half a sheet of nothing is exactly the complaint the playtest already made, and the
truest thing this page can show is where to look for the next one.

Nothing appears over the world. No arrow, no marker, nobody asks you to go. 11751 assertions in
366 suites.
---
## 0.202.0 — the world is measured by the frame, not by the monitor (M217)

An outside tester spent twenty seconds unable to find himself on the surface. Measured, and the
number was worse than the complaint: the walker is ~26 px drawn one-to-one — 3.6% of a 720-high
frame, 3.0% of the tester's 840, **1.8% on a 1440p monitor**. The better your screen, the smaller
the person on it. The bug was never in the drawing; it was in the ruler. A bigger window did not
show a bigger world, it showed *more* world, and everything alive in it shrank.

**Now the world scales with the frame.** The surface — and the cave, because it is the same man in
the same world and shrinking him on the way down would read as a change of game — is drawn through
one context scale, `clamp(H/560,1,2.4)`. The walker holds about 4.6% of frame height on any screen.
Small windows are untouched: 560 is where the game already sat.

**And it stays crisp**, which is the half that took the work. While the world is being drawn, `W`
and `H` become *how much world is visible*, so every cull, the horizon, the far ridge's
"measured by the screen" rule and the camera's own arithmetic keep working without knowing anything
happened — the trick tiles have used since 0.87. The cached raster is baked **denser** instead of
being stretched: the scale enters the key of every store, so nothing baked for another size can
surface blurred. Density is capped, because on a retina the pixel ratio already gives two and
baking four times over is memory by the gigabyte for a difference nobody can see.

The frame cost nothing: 60 fps in every mode, console empty. 11693 assertions in 362 suites,
including both round trips — a tap at the 300th pixel walks to the point drawn there, above ground
and below it.
---
## 0.201.0 — heard on the air, written on the paper (playtest #5, the rest of it)

0.200.0 let you lay a course from a price the desk remembered. But the desk only remembered stations
you had **docked at**, and meanwhile the ЦЕНЫ band on the receiver has always named a real station and
its best good, live, in flight — *«…Цициин: лёд берут по 22, топливо 7»*. Hearing it did nothing. You
could not write it down, could not plot it, could not use it. The motor still only started inside a
station.

**Now the ether writes on the paper.** Tune the band, hear a station named, and it appears on the
ЦЕНЫ tab — where the gesture added yesterday will plot a course to it. Nothing over the world, no
prompt, no "new objective": a broadcast was heard and a note was made, which is what a person with a
radio and a notebook does.

**And it does not pretend to be more than hearsay.** Three rules, each guarded:

- It records only **what was actually said** — one good and the fuel price, not a whole price list.
  Overheard is not the same as seen.
- The row is marked **«со слуха»** on the paper, and it carries no shortage, because shortages are not
  broadcast on that band and inventing one would be a lie.
- **Seen beats heard, always.** Docking rewrites the row in full and a later broadcast never
  overwrites it. Nor does an overheard figure ever count as the *best price* in bold — one number
  from the air must not outrank a price list you read on the spot.

Written once per station per day (the dial can sit on the band indefinitely; the exchange has one
piece of news), and only at a legible signal — at the edge of the band the words drop out anyway, and
writing down noise would be its own kind of lie. 11673 assertions in 360 suites.
---
## 0.200.0 — a course can be laid from the paper (playtest #5)

From the outside playtest, item 5: *"«зачем лететь» lives inside the station. The board — needs,
tips, prices — is the game's motor, and it only runs after landing, docking and switching a tab."*
With the tester's own warning attached, which is the hard part: his strongest praise for the game was
*«ничто из этого не обращено к игроку — и поэтому работает»*, so quest markers and objective banners
would buy the metric and sell the game.

**The paper already knew where.** The desk remembers the prices and shortages of every station you
have docked at — the ЦЕНЫ tab, best price per good in bold, a shortage called out in amber. And there
was nothing you could do with any of it: the address sat there as two numbers, to be memorised by eye
and typed into the navigator by hand. The motor was running and not connected to the wheels.

**So the paper gets the gesture the journal already had.** Tapping a price row lays a course to that
sector and opens the navigator — exactly what `questGoto` has done since M-whenever for a job, and
deliberately the *only* button the journal has ever had: *"take me where this needs doing"*. Nothing
appears over the world: no arrow, no marker, no banner, and the game never asks you to go. There is a
piece of paper with an address on it, and a navigator that will plot it. That is the whole feature.

The move is now `gotoSector(sx,sy,what)` — lifted out of `questGoto`, which turned out to be the case
it mattered to least — so the next thing on the desk that has an address gets it for free. Guarded in
`91zzv-table`, including the half that matters most: the course starts no job and puts no line over
the world. 11663 assertions in 359 suites.
---
## 0.199.0 — the hangar gets its temperature (M180 pass 2, tail)

0.191.0 closed most of M180's second pass and wrote down what it left: *"warm work lamps with pools
on the deck, and rust or colour on some of the crates, would finish what the markings start."* Both
done.

**The lamp was visible and lit nothing.** A ceiling strip was drawn in every corridor, reactor bay
and hangar, but the deck beneath it stayed exactly the tone of the corner behind the containers. A
light that lands nowhere is a film over the frame, not a light — the same finding the mine's helmet
lamp produced two versions ago. The pool now lies on the plate, on the warm end of the scale, and it
takes the **shape of the fixture**: a narrow strip overhead means a strip underfoot. The first count
laid a square over the whole cell, which at the camera's own cell filled the entire foreground and
read as a brown rug rather than as light.

**And the containers are no longer all the same iron.** They sat at 56–80 on every channel, like
everything else in the room, so they added volume but no colour and the floor paint stayed the only
saturated thing in the hall. Crates on a real base are painted, and not in the colour of the
bulkhead. The tint comes from the cell's own seed, so one stack does not match its neighbour, and
rust turns up rarer than paint — rust is a mark, not a fill.

Between the markings, the pools and the crates, the room finally has a temperature instead of one
grey. 11656 assertions in 358 suites.
---
## 0.198.0 — the kit laid out on the desk (M216, M179's tail)

M179 put the hold on the table as **piles** — the author's ask after showing the inventory from The
Forest: everything you carry laid out as objects, so one glance tells you what you have too much of,
too little of, and none of. It wrote itself one line of debt: *"the suit kit as objects on the same
desk (it lives in the ship screen's paperdoll today)."*

**A doll and a layout answer different questions.** A doll answers *how do I look*; things laid out
answer *what have I got* — and the second is the inventory question. A mannequin is a poor way to
answer it, because on a mannequin the boots are under the torso, the pack is behind the back and the
gloves merge into the sleeves: half the kit is invisible precisely *because* it is worn. On the desk
all six lie side by side and whole.

**One canvas, not six cards.** The hold gives a card per resource because resources are independent —
three kinds today, eight tomorrow. The kit is always the same six places, and it is **one** thing
taken apart. Six cards would read as six unrelated objects; one layout reads as one person's gear
laid out before going out.

Nothing about it is new invention: the colour of every piece comes from `kitColOf` — the same one
that paints the doll and the walker on the ground — so model and wear-layer show through, class makes
a piece larger and adds it a detail, and wear draws as scuffs or as patches rather than as a number.
It sits above the cargo, because what is on you is not what you are carrying; and it stays there when
the hold is empty, because you are still wearing a suit.

Two passes. The first drew shadows wider than the objects casting them, so six grey ovals read as
things floating above their own blots; and the layout was squeezed into the narrow per-resource card
column. `27j-ui-kitlay`, one `.thing.wide` rule, guards updated in `91zzv-table` to state the new
rule rather than the old count. 11656 assertions in 358 suites, 11746 on the phone.
---
## 0.197.0 — the third hour, walked (M215)

M212's walkthrough left *"the third hour — first run given to a hired hand, the wait, and what comes
back — has not been walked."* Walked. Both findings are the same family as the second hour's: **the
game contradicting itself, or staying silent, at the exact moment money changes hands.** Written up
in [`docs/DESIGN-hours.md`](docs/DESIGN-hours.md), which now covers both hours.

**The contradiction M212 fixed came straight back, through the side door.** M212 made a candidate's
experience follow the traits printed beside it and guarded `genMerc` over 900 seeds — but the station
does not show what `genMerc` returns. `stationMercs` post-processes the list by reputation with
`xp = Math.max(xp, 65)`, taking no account of who the person is. So on any station where the player
is known, a candidate tagged *«необстрелянный — дёшев и НЕОПЫТЕН»* was stamped **опыт 65**, or 100
further up: the same two adjacent lines arguing, only now switched on by reputation. The M212 guard
could not see it — it tested the generator, and the bug lives one call downstream.

That bump's own intent is *who came*, not *who they suddenly are*: where you are known, a man with a
record is at the table. It now lifts only candidates who could plausibly have one, and leaves a green
hand alone — green is green everywhere; likewise a veteran's service does not shrink because your
name is bad here. Guarded through the whole path this time, at both ends of the scale: reverting the
fix makes the new test fail with *«зелёный остался зелёным (100)»*.

**And you pay for a person before learning he cannot work.** The first hire costs a newcomer about a
third of everything they own, and only afterwards does the crew row say *«корабль: не выдан ·
свободных корпусов нет — купите или пересядьте»*. A hired hand needs a **hull of his own**, and
nothing on the hire screen said so — not the header, not the speciality, not the candidate's row. The
money is spent and there is nothing to undo it with. The crew header carries it now, and only while
it is true; for a player who already has a spare hull it would be noise.

**Still open there:** with no second hull there is no order to give and nothing to wait for, so the
back half of that hour — the order, the wait, the return — needs a save with two ships. That is where
`CREW_YIELD` first meets the player, and the likeliest place for a *"he loses money, is he broken?"*
reading. 11656 assertions in 358 suites.
---
## 0.196.0 — the mine stops being the weakest screen (M55 #1, M214)

The oldest item on the visual queue, and the one the outside playtester picked out unprompted:
*"the mine is still the weakest screen — pale, monotone, rock and dug space indistinguishable. It
comes right after the surface, which is the game's best screen, and the contrast does the damage."*

**It was not underbuilt — it was unlit and unbedded.** The rock painter already had strata with
contacts, mineral veins, a crack-and-block system, dykes and planet material. Two things were
missing, and both are the same two that fixed the postcard's mine earlier this week.

*Bedding inside a stratum.* Layers give bands of colour — but only where several are in frame. At
shallow depth, which is exactly where a player arrives the **first** time, one layer fills the whole
screen and the rock comes out as a single flat wash. Sediment is never one tone: it is laid down in
partings, each a little lighter or darker than its neighbour. They follow the layer's own wave, not
the screen's horizontal — along it, or it is striped wallpaper rather than stone.

That pass has to go **after** `fillMaterial`, and the first attempt did not: the material ate the
partings exactly as it once ate the cracks. The same lesson, twice, in the same file — now written
at the top of the function so it is the third time only for someone who does not read.

*Light that falls off.* The massif had one brightness for the whole frame: depth darkens evenly, but
the rock knew nothing of distance from the lamp. So the mine had **no centre** — stone at the edge of
the screen burned as bright as stone underfoot, and the whole frame read flat however much drawing
was in it. Underground you see exactly as far as the light reaches. It also reconciles the workings
with the massif: far away they darken together, and the black gallery stops being a hole in paper.
Computed per frame rather than baked, since the tile is fixed to the world and the walker is not —
measured at 0.4% of a 0.92 ms frame, which is to say free.

New stand `pageshot view -Q "?s=dig"`. **Still open there:** the boundary with the sky is a hard
horizontal cut with no soil profile above it, and the insides of the workings are still flat.
11640 assertions in 357 suites.
---
## 0.195.0 — instruments you can actually read (M213)

From the outside playtest list, item 4: *"the five-needle region pod carries no labels and its number
(«0.000») has no unit; the belt cockpit's dial captions are too small to read at all. Either they say
what they are, or they are not instruments."*

**The caption was six pixels.** `Math.round(6*FS)` with `FS` starting at 1 — six pixels, at 45%
opacity, on the narrowest window. A caption you cannot make out is not a label, it is a texture. Nine
pixels as a floor now, and a denser tone. The rule that hierarchy comes from size and colour cuts
both ways: what must be read has to be *large enough*, not merely not too large.

**And it shortens rather than shrinks.** «МАСС-ДЕТЕКТОР» is 64 px at that size and a panel cell can
be forty. Shrinking the type until it fits is exactly the fault we started from; a real instrument
panel puts a three-letter code there instead, and a code reads at any distance. The full name is
drawn when it fits the cell, the code when it does not — measured per cell, not guessed.

**«НЕВЯЗКА 0.000» got a scale instead of a unit,** because it does not have one: the misclosure is
dimensionless, a fraction of the region's span (`06b-region`). There is nothing honest to write after
it. What it lacked was any way to tell that zero is one *end of a range* rather than a missing
reading — so there is a bar under the digits now, with ticks at nought, half and full. An instrument
is entitled to a scale; words have no business here, since the region announces nothing about itself
by design.

New stand `pageshot view -Q "?s=cockpit"` — the ceiling panel is a different instrument from the
survey rack, and only the rack had a stand. 11640 assertions in 357 suites.
---
## 0.194.0 — two files split before they became a problem (upkeep)

Housekeeping, taken while the reason was still fresh rather than left for whoever meets it next.

`25ga-post-scenes` reached **52 KB in one night** — the largest module in the project and past the
40 KB line, which is the size at which a file stops being readable in one go. Split along the seam
that was already in the design: `25g-post-under` (cave, mine — lit from inside, depth inverted) and
`25g-post-void` (belt, orbit, gas-giant air — one hard light, no depth to borrow, only size).

The names matter and the header says why: `Sort-Object Name` does not see the hyphen, so a
`25ga-…` sorts *before* `25g-postcard` (it compares `25gapostscenes` against `25gpostcard`, and `a`
precedes `p`). Extending the stem rather than the letter gives card → under → void, which is also
the order they should be read in. That trap cost a build in M209 and is written into `CLAUDE.md`.

`24aa-raid-draw` had grown to 51 KB; `drawFoeBody` moved out to `24ab-raid-foe`. It was the only
clean seam in the file — a compartment and the person standing in it are different things — and
everything else there is closed over `proj`, `quad` and `polys` inside `drawRaid`, so cutting it
would mean hauling half the projection into the open. 44 KB and 9 KB now.

No behaviour changed: 11640 assertions in 357 suites, and both stands redrawn to confirm it.
---
## 0.193.0 — the wintering says it louder (M197)

M197 built the month alone in one room and wrote down what it left: *"at street scale the wintering
reads, but weakly. The frame could say it louder."*

**It was already saying the right thing — in a whisper.** The room has three lights the player
switches on themselves, and a `winTone` that splits the space: warm from the stove on the left, cold
from the window on the right. That split is the whole feeling of a wintering. But it was mixed in at
`0.22` and `0.16` — even at full tone a surface moved toward its own light by about a fifth, and the
whole room came out one flat brown. The cold reached only 2.6 body-widths from the window, so most
of the room never heard it at all.

Cold now carries **more** weight than warm (`0.42` against `0.40`, and `0.40` against `0.36` on the
wall), and that is not taste: the room's general light comes from a lamp, and a lamp is warm, so the
cold has to be louder merely to register. Its reach went to 3.6 body-widths, warm to 3.0, so the
middle of the room is contested instead of neutral.

**And the window's light was tinting the floor, not lighting it.** A flat `0.13` fill of cold over
the boards darkens them blue; light does the opposite. It is additive now, twice as strong, and it
no longer stops at the sill — a soft cold wash falls on the wall around the window too. It is the
only cold thing in a warm room, and it is what tells you there is night and frost on the other side
of the glass. Without it the window is a picture, not a window.

Stand `pageshot view -Q "?s=winter"`. 11640 assertions in 357 suites.
---
## 0.192.0 — the hour after the opening, walked (M212)

M207 walked a fresh save and left one item written down: *"the hour AFTER the opening — first
station screen in full, first hire, first manager — has not been walked yet."* This is that walk.
It is in [`docs/DESIGN-hours.md`](docs/DESIGN-hours.md), measured in the running game
rather than remembered. Three findings, all fixed.

**Every long screen ended in a lie.** The board on a first dock renders eight sections — measured
live, **1229 px of content in a 407 px window**. The cantina is **2086 in 408**, five screens. Nothing
said so: the last visible row ended flush with the panel edge, exactly as a final row would, so two
thirds of the board and four fifths of the cantina did not exist for a player who did not think to
drag. This is not the question of whether eight sections is too many — that is the author's call and
nothing was removed — it is a missing affordance. The bottom of any overflowing list now fades out,
and the fade goes the moment you reach the end: no arrow, no "more below", no scrollbar, the same
haze this game measures distance with everywhere else. It is a mask rather than an overlay, because
an overlay is another element to position, it catches taps, and it does not know about the panel's
rounded corners. Applies to every screen — a list running past the fold was never only the board's
problem.

**The hire screen argued with itself.** Two candidates, read top to bottom: *«необстрелянный — дёшев
и НЕОПЫТЕН · опыт 22»* and, right below, *«ВЕТЕРАН — дороже, но выходит живым · опыт 7»*. `genMerc`
set `xp: Math.floor(r()*40)`, a number bound to nothing, while the traits printed beside it came
from a separate roll. A player who catches that stops trusting both lines — on the first screen
where they are asked to spend a third of everything they own on a stranger. Experience now follows
the traits it is printed next to: green 0–6, veteran 46–89, everyone else 8–37. The spread stays,
its sign no longer argues with the caption. Guarded in `91b-crew` across 900 seeds.

**And a one-day-old regression of my own.** M208 made flight photographable; the console stays over
an open screen deliberately (M151a); so from yesterday the ФОТО button hung over the HQ, the market
and the shipyard, offering to photograph a world the player is not looking at. `postCanShoot` now
refuses while a screen is open — the console rule stands, the shutter is not part of it.

Three things were checked and are **not** defects, written down so a later pass does not "fix" them:
the empty HQ (which says what a manager is *and that you do not need one yet* — the best-written
empty state in the game), the unaffordable candidate whose button dims rather than hides, and a
manager's 70 кр/мин being out of reach in the second hour.

`27m-scroll-cue`, suites `91b-crew` and `91zzzu-post-scenes`. 11642 assertions in 357 suites; 11732
on the phone.
---
## 0.191.0 — the pirate base, pass 2: bodies and floor paint (M180)

M180's first pass fixed the projection, the horizon and the bulkheads, and wrote down what it left:
*"the enemy bodies themselves are blocky, and the hangar wants dressing"*.

**The bodies were blocky in three specific places.** Legs were two identical rectangles from hip to
floor with a plate for a sole — which reads as a *post*, split down the middle, not a person. Three
things separate a leg from a bar: it **tapers** toward the ankle, it ends in a **boot** (wider than
the shin and darker), and two legs do not stand parallel. The stance now comes from the seed, so
they are not all planted the same way. The belt was a rectangle spanning the full torso width and
stuck out past its edges, reading as a shelf; it now follows the body and carries a buckle. And a
dark yoke across the shoulders, because shoulders are the first thing the eye reads a figure by.

**But the real problem was that nothing on the figure was lit.** It was seven flat fills and not one
highlight, so on a dark deck it fell apart into patches — which is what "blocky" actually describes.
The compartment's light comes from the ceiling, so the top edges catch it: crown of the helmet, line
of the shoulders. One outline stitches seven pieces into one body — the same rule the parrot and the
buildings are drawn by.

**The hangar was never empty — it was one temperature.** Containers, trusses, a gantry, a wrecked
shuttle and barrels were all already there, and it still read as a grey hall, because every piece of
iron in it sits between 46 and 80 on all three channels. A real hangar has exactly one saturated
thing in it and that is **paint**. Floor markings are not decoration: they are what distinguishes a
hangar from a warehouse, and the only warm colour in a room where everything else is steel.

Two things had to be measured rather than argued. Marking only along the bulkheads produced exactly
**one yellow pixel** in the whole frame — the hangar cells in view are interior ones with no wall,
and the cells that have one stand far enough away that the distance falloff has eaten the colour. And
the line has to run *across* the bay even though ships taxi *along* it: the camera looks down that
same axis, so a lengthwise line foreshortens to a couple of dashes at the frame edges. Floors are
marked both ways in life; this projection can only show one of them.

Stands `pageshot view -Q "?s=raidfoe"` and `"?s=raidhangar"` (the first stands you nose-to-nose with
the nearest pirate — the existing `?s=raid` deliberately finds the room with the *most* visible
enemies, which means it shows them at a distance and cannot judge a figure). 10732 assertions in 355
suites.

**Still open:** the room is still one temperature away from the paint — warm work lamps with pools
on the deck, and rust or colour on some of the crates, would finish what the markings start.
---
## 0.190.0 — the far ridge becomes a range (M211)

M186's walkthrough left one line standing: *"still open: the flat far ridge"*. It has been behind
every outdoor frame in the game since, which makes it the highest-frequency piece of debt on the
list.

**It was not flat — it was familiar.** Both distant layers took the profile of the ground under
your feet and multiplied it about its mean by 2.3 and 1.6. A ridge built that way is self-similar
to the earth you are standing on: the same curve, only louder. The eye recognises that instantly
and stops measuring distance with it, which reads exactly like flatness.

**A mountain is built differently from a hill, and the difference is one line.** Ordinary noise
gives rounded crests; *ridged* noise — `1−|2n−1|` — gives sharp summits and broad soft valleys.
That is what a range is: peaks, not waves. Each octave is weighted by the one above it, so small
teeth sit **on** the flanks of large peaks instead of sprinkling evenly along the whole length. The
two layers get different seeds, because two ranges echoing each other through parallax is the most
visible lie available — the eye catches repetition before it catches anything else.

**Two things the first count got wrong, both measured rather than eyeballed.** The frequency was
taken by feel (`.0016`) and worked out to one hump per thirteen thousand world units — a ridge
*straighter* than the one it replaced. It has to be reckoned from the screen: the layer is drawn at
`step*3.6`, about twenty-two pixels per sample, so three or four summits in frame means a period of
roughly twenty samples. And the field's mean has to be subtracted: ridged noise averages about a
third of its range, so an unshifted field lifts the whole range by a third of its amplitude — peaks
leave the top of the frame and the valleys cover the sky as a solid wall. That is precisely what
the first attempt drew.

Cost is unchanged: the profile is baked into the parallax tiles once per planet, and the frame
still only does `drawImage`. Guarded in `91q-planet` by the properties that actually matter — the
range does not correlate with the local ground or with the other layer, there are at least two
summits across a screen width, its median sits below mid-range (valleys outnumber peaks: a ridge,
not a wave), and its mean height matches the ground's. 10730 assertions in 355 suites.
---
## 0.189.0 — the stone that remembers: marks in the places themselves (M210)

M171 put the first thing left by a *living* player into the game — a mark cut beside your ship with
cargo at its foot — and wrote itself a debt: "only the surface carries a mark; the settlement wall
and the cave mouth would each take one". The debt stood since 0.137.0, and M194 walked around it by
turning the player into a source of rumours instead. This is it, and it is deliberately not built
like the cache.

**A cache disappears; a wall accumulates.** The mark by your ship is visible exactly until someone
picks it up — which is to say almost never: it has either not been left yet or has already been
carried off. So M171's whole point, *someone alive was here*, reached a player once in many
landings. On a wall the marks pile up. Twelve strangers' hands on one stone is not twelve rewards,
it is **one**, and it is stronger than any cache: a place where people stood before you.

**Nothing to take and nothing to leave.** No cargo, no price, no count. A cache without a price
would degenerate into a noticeboard — M171 checked that already — and a wall cannot degenerate into
anything, because there is nothing on it to get. One mark per wall per person: a wall of your own
signatures is vanity, not a record of people.

**Two passes on the surface, and the second one changed the object.** The marks first went on the
settlement's retaining wall — and missed twice. Measuring a real settlement's profile: on the left
the terrace is *cut into* the slope (ground 27–35 px above its edge), on the right the fill is 2–14
px. There is no face to carve, and the marks hung on the grass. The deeper miss was one M171 had
already solved: this world is seen from the side, and a cut in an earth bank does not exist in that
projection. So the settlement gets a **boundary stone** at its edge, in the same visual language as
the trace slab — set by hand, top chipped, sides not parallel. The cave mouth needed none of this:
rock already stands as a wall there.

**Twelve, not twenty-four.** The first count held two dozen and they turned to scratch-noise: a
person in this world is 26 px tall, the stone's face is half that, and a mark came out three pixels
across. Twelve *legible* hands say "people stood here" better than twenty-four illegible ones — and
the number in the prompt stays honest, because the stone holds exactly what it says.

Down the wire: the mark index and the six-character hand, nothing else. Back: the same plus "this
one is yours". `11ah-wall`, `wall`/`sign` on `a=trace` in `api.php`, suite `91zzzv-wall`, stands
`pageshot view -Q "?s=wallset"` and `"?s=wallcave"` (with a self-aiming loupe — marks are
world-scale and a full-screen shot cannot judge them). 10724 assertions in 354 suites.
---
## 0.188.0 — the hundred blanks, and a card that knows where it was taken (M209)

M189 laid down thirty printed blanks and wrote "a hundred over later passes" into the plan. Here
are the other seventy, in `25h-post-forms2` — and two kinds that could not have existed before
yesterday.

**Two new kinds, because the camera reached two new kinds of place.** «подземная» and «из
пустоты» were missing not from neglect but because until M208 there was no way to photograph a
working face or a belt, so a blank for one had nothing to sit behind. Their voice is their own: the
underground forms carry no weather and no hour (there is neither, down there), and the vacuum ones
are deliberately flat — a person who lives in emptiness writes about it as routine, and that
plainness is the tell.

**The blank is now chosen by where the photograph was taken, not by where you are sitting.** The
old code asked `G.mode`, which was wrong twice over: a card is signed at the desk, on a station,
long after the shot — so a picture from a mine was offered «С ДОРОГИ» — and a card received from a
stranger has no live mode at all, since the recipient is in their own game and their location has
nothing to do with that photograph. The snapshot knows where it came from; that is what gets asked.

**Kind turned out to be too coarse a sieve.** «Из пустоты» covers the belt, orbit and a gas giant's
air alike, and the first count duly put «В АТМОСФЕРЕ» — *"going through the layers, pulling
steady"* — under a photograph of a planet seen from above. A blank now carries an optional `m`, the
letters of the places it suits; those are preferred, kind is the fallback, and the player can still
flip to any of the hundred.

Also caught here and written into `CLAUDE.md`, because it cost a build: **`Sort-Object Name`
ignores hyphens**, so `25ha-post-forms2.js` concatenates *before* `25h-post-forms.js` and the
second table dies reading the first. To land after a module, extend its stem, not its letter.

Suite `91zzzi-postcard`: a hundred blanks, no repeated heading, every one findable by the number
that travels down the wire. 10693 assertions in 349 suites.
---
## 0.187.0 — the camera works in five more places (M208)

M188 gave the game a camera and taught it two places: the ground and the approach. That left five
where the ФОТО button simply never appeared — the cave, the mine, the belt, orbit, and the air of a
gas giant — which is most of where a player actually stands. The album was twelve slots holding
twelve variations of the same green hillside.

**The snapshot did not grow.** A card is still a couple of hundred bytes, and `cx`/`cy` mean
something different per place — the step along a gallery, the cell at a working face, the heading,
the altitude — rather than a new pair of fields per mode. Terrain is now computed only for the two
places that draw it: five painters were asking for fifteen hundred points and fifty boulders each
and throwing them away, twelve times over on every album repaint.

**Five painters in `25ga-post-scenes`, one light between them.** Each gets the star, the night
count, the ground ramp and the seed as an argument and never makes its own — eight cards lit by
eight different suns read as eight different games rather than one trip. And every place carries an
object of known size: the same figure in a suit, timber, a ship's wedge. Without one, a gallery
could be a burrow or a railway station.

**Two of them are lit from inside.** The cave and the mine are the only places in the game the star
does not reach, so their frames are built the other way round: the far end is *lighter* than the
near rock, because the light comes forward from a helmet lamp. That inversion is what makes an
underground card recognisable at arm's length.

**Four passes, and the first three were wrong in ways only eyes catch.** The cave came out a
*night landscape with a hill*: the vault sat at the top of the frame and the rock took `T.pal[0]`,
which on a terran world is the ocean — a blue cave. The mine was a beige field with a gallows in
it, because the lamp washed the strata flat and every cell got an identical timber frame. Belt rocks
were soft potatoes (a soft shadow means air, and there is none), then a black paper cut-out. The
planet was striped like Jupiter with white papercut continents. The gas bands read as rolling
hills, and the scoop trail was drawn in front of the ship like a searchlight. All of it is written
down in the module where it happened.

`25ga-post-scenes`, suite `91zzzu-post-scenes`, stand `docs\shot.ps1 scenes`; the album stand now
builds its pack from all eight places. 8868 assertions in 348 suites.
---
## 0.186.0 — chess by post: a move a day, and still nobody has a name (M192)

The post (M188–M191) carries a photograph and a printed blank; this adds a second thing the same
pipe can carry — **a game of chess with a stranger, one move per card**. The plan asked for it
"after the post has bedded in"; it is being done now on the author's instruction to work the whole
queue through.

**A move is three small numbers.** `{f,t,p}` — from square, to square, promotion choice — and that
is the entire wire format, so the rule the post was built on holds without a new exception: nothing
the player *types* ever crosses. The board is not sent and is not stored. What persists is the list
of moves, and the position is replayed from it (`chPosition`), the same way the world is replayed
from a seed rather than saved. A corrupt move truncates the list instead of poisoning the game.

**The engine is complete, not "enough for a demo".** Castling both sides with the rook's and king's
own rights, en passant with the captured pawn actually removed, promotion to any of four pieces,
check, mate and stalemate named as шах / мат / пат, and the rule that costs the most code and is
the point of chess: you may not leave your own king attacked. `chLegal` filters pseudo-moves by
playing them and asking. Three of the first test failures here were bugs in the *tests* — a knight
asked to reach an occupied square, a promoting pawn placed one rank short — and the engine was
right; they are written down in the suite so the next reader does not re-derive them.

**Correspondence, not a match.** You start a game on a card you sent or caught, and after that each
card carries one move. You cannot move twice; a move arriving out of turn is dropped and the game
is untouched. The board lives on the desk as its own tab (ПАРТИЯ) and the move goes out with the
next card — including through the night ether, where a caught card lays its move on the board while
the announcer is still reading.

**Server side.** `site/api.php` learns an `mv` field: validated field by field (`0…63`, no null
move, promotion `0…3`), carried through `put` / `reply` / `ask` / `in`, and never trusted — the
client re-checks legality before the move touches a game. The runner's `php -l` gate added in
M190 covers it.

`25n-chess`, suite `91zzzt-chess`, 8794 assertions in 344 suites.
## 0.185.0 — the newcomer's first hour: a relief operator, not a tutorial (M207)

The plan has been asking for this since before the release block existed: walk a fresh save, write
down every "boring" and every "I don't understand", fix them as a list. The walkthrough is in
`docs/DESIGN-first-hour.md`, measured in the running game rather than remembered.

**The worst finding, and it is not difficulty.** `G.surf.suit` starts at 100 and counts down while
you walk, and **nothing in the game ever names it**. The bar is drawn and silent. A newcomer's first
death there is not the game being hard, it is the game not having spoken. Fuel is the same problem
one step later: a tank worth about ten jumps, and nothing says that fuel is bought rather than
found. Measured at a fresh start: no quest, no goal card, no story pin, no tutorial object of any
kind — a ship, six hundred credits and no reason to move.

**The fix is a person, not a tutorial.** No arrows, no modal windows, no "press here", no "skip
tutorial" flag — the game does not speak that language and should not learn it. It uses the voice it
already has: four lines in the ether, each said **once per save** and each tied to an occasion
rather than a timer.

- the pack you breathe from on the ground is not endless — first time you walk far from the ship
- the tank is ten jumps and refuelling is bought — first time fuel drops below 86
- there is always work on the board at a counter — first dock
- if you are broke, dig; the station buys what is underfoot — first time you stand at a deposit
  with under nine hundred credits

Four and not five: more is a lecture, fewer does not cover the list. A fifth line about *data* was
considered and dropped — nobody dies or gets bored for want of understanding data. They are said by
people (диспетчер, стойка, старик у стойки), never by the game, and never twice, including across a
reload.

**Written down and deliberately not fixed:** the station board shows eight sections on a first dock,
and thinning it is a decision about what the game is. And the first prompt on landing is
«СКАНИРОВАТЬ ОРГАНИЗМ» when twenty-two deposits are underfoot — right sentence, wrong first
sentence, and reordering that chain to save the first hour could cost every hour after it.

## 0.184.0 — the travelling pennant (M206)

Once a quarter the best of your bases gets a banner on the wall and one line in the ether. That is
all of it.

**It is pure form, and that is the design.** The pennant gives no output bonus, no discount, no
reputation, no points. It hangs. The whole meaning of a travelling banner is that it travels: next
quarter it is taken down and carried to another base, perhaps yours again, perhaps not, and the
only thing left of it is a line in the record book saying you once had it.

**Best means most built and best balanced**, not most profitable. Profit is already visible in
numbers, and a banner for it would be the same thing said twice. What is counted here is work.
A power balance sitting at zero-plus counts for more than twenty kilowatts of headroom, which says
only that a reactor was installed and forgotten.

Which quarter it is, and who holds it, are computed from the state of your bases and the quarter
number. Stored is only which quarters have already been announced, so the ether does not repeat
itself.

A test caught the one thing that would have made the whole idea a lie: the tie-breaker between
equal bases was hashed from the **length** of the base's key, and `"1,1:0"` and `"5,5:0"` are the
same length — so there was no spread at all and the banner grew onto the first base in the list
forever. It hashes the whole key now, and over a year of quarters it visits more than one base.

## 0.183.0 — the travelling cinema (M205)

A barge brings a film, and for one evening the cantina reseats itself: the counter goes dark, the
chairs turn to face the wall, and a short newsreel runs on it.

**A newsreel, not a film.** There is nothing to show a film with and no reason to: the film is
running somewhere over there, and what the game shows is the thing people come early for — six
frames with an announcer's captions, each about something this game actually has: new regions, the
expedition's stores, a shift handed over without remarks, species described, the sky's calendar,
houses going up. Dry, unsentimental, informative.

**The hall is not rebuilt, it goes dark.** A cantina does not turn into a cinema; for one evening
it pretends to be one. The existing hall dims, a screen appears on the back wall with a dusty beam
across the room, and in the foreground are chair backs and the backs of heads — the same people,
just turned around. A poster by the door says СЕГОДНЯ and the title.

**Where and when is computed, not stored** — from the station's coordinates and the calendar week,
per the rule about the ephemeral. What is stored is only which showings you have been to, and that
only for one line in the record book. It gives nothing: no money, no data, no reputation. An
evening is an evening.

One thing fixed while looking at it: the caption's type size was reckoned from the screen's height,
so it ran off both edges and read as a fragment. It is reckoned from the screen's width now.

## 0.182.0 — the bed by the house (M204)

Seeds of species you have described (the biology register, `20e`) go into a bed beside the house
and grow **by real days**. Vega waters them. It ties together three things that had never met:
biology, the home, and her.

Lazy about real time, like the pennant and like a QSL reply: a bed has a `Date.now()` of sowing and
nothing else. No simulation — look in a week later and you see a week of growth. A game closed for
a month sleeps through nothing.

**The form is the species', not "a plant".** The species is reconstructed from its **name**: in
Drift a species name *is* its passport (`speciesPlant` builds a species out of a stream of random
numbers and the name out of the species), so one name always yields the same form, colour and
habit. It will not match the exact bush on the far planet — the form there also takes the place
into account — but every bed has a face of its own, and two identical names grow up identical.

What sowing costs is one biological sample, the same currency a manager's perk spends. What it
gives is nothing: no harvest, no sale, no growth accelerant, no "fertilise for 200 credits". The
bed grows.

Four beds at most. The species sown is the last one you described that is not already in the
ground — the register keeps discovery order, so the seed in your hand is the one that goes in.

## 0.181.0 — QSL: the wall of cards (M203)

Reworked for the "no names" rule the whole online part stands on: the operators at the other end
are **people of this game** — winterers, the expedition, far settlements, a lighthouse, an
observatory, a barge, a children's radio club that was allowed on the air for five minutes — not
living players. The whole thing is offline; the server has nothing to do with it.

It works the way it works among radio amateurs. Catch a distant station by ear on the ЭФИР band,
and the callsign is yours — **there is no "note it down" button**, because a radio operator keeps a
callsign in his head from the fact of having heard it. The dial is the whole mechanism: whoever
turns it collects. Send them a card from the table; weeks later the answering card arrives and goes
on the wall at home.

Real time and lazy about it, like the pennant: a card has a `Date.now()` due date and until then it
exists nowhere but as a line in the save. A game closed for a month sleeps through nothing and
simulates nothing.

No score and no reward. The point is that the wall fills up, and afterwards you can see from it
where you were heard.

## 0.180.0 — the bookshelf: forty fragments, all of them written by hand (M202)

Books turn up in wreckage — a hulk, a container, a barge that did not make it. What is left of a
book is **a title and one paragraph**: exactly as much as you get through before someone calls you.

**It is a table, not a generator, and that is a condition rather than laziness.** Generated prose
gives itself away by the third line and devalues all forty at once. A fragment has to be worth
rereading, which means somebody has to have written it.

**The voices differ.** Not one invented book in forty extracts but forty books: a service
regulation, a pilot book, a children's story, a commission's report, poems, a cookbook, a novel
nobody finished, a first reader with a child's pencil in the margin, the last pages of a barge's
log. The world gets larger not from having many planets but from people in it having written
different things.

One place always yields the same book — the seed of the wreck decides which — so a wreck has an
address rather than a dice roll. Roughly one wreck in three has one. The shelf lives at home and is
read from the chair; the only number anywhere is how many of the forty you have.

No award for completing it. The book is the award.

## 0.179.0 — the holidays are on the real calendar (M201)

The road companion proved the game can keep time with the person playing it, and the night ether
proved that doing so makes it a different thing. This is the same idea on the year's circle: on the
thirty-first of December there is a tree in the cantina, and the ether carries congratulations.

**The people who congratulate you are the ones in your record book.** Not a random NPC and not a
table of names: the radiograms come from whoever wrote something in your book over this game
(`11aa`) — a station chief, a topic's lead, Vega, the parrot. Whoever was not there does not
congratulate you. So a first player's first New Year brings one radiogram and a year-old pilot's
brings half a dozen, and that is the only difference the feature makes.

**The holiday gives nothing.** No discount, no bonus, no double-reward event. A tree, mandarins,
other people's voices, and a line in the book. Any reward would turn the thirty-first of December
into farming, and it comes once a year as it is.

The tree is drawn once and stands in two places, the cantina and the living room at home. It is not
a stack of triangles: three tiers of branches with ragged lower edges, a trunk visible below,
baubles hanging *on* the branches rather than floating beside them, two strands of tinsel catching
whatever light the room has, and a star. It is drawn **last, in the near corner** — put in with the
rest of the props it went behind the counter and the crowd, which is to say it was not there at all.
A tree in a mess hall stands where it is in nobody's way and in everybody's sight.

A test caught one thing that would have been quietly wrong for a year: the holiday leaves a line in
the record book under its own name, so on the next New Year «Новый год» was sending itself a
greeting. Institutions and holidays are struck off the correspondents now.

## 0.178.1 — the two debts from last night, paid

Both scenes shipped with a named art debt. Neither is a bug, and that is exactly why they get paid
before anything new goes on top: a room where the figure reads as a coat is a room that will keep
reading as a coat.

**The wintering room.** The winterer is a person now. A padded coat reads as a padded coat not from
its colour but from **three breaks in the silhouette** — shoulders wider, belt narrower, skirt wider
again; take the belt away and you get an overcoat, take the skirt away and you get a raincoat. Felt
boots wider at the foot than at the shin, an ear-flapped cap, and a patch of face the size of a
cheek lit from the stove — without a face the figure stays an object. The warm rim was doing too
much work and read as a second, glowing man standing beside the dark one; it is a thin edge now.

The berth got **thickness**: a side rail, a gap to the floor under it, a mattress overhanging the
frame, a blanket turned back off a light sheet with two creases across it, a dented pillow. Before,
it was a plank. The stove got legs down to the floor and a contact shadow, because its foot was
disappearing into the vignette and it looked like it was hanging in the dark.

**The veranda.** The deck was a large empty brown field. Filling it with furniture would have
cluttered a veranda; what fills it is what belongs there at noon — the slanted grid of the
railing's shadow, which also tells you where the sun is. The deck chair reads from its **knee**:
back going up and away, seat near-flat, one piece of fabric bending across both planes, with the
stripes breaking at the fold; plus crossed legs and an armrest, without which it is a camp bed.
The man at the rail is in a light shirt and trousers, with hair and the back of his head to us,
and his forearms lie along the handrail.

## 0.178.0 — the sanatorium: three days in which nothing happens (M199)

M162's voucher was one line of code: `+3 суток, мораль полная`. It is a **place** now. A veranda
over the sea, a timetable on a board, an oxygen cocktail, a quiet hour, chess. And — the point —
nothing happens.

**That is not an omission, it is the only place in the game where resting is allowed.** No pirates
arrive, no reactor fails, no contract comes in. You can skip a treatment and nothing follows. You
can leave in the middle of a minute and nothing follows from that either. For three days the game
wants nothing from the player — and since the other hundred milestones want something continuously,
three days of quiet weigh more than any reward.

**The weight comes from ageing.** The record book counts the years (M161) and the medical board is
waiting for its date, so these are three days you do not get back. The game never mentions it. It
simply lets you spend them.

**What is not here and never will be:** points for attendance, a relaxation bar, an achievement for
completing the course. Any of those turns rest into work and kills the one reason this place exists.
A test guards it: doing every treatment for three days and doing nothing at all for three days end
in exactly the same state.

The veranda is built as the opposite of the wintering in every respect, deliberately — one dark
room with no outside against an open deck with the sea to the horizon and more light than anyone
is counting. The neighbour in the deck chair talks about himself and asks for nothing.

**Still open:** the deck is a large empty field, the deck chair reads as a bundle of sticks, and
the figure at the rail is a slab. The scene wants another pass, same as the wintering's room.

## 0.177.0 — the observer's choice: take the settlement in hand, once (M198)

The settlement (`12t`) had exactly one connection to the player: **feed it**. What grew out of that
was theirs to decide, and that was the whole design. Now there is a second connection, and it is
one-way: take it in hand.

**Everything measurable gets better.** It grows faster. It raises what pays instead of what came
into its head. The barn is twice the size, and they give more often and more evenly. Not one number
gets worse.

**What is lost is in no number at all.** They stop speaking in glyphs: the vocabulary the player
collected out of fragments of the report (`12q`) has nothing left to do here, because the answer is
now «принято» and «сделаем». Their own will in choosing a building goes: from here on it is a plan,
and plans are alike — two settlements taken in hand end up the same settlement. And the crooked
street goes with it. The yards line up, the roofs come to one height and one pattern, there is no
communal hearth in the middle any more, and a mast with your house mark stands at the end of it.

**Not one word of morality.** The game does not say which is right, does not ask "are you sure?",
does not report a loss. The button names the action and stops there: the dilemma is shown, never
stated. What changed can only be seen and heard, and only afterwards.

**There is no way back**, not out of cruelty but because there is none in life either. A hand is
not withdrawn, and an undo would turn a decision into a setting.

Caught while wiring it: the save rebuilds a settlement field by field from a whitelist, so `mine`
was being dropped on load — the same class of bug the manager fields hit three times. It is in the
list now.

## 0.176.0 — the wintering: a month alone, and the light is an instrument (M197)

A contract off the board unlike any other in the game: not fetch, not kill, not find — **stand it
out**. A month on a far station, alone. Hold the power balance, keep a diary, listen to the wall,
wait for the barge. `winter` is a mode of its own with its own frame.

**It is one room, on purpose.** The temptation was a station with compartments to walk between,
but a wintering is about solitude and routine, and solitude *is* one room you do not leave for a
month. Everything else lives in the instruments on the panel and the sound behind the wall: the
station around you exists, it simply is not visible, and it is larger for that.

**The balance is a choice, not arithmetic.** The reactor gives less every week — ice, wear — and
there are four consumers, all of them needed. By the end of the month you are switching off
something living: heat, air, light or antenna. The game never says which is right. Turn the lamp
down for the antenna and **the room is genuinely harder to see**: the balance is not a number in a
corner, it is what you are looking at. Three light sources, all of them yours to set — the lamp
over the table, the stove, and the window that never switches off.

**The diary is the postcard's blanks** (`25h`). Not thrift: a winterer writes in forms *because*
there is nobody to write to and nothing to say, and a form is what is left when the words run out.
A diary page is built exactly like a postcard nobody will ever send.

**A calendar hangs on the wall with the days crossed off by hand.** The interface keeps no
countdown — counting the days is the winterer's business, not the interface's — so the counting is
a thing on the wall instead.

Faults arrive off schedule and each one costs the reactor a unit until it is fixed. Fixing one eats
the whole day: no diary that evening, which is an honest price — a day holds one piece of work,
not a list. The wall talks: iron early in the month, and by the end almost words. There is nothing
supernatural about it and never will be; the explanation is always there, you have just been
listening longer.

The pay is small and the record book is full — several entries, including the ones you would rather
it did not make: how many days you were cold and did not report it.

**Still open:** the room wants another art pass. The figure reads as a coat rather than a person,
the berth under the window is a plank with a pillow, and the stove's foot is lost in the vignette.

## 0.175.0 — the pennant: a probe you launch and are meant to forget (M196)

An automatic probe is assembled in the lab and launched at a star no hull will ever reach. Then
you are supposed to **forget about it**, and that is mechanics rather than a turn of phrase: no
marker, no counter, no "so many days left" anywhere in the interface. Weeks later the receiver
catches its weakening voice once, the probe sends back a photograph of where it got to, and it is
silent for good.

**Real time, and lazy with it.** No flight is simulated — the probe has a `Date.now()` of launch
and a due date, and until that date it exists nowhere but as one line in the save. A game left
closed for a month sleeps through nothing.

**The photograph is the probe's, and the postcard's painter takes it.** M188 was written as a
separate painter precisely so it could draw *any* snapshot of a scene — including one where no
person has been or will be. The place is computed from the seed of the system the probe was flying
to: the game does not invent the picture, it works it out the same way it would work out yours.

It is the only thing in the game with **no reward and no use**: no money, no data, no route opened.
A line in the record book, and a photograph of a place you will never stand in.

Once it has spoken, the probe is removed from the save entirely. What remains of it is the record
book entry and the picture — not a row of state. Otherwise a long game accumulates a graveyard of
probes the game will never mention again.

Three in the sky at most; past that it is a fleet rather than a gesture.

## 0.174.0 — the night ether: the band that only exists in the evening (M191)

The receiver has four bands and they are always in the same place, like a real set. The fifth —
**ночная почта**, at the very bottom of the dial where long waves live — is *not* always there. It
appears after nine in the evening and is gone by two, and only when there is a network at all.

**The hour is the real one**, not the game's. The road companion already proved the game can keep
time with the person playing it; a window measured in game days (a minute each) is not a window,
it is a flicker. And only a real evening gives the thing the whole feature was for: at that hour no
notification is needed, because **the ether is the notification**. The dial lights its own label
and says nothing else.

**A card is not shown, it is heard out.** The announcer reads it a line at a time, the way
telegrams were read — the blank's name, then each line as it was left standing, then the postscript
glyphs, then the place. Leave the wavelength halfway and you get nothing. A card read to the end
lands on the table as a stack with the reply already open — the screen does not throw itself at
you, because "only what is needed right now hangs over the world" outranks showing off a reward.

**Two a night.** Not out of stinginess: the third devalues the first, and an evening should end
before the interest does. The count runs on the *evening's* calendar rather than the day's, so one
in the morning still belongs to last night — otherwise midnight resets it and two becomes four.

Catching moved out of docking entirely, where M190 had parked it: a stranger's card is not handed
over as a bonus with the refuelling. Docking still brings replies, because a reply is addressed to
you.

Verified on the stand with the hour forced and the pool faked, so the path is the real one:
`pageshot view -Q "?s=ether"`. And verified by accident at 23:00 local, which is when the band
turned up on the dial without anyone forcing anything.

## 0.173.0 — the post: a card goes into the pool and a stranger catches it (M190)

The pipe under the postcard. `a=post` in `api.php`, `25j-post-wire` on the client, and a ПОЧТА tab
on the table where chains lie as stacks of cards clipped together.

**No account, and no names anywhere.** The pilot mark is the one the trace already uses — a random
string in `localStorage`, good for nothing but counting "how many today". The server knows whose
card is in the pool and never says: the catcher gets the card and a chain id, and the reply is
routed by the server itself. Neither side can find the other, call the other, or recognise the
other across chains. Go quiet and you are gone for good.

**Nothing typed crosses, and that is enforced on the server rather than trusted from the client.**
The card is rebuilt field by field — every number range-checked, the blank matched against
`[a-z0-9]{1,8}`, at most eight choices 0..7 and three glyphs 0..31 — and anything unexpected is
rejected instead of trimmed. That is why the whole feature needs no moderation: there is no channel
for a person's words, not even a narrow one.

**One request per docking** (the M171 rule). No timer, no poll, no socket: you dock, the game goes
out once, and that one trip brings back replies and — if the pool had something — one stranger's
card. Three cards a day out, two caught, a second fence per IP, thirty days of life, a sweeper on
the clock rather than on a dice roll.

**One button about a person: «не принимать».** Not a report, not a block list, not an explanation.
The chain dies and the other end is told nothing at all, which is what happens when people stop
writing.

Offline the feature does not exist and the interface never mentions it: a file opened from the
desktop is a game without a post, not a game with a broken one.

Two things fixed before they shipped:

- `mailWire` dropped `v`, the marker `drawPostcard` checks on its first line, so a card you sent
  landed in your own stack as a black rectangle.
- and, before that, the deploy: **there is no PHP on this machine**, so the one file the whole
  backend lives in had been going to the live site without ever being parsed. `php -l site/api.php`
  now runs on the runner before the upload step. A typo there is not a page that looks wrong — it
  is accounts and cloud saves down for real people.

The risk register has a new section (`docs/DESIGN-online-risks.md`, D2): the pool is global, so a
flooder pushes their cards in front of everyone rather than in front of one place; the daily limit
is self-asserted like the trace's, and the per-IP fence is what actually holds. Stands:
`pageshot view -Q "?s=mail"`.

## 0.172.0 — the forms: a postcard you can send without typing a word (M189)

The back of a card is a **printed blank**: a title and lines, each line a set of ready variants.
Tapping one strikes the others out, exactly as a pencil does on a real form. Thirty blanks in
eight kinds — road, holiday, wintering, household, lyrical, scientific, official («ФОРМА №7»),
children's — flipped through one at a time in the card's header, because a list of thirty is a
list and a postcard is a thing.

**Every line's default is its first variant, and that is a rule rather than an accident.** The
author's word on postcards was «чтобы не париться»: a card must be sendable without a single tap
and still say something human. So the first variant everywhere is the calm, ordinary one — the
one nine people out of ten would write.

**Why variants and not a free line.** A free line is a chat, and a chat between strangers has to
be policed, which turns a game into a service. The blank takes away exactly the freedom that
would have required people on moderation duty and keeps the one a postcard is sent for: choice.
What crosses the wire is a form id, the numbers of the chosen variants and up to three glyphs —
under a third of a kilobyte per card, and nothing a person wrote.

**The struck-out variants stay visible.** Hiding them would throw away half the message: a
stranger's card tells you about them by *what they crossed out*.

**A postscript of up to three glyphs** from the settlement pidgin (`12t`). What they mean is
never explained to anyone — the meaning is for people to agree on among themselves, and it is the
only thing crossing the boundary that the game has not written.

The address side of the back is empty on purpose, so the emptiness is named out loud in print:
«адресат не указывается · карточка идёт в общую почту». One line states the rule the whole
feature stands on, and states it as part of the world rather than as interface help.

Two collisions found and fixed on the way, both invisible to the eye:

- the choices were being written into `s.m`, which is the snapshot's **shooting mode** — a card
  taken on approach silently lost its lander and drew a walking figure the moment it was signed.
  They live in `s.c` now.
- the variant buttons carried `class="v"`, and the game already has a global `.v` — an instrument
  row, `display:grid` with 64/88/46 columns. Every variant quietly inherited that grid and
  stretched to a quarter of the card.

Stand: `pageshot view -Q "?s=pcback"`. Measured at 375 px: the card fits, nothing overflows, and
none of its 42 touch targets falls under the size rule.

## 0.171.0 — the camera: a photograph is a snapshot of the scene, not pixels (M188)

First pass of the postcard block. A photograph in Drift is **about two hundred bytes**: mode,
world seeds, hour, camera point, `VER`. The receiver's own engine draws it. Three reasons, in
order: the server carries bytes instead of megabytes; nothing but the game's own world can
physically cross the boundary, which is what makes the whole online feature need no moderation;
and an old card re-rendered by a newer engine comes out slightly not-the-same, which is exactly
what time does to a photograph.

**It needed its own painter, and that is the whole milestone.** Every draw path in the game
writes into the single `ctx` at the single `W`/`H`, reading the single live `G`. Rendering a
stored scene "as it is" would mean swapping the world under the renderer and putting it back — a
save-corrupting class of bug. So `drawPostcard(c, snap, w, h)` takes a snapshot and someone
else's context and owes `G` nothing at all. A test proves it: the same snapshot draws
pixel-identical frames before and after the live world is moved to another sector, another day
and another mode. The terrain comes from `genTerrain` — the same function the game walks on, so
the card cannot lie about the place.

Storing captured pixels was measured and rejected: a 480×300 JPEG is ~25 KB, twelve of them
~300 KB, and the album persists into a save that also goes to the cloud. The whole album now
weighs under three kilobytes.

**ФОТО** appears on the console only where there is something to shoot — on the ground and on
approach — and the album is a tab on the table that only exists once there is a first photograph
in it. Twelve places; the thirteenth shot pushes the oldest out and says so out loud.

**Five passes on the card itself**, each against the game's own frame:

1. A distant hazy ridgeline — pretty, and nothing like this game. Drift's surface is sky with a
   body hanging in it, a profile with a lit rim, and under the profile not emptiness but a **body
   of ground with strata**. Rebuilt around that.
2. The ground took its colour from `T.pal` — which is the *planet texture* ramp, seen from
   orbit, where the low steps are ocean and shadow. An earthlike world came out blue: the player
   was standing on the sea. Ground lives in the upper middle of the ramp.
3. Vertical scale was reckoned from frame height, so a volcanic world's peaks left the top of
   the card — a postcard is a third the width of the game's frame and stretched the same relief
   three times. One scale on both axes now, as a photograph has.
4. Strata followed the profile all the way down and read as contour lines. They flatten with
   depth now, and reach the bottom edge instead of crowding the top third.
5. No clouds, and that was the first thing that separated the card from the live frame. Added as
   soft radial blobs — filled ellipses gave a chain of identical lozenges with a hard edge, and
   at this size anything with a contour reads as a blot.

The scale in the frame is a person: without a figure at the profile the ridge behind is a boulder
and a mountain range at the same time. It carries a rim light from the star, because on an
airless world at night the silhouette matched the ground exactly and the one measure in the
picture disappeared.

Stands: `docs/mkpost.ps1` (six cards, six worlds and hours — the painter alone, the game never
touched) and `docs\pageshot.ps1 view -Q "?s=album"` for the album on the desk.

## 0.170.0 — the sky watch: the calendar finally has somebody on duty (M195)

`celestAt` has computed eclipses, parades and comets since 0.126.0, and the whole point of it was
that the sky is a *function of time* — the same day in the same system always gives the same sky,
so a meeting can be arranged by it. Nobody ever arranged one. The calendar was scenery.

The institute (11ab) now hands out a **watch order** at a science counter: a place, a kind of
event and a day. The day is not decorative — it is read out of the same functions the cockpit
line reads, by stepping forward through them (`skyFind`) at a step matched to the width of the
window: a comet hangs around perihelion for nine days, a parade holds for fractions of a day, an
eclipse for a sixth of one. A daily step would have named days on which nothing happens.

Be there and the tape writes itself — no button. For a parade or a comet, being in the system is
enough; for an eclipse you have to be standing on that particular planet, which is the first time
in the game that a task names a piece of ground and means it.

**The horizon is a month, and that was learned the hard way.** A calendar day is a minute of play,
so "in N days" reads as "in N minutes"; the first pass took the first event it found inside a
hundred and fifty days and cheerfully posted a comet for day 123. Correct, unplayable. Orders now
look thirty days ahead — sixty for a comet, which comes round rarely enough to be worth the wait —
and the kind is drawn from the seed *before* the place is searched, because an eclipse is available
around half the planets in the sky and would otherwise win the "soonest" contest every single time.

**It is a race, not an errand.** The institute computes the same sky you do, and six days after
the event it publishes its own bulletin — calculated, with no observer. Report before that and the
observation is yours: full pay, science data, a line in the record book. Report after and it is
still filed, at half pay, with «сверка тоже работа» from the person behind the counter.

**A comet reported first takes a name — out of your record book.** The record book is written by
other people (0.147.0, M161), which is the whole joke: the player cannot physically name a comet
after himself. The name sticks to the system for good and the cockpit line uses it from then on —
`КОМЕТА «ВАРЛАМОВА З.» · ЕЩЁ 4 СУТ`. Nothing is written across the sky itself: the loudness budget
of 19b stands.

The sky is still not saved. What persists is the order, the tally and the comet names
(`G.duty`) — decisions and their consequences, never the ephemeral. The old celest suite's
assertion that nothing sky-shaped reaches `snapshot()` is left in place, and still passes.

## 0.169.0 — ляпнул лишнего: the player becomes a source of rumours (M194)

Third of the three squanders from the book, and the one the plan called cheapest and most
interesting. Rumours (`11t`) have always run one way — the player only ever *hears*. Now he can
talk, and what he says comes back.

At a station counter, if he has actually dug something notable and not yet told anyone about that
place, the board offers one row: **«Рассказать, где взяли …»**. There is no warning attached and no
consequence written anywhere.

**What he gets immediately, and it is real:** the person behind the counter remembers him warmly,
which means the next thing they offer arrives **named** — three times the money (`11ah`). That is
not a consolation prize, it is exactly the currency the whole arc runs on. People listen to a man
who shares, and they listen gladly.

**What he loses later:** three days on, a barge is working that place. One line goes out on the air
— *«…там, где брали железо, работает баржа. Кто-то навёл»* — and it never repeats. It does not name
him. Fly back and the deposits are fewer and poorer, with no explanation offered.

Deposits are derived from the landing seed and never persisted, so "worked out" lives as a sparse
overlay keyed by place, per the project's own rule, rather than on a deposit that no longer exists
by then. It survives reloading: a place he talked about stays talked about.

**The game never makes him do it.** Telling is opt-in, it buys something true, and the bill arrives
in the human ledger rather than as a punishment. A player who never says a word simply loses
differently — quietly, by keeping to himself.

Guards: `91zzzh-told` — small finds are not worth telling; telling warms the counter and can only
happen once per place; the ether line fires exactly once, after the lag, and does not name the
player; and none of it is forgotten by reloading.

---
## 0.168.0 — the line with no name (M193)

Second item off the saga-vs-game gap list, and the cheapest thing in it: one row of data.

The arrivals board in the Tin's cantina has always carried overdue lines that nobody clears. One
of them is now the **shuttle of the «Долгий Ход»** — «Тесло», twenty-three years late, in exactly
the same markup as its neighbours, with no highlight and no note. It is not evidence. It is a line
on a board.

For that line to mean anything the player has to have met the call sign somewhere, so **one piece
of the hundred is now written by hand instead of assembled**. The other ninety-nine come out of
three banks — who, did what, and what it has to do with anything — and their strength is that a
ship's log is uniformly dry. This one names the boat plainly, in the middle of the «Тихоня»
chapter, in the same flat voice: *«младший борт ушёл на тихой тяге, шлюпка „Тесло", и это
последняя запись»*.

And then the game does nothing at all. It does not highlight, does not connect the two, does not
congratulate anyone for noticing. Whoever reads both lines puts them together themselves; whoever
does not sees one more overdue row on a board nobody cleans, and is right.

A guard caught something worth keeping while this went in: the board's test asserted "half the
lines are overdue" as the literal number three. Adding the shuttle made it four of seven. The test
was not relaxed — the ratio is a real design statement — so a seventh arrival («Обод») joined the
board and the assertion now checks the ratio rather than the count, plus that the shuttle is among
the overdue ones and carries the name the report uses.

---
## 0.167.0 — «Глобус»: прибор, который показывает место, а не число (M192)

The book's central object, and it was not invented: real ships carried a navigation indicator
called «Глобус» (ИМП, later ИНК) — an electromechanical analogue computer of gears, cams and
differentials, two ratchet solenoids, twenty-seven volts, one pulse a second, turning an actual
globe behind glass. It answered exactly two questions: where you are, and **where you would come
down if you braked right now**.

Nothing better could be designed for this game, so nothing was. It **does not speak** — the world's
rule for instruments (25a) holds: no beep, no alarm colour, no line in the journal; it shows, and
the player notices. It is mechanical, so the fourth layer of wear settles on it by itself. And it is
the theme cast in brass: for the whole game a device stands in front of the pilot answering, once a
second, «and where would I end up if I dropped all this now» — and half the time it points at empty
space.

It lives in the cockpit rack, right of the recorder, deliberately not in the row of dials: it is a
different kind of instrument and it has a different shape. A ray is marched along the current
velocity to the first body it meets; planets travel their orbits while the ray flies straight, so
the instrument lies exactly as much as an iron one would — it answers "if NOW", not "if you go
there".

**No sound.** The book has it clicking, and a click once a second for a whole flight is not
character, it is an irritant; the instruments-don't-speak rule beats the pretty detail. The tick was
made visible instead: the globe turns by a hair in a jerk once a second rather than gliding.

One design error found by looking at the frame: the second needle, "where you would land", always
lay exactly on the first — for a straight ray the bearing to the target *is* the heading. It is now
a range marker that creeps along the heading line from the axis to the rim as the target gets
further, and there is no marker at all when there is nothing ahead.

Two tooling traps paid for on the way: the stand kept setting the ship's velocity by hand and the
game loop kept damping it away, so the screenshot showed an instrument that had nothing to point
at — it now flies on a real autopilot. And a `perl -0pi` rewrite of `mkview.ps1` stripped the file's
BOM and moved the inserted block to the top; restored from git and reinserted by line number.
The BOM rule in `CLAUDE.md` exists for exactly this.

Guards: `91zzzg-globus` — the aim over twenty-four headings must only ever name bodies that really
exist in that system; the once-a-second rule; and a source-level check that the module contains no
`say`, `tell`, `logAdd` or `sfx`. Stand: `docs/mkview.ps1 ?s=rack`.

---
## 0.166.0 — an offer becomes a job, and the clock was measured in the wrong unit (M191)

**A button that pays you is not work.** Offers used to credit you the moment you clicked ВЗЯТЬ,
which made the game's main quest a vending machine. Now a paying offer has an address: you take it
here and you are paid **there**, and only there.

Taking one puts a **paper on the table** (`27i`) with the destination on it. That is the quest log
of this game, in its own language — there is no journal, no marker, no arrow, no timer, and the
board carries one dim «ВЕЗЁТЕ» line so that a man standing at the notice board does not have to
remember from memory where he was going.

**And this is how a name is earned.** Not by taking the work — by delivering it. Deliver, and the
next thing that person offers you comes with your call sign on it, without being asked. Fail to
deliver in time and, if it was named, the door shuts for good, silently, exactly as before. One
duty carried is worth more than any amount of standing about.

**The bug that mattered more than the feature.** `G.t` counts *frames* — `dt` in the loop is a
fraction of a 60 fps frame, and a day of this world is `CEL_DAY`, 3600 of them, one real minute.
The first build wrote the windows as `40`–`180`, "as if in minutes", so offers actually expired
**after about two seconds**, and the station's shift rolled over every four — meaning the guard
against farming stations did nothing at all. Everything about time in these modules now goes
through `CEL_DAY`, and two assertions pin the unit so the mistake cannot come back quietly.

---
## 0.165.0 — the four (M190)

Гуся, Рыба, Гвоздь, Птица — the people who stay for the whole game
(`docs/saga/ЖИВЫЕ.md`). Not eccentrics: a crew of colourful oddballs is the most worn-out thing in
the genre, and the poetics forbid it outright — nobody wisecracks better than their tiredness
allows. These four are **broken specifically, by the work**, and each is funny for what he takes
seriously. None of them knows anything is wrong with him and nobody around them brings it up.

- **Гуся** — a flight engineer who does not fly. Twenty years in the sky and not one takeoff of his
  own. Talks in long bursts without stopping so nobody can get a question in.
- **Рыба** — a pilot who cannot be indoors. Sleeps three hours, sleeps in the cabin even at a
  station, answers questions literally. Always on the air because she never sleeps.
- **Гвоздь** — throws nothing away, carries a box of other people's things and knows where each
  came from. «Ничьё уже». — «А зачем тогда?» — «Ну оно же есть».
- **Птица** — charming, asks for nothing, offers everything, never lies, only omits. Pleasant to
  stand next to, and that is where all the harm comes from.

They do three jobs at once. They make the world warm — until now only official voices spoke here.
They give an offer a **face**: «Вам — место в рейсе» weighs exactly what the person saying it
weighs, and an anonymous counter weighs nothing. And they carry the theme sideways: each of them is
somebody nobody came to relieve, and it shows in what they say rather than in explanation.

**Птица never names your call sign.** He proposes things himself, which is an entirely different
matter, and the guard checks it thirty times over.

Two rules made mechanical: one man per station and not every shift (a person who is always there
stops being a person and becomes furniture); and **one line per visit** — the first build let the
board's re-render advance his line, so buying fuel made him start a new sentence. People do not
talk like that.

Guard: `91zzzf-offer` — the line holding still across re-renders, the lines cycling without repeats
until they run out, and Птица never naming anyone. Stand: `docs/mkview.ps1 ?s=folk`, which winds
time forward to a shift where somebody is actually standing there, because otherwise you cannot look
at them, and looking is the point.

---
## 0.164.0 — the main quest gets its spine: the offer, the ledger, the door that shuts (M189)

The book («Смена», `docs/saga/`) becomes playable, and this is the part without which none of the
rest of it works.

**Why this first.** The arc turns exactly one value: *will anyone say your call sign out loud.* In
a book the prose points at that. In this game there is no quest journal, no marker, no reputation
bar and there never will be — so the value risked being invisible to the player entirely. That is
an architectural problem, not a cosmetic one, and it is written up in `docs/saga/СУД.md`, pass I.

The answer is not a UI. It is that **a named offer is visibly better than a cold one** — three
times, not ten per cent. Then a door closing is felt in the wallet and in the list of what is on
offer, without one line of interface. The player will never read the words "reputation" or
"morality". He will notice that he used to be offered good things and is now offered ordinary ones.

- **Возможность** (`11ah-offer`): the world hands out **access, not credits** — a berth, a bay in
  someone's garage, an institute topic, a name to drop. Always with a face, always with a window
  that closes. It arrives the way everything here arrives (the counter, the board) and expires
  **silently**: no countdown, no reminder, not a line in the journal. In the book the expedition
  list closes on a Friday and nobody tells him.
- **The door shuts for good.** Miss a *named* offer and that person keeps greeting you exactly as
  warmly and never names you again. There is no number behind it and no way back — not with time,
  not with money, not by reloading, because it persists. It is the only irreversible thing in the
  game, which is precisely why it will carry weight.
- **Тетрадь доброты** (`11ai-ledger`): everything done for free and without witnesses, written to a
  place the player can never see. Three guards, all tested: it is never displayed; **it refuses to
  record a deed that cost nothing** (the price is an argument of the function, so a free good deed
  cannot be logged); and helping while broke weighs more than helping with a full hold. First two
  hooks: cargo left at a mark for a stranger (`11ag`), and a barge fought off pirates (`12l`).
- **The station is not a tap.** Offers are generated once per place per shift. Fly away and come
  back and you are offered what you were already offered — even if you let it go. Missed is missed.

Caught by the project's own guards while building: income tried to go around `earn()`, and the
architectural test that funnels all income through it failed immediately. And the first screenshot
showed a named berth paying 852 credits to a player holding 600 — visible, yes, and it would have
broken the early curve; the amounts now sit deliberately below a full hold.

Guard: `91zzzf-offer` — the named/cold ratio, the door that shuts and survives a save, the ledger's
invisibility (it asserts the words are nowhere in the DOM), and the tap that no longer runs.

---
## 0.163.1 — the parrot's window moves off the right rail

Looked at on the stand (`?s=birdwin`) right after 0.163.0 gave it its styles back: at the right
edge it lay straight over the right rail's buttons and zoom. Moved to the left edge, where that
band is free — instruments are above it and the pad below.

---
## 0.163.0 — the first minute, from a playtest (M188)

An outside playtest arrived (`PLAYTEST-REPORT.md`, `PLAYTEST-01.md`, 26.08.2026, played on
0.160.0). Every finding was checked against the code and against the running game before anything
was touched — three of the five headline findings do not reproduce, and under two of those sat a
different, real bug. What follows is what the measurements said, not what the report said.

**Did not reproduce, measured:**

- *«ПРОДОЛЖИТЬ ПОЛЁТ» is the first button and starts a new game in emptiness.* The button is
  `display:none` in the markup and shown only `if(hasSave())`; on a cleared browser it is absent,
  measured. Restoring also announces itself («Полёт восстановлен · система · сектор»). The tester
  had a save from their own first fifteen minutes of fumbling. **But the state they described is
  real** — continuing into empty space, with nothing in frame and no way out — and that is the bug
  that got fixed, below.
- *The instruments vanish after a few seconds of calm flight.* Measured after nine simulated
  seconds with nothing changing: opacity 0.86, visible, reading «ТОПЛИВО 100/100 …». This was true
  before 0.160.0, when the panel rested at .34 at the bottom edge; it has not been true since.
- *The world stops living in a background tab.* Crew are computed from `Date.now()` with a
  24-hour cap (`CREW_OFFLINE_CAP`), not from game time. A backgrounded tab catches up on return.
  The tester flagged this as a question, not a conclusion; the answer is that the promise holds.

**Fixed — the first minute.** Three separate findings turned out to be one disease: *the game
offers a target and immediately loses it.*

- A miss no longer cancels the autopilot. `else{G.ap=null}` meant one fumbled tap on a moving
  planet threw away the flight already under way — punishment for imprecision in a game where the
  target moves by itself. Deliberate cancelling still works (thrust, brake, turn — anything but
  action/fire).
- Hit-testing moved from world units to screen pixels. It was `d < p.radius + 40/Z`, so at any
  distance forty world units are a few pixels and a planet the size of a pea could not be hit. The
  threshold is now the project's own 44 px finger rule.
- The compass chips at the frame's edge are buttons now, because they already looked like buttons —
  frame, arrow, label. Tapping «ЗВЕЗДА · 3105» flies you there. Each chip carries its autopilot
  target and a 44 px tall hit box. The **nearest planet** joined the star and the station in that
  compass, so from anywhere in the void there is always somewhere to go.

**Fixed — things that read as breakage:**

- The empty HQ was a full-screen black panel with two lines at the top and five hundred pixels of
  nothing («я что-то сломал?»). The control room is *drawn* in this game (`27f-hq-room`) and was
  being shown only once managers existed — that is, only when the screen was not empty anyway. It
  now draws always: dark consoles reading «ДОМЕН СВОБОДЕН», nobody at them. A picture answers
  "where is everybody" better than a sentence.
- `#parrotwin` outlived M151a: the styles were deleted, the markup was not, and `toggleParrotWin`
  kept adding a class nothing listened to. With no rules at all the block rendered in normal flow —
  so from the first second of a new game, «ТРЕПЛО ×» sat in the page's top-left corner belonging to
  a player who has no bird. It is a proper window again, hidden until the perch opens it. A new
  guard walks every direct child of `<body>` on a clean start and fails on anything visible that
  should not be.
- The receiver stops being a sticker over every panel. It was the one thing the tester said had
  already become annoying. It stays where M151a put it and stays audible everywhere, but loses its
  own glass, border and blur and sits inside the panel's header band.
- The mine printed «W A S D — копать» twice on one screen: once as the entry message, once in the
  permanent prompt. The message keeps only what the prompt does not say.
- The action button now names hold-actions too. The pattern required the prompt to *begin* with
  «ДЕЙСТВИЕ», so at a deposit («УДЕРЖИВАЙТЕ ДЕЙСТВИЕ — БУРЕНИЕ») the button read a nameless
  «ДЕЙСТВИЕ», and one step aside it read «ЗАЛОЖИТЬ ШАХТУ» — the tester found out which he had
  pressed only once he was underground.

Guards: `91a-flight` (the chips, the miss, the screen-space pick), `91f-ui` (nothing stray on a
clean start). Stand: `docs/mkview.ps1 ?s=hq` and `?s=hqfull`, because two full-screen empty windows
were found by an outsider and could not be looked at here.

**Открыто и записано, не сделано:** on the surface the walker is 25 px on an 840 px frame — 3.0 %
of the frame's height, measured — and the tester spent twenty seconds unable to find himself. The
ratio to the lander is correct (110 px vs 25 px ≈ a person against a seven-metre craft); what is
wrong is that the surface camera does not scale with the window, so a large desktop window simply
shows more world and shrinks everybody in it. The fix is a camera scale tied to frame height, and
it touches the world-x chunk cache, which is baked 1:1 — a milestone, not a patch.

---
## 0.162.3 — text over the world gets a shadow, not only a glow

Seen on the low-suit frame: the arrival message ran across the lit ring of the sky giant and
disappeared inside it. A glow separates a letter from a *dark* background and does nothing on a
bright one, and both the message and the action prompt had only a glow. Both now carry a dark
shadow first and keep the glow as mood. The same rule the instruments already follow.

---
## 0.162.2 — rain falls at its own speed, and the camera's precondition is written down

**The rain.** It has had two depths since 0.99.8, and that already gave it distance — but inside the
near layer every drop fell at exactly 1.75×, so the layer read as a texture sliding down the glass
rather than as water. The eye catches identical *motion* faster than identical size. Speed is now
per drop, from its own hash so it is not tied to depth: fast and lazy drops fall side by side. The
last of the M178 tails except the flat far ridge.

**M188, the camera — checked before starting, and it does not begin where it looks like it begins.**
The agreed design is "a photograph is a snapshot of the scene, not pixels", and it rests on the
engine being able to re-render a stored scene. It cannot today — not because the world is
non-deterministic (it is deterministic: `enterSurface` rebuilds terrain from the planet's seed), but
because drawing is welded to globals: every path paints into the one `ctx` at the one `W`/`H`,
reading the one live `G`. Rendering a stored scene therefore means either swapping the world under
the renderer and restoring it after — a save-corrupting class of bug — or giving the postcard its
own painter that owes nothing to `G`. The pixel alternative was measured and rejected: twelve
480×300 JPEGs are ~300 KB inside a save that also syncs to the cloud. The milestone's first pass is
`drawPostcard(ctx, snap, w, h)`; the button and the album mean nothing before it exists. Written
into `PLAN.md` rather than discovered again next session.

---
## 0.162.1 — the frame's darkened edges stop costing a full screen

The `.slope` introduced in 0.160.0 — the soft darkening that gives the instruments and the console
something to read against — was one element at `inset:0` carrying two gradients. Transparent in the
middle, but the browser still rasterises and composites the whole box, which is exactly the
full-screen fill that G0's rule forbids ("one full-screen pass costs 4–5 ms at ×2"). It is now two
strips, 150 px and 210 px, painted by the element's own pseudo-elements: under half the frame, and
identical to look at.

Measurement note: this machine is reading ±10 fps run to run on the same build tonight (two clean
`?g11` runs gave belt 54/49, landing 46/44, surface 48/43, road 30/41), so nothing here is quoted as
a before/after. What is stable across runs: dig 60, cave 60, raid 60. The change is made because the
rule says so, not because a number moved.

---
## 0.162.0 — the eye and the road: two interface passes (M182, M183)

The two remaining named questions from the interface series, run against the frames rather than
from memory: **the eye** — what the player looks at first on each screen, and what is louder than it
deserves; **the road** — how many steps between wanting a thing and having it.

**The market answers its own question first.** Opening a station's market, the first price sat below
the middle of the screen: a header, then a three-line block explaining a route the player does not
have, then "the hold is empty", and only then goods. An *absent* route is a hint and now waits at
the bottom in one line; a route that exists is work in progress and stays at the top where it can
be acted on. Six prices are visible where four were.

**An internal key was being shown to the player.** The table's header printed `G.mode` verbatim, so
the player read «Нейэль · system» — an English word out of the source, in a Russian game. There is
now a table of Russian names for every mode, and an unknown mode prints nothing rather than its key.
Two guards: one on the table's names, and a broader one that walks every screen and the table in
every mode looking for Latin words in visible text — the kind of leak that is invisible to the eye
because it looks like decoration. That guard also counts what it inspected and fails if it inspected
nothing, so it cannot go quietly green.

**Two more places said what the place summary already says** — the cave's «Пещера» and the home's
«ДОМ» headline (five such were removed in 0.160.0; these two were found by looking at more screens).

**The stand stopped lying.** `docs/mkview.ps1` forced `.hud{opacity:1!important}` so the instruments
would survive into a screenshot back when they rested at .34. At .86 that is unnecessary, and it was
actively harmful: it also overrode `body.screen .hud{opacity:0}`, so a screenshot of the station
showed the instruments floating over the open panel — a bug that exists only in the stand. The
override is gone; the stand shows what the game shows.

---
## 0.161.0 — the raid was drawn upside down (M180, pass 2)

The author, 2026-08-25, on the pirate-base frame: «не очень понятно, посмотри на перспективу», and
in the working note, «человек стоит на потолке». He was right, and literally so.

**The up vector pointed down.** The raid's coordinate system is left-handed (x right, y up, z
*forward*), but the camera basis was built as `right × fwd` — the right-hand rule. In a left-handed
system that yields "down": the measured vector was `[0, −0.987, −0.158]`. Every frame of every raid
since M35 was drawn mirrored about the horizontal: the floor receded into the *upper* half, the
ceiling into the lower, and a standing figure had his feet projected above his head. A compartment
is nearly symmetric top to bottom, so an upside-down corridor still looked like a corridor — the
error survived until standing figures and directional lighting made it visible. `up` is now
`fwd × right`, in a named function (`raidUp`) so an autotest can watch the sign; a second suite
checks the *frame* rather than the vector, asking where the floor is, where the ceiling is and
whether feet are below heads.

Three things the flip had been quietly breaking, all of them listed as separate suspects in the
plan, all of them one bug: the value order was "inverted" because the frame was inverted (the
floor's light pools and plates were rendering above, the dark ceiling below); contact shadows were
being suppressed by a guard that only draws a shadow *below* a body, and the floor projected above
every body; and "hanging boxes look like floor boxes" because they were floor boxes, drawn overhead.

**Loot crates had never once been drawn.** M180 replaced the on-screen loot sticker with a real
crate standing on the floor, wrote the code, and called `box()` for it *after* the polygon list had
already been sorted and painted. So for every version since, the world got a beacon floating in
empty space and no crate under it. The two loops moved above the flush and the crates now live by
the same rules as everything else — depth, fog, occlusion. Their light floor is also raised (.40
against the walls' .15): the contour is only drawn above .3, and a container without a contour
reads as "nothing was drawn here".

**Marks no longer pass through bulkheads.** Beacons, stencils and health bars were painted over all
geometry with no depth test, so the player could see loot and living pirates through the walls of
rooms he had not entered. They are now gated by `raidLineOfSight` — the same ray the enemies shoot
along, deliberately, so that "visible" means one thing in this mode and not two.

**The man became the measure.** Body scale came from `clamp(2200/z, .25, 3)`, and the cap of 3 was
reached at every playable distance — so bodies were drawn at a *fixed* size regardless of depth, and
that size was about four times smaller than the compartment's own geometry demanded (measured, not
guessed: a floor cell of 90 units spanned ~250 px beside the walker, so a 50-unit person should have
been ~140 px and was 55). A 110-unit compartment read as a five-storey hall. Scale now comes from
the projection itself — how many pixels a pole of body height occupies at that spot — so it cannot
drift and perspective on bodies works for the first time. Shadows, health bars and beacons are all
expressed in world units for the same reason. With honest scale the camera turned out to be standing
on top of the player, so it moved from 118 units back to 236, and the principal point moved to
`H*.53`, which now really does put the horizon at .375 of the frame (with the flipped vector, the
old `H*.44` had been putting it *below* centre — the opposite of what its comment claimed).

**The ceiling stopped being a hole:** value from .28 to .42 plus one transverse beam per cell, so
the plane overhead has the rhythm that gives it depth. The raid is also a step in the `?g11` probe
now, because until today the cost of this screen could not be measured at all. Clean run, one
window: raid 60.

---
## 0.160.0 — the instruments go back to the top, and the lamp starts meaning something (M187)

Two direct orders from the author, 2026-08-26: «приборы сверху, сейчас очень плохо не видно» and
«на столе чтобы не случилось в меню огонёк, он типо всегда горит и соответственно не работает».

**The state moved back to the top edge.** A2 (0.143.0) put it at the bottom on the argument that
the top of the frame belongs to the world. On the author's own screen the argument lost: the
bottom band already carries pads, console and action prompt, so the numbers landed in the noisiest
strip of the frame — over the ground the walker is actually looking at — and rested at .34 opacity
on top of that. Two rules replace the old one, and they are written into `style.css` so the next
pass cannot quietly undo them:

- **The top answers «who and where am I», the bottom answers «what can I do».** State (gauges left,
  place and purse right, the region pod centred in flight) lives at the top; prompt, console and
  pads live at the bottom; nothing lives in both, and the middle of the frame is always clear.
  `91f-ui` was re-pointed rather than switched off: it now guards the two zones and the empty middle.
- **An instrument that cannot be read is not an instrument.** Resting opacity .86 instead of .34,
  bars 4 px instead of 2, labels and numbers one step larger, a centre tick so a bar answers "how
  much" and not just "much/little". `91f-ui` measures both the resting opacity and the bar height.

Found by looking at the frames, not by planning: the suit bar stayed calm white at 14% while only
its number went red (`.low` sits on the row for suit/pack/hold and on the bar itself for fuel/hull —
the CSS rule reached only half of them); the top scrim had been carrying the bottom row too, so
moving it left the action prompt bare over bright ground (it is now its own element, `.slope`, with
both edges); and the canvas hint bar on the surface was positioned by a constant of 58 px measured
under three gauge rows, which in a crisis (five rows) sat inside them — it now reads the real band
height, `HUD_BAND`.

**One language, four screens.** With the place summary finally legible, four mode-entry messages
turned out to be saying what the summary already says: the planet's name and type on landing, the
word "Пещера" in the cave, the base's name, "Абордаж · name" on the raid. Each now says only what
is nowhere else on screen.

**The lamp.** It counted things with `!seen` — everything the player had not opened one by one — so
with a dozen unopened papers permanently on the table it was permanently lit, and a signal that is
always on is part of the button, not a message. Three separate notions now: the lamp in the menu
means "arrived since you were last at the table" and goes out on the visit, read or not; the wax dot
on an item means "unread" and goes out when the item is looked at; the counter on a tab says which
shelf the news is on and holds while the table is open, so opening it does not erase the answer to
"where". The visit is marked by an explicit `noticed` flag, not by comparing timestamps — a paper
can land in the very millisecond the table closes. Saves without the marker load as "seen
everything", so an old save does not light up on forty old papers. Guard: `91zzv-table`.

**Carried over, not written here:** the road's rank ladder (`ROAD_RANKS` / `roadRank` in
`27k-road`, shown on the road screen with the distance to the next rank) was finished in the
0.159.0 session and left uncommitted in the working tree. It is tested and green, so it ships with
this version rather than being reverted; the lifetime odometer `G.road.total` persists and defaults
to zero for older saves.

---
## 0.159.0 — the road: not a cap but a tank (M168k)

«Ну ты 2 раза ездишь на работу с работы, выходные на дачу далеко, давай поднимем потолок + типо
учтём колебания такие.» A flat daily cap cannot do swings by construction: it cuts a weekday and a
trip to the dacha the same way, and nobody drives evenly.

So it is a **tank** now. 2 200 credits flow in every day, it fills to 14 000 — about a week — and a
trip spends what has accumulated. The inflow is continuous, not at midnight.

- A weekday with two commutes spends 300–600 against an inflow of 2 200: **the tank grows.**
- **The dacha, three hundred kilometres there and back, is paid in full** — roughly 6 700, out of
  what the working week put by.
- Driving all day every day settles at the daily inflow and no more. This is not a cap that
  punishes a big day; it is a reservoir that rewards not having driven.
- On screen it is a quiet line under the trip counter — «запас 14 000 кр» — so it can be watched
  going down instead of being a wall. Empty, it says so and the mode goes on being free and pretty.

It stays a pleasantry against the game's own scale: a trade leg is 300–600 credits, a fully
staffed HQ burns 300+ a minute, so the road's entire daily inflow is about seven minutes of upkeep.

---
## 0.158.1 — the road: a trip and a day are different numbers (M168k)

«Каждая поездка новые кредиты или в день ограничить, а то не понятно» — and it was not clear for
a good reason: the screen showed the **day's** figure under a line labelled «за поездку». Both
numbers exist and both matter, so both are now on screen and say which is which.

- The big counter and the kilometres line are **this trip** — that is what you feel at the wheel.
  Each trip starts from zero.
- A quiet line under them: «за сутки N из 3 000 кр» — the day's total against the cap, so the
  limit is visible instead of being a surprise. It is hidden on the first trip of a day, when the
  two numbers are the same.
- The journal line the author liked now reports the trip first and the day beside it: «дорога ·
  командировочные: 94 кр за 5 км (за сутки 210)».

The cap stays a **day** limit, as it always was — that is what keeps a car ride from becoming an
income stream. Credits themselves are earned fresh every trip.

---
## 0.158.0 — the road pays for what you actually do (M168k)

«Еду 5 км до дома, как-то скучно за 20 кредитов» — and the boredom was not only in the size of the
number. The multiplier grew with *elapsed time*, so sitting on a motorway earned exactly what
threading through town did: nothing you did at the wheel mattered.

- **Six credits a kilometre** instead of two.
- **A corner pays.** Every real corner earns a one-off bonus by its peak, paid once on the way out
  of the arc — with a flying credit and a short «ПОВОРОТ +N» by the hull. Small corrections are not
  corners, and below the speed gate nothing pays: a car park has plenty of "corners" and no driving.
- **The way home pays better.** Once the trip's distance from its start has grown and then falls
  back, the mode decides you have turned for home and the rate goes ×1.5 for the rest of the trip.
- In practice: five kilometres home with a few corners is now about **130 credits** against 20.
  The daily cap went 1500 → 3000; it does not bind on a commute, it binds on a long road trip,
  which is what it is for.

---
## 0.157.0 — the road: the exhaust, and every hull checked (M168k)

Three corrections from the author on the field-bloom frame. Full pass in
[docs/DESIGN-road.md](docs/DESIGN-road.md).

- **The glow around the ship is gone.** The idea was right — the hull flies over a lit field — but
  a patch of light around a silhouette reads as a nimbus, a separate object, not as illumination.
- **The exhaust has two habits now, not one setting.** At a standstill it is a breath: short, wide,
  softly spreading. From 22 km/h an afterburner takes over — the ribbon doubles in length, stops
  spreading (parallel edges read as a lance, not a cloud), a white-hot thread lights inside, and
  the gas shears sideways. By 55 the habit is new entirely; at 30 it is already clearly under way.
- **The lanes were adding up.** Each nozzle drew its own body, and `lighter` summed them where the
  jets converge — double for two nozzles, sixfold for the Топор's six, burning the tone to white.
  All lanes of a burst are now subpaths of one path, filled once.
- **Alpha and colour were pointing opposite ways.** Brightness lives at the nozzle, and that is
  where the palette was whitest, while the hull's own accent sat in the tail at alpha 0.07. Fixed
  in the palette, not the exponents: the Стриж's trail is mint now, the Вьюк's amber.
- **Gas has no outline** — the body is laid twice, a wide pale halo and the main fill inside it.
- **Proportions across hulls.** The old fit made wide ships *shorter* than slim ones (the Вьюк was
  0.106 of the screen height against the Стриж's 0.171, though it is a tug). Length is now shared,
  width is a ceiling. The combined jet width had ranged sevenfold between hulls — 0.032 of the
  screen on the Клинок against 0.241 on the Топор — and is now a fraction of the hull's own
  half-width, with stops at both ends.
- **Measured, and one real cost found**: `imageSmoothingQuality:"high"` on the field's upscale was
  19.7 ms a frame on its own — a CPU resampling path, indistinguishable from bilinear at this
  magnification. The field is also blitted only where it glows. The probe (`?g11`) now includes the
  road as a permanent step and reports **60 fps**, level with every other mode.

---
## 0.156.0 — the road: the light is a field now (M168k, "делай максимум")

The author lifted this mode's battery budget — «в этом режиме делай максимум, всё равно тел на
зарядке» — and the honest answer to that is not "more blobs". The glow is now computed **per
pixel**: the fragment shader from the recipe he brought, written on `ImageData`
(`27lb-road-bloom`). Details in [docs/DESIGN-road.md](docs/DESIGN-road.md).

- **Domain-warped noise** — `fbm2` displacing the coordinates of `fbm2`. That one trick is the
  difference between fog and liquid: strands that curl and pour instead of blobs that breathe.
- **Colour comes from the warp**, in patches that flow with the light, out of a 64-step table
  built each frame as a closed loop through the palette. Both other options were tried and both
  are wrong — index by position gives a rainbow strip, index by fine noise gives marble.
- **The spectrum enters by X**: the height of the light over each point of the bottom edge is
  that point's own band. The equaliser is not drawn any more, it is dissolved into the light.
- **The ship is lit by the glow it flies over** — without the bounce it read as cut out and
  pasted on.
- The exhaust holds the hull's own colour along its length instead of fading to cream, which next
  to a coloured field had it looking like a grey pipe.
- **Measured, because "battery does not matter" is not "the frame does not matter".** First pass
  cost 17.9 ms of a 16.7 ms frame. Two octaves instead of three (the third lies inside a pixel
  after the stretch), a narrower field (the stretch *is* the blur), and the field on its own
  26 Hz while the frame stays 60 — hull, trail, stars and numbers all keep moving. **2.6 ms a
  frame** after.

---
## 0.155.1 — the road: the colour was arithmetic (M168k)

Six minutes of a real city drive on film, with the microphone on, and three corrections from the
author: a rich palette, the game's own sound off, and stars that read as flight rather than
blinking. The full pass is in [docs/DESIGN-road.md](docs/DESIGN-road.md).

(0.155.0 was this same pass with a different bloom — light raised to the footer line and a dark
band beneath it. The author saw it and said no: it read as a horizon with a searchlight. What is
described below is what shipped.)

- **The sky was green whatever the music — and it was arithmetic, not taste.** Hue was mixed like
  an ordinary number, so the walk from cyan to amber went straight through green; the intended
  «violet-cyan → magenta-amber» was unreachable by that formula. The hot end is now written past
  360, so the path always rises through magenta, and the ship's accent is blended on the circle.
  The three nebulae, which sat 42° apart and added up to one wash, are spread round it; the
  bloom's satellites now stand farther apart than they are wide, which is what it takes for three
  tones to read as three.
- **The bottom edge glows, across the whole width.** The bloom used to flood the footer — a ray
  cut through «ВЫКЛЮЧИТЬ МИКРОФОН», «НАЗАД» stood amber on bright green — and the first fix
  (raise the light, black out the band under it) read as a horizon with a searchlight. Now the
  edge itself glows and five narrow plumes rise out of it, each holding its own tone, with black
  above; the buttons are carried by the footer's own glass, not by a hole cut in the picture.
  Height grows with energy only weakly — the frame is not supposed to be flooded.
- **The glow is liquid, and the music moves it in three places.** Plume shapes are driven by the
  engine's own `fbm2` noise (what a shader recipe would reach Perlin for, at five numbers a frame
  instead of a million pixels), and the wave now also yields bass/mid/treble: bass moves the
  height and the speed of the flow, treble puts a fine ripple on the edges, mid the density. One
  number moving everything is what makes a visualiser look mechanical. A touch is a flash that
  decays, not a drawn ring.
- **The exhaust stopped being two plastic tubes.** Additive alpha peaked at 0.8 and clipped every
  channel to white, the ribbon's colour was taken from a near-white core along its whole visible
  length, and the two plumes ran parallel to the bottom of the screen. Now: a third of the alpha,
  the body in the hull's own tint, and the plumes easing onto one axis.
- **Stars behave like travel.** The scale divided by 120 km/h while a city drive is 15–45, so a
  streak came out three pixels and the only motion left was a sine on alpha. The scale now comes
  from the speeds a tier actually sees, streaks are longer, and the twinkle fades out as soon as
  the car moves — blinking is for standing still.
- **The game does not sound in the road.** It was breaking through the music playing in the car.
  A companion mode shows; it does not play. The player's own sound setting is untouched.
- **Nothing but the screensaver is on screen** — the pads and, later, the parrot window had been
  leaking through — and the main loop stops drawing the world while the road is up: it is invisible
  under a full-screen mode, and battery is this mode's stated price. The sensor tap now also takes
  the screen full-size; the browser's furniture was eating a seventh of it.
- **A truth window for the sensors** — long-press, or `?road=diag`. Through the whole filmed drive
  the hull never left the centre and never banked, and the screen could not say whether the road
  was straight or the measure was reading zero. Six lines of live numbers instead of guessing. Two
  thresholds moved with it: full swerve at 0.24 g instead of 0.30 (an unhurried city corner is
  0.10–0.20 g), and the speed gate opens fully at 14 km/h instead of 20, because in stop-and-go the
  old ceiling shut it exactly where a car turns.
- **The reward is visible without being larger.** Each credit flies from the hull into the counter,
  and the combo says what it buys («×1.7 КОМБО · 3.4 кр/км») rather than an abstract multiplier.
- The hull is smaller, the microphone hint stops hanging for the whole trip, and the system name
  no longer stands on screen twice. The swerve limit was twice what its own constant says, so at a
  full dart the hull stood in the screen edge and bank cut it off — never seen on the road, because
  the swerve never fired.
- **A stand for the road**: `docs/mkroad.ps1` → `docs/road.html`, with synthetic music and speed, so
  the frame that gets edited every pass can be looked at without half an hour of traffic.

---
## 0.154.0 — the exchange stops being silent (online audit, part two)

The rest of the online audit ([docs/DESIGN-online-risks.md](docs/DESIGN-online-risks.md)). The
finding that drove all of it: in a single-player game with a cloud save, the dangerous party is not
a cheat — it is **silence**. The server cannot know what a player earned (it stores whatever the
client sends, by design, and that is the right choice), so nothing is at stake in anyone's numbers.
What *is* at stake is an evening of play that quietly failed to upload.

- **Every failed exchange now says so, once.** A push refused because the cloud is newer, a token
  that expired, a save that no longer fits, a network that is gone — all four used to return
  silently, and the player learned about it days later on another device, by not finding their
  evening. Now the state lives next to the purse — `облако · не отправлено` — appears only when
  something is wrong, and the journal explains it in one line. Success stays silent, as it should.
- **A failed push is retried when there is a reason to** — the network came back, or the player
  returned to the tab — instead of waiting for the next save that may never come.
- **One tab plays.** Two open tabs wrote to the same key, and whichever saved last won: a tab
  forgotten in the morning would overwrite the evening. No attacker needed — just opening the game
  twice. The tab opened last plays; the older one stops writing and says so plainly, so the player
  knows which window to continue in.
- **Storage failure is now loud.** In Safari's private mode, or with a full quota, the game was
  writing nothing and only admitted it inside the settings screen. Now it says so the moment it
  happens — once, with what to do about it.
- **A save timestamp from the future no longer freezes the cloud** (server side, 0.153.1).
- **An account can be deleted** — `НАСТРОЙКИ → ОБЛАКО → УДАЛИТЬ`, password required. Everything goes:
  the record, the email, the cloud save and its daily copies. There was no way to leave before.
- **The server keeps a daily copy of the save it is about to replace**, fourteen days deep. It
  deliberately keeps the *previous* state: the incident that actually happens is a broken client
  overwriting a good game, and a copy of the damage would be worthless. A copy off the host was
  declined by the author, knowingly — the risk is written down in the document.
- **The road and the trace no longer share one pilot mark.** Each was harmless alone; together, on
  one disk, they tied where a person drives in the real world to what they do in the game. Two keys
  instead of one.

`14-save` was split along the fresh seam: the snapshot stays, the exchange moved to `14a-cloud`.
Suite `91zzze-sync`.
---
## 0.153.1 — the door nobody was watching (online audit)

An audit of the online side, asked for in plain words: what breaks without a connection, how would
the server know what a player earned, what stops a cheat. Findings and reasoning live in
[docs/DESIGN-online-risks.md](docs/DESIGN-online-risks.md); fixed here is the one item where a
stranger could hurt everybody.

- ** and  create files on disk without an account and without a rate limit.** Both
  sweepers were a dice roll (), so a script creates files far faster than they
  are swept — and on shared hosting the inode table runs out before the disk does. When it does,
   stops writing *everything*, including other people's saves. Now: a generous per-IP
  limit on both (300 road calls per quarter hour — ten honest pilots; 30 trace drops), a sweeper
  that runs by the clock instead of by luck, and two directories that were never swept at all
  (, ) now are.
- **A save timestamp from the future froze the cloud forever.**  is the sending device's
  , and conflicts are resolved by newest wins — so one phone with a broken clock made
  every honest save older than the cloud copy, permanently. Anything more than a day ahead is now
  taken as the server's own time.

Not fixed, written down instead (they need the author): the sync state is invisible — a refused or
failed push says nothing at all, which is how a phone and a desktop quietly become two universes;
there is no guard against two open tabs; and the trace's three a day limit counts a pilot mark the
client invents for itself.
## 0.153.0 — the audit: five files cut, two lies found (M183)

An audit of the sources, asked for in three words: cut the files, check the tests, look at the
structure. Measured first, then acted.

**Two things the game was promising and not doing.** A search for `typeof X === "function"` guards
standing over functions that do not exist turned up `crewGift`: the deal «Он отработал и пришёл к
вам в звено — даром» told the player a hand had joined the crew, the guard swallowed the call, and
nobody came. Written now (`12a-crew`), and the guard is gone. The same sweep for never-referenced
symbols found Vega's two dead tables: `VEGA_GIFT_BAD` — the comment in `vegaSeatAct` had promised
«руда — ссора» since the day it was written, with no code under it — and `VEGA_DREAM`, the lines
for **home**, while at home she was speaking the ones from the ship's cabin («летаешь как баржа» in
her own kitchen). Both now say what they were written to say. Fourteen genuinely dead functions and
constants were deleted.

**The build now catches this class of bug**: a `typeof` guard over a function that exists nowhere
is flagged on every build. The project rule "a perk without code is a lie" applies to calls too.

**Five files cut along their seams**, no rewriting: `12tb-settle-draw` 57→44 KB (the six trades →
`12tc-settle-crafts`), `23a-dig-draw` 50→33 (the mountain → `23aa-dig-rock`), `20-life` 45→29 (the
beasts → `20f-fauna`), `21b-surface-deco` 46→30 (the eight landmark forms → `21ba-deco-shapes`),
and `26-ui-station` 50→36 — its 600-line `renderTab` could not be halved, but four tabs came out
whole (`26b-ui-station-work`), the way the cantina and the flea market already had. The guard's
list went from eleven files to seven, and two grandfathered entries were **removed** rather than
re-baselined: a concession that outlives its debt is permanent.

**The test report stopped lying.** It had printed «0 мс» for every run since the line was written —
`test.ps1` runs the page under `--virtual-time-budget`, where `performance.now()` does not move
between synchronous calls. It now prints what is actually counted (suites) plus real seconds
measured outside: `ВСЁ ЗЕЛЁНОЕ · пройдено 6980 · наборов 258 · 11 с`. The suite itself needs no
optimising — 258 suites and ~7000 assertions in eleven seconds, most of it Chrome starting up.

---
## 0.152.0 — the pads never go away (M182)

«Пусть кнопки на мобиле всегда доступны, они пропадают и это пугает». M181 dimmed ТОРМОЗ and
ДЕЙСТВИЕ instead of hiding them, but four separate mechanisms were still making buttons vanish,
and the loudest one was not on any list:

- **A touch on the world faded the whole row.** The "auto" pad mode was written for a desktop:
  reach for the keyboard, the screen clears. But a browser fires a compatibility `mousemove` for
  every touch, so on a phone **any** poke at the world dropped all pads to `opacity:.14`. Auto-fade
  now never runs on a phone (`padsAuto`); the explicit «СКРЫТЬ» setting still works everywhere.
- **ОГОНЬ and РАКЕТА jumped the row.** They were shown only where they could fire, so an armed
  player leaving the system lost ОГОНЬ, the row re-packed, and ПРЫЖОК moved under the thumb. The
  rule is now: **what the ship can do at all keeps its place** (dimmed when inapplicable); what the
  ship does not have takes no space — that is not "vanished", it never existed. Mount a gun and the
  button appears once and stays.
- **The row could not fit and nobody had measured it.** With six buttons at a fixed 56 px the last
  one ran off a 375 px screen — and had been doing so before this change. Button size is now
  computed from how many are standing (`padsFit`), from 56 px down to the 44 px finger rule and
  never below; it re-fits on rotation.
- **The belt's eight buttons** (pitch, yaw, fire, brake, cutter, thrust — all live) do not fit in
  one row at any legal size, so the left group folds into a D-pad: pitch above, yaw below. ◀▶ and
  everything to the right now sit at the **same coordinates in flight, on foot and in the belt** —
  guarded by a test that compares positions across modes.
- Found on the way: `.pads` declared `--padscale` on itself while `applyPadSize` wrote it to the
  root, so its own declaration always won — **the «Размер кнопок» setting had been doing nothing**.
  The variables now live on the row itself.

A dimmed button also went from `.22` to `.38`: at a fifth it read as a ghost, which is the very
thing the author was pointing at.

---
## 0.151.0 — the sky measured by the narrow side (M178, the author's morning screenshot)

Two faults from the author's phone screenshot, both real and both about scale:

- **«Гора в полкадра».** The far ridges' amplitude and stretch were one size for every screen. On
  a portrait phone the frame is as tall as a monitor but a third as wide — so the viewport caught
  exactly one featureless flank with not a single summit in it, and a mute mass owned half the
  sky. The far layers now shrink with the width (`FARK=clamp(W/1150,.5,1)`): lower amplitude,
  denser undulation, tiles baked per measure (the key carries it, so rotating the phone simply
  rebakes). On a monitor nothing changes — the factor is 1.
- **«Дыра в полкадра» и «дыра следует за кораблём».** Sky-body sizes were computed from the frame
  HEIGHT — honest on a monitor, ruinous in portrait, where the black hole and the gas giant
  ballooned to half the frame. Every body now takes the narrow side (`skyU()=min(H,W*1.05)`);
  desktops are untouched. And the parallax was clamped to a tenth of the screen, so on approach
  across the whole strip the body rode along with the ship like a decal on glass. The clamp is
  gone: the drift is free and slow (5% of camera travel from the strip's middle) — fly away and
  the sky stays, the body leaves the frame and is there again when you come back.

---
## 0.150.0 — a button dims, it never vanishes (M181)

The author's direct order: «кнопки не исчезают на мобиле». The M167 rule "no ghost buttons" hid
ДЕЙСТВИЕ and ТОРМОЗ entirely when they did not apply — and the whole bottom row jumped left and
right on every mode change, while the thumb remembers a *place*. An inapplicable button now stands
exactly where it always stands, dimmed to a fifth and deaf to taps (`.pads button.off`). The
ready-flag fix of 0.143.0 (a long verb no longer counts as "no action") feeds the same class, so
the two bugs cannot recombine. Guarded in `91zzx-mobile` on both desktop and `-Mobile` runs.

---
## 0.149.0 — the pirate base, pass 1: composition and bodies (M180)

«Пиратская база говно, там чё-то сверху всё, скафандр, человечки» — three faults, each named:

- **«Сверху всё»** — the ceiling owned the top third of the frame because the principal point of
  the projection sat exactly at screen centre. Composition is fixed the way a postcard is framed —
  not by tilting the camera (tilt shears the verticals) but by **moving the horizon above centre**
  (`CY=H*.44`): the frame belongs to the floor and to those who walk it. The camera also stays
  closer (118 instead of 150), so fewer rock cells wedge between it and the player, and a pool of
  light surrounds the walker so the near floor no longer sinks into black sludge.
- **«Человечки»** — figures floated glued to their cells: no body had a contact shadow. Foes and
  the player's suit now stand on ellipses of shade cast on *their* floor (with a sanity guard: a
  shadow is only drawn below the body — a foe spawned over a mezzanine used to cast one onto the
  ceiling).
- **Stickers became things.** The loot container was an orange rectangle in screen coordinates
  with a blinking dot — an interface label over a hall where everything else stands in projection.
  It is now the same `box()` as the hangar cargo: standing on the floor, catching its cell's
  light, casting a contact shadow, with only a tiny breathing beacon left on the lid. Medkits,
  armour and charge packs are small cases on the floor too, their icons shrunk to stencil marks on
  the lid instead of floating interface glyphs.

Passes 2+ (the enemy bodies themselves, the hangar set dressing, the walkway reading) follow after
the author's morning look.

---
## 0.148.0 — the hold laid out in piles (M179)

The author's reference was The Forest's inventory: everything you carry laid out as objects on a
surface, so one glance says what is plentiful, what is scarce and what is missing. In Drift the
hold was rows of «Кремний ×12» on the ship screen — a table.

The СТОЛ gets a ТРЮМ tab on the desk lane (`27j-ui-hold`): every resource is its own **pile**, and
the pile answers both questions without numbers. *What*: ice in split shards, iron in rusty
ingots, silicon in polished boules, organics in cross-tied bales, crystals as a druse, isotopes in
a marked drum, volatiles in standing cylinders, tech components as a board, missiles side-on with
their fins — and people sitting on the edge of the frame, the one kind of cargo that looks back.
*How much*: the pile grows with the count (a power curve capped at sixteen pieces, so a hundred
does not turn to mush); the number stays as a small caption — a reference, not the channel.

Layout is deterministic from the resource key, so the spread never jumps between openings; the
paper stays paper — the split the author asked for («мою просто под инвентарь, а бумагу под
новости») is exactly the desk/sheet split of 0.144.0, and the hold joins things and tapes on the
wood. Checks in `91zzv-table`.

---
## 0.147.0 — the postcard pass, 1: what the author circled (M178)

The author cropped four places out of his own screenshots and said «поправь, чтобы смотрелось как
открытка». Each crop turned out to be a real defect with a name:

- **The "ringed planet" was a black hole, killed by the atmosphere.** `skyHole` drew the same
  picture everywhere, only paler (`globalAlpha=dim`): through a day sky the bright accretion arcs
  faded to nothing while the huge dark lens still landed at a third of its strength — a black
  smudge with a barely-visible hoop. Day light does not work like that: what you see through a
  bright sky is only what is *brighter* than it. Now the darkness comes with the dark
  (`surfNight`, full only in vacuum) and the disc stays visible by day as a pale ghost — the way
  a daytime moon does. At night the lens returns in force.
- **The sky giant got a floor against the CURRENT air**, not the night tone: on a dim world its
  body could still sink below the sky and read as a hole. Both sides are now clamped above
  `lerp(sky[0],sky[1],night)`, the terminator quenches toward air instead of black, and a soft
  halo of the same air sits round the limb — the body hangs in the atmosphere instead of being
  cut out of it.
- **The black polygons in the ground got their edges.** The cave mouth on the surface was a flat
  `#050708` half-ellipse — the same "hole in the render" the author had already circled once on
  the boulder. It now has a lip that caught the sky, an interior that darkens with depth, and
  stones at the threshold. The mine's abandoned workings (flat `.92` black) got an interior
  gradient and a lit upper rim.
- **«РАНЕЦ» glowed through the thumb pads.** The jetpack bar — and the suit line in the cave, the
  depth line in the mine, the suit/ammo strip in the raid — were painted on the canvas in the
  bottom-left corner, exactly under the DOM pads. The canvas cannot know where DOM panels stand.
  All of them moved into the state row (`РАНЕЦ` is a proper hairline next to СКАФАНДР, shown where
  the jetpack is used) and the place line (cave gallery and depth, mine depth and stratum, raid
  ammo and armour).
- **On the phone the action prompt sat under the console glass** (the author's sixth crop). The
  bottom storeys are restacked with real heights — pads, console, state, prompt — and the prompt
  no longer reaches under the right rail either. `test.ps1 -Mobile` guards the stack.

---
## 0.146.0 — the world heard: room tone (M178-10)

The game had music, steps and events — and no *places*: between the notes every planet carried the
same dead digital silence. `09a-roomtone` gives each screen its own steady floor of sound, built
from two looping noise chains whose filters and gains are steered every frame — nothing is created
on a mode switch:

- **the surface is wind**, and its strength follows `weatherPower` — so a storm is *heard before
  it is seen*: the sound rises while the power is still under the visual threshold, and the sky
  is clear;
- **the cave and the mine are rock**: a low blind rumble, deeper — lower;
- **the house is warmth**: a quiet low floor, rare wood creaks (a new `creak` voice), and the
  weather outside heard *through the wall* — low frequencies only, quieter than outdoors but never
  silent;
- **the base is ventilation**, the raid a thin duct hiss, the scoop the stream against the hull;
- **vacuum is nothing at all** — the absolute silence of an airless world stays, as character.

The loudness budget holds: the tone is a floor, not a soloist — its levels sit well under any
event. Verified live on the dev stand by measuring the node output with an AnalyserNode (never the
AudioParam): wind RMS 0.008 on a temperate surface, zero after the atmosphere is taken away.
Suite `91zzzd-roomtone`: per-place requests, vacuum silence, storm-before-sight, the wall filter,
and no node churn.

---
## 0.145.0 — the house gets an upstairs, and a shell (M178-9)

The last unpaid item of the original M170 ask («полноценный Симс»): the living part now has a
second storey. And with it came a fault nobody had named: the house was drawn as a *room*, not as
a *cross-section* — two thirds of the frame above the ceiling were flat black. A house has
something above the ceiling and below the floor, and now it is drawn: joists and dark underfloor
at the bottom, a roof slope with rafters and attic silhouettes at the top — and where the upstairs
is built, the upstairs instead: its floorboards on the slab, blind silhouettes of its furniture,
its lamp warmth seeping through the ceiling. The camera came closer (`k` up to 3.2), so the house
fills the frame.

- **`29e-home-up`**: the upstairs is not a new mechanic — `hinRooms()` simply returns a different
  list when the player is up, so every part of 29d (walls, floor, lamps, doorways, folk) works
  unchanged. Two rooms, СВЕТЁЛКА over the study and СПАЛЬНЯ over the living part; they appear with
  the «жилая часть» tier, and there is no attic over the garage — sheds don't get lofts.
- **The stair is a thing, not a button**: a real flight with treads, a stringer and a handrail in
  the living part, lit from the opening above; upstairs it is a hole in the floor with a rail
  around it, warm light from below. Walk to it, ДЕЙСТВИЕ — ПОДНЯТЬСЯ НАВЕРХ / СПУСТИТЬСЯ.
- **Upstairs is furnished quietly**: a bed with a headboard, pillow and folded blanket; a bedside
  lamp; a chair with a coat thrown over it; a window with the night sky, stars and a cold pool of
  light (downstairs has no windows at all — upstairs they are the point); in the loft a wide
  window sill with a cushion, three pot plants and a low table with books. Every one of them can
  be examined (`HIN_THINGS.bed/loft`).
- **Somebody lives up there**: Vega moves to the loft window — exactly her place, nothing is
  decided there. Folk walk their own floor and never push someone through the ceiling
  (`f.up`, floor-aware ticking).

Nothing is persisted; the floor is as ephemeral as the position. Suite `91zzzc-home-up`: the
upstairs appears with the tier, stair and hole align, floors don't mix, the things are reachable.

---
## 0.144.0 — release look, pass A3: the table becomes paper (M177)

The desk top has been drawn since M151a, but what lay on it was a dark window of lists — the same
interface as everywhere else, only on a wooden background. At a desk you read **paper**.

- **The notebook is a sheet.** `#loglist` and `#lorelist` stop being a translucent box: warm paper
  with a margin and a red rule down it, entries typed in ink, the time a pencil note in the margin.
  Each kind of record has its own ink — the ether in blue, people in pencil brown, money in dark
  green, an alarm in dark red — instead of the same phosphor palette the rest of the interface
  uses. A page keeps its body even when two lines are written on it.
- **Things and tapes lie on the wood, not on the sheet** — paper on paper does not read. On those
  two tabs the list becomes objects laid out by hand: each with its own shadow and a degree of
  rotation, and unread ones marked with a wax dot rather than a phosphor outline, because that is
  how unopened mail is marked on a desk.
- **A clipping now looks like a clipping**: `drawThingIcon` grew a fourth form — a torn scrap with
  a headline and two columns — and the "found object" became a metal plate with a notch and
  scratches. Before, a newspaper cutting and a plate pulled out of a cave were the same grey
  rectangle, and on a desk a thing is recognised by its silhouette before its caption is read.
- **The active tab is a paper label** on the wood instead of a phosphor glow, and the sector on a
  thing's caption says «сектор 0:0» instead of a bare «0:0».

Everything is scoped to `body.table`: the station, ship, crew and HQ screens stay glass over the
world. Suite: the table's own checks in `91zzv-table` — a page rather than a strip, dark ink rather
than phosphor, things and tapes on the wood.

---
## 0.143.0 — release look, pass A2: the state moves down (M176)

Pass 1 hid the ship's instruments while on foot. This is the rest of it: **the top of the frame
is the world**. The glass panel that stood in the upper corners of every screen is gone — it held
the most expensive place in the frame for readings that change once a minute, and the rule "only
what is needed now hangs over the world" was being kept only halfway (it faded to a third, but it
never left).

- **The readings moved down, next to the console**: state on the left, place and purse on the
  right, both as hairline bars with a number — no glass, no border, no blur, just a line and a
  figure over the world. They still wake for two seconds on a change and stay open while an alarm
  holds (`hudWake` moved, it did not change).
- **A slope instead of a box.** A hairline over bright ground did not read, but bringing the glass
  plate back would bring the sticker back with it. Instead the bottom of the frame falls off into
  darkness — a gradient with no edges, so it is not read as an element, and it carries the state,
  the action prompt and the console together. It lives inside `.hud`, so when the instruments
  sleep, the bottom of the world is clean again.
- **The composition changes per screen.** On foot fuel and hull decide nothing — the suit does,
  and it is the thing that runs out, so on foot it is СКАФАНДР and ТРЮМ. The distance to the ship
  is deliberately *not* duplicated here: the edge chip already carries it, and that chip is about
  the world. The region instrument pod is a cockpit instrument and now shows in flight only; its
  glass plate came off too, since it stood shoulder to shoulder with the hairlines.
- **The place line stopped repeating the gauges**: it used to say "трюм 12/40 · скафандр 84%" a
  hand's width from the bars that said the same. Now it says what only it knows — the world type
  and weather on the surface, the depth in the mine, what the belt is made of.
- **The right rail came down too.** It hung under the old top panel; with the panel gone it was
  the one thing left above the world. It now grows upward from above the state line — at the edge,
  as the rule requires, but in the half of the frame where the hand is.
- **On a phone** hairlines are unreadable, so the state is one line of numbers above the console,
  between the thumb zones. The bottom is three storeys now (console, prompt, state), so the
  transient message went back up to where it lived before M167 — the top is free again, and a
  message is not a panel, it passes.

Two faults found while looking at the real frames and fixed here:

- **On a phone a long verb cost the player the action itself.** «Есть ли действие» was inferred
  from the button's own label: if it did not say ДЕЙСТВИЕ, there was something to do. But a verb
  longer than fourteen characters («СКАНИРОВАТЬ ОРГАНИЗМ») does not fit the button and falls back
  to ДЕЙСТВИЕ — so the button counted as empty, and the phone rule "no ghost buttons" hid it
  completely. There was nothing to scan with. The flag now means *there is an action*; the label is
  a separate matter.
- **The suit lamp lit the whole column of ground at night** — see 0.141.0; the same sheet also
  showed it here.

Tools: `docs/pageshot.ps1` takes a screenshot of the **whole page**, interface included —
`docs/shot.ps1` only ever captured what a stand drew on the canvas, which is why the interface had
never once been looked at this way; `docs/mkview.ps1` is the scene stand behind it
(`?s=system|surface|cave|night|lowsuit`). `test.ps1 -Mobile` runs the same suites in a 390×844
window: the layout guards skip themselves when the window is not a phone, so without it the phone
half of the interface was never actually measured. The overlap guard `91f-ui` was re-pointed at
the new neighbours instead of being disabled, and now also asserts that no reading panel hangs in
the upper half of the frame.

---
## 0.142.0 — the planets are lit by their own star (M175)

`planetLight` baked the shading layer with a light vector written into the code:
`nx*-.52 + ny*-.42 + nz*.74`. So **every planet in every system was lit from the upper left**,
whatever the star did — a planet to the left of the star and one to its right were shaded
identically. It is the same fault M172 fixed on the surface ("the light had an hour but no
direction"), still standing on the screen the player looks at most after the cockpit.

The fix costs nothing, because seen from above the terminator is a straight line through the
centre of the disc, perpendicular to the direction to the star. So the baked layer stays baked
once and is **rotated** at draw time by the planet's angle to the star (`planetSunRot`) — no extra
bake, no cache explosion. The rim layer rotates with it: its limb term is rotation-invariant, its
day-side brightening is not. The disc cache now takes the sun angle into its rebuild key, so a
cached disc cannot keep yesterday's light while the planet moves along its orbit.

How hard the terminator is stays as it was — a soft light. That is art direction and belongs to
the author.

Stand: `docs/mkplight.ps1` (`powershell docs\shot.ps1 plight`) — six planets ringed around one
star with a line drawn to it, plus the real system view.

---
## 0.141.0 — a species becomes a thing (M174)

The game kept a *register* of species — `G.species`, «Новый вид: …», the count on the map — and
there was no species. Every trait was an independent roll per specimen: two plants "of one
species" shared nothing, and the name was assembled from six form-words for twelve drawn forms
plus a trait word rolled independently of what was actually drawn. **The game kept a register of
species that do not exist**, and the interface reported that register to the player as discovery.

A species is now a property of the planet, next to `planetBiome(p)` — `20e-species`:

- **`floraOf(p)`** gives three to five plant species per world, each with a fixed form, fixed
  proportions, fixed branching, its own colour, its own growth range, and its own preference for
  wet or dry. **`faunaOf(p)`** gives two to four beast species with a fixed archetype, body
  outline, colouring and habit; archetypes never repeat on one planet (two mantas in different
  paint read as one species painted twice).
- **A specimen is species + age + place, and nothing else.** Age is a body, not a scale: a
  seedling has fewer segments, no branches to speak of, no flower and no fruit; an old plant has
  a wider crown, two or three dead bare branches, a lean and litter at its foot. A young beast is
  smaller and bigger-headed; an old one is heavier and slower.
- **The specimen answers its place.** The strip's wetness and how far this point sits below its
  neighbours decide vigour: in a hollow the same species stands taller, thinner-stemmed and
  fuller-crowned; on a dry ridge it is stunted, harder and closer to the rock in colour. Leaning
  is no longer a random roll — plants lean toward where the star actually stands (`sunSpot`), by
  an amount that is a property of the species, so a whole thicket leans together.
- **The name cannot lie by construction.** The form word is the drawn form; the trait word is
  read off the real flags. Two lies were found this way and fixed rather than renamed: a spiral
  or ribbon plant called «светящийся» had no glow drawn at all, and no alien beast archetype drew
  glow either — so a «панцирник, светящийся» did not glow. Spines are now a real species trait
  that is drawn, common on dry and cold worlds. Cave flora is its own list: glowing species of the
  planet, or two of the cave's own if the planet has none — the old code took a surface plant and
  switched its glow on, leaving the name unchanged.
- **The register counts species, not bushes.** A second specimen of a known species is not a
  discovery: full data once, a quarter for a repeat observation, and `G.bio` counts new ones only.

Old registers are not carried over: a save without `bioV:2` loads with `G.species` emptied — its
entries name species that never existed. Everything else in the save is untouched and the format
is still `v:4`.

Two faults found by looking at the sheet and fixed here as well:

- **The cave mouth could land on the landing pad.** "Far from the ship" existed only in a comment;
  the position was thrown across the whole strip. On the pad the prompt and ДЕЙСТВИЕ belong to
  the ship, so the cave became unreachable. The clearance is now computed, and a test walks forty
  seeds to prove it.
- **At night the suit lamp lit the whole column of ground down to the bottom of the frame**, with
  a razor-straight vertical edge on both sides — the lit strip was clipped from the terrain
  profile to the bottom of the screen, so the geological cross-section glowed. Light does not
  pass through rock: the strip now follows the profile, is shallow, is built from five thin layers
  so it has a falloff into the ground instead of a bottom edge, and starts behind the walker's
  feet so it has no vertical seam.

Stand: `docs/mkbio.ps1` (`powershell docs\shot.ps1 bio`) — species of one planet, the age of one
species, one species across five places, the beasts, and three real strips plus night. Suite
`91zzzb-bio`.

---
## 0.140.0 — a plant gets a body, not a fill

Half of the author's «растения всратые» was fixed in 0.139.0 — where they stand. This is the
other half: what they are made of. Every one of the twelve forms was painted in a single flat
colour: no light across a leaf, no difference between stem and crown, no difference between
neighbours. On a frame that reads as an appliqué of coloured paper, and no amount of placement
cures it.

It is fixed in one place. `stemC` and `leafC` stopped being colour strings and became gradients
in the plant's own coordinates (origin at the root, up is negative), so every `ctx.fillStyle=leafC`
in all twelve forms gets light and shade for free. The light comes from where the star actually
stands (`sunSpot`, 0.138.0), and the tone wanders ±12% between neighbours from a hash of the
place — so a thicket stops being one patch of paint. The hash matters: an extra `r()` call would
shift the generation of the whole strip, which is how 0.139.0 broke the Tin suite.

One trap found by the tests, worth writing down: a form that builds its own radial gradient was
passing `leafC` into `addColorStop`, which now receives a gradient instead of a colour. Inside
another gradient you need a colour, not a fill.

**What this does not fix** is that there is no biology behind the picture — see the queue written
for the next session at the end of `PLAN.md`: neither flora nor fauna has a species, only
per-specimen dice, and the game keeps a register of species that do not exist.

---
## 0.139.0 — five things the author pointed at (M173)

The dev stand went up (`dev.ps1` → `/dev.html` and `/dev/`), the author played the build and
pointed at things one at a time. Every line below is a fault **he saw on his own screen**.

**"What is this at all?"** — a black polygon in the ground. It was the near-plane boulder of
`drawForeground`: filled at `amb×.30` with no contour and no material, so on dark ground it
stopped being an object and read as a tear in the render. It now has a body that darkens
downward, two chips, and — the point of the fix — **a lit edge along its top**. The rule is wider
than one rock: any silhouette in this game must carry an edge that caught the sky, or the eye
reads "nothing was drawn here" instead of "a dark thing".

**"The plants are ugly, and they clump."** Cluster centres were picked as the best of three
throws across the whole strip, lowest ground wins — and a strip has one hollow, so every cluster
walked into it: half the screen a wall of foliage, the other half bare. The strip is now divided
into as many stretches as there are clusters, and each looks for its low spot inside its own
stretch. Plants within a cluster are spaced instead of thrown, and each carries a depth — far
ones smaller and fading into the air, near ones full. (First attempt drew that depth from the
shared RNG and shifted the whole strip's generation, which failed the Tin suite; it comes from
its own hash now.)

**"This is rubbish too"** — the ringed planet in the sky, a black disc with a hoop. Three causes:
the body took the palette of the planet *underfoot*, so a dark world gave a dark disc and a .86
terminator finished it into a hole; the light always came from the right whatever the star did;
and the ring was two thin arcs of equal brightness front and back, with no planet shadow and no
divisions. The body is now lit from where the star actually is, mixes the star's colour so it can
never go black, and the rings are five bands of different width and brightness with the planet's
shadow lying across them, the far half dimmer and the near half half-transparent over the disc.

**"The lamp just doesn't light anything"** — and that was 0.138.0's own cone: a milky wedge laid
over the world, over the sky as well, with nothing under it getting brighter. What you see at
night is not the beam, it is **the lit ground**. A strip along the terrain profile in front of the
walker now genuinely brightens, added over the rock so the material still shows, falling off with
distance; the airborne beam stayed, faint and narrow, and only where there is atmosphere.

**The home read as a warehouse.** The wall was bare from waist to ceiling, and the eye measures
height by things, not by paint: a dado, a skirting and a beam give it three horizontals, and the
ceiling came down from 2.6 man-heights to 2.3. Every room got one object **in front of** the
walker, cropped by the bottom edge, so a room has a front and a back instead of one flat plane.
Residents got depth and elbow room — five of them used to stand on one line, shoulder to
shoulder, reading as a row of identical cut-outs.

---
## 0.138.0 — the light gets a direction (M172, the world on foot)

The walking screen is the longest one after the cockpit and the last one still
without a pass of its own. Looked at whole — full frames, no crop, noon and
midnight side by side (`docs/mkfoot.ps1`) — and four faults were plain.

**The light had an hour but no direction.** `celSun` has told the game what time
it is since 0.102.0, but the star itself was nailed to `W*.78, H*.16`: the hour
changed only how dark the frame was. Noon and dusk were the same picture at
different brightness, and the star never set. Now `sunSpot(p)` (19c-light) is the
one place that says where it is — east on the left, west on the right, overhead
at noon, below the horizon at night — and the glow, the disc, the sky calendar,
the clouds' lit side, the shafts and the rim on the suit all take it from there.
The bloom moved from a full-screen baked layer to a sprite blit, because a layer
would have to be re-baked at every step of the sun. Two signs disagreed and one
was wrong: the sky's horizon glow sat on the *opposite* side from the star.

**Night was a flat wash.** One `fillRect` over the whole frame darkened sky and
ground alike, the ridge silhouette dissolved, and midnight read as fog. Night is
now a gradient with a value structure: the sky keeps most of its light, the
ground goes deep, the horizon survives as a line, and when the star has just set
its afterglow stays on its own side of the sky.

**The lamp was a glowing man.** A 150 px symmetric ball around the helmet. It is
a headlamp now: a narrow cone forward along the look, a hot pool where the cone
meets the ground, a small halo at the helmet.

**The far ridges were a straight line.** Both distant layers used the terrain of
the ground underfoot stretched 3.6× and 2.4× sideways with the same amplitude —
across one screen almost nothing was left of the relief, and the horizon read as
a band of haze glued to the sky. They have their own amplitude now (×2.3 and
×1.6, baked once per planet), so there is something to measure distance by.

Two more: the horizon sits at `SURF_HOR` (.64 instead of .58, one constant
instead of three magic numbers), because 42% of every frame used to be the
cross-section of dirt under the player's feet — the largest and emptiest area of
the picture; and the walker gets a rim light on the star's side, because at 26 px
he was the same value as the ground and had to be *looked for* on the screen
where the player spends most of his time.

Measured on the same machine, same window, against the 0.137.0 build immediately
before: surface 48→48, belt 60→60, dig 60→60, cave 60→60, landing 55→57,
system 47→46, scoop 42→37 (scoop has no code from this pass in it and has
swung 42–60 between runs before). New tool: `docs/g11.ps1` runs the built-in
`?g11` probe headless and prints the numbers — **never** with
`--virtual-time-budget`, which fast-forwards timers and measures the
fast-forward instead of the frame.

---
## 0.137.0 — somebody was here before you (M171)

The first thing in the game left by another living player, and it arrives
without a word. A pilot standing beside his ship can cut his mark into a stone
and leave up to five units of cargo at its foot; somebody else, landing on that
same planet, finds the stone, takes what is under it, and the goods are gone for
everyone. `11ag-trace`, `a=trace` in `site/api.php`, suite `91zzza-trace`, design
in [`docs/DESIGN-trace.md`](docs/DESIGN-trace.md).

**Nothing a human types crosses between two games.** What crosses is a mark —
one of twelve shapes — a six-character "hand", a resource key and a count. There
is nothing to moderate because there is nothing to write. The mark is not chosen
either: it is derived from the anonymous pilot id the road companion already
uses (`localStorage.drift_pilot`, random, no account), so a pilot has one mark
for life and cannot pick a shape to mean something with it. None of the twelve
means anything, and the game never explains them.

The hand is the whole of recognition: when you take a mark cut by a hand you have
met before, the notebook writes «Рука та же.» and stops there. When somebody
takes yours, your next landing brings one ether line — «ваш знак подняли» and how
many. Never who, never where.

Caps: three left per real day, eight kept per place, thirty days of life, one
request per landing throttled to twenty seconds. Offline is the normal mode, not
a degraded one — on `file://` there are no traces and no action to leave one, and
the interface says nothing about it.

Drawing took five passes and the fourth of them changed the design. The mark was
meant to be cut into the ground; it read as a stick jammed into the dirt, and no
amount of size or contrast fixed it — the game looks at the world **from the
side**, where a mark lying flat has no surface to be seen on. So the mark is cut
into a stone the pilot sets up: a vertical face is the only plane this world
shows whole, and setting a stone on purpose is truer to the act anyway. The stone
is chest-high to the walker, its silhouette broken out of the hand's hash so two
of them are never twins, with sacks at its foot. Stand: `docs/mktrace.ps1`
(twelve figures large, then two worlds at walking distance and at ×3).

---
## 0.136.4 — the wave glows like the reference (M168j)

The author brought screenshots of Yandex Music's "Моя волна" cover: a bloom of
light radiating from the centre, several distinct colours at once, the palette
following the mood of the track. The road's bottom glow was a flat single-hue
wash by comparison.

The bottom of the road screen is now that bloom: a core in the mood colour, two
satellite blobs with hues shifted ±115° — an energetic track lands on
magenta/amber/green, a sad one on cyan/green/violet — and a fan of seven thin
rays whose lengths are individual bands of the spectrum: `RD.wave`, computed
since M168b, is finally drawn rather than merely smoothed. Everything breathes
with energy, the beat pushes the core, and the whole thing drifts slowly so it
never reads as a static sticker. The flat wash survives only as a thin strip at
the very edge, laying light under the buttons.

The author's M168c ruling stands: no curve-band over the footer.

## 0.136.3 — the road hears the music and shows its engines (M168i)

A second evening drive on video. Three complaints, all confirmed by the frames.

**The music barely showed.** The capture is deliberately raw (AGC off, for Android
Auto), and from a phone microphone the car speakers arrive at an RMS of 0.05–0.15 —
on an absolute scale the nebulae hardly breathed and a beat never crossed the
threshold. The analyser now normalises against **its own slow-decaying peak**
(half a minute): the loud passage of a track is one, a quiet verse is its share of
one, so the track's dynamics survive while the absolute level drops out of the
equation. Beat detection went relative for the same reason. The nebulae, the bottom
glow and the engine flare (which now pulses on the beat) all got brighter to spend
the signal they finally receive.

**The stars were invisible.** Brightness floor lifted, palette brightened two
steps, each star twinkles on its own phase, and a large near star at standstill
earns a cross-glint — which fades out in motion, where it read as a "T" pinned to
the streak.

**Braking showed nothing.** The hull's own nose thrusters are three pixels at this
scale. The road now draws its manoeuvring jets in screen space, under the hull:
braking fires two cold splayed cones forward from the shoulders, pulsing out of
phase; a hard turn fires a short lateral puff from the nose on the side opposite
the swerve — the jet that explains who is pushing the hull. Cold blue-white, so
they never read as the main engine.

**Bluetooth microphone = dead music for everyone.** On top of the Android Auto
call-detection problem: if the capture lands on the car's Bluetooth microphone, the
headset is switched to the hands-free profile, which cannot play A2DP music at all.
The road now enumerates devices after permission and re-opens the capture on the
phone's **built-in** microphone whenever the default turned out to be a
bluetooth/hands-free/headset device (a pure function, `roadMicPick`, covered by
tests), and marks the track `contentHint="music"`. A car may still show a phantom
call — that part is the head unit's own guess and no web API can veto it — but
declining it from the wheel no longer kills the capture or the music.

Also: the trip line now carries the trip's top speed — "за поездку 2.10 млн км ·
макс 26 389 км/с".

## 0.136.2 — the microphone is a separate yes (M168h)

Plug in Android Auto and the head unit sees an open audio capture, decides a call is in
progress, and ducks or kills the music. The road screen was asking for the microphone
inside the same "РАЗРЕШИТЬ ДАТЧИКИ" tap that turns on GPS — so anyone who wanted the
feature at all got the microphone whether they wanted it or not.

The microphone only ever fed the mood colour of the wave, and without it the wave breathes
on its own. So it is now split off:

- **Sensors and microphone are separate consents.** The button turns on what the screen is
  actually for — GPS, motion, wake lock. The microphone is a second, deliberate tap, and
  it is off by default. The button names the next action: "СЛУШАТЬ МУЗЫКУ", then
  "ВЫКЛЮЧИТЬ МИКРОФОН", so it can be killed mid-drive without leaving the screen.
- **When it is on, the capture is raw** — `echoCancellation`, `noiseSuppression` and
  `autoGainControl` all off. Echo cancellation is what pushes the stream onto the voice
  route, and it is that route the head unit reads as a call; an unprocessed capture is
  usually taken for a recording instead.
- **Its own `AudioContext`**, not the game's. If the system does switch a context into
  communication mode, let it be the empty analyser context rather than the one the game
  plays through.
- **The cost is stated on screen before the tap**, not discovered on the motorway:
  "микрофон: цвет по треку, но Android Auto примет за звонок". While it is listening the
  screen says so.

The choice is remembered in `G.road.mic` and survives a save.

## 0.136.1 — the road companion measures the road, not the cradle (M168g)

Four minutes of real driving on a phone, watched frame by frame, turned up two faults
that had nothing to do with each other and one that explained the rest.

**The exhaust was a stack of bricks.** The ribbon was drawn as a hundred separate
strokes composited with `lighter`; the overlap at every joint piled up, the width grew
in steps, and the result was two rigid pale columns running from the engines straight
off the bottom of the screen — across the НАЗАД button. It is now **one body per
nozzle**: a single filled shape with a lengthwise gradient, quadratic falloff (the fix
the flight trail already carried), and a lifetime tuned so the ribbon is always the same
length on screen and always burns out inside the frame. The bottom fifth of the sky
fades to background, so the footer stays clean whatever the ship is doing. Points are
laid at a fixed step along the path rather than once per frame, so the ribbon has the
same density at 30, 60 and 120 Hz.

**The trip counter reset every minute.** `roadDayReset` compared against the *game* day,
and a game day is sixty seconds of real time — so "за поездку" and the credit tally were
wiped mid-drive, over and over, and the daily cap never applied to anything. The road day
is now the calendar day.

**A cradle is never level, and that was being read as a permanent turn.** A mount tilted
by 10° adds 1.70 m/s² to the lateral axis — 0.17 g, more than an unhurried city corner is
worth — so the ship lived pinned to one edge. Dividing by a larger number cannot fix that:
it flattens the real corner along with the tilt. The measurement was rebuilt instead:

- an **auto-zero** learns the resting gravity vector of the cradle, and learns it only on
  the straight, so a corner cannot be absorbed into the baseline;
- the lateral axis is taken in a **frame built from gravity**, not from the screen, which
  removes any static tilt on both axes at once — it only gives up when the screen's own
  X axis stands near vertical, and then it says so instead of inventing a turn;
- the **turn itself is the yaw rate about the vertical**, projected out of `rotationRate`,
  which does not care how the phone is mounted. It is converted to lateral acceleration by
  a = v·ω so both sensors share one scale in m/s²: agree and the larger wins, contradict
  and the smaller does.

`gamma` from `deviceorientation` is gone. A cradle stands the phone nearly upright, which
is next to the singularity of the Z-X'-Y'' decomposition, where `gamma` jumps at any
nudge — that was half of the twitching. The other half was `Math.random()` per frame
driving the shake: it is now a smooth two-tone wobble with a kick on a real pothole, and
the shake level is read from acceleration with the cradle's tilt already subtracted, so a
smooth road no longer holds it at the ceiling.

**And the frame has air in it.** The ship is a fifth of the screen instead of a quarter,
the swerve reaches further out — clamped by the hull's measured half-width, so it can ride
the very edge without ever being cut — every star has its own size, length and brightness
with a near-static dust layer behind them, and the nebulae are bright enough that standing
at a light is no longer a black screen.

The screen half of `27k-road.js` moved to `27l-road-draw.js`; the file had passed 40 KB.

## 0.136.0 — "Home" (M170)

The home stops being a panel and becomes a house. It stands on its own planet in
its own system: land there and the navigator shows **ДОМ** among the markers, walk
up and the porch lamp is already on, the chimney is smoking, the window is lit.
The yard is cleared, the house sits on a cut terrace, and every tier you have
earned is out there — the garage with its doors, the display case, the workbench,
the mast with the beacon blinking.

**ДЕЙСТВИЕ at the door takes you inside.** The eight tiers are eight rooms you
walk through, with openings that show the next room's light and blank masonry
where the house has not grown yet. Each room has its own floor and its own things
to stand next to and look at — the mattress it all began with, the crate that
serves as a table, coats on hooks, the boat under a cover, the display case, the
workbench and the machine, the desk and the wall map, the bed and the common
table, the beacon console. And the people who live there live there: Вега sits in
the study, gets up, walks and works, and answers when you hail her; the lodger
keeps house, the trainee fiddles in the workshop, off-duty crew rest in the hall.
They step aside when you crowd them.
---
## 0.135.0 — "Looked at again" (M169)

A graphics campaign, screen by screen, against close-up shots rather than memory.

**The settlement** was a row of identical boxes one human tall, stepping down a slope, with the
kiln, the forge and the weir drawn exactly alike. It is a place now: a terrace cut into the hill
with a retaining wall and a trodden street, homes in the middle and crafts at the edges, every
third yard in a smaller sky-tinted back row, a body for every craft (dome kiln with a firebox,
open forge with hearth and anvil, dam with a pond and a spill, saw trestles, still with a worm
and barrels, field with beds and a scarecrow), four dwelling plans with porches and lean-tos,
stone footings, real windows and doors, log-end woodpiles, laundry and barrels between the
yards, a fence and a gate, a communal fire whose smoke is the settlement's column, and villagers
who walk and work. The word ПОСЁЛОК printed over the roofs is gone: a place that needs a label
is drawn badly.

**The mine** got its rock — cloudy tone and temperature, jointing that runs across tiles, a
mineral dyke, damp stains, and abandoned collapsed workings with rotten timber about one per
screen of depth. **The cantina** got a host: a barkeep who wipes, pours, reaches for the shelf
and leans on his elbows, patrons who sit in different poses, and a bottle wall with three
silhouettes instead of one rectangle repeated forty times. **Deposits** stopped being interface
icons and became outcrops with a form per material. **The ground cross-section** — half the
surface screen — is broken by faults with lenses inside the layers. **The gas giant** grew shear
rolls along its band edges.

Two real bugs fell out of it: a page that loads hidden left the canvas 0×0 forever, and the
corona's push cut off at the overheat rim so a hull hovering there vibrated. Frame rate after the
campaign is unchanged (system 55, belt 60, landing 51, surface 48, dig/cave 60, scoop 55 at ×2).
---
## 0.134.0 — "Company on the road" (M168f)

Pilots riding the same real-world sector are no longer just a count: they fly alongside as
distant fellow ships — a spark with an exhaust, each at its own depth with its own drift,
slowly overtaken. The picture is deterministic per sector, so everyone in the cell sees the
same companions; counts fade in and out instead of blinking.
---
## 0.133.0 — "Measured, not guessed" (G11 closed, M168e)

G11 closed by an honest measurement: the game carries its own probe now — `?g11` tours the
modes and reads rAF fps in a visible tab, `?g11=deep` mutes draw passes one at a time. Warm
cruise at ×2: system 56, belt 60, surface 55, mine/cave 60; the scary 44s were cold starts
while chunks bake. No pass dominates, nothing to bake blind. Two faults the author found by
playing: the corona now pushes with a force that grows from the rim inward, so a hull hovering
at the overheat line no longer vibrates across it; and the scoop's prompts finally call the
exit button by its on-screen name — «ВЫХОД», not the nonexistent «НАЗАД» (leaving a gas giant
was impossible to find, not impossible to do). The road companion (M168e): music is a
breathing gradient from the bottom edge, the hull is 40 % smaller and sways outward in turns,
acceleration pulls it up and braking down, the nozzles drag the real flight ribbon, HUD text
stacks without gaps, and the land is mapped onto the universe — a ~2.8 km GPS cell is a named
system, with other pilots in the same cell counted through the site (`api.php?a=road`,
anonymous tag, no coordinates leave the phone).
---
## 0.132.0 — "Nose up" (M168d)

The author's first real ride fixed the geometry: the road companion now flies **nose up** — on
a portrait phone the road is ahead, stars stream downward, the hyperdrive tunnel converges above
the ship, beat stars fall from the top. The nozzles pull **trail stripes** in the same colours
as the in-flight trail (`trailTint` core/mid/edge). In a real turn the hull **darts off centre**
(lateral acceleration + tilt, up to a fifth of the screen) and then recentres slowly — quick to
the side, gentle home. Suite `91zzy` follows the new centre.
---
## 0.131.0 — "Gradations" (M168c)

The author caught the 3–300 km/h window pretending to be common sense. Three tiers now, with a
four-second hysteresis: **ДОРОГА** to 200 (car), **ЭКСПРЕСС** 200–400 (a train — star streaks
stretch double), **ГИПЕРДРАЙВ** 400–1000 (a plane — a converging star tunnel, a light cocoon
around the hull, the flame a step up, and the big figure switches to fractions of light:
850 km/h × 1 000 000 reads **«0.79 световой»**). Above 1000 km/h the road is not believed. The
sub-line trims itself on narrow screens. Suite `91zzy` knows the tiers.
---
## 0.130.0 — "The road pays and the music breathes" (M168b)

The road companion, second pass by the author's notes. **Credits, not ice**: 2 cr a real
kilometre with a live ticking counter, and a **combo** — drive without stopping and it climbs
to ×3 over twenty minutes, stand two minutes and it burns; the day cap is a soft 1500 («взломают
— сами дураки»). **Acceleration and braking play**: the GPS speed derivative pitches the hull —
nose up and a fatter flame on throttle, a forward dip and the fleet's own nose thrusters on
brake. **The equalizer is gone** after an honest self-critique (linear bins, boxy winamp bars,
jitter, deaf colour): in its place a smooth glowing **wave** of log-spaced, time-smoothed bins,
and **nebulae that change colour with the music's mood** — energy × spectral brightness choose
the hue (violet-cyan calm → magenta-amber loud), blended with the colour of your own hull, the
way «Моя волна» blends the track's colour with yours. Loud beats spawn stars on the path;
touching the screen rings a white pulse. Suite `91zzy` rewritten for credits and mood.
---
## 0.129.0 — "The road companion" (M168)

`27k-road`, from the author's voice note: when the player actually travels — a car, a bus, a
train — the game becomes a living screensaver. The МЕНЮ door «В ДОРОГУ» opens a full-screen
mode: your own hull, large, flying — banked by the phone's gyroscope in real turns, shaken by
road vibration, flames growing with speed; stars stream past; the bottom edge is a microphone
equalizer, so if music plays in the car the ship flies to it (a synthetic pulse when the mic is
denied). The numbers are real and fantastic at once: GPS speed ×1 000 000 (90 km/h reads
«25 000 км/с»), the trip in millions of km. The road pays **ice** — a unit per real kilometre,
40 a day at most, granted into the hold on exit with a record-book line: a pleasantry, not an
economy source; speeds under 3 and over 300 km/h do not count. Sensors start from one button
(iOS gesture rule), Wake Lock keeps the screen on, and the entry line admits the battery is the
price. Suite `91zzy`.
---
## 0.128.0 — "The phone edition" (M167)

The six faults from the author's phone review, in order. **The receiver is a ticker**: on
narrow screens the console strip spans the bottom in one line — band chip and running text; a
tap opens the knob sheet for two seconds, then it hides; no floating window. **Thumb zones**:
КАРТА and МЕНЮ drop to the lower right, the zoom buttons are gone — pinch is the gesture (it
already worked). **No ghost buttons**: ТОРМОЗ is absent on the surface instead of faded, and on
phones ДЕЙСТВИЕ without an action is absent too. **One hint slot**: the message and the prompt
are single lines above the console; the surface hint ellipsizes instead of running off the
plate. **Edge chips**: off-screen targets in system and surface views are plates pinned to the
frame's edge — arrow, name, distance — stacked overlap-free instead of floating over the sun.
**The fit screen is split** into КОРАБЛЬ | СКАФАНДР tabs; kit rows keep name, a class chip and
a "new" dot on one line. **The suit doll**: the white block-robot is replaced by a layered
paperdoll composited from the equipped pieces — three families of palette per place (issue
canvas, institute white, expedition olive), layers pack → boots → torso → gloves → helmet →
lamp, one outline, one light; wear reads as scuffs and a dull visor; the doll breathes and the
lamp sways; **the same palette walks the surface** (`drawAstronaut` now dresses from the kit).
mechanics.html gets a one-column phone layout. Suite `91zzx`.
---
## 0.127.0 — "Dominoes" (M166)

`11af-domino`: dominoes at the table — three turns, a chain, a hand of three tiles seeded by the
day and the place (reopening the screen does not redeal), «стучу» when nothing fits. In the
cantina the opponent is a rival (or Vega when she flies with you); at home, Vega or the mate. The
stake is never money: a win pays a rumour or a spare part, a loss costs a quip. With Vega any
outcome is a quarrel — «Ты ПОДДАВАЛСЯ» or «Я выиграла. Ты расстроился.» — those are her rules.
Beside the table stands a chess board; only Varlamova played it, and after she leaves nobody
sits down. Suite `91zzu`. **The joys (M164–M166) are built; the fourteenth pass's play queue is
done — M167 (mobile) and the release look remain.**
---
## 0.126.0 — "The wall newspaper and the request concert" (M165)

`11ae-concert`: the station's folk layer. On ДОСКА hangs a drawn sheet — «СТЕННАЯ ГАЗЕТА» with
three cells: a caricature (a barge that was late; with a bad reputation here, it is you, leaning
forward in a hurry), a «МОЛНИЯ» about the plan (fed by the expedition collection and closed
needs), and a keeper's four-line poem, changing weekly. Below it the **request concert**: once a
day, for 10 cr, a greeting to a named station — its three-note call sign (seeded, stable) plays,
the line goes to the ether, the record book notes it, Vega demands one too («нет, не сейчас — я
обижусь, что по заказу»), and sometimes a rival answers with a greeting «борту, который передаёт
приветы». Suite `91zzt`.
---
## 0.125.0 — "The space zoo" (M164)

`11ad-zoo`: the Bulychev key made whole — the parrot was Govorun, now the beasts travel. A
scanned beast can be caught on the surface (a cage takes one hold slot; it grumbles; Vega is
loudly against), carried home and settled into the «живой угол» of the living part (three pens,
drawn in the room with silhouettes from each beast's seed). They eat organics from the hold every
other day, mutter to each other, and occasionally escape into the study, where they are found
sitting on the record book. The counter at the core of the Grove region is a **zoo station**: it
takes beasts as cargo, pays, and writes to the record book. Not a farm: the pen holds three and
earns nothing. Suite `91zzs`.
---
## 0.124.0 — "The trainee" (M163)

`11ac-trainee`: the opposite of Vega — a stowaway boy found in the hold after a bazaar, who
wants to be a cosmonaut. He takes the seat on the console (Vega stays home and says so; she will
not board while «мальчишка в кресле»), touches the instruments for the first five jumps, reads
the charts after (the nearest need, once a day), asks to be sent on a run after fifteen, and gets
his diploma «пилот 3-го класса» at a science counter — then leaves on his own hull. A year later
his voice is on the ether with your call sign. Suite `91zzr`.
---
## 0.123.0 — "The institute" (M162)

`11ab-institute`: the plan was numbers; the institute is people with topics. Six topics with
leads in the Strugatsky key («тема 7-Б · плывущие часы · Привалов», «тема 12 · сигнал вне
диапазона · Ойра-Ойра», «тема 4-А · ответная лента · Выбегалло» — which duplicates 7-Б, and
that is their business) are offered as letters at science counters; a report is handed as a
tape, a foreign piece of the kit, a closed need or a handed-in find. Three outcomes: closed
(a voucher), «зайдите через неделю» (and then maybe «не в тот отдел» — a month later it
surfaces with a reprimand in the record book), or «закрыта за неактуальностью» the morning you
deliver. The voucher: land on any ocean world and rest three days by the ship — the crew's
morale is full, Vega will not leave the water, the parrot has a tan line. Suite `91zzq`.
---
## 0.122.0 — "The record book" (M161)

`11aa-record`: the player's biography, written by others. `recordAdd(author, text)` is called by
the stations (a need met, an order closed, a rationalisation), the institute (a tape or a find
handed in), the people (a letter delivered, a traveller brought), Vega («дома не бывает», later
«скучный. Это хорошо»), the sixth («рекомендация: считает. Не объясняет. Годится.»). One page on
the table (КНИЖКА): service length in years of the sky, entries newest first — and a test guards
that none is in the first person. A station with three entries puts the pilot's name on its
board of honour — the only award in the game. After twelve years a medical commission at the
core of the hours county grounds the pilot: «к полётам не допущен» — the quiet ending, a pension
at home, with Vega and two parrots if it came to that; the last entry is the parrot's. Suite
`91zzp`. **The second act (M154–M161) is built.**
---
## 0.121.0 — "The Island" (M160)

`11y-island`: the pirates as those who left — Efremov's Island of Oblivion, pitied rather than
fought. Three letters to the Island (a former hire, Quiet Efim, Aunt Ustya's sister) are offered
at counters once the circular is out; with one on the table, the pirate base's prompt changes
from АБОРДАЖ to СЕСТЬ С ПИСЬМОМ — no fight, no loot, the addressee reads the letter aloud and a
week later appears on the board of returners («вернулся с Острова»). The boarding game stays;
this is the second door. Suite `91zzo`.
---
## 0.120.0 — "The departure" (M159)

On the sixtieth day of the circular the ether and the music go quiet for a minute, then one
line: «Ушли.» The board of returners gets a line without a name (« — · ушли · не ждут»), the
table a paper, the record book an entry. If the player is at the counter of the hours county's
core that day or the next, one offer, once: «Есть место» — going is an ending (the last entry,
the save marked, the title screen carries the nameless line); staying is the game going on. They
do not return: a year later an unsigned tape arrives on the home table, and on it the whole
figure of the misclosure. Nothing else. Suite `91zzn`.
---
## 0.119.0 — "The last run" (M158)

`12k-letters`: the Tin closes. On the fortieth day of the circular the ether announces the last
run with a date; after it the Tin's iron stands («ЗАКРЫТА · ПОСЛЕДНИЙ РЕЙС УШЁЛ»), it neither
asks nor takes, and the record book notes whether you made it. **Letters with content**: ten
letters — the Baker to Krapiva, Kim to Shtof, the chronometrist to the reactor keeper, Vega to
the old man on the bazaar, the commission to the duty observer… — offered at counters during
the expedition, carried as sealed envelopes on the table and never read by the player; the
addressee reads the paragraph aloud at the counter (it goes to ЛЮДИ and the envelope unfolds on
the table). Three are addressed to people on the Tin: too late, and «адресат выбыл» stays in the
hold. Suite `91zzm`.
---
## 0.118.0 — "The sixth" (M157)

`12k-stories-d`: the rivals as colleagues. Each of the five leaves a trace on a station not
their own — the Baker hands in the oven door at a science station, Krapiva flies (she never
flies) to a plant and gives her suitcase to Kim, Kim pays the nameless debt at a yard and goes to
the outpost, Shtof hands his count to Sovenya at a trade hub, Sovenya counts all night and names
the county where the clocks disagree. Five traces are links as data (`seenOf`), and together they
draw one route to the sixth: **Зоя Варламова**, the institute's chronometrist at the core of the
hours county (new address kind `hours:core`). Her story is a report in the institute key — 412
days of tapes, «расхождение не устранено», «заявление удовлетворено» — and she goes with the
expedition; the board of returners gets her line: «убыла · не ждут». Suite `91zzl`.
---
## 0.117.0 — "The circular" (M156)

`11x-expedition`: once the Ring has been heard twice and a tape handed in, the ether carries the
circular — «Готовится экспедиция за край. Всем станциям — по плану» — and for sixty days the
world works for it through the channels it already has. Every station's ДОСКА collects one good
(isotopes, titan, organics, silicon or cartridges) at one and a half times the price, with a
record-book line; prices creep — expedition goods ×1.25, iron and ice ×0.85; barges and
settlements give people and it is heard; half the ether is about the expedition; a hire asks
«возьмите меня туда» and can be released from ДОСКА (the others take heart). The barge passenger
becomes a channel: a fellow traveller to a named station takes the seat on the console and says
one line per jump, then gets off — the M131 tail closed. No quest log: the demand is the world's
face for sixty days. Suite `91zzk`.
---
## 0.116.0 — "The misclosure" (M155)

`11z-misclosure`, on top of the hours region (11h): in the county where the hours drift, the
station recorders disagree with the sky — each station's clock is ±3…9 minutes off, and ДОСКА
shows it («ЧАСЫ СТАНЦИИ 12:40 · ПО НЕБУ 12:33»). The institute refuses it: a strip laid on the
counter there gets «Прибор неисправен. Замените ленту. — Это ответ института, не мой.»; the
ether carries two counters arguing about the time. A recorder strip torn in the county carries a
mark and an angle; three or more such strips on the table draw one figure — the curves lie along
an arc whose axis points where the Ring signal comes from. Nobody says so; a test guards that the
table never does. Suite `91zzj`.
---
## 0.115.0 — "The Ring" (M154)

`11x-ring`: a structured signal from outside. After forty jumps (then every 25–40) the
receiver's own wave carries a pulse in groups for one minute — «…не позывной. Не наш.» The
console shows the pulse instead of the bands and offers ЗАПИСАТЬ once: the tape (direction,
strength, sector, day) lies on the table drawn as pulses and can be handed at any counter —
«приняли. Отправим в институт. Что там — не скажут.» One source far beyond the edge
(`RING_SRC`): every region hears it from its own side and with its own strength, the same
geometry as the panel's misclosure. Rumours pick it up («говорят, опять поймали»). Nothing
explains it, and a test guards that no line ever does. Suite `91zzi`.
---
## 0.114.0 — "Vega" (M153)

`11w-vega`, `12k-vega`: the lodger who cannot be evicted — a comedy of one wish in the key of
Soviet communal comedy, after the author's retelling of "Obsession" without the killings. An old
man on the bazaar sells «Желание-1» (once the home has a living part); it lies on the table and
offers three wishes, and all three end in Vega, the radio operator from the station nearest home
— the device "understood in its own way", and the player pressed it himself. Act 1: she moves in,
morale is higher than the mate's, Aunt Ustya «уехала к сестре». Act 2: she counts the days you
are away — calls on the receiver (turning the knob to the ether band counts as answering), other
voices relay her words, and from the eighth day things at home get broken (a crack on the case
glass stays). Every eviction attempt is +1 attachment and one of thirty replies, none repeating.
Act 3: the old man is gone, the institute says «возврат не предусмотрен». The mirror: on the
tenth day a second device, already pressed, and launching from home is delayed once a day —
«вы обещали остаться». Flying with her: the seat on the console, her mood line, a suitcase in
the hold, a click for a word or a gift (rarities please, ore quarrels), she darns the suit by
the ship, reads the charts for the nearest need, hates caves, gets space-sick after three jumps,
shouts at beasts, takes offence at raids and deep digs for a day; outings — the cantina for
30 cr, the flea (a useless thing comes home), an eclipse, the Tin. The ending without a death:
seven days at home with the engine off — «ты какой-то скучный стал» — she goes back to her
shift, keeps living with you as a flatmate, calls once a week, and gets a parrot of her own.
Suite `91zzh`.
---
## 0.113.0 — "The suit as a kit" (M152)

`12x-suit`: the suit is six places — helmet, torso, gloves, boots, pack, lamp — each a piece
with a model in the Soviet key («Кречет-3», «Орлан-Д», «Гагара-М», «Буревестник»…), a class
I–III, a wear layer (new / worn / patched / foreign) and two mod slots (heated liner, reinforced
seam, breathing cartridge, spare glass, stitched knee, reflector, strap). Nothing is a plain +1:
weight is the common currency — it slows the walk and feeds the jet burn. `kitStat()` routes
everything through the knobs that already existed: `st.suitWear`, raid armour, jet burn/regen/
thrust, walking speed, scan reach, beast shyness, drill speed, the cave lamp's radius and cone,
charge drain on ice. Charge capacity replaces the hard-coded 100 (`suitMax()`). Where pieces come
from: a class-I set is issued to all; the institute depot on ДОСКА of science and industrial
stations issues a piece per four days by the home's turnover (II from the hall, III from the
garage); a hulk gives a foreign piece; the home workshop repairs worn pieces and fits mods. The
КОРАБЛЬ screen shows the figure with six places, the passport line and the shelf (wear anywhere).
Suite `91zzg`.
---
## 0.112.0 — "The economy without a debt" (M152e)

Measured first (`91zzw-economy` prints cr/min per source): a hand-flown leg on «Стриж» with
600 cr is ~640 cr per 3 min; a drone 25 cr/min for 2 200; a hire bets −2 cr/min in flight; and
the managers were the only drain per minute — 240+ cr/min from the player's purse. Then nine
changes. **Managers live on the cut**: the wage is settled from the domain's own share
(`m.pool`), never from the player; an empty domain leaves him "on bare percent" — a grumble and a
slow loyalty thaw, a third of the old rate. **Station need** (`12aa-need`): every three days a
station may run out of one good — ×2 for one delivery, then closed for the window; heard on the
receiver (15% wrong, like rumours), posted on ДОСКА, remembered by the station and the notebook.
**One order per station** («наряд»): carry N of a good to a named station by a day for a stated
sum; one on hand at a time, expired ones simply vanish. **The first hull by allocation**: at
3 000 turnover the plan issues a used «Вьюк». **Tails on display**: a hire's captured hull goes
to the home case and the table. **A find handed to the institute for a quarter** or sold on the
bazaar whole. **The rationalisation premium** for the first alloy of a kind. **Prices on paper**:
a ЦЕНЫ tab on the table with what was last seen per station. **The market fills slower**: price
pressure half-life 3 h instead of 30 min. The mirror's echo now repeats what was actually heard.
---
## 0.111.0 — "The console and the table" (M151a)

The release look, built before the kit and the lodger so that every new voice lands in a ready
place. **The console** (`27j-console`): a strip along the bottom of every screen — the receiver
knob moved out of the cantina (four bands with labels; voices arrive with a click and stay
fresh for a while; a line a player dwells on is remembered once), the action prompt above it,
the seat of whoever flies with you (`G.seat`, empty until M153) and the parrot's perch (click —
its window). On station screens the console rises into the header; on the table it hides.
**The table** (`27i-ui-table`): one screen for everything read, opened over any mode and
returning to it — the notebook with ЭФИР · БОРТ · ЛЮДИ, ДЕЛА, ЛЕНТЫ (each strip drawn), ВЕЩИ
(`G.things`, the shared shelf for letters, finds and papers; new ones glow), ОТЧЁТ (the lore
board). `11-log` routes by kind (`etherLine`, `peopleLine`); the ether voices of 11b, the counter
queue and the counter table replies now go to the notebook instead of a dim line. The station
gets **ДОСКА** as its first group (queue, deeds here, arrivals, rumours, the system's name). The
menu is five doors; ЖУРНАЛ, ОТЧЁТ and ТРЕПЛО windows are gone. Suite `91zzv`; `91f-ui` and
`91p-lore` follow.

---
## 0.110.0 — "The receiver has a knob" (M124 remainder)

`25e-receiver`: a hand-tuned receiver in the cantina. Four bands that never move — rumours,
prices, weather, ether — with noise between them and words dropping out toward a band's edge.
It invents nothing: the rumours are 11t, the prices the nearest station's market, the weather
the system's solid worlds, the ether 11b. The knob remembers its position (`G.radioF`). Of the
M124 remainder, "pause is the engine off" needs nothing — the game has no pause menu; the table
as paper and the removal of the overlay HUD are left as the release design on purpose (see
PLAN.md).

## 0.109.0 — "Houses as a language of shapes" (tails M55 #2/#7, M113)

The four houses of `12u-scrip` used to differ by name and scrip colour only. Each now has a form
(`17d-house-shapes`) carried by everything it owns: on the station a mark over the hull — two
round tanks for «Ласковый», an open scoop bracket for «Ковш», a mast with a dish for «Вестовой»,
two swept spars for «Крыло» — and in a settlement the pennant in the house's colour and the same
mark on the wall of the first yard. Nothing is labelled: a house is read like a flag. Modules over
40 KB were cut along their draw seams in 0.108.1 (`17c`, `19f`, `21e`, `23a`, `24aa`).

## 0.108.0 — "The pass closes" (M147-returners, M148 rumours, M149 names, M150 passports, M151 places)

**The returners** (`11s-returners`, the table's `tin` slot, needle `chrono`): yards and long
contracts on the edge — rooms kept ready, ships waited for by the third generation; at the core a
station of people younger than their grandchildren, who play dominoes and complain about supply.
An arrivals board in the cantina with half its lines years overdue and nobody clearing it. The
chronometer drifts there until the first docking and never again: it misleads exactly once.

**Rumours** (`11t-rumours`): two per station per three days, each an area of three to five
systems around a region core — an image, a human detail, a source — and about fifteen per cent
simply wrong. In the cantina and, rarely, on the receiver. No markers anywhere.

**The names travel** (`11u-names`): a system can be renamed in the cantina (18 characters, no
suggestion ever offered); the map, the HUD and the arrival line show your word. Tell it in the
bar and fifteen jumps later a dispatcher repeats it, one letter short; rumours about that core
use it too.

**Design passports** (M150): `docs/PASSPORTS.md` — the provenance rule extended to props, the
instrument, label, palette, wear, type and sound rules, and the pass's standing rules, as the
checklist every new object is read against.

**And what was that, exactly** (`11v-places`): three hand-placed, unique places at fixed
addresses — a tower, a bowl, a stair into nothing — on the first solid planet of the nearest
star. Nothing logged, nothing rewarded; only the name you give them travels.

## 0.107.0 — "Four counties" (M143-slow, M144-pass, M145-grown, M146-plan)

**The slow one** (`11o-slow`, needle `chrono`): lay a figure from the hold at the valley's peg,
leave, come back five days later — a copy; then a continuation (read plainly, "are you alive?");
then a meaningful mistake that adds what you did not lay. Nothing visible: the chronometer humps
at the peg when the reply has matured, and the tape keeps it. Leave for two hundred hours and
the reply is still there. **The pass** (`11p-pass`, needle `course`): a hulk behind the village,
pilgrims at the ramp, a liturgy that used to be a manual. You can switch the lights on — the
largest thing there in a century — and then explain, or not; no reward either way. **The other
growing-up** (`11q-grown`, needle `mass`): the same people at different stages across the
region; at the core every gift comes back cleverer than you gave it. **The plan** (`11r-plan`,
needle `radio`): the ether full of delivery notes, a combine on the core planet that never stops
and needs no order; take the article, bring it to your own base, and two hundred years of work
are for the first time not wasted.

## 0.106.0 — "Three counties" (M140-county, M141-charts, M142-quiet)

**The large county** (`11l-county`, needle `mass`): masonry in the region is half again as
large, twice at the core; the core settlement is built for a guest — yards at 2.3×, a four-metre
door on the largest. The town has no buttons: jetpack, drill and a hard landing are loudness, and
the door opens, the windows light and the lift rises by level; at the top, a nursery with cots
at our size. Keep shouting and the town hears you; twenty jumps later, somewhere else, the ether
carries three low beats and nothing more — once.

**The charts disagree** (`11m-charts`, needle `course`): every star on the region's edge sits a
little off on the map, every fifth is simply not drawn though it is there to jump to. At the core
the locals compare instruments and find you fine — you have arrived from nowhere. Their chart can
be traded for (300 cr); while it is in the hold the navigator does not show the home system,
silently. Throw it out and five jumps later it is back in the hold.

**The quiet county** (`11n-quiet`, needle `radio`): no pirates spawn in the region and the hull
does not wear. At the core the log stops writing and the tape draws a flat line; on departure
three to seven days have passed and 15% of the fuel is gone — nothing taken. The colony hides
nothing and offers to let you stay; the offer is never withdrawn. Suites `91zy`, `91zz`, `91zza`.

## 0.105.0 — "The line of keepers" (M139-keepers)

The `keepers` region (06c, needle `course`) is built in `11k-keepers`: a lane everyone navigates
by, and at its core a station with one man on it. Habit over visits (`visitHere`): weather talk,
then a silent handover, then he knows what you need, a second mug, the crate already out; every
third call he takes one ration from the hold himself. On the tenth call he is gone — mug washed
and turned over, bunk made — and the lane goes dark: the course needle wanders across the
region, a jump plotted there costs half again, the ether carries lost strangers and a convoy
turning back. In the cantina the bulkhead roster: twelve names struck through, a blank line you
can sign. Signing is hauling one ration to the crate by the door at least every twelve jumps,
unpaid, forever; miss it and the lane darkens again. Far away, at the core of the pass, a second
such man — alive — greets a signed pilot as one of his own. Persisted `G.keepers`. Suite
`91zx-keepers`.

## 0.104.0 — "The grove" (M138-grove)

The `grove` region (06c, needle `mass`) is built in `11j-grove`, in the belt. Growths are belt
rocks with a mark: on the edge three lone ones that cut like ore and pay xenobiome; in the grove
system (the core, or the first belt system of the region) twenty-two of them in one thicket off to
the side. Thrust is the language: engine off and the grove closes in slowly, never nearer than
150; thrust and it flinches back; its rocks never damage the hull — a soft shove instead. It
remembers the hull (`G.grove`): every visit it turns sooner; one shot and it parts and never
approaches again; one cut for cargo (six xenobiome) and it closes for good, thrust or not. A
green halo on each growth, brighter while it comes toward you. The edge ether swears at the
thickets. Suite `91zw-grove`.

## 0.103.0 — "The light that remembers" (M137-glow)

The `glow` region around the meadow (06c, needle `actino`) is built in `11i-glow`. On the edge
every plant glows at night and the landing pad is ringed with the same light; scanning a glowing
plant there puts one xenobiome in the hold — the moss is a trade good. On the core planet the
light lies in patches that repeat shapes — a wheel rut, a machine, a foundation — drawn at night
only, in the meadow's own light. The core planet always has the meadow (`peepHere`), and its
scenes replay in order of brightness: the first pass of an eclipse is loud (×1.4, a floodlight
column at the start), the second ordinary, the third quiet — one running figure at a third of
the light, visible only within 150 px, heading for the cave mouth, which on the core planet
stands exactly where he runs. Nothing persisted. Suite `91zv-glow`.

## 0.102.0 — "The drift of hours" (M136)

The `hours` region (06c, needle `chrono`) is built in `11h-hours`. The offset is a function of
one distance, like the misclosure: minutes anywhere in the region, an hour in orbit over the core,
up to four hours walking toward the core settlement — and the ship's chronometer shows it
(`hoursDrift` is added to the chrono needle in `instrRead`, so the tape keeps the hump). On the
edge the ether sometimes carries the dispatcher apologising for the clocks, a shift ten minutes
early, a hooter instead of a time check. The core settlement works with nobody in it: no
watchmen by day, smoke still rising, a vending machine at the yard that takes 7 cr and gives one
ration and correct change. By night the windows light and shadows move behind them; during an
eclipse one man walks past, stops beside you for a second, and goes — once, `G.hours.man`
remembers. The edge of this region is the whole region, not just the slope: the core landed at
the region's rim and the slope there is one cell wide. Suite `91zu-hours`.

Fixed: the star seen from the ground was painted in the dark sky tone, so every star read as an
eclipse with a corona — it is now a disc in the star's own colour, white at the centre. The
README surface shots are retaken.

## 0.101.0 — "Three lights" (M135)

The `lights` region (06c, needle `actino`) is built in `11g-lights`. On the edge the night never
arrives — dusk is capped at a fraction of a normal night — and one extra sun hangs beside the
star; in the core there is no night at all and two of them. Every settlement yard in the region
has a window with shutters: open and warm, or boarded the day before a conjunction and through
it — nobody explains. The conjunction calendar starts with the first arrival at the core, set so
that the last one was *yesterday* — the player misses it the first time, always — and never moves
again; there is no countdown anywhere, the shutters and the converging lights are the only sign.
During the conjunction the third light reveals a dashed road, foundations and an arch on the core
planet (a nav mark "ВХОД" appears), and the arch is a real cave: a second seed, no beasts, the
find pays 120 data and rolls an artifact. `G.lights` persists the first-arrival day and whether
the player has been inside; the harness resets it. Rack glass and needle radii are clamped on a
zero-size canvas (test stand).

## 0.100.8 — "Loose ends, station side" (M144)

The counter length follows the hall seed (M55); every fourth counter line is about the house
that owns the station and its scrip rate, and every other one speaks in the tone of the place —
outpost, hub, works, yard, lab (M113, M128 archive tail). The flea market has a crowd count in
its header and a murmur on the first visit (M121). The bird hears on a planet: cave species and
the cave find go into its memory (M117); mirror lines and echoes go there too (M134). The tape
survives a save — the ring is packed to base64 (M123); the recorder is merchandise: a second
drum that makes the tape run half speed and remember twice as long (M127); a pirate hit can
knock out a socket, leaving one instrument a dead scale (M127); instruments age faster on a
worn hull — one clock (M127). The misclosure sits in a window of its own beside the panel
(M122). The table accepts a name (M128); a strip can be attached to the parcel and the last
link notices (M133); while the parcel is aboard a third of empty rumours point at who waits
for it (M133); a thing on the table counts as care, a missile hit counts as hurt (M132); the
mirror bearing can be struck from the map (M134); the postal runner hears farther, not only
deeper (M126); the ether tears on the post region's edge (M133). Hulls get a top light and one
sensor boom on one side, so the two boards are no longer mirror copies (M55). `26-ui-station`
split along the home tab into `26a-ui-station-home` — the guard is quiet on it again.

## 0.100.7 — "Rock behind the plating" (M143)

Raid tails (G4): where the cell behind a bulkhead is solid asteroid on every side, the wall is
bare rock — three strata, no plinth or seams, loose stones up close; the hangar has its gate in
the end wall with a cold cone on the floor; pirates at rest lower their weapons and every
second one leans on the wall until the alarm. Scoop tails (G5): giants come in three structures
— banded with a few eyes, spotted with a scatter of small storms, and jet-streamed where the
bands tear into plumes; every band has a steep leading edge and a soft trailing one.

## 0.100.6 — "Three magnitudes" (M142)

System and belt tails. Stars come in three magnitudes with a dozen saturated orange and blue
ones on top; the nebula is two layers at different parallax (G10). The belt has three depth
planes: far rocks as grey dots on world coordinates with real parallax, the asteroids, and
near dust that grows and streaks by the glass (G6). Missiles work in the belt: same hold, same
launcher, fired at the locked rock, which they split whole (M112); the launcher is drawn on the
ship silhouette in system view — solid when loaded, an outline with a red tick when dry (M112).
The doomed planet shows from orbit: an orange pulsing halo while the clock runs, a grey veil
and dust rings once it is over (M114); the wing commander and the factor add lift capacity to
the evacuation by level (M114).

## 0.100.5 — "An hour on the surface" (M141)

The surface gets an hour: `celSun(p)` in `06a-celest` turns the planet in six to nine calendar
days (about six to nine minutes), nothing stored. The sky layer is baked per 48th of the day;
the horizon glow sits on the star's side and is strongest when it is low (G7); at night the frame
goes into the sky's shadow and the suit lamp is the only light, a baked sprite (G12). Far ridges
are tile-cached per parallax layer and the lowest third of the frame darkens toward the sky's
shadow (G2). Relief amplitude follows the material kit and strata count differs per kit (G1);
flora leans by world type (G1); three to four POIs per strip instead of two to four (G12). The
settlement is heard before it is seen — knocks and voices by distance — and marks itself from
afar with a pennant pole and a smoke column (M109); the watch stands at the cave mouth (M110).
Figures: the meadow mat takes the planet's tone, arms at rest hang outside the torso, the crate
rides at the waist, the trail is warmer than the mat (M118); the tin plant varies by planet and
its hoops read as turning (M119); the grok has a shoulder line, a strap over the belt box and a
rim on the chest arms (M120). Scale check (G8): the lander is 90–130 px against a 26 px walker,
five to one — right for a ten-metre hull.

## 0.100.4 — "The shaft changes section" (M140)

Mine tails (G3): rock is now baked in 512×512 tiles by world-x and world-y (`tileStore` in
`23-mode-dig`) — strata, veins and material once per tile, not per frame; along a long shaft the
section changes — every eleventh row the shaft widens into a two-row chamber with a lamp on each
wall and a barrel, and elsewhere an occasional niche is cut in the wall with a shelf holding a
crate or a lantern that lights. The landings and the tub were already closed in 0.96.0 and are
struck from the list.

## 0.100.3 — "Loose ends, one" (M139)

The first of the tail-closing passes. Base: `21a-mode-base` split along its seam (logic stays,
the frame moved to `21ac-base-draw`); the gate is a door (jambs, threshold, two leaves, a lamp
with a cone on the step); three lamps light the tunnel; the pad sits on a shelf cut into the
plateau instead of under the slope; the plateau has a terrace, so the right half is two planes,
not a wall; a spoil heap lies on the plain by the gate (G9). A base with a battery and no power
writes once that its defence has gone quiet, and the battery is silent until power returns; the
shot from the ground is a heavier sound than a ship gun (M111 tails). Cave: the lower gallery has
its own dripstone, veins and crystal clumps; beasts live on both galleries and one that hears you
on the other gallery drops from the ceiling after a wait; the contour fringe carries the
planet material instead of flat paint (M136 tails). Two stand-only crashes at W=0 guarded
(`drawCaveDark`, `rackDial`) — the test page is green again.

## 0.100.2 — "The tunnel" (M138)

The block of rooms sits inside the mountain now, not under the plain: the grid starts two
cells to the right of the gate and one level above the ground line, so rock lies over the top
row. From the gate at the foot of the slope a tunnel at plain level runs to the floor of the
top row, with the corridor tie along it. Floor ties start at the rooms, not in the rock.

## 0.100.1 — "Into the mountain" (M137)

The base read as dug under a plain: two humps a room and a half high over the top row. In
the reference the mountain fills the frame, the plain stays on the left and you walk INTO the
slope. The profile is now a ramp from the plain to a summit over the middle of the base and a
plateau to the right, as high as the frame allows (`humpAt` in `21a-mode-base`); the gate sits
in the foot of the slope on the left, larger, and the mast stands on the summit.

## 0.100.0 — "Under the skin" (M136)

Three things at once, all on foot. **The lander by planform:** the ship on the pad had one
silhouette for everybody, only the livery changed; now `drawLander` reads `h.form` — a disc
sits on its legs as a saucer with a dome, a slab is a ribbed brick with a box cabin, a catamaran
shows its far hull behind the near one, the cross carries its pods, the trident splits at the
nose, the delta hangs its wing and a tall fin. Gear, ramp, engines and the hatch light stay
common. Sheet: `docs/mklanders.ps1`. **The jetpack** (`20d-jetpack`): hold W — rise; the pack
burns out in two and a half seconds, refills in a second and a half on the ground and barely in
the air; one reserve per outing, shared by the surface and the cave, bar bottom-left. A terrain
spike is no longer a wall. **The cave as a field** (`22-mode-cave`): a 5 px cell grid carved by
noise and smoothed twice, with guaranteed passages cut through it — the upper gallery from the
mouth, two shafts down, a lower gallery back to the find, six blind branches. Pockets off the
passages are reached by pack. Rock is painted in 2D tiles (`tileStore`/`drawTiles` in `18c`)
with a marching-squares contour for the chamfer and the wet rim, the planet's material and a
depth gradient into blue black. The old dressing (22a) still hangs on the upper gallery because
`caveFloor`/`caveCeil` now scan the grid for it. Daylight falls through the mouth.

## 0.99.9 — "Tracks" (G12, pass 1)

The walker leaves tracks on the ground — a mark every thirteen pixels of walking, fading over
a minute — so the foot world remembers where you came from. Nothing is stored.

## 0.99.8 — "Horizon" (G7)

The sky base layer carries a horizon glow in the star's colour on worlds with air; rain falls
in two depths — near drops thick, fast and bright, far ones a thin net. The cloud note in G7
was stale: sprites already had a lit side, a shadow side and a rim. Foreground grass tufts now
appear only on worlds with flora (on ice they read as black sticks).

## 0.99.7 — "The star is over there" (G10)

In system view the primary's glow now bleeds into the frame from its side even when the star
itself is off-screen (one sprite blit, lighter), and orbit rings fade with radius instead of
being one brightness — the screen no longer reads as a loading state when the star is out of
view.

## 0.99.6 — "It stands on the ground" (G8)

The landed ship gets a contact shadow that grows with the gear, and the light from the hatch
lays a warm pool on the ground at the foot of the ramp. The ring note in G7 was stale — rings
were already split behind and in front of the disc.

## 0.99.5 — "Plated" (G4)

The boarding deck spoke a different language: one-tone walls with an outline, flat crates, a
floor from wall to wall. Now every wall carries a plinth, a sheet seam with rivets (near only)
and a cable run under the ceiling; the floor is plates with a gap at the edge and a pool of
light under each lamp; every box has a lid rim and a contact shadow. All of it is quads in the
same projection — no new full-screen pass.

## 0.99.4 — "A voice per world" (music, pass 2)

The melody voice gets a vibrato that arrives on the second third of the note and a detune
spread, both by world type: ice and crystal sing clean, volcanic and metal are rough, toxic
drifts. Percussion is two voices — a low thump on the strong beat and a dry tick on ghost hits
and accents — instead of one thump that read as a metronome.

## 0.99.3 — "Lights on in the cantina" (cantina, pass 2)

The hall was drowning: crowd at .18–.32 alpha in grey, a .55 vignette, no floor. The crowd is
now in coloured jumpsuits at .30–.52, the vignette is .36, the wall is lifted, there is a
floor strip in front of the counter with a pool of light under every lamp.

## 0.99.2 — "A hill, not a hole" (G5, G6, G9)

The hill over the base starts its rock gradient above ground and lit by the sky, takes the
planet material like the soil below, and carries a rim of sky light along its silhouette — it
was one flat dark fill before. The gas giant is baked at 768×384 with a tile 1.25 screens wide
(the old .62 tile repeated twice per screen); the asteroid terminator is sharper
(`.15+li^1.3` instead of `.24+li`).

## 0.99.1 — "Question, answer, circle" (music, pass 1)

Self-review of `10-music` by structure: the drone and the bass sat on the tonic forever, layer
levels were constants, one phrase per place, percussion was a hit every other step. Now a
harmonic circle of four scale degrees (one per 16-step bar, seeded per scene) moves the drone
and the bass; a slow breath of 75–140 s sways the melody and the air by a third; every phrase
has an answer — the same notes with a mirrored contour, alternating with it; half the scenes
fall silent for the last eight steps of the circle; percussion is an eight-step pattern with
accents and ghost hits. Nothing is stored; the save format is untouched.

## 0.99.0 — "Five counters" (cantina, pass 1)

The counter is no longer the same panelled plank in every hall (`cantCounter`, 27d): wood with
a brass rail and a rounded end in the trading hall; a riveted steel plate with tread, shorter
than the room, a barrel where it ends, at the works; a workbench with drawers and a vice at the
yard; lit glass under a thin top in the science hall; planks on two barrels at the outpost.

## 0.98.0 — "Something in front" (G2)

The surface gets a foreground: sparse boulder and grass silhouettes at 1.24× parallax, cut by
the bottom edge of the frame, in the planet's own shadow colour and without detail — depth by
overlap and value, not by blur. One silhouette per two screens. Passes added: 0.

## 0.97.0 — "Six worlds, six bodies" (G1)

The planet material (`18a-material`) had a character only for crystal, metal, jungle and ruin;
the other six types shared one cell texture in six palettes. Now desert is wind ripple with lit
crests, ice is fracture plates with white seams and blue depth, volcanic is a cooled crust whose
seams glow where the heat is near, toxic is sodden banks with pools and rims, terran and ocean
are bedded soil. The light shafts take their count, angle and spread from the planet instead of
the same five-ray fan everywhere. Passes added: 0 — it is all in the baked tile.

## 0.96.0 — "The mine has rock in it" (G3)

`fillMaterial` with no clip path called `ctx.clip()` on an empty path and drew nothing — the mine
never showed its planet's rock, which is why its strata read as flat fills. Fixed, and the strata
got a contact shadow under each roof and a hairline of light along the edge. Landings are a
beam across the whole shaft on brackets with a wall lamp (lit after the darkness pass), a depth
plate and a crate on every second one; the tub is a hopper with a heap of rock in it. Still
open: niches and a change of section along a long shaft; rock chunks by world-y.

## 0.95.0 — "Passes, not objects" (G0, G11-a)

The graphics pass opens with a measurement: the frame is fill-rate bound, one full-screen pass
costs ~4–5 ms at ×2 on an integrated GPU, JS is under 3 ms everywhere. First cuts: the grade
(vignette + tone) and the sky base are cached layers, the cave darkness is a sprite, the giant's
depth gradient is a layer, boulders are baked into the ground chunks. Surface 40→45 fps at ×2,
mine 39→44, cave 55→59, scoop 51→55. Full table and the pass budget rule: PLAN.md, G0.

## 0.94.0 — "The mirror" (M134)

A transit region with bad comms: in it, whatever the ether says comes back thirty-seven seconds
later, word for word. At the core lies the mirror itself — not a source, a surface where old
reflections have piled up: a time signal, a roll-call, someone's forgotten mug. Listening gives a
bearing to where it all came from, far beyond anywhere anyone flies.

## 0.93.0 — "The postal round" (M133)

In the one region where the instruments are simply right, someone hands you a wrapped bundle. Five
people across the arm recognise it when you happen to land where they are, say one sentence about
themselves, and name the next. It can be opened. The last man has been waiting forty-two years;
nothing is paid.

## 0.92.0 — "Fifteen regions, and the place remembers" (M132)

**The region table.** Fifteen themed regions (`06c-regions`) are now placed on the sector grid,
seeded and swept: every core is a system with a station, every region has an ordinary trading
system on its edge, and no two cores lie within two stock jumps. Each brings its own name and its
own lying instrument; the postal round brings none — there the instruments are simply right, and
that is meant to be noticed. Nothing is marked on the map.

**Memory of place.** Every place you land at now remembers how many times you came, and three
coarse things: how much you dug out, how much you shot, how much you repaired or delivered. None
of it is shown anywhere. It ages by the road you travel — landings elsewhere and jumps — never by
the clock.

## 0.91.0 — "A hundred and two" (M131)

**Links are data now.** A trace may require a trace of *another* story to have been seen —
`seenOf:"second_glass.t1"` — so the second half of a story can live on a different station, in
a different kind of place, and the player carries the connection in their head: who watered the
garden in the crater answers at an outpost; the one who stayed at the window turns up at a trade
hub; the bell's ringer is known at the outpost below the metal world.

**The parrot is a carrier.** A trace marked `carry` is remembered by the bird when it is first
shown (`heardAdd`, kind `story`), listed among what it heard with the place's address, and asked
about elsewhere: a yard mentions the oven door, the bird repeats it, the baker's station reacts.

**Thirty more stories** (`12k-stories-c`, 102 in all), most of them the far ends of earlier
ones — the callsign the bird brings, the second lamp lit when the first went out, Kim's debt paid
by someone else, the kettle's cousin mug that cools by itself, half a dock arriving, the
lighthouse keeper who transferred "to where they listen", the clicking that got an answer and
then a third — plus a few new: Zoya who only knows things at night, Guram Ilyich whose balance
never adds up until it does, Samokhina on callsign Forty-two who circles for three years and lands,
a dog that is not a dog, the fisher without a sea.

The hundred is built. What is left is what the design says is left on purpose: a third of them
never explained.

## 0.90.0 — "The ground speaks too" (M130)

**Four more channels, all on the ground**: a line appended to the landing message, a line at the
mouth of a cave, a tail on the prompt at a settlement and at the Tin. Three more address kinds:
`planet` (any world you land on), `settle` and `tin` (worlds where those can live), plus
`world:T`. Planet stories anchor to *system/planet*, not to the system — the first version let a
story pinned on the desert surface on the crystal world next door. Landings on a planet are
counted like landings at a station, so "the third time here" works on the ground.

**Forty-six stories** in `12k-stories-b` (72 in all): the four ground stories the design promised
— who feeds the Tin, the shoal and the hunter, the shell that knows its way home, the last light
in the settlement — and tracks that go one way, a warm stone, a garden in a crater, a plate with
seven lines, a beehive, a rust bell, a crystal with a name; at the stations, Nyura who charts a
sector that does not exist, the Abashev twins, the doctor who only says "yes", Matvey Kuzmich
listening to every bulletin, a kettle that boils by itself, the lighthouse keeper's poems, skipper
Oroz who never docks, someone small at the door, two at the window; the busy frequency, the water
schedule, the dock's echo, half a dock flying away; the six rivals again — the baker bakes,
Sovenya sold, Efim's voice on a satellite, the baker and Shtof at one table once an eclipse.

## 0.89.0 — "Traces, not tasks" (M129)

The first of the hundred. A human story in Drift is two to seven **traces** laid across the
world — a line in the ether, a remark at the counter, a figure at a table, a thing on the bar, the
contents of a capsule, a rumour — met in any order and assembled in the player's head, never in a
journal. No giver, no reward, no marker, no counter, no page: the game records only which traces
were seen. Design: `docs/DESIGN-stories.md`.

**The engine** (`11c-stories`) pulls rather than schedules: each channel asks `storyTraces(via)`
when it needs content; turns — changes that happen without the player — are computed lazily from
the world's day (`CEL_DAY`) or from the day a trace was first seen. Floating stories ("any trade
hub") anchor to the first matching place where their deterministic lot falls, at most four per
place; fixed ones sit at seeded addresses. Conditions are a closed dictionary (`STORY_WHEN`); an
unknown key fails the autotest, as does a turn flag nobody reads.

**Six channels wired**: the ether (one line in three), the counter queue (an unseen trace
preempts, a seen one only every third landing), the table (a story answers the thing before the
common table), finds, rumours (with the anchored place's address), and the cantina — figures at
corner / far / end / door seats and eleven small things on the bar, drawn with the hall's own
brushes.

**Twenty-six stories** (`12k-stories-a`): the second glass, the pad lamp, the shift that does not
come, the baker who never baked, the parrot that carries a callsign, Madame Krapiva who does not
fly, Efim's stool, the forecast that never changes, two on one orbit, four cups, the old name, Kim's
debt, the voice of the Rack, the night shift, Shtof's tally, a foreign tape, Sovenya awake, a
letter read over the ether — and six longer ones in the key of institute fiction: the report on
the event that never happens, Gedevan's null-cabin, Semyon Palych who walks to the horizon, the
commission that looks at walls, Ada Lvovna's second shelf, the pump that was not a pump. A third
are never explained, on purpose.

**Not yet**: the settlement, the machine, the animals and the surface as channels — M130, with
forty more stories; links and the parrot as carrier — M131.

## 0.88.0 — "A screen is a pane of glass, not a wall"

The interface grew on a phone and was stretched edge to edge on a monitor: a price sat a metre
and a half from its name, nine-pixel captions vanished, a 56-px row showed four goods per screen,
and four section buttons were spread across the whole width with nothing between them.

**On a wide screen every screen is now a centred pane** — `min-width: 900px` in `style.css` —
up to 1080 px wide, on glass over the visible world, type one step larger, rows denser, section
and tab buttons gathered on the left, the footer's actions right-aligned instead of stretched.
Nothing changes on a phone: the block is additive. The scrollbar inside the pane is a thin
phosphor line rather than the system widget.

**Settings have five tabs** — Полёт, Клавиши, Звук, Графика, Запись — instead of one scroll
through twenty sections to reach the sound. The sections and their order are untouched; a tab
only hides the others (`optGroups`).

**Long section captions are sentences again.** Half the `.sec` headers were not labels but
helper sentences set in spaced capitals — against the first rule of the style sheet. `el()` now
turns any caption longer than a label into a `.sec.note`: ordinary case, readable size.

## 0.87.0 — "What does not move is painted once"

Measured, not guessed: the frame was profiled function by function, JS time and raster time
separately, then in a real Chrome on a ×2.5 display. The logic costs ≤4 ms everywhere. The raster
did not: the surface ran at **23 fps**, the cave at 42, and removing one thing — the near ground —
brought the surface to 61.

**The ground cross-section is now a row of chunks.** Silhouette, six strata with their contacts
and veins, the rock material in two passes, the depth gradient and the crust line were fifteen
full-screen fills under a 200-vertex clip path, every frame, on a 4.5-megapixel canvas — for a
picture that never changes: the camera only moves it. `18c-chunks` paints it once into 512-px
slices of world X (the same `drawGround`, with `W`/`H`/`ctx` swapped underneath it), keeps seven,
and the frame is four `drawImage` calls. The gradient's top is the terrain's global minimum rather
than the slice's, so there is no seam in the darkness. Only the grass stays live — it bows to the
wind. The cave's vault and floor go the same way (20 of its 28 ms were the material alone).
Surface **23 → 52 fps**, cave **42 → 57**, at the same ×2 resolution.

**The star's glow and the storm veil are layers.** A full-screen radial gradient (5 ms) and a
full-screen linear one (3 ms) that depend on nothing that changes within a second are cached as
screen-sized canvases keyed by what they depend on.

**Resolution is a setting, and "auto" steps down on its own.** On a retina display the canvas
drew four times the pixels for the same frames. `Графика → Разрешение`: auto / 1× / 1.5× / 2×.
Auto starts at full and drops half a step when the smoothed frame stays above 24 ms for three
seconds; it never climbs back by itself, because "sharp — soft — sharp" reads worse than a steady
picture. The choice is saved; old saves get auto.

## 0.86.0 — "Two full-screen passes become one, and nobody re-rolls the same dice"

Continuing down the same list, in order of pixels painted rather than lines of code.

**The nebula was two full-screen blends; it is now one, and it is opaque.** A 160×160 tile was
stretched over the whole screen, then stretched again 1.9× larger and offset so its seam would not
read — both additive, in every system, every frame. On a 4.5-megapixel canvas that is nine
megapixels of blending before anything else is drawn, and both passes at twelve-times
magnification, the least cache-friendly ratio a texture sampler can be given.

The two layers do not move relative to each other: the second one's offset differs from the
first's by a constant, so under a moving camera they travel as one picture. That means they can be
added together once into a tile and moved as a unit — and since that tile covers the screen by
construction, the dark background can be baked into it too, which removes the separate clearing
pass and turns the remaining blend into an opaque copy that need not read what is already there.
Three full-screen passes became one. Checked pixel by pixel against the old pair at three camera
positions, including both extremes of the parallax clamp: **0 of 255 difference**.

**Nobody re-rolls dice that have not changed.** Interplanetary dust built a fresh random-number
generator per mote and assembled an `rgba(…)` string for it — seventy generators and seventy CSS
colour parses a frame, for seventy specks whose position in their own field, size and brightness
never change; only the field's offset does. Asteroid-belt gravel did the same, 190 draws a frame
for grit whose angle and radius are fixed by the belt's seed. Both now compute their table once
and vary only `globalAlpha`, which is a number rather than a string the canvas must parse. Dust
compared against the old formula at two camera positions: worst channel difference **1 of 255**
(alpha rounding), mean 0.0001.

**Why the ship was left alone.** It is the largest remaining consumer — 338 canvas commands a
frame — and the obvious move is to bake it into a sprite. It is also the one object where that
would cost real quality: the ship rotates continuously, and a rotated raster blit is resampled
every frame, where vector paths are drawn exactly. Baking a sprite per heading would fix that at
the price of a thousand sprites, and baking a handful of bank phases — the usual suggestion —
quantizes the roll, which is the same trade that made the planets step before 0.84.0. The saving
is about a millisecond of CPU in a frame whose stalls come from pixels, so it is not worth the
softening. If it is ever done, the split has to be: banked belly and exhaust stay live (they carry
the only per-frame randomness), everything from the engine barrels onward is cached, and braking
frames bypass the cache entirely, because the brake jets are drawn in the middle of the body.

---

## 0.85.0 — "Stop repainting what has not changed"

Reported precisely: it stutters when you fly past the star, and clears up as you leave. That
symptom names its own cause. A star's screen size depends on zoom, not on distance, so flying
away does not shrink it — it moves it off the edge, where the rasterizer discards it. Whatever
costs the frame is therefore something the star paints across the whole screen.

It was the corona. Measured by area, in units of the star's own radius squared: corona 154,
halo 12, core 2, flares and prominences about 5 between them. The corona is a disc of radius 7R
filled with a **radial gradient**, and a gradient is evaluated per pixel — at a close pass that is
the entire 4.5-megapixel canvas, recomputed sixty times a second. Its shape never changes; it
depends only on colour and heat. So it is now baked once into a unit-radius sprite and stretched:
same picture, but a texture sample instead of a per-pixel gradient. Checked against the old path
pixel by pixel over a 980-px radius — worst channel difference **2 of 255**, average 0.28, which
is gradient dithering noise. The halo ring got the same treatment, as did the black hole's lens
and the neutron star's aureole.

**Planets are assembled once, not sixty times a second.** Wrapping the surface map onto a sphere
costs one `drawImage` per vertical strip — up to two hundred per planet — and it was rebuilding an
identical picture every frame. Two facts make that unnecessary: a planet's screen radius is its
world radius times zoom and has nothing to do with the ship's approach, and zoom only changes when
the player changes it; and rotation is slow — a day here is 52 to 120 seconds, so one texel of the
map takes 100–230 ms to pass the limb. The assembled disc is now kept in its own canvas and
rebuilt only when rotation has advanced three quarters of a texel, when the radius changes, or when
a sharper map finishes baking. In the frame there is one blit, placed on whole pixels so the disc
is copied rather than resampled. Rotation stays continuous — the step is smaller than a pixel.

System view, per frame: **`drawImage` 200+ → 5**.

The same disc cache went into the site's background, where three planets were re-projected every
frame. And its starfield stopped assigning the same colour five hundred times a frame — the colour
is identical for every star, only the alpha varies, and alpha is a number rather than a string the
canvas must parse. Site background per frame: **CPU 1.37 → 0.40 ms, `drawImage` 232 → 21,
`fillStyle` assignments 501 → 2**.

Nothing was made simpler to look at: no resolution was lowered, no layer dropped, no effect
disabled.

---


## 0.84.0 — "The planets turn in the game too, and nothing is baked in one go"

Reported as "everything is slow." Measured before touching anything: a system-view frame cost
**4.9 ms of CPU**, and that number did not move between 1280×720 and 3840×2160. A cost that
ignores resolution is not on the CPU; the pixels are paid for on the GPU. That ruled out the
obvious suspects and sent the search somewhere else — to what the game computes *once*, at the
moments it stutters.

**The planets were a flip-book.** Sixteen rotation frames were baked per planet and switched
between by the clock. On a planet the size of a fingernail nobody sees it; at full screen it is a
slide show. Worse, the frame was capped at 72–144 pixels a side — it had to be, since it was paid
for sixteen times — and then stretched across half the screen, which is where the mush and the
stair-stepped limb came from.

The site solved this in 0.83.0 and the game now does the same: **one surface map** (longitude
across, sine of latitude down) wrapped onto the sphere in the frame itself, in vertical strips.
On a sphere seen from outside a point's height on screen *is* the sine of its latitude, so the map
needs no vertical stretching — only each column's longitude, worked out once per size. Rotation
becomes a shift along the map: continuous, no steps. Light does not rotate, so it is two overlays
baked once, and the limb is anti-aliased by alpha instead of being cut off square.

**Nothing is baked in one go any more.** This is the part that was actually costing whole frames.
`fbm2` runs about two microseconds a call, so any surface worth looking at is a hundred thousand
calls — a quarter of a second with the frame stopped. The old code hid this by being low
resolution, which is exactly why it looked bad. So the bakes were made interruptible:

- The surface map is baked **by pixel, not by row** — one row of a detailed map already costs more
  than a whole frame's budget. 2.5 ms a frame, three levels of detail, one level at a time.
- Until anything is ready a planet is drawn as a smooth lit sphere of its own colour: a body, not
  a hole in the starfield. Detail arrives within half a second and sharpens as you approach.
- The queue is fair and prefers whoever is furthest behind, so **every** planet gets a rough
  surface before any planet gets a detailed one. Without that rule the first planet in the list
  took the oven and the other three stayed blank.
- The system nebula got the same treatment: 160×160 across three layers of noise, ~70 ms, which
  was the jolt that met every new system. It now bakes at 2 ms a frame and simply isn't drawn
  until ready — it is a half-strength overlay above the stars, and nobody notices its absence for
  half a second, while a ship frozen for a frame is noticed every time.

Entering a system: worst frame **95 → 34 ms**, and the steady frame came down as well.

**A ceiling on frames** (Settings → Graphics). The one lever that unloads the *GPU* without
simplifying anything: thirty frames rasterize half the pixels sixty do. It counts refresh
intervals rather than milliseconds — a millisecond threshold falling between two refreshes rounds
down to the nearer one, which is why a "45" ceiling on a 60 Hz screen silently delivers 30, and
why the offered steps are 60 and 30. The stride rounds **up**, because a ceiling that overshoots
is not a ceiling: under "no more than 60", a 144 Hz screen gets 48. `dt` still comes from the real
clock, so motion is unchanged.

**The starfield stopped re-parsing its colours.** 340 stars each built an `rgba(…)` string and made
the canvas parse a CSS colour, every frame. Stars are now grouped by colour once and twinkle
through `globalAlpha`, which is a number. Six parses a frame instead of 340. **1.17 → 0.73 ms.**

**The instruments stopped writing what was already there.** `hud()` put forty values into the DOM
every frame and almost none had changed. Each write now compares against the node itself —
deliberately *not* against a remembered copy, because screens and autotests set styles directly
past `hud()`, and a remembered copy goes stale and leaves a button visible where the frame was
supposed to hide it. **0.55 → 0.37 ms.**

**Orbits are computed once.** The forty-nine Kepler points of an ellipse never change — orbit,
eccentricity and argument of periapsis are fixed when the system is born. They were solved 204
times a frame; now once, cached on the planet, with only the mapping to screen left in the frame.

Hull gradients were suspected next and measured innocent — 0.18 ms a frame for 28 of them — so
`drawHull` was left alone instead of being refactored on a hunch.

---

## 0.83.0 — "The planets turn, and the site speaks Russian people actually use"

**The planets were stepping, not turning.** The game bakes sixteen rotation frames per planet and
switches between them — invisible at a planet the size of a fingernail, a slide show at full
screen. Sixty frames would be thirty megabytes each. So `site/planets.js` stopped baking rotations
altogether: it bakes **one surface map** (longitude across, sine of latitude down) and wraps it
onto the sphere in the frame itself, in vertical strips. The trick that makes it cheap: on a
sphere seen from outside, a point's height on screen *is* the sine of its latitude, so the map
needs no vertical stretching — only the longitude of each column has to be worked out, once.
Rotation is then a shift along the map: continuous, no steps, and **0.12 ms a frame** — cheaper
than the stepping version it replaced.

Light does not turn with the surface, because the star does not move: shadow and the atmospheric
rim are baked as separate overlays and land on top of the already-turned globe. The seam where the
map meets itself is cross-faded, and the day side is brightened by an additive layer, since a
shadow overlay can only darken and the game's own light multiplier goes above one.

**The texts were written by a designer talking to himself.** Rewritten as one person explaining
to another: "Открыли страницу — и вы в космосе. Впереди звезда, вокруг неё планеты. Летите
к любой, садитесь, выходите наружу в скафандре и идёте пешком." The mechanics page lost its
jargon — sections are now called "Откуда деньги", "Что может пойти не так", "Когда станет тесно"
— and the navigation shrank to three items, because "Механики" is a word from a design document
and "Как играть" is a word from a person.

**The parrot moved onto the front page** and sits there in its cage, pokeable, with its own page
left for taking it home. `site/parrot.js` now carries the bird for both, and the download is a
genuinely self-contained `treplo.html` built by `build.ps1` — the page it used to hand out linked
to the site's stylesheet and would have opened empty offline.

**Forgotten passwords can be recovered.** The host's `sendmail` turned out to be available and
unrestricted, so `forgot`/`reset` send a one-hour, one-use link from `noreply@drift-game.ru`. The
reply to `forgot` never says whether such an account exists. Resetting signs every other device
out, which is also how a stolen account is taken back. An address stays optional — without one the
account simply cannot be recovered, and the form says so plainly.

---

## 0.82.0 — "Five passes over the site, with the critique written down"

**The favicon was drawn in vector and never looked at.** At 16 pixels its dashed trail became
grit, its 1.2-unit stroke fell below half a pixel, and three nested circles merged into a grey
blob on a black tile that would have shown as a black square in a light tab. Five candidates were
rendered and inspected at 16/32/48 on both light and dark: the crescent read best but is the
dark-mode icon of every weather app, the ringed planet is the most generic space mark there is,
and the disc-with-trail turns into a magnifying glass. What shipped is a sphere lit from the side —
the game's own signature, two solid shapes, no background tile. The header logo now carries the
same mark.

**The planets on the site are the game's planets.** They were a gradient with stripes: a picture
of a planet rather than a planet, and next to the real thing it showed. `site/planets.js` ports
`src/07-planet.js` — the same fractal noise, the same spherical mapping, the palettes copied from
the world table untouched. Frames bake one at a time in the browser's idle gaps so the page still
opens in ~110 ms, and the texture is capped at 360 px because a full-size first frame cost 51 ms
on a desktop, which is a visible hitch on a phone. The background now costs 0.46 ms a frame.

**A real bug, found by looking:** gallery images were stretched into columns. `width`/`height`
attributes hold the layout before load, but without `height:auto` the height stays absolute while
the width goes to 100%.

**Geometry.** Nav items were 31–35 px tall and footer links 18 — the game's own rule is 44 for
anything poked with a finger, broken in the most visible place on the site. The top bar also mixed
in-page anchors with page links; navigation now lists places (Игра · Механики · Птица · Играть),
and the bird finally has a link.

**Contrast.** `--dim` measured 4.07:1 against the void — under the readable threshold, and a third
of the page is set in it. Now `#6d8494`: 5.16 on the void, 4.77 on panels, same mood. Focus was
removed from inputs and drawn nowhere, so a keyboard user lost the cursor; there is a focus ring
now, and the clickable spans in the sign-in box became real buttons for the keyboard.

**Texts.** The hero said the world "отвечает на последствия", which is not Russian. "Любопытство
против гринда" was making the same point twice on one page, and `world.webp` appeared twice —
the sixth card now shows a real descent through rain under an eclipse.

---

## 0.81.0 — "The front door, rebuilt"

**The landing page stopped being documentation.** It was twelve description cards under a hero —
good text in the wrong place, which turned a landing into a manual. Now the home page sells the
game in one pass (hero → what it is → six screenshots → the loop → why → what works today) and
every detailed explanation moved to **`/mechanics.html`**, a proper page with a sticky sidebar and
eleven sections. The rule behind the split: the home page makes you understand, the mechanics page
makes you knowledgeable.

**Six real screenshots, captured from the current build.** The 52 shots in `docs/shots` predate the
cockpit instruments, so they were not reused. `docs/stand.ps1` is new: it serves the repo over http
(the game needs a server, `file://` breaks parts of it) **and accepts frames** — the page hands over
its own canvas and the server writes it to disk, which is how these were taken with no screen
capture available. System, map, cockpit, cave, base, surface: 313 KB for all six as webp.

**The background got a body.** Planets now really rotate — body, cloud bands and terminator are
baked separately, and the bands ride inside a circular mask, so a revolution costs five drawImage
calls instead of a redrawn texture. Different speeds, different directions, orbital drift, parallax
on mouse movement, and still only one visitor crossing the frame at a time: twenty moving things at
once is a cheap sci-fi template, and the point here is emptiness with something living in it.

**The parrot moved out.** `/parrot.html` carries the real bird — the same `12x`–`12z` code — as an
installable app: a manifest, a service worker, and a `?pet=1` mode with no page chrome, so it lives
in its own window on Mac and Windows and survives losing the network. For anyone who would rather
not install, the same page downloads as one self-contained file.

Also: an SVG favicon (a disc that left its trajectory), an OG image cut from a real frame, and the
deploy now copies `site/` whole rather than by filename — the CI checks every page and asset
answers 200, because a broken image on the front page is a failed deploy too.

---

## 0.80.0 — "A front door, and a name to fly under"

**The site is three files now.** `/` is a landing page (`site/index.html`), `/play.html` is the
game, `/api.php` is the backend. The game moving off the root is what lets the front page stay put
while every build republishes the game underneath it. The page carries the pitch, an FAQ of the
mechanics, and a background drawn on the same canvas the game uses — baked nebula, three parallax
star layers, planets on sprites, one visitor crossing the frame at a time.

**Accounts.** Login and password, no email — `site/api.php`, PHP because this host offers no Node
application mode (the reasoning is in `docs/DEPLOY.md`). Passwords go through `password_hash`,
tokens are stored as their sha256, and everything lives in `~/drift-data`, outside the web root.
Twelve login attempts per IP per quarter hour.

**Saves follow the player.** `src/14-save.js` no longer needs configuring: it reads the token the
landing page left in `localStorage` on the same origin. Pushes are silent and throttled to one per
twenty seconds; on boot the game pulls and adopts the cloud snapshot only when it is genuinely
newer. A snapshot never overwrites a newer one — the server refuses. Opened from disk (`file://`)
the game stays entirely local and never mentions the cloud.

**Publishing is automatic.** `.github/workflows/deploy.yml` rebuilds on every push to `main` with
the same `build.ps1`, copies the three files, then asks the live site whether its `VER` matches the
source and fails if it does not. `server.js` and `worker.js` were removed: neither ever ran, and
two competing answers to "where do saves live" is one too many.

---

## 0.79.0 — "A queue of lines, and a thing on the table"

**M128** (`11b-speech.js` new, `27c-ui-hq.js` — the table block in the cantina, `26-ui-station.js`,
`14-save.js`, `28-loop.js`, suite `91zo-speech.js`). No conversations: a branching dialogue costs a
hundred hours of writing and produces a menu. This is the other thing.

- **A queue, not a conversation.** A place holds a short queue of lines and spends **one per
  landing**. Come back, hear the next one — twenty hours of acquaintance for the price of a string
  table. A need is mentioned in passing (*"could do with a valve"*), never as an order.
- **Silence is a line**, not the absence of one: he looks at your tape and says nothing.
- **The player never picks words. He puts something down** — a strip of tape, something from the
  hold, a rumour — and the answer is to the object. That is the whole input surface.
- **The tape became a thing** (the debt M123 left open): `T` in flight tears off the strip, which
  carries its sector, its misclosure and its length. It lies on the table, and it sells — a good
  strip sells well, and "good" means only one thing: you can see on it that the world was moving
  under the ship. Tearing it resets the paper, so a strip costs you the record you had.
- **Half of all speech is the ether**: faceless voices, other people's traffic, a dispatcher who
  has lost somebody, a forecast that says "as always". The cheapest life in the game. A postal
  runner hears them more often — the receiver is his profession (M126).
- **They change how they address you**: "пилот" → your ship's callsign → your name, on the count
  of landings at that place alone.

---

## 0.78.0 — "Instruments are merchandise"

**M127** (`05b-instr-kit.js` new, `26-ui-station.js` + a `ПРИБОРЫ` tab, `06-galaxy.js`,
`index.html`, `25a-instr.js`, `25b-tape.js`, `25d-instr-rack.js`, `14-save.js`, `28-loop.js`,
suite `91zn-instr-kit.js`). The five panel instruments stop being a property of the ship and
become **things**: six works, an age, and a character each.

- **Works, not tiers.** Казённый is the middle of everything; «Горн» reads coarse but survives
  anything; «Сирин» has a fine scale and a nervous needle; «Веха» is observatory work that holds
  its zero; артельный is homemade and nearly free; трофейный is somebody else's work with the
  markings rubbed off. Two «Сирин» are not identical — the seed spreads them inside the works'
  leaning, exactly like parts.
- **A bad chronometer is not "−5%".** It *resolves* the deviation worse, so a region that lies
  with time has to be flown closer to its core before its needle admits anything. The needle's
  tremor and the pen's line width come from the same instrument, so the rack physically looks
  different depending on what is bolted into it.
- **They age from work, not from the calendar**, at roughly the rate the hull wears; a shipyard
  verifies them for a fraction of the price of a new one. They are never destroyed — they just
  read ever more bluntly.
- **A counter at trade, yard and science stations**: two or three offers, derived from the station
  and a slow clock rather than stored, richer systems carrying the serious work. What you unbolt
  goes to a four-place shelf instead of vanishing.
- Kit and shelf are player decisions, so they persist (`v:4` unchanged, old saves get the standard
  shipyard set).

---

## 0.77.0 — "A hull is a profession, not a rung"

**M126** (`03f-hull-role.js` new, `25a-instr.js`, `25b-tape.js`, `25d-instr-rack.js`,
`12p-news.js`, `12l-barge.js`, `28-loop.js`, suite `91zm-role.js`). The hull ladder used to be
cheap→expensive: the next one was simply bigger in every number. A **profession** changes which
stories are open to you, not which numbers are larger.

- **Изыскатель** (Стриж, Игла) — first-class instruments, poor lift: the misclosure shows on his
  needles long before anyone else's. **Рудовоз** (Вьюк, Мамонт) — hold, mass, blindness.
  **Почтовик** (Клинок) — the best receiver in the game: the ether keeps almost twice as many
  rumours. **Буксир** (Обод) — takes other people's trouble on a line, and a rescued barge pays
  him accordingly. **Вахтовка** (Скат) — the only hull where passengers talk in flight.
  **Сторож** (Топор) — survives what kills the others.
- **The world does not change with the hull, the instrument does.** The misclosure of a sector is
  the same for everybody; what differs is how early it becomes visible on a scale, and how boldly
  the pens write it. A bad instrument is not "−5%", it simply reads coarser.
- Unique and fused hulls have no assigned profession, so it is derived from what the shop
  actually built: a warehouse is an ore carrier, fast-and-empty is a postal runner.
- The rack now carries a nameplate: whose equipment this is, and why it reads better or worse
  than the neighbour's.

---

## 0.76.0 — "Eight needles, five pens, one sheet of paper"

**M125** (`25d-instr-rack.js` new, `25c-instr-hud.js`, `28-loop.js`, stand `docs/mkrack.ps1` →
`docs/shots/rack.png`, suite `91zl-rack.js`). The pod answers "how much, right now" out of the
corner of an eye. The **rack** is the same equipment opened up, for when the player turns to
*read* it: press `I`, or tap the pod.

- **Eight instruments in recessed sockets**: cream dials under glass, real major and minor
  graduations, amber needles with a metal hub and their own shadow, units under the scale,
  screws in the corners, matte metal with grain. Every scale has its own range — identical
  scales are the first sign of drawn, rather than measuring, equipment.
- **Every needle is a real game value**: the five region instruments (25a) plus fuel, hull and
  hold. Nothing was invented for decoration.
- **A five-channel strip chart** that reads as one: warm paper with a printed grid, a supply
  roller on the left and a take-up roll with wound paper on the right, a dashed zero line per
  band, pen carriages on their rail with the tip touching exactly where its curve ends, feed
  perforation crawling with the tape, and time marks along the bottom counted in the pen's own
  time — which runs faster near a region's core.
- **Deliberate exception, on request:** the channels now carry colour and a name. Colour here
  separates five pens on one sheet, the way a real recorder does; it is not an alarm and not a
  hint, and the rack still says nothing — no sound, no message, no log line. The suite watches.

---

## 0.75.0 — "The instruments where the decisions are made"

**M124, first step** (`25c-instr-hud.js` new, `index.html`, `style.css`, `25b-tape.js`,
`28-loop.js`, suite `91zk-tape.js`). The panel and the recorder lived on the cockpit's ceiling
block — which means they were visible only in the belt, while the player flies in the system
view. An instrument that is absent where decisions are made is not an instrument.

- **One narrow pod in the instrument row**, between the ship's vitals and "where we are": five
  needles, the misclosure in figures, a strip of tape under them. Same glass, same border, same
  fade — it is one row, not an annexe.
- **One recorder, not two.** The drawing was lifted out of the ceiling block into `tapePaper`,
  so the pod and the cockpit print the same paper from the same ring.
- **In the belt the pod hides**: there the panel is real and hangs over the glazing. On a narrow
  screen the pod goes away entirely — 44-px buttons and "where we are" matter more.
- The paper is quieter in the pod than in the cockpit: over the world hangs only what is needed
  now.

Not taken from M124's spec: the overlay HUD stays, the table and the physical receiver wait for
their own pass.

---

## 0.74.0 — "Paper, five pens, and the memory of observation"

**M123** (`25b-tape.js` new, `25a-instr.js`, `09-audio.js`, `25-cockpit.js`, `28-loop.js`, stand
`docs/mktape.ps1`, suite `91zk-tape.js`). The honest answer to "how does a player compare
something he saw forty hours ago". Not a camera — **the ship writes by itself.**

- **A paper strip recorder** to the left of the panel, on the same ceiling block: five traces,
  graduations, and **not one label**. What it means is the player's business.
- **The pen writes change, not the reading.** Each pen carries its own slowly adapting zero, so a
  flat line means "nothing happened here" and a climbing curve means the world is moving under
  the ship. On an absolute log scale all five pens drew straight lines — which is exactly how the
  quiet county (M142) would have become indistinguishable from anywhere else.
- **The rhythm is the reading.** The pen ticks always; near a region's core it ticks faster,
  because the interval is set by the misclosure. No beep, no message, no colour change: the
  player looks up on his own.
- **Scrollable back** — `[` and `]` walk the tape, `\` returns to what is being written now; new
  columns do not drag the picture out from under the eye while it is held.
- Nothing is persisted and nothing is announced: the suite spies on `say`/`tell`/`logAdd` while
  the tape writes itself, and checks the pen against the needle whose scale it shares.

---

## 0.73.0 — "Five needles and a misclosure"

**M122** (`06b-region.js` and `25a-instr.js` new, `25-cockpit.js`, stand `docs/mkinstr.ps1`, suite
`91zj-instr.js`). The instrument set the thirteenth pass stands on. Not a detector: **work first,
meaning as a by-product.**

- **Five instruments**, each earning its place in ordinary flight: хронометр (deadlines and the
  length of a local day), курсограф (plotting and drift), масс-детектор (cargo, rocks, bodies),
  приёмник (the ether's noise floor), актинометр (light arriving). Each reads a real number off
  the real world.
- **The region** (`06b-region`) is the new unit: a square of sectors with a core inside it, and
  **exactly one** instrument that lies there. The lie grows smoothly toward the core across
  several systems and never in a jump, so after enough hours the panel reads as terrain.
- **`невязка`** — one small number: how badly the ship's five ways of fixing its own time and
  place disagree. Near zero in ordinary space.
- **No beep, no message, no colour change, anywhere.** The player notices, or does not. The suite
  spies on `say`, `tell`, `logAdd` and `sfx` across eighty sectors to keep it that way.
- Nothing here is persisted: the region is a function of the sector, like the system itself.
- The panel lives on the cockpit's ceiling block, where the player raises his eyes — not as an
  overlay on the world.

## 0.72.0 — "Everything here is somebody's"

**M121** (`12ua-flea.js` new, `06-galaxy.js`, `17-mode-system.js`, `26-ui-station.js`,
`index.html`, `14-save.js`, `08-state.js`, stand `docs/mkflea.ps1`, suite `91zi-flea.js`).
Блошинец: a seventh station type, and the only one whose stock is **used goods**.

- **Nothing here is new, and everything has a previous owner.** Parts off boards nobody scrapped,
  a live repeater out of a dead captain's effects, addresses written by hand — and information
  about the player, sold at the same counter as the bolts.
- **Provenance is the mechanic.** Every lot carries who owned it, why it was sold, and a sector
  you can fly to; buying it puts that address on the map. The counter does not sell things, it
  sells places, and the thing comes with them.
- **Its own money.** Prices are quoted in the house's scrip (M113); credits are taken at a 28%
  markup, because here your money is the foreign kind.
- **The lot about you leaves without you.** Undock without taking it and someone else buys it —
  the hunter gets the sector. Not a punishment for being poor: the price of having been here.
- Rows are deterministic from the station seed and a slow clock; only what was **bought** is
  persisted, so a bought lot never returns to the counter.
- The silhouette is its own: a welded heap of mismatched sections under one outline, short
  asymmetric awnings, goods hung on lines and a garland of warm lamps.

**M120's portrait faults, closed** (`12tb-grok.js`). The three eyes are spread wide with sockets,
light rims and ridges of hide between them and now read as three at 64 px; the hide carries dust
streaks, a worn belly and old scrapes instead of flat khaki; both working arms break at the elbow
and run outside the silhouette, and the small chest pair no longer disappears into the body tone.

## 0.71.0 — "He digs for food, not for money"

**M120** (`12tb-grok.js` new, `27c-ui-hq.js`, `14-save.js`, `08-state.js`, stand
`docs/mkgrok.ps1`, suite `91zh-grok.js`). Грохотун: loud, four-armed, three-eyed, delighted to
see you and completely unable to keep his mouth shut. He digs the expedition's sites for a
living, knows what an obelisk **is**, and knows nothing at all about who left it.

- **A run, not a seat.** He shows up in the cantina with one line of his own. He never joins the
  crew, never takes a domain and never asks for a ship: the four-seat rule does not move. Hand
  him a site from your own map layer, fly away, come back to a result.
- **He does not take credits.** He takes food, in quantity, and the quantity grows with every
  site he closes — the one supply line in the game that exists for a person rather than a
  profit.
- **Digging costs more than the hold.** A dig is loud: the sector he worked goes up a step of
  pirate occupation. And he talks: half the time he comes back, he tells the tables where
  **you** have been, and that is one of the ways a hunter finds you.
- **Sites come from your own layer** — the addresses the report named and the points of their
  survey. Each site is a witness's place: it hands over a piece of the report, plus whatever the
  spoil heap yields. A closed site is never offered twice.
- **He is the tutor, once.** The first time you are holding something you cannot read, he
  explains where words come from — and explains only: not one word lands in the dictionary.

Portrait faults found on the stand and fixed: the dust sat over his head like a floating halo;
the teeth were a keyboard glued under the smile instead of teeth inside a mouth; the skull was a
flat oval with no light on it; and four arms grew out of nothing without a shoulder between them.

## 0.70.0 — "The shift nobody came to end"

**M119** (`12ta-tin.js` new, `21-mode-surface.js`, `18-mode-map.js`, `14-save.js`, `08-state.js`,
stand `docs/mktin.ps1`, suite `91zg-tin.js`). A world picked clean and abandoned — and the
owner's machinery still running, with nobody left to run it for.

- **It transmits on a loop.** Jump into the system and you hear the request itself: the same
  goods, the same count, "the shift continues". A running plant is the only one that goes quiet.
- **The order is written in units that no longer exist** — barrels, crates, stakes, details,
  settings. Nobody is coming to fix the paperwork, so the conversion is the player's job: pour
  goods in and the counter clicks over, and the machine tells you its rate once it has taken
  its first measure of anything.
- **It restarts a piece of production.** A closed order runs a shift exactly as long as the
  feedstock lasts; the plant makes what it was built to make and drops it in the outlet bin.
  It has no mood, no opinion and no favourites: it gives you everything it made and never a
  credit. The cheap version of the giving loop, and a place to learn it before a living village
  is at stake.
- **The tape is an honest witness.** Machines record everything and understand none of it: three
  entries, each a date and a bearing and a number where a description should be. The date is
  read by the sky's calendar (M107); the bearing lands on the map as a mark; and each entry
  hands over a piece of the report — the third witness the pool has been waiting for.
- Never where a settlement could live: the shift nobody came to end is about the absence of
  people.

Faults found on the stand and fixed: every part sat on its own patch of terrain, so on a slope
the plant fell apart and the outlet bin sank into a pit (one level now, on a slab with an
embankment under it); the slab itself hung in the air; the conveyor read as a wire; the smoke
was a column of even circles; and the intake gave no sign of how much of the order was already
in it.

**A bug fixed on the way:** `addRes` returns how much fitted, not whether it worked. Read as a
boolean, a full hold would have swallowed a whole bin of output.

## 0.69.0 — "Fifty-two things to do on a perch"

**M117a** (`12z-parrot-acts.js` new, `12y-parrot-face.js`, stand `docs/mkparrot.ps1`,
`docs/parrot-live.html`).
The bird got a body at M117 and then had nothing to do with it: it breathed, blinked and rocked,
and after a minute of watching that reads as a loop rather than an animal. The window is the only
place it is ever seen — open it and it is there, close it and it is gone — so everything the
player learns about it, they learn from what it is busy with.

- **A repertoire of 52 behaviours, written as data.** Fifty hand-written animations would be
  fifty pieces of code nobody debugs and half of which nobody sees. Instead the bird gained ten
  degrees of freedom — head roll, tuck into the shoulders, a step along the perch, a turn through
  edge-on, a wing stretch that is not a flap, one lifted foot, a tail fan, a yawn, a shiver, a bow
  and an upside-down hang — and a small sequencer on top of the springs. A behaviour is one line.
- **A behaviour never switches life off.** It writes only its own degrees of freedom; breathing,
  rocking, the ripple across the rows and the blinking keep running underneath. The resting pose
  is every field at zero, so any behaviour settles by itself and none can get stuck on a frame.
- **Three moods decide what can happen at all.** Drowsiness accumulates while the bird is left
  alone and is spent by a nap that ends on a clock rather than on a dice roll; a poke makes it
  cross for a few seconds. Measured, not assumed: the first two models left the bird asleep three
  quarters of the time and never once cross, and the measurement itself was misread twice because
  the stand served a cached build — the game page is the honest place to measure.
- **Rare things stay rare.** Hanging upside down carries the weight of one against fifty.
- The bird still does not invent: when a behaviour makes it speak, the line comes out of its own
  memory (12x), glyphs and all.

**A numbering note.** The repertoire took 0.69.0, which the plan had pencilled in for M119
(Грохотун); that milestone moves down a version, as the bird's body did at M117.

---

## 0.68.0 — "The meadow that remembers light"

**M118** (`20c-peep.js` new, `21-mode-surface.js`, `12q-lore.js`, stand `docs/mkpeep.ps1`).
The one place where the expedition is **seen** instead of read about — and the payoff that
makes the sky's calendar (M107) matter at last.

- **A mat that holds light.** Roughly one solid world in nine that has a moon grows подглядка:
  flat overlapping plates in three tiers with tufted stalks, labelled where you stand on it and
  otherwise indistinguishable from ground cover.
- **It replays only in the dark**, which on a planet means during an eclipse. Figures walk
  across the mat in cold light — how many, which way, and what they carried. Nothing is
  captioned, ever: the player reads it or he doesn't.
- **The scene is fixed per world** (count, load, direction, and the beat where one of them stops
  and turns back), so the same meadow shows the same crossing every time.
- **Watching pays.** A full pass, stood through inside the mat, hands over a piece of the report
  like any other witness. Walking away resets the watch — halves from two eclipses do not add up.
- **Bug, and an old one:** a place key that was a string (`"sat:7"`) coerced to zero, so every
  satellite in the galaxy pointed at the same fragment and went silent after the first. Strings
  now fold into a number of their own; numeric keys are untouched.

Faults found by eye on the stand and fixed: the mat drawn in one row read as a highlighted
terrain contour rather than a growth; single stalks read as antennas (they grow in tufts now);
the night glow hung over the meadow as a lens of fog (it lies flat along the ground); the ghosts
stood a head taller and bulkier than the astronaut beside them; the stride was a pair of
scissors; and the carried pole ran clean through the leading figure instead of ending in his
hands.

## 0.67.0 — "The bird has a body"

**M117** (`12y-parrot-face.js` new, `index.html`, `style.css`, `17b-finds.js`, `28-loop.js`,
stand `docs/mkparrot.ps1`). Closes the open tail left by M116: the repeater was a line on a
board — no picture, no presence, nothing to touch.

- **A perch window.** Opened from the menu (the button appears only once a bird is aboard), it
  hangs over the world in any mode and closes with the cross. The bird is property, not an event.
- **Drawn procedurally, animated on springs.** Cobalt back, cream breast, long layered tail and a
  crest of thin plumes, each carrying a cold bead on a bare stalk that lags half a beat behind the
  head. Breathing, blinking, sway, ripple per feather row, and a full-body wing beat.
- **Five poke zones, five answers** — crest, beak, ruff, tail, body. What it says is only what it
  heard (12x): unread pidgin still comes out as glyphs. It never invents a line.
- **The bird now actually exists.** The roll on the hulk find is gone: the first hulk opened hands
  the bird over, because a pet that reaches half the playthroughs is a lottery, not a mechanic.

Faults found and fixed by eye over five stand passes, in order: the dark mass showing between
feathers (coat clipped to the body outline), the coat reading as a zebra and then as cobblestone
(denser tiling, low-contrast scales with one shadow under the edge), wing and tail merging into
one broom (separate axes), and plumes drawn as stem-plus-strokes reading as fish bones (a filled
vane along the stem).

## 0.66.0 — "It says only what it heard"

**M116** (`12x-parrot.js`, `17b-finds.js`, `12q-lore.js`, `26-ui-station.js`, `13-pirates.js`,
`27h-ui-lore.js`, suite `91ze-parrot.js`). The first of the five witnesses, and the only thing in
the game that gets better while you do nothing.

- **Трепло ушастое** — a repeater found once per playthrough in the effects aboard a wrecked
  scout, with its dead owner named. That is how the player learns there was a dead man, well
  before he learns who. (The pass spec sources the first bird from the bazaar, M120; the hulk is
  the same kind of source — someone's property with a known fate — and does not wait for it.)
- **It never invents.** Every line traces to an event the player was present for: prices heard at
  a counter, a phrase picked up at a notch, the name of a ship he shot down.
- **It pays before it is understood**: at a foreign counter it repeats the prices of a station you
  docked at earlier, opening that market with no flight.
- **Comprehension is retroactive.** Pidgin lines are stored as word *numbers* and shown as glyphs;
  a word arriving from a fragment re-reads everything already remembered, and a phrase heard in
  hour two can start speaking in hour twenty while you sit still. A decoded phrase pays with an
  address, the same currency a notch pays in.
- **It testifies against you too.** What it overheard from you it eventually blurts at a counter,
  and that costs reputation where it was heard. Once per line.
- Everything it remembers is read on the fragment board — these are depositions, not a new screen.

## 0.65.0 — "The assembled account"

**M115** (`12w-survey.js`, `18-mode-map.js`, `27e-ui-home.js`, suite `91zd-survey.js`). The last
milestone of the twelfth pass, and with it the pass is closed.

- **The expedition's own survey**, drawn over your map in their notation — a cut cross with a line
  under it. Each earned fragment puts up exactly one point, including in systems you have never
  visited; nothing appears in advance.
- Their points are a pure function of the fragment seed, so the survey is the same in every session
  and does not follow the player around: it was taken long before him.
- **A chapter you have read joins its own points** with a dashed leg. Scattered notches become a
  route only when the account behind them is finished.
- **The study gains its shelf** under the museum wall: one spine per fragment, in the order this
  player found them, coloured by chapter. No text and no revelation screen — the ending is the
  layer, the settlement that lives, and the glyphs you can now read.

## 0.64.0 — "A world that ends on schedule"

**M114** (`12v-doom.js`, `02-world.js`, `21-mode-surface.js`, `12t-settle.js`, `14-save.js`,
`28-loop.js`, suites `91zc-doom.js`). The chapter the obelisks and the sky calendar were built to
reach.

- **The date only lands where the player has something to lose**: one deadline per playthrough, on
  the system where his own settlement reached stage 2. It is learned under that sky, not from a
  menu, and shows up on the same map layer the rumours use.
- **Evacuation is the ordinary machinery of the game**: people are a line in the hold (`RES.folk`),
  so lifting is hold space, trips and time. Not sellable, not giveable, never dumped for overflow —
  and if the ship is wrecked with people aboard, that is written down as its own line.
- **Nobody assists.** Hired hands count only if they were already ordered to that sector, and they
  carry half a hold each: the number lifted is the number the player organised in advance.
- **Where they land is the outcome.** Any live world in another system with nobody on it: the
  settlement restarts at a lower stage with half its buildings left behind, but keeps its seed,
  its name and therefore its vocabulary — the same people, not new ones.
- **Not lifting them is a permitted ending.** The hour passes, the settlement is gone, the system
  stays on the map empty and their glyphs have nobody left to answer. No penalty is charged; that
  is the whole weight of the decision.

## 0.63.0 — "The rate has reasons"

**M113** (`12u-scrip.js`, `12p-news.js`, `13b-occupy.js`, `12t-settle.js`, `14-save.js`, station
tab `scrip`, suite `91zb-scrip.js`). Four trading houses, and a scrip you can bet on.

- **A house owns stations**, decided from the system seed on its own hash stream. Its scrip is a
  claim on that house — bought and sold **only at its own stations**, worth nothing anywhere else.
  It is not a second wallet: it buys nothing and discounts nothing.
- **The rate moves only on events that really happened.** `scripMove` is the single door, it
  refuses a move without a reason, and every move is written to a ledger the player can read on the
  tab. Sources: a station changing hands, a barge that never arrived, a sector gone quiet, emptied
  warehouses (all rolled by M99 anyway), plus two of the player's own — a settlement reaching stage
  3, and a system freed of occupation. No random walk, no drift term.
- **Round-tripping is a loss**: 6% spread each way and a 40-unit cap per docking. The only edge is
  knowing first — which the player does, because he causes most of it.
- Neither the wallet nor the holding can go negative; a save with a nonsense rate is clamped, an
  unknown house is dropped, and ledger lines without a reason are thrown away on load.

**Repair.** `src/01-core.js` had been saved in the wrong encoding during 0.60.0, which turned the
name syllables into mojibake — every generated star, station and planet name in the game came out
as garbage. The file is restored; names read again.

## 0.62.0 — "Ammunition is cargo"

**M112** (`16b-missile.js`, `05-parts.js`, `02-world.js`, `08-state.js`, `13-pirates.js`,
`26-ui-station.js`, suite `91z-missile.js`). Missiles enter as a second logistics problem, not a
second gun.

- **A new part kind**, `missile` — the launcher — with its own hardpoint. Every hull gets exactly
  one, appended **last** so slot indices of existing loadouts do not shift and old saves keep
  their fits. Two affixes of its own: warhead and guidance.
- **A missile is a line in the hold.** `RES.missile` takes cargo space like ore, the market does
  not trade it, managers do not eat it as a sample, and the settlement is never handed it as food.
  Flying out with a full magazine means flying out with no revenue — that is the whole decision.
- **Assembled in the lab**, next to part crafting, out of alloy and isotopes; a working lab of your
  own adds to the batch. A batch that does not fit in the hold is not assembled at all.
- **It hits everyone** — baron, hunter, renegade — unlike the battery (M111). The price is hold
  space and the fact that a miss is spent for good: the missile picks its target once, at launch,
  never re-acquires, and burns out.
- Own pad and key (`G`), shown only where it can be fired, labelled with what is left in the hold.

## 0.61.0 — "The battery is built, not bought"

**M111** (`21d-battery.js`, `21a-mode-base.js`, `21ab-base-interiors.js`, `13-pirates.js`,
`20a-poi.js` + `20aa-poi-shapes.js`, `20b-poi-find.js`, suite `91h-base.js`). System defence
enters the game as a compartment, not a purchase.

- **A room in the base cross-section**, top level only, `-12` power inside the existing balance:
  defence competes with production, so putting one up is a real decision, not a shopping trip.
- **It cuts noise and only noise.** `battTarget` takes the stray jackal — no rank, no special
  role — and can do nothing at all to a baron, a hunter (M98), a renegade (12g) or a rival.
  Range is around its own planet, not the whole system, and a browned-out base fires slower.
- **Visible from orbit**: a line from the ground under the ships (`battDraw` inside `drawCombat`),
  with a kill written to the log by name.
- **The magazine is drawn**, because from below you see what feeds the gun, not the barrel: the
  turret ring in the ceiling hatch, the feed hoist, shells standing at hip height, and a firing
  lamp that lights exactly when the battery is actually shooting.
- **The expedition built these too.** A dead battery is a new POI on solid worlds
  (`drawDeadBattery`, stand `docs/shots/poi-battery.png`); walking up to it pays a piece of the
  report, like a notch, because it is their government property and not someone's monument.
- `20a-poi.js` was cut along its seam: the shapes moved to `20aa-poi-shapes.js`.

## 0.60.0 — "They stand between you and the fauna"

**M110** (`12t-settle.js`, `22-mode-cave.js`, `18-mode-map.js`, suite `91y-settle.js`). A
settlement is now felt on foot, not only in a tally.

- `settleWatch(p)` — the watchers are a fact about the ground, not a buff on the player: they
  work from stage 2, only on the settlement's **own** planet, and only while it is fed
  (`mood ≥ 30`). A hungry village drops its watch first.
- In a watched biome a cave holds **fewer** biting beasts, and the ones there close only to a
  line and cannot bite at all. The prompt says why, so the player reads it as their doing.
- It cuts the other way. `settleLeftBehind()` runs on `jump()`: the tail you leave over their
  heads lands on them. The price is taken per pirate that had **noticed you** — a hunter (M98)
  counts double, since he does not care whose roof it is. Mood always; a building only under a
  dense raid. The settlement is paid nothing for it — cover has a price, not a fee.
- `raided` added to the manager-style whitelist in `applySave` so the count survives a save.

## 0.59.0 — "You give, they decide"

**M109, the settlement** (`12t-settle.js`, suite `91y-settle.js`). Habitable worlds have people
living on them, and the one thing you cannot do is give them orders. You hand over cargo on foot —
whatever you happen to be carrying — and they choose what to raise from it: their own leaning from
the seed, tilted by what you kept bringing. Ten hours of ore and ten hours of volatiles make
different villages. Growth is a lazy roll over elapsed time with the 24-hour offline cap, never a
live simulation; while there is food in the barn they eat and build, and when it runs out their
mood falls. They pay **in goods and on their terms** — you ask, and the mood decides whether
anything is ready; a settlement never pays credits, and asking twice in a row gets you nothing.
At stage 3 they become a stop on the factor's map and barges start calling, exactly as your own
planet does. They answer in the expedition's worn pidgin: a line of glyphs where the only words
you read are the ones that came to you as fragments of the report.

Also: the graphics queue was rewritten as a **debt list** — one line per fault found by looking —
and the narrative of twelve base passes and the first `scoop` pass moved to `docs/PLAN-archive.md`.

## 0.58.0 — "The luxe yacht is no longer a courier with bus windows"

**A yacht is the one hull bought for the look of it**, and it was an arrow with a strip of
identical yellow windows — a courier with a school bus painted on the flank. Ten passes over one
stand (`docs/mkyacht.ps1` → `docs/shots/yachts.png`), luxe yachts only.

- **Form.** A long thin body: fine drawn-out entry, beam aft of midships, a tail that runs almost
  to a thread. A **manta wing** grown out of the hull by a strake, thin, with tips swept back past
  the stern, and the **spindle nacelles standing on the wing** — each with a needle forward, which
  is what makes the thing read fast while parked.
- **Materials nobody else in the fleet has**: deep lacquer with metallic grain instead of riveted
  plates, teak on the open deck only (foredeck, fantail, two side promenades — the first pass
  planked the whole ship and it read as parquet), brass edging, pearl superstructure with a fine
  carbon weave.
- **Three tiers instead of a fighter canopy**: saloon, promenade deck, and the owner's wheelhouse
  under a glass dome. Continuous panoramic glazing with warm light spilling onto the deck — the
  band of twenty identical windows was the single thing that gave the courier away.
- **Three engine schools**: `candle` — one long nozzle on the axis, `pods` — the pair on the wing,
  `crown` — small nozzles across the transom. Luxe thrust is cool, white-blue and half the length:
  an orange bonfire astern reads as freight.
- **Three finishes** (`classic` brass-and-teak · `pearl` white-and-chrome · `noir` near-black with
  gold) so six seeds are no longer one yacht, plus a name in brass instead of a stencilled
  inventory number, a tender port with a gangway, a helipad on the fantail and deck lighting.

Suites — 2966 green.

## 0.57.0 — "Finds in flight, and half of them are theirs"

**The space between planets was empty** — item 5 of the visual queue, open since M55. Minutes of
transit were something to sit through.

- **Four finds**: an escape capsule still calling, a dead satellite still transmitting, a drifting
  container, the wreck of a survey ship. Approach and inspection are exactly the barge-wreck ones
  (M95); rewards come from `POI_FIND` and `rareTake`. No fifth system was grown for this.
- **One of the four is theirs.** The satellite belongs to «Долгий Ход» and is the only find that
  carries a fragment of the report — and it always transmits a **bearing**: a sector you can fly
  to, marked on the map. The other three pay in the ordinary currency of the game: parts, cargo,
  fuel, reputation. None of them pays credits.
- **Deterministic by system key and a coarse six-hour bucket.** Re-entering a system does not spin
  the drum; come back tomorrow and the void has changed. What you took stays taken forever.
- **Empty systems are normal** — about two in five. A find that is always there is not a find.

Suite **"finds: the void stopped being empty"** — 2938 green.

## 0.56.0 — "The sky keeps a calendar"

**The far corner of the galaxy differed from the near one by a danger coefficient and nothing
else.** A place becomes a place when time is attached to it: come back on such a day, because on
that day something happens here. This is the first milestone of the long story told in pieces.

- **Four events, all computed, none rolled.** An eclipse (a moon of the world you stand on crosses
  the star), a parade of three or more planets inside an angular window, a comet on a long ellipse
  that arrives and leaves on schedule, and the day count itself. `celestAt(sys, t)` is a function
  of time — the same day in the same system always gives the same sky, which is what makes it
  possible to arrange to meet there.
- **The world has a second, slow clock.** In the system view planets circle in half a minute — that
  motion is a flight playground, deliberately clamped so the autopilot can catch things. A calendar
  cannot rest on it. `CEL_DAY` is a minute of play; moon periods run 4–21 days, comets 200–470.
- **It is light, not UI.** An eclipse takes the directional light out and leaves the sky's fill, so
  the world goes flat and blue rather than black; colour drains before brightness does; flora that
  lives on light folds up. The header names the event, because a picture with no name reads as a
  glitch.
- **Its one mechanical right**: reading an obelisk (M106) under the same sky it was cut under gives
  a **second answer** — the address of the next fragment in that chapter. No bonus, no multiplier.
  Prices and yields never see the sky.

Suite **"the calendar: the sky is computed"** — 2923 green.

## 0.55.0 — "The ship ages"

**The garage had nothing to do.** A hull only ever went bad in a fight, and a fight is patched at
any station for fourteen credits a point. Now the ship remembers the hours.

- **Wear accumulates by itself**, from hours flown, and faster where it is dirty: the belt sands
  the paint, the mine dusts it, a gas giant's atmosphere eats it. Three hours at the stick take a
  hull from `свежий` to `облезлый`.
- **You can see it.** The colour stripe — the ship's one identifying mark — fades toward the body
  colour and dusts over; scuffs open along the leading edge; soot settles by the nozzles. It reads
  at thumbnail size, which is the only size that matters in flight.
- **It costs the hands, not the hull.** Up to −12% thrust and turn, and nothing else: an unwashed
  ship handles worse, it does not break. Hull, tank and hold are untouched.
- **Repair and service are different things.** A station patches holes; the yard will take half the
  wear off for real money. Only your own garage at home takes it down to clean, and takes nothing
  for it — the house has no prices. You come home because it has piled up.
- Wear lives on the **hull**, not on the player: switching ships lets one rest, it does not wipe
  its history.

Suite **"wear: it piles up in flight and comes off by hand"** — 2908 green.

## 0.54.0 — "A trade branch of your own"

**The factor had a route; the player had a sticky note.** Since M84 the domain has been trading
real goods at real prices, and the player kept "where titanium is cheap" in his head. Now the
route is a thing on the table.

- **Mark 2–4 stations on the map** (`В МАРШРУТ` on the selected system) and the game reads the
  live market for you: what to take on each leg, at what price it lands, how much the loop nets
  after fuel. The ring closes — the way back is half the money, and it is counted.
- **It lies on the map, not in a list**: numbered stops, arrows for the direction of travel, and
  one label on the best leg. One, not four: three plates turned the map into a table.
- **It can be sold.** An information buyer pays for the spread and starts working it himself:
  the route leaves your map and the prices on it settle. Sold means lost, and that is the price
  of quick money. The paper is valued at a full hold, not at your current purse — a spread does
  not get cheaper because you are broke.
- **It can be handed to the factor**, who takes as many legs as his level and the `плечо` perk
  allow, and carries it instead of you.
- **It wears out.** Every loop you run presses the price down where you sell (the market has done
  this since M84), so the ring thins with use and asks to be replanned. A route is not a machine
  for money.

Suite **"the route: legs, the count and the paper"** — 2891 green.

## 0.53.0 — "Reputation decides who walks in"

**Reputation changed the prices and the number of tables, but never who sat at them.** Now it
decides the company: where you are known, at least one manager at the bar has a level (two at the
top of the scale, and they ask more for themselves), and a hired hand with a real flight record is
looking for work. Where you are remembered badly, whoever turns up has no history at all.

**It is not access progression.** The room never empties, and the content of a deal never changes
with reputation — the same deal reads the same at +5 and at −5. Reputation buys company and price,
never content.

## 0.52.0 — "Nodes and crowns in hand"

**The thing stands where you actually look.** A holder on the left cockpit pillar (`25-cockpit`)
carries one found node — a real object drawn by the same generator as everywhere else, hanging on
a short line and swaying with roll and yaw. The forged crowns sit on the bracket itself as a small
bar, so the marks that were only ever visible along the hull from outside are finally visible from
the seat.

**The holder gives nothing.** It is not a slot and not a bonus — effects still come from crowns
only. Choosing what stands there is "what I want to look at", not an optimisation. Any node you
own can be put in from the sets screen; without a choice it shows the last one found, and a node
that leaves your collection leaves the holder.

Fault found by eye and fixed in the same pass: mounted on the central stack the node landed inside
the pitch ladder and the hull nose and read as a rock *outside* the glass.

## 0.51.0 — "A lived-in house"

**The things can be poked.** Clicking the garage parks a ship, clicking the showcase puts the rare
stock out, the study and the living quarters answer with what is in them. The buttons in HOLDINGS
stay — the scene is a second way in, not a second set of rules, and the hit zones are computed by
the drawing itself, so there is no second description of the geometry to drift out of sync.

**The hallway and the garage caught up with the rest.** After M93 the other steps were lived in
and these two were a door with three hooks and a niche with a ship. Now: a doorway with a frame and
panels, a plank of hooks with coats that have shoulders, boots by the threshold, a shelf with keys;
in the garage a workbench with parts, a tool board under the ceiling, a drum, rags and a puddle
under the stern. Faults found by eye and fixed in the same pass: the coats read as a bottle until
the hallway grew wider, the tool board lay inside the ship's hull, the ship floated above its
trestles, the power cable crossed the silhouette like a whip, and the museum wall shouted over the
whole room until its colours were mixed down into the wall.

**People are visible at home.** Whoever is not on a run sits in the living quarters as a real body
(the same `hqFigure` as everywhere else, squeezed to the room's scale). Low morale is drawn — the
figure is smaller, darker and sits — so it stops being an invisible multiplier.

**A housemate speaks once per step.** A tip that leaves a real mark on the map, a spare part, or a
rumour — once per tier and never again, remembered through saves, so he never becomes a tap.

**The museum wall** hangs over the desk in the study: taken pieces framed, the rest bare nails.
The progress board lives there too, as a log of what was brought and from where.

## 0.50.0 — "The world moved without you"

**Time away is told in words, not simulated.** New module `12p-news.js` rolls the elapsed time
into rumours you hear in the cantina — a station squeezed dry, an owner changed, a barge that
never arrived, a pirate captain someone else took down. Behind every rumour stands a real state
change you can fly out and check: market pressure, a wreck lying where it fell, a sector gone
quiet.

**Knowledge is a layer on the map now.** Each rumour leaves a mark on its sector — "prices moved",
"the owner changed here", "a barge wreck" — closing the M92 tail where knowing something and
seeing nothing on the map amounted to not knowing it.

**A rival collector is a transfer, not a loss.** He takes a rarity you had not found yet, and
becomes its address: he flies his own sector, he does not give it up willingly, and beating him
hands the piece over. He never takes the last one, so a hundred out of a hundred — and the planet
that depends on it — stays reachable.

New suite **"the retelling: rumours don't lie"**.

## 0.49.0 — "Somebody came for you"

**Reputation finally has a far side.** Until now it only helped — cheaper fuel, more people at the
tables — so hostility cost nothing. Breaking a barge yourself now creates a personal score: a
captain with a name (`G.hunted`, new module `12o-hunter.js`) who works his own sectors and grows
a tier with every fresh deed.

**He comes only for a debt, and only once.** No hostile act, no hunter; he never appears "for
difficulty". Killed, he stays killed — through saves — and his bounty is paid exactly one time,
never again, even if the faction's score against you starts over.

**Recognised in a fight, and his lair has an owner.** He is baked with the flagship silhouette
(12i), so he reads at a glance among ordinary pirates. His home sector's base now carries his
name and his colour from the outside and holds one tier more guard inside — closing the M87 tail
where a lair looked like any other base until you boarded it.

New suite **"the hunter: comes only for a debt"**.

## 0.48.0 — "A planet of your own"

**The full hundred buys what money cannot.** Collecting all 100 rarities (12m) now hands you a
planet — the one you were standing on when the hundredth came in. It is not bought, not chosen
from a list, and nothing is handed out below a hundred: partial progress is already paid for by
the wall at home. New module `12n-planet.js`.

**It is a second growth counter.** The house grows from turnover, the planet from completeness,
and the two funnels never mix: the node produces goods and **never pays credits**. Its stock
accrues lazily by real time up to a ceiling per resource — haul it yourself while you are in the
system, or wait for a barge.

**You stop being a client of the economy and become a node of it.** The barge router (12l) takes
the node as a stop on equal terms with a station: it appears in route legs, and a barge that
passes through carries your goods to you for free — a delivery, not a deal.

New suite **"the planet: full set only"**.

## 0.47.0 — "The monument remembers"

**Monuments answer by type again.** The surface ran its own cut-down inspection and never called
`poiInspect`, so the whole per-kind reward table was dead in the game while the tests, which called
the function directly, stayed green. Walking up to a temple now really hands over a coordinate, an
observatory its prices, a factory its warehouse, the gates their fuel — and the rarity on that
place's address (0.46.0) is finally taken on the ground rather than only in tests.

**And it remembers what it gave.** An inspected monument no longer greets you with a bare
"осмотрено": it shows its own answer where it stands, so a second walk out to it is a decision
rather than a guess. Old saves keep loading — a monument inspected before this version simply has
nothing to recall.

## 0.46.0 — "A hundred rarities"

**Rarities.** A new and hardest layer of finds: a closed table of exactly one hundred rare things.
Each has an address of its own rather than a drop chance. A place either holds a rarity or it
doesn't, and reloading won't budge it: you can't grind one out.

**Where to look.** Only among what already lives: on monuments, under a temple's slabs, deep in a
cave, in a worked-out belt rock, in a baron's lair, in the hold of a sunken barge. What you carry
off accumulates on a board next to the node sets.

**The effect is not money.** Every rarity grants a small property of a thing (radar reaches
further, a roomier hold, a meaner gun), read in the same place as modules and crowns. Not one of
them pays credits: the showcase is not an ATM. The full hundred will open something that cannot be
bought.

**The temple with a known coordinate speaks again.** It used to stay silent if the artifact
coordinate was already known; now it hands over the rarity of its slabs — the M92 tail is closed.

---

## 0.45.0 — "A barge in distress"

**Interception.** Sometimes you find a barge already under pirate fire. Three outcomes, each of
them a deed: drive the pirates off and save her (reputation up, a share of the cargo in thanks, the
captain remembers), pass by, or finish her yourself — the cargo is yours, but the faction will
remember and reputation drops sharply.

**Escort contract.** A peaceful barge will hire you as escort: the advance is paid up front and the
destination goes into the journal. Failure doesn't take credits — it hits reputation. There is no
steady profit here, same as with a hired hand.

**Wreckage.** A sunken barge leaves a wreck in the system — searchable exactly once for a usable
part, like a planet-side "ship wreck". Wrecks survive a restart: they are the trace of your
decision, not scenery.

**A passenger.** Now and then a barge in distress carries a person rather than cargo. Save them and
they surface in the cantina as a hire with a line about that run, and come cheaper than usual. The
only hired hand who comes to you on their own.

**The trade factor has a body now.** The route that used to be a spread on the map and a line in a
domain summary now carries real cargo between the factor's real stations. A barge is a long
workhorse with a container spine, big slow nozzles and a wheelhouse; no weapons. You can approach
one in a system and haggle without docking.

**Trading without docking.** A barge sells its cargo dearer than the destination station and buys
yours cheaper than it does: there is no money in the spread, the gain is time — you don't have to
fly all the way to the station. The captain has a name and a temper (tight-fisted, timid, sturdy)
which drives the discount. A deal nudges reputation, like a small station would.

**On the map, a slow dot** between two stations on a leg of the factor's route: loaded out, empty
back. Barges are ephemeral, like pirates and the belt — they never enter the save.

**Station reputation.** Its own per station, from "you aren't welcome here" to "you're one of ours".
It rises from closed business and lifted blockades, falls from broken promises. It affects fuel,
repair and hiring — the things a person prices, not the market.

**A set's last nodes are only in a baron's lair.** While more than three in a family are still
missing they drop where they always did; the tail is taken where you have to go and get it.

**A node became a thing.** Each of the thousand nodes has a look assembled from its seed: a polygon
body, a detail per family and a finish per rarity — piping, a stamp, chipped patina or a glow from
within.

**Cantina business sat down at the tables** in the drawn room: you poke a table the way you poke a
candidate at the counter.

1214 green.

---

*Entries below are in Russian.*


## 0.36.1 — «Логово, подавленный очаг и яхта, которая что-то значит»

Заход по хвостам, записанным в PLAN за 0.36.0.

**Логово барона.** В занятой системе пиратская база — не просто база: уровень
выше на занятость, отсеки крупнее, охраны больше, а на мостике сидит барон —
втрое живучее обычного главаря, с полосой во всю ширину и подписью. Отдельного
режима под «данж» не понадобилось: абордаж уже умел всё, чего это требует.

**Разбитая база гасит очаг.** Уход из рейда с добычей подавляет очаг: уровень
занятости падает, а наступление в двух секторах вокруг замирает на сутки. До
этого отбивать системы можно было только бесконечно — теперь у фронта есть
корень, который можно вырубить.

**Яхта наконец что-то делает.** Кредитов она по-прежнему не приносит и не
должна: пока яхта в ангаре, наёмники отдыхают на ней между рейсами и мораль
возвращается на четверть быстрее, а с достроенным причалом дома — в полтора
раза. Единственное, что даёт роскошь, — и оно про людей, а не про деньги.

**Противники абордажа перерисованы.** Враг был овалом с кружком-головой —
теперь тело по тем же правилам, что фигуры в кантине и рубке: плечи шире таза,
ноги врозь с разным тоном, обе руки на оружии, шлем с забралом-полосой. У
тяжёлого ствол на сошке, у барона плащ с вырезом, наплечники и гребень.

1088 зелёных.
---

## 0.35.0 — «Рубка вместо списка, маршрут вместо константы»

**ШТАБ стал местом.** Экран управляющих был последним списком строк в игре:
теперь это рубка (`27f-hq-room`) — четыре пульта доменов, у пульта стоит тот,
кто домен держит, экран показывает настоящее состояние домена, пустой домен
виден обесточенным пультом под чехлом. На голо-столе — ваша система: звезда
своего класса и настоящие планеты на своих орбитах.

**Маршрут фактора стал предметом (M84).** Домен приносил `26 × плечи` — число,
не замечавшее рынка. Теперь фактор ищет лучшую пару «где дёшево → где дорого»
среди станций, которые вы ему открыли, и живёт с ОТНОСИТЕЛЬНОЙ маржи: в карточке
домена видно, что он везёт и почём. Он давит собственную цену там, куда возит, —
маршрут перестал быть вечной рентой.

**Экономика пересчитана.**
- прибавки фактора складываются, а не перемножаются: семь перков давали ×3.7 и
  превращали домен в станок (до 1200 кр/мин; стало 130 голым и ~420 прокачанным —
  активная торговля Мамонтом по-прежнему выгоднее);
- точка под дроном меряется деньгами, а не штуками: пул обратен корню цены. Дрон
  на кристаллах возвращал двенадцать своих цен, на железе — полторы; стало x5.6
  против x1.8, и дорогая точка вырабатывается втрое быстрее;
- второй порог дома смягчён (25 000 → 9 000): скачок ×25 был единственным местом,
  где дом надолго замолкал.

1019 зелёных.
---
## 0.34.0 — «Хвосты: комнаты дома заработали, посадка подняла пыль, подбитый пират стал рваным»

Заход по хвостам, записанным в PLAN за три прошлые вехи. Ничего нового не
задумывалось — доделывалось обещанное.

**Дом (M83).** Ступени перестали быть украшением:
- **кабинет** даёт каждому управляющему ещё одно место под стоящий приказ;
- **жилая часть** — мораль наёмников восстанавливается вдвое быстрее: между
  рейсами человек живёт в доме, а не в кабине;
- **витрина** — выставленное редкое сырьё работает репутацией: домены приносят
  до десятой части сверху, и чем богаче витрина, тем больше;
- **мастерская** — переборка части: свойства генерируются заново, но ступенью
  ниже. Это не улучшение, а второй бросок: плохая часть перестаёт быть мусором,
  хорошую перебирать себе дороже;
- поставить корабль в гараж и вынести редкое на витрину теперь можно кнопками, а
  не только из кода.

**Посадка (M81).**
- тяга на посадке направлена вверх, а маршевые движки смотрят назад — поэтому
  из брюха теперь бьют три тормозных сопла. Пока факел шёл из кормы, корабль на
  подходе выглядел разгоняющимся вбок, а не висящим;
- струя поднимает пыль: низкое облако цвета грунта, тем гуще, чем ниже, и оно не
  исчезает мгновенно после касания. На мире без атмосферы пыль ниже и резче;
- на касании нос опускается вместе с просадкой стоек.

**Пираты (M82).** Подбитый корабль печётся ВТОРЫМ силуэтом, а не пятнами поверх
целого: ниже половины корпуса отрывает навесное и выгрызает куски борта с рваной
кромкой. Разбитого теперь видно по форме, а не по полоске здоровья.
---
## 0.33.1 — «Дом стал помещением»

Дом перестал быть строкой в списке. Теперь это комната, нарисованная тем же
языком, что кантина и отсеки базы: тёплая стена, одна лампа с конусом света,
пол — и на нём всё нажитое. Мерило прежнее: хозяин ростом 54 px, верстак ему по
бедро, корабль в гараже вчетверо шире человека.

**Комната растёт слева направо.** Каждая ступень добавляет свой кусок: угол с
матрасом и ящиком → прихожая с дверью и крючками → гараж, где стоит ваш корабль
на подпорках → витрина с редким сырьём за стеклом → мастерская с верстаком и
тисками → кабинет → койки жилой части → окно причала с живым огнём маяка. И сама
картинка ровно такой ширины, какой дом: он растёт — растёт и она.

Ни одной цены на экране нет: внизу полоса и строка «до следующей ступени столько
то оборота». Дом не покупается.
---
## 0.33.0 — «Дом: растёт сам, и смерть больше не обнуление»

**У игрока появился дом, и он не покупается.** Комнаты за деньги сделали бы из
него ещё один магазин; дом растёт САМ от накопленного оборота — от всего, что
вселенная вам принесла: продажи, дроны, домены, рейсы наёмников, награды за
пиратов, выручка баз. Со счёта при этом не списывается ничего.

- **оборот, а не баланс:** потраченные деньги всё равно остаются в том, что у
  вас есть. Ступени: угол (1 000) → прихожая (25 000) → гараж (70 000) →
  витрина (160 000) → мастерская (320 000) → кабинет (600 000) → жилая часть
  (1 100 000) → причал с маяком (2 000 000);
- **дом появляется сам** после первой честной выручки и встаёт там, где вы в
  этот момент были. Он один на всю вселенную, не переезжает и не теряется;
- **смерть перестала быть обнулением.** Потеряв корабль без денег на эвакуацию,
  вы больше не начинаете с пустого «Стрижа» в системе старта: вы возвращаетесь
  домой, поднимаете корабль из гаража, теряете груз и половину денег. Дом и его
  ступени целы;
- маяк домой платный и тем дороже, чем дальше вы забрались; ОТ дома летят своим
  ходом — иначе дом стал бы бесплатным такси по галактике;
- пока экрана-помещения нет, дом видно строкой в разделе ВЛАДЕНИЯ: какие
  комнаты есть и сколько оборота до следующей. Ни одной цены — их у дома нет.

**Внутри:** весь доход в игре теперь идёт одной воронкой `earn()`. Это стережёт
тест: `G.credits+=` осталось ровно в одном месте — внутри самой воронки. Новый
источник дохода мимо неё дом бы не заметил.
---
## 0.32.1 — «Пираты: класс виден с одного взгляда»

Проход по различимости классов — первый раз, когда тяжёлого и флагмана
разглядывали на стенде, а не по коду.

- у налётчика клетки под добычу стали вдвое выше, прутья светлые и частые: они и
  опознают его. Тёмными и низкими они сливались с бортом, и налётчик ничем не
  отличался от перехватчика;
- у тяжёлого таран вынесен вперёд втрое дальше — клин виден раньше корпуса;
- один движок у каждого пирата чадит заметно сильнее прочих: несинхронность
  читается по дыму раньше, чем по факелу.

Стенд по классам: `docs/shots/pirate-classes.png`.
---
## 0.32.0 — «Пираты: сваренный корабль вместо вашего в чужой шапке»

**Пират перестал быть вашим кораблём в другой раскраске.** Он рисовался тем же
`drawHull`: полтора десятка полигонов, аккуратная симметрия, чистые панели, —
и бой выглядел дракой двух иконок. Теперь у пирата свой генератор (`12i`): он
варит корпус из трёх чужих, и это его язык формы.

- шесть-восемь десятков полигонов вместо десятка: тело, хребет из плит внахлёст,
  нос или таран, боковые модули, клетки под добычу, движки;
- **асимметрия — правило, а не шум:** слева пилон, справа бак, на одном борту
  приварена целая чужая секция, и мелочь садится на «обжитый» борт чаще;
- навесное: заплаты внахлёст, шипы, крюки, турели на растяжках, антенны-удочки,
  ржавые потёки от каждого шва, метки сбитых по seed;
- **повреждения видно:** с падением корпуса копятся прогары, ниже половины —
  пробоина с факелом, ниже трети — дымный след. Раньше урон читался только
  полоской над кораблём;
- выхлоп грязный и несинхронный: у каждого сопла своя фаза, кто-то обязательно
  чадит;
- три вольных класса (перехватчик, налётчик, тяжёлый) и флагман ренегата,
  у которого под сваркой лежит ВАШ настоящий корпус.

**Кадр это не удорожает:** каждый пират один раз выпекается в свою офскрин-канву
по seed и дальше рисуется картинкой с поворотом — тот же приём, что кэш неба у
гиганта и тайл материала. Живым слоем поверх остаётся только то, что печь
нельзя: повреждения, чад и факелы.
---
## 0.31.0 — «Посадочный корабль: машина, а не игрушка на палочках»

**У посадки теперь свой силуэт.** На грунте стоял полётный корпус, повёрнутый
носом вверх и сжатый до 38 px длины, — при астронавте в 24 px это был кораблик
ростом с человека на четырёх проволочных опорах. Полётный вид — сверху,
посадочный — сбоку, и поворотом одного в другой не переводится в принципе,
поэтому у посадки появилась своя функция, а не множитель.

- корабль стоит боком, длиной 90–130 px — три с половиной–пять человеческих
  ростов, мерило то же, что в отсеках базы и в крупной форме поверхности;
- шасси на три точки с разносом 0.84 длины: у каждой стойки подкос, цилиндр с
  видимым штоком амортизатора и пята с блином, и каждая пята садится на грунт
  СВОЕЙ координаты, а не на общую линию;
- люк открыт, изнутри свет, из люка сходит трап со ступенями шагом около 10 px —
  по нему масштаб читается быстрее, чем по чему-либо ещё;
- блок двигателей выступает из кормы, сопла после посадки ещё светятся; на корме
  киль, на спине радиатор и развёрнутая антенна, обшивка и ливрея — от того же
  корпуса, на котором летаешь;
- посадка стала движением: шасси раскладывается на подходе, на касании стойки
  проседают тем глубже, чем жёстче пришли, и отдают пружиной. Физика посадки не
  сдвинулась ни на строку.

**Зона «у корабля» больше не константа 48.** Она считается от длины корпуса
(0.75 длины), иначе подсказки про базу, дозаправку и взлёт срабатывали бы
из-под днища. Высадка после посадки — за пределами этой зоны, как и раньше.
---
## 0.30.0 — «Крупная форма: мир виден силуэтом»

**У поздних миров появился средний масштаб.** Масштабов на поверхности было два:
валун (радиус до 22) и достопримечательность (150–900 в высоту, две-четыре на
девять тысяч пути). Между ними — ничего, поэтому тип мира различался цветом и
фактурой грунта, но не формой: с трёх шагов все двенадцать миров были одним
силуэтом. Теперь у четырёх поздних миров свои формы в 40–220 px, ростом от
груди астронавта до пятиэтажки:

- кристаллический — друзы призм и одиночные косые иглы с дисперсией по ребру;
- металлический — сорванные плиты обшивки и обломки ферм;
- руинный — фрагменты стен с кладкой и проёмом, колонны с упавшими барабанами;
- джунглевый — деревья полога с ярусами и лианами, гигантские папоротники.

Формы растут куртинами, обходят зону взлёта и достопримечательности, стоят
только на ровных местах и рисуются той же породой и тем же светом, что грунт
под ними. Смешанный мир принимает формы соседа, но реже собственных.

---
## 0.29.0 — «Двенадцать миров и смеси из них»

**Приборы сверху перестали мигать.** Панель просыпалась на любое изменение
показания, а топливо и скафандр текут непрерывно — поэтому раз в несколько
секунд она вспыхивала и гасла сама по себе. Теперь поводом считается скачок:
удар по корпусу, монета, груз. Плавный расход молчит, тревога по-прежнему
держит панель открытой.

**Четыре новых мира.** Кристаллический (поля граней, звенящая музыка, почти
пустой воздух), джунглевый (тёмный полог, дожди и споры), металлический
(голое ядро без мантии, вакуум, кратеры) и руинный (охра и бетон, ступени
плато, чужие маяки). У каждого своя палитра, небо, рельеф, разрез грунта,
погода, облака, музыка и залежи — как у прежних восьми.

**Смешанные миры.** Обычная планета теперь собирается из двух истинных:
ведущий тип задаёт, чем этот мир является, второй — чем он заражён. «Ледяная,
с вулканами» — это не ледяная в других цветах: смешиваются палитра, тяжесть,
небо, формы рельефа, слои породы, погода, облака, голос музыки и залежи.
Чистый мир стал редкостью — примерно каждый четвёртый, и «настоящая
землеподобная» снова читается как находка.

**Вулканических миров в игре не было вовсе.** Порог горячей зоны стоял на
far<.2, а ближайшая орбита даёт far≈.25 — таблицы, погода и музыка для них
были написаны, а планеты не рождались ни разу. Нашлось проверкой «в шестидесяти
четырёх секторах встретились все типы».


## 0.28.0 — «Кантина стала залом»

**Кантина больше не список.** Теперь это нарисованное помещение: стойка с
подножкой и стаканами, полка с бутылками, лампы с конусами света, окно, пыль
в лучах, посетители на заднем плане и бармен за стойкой. Кандидаты сидят у
стойки — по человеку тыкают, и под сценой открывается его карточка с чертами,
разговором и ценой найма. Повторный тык возвращает в зал.

**Голова сидящего — его настоящий портрет**, уменьшённый: в зале и в списке
сидит один и тот же человек, а не двойник. Комбинезон окрашен цветом домена,
так что роль читается силуэтом раньше подписи.

**Кантина своя на каждой станции.** Торговый узел, комбинат, верфь, научная
станция и аванпост различаются палитрой, вывеской, тем, что видно в окне
(док, литейный цех, стапель с искрами сварки, звёзды с планетой, пыльная
буря), и обстановкой — от ящиков и растения до труб, вентилятора, козлового
крана, доски с инструментом, голограммы и штриховки у аванпоста.

## 0.27.0 — «Ангар, небо и читаемые приборы»

**В ангаре пиратской базы появилось железо.** Было: большой серый зал, где пол,
потолок и дальняя стена сходятся в один тон. Стало: штабеля контейнеров у стен,
фермы от пола до потолка, разбитый катер, бочки, кран-балка и тельфер под
потолком. Всё крупное стоит только у стен — в проходе оно было бы фантомом
(столкновений у обстановки нет) и закрывало бы сам зал.

**Над базой больше не ровная заливка.** Две гряды дальнего рельефа с
параллаксом, пыль у горизонта, мачта связи с проблесковым огнём и — если
площадка построена — её огни на поверхности.

**Приборы кабины считаются от высоты доски.** На широком экране доска
растягивалась, а шрифты оставались 8–18 px: показания приходилось разбирать.
Теперь кегль, радиус радара и шкалы растут вместе с доской.

**Небо гиганта печётся реже:** кэш держит три последние планеты вместо одной,
и возврат к соседнему гиганту больше не стоит четверти секунды.

## 0.26.0 — «В отсеках базы завелась жизнь»

**Каждый из восьми отсеков нарисован заново, изнутри.** Было: в ячейке лежала
пиктограмма — кольцо, четыре кружка, треугольник вместо бура. Стало: реактор
с гермокорпусом во всю высоту помещения, светящейся активной зоной, обручами,
теплоносителем в потолок и пультом, за которым стоит человек; буровая с фермой
на башмаках, мотором с рёбрами и ремнём, шнеком в обсадной колонне и лентой
отвала, по которой едет руда; склад со стеллажами в три яруса, где ящики, бочки
и мешки лежат ровно до уровня настоящего запаса базы; жилой отсек с
двухъярусными койками, спящей вахтой, столом с лампой, шкафчиками, зеленью
и обзорным экраном; плавильня с топкой, ковшом на рельсе, льющимся металлом,
изложницами, стеллажом слитков и баком шлака; площадка с гидравлическим
подъёмником, створками в потолке, кран-балкой и бегущими огнями разметки;
щитовая солнечной фермы с автоматами, стрелочным прибором и батарейной стойкой;
лаборатория с колбами, центрифугой, голограммой и находкой на подставке.

**Всё меряется человеком.** Рост человека в сцене — 24 px, и от него посчитаны
стол, койка, стеллаж и высота реактора: раньше кольцо реактора было по пояс
стоящему рядом астронавту. Люди в отсеках нарисованы телом — комбинезон, ранец,
шлем со стеклом, — а не палочками.

**Приборы показывают правду.** Стрелка на щите ходит по балансу энергии,
заряд батарей — по отдаче, полки склада пустеют вместе с запасом, аварийная
лампа реактора мигает только при нехватке мощности, бур и центрифуга стоят
без энергии.

## 0.25.2 — «База перестала быть таблицей»

**Отсеки больше не коробки.** Было: у каждой ячейки своя рамка с оранжевой
обводкой и подписью, и разрез базы читался таблицей на буром фоне. Стало:
соседние отсеки собираются в одну выработку (полоски породы между ними больше
нет), оборудование стоит прямо в вырубленной пустоте на плите пола со своей
тенью, а имя показывается только у выбранного отсека — сам выбор помечается
уголками, а не рамкой во всю клетку. Заодно нимб реактора стал круглым (у
прямоугольного был виден край), а порода — темнее и глуше: свежие кадры
показывали оливковый цвет там, где должен быть камень.

## 0.25.0 — «Три сцены, до которых не доходили руки»

**Карта галактики стала небом.** Было: шесть десятков одинаковых кружков,
соединённых паутиной линий к двум ближайшим соседям, — структурная формула, а не
ночное небо. Стало: звезда светит, а не лежит кружком (ореол, у ярких —
дифракционные лучи, размер от класса); глубина даётся тьмой — дальний сектор
тусклее, недостижимый гаснет вполовину; радиус прыжка не волосок-окружность,
а освещённая область, и сразу видно, докуда дотягивается рука. Линии остались
только между достижимыми системами. Туманность собственная, с тёмными
пылевыми прожилками, и она едет вместе с сектором. Подпись выбранной системы
переехала в карточку с постоянным местом — под звездой она уезжала под
экранные кнопки на нижнем ряду.

**База в разрезе перестала быть таблицей.** Коричневый прямоугольник, полосатые
ряды и рамка на каждой ячейке, включая пустые, — ровно та ошибка, что была
в шахте до 0.19.0. Теперь порода — материал планеты поверх гуляющих пластов,
темнеющих с глубиной; помещения собираются в один путь и вырезаются тьмой,
грань со светом идёт только по кромке; пустая клетка не рисуется вовсе — там
просто порода, и лишь под курсором проступает «место под застройку». Отсеки
светят на породу вокруг себя, у ствола лифта появились направляющие,
кромка грунта больше не линейка.

**Абордаж получил свет и воздух.** Стены делятся по высоте надвое (низ светлее,
верх уходит в темноту под потолком) — плоские наклейки стали объёмом. Появилась
дымка расстояния, потолочные лампы (единственный до этого источник света жил
только числом в формуле яркости), пыль в луче нашлемного фонаря, тёплое пятно
по курсу и глубокая виньетка.

---

## 0.24.0 — «Гигант перестал быть обоями»

Сбор летучих газов был последней сценой на старой графике, и это было видно:
вертикальный градиент, два десятка полупрозрачных эллипсов вместо облаков и
две пунктирные линейки коридора поверх всего. Ни течения, ни глубины, ни
масштаба — а масштаб здесь и есть содержание сцены.

**Ленты вместо лепёшек.** Небо гиганта печётся один раз на планету в отдельную
текстуру: широтные полосы, продавленные шумом по горизонтали. Искажение области
даёт фестоны, завихрения и вихри само — рисовать овалы не нужно. Два-три
шторма вмешиваются в то же искажение, поэтому полосы вокруг них загибаются.
Лента замыкается в кольцо сшивкой краёв: зеркальное повторение шов убирало, но
разворачивало вихрь бабочкой на пол-экрана.

**Скорость — параллаксом.** Два эшелона одной ленты с разным масштабом и
скоростью плюс штрихи набегающего потока, гуще к низу. Трёх эшелонов не берём:
одинаковая лента, наложенная трижды, усредняется в розовую кашу.

**Коридор сбора стал частью мира:** не две пунктирные линии, а слой более
плотного светящегося газа со взвесью, которую и собирают. От разметки остались
только короткие засечки у краёв кадра.

Плюс гроза в нижних слоях, корабль крупнее в полтора раза и полоса нагрева
ушла из-под угловых панелей.

---

## 0.23.0 — «Меньше кабины, больше космоса»

Кабина из 0.22.0 была честной, но жадной: она забирала треть кадра. Теперь она
вдвое ниже, стойки тоньше, потолок ниже, а с доски убрано всё, что дублировало
другой прибор или само окно.

**Убраны:** два боковых экрана в верхних углах (обстановка и системы),
потолочный экран со столбиками тяги, показания тангажа и крена (они и так
нарисованы лесенкой на стекле), высота над плоскостью пояса, счётчик камней,
подпись дальности радара, лампы «резак» и «орудие». Осталось шесть вещей:
топливо, корпус, скорость, радар, цель и трюм — плюс три лампы, и все три
означают беду.

**Гравитационный якорь перестал быть ловушкой.** В дальнем полёте корабль
застревал на кромке системы: потолок на скорость «прочь» срезал радиальный ход
в ноль, доворот вектора к носу переливал в него поперечный, и через полминуты
корабль стоял намертво с горящим топливом. Любой потолок даёт такую мёртвую
точку. Потолка больше нет — есть тяготение: от нуля на кромке до полутора тяг
за 700 единиц. У кромки двигатель сильнее и висеть можно, дальше сносит домой,
и корабль всегда остаётся телом, которое куда-то летит.

**Корона звезды выталкивает, а не засасывает.** Знак у отталкивания был
перепутан: влетев в звезду, выбраться было нельзя — воронка вчетверо сильнее
двигателя держала до самого взрыва.

---

## 0.22.0 — «Кабина стала местом, а хвост — следом»

Кабина была набором панелей поверх космоса. Теперь это помещение: проём остекления
имеет толщину (наружный и внутренний контур, между ними фаска со светом сверху и тенью
снизу), борта уходят вглубь консолями, по стойкам моргают лампы, на стекле живут блик,
тонировка, отражение доски и царапины. Середина кадра по-прежнему принадлежит миру:
всё, что лежит на стекле, прозрачно.

**Кабина знает, на чём вы летите.** Раскладка берётся от класса корпуса: у буровика и
рудовоза тяжёлый переплёт, поперечная балка, заклёпки, износ и штриховка «не влезай»;
у фрегата — гранёный бронепроём и тактическая зелень; у исследователя тонкая рама и
голограмма над доской; у курьера всё сжато; у лабораторного сплава переплёт
асимметричный и текучий. На раме — табличка с классом и именем корабля.

**Шлейф двигателя стал лентой.** Точки одного сопла соединяются полосой, поэтому на
развороте виден след траектории, а не облако искр. Цвет — от корпуса (ядро добела,
перо в акцент корабля), длина — от паспортной тяги и модуля двигателя: прокачка видна
в полёте.

**Струи ориентации бьют против поворота.** Чтобы нос пошёл влево, носовое сопло
выбрасывает газ вправо, кормовое — влево. Раньше обе струи шли туда же, куда разворот.

**Торможение больше не разворачивает корабль.** Тормозят носовые маневровые, курс
остаётся тем, который держит игрок; тяга торможения за это чуть меньше.

---

## 0.21.0 — «В поясе появился свет»

Пустота в поясе была залита одним цветом, а грани камня освещались вектором, взятым из
головы: чёрный кадр без глубины и без источника света.

**Свет идёт от светила системы.** Оно стоит в начале координат, поэтому проецируется той
же камерой: в кадре виден диск с ореолом, и освещённая сторона камня всегда обращена к
нему. По одному взгляду понятно, где звезда, даже когда она за спиной.

**Три составляющих вместо одной:** свет звезды своего цвета, холодный подсвет от
туманности в тенях и кромочный блик на гранях, стоящих к камере ребром. Блик — подделка,
но именно он отделяет камень от черноты, когда тот повёрнут теневой стороной.

**Фон перестал быть заливкой:** четыре мягких пятна туманности на звёздной сфере и
вертикальный градиент плоскости пояса.

---

## 0.20.0 — «Класс читается силуэтом»

Генератор корпусов делал «просто корабль»: пропорции гуляли от seed, но силуэт ничего не
сообщал. Восемь разных кораблей в системе — и ни по одному не сказать, кто это, пока не
подлетишь и не прочитаешь подпись.

Появился **класс корпуса** — не новая таблица кораблей, а уклон генератора: те же станции
профиля, но свои пропорции, своё число крыльев и гондол, и одна-две узнаваемые приметы.
Рудовоз широк, с почти прямой кормой и контейнерами вдоль бортов; у буровика конический
бур в носу; у фрегата стволы вдоль скулы и утолщённая носовая плита; у яхты лента окон;
у исследователя тарелка на штанге и панели на пилонах; курьер узкий и длинный.

Класс базовых восьми проставлен руками, у остальных выводится из статов. **У пирата
корпус всегда боевой или курьерский** — силуэт врага обязан читаться враждебно до
первого выстрела.

---

## 0.19.0 — «Шахта»

Шахта рисовалась поклеточно: у каждой ячейки своя заливка, кромка и обводка. На экране
это читалось клетчатой скатертью — сетка в тридцать пикселей была видна раньше породы.

**Рисуется пустота, а не порода.** Массив сплошной: пласты во всю ширину кадра, материал
планеты, потемнение с глубиной. Выработка собирается в один путь из пройденных клеток и
вырезается тьмой; грань со светом и тенью рисуется только там, где за ней действительно
порода, — обводка всего пути возвращала ту же сетку, только светящуюся.

**Разрез растянут вчетверо.** В срезе грунта вся стопка пород укладывается в три сотни
пикселей, и в шахте пласты кончались на тридцати метрах: дальше до самого дна шёл один
цвет. Теперь порода сменяется несколько раз за спуск: почва, осадок, порода, руда,
основание.

**Свет как в пещере:** темнота вокруг, фонарь скафандра, пыль в луче. Плюс крепь через
каждые четыре метра ствола (она же даёт масштаб), искры из-под резака, рудное тело
мягким свечением сквозь породу вместо заливки клетки.

---

## 0.18.0 — «Небо, второй заход»

Облака из 0.16.0 были ошибкой, и признать это дешевле, чем крутить параметры. Поле
плотности, натянутое поперёк неба, даёт рваную кромку, но убивает главное: облако
перестаёт быть предметом. У поля нет ни низа, ни верха, ни границ — в кадре это плесень
на стекле, а не небо.

Теперь облако — **тело**. На планету пекётся шесть силуэтов: сумма метаболов, посаженных
на одну линию (отсюда плоский низ на высоте конденсации и купольный верх), поверх —
эрозия шумом в два масштаба, которая не смещает кромку, а съедает её. Свет запечён в тот
же спрайт: нормаль по градиенту плотности, вертикальный подъём светлоты к куполу и
серебряная каёмка со стороны светила. У самого светила облако просвечивает вторым
проходом на сложении.

На небе они расставлены по трём эшелонам с разным масштабом, параллаксом и скоростью,
и их **мало**: ясный день в пустыне — два облака на весь небосвод. Пустота в небе
работает так же, как пустота в рельефе.

Перистые остались отдельным явлением: не тело, а вытянутые ветром волокна льда.

---

## 0.17.0 — «Интерфейс скафандра»

Интерфейс был набором тёмных прямоугольников поверх мира. Стал стеклом шлема.

**Один материал на всё.** Панель приборов, правый борт, меню, журнал, экраны и кнопки
собраны из одних токенов: размытый мир под стеклом, световой волосок по верхней кромке,
мягкая тень под ним, скруглённые углы. Ярких заливок не осталось — акцент делается
свечением, а не цветной плашкой. Сплошная плашка выбранной вкладки заменена свечением
изнутри и волоском по кромке.

**Приборы гаснут.** Панель показаний живёт на 34% прозрачности и проявляется на пару
секунд, когда показание изменилось, и держится открытой, пока идёт тревога. Постоянно
горящая панель перестаёт читаться как сообщение и становится частью рамки экрана.

**Кнопки стали ходить.** У пэдов ободок вынесен отдельным слоем: нажатие собирает свет
в кольцо и слегка сжимает шайбу. У кнопки действия, когда есть что сделать, свет дышит.
Окна выезжают снизу вверх, экраны проявляются.

**Иконки** тонкой линией, все из одного набора: орбита у карты, три полосы у меню,
корпус у корабля, страница у журнала, ползунки у настроек. Значок опознают быстрее слова,
но слово оставлено — оно снимает сомнение.

---

## 0.16.0 — «Небо»

Облака были гроздью радиальных градиентов: каждый сгусток читался наклейкой, все висели
на одной высоте и шли с одной скоростью. Теперь это поле плотности.

**Тайл вместо фигур.** Один раз на планету печётся бесшовное поле `tfbm` 256×256; порог по
плотности даёт кромку, мягкий порог — рыхлый край. Порог берётся квантилью по самому полю,
а не числом: покрытие теперь ровно такое, какое заказано таблицей типа мира, а не лотерея
по seed.

**Свет печётся в тайл.** Плотность сравнивается с плотностью на шаг в сторону светила —
грань, обращённая к звезде, светлеет; ядро облака темнее кромки. Подделка нормали, но в
кадре неотличима.

**Три слоя.** Перистые высоко, мелкие и почти неподвижные; кучевые в середине; рваные
низкие крупные и быстрые — эти приходят только с непогодой, и по небу видно, что портится
погода. У каждого слоя свой параллакс, своя скорость и своё сжатие по вертикали.

В кадре — три заливки паттерном. Ничего покадрово не считается.

---

## 0.15.0 — «Под землёй»

Пещера была двумя силуэтами и темнотой: две тысячи пикселей одинакового коридора и
находка в конце. Теперь ход разбит на залы, и зал виден раньше, чем в него входишь.

**Залы.** Пять-шесть на пещеру, каждый со своим сводом и характером: галерея, натёчный
зал, рудный ход, подземное озеро, кристаллический грот в дальнем конце. Свод в зале
уходит вверх со сглаженным переходом — зазор от этого только шире, застрять по-прежнему
нельзя. Имя зала стоит в строке места и объявляется при входе.

**Натёки.** Сталактиты и сталагмиты растут навстречу и изредка смыкаются колонной,
вдоль свода висят натёчные завесы. Форма детерминирована от координаты, поэтому не
дрожит при движении камеры.

**Светящиеся жилы** идут внутри породы — выше кромки свода и ниже кромки пола, — и
рисуются двумя проходами: широкий тусклый это свет вокруг жилы, узкий яркий сама жила.
Пульсируют врозь.

**Подземное озеро.** Уровень берётся от среднего пола по залу, поэтому вода заливает
впадины и оставляет гребни сушей. По воде идут медленнее, с всплеском и звуком.

**Кристаллы** в гроте — две грани на иглу, светлая и тёмная, и одно свечение на куст.

**Глубина и свет.** Дальняя стена на скорости .62 со своим профилем и своими дальними
зубцами; темнота как радиальная маска вокруг игрока; фонарь скафандра из трёх слоёв;
пыль в луче; капли, падающие со сводов, со звуком и кругом на полу.

---

## 0.14.0 — «Место, а не набор фигур»

Графика переписана без смены движка: тот же canvas 2D, ни одного внешнего файла, игра
по-прежнему открывается двойным кликом. Менялось не «сколько объектов», а из чего сделана
картинка.

**Точки интереса.** На планете 2–4 крупные вещи от её seed: остов мегакорабля с живым
маяком, ступенчатый храм, космический лифт, кристаллический лес, кольцевой ускоритель,
гравитационная аномалия, монолит, заброшенный завод, врата, обсерватория. Между ними
рельеф сознательно пуст — без пустоты находка не находка. В поясе то же: остов,
добычной комплекс, обломок станции, друза, гигантский астероид с устьем.

**Материал вместо заливки.** У планеты свой бесшовный тайл 256×256, посчитанный один раз
при заходе: макро-поля породы, осадочные потёки, волосяные трещины, минеральные жилы,
зерно. Второй проход тем же тайлом крупнее убивает видимую сетку. Та же порода идёт на
валуны, в шахту и в пещеру.

**Геология.** Стопка слоёв от почвы до основания, своя у каждого типа мира и своя по
толщинам у каждого seed. Слои идут по рельефу со своим шумом на границу. Шахта берёт
цвет забоя из того же разреза и называет породу в строке.

**Свет и воздух.** Направленный свет звезды своего цвета, цветной подсвет от неба в тенях
(сила — от плотности атмосферы), воздушная перспектива вместо прозрачности, дымка в
низинах, лучи от звезды, виньетка и цветовой сдвиг в конце кадра.

**Небо.** Композиция от seed планеты с бюджетом громкости: один громкий объект (газовый
гигант с кольцами, соседний мир с материками и шапками, галактика, чёрная дыра, сияние)
и два-три тихих. У 38% планет громкого нет вовсе.

**Система.** Три системы из десяти получают особое светило — двойную, красного гиганта,
белого карлика, нейтронную; одна из ста — чёрную дыру. Своя туманность с волокнами, свой
слой пыли. Экзотика меняет только вид: вся арифметика по-прежнему от `sys.cls`.

**Полёт.** Камера отстаёт тем сильнее, чем быстрее летим, и прыгает разом на гиперпрыжке;
сопло светит, за соплом дрожит воздух.

**Жизнь.** Пять форм растений, узнаваемых силуэтом (гриб, спираль, зонтик, шар на привязи,
ленты), и пять чужих архетипов зверья (медуза, шестиногий ходун, кристаллическое насекомое,
манта, панцирный). У планеты сильный уклон в две-три формы: если на каждой растёт весь
каталог, планеты снова сливаются.

**Камера на поверхности.** Инерция, взгляд вперёд, дыхание, тряска от удара. Ветер один на
кадр — трава, пыль и растения качаются в одну сторону.

**Станции собираются из модулей.** Тип по-прежнему задаёт ядро и услуги, а сверху висят
три-шесть модулей от seed системы: грузовой терминал, жилой сектор с окнами, кантина,
ремонтный док, топливные баки, лаборатория, медотсек, таможня, чёрный рынок, изолятор,
оранжерея, узел связи, верхний ярус. Тёмное чаще на окраине, верхний ярус — у обжитых
систем. Модули названы строкой в терминале: снаружи видно силуэты, внутри читается список.
Услуг они не открывают — иначе станция обещала бы снаружи больше, чем внутри есть.

**Станция вынесена из короны звезды.** Стояла на радиусе светила +240..520 — внутри орбиты
первой планеты, а у красного гиганта прямо в свечении. Теперь между первой и второй
планетой и не ближе шести радиусов светила.

### Что нашлось по ходу

- Цикл склоновых полос делал `beginPath`, и `clip` для пластов с обводкой кромки
  применялись к последней шестипиксельной полоске: **пласты породы не рисовались вообще**.
  Силуэт переведён на `Path2D`.
- Звёзды рисовались после небесных тел и просвечивали сквозь диск гиганта.
- Параллакс неба считался от нуля — к середине планеты композиция уезжала за кромку.
- Вместе с живой камерой сломался тычок «идти сюда»: пересчёт шёл по старой формуле.
  Теперь камера кадра — единственный источник правды и для отрисовки, и для ввода.

### Проверено

Автотесты: 507 зелёных, без изменений — правки визуальные, механика не двигалась.
Кадр поверхности со всеми слоями — 0.93 мс. Прогнаны поверхность, посадка, пещера, шахта,
система, пояс на планетах всех типов; консоль чистая.

---

## 0.13.0 — «Всё дерево целиком»

Подключены последние 16 перков. **Ни одной подписи без кода в дереве больше нет**,
и это теперь стережёт отдельный автотест, который перебирает всё дерево и требует,
чтобы каждый `id` кто-то читал.

### Исправлено — и это главное

**Базы не работали вообще.** `baseTick` читал константу `CREW_OFFLINE_CAP`,
которой **не существовало ни в одном файле**. Каждый тик базы после первого падал
с `ReferenceError`, а вместе с ним падал и вход в базу: заложить её было можно,
войти внутрь — нет. Сломано с той самой вехи, где базы появились. Теперь константа
объявлена там, где ей место (потолок «ленивого времени», общий для наёмников и баз),
а вход в базу и второй тик — под тестом.

### Смотритель

Ветка **«Энергия»** была мертва целиком, хотя энергобаланс — центральная механика базы:

- **«переброс»** — при нехватке половина необязательной нагрузки сбрасывается, и
  мощность достаётся тому, ради чего база стоит: буру и лаборатории;
- **«стабилизация»** — реактор держит нижний порог 0.35 и не глохнет совсем;
- **«буревой щит»** — и для него в игру добавлена **буря**: угроза месту, а не людям.
  Налёт отбивает охрана, бурю — нет; она бьёт по тому, что стоит наверху, и сила её
  зависит от мира (пустыня и токсичный дуют вдвое сильнее земного, газовому гиганту
  всё равно). Щит отменяет её полностью;
- **«излишки»** — лишняя мощность продаётся станции: редкий случай, когда лишний
  реактор осмысленно ставить нарочно.

Из «Стройки» и «Логистики»: **«второй ярус»** вскрывает базе пятый ряд (и ряд
остаётся у неё навсегда — расчёт со смотрителем не должен стирать построенное),
**«очередь»** доводит начатое до конца без инженера, **«плавильня»** переплавляет
вдвое быстрее и не проседает вместе с энергией, **«авто-сбыт»** ускоряет оборот дрона.

### Фактор

**«монополия»** — на плечах маршрута цена держится выше: единственный перк, который
игрок чувствует собственным кошельком, а не строчкой в сводке. **«сводка»** показывает
лучшую цену по каждому плечу, не выходя из системы. **«пороги»** открывают два
стоящих приказа, которых иначе нет в списке вовсе, — перк расширяет не силу, а
словарь того, что домену можно поручить. **«обновление»** перебирает ассортимент
станций втрое чаще. **«чёрный список»** кладёт на станцию отдельную вещь высокого
класса с пометкой «по связям фактора».

### Командир

**«трофейщик»** — звено чаще возвращается с чужим добром (тот самый хвост таблицы,
ради которого наёмник и держится). **«переговорщик»** — выкуп за пленного вдвое
дешевле, и видно это заранее, а не при выплате. **«охота»** — пиратские базы соседних
секторов помечены на карте пятиугольником; без перка их находят только прилетев.

### Проверено

Автотесты: 507 зелёных (было 476). Шесть новых наборов, включая тот самый обход
всего дерева. Каждый из 16 перков проверен и поведением: эффективность энергии
до и после, бури с щитом и без, цены на плече, состав списка приказов, состав
ассортимента, цена выкупа.

---

## 0.12.0 — «Лаборатория, артефакты и перки, которые наконец работают»

Закрыт последний невыполненный шаг порядка реализации из
[`DESIGN-managers.md`](DESIGN-managers.md) (§14.7). Заодно проверка дерева перков
вскрыла то, чего никто не заказывал: **24 перка из 48 не были подключены ни к чему**.
Игрок тратил на них очки уровня, и не происходило ничего. Половина обещанного
в §1 «видимого роста» была декорацией.

### Добавлено

**Лаборатория — здание, а не фигура речи.** До этого исследователь разбирал образцы
«в воздухе»: роль была, домена не было. Теперь лаборатория — постройка на базе:
3200 кр и 12 сплавов, −16 энергии, заперта новой наукой «Лаборатория», и **мертва
без жилого отсека по соседству** — разбирать образцы вахтой из скафандра нельзя.
Без лаборатории исследователь не бездельничает, но идёт втрое медленнее и без
чертежей, и сам об этом говорит.

**Семь артефактов (§12).** Единственные вещи в игре с глобальным эффектом:
«Печать конвоя», «Счётная кость», «Карта чужой руки», «Пустой контракт»,
«Ключ от верфи», «Чёрный журнал», «Тихий маяк». Слот один на управляющего,
поэтому семь находок за прохождение — это всегда выбор, кому дать и что оставить
лежать. **Вторая строка эффекта открывается только при исследователе с перком
«чтение»** — и в интерфейсе видно, что она есть и заперта, иначе половина
артефакта была бы невидимой.

Артефакты не покупаются. Они лежат в пластах глубже 42 м, достаются трофеем
с разбитого ренегата и собираются в лаборатории из двух других («синтез»).
Слот появляется с новой наукой «Ксеноархив».

**Перк «происхождение»** ставит на карту пунктирную метку СЛЕД АРТЕФАКТА: в этом
секторе шанс находки в шахте удваивается. Без метки указание было бы некуда
положить.

### Оживлено

Восемь перков, которые до этого были подписями без кода:

- **«чутьё»** — показывает вилку скрытой удачи наёмника, **«точный счёт»** — число.
  Это и есть обещанный в замысле «самый важный перк в игре»: он превращает
  непознаваемый шум в информацию, и стоит не кредитов, а уровней.
- **«биология»** — отсканированные твари и растения идут в лабораторию образцами;
  разведка перестала быть только строчкой в счётчике видов.
- **«допуск»** — верный чертёж на 15% сильнее (усиливается прибавка, а не
  множитель целиком: иначе +20% превратились бы в +38%).
- **«пересборка»** — перепроверка ошибочного чертежа вдвое дешевле.
- **«чтение»**, **«происхождение»**, **«синтез»** — вся ветка «Ксенология»
  ожила вместе с артефактами.

### Исправлено

- **Смета смотрителя не работала при стройке.** Скидка считалась в `baseCost`
  и показывалась в интерфейсе, а списывалась полная цена из таблицы.
- **Надетый артефакт, поднятая ультиматумом доля и счётчик ультиматумов
  терялись при загрузке.** Список полей управляющего в `applySave` белый, и новое
  поле надо вносить в него руками — три не внесли. Теперь стережётся тестом.

### Проверено

Автотесты: 476 зелёных (было 436). Пять новых наборов: лаборатория и её
зависимость от жилого отсека, слот артефакта и глобальность эффекта, первые
строки «Счётной кости» и «Тихого маяка», оживлённые перки, сохранение находок
вместе с регрессией на потерянные поля.

### Что осталось

Дерево перков всё ещё содержит **16 неподключённых из 48**: у командира —
ветка «Трофеи» (трофейщик, переговорщик, охота), у фактора — пять в трёх ветвях,
у смотрителя — вся ветка «Энергия» и половина «Стройки». Это следующая работа.

---

## 0.11.0 — «Интерфейс собран заново»

Функций в игре накопилось на четыре экрана, а интерфейс остался тем, что был при
одном. Правый борт зарос девятью кнопками, станция — десятью вкладками в один ряд,
подписи не говорили, что произойдёт. Пересобрано целиком, от заставки до пэдов.

### Три правила, по которым всё переделано

1. **Иерархия — размером и цветом, а не капслоком.** Раньше капслоком с разрядкой
   было набрано всё подряд, и поэтому не выделялось ничто. Теперь так набраны только
   подписи — то, что опознают; то, что читают, набрано обычным текстом.
2. **Во что тыкают пальцем — не меньше 44 px.** Кнопки правого борта были 27 px:
   по ним промахиваешься на ходу. Теперь порог держится автотестом.
3. **Поверх мира — только нужное сейчас.** Постоянно висят приборы, две кнопки
   и масштаб. Остальное живёт в меню или приходит, когда для него есть повод.

### Полёт

- **Приборы показывают числа**, а не только полоски: `34/100` отвечает на вопрос
  «дотяну ли до станции», а «полоска чуть больше половины» — нет. Две ступени
  тревоги: мало — подсвечивается, вот-вот — мигает, потому что в бою на приборы
  смотреть некогда, а движение ловится боковым зрением.
- **Справа вверху — где мы и с чем**: система, корабль, сектор и кошелёк одной
  строкой. Кредиты больше не дублируются в двух местах.
- **Правый борт: две кнопки вместо девяти.** КАРТА и МЕНЮ; за МЕНЮ — КОРАБЛЬ,
  ЭКИПАЖ, ШТАБ, ЖУРНАЛ, НАСТРОЙКИ, каждая со второй строкой о том, что внутри.
  Контекстные (К ЗВЕЗДЕ, ДРОН, МАЯК) по-прежнему приходят и уходят сами, но
  отдельной группой и в цвет действия. Масштаб стал парой кнопок, а не двумя
  случайными. Ящик закрывается тапом мимо и любым выбором внутри.
- **Кнопка называет действие, а не себя.** Вместо вечного «ДЕЙСТВ» — СТЫКОВКА,
  ПОСАДКА, АБОРДАЖ, РЕЗАК, ВХОД. Глагол берётся из самой подсказки, чтобы не
  завести второй источник правды. Когда делать нечего, кнопка не светится.
- Подписи договорены до конца: ДЕЙСТВ → ДЕЙСТВИЕ, ТОРМ → ТОРМОЗ, ПРЫЖ → ПРЫЖОК —
  везде, включая подсказки во всех режимах.
- Масштаб больше не печатается под левым пэдом, где его закрывал руль.

### Экраны

- **Станция: раздел, потом вкладка.** Десять вкладок в один ряд сжимались до
  полусотни пикселей и обрезали подписи. Теперь сверху ТОРГОВЛЯ · КОРАБЛЬ · НАУКА ·
  ЛЮДИ · ВЛАДЕНИЯ, под ними — вкладки только этого раздела; где вкладка одна,
  второй ступени нет. Мёртвые разделы на станции не показываются вовсе.
- **Фон экранов стал непрозрачным.** Сквозь прежние 96% просвечивали кнопки
  правого борта, и это читалось как брак. Заодно приборы и пэды прячутся, пока
  открыт любой экран.
- Общий каркас для всех пяти экранов: шапка с названием и кошельком, навигация,
  тело, подвал с действиями. Строки списков стали выше и разборчивее, цена —
  крупная и с табличными цифрами, а хвост из кнопок переносится на вторую строку
  вместо того, чтобы уезжать за правый край на узком телефоне.
- **Заставка**: титул, три двери и всё. Таблица клавиш была первым, что видит
  игрок, и первым же, чего он не читает, — теперь она за кнопкой УПРАВЛЕНИЕ
  и разбита на «полёт» и «пояс».

### Проверено

Автотесты: 436 зелёных (было 416). Четыре новых набора стерегут именно то, что
сломалось в прошлый раз: порог 44 px, отсутствие наложений и выездов за экран,
подпись кнопки действия по подсказке, разделы станции. Разметка проверена на
320, 375 и 531 px: ни одного наложения, ни одного выезда за край, ни одной кнопки
меньше порога. Консоль чистая.

Основано на общих практиках игровых интерфейсов: Z-образное чтение (жизнь корабля
слева вверху, место и деньги справа вверху, подсказка внизу по центру), минимум
постоянных элементов, крупные цели в зоне большого пальца.

---

## 0.10.0 — «Он ушёл не в пустоту»

Закрыт шестой пункт порядка реализации из [`DESIGN-managers.md`](DESIGN-managers.md):
лояльность доведена до конца. До этого управляющий на нуле просто исчезал вместе с
записью о корабле — самая драматичная развилка системы срабатывала в одну строку журнала.

### Добавлено

**Утечка домена ниже пятидесяти.** Любой управляющий, а не только «свои интересы»,
начинает «терять» проценты домена в свою пользу — до 5% на нулевой лояльности. Числом
это нигде не показано: заметно только по сверке в сводке домена, где утечка идёт
отдельной строкой «сверх того „потерялось“».

**Ультиматум ниже двадцати пяти.** Он перестаёт просить и приходит с условием. Это та же
сцена с выбором, что и поручения, только приходит не по желанию, а по цифре, и у неё
есть срок: двенадцать минут, после которых молчание засчитывается за отказ. Три выхода —
поднять долю на три пункта навсегда, откупиться (цена считается от него самого: расчёт
×1.3 плюс надбавка за уровень) или отказать. Отказ — немедленный уход. Больше двух раз
он не приходит.

**Ренегат.** На нуле лояльности он уходит **в мир**, а не из игры: забирает флагман,
уводит до 60% звена (командир — своих, остальные — никого) и садится в соседнем секторе.
На карте его сектор помечен фиолетовым кольцом с подписью РЕНЕГАТ — иначе до него
не долететь. Прилетите — он выйдет навстречу на вашем же корпусе, с корпусной прочностью
и уроном, посчитанными от его уровня и **его перков**: тех, которым вы его научили.
Уведённые наёмники летят с ним и подписаны поимённо.

**Изгнанник.** Разбить ренегата — не убить: корпус возвращается в ангар, его трюм
достаётся вам, а сам он выживает и появляется в кантине **любой** станции первым в списке.
Стоит треть обычного, приходит с уже выученными перками (вы за них однажды заплатили)
и с лояльностью 28 — он помнит, чем кончилось в прошлый раз.

Одновременно в мире держатся не больше трёх ренегатов и трёх изгнанников. Всё это
переживает сохранение; битая запись с несуществующей ролью отбрасывается при загрузке.

### Исправлено

- Кредиты копили дробный хвост (`295577.36579999997`): жалованье считается от дробных
  минут и не округлялось. Теперь округляется при списании, а на карте сумма ещё и
  форматируется как везде.
- Расхождение ИИ-ядра тоже получило метку на карте — раньше сектор назывался только
  в тексте сообщения, и найти его было нечем.

### Проверено

Автотесты: 416 зелёных (было 375). Четыре новых набора — ультиматум и утечка, уход
с флагманом и людьми плюс встреча в бою, возвращение изгнанника, сохранение ушедших.
Отдельно прогнан весь путь под настоящим тиком: лояльность падает без жалованья →
ультиматум → ноль → ренегат в секторе 5:0. Консоль чистая.

---

## 0.9.0 — «Автопилот больше не таранит планеты»

Первый нумерованный выпуск. Ниже — что исправлено в этом заходе, а следом сводка того,
что накопилось в игре к этому моменту.

### Исправлено

**Корабль застревал у планеты и мелко дрожал.**
Автопилот тормозил по линейному закону: разрешённая скорость подхода падала вдвое медленнее,
чем корабль вообще способен гасить ход. К телу он подлетал на полном ходу, проваливался
внутрь и захватывал орбиту **под поверхностью планеты** — корабль пропадал из виду, повисал
на крошечном радиусе и трясся вместе со всей картинкой. На выборке из 146 подлётов это
случалось в 19% случаев. Теперь скорость подхода считается по тормозному пути
(`√(2·a·расстояние)`), а радиус захвата не может оказаться ближе поверхности:
внутри тела орбита не берётся ни при каких условиях. Подлёт стал на пару секунд длиннее —
это и есть честное торможение.

**Гравитационный якорь запирал корабль наглухо и тряс экран.**
За кромкой системы к звезде тянуло с ускорением `.09` — сильнее, чем даёт двигатель (`.082`).
Полный газ «наружу» не двигал корабль вообще: он вставал колом и каждый кадр дёргался
туда-сюда, а поскольку камера жёстко привязана к кораблю, дрожал весь звёздный фон.
Второй, ещё более жёсткий якорь на 5200 единиц вдобавок **обрывал кадр досрочно** — вместе
с ним пропадали подсказки, стыковка, посадка и вход в пояс. Теперь якорь — не встречная тяга,
а предел на скорость ухода: она плавно сходит к нулю на семисот единицах за кромкой.
Корабль спокойно останавливается у стены, курс к звезде и вдоль края остаётся полностью
свободным, управление не теряется, а дрожать нечему.

**Предупреждение о кромке системы било очередью.**
Интервал был задан в 6 игровых тактов, а такт — это кадр: одно и то же сообщение
всплывало десяток раз в секунду. Теперь раз в ~15 секунд, и текст говорит по делу —
дальше не уйти, назад свободно.

**Автопилот к звезде промахивался мимо своей же точки парковки.**
Тормозил там же, где и везде, поэтому вместо расчётных `радиус+220` останавливался
в паре десятков единиц от зоны перегрева корпуса. Общий тормозной профиль это чинит:
теперь корабль встаёт там, где обещал.

### Проверено

Автотесты: 375 зелёных (было 368). Добавлены два набора — «автопилот подходит снаружи тела,
а не сквозь него» и «гравитационный якорь: стена, а не тряска»; второй считает смены знака
радиального хода у кромки и требует ровно ноль.

Прогнаны все режимы (система, карта, посадка, поверхность, пещера, шахта, пояс, атмосферный
сбор, база, абордаж) — исключений в обновлении и отрисовке нет, консоль чистая.
Автопилот прогнан по 366 целям в 16 системах — все доходят, ни одного промаха мимо парковки.

### Что было накоплено к 0.9.0

- **Космос и полёт**: процедурная галактика, эллиптические орбиты по Кеплеру, замедленная
  небесная механика, автопилот с упреждением, захват орбиты, шлейф двигателей, гравитационный
  якорь на краю системы.
- **Планеты**: посадка ручная и автоматическая, поверхность с флорой и фауной, пещеры, шахта
  с бурением вглубь, атмосферный сбор летучих газов у газовых гигантов.
- **Пояс астероидов**: полёт с шестью степенями свободы, резак, руда.
- **Станции**: шесть типов торговли — где стыкуешься, то и можешь; живой рынок, дроны,
  экран корабля со слотами частей, наука и модули, лаборатория сплава корпусов.
- **Пираты**: бой в системе, преследование, пиратские базы в опасных секторах и абордаж —
  полигональные интерьеры с ярусами.
- **Наёмники**: найм, приказы, рейсы, таблица событий, плен и выкуп, жалованье и долг.
  По кредитам наёмник убыточен намеренно — это ставка, а не источник дохода.
- **Управляющие**: четыре домена и всегда четыре места, доля вместо оклада, черты, перки,
  лояльность, процедурные портреты, стоящие поручения, ИИ-ядро вместо человека.
- **Базы**: закладка на планете, вид в разрезе, энергобаланс, сеть баз, персонал, налёты
  пиратов на склад.
- **Редкие ресурсы**, которые тратятся, а не продаются, каждый со своим применением.
- Генеративная музыка и синтезированный звук, журнал, автосохранение.
