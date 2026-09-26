"""phtran.py trace.json [gap_ms] — what the phone was doing in each long frame gap of a phtrace.py trace.
Streams the (huge, ~600 MB) trace one event at a time and keeps only slices >= 1 ms, frame markers and metadata.
Frames = FireAnimationFrame on the renderer main thread. For every gap >= gap_ms (default 45) prints, per busy
thread (renderer main, compositor, viz, GPU main, Dawn/Skia helpers), the longest slices overlapping the gap.
Then the trace-wide list of compile/pipeline/shader/program slices >= 3 ms, and the GPU main thread's top names."""
import json, sys, collections
path = sys.argv[1]; GAP = float(sys.argv[2]) if len(sys.argv) > 2 else 45
tname, pname = {}, {}
sl = collections.defaultdict(list)          # (pid,tid) -> [(t0,t1,name,args)]
stk = collections.defaultdict(list)
KW = ('ompile', 'ipeline', 'hader', 'rogram', 'Link', 'SPIRV', 'Tint', 'WGSL')
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
        if dur >= 1000 or nm == 'FireAnimationFrame':
            a = e.get('args') or {}
            sl[k].append((e['ts'], e['ts'] + dur, nm, json.dumps(a, ensure_ascii=False)[:160] if a else ''))
    elif ph == 'B':
        stk[k].append((e['ts'], nm, e.get('args')))
    elif ph == 'E' and stk[k]:
        t0, n0, a = stk[k].pop()
        if e['ts'] - t0 >= 1000 or n0 == 'FireAnimationFrame':
            sl[k].append((t0, e['ts'], n0, json.dumps(a, ensure_ascii=False)[:160] if a else ''))
dec = json.JSONDecoder()
with open(path, encoding='utf-8') as f:
    buf = f.read(1 << 24); pos = buf.index('[') + 1; n = 0
    while True:
        while pos < len(buf) and buf[pos] in ' \r\n\t,':
            pos += 1
        if len(buf) - pos < (1 << 20):
            more = f.read(1 << 24)
            buf = buf[pos:] + more; pos = 0
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
        pos = end; n += 1
        keep(e)
print(f'events parsed {n}')
faf = collections.Counter({k: sum(1 for s in v if s[2] == 'FireAnimationFrame') for k, v in sl.items()})
main = faf.most_common(1)[0][0]
fr = sorted(s[0] for s in sl[main] if s[2] == 'FireAnimationFrame')
t0 = fr[0]
gaps = [(fr[i - 1], fr[i]) for i in range(1, len(fr)) if (fr[i] - fr[i - 1]) / 1000 >= GAP]
print(f'frames {len(fr)} over {(fr[-1]-fr[0])/1e6:.1f} s · gaps >= {GAP:.0f} ms: {len(gaps)}')
label = lambda k: f"{pname.get(k[0], k[0])}/{tname.get(k, k[1])}"
busy = [k for k in sl if len(sl[k]) > 30]
for a, b in gaps[:12]:
    print(f'\n== gap {(b-a)/1000:.1f} ms at {(a-t0)/1e6:.2f} s')
    for k in busy:
        over = [s for s in sl[k] if s[0] < b and s[1] > a and (s[1] - s[0]) >= 2000]
        if not over:
            continue
        over.sort(key=lambda s: -(s[1] - s[0]))
        print(f'   {label(k)}:')
        for s in over[:6]:
            print(f'      {(s[1]-s[0])/1000:7.1f} ms  @{(s[0]-t0)/1e6:7.3f}s  {s[2]}  {s[3]}')
hits = []
for k, ss in sl.items():
    for s in ss:
        if (s[1] - s[0]) >= 3000 and any(w in s[2] for w in KW):
            hits.append(((s[1] - s[0]) / 1000, (s[0] - t0) / 1e6, label(k), s[2], s[3]))
print(f'\ncompile/pipeline/shader slices >= 3 ms: {len(hits)}')
for h in sorted(hits, reverse=True)[:20]:
    print('   %7.1f ms @%7.3fs  %s  %s  %s' % h)
gm = [k for k in sl if tname.get(k) == 'CrGpuMain']
for k in gm:
    tot = collections.Counter()
    for s in sl[k]:
        tot[s[2]] += (s[1] - s[0]) / 1000
    print(f'\n{label(k)} — slice names by total ms (slices >= 1 ms, nested counted twice):')
    for nm, ms in tot.most_common(15):
        print(f'   {ms:9.1f}  {nm}')
