/* ══════════════ Вега: жиличка, которую нельзя выгнать ══════════════
   M153. Комедия одного желания. Игрок САМ покупает на блошинце прибор
   «Желание-1» и сам нажимает; три желания — все кончаются Вегой, радисткой
   с ближней станции. Дальше — три акта, зеркало, полёты с ней и развязка
   без смерти: перестать убегать.

   СОСТОЯНИЕ (G.vega):
     stage  0 нет · 1 мечта · 2 одержимость · 3 зеркало · 4 свободна
     day0   день, когда нажали
     att    привязанность: растёт от попыток выгнать и звонков без ответа
     away   дней подряд вне дома · homeDays дней подряд дома с выключенным двигателем
     broken список разбитого · evict число попыток выгнать
     aboard летит с вами (кресло на пульте, G.seat) · mood · offend день обиды
     out    вылазки {cantina,flea,eclipse,tin} · parrot2 второй попугай
   Всё по дням (celDay), чтобы не зависеть от реального времени.

   ПРАВИЛА ФАЙЛА:
   1. Ничего не трогает экономику: разбитое — картинка и чуть морали, не налог.
   2. Слова — в 12k-vega. Здесь условия и счётчики.
   3. Выгнать нельзя ни на одной стадии: это не баг, это фильм. */
function vegaHas(){const V=G.vega;return !!(V&&V.stage>0);}
function vegaAboard(){const V=G.vega;return !!(V&&V.stage>0&&V.aboard);}
function vegaAtHome(){const H=G.home;return !!(H&&H.tier&&G.sx===H.sx&&G.sy===H.sy);}
function vegaHullName(){return (G.ship&&G.shipId&&shipData(G.shipId))?"«"+shipData(G.shipId).ru+"»":"борт";}
/* ── прибор на блошинце: только когда есть жилая часть, и только пока не нажат ── */
function vegaDeviceOffered(sys){
  if(!sys||!sys.station||sys.station.stype!=="bazaar")return false;
  if(!homeHas("living"))return false;
  if(vegaHas()||G.wishDevice)return false;
  return true;
}
function vegaDeviceBuy(sys){
  if(!vegaDeviceOffered(sys))return false;
  if(G.credits<40)return false;
  G.credits-=40;G.wishDevice=1;
  thingAdd("wish","«Желание-1»","прибор одноразовый · ВНИИ неизвестно чего · инструкция утеряна · нажать — на столе, ВЕЩИ");
  tell("tech","Куплено: «Желание-1» · дед с лотка: «инструкция утеряна, нажимать один раз»","«ЖЕЛАНИЕ-1»\nлежит на столе");
  return true;
}
/* нажать: любое из трёх — Вега. Прибор понял по-своему */
function vegaWish(id){
  if(!G.wishDevice||vegaHas())return false;
  const W=VEGA_WISHES.find(w=>w.id===id)||VEGA_WISHES[0];
  G.wishDevice=2;
  G.vega={stage:1,day0:celDay(),att:0,away:0,homeDays:0,broken:[],evict:0,aboard:0,mood:1,offend:-1,
          out:{},parrot2:0,lastDay:celDay(),calls:0,wish:W.id,said:0};
  const L=thingsAll();const t=L.find(x=>x.k==="wish");if(t){t.ru="«Желание-1» · нажат";t.note="желание: "+W.ru+" · исполнено"+(W.id==="alone"?" с запасом":"")+" · прибор молчит";}
  logAdd("good","«Желание-1»: "+W.ru+" — исполнено"+(W.id==="alone"?" с запасом":""));
  say("ЖЕЛАНИЕ-1\n«"+W.ru+"»\nисполнено"+(W.id==="alone"?" с запасом":""),260);
  peopleLine("Я переезжаю. Не спорь — прибор сказал. Устя уехала к сестре.","Вега",true);
  if(G.home)G.home.mateTier=G.home.tier;           /* домочадец умолк: его место занято */
  sfx("ok",{v:.6});
  return true;
}
/* ── день: считаем дома/не дома, звоним, бьём, освобождаемся ── */
function vegaDayTick(){
  const V=G.vega;if(!V||!V.stage)return;
  const d=celDay();
  if(d===V.lastDay)return;
  const n=Math.min(3,d-V.lastDay);V.lastDay=d;
  if(V.stage===4){               /* свободна: раз в неделю звонит и всё */
    if(d%7===0)etherLine(pick(VEGA_FREE,rng(hashi(d,7,0xFE))),"Вега");
    return;
  }
  const home=vegaAtHome()&&!V.aboard;
  for(let i=0;i<n;i++){
    if(home||V.aboard){
      V.away=0;
      if(home&&(G.mode==="dock"||G.mode==="system")){
        V.homeDays++;
        /* остался лишний день — назавтра что-то починила */
        if(V.homeDays>=2&&V.broken.length){const b=V.broken.shift();peopleLine("Я починила: "+b+". Ты же остался.","Вега");}
      }
      if(V.aboard)V.homeDays=0;
    }else{
      V.away++;V.homeDays=0;
      const tier=V.away<=3?0:(V.away<=7?1:2);
      const r=rng(hashi(d,V.away,0x7E6A));
      if(V.stage===1&&V.away>=2){V.stage=2;logAdd("warn","Вега считает дни.");}
      if(V.stage>=2){
        /* звонок: ответить — крутить ручку на эфир; без ответа привязанность растёт */
        const answered=(G.radioF!=null&&G.radioF>=.88);
        etherLine(pick(VEGA_CALLS[tier],r),"Вега");V.calls++;
        if(!answered)V.att+=.2;
        if(tier>=1&&r()<.6)etherLine(pick(VEGA_RELAY,r).replace("{hull}",vegaHullName()));
        if(tier>=2&&V.broken.length<VEGA_BROKEN.length&&r()<.7){
          const b=VEGA_BROKEN[V.broken.length];V.broken.push(b);
          logAdd("warn","Дома разбито: "+b);
          for(const c of (G.crew||[]))c.morale=Math.max(0,(c.morale===undefined?1:c.morale)-.03);
        }
      }
    }
  }
  /* зеркало: на десятый день второй прибор, уже нажатый */
  if(V.stage===2&&d-V.day0>=10&&!V.mirror){
    V.mirror=1;V.stage=3;
    thingAdd("wish","Второй «Желание-1» · уже нажат","лежал на столе утром · кто нажал — не сказано · с тех пор хочется домой");
    logAdd("warn","На столе второй «Желание-1». Нажатый.");
  }
  /* развязка: семь дней дома подряд с выключенным двигателем */
  if(V.stage>=2&&V.homeDays>=7){
    V.stage=4;V.att=0;V.aboard=0;G.seat=null;
    peopleLine("Ты какой-то скучный стал. Я на станцию вернусь, на смену. Жить буду тут — ты не против? Ты не против.","Вега",true);
    logAdd("good","Вега вернулась на смену. Живёт у вас. Звонит раз в неделю.");
    thingAdd("paper","Записка от Веги","«суп на плите. ключ у меня. второй прибор погас, я проверила» · прибор на столе тёмный");
    V.parrot2=1;
    logAdd("dim","У Веги теперь попугай. Второй. Ваши попугаи друг с другом не разговаривают.");
  }
}
/* ── выгнать: нельзя. Каждая попытка — +1 привязанность и новый отказ ── */
function vegaEvict(){
  const V=G.vega;if(!V||!V.stage)return null;
  const line=VEGA_EVICT[V.evict%VEGA_EVICT.length];
  V.evict++;
  if(V.stage<4)V.att+=1;
  peopleLine(line,"Вега",true);
  return line;
}
/* ── мораль дома: в мечте и на борту выше домочадца, в обиде — нет ── */
function vegaMoraleMul(){
  const V=G.vega;if(!V||!V.stage)return 1;
  if(vegaOffended())return 1;
  return V.stage===1?1.5:(V.stage===4?1.2:1.15);
}
function vegaOffended(){const V=G.vega;return !!(V&&V.offend>=celDay());}
function vegaOffend(why){
  const V=G.vega;if(!V||!V.stage||V.stage===4)return;
  if(V.offend>=celDay())return;
  V.offend=celDay()+1;V.mood=0;
  peopleLine(pick(VEGA_OFFEND,rng(hashi(celDay(),3,0x0FF))),"Вега");
  logAdd("warn","Вега обиделась: "+why+" · день молчит");
  if(typeof heardAdd==="function")heardAdd("обиделась");   /* попугай подхватывает */
}
/* ── на борту ── */
function vegaBoard(on){
  const V=G.vega;if(!V||!V.stage||V.stage===4)return false;
  if(on&&typeof traineeAboard==="function"&&traineeAboard()){peopleLine("Там мальчишка в кресле. Я дома посижу. Я не ревную. Я дома посижу.","Вега",true);return false;}
  V.aboard=on?1:0;
  if(on){
    G.seat={name:"ВЕГА",line:"на борту",draw:vegaSeatDraw,act:vegaSeatAct};
    peopleLine("Я с тобой. Чемодан в трюме, не трогай.","Вега",true);
  }else{
    G.seat=null;
    peopleLine("Ладно. Я дома. Звони.","Вега",true);
  }
  return true;
}
function vegaSeatLine(){
  const V=G.vega;if(!V)return "";
  if(vegaOffended())return "обиделась · молчит";
  if(G.mode==="cave")return "«не в пещеру»";
  return V.mood>.6?"на борту · довольна":(V.mood>.3?"на борту · так себе":"на борту · злится");
}
function vegaSeatAct(){
  const V=G.vega;if(!V||!V.aboard)return;
  /* подарок: редкость в трюме — берёт; руда — ссора; ничего — реплика */
  const rare=RARE_RES.find(k=>(G.cargo[k]|0)>0);
  if(rare){
    G.cargo[rare]--;V.att=Math.max(0,V.att-1);V.mood=1;V.offend=-1;
    peopleLine(pick(VEGA_GIFT_OK,rng(hashi(celDay(),V.calls,0x61F))),"Вега",true);
    return;
  }
  /* «руда — ссора» стояла в замысле этой функции с самого начала, а кода не
     было: реплики (`VEGA_GIFT_BAD`) написаны и не звучали ни разу. Дарить
     женщине железо из трюма — это поступок, и он должен иметь цену. */
  const ore=RES_KEYS.find(k=>!RES[k].rare&&(G.cargo[k]|0)>0);
  if(ore&&!vegaOffended()){
    peopleLine(pick(VEGA_GIFT_BAD,rng(hashi(celDay(),V.said,0x62A))),"Вега",true);
    vegaOffend("подарили "+RES[ore].ru);
    return;
  }
  if(vegaOffended()){say("Вега\n…",120);return;}
  peopleLine(pick(VEGA_ABOARD,rng(hashi(celDay(),++V.said,0xAB0))),"Вега",true);
}
function vegaSeatDraw(c,W,H){
  c.save();c.translate(W/2,H);
  const s=Math.min(W,H)/56;c.scale(s,s);
  c.fillStyle="#5b4a6e";c.beginPath();c.roundRect(-12,-30,24,28,6);c.fill();        /* платье */
  c.fillStyle="#e6c9a8";c.beginPath();c.arc(0,-38,8,0,7);c.fill();                  /* лицо */
  c.fillStyle="#b8323a";c.beginPath();c.moveTo(-9,-43);c.quadraticCurveTo(0,-54,9,-43);c.lineTo(7,-41);c.lineTo(-7,-41);c.closePath();c.fill(); /* косынка — только над лбом */
  c.fillStyle="#2a1e1e";c.fillRect(-3,-40,1.6,1.6);c.fillRect(1.5,-40,1.6,1.6);
  const V=G.vega;if(V&&vegaOffended()){c.strokeStyle="#2a1e1e";c.lineWidth=1;c.beginPath();c.moveTo(-3,-34);c.lineTo(3,-34);c.stroke();}
  else{c.strokeStyle="#2a1e1e";c.lineWidth=1;c.beginPath();c.arc(0,-35,2.5,.2,Math.PI-.2);c.stroke();}
  c.restore();
}
/* кресло обновляется раз в тик пульта: строка настроения */
function vegaTick(dt){
  const V=G.vega;if(!V||!V.stage)return;
  vegaDayTick();
  V.ambT=(V.ambT||0)-dt;if(V.ambT<=0){V.ambT=120;vegaAmbientTick();}
  if(V.aboard){
    if(!G.seat)G.seat={name:"ВЕГА",line:"",draw:vegaSeatDraw,act:vegaSeatAct};
    G.seat.line=vegaSeatLine();
    V.mood=Math.min(1,V.mood+dt*.0002);
    /* пещера: строка раз в минуту и никакой помощи */
    if(G.mode==="cave"){V.caveT=(V.caveT||0)-dt;if(V.caveT<=0){V.caveT=3600;peopleLine(pick(VEGA_CAVE,rng(hashi(celDay(),G.t|0,0xCA))),"Вега",true);V.mood=Math.max(0,V.mood-.2);}}
  }
}
/* прыжок: укачивает после третьего подряд */
function vegaJump(){
  const V=G.vega;if(!V||!V.aboard)return;
  V.jumps=(V.jumps||0)+1;
  if(V.jumps>3&&!vegaOffended()){peopleLine(pick(VEGA_SICK,rng(hashi(V.jumps,1,0x51C))),"Вега",true);V.mood=Math.max(0,V.mood-.15);}
}
function vegaLanded(){const V=G.vega;if(V)V.jumps=0;}
/* зверь рядом: кричит, звери шарахаются (читается в пугливости 21) */
function vegaBeastShout(){
  const V=G.vega;if(!V||!V.aboard)return;
  if(V.beastT>G.t-1800)return;V.beastT=G.t;
  peopleLine(pick(VEGA_BEAST,rng(hashi(G.t|0,2,0xBEA))),"Вега",true);
}
/* вылазки: кантина, блошинец, затмение, Жестянка — след истории и строка */
function vegaOuting(kind){
  const V=G.vega;if(!V||!V.aboard||!VEGA_OUTING[kind])return false;
  const first=!V.out[kind];V.out[kind]=(V.out[kind]|0)+1;
  const r=rng(hashi(celDay(),V.out[kind],0x0A7));
  peopleLine(pick(VEGA_OUTING[kind],r),"Вега",true);
  V.mood=1;V.att=Math.max(0,V.att-.5);
  if(kind==="cantina"&&G.credits>=30){G.credits-=30;logAdd("money","Кантина с Вегой: −30 кр · неделю будет сплетничать");V.gossipUntil=celDay()+7;}
  if(kind==="flea"&&first)thingAdd("junk","Бесполезная вещь Веги","куплена на блошинце · «дед сказал — редкость» · стоит дома");
  if(kind==="tin")V.cried=1;
  return true;
}
/* дом: при возвращении после долгого отсутствия детали переложены */
function vegaHomeArrive(){
  const V=G.vega;if(!V||!V.stage||V.stage===4)return;
  if(V.away>=4&&G.inv&&G.inv.length>1){
    const r=rng(hashi(celDay(),V.away,0x7D1));
    for(let i=G.inv.length-1;i>0;i--){const j=Math.floor(r()*(i+1));const t=G.inv[i];G.inv[i]=G.inv[j];G.inv[j]=t;}
    peopleLine("Я прибралась. Всё на месте. Примерно.","Вега",true);
  }
}
/* зеркало: раз в день запуск из дома откладывается */
function vegaLaunchHold(){
  const V=G.vega;if(!V||V.stage!==3||!vegaAtHome())return false;
  if(V.holdDay===celDay())return false;
  V.holdDay=celDay();
  say("ЗАПУСК ОТЛОЖЕН\nвы обещали остаться",200);
  logAdd("warn","Запуск отложен: вы обещали остаться. Второй прибор на столе тёплый.");
  return true;
}
/* блок на доске блошинца: дед с лотка — или его нет */
function vegaFleaBlock(){
  if(!G.sys||!G.sys.station||G.sys.station.stype!=="bazaar")return;
  if(vegaDeviceOffered(G.sys)){
    $body.appendChild(el("div","sec","ДЕД С ЛОТКА · «ЖЕЛАНИЕ-1»"));
    const r=el("div","row","<div class='nm'><b>«Желание-1» · прибор одноразовый</b><s>ВНИИ неизвестно чего · инструкция утеряна · «нажимать один раз, больше не надо» · 40 кр</s></div>");
    const b=el("button","act sm gold","КУПИТЬ · 40 кр");b.disabled=G.credits<40;
    b.onclick=()=>{vegaDeviceBuy(G.sys);renderTab();};
    r.appendChild(b);$body.appendChild(r);
  }else if(vegaHas()&&G.vega.stage<4){
    $body.appendChild(el("div","sec","ЛОТОК, ГДЕ БЫЛ ДЕД"));
    $body.appendChild(el("div","row","<div class='nm'><s>другой продавец: «Какой прибор?» · в институт написано — «возврат не предусмотрен. инструкция утеряна. ждите»</s></div>"));
  }
}
/* блок дома: кто живёт, выгнать, взять на борт, вылазка в кантину */
function vegaHomeBlock(){
  const V=G.vega;if(!V||!V.stage)return;
  const st=V.stage===1?"мечта":(V.stage===2?"считает дни":(V.stage===3?"второй прибор на столе":"соседка"));
  $body.appendChild(el("div","sec","ВЕГА · "+st.toUpperCase()+(V.broken.length?" · РАЗБИТО: "+V.broken.join(", ").toUpperCase():"")));
  const r=el("div","row","<div class='nm'><b>Вега</b><s>"+(V.aboard?"летит с вами · чемодан в трюме":"дома · привязанность "+V.att.toFixed(1)+" · попыток выгнать "+V.evict)+
    (V.parrot2?" · у неё свой попугай":"")+"</s></div>");
  const b1=el("button","act sm","ВЫГНАТЬ");b1.onclick=()=>{vegaEvict();renderTab();};r.appendChild(b1);
  if(V.stage<4){
    const b2=el("button","act sm gold",V.aboard?"ОСТАВИТЬ ДОМА":"ВЗЯТЬ НА БОРТ");
    b2.onclick=()=>{vegaBoard(!V.aboard);renderTab();};r.appendChild(b2);
  }
  $body.appendChild(r);
}
/* блок в кантине: сесть с ней */
function vegaCantinaBlock(){
  const V=G.vega;if(!V||!V.aboard)return;
  const r=el("div","row","<div class='nm'><b>Вега за столиком</b><s>посидеть вдвоём · 30 кр · она посмотрит на людей</s></div>");
  const b=el("button","act sm","СЕСТЬ ВДВОЁМ");b.disabled=G.credits<30;
  b.onclick=()=>{vegaOuting("cantina");renderTab();};
  r.appendChild(b);$body.appendChild(r);
}
/* помощь и вылазки, которые читаются сами: затмение с поверхности, Жестянка на
   стыковке, карты раз в день — всё только на борту и не в обиде */
function vegaAmbientTick(){
  const V=G.vega;if(!V||!V.aboard||vegaOffended())return;
  const d=celDay();
  if(G.mode==="surface"&&G.surf&&G.surf.p&&typeof celEclipse==="function"){
    const e=celEclipse(G.surf.p,G.t);
    if(e&&e.k>.8&&V.eclDay!==d){V.eclDay=d;vegaOuting("eclipse");}
  }
  if(G.mode==="dock"&&typeof tinHereRec==="function"&&tinHereRec()&&!V.out.tin)vegaOuting("tin");
  if(V.chartDay!==d&&typeof needsNear==="function"){
    V.chartDay=d;
    const L=needsNear(6);
    if(L.length)peopleLine("Я карты читала: на "+L[0].sys.station.name+" нет "+L[0].need.ru+". Это "+L[0].d+" "+pl3(L[0].d,"прыжок","прыжка","прыжков")+".","Вега");
  }
}
/* фигура дома: в жилой части, косынка; обиженная — спиной */
function vegaHomeFigure(c,x,fy){
  const V=G.vega;if(!V||!V.stage||V.aboard)return;
  const k=62/89;
  c.save();c.translate(x,fy);c.scale(k,k);
  hqFigure(c,0,0,[120,84,140],G.t*.02,null,0,null,0);
  c.restore();
  c.fillStyle="#b8323a";c.beginPath();c.moveTo(x-6,fy-56);c.quadraticCurveTo(x,fy-64,x+6,fy-56);c.lineTo(x+5,fy-52);c.lineTo(x-5,fy-52);c.closePath();c.fill();
  if(V.parrot2){c.fillStyle="#3fa06a";c.beginPath();c.ellipse(x+12,fy-40,3,4.5,.3,0,TAU);c.fill();c.fillStyle="#e0b040";c.fillRect(x+14,fy-41,2.5,1.5);}
}
function vegaBroken(what){const V=G.vega;return !!(V&&V.broken&&V.broken.indexOf(what)>=0);}
