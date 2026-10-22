/* Печать пробы экономики (91zzzw4-ecosim, M912) и суд нормы по сводкам. Вынесено из пробы
   (Контроль 22.10: набор ≤ 40 КБ). Сюиты здесь нет: проба зовёт ecoPrint(rows,X) в конце
   и ecoNorm* по ходу; X — часы, темп, окружение и цена найма из замыкания пробы */
/* лестница доступа (M916): площадка цеха — ступень ★11 «Монтажная площадка» (bldSitesAt → rungHas "site"),
   ступень — от дел игрока в системе (rungPoints) и трёх ворот (rungOf): посадка, бурение, дрон здесь.
   Дом и станции в трёх прыжках; round — ещё и после круга snapshot → JSON → applySave, как у живого сейва */
function ecoLadder(home,round){
  const R=stat().jump,r3=Math.ceil(R*3),L=[];
  for(let dx=-r3;dx<=r3;dx++)for(let dy=-r3;dy<=r3;dy++){
    if(Math.hypot(dx,dy)>R*3+.01)continue;
    const s=getSystem(home.sx+dx,home.sy+dy);if(!s||!s.station)continue;
    const H=G.hold&&G.hold[s.key],D=(H&&H.deeds)||{},P=G.place||{};
    L.push({key:s.key,home:!dx&&!dy,r:rungOf(s.sx,s.sy),p:rungPoints(s.sx,s.sy),sites:bldSitesAt(s.sx,s.sy),
      seen:!!P[s.key],landed:Object.keys(P).some(k=>k.indexOf(s.key+"/")===0),drill:D.drill|0,
      drone:(G.drones||[]).some(d=>d.sx===s.sx&&d.sy===s.sy)||(D.drone|0)>0,cargo:D.cargo|0,bld:H&&H.bld?Object.keys(H.bld).length:0,
      gates:rungGateTxt(s.sx,s.sy)});
  }
  const h=L.find(x=>x.home)||{},n=f=>L.filter(f).length;
  const out={sys:{sx:home.sx,sy:home.sy},n:L.length,seen:n(x=>x.seen),landed:n(x=>x.landed),drilled:n(x=>x.drill>0),drone:n(x=>x.drone),
    r11:n(x=>x.r>=11),sites:n(x=>x.sites>0),
    home:h.key+" ступень "+h.r+" (очков "+h.p+") · площадок "+h.sites+" · посадка "+(h.landed?"да":"нет")+" · бурений "+h.drill+
      " · дрон "+(h.drone?"да":"нет")+" · груза "+h.cargo+" · построек "+h.bld+(h.gates&&h.gates.length?" · не хватает: "+h.gates.join(", "):""),
    top:L.filter(x=>!x.home&&x.p>0).sort((a,b)=>b.p-a.p).slice(0,3).map(x=>x.key+" ст."+x.r+"/"+x.p+"оч"+(x.gates.length?" −"+x.gates.join("/"):"")).join("; ")};
  if(round){try{
    const S=JSON.parse(JSON.stringify(snapshot()));applySave(S);
    out.saved="после сейва: ступень "+rungOf(home.sx,home.sy)+" (очков "+rungPoints(home.sx,home.sy)+") · площадок "+bldSitesAt(home.sx,home.sy);
  }catch(e){out.saved="сейв: "+(e&&e.message);}}
  return out;
}
function ecoNormNow(){
  const W=watchSt();watchTick();
  const L0=G.log.slice(),rec0=JSON.stringify(G.record||null);
  const judge=c=>{const r=watchJudge(c);return r||{norm:null,tot:0,mine:0,ord:0};};
  const a=judge(JSON.parse(JSON.stringify(W)));
  const z=JSON.parse(JSON.stringify(W));z.fill={};z.ord=0;
  const b=judge(z);
  G.log=L0;G.record=JSON.parse(rec0);
  return {n:W.n,with:a.norm,without:b.norm,tot:a.tot,btot:b.tot,mine:a.mine,ord:a.ord,win:(W.w1|0)-(W.w0|0)+1};
}
/* за долгий прогон сводка сменяется: суд каждой — последним замером перед сменой, итог — по нуждам всех */
function ecoNormFold(acc,s){
  if(!s||s.with==null)return acc;
  if(acc.cur&&acc.cur.n!==s.n)acc.done.push(acc.cur);
  acc.cur=s;return acc;
}
function ecoNormSum(acc){
  const L=acc.done.concat(acc.cur?[acc.cur]:[]);
  if(!L.length)return null;
  let t=0,g=0,bt=0,bg=0,mine=0,ord=0,win=0;
  for(const s of L){t+=s.tot;g+=s.with*s.tot/100;bt+=s.btot;bg+=s.without*s.btot/100;mine+=s.mine;ord+=s.ord;win+=s.win;}
  return {with:t?Math.round(100*g/t):100,without:bt?Math.round(100*bg/bt):100,tot:t,mine,ord,win,sv:L.length};
}
function ecoPrint(rows,X){
  const HOURS=X.hours,HUMAN=X.human,ENV=X.env,HIRE_FEE=X.hireFee;
  console.log("экономика: "+HOURS+" ч игры на ярус · "+(ENV.ECO_EST==="0"?"цеха и база T2–T3 не строятся":"T2–T3 с цехами и базой")+" · оракул DESIGN-game §4.1"+(HUMAN?" · темп человека (круг ≥ 6 мин, паузы)":" · темп бота"));
  console.log("| ярус | корпус | кругов | мин/круг | добыто | валовый/ч | расход/ч | чистый/ч | U/G | против §4.1 (в/р/ч) | откуда | куда |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for(const r of rows)console.log("| "+r.tier+" | "+r.hull+" | "+r.laps+" | "+r.minLap.toFixed(1)+" | "+r.mined+" | "+Math.round(r.gross)+" | "+Math.round(r.spend)+" | "+Math.round(r.net)+" | "+r.press.toFixed(2)+" | "+r.dG+"% / "+r.dU+"% / "+r.dN+"% | "+r.gsrc+" | "+r.ssrc+" |");
  for(const r of rows)console.log("  "+r.tier+" топливо/ч: "+r.fuel+" · корпус/ч: "+r.hullLoss);
  for(const r of rows)console.log("  "+r.tier+" мин на круг по фазам: "+r.time);
  for(const r of rows)console.log("  "+r.tier+" продано (шт×кр): "+r.sold);
  for(const r of rows)if(r.fails)console.log("  "+r.tier+" сбои: "+r.fails);
  for(const r of rows)console.log("  "+r.tier+" диспетчер: "+r.disp);
  for(const r of rows)if(r.est){const E=r.est;
    console.log("  "+r.tier+" хозяйство: цеха "+(E.shops||"—")+" · рейсов в цех "+E.hauls+", в бункеры "+E.fed+" ед · промтовар сдан в цеха "+Math.round(E.indSold/r.hrs)+" кр/ч"+(E.lev?" (из них рычагом "+(ENV.ECO_LEVER||"")+" ×"+(+ENV.ECO_LEVER_MUL||1)+" — "+Math.round(E.lev/r.hrs)+")":"")+
      " · не нашёл едока "+E.indLeft+" кр "+E.indLeftQ+" · база "+E.base+": рейсов за рудой "+E.baseTrips+", забрано "+E.baseUnits+" ед, продано на "+Math.round(E.baseWorth/r.hrs)+" кр/ч");
    if(E.survey)console.log("  "+r.tier+" едоки в 3 прыжках: "+E.survey);
    if(ENV.ECO_TRACE)console.log("    "+E.dbg+" · "+E.hop);}
  for(const r of rows)if(r.lad)r.lad.forEach((A,i)=>console.log("  "+r.tier+" лестница "+(i?"в конце":"в начале")+": станций в 3 прыжках "+A.n+
    " · был "+A.seen+" · садился "+A.landed+" · бурил "+A.drilled+" · дрон "+A.drone+" · ступень ≥11 "+A.r11+" · с площадкой "+A.sites+
    " · дом "+A.home+(A.top?" · соседи: "+A.top:"")+(A.saved?" · "+A.saved:"")));
  for(const r of rows)if(r.drn&&r.drn.length){const PARTS=6*60,price=DRONES.miner.price;
    console.log("  "+r.tier+" дроны (кр/ч за прогон · после запчастей 6 кр/мин · окупаемость "+price+" кр, ч): "+
      r.drn.map(d=>{const g=Math.round(d.earned/r.hrs);return d.res+" "+g+" → "+(g-PARTS)+" · "+
        (g>0?(price/g).toFixed(0):"∞")+" / "+(g>PARTS?(price/(g-PARTS)).toFixed(0):"∞")+" ч ("+d.trips+" рейсов)";}).join("; "));}
  for(const r of rows)if(r.norm){const N=r.norm;
    console.log("  "+r.tier+" норма участка: "+(N.with==null?"—":N.with+" %")+" · без вас "+(N.without==null?"—":N.without+" %")+
      " · нужд "+N.tot+", закрыто вами "+N.mine+", нарядов "+N.ord+" · окон "+N.win+" · сводок "+N.sv);}
  for(const r of rows)if(r.tl){const L=r.tl,f=v=>v==null?"—":v.toFixed(1);
    console.log("  "+r.tier+" первый час (минуты игры): два адресных "+f(L.addr2)+" · срочное "+f(L.urg)+" · строка участка "+f(L.line)+
      " · наряд "+f(L.long)+" · первый час прошёл "+f(L.hour1)+" · вахта кончилась "+f(L.fwEnd)+" · бумага стажёра "+f(L.paper)+
      " · налёт к концу "+L.flown.toFixed(0)+" мин, игры "+L.play.toFixed(0)+" мин · касса взаимопомощи макс "+L.debt+
      " · кредиты "+[2,6,10,30,60,90,120,180].filter(t=>L["cr"+t]!=null).map(t=>t+"′ "+L["cr"+t]).join(", ")+
      " · бак кр/ед (цена/репутация/талоны) "+[2,10,60,120,180].filter(t=>L["fp"+t]!=null).map(t=>t+"′ "+L["fp"+t]).join(", "));}
  /* что игрок успевает за первый час игры — таблица без утверждений (Контроль 22.10, M912) */
  for(const r of rows)if(r.tl){const L=r.tl,f=v=>v==null?"не успел":v.toFixed(1)+"′";
    const ev=[["первый выход из дока","undock"],["первая посадка","land"],["первая продажа","sell"],
      ["первое дело закрыто","deed1"],["третье дело","deed3"],["пятое дело","deed5"],
      ["касса ≥ первый трюм ("+modCost("hold",0)+")","c900"],["касса ≥ первый бур ("+modCost("drill",0)+")","c1250"],
      ["касса ≥ два бура ("+2*modCost("drill",0)+")","c2k"],["касса ≥ наём руки ("+(HIRE_FEE<1e9?HIRE_FEE:"—")+")","hire"],
      ["касса ≥ первый дрон ("+DRONES.miner.price+")","drone"],["оборот 3 000","turn3k"],["разнарядка на «Вьюк»","alloc"],["пересел на «Вьюк»","board"],
      ["экзамен кооператива","coop"],["допуск II","clr2"],["первая победа в бою","kill"],
      ["два адресных на стойке","addr2"],["первое срочное","urg"],["наряд на три станции","long"],
      ["первый час прошёл","hour1"],["бумага стажёра","paper"]];
    console.log("\n  "+r.tier+" · что игрок успевает за первый час игры (минута игры)");
    console.log("  | веха | минута |\n  |---|---|");
    for(const [ru,k] of ev)console.log("  | "+ru+" | "+f(L[k])+" |");
    const H=L.h1;if(!H)continue;
    const s=o=>Object.entries(o).filter(e=>Math.round(e[1])).map(([k,v])=>k+" "+Math.round(v)).join(", ")||"—";
    console.log("  к 60′: касса "+H.cr+" (старт 600) · оборот "+H.turn+" · кругов "+H.laps+" · залежей "+H.mined+
      " · дел "+H.deeds+" на "+Math.round(H.pay)+" кр "+JSON.stringify(H.took)+" · ушло по сроку "+H.lost+" · не взято "+H.poor+
      " · прыжков "+H.jumps+" · станций "+H.docks+" · систем "+H.sys+" · допуск "+H.clr+" · побед "+H.kills+
      " · норма "+(H.norm&&H.norm.with!=null?H.norm.with+" % (без вас "+H.norm.without+" %)":"—"));
    console.log("  к 60′ валовый: "+s(H.gross)+" · расход: "+s(H.spend));
    console.log("  покупки: "+(L.bought||"—")+" · на «Вьюке» с "+(L.board==null?"—":L.board.toFixed(1)+"′")+
      " · вложено за прогон "+r.inv+" кр (не расход: U/G без него)");}
}
