# Story craft: narrative research, and the combined plan

Research notes, August 2026 — the narrative half of the walk that produced
[`DESIGN-craft.md`](DESIGN-craft.md). Same contract: laws with evidence and a module address,
never an aesthetic to import. The last section is the **combined plan** across both documents;
where it disagrees with the "Order of work" in `DESIGN-craft.md`, this plan wins.

---

## 0. Where Drift sits in the taxonomy

Emily Short's classification of interactive narrative (branching / quality-based /
salience-based / waypoint) puts Drift firmly in **salience-based**: a pool of tagged content
(the hundred stories), channels that *ask* (`storyTraces(via,ctx)`), and selection by fit to
current world state. This is the rarest and hardest of the four; Fallen London and Sunless Seas
run on the simpler quality-based form. Drift's three rules — the world tells, no journal, the
story assembles in the player's head — are exactly the strengths salience buys.

So there is nothing to copy from the mainstream: the architecture is already the advanced one.
What the taxonomy gives us instead is the **known disease of salience**, in Short's words: the
player plays along happily for an act or two and then *more or less accidentally* satisfies all
the preconditions for a badly-timed ending. Drift has five endings and a medical board. §4 is
the treatment.

## 1. The measured gap: turns never read deeds

Counted across `12k-stories-a..d`: **108 stories, 18 turns, and every turn has the same
shape** — `{after:"seen:tN",days:N,set:flag}`. The second documented form (`{day:N,set}`) is
used zero times.

Meanwhile the *trace* condition dictionary `STORY_WHEN` (`11c-stories:127`) is rich: visits,
resources, items, occupation, eclipse, time of day, the parrot. **Traces can read the world;
turns cannot.** No story in the game ever turns because of something the player *did* — only
because he *saw* something and days passed. "Второй стакан" plays out identically whether the
player kept vigil at that table or slept through the week.

**The fix is small because the machinery exists.** Let a turn's trigger accept the full
`STORY_WHEN` dictionary plus a handful of deed keys the game already remembers:

| key | deed | source of truth |
|---|---|---|
| `sat:seat` | sat at that table | cantina scene seats |
| `card:here` | mailed a postcard from this place | `25j-post-wire` |
| `passed:N` | came through N times | `G.visits` (already a condition for traces) |
| `took:item` | took the thing from the counter | desk / hold |
| `named` | the player's call sign was spoken here | the arc's own value |
| `hand` | took the settlement under his hand | `12td-settle-hand` |
| `wall` | left a mark on the stone | `11ah-wall` |

**The one hard law: a fork is never shown.** The player must not learn that a fork existed. He
returns and finds things *other* than they would have been, and cannot know it. This is the
existing rule «ничто не обращено к игроку» applied to branching, and it is stronger than any
displayed choice. No trace may say "because you did X"; the connection lives in the player's
head or nowhere, like the stories themselves.

First batch: rewrite ~10 stories whose turn is purely calendar into deed-turns
(второй стакан → `sat`; the wall stone answers a mark; a postcard changes the tone of the
place's traces; a settlement under hand turns its glyph stories to the service word; the Tin's
pennant appears only if the player carried the last letters).

## 2. The glyphs are Futhark, and that is a bug

`12t-settle.js:40` — the comment demands signs, not letters, "иначе игрок прочитает чужую речь
родными словами и словарь потеряет смысл". Two lines below, `SETTLE_GLYPH` is the **Elder
Futhark** — a real human alphabet with known phonetic values (`ᚠᚢᚦᚨᚱᚲ…`). Anyone who has seen
runes reads the pidgin as f-u-th-a-r-k; the module violates its own rule.

The repair comes from two directions that agree:

**Kolam grammar** (Siromoney & Siromoney, 1970s): two-dimensional sign systems generated from a
small set of primitives under formal operations — rotation, reflection, half-turn, joining. A
glyph set built as **6–8 radicals composed by seeded grammar** looks like a writing system
because it *is* one — and cannot be pronounced, because it maps to nothing human.

**Chants of Sennaar** (corpus discipline): the developers sized each invented language's corpus
by need — enough words to tell that people's story, no more. Drift's pidgin needs perhaps two
dozen composed signs: goods, numbers, water, sickness, thanks, refusal, the six crafts.

The deeper prize is Sennaar's core loop: **understanding as player state, not as a flag.** The
notebook already on the desk collects sightings; the player matches sign to situation himself.
Гедеван (`12tb-grok:148`, "объясняет глифы — один раз") stays as the single paid shortcut — a
translator you can hire once, for those who don't want the puzzle. This is the economy's own
law completed: the game never hands out credits, it hands out access — and the highest access
is understanding what is said to you.

## 3. A body for the crew — one axis only

Ostranauts (Blue Bottle Games) builds its crew sim on three stated truths: *bodies fail
predictably, minds fail unpredictably, crews that fail together lose together.* Drift has the
second truth already — hidden luck (`crewLuck`, never surfaced), benders, capture — but no
bodily axis at all: a hired hand is an event table.

Not proposing a needs simulation. Proposing **one axis: усталость, shown in the figure and
never as a number** — the walk slows, the shoulders drop, the answer in the queue shortens. It
reads through the existing portrait/figure brushes, costs one field, and lands squarely on the
theme: a смена is measured in what it takes out of a person.

## 4. The pacing guard: clocks over the endings

The treatment for salience's disease (§0). Borrowed form: the **clock** (Blades in the Dark;
Citizen Sleeper) — a hidden dial that advances only on *deed + time*, never on observation.

- Each ending owns a clock; a clock's segments advance only by named deeds (§1 vocabulary) with
  a minimum real-day spacing.
- An ending may fire only inside its **window** — its clock full *and* the act's clock at least
  N. Preconditions met early simply wait, invisibly.
- The guard is not a story and writes no text. It only *withholds*. Nothing is ever shown.

This needs a page in `DESIGN-arc.md` once designed; the medical board (M161) is the first
ending to put under a window, because it is the one most likely to fire absurdly early.

## 5. Strand confirmation

Death Stranding named the genre Drift's online already lives in: strangers' traces, no names,
no chat, gifts that ask nothing back. The one transferable law from strand design: **cap the
usefulness of strangers' traces** — the moment a stranger's mark is worth farming, it stops
being a voice and becomes a resource. Drift's rules (postcard = a snapshot, no exchange; the
wall gives nothing; the pennant gives nothing) already obey this. Written down here so a future
milestone doesn't helpfully attach a reward to any of them.

## 6. Dead reckoning is the engine's own name

The English working title (*Dead Reckoning: The Long Drift*) turns out to name the codebase's
first principle. Счисление пути — position derived from the log when the sky cannot be asked —
is exactly how the game is built: drone positions derived from the clock, never stored
(`12e-drone-flight`); the chess board replayed from the move list, never stored (`25n-chess`);
the sky computed from `celestAt`, never stored (`06a-celest`); the whole «never persist the
ephemeral» constraint. The world is a log plus a clock.

Story seed (seed only, not scheduled): **неделя счисления** — a stretch when the sky is
unreadable (weather, the eclipse) and navigation falls back to the log; the QSL operators
(`11an-qsl`) become the only beacons, and the institute's skywatch (`11ak`) wants the player's
reckoning against its own. The game already owns every part; the week only names it.

## 7. Late craft finds (appendix to DESIGN-craft)

Three more traditions surfaced on the second pass; recorded here rather than reopening the
committed craft doc's numbering.

**Kintsugi — the repair stays visible.** `12s-wear` already splits чинить from обслуживать, and
the hull remembers its hours. One step further, straight down the смена theme: **patched
holes leave a visible seam** — a lighter weld line, a panel a shade off. Обслуживание removes
the налёт; the seams stay forever. The ship wears its biography openly, like the record book
the others write. (`12s-wear`, `03b-hull-paint`.)

**Grisaille under glaze — bake form once, colour per world.** The Dutch built a painting as a
grayscale value study, then coloured it with transparent glazes. In canvas terms: bake a chunk's
*form* (relief, shading, texture) once in grayscale, then tint by the planet's palette with one
`multiply`/`overlay` pass. One bake serves every palette — cheaper per-world variety, and the
value structure stays consistent across worlds, which is what the richer-palette rule needs to
not drift. (`18c-chunks`, `07-planet`, `18a-material`.)

**Persian miniature — density instead of light.** Where there is no light model — the desk, the
forms, the station screens — the miniature's rule applies: hierarchy is carried by **pattern
density**, not shading. The UI law (size and colour, never caps) gains a third legal channel:
what matters is dense, what rests is sparse. (`27*-ui`, `25h-post-forms`.)

---

## The combined plan

Both documents, one ordering. Rule of the ordering: **instrument first, cheap visible wins
second, primitives third, systems last** — and raster phases (P1–P5) are independent of story
phases (P6–P8), so the two can interleave or run in parallel sessions.

| # | phase | lands in | measure |
|---|---|---|---|
| P0 | **Notan masses in `look()`** — replace the `empty` target with a 3-value mass split + boundary raggedness | `28y-look` | the instrument itself; `lookAll()` before/after on every scene |
| P1 | **The postcard atelier** — prototype blue noise, движки strokes, watercolour cloud, oriented grain *inside `drawPostcard` kits*; comparison sheet on `/dev` | `25g-postcard`, `25g-post-under/void` | `look()` on postcard canvases; eyes on `/dev` |
| P2 | **Direction as a core primitive** — `dirAt(x,y,seed)` (angle field from fbm curl); consumers: rock 皴 chunks, dust flow, one wind for grass, nebula strata, andamento background | `01-core`, then `23aa`, `16a`, `20`, `16` | `?g11` vs эталон 0.136.0 after each consumer |
| P3 | **The finish pass** — blue-noise tile in `grainPass`; движки/отборка on hull metal, rock, wet surfaces; kintsugi seams | `19c-light`, `03b/03e`, `23aa`, `12s` | `look()` contrast/tones; g11 |
| P4 | **Grisaille chunks** — grayscale form bake + palette glaze pass | `18c-chunks`, `07-planet` | g11; visual parity sheet across 3 palettes |
| P5 | **Cast shadow masks** — silhouette edges, cave first, direction from `celSun`, baked per chunk | `23a/23aa`, then `21ab`, `24aa` | g11 (masks bake, frame must not pay) |
| P6 | **Deed turns** — `after` accepts `STORY_WHEN` + deed keys (`sat card passed took named hand wall`); rewrite ~10 stories; forks never shown | `11c-stories`, `12k-*` | autotest: every turn key exists in dictionary (the `157:` check already scaffolds this) |
| P7 | **The glyph grammar** — radicals + kolam operations from settlement seed; notebook collects sightings; Гедеван becomes the paid shortcut | `12t-settle`, `12tb-grok`, desk notebook | no real alphabet in `src` (grep футарк range); corpus ≤ ~24 signs |
| P8 | **The pacing guard** — clocks over endings, windows, deed-driven advancement; page in `DESIGN-arc.md`; медкомиссия first | `11c` or new `11d-clocks`, `DESIGN-arc` | fuzzer long run must not reach an ending before its window |
| P9 | **Grown places** — recursion in the settlement/base plan; differential-growth lichen (reuse `18d-verlet`) as stage 点 | `12t`, `21a`, `20-life` | eyes; g11 |

Dependencies: P1 needs P0 (measuring the prototypes). P3–P5 want P2's primitive but only P3's
皴 half hard-requires it. P8 needs P6's deed vocabulary. P9 is last by cost and risk.

Session discipline while research mode lasts (author, 29.08.2026): **commit locally, no push**;
a second session works this repo in parallel — `git add` own files by name only, never `-A`.
