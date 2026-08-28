# Скрины для заглавной (site/shots/*.webp, 1600×900) — кадры самой канвы, без кнопок.
#
#   powershell -ExecutionPolicy Bypass -File docs\mksiteshots.ps1
#
# Сцены — те же, что в mkshots.ps1 (страница docs/shots.html строится отсюда же),
# но вместо скриншота Chrome страница отдаёт содержимое канвы сама: canvas.toDataURL
# в webp уходит POST'ом на стенд (docs/stand.ps1, порт 8777), тот кладёт файл в
# docs/shots. Так в кадр не попадают DOM-кнопки — заглавной нужен мир, а не UI.
# Стенд обязан быть уже поднят.
#
#   -Only home,sys   снять только названные кадры (имена — как в site/shots)
param([string[]]$Only)
$ErrorActionPreference = "Continue"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here

& powershell -ExecutionPolicy Bypass -File (Join-Path $here "mkshots.ps1") | Out-Null

$src = Get-Content -Raw -Encoding UTF8 (Join-Path $here "shots.html")
$cut = $src.LastIndexOf("</body>")
$add = @'
<script>
/* Кадры прогоняются РУКАМИ, как в prof(): под --virtual-time-budget rAF даёт
   всего пару кадров (измерено: FR 2), поэтому ждать «пока камера доедет» через
   requestAnimationFrame бессмысленно — так снималась заставка, пустое небо.
   Пара update/draw берётся по режиму тем же списком, что в frame(), только без
   hud(): заглавной нужен мир, а не интерфейс поверх него. */
(function(){
  var n=(location.search.match(/post=([a-z0-9]+)/)||[])[1];if(!n)return;
  setTimeout(function(){
    var M={system:[updateSystem,drawSystem],dock:[updateSystem,drawSystem],
           map:[function(){},drawMap],landing:[updateLanding,drawLanding],
           surface:[updateSurface,drawSurface],dig:[updateDig,drawDig],
           cave:[updateCave,drawCave],belt:[updateBelt,drawBelt],
           scoop:[updateScoop,drawScoop],base:[updateBase,drawBase],
           raid:[updateRaid,drawRaid],homein:[updateHomeIn,drawHomeIn]}[G.mode];
    if(!M){document.title="ERR режим "+G.mode;return;}
    /* 240 шагов: столько нужно камере, чтобы доехать до цели, а чанкам —
       чтобы испечься; дальше картинка уже не меняется */
    for(var i=0;i<240;i++){G.t+=1;M[0](1);M[1]();}
    /* ── заглавной нужен МИР, а не интерфейс ──
       С M221 фишки целей и строка-подсказка рисуются на КАНВЕ, а не в DOM, и
       кадры заглавной стали ловить «ЦВЕТНЫЕ КРИСТАЛЛЫ — ЗАЛЕЖИ…» и «ПЕЩЕРА
       1891 м» поперёк картинки. Гасим канвасный HUD и повторяем последний
       кадр: снимок обязан показывать то же, что игра, но заглавная показывает
       мир, а подсказки в ней — мусор. */
    if(typeof drawSurfaceHud==="function")drawSurfaceHud=function(){};
    if(typeof SHOT_CLEAN!=="undefined")SHOT_CLEAN=true;   /* рамка выбора на базе */
    G.prompt="";G.msg="";G.msgT=0;G.surfTipShown=-1e9;
    M[1]();
    var cv=document.getElementById("c");
    /* Кадр всегда уходит ровно 1600×900: заглавная резервирует место по этим
       числам, и картинка другой пропорции там расплющивается. Канва столько
       не даёт (окно 1600×900 → канва 1568×797), поэтому вырезаем из неё
       прямоугольник 16:9 и печатаем в кадр нужного размера.
       Дом изнутри занимает только нижнюю треть экрана — остальное в игре
       закрыто подсказками, а на заглавной было бы чёрной половиной кадра:
       у него полоса берётся снизу, у прочих — по центру. */
    var OW=1600,OH=900,low=G.mode==="homein";
    var sh=low?Math.round(cv.height*.48):Math.min(cv.height,Math.round(cv.width*OH/OW));
    var sw=Math.min(cv.width,Math.round(sh*OW/OH));
    sh=Math.round(sw*OH/OW);
    var sx=Math.round((cv.width-sw)/2),sy=low?cv.height-sh:Math.round((cv.height-sh)/2);
    var out=document.createElement("canvas");out.width=OW;out.height=OH;
    out.getContext("2d").drawImage(cv,sx,sy,sw,sh,0,0,OW,OH);
    fetch("/shot?n="+n,{method:"POST",body:out.toDataURL("image/webp",.92)})
      .then(function(r){document.title="POSTED "+r.status;},
            function(e){document.title="POSTERR "+e;});
  },2500);
})();
</script>
'@
[IO.File]::WriteAllText((Join-Path $here "siteshots.html"),
  $src.Substring(0,$cut) + $add + "</body></html>", (New-Object Text.UTF8Encoding $false))

# имя на сайте ← сцена в игре
$map = [ordered]@{ world="surface"; sys="system"; map="map"; cockpit="belt";
                   cave="cave"; base="base"; land="landing"; home="rooms" }
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$siteDir = Join-Path $root "site\shots"

foreach ($n in @($map.Keys)) {
  if ($Only -and $Only -notcontains $n) { continue }
  $webp = Join-Path $here "shots\$n.webp"
  for ($try = 1; $try -le 3; $try++) {
    Remove-Item $webp -ErrorAction SilentlyContinue
    # --dump-dom без виртуального бюджета выходит сразу после загрузки, до кадра;
    # с бюджетом — живёт, пока страница не отработает. Страница шлёт кадр сама,
    # когда сцена встала (счёт кадров rAF); ждём файл и убиваем браузер.
    $proc = Start-Process -PassThru -WindowStyle Hidden $chrome @(
      "--headless=new","--no-first-run","--no-default-browser-check","--disable-extensions",
      "--disable-gpu","--hide-scrollbars","--window-size=1600,900","--virtual-time-budget=30000",
      "--user-data-dir=$($env:TEMP)\drift-siteshots","--dump-dom",
      "http://localhost:8777/docs/siteshots.html?scene=$($map[$n])&post=$n&v=$(Get-Random)")
    for ($t = 0; $t -lt 80 -and -not (Test-Path $webp); $t++) { Start-Sleep -Milliseconds 500 }
    # Убиваем ТОЛЬКО своё дерево: у обычного Chrome пользователя рендереры тоже
    # без заголовка окна, и фильтр «безоконные chrome» однажды уронил ему все
    # вкладки (RESULT_CODE_KILLED). Опознаём процессы по своему user-data-dir.
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" |
      Where-Object { $_.CommandLine -like "*drift-siteshots*" } |
      ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    if (Test-Path $webp) { break }
  }
  if (Test-Path $webp) {
    Copy-Item $webp (Join-Path $siteDir "$n.webp") -Force
    Write-Output "$n → $((Get-Item $webp).Length) байт"
  } else {
    Write-Output "$n → НЕ СНЯЛСЯ"
  }
}
