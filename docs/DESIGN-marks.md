# The landmarks as places to act — design (M627b)

Status: 08.10.2026, design for the build. Author's word (07.10): the landmarks must be
interactive and detailed, the player acts on them and *something happens*, with forks —
«не только там запись какая-то». Bad interactions are to be remade, not kept.

Reads before building: `docs/DESIGN-planet.md` §3–§6 (the style, the kit, the bar),
`docs/DESIGN-planet-engine.md` §2.51–§2.54 (the bodies of M627), `src/21pie-pln-marks.js`,
`src/20a-poi.js` and `src/20b-poi-find.js` (read-only: what the game does today),
`src/21-mode-surface.js` lines 540–560 (the POI branch of the surface, read-only).

## 1. Why

Today a landmark is one tap: `poiInspect` writes a line into the journal, gives one thing
by kind and the stone says «ОСМОТРЕНО» forever. The bodies of M627 stand 12–36 m behind the
walk line and nothing in them answers the man. The twelve are the most expensive things on a
planet and the only ones with a story; they must be **places with a mechanism**: the man
walks between their parts, works them with the verbs he already has, watches them respond,
and chooses — once — what to do with them. What he chose stays on the planet.

## 2. The grammar

1. **Spots at the hand.** Every landmark gets a *hand piece* at the walk line (z 1.5–3 m): a
   console, an altar, a breech, a threshold, a valve. The body stays behind the crest; the
   man touches what stands at the line. Spots are x-offsets from the landmark's centre
   (`dx` m, radius `r` m); the fork is often spatial — walk to this part or to that one.
2. **The man's verbs only.** Tap the action (look, press, call), hold it (work: 2–4 s with a
   bar in the prompt `━━━━╌╌╌╌`; let go and it decays), fly with the jetpack to a high spot
   and press in the air, stand in the dark where the headlamp is on, say a word he knows
   (the settlement's idiom: the known words cycle in the prompt, the action says the shown
   one), walk away. No new interface: the prompt strip, `say`, `tell`, `logAdd`, `sfx`.
3. **The body answers.** Every act is seen in the body: a plate falls, a cab descends, a
   band of light quickens, a dome turns, a barrel lowers, a sphere eats what is thrown.
   The light record, the moving parts and the lamp are driven by the landmark's state.
   Sound with every act (the names the game has: ui, ok, hit, drill, creak, boom, alarm,
   motif, pen, crackle, signoff, shot, jump).
4. **One fork each.** Each landmark holds one exclusive choice: *take* (a sure thing now;
   the landmark goes dark or breaks, visibly, forever) against *wake* (pay or risk; the
   landmark stays lit in your colour and gives a little again each day you come back).
   Three landmarks fork by chance instead (the lift's stall, the gun's shot, the ring's
   limit): the player chooses the risk, the dice choose the end.
5. **Memory.** The state lives in `G.poiSeen[q.seed]` — the object `{k,got,t}` of 20b with
   new fields `st` (state), `way` (the branch taken), `t0` (G.t of the last act), `n`
   (counters), `day` (the last day a daily gift was taken), `dep` (a deposit it made).
   `got` stays a short Russian summary of the state so the old journal line and the old
   «ОСМОТРЕНО» reads keep working. Old saves hold `1` or `{}`: upgrade to `st:0` on first
   touch. The save format does not change (v:4); `asMap` guards arrays from the cloud.
6. **No credits, ever** (rule 1 of 20b). Things, knowledge, direction, light. The first act
   on a landmark still pays the base data `8+⌊d·10⌋` of 20b and rolls `nodeDrop` and
   `rareTake` as today, so nothing the player could earn before is lost.
7. **Risk is the suit and the jet**, never death: `S.suit` goes down (never below 1),
   `S.jet` burns. Danger `sysDanger(G.sx,G.sy)` scales the odds.
8. **Daily gifts** are small and only on the «wake» branch; `celDay()` is the clock. The
   planet is far, the ship is the way there: a 20 % tank or two crates a day is a reason
   to keep a base or a home on that planet, not an income.
9. **The prompt's voice** is the game's: upper case, «ДЕЙСТВИЕ — ВЕРБ · ИМЯ», a second
   line for the state, never a third. The verb before the dash is what the phone's button
   shows (27z parses `ДЕЙСТВИЕ — X`), so the verb must be short and first.

## 3. The engine

- **`src/21pif-pln-marks-act.js`** (new; byte order after `21pie`, before `21pj`): the
  table `PLN_ACT.kinds[kind]`, the state machine, the spots, the prompt, the hold bar, the
  rewards, the daily gifts, the hooks. Switch `PLN_ACT.on` (default true, lives under
  `PLN_MARK.on`).
- **`src/21pie-pln-marks.js`**: the hand pieces and the moving parts per kind; the light,
  the lamp and the parts read the state (`plnMarkState(q)` from 21pif) each frame. The
  instance set grows from 3 records to as many as the kind needs (body, light, parts…).
  The battery is rebuilt as a gun (§4.12). Keep the file under 40 KB: if it grows past,
  the bodies move to `21pied-pln-marks-bodies.js` and 21pie keeps the frame.
- **`src/21pz-pln-frame.js`**: the lift's ride (the camera follows the cab, §4.3) and the
  gun's flash (a key flash like the lightning of M626). **`src/21ph*`**: the man is not
  drawn while `S.ride` is set.
- **Hooks, no edits to read-only files.** The surface's POI branch (21-mode-surface
  545–552) keeps running: it calls `poiNear`, `poiMemo`, sets `G.prompt` and calls
  `poiInspect` on the first tap while no memo exists. 21pif takes over by (a) writing the
  memo `{…,st:0}` the moment a landmark is near, so the old inspect never fires, and (b)
  rewriting `G.prompt` from the engine frame (`plnMarksFrame`, which runs in `drawSurface`
  before `hud()` reads the prompt — verify in `28-loop.js` lines 386–554 and in the test
  motor at 710: update, draw, hud). The action key is read from `keys.act` with the
  module's own edge and hold timer. If the order ever puts `hud()` before the draw, the
  tick moves into a wrapper of `poiMemo` (called by the surface each frame while near) —
  say so in the doc if that is the case.
- **Reach.** A spot is «at hand» when `|S.x/PLN_M − (it.x + dx)| < r` and the man is on
  the ground, not walking fast (`walkAmp < .25`), or — for an air spot — in the air with
  `S.y` above the spot's height. `plnAtThing` already returns 1 near a landmark; the near
  lens glides in as it does for things.
- **The frame.** `plnMarksFrame` (21pie) calls `plnActFrame(it,S,p,nk,t)` for each visible
  landmark; 21pif returns the prompt (or null) and the body's drive: `{light:k, lamp:{…},
  parts:{id:{x,y,z,yaw,hk}}}`. One landmark owns the prompt per frame: the nearest with a
  spot at hand.
- **Tests** `tests/91qa-marks-act.js` (Node tier, the idiom of `tests/91q-planet.js`): the
  state machines of the twelve by driving `plnActDo(q,spotId,ctx)` with a fake context:
  exclusivity (after *take* the *wake* spot is gone and the reverse), no credits anywhere,
  the daily gift once a day, the save shape after each state, old saves upgraded, the
  memo's `got` is a string, the risk rolls deterministic by `(seed, n)`. The build and
  `test.ps1 -NoBuild` must stay ВСЁ ЗЕЛЁНОЕ.
- **The stand.** `mark.py` gets `st=<n>` and `way=<id>` (the memo is written before the
  landing) and `act=<spotId>[,<spotId>…]` (the acts are run after the landing so the body
  is caught in its reaction, `t=<s>` seconds after the last act); `eval-marks.js` adds
  `act:{prompt,spot,st,way,n,parts}` and the memo. Frames: every kind in its three states
  (untouched, woken, taken/broken), day and night, plus the moments (the cab descending,
  the barrel lowered, the sphere eating, the top falling).

## 4. The twelve

Notation: **spot** `id · dx · r · verb` (dx in metres from the landmark's centre along x,
positive to the right; r the reach); **st** states; **got** the memo line. Rewards use
the helpers of the game: `addRes`, `addPart(genPart(…))`, `G.fuel`, `G.data`, `loreTake`,
`relicRoll/relicFind`, `rareTake`, `G.market`, `G.relicHint`, `repAdd`, `settleHere`.
`d` is the danger, `r()` the seeded rng of `(seed, salt, n)`.

### 4.1 Остов корабля — wreck (people)

Hand pieces: the hull's near flank reaches z≈3 with a **fallen door plate** on the ground
(dx −2) and the open hatch above it; the **cockpit** is at the nose end (dx +L·.42) with
a cracked canopy; the **beacon** blinks at the tail (dx −L·.4).
- **люк · −2 · 3 · ВСКРЫТЬ ЛЮК** (hold 3 s, the cutter: sparks of the drill at the seam,
  `sfx drill`): the plate swings in (part `hatch`: yaw 0→1.4 over 1 s), warm dim light
  inside (light record k .5). st 0→1.
- **отсеки** — the fork, by standing: after the hatch, two spots inside the same hull:
  **двигательный · +L·.15 · 3 · РЕЗАТЬ ДВИГАТЕЛЬНЫЙ ОТСЕК** (hold 4 s) → a ship part
  (`addPart(genPart(hashi(seed,7,0x1E),tierFromDanger(d,r)))`, as 20b) and the cut floods
  the hold with vapour: the cargo bay burns out (a vapour flare of 2 s — cards or a GLOW
  blob fading; the cargo spot is gone); **грузовой · −L·.15 · 3 · ВСКРЫТЬ ГРУЗОВОЙ ОТСЕК**
  (hold 4 s) → crates slide out onto the ground (parts `crate1..3` move 2 m toward the
  line): two resources of the world's trade keys ×(3+⌊r()·5+d·4⌋) each and techcomp ×2;
  the engine bay drops into the ribbon (part `bay` falls 2 m, tilts; the engine spot is
  gone). Either sets st 2, `way` «part» | «cargo».
- **рубка · +L·.42 · 3 · СНЯТЬ ЗАПИСЬ** (tap, any time): the black box: three lines by
  `say`, seeded from eight endings written in 21pif (the crew's last words, 60–90
  characters each, no names), the last line either an address (`loreAddr`-style, pushed
  to `loreMarks` with id `wreck:<seed>`, «куда они шли: сектор X:Y») or a price lead
  (`G.market[s.key]` of a neighbour station as the observatory does). Once (`n.log=1`),
  then «ЗАПИСЬ СНЯТА».
- **маяк · −L·.4 · 3 · ВЫКЛЮЧИТЬ МАЯК / ВКЛЮЧИТЬ МАЯК** (tap): toggles the red blink
  (`n.beacon`). Off: the wreck is dark at night for ever; on: it blinks. Nothing else —
  it is the light you leave.
- got: «не вскрыт» → «люк вскрыт» → «снята часть, груз сгорел» | «взят груз, отсек ушёл».
- Daily: none. Weak spot to name: the hull halves still read as loaves.

### 4.2 Храм — temple (ancients)

Hand piece: the **altar** at the foot of the stair (dx 0, a stone table 0.9 m with the
carved plates on top, their grooves lit by the slab's accent at night).
- **плиты · 0 · 3 · ЧИТАТЬ ПЛИТЫ** (hold 2 s): the coordinates (`G.relicHint`) as 20b;
  if known already, the plates give their xeno ×n as 20b. Once. st 0→1.
- **The fork at the same altar**, by what the man holds up: the prompt cycles the cargo's
  kinds (4 s each, the settlement's idiom) — **дар · 0 · 3 · ПОЛОЖИТЬ НА АЛТАРЬ: <RES> ×3**
  (tap): takes 3 units; the octahedron descends to the slab over 4 s (part `octa` y),
  opens (part `octa` hk 1→.3 and the inner glow k 3), the slab's light turns to the
  world's accent at full: the gift answers with `relicRoll(hashi(seed,0x7E,1),.4)` →
  `relicFind(id,"дар храму")`, else `rareTake("temple",seed,"здесь: храм")` and xeno ×4.
  The temple is **woken** (st 2, way «gift»): its lamp is always on; **every later visit the
  suit fills to `suitMax()` while the man stands at the altar** (a refuge at night).
  **образец · −4 · 3 · ВЗЯТЬ ОБРАЗЕЦ** (hold 3 s, the drill on the plates): xeno
  ×(4+⌊r()·4+d·4⌋); the plates crack (blot), the slab's light dies, the octahedron falls to
  the slab and stays dark (st 3, way «take»); if the plates were not read, the
  coordinates are lost («надписи стёрты»).
- got: «плиты не читаны» → «координаты прочитаны» → «храм принял дар · убежище» |
  «плиты разбиты».

### 4.3 Космический лифт — elevator (people)

Hand pieces: the **station** at the line (dx +4: a box 2.5 m with a lit door and a
console), a **rail** from the station to the tower's drum (a low track along z), the
**cab** (part `cab`) that rides the rail to the drum and the cable up.
- **пульт · +4 · 3 · ВЫЗВАТЬ КЛЕТЬ** (tap): the cab comes down the cable (12 s) and along
  the rail to the station (4 s), door light on; `sfx creak` twice. st 0→1 («клеть
  внизу»).
- **клеть · +4 · 3 · ПОДНЯТЬСЯ** (tap, cab down): the ride. `S.ride={t0,dur:28,…}`: the man
  is not drawn, the cab shows a lit window, the cab goes along the rail then up the
  cable to the first collar (H·.9); the camera follows the cab's y (`plnLens` target y in
  21pz; the man's x held at the station; walk keys ignored), the land falls away, the sky
  grows. At the top the cab stops 6 s: **the survey** — `tell("tech","Подъёмник: осмотр с
  высоты · +24 данных", …)`: G.data +24 and a line naming what the terrain holds and where
  (the cave, the mine spot, the deposits' resources, the other landmarks: «пещера 1.2 км
  к западу · иридий 300 м к востоку · храм 2 км к востоку»), once (`n.survey`). Then down
  (16 s). st 2, way «ride».
- **The dice: the stall.** On the way up, with chance `.25+.5·d`, the cab stops at a third
  of the height, its light dies, `sfx alarm`. Two spots in the stalled cab (the prompt
  offers both lines): **РУЧНОЙ СПУСК** (hold 4 s): the cab creeps down 20 s, suit −10;
  **ПРЫГНУТЬ** (tap; needs `S.jet ≥ .6`): the man drops out — `S.ride` ends, the man is at
  the cab's x with `S.y` at the cab's height and `S.vy` 0, `S.jetOn` true, the game's
  jetpack physics brings him down; if the jet runs dry before the ground the game's own
  fall applies (suit by the game's rule). Either way the survey was not reached: half the
  data (+12), the cab stays stalled a day (`n.stall=day`); the next day it is down again.
- **пусто · +4 · 3 · ОТПРАВИТЬ ПУСТОЙ** (tap, after a ride or a stall): the cab goes up
  alone to the top and **the collars' beacons turn steady** (the light record k 1.4,
  always): the tower is a lighthouse at night from then on. `n.lit=1`. got adds «маяки
  горят».
- Daily: the ride can be taken any day (the view), the survey pays once.
- If the camera cannot follow the cab cleanly, fall back: the cab goes up alone and brings
  the survey back («клеть вернулась с записью»); say so in the doc.

### 4.4 Друза — crystals (the world's own)

Hand piece: the small prisms come to the line (z 2–4) as a **foot** of the druse; three
of them are the **keys** (dx −3, 0, +3), each with its own pitch (`sfx pen` with `seed`
→ three notes of one seeded scale; check 09-audio for pitch options, else three sounds).
- **ключи · −3/0/+3 · 1.5 · УДАРИТЬ** (tap): the note, the prism flashes (its own light
  record, k 2 for .6 s). The druse has a seeded **order** of the three; at night the
  headlamp on the foot makes the keys flash in that order once every 12 s (the lamp
  reveals). Hitting the three in order → **resonance**: all prisms glow for 6 s, a chord
  (`sfx motif`), the big prism splits (part `top` opens as two halves): crystal
  ×(8+⌊r()·8+d·6⌋) and `rareTake("poi",seed,"здесь: друза")`; the druse rings on at
  night (light k .8, its lamp always). st 2, way «ring». Daily: crystal ×2 grows back on
  the foot («ДЕЙСТВИЕ — СНЯТЬ КРИСТАЛЛ»).
- **добыча · 0 · 3 · УДЕРЖИВАЙТЕ ДЕЙСТВИЕ — ДОБЫВАТЬ** (hold, the drill as at a deposit):
  the prisms shatter one by one (parts `p1..p5` hk→0 with a crackle), crystal
  ×(4+⌊r()·7+d·5⌋) as 20b, the scale is broken after the first prism (the keys are
  silent). st 3, way «mine». A rung druse cannot be drilled («кристалл звенит и не
  колется»).
- Wrong order: the prism dulls .5 s, a low `sfx hit`, nothing lost.
- got: «звенит, если тронуть» → «друза поёт · растёт» | «друза разбита».

### 4.5 Кольцо ускорителя — ring (ancients)

Hand piece: the **valve post** at the line (dx −6, the feed pipe comes to it; a wheel).
- **вентиль · −6 · 3 · ЗАПУСТИТЬ КОЛЬЦО** (hold 3 s): the band's pulse quickens from .6 Hz
  to 3 Hz over 6 s, the eight nodes light in sequence (the nodes in three light records,
  a chase), a rising hum (`sfx alarm` low, then `motif`). st 0→1 («кольцо на ходу»).
- **The fork at the post, spinning:** **ОСТАНОВИТЬ** (tap): the ring winds down, the warm
  node gives iridium ×(2+⌊r()·4⌋) as 20b; st 2, way «stop»; daily: a spin and iridium ×2.
  **РАЗОГНАТЬ ДО ПРЕДЕЛА** (hold 4 s, the hum climbs, the lamp brightens): the dice with
  chance `.65−.3·d` **the throw**: a slug leaves the ring on the tangent toward the line,
  lands 12 m to the right (part `slug` flies 1.2 s, a blot), and becomes a **deposit**
  `{x, res:"iridium", left:12+⌊r()·8⌋, prog:0}` pushed to `S.deposits` (the drill takes it
  as any deposit); the memo keeps `dep:{x,left}` and 21pif re-adds it on each landing with
  the left count read back from the deposit while the man is on the planet; st 2, way
  «throw». Else **the ring shakes apart**: the band dies, three nodes fall (parts), `sfx
  boom`, suit −15, `nodeDrop("в аномалии",…)`; st 3, way «broke».
- got: «кольцо стоит» → «кольцо на ходу» → «кольцо кормит · иридий» | «кольцо выбросило
  слиток» | «кольцо разорвано».

### 4.6 Аномалия — anomaly (ancients)

Hand piece: a **surveyor's stake** at the line (dx 0, 1.5 m, a tilted post with a tag).
The sphere reacts before any act: the shards orbit faster as the man nears (speed
×(1+2·(1−dist/30))), the halo brightens, the man's headlamp flickers within 10 m (the
lamp's k × (.7+.3·noise)), the prompt's second line is garbled glyphs while near
(«ПРИБОРЫ: ▓▒░▒ М»).
- **замер · 0 · 3 · ЗАМЕРИТЬ** (tap): +14 data as 20b, once; st 0→1.
- **корм · 0 · 3 · БРОСИТЬ: <RES>** (tap; the cargo's kinds cycle): one unit flies into
  the sphere (part `bit`, 1 s arc), the sphere flashes and eats it (`sfx crackle`), the
  shards reorder, and **one unit of another kind falls out** onto the ground before the
  stake: the anomaly's seeded table maps three input kinds to three outputs (from the
  trade keys; a kind not in the table is eaten and returns nothing — «аномалия
  проглотила»); the player learns the table by trying. Budget 12 returns per anomaly
  (`n.fed`); at 12 the anomaly is **sated**: the shards slow, the halo dims, it spits a
  node (`nodeDrop`) and sleeps (st 2, way «fed»). Trading is the wake branch — no daily
  gift, the budget is the gift.
- **осколок · 0 · 5 · ВЗЯТЬ ОСКОЛОК** (tap in the air: `S.y` above 3 m within 5 m of the
  sphere's x — the jetpack): a shard is caught: xeno ×4, +20 data; the anomaly
  **collapses**: the shards fall as rubble (parts drop), the sphere shrinks to nothing in
  3 s, a low `boom`; st 3, way «drain». Exclusive with feeding from then on.
- got: «приборы врут» → «меняет одно на другое» → «насытилась» | «схлопнулась».

### 4.7 Монолит — monolith (ancients)

The slab moves to z 8 (it is thin); its −z face is at the man's reach when he stands
before it (dx 0). The seam of light is on the face.
- **касание · 0 · 2.5 · КОСНУТЬСЯ** (tap): a ripple runs out from the seam (the light
  record's pulse spikes, the lamp k ×2 for 1 s), a tone (`sfx motif`), +18 data as 20b,
  once; st 0→1. From now the face shows **a line of two glyphs** (two panes in a row,
  accent light): the monolith's **words**, seeded from the words of the report pieces
  (`LORE` entries with `.word`; pick two by `hashi(seed,0x1F,…)`). A word the player
  already knows (`loreVocab()`) is written in the prompt as the word, the other as glyphs
  — the idiom of `settleLine`.
- **слово · 0 · 2.5 · СКАЗАТЬ: <WORD>** (tap; the player's known words cycle in the
  prompt every 4 s; shown only when he knows at least one): if the word is one of the
  two, that glyph lights steady and +10 data; else the seam dims .5 s and a low tone.
  Both lit → the monolith **opens**: the slab splits (parts `l`,`r` slide ±.6 m over 3 s),
  the inside is light, and it gives `relicRoll(hashi(seed,0x7E,2),.6)` →
  `relicFind(id,"монолит открылся")`, else `G.relicHint` by the temple's law and xeno
  ×3. st 2, way «word»: the seam stays lit as your light. With no words the man is told
  «монолит ждёт слова» in the second line — the reason to find the pieces.
- **образец · +3 · 2.5 · ВЗЯТЬ ОБРАЗЕЦ** (hold 4 s, the drill at the edge): xeno ×(5+⌊r()·
  4+d·4⌋); the seam dies, the face goes blank (st 3, way «take»): no words ever.
- got: «отвечает на касание» → «ждёт слова: ▯▯ / слово ▯» → «монолит открыт» |
  «монолит молчит».

### 4.8 Завод — factory (people)

Hand pieces: the **switchboard** at the line (dx −W·.3, a cabinet 1.8 m with a lever and
a dead lamp) and the **ramp** from the gate to the line where crates roll to (dx +W·.1).
- **щит · −W·.3 · 3 · ЗАПИТАТЬ ОТ СКАФАНДРА** (hold 3 s; needs `S.suit ≥ 40`): suit −30;
  the windows light in two waves (the light record k 0→1.6 over 4 s, bottom row first),
  the chimney's belt glows, a plume of dust cards rises from the chimney (the weather's
  card kind «dust» spawned at the stack for 20 s), the gate opens (part `gate` y up over
  2 s), the line's rumble (`sfx drill` low, looped by repeats). st 0→1 («линия на
  ходу»): the factory's own reactor is primed and keeps running.
- **ящик · +W·.1 · 3 · ЗАБРАТЬ** (tap, line running): a crate rolls out of the gate down
  the ramp (part `crate`, 3 s) → techcomp ×(3+⌊r()·6+d·4⌋) as 20b, once per priming;
  daily: a crate of techcomp ×2 («ящик дня»).
- **The fork at the switchboard, line running:** **ПЕРЕНАЛАДИТЬ: ЧАСТЬ** (hold 4 s;
  takes techcomp ×8 from the cargo): the hall's lights go red for the retool (light
  record colour via a second light record), the sound climbs, and a **ship part** rolls
  out on the ramp in a crate (`addPart(genPart(hashi(seed,9,0x1E),tierFromDanger(d,r)))`):
  the line is **worn out** by it: lights die, the gate stays open, dark (st 3, way «part»)
  — no more crates, ever. **Leave it running** (st 2, way «run», set when the first crate
  is taken and the man leaves the planet): the daily crate.
- got: «обесточен» → «линия на ходу» → «работает · ящик в день» | «выработан на часть».

### 4.9 Врата — portal (ancients)

Hand piece: the **threshold** — the floor slab extends from the pylons to the line as a
causeway (z 28→2), with the U seam's foot at the line (dx 0).
- **порог · 0 · 3 · ПРОБУДИТЬ ВРАТА** (hold 3 s): the seam lights from the foot up the
  pylons over 4 s, the keys glow, a deep tone (`motif` low), and the gate fills with a
  **dark mirror** (a GLOW card between the pylons: the world's accent at .25, a slow
  shimmer) for 40 s, then fades. st 0→1 («врата отзываются»).
- **The fork at the threshold while open:** **СЛИТЬ ЗАРЯД В БАКИ** (hold 3 s): G.fuel +
  min(.4·fuelMax, room) as 20b; the seam dies from the top down, the mirror closes, the
  gate is dark for ever (st 3, way «drain»). **ОСТАВИТЬ ОТКРЫТЫМИ** (tap): the gate keeps
  a steady low seam and its lamp always (your light); G.fuel + .2·fuelMax now, and **each
  day you return: +.2·fuelMax** at the threshold («ДЕЙСТВИЕ — ЗАРЯД ДНЯ») — a fuel
  station on this planet for good (st 2, way «keep»). The open gate also tells one
  **address** once: a twin gate (`loreAddr`-style, a system with a planet of a type that
  bears portals, pushed to `loreMarks` as `portal:<seed>`, «врата отзываются из сектора
  X:Y»). Stepping through is not built (named in §6).
- got: «кольцо держит заряд» → «врата открыты · 20 % в день» | «заряд слит».

### 4.10 Обсерватория — observ (people)

Hand pieces: the drum's **door** with a console at the line (dx −R·1.2) and the **mast's
base** with a crank (dx +R·1.8).
- **The fork is the one battery:** the observatory has one charge; the door's console
  drives the **dome**, the mast's crank drives the **dish** — the first used takes the
  charge; the other says «батарея пуста · зарядится за день» and is possible a day later.
- **купол · −R·1.2 · 3 · ОТКРЫТЬ КУПОЛ** (hold 3 s): the shutter slides (part `shutter`
  yaw), the dome turns to the sun by day or to the giant/the bright moon by night (part
  `dome` yaw over 6 s, `sfx creak`), the slit pane lights. By day: the archive — a
  neighbour station's prices (`G.market[s.key]`) as 20b, once per neighbour (the next
  day another, if any; else «ничего нового»). By night: **the sky**: what hangs in the
  void of this system — the finds of `findsIn(G.sys)` named by kind and bearing («в
  пустоте: сигнал бедствия на 2 часа, 1800 от звезды · контейнер на 7 часов»), so the
  player can fly to them on leaving (17b takes them as always), and the next eclipse of
  this planet (`celEclipse(p,t)` scanned ahead: «затмение через N мин» or «затмений не
  будет сегодня»); +12 data. An empty void says so («в пустоте тихо»). st 1, `n.dome=day`.
- **антенна · +R·1.8 · 3 · НАСТРОИТЬ АНТЕННУ** (hold 3 s): the dish turns (part `dish` yaw
  and pitch over 5 s), a crackle, then `signoff`: a report piece `loreTake(seed^0x5A7)`
  («кусок отчёта · глава»), once; after that +10 data per day. st 1, `n.dish=day`.
- Both used at least once → st 2, way «both». Nothing breaks here; the fork is time.
- got: «батарея заряжена» → «купол открыт · антенна ждёт» | «антенна настроена · купол
  ждёт» → «работает · день — купол, день — антенна».

### 4.11 Зарубка — obelisk (people, the Long March)

The obelisk moves to z 5 (it is a blade). Hand: the **notch** on the blade at the man's
height (dx 0, lines carved by a hand) and the **wedge** at the top (9 m up — the jet).
- **засечка · 0 · 2.5 · ПРОЧЕСТЬ** (tap; at night only with the headlamp on the blade,
  i.e. within 4 m): the lines come as glyphs and known words (`settleLine` idiom), the
  piece `loreTake(seed)` as 20b; once, then +16 data as 20b; st 0→1.
- **своя · +1.5 · 2.5 · ОСТАВИТЬ ЗАСЕЧКУ** (hold 3 s, the drill as a chisel, sparks, `sfx
  pen`): a bright scratch appears on the blade (a small GLOW card), `G.notches` +1,
  `repAdd(1)` in this system («люди видят, кто здесь был»); the memo shows «ваша
  засечка»; the belt stays whole (st 2, way «carve»). Each obelisk takes one of yours.
- **клин · 0 · 4 · СНЯТЬ КЛИН** (tap in the air at the wedge's height ±2 m — the jet): the
  rust wedge comes free (part `wedge` falls), the leaning top slides off and crashes at
  the line (part `top` falls 9 m in 1.2 s, lands tilted, a blot, `sfx boom`), suit −5 if
  the man stands under it (|dx|<2 on the ground within .5 s): `relicRoll(hashi(seed,
  0x7E,3),.35)` → `relicFind(id,"клин зарубки")`, else alloy ×6; the belt is dark, the
  notch unreadable from now (if unread: lost); the settlement of this planet, if any, loses
  10 mood («они видели»). st 3, way «wedge».
- got: «засечка резана рукой» → «прочитана» → «ваша засечка рядом» | «верх обрушен».

### 4.12 Батарея — battery (people, the Long March) — **rebuilt**

20b says the truth: «ствол задран в небо и разорван у среза» — it is a **gun** of the
Long March, the same the player builds in the base's cross-section (`battery` cell, the
guard's job), not an electric battery. The M627 body (cells, busbars, insulators) is
wrong and is replaced: a **turret ring** on a slab at z 8, a **long barrel** raised 60°
toward +z, its muzzle **split in petals**, a breech block at the rear reaching the line,
two **ammo racks** (one empty), a shield plate, sandbag plates, a scorched blot. Mid steel
with rust, the orange belt on the shield, a dead white marker on the muzzle.
- **затвор · −2 · 3 · ОТКРЫТЬ ЗАТВОР** (hold 2 s, `creak`): the breech opens (part
  `breech` slides); inside, the last casing with scratched lines: the piece
  `loreTake(seed^0xBA77)` as 20b, once, then alloy ×n as 20b. st 0→1.
- **наводка · +3 · 3 · ПРОВЕРНУТЬ БАШНЮ** (hold 3 s, a slow `creak` ×3): the turret turns
  toward the line's far end and the barrel lowers from 60° to 20° (parts `turret` yaw,
  `barrel` pitch over 6 s) — the gun now points along the ribbon. st 2 («наведена»).
- **выстрел · +3 · 3 · ВЫСТРЕЛИТЬ** (hold 4 s, the man braces; only when laid): one round
  is left. The dice with chance `.6−.3·d` **the shot**: a flash (the key flash of 21pz as
  the lightning's, white, 2 frames), `sfx boom`, the barrel recoils (part `barrel` z −1.5
  and back), a shell (part `shell`) flies along the ribbon and bursts high over the far
  lane 2 s later: a **flare** hangs 25 s (an F.lamp high and white, falling slowly, k 4),
  the night lit over 200 m; every beast within 120 m turns and flees (the beast record of
  `specimenBeast` has `vx` and `shy`; the surface raises `shy` when the man is loud and it
  decays by .01·dt — set `shy` to its ceiling and `vx` away from the gun; read lines
  310–318 of 21-mode-surface first); +20 data «запись отдачи»; `holdDeed(G.sx,G.sy,
  "shot")` (12ad accepts any kind). st 3, way «shot». Else **the burst**: the
  split muzzle lets go: `boom`, the barrel tears off and falls (part), suit −20, the
  turret smokes 20 s (dust cards), `nodeDrop("в аномалии",…)`; st 3, way «burst». One
  shot ever; afterwards «СТВОЛ ПУСТ».
- got: «ствол разорван у среза» → «затвор открыт» → «наведена» → «выстрел был · ракета
  над равниной» | «ствол разорвало».

## 5. Order of the build

1. The engine: 21pif (table, states, spots, prompt, hold bar, memo, daily, hooks, tests),
   the hand-piece/part machinery in 21pie, the stand's `st=/act=`. Shoot one kind end to
   end (the wreck) in its states, day and night.
2. The quiet five: temple, monolith, obelisk, portal, observatory.
3. The moving five: crystals, ring, anomaly, factory, the gun (rebuilt body).
4. The lift's ride (camera, cab, stall, jump) last — it touches 21pz and 21ph.
5. Cost on the PC (`cost.py` with a landmark in view, the moving states), the frames of
   every kind in its states, the docs: `docs/DESIGN-planet-engine.md` §2.55+ (the grammar,
   the hooks, the memory), §3 row, §4 «M627b», §6 state and weak spots;
   `docs/look/game/README.md`; `docs/DESIGN-planet.md` M627 line.
   One local commit per pass, English messages, no push.

## 6. Not built, named

Stepping through the gate to its twin (a system change in the surface mode); the
scavengers that come to a wreck whose beacon is left on; the settlement reacting to the
gun's flare; the survey as HUD markers (text now); the lift's cab seen from inside; an
online count of notches (the postcard rule: no names, no free text — a count would be
allowed, the server is not touched here).
