/* ══════════════ текстуры планет ══════════════ */
function ramp(pal,t){
  t=clamp(t,0,.9999);
  const s=t*(pal.length-1),i=Math.floor(s),f=s-i;
  const a=pal[i],b=pal[Math.min(pal.length-1,i+1)];
  return [lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f)];
}
/* ══════════════ вращение ══════════════
   Планета висела в системе неподвижной картинкой: она летела по орбите, но
   сама не поворачивалась, и от этого выглядела наклейкой на чёрном, а не
   телом.

   Первый заход решал это перекидным календарём: текстура пеклась шестнадцать
   раз с разной долготой, и кадры сменялись по часам. На планете размером с
   ноготь этого не видно, а на весь экран — это слайд-шоу, и заодно мыло:
   сторона кадра была зажата в 144 пикселя, потому что платить за неё
   приходилось шестнадцать раз, а растягивалась она на пол-экрана. Край диска
   при таком растяжении шёл лесенкой.

   Теперь печётся ОДНА развёртка поверхности — долгота поперёк, синус широты
   вдоль, — и наматывается на шар прямо в кадре, вертикальными полосками.
   Суть приёма: у шара, видимого снаружи, высота точки на экране И ЕСТЬ синус
   её широты, поэтому по вертикали развёртку тянуть не надо — достаточно
   посчитать долготу каждой полоски, один раз на размер. Вращение после этого
   становится сдвигом вдоль развёртки: непрерывным, без ступеней.

   Платим один раз вместо шестнадцати — и на сэкономленное берём развёртку
   вчетверо шире, отчего планета вблизи наконец перестаёт быть мыльной.

   Сутки нарочно длинные: планета должна поворачиваться так, чтобы игрок
   заметил это, только задержавшись взглядом. */
const PLANET_SPIN=16;
/* Два уровня подробности. Мелкой планете в системном виде хватает узкой
   развёртки, и печь ей широкую — значит подарить игроку задержку на ровном
   месте; та, к которой он подлетел вплотную, наоборот, обязана быть резкой.
   Уровень выбирается по экранному радиусу и только повышается. */
function planetPeriod(p){
  /* у каждой планеты свои сутки и своё направление: и то и другое от seed.
     Газовые крутятся заметно быстрее — у них и в природе сутки короче */
  return (p.type==="gas"?52000:120000)*(.7+((p.seed>>>7)&15)/15*.9);
}
/* угол поворота в радианах — непрерывный */
function planetSpin(p){
  const per=planetPeriod(p),dir=((p.seed>>>3)&1)?1:-1;
  const t=(typeof G!=="undefined"&&G.t?G.t*16.7:Date.now());
  return t/per*TAU*dir;
}
/* прежний номер кадра остаётся ради тех, кто просил у планеты именно его
   (посадка берёт отсюда угол) — считается из того же непрерывного поворота */
function planetSpinFrame(p){
  return ((Math.floor(planetSpin(p)/TAU*PLANET_SPIN)%PLANET_SPIN)+PLANET_SPIN)%PLANET_SPIN;
}
/* ── развёртка поверхности ──
   Горизонталь — долгота на полный оборот, вертикаль — синус широты (именно
   синус: так строка развёртки совпадает со строкой экрана и растягивать по
   вертикали ничего не нужно). Света здесь нет: он не вращается.

   Считается она НЕ ЦЕЛИКОМ ЗА РАЗ. Причина простая и неустранимая: `fbm2`
   стоит около двух микросекунд, у обитаемой планеты к нему добавляется
   влажность, а подробная развёртка — это сотня тысяч точек. Разом это кадр,
   застывший на четверть секунды. Раньше беды не было только потому, что
   текстура была крошечной — 72–144 пикселя на весь диск, отчего планета вблизи
   и выглядела мылом с рваным краем.

   Поэтому уровней три, и выпечка прерывается ПО ПИКСЕЛЯМ, а не по строкам:
   одна строка подробной развёртки сама по себе дороже всего кадрового бюджета,
   так что резать надо мельче. Пока не готов ни один уровень, планета рисуется
   гладким шаром своего цвета — со светом и ободком, то есть уже телом, а не
   дыркой; детали проступают за доли секунды. Дальше уровень поднимается по
   мере приближения, и старая развёртка работает, пока не готова новая. */
const PLANET_RES=[64,128,256];
const STRIP_MS=2.5;          // сколько миллисекунд кадра отдаём фоновой выпечке
const STRIP_CHUNK=192;       // через сколько точек сверяться с часами
/* Одна очередь на всех: две планеты, допекающиеся одновременно, съедят вдвое
   больше кадра, а увидит игрок всё равно только ту, к которой летит. */
let STRIP_JOB=null;
/* планеты, которым нужна развёртка получше */
let STRIP_PEND=[];
function planetStripStart(p,lvl){
  const R=PLANET_RES[lvl],SW=R*2,SH=R;
  const cn=document.createElement("canvas");cn.width=SW;cn.height=SH;
  const cx=cn.getContext("2d");
  const pal=p.T.pal,gas=p.type==="gas";
  const life=!gas&&planetHasLife(p);
  const bi=life?planetBiome(p):null, hb=bi?bi.hueBias:0;
  return {p,lvl,cn,cx,img:cx.createImageData(SW,SH),SW,SH,x:0,y:-1,
    pal,gas,life,np:pal.length-1,sd:p.seed,rough:p.rough,
    lf0:40+hb*90, lf1:96+hb*70, lf2:46+hb*60,
    lat:0,polar:0,gasLat:0,gasY1:0,gasY2:0,rockY:0};
}
/* строка меняет только то, что зависит от широты */
function planetStripSeekRow(J,y){
  const sv=(y+.5)/J.SH*2-1, lat=Math.asin(clamp(sv,-1,1));
  J.y=y;J.x=0;J.lat=lat;
  J.polar=Math.pow(Math.abs(lat)/1.5708,3.2)*.55;   // шапки: от широты, не от долготы
  J.gasLat=lat*9;J.gasY1=lat*7+3;J.gasY2=lat*3;J.rockY=lat*2.4+11;
}
/* кусок строки: от J.x и не дальше конца — возвращает, сколько точек посчитал */
function planetStripChunk(J,n){
  const d=J.img.data,SW=J.SW,p=J.p,pal=J.pal,np=J.np,gas=J.gas,life=J.life;
  const sd=J.sd,rough=J.rough,lat=J.lat,polar=J.polar;
  const BLEND=.14;
  const end=Math.min(SW,J.x+n);
  for(let x=J.x;x<end;x++){
    const f=(x+.5)/SW, o=(J.y*SW+x)*4;
    /* Шум по долготе не периодичен, поэтому левый и правый край развёртки не
       сходятся — на шаре это читается вертикальным швом посреди диска. Лечим
       перекрёстным затуханием: у правого края считаем точку второй раз, взяв
       поле оборотом раньше, и к самому краю остаётся только оно. */
    const blend=f>1-BLEND, w=blend?(f-(1-BLEND))/BLEND:0, s=blend?w*w*(3-2*w):0;
    let cr=0,cg=0,cb=0;
    for(let pass=0;pass<(blend?2:1);pass++){
      const lon=(f-pass)*TAU;
      let v;
      if(gas){
        v=fbm2(lon*.7+9,J.gasY1,sd,4);
        v=clamp(v*.6+.5*(.5+.5*Math.sin(J.gasLat+fbm2(lon*1.6,J.gasY2,sd+5,3)*4)),0,1);
      }else{
        v=fbm2(lon*2.4+11,J.rockY,sd,5);
        v=clamp((v-.5)*(1+rough*.9)+.5,0,1);
        v=clamp(v+polar,0,1);
      }
      const t=clamp(v,0,.9999)*np,i=t|0,ft=t-i;
      const a=pal[i],b=pal[i<np?i+1:np];
      let r=a[0]+(b[0]-a[0])*ft, g=a[1]+(b[1]-a[1])*ft, bl=a[2]+(b[2]-a[2])*ft;
      /* ── биом виден с орбиты ──
         Планета с жизнью красилась ровно так же, как мёртвая: тот же градиент
         палитры по высоте. Зелень существовала только под ногами, и глобус о
         ней не знал. Теперь там, где влажно и не слишком высоко, поверхность
         уходит в цвет местной листвы, а на гребнях и в сухих поясах остаётся
         камень. Это то самое пятно, в которое игрок целится при заходе. */
      if(life){
        const wet=planetWetAt(p,lon,lat);
        const lush=clamp((wet-.42)*2.4,0,1)*clamp(1-(v-.55)*2.6,0,1);
        if(lush>.01){
          const k=lush*.72;
          r+=(J.lf0-r)*k; g+=(J.lf1-g)*k; bl+=(J.lf2-bl)*k;
        }
      }
      if(pass===0){cr=r;cg=g;cb=bl;}
      else{cr+=(r-cr)*s;cg+=(g-cg)*s;cb+=(bl-cb)*s;}
    }
    d[o]=cr;d[o+1]=cg;d[o+2]=cb;d[o+3]=255;
  }
  const did=end-J.x;J.x=end;
  return did;
}
/* допекаем по кадрам — зовётся из planetDraw, ест не больше STRIP_MS.
   Очередь честная и с приоритетом «кто отстал сильнее»: сначала ВСЕ планеты
   получают грубую развёртку, и только потом кто-то — подробную. Без этого
   правила первая же планета в списке забирала пекарню себе и дорезалась до
   максимума, пока остальные три висели гладкими шарами. Уровень растёт по
   одному за раз — планета на глазах делается резче, а не прыгает через ступень. */
function planetStripTick(){
  if(!STRIP_JOB){
    let best=null;
    for(const q of STRIP_PEND)
      if(q.stripLvl<(q.stripWant|0)&&(!best||q.stripLvl<best.stripLvl))best=q;
    if(STRIP_PEND.length)STRIP_PEND=STRIP_PEND.filter(q=>q.stripLvl<(q.stripWant|0));
    if(!best)return;
    STRIP_JOB=planetStripStart(best,Math.min(best.stripWant|0,best.stripLvl+1));
  }
  const J=STRIP_JOB;
  const t0=performance.now();
  for(;;){
    if(J.y<0||J.x>=J.SW){
      if(J.y+1>=J.SH)break;
      planetStripSeekRow(J,J.y+1);
    }
    planetStripChunk(J,STRIP_CHUNK);
    if(performance.now()-t0>STRIP_MS)return;
  }
  J.cx.putImageData(J.img,0,0);
  J.p.strip=J.cn;J.p.stripLvl=J.lvl;
  STRIP_JOB=null;
}
/* Возвращает лучшее из готового — или null, если пока нет ничего: планета в
   этом случае рисуется гладким шаром, а не пропадает. Заказ на уровень
   получше просто встаёт в очередь и кадру ничего не стоит. */
function planetStrip(p,lvl){
  if(p.stripLvl==null)p.stripLvl=-1;
  if(p.stripLvl<lvl){
    if((p.stripWant|0)<lvl)p.stripWant=lvl;
    if(STRIP_PEND.indexOf(p)<0)STRIP_PEND.push(p);
  }
  return p.strip||null;
}
/* ── свет: две накладки поверх шара ──
   Тень — чёрный с переменной прозрачностью, ободок — добавляемое свечение по
   краю. Формула та же, что была в текстуре; разница в том, что накладки не
   вращаются, поэтому пекутся один раз на планету. Край диска сглаживается по
   альфе — прежняя резкая обрезка и давала ту самую лесенку на большой планете. */
function planetLight(p,lvl){
  if(p.lite&&p.liteLvl>=lvl)return p.lite;
  const S=PLANET_RES[lvl];
  const sh=document.createElement("canvas");sh.width=sh.height=S;
  const rim=document.createElement("canvas");rim.width=rim.height=S;
  const gs=sh.getContext("2d"),gr=rim.getContext("2d");
  const is=gs.createImageData(S,S),ir=gr.createImageData(S,S);
  const ds=is.data,dr=ir.data,gas=p.type==="gas";
  for(let py=0;py<S;py++)for(let px=0;px<S;px++){
    const o=(py*S+px)*4;
    const nx=(px+.5)/S*2-1,ny=(py+.5)/S*2-1,r2=nx*nx+ny*ny;
    if(r2>1){ds[o+3]=0;dr[o+3]=0;continue;}
    const nz=Math.sqrt(1-r2);
    const light=clamp(nx*-.52+ny*-.42+nz*.74,0,1);
    const k=.16+1.02*Math.pow(light,.85);
    ds[o]=0;ds[o+1]=0;ds[o+2]=0;
    ds[o+3]=clamp((1-k)*255,0,255);
    /* множитель яркости доходит до 1.18 — то есть свет ещё и подсвечивает.
       Накладка тенью так не умеет, поэтому избыток уходит в добавляемый слой,
       иначе дневная сторона выходит бледнее, чем была */
    const up=clamp(k-1,0,1)*.9;
    const r=Math.pow(1-nz,4)*(gas?.5:.34);
    dr[o]=clamp(130*r+235*up,0,255);
    dr[o+1]=clamp(180*r+240*up,0,255);
    dr[o+2]=clamp(210*r+245*up,0,255);
    dr[o+3]=255*clamp(r+up,0,1);
    const edge=clamp((1-Math.sqrt(r2))*S*.5,0,1);
    ds[o+3]*=edge;dr[o+3]*=edge;
  }
  gs.putImageData(is,0,0);gr.putImageData(ir,0,0);
  p.lite={sh,rim};p.liteLvl=lvl;return p.lite;
}
/* ── полоски ──
   Долгота левого края полоски и её ширина в пикселях развёртки зависят только
   от экранного радиуса, поэтому таблица считается один раз на размер. Радиус
   округляется: при плавном зуме иначе она пересчитывалась бы каждый кадр. */
function planetCols(r,sw){
  const key=Math.max(2,Math.round(r));
  if(planetCols.key===key&&planetCols.sw===sw)return planetCols.v;
  const step=r>150?3:2,cols=[];
  for(let sx=-r;sx<r;sx+=step){
    const w=Math.min(step,r-sx);
    const n1=clamp(sx/r,-1,1),n2=clamp((sx+w)/r,-1,1);
    const l1=Math.asin(n1),l2=Math.asin(n2);
    cols.push({dx:sx,dw:w,u:l1/TAU,su:Math.max(1,(l2-l1)/TAU*sw)});
  }
  planetCols.key=key;planetCols.sw=sw;planetCols.v=cols;return cols;
}
/* ── шар в кадре ──
   Полоски — единственный известный способ намотать развёртку на шар в canvas
   2D, но их много: до двух сотен `drawImage` на планету. Само по себе это
   работает, и всё же это пересборка одной и той же картинки шестьдесят раз в
   секунду. */
function planetPaint(p,x,y,r,S,L,turn){
  const d=r*2;
  if(S){
    const sw=S.width,sh=S.height;
    ctx.save();
    ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.clip();
    const cols=planetCols(r,sw);
    for(let i=0;i<cols.length;i++){
      const c=cols[i];
      const u=((c.u+turn)%1+1)%1*sw;
      /* полоска может перейти через шов развёртки — тогда рисуем в два приёма */
      const over=u+c.su-sw;
      if(over>0){
        const part=(c.su-over)/c.su;
        ctx.drawImage(S,u,0,c.su-over,sh, x+c.dx,y-r,c.dw*part,d);
        ctx.drawImage(S,0,0,over,sh, x+c.dx+c.dw*part,y-r,c.dw*(1-part),d);
      }else{
        ctx.drawImage(S,u,0,c.su,sh, x+c.dx,y-r,c.dw,d);
      }
    }
    ctx.restore();
  }else{
    /* развёртка ещё печётся — планета всё равно обязана быть телом, а не
       дыркой в звёздах: гладкий шар своего цвета, поверх тот же свет */
    const pal=p.T.pal,c=pal[Math.min(pal.length-1,pal.length>>1)];
    ctx.fillStyle="rgb("+(c[0]|0)+","+(c[1]|0)+","+(c[2]|0)+")";
    ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
  }
  ctx.drawImage(L.sh,x-r,y-r,d,d);   // тень
  const op=ctx.globalCompositeOperation;
  ctx.globalCompositeOperation="lighter";
  ctx.drawImage(L.rim,x-r,y-r,d,d);  // ободок атмосферы
  ctx.globalCompositeOperation=op;
}
/* ── планета в кадре ──
   Собранный шар кладётся в свой холст и дальше только КЛАДЁТСЯ на экран — один
   вызов вместо двух сотен. Пересобирать его надо гораздо реже, чем кажется, и
   вот почему:

   · экранный радиус планеты равен мировому, умноженному на зум, и от того,
     подлетает игрок или нет, не зависит вовсе — в системном виде камера
     смотрит сверху. Зум же меняется только от руки: кнопки, колесо, щипок.
     Между этими нажатиями радиус постоянен;
   · поворот непрерывен, но медленен: сутки здесь 52–120 секунд, то есть один
     пиксель развёртки проходит мимо края за 100–230 мс. Пересобирать шар чаще,
     чем сдвинулся хотя бы один пиксель текстуры, — значит рисовать ровно ту же
     картинку заново.

   Отсюда правило: пересобираем, когда поворот сдвинулся на три четверти
   пикселя развёртки, когда сменился радиус или когда доспела подробная
   развёртка. На практике это раз в десяток кадров вместо каждого. Вращение при
   этом остаётся непрерывным — шаг мельче пикселя, его нечем увидеть. */
function planetDraw(p,x,y,r){
  /* Уровень — по экранному размеру: развёртка должна быть хотя бы вдвое шире
     видимого полушария, иначе диск мылится. Свет считается отдельно и дёшево
     (в нём нет шума), поэтому его берём под тот уровень, который реально
     рисуется, — он и вычерчивает край диска. */
  const lvl=r>150?2:(r>60?1:0);
  const S=planetStrip(p,lvl);
  planetStripTick();
  const L=planetLight(p,S?Math.min(lvl,p.stripLvl):0);
  const turn=planetSpin(p)/TAU;
  const rr=Math.ceil(r)+1, side=rr*2;
  /* очень мелкую планету кэшировать незачем: холст на неё стоит дороже, чем
     сама отрисовка, а таких в системе большинство */
  if(r<14){planetPaint(p,x,y,r,S,L,turn);return;}
  const step=S?.75/S.width:1;         // три четверти пикселя развёртки, в долях оборота
  if(!p.disc||p.discSide!==side){
    p.disc=document.createElement("canvas");
    p.disc.width=p.disc.height=side;
    p.discCx=p.disc.getContext("2d");
    p.discTurn=null;p.discSide=side;
  }
  if(p.discTurn===null||p.discLvl!==p.stripLvl||Math.abs(turn-p.discTurn)>=step){
    p.discCx.clearRect(0,0,side,side);
    const prev=ctx;ctx=p.discCx;
    planetPaint(p,rr,rr,r,S,L,turn);
    ctx=prev;
    p.discTurn=turn;p.discLvl=p.stripLvl;
  }
  /* кладём по целым пикселям: доля пикселя заставила бы холст пересэмплировать
     весь диск заново и мылила бы кромку — а так это точная копия. Полпикселя
     смещения на теле, которое и так плывёт по орбите, увидеть нечем. */
  ctx.drawImage(p.disc,Math.round(x-rr),Math.round(y-rr));
}

/* ══════════════ рельеф ══════════════ */
/* ══════════════ рельеф ══════════════ */
/* профиль собирается из нескольких независимых форм: пологие холмы, острые
   хребты, столовые плато, дюны, кратеры с валом и врезанные каньоны. Вес
   каждой формы — от типа планеты и её seed, поэтому две пустынные планеты
   выглядят по-разному, но обе остаются пустынными. */
const RELIEF_MIX={
  terran:  {hill:1,  ridge:.55, mesa:.15, dune:0,   crater:.2,  canyon:.4},
  ocean:   {hill:1,  ridge:.15, mesa:.05, dune:.2,  crater:.1,  canyon:.15},
  desert:  {hill:.7, ridge:.3,  mesa:.85, dune:1,   crater:.35, canyon:.7},
  rocky:   {hill:.8, ridge:1,   mesa:.5,  dune:0,   crater:1,   canyon:.5},
  ice:     {hill:.9, ridge:.7,  mesa:.35, dune:.35, crater:.45, canyon:.6},
  volcanic:{hill:.8, ridge:1,   mesa:.25, dune:0,   crater:.9,  canyon:.85},
  toxic:   {hill:1,  ridge:.45, mesa:.4,  dune:.25, crater:.3,  canyon:.55},
  /* кристаллический — частокол острых гряд почти без пологого; джунгли —
     мягкие валы с врезанными руслами; металлический — битый кратерами шар
     без осадочных плато; руинный — ступени плато, как разрушенные террасы */
  crystal: {hill:.35,ridge:1.2, mesa:.6,  dune:0,   crater:.5,  canyon:.4},
  jungle:  {hill:1.1,ridge:.4,  mesa:.2,  dune:0,   crater:.1,  canyon:.9},
  metal:   {hill:.6, ridge:.8,  mesa:.3,  dune:0,   crater:1.3, canyon:.35},
  /* mesa 1.1 давало ровное плато во весь кадр — руинный мир выходил столом.
     Ступени остались, но теперь между ними есть подъёмы и врезы */
  ruin:    {hill:1.0,ridge:.35, mesa:.7,  dune:.4,  crater:.5,  canyon:.85},
  gas:     {hill:1,  ridge:0,   mesa:0,   dune:0,   crater:0,   canyon:0}
};
/* ══════════════ где сел — то и видел ══════════════
   Глобус в системе и местность под ногами считались из одного seed, но двумя
   независимыми шумами: на карте тёмное пятно, а сядешь — плато, и наоборот.
   Планета была двумя разными планетами, склеенными названием.

   Связывает их одно число — ДОЛГОТА захода. Корабль подходит с какой-то
   стороны; эта сторона, с поправкой на текущий поворот планеты, и есть точка,
   куда он сядет. Дальше рельеф берёт СВОЮ низкую частоту из того же поля
   `fbm2`, по которому напечатана текстура: где на глобусе светлее — там
   возвышенность, где темнее — низина. Мелкие формы (гряды, дюны, кратеры)
   остаются локальными: с орбиты их и не должно быть видно.

   Ширина полосы намеренно мала: девять тысяч точек ландшафта — это узкий
   клин долготы, иначе на одном экране уместилась бы четверть планеты. */
const LAND_ARC=0.42;                  // сколько радиан долготы покрывает мир
/* ── влажность ──
   Второе поле планеты, независимое от высоты: где сыро, там жизнь. Оно нужно
   сразу в двух местах и потому живёт здесь, а не в биоме: с орбиты по нему
   красятся зелёные пятна, а на грунте по нему же считается, сколько вокруг
   зарослей. Увидел с высоты тёмно-зелёное пятно, сел в него — и стоишь в
   чаще: планета перестала быть двумя картинками с одним именем. */
function planetWetAt(p,lon,lat){
  const w=fbm2(lon*1.7+41,lat*1.7+41,(p.seed^0x5EA1)>>>0,4);
  /* к полюсам суше — там всё вымерзло, у экватора влажнее */
  return clamp(w*1.15-Math.pow(Math.abs(lat)/1.5708,1.6)*.45,0,1);
}
function planetHasLife(p){
  return !!(p.T&&(p.T.atm.indexOf("пригодна")>=0||p.type==="toxic"||p.type==="jungle"||
                  p.mix==="toxic"||p.mix==="jungle"));
}
function planetHeightAt(p,lon,lat){
  /* та же формула, что печатает развёртку (`planetStrip`), — иначе связь
     держалась бы на честном слове, а не на общем поле */
  let v=fbm2(lon*2.4+11,lat*2.4+11,p.seed,5);
  v=clamp((v-.5)*(1+p.rough*.9)+.5,0,1);
  v=clamp(v+Math.pow(Math.abs(lat)/1.5708,3.2)*.55,0,1);
  return v;
}
function genTerrain(p,lon0){
  const N=1500,step=6,base=900,h=new Float32Array(N);
  const r=rng(p.seed^0x5f3b);
  /* долгота захода: приходит из системы, а если генерим вне полёта (стенд,
     превью) — берём от seed, чтобы картинка была стабильной */
  const L0=(lon0==null)?((p.seed%628)/100):lon0;
  const LAT=((p.seed>>>9)%100)/100*0.7-0.35;   // широта полосы: не всегда экватор
  const M=wtab(p).relief||RELIEF_MIX[p.type]||RELIEF_MIX.terran;
  /* амплитуда по набору породы (хвост G1): дюны и раскисшие берега ниже,
     ледяные плиты и лавовая корка выше — рельеф принадлежит материалу */
  const AK={dune:.72,sludge:.6,frost:1.15,crust:1.3,facet:1.2,plate:1.1,rubble:.9};
  const amp=(60+p.rough*300)*(AK[(typeof MAT_CHAR!=="undefined"&&MAT_CHAR[p.type])||""]||1);
  /* каждой форме — свой множитель, чтобы планеты одного типа не повторялись */
  const w={
    hill:M.hill*(.6+r()*.7), ridge:M.ridge*(.4+r()*1.1),
    mesa:M.mesa*(.4+r()*1.2), dune:M.dune*(.5+r()*1.0)
  };
  const mesaStep=amp*(.22+r()*.3), duneLen=.055+r()*.07, duneAmp=amp*.34*w.dune;   // дюны были вдвое ниже, чем нужно, и терялись в общей волне
  for(let i=0;i<N;i++){
    let y=base;
    /* ── планетарная составляющая ──
       Низкая частота приходит НЕ из локального шума, а с глобуса: та же
       функция, что красит текстуру, взятая по долготе этой полосы. Сел на
       светлое пятно — стоишь на возвышенности, на тёмное — в низине. */
    const lonW=L0+(i/N-.5)*LAND_ARC;
    y-=(planetHeightAt(p,lonW,LAT)-.5)*amp*2.2;
    y-=fbm1(i*.0055,p.seed,5)*amp*w.hill*.6;
    y-=fbm1(i*.05,p.seed+7,3)*amp*.22*w.hill;
    if(w.ridge>.02){
      const n=fbm1(i*.013,p.seed+31,4);
      y-=Math.pow(1-Math.abs(1-2*n),2.1)*amp*.95*w.ridge;
      /* ── средний масштаб ──
         Формы рельефа были заданы верно (гряды, столовые горы, дюны,
         кратеры, каньоны), но самые крупные из них ложатся на кадр по одной
         волне: игрок видит 14% ландшафта разом, и любая планета выглядела
         одинаково плавной. Вторая, втрое более частая гряда даёт в кадре
         три-четыре зубца вместо одного склона — и характер типа наконец
         виден с того места, где стоит человек, а не только на карте. */
      const n2=fbm1(i*.038,p.seed+131,3);
      /* вклад идёт по КВАДРАТУ веса гряды: у землеподобной (.55) вторая гряда
         почти не слышна, у вулканической и каменистой (1) звучит в полную
         силу. С линейным весом мягкий мир превращался в гребёнку */
      y-=Math.pow(1-Math.abs(1-2*n2),2.6)*amp*.42*w.ridge*w.ridge;
    }
    if(w.mesa>.02){
      const t=fbm1(i*.0042,p.seed+57,3);
      y-=Math.round(t*3.4)/3.4*amp*.8*w.mesa;
    }
    if(duneAmp>.5){
      const ph=fbm1(i*.006,p.seed+83,2)*7;
      const s=Math.sin(i*duneLen+ph);
      y-=(Math.pow(Math.abs(s),.55)*Math.sign(s)*.5+.5)*duneAmp;
    }
    h[i]=y;
  }
  /* кратеры: чаша плюс приподнятый вал по кромке */
  const craters=[];
  const nCr=Math.floor(M.crater*(1+r()*5));
  for(let c=0;c<nCr;c++){
    const ci=Math.floor(r()*N), rad=18+r()*72, depth=amp*(.12+r()*.34);
    craters.push({i:ci,rad});
    for(let i=Math.max(0,ci-rad*1.5|0);i<Math.min(N,ci+rad*1.5|0);i++){
      const u=(i-ci)/rad;
      if(Math.abs(u)>1.45)continue;
      if(Math.abs(u)<=1)h[i]+=depth*Math.cos(u*Math.PI/2)*.9;          // чаша вниз
      const rim=Math.exp(-Math.pow((Math.abs(u)-1)/.3,2));
      h[i]-=depth*.42*rim;                                              // вал вверх
    }
  }
  /* каньоны: узкие глубокие врезы с почти отвесными бортами */
  const nCn=Math.floor(M.canyon*(1+r()*2.4));
  for(let c=0;c<nCn;c++){
    const ci=Math.floor(60+r()*(N-120)), half=7+r()*16, depth=amp*(.5+r()*.8);
    for(let i=Math.max(0,ci-half*3|0);i<Math.min(N,ci+half*3|0);i++){
      const u=Math.abs(i-ci)/half;
      if(u>2.4)continue;
      h[i]+=depth*(1/(1+Math.pow(u,7)));
    }
  }
  /* площадка под посадку — ровная и подальше от кратеров */
  let pi=90+Math.floor(r()*(N-190));
  for(let t=0;t<40;t++){
    const cand=90+Math.floor(r()*(N-190));
    const near=craters.some(c=>Math.abs(cand-c.i)<c.rad*1.6);
    if(!near){pi=cand;break;}
  }
  const pw=18,py=h[pi];
  for(let i=pi-pw;i<=pi+pw;i++){
    const t=clamp((Math.abs(i-pi)-pw*.5)/(pw*.5),0,1);
    h[i]=lerp(py,h[i],t*t);
  }
  /* валуны и осыпь: детерминированы, лежат прямо на профиле */
  const rocks=[];
  const nRk=Math.floor(24+r()*40);
  for(let i=0;i<nRk;i++){
    const x=r()*N*step, rad=3+r()*r()*22, n=6+Math.floor(r()*6), poly=[];
    for(let k=0;k<n;k++){
      const a=k/n*TAU, q=rad*(.6+r()*.6);
      poly.push([Math.cos(a)*q,Math.sin(a)*q*.72]);
    }
    rocks.push({x,rad,poly,tint:r(),flip:r()<.5});
  }
  /* влажность полосы — то же поле, что рисует зелёные пятна на глобусе.
     Кладём её в рельеф, чтобы поверхность (21-mode-surface) могла спросить
     не «какой это тип мира», а «сыро ли ИМЕННО ЗДЕСЬ» */
  const wet=planetWetAt(p,L0,LAT);
  return {h,N,step,W:N*step,padI:pi,padX:pi*step,padY:h[pi],rocks,lon:L0,lat:LAT,wet,
    strata:2+Math.floor(r()*4), sseed:p.seed};
}
function groundAt(tr,x){
  const fx=clamp(x/tr.step,0,tr.N-1.001),i=Math.floor(fx),f=fx-i;
  return lerp(tr.h[i],tr.h[i+1],f);
}
