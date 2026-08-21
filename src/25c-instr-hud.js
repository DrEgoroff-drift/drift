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
  const col="rgba(150,176,190,";
  const nh=h*.46;                      // верхняя половина — стрелки
  const cw=(w-40)/R.length;            // справа оставлено место под невязку
  for(let i=0;i<R.length;i++){
    const cx=cw*(i+.5), cy=nh*.86, r=Math.min(cw*.42,nh*.62);
    c.strokeStyle=col+".28)";c.lineWidth=1;
    c.beginPath();c.arc(cx,cy,r,Math.PI*1.12,Math.PI*1.88);c.stroke();
    /* деления только крайние: на такой ширине пять штрихов слипаются в дугу */
    c.strokeStyle=col+".16)";
    for(const k of [0,1]){
      const a=Math.PI*(1.12+.76*k),c1=Math.cos(a),s1=Math.sin(a);
      c.beginPath();
      c.moveTo(cx+c1*r,cy+s1*r);c.lineTo(cx+c1*r*.62,cy+s1*r*.62);
      c.stroke();
    }
    const a=Math.PI*1.12+Math.PI*.76*instrTrack(R[i]);
    c.strokeStyle=col+".85)";c.lineWidth=1.2;
    c.beginPath();
    c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*r*.9,cy+Math.sin(a)*r*.9);
    c.stroke();
    c.fillStyle=col+".85)";
    c.beginPath();c.arc(cx,cy,1.1,0,TAU);c.fill();
  }
  /* невязка: цифры с краю, тем же тоном, что и всё остальное. Ни рамки, ни
     подписи «внимание» — число, на которое игрок либо смотрит, либо нет */
  c.textAlign="right";
  c.fillStyle=col+".55)";
  c.font="8px ui-monospace,monospace";
  c.fillText(instrMisclose().toFixed(3),w-3,nh*.72);
  /* лента: та же бумага, что и в кабине, только узкая полоска */
  /* бумага здесь тише, чем в кабине: в строке приборов она иначе перетягивает
     на себя весь верх экрана, а поверх мира висит только нужное сейчас */
  c.globalAlpha=.72;
  tapePaper(c,1,nh+2,w-2,h-nh-6);
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
