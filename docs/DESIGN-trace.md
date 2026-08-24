# Someone else's mark — asynchronous players in one galaxy (M171)

Written 2026-08-24. The game has always been about **traces, not tasks** (M129): the world
carries what happened, and nothing points at it. Every trace so far was written by the author.
This design lets one of them be written by another player — without chat, without names, without
a friends list, and without a single character typed by a human ever crossing between two games.

## The rule that shapes everything

**Nothing a player types can reach another player.** Not a message, not a callsign, not a
comment. What crosses is a *mark* — one of twelve shapes cut by hand — and a *thing* — units of
cargo actually spent from the hold. There is nothing to moderate, because there is nothing to
write.

## Your hand

A pilot has **one mark for life**. It is not chosen: it is derived from the anonymous pilot id
already used by the road companion (`localStorage.drift_pilot`, random, no account behind it),
so it is yours and it is stable, and no one can pick a shape to say something with it.

The mark is drawn, not lettered: twelve strokes — arrow, cross, ring with a dot, three bars,
fork, hourglass, comb, wave, hook, star, ladder, eye. Each has a Russian name, and **none of
them has a meaning** — the game never says what a mark means, because it does not mean anything.
It says who cut it, and only in the sense that the same hand cut it twice.

Alongside the mark travels a **hand** — six hex characters derived from the pilot id, never
shown as text. It exists so your game can notice that a mark you are standing over was cut by
the same hand as one you found four systems ago. On that second meeting the notebook writes one
line and explains nothing.

## Leaving one

On foot, next to your ship, with cargo in the hold: **ДЕЙСТВИЕ — ОСТАВИТЬ ЗНАК**. It takes
up to five units of whatever you carry most of, and cuts your mark in the ground beside them.
The cost is the point: a trace no one paid for is a message board.

Three per real day. The place is where you stand — the same key stories and place memory use
(system, or system/planet), so a mark can only be left where a person actually landed.

## Finding one

Landing on a planet asks the server once whether anybody left something here. If they did, one
trace — the oldest unclaimed — lies at a deterministic spot in the strip, drawn as a cut mark
with the goods beside it. Walking up to it offers **ПОДНЯТЬ**. Taking it puts the goods in the
hold, writes one line in the notebook (НАХОДКИ), and tells the server, so it is gone for
everyone: the first to arrive gets it.

Never a marker on the map, never an arrow, never a count of how many are out there. You find
it because you walked past it.

## What comes back

The one loop that is not chat: when somebody takes your mark, your next landing brings a single
ether line — **«ваш знак подняли»** and how many times. Never who, never where. It is the whole
of the feedback, and it is enough: somebody, somewhere, is holding what you left.

## Caps and hygiene

| | |
|---|---|
| leaves per pilot per real day | 3 (server-side, by pilot id) |
| traces kept per place | 8, oldest dropped |
| lifetime of a trace | 30 days, swept by mtime |
| units per trace | 1–5, from cargo actually held |
| requests | one per landing, throttled to 20 s; failures are silent |

Offline is not a degraded mode, it is the normal one: `file://` and a dead network mean there
are no traces at all and no action to leave one. Nothing in the interface hints that a feature
is missing — the game is the same game.

## Privacy

What leaves the machine: the pilot id (random, account-free), a game-world place key (star
coordinates, not real ones), a mark index, a resource key and a count. No account, no name, no
save, no position on Earth. The road companion's sector ping (M168c) set this precedent and this
follows it exactly.

## Server

`site/api.php`, `a=trace`, three ops, all account-free:

- `put {id,key,m,h,r,n}` — leave. Enforces the daily cap and the per-place cap.
- `ask {id,key}` — one unclaimed trace for the place, plus `took` (how many of yours were
  taken since you last asked, then zeroed).
- `take {id,key,i}` — claim trace `i`; increments the leaver's `took`.

Storage lives outside the web root in `~/drift-data/trace/`: one file per place, one small file
per pilot for the cap and the counter. Files are swept on a one-in-fifty roll, the way the road
sectors already are.

## Left open, on purpose

- **Only the surface.** Station counters, the settlement wall and the cave mouth would all take
  a mark; the first pass gives it to the screen where the player already walks and looks down.
- **No recognition beyond the hand.** A pilot met three times is not "known" — the notebook line
  is the whole of it. Anything more starts to look like a friends list.
- **No trade.** Leaving goods is not a market: you cannot ask for anything back, and there is no
  way to leave a thing *for* somebody.
