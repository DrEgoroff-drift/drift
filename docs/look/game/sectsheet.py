"""A contact sheet of every room kind in the base's section at the near lens (M632b).

    python docs/look/game/sectsheet.py [w=1920] [h=1080] [cols=4] [tile=640] [only=kind,kind] [night=1] [power=0]
Each kind is built at column 1, row 1 of sect.py's test base with the man standing in it, shot with
gshot.py and laid out with its name; writes sect_sheet.png next to the shots.
"""
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

from where import shots

KINDS = ["reactor", "solar", "drill", "storage", "habitat", "refinery", "pad", "battery", "lyse", "radiator",
         "cryo", "mast", "beacon", "med", "seal", "shop", "garden", "vat", "melter", "lab"]
HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    o = {"w": "1920", "h": "1080", "cols": "4", "tile": "640"}
    for kv in sys.argv[1:]:
        k, v = kv.split("=", 1)
        o[k] = v
    kinds = o["only"].split(",") if "only" in o else KINDS
    extra = [k + "=" + o[k] for k in ("night", "power") if k in o]
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    for k in kinds:
        subprocess.run([sys.executable, os.path.join(HERE, "sect.py"), "room_" + k, "far=0", "cur=1", "row=1",
                        'room="%s"' % k] + extra, check=True, env=env, cwd=HERE,
                       stdout=subprocess.DEVNULL)
        r = subprocess.run([sys.executable, os.path.join(HERE, "gshot.py"), "js=g_sect_room_%s.js" % k,
                            "eval=eval-sect.js", "out=sr_%s.png" % k, "w=" + o["w"], "h=" + o["h"], "tail=0"],
                           env=env, cwd=HERE, capture_output=True, text=True, encoding="utf-8")
        print(k, "ok" if os.path.exists(os.path.join(shots(), "sr_%s.png" % k)) else "MISSING", flush=True)
    cols, tw = int(o["cols"]), int(o["tile"])
    tiles = []
    for k in kinds:
        f = os.path.join(shots(), "sr_%s.png" % k)
        if os.path.exists(f):
            im = Image.open(f).convert("RGB")
            tiles.append((k, im.resize((tw, round(im.height * tw / im.width)))))
    if not tiles:
        return
    th = tiles[0][1].height
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * th), (8, 8, 10))
    try:
        font = ImageFont.truetype("segoeui.ttf", 24)
    except Exception:
        font = ImageFont.load_default()
    d = ImageDraw.Draw(sheet)
    for i, (k, im) in enumerate(tiles):
        x, y = (i % cols) * tw, (i // cols) * th
        sheet.paste(im, (x, y))
        d.rectangle([x, y, x + 150, y + 34], fill=(0, 0, 0))
        d.text((x + 8, y + 3), k, fill=(255, 255, 255), font=font)
    out = os.path.join(shots(), "sect_sheet.png")
    sheet.save(out)
    print(out)


main()
