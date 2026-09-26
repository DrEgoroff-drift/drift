"""phcommon.py - shared by the phone gate tools in docs/phone/. Every tool takes two flags anywhere on its
command line (they are removed from sys.argv before the tool reads its own arguments):
  --port N    the http port of the LOCAL copy on this PC (python -m http.server N in the folder with <name>.html),
              forwarded to the phone by adb reverse. Required: two sessions on one phone must not share a port.
  --out DIR   where results go (default %TEMP%/drift-phone).
cdp.py comes from docs/night-2026-09-13/raw/phone-tools; adb from $ADB or C:/Android/platform-tools/adb.exe.
The phone is the author's S23 (SM-S918), found by mdns over Wi-Fi and by model. Take C:/Claude/phone.lock first."""
import os, re, subprocess, sys
H = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(H, '..', 'night-2026-09-13', 'raw', 'phone-tools'))
A = os.environ.get('ADB', r'C:\Android\platform-tools\adb.exe')


def _flag(k, dflt=None):
    if k in sys.argv:
        i = sys.argv.index(k); v = sys.argv[i + 1]; del sys.argv[i:i + 2]; return v
    return dflt


_p = _flag('--port')
if not _p:
    print('--port N is required (the local copy http port; 8812 and 8813 belong to different sessions)'); sys.exit(9)
PORT = int(_p)
OUT = os.path.abspath(_flag('--out', os.path.join(os.environ.get('TEMP', '.'), 'drift-phone')))
os.makedirs(OUT, exist_ok=True)


def adb(*a, dev=None):
    r = subprocess.run([A] + (['-s', dev] if dev else []) + list(a), capture_output=True, timeout=90)
    return r.stdout.decode('utf-8', 'replace')


def device():
    """the S23 is paired by the author; the Wi-Fi port changes, so find it by mdns and by model"""
    cands = [ln.split()[0] for ln in adb('devices').splitlines()[1:] if ln.strip().endswith('device')]
    for ln in adb('mdns', 'services').splitlines():
        m = re.search(r'_adb-tls-connect\._tcp\s+([\d.]+:\d+)', ln)
        if m and m.group(1) not in cands:
            if 'connected' in adb('connect', m.group(1)):
                cands.append(m.group(1))
    for d in cands:
        if adb('shell', 'getprop', 'ro.product.model', dev=d).strip().startswith('SM-S918'):
            return d
    return None
