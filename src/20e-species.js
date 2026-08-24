/* ══════════════ ВИД КАК ВЕЩЬ (M174) ══════════════
   Игра вела реестр видов, которых не существует. «Вид» был именем, а не
   сущностью: каждый признак растения и зверя бросался кубиком на КАЖДЫЙ
   экземпляр — два «одного вида» не совпадали ничем, а слово в имени
   («ветвистый», «светящийся») выбиралось независимо от того, что нарисовано.
   Игрок сканировал куст, получал «Новый вид: … светящийся» — и куст не светился.

   Здесь вид становится свойством ПЛАНЕТЫ, рядом с planetBiome(p): три-пять
   растений и два-четыре зверя на мир, у каждого закреплены форма, пропорции,
   цвет, диапазон роста, ветвление и повадка. Экземпляр — это ВИД + ВОЗРАСТ +
   МЕСТО, и больше ничего. Имя выводится из настоящей формы и настоящих флагов,
   поэтому соврать оно не может по построению.

   Три следствия, ради которых всё и делалось:
   • куртина читается как заросли одного растения, а не как каталог;
   • всходы, взрослые и старые отличаются телом, а не масштабом;
   • сухой гребень и мокрая ложбина растят один вид по-разному. */

/* ── слово по НАРИСОВАННОЙ форме, а не по броску ── */
const PLANT_FORM_K=["стеблевой","ветвистый","папоротниковый","стручковый","друзовый",
                    "колосовой","ковровый","грибной","спиральный","зонтичный",
                    "шаровой","ленточный"];
/* видовой рост (взрослый экземпляр в идеальном месте), по форме */
const PLANT_H_K=[[20,78],[20,78],[20,78],[20,78],[10,26],[20,78],[6,16],
                 [34,88],[40,100],[46,116],[26,62],[18,52]];
/* стеблевые формы: только у них есть ствол, ветви и шипы */
function plantStemForm(k){return k<=3||k===5;}

function plantTraitWord(sp){
  if(sp.glow)return "светящийся";
  if(sp.spiny)return "колючий";
  if(sp.kind===9||sp.kind===10)return "полупрозрачный";
  if(sp.kind===4)return "хрупкий";
  if(sp.kind===6||sp.kind===11)return "мясистый";
  if(sp.bloom)return "цветущий";
  return sp.wK>1.9?"жёсткий":"гибкий";
}

/* ── вид флоры ── */
function speciesPlant(r,p,bi,kind){
  const pal=p.T.pal;
  const base=pal[Math.min(pal.length-1,2+Math.floor(r()*2))];
  const hue=(r()*.5+bi.hueBias*.5)%1;
  /* цвет листа замешан на палитре мира (0.140.0) — но теперь он ВИДОВОЙ:
     соседние кусты одного вида различаются только тоном по хэшу места */
  const raw=[clamp(base[0]*.5+hue*150,20,255),clamp(base[1]*.6+120+hue*55,30,255),
             clamp(base[2]*.5+40+hue*90,20,255)];
  const gr=pal[Math.min(pal.length-1,3)];
  const leaf=[lerp(raw[0],gr[0],.28),lerp(raw[1],gr[1],.22),lerp(raw[2],gr[2],.28)];
  const stem=[leaf[0]*.5+20,leaf[1]*.45+26,leaf[2]*.45+22];
  const giant=r()<bi.giantChance;
  const hr=PLANT_H_K[kind]||PLANT_H_K[0];
  const sizeMul=bi.scale*(giant?1.7+r()*.9:.55+r()*.85);
  const stemF=plantStemForm(kind);
  /* колючесть — настоящий признак: на сухих и холодных мирах она частая,
     и её видно (шипы вдоль ствола), поэтому слово «колючий» не врёт */
  const dry=p.type==="desert"||p.type==="ice"||p.type==="rocky"||p.type==="toxic";
  const sp={
    kind,giant,
    h:(hr[0]+r()*(hr[1]-hr[0]))*sizeMul,
    /* разброс роста ВНУТРИ вида (проход 2): при ±10% заросль одного вида
       вставала шеренгой одинаковых зонтиков — обоями. Вид узнаётся формой, а
       не ростом, и популяция обязана быть разноростой */
    hVar:.15+r()*.20,
    segs:3+Math.floor(r()*4),
    /* число ветвей — признак вида, а не экземпляра */
    nb:kind===1?3+Math.floor(r()*4):(kind===2?5+Math.floor(r()*4):
       (kind===0?1+Math.floor(r()*2):(kind===3?2+Math.floor(r()*3):0))),
    branchLen:.16+r()*.30, branchW:1+r()*1.4,
    curl:(r()-.5)*.7,
    cap:.55+r()*.6, turns:2+r()*2.4, ribs:5+Math.floor(r()*4),
    balls:1+Math.floor(r()*3), ribbons:3+Math.floor(r()*5),
    pods:2+Math.floor(r()*4), facets:5+Math.floor(r()*4), blobs:3+Math.floor(r()*4),
    wK:1.4+r()*2.2,
    leaf,stem,
    glow:r()<.30, bloom:r()<.42, spiny:stemF&&r()<(dry?.62:.22),
    /* где виду хорошо: 0 — сухой гребень, 1 — мокрая ложбина */
    wet:r(),
    /* насколько тянется к звезде (M172 знает, где она стоит) */
    photo:.10+r()*.55,
    sway:kind===4?0:.008+r()*.02,
    share:.5+r()*1.6
  };
  return plantSpeciesName(sp,r);
}
function plantSpeciesName(sp,r){
  sp.name=genName(r)+" "+PLANT_FORM_K[sp.kind]+", "+plantTraitWord(sp);
  return sp;
}

function floraOf(p){
  if(p.flora)return p.flora;
  const bi=planetBiome(p);
  const r=rng(p.seed^0x5EED1);
  const n=3+Math.floor(r()*3);          // три-пять видов на мир
  const used=[],list=[];
  for(let i=0;i<n;i++){
    let kind=pickKindByBias(bi.kindBias,r),g=0;
    while(used.indexOf(kind)>=0&&g++<10)kind=pickKindByBias(bi.kindBias,r);
    used.push(kind);
    list.push(speciesPlant(r,p,bi,kind));
  }
  p.flora=list;
  return list;
}
/* Пещерная флора — своя. Раньше подземное растение брали с поверхности и
   молча включали ему свечение: имя вида при этом оставалось прежним, и один
   и тот же «вид» светился под землёй и не светился наверху. Теперь под землёй
   растут светящиеся виды планеты, а если таких нет — у пещеры два собственных,
   и в их именах свечение записано честно. */
function caveFloraOf(p){
  if(p.caveFlora)return p.caveFlora;
  const lit=floraOf(p).filter(s=>s.glow);
  if(lit.length){p.caveFlora=lit;return lit;}
  const bi=planetBiome(p),r=rng(p.seed^0xCA7E1);
  const list=[];
  for(let i=0;i<2;i++){
    const sp=speciesPlant(r,p,bi,pickKindByBias(bi.kindBias,r));
    sp.glow=true;
    list.push(plantSpeciesName(sp,r));
  }
  p.caveFlora=list;
  return list;
}
function pickShare(list,r){
  let s=0;for(const it of list)s+=it.share;
  let u=r()*s;
  for(const it of list){u-=it.share;if(u<=0)return it;}
  return list[list.length-1];
}

/* ── экземпляр: вид + возраст + место ──
   env={wet,hollow} — сырость полосы и насколько эта точка ниже соседних. */
function specimenPlant(r,sp,p,x,gy,env){
  const u=r();
  /* всходов немного, стариков ещё меньше: заросль состоит из взрослых */
  const age=u<.20?r()*.28:(u>.88?.82+r()*.18:.30+r()*.50);
  const moist=env?clamp(env.wet*.55+env.hollow*.45,0,1):.5;
  /* совпало с предпочтением вида — пышный, не совпало — угнетённый.
     Проход 2: вилка была .5…1.2 и на кадре не читалась вовсе — сухой гребень
     и мокрая ложбина растили одинаковые кустики. Разница должна быть видна
     без подписи, иначе её нет */
  const vig=clamp(.45+(1-Math.abs(sp.wet-moist))*.85,.45,1.3);
  /* Проход 3: разница между подростом и взрослым была девять процентов и
     тонула в разбросе вида — на листе «всход 22 · подрост 33 · взрослый 34».
     Кривая роста должна перекрывать разброс, иначе возраста нет */
  const grow=age<.30?(.16+age*2.0):(age>.82?1.03+(age-.82)*.6:.60+age*.52);
  const young=age<.30, old=age>.82;
  const h=Math.max(4,sp.h*(1+(r()-.5)*2*sp.hVar)*grow*(.45+vig*.62));
  const rock=p.T.pal[Math.min(p.T.pal.length-1,3)];
  /* сухое место — жёстче и ближе к породе; старость — глуше */
  const dry=clamp(1.15-vig,0,.55);
  const mix=(c)=>{
    let v=[lerp(c[0],rock[0],dry*.6),lerp(c[1],rock[1],dry*.6),lerp(c[2],rock[2],dry*.6)];
    if(old)v=[lerp(v[0],126,.18),lerp(v[1],116,.18),lerp(v[2],98,.18)];
    if(young)v=[lerp(v[0],220,.10),lerp(v[1],235,.12),lerp(v[2],200,.10)];
    return v;
  };
  const segs=Math.max(2,sp.segs-(young?1:0));
  const nb=young?Math.max(0,sp.nb-2):sp.nb;
  const branches=[];
  for(let i=0;i<nb;i++)
    branches.push({t:.25+r()*.7,ang:(r()<.5?-1:1)*(.5+r()*.9),
                   len:h*sp.branchLen*(.7+r()*.6),w:sp.branchW});
  /* сухостой: у старого экземпляра две-три ветви мертвы и голы — это
     единственное, по чему возраст читается силуэтом, а не размером, поэтому
     их должно быть видно (проход 2: одна короткая ветка терялась) */
  const dead=[];
  if(old)for(let i=0,n=2+(r()<.5?1:0);i<n;i++)
    dead.push({t:.30+r()*.55,ang:(r()<.5?-1:1)*(.7+r()*.8),len:h*sp.branchLen*(1.0+r()*.6)});
  /* густота кроны отвечает и месту, и возрасту: на сухом лист редкий */
  const cnt=(v,k)=>Math.max(1,Math.round(v*k*(.72+vig*.32)));
  return {x,y:gy,h,kind:sp.kind,segs,
    lean:(r()-.5)*.24+(old?(r()<.5?-1:1)*.10:0), curl:sp.curl,
    branches,dead,
    cap:sp.cap*(old?1.24:(young?.8:1)), turns:sp.turns, ribs:sp.ribs,
    balls:young?1:sp.balls, ribbons:cnt(sp.ribbons,young?.6:1),
    pods:cnt(sp.pods,young?.5:(old?1.2:1)),
    facets:cnt(sp.facets,young?.6:1), blobs:cnt(sp.blobs,young?.55:(old?1.15:1)),
    leaf:mix(sp.leaf), stem:mix(sp.stem),
    glow:sp.glow&&!young, bloom:sp.bloom&&!young, spiny:sp.spiny&&!young,
    photo:sp.photo, age, vig,
    /* пышность кроны: у форм 0–2 крона нарисована постоянными числами, и без
       этого множителя угнетённый экземпляр отличался только ростом */
    lush:.76+vig*.32,
    /* подстилка у комля: опад под старым и под пышным, ничего под всходом */
    litter:(old||vig>1.02)?1+Math.floor(r()*3):0,
    sway:sp.sway, phase:r()*TAU,
    w:Math.max(.9,sp.wK*(.5+grow*.62)*(1.28-vig*.32)),
    giant:sp.giant, sp, name:sp.name, scanned:false};
}

/* Опад у комля. Рисуется в координатах растения (0,0 — комель), поэтому
   зовётся из drawPlant внутри своего translate. Хэш вместо r(): лишний вызов
   общего потока сдвинул бы генерацию всей полосы. */
function plantLitter(pl,sc){
  const c=pl.leaf;
  ctx.fillStyle=sc?"rgba(127,230,216,.22)"
    :"rgba("+(c[0]*.58|0)+","+(c[1]*.5|0)+","+(c[2]*.42|0)+",.62)";
  for(let i=0;i<pl.litter;i++){
    const u=((hashi(Math.round(pl.x),i,0x11A7)>>>7)&255)/255;
    const v=((hashi(Math.round(pl.x),i,0x5C31)>>>9)&255)/255;
    const w=Math.max(2,pl.h*.075*(.7+v*.6));
    ctx.beginPath();
    ctx.ellipse((u-.5)*pl.h*.75,-w*.3,w,w*.4,(u-.5)*1.4,0,TAU);
    ctx.fill();
  }
}

/* ══════════════ фауна ══════════════ */
const BEAST_ALIEN_WORD={jelly:"медузоид",strider:"ходун",crystal:"кристаллид",
                        manta:"мантовый",shell:"панцирник"};
function beastFormWord(sp){
  if(sp.alien)return BEAST_ALIEN_WORD[sp.alien]||"чужак";
  if(sp.legs>=6)return "шестиног";
  if(sp.hop)return "прыгун";
  if(sp.shape===1)return "ползун";
  if(sp.shape===3)return "прямоход";
  if(sp.shape===4)return "членистый";
  return "круглыш";
}
function beastTraitWord(sp){
  if(sp.glow)return "светящийся";
  if(sp.alien==="shell"||sp.alien==="crystal")return "бронированный";
  if(sp.herd)return "стайный";
  /* «прыгун медлительный» — не ложь, но и не описание: скачущего зовут по
     скорости только если он и правда не скачет */
  if(sp.spd<.125&&!sp.hop)return "медлительный";
  if(sp.timid)return "пугливый";
  return "любопытный";
}
function speciesBeast(r,p,bi,fb){
  const pal=p.T.pal;
  const base=pal[2+Math.floor(r()*2)];
  const alien=r()<fb.alienShare?BEAST_ALIEN[pickKindByBias(fb.bias,r)]:null;
  const shape=Math.floor(r()*BEAST_SHAPES.length);
  /* контур тела — ВИДОВОЙ: два зверя одного вида одной выделки */
  const nv=7+Math.floor(r()*4),poly=[];
  for(let i=0;i<nv;i++){
    const a=i/nv*TAU;
    poly.push([Math.cos(a),Math.sin(a)*(.62+r()*.14)*(.85+r()*.3)]);
  }
  const sp={
    alien,shape,poly,
    bx:shape===1?1.55:(shape===2?.92:(shape===3?.8:1.15)),
    by:shape===1?.68:(shape===2?1.05:(shape===3?1.15:.85)),
    headSize:shape===3?.78:(shape===1?.46:.62),
    headX:shape===1?1.25:(shape===2?.75:.95),
    furTufts:6+Math.floor(r()*7),
    legs:shape===4?6+Math.floor(r()*2)*2:2+Math.floor(r()*3)*2,
    tail:r()<.6, crest:r()<.45, ears:r()<.5, spots:Math.floor(r()*4),
    glow:r()<.2, hop:r()<.45,
    herd:r()<.42, timid:r()<.5,
    spd:.09+r()*.1,
    body:furColor(r,base),
    eye:r()<.5?"#101820":"#f2f7ff",
    r0:(5+r()*7)*bi.scale*(r()<.10?2.0+r()*1.3:.7+r()*.8),
    rVar:.12+r()*.16,
    tent:4+Math.floor(r()*4), facets:5+Math.floor(r()*4), span:1.5+r()*1.2,
    hover:0, share:.6+r()*1.4
  };
  sp.hover=(alien==="jelly"||alien==="manta")?(14+r()*30):0;
  sp.name=genName(r)+" "+beastFormWord(sp)+", "+beastTraitWord(sp);
  return sp;
}
function faunaOf(p){
  if(p.fauna3)return p.fauna3;
  const bi=planetBiome(p),fb=beastBias(p);
  const r=rng(p.seed^0x8FA17);
  const n=2+Math.floor(r()*3);
  const list=[],used=[];
  for(let i=0;i<n;i++){
    /* архетипы не повторяются: две манты разного окраса на одной планете
       читались как один вид, перекрашенный дважды */
    let sp=speciesBeast(r,p,bi,fb),g=0;
    while(used.indexOf(sp.alien||("s"+sp.shape))>=0&&g++<8)sp=speciesBeast(r,p,bi,fb);
    used.push(sp.alien||("s"+sp.shape));
    list.push(sp);
  }
  p.fauna3=list;
  return list;
}
function specimenBeast(r,sp,x,gy){
  /* возраст зверя: молодой мельче и головастее, старый крупнее и медленнее */
  const u=r();
  const age=u<.22?r()*.30:(u>.90?.84+r()*.16:.32+r()*.5);
  const young=age<.30;
  const size=(.55+age*.55)*(1+(r()-.5)*2*sp.rVar);
  return {x,y:gy,vx:(r()<.5?-1:1)*(.06+r()*.12),face:1,
    r:Math.max(3,sp.r0*size),
    legs:sp.legs,tail:sp.tail&&!young,crest:sp.crest&&!young,ears:sp.ears,
    spots:sp.spots,glow:sp.glow,
    shape:sp.shape,poly:sp.poly,bx:sp.bx,by:sp.by,
    headSize:sp.headSize*(young?1.28:1),headX:sp.headX,furTufts:sp.furTufts,
    body:sp.body,eye:sp.eye,
    hop:sp.hop,phase:r()*TAU,spd:sp.spd*(young?1.2:(age>.84?.85:1)),
    alien:sp.alien,tent:sp.tent,facets:sp.facets,span:sp.span,
    hover:sp.hover?sp.hover*(young?.8:1):0,
    age,sp,name:sp.name,scanned:false,shy:0};
}

/* ══════════════ описан или нет ══════════════
   Реестр видов — реестр ВИДОВ: второй экземпляр уже описанного не открытие.
   Полные данные один раз, четверть — за повторное наблюдение; G.bio (образец
   для перка «био») считает только новые. */
/* тихая версия для мест со своим сообщением (образец в пещере и в шахте):
   возвращает, сколько данных начислить */
function bioMark(name,data){
  if(G.species&&G.species.has(name))return Math.max(1,Math.round(data*.25));
  G.species.add(name);G.bio=(G.bio|0)+1;
  return data;
}
function bioScan(o,data){
  o.scanned=true;
  const known=G.species&&G.species.has(o.name);
  if(known){
    const d=Math.max(1,Math.round(data*.25));
    G.data+=d;
    if(typeof tell==="function")
      tell("","Уже описан: "+o.name+" · +"+d+" данных","Уже описан\n"+o.name+"\n+"+d+" данных");
    return false;
  }
  G.species.add(o.name);G.data+=data;G.bio=(G.bio|0)+1;
  if(typeof tell==="function")
    tell("","Новый вид: "+o.name+" · +"+data+" данных","Новый вид\n"+o.name+"\n+"+data+" данных");
  return true;
}
