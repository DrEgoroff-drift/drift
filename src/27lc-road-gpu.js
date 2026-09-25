/* ══════════════ дорожный спутник: кадр видеокартой (G12) ══════════════
   Прежде у дороги был свой 2D-холст #roadcv и свой кадр на процессоре: небо
   градиентами, сияние — циклом по пикселям (27lb), всё без свечения и зерна.
   Теперь кадр дороги — обычный кадр видеокарты (08b): gpuFrame → поля неба под
   всем (27la) → корпус и шлейф 2D на #c → gpuOver и поле света (27lb) →
   gpuWorld (свечение, зерно, виньетка) → числа на слой приборов → gpuPresent.

   Экран дороги занимает всё: `body.road > *:not(#roadwin){display:none}`
   (style.css) гасит всё, что лежит прямо в body, — и холст видеокарты #g, и
   слой приборов #hud тоже. Поэтому на время дороги они ПЕРЕЕЗЖАЮТ внутрь
   #roadwin, под прозрачный #roadcv: тот остаётся ловить пальцы (касание —
   вспышка, долгое нажатие — окно датчиков), а рисовать в него больше нечего.
   На выходе оба возвращаются на свои места, сразу за #c. */
const ROAD_GLOW=.30;                      /* сила свечения кадра дороги (как BLOOM_K у режимов) */
function roadGpuMount(on){
  if(typeof GPU==="undefined"||!GPU.cv)return;
  const win=document.getElementById("roadwin"),g=GPU.cv,u=GPU.ui;
  if(!win)return;
  if(on){
    if(g.parentNode!==win){win.prepend(g);if(u)g.after(u);}
    /* #roadcv больше не рисуется: пустой и крошечный, он только ловит пальцы */
    const cv=document.getElementById("roadcv");
    if(cv&&(cv.width!==1||cv.height!==1)){cv.width=1;cv.height=1;}
  }else if(g.parentNode===win){cvs.after(g);if(u)g.after(u);}
}
