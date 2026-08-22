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
  /* батарея (M111): строится, а не покупается, и стоит в общем балансе мощности —
     оборона конкурирует с добычей, и это настоящее решение. Только наверху:
     она бьёт с грунта, и с орбиты видно её линию. */
  battery:{ru:"Батарея",    cost:{credits:2400,alloy:9},  power:-12,surfaceOnly:true,
           note:"бьёт по мелочи в своей системе; барона и охотника ей не взять"},
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
  let prod=0,cons=0,core=0,drills=0,drillEff=0,hab=0,habPenalty=0,store=0,ref=0,pads=0,guns=0;
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
    if(cell.k==="battery")guns++;
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
    drills,drillEff,hab,habPenalty,store:180+store,ref,pads,guns};
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
        earn(cr,"base");
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
  /* Четверть кадра занимала ровная заливка — небо было пустым полем краски.
     Ставим два плана дальнего рельефа (дальний светлее и выше по горизонту),
     пыль у самой земли и то, что база построила на поверхности. */
  if(gy>0){
    for(let pl2=0;pl2<2;pl2++){
      const far=pl2===0;
      /* дальняя гряда выше и бледнее (её съедает воздух), ближняя ниже и темнее.
         Частота у обеих заметная: на низкой шум давал почти прямую линию, и
         «рельеф» читался просто второй полосой краски */
      const amp=far?24:30, base0=gy-(far?34:6), par=far?.3:.6;
      ctx.fillStyle=rgba(mixc(sky[0],[12,14,20],far?.45:.78),far?.75:.95);
      ctx.beginPath();ctx.moveTo(0,gy+2);
      for(let sx2=0;sx2<=W;sx2+=6){
        const wx=(sx2+camx*par)*.005;
        ctx.lineTo(sx2,base0-fbm2(wx,pl2*4.7+B.idx,B.idx*53+9,4)*amp
                        -Math.sin(wx*3.1+pl2)*amp*.25);
      }
      ctx.lineTo(W,gy+2);ctx.closePath();ctx.fill();
    }
    /* пыль у горизонта: воздух между базой и грядой */
    const dg=ctx.createLinearGradient(0,gy-54,0,gy);
    dg.addColorStop(0,"rgba("+sky[0].join(",")+",0)");
    dg.addColorStop(1,"rgba("+sky[0].join(",")+",.35)");
    ctx.fillStyle=dg;ctx.fillRect(0,Math.max(0,gy-54),W,Math.min(54,gy));
    /* мачта связи и — если площадка построена — её огни над грунтом:
       база должна быть видна снаружи, а не только в разрезе */
    const mx2=X(cellX(1))+10;
    ctx.strokeStyle="rgba(30,36,44,.85)";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(mx2,gy);ctx.lineTo(mx2,gy-44);ctx.stroke();
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(mx2-7,gy-4);ctx.lineTo(mx2,gy-18);ctx.lineTo(mx2+7,gy-4);ctx.stroke();
    const bl=Math.sin(G.t*.06)>0;
    ctx.fillStyle=bl?"rgba(255,110,90,.9)":"rgba(255,110,90,.25)";
    ctx.beginPath();ctx.arc(mx2,gy-46,2.2,0,TAU);ctx.fill();
    let hasPad=false;
    for(let c2=0;c2<BASE_COLS;c2++){const cc=baseCell(B,c2,0);if(cc&&cc.k==="pad"&&cc.hp>0)hasPad=true;}
    if(hasPad){
      const pxs=X(cellX(Math.min(BASE_COLS-1,3)));
      ctx.fillStyle="rgba(28,34,42,.9)";
      ctx.beginPath();ctx.moveTo(pxs-40,gy);ctx.lineTo(pxs-30,gy-10);
      ctx.lineTo(pxs+30,gy-10);ctx.lineTo(pxs+40,gy);ctx.closePath();ctx.fill();
      for(let i=0;i<5;i++){
        const on=((G.t*.08|0)%5)===i;
        ctx.fillStyle=on?"rgba(127,230,216,.95)":"rgba(127,230,216,.25)";
        ctx.beginPath();ctx.arc(pxs-24+i*12,gy-12,2,0,TAU);ctx.fill();
      }
    }
  }
  /* кромка грунта не линейка: мелкий рельеф из того же шума, что и планета.
     Путь держим объектом: fillMaterial клипует по ПЕРЕДАННОМУ пути, а не по
     текущему — иначе материал ляжет в последний нарисованный пласт (так и было) */
  /* ── база сидит в ГОРЕ, а не под степью ──
     Кромка была почти прямой линией с мелкой рябью: база лежала под ровным
     полем, и верхний ряд отсеков упирался в небо. На образце, по которому это
     переделывается, убежище врезано в толщу холма — над верхним ярусом висит
     масса породы, и именно она объясняет, почему вход один, а всё остальное
     внизу. Гора строится тем же шумом, но с большой амплитудой и горбом ровно
     над базой: середина сооружения — вершина, к краям склон уходит вниз.
     Мелкая рябь остаётся сверху: гора не должна быть гладким куполом. */
  const bMidX=X(90+BASE_COLS*BCELL_W*.5);          // середина базы на экране
  const bHalf=BCELL_W*BASE_COLS*.62;
  const GP=new Path2D();
  GP.moveTo(0,H);GP.lineTo(0,gy);
  for(let x=0;x<=W;x+=6){
    const u=clamp((x-bMidX)/bHalf,-1.6,1.6);
    /* два горба со сдвигом: одиночная гауссиана даёт правильный купол, а гора
       — вещь кривая, у неё есть плечо и вершина не по центру */
    const hump=Math.exp(-u*u*1.25)*BCELL_H*1.55+
               Math.exp(-Math.pow(u+.72,2)*4.2)*BCELL_H*.55;
    const wob=(fbm2((x+camx)*.008,3.3,B.idx*77+13,3)-.5)*16;
    const fine=(fbm2((x+camx)*.032,7.1,B.idx*77+31,3)-.5)*9*(hump>4?1:.4);
    GP.lineTo(x,gy+wob+fine-hump);
  }
  GP.lineTo(W,H);GP.closePath();
  /* Порода — это НЕ палитра поверхности: пески и зелень с картинки планеты под
     землёй читаются как трава и небо (так и вышло с первого раза). Берём тот же
     цвет, но уведённый в тёмное и обесцвеченный — узнаваемо и при этом подземно */
  const rc=i=>mixc(pal[Math.min(i,pal.length-1)],[26,19,14],.66);
  const rock=ctx.createLinearGradient(0,gy-BCELL_H*2.1,0,Y(150+baseRows(B)*BCELL_H+120));
  /* холм начинается выше грунта и освещён небом: одной тёмной заливкой он
     читался дырой в небе, а не горой (G9) */
  rock.addColorStop(0,rgba(mixc(rc(0),sky[0],.35),1));
  rock.addColorStop(.3,rgba(rc(1),1));
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
  if(mat)fillMaterial(mat,camx,camy,.34,.26,GP,{x:0,y:0,w:W,h:H});   // и холму тоже — раньше материал шёл только от грунта вниз (G9)
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
  /* кромка холма ловит небо: полоса света внутрь от силуэта и волосок по краю */
  ctx.save();ctx.clip(GP);
  ctx.strokeStyle=rgba(sky[0],.16);ctx.lineWidth=14;ctx.stroke(GP);
  ctx.strokeStyle=rgba(mixc(sky[0],[255,255,255],.3),.30);ctx.lineWidth=2.4;ctx.stroke(GP);
  ctx.restore();
  /* ── зерно породы ──
     Пласты у базы были, а зерна не было, и разрез читался полосатым матрасом:
     шахта (`23-mode-dig`) прошла ровно через эту ошибку и лечится тем же —
     камень узнают не по слоям, а по СОРУ в них. Мелкие чёрточки вдоль пласта
     (порода слоиста, и зерно ложится по слою, а не как попало), редкие светлые
     крупинки и совсем редкие тёмные конкреции. Всё держится на seed базы,
     поэтому картинка у каждой базы своя и не дрожит между кадрами. */
  ctx.save();ctx.clip(GP);
  /* зерно идёт и по ГОРЕ, а не только ниже прежней линии земли: склон был
     единственным местом кадра без фактуры и читался чёрной вырезкой из
     бумаги. Клип по GP всё равно не пустит его в небо */
  const gy0=Math.max(0,gy-BCELL_H*1.9), gh=H-gy0;
  if(gh>0){
    const GR=rng(hashi(B.idx||1,0xB0CE,7));
    /* число зёрен считается от ПЛОЩАДИ, а не берётся числом: с фиксированной
       полутысячей на широком экране порода снова становилась гладкой */
    const gn=Math.min(4200,Math.round(W*gh/380));
    for(let i=0;i<gn;i++){
      const px=GR()*W, py=gy0+GR()*gh;
      const t=GR();
      if(t<.72){                                  // сор вдоль слоя
        ctx.fillStyle="rgba(0,0,0,"+(.22+GR()*.22).toFixed(3)+")";
        ctx.fillRect(px,py,1+GR()*2.4,.8);
      }else if(t<.94){                            // крупинка, поймавшая свет
        ctx.fillStyle="rgba(226,206,176,"+(.12+GR()*.13).toFixed(3)+")";
        ctx.fillRect(px,py,.9,.9);
      }else{                                      // конкреция покрупнее
        ctx.fillStyle="rgba(0,0,0,.18)";
        ctx.beginPath();ctx.ellipse(px,py,1.6+GR()*2.2,1+GR()*1.2,GR(),0,TAU);ctx.fill();
        ctx.fillStyle="rgba(226,206,176,.06)";
        ctx.fillRect(px-1,py-1.2,1.6,.7);
      }
    }
    /* ── валуны и прожилки ──
       Порода вокруг убежища оставалась ровным полем зерна: масштаба в ней не
       было, и склон читался фоном, а не камнем, в котором прорубились. На
       образце в толще лежат крупные глыбы и жилы — по ним и понятно, сколько
       тут метров. Глыба — тёмное тело со светлой верхней гранью (свет один и
       тот же на весь кадр, сверху), жила — тонкая наклонная нить. */
    const BR=rng(hashi(B.idx||1,0x9B0D,3));
    for(let i=0;i<26;i++){
      const px=BR()*W, py=gy0+BR()*gh;
      const rr=4+BR()*BR()*22;
      ctx.fillStyle="rgba(0,0,0,.30)";
      ctx.beginPath();ctx.ellipse(px,py,rr,rr*.72,BR()*.6-.3,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(228,212,186,.055)";
      ctx.beginPath();ctx.ellipse(px-rr*.16,py-rr*.26,rr*.72,rr*.30,BR()*.5-.25,0,TAU);ctx.fill();
    }
    ctx.lineWidth=.8;
    for(let i=0;i<14;i++){
      const px=BR()*W, py=gy0+BR()*gh, ln=16+BR()*46, an=BR()*.8-.4;
      ctx.strokeStyle=(i&3)?"rgba(214,196,164,.07)":"rgba(196,146,88,.10)";
      ctx.beginPath();ctx.moveTo(px,py);
      ctx.lineTo(px+Math.cos(an)*ln,py+Math.sin(an)*ln);ctx.stroke();
    }
  }
  ctx.restore();
  /* ── наземное ставится ПОСЛЕ породы ──
     Гора рисуется поверх всего, что стояло на поверхности, и мачта с
     воротами уходили под склон: их не было видно вовсе. Наземное теперь
     идёт после грунта и садится на ВЫСОТУ СКЛОНА в своей точке, а не на
     старую плоскую линию земли. */
  {
    const _u=clamp((X(cellX(Math.floor(BASE_COLS/2)))-bMidX)/bHalf,-1.6,1.6);
    const _hump=Math.exp(-_u*_u*1.25)*BCELL_H*1.55+Math.exp(-Math.pow(_u+.72,2)*4.2)*BCELL_H*.55;
    /* вход у ПОДОШВЫ склона, а не на вершине: ворота — это врез в гору на
       уровне земли, к ним подъезжают, а не забираются */
    const gy=Y(150)+6;
    /* ── ворота в склоне ──
       Убежище было врезано в гору, но входа в него снаружи не существовало:
       на поверхности стояла одна мачта, и как люди попадают внутрь, кадр не
       объяснял. Ворота ставятся над стволом лифта, у подошвы горы: бетонный
       портал, откатная плита с рёбрами и тёплая щель по краю — свет изнутри.
       Это же и оправдывает колонну: лифт начинается ровно за ними. */
    {
      const gx=X(cellX(Math.floor(BASE_COLS/2))), gwd=52, ghh=30;
      const gyy=gy-2;
      ctx.fillStyle="rgba(24,27,33,.98)";
      ctx.beginPath();
      ctx.moveTo(gx-gwd/2-7,gyy);ctx.lineTo(gx-gwd/2-3,gyy-ghh-8);
      ctx.lineTo(gx+gwd/2+3,gyy-ghh-8);ctx.lineTo(gx+gwd/2+7,gyy);
      ctx.closePath();ctx.fill();                       // портал
      ctx.fillStyle="rgba(46,52,62,.98)";
      ctx.fillRect(gx-gwd/2,gyy-ghh,gwd,ghh);           // плита
      ctx.fillStyle="rgba(18,21,26,.9)";
      for(let i=0;i<4;i++)ctx.fillRect(gx-gwd/2+4+i*(gwd-8)/4,gyy-ghh+3,3,ghh-6);
      /* свет считается от энергобаланса напрямую: `lit` объявляется ниже по
         функции, и обращение к нему отсюда роняло весь кадр */
      ctx.fillStyle="rgba(255,206,140,"+(.30+basePower(B).eff*.4).toFixed(2)+")";
      ctx.fillRect(gx-gwd/2,gyy-2.4,gwd,2.4);           // свет из-под плиты
      ctx.fillStyle="rgba(150,164,180,.35)";
      ctx.fillRect(gx-gwd/2-3,gyy-ghh-8,gwd+6,2);       // притолока
    }
  }
  /* свет с глубиной сходит на нет */
  const dk=clamp((camy+H*.5)/2000,0,.42);
  /* порода уводится в почти чёрное: на светлые отсеки она обязана работать
     фоном, а не спорить с ними за внимание. Раньше грунт был светлее
     помещений, и база выглядела дырками в земле */
  ctx.fillStyle="rgba(2,4,9,"+(.34+dk).toFixed(3)+")";ctx.fillRect(0,Math.max(0,gy),W,H);
  ctx.restore();
  /* ── помещения: один путь на всё сооружение ── */
  /* нижний порог света поднят: даже на голодном пайке в отсеке горит лампа,
     иначе половина базы читается нежилой. Разница между сытой и голодной
     базой остаётся, но теперь это «ярко или тускло», а не «видно или нет» */
  const lit=.55+P.eff*.45;
  const RP=baseRoomPath(B,X,Y,6);
  ctx.save();
  /* ── порода примыкает ──
     Отсеки лежали на грунте наклейкой: у выработки была своя рамка, но не было
     СЛЕДА в породе вокруг. Настоящая выработка портит камень: у стенки он темнее
     (свет туда не доходит и порода в трещинах от проходки), и чем дальше, тем
     слабее. Широкая мягкая тень наружу от контура и есть весь приём — она же
     сажает сооружение в грунт, отчего ряды перестают висеть в пустоте. */
  for(const [lw,al] of [[26,.30],[16,.26],[9,.30]]){
    ctx.strokeStyle="rgba(0,0,0,"+al+")";ctx.lineWidth=lw;ctx.stroke(RP);
  }
  /* грань выработки: свет сверху, тень снизу — та же фаска, что у проёма кабины */
  ctx.strokeStyle="rgba(0,0,0,.55)";ctx.lineWidth=9;ctx.stroke(RP);
  /* ── свет внутри, темнота снаружи ──
     Отсеки были темнее породы, и база читалась дырками в земле. У образца,
     на который равняемся, ровно наоборот: жилые коробки СВЕТЯТСЯ на фоне
     почти чёрного грунта, и весь экран держится на этом контрасте — глаз
     сразу видит, где живут, а где просто камень. Заливка выработки теперь не
     чернее ночи, а тёплый полумрак, поверх которого лягут лампы отсеков;
     сама порода вокруг притемнена отдельно. */
  const bgi=ctx.createLinearGradient(0,Y(140),0,Y(150+baseRows(B)*BCELL_H));
  bgi.addColorStop(0,"rgb("+[26,30,38].join(",")+")");
  bgi.addColorStop(1,"rgb("+[14,17,23].join(",")+")");
  ctx.fillStyle=bgi;ctx.fill(RP);
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
    gg.addColorStop(0,"rgba("+warm.join(",")+","+(.20*lit).toFixed(3)+")");
    gg.addColorStop(1,"rgba("+warm.join(",")+",0)");
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(cx,cy,BCELL_W*.95,0,TAU);ctx.fill();
  }
  ctx.restore();
  /* ── ствол лифта ──
     Ярусы связывала пара бледных ниток в .3 — сооружение рассыпалось на
     отдельные полки. На образце шахта это ОСВЕЩЁННАЯ КОЛОННА во всю высоту:
     она и держит композицию, и сразу говорит, что уровни — одно здание.
     Внутри тёплый свет и площадка на каждом ярусе, снаружи — тёмные щёки
     обделки, чтобы колонна не сливалась с отсеками. */
  /* глубина считается здесь же: ствол рисуется раньше стяжки, а глубину знали
     только там — при переносе колонна осталась бы без длины */
  let deepest=0;
  for(let rr=0;rr<baseRows(B);rr++)for(let cc=0;cc<BASE_COLS;cc++)
    if(baseCell(B,cc,rr))deepest=Math.max(deepest,rr+1);
  const lx=X(cellX(Math.floor(BASE_COLS/2)));
  const shaftB=Y(150+Math.max(1,deepest)*BCELL_H), shaftT=Y(150);
  const LW=13;
  const sg=ctx.createLinearGradient(lx-LW,0,lx+LW,0);
  sg.addColorStop(0,"rgba(30,26,20,.95)");
  sg.addColorStop(.5,"rgba(168,116,52,"+(.42+lit*.42).toFixed(2)+")");
  sg.addColorStop(1,"rgba(30,26,20,.95)");
  ctx.fillStyle=sg;ctx.fillRect(lx-LW,shaftT,LW*2,shaftB-shaftT);
  ctx.fillStyle="rgba(255,196,110,"+(.10+lit*.16).toFixed(2)+")";
  ctx.fillRect(lx-LW*.45,shaftT,LW*.9,shaftB-shaftT);      // светлая сердцевина
  ctx.strokeStyle="rgba(8,10,14,.95)";ctx.lineWidth=2.4;
  ctx.beginPath();ctx.moveTo(lx-LW,shaftT);ctx.lineTo(lx-LW,shaftB);
  ctx.moveTo(lx+LW,shaftT);ctx.lineTo(lx+LW,shaftB);ctx.stroke();
  /* площадка на каждом ярусе: по ним видно, что колонна — не труба */
  for(let r=0;r<=Math.max(1,deepest);r++){
    const y=Y(150+r*BCELL_H);
    ctx.fillStyle="rgba(20,18,14,.9)";ctx.fillRect(lx-LW,y-3,LW*2,4);
    ctx.fillStyle="rgba(255,206,140,"+(.16+lit*.24).toFixed(2)+")";
    ctx.fillRect(lx-LW,y-3,LW*2,1.2);
  }

  /* ── плита перекрытия ──
     Ряды разной длины читались набором полок, потому что между ними была
     только порода: у образца этажи держит толстая плита, и даже короткий ряд
     на ней выглядит этажом, а не отдельной коробкой. Плита идёт по всей
     ширине ЗАСТРОЙКИ (от левого занятого столбца до правого во всём
     сооружении), а не по каждому ряду: перекрытие — вещь общая, его льют
     сразу на всё здание. Тёмное тело, светлая верхняя грань, тень снизу. */
  {
    let gc0=BASE_COLS,gc1=-1;
    for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++)
      if(baseCell(B,c,r)){gc0=Math.min(gc0,c);gc1=Math.max(gc1,c);}
    if(gc1>=0){
      const x0=X(90+gc0*BCELL_W)-6, x1=X(90+(gc1+1)*BCELL_W)+6;
      for(let r=1;r<=Math.max(1,deepest);r++){
        const y=Y(150+r*BCELL_H);
        ctx.fillStyle="rgba(10,12,16,.92)";ctx.fillRect(x0,y-7,x1-x0,9);
        ctx.fillStyle="rgba(150,164,180,"+(.10+lit*.14).toFixed(2)+")";
        ctx.fillRect(x0,y-7,x1-x0,1.4);
        ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x0,y+1.4,x1-x0,2);
      }
    }
  }
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
  /* ── переборки ──
     Отсеки одного яруса стояли встык и сливались в ленту: где кончается склад
     и начинается жильё, было видно только по мебели. На образце каждая
     комната отбита толстой стеной, и ряд читается ЧЕРЕДОЙ ПОМЕЩЕНИЙ, а не
     одним длинным залом. Стена ставится на границе двух занятых клеток и по
     краям застройки — там, где помещение упирается в породу. */
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<=BASE_COLS;c++){
    const a=c>0?baseCell(B,c-1,r):null, b=c<BASE_COLS?baseCell(B,c,r):null;
    if(!a&&!b)continue;
    const x=X(90+c*BCELL_W), y0=Y(150+r*BCELL_H), y1=Y(150+(r+1)*BCELL_H);
    if(x<-20||x>W+20)continue;
    const wdt=(a&&b)?5:7;                       // внешняя стена толще внутренней
    ctx.fillStyle="rgba(9,11,15,.95)";
    ctx.fillRect(x-wdt/2,y0,wdt,y1-y0);
    ctx.fillStyle="rgba(150,164,180,"+(.08+lit*.12).toFixed(2)+")";
    ctx.fillRect(x-wdt/2,y0,1,y1-y0);           // блик по кромке, обращённой к свету
    /* ── дверь ──
     Проём был жёлтой полоской в толще стены и читался подсветкой, а не
     дверью. Дверь узнают по трём вещам: тёмный зев, светлый косяк вокруг
     него и порог понизу. Ставится от пола вверх на рост человека — по ней
     же становится видно, какого размера отсек. */
    if(a&&b){
      const dh=BCELL_H*.34, dy=y1-BCELL_H*.12-dh;
      ctx.fillStyle="rgba(6,8,12,.98)";
      ctx.fillRect(x-wdt/2-1,dy,wdt+2,dh);
      ctx.fillStyle="rgba(170,186,204,"+(.12+lit*.18).toFixed(2)+")";
      ctx.fillRect(x-wdt/2-1.6,dy-1.4,wdt+3.2,1.4);      // косяк сверху
      ctx.fillRect(x-wdt/2-1.6,dy,1.2,dh);
      ctx.fillRect(x+wdt/2+.4,dy,1.2,dh);
      ctx.fillStyle="rgba(255,206,140,"+(.20+lit*.26).toFixed(2)+")";
      ctx.fillRect(x-wdt/2-1,dy+dh-1.6,wdt+2,1.6);       // свет из-под двери
    }
  }
  /* коридор-стяжка вдоль пола и ствол лифта */
  /* Стяжка идёт по полу только там, где есть отсеки: раньше она чертилась во всю
     ширину базы на каждом ярусе, включая нетронутые, и оранжевые линии висели
     прямо в породе */
  ctx.strokeStyle="rgba(242,178,92,"+(.16+lit*.26).toFixed(2)+")";ctx.lineWidth=2;
  /* deepest уже посчитан выше, у ствола */
  for(let r=0;r<baseRows(B);r++){
    let c0=-1,c1=-1;
    for(let c=0;c<BASE_COLS;c++)if(baseCell(B,c,r)){if(c0<0)c0=c;c1=c;}
    if(c0<0)continue;
    deepest=r+1;
    const y=Y(150+r*BCELL_H+BCELL_H*.78);
    ctx.beginPath();
    ctx.moveTo(X(96+c0*BCELL_W),y);ctx.lineTo(X(90+(c1+1)*BCELL_W-6),y);ctx.stroke();
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
