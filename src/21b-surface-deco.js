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
  const nCl=Math.max(3,Math.round(clamp(tr.W/1600,4,12)*share));
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
  if(tr.deco.length<3){
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
      if(tr.deco.length>=3)break;
      if(put.some(v=>Math.abs(v-q.x)<700))continue;
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
function dcol(pal,i,k,a){
  const c=pal[Math.min(pal.length-1,i)];
  const s=(v)=>Math.round(clamp(v*k,0,255));
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
  /* тени — ДО клипа: они лежат на грунте, а клип как раз всё, что ниже линии
     грунта, и срезает (та же причина и тот же порядок, что у построек) */
  for(const q of vis){
    POI_SEED=q.d.seed;
    ctx.save();ctx.globalAlpha=.72;
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
    if(d.k==="druse")decoDruse(A);
    else if(d.k==="shard")decoShard(A);
    else if(d.k==="slab")decoSlab(A);
    else if(d.k==="truss")decoTruss(A);
    else if(d.k==="wall")decoWall(A);
    else if(d.k==="column")decoColumn(A);
    else if(d.k==="canopy")decoCanopy(A);
    else if(d.k==="frond")decoFrond(A);
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
function decoDruse(A){
  const {pal,tr,w,hgt}=A;
  /* друза — не одна призма, а сросшийся куст разной высоты: ровная гребёнка
     читается частоколом */
  const n=3+Math.floor(h01(1,2,POI_SEED)*4);
  const ord=[];
  for(let i=0;i<n;i++)ord.push(i);
  ord.sort((a,b)=>h01(a,3,POI_SEED)-h01(b,3,POI_SEED));
  for(const i of ord){
    const u=(i+.5)/n-.5;
    const hh=hgt*(.35+h01(i,11,POI_SEED)*.85);
    const ww=w*(.24+h01(i,13,POI_SEED)*.3);
    ctx.save();
    const dx=u*w*1.5;
    ctx.translate(dx,dgy(A,dx)+h01(i,17,POI_SEED)*3);
    prism(ww,hh,(h01(i,19,POI_SEED)-.5)*.7,pal,tr,A.ox,A.oy,i);
    ctx.restore();
  }
  /* крошка у основания: друза растёт ИЗ грунта, а не приставлена к нему */
  for(let i=0;i<6;i++){
    const bx=(h01(i,23,POI_SEED)-.5)*w*2.4, s=2+h01(i,29,POI_SEED)*w*.16;
    ctx.fillStyle=dcol(pal,4,1,.7);
    ctx.beginPath();ctx.moveTo(bx-s,3);ctx.lineTo(bx,3-s*1.6);ctx.lineTo(bx+s,3);
    ctx.closePath();ctx.fill();
  }
}
function decoShard(A){
  const {pal,tr,w,hgt}=A;
  ctx.save();
  ctx.rotate((h01(2,5,POI_SEED)-.5)*.5);
  prism(w*.55,hgt,(h01(3,7,POI_SEED)-.5)*.5,pal,tr,A.ox,A.oy,0);
  ctx.restore();
  /* второй, мелкий, у подножия: одиночная игла в чистом поле выглядит
     поставленной, пара — выросшей */
  ctx.save();ctx.translate(w*.9,dgy(A,w*.9)+2);ctx.rotate(.28);
  prism(w*.3,hgt*.3,.2,pal,tr,A.ox,A.oy,1);
  ctx.restore();
}
/* ── металлический мир: плиты и фермы ──
   Плита и шов — то же, на чём держится MAT_CHAR.plate. Крупная форма — это
   ровно та же плита, только вставшая на ребро. */
function decoSlab(A){
  const {pal,tr,w,hgt}=A;
  /* наклон заметный: почти отвесная плита стояла ровно и вместе с ровными
     швами читалась дощатым поддоном, а не сорванной обшивкой */
  const tilt=(h01(1,3,POI_SEED)<.5?-1:1)*(.22+h01(1,4,POI_SEED)*.3);
  ctx.save();ctx.rotate(tilt);
  const th=Math.max(3,w*.16);
  const P=poiPath([[-w,10],[-w,-hgt],[w,-hgt*.86],[w,10]],Math.min(2.6,w*.12));
  const g=ctx.createLinearGradient(-w,0,w,0);
  g.addColorStop(0,dcol(pal,1,.85));
  g.addColorStop(.6,dcol(pal,3,1));
  g.addColorStop(1,dcol(pal,4,1.05));
  ctx.fillStyle=g;ctx.fill(P);
  decoMat(tr,P,w,hgt,A.ox,A.oy);
  ctx.save();ctx.clip(P);
  /* ОДИН глубокий шов и ребро жёсткости рядом с ним. Четыре равномерных шва
     давали доски: ритм «через равное» — это настил, а ритм «шов, ребро, пусто»
     — обшивка. */
  const sy=-hgt*(.42+h01(2,9,POI_SEED)*.28);
  ctx.strokeStyle="rgba(0,0,0,.62)";ctx.lineWidth=Math.max(1.6,w*.09);
  ctx.beginPath();ctx.moveTo(-w,sy);ctx.lineTo(w,sy+w*.16);ctx.stroke();
  ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=Math.max(1,w*.05);
  ctx.beginPath();ctx.moveTo(-w,sy-w*.16);ctx.lineTo(w,sy);ctx.stroke();
  /* продольное ребро: вертикаль вдоль плиты, по ней читается жёсткость листа */
  ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=Math.max(1.2,w*.06);
  ctx.beginPath();ctx.moveTo(-w*.35,10);ctx.lineTo(-w*.35,-hgt*.94);ctx.stroke();
  /* окисел: узкие вертикальные потёки бурого. Широкие и розовые делали металл
     песчаником — это уже ловилось в M78 */
  for(let i=0;i<5;i++){
    const sx=(h01(i,31,POI_SEED)-.5)*w*1.8, ww=Math.max(1,w*.07);
    const gg=ctx.createLinearGradient(0,-hgt,0,10);
    gg.addColorStop(0,"rgba(96,54,30,0)");
    gg.addColorStop(1,"rgba(96,54,30,"+(.2+h01(i,37,POI_SEED)*.25).toFixed(3)+")");
    ctx.fillStyle=gg;ctx.fillRect(sx,-hgt,ww,hgt+12);
  }
  ctx.restore();
  /* заклёпки по кромке и резкий блик — металл узнают по ним */
  ctx.fillStyle="rgba(0,0,0,.45)";
  for(let i=0;i<5;i++){
    const yy=-hgt*(.12+i*.19);
    ctx.beginPath();ctx.arc(-w+th*.9,yy,Math.max(.8,w*.035),0,TAU);ctx.fill();
  }
  ctx.strokeStyle="rgba(255,255,255,.34)";ctx.lineWidth=Math.max(1,w*.05);
  ctx.beginPath();ctx.moveTo(-w,-hgt);ctx.lineTo(w,-hgt*.86);ctx.stroke();
  ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=1;ctx.stroke(P);
  ctx.restore();
  poiDrift(w*1.1,pal);
}
function decoTruss(A){
  const {pal,w,hgt}=A;
  /* ферма — это ритм, а не силуэт: два пояса и раскосы между ними, часть
     звеньев выбита. Отсюда и масштаб: сквозь неё видно небо */
  const lean=(h01(1,5,POI_SEED)-.5)*.45;
  ctx.save();ctx.rotate(lean);
  const hw=w*.34, top=-hgt;
  const SPL=1.75;                    // развал ног: отвесная ферма читается стойкой
  const rail=(dx)=>{
    ctx.beginPath();ctx.moveTo(dx*SPL,6);ctx.lineTo(dx,top);ctx.stroke();
  };
  ctx.lineWidth=Math.max(1.4,w*.09);
  ctx.strokeStyle=dcol(pal,2,.7);
  rail(-hw);rail(hw);
  /* Раскосы КРЕСТОМ, а не перекладинами: с ровными горизонталями через равный
     шаг ферма получалась приставной лестницей — первый кадр это и показал.
     Крест плюс выбитые звенья читаются конструкцией, которая держала нагрузку
     и перестала. */
  const seg=Math.max(3,Math.round(hgt/26));
  for(let i=0;i<seg;i++){
    const u0=i/seg,u1=(i+1)/seg;
    const y0=lerp(6,top,u0),y1=lerp(6,top,u1);
    const l0=lerp(-hw*SPL,-hw,u0),l1=lerp(-hw*SPL,-hw,u1);
    const r0=lerp(hw*SPL,hw,u0),r1=lerp(hw*SPL,hw,u1);
    ctx.lineWidth=Math.max(1,w*.055);
    ctx.strokeStyle=dcol(pal,2,1.05,.92);
    if(h01(i,7,POI_SEED)>.2){ctx.beginPath();ctx.moveTo(l0,y0);ctx.lineTo(r1,y1);ctx.stroke();}
    if(h01(i,13,POI_SEED)>.3){ctx.beginPath();ctx.moveTo(r0,y0);ctx.lineTo(l1,y1);ctx.stroke();}
    /* поперечина не в каждом звене: она и задаёт ярусы, но подряд снова даёт
       лестницу */
    if(i%2===0&&h01(i,17,POI_SEED)>.35){
      ctx.strokeStyle=dcol(pal,2,.85);ctx.lineWidth=Math.max(1,w*.07);
      ctx.beginPath();ctx.moveTo(l1,y1);ctx.lineTo(r1,y1);ctx.stroke();
    }
  }
  /* верх обломан: погнутый обрывок пояса вместо ровного среза */
  ctx.strokeStyle=dcol(pal,3,.95);ctx.lineWidth=Math.max(1.2,w*.07);
  ctx.beginPath();ctx.moveTo(-hw,top);ctx.lineTo(-hw*.2,top-hgt*.1);
  ctx.lineTo(hw*.9,top-hgt*.04);ctx.stroke();
  ctx.restore();
  ctx.fillStyle=dcol(pal,1,.7,.6);
  ctx.beginPath();ctx.ellipse(0,4,w*.9,Math.max(2,w*.14),0,0,TAU);ctx.fill();
}
/* ── руинный мир: стены и колонны ──
   Кладка на весь экран — миллиметровка (M78), поэтому она идёт пятнами.
   Крупная форма — то, что от этих пятен осталось стоять. */
function decoWall(A){
  const {pal,tr,w,hgt}=A;
  const ww=w*1.5;
  /* верх обломан ступенями, а не пилой: стена рушится по швам кладки */
  const top=[];
  const cols=Math.max(3,Math.round(ww/14));
  for(let i=0;i<=cols;i++)
    top.push([-ww+2*ww*i/cols,-hgt*(.55+h01(i,3,POI_SEED)*.45)]);
  const pts=[[-ww,8]].concat(top,[[ww,8]]);
  const P=poiPath(pts,Math.min(2.4,w*.1));
  ctx.fillStyle=poiBody(hgt,dcol(pal,1,.9),dcol(pal,3,1.05));
  ctx.fill(P);
  decoMat(tr,P,ww,hgt,A.ox,A.oy);
  ctx.save();ctx.clip(P);
  /* ряды и вертикальные швы вразбежку: ровная сетка читается плиткой */
  const bh=Math.max(4,hgt*.11), bw=bh*2.1;
  ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;
  for(let ry=0,i=0;ry<hgt+bh;ry+=bh,i++){
    const yy=8-ry;
    ctx.beginPath();ctx.moveTo(-ww,yy);ctx.lineTo(ww,yy);ctx.stroke();
    for(let sx=-ww+(i%2?bw*.5:0);sx<ww;sx+=bw){
      ctx.beginPath();ctx.moveTo(sx,yy);ctx.lineTo(sx,yy-bh);ctx.stroke();
      /* выбитый блок: дыра, за которой темнота, — самый дешёвый признак
         того, что стену не построили, а она осталась */
      if(h01(i,Math.round(sx),POI_SEED)<.09){
        ctx.fillStyle="rgba(0,0,0,.5)";
        ctx.fillRect(sx+1,yy-bh+1,bw-2,bh-2);
      }
    }
  }
  /* проём: на широкой стене он и задаёт масштаб — человек проходит насквозь */
  if(ww>50&&h01(9,9,POI_SEED)<.6){
    const dw=Math.min(ww*.3,16), dh=Math.min(hgt*.62,30);
    ctx.fillStyle="rgba(0,0,0,.72)";
    ctx.beginPath();
    ctx.moveTo(-dw,8);ctx.lineTo(-dw,8-dh+dw);
    ctx.quadraticCurveTo(0,8-dh-dw*.3,dw,8-dh+dw);
    ctx.lineTo(dw,8);ctx.closePath();ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=1;ctx.stroke(P);
  poiDrift(ww*.95,pal);
}
function decoColumn(A){
  const {pal,tr,w,hgt}=A;
  const ww=w*.34;
  const brk=hgt*(.55+h01(1,3,POI_SEED)*.45);       // на какой высоте сломана
  const P=poiPath([[-ww,8],[-ww*.82,-brk],[ww*.82,-brk],[ww,8]],Math.min(2,ww*.3));
  ctx.fillStyle=poiBody(brk,dcol(pal,1,.85),dcol(pal,4,1));
  ctx.fill(P);
  decoMat(tr,P,ww,brk,A.ox,A.oy);
  /* каннелюры: три светлые и три тёмные полосы дают цилиндр без всякой
     математики — глаз читает круглое по градиенту вдоль, а не по контуру */
  ctx.save();ctx.clip(P);
  for(let i=-2;i<=2;i++){
    ctx.fillStyle=i<0?"rgba(0,0,0,.2)":"rgba(255,255,255,.10)";
    ctx.fillRect(i*ww*.34,-brk,ww*.16,brk+10);
  }
  /* стыки барабанов */
  ctx.strokeStyle="rgba(0,0,0,.3)";ctx.lineWidth=1;
  for(let yy=-brk*.3;yy>-brk;yy-=brk*.34){
    ctx.beginPath();ctx.moveTo(-ww,yy);ctx.lineTo(ww,yy);ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=1;ctx.stroke(P);
  /* упавшие барабаны рядом: колонна стоит не одна, у неё есть история */
  const nd=1+Math.floor(h01(5,5,POI_SEED)*3);
  for(let i=0;i<nd;i++){
    const bx=ww*(1.8+i*1.5)*(h01(i,7,POI_SEED)<.5?-1:1), bh=ww*.8;
    ctx.save();ctx.translate(bx,dgy(A,bx)+2-bh*.4);ctx.rotate((h01(i,11,POI_SEED)-.5)*.4);
    const D=poiPath([[-ww*1.1,bh*.5],[-ww*1.1,-bh*.5],[ww*1.1,-bh*.5],[ww*1.1,bh*.5]],1.6);
    ctx.fillStyle=poiBody(bh,dcol(pal,1,.8),dcol(pal,3,1));
    ctx.fill(D);
    decoMat(tr,D,ww,bh,A.ox,A.oy);
    ctx.strokeStyle="rgba(0,0,0,.4)";ctx.stroke(D);
    ctx.restore();
  }
  poiDrift(ww*2.2,pal);
}
/* ── джунгли: полог ──
   Под пологом темно, и свет пробивает лишь местами — то же, что вышло у
   MAT_CHAR.moss со второго захода. Дерево здесь не «растение побольше»:
   его смысл — накрыть кадр сверху и дать глубину, поэтому крона выходит за
   верхнюю кромку, а не помещается в неё. */
function decoCanopy(A){
  const {pal,w,hgt}=A;
  const sway=WIND*.02*(.7+.3*Math.sin(G.t*.02+POI_SEED%97));
  ctx.save();ctx.rotate(sway);
  const tw=Math.max(2,w*.16), lean=(h01(1,3,POI_SEED)-.5)*w*.7;
  /* корни-контрфорсы: без них ствол вставлен в землю, как палка */
  ctx.fillStyle=dcol(pal,0,.9);
  for(let i=-1;i<=1;i++){
    const rx=i*tw*2.2;
    ctx.beginPath();ctx.moveTo(rx,6);ctx.lineTo(i*tw*.5,-hgt*.12);
    ctx.lineTo(i*tw*.5+tw*.5,-hgt*.1);ctx.lineTo(rx+tw*.7,6);
    ctx.closePath();ctx.fill();
  }
  /* ствол сужается кверху и слегка кривой */
  const T=new Path2D();
  T.moveTo(-tw,4);
  T.quadraticCurveTo(-tw*.7+lean*.4,-hgt*.55,-tw*.4+lean,-hgt);
  T.lineTo(tw*.4+lean,-hgt);
  T.quadraticCurveTo(tw*.7+lean*.4,-hgt*.55,tw,4);
  T.closePath();
  /* ствол ТЕМНЕЕ листвы: на кадре он вышел светлее кроны и одного цвета со
     стеблями мелкой флоры — дерево читалось не деревом, а трубой под шляпкой.
     Светлое здесь только узкая кромка со стороны солнца. */
  const g=ctx.createLinearGradient(-tw,0,tw,0);
  g.addColorStop(0,dcol(pal,0,.75));
  g.addColorStop(.72,dcol(pal,0,1.15));
  g.addColorStop(1,dcol(pal,2,.8));
  ctx.fillStyle=g;ctx.fill(T);
  /* Крона. Первый кадр дал гриб: ровные светлые эллипсы сложились в один диск,
     да ещё ярче всего остального в кадре. Под пологом ТЕМНО — это и есть закон
     джунглей (тот же, что у MAT_CHAR.moss). Поэтому: массы тёмные, их низ
     рваный, свет — редкими пятнами по верхним кромкам, и часть листвы висит
     НИЖЕ верха, на стволе, иначе шляпка снова читается шляпкой. */
  const nb=5+Math.floor(h01(2,5,POI_SEED)*3);
  const mass=(bx,by,br,dark)=>{
    ctx.fillStyle=dcol(pal,dark?0:1,dark?1.25:1.05,.94);
    ctx.beginPath();
    for(let s=0;s<=16;s++){
      const a=s/16*TAU;
      /* низ кроны рвётся сильнее верха: там свисают листья, а не кромка шара */
      const rr=br*(.82+h01(s,Math.round(bx),POI_SEED)*.36)*(Math.sin(a)>0?1.25:1);
      const px=bx+Math.cos(a)*rr*1.2, py=by+Math.sin(a)*rr*.78;
      if(s===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.closePath();ctx.fill();
  };
  for(let i=0;i<nb;i++){
    /* часть масс спускается по стволу: полог не плоский, у него есть ярусы */
    const drop=h01(i,23,POI_SEED)<.35?hgt*(.18+h01(i,29,POI_SEED)*.3):0;
    const bx=lean*(1-i/nb)+(h01(i,7,POI_SEED)-.5)*hgt*(drop?.42:.8);
    const by=-hgt+drop-h01(i,11,POI_SEED)*hgt*.16;
    const br=hgt*(.17+h01(i,13,POI_SEED)*.15)*(drop?.7:1);
    /* ветка от ствола к массе. Без неё нижние ярусы висели отдельными
       полками — второй кадр дал не дерево, а пагоду: масса не связана со
       стволом ничем, и глаз читает её как самостоятельный предмет */
    if(drop||Math.abs(bx-lean)>hgt*.2){
      ctx.strokeStyle=dcol(pal,1,1.1);ctx.lineWidth=Math.max(1.4,tw*.4);
      ctx.beginPath();ctx.moveTo(lean*.9,-hgt*(drop?.82:.9));
      ctx.quadraticCurveTo((bx+lean)*.5,by+br*.2,bx,by+br*.15);ctx.stroke();
    }
    mass(bx,by,br,i%2===0);
    /* свет пробивает пятнами, а не заливает шляпку целиком */
    for(let s=0;s<3;s++){
      if(h01(i,s+41,POI_SEED)<.45)continue;
      const sx=bx+(h01(i,s+43,POI_SEED)-.5)*br*1.6;
      const sr=br*(.14+h01(i,s+47,POI_SEED)*.16);
      ctx.fillStyle=dcol(pal,3,1,.22);
      ctx.beginPath();ctx.ellipse(sx,by-br*.42,sr*1.5,sr*.6,-.15,0,TAU);ctx.fill();
    }
  }
  /* лианы: они и связывают крону с землёй, и качаются заметнее ствола */
  ctx.lineWidth=Math.max(1,w*.03);
  for(let i=0;i<4;i++){
    const vx=lean+(h01(i,17,POI_SEED)-.5)*hgt*.6;
    const vl=hgt*(.3+h01(i,19,POI_SEED)*.5);
    const sw2=WIND*(4+i)*(.6+.4*Math.sin(G.t*.03+i*1.7));
    ctx.strokeStyle=dcol(pal,1,.9,.75);
    ctx.beginPath();ctx.moveTo(vx,-hgt*.96);
    ctx.quadraticCurveTo(vx+sw2,-hgt*.96+vl*.6,vx+sw2*1.6,-hgt*.96+vl);
    ctx.stroke();
  }
  ctx.restore();
}
function decoFrond(A){
  const {pal,w,hgt}=A;
  const n=5+Math.floor(h01(1,3,POI_SEED)*4);
  for(let i=0;i<n;i++){
    const u=(i+.5)/n-.5;
    const ang=u*1.5+(h01(i,5,POI_SEED)-.5)*.25;
    const L=hgt*(.6+h01(i,7,POI_SEED)*.6);
    const sw2=WIND*3.2*(.6+.4*Math.sin(G.t*.035+i*1.3));
    ctx.save();ctx.rotate(ang);
    /* стебель гнётся, а лист — не заливка, а ряд перьев по нему: пятно
       здесь читалось бы кустом любого мира */
    ctx.strokeStyle=dcol(pal,2,1);ctx.lineWidth=Math.max(1,w*.05);
    ctx.beginPath();ctx.moveTo(0,2);
    ctx.quadraticCurveTo(sw2*.5,-L*.6,sw2+L*.22,-L);
    ctx.stroke();
    ctx.strokeStyle=dcol(pal,i%2?3:2,1,.9);ctx.lineWidth=Math.max(1,w*.035);
    for(let s=2;s<=7;s++){
      const t=s/8, px=lerp(0,sw2+L*.22,t)+sw2*.2*t, py=lerp(2,-L,t);
      const ll=L*.2*Math.sin(t*Math.PI);
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-ll*.7,py-ll*.5);ctx.stroke();
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+ll*.7,py-ll*.3);ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillStyle=dcol(pal,0,1,.5);
  ctx.beginPath();ctx.ellipse(0,3,w*.5,Math.max(2,w*.12),0,0,TAU);ctx.fill();
}

/* ── передний план ──
   Между игроком и стеклом ничего не стояло: дальний хребет, грунт, человек —
   и всё на одной глубине (G2). Глубина в 2D делается перекрытием: редкие
   тёмные силуэты у самого края кадра, идущие быстрее камеры, и без деталей —
   вблизи глаз не фокусируется, и силуэт работает значением, не фактурой.
   Цвет — тень неба этой планеты, поэтому он принадлежит кадру, а не наклейке. */
function drawForeground(tr,camx,camy,p){
  const K=1.24, SLOT=560;
  const amb=ambRGB(p);
  /* ── силуэт без освещённой кромки читается ДЫРОЙ (автор, 24.08.2026) ──
     Валун переднего плана был залит почти чёрным (amb×.30) без контура и без
     материала. На тёмном грунте он переставал быть предметом и выглядел
     прорехой в отрисовке — автор ткнул в него и спросил «а что это вообще».
     Правило шире одного камня: у ЛЮБОГО силуэта в этой игре обязана быть
     кромка, поймавшая небо. Иначе глаз читает не «чёрный предмет», а
     «здесь ничего не нарисовалось». */
  const c="rgba("+Math.round(amb[0]*.42)+","+Math.round(amb[1]*.44)+","+Math.round(amb[2]*.50)+",";
  const rim="rgba("+Math.round(amb[0]*1.15+30)+","+Math.round(amb[1]*1.15+34)+","+Math.round(amb[2]*1.2+40)+",";
  const fx=camx*K;
  const s0=Math.floor((fx-300)/SLOT), s1=Math.floor((fx+W+300)/SLOT);
  const hasAir=p.T.atm!=="отсутствует"&&["terran","ocean","jungle","toxic"].includes(p.type);   // трава — только где есть флора: на льду пучок читался чёрными палками
  for(let s=s0;s<=s1;s++){
    const h=hashi(s,p.seed,0xF06E);
    if((h&3)!==0)continue;                       // один силуэт на два экрана
    const wx=s*SLOT+((h>>>2)&511), sx=wx-fx;
    const gy=groundAt(tr,clamp(sx+camx,0,tr.W-1))-camy;
    const kind=(h>>>11)&3, r=48+((h>>>13)&63);
    const y=Math.max(gy+r*.8+40,H-r*.5);   // ближе — ниже в кадре: у самой кромки, срезан ею
    if(y-r>H+10||sx+r<-20||sx-r>W+20)continue;
    if(kind<2||!hasAir){
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
    }else{
      /* куст/трава: пучок лезвий, кланяется ветру */
      ctx.strokeStyle=c+".92)";ctx.lineCap="round";
      const n=6+((h>>>19)&5), bow=(WIND||0)*6+Math.sin(G.t*.02+s)*3;
      for(let i=0;i<n;i++){
        const hh=hashi(s,i*7,0x6A55), bx=sx+((hh&63)-32)*1.2, len=r*(.8+((hh>>>6)&15)/15*.8);
        const lean=((hh>>>10)&15)/15-.5;
        ctx.lineWidth=2.2+((hh>>>14)&3);
        ctx.beginPath();ctx.moveTo(bx,y+10);
        ctx.quadraticCurveTo(bx+lean*len*.4,y-len*.55,bx+lean*len+bow,y-len);
        ctx.stroke();
      }
    }
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
function drawDeposit(x,y,res,left,near,seed,pal){
  const col=hex2rgb(RES[res].col), kind=depKind(res);
  const r=rng(hashi(seed|0,left|0,0xDEB0));
  /* сколько осталось — столько и стоит: выработанная залежь оседает в гнездо */
  const k=clamp(.45+Math.min(1,(left||1)/9)*.55,0,1);
  const S=(14+r()*7)*k;
  ctx.save();
  /* Гнездо: потревоженная земля. Ровный тёмный эллипс читался ПОДСТАВКОЙ, как
     у настольной фигурки (самокритика M169), поэтому оно рваное, шире тела и
     сдвинуто в сторону тени. */
  const soil=pal?sdMix(pal,[0,0,0],.2):[62,56,48];
  ctx.fillStyle="rgba(0,0,0,.20)";
  ctx.beginPath();
  for(let i=0;i<=10;i++){
    const a=Math.PI*(i/10), rr=1+((r()-.5)*.3);
    const px=x-S*.2+Math.cos(a)*S*1.5*rr, py=y+1+Math.sin(a)*S*.3*rr;
    i?ctx.lineTo(px,py):ctx.moveTo(px,py);
  }
  ctx.closePath();ctx.fill();
  ctx.fillStyle="rgb("+soil.map(v=>v|0).join(",")+")";
  for(let i=0;i<7;i++){                                   /* выброшенные комья */
    const bx=x+(r()-.5)*S*2.2, by=y+(r()-.5)*2;
    ctx.beginPath();ctx.ellipse(bx,by,1.6+r()*2.6,1+r()*1.4,0,0,TAU);ctx.fill();
  }
  /* тень тела влево, к свету справа сверху */
  ctx.fillStyle="rgba(0,0,0,.24)";
  ctx.beginPath();ctx.ellipse(x-S*.5,y,S*.8,S*.2,0,0,TAU);ctx.fill();
  const lit="rgb("+col.map(v=>Math.min(255,v*1.35+40)|0).join(",")+")";
  const mid="rgb("+col.join(",")+")";
  const dark="rgb("+col.map(v=>v*.42|0).join(",")+")";
  if(kind==="crystal"){
    /* друза: три-пять призм, у каждой освещённая грань и тёмная сторона */
    const n=3+Math.floor(r()*3);
    for(let i=0;i<n;i++){
      const t=(i+.5)/n-.5, bx=x+t*S*1.5, hh=S*(.7+r()*1.1)*(1-Math.abs(t)*.5);
      const w=S*(.16+r()*.12);
      ctx.beginPath();
      ctx.moveTo(bx-w,y);ctx.lineTo(bx-w*.7,y-hh*.7);ctx.lineTo(bx,y-hh);
      ctx.lineTo(bx+w*.7,y-hh*.7);ctx.lineTo(bx+w,y);ctx.closePath();
      /* каждая призма своего тона: одинаково яркие читались пластиковыми */
      const kk=.55+r()*.45;
      ctx.fillStyle="rgb("+col.map(v=>v*kk|0).join(",")+")";ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx,y-hh);ctx.lineTo(bx+w*.7,y-hh*.7);ctx.lineTo(bx+w,y);ctx.lineTo(bx,y);
      ctx.closePath();ctx.fillStyle=lit;ctx.globalAlpha=.55;ctx.fill();ctx.globalAlpha=1;
      ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(bx,y-hh);ctx.lineTo(bx,y);ctx.stroke();
    }
  }else if(kind==="ice"){
    /* торос: глыба со сколом, прозрачная по кромке */
    ctx.beginPath();
    ctx.moveTo(x-S,y);ctx.lineTo(x-S*.7,y-S*.75);ctx.lineTo(x-S*.1,y-S*1.05);
    ctx.lineTo(x+S*.55,y-S*.8);ctx.lineTo(x+S,y);ctx.closePath();
    ctx.fillStyle=mid;ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.30)";
    ctx.beginPath();
    ctx.moveTo(x-S*.1,y-S*1.05);ctx.lineTo(x+S*.55,y-S*.8);ctx.lineTo(x+S,y);
    ctx.lineTo(x+S*.3,y);ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgba(226,246,255,.5)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x-S*.7,y-S*.75);ctx.lineTo(x+S*.1,y-S*.45);
    ctx.lineTo(x+S*.55,y-S*.8);ctx.stroke();
  }else if(kind==="iron"){
    /* останец: плитчатый скол, ржавые натёки сверху вниз */
    ctx.beginPath();
    ctx.moveTo(x-S*.9,y);ctx.lineTo(x-S*.75,y-S*.9);
    ctx.lineTo(x-S*.2,y-S*1.15);ctx.lineTo(x+S*.6,y-S*.85);
    ctx.lineTo(x+S*.95,y);ctx.closePath();
    ctx.fillStyle=dark;ctx.fill();
    ctx.save();ctx.clip();
    ctx.fillStyle=mid;ctx.fillRect(x-S*.2,y-S*1.2,S*1.2,S*1.2);
    ctx.strokeStyle="rgba(0,0,0,.34)";ctx.lineWidth=1;
    for(let yy=y-S*.2;yy>y-S*1.1;yy-=S*.22){
      ctx.beginPath();ctx.moveTo(x-S,yy);ctx.lineTo(x+S,yy-S*.1);ctx.stroke();
    }
    ctx.fillStyle=lit;ctx.globalAlpha=.35;
    ctx.fillRect(x+S*.1,y-S*1.1,S*.5,S*1.1);ctx.globalAlpha=1;
    ctx.restore();
  }else if(kind==="shards"){
    /* россыпь острых осколков — кремний колется, а не растёт */
    for(let i=0;i<7;i++){
      const bx=x+(r()-.5)*S*1.8, hh=S*(.25+r()*.55), w=S*(.10+r()*.14);
      ctx.beginPath();
      ctx.moveTo(bx-w,y+1);ctx.lineTo(bx+(r()-.5)*w,y-hh);ctx.lineTo(bx+w,y+1);
      ctx.closePath();
      ctx.fillStyle=i%2?mid:dark;ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.22)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(bx+(r()-.5)*w,y-hh);ctx.lineTo(bx+w,y+1);ctx.stroke();
    }
  }else if(kind==="crust"){
    /* корка: бугры и поры, живое, а не гранёное */
    for(let i=0;i<5;i++){
      const bx=x+(i-2)*S*.42+(r()-.5)*3, rr=S*(.30+r()*.28);
      ctx.beginPath();ctx.ellipse(bx,y-rr*.5,rr,rr*.72,0,0,TAU);
      ctx.fillStyle=i%2?mid:dark;ctx.fill();
      ctx.fillStyle="rgba(255,255,255,.16)";
      ctx.beginPath();ctx.ellipse(bx+rr*.2,y-rr*.8,rr*.34,rr*.22,0,0,TAU);ctx.fill();
    }
    ctx.fillStyle="rgba(0,0,0,.3)";
    for(let i=0;i<6;i++)ctx.fillRect(x+(r()-.5)*S*1.5,y-S*.5-r()*S*.4,1.4,1.4);
  }else if(kind==="vein"){
    /* жила в камне: сам камень серый, металл — прожилками */
    ctx.beginPath();
    ctx.moveTo(x-S,y);ctx.lineTo(x-S*.6,y-S*.8);ctx.lineTo(x+S*.4,y-S*.95);
    ctx.lineTo(x+S,y);ctx.closePath();
    ctx.fillStyle="rgb(84,86,88)";ctx.fill();
    ctx.save();ctx.clip();
    /* Прожилки КОРОТКИЕ и наклонные: сплошные полосы через весь камень делали
       из него полосатый колпак (самокритика M169) */
    ctx.strokeStyle=mid;
    for(let i=0;i<7;i++){
      const y0=y-S*(.12+r()*.8), x0=x-S*.8+r()*S*1.6, ln=S*(.2+r()*.4);
      const a=-.5+r()*1.0;
      ctx.lineWidth=1+r()*1.6;
      ctx.beginPath();ctx.moveTo(x0,y0);
      ctx.lineTo(x0+Math.cos(a)*ln,y0+Math.sin(a)*ln*.5);ctx.stroke();
    }
    ctx.fillStyle="rgba(255,255,255,.14)";
    for(let i=0;i<3;i++){                                 /* блики на металле */
      const x0=x-S*.4+r()*S*1.0, y0=y-S*(.2+r()*.6);
      ctx.fillRect(x0,y0,1.6+r()*2,1.2);
    }
    ctx.restore();
    ctx.strokeStyle="rgba(0,0,0,.4)";ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(x-S,y);ctx.lineTo(x-S*.6,y-S*.8);ctx.lineTo(x+S*.4,y-S*.95);
    ctx.lineTo(x+S,y);ctx.stroke();
  }else{
    /* натёк в трещине: тёплое вещество выступило и застыло потёками */
    ctx.fillStyle="rgb(70,66,60)";
    ctx.beginPath();
    ctx.moveTo(x-S*.9,y);ctx.lineTo(x-S*.5,y-S*.7);ctx.lineTo(x+S*.5,y-S*.62);
    ctx.lineTo(x+S*.9,y);ctx.closePath();ctx.fill();
    ctx.fillStyle=mid;
    for(let i=0;i<4;i++){
      const bx=x-S*.5+i*S*.34;
      ctx.beginPath();
      ctx.moveTo(bx,y-S*.6);ctx.lineTo(bx+S*.16,y-S*.6);
      ctx.lineTo(bx+S*.1,y);ctx.lineTo(bx-S*.04,y);ctx.closePath();ctx.fill();
    }
    ctx.save();ctx.globalCompositeOperation="lighter";
    const g=ctx.createRadialGradient(x,y-S*.4,1,x,y-S*.4,S*1.4);
    g.addColorStop(0,"rgba("+col.join(",")+",.22)");
    g.addColorStop(1,"rgba("+col.join(",")+",0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y-S*.4,S*1.4,0,TAU);ctx.fill();
    ctx.restore();
  }
  /* Подсказка «здесь можно копать» — не пульсирующий круг поверх мира, а
     блик по кромке, который загорается, когда игрок подошёл. */
  if(near>0){
    ctx.strokeStyle="rgba(255,255,255,"+(.16*near).toFixed(3)+")";
    ctx.lineWidth=1.4;
    ctx.beginPath();ctx.ellipse(x,y-S*.45,S*1.15,S*.85,0,Math.PI*1.15,Math.PI*1.95);ctx.stroke();
  }
  ctx.restore();
}
