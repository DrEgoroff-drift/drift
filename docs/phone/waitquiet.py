"""waitquiet.py name [runs...] — wait until the S23 touchscreen has been silent for 60 s (a stuck contact or a hand on
the phone voids a gate run), then run gate.py <name> <secs> for each run length in turn (default 30 then 300).
Gives up after 40 minutes of waiting. Reports the stuck contact's place every minute while waiting."""
import os, subprocess, sys, time, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from phcommon import PORT, OUT, A, device
sys.stdout.reconfigure(encoding='utf-8')
S = OUT
name = sys.argv[1]; runs = [int(x) for x in sys.argv[2:]] or [30, 300]
D = device()
if not D:
    print('PHONE NOT FOUND'); sys.exit(1)

def sh(cmd, t=15):
    try:
        return subprocess.run([A, '-s', D, 'shell', cmd], capture_output=True, timeout=t).stdout.decode('utf-8', 'replace')
    except Exception as e:
        return 'ERR ' + str(e)

t0 = time.time(); quiet = 0; last = 0
while quiet < 60:
    if time.time() - t0 > 2400:
        print('GAVE UP: the screen never went quiet for a minute'); sys.exit(1)
    ev = sh('timeout 3 getevent -l /dev/input/event10 | head -n 12')
    if 'ABS_MT' in ev or 'BTN_TOUCH' in ev:
        quiet = 0
        if time.time() - last > 60:
            last = time.time()
            x = re.findall(r'ABS_MT_POSITION_X\s+([0-9a-f]+)', ev); y = re.findall(r'ABS_MT_POSITION_Y\s+([0-9a-f]+)', ev)
            where = (f'x {int(x[-1],16)*100//4095}% y {int(y[-1],16)*100//4095}% from top-left' if x and y else 'moving')
            print(f'{time.strftime("%H:%M:%S")} screen still touched · {where}', flush=True)
    else:
        quiet += 3 + 2   # the 3-s listen plus the adb round trip
    time.sleep(2)
print(f'{time.strftime("%H:%M:%S")} screen quiet for a minute — starting the gate', flush=True)
for r in runs:
    subprocess.run([sys.executable, '-u', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gate.py'), name, str(r),
                    '--port', str(PORT), '--out', OUT])
    time.sleep(20)   # let the phone settle between runs
