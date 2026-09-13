"""Record a Chrome trace from the phone's game tab. usage: trace.py OUT.json SECONDS"""
import json, sys, time
sys.path.insert(0, r"C:\Users\user\AppData\Local\Temp\claude\C--Claude\b7d06a14-2cd9-49cd-bf67-437bbfa2a811\scratchpad")
import cdp

out, secs = sys.argv[1], float(sys.argv[2])
ws = cdp.WS(cdp.target_ws())
ws.s.settimeout(120)
cats = ["devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame",
        "toplevel", "v8.execute", "blink.user_timing", "disabled-by-default-v8.cpu_profiler", "input", "latencyInfo",
        "benchmark", "cc", "viz", "gpu", "blink"]
# in-page marker of finger-down frames, to correlate with the trace
cdp.evaluate(ws, """(()=>{const R=window.__trk=[];const t0=performance.now();const f=()=>{R.push([+(performance.now()).toFixed(1),HELM.S?1:0,+Math.hypot(G.ship.vx,G.ship.vy).toFixed(2),G.mode]);if(performance.now()-t0<%d)requestAnimationFrame(f)};requestAnimationFrame(f);return 1})()""" % int(secs * 1000 + 500))
ws.call("Tracing.start", transferMode="ReturnAsStream", traceConfig={"includedCategories": cats, "recordMode": "recordContinuously"})
print("tracing", secs, "s", flush=True)
time.sleep(secs)
ws.id += 1
ws.send(json.dumps({"id": ws.id, "method": "Tracing.end"}))
stream = None
while stream is None:
    m = json.loads(ws.recv())
    if m.get("method") == "Tracing.tracingComplete":
        stream = m["params"]["stream"]
chunks = []
while True:
    r = ws.call("IO.read", handle=stream, size=1 << 20)
    chunks.append(r.get("data", ""))
    if r.get("eof"):
        break
ws.call("IO.close", handle=stream)
open(out, "w", encoding="utf-8").write("".join(chunks))
trk = cdp.evaluate(ws, "JSON.stringify({trk:window.__trk,origin:performance.timeOrigin})")
open(out.replace(".json", "-trk.json"), "w").write(trk)
print("saved", out, sum(len(c) for c in chunks) // 1024, "KB")
