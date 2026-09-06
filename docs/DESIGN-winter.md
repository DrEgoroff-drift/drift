# «Зимовка» — the survival mini-game

Sketch, 2026-09-06 (author: «зимовка отдельно, там мы сделаем прям выживание мини игру»).
**Nothing here is built, and this is not yet a design** — it is the shape of one, kept apart from
[`DESIGN-base.md`](DESIGN-base.md) on purpose so that the base stays a management game and the
survival lives in its own scene, opt-in, with its own stakes.

## What it is

The base, cut off. One continuous sitting instead of shifts resolved between visits: the ship is
gone or wrecked, the supply line is dead, and the question stops being *what do I build* and
becomes *do these people get out of this*. It ends — in a rescue, a walk-out, or a loss — and is
told about afterwards, in the journal, on the ПОЛКА, and by whoever came back.

## Why it is cheap once the base is built

It reuses everything and invents almost nothing: the same cross-section, the same modules and
rooms (`21aa`/`21ab`/`21ac`), the same five gauges (`DESIGN-base` §4), the same people. It changes
three things only — the clock (continuous, not lazy), the supply (none), and the stakes (people can
actually be lost). That is why it is queued after M395 and not before.

## What has to be decided before it can be designed

- **How you get into one.** A wreck, a storm that buries the shaft, a war (`DESIGN-war`), a chosen
  contract — «остаться на зимовку» for a reward — or all four. Chosen entry matters most: a survival
  loop the player did not opt into is a punishment.
- **How long it runs.** Twenty minutes at the table? An evening? Real days with the base ticking?
- **What is actually scarce.** Air is the obvious one and the least interesting; heat and food make
  people argue, and the arguments are where the game is.
- **What is lost.** The one place in «Дрейф» where crew can die, or still not?
- **Who tells it.** The survivor's own retelling (`12p`), the ПОЛКА book, a rumour that reaches
  other systems — the project has no encyclopedia and will not get one.

Sources worth reading before the design pass: *Sheltered*, *This War of Mine*, *The Long Dark*,
*Frostpunk* (the last winter), *Barotrauma*, and the polar-station literature the word comes from.
