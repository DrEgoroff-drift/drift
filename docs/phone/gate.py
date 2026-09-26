import os, json, re, subprocess, sys, time, urllib.request
# gate.py name seconds — the P1 phone gate on a LOCAL copy (http://127.0.0.1:{PORT}/<name>.html via adb reverse; the
# author's save and the live site are untouched). Starts an easy game, pins the resolution at DPR 1.5 (the gate's
# condition), keeps the ship flying (thrust 1 s on / 1 s off, a 0.5 s left turn every 4 s), skips 3 s of warm-up,
# then records EVERY rAF interval for <seconds>. Prints 10-s windows and the verdict: share of frames <= 18 ms
# ("on 16.7" with vsync jitter; the gate wants >= 95 %), frames >= 50 ms (the gate wants 0), p50/p95/p99/max.
# Logs battery temperature and thermal status before/after. Refuses a locked, sleeping or in-call phone.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from phcommon import PORT, OUT
import cdp
sys.stdout.reconfigure(encoding='utf-8')
A = r'C:\Android\platform-tools\adb.exe'
S = OUT
name = sys.argv[1]; DUR = int(sys.argv[2]) if len(sys.argv) > 2 else 30
# host: another site = an empty WebGPU shader cache (Chrome keeps compiled pipelines per site, 25.09: the same build hitched
# 67/50 ms on its first run and ran clean on the second). A cold run takes a fresh name: cold1.localhost, cold2.localhost …
HOST = sys.argv[3] if len(sys.argv) > 3 else '127.0.0.1'
# ROUTE=hotel|star (env): instead of the thrust/turn driver the ship is carried round a circle at flight speed — 350
# around the hotel (the station when there is none) in 10 s, or 700 around the star in 20 s — with the engine on 1 s /
# off 1 s; ZOOM=z also pins the camera (.3 = far out). The author 26.09: «полетай у гостиницы, где много объектов, и
# туманности где много … и мимо звезды и отдали камеру». The route and its centre go into the JSON as 'route'.
ROUTE = os.environ.get('ROUTE', ''); ZOOM = float(os.environ.get('ZOOM', '0') or 0)
assert ROUTE in ('', 'hotel', 'star'), 'ROUTE is hotel or star'
DRV = ('let n=0;window.__drv=setInterval(()=>{n++;if(G.mode!=="system"){keys.thrust=false;keys.left=false;return}'
       'keys.thrust=(n%8)<4;keys.left=(n%16)<2;},250);') if not ROUTE else (
    'const ROUTE="%ROUTE%",Z=%ZOOM%,sy=G.sys||{},st=sy.star||{x:0,y:0};'
    'const hh=ROUTE==="hotel"&&typeof hotelHere==="function"&&hotelHere(),P0=ROUTE==="hotel"?(hh||sy.station||st):st;'
    'const RR=ROUTE==="hotel"?350:700,W2=2*Math.PI/(ROUTE==="hotel"?10:20),t0=performance.now();'
    'window.__route=[ROUTE,Z,hh?"hotel":ROUTE==="hotel"&&sy.station?"station":"star",Math.round(P0.x),Math.round(P0.y)];'
    'const pup=()=>{if(window.__drvOff||(window.__g&&window.__g.done))return;if(G.mode==="system"){if(Z)G.zoomT=Z;'
    'const tt=performance.now()-t0,a=tt/1000*W2,s=G.ship;s.x=P0.x+RR*Math.cos(a);s.y=P0.y+RR*Math.sin(a);'
    's.vx=-RR*W2*Math.sin(a);s.vy=RR*W2*Math.cos(a);s.a=a+Math.PI/2;keys.thrust=(tt%2000)<1000;keys.left=false;}'
    'requestAnimationFrame(pup);};requestAnimationFrame(pup);'
).replace('%ROUTE%', ROUTE).replace('%ZOOM%', repr(ZOOM))

def adb(*a, dev=None):
    r = subprocess.run([A] + (['-s', dev] if dev else []) + list(a), capture_output=True, timeout=90)
    return r.stdout.decode('utf-8', 'replace')

def device():
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
adb('reverse', f'tcp:{PORT}', f'tcp:{PORT}', dev=D)
adb('forward', 'tcp:9333', 'localabstract:chrome_devtools_remote', dev=D)

def heat():
    b = re.search(r'temperature: (\d+)', adb('shell', 'dumpsys battery', dev=D))
    t = re.search(r'Thermal Status: (\d+)', adb('shell', 'dumpsys thermalservice', dev=D))
    p = re.findall(r'(AC|USB|Wireless) powered: true', adb('shell', 'dumpsys battery', dev=D))
    return 'battery %s °C, thermal status %s, %s' % (int(b.group(1)) / 10 if b else '?', t.group(1) if t else '?',
                                                    ('charging ' + '+'.join(p)) if p else 'on battery')

def pages():   # None = DevTools unreachable (forward or Wi-Fi), [] = no pages; an attached page loses its ws url in /json, keep it
    try:
        return [t for t in json.load(urllib.request.urlopen('http://127.0.0.1:9333/json', timeout=5)) if t.get('type') == 'page']
    except Exception:
        return None

def ev(t, js):
    try:
        ws = cdp.WS(t.get('webSocketDebuggerUrl') or f"ws://127.0.0.1:9333/devtools/page/{t['id']}")
        try:
            return cdp.evaluate(ws, js)
        finally:
            ws.s.close()
    except Exception as e:
        return 'ERR ' + str(e)[:120]

def gpuclk():   # the thermal cap is the whole story on a hot phone: 295 of 719 MHz at thermal status 2 (25.09)
    r = adb('shell', 'cd /sys/class/kgsl/kgsl-3d0; echo $(cat devfreq/cur_freq) $(cat devfreq/max_freq) $(cat gpu_busy_percentage)', dev=D).split()
    try:
        return f'GPU {int(r[0])//1000000}/{int(r[1])//1000000} MHz busy {r[2]}%'
    except Exception:
        return 'GPU ?'

def memav():
    m = re.search(r'MemAvailable:\s+(\d+)', adb('shell', 'cat /proc/meminfo', dev=D))
    return int(m.group(1)) // 1024 if m else -1

print('before:', heat(), '·', gpuclk(), '· MemAvailable', memav(), 'MB', flush=True)
url = f'http://{HOST}:{PORT}/{name}.html'
for t in pages() or []:   # leftovers of earlier runs: one tab of this build only, or the poll binds to the wrong one
    if f'/{name}.html' in t.get('url', ''):
        urllib.request.urlopen('http://127.0.0.1:9333/json/close/' + t['id'], timeout=5).read(); print('closed leftover tab')
def touches(since, until='99'):   # screen touches logged by the power manager in [since, until) ("MM-DD HH:MM:SS"); a touched run is void
    ls = [l for l in adb('shell', "logcat -d -v time | grep 'userActivityFromNative : touch'", dev=D).splitlines() if since <= l[:18] < until]
    return len(ls), (ls[0][:18] if ls else ''), (ls[-1][:18] if ls else '')
import datetime
def pnow():   # the phone's own clock (logcat prints it), not the PC's: the two may sit in different zones
    return datetime.datetime.strptime(adb('shell', 'date +"%Y-%m-%d %H:%M:%S"', dev=D).strip(), '%Y-%m-%d %H:%M:%S')
def pfmt(t):
    return t.strftime('%m-%d %H:%M:%S')

T0 = adb('shell', 'date +"%m-%d %H:%M:%S"', dev=D).strip()
n, a, b = touches('00')
print('phone clock', T0, '· last touch before the run', b or 'none in the log', flush=True)
before = {t['id'] for t in pages() or []}   # /json/new answers 500 on this Chrome: open by intent, bind to the tab that appears
adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', f"'{url}'", 'com.android.chrome', dev=D)
TID = None
for _ in range(20):
    time.sleep(1)
    TID = next((t['id'] for t in pages() or [] if t['id'] not in before and f'/{name}.html' in t.get('url', '')), None)
    if TID:
        break
if not TID:
    print('NO NEW TAB APPEARED'); sys.exit(3)
print('own tab', TID, flush=True)
START = ('(()=>{if(document.readyState!=="complete"||typeof G==="undefined")return "loading";'
         'if(G.running)return "running "+G.mode;const b=document.getElementById("startEasy");'
         'if(b){b.click();return "clicked startEasy"}return "no start button"})()')
REC = '''(()=>{if(window.__g)return "already";
try{navigator.wakeLock.request("screen").then(l=>window.__wl=l).catch(()=>{})}catch(e){}
RES_AUTO=1.5;PHONE_DPR=1.5;resFresh=1e9;resize();
%DRV%
const R=window.__g={dts:[],win:[],done:false,off:0,hit:[],lt:[],tch:0};
for(const k of ["touchstart","touchmove","pointerdown"])addEventListener(k,()=>R.tch++,{capture:true,passive:true});const DUR=%DUR%*1000,WARM=3000;
const C={pipe:0,tex:0,wt:0,cx:0,wb:0,by:0,tl:[]};const d=GPU.dev,q=d.queue;R.live=0;R.mips=[];R.tx=[];const t00=performance.now();
const wrap=(o,k,fn)=>{const f0=o[k].bind(o);o[k]=(...a)=>{fn(a);return f0(...a);};};
/* who(s,n): n stack frames from s, "fn < caller < ..."; an anonymous frame shows as @line:col of the one-file page */
const who=(s,n)=>(new Error().stack||"").split("\\n").slice(s,s+(n||2)).map(x=>x.trim().replace(/^at /,"").replace(/ \\(.*$/,"").replace(/^.*\\.html:/,"@")).join(" < ");
const log=s=>{C.tl.push(s);if(R.tx.length<400)R.tx.push([Math.round(performance.now()-t00-WARM),s]);};
/* pipelines and shader modules: a first-use compile stalls the GPU process, not this thread */
wrap(d,"createRenderPipeline",a=>{C.pipe++;const o=a[0]||{},t=((o.fragment||{}).targets||[])[0]||{},ms=((o.multisample||{}).count|0);
 log("RP "+(o.label||"")+" "+(t.format||"-")+(t.blend?" blend "+t.blend.color.srcFactor+"/"+t.blend.color.dstFactor:"")+(ms>1?" ms"+ms:"")+(o.depthStencil?" "+o.depthStencil.format:"")+" · "+who(4,3));});
if(d.createRenderPipelineAsync)wrap(d,"createRenderPipelineAsync",a=>log("RPasync "+((a[0]||{}).label||"")+" · "+who(4,3)));
wrap(d,"createComputePipeline",a=>{C.pipe++;log("CP "+((a[0]||{}).label||"")+" · "+who(4,3));});
wrap(d,"createShaderModule",a=>log("SM "+(((a[0]||{}).code||"").length)+" ch · "+who(4,3)));
/* every texture: size, format, MSAA, mips and three game frames above the wrapper (Error, who, this fn, the wrapper = 0..3) */
wrap(d,"createTexture",a=>{C.tex++;R.live++;const o=a[0]||{},z=o.size;
 log((Array.isArray(z)?z.join("x"):z?[z.width,z.height||1,z.depthOrArrayLayers||1].join("x"):"?")+" "+o.format+((o.sampleCount|0)>1?" ms"+o.sampleCount:"")+((o.mipLevelCount|0)>1?" m"+o.mipLevelCount:"")+" · "+who(4,3));});
/* GPU latency per frame: from the end of this frame's JS to onSubmittedWorkDone — queue depth + GPU time */
R.gd=[];
wrap(q,"writeTexture",a=>{C.wt++;C.by+=(a[1]&&a[1].byteLength)|0;});wrap(q,"copyExternalImageToTexture",a=>{C.cx++;const s=a[0]&&a[0].source;C.by+=s?(s.width*s.height*4)|0:0;});
wrap(q,"writeBuffer",a=>{C.wb++;});
{const M0=gpuMipTex;gpuMipTex=function(cv){const e=GPU_MIP.get(cv);if(e&&e.dev===GPU.dev)return e;const t=performance.now();const r=M0(cv);
  R.mips.push([Math.round(t-start-WARM),+(performance.now()-t).toFixed(1),cv.width+"x"+cv.height,who(3)]);return r;};}
{const td=GPUTexture.prototype.destroy;GPUTexture.prototype.destroy=function(){R.live--;return td.call(this);};}
try{new PerformanceObserver(l=>{for(const e of l.getEntries())R.lt.push([Math.round(e.startTime-start-WARM),Math.round(e.duration)]);}).observe({type:"longtask",buffered:false});}catch(e){}
let ng=GNB.nGen|0;
let last=performance.now(),start=last,ws=start+WARM,wn=0,w18=0,w33=0,w50=0,wmax=0;
/* the game's frame() runs before this callback in the same rAF, so `cur` is this frame's work and P the frame
   before the long gap — the one that caused it; both go into the hitch record */
let P=[0,0,0,0,0,0,0],PT=[],wjs=0;const hp=()=>performance.memory?Math.round(performance.memory.usedJSHeapSize/104857.6)/10:-1;let hPrev=hp();
const f=now=>{const dt=now-last;last=now;const g=GNB.nGen|0;const js=+FRAME_JS||0,h=hp();
const cur=[Math.round(js),C.pipe,C.tex,C.wt,C.cx,Math.round(C.by/1024),g-ng];
if(now>=start+WARM&&now<start+WARM+DUR){R.dts.push(Math.round(dt*100)/100);if(G.mode!=="system")R.off++;
{const ts=performance.now(),tt=Math.round(now-start-WARM);q.onSubmittedWorkDone().then(()=>R.gd.push([tt,Math.round(performance.now()-ts)]));}
if(dt>=33)R.hit.push([Math.round(now-start-WARM),Math.round(dt),P.join("/"),cur.join("/"),+(h-hPrev).toFixed(1),Math.round(G.ship.x),Math.round(G.ship.y),PT.slice(0,16),C.tl.slice(0,16)]);
wn++;if(dt<=18)w18++;if(dt>=33)w33++;if(dt>=50)w50++;if(dt>wmax)wmax=dt;if(js>wjs)wjs=js;
if(now-ws>=10000){R.win.push([Math.round((now-start-WARM)/1000),wn,w18,w33,w50,Math.round(wmax),cvs.width+"x"+cvs.height,DPR,+resEma.toFixed(1),R.live,performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):-1,R.tch,Math.round(wjs)]);ws=now;wn=w18=w33=w50=0;wmax=0;wjs=0;}}
P=cur;PT=C.tl;C.tl=[];hPrev=h;C.pipe=C.tex=C.wt=C.cx=C.wb=C.by=0;ng=g;
if(now<start+WARM+DUR)requestAnimationFrame(f);else R.done=true;};
requestAnimationFrame(f);return "recording "+cvs.width+"x"+cvs.height+" DPR "+DPR})()'''.replace('%DUR%', str(DUR)).replace('%DRV%', DRV)
STOP = ('(()=>{clearInterval(window.__drv);window.__drvOff=1;keys.thrust=false;keys.left=false;RES_AUTO=RES_AUTO;resFresh=0;'
        'try{window.__wl&&window.__wl.release()}catch(e){}return "stopped"})()')
GET = ('(()=>JSON.stringify({done:window.__g&&window.__g.done,n:window.__g?window.__g.dts.length:0,'
       'win:window.__g?window.__g.win:[],hidden:document.hidden,mode:G.mode,off:window.__g?window.__g.off:0}))()')
t0 = time.time(); rec = False; me = None; seen = 0; done = False; tmem = 0; miss = 0
while time.time() - t0 < DUR + 120:
    time.sleep(3)
    ps = pages()
    if ps is None:
        print(f'{time.time()-t0:4.0f}s DevTools unreachable — re-forwarding', flush=True)
        adb('forward', 'tcp:9333', 'localabstract:chrome_devtools_remote', dev=D); continue
    me = next((t for t in ps if t.get('id') == TID), None)
    if not me:
        miss += 1
        print(f'{time.time()-t0:4.0f}s own tab not in the list ({len(ps)} pages, miss {miss})', flush=True)
        if miss >= 3:
            print('TAB GONE'); print(adb('shell', "logcat -d -v time -t 300 | grep -v 'VRI\\[' | grep -iE 'chrome.*(sandboxed|privileged)|has died|lmkd|cr_Tab' | tail -n 12", dev=D)); break
        continue
    miss = 0
    if rec and time.time() - tmem >= 15:
        tmem = time.time(); print(f'{time.time()-t0:4.0f}s MemAvailable {memav()} MB · {gpuclk()} · {heat()}', flush=True)
    if not rec:
        s = ev(me, START); print(f'{time.time()-t0:4.0f}s start:', s, flush=True)
        if isinstance(s, str) and s.startswith('running'):
            print(f'{time.time()-t0:4.0f}s', ev(me, REC), flush=True); rec = True; TR = pnow()
        continue
    try:
        j = json.loads(ev(me, GET))
    except Exception as e:
        print('ERR', e); continue
    for r in j['win'][seen:]:
        print('  t=%3ds frames %4d  <=18ms %4d  >=33ms %3d  >=50ms %2d  max %4dms  %s DPR %s resEma %5.1f  tex+ %d  heap %d MB  page touches %d  js max %d ms' % tuple(r), flush=True)
    seen = len(j['win'])
    if j.get('hidden'):
        print('HIDDEN — the tab went to background, the numbers stop being true'); break
    if j.get('done'):
        done = True; break
dts = []
if me and done:
    dts = json.loads(ev(me, '(()=>JSON.stringify(window.__g.dts))()'))
if me:
    print('stop:', ev(me, STOP), flush=True)
print('after:', heat(), '· MemAvailable', memav(), 'MB', flush=True)
if rec:   # only the recorded span counts: REC start + 3 s warm-up … + DUR. The phone clock is read ~1 s after REC started,
          # so the span is about [TR+2, TR+2+DUR]; 2 s of slack on each side
    w0, w1 = pfmt(TR), pfmt(TR + datetime.timedelta(seconds=DUR + 4))
    n, a, b = touches(w0, w1); nall = touches(T0)[0]
    print(f'TOUCHES in the recorded span {w0} … {w1}: {n}' + (f' (first {a}, last {b}) — RUN VOID, someone handled the phone' if n else ' — clean')
          + f' · outside it since launch: {nall - n}', flush=True)
else:
    n, a, b = touches(T0)
    print('TOUCHES since launch (nothing was recorded): %d' % n, flush=True)
if dts:
    s = sorted(dts); n = len(s); q = lambda p: s[min(n - 1, int(p * n))]
    ok18 = sum(1 for x in dts if x <= 18); b50 = sum(1 for x in dts if x >= 50); b33 = sum(1 for x in dts if x >= 33)
    print('VERDICT %ds: frames %d (%.1f fps) · <=18ms %.2f%% · >=33ms %d · >=50ms %d · p50 %.1f p95 %.1f p99 %.1f max %.1f ms'
          % (DUR, n, n / DUR, 100 * ok18 / n, b33, b50, q(.5), q(.95), q(.99), s[-1]))
    print('GATE:', 'PASS' if ok18 / n >= .95 and b50 == 0 else 'FAIL', '(>=95 % at 16.7 ms and no 50 ms frame)')
    ex = json.loads(ev(me, '(()=>JSON.stringify({hit:window.__g.hit,lt:window.__g.lt,mips:window.__g.mips,tx:window.__g.tx,gd:window.__g.gd,route:window.__route?window.__route.concat([+(G.zoom||0).toFixed(2)]):null}))()'))
    gd = ex.get('gd') or []
    if gd:
        gl = sorted(x[1] for x in gd)
        print('GPU latency (frame JS end -> onSubmittedWorkDone) ms: p50 %d p95 %d p99 %d max %d over %d frames'
              % (gl[len(gl) // 2], gl[int(.95 * len(gl))], gl[int(.99 * len(gl))], gl[-1], len(gl)))
    for h in ex['hit'][:12]:
        print('   around the hitch at %d ms: [frame t, GPU latency]' % h[0], [x for x in gd if h[0] - 260 <= x[0] <= h[0] + 40])
    print('first-use mip masters [t ms, build ms, size, caller]:')
    for m in ex['mips'][:30]:
        print('  ', m)
    print('hitches >=33 ms: [t ms, dt, frame before the gap "js ms/pipelines/textures/writeTexture/copyExternal/KB/nebula", this frame same, heap Δ MB, ship x, y]')
    for h in ex['hit'][:40]:
        print('  ', h[:7])
        for k, lab in ((7, 'before'), (8, 'this  ')):
            for s in (h[k] if len(h) > k else []):
                print('        tex %s: %s' % (lab, s))
    print('long tasks [t ms, ms]:', ex['lt'][:40])
    if ex.get('route'):
        print('route [name, zoom asked, centre, x, y, zoom at the end]:', ex['route'])
    tx = ex.get('tx') or []; agg = {}
    for t, s in tx:
        if t >= 0:
            c = agg.setdefault(s, [0, t]); c[0] += 1
    print('textures created: %d in the warm-up, %d in the recorded span; by kind [count × first t ms]:'
          % (sum(1 for t in tx if t[0] < 0), sum(1 for t in tx if t[0] >= 0)))
    for s, (c, t) in sorted(agg.items(), key=lambda kv: kv[1][1])[:60]:
        print('   %3d × %6d  %s' % (c, t, s))
    json.dump({'dur': DUR, 'dts': dts, **ex}, open(S + f'/gate_{name}_{DUR}.json', 'w'))
if me:
    try:
        urllib.request.urlopen('http://127.0.0.1:9333/json/close/' + me['id'], timeout=5).read(); print('closed own tab')
    except Exception as e:
        print('tab close failed', e)
