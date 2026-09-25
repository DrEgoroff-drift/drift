/* ══════════════ приборная колодка: те же приборы, но всегда под рукой ══════════════
   M124, первый шаг. Панель (25a) и самописец (25b) живут на потолочном блоке
   кабины — и потому видны только в поясе, а летает игрок в системном виде, где
   никакой кабины нет. Прибор, которого нет там, где принимаются решения, не
   прибор.

   ЧТО СДЕЛАНО. Одна узкая колодка в верхней строке приборов, между жизнью
   корабля и «где мы»: пять стрелок в ряд, невязка цифрами и полоска ленты под
   ними. Своё маленькое полотно — рисуем тем же кодом, что и в кабине
   (`tapePaper`), чтобы не завести второй самописец.

   ПРАВИЛА. Те же, что у 25a: ни звука, ни сообщения, ни смены цвета. Колодка
   гаснет и просыпается вместе со всей строкой приборов (`hudWake`), а в поясе
   прячется совсем — там на неё смотрят по-настоящему, подняв глаза на блок. */

const $ipod=document.getElementById("ipod");
const ipctx=$ipod?$ipod.getContext("2d"):null;
const IPOD_S=2;                        // полотно вдвое крупнее: стрелки тонкие
/* Перерисовка — только когда кадр колодки другой (GPU-этап 1): прежде 66 вызовов
   полотна каждый кадр ради стрелок, которые стоят. Подпись собирает всё, что
   видно: стрелки с шагом 1/256 шкалы (конец стрелки на полотне ×2 сдвигается
   меньше чем на четверть пикселя — глазу это не шаг, а хронометр, ползущий
   каждый кадр, перестаёт звать перерисовку), невязку как она напечатана,
   голову и откат ленты, дрожь пера, размер полотна и саму ленту (загрузка
   сейва приносит новую). */
let IPOD_SIG="",IPOD_T=null;
function instrPodSig(R,T){
  let s=$ipod.width+"x"+$ipod.height+"|"+instrMisclose().toFixed(3)+"|"+T.head+","+T.n+","+T.back+","+Math.round((T.back?0:T.tick)*32);
  for(const r of R)s+="|"+r.ab+Math.round(instrTrack(r)*256);
  return s;
}
function instrPodDraw(){
  if(!ipctx)return;
  const R=instrRead(),T=tapeInit(),sig=instrPodSig(R,T);
  if(sig===IPOD_SIG&&T===IPOD_T)return;
  IPOD_SIG=sig;IPOD_T=T;
  const w=$ipod.width/IPOD_S, h=$ipod.height/IPOD_S;
  const c=ipctx;
  c.setTransform(IPOD_S,0,0,IPOD_S,0,0);
  c.clearRect(0,0,w,h);
  /* ── колодку должно быть ВИДНО (M233) ──
     Тон был один на всё (150,176,190) при альфе .28 на дуге: над дневным небом
     посадки и над чёрным космосом колодка одинаково пропадала, а пять
     безымянных стрелок и не говорили, который прибор который. Это ровно та
     жалоба, которую кабина закрыла кодами из трёх букв (M213), — здесь их
     не было вовсе. Правило «ни цвета, ни тревоги» остаётся: меняются только
     светлота и подпись. */
  const col="rgba(178,202,216,";
  const nh=h*.44;                      // верхняя часть — стрелки
  const cw=(w-40)/R.length;            // справа оставлено место под невязку
  for(let i=0;i<R.length;i++){
    const cx=cw*(i+.5), cy=nh*.84, r=Math.min(cw*.42,nh*.62);
    /* тёмное поле под шкалой: по нему стрелка читается и на светлом небе */
    c.fillStyle="rgba(8,12,18,.42)";
    c.beginPath();c.arc(cx,cy,r+2,Math.PI*1.06,Math.PI*1.94);c.closePath();c.fill();
    c.strokeStyle=col+".50)";c.lineWidth=1.1;
    c.beginPath();c.arc(cx,cy,r,Math.PI*1.12,Math.PI*1.88);c.stroke();
    /* деления только крайние: на такой ширине пять штрихов слипаются в дугу */
    c.strokeStyle=col+".30)";
    for(const k of [0,1]){
      const a=Math.PI*(1.12+.76*k),c1=Math.cos(a),s1=Math.sin(a);
      c.beginPath();
      c.moveTo(cx+c1*r,cy+s1*r);c.lineTo(cx+c1*r*.62,cy+s1*r*.62);
      c.stroke();
    }
    const a=Math.PI*1.12+Math.PI*.76*instrTrack(R[i]);
    /* тень стрелки — тот же приём, что на панели кабины: стрелка над шкалой */
    c.strokeStyle="rgba(0,0,0,.45)";c.lineWidth=1.6;
    c.beginPath();
    c.moveTo(cx+.6,cy+1.1);c.lineTo(cx+.6+Math.cos(a)*r*.88,cy+1.1+Math.sin(a)*r*.88);
    c.stroke();
    c.strokeStyle=col+".95)";c.lineWidth=1.3;
    c.beginPath();
    c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*r*.9,cy+Math.sin(a)*r*.9);
    c.stroke();
    c.fillStyle=col+".95)";
    c.beginPath();c.arc(cx,cy,1.2,0,TAU);c.fill();
    /* код прибора: три буквы под шкалой — тот же ответ, что в кабине */
    c.textAlign="center";
    c.fillStyle=col+".62)";
    c.font="7px ui-monospace,monospace";
    c.fillText(R[i].ab,cx,nh+7);
  }
  /* невязка: цифры с краю, тем же тоном, что и всё остальное. Ни рамки, ни
     подписи «внимание» — число, на которое игрок либо смотрит, либо нет */
  c.textAlign="right";
  c.fillStyle=col+".70)";
  c.font="8px ui-monospace,monospace";
  c.fillText(decRu(instrMisclose(),3),w-3,nh*.72);
  /* лента: та же бумага, что и в кабине, только узкая полоска */
  /* бумага здесь тише, чем в кабине: в строке приборов она иначе перетягивает
     на себя весь верх экрана, а поверх мира висит только нужное сейчас */
  c.globalAlpha=.72;
  tapePaper(c,1,nh+10,w-2,h-nh-14);
  c.globalAlpha=1;
}
/* Показывается везде, кроме пояса: там есть настоящий потолочный блок, и две
   панели разом читались бы как брак. */
/* Колодку прячет и CSS: узкий экран (@media max-width:720px, style.css) и режимы вне
   полёта (body:not(.inflight), 27z). Невидимое полотно не рисуем: на телефоне оно
   перерисовывалось ~10 раз в секунду при display:none, а холст вне композитора на каждом
   рисовании ждёт весь хвост GPU-процесса. Узость — один matchMedia и его событие, без
   чтения стилей в кадре; список режимов — тот же, что у класса inflight в 27z. Подпись
   IPOD_SIG при этом не трогается: колодка проснётся и сравнит её со свежей */
const IPOD_MQ=typeof matchMedia==="function"?matchMedia("(max-width:720px)"):null;
let IPOD_NARROW=!!(IPOD_MQ&&IPOD_MQ.matches);
if(IPOD_MQ&&IPOD_MQ.addEventListener)IPOD_MQ.addEventListener("change",e=>{IPOD_NARROW=e.matches;});
const IPOD_FLY={system:1,map:1,belt:1,scoop:1,landing:1};
function instrPodTick(){
  if(!$ipod)return;
  const on=G.running&&G.mode!=="belt"&&G.mode!=="dock";
  $ipod.style.display=on?"":"none";
  if(on&&!IPOD_NARROW&&IPOD_FLY[G.mode])instrPodDraw();
}
/* Колодка — не только показание, но и ручка: по ней открывается стойка (25d),
   где те же приборы стоят в полный рост. Единственный элемент строки приборов,
   который ловит палец, — поэтому pointer-events включаются только на нём. */
if($ipod){
  $ipod.style.pointerEvents="auto";
  $ipod.style.cursor="pointer";
  $ipod.addEventListener("pointerdown",e=>{
    e.preventDefault();
    if(typeof rackToggle==="function")rackToggle();
  });
}
