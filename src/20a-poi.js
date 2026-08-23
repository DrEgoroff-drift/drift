/* ══════════════ точки интереса ══════════════ */
/* Одна огромная вещь на горизонте стоит полусотни мелких украшений: она даёт
   масштаб (астронавт 20 px против корпуса в 400) и повод идти именно туда.
   Поэтому на планету приходится 2–4 достопримечательности на 9000 единиц пути,
   между ними — сознательно пустой рельеф. Пустота здесь работает: без неё
   находка перестаёт быть находкой.

   Всё детерминировано от p.seed: одна и та же планета всегда встречает тем же.
   Под каждой достопримечательностью рельеф выравнивается — иначе постройка
   висит на зубцах и сразу читается как наклейка. */
const POI_KINDS=[
  {k:"wreck",   ru:"ОСТОВ КОРАБЛЯ",  on:["rocky","desert","ice","terran","toxic","volcanic","ocean","crystal","jungle","metal","ruin"],w:1.3,h:150,flat:420},
  {k:"temple",  ru:"ХРАМ",           on:["terran","toxic","desert","ocean","jungle","ruin"],         w:1.0,h:220,flat:360},
  {k:"elevator",ru:"КОСМИЧЕСКИЙ ЛИФТ",on:["terran","desert","toxic","ice","ocean","jungle","ruin","metal"],w:.7,h:900,flat:260},
  {k:"crystals",ru:"КРИСТАЛЛЫ",      on:["ice","rocky","toxic","volcanic","desert","crystal","metal"],w:1.2,h:280,flat:300},
  {k:"ring",    ru:"УСКОРИТЕЛЬ",     on:["rocky","ice","desert","volcanic","metal","ruin"],          w:.8, h:340,flat:520},
  {k:"anomaly", ru:"АНОМАЛИЯ",       on:["rocky","toxic","volcanic","ice","terran","desert","ocean","crystal","jungle","metal","ruin"],w:.6,h:300,flat:240},
  {k:"monolith",ru:"МОНОЛИТ",        on:["rocky","ice","desert","terran","ocean","toxic","volcanic","crystal","jungle","metal","ruin"],w:.9,h:260,flat:180},
  {k:"factory", ru:"ЗАВОД",          on:["volcanic","toxic","desert","rocky","metal","ruin"],        w:1.0,h:250,flat:440},
  {k:"portal",  ru:"ВРАТА",          on:["terran","toxic","ice","ocean","volcanic","crystal","jungle","ruin"],w:.5,h:230,flat:220},
  {k:"observ",  ru:"ОБСЕРВАТОРИЯ",   on:["rocky","ice","desert","terran","crystal","metal","ruin"],  w:.9, h:190,flat:300},
  /* зарубка — не памятник чужих, а межевой знак «Долгого Хода» (12q-lore):
     режется на любом твёрдом мире, встречается редко (вес мал) и стоит того,
     чтобы к ней идти, потому что называет адрес, а не отдаёт вещь */
  {k:"obelisk", ru:"ЗАРУБКА",        on:["rocky","ice","desert","terran","toxic","volcanic","ocean","crystal","jungle","metal","ruin"],w:.45,h:230,flat:260},
  /* мёртвая батарея (M111): такие же ставил «Долгий Ход», и стоят они там же,
     где стал бы строить игрок, — на твёрдом мире у обжитой системы. Она тоже
     отвечает куском отчёта: это не памятник, а брошенная казённая вещь */
  {k:"battery", ru:"БАТАРЕЯ",        on:["rocky","ice","desert","terran","toxic","volcanic","metal","ruin"],w:.5,h:190,flat:340}
];
/* сгенерировать и вписать в рельеф; вызывается один раз из startLanding */
function genPOI(tr,p){
  if(tr.poi)return tr.poi;
  tr.poi=[];
  if(p.type==="gas")return tr.poi;
  const r=rng(p.seed^0x9E37);
  /* смешанный мир принимает находки обоих родителей: руины на ледяной планете
     объясняются именно тем, что она наполовину руинная */
  const pool=POI_KINDS.filter(k=>k.on.indexOf(p.type)>=0||(p.mix&&k.on.indexOf(p.mix)>=0));
  if(!pool.length)return tr.poi;
  /* ритм: три-четыре на полосу, то есть примерно каждые два-три экрана,
     и не ближе девяти сотен друг к другу (хвост G12) */
  const n=3+Math.floor(r()*2);
  const put=[];
  for(let i=0;i<n;i++){
    /* мир делится на n полос, точка ставится внутри своей — так они не
       слипаются в одну кучу и не оставляют половину планеты пустой */
    const lo=tr.W*(i+.18)/n, hi=tr.W*(i+.82)/n;
    let x=lo+r()*(hi-lo);
    if(Math.abs(x-tr.padX)<700)x+=x<tr.padX?-700:700;          // не на посадочной площадке
    x=clamp(x,300,tr.W-300);
    if(put.some(q=>Math.abs(q-x)<900))continue;
    put.push(x);
    let tot=0;for(const k of pool)tot+=k.w;
    let pick=r()*tot,K=pool[0];
    for(const k of pool){pick-=k.w;if(pick<=0){K=k;break;}}
    const scale=(.8+r()*.55)*((typeof countyPoiK==="function")?countyPoiK():1);   /* большой уезд (11l): кладка крупнее */
    /* площадка под основание: середина плоская, к краям плавно возвращается
       к исходному профилю — стыка не видно */
    const half=Math.round(K.flat*scale/tr.step);
    const ci=Math.round(x/tr.step);
    const base=groundAt(tr,x);
    for(let j=Math.max(0,ci-half*2);j<Math.min(tr.N,ci+half*2);j++){
      const u=clamp((Math.abs(j-ci)-half*.45)/(half*1.15),0,1);
      tr.h[j]=lerp(base,tr.h[j],u*u*(3-2*u));
    }
    tr.poi.push({k:K.k,ru:K.ru,x,y:base,h:K.h*scale,sc:scale,seed:hashi(p.seed,i,0x50E1)});
  }
  /* валуны, попавшие внутрь постройки, убираем: они торчат сквозь стены */
  if(tr.rocks)for(let i=tr.rocks.length-1;i>=0;i--){
    const rk=tr.rocks[i];
    if(tr.poi.some(q=>Math.abs(q.x-rk.x)<q.h*.35))tr.rocks.splice(i,1);
  }
  return tr.poi;
}
/* мягкое свечение — единственный «пост-эффект», который тут нужен: он и
   выдаёт источник света, и отделяет постройку от фона на дальнем плане */
function poiGlow(x,y,rad,col,a){
  const g=ctx.createRadialGradient(x,y,0,x,y,rad);
  g.addColorStop(0,"rgba("+col+","+a.toFixed(3)+")");
  g.addColorStop(.45,"rgba("+col+","+(a*.28).toFixed(3)+")");
  g.addColorStop(1,"rgba("+col+",0)");
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,rad,0,TAU);ctx.fill();
}
/* Ровная грань в триста пикселей читается фигурой при любом цвете. Древним
   постройку делает не форма, а то, что с ней случилось: выкрошенная кромка,
   обвалившийся угол, потёки по стене, занос у основания. Поэтому всё тело
   строится через poiPoly, а он дробит каждую грань и уводит точки по нормали.
   Смещение детерминировано от seed — постройка не дрожит между кадрами. */
let POI_SEED=0, POI_MAT=null, POI_OX=0, POI_OY=0;
function poiPath(pts,amp){
  const P=new Path2D();
  P.moveTo(pts[0][0],pts[0][1]);
  let n=0;
  for(let i=1;i<=pts.length;i++){
    const a=pts[i-1],b=pts[i%pts.length];
    const ex=b[0]-a[0],ey=b[1]-a[1],el=Math.hypot(ex,ey)||1;
    /* длинную грань дробим чаще короткой: иначе у крупной постройки скол
       один на всю стену, а у мелкой — пила */
    const seg=clamp(Math.round(el/26),2,7);
    for(let s=1;s<=seg;s++){
      const u=s/seg;
      const d=(h01(n++,i,POI_SEED)-.5)*amp*(s===seg?.35:1);
      P.lineTo(a[0]+ex*u-ey/el*d, a[1]+ey*u+ex/el*d);
    }
  }
  P.closePath();
  return P;
}
function poiPoly(pts,fill,line,amp){
  const P=poiPath(pts,amp===undefined?2.2:amp);
  if(fill){ctx.fillStyle=fill;ctx.fill(P);}
  poiSkin(P);
  if(line){ctx.strokeStyle=line;ctx.lineWidth=1;ctx.stroke(P);}
  return P;
}
/* порода планеты, копоть сверху вниз и волосяные трещины — то, из-за чего
   стена перестаёт быть заливкой. Всё внутри клипа по силуэту самой постройки. */
function poiSkin(P){
  if(!POI_MAT)return;
  fillMaterial(POI_MAT,POI_OX,POI_OY,.34,.22,P);
  ctx.save();ctx.clip(P);
  /* потёки: вертикальные грязные полосы, шире книзу — так стекает вода и пыль */
  for(let i=0;i<7;i++){
    const sx=(h01(i,3,POI_SEED)-.5)*260;
    const w=2+h01(i,5,POI_SEED)*9;
    const g=ctx.createLinearGradient(0,-400,0,60);
    g.addColorStop(0,"rgba(0,0,0,0)");
    g.addColorStop(1,"rgba(0,0,0,"+(.10+h01(i,9,POI_SEED)*.16).toFixed(3)+")");
    ctx.fillStyle=g;ctx.fillRect(sx,-400,w,460);
  }
  /* трещины по телу: ломаные, а не прямые */
  ctx.strokeStyle="rgba(0,0,0,.34)";ctx.lineWidth=1;
  for(let i=0;i<5;i++){
    let cx=(h01(i,11,POI_SEED)-.5)*240, cy=-h01(i,13,POI_SEED)*300;
    ctx.beginPath();ctx.moveTo(cx,cy);
    for(let s=0;s<5;s++){
      cx+=(h01(i,s+17,POI_SEED)-.5)*26;cy+=8+h01(i,s+23,POI_SEED)*22;
      ctx.lineTo(cx,cy);
    }
    ctx.stroke();
  }
  ctx.restore();
}
/* осыпь и занос у подножия: без неё постройка приставлена к земле,
   а не стоит в ней миллион лет */
function poiDrift(w,pal){
  const c=pal[1];
  ctx.fillStyle="rgba("+c.map(v=>Math.round(v*.8)).join(",")+",.55)";
  ctx.beginPath();ctx.moveTo(-w,4);
  for(let i=0;i<=14;i++){
    const u=i/14, xx=-w+2*w*u;
    const hh=Math.sin(u*Math.PI)*(6+h01(i,29,POI_SEED)*11);
    ctx.lineTo(xx,4-hh);
  }
  ctx.lineTo(w,4);ctx.closePath();ctx.fill();
  /* отдельные обломки, отвалившиеся от тела */
  for(let i=0;i<7;i++){
    const bx=(h01(i,31,POI_SEED)-.5)*w*2.6, s=2+h01(i,37,POI_SEED)*6;
    ctx.fillStyle="rgba("+pal[2].map(v=>Math.round(v*.55)).join(",")+",.85)";
    ctx.beginPath();
    ctx.moveTo(bx-s,2);ctx.lineTo(bx-s*.3,2-s*.9);ctx.lineTo(bx+s*.8,2-s*.3);ctx.lineTo(bx+s*.5,2);
    ctx.closePath();ctx.fill();
  }
}
/* тело постройки красится градиентом «низ тёмный — верх подсвечен небом»:
   один этот приём отделяет силуэт от фона убедительнее любого контура */
function poiBody(hgt,dark,lite){
  const g=ctx.createLinearGradient(0,-hgt,0,0);
  g.addColorStop(0,lite);g.addColorStop(1,dark);
  return g;
}
function drawPOI(tr,camx,camy,p){
  const list=tr.poi;if(!list||!list.length)return;
  const pal=p.T.pal;
  /* всё, что ниже линии грунта, срезается: иначе упавший корпус лежит поверх
     земли, как наклейка, вместо того чтобы уходить в неё. Запас в 6 px оставлен
     контактным теням — без них постройка висит в воздухе. */
  /* Тени рисуем ДО клипа. Раньше groundShadow вызывался внутри самих построек,
     то есть уже под клипом «всё ниже линии грунта срезать» — от эллипса
     оставался тонкий обрезок сверху, и это читалось как странная полоска под
     объектом. Заодно пропорция: тень широкая и низкая (ry ≈ rx/7), а не
     блин на девять пикселей при двухстах в ширину. */
  for(const q of list){
    const x=q.x-camx, y=q.y-camy;
    if(x<-q.h*1.6-200||x>W+q.h*1.6+200)continue;
    const rx=q.h*(q.k==="wreck"?1.1:(q.k==="ring"?.9:.55));
    ctx.save();
    ctx.globalAlpha=.55;
    groundShadow(x+rx*.12,y+3,rx,Math.max(4,rx*.15));
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(0,0,W,H);
  const i0=clamp(Math.floor((camx-40)/tr.step),0,tr.N-1);
  const i1=clamp(Math.ceil((camx+W+40)/tr.step),0,tr.N-1);
  ctx.moveTo(i0*tr.step-camx,tr.h[i0]-camy+6);
  for(let i=i0;i<=i1;i++)ctx.lineTo(i*tr.step-camx,tr.h[i]-camy+6);
  ctx.lineTo(i1*tr.step-camx,H+10);ctx.lineTo(i0*tr.step-camx,H+10);
  ctx.closePath();
  ctx.clip("evenodd");
  for(const q of list){
    const x=q.x-camx, y=q.y-camy;
    /* запас по ширине большой: постройка видна задолго до того, как игрок
       на неё наступит — в этом весь смысл */
    if(x<-q.h*1.6-200||x>W+q.h*1.6+200)continue;
    ctx.save();ctx.translate(x,y);
    /* всё, что нужно «скину», кладём в общие переменные: тащить пять
       аргументов через десять функций рисования — только шум */
    POI_SEED=q.seed;POI_MAT=tr.mat;POI_OX=camx-x;POI_OY=camy-y;
    const rr=rng(q.seed);
    /* рукотворное красится своим сплавом, а не палитрой грунта: покрашенная
       биомом постройка сливается с холмами и перестаёт читаться как постройка.
       Доля биома оставлена (.22) ради цветовой связки с окружением. */
    const mix=(a,b)=>Math.round(lerp(a,b,.22));
    const dark="rgb("+[mix(28,pal[0][0]),mix(30,pal[0][1]),mix(36,pal[0][2])].join(",")+")";
    const lite="rgb("+[mix(150,pal[3][0]),mix(158,pal[3][1]),mix(168,pal[3][2])].join(",")+")";
    if(q.k==="wreck")drawWreck(q,rr,dark,lite,pal);
    else if(q.k==="temple")drawTemple(q,rr,dark,lite,pal);
    else if(q.k==="elevator")drawElevator(q,rr,dark,lite);
    else if(q.k==="crystals")drawCrystalForest(q,rr,pal);
    else if(q.k==="ring")drawAccel(q,rr,dark,lite);
    else if(q.k==="anomaly")drawAnomaly(q,rr,pal);
    else if(q.k==="monolith")drawMonolith(q,rr,dark,lite,pal);
    else if(q.k==="factory")drawFactory(q,rr,dark,lite,pal);
    else if(q.k==="portal")drawPortal(q,rr,pal);
    else if(q.k==="observ")drawObserv(q,rr,dark,lite,pal);
    else if(q.k==="obelisk")drawObelisk(q,rr,dark,lite,pal);
    else if(q.k==="battery")drawDeadBattery(q,rr,dark,lite,pal);
    ctx.restore();
  }
  ctx.restore();
}
/* Сами фигуры — в `20aa-poi-shapes`: развилка выше берёт их по ключу вида. */
function nearestPOI(tr,x){
  if(!tr.poi||!tr.poi.length)return null;
  let best=null,bd=1e9;
  for(const q of tr.poi){const d=Math.abs(q.x-x);if(d<bd){bd=d;best=q;}}
  return best;
}
/* ── ближайшая достопримечательность ──
   Радиус подхода считается от ширины самой формы, а не константой: к монолиту
   подходят вплотную, а космический лифт видно и слышно за сотню метров. */
function poiNear(S,tr){
  const list=(tr&&tr.poi)||[];
  for(const q of list){
    const r=Math.max(36,q.h*.22*(q.sc||1));
    if(Math.abs(q.x-S.x)<r)return q;
  }
  return null;
}
