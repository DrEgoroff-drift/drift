# -*- coding: utf-8 -*-
# Writes a scene snippet with a synthetic hull of a given form and class, so the ship generator
# of the planet (21phb) can be looked at across the fleet without owning every ship (M621).
#   python docs/look/game/ship.py <form> [class] [colour] [hour]
# forms: swept delta xwing twin slab boxed disc trident; classes: scout courier hauler miner
# warship yacht survey; colour: a hex like 2a6fb0 (default by class). Prints the snippet's name:
# g_ship_<form>_<class>.js — shoot it with pose.py base= or gshot.py js=.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from where import shots  # noqa: E402

CLS = {"scout": (.85, 1.0, 0, 1, 1), "courier": (.5, 1.52, 0, 0, 1), "hauler": (1.9, 1.04, 1, 0, 0),
       "miner": (1.52, .92, 1, 0, 0), "warship": (1.16, 1.12, 0, 0, 0), "yacht": (.74, 1.34, 0, 0, 1),
       "survey": (.92, 1.14, 0, 1, 0)}  # bw, len, cont, dish, atm
COL = {"scout": "d9d5c8", "courier": "2a6fb0", "hauler": "b8862b", "miner": "7a7f6a", "warship": "4a5560",
       "yacht": "f2eee6", "survey": "3f8f7a"}


def rgb(hx):
    return [int(hx[i:i + 2], 16) for i in (0, 2, 4)]


def mix(a, b, t):
    return [round(a[i] + (b[i] - a[i]) * t) for i in range(3)]


def hull(form, cls, colhex):
    bwk, lenk, cont, dish, atm = CLS[cls]
    nose, tail = 22 * lenk, -18 * lenk
    ln = nose - tail
    bw = 6.0 * bwk * (2.4 if form == "disc" else 1)
    blunt = not atm
    nosew = bw * .5 if blunt else max(.9, bw * .16)
    tailw = bw * .62
    prof = []
    segs = 11
    tp = .4
    for i in range(segs + 1):
        t = i / segs
        x = nose + (tail - nose) * t
        if form in ("disc", "slab"):
            w = bw * (1 - .9 * (2 * t - 1) ** 2) if form == "disc" else bw * (.75 + .25 * (1 - abs(2 * t - 1)))
        elif t < tp:
            u = t / tp
            w = nosew + (bw - nosew) * u * u * (3 - 2 * u)
        else:
            u = (t - tp) / (1 - tp)
            w = bw + (tailw - bw) * u * u * (3 - 2 * u)
        if form == "trident" and t < .2:
            w *= .7
        prof.append([round(x, 2), round(max(.7, w), 2)])
    wings = []
    if form == "delta":
        root, back, span = nose * .38, tail * .84, bw * 2.7
        wings.append([[root, -bw * .7], [root - ln * .12, -span * .45], [back + ln * .06, -span], [back, -span * .92], [back, -bw * .85]])
    elif form == "xwing":
        for k in (0, 1):
            root, d = (tail * .30, -1) if k else (nose * .22, 1)
            chord, span = ln * .19, bw * 1.95
            wings.append([[root + chord * .5, -bw * .7], [root + chord * .5 - d * ln * .10, -span],
                          [root - chord * .5 - d * ln * .10, -span * .86], [root - chord * .5, -bw * .8]])
    elif form == "twin":
        x0, x1, off = nose * .24, tail * .92, bw * 1.8
        wings.append([[x0, -off * .62], [x0 - ln * .04, -off], [x1, -off], [x1, -off * .66], [x1 + ln * .06, -off * .5], [x0, -bw * .72]])
    elif form == "slab":
        x0, x1, off = nose * .6, tail * .93, bw * 1.47
        wings.append([[x0, -bw * .9], [x0, -off], [x1, -off], [x1, -bw * .9]])
    elif form == "trident":
        root, span = nose * .22, bw * 2.1
        wings.append([[root + ln * .16, -bw * .6], [root + ln * .22, -span * .8], [root + ln * .06, -span], [root - ln * .14, -span * .7], [root - ln * .06, -bw * .8]])
    elif form == "swept":
        root, chord, span = tail * .35, ln * .2, bw * 2.0 + 2.5
        sweep = -chord * .7
        wings.append([[root + chord * .5, -bw * .82], [root + chord * .5 + sweep * .5, -span * .6], [root + chord * .12 + sweep, -span],
                      [root - chord * .5 + sweep, -span * .9], [root - chord * .7 + sweep * .45, -span * .5], [root - chord * .55, -bw * .88]])
    nacs = []
    eng = []
    if form in ("swept", "delta", "xwing", "twin"):
        nl, nr = ln * .3, bw * .26 + 1
        nacs.append({"x": tail + nl * .6, "y": bw * .9 + nr * .8, "l": nl, "r": nr})
        eng.append({"x": tail + nl * .1, "y": -(bw * .9 + nr * .8), "r": nr * .92})
        eng.append({"x": tail + nl * .1, "y": bw * .9 + nr * .8, "r": nr * .92})
    elif form == "disc":
        eng.append({"x": tail, "y": 0, "r": max(2, tailw * .9)})
    else:
        eng.append({"x": tail, "y": -tailw * .42, "r": tailw * .42})
        eng.append({"x": tail, "y": tailw * .42, "r": tailw * .42})
    col = rgb(colhex)
    h = {"len": round(ln, 2), "nose": nose, "tail": tail, "bw": bw, "tailW": round(tailw, 2), "form": form, "hcls": cls,
         "prof": prof, "wings": [[[round(a, 2), round(b, 2)] for a, b in w] for w in wings], "nacs": nacs, "eng": eng,
         "col": col, "lite": mix(col, [255, 255, 255], .42), "dark": mix(col, [6, 10, 17], .62), "edge": mix(col, [10, 16, 26], .5),
         "steel": [118, 124, 132], "iron": [52, 55, 62], "radm": [26, 29, 34], "cer": [196, 192, 182], "foil": [176, 148, 86],
         "stripe": {"a": .3}, "mark": {"cont": 1} if cont else {}, "lux": False, "yac": cls == "yacht"}
    return h


def main():
    a = sys.argv[1:]
    form = a[0] if a else "swept"
    cls = a[1] if len(a) > 1 else {"delta": "warship", "slab": "hauler", "boxed": "miner", "disc": "survey", "twin": "hauler",
                                   "xwing": "scout", "trident": "courier"}.get(form, "scout")
    colhex = a[2] if len(a) > 2 else COL[cls]
    hour = a[3] if len(a) > 3 else ".30"
    import json
    h = json.dumps(hull(form, cls, colhex))
    base = open(os.path.join(shots(), "g_w_terran_1_pad.js"), encoding="utf-8").read().replace("ph=.30", "ph=" + hour)
    mark = "PLN.on=true;PLN.rush=true;"
    ovr = ("var PLN_SHIP_H=" + h + ";plnShipHull=function(){return PLN_SHIP_H;};"
           "landerLen=function(){return clamp(PLN_SHIP_H.len*2.2,90,130);};PLN_SHIP.key='';\n")
    name = "g_ship_%s_%s.js" % (form, cls)
    with open(os.path.join(shots(), name), "w", encoding="utf-8", newline="\n") as f:
        f.write(base.replace(mark, ovr + mark))
    print(name)


if __name__ == "__main__":
    main()
