# art2kit — конвертер: меш из Blender -> массив V для h3dKit (12 чисел на вершину).
#
#   blender --background --python tools/art2kit.py -- <in.glb> <out.js> <NAME> [tris]
#
# Вершина h3dKit: [x,y,z, nx,ny,nz, r,g,b, w,sp,em]
#   r,g,b — цвет 0..1 (из текстуры по UV, иначе из базового цвета материала)
#   w     — «вес» краски (плоскость выпечки), sp — блеск, em — свечение
# Треугольники: три вершины подряд. Порядок обхода — как в меше.
#
# Оригинал не трогаем: только читаем GLB и пишем новый модуль src/.
import bpy, sys, os, math
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if len(argv) < 3:
    print("usage: art2kit.py -- <in.glb> <out.js> <NAME> [tris]")
    sys.exit(1)
SRC, DST, NAME = argv[0], argv[1], argv[2]
TARGET_TRIS = int(argv[3]) if len(argv) > 3 else 0

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=SRC)
meshes = [o for o in bpy.data.objects if o.type == "MESH"]
if not meshes:
    print("no meshes"); sys.exit(1)


def sample_image(img, uv):
    """Ближайший пиксель текстуры по UV (0..1), возвращает (r,g,b) 0..1."""
    w, h = img.size
    if not w or not h:
        return None
    x = int((uv[0] % 1.0) * (w - 1))
    y = int((uv[1] % 1.0) * (h - 1))
    px = img.pixels
    i = (y * w + x) * 4
    return (px[i], px[i + 1], px[i + 2])


def base_color(mat):
    if not mat or not mat.use_nodes:
        return (0.6, 0.6, 0.6)
    for n in mat.node_tree.nodes:
        if n.type == "BSDF_PRINCIPLED":
            c = n.inputs["Base Color"].default_value
            return (c[0], c[1], c[2])
    return (0.6, 0.6, 0.6)


def image_of(mat):
    if not mat or not mat.use_nodes:
        return None
    for n in mat.node_tree.nodes:
        if n.type == "TEX_IMAGE" and n.image:
            return n.image
    return None


verts_out = []
R = 0.0
total_tris = 0

for ob in meshes:
    me = ob.data
    if TARGET_TRIS:
        # грубое прореживание: инстансы -> в меш с decimate
        pass
    mw = ob.matrix_world
    uv = me.uv_layers.active.data if me.uv_layers.active else None
    mats = [s.material for s in ob.material_slots] if ob.material_slots else []
    img = image_of(mats[0]) if mats else None
    bc = base_color(mats[0]) if mats else (0.6, 0.6, 0.6)
    me.calc_loop_triangles()
    for tri in me.loop_triangles:
        total_tris += 1
        for li in tri.loops:
            v = me.vertices[me.loops[li].vertex_index]
            p = mw @ v.co
            n = (mw.to_3x3() @ v.normal)
            ln = n.length or 1.0
            n = n / ln
            col = bc
            if img and uv:
                s = sample_image(img, uv[li].uv)
                if s:
                    col = s
            verts_out.append((p.x, p.y, p.z, n.x, n.y, n.z, col[0], col[1], col[2], 3.0, 0.6, 0.0))
            d = p.length
            if d > R:
                R = d

print("tris", total_tris, "verts", len(verts_out), "R", round(R, 3))

def f(x):
    s = ("%.3f" % x).rstrip("0").rstrip(".")
    return s if s not in ("-0", "") else "0"

body = ",".join(f(v) for t in verts_out for v in t)
js = []
js.append("/* art: %s — сгенерировано tools/art2kit.py из %s, руками не править." % (NAME, os.path.basename(SRC)))
js.append("   %d треугольников, %d вершин, радиус %.2f. Вершина h3dKit: xyz, nxyz, rgb, w, sp, em. */" % (total_tris, len(verts_out), R))
js.append("const ART_%s_V=[%s];" % (NAME.upper(), body))
js.append("function art%sMesh(){" % NAME)
js.append("  return bodyMesh(\"art:%s\",2,()=>{const m=h3dPack(ART_%s_V,%s,{st:[[0,%s],[0,%s]],ne:1.6,kh:.5,gl:.4});" % (NAME, NAME.upper(), f(R), f(R * .4), f(-R * .4)))
js.append("    m.len=%s;return m;});" % f(R * 2.0))
js.append("}")
with open(DST, "w", encoding="utf-8") as fh:
    fh.write("\n".join(js) + "\n")
print("WROTE", DST, os.path.getsize(DST), "bytes")
