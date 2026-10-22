"""сторож шума: чужие headless-хромы и загрузка процессора рядом с замером.
Соседние сеансы гоняют зрение (drift-geom, ~40 хромов) и съёмку (drift-shot) — 32 ядра уходят в 100 %,
и замер кадра на стенных часах ловит «секундные кадры без JS», которых в игре нет (22.10).

  from noise import sample, wait_quiet
  s = sample(own_profile)   # {"chromes": 9, "who": "drift-shot-9571×9", "cpu": 100}
  wait_quiet(own_profile, secs=300)   # ждёт тишины, возвращает последний sample"""
import json, subprocess, time

PS = r"""$own=$args[0];$r=@{};
Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | ForEach-Object {
  $c=$_.CommandLine; if($c -and $c -match '--headless' -and $c -match 'user-data-dir="?([^" ]+)'){ $d=$matches[1]; if($d -ne $own){ $n=Split-Path $d -Leaf; $r[$n]=1+[int]$r[$n] } } }
$cpu=[int](Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 1).CounterSamples[0].CookedValue
@{who=$r;cpu=$cpu} | ConvertTo-Json -Compress"""


def sample(own=""):
    """чужие headless-хромы по профилю и загрузка процессора за 1 с; при сбое — пустой ответ, а не исключение"""
    try:
        out = subprocess.run(["powershell", "-NoProfile", "-Command", "& {" + PS + "}", own],
                             capture_output=True, text=True, timeout=30).stdout
        j = json.loads(out.strip().splitlines()[-1])
        who = j.get("who") or {}
        return {"chromes": sum(who.values()), "who": ", ".join("%s×%d" % kv for kv in sorted(who.items())), "cpu": j.get("cpu", -1)}
    except Exception:
        return {"chromes": -1, "who": "?", "cpu": -1}


def noisy(s, cpu_max=40):
    """шумит процессор, а не число хромов: зомби shot.py висят без дела часами; живой прогон зрения — это десятки"""
    return s["cpu"] > cpu_max or s["chromes"] >= 8


def wait_quiet(own="", secs=0, cpu_max=40):
    """ждёт до secs секунд, пока нет чужих хромов и процессор ниже cpu_max; возвращает последний замер"""
    t0 = time.time()
    s = sample(own)
    while noisy(s, cpu_max) and time.time() - t0 < secs:
        time.sleep(5)
        s = sample(own)
    return s


def free_port():
    """свободный порт отладки: два сеанса с одним --port делили профиль и гасили хромы друг друга (22.10)"""
    import socket
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


def kill_tree(proc):
    """свой хром целиком: proc.kill() гасит только родителя, а его GPU- и рендер-процессы живут сиротами
    и сами становятся шумом для следующего замера (22.10: 10 сирот drift-probe)"""
    try: subprocess.run(["taskkill", "/T", "/F", "/PID", str(proc.pid)], capture_output=True, timeout=20)
    except Exception: pass
    try: proc.kill()
    except Exception: pass


def tag(s):
    return "ШУМ: процессор %d %%, чужие хромы %d (%s)" % (s["cpu"], s["chromes"], s["who"] or "—")
