/* Хозяйство T2–T3 для пробы экономики (91zzzw4-ecosim, M912): цеха и база, на которых стоит
   оракул §4.1. Вынесено из пробы (Контроль 22.10: 61 КБ в одном наборе). Сюиты здесь нет — фабрика,
   которую проба зовёт один раз; X даёт ей замыкание пробы: note, idle, dockAt, sysOf, фазу
   (X.ph — чтение и запись), книгу (X.book) и темп (X.human) */
function ecoEstate(X){
  const {note,idle,dockAt,sysOf}=X;
  /* ── хозяйство T2–T3 (M912, Контроль 22.10): цеха и база, на которых стоит оракул §4.1 ──
     Цеха — постройки семей B–D (12ac) на своей станции и соседней, по три на станцию, без лестницы
     площадок (★11/15/20) и без цены: ярус ими уже владеет, как дронами. Кормятся сами — продажей
     сырья на этой станции (bldFeed в sellCargo); пай (промтовар) бот забирает на стыковке и сдаёт
     в цех, который его ест (bldSellInd), где бы такой ни нашёлся; рынок промтовар не берёт.
     База — foundBase на планете домашней системы и N модулей (8 у T2, 20 у T3); без людей на ней
     (руки яруса заняты рейсами). Руду с неё бот забирает на каждой домашней стыковке и продаёт —
     без отдельного рейса к базе (в темпе человека — полминуты). Содержания у цехов и базы в коде нет
     (§3.1: 12 кр/мин на цех и 1.4 кр/мин на человека не построены) — проба его и не пишет */
  const EST={on:false,shops:[],base:null,ind:{},indSold:0,indLeft:0,baseUnits:0,baseWorth:0,shopFed:{}};
  /* раскладка базы — как её строил бы игрок, который смотрит на выработку: сперва жилые под людей,
     дальше по клетке за ход то, что больше всего поднимает бур с учётом энергии и тепла
     (реактор +60, бур +30, радиатор −80; за ±10 бур встаёт — 21a1a); панели и радиаторы только
     в верхнем ряду (surfaceOnly). Ничего не поднимает — склад */
  const BASE_TRY=["drill","reactor","radiator","solar","refinery","storage"];
  function baseScore(B){const P=basePower(B),n=baseShift(clockNow());
    return (P.drillEff||0)*Math.min(1,P.eff||0)*baseHeatMul(B,n);}
  function baseLay(B,total,hab){
    let n=1;
    const free=()=>B.cells.map((c,i)=>c?-1:i).filter(i=>i>=0);
    const put=(i,k)=>{B.cells[i]={k,hp:1};n++;};
    for(let h=0;h<hab&&n<total;h++){const f=free().reverse()[0];if(f==null)break;put(f,"habitat");}
    while(n<total){
      let best=null,bs=baseScore(B);
      for(const i of free())for(const k of BASE_TRY){
        if(BUILD[k].surfaceOnly&&i>=BASE_COLS)continue;
        B.cells[i]={k,hp:1};const sc=baseScore(B);B.cells[i]=null;
        if(sc>bs+1e-9){bs=sc;best=[i,k];}
      }
      if(!best){const f=free()[0];if(f==null)break;put(f,"storage");continue;}
      put(best[0],best[1]);
    }
    /* донастройка: замены по одной клетке, пока бур растёт (жадный ход упирается в тепло) */
    for(let pass=0;pass<6;pass++){let imp=false,bs=baseScore(B);
      for(let i=0;i<B.cells.length;i++){const old=B.cells[i];if(!old||old.k==="habitat"||i===Math.floor(BASE_COLS/2))continue;
        for(const k of BASE_TRY){if(k===old.k||(BUILD[k].surfaceOnly&&i>=BASE_COLS))continue;
          B.cells[i]={k,hp:1};const sc=baseScore(B);
          if(sc>bs+1e-9){bs=sc;imp=true;}else B.cells[i]=old;
          if(B.cells[i]!==old)break;}}
      if(!imp)break;}
    return n;
  }
  function estSetup(E){
    Object.assign(EST,{on:true,baseTrips:0,hauls:0,fed:0,dead:{},shops:[],base:null,ind:{},indSold:0,indLeft:0,baseUnits:0,baseWorth:0,shopFed:{}});
    const home=G.sys,near=[home];
    for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){if(!dx&&!dy)continue;
      const s=getSystem(home.sx+dx,home.sy+dy);if(s&&s.station)near.push(s);}
    near.sort((a,b)=>Math.hypot(a.sx-home.sx,a.sy-home.sy)-Math.hypot(b.sx-home.sx,b.sy-home.sy));
    /* игрок ставит цех на то, что сам возит: руды планет своей системы; лучше — цех, всё сырьё которого есть */
    const ORE={};for(const q of (home.planets||[]))for(const k of (q.res||[]))ORE[k]=1;
    const fit=id=>{const e=Object.keys(BLD[id].eats);return e.filter(k=>ORE[k]).length/e.length;};
    const ids=Object.keys(BLD).filter(id=>bldIsShop(BLD[id])&&fit(id)>0).sort((a,b)=>fit(b)-fit(a)||(BLD[a].fam<BLD[b].fam?-1:BLD[a].fam>BLD[b].fam?1:0));
    for(const S of near){
      if(EST.shops.length>=E.shops)break;
      let here=0;
      for(const id of ids){
        if(EST.shops.length>=E.shops||here>=3)break;
        const def=BLD[id];
        if(bldRuleWhy(S,def))continue;
        if(EST.shops.some(x=>x.id===id))continue;
        const H=holdOf(S.key);H.bld=H.bld||{};
        H.bld[id]={lvl:1,t0:clockNow(),ready:clockNow(),my:{},got:{}};
        EST.shops.push({key:S.key,id,eats:Object.keys(def.eats).join("+"),makes:Object.keys(def.makes).join("+")});here++;
      }
    }
    if(E.base>0){
      const p=(home.planets||[]).find(q=>q.parentIdx==null&&q.type!=="gas"&&q.res&&q.res.length);
      if(p){
        const c0=G.credits,a0=G.cargo.alloy|0;G.credits+=2500;G.cargo.alloy=a0+10;
        try{foundBase(p);}catch(e){note("база: "+(e&&e.message));}
        G.credits=c0;G.cargo.alloy=a0;
        const B=baseAt(home.sx,home.sy,p.idx);
        if(B){const n=baseLay(B,E.base,Math.ceil((E.crew|0)/2));
          /* люди на базе: без них и без запаса воздуха база за сутки — развалина (21b0, RUIN_AFTER) */
          /* мест в экипаже не хватит на рейсы и базу: игрок третьего яруса купил лицензию на флот (+3) */
          G.tech.add("license");G.techLvl.license=2;
          let hired=0;
          for(const c of stationMercs(G.sys)){if(hired>=(E.crew|0))break;
            const c0=G.credits;G.credits+=1e6;let ok=false;
            try{ok=hireMerc(c);}finally{G.credits=c0;}
            if(!ok)break;
            if(assignToBase(G.crew[G.crew.length-1],B,hired%2?"engineer":"driller"))hired++;}
          const P=basePower(B);
          EST.base={B,sys:home.key,name:p.name,mods:n,crew:hired,lay:B.cells.map(c=>c?c.k.slice(0,3):"·").join(" "),heat:baseHeat(B,baseShift(clockNow())),pw:Math.round(P.prod||0)+"/"+Math.round(P.cons||P.load||0),drills:P.drills};}
      }
    }
  }
  function estDock(){
    if(G.mode!=="dock"||!G.sys||!G.sys.station)return;
    const PH=X.ph;
    try{
      /* база: доразрешить смены и забрать руду, если стоим в её системе */
      if(EST.base&&G.sys.key===EST.base.sys){
        try{baseResolveAll();}catch(e){note("база: "+(e&&e.message));}
        const B=EST.base.B,before={};for(const k in G.cargo)before[k]=G.cargo[k]|0;
        X.ph="база";
        try{baseCollect(B);}catch(e){}
        for(const k in G.cargo){const got=(G.cargo[k]|0)-(before[k]|0);if(got<=0)continue;EST.baseUnits+=got;
          if(TRADE_KEYS.concat(FAR_KEYS).indexOf(k)>=0&&G.sys.station.prices[k]){EST.baseWorth+=sellCargo(G.sys,k,got)||0;}}
        if(X.human)idle(30,"паузы");
      }
      /* цеха этой станции: забрать пай */
      X.ph="цеха";
      for(const s of EST.shops)if(s.key===G.sys.key){try{bldCollect(G.sys,s.id);}catch(e){note("цех: "+(e&&e.message));}}
      /* промтовар — в цех, который его ест; не взяли — на склад (не трюм: бот возит руду) */
      for(const k in G.cargo){const q=G.cargo[k]|0;if(q<=0||!RES[k]||!RES[k].ind)continue;
        const v=bldSellInd(G.sys,k,q);EST.indSold+=v||0;
        const left=G.cargo[k]|0;if(left>0){EST.ind[k]=(EST.ind[k]|0)+left;G.cargo[k]=0;}}
      /* со склада — тоже в цех, когда стоим там, где его едят */
      for(const k in EST.ind){const q=EST.ind[k]|0;if(q<=0)continue;
        G.cargo[k]=(G.cargo[k]|0)+q;EST.ind[k]=0;const v=bldSellInd(G.sys,k,q);EST.indSold+=v||0;
        const left=G.cargo[k]|0;G.cargo[k]=0;EST.ind[k]=left;}
    }finally{X.ph=PH;}
  }
  /* рейс в цех: свои руды цехи на соседней станции едят только оттуда (дома их «и так делают»,
     bldRuleWhy). Игрок возит, когда бункеру есть что взять — не меньше 15 ед; сдаёт там по цене рынка
     (бункер берёт по обычной, с паем), забирает пай и возвращается. Бак и минуты — фазой «цеха» */
  const HAUL_MIN=15;
  function estHaul(){
    const home=G.sys.key,PH=X.ph;
    try{
      /* база в другой системе (бот ушёл с выработанных планет): забрать руду, когда склад наполовину полон */
      if(EST.base&&EST.base.sys!==home){const B=EST.base.B;
        try{baseResolveAll();}catch(e){}
        if(basePoolHeld(B)>=basePower(B).store*.5){X.ph="база";EST.baseTrips++;
          if(!dockAt(EST.base.sys))note("база: рейс не вышел");
          if(!dockAt(home)){note("база: домой не вернулся");return;}}}
      for(const key of [...new Set(EST.shops.map(s=>s.key))]){
        if(key===home)continue;
        const S=sysOf(key);let n=0;const take={};
        for(const s of EST.shops)if(s.key===key)for(const k in BLD[s.id].eats){
          const q=Math.min(bldWant(S,k)-(take[k]|0),G.cargo[k]|0);if(q>0){take[k]=(take[k]|0)+q;n+=q;}}
        if(n<HAUL_MIN)continue;
        X.ph="цеха";
        if(EST.dead[key]>=2)continue;
        if(!dockAt(key)){note("цех: рейс до "+key+" не вышел");EST.dead[key]=(EST.dead[key]|0)+1;
          if(!dockAt(home))note("цех: домой не вернулся");break;}
        EST.hauls++;
        for(const k in take){const q=Math.min(take[k],G.cargo[k]|0);if(q<=0)continue;
          const v=sellCargo(G.sys,k,q),f=(sellCargo.last&&sellCargo.last.nB)|0;EST.fed+=f;
          const b=X.book.sold[k]||(X.book.sold[k]=[0,0,{},0]);b[0]+=q;b[1]+=v||0;b[2][G.sys.key]=1;b[3]+=q*(G.sys.station.prices[k]||0);}
        if(!dockAt(home)){note("цех: домой не вернулся");break;}
      }
    }finally{X.ph=PH;}
  }
  function estReport(){
    if(!EST.on)return null;
    let left=0;for(const k in EST.ind)left+=(EST.ind[k]|0)*indPrice(k);
    const fed={};for(const s of EST.shops){const B=bldEntry(s.key,s.id);if(B)fed[s.id]=Math.round(Object.values(B.got||{}).reduce((a,b)=>a+b,0));}
    return {shops:EST.shops.map(s=>s.id+"@"+s.key+" ("+s.eats+"→"+s.makes+")").join(", "),indSold:Math.round(EST.indSold),
      indLeft:Math.round(left),indLeftQ:JSON.stringify(EST.ind),base:EST.base?EST.base.name+" · модулей "+EST.base.mods+" · буров "+EST.base.drills+" · энергия "+EST.base.pw+" · людей "+EST.base.crew+" · тепло "+EST.base.heat+" · ["+EST.base.lay+"]"+(EST.base.B.ruin?" · РАЗВАЛИНА":""):"—",
      baseUnits:EST.baseUnits,baseWorth:Math.round(EST.baseWorth),hauls:EST.hauls,fed:EST.fed,baseTrips:EST.baseTrips,
      dbg:EST.base?(()=>{const B=EST.base.B,P=basePower(B);return "t0 "+B.t0+" смена "+baseShift(clockNow())+" parked "+baseParked(B)+" wake "+B.wake+" eff "+P.eff+" drillEff "+P.drillEff+" store "+P.store+" лог "+JSON.stringify((B.log||[]).slice(-4));})()+" пул "+JSON.stringify(EST.base.B.pool)+" · людей сейчас "+baseStaff(EST.base.B).length+" · жизнь "+JSON.stringify(EST.base.B.life||{}):"",
      hop:EST.shops.map(s=>{const B=bldEntry(s.key,s.id);return s.id+" бункер "+JSON.stringify(B&&B.my)+" пай "+JSON.stringify(B&&B.got);}).join("; ")};
  }
  return {EST,estSetup,estDock,estHaul,estReport};
}
