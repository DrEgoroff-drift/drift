import os, json, re, subprocess, sys, time, urllib.request
# census.py name — what the 2D canvases draw per frame in flight, on the author's phone, LOCAL copy only
# (http://127.0.0.1:{PORT}/<name>.html through adb reverse). Same safety as deep.py: refuses a locked, sleeping,
# in-call or busy phone. Wraps CanvasRenderingContext2D draw calls for 4 s of flight and counts, per
# method + caller + state (shadow, filter, composite, gradient, dash): calls and bbox area in device px.
# Saves census_<name>.json, closes its own tab.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from phcommon import PORT, OUT
import cdp
sys.stdout.reconfigure(encoding='utf-8')
A = r'C:\Android\platform-tools\adb.exe'
S = OUT
name = sys.argv[1]

def adb(*a, dev=None, raw=False):
    r = subprocess.run([A] + (['-s', dev] if dev else []) + list(a), capture_output=True, timeout=90)
    return r.stdout if raw else r.stdout.decode('utf-8', 'replace')

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
    print('PHONE NOT FOUND'); sys.exit(1)
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

url = f'http://127.0.0.1:{PORT}/{name}.html'
adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', f"'{url}'", 'com.android.chrome', dev=D)

START = ('(()=>{if(document.readyState!=="complete"||typeof G==="undefined")return "loading";'
         'if(G.running)return "running "+G.mode;const b=document.getElementById("startEasy");'
         'if(b){b.click();return "clicked startEasy"}return "no start button"})()')
DRIVE = ('(()=>{if(window.__drv)return "driving already";let n=0;'
         'try{navigator.wakeLock.request("screen").then(l=>window.__wl=l).catch(()=>{})}catch(e){}'
         'window.__drv=setInterval(()=>{n++;'
         'if(G.mode!=="system"){keys.thrust=false;keys.left=false;return}'
         'keys.thrust=(n%8)<4;keys.left=(n%4)<2;'
         'if(n>240){clearInterval(window.__drv);keys.thrust=false;keys.left=false}},250);return "driving"})()')
# the census: wrap draw calls on every 2D context; key = canvas|method|caller<caller2|flags
CENSUS = r'''(()=>{if(window.__cen)return "census already";
const P=CanvasRenderingContext2D.prototype;const R=window.__cen={frames:0,by:{},on:true,calls:0};
const cname=c=>c===cvs?"c":(typeof GPU!=="undefined"&&c===GPU.ui)?"ui":("off"+c.width+"x"+c.height);
const who=(d)=>{d=d||4;const s=(new Error().stack||"").split("\n");const f=k=>{const m=(s[k]||"").match(/at (?:new )?([^\s(]+)/);return m?m[1]:"?"};return f(d)+"<"+f(d+1)};
const gk=(k)=>{const e=R.by[k]||(R.by[k]={n:0,area:0});e.n++;R.calls++};
const Q=GPUQueue.prototype;
for(const m of ["copyExternalImageToTexture","writeTexture","submit"]){const o=Q[m];Q[m]=function(...a){if(R.on){let ex="";
 if(m==="copyExternalImageToTexture"){const s=a[0].source,z=a[2];ex=" src"+(s===cvs?"#c":(typeof GPU!=="undefined"&&s===GPU.ui)?"ui":(s.width+"x"+s.height))+" sz"+(Array.isArray(z)?z.join("x"):(z.width+"x"+z.height))}
 else if(m==="writeTexture"){ex=" bytes"+(a[1].byteLength||0)}else{ex=" cmd"+a[0].length}
 gk("GPU|"+m+"|"+who(3)+"|"+ex)}return o.apply(this,a)}}
{const Dv=GPUDevice.prototype,o=Dv.createTexture;Dv.createTexture=function(...a){if(R.on)gk("GPU|createTexture|"+who(3)+"| "+JSON.stringify(a[0].size));return o.apply(this,a)}}
const bbReset=c=>{c.__bb=[1e9,1e9,-1e9,-1e9]};
const bbAdd=(c,x0,y0,x1,y1)=>{if(!c.__bb)bbReset(c);const b=c.__bb;if(x0<b[0])b[0]=x0;if(y0<b[1])b[1]=y0;if(x1>b[2])b[2]=x1;if(y1>b[3])b[3]=y1};
const wrapP=(m,f)=>{const o=P[m];if(!o)return;P[m]=function(...a){if(R.on)f(this,a);return o.apply(this,a)}};
wrapP("beginPath",c=>bbReset(c));
wrapP("moveTo",(c,a)=>bbAdd(c,a[0],a[1],a[0],a[1]));wrapP("lineTo",(c,a)=>bbAdd(c,a[0],a[1],a[0],a[1]));
wrapP("quadraticCurveTo",(c,a)=>{bbAdd(c,a[0],a[1],a[0],a[1]);bbAdd(c,a[2],a[3],a[2],a[3])});
wrapP("bezierCurveTo",(c,a)=>{bbAdd(c,a[0],a[1],a[0],a[1]);bbAdd(c,a[2],a[3],a[2],a[3]);bbAdd(c,a[4],a[5],a[4],a[5])});
wrapP("arc",(c,a)=>bbAdd(c,a[0]-a[2],a[1]-a[2],a[0]+a[2],a[1]+a[2]));
wrapP("ellipse",(c,a)=>{const r=Math.max(a[2],a[3]);bbAdd(c,a[0]-r,a[1]-r,a[0]+r,a[1]+r)});
wrapP("rect",(c,a)=>bbAdd(c,a[0],a[1],a[0]+a[2],a[1]+a[3]));
wrapP("roundRect",(c,a)=>bbAdd(c,a[0],a[1],a[0]+a[2],a[1]+a[3]));
const flags=c=>{let f="";if(c.shadowBlur>0&&c.shadowColor&&!/,\s*0\)$|transparent/.test(c.shadowColor))f+=" SHADOW"+Math.round(c.shadowBlur);
 if(c.filter&&c.filter!=="none")f+=" FILTER:"+c.filter;if(c.globalCompositeOperation!=="source-over")f+=" "+c.globalCompositeOperation;
 if(c.fillStyle instanceof CanvasGradient)f+=" gradF";if(c.strokeStyle instanceof CanvasGradient)f+=" gradS";
 if(typeof CanvasPattern!=="undefined"&&c.fillStyle instanceof CanvasPattern)f+=" pat";return f};
const det=c=>{const t=c.getTransform();return Math.abs(t.a*t.d-t.b*t.c)};
const rec=(c,m,area,extra)=>{R.calls++;const k=cname(c.canvas)+"|"+m+"|"+who()+"|"+flags(c)+(extra||"");
 const e=R.by[k]||(R.by[k]={n:0,area:0});e.n++;e.area+=area};
const bbArea=c=>{const b=c.__bb;if(!b||b[2]<b[0])return 0;return (b[2]-b[0])*(b[3]-b[1])*det(c)};
for(const m of ["fill","stroke","clip"]){const o=P[m];P[m]=function(...a){if(R.on)rec(this,m,bbArea(this),m==="stroke"?" lw"+Math.round(this.lineWidth*Math.sqrt(det(this))):"");return o.apply(this,a)}}
for(const m of ["fillRect","strokeRect","clearRect"]){const o=P[m];P[m]=function(...a){if(R.on)rec(this,m,Math.abs(a[2]*a[3])*det(this));return o.apply(this,a)}}
{const o=P.drawImage;P.drawImage=function(...a){if(R.on){const s=a[0];let w,h;if(a.length>=9){w=a[7];h=a[8]}else if(a.length>=5){w=a[3];h=a[4]}else{w=s.width||0;h=s.height||0}
 rec(this,"drawImage",Math.abs(w*h)*det(this)," src"+(s.width||0)+"x"+(s.height||0))}return o.apply(this,a)}}
for(const m of ["fillText","strokeText"]){const o=P[m];P[m]=function(...a){if(R.on)rec(this,m,0);return o.apply(this,a)}}
{const o=P.putImageData;P.putImageData=function(...a){if(R.on)rec(this,"putImageData",a[0].width*a[0].height);return o.apply(this,a)}}
const t0=performance.now();const tick=()=>{R.frames++;if(performance.now()-t0<4000)requestAnimationFrame(tick);else{R.on=false;R.done=true}};
requestAnimationFrame(tick);return "census on"})()'''
GET = ('(()=>{const R=window.__cen;if(!R||!R.done)return JSON.stringify({done:false,frames:R?R.frames:0});'
       'const rows=Object.entries(R.by).map(([k,v])=>[k,+(v.n/R.frames).toFixed(2),Math.round(v.area/R.frames)]);'
       'return JSON.stringify({done:true,frames:R.frames,calls:R.calls,DPR:DPR,cvs:cvs.width+"x"+cvs.height,'
       'ship:[Math.round(G.ship.x),Math.round(G.ship.y)],rows})})()')
STOP = ('(()=>{clearInterval(window.__drv);keys.thrust=false;keys.left=false;'
        'try{window.__wl&&window.__wl.release()}catch(e){}return "stopped"})()')

t0 = time.time(); driving = False; me = None; out = None; armed = None
while time.time() - t0 < 120:
    time.sleep(2)
    me = next((t for t in pages() if f'/{name}.html' in t.get('url', '')), None)
    if not me:
        continue
    if not driving:
        s = ev(me, START); print(f'{time.time()-t0:4.0f}s start:', s, flush=True)
        if isinstance(s, str) and s.startswith('running'):
            print(f'{time.time()-t0:4.0f}s drive:', ev(me, DRIVE), flush=True); driving = True; armed = time.time() + 8
        continue
    if armed and time.time() >= armed:
        print(f'{time.time()-t0:4.0f}s census:', ev(me, CENSUS), flush=True); armed = None
        continue
    if armed is None:
        r = ev(me, GET)
        try:
            j = json.loads(r)
        except Exception:
            print('GET', str(r)[:200]); continue
        if j.get('done'):
            out = j; break

if me:
    print('stop:', ev(me, STOP), flush=True)
if out:
    open(S + '/census_' + name + (sys.argv[2] if len(sys.argv) > 2 else '') + '.json', 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=0))
    rows = out['rows']
    print('frames', out['frames'], 'calls', out['calls'], 'DPR', out['DPR'], out['cvs'], 'ship', out['ship'])
    print('--- top by bbox area per frame (Mpx) ---')
    for k, n, a in sorted(rows, key=lambda r: -r[2])[:30]:
        print(f'{a/1e6:7.2f} Mpx {n:7.2f}/fr  {k[:170]}')
    print('--- GPU uploads / textures / submits per frame ---')
    for k, n, a in sorted([r for r in rows if r[0].startswith('GPU|')], key=lambda r: -r[1]):
        print(f'{n:7.2f}/fr  {k[:190]}')
    print('--- top by calls per frame ---')
    for k, n, a in sorted(rows, key=lambda r: -r[1])[:25]:
        print(f'{n:7.2f}/fr {a/1e6:7.2f} Mpx  {k[:170]}')
else:
    print('NO RESULT')
if me:
    try:
        urllib.request.urlopen('http://127.0.0.1:9333/json/close/' + me['id'], timeout=5).read(); print('closed own tab')
    except Exception as e:
        print('tab close failed', e)
