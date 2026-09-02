/* ══════════════ свой торговый маршрут ══════════════
   У фактора маршрут был всегда (M84): он ищет спред и возит объём, а игрок
   видел строчку в карточке домена. Собственного маршрута у игрока не было —
   он держал «где дешёвый титан» в голове и на бумажке рядом с клавиатурой.

   Здесь маршрут становится ПРЕДМЕТОМ. Игрок отмечает 2–6 станций, игра считает,
   что на каком плече брать и почём сдавать, сколько это даёт за круг и сколько
   стоит топлива. Маршрут лежит на карте линией со стрелками, а не списком; его
   можно отдать фактору, продать скупщику информации — и потерять, потому что
   проданный маршрут уходит с карты и на нём начинают работать чужие.

   M289 — маршрут стал НАРЯДОМ, а не калькулятором (DESIGN-holding §2):
   R1. Плечо ставится только там, где цены видели своими глазами: плечо
       КОПИРУЕТ запись со стола в себя ({day, p}) и считает по ней, а не по
       живому рынку любой станции. Старая запись показывается вилкой
       («титан 41…58 · записи 6 дней»). Услышанное по эфиру плеча не основывает.
   R2. «В МАРШРУТ» значит «я туда иду» — и это другой глагол, чем КУРС (прыжок
       никогда не отказывает). Номера на звёздах с ПЕРВОГО плеча, следующее
       плечо подсвечено, подвал карты говорит «СЛЕДУЮЩЕЕ ПЛЕЧО · … · везём титан».
   R3. Станция знает о маршруте: первым рядом «ПО МАРШРУТУ · взять/сдать ×N».
   R4. Продаётся только прохоженный маршрут — за долю того, что он ЗАРАБОТАЛ
       вам (earned копится с каждой сдачи по маршруту), не раньше двух кругов;
       ту же дорогу (≥2 общих плеча) не купят дважды.
   R5. Фактору тоже отдаётся только прохоженный.

   Правило, ради которого всё: маршрут ВЕТШАЕТ. Возить по одному кругу — значит
   давить цену там, куда сдаёшь (это рынок умеет с M84), поэтому круг с каждым
   разом тоньше и его приходится перепланировать. Иначе это станок для денег. */
const ROUTE_MAX=6;   /* цепочка снизу доверху — пять станций (§16.4); кольцо из четырёх её не вместит */
function routeInit(){return{legs:[],loops:0,cursor:0,sold:0,notes:{},earned:0,soldSets:[]};}
function routeOf(){
  if(!G.trade)G.trade=routeInit();
  const R=G.trade;
  if(!R.notes)R.notes={};
  if(!R.soldSets)R.soldSets=[];
  if(!R.earned)R.earned=0;
  return R;
}
function routeHas(sx,sy){return routeOf().legs.indexOf(sx+","+sy)>=0;}
function routePl(n,f){n=Math.abs(n)%100;const d=n%10;
  return f[(n>10&&n<20)?2:(d===1?0:(d>=2&&d<=4?1:2))];}
/* ── запись цен, по которой плечо имеет право стоять ──
   Виденное своими глазами: полный прейскурант со стыковки. Строка «со слуха»
   знает один товар и не знает остального — по ней нельзя ни считать, ни лететь. */
function routeNoteFor(sx,sy){
  const S=G.seenPrices&&G.seenPrices[sx+","+sy];
  if(!S||S.heard||!S.p)return null;
  return S;
}
/* Заметка плеча: своя копия. Старые сохранения (до M289) плечи без заметок
   несут — им дописывается то, что лежит на столе, а если и там пусто, живая
   цена этого дня: маршрут не пропадает у игрока из-за смены формата. */
function routeNote(key,sys){
  const R=routeOf();
  let n=R.notes[key];
  if(n&&n.p)return n;
  const S=G.seenPrices&&G.seenPrices[key];
  n=(S&&!S.heard&&S.p)?{day:S.day,p:Object.assign({},S.p)}
    :{day:celDay(),p:Object.assign({},marketFor(sys))};
  R.notes[key]=n;
  return n;
}
/* вилка старой записи: ±3% в день, не шире ±40% */
function routeFork(note){
  const age=Math.max(0,celDay()-(note.day|0));
  return Math.min(.4,age*.03);
}
function routeForkTxt(p,fork){
  if(!fork||p<=0)return String(p);
  return Math.round(p*(1-fork))+"…"+Math.round(p*(1+fork));
}
/* ── отметить или снять плечо ──
   Плечом может быть только система со станцией, чьи цены видели: маршрут — это
   торговля по своим записям, а не список любимых мест. Возвращает строку для
   игрока, а не молчит. */
function routeToggle(sx,sy){
  const R=routeOf(),key=sx+","+sy,i=R.legs.indexOf(key);
  if(i>=0){
    R.legs.splice(i,1);delete R.notes[key];R.cursor=0;
    return"Плечо снято · в маршруте "+R.legs.length;
  }
  const s=getSystem(sx,sy);
  if(!s||!s.station)return"Здесь нет станции — плечо ставить не на что";
  const note=routeNoteFor(sx,sy);
  if(!note)return"Цен «"+s.station.name+"» вы не видели — плечо ставится после стыковки";
  if(R.legs.length>=ROUTE_MAX)return"В маршруте уже "+ROUTE_MAX+" плеч — снимите лишнее";
  R.legs.push(key);R.cursor=0;
  R.notes[key]={day:note.day,p:Object.assign({},note.p)};
  /* новый маршрут — это новая бумага: круги и заработок, накрученные по
     старому кольцу, к нему не относятся */
  if(R.legs.length===2){R.loops=0;R.earned=0;}
  return"Плечо: «"+s.station.name+"» · в маршруте "+R.legs.length+
    (R.legs.length===1?" · отметьте вторую станцию":"");
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
   Считается по ЗАПИСЯМ плеч, а не по живому рынку: это ваши сведения, с их
   датой и их вилкой. Объём ограничен трюмом и кошельком — маршрут считается
   для этого корабля, а не для абстрактного. Цена взятия — с наценкой прилавка
   (BUY_SPREAD): станция продаёт дороже, чем берёт. */
function routeLegs(){
  const sys=routeSys();
  if(sys.length<2)return[];
  const notes=sys.map(s=>routeNote(s.key,s));
  const st=stat(),hold=st.cargoMax;
  const out=[];
  const n=sys.length,cnt=n===2?2:n;
  for(let i=0;i<cnt;i++){
    const a=i,b=(i+1)%n;
    let best=null;
    for(const k of TRADE_KEYS){
      const buy=Math.round((notes[a].p[k]||0)*BUY_SPREAD),sell=notes[b].p[k]||0;
      if(!buy||sell<=buy)continue;
      const rel=(sell-buy)/Math.max(1,buy);
      if(!best||rel>best.rel)best={k,buy,sell,rel};
    }
    const d=Math.hypot(sys[b].sx-sys[a].sx,sys[b].sy-sys[a].sy);
    const leg={from:sys[a],to:sys[b],dist:d,fuel:Math.round(9+d*13),
               k:best?best.k:null,buy:best?best.buy:0,sell:best?best.sell:0,
               rel:best?best.rel:0,qty:0,net:0,
               forkA:routeFork(notes[a]),forkB:routeFork(notes[b]),
               dayA:notes[a].day,dayB:notes[b].day};
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
/* ── следующее плечо ──
   Куда лететь сейчас и что туда везём: станция по курсору обхода и плечо,
   которое в неё ВХОДИТ. Один источник правды для подвала карты, подсветки
   на карте и ряда «ПО МАРШРУТУ» на станции. */
function routeNext(){
  const R=routeOf(),sys=routeSys();
  if(!sys.length)return null;
  const n=sys.length,idx=R.cursor%n,to=sys[idx];
  const legs=routeLegs();
  const inLeg=legs.length?legs[(idx-1+n)%n]:null;
  const outLeg=legs.length?legs[idx]:null;
  const d=Math.hypot(to.sx-G.sx,to.sy-G.sy);
  const jumps=d>0?Math.max(1,Math.ceil(d/Math.max(.5,stat().jump))):0;
  return{sys:to,key:to.key,idx,inLeg,outLeg,dist:d,jumps};
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
/* ── что маршрут заработал ──
   Пишется с каждой сдачи на станции маршрута того товара, который сюда
   везут по плечу: выручка минус то, что товар стоил по записи плеча. Нужда
   ×2 не считается: удача — не дорога, и скупщик за неё не платит. */
function routeEarn(sys,k,qty,revenue,underNeed){
  const R=routeOf();
  if(R.legs.length<2||!sys||underNeed)return;
  const i=R.legs.indexOf(sys.key);if(i<0)return;
  const legs=routeLegs(),n=R.legs.length;
  const inLeg=legs[(i-1+n)%n];
  if(!inLeg||inLeg.k!==k)return;
  R.earned+=Math.round(revenue-qty*inLeg.buy);
}
/* ── цена бумаги ──
   Маршрут продают не как доход, а как ДОРОГУ, которую прошли: два средних
   круга из того, что она вам принесла. Непрохоженный не стоит ничего, и
   ту же дорогу — с двумя и более общими плечами — не покупают дважды. */
function routeSoldBefore(legs){
  for(const set of routeOf().soldSets){
    let common=0;for(const k of legs)if(set.indexOf(k)>=0)common++;
    if(common>=2)return true;
  }
  return false;
}
function routeWhyNoPrice(){
  const R=routeOf();
  if(R.legs.length<2)return"маршрут короче двух плеч";
  if(routeSoldBefore(R.legs))return"эту дорогу уже покупали";
  if(R.loops<2)return"пройдите два круга — скупщик платит за дорогу, а не за бумагу";
  if(R.earned<=0)return"маршрут пока ничего не принёс";
  return"";
}
function routeValue(){
  if(routeWhyNoPrice())return 0;
  const R=routeOf();
  return Math.max(0,Math.round(R.earned/R.loops*2));
}
/* Проданный маршрут уходит с карты, и по нему начинают работать чужие: цена в
   точках сдачи оседает так же, как её осаживает фактор. Продать — значит
   потерять, и это честная цена за разовые деньги. Набор плеч запоминается:
   по нему скупщик узнаёт ту же дорогу, а баржа (шаг 6) получит свои плечи. */
function routeSell(){
  const R=routeOf(),price=routeValue();
  if(R.legs.length<2||price<=0)return 0;
  for(const l of routeLegs()){
    if(!l.k)continue;
    const mk=G.market[l.to.key];
    if(mk)mk.pressure[l.k]=clamp((mk.pressure[l.k]||0)-.14,-.35,0);
  }
  earn(price,"trade");
  R.sold=(R.sold|0)+1;R.soldSets.push(R.legs.slice());
  R.legs=[];R.notes={};R.cursor=0;R.loops=0;R.earned=0;
  return price;
}
/* Отдать маршрут фактору: он возит его сам, а вы больше не возите. Домен берёт
   столько плеч, сколько ему позволяет уровень и перк «плечо» — остальное он
   просто не увезёт, и врать об этом не надо. Непрохоженный он не берёт: он
   ведёт дорогу, а не бумагу. */
function routeToFactor(){
  const m=typeof mgrOf==="function"?mgrOf("fact"):null;
  if(!m||m.stalled)return 0;
  const R=routeOf();
  if(R.legs.length<2||R.loops<1)return 0;
  const cap=mgrRouteMax(m);
  m.route=R.legs.slice(0,cap);
  const n=m.route.length;
  mgrSay(m,"Маршрут принят: "+n+" "+routePl(n,["плечо","плеча","плеч"])+" — веду сам");
  R.legs=[];R.notes={};R.cursor=0;R.loops=0;R.earned=0;
  return n;
}
/* ── маршрут на карте ──
   Линия со стрелками, а не список: направление обхода — это половина смысла.
   Цвет бирюзовый, потому что это намерение игрока, как и курс прыжка; у домена
   маршрут янтарный, и путать их нельзя. Номер на звезде — с ПЕРВОГО плеча:
   после первого тычка карта обязана измениться. Следующее плечо — залито. */
function drawRouteMap(vis){
  const R=routeOf();
  if(R.legs.length<1)return;
  const at=key=>{
    const[sx,sy]=key.split(",").map(Number);
    return vis.find(v=>v.gx===sx&&v.gy===sy)||null;
  };
  const pts=R.legs.map(at);
  const col="rgba(127,230,216,";
  const NX=routeNext();
  ctx.save();
  ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";
  if(R.legs.length>=2){
    const S=routeSum();
    let bestLeg=null;
    for(const l of S.legs)if(l.net>0&&(!bestLeg||l.net>bestLeg.net))bestLeg=l;
    S.legs.forEach((l,i)=>{
      const a=at(l.from.sx+","+l.from.sy),b=at(l.to.sx+","+l.to.sy);
      if(!a||!b||a===b)return;
      const next=NX&&NX.inLeg===l;
      ctx.strokeStyle=col+(next?".95)":(l.net>0?".7)":".28)"));ctx.lineWidth=next?2.4:(l.net>0?1.8:1);
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
  }
  /* номер плеча в кружке: порядок обхода читается без подписи; следующее — залито */
  pts.forEach((p,i)=>{
    if(!p)return;
    const next=NX&&NX.idx===i&&R.legs.length>=2;
    ctx.strokeStyle=col+".8)";ctx.lineWidth=1.2;
    ctx.beginPath();ctx.arc(p.x,p.y,11,0,TAU);ctx.stroke();
    ctx.fillStyle=next?"rgba(127,230,216,.85)":"rgba(6,10,16,.8)";
    ctx.beginPath();ctx.arc(p.x,p.y,11,0,TAU);ctx.fill();
    ctx.fillStyle=next?"#06101a":"#7fe6d8";ctx.fillText(String(i+1),p.x,p.y+.5);
  });
  ctx.textBaseline="alphabetic";
  ctx.restore();
}
/* Строка подвала карты: с одного плеча — что маршрут заведён, с двух — куда
   лететь и что везти. Счёт за круг живёт на станции (routeSumLine): подвалу
   на телефоне отведено две строки, и это одна из них. */
function routeLine(){
  const R=routeOf();
  if(R.legs.length<1)return"";
  if(R.legs.length<2)return"МАРШРУТ · 1 ПЛЕЧО · ОТМЕТЬТЕ ВТОРУЮ СТАНЦИЮ";
  const NX=routeNext();
  if(!NX)return"";
  const what=NX.inLeg&&NX.inLeg.k?" · ВЕЗЁМ "+RES[NX.inLeg.k].ru.toUpperCase():" · ВЕЗТИ НЕЧЕГО";
  const j=NX.jumps?" · "+NX.jumps+" "+routePl(NX.jumps,["ПРЫЖОК","ПРЫЖКА","ПРЫЖКОВ"]):" · ВЫ ЗДЕСЬ";
  return"СЛЕДУЮЩЕЕ ПЛЕЧО · «"+NX.sys.station.name+"»"+j+what+(R.loops?" · КРУГОВ "+R.loops:"");
}
/* Сводка за круг — заголовок блока на станции */
function routeSumLine(){
  const R=routeOf(),S=routeSum();
  return"МАРШРУТ "+R.legs.length+" "+routePl(R.legs.length,["ПЛЕЧО","ПЛЕЧА","ПЛЕЧ"])+" · ЗА КРУГ "+
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
      "отметьте на карте 2–"+ROUTE_MAX+" станций кнопкой «В МАРШРУТ» — плечо ставится там, где вы видели цены, и считается по вашим записям"+
      (R.legs.length?" · сейчас отмечено плеч: "+R.legs.length:"")+"</s></div>"));
    return;
  }
  const S=routeSum();
  $body.appendChild(el("div","sec",routeSumLine()));
  /* ── ПО МАРШРУТУ: станция знает, что вы сюда везли и что отсюда берёте ──
     Одна кнопка вместо «пролистай рынок, найди титан, нажми восемнадцать раз».
     Когда не может — говорит правду: «денег хватит на 11 из 18». */
  const here=G.sys&&G.sys.station?G.sys.key:null;
  const i=here?R.legs.indexOf(here):-1;
  if(i>=0){
    const n=R.legs.length,inLeg=S.legs[(i-1+n)%n],outLeg=S.legs[i];
    if(inLeg&&inLeg.k&&G.cargo[inLeg.k]>0){
      const k=inLeg.k,q=G.cargo[k],price=marketFor(G.sys)[k];
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>ПО МАРШРУТУ · сдать <span style='color:"+RES[k].col+"'>"+RES[k].ru.toLowerCase()+
        "</span> ×"+q+"</b><s>здесь "+price+" кр/ед · по записи ждали "+routeForkTxt(inLeg.sell,inLeg.forkB)+
        (inLeg.forkB?" · записи "+Math.max(0,celDay()-inLeg.dayB)+" дн.":"")+"</s>"));
      r.appendChild(el("div","qt",(q*price).toLocaleString("ru")+"<s>кр</s>"));
      const b=el("button","act gold","СДАТЬ");
      b.onclick=()=>{const rev=sellCargo(G.sys,k,q);
        tell("money","По маршруту сдано на «"+G.st.name+"»: "+RES[k].ru.toLowerCase()+" ×"+q+" · +"+rev.toLocaleString("ru")+" кр",
             "По маршруту: "+RES[k].ru+" ×"+q+"\n+"+rev.toLocaleString("ru")+" кр");
        renderTab();};
      r.appendChild(b);$body.appendChild(r);
    }
    if(outLeg&&outLeg.k){
      const k=outLeg.k,ask=buyPriceFor(G.sys,k);
      const free=Math.max(0,stat().cargoMax-held()),want=Math.min(stat().cargoMax,free);
      const afford=Math.floor(G.credits/Math.max(1,ask)),can=Math.max(0,Math.min(want,afford));
      const r=el("div","row");
      r.appendChild(el("div","nm","<b>ПО МАРШРУТУ · взять <span style='color:"+RES[k].col+"'>"+RES[k].ru.toLowerCase()+
        "</span> ×"+want+"</b><s>"+ask+" кр/ед · на «"+outLeg.to.station.name+"» ждут "+routeForkTxt(outLeg.sell,outLeg.forkB)+
        " · трюм "+held()+"/"+stat().cargoMax+
        (can<want?(can?" · денег хватит на "+can+" из "+want:(free?" · денег нет":" · трюм полон")):"")+"</s>"));
      r.appendChild(el("div","qt",(can*ask).toLocaleString("ru")+"<s>кр</s>"));
      const b=el("button","act"+(can?" gold":""),"ВЗЯТЬ"+(can&&can<want?" ×"+can:""));
      b.disabled=!can;
      b.onclick=()=>{const got=buyCargo(G.sys,k,can);
        if(got)tell("money","По маршруту взято на «"+G.st.name+"»: "+RES[k].ru.toLowerCase()+" ×"+got,
                    "По маршруту: "+RES[k].ru+" ×"+got);
        renderTab();};
      r.appendChild(b);$body.appendChild(r);
    }
  }
  S.legs.forEach((l,i)=>{
    const r=el("div","row");
    const head="<b>"+(i+1)+". «"+l.from.station.name+"» → «"+l.to.station.name+"»</b>";
    const age=Math.max(0,celDay()-Math.min(l.dayA,l.dayB));
    r.appendChild(el("div","nm",head+"<s>"+(l.k
      ?"<span style='color:"+RES[l.k].col+"'>"+RES[l.k].ru+"</span> "+routeForkTxt(l.buy,l.forkA)+" → "+routeForkTxt(l.sell,l.forkB)+
       " кр · "+Math.round(l.rel*100)+"% · "+l.fuel+" топлива"+(age?" · записи "+age+" дн.":"")
      :"цены сошлись — везти нечего · "+l.fuel+" топлива")+"</s>"));
    r.appendChild(el("div","qt",(l.net>0?"+"+l.net.toLocaleString("ru"):"—")+
      "<s>"+(l.qty?l.qty+" ед":"")+"</s>"));
    $body.appendChild(r);
  });
  /* Круги накатываются — и наценка садится: это видно строкой, а не в справке */
  if(R.loops>=2)$body.appendChild(el("div","row","<div class='nm'><b>Маршрут накатан</b><s>"+
    "кругов пройдено: "+R.loops+" · принёс "+R.earned.toLocaleString("ru")+" кр — вы сами продавили цены там, куда возите.<br>"+
    "Спред восстанавливается сам, но быстрее сменить плечо</s></div>"));
  const price=routeValue(),why=routeWhyNoPrice();
  const rr=el("div","row");
  rr.appendChild(el("div","nm","<b>Продать сведения о маршруте</b><s>"+
    (why?why:"скупщик заплатит за прохоженную дорогу и сам начнёт по ней возить:<br>маршрут уходит с карты, цены на нём осядут")+"</s>"));
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
      (R.loops<1?"сперва пройдите круг сами — он ведёт дорогу, а не бумагу":
      "он возьмёт "+mgrRouteMax(F)+" "+routePl(mgrRouteMax(F),["плечо","плеча","плеч"])+" и повезёт сам —<br>маршрут перестанет быть вашим")+"</s>"));
    const fb=el("button","act","ОТДАТЬ");
    fb.disabled=R.loops<1;
    fb.onclick=()=>{
      const n=routeToFactor();
      if(n)tell("tech","Маршрут передан фактору · плеч: "+n,"Маршрут у фактора\nплеч: "+n);
      renderTab();
    };
    fr.appendChild(fb);$body.appendChild(fr);
  }
}
