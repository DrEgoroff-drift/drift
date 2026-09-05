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
3. **Deterministic from seed and clock**, like everything else (`PLAN.md` cross-cutting rules):
   the war is a function of the galaxy seed and the current сводка number. Two players at the same
   hour see the same war with no byte exchanged — this is what lets the online postcard stay a
   postcard. The player's own effect is a sparse local delta, stored like `occKill`.
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
