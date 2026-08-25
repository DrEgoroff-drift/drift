# The through-line — «Непутёвый»

Design, 2026-08-26, from the author's pitch. This is the personal spine of the whole game: the
story of one man, running *underneath* the world's story that `DESIGN-act2.md` already tells. The
current build is about a tenth of it.

The author's pitch, kept verbatim because every clause is load-bearing:

> Кто-то он такой уникальный, как он думает, пытается заработать, чё-то делает, но сам он дурак
> какой-то и долбоёб. Ему встречаются люди, он везучий, ему помогают, сам он добрый, тоже всем
> помогает. Его вселенная любит, не даёт деньги — даёт возможности бесконечно, но он всё
> просирает: то забухал, то пристал не к тому, то пизданул лишнего. Но вселенная всё прощает и
> любит его. Вот его становление со всеми проблемами и есть катарсис. Финал хороший, на яхте.
> Через тернии к звёздам.

## The name

**«Непутёвый».** The word is exact twice over: it means a good-for-nothing, and it literally means
*the one without a route*. The whole arc is him getting one. What people call him to his face is
**«Везучий»** — affectionate and dismissive in the same breath, and he takes it as a compliment.

Epigraph, and it is not decoration: *per aspera ad astra*. The thorns are all his own.

## The lie he believes, and the engine it makes

He arrives on a **разнарядка** — an assignment. The game already uses that word for the «Вьюк»
(`12j-home`). He is certain he was **chosen**.

He was last on the list. Everyone else refused.

**The game never says which is true.** Not once, not at the end. Both readings stay open, and both
are supported by everything that happens: he really does get chance after chance (chosen), and he
really is the one nobody else would send (last). That ambiguity is the engine — it is what lets
the same events read as a blessed life or a pitiful one depending on the day the player is having.

## The two ledgers — the rule the whole arc stands on

> **Вселенная прощает. Люди помнят.**

- **The world's ledger never closes.** Offers keep coming, at the same rate, forever, no matter
  what he did yesterday. There is no reputation gate on opportunity. This is what "the universe
  loves him" means mechanically: not luck in outcomes, **abundance in offers**.
- **The human ledger closes, one door at a time, quietly.** Nobody shouts at him. They are kind
  about it. They simply stop putting his name forward.

Everything that gives this arc stakes lives in the gap between those two. Without the second
ledger, "the universe forgives" is a hug and there is no story. Without the first, it is a
punishment system and there is no pitch.

## The universe gives opportunities, not money

This is a hard economic rule, and `DESIGN-economy.md` already leans this way (the manager takes a
cut before the money reaches you; a hired hand loses money on average; the road pays a trickle).
Make it a law:

**The game never hands out credits. It hands out access.** A new entity, the **возможность**:

```
{id, kind, who, where, opens, closes, taken, lost}
```

- **kind** — a berth on a run, a name to drop, a route nobody is working, a bay in someone's
  garage, a topic at the institute, an introduction, a debt someone will forgive if you show up.
- **who** — a person. Always a person. Opportunities have faces; that is what makes losing them cost.
- **closes** — a real window, in hours or days. **This is the only teeth the system has.**

An offer is never a quest. It is never marked on the map. It arrives the way everything in this
game arrives — a line in the ether, a queue at the counter, a letter on the table — and if the
player does not act on it, it expires without comment. That is the design rule from
`DESIGN-stories.md` («ничто не обращено к игроку»), applied to the one system that could most
easily break it.

## The three squanders

The author named them. They are not written as punishments; each one is a **choice the player
makes because it looks good at the time**, and each one **buys something real**. The bill comes
later, and it is always paid in the human ledger, never in the world's.

**Rule with no exceptions: the game never makes him screw up.** No cutscene drinking, no scripted
outburst. If a player never takes the bait, he never falls that way — and the story still works,
because then he is a different, quieter fool who lost his chances by being careful.

### 1. Забухал — the cantina

The cantina is not a trap, it is genuinely **the best place in the game to learn things**. Some
rumours exist only there and only late; some people only talk after the second glass. Drinking
buys real, unobtainable information and, sometimes, a friend.

It costs **hours**. Hours kill offers. You wake up, the window closed, and the man who put your
name forward heard where you were.

Hooks that exist: cantina (`27d`), rumours (`11t`), the counter queue, morale (`12a-crew`).

### 2. Пристал не к тому — the wrong person

Attaching yourself to someone who takes you down with them. The game already has the shape of
this: the manager who leaves turns renegade (`12g-mgr-rogue`), Vega cannot be evicted (M153),
pirates are «те, кто ушёл» (M160).

What is missing is the *choice*: a person who is obviously more interesting than the safe option,
and obviously bad news, and who genuinely gives you something you cannot get otherwise.

### 3. Пизданул лишнего — said too much

**The cheapest of the three to build, and the most interesting.** The rumour pipes already exist
and run one way: the player only ever *receives*. Make him a **source**.

Tell someone at the counter where the good deposit is — in three days a barge is working it. Say
what you saw of the misclosure (M155) to the wrong mouth and the institute hears it as someone
else's find. Repeat what the drunk pilot told you and he stops talking to anyone.

The reward is immediate and social: people open up to a man who shares. The cost arrives days
later, wearing someone else's face.

## The kindness nobody counts

He is kind, and the game **must never score it**. No karma bar, no confirmation, no "+1 goodwill".
Kindness is written to a ledger the player cannot see and the interface never mentions.

What goes in: giving a lift; feeding a settlement past the point where it pays (`12t`); paying a
hired hand who came back empty; taking the trainee (`11ac`); answering a distress call on a barge
(`12l`); leaving cargo at a mark for a stranger who will never know it was you (`11ag` — M171 is
already exactly this, and it should be the ledger's very first entry); not shooting the pirate who
turns out to be one of those who left.

Three guards so it cannot become a farm:
1. **Never displayed.** Not in the record book, not in a tab, not in a line of ether.
2. **It must cost at the moment of doing it** — cargo, time, fuel, a closed window. A free good
   deed is not a good deed, it is a button.
3. **Calculated kindness counts less.** Helping when you are rich weighs a fraction of helping
   when you are broke. Cheap to implement (compare against credits and hold at the moment of the
   deed) and thematically exact.

## The shape, act by act

| | | |
|---|---|---|
| **0** | **Разнарядка** | He arrives with a ship he did not choose and a conviction he was chosen. The current first hour. |
| **I** | **Он что-то может** | Trade, land, dig, hire. The offers begin. This is the built 10%. |
| **II** | **Он всё просирает** | The first real offer lost, by his own hand, and everyone is kind about it. **Not built.** |
| **III** | **Общее дело** | The expedition (`DESIGN-act2.md`, M154–M161). He is one of a thousand hands. His own thread runs underneath: the biggest offer of his life arrives here, and so does the biggest loss. Built. |
| **IV** | **Никого не осталось** | Doors closed. The world still offers, at the same rate, and there is nobody left who would vouch for him. The loneliest state in the game. **Not built.** |
| **V** | **Возврат долгов** | The kindnesses come back, unasked, from people he had forgotten helping. He never earned it; he *was* it. |
| **Финал** | **Яхта** | Not bought. Handed over. |

The two unbuilt acts are the two hardest, and it is worth saying why: **they are both about loss,
and games are bad at loss.** Everything in a game's grammar — numbers going up, inventories
filling, screens unlocking — pulls the other way. Act II and Act IV need scenes where nothing is
gained and the player still wants to keep playing. That is the real work of this arc.

## The yacht

The luxe yacht is already drawn (`03c-hull-luxe`) — the ending's object exists.

Three rules so it does not read as "you got rich":

1. **It cannot be bought.** No price, ever, anywhere in the game.
2. **It is given by people, not by the world.** The universe deals in chances only; a ship is a
   human gift. It should arrive from the ledger nobody counted.
3. **It is not clean.** It is somebody's old tender, or given with a condition, or handed over by
   someone who is done flying. Being trusted, not being paid.

## Endings, plural

The game already refuses single endings, and that is the right instinct.

- **Яхта** — the good one. Given.
- **Медкомиссия** (M161, built) — grounded by the doctors. Quiet. Not a failure.
- **Ушёл с экспедицией** (M159, built) — the once-offered ending.
- **Остался Везучим** (new) — nothing resolves, the offers keep coming, he keeps flying. For the
  player who never stops. The most honest ending for this particular man, and it must not be
  framed as the worst one.

## Criticism — where this can go wrong

Written before building, because each of these kills the arc quietly rather than loudly.

1. **The script screws up on the player's behalf.** The single biggest risk. A player who did not
   choose the mistake feels railroaded, and railroading in a sandbox reads as a bug. Guard: every
   squander is opt-in and buys something real. Never a cutscene.
2. **Forgiveness kills stakes.** If everything is forgiven, nothing matters. Guard: forgiveness is
   *only* in the supply of chances. Money does not come back, people do not come back, hours do
   not come back.
3. **It contradicts the second act's own rule** that «the player is one of the thousand hands, not
   the hero». Resolution: the universe's love is not special treatment, it is abundance — it
   offers everyone, and he is only the one who keeps getting up. The yacht is a debt repaid, not a
   prize. If the arc ever starts to read as "the cosmos has plans for you", it has gone wrong.
4. **The kindness ledger becomes a farm** the moment a player suspects it exists. The three guards
   above are the whole defence, and the third one (calculated kindness weighs less) is the one
   that actually works.
5. **Saccharine.** "He is kind and everyone helps him" is one degree away from a hug. Antidote:
   the people who help him are not saints either, and some of the help humiliates him. Being
   carried is not the same as being respected, and he should feel the difference before he feels
   grateful.
6. **The fool becomes annoying.** A protagonist who is only a fuck-up is tiresome by hour three.
   What redeems him is that he is *good at the work*. He flies well, he lands well, he finds
   things. The failure is never professional — always human. That distinction is what makes him
   worth an evening.
7. **Nothing here is visible to a player who plays twenty minutes.** The arc lives on a scale of
   hours, and the game's weakest point (per the playtest) is the first fifteen minutes. Building
   this before the first hour works would be building the roof first.

## What to build first, and why exactly these three

Not the whole arc. Three organs, and they turn the present sandbox into Act I of this story:

1. **The offer** (`возможность`). The smallest piece that changes the whole feel: the world starts
   handing you chances with faces and expiry dates instead of quests. Everything else in the arc
   hangs off it.
2. **The player as a source of rumours.** The cheapest of the three squanders — the pipes exist and
   run one way already. It is also the one that most quickly teaches the player that this world
   remembers.
3. **The kindness ledger, invisible and write-only.** Almost free to build, and it **has to exist
   early or the ending cannot pay**. Every hour played without it is an hour of debts not recorded.

Then, in order: Act II (the first real loss), the offers deepening through the expedition, Act IV,
and the yacht last — because an ending is the only thing that cannot be built before the middle.
