# Vega — the lodger who cannot be evicted (M153)

Design, 2026-08-23. A comedy of one wish, after the author's retelling of the film "Obsession"
(2026) — without the killings, in the key of Soviet communal comedy and the Strugatskys' institute
of wishes. The one idea kept whole: **the player did it himself**, and love without the right to
say "no" is not love.

## Who she is before

**Vega** («Вега»), the radio operator at the station nearest home. Hers are the lines you hear on
the receiver and at the counter; she knows your hull and says «заходи» once a week. Warm, never more.

## The device

On the flea (`12ua-flea`), only once the home has the "living" tier, an old man sells
**«Желание-1»** — a one-shot device, VNII of nobody knows what, instructions lost. Cheap. It goes
on the table (M128). Pressed once. Three wishes are offered, and **all three end in Vega**
because the device "understood in its own way":

- «чтобы меня любили» → Vega;
- «чтобы дома кто-то ждал» → Vega;
- «чтобы не было так одиноко» → Vega, plus the line «исполнено с запасом».

## Act 1 — the dream (days 1–5)

Vega leaves the station and moves into the living part. Home is better than it was: morale above
the mate's, the suit darned in the morning, breakfast on the table, tender lines in the ether.
Aunt Ustya «уехала к сестре» — the mate slot is hers now.

## Act 2 — the obsession

She must know where you are. `G.home.vega` keeps the stage, **attachment**, days away, the list
of broken things, eviction attempts.

- **Receiver:** «ты где?» every hour; turning the knob to her wave counts as answering; unanswered,
  the tone hardens.
- **Days away:** 1–3 she calls; 4–7 her lines enter the ether of every station in the region
  («борт такой-то, ваша Вега просила передать»), rumours (`11t`) pick them up; 8+ she **breaks
  things at home**: the case glass, the garage lamp, a mug in the study. The cracked case is
  visible from then on. Comedy, not a tax: a small morale dent, nothing in the economy.
- **Jealousy without victims:** she writes notes to the crew (a hire complains in `12b`);
  **the parrot starts repeating «не уходи»** (M131, the parrot as carrier); the mate does not
  come back.
- **The loop, as in the film:** every eviction attempt is **+1 attachment** → more calls, more
  broken. Thirty eviction replies before one repeats: «Тут мои тапки», «Я уже прописалась»,
  «Куда? Там вакуум».

## Act 3 — it cannot be undone

Back at the flea the old man is gone; another seller: «Какой прибор?». A letter to the institute
through the counter queue: «Возврат не предусмотрен. Инструкция утеряна. Ждите.» Nothing comes.

## The mirror

One day a **second «Желание-1»** lies on the table, already pressed. It acts on you, through the
ship: once a day at launch from home «ЗАПУСК ОТЛОЖЕН: вы обещали остаться»; the autopilot pulls
a little toward home; a HUD line «хочется домой».

## Flying with her

At launch from home a choice: **she stays or she flies**. This is where most of the comedy is.

- **Aboard, the interface shows it:** a second figure in the cockpit (the right seat of the
  M124–M127 cockpit), her line in the HUD («ВЕГА · на борту · настроение: …»), her remarks in the
  speech queue, her name on the passenger line of the station board. The receiver calls stop —
  she is here and comments instead.
- **Helps:** reads the charts (county charts M141 — a free "where is the nearest X" once a day);
  darns the suit between landings (`S.suit` regen a little faster near the ship); tunes the
  receiver (one rumour per station is hers, never the wrong one); calms the crew once (morale).
- **Hinders:** space-sick on long jumps (a complaint per jump over N); hates caves (a line every
  minute, no help inside); scared of beasts (shouts, beasts shy); her things in the hold take
  one cargo slot («чемодан»).
- **Quarrels and sulks:** she insults («летаешь как баржа», «у тебя попугай умнее»); if you do
  something she asked not to (a raid, a dig past the warning), she **takes offence**: a day of
  silence, no help, the parrot says «обиделась». An apology is a gift.
- **Gifts:** rare finds (`12m-rare`) are what she wants; a gift drops attachment by one and
  lifts mood; the wrong gift («это же руда») is a quarrel.
- **Outings** (take her there; each is a trace of the story): the **cantina** on a station —
  costs scrip, she meets the rivals, gossips for a week after; the **fair/flea** — she buys
  something useless that then stands at home; the **grove** (M138); an **eclipse** seen
  together (a line she keeps); the **Tin** — she cries.
- **Home:** she moves your parts around («я прибралась» — nothing lost, the order shuffled),
  repaints a wall, hangs a picture; when you stay an extra day she fixes something the next.

## The ending without a death, with the same thought

The spell ends one way: **stop running away**. Engine off and **seven days at home** in a row —
she loses interest: «Ты какой-то скучный стал». She becomes herself, takes her old job at the
station — and **keeps living with you**, now as an ordinary flatmate: says hello, makes soup,
calls once a week. Still cannot be evicted; now nobody wants to. The second device on the table
quietly goes dark.

**Last beat:** she gets a parrot. A second one. Your parrots do not talk to each other.

## Code

- `11w-vega` (state, stages, days, attachment, flying), `12k-vega` (lines, outings, gifts).
- Knobs used: `homeMoraleMul`, the mate slot, the receiver (`25e`), rumours, ether, the parrot
  as carrier, crew events, the table, the flea, launch delay, cockpit right seat, HUD line.
- Drawing: her at the kitchen of the living part (`27e-ui-home`), cracks on the case and the lamp,
  the second figure in the cockpit, the second parrot.
- Suite `91zzh`: all three wishes give Vega; eviction fails at every stage; the home rebuilt —
  Vega in place; seven days at home ends it; broken things touch nothing in the economy; aboard
  → no receiver calls; offence blocks help for one day.
