/* ══════════════ look() — прибор кадра ══════════════
   `prof()` отвечает, во что обходится кадр. `look()` отвечает, ЧТО в нём.

   Автор сказал про графику «что-то не нравится всё», и разбор глазами дал
   список из одиннадцати придирок — то есть ничего, что можно проверить. Тогда
   кадры померили: во всех сценах, кроме двух, тепло либо 0–3%, либо 88–99%
   (то есть картинка одноцветная), пусто 55–91%, контраст 0.07–0.27, а живых
   тонов 2–6 из 36. После этого «не нравится» перестало быть вкусом и стало
   четырьмя числами, у которых есть мишень.

   Прибор меряет ТО, ЧТО НАРИСОВАНО, а не то, что задумано: читает канву.
   Поэтому он одинаково честен к любому режиму и к любой правке. */
/* ── мишени ──
   «Тепло 25–75%» оказалось неверной мишенью: ледяной мир обязан быть холодным,
   и требовать от него половины тепла — значит красить все планеты одинаково.
   Меряем не долю тепла, а ПАРУ: доля меньшего из двух температур. Она отвечает
   на настоящий вопрос — есть ли в кадре второй источник, — и работает на любой
   палитре (закон 7: холодный ключ + тёплый АКЦЕНТ; акцент по определению
   меньшинство). warm остаётся в отчёте как справка. */
/* ── массы вместо пустоты (M249) ──
   «Пусто ≤45%» повторяло ту же ошибку строкой ниже: открытый космос ОБЯЗАН
   быть пустым, как ледяной мир обязан быть холодным. Требовать от системы
   заполненности — значит велеть забить кадр мусором. Вопрос не «сколько
   пусто», а ЧИТАЕТСЯ ЛИ КАДР КАК ДВЕ-ТРИ ВЫЛЕПЛЕННЫЕ МАССЫ (нотан, разбор в
   docs/DESIGN-craft.md §3). Яркость огрубляется до трёх ступеней:
   · mass — доля ВТОРОЙ по площади ступени: есть ли у кадра противовес.
     Одна масса на 96% поля — силуэта нет, смотреть не на что.
   · edge — доля переходов между ступенями у соседних проб: собран ли кадр
     в пятна (кромок мало) или рассыпан крупой (кромка на каждом шагу).
   Пустое поле с одной внятной массой проходит; поле ровной крупы — нет.
   Прежний прибор эти два случая не различал, глаз различает мгновенно.
   empty остаётся справкой в таблице: это число о содержимом, а не о свете
   (хвост M248 — пещера пуста на 83% ВЕЩАМИ, и свет тут ни при чём).
   Замер 0.245.0 по одиннадцати сценам: mass 6–43, edge 3–11. Провалены по
   массам ровно те сцены, на которые жаловался глаз в хвостах M248 — карта 6,
   пояс 6, пещера 10; «пустые, но вылепленные» система и дом проходят. То есть
   мера различает то, что различал глаз, и мишень ставится по водоразделу: 14.
   edge — не мишень, а СТОРОЖ от рассыпания в крупу: сегодня везде ≤11, и
   правка, поднявшая кромку выше 18, раздробила кадр — макрокрупу мера видит,
   а субпиксельная звёздная пыль в пробы почти не попадает и ей не судится. */
const LOOK_TARGET={pair:15,mass:14,edge:18,contrast:.30,tones:5};
/* ── замер одного кадра ──
   Считаем по каждому четвёртому пикселю: точность та же, стоимость вчетверо
   меньше. Тон учитывается только у насыщенных и не чёрных пикселей — у серого
   тона нет, и складывать его в гистограмму значит врать себе. */
function lookFrame(){
  const cx=cvs.getContext("2d");
  const W2=cvs.width,H2=cvs.height;
  const d=cx.getImageData(0,0,W2,H2).data;
  const hue=new Array(36).fill(0);
  const sat=[],val=[];let warm=0,cold=0;
  /* нотан: три ступени яркости, счёт масс и кромки — в том же проходе */
  const bins=[0,0,0];let edges=0,pairsN=0,pb=-2;
  for(let y=0;y<H2;y+=4)for(let x=0;x<W2;x+=4){
    const i=(y*W2+x)*4,r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255;
    if(x<4)pb=-2;                        /* новая строка проб — кромка не через край */
    const L=.299*r+.587*g+.114*b;
    const bin=L<.25?0:(L<.62?1:2);
    bins[bin]++;
    if(pb>=0){pairsN++;if(pb!==bin)edges++;}
    pb=bin;
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b),v=mx,s=mx?(mx-mn)/mx:0;
    let h=0;
    if(mx!==mn){
      if(mx===r)h=60*(((g-b)/(mx-mn))%6);
      else if(mx===g)h=60*((b-r)/(mx-mn)+2);
      else h=60*((r-g)/(mx-mn)+4);
      if(h<0)h+=360;
    }
    sat.push(s);val.push(v);
    if(s>.12&&v>.06){
      hue[Math.floor(h/10)%36]++;
      /* тепло/холод — по разнице красного и синего, а не по секторам круга.
       Сектора оставляли зелёное (треть палитры этой игры) вообще без ответа,
       и на зелёной планете прибор считал, что цвета нет. Художник различает
       так же: жёлто-зелёное тёплое, сине-зелёное холодное. */
      const rb=(r-b)*255;
      if(rb>8)warm++;else if(rb<-8)cold++;
    }
  }
  sat.sort((a,b)=>a-b);val.sort((a,b)=>a-b);
  const n=val.length||1;
  const tot=hue.reduce((a,b)=>a+b,0)||1;
  /* «пусто» — доля квадратов 16×16 без единой детали: не тёмное, а именно
     то, на что не на что смотреть */
  let empty=0,blocks=0;
  for(let by=0;by<H2-16;by+=16)for(let bx=0;bx<W2-16;bx+=16){
    let lo=999,hi=-1;
    for(let y=by;y<by+16;y+=3)for(let x=bx;x<bx+16;x+=3){
      const i=(y*W2+x)*4,L=.299*d[i]+.587*d[i+1]+.114*d[i+2];
      if(L<lo)lo=L;if(L>hi)hi=L;
    }
    blocks++;if(hi-lo<10)empty++;
  }
  const wpct=Math.round(100*warm/Math.max(1,warm+cold));
  const sb=bins.slice().sort((a,b)=>b-a),binN=Math.max(1,bins[0]+bins[1]+bins[2]);
  return {
    tones:hue.filter(v=>v/tot>=.05).length,          /* сколько тонов держат кадр */
    warm:wpct,                                       /* тёплых против холодных, % */
    pair:Math.min(wpct,100-wpct),                    /* доля меньшинства: есть ли вторая температура */
    contrast:+(val[Math.floor(n*.95)]-val[Math.floor(n*.05)]).toFixed(2),
    mass:Math.round(100*sb[1]/binN),                 /* вторая масса: есть ли противовес */
    edge:Math.round(100*edges/Math.max(1,pairsN)),   /* кромка: пятна или крупа */
    empty:Math.round(100*empty/Math.max(1,blocks)),  /* справка: о содержимом, не о свете */
    sat:+sat[Math.floor(n/2)].toFixed(2),
    val:+val[Math.floor(n/2)].toFixed(2)
  };
}
/* Приговор по мишеням: строка из галочек, чтобы в консоли было видно сразу */
/* сцены под естественным дневным светом: одна температура там — не порок, а
   правда пустыни в полдень; пара печатается справкой, без приговора (M308,
   решение 2026-09-03) */
const LOOK_DAYLIGHT=["грунт день","заход"];
function lookVerdict(m,scene){
  const T=LOOK_TARGET;
  const ok=[];
  const dayl=scene&&LOOK_DAYLIGHT.indexOf(scene)>=0;
  ok.push(dayl?("·пара "+m.pair+"% (дневной свет, без приговора)"):((m.pair>=T.pair?"✓":"×")+"пара "+m.pair+"% (тепла "+m.warm+"%)"));
  ok.push((m.mass>=T.mass?"✓":"×")+"массы "+m.mass+"%");
  ok.push((m.edge<=T.edge?"✓":"×")+"кромка "+m.edge+"% (пусто "+m.empty+"%)");
  ok.push((m.contrast>=T.contrast?"✓":"×")+"контраст "+m.contrast);
  ok.push((m.tones>=T.tones?"✓":"×")+"тонов "+m.tones);
  return ok.join(" · ");
}
/* ── что мерить ──
   Список сцен один на всех: им пользуется и прибор, и фуззер в тестах. Второй
   такой же список разошёлся бы с этим за месяц (M238). Постановка сцены НЕ
   трогает сохранение: `lookAll` снимает снимок до и возвращает его после. */
function lookScenes(){
  const find=pred=>{
    for(let r0=0;r0<12;r0++)for(let x=-r0;x<=r0;x++)for(let y=-r0;y<=r0;y++){
      if(Math.max(Math.abs(x),Math.abs(y))!==r0)continue;
      if(!starAt(x,y))continue;
      const s=getSystem(x,y);if(pred(s))return s;
    }
    return null;
  };
  /* ── сцена обязана повторяться (M336) ──
     Планеты живут в `SYS_CACHE` и ходят по орбитам весь сеанс: система, в
     которую прибор пришёл на пятой минуте, стоит иначе, чем на первой. Сцена
     «система» ставит корабль ОТ планеты, поэтому в кадр попадало то звезда, то
     пустота — числа кадра гуляли на четверть шкалы (контраст 0.88 против 0.15
     в одном и том же прогоне), и от этого же было неверно обещание фуззера
     «seed один — падение повторится в точности».
     Лечится тем самым правилом, на котором стоит вся игра: эфемерное не
     хранится, а пересчитывается. Система берётся заново из своего seed —
     орбиты возвращаются в начальную фазу, сцена становится одной и той же. */
  const fresh=s=>{
    if(!s)return s;
    SYS_CACHE.delete(s.key);
    return getSystem(s.sx,s.sy);
  };
  const jump=s=>{s=fresh(s);if(!s)return false;G.sx=s.sx;G.sy=s.sy;G.sys=s;G.ap=null;G.orbit=null;return true;};
  const land=pred=>{
    if(!jump(find(q=>(q.planets||[]).some(pred))))return false;
    /* планету берём у G.sys, а не у найденной системы: `jump` пересобрал её
       заново, и объекты старой копии в этом мире больше никому не принадлежат */
    const p=G.sys.planets.find(pred);if(!p)return false;
    const tr=genTerrain(p);
    G.land={p,tr,x:tr.padX,y:groundAt(tr,tr.padX)};enterSurface();return true;
  };
  const day=p=>p.type!=="gas"&&p.T.atm!=="отсутствует";
  /* ── час назначается, а не как выйдет (M243) ──
     Прибор мерил сцену в тот час, в какой попал: «грунт» выходил то дневным,
     то ночным, и числа гуляли между прогонами. Час теперь ставится явно —
     день это день, ночь это ночь, и день с ночью меряются отдельно. */
  const setHour=(p,wantDay)=>{
    const t0=G.t;let best=null;
    for(let k=0;k<240;k++){
      const t=t0+k*900;
      const s=celSun(p,t);
      const score=wantDay?s.alt:-s.alt;
      if(!best||score>best.score)best={score,t};
    }
    if(best)G.t=best.t;
  };
  return [
    {id:"система",set:()=>{if(!jump(find(q=>q.station&&(q.planets||[]).length>=3)))return false;
      const p1=G.sys.planets[1];
      G.mode="system";G.ship.x=p1.x+380;G.ship.y=p1.y+220;G.zoom=.7;return true;}},
    {id:"карта",set:()=>{G.mode="map";return true;}},
    {id:"заход",set:()=>{if(!jump(find(q=>(q.planets||[]).some(p=>p.type!=="gas"))))return false;
      const pl=G.sys.planets.find(p=>p.type!=="gas");startLanding(pl);setHour(pl,true);   /* заход меряется днём (M308) */
      G.land.y=groundAt(G.land.tr,G.land.x)-560;return true;}},
    {id:"грунт день",set:()=>{if(!land(day))return false;setHour(G.surf.p,true);return true;}},
    {id:"грунт ночь",set:()=>{if(!land(day))return false;setHour(G.surf.p,false);return true;}},
    {id:"шахта",set:()=>{if(!land(day))return false;enterDig();return true;}},
    {id:"пещера",set:()=>{if(!land(day))return false;enterCave();return !!G.cave;}},
    {id:"пояс",set:()=>{if(!jump(find(q=>!!q.belt)))return false;enterBelt();return true;}},
    /* ── абордаж в общем списке (M337) ──
       Режимов в `stepWorld` тринадцать, а в этом списке их было одиннадцать:
       рейд не гонял никто. Список один на прибор и на фуззер — значит целый
       режим с настоящей проекцией (десятки четырёхугольников с сортировкой по
       глубине) не видел ни случайных рук, ни числа кадра, ни сквозных наборов.
       Постановка взята у пробника кадров (28z-fps-probe), где она уже была. */
    /* борт «Сороки» (M343): полка эпохи 0, чтобы кадр не плыл с реальными сутками */
    {id:"сорока",set:()=>{
      if(typeof openWanderer!=="function")return false;
      const s0=wanderLoop()[0];if(!jump(getSystem(s0.sx,s0.sy)))return false;
      G.mode="system";return openWanderer({force:true,epoch:0});}},
    {id:"рейд",set:()=>{
      if(typeof pirateBaseOf!=="function"||typeof enterRaid!=="function")return false;
      if(!jump(find(q=>!!pirateBaseOf(q))))return false;
      const PB=pirateBaseOf(G.sys);if(!PB)return false;
      enterRaid(PB);return G.mode==="raid";}},
    /* ── тихие режимы тоже кто-то должен гонять (M337) ──
       Зимовка и санаторий — отдельные `G.mode` со своим апдейтом и своим
       кадром, и до сих пор их не трогал ни фуззер, ни прибор. Ставятся
       собственными воротами игры (`winTake`/`enterSpa`), а не руками: запись,
       собранная наполовину, уже однажды доехала до чужого набора и умерла там
       на `toFixed` (M329). */
    {id:"зимовка",set:()=>{
      if(typeof winTake!=="function"||typeof enterWinter!=="function")return false;
      /* нанимают зимовщика у стойки: сцена и ставится оттуда, иначе она
         проверяла бы путь, которым игрок не ходит */
      const st=find(q=>!!q.station);if(!jump(st))return false;
      G.st=G.sys.station;
      const s=find(q=>(q.planets||[]).some(day));if(!s)return false;
      const p=s.planets.find(day);if(!p)return false;
      if(!winTake({sx:s.sx,sy:s.sy,pname:p.name,sysName:s.name,pi:p.idx}))return false;
      G.st=null;
      enterWinter();return G.mode==="winter";}},
    {id:"санаторий",set:()=>{
      if(typeof enterSpa!=="function"||typeof instAll!=="function")return false;
      if(!land(q=>q.type==="ocean"))return false;
      const I=instAll();if(!I)return false;
      I.vouch=Math.max(1,I.vouch|0);
      enterSpa();return G.mode==="spa";}},
    {id:"черпак",set:()=>{if(!jump(find(q=>(q.planets||[]).some(p=>p.type==="gas"))))return false;
      startScoop(G.sys.planets.find(p=>p.type==="gas"));return true;}},
    {id:"база",set:()=>{if(!land(day))return false;
      const p=G.surf.p;
      /* деньги и сплавы прибору нужны только чтобы поставить сцену; сохранение
         возвращается целиком в lookAll, а «+=» к кошельку в этой игре имеет
         право писать одна функция earn() — её сторожит отдельный тест */
      G.credits=Math.max(G.credits|0,99999);G.cargo.alloy=Math.max(G.cargo.alloy|0,20);
      if(!baseAt(G.sx,G.sy,p.idx)&&!foundBase(p))return false;
      enterBase(p);return G.mode==="base";}},
    {id:"дом",set:()=>{if(!G.home)G.home=homeInit();
      G.home.tier=Math.max(4,G.home.tier|0);
      if(!jump(find(q=>(q.planets||[]).some(day))))return false;
      G.home.sx=G.sx;G.home.sy=G.sy;
      if(!land(day))return false;enterHomeIn();return G.mode==="homein";}}
  ];
}
/* ── прогон по всем сценам ──
   Сохранение снимается до и возвращается после: прибор не имеет права
   переставить игроку мир. Печатает таблицу и возвращает её же. */
function lookAll(frames){
  frames=frames||14;
  const snap=JSON.parse(JSON.stringify(snapshot()));
  const rows=[];
  for(const sc of lookScenes()){
    let ok=true;
    try{ok=sc.set()!==false;}catch(e){ok=false;}
    if(!ok)continue;
    try{
      for(let i=0;i<frames;i++){G.t++;stepWorld(1);}
      drawWorld();
      rows.push(Object.assign({сцена:sc.id},lookFrame()));
    }catch(e){rows.push({сцена:sc.id,ошибка:e.message});}
  }
  try{applySave(snap);}catch(e){}
  G.mode="system";G.land=null;G.surf=null;G.dig=null;G.cave=null;G.base=null;G.hin=null;
  if(typeof console.table==="function")console.table(rows);
  for(const r of rows)if(!r.ошибка)console.log(r.сцена+": "+lookVerdict(r,r.сцена));
  return rows;
}
/* Один кадр, тот что сейчас на экране: `look()` в консоли во время игры */
function look(){
  const m=lookFrame();
  console.log(G.mode+" · "+lookVerdict(m));
  return m;
}
/* ── ?look: прогон прибора без рук (свод: кадр судится числами) ──
   Как ?g11 (28z): после загрузки — lookAll по всем сценам и POST таблицы на
   стенд (docs/stand.ps1 → docs/shots/look.png); docs/lookrun.ps1 запускает и
   печатает JSON. Правило автора 30.08: правила применяются к КАЖДОМУ КАДРУ —
   значит, у кадров должен быть безрукий судья. */
if(/[?&]look\b/.test(location.search)){
  addEventListener("load",()=>setTimeout(async()=>{
    const i=document.getElementById("intro");if(i)i.style.display="none";
    G.running=true;
    let rows;try{rows=lookAll(10);}catch(e){rows=[{err:String(e&&e.message||e)}];}
    const body=JSON.stringify(rows.map(r=>Object.assign({},r,{verdict:r.pair!=null?lookVerdict(r):undefined})));
    /* стенд ждёт base64 (как у g11); кириллицу btoa не берёт — тот же трюк */
    try{await fetch("/shot?n=look",{method:"POST",
      body:btoa(unescape(encodeURIComponent(body)))});}catch(e){}
    document.title="LOOKDONE";
  },900));
}

/* ══════════════ читается ли изготовитель (M369, §19.4) ══════════════
   Свод требует, чтобы чужой корпус называл своего изготовителя ВЗГЛЯДОМ, а не
   подписью. «Мне кажется, читается» — не довод: прибор смотрит на ту же
   картинку, что игрок, и считает долю угаданных.

   Как считает. Корпус рисуется в маленькую канву носом вправо; из пикселей
   берётся вектор примет: восемь замеров полувысоты силуэта (это и есть закон
   профиля), скачки между соседними колонками (ступени и модули против гладкой
   капсулы и веретена), доля чернил ЗА телом (приметы, торчащие из обвода),
   вытянутость и средний тон обшивки. Шесть образцов считаются по обучающим
   семенам, проверка идёт по ДРУГИМ — иначе прибор хвалил бы сам себя.

   makerRead()        — доля угаданных по ста семенам на класс;
   makerRead(20)      — быстрее и грубее, для правки на ходу. */
const MAKER_PX=52;
let MAKER_CV=null;
function makerFeat(id){
  if(!MAKER_CV){
    MAKER_CV=document.createElement("canvas");
    MAKER_CV.width=MAKER_CV.height=MAKER_PX;
  }
  const c=MAKER_CV.getContext("2d");
  c.setTransform(1,0,0,1,0,0);
  c.clearRect(0,0,MAKER_PX,MAKER_PX);
  const h=hullOf(id);
  const k=MAKER_PX*.86/Math.max(8,h.len+h.halfW*.9);
  const old=ctx;ctx=c;
  c.save();c.translate(MAKER_PX*.5-((h.nose+h.tail)*.5)*k,MAKER_PX*.5);c.scale(k,k);
  try{drawHull(id,false,false,0,0);}catch(e){}
  c.restore();ctx=old;
  const d=c.getImageData(0,0,MAKER_PX,MAKER_PX).data;
  /* полувысота силуэта по колонкам и средний тон того, что нарисовано */
  const col=new Array(MAKER_PX).fill(0);
  /* лучи: наибольший радиус чернил в двенадцати секторах. Крюк за кормой,
     бушприт перед носом, антенны и баки по борту — все они торчат в СВОЮ
     сторону, и в столбцах этого не видно, а в лучах видно */
  const RAY=12,ray=new Array(RAY).fill(0);
  let ink=0,rs=0,gs=0,bs=0,dark=0;
  for(let x=0;x<MAKER_PX;x++){
    for(let y=0;y<MAKER_PX;y++){
      const i=(y*MAKER_PX+x)*4;
      if(d[i+3]<40)continue;
      col[x]=Math.max(col[x],Math.abs(y-MAKER_PX*.5)+.5);
      const dx=x-MAKER_PX*.5,dy=y-MAKER_PX*.5;
      const a=(Math.atan2(dy,dx)+Math.PI*2)%(Math.PI*2);
      const sct=Math.floor(a/(Math.PI*2)*RAY)%RAY;
      const rr=Math.hypot(dx,dy);
      if(rr>ray[sct])ray[sct]=rr;
      ink++;rs+=d[i];gs+=d[i+1];bs+=d[i+2];
      if(d[i]+d[i+1]+d[i+2]<230)dark++;
    }
  }
  if(!ink)return null;
  const on=[];for(let x=0;x<MAKER_PX;x++)if(col[x]>0)on.push(x);
  const x0=on[0],x1=on[on.length-1],L=Math.max(1,x1-x0);
  let wmax=0;for(let x=x0;x<=x1;x++)wmax=Math.max(wmax,col[x]);
  const f=[];
  for(let s=0;s<8;s++){
    const x=Math.round(x0+L*(s+.5)/8);
    f.push(col[x]/Math.max(1,wmax));
  }
  /* скачки: ступенчатый профиль рвётся, капсула и веретено — нет */
  let jump=0,steps=0,xw=x0;
  for(let x=x0+1;x<=x1;x++){
    if(col[x]>=wmax)xw=x;
    if(!col[x]||!col[x-1])continue;
    const dd=Math.abs(col[x]-col[x-1])/Math.max(1,wmax);
    jump+=dd;if(dd>.12)steps++;
  }
  f.push(jump/Math.max(1,L)*8);
  f.push(steps/Math.max(1,L)*4);
  /* чернила за телом: приметы, которые торчат за обвод */
  let out=0;
  for(let x=x0;x<=x1;x++)if(col[x]>wmax*1.02)out++;
  f.push(out/Math.max(1,L)*2);
  f.push(L/Math.max(1,wmax*2)/6);                 /* вытянутость */
  /* нос и корма: бушприт Коммуны, крюк ГЛАВТРАССЫ и антенны Хай-Фронта живут
     именно здесь — далеко от миделя и за обводом */
  f.push((x1-xw)/Math.max(1,L));
  f.push((xw-x0)/Math.max(1,L));
  f.push(col[Math.min(x1,x0+Math.round(L*.06))]/Math.max(1,wmax));
  f.push(col[Math.max(x0,x1-Math.round(L*.06))]/Math.max(1,wmax));
  /* краска: грунт изготовителя и то, сколько на борту чёрного */
  f.push((rs-bs)/ink/255+.5);                     /* тепло обшивки */
  f.push((rs+gs+bs)/(3*ink)/255);                 /* светлота обшивки */
  f.push(dark/ink);                               /* доля тёмного: рёбра, охра, сварка */
  let rmean=0;for(let k2=0;k2<RAY;k2++)rmean+=ray[k2]/RAY;
  for(let k2=0;k2<RAY;k2++)f.push(ray[k2]/Math.max(1,rmean));
  return f;
}
function makerStand(by,i,cls){
  const id="mk_"+by+"_"+(cls||"scout")+"_"+i;
  NPC_SHIPS[id]={name:id,seed:(i*7919+by.charCodeAt(0)*104729+(cls||"s").charCodeAt(0)*31)>>>0,
    hcls:cls||"scout",col:"#9fd8ff",hull:100,cargo:60,fuel:100,thr:1,cls:cls||"scout",by};
  delete HULL_CACHE[id+"!"+by];
  return id;
}
function makerRead(n){
  n=n||100;
  const cls=Object.keys(HULL_CLASS),keys=MAKER_KEYS;
  const per=Math.max(4,Math.ceil(n/cls.length));
  /* ── как прибор спрашивает ──
     Класс читается первым, изготовитель вторым (§0 закон 7) — значит и вопрос
     ставится так же: класс известен, чей корпус? Образцы считаются на КАЖДЫЙ
     класс отдельно по обучающим семенам, проверка идёт по другим, а все приметы
     приводятся к одному разбросу: иначе одна крупная величина (скажем, длина
     в пикселях) перевешивает семь остальных просто потому, что она больше. */
  const rows=[],hit={},tot={},miss={};
  for(const by of keys){hit[by]=0;tot[by]=0;miss[by]={};}
  let ok=0,all=0;
  for(const k of cls){
    const mid={},cnt={},test=[];
    for(const by of keys){
      for(let i=0;i<10;i++){
        const f=makerFeat(makerStand(by,900+i,k));
        if(!f)continue;
        if(!mid[by]){mid[by]=f.slice();cnt[by]=1;}
        else{for(let j=0;j<f.length;j++)mid[by][j]+=f[j];cnt[by]++;}
      }
      if(mid[by])for(let j=0;j<mid[by].length;j++)mid[by][j]/=cnt[by];
      for(let i=0;i<per;i++){
        const f=makerFeat(makerStand(by,i,k));
        if(f)test.push({by,f});
      }
    }
    if(!test.length)continue;
    /* разброс каждой приметы по этому классу — им и делим */
    const D=test[0].f.length,mu=new Array(D).fill(0),sd=new Array(D).fill(0);
    for(const t of test)for(let j=0;j<D;j++)mu[j]+=t.f[j]/test.length;
    for(const t of test)for(let j=0;j<D;j++)sd[j]+=Math.pow(t.f[j]-mu[j],2)/test.length;
    for(let j=0;j<D;j++)sd[j]=Math.sqrt(sd[j])||1;
    /* вес приметы: форма весит больше краски — краску перекрасят, форму нет */
    /* веса подобраны замером (M369): форма профиля и приметы держат основную
       часть, краска — треть, лучи силуэта почти ничего: у них своя беда, в них
       громче всего слышен КЛАСС (крыло, контейнеры), а не порода */
    const W=[1,1,1,1,1,1,1,1, 1.3,1.3, 1.6, 1.1, 1.2,1.2,1,1, 2.2,2.2,2,
      .4,.4,.4,.4,.4,.4,.4,.4,.4,.4,.4,.4];
    for(const t of test){
      let best=null,bd=1e9;
      for(const q of keys){
        if(!mid[q])continue;
        let s2=0;
        for(let j=0;j<D;j++){const dd=(t.f[j]-mid[q][j])/sd[j]*(W[j]||1);s2+=dd*dd;}
        if(s2<bd){bd=s2;best=q;}
      }
      tot[t.by]++;all++;
      if(best===t.by){hit[t.by]++;ok++;}
      else if(best)miss[t.by][best]=(miss[t.by][best]||0)+1;
    }
  }
  for(const by of keys)rows.push({by,ru:makerRu(by),
    acc:tot[by]?+(hit[by]/tot[by]*100).toFixed(1):0,
    /* с кем путают: прибор обязан не только ставить оценку, но и говорить,
       какие две породы похожи — иначе править нечего */
    with:(function(){let b=null,n=0;for(const q of keys)if(q!==by&&(miss[by][q]||0)>n){n=miss[by][q];b=q;}
      return b?makerRu(b)+" "+n:"";})()});
  const out={acc:all?+(ok/all*100).toFixed(1):0,n:all,rows};
  if(typeof console!=="undefined")
    console.log("изготовитель читается на "+out.acc+" % ("+all+" корпусов): "+
      rows.map(r=>r.ru+" "+r.acc).join(" · "));
  return out;
}
