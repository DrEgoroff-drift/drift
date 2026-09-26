"""phtrace.py name seconds — a Chrome trace of the gate flight on the S23 (LOCAL copy through adb reverse, same
safety as gate.py: refuses a locked/asleep/in-call phone, own tab, closed after). Same start and driver as gate.py,
then Tracing for <seconds> with the main-thread, compositor, GPU-process, Skia and Dawn categories. Saves
phtrace_<name>.json; the analysis is phtran.py."""
import json, os, re, subprocess, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from phcommon import PORT, OUT
import cdp
sys.stdout.reconfigure(encoding='utf-8')
A = r'C:\Android\platform-tools\adb.exe'
S = OUT
name = sys.argv[1]; SECS = float(sys.argv[2]) if len(sys.argv) > 2 else 22
from phcommon import device
D = device()
if not D:
    print('PHONE NOT FOUND'); sys.exit(1)
def adb(*a):
    return subprocess.run([A, '-s', D] + list(a), capture_output=True, timeout=90).stdout.decode('utf-8', 'replace')
st = adb('shell', 'dumpsys power | grep -m1 mWakefulness=; dumpsys window | grep -m1 mCurrentFocus').replace('\r', '').strip().replace('\n', ' | ')
print('phone', st, flush=True)
if 'Awake' not in st or any(k in st for k in ('Keyguard', 'NotificationShade', 'Bouncer', 'InCall')):
    print('PHONE LOCKED / ASLEEP / IN A CALL — not starting'); sys.exit(2)
adb('reverse', f'tcp:{PORT}', f'tcp:{PORT}'); adb('forward', 'tcp:9333', 'localabstract:chrome_devtools_remote')
def pages():
    try:
        return [t for t in json.load(urllib.request.urlopen('http://127.0.0.1:9333/json', timeout=5)) if t.get('type') == 'page']
    except Exception:
        return []
url = f'http://127.0.0.1:{PORT}/{name}.html'
for t in pages():
    if f'/{name}.html' in t.get('url', ''):
        urllib.request.urlopen('http://127.0.0.1:9333/json/close/' + t['id'], timeout=5).read()
before = {t['id'] for t in pages()}
adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', f"'{url}'", 'com.android.chrome')
TID = None
for _ in range(20):
    time.sleep(1)
    TID = next((t['id'] for t in pages() if t['id'] not in before and f'/{name}.html' in t.get('url', '')), None)
    if TID:
        break
if not TID:
    print('NO NEW TAB'); sys.exit(3)
ws = cdp.WS(f'ws://127.0.0.1:9333/devtools/page/{TID}')
ws.s.settimeout(180)
START = ('(()=>{if(document.readyState!=="complete"||typeof G==="undefined")return "loading";'
         'if(G.running)return "running "+G.mode;const b=document.getElementById("startEasy");'
         'if(b){b.click();return "clicked startEasy"}return "no start button"})()')
for _ in range(40):
    time.sleep(1)
    s = cdp.evaluate(ws, START)
    if isinstance(s, str) and s.startswith('running'):
        break
print('start:', s, flush=True)
DRV = ('(()=>{try{navigator.wakeLock.request("screen").then(l=>window.__wl=l).catch(()=>{})}catch(e){}'
       'RES_AUTO=1.5;PHONE_DPR=1.5;resFresh=1e9;resize();let n=0;window.__drv=setInterval(()=>{n++;'
       'if(G.mode!=="system"){keys.thrust=false;keys.left=false;return}keys.thrust=(n%8)<4;keys.left=(n%16)<2;},250);'
       'const T=window.__trk=[];const t0=performance.now();const f=now=>{T.push([+now.toFixed(1),+(+FRAME_JS||0).toFixed(1),'
       'Math.round(G.ship.x),Math.round(G.ship.y)]);if(now-t0<%MS%)requestAnimationFrame(f)};requestAnimationFrame(f);return "driving"})()'
       ).replace('%MS%', str(int(SECS * 1000 + 3500)))   # never % formatting: the JS has its own % (n%8)
print(cdp.evaluate(ws, DRV), flush=True)
time.sleep(3)   # the same warm-up as the gate
cats = ['toplevel', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame',
        'v8.execute', 'blink', 'cc', 'viz', 'gpu', 'gpu.service', 'disabled-by-default-gpu.service', 'skia',
        'disabled-by-default-skia', 'disabled-by-default-skia.gpu', 'gpu.dawn', 'disabled-by-default-gpu.dawn', 'gpu.angle']
ws.call('Tracing.start', transferMode='ReturnAsStream', traceConfig={'includedCategories': cats, 'recordMode': 'recordContinuously'})
print('tracing', SECS, 's', flush=True)
time.sleep(SECS)
ws.id += 1
ws.send(json.dumps({'id': ws.id, 'method': 'Tracing.end'}))
stream = None
while stream is None:
    m = json.loads(ws.recv())
    if m.get('method') == 'Tracing.tracingComplete':
        stream = m['params']['stream']
chunks = []
while True:
    r = ws.call('IO.read', handle=stream, size=1 << 20)
    chunks.append(r.get('data', ''))
    if r.get('eof'):
        break
ws.call('IO.close', handle=stream)
out = os.path.join(S, f'phtrace_{name}.json')
open(out, 'w', encoding='utf-8').write(''.join(chunks))
trk = cdp.evaluate(ws, 'JSON.stringify({trk:window.__trk,origin:performance.timeOrigin})')
open(out.replace('.json', '-trk.json'), 'w').write(trk)
cdp.evaluate(ws, '(()=>{clearInterval(window.__drv);keys.thrust=false;keys.left=false;try{window.__wl&&window.__wl.release()}catch(e){}})()')
ws.s.close()
urllib.request.urlopen('http://127.0.0.1:9333/json/close/' + TID, timeout=5).read()
print('saved', out, sum(len(c) for c in chunks) // 1024, 'KB · tab closed')
