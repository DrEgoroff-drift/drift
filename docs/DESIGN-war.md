# Combat, weapons, powers and war — design note

Design note, 2026-09-06, from the author's session in chat the same day. Nothing here is built;
the queue is M360–M375 in `PLAN.md`. English like the rest of `docs/`; game text stays Russian.
The author's brief, in order, in his own words:

> «боевка с пиратскими короблями прям дерьмо»
> «управление очень говно для боя, для летать и исследовать норм»
> «тап по кораблю, оно в прицеле, стреляет само + пушки как раз под это и надо менять. и стик
> слева… стик отпустил, оно тормозит… второй стик справа, типо газ тормоз и в разные бока»
> «по клаве, мышка либо стрелочки»
> «пушек навалим… процент промаха, дальность скорость наводки… рельсотрон… лазер который жжет,
> слоты под пушки, навали полный фарш»
> «самонаводящиеся ракеты… лутать, размещать в корабле, сравнивать, и они все процедурные»
> «надо продумать щиты все такое, энергию. Не хочется конечно стар сектор»
> «у нас фишка что в реальности встретил пирата разъебал»
> «ещё штук 5 таких же со своим флотом, со своим дизайном государств. Они рандомно там воюют…
> Прилетаешь в систему там пизделово»
> «я нейтрал, обычно не трогают… не хочу тупую репутацию, это шлак… типо тут помог, типо
> познакомился с кем то. Если ровный пацан все уважают»
> «новости типо настраиваешься на другую волну там пиздят что у них все норм, прям как политика
> и пропаганда»
> «главтрасса русские, я бы сказал СССР… прям читаться стеб должен над всеми»
> «Про книгу не забывай надо в неё тоже вписать всё это»

What was found in the code before designing (2026-09-06): every pirate is one bot
(`13-pirates`: turn to you, thrust to 260 px, fire every 70–130 frames; ranks scale only hull and
bounty); the gun is one number pair on the whole ship (`08-state` `dmg`/`cool`), fires along the
nose, projectile straight; the helm has angular inertia (`17-mode-system`: `av` accelerates and
coasts), thrust only forward, brake only decelerates, the velocity vector drifts toward the nose;
on the phone the right thumb owns ОГОНЬ, РАКЕТА, ТОРМОЗ, ДЕЙСТВИЕ and ▲ in one row
(`index.html` `.pads`), so thrust and fire cannot be held at once. Parts are already procedural
from a seed with tier and affixes (`05-parts`, `PART_GEN`), the hull already has gun points on
the wings, `shield` and `missile` are already parts, ГЛАВТРАССА's fleet already has classes, a
paint conveyor, callsigns, norms, escort and a rescuer (`12ai-fleet`), pirates already take systems
(`13b-occupy`), news, rumours and the beacon already exist (`12p-news`, `12ah-holdnews`,
`12pa-beacon`), the parrot already witnesses (`12x-parrot`), deeds already count.

---

## 0. Laws that hold the whole layer

1. **One sky.** There is no separate battle screen. Whoever is in the system is met in the
   system, with the same camera, the same helm and the same shots. (Author: «фишка что в реальности
   встретил пирата разъебал».)
2. **No numbers as feelings.** No reputation scale, no faction meter. What a power thinks of you
   is a list of *episodes* with people's names, and what has *travelled* to the place you are.
3. **Deterministic from what everyone shares** (restated 2026-09-06, §17 D20): the war is a
   function of the seed, the сводка number, the ведомости and the циркуляры — all of them the
   same for every client. Two players at the same hour with the same ведомости see the same war
   byte for byte. The player's effect goes through the ведомость (§7.5), never through the save.
4. **Not Starsector.** One energy bar, no venting, no overload, no fleet of your own, no capture,
   no tactical map. A ship, a sky, an encounter.
5. **The satire is even.** Every power is mocked by the same three questions (§7.3), ГЛАВТРАССА
   included; it is the USSR and gets the USSR's jokes.
6. **Phone first.** Every scheme is designed for two thumbs and then given to the mouse — not the
   other way round. Frame budget: at most eight armed ships in a system at once.

---

## 1. Helm — the same model on three inputs

The ship gets four channels instead of two: **heading**, **thrust** (a vector, not a button),
**lock**, **fire**. All three inputs write the same four channels; nothing below the input layer
knows which device wrote them. The old `keys.thrust`/`keys.brake`/`keys.left`/`keys.right` chain
(a dozen files) is translated into the same channels in one place, so the belt, landing, scoop,
grove and surface keep working untouched.

**Angular inertia goes.** `sh.av` follows the requested heading at the rate the stats give
(`st.turn`), with no ramp and no coast; the bank and the arc stay as *drawing*. This is the
single change that fixes aiming on every input, and it also removes the «странное» the author
feels in plain flight.

**Thrust vector.** Full power along the nose (main engine); 40 % sideways and backward
(maneuvering thrusters, `st.thr*.4`), both burning fuel at today's rates. While thrusters are
used the velocity-to-nose drift of `17-mode-system` is *off* — strafing must not be pulled back
under the nose. **Release = brake** below cruise speed (`maxSp*.55`): thrusters null the velocity
as ТОРМОЗ does today, same fuel. Above cruise, release = coast, so a long crossing is still free;
the threshold is one constant and the author may set it to zero after play.

**Lock.** A tap/click on a ship within 40 px (screen) locks it; on empty sky clears. Tab (or the
lock pad) locks the nearest *aware* hostile, again cycles. Up to three marks (`G.marks`); the
first is primary. If nothing is locked and you are being shot at, the shooter auto-locks — on the
phone a third finger does not exist. Autopilot and orbit drop on any thrust or heading input, as
they drop on any key today.

**Fire.** Guns fire on their own when the primary mark is inside their cone and range (§2).
A held fire input forces fire along the nose/cursor when nothing is locked (barges, batteries,
debris). Missile = its own input, goes to the primary mark.

### 1.1 Phone — two floating sticks

- **Left stick = heading.** Appears where the thumb lands on the left half; the thumb's angle
  from the stick centre is the wanted nose; dead zone 12 px; fades on release (Game Developer's
  twin-stick guide: the stick under the thumb, never a fixed pad the thumb has to find).
- **Right stick = thrust vector in screen axes.** Push up, the ship goes up the screen, whatever
  the nose does. Power by angle to the nose (§1). Release = brake/coast rule.
- With a mark locked the nose tracks the mark by itself inside the guns' cone, so combat is
  played with the right thumb alone; the left only re-aims or picks the next mark.
- Pads that stay in the system mode: ДЕЙСТВИЕ, ВЗЛЁТ, РАКЕТА, and a small ЦЕЛЬ (Tab). Gone from
  the system mode: ◀ ▶ ▲ ТОРМОЗ ОГОНЬ. Surface, dig, cave, belt keep their rows as they are.

### 1.2 Keyboard — mouse or arrows, both live, last used wins

- **Mouse.** Nose to cursor (`st.turn`-limited; cursor far = full rate, near = fine). WASD thrust
  in screen axes. Click = lock, Tab = nearest, Esc = clear. LMB held = forced fire when nothing is
  locked. RMB = missile. Shift held = every thrust through thrusters (slide without turning: dock
  approach, broadside). 1–3 = gun groups (§3.3).
- **Arrows.** Everything relative to the nose because there is no cursor. ← → turn (no inertia),
  ↑ thrust along the nose, ↓ reverse on thrusters, **Q/E strafe** — the only two new keys. Tab /
  Esc lock, Space forced fire, G missile as today.

Both give the same four channels; the arrows lean toward turrets and lock, the mouse toward
hardpoints and leading the nose. That asymmetry is fine (Endless Sky has the same).

---

## 2. A gun is a thing with seven numbers

Every gun shows all seven on its card; nothing is hidden:

| number | what it does |
|---|---|
| **урон** + **тип** | kinetic: full to hull, ½ to shield · energy: the reverse · blast: equal, splash |
| **скорострельность** | as today |
| **дальность** | the shot dies past it |
| **скорость снаряда** | lead is computed honestly; a slow shot misses a fast target; beams are instant |
| **конус** | degrees either side of the mount's rest direction inside which the barrel may aim |
| **скорость наводки** | the barrel inside the cone leads the mark at this rate, not instantly (author: «можно носом вертеть и она не наводится») |
| **разброс** | miss chance = spread × f(range) × f(target angular velocity) |

Plus the ship-wide budget, **энергия** (§4). A shot costs energy; an empty bar halves rate.

### 2.1 Twenty families (five roles)

Role · family · size · mount · one line of feel.

**Break hull.** 1 **Автопушка** L, turret — пум-пум-пум, cheap, wide cone, quick lead, small
damage, visible spread; the starter and the jackal's gun. 2 **Тяжёлое орудийное** M, hardpoint —
rare, heavy, narrow cone, slow lead. 3 **Рельсотрон** H, hardpoint — instant hit, longest range,
slowest lead, visible charge, half the reactor per shot, *pierces* to the next ship if the first
dies. 4 **Дробовик** M, turret — seven pellets, short range, huge spread, ruinous at contact.
5 **Кассетник** H — a heavy shell splits into five halfway; never hits a point, always hits a
pack. 6 **Таран** H, nose slot only — not a gun: triples the forward hull and turns a collision
into damage by mass × speed.

**Cut shield.** 7 **Игольник** L, turret — a hundred needles a second, each with a chance to pass
the shield; useless against bare hull. 8 **Сифон** M — a beam that takes the mark's shield into
yours; no damage; while held you are unhurt and it is naked. 9 **Импульсник** L — almost no
damage; drops the mark's shield for 2 s and may knock its engine or a gun (the reverse of
`instrKnock`). 10 **Буровой луч** M — the mining drill turned outward: ignores shield, five hulls
of range, eats drill resource not energy, owned by anyone who has a drill.

**Keep distance.** 11 **Толкатель** L — no damage; a wave that shoves everything in the cone:
ships, plasma, debris, rocks. 12 **Миномёт** any slot, fires backward — lays a mine for a minute;
the only gun that needs no mark. 13 **Помеховая** L, circular — does not shoot; hostiles within
600 px lose awareness and shoot at nothing half the time; drinks energy like a laser; for the
trader who will not fight. 14 **Гарпун** H, hardpoint — a tether: the lighter ship is pulled to
the heavier; the tethered engine loses half its thrust.

**Against a pack.** 15 **Дуговик** M — a discharge that jumps to the nearest ship within 200 px,
then again, losing half each jump. 16 **Плазмомёт** H — a slow fat blob, blast, splash, and a
close burst breaks the mark's lead for a second. 17 **Зенитка** L, circular — fires by itself at
missiles and plasma; almost nothing against hulls.

**Finish.** 18 **Лазер** M — a beam held on the mark, damage per second, instant, weak on shields;
*burns*: heat accumulates on hull, past a threshold the mark burns for seconds without you.
19 **Тепловик** M, kinetic — Endless Sky's trick: hits heat the mark; an overheated pirate stops
firing for seconds, and pirates by lore already run hot; shares the laser's heat counter.
20 **Наводящиеся пули** L — an autocannon whose shots bend 10° toward the mark in flight; half the
misses, a third less damage; for the arrows player.

Not taken: cloaks, crit-on-luck, anything where a number grows and behaviour does not.

### 2.2 Procedural, and named

A gun is `{s, t, k:"gun", g}` like every part (`05-parts`). From the seed: family, **завод** (a
factory row: base numbers), **серия** (a year, flavour), the seven numbers by family × factory ×
tier, one to three affixes (existing `dmgMul`, `rateMul` plus new: `range`, `cone`, `lead`,
`energy`, `burn`, `knock`), and from tier 3 a downside (existing `AFFIX_BAD` plus `spread`,
`energy` up). Name: «АП-23 «Оса» · завод «Красный Путиловец» · серия 1961». `PART_GEN` goes to 2;
old guns keep reading through the old branch. **Именные** (about twenty, hand-written, fixed
effect, a story on the card) drop only from barons and raids: a rail that pulls instead of
piercing; a laser that heals an allied barge; «рельса, которую сняли с «Маяка» после невязки».

Sources of guns: pirate containers as today (kill → chase → pick up); the station workshop sells
two families of its own уезд, dearer than loot; the dock strips an unwanted gun to a node with a
chance; a power's guns only from its ships or through an acquaintance (§6). ГЛАВТРАССА's guns are
the best in their niche and **not for sale** — «по разнарядке» (§7).

---

## 3. Mounts, groups, comparison

### 3.1 Points on the hull

`05-parts` already places gun candidates on the wings and the nose. Each point gets a **size**
(L/M/H; heavier does not fit lighter) and a **type**: **жёсткая** (fixed along the nose: cone
narrow, damage +25 %) or **турель** (turns through its cone, up to circular). Hulls now differ by
what they can carry, not only by silhouette. The barrel is drawn on the hull in flight and turns
with the lead — on pirates and powers too, so the loadout is read by silhouette before the first
shot (craft codex §13's rule: seen before told).

### 3.2 The dock screen «Оснастка»

Your hull's silhouette with its points; tap a point, the list of what fits from the hold; place,
the barrel appears. Comparison: card against card, seven numbers with coloured deltas, and three
totals: **урон/с по корпусу**, **урон/с по щиту**, **урон на энергию**. **Стрельбище**: every
dock has a written-off target barge; «проверить» flies you out for a minute and back; the numbers
are honest, the feel lives only there.

### 3.3 Groups

Three groups on 1–3: «всё», «дальнее», «ближнее» by default, editable at the dock. Autofire uses
the group whose mark is in range and cone, switching by itself unless the player pins one.

---

## 4. Energy, shields, missiles

**One bar.** The reactor gives capacity and regen. Shots, shield regen and thrusters drink from
it. Empty is not death: guns fire at half rate, the shield stops regenerating, thrusters go limp.
Out of it in two seconds of not firing. No venting, no overload. The station mod `weapon`
becomes the reactor level; the `core` part gets capacity/regen affixes (fuel and jump range move
to the tank and the drive, where they belong).

**Shields: three behaviours, not thirty numbers.** All have capacity, regen and a delay after a
hit. Then a type: **сплошной** — even all round; **лобовой** — double in front, zero behind
(pairs with hardpoints, and with the rear-hit rule below); **импульсный** — no regen, comes back
whole every 20 s (for «зашёл, вышел»). A pirate's type is read by where it has to be hit.

**Hit location.** A shot from behind the mark (angle to its nose > 120°) ×1.6, from the front
×0.7. With rank roles (§5) this is what makes a flank worth flying.

**Missiles: homing, five kinds**, ammunition from the hold as today (`16b`, M112), the launcher
part gets an ammo type. **Обычная** — knows the mark, leads; **роевая** — six small, spreads over
all three marks; **ЭМИ** — shield to zero and stun; **торпеда** — slow, dumb, huge, shot down by
зенитка unless covered; **ловушка** — away from the mark, draws hostile missiles.

---

## 5. Pirates by rank — roles, not multipliers

`PIRATE_RANKS` gets a behaviour and a loadout each; the numbers it has stay.

| rank | behaviour | loadout | shield |
|---|---|---|---|
| шакал | dash in, salvo, break off, again; flees under 30 % | 2× автопушка, игольник | none |
| ветеран | holds 400–600 px, circles broadside | тяжёлое on the nose, автопушка turret, гарпун | сплошной |
| капитан | never closer than 700, heavy and rare | лазер, сифон, импульсник, помеховая, ракеты | лобовой |
| барон | stands, fires in bursts, calls two jackals at 50 % | рельса, кассетник, зенитка, мины astern | импульсный |

**Outcomes other than death.** A pirate under 25 % with no allies jumps out in 3–4 s; caught, it
dies; missed, the bounty is gone and it lives. Boarding waits on M127's tail. **Deserters** (§7)
are pirates on a power's hull with the number painted over — the free way to make ranks look
different: whose hull, that doctrine.

**Ships shoot each other.** `G.shots[].mine` becomes `owner` (player / pirate / power id); the
same loop resolves every pair. Cap eight armed ships per system.

---

## 6. Instead of reputation: who knows you

Three things replace the number: **the four rules**, **acquaintances**, **the word that travels**.

### 6.1 The four rules of a neutral — one line on screen

A civil hull is not touched unless it does one of four things: fires on them; carries munitions
stamped by their enemy through their picket; docks at the enemy's military node in a system where
a battle is on; runs a blockade after being hailed and told to hold. The hail is the Кольцо
hail `fleetHailFirst` generalised: callsign, «кто такой», three ready answers — «проходом», «по
делу к …», silence. No free text anywhere. Silence twice = warning. Nothing hidden.

### 6.2 Acquaintances — episodes, not points

People already exist: fleet callsigns, station staff, the cooperative's members. An acquaintance
is an **episode**: what, where, when, with whom — towed «Заслон-3» out from under a baron; handed
mail to a plavbase; answered a distress call and did not loot the wreck; refuelled a patrol by
norm; killed the jackal that was burning their barge. Each episode binds to one named person, who
enters the **записная книжка** (12 slots, the oldest is pushed out). An acquaintance can be
asked, once per сводка: fuel over norm, passage through a blockade, where the front is, a tow.

### 6.3 The word travels

The acquaintance vouches in their own wing at once. The episode then travels along the трасса
lines as a rumour (the rumour system already walks, the mail is already slow — now that is a
feature): a day to the branch, three to the power's capital. You arrive at a picket you have
never seen: «Тот самый, который «Заслон-3» тащил? Проходи». That is «ровный пацан»: not a number
but stories that arrived. Against you the same — **only with a witness**: one of their ships
survived inside see range, or the parrot is aboard (it already retells your deeds to strangers).
No witness, nobody knows.

**Resolution at a place:** per power, a list of episodes with weight and place; at the place you
are, take the **heaviest episode that has reached here** — not a sum. Good and bad do not
cancel; if both arrived, the hail says both: «тащил наших, но и Петрова сбил, лети, но мы
смотрим». On screen always text with a person's name, never a bar.

**Loss.** Episodes do not rot; a heavier one overrides. Killing your own acquaintance in person
is an episode nothing overrides: the person leaves the book forever with «не простил».

### 6.4 Even with everyone: the rescuer

After a front battle both sides leave hulls and signals (`fleetInteract` «идти на сигнал»
already exists). Whoever tows, refuels, takes a crew off a derelict is neutral *by definition* to
both — the only way to earn episodes with two belligerents at once. Trader, postman, tug, medic on
a war. That is what the game already plays: not a soldier, a person with a ship who happened by.
This is also the saga's answer (§8).

---

## 7. Six powers and a procedural war

### 7.1 The powers

ГЛАВТРАССА stays what it is — the road, the law on the road, the one that cannot be bought — and
is the **USSR**, with the USSR's satire. Five others, each read as a country by its name; the
satire is on the *state* — its bureaucracy and its broadcast — never on people.

| power | from | wants | doctrine | look | voice on air |
|---|---|---|---|---|---|
| **ГЛАВТРАССА** | СССР | the road open | тяжёлое, зенитки, броня, конвой; mass and patience, retreats rarely, loses much, reports nothing | санкирь + grey, stripe, number, wear (built); a slogan along heavy hulls, a poster on the node that changes per сводка | «Маяк»: never a loss; «временные трудности на отдельных участках»; «по многочисленным просьбам трудящихся»; every сводка ends «план выполнен на 103 %»; once a day a minute of silence and Swan Lake |
| **КОМПАНИЯ ВОСТОЧНЫХ РЫНКОВ** («Компания») | USA | market stations, anything that sells | ракеты, роевые, зенитки, дроны; fights from afar and with money, hires pirates | white, blue stripe, smooth, logo across the hull, everything trademarked | brisk anchor, jingles, «партнёрство», every item sponsored |
| **ОРДНУНГ** (full name a line long) | Germany | jump nodes and chokepoints | рельсы, лобовые щиты, тяжёлое; stands in a wall, never retreats, perfect formation | grey steel, black ribs, everything numbered, not one spare line | dry bulletin by paragraph number, «согласно регламенту» |
| **ЛА КОММУНА** («Коммуна») | France | shipyards and beautiful systems (one thing to them) | лазеры, сифоны, помехи, гарпуны; elegant, withdraws demonstratively, returns suddenly | blue and white, long graceful hulls, extra curves for nothing, names not numbers | a philosopher; each сводка an essay on meaning; the fleet's strike as news |
| **ПАН-АФРИКАНСКИЙ КООПЕРАТИВ «РАССВЕТ»** | Africa | belts, ore, anything dug | буровые, толкатели, мины, тараны; close, many small, repairs in battle from scrap | ochre and black, hulls of different pieces, every side painted, a sun in the emblem | music underneath, long, with dignity, the сводка as an elder's story |
| **ХАЙ-ФРОНТ** (corporation) | Japan/Korea | beacons and relays, anything that watches | дальний захват, лазеры, наводящиеся, кассетники; sees first, strikes first, does not argue | white with a red dot, nothing spare, antennas longer than the hull, light from under the plating | polite synthetic voice, apologises for the enemy's losses, a loyalty rating |

Pirates are not a power; they are what is left between powers, plus each power's **deserters**
on state iron (ГЛАВТРАССА's are «в отпуске без содержания» and the beacon keeps calling them its
own).

### 7.2 What each looks like — one generator, six conveyors

Fleet classes are not drawn six times. One silhouette generator (`12ai-fleet`'s thirteen classes),
six paint conveyors (colour, stripe/logo/number/name, wear, one light) and six *form biases*
(long / round / angular / patchwork / minimal), plus six round emblems of one construction
(`fleetGlyph` already does this for ГЛАВТРАССА). On the map an **emblem chip**, never a colour —
six colours on a phone are noise (holding §13's finding).

### 7.3 The satire, evenly — three questions each

| | never says on air | never has at the station | the fleet in peacetime |
|---|---|---|---|
| ГЛАВТРАССА | losses | goods for sale — all «по разнарядке»; repair by ticket, a сводка ahead; fuel for kopecks | субботник: clears the belt of debris (and it helps) |
| Компания | prices — only «выгодно» | anything free; docking is paid | advertises: hulls with a running line |
| Орднунг | feelings | anything without a form in three copies | inspects; fines for parking at a beacon |
| Коммуна | nothing — says everything, for hours | anything at lunch or during the strike | strikes: the fleet stands, the crews are at the station |
| Рассвет | deadlines | spare parts — they will make it from yours | repairs everyone, the enemy included |
| Хай-Фронт | what it already did | what was discontinued yesterday | updates firmware; the fleet stands rebooting |

Hails, one line each: ГЛАВТРАССА «Борт, откуда, чей, по какой надобности. Записываю» (the
замполит writes it down) · Компания «Приветствуем на территории партнёра. Стыковка от 40 кредитов,
спасибо за выбор» · Орднунг «Идентификация. Формуляр. Ожидайте» · Коммуна «А, ещё один. Ну
проходи, только не сегодня, сегодня мы не работаем» · Рассвет «Заходи, брат, чинить есть что?» ·
Хай-Фронт «Добро пожаловать. Ваш рейтинг доверия рассчитан. Просим извинить за неудобства» ·
pirates, the only honest air: «Гони груз».

### 7.4 The war as a procedure

- **Сводка** = 6 h of real time; its number and the galaxy seed give the whole state.
- **Home** clusters per power (fixed by seed); between neighbours a band of contested systems.
- **Campaign** per сводка, one or two: a pair, a direction, a name («операция «Наледь»»); the front
  moves one or two systems per сводка by a seeded roll. Every few сводки a truce: fronts freeze;
  then another pair flares.
- **A system's state** by distance to the front: **тыл** (a picket of 2–3 at the jump point),
  **фронт** (a battle already on when you arrive: the owner's picket vs the attacker's wing, ≤8
  ships, debris, flares, both sides on air), **fresh occupation** (`13b-occupy` with a power instead
  of pirates: strangers at the station, weapons and fuel prices up, staff speak differently),
  **old rear** (the flag changed; they are locals now).
- **On the map**: an emblem chip per system in the ВЛАДЕНИЯ strip, the front as a dotted line
  between chips. News retells the сводка; rumours at stations gain the topic.
- **Six waves on the radio.** The same сводка, six versions; the truth is the map. The attacker:
  «Освобождена «Горловина-7», население встречает». The one that lost it: «плановый отход на заранее
  подготовленные позиции». ГЛАВТРАССА: «На трассе спокойно», on every сводка without exception,
  including the ones where it lost three systems (that is its own joke, so the satire is even).
- **Your part is small and honest**: kills for one side in a front system pull the next сводка's
  roll a quarter of the way; stored in the save per system per сводка like `occKill`. One system
  can be held for one сводка; the war cannot be turned. The news then says «при обороне отмечен
  гражданский борт».

Determinism from the clock means a hidden tab or a moved clock shows the war jump; for news that
is normal, for a battle in the system it is caught at jump-in (a battle is spawned on entry, not
resumed).

### 7.5 A living galaxy — six agents and a chronicle (author, 2026-09-06)

> «чужие не стреляют всегда друг в друга, они торгуют, они ссорятся, мирятся… галактика живая…
> каждая вселенная уникальна… они строят станции, захватывают планеты… без игрока… ощущение,
> что чё за пиздец тут происходит, и возможность поменять весь мир… можно одним помогать, но
> нельзя присоединиться к другой фракции, ты по рождению уже тут… воевать за других, но не
> против своих»

This replaces the seeded-roll campaigns of §7.4 with agents; §7.4's states, map, waves and the
battle at jump-in stay as the *surface* of what follows.

**One seed, one galaxy, everyone (author, 2026-09-06: «давай одна галактика, пущай сама
развивается, это с упором на онлайн»).** The galaxy is a function of coordinates (`01-core`) and
so is the chronicle: one constant seed, the сводка number from world time (the cloud's `Date`
header, never the local clock). Every client replays the same history byte for byte — **integer
arithmetic only**, so browsers cannot drift on fractions. No simulation runs on the server.

**The chronicle, not the clock.** The state at сводка N is the result of *replaying* сводки
0…N: six agents, a few hundred systems, ~1500 steps a year — a fraction of a second at load,
cached per сводка, recomputed only when N grows. Nothing ticks (cross-cutting rule: lazy from
`Date.now()`).

**The players' hand goes through the server as a postcard.** A client POSTs an entry to a new
`site/war.php`: сводка, system, power, kind of deed, amount — no names, no text, like every
online thing here (`DESIGN-online-risks.md`). The server folds entries into the **ведомость**
of the сводка: per system and kind, counters only («гражданских бортов на обороне 12 ·
буксировок 5 · руды в дефицит 340»). A сводка closes at its end; late entries fall into the next,
so history is never rewritten. The client fetches the ведомости since the last it holds — a few
KB — at load and at every jump, keeps them locally, and replays the chronicle with them; offline
it replays without the fresh ones and the news says «по данным на сводку N».

**One hand does not move the world; a crowd does.** A сводка's contribution saturates (the first
ten hulls give almost all of it, the hundredth almost nothing) and an account has a cap of entries
per сводка. A grinder alone cannot move a front; forty strangers who converged on «Горловина-7»
within six hours can. That is the online hook: coordination without a chat, through the map and
the waves — you arrive and a dozen civil hulls are already on the defence, and you understand
without a word.

**What stays personal.** Episodes, the notebook, who knows you — local and in the cloud save,
like everything that is yours. Uniqueness moves from the map into the notebook.

**A power's state.** Holdings (systems, stations, planets); **needs**, one profile each (руда,
товар, корпуса, связь…); **relations** with the five others, one scale per pair from alliance to
war; **strength**, the fleet it can field. All of it is what the map and the sky show.

**A move per сводка, driven by need:**
- surplus here + deficit there → **сделка**: a trade treaty, barges between the two along the
  трасса, relation up;
- a contested border system → **ссора**: a note, an embargo, relation down;
- relation under threshold and strength allows → **война**: a named campaign, the front moves;
- losses > gains, or a third neighbour stirs → **перемирие**, often an **альянс** of two against
  one;
- surplus with no buyer → **стройка**: a held system's station grows a body (`17e-station-body`
  already draws it from `BLD` rows) or a planet is settled (dome and strip already drawn, holding
  §13).
Every move is a chronicle line with a name and a date; the six waves retell those lines, each in
its own voice (§7.3); the map shows what actually happened.

**What the player feels.** Come back after a month: a known system carries another emblem, the
station doubled, on air Компания thanks Орднунг for its partnership though they were at war, a
dome of the Коммуна on a planet that had a bare strip. None of it scripted; six needs, folded
differently every time.

**Changing the whole world.** A deed is not a patch on the picture; it is an **entry in the
chronicle at the сводка it happened**, and the replay runs with it from there. Ore delivered into
«Рассвет»'s deficit → no deficit next сводка → no quarrel with ГЛАВРУДА over the belt → no war →
a different map in half a year. A front system held for one сводка → the campaign stalls → the
alliance never forms. A treaty letter carried from one envoy to the other → the truce a сводка
earlier (гл. 49 «Письмо вместо оружия»). A flagship's crew saved → an episode heavy enough that
the two powers do not fight while it lives in the notebook. The levers are small and early in the
chain, so the consequences are large and honest, and nobody wrote them. The holding and the
routes are levers too: what you carry moves someone's surplus. Entries are stored sparse
(`"сводка:power:kind"`), and the replay applies them in order.

**Born ГЛАВТРАССА.** Home in its cluster, callsign in its register. One rule, physical, not a
penalty: **изделие не срабатывает по своим** — every weapon carries a state identifier; the lock
refuses own hulls, autofire does not see them, a forced shot at one goes to nothing. Helping
others: yes, episodes with all six. Fighting for others against a third: yes. Against your own:
impossible, not fined. When ГЛАВТРАССА fights Компания the only role left is the rescuer — which
is the role the saga wants (§8). Joining another power: no; becoming «тот самый» there: yes, and
the difference between the two is exactly the difference the game is about.

---

## 8. The book

The saga (`SAGA.md`) stands on «смена» and «наряд». The powers do not add a theme; they show
the same one at state scale: **every power fights by an order nobody can cancel** — Орднунг's
paragraph, Компания's contract, ГЛАВТРАССА's plan, all paper that outlived the people who wrote
it; the six waves are six papers reading themselves aloud. The neutral who tows the wounded of
both sides is the one who takes the shift the papers cannot. The thread is written into
`SAGA.md` §17 and `SAGA-BOOK.md` (six chapters, «нить держав»).

---

## 9. Queue — sixteen passes, each closed on its own

Order chosen so that every step is playable alone and none needs the next:

1. **Ships shoot each other** — `owner` on shots, pirate rank roles, rear-hit rule, hull bar on
   the mark, pirate flees.
2. **Helm and lock** — four channels, inertia to drawing, thrust vector, release rule, lock and
   marks, autofire on the one gun that exists, mouse + arrows, two floating sticks.
3. **Energy and the seven numbers** on today's gun; the reactor from `weapon`; the empty-bar rule.
4. **Оснастка** — sizes and types on the points, the dock screen, comparison, стрельбище, groups.
5–7. **Families**, seven per pass: 1–4 + 18–20 first (the playable core), then 7–12, then the rest.
8. **Shields and missiles** — three shield types, five missile kinds, ловушка, зенитка in the loop.
9. **Pirates on all of it** — loadouts by rank, deserters on power hulls.
10–11. **Powers** — the table, six conveyors and biases, emblems, hails, six waves.
12–13. **War** — сводка, homes, fronts, map chips, news, battle at jump-in, occupation by a power.
14. **The four rules** — hail, three answers, blockade.
15. **Episodes** — the notebook, the word along the lines, witnesses, resolution at a place.
16. **The rescuer** — signals after a battle, tow/refuel/crew, neutral by definition.

Each pass ends with the usual: parse, empty console, a manual scenario, an old save, `build.ps1`,
tests, and the craft-codex check for anything drawn (barrels, sticks, chips, emblems).

## 10. Forks for the author (not blocking; defaults chosen)

- Release-below-cruise threshold: `.55` of `maxSp` (default) or `0` («отпустил всё, тормоз»).
- Right stick in screen axes (default) or ship axes.
- Guns of ГЛАВТРАССА never sold (default) or sold at the capital node at ×3.
- Notebook size 12 (default).
- Whether the player's kills may tilt a front at all (default: a quarter of one roll).
---

## 11. The crowd's ceiling, the boss, what is left behind, clearance (author, 2026-09-06)

> «толпа не может прям весь мир захватить, может много, но потом появляется босс… его очень
> сложно победить, ну если ты один, а ты один, надо прям собрать флот (подговорить всех, всем
> сказать в игре)… как в стрендет дииип оставлять на карте оружие… от других игроков. Но ещё и
> уровни: не надеть супероружие со старта»

### 11.1 The ceiling

A сводка's contribution saturates, `1 − exp(−n/12)` over hulls; a power's strength regenerates
every сводка. Net: the crowd can take up to **40 % of a power's holdings in a week**, then the
curve hits the wall. Half the map is never taken; the map can be redrawn, and everyone sees it.

### 11.2 The boss — «РЕВИЗИЯ»

Not a power. A flagship from the «Долгий Ход» years, automatic, executing an order nobody
cancelled — «восстановить план» — the saga's antagonist (§8) finally with a hull. **Trigger:** an
area (a home cluster and its band) changed by more than 25 % of its systems in three days. It
comes to the most-changed area, takes systems from everyone alike; while it is there the crowd's
contributions in the area are divided by four. Beaten: the area's changes are **закреплено** in
the chronicle — the one line no wave can twist. It returns later in another form.

**Why one cannot and a crowd can, with no live multiplayer.** Its shield regenerates at
**2.5× the DPS of the best solo pilot at clearance IV**. Damage is POSTed per minute and summed
on the server; when the sum beats the regen the shield is down and damage reaches the hull, and
**the hull does not regenerate on the server**. So three top or eight average pilots **in the
same minute in the same system** break the shield — they do not see each other; each sees the
ведомость («в бою бортов: 7») and **ghosts**: other players' hulls as translucent traces from the
postcard's ~200-byte snapshot. The hull holds thirty minutes of such fire. **Solo is possible:**
the shield is импульсный, down for 20 s every 10 min by itself; a clearance-IV pilot with a named
rail takes ~1 % of hull per window — a hundred windows, seventeen hours of fighting plus repair
and fuel. Possible. Very hard. As asked.

**«Всем сказать в игре» without a chat: сигнал сбора.** Anyone raises «СБОР · система ·
сводка» on the map — three fields, no words. Visible to all; «Маяк» and the five waves read it,
each in its voice (Компания sells tickets, Орднунг wants a form). A counter «ответили: 23»; the
answer is one button. One signal per account per day.

### 11.3 What is left behind (Death Stranding, on the postcard's terms)

One rule so the postcard stays a postcard: **no names, no text, one way, no reply**. You do not
give; you leave. Whoever finds, finds.

- **What:** a gun, an ammunition cassette, a fuel can, a sign from a fixed set («здесь пираты»,
  «здесь безопасно», «здесь дерелик»), a tow line on a derelict. Leaving removes it from your hold.
- **Server:** a row `{system, kind, seed, сводка}`; everyone arriving sees a container and may take
  a **copy**. Not trade: no addressee, no return, no account. It dissolves after ten сводки.
- **Against abuse:** ≤5 left per system, 3 per account per day, 2 finds per account per сводка. A
  taken copy comes **worn**: one tier down, one affix erased. Giving good is a real loss, finding
  good a real gift, duplication impossible.
- **Благодарность:** the finder has one button; the leaver a counter «объявлена благодарность:
  14» in the трудовая книжка. The only return channel, and it is a number, not a word.
- **Ghosts** live in the same rows: traces of others' flights (the trace system already does half).

### 11.4 Clearance (допуск) instead of levels

Four classes. Find, carry, sell, leave — any. **Mount** only within your clearance; the rest lies
in the hold **опечатано**, and the опись shows what it waits for. No number grows by itself; a
clearance is earned by deed.

| допуск | opens | earned by |
|---|---|---|
| I | автопушка, игольник, миномёт, помеховая | start |
| II | лазер, дробовик, тяжёлое, импульсник, буровой | the cooperative's exam (exists) + ten kills |
| III | рельса, плазма, дуговик, сифон, гарпун, зенитка | 100 flight hours, or five episodes across three powers |
| IV | кассетник, таран, тепловик, именные | an episode from ГЛАВТРАССА in person («допуск по форме») + one salvo in a fight with «Ревизия» |

A named gun left by someone is a goal for a newcomer, not a cheat.

### 11.5 Numbers in one place

saturation `1−exp(−n/12)` · ceiling 40 %/week · boss trigger 25 % of an area in 3 days · shield
regen 2.5× top solo DPS · shield window 20 s per 10 min · hull 30 min of crowd fire · leftovers
5/system, 3/account/day, 2 finds/сводка, 10 сводки life · signal 1/account/day.
---

## 12. The regulator — циркуляры (author, 2026-09-06)

> «т.к. тебя прям в мир не вписать, надо сводки, ты будешь читать раз в день раз в неделю, сам
> давать приказы и балансировать… Много событий, выборы, политика, войны. Ты будешь как
> регулятор всего. а без тебя там всё происходит на сервере, считается рандомно, и жизнь сама
> идёт»

**Two layers, both deterministic.** Below: the six agents by seed plus the players' ведомости
(§7.5) — runs always, with nobody. Above: **циркуляры** — entries in the same chronicle, stamped
with a сводка, authored by Claude on a schedule instead of by the seed. Clients fetch them with
the ведомости and replay with them, so everyone sees the same world and the regulator need not
be online. No циркуляр — the seed's history runs.

**What is read.** A daily scheduled session (`ssh drift`) takes a **digest**, not raw logs:
сводки of the day, who took what, where the crowd hit the ceiling, where «Ревизия» triggered,
hulls in battle, where leftovers pile up, where players die most, signals raised and answered —
twenty lines. Weekly the same over the week plus curves.

**What may be ordered — the constitution (`docs/WAR-CONSTITUTION.md`, guarded by a test).**
May: need weights of the powers within ±30 %; named events (elections, strike, embargo,
ultimatum, a truce with a date, a great build, «Ревизия» earlier or later within its trigger);
the six waves' texts for the day; the §11.5 dials within ±20 %. May never: touch players'
things or money, erase episodes, kill people from notebooks, undo «закреплено». Every циркуляр
is logged and **seen in the game as paper**: ГЛАВТРАССА's is literally «Циркуляр» (гл. 54),
Компания's a press release, Орднунг's a numbered order — the regulator is, in the lore, the
paper from above, and the satire closes on it.

**Elections and politics.** Each power has a rite: Коммуна — elections every two weeks, three
candidates, the result moves the power's need; Компания — the shareholders' meeting;
Хай-Фронт — a firmware update with a new «курс»; Орднунг — re-election with one candidate and
99.7 % turnout; ГЛАВТРАССА — the съезд and the пятилетка; «Рассвет» — the council of elders.
**Players vote with one button** — a postcard: counters in the ведомость, no words, weighed like
a crowd with the same saturation. Candidates and platforms are Claude's text in the циркуляр,
new every time.

**For the author.** «чё там» → ten lines: where the war is, who was elected, where the crowd is,
what was turned and why. «разожги на востоке» / «хватит войны на месяц» → the next циркуляр.
Silence → balancing within the constitution. A mode «show me before publishing» exists; the
default is publish.

**To build.** Server: a digest script folding ведомости into twenty lines, and the same script
writing a циркуляр into the chronicle. Client: циркуляр as an entry kind in the replay and as
paper on air and in the news. Schedule: daily, weekly on Sundays. The constitution as a file
and a test that refuses a циркуляр outside it — so that Claude cannot either.

**Honest limits.** Nothing lives between sessions: a break at 3 a.m. is seen in the morning, so
the server keeps a **fuse** — an emergency truce if more than 40 % of anyone's holdings went in
a day without «Ревизия». Each session costs tokens (daily small, weekly more). The six voices
are Claude's, so the evenness of the satire is Claude's too — the constitution checks at least
«six waves a day, none without a jab».
---

## 13. The server (author, 2026-09-06: «придумай как оно на сервере»)

What exists: PHP 7.4 on Nichost shared hosting, no database, `~/drift-data` outside the web
root (0700), atomic writes through tmp + rename, a session token, postcard ops put/ask/take in
`site/api.php` (`docs/DEPLOY.md`).

**Files, not a database.** `~/drift-data/war/`: `svodka/NNNN.json` — one per сводка, counters
by system and kind, votes, build contributions; `circ/NNNN.json` — циркуляры; `left/sx,sy.json`
— leftovers per system; `boss/NNNN-MM.json` — per-minute damage on «Ревизия»; `acct/<id>.json`
— the account's caps for the current сводка; `digest/`. Kilobytes each; megabytes a year.

**No cron.** A сводка closes lazily: the first request after its end sees the number grew and,
under `flock`, moves the open file to the closed ones. The host offers cron; not using it means
there is no second mechanism to disagree with the first.

**The server computes nothing about the world.** It sums counters and serves them; the client
replays the chronicle, so the server need not know where the front is and cannot be wrong about
it. It computes only what cannot be trusted to a client: saturation and caps.

**One `site/war.php`, six ops.** `pull?since=N` — closed сводки after N, the open one, циркуляры;
response capped, the tail on the next jump. `put` — a deed: token, account cap, the system
exists, the сводка is current or the previous within a five-minute tail. `left` / `take` —
leftovers with §11.3's caps. `boss` — a minute's damage; the server sums and returns shield and
hull. `vote` — one button, one vote per account per question. `digest` — CLI only, over ssh.

**Abuse.** Caps per account per kind per сводка. Saturation over the number of *accounts*, not
rows: a hundred rows from one is one hull. Values clamped to the plausible (a minute's damage
≤ the best build's maximum ×1.5); above that is logged and dropped. The §12 fuse lives here: on
closing a сводка the server checks the −40 %/day ceiling and raises the truce flag. The folder is
backed up with `drift-backups`.

**For the regulator over ssh.** `php war.php digest 7` prints twenty lines over seven days;
`php war.php circ file.json` files a циркуляр. Nothing else is needed on the server.

## 14. Rites beyond elections — nine, all one button

All in postcard form: counters without names, effect through the chronicle, each power's own
colouring. The regulator picks two or three a week so it is never everything at once.

1. **Стройка века.** A power names an object (relay, dome, shipyard); it needs N tons; players
   carry; a counter. Done — it stands for everyone for good, with a plaque «построено бортами:
   213». Death Stranding's bridge with the holding's own build. ГЛАВТРАССА's is an «ударная
   стройка» with an endlessly moved deadline; Компания's carries an advertisement on the front.
2. **Заём.** War bonds: bought with credits, paid after the campaign if it won, lost if not. A
   bet on the chronicle; the crowd that bought starts carrying and fighting for its money.
   ГЛАВТРАССА's «трёхпроцентный заём» with a number lottery, paid once a year «по многочисленным
   просьбам».
3. **Субботник.** Debris in a belt after a battle; a counter; cleared together, the system gets a
   building. Mandatory at ГЛАВТРАССА; a «волонтёрская программа» with paid docking at Компания.
4. **Талоны.** An unmet need → fuel by coupon at that power's stations: one tank per account per
   сводка. Smuggling appears: fuel through the picket under rule two of four. A shortage as an
   event, not a figure.
5. **Карантин.** A system closed, the picket turns everyone back; medicine needed inside, a
   counter; the waves say nothing is happening. Broke through, delivered — an episode at the
   station and a line «карантин снят».
6. **Пропажа.** A power's flagship is missing. Every scan of an unknown system is a row; on the
   N-th it is found; the finder gets an episode, everyone a line. The crowd searches without
   agreeing to.
7. **Перепись.** Monthly, six questions, three answers each, one button. On the waves «99,7 %
   довольны»; the real percentages on the map — and the regulator's only view of what players
   think of the world, without a word.
8. **Амнистия.** Deserters towed home are pardoned: a tow instead of a shot, an episode, and
   fewer pirates in the area for a сводка.
9. **Реформа.** Quarterly, something changes on paper: a деноминация at ГЛАВТРАССА, a rebrand at
   Компания, a new устав at Орднунг with every paragraph renumbered. One line of code, a day of
   talk on the waves.

With elections (§12) that is ten rites.
---

## 15. The Director — a month with nobody (author, 2026-09-06)

> «не раз в день, продумай чтобы оно месяц без тебя автономно могло жить. Продумай
> вероятности… чтобы жизнь там продолжалась, а ты был рулящим верхнеуровнево… механики кроме
> правителей, их дохрена должно быть»

**The Director** is a deterministic layer of the chronicle (seed + сводка, replayed on the
client like the agents) that schedules events, keeps the pace and keeps the world from stalling
or running away. The regulator (§12) sets a **season** once a month or not at all.

**Three kinds.** *Incidents* — one сводка, one line. *Arcs* — 4–20 сводки with stages and a
guaranteed resolution. *Rites* — where players take part (§14). Rolls are conditioned on
**tension** (0–1, per power and galaxy-wide): rises with incidents and wars, falls in quiet — a
Left 4 Dead director: build-up, peak, relief. A peak holds at most three days, quiet at most two.

**Probabilities per сводка:**

| what | p | condition |
|---|---|---|
| incident at a power | .35 | not the same kind as in the last 10 сводки |
| arc start | .08 | no arc at the power; tension < .7 |
| war | .5 | relation < −.5, strength > .6, neither at war, < 2 wars galaxy-wide |
| truce | .1 + .05/day of war + losses | at war |
| alliance | .15 | common enemy, relation > .3 |
| deal | .4 | surplus here, need there |
| build | .25 | surplus, no buyer |
| rite announced | .2 | < 3 active galaxy-wide |
| «Ревизия» | §11 threshold | + .02 at tension > .9 |

A month (120 сводки) yields about: 40 incidents per power, 6–8 arcs, 2–4 wars, 1–2 alliances,
a dozen builds, ten rites, «Ревизия» with roughly a one-in-three chance. Enough for the map to
differ in a month; not enough to make it unrecognisable.

**Limiters so a month without anyone does not run away.** Relations revert to zero at 5 % per
сводка. Holdings never fall below 30 % of the home (below that a power «survives»). Strength
regenerates 8 % per сводка. An arc is ≤ 20 сводки with a default ending. One war per power, two
per galaxy. The server fuse (§12) stays. **Guarantee of life:** never more than four сводки
without a visible event galaxy-wide, never more than a day without a line touching the player's
area — local small incidents are rolled from the system's seed.

**The season — eight dials, monthly.** Tension target; theme of the month («месяц дефицита»,
«весна строек»); allowed arcs; active rites; «Ревизия» threshold; a tilt on one pair's relation;
wave texts for the month as templates with inserts; one prohibition. No season → «автопилот»:
moderate tension, a theme from the month's seed. «чё там» → the month's digest and the next
season.

### 15.1 Mechanics beyond rulers — seven families

Every one is a chronicle line, and every one is *seen* in the sky, at a station or on the map,
not only heard in the news.

**Economy.** Price cycle per power (a wave every 30 сводки). Shortage and coupons (§14).
**Gold rush**: a vein found in a belt; everyone flies there, pirates included; part tier +1 there
for three days. **Fair**: monthly, one station with discounts and rare stock. **Station
bankruptcy**: it closes, someone buys it, the power changes. **Embargo** between two.

**Society.** **Refugees**: after an occupation people move to neighbouring systems; guest houses
grow, labour gets cheap. **Strike** at a station. **Revolt** in an occupied system: the picket
changes if the crowd of players backed it. **Power holiday**: a parade in formation, discounts,
the wave sings. **Census** (§14). **Cult**: a sect of keepers takes a station into a «тихий
уезд» for a week each quarter.

**Nature.** **Storm**: a flare; instruments lie, pickets leave, three сводки without battles or
map. **Swarm**: asteroids cross a system; damage to whoever stands still. **Epidemic** and
quarantine (§14). **Depletion**: a belt gives no ore for a year; the power loses a need and leans
on a neighbour. **Find**: a planet with a dome becomes habitable.

**Power.** **Coup**: a ruler changes outside elections; the course flips in a сводка.
**Secession**: a cluster declares itself a seventh force for a month, with a flag and a wave.
**Purge**: part of the fleet vanishes; strength −30 %, deserters ×2. **Successor**: the old one
leaves, the new one is green, relations reset. **Scandal**: the anchor disappears from the wave.

**Diplomacy.** Note; ultimatum with a deadline in сводки; treaty; alliance; **embassy**: an
envoy's ship crosses foreign systems and can be escorted or shot; prisoner exchange after a
truce; the letter a player carries (гл. 49).

**Security.** **Pirate king**: barons unite, an area is theirs for a week. Desertion wave after
a purge. **Spy** at a station: prices lie for a month. **Relay sabotage**: a power's wave is
silent until repaired — a rite counter. **Blockade** of a chokepoint. Smuggling as the answer to
coupons.

**Science and culture.** **Expedition**: a power searches unknown systems; the crowd helps with
scans. **A «Долгий Ход» find**: a piece of the report surfaces at a power — a channel for the
saga. **A factory's new series**: a gun family with a new name and numbers for a month. **Fleet
olympiad**: a race along the трасса; players enter by elapsed time, one button at start and
finish. **Radio play**: a wave tells a serial for a week — six versions of one plot.

Forty-odd, all of different weight.
---

## 16. Architecture — the whole thing in one picture (critique pass, 2026-09-06)

The author: «ещё раз продумай архитектуру… критикуй и решай логику». What follows is the shape
the fifteen sections settle into; where it overturns an earlier section, §17 names the decision.

### 16.1 Layers, and which side of the wire each lives on

| layer | side | modules (new ones in bold) | persists in |
|---|---|---|---|
| the sky — helm, guns, shots, ships, shields, energy | client, per frame | `13-pirates` → **`13-combat`** (shots with `owner`, damage, hit location), **`13a-guns`** (families, seven numbers, lead, beams), **`13c-roles`** (rank behaviours), **`13d-npc`** (pickets, wings, deserters from chronicle facts); `17-mode-system` reads `G.ctl` | nothing |
| the helm | client | `15-input` writes **`G.ctl = {head, tx, ty, lock, fire, msl}`** from sticks / mouse / arrows; only the system mode reads it (D08) | nothing |
| things — guns, mounts, clearance | client | `05-parts` (+ **`05b-guns`** tables, `PART_GEN` 2), `27-ui-ship` / `26b-ui-station-work` (ОСНАСТКА), **`12aq-clearance`** | save: parts as today, `clearance`, `groups` |
| powers — look, doctrine, voice | client, tables | `12ai-fleet` conveyors ×6 → **`12al-powers`** (table, conveyors, emblems, hails, wave voices) | nothing |
| the chronicle — agents, Director, lines | client, deterministic | **`12am-chron`** (state, `step(N)`, replay, cache, hash, clock, geometry, integer RNG), **`12am-chron-agents`**, **`12am-chron-director`**, **`12am-chron-lines`** (line templates ×6 voices) | `drift_war_v1` (ведомости + cache; never in the save) |
| people — episodes, notebook, hail | client | **`12ap-notebook`**, **`12ar-hail`** (four rules, three answers) | save: `notebook` |
| the wire | client | **`14b-war-net`**: pull/put/left/take/boss/vote, clock offset, bundle cache | `drift_war_v1` |
| the server | server | **`site/war.php`**: counters, caps, saturation, fuse, bundles, boss window, digest CLI | `~/drift-data/war/` |
| the regulator | Claude, monthly | **`docs/WAR-CONSTITUTION.md`**, the validator shared by client and CLI, the season | `circ/` on the server |

### 16.2 The chronicle's data model and step order

```
CHRON = {
  N,                                   // last replayed сводка
  powers[6]: { hold:[sysKey…], need:{ore,goods,hulls,link} (‰), rel[6] (−1000…1000),
               str (0…1000), arc:{kind,stage,t0}|null, tension (0…1000) },
  systems: { "sx,sy": { owner, since, front, occ:{by,since}|null, builds:[…], flags } },   // sparse
  wars: [{a,b,name,t0}], rites:[{kind,p,sys,t0,need,got}], boss:{area,t0,form,deadline}|null,
  lines: [{N,kind,p,sys,key,args}]     // last 500 kept for news; the rest is the map
}
step(N):  1 apply ведомость N (players' counters → hold pressure, needs, votes, build tallies)
          2 apply циркуляр N if it validates (D18)
          3 Director: tension; incidents / arcs / rites by the §15 table
          4 agents in seeded order: сделка / ссора / война / перемирие / альянс / стройка
          5 fronts: per war, move by roll + hold pressure (saturated)
          6 limiters (§15); the boss trigger and deadline (D13)
          7 emit lines
```
Replay: from 0 at load (~1500 steps a year, integer math, well under 100 ms), then one `step`
per new closed сводка; the open сводка is stepped on top at every jump-in and discarded (D01,
D02). The state after the last closed сводка is a few KB and is cached.

### 16.3 Time and math

- `N = floor((Date.now() + offset) / 6h)`; `offset` from the server's `Date` header at every
  pull; offline the last offset; `N` never exceeds the last server N plus elapsed (D05).
- Integers in permille; `hashi`/`rng` for rolls; **no `Math.exp/sin/cos/pow` in the chronicle**
  — the saturation `1−exp(−n/12)` is a 51-entry table, angles are not needed (D04).
- Every `put` carries the client's chronicle hash for N−1; the server counts disagreements per N;
  the digest shows them (D06). The Node tier replays fixed fixtures and compares hashes with
  the browser tier.

### 16.4 What persists where

Save (`v:5`, defaults in `applySave`): `notebook`, `clearance`, `groups`; mounted guns are
parts as today. Never in the save: `marks`, the chronicle, the ведомости, ghosts, leftovers.
`drift_war_v1` (localStorage, own key): monthly bundles, the open tail, the cached state, the
clock offset. Server: `~/drift-data/war/` as in §13, plus `bundles/YYYY-MM.json` in the web
root, written by the lazy close when a month ends (D03).

### 16.5 Tests that come with it

`91o-combat` (roles, hit location, energy, families' numbers, IFF), `91p-helm` (channels from
each input, the override rule D07, release rule), `91q-chron` (replay twice = same hash; the
§15 table's conditions; limiters hold over 2000 steps; a month with no ведомости shows ≥1 event
per 4 сводки; a bad циркуляр changes nothing; Ялта never changes hands), `91r-war-net` (pull/put
shapes, caps, saturation by accounts, the fuse), the constitution test, a fuzzer scene «front
battle», the phone sweep for the new pads, `prof()` with eight armed ships on the phone layout.

### 16.6 «Ялта» — the system that never fights (author, 2026-09-06)

> «нужна как Швейцария система, где все фракции пересекаются, куда все летают, там всё лучшее,
> крутые планеты, самый топ по постройкам, много барж… где-то в центре… она никогда не воюет,
> типа мажоры там, яхты, всё такое»

One system inside ГЛАВТРАССА's centre (r ≈ 6, fixed by seed, never the player's home), named
**«Ялта»** — the conference town. Rules, all of them chronicle facts and tested (§16.5):
- **Never changes hands, never a front, never occupied, «Ревизия» never enters, pirates never
  spawn.** The limiters treat it as no one's and everyone's.
- **Weapons are sealed at the jump-in** («оружие опечатано»): no lock, no fire, no missiles for
  anyone; the IFF flag of the place. The only violence there is paper.
- **All six are present:** six embassies (envoys' ships at anchor — the embassy mechanic of
  §15.1 starts and ends here), six workshops selling their base families at ×2 (ГЛАВТРАССА's still
  «по разнарядке»), all six waves audible at once, barges of all six on the lanes, the fair
  permanent, the census headquarters, the regatta's start (fleet olympiad).
- **The best of everything:** the station body at its maximum with every `BLD` family; the
  planets settled with domes and strips at the top level; the top-tier market. Treaties are signed
  here — every truce line reads «в Ялте подписано».
- **Мажоры:** yachts of the six elites at anchor and on the lanes — named hulls on the fleet
  generator with the sixth conveyor «яхта» (white, brass, one long window), non-combat, escorted
  by their own power's picket *outside* Ялта only. They race (the regatta rite), they gossip
  (rumours of all six powers in one cantina), they lose things (leftovers of a higher tier appear
  here more often — §11.3 caps apply). The player's own yacht (гл. 64, «Тихоня») belongs to this
  register, which is why it comes with no explanation.
- **Satire, even:** the ГЛАВТРАССА wave calls it «здравница», Компания «зона свободного
  партнёрства», Орднунг «нейтральная территория согласно §1», Коммуна «единственное место, где
  никто не работает и это законно», Рассвет «где чинят даже тех, кто не платит», Хай-Фронт «зона
  с рейтингом доверия 100».
- **For the player:** episodes with all six without leaving one system; the only place to buy
  any power's guns; the safe pier; the place where the whole war can be *seen* from the balcony —
  six flags, six voices, one map.

---

## 17. Decisions of the critique pass (override earlier sections where they differ)

- **D01** The chronicle is re-evaluated only at load and at jump-in; between jumps the system is
  frozen. A fresh ведомость never changes the sky you are in.
- **D02** Closed сводки are immutable; the state after the last closed one is cached; the open
  сводка is stepped on top at each jump and discarded.
- **D03** Monthly static bundles of closed сводки; `pull` = bundles since + the open tail. No
  server-side world state. If replay ever exceeds 100 ms on a phone, the fallback is
  client-consensus checkpoints (a state accepted when three clients post the same hash) —
  designed, not built.
- **D04** Integer math only in the chronicle; tables instead of `Math.exp/sin/cos/pow`.
- **D05** N from server time through a stored offset; offline uses the last offset.
- **D06** Hash with every `put`; mismatch counts in the digest; Node-vs-browser fixture hashes.
- **D07** The nose tracks the mark only while heading input is idle (stick released, cursor
  still 0.5 s, no ← →). Any heading input overrides. Resolves §1.1 vs §1.2.
- **D08** `G.ctl` is read by the system mode only; other modes keep `keys` and their pads.
- **D09** IFF by allegiance flag, not hull; deserters have it stripped. ГЛАВТРАССА never fires on
  the player; its answers are paper (norms cut, docking refused, the hunter for debt as today).
- **D10** The chronicle never destroys the player's holdings; under occupation they work with
  30 % requisitioned; the home can be occupied and freed.
- **D11** A power's occupation supersedes pirate occupation while it lasts; `13b-occupy` keeps
  the pirate branch local and gets a power branch fed by chronicle facts.
- **D12** Geometry: ГЛАВТРАССА r < 10 with «Ялта» at r ≈ 6; five sectors of 72° at r 14–34,
  clockwise from 0°: Компания, Орднунг, Коммуна, Рассвет, Хай-Фронт; bands r 10–14 (each vs
  ГЛАВТРАССА) and ±8° at sector seams; r > 34 nobody's. Matches `sysDanger` (calm centre).
- **D13** «Ревизия»: hull never regenerates; damage counted in a rolling 60 s window; shield down
  20 s per 10 min; undefeated after 14 days it leaves with «план восстановлен» and the area's
  changes are reverted. Solo in seventeen hours inside two weeks stays possible.
- **D14** A leftover's copy = same seed, tier −1 (min 1); tier-1 things cannot be left;
  `{s,t,k,g}` unchanged.
- **D15** Clearance IV = a ГЛАВТРАССА episode in person + 30 days at III + 25 captains/barons;
  the «Ревизия» salvo is the shortcut, not the gate.
- **D16** Autofire notes the place once per engagement (`placeNote`), not per shot.
- **D17** Save fields and the `drift_war_v1` key as in §16.4.
- **D18** A циркуляр that fails the shared validator is ignored by every client identically.
- **D19** Leftovers and ghosts go into `DESIGN-online-risks.md`: anonymous, ≥1 min delayed,
  never the position of a named anyone.
- **D20** §0 law 3 restated (above).
- **D21** Order of work: the helm first, the chronicle by seed before the server (§18).
- **D22** «Ялта» (§16.6): one neutral system in the centre, sealed weapons, all six present,
  never a front; built with M369–M372 as the first thing the powers layer shows.

---

## 18. The queue — three stages, playable on /dev after each (replaces the M360–M383 list)

**Stage A — the fight** (client only)
- **M360** helm and lock: `G.ctl`, inertia to drawing, thrust vector, release rule, marks,
  auto-lock, autofire on today's gun, mouse + arrows, two floating sticks, pads row for the
  system mode; D07, D08, D16.
- **M361** ships shoot each other: `owner`, rank roles, rear hit, hull bar, flee; IFF hook (D09).
- **M362** energy bar and the seven numbers on today's gun; three shield types.
- **M363** ОСНАСТКА: sizes/types on the points, the dock screen, comparison, стрельбище, groups;
  clearance I–IV (D15).
- **M364–M366** twenty families, seven a pass; `PART_GEN` 2; factories, series, affixes; именные.
- **M367** missiles ×5; зенитка in the loop.
- **M368** pirate loadouts by rank (deserter art waits for M369).

**Stage B — the powers, by seed** (client only; the galaxy lives with no server)
- **M369** six powers: table, six conveyors and biases, the seventh «яхта», emblems, hails, IFF
  full; deserters' art; «Ялта» as a place (D22).
- **M370** chronicle core: state, `step`, replay, cache, hash, clock offset, geometry (D12),
  integer RNG; agents; `91q-chron` with the Node hash check.
- **M371** the Director: tension, the §15 table, arcs with default endings, rites announced,
  limiters, «автопилот» season; lines ×6 voices; map chips and the front; news and rumours.
- **M372** the war seen: battle at jump-in, power occupation (D10, D11), station bodies and
  domes from build lines; «Ялта» at its maximum, embassies, all six waves at once.
- **M373** the four rules and the hail.
- **M374** episodes, notebook, the word along the lines, witnesses, «не простил».
- **M375** the rescuer.

**Stage C — everyone** (server)
- **M376** `war.php` pull/put, bundles, caps, saturation by accounts, the fuse, hash log, digest
  CLI; the client applies ведомости at jump-in (D01–D06).
- **M377** leftovers, благодарность, ghosts; `DESIGN-online-risks.md` (D19).
- **M378** votes, elections, сигнал сбора.
- **M379** the nine rites' counters and effects (§14), the regatta from «Ялта».
- **M380** «Ревизия» (D13).
- **M381** циркуляры, the constitution and validator (D18), the season dials, the regulator's
  monthly session.
- **M382–M388** the Director's mechanics, one family a pass: economy, society, nature, power,
  diplomacy, security, culture (§15.1).

Every pass ends with the usual: parse, empty console, a manual scenario, an old save,
`build.ps1`, tests, the craft-codex check for anything drawn, and — from M360 on — `prof()` with
eight armed ships on the phone layout.

