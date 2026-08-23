# The second act — the expedition (M154–M161)

Design, 2026-08-23, detailed with the author. The forks were taken by the assistant under the
standing "run the plan" order and can be reversed before M154 is built. Everything here is built
on channels that already exist — receiver (`25e`), rumours (`11t`), the board of returners
(`11s`), counter queue, table (M128), recorder tapes (M123), the panel and its misclosure (M122),
the hours drift (M136-hours), the postal round (M133), passports (M150), links as data (M131).

## Why a second act

The hundred stories, fifteen regions, rumours, returners, passports and the receiver make a world
that *speaks*. What it lacks is an event that changes the world itself, not only what the player
notices in it. Soviet space fiction is built on exactly that: not an enemy but a **big common
undertaking** and the price people pay for it — Efremov's Great Ring, the Strugatskys' "Trainees"
and "Far Rainbow", Bulychev's "The Settlement", institute fiction. The periphery we built is a
world living *after* one such push. The second act is the push happening again, and the player is
one of the thousand hands that make it happen, not its hero.

## The spine in one paragraph

A structured **signal from outside** is caught on the receiver (M154). The institute collects
tapes of it from every region; in one region the tapes disagree with the sky — the **misclosure**
(M155). The institute answers the two things at once with a **circular**: an expedition is being
fitted out to go toward the signal (M156). Every region works for it; the player carries tapes,
parts, letters and people. Six rivals leave traces along the work and the traces lead to the
**sixth**, who goes with the expedition (M157). The **Tin** closes — its people are the
expedition's core — and the player carries the last letters (M158). The expedition **departs**
and does not return; a year later one unsigned tape arrives (M159). The pirates are not enemies
but **those who left** — a letter can bring some back (M160). Through all of it the player's
**record book** is written by others, and at the end a medical board grounds the player: the
second, quiet ending (M161).

## M154 — the Ring. A signal from outside

- Once in a long while (first after ~40 jumps, then rarer) the receiver's own wave carries a
  **structured signal**: pulses in groups, a rhythm that is not a station's call sign. It cannot be
  understood. It can be **recorded on tape** (M123) while it lasts (a minute), and the tape goes
  on the table or to a counter.
- Each region hears it at a different moment and a different strength; the signal's direction is
  the misclosure of the panel (M122) — the needle points somewhere the charts do not.
- A tape handed at a counter gets a line in the queue: «приняли, отправим в институт». Rumours
  pick it up: «говорят, опять поймали». Nothing explains it, ever. The Efremov key: the sky is
  inhabited and silent.
- Data: `11x-ring` (`G.ring`: heard count, tapes, directions per region), lines in `12k-ring`.
  Suite `91zzi`.

## M155 — the misclosure. The region where the counts diverge

- One region (chosen by seed from the fifteen) is the **region of the misclosure**: the
  recorders of its stations disagree about time by minutes; the hours drift (M136-hours) is
  stronger there; the sky's count (eclipses, the chrono needle) and the people's count (the
  station clocks, the board) give different days.
- The institute refuses it: the counter line is «прибор неисправен, замените ленту». The
  keepers (M139) know and say one sentence each.
- The player collects tapes from the stations of the region. Laid **together on the table**
  (three or more) they draw a **figure** — the curves line up into one shape (drawn, not told).
  It is never explained; it is the unexplained third of the hundred.
- The figure's shape is the direction of the Ring signal. Nothing says so. A player who puts
  the panel needle and the figure side by side sees it.
- Data: `11z-misclosure` (the region, the per-station offset, the figure from tapes), drawing
  in the table layer. Suite `91zzj`.

## M156 — the circular. The world works for the expedition

- The circular comes on the ether: «Готовится экспедиция. Всем станциям — по плану». From that
  day (`G.exp.day0`) and for the next ~60 game days the world changes through existing channels:
  - **queues**: every station's counter line has a demand («собираем для экспедиции: ленты,
    дыхательные картриджи, кто умеет — люди»); the plan (`11r-plan`) gets expedition lines;
  - **prices**: parts and cartridges creep up, ore down (it all goes to one place);
  - **barges** (`12l`) leave with **people** aboard — the passenger line names them;
  - **settlements** «give» one person each: a house glyph goes dark, the settlement speech has
    one line about it;
  - **crew**: a hire may ask to go («возьмите меня туда») — letting go is a morale event, not
    a loss of money;
  - **rumours**: half of all rumours are about the expedition.
- The player carries: tapes (M154/M155), parts, letters (M158), a person now and then (the
  barge passenger as a channel — closes the M131 tail: a passenger who says one line per jump).
- No quest log. The demand is the world's face for sixty days.
- Data: `11x-expedition` (`G.exp`: phase, day0, what each station has collected, who left).
  Suite `91zzk`.

## M157 — the sixth. Rivals as colleagues

- Five rivals have stories; the sixth «waits for a face». The Soviet key: a rival is not an
  enemy but somebody doing the same work another way.
- **The relay:** each of the five leaves a trace in a region not their own during the
  expedition work (a tape handed in, a part left at a counter, a line in a settlement). The five
  traces are **links as data** (M131): each trace carries the address of the next. Together they
  draw one route on the charts (M141) — and the route ends at the sixth.
- The sixth: a face (`12d-mgr-face`), a name, one long story in the institute key — the report
  on the person who chose to go. Met once, at the core station of the misclosure region. Goes
  with the expedition.
- Data: five stories in `12k-stories-d` with `link:` fields; the sixth's story; `11s-returners`
  learns the sixth's name for the board. Suite `91zzl`.

## M158 — the last run. The Tin closes

- The Tin (M147) is where everyone came from and where everyone wants to return. It **closes**:
  the resource is out, the people are the expedition's core. «Последний рейс» is announced on
  the ether with a day.
- Each region sends **one person** to the Tin; the player can carry them (barge passenger
  channel) or not.
- **Letters with content.** The postal round (M133) has envelopes, not letters. Ten letters are
  written (`12k-letters`): the player carries them and does not read them; the addressee reads
  aloud at the counter when handed — one paragraph each, in the key of the institute fiction and
  the settlement speech. Three of them are to people on the Tin; if the player is late, the
  letter stays in the hold with a line «адресат выбыл».
- After the day the Tin's slot in `plan` is dark; the Tin's story (M147) gets its last trace.
- Suite `91zzm`.

## M159 — the departure. The board line and the ending

- On the day: the ether goes quiet for a minute (no music, no lines), then one line: «Ушли».
  The board of returners gets a **line without a name**.
- **The offer**, once, at the departure, if the player is at the core station: «Есть место». Going
  is an ending: the log closes at that line, the save is marked, the title screen shows the
  nameless board line. Not going is the game continuing.
- **Does it return?** No. A year later (365 game days) one **unsigned tape** arrives at the
  player's home table. Laid on the table it draws the M155 figure, complete. Nothing else.
- Suite `91zzn`.

## M160 — the Island of Oblivion. Pirates as those who left

- Efremov's Island: those who do not want the common work go there and are pitied, not fought.
  The rogue managers (`12g-mgr-rogue`) and the pirate bases (M35) get a second reading: the
  pirate region is **where people went**. Former hires, one rival, Aunt Ustya's sister's place.
- During the expedition the Island sends nothing and takes nothing. But a **letter** (M158)
  addressed to a name on the Island, delivered by landing unarmed at the pirate base (a new
  «with a letter» approach instead of boarding), brings that person to the board of returners a
  week later. Three such names. The boarding game stays; this is the second door.
- Suite `91zzo`.

## M161 — the record book. The player's biography and the quiet ending

- Things have passports (M150); the player has none. **«Трудовая книжка»** — one page in the
  study at home. Entries are written **by others**: a station «благодарность за доставку ленты»,
  the institute «выговор за срыв плана», a settlement «характеристика: бывает редко», Vega
  «дома не бывает» (M153), the sixth «рекомендация» (M157). Service length in game years.
- **Board of honour**: each station has one; the player's name appears on one station's board
  when the entries say so. The only award in the game.
- **Ageing and the board.** After N game years (default 12) a medical commission at the core
  station grounds the player: «к полётам не допущен». The ship can still be flown by the fleet;
  the player goes home. The second ending, quiet, in the "Trainees" key: pension at home, with
  Vega and two parrots if M153 ran its course. The record book's last entry is written by the
  parrot.
- Data: `11aa-record` (`G.record`: entries with author and day, years), drawing in the study.
  Suite `91zzp`.

## After the act (release look)

The table as paper/bills/pile and the removal of the overlay HUD are made after M161, for an
interface that fits the act — not before it.
