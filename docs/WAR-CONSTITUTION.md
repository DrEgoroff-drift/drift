# The war's constitution — what a циркуляр may and may never do

The war has two layers (§12 of `DESIGN-war.md`). Below: six agents by seed plus the players'
ведомости — it runs with nobody. Above: **циркуляры**, entries in the same chronicle authored by
the regulator (Claude, on a schedule over ssh) instead of by the seed.

This file is the limit on the upper layer. It is not advice: `circValid()` in `src/12aw-circ.js`
is written from it line by line, the same check runs in the client and in `php war.php circ`, and
a test compares the two. **A циркуляр that fails the check is not applied at all** — not clamped,
not partially honoured, not logged as a warning and used anyway. That is deliberate: the regulator
must not be able to talk itself into an exception, and neither must the person writing it.

## May

| what | limit |
|---|---|
| need weights of the powers | ±30 % of a need, per power, per циркуляр (`need`) |
| named events | `election`, `strike`, `embargo`, `ultimatum`, `truce`, `build`, `revizia` — and nothing else (`event`) |
| the six waves' texts for the day | one line per power, ≤ 280 characters, no `<`, `>` or `@` (`say`) |
| the dials of §11.5 | ±20 % of `sat`, `ceiling`, `bosstrig`, `leftlife`, `rally` (`dials`) |
| the month's season | the eight dials of §15, through the season's own validator (`season`) |

A циркуляр carries `n` (the сводка it is stamped with) and may carry `who` and `ru` — the paper's
author and its own text. **No other field is allowed to exist**: an unknown key fails the whole
циркуляр. The rule is deliberately in that exact place, because otherwise tomorrow there is «one
more small field».

## May never

- Touch a player's things, money, parts, hull, fuel or hold — in any direction, including as a
  gift.
- Erase or edit an episode, a person in a notebook, or «не простил».
- Undo «закреплено»: what the crowd pinned by beating «Ревизия» stays pinned.
- Name a player, quote a player, or carry any text a player wrote. There is no such text in the
  game and there will not be.
- Move systems directly. The map is moved by agents, by fronts and by the ведомость — a циркуляр
  can lean on those, never replace them.
- Reach back: a циркуляр is stamped with a сводка and applies from it forward. History already
  replayed is not rewritten.

## How it is seen in the game

As **paper**, in the voice of the wave you are tuned to: ГЛАВТРАССА prints a «Циркуляр» (гл. 54),
Компания a press release, Орднунг a numbered order, Коммуна an address, Рассвет an announcement,
Хай-Фронт a firmware note. The satire closes on the regulator itself, which is correct: from
inside the world, the upper layer *is* paper from above.

## The session

Daily or weekly, over `ssh drift`:

```bash
php war.php digest 7          # twenty lines: сводки, who took what, where the crowd hit the
                              # ceiling, where «Ревизия» triggered, hulls in battle, signals,
                              # and any сводка where clients' chronicle hashes disagreed
php war.php circ circ.json    # file one циркуляр into the chronicle
```

Silence is a valid session: with no циркуляр the seed's own history runs, and that is the default
the whole design is built to survive.
