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
    {id:"рейд",set:()=>{
      if(typeof pirateBaseOf!=="function"||typeof enterRaid!=="function")return false;
      if(!jump(find(q=>!!pirateBaseOf(q))))return false;
      const PB=pirateBaseOf(G.sys);if(!PB)return false;
      enterRaid(PB);return G.mode==="raid";}},
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
