# Космонавт Drift — пилотная фигура для игры, целиком собирается из кода.
# Ориентир — «Тайна третьей планеты»: крупный шлем, мягкий комбинезон с рёбрами,
# жёсткие ботинки, перчатки с пальцами, ранец ранца. Низкая полигональность не
# самоцель: важны силуэт, читаемость и кисти, которых у манекена нет.
#
#   blender --background --python tools/make_man.py -- <out.glb> [scale]
import bpy, sys, math
from mathutils import Vector, Euler

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
DST = argv[0] if argv else r"C:\Claude\drift-merge\_scratch\kimi3d\man.glb"
SCALE = float(argv[1]) if len(argv) > 1 else 1.0

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

def mat(name, rgb, rough=0.6, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (rgb[0], rgb[1], rgb[2], 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m

SUIT   = mat("suit",   (0.78, 0.34, 0.12), 0.72)   # рыжий комбинезон
SUIT_D = mat("suitD",  (0.48, 0.19, 0.07), 0.75)   # тёмные рёбра и швы
METAL  = mat("metal",  (0.62, 0.65, 0.70), 0.35, 0.85)
GLASS  = mat("glass",  (0.10, 0.16, 0.22), 0.15, 0.30)
BOOT   = mat("boot",   (0.20, 0.21, 0.24), 0.65)
SKIN   = mat("skin",   (0.72, 0.52, 0.40), 0.55)

parts = []

def add(ob, m):
    ob.data.materials.append(m)
    parts.append(ob)
    return ob

def cyl(p0, p1, r0, r1, m, seg=10, name="c"):
    """Усечённый конус между двумя точками."""
    a = Vector(p0); b = Vector(p1); d = b - a
    L = d.length
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r0, radius2=r1, depth=L,
                                    location=(a + b) * 0.5)
    ob = bpy.context.object
    ob.name = name
    ob.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return add(ob, m)

def box(c, s, m, name="b", rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=c)
    ob = bpy.context.object
    ob.name = name
    ob.scale = s
    if rot:
        ob.rotation_euler = Euler(rot)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return add(ob, m)

def ball(c, r, m, seg=14, ring=8, name="s"):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=r, location=c)
    ob = bpy.context.object
    ob.name = name
    return add(ob, m)

S = SCALE
# ── корпус: грудь шире таза, мягкая талия ──
cyl((0, 0, 0.94 * S), (0, 0, 1.24 * S), 0.20 * S, 0.235 * S, SUIT, 12, "waist")
cyl((0, 0, 1.24 * S), (0, 0, 1.52 * S), 0.235 * S, 0.215 * S, SUIT, 12, "chest")
# рёбра жёсткости — три кольца
for z in (1.02, 1.18, 1.34):
    cyl((0, 0, z * S), (0, 0, (z + 0.03) * S), 0.243 * S, 0.243 * S, SUIT_D, 12, "rib")
# ── таз и ноги ──
cyl((0, 0, 0.86 * S), (0, 0, 0.96 * S), 0.20 * S, 0.21 * S, SUIT, 12, "hip")
for s in (-1, 1):
    hipx = 0.10 * S * s
    cyl((hipx, 0, 0.88 * S), (hipx, 0.01 * S, 0.52 * S), 0.105 * S, 0.085 * S, SUIT, 10, "thigh")
    cyl((hipx, 0.01 * S, 0.52 * S), (hipx, 0.0, 0.16 * S), 0.085 * S, 0.070 * S, SUIT, 10, "shin")
    # колено — накладка
    box((hipx, -0.075 * S, 0.52 * S), (0.10 * S, 0.05 * S, 0.09 * S), SUIT_D, "knee")
    # ботинок: подошва + голенище
    box((hipx, 0.03 * S, 0.06 * S), (0.13 * S, 0.26 * S, 0.09 * S), BOOT, "boot")
    box((hipx, -0.02 * S, 0.15 * S), (0.115 * S, 0.13 * S, 0.12 * S), BOOT, "shaft")
# ── руки: плечо, локоть, кисть с пальцами ──
for s in (-1, 1):
    sx = 0.235 * S * s
    # плечо — шар, а не конус: рубленая грань на плече читалась кубиком
    ball((0.18 * S * s, 0, 1.42 * S), 0.105 * S, SUIT, 12, 8, "shldr")
    cyl((sx, 0, 1.30 * S), (0.28 * S * s, 0.02 * S, 1.02 * S), 0.075 * S, 0.062 * S, SUIT, 10, "upper")
    box((0.285 * S * s, 0.02 * S, 1.02 * S), (0.075 * S, 0.075 * S, 0.085 * S), SUIT_D, "elbow")
    cyl((0.28 * S * s, 0.02 * S, 1.00 * S), (0.30 * S * s, 0.05 * S, 0.76 * S), 0.062 * S, 0.052 * S, SUIT, 10, "fore")
    # манжета и кисть: ладонь шире и глубже, пальцы растут ИЗ неё, а не висят рядом
    cyl((0.30 * S * s, 0.05 * S, 0.76 * S), (0.30 * S * s, 0.05 * S, 0.73 * S), 0.058 * S, 0.058 * S, METAL, 10, "cuff")
    box((0.30 * S * s, 0.055 * S, 0.655 * S), (0.10 * S, 0.062 * S, 0.115 * S), SUIT_D, "palm")
    for f in range(4):
        fx = (0.30 + (f - 1.5) * 0.028) * S * s
        cyl((fx, 0.055 * S, 0.598 * S), (fx, 0.072 * S, 0.556 * S), 0.015 * S, 0.013 * S, SUIT_D, 6, "finger")
        cyl((fx, 0.072 * S, 0.556 * S), (fx, 0.060 * S, 0.526 * S), 0.013 * S, 0.010 * S, SKIN, 6, "fingert")
    thx = (0.30 - 0.062) * S * s
    cyl((thx, 0.055 * S, 0.672 * S), (thx - 0.018 * S * s, 0.098 * S, 0.632 * S), 0.019 * S, 0.014 * S, SKIN, 6, "thumb")
# ── шея, шлем, забрало ──
cyl((0, 0, 1.52 * S), (0, 0, 1.60 * S), 0.075 * S, 0.075 * S, METAL, 10, "neck")
ball((0, 0, 1.75 * S), 0.155 * S, METAL, 16, 10, "helmet")
ball((0, -0.045 * S, 1.75 * S), 0.135 * S, GLASS, 16, 10, "visor")
box((0, -0.16 * S, 1.75 * S), (0.13 * S, 0.05 * S, 0.11 * S), GLASS, "visorflat")
# ── ранец ──
box((0, 0.16 * S, 1.26 * S), (0.34 * S, 0.16 * S, 0.30 * S), METAL, "pack")
for s in (-1, 1):
    cyl((0.10 * S * s, 0.26 * S, 1.20 * S), (0.10 * S * s, 0.26 * S, 1.33 * S), 0.035 * S, 0.035 * S, SUIT_D, 8, "tank")

bpy.ops.object.select_all(action='DESELECT')
for p in parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
ob.name = "Cosmonaut"
bpy.ops.object.shade_smooth()

tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
print("COSMONAUT verts", len(ob.data.vertices), "polys", len(ob.data.polygons), "tris~", tris)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB', use_selection=True,
                          export_animations=False, export_skins=False, export_apply=True,
                          export_yup=True)
print("MAN_OK", DST)
