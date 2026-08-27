/* ══════════════ открытка: снимок сцены, а не пиксели ══════════════
   M188, первый проход. Фотография в «Дрейфе» — не картинка, а СНИМОК СЦЕНЫ:
   режим, семена мира, час, погода, точка съёмки, VER. Двести байт, которые
   получатель рисует своим движком. Три причины, по порядку: сервер возит
   байты вместо мегабайт; ничего, кроме собственного мира игры, через границу
   физически не проходит; и старая карточка, перерисованная новым движком,
   выходит чуть не такой — ровно то, что делает со снимком время.

   ПОЧЕМУ ЭТО ОТДЕЛЬНЫЙ ХУДОЖНИК, А НЕ ПОВТОР РЕЖИМА. Вся отрисовка игры
   приварена к глобальным: любой путь пишет в единственный `ctx` при
   единственных `W`/`H`, читая единственный живой `G`. Нарисовать сохранённую
   сцену «как есть» значило бы подменить мир под рендером и вернуть обратно —
   класс ошибок, который портит сохранение. Поэтому у открытки СВОЙ художник:
   `drawPostcard(c,snap,w,h)` берёт снимок и чужой контекст и не должен `G`
   ничего. Это ВИД, а не прогон режима, и написан он так с самого начала.

   ПОЧЕМУ НЕ ПИКСЕЛИ. Мерили: JPEG 480×300 — около 25 КБ, двенадцать штук —
   триста, и альбом уезжает в сохранение, которое ходит в облако. Это не
   альбом, это новая беда с форматом сохранения.

   ЧТО ДЕЛАЕТ КАДР ФОТОГРАФИЕЙ. Мерило — человек: фигура у нижней трети даёт
   масштаб всему остальному, без неё гряда может быть и валуном, и горой.
   Порядок слоёв — от неба к земле, и каждый следующий темнее и резче
   предыдущего: воздух между планами и есть глубина. Свет один и тот же во
   всех слоях — от звезды, посчитанной по часу.

   ПРАВИЛА ФАЙЛА:
   1. Ни одной ссылки на `G`, `ctx`, `W`, `H`. Всё приходит доводами.
   2. Ни одного собственного случайного числа: только семена мира.
   3. Рельеф берётся `genTerrain` — тем же, что и в полёте. Своя формула
      рельефа означала бы, что открытка врёт про место. */
const POST_V=1;
const POST_HOR=0.62;              /* горизонт в долях кадра */
/* Рельеф дорог (полторы тысячи точек и полсотни валунов), а альбом рисует
   двенадцать карточек подряд. Кэш на связку «планета+долгота» держит с запасом
   БОЛЬШЕ, чем мест в альбоме: ровно двенадцать значило бы, что альбом из
   двенадцати разных планет вытесняет сам себя на каждой перерисовке. Замер на
   худшем случае: холодный кэш — 178 мс, тёплый — 17. */
const POST_TR=new Map();
const POST_TR_MAX=18;
function postTerrain(p,lon){
  const k=p.key+"@"+(lon==null?"-":lon.toFixed(3));
  let tr=POST_TR.get(k);
  if(!tr){tr=genTerrain(p,lon);POST_TR.set(k,tr);
    if(POST_TR.size>POST_TR_MAX)POST_TR.delete(POST_TR.keys().next().value);}
  return tr;
}
/* мир снимка: планета или спутник по индексам */
function postWorld(s){
  const sys=getSystem(s.sx,s.sy);
  let p=(sys.planets[s.pi]||sys.planets[0])||null;
  if(p&&s.mi>=0&&p.moons&&p.moons[s.mi])p=p.moons[s.mi];
  return {sys,p};
}
/* ── снимок ──
   Только то, чего нельзя вывести. Всё остальное — из семени.

   ВОСЕМЬ МЕСТ, А НЕ ДВА (M208). Первый проход умел грунт и заход, и это
   значило, что в пяти местах из восьми кнопка ФОТО просто не появлялась —
   камера молчала там, где игрок проводит половину времени. Формат снимка при
   этом НЕ вырос: `cx`/`cy` в каждом режиме значат своё (шаг по галерее,
   клетка забоя, курс, высота), а не заведены по паре полей на режим. Двести
   байт — это условие, а не достижение: снимок ездит по проводу и лежит в
   сохранении, которое ходит в облако. */
function postSnap(){
  const B={v:POST_V,sx:G.sx,sy:G.sy,t:Math.round(G.t),ver:VER};
  const idx=(p)=>{const moon=p.parentIdx!=null;
    return {pi:moon?p.parentIdx:p.idx, mi:moon?p.idx:-1};};
  const M=G.mode;
  /* пещера: планета берётся с поверхности — в пещеру спускаются с неё, и
     `G.surf` живёт всё это время (наверх ведь ещё возвращаться) */
  /* долготы тут нет намеренно: под землёй рельеф за спиной, художник пещеры
     его не рисует, а поле, которое никто не читает, — это лишние байты в
     формате, чьё единственное оправдание в том, что он маленький */
  if(M==="cave"&&G.cave&&G.surf&&G.surf.p)
    return Object.assign(B,{m:"c"},idx(G.surf.p),
      {cx:Math.round(G.cave.x),cy:Math.round(G.cave.y),lon:null});
  if(M==="dig"&&G.dig&&G.dig.p)
    return Object.assign(B,{m:"d"},idx(G.dig.p),
      {cx:G.dig.col|0,cy:G.dig.row|0,lon:null});
  if(M==="belt"&&G.belt)
    return Object.assign(B,{m:"b",pi:0,mi:-1,lon:null,
      cx:Math.round((G.belt.yaw||0)*180/Math.PI)%360,
      cy:Math.round((G.belt.pitch||0)*180/Math.PI)});
  if(M==="scoop"&&G.scoop&&G.scoop.p)
    return Object.assign(B,{m:"g"},idx(G.scoop.p),
      {cx:Math.round(G.scoop.bank*100),
       cy:Math.round((G.scoop.y/Math.max(1,H))*1000),lon:null});
  if(M==="system"){
    /* ближняя планета — та, о которой снимок: кадр в пустоте без тела в нём
       не место, а обои */
    const sys=getSystem(G.sx,G.sy), sh=G.ship;
    let best=null,bd=1e18;
    for(const q of (sys.planets||[])){
      const d=Math.hypot((q.x||0)-sh.x,(q.y||0)-sh.y);
      if(d<bd){bd=d;best=q;}
    }
    if(!best)return null;
    return Object.assign(B,{m:"y"},idx(best),
      {cx:Math.round(Math.atan2(sh.y-(best.y||0),sh.x-(best.x||0))*180/Math.PI),
       cy:Math.round(Math.min(999,bd/Math.max(1,best.r||1)*10)),lon:null});
  }
  const surf=G.surf&&G.surf.p?G.surf:null, land=!surf&&G.land&&G.land.p?G.land:null;
  const st=surf||land;
  if(!st)return null;
  return Object.assign(B,{m:surf?"s":"l"},idx(st.p),
    {lon:st.tr?+st.tr.lon.toFixed(3):null, cx:Math.round(st.x||0), cy:0});
}
/* подпись под карточкой: место и час, без единого числа из интерфейса.
   Место — это не только имя планеты: снимок из шахты и снимок с гребня над
   ней приходят с одним именем и разными кадрами, и подпись обязана их
   различать, иначе альбом из восьми мест читается как восемь видов одного */
const POST_WHERE={c:"пещера",d:"шахта",b:"пояс",g:"атмосфера",y:"на орбите"};
function postCaption(s){
  const W0=postWorld(s);
  if(!W0.p)return "";
  const sun=celSun(W0.p,s.t);
  const hour=sun.alt>.45?"полдень":(sun.alt>.08?"день":
    (sun.alt>-.08?(sun.az>0?"закат":"рассвет"):(sun.alt>-.5?"сумерки":"ночь")));
  const wh=POST_WHERE[s.m];
  /* под землёй часа не видно, и врать про полдень нельзя */
  if(s.m==="c"||s.m==="d")return W0.p.name+" · "+wh;
  return W0.p.name+" · "+(wh?wh+", ":"")+hour;
}
/* ── печать ──
   Виньетка и зерно — ровно столько, чтобы кадр читался напечатанным, а не
   выведенным на экран: открытку держат в руках. Общая для всех восьми мест
   и НАМЕРЕННО одинаковая: печать — это то, что делает восемь разных кадров
   одним альбомом. */
function pcPrint(c,s,w,h,p){
  const vg=c.createRadialGradient(w*.5,h*.46,Math.min(w,h)*.30,w*.5,h*.5,Math.max(w,h)*.72);
  vg.addColorStop(0,"rgba(0,0,0,0)");
  vg.addColorStop(1,"rgba(0,0,0,.38)");
  c.fillStyle=vg;c.fillRect(0,0,w,h);
  const rg=rng(hashi(p.seed,s.cx|0,0x6247));
  c.globalAlpha=.05;c.fillStyle="#fff";
  for(let i=0;i<Math.round(w*h/1000);i++)c.fillRect(rg()*w,rg()*h,1,1);
  c.globalAlpha=1;
}
/* ── цвет ── */
function pcC(a,k){const m=k==null?1:k;
  return "rgb("+Math.round(a[0]*m)+","+Math.round(a[1]*m)+","+Math.round(a[2]*m)+")";}
function pcMix(a,b,k){return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];}
function pcA(a,al){return "rgba("+Math.round(a[0])+","+Math.round(a[1])+","+Math.round(a[2])+","+al.toFixed(3)+")";}
/* цвет звезды строкой «#rrggbb» из таблицы классов — в числа */
function pcStar(sys){
  const h=(sys&&sys.cls&&sys.cls.col)||"#ffe08a";
  return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)];
}
/* ── художник ──
   c — чужой контекст, s — снимок, w×h — куда рисовать. Возвращает false,
   если снимок не читается: карточка тогда останется пустым бланком, и это
   честнее, чем нарисовать не то место.

   ЯЗЫК КАДРА — ТОТ ЖЕ, ЧТО У ИГРЫ, и это не вкусовщина, а условие: карточка
   должна быть узнана как снимок ИЗ ЭТОЙ игры, иначе она чужая. Первый проход
   рисовал далёкую гряду в дымке — красиво и мимо. У «Дрейфа» на поверхности:
   небо с большим телом в нём, профиль с подсвеченной кромкой, а под профилем
   не пустота, а ТЕЛО ГРУНТА со слоями породы, и по кромке — силуэты растений.
   Разрез земли — половина кадра, и это он делает мир осязаемым.

   ПОРЯДОК СЛОЁВ — от дальнего к ближнему, каждый следующий темнее и резче:
   воздух между планами и есть глубина. Свет один на все слои — от звезды,
   посчитанной по часу. */
function drawPostcard(c,s,w,h){
  if(!c||!s||!s.v)return false;
  const W0=postWorld(s), p=W0.p;
  if(!p)return false;
  const T=p.T||TYPES[p.type]||TYPES.rocky;
  /* рельеф нужен только там, где он ВИДЕН: на грунте и на заходе. Пять
     остальных мест его не рисуют — под землёй он за спиной, в вакууме его
     нет вовсе, — а считать его значит полторы тысячи точек и полсотни
     валунов в мусор на каждой перерисовке альбома из двенадцати карточек */
  const tr=(s.m==="s"||s.m==="l"||!s.m)?postTerrain(p,s.lon):null;
  const sun=celSun(p,s.t);
  const airless=T.atm==="отсутствует";
  const night=clamp(-sun.alt*(airless?1.9:1.5)+.15,0,.62);
  /* ночь — это не «умножить на ноль», а другой цвет: свет уходит, синева
     остаётся. Множитель мягкий, разница держится подмешиванием в холод */
  const day=clamp(1-night*.95,.30,1);
  const cold=[18,26,46];
  const dim=(col,k)=>pcMix(pcMix(col,cold,night*(k==null?.55:k)),[0,0,0],night*.30);
  /* ── цвет грунта ──
     `T.pal` — рампа ПЛАНЕТНОЙ ТЕКСТУРЫ, вид с орбиты: нижние ступени там
     океан и тень, верхние — нагорье и лёд. Взять pal[1] за землю (первый
     счёт так и делал) значит покрасить землеподобный мир в синий: под ногами
     оказывалось море. Земля живёт в верхней середине рампы, порода уходит
     к самой тёмной ступени, а свет по кромке берётся с самой светлой. */
  /* и земля ВСЕГДА темнее своего неба. У ледяного мира рампа грунта и рампа
     неба почти совпадают числами, и кадр расслаивался в белый туман: горизонта
     не было видно вовсе. Небо светится, земля светится отражённым — разница в
     светлоте между ними и есть то, чем читается горизонт */
  const GC={body:pcMix(T.pal[Math.min(2,T.pal.length-1)],T.pal[0],.30),
            deep:T.pal[0],
            lit :T.pal[Math.min(4,T.pal.length-1)]};
  const star=pcStar(W0.sys);
  const sunX=w*(.5-sun.az*.40), sunY=Math.max(h*.09,h*(.56-sun.alt*.50));
  const up=sun.alt>-.08;
  const hy=h*POST_HOR;
  const rs=rng(hashi(p.seed,0x5747,3));

  c.save();
  c.beginPath();c.rect(0,0,w,h);c.clip();

  /* ── развилка по месту (M208) ──
     Грунт и заход рисуются ниже, в этой же функции: они были первыми и их
     слои — образец для всех остальных. Пять других мест живут в 25ga своими
     художниками. Общее у всех — НАБОР: одна звезда, один счёт ночи, одна
     палитра грунта, одно зерно. Художник места получает его доводом и не
     заводит своего света: два источника в одном альбоме — и альбом
     рассыпается на восемь разных игр.

     Печать (виньетка и зерно) — тоже общая, и она в конце для всех: снимок
     из шахты держат в руках так же, как снимок с гребня. */
  if(s.m&&s.m!=="s"&&s.m!=="l"){
    const K={sys:W0.sys,p,T,sun,airless,night,day,dim,GC,star,sunX,sunY,up,hy,rs,cold};
    let done=false;
    if(s.m==="c")done=pcCave(c,s,w,h,K);
    else if(s.m==="d")done=pcMine(c,s,w,h,K);
    else if(s.m==="b")done=pcBelt(c,s,w,h,K);
    else if(s.m==="y")done=pcSystem(c,s,w,h,K);
    else if(s.m==="g")done=pcScoop(c,s,w,h,K);
    if(done)pcPrint(c,s,w,h,p);
    c.restore();
    return done;
  }

  c.save();
  c.beginPath();c.rect(0,0,w,h);c.clip();

  /* ── 1. небо ── */
  const skH=dim(T.sky[0],.62), skZ=dim(T.sky[1],.5);
  {
    const g=c.createLinearGradient(0,0,0,hy+h*.06);
    g.addColorStop(0,pcC(skZ,day));
    g.addColorStop(.70,pcC(pcMix(skZ,skH,.75),day));
    g.addColorStop(1,pcC(skH,day));
    c.fillStyle=g;c.fillRect(0,0,w,hy+h*.07);
  }

  /* ── 2. звёзды ──
     Видны там, где нечему их прятать: ночью и всегда в вакууме */
  const starK=airless?Math.max(.40,night*1.7):Math.max(0,(night-.16)*2.6);
  if(starK>.02){
    c.fillStyle="#e8f0ff";
    for(let i=0;i<110;i++){
      const x=rs()*w,y=rs()*hy,q=rs();
      c.globalAlpha=Math.min(.92,starK*(.16+q*q*.9));
      c.fillRect(x,y,q>.94?1.7:1,q>.94?1.7:1);
    }
    c.globalAlpha=1;
  }

  /* ── 3. тело в небе ──
     Подпись «Дрейфа»: над головой всегда что-то висит — сосед по системе или
     собственный спутник. Без него небо — просто градиент, и планета могла бы
     быть любой. Тело берётся из ТОЙ ЖЕ системы, а не выдумывается */
  {
    const sib=(W0.sys.planets||[]).filter(q=>q!==p);
    const body=(p.moons&&p.moons.length&&rs()<.5)?p.moons[0]
              :(sib.length?sib[Math.floor(rs()*sib.length)]:null);
    if(body){
      const bt=body.T||TYPES[body.type]||TYPES.rocky;
      /* размер и место: тело в небе — примета, а не сюжет. Четверть кадра
         посреди карточки забирала её себе; диск меньше и уходит от центра */
      const R=h*(body.type==="gas"?.135:.075)*(.85+rs()*.45);
      const bx=w*(rs()<.5?.13+rs()*.22:.65+rs()*.22), by=hy*(.14+rs()*.34);
      /* далеко и в воздухе: диск заметно бледнее неба над ним не бывает —
         он темнее, и виден силуэтом с освещённым краем */
      const base=dim(pcMix(bt.pal[2],bt.pal[3]||bt.pal[2],.4),.7);
      c.fillStyle=pcC(base,day*(airless?.9:.68));
      c.beginPath();c.arc(bx,by,R,0,TAU);c.fill();
      /* терминатор: тень с той стороны, куда не смотрит звезда */
      const ang=Math.atan2(by-sunY,bx-sunX);
      const sh=c.createLinearGradient(bx-Math.cos(ang)*R,by-Math.sin(ang)*R,
                                      bx+Math.cos(ang)*R,by+Math.sin(ang)*R);
      sh.addColorStop(0,"rgba(0,0,0,0)");
      sh.addColorStop(.42,"rgba(0,0,0,0)");
      sh.addColorStop(1,"rgba(0,0,0,"+(up?.62:.78).toFixed(2)+")");
      c.save();c.beginPath();c.arc(bx,by,R,0,TAU);c.clip();
      c.fillStyle=sh;c.fillRect(bx-R,by-R,R*2,R*2);
      /* серпик со стороны звезды: без него диск — просто тёмное пятно, и не
         видно, что он освещён тем же светилом, что и земля под ногами */
      c.strokeStyle=pcA(pcMix(pcMix(bt.pal[3]||bt.pal[2],star,.35),cold,night*.5),
        up?.62:.30);
      c.lineWidth=Math.max(1,R*.13);
      c.beginPath();
      c.arc(bx-Math.cos(ang)*R*.10,by-Math.sin(ang)*R*.10,R*.97,0,TAU);
      c.stroke();
      c.restore();
      if(body.type==="gas"){
        c.strokeStyle=pcA(dim(bt.pal[4]||bt.pal[3]||bt.pal[2],.6),day*.5);
        c.lineWidth=Math.max(1.2,R*.10);
        c.save();c.translate(bx,by);c.rotate(-.34);
        c.beginPath();c.ellipse(0,0,R*1.75,R*.34,0,0,TAU);c.stroke();
        c.restore();
      }
    }
  }

  /* ── 4. звезда ──
     Диск маленький: солнце на снимке всегда меньше, чем помнится. Зарево —
     широкое и слабое, и оно же объясняет, откуда свет на всём остальном */
  {
    const gr=Math.min(w,h)*(up?.66:.46);
    const gg=c.createRadialGradient(sunX,up?sunY:hy,0,sunX,up?sunY:hy,gr);
    gg.addColorStop(0,pcA(star,(up?.40:.26)*(1-night*.42)));
    gg.addColorStop(.42,pcA(star,(up?.13:.09)*(1-night*.42)));
    gg.addColorStop(1,pcA(star,0));
    c.fillStyle=gg;c.fillRect(0,0,w,hy+h*.07);
    if(up){
      const rr=Math.max(2.4,Math.min(w,h)*.020*(W0.sys.cls.t||1));
      c.fillStyle=pcA(pcMix(star,[255,255,255],.5),.95);
      c.beginPath();c.arc(sunX,sunY,rr,0,TAU);c.fill();
    }
  }

  /* ── 4а. облака ──
     Их не было, и это было первое, чем карточка отличалась от живого кадра:
     в игре над головой всегда идут облака, и без них небо на снимке читалось
     нарисованным. Форма — гроздь мягких пятен на одной высоте, а не облако с
     контуром: на карточке в ладонь всё, что имеет край, становится кляксой.
     Проходят ПЕРЕД звездой, как в 19e: воздух ближе, чем светило. */
  if(!airless){
    const nC=2+Math.floor(rs()*3);
    for(let i=0;i<nC;i++){
      const cy=hy*(.10+rs()*rs()*.70), cw=w*(.14+rs()*.26);
      const cx0=rs()*w*1.2-w*.1;
      /* высокое облако бледнее — тот же воздух, что на грядах */
      const dep=clamp(cy/hy,0,1);
      const col=pcMix(dim([234,240,246],.55),skH,.26+(1-dep)*.38);
      const a=(.16+dep*.26)*(1-night*.55);
      /* КАЖДОЕ ПЯТНО — РАДИАЛЬНЫЙ ГРАДИЕНТ, а не залитый эллипс. Заливками
         выходила цепочка одинаковых лепёшек с чётким краем: на этом размере
         всё, что имеет контур, читается кляксой, а не облаком. Мягкий край
         снимает и контур, и швы на перекрытиях. */
      const nb=4+Math.floor(rs()*4);
      for(let k=0;k<nb;k++){
        const bx=cx0+(k-(nb-1)/2)*cw*.34+(rs()-.5)*cw*.20;
        const by=cy+(rs()-.5)*cw*.10;
        const br=cw*(.16+rs()*rs()*.26);
        const g2=c.createRadialGradient(bx,by,0,bx,by,br);
        g2.addColorStop(0,pcA(col,a));
        g2.addColorStop(.55,pcA(col,a*.62));
        g2.addColorStop(1,pcA(col,0));
        c.save();c.translate(bx,by);c.scale(1,.42);c.translate(-bx,-by);
        c.fillStyle=g2;
        c.beginPath();c.arc(bx,by,br,0,TAU);c.fill();
        c.restore();
      }
    }
  }

  /* ── 5. дальние гряды ──
     Дымка — не прозрачность: далёкий склон СВЕТЛЕЕ неба у горизонта, а не
     виден насквозь. Поэтому цвет мешается к небу, а альфа остаётся единицей.
     Каждый план берёт рельеф из своего места полосы — иначе две гряды
     повторяют друг друга и глубина рассыпается */
  const gcol=GC.body;
  for(let L=0;L<2;L++){
    const haze=L===0?.70:.42, amp=h*(L===0?.050:.080), off=L===0?43000:17000;
    c.fillStyle=pcC(pcMix(dim(gcol,.45),skH,haze),day);
    c.beginPath();c.moveTo(0,h);
    const base=hy-h*(L===0?.028:.010);
    for(let x=0;x<=w;x+=3){
      const u=((s.cx+off+(x/w-.5)*3400*(L===0?2.8:1.8))%tr.W+tr.W)%tr.W;
      c.lineTo(x,base-((groundAt(tr,u)-900)/300)*amp);
    }
    c.lineTo(w,h);c.closePath();c.fill();
  }

  /* ── 6. тело грунта ──
     Не силуэт холма, а РАЗРЕЗ: от профиля вниз до кромки кадра, со слоями
     породы.

     ОКНО И ВЫСОТА. Масштаб по вертикали РАВЕН масштабу по горизонтали, и это
     не придирка: у фотографии он изотропный. Пока высота считалась от `h`, на
     вулканическом мире профиль уходил пиками за верхнюю кромку — карточка
     втрое уже игрового кадра, и тот же рельеф в ней задирался втрое. Теперь
     один множитель `w/WIN` на обе оси, с четвертью прибавки на выразительность.

     СЛОИ идут параллельно профилю у поверхности и ВЫПРЯМЛЯЮТСЯ С ГЛУБИНОЙ:
     верхний слой повторяет рельеф, нижние ложатся почти горизонтально — так
     и залегает порода. Пока все полосы повторяли профиль целиком, разрез
     читался топографическим узором, а не землёй. */
  const WIN=2400, y0=groundAt(tr,s.cx), PSC=(w/WIN)*1.25;
  const gy=x=>hy+(groundAt(tr,s.cx+(x/w-.5)*WIN)-y0)*PSC;
  {
    c.save();
    c.beginPath();c.moveTo(0,h);
    for(let x=0;x<=w;x+=2)c.lineTo(x,gy(x));
    c.lineTo(w,h);c.closePath();
    c.clip();
    /* ночь гасит СВЕТ, но не должна гасить РАЗЛИЧИЯ: на каменистом мире общий
       множитель .30 съедал и слои, и профиль, и полкарточки уходило в чёрное
       поле. У земли свой пол по светлоте — она ловит и звёздный свет тоже */
    const dayG=Math.max(day,.46);
    c.fillStyle=pcC(dim(GC.body,.5),dayG);
    c.fillRect(0,0,w,h);
    const nS=clamp((tr.strata|0)+3,5,8);
    const flat=hy+h*.02;                      /* уровень, к которому выпрямляются слои */
    for(let i=1;i<=nS;i++){
      const k=i/nS;
      const col=dim(pcMix(GC.body,GC.deep,Math.pow(k,.75)*.78),.45);
      c.fillStyle=pcC(col,dayG*(1-k*.08));
      c.beginPath();c.moveTo(0,h);
      for(let x=0;x<=w;x+=4){
        const u=s.cx+(x/w-.5)*WIN;
        const wob=Math.sin(u*.0009+i*2.1)*h*.007+Math.sin(u*.0031+i*5.3)*h*.003;
        /* доля рельефа в кровле слоя падает с глубиной */
        const follow=Math.pow(1-k,1.6);
        const top=gy(x)*follow+flat*(1-follow);
        /* глубины идут почти ровным шагом до самой кромки кадра: при степени
           1.35 все полосы жались к профилю, а нижняя треть карточки была одной
           заливкой — то есть слои кончались там, где земля ещё видна */
        c.lineTo(x,top+h*(.030+Math.pow(k,1.06)*.62)+wob);
      }
      c.lineTo(w,h);c.closePath();c.fill();
    }
    /* Линза тёмной породы (18b) была тут и её убрали: на карточке в ладонь
       эллипс не читается геологией, он читается чёрным пятном поверх слоёв —
       на ледяном и вулканическом мире это выглядело браком печати. Всё, что
       мельче слоя, на этом размере лишнее. */
    c.restore();
  }
  /* кромка по свету: без неё грунт — плоская заливка, и весь рельеф держится
     на одном силуэте. Тонкая: на вулканическом мире жирная кромка превращалась
     в оранжевую змею поперёк карточки и забирала кадр себе */
  {
    const lit=pcMix(GC.lit,star,.26);
    c.strokeStyle=pcA(dim(lit,.5),up?.55:.26);
    c.lineWidth=Math.max(1,h*.0035);
    c.beginPath();
    for(let x=0;x<=w;x+=2){const y=gy(x);x?c.lineTo(x,y):c.moveTo(x,y);}
    c.stroke();
  }

  /* ── 7. что стоит на кромке ──
     Валуны — те, что лежат на профиле в игре: снимок сделан в этом месте, а
     не в похожем. Растения — только там, где им есть чем дышать; силуэтом, с
     шляпкой, потому что именно так они читаются в кадре игры */
  {
    const sc=w/WIN;
    const wx=x=>w*.5+((((x-s.cx+tr.W*1.5)%tr.W)-tr.W*.5))*sc;
    for(const rk of tr.rocks){
      const x=wx(rk.x);
      if(x<-40||x>w+40)continue;
      const y=gy(x), q=sc*1.35;
      if(rk.rad*q<.8)continue;
      c.fillStyle=pcC(dim(pcMix(GC.deep,GC.body,rk.tint*.75),.4),day*.92);
      c.beginPath();
      for(let i=0;i<rk.poly.length;i++){
        const px=x+rk.poly[i][0]*q*(rk.flip?-1:1), py=y+rk.poly[i][1]*q*.85;
        i?c.lineTo(px,py):c.moveTo(px,py);
      }
      c.closePath();c.fill();
    }
    const flora=T.atm.indexOf("пригодна")>=0||p.type==="toxic"||p.type==="jungle"||
                p.mix==="toxic"||p.mix==="jungle";
    if(flora){
      const rp=rng(hashi(p.seed,0x71A2,Math.floor(s.cx/600)));
      const gcol2=p.type==="jungle"?[64,132,66]:(p.type==="toxic"?[128,150,58]:[70,120,72]);
      const col=pcA(dim(gcol2,.68),.96);
      const n=6+Math.floor(rp()*10);
      for(let i=0;i<n;i++){
        const x=rp()*w, y=gy(x), Hh=h*(.035+rp()*rp()*.11);
        c.strokeStyle=col;c.lineWidth=Math.max(1,Hh*.055);
        const bend=(rp()-.5)*Hh*.34;
        c.beginPath();c.moveTo(x,y);
        c.quadraticCurveTo(x+bend*.5,y-Hh*.6,x+bend,y-Hh);c.stroke();
        c.fillStyle=col;
        if(rp()<.55){                      /* шляпка */
          c.beginPath();c.ellipse(x+bend,y-Hh,Hh*(.22+rp()*.20),Hh*.11,0,Math.PI,TAU);c.fill();
        }else{                             /* соцветие */
          c.beginPath();c.arc(x+bend,y-Hh,Hh*.085,0,TAU);c.fill();
        }
      }
    }
  }

  /* ── 8. мерило ──
     Человек или посадочный аппарат. Единственная фигура на карточке, и стоит
     она не для красоты: без неё гряда позади — и валун, и горный хребет
     одновременно. Рост взят от кадра, а не от мира: на снимке человек всегда
     примерно одной величины, как на всякой фотографии */
  {
    const x=w*.5, y=gy(w*.5), H0=h*.075;
    const dark=pcMix([8,10,16],T.pal[0],.30);
    /* тень под ногами: без неё фигура висит над слоями, а не стоит на них */
    c.fillStyle="rgba(0,0,0,.30)";
    c.beginPath();c.ellipse(x,y+H0*.03,H0*.34,H0*.075,0,0,TAU);c.fill();
    /* ── обвод со стороны звезды ──
       На каменистом мире ночью силуэт совпадал по светлоте с грунтом и пропадал
       совсем — а это единственное мерило кадра. Обвод сделан не отдельными
       линиями «по голове и хребту» (для аппарата такие линии просто не про
       него), а тем же силуэтом, залитым светлым и сдвинутым к звезде: приём
       работает для любой фигуры и не знает, что именно рисует. */
    const body=(dx,dy)=>{
      c.save();c.translate(dx,dy);
      if(s.m==="l"){
        const bw=H0*.90,bh=H0*.55;
        c.beginPath();
        c.moveTo(x-bw*.40,y-H0);c.lineTo(x+bw*.40,y-H0);
        c.lineTo(x+bw*.50,y-H0+bh);c.lineTo(x-bw*.50,y-H0+bh);c.closePath();c.fill();
        c.lineWidth=Math.max(1,H0*.085);
        for(const k of [-1,0,1]){
          c.beginPath();c.moveTo(x+k*bw*.33,y-H0+bh);c.lineTo(x+k*bw*.60,y);c.stroke();
        }
      }else{
        const hd=H0*.20;
        c.beginPath();c.arc(x,y-H0+hd,hd,0,TAU);c.fill();
        c.beginPath();
        c.moveTo(x-H0*.17,y-H0+hd*1.65);c.lineTo(x+H0*.17,y-H0+hd*1.65);
        c.lineTo(x+H0*.12,y-H0*.40);c.lineTo(x-H0*.12,y-H0*.40);c.closePath();c.fill();
        c.lineWidth=Math.max(1.1,H0*.095);
        c.beginPath();c.moveTo(x-H0*.05,y-H0*.42);c.lineTo(x-H0*.14,y);
        c.moveTo(x+H0*.05,y-H0*.42);c.lineTo(x+H0*.16,y);c.stroke();
      }
      c.restore();
    };
    const rim=pcA(pcMix(star,[255,255,255],.40),up?.55:.34);
    const off=Math.max(1.2,H0*.075);
    c.fillStyle=rim;c.strokeStyle=rim;
    body(sunX>x?off:-off,-off*.7);
    c.fillStyle=pcA(dark,.94);c.strokeStyle=pcA(dark,.94);
    body(0,0);
  }

  /* ── 9. погода ──
     Не частицы: на карточке величиной с ладонь дождь читается пеленой и
     наклоном, а не каплями */
  {
    const wx=weatherOf(p);
    if(wx&&wx.kind){
      const t=Math.sin(s.t/wx.per*TAU+wx.ph)*.5+.5;
      const k=clamp(lerp(wx.lo,wx.hi,Math.pow(t,1.7))*(wx.cap===undefined?1:wx.cap),0,1);
      if(k>.12){
        const WC={dust:[186,150,96],snow:[224,236,246],ash:[120,116,116],
          rain:[150,178,200],acid:[168,196,110],fog:[196,206,214],spore:[176,196,140]};
        const col=dim(WC[wx.kind]||[190,190,190],.6);
        c.fillStyle=pcA(col,Math.min(.40,k*.38));
        c.fillRect(0,0,w,h);
        if(wx.kind!=="fog"&&wx.kind!=="spore"){
          const rw=rng(hashi(p.seed,0x2A11,Math.floor(s.t/600)));
          c.strokeStyle=pcA(col,Math.min(.30,k*.30));
          c.lineWidth=1;
          const slant=(wx.kind==="snow")?.18:.42, len=h*(wx.kind==="snow"?.028:.080);
          c.beginPath();
          for(let i=0;i<Math.round(28+k*70);i++){
            const x=rw()*w*1.3-w*.15,y=rw()*h;
            c.moveTo(x,y);c.lineTo(x-len*slant,y+len);
          }
          c.stroke();
        }
      }
    }
  }

  pcPrint(c,s,w,h,p);
  c.restore();
  return true;
}

/* ══════════════ камера и альбом ══════════════
   Кнопка ФОТО живёт на пульте и появляется только там, где есть что снять:
   на грунте и на заходе. Правило интерфейса — «только то, что нужно прямо
   сейчас, висит над миром», и постоянная кнопка ФОТО была бы его нарушением,
   а заодно и обещанием, которое в полёте не выполнить.

   Альбом — двенадцать мест. Тринадцатый снимок вынимает самый старый и
   говорит об этом вслух: молча терять чужую память нельзя, а спрашивать
   разрешения на каждый кадр — значит превратить радость в диалог.

   В снимке лежит VER. Он ни на что не влияет при рисовании — он показан в
   подписи, когда движок с тех пор ушёл вперёд: «снято на 0.170.0». Старая
   карточка и правда выходит теперь чуть другой, и это не баг, а то, что
   делает со снимком время. */
const ALBUM_MAX=12;
function albumAll(){if(!Array.isArray(G.album))G.album=[];return G.album;}
/* Снимать можно там, где снимок читается местом, а не обоями: восемь режимов
   из M208. Стыковка, ангар, база, стол и налёт кнопки не получают — из них
   снимок был бы кадром интерфейса, а не мира. */
function postCanShoot(){
  if(!G.running)return false;
  /* открыт экран — снимать нечего: мир за ним, и игрок на него не смотрит.
     До M208 это выходило само (в системе камера не работала вовсе), а стоило
     открыть камеру в полёте — и ФОТО повисло над штабом, рынком и верфью.
     Пульт над экраном оставлен нарочно (M151a), но кнопка съёмки к нему не
     относится: она про мир, а мир сейчас закрыт */
  if(document.body.classList.contains("screen"))return false;
  const M=G.mode;
  if(M==="surface")return !!(G.surf&&G.surf.p);
  if(M==="landing")return !!(G.land&&G.land.p);
  if(M==="cave")return !!(G.cave&&G.surf&&G.surf.p);
  if(M==="dig")return !!(G.dig&&G.dig.p);
  if(M==="belt")return !!G.belt;
  if(M==="scoop")return !!(G.scoop&&G.scoop.p);
  if(M==="system")return !!(getSystem(G.sx,G.sy).planets||[]).length;
  return false;
}
function postTake(){
  const s=postSnap();
  if(!s)return null;
  const A=albumAll();
  let out=null;
  A.unshift(s);
  while(A.length>ALBUM_MAX)out=A.pop();
  /* затвор: один короткий щелчок с падением тона. Двух наложенных «ui» не
     выйдет — у него нет задержки, и они сливаются в писк */
  sfx("ui",{f:2400,to:820,d:.055,v:.22});
  logAdd("good","Снимок: "+postCaption(s)+(out?" · место в альбоме кончилось, самый старый вынут":""));
  tell("good","Снимок: "+postCaption(s),"СНИМОК\n"+postCaption(s).toUpperCase());
  if(tableOpenNow&&tableTab==="album")tableRender();
  return s;
}
/* кнопка на пульте: показать/скрыть. Зовётся из consoleTick (27j) */
function camBtnTick(){
  const b=document.getElementById("camBtn");
  if(!b)return;
  b.style.display=postCanShoot()?"":"none";
}
/* ── альбом на столе ──
   Карточки рисуются в свои холсты тем же художником, что и у получателя
   открытки: если альбом выглядит правильно, значит и чужая выглядит правильно.
   Тычок по карточке разворачивает её на всю ширину листа; развёрнутую можно
   ПЕРЕВЕРНУТЬ — и там оборот, печатный бланк (25i, M189). Мелкие карточки
   всегда лицом: пачка фотографий на столе лежит лицом вверх. */
let albumOpen=-1,albumBack=false;
function renderAlbum(box){
  const A=albumAll();
  box.innerHTML="";
  if(!A.length){
    tableRow(box,"dim","","альбом пуст: кнопка ФОТО на пульте — на грунте и на заходе");
    return;
  }
  const wrap=document.createElement("div");
  wrap.className="album";
  A.forEach((s,i)=>{
    const big=(albumOpen===i);
    const cell=document.createElement("div");
    cell.className="card"+(big?" big":"");
    const cw=big?Math.max(320,Math.min(760,box.clientWidth-24)):228;
    const ch=Math.round(cw*.625);
    if(big&&albumBack&&typeof renderCardBack==="function"){
      const host=document.createElement("div");
      host.className="side";host.style.width=cw+"px";host.style.minHeight=ch+"px";
      renderCardBack(host,s,()=>tableRender());
      cell.appendChild(host);
    }else{
      const cv=document.createElement("canvas");
      cv.width=Math.round(cw*2);cv.height=Math.round(ch*2);
      cv.style.width=cw+"px";cv.style.height=ch+"px";
      const cc=cv.getContext("2d");
      cc.scale(2,2);
      if(!drawPostcard(cc,s,cw,ch)){cc.fillStyle="#12161d";cc.fillRect(0,0,cw,ch);}
      cell.appendChild(cv);
    }
    if(big){
      const row=document.createElement("div");row.className="acts";
      const b=document.createElement("button");
      b.className="act sm";
      const signed=(typeof postSigned==="function")&&postSigned(s);
      /* кнопка называет действие, а не состояние: неподписанную карточку
         «подписывают», подписанную — «переворачивают» (правило интерфейса) */
      b.textContent=albumBack?"ЛИЦО":(signed?"ПЕРЕВЕРНУТЬ":"ПОДПИСАТЬ");
      b.onclick=e=>{e.stopPropagation();
        if(!albumBack&&!signed&&typeof postSign==="function")postSign(s);
        albumBack=!albumBack;tableRender();};
      row.appendChild(b);
      /* отправить можно только подписанную: пустая фотография без бланка —
         это снимок для себя, а не открытка кому-то (M190) */
      if(signed&&typeof mailOn==="function"&&mailOn()){
        const sd=document.createElement("button");
        sd.className="act sm gold";
        const left=mailLeft();
        sd.textContent=left>0?"ОТПРАВИТЬ":"СЕГОДНЯ ХВАТИТ";
        sd.disabled=left<=0;
        sd.onclick=e=>{e.stopPropagation();mailSend(s,null);};
        row.appendChild(sd);
      }
      cell.appendChild(row);
    }
    const cap=document.createElement("s");
    cap.textContent=postCaption(s)+(s.ver&&s.ver!==VER?" · снято на "+s.ver:"");
    cell.appendChild(cap);
    cell.onclick=()=>{albumOpen=big?-1:i;albumBack=false;tableRender();};
    wrap.appendChild(cell);
  });
  box.appendChild(wrap);
}
