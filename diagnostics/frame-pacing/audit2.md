# Frame pacing — второй этап (2026-11-01)

Ветка `engine`. Игровой код идентичен `f2ee2ce` (`git diff f2ee2ce..HEAD -- src tests build.ps1`
пуст); сверху только диагностика. Изменений бюджетов, порядка, графики, механики и компиляции нет.

## 1. Фактический жизненный цикл общего бюджета (исправление 1.1)

Порядок в кадре, проверенный по коду:

1. `fbBegin()` — `28-loop.js:562`, в НАЧАЛЕ кадра: `FB.base += (max(0, FRAME_JS − FB.spent) − FB.base) · 0.1`,
   затем `FB.spent = 0`. `FRAME_JS` — прошлый кадр целиком.
2. `stepWorld` → `gpuFrame` (внутри: `plnSurface` → `plnWarmStep` → `plnLandStep`/`plnPlantStep`;
   `cave3Chunks`/`cave3Dress`; `dig3Chunks`; вызовы `prebake`) → `drawWorld` → `hud` → `gpuPresent`.
3. `workPump()` — `28-loop.js:617`, ПОСЛЕ `gpuPresent`, в том же callback.

Уменьшают `FB.spent` (то есть реально видны общему бюджету в этом же кадре):

| Кто | Где | Что |
|---|---|---|
| земля планеты | `21pz:367` | `fbSpend(wallMs()−tb)` после `plnLandStep`/`plnPlantStep` |
| убранство пещеры | `22d:328` | `fbSpend(...)` после `cave3DressFrame` |
| куски шахты | `23c:164` | `fbSpend(...)` после `dig3Chunks` |
| `workPump` | `17a0:77` | `fbSpend(WORK_T)` |

**Не уменьшают `FB.spent` в этом кадре:** `plnWarmStep` (7.5 мс по замеру), `prebake` (0–4 мс),
тики, `autosave`.

**Поправка к прошлому отчёту:** утверждение «общий бюджет не видит 14 мс» **неверно**. Эти
работы попадают в `FRAME_JS`, а `fbBegin` следующего кадра сглаженно (0.1) вносит их в `FB.base` —
то есть бюджет **видит их со задержкой в кадр**, а не «не видит вообще». Следствие: в одном кадре
сумма `plnWarmStep + prebake + workPump` всё же возможна, если прошлый кадр был лёгким, но она
гасится на следующем. Складывать 7+3+4 как «одновременные 14» нельзя: `prebake` в замере дал 0,
`workPump` 0–3.1 мс.

## 2. `PLN_BUILD.first = 40` (пункт 1.2)

- Константа: `21pf-pln-land.js:38` — `{ms:8, first:40, n:2, nFirst:6, frame:5, low:1}`.
- `21pz-pln-frame.js:359`: `const lim = L.first ? fbLeft(B.low,B.ms,B.frame) : B.first;`
  `L.first` стартует `false` (`21pf:137`) и становится `true` в `plnLandStep` (`21pf:517`), поэтому
  **самый первый кадр спуска получает `lim = 40`**, все следующие — общий `fbLeft` (≤8).
- `21pf:514–515`: на первом вызове `first = !L.first = true` → `cap = nFirst=6` задач, `ms = 40`.
- Может ли дать 33–79 мс: **сам по себе — нет**. Замер `?g11=near` (блок `landing`): `warm` 7.5 мс,
  `drawWorld` 8.4 мс, `js` max 26.9 мс — 40 мс не выбираются. Бюджет — потолок, не факт.
- Совместно с другими: да, первый кадр спуска может нести `plnLandStep` (в пределах 40) +
  `plnWarmStep` (7.5) + `prebake`; в замере `prebake` в этом блоке 0.
- При превышении шаг неделим: `plnLandStep` закончит текущий кусок и выйдет, `fbSpend` запишет
  фактическое — то есть превышение уходит в `FB.spent`, а не отменяется.

## 3. GPU compilation funnel — реальная конкуренция (пункт 1.3)

- Дедупликация — **только кэш** `GPU_PIPES.warm` (Map). `gpuPipeline()` (`08b0:25`) проверяет
  `warm.get(key)`; при промахе строит **синхронно** `d.createRenderPipeline(mk())` (`08b0:29`) — это
  единственная синхронная компиляция в кадре.
- `gpuPipesWarm()` (`08b0:66`) — `Promise.all` из `createRenderPipelineAsync`.
- `gpuPipesLate()` (`08b0:122`) — своя цепочка: один ключ за шаг, `createRenderPipelineAsync`,
  следующий шаг по `.then(...)` + `setTimeout`, темп `gpuLateGap()` (30 / 500 / 2500 мс).
- `cave3PipesAhead()` (`22d:122`) — своя цепочка, тоже по одному, `createRenderPipelineAsync`.
- **Мьютекса нет.** Обе цепочки видят одни и те же `GPU_PIPES.warm` и пропускают уже занятый ключ
  (`if(GPU_PIPES.warm.get(key)){next();return;}` в `22d:131`), поэтому **один и тот же ключ дважды не
  компилируется**, но **разные ключи двух цепочек могут компилироваться одновременно** — общего
  счётчика/очереди нет. Это следует из кода, а не из «двух Promise».
- При смене `G.mode`: `gpuPipesLate` пересчитывает темп на каждом шаге (`gpuLateGap()`), но
  отмены/паузы уже запущенной компиляции нет; при смене устройства обе цепочки выходят по
  `GPU_PIPES.dev !== d` (и следующий прогрев стартует свой).

## 4. Реальный замер переходов (патч уже работает)

`?g11=near`, DPR 2, 240 кадров после смены режима, без пауз (полный JSON —
`diagnostics/frame-pacing/near-run-01.json`):

| Блок | prev | n | gap p50 | p90 | p99 | **max** | js max | >33 | >50 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| system | — | 240 | 4.2 | 4.2 | 4.3 | 4.4 | 0.5 | 0 | 0 |
| **landing (холодный)** | system | 240 | 4.2 | 8.4 | 16.7 | **854.2** | 26.9 | 1 | 1 |
| **surface** | landing | 240 | 4.2 | 4.3 | 8.4 | **108.3** | **109.4** | 1 | 1 |
| **dig** | surface | 240 | 4.2 | 4.3 | 16.7 | **33.3** | 34.7 | 1 | 0 |
| cave | dig | 240 | 4.2 | 4.2 | 4.3 | 8.4 | 8.0 | 0 | 0 |
| landing (тёплый) | cave | 240 | 4.2 | 8.4 | 8.4 | 12.5 | 14.9 | 0 | 0 |

Что это показывает:

- **Холодный `system → landing` — 854 мс** (сам `startLanding`, вне кадра) — это главный провал,
  прошлые отчёты его не видели из-за пауз.
- **`landing → surface` — 108 мс**, причём `js` 109.4 мс, из которых сумма инструментированных
  этапов (`sw 0.6 + dw 5.9 + hud 0.7 + gp 0.1`) всего ~7 мс — **~102 мс не разложены**; это
  `frameBody` вне замеренных точек (в первую очередь `autosave()` на первом кадре поверхности и
  тики). Нужен ещё один зонд — это признанный пробел.
- **`surface → dig` — 33.3 мс**, в нём `drawWorld` 15.6 мс — единственный провал в диапазоне 33–79
  из старых наблюдений.
- **`dig → cave` — 8.4 мс**, **тёплый `landing` — 12.5 мс**: чисто.

### 4b. Перепроверка compositor (пункт 1.4)

Из того же `?g11` trace (20.3 с):

| Что | Значение |
|---|---|
| частота дисплея | **240 Гц** (`BeginFrame` p50 4.17 мс) |
| `BeginFrame` | viz-кадр дисплея, 4864 шт / 20.3 с |
| `DrawFrame` | отрисовка `cc::Scheduler`, 2417 шт (119/с) |
| длинные `DrawFrame` | **292 / 2416 = 12.1 %** (не 9.3 % — та цифра считалась только по steady после загрузки) |
| где эти провалы | **размазаны по 0–11 с** (по 14–29 на секунду), НЕ на переходах |

Значит: 12.1 % `DrawFrame > 16.7 мс` — это steady-кадры композитора; переходные 854–962 /
108–137 / 33–42 мс — это работа сцены (`startLanding`/`enterSurface`/`drawWorld`). Две разные
причины, валить их в одну нельзя.

`--disable-gpu-compositing`: флаг переводит композит на CPU; наблюдаемые 60 Гц — свойство
программного пути, а **не** «флаг ограничил FPS». Ограничения частоты он не ставит.

### 4c. Зонд 102→126 мс в `surface`

Добавил таймеры `autosave`/`viewIn`/`viewOut` и второй прогон (`near-run-02.json`). На кадре с
`gap` 137.5 мс: `js` 8.7, `sw` 0.8, `dw` 6.7, `hud` 0.7, `asave` 0, `vin` 0, `vout` 0. То есть
**это не кадр, а сам `enterSurface()`** (вызов смены режима вне `frame()`): 129 мс уходят в
разрыв rAF, а внутри кадра после него — 8.7 мс. Вопрос закрыт: провал на входе в поверхность —
**переключение сцены**, не кадр и не композитор.

## 5. Диагностический патч (пункт 2)

Новый файл `src/28zn-near.js` + точки замера (всё под `if(NEAR.on)`; в обычной игре-ноль):

| Файл | Что добавлено |
|---|---|
| `src/28zn-near.js` | `NEAR` (буфер), `nearOn/nearBlock/nearMark/nearWork/nearWarm/nearBake/nearPipe/nearCave/nearFrame/nearJSON` |
| `src/28-loop.js` | `nearBlock`+`nearFrame` после `FRAME_JS`; таймеры `stepWorld/gpuFrame/drawWorld/hud/gpuPresent/workPump` |
| `src/17a0-prebake.js` | `nearBake(sync)` в `prebake`, `nearWork(name,dt)` в `workPump` |
| `src/21pz-pln-frame.js` | `nearWarm(ms)` вокруг `plnWarmStep` |
| `src/08b0-gpu-pipe.js` | `nearPipe()` по завершении позднего конвейера |
| `src/22d-cave-pln.js` | `nearCave()` по завершении конвейера пещеры |
| `src/28z-fps-probe.js` | `g11RunNear()` + триггер `?g11=near` |
| `docs/g11.ps1` | переключатель `-Near` |

## 6. Инструкция запуска (пункт 3)

```powershell
# стенд
powershell -ExecutionPolicy Bypass -File docs\stand.ps1 -Port 8777
# прогон
powershell -ExecutionPolicy Bypass -File docs\g11.ps1 -Near -WaitSec 90
# результат
Get-Content docs\shots\g11near.png -Raw | ConvertFrom-Json     # JSON (нe PNG, расширение стенда)
```

Сценарии уже внутри `g11RunNear`: `system` → `landing` холодный → `surface` → `dig` → `cave` →
`landing` тёплый; каждый — 240 кадров без пауз. Для повторов и изоляции очередей: те же блоки,
но с `GPU_PIPES.late=null` / `cave3PipesAhead=()=>0` (только в диагностической сборке).

## 7. Формат JSON (пункт 4)

```json
{"dpr":2,"maxFrames":240,"blocks":[
 {"mode":"landing","prev":"system","frames":240,
  "gap":{"n":240,"p50":4.2,"p90":8.4,"p95":8.4,"p99":16.7,"max":854.2},
  "js":{"n":240,"p50":0,"p90":8.5,"p95":8.8,"p99":11.7,"max":26.9},
  "long":{"g20":2,"g25":1,"g33":1,"g50":1},
  "jsLong":{"j8":57,"j12":2,"j16":1,"j25":1},
  "work":{"hull3d":3.1},
  "worst":[{"i":247,"gap":854.2,"js":9,"mode":"landing","sw":0.1,"gf":0,"dw":8.4,"hud":0.3,
            "gp":0.1,"wp":0,"warm":7.5,"bake":0,"bakeS":0,"pipes":2,"cave":0,"work":{"hull3d":3.1}}]}
],"pipes":26,"cave":11,"err":[]}
```

## 8. Что нельзя получить из JS (нужен Chrome trace)

- **presented-кадр** и его задержка (`DrawFrame`/`FramePresented`/`Graphics.Pipeline` в viz).
- **BeginFrame** и его расписание; `ShouldThrottle`.
- **Длительность компиляции конвейера** в процессе GPU (JS видит только `.then`).
- **Compositor/raster** — поле `rest` в `stallWho` это остаток `gap − js`, не GPU.
- **Точная корреляция** «кадр → presentation» без timestamp-синхронизации.

## 9. Поправки к прошлому отчёту

1. «14 мс не видит» — неверно: видит со задержкой в кадр, сглаженно (0.1).
2. «`Graphics.Pipeline` p99 = 3.9 мс» — это был **интервал между событиями**, не длительность;
   длительности листьев: p50 0.025, p90 0.17, p95 0.24, p99 0.37, max 0.9 мс. Вывод «GPU лёгкий»
   остаётся, но по правильной метрике.
3. `FRAME_GAP`/`LONG_TASK` в коде не существуют — это `stallWho.gap` и `LONGTASKS`.
4. Диагноз «композитор 60 Гц» — пока только для headless steady-state; переходные 854/108 мс
   приходятся на сам `startLanding`/`enterSurface`, а не на композитор.
