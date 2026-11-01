# Прореживание многомешевой модели до бюджета: каждый меш получает свою долю.
#   blender --background --python tools/art_slim.py -- <in.glb> <out.glb> <total-tris>
import bpy, sys

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SRC, DST = argv[0], argv[1]
TARGET = int(argv[2]) if len(argv) > 2 else 12000

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=SRC)

# мусор генератора: сферы-заглушки, кубы и цилиндры-держатели
JUNK = ("Icosphere", "Sphere", "Cube", "Cylinder", "Plane", "Empty")
meshes = [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(JUNK)]
print("мешей:", len(meshes))

total = 0
for o in meshes:
    total += sum(len(p.vertices) - 2 for p in o.data.polygons)
print("всего треугольников:", total)

keep = TARGET / max(1, total)
for o in meshes:
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    # мелкие части (инструменты, линза) не трогаем: они и так дешёвые
    if tris < 400:
        continue
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    d = o.modifiers.new("dec", 'DECIMATE')
    d.decimate_type = 'COLLAPSE'
    d.ratio = max(0.002, min(0.95, keep))
    bpy.ops.object.modifier_apply(modifier=d.name)

out_total = 0
for o in meshes:
    out_total += sum(len(p.vertices) - 2 for p in o.data.polygons)
print("после прореживания:", out_total)

# снять скиннинг и позу: игровой меш — статичная сетка в своей позе
for o in meshes:
    for m in list(o.modifiers):
        o.modifiers.remove(m)
    o.parent = None
    o.vertex_groups.clear()

bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
ob.name = "Mechanic"

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB', use_selection=True,
                          export_animations=False, export_skins=False, export_apply=True,
                          export_yup=True)
print("SLIM_OK", DST, "tris", out_total)
