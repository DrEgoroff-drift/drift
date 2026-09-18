# Whose land is this — the powers you can feel (2026-09-14)

> **Reviewed the same day — `docs/DESIGN-review-2026-09-14.md` wins where it differs:** M452 is the
> first ship's gesture, the post is one body with six dressings in the background; the six musical
> modes become a motif each; the trust rating and the law-of-the-land table as a system are cut.

The author, 14.09.2026: «нравятся расы [Remember Tomorrow], у нас фракции, добавим характер —
сейчас в мире нет ничего, чтобы было понятно, что ты у другой фракции, надо придумать». The design
and the queue M452–M458; nothing is built yet. The powers themselves (who they are, what they want,
the satire) are `docs/DESIGN-war.md` §7 and `12al-powers` — this document does not change them, it
puts them *into the world*. Companion: `docs/DESIGN-shipyard.md` §4 (each power's yard).

## 0. What is there today, and why it does not read

The table in `12al-powers` is rich: doctrine, weapon families, emblem, hail, the line on air, what
it never says, food, paper, suit, voice. Almost none of it reaches the flight:

| channel | today | why it does not read |
|---|---|---|
| hulls by maker | six form grammars (`03a-hull-maker`) | the only strong one, and only when a power's ship is on screen |
| picket at the jump point | 2–3 ships in the rear (`13d-npc`) | stands still; arrive elsewhere and you never see it |
| hail | once per 30 min, a picket within 900 px (`12ar-hail`) | reactive, often missed |
| station | one tint from `station.by` (`17e-station-body`) | every station has the same body |
| traffic | `17f-sys-traffic` | does not know the owner at all |
| fresh occupation | a red line in the station header | only docked, only for 8 сводки |
| map | an emblem chip ≤ 7.5 px (`18b-map-hold`) | unreadable on a phone |
| music | `10-music` | ignores the power |
| peacetime fleet | субботник, strike exist as Director mechanics (`12au-rites`, `12ay-fx-soc`) | news only, never seen in flight |

## 1. Laws

1. **Five seconds, five minutes, the map.** Five seconds after the jump you know whose system it is
   without reading anything. In five minutes you know how they live. On the map the border is a
   line you could trace with a finger.
2. **Character is behaviour and things, not labels.** Seen before told (craft §13). One word is
   allowed, once, and it is paper: the stamp (§3).
3. **No colour-coding of the world.** Six colours on a phone are noise (holding §13's finding). Each
   power is a **shape grammar + one light + one motion + one voice**. Their colours stay accents.
4. **Satire on the state, never on people** (§7.1). The staff, the tug crew, the mechanic are
   decent; the post, the form, the receipt, the broadcast are the joke.
5. **Occupation is visible on the thing.** A post or a station that changed hands shows it: the old
   emblem painted over, the new stencilled crooked on top.
6. **Painted once.** Posts, stations and borders are layers or chunks (the cross-cutting rule);
   only the light's motion and the living ships move.

## 2. The six, channel by channel

Each column is one channel; each row is what a power puts into it.

### 2.1 The post at the jump point — the first thing after the jump

| power | the post | its light and motion |
|---|---|---|
| **ГЛАВТРАССА** | **пост трассы**: a striped шлагбаум floating across the arrival, a booth with a red star, a banner with a slogan that changes each сводка («Трасса — дело каждого», «Порожний рейс — позор водителю») | the star lit steady; two amber flashers turning (motion, not blinking); the boom lifts as you pass |
| **Компания** | **billboard buoy**: a screen larger than the station's dock, «Добро пожаловать в зону партнёра™», a toll arch | the running line — the only saturated thing in the frame, moving along the screen |
| **Орднунг** | **customs gantry**: two rails, a frame you pass through, numbered buoys marking a speed ring | even white floods; a scanning plane that sweeps down your hull while you are inside the frame |
| **Коммуна** | **a graceful arch — and nobody there**: by the hour, «ЗАКРЫТО — ОБЕД» or «ЗАБАСТОВКА» on a hand-lettered board, a café table with two chairs floating beside | a slow warm pulse like breathing; a garland of lanterns swaying |
| **Рассвет** | **a buoy welded from three wrecks**, hand-painted «ЗАХОДИ, БРАТ», a sun on its side, a mechanic drone parked on it | warm irregular lamps; the painted sun turning slowly |
| **Хай-Фронт** | **relay mast**, antennas longer than a hull, one camera eye | the eye **turns to follow your ship** the whole time you are near; a thin red line sweeps across you once |

Rear systems carry the post; **front** systems carry a burning one (and the battle already there);
**fresh occupation** carries the loser's post with the emblem painted over (law 5); **Ялта** carries
all six in a ring, weapons sealed. Pirates put nothing up; their «post» is a wreck with «Гони груз»
scratched on it.

### 2.2 The stamp — the one word

On the first system across a border (from one owner to another, or from the wild into a power),
a stamp **lands across the screen for 1.2 s** and goes into ТРУДОВАЯ КНИЖКА on a new page
**ОТМЕТКИ О ПРОЕЗДЕ** (the КНИЖКА channel; P14 wants it to be a real document — this is its first
real page). Each power's paper (`POWERS[k].paper`) sets the stamp:

- **ГЛАВТРАССА** — violet stencil, «ОТМЕТКА О ПРОЕЗДЕ · ПОСТ № 17», a signature of the замполит;
- **Компания** — **not a stamp, a receipt**: a till slip with the logo™, «ВЪЕЗД — 0 кр. (акция)», «спасибо за выбор»;
- **Орднунг** — black, numbered paragraph, «Экз. 1 из 3», time to the minute;
- **Коммуна** — blue ink, italic, a flourish, one line of a poem, the date slightly wrong;
- **Рассвет** — handwritten ochre, a sun drawn by hand, sometimes a thumbprint;
- **Хай-Фронт** — a dot matrix, «v4.1», your trust rating as a number.

Six stamps + Ялта + the pirates' scratch = a page to fill, and a reason to cross a border.

### 2.3 The station and its traffic

- **Station body by its builder** (`17e-station-body` already knows `station.by`): the maker
  grammar applied to the station — profile law, seams, marks, ground (the same eight dimensions as
  the hulls: ГЛАВТРАССА slabs and stencils, Компания white capsules with the logo across, Орднунг
  grey steel and black ribs, numbered; Коммуна long curves; Рассвет patchwork, every side painted;
  Хай-Фронт white, minimal, a red dot, light from under the plating).
- **Traffic by the owner** (`17f-sys-traffic`): seven of ten ships from the owner's maker, three
  from the neighbours. A border system mixes; a heartland is uniform — you feel the gradient.

### 2.4 The peacetime fleet — §7.3 made visible

DESIGN-war §7.3 already wrote what each fleet does when there is no war. Now it happens in flight:

| power | what you see |
|---|---|
| ГЛАВТРАССА | **субботник**: tugs pushing belt debris out of the lane; a barge convoy with an escort |
| Компания | ad hulls with running lines; hired «security contractors» (pirate hulls under the ring) |
| Орднунг | **an inspection**: a patrol pair holding a trader, a scan line across it; stop near a beacon and you get a ticket |
| Коммуна | **the strike**: the fleet in a neat line, lights low, crews at the station (the cantina is full) |
| Рассвет | **a repair tug** that comes to *any* damaged ship — yours too — and patches it, a small fee or none |
| Хай-Фронт | **a reboot**: a line of ships whose lights go out and come back one by one; small watcher drones |

### 2.5 The law of the land — one rule each (the Remember Tomorrow race trait)

A power's character is felt in the hands through one rule, small enough never to block play:

| power | the law | the thing it gives you |
|---|---|---|
| **ГЛАВТРАССА** | **норма**: fuel for kopecks, but a counter sells a norm per visit («по разнарядке») | the cheapest fuel in the galaxy |
| **Компания** | **пошлина**: docking 40 cr; nothing is contraband if the fee is paid | the best selling prices; free docking with a sponsor on board (shipyard §4) |
| **Орднунг** | **скоростной режим**: inside the numbered ring of the gate and the station, over the limit = a ticket in ПОЧТА | the jump nodes are theirs — shortest routes, no pirates in the ring |
| **Коммуна** | **обед**: the yard and one counter shut for a game hour at midday, and on strike days; fuel is always sold | the yard builds the most beautiful hulls; the cantina talks longest (rumours) |
| **Рассвет** | **никаких сроков**: jobs taken here carry no deadline; the market sells no parts — «сделаем из ваших» (two of yours → one better) | the repair tug; merging parts |
| **Хай-Фронт** | **камеры**: every shot fired in their space lowers your trust rating; the rating sets their docking price and shows on the stamp | their relays share the map: their systems are seen further |

### 2.6 Sound

- **Ether on entry**: the receiver switches to the owner's wave for one line — the power's `air`
  line in its voice (`12pa-beacon` speaks already) — then back to your tuning.
- **Music** (`10-music`): each power is a mode, not a track — ГЛАВТРАССА a brass minor march step,
  Компания a three-note major jingle as the motif, Орднунг strict 4/4 low strings, Коммуна a 3/4
  waltz on a reed timbre, Рассвет a polyrhythm with a wooden timbre, Хай-Фронт a clean synth
  arpeggio. Crossfade at the jump. (The road companion stays silent — `27k-road`.)

### 2.7 The map

- **The border is a line in the world** along the edge of each territory, drawn in the power's
  pattern, not its colour: a dotted line of tiny stars (ГЛАВТРАССА), a thin line with ring marks
  (Компания), a precise dash with tick numbers (Орднунг), a wave (Коммуна), dashes of uneven
  length with small suns (Рассвет), a line of dots (Хай-Фронт). It moves 1:1 with the sheet (no
  parallax, M447). A front is the existing red dashed line between two patterns.
- The emblem chip grows at near zoom to a readable 14–18 px; far out it stays a dot.
- No permanent HUD chip: the station's compass label carries the emblem glyph, and the system
  name in the header does too.

## 3. Budget and art load

Six posts are six small hand procedures of one construction (a ring of parts, one light, one
motion), not six generators — ~100 lines each, drawn once into a layer per system, the light and
motion on top. Stations reuse the hull maker's conveyor. Traffic reuses the fleet art. The stamp
is DOM on paper (the КНИЖКА cloth). The phone budget: the post layer is one `screenLayer`-sized
bake per system entry; `prof()` before and after on the phone layout.

## 4. The queue — M452–M458, each playable on /dev

- **M452 the post at the jump point** — six posts, their lights and motions; rear / front / fresh
  occupation / Ялта / pirate states; placed at the jump-in point of every owned system.
- **M453 the stamp** — border-crossing detection by owner change, the 1.2 s stamp, the КНИЖКА page
  ОТМЕТКИ О ПРОЕЗДЕ, six papers; the save keeps which stamps you have and when.
- **M454 station and traffic** — the station body by builder through the maker grammar; traffic by
  owner, border mixing.
- **M455 the peacetime fleet** — six behaviours in flight, driven by the chronicle's state (truce,
  strike, rite) where it already exists.
- **M456 the law of the land** — six rules with their lines, tickets, receipts and the trust rating.
- **M457 sound** — ether on entry, six musical modes, the crossfade.
- **M458 the map** — border lines by pattern, readable chips at near zoom, the emblem on the
  compass label and the header.

Order: M452 → M453 → M454 first — after those three the author's complaint is answered in the first five
seconds of any jump. M455–M458 give the five minutes and the map.
