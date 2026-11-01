# Механик садится на риг игры своим скелетом, не матрицей постфактум.
# Руки опускаются поворотом костей (веса уже есть), суставы ставятся в точки рига,
# и только потом сетка режется на 13 частей в системе своей кости.
#   blender --background --python tools/mech_skin_game.py -- <in.glb> <out.glb>
import bpy, os, sys, math
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SRC = argv[0] if argv else r"C:\Users\Drew\Desktop\Kimi_Agent_3D模型修正 (2)\Сменный_механик\Сменный_механик.glb"
OUT = argv[1] if len(argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "art", "mech13-parts.glb")

# индексы PLN_MAN_BONES. Сторона без перестановки: после разворота на 180°
# анатомическое L (blender +X) приходит в игровой z < 0, это левая рука рига.
LEFT = {
    "clavicle.l": 9, "upper_arm.l": 9, "forearm.l": 10, "hand.l": 10,
    "index_01.l": 10, "index_02.l": 10, "middle_01.l": 10, "middle_02.l": 10,
    "pinky_01.l": 10, "pinky_02.l": 10, "ring_01.l": 10, "ring_02.l": 10,
    "thumb_01.l": 10, "thumb_02.l": 10,
    "thigh.l": 3, "shin.l": 4, "foot.l": 5, "toe.l": 5,
}
RIGHT = {
    "clavicle.r": 11, "upper_arm.r": 11, "forearm.r": 12, "hand.r": 12,
    "index_01.r": 12, "index_02.r": 12, "middle_01.r": 12, "middle_02.r": 12,
    "pinky_01.r": 12, "pinky_02.r": 12, "ring_01.r": 12, "ring_02.r": 12,
    "thumb_01.r": 12, "thumb_02.r": 12,
    "thigh.r": 6, "shin.r": 7, "foot.r": 8, "toe.r": 8,
}
BONE_MAP = {"root": 0, "pelvis": 0, "spine_01": 0, "spine_02": 1, "chest": 1, "neck": 2, "head": 2}
BONE_MAP.update(LEFT)
BONE_MAP.update(RIGHT)
NAMES = ["pelvis", "chest", "head", "thighL", "shinL", "footL",
         "thighR", "shinR", "footR", "armL", "foreL", "armR", "foreR"]
# мировые точки рига (игра: Y вверх, +X вперёд, Z в сторону)
GAME = []
OFFS = [(-1, (0, .87, 0)), (0, (0, 0, 0)), (1, (0, .50, 0)),
        (0, (0, -.02, -.11)), (3, (0, -.40, 0)), (4, (0, -.36, 0)),
        (0, (0, -.02, .11)), (6, (0, -.40, 0)), (7, (0, -.36, 0)),
        (1, (0, .40, -.30)), (9, (0, -.28, 0)),
        (1, (0, .40, .30)), (11, (0, -.28, 0))]
for par, off in OFFS:
    GAME.append(Vector(off) if par < 0 else GAME[par] + Vector(off))

# игра (gx, gy, gz) -> blender до разворота: см. обратное к (gx, gy, gz) = (-by, bz, -bx)
def to_bl(g):
    return Vector((-g.z, -g.x, g.y))

# куда поставить ГОЛОВУ кости, чтобы после разворота она совпала с суставом рига
def head_at(idx):
    return to_bl(GAME[idx])

CODE_BY_NAME = [("jacket", 0), ("trousers", 0), ("belt", 1), ("chest", 1),
                ("flashlight", 2), ("grip", 3), ("hair", 4), ("boot", 5),
                ("hand", 8), ("head", 6), ("tool", 7)]
BUDGET = {
    "Mechanic_Workwear": 11000,
    "Mechanic_Head": 3500, "Mechanic_Hair": 900,
    "Mechanic_Jacket_And_Sleeves": 3500, "Mechanic_Chest_And_Shoulder_Equipment": 2200,
    "Mechanic_Trousers": 3000, "Mechanic_Belt_Equipment": 500,
    "Mechanic_Hand.L": 650, "Mechanic_Hand.R": 650,
    "Mechanic_Boot.L": 450, "Mechanic_Boot.R": 450,
}


def code_of(name):
    n = name.lower()
    for key, code in CODE_BY_NAME:
        if key in n:
            return code
    return 1


def bone_of(name):
    return BONE_MAP.get(name.lower().strip(), 1)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=SRC)
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
if arm.animation_data:
    arm.animation_data_clear()

# масштаб родителя не растягивает кисть: тянем только ту кость, которую ставим
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
for eb in arm.data.edit_bones:
    eb.inherit_scale = "NONE"
bpy.ops.object.mode_set(mode="OBJECT")

meshes = [o for o in bpy.data.objects if o.type == "MESH" and o.name != "Icosphere"]
# Семантические куски одежды были вырезаны из общей поверхности. Если
# упрощать их порознь, каждый двигает свою половину общего края — получаются
# лоскуты даже при правильном скиннинге. Шов сваривается ДО упрощения; UV
# остаются на углах граней, а назначение материала — на самой грани.
clothes=[]
for o in meshes:
    code=code_of(o.name)
    for slot in o.material_slots:
        if slot.material:
            mat=slot.material.copy();mat["game_code"]=code;slot.material=mat
    if any(k in o.name for k in ("Jacket", "Trousers", "Belt_Equipment", "Chest_And_Shoulder", "Boot")):
        clothes.append(o)
if clothes:
    bpy.ops.object.select_all(action="DESELECT")
    for o in clothes:o.select_set(True)
    bpy.context.view_layer.objects.active=clothes[0]
    bpy.ops.object.join()
    merged=bpy.context.view_layer.objects.active;merged.name="Mechanic_Workwear"
    bpy.ops.object.mode_set(mode="EDIT");bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=.00005)
    bpy.ops.object.mode_set(mode="OBJECT")
    meshes=[o for o in bpy.data.objects if o.type=="MESH" and o.name!="Icosphere"]
for o in meshes:
    # Сохраняем исходные оболочки и UV. Объёмная пересборка склеивала карманы,
    # ремни и ткань; плавные веса теперь держат стыки без такой заплатки.
    o.data.calc_loop_triangles()
    npoly = len(o.data.loop_triangles)
    budget = BUDGET.get(o.name)
    if budget is None or npoly <= budget or npoly < 400:
        continue
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    d = o.modifiers.new("dec", "DECIMATE")
    d.decimate_type = "COLLAPSE"
    d.ratio = budget / npoly
    d.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=d.name)
    print("dec %-40s %d" % (o.name, len(o.data.polygons)))

# суставы: плечо, локоть, запястье и ноги — в точки рига. Корпус не двигаем:
# у рига грудь и таз в одной точке, а сетка торса живёт в локальных координатах кости.
CHAINS = [
    ("upper_arm.L", head_at(9), head_at(10)),
    ("forearm.L", head_at(10), head_at(10) + Vector((0, 0, -.28))),
    ("hand.L", head_at(10) + Vector((0, 0, -.28)), head_at(10) + Vector((0, 0, -.37))),
    ("upper_arm.R", head_at(11), head_at(12)),
    ("forearm.R", head_at(12), head_at(12) + Vector((0, 0, -.28))),
    ("hand.R", head_at(12) + Vector((0, 0, -.28)), head_at(12) + Vector((0, 0, -.37))),
    ("thigh.L", head_at(3), head_at(4)),
    ("shin.L", head_at(4), head_at(5)),
    ("foot.L", head_at(5), head_at(5) + Vector((0, -.16, -.04))),
    ("thigh.R", head_at(6), head_at(7)),
    ("shin.R", head_at(7), head_at(8)),
    ("foot.R", head_at(8), head_at(8) + Vector((0, -.16, -.04))),
]


def place(pb, head, tail):
    rest = pb.bone.matrix_local
    ry = Vector((rest[0][1], rest[1][1], rest[2][1])).normalized()
    ny = (tail - head).normalized()
    rot = ry.rotation_difference(ny).to_matrix()
    x = (rot @ Vector((rest[0][0], rest[1][0], rest[2][0]))).normalized()
    z = (rot @ Vector((rest[0][2], rest[1][2], rest[2][2]))).normalized()
    y = ny * ((tail - head).length / max(pb.bone.length, 1e-6))
    z = x.cross(ny).normalized()
    x = ny.cross(z).normalized()
    if pb.name.lower().startswith("hand"):
        # В покое ладонь смотрит к бедру, а не в потолок. Длина кисти родная.
        twist=Matrix.Rotation(math.pi/2 if pb.name.lower().endswith(".l") else -math.pi/2,3,ny)
        x=twist@x;z=twist@z
    M = Matrix(((x.x, y.x, z.x, head.x),
                (x.y, y.y, z.y, head.y),
                (x.z, y.z, z.z, head.z),
                (0, 0, 0, 1)))
    pb.rotation_mode = "QUATERNION"
    pb.matrix = M
    bpy.context.view_layer.update()
    pb.matrix = M
    bpy.context.view_layer.update()


bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="POSE")
bad = 0
for name, head, tail in CHAINS:
    pb = arm.pose.bones[name]
    if name.lower().startswith("hand"):
        tail=head+Vector((0,0,-pb.bone.length))
    place(pb, head, tail)
    got = arm.matrix_world @ pb.head
    err = (got - head).length
    print("pose %-14s err %.4f head %s" % (name, err, tuple(round(c, 3) for c in got)))
    if err > 0.02:
        bad += 1
for pb in arm.pose.bones:
    n=pb.name.lower()
    if any(n.startswith(k) for k in ("index_", "middle_", "ring_", "pinky_")):
        # Нейтральная расслабленная кисть вместо раскрытой Т-позы.
        pb.rotation_mode="XYZ";pb.rotation_euler.x-=.24 if "_01" in n else .32
bpy.context.view_layer.update()
bpy.ops.object.mode_set(mode="OBJECT")
if bad:
    raise SystemExit("POSE_MISSED %d" % bad)

for o in meshes:
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers):
        if m.type == "ARMATURE":
            bpy.ops.object.modifier_apply(modifier=m.name)

import math
ROT = Matrix.Rotation(math.pi, 4, "Z")
for o in meshes:
    o.matrix_world = ROT @ o.matrix_world
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

import numpy as np
_PIX = {}


def _pixels(img):
    key = img.name
    if key not in _PIX:
        w, h = img.size
        buf = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(buf)
        _PIX[key] = (w, h, buf.reshape(h, w, 4))
    return _PIX[key]


def _image_of(mat):
    if not mat or not mat.use_nodes:
        return None
    nt = mat.node_tree
    for n in nt.nodes:
        if n.type == "BSDF_PRINCIPLED":
            for lk in nt.links:
                if lk.to_node == n and lk.to_socket.name == "Base Color" and lk.from_node.type == "TEX_IMAGE" and lk.from_node.image:
                    return lk.from_node.image
    return None


def _base(mat):
    if mat and mat.use_nodes:
        for n in mat.node_tree.nodes:
            if n.type == "BSDF_PRINCIPLED":
                c = n.inputs["Base Color"].default_value
                return (c[0], c[1], c[2])
    return (0.45, 0.45, 0.45)


def _sample(mat, uv):
    img = _image_of(mat)
    if img is None or uv is None:
        return _base(mat)
    w, h, arr = _pixels(img)
    x = int((uv[0] % 1.0) * (w - 1))
    y = int((uv[1] % 1.0) * (h - 1))
    px = arr[y, x]
    rgb = tuple(float(x) for x in px[:3])
    # Byte-backed Blender images expose encoded sRGB samples, not scene-linear values.
    if img.colorspace_settings.name == "sRGB":
        rgb = tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in rgb)
    return rgb


buckets = {k: {"v": [], "n": [], "f": [], "uv": [], "c": [], "rgb": [], "mi": [], "mats": [], "weights": []} for k in range(13)}
for ob in meshes:
    me = ob.data
    gi = {g.index: g.name for g in ob.vertex_groups}
    mw = ob.matrix_world
    nmat = mw.to_3x3().inverted().transposed()
    uvl = me.uv_layers.active.data if me.uv_layers.active else None
    vt = []
    for v in me.vertices:
        if not v.groups:
            vt.append(1)
        else:
            best = max(v.groups, key=lambda g: g.weight)
            vt.append(bone_of(gi.get(best.group, "")))
    mats = [s.material for s in ob.material_slots]
    code = code_of(ob.name)
    me.calc_loop_triangles()
    print("TOPOLOGY", ob.name, "polygons", len(me.polygons), "nontri", sum(len(p.vertices)!=3 for p in me.polygons))
    for p in me.loop_triangles:
        tgt = max(set(vt[i] for i in p.vertices), key=lambda t: sum(1 for i in p.vertices if vt[i] == t))
        b = buckets[tgt]
        base = len(b["v"])
        org = GAME[tgt]
        mi_source=me.polygons[p.polygon_index].material_index
        mat = mats[mi_source] if mi_source < len(mats) else None
        facecode=int(mat.get("game_code",code)) if mat else code
        for li, i in zip(p.loops, p.vertices):
            q = mw @ me.vertices[i].co
            b["v"].append((q.y - org.x, q.z - org.y, q.x - org.z))
            nn = (nmat @ me.vertices[i].normal).normalized()
            b["n"].append((nn.y, nn.z, nn.x))
            uv = tuple(uvl[li].uv) if uvl else (0.0, 0.0)
            b["uv"].append(uv)
            b["c"].append(facecode)
            b["rgb"].append(_sample(mat, uv))
            weights={}
            for vg in me.vertices[i].groups:
                target=bone_of(gi.get(vg.group,""))
                weights[target]=weights.get(target,0)+vg.weight
            items=sorted(weights.items(),key=lambda x:-x[1])[:4] or [(tgt,1)]
            total=sum(w for _,w in items)
            b["weights"].append([(b,w/total) for b,w in items])
        if mat is not None and mat not in b["mats"]:
            b["mats"].append(mat)
        mi = b["mats"].index(mat) if mat in b["mats"] else 0
        for k in range(1, len(p.vertices) - 1):
            b["f"].append((base, base + k, base + k + 1))
            b["mi"].append(mi)

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

for k in range(13):
    b = buckets[k]
    if not b["f"]:
        print("  %-8s empty" % NAMES[k])
        continue
    me2 = bpy.data.meshes.new("m_" + NAMES[k])
    me2.from_pydata(b["v"], [], b["f"])
    me2.validate()
    me2.update()
    for mm in b["mats"]:
        me2.materials.append(mm)
    for pi, idx in enumerate(b["mi"]):
        if pi < len(me2.polygons):
            me2.polygons[pi].material_index = idx
    ob2 = bpy.data.objects.new(NAMES[k], me2)
    bpy.context.scene.collection.objects.link(ob2)
    cl = me2.uv_layers.new(name="CODE")
    uv = me2.uv_layers.new(name="UVMap")
    me2.uv_layers.active = uv
    for idx, val in enumerate(b["uv"]):
        if idx >= len(uv.data):
            break
        uv.data[idx].uv = val
        cl.data[idx].uv = (b["c"][idx] / 8.0, 0.0)
    ys = [p[1] for p in b["v"]]
    xs = [p[0] for p in b["v"]]
    zs = [p[2] for p in b["v"]]
    print("  %-8s %5d tris  x %.2f..%.2f  y %.2f..%.2f  z %.2f..%.2f" % (
        NAMES[k], len(me2.polygons), min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)))

bpy.ops.object.select_all(action="SELECT")
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT), export_format="GLB", use_selection=True,
                          export_animations=False, export_skins=False, export_apply=True, export_yup=True)
print("SKIN_OK", os.path.abspath(OUT), "tris",
      sum(len(o.data.polygons) for o in bpy.data.objects if o.type == "MESH"))

# Модуль пишется отсюда, не через glTF: повторный импорт менял оси, и код
# материала терялся — в игре человек собирался из чужих координат.
def _f(x):
    s = ("%.3f" % x).rstrip("0").rstrip(".")
    return s if s not in ("-0", "") else "0"

JS = os.path.join(os.path.dirname(os.path.abspath(OUT)), "mechanic13.js")
parts_js = []
tris = 0
for k in range(13):
    bkt = buckets[k]
    if not bkt["v"]:
        continue
    body = []
    for i, p3 in enumerate(bkt["v"]):
        n3, rgb = bkt["n"][i], bkt["rgb"][i]
        body.append(",".join(_f(x) for x in (p3[0], p3[1], p3[2], n3[0], n3[1], n3[2], rgb[0], rgb[1], rgb[2], bkt["c"][i])))
    tris += len(bkt["v"]) // 3
    parts_js.append("    {bone:%d,v:[%s]}," % (k, ",".join(body)))
text = "\n".join([
    "/* art: mech13 — tools/mech_skin_game.py, руками не править.",
    "   %d треугольников. Вершина: xyz, nxyz, rgb, код материала. */" % tris,
    "const ART_MECH13={\n  parts:[",
    "\n".join(parts_js),
    "  ]};",
    "function artMech13Parts(){return ART_MECH13.parts;}",
    ""])
open(JS, "w", encoding="utf-8").write(text)
print("JS_OK", JS, os.path.getsize(JS), "tris", tris)

import json
with open(os.path.join(os.path.dirname(os.path.abspath(OUT)), "mechanic-skin.json"),"w") as fp:
    json.dump({"bind":[list(v) for v in GAME], "parts":[{"bone":k,"v":b["v"],"n":b["n"],"c":b["c"],"rgb":b["rgb"],"w":b["weights"]} for k,b in buckets.items() if b["v"]]},fp)
