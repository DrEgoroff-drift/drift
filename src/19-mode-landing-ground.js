/* ══════════════ посадка: разрез грунта ══════════════
   Отрезано от `19-mode-landing` 09.09.2026: файл дорос до 50 КБ, и внутри у него
   лежали рядом две работы — сама посадка (спуск, автопилот, кадр) и то, как
   пишется разрез под ней. Здесь второе: drawGround с тремя проходами пекла
   (форма, лессировка, оттенок — 18a1), крошка и трава на кромке, валуны.
   Небо, тень-контакт, пыль и сам кадр посадки остались в `19-mode-landing`.
   Порядок склейки: этот модуль стоит ПЕРЕД `19-mode-landing.js` (дефис раньше
   точки), и это не важно — здесь одни функции и `let GROUND_BAKING`, который
   читается только изнутри них. Поверхность (21e1) зовёт те же функции. */

function drawGround(tr,camx,camy,fill,line,pal){
  /* силуэт строится в Path2D и живёт до конца функции. Раньше он лежал в
     текущем пути контекста, и первый же beginPath в цикле склонов его затирал:
     дальше clip для пластов и обводка кромки применялись к последней
     шестипиксельной полоске, то есть пласты породы не рисовались вовсе. */
  /* ── ближний слой идёт через кэш ломтей (18c) ──
     Разрез с пластами, материалом и глубиной — самое дорогое в кадре и при
     этом неизменное: камера его только двигает. Ломоть красится этой же
     функцией (GROUND_BAKING), а в кадре остаётся drawImage да трава —
     она одна здесь живая, потому что кланяется ветру. */
  if(pal&&tr.mat&&!GROUND_BAKING){
    if(tr.hMin==null){let a=1e9,b=-1e9;for(let i=0;i<tr.N;i++){if(tr.h[i]<a)a=tr.h[i];if(tr.h[i]>b)b=tr.h[i];}tr.hMin=a;tr.hMax=b;}
    const top=Math.floor(tr.hMin-90),ch=Math.ceil(tr.hMax-tr.hMin+H+120);
    /* час суток входит в ключ (M232): свет в ломте дневной или ночной, и
       ломоть, испечённый утром, не должен пережить полдень. Квантование в
       шесть ступеней держит перепечку редкой */
    /* в ключ ломтя входит и СТОРОНА солнца (M242): свет теперь идёт оттуда,
       где диск, а ломоть печётся один раз — без азимута в ключе земля весь
       день держала бы утреннюю подсветку склонов */
    tr.chunks=chunkStore(tr.chunks,(tr.p?tr.p.seed:0)+"|"+fill+"|"+line+"|"+H+"|"+DPR+
      "|d"+(tr.p?dayKq(tr.p):0)+"|a"+(tr.p?sunAzQ(tr.p):0),top,ch);
    drawChunks(tr.chunks,camx,camy,(g,wx0,wy0)=>{
      GROUND_BAKING=true;
      /* ── три прохода вместо одного (гризайль P4, M422) ──
         1. ФОРМА в сером: масса, пласты, зерно, штрих, свет склона;
         2. ЛЕССИРОВКА: серое v → тень + v·(свет − тень), где тень — цвет неба,
            а свет — цвет звезды. Два композитных залива, ни одного чтения
            канвы (readback уронил бы ломоть в программный растр);
         3. ОТТЕНОК: жилы, лишайник, тлеющие швы — то, чего из светлоты не
            достать. Идёт ПОСЛЕ лессировки, иначе она бы его перекрасила.
         Валуны неподвижны и сложены из той же породы — им место в ломте, а не
         в кадре: 6–9 мс на ×2 (G0). */
      try{
        GLAZE_PASS="form";
        drawGround(tr,wx0,wy0,fill,line,pal);drawRocks(tr,wx0,wy0,pal);
        glazeGround(tr,wx0,wy0,pal);
        GLAZE_PASS="hue";
        drawGround(tr,wx0,wy0,fill,line,pal);drawRocks(tr,wx0,wy0,pal);
      }finally{GROUND_BAKING=false;GLAZE_PASS="";}
    });
    drawGroundGrass(tr,camx,camy);
    return;
  }
  const i0=clamp(Math.floor((camx-40)/tr.step),0,tr.N-1);
  const i1=clamp(Math.ceil((camx+W+40)/tr.step),0,tr.N-1);
  const P=new Path2D();
  P.moveTo(i0*tr.step-camx,tr.h[i0]-camy);
  for(let i=i0;i<=i1;i++)P.lineTo(i*tr.step-camx,tr.h[i]-camy);
  P.lineTo(i1*tr.step-camx,H+10);P.lineTo(i0*tr.step-camx,H+10);P.closePath();
  /* в проходе формы силуэт кладётся СВЕТЛОТОЙ той же заливки: цвет придёт
     лессировкой, и придёт всему разрезу разом, а не одной ленте склона */
  if(glazeIsForm()){
    ctx.fillStyle=(pal&&tr.mat)
      ?greyOf(pal[2],.6*255/Math.max(1,lum3(pal[pal.length-1]))):fill;
    ctx.fill(P);
  }
  /* сначала строение (какие слои и где), потом материал (из чего они сложены):
     обратный порядок закрашивал разрез ровным зерном и снова давал «фигуру» */
  if(pal&&tr.p)drawStrata(tr,camx,camy,tr.p,P);
  /* путь силуэта нужен лессировке — она ляжет ровно по нему */
  if(glazeIsForm())tr._glazeP=P;
  /* порода: бесшовный тайл-материал вместо плоской заливки (18a-material).
     Заливка под ним остаётся — она держит силуэт, если материала ещё нет. */
  if(tr.mat&&glazeIsForm())fillMaterial(tr.mat,camx,camy,tr.p?.5:.92,.22,P);
  /* плитка событий — жилы, искры, тлеющие швы — после лессировки */
  if(tr.mat&&glazeIsHue()&&tr.p&&typeof planetMatHue==="function")
    fillMaterial(planetMatHue(tr.p),camx,camy,.85,0,P);
  /* ── 皴 на обрыве (аудит 10×10, §5): манера штриха дошла до поверхности ──
     Пещера и шахта режут ту же породу с манерой (CUN), а срез под рельефом —
     самая большая площадь дневного кадра — оставался материалом без кисти.
     Тот же ход: штрих вдоль поля направлений, манера из таблицы по типу
     мира. В ломоть, кадру бесплатно. */
  if(pal&&tr.p&&tr.mat&&glazeIsForm()&&typeof CUN!=="undefined"){
    ctx.save();ctx.clip(P);
    const M=CUN[tr.p.type]||CUN.rocky;
    const stp=26,sd=((tr.p.seed|0)^0x51F);
    const gx0=Math.floor(camx/stp)*stp, gy0=Math.floor(camy/stp)*stp;
    for(let gy=gy0;gy<camy+H+stp;gy+=stp)for(let gx=gx0;gx<camx+W+stp;gx+=stp){
      const hh=hashi(gx/stp,gy/stp,sd);
      if((hh&7)<3)continue;
      /* сила штриха — от глубины под кромкой: свет бьёт по верху разреза, и
         там манера видна В ПОЛНЫЙ ГОЛОС; с глубиной гаснет вместе с породой.
         Первая кладка была ровной и робкой — штриха не было видно вовсе
         (автор: «изменения не вижу» — и был прав). */
      const kd=clamp(1.5-(gy-groundAt(tr,gx))/420,.35,1.5);
      const jx=gx+((hh>>>3)&15)/15*stp-camx, jy=gy+((hh>>>7)&15)/15*stp-camy;
      const light=((hh>>>14)&1);
      if(M.dot){
        ctx.fillStyle=light?"rgba(255,255,255,"+(M.la*kd).toFixed(3)+")":"rgba(0,0,0,"+(M.da*kd).toFixed(3)+")";
        const q=1+((hh>>>11)&1);
        ctx.fillRect(jx,jy,q,q);
        continue;
      }
      const ang=dirAt(gx,gy,sd+0x11,1/300)+(((hh>>>16)&15)/15-.5)*M.jig;
      const ln=(6+((hh>>>11)&7))*M.ln;
      ctx.strokeStyle=light?"rgba(255,255,255,"+(M.la*kd).toFixed(3)+")":"rgba(0,0,0,"+(M.da*kd).toFixed(3)+")";
      ctx.lineWidth=M.w;
      ctx.beginPath();
      ctx.moveTo(jx-Math.cos(ang)*ln,jy-Math.sin(ang)*ln);
      ctx.lineTo(jx+Math.cos(ang)*ln,jy+Math.sin(ang)*ln);
      ctx.stroke();
    }
    ctx.restore();
  }
  /* склон, обращённый к солнцу (вправо-вверх), светлее; в тень — темнее.
     Простое псевдо-освещение по наклону вместо одной плоской заливки.
     Полосы полупрозрачные: непрозрачные закрашивали материал обратно в фигуру. */
  if(pal&&i1>i0&&glazeIsForm()){
    const stripD=66;
    /* свет считается от звезды и от неба (19c-light), а не по константе
       «вправо-вверх светлее»: у токсичного мира тени зелёные, у ледяного
       синие, и планета опознаётся по освещению раньше, чем по форме */
    const P0=pal[Math.min(pal.length-1,3)];
    const sun=starRGB(), amb=tr.p?ambRGB(tr.p):pal[1], k=tr.p?ambK(tr.p):.3;
    /* прямой свет по дневному ключу: полдень ~.96, заря ~.45 — в полдень
       склоны к солнцу горят, а тени остаются цветными от неба */
    const df=tr.p?(.40+.58*dayKq(tr.p)):.78;
    /* верх шкалы серого прохода — полностью освещённая поверхность (d=1) */
    const lumFull=Math.max(1,lum3([0,1,2].map(q=>P0[q]*(k*amb[q]/255+df*sun[q]/255))));
    /* падающая тень (P5, 19c1): что стоит между точкой и светилом */
    const CM=castMapFor(tr,camx);
    for(let i=i0;i<i1;i++){
      const x0=i*tr.step-camx,x1=(i+1)*tr.step-camx;
      if(x1<-4||x0>W+4)continue;
      const y0=tr.h[i]-camy,y1=tr.h[i+1]-camy;
      const slope=clamp((tr.h[i+1]-tr.h[i])/tr.step,-2.5,2.5);
      /* ── свет склона тоже стал светлотой (гризайль) ──
         Это было ЕДИНСТВЕННОЕ место разреза, где свет считался по-настоящему
         (`litRGB`), и клалось оно поверх материала одной лентой. Теперь то же
         число ложится серым, а цвет ему даёт лессировка — и достаётся он
         всему разрезу, а не ленте. */
      /* в тени прямого света нет, остаётся небо. `litRGB` читает `df||.78`,
         поэтому ноль ему отдавать нельзя — отдаём эпсилон */
      const sh=castAt(CM,i);
      const c=litRGB(P0,slope,null,sun,amb,k,sh>0?Math.max(1e-3,df*(1-sh)):df);
      ctx.fillStyle=(pal&&tr.mat)?greyA(255*clamp(lum3(c)/lumFull,0,1),.42)
        :"rgba("+c[0]+","+c[1]+","+c[2]+","+(tr.mat?.42:1)+")";
      ctx.beginPath();
      ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.lineTo(x1,y1+stripD);ctx.lineTo(x0,y0+stripD);
      ctx.closePath();ctx.fill();
      /* ── маска тени (P5) ──
         Погашенная лента склона — сорок процентов серого на шестидесяти px —
         глазом не находится: первый замер дал массу +3 и ничего на кадре. Тень
         обязана лечь на ТЕЛО под кромкой и сойти на нет к глубине, как ложится
         тень гребня на склон за ним. Серым, в проход формы: цвет неба ей даст
         лессировка. Печётся в ломоть, кадру даром. */
      if(sh>.02){
        const d2=stripD*1.5, ya=Math.min(y0,y1);
        const dgr=ctx.createLinearGradient(0,ya,0,Math.max(y0,y1)+d2);
        dgr.addColorStop(0,"rgba(0,0,0,"+(.55*sh).toFixed(3)+")");
        dgr.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=dgr;
        ctx.beginPath();
        ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.lineTo(x1,y1+d2);ctx.lineTo(x0,y0+d2);
        ctx.closePath();ctx.fill();
      }
    }
    /* крошка на кромке — неподвижна, ложится в ломоть; трава живая и идёт
       отдельно (drawGroundGrass), в кадре поверх ломтей */
    drawGroundCrumbs(tr,camx,camy,i0,i1);
    if(!tr.mat)drawGroundGrass(tr,camx,camy);
  }
  /* глубина: тело породы гаснет вниз. Без этого низ экрана — ровное пятно
     той же светлоты, что и освещённая поверхность, и грунт читается плоским. */
  if(tr.mat){
    ctx.save();ctx.clip(P);
    const dg=ctx.createLinearGradient(0,Math.max(0,(GROUND_BAKING?tr.hMin:tr.h[i0])-camy-40),0,H);
    /* ── глубина мягче, чем была (гризайль M422) ──
       Чёрный размыв гасил ВСЕ каналы поровну: цвет от этого не уезжал, а
       светлота уезжала — и раньше это было неважно, потому что низ разреза
       держался на оттенке. В гризайли держаться больше не на чем: при .88
       зерно, трещины и пласты внизу пропадали вовсе. Ослабляем — глубину
       теперь и без того называет лессировка, оставляя там один свет неба. */
    dg.addColorStop(0,"rgba(0,0,0,0)");
    dg.addColorStop(.45,"rgba(0,0,0,.30)");
    dg.addColorStop(1,"rgba(0,0,0,.66)");
    ctx.fillStyle=dg;ctx.fillRect(0,0,W,H);
    ctx.restore();
  }
  if(line){
    /* корка: светлая кромка поверх тёмного тела породы. В гризайли она тоже
       светлота — цвет ей даст лессировка вместе со всем разрезом */
    ctx.strokeStyle=(pal&&tr.mat&&glazeIsForm())
      ?greyA(greyStretch(lum3(pal[Math.min(pal.length-1,4)])*255/
             Math.max(1,lum3(pal[pal.length-1]))),1)
      :line;
    ctx.lineWidth=1.4;ctx.stroke(P);
    /* блик корки гаснет в падающей тени (P5): один путь на весь разрез стал
       отрезками, и каждый берёт свою долю тени */
    const CMc=castMapFor(tr,camx);
    ctx.save();ctx.clip(P);ctx.lineWidth=7;ctx.lineCap="round";
    for(let i=i0;i<i1;i++){
      const a=.09*(1-castAt(CMc,i));
      if(a<.012)continue;
      ctx.strokeStyle="rgba(255,255,255,"+a.toFixed(3)+")";
      ctx.beginPath();
      ctx.moveTo(i*tr.step-camx,tr.h[i]-camy+4);ctx.lineTo((i+1)*tr.step-camx,tr.h[i+1]-camy+4);
      ctx.stroke();
    }
    ctx.restore();
    /* ── движки (§1, стадия 5 иконописи; переделка стиля по правилам) ──
       Финальный свет — не растяжка, а несколько ЖЁСТКИХ отметин по счёту.
       Кладутся только на склоны, смотрящие на солнце, короткими штрихами по
       самой кромке — камень начинает блестеть, а не светиться равномерно.
       Днём ярче, к сумеркам гаснут. Печётся в ломоть. */
    if(tr.p){
      const sunx=(typeof SUN_DIR==="object")?SUN_DIR.x:.7;
      const dk=dayKq(tr.p);
      if(dk>.12&&Math.abs(sunx)>.05){
        ctx.strokeStyle="rgba(255,248,228,"+(.18+.34*dk).toFixed(2)+")";
        ctx.lineWidth=1.6;
        for(let i=i0;i<i1;i++){
          const hh=hashi(i,tr.p.seed|0,0x3D9);
          if((hh&7)<5)continue;
          const slope=(tr.h[i+1]-tr.h[i])/tr.step;
          if(slope*sunx>-.07)continue;
          if(castAt(CMc,i)>.5)continue;               /* в тени блестеть нечему (P5) */
          const x0=i*tr.step-camx,y0=tr.h[i]-camy;
          const x1=(i+1)*tr.step-camx,y1=tr.h[i+1]-camy;
          const t0=.15+((hh>>>4)&7)/7*.4, t1=Math.min(1,t0+.16+((hh>>>8)&3)/3*.2);
          ctx.beginPath();
          ctx.moveTo(lerp(x0,x1,t0),lerp(y0,y1,t0)+.7);
          ctx.lineTo(lerp(x0,x1,t1),lerp(y0,y1,t1)+.7);
          ctx.stroke();
        }
      }
    }
  }
}
let GROUND_BAKING=false;
/* мелкая крошка на самой кромке — дёшево и оживляет силуэт вблизи */
function drawGroundCrumbs(tr,camx,camy,i0,i1){
  const dstep=Math.max(1,Math.round(14/tr.step));
  ctx.lineWidth=1;
  for(let i=i0;i<i1;i+=dstep){
    const wx=i*tr.step,x=wx-camx;if(x<-6||x>W+6)continue;
    const hh=hashi(Math.floor(wx/14),tr.sseed,0x6E55);
    if((hh&7)===0||(hh&3)!==0)continue;
    ctx.fillStyle="rgba(0,0,0,.22)";
    ctx.beginPath();ctx.arc(x,tr.h[i]-camy-1,1+((hh>>>6)&1),0,TAU);ctx.fill();
  }
}
/* трава кланяется ветру: каждая пучка со своей фазой от координаты,
   иначе весь склон качается одним куском. Единственное живое на кромке */
function drawGroundGrass(tr,camx,camy){
  const i0=clamp(Math.floor((camx-40)/tr.step),0,tr.N-1);
  const i1=clamp(Math.ceil((camx+W+40)/tr.step),0,tr.N-1);
  const dstep=Math.max(1,Math.round(14/tr.step));
  /* три формы куста, а не одна былинка (M232): одиночная травинка, пучок
     веером и низкий кустик дугой. Форма — от места, качаются все в один
     ветер, но пучок сильнее одиночки */
  /* трава — белый блик, и в падающей тени гребня блестеть ей нечем (M434):
     пучки делятся на два пути, освещённый и затенённый, — один лишний stroke
     на кадр, а не по штриху на пучок */
  const PL=new Path2D(),PD=new Path2D();
  const live=(typeof castLive==="function");
  for(let i=i0;i<i1;i+=dstep){
    const wx=i*tr.step,x=wx-camx;if(x<-6||x>W+6)continue;
    const hh=hashi(Math.floor(wx/14),tr.sseed,0x6E55);
    if((hh&7)===0||(hh&3)===0)continue;
    const y=tr.h[i]-camy,th=2+((hh>>>4)&3);
    const sw=WIND*(1.6+th*.5)*(.7+.3*Math.sin(G.t*.045+wx*.07));
    const form=(hh>>>8)&3;
    const P=(live&&castLive(tr,wx)>.5)?PD:PL;
    if(form===1){                              // пучок веером
      for(let b=-1;b<=1;b++){
        P.moveTo(x+b*.8,y);
        P.lineTo(x+b*2.2+sw*1.2,y-th+Math.abs(b));
      }
    }else if(form===2){                        // низкий кустик дугой
      P.moveTo(x-2.2,y);
      P.quadraticCurveTo(x-1.2+sw*.4,y-th*.9,x+sw*.6,y-th*.7);
      P.moveTo(x+2.2,y);
      P.quadraticCurveTo(x+1.2+sw*.4,y-th*.9,x+sw*.6,y-th*.7);
    }else{                                     // одиночная былинка
      P.moveTo(x,y);P.lineTo(x+((hh>>>2)&1?1.4:-1.4)+sw,y-th);
    }
  }
  ctx.lineWidth=1;
  ctx.strokeStyle="rgba(255,255,255,.14)";ctx.stroke(PL);
  ctx.strokeStyle="rgba(255,255,255,.05)";ctx.stroke(PD);
}
/* валуны и осыпь на профиле */
function drawRocks(tr,camx,camy,pal){
  if(!tr.rocks)return;
  /* с материалом валуны уже лежат в ломтях грунта — в кадре их не повторяем */
  if(tr.chunks&&!GROUND_BAKING)return;
  for(const k of tr.rocks){
    const x=k.x-camx;
    if(x<-k.rad-20||x>W+k.rad+20)continue;
    const y=groundAt(tr,k.x)-camy;
    /* контактная тень: без неё валун лежит поверх грунта, а не на нём.
       Смещена в сторону от солнца (оно справа сверху) и вытянута по земле. */
    if(glazeIsForm()){
      ctx.save();ctx.globalAlpha=.7;
      groundShadow(x-k.rad*.35,y+1.5,k.rad*1.5,Math.max(2.2,k.rad*.3));
      ctx.restore();
    }
    ctx.save();ctx.translate(x,y-k.rad*.42);
    if(k.flip)ctx.scale(-1,1);
    const c0=pal[2],c1=pal[4];
    const t=k.tint;
    const P=k.poly;
    /* грани валуна дробим на подотрезки со смещением: ровный многоугольник
       читается как фигура, скол и выкрошенная кромка — как камень */
    const RP=new Path2D();
    RP.moveTo(P[0][0],P[0][1]);
    for(let i=1;i<=P.length;i++){
      const a=P[i-1],b=P[i%P.length];
      for(let s=1;s<=3;s++){
        const u=s/3;
        const hj=hashi(Math.floor(k.x)+i*13,s,0x0BEE)/4294967296-.5;
        const nx=-(b[1]-a[1]),ny=(b[0]-a[0]);
        const nl=Math.hypot(nx,ny)||1,d=hj*Math.min(3.5,k.rad*.22);
        RP.lineTo(lerp(a[0],b[0],u)+nx/nl*d,lerp(a[1],b[1],u)+ny/nl*d);
      }
    }
    RP.closePath();
    if(glazeIsForm()){
      /* верх валуна светлее низа — это и есть вся его форма; цвет придёт
         лессировкой вместе с грунтом, и камень перестанет быть «другой
         породой», покрашенной своей парой ступеней палитры (гризайль M422) */
      const nk=255/Math.max(1,lum3(pal[pal.length-1]));
      /* валун в тени гребня темнеет вместе с землёй под ним (P5): свет один */
      const shk=1-.55*castAt(castMapFor(tr,camx),Math.round(k.x/tr.step));
      const g=ctx.createLinearGradient(0,-k.rad,0,k.rad);
      g.addColorStop(0,greyOf([lerp(c0[0],c1[0],t),lerp(c0[1],c1[1],t),lerp(c0[2],c1[2],t)],.9*nk*shk));
      g.addColorStop(1,greyOf(c0,.32*nk*shk));
      ctx.fillStyle=g;ctx.fill(RP);
      /* та же порода, что под ногами: валун из другого материала выглядит
         принесённым из другой игры */
      if(tr.mat)fillMaterial(tr.mat,camx-x,camy-y+k.rad*.42,.5,.35,RP,
        {x:-k.rad*1.4,y:-k.rad*1.4,w:k.rad*2.8,h:k.rad*2.8});
      ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1;ctx.stroke(RP);
      if(k.rad>7){   // скол на крупных валунах
        ctx.strokeStyle="rgba(255,255,255,.10)";
        ctx.beginPath();ctx.moveTo(P[1][0],P[1][1]);ctx.lineTo(P[3][0]*.3,P[3][1]*.3);ctx.stroke();
      }
    }else if(tr.mat&&tr.p&&typeof planetMatHue==="function"){
      /* жилы и искры того же камня — после лессировки */
      fillMaterial(planetMatHue(tr.p),camx-x,camy-y+k.rad*.42,.85,0,RP,
        {x:-k.rad*1.4,y:-k.rad*1.4,w:k.rad*2.8,h:k.rad*2.8});
    }
    /* ── лишайник на валуне ВЫРАЩЕН (аудит 10×10, §10) ──
       Живые миры зарастают: пещера растит лишайник с M262, а валун наверху —
       у самого света и влаги — оставался голым. Тот же дифференциальный рост
       (growLichen, 22a), контур сплюснут по верхней грани камня, клип по
       телу валуна; красится палитрой мира. Печётся в ломоть — кадру даром. */
    /* лишайник — событие со своим цветом: он зелёный на любой породе, и
       лессировка его бы усреднила. Поэтому он в проходе оттенка (M422) */
    if(k.rad>8&&tr.p&&glazeIsHue()&&["terran","jungle","ocean","toxic"].indexOf(tr.p.type)>=0
       &&typeof growLichen==="function"){
      const rl=rng(hashi(Math.floor(k.x),0x11C4,tr.p.seed|0));
      if(rl()<.6){
        ctx.save();ctx.clip(RP);
        const n=1+(rl()<.35?1:0);
        for(let li=0;li<n;li++){
          const pts=growLichen(rl,4+rl()*4,26);
          const lx=(rl()-.5)*k.rad*.9, ly=-k.rad*(.35+rl()*.4);
          const gcol=[Math.round(lerp(pal[3][0],96,.5)),
                      Math.round(lerp(pal[3][1],132,.35)),
                      Math.round(lerp(pal[3][2],96,.5))];
          ctx.save();ctx.translate(lx,ly);ctx.scale(1,.55);
          ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
          for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
          ctx.closePath();
          ctx.fillStyle="rgba("+gcol.join(",")+",.26)";ctx.fill();
          ctx.strokeStyle="rgba("+gcol.join(",")+",.4)";ctx.lineWidth=.8;ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }
}
