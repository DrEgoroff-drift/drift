/* ══════════════ станция железной дороги в системе и вестибюль (M471–M472, DESIGN-metro §3) ══════════════
   Остановка — отдельный предмет системы в конце подъезда, за обычной станцией:
   КОЛЬЦО лежит, как порог полосы, к нему ведёт ГЛИССАДА — две цепочки огней,
   бегущих внутрь (движение, а не мигание); рядом — ВЕСТИБЮЛЬ, маленький
   блок, где швартуются.

   Стыковка — единственное пилотирование во всём этом: в трёхстах от кольца
   оклик «Станция «…». Стыковка?», ДЕЙСТВИЕ — и дальше медленно: скорость
   под меткой и корабль в конусе огней две секунды. Быстро — «Сбросьте
   скорость», без штрафа. Не выходит пять секунд — кольцо берёт само:
   «Автостыковка. Просьба не мешать», и в КНИЖКЕ «стыковка выполнена автоматикой».

   Вестибюль — одна страница: ТАБЛО, КУДА ВАМ, КАССА (цена на кнопке) и
   БУФЕТ (напиток и слух за пару кредитов). Ожидание — это интервал поезда:
   секунды в сердце, до минуты на краю.

   Сеть считается лениво (18e): пока она не готова, кольца в системе нет. */
const RAIL_RING_OFF=300;          /* кольцо — за станцией, на столько дальше от входа */
const RAIL_HAIL_R=300,RAIL_CONE_R=110,RAIL_SLOW=1.2;
const RAIL_BUFFET={gt:"лимонад «Звёздный»",co:"«Кола Партнёр™»",or:"вода минеральная, 0,33 л, № 2",
  km:"кофе с круассаном (круассаны закончились)",ra:"чай из общего котла",hf:"энергетик v4"};
let RAIL_DOCK=null,RAIL_WAIT=null;
function railReady(){if(!RAIL_NET&&typeof railNetPartial==="function")railNetPartial();return !!RAIL_NET;}
function railHere(){
  if(!G.sys||!G.sys.station||!railReady())return null;
  const S=railStation(G.sx,G.sy);if(!S)return null;
  const P=sysLane(G.sys);if(!P)return null;
  const x=P.st.x-P.ux*RAIL_RING_OFF,y=P.st.y-P.uy*RAIL_RING_OFF;
  return {S,x,y,ux:P.ux,uy:P.uy,name:G.sys.station.name,by:P.by};
}
/* ── рисунок: кольцо, глиссада, вестибюль ── */
function drawSysRail(zx,zy,Z){
  const R=railHere();if(!R)return;
  const x=zx(R.x),y=zy(R.y),s=clamp(Z,.5,1.5);
  if(x<-400||x>W+400||y<-400||y>H+400)return;
  const col=(typeof laneLampCol==="function")?laneLampCol(R.by):[255,190,110];
  const ts=G.t/60,fast=RAIL_WAIT&&RAIL_WAIT.t<3?3:1;
  /* глиссада: две цепочки ламп сходятся к кольцу со стороны станции */
  for(let i=0;i<9;i++){
    const d=70+i*28,w=10+i*4.5,ph=((ts*2.2*fast+i*.37)%1);
    const k=Math.max(0,1-Math.abs(ph-.5)*3);
    for(const sd of [-1,1]){
      const px=R.x+R.ux*d-R.uy*w*sd,py=R.y+R.uy*d+R.ux*w*sd;
      ctx.fillStyle=rgba(col,.25+.6*k);ctx.beginPath();ctx.arc(zx(px),zy(py),(1.2+1.2*k)*s,0,TAU);ctx.fill();
    }
  }
  /* кольцо: тор, лежащий плоско; внутри диск светлее и медленная спираль */
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle="rgba(40,52,66,.55)";ctx.beginPath();ctx.arc(0,0,40*s,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(170,190,210,.7)";ctx.lineWidth=5*s;ctx.beginPath();ctx.arc(0,0,44*s,0,TAU);ctx.stroke();
  ctx.strokeStyle="rgba(20,24,30,.9)";ctx.lineWidth=1.2*s;ctx.beginPath();ctx.arc(0,0,46.5*s,0,TAU);ctx.stroke();
  ctx.strokeStyle="rgba(127,230,216,"+(.10+.08*fast)+")";ctx.lineWidth=1;
  ctx.beginPath();
  for(let a=0;a<TAU*2.2;a+=.12){const r=4*s+a*5.5*s,t=a+ts*.4*fast;a?ctx.lineTo(Math.cos(t)*r,Math.sin(t)*r):ctx.moveTo(Math.cos(t)*r,Math.sin(t)*r);}
  ctx.stroke();
  for(let i=0;i<12;i++){const a=i/12*TAU;ctx.fillStyle=rgba(col,.55);ctx.fillRect(Math.cos(a)*44*s-1,Math.sin(a)*44*s-1,2,2);}
  ctx.restore();
  /* вестибюль сбоку и табличка с линией */
  const vx=zx(R.x-R.uy*70),vy=zy(R.y+R.ux*70);
  ctx.fillStyle="#1e2530";ctx.strokeStyle="rgba(0,0,0,.6)";ctx.lineWidth=1;
  ctx.fillRect(vx-16*s,vy-9*s,32*s,18*s);ctx.strokeRect(vx-16*s,vy-9*s,32*s,18*s);
  ctx.fillStyle="rgba(255,226,170,.8)";for(let i=0;i<4;i++)ctx.fillRect(vx-12*s+i*7*s,vy-3*s,4*s,3*s);
  ctx.fillStyle="rgba(242,178,92,.75)";ctx.font=uiFont(9);ctx.textAlign="center";
  ctx.fillText((R.S.metro?"МЕТРО · ":"")+R.S.lines[0].ru.toUpperCase()+(R.S.lines.length>1?" +"+(R.S.lines.length-1):""),x,y+58*s+10);
}
/* ── стыковка: оклик, конус, две секунды ── */
function railInteract(sh){
  const R=railHere();
  if(!R){RAIL_DOCK=null;return false;}
  if(railWinOpen())return true;
  const d=Math.hypot(sh.x-R.x,sh.y-R.y);
  if(d>RAIL_HAIL_R){RAIL_DOCK=null;return false;}
  if(!RAIL_DOCK){
    const shown=cue("СТАНЦИЯ «"+R.name.toUpperCase()+"» · "+(R.S.metro?"МЕТРО":"ЖЕЛЕЗНАЯ ДОРОГА")+"\nДЕЙСТВИЕ — СТЫКОВКА",CUE_ACT);
    if(shown&&actEdge)RAIL_DOCK={hold:0,t:0};
    return true;
  }
  const D=RAIL_DOCK;D.t++;
  const sp=Math.hypot(sh.vx,sh.vy),inCone=d<RAIL_CONE_R;
  if(sp<RAIL_SLOW&&inCone)D.hold++;else D.hold=0;
  if(D.hold>=120){railDocked(false);return true;}
  if(D.t>=300){railDocked(true);return true;}
  cue(sp>=RAIL_SLOW?"СБРОСЬТЕ СКОРОСТЬ":(!inCone?"ВОЙДИТЕ В КОНУС ОГНЕЙ":"ДЕРЖИТЕ · "+Math.ceil((120-D.hold)/60)+" С"),CUE_WARN);
  return true;
}
function railDocked(auto){
  RAIL_DOCK=null;const R=railHere();if(!R)return;
  G.ship.vx=G.ship.vy=0;G.ship.x=R.x-R.uy*70+R.ux*30;G.ship.y=R.y+R.ux*70+R.uy*30;
  if(auto){say("Автостыковка\nпросьба не мешать",120);
    if(typeof recordAdd==="function")recordAdd("станция «"+R.name+"»","стыковка выполнена автоматикой.");}
  else say("ПРИНЯТО",60);
  railWinShow();
}
/* ── вестибюль: одна страница ── */
function railInterval(sx,sy){const r=Math.hypot(sx,sy);const I=r<=RAIL_METRO_R?10:Math.round(30+60*clamp((r-12)/28,0,1));
  return (typeof rushAt==="function"&&rushAt(sx,sy))?Math.max(5,Math.round(I/2)):I;}   /* ажиотаж: дополнительный поезд (M504) */
function railWaitNow(sx,sy){const I=railInterval(sx,sy);return Math.ceil(I-((G.t/60)%I));}
function railFmt(s){return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function railStopName(st){const s=getSystem(st.sx,st.sy),base=s.station?s.station.name:s.name;
  return (st.halt?"полустанок "+base:(typeof ownerName==="function"?ownerName(base,st.sx,st.sy):base));}   /* по хозяину земли (M489) */
/* куда можно доехать отсюда: по каждой линии до шести остановок в обе стороны */
function railDestinations(){
  const out=[],me=G.sx+","+G.sy;
  for(const l of railStation(G.sx,G.sy).lines){
    const n=l.stops.length,i0=l.stops.findIndex(s=>s.sx+","+s.sy===me);if(i0<0)continue;
    for(const dir of [1,-1])for(let k=1;k<=6;k++){
      let i=i0+dir*k;
      if(l.loop)i=((i%n)+n)%n;else if(i<0||i>=n)break;
      if(i===i0)break;
      let dist=0;for(let m=0;m<k;m++){const a=l.stops[l.loop?((i0+dir*m)%n+n)%n:i0+dir*m],b=l.stops[l.loop?((i0+dir*(m+1))%n+n)%n:i0+dir*(m+1)];dist+=Math.hypot(a.sx-b.sx,a.sy-b.sy);}
      out.push({l,i0,i1:i,dir,k,dist,to:l.stops[i]});
    }
  }
  return out;
}
function railFare(t){
  const metro=Math.hypot(G.sx,G.sy)<=RAIL_METRO_R&&Math.hypot(t.to.sx,t.to.sy)<=RAIL_METRO_R;
  const fare=metro?5:Math.max(4,Math.round(2*t.dist));
  const bag=metro?0:Math.ceil(held()/5);
  const F={fare,bag,sum:fare+bag,metro};
  return (typeof railPassFare==="function")?railPassFare(F):F;   /* проездной (M500) */
}
function railWinOpen(){const w=typeof document!=="undefined"&&document.getElementById("railWin");return !!(w&&w.classList.contains("open"));}
function railWinClose(){const w=document.getElementById("railWin");if(w)w.classList.remove("open");RAIL_WAIT=null;}
function railWinShow(){
  let w=document.getElementById("railWin");
  if(!w){w=document.createElement("div");w.id="railWin";document.body.appendChild(w);}
  w.classList.add("open");railWinRender();
}
function railWinRender(){
  const w=document.getElementById("railWin");if(!w)return;
  const R=railHere();if(!R){railWinClose();return;}
  const by=R.by,S=R.S;
  let h="<div class='rw-head'><b>СТАНЦИЯ «"+R.name.toUpperCase()+"»</b><s>"+S.lines.map(l=>l.ru).join(" · ")+(S.junction?" · ПЕРЕСАДКА":"")+"</s></div>";
  h+="<div class='rw-sec'>ТАБЛО</div><div class='rw-board'>";
  for(const l of S.lines)h+="<div><span>"+(S.metro?"МЕТРО":"ЭЛЕКТРИЧКА")+" · "+l.ru+"</span><em>"+(RAIL_WAIT&&RAIL_WAIT.l===l?"ваш · через "+railFmt(Math.ceil(RAIL_WAIT.t)):"через "+railFmt(railWaitNow(G.sx,G.sy)))+"</em></div>";
  h+="</div>";
  if(RAIL_WAIT){
    h+="<div class='rw-sec'>ВАШ ПОЕЗД</div><div class='rw-row'><span>до «"+railStopName(RAIL_WAIT.to)+"» · "+RAIL_WAIT.k+" "+pl3(RAIL_WAIT.k,"остановка","остановки","остановок")+"</span><em>поезд прибывает через "+Math.ceil(RAIL_WAIT.t)+" с</em></div>";
  }else{
    h+="<div class='rw-sec'>КУДА ВАМ · КАССА</div>";
    const why=(typeof railClosedWhy==="function")?railClosedWhy():null;   /* Коммуна: обед, забастовка (M474) */
    if(why)h+="<div class='rw-row'><span>"+why+"</span><em>приходите позже</em></div>";
    else railDestinations().slice(0,14).forEach((t,i)=>{
      const F=railFare(t);
      h+="<button class='act rw-go' data-i='"+i+"'>ДО «"+railStopName(t.to).toUpperCase()+"» · "+t.k+" ОСТ. · "+F.fare+" КР"+(F.bag?" + БАГАЖ "+F.bag:"")+"<s>"+t.l.ru+"</s></button>";
      /* Компания: тот же путь экспрессом — без остановок, ×10, реклама под ценой */
      if(typeof railOwner==="function"&&railOwner()==="co"&&t.k>=2)
        h+="<button class='act rw-go' data-i='"+i+"' data-x='1'>EXPRESS™ ДО «"+railStopName(t.to).toUpperCase()+"» · "+(F.fare*RAIL_EXPRESS_MUL)+" КР<s>на три секунды быстрее!</s></button>";
    });
  }
  if(typeof railLifeHtml==="function")h+=railLifeHtml();   /* посылка, проездной, попутчик, пломба (M499–M508) */
  h+="<div class='rw-sec'>БУФЕТ</div><button class='act rw-buf'>"+(RAIL_BUFFET[by]||RAIL_BUFFET.gt).toUpperCase()+" · 3 КР</button>";
  h+="<button class='act rw-out'>ВЫЙТИ НА ПЕРРОН</button>";
  w.innerHTML=h;
  if(typeof railLifeBind==="function")railLifeBind(w);
  const D=railDestinations();
  w.querySelectorAll(".rw-go").forEach(b=>b.onclick=()=>railBuy(D[+b.dataset.i],!!b.dataset.x));
  w.querySelector(".rw-buf").onclick=railBuffet;
  w.querySelector(".rw-out").onclick=railWinClose;
}
function railBuy(t,express){
  if(!t||RAIL_WAIT)return;
  if(typeof railDeclare==="function"&&!railDeclare(t))return;   /* Орднунг: сначала декларация (M474) */
  const F=railFare(t);
  if(express){F.fare*=RAIL_EXPRESS_MUL;F.sum=F.fare+F.bag;}
  if(G.credits<F.sum){say("Не хватает на билет\nнужно "+F.sum+" кр",90);return;}
  G.credits-=F.sum;
  if(typeof railLifeBoard==="function")railLifeBoard(t,F);
  logAdd("money",(F.metro?"Жетон":"Билет")+" до «"+railStopName(t.to)+"» · −"+F.sum+" кр"+(F.bag?" (багаж "+F.bag+")":""));
  RAIL_WAIT={...t,express:!!express,t:railWaitNow(G.sx,G.sy)};
  railWinRender();
}
function railBuffet(){
  if(G.credits<3){say("Буфет: «мелочи нет? и у нас нет»",90);return;}
  G.credits-=3;
  const L=(typeof rumoursHere==="function")?rumoursHere():[];
  const line=L.length?"говорят, есть "+L[Math.floor(rnd()*L.length)].short:"сегодня ничего не говорят, пейте молча";
  peopleLine(line,"буфетчица",true);
}
/* интервал идёт в кадре системы: поезд пришёл — отправление */
function railTick(dt){
  if(!RAIL_WAIT)return;
  RAIL_WAIT.t-=dt/60;
  if((G.t|0)%20===0)railWinRender();
  if(RAIL_WAIT.t<=0){const t=RAIL_WAIT;RAIL_WAIT=null;railWinClose();if(typeof railRideStart==="function")railRideStart(t);}
}
