# Screens — one logic for every surface (M299 pass)

Written after the phone playtest of 2026-09-02 (screens: HQ, cantina, board, map, system view).
It reworks the three-fix queue in `DESIGN-ui.md` into one rule set for **all** screens, re-examines
the hypotheses document the author brought (the "world → situation → one action" memo), and ends
with the confirmed bugs and a walkthrough of the path a player actually takes.

Nothing here is a new mechanic. It is where existing things live and how a press shows its result.

## 0. What the playtest actually says

Five complaints, one defect: **a press has no visible consequence and no visible place.**

| complaint | what the code does | why it reads as "nothing happens" |
|---|---|---|
| "НА КАРТУ on the board, tap all you like, nothing" | `gotoSector` (`11a-quests`) sets `G.mode="map"`, but the station overlay `$st` stays `open` and covers the canvas | the map *did* open — under the station |
| "named myself, the field stayed, button still active" | two naming features: `namesBlock` (`11u-names`, ИМЯ СИСТЕМЫ, subtitle *«ваше имя. На карте — оно»*) and the table row ВАШЕ ИМЯ (`27c-ui-hq`) | the player typed "Drew" as the **system's** name; the captain's name never got set, so ВАШЕ ИМЯ still says «капитан» |
| "there's a «Рыба», what is that" | `FOLK.ryba` (`12u-folk`), a dock regular, rendered as a bare heading РЫБА plus a quote | no label who she is, no figure in the scene, no verb |
| "cantina is a mess, buttons everywhere" | `renderCantina` appends 14 blocks in milestone order; the board (`26-ui-station`) appends ~30 | a changelog, not a room |
| "map looks great, don't know where I am or where I fly from" | "you" ring and "selected" ring are both `#7fe6d8`; after НА КАРТУ the view centres on the rumour and the player is off-screen; there is no drag branch in `15-input` for the map; no line from you to the selection | the map answers "what" and never "from where" |

The pattern, stated once: a press must change the frame it was pressed in, and the player's own
position must never leave the frame unless the player dragged it away.

## 1. The five surfaces

Every screen in the game is one of five surfaces. Each surface answers one question, has one
layout law and one primary verb. A new feature does not get a new surface; it joins one of these.

| surface | question | examples | density |
|---|---|---|---|
| **SKY** | where am I, what is near, what can I do *now* | flight, map, belt, surface, cave | minimal: HUD + one context verb |
| **PLACE** | why am I here | station hub, home, settlement, cave mouth | low: a wall of cards, three lanes |
| **PERSON** | who is this, what do they want, what can I do with them | cantina figure, HQ manager, crew, folk, barkeep | low: one card pattern everywhere |
| **LEDGER** | manage | trade, ship, holdings, bases, lab | high, by request |
| **NOTEBOOK** | what have I learned | ether, log, people, letters, strips, mirror | read-only + НА КАРТУ |

Laws that hold on all five:

1. **One primary verb**, bottom-right, thumb zone. Secondary verbs sit in the row they belong to.
   A verb that cannot fire now is not drawn (the M298 rule for the console, extended to lists).
2. **A row is title · one line · one verb.** No instructional prose in rows. The *why* of a
   mechanic is said once, on the first visit, as a single line under the section head, then never.
3. **A press changes its own row.** The verb goes, the result comes in the same row in the
   speaker's colour, the row glows for a second, a sound plays. The result *stays* as a record
   ("строчка осталась" is the intended state, but only after a visible transition).
4. **Nothing renders for nothing.** "лент нет", "трюм пуст", "у стойки никого" are not rows.
   An empty section is not drawn.
5. **Seven above the fold.** A list longer than seven shows seven and «ещё N»; the fold opens
   in place, the scroll does not reset (already true since M298 for `renderTab`).
6. **New since last visit** gets a dot. Newness is the first sort key on PLACE, then actionability
   (has a verb), then distance.
7. **Two things with the same name are one thing.** Today «слух» is both the board's rumour
   (`rumoursHere`, a place with a miss) and the table's ether line (`newsAll`). The board keeps
   «слух»; the table row becomes «НОВОСТЬ ИЗ ЭФИРА».

## 2. PLACE — the station hub

The board today is thirty blocks in the order their milestones landed. The fix is not fewer
mechanics but **triage into three lanes**, each a short stack of cards:

```
СОЛЗЕИКС · верфь · Драарий
─────────────────────────────
К ВАМ            (addressed to you: speech at the counter, queue, letters, deals here, returnees)
ЗДЕСЬ            (this place: needs, appetite, prices heard, meteo, finds, depot, flea)
ДАЛЕКО           (elsewhere: rumours, expeditions, offers to carry, names) — every card has НА КАРТУ
─────────────────────────────
[ЗАПРАВКА] [РЕМОНТ]              [ОТСТЫКОВКА]
```

- A card is two lines and at most one verb. The old block bodies become the card's second tap.
- Lane order is fixed; inside a lane: new → actionable → near.
- ИМЯ СИСТЕМЫ leaves the board. Naming a system is a map act: the map card's second tap gets
  «НАЗВАТЬ СИСТЕМУ». The board never asks the player to type.
- The receiver hint («приёмник на пульте внизу») is not a card; it is one line in the footer.

References that do this well: **Fallen London / Sunless Sea** port storylets (a short stack of
cards, each with one verb and a "new" tag, everything else behind "more"); **80 Days** market and
conversation cards (the team's stated test: *why does the player want to press this button right
now*); **Outer Wilds** ship log rumour mode (rumours as a board of linked cards with "new" marks,
never as quest markers — the closest thing to Drift's rumours in a shipped game).

## 3. PERSON — the cantina as a room with hotspots

`cantinaScene` already draws the room but only when there are candidates or deals, and every
mechanic still lists itself below it. Invert it: **the room is the input; the list below is the
selected hotspot's content and nothing else.**

Hotspots, always drawn:

| hotspot | who | on tap |
|---|---|---|
| counter | barkeep | the speech line (if any) and the **table** (strips, cargo, news, your name) |
| tables | candidates and deals | the person/deal card |
| door / dock | folk regulars (Рыба, Гвоздь…) with a small label «завсегдатай · у дока» | their card: name, one line who they are, their quote, a verb if any (take aboard, ask) |
| a stool | «остаться у стойки» | the late block |

Below the scene only the tapped hotspot renders; a tap elsewhere in the room clears it. A first
visit shows one line: «тыкните по человеку или по стойке». The list-of-everyone remains reachable
as «ВСЕ» for accessibility, folded.

The **person card** is one component for cantina, HQ, crew and folk:

```
ЛУИЙ                       командир звена
держит звено · дела ровно · второй день здесь
[ПОГОВОРИТЬ]   [НАНЯТЬ · 4 200 кр]
▸ цифры (уровень, оклад, доля, черты)
```

Words first (what they do now, how it goes, mood), numbers under a fold. Hire screens need
numbers to decide, so the fold is open by default on the hire card and closed in HQ.

The **table** keeps its metaphor (you put a thing down) but obeys law 3: the answer is spoken by the
barkeep figure in the room (bubble + sound), then lands in the row. Rows for things you do not
have are not drawn. ВАШЕ ИМЯ gets an input in the row; «НАЗВАТЬ» is disabled while it is empty.

References: point-and-click hotspots (the whole adventure genre: the scene is the menu);
**Citizen Sleeper** location nodes (a place shows its people and two or three verbs, the systems
appear only after a verb); **Roadwarden** (the devs had to highlight Trade/Rest/Travel because
players did not see what they could do — the same failure as our cantina).

## 4. SKY — the map

Rules, in priority:

1. **"You" never leaves the frame** unless you dragged. A НА КАРТУ that points far away zooms
   the map out to fit both you and the search circle; it does not pan you off-screen.
2. **You and the selection are different colours** with different marks: you = teal ring with the
   system's name and a small «ВЫ»; selection = the orange reticle it already has.
3. **Drag pans** (one pointer, `p.moved`, shifts `G.mapView`); pinch zooms. When you are
   off-screen a «К СЕБЕ» chip appears (the maps convention: a recentre affordance the moment the
   user's dot is gone).
4. **The route is drawn**: a dashed line from you to the selection with hop dots every jump
   range; hops beyond fuel are drawn dimmer. The card's text «1 прыжок · везём железо» stays.
5. **One-line card, second tap for more** (M298) stands. The card has exactly one primary verb:
   ПРЫЖОК when reachable, КУРС otherwise.
6. From a station, the map opens **over** the station as a peek: the station overlay hides, the
   map shows, НАЗАД returns to the tab you left. Docked state does not change.

References: **FTL** and **Out There** (the ship is always on the map; the map exists to answer
"where next" and nothing else); **Elite: Dangerous** galaxy map (current system tethered, route as
a line with per-jump dots); Google Maps' recentre button.

## 5. SKY — flight, and the ship that circles the station

Flight stays as M298 left it. One addition from the playtest: a foreign ship in the system needs a
visible cycle — approach, dock (vanish inside), depart — or a reason to circle said in the ether at
the moment the player can see it. Candidates for the ship on the screenshot: a barge (`12l-barge`),
the story ship «Сорок-два» (`12k-stories-c`, meant to circle for years), or a ship left in
`G.orbit` capture. To be identified in the game, not guessed from code.

## 6. LEDGER and NOTEBOOK

LEDGER (trade, ship, holdings, bases, lab) is allowed to be dense: the player came to manage. The
only laws applied: one primary verb per screen, and results shown in the row that was pressed.

NOTEBOOK (the тетрадь: ether, board, people, letters, strips, mirror) is read-only plus НА КАРТУ.
It is **not** the table. The hypotheses memo merges "стол" (put a thing down, in the cantina) with
the archive; keep them apart — the table is an input surface, the notebook is memory.

## 7. The hypotheses memo, re-examined

| hypothesis | verdict | why |
|---|---|---|
| situation → action → consequence as the test for every screen | **keep, sharpen** | consequence must be perceivable in the same frame on three channels: motion, sound, text (law 3) |
| design from 20 player goals | **keep as tests, not as flows** | 20 flows would breed 20 surfaces again; goals are acceptance scenarios run against the five fixed surfaces |
| cantina is a scene, not UI | **keep, go further** | the scene exists; make it the input (hotspots) and drop the list-of-everything |
| board = wall of the world's voices | **keep, add triage** | a wall with 30 unsorted cards is a changelog; three lanes and a fold |
| people first, spreadsheet second | **keep, with one exception** | the hire card opens its numbers by default; you cannot hire on adjectives |
| СТОЛ as universal archive | **reject** | table = input, notebook = memory (§6) |
| rewrite the information architecture, six new "places" | **reject for now** | the six station sections already match the five surfaces; every playtest complaint is fixed inside them. Rebuild the IA only if the next playtest still fails after this pass |
| remove ОГОНЬ/ТОРМОЗ when unusable | **already done** (M298) | extend the same rule to list verbs (law 1) |
| rumours must not become quest markers | **keep** | plus the map rule that the search circle and "you" share the frame |
| mobile portrait 393×830 is the layout target | **keep** | the desktop is the same layout wider, never a different architecture |

## 8. Confirmed bugs (fix before the pass)

1. **НА КАРТУ from the board does nothing visible.** `gotoSector` must hide the station overlay
   (peek mode, §4.6), not just set the mode. Same path from the notebook while docked.
2. **Two naming features read as one.** Move ИМЯ СИСТЕМЫ off the board to the map card; give the
   table's ВАШЕ ИМЯ an input; the subtitle «ваше имя. На карте — оно» goes.
3. **Folk regulars are unlabelled.** РЫБА and friends get a figure in the room, a label
   «завсегдатай · у дока» and a card; no bare heading with a quote.
4. **Empty table rows render.** «лент нет», «трюм пуст», «вы ничего не слышали» rows go.
5. **Map: same colour for "you" and "selected"; no drag; view leaves the player.**

## 9. Walkthrough — the path this pass must make obvious

1. Dock at Солзеикс. The hub opens on К ВАМ: the barkeep's line, a letter, two deals. Below,
   ЗДЕСЬ: «лёд нужен · цена выше обычной». Then ДАЛЕКО: two rumours with НА КАРТУ.
2. Tap НА КАРТУ on «свёрток». The station hides, the map shows you (teal, «ВЫ · СОЛЗЕИКС»), the
   orange reticle on the rumour's sector, the search circle, a dashed route with one hop dot.
   Card: «сектор −3:0 · 3 сектора · 1 прыжок». Verb: КУРС. Tap it; НАЗАД returns to the board.
3. ЛЮДИ → КАНТИНА. The room. Two figures at tables, Рыба by the door labelled «у дока», the
   barkeep at the counter. One line: «тыкните по человеку или по стойке».
4. Tap the barkeep. Below: his line, then the table with only what you hold: NOVOSTЬ ИЗ ЭФИРА
   («Квазнтот перешла другим людям»), ВАШЕ ИМЯ with an input. Tap НА СТОЛ on the news: the
   barkeep's bubble «это уже все знают» + sound + the row turns to his colour and keeps the line.
   A grey trace under it: «записано · ЛЮДИ».
5. Tap Рыба. Card: «Рыба · пилот, ночует в кабине · идёт порожняком» and her quote. Verb, if
   the offer system has one for her; otherwise none, and that is fine — she is a person, not a
   button.
6. ОТСТЫКОВКА. Flight. КУРС already set: «К ЦЕЛИ» appears as the context verb. Jump. Arrive.
   The ether repeats the rumour's short form. Nothing on the map marks the treasure; the circle
   is the only guide.

If any step needs a paragraph of explanation on screen, that step is not done.
