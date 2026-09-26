"""phgap.py trace.json t1-t2 [t1-t2 ...] — nested slices (>= 0.2 ms) on the renderer main, compositor, viz and GPU
threads inside the given windows (seconds from the first FireAnimationFrame, as phtran.py prints them).
The first run streams the trace once and caches the kept slices in <trace>.slices.pkl; later runs read the cache."""
import json, os, pickle, sys, collections
path = sys.argv[1]
wins = [tuple(float(x) for x in w.split('-')) for w in sys.argv[2:]]
pkl = path + '.slices.pkl'
if os.path.exists(pkl):
    tname, pname, sl = pickle.load(open(pkl, 'rb'))
else:
    tname, pname = {}, {}
    sl = collections.defaultdict(list)
    stk = collections.defaultdict(list)
    def keep(e):
        ph = e.get('ph'); k = (e.get('pid'), e.get('tid'))
        if ph == 'M':
            if e.get('name') == 'thread_name':
                tname[k] = e['args'].get('name')
            elif e.get('name') == 'process_name':
                pname[e.get('pid')] = e['args'].get('name')
            return
        nm = e.get('name', '')
        if ph == 'X':
            dur = e.get('dur', 0)
            if dur >= 200 or nm == 'FireAnimationFrame':
                a = e.get('args') or {}
                sl[k].append((e['ts'], e['ts'] + dur, nm, json.dumps(a, ensure_ascii=False)[:200] if a else ''))
        elif ph == 'B':
            stk[k].append((e['ts'], nm, e.get('args')))
        elif ph == 'E' and stk[k]:
            t0, n0, a = stk[k].pop()
            if e['ts'] - t0 >= 200 or n0 == 'FireAnimationFrame':
                sl[k].append((t0, e['ts'], n0, json.dumps(a, ensure_ascii=False)[:200] if a else ''))
        elif ph in ('i', 'I', 'n') and nm:
            a = e.get('args') or {}
            sl[k].append((e['ts'], e['ts'], '!' + nm, json.dumps(a, ensure_ascii=False)[:200] if a else ''))
    dec = json.JSONDecoder()
    with open(path, encoding='utf-8') as f:
        buf = f.read(1 << 24); pos = buf.index('[') + 1
        while True:
            while pos < len(buf) and buf[pos] in ' \r\n\t,':
                pos += 1
            if len(buf) - pos < (1 << 20):
                buf = buf[pos:] + f.read(1 << 24); pos = 0
                while pos < len(buf) and buf[pos] in ' \r\n\t,':
                    pos += 1
            if pos >= len(buf) or buf[pos] == ']':
                break
            try:
                e, end = dec.raw_decode(buf, pos)
            except json.JSONDecodeError:
                more = f.read(1 << 24)
                if not more:
                    break
                buf = buf[pos:] + more; pos = 0
                continue
            pos = end
            keep(e)
    sl = {k: sorted(v) for k, v in sl.items()}
    pickle.dump((tname, pname, sl), open(pkl, 'wb'))
faf = {k: sum(1 for s in v if s[2] == 'FireAnimationFrame') for k, v in sl.items()}
main = max(faf, key=faf.get)
t0 = min(s[0] for s in sl[main] if s[2] == 'FireAnimationFrame')
label = lambda k: f"{pname.get(k[0], k[0])}/{tname.get(k, k[1])}"
WANT = ('CrRendererMain', 'CrGpuMain', 'VizCompositorThread', 'CompositorGpuThread', 'Compositor')
SKIP = {'RunTask', 'ThreadControllerImpl::RunTask', 'Scheduler::RunTask', 'ThreadPool_RunTask'}
for a, b in wins:
    A, B = t0 + a * 1e6, t0 + b * 1e6
    print(f'\n######## window {a:.3f}-{b:.3f} s')
    for k in sl:
        if tname.get(k) not in WANT:
            continue
        ss = [s for s in sl[k] if s[0] < B and s[1] > A and s[2] not in SKIP]
        if not ss:
            continue
        print(f'  --- {label(k)}')
        open_ = []
        for s in ss:
            while open_ and open_[-1] <= s[0]:
                open_.pop()
            if s[2].startswith('!'):
                print(f'   {"  " * len(open_)}{(s[0]-t0)/1e6:8.4f}  instant {s[2][1:]} {s[3][:120]}')
                continue
            print(f'   {"  " * len(open_)}{(s[0]-t0)/1e6:8.4f} {(s[1]-s[0])/1000:7.2f} ms  {s[2]}  {s[3][:140]}')
            open_.append(s[1])
