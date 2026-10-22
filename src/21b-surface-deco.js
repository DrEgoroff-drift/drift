/* ══════════════ крупная форма на поверхности ══════════════ */
/* После M78 у четырёх поздних миров свой закон формы ГРУНТА, и порода наконец
   разная на ощупь. Но композиция кадра осталась одна на все двенадцать:
   горизонт по трети, ровный профиль, между достопримечательностями пусто.
   Тип различался цветом и фактурой, а не крупной формой — то есть с трёх
   шагов все планеты по-прежнему один силуэт.

   Здесь заполняется пропуск в масштабах. Их было два: валун (радиус до 22) и
   достопримечательность (150–900 в высоту, две-четыре на девять тысяч пути).
   Между ними — ничего, а именно этот средний масштаб и держит кадр: 40–220 px,
   то есть от груди астронавта до пятиэтажки. Мерило — человек 24 px, ровно
   как в отсеках базы.

   Правила те же, что у достопримечательностей:
   - формы растут КУРТИНАМИ, а не сплошным полем: сплошное поле — это вторая
     заливка, только дороже;
   - всё детерминировано от p.seed: планета всегда встречает тем же;
   - геометрия дробится через poiPath (20a-poi) — единый язык скола и
     выкрошенной кромки, а не второй способ рисовать камень;
   - никаких столкновений: обстановка фантомна, поэтому её нет в зоне взлёта
     и под постройками, где игрок ходит вплотную. */

/* высота дана в единицах мира ДО множителя sc (.7–1.5) */
const DECO_KINDS=[
  {k:"druse",  on:"crystal",w:1.0,h: 90},   // друза призм из грунта
  {k:"shard",  on:"crystal",w:.55,h:170},   // одиночная косая призма
  {k:"slab",   on:"metal",  w:1.0,h:110},   // отвалившаяся плита обшивки
  {k:"truss",  on:"metal",  w:.75,h:150},   // обломок фермы
  {k:"wall",   on:"ruin",   w:1.0,h: 95},   // фрагмент стены
  {k:"column", on:"ruin",   w:.8, h:130},   // колонна и упавшие барабаны
  {k:"canopy", on:"jungle", w:1.0,h:180},   // дерево полога
  {k:"frond",  on:"jungle", w:.85,h: 70}    // гигантский папоротник
];
/* сгенерировать и разложить; вызывается из startLanding после genPOI —
   рельеф к этому моменту уже выровнен под постройками, и формы садятся
   на итоговый профиль, а не на тот, который потом продавят */
function genDeco(tr,p){
  if(tr.deco)return tr.deco;
  tr.deco=[];
  if(p.type==="gas")return tr.deco;
  /* смешанный мир: если украшен только второй тип, форм меньше — руины на
     ледяной планете это гость, а не её собственное лицо */
  const lead=DECO_KINDS.some(k=>k.on===p.type);
  const pool=DECO_KINDS.filter(k=>k.on===p.type||(p.mix&&k.on===p.mix));
  if(!pool.length)return tr.deco;
  const share=lead?1:clamp((p.mw||.3)*1.8,.35,.9);
  const r=rng(p.seed^0x0DEC0);
  /* M352: автор просил две-четыре крупных формы на экран. Куртина на 1600
     единиц давала меньше одной; теперь куртина на ~1000, в ней 1–4 формы,
     а часть теряется на ровном месте и у площадки — выходит 2–4 в кадре. */
  const nCl=Math.max(3,Math.round(clamp(tr.W/1000,4,20)*share));
  for(let c=0;c<nCl;c++){
    /* куртина ставится внутри своей полосы: иначе половина планеты пустая,
       а вторая — свалка */
    const lo=tr.W*(c+.12)/nCl, hi=tr.W*(c+.88)/nCl;
    const cx=lo+r()*(hi-lo);
    if(Math.abs(cx-tr.padX)<520)continue;                  // зона взлёта
    if(tr.poi&&tr.poi.some(q=>Math.abs(q.x-cx)<q.h*.45+90))continue;
    const n=1+Math.floor(r()*4);
    for(let i=0;i<n;i++){
      let tot=0;for(const k of pool)tot+=k.w*(k.on===p.type?1:.7);
      let pick=r()*tot,K=pool[0];
      for(const k of pool){pick-=k.w*(k.on===p.type?1:.7);if(pick<=0){K=k;break;}}
      /* Место должно быть ровным. Первые кадры показали два разных провала от
         одной причины: на крутом склоне друза висела в воздухе (её призмы
         разъезжаются в стороны от точки замера), а в каньоне стена оказывалась
         НИЖЕ окружающей породы, то есть нарисованной внутри камня. Проверяем
         не наклон в точке, а разброс профиля на ширину самой формы.

         Место ищется несколькими попытками: с одной изрезанный мир (шероховатость
         под единицу — сплошные зубцы) остался бы вообще без крупной формы, а это
         как раз тот мир, которому она нужнее всего. */
      const hh=K.h*.9, ww=Math.max(30,hh*.45);
      let x=-1;
      for(let a=0;a<7&&x<0;a++){
        const cand=clamp(cx+(r()-.5)*(160+320*r()),60,tr.W-60);
        if(Math.abs(cand-tr.padX)<520)continue;         // разброс куртины — тоже не в зону взлёта
        const gy=groundAt(tr,cand);
        let mn=gy,mx=gy;
        for(let s=-3;s<=3;s++){
          const q=groundAt(tr,clamp(cand+s*ww*.5,10,tr.W-10));
          if(q<mn)mn=q;if(q>mx)mx=q;
        }
        if(mx-mn>Math.max(26,hh*.5))continue;
        let wide=gy;
        for(let s=-4;s<=4;s++)wide=Math.min(wide,groundAt(tr,clamp(cand+s*60,10,tr.W-10)));
        if(gy-wide>55)continue;                   // дно каньона: форму съест порода
        /* M352: соседи куртины не лезут друг в друга. Столовая гора в ±120 px
           накрывала сухое дерево в 19 px от себя, а у края мира clamp сажал
           две формы в одну точку. Зазор — от большей из двух высот. */
        if(tr.deco.some(d=>Math.abs(d.x-cand)<Math.max(hh,d.h)*.7+30))continue;
        x=cand;
      }
      if(x<0)continue;
      /* высота гуляет умеренно, а sc отвечает только за коренастость: два
         множителя на высоту разгоняли форму до размеров постройки, и средний
         масштаб снова пропадал */
      tr.deco.push({k:K.k,x,h:K.h*(.6+r()*.6),sc:.85+r()*.4,
        flip:r()<.5,seed:hashi(p.seed,c*17+i,0x0DEC)});
    }
  }
  /* Страховка: на изрезанном мире куртины могли не найти ни одного ровного
     места, и планета оставалась совсем без крупной формы — то есть ровно тем,
     против чего эта веха. Тогда ровные места ищутся по всему профилю, и берутся
     самые ровные из них. Пусто быть не может: тип должен читаться силуэтом. */
  /* M352: страховка стала добором. На изрезанных мирах (камень, вулкан,
     металл) куртины находили ровное место в одном случае из пяти, и планета
     жила тремя формами на всю длину — 0,2 на экран вместо просимых двух-четырёх.
     Теперь добираем до нормы по самым ровным местам профиля. */
  const want=Math.max(3,Math.round(tr.W/1280*2.4*share));
  if(tr.deco.length<want){
    const cand=[];
    for(let x=320;x<tr.W-320;x+=110){
      if(Math.abs(x-tr.padX)<520)continue;
      if(tr.poi&&tr.poi.some(q=>Math.abs(q.x-x)<q.h*.45+90))continue;
      if(tr.deco.some(d=>Math.abs(d.x-x)<420))continue;
      const gy=groundAt(tr,x);
      let mn=gy,mx=gy;
      for(let s=-3;s<=3;s++){
        const q=groundAt(tr,clamp(x+s*22,10,tr.W-10));
        if(q<mn)mn=q;if(q>mx)mx=q;
      }
      cand.push({x,sp:mx-mn});
    }
    cand.sort((a,b)=>a.sp-b.sp);
    const put=[];
    for(const q of cand){
      if(tr.deco.length>=want)break;
      if(put.some(v=>Math.abs(v-q.x)<380))continue;
      put.push(q.x);
      const K=pool[Math.floor(r()*pool.length)];
      tr.deco.push({k:K.k,x:q.x,h:K.h*(.6+r()*.5),sc:.85+r()*.4,
        flip:r()<.5,seed:hashi(p.seed,put.length,0x0DEF)});
    }
  }
  /* крупное рисуется последним, то есть стоит впереди мелкого — иначе
     призма в полтора роста прячется за крошкой у себя под боком */
  tr.deco.sort((a,b)=>a.h-b.h);
  return tr.deco;
}
/* смещение по грунту для части формы, отнесённой в сторону от точки замера:
   призмы друзы и упавшие барабаны разъезжаются на десятки пикселей, и на любом
   уклоне половина куста висела бы в воздухе */
function dgy(A,dx){
  const wx=A.d.x+(A.d.flip?-dx:dx);
  return groundAt(A.tr,clamp(wx,4,A.tr.W-4))-groundAt(A.tr,A.d.x);
}
/* цвет из палитры мира: k — множитель светлоты, a — прозрачность */
/* ── предмет в падающей тени (M434) ──
   Всё, что рисуется через dcol, темнеет одним множителем: drawDeco ставит его
   по доле тени в точке предмета (castLive, 19c1) и снимает после. Блики и
   дисперсия, заданные константами, остаются — они малы, и на них не держится
   масса предмета. Небо предмету остаётся: полная тень — это CAST_LIVE, не ноль */
let DECO_LIT=1;
function dcol(pal,i,k,a){
  const c=pal[Math.min(pal.length-1,i)];
  const s=(v)=>Math.round(clamp(v*k*DECO_LIT,0,255));
  return a===undefined?"rgb("+s(c[0])+","+s(c[1])+","+s(c[2])+")"
    :"rgba("+s(c[0])+","+s(c[1])+","+s(c[2])+","+a.toFixed(3)+")";
}
/* та же порода, что под ногами, внутри силуэта формы: без этого объект
   выглядит принесённым из другой игры (та же причина, что у валунов) */
function decoMat(tr,P,w,h,ox,oy){
  if(tr.mat)fillMaterial(tr.mat,ox,oy,.3,.24,P,{x:-w,y:-h,w:w*2,h:h*1.3});
}
function drawDeco(tr,camx,camy,p){
  const list=tr.deco;if(!list||!list.length)return;
  const pal=p.T.pal;
  const vis=[];
  for(const d of list){
    const x=d.x-camx, m=d.h*.9+60;
    if(x<-m||x>W+m)continue;
    const y=groundAt(tr,d.x)-camy;
    if(y<-d.h*1.4||y>H+40)continue;
    vis.push({d,x,y,w:d.h*.42*d.sc,hgt:d.h});
  }
  if(!vis.length)return;
  /* с видеокартой — выпечкой в слой стоящего (21bc); ниже — прежний 2D */
  if(decoGpu(tr,camx,camy,p,vis))return;
  /* тени — ДО клипа: они лежат на грунте, а клип как раз всё, что ниже линии
     грунта, и срезает (та же причина и тот же порядок, что у построек) */
  const live=(typeof castLive==="function");
  for(const q of vis){
    POI_SEED=q.d.seed;
    /* контактная тень — от прямого света: в падающей тени её нечем отбросить */
    const sh=live?castLive(tr,q.d.x):0;
    q.sh=sh;
    if(sh>.97)continue;
    ctx.save();ctx.globalAlpha=.72*(1-sh);
    groundShadow(q.x-q.w*.45,q.y+2,Math.max(6,q.w*1.5),Math.max(2.6,q.hgt*.055));
    ctx.restore();
  }
  /* Клип по профилю: форма стоит НА земле, значит ниже линии грунта её быть не
     может. Без клипа стена в неровном месте рисовалась поверх породы и
     читалась вкопанной в камень, а осыпь ложилась на склон соседнего холма.
     Запас 10 px оставлен подножию: занос и упавшие обломки уходят в грунт. */
  const i0=clamp(Math.floor((camx-40)/tr.step),0,tr.N-1);
  const i1=clamp(Math.ceil((camx+W+40)/tr.step),0,tr.N-1);
  const SKY=new Path2D();
  SKY.moveTo(i0*tr.step-camx,-4000);
  for(let i=i0;i<=i1;i++)SKY.lineTo(i*tr.step-camx,tr.h[i]-camy+10);
  SKY.lineTo(i1*tr.step-camx,-4000);
  SKY.closePath();
  ctx.save();ctx.clip(SKY);
  for(const q of vis){
    const d=q.d,x=q.x,y=q.y,w=q.w,hgt=q.hgt;
    POI_SEED=d.seed;POI_MAT=null;      // потёки и копоть по телу здесь не нужны
    ctx.save();ctx.translate(x,y);
    if(d.flip)ctx.scale(-1,1);
    const A={d,pal,p,tr,w,hgt,ox:camx-x,oy:camy-y};
    DECO_LIT=1-((typeof CAST_LIVE==="number")?CAST_LIVE:.5)*(q.sh||0);   /* в тени гребня (M434) */
    try{decoPaint(A);}finally{DECO_LIT=1;}
    ctx.restore();
  }
  ctx.restore();
}
/* ── кристаллический мир: призмы ──
   Кристалл отличается от камня не цветом, а тем, что у него ИЗЛОМ, а не склон:
   одно ребро повёрнуто к свету и горит, противоположное уходит в холод. То же
   правило, что в MAT_CHAR.facet (18a-material) — только в крупной форме. */
function prism(w,hgt,lean,pal,tr,ox,oy,i){
  const t=lean;
  const pts=[[-w,4],[-w*.72,-hgt*.55+t*hgt*.12],[-w*.3+t*w,-hgt],
             [w*.34+t*w,-hgt*.92],[w*.78,-hgt*.5+t*hgt*.1],[w,4]];
  const P=poiPath(pts,Math.min(2.4,w*.14));
  const g=ctx.createLinearGradient(0,-hgt,0,6);
  /* тело держится в средних ступенях палитры: на первых кадрах призмы шли
     почти белыми и читались снегом на склоне — той же ошибкой, что палитра
     кристаллического мира до M78 */
  g.addColorStop(0,dcol(pal,4,1));
  g.addColorStop(.4,dcol(pal,3,.9));
  g.addColorStop(1,dcol(pal,1,.7));
  ctx.fillStyle=g;ctx.fill(P);
  decoMat(tr,P,w,hgt,ox,oy);
  /* грань, повёрнутая к свету (солнце справа сверху), горит; левая тонет */
  ctx.save();ctx.clip(P);
  const gl=ctx.createLinearGradient(-w,0,w,0);
  gl.addColorStop(0,"rgba(0,0,0,.62)");
  gl.addColorStop(.5,"rgba(0,0,0,.06)");
  gl.addColorStop(1,"rgba(255,255,255,.2)");
  ctx.fillStyle=gl;ctx.fillRect(-w-2,-hgt-4,w*2+4,hgt+12);
  ctx.restore();
  /* дисперсия: светлое ребро уводит в холод или в тепло — этим прозрачная
     грань и отличается от белёной кромки брусчатки (ошибка M78) */
  const warm=h01(i,7,POI_SEED)<.5;
  ctx.strokeStyle=warm?"rgba(255,214,190,.55)":"rgba(190,226,255,.55)";
  ctx.lineWidth=Math.max(1,w*.06);
  ctx.beginPath();
  ctx.moveTo(-w*.3+t*w,-hgt);ctx.lineTo(w*.78,-hgt*.5+t*hgt*.1);ctx.lineTo(w,4);
  ctx.stroke();
  ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(-w*.3+t*w,-hgt);ctx.lineTo(-w*.72,-hgt*.55);ctx.lineTo(-w,4);
  ctx.stroke();
  /* внутренняя трещина: одна на призму, иначе кристалл выходит мятым */
  ctx.strokeStyle="rgba(255,255,255,.14)";
  ctx.beginPath();ctx.moveTo(-w*.1,-hgt*.85);
  ctx.lineTo(w*.2,-hgt*.45);ctx.lineTo(-w*.05,-hgt*.12);ctx.stroke();
  if(hgt>70)poiGlow(0,-hgt*.92,hgt*.3,"210,190,255",.10);
}

/* ── передний план ──
   Между игроком и стеклом ничего не стояло: дальний хребет, грунт, человек —
   и всё на одной глубине (G2). Глубина в 2D делается перекрытием: редкие
   тёмные силуэты у самого края кадра, идущие быстрее камеры, и без деталей —
   вблизи глаз не фокусируется, и силуэт работает значением, не фактурой.
   Цвет — тень неба этой планеты, поэтому он принадлежит кадру, а не наклейке. */
const FG_MAN=17;                  /* тот же человек, что и на всей поверхности */
/* цвета переднего плана: тело — тень неба, кромка — небо (amb — уже взятый цвет неба) */
function fgColors(p,amb){
  amb=amb||ambRGB(p);
  return {amb,
    c:"rgba("+Math.round(amb[0]*.42)+","+Math.round(amb[1]*.44)+","+Math.round(amb[2]*.50)+",",
    rim:"rgba("+Math.round(amb[0]*1.15+30)+","+Math.round(amb[1]*1.15+34)+","+Math.round(amb[2]*1.2+40)+","};
}
function drawForeground(tr,camx,camy,p){
  const C=fgColors(p);
  fgEach(tr,camx,camy,p,(s,h,sx,y,r,grass)=>{
    if(!grass){fgBoulder(s,sx,y,r,C);return;}
    ctx.lineCap="round";
    fgBlades(s,h,sx,y,(bx,y0,cx,cy,tx,ty,lw,ux,uy,vx,vy)=>{
      ctx.lineWidth=lw;ctx.strokeStyle=C.c+".88)";
      ctx.beginPath();ctx.moveTo(bx,y0);ctx.quadraticCurveTo(cx,cy,tx,ty);ctx.stroke();
      /* верхняя треть светлее: лезвие поворачивается к небу и ловит его */
      ctx.strokeStyle=C.rim+".30)";ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(ux,uy);ctx.quadraticCurveTo(vx,vy,tx,ty);ctx.stroke();
    });
  });
}
/* места переднего плана в кадре: fn(слот, хэш, x, y, размер, трава ли) — общий обход
   для 2D и двойника видеокарты (21e3) */
function fgEach(tr,camx,camy,p,fn){
  const K=1.24, SLOT=560;
  const fx=camx*K;
  const s0=Math.floor((fx-300)/SLOT), s1=Math.floor((fx+W+300)/SLOT);
  const hasAir=p.T.atm!=="отсутствует"&&["terran","ocean","jungle","toxic"].includes(p.type);   // трава — только где есть флора: на льду пучок читался чёрными палками
  for(let s=s0;s<=s1;s++){
    const h=hashi(s,p.seed,0xF06E);
    if((h&3)!==0)continue;                       // один силуэт на два экрана
    const wx=s*SLOT+((h>>>2)&511), sx=wx-fx;
    const gy=groundAt(tr,clamp(sx+camx,0,tr.W-1))-camy;
    const kind=(h>>>11)&3, r=48+((h>>>13)&63);
    const grass=kind>=2&&hasAir;
    /* ── трава переднего плана держится человеком, как и всё остальное ──
       Плейтест 30.08.2026: «трава какая-то на переднем плане огромная». Была:
       пучок в 178 пикселей при росте астронавта в 17 — растение в десять
       человеческих ростов, чёрное, поперёк всего кадра и ровно посередине, где
       стоит подсказка и идёт сам игрок. Глубина переднего плана здесь K=1.24,
       то есть предмет ближе камеры на четверть, — значит и крупнее он вправе
       быть на четверть, а не в десять раз.
       Теперь пучок ростом в два-четыре человека, корнями НИЖЕ кромки кадра
       (у объектива видно верхушки, а не всё растение) и только по краям кадра:
       середина принадлежит игроку и подсказке, а не декорации. */
    const y=grass?H-4:Math.max(gy+r*.8+40,H-r*.5);
    if(!grass&&(y-r>H+10||sx+r<-20||sx-r>W+20))continue;
    if(grass&&(sx<-40||sx>W+40))continue;
    /* Отбирать место по экранному x бессмысленно: пучок стоит в мире, а кадр
       едет — сегодня он сбоку, завтра посреди экрана. Значит ограничивать надо
       не место, а ВЫСОТУ: пучок живёт в нижней сотне пикселей кадра и не
       достаёт ни до человека, ни до подсказки, куда бы ни приехала камера. */
    fn(s,h,sx,y,r,grass);
  }
}
/* валун переднего плана с центром (sx,y): s — слот (сколы), C — fgColors */
function fgBoulder(s,sx,y,r,C){
  const c=C.c,rim=C.rim,amb=C.amb;
  /* валун: рваный круг, верх чуть светлее — ловит небо */
  const pts=[];
  for(let i=0;i<11;i++){
    const a=i/11*TAU, rr=r*(.78+((hashi(s,i,0xB0D)>>>4)&15)/15*.3);
    pts.push([sx+Math.cos(a)*rr*1.25, y+Math.sin(a)*rr*.8]);
  }
  const BP=new Path2D();
  BP.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)BP.lineTo(pts[i][0],pts[i][1]);
  BP.closePath();
  ctx.fillStyle=c+".94)";ctx.fill(BP);
  /* тело не плоское: книзу глуше — тем и отличается камень от вырезанной дыры */
  ctx.save();ctx.clip(BP);
  const bg2=ctx.createLinearGradient(0,y-r*.8,0,y+r*.9);
  bg2.addColorStop(0,"rgba("+amb.join(",")+",.14)");
  bg2.addColorStop(1,"rgba(0,0,0,.30)");
  ctx.fillStyle=bg2;ctx.fillRect(sx-r*1.4,y-r*.9,r*2.8,r*2);
  /* пара сколов: без них крупное пятно остаётся пятном */
  ctx.strokeStyle="rgba(0,0,0,.22)";ctx.lineWidth=1.6;
  for(let i=0;i<2;i++){
    const hj=hashi(s,i,0x5C0E);
    const ax=sx+((hj&63)-32)*.9, ay=y-r*.5+((hj>>>6)&31)*.4;
    ctx.beginPath();ctx.moveTo(ax,ay);
    ctx.lineTo(ax+((hj>>>11)&15)-7,ay+r*.55);ctx.stroke();
  }
  ctx.restore();
  /* КРОМКА: светлая дуга по верхнему краю силуэта. Ради неё и переделано */
  ctx.strokeStyle=rim+".55)";ctx.lineWidth=1.8;ctx.lineJoin="round";
  ctx.beginPath();
  let started=false;
  for(let i=0;i<pts.length;i++){
    const q=pts[i];
    if(q[1]<=y-r*.18){ if(started)ctx.lineTo(q[0],q[1]); else {ctx.moveTo(q[0],q[1]);started=true;} }
    else started=false;
  }
  ctx.stroke();
  ctx.fillStyle="rgba("+amb.join(",")+",.10)";
  ctx.beginPath();ctx.ellipse(sx-r*.2,y-r*.55,r*.7,r*.16,-.2,0,TAU);ctx.fill();
}
/* ── куст/трава: пучок лезвий, кланяется ветру ──
   У КАЖДОГО лезвия есть кромка, поймавшая небо, — тот же закон, ради
   которого переделан валун двумя десятками строк выше. Без неё пучок
   читался не растением, а чёрными палками поперёк кадра. */
function fgBlades(s,h,sx,y,fn){
  const bow=(WIND||0)*6+Math.sin(G.t*.02+s)*3;
  const n=10+((h>>>19)&7);              /* пучок, а не три нитки */
  for(let i=0;i<n;i++){
    const hh=hashi(s,i*7,0x6A55), bx=sx+((hh&63)-32)*1.5;
    const len=FG_MAN*(3.6+((hh>>>6)&15)/15*2.6);      /* три с половиной — шесть ростов, не больше сотни пикселей */
    const lean=((hh>>>10)&15)/15-.5;
    const tipx=bx+lean*len+bow, tipy=y-len;
    /* лезвие: комель, изгиб, кончик, толщина; светлая верхняя треть — от, изгиб */
    fn(bx,y+10,bx+lean*len*.4,y-len*.55,tipx,tipy,2.0+((hh>>>14)&3)*.6,
      bx+lean*len*.62+bow*.5,y-len*.62,bx+lean*len*.82+bow*.75,y-len*.82);
  }
}

/* ══════════════ залежь как выход породы (M169) ══════════════
   До этого прохода залежь была ТРЕМЯ ТРЕУГОЛЬНИКАМИ цвета ресурса и пульсирующим
   кружком вокруг — значок интерфейса, наклеенный на мир. Игрок видел не выход
   руды, а иконку, и на всех шести мирах она была одна и та же.

   Теперь у каждого сырья своя форма, и форма говорит, что это: кристаллы
   растут гранёными призмами со светлой гранью, лёд — торос с прозрачным краем,
   железо — ржавый останец с плитчатым сколом, кремний — россыпь острых
   осколков, органика — бугристая корка, титан — жила в камне, изотопы —
   тёплый натёк в трещине. Общее у всех: гнездо потревоженной земли внизу,
   тень, свет справа сверху (SUN_DIR) и осыпание по мере выработки. */
function depKind(res){
  if(res==="ice"||res==="icecrys")return "ice";
  if(res==="crystal")return "crystal";
  if(res==="iron")return "iron";
  if(res==="silicon")return "shards";
  if(res==="organics")return "crust";
  if(res==="titan"||res==="iridium")return "vein";
  if(res==="isotopes")return "seep";
  return "iron";
}
