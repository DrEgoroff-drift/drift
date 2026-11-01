# Character asset pipeline

The runtime remains one offline HTML file. Original GLB, BLEND, textures and previews
stay in the desktop source folder, outside git. The importer only reads them.

The November 2026 source set is `Kimi_Agent_3D模型修正 (4)`. It contains 100 residents,
the mechanic and Govorun. The Govorun model from this folder was rejected by the
author and is not used. Do not copy its archives or binary models into the repository.

## Representation

`tools/character_assets.py` writes shared vertices with millimetre-scale precision,
signed byte normals, linear byte colours, four byte joint indices and normalized byte
weights. Position quantization is 1/4096 metre (maximum component error 0.122 mm).
Indices use signed deltas and variable integers. Attribute planes and index bytes
use standard LZ4 blocks, then base64 for inline JavaScript. `21phb-art-skin` decodes
the format synchronously without a library or network access.

Resident models are decoded on demand into a 12-entry cache. Posed meshes retain the
existing 128-entry room cache and incremental mesh pump. All four weights contribute
when baking a seated, walking or standing pose; the existing two-part GPU blend then
animates head/shoulder seams. Facial vertices use the existing room face matrices.
AI managers and people without a resident ID retain their procedural generator.

The mechanic keeps rigid areas on the existing thirteen game bones. Only mixed
triangles have their vertices updated from the four source weights per frame. This
avoids a new shader, pipeline or renderer pass. Equipment uses the existing lamp,
drill and flame parts and their original runtime callbacks.

Govorun uses the existing site's procedural bird, from `bird/`. `tools/site_bird.py`
copies its pure geometry builders into a private namespace; WebGL and the site's
separate animation/audio loops are excluded. The game converts the body, parts and
individual feathers for its room renderer. It draws in its existing window, at most 30 updates/second.
Its parts follow `PAR`; no additional animation loop is created. The small console
icon retains its original atlas path and update cadence.
The camera fits the complete posed silhouette, including the tail and open wings.
Dragging rotates the view; a short tap still uses the bird's existing reactions.

## Rebuild

Run from the repository root with Python 3.12, numpy and Blender 5.2 installed.
Replace `SOURCE` with the absolute desktop folder path. Output intermediates belong
in `_scratch/`, never in git.

```powershell
python tools/character_assets.py SOURCE _scratch/character-assets
Copy-Item _scratch/character-assets/27f3d*-npc-art.js src/

blender --background --python-exit-code 1 --python tools/mech_skin_game.py -- SOURCE/Сменный_механик/Сменный_механик.glb _scratch/mechanic-fix/mech13.glb
python tools/character_assets.py --mechanic _scratch/mechanic-fix/mechanic-skin.json src/21phb1-mech-art.js

python tools/site_bird.py

powershell -ExecutionPolicy Bypass -File test.ps1
```

The resident LOD3 files in this source set are incomplete: for example NPC-002 has
eyes, ears and lips but no torso or legs. Use LOD2; both the importer and regression
suite check body height. A source-set validation report alone is insufficient.

For mechanic clothing, join and weld the source seams before decimation, retaining
per-face material codes and corner UVs. Voxel remeshing erases pockets and folds and
was rejected after visual review. Preserve the hand bone lengths when retargeting;
rotate wrists inward rather than stretching their tails. The source texture is
sampled only during conversion; byte-backed Blender `image.pixels` remains encoded
sRGB and must be converted to linear colour before packing. Runtime retains vertex
colour, with native straps, ankle seals and the helmet shell added by the game.

Generated data modules exceed the usual 40 KB reading guard because each record is
an indivisible encoded asset. Locate the consumer or importer instead of reading
base64 tables. Current sizes are approximately 4.1 MB for all residents and 269 KiB for
the revised mechanic. The site bird adds about 80 KB of procedural geometry code rather
than a model payload. No binary asset is added to git.

The phone performance gate is still a separate final release check. PC regression
and layout checks do not establish S23 cadence or thermal behaviour.

## Runtime revision 0.499.106

The imported full bodies had fused sleeves and waist/coat surfaces. Their original nearest-surface weight transfer pulled the connected coat into the arm during bar and seated poses. Runtime now uses the established articulated game bodies with the residents' stable IDs, role clothing and imported individual heads. Heads are extracted from LOD1 triangles whose vertices are predominantly bound to the head; the original source files are unchanged. Rebuild the resident payloads with `python tools/character_assets.py --heads SOURCE src`. Imported head, hair and glasses retain their local geometry; eyes and lips receive only restrained facial motion. Skin colour is shared by face, neck and hands. Full-body files from older conversions must not replace the head-only payloads.
