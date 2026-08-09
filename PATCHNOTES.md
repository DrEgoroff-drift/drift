# Drift — patch notes

The game version is shown on the title screen. It has nothing to do with the save format
(`v:4`): records written by earlier versions keep loading.

Entries from 0.45.0 onward are written in English (docs are English, the game stays Russian);
older entries below are left as they were written — translating history would cost more than it
could ever save.

---

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
