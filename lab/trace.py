"""трасса Chrome (Tracing) вокруг действия: что делает рендерер в худших кадрах — стиль, раскладка, краска,
слои, задачи видеокарты — с именем узла DOM, когда трасса его называет.

  python lab/trace.py system "openStation()" "closeStation()" [--gap 2.5] [--w 1600 --h 900 --dpr 1 --mobile]

Действия выполняются по очереди с паузой --gap с; в каждом окне печатаются 3 худших кадра и что в них."""
import argparse, json, os, subprocess, sys, tempfile, time, urllib.request
sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import jank
import noise  # kill_tree: свой хром со всеми детьми
shot = jank.shot
CATS = ("devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,"
        "blink.user_timing,gpu,cc,viz,blink,disabled-by-default-devtools.timeline.invalidationTracking")
KEEP = {"Layout", "UpdateLayoutTree", "Paint", "PrePaint", "Layerize", "UpdateLayer", "UpdateLayerTree", "CompositeLayers",
        "RasterTask", "GPUTask", "FunctionCall", "TimerFire", "FireAnimationFrame", "HitTest", "ParseHTML", "MajorGC", "MinorGC",
        "V8.GC_SCAVENGER", "BlinkGC.AtomicPhase", "Commit", "ScheduleStyleRecalculation", "InvalidateLayout",
        "LayoutInvalidationTracking", "StyleRecalcInvalidationTracking", "PaintInvalidationTracking"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scene")
    ap.add_argument("acts", nargs="+")
    ap.add_argument("--gap", type=float, default=2.5)
    ap.add_argument("--root", default=jank.ROOT)
    ap.add_argument("--w", type=int, default=1600)
    ap.add_argument("--h", type=int, default=900)
    ap.add_argument("--dpr", type=float, default=1)
    ap.add_argument("--mobile", action="store_true")
    ap.add_argument("--port", type=int, default=0, help="0 = a free port (sessions share this script)")
    a = ap.parse_args()
    if not a.port: a.port = noise.free_port()
    shot.HERE = os.path.join(a.root, "docs")
    chrome = next((c for c in shot.CHROMES if os.path.exists(c)), None)
    tmp = tempfile.mkdtemp(prefix="drift-trace-")
    pg = os.path.join(tmp, "trace.html")
    open(pg, "w", encoding="utf-8").write(jank.page(shot.stand_tail(), a.root))
    prof = os.path.join(tempfile.gettempdir(), "drift-trace-%d" % a.port)
    proc = subprocess.Popen([chrome, "--headless=new", "--remote-debugging-port=%d" % a.port, "--user-data-dir=" + prof,
                             "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
                             "--enable-unsafe-webgpu", "--window-size=%d,%d" % (a.w, a.h), "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(60):
            try: urllib.request.urlopen("http://127.0.0.1:%d/json/version" % a.port, timeout=2); break
            except Exception: time.sleep(.25)
        req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % a.port, method="PUT")
        t = json.load(urllib.request.urlopen(req, timeout=10))
        ws = shot.WS(t["webSocketDebuggerUrl"], 300)
        ws.call("Emulation.setDeviceMetricsOverride", width=a.w, height=a.h, deviceScaleFactor=a.dpr, mobile=a.mobile)
        ws.call("Network.enable"); ws.call("Network.setBlockedURLs", urls=shot.BLOCK)
        ws.call("Page.enable"); ws.call("Page.addScriptToEvaluateOnNewDocument", source=shot.CATCH)
        ws.call("Page.navigate", url="file:///" + pg.replace("\\", "/") + "?s=" + a.scene)
        t0 = time.time()
        while time.time() - t0 < 40:
            if shot.ev(ws, "typeof G!=='undefined'&&G.running&&typeof GPU!=='undefined'&&(GPU.ok||GPU.none)&&"
                           "document.documentElement.hasAttribute('data-alive')") is True: break
            time.sleep(.2)
        time.sleep(3)
        ws.call("Tracing.start", categories=CATS, transferMode="ReportEvents")
        time.sleep(.5)
        shot.ev(ws, "__J.f=[];__J.t0=performance.now();performance.mark('drift-t0');__J.on=true;")
        win = []
        for act in a.acts:
            s = shot.ev(ws, "performance.now()-__J.t0")
            r = shot.ev(ws, "(()=>{try{%s;return G.mode;}catch(e){return 'ОШИБКА '+e.message;}})()" % act)
            time.sleep(a.gap)
            win.append((act, s, shot.ev(ws, "performance.now()-__J.t0"), r))
        F = json.loads(shot.ev(ws, "__J.on=false;JSON.stringify(__J.f)"))
        # трасса: ws.call пропускает события, поэтому здесь свой цикл
        ws.id += 1; me = ws.id
        ws.send(json.dumps({"id": me, "method": "Tracing.end", "params": {}}))
        ev = []
        while True:
            m = json.loads(ws.recv())
            if m.get("method") == "Tracing.dataCollected": ev.extend(m["params"]["value"])
            elif m.get("method") == "Tracing.tracingComplete": break
        mk = next((e for e in ev if e.get("name") == "drift-t0"), None)
        if not mk: print("в трассе нет метки drift-t0 — времена не сопоставить"); return
        base = mk["ts"]
        rend = mk["pid"]
        for act, s, e, r in win:
            fr = sorted([f for f in F if s <= f["t"] <= e], key=lambda f: -f["d"])[:3]
            print("== %s → %s · кадров %d · худшие: %s" % (act, r, len([f for f in F if s <= f["t"] <= e]),
                  ", ".join("%.0f мс (JS %.0f)" % (f["d"], max(f.get("js", 0), 0)) for f in fr)))
            for f in fr:
                if f["d"] < 30: continue
                a0, a1 = base + (f["t"] - f["d"]) * 1000, base + f["t"] * 1000
                acc, who = {}, {}
                for x in ev:
                    nm = x.get("name")
                    if nm not in KEEP or x.get("ts", 0) < a0 - 2000 or x.get("ts", 0) > a1: continue
                    if x.get("ph") == "X": d = x.get("dur", 0) / 1000.0
                    else: d = 0
                    key = nm + ("" if x.get("pid") == rend else " [другой процесс]")
                    e2 = acc.setdefault(key, [0, 0.0]); e2[0] += 1; e2[1] += d
                    arg = (x.get("args") or {}).get("data") or {}
                    tag = arg.get("nodeName") or arg.get("reason") or arg.get("selectorStart") or arg.get("stackTrace") and str(arg["stackTrace"][0].get("functionName")) or ""
                    if tag: who.setdefault(nm, {}); who[nm][str(tag)[:60]] = who[nm].get(str(tag)[:60], 0) + 1
                print("   кадр %.0f мс на %.0f мс: %s" % (f["d"], f["t"], " · ".join("%s %d шт %.1f мс" % (k, v[0], v[1]) for k, v in sorted(acc.items(), key=lambda kv: -kv[1][1])[:9])))
                for nm, d in who.items():
                    print("      %s ← %s" % (nm, ", ".join("%s×%d" % kv for kv in sorted(d.items(), key=lambda kv: -kv[1])[:6])))
    finally:
        noise.kill_tree(proc)
        import shutil; shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
