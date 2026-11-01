# Прореживание модели для проверки конвертера: 903k трис -> N трис, экспорт GLB.
#   blender --background --python tools/art_decimate.py -- <in.glb> <out.glb> <tris>
import bpy, sys

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SRC, DST = argv[0], argv[1]
TRIS = int(argv[2]) if len(argv) > 2 else 3000

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=SRC)

keep = [o for o in bpy.data.objects if o.type == "MESH" and o.name != "Icosphere"]
for o in bpy.data.objects:
    if o.type == "MESH" and o.name == "Icosphere":
        bpy.data.objects.remove(o, do_unlink=True)

bpy.ops.object.select_all(action='DESELECT')
body = bpy.data.objects.get("Govorun_body_feathers") or keep[0]
body.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
print("joined verts", len(ob.data.vertices), "polys", len(ob.data.polygons))

# снимаем скиннинг, чтобы GLB был чистым мешем
for m in list(ob.modifiers):
    ob.modifiers.remove(m)
ob.parent = None
ob.vertex_groups.clear()

ratio = min(0.9, TRIS / max(1, len(ob.data.polygons)))
d = ob.modifiers.new("dec", 'DECIMATE')
d.decimate_type = 'COLLAPSE'
d.ratio = ratio
bpy.ops.object.modifier_apply(modifier=d.name)
print("after decimate polys", len(ob.data.polygons))

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB', use_selection=True,
                          export_animations=False, export_skins=False, export_apply=True)
print("DEC_OK", DST)
