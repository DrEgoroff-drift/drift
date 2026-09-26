/* ══════════════ дорожный спутник: кадр видеокартой (G12) ══════════════
   Прежде у дороги был свой 2D-холст #roadcv и свой кадр на процессоре: небо
   градиентами, сияние — циклом по пикселям (27lb), всё без свечения и зерна.
   Теперь кадр дороги — обычный кадр видеокарты (08b): gpuFrame → под всем 2D
   небо (27la) и поле света с гашением низа (27lb) → корпус, шлейф и монеты 2D
   на #c → числа в очередь слоя #ovl (roadOvl) → gpuWorld (свечение, зерно,
   виньетка; слой #ovl сводится в нём же) → gpuPresent. gpuOver не нужен ни
   разу: одна загрузка #c на кадр.

   Экран дороги занимает всё: `body.road > *:not(#roadwin){display:none}`
   (style.css) гасит всё, что лежит прямо в body, — и холст видеокарты #g, и
   слой интерфейса #ovl тоже. Поэтому на время дороги они ПЕРЕЕЗЖАЮТ внутрь
   #roadwin, под прозрачный #roadcv: тот остаётся ловить пальцы (касание —
   вспышка, долгое нажатие — окно датчиков), а рисовать в него больше нечего.
   На выходе оба возвращаются на свои места, сразу за #c. Слой, заведённый уже
   на дороге, ovCanvas ставит сразу за #g — то есть тоже внутрь #roadwin */
const ROAD_GLOW=.18;                      /* сила свечения кадра дороги (как BLOOM_K у режимов) */
function roadGpuMount(on){
  if(typeof GPU==="undefined"||!GPU.cv)return;
  const win=document.getElementById("roadwin"),g=GPU.cv,o=typeof OVL!=="undefined"?OVL.cv:null;
  if(!win)return;
  if(on){
    if(g.parentNode!==win)win.prepend(g);
    if(o&&o.previousSibling!==g)g.after(o);
    /* #roadcv больше не рисуется: пустой и крошечный, он только ловит пальцы */
    const cv=document.getElementById("roadcv");
    if(cv&&(cv.width!==1||cv.height!==1)){cv.width=1;cv.height=1;}
    ROAD_BOX=null;
  }else if(g.parentNode===win){cvs.after(g);if(o)g.after(o);ROAD_BOX=null;resize();}
}
/* ── числа дороги на слое #ovl ──
   Рисунок чисел (27l) остался прежним — строки, подписи, окно датчиков, — а пишет
   он теперь не в 2D-холст, а в этот ctx: горсть вызовов 2D, переложенных в примитивы
   слоя (ovText, ovRect). 2D-слоя приборов #hud больше нет (08bi), а #c после сборки
   мира уже никто не показывает. Мерка строки — та же, что у маски текста (GC_GLYPHS) */
let RD_OVL=null;
function roadOvl(){
  ovCanvas();   /* мерка слоя (ovNd) — от его холста, уже по рамке листа (roadFit) */
  const O=RD_OVL||(RD_OVL={st:new Map(),S:[],
    save(){this.S.push([this.fillStyle,this.strokeStyle,this.font,this.textAlign,this.textBaseline,this.globalAlpha,this.lineWidth]);},
    restore(){const s=this.S.pop();if(s)[this.fillStyle,this.strokeStyle,this.font,this.textAlign,this.textBaseline,this.globalAlpha,this.lineWidth]=s;},
    sty(){let s=this.st.get(this.font);
      if(!s){if(this.st.size>32)this.st.clear();this.st.set(this.font,s=Object.assign({},GC_DEF,{font:this.font,textAlign:"left",textBaseline:"alphabetic"}));}
      return s;},
    measureText(t){return GC_GLYPHS.measure(this.sty(),String(t));},
    fillText(t,x,y){ovText(OVL.uq,x,y,String(t),this.font,this.fillStyle,this.textAlign,this.textBaseline,this.globalAlpha,1);},
    fillRect(x,y,w,h){ovRect(x,y,x+w,y+h,this.fillStyle,this.globalAlpha);},
    strokeRect(x,y,w,h){const d=this.lineWidth/2,col=this.strokeStyle,a=this.globalAlpha;
      ovRect(x-d,y-d,x+w+d,y+d,col,a);ovRect(x-d,y+h-d,x+w+d,y+h+d,col,a);
      ovRect(x-d,y+d,x+d,y+h-d,col,a);ovRect(x+w-d,y+d,x+w+d,y+h-d,col,a);}});
  O.S.length=0;O.fillStyle=O.strokeStyle="#000";O.font="10px sans-serif";O.textAlign="left";O.textBaseline="alphabetic";
  O.globalAlpha=1;O.lineWidth=1;
  return O;
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
