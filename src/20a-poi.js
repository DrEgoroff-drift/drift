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
  {k:"observ",  ru:"ОБСЕРВАТОРИЯ",   on:["rocky","ice","desert","terran","crystal","metal","ruin"],  w:.9, h:190,flat:300}
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
  const n=2+Math.floor(r()*3);
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
    const scale=.8+r()*.55;
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
    ctx.restore();
  }
  ctx.restore();
}
/* ── разбившийся мегакорабль: корпус вошёл в грунт под углом, хребет переломлен ── */
function drawWreck(q,r,dark,lite,pal){
  const L=q.h*2.6, tilt=(-.24-r()*.22);

  poiDrift(L*.36,pal);
  ctx.save();ctx.rotate(tilt);
  const bw=q.h*.34;
  poiPoly([[-L*.5,0],[-L*.36,-bw*.9],[L*.28,-bw],[L*.5,-bw*.42],[L*.46,bw*.2],[-L*.44,bw*.3]],
    poiBody(bw,dark,lite),"rgba(0,0,0,.5)");
  /* шпангоуты в проломе — по ним и читается размер */
  ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=2;
  for(let i=0;i<7;i++){
    const t=-.3+i*.11, px=L*t;
    ctx.beginPath();ctx.moveTo(px,-bw*.95);ctx.lineTo(px,bw*.25);ctx.stroke();
  }
  /* ряд иллюминаторов: часть ещё горит */
  for(let i=0;i<18;i++){
    const px=-L*.34+i*L*.042, py=-bw*.52;
    const on=((q.seed>>>(i%16))&3)===0;
    ctx.fillStyle=on?"rgba(255,214,150,.85)":"rgba(0,0,0,.55)";
    ctx.fillRect(px,py,3.2,2.2);
  }
  ctx.restore();
  /* оторванная секция чуть в стороне и обломки — след падения */
  ctx.save();ctx.translate(L*.62,-6);ctx.rotate(.5+r()*.4);
  poiPoly([[-q.h*.3,0],[-q.h*.2,-q.h*.24],[q.h*.24,-q.h*.2],[q.h*.3,0]],
    poiBody(q.h*.24,dark,lite),"rgba(0,0,0,.5)");
  ctx.restore();
  for(let i=0;i<9;i++){
    const px=(r()-.5)*L*1.5, s=2+r()*7;
    ctx.fillStyle="rgba(0,0,0,.4)";
    ctx.beginPath();ctx.ellipse(px,-s*.3,s,s*.4,0,0,TAU);ctx.fill();
  }
  /* аварийный маяк ещё бьёт — на нём глаз и останавливается */
  const bl=Math.pow(Math.max(0,Math.sin(G.t*.06)),8);
  if(bl>.02){
    const bx=-L*.42*Math.cos(tilt), by=-q.h*.42;
    poiGlow(bx,by,60,"255,90,70",.5*bl);
    ctx.fillStyle="rgba(255,190,170,"+(.9*bl).toFixed(2)+")";
    ctx.beginPath();ctx.arc(bx,by,2.2,0,TAU);ctx.fill();
  }
}
/* ── древний храм: ступенчатая пирамида, вход светится ── */
function drawTemple(q,r,dark,lite,pal){
  const w=q.h*1.5, steps=5+Math.floor(r()*3);

  /* верхние ступени осыпались неровно, и одна съехала вбок: целая пирамида
     выглядит построенной вчера */
  const broke=1+Math.floor(r()*2);
  for(let i=0;i<steps;i++){
    const t=i/steps, th=q.h/steps;
    let tw=w*(1-t*.72)*.5;
    const y0=-i*th;
    const top=i>=steps-broke;
    if(top)tw*=.55+r()*.3;
    const sh=(i===steps-broke-1)?(r()-.5)*w*.06:0;   // съехавший блок
    poiPoly([[-tw+sh,y0],[tw+sh,y0],[tw*.94+sh,y0-th*(top?.6:1)],[-tw*.94+sh,y0-th*(top?.8:1)]],
      poiBody(th,dark,lite),"rgba(0,0,0,.35)",3.2);
  }
  poiDrift(w*.55,pal);
  /* обелиски по бокам — вертикали, задающие ритм */
  for(const s of [-1,1]){
    ctx.save();ctx.translate(s*w*.62,0);
    poiPoly([[-5,0],[5,0],[3.5,-q.h*.6],[-3.5,-q.h*.6]],poiBody(q.h*.6,dark,lite),"rgba(0,0,0,.4)");
    ctx.restore();
  }
  /* вход: сначала тёмная глубина проёма, потом свет изнутри и только он мягкий.
     Резкий светлый прямоугольник с обводкой был самой плоской вещью в кадре —
     проём должен читаться дырой в толстой стене, а не наклейкой на ней. */
  const gw=w*.105, gh=q.h*.32;
  const jamb=poiPath([[-gw*1.5,0],[gw*1.5,0],[gw*1.25,-gh*1.06],[0,-gh*1.18],[-gw*1.25,-gh*1.06]],2.4);
  ctx.fillStyle="rgba(4,6,9,.94)";ctx.fill(jamb);
  ctx.save();ctx.clip(jamb);
  const g=ctx.createRadialGradient(0,-gh*.42,0,0,-gh*.42,gh*.9);
  g.addColorStop(0,"rgba(190,245,255,.62)");
  g.addColorStop(.45,"rgba(90,180,225,.24)");
  g.addColorStop(1,"rgba(10,20,34,0)");
  ctx.fillStyle=g;ctx.fillRect(-gw*2,-gh*1.3,gw*4,gh*1.4);
  ctx.restore();
  poiGlow(0,-gh*.45,gh*2.4,"120,220,255",.22);
  /* порог, вытертый до блеска — единственная светлая линия у входа */
  ctx.fillStyle="rgba(200,240,255,.16)";ctx.fillRect(-gw*1.4,-2.4,gw*2.8,2.4);
}
/* ── космический лифт: лента уходит выше кромки экрана ── */
function drawElevator(q,r,dark,lite){
  const bw=q.h*.06;

  poiPoly([[-bw*2.4,0],[bw*2.4,0],[bw*.9,-q.h*.16],[-bw*.9,-q.h*.16]],
    poiBody(q.h*.16,dark,lite),"rgba(0,0,0,.45)");
  /* сама лента: сужается кверху и тает в дымке — так читается высота */
  const g=ctx.createLinearGradient(0,0,0,-q.h);
  g.addColorStop(0,"rgba(190,215,230,.55)");
  g.addColorStop(.55,"rgba(190,215,230,.28)");
  g.addColorStop(1,"rgba(190,215,230,.04)");
  ctx.fillStyle=g;
  poiPoly([[-bw*.8,-q.h*.14],[bw*.8,-q.h*.14],[bw*.16,-q.h],[-bw*.16,-q.h]],g,null,0);
  /* кабина ползёт вверх — единственное, что здесь движется */
  const t=(G.t*.0016+((q.seed&255)/255))%1;
  const cy=-q.h*(.16+t*.8), cw=bw*.5*(1-t*.7);
  ctx.fillStyle="rgba(235,240,245,.7)";ctx.fillRect(-cw,cy,cw*2,cw*1.6);
  poiGlow(0,cy,bw*2.4,"200,230,255",.18);
  /* растяжки к грунту */
  ctx.strokeStyle="rgba(0,0,0,.22)";ctx.lineWidth=1.4;
  for(const s of [-1,1]){
    ctx.beginPath();ctx.moveTo(s*bw*.7,-q.h*.15);ctx.lineTo(s*bw*3.2,0);ctx.stroke();
  }
}
/* ── кристаллический лес: призмы разной высоты, мерцают вразнобой ── */
function drawCrystalForest(q,r,pal){
  const n=7+Math.floor(r()*7);
  const hue=pal[Math.min(4,pal.length-1)];
  const col=hue[0]+","+hue[1]+","+hue[2];
  const shards=[];
  for(let i=0;i<n;i++)shards.push({x:(r()-.5)*q.h*1.9,h:q.h*(.3+r()*.85),w:q.h*(.035+r()*.07),
    lean:(r()-.5)*.3,ph:r()*TAU});
  shards.sort((a,b)=>a.h-b.h);
  for(const s of shards){
    ctx.save();ctx.translate(s.x,0);ctx.rotate(s.lean);
    groundShadow(0,2,s.w*2.4,4);
    const g=ctx.createLinearGradient(0,0,0,-s.h);
    g.addColorStop(0,"rgba("+col+",.30)");
    g.addColorStop(.6,"rgba("+col+",.62)");
    g.addColorStop(1,"rgba(255,255,255,.85)");
    /* кристалл — единственное, у чего грань обязана остаться острой: скол
       по кромке превращает его в обычный камень */
    poiPoly([[-s.w,0],[s.w,0],[s.w*.35,-s.h*.82],[0,-s.h],[-s.w*.42,-s.h*.8]],g,"rgba(255,255,255,.28)",.35);
    /* блик: узкая грань, которая «загорается» на своей фазе */
    const tw=.35+.65*Math.pow(Math.max(0,Math.sin(G.t*.02+s.ph)),6);
    ctx.fillStyle="rgba(255,255,255,"+(.30*tw).toFixed(3)+")";
    poiPoly([[-s.w*.3,-s.h*.12],[0,-s.h*.1],[0,-s.h*.9],[-s.w*.18,-s.h*.86]],
      "rgba(255,255,255,"+(.30*tw).toFixed(3)+")",null);
    if(tw>.75)poiGlow(0,-s.h*.7,s.h*.5,col,.10*tw);
    ctx.restore();
  }
}
/* ── кольцевой ускоритель: дуга, наполовину ушедшая в грунт, по ней бежит импульс ── */
function drawAccel(q,r,dark,lite){
  const R=q.h*1.05;
  ctx.save();
  ctx.strokeStyle=dark;ctx.lineWidth=R*.1;
  ctx.beginPath();ctx.arc(0,-R*.34,R,0,TAU);ctx.stroke();
  ctx.strokeStyle="rgba(255,255,255,.10)";ctx.lineWidth=R*.045;
  ctx.beginPath();ctx.arc(0,-R*.34,R*1.02,Math.PI*1.15,Math.PI*1.9);ctx.stroke();
  /* опоры */
  for(const s of [-1,1]){
    poiPoly([[s*R*.62,0],[s*R*.95,0],[s*R*.86,-R*.5],[s*R*.7,-R*.5]],poiBody(R*.5,dark,lite),null);
  }
  /* сгусток по кольцу — движение, ради которого всё и стоит */
  const a=G.t*.012+((q.seed&63)/63)*TAU;
  const px=Math.cos(a)*R, py=-R*.34+Math.sin(a)*R;
  if(py<4){
    poiGlow(px,py,R*.34,"150,220,255",.5);
    ctx.fillStyle="rgba(230,248,255,.9)";
    ctx.beginPath();ctx.arc(px,py,R*.035,0,TAU);ctx.fill();
    /* хвост */
    ctx.strokeStyle="rgba(150,220,255,.35)";ctx.lineWidth=R*.05;
    ctx.beginPath();ctx.arc(0,-R*.34,R,a-.5,a);ctx.stroke();
  }
  ctx.restore();
}
/* ── гравитационная аномалия: тёмное ядро, вокруг висят обломки ── */
function drawAnomaly(q,r,pal){
  const R=q.h*.5, cy=-q.h*.62;
  /* линза: небо вокруг ядра гасится и слегка светлеет по кромке — дёшево,
     а читается именно как искривление, а не как чёрный кружок */
  const g=ctx.createRadialGradient(0,cy,R*.2,0,cy,R*1.9);
  g.addColorStop(0,"rgba(0,0,0,.92)");
  g.addColorStop(.42,"rgba(10,6,20,.55)");
  g.addColorStop(.72,"rgba(150,120,255,.14)");
  g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,cy,R*1.9,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(190,170,255,.22)";ctx.lineWidth=1.2;
  ctx.beginPath();ctx.ellipse(0,cy,R*1.25,R*.34,.35,0,TAU);ctx.stroke();
  const c0=pal[1];
  for(let i=0;i<11;i++){
    const a=G.t*(.004+ (i%4)*.0016)+i*1.9;
    const rr=R*(.75+ (i%5)*.26);
    const px=Math.cos(a)*rr, py=cy+Math.sin(a)*rr*.42;
    const s=2+ (i%4)*2.4;
    ctx.save();ctx.translate(px,py);ctx.rotate(a*1.7);
    ctx.fillStyle="rgb("+c0.map(v=>Math.round(v*.9+18)).join(",")+")";
    poiPoly([[-s,0],[-s*.3,-s*.8],[s*.9,-s*.2],[s*.4,s*.7]],ctx.fillStyle,"rgba(0,0,0,.4)");
    ctx.restore();
  }
}
/* ── монолит: ничего, кроме пропорции и кромочного света ── */
function drawMonolith(q,r,dark,lite,pal){
  const w=q.h*.19;

  /* у монолита кромка почти идеальна — в этом весь его характер: рядом с
     выветренным камнем безупречная грань и читается как чужая работа */
  poiPoly([[-w,0],[w,0],[w*.93,-q.h],[-w*.93,-q.h]],"rgba(6,6,10,.96)","rgba(0,0,0,.6)",.7);
  poiDrift(w*1.5,pal);
  /* тонкая световая кромка со стороны солнца (солнце в drawSkyLayer справа) */
  ctx.strokeStyle="rgba(210,235,255,.4)";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(w,0);ctx.lineTo(w*.93,-q.h);ctx.stroke();
  /* насечки на грани — оживают только вблизи */
  ctx.fillStyle="rgba(120,200,230,"+(.14+.10*Math.sin(G.t*.01)).toFixed(3)+")";
  for(let i=0;i<9;i++){
    const yy=-q.h*(.15+i*.085);
    ctx.fillRect(-w*.35,yy,w*.7*(.3+((q.seed>>>i)&3)/3*.7),1.6);
  }
  poiGlow(0,-q.h*.55,q.h*.7,"90,170,220",.06);
}
/* ── заброшенный завод: башни, трубы, баки; из одной трубы ещё идёт дым ── */
function drawFactory(q,r,dark,lite,pal){
  const w=q.h*1.4;

  poiDrift(w*.7,pal);
  /* ржавчина: завод стоял тут долго, и это единственное, что отличает его
     цвет от свежей постройки */
  const rust="rgba("+(90+Math.floor(r()*40))+",48,26,";
  /* башни: у каждой свой венец, рёбра и лестница — плоская плита читается
     ровно как плита, сколько её ни выветривай */
  const towers=4+Math.floor(r()*3);
  for(let i=0;i<towers;i++){
    const tx=-w*.5+(i+.5)/towers*w+(r()-.5)*w*.06;
    const th=q.h*(.4+r()*.6), tw=w*.05*(.7+r()*.9);
    const lean=(r()-.5)*.05;
    ctx.save();ctx.translate(tx,0);ctx.rotate(lean);
    poiPoly([[-tw,0],[tw,0],[tw*.82,-th],[-tw*.82,-th]],poiBody(th,dark,lite),"rgba(0,0,0,.45)",2.6);
    /* венец трубы шире тела — по нему силуэт и опознаётся как труба */
    poiPoly([[-tw*1.15,-th],[tw*1.15,-th],[tw*1.05,-th-tw*.5],[-tw*1.05,-th-tw*.5]],
      poiBody(tw*.5,dark,lite),"rgba(0,0,0,.5)",1.8);
    /* стяжные обручи */
    for(let k=1;k<5;k++){
      ctx.fillStyle="rgba(0,0,0,.30)";
      ctx.fillRect(-tw*.95,-th*k/5,tw*1.9,2.2);
      ctx.fillStyle=rust+".18)";
      ctx.fillRect(-tw*.95,-th*k/5+2.2,tw*1.9,1.4);
    }
    /* лестница на теневой стороне */
    if(tw>w*.045){
      ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(-tw*.5,-2);ctx.lineTo(-tw*.5,-th*.92);
      ctx.moveTo(-tw*.28,-2);ctx.lineTo(-tw*.28,-th*.92);ctx.stroke();
      for(let k=0;k<Math.floor(th/9);k++){
        ctx.beginPath();ctx.moveTo(-tw*.5,-6-k*9);ctx.lineTo(-tw*.28,-6-k*9);ctx.stroke();
      }
    }
    ctx.restore();
    if(i===1){   // единственная живая труба
      const sm=(G.t*.5)%400;
      for(let s=0;s<8;s++){
        const t=((sm+s*50)%400)/400;
        ctx.fillStyle="rgba(184,188,196,"+(.13*(1-t)).toFixed(3)+")";
        ctx.beginPath();ctx.arc(tx+Math.sin(t*4+q.seed)*t*30,-th-tw*.5-t*q.h*1.1,5+t*26,0,TAU);ctx.fill();
      }
    }
  }
  /* баки: цилиндр, а не круг. Идеальная окружность — самая заметная фигура
     в кадре, поэтому корпус собирается многоугольником с обручами и тенью. */
  for(let i=0;i<3;i++){
    const bx=-w*.40+r()*w*.8, br=q.h*(.09+r()*.07), bh=br*(1.1+r()*.7);
    ctx.save();ctx.translate(bx,0);
    const pts=[];
    const seg=14;
    for(let k=0;k<=seg;k++){const a=Math.PI+k/seg*Math.PI;pts.push([Math.cos(a)*br,-bh+Math.sin(a)*br*.34]);}
    pts.push([br,0]);pts.push([-br,0]);
    poiPoly(pts,poiBody(bh+br,dark,lite),"rgba(0,0,0,.45)",1.6);
    /* верхняя крышка отдельным эллипсом — она и даёт объём */
    ctx.fillStyle="rgba(255,255,255,.06)";
    ctx.beginPath();ctx.ellipse(0,-bh,br*.98,br*.32,0,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;ctx.stroke();
    for(let k=1;k<3;k++){
      ctx.fillStyle="rgba(0,0,0,.24)";ctx.fillRect(-br*.99,-bh*k/3,br*1.98,2);
    }
    /* потёк ржавчины из-под шва */
    ctx.fillStyle=rust+".22)";
    ctx.fillRect(-br*.35,-bh*.66,3.4,bh*.6);
    ctx.restore();
  }
  /* эстакада: сегменты на опорах с провисом, а не одна прямая через кадр */
  const py0=-q.h*.28;
  let px=-w*.52;
  ctx.strokeStyle=dark;
  while(px<w*.5){
    const seg=w*(.12+r()*.1), sag=4+r()*7;
    ctx.lineWidth=q.h*.02;
    ctx.beginPath();ctx.moveTo(px,py0+(r()-.5)*8);
    ctx.quadraticCurveTo(px+seg*.5,py0+sag,px+seg,py0+(r()-.5)*8);ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(px+seg,py0);ctx.lineTo(px+seg+(r()-.5)*6,0);ctx.stroke();
    ctx.strokeStyle=dark;
    px+=seg;
  }
  /* аварийный огонь на дальней башне: точка внимания в мёртвом объекте */
  const fl=.5+.5*Math.sin(G.t*.035);
  poiGlow(w*.28,-q.h*.7,26,"255,120,60",.22*fl);
}
/* ── врата: стоящее кольцо, внутри — не этот мир ── */
function drawPortal(q,r,pal){
  const R=q.h*.42, cy=-q.h*.52;
  poiDrift(R*.9,pal);
  poiGlow(0,cy,R*2.6,"170,120,255",.22);
  /* внутренность: концентрические кольца, медленно вращающиеся */
  ctx.save();
  ctx.beginPath();ctx.arc(0,cy,R*.9,0,TAU);ctx.clip();
  const g=ctx.createRadialGradient(0,cy,0,0,cy,R);
  g.addColorStop(0,"rgba(240,225,255,.85)");
  g.addColorStop(.5,"rgba(140,90,220,.5)");
  g.addColorStop(1,"rgba(20,8,40,.85)");
  ctx.fillStyle=g;ctx.fillRect(-R,cy-R,R*2,R*2);
  ctx.strokeStyle="rgba(255,255,255,.16)";ctx.lineWidth=1.4;
  for(let i=0;i<5;i++){
    const rr=R*(.16+i*.19), a=G.t*.006*(i%2?1:-1);
    ctx.beginPath();ctx.ellipse(0,cy,rr,rr*.9,a,0,TAU);ctx.stroke();
  }
  ctx.restore();
  /* сама рама: два незамкнутых полукольца, между ними разрыв */
  ctx.strokeStyle="rgba(28,24,36,.95)";ctx.lineWidth=R*.16;
  ctx.beginPath();ctx.arc(0,cy,R,-.35,Math.PI-.35);ctx.stroke();
  ctx.beginPath();ctx.arc(0,cy,R,Math.PI+.1,TAU-.1);ctx.stroke();
  ctx.strokeStyle="rgba(200,170,255,.35)";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(0,cy,R*1.08,0,TAU);ctx.stroke();

}
/* ── обсерватория: купол с прорезью и тарелка, которая медленно ведёт по небу ── */
function drawObserv(q,r,dark,lite,pal){
  const R=q.h*.55;

  poiDrift(R*1.3,pal);
  poiPoly([[-R*1.05,0],[R*1.05,0],[R*.9,-q.h*.32],[-R*.9,-q.h*.32]],poiBody(q.h*.32,dark,lite),"rgba(0,0,0,.4)");
  ctx.fillStyle=poiBody(R,dark,lite);
  ctx.beginPath();ctx.arc(0,-q.h*.32,R*.9,Math.PI,TAU);ctx.fill();
  ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=1;ctx.stroke();
  /* прорезь — тёмная щель, из неё бьёт слабый свет */
  ctx.fillStyle="rgba(8,10,16,.9)";
  ctx.fillRect(-R*.12,-q.h*.32-R*.9,R*.24,R*.9);
  poiGlow(0,-q.h*.32-R*.5,R*.9,"140,220,255",.14);
  /* тарелка на отдельной опоре ведёт цель */
  ctx.save();
  ctx.translate(R*1.5,0);
  poiPoly([[-4,0],[4,0],[2.5,-q.h*.4],[-2.5,-q.h*.4]],dark,null);
  ctx.translate(0,-q.h*.4);
  ctx.rotate(-1.1+Math.sin(G.t*.0026+(q.seed&31))*.5);
  ctx.beginPath();ctx.ellipse(0,0,R*.5,R*.2,0,0,TAU);
  ctx.fillStyle="rgba(180,195,205,.55)";ctx.fill();
  ctx.strokeStyle="rgba(0,0,0,.4)";ctx.stroke();
  ctx.restore();
}
/* ближайшая точка интереса — для навигатора сверху */
function nearestPOI(tr,x){
  if(!tr.poi||!tr.poi.length)return null;
  let best=null,bd=1e9;
  for(const q of tr.poi){const d=Math.abs(q.x-x);if(d<bd){bd=d;best=q;}}
  return best;
}
