#!/usr/bin/env python3
"""A «before | after» pair of one scene, whole frame at 760 px, side by side — one command (fleet rule 6).

    python docs/pair.py system                          # base = origin/claude/optimistic-gates-u46osn
    python docs/pair.py cave --before origin/main --js "G.cave.x=900"
    python docs/pair.py night homeout --out-dir /tmp/pairs      # several scenes, one sheet each

«before» is drift.html built from a git worktree of --before (cached per commit in the temp dir),
«after» is this tree, built first unless --no-build. Both frames are taken by docs/shot.py itself
(this tree's shot.py and mkview scenes for both, so only the game differs): same Chrome, same GPU
flags (SwiftShader when DRIFT_GPU=swiftshader), same seed, same stepped clock, 760x475 at DPR 1,
the two shots running in parallel. The sheet is composed by headless Chrome (no PIL needed): the
two frames side by side with a label line each. Output: <out-dir>/pair_<scene>.png, plus the two
frames next to it. Any option this script does not know (--js, --delay, --seed, --look, --eval,
--until, --budget, --gpu) goes to shot.py for both sides. Writes nothing into the repo.
"""
import argparse, base64, html, importlib.util, json, os, shutil, subprocess, sys, tempfile, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.dont_write_bytecode = True
ON_WIN = os.name == "nt"
PS = "powershell" if ON_WIN else "pwsh"


def load_shot():
    spec = importlib.util.spec_from_file_location("shot", os.path.join(HERE, "shot.py"))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


def git(*a, cwd=ROOT):
    return subprocess.run(["git"] + list(a), cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()


def build(tree):
    r = subprocess.run([PS, "-ExecutionPolicy", "Bypass", "-File", os.path.join(tree, "build.ps1")], cwd=tree,
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0 or not os.path.exists(os.path.join(tree, "drift.html")):
        sys.exit("build failed in %s:\n%s" % (tree, (r.stdout + r.stderr)[-2000:]))


def base_tree(ref):
    sha = git("rev-parse", ref)
    d = os.path.join(tempfile.gettempdir(), "drift-pair-" + sha[:10])
    stamp = os.path.join(d, ".pair-built")
    if not os.path.exists(stamp):
        if os.path.exists(d):
            subprocess.run(["git", "worktree", "remove", "--force", d], cwd=ROOT, capture_output=True)
            shutil.rmtree(d, ignore_errors=True)
        git("worktree", "add", "--detach", d, sha)
        build(d)
        open(stamp, "w").write(sha)
    return d, sha


def one(argv):
    """child: shoot one side with this tree's shot.py, the page taken from another tree"""
    root, rest = argv[0], argv[1:]
    shot = load_shot()
    shot.ROOT = root          # page_for reads <ROOT>/drift.html; the scene tail stays this tree's mkview
    sys.argv = ["shot.py"] + rest
    shot.main()


def sheet(chrome, a_png, b_png, a_lab, b_lab, out, w, h, port):
    tmp = tempfile.mkdtemp(prefix="drift-sheet-")
    try:
        page = os.path.join(tmp, "sheet.html")
        u = lambda p: "file:///" + os.path.abspath(p).replace("\\", "/").lstrip("/")
        cell = lambda p, lab: ('<figure><img src="%s" width="%d" height="%d"><figcaption>%s</figcaption></figure>'
                               % (u(p), w, h, html.escape(lab)))
        open(page, "w", encoding="utf-8").write(
            "<!doctype html><meta charset=utf-8><style>html,body{margin:0;background:#111;color:#ddd;"
            "font:14px/1.3 monospace}body{display:flex;gap:8px;padding:0}figure{margin:0}img{display:block}"
            "figcaption{height:22px;padding:4px 6px 0}</style><body>%s%s</body>" % (cell(a_png, a_lab), cell(b_png, b_lab)))
        W, H = 2 * w + 8, h + 26
        # CDP, not --screenshot: the new headless loses ~90 px of --window-size to the window frame
        shot = load_shot()
        proc = subprocess.Popen([chrome, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                                 "--remote-debugging-port=%d" % port, "--user-data-dir=" + os.path.join(tmp, "prof"),
                                 "--window-size=%d,%d" % (W, H + 200), "about:blank"],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            for _ in range(60):
                try: urllib.request.urlopen("http://127.0.0.1:%d/json/version" % port, timeout=2); break
                except Exception: time.sleep(.25)
            req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % port, method="PUT")
            ws = shot.WS(json.load(urllib.request.urlopen(req, timeout=10))["webSocketDebuggerUrl"])
            ws.call("Emulation.setDeviceMetricsOverride", width=W, height=H, deviceScaleFactor=1, mobile=False)
            ws.call("Page.enable"); ws.call("Page.navigate", url=u(page))
            for _ in range(100):
                if shot.ev(ws, "document.readyState==='complete'&&[...document.images].every(i=>i.complete)"): break
                time.sleep(.1)
            png = ws.call("Page.captureScreenshot", format="png", clip={"x": 0, "y": 0, "width": W, "height": H, "scale": 1})
            open(out, "wb").write(base64.b64decode(png["data"]))
        finally:
            proc.kill()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return os.path.exists(out)


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--one":
        return one(sys.argv[2:])
    ap = argparse.ArgumentParser()
    ap.add_argument("scenes", nargs="+")
    ap.add_argument("--before", default="origin/claude/optimistic-gates-u46osn", help="git ref of «before»")
    ap.add_argument("--out-dir", default="", help="where the sheets go (default: a drift-pairs dir in the temp dir)")
    ap.add_argument("--no-build", action="store_true", help="use this tree's drift.html as it is")
    ap.add_argument("--w", type=int, default=760)
    ap.add_argument("--h", type=int, default=475)
    ap.add_argument("--port", type=int, default=9500)
    a, extra = ap.parse_known_args()
    out_dir = os.path.abspath(a.out_dir or os.path.join(tempfile.gettempdir(), "drift-pairs"))
    os.makedirs(out_dir, exist_ok=True)
    t0 = time.time()
    if not a.no_build: build(ROOT)
    bt, sha = base_tree(a.before)
    head = git("rev-parse", "--short", "HEAD")
    dirty = " +changes" if git("status", "--porcelain", "--", "src") else ""
    print("before %s (%s) · after %s%s · built in %.0f s" % (a.before, sha[:8], head, dirty, time.time() - t0), flush=True)
    chrome = next((c for c in load_shot().CHROMES if os.path.exists(c)), None)
    bad = 0
    for i, sc in enumerate(a.scenes):
        t1 = time.time()
        pa = os.path.join(out_dir, "before_%s.png" % sc); pb = os.path.join(out_dir, "after_%s.png" % sc)
        common = [sc, "--w", str(a.w), "--h", str(a.h), "--dpr", "1"] + extra
        procs = [subprocess.Popen([sys.executable, os.path.abspath(__file__), "--one", tree] + common +
                                  ["--out", png, "--port", str(a.port + 2 * i + k)], stdout=subprocess.PIPE, text=True,
                                  encoding="utf-8", errors="replace")
                 for k, (tree, png) in enumerate([(bt, pa), (ROOT, pb)])]
        lines = [p.communicate()[0].strip() for p in procs]
        for side, ln in zip(("before", "after"), lines): print("  %s: %s" % (side, ln), flush=True)
        out = os.path.join(out_dir, "pair_%s.png" % sc)
        ok = all(p.returncode == 0 for p in procs) and os.path.exists(pa) and os.path.exists(pb) and \
            sheet(chrome, pa, pb, "до · %s %s · %s" % (a.before.split("/")[-1], sha[:8], sc),
                  "после · %s%s · %s" % (head, dirty, sc), out, a.w, a.h, a.port + 90)
        bad += 0 if ok else 1
        print("%s -> %s  %.0f s%s" % (sc, out, time.time() - t1, "" if ok else "  FAILED"), flush=True)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
