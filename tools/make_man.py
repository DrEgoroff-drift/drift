# Космонавт Drift — пилотная фигура, целиком из кода.
# Ориентир — «Тайна третьей планеты»: крупный шлем с забралом, мягкий комбинезон
# с рёбрами, жёсткие ботинки одной деталью, перчатки с пальцами, ранец.
#
# Форма собирается ЛОФТОМ по профилю (кольца переменного радиуса), а не набором
# цилиндров: набор давал бочку из колец и рубленые стыки.
#
#   blender --background --python tools/make_man.py -- <out.glb> [scale]
import bpy, sys, math
from mathutils import Vector, Euler

TAU = math.pi * 2
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
DST = argv[0] if argv else r"C:\Claude\drift-merge\_scratch\kimi3d\man.glb"
S = float(argv[1]) if len(argv) > 1 else 1.0

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)


def mat(name, rgb, rough=0.6, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (rgb[0], rgb[1], rgb[2], 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


SUIT = mat("suit", (0.74, 0.33, 0.13), 0.72)
SUIT_D = mat("suitD", (0.44, 0.17, 0.06), 0.76)
METAL = mat("metal", (0.60, 0.63, 0.68), 0.34, 0.85)
GLASS = mat("glass", (0.07, 0.12, 0.17), 0.12, 0.25)
BOOT = mat("boot", (0.17, 0.18, 0.21), 0.62)
SKIN = mat("skin", (0.70, 0.50, 0.38), 0.55)

parts = []


def push(verts, faces, m, name):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(m)
    parts.append(ob)
    return ob


def loft(profile, m, seg=16, name="loft", axis="z", base=(0.0, 0.0, 0.0)):
    """profile: [(t, r1, r2)] — кольца вдоль оси; r1 по X, r2 по Y."""
    verts = []
    for t, r1, r2 in profile:
        for i in range(seg):
            a = i / seg * TAU
            x = math.cos(a) * r1 * S
            y = math.sin(a) * r2 * S
            z = t * S
            if axis == "z":
                verts.append((base[0] + x, base[1] + y, base[2] + z))
            else:  # вдоль X (руки в стороны)
                verts.append((base[0] + z, base[1] + x, base[2] + y))
    faces = []
    for k in range(len(profile) - 1):
        for i in range(seg):
            j = (i + 1) % seg
            faces.append((k * seg + i, k * seg + j, (k + 1) * seg + j, (k + 1) * seg + i))
    faces.append(tuple(range(seg - 1, -1, -1)))
    o = (len(profile) - 1) * seg
    faces.append(tuple(range(o, o + seg)))
    return push(verts, faces, m, name)


def ball(c, r, m, seg=14, ring=8, name="s"):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=r * S, location=c)
    ob = bpy.context.object
    ob.name = name
    return push([v.co[:] for v in ob.data.vertices],
                [tuple(p.vertices) for p in ob.data.polygons], m, name) if False else _ball(ob, m, name)


def _ball(ob, m, name):
    ob.name = name
    ob.data.materials.append(m)
    parts.append(ob)
    return ob


def box(c, s, m, name="b"):
    bpy.ops.mesh.primitive_cube_add(size=1, location=c)
    ob = bpy.context.object
    ob.scale = (s[0] * S, s[1] * S, s[2] * S)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return _ball(ob, m, name)


# ── торс: одно тело от таза до плеч, грудь шире, талия уже ──
loft([(0.86, 0.185, 0.135), (0.98, 0.205, 0.150), (1.10, 0.190, 0.140),
      (1.22, 0.215, 0.155), (1.34, 0.235, 0.160), (1.44, 0.225, 0.155),
      (1.52, 0.155, 0.120)], SUIT, 18, "torso")
# рёбра — узкие полосы поверх тела, не кольца-цилиндры
for z in (1.03, 1.17, 1.31):
    loft([(z, 0.213, 0.152), (z + 0.022, 0.216, 0.155), (z + 0.030, 0.213, 0.152)],
         SUIT_D, 18, "rib")
# ── ноги: бедро → колено → голень одной лентой ──
for s in (-1, 1):
    bx = 0.095 * s
    loft([(0.06, 0.085, 0.085), (0.20, 0.078, 0.080), (0.36, 0.072, 0.074),
          (0.50, 0.082, 0.082), (0.60, 0.088, 0.086), (0.74, 0.100, 0.098),
          (0.88, 0.110, 0.105)], SUIT, 14, "leg", base=(bx, 0.0, 0.0))
    ball((bx, -0.045, 0.545), 0.062, SUIT_D, 12, 8, "knee")
    # ботинок одной деталью: пятка, подъём, носок — выше и длиннее, чтобы читался
    loft([(0.0, 0.088, 0.185), (0.05, 0.098, 0.205), (0.115, 0.096, 0.190),
          (0.175, 0.090, 0.150), (0.235, 0.084, 0.120)], BOOT, 14, "boot", base=(bx, 0.03, 0.0))
# ── руки: плечо, локоть, предплечье, кисть ──
for s in (-1, 1):
    sx = 0.195 * s
    # плечо крупнее и ближе к телу: прежний шар оставлял щель между рукой и торсом
    ball((0.175 * s, 0.0, 1.430), 0.112, SUIT, 12, 8, "shldr")
    loft([(1.455, 0.100, 0.100), (1.30, 0.088, 0.088), (1.14, 0.074, 0.074),
          (1.02, 0.068, 0.068)], SUIT, 12, "arm", base=(sx, 0.0, 0.0))
    ball((sx, 0.0, 1.02), 0.062, SUIT_D, 10, 6, "elbow")
    loft([(1.02, 0.066, 0.066), (0.90, 0.060, 0.060), (0.80, 0.056, 0.056),
          (0.765, 0.058, 0.058)], SUIT, 12, "fore", base=(sx, 0.0, 0.0))
    loft([(0.765, 0.066, 0.066), (0.730, 0.066, 0.066)], METAL, 12, "cuff", base=(sx, 0.0, 0.0))
    # ладонь крупнее и глубже: прежняя была тоньше пальцев и кисть читалась обрубком
    box((sx, 0.030, 0.660), (0.056, 0.040, 0.085), SUIT_D, "palm")
    for f in range(4):
        fx = sx + (f - 1.5) * 0.026
        loft([(0.585, 0.014, 0.014), (0.552, 0.013, 0.013), (0.525, 0.011, 0.011)],
             SUIT_D, 6, "finger", base=(fx, 0.032, 0.0))
        loft([(0.525, 0.011, 0.011), (0.505, 0.009, 0.009)], SKIN, 6, "tip", base=(fx, 0.038, 0.0))
    loft([(0.690, 0.019, 0.019), (0.655, 0.015, 0.015)], SKIN, 6, "thumb", base=(sx - 0.058 * s, 0.056, 0.0))
# ── шея и шлем ──
loft([(1.52, 0.075, 0.075), (1.60, 0.070, 0.070)], METAL, 12, "neck")
ball((0.0, 0.0, 1.745), 0.150, METAL, 18, 12, "helmet")
# забрало — сфера чуть больше и вперёд, с металлическим ободом
ball((0.0, -0.052, 1.745), 0.132, GLASS, 18, 12, "visor")
loft([(1.745 - 0.132, 0.0, 0.0)], METAL, 18, "x") if False else None
# ── ранец и баллоны ──
box((0.0, 0.155, 1.245), (0.165, 0.075, 0.150), METAL, "pack")
for s in (-1, 1):
    loft([(1.16, 0.034, 0.034), (1.33, 0.036, 0.036)], SUIT_D, 10, "tank", base=(0.095 * s, 0.255, 0.0))

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
