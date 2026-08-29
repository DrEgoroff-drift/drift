/* ══════════════ геология ══════════════ */
/* Пласты раньше были полосами палитры со случайным индексом: они не значили
   ничего и на разных планетах выглядели одинаково. Теперь у планеты есть
   разрез — стопка слоёв от почвы до основания, своя для каждого типа мира и
   своя для каждого seed внутри типа.

   Слои идут по рельефу, а не горизонтально: границы повторяют профиль со своим
   смещением и шумом. Это и читается как «наросло за миллионы лет» — ровные
   горизонтальные линии читаются как разлинованная бумага.

   Тот же разрез используется в шахте, поэтому чем глубже копает игрок, тем
   другая порода вокруг — и это та самая порода, которую он видел в срезе. */
const GEO_KIND={
  soil:   {ru:"почва",       t:[.62,.42,.24], v:0,   x:.5},
  sand:   {ru:"песок",       t:[.86,.72,.46], v:0,   x:.3},
  silt:   {ru:"ил",          t:[.42,.46,.40], v:0,   x:.4},
  ash:    {ru:"пепел",       t:[.28,.26,.28], v:0,   x:.6},
  snow:   {ru:"фирн",        t:[.94,.97,1.0], v:0,   x:.2},
  sed:    {ru:"осадок",      t:[.58,.50,.38], v:.25, x:.7},
  sandst: {ru:"песчаник",    t:[.74,.58,.38], v:.3,  x:.8},
  rock:   {ru:"порода",      t:[.46,.46,.50], v:.5,  x:1},
  basalt: {ru:"базальт",     t:[.20,.19,.22], v:.4,  x:1},
  ice:    {ru:"лёд",         t:[.66,.82,.94], v:.2,  x:.4},
  salt:   {ru:"соль",        t:[.88,.86,.80], v:.15, x:.5},
  crystal:{ru:"кристаллы",   t:[.55,.70,.95], v:1,   x:.6},
  metal:  {ru:"руда",        t:[.50,.54,.60], v:.9,  x:.9},
  magma:  {ru:"расплав",     t:[.75,.28,.12], v:.7,  x:.9},
  bedrock:{ru:"основание",   t:[.26,.26,.30], v:.2,  x:1}
};
/* какой мир из чего сложен: порядок сверху вниз, «|» — выбор по seed */
const GEO_TPL={
  terran:  [["soil"],["sed"],["sandst","sed"],["rock"],["metal","crystal"],["bedrock"]],
  ocean:   [["silt"],["sed"],["salt","sed"],["rock"],["crystal","metal"],["bedrock"]],
  desert:  [["sand"],["sandst"],["sandst","rock"],["salt","metal"],["bedrock"]],
  rocky:   [["ash","soil"],["rock"],["rock","basalt"],["metal"],["crystal","metal"],["bedrock"]],
  ice:     [["snow"],["ice"],["rock"],["crystal"],["bedrock"]],
  volcanic:[["ash"],["basalt"],["basalt","rock"],["metal"],["magma"],["bedrock"]],
  toxic:   [["silt","soil"],["sed"],["crystal","sed"],["metal"],["bedrock"]],
  crystal: [["sand","ash"],["crystal"],["crystal","rock"],["rock"],["crystal","metal"],["bedrock"]],
  jungle:  [["soil"],["soil","silt"],["sed"],["sed","sandst"],["sandst","rock"],["metal","crystal"],["bedrock"]],
  metal:   [["ash"],["metal"],["metal","rock"],["basalt"],["metal","crystal"],["bedrock"]],
  ruin:    [["sand","ash"],["sed"],["rock","sandst"],["metal","rock"],["crystal","metal"],["bedrock"]],
  gas:     [["ash"],["bedrock"]]
};
function geologyOf(p){
  if(p.geo)return p.geo;
  const r=rng((p.seed^0x6E01)>>>0);
  const tpl=wtab(p).geoTpl||GEO_TPL[p.type]||GEO_TPL.terran;
  const pal=p.T.pal;
  const out=[];
  let d=0;
  for(let i=0;i<tpl.length;i++){
    const opts=tpl[i], kind=opts[Math.floor(r()*opts.length)];
    const K=GEO_KIND[kind];
    /* толщина своя у каждой планеты: у одной почвы на полметра, у другой
       двадцать — по одному срезу видно, что это разные миры */
    const last=i===tpl.length-1;
    const th=last?4000:Math.round((i===0?26:70)*(.45+r()*1.5));
    /* цвет слоя — палитра планеты, прокрашенная характером породы: так лёд
       остаётся ледяным, а базальт базальтовым, но оба принадлежат этой планете */
    const base=pal[Math.min(pal.length-1,1+i%3)];
    /* .62 давало почти чистый характер породы, и разрез начинал спорить с небом
       по светлоте — половина хватает, чтобы слой опознавался, но остался
       частью этой планеты */
    const col=[0,1,2].map(j=>clamp(Math.round(lerp(base[j],K.t[j]*255,.5)*.86),0,255));
    out.push({kind,ru:K.ru,col,d0:d,th,vein:K.v,rough:K.x,seed:(r()*1e9)|0});
    d+=th;
  }
  p.geo=out;
  return out;
}
/* слой на заданной глубине — этим же пользуется шахта */
function geoAt(p,depth){
  const G0=geologyOf(p);
  for(let i=0;i<G0.length;i++)if(depth<G0[i].d0+G0[i].th)return G0[i];
  return G0[G0.length-1];
}
/* граница слоя не параллельна рельефу: свой шум на каждый слой, иначе стопка
   выглядит напечатанной под линейку */
function geoWob(L,wx){
  return (fbm1(wx*.0016,L.seed,3)-.5)*L.th*.75+(fbm1(wx*.011,L.seed+7,2)-.5)*7;
}
/* ── разрез в срезе грунта ── */
/* ── сброс (M169) ──
   Пласты шли ровными параллельными волнами через весь мир: разрез читался
   слоёным пирогом, одинаковым куда ни иди. В настоящей земле блоки разорваны
   сбросами — по трещине один блок опущен относительно соседнего, и вся пачка
   слоёв на нём уезжает вниз или вверх. Это самое читаемое, что вообще есть в
   разрезе, и стоит оно одной функции: смещение блока по его номеру.
   Смещение НЕ накапливается — иначе к краю мира пласты уехали бы за экран. */
const GEO_FAULT=1900;                              /* примерно раз в полтора экрана */
function geoFaultAt(wx,seed){
  const k=Math.floor(wx/GEO_FAULT);
  const h=hashi(k,seed|0,0x7A17);
  if((h&3)===0)return 0;                           /* не каждый блок сдвинут */
  return (((h>>>2)&63)/63-.5)*84;
}
/* граница блока со своим наклоном: у сброса плоскость не вертикальна */
function geoFaultX(k,seed){
  const h=hashi(k,seed|0,0x7A18);
  return k*GEO_FAULT+((h>>>4)&255)-128;
}
function drawStrata(tr,camx,camy,p,P){
  const G0=geologyOf(p);
  const fseed=(p.seed^0x5F17)>>>0;
  const i0=clamp(Math.floor((camx-40)/tr.step),0,tr.N-1);
  const i1=clamp(Math.ceil((camx+W+40)/tr.step),0,tr.N-1);
  /* ── пласты лежат ГОРИЗОНТАЛЬНО, рельеф их режет (П4; долг из Loose ends) ──
     Глубина слоя считалась от высоты грунта в каждой колонке — геология
     повторяла профиль рельефа, как обои, и обрыв читался не скалой, а
     полосатой стеной. Настоящий разрез: залегание почти горизонтально
     (датум — средняя высота мира; пятая часть профиля остаётся на лёгкую
     драпировку), и рельеф ОБНАЖАЕТ пласты — в долинах верхние срезаны,
     под пиками лежит вся колонна. Это и делает скалу скалой. */
  if(tr.hMin==null){let a=1e9,b=-1e9;for(let i=0;i<tr.N;i++){if(tr.h[i]<a)a=tr.h[i];if(tr.h[i]>b)b=tr.h[i];}tr.hMin=a;tr.hMax=b;}
  const datum=(tr.hMin+tr.hMax)*.5, FLAT=.8;
  const bedY=(hCol)=>lerp(hCol,datum,FLAT);
  ctx.save();ctx.clip(P);
  for(let k=0;k<G0.length;k++){
    const L=G0[k];
    const LP=new Path2D();
    let started=false;
    for(let i=i0;i<=i1;i++){
      const wx=i*tr.step;
      const y=bedY(tr.h[i])+L.d0+geoWob(L,wx)+geoFaultAt(wx,fseed)-camy;
      if(!started){LP.moveTo(wx-camx,y);started=true;}
      else LP.lineTo(wx-camx,y);
    }
    LP.lineTo(i1*tr.step-camx,H+20);
    LP.lineTo(i0*tr.step-camx,H+20);
    LP.closePath();
    ctx.fillStyle="rgb("+L.col.join(",")+")";
    ctx.fill(LP);
    /* ── контакт пластов ──
       Слой отличался от слоя только своим цветом плюс тёмная нить в .3 — и на
       мирах с тёмной сближенной палитрой (токсичный, джунглевый) разрез
       читался ровной заливкой: геология там была, но её не было ВИДНО.
       Контакт двух пород — это не линия, а пара: тень под верхним слоем и
       светлая кромка на нижнем, ровно как шов обшивки и стык плит в шахте.
       Пара работает на любой палитре, потому что держится на свете, а не на
       разнице тонов. */
    ctx.strokeStyle="rgba(0,0,0,.42)";ctx.lineWidth=2.2;ctx.stroke(LP);
    ctx.save();ctx.clip(LP);
    ctx.strokeStyle="rgba(255,246,226,.16)";ctx.lineWidth=1.1;
    ctx.save();ctx.translate(0,1.4);ctx.stroke(LP);ctx.restore();
    ctx.restore();
    /* жилы и вкрапления внутри слоя: короткие наклонные штрихи, детерминированы
       от координаты, поэтому не мигают при движении камеры */
    if(L.vein>.05){
      const mn=MINERAL[(L.seed>>>3)%MINERAL.length];
      ctx.save();ctx.clip(LP);
      const stepv=52;
      const x0=Math.floor((camx-stepv)/stepv)*stepv;
      for(let wx=x0;wx<camx+W+stepv;wx+=stepv){
        const hh=hashi(Math.floor(wx/stepv),L.seed,0x5EED);
        if((hh&255)/255>L.vein*.55)continue;
        const dy=L.d0+((hh>>>8)&63)/63*L.th*.8;
        const sx=wx-camx, sy=bedY(groundAt(tr,wx))+dy+geoWob(L,wx)-camy;
        const ln=8+((hh>>>14)&15), ang=((hh>>>18)&15)/15*1.1-.55;
        ctx.strokeStyle="rgba("+mn.join(",")+","+(.18+((hh>>>22)&7)/7*.3).toFixed(2)+")";
        ctx.lineWidth=1+((hh>>>25)&1);
        ctx.beginPath();
        ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.cos(ang)*ln,sy+Math.sin(ang)*ln);ctx.stroke();
        /* в кристаллическом слое вместо штриха — гранёное зерно */
        if(L.kind==="crystal"){
          ctx.fillStyle="rgba("+mn.join(",")+",.30)";
          ctx.beginPath();
          ctx.moveTo(sx,sy-3);ctx.lineTo(sx+2.6,sy);ctx.lineTo(sx,sy+3);ctx.lineTo(sx-2.6,sy);
          ctx.closePath();ctx.fill();
        }
      }
      ctx.restore();
    }
    /* расплав светится: единственный слой, который сам источник света */
    if(L.kind==="magma"){
      ctx.save();ctx.clip(LP);
      const gg=ctx.createLinearGradient(0,groundAt(tr,camx+W*.5)+L.d0-camy,0,H);
      gg.addColorStop(0,"rgba(255,120,40,.30)");
      gg.addColorStop(1,"rgba(255,60,10,.10)");
      ctx.fillStyle=gg;ctx.fillRect(0,0,W,H);
      ctx.restore();
    }
    /* ── линзы ──
       Внутри пласта — вложения другой породы: галечник в песке, ледяная линза,
       рудное тело. Без них слой остаётся ровной заливкой между двумя линиями,
       даже когда линии хороши (самокритика M169). */
    if(k>0&&L.th>26){
      const stepL=340, x0=Math.floor((camx-stepL)/stepL)*stepL;
      for(let wx=x0;wx<camx+W+stepL;wx+=stepL){
        const hh=hashi(Math.floor(wx/stepL),L.seed,0x1E45);
        if((hh&7)>2)continue;
        const cx2=wx+((hh>>>3)&255)-128;
        const cy2=groundAt(tr,cx2)+L.d0+geoWob(L,cx2)+geoFaultAt(cx2,fseed)+L.th*(.3+((hh>>>11)&7)/7*.4)-camy;
        const rw=18+((hh>>>14)&31), rh=6+((hh>>>19)&7);
        ctx.save();ctx.clip(LP);
        ctx.fillStyle="rgba(0,0,0,.22)";
        ctx.beginPath();ctx.ellipse(cx2-camx,cy2+1.5,rw,rh,0,0,TAU);ctx.fill();
        const lc=L.col.map((v,i2)=>clamp(v*(i2===2?1.22:1.12)+18,0,255)|0);
        ctx.fillStyle="rgb("+lc.join(",")+")";
        ctx.beginPath();ctx.ellipse(cx2-camx,cy2,rw,rh,0,0,TAU);ctx.fill();
        ctx.fillStyle="rgba(255,250,236,.10)";
        ctx.beginPath();ctx.ellipse(cx2-camx,cy2-rh*.35,rw*.7,rh*.4,0,0,TAU);ctx.fill();
        ctx.restore();
      }
    }
  }
  /* плоскости сбросов: тёмный шов от кромки вниз, со светлой губой на
     поднятой стороне — по нему сразу видно, что земля разорвана */
  {
    const k0=Math.floor((camx-GEO_FAULT)/GEO_FAULT), k1=Math.floor((camx+W)/GEO_FAULT)+1;
    for(let k=k0;k<=k1;k++){
      const fx=geoFaultX(k,fseed);
      const dy=geoFaultAt(fx+2,fseed)-geoFaultAt(fx-2,fseed);
      if(!dy)continue;
      const sx=fx-camx;
      if(sx<-40||sx>W+40)continue;
      const top=groundAt(tr,fx)-camy;
      const tilt=((hashi(k,fseed,0x7A19)>>>3)&15)/15*26-13;
      ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=2.2;
      ctx.beginPath();ctx.moveTo(sx,top);ctx.lineTo(sx+tilt,H+20);ctx.stroke();
      ctx.strokeStyle="rgba(255,246,226,.12)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(sx+(dy>0?2:-2),top);ctx.lineTo(sx+tilt+(dy>0?2:-2),H+20);ctx.stroke();
    }
  }
  ctx.restore();
}
