# Скрины для заглавной (site/shots/*.webp, 1600×900) — мир без интерфейса.
#
#   powershell -ExecutionPolicy Bypass -File docs\mksiteshots.ps1
#
# Сцены — те же, что в mkshots.ps1: его хвост и хвост этого файла кладутся поверх
# drift.html, и снимает docs/shotstand.py — Хром, флаги видеокарты (SwiftShader при
# DRIFT_GPU=swiftshader), шаговые часы и ожидание устройства из docs/shot.py (G13).
# Снимок — не скриншот страницы: siteShot() рисует кадр видеокарты и в той же задаче
# читает её холст (GPU.cv — мир и слой #c; приборы #hud и DOM туда не попадают),
# вырезает 16:9 и отдаёт webp. Стенд :8777 и --disable-gpu больше не нужны: с 23.09
# прежний путь снимал надпись «нет WebGPU», а #c теперь невидим и мира не держит.
#
#   -Only home,sys   снять только названные кадры (имена — как в site/shots)
param([string[]]$Only)
$ErrorActionPreference = "Continue"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here

$add = @'
<script>
/* ── заглавной нужен МИР, а не интерфейс ──
   С M221 фишки целей и строка-подсказка рисуются на КАНВЕ, а не в DOM, и
   кадры заглавной стали ловить «ЦВЕТНЫЕ КРИСТАЛЛЫ — ЗАЛЕЖИ…» и «ПЕЩЕРА
   1891 м» поперёк картинки. Гасим канвасный HUD: снимок обязан показывать то
   же, что игра, но заглавная показывает мир, а подсказки в ней — мусор.
   siteSettle — это --js стенда: 240 шагов update, чтобы камера доехала до
   цели (рисовать их незачем — кадры потом шагает сам стенд, видеокартой). */
window.siteSettle=function(){
  var U={system:updateSystem,dock:updateSystem,map:function(){},landing:updateLanding,
         surface:updateSurface,dig:updateDig,cave:updateCave,belt:updateBelt,
         scoop:updateScoop,base:updateBase,raid:updateRaid,homein:updateHomeIn,
         wanderer:updateWanderRoom,winter:updateWinter}[G.mode];
  if(!U){console.error("заглавная: режим "+G.mode+" не снимается");return;}
  for(var i=0;i<240;i++){G.t+=1;U(1);}
  if(typeof drawSurfaceHud==="function")drawSurfaceHud=function(){};
  if(typeof SHOT_CLEAN!=="undefined")SHOT_CLEAN=true;   /* рамка выбора на базе */
  G.prompt="";G.msg="";G.msgT=0;G.surfTipShown=-1e9;
};
/* Кадр всегда уходит ровно 1600×900: заглавная резервирует место по этим
   числам, и картинка другой пропорции там расплющивается. Вырезаем из холста
   видеокарты прямоугольник 16:9 и печатаем в кадр нужного размера.
   Дом изнутри занимает только нижнюю треть экрана — остальное в игре
   закрыто подсказками, а на заглавной было бы чёрной половиной кадра:
   у него полоса берётся снизу, у прочих — по центру. */
window.siteShot=function(){
  G.prompt="";G.msg="";G.msgT=0;
  drawWorld();   /* кадр вне цикла (gpuManual): холст видеокарты читается в этой же задаче */
  var cv=GPU.cv;
  var OW=1600,OH=900,low=G.mode==="homein";
  var sh=low?Math.round(cv.height*.48):Math.min(cv.height,Math.round(cv.width*OH/OW));
  var sw=Math.min(cv.width,Math.round(sh*OW/OH));
  sh=Math.round(sw*OH/OW);
  var sx=Math.round((cv.width-sw)/2),sy=low?cv.height-sh:Math.round((cv.height-sh)/2);
  var out=document.createElement("canvas");out.width=OW;out.height=OH;
  out.getContext("2d").drawImage(cv,sx,sy,sw,sh,0,0,OW,OH);
  return out.toDataURL("image/webp",.92);
};
</script>
'@
$tail = Join-Path ([IO.Path]::GetTempPath()) "drift-siteshots-tail.ps1"   # shotstand.py читает хвосты из .ps1
[IO.File]::WriteAllText($tail, "`$add = @'`n" + ($add -replace "`r`n", "`n") + "`n'@`n", (New-Object Text.UTF8Encoding $false))

# имя на сайте ← сцена в игре
$map = [ordered]@{ world="surface"; sys="system"; map="map"; cockpit="belt";
                   cave="cave"; base="base"; land="landing"; home="rooms";
                   soroka="wander"; winter="winter" }
$py = if ($PSVersionTable.PSVersion.Major -ge 6 -and -not $IsWindows) { "python3" } else { "python" }
$siteDir = Join-Path $root "site\shots"

foreach ($n in @($map.Keys)) {
  if ($Only -and $Only -notcontains $n) { continue }
  $webp = Join-Path $here "shots\$n.webp"
  Remove-Item $webp -ErrorAction SilentlyContinue
  & $py (Join-Path $here "shotstand.py") (Join-Path $here "mkshots.ps1") $tail $map[$n] --js "siteSettle()" --grab "siteShot()" --out $webp --w 1600 --h 900 --dpr 1
  if (Test-Path $webp) {
    Copy-Item $webp (Join-Path $siteDir "$n.webp") -Force
    Write-Output "$n → $((Get-Item $webp).Length) байт"
  } else {
    Write-Output "$n → НЕ СНЯЛСЯ"
  }
}
Remove-Item $tail -ErrorAction SilentlyContinue
