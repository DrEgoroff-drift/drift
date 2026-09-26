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
function kpTicket(o){return 11+(hashi(o.no|0,G.sx,0x7A1)>>>0)%60;}
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
/* ── окошко (D17, 18.09) ──
   Строка текста стала местом: окно с решёткой, часы над ним по времени
   почты, табличка часов на двери, талон с номером, если извещение ждёт.
   Закрыто — шторка опущена и часы показывают, сколько до открытия. */
function kpWindow(open,ticket){
  const w=240,h=96,k=panelNd();   /* плотность экрана, а не кадра: DPR игры урезан ради мира, окошку это мыло */
  const cv=document.createElement("canvas");cv.width=w*k;cv.height=h*k;cv.style.width=w+"px";cv.style.height=h+"px";cv.className="kp-win";
  /* окошко печётся на видеокарте (27i0): кисть та же, канва WebGPU */
  panelGpu(cv,w,h,k,c=>kpWindowPaint(c,w,h,open,ticket));
  return cv;
}
function kpWindowPaint(c,w,h,open,ticket){
  /* стена и окно */
  c.fillStyle="#d9cfb4";c.fillRect(0,0,w,h);
  c.fillStyle="rgba(120,100,70,.18)";for(let y=0;y<h;y+=12)c.fillRect(0,y,w,1);
  const wx=70,wy=22,ww=100,wh=62;
  c.fillStyle="#4a3f2c";c.fillRect(wx-4,wy-4,ww+8,wh+8);
  c.fillStyle=open?"#2b3038":"#8a7a5a";c.fillRect(wx,wy,ww,wh);
  if(open){
    /* за стеклом — тёплая лампа и силуэт клерка */
    const g=c.createRadialGradient(wx+ww*.6,wy+18,4,wx+ww*.6,wy+18,60);g.addColorStop(0,"rgba(255,220,160,.8)");g.addColorStop(1,"rgba(255,220,160,0)");
    c.fillStyle=g;c.fillRect(wx,wy,ww,wh);
    c.fillStyle="rgba(40,36,34,.95)";c.beginPath();c.arc(wx+ww*.55,wy+34,9,0,TAU);c.fill();c.fillRect(wx+ww*.55-14,wy+42,28,20);
    c.fillStyle="rgba(230,220,200,.9)";c.fillRect(wx+8,wy+wh-14,ww-16,8);           /* прилавок */
  }else{
    c.fillStyle="rgba(0,0,0,.25)";for(let y=wy+4;y<wy+wh;y+=6)c.fillRect(wx,y,ww,2);   /* шторка */
  }
  /* решётка */
  c.strokeStyle="rgba(200,190,170,.85)";c.lineWidth=2;
  for(let i=1;i<5;i++){c.beginPath();c.moveTo(wx+i*ww/5,wy);c.lineTo(wx+i*ww/5,wy+wh);c.stroke();}
  c.beginPath();c.moveTo(wx,wy+wh*.5);c.lineTo(wx+ww,wy+wh*.5);c.stroke();
  /* «ЗАКРЫТО» — табличкой на решётке: прямо по шторке его резали прутья и не читалось (26.09) */
  if(!open){
    c.fillStyle="#f4efe2";c.fillRect(wx+ww/2-26,wy+wh/2-8,52,16);
    c.strokeStyle="#2a2418";c.lineWidth=1;c.strokeRect(wx+ww/2-25.5,wy+wh/2-7.5,51,15);
    c.fillStyle="#2a2418";c.font="bold 9px ui-monospace,monospace";c.textAlign="center";c.textBaseline="middle";
    c.fillText("ЗАКРЫТО",wx+ww/2,wy+wh/2+.5);
  }
  /* часы над окном: почтовое время */
  const hr=kpHour(),mn=Math.floor(((now()%KP_DAY)/KP_DAY)*24*60)%60;
  c.fillStyle="#f4efe2";c.beginPath();c.arc(wx+ww/2,12,9,0,TAU);c.fill();
  c.strokeStyle="#2a2418";c.lineWidth=1;c.stroke();
  c.beginPath();c.moveTo(wx+ww/2,12);c.lineTo(wx+ww/2+Math.cos((hr%12)/12*TAU-Math.PI/2)*5,12+Math.sin((hr%12)/12*TAU-Math.PI/2)*5);c.stroke();
  c.beginPath();c.moveTo(wx+ww/2,12);c.lineTo(wx+ww/2+Math.cos(mn/60*TAU-Math.PI/2)*7.5,12+Math.sin(mn/60*TAU-Math.PI/2)*7.5);c.stroke();
  /* табличка часов на стене слева */
  const H=kpHours(G.sx,G.sy);
  c.fillStyle="#f4efe2";c.fillRect(8,30,52,30);c.strokeStyle="#2a2418";c.strokeRect(8.5,30.5,51,29);
  c.fillStyle="#2a2418";c.font="7px ui-monospace,monospace";c.textAlign="center";c.textBaseline="middle";
  c.fillText("ЧАСЫ РАБОТЫ",34,38);c.fillText(H[0]+":00–"+H[1]+":00",34,47);c.fillText("обед 13–14",34,55);
  /* талон справа */
  if(ticket){
    c.save();c.translate(206,52);c.rotate(-.12);
    c.fillStyle="#fbf7ec";c.fillRect(-20,-16,40,32);c.strokeStyle="#3b5a8a";c.lineWidth=1;c.strokeRect(-20,-16,40,32);
    c.fillStyle="#3b5a8a";c.font="6px ui-monospace,monospace";c.fillText("ТАЛОН",0,-8);
    c.font="bold 13px ui-monospace,monospace";c.fillText(String(ticket),0,5);
    c.restore();
  }
}
function kpBlock(){
  const o=(typeof stapelAll==="function")?stapelAll().o:null;
  const box=document.createElement("div");box.className="post";
  box.appendChild(el("div","sec","КОСМОПОЧТА · "+kpDoor()));
  const open=kpOpen();
  box.appendChild(kpWindow(open,o&&now()>=o.ready?kpTicket(o):0));
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
