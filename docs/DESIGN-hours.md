# The newcomer's hours — walkthroughs

## The second hour

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

---

# The third hour — walked 2026-08-27 (0.196.0)

The section above left *"the third hour — first run given to a hired hand, the wait, and what comes
back — has not been walked."* Walked now; shipped as **M215 (0.197.0)**. Two findings, both about the
same screen, and both of the same family as the second hour's: **the game contradicting itself or
staying silent at the exact moment money changes hands.**

## 1. The contradiction M212 fixed came straight back, through the side door — **fixed**

M212 made a candidate's experience follow the traits printed beside it, and guarded `genMerc` over
900 seeds. But the station does not show what `genMerc` returns. `stationMercs` post-processes the
list by reputation:

```js
if (rv >= 2) for (…) out[i].xp = Math.max(out[i].xp, 40 + (rv >= 4 ? 60 : 25));
```

— with no regard for who the person is. So on any station where the player is known, a candidate
tagged *«необстрелянный — дёшев и НЕОПЫТЕН»* is stamped **опыт 65**, or 100 further up. The same two
adjacent lines arguing with each other, only now switched on by reputation instead of by a stray
`Math.random`. The M212 guard could not see it: it tested the generator, and the bug lives one call
downstream of it.

The bump's own stated intent is *who came*, not *who they suddenly are* — where you are known, a man
with a record is sitting at the table. So it now lifts only candidates who can plausibly have one and
leaves a green hand alone: green is green everywhere. The same in the other direction — a veteran's
service does not shrink because your name is bad here. Guarded through the whole path this time
(`stationMercs`, not `genMerc`), at both ends of the reputation scale; reverting the fix makes the
new test fail with *«зелёный остался зелёным (100)»*.

## 2. You pay for a person, then find out he cannot work — **fixed**

The first hire costs a newcomer about a third of everything they own. Only afterwards does the crew
row say:

```
приказ: на приколе · рейсов 0
корабль: не выдан
Выдать корабль — свободных корпусов нет: купите или пересядьте
```

A hired hand needs a **hull of his own**, and nothing on the hire screen said so — not the header,
not the speciality's description, not the candidate's row. The money is spent and there is nothing
to undo it with. That is the second hour's lesson repeated: the screen where money changes hands is
the screen that must not stay silent.

The crew header now carries it — *«свободных корпусов нет: наёмнику нужен свой корабль»* — and only
while it is true. For a player who already has a spare hull it is noise, and the standing rule is
that only what is needed right now hangs over the world.

## Still open

- **The run itself.** With no second hull there is no order to give and nothing to wait for, so the
  back half of the third hour — the order, the wait, the return — needs a save with two ships and has
  not been walked. That is where `CREW_YIELD` (a hand recovers ~85% of wages; the profit lives in the
  tails of the event table) meets the player for the first time, and it is the most likely place for
  a "he loses money, is he broken?" reading.
- **The fourth hour** — first manager actually appointed, first domain — is untouched.
