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
7. **At first glance** (author, 2026-09-06: «дизайн должен отличаться явно, чтобы с первого
   взгляда отличить фракцию»). A hull, a station, a barge, a dome names its maker before any
   text and before the eye has time to look for a detail: the test is 8 px and half a second.
   Two checks, both required: `makerRead()` ≥ 90 % over a hundred seeds per class (D24), and
   the author naming the maker of every row of the six sheets on /dev without reading a
   label. A grammar that needs a caption is not a grammar; the pass is not closed.

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

`91zzzw-combat` (roles, hit location, energy, families' numbers, IFF), `91zzzw-helm` (channels from
each input, the override rule D07, release rule), `91zzzw-chron` (replay twice = same hash; the
§15 table's conditions; limiters hold over 2000 steps; a month with no ведомости shows ≥1 event
per 4 сводки; a bad циркуляр changes nothing; Ялта never changes hands), `91zzzw-net` (pull/put
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
- **D23** Everything has a maker (§19): §7.2's «one generator, six conveyors» was too small —
  a power is a *grammar of form* on a second axis of every generator (hulls, parts, stations,
  barges, domes, papers, suits), stored as `by` on ship records and `b` on parts, and
  everything a maker makes can be had by the §19.3 matrix.
- **D24** The grammar is one layer read by every generator (§19.4): hulls (`03a`–`03e`), the
  fleet (`12ai`), barges (`12l`), pirate hulls (`12i`), station bodies (`17e`), domes, papers.
  Recognisability is measured, not argued: `makerRead()` separates six makers at 8 px with
  ≥ 90 % accuracy over a hundred seeds per class before M369 closes.

---

## 18. The queue — three stages, playable on /dev after each (replaces the M360–M383 list)

**Stage A — the fight** (client only)
- ~~**M360** helm and lock~~ — 0.360.0 (2026-09-06): `15a-helm`, `G.ctl`, suite `91zzzw-helm`.
  Learned: Space stays ДЕЙСТВИЕ; the raw key layer bypasses `G.opts.keys`; two-finger pinch in
  the system mode is gone (zoom = rail buttons); the pad-row key must include the mode.
- ~~**M360a** the helm frame, redone~~ — 0.360.1 (2026-09-06), after the author's phone shot
  «у меня только разочарование». The stick is a faint arc plus a dot (51 px footprint, not 93);
  chips, МАСШТАБ and the prompt step out from under a live finger (`helmLift`, `--helmlift`);
  `#msg`/`#prompt` keep their line breaks on the phone; the combat hint names the new controls;
  the hull bar stands above the lock bracket. Learned, and it changes every brief below:
  **a channel written in `G.ctl` is not a channel until something reads it** — M360 left
  `HELM_CONE`/`HELM_RANGE`/`ctl.fire`/`ctl.msl` with no reader, its own suite red in the
  browser tier, and the pass was still written down as done. Run `test.ps1 -Browser` and
  `-Mobile`, not only the Node tier, before striking a pass.
- ~~**M361** ships shoot each other~~ — 0.361.0 (2026-09-06): `13-combat` (`owner`, one hit
  loop, ×1.6 stern / ×.7 bow, `fleetFire`, `ARMED_CAP`), `13c-roles` (four roles, flee,
  jump-out), `iff` on your crew, hull bar over anyone aware, suite `91zzzw-combat`.
  Learned: **a role is only real once its distance band is measured over hundreds of
  frames** — reading the code said the baron paused between bursts and the veteran held
  400–600; the measurement said 82 shots without a pause and a spiral out to 1300. Every
  later brief that adds behaviour gets the same band measurement. The layer's baseline:
  `prof(60)`, phone 375×812 @2 — JS 2.59 ms idle, 2.61 with eight armed ships. For M362:
  eight aware ships kill a standing unshielded ship in about fifty frames.
- ~~**M362** energy bar and the seven numbers~~ — 0.362.0 (2026-09-06): `05c-arms`
  (`gunSpec`, `gunAimTick`, `gunLeadAngle`, `gunMiss`, `DMG_TYPES`, `SHIELD_TYPES`,
  `energyCap`), `G.energy`, shields on ranked pirates, the card. **Deferred, and it belongs
  in the M364–M366 brief:** moving the tank and jump range off the reactor and giving it
  capacity/regen affixes is a `genPart` change — affixes are restored from a seed, so it
  silently rewrites parts every player owns and therefore needs `PART_GEN` 2. Learned:
  **`stat()` is called dozens of times a frame — anything new in it must be cached** (four
  `toFixed` in the gun spec were enough to matter). Baseline unchanged: `prof(80)`, phone
  375×812 @2, JS 2.8–3.0 ms idle and with eight armed ships alike.
- ~~**M363** ОСНАСТКА, clearance, groups~~ — 0.363.0 (2026-09-06): `05d-mounts` (size L/M/H,
  жёсткая/турель, `mountTakes`), several guns at once with their own cooldowns and barrels
  drawn on the hull, groups 1–3 picking themselves, the three totals, `05e-clearance`
  (I–IV, sealed parts naming the nearest gate, flight hours), `24d-range` (стрельбище).
  **Deferred with its reason:** a gun's class is read from its tier until the twenty
  families exist — M364–M366 must replace that unfolding and carry the `b` maker field
  with it. Learned: **run `-Browser` before striking anything that touches `stat()` or a
  screen** — the Node tier missed a TDZ in `stat()` and a suite that left the station
  screen open and silenced the helm's mouse branch in every suite after it.
- ~~**M364** the first seven families~~ — 0.364.0 (2026-09-06): `05b-guns` (`GUN_FAMILY`,
  `GUN_FACTORY`, series, names), `13a-guns` (bullet, rail with pierce, pellets, beam,
  homing; heat, burning, overheat silence), the `therm` damage type, `PART_GEN` 2 with a
  real lock (`genPart` takes the generation, `unpackPart` passes the saved one, twenty
  seeds pinned in `91zzzw-guns`). Learned: **`PART_GEN` was a promise without a lock** —
  check that a versioned generator is actually called with its version before trusting it.
- ~~**M365** игольник, сифон, импульсник, буровой, толкатель, миномёт, помеховая~~ — 0.365.0
  (2026-09-06): habits `needles`, `siphon`, `pulse`, `drillbeam`, `shove`, `mortar`, `jam` in
  `13a-guns`; `s.pass` on a needle, `p.shieldOff`, `p.jamT`, `G.gmines`. Learned: **a family
  whose whole point is that it fires nothing needs its own definition of «it worked»** — the
  coverage suite counts a mine, a blinding or a shove as a shot, or the jammer reads as dead code.
- ~~**M366** гарпун, кассетник, дуговик, плазмомёт, зенитка, таран; the именные~~ — 0.366.0
  (2026-09-06): habits `arc`, `plasma`, `flak`, `cluster`, `tether`, `ram`; `GUN_NAMED` (twenty,
  each a family wearing another family's habit, dropped by barons, packed as `n` in the save);
  the M362 debt paid — tank to `util`, jump to `engine`, `enCapAdd`/`enRegenAdd` on `core`, the
  affix entries CLONED so the first generation is untouched. Learned: **a table entry earns its
  line by reusing an implemented habit** — twenty named guns cost no new behaviour code and are
  honest for exactly that reason. Still owed to M369: the maker grammar over factories (§19.2).
- ~~**M367** missiles ×5; зенитка in the loop~~ — 0.367.0 (2026-09-06): five ammo
  kinds off the launcher's own seed (обычная, роевая over `G.marks`, ЭМИ, торпеда, ловушка), the kind on the
  опись card, `mslFoeFire` from капитан up, `foeFlak` for rank ≥ 2 over missiles and plasma
  alike. Each kind is read off its trail — length,
  width, colour and the lure's blink — and a foe missile wears the red of a foe shot.
  **Deferred:** the missile is still one shape (a head and a flame); a torpedo silhouette of its
  own rides the drawing pass with the deserter art (M369a).
- ~~**M368** pirate loadouts by rank~~ — 0.368.0 (2026-09-06): `13d-loadout` holds the §5 table
  (guns, shield, tier per rank) and the foe side of nine habits — игольник, гарпун, лазер,
  сифон, импульсник, помеховая, рельса, кассетник, мины; the shield type comes from the
  table instead of the seed, and зенитка/пусковая are handed out by loadout (M367 had given
  flak to every captain — by the table it is the baron's). Barrels are baked from the loadout, so
  the rank reads before the first shot. `deserter` is set at spawn and read by nobody yet.
  **Deferred:** the deserter's hull and its painted-over number (M369a), and the loadout on the
  опись of a killed pirate — drops still come from the tier, not from what he actually carried.

**Stage B — the powers, by seed** (client only; the galaxy lives with no server)
- ~~**M369** the grammar layer (§19.4)~~ — 0.369.0 (2026-09-06): `03a-hull-maker` (the eight
  dimensions, six makers), `by` on every ship record and in the hull cache key, profile law +
  scheme filter + protrusions in `hullOf`, joints/surface/marks/lights in paint and draw, flame
  and trail signature, bank and engine hum; `12al-powers` (the §7.1 table, hail, emblem, flag —
  the player's is ГЛАВТРАССА whatever hull he flies); «Ялта» by seed at r≈6 with its three
  prohibitions; `makerRead()` in `28y-look` — **92.4 % over 630 hulls** — and the stand
  `docs/shot.py maker` (`?by=<key>` for one maker's hundred). Almanac issue IV.
  **Deferred:** the other four generators (M369a), the author's own naming of the six sheets on
  /dev, and the class's own appendages still meeting the hull in the old joint grammar.
- ~~**M369a** the same grammar in the other generators~~ — 0.369.1 (2026-09-06): one layer read
  by all five (D24) — `makerWidth`/`makerGround`/`makerAssembly` in `03a-hull-maker`; the barge
  takes the profile law, the ground, one protrusion and the weld seams (a Рассвет barge is three
  barges butted); the station takes the **assembly law** (rack, stack, ring, patch, spine, block)
  in `stationMods`; the pirate hull takes the maker's ground with the marks painted over and wear
  ×2, and a `deserter` gets the clean fresh rectangle instead of the crossed-out one; the fleet
  takes ground and flare and now carries `by`, so foreign wings need only that field; the dome
  glows in its builder's ground; six foreign books, one per power, and the power's food line in
  the cantina, greeting and accent in the station header, and its brand on foreign kit.
  **Deferred:** the poster on the node wall (it changes per сводка — M372), suits' own art, and
  the class appendages' joints.
- ~~**M369b** the having of things (§19.3)~~ — 0.369.2 (2026-09-06): parts carry `b` (§19.2 —
  name, a ±12 % affix bias, the card line; absent means ГЛАВТРАССА, so every part already issued
  reads unchanged and `PART_GEN` stays 2); a workshop stocks its own power's iron with about a
  quarter brought in; a foreign hull is not sold without an episode (`hasEpisode` asks a function
  that arrives with M374 and answers false until then), so today it is had by tow — a black
  derelict goes on the line, rides in the save, and a shipyard restores it for a price into
  `G.uniqueShips` with its `by`; the fuse takes the heavier parent's grammar and names the other;
  the picket notes a foreign hull under your own flag. **Deferred:** the gift (M374), the scrap
  pool per maker, and the card's frame by maker.
- ~~**M370** chronicle core~~ — 0.370.0 (2026-09-06): `12am-chron` (state, `step(N)`, replay from
  0, cache in `drift_war_v1`, FNV hash, clock from a chronicle epoch, geometry D12 with the six
  homes as an integer hexagon and «Ялта» at the centre) and `12am-chron-agents` (four needs in
  permille, relations, strength, six moves — deal, quarrel, war, truce, ally, build). A year of
  history replays in under a millisecond; owner chips and front edges are on the map's ВЛАДЕНИЯ
  layer. **Measured:** over 1460 сводки — 79 wars, 79 truces, 342 systems changing hands, no
  power above three quarters of the circle. **Deferred:** the ведомость step (M376), the
  циркуляр step (M381) and the Director (M371) — their places in `step()` are marked and empty.
- ~~**M371** the Director~~ — 0.371.0 (2026-09-06): `12am-chron-director` (tension with a real
  relief window — the first cut let incidents refill it the same сводка and a peak ran forty
  сводки instead of twelve; incidents that do not repeat a kind within ten; arcs of 4–20 with a
  forced ending; rites announced, three at a time; the season with its validator and «автопилот»;
  the guarantee that the galaxy is never quiet for more than four сводки) and `12am-chron-lines`
  (six voices over seven kinds of event, the receiver's wave with its own rate and pitch, the
  ЭФИР block on the board with «ДРУГАЯ ВОЛНА», war lines riding the receiver like every other
  rumour, and the front drawn as a dotted line along the border on the map). **Deferred:** the
  §15.1 families as mechanics (they are announced but do nothing yet — M382–M388) and the
  digest «чё там».
- ~~**M372** the war seen~~ — 0.372.0 (2026-09-06): `13d-npc` — a picket of the owner in the
  rear, two wings fighting each other on a front, spawned at jump-in and never resumed (D01), the
  cap of eight held, and the hull left over after their battle can be put on the tow line; the
  power branch of occupation (`occPowerAt`/`occReqMul`: for eight сводки after a flag change the
  prices rise a quarter, the station header says so, and a third of a holding's output goes to
  the new owner while the buildings keep working); «Ялта» with six embassies at anchor, six
  workshops on one counter at double price and no shooting at all. The chase line no longer
  counts bystanders — a battle you are not part of says so in its own words.
  **Deferred:** station bodies growing from build lines and domes appearing (there are no
  per-system build facts yet), the fair, and the six waves audible at once.
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
---

## 19. Everything has a maker (author, 2026-09-06)

> «ты же понял, да, что корабли фракций выглядят по-другому, дизайн всего в разных фракциях
> отличается, и всё можно добыть и купить от разных фракций»

§7.2 said «one silhouette generator, six conveyors» about the fleet. That was too small. The
rule: **every generated thing carries a maker (`by`, one of six), and a maker is a grammar of
form, not a coat of paint — and everything a maker makes can be had.**

### 19.1 The grammar — the second axis of the hull generator

`HULL_CLASS` (`03-ships`) is already «an inclination of the generator»: proportions plus one or
two details that stick out of the outline, so a class reads by silhouette at any scale. A maker
is the same kind of thing on a **second axis, orthogonal to class**: a courier of Орднунг and a
courier of Коммуна share the class bias and differ by the maker bias. Table `HULL_MAKER` in a
new module `03a-hull-maker`, read by `hullOf` and by the paint conveyor:

| maker | proportion bias | detail vocabulary (sticks out of the outline) | surface | marks and names |
|---|---|---|---|---|
| ГЛАВТРАССА | the catalogue as it is («по ГОСТу») | boxy nacelles, exposed ribs, a towing hook | санкирь + greys, stripe, wear ×1.3 | number + «изделие», the crew's nickname in quotes |
| Компания | −10 % width, rounded | smooth fairings, a fin with the logo, a running-line panel | white, blue stripe, gloss, wear ×.5 | the logo across the hull, a model name™ |
| Орднунг | +15 % length, flat sides | ribs every 8 px, hard chines, one turret plinth | grey steel, black ribs, no gradient | stencil numbers in three places, no name |
| Коммуна | −15 % width, +20 % length | extra curves, a long window band, a bowsprit | blue and white, soft gloss | a name, never a number; a pennant |
| Рассвет | +20 % width | patchwork plates of different hulls, welded braces, exposed tanks | ochre and black, hand-painted sides, wear ×1.6 | a painted sun; the name painted by hand |
| Хай-Фронт | −20 % width, +10 % length | antennas longer than the hull, light from under the plating, no wing | white with a red dot, underlight | one glyph; a version «v3.2» |

«Яхта» is a class (`yacht` exists), not a maker: a Коммуна yacht and a Компания yacht differ by
maker — so the «seventh conveyor» of §16.6 is the yacht class under six makers.

The same axis on everything else that is generated: **stations** (`17e-station-body`: the
family forms biased — Орднунг stacks, Коммуна arcs, Рассвет patchwork, Хай-Фронт masts,
Компания a logo block, ГЛАВТРАССА the rack and the drum as today); **barges** (`12l-barge`,
`12af-barge`: the maker's grammar on the barge class); **domes and strips** on planets (holding
§13: the maker's palette and one detail); **papers** (the wall and the shelf: each power's book —
устав, каталог, эссе, устная хроника, changelog — and its poster); **the station's greeting and
accent** (one header line and one colour accent per maker — not a reskin of the interface);
**suits** (`12x-suit` kits by maker); **food in the cantina** (one line per maker).

Craft rule: a grammar is a bias, not a style. Every maker's hull still obeys the codex — dark
ground, body in greys, glazes, wear under the highlights; one body, one outline, one light.
Verified the way classes were: **a hundred-hull sheet per maker**, six sheets, judged in the
almanac before M369 is called done; the test is «by silhouette at 8 px: class first, maker
second».

### 19.2 Parts by maker

Every part (`gun`, `shield`, `engine`, `hull`, `core`, `util`, `missile`) gets an optional `b`
in the compact format — `{s,t,k,g,b}`; absent = ГЛАВТРАССА, so every part already issued reads
unchanged; `PART_GEN` 2. The maker gives:
- **the name**: ГЛАВТРАССА «Двигательный блок ДБ-4», Компания «PowerCore™ 400», Орднунг
  «Triebwerk Typ 4/B», Коммуна «Moteur «Éloise»», Рассвет «мотор, собранный из трёх», Хай-Фронт
  «ENG-4 v2»;
- **an affix bias**: Компания — rate and thrust up, fuel and wear as the downside; Орднунг —
  damage and armour, a narrow cone; Коммуна — turn, see, energy; Рассвет — hull and cargo, cheap
  to scrap, spread as the downside; Хай-Фронт — see, lead rate, range, thin hull; ГЛАВТРАССА —
  hull and fuel, no downside and no upside;
- **a scrap pool** and the card's frame. A gun's seven numbers (§2) take the same bias on top of
  the family.

### 19.3 How it is had — one matrix for everything

| way | what | where | gate |
|---|---|---|---|
| **buy** | parts, base gun families, suits, a hull | the maker's shipyard / workshop at home; ×2 in «Ялта» | a hull needs one episode with the maker («разрешение на покупку»); ГЛАВТРАССА's guns never — «по разнарядке», through an acquaintance only |
| **loot** | the maker's parts and guns | its deserters, its pirates on its hulls, its wrecks after a front battle | none; the container rule (kill → chase → pick) |
| **tow** | a hull | a derelict after a front battle, towed to any dock: «восстановление» at a price, then it is yours (`G.uniqueShips` with `by`) | the tow line (§11.3) and a dock with a shipyard |
| **gift** | a hull «со списания», a named gun | an episode heavy enough (§6.2) | rare; once per maker per game |
| **find** | anything left behind | leftovers (§11.3), more often in «Ялта» | the §11.3 caps; clearance to mount |
| **fuse** | a hybrid hull | the lab's «сплав» (`03-ships` already fuses two hulls) | two hulls; the hybrid's grammar mixes both makers' biases — the one place two makers meet on one hull |

Flying a foreign hull changes nothing mechanical — the IFF is the transponder (D09). It changes
the hail: «На компанейском корпусе, а флаг наш? Записываю».
### 19.4 The grammar, deeper — what the generators must learn (author, 2026-09-06)

> «можешь на любом летать, но флаг наш… дизайны прям должны узнаваемо отличаться. Генератор
> расширить надо. У нас появляется дохерище кораблей, и станции, и всё меняется, абсолютно
> всё, у всех свой стиль»

**What exists, honestly.** Not one generator but five: the hull (`03a-hull-gen` — a
longitudinal profile of stations, a *scheme* of the airframe from `FORM_BY_CLASS` — swept, delta,
xwing, trident, twin, slab, boxed, disc — then class details; `03b` paint, `03c` luxe, `03d`
marks, `03e` draw, `03f` role), the fleet (`12ai-fleet`: thirteen classes from rects and
ellipses with the joints grammar of almanac III §8), barges (`12l-barge`), pirate hulls
(`12i-pirate-hull`), station bodies (`17e-station-body`: rack, drum, pods, hangar, tank, dish,
mast in three sizes). A «second axis» on `hullOf` alone would give six kinds of frigate and one
kind of everything else. So the maker is **one grammar layer that all five read** (D24).

**Eight dimensions of a maker.** Each is a *law*, not a number; a maker is recognisable when
at least the first three differ by silhouette and the rest agree with them.

| dimension | ГЛАВТРАССА | Компания | Орднунг | Коммуна | Рассвет | Хай-Фронт |
|---|---|---|---|---|---|---|
| **1 profile law** — how the half-width curve is built | stepped: ledges, a box amidships | one smooth bulge, capsule | straight segments, chamfers, flat sides | double curve, swan: narrow waist, long sweep | segmented: 3–5 modules of different widths butted with seams | spindle: thin symmetric ellipse, no notch |
| **2 scheme set** — which airframes the class may take | as today | twin, swept | slab, boxed, twin | swept, delta | boxed, twin, frame | trident, xwing, or none |
| **3 signature protrusions** — always present, outside the outline | towing hook, boxy nacelles, radiators | fin with the logo, running-line panel | turret plinth, rib comb along the spine | bowsprit, window band, pennant | exposed tanks, welded braces, plates of other hulls | antenna array longer than the hull, underlight strips |
| **4 joint grammar** — how anything meets the hull | хомут + пластина (almanac III §8) | flush fairing, no visible joint | bolted flange with four bolts | sculpted fillet | weld bead | a dark gap — the part floats a pixel off |
| **5 surface** — ground, greys, glaze, gloss, wear | санкирь, greys, stripe, wear ×1.3 | white, blue stripe, gloss, wear ×.5 | grey steel, black ribs, matte, no gradient | blue and white, soft gloss | ochre and black, hand-painted, wear ×1.6 | white, red dot, satin |
| **6 marks and lights** | number, «изделие», nickname; two amber lamps | logo across the hull, model™; running line | stencil numbers ×3, no name; no lights | a name, a pennant; the window band lit | a painted sun, the name by hand; one lantern | one glyph, «v3.2»; underlight |
| **7 engine signature** — flare and trail in flight | wide orange flare, sooty trail | twin blue-white, clean | short hard white, no trail | long soft violet | smoky yellow with sparks | thin cyan, pulsed, no flare |
| **8 sound and motion** | low hum, banks moderately | smooth mid hum, banks wide | hard drone, no bank, crisp turns | soft chord, banks wide and slow | rattling saw, sparks on turn | near-silent whine, instant turns |

Dimension 8 is small on purpose: motion stays within the class's `turn` — a maker changes the
*bank* and the *sound*, never the numbers a player paid for.

**Count.** Seven classes × five or six schemes × six makers ≈ 250 silhouettes before the seed
moves a single station of the profile; with seeds, thousands, and every one says its class first
and its maker second. That is «дохерище кораблей» without a second art department.

**The same eight on the other generators:**
- **fleet (`12ai`)** — its thirteen classes take dimensions 3–8 from the maker (the fleet's own
  joints grammar becomes ГЛАВТРАССА's row of dimension 4); the profile law bends its rects and
  ellipses (steps / capsule / chamfers / swan / modules / spindle).
- **barges (`12l`)** — profile law, protrusions, surface, lights; a Рассвет barge is visibly
  three barges welded together, a Компания barge is a white capsule with the logo.
- **pirate hulls and deserters (`12i`)** — the maker's grammar with marks *stripped* (the number
  painted over, the logo scratched) and wear ×2: whose hull, that grammar, and it reads as stolen.
- **station bodies (`17e`)** — an **assembly law** per maker (ГЛАВТРАССА: rack and drum
  stacked; Компания: a logo block with pods around; Орднунг: a stack, every module the same
  width; Коммуна: arcs and a ring; Рассвет: patchwork of unequal modules on a truss; Хай-Фронт:
  one spine, masts and dishes), the forms subset, surface, lights, joints.
- **domes and strips** (holding §13) — surface and one protrusion (Компания's dome carries the
  logo; Орднунг's is a grid; Коммуна's a glass arc; Рассвет's a cluster of small domes; Хай-Фронт's
  a dark dome lit from below).
- **papers** — the book on the shelf and the poster on the wall in the maker's typographic
  habit (ГЛАВТРАССА's stencil, Компания's trademark, Орднунг's paragraph numbers, Коммуна's
  italics, Рассвет's hand lettering, Хай-Фронт's version strings); one accent colour and one
  header line on the maker's station screens; one line of food in the cantina; suits by maker.

**Measured, not argued (D24).** `makerRead(seed, cls, maker)` renders the hull at 8 px and
takes silhouette descriptors — aspect, convexity defect, protrusion count and spread, symmetry,
step count along the outline — and a small fixed decision tree must name the maker with ≥ 90 %
accuracy over a hundred seeds per class, class held constant. Below that the grammar is not
recognisable and the pass is not done, whatever the sheet looks like. The six hundred-hull
sheets go to the almanac for the craft verdict on top of the number (the codex still rules:
dark ground, body in greys, glazes, wear under highlights; one body, one outline, one light).

**Flag, not hull.** You may fly any of them; the transponder stays ГЛАВТРАССА's (D09). The
picket reads the hull first and the flag second, and says so.
---

## 20. Наряды — one brief per pass, for a session that starts cold (2026-09-06)

The author: «в плане всё с подробными инструкциями есть? могу в новом диалоге отдавать всё на
реализацию?». Each brief below is what a fresh session needs and nothing more: **read** (the
sections and the symbols — grep `docs/INDEX.md` for a symbol, then `Read` with an offset; never
the whole of §1–§15), **build**, **settled** (do not re-decide), **tests**, **measure**, **done
when**. Version numbers and the «done» line go into `PLAN.md` when a pass closes, as always.
Stage C briefs are shorter on purpose: they are refined when stage B closes, by the session
that closes it.

### Handoff protocol

1. Take the first open pass in §18. Read its brief here, then only what the brief names.
2. Build. Run the named suites and `test.ps1`; for anything drawn, the codex pass and the
   almanac line; for anything on the phone, `test.ps1 -Mobile` and the 44 px sweep.
3. Measure what the brief says (`prof()`, `?g11` via `docs/g11.ps1`, `look()`, `makerRead()`).
4. `dev.ps1`, look at /dev on a phone, then one commit per pass with `VER` bumped, push, and
   `docs/live.ps1` to confirm the site took it.
5. Strike the pass in §18 and in `PLAN.md` with its version; if something was learned that
   changes a later brief, edit that brief in the same commit.
6. Never reopen §17; the forks of §10 keep their defaults unless the author says otherwise.

### Stage A — the fight

**M360 · helm and lock**
- *Read:* §1 whole, §16.1 (helm row), D07, D08, D16, §10 forks. Symbols: `keys`, `KMAP`,
  `KMAP_BELT`, `mergeKeyMap`, `padsFit`, `applyPadSize`, the `ptr` map, `tap`, `endPtr`
  (`15-input`); the helm block of `updateSystem` in `17-mode-system` (`sh.av`, `acc`/`lim`,
  thrust/brake, `maxSp`, the velocity-to-nose drift); the fire block of `updateCombat` and
  `fireCool` (`13-pirates`); `runAutopilot` (`16-flight`); the `.pads` rows in `src/index.html`
  and their CSS in `docs/base.html`; `docs/DESIGN-ui.md` (the three rules); `lookScenes`.
- *Build:* `G.ctl = {head, tx, ty, lock, fire, msl, headIdle}` written by three inputs and read
  only by the system mode. Heading follows `G.ctl.head` at `st.turn` with no ramp and no coast;
  `sh.bank` is drawn from the actual turn rate. Thrust vector in screen axes: full along the
  nose, `.4` through thrusters, the nose drift off while thrusters are used; release under
  `.55·maxSp` = brake as ТОРМОЗ does, above = coast. Marks: `G.marks` (≤3, ephemeral), tap/click
  within 40 px screen, Tab nearest aware hostile / cycle, Esc clear, auto-lock on the shooter
  when nothing is locked. Autofire on today's `st.dmg`/`st.cool` when the primary mark is
  within a provisional ±20° cone and 760 px (both replaced in M362); the nose tracks the mark
  only while `headIdle` (stick released, cursor still .5 s, no ← →). Phone: two floating sticks
  (left half heading, right half thrust; origin under the thumb; dead zone 12 px; fade on
  release); the system-mode pad row keeps ДЕЙСТВИЕ, ВЗЛЁТ, РАКЕТА and gains ЦЕЛЬ; ◀ ▶ ▲ ТОРМОЗ
  ОГОНЬ leave it; other modes untouched. Keyboard: mouse scheme (nose to cursor, WASD screen
  axes, click lock, LMB forced fire, RMB missile, Shift thrusters) and arrows scheme (← → turn,
  ↑ thrust, ↓ reverse, Q/E strafe, Space forced fire, G missile); last used wins. Autopilot and
  orbit drop on any heading/thrust input. `placeNote("hurt")` once per engagement.
- *Settled:* screen axes for the right stick; `.55` threshold; both keyboard schemes live; no
  inertia anywhere in the helm.
- *Tests:* new `tests/91zzzw-helm.js` — each input writes the same channels; the override rule;
  the release rule at frame steps 1, 2, 3 (as `91zzzzy-phys` does); no coast after release of
  ← →; marks cap and auto-lock; belt/landing/scoop still read `keys`. `91a-flight`, `91f-ui`,
  `91zzx-mobile` (sticks never overlap the rail or the pads; 44 px), `91zzy-screens`, the fuzzer.
- *Measure:* `test.ps1 -Mobile`; /dev on a phone; `prof()` unchanged.
- *Done when:* a pirate is locked by a tap and shot without touching fire; the ship stops on
  release; an old save loads; the phone sweep is green.

**M361 · ships shoot each other, roles**
- *Read:* §5, §0 law 6, D09 (the hook only), §16.1 (sky row). Symbols: `spawnPirates`,
  `updateCombat` (the pirate loop and the shots loop), `killPirate`, `drawCombat`,
  `PIRATE_RANKS` (`13-pirates`); `drawPirate`, `pirateArtOf` (`12i-pirate-hull`);
  `bargeMineHit` (`12l-barge`); `battTick` (`21d-battery`); `mslTick` (`16b-missile`);
  `rogueSpawn`/`huntSpawn`/`rivalSpawn` callers; `fleetEscortActive`.
- *Build:* split `13-pirates` into `13-combat` (shots with `owner` ∈ player | pirate | fleet |
  power:k; every pair resolved in one loop; hit location ×1.6 behind / ×.7 ahead by the angle
  to the target's nose), `13c-roles` (behaviour per rank: шакал dashes, salvos, breaks off,
  flees under 30 %; ветеран holds 400–600 and circles broadside; капитан never under 700;
  барон stands, bursts, calls two шакалы at 50 %), the rest stays in `13-pirates`. Hull bar and
  name over the primary mark and over any aware pirate. A pirate under 25 % with no ally jumps
  out in 3–4 s: bounty lost, one log line. An `iff` flag on every ship record; the fleet's ships
  are `iff:true`; lock, autofire and forced fire skip `iff:true`. Cap: eight armed ships.
- *Settled:* roles as §5; no boarding; the rogue, hunter and rival keep their own exits.
- *Tests:* new `tests/91zzzw-combat.js` — owner resolution (pirate hits pirate, fleet hits
  pirate); each role's distance band over 600 frames; the rear multiplier; flee; `iff` skip;
  the cap. `91e-rogue`, `91r-hunter`, `91z-missile`, `91n-barge` stay green.
- *Measure:* `prof()` with eight armed ships on the phone layout — the first number of the
  whole layer; write it in `PLAN.md`.
- *Done when:* a шакал dashes and flees, a барон calls two, a fleet ship cannot be locked.

**M362 · energy and the seven numbers, three shields**
- *Read:* §2 (the table), §4 (energy, shields, hit location), D17. Symbols: `stat()` in
  `08-state` (`armed`, `dmg`, `cool`, `see`, `shieldMax`, `shieldRegen`, the `weapon` mod);
  `MODS.weapon` (`04-mods`); `PART_KINDS.core`, `AFFIX` (`05-parts`); `fireShot` and the shield
  regen in `updateCombat`; the «урон · откат» line in `26b-ui-station-work`; `27-ui-ship`.
- *Build:* the gun as seven numbers in `stat()` from today's inputs (damage+type, rate, range
  760, shot speed 9, cone 20°, lead rate .2 rad/frame, spread from tier); a barrel angle state
  per mount that leads the mark inside the cone at the lead rate; honest lead for projectiles;
  the miss as an angular error added to the shot (visible), not a hidden roll. `G.energy` with
  capacity and regen from the reactor level (`weapon` mod renamed in text to «реактор»; `core`
  affixes add); costs: a shot, shield regen, thrusters; empty → rate ½, shield stops, thrusters
  ½; a bar under hull/shield in the HUD. Shield type on the shield part from its seed —
  сплошной / лобовой (×2 front, 0 behind) / импульсный (no regen, whole every 20 s) — with a
  delay after a hit; pirates by rank (§5). Kinetic full/half, energy the reverse, blast even.
- *Settled:* one bar, nothing to vent; the damage-type matrix; numbers as §2.
- *Tests:* `91zzzw-combat` — drain and regen, the empty rule, the three shield behaviours,
  hit location × damage type; `91zj-instr`, `91zn-instr-kit` (`instrKnock` still fires);
  `91zzzzz-e2e-life` save round trip with the new fields.
- *Done when:* the card shows seven numbers, the bar moves, a лобовой pirate dies twice as
  fast from behind.

**M363 · ОСНАСТКА, clearance, groups**
- *Read:* §3, §11.4, D14, D15, §19.2 (the `b` field). Symbols: `genPart`, `PART_KINDS`,
  `AFFIX`, the gun candidates on wings/nose, `fittedParts`, `addPart`, `scrapYield`
  (`05-parts`); `stationParts`, `craftPart` (`03-ships`); the ОСНАСТКА tab
  (`26b-ui-station-work`); `27-ui-ship`; the опись (`27j-ui-opis`); the exam (`12aj-coop`).
- *Build:* slot size L/M/H and type жёсткая/турель on each hull point (warship: hardpoints on
  the nose; others turrets; size by hull mass); the dock screen — the silhouette with points,
  tap → the list from the hold that fits; barrels drawn over the hull (`03e`) and turning with
  the lead; card against card with deltas and three totals (урон/с по корпусу, по щиту, на
  энергию); стрельбище — a target barge at every dock, «проверить» flies out for 60 s and
  returns; groups 1–3 («всё», «дальнее», «ближнее»; autofire picks the group in range/cone);
  `G.clearance` I–IV with the §11.4 gates (II: the cooperative's exam + ten kills; III: hours
  only until episodes exist — M374; IV waits for M374/M380); опечатано in the опись with what
  it waits for; parts read an optional `b` (absent = ГЛАВТРАССА).
- *Settled:* sizes and types as §3.1; `PART_GEN` stays 1 (2 comes with M364).
- *Tests:* `91zzzw-combat` — fit rules, clearance gates, group choice; `91f-ui`,
  `91x-ui-fixes` (the new screen, 44 px); the fuzzer's tab sweep.
- *Done when:* a gun moves between two points at the dock, a sealed gun says what it waits for,
  the range works.

**M364–M366 · twenty families, seven a pass**
- *Read:* §2.1 (the families of the pass), §2.2, §19.2, D14; almanac §8 joints for the
  barrels. Symbols: `genPart` (branch `g===2`), `AFFIX`/`AFFIX_BAD`, `affVal` (`05-parts`);
  `fireShot`; `sfx` (`09-audio`); the barrel overlay of M363.
- *Build:* `05b-guns` — `GUN_FAMILY` (base seven numbers, size, mount, energy, effect key),
  `GUN_FACTORY` per maker, `GUN_SERIES` years, names («АП-23 «Оса»»), the именные list (20,
  fixed effect, a story line); `13a-guns` — per-family fire and effect code: projectile, beam,
  needles, pierce, arc-jump, splash, tether, shove, mine, jam, heat/burn, homing bullets,
  flak, ram; `13-combat` — effect state on ships (burn, heat, knock, shield-drop, tether).
  New affixes range/cone/lead/energy/burn/knock, downsides spread/energy. A timbre per family.
  **M364:** автопушка, тяжёлое, рельса, дробовик, лазер, тепловик, наводящиеся. **M365:**
  игольник, сифон, импульсник, буровой, толкатель, миномёт, помеховая. **M366:** гарпун,
  кассетник, дуговик, плазмомёт, зенитка, таран; the именные; factories and series.
- *Settled:* the §2.1 lines are the spec; energy so that four rails cannot fire together;
  parts with `g:1` regenerate unchanged (a fixture of twenty seeds).
- *Tests:* one behaviour test per family (the rail pierces; the laser's burn threshold; needles
  pass the shield with p; the arc jumps ≤2; the mine's minute; the jam's awareness; flak hits
  missiles; ram damage by speed); `91zzzzy-names` reads every family/factory id from code («a
  perk without code is a lie»); the g:1 fixture.
- *Measure:* `prof()` with beams on screen.
- *Done when:* each family changes how you fly — the §2.1 line is true in play.

**M367 · missiles ×5, зенитка in the loop**
- *Read:* §4 (missiles), §2.1 #17. Symbols: `mslFire`, `mslTick`, `MSL_LIFE` (`16b-missile`);
  the `missile` kind (`05-parts`); the hold (`12ab-hold`, `27j-ui-hold`).
- *Build:* ammo type on the launcher (обычная, роевая over `G.marks`, ЭМИ shield→0 + stun 2 s,
  торпеда slow/dumb/huge, ловушка decoys); pirates from капитан up fire missiles; зенитка
  auto-targets missiles and plasma.
- *Tests:* `91z-missile` extended. *Done when:* a captain's missile is decoyed and a torpedo
  shot down.

**M368 · pirate loadouts by rank**
- *Read:* §5 (the table). Symbols: `spawnPirates`, `PIRATE_RANKS`, `13c-roles`,
  `12i-pirate-hull` (mount points, barrels).
- *Build:* loadouts and shield types per rank from `05b-guns`; the captain's помеховая on the
  player's lock; the baron's mines astern; a `deserter` flag prepared (art in M369a).
- *Tests:* `91zzzw-combat` loadouts. *Done when:* the rank reads by barrels before the first shot.

### Stage B — the powers, by seed

**M369 · the maker grammar on hulls, «Ялта» as a place**
- *Read:* §7.1–7.3, §16.6, §19.1, §19.4, D12, D22, D24; `docs/DESIGN-craft.md` §1, §13;
  `docs/ALMANAC.md` (how an issue is written). Symbols: `HULL_CLASS`, `hullClassOf`
  (`03-ships`); `hullOf` — the profile build and `FORM_BY_CLASS` (`03a-hull-gen`);
  `03b-hull-paint`, `03d-hull-marks`, `drawHull` (`03e`); `fleetGlyph` (`12ai-fleet`, the
  emblem construction); the engine flare in `17-mode-system` and the trail in `16-flight`;
  `sfx` engine hum; `lookScenes`/`look()` (`28y-look`); `docs/shot.py`.
- *Build:* `03a-hull-maker` — `HULL_MAKER` with the eight dimensions of §19.4; `by` on ship
  records (`SHIPS` = 0 ГЛАВТРАССА; `G.uniqueShips`, `NPC_SHIPS` carry it; the hull cache key
  includes it); profile law, scheme filter and protrusions in `hullOf`; joints, surface, marks,
  lights in paint/marks/draw; engine signature and bank/sound. `12al-powers` — the table of §7.1
  (ru, from, wants, doctrine families, emblem, hail line, wave voice params). IFF full: an
  allegiance flag on every ship, the player's = ГЛАВТРАССА. «Ялта»: its coordinates by seed at
  r ≈ 6 in `01-core`/`06-galaxy`, flags no-pirates / sealed weapons / never a front (its
  content comes in M372). `makerRead()` in `28y-look` and a stand `docs/shot.py maker` for six
  hundred-hull sheets.
- *Settled:* the §19.4 rows; the §7.1 names; six makers, no seventh; the yacht is a class.
- *Tests:* `91j-art` — `makerRead()` ≥ 90 % over a hundred seeds per class; `91l-fleet` green;
  a hull's geometry is identical for the same seed and maker across two calls.
- *Measure:* the six sheets and `look()` on a mixed-maker system frame go to the almanac as
  a new issue before the pass closes.
- *Done when:* at 8 px a stranger's hull says its maker at first glance and its class a
  moment later (§0 law 7): `makerRead()` ≥ 90 %, and the author names every row of the six
  sheets on /dev without a label. The almanac records both.

**M369a · the grammar in the other generators**
- *Read:* §19.4 («the same eight on the other generators»), holding §13. Symbols: `fleetArtOf`
  and its `joints` (`12ai-fleet`); `drawBarge` and the barge build (`12l-barge`, `12af-barge`);
  `pirateArtOf`, `drawPirate` (`12i`); `drawStationBody` (`17c-system-draw`) and the family
  forms (`17e-station-body`); the planet dome/strip draw; `BOOKS` (`12ub-books`); the wall
  (`11ah-wall`); the station header (`26-ui-station`); the cantina (`27d-ui-cantina`); suits
  (`12x-suit`).
- *Build:* dimensions 3–8 in the fleet; profile law/protrusions/surface/lights on barges;
  stripped marks and wear ×2 on pirate hulls (`deserter`); the assembly law per maker on
  station bodies; domes; six books and six posters; one accent and one header line per maker
  on station screens; one cantina line; suit kits by maker.
- *Tests:* `91l-fleet`, `91n-barge`, `91x-hold-*`, `91zzzn-books`, `91j-art` for the station
  bodies. *Done when:* a Рассвет barge reads as three welded barges and a Хай-Фронт station as
  a spine with masts.

**M369b · the having of things**
- *Read:* §19.3, D14, D09. Symbols: `stationParts`, `stationUniqueOffer`, `fuseShips`
  (`03-ships`); the workshop tab (`26b`); the derelict (`12ai-fleet`); `fleetHailFirst`.
- *Build:* workshops sell by the station's power; hulls at a maker's shipyard behind an episode
  (a stub `hasEpisode(maker)` = false until M374, so hulls are had only by tow and in «Ялта»
  at ×2); tow-and-restore: a derelict towed to a dock → «восстановление» at a price →
  `G.uniqueShips` with `by`; the fuse mixes both makers' biases; the hail line about a foreign
  hull; the gift hook (fires from M374).
- *Tests:* `91zzzw-combat` (restore path), `91l-fleet`. *Done when:* a towed Орднунг wreck is
  your ship at a dock and the picket comments.

**M370 · the chronicle core**
- *Read:* §7.4–7.5, §16.2–16.4, D01–D06, D12. Symbols: `hashi`, `rng` (`01-core`);
  `snapshot`/`applySave` (`14-save` — the chronicle is never in the save); the ВЛАДЕНИЯ strip
  (`18b-map-hold`); `test-node.js` and `NODE_BROWSER` (`90-harness`).
- *Build:* `12am-chron` — `CHRON`, `step(N)` with parts 4–6 (agents, fronts, limiters; the
  Director stubbed), replay from 0, the cache after the last closed сводка, a hash (FNV over the
  serialised integer state), the clock offset (local until M376), geometry D12 with «Ялта»,
  `drift_war_v1`, lines emitted in ГЛАВТРАССА's voice only; `12am-chron-agents` — needs,
  relations, strength, the moves; owner chips on the map.
- *Settled:* integers in permille; the saturation table; no transcendental `Math.*` in the
  module (a test greps the source).
- *Tests:* new `tests/91zzzw-chron.js` — replay twice = same hash; a Node-vs-browser fixture
  hash; limiters hold over 2000 steps; «Ялта» never changes hands; the source has no
  `Math.exp/sin/cos/pow`. *Done when:* the map shows six owners and the fronts move by the
  hour, identically in two tabs.

**M371 · the Director, six voices**
- *Read:* §15 (table, limiters, season), §7.3 (voices), §14 (announce only). Symbols:
  `12p-news`, `11t-rumours`, the receiver and `speechSynthesis` settings (`12pa-beacon`),
  `drawFleetMap`.
- *Build:* `12am-chron-director` — tension, the roll table, incidents, arcs with default
  endings, rites announced, limiters, the season object with «автопилот»; `12am-chron-lines` —
  templates ×6 voices; six waves in the receiver (a selector; voice as rate/pitch); news and
  rumours read lines; the front as a dotted line on the map.
- *Tests:* `91zzzw-chron` — a month without ведомости shows ≥1 event per 4 сводки; peaks ≤3
  days; arcs end ≤20; a bad season is ignored; `91s-news`, `91zzh-receiver`. *Done when:*
  turning the wave gives six versions of one сводка.

**M372 · the war seen**
- *Read:* §7.4 (the four states), §16.6 (content), D10, D11, §19.3 (tow). Symbols:
  `13b-occupy` (`occLvl`, `occKill`), `drawStationBody`, the planet draw, `12l-barge` lanes,
  `fleetInteract` (embassies), the hold's output (`12ab-hold`, `12ag-holdfx`).
- *Build:* `13d-npc` — pickets, wings and battles at jump-in from chronicle facts (≤8, both
  sides fire using M361); the power branch of occupation (flag, prices, staff lines, picket;
  the player's buildings keep working with 30 % requisitioned); station bodies grow and domes
  appear from build lines; «Ялта» at its maximum — six embassies, six workshops, six waves at
  once, barges of six, the fair; wrecks after battles → the tow path.
- *Tests:* `91zzzw-combat` (a jump-in battle ends by itself; ≤8), `91x-hold*` (requisition),
  the «Ялта» flags. *Measure:* `prof()` with eight ships and a full station body. *Done when:*
  you jump into a front and watch a fight you were not part of; «Ялта» flies six flags.

~~**M373 · the four rules and the hail**~~ — 0.373.0 (2026-09-06): `12ar-hail` — the hail once
per system per half-hour, two answers on the two buttons already under the thumb (ДЕЙСТВИЕ
«проходом», ЦЕЛЬ «по делу») and silence as the third; silence once warns, twice draws fire; the
four rules enforced where they happen — a shot at a picket in `hitShip`, a cassette stamped by
their enemy checked at the answer (ammo is stamped by the station that assembled it, and the
stamp is on the lab's line), a blockade that answers «стоять» to «проходом» and counts leaving as
running. Anger is local: those who saw it shoot, and the chronicle knows nothing — that memory
travels with M374.

**M374 · episodes and the notebook** — *Read* §6.2–6.3, D15, D17. Symbols: `heardYours`,
`parrotHas` (`12x-parrot`), the трасса lanes (`18b-map-hold`), the desk pages (`27e-ui-home`).
*Build* `12ap-notebook`: episode kinds and weights bound to named people; the travel along the
lanes on the rumour clock; witnesses (a surviving hull in see range, or the parrot);
resolution = the heaviest episode that reached this place; the notebook page (12, asks once per
сводка); «не простил»; clearance III/IV gates real; the hull-purchase gate real; the gift.
*Tests* new `tests/91zzzw-notebook.js`. *Done when:* a picket you never met greets you by a deed.

**M375 · the rescuer** — *Read* §6.4. *Build:* signals after front battles for six makers
(`fleetInteract` «идти на сигнал» generalised); tow / refuel / crew off a derelict earn
episodes with both sides. *Done when:* two towed hulls after one battle give two episodes from
two powers.

### Stage C — everyone (refine these briefs when stage B closes)

**M376 · `war.php` and ведомости** — *Read* §13, §16.3–16.4, D01–D06; `docs/DEPLOY.md`;
`site/api.php` (the token, the atomic write, the postcard ops as the pattern). *Build* the
server: the file layout of §13, `pull`/`put`, monthly bundles in the web root, caps per account
per kind per сводка, saturation by accounts (the table), the fuse at close, the hash log, the
digest CLI; the client `14b-war-net`: pull at load and at jump-in, ведомости applied in step 1,
`put` for deeds (defence kill, delivery into a need, tow, escort), the offset from the `Date`
header, `drift_war_v1`. *Tests* new `tests/91zzzw-net.js` with a mocked fetch (shapes, caps,
saturation); on the server `php -l` and a curl round trip over ssh. Deploy with
`deploy.ps1 -SiteOnly`, confirm with `docs/live.ps1`. *Done when:* two browsers on /dev see the
same front move after one of them fought.

**M377 · leftovers and ghosts** — §11.3, D14, D19; ops `left`/`take`; the container draw of
`killPirate` reused; благодарность in the трудовая книжка; ghosts from the postcard snapshot
(`25g-postcard`) drawn in `17c`; the entry in `docs/DESIGN-online-risks.md`.

**M378 · votes, elections, сигнал сбора** — §12 (elections), §11.2 (the signal); op `vote`;
the Director reads votes at close; «СБОР» as a map mark (`18a-map-addr`); all six waves read it.

**M379 · the nine rites** — §14; counter kinds; effects in `step`; six colourings in lines;
the regatta from «Ялта».

**M380 · «Ревизия»** — §11.1–11.2, D13; op `boss`; the dreadnought (a fleet class in ГЛАВТРАССА's
grammar with wear ×3 and no marks); the rolling 60 s window; the deadline; «закреплено»; loot
for participants; the clearance IV shortcut.

**M381 · циркуляры and the constitution** — §12, D18; the shared validator
(`12am-chron-circ`); `docs/WAR-CONSTITUTION.md` and its test; the digest → the season; the
regulator's monthly session as a documented procedure (`tools/war-season.ps1`: digest over
ssh, a circ file back); the server fuse.

**M382–M388 · the Director's mechanics** — §15.1, one family a pass in this order: economy,
society, nature, power, diplomacy, security, culture. Each: chronicle kinds, the visible effect
in the sky or at the station, lines ×6, tests in `91zzzw-chron`.

