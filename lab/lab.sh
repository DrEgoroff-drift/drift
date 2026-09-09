#!/bin/bash
# Drift lab — one session on the shared host (docs/LAB.md).
#
#   bash ~/drift-lab/lab.sh --budget 240        # minutes; default 240
#   bash ~/drift-lab/lab.sh --budget 10 --quick # node + light shards only, no heavy, no fuzz
#
# Хост: shared, 500 МБ памяти на аккаунт, процессы живут только внутри ssh-сессии.
# Отсюда три правила: один Chrome за раз, тяжёлый набор — отдельный процесс,
# и сессию кто-то держит (lab.ps1 с ноутбука или .github/workflows/lab.yml).
# Результаты: ~/drift-data/lab/*.json(l), страница: ~/drift-game.ru/docs/lab/.
set -u
LAB="$HOME/drift-lab"; BUILD="$LAB/build"; DATA="$HOME/drift-data/lab"; CH="$HOME/chrome"
PY="python3 $LAB/lab.py"
BUDGET=240; QUICK=0
while [ $# -gt 0 ]; do case "$1" in
  --budget) BUDGET="$2"; shift 2;;
  --quick) QUICK=1; shift;;
  *) shift;;
esac; done
mkdir -p "$DATA" "$LAB/out"
exec 9>"$DATA/lock"
if ! flock -n 9; then echo "lab: сессия уже идёт (lock) — выхожу"; exit 0; fi
[ -f "$BUILD/tests.html" ] || { echo "lab: нет build/tests.html — сначала lab.ps1 / workflow"; exit 2; }
VER=$(grep -o 'VER="[0-9.]*"' "$BUILD/tests.html" | head -1 | grep -o '[0-9.]*'); VER=${VER:-?}
SID=$(date -u +%Y%m%d-%H%M%S)
T0=$(date +%s); DEADLINE=$((T0 + BUDGET*60))
export LD_LIBRARY_PATH="$CH/lib"
CHROME="$CH/chrome-headless-shell-linux64/chrome-headless-shell"
# Страница с трассой: каждый набор пишет своё имя в консоль на старте, и у
# повисшего прогона в stderr остаётся имя виновника (lab.py читает последнее «→»).
sed 's/_suite=name;/_suite=name;console.log("→ "+name);/' "$BUILD/tests.html" > "$BUILD/tests-trace.html"
PAGE="file://$BUILD/tests-trace.html"
echo "lab: сессия $SID · версия $VER · бюджет $BUDGET мин"
$PY session start "$SID" "$VER" "$BUDGET"
left(){ echo $(( DEADLINE - $(date +%s) )); }
urlenc(){ python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))' "$1"; }
# память — счётчик cgroup своей сессии, в него и упирается лимит; сумма RSS
# считает общие страницы по нескольку раз и врёт в полтора раза
memnow(){ cat /sys/fs/cgroup/memory.current 2>/dev/null || echo 0; }
oomnow(){ awk '/oom_kill/{print $2}' /sys/fs/cgroup/memory.events 2>/dev/null || echo 0; }

# run <kind> <arg> <timeout_s> <cmd...> : команда в фоне, пик памяти каждую
# секунду, счётчик OOM до и после, потом разбор отчёта
run(){
  local kind="$1" arg="$2" tmo="$3"; shift 3
  local out="$LAB/out/$kind.txt" err="$LAB/out/$kind.err" s=$(date +%s) max=0 m rc oom0=$(oomnow)
  rm -f "$out" "$err"
  ( timeout "$tmo" "$@" > "$out" 2>"$err" ; echo $? > "$LAB/out/$kind.rc" ) &
  local bg=$!
  while kill -0 $bg 2>/dev/null; do
    sleep 1; m=$(memnow); [ "$m" -gt "$max" ] && max=$m
  done
  rc=$(cat "$LAB/out/$kind.rc" 2>/dev/null || echo 1)
  $PY report "$kind" "$arg" "$out" $(( $(date +%s) - s )) $(( max / 1048576 )) "$rc" "$VER" "$SID" "$err" $(( $(oomnow) - oom0 ))
}
chrome(){ # <win> <url>
  local win="$1" url="$2"
  rm -rf "$LAB/profile"
  echo "$CHROME" --headless=new --no-sandbox --disable-gpu --window-size="$win" \
    --user-data-dir="$LAB/profile" --virtual-time-budget=20000 --enable-logging=stderr --v=0 --dump-dom "$url"
}
skipq(){ # наборы, ушедшие в «соло» на этой версии, лёгкие прогоны обходят
  local s; s=$($PY skip "$VER"); [ -n "$s" ] && echo "&skip=$(urlenc "$s")"
}

# ── план: node → лёгкие шарды → телефон и высокое окно → тяжёлые и соло по одному ──
$PY plan "$VER" "$SID" | while IFS=$'\t' read -r kind arg; do
  case "$kind" in
    node)  est=60;  [ $(left) -lt $est ] && continue
           ( cd "$BUILD" && run node "" 240 node test-node.js ) ;;
    light) est=90;  [ $(left) -lt $est ] && continue
           run light "$arg" 240 $(chrome 1280,800 "$PAGE?shard=$arg$(skipq)") ;;
    mobile) [ $QUICK = 1 ] && continue; est=150; [ $(left) -lt $est ] && continue
           run mobile "" 420 $(chrome 390,844 "$PAGE?x=1$(skipq)") ;;
    tall)  [ $QUICK = 1 ] && continue; est=150; [ $(left) -lt $est ] && continue
           run tall "" 420 $(chrome 1440,1440 "$PAGE?x=1$(skipq)") ;;
    heavy) [ $QUICK = 1 ] && continue; est=150; [ $(left) -lt $est ] && continue
           run heavy "$arg" 420 $(chrome 1280,800 "$PAGE?full=1&only=$(urlenc "$arg")") ;;
    solo)  [ $QUICK = 1 ] && continue; est=200; [ $(left) -lt $est ] && continue
           run solo "$arg" 900 $(chrome 1280,800 "$PAGE?full=1&only=$(urlenc "$arg")") ;;
  esac
  $PY publish >/dev/null
done

# ── охота: фуззер по зёрнам, пока есть бюджет и пока находится новое ──
if [ $QUICK = 0 ]; then
  while [ $(left) -gt 120 ]; do
    seed=$($PY fuzz-next "$VER")
    [ "$seed" = "stop" ] && { echo "lab: охота на $VER исчерпана — пять зёрен подряд без нового"; break; }
    run fuzz "$seed" 300 $(chrome 1280,800 "$PAGE?only=$(urlenc "фуззер")&fuzz=1500&fseed=$seed")
    $PY publish >/dev/null
  done
fi

$PY session end "$SID" "$VER" "$BUDGET"
$PY publish
echo "lab: сессия $SID закончена за $(( ( $(date +%s) - T0 ) / 60 )) мин"
