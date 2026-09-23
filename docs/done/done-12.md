<!-- docs/done/done-12.md — part 12 of 30 of the done work, in the order it was written; see README.md -->

# QUEUE: the author's night orders, 2026-08-25 (M178–M186)

Written from the author's own crops of the screenshots in this session, plus two standing orders:
**"как открытка, как просто самое лучшее что видели"** and **"кнопки не исчезают на мобиле"**.
Each milestone is a version with tests and a commit; each is done in several passes with
self-criticism, per the cross-cutting rule.

- **M178 — the frame as a postcard.** Pass 1 **done (0.147.0)**: the "ringed body" was `skyHole`
  through a day sky — dark lens now comes with the night, the disc stays as a pale day ghost; the
  sky giant floored against the current air with a halo; the cave mouth and the mine's abandoned
  workings got lips, depth and lit rims; РАНЕЦ and every other canvas-corner gauge moved into the
  state and place rows; the phone prompt no longer sits under the console. **Morning screenshot
  round (0.151.0):** far ridges scale with the frame's width (no more «гора в полкадра» in
  portrait), sky bodies measure by the narrow side and their parallax is unclamped (the hole no
  longer follows the ship on approach). **Pads round (0.152.0, M182):** nothing fades itself on a
  phone any more, ОГОНЬ/РАКЕТА keep their place, button width is computed to fit the screen
  (44 px floor), the belt's left group folds into a D-pad, and the «Размер кнопок» setting works
  for the first time. **Still open for later passes:** the rain is one uniform speed everywhere.
- **M179 — the inventory as a tray** — **done (0.148.0)**: `27j-ui-hold`, the ТРЮМ tab on the
  desk lane — every resource a pile whose size answers "how much" without numbers, a form per
  material, people sitting on the edge. Paper stays for what is read. **Left open:** the suit kit
  as objects on the same desk (it lives in the ship screen's paperdoll today).
- **M180 — the pirate base.** «Пиратская база говно, там чё-то сверху всё, скафандр, человечки».
  Pass 1 **done (0.149.0)**: horizon moved above centre (postcard framing), camera closer, light
  pool at the feet, contact shadows under every body, loot and pickups turned from screen stickers
  into cases standing on the floor. **Open for passes 2+:** the enemy bodies themselves (blocky
  torsos), the hangar set dressing, the walkway/mezzanine reading, marks drawing through walls.
- **M181–M185 — five interface passes**, each with a named question:
  1. **the hand** — **done (0.150.0, M181)**: no pressable thing vanishes — ДЕЙСТВИЕ and ТОРМОЗ
     dim (`.off`, deaf to taps) instead of hiding, the bottom row never jumps;
  2. ~~**the eye**~~ — **done (0.162.0, M182)**: the loudest thing on the trading screen was an
     empty-route block explaining a feature the player does not have, and it pushed the first price
     below the middle of the frame. An absent route is a hint (one line, at the bottom); a route
     that exists is work in progress and stays on top. Six prices visible where four were.
  3. ~~**the road**~~ — **done (0.162.0, M183)**, same edit: the question "how many steps between
     wanting a thing and having it" answered itself on the market screen — the thing you came for
     was three explanatory blocks away. Nothing else measured worse; recheck when the post lands.
  4. ~~**the phone**~~ — measured and green (`test.ps1 -Mobile`); the instruments' move to the top
     was measured there too (0.160.0), two gauge rows and the place at 375 px, nothing colliding.
  5. ~~**the whole**~~ — **done in passes (0.160.0, 0.162.0, M185)**: seven mode-entry messages
     said what the place summary already says and were cut to what is nowhere else; an internal
     mode key (`system`) was being printed to the player and now has Russian names for every mode.
     Both are guarded, the second by a sweep over every screen looking for Latin words in visible
     text. **Left open by design:** the receiver console sits over the panel's title bar when a
     screen is open (M151a put it there deliberately); worth the author's eye, not a silent change.
- **M186 — the walk-through** (run at the end of the night session, 2026-08-25 03:00): every point
  of the author's five messages checked. **Closed tonight:** the old queue (12→13→A2→A3→9→10, six
  versions), the deploy (broken since 0.139.0 — `Get-Content -Encoding Byte` does not exist in
  PowerShell Core; fixed, `docs/live.ps1` now checks sources-vs-site in one line), the postcard
  crops (skyHole by day, ground holes, РАНЕЦ under pads, prompt under console), the Forest-style
  hold, the paper table kept, the pirate base pass 1, buttons that dim instead of vanishing, phone
  measured for real (`test.ps1 -Mobile`, dock/system/surface/table at 390 px). **Still open, for
  the author's morning (as of 2026-08-26 night, all but one closed):**
  ~~interface passes 2/3/5~~ — closed 0.162.0. ~~pass 4, the phone~~ — measured and green.
  ~~pirate base passes 2+~~ — closed 0.161.0: the perspective was mirrored, marks drew through
  bulkheads, and the loot crates had never been drawn at all. *Still open there:* the enemy bodies
  themselves are blocky, and the hangar wants dressing. ~~uniform rain~~ — closed 0.162.1, the
  speed is per drop now, not per layer. **Still open:** the flat far ridge.
  **Perf note:** the night's probe read system 43 / surface 39, but the 0.144 build read the same on
  the same machine at the same hour — the regression is the machine (background load), not the code;
  re-measure clean before believing any number. Confirmed again on 2026-08-26: two clean runs of the
  same build differed by ±10 fps (belt 54/49, landing 46/44, surface 48/43, road 30/41). Stable
  across every run: dig 60, cave 60, raid 60.

---


## and the tails ledger's Closed section, swept 2026-08-23

## Closed

- **Base** (M137/M138/G9/M111): gate is a door, tunnel lit, pad on a plateau shelf, plateau terrace,
  spoil heap, buried stones (0.99.2 + 0.100.3); quiet-battery notice and a heavier battery shot
  (0.100.3). `21a-mode-base` split → `21ac-base-draw` (0.100.3).
- **Cave** (M136): lower gallery dressed, beasts on both galleries and descending, contour fringe
  carries material (0.100.3). Watch visible at the mouth (M110, 0.100.5).
- **Mine** (M55 #1 / G3): landings and tub (0.96.0); chambers and niches along the shaft, rock tiles
  by world-y (0.100.4).
- **Surface** (G1/G2/G7/G8/G12): relief amplitude and strata count per kit, flora by world type;
  far ridges tile-cached, near-ground value gradient; glow bent by the star altitude, night with the
  suit lamp — an hour exists now (`celSun`, 06a); POI rhythm 3–4 per strip; wind in flora was
  already there (plants bow to `WIND`); scale check passed (lander 90–130 px vs 26 px walker)
  (0.100.5).
- **Settlement** (M109): heard before seen (knocks, voices by distance), pennant pole and smoke
  column from afar (0.100.5).
- **Figures** (M118/M119/M120): mat in the planet's tone, arms outside the torso, crate at the waist,
  warmer trail; tin plant varies per planet, hoops read as turning, plume was already smoke
  (0.99.x); grok shoulder line, strap over the box, rim on the chest arms (0.100.5).
- **System / belt** (G10/G6/M112/M114): three star magnitudes with coloured ones, nebula in two
  parallax layers; belt far plane and near dust; missiles in the belt; dry launcher on the hull;
  doomed planet from orbit; managers add lift capacity (0.100.6).
- **Raid / scoop** (G4/G5): rock walls where the base meets the asteroid, hangar gate with a cone,
  pirates at rest; giant structures (banded/spotted/jet) and sharp band fronts (0.100.7).
- **Station side** (M113/M117/M121/M122/M123/M126/M127/M128/M132/M133/M134/M55 #3, ships): see the
  0.100.8 patch note — counter length, house and place lines, flea crowd, bird on planet, tape
  persists, recorder drum, instrument knock and one clock, misclosure window, name on the table,
  strip with the parcel, post rumours, care/hurt, mirror ack, runner range, hull top light and
  asymmetry; `26-ui-station` split → `26a-ui-station-home`.
- **Panel in system view** (M122): settled by M124 — the pod is the surface there.
- **Test page**: two W=0 crashes guarded (`drawCaveDark`, `rackDial`); green since 0.100.3.

## M200a — the breed sheet, twenty passes (2026-08-26)

The author brought the character sheet for «Птица Говоруна» and asked for twenty passes of
"render → compare → fix", criticising the model against the sheet each time. What the sheet
said that the first build did not:

- **The crest is two objects, not one.** Long plumes swept back in an arc, *and* separate thin
  whiskers each carrying a cold bead. Building only the first gave a mohawk of short leaves.
- **The face is cream** — forehead, cheek and throat — with cobalt kept to crown and nape.
  Without the mask the bird reads as a blue lump no matter how good the beak is.
- **Ivory beak, not yellow**, with a raised keel, a dark tip, a painted nostril and a visible
  mouth corner; a dark interior with a tongue behind it so an open beak is not a hole.
- **Legs are long, grey-brown and scaly**, half-covered by thigh feathers; the toes wrap the
  branch by its own radius and end in real claws.
- **The tail is a stack**, not a plank: fifteen narrow feathers with stepped tips and two
  streamers of their own.

Things that cost a pass each, worth remembering:

- *A feather is longer than its row spacing, and its tip is what you see.* Twice the coat was
  fixed by changing tip shape, not by adding feathers.
- *Density on the head is a separate number.* Head feathers are small; at body density the skin
  shows through, and the head goes bald — twice.
- *Where the loft's sections vanish, so does everything laid out by `t`.* The crest roots all
  collapsed into one point at the crown until they were spread along the real arc instead.
- *A painted spot beats a modelled bead* for the nostril: the beak's sections are tilted, so a
  sphere placed "on the surface" kept ending up inside the horn.
- *Whisker and bead must share one sway phase.* A smooth phase from vertex position drifted the
  bead off its own thread; a coarse step over |x| keeps them together.
- *Back light belongs to the body, not to the plumage.* At full strength on translucent feathers
  the tail turned into a white skirt seen from behind.

Quality now degrades by itself: window width and touch pick the tier, and if the frame does not
hold, the page drops pixel density and then the bloom ladder — one way only, never oscillating.

## M200b — the joints, and the game's habits on top of them (2026-08-26)

The author: no quality fallback, the beak is small against the sheet, and **all the habits must
come from the game** — poke it and it flaps. The last point is the one that mattered: the model
had a head, a jaw and eyelids and nothing else, so the game's table of fifty habits had nothing
to drive. That is why twenty passes of colour and shape still read as "as it was, so it stayed".

**The rig now has the same degrees of freedom as the game's bird** (`12z-parrot-acts`):
`flap`, `stretch`, `fan`, `crest`, `tuck`, `step`, `footUp`, `hop`, `turn`, `peck`, `hang`,
plus the head, jaw and lids it already had. Wing, tail and crest are three joints applied
*before* the body pose, because they are local; the foot is lifted on one side only, chosen by
`footSide`; hang rotates the whole bird around the branch's own axis.

**The habit table is ported one to one** — same names, weights, durations, moods. Habits set
targets every frame, springs do the moving, and a few of them hit *velocity* (`flapV`, `hopV`,
`crestV`) so a wing-clap is a blow rather than a smooth lift. Mood works as in the game: `x`
when she has been touched, `s` as sleep builds up, cleared by a poke.

**The poke has zones again.** A ray from the cursor against six spheres — crest, beak, head,
wing, tail, body — and each answers differently, because one reaction for every click is a
button, not an animal.

Traps of this pass:

- *A joint's axis has to match what it moves.* The wing was first rotated around Z — the axis
  the folded feathers already lie along — so it barely moved and vanished into the body. It
  opens around **Y**: from lying back to pointing sideways.
- *Fan the feathers inside the wing's plane, not by moving the wing's own angle.* Spreading the
  main angle per feather threw the far primaries up over the head.
- *Flight feathers grow from the wrist.* With their roots smeared along the whole flank, one
  shoulder pivot scattered them like a star. Roots into a tight bunch, tips along the body.
- *A dead stand server serves from the browser's cache.* Three renders in a row "proved" the
  wings were broken; the page was simply the previous build.

## M200c — the art director's pass: silhouette over detail (2026-08-26)

The author's read of the model: technically strong, but it had become a *mechanical bird made of
voxel feathers* rather than the character — everything sat at the same level of importance, so
the eye had nothing to hold on to. His order of priorities, adopted verbatim:

    silhouette ↑↑↑ → big forms ↑↑ → character ↑↑ → small detail ↓

and, explicitly: **do not make it more realistic**. The strength here is stylised creature
design — a fluffy exotic bird plus something alien plus a little biomechanics, not a real parrot
rendered in 3D. The palette was declared correct and untouched.

What changed:

- **Coat: five times fewer feathers, each a plate instead of a scale** (34 rows × 52 against
  72 × 142). Per-feather colour jitter cut to a third: an even block of colour is the point, and
  the jitter was what turned the body into noise.
- **Crest: seven big plumes** instead of twenty-odd needles, with a length table so three of them
  carry the outline. The crest is now recognisable by its *contour*.
- **Whiskers: two pairs**, thick at the root and tapering, one pair swept back, beads a third
  smaller — an alien sensory organ, not wires glued to a bird.
- **Wing in three tiers**: five large primaries, five secondaries, two rows of six coverts, plus
  a pale mirror and a narrow amber leading edge. Colour in blocks; nothing multicoloured
  per-feather.
- **Tail: five long feathers**, the middle pair longest.
- **Beak a fifth shorter and thicker at the base**, hook sharper: it should be part of the
  character rather than the character being built around it.
- **Eye smaller and set deeper**, dark iris with a thin amber ring around the pupil.
- **Legs of a creature**: longer and thinner tarsus, three toes forward and one back, segmented,
  smaller claws, warm brown-gold.

**And the hole in the head was real.** A loft is a tube: its poles were never closed, and while
the plumage was dense and small nobody saw it. Enlarging the feathers opened a window straight
into the skull from above. Fixed twice over — the caps are built now, and a *crown* of nine
feathers is laid over the pole where the loft's sections degenerate to a point.

---

# QUEUE: сага против игры — что есть, чего нет (сверено по коду 26.08.2026)

Проверено не по памяти: все модули, которые называет разбивка `docs/SAGA-BOOK.md`, найдены
в `src/` по префиксу — **не отсутствует ни один**. Значит, дело не в коде, а в том, что внутри
готовых органов не хватает конкретных событий. Ниже честная разница.

## Есть и работает

Почтовый круг (`11e-post`, приборы там молчат через `06c`) · восемь глав отчёта и учёт
прочитанного (`12q-lore`) · смотритель (`11k-keepers`) · табло вернувшихся (`11s-returners`) ·
Вега, ученик, трепло, трудовая книжка · и построенное в этот заход: возможность как работа,
невидимая тетрадь, тихо закрывающаяся дверь, четверо (0.164.0–0.166.0).

## Есть модуль — нет ключевого события

| Что | Где | Чего не хватает | Цена |
|---|---|---|---|
| Строка без имени | `11s-returners` | среди просроченных строк табло нет ни одной с позывным шлюпки «Долгого Хода» | одна запись данных |
| Восьмая графа | `12q-lore` | восемь глав есть, но графа не спрашивает **имя принявшего**, и заполнить её нечем | средняя |
| Ирония трепла | `12z-parrot-*` | нет таблицы «своё событие → строка отчёта»: птица не повторяет чужую главу в минуту, когда та совпала с твоей | данные, один файл |
| Концовка смотрителя | `11k-keepers` | игла области не связана с присутствием игрока — скрытой концовки нет | обе механики уже есть |

## Нет вовсе

| Что | Почему это важно | Цена |
|---|---|---|
| **«Глобус»** | центральный предмет книги: латунь, щелчок раз в секунду, вторая стрелка — куда сядешь, если затормозить сейчас. В `25a-instr` его нет ни строкой | малая |
| **Игрок как источник слухов** | третий просёр («ляпнул лишнего»). Трубы `11t` есть и текут в одну сторону | средняя |
| **Ночи дома** | финал книги — он ни разу за двенадцать лет не ночевал в своём доме. Счётчика нет | малая |
| **Зимовка** | месяц одному: держать реактор, слушать стену, дождаться баржи | средняя |
| **Лезвие** | один заход, где можно не вернуться, и по своей вине | средняя |
| **Заступа** | шестая соперница: имя в слухах с части I, лицо и один разговор в VI | вечер |

## Противоречие, которое надо решить

**`G.name` уже существует и показывается на экране штаба** (`27c-ui-hq`, «ВАШЕ ИМЯ»), а книга
требует обратного: все зовут по позывному, имя игрок читает **один раз в самом конце**, чужой
рукой, в трудовой книжке. Построенное и замысел прямо расходятся. По замыслу имя надо перестать
показывать; это решение автора, потому что экран уже живёт.

## Порядок работ

1. **«Глобус»** — дёшево, видно глазами, и это тот самый предмет, ради которого писалась четвёртая глава.
2. **Строка без имени** — одна запись, платит через всю часть VII.
3. **Игрок как источник слухов** — следующий по приговору `docs/saga/СУД.md`.
4. **Восьмая графа** — главный поворот книги.
5. Ночи дома · ирония трепла · концовка смотрителя · Заступа · зимовка · лезвие.

## M200d — the ruler: a real macaw against ours (2026-08-26)

The author dropped in a rigged scarlet-macaw FBX (Tripo reconstruction, 56 MB, 970k vertices,
plumage *painted* rather than modelled). It cannot go into the module and was never meant to:
the module is one downloadable file, its pose lives on fifteen joints, and its colour is a
function of the breed. What the model is good for is a **ruler**.

- `docs/fbx.ps1` reads binary FBX (7400) directly — nested records, zlib-deflated arrays — and
  writes the mesh out raw. Two traps: `New-Object Type($a,$b,$c)` parses the parentheses as one
  array and arithmetic inside them lands on the array (`op_Subtraction on Object[]`), so
  arguments go through `-ArgumentList`; and converting three million doubles to float32 in
  PowerShell takes minutes, so the arrays are written as they are and the browser reads them as
  `Float64Array`.
- `docs/macaw-stand.html` draws three orthographic projections of the point cloud. A slice
  through the middle plane was useless — the model flies diagonally in its own file, so the cut
  went across it; whole projections are honest.

**Measured, then applied.** Wingspan 0.98 against body length 0.89: a wing is about as long as
the body, and ours reached a third of it. Fixed, and with it two things the ruler exposed:

- *Folded flight feathers are a stack, not a fan.* Their directions are nearly parallel and only
  the length differs; ours already fanned at rest, so opening the wing turned it into a star
  around the bird instead of a blade.
- *A tail fans from where the feathers grow.* The spread was computed from vertex x, and on a
  long feather the tip crosses the centre line, flipping the sign mid-feather — the tail opened
  as a cross. It now uses the instance's own root.

Also this pass, on the author's note that the bird had become a mechanical thing made of voxel
feathers: the coat is laid in **two layers** — dense small down underneath, big plates over it —
and the feather profile was rebuilt from a real contour feather: a thread-thin calamus, quick
widening, the broadest point below the middle, a soft oval tip, and asymmetric vanes.

## M200e — the wing has its own axes (2026-08-26)

The author drew the direction of the feathers straight onto the reference: they do not run along
the body, they fan **from the leading edge back and outward**, in overlapping rows. Everything
laid out along the body's spine parameter therefore read as ribbons down the flank, however many
feathers were in it.

The wing now has its own frame: `axis` from shoulder to wingtip, `across` from leading edge to
trailing, and a table of five rows — amber coverts on the edge, then violet-grey, the cream
band, pale-blue secondaries and long primaries — each row shifted back, longer, and rotated a
little less. Colours from the sheet; the deep cobalt trailing edge closes the stack.

Also: the beak follows the author's photograph now — bone at the base washing into warm amber
toward the hook, dark horn at the very tip, and the lower mandible as a short **darker** wedge.
A pale lower mandible merges into the upper one and the mouth disappears.

## M200f — five passes against the sheet, and why the site lagged (2026-08-26)

Five rounds of render → critique → fix → verify, each against the breed sheet's «Сбоку» view:

1. The folded wing lay as a horizontal plank longer than the tail; on the sheet it angles down
   and back and ends before the tail does. Wing axis tilted, rows shortened.
2. The beak was too big and almost white — warmed to the photograph's amber and cut down; belly
   tucked so it stops overhanging the feet.
3. Overcorrected: the beak had become a duck's nose with no hook. Height and hook restored, and
   the tail's five feathers given scattered lengths — an even fan of identical feathers reads as
   one blue plank.
4. Wing and tail merged into a single horizontal mass. The wing went up onto the back, the tail
   down and back; the crest grew a fifth.
5. Primaries converged to a point — a besom, not a wing tip. They splay now, and the culmen was
   slimmed where it had gone bulbous.

**And the reason the live site kept lagging a commit:** `bird.ps1` built its output path as
`Join-Path $root "site\treplo3d.html"`. On the Linux runner the backslash is not a separator but
part of a filename, so CI wrote a file literally named `site\treplo3d.html` into the repo root and
uploaded the *previous* committed page. Paths are composed part by part now.

## M200g — the pole plugged for good, seven times the feathers (2026-08-26)

- **The hole in the crown, third and last time.** The loft's poles are closed by a fan of
  triangles, but that fan's winding is easy to get backwards, and then face culling eats the cap
  and the window into the skull is back. The poles are now simply **plugged with spheres** —
  closed at any winding, twenty vertices each, sunk under the skin so nothing shows through the
  plumage. A sphere sticking out reads as a dark bead on the crown, so it sits 30 mm in.
- **Feathers ×7** (3 300 → ~22 000: 6 200 plates and ~15 900 of down), and **fluffier**: the tip
  of every feather is lifted higher, its angle scattered in all three axes, and the plates are
  narrower so the down shows between them. Quality never falls back on the fly — the phone tier
  is set once, at about a third of the count.
- The beak is pushed a further 30 mm forward, hook and all.

## M200h — six notes from the author, and the dark bead that was the hole (2026-08-26)

Six marks on a screenshot: the eye, the hole in the crown, invisible fluff, too few feathers on
the wing, one stray wing feather, and whiskers that did not glow.

- **The eye sat in a pit — and the pit was arithmetic.** The coat cut a bare disc of radius 0.118
  around the eye, while the bare-skin ring ended at 0.098. Between them lay naked *body*, and the
  body is painted as the dark mass under the plumage (material 0, albedo ×0.30): a flat blue
  patch half a cheek wide. The rule is now the other way round — the ring (0.134) is always wider
  than the cut (0.120), so feathers land *on* its edge.
- **The iris is the eyeball now, and the pupil a dome on top.** Both used to be flat discs floated
  in front of the sphere. The clearance only worked at the rim; in the middle the sphere pushed
  through, so from any angle but dead-on the warm ring was reduced to a crescent and the eye read
  as a black smudge. A dome stays a dome from every side, and it gives the cornea its bulge.
- **The hole in the crown was never geometry — it was colour.** The plug spheres passed
  `bodyColor × 0.30`, and material 0 darkens albedo by another 0.30 in the shader: 0.09, near
  black. The plug *was* the dark spot everyone kept seeing. Colour goes in plain now; the crown
  also gets four overlapping feather rings (17/14/11/8 quills, staggered) plus four caps over the
  pole itself.
- **Fluff is a shape, not a count.** Three tiers of the same oval give armour plating however many
  you lay down. Down is now its own profile — wide at the root, tapering to a hair — its own
  length (a plate's on average, every fourteenth one 1.7×), its own scatter, and its own light in
  the shader: the edge is lit rather than darkened, translucency 0.94, barbs sparse. Fluff reads
  where the silhouette breaks and light passes between the tips. First attempt overdid it and the
  bird came out a thistle: the taper exponent was the culprit, 1.55 gives a spike.
- **The wing: 59 feathers per side → 152.** Six layers instead of five (a row of marginal coverts
  along the leading edge covers everyone else's roots), each narrower, with the step jittered —
  thirty evenly spaced feathers read as a rack of teeth.
- **The stray feather across the breast.** The light piping along the coverts was built "from a
  point on the chest to a point in mid-air", and its length came out of the distance between
  them: on the shoulder that was a single feather a quarter of the bird long, lying across the
  white breast. Piping is piping — short feathers along the flow down the wing's leading edge.
  The amber epaulette moved back onto the shoulder for the same reason: near zero azimuth it
  crawled onto the chest and read as a bib.
- **The whiskers light up.** They were "a near-black thread, warmed at the tip": the warmth was
  lost in the general light and never crossed the bloom threshold (1.55), so the beads glowed and
  the whiskers hung there like wires. The thread is a source now — an even core, a run-up toward
  the tip, a halo along the grazing angle, pulsing at 1.7 Hz in step with the bead.

## M200i — the iris off the photograph, and why sixty was not sixty (2026-08-26)

- **The iris is painted, not modelled.** Third attempt at the eye, and the first that holds from
  every angle: the eyeball is one smooth sphere and everything on it — the round pupil, the
  radial fibres, the magenta band, the dark limbus — is computed in the fragment shader from the
  **local** position (`vL`, before the rig). Geometry could not do this: discs floated over the
  sphere had the sphere push through them in the middle, and fibres would have cost thousands of
  vertices on something the size of a fingernail. A local frame also means the pattern never
  drifts, however the head turns. First take came out a neon marble — a fully lit iris; the
  photograph has a dark plum mass and magenta only in a ring near the rim, so the ramp goes
  deep → mid → band → limbus, and the fibres modulate ±26%.
- **"It jerks unevenly."** It did, and the average frame rate said nothing: 60 fps at the median,
  33.4 ms at the 90th percentile — one frame in ten dropped, a few 50 ms. Profiling by canvas
  size found it fill-bound, not CPU: at 1024×768 the frame was rock solid, at 2419×1520 it was
  not. Three fixes, none of them visible:
  - **Feathers take the shadow with four samples instead of nine** (`SH_FAST` in the feather
    program). Nine PCF taps was the most expensive line in the frame — paid by every pixel of
    every feather, and feathers lie ten deep on a pixel.
  - **Down casts no shadow.** Sixteen thousand instances in the shadow map cost more than
    everything else together, and the plates underneath cast the same shadow anyway. The soft
    shading it used to give between feathers is bought back for free: the root of a down feather
    is darkened to 0.64.
  - **The canvas is capped by area, not by pixel density** (3.15 Mpix desktop, 1.35 mobile).
    Density 1.5 against 2.0 cannot be told apart; dropped frames can.
  - Result at the same window: 90th percentile 33.4 ms → 16.8 ms, dropped frames 10% → 0.9%.

## M200j — the eye stops being a sticker (2026-08-26)

"Ugly around the eye", with the spot circled. Three things were wrong at once, and all three were
the same mistake — solving a plumage problem with a bare patch.

- **The bare ring was a pancake.** 0.134 across is a third of the cheek: a smooth, unshaded blob
  with a hard rim where the feathers stopped. Narrowed to 0.098, and the dark inner ring to 0.068
  so it reads as a liner rather than a puddle.
- **The brow "fold" was a black blade.** It was geometry — a near-black crescent standing 22 mm
  proud of the skin, which from most angles read as a hole in the head above the eye. Deleted;
  the crease is drawn on the skin in the shader now, along with the rows of fine dots real bare
  parrot skin has. Both cost ten lines and no vertices.
- **Plate feathers are gone from the whole ring, and a rosette owns it.** Plates lie *along the
  flow* — backwards — so any plate rooted in front of the eye covers it with its tip: cutting the
  bare zone down to 86 mm simply grew the eye over. A wide cut is what the pancake was. So plates
  are cut out to 150 mm and the ring belongs to a rosette laid on the same (t,a) as the rest of
  the coat — it lands on the surface and takes the common colouring — but pointed **away from the
  eye centre** instead of along the flow. Feathers that radiate cannot cover the eye, and the cut
  edge disappears under their tips. Down keeps a narrow 100 mm cut: it is small and soft.

## M201 — the extras shelf: two birds and the road (2026-08-26)

The bird block on the front page becomes a shelf of three things that live outside the flight,
each with its own preview of the same proportion:

- **Трепло, flat** — the live canvas that was already there, poked with a finger, linking to
  `/parrot.html`. Kept as its own card rather than replaced: the 3D module is a second version,
  not a successor, and both stay.
- **Трепло in the round** — `/treplo3d.html`, preview rendered by `bird/shot.ps1`.
- **В дорогу** — the companion screen, shot off the `docs/mkroad.ps1` stand. It opens inside the
  game (systems → «В ДОРОГУ»), and the card says so rather than pretending to be a launcher.

**`docs/towebp.html` + `docs/towebp.ps1`.** There is no webp encoder on this machine — no
ImageMagick, no cwebp, and the `convert` in PATH is Windows' filesystem converter. Chrome has one:
the page loads a PNG off the stand, draws it into a canvas of the requested size and crop, and
POSTs `canvas.toDataURL("image/webp")` to `/shot` — the same route the front-page frames already
use (`docs/mksiteshots.ps1`). 397 KB PNG → 37 KB webp. Trap on the way: a local `$q` in a script
that also declares a `[double]$Q` parameter is the *same variable* in PowerShell, and the string
assignment fails with a type error that names neither.
### M169 — the graphics campaign of 2026-08-24 (settlement, mine, cantina, ground, giant)

Written after the author called the settlement "пиздец" and asked for every screen to be looked
at again, five passes deep, with self-criticism instead of "this one is already fine".

Closed here: **settlement** rebuilt as a place (`12tb-settle-draw`: terrace, street, a body per
craft, four dwelling plans, villagers with a gait, communal fire, fence, night light pools);
**mine** rock given a mass (`digRockMass`: cloudy tone, world-space jointing, dyke, damp stains,
abandoned collapsed workings roughly one per screen); **cantina** given a host (barkeep with work
that changes on an eight-second cycle, patron poses, bottle silhouettes); **deposits** turned from
interface icons into outcrops with a form per raw material (`drawDeposit` in 21b); **ground
cross-section** broken by faults with lenses inside the strata (18b); **gas giant** shear edges
grown rolls (19a).

Measured after all of it **and after M170**, clean machine, maximized window at ×2: system 58,
belt 60, landing 54, surface 52, dig 60, cave 60, scoop 58 — the same as, or a shade better than,
the pre-campaign baseline (55/60/51/48/60/60/55). Measure like for like: the same window size and
scale, nothing else running. A 1550×900 window instead of maximized reads ten frames lower, and a
run with `--force-device-scale-factor=2` that lands on a 2.5× display reads a third lower — those
are the window, not the code. The "regression" seen
mid-run (system 45, landing 40) was the browser pane running the game in background tabs while
the probe measured: **no other instance of the game may be open during a measurement.** The one
pass worth optimising if surface ever drops below 45 is `drawPlant` (4–13 fps by the deep probe);
bake per-plant sprites and shear them for the wind rather than redrawing paths per frame.

Tooling from this campaign: `docs/shot.ps1` (headless capture of any stand, kills its browser
after), stands rewritten to compare — `mksettle` (three stages plus night plus a ×3.2 close-up),
`mkcant` (all five hall types in one sheet).
- **road companion (M168g, 0.136.1)** — closed by looking at four minutes of real driving: the exhaust
  was a stack of bricks composited to opacity, the trip counter reset every game-minute, and a
  crooked cradle was read as a permanent turn. Measurement rebuilt (auto-zero, gravity frame, yaw
  rate), ribbon is one body per nozzle, footer no longer crossed. See docs/DESIGN-road.md, fifth
  pass. Left open: the hull reads as grey mass at this size — plates all one value, white hairline
  on every edge, and the ТП-68 plate is the brightest thing in the optical centre. Art direction,
  needs the author.


## Checked and did not reproduce — do not "fix" these again

- **«ПРОДОЛЖИТЬ ПОЛЁТ» with no save.** The button is `display:none` in the markup and shown only
  `if(hasSave())`; measured on a cleared browser, it is absent. Restoring also announces itself.
  The tester had a save from their own first fifteen minutes.
- **The instruments vanish in calm flight.** Measured after nine simulated seconds of nothing
  changing: opacity 0.86, fully readable. True before 0.160.0, not since.
- **The world stops living in a background tab.** Crew run off `Date.now()` with a 24-hour cap
  (`CREW_OFFLINE_CAP`). The tab catching up on return is the design working.

## Closed in 0.163.0

The first minute (chips are buttons, a miss does not cancel the autopilot, hit-testing in screen
pixels, the nearest planet in the compass); the empty HQ draws its own empty control room; the
orphaned `#parrotwin`; the receiver docked into the panel header; the mine's doubled hint; the
action button naming hold-actions. See `PATCHNOTES.md` 0.163.0.


# Moved out of PLAN.md on 2026-08-27, evening — closed whole: M218 receivers, M200 the 3D bird
