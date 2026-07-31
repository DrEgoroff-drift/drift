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
  /* соседние отсеки — одна выработка, а не ряд коробок: идущие подряд ячейки
     собираются в один прямоугольник, иначе между ними остаётся полоска породы
     и разрез снова читается таблицей */
  for(let r=0;r<baseRows(B);r++){
    let run=-1;
    for(let c=0;c<=BASE_COLS;c++){
      const has=c<BASE_COLS&&!!baseCell(B,c,r);
      if(has&&run<0)run=c;
      if(!has&&run>=0){
        P.rect(X(90+run*BCELL_W)+pad,Y(150+r*BCELL_H)+pad,
               (c-run)*BCELL_W-pad*2,BCELL_H-pad*2);
        run=-1;
      }
    }
  }
  /* ствол лифта — тоже пустота, и он связывает уровни в одно сооружение.
     Копаем его лишь до самого нижнего построенного яруса: пустая шахта
     в нетронутой породе выглядит как забытая линия */
  let deep=1;
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++)if(baseCell(B,c,r))deep=Math.max(deep,r+1);
  const lx=X(cellX(Math.floor(BASE_COLS/2)));
  P.rect(lx-13,Y(150),26,deep*BCELL_H);
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
  /* кромка грунта не линейка: мелкий рельеф из того же шума, что и планета.
     Путь держим объектом: fillMaterial клипует по ПЕРЕДАННОМУ пути, а не по
     текущему — иначе материал ляжет в последний нарисованный пласт (так и было) */
  const GP=new Path2D();
  GP.moveTo(0,H);GP.lineTo(0,gy);
  for(let x=0;x<=W;x+=6){
    const wob=(fbm2((x+camx)*.008,3.3,B.idx*77+13,3)-.5)*16;
    GP.lineTo(x,gy+wob);
  }
  GP.lineTo(W,H);GP.closePath();
  /* Порода — это НЕ палитра поверхности: пески и зелень с картинки планеты под
     землёй читаются как трава и небо (так и вышло с первого раза). Берём тот же
     цвет, но уведённый в тёмное и обесцвеченный — узнаваемо и при этом подземно */
  const rc=i=>mixc(pal[Math.min(i,pal.length-1)],[26,19,14],.66);
  const rock=ctx.createLinearGradient(0,gy,0,Y(150+baseRows(B)*BCELL_H+120));
  rock.addColorStop(0,rgba(rc(1),1));
  rock.addColorStop(.55,rgba(rc(3),1));
  rock.addColorStop(1,rgba(rc(4),1));
  ctx.fillStyle=rock;ctx.fill(GP);
  /* пласты: границы гуляют, поэтому это порода, а не полосатый матрас */
  ctx.save();ctx.clip(GP);
  for(let r=0;r<baseRows(B)+2;r++){
    const y0=150+r*BCELL_H*1.15;
    ctx.beginPath();ctx.moveTo(0,Y(y0));
    for(let x=0;x<=W;x+=10)ctx.lineTo(x,Y(y0)+(fbm2((x+camx)*.004,r*2.7,B.idx*31+5,3)-.5)*26);
    ctx.lineTo(W,Y(y0)+BCELL_H*1.15);ctx.lineTo(0,Y(y0)+BCELL_H*1.15);ctx.closePath();
    ctx.fillStyle=r%2?"rgba(0,0,0,.30)":"rgba(255,255,255,.055)";ctx.fill();
  }
  const mat=pl?planetMat(pl):null;
  if(mat)fillMaterial(mat,camx,camy,.34,.26,GP,{x:0,y:Math.max(0,gy),w:W,h:H});
  /* Материал планеты — это её ПОВЕРХНОСТЬ: во всю силу под землёй он читается
     мхом и травой. Умножением уводим всё в бурое: фактура остаётся, зелень
     уходит, и разрез начинает выглядеть разрезом */
  ctx.globalCompositeOperation="multiply";
  ctx.fillStyle="rgb(126,94,64)";ctx.fill(GP);
  ctx.globalCompositeOperation="source-over";
  /* верхний слой почвы: без него кромка грунта — просто линия среза */
  ctx.save();ctx.clip(GP);
  ctx.fillStyle="rgba(20,14,9,.45)";ctx.fillRect(0,Math.max(0,gy),W,16);
  ctx.restore();
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
  /* Стяжка идёт по полу только там, где есть отсеки: раньше она чертилась во всю
     ширину базы на каждом ярусе, включая нетронутые, и оранжевые линии висели
     прямо в породе */
  ctx.strokeStyle="rgba(242,178,92,"+(.16+lit*.26).toFixed(2)+")";ctx.lineWidth=2;
  let deepest=0;
  for(let r=0;r<baseRows(B);r++){
    let c0=-1,c1=-1;
    for(let c=0;c<BASE_COLS;c++)if(baseCell(B,c,r)){if(c0<0)c0=c;c1=c;}
    if(c0<0)continue;
    deepest=r+1;
    const y=Y(150+r*BCELL_H+BCELL_H*.78);
    ctx.beginPath();
    ctx.moveTo(X(96+c0*BCELL_W),y);ctx.lineTo(X(90+(c1+1)*BCELL_W-6),y);ctx.stroke();
  }
  const lx=X(cellX(Math.floor(BASE_COLS/2)));
  ctx.strokeStyle="rgba(150,190,220,.30)";ctx.lineWidth=1;
  const shaftB=Y(150+Math.max(1,deepest)*BCELL_H);
  ctx.beginPath();ctx.moveTo(lx-10,Y(150));ctx.lineTo(lx-10,shaftB);
  ctx.moveTo(lx+10,Y(150));ctx.lineTo(lx+10,shaftB);ctx.stroke();
  ctx.strokeStyle="rgba(150,190,220,.16)";
  for(let r=0;r<=Math.max(1,deepest)*2;r++){
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
  const selCell=baseCell(B,S.cur,S.row);
  if(selCell){
    /* у построенного отсека — не рамка во всю клетку, а уголки и подпись:
       имена всех отсеков разом снова превращали разрез в таблицу */
    const x1=sx+6,y1=sy+6,x2=sx+BCELL_W-6,y2=sy+BCELL_H-6,L=12;
    ctx.beginPath();
    ctx.moveTo(x1,y1+L);ctx.lineTo(x1,y1);ctx.lineTo(x1+L,y1);
    ctx.moveTo(x2-L,y1);ctx.lineTo(x2,y1);ctx.lineTo(x2,y1+L);
    ctx.moveTo(x2,y2-L);ctx.lineTo(x2,y2);ctx.lineTo(x2-L,y2);
    ctx.moveTo(x1+L,y2);ctx.lineTo(x1,y2);ctx.lineTo(x1,y2-L);
    ctx.stroke();
    ctx.fillStyle="rgba(180,240,232,.9)";
    ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
    const nm=BUILD[selCell.k].ru.toUpperCase()+(selCell.hp<=0?" · РАЗБИТ":"");
    ctx.fillText(nm,sx+BCELL_W/2,y1-5);
  }
  else{
    ctx.setLineDash([7,7]);
    ctx.strokeRect(sx+10,sy+10,BCELL_W-20,BCELL_H-20);
    ctx.setLineDash([]);
    ctx.fillStyle="rgba(127,230,216,.5)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("МЕСТО ПОД ЗАСТРОЙКУ",sx+BCELL_W/2,sy+BCELL_H/2+3);
  }
  if(S.menu)drawBuildMenu(S);
}
/* ══════════════ внутренности отсеков ══════════════ */
/* Отсек — это НЕ коробка в клетке: пустота уже вырублена общим путём (baseRoomPath),
   и рамка вокруг каждой ячейки возвращает разрезу вид таблицы. Рисуем только то,
   что в отсеке стоит, и пол, на котором оно стоит. Подпись — лишь у выбранного.

   МАСШТАБ. Человек в этой сцене ростом 26 px (`drawAstronaut` со scale .9), пол
   отсека — на `y0+86`, потолок — на `y0`. Значит: стол 16 px высотой, койка 12,
   дверной проём 24, стеллаж в три яруса по 22, реактор во всю высоту помещения.
   Всё, что рисуется здесь, меряется этими числами, а не «на глаз от ячейки», —
   иначе оборудование выходит игрушечным (кольцо реактора радиусом 16 было ниже
   пояса стоящему рядом человеку).

   ЯЗЫК. Тот же, что в кабине и на абордаже: тонкая линия, тёплый оранжевый —
   конструкции и предупреждения, холодный циан — питание, экраны и приборы,
   свет всегда откуда-то (лампа, топка, ядро), а не разлит равномерно. */
const BM_WARM="242,178,92", BM_COOL="127,230,216", BM_CORE="140,240,255";
/* стойка/панель обшивки: заливка + светлая кромка сверху и тень снизу.
   Из этих трёх линий собирается почти вся мебель отсеков */
function bBox(x,y,w,h,fill,lit,edge){
  ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);
  ctx.fillStyle="rgba(255,255,255,"+(.05+lit*.10).toFixed(3)+")";ctx.fillRect(x,y,w,1);
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(x,y+h-1,w,1);
  if(edge){ctx.strokeStyle=edge;ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);}
}
/* задняя стена: обшивка секциями и заклёпки. Без неё за оборудованием чёрная
   дыра, и отсек читается вырезкой, а не помещением */
function bWall(x0,y0,w,h,lit,seed){
  const R=rng(seed);
  ctx.save();ctx.beginPath();ctx.rect(x0,y0,w,h);ctx.clip();
  ctx.fillStyle="rgba(26,33,42,"+(.55+lit*.25).toFixed(2)+")";ctx.fillRect(x0,y0,w,h);
  for(let i=0;i<4;i++){
    const px=x0+4+i*(w-8)/4;
    ctx.fillStyle="rgba(255,255,255,"+(.014+R()*.02).toFixed(3)+")";
    ctx.fillRect(px,y0+6,(w-8)/4-3,h-14);
    ctx.fillStyle="rgba(0,0,0,.25)";ctx.fillRect(px+(w-8)/4-3,y0+6,1,h-14);
  }
  ctx.fillStyle="rgba(190,205,220,"+(.06+lit*.08).toFixed(3)+")";
  for(let i=0;i<5;i++)ctx.fillRect(x0+8+i*(w-16)/4,y0+4,2,2);
  ctx.restore();
}
/* труба: колено из двух отрезков, блик по верхней кромке */
function bPipe(pts,wd,col,lit){
  ctx.lineCap="round";ctx.lineJoin="round";
  ctx.strokeStyle="rgba(0,0,0,.5)";ctx.lineWidth=wd+2;
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();
  ctx.strokeStyle="rgba("+col+","+(.35+lit*.35).toFixed(2)+")";ctx.lineWidth=wd;ctx.stroke();
  ctx.strokeStyle="rgba(255,255,255,"+(.10+lit*.12).toFixed(2)+")";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]-wd*.3);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]-wd*.3);ctx.stroke();
  ctx.lineCap="butt";
}
/* экран: тёмное стекло, строки данных, бегущая полоса развёртки */
function bScreen(x,y,w,h,col,lit,seed){
  bBox(x-2,y-2,w+4,h+4,"rgba(12,16,22,.95)",lit,"rgba(120,140,160,.35)");
  ctx.fillStyle="rgba("+col+","+(.05+lit*.07).toFixed(3)+")";ctx.fillRect(x,y,w,h);
  const R=rng(seed);
  for(let i=0;i<Math.floor(h/4);i++){
    const lw=(3+R()*(w-8))|0;
    ctx.fillStyle="rgba("+col+","+(.20+lit*.45).toFixed(2)+")";
    ctx.fillRect(x+2,y+2+i*4,lw,1.4);
  }
  const sy=y+((G.t*.8+seed*7)%(h+8))-4;
  ctx.fillStyle="rgba("+col+","+(.10+lit*.14).toFixed(3)+")";
  if(sy>y&&sy<y+h)ctx.fillRect(x,sy,w,2);
}
/* ящик: не квадрат, а контейнер — обвязка, угловые накладки, маркировка */
function bCrate(x,y,w,h,c,lit,tag){
  bBox(x,y,w,h,"rgba("+c+",.92)",lit,"rgba(0,0,0,.5)");
  ctx.strokeStyle="rgba(255,255,255,"+(.06+lit*.10).toFixed(3)+")";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x+.5,y+h*.35);ctx.lineTo(x+w-.5,y+h*.35);
  ctx.moveTo(x+w*.5,y+h*.35);ctx.lineTo(x+w*.5,y+h-.5);ctx.stroke();
  if(tag){ctx.fillStyle="rgba("+BM_WARM+","+(.30+lit*.40).toFixed(2)+")";
    ctx.fillRect(x+2,y+2,Math.min(10,w-4),3);}
}
/* лампа под потолком: сама полоса и конус света, падающий на пол */
function bLamp(cx,y,w,fy,col,a){
  ctx.fillStyle="rgba("+col+","+(.55*a).toFixed(3)+")";ctx.fillRect(cx-w/2,y,w,2.5);
  const g=ctx.createLinearGradient(0,y,0,fy);
  g.addColorStop(0,"rgba("+col+","+(.14*a).toFixed(3)+")");
  g.addColorStop(1,"rgba("+col+",0)");
  ctx.fillStyle=g;ctx.beginPath();
  ctx.moveTo(cx-w/2,y);ctx.lineTo(cx+w/2,y);ctx.lineTo(cx+w*1.5,fy);ctx.lineTo(cx-w*1.5,fy);
  ctx.closePath();ctx.fill();
}
/* предупреждающая штриховка на полу — язык опасного оборудования */
function bHazard(x,y,w,h,a){
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  ctx.fillStyle="rgba(20,16,10,"+(.7*a).toFixed(2)+")";ctx.fillRect(x,y,w,h);
  ctx.strokeStyle="rgba("+BM_WARM+","+(.45*a).toFixed(2)+")";ctx.lineWidth=3;
  for(let i=-h;i<w;i+=8){ctx.beginPath();ctx.moveTo(x+i,y+h);ctx.lineTo(x+i+h,y);ctx.stroke();}
  ctx.restore();
}
/* тёплое пятно от источника: свет должен ложиться на пол и стены, иначе
   светящаяся деталь выглядит наклейкой поверх тёмной комнаты */
function bGlow(cx,cy,r,col,a){
  const g=ctx.createRadialGradient(cx,cy,1,cx,cy,r);
  g.addColorStop(0,"rgba("+col+","+a.toFixed(3)+")");
  g.addColorStop(1,"rgba("+col+",0)");
  ctx.save();ctx.globalCompositeOperation="lighter";
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.fill();ctx.restore();
}
/* человек на рабочем месте: та же схема, что у астронавта, но сидя/стоя и мелко.
   Живой отсек отличается от макета именно тем, что в нём кто-то есть */
/* Человек рисуется телом, а не палками: комбинезон — трапеция плеч, ранец за
   спиной, шлем со стеклом и бликом, руки и ноги в два звена. Палочный человечек
   рядом с проработанным оборудованием сразу выдаёт макет. Рост 24 px стоя,
   тем же мерилом смеряна вся мебель. */
function bWorker(x,fy,lit,sit,phase,face){
  const a=(.45+lit*.45),d=face===-1?-1:1;
  const bob=Math.sin(phase)*.7, sw=Math.sin(phase*1.6);
  /* Комбинезон средне-серый, а не белый: белое пятно ростом в 24 px на тёмной
     стене читается кляксой. Светлые только шлем и кант — глаз собирает фигуру
     по ним, а не по силуэту. */
  const body="rgba("+(sit?"126,140,156":"134,148,164")+","+a.toFixed(2)+")";
  const dark="rgba(56,66,80,"+(a*.95).toFixed(2)+")";
  ctx.save();ctx.translate(x,fy);ctx.scale(d,1);
  const hipY=sit?-13:-11, shY=-19+bob, headY=sit?-25+bob:-26+bob;
  if(sit){                                                  // стул: сиденье, спинка, ножка
    ctx.fillStyle="rgba(40,48,58,"+(a*.8).toFixed(2)+")";
    ctx.fillRect(-6,-13,14,2.5);ctx.fillRect(-7,-24,2.5,12);
    ctx.fillRect(0,-11,2,11);
    ctx.fillStyle=dark;                                     // бедро и голень
    ctx.fillRect(0,-13,10,3.4);ctx.fillRect(8,-11,3.4,11);
  }else{
    /* дальняя нога темнее ближней — иначе две одинаковые полоски слипаются
       в один столбик и человек читается кеглей */
    ctx.fillStyle="rgba(40,48,60,"+(a*.95).toFixed(2)+")";
    ctx.fillRect(-1-sw*1.8,hipY,3.4,11);
    ctx.fillStyle=dark;ctx.fillRect(-1+sw*1.8,hipY,3.6,11);
    ctx.fillStyle="rgba(30,38,48,"+a.toFixed(2)+")";        // ботинки
    ctx.fillRect(-2+sw*1.6,-2,5.4,2);ctx.fillRect(-2-sw*1.6,-2,5.4,2);
  }
  ctx.fillStyle="rgba(56,66,80,"+a.toFixed(2)+")";          // ранец
  ctx.fillRect(-6,shY+1,4,10);
  ctx.fillStyle=body;                                       // корпус трапецией
  ctx.beginPath();
  ctx.moveTo(-4,shY);ctx.lineTo(4,shY);ctx.lineTo(3.2,hipY+1);ctx.lineTo(-3.2,hipY+1);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(215,228,240,"+(a*.5).toFixed(2)+")";ctx.lineWidth=.9;ctx.stroke();
  ctx.fillStyle="rgba(0,0,0,.3)";ctx.fillRect(-3.8,shY+5,7.6,1.4);   // ремень
  ctx.strokeStyle=body;ctx.lineWidth=2.2;ctx.lineCap="round";        // рука к работе
  ctx.beginPath();ctx.moveTo(1,shY+2);
  ctx.lineTo(5,shY+(sit?5:6)+sw*1.4);ctx.lineTo(sit?10:8,shY+(sit?6:9)+sw*2);ctx.stroke();
  ctx.fillStyle="rgba(96,110,126,"+a.toFixed(2)+")";                 // шлем
  ctx.beginPath();ctx.arc(0,headY,3.6,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(225,236,246,"+(a*.75).toFixed(2)+")";ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle="rgba(14,20,30,"+(a*.95).toFixed(2)+")";             // стекло
  ctx.beginPath();ctx.arc(1,headY,2.5,-1.5,1.5);ctx.fill();
  ctx.fillStyle="rgba("+BM_COOL+","+(.30+lit*.45).toFixed(2)+")";     // блик
  ctx.beginPath();ctx.arc(2,headY-1,1,0,TAU);ctx.fill();
  ctx.restore();ctx.lineCap="butt";
}

function drawModule(k,x,y,lit,c,r,B){
  const w=BCELL_W-12,h=BCELL_H-12,x0=x+6,y0=y+6;
  const cx=x0+w/2,fy=y0+h-6,seed=hashi(c+1,r+1,(B&&B.idx|0)+7);
  const P=basePower(B);
  ctx.save();
  ctx.beginPath();ctx.rect(x0-2,y0-2,w+4,h+4);ctx.clip();   // ничего не вылезает в породу
  /* задняя стена и пол — общие для всех отсеков: сначала помещение, потом мебель */
  bWall(x0,y0,w,h-8,lit,seed);
  const F=BASE_ROOM[k];
  if(F)F(x0,y0,w,h,cx,fy,lit,seed,B,P,c,r);
  /* пол поверх всего: плита со светом сверху и тень, которой мебель касается */
  ctx.fillStyle="rgba(120,132,146,"+(.10+lit*.16).toFixed(2)+")";ctx.fillRect(x0,fy-4,w,4);
  ctx.fillStyle="rgba(150,166,182,"+(.05+lit*.08).toFixed(3)+")";ctx.fillRect(x0,fy-4,w,1);
  ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x0,fy,w,6);
  ctx.restore();
}
/* Каждый отсек — своя функция: так их видно списком и можно править по одному,
   не разбирая общий `if/else if` на восемь ветвей. */
const BASE_ROOM={
/* ── РЕАКТОР: гермозона во всю высоту, ядро, теплоноситель, пульт ── */
reactor(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const vw=46,vh=66,vx=x0+18,vy=fy-vh;              // сосуд от пола почти до потолка
  /* ядро светит по отдаче, но не гаснет совсем: тёмный сосуд читается баком,
     а не реактором, — нижний порог оставляет столб света видимым всегда */
  const heat=.35+P.eff*.65;
  const pulse=.55+Math.sin(G.t*.05)*.10+Math.sin(G.t*.11)*.05;
  bHazard(vx-8,fy-4,vw+16,4,.8);
  /* теплоноситель уходит в потолок и вбок к соседям — база связана трубами */
  bPipe([[vx+10,vy+8],[vx+10,y0+10],[x0+w-6,y0+10]],5,"120,140,158",lit);
  bPipe([[vx+vw-10,vy+10],[vx+vw-10,y0+22],[x0+w-6,y0+22]],4,"120,140,158",lit);
  /* корпус: бочка с фаской, рёбра жёсткости, смотровые люки */
  bBox(vx,vy,vw,vh,"rgba(28,36,46,.96)",lit,"rgba(150,170,190,.35)");
  ctx.fillStyle="rgba(16,22,30,.9)";ctx.fillRect(vx+5,vy+6,vw-10,vh-14);
  /* ядро: столб света внутри, ярче внизу, с дрожью */
  const cg=ctx.createLinearGradient(0,vy+8,0,fy-8);
  cg.addColorStop(0,"rgba("+BM_CORE+","+(.18+heat*.45*pulse).toFixed(3)+")");
  cg.addColorStop(.6,"rgba("+BM_CORE+","+(.45+heat*.75*pulse).toFixed(3)+")");
  cg.addColorStop(1,"rgba(215,252,255,"+(.30+heat*.60*pulse).toFixed(3)+")");
  ctx.fillStyle=cg;ctx.fillRect(vx+9,vy+10,vw-18,vh-20);
  /* Активная зона — яркая полоса в середине столба: пять тёмных стержней во всю
     высоту превращали сосуд в решётку радиатора. Оставляем три, и только там,
     где холоднее, а в середине — свет. */
  ctx.fillStyle="rgba(10,16,22,"+(.40+lit*.2).toFixed(2)+")";
  for(let i=0;i<3;i++)ctx.fillRect(vx+13+i*((vw-26)/2.4),vy+12,2.4,vh-24);
  const zg=ctx.createLinearGradient(0,vy+vh*.42,0,vy+vh*.72);
  zg.addColorStop(0,"rgba(220,252,255,0)");
  zg.addColorStop(.5,"rgba(235,254,255,"+(.85*heat*pulse).toFixed(3)+")");
  zg.addColorStop(1,"rgba(220,252,255,0)");
  ctx.fillStyle=zg;ctx.fillRect(vx+9,vy+vh*.42,vw-18,vh*.3);
  /* обручи корпуса */
  for(let i=0;i<3;i++){
    const by=vy+10+i*(vh-20)/2.6;
    bBox(vx-3,by,vw+6,6,"rgba(38,48,60,.95)",lit,"rgba(0,0,0,.5)");
    ctx.fillStyle="rgba(190,205,220,"+(.10+lit*.12).toFixed(2)+")";
    for(let j=0;j<4;j++)ctx.fillRect(vx+j*(vw/4)+5,by+2,2,2);
  }
  bGlow(cx-30,fy-vh*.5,58,BM_CORE,(.10+heat*.22)*pulse);
  /* Пульт: тумба по пояс, наклонная приборная доска, два экрана и клавиатура.
     Оператор стоит ПЕРЕД доской, а не за глухим коробом — иначе от человека
     торчит одна голова, и стол читается пустым ящиком. */
  const dx=x0+w-50,dy=fy-16;
  bBox(dx,dy,44,16,"rgba(30,38,48,.96)",lit,"rgba(140,160,180,.28)");
  ctx.fillStyle="rgba(22,28,36,.97)";                        // наклонная доска
  ctx.beginPath();ctx.moveTo(dx,dy);ctx.lineTo(dx+44,dy);ctx.lineTo(dx+44,dy-13);ctx.lineTo(dx+8,dy-8);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(150,170,190,.28)";ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle="rgba("+BM_COOL+","+(.25+lit*.35).toFixed(2)+")";  // клавиши на доске
  for(let i=0;i<5;i++)ctx.fillRect(dx+12+i*6,dy-6,4,2);
  bScreen(dx+4,dy-32,22,16,BM_CORE,lit,seed);
  bScreen(dx+30,dy-30,14,14,P.eff>.6?BM_COOL:"255,150,90",lit,seed+3);
  bWorker(dx-9,fy,lit,false,G.t*.05+seed,1);
  /* аварийная лампа в корпусе с козырьком: мигает при нехватке мощности */
  if(P.eff<.6){
    const bl=Math.sin(G.t*.22)>0?1:.15,ax=x0+w-16,ay=y0+30;
    ctx.fillStyle="rgba(40,46,56,"+(.7+lit*.2).toFixed(2)+")";
    ctx.fillRect(ax-6,ay-7,12,3);ctx.fillRect(ax-1.5,ay-11,3,4);
    ctx.fillStyle="rgba(255,90,70,"+(.9*bl).toFixed(2)+")";
    ctx.beginPath();ctx.arc(ax,ay,3.4,0,TAU);ctx.fill();
    bGlow(ax,ay,22,"255,90,70",.26*bl);
  }
  bLamp(cx+34,y0+4,26,fy,BM_CORE,.35+lit*.4);
},
/* ── СОЛНЕЧНАЯ ПАНЕЛЬ: массив над грунтом, под ним — щитовая ── */
solar(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const R=rng(seed);
  /* Панель стоит НА поверхности, а помещение под ней — щитовая. Поэтому наверху
     узкая полоса светового люка и мачта, а не парящий по всему отсеку массив:
     в разрезе панель во всю комнату читалась как забытая доска. */
  /* наклон маленький, мачта ниже: при большом угле край массива уходил
     за потолок отсека и обрезался — панель читалась сломанной доской */
  const tilt=Math.sin(G.t*.005+seed)*.13-.07;
  const mx=x0+40,my=y0+19;
  /* световой люк: сквозь него в щитовую падает дневной свет */
  ctx.fillStyle="rgba(150,190,225,"+(.14+lit*.10).toFixed(3)+")";
  ctx.fillRect(mx-16,y0,32,3);
  /* луч дневного света тёплый и слабый: холодная серая клякса читалась пятном
     грязи на стене, а не солнцем из люка */
  const sg=ctx.createLinearGradient(mx,y0,mx+26,fy);
  sg.addColorStop(0,"rgba(255,238,205,"+(.13+lit*.07).toFixed(3)+")");
  sg.addColorStop(1,"rgba(255,238,205,0)");
  ctx.fillStyle=sg;ctx.beginPath();
  ctx.moveTo(mx-16,y0+2);ctx.lineTo(mx+16,y0+2);ctx.lineTo(mx+44,fy);ctx.lineTo(mx-2,fy);
  ctx.closePath();ctx.fill();
  /* мачта с приводом и сам массив: небольшой, зато с фермой снизу */
  ctx.fillStyle="rgba(60,72,86,"+(.6+lit*.3).toFixed(2)+")";ctx.fillRect(mx-2.5,y0+3,5,18);
  ctx.save();ctx.translate(mx,my);ctx.rotate(tilt);
  const pw=56,ph=8;
  ctx.strokeStyle="rgba(110,128,146,"+(.35+lit*.3).toFixed(2)+")";ctx.lineWidth=1.2;
  for(let i=-1;i<=1;i+=2){ctx.beginPath();ctx.moveTo(0,ph/2);ctx.lineTo(i*pw*.45,ph/2+4);ctx.stroke();}
  bBox(-pw/2,-ph/2,pw,ph,"rgba(24,42,66,.98)",lit,"rgba(130,190,230,.55)");
  for(let i=1;i<6;i++){ctx.fillStyle="rgba(120,170,210,.28)";ctx.fillRect(-pw/2+i*pw/6,-ph/2+1,1,ph-2);}
  const gx=-pw/2+((G.t*.6+seed*11)%(pw+24))-12;
  const gg=ctx.createLinearGradient(gx-10,0,gx+10,0);
  gg.addColorStop(0,"rgba(200,230,255,0)");
  gg.addColorStop(.5,"rgba(200,230,255,"+(.12+lit*.35).toFixed(2)+")");
  gg.addColorStop(1,"rgba(200,230,255,0)");
  ctx.fillStyle=gg;ctx.fillRect(-pw/2,-ph/2,pw,ph);
  ctx.restore();
  /* кабельный лоток по стене — то, чем массив соединён со щитом */
  bPipe([[mx,y0+16],[mx,y0+30],[x0+22,y0+34],[x0+22,fy-46]],3,"90,104,120",lit);
  /* щит: рама с автоматами, каждый переключается сам, и прибор с настоящей стрелкой */
  const px=x0+10,py=fy-46,pw2=44;
  bBox(px,py,pw2,46,"rgba(28,36,46,.97)",lit,"rgba(150,170,190,.32)");
  ctx.fillStyle="rgba(16,22,30,.9)";ctx.fillRect(px+3,py+16,pw2-6,26);
  for(let i=0;i<6;i++){
    const bx=px+6+(i%3)*12,by=py+20+((i/3)|0)*11,up=((seed>>i)&1)?P.eff>.4:true;
    ctx.fillStyle="rgba(60,70,84,"+(.7+lit*.2).toFixed(2)+")";ctx.fillRect(bx,by,8,9);
    ctx.fillStyle=up?"rgba("+BM_COOL+",.75)":"rgba(255,120,90,.75)";
    ctx.fillRect(bx+2,up?by+1:by+5,4,3);
  }
  const need=Math.max(.05,P.prod),gauge=clamp(P.prod?(P.prod-P.cons)/need*.5+.5:.5,0,1);
  ctx.fillStyle="rgba(12,16,22,.95)";ctx.beginPath();ctx.arc(px+pw2/2,py+12,9,Math.PI,TAU);ctx.fill();
  ctx.strokeStyle="rgba("+BM_COOL+","+(.30+lit*.45).toFixed(2)+")";ctx.lineWidth=1.2;
  ctx.beginPath();ctx.arc(px+pw2/2,py+12,9,Math.PI,TAU);ctx.stroke();
  for(let i=0;i<=4;i++){                                   // деления шкалы
    const a=Math.PI+i*Math.PI/4;
    ctx.beginPath();ctx.moveTo(px+pw2/2+Math.cos(a)*9,py+12+Math.sin(a)*9);
    ctx.lineTo(px+pw2/2+Math.cos(a)*6.5,py+12+Math.sin(a)*6.5);ctx.stroke();
  }
  const na=Math.PI+(gauge*.9+.05+Math.sin(G.t*.07)*.02)*Math.PI;
  ctx.strokeStyle="rgba(255,190,120,"+(.55+lit*.4).toFixed(2)+")";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(px+pw2/2,py+12);
  ctx.lineTo(px+pw2/2+Math.cos(na)*8,py+12+Math.sin(na)*8);ctx.stroke();
  /* батарейная стойка: рама, банки, уровень заряда и клеммы */
  const sx2=x0+62,sw2=w-72;
  bBox(sx2-3,fy-40,sw2+6,3,"rgba(44,54,66,.98)",lit,"rgba(0,0,0,.4)");
  for(let i=0;i<4;i++){
    const bx=sx2+i*(sw2/4);
    bBox(bx,fy-36,sw2/4-5,36,"rgba(24,32,42,.96)",lit,"rgba(120,140,160,.3)");
    const ch=clamp(P.eff*1.3-i*.15,0,1);
    ctx.fillStyle="rgba("+BM_COOL+","+(.22+lit*.5).toFixed(2)+")";
    ctx.fillRect(bx+3,fy-4-ch*28,sw2/4-11,ch*28);
    ctx.fillStyle="rgba(160,178,196,"+(.2+lit*.2).toFixed(2)+")";  // клеммы
    ctx.fillRect(bx+3,fy-39,3,3);ctx.fillRect(bx+sw2/4-11,fy-39,3,3);
    if(ch>.05&&R()<.9)bGlow(bx+sw2/8-2,fy-8,14,BM_COOL,.05+ch*.05);
  }
  bGlow(mx+10,fy-6,40,"200,225,255",.05+lit*.05);
},
/* ── БУРОВАЯ: портал, привод, шнек уходит сквозь пол, отвал на транспортёре ── */
drill(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const on=P.eff>.05,spin=on?G.t*.20*P.eff:0;
  bHazard(cx-34,fy-4,68,4,.85);
  /* Портал держит всю установку, поэтому он тяжёлый: широкие стойки на башмаках,
     балка с косынками и решётка раскосов между ярусами. Тонкие палки читались
     чертежом, а не машиной. */
  for(let i=0;i<2;i++){
    const px=i?cx+31:cx-40;
    bBox(px,y0+8,9,fy-y0-8,"rgba(32,40,50,.97)",lit,"rgba(0,0,0,.45)");
    ctx.fillStyle="rgba(58,70,84,"+(.5+lit*.3).toFixed(2)+")";     // башмак
    ctx.fillRect(px-3,fy-5,15,5);
    ctx.fillStyle="rgba(190,205,220,"+(.07+lit*.09).toFixed(3)+")"; // болты
    for(let j=0;j<5;j++)ctx.fillRect(px+3,y0+16+j*14,3,3);
  }
  bBox(cx-40,y0+8,80,10,"rgba(42,52,64,.97)",lit,"rgba(150,170,190,.28)");
  ctx.fillStyle="rgba(42,52,64,.97)";                               // косынки под балкой
  ctx.beginPath();ctx.moveTo(cx-31,y0+18);ctx.lineTo(cx-31,y0+28);ctx.lineTo(cx-19,y0+18);ctx.closePath();
  ctx.moveTo(cx+31,y0+18);ctx.lineTo(cx+31,y0+28);ctx.lineTo(cx+19,y0+18);ctx.closePath();ctx.fill();
  /* решётка раскосов — по ней и видно, что это ферма */
  ctx.strokeStyle="rgba(110,128,146,"+(.22+lit*.22).toFixed(2)+")";ctx.lineWidth=2.4;
  for(let i=0;i<3;i++){
    const ya=y0+18+i*16,yb=ya+16;
    ctx.beginPath();ctx.moveTo(cx-31,ya);ctx.lineTo(cx+31,yb);
    ctx.moveTo(cx+31,ya);ctx.lineTo(cx-31,yb);ctx.stroke();
  }
  /* привод: короб с двумя шкивами и ремнём, шкивы крутятся вместе с буром */
  bBox(cx-24,y0+26,48,20,"rgba(36,45,56,.98)",lit,"rgba(150,170,190,.30)");
  ctx.fillStyle="rgba(24,31,40,.95)";ctx.fillRect(cx-20,y0+30,40,12);
  /* мотор с рёбрами охлаждения слева и шкив с ремнём справа: два одинаковых
     круга посреди короба читались парой глаз, а не приводом */
  bBox(cx-19,y0+31,18,10,"rgba(50,60,74,.98)",lit,"rgba(0,0,0,.4)");
  ctx.fillStyle="rgba(150,168,186,"+(.12+lit*.14).toFixed(2)+")";
  for(let i=0;i<5;i++)ctx.fillRect(cx-17+i*3.4,y0+32,1.4,8);
  ctx.strokeStyle="rgba(190,205,220,"+(.25+lit*.3).toFixed(2)+")";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(cx+10,y0+36,6,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+10,y0+36);
  ctx.lineTo(cx+10+Math.cos(spin)*6,y0+36+Math.sin(spin)*6);ctx.stroke();
  ctx.lineWidth=1.6;ctx.strokeStyle="rgba(30,36,44,"+(.6+lit*.2).toFixed(2)+")";
  ctx.beginPath();ctx.moveTo(cx-1,y0+30.5);ctx.lineTo(cx+10,y0+30);
  ctx.moveTo(cx-1,y0+41.5);ctx.lineTo(cx+10,y0+42);ctx.stroke();
  /* штанга и шнек: винт рисуется синусом по фазе — вращение видно, а не подразумевается */
  const dy0=y0+46,dy1=fy+10;
  /* обсадная колонна: без неё винт висел оранжевой загогулиной посреди комнаты.
     Труба тёмная, шнек виден внутри неё, сверху и снизу — фланцы */
  bBox(cx-12,dy0,24,dy1-dy0,"rgba(20,26,34,.9)",lit,"rgba(140,158,176,.5)");
  ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(cx-10,dy0,5,dy1-dy0);   // тень внутри трубы
  ctx.strokeStyle="rgba(150,168,186,"+(.28+lit*.28).toFixed(2)+")";ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(cx,dy0);ctx.lineTo(cx,dy1);ctx.stroke();  // вал
  /* Виток шнека — половинка эллипса на каждый шаг спирали: ближняя половина
     светлая, дальняя тёмная. Синусоида в одну линию давала «бантики», по ним
     вращение не читалось вовсе. */
  ctx.save();ctx.beginPath();ctx.rect(cx-11,dy0+1,22,dy1-dy0-2);ctx.clip();
  const pitch=7, ph=(spin*1.6)%pitch;
  for(let yy=dy0-pitch;yy<dy1+pitch;yy+=pitch){
    const y2=yy+ph;
    ctx.strokeStyle="rgba(112,86,60,"+(.45+lit*.3).toFixed(2)+")";ctx.lineWidth=2.2;
    ctx.beginPath();ctx.ellipse(cx,y2,8,pitch*.5,0,Math.PI,TAU);ctx.stroke();   // дальняя половина витка
    ctx.strokeStyle="rgba(226,166,100,"+(.55+lit*.4).toFixed(2)+")";ctx.lineWidth=2.6;
    ctx.beginPath();ctx.ellipse(cx,y2+pitch*.5,8,pitch*.5,0,0,Math.PI);ctx.stroke(); // ближняя
  }
  ctx.strokeStyle="rgba(150,168,186,"+(.30+lit*.28).toFixed(2)+")";ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(cx,dy0);ctx.lineTo(cx,dy1);ctx.stroke();  // вал поверх дальних витков
  ctx.restore();
  ctx.fillStyle="rgba(52,62,76,"+(.7+lit*.2).toFixed(2)+")";  // фланцы колонны
  ctx.fillRect(cx-15,dy0,30,5);ctx.fillRect(cx-15,fy-22,30,5);
  ctx.fillStyle="rgba(190,205,220,"+(.10+lit*.12).toFixed(2)+")";
  for(let i=0;i<4;i++){ctx.fillRect(cx-12+i*8,dy0+1,3,3);ctx.fillRect(cx-12+i*8,fy-21,3,3);}
  /* устье скважины: воротник, пыль и подсветка снизу */
  bBox(cx-16,fy-8,32,8,"rgba(24,30,38,.98)",lit,"rgba(0,0,0,.5)");
  if(on){
    const R=rng(seed);
    for(let i=0;i<10;i++){
      const ph=(G.t*.03+R()*6)%1;
      ctx.fillStyle="rgba(200,168,130,"+((1-ph)*.30*P.eff).toFixed(3)+")";
      ctx.beginPath();ctx.arc(cx+(R()-.5)*38*ph*2,fy-6-ph*22,1.6+ph*2.4,0,TAU);ctx.fill();
    }
    bGlow(cx,fy-4,26,"255,180,110",.10*P.eff);
  }
  /* транспортёр отвала: лента с роликами, куски руды едут к стене */
  /* Лента — плотный короб с бортами и роликами ВНУТРИ: тонкая полоска с
     кружками под ней читалась палкой на шариках, а куски руды висели в воздухе */
  const bx=cx+18,bw2=x0+w-6-bx,by=fy-18;
  ctx.strokeStyle="rgba(90,104,120,"+(.35+lit*.2).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+5,fy);ctx.lineTo(bx+5,by+8);
  ctx.moveTo(x0+w-14,fy);ctx.lineTo(x0+w-14,by+8);ctx.stroke();      // опоры
  bBox(bx,by,bw2,9,"rgba(28,35,45,.98)",lit,"rgba(120,138,156,.35)");
  ctx.fillStyle="rgba(14,19,26,.9)";ctx.fillRect(bx+2,by+3,bw2-4,5); // полотно
  ctx.strokeStyle="rgba(120,138,156,"+(.18+lit*.18).toFixed(2)+")";ctx.lineWidth=1;
  for(let i=0;i<5;i++){const rx=bx+7+i*((bw2-14)/4);ctx.beginPath();ctx.arc(rx,by+6,2.4,0,TAU);ctx.stroke();}
  ctx.fillStyle="rgba(150,168,186,"+(.12+lit*.14).toFixed(2)+")";ctx.fillRect(bx,by,bw2,1.4);
  if(on)for(let i=0;i<5;i++){
    const t=((G.t*.012*P.eff)+i*.2)%1,ox=bx+4+t*(x0+w-10-bx);
    ctx.fillStyle="rgba(0,0,0,.4)";                        // тень куска на полотне
    ctx.beginPath();ctx.ellipse(ox,by+2.6,3.2,1,0,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(146,116,84,"+(.55+lit*.3).toFixed(2)+")";
    ctx.beginPath();ctx.ellipse(ox,by+.6,2.8,2.2,i,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(206,178,140,"+(.18+lit*.2).toFixed(2)+")";  // блик на куске
    ctx.beginPath();ctx.ellipse(ox-.8,by-.3,1.2,.8,i,0,TAU);ctx.fill();
  }
  /* пост управления: рычаг ходит, когда бур работает */
  const px=x0+14;
  bBox(px,fy-24,20,24,"rgba(30,38,48,.96)",lit,"rgba(140,160,180,.3)");
  bScreen(px+3,fy-21,14,10,on?BM_COOL:"255,150,90",lit,seed+5);
  ctx.strokeStyle="rgba("+BM_WARM+","+(.4+lit*.4).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(px+10,fy-24);
  ctx.lineTo(px+10+Math.sin(G.t*.04)*4*(on?1:0),fy-34);ctx.stroke();
},
/* ── СКЛАД: стеллажи в три яруса, тележка, разметка ── */
storage(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const R=rng(seed);
  /* заполненность настоящая: пустой склад стоит пустым, полный забит доверху */
  const fill=clamp(P.store?basePoolHeld(B)/P.store:0,0,1);
  ctx.fillStyle="rgba("+BM_WARM+",.10)";ctx.fillRect(x0+6,fy-3,w-12,2);  // разметка прохода
  for(let s=0;s<2;s++){
    const rx=x0+8+s*(w*.52),rw=w*.42,tiers=3;
    /* стойки и полки */
    for(let t=0;t<tiers;t++){
      const ty=fy-6-t*24;
      bBox(rx,ty-3,rw,3,"rgba(44,54,66,.98)",lit,"rgba(0,0,0,.4)");
      /* груз на полке: коробки, бочки и мешки — вперемешку, по хешу ячейки */
      let px=rx+3;
      while(px<rx+rw-8){
        const kind=R(),bw=8+R()*12,bh=12+R()*6;
        if((t+s)/ (tiers+1) > fill+.15){px+=bw+3;continue;}   // выше уровня запаса полки пустые
        if(kind<.5)bCrate(px,ty-3-bh,bw,bh,"58,52,44",lit,R()<.4);
        else if(kind<.8){                                     // бочка
          bBox(px,ty-3-bh,bw*.8,bh,"rgba(46,58,52,.95)",lit,"rgba(0,0,0,.45)");
          ctx.strokeStyle="rgba(160,180,196,"+(.12+lit*.14).toFixed(2)+")";ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(px,ty-3-bh*.7);ctx.lineTo(px+bw*.8,ty-3-bh*.7);
          ctx.moveTo(px,ty-3-bh*.3);ctx.lineTo(px+bw*.8,ty-3-bh*.3);ctx.stroke();
        }else{                                                // мешок
          ctx.fillStyle="rgba(66,60,50,.95)";
          ctx.beginPath();ctx.ellipse(px+bw*.4,ty-3-bh*.45,bw*.45,bh*.5,0,0,TAU);ctx.fill();
        }
        px+=bw+3;
      }
    }
    bBox(rx-3,fy-78,4,78,"rgba(40,50,62,.98)",lit,"rgba(0,0,0,.4)");
    bBox(rx+rw-1,fy-78,4,78,"rgba(40,50,62,.98)",lit,"rgba(0,0,0,.4)");
  }
  /* табличка яруса — склад без маркировки не склад */
  ctx.fillStyle="rgba("+BM_WARM+","+(.25+lit*.35).toFixed(2)+")";
  ctx.fillRect(x0+10,y0+6,16,7);
  ctx.fillStyle="rgba(10,14,20,.8)";ctx.fillRect(x0+12,y0+8,12,3);
  /* тележка у прохода */
  const tx=cx-6+Math.sin(G.t*.008+seed)*10;
  bBox(tx,fy-13,22,9,"rgba(52,44,36,.95)",lit,"rgba(0,0,0,.45)");
  ctx.strokeStyle="rgba(150,168,186,"+(.25+lit*.2).toFixed(2)+")";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(tx+21,fy-13);ctx.lineTo(tx+25,fy-22);ctx.stroke();
  ctx.fillStyle="rgba(30,36,44,.95)";
  ctx.beginPath();ctx.arc(tx+4,fy-2,3,0,TAU);ctx.arc(tx+17,fy-2,3,0,TAU);ctx.fill();
  bLamp(cx,y0+4,30,fy,"255,232,196",.25+lit*.35);
},
/* ── ЖИЛОЙ ОТСЕК: койки, стол, шкафчики, зелень, иллюминатор ── */
habitat(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const warm=(.35+lit*.5);
  /* двухъярусные койки слева: рама, матрас, одеяло, спящий */
  const bx=x0+8,bw=52;
  for(let t=0;t<2;t++){
    const by=fy-14-t*32;
    bBox(bx,by,bw,5,"rgba(46,56,68,.98)",lit,"rgba(0,0,0,.4)");        // основание
    bBox(bx+2,by-8,bw-4,8,"rgba(78,74,70,.95)",lit,null);              // матрас
    ctx.fillStyle="rgba(96,74,60,"+(.65+lit*.2).toFixed(2)+")";        // одеяло
    ctx.beginPath();ctx.moveTo(bx+2,by-6);ctx.lineTo(bx+bw*.62,by-8-(t?1:2));
    ctx.lineTo(bx+bw*.62,by);ctx.lineTo(bx+2,by);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(150,158,168,"+(.30+lit*.22).toFixed(2)+")";    // подушка
    ctx.beginPath();ctx.ellipse(bx+bw-10,by-6,7,3.4,0,0,TAU);ctx.fill();
    if(t===0){                                                          // на нижней спят
      const br=Math.sin(G.t*.03)*.6;
      ctx.fillStyle="rgba(158,168,180,"+(.32+lit*.28).toFixed(2)+")";  // затылок спящего
      ctx.beginPath();ctx.arc(bx+bw-13,by-9,3.2,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(96,74,60,"+(.7+lit*.2).toFixed(2)+")";
      ctx.beginPath();ctx.ellipse(bx+bw*.4,by-8+br,bw*.32,3.4,0,0,TAU);ctx.fill();
    }
    /* лампочка для чтения у изголовья */
    const on=Math.sin(G.t*.02+t*2.1)>-.5;
    ctx.fillStyle="rgba(255,214,150,"+((on?.8:.15)*warm).toFixed(2)+")";
    ctx.beginPath();ctx.arc(bx+bw-3,by-14,2,0,TAU);ctx.fill();
    if(on)bGlow(bx+bw-3,by-14,18,"255,200,140",.10*warm);
  }
  ctx.strokeStyle="rgba(120,138,156,"+(.2+lit*.2).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+bw-2,fy);ctx.lineTo(bx+bw-2,fy-46);ctx.stroke();  // стойка коек
  /* стол с лампой, кружкой и планшетом; за ним сидит человек */
  const tx=cx+16;
  bBox(tx,fy-16,44,4,"rgba(60,50,42,.98)",lit,"rgba(0,0,0,.4)");
  ctx.fillStyle="rgba(40,48,58,.9)";ctx.fillRect(tx+4,fy-12,3,12);ctx.fillRect(tx+37,fy-12,3,12);
  ctx.fillStyle="rgba(210,225,238,"+warm.toFixed(2)+")";ctx.fillRect(tx+30,fy-21,6,5);  // кружка
  ctx.fillRect(tx+35,fy-20,2,2);
  bScreen(tx+8,fy-26,14,10,BM_COOL,lit,seed+2);
  /* настольная лампа даёт тёплое пятно — главный источник уюта в кадре */
  ctx.strokeStyle="rgba(160,176,192,"+(.3+lit*.2).toFixed(2)+")";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(tx+42,fy-16);ctx.lineTo(tx+42,fy-30);ctx.lineTo(tx+36,fy-33);ctx.stroke();
  ctx.fillStyle="rgba(255,220,160,"+(.7*warm+.2).toFixed(2)+")";
  ctx.beginPath();ctx.arc(tx+35,fy-32,2.6,0,TAU);ctx.fill();
  bGlow(tx+35,fy-30,34,"255,206,150",.10+lit*.10);
  bWorker(tx+2,fy,lit,true,G.t*.03+seed);
  /* шкафчики и зелень: жильё узнаётся по мелочам, а не по койкам */
  const lx=x0+w-26;
  for(let i=0;i<3;i++)bBox(lx,y0+16+i*18,22,16,"rgba(34,42,52,.96)",lit,"rgba(130,150,170,.25)");
  ctx.fillStyle="rgba(150,170,190,"+(.2+lit*.2).toFixed(2)+")";
  for(let i=0;i<3;i++)ctx.fillRect(lx+16,y0+22+i*18,4,2);
  const gx=cx+4;
  bBox(gx-5,fy-10,10,10,"rgba(70,54,44,.95)",lit,"rgba(0,0,0,.4)");
  /* листья разной длины и приглушённого цвета: ровный ярко-зелёный веер
     смотрелся салатом из семи одинаковых перьев */
  for(let i=0;i<6;i++){
    const a=-Math.PI/2+(i-2.5)*.36+Math.sin(G.t*.01+i)*.05;
    const len=8+((i*37)%5)*1.6;
    ctx.strokeStyle="rgba("+(i%2?"78,132,80":"96,152,92")+","+(.45+lit*.3).toFixed(2)+")";
    ctx.lineWidth=i%2?1.4:2;
    ctx.beginPath();ctx.moveTo(gx,fy-10);
    ctx.quadraticCurveTo(gx+Math.cos(a)*5,fy-14-len*.4,gx+Math.cos(a)*(len*.9),fy-12-len);ctx.stroke();
  }
  /* иллюминатор-экран: в разрезе окна быть не может, поэтому это вид с камеры */
  const px=x0+w-52,py=y0+14;
  ctx.fillStyle="rgba(8,12,20,.95)";ctx.beginPath();ctx.arc(px,py,11,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(60,110,150,"+(.18+lit*.22).toFixed(2)+")";
  ctx.beginPath();ctx.arc(px,py,10,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(220,235,250,"+(.4+lit*.3).toFixed(2)+")";
  for(let i=0;i<4;i++){const a=seed+i*2.1;
    ctx.fillRect(px+Math.cos(a)*7,py+Math.sin(a)*6,1.4,1.4);}
  ctx.strokeStyle="rgba(150,170,190,"+(.25+lit*.25).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(px,py,11,0,TAU);ctx.stroke();
  /* потолочный свет тёплый: жилой отсек — единственное место на базе, где не
     должно быть сине-стального цеха, и одной настольной лампы на это не хватает */
  bLamp(cx-6,y0+4,34,fy,"255,222,178",.30+lit*.40);
},
/* ── ПЛАВИЛЬНЯ: печь, ковш, изложницы, вытяжка, искры ── */
refinery(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const hot=P.eff,fl=(.65+Math.sin(G.t*.13)*.2+Math.sin(G.t*.31)*.1)*hot;
  bHazard(x0+6,fy-4,w-12,4,.5);
  /* печь: корпус, арочная топка, свет из неё бьёт вперёд */
  const ox=x0+10,oy=fy-52,ow=54,oh=52;
  bBox(ox,oy,ow,oh,"rgba(34,30,28,.98)",lit,"rgba(160,120,80,.35)");
  ctx.fillStyle="rgba(20,16,14,.95)";
  ctx.beginPath();ctx.moveTo(ox+10,fy-6);ctx.lineTo(ox+10,oy+22);
  ctx.quadraticCurveTo(ox+ow/2,oy+6,ox+ow-10,oy+22);ctx.lineTo(ox+ow-10,fy-6);ctx.closePath();ctx.fill();
  const fg=ctx.createRadialGradient(ox+ow/2,fy-14,2,ox+ow/2,fy-14,30);
  fg.addColorStop(0,"rgba(255,236,180,"+(.85*fl).toFixed(2)+")");
  fg.addColorStop(.45,"rgba(255,150,50,"+(.55*fl).toFixed(2)+")");
  fg.addColorStop(1,"rgba(180,40,10,0)");
  ctx.fillStyle=fg;ctx.beginPath();
  ctx.moveTo(ox+10,fy-6);ctx.lineTo(ox+10,oy+22);
  ctx.quadraticCurveTo(ox+ow/2,oy+6,ox+ow-10,oy+22);ctx.lineTo(ox+ow-10,fy-6);ctx.closePath();ctx.fill();
  /* обвязка печи и вытяжка в потолок */
  ctx.strokeStyle="rgba(150,120,90,"+(.25+lit*.25).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(ox,oy+16);ctx.lineTo(ox+ow,oy+16);ctx.stroke();
  bPipe([[ox+ow/2,oy+2],[ox+ow/2,y0+8],[x0+w-8,y0+8]],7,"70,78,88",lit);
  /* ковш на рельсе: наклоняется и льёт металл в изложницу */
  const cyc=(G.t*.006+seed)%1, pour=cyc>.45&&cyc<.75&&hot>.2;
  const lx=ox+ow+26;
  ctx.strokeStyle="rgba(120,138,156,"+(.25+lit*.2).toFixed(2)+")";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(ox+ow,y0+26);ctx.lineTo(x0+w-10,y0+26);ctx.stroke();   // рельс
  ctx.beginPath();ctx.moveTo(lx,y0+26);ctx.lineTo(lx,y0+34);ctx.stroke();
  ctx.save();ctx.translate(lx,y0+36);ctx.rotate(pour?.55:0);
  bBox(-11,0,22,16,"rgba(40,34,30,.98)",lit,"rgba(160,120,80,.4)");
  ctx.fillStyle="rgba(255,180,90,"+(.7*hot).toFixed(2)+")";ctx.fillRect(-9,1,18,4);
  ctx.restore();
  if(pour){
    const sx=lx+8,sy0=y0+50,sy1=fy-14;
    const sg=ctx.createLinearGradient(0,sy0,0,sy1);
    sg.addColorStop(0,"rgba(255,240,190,.95)");sg.addColorStop(1,"rgba(255,140,40,.85)");
    ctx.strokeStyle=sg;ctx.lineWidth=3.4;
    ctx.beginPath();ctx.moveTo(sx,sy0);
    for(let t=0;t<=1;t+=.2)ctx.lineTo(sx+Math.sin(t*4+G.t*.3)*1.6,sy0+(sy1-sy0)*t);
    ctx.stroke();
    bGlow(sx,sy1,34,"255,170,70",.22);
    for(let i=0;i<8;i++){                                   // искры от струи
      const t=(G.t*.06+i*.37)%1;
      ctx.fillStyle="rgba(255,210,120,"+((1-t)*.8).toFixed(2)+")";
      ctx.beginPath();ctx.arc(sx+Math.cos(i*2.3)*t*18,sy1-t*14+t*t*20,1.2,0,TAU);ctx.fill();
    }
  }
  /* изложницы и остывающие слитки: свежий ещё красный, дальние уже серые */
  for(let i=0;i<3;i++){
    const gx=lx+2+i*20-2;
    bBox(gx-9,fy-10,18,10,"rgba(30,28,26,.98)",lit,"rgba(0,0,0,.5)");
    const cool=clamp(1-((cyc*3+i)%3)/2.2,0,1)*hot;
    ctx.fillStyle="rgb("+(70+cool*185|0)+","+(74+cool*110|0)+","+(82-cool*30|0)+")";
    ctx.fillRect(gx-7,fy-8,14,6);
    if(cool>.3)bGlow(gx,fy-6,16,"255,140,50",.14*cool);
  }
  /* правая половина цеха: стеллаж готовых слитков, бак шлака и плавильщик.
     Без них половина отсека стояла пустой, и печь висела в вакууме */
  const rx=x0+w-40;
  bBox(rx,fy-34,34,3,"rgba(44,54,66,.98)",lit,"rgba(0,0,0,.4)");
  bBox(rx,fy-16,34,3,"rgba(44,54,66,.98)",lit,"rgba(0,0,0,.4)");
  bBox(rx-2,fy-36,3,36,"rgba(40,50,62,.98)",lit,null);
  bBox(rx+33,fy-36,3,36,"rgba(40,50,62,.98)",lit,null);
  for(let t=0;t<2;t++)for(let i=0;i<3;i++){
    const iy=fy-34-4+t*18,ix=rx+3+i*10;
    ctx.fillStyle="rgba(126,134,146,"+(.35+lit*.35).toFixed(2)+")";
    ctx.fillRect(ix,iy,8,4);
    ctx.fillStyle="rgba(190,200,212,"+(.10+lit*.14).toFixed(2)+")";ctx.fillRect(ix,iy,8,1);
  }
  const sbx=rx-24;                                        // бак шлака: тёмная корка, снизу тлеет
  bBox(sbx,fy-14,20,14,"rgba(26,24,24,.98)",lit,"rgba(90,70,54,.4)");
  ctx.fillStyle="rgba(60,50,46,.95)";ctx.fillRect(sbx+2,fy-12,16,5);
  ctx.fillStyle="rgba(255,120,40,"+(.25*hot).toFixed(2)+")";ctx.fillRect(sbx+3,fy-7,14,2);
  bWorker(sbx-12,fy,lit,false,G.t*.04+seed,-1);
  /* марево над печью: дешёвая подделка, но без него горячий цех выглядит холодным */
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(let i=0;i<3;i++){
    const yy=fy-20-((G.t*.4+i*22)%46);
    ctx.fillStyle="rgba(255,150,70,"+(.05*hot).toFixed(3)+")";
    ctx.beginPath();ctx.ellipse(ox+ow/2+Math.sin(G.t*.02+i)*6,yy,18,7,0,0,TAU);ctx.fill();
  }
  ctx.restore();
  bGlow(ox+ow/2,fy-16,52,"255,150,60",.10+.16*fl);
},
/* ── ПЛОЩАДКА: подъёмник, захваты, створки в потолке, груз ── */
pad(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const cyc=(G.t*.004+seed)%1;
  const lift=cyc<.5?0:Math.sin((cyc-.5)*Math.PI*2)*18;     // платформа ходит вверх-вниз
  /* створки в потолке: раскрываются, когда платформа идёт наверх */
  const open=clamp((lift-2)/14,0,1)*26;
  ctx.fillStyle="rgba(10,14,20,.9)";ctx.fillRect(cx-30,y0,60,7);
  bBox(cx-30,y0,30-open/2,7,"rgba(40,50,62,.98)",lit,"rgba(0,0,0,.4)");
  bBox(cx+open/2,y0,30-open/2,7,"rgba(40,50,62,.98)",lit,"rgba(0,0,0,.4)");
  if(open>2){                                              // сквозь щель видно небо
    const sg=ctx.createLinearGradient(0,y0,0,y0+26);
    sg.addColorStop(0,"rgba(150,190,225,"+(.35*(open/26)).toFixed(2)+")");
    sg.addColorStop(1,"rgba(150,190,225,0)");
    ctx.fillStyle=sg;ctx.fillRect(cx-open/2,y0,open,26);
  }
  bHazard(cx-34,fy-4,68,4,.9);
  /* гидравлика: два цилиндра со штоками — по ним и видно, что платформа едет */
  for(let i=0;i<2;i++){
    const px=cx-20+i*40;
    bBox(px-4,fy-16,8,16,"rgba(36,45,56,.98)",lit,"rgba(0,0,0,.4)");
    ctx.fillStyle="rgba(170,186,200,"+(.25+lit*.3).toFixed(2)+")";
    ctx.fillRect(px-2,fy-16-lift,4,lift+2);
  }
  /* сама платформа с захватами по углам */
  const py=fy-18-lift;
  bBox(cx-32,py,64,6,"rgba(46,56,68,.98)",lit,"rgba(150,170,190,.3)");
  ctx.strokeStyle="rgba("+BM_WARM+","+(.3+lit*.35).toFixed(2)+")";ctx.lineWidth=2;
  for(let i=0;i<2;i++){
    const gx=cx-28+i*56;
    ctx.beginPath();ctx.moveTo(gx,py);ctx.lineTo(gx,py-7);ctx.lineTo(gx+(i?-5:5),py-10);ctx.stroke();
  }
  /* контейнер на платформе — площадка не пустая, она для переброски */
  bCrate(cx-16,py-22,32,22,"46,56,50",lit,true);
  ctx.fillStyle="rgba("+BM_COOL+","+(.25+lit*.35).toFixed(2)+")";ctx.fillRect(cx-12,py-19,8,3);
  /* бегущие огни разметки: последовательность читается как «идёт цикл» */
  for(let i=0;i<6;i++){
    const on=((G.t*.08|0)%6)===i;
    ctx.fillStyle="rgba("+BM_COOL+","+(on?.9:.20).toFixed(2)+")";
    ctx.beginPath();ctx.arc(x0+14+i*((w-28)/5),fy-7,2.2,0,TAU);ctx.fill();
    if(on)bGlow(x0+14+i*((w-28)/5),fy-7,14,BM_COOL,.20);
  }
  /* кран-балка под потолком: рельс, тележка ездит, крюк на тросе качается */
  bBox(x0+6,y0+10,w-12,4,"rgba(38,48,60,.97)",lit,"rgba(0,0,0,.4)");
  const trx=x0+20+((G.t*.15+seed*13)%(w-52));
  bBox(trx,y0+13,16,6,"rgba(52,62,76,.98)",lit,"rgba(150,170,190,.3)");
  const hl=16+Math.sin(G.t*.02+seed)*5;
  ctx.strokeStyle="rgba(160,178,196,"+(.25+lit*.25).toFixed(2)+")";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(trx+8,y0+19);ctx.lineTo(trx+8,y0+19+hl);ctx.stroke();
  ctx.lineWidth=1.8;ctx.beginPath();
  ctx.arc(trx+8,y0+21+hl,3,-.4,Math.PI+.4);ctx.stroke();
  /* груз в очереди у стены, пульт причала и приёмщик */
  bCrate(x0+8,fy-18,20,18,"52,46,40",lit,false);
  bCrate(x0+8,fy-32,16,14,"44,50,58",lit,true);
  const dx=x0+w-24;
  bBox(dx,fy-30,18,30,"rgba(30,38,48,.96)",lit,"rgba(140,160,180,.3)");
  bScreen(dx+3,fy-27,12,10,BM_COOL,lit,seed+9);
  ctx.fillStyle="rgba("+BM_WARM+","+(.3+lit*.3).toFixed(2)+")";     // кнопки пульта
  for(let i=0;i<3;i++)ctx.fillRect(dx+3+i*5,fy-13,3,3);
  bWorker(dx-11,fy,lit,false,G.t*.035+seed,1);
},
/* ── ЛАБОРАТОРИЯ: образцы, голограмма, центрифуга, находка на подставке ── */
lab(x0,y0,w,h,cx,fy,lit,seed,B,P){
  const on=P.eff>.15;
  /* верстак вдоль всей стены */
  bBox(x0+6,fy-20,w-12,4,"rgba(46,54,64,.98)",lit,"rgba(150,170,190,.28)");
  ctx.fillStyle="rgba(28,34,42,.9)";ctx.fillRect(x0+10,fy-16,4,16);ctx.fillRect(x0+w-16,fy-16,4,16);
  /* колбы с образцами: стекло, среда, пузырьки — каждая своего цвета */
  for(let i=0;i<3;i++){
    const gx=x0+18+i*22,gh=22;
    const col=[[120,220,180],[190,150,240],[240,190,120]][i];
    ctx.fillStyle="rgba(14,20,28,.9)";ctx.fillRect(gx-6,fy-20-gh,12,gh);
    ctx.fillStyle=rgba(col,(.18+lit*.30)*(on?1:.4));
    ctx.fillRect(gx-5,fy-20-gh*.7,10,gh*.7);
    if(on)for(let b=0;b<3;b++){
      const t=((G.t*.03+b*.33+i*.17)%1);
      ctx.fillStyle=rgba(col,(1-t)*.5);
      ctx.beginPath();ctx.arc(gx-3+((b*3+i)%5),fy-20-t*gh*.68,1.1,0,TAU);ctx.fill();
    }
    ctx.strokeStyle="rgba(190,210,225,"+(.16+lit*.16).toFixed(2)+")";ctx.lineWidth=1;
    ctx.strokeRect(gx-6.5,fy-20.5-gh,13,gh);
    ctx.fillStyle="rgba(210,225,238,"+(.10+lit*.12).toFixed(2)+")";ctx.fillRect(gx-5,fy-20-gh,3,gh);
    if(on)bGlow(gx,fy-30,20,col.join(","),.10);
  }
  /* центрифуга: барабан крутится, крышка со стеклом */
  const fxc=cx+8;
  bBox(fxc-13,fy-34,26,14,"rgba(36,45,56,.98)",lit,"rgba(140,160,180,.3)");
  ctx.strokeStyle="rgba("+BM_COOL+","+(.3+lit*.35).toFixed(2)+")";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(fxc,fy-27,7,0,TAU);ctx.stroke();
  const sp=on?G.t*.4:0;
  for(let i=0;i<3;i++){
    const a=sp+i*TAU/3;
    ctx.strokeStyle="rgba(200,220,235,"+(.2+lit*.3).toFixed(2)+")";
    ctx.beginPath();ctx.moveTo(fxc,fy-27);ctx.lineTo(fxc+Math.cos(a)*6,fy-27+Math.sin(a)*6);ctx.stroke();
  }
  /* голограмма над столом: проволочный образец медленно вращается */
  if(on){
    const hx=x0+w-38,hy=fy-40;
    ctx.save();ctx.globalCompositeOperation="lighter";
    const hg=ctx.createLinearGradient(0,hy+16,0,hy-16);
    hg.addColorStop(0,"rgba("+BM_COOL+",.16)");hg.addColorStop(1,"rgba("+BM_COOL+",0)");
    ctx.fillStyle=hg;ctx.beginPath();
    ctx.moveTo(hx-4,hy+18);ctx.lineTo(hx+4,hy+18);ctx.lineTo(hx+16,hy-14);ctx.lineTo(hx-16,hy-14);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgba("+BM_COOL+",.55)";ctx.lineWidth=1;
    const rot=G.t*.02;
    for(let i=0;i<3;i++){
      const rr=10-i*2.5,sq=Math.abs(Math.cos(rot+i));
      ctx.beginPath();ctx.ellipse(hx,hy-2-i*3,rr,rr*(.25+sq*.5),0,0,TAU);ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle="rgba("+BM_COOL+","+(.3+lit*.3).toFixed(2)+")";ctx.fillRect(hx-6,fy-22,12,2);
  }
  /* подставка с находкой: если в базе лежит артефакт, он здесь и стоит */
  const ax=x0+12;
  bBox(ax-7,fy-30,14,10,"rgba(30,38,48,.96)",lit,"rgba(0,0,0,.4)");
  const glow=.35+Math.sin(G.t*.03+seed)*.15;
  ctx.strokeStyle="rgba(200,170,255,"+((.35+lit*.4)*glow*2).toFixed(2)+")";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(ax,fy-42);ctx.lineTo(ax+5,fy-35);ctx.lineTo(ax,fy-30);ctx.lineTo(ax-5,fy-35);
  ctx.closePath();ctx.stroke();
  bGlow(ax,fy-36,22,"190,160,255",.12*glow*2);
  bWorker(cx-18,fy,lit,true,G.t*.04+seed);
  bLamp(cx,y0+4,40,fy,"200,232,255",.30+lit*.35);
}
};
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
