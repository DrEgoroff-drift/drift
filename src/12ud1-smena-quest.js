/* ══════════════ «Смена» — главный квест (P15, PLAYTEST-2026-09-13 §5) ══════════════
   Автор: «я даже планеты не посещал, просто дронов купил — пол-книги
   открылось». Книга открывалась деньгами и не по порядку. Теперь:
   • ГЛАВЫ ОТКРЫВАЮТСЯ ПО ПОРЯДКУ — следующая за последней открытой;
   • КАЖДАЯ — В НОВОМ КРАСИВОМ МЕСТЕ: на посадке, на мире такого вида (тип,
     смесь, звезда), где ни одна прежняя глава не открывалась. Так 72 главы
     обходят галактику, а не кассу;
   • ЗАКРЫТИЕ ГЛАВЫ ВИДНО: «ГЛАВА N» через весь экран, как акт в театре;
   • У ГЛАВЫ ЕСТЬ КАРТИНКА ИЗ ВАШЕЙ ИГРЫ: снимок открытки (postSnap, ~200 байт)
     в месте, где она прожита, — рисуется у начала главы.
   Открытое раньше не отнимается (старые сейвы). G.smenaAt = {n:{k,sx,sy,p,t,snap}}. */
function smenaAtAll(){return G.smenaAt||(G.smenaAt={});}
function smenaPlaceKey(p){
  if(!p||!G.sys)return "";
  return (p.type||"?")+"|"+(p.mix||"")+"|"+(G.sys.cls?G.sys.cls.ru:"");
}
function smenaNext(){for(let n=1;n<=72;n++)if(!smenaIsOpen(n))return n;return 0;}
/* зовёт посадка (21-mode-surface): здесь ли открывается следующая глава */
function smenaLand(p){
  const key=smenaPlaceKey(p);if(!key)return 0;
  const A=smenaAtAll();
  for(const k in A)if(A[k]&&A[k].k===key)return 0;      /* здесь уже открывалась — нужно новое место */
  if(!smenaIsOpen(1))smenaRec().push(1);                /* «Док» — всегда первым, до любой посадки */
  const n=smenaNext();if(!n)return 0;
  smenaRec().push(n);
  let snap=null;try{snap=(typeof postSnap==="function")?postSnap():null;}catch(e){snap=null;}
  A[n]={k:key,sx:G.sx,sy:G.sy,p:p.name||"",t:Math.round(G.t),snap};
  const title=(typeof SMENA_TITLE!=="undefined"&&SMENA_TITLE[String(n)])||"";
  logAdd("good","«Смена»: глава "+n+" — «"+title+"» · прожита на "+(p.name||"планете"));
  smenaAct(n,title);
  return n;
}
/* акт: слово через экран, дольше штампа */
function smenaAct(n,title){
  if(typeof document==="undefined"||!document.body)return;
  const old=document.getElementById("smenaAct");if(old)old.remove();
  const d=document.createElement("div");d.id="smenaAct";
  d.innerHTML="<div class='sa-n'>ГЛАВА "+n+"</div><div class='sa-t'>«"+title+"»</div><div class='sa-s'>«Смена» · на столе</div>";
  document.body.appendChild(d);
  setTimeout(()=>{if(d.parentNode)d.remove();},3200);
}
/* картинка главы: открытка из снимка, если он есть */
function smenaPlate(n){
  const A=smenaAtAll()[n];if(!A||!A.snap||typeof drawPostcard!=="function")return null;
  const w=300,h=180,cv=document.createElement("canvas");cv.className="smena-plate";
  const dpr=Math.min(2,window.devicePixelRatio||1);cv.width=w*dpr;cv.height=h*dpr;cv.style.width=w+"px";cv.style.height=h+"px";
  const c=cv.getContext("2d");
  if(c){c.setTransform(dpr,0,0,dpr,0,0);try{drawPostcard(c,A.snap,w,h);}catch(e){return null;}}
  return cv;
}
