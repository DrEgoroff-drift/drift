# Craft: laws borrowed from painting traditions

Research notes, August 2026. Three sessions of looking outside the project for rendering
technique — first at CodePen, then at generative artists and graphics papers, then at painting
traditions that formalised their craft into teachable rules.

**What this file is for.** Not a style guide and not a wishlist. It records *laws* — rules a
craftsman was taught, which happen to be algorithms — together with the exact place in `src/`
each one bears on, and the evidence for why it is a gap rather than something already done.
Read it before a visual milestone; grep it for a module name.

**What it is not.** None of these traditions is to be imported as a look. Drift has a settled
visual language and a rule that any rework holds to it. What is taken is the *analysis of the
problem*, never the aesthetic.

---

## 0. What was searched, and what was empty

Recording the empty directions matters as much as the finds: it stops the next session
repeating the walk.

**CodePen** — a shopfront for one-page demos. Its search is closed to anonymous users, and once
logged in the default ordering is dominated by keyword-stuffed SEO pens; `&order_by=popularity`
fixes it. The source of any public pen is readable as `window.__item.js` on the pen page (the
`.js` raw URL is gated, and the Chrome extension blocks returning page data, so read pens in the
in-app browser pane). After reading ten candidates, one technique survived: shadow volumes
(§4). Everything else was either already done better here or contradicted a deliberate decision.

**Chinese front-end platforms** (掘金, 知乎, CSDN, 博客园) — beginner tutorials. The single
optimisation advised across the whole sample was "build all particle paths, then call `stroke()`
once", which `16a-space` has done for years, with reasons.

**Chinese game-dev** — Houdini, Gaea, GPU procedural generation for AAA. No bearing on a
single-file canvas 2D game.

**Japanese Qiita** — `getContext("2d")` basics.

**Starsector dev blog** — world structure (constellation placement, hyperspace lanes, nebula
extents), nothing about rendering; Java with shaders.

**mapgen4** (Red Blob) — a million Voronoi cells rendered on WebGL for a top-down *map*. One
thing worth keeping: the author's stated goal is to look pretty rather than realistic, and an
outline is what makes it read as hand-drawn. Drift already has that as law.

The general lesson: **national developer forums are translations of the same English tutorials.
Search by school, not by country.** Difference appears only where a country had its own
pictorial tradition that someone had to digitise.

---

## 1. Layer order, and light that is only ever added — Russian icon painting

The most useful find, and it is domestic.

*Личное письмо* (the painting of faces and bare skin) is a fixed sequence, taught as a trade:

| | stage | what it does |
|---|---|---|
| 1 | **санкирь** | the dark ground laid under everything |
| 2 | **вохрение** | volumes lightened by mixing white into the санкирь |
| 3 | **плавь** | the smooth, blended transition |
| 4 | **отборка** | lightening hatch-strokes with the brush |
| 5 | **движки** | short sharp light strokes on the most prominent points |

Two laws follow.

**Nothing is ever darkened — only lightened.** The painter starts at the darkest and mixes in
white all the way to pure white. Shadow is not applied; shadow is what was left untouched.
Drift already has the engine for exactly this — 94 uses of
`globalCompositeOperation="lighter"` across `src/` — but not the discipline: light is laid as
radial gradients over a finished picture rather than grown out of a dark ground.

**The final highlight is strokes, not a gradient.** *Движки* are a few discrete, hard marks
placed by count. Everything specular in Drift is currently a soft gradient. A soft highlight
reads as blur; a stroke reads as an edge the form actually has. This is the missing finish on
rock, on hull metal, on anything wet.

Drift's own law is *body, outline, one light* — stage 1, and stages 2–3 collapsed. **Stages 4
and 5 have no counterpart in the codebase**, and both are the finish.

Bearing on: `23aa-dig-rock`, `03b-hull-paint`, `03e-hull-draw`, `19c-light`, `21ab-base-interiors`.

## 2. Direction of laying *is* the shading — Byzantine mosaic

*Andamento* is the rule governing how tesserae are laid. `Opus vermiculatum`: rows follow the
contour of the form, curving around it. `Opus musivum`: from the subject the rows ripple
outward, filling the background to the edge.

This independently confirms the flow-field + Gabor pairing of §5 — the same conclusion reached a
thousand years earlier and written down as a workshop rule. It adds one thing that was not
obvious: **the background flows too.** In Drift every background is inert — noise, gradient, a
flat field. In a mosaic the background is the continuation of the subject's movement.

A second device: tesserae were set at slightly varying angles and the joints deliberately left
open, so light catches unevenly across the surface. Stated as a law: **a surface made of many
pieces reads richer than a smooth one** — which is Drift's own *many pieces, one body* seen from
the other side. Ours says how to bind pieces into a body; theirs says why pieces at all.

Bearing on: `18c-chunks` (a flow field is bakeable per chunk), `23aa-dig-rock`, `16-flight`
(nebula background), `16a-space` (dust).

## 3. Emptiness is not a defect — notan and ma

This one contradicts our own instrument, and it is right.

**Notan** ("dark–light"): reduce the frame to fewer than three values and check that the light
and dark masses balance, neither subordinating the other; shape and ground have equal standing.
**Ma**: empty space carries as much of the work as the filled space.

Now `src/28y-look.js`. Its targets are `LOOK_TARGET={pair:15,empty:45,contrast:.30,tones:5}`,
and the header records "пусто 55–91%" as a diagnosis.

**The empty fraction is the wrong measure, for exactly the reason the same file already rejected
the "warm 25–75%" target.** That comment reasons: an ice world is *obliged* to be cold, so
demanding half-warmth of it paints every planet alike. Open space is likewise obliged to be
empty. The mistake was caught once and then repeated on the next line.

Notan gives a better measure at the same cost, since `lookFrame()` already walks every fourth
pixel and has luminance in hand:

- quantise `val` to three steps;
- report the area split between the masses, and the length (or raggedness) of the boundary
  between them.

The question stops being *how much is empty* and becomes **does the frame read as two or three
shaped masses**. An empty field with one clear mass passes. An empty field of even grit fails.
Today the instrument cannot tell those apart; the eye tells them apart instantly.

This is the cheapest change in the file and should come first: without a truthful measure, none
of the rest can be judged.

Bearing on: `28y-look`, and therefore the whole visual queue, since `lookAll()` is how scenes
are judged.

## 4. Shadow volumes — the one thing CodePen had

Verified gap: every shadow in Drift is painted and local — `groundShadow`
(`19-mode-landing:320`), `hullShade` (`03b-hull-paint:165`), `kitLayShadow`
(`27j-ui-kitlay:41`), `sdShadow` (`12tb-settle-draw:221`), `homeShade` (`27e-ui-home:696`).
None of them knows where the lamp is. `destination-out` is used once in the whole project
(`12i-pirate-hull:266`).

The technique, confirmed by a working pen (sean_codes, "Fake Shadows (CASTING)"):

1. a mask canvas per lamp;
2. the light itself is a radial gradient, white to transparent;
3. `globalCompositeOperation="destination-out"`, then fill polygons projected from the occluder
   away from the lamp — the projection eats the light away;
4. composite the mask onto the frame with one `drawImage`.

**Do not copy that pen's maths.** It takes the four corners of an axis-aligned rectangle, sorts
by distance and bails on `if(points.length==4)`; it breaks as soon as a corner falls outside the
lamp radius, and it cannot handle polygons. The author says as much in a comment. The correct
form is **silhouette edges**: iterate edges, keep those whose normal faces away from the lamp,
project those. Works on any polygon, no special cases, O(edges).

Cost fits `18c-chunks` exactly: in a cave neither the rock nor the lamp moves, so the mask bakes
once. The cast direction must come from the same `celSun` the visible disc uses — `19c-light`
already fixed a "two suns" bug (M242), and a hand-rolled shadow vector would reintroduce it.

Bearing on: `23a-dig-draw`, `23aa-dig-rock`, `21ab-base-interiors`, `24aa-raid-draw`.

## 5. Texture that says what a thing is made of — 皴 and Gabor noise

Chinese landscape NPR is the one place where a national tradition produced real graphics
research, because a thousand years of ink painting had to be taught to a machine (Zhejiang CAD
lab, *Real-Time Image-Based Chinese Ink Painting Rendering*; *A non-photorealistic rendering
method … for 3D mountain models*, npj Heritage Science, 2022).

Painting a rock is four ordered stages:

| | stage | what it does |
|---|---|---|
| 勾 | contouring | silhouette in thick ink |
| **皴** | **texturing (*cun*)** | grain and cracks with a **dry brush** — conveys hard or soft |
| 染 | washing | light ink, volume |
| **点** | **dotting** | mosses and small trees on top |

Drift's *body, outline, one light* has 勾 and 染. **皴 and 点 are missing** — and they are
exactly what the cave rock lacks: it has form and it is lit, but it has no *material*. Whether
it is hard or crumbling cannot be read off the picture.

Worth knowing that 皴法 is not one device but a **classified set**: 披麻皴 combed-hemp (long soft
fibres — sedimentary), 斧劈皴 axe-cut (short hard chips — granite, fracture), 雨点皴 raindrop
(stippled grit), 卷云皴 rolling-cloud, 折带皴 folded-ribbon (bedding). That is a ready-made
lookup table from rock type to texture pattern, tested over centuries — directly usable against
`18b-geology`.

**The mechanism we lack is oriented noise.** Both papers build paper and *cun* texture on
**Gabor noise**, not Perlin. A Gabor kernel is a Gaussian envelope times a harmonic; the noise is
a sparse convolution of that kernel over random points, controlled by three legible numbers —
**orientation, principal frequency, bandwidth** (Lagae et al., *Procedural Noise using Sparse
Gabor Convolution*, 2009).

Drift's noise arsenal is `noise1`/`noise2`/`fbm1`/`fbm2` (`01-core:18-26`) plus `noise3`/`fbm3`
(`24-mode-belt:7,16`). **All isotropic.** A fibre, a scratch, bedding, a brush direction cannot
be had from isotropic noise in principle — there is no parameter for it.

Gabor noise supplies direction, and its orientation can be driven by a vector field. Combined
with §2 and with flow fields (§6):

> **a flow field says where the rock runs → Gabor noise lays grain along it → that is 皴**

No WebGL, no dependency: arithmetic over points, baked once per chunk, then one `drawImage`.

One more thing both papers state explicitly, and it is worth having as confirmation: the
rice-paper texture **stays fixed in screen space while the camera moves**, or it reads as a
pattern painted onto the objects rather than as the paper everything is drawn on. Drift's
`grainPass` lays its grain as a screen-space pattern (`19c-light:388`). Correct, and now for a
reason.

## 6. Many transparent layers instead of one fill — watercolour and flow fields

**Watercolour** (Tyler Hobbs). A shape is not filled; it is a stack of 30–100 layers at ~4%
opacity, each a slightly different deformation of one polygon. The deformation is recursive and
trivial: for each segment A→C take the midpoint B, displace it to B′ from a Gaussian, replace
the segment with A→B′ and B′→C. Seven rounds make the base polygon; four or five more per layer.
Variance is inherited by child segments with reduction, and is **assigned per segment**, which is
what makes one edge of a blot sharp and another diffuse. Colours are not blended but interleaved
by layer — five red, then five yellow.

Drift's `nebula()` (`16-flight:49`) is `createImageData` at 192×192 with two fbm fields stretched
over the screen. Honest noise, but it has no edges: the cloud is uniformly soft everywhere,
because its softness comes from one function. That is precisely the failure watercolour cures.
The cost is one-off, not per-frame — it bakes into `screenLayer`.

**Flow fields.** A grid of angles from noise; particles follow it and leave trails. Drift has
fbm, but uses it only as a *height* — a value at a point. It is used as a *direction* nowhere.
These give different things: a height gives a blob, a direction gives a current.

Bearing on: `16-flight` (nebula), `25g-postcard` (its own painter, and the genre suits it),
`16a-space` (dust currently travels in straight lines in three layers), `20-life` (grass could
lie along one wind rather than each blade on its own sine phase).

## 7. Blue noise instead of white — Obra Dinn, void-and-cluster

The smallest change here and the cheapest.

`19c-light:374-382` fills the 64×64 grain tile with `h01(x,y,0x9E71)` — white noise. White noise
has low-frequency content, i.e. **clumps**: pixels gather into patches, and on a flat fill that
reads as dirt. Blue noise has no clumps by construction; void-and-cluster takes a pixel from the
densest cluster and puts it in the largest void until it evens out. Obra Dinn uses a 128×128
blue-noise field alongside an 8×8 Bayer matrix for the same reason.

Runtime cost is zero — the tile bakes once and stays the same `createPattern`. The generator is
about fifty lines. At the same `globalAlpha=.075` the picture gets visibly cleaner.

Checked the converse too: Drift's dither does not crawl under motion. In `19a-mode-scoop:136` it
is keyed to **world** coordinates via `hashi(Math.round(u*4096),Math.round(v*4096),sd)` — the
stabilisation Pope had to invent is already the case here.

## 8. One rule at every scale — African settlement fractals

Ron Eglash found on aerial photography that traditional settlements are self-similar: a circle of
circles of round dwellings; rectangular walls enclosing ever smaller rectangles; broad avenues
branching down to footpaths — **the same form at every level**. Fieldwork established these are
intentional designs, not a by-product of social dynamics; the palace at Logone-Birni, Cameroon,
is built this way throughout.

Drift's settlement plan (`12t-settle:53,60`) is computed from the system seed; the base
(`21a-mode-base`) is a cell grid. Both are **flat**: one level, one rule. Recursion would supply
what procedural placement always lacks — the sense that a place *grew* rather than being laid
out: the yard echoing the settlement, the settlement echoing the district.

## 9. Signs need a grammar — kolam

Rani and Gift Siromoney studied kolam from the 1970s as **two-dimensional picture languages with
formally definable syntax**. Patterns are generated either by an array grammar over basic
symbols, or by an L-system whose symbols are read as cursor moves; rotation, reflection and
half-turn are the operations.

`12t-settle:40` says the pidgin glyphs are "drawn as signs, not as letters" — right intent, but
they are generated as a scatter. Generated from a **grammar** instead, they would look like a
writing system rather than a set of squiggles. The player will not read the language, but will
feel that there is one. That was the goal in the first place.

## 10. Growing instead of parameterising — differential growth

Anders Hoff's *hyphae*: circles grow next to one another without overlapping, producing a root
system. *Differential mesh*: edges of a closed contour lengthen, new vertices are inserted,
neighbours push apart, and the contour crumples into folds by itself — the way lichen does.

All of Drift's procedural organics are **parametric**: the form is a formula and it sways on a
sine (`20-life:343-349`). Nothing in the game is *grown*. Lichen and growths on cave rock are the
natural first use — hard to draw parametrically, easy to grow — as is the pattern of cracks
through stone. This is also stage 点 of §5: dotting laid over finished texture.

---

## Order of work

*Superseded by the combined plan in [`DESIGN-story-craft.md`](DESIGN-story-craft.md) — that
ordering wins where the two differ. Kept below as the raster-only view.*

1. **Notan measure in `look()`** — first, because without a truthful instrument nothing else can
   be judged, and the current `empty` target is wrong for the reason the file itself documents.
2. **Blue noise tile** — an hour, no risk, visible in every scene.
3. **Движки and отборка** — discrete hard highlight strokes replacing soft gradient specular; the
   icon rule "only ever lighten" fits `lighter`, which is already everywhere.
4. **Rock texture: flow field + Gabor + stages 皴/点**, with andamento's addition that the
   background flows too. Start at `23aa-dig-rock`, table of patterns from 皴法 tied to
   `18b-geology`.
5. **Watercolour nebula** — layered low-alpha deformed polygons, baked in `screenLayer`.
6. **Shadow volumes** by silhouette edges, cave first, direction from `celSun`.
7. **Recursion in the settlement plan** and **grammar for the glyphs** — design work, not raster;
   they queue by intent, not by frame.

Not yet examined: Persian miniature (no single light source, pattern density in place of
modelling) and Dutch glazing over grisaille.

## Sources

- Icon painting: *Личное письмо (иконопись)*, ru.wikipedia; Murom museum, technique of личное
  письмо in 16th–18th c. icons.
- Andamento: The Mosaic Store, "Design Fundamentals — Andamento".
- Notan / ma: en.wikipedia, *Notan*, *Ma (negative space)*.
- Ink painting: Zhejiang CAD lab, *Real-Time Image-Based Chinese Ink Painting Rendering*
  (`cad.zju.edu.cn/home/jin/papers/ChineseInkPainting.pdf`); *A non-photorealistic rendering
  method based on Chinese ink and wash painting style for 3D mountain models*, npj Heritage
  Science, 2022.
- Gabor noise: Lagae, Lefebvre, Drettakis, Dutré, *Procedural Noise using Sparse Gabor
  Convolution*, SIGGRAPH 2009.
- Watercolour: Tyler Hobbs, *A Guide to Simulating Watercolor Paint with Generative Art*.
- Flow fields: Tyler Hobbs, *Flow Fields*.
- Blue noise: demofox, *Generating Blue Noise Textures With Void And Cluster*; Bart Wronski,
  *Superfast void-and-cluster Blue Noise*; Lucas Pope on Obra Dinn's 1-bit pipeline.
- Shadow casting: CodePen, sean_codes, *Fake Shadows (CASTING)*.
- African fractals: Ron Eglash, *African Fractals: Modern Computing and Indigenous Design*, 1999;
  Aeon, "Lessons from the fairness of African fractal societies".
- Kolam: K. Krithivasan, *A View of India through Kolam Patterns and their Grammatical
  Representation*; Siromoney & Siromoney, array grammars for kolam.
- Differential growth: Anders Hoff (inconvergent), *On Generative Algorithms: Hyphae*,
  *Differential Mesh*.
