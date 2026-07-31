/* ══════════════ база на планете: вид в разрезе ══════════════ */
/* Планета остаётся плоской 2D, объём даёт разрез: сверху небо и грунт, ниже —
   вкопанные отсеки, коридоры и шахта лифта. Видно всё сразу — реактор светится,
   бур уходит в породу, в жилом горит свет. Ходьба, свет и камера — те же, что
   в пещере, поэтому сцена стоит дёшево. */
const BASE_COLS=5, BASE_ROWS=4, BASE_ROWS_DEEP=5, BCELL_W=150, BCELL_H=104;
/* «Второй ярус» смотрителя: базе разрешён ещё ряд вниз. Однажды вскрытый ярус
   остаётся у базы навсегда — иначе расчёт со смотрителем стирал бы построенное
   вместе с ним. Поэтому число рядов живёт на самой базе, а перк только его даёт. */
function baseRows(B){return B?Math.max(B.rows|0,BASE_ROWS):BASE_ROWS;}
function baseGrowCheck(B){
  if(!B||(B.rows|0)>=BASE_ROWS_DEEP)return false;
  if(!mgrPerkOf("keep","deep"))return false;
  B.rows=BASE_ROWS_DEEP;
  while(B.cells.length<BASE_COLS*B.rows)B.cells.push(null);
  logAdd("tech","База «"+B.name+"»: смотритель вскрыл нижний ярус");
  return true;
}
const BUILD={
  reactor:{ru:"Реактор",    cost:{credits:1800,alloy:6},  power:14, note:"даёт энергию всей базе; рядом с буром потерь меньше"},
  solar:  {ru:"Солнечная панель",cost:{credits:700,alloy:2},power:5,surfaceOnly:true,
           note:"только на верхнем уровне, отдача зависит от класса звезды"},
  drill:  {ru:"Буровая",    cost:{credits:1400,alloy:4},  power:-9, note:"тянет ресурс из залежи под базой"},
  storage:{ru:"Склад",      cost:{credits:600,alloy:2},   power:-1, note:"+120 к тому, сколько база может накопить"},
  habitat:{ru:"Жилой отсек",cost:{credits:1200,alloy:3},  power:-4, note:"места для персонала; рядом с реактором людям хуже"},
  refinery:{ru:"Плавильня", cost:{credits:2200,alloy:8},  power:-11,note:"сама переплавляет добытое в сплавы"},
  pad:    {ru:"Площадка",   cost:{credits:2600,alloy:10}, power:-3, note:"причал для переброски между базами"},
  /* дорогая, прожорливая и мёртвая без жилого отсека рядом: разбирать образцы
     вахтой из скафандра нельзя, а исследователю больше работать негде */
  lab:    {ru:"Лаборатория", cost:{credits:3200,alloy:12},power:-16,needTech:"lab",
           note:"рабочее место исследователя; нужен жилой отсек по соседству"}
};
const BUILD_KEYS=Object.keys(BUILD);
function baseKey(sx,sy,idx){return sx+","+sy+":"+idx;}
function baseAt(sx,sy,idx){return G.bases[baseKey(sx,sy,idx)]||null;}
/* смета смотрителя удешевляет стройку — поэтому цена берётся здесь, а не из
   таблицы напрямую: и в интерфейсе, и при оплате она должна быть одна и та же */
function baseCost(k){
  const d=mgrBuildDiscount(),c=BUILD[k].cost;
  if(d>=1)return c;
  return {credits:Math.round(c.credits*d),alloy:c.alloy?Math.max(1,Math.round(c.alloy*d)):c.alloy};
}
function canPay(cost){return G.credits>=cost.credits&&(!cost.alloy||G.cargo.alloy>=cost.alloy);}
function payCost(cost){G.credits-=cost.credits;if(cost.alloy)G.cargo.alloy-=cost.alloy;}
function foundBase(p){
  const cost={credits:2500,alloy:10};
  if(!canPay(cost)){
    say("Для закладки базы нужно\n2500 кр и 10 сплавов\n(сплавы — на промышленной станции)");
    return false;
  }
  payCost(cost);
  const cells=[];
  for(let i=0;i<BASE_COLS*BASE_ROWS;i++)cells.push(null);
  cells[Math.floor(BASE_COLS/2)]={k:"reactor",hp:1};   // без энергии база мертва, поэтому реактор в подарок
  G.bases[baseKey(G.sx,G.sy,p.idx)]={sx:G.sx,sy:G.sy,idx:p.idx,name:p.name,type:p.type,
    res:p.res.slice(0,3),cells,pool:{},tMs:Date.now(),built:Date.now()};
  tell("money","Заложена база на "+p.name+" · −2500 кр, 10 сплавов","База заложена\n"+p.name);
  return true;
}
function enterBase(p){
  const B=baseAt(G.sx,G.sy,p.idx);if(!B)return;
  baseTick();
  /* ярус проверяем и на входе: иначе вскрытый нижний ряд появлялся бы только
     после следующего тика, и игрок не понимал бы, что уже можно строить ниже */
  baseGrowCheck(B);
  G.base={B,p,cur:Math.floor(BASE_COLS/2),row:0,x:0,y:0,walkPhase:0,menu:false,pick:0};
  G.base.x=cellX(G.base.cur);G.base.y=cellY(0);
  G.mode="base";
  for(const k in keys)keys[k]=false;
  say("База «"+p.name+"»\n◀ ▶ — переход · ▲ ▼ — уровни\nДЕЙСТВИЕ — строить в пустой ячейке · НАЗАД — наружу");
}
function exitBase(){
  G.base=null;G.mode="surface";
  say("Выход на поверхность");
}
function cellX(c){return 90+c*BCELL_W+BCELL_W/2;}
function cellY(r){return 150+r*BCELL_H+BCELL_H/2;}
function baseCell(B,c,r){return B.cells[r*BASE_COLS+c];}
function baseSet(B,c,r,v){B.cells[r*BASE_COLS+c]=v;}
/* ══════════════ энергия и соседство ══════════════ */
/* Энергобаланс — центральная механика и причина рисовать разрез: нехватка не
   строка в таблице, а тусклый свет и вставший бур. */
function baseNeighbors(B,c,r){
  const out=[];
  for(const [dc,dr] of [[-1,0],[1,0],[0,-1],[0,1]]){
    const cc=c+dc,rr=r+dr;
    if(cc<0||cc>=BASE_COLS||rr<0||rr>=baseRows(B))continue;
    const cell=baseCell(B,cc,rr);
    if(cell)out.push(cell.k);
  }
  return out;
}
function basePower(B){
  let prod=0,cons=0,core=0,drills=0,drillEff=0,hab=0,habPenalty=0,store=0,ref=0,pads=0;
  const cls=(getSystem(B.sx,B.sy).cls&&getSystem(B.sx,B.sy).cls.lum)||1;
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);if(!cell||cell.hp<=0)continue;   // разбитый отсек не работает и не ест энергию
    const M=BUILD[cell.k];if(!M)continue;
    const near=baseNeighbors(B,c,r);
    if(cell.k==="solar"){prod+=M.power*(r===0?1:.25)*cls;continue;}
    if(M.power>0){prod+=M.power;continue;}
    let use=-M.power;
    if(cell.k==="drill"){
      /* реактор по соседству — меньше потерь в передаче */
      const wired=near.indexOf("reactor")>=0;
      use*=wired?.78:1;
      drills++;drillEff+=wired?1.2:1;
    }
    if(cell.k==="habitat"){
      hab++;
      if(near.indexOf("reactor")>=0)habPenalty++;
    }
    if(cell.k==="storage")store+=120;
    if(cell.k==="refinery")ref++;
    if(cell.k==="pad")pads++;
    /* ядро нагрузки — то, ради чего база стоит: остальное можно и притушить */
    if(cell.k==="drill"||cell.k==="lab")core+=use;
    cons+=use;
  }
  /* ── ветка «Энергия» смотрителя ──
     «Переброс»: при нехватке половина необязательной нагрузки сбрасывается,
     и мощность достаётся тому, ради чего база и стоит, — буру и лаборатории.
     «Стабилизация»: реактор держит нижний порог и не глохнет совсем. */
  let load=cons;
  if(mgrPerkOf("keep","power")&&cons>core)load=core+(cons-core)*.5;
  let eff=load<=0?1:clamp(prod/load,0,1);
  if(mgrPerkOf("keep","stable"))eff=Math.max(eff,.35);
  /* «Излишки»: всё, что база не съела, уходит станции — редкий случай,
     когда лишний реактор осмысленно ставить нарочно */
  const surplus=Math.max(0,prod-cons);
  return {prod:Math.round(prod*10)/10,cons:Math.round(cons*10)/10,eff,surplus,
    drills,drillEff,hab,habPenalty,store:180+store,ref,pads};
}
function basePoolHeld(B){let s=0;for(const k in B.pool)s+=B.pool[k]|0;return s;}
/* ══════════════ ленивое время базы ══════════════ */
function baseTick(){
  const now=Date.now();
  for(const key in G.bases){
    const B=G.bases[key];
    if(!B.tMs){B.tMs=now;continue;}
    const dtMs=Math.min(now-B.tMs,CREW_OFFLINE_CAP);
    if(dtMs<1000)continue;
    B.tMs=now;
    baseGrowCheck(B);
    const P=basePower(B),min=dtMs/60000;
    baseRaid(B,min);baseFixTick(B,min);baseStorm(B,min);
    /* «Излишки»: лишняя мощность продаётся станции. Считается всегда, даже
       если бура нет вовсе — солнечная ферма без бура тоже чего-то стоит. */
    if(P.surplus>0&&mgrPerkOf("keep","grid")){
      const cr=Math.round(P.surplus*min*1.4);
      if(cr>0){
        G.credits+=cr;
        B.sold=(B.sold|0)+cr;
        if(B.sold>=400){logAdd("money","База «"+B.name+"» сдала излишки энергии · +"+
          B.sold.toLocaleString("ru")+" кр");B.sold=0;}
      }
    }
    if(!P.drills)continue;
    const cap=P.store;
    /* персонал (M47) — множитель к тому, что база и так умеет: бурильщик ускоряет
       выработку, инженер вытягивает отдачу при нехватке энергии */
    const crewBoost=1+baseRoleForce(B,"driller")*.45;
    const eff=clamp(P.eff+baseRoleForce(B,"engineer")*.18,0,1);
    let left=Math.min(min*P.drillEff*eff*crewBoost*1.1,Math.max(0,cap-basePoolHeld(B)));
    const r=rng(hashi(B.sx*7919+B.sy,B.idx,Math.floor(now/60000)));
    const pool=(B.res&&B.res.length)?B.res:["iron"];
    while(left>=1){
      const k=pick(pool,r);
      B.pool[k]=(B.pool[k]|0)+1;left--;
    }
    /* плавильня превращает часть добытого в сплавы прямо на месте */
    if(P.ref){
      /* «Плавильня» смотрителя: переплавка идёт без присмотра — вдвое быстрее
         и не проседает вместе с энергией */
      const melt=mgrPerkOf("keep","melt");
      let conv=Math.floor(min*P.ref*(melt?1:eff)*(melt?.3:.15));   // медленнее станции: база берёт не темпом, а тем, что работает сама
      while(conv>0){
        let src=null;
        for(const k in B.pool)if((B.pool[k]|0)>=4&&RARE_RES.indexOf(k)<0){src=k;break;}
        if(!src)break;
        B.pool[src]-=4;B.pool.alloy=(B.pool.alloy|0)+1;conv--;
      }
    }
  }
}
/* ══════════════ налёты пиратов на базу ══════════════ */
/* Разрешаются ленивым счётчиком, без отдельной сцены: последствия видно в
   разрезе (разбитый отсек) и в журнале. Охранник — единственная защита, и
   поэтому осмысленный. */
function baseRaid(B,min){
  const danger=sysDanger(B.sx,B.sy);
  if(danger<=.05)return;
  const chance=min*danger*.012;
  /* seed берём от самого отрезка времени, а не от текущей минуты: иначе
     несколько тиков подряд внутри одной минуты дают один и тот же исход */
  B.raidSeq=(B.raidSeq|0)+1;
  const r=rng(hashi(B.sx*131+B.sy,B.idx*7+3,hashi(B.tMs|0,B.raidSeq,0x2A1D)));
  if(r()>chance)return;
  const guard=baseRoleForce(B,"guard");
  if(guard>0&&r()<guard*.7){
    logAdd("kill","Налёт на базу «"+B.name+"» отбит охраной");
    return;
  }
  /* без охраны пропадает часть накопленного, иногда ломается отсек */
  let lost=0;
  for(const k in B.pool){
    const q=B.pool[k]|0;if(q<=0)continue;
    const t=Math.ceil(q*(.3+r()*.4));B.pool[k]=q-t;lost+=t;
  }
  let broke=null;
  if(r()<.4){
    const live=[];
    for(let i=0;i<B.cells.length;i++)if(B.cells[i]&&B.cells[i].hp>0&&B.cells[i].k!=="reactor")live.push(i);
    if(live.length){
      const i=live[Math.floor(r()*live.length)];
      B.cells[i].hp=0;broke=BUILD[B.cells[i].k].ru;
    }
  }
  logAdd("warn","Налёт на базу «"+B.name+"»"+(lost?" · унесено "+lost+" ед":"")+
    (broke?" · разбит отсек: "+broke:"")+(guard?"":" · охраны нет"));
}
/* ══════════════ буря ══════════════ */
/* У базы должна быть угроза, которую нельзя отбить охраной: налёт — про людей,
   буря — про место. Она бьёт по тому, что стоит наверху (панели ловят её первыми),
   и её отменяет «буревой щит» смотрителя. Мир у планеты уже есть: тип задаёт,
   насколько тут вообще дует. */
const STORM_WORLDS={terran:.5,ocean:.9,desert:1.4,rocky:.7,ice:1.3,volcanic:1.4,toxic:1.5,gas:0};
function baseStorm(B,min){
  const force=STORM_WORLDS[B.type]!==undefined?STORM_WORLDS[B.type]:.8;
  if(force<=0)return;
  B.stormSeq=(B.stormSeq|0)+1;
  const r=rng(hashi(B.sx*313+B.sy,B.idx*11+5,hashi(B.tMs|0,B.stormSeq,0x51D)));
  if(r()>min*force*.010)return;
  if(mgrPerkOf("keep","storm")){
    logAdd("dim","Буря на «"+B.name+"» прошла без потерь — щит держит");
    return;
  }
  /* сначала достаётся тому, что снаружи: панели и верхний ряд */
  const top=[];
  for(let i=0;i<BASE_COLS;i++)if(B.cells[i]&&B.cells[i].hp>0)top.push(i);
  const solar=[];
  for(let i=0;i<B.cells.length;i++)if(B.cells[i]&&B.cells[i].k==="solar"&&B.cells[i].hp>0)solar.push(i);
  const pickList=solar.length?solar:top;
  if(!pickList.length){logAdd("dim","Буря на «"+B.name+"» — ломать снаружи нечего");return;}
  const i=pickList[Math.floor(r()*pickList.length)];
  B.cells[i].hp=Math.max(0,B.cells[i].hp-(.5+r()*.5));
  logAdd("warn","Буря на «"+B.name+"» повредила отсек: "+BUILD[B.cells[i].k].ru+
    (B.cells[i].hp<=0?" (выбит)":""));
}
/* инженер чинит разбитое сам, медленно.
   «Очередь» смотрителя доводит начатое до конца и без инженера: домен на то и домен. */
function baseFixTick(B,min){
  const eng=baseRoleForce(B,"engineer")+(mgrPerkOf("keep","queue")?.8:0);
  if(eng<=0)return;
  for(const cell of B.cells){
    if(cell&&cell.hp<1){
      cell.hp=Math.min(1,cell.hp+min*eng*.02);
      if(cell.hp>=1)logAdd("dim","Инженер восстановил отсек на базе «"+B.name+"»");
    }
  }
}
/* забрать накопленное в трюм — за этим и прилетаешь */
function baseCollect(B){
  const st=stat();let n=0;
  for(const k in B.pool){
    const q=B.pool[k]|0;if(q<=0)continue;
    const got=addRes(k,q);B.pool[k]=q-got;n+=got;
  }
  if(n>0)tell("","С базы забрано "+n+" ед · трюм "+held()+"/"+st.cargoMax,"Забрано "+n+" ед");
  else say("Забирать нечего\nили трюм полон");
  return n;
}
/* ══════════════ сеть баз ══════════════ */
/* Площадка (`pad`) связывает базы между собой и со станциями: перелёт стоит
   топлива и кредитов, зато не требует лететь через полгалактики руками. */
function baseList(){
  const out=[];
  for(const k in G.bases)out.push(G.bases[k]);
  return out.sort((a,b)=>a.built-b.built);
}
function basePads(){return baseList().filter(B=>basePower(B).pads>0);}
function baseJumpCost(B){
  const d=Math.hypot(B.sx-G.sx,B.sy-G.sy);
  return {fuel:Math.ceil(6+d*.9),credits:Math.round(120+d*40)};
}
function jumpToBase(B){
  const c=baseJumpCost(B);
  if(G.fuel<c.fuel){say("Не хватает топлива\nнужно "+c.fuel);return false;}
  if(G.credits<c.credits){say("Не хватает кредитов\nнужно "+c.credits);return false;}
  G.fuel-=c.fuel;G.credits-=c.credits;
  G.sx=B.sx;G.sy=B.sy;G.sys=getSystem(B.sx,B.sy);
  const p=G.sys.planets[B.idx];
  const a=Math.atan2(G.ship.y,G.ship.x)||0;
  if(p){G.ship.x=p.x+Math.cos(a)*(p.radius+170);G.ship.y=p.y+Math.sin(a)*(p.radius+170);}
  G.ship.vx=0;G.ship.vy=0;
  G.mode="system";G.base=null;G.st=null;G.ap=null;G.orbit=null;
  document.getElementById("station").classList.remove("open");
  spawnPirates();spawnAllies();
  saveGame(true);
  tell("","Переброска на базу «"+B.name+"» · −"+c.credits+" кр, −"+c.fuel+" топлива",
       "Переброска\n"+B.name);
  return true;
}
/* ══════════════ обновление сцены ══════════════ */
function updateBase(dt){
  const S=G.base,B=S.B;
  if(G.t%30<dt)baseTick();
  const tx=cellX(S.cur),ty=cellY(S.row);
  const dx=tx-S.x,dy=ty-S.y;
  S.x+=clamp(dx,-3.2*dt,3.2*dt);S.y+=clamp(dy,-2.6*dt,2.6*dt);
  const moving=Math.abs(dx)>2||Math.abs(dy)>2;
  S.walkPhase+=moving?.22*dt:0;
  if(S.menu){
    /* меню постройки: ▲▼ выбирают модуль, ДЕЙСТВ ставит, НАЗАД закрывает */
    if(keys.left&&!S.held){S.pick=(S.pick+BUILD_KEYS.length-1)%BUILD_KEYS.length;S.held=1;}
    if(keys.right&&!S.held){S.pick=(S.pick+1)%BUILD_KEYS.length;S.held=1;}
    if(!keys.left&&!keys.right)S.held=0;
    const k=BUILD_KEYS[S.pick],M=BUILD[k];
    /* постройка бывает заперта наукой: лаборатория до «Лаборатории» не ставится.
       Показываем её всё равно — игрок должен видеть, за чем идти. */
    const locked=M.needTech&&techLv(M.needTech)<=0;
    const bad=(M.surfaceOnly&&S.row>0)||locked;
    G.prompt="СТРОИТЬ: "+M.ru.toUpperCase()+"\n"+M.note+
      "\n"+baseCost(k).credits+" кр"+(M.cost.alloy?" + "+baseCost(k).alloy+" сплавов":"")+
      (locked?"\nНУЖНА НАУКА: "+TECH[M.needTech].ru.toUpperCase():"")+
      (M.surfaceOnly&&S.row>0?"\nТОЛЬКО НА ВЕРХНЕМ УРОВНЕ":"")+
      "\n◀ ▶ — выбор · ДЕЙСТВИЕ — построить";
    if(actEdge){
      if(locked)say("Сначала нужна наука\n«"+TECH[M.needTech].ru+"»");
      else if(bad)say("Панель ставится только сверху");
      /* цена — через baseCost: смета смотрителя должна работать и здесь,
         иначе скидка показывалась в интерфейсе, а списывалось полное */
      else if(!canPay(baseCost(k)))say("Не хватает: "+baseCost(k).credits+" кр"+
        (M.cost.alloy?" и "+baseCost(k).alloy+" сплавов":""));
      else{
        payCost(baseCost(k));baseSet(B,S.cur,S.row,{k,hp:1});
        S.menu=false;
        tell("money","На базе «"+B.name+"» построено: "+M.ru,"Построено\n"+M.ru);
      }
    }
    return;
  }
  if(keys.left&&!S.held){S.cur=Math.max(0,S.cur-1);S.held=1;}
  if(keys.right&&!S.held){S.cur=Math.min(BASE_COLS-1,S.cur+1);S.held=1;}
  if(keys.thrust&&!S.held){S.row=Math.max(0,S.row-1);S.held=1;}
  if(keys.brake&&!S.held){S.row=Math.min(baseRows(B)-1,S.row+1);S.held=1;}
  if(!keys.left&&!keys.right&&!keys.thrust&&!keys.brake)S.held=0;
  const cell=baseCell(B,S.cur,S.row);
  const P=basePower(B);
  const head="ЭНЕРГИЯ "+P.prod+" / "+P.cons+" · ОТДАЧА "+Math.round(P.eff*100)+"%"+
    "\nНА СКЛАДЕ "+basePoolHeld(B)+" / "+P.store;
  if(cell){
    const M=BUILD[cell.k];
    /* стоя на площадке, ДЕЙСТВ отправляет на следующую базу сети, а не собирает груз */
    const net=cell.k==="pad"?basePads().filter(o=>o!==B):[];
    if(net.length){
      /* цель — ближайшая площадка сети: выбирать некому, стрелки заняты ходьбой */
      net.sort((a,b)=>Math.hypot(a.sx-B.sx,a.sy-B.sy)-Math.hypot(b.sx-B.sx,b.sy-B.sy));
      const T=net[0],c=baseJumpCost(T);
      G.prompt=head+"\nПЛОЩАДКА · ДЕЙСТВИЕ — ПЕРЕБРОСКА НА «"+T.name.toUpperCase()+"»"+
        "\n"+c.credits+" кр и "+c.fuel+" топлива";
      if(actEdge)jumpToBase(T);
      return;
    }
    G.prompt=head+"\n"+M.ru.toUpperCase()+" · "+M.note+
      (basePoolHeld(B)>0?"\nДЕЙСТВИЕ — ЗАБРАТЬ НАКОПЛЕННОЕ":"");
    if(actEdge&&basePoolHeld(B)>0)baseCollect(B);
  }else{
    G.prompt=head+"\nПОРОДА · ДЕЙСТВИЕ — ПРОКОПАТЬ И ПОСТАВИТЬ МОДУЛЬ";
    if(actEdge){S.menu=true;S.pick=0;}
  }
}
/* ══════════════ рисование разреза ══════════════ */
/* ── база в разрезе ──
   Прежняя версия рисовала таблицу: коричневый прямоугольник, полосатые ряды,
   и на каждой ячейке — рамка, включая пустые. Ровно та же ошибка, что была в
   шахте до M60: на экране читалась сетка, а не порода.

   Лечится тем же приёмом. Порода — материал планеты (`planetMat`) поверх пластов,
   темнеющих с глубиной. Помещения не обводятся по клеткам: все построенные
   отсеки собираются в ОДИН путь, он вырезается тьмой, и только по его кромке
   идёт грань со светом сверху и тенью снизу. Пустая клетка не рисуется вовсе —
   там просто порода, в которой ещё не прорубились. */
function baseRoomPath(B,X,Y,pad){
  const P=new Path2D();
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    if(!baseCell(B,c,r))continue;
    P.rect(X(90+c*BCELL_W)+pad,Y(150+r*BCELL_H)+pad,BCELL_W-pad*2,BCELL_H-pad*2);
  }
  /* ствол лифта — тоже пустота, и он связывает уровни в одно сооружение */
  const lx=X(cellX(Math.floor(BASE_COLS/2)));
  P.rect(lx-13,Y(150),26,baseRows(B)*BCELL_H);
  return P;
}
function drawBase(){
  const S=G.base,B=S.B,P=basePower(B);
  const camx=clamp(S.x-W/2,-40,BASE_COLS*BCELL_W+180-W);
  const camy=clamp(S.y-H/2,-120,baseRows(B)*BCELL_H+260-H);
  const X=x=>x-camx, Y=y=>y-camy;
  const pl=G.sys.planets[B.idx];
  const sky=pl?pl.T.sky:[[20,24,34],[8,10,16]];
  const pal=pl?pl.T.pal:[[70,58,46],[52,42,34],[38,30,24],[26,20,16],[18,14,11]];
  const gy=Y(150);                                   // уровень грунта
  /* ── небо и поверхность ── */
  const g=ctx.createLinearGradient(0,Y(-140),0,gy);
  g.addColorStop(0,"rgb("+sky[1].join(",")+")");
  g.addColorStop(1,"rgb("+sky[0].join(",")+")");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,Math.max(0,gy));
  /* кромка грунта не линейка: мелкий рельеф из того же шума, что и планета */
  ctx.beginPath();
  ctx.moveTo(0,H);ctx.lineTo(0,gy);
  for(let x=0;x<=W;x+=6){
    const wob=(fbm2((x+camx)*.008,3.3,B.idx*77+13,3)-.5)*16;
    ctx.lineTo(x,gy+wob);
  }
  ctx.lineTo(W,H);ctx.closePath();
  const rock=ctx.createLinearGradient(0,gy,0,Y(150+baseRows(B)*BCELL_H+120));
  rock.addColorStop(0,"rgb("+pal[Math.min(1,pal.length-1)].join(",")+")");
  rock.addColorStop(.55,"rgb("+pal[Math.min(3,pal.length-1)].join(",")+")");
  rock.addColorStop(1,"rgb("+pal[pal.length-1].join(",")+")");
  ctx.fillStyle=rock;ctx.fill();
  /* пласты: границы гуляют, поэтому это порода, а не полосатый матрас */
  ctx.save();ctx.clip();
  for(let r=0;r<baseRows(B)+2;r++){
    const y0=150+r*BCELL_H*1.15;
    ctx.beginPath();ctx.moveTo(0,Y(y0));
    for(let x=0;x<=W;x+=10)ctx.lineTo(x,Y(y0)+(fbm2((x+camx)*.004,r*2.7,B.idx*31+5,3)-.5)*26);
    ctx.lineTo(W,Y(y0)+BCELL_H*1.15);ctx.lineTo(0,Y(y0)+BCELL_H*1.15);ctx.closePath();
    ctx.fillStyle=r%2?"rgba(0,0,0,.16)":"rgba(255,255,255,.035)";ctx.fill();
  }
  const mat=pl?planetMat(pl):null;
  if(mat)fillMaterial(mat,camx,camy,.5,.3,null,{x:0,y:Math.max(0,gy),w:W,h:H});
  /* свет с глубиной сходит на нет */
  const dk=clamp((camy+H*.5)/2000,0,.42);
  ctx.fillStyle="rgba(2,4,9,"+(.12+dk).toFixed(3)+")";ctx.fillRect(0,Math.max(0,gy),W,H);
  ctx.restore();
  /* ── помещения: один путь на всё сооружение ── */
  const lit=.35+P.eff*.65;
  const RP=baseRoomPath(B,X,Y,6);
  ctx.save();
  /* грань выработки: свет сверху, тень снизу — та же фаска, что у проёма кабины */
  ctx.strokeStyle="rgba(0,0,0,.55)";ctx.lineWidth=9;ctx.stroke(RP);
  ctx.fillStyle="#05070c";ctx.fill(RP);
  ctx.strokeStyle="rgba(210,226,240,"+(.10+lit*.10).toFixed(2)+")";ctx.lineWidth=1.4;ctx.stroke(RP);
  ctx.restore();
  /* свет изнутри ложится на породу вокруг отсеков */
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);if(!cell||cell.hp<=0)continue;
    const cx=X(cellX(c)),cy=Y(cellY(r));
    if(cx<-260||cx>W+260)continue;
    const gg=ctx.createRadialGradient(cx,cy,4,cx,cy,BCELL_W*.95);
    const warm=cell.k==="reactor"?[140,240,255]:[242,178,92];
    gg.addColorStop(0,"rgba("+warm.join(",")+","+(.10*lit).toFixed(3)+")");
    gg.addColorStop(1,"rgba("+warm.join(",")+",0)");
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(cx,cy,BCELL_W*.95,0,TAU);ctx.fill();
  }
  ctx.restore();
  /* ── модули ── */
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const x=X(90+c*BCELL_W),y=Y(150+r*BCELL_H);
    if(x>W+40||x+BCELL_W<-40)continue;
    const cell=baseCell(B,c,r);
    if(!cell)continue;                       // пустая клетка — просто порода
    drawModule(cell.k,x,y,cell.hp>0?lit:.12,c,r,B);
    if(cell.hp<=0){
      /* разбитый отсек: перечёркнут и тёмен — видно, что налёт был не бесплатным */
      ctx.strokeStyle="rgba(255,80,60,.7)";ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x+14,y+14);ctx.lineTo(x+BCELL_W-14,y+BCELL_H-14);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+BCELL_W-14,y+14);ctx.lineTo(x+14,y+BCELL_H-14);ctx.stroke();
    }
  }
  /* коридор-стяжка вдоль пола и ствол лифта */
  ctx.strokeStyle="rgba(242,178,92,"+(.16+lit*.26).toFixed(2)+")";ctx.lineWidth=2;
  for(let r=0;r<baseRows(B);r++){
    const y=Y(150+r*BCELL_H+BCELL_H*.78);
    ctx.beginPath();ctx.moveTo(X(96),y);ctx.lineTo(X(90+BASE_COLS*BCELL_W-6),y);ctx.stroke();
  }
  const lx=X(cellX(Math.floor(BASE_COLS/2)));
  ctx.strokeStyle="rgba(150,190,220,.30)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(lx-10,Y(150));ctx.lineTo(lx-10,Y(150+baseRows(B)*BCELL_H));
  ctx.moveTo(lx+10,Y(150));ctx.lineTo(lx+10,Y(150+baseRows(B)*BCELL_H));ctx.stroke();
  ctx.strokeStyle="rgba(150,190,220,.16)";
  for(let r=0;r<=baseRows(B)*2;r++){
    const y=Y(150+r*BCELL_H*.5);
    ctx.beginPath();ctx.moveTo(lx-10,y);ctx.lineTo(lx+10,y);ctx.stroke();
  }
  /* астронавт — тот же силуэт, что на поверхности и в шахте */
  ctx.save();ctx.translate(X(S.x),Y(S.y)+26);ctx.scale(.9,.9);
  drawAstronaut({phase:S.walkPhase,amp:Math.abs(cellX(S.cur)-S.x)>2?1:0,walk:false,air:false});
  ctx.restore();
  /* место под застройку: не рамка на каждой клетке, а метка только на выбранной */
  const sx=X(90+S.cur*BCELL_W),sy=Y(150+S.row*BCELL_H);
  const on=Math.sin(G.t*.12)>0;
  ctx.strokeStyle=on?"rgba(127,230,216,.95)":"rgba(127,230,216,.4)";
  ctx.lineWidth=2;
  if(baseCell(B,S.cur,S.row))ctx.strokeRect(sx+4,sy+4,BCELL_W-8,BCELL_H-8);
  else{
    ctx.setLineDash([7,7]);
    ctx.strokeRect(sx+10,sy+10,BCELL_W-20,BCELL_H-20);
    ctx.setLineDash([]);
    ctx.fillStyle="rgba(127,230,216,.5)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("МЕСТО ПОД ЗАСТРОЙКУ",sx+BCELL_W/2,sy+BCELL_H/2+3);
  }
  if(S.menu)drawBuildMenu(S);
}
function drawModule(k,x,y,lit,c,r,B){
  const w=BCELL_W-12,h=BCELL_H-12,x0=x+6,y0=y+6;
  ctx.fillStyle="#0d141d";ctx.strokeStyle="rgba(242,178,92,"+(.35+lit*.45).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.rect(x0,y0,w,h);ctx.fill();ctx.stroke();
  const cx=x0+w/2,cy=y0+h/2;
  if(k==="reactor"){
    /* светится тем ярче, чем больше отдача — источник света всей базы */
    const pulse=.55+Math.sin(G.t*.06)*.12;
    const gg=ctx.createRadialGradient(cx,cy,2,cx,cy,w*.5);
    gg.addColorStop(0,"rgba(140,240,255,"+(pulse*lit).toFixed(2)+")");
    gg.addColorStop(1,"rgba(140,240,255,0)");
    ctx.fillStyle=gg;ctx.fillRect(x0,y0,w,h);
    ctx.strokeStyle="rgba(140,240,255,.8)";ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(cx,cy,16,0,TAU);ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,9,0,TAU);ctx.stroke();
  }else if(k==="solar"){
    ctx.fillStyle="rgba(40,72,110,.9)";ctx.strokeStyle="rgba(130,190,230,.6)";
    ctx.beginPath();ctx.rect(x0+10,cy-12,w-20,24);ctx.fill();ctx.stroke();
    for(let i=1;i<5;i++){const xx=x0+10+i*(w-20)/5;
      ctx.beginPath();ctx.moveTo(xx,cy-12);ctx.lineTo(xx,cy+12);ctx.stroke();}
  }else if(k==="drill"){
    /* бур уходит в породу и крутится только когда есть энергия */
    const P=basePower(B),spin=P.eff>.05?G.t*.08*P.eff:0;
    ctx.strokeStyle="rgba(220,150,90,.85)";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(cx,y0+12);ctx.lineTo(cx,y0+h);ctx.stroke();
    ctx.save();ctx.translate(cx,y0+h-8);ctx.rotate(spin);
    ctx.fillStyle="#c8875a";
    ctx.beginPath();ctx.moveTo(-8,-8);ctx.lineTo(8,-8);ctx.lineTo(0,10);ctx.closePath();ctx.fill();
    ctx.restore();
    ctx.fillStyle="rgba(220,150,90,.5)";ctx.fillRect(cx-14,y0+10,28,8);
  }else if(k==="storage"){
    ctx.fillStyle="#1d2f42";ctx.strokeStyle="rgba(150,190,220,.6)";
    for(let i=0;i<3;i++)for(let j=0;j<2;j++){
      ctx.beginPath();ctx.rect(x0+14+i*36,cy-18+j*22,30,18);ctx.fill();ctx.stroke();
    }
  }else if(k==="habitat"){
    /* окна горят тем ровнее, чем лучше с энергией */
    ctx.fillStyle="#141d28";ctx.fillRect(x0+8,cy-16,w-16,32);
    for(let i=0;i<4;i++){
      const on=Math.sin(G.t*.03+i*1.7)>-.3;
      ctx.fillStyle=on?"rgba(255,230,170,"+(.35+lit*.55).toFixed(2)+")":"rgba(255,230,170,.12)";
      ctx.beginPath();ctx.arc(x0+24+i*26,cy,5,0,TAU);ctx.fill();
    }
  }else if(k==="refinery"){
    ctx.strokeStyle="rgba(210,140,80,.85)";ctx.lineWidth=2;ctx.fillStyle="#14161a";
    ctx.beginPath();ctx.moveTo(x0+16,y0+h-10);ctx.lineTo(x0+30,cy-14);
    ctx.lineTo(x0+w-30,cy-14);ctx.lineTo(x0+w-16,y0+h-10);ctx.closePath();ctx.fill();ctx.stroke();
    const fl=Math.abs(Math.sin(G.t*.11))*8*lit;
    ctx.fillStyle="rgba(255,170,70,.8)";
    ctx.beginPath();ctx.ellipse(cx,cy+6,6,4+fl,0,0,TAU);ctx.fill();
  }else if(k==="pad"){
    ctx.strokeStyle="rgba(127,230,216,.8)";ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(cx,cy+8,w*.34,10,0,0,TAU);ctx.stroke();
    ctx.fillStyle=(Math.sin(G.t*.14)>0)?"rgba(127,230,216,.8)":"rgba(127,230,216,.2)";
    for(let i=0;i<4;i++){
      const a=i*TAU/4+G.t*.01;
      ctx.beginPath();ctx.arc(cx+Math.cos(a)*w*.34,cy+8+Math.sin(a)*10,2.4,0,TAU);ctx.fill();
    }
  }
  ctx.fillStyle="rgba(242,178,92,"+(.4+lit*.4).toFixed(2)+")";
  ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
  ctx.fillText(BUILD[k].ru.toUpperCase(),cx,y0+h-4);
}
function drawBuildMenu(S){
  const w=Math.min(W-40,420),x=W/2-w/2,y=H-150;
  ctx.fillStyle="rgba(6,10,16,.88)";ctx.fillRect(x,y,w,64);
  ctx.strokeStyle="rgba(242,178,92,.6)";ctx.lineWidth=1;ctx.strokeRect(x,y,w,64);
  const n=BUILD_KEYS.length,cw=w/n;
  for(let i=0;i<n;i++){
    const k=BUILD_KEYS[i],on=i===S.pick;
    ctx.fillStyle=on?"rgba(242,178,92,.18)":"rgba(0,0,0,0)";
    ctx.fillRect(x+i*cw,y+2,cw,60);
    ctx.fillStyle=on?"rgba(255,230,180,.95)":"rgba(200,210,220,.5)";
    ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText(BUILD[k].ru.toUpperCase().slice(0,9),x+i*cw+cw/2,y+22);
    const bc=baseCost(k);
    ctx.fillText(bc.credits+"кр",x+i*cw+cw/2,y+36);
    if(bc.alloy)ctx.fillText(bc.alloy+"спл",x+i*cw+cw/2,y+48);
  }
}
