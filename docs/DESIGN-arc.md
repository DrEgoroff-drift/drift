# The through-line, game side

The story itself lives in the saga: [`saga/ДУГА.md`](saga/ДУГА.md) — what happens to Восьмой over
seventy-two chapters, the Lie and the Truth, and the single value the whole arc turns. Voice and
sentence standard: [`saga/ПОЭТИКА.md`](saga/ПОЭТИКА.md). Chapters and their analyses:
[`saga/00-КНИГА.md`](saga/00-КНИГА.md).

**This file is only the machinery** — what has to exist in `src/` for the book's spine to be
playable. Nothing here decides anything about the story; if the two disagree, the saga wins.

## The one rule that dictates the economy

The arc turns exactly one value: **назван / не назван** — will anyone say his call sign out loud.
Positive charge is «Я тебя назвал», negative is «Ничего для тебя нет».

Credits cannot carry that value. A person can. Hence the hard economic law, which
`DESIGN-economy.md` already leans toward:

> **The game never hands out credits. It hands out access.**

## Three organs, and only these to start

They turn the present sandbox into Part I. Everything later in the arc hangs off them.

### 1. Возможность — the offer as an entity

```
{id, kind, who, where, opens, closes, taken, lost}
```

- **kind** — a berth on a run, a name to drop, a route nobody works, a bay in someone's garage, a
  topic at the institute, an introduction.
- **who** — always a person. An offer without a face cannot turn the value.
- **closes** — a real window in hours or days. **The only teeth the system has.**

An offer is never a quest, is never marked on the map, and expires without comment. It arrives the
way everything in this game arrives: a line in the ether (`25e`), a queue at the counter, a letter
on the table (`27i`).

**Never mark, never count down, never remind.** In the book the expedition list closes on a Friday
and nobody tells him.

### 2. Игрок как источник слухов

The rumour pipes (`11t`) exist and run one way: he only ever receives. Make him a source. What he
says at a counter travels and comes back days later wearing someone else's face — a barge working
the deposit he named, an institute hearing his find from another mouth.

Cheapest of the three squanders to build, and the one that teaches fastest that this world
remembers.

### 3. Тетрадь доброты — invisible, write-only

Everything done for free and without witnesses. Never displayed, never confirmed, never thanked;
the ending is only possible because it exists. Three guards, or it becomes a farm:

1. Never shown — no tab, no line, no acknowledgement.
2. **It must cost at the moment of the deed.** A free good deed is a button. Corollary from the
   analysis of chapter 3: wherever the player does something for nothing, there must be a number
   he turned down.
3. Calculated kindness weighs less — helping while broke is not helping with a full hold.

First entry already exists in the built game: leaving cargo at a mark for a stranger who will
never know it was you (`11ag`, M171).

## Mapping the book onto what is built

| Book | Already in `src/` | To build |
|---|---|---|
| гл. 2 «я тебя назвал» | приёмник `25e`, эфир | **возможность**: face + window |
| гл. 3 почтовый круг | `11e-post`, `06c` amplitude 0 | six addresses, one line each, silent instruments |
| гл. 3 вскрытие свёртка | — | the parcel can be opened; the chain continues; the last one notices and says nothing |
| стойка | кантина `27d` | one line with three states across the whole game |
| «Вера» / бедствие | баржи `12l` | write to the invisible ledger |
| гараж, бокс | износ `12s` | a bay given, and taken back without a word |
| институт | `11ab` | a topic as an offer with a window |
| стажёр | `11ac` | he repeats the player's own mistakes |
| ляпнул лишнего | слухи `11t` | **the player as a source** |
| зимовка | база, погода, `09a-roomtone` | a month alone, costing and giving nothing |
| долги | метки `11ag`, посёлки `12t`, книжка `11aa` | the ledger paying out, out of order |
| финал | люксовый корпус `03c-hull-luxe` | a gift with no price that cannot be sold |

## Rules the build must not break

1. **The game never makes him screw up.** Every squander is opt-in and buys something real. A
   player who never takes the bait loses differently — quietly, by being careful.
2. **Nobody reproaches him.** Doors close politely. Exactly one character says it to his face, and
   he is wrong.
3. **The world never congratulates** (`ПОЭТИКА` §4) — not for understanding, not for kindness.
4. **The truth is never spoken.** If a line ever appears from which it follows that he was chosen
   for being kind, delete it together with its scene.
5. **The gift at the end has no price and cannot be sold.**

## Order

None of this goes in before the first hour works. The playtest put the game's weakest point at
minute two; this arc lives on a scale of hours. Building it first would be building the roof.
