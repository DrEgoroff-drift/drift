# art2kit — from a Blender mesh to a Drift body

The gate named in `docs/ART-3D-PLAN.md`. Without it, no Blender model can reach the game: Drift has
no asset loader, and every body is an `h3dKit` vertex array.

## What it produces

A generated `src/` module:

```js
/* art: <name> — сгенерировано tools/art2kit.py, руками не править. */
const ART_<NAME>_V=[x,y,z, nx,ny,nz, r,g,b, w,sp,em, …];
function art<Name>Mesh(){
  return bodyMesh("art:<name>",2,()=>{const m=h3dPack(ART_<NAME>_V,R,{st:…}); m.len=…; return m;});
}
```

The vertex is exactly what `h3dKit` writes (`17c2a-hull3d.js:33`): position, normal, colour 0…1,
paint weight, specular, emission. Triangles are three vertices in mesh order. Normals come from the
mesh, colours from the base-colour texture sampled per vertex through UV (or the material's base
colour when there is no texture) — the engine has no texture path for bodies, so the texture is
*baked into vertex colour*, which is the only way it can look textured at all.

## Usage

```powershell
# 1. optionally thin the mesh (a 900 k-tri source is not a game asset)
blender --background --python tools/art_decimate.py -- in.glb out.glb 3000

# 2. convert
blender --background --python tools/art2kit.py -- out.glb src/17c2n-art-<name>.js <name>

# 3. wire it in
#    a builder calls art<Name>Mesh() exactly like bodyBuoyMesh() does
```

Module naming: `src/17c2n-art-*.js` — inside the `17c2*` body band, after the kit and before the
builders that would use it. `build.ps1` concatenates in byte order, so the prefix is the contract.

## Cost, measured

| Case | Tris | Verts | Module size | Bytes/tri |
|---|---:|---:|---:|---:|
| UV sphere, 24×16 | 732 | 2 196 | **124 KB** | 170 |
| a 3 000-tri prop | 3 000 | 9 000 | ≈ 510 KB | 170 |
| a 10 000-tri character | 10 000 | 30 000 | ≈ 1.7 MB | 170 |

170 bytes per triangle is **too much** for a shipped body. Three cuts, none of them made yet:

1. colours as `0..255` integers instead of `0.000…0.999` — saves ~15 chars per vertex;
2. `w/sp/em` are almost constant per body — emit three scalars per mesh, not per vertex;
3. `%.3f` → `%.2f` for normals and colours, which is under one 8-bit step.

Together these should land near 90 bytes/tri, i.e. ~270 KB for a 3 000-tri prop. That is the budget
to design against until the numbers are re-measured.

## Rules the tool keeps

- **Reads, never writes, the source model.** The `.glb` is opened read-only.
- **No renderer change.** Output is the same array the hand-written builders produce, so draw calls,
  materials, culling and LOD behave exactly as before.
- **LOD by emitting several meshes**, not by runtime work — a far mesh is another, smaller `V`.
- **Normals, scale and orientation** are whatever the exporter wrote; `glTF` is Y-up, `h3dKit`
  bodies are Z-up, so the caller passes `export_yup` accordingly (verified only for Z-up exports so
  far — this is the first thing to check on a real asset).
