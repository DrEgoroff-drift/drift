# The release look — the console and the table (M151a)

Design, 2026-08-23, chosen by the author: variants A + B together, built **before** M152 so that
the kit, Vega and the whole second act land in ready places instead of `say()`.

## The problem it solves

The world speaks through eight channels (ether, counter queue, table, rumours, finds, cantina
scene, board, settlement) and the player can read them in two places: a message that flashes at
the top centre for two seconds, and one chronological log with eight kinds of entry. The receiver
lives in a station tab; the table lives where a table is; the board in another tab. With Vega, the
circular, the Ring, letters and the record book the number of voices doubles. The style rules are
right ("over the world — only what is needed now"); this milestone finishes them, it does not
replace them.

## The principle

A Soviet console: **three things on the panel, one per voice.** The receiver — what is heard. The
table — what lies. The seat beside — who is with you. Everything else is in the logbook, opened
when one wants to re-read. The centre of the screen is never text, only the world and the action
prompt.

**Reachable from anywhere.** The console and the table are available in every mode — system,
map, docked, landing, surface, cave, dig, belt, raid, base, barge — not only in flight. The table
opens over any mode and pauses nothing that is not already paused (the engine-off rule stays);
closing it returns to exactly where the player was. The receiver line stays visible on every
screen, including inside the station window and the home.

## The console (a strip along the bottom of every screen)

A thin strip, in the language of the instruments: it shows when there is a reason and dims when
all is even. Three zones:

- **Left — the receiver** (`25e`, moved out of the cantina): the knob and one line «что слышно»
  with signal quality. Every voice comes here with a click: station calls, rumours (`11t`),
  Vega's «ты где?» (M153), the circular (M156), the Ring pulse (M154), the request concert
  (M165), the ether lines of the hundred. Turning the knob finds other voices — the player tunes,
  the game does not push. A button **ЗАПИСАТЬ** appears when the signal is worth a tape (the
  Ring, the circular) and writes it to the recorder (`25b`). The cantina keeps one sentence:
  «здесь ловит лучше» (quality bonus when docked).
- **Centre — the action prompt** (`#prompt` as now): «ДЕЙСТВИЕ — ПРИСТЫКОВАТЬСЯ». Suit warnings
  and «ЗАПУСК ОТЛОЖЕН» live here too. Nothing else is ever written to the centre.
- **Right — the seat**: the figure of whoever flies with you (Vega, the trainee, a barge
  passenger) and her line under it («ВЕГА · обиделась»). Click — three actions: talk / give /
  set down (for Vega the last one always fails; that is her joke). Empty seat — nothing drawn.

The menu shrinks to five: **СТОЛ** · КОРАБЛЬ · ЭКИПАЖ · ШТАБ · НАСТРОЙКИ. ЖУРНАЛ, ОТЧЁТ and
ТРЕПЛО go: the logbook and the lore are on the table, the parrot is clicked on the parrot.
Two permanent buttons on the right edge stay as the style rule says.

## The table (one screen for everything that is read)

**СТОЛ** opens a drawn table, full screen, in the room language of the station scenes (the
cantina hall, the HQ): a wooden top, a lamp, the window of wherever the ship is. On it lie:

- **The logbook** — a notebook with three tabs:
  - **ЭФИР** — the receiver's memory: every line heard, with frequency and time. A missed
    Vega call is here.
  - **БОРТ** — `tech`, `money`, `warn`, `kill`, `dim`: the ship and the money, as the log is now.
  - **ЛЮДИ** — `talk` and every line a person said: counter queue, stories' lines, letters read
    aloud, Vega's notes, the sixth's words. Rule for the code: **every human line is written
    here**; the glass may flash it, but does not own it.
- **Tapes** of the recorder: three laid side by side and the misclosure figure (M155) shows on
  the table itself.
- **Letters** (M158): an envelope; read by the addressee — unfolded.
- **Things**: «Желание-1» (M153), finds, the voucher (M162), a snapshot from an outing.
- **The record book** (M161) and the ship's passport (M150 as a document).
- **Clippings** of the wall newspaper (M165) that Vega brings from the fair.

New things lie on top and glow a little; a count on the СТОЛ button. Nothing flashes in the
centre. This is the "table as paper" of the M124 release design, widened from bills to
everything readable. The old windows `logwin`, `lorewin`, `parrotwin` are removed; the parrot's
window becomes a click on the parrot on the console or in the cockpit.

## The station: the board first

The station window gets a first group **ДОСКА** before ТОРГОВЛЯ: the board of returners
(`11s`), the counter queue, the wall newspaper (M165), the board of honour (M161), the circular's
demand («собираем для экспедиции: …», M156). Everything the world says about itself, on one wall.
«Кантина» keeps the people and the scene.

## The home: rooms as places

The home keeps its window; the workshop tier gets the kit screen (M152), the study the record
book (M161), the living part Vega's kitchen (M153). The table at home is the same table as СТОЛ
— opened from the home it shows the same things with the home's window behind.

## Rules for the code

- `say()` is for prompts and emergencies only. A line that a person says goes through
  `etherLine()` (receiver + ЭФИР) or `peopleLine()` (ЛЮДИ + optional glass flash), never
  through `say()` alone. Autotests fail on a new `say()` with a person's name in it.
- `logAdd(kind, …)` routes by kind: `ether` → ЭФИР, `talk` → ЛЮДИ, the rest → БОРТ.
- The table is a mode-independent overlay (`29-ui-table`), drawn on its own canvas over any
  mode; it reads `G.log`, `G.tapes`, `G.letters`, `G.things`, `G.record`. Persisted: only what
  was already persisted; the table stores nothing of its own except «seen» marks.
- The console is `29a-console`: receiver, prompt, seat; one `consoleDraw()` called from
  `frame()` after every mode's draw, and a DOM strip for the 44 px targets.
- `91f-ui` is rewritten once here: the five menu items, the two permanent buttons, the strip's
  heights, no overlap with the instruments, the table opening from every mode and returning to it.

## Where to press, what to see

| want | press | see |
|---|---|---|
| what is being said now | nothing — the receiver is on the console | line and quality, a click on a new one |
| who flies with me | the seat on the console | Vega and her mood; click — actions |
| re-read | СТОЛ → notebook | ЭФИР / БОРТ / ЛЮДИ |
| letters, tapes, things | СТОЛ | they lie there, new ones glow |
| the world | station → ДОСКА | returners, queue, circular, newspaper, honour |
| my life | СТОЛ → record book | entries in other people's hands |
| the suit | home → workshop | the figure with six places |
| from a cave, a dig, a raid | СТОЛ (same button, same table) | the same table, the cave behind the window |
