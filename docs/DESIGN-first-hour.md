# The newcomer's first hour — the walkthrough, 2026-08-27

The plan has asked for this since before the release block was written: *"A fresh save, an hour of
play, every 'boring' and every 'I don't understand' written down, then fixed as a list. There is a
hundred milestones of content and one way in; before the release look this matters more than any
new feature."*

This is that list. It was made by clearing the save on the dev build (0.184.0) and walking the
opening the way a person who has never seen the game walks it: title screen → first frame → first
flight → first dock → first landing → first walk. Everything below is measured in the running game,
not remembered.

---

## What a new player is actually given

**Title screen.** Four buttons. ПРОДОЛЖИТЬ ПОЛЁТ (dead on a fresh save), ЛЁГКИЙ СТАРТ / РУЧНОЕ
УПРАВЛЕНИЕ, УПРАВЛЕНИЕ. This is fine and does not need help: the two middle buttons say what they
do in their subtitles.

**First frame.** Mode `system`, **nine visible controls**: КАРТА, МЕНЮ, zoom in, zoom out, two
steering pads, ТОРМОЗ, ДЕЙСТВИЕ, thrust. One line of text from `start()` telling you to tap an
object and the autopilot will take you there. That line is correct and sufficient for movement.

**Resources on screen:** ТОПЛИВО 100, КОРПУС 100, ЩИТ, СКАФАНДР, РАНЕЦ, ТРЮМ 0/40, 600 кр.
Six bars and two numbers, all unlabelled beyond their names.

---

## Findings, in the order they hurt

### 1. Nothing on screen says what the game is *for* — and that is by design, but it goes too far
Measured at a fresh start: `questOpen()` returns **0**, there is no goal card, no story pin, no
tutorial object of any kind in the build. The game deliberately never explains itself, and that is
right — but "never explains" is not the same as "never mentions". Right now a new player has a
ship, six hundred credits and no reason to move.

**Not fixed by adding a quest.** Fixed by a person mentioning that work exists (see the fix below):
the board at a counter always has jobs on it, and nothing in the game ever says so.

### 2. The suit is a countdown that kills, and it is never named — **the worst finding**
`G.surf.suit` starts at 100 and falls while you walk. Nothing anywhere tells the player it is
consumable, what it runs out of, or what to do about it. The bar is drawn and silent. A first death
here is not difficulty, it is the game not having spoken.

### 3. Fuel is the same problem one step later
The tank is 100 and worth about ten jumps. Nothing says so. A new player can strand themselves in a
system with no fuel and no idea that fuel is bought, not found.

### 4. The first thing the game offers on the ground is the least useful thing it has
On landing, `G.prompt` reads **«ДЕЙСТВИЕ — СКАНИРОВАТЬ ОРГАНИЗМ»**. Scanning gives data; data buys
tech; tech is a system the player has not met. Meanwhile the same landing reported **22 deposits**
underfoot, and digging → selling is the actual first economic loop. The prompt is not wrong, it is
just the wrong first sentence.

### 5. The station board shows eight sections on the first dock
Measured: ОЧЕРЕДЬ У СТОЙКИ · ЧТО ПРЕДЛАГАЮТ · НУЖДА · НАРЯД · НА СТЕНЕ · СЛУХИ · ИМЯ СИСТЕМЫ ·
ПРИЁМНИК. Every one of them earns its place after the tenth hour. On the first dock it is a wall.

**Not fixed here**, and deliberately so: thinning the board is a decision about what the game is,
and it belongs to the author. Written down so it is not forgotten.

---

## What was done (M207, 0.185.0)

**A relief operator in the ether, not a tutorial.** Four lines, each said once per save and each
tied to an *occasion* rather than a timer. No arrows, no modal windows, no "press here", no
"skip tutorial" flag. The game already has a voice that comments on everything — it uses that one.

| line | occasion |
|---|---|
| the pack you breathe from on the ground is not endless | first time you walk more than 180 units from the ship |
| the tank is ten jumps, refuelling is bought at any station | first time fuel drops below 86 |
| there is always work on the board at a counter | first dock |
| if you are broke, dig — the station buys what is underfoot | first time you stand next to a deposit with under 900 credits |

Four and not five: more is a lecture, fewer does not cover the list. A fifth line about *data* was
considered and dropped — nobody dies or gets bored for want of understanding data.

They are said by people (диспетчер, стойка, старик у стойки), never by the game, and never twice —
including across a reload, which is what `G.first` is for.

---

## Still open after this pass

- **Finding 5**, the eight-section board on a first dock. Author's call.
- **Finding 4**: the landing prompt's priority. Changing which action wins the prompt when several
  are available touches `21-mode-surface`'s whole chain of `else if`, and getting it wrong makes
  every later hour worse to save the first one. Worth doing, worth doing carefully, not at 01:30.
- The walkthrough covered the opening. It did **not** cover the hour after it — the first station
  screen in full, the first hire, the first manager. Those want their own pass.
