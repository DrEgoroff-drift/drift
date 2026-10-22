/* Свежая запись для пробы экономики (91zzzw4-ecosim): хронология первого часа (M912) и путь
   T0→T1 (M919) — кооператив, дрон, рука — со срезами по десять минут игры. Вынесено из пробы
   (Контроль 22.10: «на следующем росте делить»). Сюиты здесь нет — фабрика, которую проба зовёт
   один раз; X даёт ей замыкание пробы: note, dockAt, счётчики DSTAT и CNT, FR, очередь модулей
   (X.order) и геттеры tl, book, hire, jumps, фазу ph (чтение и запись) */
function ecoFresh(X){
  const {note,dockAt,DSTAT,CNT}=X;
  const ENV=(globalThis.process&&globalThis.process.env)||{};
  const T1=ENV.ECO_T1||"",KEEP=900,SL=10;
  const sum=o=>Object.values(o||{}).reduce((a,b)=>a+b,0);
  /* ── хронология первого часа (ярус «свежий») ── */
  function tlSample(){
    const TL=X.tl,BOOK=X.book;
    const m=fwMin(),A=dispLane(),B=billSt(),P=B.paper;
    const mark=(k,c)=>{if(TL[k]==null&&c)TL[k]=m;};
    mark("addr2",A.filter(x=>x.addr).length>=2);
    mark("urg",A.some(x=>x.urg));
    mark("long",A.some(x=>x.long));
    mark("line",G.log.some(x=>/Смена пошла/.test(x.s)));
    mark("fwEnd",fwSt().done);
    mark("paper",P&&P.first);
    mark("hour1",!firstHour());
    TL.debt=Math.max(TL.debt,billDebt());
    for(const t of [2,6,10,30,60,90,120,180])if(TL["cr"+t]==null&&m>=t){TL["cr"+t]=Math.round(G.credits);TL["fp"+t]=fuelPriceHere()+"/"+repFuelMul().toFixed(2)+"/"+actCoupons();}
    TL.flown=G.flownMs/60000;TL.play=(G.playMs||0)/60000;
    /* что игрок успевает за первый час (Контроль 22.10): первый раз — минута, к 60′ — срез */
    if(G.mode==="dock"&&G.sys)CNT.docks.add(G.sys.key);
    if(G.sys)CNT.sys.add(G.sys.key);
    const cr=G.credits,H=G.home||{};
    mark("undock",G.mode!=="dock");
    mark("land",G.mode==="surface");
    mark("sell",(BOOK.gross.sell||0)>0);
    mark("deed1",DSTAT.done>=1);mark("deed3",DSTAT.done>=3);mark("deed5",DSTAT.done>=5);
    mark("c900",cr>=modCost("hold",0));mark("c1250",cr>=modCost("drill",0));mark("c2k",cr>=2*modCost("drill",0));
    mark("hire",cr>=X.hire);mark("drone",cr>=dronePrice());
    mark("turn3k",(H.turn|0)>=3000);mark("alloc",!!H.alloc);mark("board",G.shipId==="vyuk");
    mark("coop",!!coopHas());
    mark("clr2",(G.clearance|0)>=2);mark("kill",(G.kills|0)>=1);
    if(TL.h1==null&&m>=60)TL.h1={gross:Object.assign({},BOOK.gross),spend:Object.assign({},BOOK.spend),
      deeds:DSTAT.done,pay:DSTAT.pay,took:Object.assign({},DSTAT.took),lost:dispSt().lost,poor:DSTAT.poor.size,
      laps:CNT.laps,mined:CNT.mined,jumps:X.jumps,docks:CNT.docks.size,sys:CNT.sys.size,cr:Math.round(cr),
      clr:G.clearance|0,kills:G.kills|0,turn:Math.round(H.turn|0),norm:ecoNormNow()};
    /* срез по десять минут игры (M919): касса, время по фазам, трюм, чего игрок ждёт */
    if(TL.home==null&&G.sys)TL.home=G.sys.key;
    const dt=TL.mPrev==null?0:m-TL.mPrev;TL.mPrev=m;
    if(TL.wait){const W=TL.waitMin||(TL.waitMin={});W[TL.wait]=(W[TL.wait]||0)+dt;}
    if(!TL.sl){TL.sl=[];TL.s0=snap(TL,BOOK);}
    while(m>=(TL.sl.length+1)*SL){const s=snap(TL,BOOK);TL.sl.push(cut(TL.s0,s,TL));TL.s0=s;}
  }
  function snap(TL,B){const t={},bz=B.spend["закупка"]||0;for(const k in B.time)t[k]=B.time[k];
    return {m:fwMin(),cr:Math.round(G.credits),g:sum(B.gross)-bz,s:sum(B.spend)-bz-(B.spend["вложение"]||0),
      inv:B.spend["вложение"]||0,t,walk:TL.walk|0,laps:CNT.laps,mined:CNT.mined,full:TL.full|0,deeds:DSTAT.done};}
  const FLY=["к планете","посадка","взлёт","к станции","стыковка"];
  function cut(a,b,TL){
    const mn=k=>((b.t[k]||0)-(a.t[k]||0))/X.FR/60,laps=b.laps-a.laps;
    const walk=(b.walk-a.walk)/X.FR/60,fl=FLY.reduce((s,k)=>s+mn(k),0);
    const tot=Object.keys(b.t).reduce((s,k)=>s+mn(k),0);
    const p=String(TL.home||G.sys.key).split(","),sx=p[0]|0,sy=p[1]|0;
    const R={m:Math.round(b.m),cr:b.cr,inv:Math.round(b.inv-a.inv),g:Math.round(b.g-a.g),net:Math.round(b.g-a.g-(b.s-a.s)),
      laps,dep:laps?(b.mined-a.mined)/laps:0,cap:stat().cargoMax,full:b.full-a.full,deeds:b.deeds-a.deeds,
      walk,ground:mn("грунт")-walk,fl,pz:mn("паузы"),pp:mn("дела"),dr:mn("за дроном"),
      wait:TL.wait||"—",rung:rungOf(sx,sy)+" ("+rungPoints(sx,sy)+")",
      kit:(G.shipId==="vyuk"?"Вьюк":"Стриж")+" "+["hold","drill","engine"].map(k=>"тбд"[["hold","drill","engine"].indexOf(k)]+(G.modsOwned[k]|0)).join("")+
        " · дрон "+((G.drones||[]).length+(G.droneInventory|0))+" · рука "+G.crew.length+(coopHas()?" · кооп":"")};
    R.rest=tot-R.walk-R.ground-R.fl-R.pz-R.pp-R.dr;
    return R;
  }
  /* ── путь T0→T1 (M919): кооператив → дрон → рука, как игрок, который копит на следующий ярус ──
     ECO_T1=1 — сначала пять модулей очереди, ECO_T1=2 — после первого трюма и бура */
  const modsOk=()=>T1==="2"?(G.modsOwned.hold|0)>=1&&(G.modsOwned.drill|0)>=1
    :(G.modsOwned.hold|0)>=2&&(G.modsOwned.drill|0)>=2&&(G.modsOwned.engine|0)>=1;
  const nDr=()=>(G.drones||[]).length+(G.droneInventory|0);
  const t1Done=()=>coopHas()&&nDr()>=1&&G.crew.length>=1;
  /* ECO_T1=2: модули сверх трюма и бура ждут, пока ярус не собран */
  function holdMods(){return T1==="2"&&modsOk()&&!t1Done();}
  function modWait(){const lv={};for(const k of X.order){lv[k]=(lv[k]|0)+1;if((G.modsOwned[k]|0)>=lv[k])continue;
    return G.credits<modCost(k,G.modsOwned[k]|0)+KEEP?"модуль: касса":"модуль: на стыковке";}return "модули куплены";}
  const mark=(TL,k)=>{if(TL[k]==null)TL[k]=fwMin();};
  /* ближняя станция, где продают дрона (верфь, завод), до четырёх секторов от дома */
  function yardNear(){
    for(let r=1;r<=4;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
      const sx=G.sx+dx,sy=G.sy+dy;if(!starAt(sx,sy))continue;
      const s=getSystem(sx,sy);if(s.station&&droneShopHas(s))return s.key;}
    return null;
  }
  function shop(){
    const TL=X.tl;if(!TL||G.mode!=="dock")return;
    const home=TL.home||G.sys.key;
    if(!T1||!modsOk()||t1Done()){TL.wait=modWait();if(T1&&t1Done())mark(TL,"t1");return;}
    const PH=X.ph;X.ph="вложение";TL.wait="покупка";
    try{
      if(!coopHas()){
        if(!coopCanRegister()){TL.wait="кооператив: оборот";return;}
        if(G.credits<COOP_FEE+KEEP){TL.wait="кооператив: касса";return;}
        if(!coopRegister("Проба")){TL.wait="кооператив: отказ";note("кооператив: отказ");return;}
        mark(TL,"t1coop");return;                     /* одна покупка за стыковку */
      }
      if(nDr()<1){
        const p=dronePrice();
        if(G.credits<p+KEEP){TL.wait="дрон: касса";return;}
        if(!droneShopHas(G.sys)){
          const key=yardNear();if(!key){TL.wait="дрон: верфи нет";return;}
          X.ph="за дроном";TL.trips=(TL.trips|0)+1;
          if(!dockAt(key)||!droneShopHas(G.sys)){TL.wait="дрон: не долетел";dockAt(home);return;}
          X.ph="вложение";
        }
        if(!droneShopTake(G.sys)){TL.wait="дрон: прилавок пуст";return;}
        G.credits-=p;G.droneInventory=(G.droneInventory|0)+1;mark(TL,"t1drone");TL.yard=G.sys.key;
        if(G.sys.key!==home){X.ph="за дроном";dockAt(home);}
        return;
      }
      if(crewCap()<1){TL.wait="рука: мест нет";return;}
      const c=stationMercs(G.sys)[0];if(!c){TL.wait="рука: кантина пуста";return;}
      if(G.credits<mercFee(c)+KEEP){TL.wait="рука: касса";return;}
      if(!hireMerc(c)){TL.wait="рука: отказ";return;}
      const h=G.crew[G.crew.length-1];
      if(!crewAssignShip(h,"strizh"))note("рука: Стриж не выдан");
      if(!crewOrder(h,"mine",G.sx,G.sy))note("рука: приказ не принят");
      mark(TL,"t1hand");
    }finally{X.ph=PH;}
  }
  return {tlSample,shop,holdMods};
}
/* печать: путь T0→T1 и срезы по десять минут (зовёт ecoPrint) */
function ecoFreshPrint(rows){
  const f=v=>v==null?"не успел":v.toFixed(1)+"′",n=v=>v.toFixed(1);
  for(const r of rows)if(r.tl&&r.tl.sl){const L=r.tl;
    console.log("\n  "+r.tier+" · путь T0→T1: кооператив "+f(L.t1coop)+" · дрон "+f(L.t1drone)+(L.yard?" (верфь "+L.yard+", рейсов "+(L.trips|0)+")":"")+
      " · рука "+f(L.t1hand)+" · ярус собран "+f(L.t1)+" · покупки "+(L.bought||"—"));
    console.log("  ждал, минут игры: "+(Object.entries(L.waitMin||{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+" "+v.toFixed(0)).join(" · ")||"—"));
    console.log("  | до минуты | касса | вложено | валовый | чистый | кругов | залежей на круг | трюм полон | ходьба · грунт · полёт · паузы · дела · за дроном · прочее, мин | дел | ждёт | ступень дома (очки) | снаряжение |");
    console.log("  |---|---|---|---|---|---|---|---|---|---|---|---|---|");
    for(const s of L.sl)console.log("  | "+s.m+" | "+s.cr+" | "+s.inv+" | "+s.g+" | "+s.net+" | "+s.laps+" | "+n(s.dep)+" (трюм "+s.cap+") | "+s.full+" | "+
      [s.walk,s.ground,s.fl,s.pz,s.pp,s.dr,s.rest].map(n).join(" · ")+" | "+s.deeds+" | "+s.wait+" | "+s.rung+" | "+s.kit+" |");}
}
