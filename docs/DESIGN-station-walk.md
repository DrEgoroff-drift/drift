# The station on foot (M816)

The author, 15.10, after looking at the station in 3D: «станция 3д пока норм, но сам интерфейс
говно, надо перепридумать интерфейс, хочу ходить по станции, а то справа получается панель а слева
уже готовое 3д и как то наполовину все». This overrides `DESIGN-hall.md` §2–§3 and §5 (the plate
at 60 %, the camera stations chosen by section tabs). The hall itself — its bones, the seven
dressings, the light, the people, the goods crates, the dials, the board, the office chart, the
cantina (M810–M815, `27f4a`–`27f4k`) — stays and is what the player now walks through.

## 1. What is wrong today

The dock frame is cut in two: a 3D hall on the left 40 %, a graphite plate with a full table and a
ship column on the right 60 % (`#station.hall`). The hall is a picture beside a spreadsheet: the
player never stands anywhere, the camera jumps between stations when a tab is pressed, and the
table carries the whole station at once (header, nine tabs, the market, the ship column, undock).
The other interiors already walk: the home (M850b, «← → пройтись · действие — рассмотреть ·
назад — выйти во двор»), the cave, the mine. The station is the one room you cannot enter.

## 2. The idea in one paragraph

Docking puts the pilot (rig `21pha`, already in the hall as `27f4j`) at the airlock of a **long
hall seen side-on**, full screen edge to edge, the near wall cut away like the home's section.
The player walks him left and right (A/D, ← →, a tap on the floor) past the **places** of the
station laid out along one walk line: the airlock, the counter, the board, the yard window, the
bench, the office desk, the bar. At a place its thing is lit and named, and the action button
says the verb. Action **engages** the place: the lens eases in to that place's near view (the
existing camera stations) and the place's table comes as a **card** beside the thing — only that
place's rows, never the whole station. Back closes the card and he walks on. Nothing stands over
the hall while he walks except the HUD's corner chips and the two permanent buttons.

## 3. Composition

**Walking (PC ≥ 900 px).** The hall is the whole frame. The lens follows the pilot eased (τ .45 s,
the cave's follow), the walk line at .30 of the height from the bottom, the man .20–.22 of the
height (the hall's `fy` rule, now for a moving man). The station's name, kind and money are a
corner chip top-left (the planet HUD's grammar), not a header bar. The places' tags are the
existing DOM tags (`hallTagsDraw`), shown only for the place he stands at and its two neighbours.

**Engaged (PC).** The card stands on the side away from the thing, at most **36 % of the width**,
full height minus the HUD margins, the graphite of the plate. The lens target moves so the thing,
its person (keeper, visitor) and the pilot sit in the other 64 %; the person is ≥ .24 of the
height there (the near lens). Tabs inside a place (РЫНОК / БАРТЕР / БОНЫ at the counter; КОРАБЛЬ
/ СТРОЙКА at the window) are the card's top row. A wide table (the market) shows four columns:
good, price, against the base, in the hold; the rest goes to a row's hover.

**Phone (≤ 760 px).** The same walk; the hall is full screen with the man .18 of the height and the
pads of `15-input`. Engaged, the card is a bottom sheet of at most **55 %** of the height; the
lens lifts the thing into the top 45 %. The sheet scrolls; the hall never does.

**Speed.** The hall is ~28 m: seven places ~4 m apart. He walks at 2.2 m/s and jogs at 4.5 m/s
(double tap, or any walk longer than 6 m that the strip asked for), so the door to the bar is
≤ 7 s. **The plan strip** — the places as a row of short names on the top edge — is the quick way:
a tap jogs him there and engages on arrival. Keys 1–7 do the same.

## 4. The places

| Place | Thing (existing) | Verb on the button | Card |
|---|---|---|---|
| the airlock (left end) | the dock glass with the own ship (`27f2 outside`) | ОТСТЫКОВАТЬСЯ | fuel, hull, hold, the patch kit (today's ship column), undock |
| the counter | the keeper, the goods crates (`27f4e`) | ТОРГОВАТЬ | РЫНОК / БАРТЕР / БОНЫ, the state order on top |
| the board | sheets on cork (`27f4h`) | ДОСКА | the board's jobs |
| the yard window | the hull in the slip, the site (`27f4f`) | ВЕРФЬ | КОРАБЛЬ / СТРОЙКА |
| the bench | the five dials (`27f4g`) | ПРИБОРЫ | НАУКА, ПРИБОРЫ |
| the office desk | the holdings chart (`27f4i`) | ВЛАДЕНИЯ | ВЛАДЕНИЯ |
| the bar (right end) | the cantina, the hero lamp (`27f4c` bar) | ЛЮДИ | ЛЮДИ (hire, crew, the coop) |

A station type without a section has no place for it (the hall's dressing already differs by
type); the walk line closes up. The order is fixed so a player's feet learn it.

## 5. Walk, engage, leave

- **Enter.** The first frame is the airlock from the dock side: a 900 ms dolly in through the glass
  to the walk lens, the pilot stepping out of the airlock door. A redock in the same visit starts
  him where he left the hall.
- **Walk.** `15-input`'s A/D and the touch pads drive `HALL.walk` (x along the line, face, phase);
  the rig takes walk/stand poses as in the cave. People at places turn their heads to him as he
  passes within 3 m (head yaw only).
- **Engage.** Action at a place (or a strip tap on arrival) opens its card and eases the lens to
  the place's near view (`plnGlide`'s .45 s in, .7 s out). The section's old `renderTab` builds the
  card's body; only the frame around it is new.
- **Back.** S / Esc / the card's «НАЗАД» closes the card; the lens returns to the walk.
- **Leave.** Undock is the airlock's verb; the right-edge «Выход» does the same from anywhere
  (with the airlock's checks: fuel, unpaid dues). The old «ОТСТЫКОВКА» button in the ship column
  goes.

## 6. What stays, what goes

- **Stays:** every section's logic and its `renderTab` body, `ST_GROUPS` as the place list, the
  hall's scene, light, props and people, `hallLens`/`hallLensAim` for the near views, the tags,
  `?hall=0` (the old desk, for the tests and as the fallback).
- **Goes:** the plate at 60 % (`hallHero`, `#station.hall` layout), the header bar across the
  screen, the section tab row as the way between places, the ship column beside the market, the
  phone's 36 % hall strip.

## 7. Milestones

- **M816a The walk.** The long hall along one line (places spaced, the near wall cut), the pilot
  walking with the follow lens, tags at the near places, the verb on the action button, enter
  through the airlock, the strip and keys 1–7. Gate: door → bar on foot ≤ 7 s and by the strip;
  the man .20–.22 at 1920 and 2560, .18 at 390; nothing over the hall but the HUD chips, the
  strip and the two buttons.
- **M816b The cards.** Each place's card: ≤ 36 % of the width on a PC, the thing and its person in
  the other 64 % (≥ .24 of the height), ≤ 55 % of the height on a phone with the thing above it;
  the airlock's card carries the ship column and undock. Gate: the dock pair at 1920 and 390 at
  every place, walking and engaged; vision clean.
- **M816c Cost and the phone.** The hall renders at the walk's frame rate only while he moves or
  a card is open (idle 12 fps as now); `hallCost` on the walk at 390 and 1920.

## 8. Tests

`91qc-hall` grows: the place order per station type; a walk on keys from the airlock reaches every
place; action at each place opens its card and back closes it; the card's rectangle ≤ .36 W (PC)
and ≤ .55 H (phone); the thing's projected box lies outside the card; the man's share walking and
engaged; `?hall=0` keeps the old desk whole. The vision walks the station at three places.

## 9. Disputed

- **The table loses width.** The market at 36 % of 1920 is 690 px: four columns fit; the rest is on
  hover. If the author wants the full table, the card may widen to 44 % at the counter only.
- **The airlock owns undock.** The right-edge «Выход» undocks from anywhere so no player is trapped
  by the walk; if that reads as a shortcut that kills the walk, it can ask «пройти к шлюзу?».
- **One long hall, not rooms.** A side-on line keeps one lens and one walk grammar with the home,
  the cave and the mine; rooms with doors would need a second camera grammar.
