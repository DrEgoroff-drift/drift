/* ══════════════ сторож чтений вёрстки: ?domread ══════════════
   Правило 0.3 — «ноль чтений DOM в кадре и в обработчике пальца» — нельзя
   держать уговором: чтение прямоугольника добавляется одной строкой, стоит
   пересчёта всей вёрстки и ничем себя не выдаёт, кроме дёрганья на телефоне.
   Поэтому чтения считаются.

   Сторож по умолчанию СПИТ и в игре не стоит ничего: подмена методов живёт
   только после domReadWatch(true) — её поднимает `?domread` в адресе или
   детектор в прогоне. Счётчики раздельные, потому что цена разная: rect и
   getComputedStyle заставляют браузер пересчитать вёрстку немедленно, поиск
   по селектору — «всего лишь» обход дерева.

   Как мерить: domReadZero() перед кадром, кадр, domReadCount() после —
   в кадре должны быть нули. Замер 13.09 на S23 давал 10–15 мс/с на rect и
   4–5 на querySelectorAll, и палец удваивал счёт. */
let DOMR_ON=false;
const DOMR={rect:0,style:0,sel:0};
let DOMR_SAVE=null;
function domReadCount(){return {rect:DOMR.rect,style:DOMR.style,sel:DOMR.sel};}
function domReadZero(){DOMR.rect=0;DOMR.style=0;DOMR.sel=0;}
function domReadWatch(on){
  if(!!on===DOMR_ON)return DOMR_ON;
  if(on){
    DOMR_SAVE={
      rect:Element.prototype.getBoundingClientRect,
      rects:Element.prototype.getClientRects,
      style:window.getComputedStyle,
      dq:Document.prototype.querySelector,
      dqa:Document.prototype.querySelectorAll,
      eq:Element.prototype.querySelector,
      eqa:Element.prototype.querySelectorAll
    };
    const S=DOMR_SAVE;
    Element.prototype.getBoundingClientRect=function(){DOMR.rect++;return S.rect.apply(this,arguments);};
    Element.prototype.getClientRects=function(){DOMR.rect++;return S.rects.apply(this,arguments);};
    window.getComputedStyle=function(){DOMR.style++;return S.style.apply(window,arguments);};
    Document.prototype.querySelector=function(){DOMR.sel++;return S.dq.apply(this,arguments);};
    Document.prototype.querySelectorAll=function(){DOMR.sel++;return S.dqa.apply(this,arguments);};
    Element.prototype.querySelector=function(){DOMR.sel++;return S.eq.apply(this,arguments);};
    Element.prototype.querySelectorAll=function(){DOMR.sel++;return S.eqa.apply(this,arguments);};
    DOMR_ON=true;
  }else{
    const S=DOMR_SAVE;
    if(S){
      Element.prototype.getBoundingClientRect=S.rect;
      Element.prototype.getClientRects=S.rects;
      window.getComputedStyle=S.style;
      Document.prototype.querySelector=S.dq;
      Document.prototype.querySelectorAll=S.dqa;
      Element.prototype.querySelector=S.eq;
      Element.prototype.querySelectorAll=S.eqa;
    }
    DOMR_ON=false;
  }
  return DOMR_ON;
}
try{if(location.search.indexOf("domread")>=0)domReadWatch(true);}catch(e){}
