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
function instrPodDraw(){
  if(!ipctx)return;
  const w=$ipod.width/IPOD_S, h=$ipod.height/IPOD_S;
  const c=ipctx;
  c.setTransform(IPOD_S,0,0,IPOD_S,0,0);
  c.clearRect(0,0,w,h);
  const R=instrRead();
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
  c.fillText(instrMisclose().toFixed(3),w-3,nh*.72);
  /* лента: та же бумага, что и в кабине, только узкая полоска */
  /* бумага здесь тише, чем в кабине: в строке приборов она иначе перетягивает
     на себя весь верх экрана, а поверх мира висит только нужное сейчас */
  c.globalAlpha=.72;
  tapePaper(c,1,nh+10,w-2,h-nh-14);
  c.globalAlpha=1;
}
/* Показывается везде, кроме пояса: там есть настоящий потолочный блок, и две
   панели разом читались бы как брак. */
function instrPodTick(){
  if(!$ipod)return;
  const on=G.running&&G.mode!=="belt"&&G.mode!=="dock";
  $ipod.style.display=on?"":"none";
  if(on)instrPodDraw();
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
