import os, json, re, subprocess, sys, time, urllib.request
# deep.py name [query] — the phone-side ?g11=deep run on a LOCAL copy: http://127.0.0.1:{PORT}/<name>.html through adb
# reverse (served by the scratchpad http.server from ab/), so the author's save and the live site are untouched.
# Starts an easy game, keeps the ship moving (thrust 1 s on / 1 s off, a 0.5 s left turn every 4 s — driven inside
# the page, the probe needs a moving camera), waits for «ГОТОВО», saves window.G11_DEEP to deep_<name>.json, a screen
# to deep_<name>.png, closes its own tab. Also reads (only reads) the author's live tab settings if one is open.
# Never starts on a locked, sleeping or in-call phone: the author hands the phone over by saying so.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from phcommon import PORT, OUT
import cdp
sys.stdout.reconfigure(encoding='utf-8')
A = r'C:\Android\platform-tools\adb.exe'
S = OUT
name = sys.argv[1]; q = sys.argv[2] if len(sys.argv) > 2 else 'g11=deep'

def adb(*a, dev=None, raw=False):
    r = subprocess.run([A] + (['-s', dev] if dev else []) + list(a), capture_output=True, timeout=90)
    return r.stdout if raw else r.stdout.decode('utf-8', 'replace')

def device():
    # the S23 is already paired by the author; the Wi-Fi port changes, so find it by mdns and by model
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

D = device()
if not D:
    print('PHONE NOT FOUND (wireless debugging off or phone off the Wi-Fi)'); sys.exit(1)
st = adb('shell', 'dumpsys power | grep -m1 mWakefulness=; dumpsys window | grep -m1 mCurrentFocus', dev=D)
st = st.replace('\r', '').strip().replace('\n', ' | ')
print('phone', D, '·', st, flush=True)
if 'Awake' not in st or any(k in st for k in ('Keyguard', 'NotificationShade', 'Bouncer', 'InCall')):
    print('PHONE LOCKED / ASLEEP / IN A CALL — not starting'); sys.exit(2)
if not any(k in st for k in ('launcher', 'com.android.chrome')):
    print('PHONE IN USE (another app in front) — not starting'); sys.exit(3)
adb('reverse', f'tcp:{PORT}', f'tcp:{PORT}', dev=D)
adb('forward', 'tcp:9333', 'localabstract:chrome_devtools_remote', dev=D)

def pages():
    try:
        return [t for t in json.load(urllib.request.urlopen('http://127.0.0.1:9333/json', timeout=5))
                if t.get('type') == 'page' and t.get('webSocketDebuggerUrl')]
    except Exception:
        return []

def ev(t, js):
    try:
        ws = cdp.WS(t['webSocketDebuggerUrl'])
        try:
            return cdp.evaluate(ws, js)
        finally:
            ws.s.close()
    except Exception as e:
        return 'ERR ' + str(e)[:120]

# the author's own live tab, if open: read the resolution settings, write nothing
LIVE = ('(()=>{try{return JSON.stringify({ver:VER,res:G.opts&&G.opts.gfx&&G.opts.gfx.res,DPR:typeof DPR!=="undefined"?DPR:"?",'
        'dpr:devicePixelRatio,cvs:cvs.width+"x"+cvs.height,RES_AUTO:typeof RES_AUTO!=="undefined"?RES_AUTO:"?",'
        'mode:G.mode,hidden:document.hidden})}catch(e){return "ERR "+e.message}})()')
for t in pages():
    if 'drift-game.ru' in t.get('url', ''):
        print('live tab', t['url'][:60], ev(t, LIVE), flush=True)

url = f'http://127.0.0.1:{PORT}/{name}.html?{q}'
adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', f"'{url}'", 'com.android.chrome', dev=D)

START = ('(()=>{if(document.readyState!=="complete"||typeof G==="undefined")return "loading";'
         'if(G.running)return "running "+G.mode;const b=document.getElementById("startEasy");'
         'if(b){b.click();return "clicked startEasy"}return "no start button"})()')
# the page's own screen wake lock keeps the phone from dimming mid-run (no system setting is touched)
DRIVE = ('(()=>{if(window.__drv)return "driving already";let n=0;'
         'try{navigator.wakeLock.request("screen").then(l=>window.__wl=l).catch(()=>{})}catch(e){}'
         'window.__drv=setInterval(()=>{n++;'
         'if(G.mode!=="system"){keys.thrust=false;keys.left=false;return}'
         'keys.thrust=(n%8)<4;keys.left=(n%4)<2;'   # a tight circle: the place (nebula density) stays the same across a pair
         'if(n>960){clearInterval(window.__drv);keys.thrust=false;keys.left=false}},250);return "driving"})()')
STOP = ('(()=>{clearInterval(window.__drv);keys.thrust=false;keys.left=false;'
        'try{window.__wl&&window.__wl.release()}catch(e){}return "stopped"})()')
BOX = ("(()=>{const d=[...document.querySelectorAll('div')].find(d=>(d.textContent||'').startsWith('G11'));"
       "return JSON.stringify({box:d?d.textContent:'(no box)',deep:window.G11_DEEP||null,mode:G.mode,"
       "ship:[Math.round(G.ship.x),Math.round(G.ship.y)],hidden:document.hidden})})()")

t0 = time.time(); last = ''; driving = False; me = None; out = None
while time.time() - t0 < 300:
    time.sleep(3)
    me = next((t for t in pages() if f'/{name}.html' in t.get('url', '')), None)
    if not me:
        continue
    if not driving:
        s = ev(me, START); print(f'{time.time()-t0:4.0f}s start:', s, flush=True)
        if isinstance(s, str) and s.startswith('running'):
            print(f'{time.time()-t0:4.0f}s drive:', ev(me, DRIVE), flush=True); driving = True
        continue
    r = ev(me, BOX)
    try:
        j = json.loads(r)
    except Exception:
        print(f'{time.time()-t0:4.0f}s', r, flush=True); continue
    line = j['box'].split('\n')[-1][:150] + f" · {j['mode']} {j['ship']}" + (' HIDDEN' if j['hidden'] else '')
    if line != last:
        print(f'{time.time()-t0:4.0f}s', line, flush=True); last = line
    if j.get('deep'):
        out = j['deep']; break

if me:
    print('stop:', ev(me, STOP), flush=True)
if out:
    open(f'{S}\\deep_{name}.json', 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=1))
    print('SAVED deep_%s.json' % name)
    print(json.dumps(out, ensure_ascii=False)[:1500])
else:
    print('NO RESULT in 300 s')
open(f'{S}\\deep_{name}.png', 'wb').write(adb('exec-out', 'screencap', '-p', dev=D, raw=True))
if me:
    try:
        urllib.request.urlopen('http://127.0.0.1:9333/json/close/' + me['id'], timeout=5).read()
        print('closed own tab')
    except Exception as e:
        print('tab close failed', e)
