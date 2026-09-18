/* ══════════════ Космопочта — учреждение как погода (M492, DESIGN-birchpunk) ══════════════
   Почта ГЛАВТРАССЫ есть на каждой станции с доской, но открыта по часам —
   они на двери. Часы почтовые, свои: сутки календаря — минута, на них окошко
   мигало бы; почтовые сутки — полсмены (KP_DAY), окно с 9–10 до 21–22 и
   обед с 13 до 14. Посылки приходят извещением в ПОЧТУ; получают в окне в
   часы работы, с талоном; посылка ждёт 30 почтовых суток, потом уходит
   отправителю. Сатира на учреждение, тепло в человеке: опоздавшему
   «полежит ещё денёк, не по правилам» — один раз на посылку.
   Сейчас посылка одна — корпус со СТАПЕЛЯ (M481); без почты его забирают на
   самой верфи, как раньше. Редкая деталь и товар кооператива — дальше. */
const KP_DAY=HOLD_SHIFT/2,KP_KEEP=30;
function kpHour(t){return Math.floor((((t===undefined?now():t)%KP_DAY)/KP_DAY)*24);}
function kpHours(sx,sy){const h0=9+(hashi(sx,sy,0x9057)&1);return [h0,h0+12];}
function kpOpenAt(t,sx,sy){
  const h=kpHour(t),H=kpHours(sx,sy);
  return h>=H[0]&&h<H[1]&&h!==13;
}
function kpOpen(){return !!G.st&&kpOpenAt(now(),G.sx,G.sy);}
/* сколько минут до открытия — перебором по почтовому часу */
function kpMinsToOpen(){
  const step=KP_DAY/24;
  for(let i=1;i<=24;i++){const t=now()+i*step-(now()%step);if(kpOpenAt(t,G.sx,G.sy))return Math.max(1,Math.ceil((t-now())/60000));}
  return 0;
}
function kpDoor(){const H=kpHours(G.sx,G.sy);return "ЧАСЫ РАБОТЫ "+H[0]+":00–"+H[1]+":00 · ОБЕД 13–14";}
/* срок посылки: 30 суток, и денёк сверху, если клерк смилостивился */
function kpDue(o){return o.ready+(KP_KEEP+(o.kind?1:0))*KP_DAY;}
/* посылка ещё на почте? (иначе ушла отправителю — на стапель) */
function kpHolds(o){return !!(o&&now()>=o.ready&&now()<kpDue(o));}
function kpTicket(o){return 11+hashi(o.no|0,G.sx,0x7A1)%60;}
/* получить в окне */
function kpTake(){
  const o=stapelAll().o;
  if(!o||!kpOpen()||now()<o.ready)return null;
  if(!kpHolds(o)){
    /* опоздали — но только что: клерк оставляет ещё на сутки, раз */
    if(!o.kind&&now()<kpDue(o)+KP_DAY){o.kind=1;
      logAdd("good","Почта: «Вообще-то вернули бы. Полежит ещё денёк — не по правилам. Идите, получайте»");}
    else return null;
  }
  return stapelCollect(true);
}
function kpBlock(){
  const o=(typeof stapelAll==="function")?stapelAll().o:null;
  const box=document.createElement("div");box.className="post";
  box.appendChild(el("div","sec","КОСМОПОЧТА · "+kpDoor()));
  const open=kpOpen();
  if(!o||now()<o.ready){
    box.appendChild(el("div","row","<div class='nm'><s>"+(open?"окно открыто · извещений на ваше имя нет":
      "ЗАКРЫТО · откроется через "+kpMinsToOpen()+" мин")+"</s></div>"));
    return box;
  }
  const r=el("div","row"),back=!kpHolds(o)&&!(!o.kind&&now()<kpDue(o)+KP_DAY);
  const left=Math.max(0,Math.ceil((kpDue(o)-now())/KP_DAY));
  r.appendChild(el("div","nm","<b>Извещение: корпус со стапеля «"+o.st+"»</b><s>"+
    (back?"срок хранения истёк · возвращено отправителю — забирать на стапеле, сектор "+o.sx+":"+o.sy:
     "хранится ещё "+left+" сут. · талон № "+kpTicket(o)+(open?" · перед вами никого":""))+"</s></div>"));
  if(!back){
    if(open){const b=el("button","act gold","ПОЛУЧИТЬ");
      b.onclick=()=>{const id=kpTake();if(id){say("Распишитесь здесь\n«"+shipData(id).ru+"» ваш",160);renderTab();saveGame(true);}};
      r.appendChild(b);}
    else r.appendChild(el("div","qt","ЗАКРЫТО · "+kpMinsToOpen()+" МИН"));
  }
  box.appendChild(r);
  return box;
}
