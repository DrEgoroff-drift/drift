# The world galaxy — design (M447–M451)

The author, 11.09.2026, over two screenshots of the map: «когда карту двигаешь полоса то двигается
вместе и слой наверху над планетами, звёзды тоже двигаются с экраном… че у меня к экрану они
приклеены», then, choosing between four options: «мировая галактика, у нас в игре должно быть
всё круто». This file is the design; `PLAN.md` carries the queue one line per milestone.

## 1. Diagnosis

The map draws five kinds of layer and they obey three different laws:

| layer | computed in | moves (0.425.0) |
|---|---|---|
| Galaxy band `mapBandPaint` | a screen-sized layer, baked once | 0.05 of the sheet |
| nebula `mapNebula` | a 160 px tile stretched over the screen, repeating | 0.14 |
| star grit `drawStars` (`16-flight`) | 340 points modulo a 1600×1200 *screen* | 0.4 |
| rhumbs, grid, addresses, holdings, marks | world coordinates | 1.0 |

None of the first three knows world coordinates at all. M438 gave them a fraction of the sheet's
travel, but a fraction of the screen is still the screen, only slower — and the author read it
exactly so.

**Parallax cannot work on a map.** Parallax lives where the camera is inside the world and there
is depth along the line of sight — the flight view. The map is a look down onto a sheet; there is
no depth along the line of sight. Any layer that moves out of step with the addresses reads not as
"further away" but as "came unstuck". M438 put every backdrop layer in exactly that middle.

**And the band is the wrong object.** The world has a centre: the rose on the map points «К
ЯДРУ» at 0:0 (`18a-map-addr`), the settled circle is `CHRON_R`=10 around it (`12am-chron`), and
`sysDanger` rises to its ceiling at r=40 (`01-core`). The map is therefore a view from ABOVE onto a
galaxy with its core at zero. A Milky Way band is the view from INSIDE the disk; seen from above
it does not exist. The right structure is a barred spiral around 0:0.

## 2. The rule (goes into PLAN's cross-cutting rules)

**On the map, a layer has exactly two legal states: it is in the world — moves 1:1 with the sheet
and scales with the zoom — or it is paper — does not move at all and carries no recognisable
object (flat ground, vignette, grain).** No parallax, no fractions. Map stars do not twinkle:
they are fixed objects in the world (the twinkle law of `16-flight` belongs to the flight view).

## 3. The model — `galaxyAt(x,y)` in sector units

A pure function of world coordinates and fixed salts: no `G`, no save, the same galaxy for every
player (the world is shared — postcards, the war page). Nothing is persisted; `starAt`,
`getSystem`, `sysDanger` and every `"sx,sy"`-keyed object stay untouched. The galaxy is picture
and names; it does not move a single system.

Returns `{glow, dust, knot, col}` (0..1 values, colour mix). Built from:

- **Disk** — `exp(-r/Rd)`, `Rd`≈22: the rim past r≈45 is genuinely dark, the frontier reads as
  the edge of the lit world (matches `sysDanger`).
- **Bulge and bar** — a warm elliptical glow, `Rb`≈4, a short bar (~7 sectors, axis ratio .55)
  at a fixed angle. The home station sits in it: the bulge amplitude is CAPPED so the busiest
  screen of the game (home, zoom 1) stays readable — see §6.
- **Arms** — two logarithmic spiral arms from the bar ends, pitch ≈14°, width `2.2+.06r`
  sectors, plus two weaker spurs (a second harmonic at ~30% amplitude) so it does not look like a
  textbook diagram. Arm density broken by domain-warped fbm into clumps.
- **Dust lanes** — dark, on the inner (trailing) edge of each arm at ~-.35 width, fbm-broken;
  multiplicative. Two value steps per arm (lit ridge, dark lane) — the M308 lesson that one smooth
  value reads as a highlight, not a body.
- **Knots** — sparse pink HII regions where arm density is high and a hash passes; the second
  temperature of the sheet next to the warm bulge (rich-palette rule: tone mixed round the wheel —
  amber bulge, blue-white arms, pink knots, violet-grey interarm, brown dust).
- **Rotation sense and orientation** fixed constants, shared by every view (§7, M451).

Scale check against the screen: zoom 1 shows ~16×9 sectors (the bulge fills the middle of the
home screen as a haze), zoom 5 ~80×46 (both arms and a gap between them are visible from the
settled circle), the overview of M450 the whole disk.

## 4. Layers after the change

| # | layer | law | how drawn |
|---|---|---|---|
| L0 | ground `#03040a`, optional vignette | paper | flat, as now |
| L1 | galaxy glow + lanes + knots + named nebulae | world | world tiles, drawImage scaled by `cell/P` |
| L2 | resolved faint stars | world | per frame, points, LOD by `cell` |
| L3 | the sheet: grid, rulers, rhumbs, rings, addresses, holdings, marks | world | unchanged |

**L1 — world tiles.** Two pyramid levels: near `P`=8 px/sector, 32 sectors per 256 px tile; far
`P`=2 for zoom beyond ~2.5 and for the overview. Baked with `ImageData` straight from
`galaxyAt`, keyed `"level:tx,ty"`, LRU ≤32 tiles (256²×4 B = 256 KB each, ≤8 MB — the memory net
of M332 must see it). Baking is capped by work AND time (the harness has no clock): ≤4 ms per
frame, nearest tiles first; the tiles under the jump circle bake synchronously on the first map
frame. A tile not yet baked is covered by the far level, and the near one fades in over it — never
a hole, never a pop. Reuse the `tileStore`/`tileAt` machinery of `18c-chunks` if its key and
eviction fit; its `TILE`=512 is for the side-scrolling modes, the galaxy wants its own size.

**L2 — resolved stars.** Per visible sector, candidates from `h01(sx,sy,salt+i)`: position inside
the sector, magnitude, colour (warmer in the bulge, bluer in the arms). The number drawn is
`K · density(x,y) · lod(cell)`, where `lod` keeps the SCREEN density constant across the zoom
range (~1500 points on a 1600×900 frame, whatever the zoom); a star crossing the threshold fades
in by magnitude, it does not pop. Grouped by colour like `drawStars` (six fills, not one CSS
string per point). These are not systems: smaller than the smallest address glyph, no cross, no
halo, so they cannot be mistaken for a place you can fly to — the confusion that made the grit
«слой наверху над планетами».

## 5. What is retired

- On the game map: `mapBandPaint`, `mapNebula`, the `drawStars` call, `mapSkyShift` and M438's
  sky block with its suite «карта: небо отстаёт от листа» (the rhumb half of M438 stays — the knot
  on your system, 1:1, is already this rule).
- `site/war-map.js` moves to the world galaxy in M449 (it is centred on 0:0 with `CHRON_R`=10 —
  the bulge and the roots of both arms), then `mapBandPaint`/`mapNebula` are deleted from
  `17z-map-backdrop` altogether. `17z` becomes the galaxy's painter module for both pages, as it
  already is the shared paper.

## 6. Readability — the galaxy is behind the addresses, and it is measured

- Measured on the map scene before/after with `lookFrame()`: address stars must not lose local
  contrast against the background they sit on, inside the jump circle especially; the home screen
  (0:0, zoom 1, inside the bulge) is the worst case and is the acceptance frame.
- L1 luminance is capped (a ceiling on the glow's contribution, tuned on the home frame); the
  law of darkness (sectors dim with distance from the player) stays on the sheet, not the sky.
- Golden frames of the map change by design: `test.ps1 -Accept` (and `-Mobile`,
  `-Size 1440,1440`) re-shoots them once, in the milestone that changes the picture.
- Performance verdict by `docs/g11.ps1` on the map scene, zoom 1 and zoom 5, never by `prof()`.

## 7. The queue

- **M447 the galaxy model and the glow in the world.** `galaxyAt` + L1 tiles (both levels, the
  bake budget, the fallback fade), replaces band and nebula on the game map; retires the M438 sky
  block and its suite; adds the §2 rule to PLAN. Tests by the rule of place (`docs/DESIGN-tests.md`
  §3): the model is a formula → a Node suite (deterministic, no NaN over ±200, the bulge brightest
  at 0:0, on-arm > interarm at the same r, the disk dark past r=50 on average); "layers move with
  the sheet" is a law → a detector on the map scene after a pan and a pinch (the galaxy tile's
  corner lands exactly on `mapCellXY` of its world corner, at any zoom). Golden frames accepted.
- **M448 the resolved stars.** L2 with the LOD; removes the map's `drawStars`. Node suite: screen
  count within a band across zoom .6…5, determinism; detector: no map dust point overlaps an
  address glyph's disc with the glyph's own size or larger.
- **M449 named places.** Two arms and ~10 nebulae get names (Russian, in the game's voice —
  «Рыжий рукав», not «Arm A»), drawn as quiet labels only at far zoom; the map header and the
  system card add one word — «межрукавье», «Долгий рукав», «в туманности …» — so the galaxy
  carries information, not only light. The war page moves to the world galaxy; `mapBandPaint` and
  `mapNebula` are deleted. The names enter the lore channels table (rumours may name a nebula).
- **M450 the overview.** Pinch beyond zoom 5 (to ~14): system glyphs, lanes and grid fade out
  (their per-frame loop cannot walk 15 000 sectors), the far level shows the whole disk with
  «вы здесь», the settled circle `CHRON_R`, the danger rim at r=40, your matches and rumour
  areas as the only glyphs. Pinch back in and the sheet fades back. The tap zones, the rulers and
  `mapBox` reports follow the fade (the M437 lesson: a control is judged by the frame).
- **M451 one galaxy, two views.** The sky of the flight, system, landing and title views takes its
  Milky Way from the same model: for the player's position, integrate `galaxyAt` along 360
  directions into a panorama — brightest towards the core, the band's width and dust from the arms
  you stand in, one side of the sky nearly empty at the rim. Fly from home to the frontier and the
  sky changes the way the map says it should.

## 8. Decisions taken on the author's behalf

- The galactic core is at 0:0. The rose already says so; the settled circle and the danger
  gradient already agree (bright settled heart, dark dangerous rim). The word «ядро» in regions
  (`06b-region`) and counties (`11x`) stays a local word — no change to any text.
- Picture and names only: no system moves, no mechanic reads the galaxy until the author asks
  (a later idea, not queued: scanners reaching less far in a dust lane).
- The sky is the same for everyone and for ever: fixed salts, versioned like `PART_GEN` if it is
  ever retuned after release (a postcard's back or a shared frame must keep matching).

## 9. Risks

- **The home screen.** The bulge sits under the most-used screen; if the cap is wrong, the whole
  first hour looks different. Tune on that frame first.
- **Bake cost on a phone.** `P`=8 near tiles at zoom 5 are ~12 tiles; measure on `-Mobile` and
  drop to `P`=6 before adding any fbm octave.
- **Golden frames and the picture oracle** change in M447, M448 and M449 — accept once per
  milestone, never «while I'm here».
