/* ══════════════ свой торговый маршрут ══════════════
   У фактора маршрут был всегда (M84): он ищет спред и возит объём, а игрок
   видел строчку в карточке домена. Собственного маршрута у игрока не было —
   он держал «где дешёвый титан» в голове и на бумажке рядом с клавиатурой.

   Здесь маршрут становится ПРЕДМЕТОМ. Игрок отмечает 2–4 станции, игра считает
   по живым ценам (`marketFor`), что на каком плече брать и почём сдавать,
   сколько это даёт за круг и сколько стоит топлива. Маршрут лежит на карте
   линией со стрелками, а не списком; его можно отдать фактору, продать
   скупщику информации — и потерять, потому что проданный маршрут уходит с
   карты и на нём начинают работать чужие.

   Правило, ради которого всё: маршрут ВЕТШАЕТ. Возить по одному кругу — значит
   давить цену там, куда сдаёшь (это рынок умеет с M84), поэтому круг с каждым
   разом тоньше и его приходится перепланировать. Иначе это станок для денег. */
const ROUTE_MAX=4;
function routeInit(){return{legs:[],loops:0,cursor:0,sold:0};}
function routeOf(){if(!G.trade)G.trade=routeInit();return G.trade;}
function routeHas(sx,sy){return routeOf().legs.indexOf(sx+","+sy)>=0;}
/* ── отметить или снять плечо ──
   Плечом может быть только система со станцией: маршрут — это торговля, а не
   список любимых мест. Возвращает строку для игрока, а не молчит. */
function routeToggle(sx,sy){
  const R=routeOf(),key=sx+","+sy,i=R.legs.indexOf(key);
  if(i>=0){
    R.legs.splice(i,1);R.cursor=0;
    return"Плечо снято · в маршруте "+R.legs.length;
  }
  const s=getSystem(sx,sy);
  if(!s||!s.station)return"Здесь нет станции — плечо ставить не на что";
  if(R.legs.length>=ROUTE_MAX)return"В маршруте уже "+ROUTE_MAX+" плеча — снимите лишнее";
  R.legs.push(key);R.cursor=0;
  /* новый маршрут — это новая бумага: круги, накрученные по старому кольцу,
     к нему не относятся */
  if(R.legs.length===2)R.loops=0;
  return"Плечо: «"+s.station.name+"» · в маршруте "+R.legs.length;
}
function routeSys(){
  const out=[];
  for(const key of routeOf().legs){
    const[sx,sy]=key.split(",").map(Number);
    const s=getSystem(sx,sy);
    if(s&&s.station)out.push(s);
  }
  return out;
}
/* ── что везти на каждом плече ──
   Кольцо, а не отрезок: последнее плечо замыкается на первое, потому что
   возвращаться всё равно придётся, и обратный ход — половина дохода. На каждом
   плече ищем товар с лучшей ОТНОСИТЕЛЬНОЙ наценкой (та же арифметика, что у
   домена: он возит объём, и дешёвый товар зарабатывает наравне с дорогим).
   Объём ограничен трюмом и кошельком — маршрут считается для этого корабля,
   а не для абстрактного. */
function routeLegs(){
  const sys=routeSys();
  if(sys.length<2)return[];
  const pr=sys.map(marketFor);
  const st=stat(),hold=st.cargoMax;
  const out=[];
  const n=sys.length,cnt=n===2?2:n;
  for(let i=0;i<cnt;i++){
    const a=i,b=(i+1)%n;
    let best=null;
    for(const k of TRADE_KEYS){
      const buy=pr[a][k],sell=pr[b][k];
      if(sell<=buy)continue;
      const rel=(sell-buy)/Math.max(1,buy);
      if(!best||rel>best.rel)best={k,buy,sell,rel};
    }
    const d=Math.hypot(sys[b].sx-sys[a].sx,sys[b].sy-sys[a].sy);
    const leg={from:sys[a],to:sys[b],dist:d,fuel:Math.round(9+d*13),
               k:best?best.k:null,buy:best?best.buy:0,sell:best?best.sell:0,
               rel:best?best.rel:0,qty:0,net:0};
    if(best){
      const afford=Math.floor(G.credits/Math.max(1,best.buy));
      leg.qty=Math.max(0,Math.min(hold,afford));
      leg.net=leg.qty*(best.sell-best.buy);
      /* «полный трюм» считается отдельно от «на что хватит денег»: первое — это
         цена самого СВЕДЕНИЯ (у покупателя свой кошелёк), второе — то, что
         игрок увезёт сегодня. Смешивать их значит продавать спред дешевле,
         когда сам на мели, — а спред от чужой бедности не зависит. */
      leg.full=hold*(best.sell-best.buy);
    }else leg.full=0;
    out.push(leg);
  }
  return out;
}
/* Сводка за круг: чистыми, за вычетом топлива. Топливо здесь не мелочь — на
   дальнем кольце оно съедает всю наценку, и это единственное, что удерживает
   игрока от маршрута через полгалактики. */
function routeSum(){
  const legs=routeLegs();
  let gross=0,full=0,fuel=0,dist=0;
  for(const l of legs){gross+=l.net;full+=l.full||0;fuel+=l.fuel;dist+=l.dist;}
  const fp=G.st?G.st.fuelPrice:12;
  return{legs,gross,fuel,dist,jumps:legs.length,
         net:Math.round(gross-fuel*fp),cost:Math.round(fuel*fp),
         full:Math.round(full-fuel*fp)};
}
/* ── круг пройден ──
   Считаем не «побывал на станции», а «прошёл кольцо по порядку»: маршрут — это
   порядок, иначе кругом считалась бы любая пара стыковок. */
function routeVisit(sys){
  const R=routeOf();
  if(R.legs.length<2||!sys)return;
  const key=sys.sx+","+sys.sy,i=R.legs.indexOf(key);
  if(i<0)return;
  if(i===R.cursor%R.legs.length){
    R.cursor++;
    if(R.cursor%R.legs.length===0){
      R.loops++;
      logAdd("money","Круг маршрута пройден · всего кругов: "+R.loops);
    }
  }else R.cursor=i;   // сбились с порядка — считаем отсюда, а не наказываем
}
/* ── цена бумаги ──
   Маршрут продают не как доход, а как ЗНАНИЕ: столько, сколько он даёт за
   несколько кругов, и тем дешевле, чем больше кругов по нему уже накатано —
   свежий спред стоит денег, выдоенный не стоит ничего. */
function routeValue(){
  const S=routeSum();
  if(S.full<=0)return 0;
  return Math.max(0,Math.round(S.full*3.2*Math.pow(.82,routeOf().loops)));
}
/* Проданный маршрут уходит с карты, и по нему начинают работать чужие: цена в
   точках сдачи оседает так же, как её осаживает фактор. Продать — значит
   потерять, и это честная цена за разовые деньги. */
function routeSell(){
  const R=routeOf(),price=routeValue();
  if(R.legs.length<2||price<=0)return 0;
  for(const l of routeLegs()){
    if(!l.k)continue;
    const mk=G.market[l.to.key];
    if(mk)mk.pressure[l.k]=clamp((mk.pressure[l.k]||0)-.14,-.35,0);
  }
  earn(price,"trade");
  R.sold=(R.sold|0)+1;R.legs=[];R.cursor=0;R.loops=0;
  return price;
}
/* Отдать маршрут фактору: он возит его сам, а вы больше не возите. Домен берёт
   столько плеч, сколько ему позволяет уровень и перк «плечо» — остальное он
   просто не увезёт, и врать об этом не надо. */
function routeToFactor(){
  const m=typeof mgrOf==="function"?mgrOf("fact"):null;
  if(!m||m.stalled)return 0;
  const R=routeOf();
  if(R.legs.length<2)return 0;
  const cap=mgrRouteMax(m);
  m.route=R.legs.slice(0,cap);
  const n=m.route.length;
  mgrSay(m,"Маршрут принят: "+n+" плеча — веду сам");
  R.legs=[];R.cursor=0;R.loops=0;
  return n;
}
/* ── маршрут на карте ──
   Линия со стрелками, а не список: направление обхода — это половина смысла.
   Цвет бирюзовый, потому что это намерение игрока, как и курс прыжка; у домена
   маршрут янтарный, и путать их нельзя. */
function drawRouteMap(vis){
  const R=routeOf();
  if(R.legs.length<2)return;
  const at=key=>{
    const[sx,sy]=key.split(",").map(Number);
    return vis.find(v=>v.gx===sx&&v.gy===sy)||null;
  };
  const pts=R.legs.map(at);
  const col="rgba(127,230,216,";
  const S=routeSum();
  let bestLeg=null;
  for(const l of S.legs)if(l.net>0&&(!bestLeg||l.net>bestLeg.net))bestLeg=l;
  ctx.save();
  ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";
  S.legs.forEach((l,i)=>{
    const a=at(l.from.sx+","+l.from.sy),b=at(l.to.sx+","+l.to.sy);
    if(!a||!b||a===b)return;
    ctx.strokeStyle=col+(l.net>0?".7)":".28)");ctx.lineWidth=l.net>0?1.8:1;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    /* стрелка на середине плеча: куда везём */
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,an=Math.atan2(b.y-a.y,b.x-a.x);
    ctx.fillStyle=col+(l.net>0?".85)":".35)");
    ctx.beginPath();
    ctx.moveTo(mx+Math.cos(an)*7,my+Math.sin(an)*7);
    ctx.lineTo(mx+Math.cos(an+2.5)*6,my+Math.sin(an+2.5)*6);
    ctx.lineTo(mx+Math.cos(an-2.5)*6,my+Math.sin(an-2.5)*6);
    ctx.closePath();ctx.fill();
    /* подпись — только на ЛУЧШЕМ плече. Три плашки на трёх плечах налезали
       друг на друга и на цену прыжка: карта превращалась в таблицу, а таблица
       у нас на станции. Одна подпись отвечает на единственный вопрос, с которым
       на маршрут смотрят, — «где сейчас берут». */
    if(l===bestLeg){
      const label=RES[l.k].ru.toUpperCase()+" "+l.buy+" → "+l.sell;
      const tw=ctx.measureText(label).width;
      const lx=mx+Math.cos(an+Math.PI/2)*14,ly=my+Math.sin(an+Math.PI/2)*14;
      ctx.fillStyle="rgba(6,10,16,.85)";ctx.fillRect(lx-tw/2-6,ly-8,tw+12,16);
      ctx.strokeStyle=col+".4)";ctx.lineWidth=1;ctx.strokeRect(lx-tw/2-5.5,ly-7.5,tw+11,15);
      ctx.fillStyle="#7fe6d8";ctx.fillText(label,lx,ly+.5);
    }
  });
  /* номер плеча в кружке: порядок обхода читается без подписи */
  pts.forEach((p,i)=>{
    if(!p)return;
    ctx.strokeStyle=col+".8)";ctx.lineWidth=1.2;
    ctx.beginPath();ctx.arc(p.x,p.y,11,0,TAU);ctx.stroke();
    ctx.fillStyle="rgba(6,10,16,.8)";
    ctx.beginPath();ctx.arc(p.x,p.y,11,0,TAU);ctx.fill();
    ctx.fillStyle="#7fe6d8";ctx.fillText(String(i+1),p.x,p.y+.5);
  });
  ctx.textBaseline="alphabetic";
  ctx.restore();
}
/* Строка сводки для карты и для станции — один источник правды на два экрана */
function routeLine(){
  const R=routeOf();
  if(R.legs.length<2)return"МАРШРУТ: отметьте ещё "+(2-R.legs.length)+" станцию";
  const S=routeSum();
  return"МАРШРУТ "+R.legs.length+" ПЛЕЧА · ЗА КРУГ "+
    (S.net>0?"+"+S.net.toLocaleString("ru"):String(S.net))+" КР · ТОПЛИВА "+S.fuel+
    (R.loops?" · КРУГОВ "+R.loops:"");
}
/* ── свой маршрут на станции ──
   На карте маршрут — линия, здесь — счёт: что брать на этом плече, сколько это
   даёт за круг и что с ним можно сделать, кроме как возить самому. Пустой
   маршрут не молчит: он объясняет, где его завести, иначе половина игроков
   никогда не узнает, что кнопка на карте что-то значит. */
function renderRoute(){
  const R=routeOf();
  if(R.legs.length<2){
    $body.appendChild(el("div","sec","СВОЙ МАРШРУТ"));
    /* Одна строка вместо трёх. Учить она не перестала — просто перестала
       занимать блок в полэкрана ради того, чего у игрока нет (проход «глаз»:
       пустое состояние не должно быть громче содержимого). */
    $body.appendChild(el("div","row","<div class='nm'><b>Маршрута нет</b><s>"+
      "отметьте на карте 2–4 станции кнопкой «В МАРШРУТ» — игра посчитает по живым ценам, что и куда везти"+
      (R.legs.length?" · сейчас отмечено плеч: "+R.legs.length:"")+"</s></div>"));
    return;
  }
  const S=routeSum();
  $body.appendChild(el("div","sec",routeLine()));
  S.legs.forEach((l,i)=>{
    const r=el("div","row");
    const head="<b>"+(i+1)+". «"+l.from.station.name+"» → «"+l.to.station.name+"»</b>";
    r.appendChild(el("div","nm",head+"<s>"+(l.k
      ?"<span style='color:"+RES[l.k].col+"'>"+RES[l.k].ru+"</span> "+l.buy+" → "+l.sell+
       " кр · "+Math.round(l.rel*100)+"% · "+l.fuel+" топлива"
      :"цены сошлись — везти нечего · "+l.fuel+" топлива")+"</s>"));
    r.appendChild(el("div","qt",(l.net>0?"+"+l.net.toLocaleString("ru"):"—")+
      "<s>"+(l.qty?l.qty+" ед":"")+"</s>"));
    $body.appendChild(r);
  });
  /* Круги накатываются — и наценка садится: это видно строкой, а не в справке */
  if(R.loops>=2)$body.appendChild(el("div","row","<div class='nm'><b>Маршрут накатан</b><s>"+
    "кругов пройдено: "+R.loops+" — вы сами продавили цены там, куда возите.<br>"+
    "Спред восстанавливается сам, но быстрее сменить плечо</s></div>"));
  const price=routeValue();
  const rr=el("div","row");
  rr.appendChild(el("div","nm","<b>Продать сведения о маршруте</b><s>"+
    "скупщик заплатит за спред и сам начнёт по нему возить:<br>"+
    "маршрут уходит с карты, цены на нём осядут</s>"));
  rr.appendChild(el("div","qt",price.toLocaleString("ru")+"<s>кр</s>"));
  const sb=el("button","act"+(price>0?" gold":""),"ПРОДАТЬ");
  if(price<=0)sb.disabled=true;
  sb.onclick=()=>{
    const got=routeSell();
    if(got)tell("money","Маршрут продан на «"+G.st.name+"» · +"+got.toLocaleString("ru")+" кр",
                "Маршрут продан\n+"+got.toLocaleString("ru")+" кр");
    renderTab();
  };
  rr.appendChild(sb);$body.appendChild(rr);
  const F=typeof mgrOf==="function"?mgrOf("fact"):null;
  if(F&&!F.stalled){
    const fr=el("div","row");
    fr.appendChild(el("div","nm","<b>Отдать фактору</b><s>"+
      "он возьмёт "+mgrRouteMax(F)+" плеча и повезёт сам —<br>"+
      "маршрут перестанет быть вашим</s>"));
    const fb=el("button","act","ОТДАТЬ");
    fb.onclick=()=>{
      const n=routeToFactor();
      if(n)tell("tech","Маршрут передан фактору · плеч: "+n,"Маршрут у фактора\nплеч: "+n);
      renderTab();
    };
    fr.appendChild(fb);$body.appendChild(fr);
  }
}
