# The hour after the opening — walkthrough

M207 walked a fresh save and fixed what it found (`DESIGN-first-hour.md`). It left one item
explicitly: *"the hour AFTER the opening — first station screen in full, first hire, first manager —
has not been walked yet."* This is that walk, done in the running game on 2026-08-27 (0.191.0), and
the fixes that came out of it shipped as **M212 (0.192.0)**.

The method is the same as M207's: open each screen a newcomer reaches in their second hour, write
down every *"boring"* and every *"I don't understand"*, then fix them as a list. Measurements are
taken from the live DOM, not from memory.

---

## 1. Every long screen ends in a lie — **fixed**

The station board on a first dock renders **eight sections** — counter queue, what's on offer, a
shortage, a station order, the wall, rumours, the system's name, and a note about the receiver.
Measured in the running game: **1229 px of content in a 407 px window.** The cantina is worse:
**2086 px in 408** — five screens.

Neither said so. The last visible row ended flush with the panel edge, exactly as a *final* row
would. Two thirds of the board and four fifths of the cantina simply did not exist for a player who
did not think to drag.

This is not the question of whether eight sections is too many — that is the author's call, and
nothing was removed. It is a missing affordance: **a list that continues must look like it
continues.** Fixed in `27m-scroll-cue` + one rule in `style.css`: the bottom of any overflowing
`.body` fades out, and the fade disappears the moment you reach the end. No arrow, no "more below",
no scrollbar — the same haze the game measures distance with everywhere else. It applies to every
screen, because a list running past the fold was never only the board's problem.

## 2. The hire screen argued with itself — **fixed**

Two candidates, read top to bottom:

```
Вексон · перевозчик
  необстрелянный — дёшев и НЕОПЫТЕН
  жалованье 12 кр/мин · опыт 22

Тиэкс · перевозчик
  ВЕТЕРАН — дороже, но выходит живым
  жалованье 26 кр/мин · опыт 7
```

The words and the number contradict each other, in adjacent lines, on the first screen where a
newcomer is asked to spend a third of everything they own on a stranger. `genMerc` set
`xp: Math.floor(r()*40)` — a random number bound to nothing, while the traits beside it were drawn
from a separate roll.

A player who catches this stops trusting *both* lines, and there is no way to tell them they were
right. Experience now follows the traits it is printed next to: a green hand gets 0–6, a veteran
46–89, everyone else 8–37. The spread stays — people differ — but its sign no longer argues with the
caption. Guarded in `91b-crew` over 900 seeds.

## 3. ФОТО hung over open screens — **fixed (a regression, one day old)**

M208 (0.187.0) gave the camera five new places, `system` among them. The console deliberately stays
visible over an open screen (M151a), so from that moment the ФОТО button hung over the HQ, the
market and the shipyard — offering to photograph a world the player is not looking at. Before M208
it never showed there, because flight was not photographable at all.

`postCanShoot` now returns false while `body.screen` is set. The console rule stands; the shutter is
not part of it — it is about the world, and the world is currently behind a panel.

---

## Checked and **not** defects — do not "fix" these

- **The empty HQ.** Four free domains and a line that says what a manager is *and that you do not
  need one yet*: «он не ускоряет ранний старт — он поднимает потолок, когда потолок уже мешает».
  This is the best-written empty state in the game. Leave it.
- **The unaffordable candidate.** The second hire costs 693 against 600 credits and its НАНЯТЬ
  button is dimmed rather than hidden. That is the honest form: the player learns the price exists.
- **70 кр/мин for a manager** in the cantina, unreachable in the second hour. The HQ has already
  said managers are not for the early game; the price agreeing with that is not a problem.

## Still open

- **The board's eight sections on a first dock.** Untouched — thinning it is the author's call. What
  changed is only that the player can now *see* there is more.
- **The station's group row can fall out of step with its tab.** `syncTabs()` derives the group from
  the tab correctly, but any future code that sets `tab` and calls `renderTab()` *without*
  `syncTabs()` will leave the group row highlighting the wrong section. Not reachable by a player
  today — leaves of other groups are `display:none`, so there is nothing to click — but it is a trap
  for the first "jump straight to this tab" feature anyone adds.
- **The third hour** — first run given to a hired hand, first order, the wait, and what comes back —
  has not been walked.
