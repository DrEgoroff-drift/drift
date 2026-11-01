# Прореживание многомешевой модели до бюджета и запекание позы в сетку.
#   blender --background --python tools/art_slim.py -- <in.glb> <out.glb> <total-tris> [action] [frame]
#
# Модели из генератора приходят в T-позе — это заглушка, а не персонаж. Если задан клип,
# его кадр запекается в сетку до прореживания: так в игру уходит естественная поза.
import bpy, sys

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SRC, DST = argv[0], argv[1]
TARGET = int(argv[2]) if len(argv) > 2 else 12000
POSE_ACT = argv[3] if len(argv) > 3 else ""
POSE_FR = int(argv[4]) if len(argv) > 4 else 0

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=SRC)

JUNK = ("Icosphere", "Sphere", "Cube", "Cylinder", "Plane", "Empty")
meshes = [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(JUNK)]
print("meshes:", len(meshes))

if POSE_ACT:
    arm = None
    for o in bpy.data.objects:
        if o.type == "ARMATURE":
            arm = o
            break
    act = bpy.data.actions.get(POSE_ACT)
    if arm is not None and act is not None:
        if arm.animation_data is None:
            arm.animation_data_create()
        arm.animation_data.action = act
        try:
            if len(act.slots):
                arm.animation_data.action_slot = act.slots[0]
        except Exception:
            pass
        bpy.context.scene.frame_set(POSE_FR)
        bpy.context.view_layer.update()
        for o in meshes:
            bpy.context.view_layer.objects.active = o
            for m in list(o.modifiers):
                if m.type == "ARMATURE":
                    try:
                        bpy.ops.object.modifier_apply(modifier=m.name)
                    except Exception as e:
                        print("pose apply failed:", o.name, e)
        print("pose baked:", POSE_ACT, POSE_FR)
    else:
        print("no rig or action:", POSE_ACT)

total = 0
for o in meshes:
    total += sum(len(p.vertices) - 2 for p in o.data.polygons)
print("tris in:", total)

keep = TARGET / max(1, total)
for o in meshes:
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
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
print("tris out:", out_total)

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
