/* ══════════════ дорожный спутник: кадр видеокартой (G12) ══════════════
   Прежде у дороги был свой 2D-холст #roadcv и свой кадр на процессоре: небо
   градиентами, сияние — циклом по пикселям (27lb), всё без свечения и зерна.
   Теперь кадр дороги — обычный кадр видеокарты (08b): gpuFrame → под всем 2D
   небо (27la) и поле света с гашением низа (27lb) → корпус и шлейф 2D на #c →
   gpuWorld (свечение, зерно, виньетка) → числа на слой приборов → gpuPresent.
   gpuOver не нужен ни разу: одна загрузка #c на кадр.

   Экран дороги занимает всё: `body.road > *:not(#roadwin){display:none}`
   (style.css) гасит всё, что лежит прямо в body, — и холст видеокарты #g, и
   слой приборов #hud тоже. Поэтому на время дороги они ПЕРЕЕЗЖАЮТ внутрь
   #roadwin, под прозрачный #roadcv: тот остаётся ловить пальцы (касание —
   вспышка, долгое нажатие — окно датчиков), а рисовать в него больше нечего.
   На выходе оба возвращаются на свои места, сразу за #c. */
const ROAD_GLOW=.18;                      /* сила свечения кадра дороги (как BLOOM_K у режимов) */
function roadGpuMount(on){
  if(typeof GPU==="undefined"||!GPU.cv)return;
  const win=document.getElementById("roadwin"),g=GPU.cv,u=GPU.ui;
  if(!win)return;
  if(on){
    if(g.parentNode!==win){win.prepend(g);if(u)g.after(u);}
    /* #roadcv больше не рисуется: пустой и крошечный, он только ловит пальцы */
    const cv=document.getElementById("roadcv");
    if(cv&&(cv.width!==1||cv.height!==1)){cv.width=1;cv.height=1;}
    ROAD_BOX=null;
  }else if(g.parentNode===win){cvs.after(g);if(u)g.after(u);ROAD_BOX=null;resize();}
}
/* ── рамка кадра дороги — лист, а не окно (приёмка флота, 26.09) ──
   От 900 px лист .scr — колонна по центру, и его backdrop-filter с zoom делают
   его держателем для position:fixed: #g внутри #roadwin показан в рамке листа
   (998×752 в окне 1280×800, 998×1016 в окне 1920×1080), а кадр собирался на всё
   окно — корпус, звёзды и надписи сжимались вбок на 17 % и на 45 %, а вспышка
   касания (#roadcv меряет себя по листу) вставала не под пальцем. Прежний #roadcv
   рисовал в рамке листа; теперь так же: пока #g в #roadwin, W,H — его рамка в
   пикселях CSS окна, #c по ней, #g и слой приборов догоняют в gpuFrame. Рамка
   меряется раз — при открытии, после анимации входа (scale .994) и на resize;
   на выходе resize() возвращает окно. На телефоне лист во весь экран: рамка = окно */
let ROAD_BOX=null;
function roadFit(){
  if(typeof GPU==="undefined"||!GPU.cv||GPU.cv.parentNode!==document.getElementById("roadwin"))return;
  if(!ROAD_BOX){const r=GPU.cv.getBoundingClientRect();ROAD_BOX={w:Math.round(r.width),h:Math.round(r.height)};}
  const w=ROAD_BOX.w,h=ROAD_BOX.h;
  if(w<2||h<2||(W===w&&H===h))return;
  W=w;H=h;cvs.width=Math.round(W*DPR);cvs.height=Math.round(H*DPR);MAIN_CTX.setTransform(DPR,0,0,DPR,0,0);
}
addEventListener("resize",()=>{ROAD_BOX=null;});
(function(){const w=document.getElementById("roadwin");if(w)w.addEventListener("animationend",()=>{ROAD_BOX=null;});})();
