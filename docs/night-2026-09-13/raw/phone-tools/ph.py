"""Real-phone helper: adb screencap, downscaled. usage: ph.py shot OUT.png [SCALE] [crop x0 y0 x1 y1 in CSS px]"""
import io, subprocess, sys
from PIL import Image

ADB = r"C:\Android\platform-tools\adb.exe"
DPR = 2.625

def shot(out, scale=0.4, crop=None):
    png = subprocess.run([ADB, "exec-out", "screencap", "-p"], capture_output=True).stdout
    im = Image.open(io.BytesIO(png)).convert("RGB")
    if crop:
        # crop in screen px (physical), top offset included by caller
        im = im.crop(tuple(int(c) for c in crop))
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    im.save(out)
    print("saved", out, im.size)

if __name__ == "__main__":
    if sys.argv[1] == "shot":
        sc = float(sys.argv[3]) if len(sys.argv) > 3 else 0.4
        cr = sys.argv[4:8] if len(sys.argv) > 7 else None
        shot(sys.argv[2], sc, cr)
