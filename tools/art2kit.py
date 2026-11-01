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
import numpy as np
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


_PIX = {}


def pixels(img):
    """Пиксели текстуры один раз на изображение. Брать img.pixels внутри выборки
    нельзя: это копия всех 4 МП на КАЖДУЮ вершину — конвертер вставал намертво."""
    key = img.name
    if key not in _PIX:
        w, h = img.size
        buf = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(buf)
        _PIX[key] = (w, h, buf.reshape(h, w, 4))
    return _PIX[key]


def sample_image(img, uv):
    """Ближайший пиксель текстуры по UV (0..1), возвращает (r,g,b) 0..1."""
    w, h, arr = pixels(img)
    if not w or not h:
        return None
    x = int((uv[0] % 1.0) * (w - 1))
    y = int((uv[1] % 1.0) * (h - 1))
    p = arr[y, x]
    return (float(p[0]), float(p[1]), float(p[2]))


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
    # цвет берём ПО МАТЕРИАЛУ треугольника: у фигуры их несколько (комбинезон, стекло,
    # металл, кожа). Текстура, если она есть у материала, перебивает его базовый цвет.
    mcache = {}
    for mi, m in enumerate(mats):
        img = image_of(m)
        bc = base_color(m) if m else (0.6, 0.6, 0.6)
        mcache[mi] = (img, bc)
    me.calc_loop_triangles()
    for tri in me.loop_triangles:
        total_tris += 1
        img, bc = mcache.get(tri.material_index, (None, (0.6, 0.6, 0.6)))
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
    s = ("%.2f" % x).rstrip("0").rstrip(".")
    return s if s not in ("-0", "") else "0"


# В массиве держим только изменчивое: позиция, нормаль, цвет — 9 чисел на вершину.
# w/sp/em постоянны для всего меша и подставляются в сборщике: это срезает четверть
# объёма модуля, не меняя ни контракт h3dPack, ни вид.
body = ",".join(f(v) for t in verts_out for v in t[:9])
js = []
js.append("/* art: %s — сгенерировано tools/art2kit.py из %s, руками не править." % (NAME, os.path.basename(SRC)))
js.append("   %d треугольников, %d вершин, радиус %.2f. В массиве 9 чисел: xyz, nxyz, rgb." % (total_tris, len(verts_out), R))
js.append("   w/sp/em постоянны для меша и подставляются в сборщике. */")
js.append("const ART_%s_V=[%s];" % (NAME.upper(), body))
js.append("function art%sMesh(){" % NAME)
js.append("  return bodyMesh(\"art:%s\",2,()=>{" % NAME)
js.append("    const S=ART_%s_V,n=S.length/9,V=new Array(n*12);" % NAME.upper())
js.append("    for(let i=0,j=0;i<S.length;i+=9,j+=12){for(let k=0;k<9;k++)V[j+k]=S[i+k];")
js.append("      V[j+9]=3;V[j+10]=.6;V[j+11]=0;}")
js.append("    const m=h3dPack(V,%s,{st:[[0,%s],[0,%s]],ne:1.6,kh:.5,gl:.4});" % (f(R), f(R * .4), f(-R * .4)))
js.append("    m.len=%s;return m;});" % f(R * 2.0))
js.append("}")
with open(DST, "w", encoding="utf-8") as fh:
    fh.write("\n".join(js) + "\n")
print("WROTE", DST, os.path.getsize(DST), "bytes")
