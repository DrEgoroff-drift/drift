# The renderer — WebGPU, with Canvas 2D as the brush

The author, 23.09.2026: «переноси все на новые технологии, то что не умеют новые оставлять в канвас»;
«нахуй откат и поддержку старой версии, все по новой»; «графику только улучшать … не надо одинакого, надо
лучше»; «первое — на новый движок, потом по плану». This file is the recipe; the open work is PLAN.md §0.

## 0. The author's decisions (binding)

- **WebGPU only, no fallback**, no switch, no old-version support.
- **Hybrid:** what the GPU does badly (text, complex vector shapes) stays Canvas 2D, live or baked to a texture.
- **Graphics only get better.** The same look is not accepted: a G step is closed by a `main | gpu` pair of the
  same scene plus one line saying what got better. No improvement, not closed.
- **Do not measure** (no benches); the one yardstick is the stage-0 gate in PLAN.md.
- **No new tools:** rewrite the old one or kill it and write one new. Before rewriting a shared tool, grep its
  callers.
- **No heredocs** for scripts: write a `.py` file, run it by path.
- **Rules may be broken for beauty** (the author, 24.09: «можно менять правила, если это красиво»). The frame
  laws, the palette, «the language stays» and every point of §L are defaults, not fences: if breaking one makes
  the WHOLE frame visibly more beautiful, break it, and say in the gain line what was broken and for what. The
  judge is the 760 px pair. Never moved: gameplay, physics, world generation (a seed gives the same system; new
  randomness comes from its own `rng` stream), the save format. The process stays.
- **The step gate (24.09):** a pair of WHOLE frames (2560×1600 → 760 px wide), one scene, gpu visibly better at
  first glance; the gain line is about the frame, not an element. Crops only as an extra. Cheap by construction
  (¼ resolution, caches), not by benches.

## L. The leap — redo everything, Control says what (brief of 24.09, before G5…G14)

The author: «пусть всё переделывает». Order L1 → L2 → L3 → L4 → the G steps again on top. A commit per sub-item,
each with a whole-frame pair. Frame laws stand as defaults: cold key + warm accent; a frame is 2–3 masses; the
light has a source and the lit sits by it; everything standing casts a shadow; grain instead of flat fill; motion,
not blinking; mix tone along a short arc.

**L1 the space backdrop** (first: k_g4m plus two more star classes).
1. Grade: space shadows cold (violet → blue, no brown; the old gpu backdrop was (37,22,35), brown murk); the star's
   side warm.
2. The nebula in three scales. Macro: 2–3 masses a frame — a lit mass, a dark dust band, a void (notan, `look()`).
   Middle: filaments and pillars, the brightest gas is the edge toward the star. Micro: grain along the flow field.
   Palette: 2–3 hues around the wheel per system, ≥90° apart, not one violet family.
3. Dust absorbs: stars and gas behind a band get dimmer and redder.
4. Depth: three parallax layers; the far one colder, paler, softer, the near one more contrasty.
5. The star's glow is scattering in gas and dust: warm, by density (denser = brighter), seen with the star off
   frame. The k_g4m regression (left band 156 → 67) closed with margin.
6. Shafts in space: planets, station, asteroids between the star and the camera cut the light — shadow rays through
   the dust (radial blur of the occlusion mask from the star's screen point, off frame too).
7. Stars: brightness by a power law (many faint, few bright), colour by temperature. Spikes only on the ≤5
   brightest in frame (tens now — noise). Stretch in flight, twinkle only at rest.
8. Near-camera motes (parallax >1): sparse, lit from the star's side, streaks in flight.
Bolder (24.09): at least one system in five sits INSIDE a bright emission nebula — the whole frame glows, hulls are
silhouettes on light; grades need not be cold+warm — monochrome (amber for a red giant) and contrast pairs
(teal + orange, magenta + green) are allowed, take the most beautiful per star class; every system has one huge
landmark on the backdrop seen from everywhere (a supernova remnant ring, pillars, a hole's jets, a comet tail
across half the sky).

**L2 HDR light.** The scene in rgba16f with a ladder of brightness (star core ≫ flames ≫ lamps ≫ a lit hull ≤ 1).
Bloom as a mip ladder (6 levels, soft knee): wide and warm at the star, narrow at a flame. AgX tone map. A grade per
star class (LUT or split toning): red dwarf — embers and deep violet; yellow — gold with teal shadows; blue giant —
ice and indigo; binary — two keys, the frame split; hole — desaturated with the disc's orange accent. A star in
frame gets a light anamorphic streak and 2–3 ghosts. The UI takes no bloom and no grade.

**L3 light touches the world.** Materials of baked sprites: metal — a hard glint stroke, paint — diffuse, glass
reflects the star, windows and lamps emissive. Point lights (flames, beams, bolts, bursts, station lamps, nav
lights) light hulls in a radius: a beam paints a hull's edge its colour, a burst flashes on every hull nearby, one's
own flame lights the stern. Star shadows: a station shades its moored barges.

**L4 particles.** Exhaust: curl noise and a temperature ladder white → yellow → orange → red → smoke. Sparks: HDR
streaks. A burst: fireball, debris with lit edges, smoke lit by fire and star; the shock wave refracts the screen.
Heat haze behind the nozzle (G4b).

**Then the G steps again, on top of L.** Known so far:
- G2 the star alive: granulation flows, the corona in jets, prominences on the limb, flares.
- G3/G3b planets: surface in three scales, ocean glint, clouds with shadows on the ground, city lights at night,
  a Rayleigh rim and a sunset band at the terminator.
- G5 surface: the sky by scattering in the planet's air; volumetric cloud layer with a silver edge to the sun;
  visible rays through clouds; far ridges sink into sky colour; weather as particles lit by sun and lamps; HDR
  lamps and pools of light at night; water reflects sky and sun; wet sheen after rain.
- G7 cave: darkness, light only from the lamp — a cone with soft shadows from rocks, ore emissive with bloom, dust
  in the beam.

## Where I stopped (update on every commit)

- **Deploy candidate: `22b8cac` (L1b 1/n; before it `96cba49`), accepted by Контроль by its pairs.** The author: deploy to main
  before the limit window reaches 90%; the signal «ДЕПЛОЙ» comes from Контроль. On it: close the step with a
  commit; `test.ps1 -Full` and `node test-node.js`; bump `VER` and a PATCHNOTES line (what the player sees
  better, plus «needs a browser with WebGPU»); a release commit; send Контроль its sha. **Контроль pushes**
  (`git push origin gpu:main`, fast-forward only) and watches the workflow, md5 and data-alive. Rollback if
  the site falls: a commit on top with the tree of `d543aff`, never a force-push. Only a commit Контроль
  accepted by pairs goes to main. CI rehearsal of ef8c8b9 (deploy.yml flags, `--disable-gpu`): load clean,
  smoke 4/4, Node green (the «рейсы» suite fails in full order only, green alone; it sits in quarantine).
- Order now: L1b 2/n (dust) done, awaiting Контроль; then L4 (particles), then the G steps (G5 frozen).

- Done: core `08b`, kit `08c`, space `16g` (G1: live nebula wisps and lanes, stars with halo and tapered
  spikes, dust with depth of field; pair in `scratchpad/pairs/system_crop.png`),
  `docs/shot.py` on the GPU (`--budget` kept for `vetshot.py`).
- Solo from 23.09 (the author: «один он эффективнее») — no porting agents. The ten agents were stopped
  before any commit; their worktrees are removed. Kept drafts in the session scratchpad: `agent-G5G6/
  tracked.patch` (19e-clouds rewritten as density bakers, 42 KB, the GPU air module not started) and
  `agent-G11b/src__24cf-gpu-rooms.js` (a shared room kit, 5 KB). G12's tape fix is merged: the paper shows
  before the first two samples (the strip was blank for three seconds — not a GPU bug).
- Order: G2 → G14, one at a time, each closed by a pair and a line of gain.
- G2 done: `17g-gpu-system` — orbits as exact ellipses with a continuous tail, station ring, belt band + dots,
  the star of every kind as one field (photosphere with granulation, glare laid over the disc so the limb
  hands off to the corona; giant stays orange, dwarf white-hot), the bleed. Pairs by kind: scratchpad of
  session 21f451ab, `kpairs.py <scene> <name> "<js>"…` shoots main and gpu with the same `--js`
  (main's own `docs/shot.py` in `mainref`); freeze the scene first (`freeze.js` there: planet, moon and station
  angles pinned, `spd=0`, ship placed) — otherwise the two sides differ. Accepted pair: `g2f.png`, `g2f_crop.png`.
- G2 accepted by Control (24a10e2) for single, giant, binary. G2b (the hole): background lensed through the nebula
  texture of 16g plus hashed stars in the source plane, Keplerian disc with Doppler asymmetry, photon ring, the far
  disc bent over the shadow — pair `g2b.png` / `g2b_crop.png`, awaiting Control. Wide corona term .12 → .15 (weight).
- G3 done: `17ga-gpu-planets` — one quad per body: the strip wound on a true sphere (atan2 longitude), light
  from `planetSunRot` (so `91zzzb-bio` still guards it), soft terminator where there is air, cool night,
  day-side atmosphere beyond the limb instead of the r+2.5 stroke, rings in their plane with ringlets and both
  shadows, moons as lit spheres. 2D `planetDraw/planetPaint/planetLight/planetCols/drawRing` are gone. Pair
  `g3a.png` / `g3a_crop.png` (gas giant `planets[3]`, terran `planets[0]`; ship and zoom in the kpairs js).
- G3 accepted by Control; G3b (surface in three scales, sun glint on water) is in PLAN §0.
- **G4 in progress.** Done: the trail (`16ga-gpu-trail`: one triangle ribbon per nozzle lane with shared node
  normals, per-point age, gaussian core+halo; beads between segments gone). Pair `g4a_crop.png`, js in
  `trail.js` (a synthetic TRAIL, no thrust). The exhaust (same module, `gpuExhaust`: gaussian flame, flowing noise, shock diamonds, tone-mapped nozzle; the
  drawn heat arcs dropped; pair `g4b_crop.png`, thrust forced by wrapping `drawExhaust` in the js). `exhaustHaze` still
  grabs the 2D layer — removed, G4b in PLAN. Done since: the edge wall as a GPU membrane (`drawEdgeWall`,
  17-mode-system; pair `g4c.png`), the trail widening to its tail, and the hull lit from the star (`gpuHullLight`,
  16ga): after the ship's 2D draw, `gpuOver` + an IMMEDIATE `copyTextureToTexture` of a 512² patch of
  `GPU.T.front` (now COPY_SRC) into `GPU.T.hm`. The pass runs only at submit, after gpuWorld re-uploaded #c
  without the hull, so sampling `T.front` directly sees nothing. Mask alpha → edge normal → rim in star colour,
  far half darkened; pair `g4d_crop.png`. Reworked after review («reads as an outline sticker»): the mask is read
  as relief — a narrow-step gradient for the edge, a wide one (3 and 7 px) for the slope of the side; Lambert from a
  star lying almost in the plane (z .22); the rim is cos³ and only where the relief is steep, the side warms
  by its wide normal, and the shadow is a gradient across the whole hull (up to .82) deepened on the far slope;
  pair `g4e_crop.png`. Scene js (`freeze.js`, `trail.js`) also `CHIP_POS.clear()` — stale
  chip smoothing after a teleport looked like overlapping chips. The wake is `gpuWake` (16ga) on the same ribbon
  as the trail (`gtrLane`/`gtrDraw`, vertex = 3 vec4: core alpha, core share, halo alpha, world place, tatter
  weight); its halo tears into world-fixed wisps that drift slowly; the 2D bucketed `drawWake` is gone. Pair
  `g4f_crop.png`, scene `wake.js` (synthetic WAKE, two lanes). Combat energy is `gpuCombatEnergy` (13z): bolts
  (`G.shots`) and beam traces (`G.beams`) as one instanced glowing segment — white core, exponential glow in the
  colour, a hot head / impact flare, a muzzle flare for beams, tone-mapped; 2D `beamsDraw` and the shot strokes
  are gone. Pair `g4g_crop.png`, scene `combat.js` (stubs `combatShots`/`beamsTick` so nothing moves). Colour
  rework after review: tone by the max channel (hue kept), white only `pow(core,6)` on the axis, the halo in a
  saturated copy of the colour, blend `over` so the nebula does not tint the glow (orange s≈.67 h10–15, blue
  h202–222 in the body). Same segment draws missile flames and mine lights; mine zones are a soft field plus a
  thin glowing edge; missile bursts are `gpuBooms` (a field, ≤14 per frame): ragged fireball cooling white →
  yellow → cherry inside a soft shock ring. 2D `minesDraw` and the missile flame/burst strokes are gone. Pair
  `g4h_crop.png`, scene `combat2.js`. The ground battery discharge (`G.battFx`) is the same segment (2D `battDraw`
  gone); a loot box stands in a soft glow of its part colour from the GPU, its hex body and beacon dot stay 2D on
  top. Pair `g4i_crop.png`, scene `combat3.js` (loot needs `vx:0,vy:0` or it goes NaN). Wreck and «left» markers
  stay 2D: they are interface marks, not light (the wreck's flat disc → PLAN G4c). Drones are `gpuDrones` (16ga):
  the tail is one smooth ribbon over sixteen `dronePos` samples, the machine a light in the cargo colour (grey
  spark when empty), the repair lamp breathes; labels stay 2D in `drawDronesSystem`. Pair `g4j_crop.png`, scene
  `drones.js` (stubs `clockNow`). The hull light now leaves bright saturated pixels (nav lights, beacons) out of
  both light and shadow (`own`), red and green lamps = main. `freeze.js` pins `G.t=12` every frame by wrapping
  `drawSystem` — blinking lights otherwise catch different phases in the two shots. Station shuttles
  (`drawShuttleArc`, 17f; also «Сорока»'s arc): `shuttleAt(t,T)` gives place and heading, the GPU draws a fading
  wake along the same arc (twelve past samples), the nozzle flame and the breathing side light; the hull stays 2D.
  They had never been drawn at all: `sysTraffic` set `by` twice (arc end y, then the maker), fixed as `t.mk`
  (PLAN line for main). Each call draws at once under its own buffer key (`gsh<n>`, reset per frame). Pair
  `g4k_crop.png`, scene `traffic.js` (explicit arcs with literal ends and `mk` co/ra, ship at 1400,0); shuttle
  ground share .7 (Company near white, Rassvet ochre, M454). The station (`drawStation`, 17c): with the GPU on,
  `stationArt` bakes the bare body (no flat gradient, no rim stroke on the lit half) and `gpuStation` lays it as a
  field over the art texture: relief normal from the mask, cos³ rim toward the star, light as a near-white MULTIPLIER on the
  albedo (an additive film washed blue modules into pink, rejected), a shadow gradient (≤.55), lamps exempt, and
  the station's own warm gaussian glow instead of the 2D radial stops. The indust flare stack stays 2D on top.
  Pair `g4l_crop.png` (ship at -880,-1000, zoom 1.3). The station field is now `gpuLitSprite(cv,x,y,R,s,rot,lx,ly,glow)`
  (17c): any baked sprite, rotated, lit by the star. Barges (`drawBarges`, `drawMooredBarge`) use it through
  `gpuBargeBody`: `bargeArtOf` bakes the bare hull with the GPU on (no top gradient, no top-edge stroke), the live
  lights and nozzles stay 2D on top (`drawBarge(b,lit)`). Pair `g4m_crop.png`, scene `barges.js` (stubs
  `updateBarges`).
  Pirate hulls use it too (`gpuPirateBody`, 12i; pair `g4n_crop.png`, scene `pirates.js`, stubs `updateCombat`).
- G4 closed (Контроль, 24.09). Leftovers in PLAN: G4b heat haze, G4c wrecks as hulls, G4d the other ships lit.
- **G5 frozen (Контроль, 24.09: the author «прям как было»), rest in PLAN §0.** Done (1/n): `gpuSky` (19ca) — sky,
  horizon glow, scattering and the disc in one field, called from `drawSkyBase` (landing and surface);
  `drawSkyLayer` skips its glow sprite and disc when `SKY_GPU===GPU.frameNo`. The glow is MIXED into the sky
  (adding it turned pink into lavender); the disc is emissive: `dc+sky*.3`, never a per-channel `max` (that took
  the sky's blue and turned the low sun pink). TRAP: a field called inside `withScale` gets `p` and `res.zw` already
  in VIRTUAL W,H — pass world/sunSpot coords as they are, no K. Done (2/n, 3/n): light shafts in the final pass
  (08b `fsFinal`, uniforms `sh`/`shc`, U is 96 bytes): each pixel marches 28 steps toward a random point of the
  disc (soft penumbra, `sh.w` = disc radius) and takes the open share of the path weighted near the sun;
  `lightShafts` only sets `GPU.shaft` (reset in `gpuFrame`). Shafts are NOT yet shown to read: the 2D clouds are
  too thin to cut them. Pairs `g5b_crop`, `g5c_crop`, `g5d_crop` (sun behind the cloud edge and the peak), scene
  `surf.js` (pins `celSun` with ALT, `G.t`, and hides the chapter card `#smenaAct` and `say()` in both builds).
- **New gate (Контроль, 24.09): the WHOLE frame pair scaled to 760 px wide, visibly better at first glance.**
- **Next: L1 the space backdrop** (§L), then L2 HDR, L3 lights on the world, L4 particles; then G5 rest … G14.
  Done (1/n): `16gb-gpu-nebula` — the system nebula computed on the GPU instead of the 2D-baked 256² tile: three
  parallax layers of domain-warped FBM (masses with voids, filaments brightest), emission plus absorption (dust
  lanes dim AND redden what is behind — a `mul` pass with `pow(T,(.72,1,1.42))`, then an `add` pass of light),
  lit by the star from the limb (1/(1+r²), warmer toward it), the glow is scattering weighted by gas density.
  Rendered at ¼ frame into rgba16f (own pipeline, `gpuNebulaGen` before the scene pass opens; re-rendered when the
  camera moves or every 3rd frame), laid bicubic. Stars are drawn UNDER it now, motes over it. The palette is
  `gnbPalette` (own rng stream 0x4E42): orange+teal, magenta+green, violet+rose, ice+indigo (hot stars, dwarfs),
  amber mono with plum shadows (giants), bleached (hole); one system in five is INSIDE an emission nebula
  (`fill`). 17g's flat `bleed` circle is off when the nebula is up (it was the brown murk). Pairs `l1giant_760`,
  `l1normal_760` (a fill system), `l1dwarf_760`; scene `freeze.js`+`barges.js`+`delete …gnbPal`. `small.py <name>`
  makes the 760 px whole-frame pair. Done (2/n): the frame is composed large — one shaped mass (`mass` on a
  shared macro coordinate), one wide dark lane across (`band`, near layer), a calm void; the two tones go by
  REGION (`sel` with a dark seam), never per pixel; near the star the region takes the tone closer to its colour.
  Full-resolution detail at composite: ridged noise cuts the gas into filaments (`fineE`), lane edges sharpened
  (`fineT`), an ionization rim on gas edges facing the star in the gas's own hue. Shadow toning is a short step
  (`V[2].w` = palette `sw`: .1 default, .2 giant, .15 dwarf) — a wide mix of a tone with its shadow was the grey
  (dirt 9% → ≤1%). Giant: amber light, plum shadows (median 309–318°). Dwarf: two ice tones (mid 198°), indigo
  shadows (240°), glow white-blue — the glow's wide part takes the gas's hue, the core keeps the star's. Hulls on
  bright gas get a dark rim (`GPU.sep` → `a[23]`, fsFinal darkens scene near front alpha, 3/7/13 css px) — the
  left barge on green gas still reads as outline, not 3×. Stars by a power law (`.09+.7·zz^2.4`), spikes only on
  the first six bright ones; motes tinted toward the star, near layer streaks in flight. Pairs `l2normal_760`,
  `l2giant_760`, `l2dwarf_760`, `l2g4m_760` (real kind, no palette reset). Measures: `tone.py`, `hull.py`,
  `dirtmap.py` in the scratchpad. Done (3/n): the dark rim is for hulls only — `drawHull` registers up to 8
  circles (`GPU.sepH`, CSS px from `ctx.getTransform()`) into the post uniform `hl`; `sil()` (08b) runs in the
  final pass AND in `fsComp` (hulls usually reach the scene through a `gpuOver` segment before the final pass,
  there the gas behind is read from the nebula texture bound in the scene slot, `gpuCompNeb`). On bright gas a
  hull turns silhouette (×.14, lights kept, edge rimmed with the gas colour), 12-direction soft rim; UI labels
  get nothing. The star is the source again: a white-hot core (`2.6·exp(−(r/.4Rd)²)`) and whiter, stronger
  spikes in 17g, a tighter corona, the nebula's glow core cut to .2, and a stellar-wind bubble in the gas
  (`bub`, ×.28 at the limb → 1 at .5 H): core 255, ring 150–250 px median 142. The near-star region takes the
  tone closer to the star's colour (bias .3), and its glow goes to warm white — orange over teal was grey. The
  normal pair's green is emerald-teal (36,196,176; field 160–177°). Pairs `l3*_760`; `star.py <name> x y`.
  Done (4/n), shafts in space: planets cut the star's light in the nebula composite (`GNB_EMI`) — analytic, from
  up to seven planet circles (`V[4..10]`, CSS px, filled in `gpuNebulaGen(…,Z)`): behind a planet (away from the
  star) a wedge ×.2 with a penumbra widening with distance, fading after ~16 radii; light along the wedge edges
  ×1.3 («rays between shadows»). The medium it cuts: a warm star-lit dust fog over the whole system, in voids too
  (`fog`, L ~10–15, none inside the corona ring, none on gas bodies — orange fog on teal gas was grey). Pairs
  `l4shadow_760` (wedge across lit gas: planet 0, ship at 1.1×) and `l4fog_760` (planet 1, ship at 1.3×: two
  wedges through the fog). Gates kept: star ring 146, normal dirt 3.0%. The planet's phase is L3.
  Done (6/n), the landmark per system: `lmk()` in `GNB_GEN`, one huge thing on the backdrop, parallax .006 so it
  stays on screen across the whole system; kind, place, size, turn from its own rng stream (`gnbLandmark`,
  0x4C4D, cached on `sys.gnbPal.lm`; world gen untouched). 0 — supernova remnant: torn ring of filaments, cold
  shock front outside, warm threads inside; 1 — comet across half the sky: straight ion tail, curved dust tail;
  2 — far spiral galaxy at an angle: gold bulge, saturated blue arms, pink knots, dust lanes (no diffuse
  inter-arm light — it read as grey haze); 3 — only at a hole: two wound, knotted jets with lobes. It sits
  behind all gas layers (added after the loop through their `T`; WGSL gotcha: `pow(x,2.)` of a negative is NaN
  on D3D — use `sq`) and opens a window: gas thresholds rise around it (erosion, not dimming — dimmed gas is
  grey), dust thins; near the star it fades to .3 (glare). The small planet's wedge now lightens with distance
  (×.2 at the planet, ×.6 four diameters out). Pairs `lm0..lm3_760` (forced kind, centred), natural
  `nnormal/ngiant/ndwarf`. Gates: star ring 145; dirt V40+ 2.8% (V30+ 7.1%: the window's void is V 30–35,
  near black); giant 1.9%, dwarf 1.2%.
  Done (6/n returns, Контроль): **the backdrop law — nothing on the backdrop looks like a game object (beam,
  shot, exhaust, ship): soft edges, dimmer than the game layer.** The comet's frame turns so the tails point
  away from the star (`lfr`, shared by GEN and EMI in `GNB_NOISE`): straight blue ion tail, gold dust tail
  bending off in a V (`lcy`, bend side from the seed), small dim head, both tails gather light away from it.
  The jets left GEN: the hole's lens (17g) laid the old 2D tile over the volume, hiding the gas and the jets
  alike; now the lens samples `GNB.view` (screen frame, fades where the source leaves the screen, chroma
  restored — four taps across copper and blue averaged grey), and `jets()` in 17g draws from the hole's poles,
  perpendicular to its disk (−.25+π/2), both ways, wide and soft, knots near the core, lobes, the counterjet
  dimmer, before the shadow. The hole palette is copper + cold violet (the grey «faded» one was dirt). The
  window's fog goes to black (`lwin`, EMI reads the landmark from `V[11..13]`). The rest of the dirt was
  complementary mixing: the star's halo in 17g (its own colour out to 7 R) over teal gas — at .2 while the
  volume is live (`S[31]`); the glow tint takes one side of the seam; the galaxy's inner arms gold, not white;
  its lanes dim its own light. Gates (V30+, S<.25, HUD included; main ≈1.7%): nnormal 1.6%, giant 1.7%,
  dwarf 1.2%, lm0 1.9, lm1 2.3, lm2 1.6, lm3 2.7, natural hole 1.5; ring g4m 133.
  Done (L2 1/n): **light above one.** The scene and the comp target are rgba16f. `fsFinal` builds the frame
  before the shoulder — scene as it shines, the front over it, the glow ADDED (as 2D did: bright gas goes gold
  with it) — then one shoulder `tone()` per channel above .75 (smooth to white, no plateau; the hue-preserving
  variant made the frame beige and the star disc a pink blin). Glow = a mip ladder of six levels (`gpuBloom`:
  4×4 box → dual-Kawase down → tent up, added, far levels ×.72 and warmer): level 0 = the toned frame squared
  (the L1 glow) + what the scene shines above 1.4 (`frameHdr`); every level down from the second knees at
  .45×(lv−1), so gas glows only near itself and only the star reaches the wide levels (no veil). HDR sources:
  the star's hot centre (17g, +4× a gaussian of .2 Rd over the tone), beam and bolt cores and the burst's heart
  (13z, the excess over the tone kept). 2D lights: the comp pass writes a second target `tEmit` (binding 8) —
  the part of a glued 2D pixel near one AND coloured (chroma gate; white paint and text are not fire) ×150 —
  so nav lights keep their colour and get a halo of it; the last front layer (chips, marks) casts no glow, and
  the glow is ×(1−.6 a) over opaque front pixels. Gates: 255-px ≤ .12% (star core only), median L +3…+6% vs
  L1, dirt ≤ 1.6, ring g4m 146 (p95 215), HUD diff = state only (energy count, blinking chip arrow).
  Done (L2 1/n return, Контроль: «a glass ball, not a star»): the photosphere had a hard edge that cut the
  bright gas out (the disc darker than the ring past it — an eclipse), a flat white fill and a white core of
  77 px. Now (17g `star`): the surface is below the shoulder (exposure 1.4/1.0 giant), lifted a third toward
  warm yellow, darkening to the limb in the star's colour (blue goes first, red last; limb .55, not .25); the
  edge is soft over the last 8% of the radius; the photosphere covers the gas at .6, not 1; the corona over
  the disc ×(1−.5 μ); a thin warm corona right past the limb (.35); granulation contrast .7 (+.2 giant); the
  white core is small (1.6× a gaussian of .16 Rd plus the HDR spot of .11 Rd). Crop 700 px around the l2c
  star: near-white radius 36 px (main 31), L≥200 3.4% of the frame (main 1.3%: our gold gas counts too);
  g4m core 255, ring median 135 (main 137).
  Done (L2 2/n): a light grade per star class and lens optics for a star in frame (08b `fsFinal`, fed by
  `GPU.lens` from 17g `gsyStar`; uniforms `ln`, `lc`, buffer 256 B). Grade after the tone: highlights ×
  the star colour normalised by luma (9%), shadows toward cold (warm stars) or violet (t ≥ 1.6) at 10%, so
  only the hue moves — median L within ±.3%, S −3…+2%, dirt unchanged vs 79dd76a. The hole has none.
  Optics only while the disc is in frame (fades over r+60 px from the edge): a thin horizontal streak cooler
  than the star, and three soft hexagons (aperture blades, not circles — circles in combat mean targets and
  bursts) on the star→centre axis at .62/1.38/1.9 with a per-channel size shift; brightest in the middle, no
  rim. The backdrop law in numbers: all optics together add at most .058 of the scale (`min(o,.058)`), and
  30% less over the front layer. Gate script: scratchpad `l2gate2.py` (base b2_* = 79dd76a).
  Polish with L3 1/n: the grade's shadow keys follow the plan — red dwarf deep violet, yellow teal, blue
  indigo — and skip the front layer (the interface takes no grade). The core's veil: in HDR, before the tone,
  `h=max(h, white·2.5·gauss(core))` — a small object right over the core drowns in its light as in a camera
  (a dark wedge there read as a pupil); `max`, not a sum, so the open star is unchanged. Spots stay out of the
  core: inside ~.35 of the radius granules only brighten.
  Done (L3 1/n, light touches the world): one light list per frame (08b `gpuLight`, ≤16 strongest, a beam is
  a segment, a burst/bolt/flame a point) and star occluders (`GPU.oc`, the station), written at the end of the
  frame into a 16×3 rgba16f texture (`gpuLtWrite`) that both hull passes read: 17c `gpuLitSprite` (station,
  barges, pirates) and 16ga `gpuHullLight` (own hull). `plAt`: Lambert on the relief normal, lights at .3 of
  the hull radius above the plane, 1/(1+d²/r²); the hull shades itself — six steps along its own mask toward
  the source (`plOcc`, each pass maps its mask), so the far side stays dark. Metal (grey) takes a hard glint
  stroke toward the star (pow 40 on the edge normal); glass (bluish, mid) reflects the star through its own
  dome normal from the gradient of glassiness (two steps each way, so frames inside the canopy do not break it
  into sparks); windows and lamps ×2.3 — above the knee, the bloom takes them. `shAt`: a hull behind the
  station along the ray to the star is at .4 (soft edge). Sources: beams (26·zk+10, a·1.8), battery, bolts
  (.4), bursts (r·2.2+24, 3.6a+.6), own flame (R·6, thr·1.4). `GPU.plOff` switches L3 off for pairs.
  Close-up scenes (scratchpad `l3run.sh`, a camera: `shipScaleAt` 4.5 in the shot only, hull ≈150 px at 760):
  l3h — beam and burst below: lit side +31%, far side +7%; l3f — flame only: stern half +17%, bow +2%;
  l3s — barge behind the station −57%, the lit one −1%. Field L within ±.7%, dirt ≤1.7%, HUD diffs = state.
  Done (L3 2/n): allies' 2D hulls (12a, drawHull) go through `gpuHullLight(…,id)` into the same light as
  the own hull (star, beams, bursts); the station's lamps are a warm point light (`R·.9`, .7) — a moored
  barge warms on the station side. Burst flash (13z): `fk=fl²`, `fl` a linear ramp over the burst's first 6 ticks
  (~100 ms, `f.t` counts down from 18) — the light is whiter, +40 px wider and +30 stronger, then the warm
  smoulder; at the peak (l3h, BT=17.5) the near side's per-pixel median +91%, mean +80%, the far side +18%.
  The landmark back out of the centre (L1 return): its place is in half-frame units per axis
  (`Lc=(W,H)·(.5+h.xy·.5)`), and the same two stream numbers map into the corner quarter .66–.95 — the
  centre stays farther than .33 of the diagonal, only the edge enters the middle third; it frames play, not
  lies under it. A hole's jets stay at the star. Field gate vs 79dd76a: L median +14…20% — the landmark's
  window (gas recedes around it) left the middle; S +2…7%, dirt unchanged.
  Done (L3 3/n, the frame's edges): the dark halo is gone. L1's `sil` darkened the gas up to 8 px around
  every hull on bright gas (12 directions × 3 radii) and read as dirt: nebula behind a ship does not take
  its shadow. Now it is a rim light instead (08b `rimN`, `sil`): the normal from the hull's alpha gradient
  (2 px), gas sampled 6 px outward along it (fsComp: the ¼-res nebula; fsFinal: the scene), added on the hull
  × (1-n.z)³ × 1.4, only over bright gas; the hull's own darkening against bright gas stays. Scout on
  nnormal: ring 3–8 px 40.5 vs the bare gas at the same pixels 37.3 (+9%, no dark ring; the gas there is
  darker than at 20–30 px on its own, 59 — the stub row shows it); rim hue 171° = gas 171°.
  The comet is a chord along the frame's edge: the tail points away from the star (in half-frame units),
  the head half a tail back from the edge's middle, the side by the stream — it was in the corner with its
  tail out of the frame. The landmark's own strength (not the gas window) falls toward the centre:
  ×.35 → ×1 over .2–.45, measured by the frame's ellipse (on the diagonal the same as a share of the
  diagonal; the middle of the long edge keeps .74, not .45). Corners by a lattice of the system's place,
  `(sx+2·sy)&3`: neighbours always differ, any four in a row give all four (12 systems: 3/4/3/2); the top
  left drops below the HUD bars (y .36–.5 of a half-frame, x ≥ .74) — median L under the bars 24–29.
  Done (L1b 1/n, the comet): the edge chord read as a coloured haze under the HUD strip. Now the head
  sits in its lattice corner with the HUD offset like every landmark; the tails go inward along the corner's
  diagonal ±20° (stream grain) — not away from the star: the landmark is at infinity, its projection is free.
  In `d` units (H·s; 1 px at 760 ≈ .0024): head — warm white core (gauss .0035, ×8) and coma (.014), the
  brightest point of the landmark; ion tail — a straight narrow blue ray, half-width .0018 → .01 over .7,
  fading from .35 to .8; dust tail — a wide curved warm fan (`lcy` bend ±.36, ~20° off the ion), softer,
  exp(−x/.35). The centre fade dims both toward the middle third. lm1: core p99.9 200 vs the tail's first
  third median 76 (2.6×), tail +84% over the gas beside it (±18 px). Scratchpad `cometmeas.py`.
  Done (L1b 2/n, dust): the frame was a wall of gas. Now a dust layer in front of the emission gas (16gb gen
  pass, `dustAt`, parallax `PDUST` .12 — the nearest gas layer is .097): three scales in one field — 2–3 long
  bands (ridges of a stretched pattern), medium pillars and filaments, small globules — all stretched along the
  system's own direction (`seed`), the edge eaten by fine noise. The edge is measured in pixels (threshold
  minus field over its gradient, ±1.5 px), so bodies have a sharp outline at ¼ res. Density grows inward: thin
  places show gas and stars through, thick ones are blind. Inside — brown (reflected light, veins along the
  stretch, darker toward the core); the grade's shadow key still tints it (giant: violet). The ionisation front:
  on the side toward the star, a 1–3 px line lighter than the gas plus a 6–10 px glow, broken by noise. Less
  dust in the landmark's window. nnormal: field L median 41 → 34, black 5 → 6%, bright 9%; dust body hue 13–21°,
  L 18–23 (the off-screen star's haze lies over it); dwarf 14 / 19% black. Parallax: on a 128 px ship move the
  dust shifts ~15 px, the near gas ~12 — slightly faster, not a cloud shadow.
  Comet fix with it: the tail's axis turns 30±5° off the centre toward the vertical edge (a line into the
  centre hit our own ship and read as a targeting beam); the ion tail is softer (gauss 2→10 px, faint streamers
  across) and bluer — it adds hue 216°, S .53; off-axis 30.4°, core 2.35× the tail, tail +87% over the gas.
  Next: L4 — exhaust by curl noise with a temperature ladder, HDR spark streaks, fireball/debris/smoke,
  shock-wave refraction, heat haze.
  A GPU draw after `gpuHullLight` must use `gpuOver`, not `gpuScene` (the scene pass is closed by then).
- Merge each: `build.ps1`, `python docs/shot.py <scenes> --look --tag gpu`, 0 `gpu.errs`, pair with
  `scratchpad/mainref/docs/shots/main_<scene>.png`, one line of what got better, commit, strike from PLAN §0.
- Next after G2+G3 merges: G4 (system view on top, shares `17-mode-system.js`), port 9481; then G14.
- Seen on the system pair, not yet owned: the tape strip under the dials is blank on gpu (grey paper on main)
  — G12 (cockpit and tape) checks it.
- Traps: mixed line endings (match HEAD per file, check bytes with Python); `gpuScene()` is null outside a
  frame; a presented canvas is unreadable after its task (snapshot in `gpuPresent`); launchers with
  `--disable-gpu` shoot the «no WebGPU» stub (G13).

## 1. What changed and what did not

- **The world is still math.** Seeds, noise, the galaxy, orbits, economy, `stateHash` — all in JS, unchanged.
  Only the *painting* moved: a shader is a formula per pixel, so the math simply got closer to the screen.
- **WebGPU only.** No 2D fallback, no switch. Without WebGPU the player sees a plain message naming the
  browsers that can play (`gpuNone`, 08b). caniuse (23.09): WebGPU 87 %, WebGL2 96 % — the gap is iOS < 26,
  Firefox on Android/Linux, old Android.
- **Canvas 2D stays as the brush** for what the GPU does not do well: text, and complex vector shapes
  (hulls, props, people, rooms). It paints either live onto `#c` (a transparent layer the GPU composites)
  or once into a canvas that becomes a texture (`gpuImage`) — the hull bake already works that way.
- **Better, not the same.** Every ported layer should look better within the art direction
  (`docs/DECISIONS.md`: one light, rich palette, motion not twinkle, the frame's laws): per-pixel light from the
  real sun direction, soft particles and depth of field on near layers, analytic anti-aliasing, live fields where
  a bake used to freeze them, no banding (the final pass dithers every mode). Parity is the floor, not the goal.

## 2. The frame

```
gpuFrame()        #c cleared (the 2D layer), command encoder opened; false = no device → nothing is drawn
  gpuScene()      layers UNDER everything 2D: backdrops, sky, fields (gpuScene3D: the same with depth)
  …2D on ctx…     text and vector shapes land on #c
  gpuOver()       a layer ABOVE what 2D has drawn so far (each call: upload #c, composite, submit)
  …2D on ctx…     lands above that layer
gpuWorld(k,…)     #c uploaded; bloom at a quarter of the frame (4×4 box, gaussian in rgba16f)
  …UI on ctx…     the rack (25d) draws onto the UI layer — no bloom, no grain
gpuPresent()      one pass: frame + bloom, grain (overlay 7.5 %), vignette, hit chromatics, UI, blue-noise dither
```

`drawWorld()` called outside the loop (tests, stands, `look`) builds its own frame (`gpuManual`) and snapshots
it in the same task; `gpuSnapshot()` returns the composed frame as a 2D canvas (a presented WebGPU canvas
cannot be read after its task ends). `#c` is invisible (`opacity:0`) and still takes the finger; the GPU canvas
`#g` has `pointer-events:none`.

## 3. Layer order — the one rule

A GPU layer is either **under** all 2D of the frame (`gpuScene`) or **above** the 2D drawn so far (`gpuOver`).
So port a mode **from the back**: sky and backdrops first (under), then whatever sits between 2D shapes moves
together with its neighbours (a sprite via `gpuImage`), and full-frame effects on top (night, fog, light, near
particles) go through `gpuOver`. Each `gpuOver` costs one upload and one full-screen composite — two or three
per frame at most; consecutive GPU layers share the pass one call returns.

## 4. The kit (08b core, 08c kit) — coordinates in CSS pixels, colour in, premultiplied out

| call | what |
|---|---|
| `gpuScene()` / `gpuScene3D()` / `gpuOver()` | the pass to draw into; `null` outside a frame — the layer then does nothing |
| `gpuImage(pass, canvas, [{x,y,w,h,a,rot,u0,v0,u1,v1,cubic}], {blend})` | pictures and sprites; `x,y` is the centre; the canvas is uploaded once per canvas object |
| `gpuShapes(pass, [[kind,x0,y0,x1,y1,hw,soft,r,g,b,a]], {blend})` | 0 rect, 1 disc (x0,y0,r=x1), 2 capsule (hw), 3 ring; colour 0–255, a 0–1; `soft` = a soft edge that wide |
| `gpuField(pass, name, wgsl, Float32Array(≤60), [tex…], {blend})` | a full-screen field: `wgsl` defines `fn field(p:vec2f, uv:vec2f)->vec4f` (premultiplied), reads `fu.v[0..14]`, `t0..t3` via `smp` |
| `gpuPipe / gpuBuf / gpuBind / gpuCanvasTex` | your own pipelines (`layout:"auto"`, target `rgba8unorm`); `GPU_WGSL_COMMON` has `pmod`, `covRect`, `covDisc`, `covSeg`, `texCubic` |
| `GPU_BLEND` | `over` (source-over), `add` (lighter), `mul` (multiply on an opaque backdrop) |

The space layer (`16g-gpu-space`) is the worked example: instanced stars with the 2D table and `starMove`,
the dust layers from `dustTable`, the nebula composite as a texture.

## 5. Porting a mode — the checklist

1. Read the mode's draw order (`drawWorld` → the mode's draw). Mark each step: field, particles, shape, text.
2. Port from the back. Delete the 2D code you replaced — there is no fallback to keep. Keep the data and the
   seeded generation in JS; move only the painting.
3. **Improve** (§1) and say how in the commit. Check the logic you port — the old code may carry a bug or a
   wasted pass; fix it rather than copy it.
4. Precision: feed noise camera-relative coordinates (fp32 at large world coords ripples); `highp` for positions.
5. No per-frame allocations in JS: reuse `Float32Array`s, one draw per layer (instances), textures re-uploaded only
   when the source canvas changes (`gpuCanvasTex` keys by object — a bake that redraws in place needs a new canvas
   or an explicit re-upload).
6. New files are `NNg-gpu-<mode>.js` next to the mode; LF line endings (keep a CRLF file CRLF); scripts that edit
   files are `.py` files run by path — never heredocs.
7. Look: `build.ps1`, then `python docs/shot.py <scenes> --look --tag after` (and `--tag before` on the parent
   commit); zero `gpu.errs`, no page errors, no «СБОЙ»; compare the sheets side by side. Phone:
   `--w 390 --h 844 --dpr 2.625`.

## 6. Tests and tools

- Headless Chrome has WebGPU on this laptop by default (file:// is a secure context); tools must not pass
  `--disable-gpu`. GPU-less CI: `--enable-unsafe-webgpu --use-webgpu-adapter=swiftshader`.
- The Node tier draws nothing (`GPU.ok` is false there) — it checks logic only. Browser suites that read pixels
  read `gpuSnapshot()`; goldens are re-accepted after each ported mode (`test.ps1 -Accept`).
- One way to take a frame: `docs/shot.py`. `shot.ps1`, `pageshot.ps1` and the stand server go (PLAN §0).

## 7. The old 2D draw order by mode (the porting map, from the scouts of 23.09)

Back to front. F field, P particles, S shape, T text, C cached bake, 3D mesh. Line numbers are of `fbbcd12`.

| mode | layers, back to front | where |
|---|---|---|
| title | fill; nebula 2 parallax layers (baked 192²); stars | 28-loop:552, 16-flight:75 → **16g done** |
| system | nebula, stars, dust → **16g done**; orbits + comet tails S; belt ring P (190 dots); star body S (6 kinds); bleed corona (glowSprite, lighter); planets: rings/disc/lights/works/doom/moons/labels S+T | 17-mode-system:535–684, 17c-system-draw:589–594 |
| system, top | lane, gest post, sys rail, billboard, law ring, hotel, bazaar, giant, rail arrive, edge wall, peace fleet, station S; trail P; exhaust P; exhaust haze; combat P; helm marks; wrecks/finds/relay/barges/rope/traffic/lane ships/Cheburek/wanderer/fleet/drones; allies; pirate base; player hull + guns; sys HUD T | 17-mode-system:685–772, 16a-space:704, 13-pirates:706, 12a-crew:723, 24a-mode-raid:724 |
| landing | sky base F; stars (airless); sky bands F; zenith fade; ground far .26 / mid .4 S; haze band F; weather far P; ground main S; POI; deco; rocks; dust motes P; pad lights (lighter); lander shadow; lander; landing dust P; weather near P; shafts; grade | 19c-light:191–296, 19-mode-landing:171–409, 19-mode-landing-ground:11/294, 19d-weather:104, 20a-poi:173, 21b-surface-deco:166, 19f-lander:52 |
| surface | sky base; stars; sky bands; far tiles A .22 / B .35 C; haze; weather far; ground; sky shadow; water; POI; deco; built; home out; settle; tin can; trace; rocks; peep; glow patches/pad; slow; pass; places; ship shadow + lander + cabin light; motes; lights reveal; cave mouth (5 layers); mine shaft + rope; plants (wind); fauna; peep ghosts; deposits; tracks; walk dust; astronaut; swim ring; mining beam; foreground grass; weather near; night overlay (rim + lamps); shafts; grade | 21e1-surface-world:109–612, 21e-surface-draw:194, 21c-built:64, 20-life:4/406, 20f-fauna:231, 21b-surface-deco:278/406, 11g/11i/11o/11p/11v, 20c-peep:88/206 |
| cave | far wall F; rock tiles C (planetMat); solid deco C; water C; props C; darkness sprite + corners; sun cone (lighter); wall marks; lamp floor glow + dust; crystals/veins/drops/lamp cone P; own light (moss) | 22-mode-cave:652–692, 22a-cave-deco:241–504, 22b-cave-props:233 |
| dig (mine) | rock pass C (geology, veins, multiply depth); vignette multiply; lamp warm glow; ore halos + shine grains (lampK); void path + scoop marks | 23a-dig-draw:54–156 |
| belt | gradient bg; 4 nebula spots; sun disc + halo; ring stripe (7 arcs); star sphere P; far rocks P; dust streaks P; rock meshes 3D (z-sorted lit faces, 12/42/162 verts) + POI | 24-mode-belt:378–543 |
| scoop | giant atmosphere 2 layers C (parallax); depth overlay; 5 wave edges S; crests P; incoming streaks P | 19a-mode-scoop:271–369 |
| raid | fill; cell floors lit; floor gloss; walls; hangar doors + emitters; ceiling lights; floor pools; contents (containers, crane, wreck); enemies (z-sorted limbs) | 24aa-raid-draw:14–500+ |
| wanderer | walls/ceiling/floor F; seams + brass rail; boards; window (planet, cold streaks); depth rings; cases + lamps + item icons C; hanging objects; counter + keeper; pollen P; vignette | 24c-mode-wanderer-draw:124–310+ |
| base | ground/sky/rocks; rock shadows; cracks; excavation; shaft + cage + light cone (live); room glows (lighter); lift; modules; walking people; staff + names | 21ac-base-draw:55–384 |
| home | shell; wall; floor; light cone (lighter); window (hour); furniture C; partitions + door lights; folk (depth sort); owner; foreground cut; lamps + final glow | 29d-home-draw:32–310 |
| winter | room raster C; window (sky, mountain, snow, glass); stove glow; lamp + cone | 29g-winter-draw:339–465 |
| spa | sky + sun halo; sea (waves, sun path, cape); foam; deck; rails; board T; table | 29i-spa-draw:46–241 |
| HQ | wall; ceiling + cables; window to space; 4 tube lamps + cones; props; consoles + lights; crew | 27f-hq-room:37–121+ |
| map | fill; galaxy band C (2 LOD); rhumb rays; galaxy stars P (~1500); arm/nebula names T; rails; address grid; jump rings; player circle; search circle; lanes; rumours (clip hatch); lore, survey, fleet, wander marks; holdings/war; systems loop (mapStarPaint, lighter) + labels; off-screen arrow; ГЛАВТРАССА prices T; routes, barges, drones; jump course; system card T; rulers, rose; footer T | 18-mode-map:122–503, 17z1-galaxy:97/156, 17z-map-backdrop:82/126, 17z2-galaxy-names:38, 18e-rail-net:181, 18a-map-addr:55–506, 18b-map-hold:80/186 |
| rail ride | fill; galaxy + stars; rail net; current line (keel + highlight); bus dash; stops + names; headlight cone; bus / train body; arrival flash (lighter); header T | 18g-rail-ride:120–172 |
| road | sky gradient; 3 breathing nebulae (lighter); 110–190 stars; hyper tunnel (46 spokes); 5 passing pilots; beat sparks; touch pulses; trail points → body (halo + core) → flare; nozzle lumens; brake fires; turn vanes; hyper cocoon; hull; **bloom field (CPU fbm, putImageData 26 Hz)**; bottom mask | 27la-road-sky:12–136, 27l-road-draw:167–383, 27lb-road-bloom:65 |
| cockpit | glass tint + glare (clip); glare sweep; frame C; 5 dials T; tape strip (putImageData); LEDs; bars T | 25-cockpit:415–460, 25a-instr:100, 25b-tape:187 |
| frame | heat haze (18d:12–79, copies strips) ; hit chromatics → **core**; bloom, grain, vignette → **core**; grade (surface/landing, 19c:258) | 18d-postfx, 19c-light |
| postcard | own canvas, 8 painters, seeded, no G | 25g-postcard:170–294, 25g-post-*, 25h-post-forms* (G14) |

`getImageData` is used only for bounds (hull ink box 03e1:113, tile span 18c:152, staple 26e2:170, road 27l:81)
and `lookFrame` (28y:49/326) — none in gameplay.
