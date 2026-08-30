# The Almanac — design audits of every screen

Issue-based ledger, by the author's order (2026-08-30): not an interface audit but a DESIGN
audit — every screen of the game held against the newest laws of the craft codex, findings
recorded as dated issues. Each issue names, per screen, what holds, what fails, and what is
queued; verdicts carry the law's number (`DESIGN-craft.md`).

Laws of the second expedition used in issue I:
§11 Persian miniature (even light + pattern density is the honest regime for interiors) ·
§12 doodverf (values first, colour as glaze) · §13 bokashi (a horizon band has the width of a
brush; the key block confirms «тело, обвод») · §14 portolan (a line earns its place by being
steerable) · §15 day-for-night (blue by Purkinje, sky split from ground, rim on silhouettes) ·
§16 zone system (tone as controllable steps; expose dark scenes for the shadows).

---

## Issue I — 2026-08-30 (0.278.0)

**Система (полёт).** §14 ✓ orbit tails lead to bodies, edge chips are steerable buttons.
§12 ✓ gradePass glazes the frame. §16 ✓ dark field keeps detail (nebula, blots). §13 —
n/a. Open: cold accent still weak (ledger pair 0–1%).

**Карта галактики.** §14 ✓✓ the sheet became a chart this week: rhumb web from the current
system, galactic band, reach disc — every line steerable. §16 open: mass 2% — the band needs
another value step (queued).

**Широкая система (чертёж).** §14 ✓ one orbit one line; station body reads. Holds.

**Заход (посадка).** §14 ✓ the corridor is a light that leads. §15 ✓ thrust flame is the warm
source; rim on ridges at night via the shared night block. §13 — haze band widths NOT yet
measured against the brush rule: queued as a measurement, not a change.

**Грунт день.** §12 ✓ values under glaze (chunks + gradePass). §13 queued: `drawSkyBase` air
band spans H*.36 — half a sheet, not a brush; measure and narrow deliberately. §16 ✓ notan
instrument watches. Ledger: tones 3 — palette poverty remains the open sin.

**Грунт ночь.** §15 ✓✓ the reference implementation now: value structure (M172), sky split
from ground, cold rim (M280), incandescent lamp pair, sun kept out. §16 ✓ shadows keep detail.
Closed as design; ledger numbers lag the eye and stay tracked.

**Шахта.** §16 ✓ vignette gives the frame its middle; warm lamp air (M278). §11 n/a. §12 ✓
strata values first. Holds.

**Пещера.** §16 FAIL — the codex's own words: expose for the shadows; blacks sit in zone 0–I
(mass 8%, tones 3). The next frame-ledger target. §15 partial: warm air vs cold flora is the
temperature pair, needs one more step.

**Пояс.** §16 ✓ contrast .34 after the Milky-Way band; §14 ✓ target frames/compass steer.
Open: the judge's own staging looks away from the band (mass 4%) — verify the instrument
before touching the scene again.

**Черпак газов.** The exemplar frame: passes every law it meets. Do not touch.

**База (разрез).** §11 ✓ rooms are miniatures: even light, form carried by equipment pattern.
§16 open: room mass vs rock (7%) — spill added (M279), one more value step queued. §12 ✓.

**Дом снаружи.** Landscape regime; §15 night handled by the shared block. Holds.

**Дом изнутри.** §11 FAIL — the flagship debt: furniture is flat boxes with NO pattern; the
miniature law says pay it with ornament (blankets, panel seams, floor tiles), not with fake
shading. Queued as the first §11 work item. §16 open: tones 3, warm 96 without a cold accent —
the night window's cold spill is the honest pair (queued).

**Зимовка.** §11 partial: wall panels and dials carry pattern; the bunk/blanket is bare —
same §11 queue. §15 ✓ lamp cones vs window night. Holds otherwise.

**Санаторий.** Landscape regime on deck: railing shadows, sea values — holds. §11 applies
indoors only; the распорядок board is pattern ✓.

**Рейд.** §15 ✓ emergency lamps breathe warm vs cold void. §5 priced separately (quad-UV
strokes, own session). Holds within its price.

**Дорога.** §14 ✓ the road itself is the instrument; aurora field holds §16 zones. Holds.

**Станция (док) · СТОЛ · открытка.** Paper regime: the table IS a miniature (§11 ✓ — even
light, ornament of stamps/lines carries form); postcard atelier bakes values first (§12 ✓,
M250). Holds.

**Queue extracted from issue I:** cave shadows to zone II–III (§16) → furniture pattern (§11)
→ home cold window (§15/§16) → sky-band width measurements (§13) → map second value step
(§16) → belt judge staging check (§16) → P4 grisaille session (§12, standing).

---

## Issue II — 2026-08-30 (0.282.0) — the INTERFACE

Ordered by the author the same day, in the same words as issue I but pointed elsewhere: "the
interfaces are all shifted and overlapping"; "there is porridge there now, you cannot tell what
is going on"; "we kept adding things and now it feels illogical". Issue I judged the picture;
this one judges the machine the picture is served through. Same form: per screen — what holds,
what fails, what is queued — with measured numbers, because an interface complaint that is not a
number is a matter of taste and will be argued about forever.

Laws used in issue II. None are invented here; they are the project's own, and the source is
named so the verdicts can be checked:
И1 hierarchy comes from size and colour, not caps (`style.css`) ·
И2 anything poked with a finger is ≥44 px (`style.css`, `91f-ui`) ·
И3 only what is needed right now hangs over the world (`style.css`) ·
И4 two permanent buttons on the right edge, the rest in the drawer or on a reason (`CLAUDE.md`) ·
И5 a button names the action, and takes its verb from the prompt (`CLAUDE.md`) ·
И6 the frame is the only ruler — `--ui`, never `transform: scale` (M221) ·
И7 three voices on the console: what is heard, what lies, who is beside you (`DESIGN-ui`, M151a) ·
И8 the table is a table: a notebook with three tabs, and objects lying on it (`DESIGN-ui`, M151a) ·
И9 one slot for the hint, always in the same place (`DESIGN-ui`, M167) ·
И10 a button either works or is absent — no ghosts (`DESIGN-ui`, M167) ·
И11 painted and marked-up interface share one layout: the canvas measures, it does not guess
(M285, this issue).

**Пульт (console, prompt, pads, rail).** И7 ✓ the three zones exist and are built. И9 ✓ one
slot, fixed to the bottom. И4 ✓ two permanent buttons; the rest arrives on a reason. И2 ✓ every
flight and drawer button clears 44 px, and `91f-ui` holds it. Open: the drawer is six doors, not
the five the release design named — В ДОРОГУ was added later and never re-argued.

**Карта галактики.** И11 was FAILING and is fixed in this issue: the system card and the jump
lines were laid out from `PAD_SAFE=104` while the prompt, the ether line, the pads and the rail
are DOM. Measured on a 393×830 phone: the prompt (612..626) lay inside the card (568..672), the
ether bar (705..734) covered the status rows (baselines 696 and 712), and the rail (x291) cut the
card's corner (x16..316). Now `HUD_FLOOR`/`HUD_RAIL` are read off the DOM once a frame and the
footer stacks upward from them; the map publishes `MAP_BOX` and `91f-ui` compares canvas against
markup. Holds.

**Система (полёт).** И3 ✓ nothing hangs over the middle. Open (measurement, not a change): the
target chips are canvas and now have a way to be checked (`MAP_BOX`), but only the map uses it —
the chips near the ether bar in system view have not been measured yet.

**Грунт.** И9 ✓ one hint band, its top measured off `HUD_BAND` rather than guessed — the
oldest instance of И11 done right, and the model the map now copies. Fixed here: the hint said
the place's name twice when the find repeated it ("ОСМОТРЕНО · КРИСТАЛЛЫ КРИСТАЛЛЫ ×7").

**СТОЛ.** И8 FAIL — the flagship debt of this issue. The release design (M151a) put a NOTEBOOK
with three tabs on the table, and objects lying beside it: tapes, letters, things, the record
book, clippings. What exists is one flat strip of **18 tabs** (13 live in a played save), 777 px
of strip inside a 393 px window: six visible, and the chosen one could sit off the edge — a
player looking at РЕЙСЫ saw no highlighted tab at all and could not tell where he was. The two
levels of the design collapsed into one, one tab at a time, exactly as the author described.
Half-fixed here: `tabsSync` brings the chosen tab into view and the strip fades where it
continues. The structure itself is queued below as a fork for the author.

**Станция.** И8 ✓✓ the same problem, already solved and the model for the desk: 14 tabs live
under 6 sections (`ST_GROUPS`), never more than five in a strip, dead sections not drawn.
`91f-ui` guards it. Holds.

**ЭКИПАЖ.** И10 FAIL, И2 FAIL, И1 open. Measured with one hired hand and no spare hull: **eight
buttons, seven of them disabled, and those seven are 31×40 px** — under the 44 px law, and all
of them ghosts. The screen's whole answer is one red line in the middle of a wall of small grey
text ("не выдан — он не может работать"), while the three module rows with their long explanations
take the rest. The 44 px guard never looks inside a screen — it walks `.pads`, `.rail`, `#menu`
only; that hole is what let this stand. Fixed here: the hiring board counts free hulls before the
money is taken, and an idle hand says once, in the journal, that he has no ship or no order.
Queued: the shape of the screen itself, below.

**ШТАБ · КОРАБЛЬ · НАСТРОЙКИ.** Hold within their price: one strip, few tabs, no ghosts.

**Where the porridge actually is.** One question — "what is working for me while I fly?" — is
answered in four different places: наёмники in ЭКИПАЖ, управляющие in ШТАБ, дроны in
СТОЛ → РЕЙСЫ, базы in станция → ВЛАДЕНИЯ. Each of the four was right when it was added, and
together they are the thing the author called illogical. This is the fork worth deciding before
any pixel moves.

**Queue extracted from issue II.** Both forks were put to the author the same evening and
settled the same evening; what they chose is recorded here, and what is done is struck through
in words rather than in markup, because a queue that only grows is not a queue.

- ✔ **one screen for everything that works for you** — chosen over keeping four places.
  Built as ДЕЛО (M286, `27n-ui-deal`): a summary with one line per worker, leading to the
  screen that commands it. The drawer went back to five doors on the same move.
- ✔ **ЭКИПАЖ as roster→card** (И1) — the roster is ДЕЛО, the card is one man.
- ✔ **no ghosts, 44 px inside the screens** (И2/И10) — measured 31×40 and seven disabled of
  eight; both guarded now by `91zzzzc-deal`.
- ✔ **the desk as the drawn table of M151a** — chosen over sections-like-the-station, built
  as M288. Thirteen things lie on the boards and are tapped; a thing's own tabs live inside
  it, and the notebook wears its three bookmarks on the top edge. The lamp went back to being
  a pool, so the boards read as boards. РЕЙСЫ left the desk for ДЕЛО on the same move.
- ❑ target chips in system view measured against the ether bar (И11).
- ❑ **the table in the cantina answers where the hand is** — `putOnTable` gives one line all
  visit and prints it into a small grey row below the button; one reply in five is deliberate
  silence and reads as a dead button (И10 by another road). Designed in `DESIGN-ui.md`.
- ❑ **a rumour's address can be aimed at** — «сектор −9:18» is off-map, unselectable and beyond
  the jump range, and the notebook does not count the distance. Designed in `DESIGN-ui.md`; the
  rule «no marker on the wonder» stands.
- ❑ **the map gives the sky back** — measured 31.7% of a 393×830 phone is interface, the system
  card 250×110 over the reach circle (И3). Designed in `DESIGN-ui.md`.
- ❑ the 44 px guard walks every screen, not only the two it was taught (И2) — `91zzzzc`
  covers ДЕЛО and ЭКИПАЖ by hand; the sweep is still to write.

---

## Reserved — issue III: the fleet

Not written yet, because nothing is drawn yet. `DESIGN-holding.md` §18 designs the state fleet of
**ГЛАВТРАССА** — thirteen classes off real Soviet donors, the truss node station, the silent
«Полюс» — and §18.6 already holds the whole system against the codex before a line is drawn: §1
the paint order (dark ground → greys → glazes → wear → highlights, wear *under* the highlights),
§12 values before colour, §3 one ship in the frame and the hull keeps its quiet, §5 four materials
and four treatments, §8 one joint grammar from a boom to a station, §13 contour first, §14 a trace
on the map must be steerable, §15 the shared night block, §16 white in zones VII–VIII and the
ferry's black belly never at zero.

Issue III opens when the first three classes exist and can be looked at. By the author's standing
order of 2026-08-31, every drawing of the fleet is checked here before it is called done.
