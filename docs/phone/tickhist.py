"""tickhist.py trace.json — per second of the phone trace: frames (FireAnimationFrame), canvas FinalizeFrame calls,
rate-limiter Ticks, and the time the main thread spent blocked inside Ticks. Greps the lines, no full parse."""
import re, sys, collections
names = ('FireAnimationFrame', 'CanvasRenderingContext2D::FinalizeFrame', 'SharedContextRateLimiter::Tick')
rx = re.compile(r'"dur":(\d+).*?"name":"([^"]+)".*?"ts":(\d+)')
ev = []
with open(sys.argv[1], encoding='utf-8') as f:
    for line in f:
        if 'FireAnimationFrame' not in line and 'FinalizeFrame' not in line and 'RateLimiter' not in line:
            continue
        m = rx.search(line)
        if m and m.group(2) in names:
            ev.append((int(m.group(3)), m.group(2), int(m.group(1))))
t0 = min(t for t, n, d in ev if n == names[0])
B = collections.defaultdict(lambda: [0, 0, 0, 0.0, 0.0])
for t, n, d in ev:
    s = int((t - t0) / 1e6)
    i = names.index(n)
    B[s][i] += 1
    if i == 2:
        B[s][3] += d / 1000
        B[s][4] = max(B[s][4], d / 1000)
print(' s  frames finalize ticks  blocked_ms  worst_tick_ms')
for s in sorted(B):
    b = B[s]
    print(f'{s:3d}  {b[0]:5d}  {b[1]:7d}  {b[2]:5d}  {b[3]:9.1f}  {b[4]:8.1f}')
