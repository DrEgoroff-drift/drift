/* ══════════════ поверхность: сам мир (выделено из 21e, M415) ══════════════
   `drawSurfaceWorld` — шестьсот строк и три пятых модуля: небо и звёзды,
   дальние гряды кэшем по тайлам, дымка, дождь, ваши постройки, посёлок,
   корабль на шасси, устье шахты, идущие, астронавт, следы, пыль из-под ног и
   ночь. Это МИР; в `21e-surface-draw` остаётся то, что вокруг него, — подсказка,
   HUD, вода и сам кадр `drawSurface`, который их собирает.

   Порядок склейки: `21e1-` ложится сразу за `21e-surface-draw` (байтовый
   порядок: '-' < '1'). Своих `const` на верхнем уровне здесь нет. */
function drawSurfaceWorld(){
  const S=G.surf,tr=S.tr,p=S.p;
  tr.mat=planetMat(p);tr.p=p;
  sunDirSet(p);            /* свет идёт оттуда, где нарисован диск (M242) */
  drawSkyBase(p);
  /* звёзды — до небесных тел: нарисованные после, они просвечивают сквозь
     диск гиганта и убивают его объём */
  if(p.T.atm==="отсутствует"||p.type==="ice")drawStars(S.x*.1,0,1);
  drawSkyLayer(p,S.x,S.y);
  WIND=windOf(p);
  /* камера идёт рядом, а не приклеена: инерция, взгляд вперёд, дыхание,
     тряска от удара (19c-light). Если камеры ещё нет — первый кадр берём по
     персонажу, чтобы не было рывка от нуля. */
  if(!S.cam)S.cam={x:S.x,y:S.y};
  const co=camOffset(S);
  const camx=S.cam.x-W/2+co.x, camy=clamp(S.cam.y-H*SURF_HOR,-300,1e5)+co.y;
  /* единственный источник правды о камере на кадр: по нему же ввод пересчитывает
     тычок в мировую координату (15-input) */
  G.viewX=camx;G.viewY=camy;
  /* дальний хребет не гасится прозрачностью, а выцветает в цвет неба: именно
     этим глаз мерит расстояние (19c-light). Двух слоёв достаточно, третий уже
     не читается, а стоит столько же. */
  /* дальние гряды — кэшем по тайлам (хвост G2, правило G11): силуэт в цвет
     воздуха печётся раз на 512×512 в координатах своего параллакса, кадр
     кладёт картинки. drawGround рисует через W/H, которые withCtx подменяет */
  /* ── у дальнего плана свой профиль (M172) ──
     Оба дальних слоя брали ТУ ЖЕ высоту, что и грунт под ногами, растянув её
     по горизонтали в 3.6 и 2.4 раза. На ширину экрана от рельефа оставалась
     почти прямая: горизонт читался ровной полосой дымки, приклеенной к небу,
     и глазу нечем было мерить расстояние. Даём им собственную амплитуду —
     чем дальше, тем выше и крупнее гряда, — и печём её один раз на планету. */
  /* ── гряда по мерке экрана (автор: «гора в полкадра», M178) ──
     Амплитуда и шаг дальней гряды были одни на все экраны. На узком телефоне
     вертикаль кадра та же, что на мониторе, а горизонталь — треть: в кадр
     попадал ОДИН склон без единой вершины, и полнеба занимала глухая масса.
     Узкому экрану — ниже и чаще: амплитуда и растяжка сжимаются с шириной,
     и в кадре снова гряда с вершинами, а не гора. Тайлы пекутся под свою
     мерку (ключ), поворот телефона просто перепекает их. */
  /* ── у гряды СВОЙ рельеф, а не растянутый здешний (хвост M186) ──
     До сих пор дальние слои брали профиль грунта под ногами и умножали его на
     2.3 и 1.6 вокруг средней. Такой хребет самоподобен земле: та же кривая,
     только громче, — а глаз это узнаёт мгновенно и перестаёт мерить ею даль.
     Отсюда и жалоба «дальняя гряда плоская»: она не плоская, она ЗНАКОМАЯ.

     Гора устроена иначе, чем холм, и разница считается одной строкой: у
     обычного шума гребни круглые, у ГРЕБНЕВОГО (1−|2n−1|) — острые, а долины,
     наоборот, широкие и мягкие. Это и есть хребет: вершины, а не волны.
     Каждая следующая октава берётся с весом предыдущей — тогда мелкие зубцы
     садятся НА склоны крупных, а не сыплются ровным ворсом по всей длине.

     Зерно у слоёв разное: два хребта, повторяющие друг друга в параллаксе, —
     самая заметная фальшь из всех возможных, потому что глаз ловит именно
     повтор. И считается всё один раз на планету: в кадре только drawImage. */
  const FARK=clamp(W/1150,.5,1);
  if(!tr.farH||tr.farK!==FARK){
    let s=0,lo=1e9,hi=-1e9;
    for(let i=0;i<tr.N;i++){s+=tr.h[i];if(tr.h[i]<lo)lo=tr.h[i];if(tr.h[i]>hi)hi=tr.h[i];}
    const mid=s/tr.N, rel=Math.max(60,hi-lo);
    const seed=(tr.p?tr.p.seed:0)|0;
    /* ЧАСТОТА СЧИТАЕТСЯ ОТ ЭКРАНА, А НЕ НА ГЛАЗ. Слой рисуется с шагом
       `step*3.6`, то есть один отсчёт — двадцать с лишним пикселей; чтобы в
       кадре стояло три-четыре вершины, период должен быть около двадцати
       отсчётов. Первый счёт взял .0016 — период в шестьсот отсчётов, один
       горб на тринадцать тысяч единиц мира: гряда вышла ровнее прежней.

       И СРЕДНЕЕ ВЫЧИТАЕТСЯ. У гребневого шума среднее около трети размаха,
       так что нескошенное поле поднимает весь хребет на треть амплитуды —
       вершины уходят за верх кадра, а долины закрывают небо сплошной стеной.
       Ровно это и вышло в первом счёте: не гряда, а заливка. */
    const ridge=(amp,scale,sd,oct)=>{
      const a=new Float32Array(tr.N);
      let s2=0;
      for(let i=0;i<tr.N;i++){
        let v=0,w=1,g=.5,f=scale,acc=0;
        for(let o=0;o<(oct||5);o++){
          /* гребневой шум: острая вершина, мягкая долина */
          let n=1-Math.abs(noise1(i*f,sd+o*97)*2-1);
          n*=n;
          v+=n*g*w;acc+=g;
          /* вес следующей октавы — от нынешней высоты: зубцы садятся НА склоны
             крупных вершин, а не сыплются ровным ворсом по всей длине */
          w=clamp(n*1.5,0,1);
          g*=.52;f*=2.07;
        }
        a[i]=v/acc;s2+=a[i];
      }
      const m2=s2/tr.N;
      for(let i=0;i<tr.N;i++)a[i]=mid-(a[i]-m2)*amp;
      return a;
    };
    tr.farH=[ridge(rel*1.30*FARK,.045,seed^0x8A11,5),
             ridge(rel*0.80*FARK,.052,seed^0x33C7,4)];
    tr.farK=FARK;
  }
  const stpK=.55+.45*FARK;
  /* час и погода входят в ключ гряд (M232): цвет воздуха в hazeFar теперь
     живой, и тайл, испечённый утром или в ясную погоду, обязан перепечься */
  const dwk="|d"+dayKq(p)+"|w"+Math.round(((typeof weatherPower==="function")?weatherPower(p):0)*5)/5;
  S.farA=tileStore(S.farA,"farA|"+p.seed+"|"+DPR+"|"+FARK.toFixed(2)+dwk);
  drawTiles(S.farA,camx*.22,camy*.42+130,(g,wx0,wy0)=>drawGround({h:tr.farH[0],N:tr.N,step:tr.step*3.6*stpK},wx0,wy0,hazeFar(p,.58),null));
  S.farB=tileStore(S.farB,"farB|"+p.seed+"|"+DPR+"|"+FARK.toFixed(2)+dwk);
  drawTiles(S.farB,camx*.35,camy*.5+80,(g,wx0,wy0)=>drawGround({h:tr.farH[1],N:tr.N,step:tr.step*2.4*stpK},wx0,wy0,hazeFar(p,.32),null));
  /* дымка шириной в кисть (M304, §13): была H*.36→.66, стала H*.52→.64 */
  hazeBand(p,H*(SURF_HOR-.03),H*.09);
  /* дальние капли — ДО мира: они падают за грядой и за кораблём (M242) */
  drawWeather(p,camx,camy,"far");
  drawGround(tr,camx,camy,"rgb("+p.T.pal[3].map(v=>Math.round(v*.5)).join(",")+")",
    "rgba(200,240,246,.4)",p.T.pal);
  /* нижняя треть уходит в тень неба: ближний грунт темнее дальнего, и по
     этому глаз мерит глубину (хвост G2) */
  {
    const sh=p.T.sky[1];
    const dg=ctx.createLinearGradient(0,H*(SURF_HOR+.04),0,H);
    dg.addColorStop(0,"rgba("+sh.join(",")+",0)");dg.addColorStop(1,"rgba("+sh.join(",")+",.30)");
    ctx.fillStyle=dg;ctx.fillRect(0,H*(SURF_HOR+.04),W,H*(.96-SURF_HOR));
  }
  drawWater(tr,camx,camy,p);   /* озеро в ложбине, с отражением (M325) */
  drawPOI(tr,camx,camy,p);
  /* средний масштаб между валуном и постройкой — тем же светом и той же
     породой, что грунт под ним (21b-surface-deco) */
  drawDeco(tr,camx,camy,p);
  /* ваши постройки — тем же слоем, что и POI: их видно с земли, заходить
     в меню, чтобы узнать об их существовании, больше не нужно */
  drawBuilt(tr,camx,camy,p);
  /* дом стоит на своей планете (21f, M170) — до него доходят ногами */
  if(typeof drawHomeOut==="function"&&typeof homeHereP==="function"&&homeHereP(p))
    drawHomeOut(tr,camx,camy,p);
  /* посёлок (12t) — тем же слоем, что и постройки: место, к которому игрок идёт
     ногами, обязано быть видно с горизонта, иначе идти не за чем */
  if(settleCanLive(p))settleDraw(settleAt(G.sx,G.sy),tr,camx,camy,p);
  /* Жестянка (12z) — тем же слоем и по тому же правилу: то, к чему игрок идёт
     ногами, видно с горизонта. Там, где стоит она, посёлка не бывает */
  if(tinCanLive(p))tinDraw(tinAt(G.sx,G.sy),tr,camx,camy,p);
  /* чужой знак (11ag) — до валунов переднего плана: он лежит на земле, и камень
     перед ним обязан его закрывать, иначе прорез читается как наклейка */
  if(typeof traceDraw==="function")traceDraw(tr,camx,camy,p);
  drawRocks(tr,camx,camy,p.T.pal);
  /* подглядка стелется по грунту, поэтому ложится до кустов и до валунов
     переднего плана — она часть земли, а не то, что на ней стоит (20c) */
  peepDrawMat(camx,camy);
  /* уезд света (11i): пятна по формам и освещённая площадка — тем же слоем, что мат */
  if(typeof glowDrawPatches==="function"){glowDrawPatches(tr,camx,camy,p);glowDrawPad(S,camx,camy);}
  if(typeof slowDraw==="function")slowDraw(tr,camx,camy,p);   /* выкладка долины (11o) */
  if(typeof passDraw==="function")passDraw(tr,camx,camy,p);   /* корабль перевала (11p) */
  if(typeof placeDraw==="function")placeDraw(tr,camx,camy,p); /* единичные места (11v) */
  /* тень по длине корпуса, а не по прежним 34 px: у нового посадочного силуэта
     она иначе выдаёт игрушку на палочках */
  groundShadow(S.shipX-camx,S.shipY-camy+12,landerLen(G.shipId)*.46,8);
  ctx.save();ctx.translate(S.shipX-camx,S.shipY-camy);
  /* стоим: шасси выпущено, трап спущен, сопла ещё остывают после посадки */
  drawLander(false,false,{gear:1,sq:0,landed:true,tr:S.tr,gx:S.shipX,
    hot:Math.max(0,1-(G.t-(S.t0||0))/700)});
  ctx.restore();
  /* ── ночью корабль живой, а не белое пятно (M243) ──
     На ночных кадрах лендер оставался дневным: самая светлая вещь в кадре без
     единого источника. Теперь в темноте у него горит окно кабины и лежит
     тёплое пятно под брюхом — «внутри кто-то есть», а заодно вторая, тёплая
     температура в холодном кадре. */
  {
    const nite=(typeof surfNight==="function")?surfNight(p):0;
    if(nite>.18){
      const lx=S.shipX-camx, ly=S.shipY-camy;
      const k=clamp((nite-.18)/.35,0,1);
      const gp=ctx.createRadialGradient(lx,ly+13,0,lx,ly+13,52);
      gp.addColorStop(0,"rgba(255,206,138,"+(.20*k).toFixed(3)+")");
      gp.addColorStop(1,"rgba(255,206,138,0)");
      ctx.fillStyle=gp;ctx.beginPath();ctx.ellipse(lx,ly+13,52,15,0,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(255,224,170,"+(.62*k).toFixed(3)+")";
      ctx.fillRect(lx-4,ly-6,9,5);
      const gw=ctx.createRadialGradient(lx,ly-4,0,lx,ly-4,26);
      gw.addColorStop(0,"rgba(255,214,150,"+(.26*k).toFixed(3)+")");
      gw.addColorStop(1,"rgba(255,214,150,0)");
      ctx.fillStyle=gw;ctx.beginPath();ctx.arc(lx,ly-4,26,0,TAU);ctx.fill();
    }
  }
  drawDustMotes(camx,camy,p);
  /* три света (11g): дороги, фундаменты и вход — видны только в соединение */
  if(typeof lightsDrawReveal==="function")lightsDrawReveal(tr,camx,camy,p);
  if(S.cave){
    const cx=S.cave.x-camx;
    if(cx>-60&&cx<W+60){
      const cy=groundAt(tr,S.cave.x)-camy;
      /* ── вход, а не наклейка (M178) ──
         Устье было плоским чёрным полуэллипсом — ровно тот «чёрный полигон
         без кромки», в который автор уже тыкал на валуне. Правило то же:
         у любого силуэта должна быть кромка, поймавшая небо, а у дыры — ещё
         и глубина. Здесь: губа проёма светлее грунта (её лизнуло небо),
         внутри не чернота, а уходящий вглубь тон породы, и пара камней у
         порога, чтобы вход стоял в земле, а не лежал на ней. */
      /* ── пещера, а не полукруг (M327) ──
         Автор: «снаружи это полукруг, надо придумать прям пещеру». Полуэллипс
         с губой оставался дырой, нарисованной НА земле. Пещера — это прежде
         всего СКАЛА: выход породы над устьем, в который дыра уходит. Слои по
         своду (§1, §13): тень под скалой → тёмное тело скалы с неровным
         силуэтом → проём-арка с неровным краем и глубиной → губа, поймавшая
         небо → осыпь у порога. Силуэт сеется от x устья: на одной планете
         пещера всегда одна и та же. */
      const amb=ambRGB(p);
      const rr=rng(hashi(S.cave.x|0,7,0xCA7E));
      const rock=(k,a)=>"rgba("+(amb[0]*k|0)+","+(amb[1]*k|0)+","+(amb[2]*k*1.06|0)+","+(a==null?1:a)+")";
      /* 1. тень под скалой: она стоит на земле, а не приклеена */
      ctx.fillStyle="rgba(0,0,0,.28)";
      ctx.beginPath();ctx.ellipse(cx+4,cy+2,54,5,0,0,TAU);ctx.fill();
      /* 2. тело скалы: девять вершин, левый скат круче, правый — длинный */
      const top=[];
      const hw=44+rr()*10, hh=36+rr()*12;
      for(let i=0;i<=8;i++){
        const t=i/8, x=cx-hw+t*hw*2;
        const prof=Math.sin(t*Math.PI)**.7*(1-.25*Math.abs(t-.42));       /* горб, чуть смещённый влево */
        top.push({x:x+(rr()-.5)*6,y:cy+2-hh*prof-(rr()-.5)*5});
      }
      ctx.fillStyle=rock(.46);
      ctx.beginPath();ctx.moveTo(cx-hw-6,cy+3);
      for(const q of top)ctx.lineTo(q.x,q.y);
      ctx.lineTo(cx+hw+6,cy+3);ctx.closePath();ctx.fill();
      /* слоистость породы: два тёмных горизонта в теле */
      ctx.strokeStyle=rock(.34,.7);ctx.lineWidth=1.2;
      for(const k of [.38,.66]){
        ctx.beginPath();
        for(let i=0;i<top.length;i++){const q=top[i];ctx.lineTo(q.x+(rr()-.5)*3,q.y+(cy+2-q.y)*k);}
        ctx.stroke();
      }
      /* свет сверху: кромка силуэта светлее — небо лизнуло камень */
      ctx.strokeStyle=rock(.98,.75);ctx.lineWidth=1.4;
      ctx.beginPath();for(const q of top)ctx.lineTo(q.x,q.y);ctx.stroke();
      /* 3. проём: арка с неровным краем, нутро уходит в глубину */
      const arch=[[-19,1],[-17,-9],[-13,-19],[-6,-26],[3,-27],[11,-21],[16,-11],[18,1]];
      const ig=ctx.createLinearGradient(cx,cy-26,cx,cy+2);
      ig.addColorStop(0,rock(.22));ig.addColorStop(.5,"rgba(8,10,13,1)");ig.addColorStop(1,"rgba(3,4,6,1)");
      ctx.fillStyle=ig;
      ctx.beginPath();for(const [ax,ay] of arch)ctx.lineTo(cx+ax,cy+ay);ctx.closePath();ctx.fill();
      /* глубина: вторая, меньшая арка темнее — ход поворачивает */
      ctx.fillStyle="rgba(0,0,0,.55)";
      ctx.beginPath();ctx.ellipse(cx+2,cy-6,8,11,0,0,TAU);ctx.fill();
      /* 4. губа проёма: светлая по верхнему краю, где её видит небо */
      ctx.strokeStyle="rgba("+(amb[0]*1.1+34|0)+","+(amb[1]*1.1+36|0)+","+(amb[2]*1.15+42|0)+",.62)";
      ctx.lineWidth=1.8;
      ctx.beginPath();for(let i=1;i<arch.length-1;i++)ctx.lineTo(cx+arch[i][0],cy+arch[i][1]);ctx.stroke();
      /* 5. осыпь у порога: камни разного размера, светлые макушки */
      for(let i=0;i<7;i++){
        const sx=cx+(rr()-.5)*70, r0=1.6+rr()*4, sy=cy-r0*.4+rr()*2;
        if(Math.abs(sx-cx)<14)continue;                    /* не в проходе */
        ctx.fillStyle=rock(.5,.95);ctx.beginPath();ctx.ellipse(sx,sy,r0*1.3,r0,rr()-.5,0,TAU);ctx.fill();
        ctx.fillStyle="rgba(255,255,255,.12)";ctx.beginPath();ctx.ellipse(sx-r0*.3,sy-r0*.5,r0*.7,r0*.35,0,0,TAU);ctx.fill();
      }
      ctx.fillStyle="rgba(93,115,130,.85)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("ПЕЩЕРА",cx,cy-hh-14);
    }
  }
  /* ── устье своей шахты (M234) ──
     Ствол оставался в сохранении, но на грунте от него не было ни следа: автор
     ходил по планете и не мог сказать, где копал. Устье теперь СТОИТ на своём
     месте — по тем же правилам, что вход в пещеру: не чёрная наклейка, а дыра
     с губой, поймавшей небо, отвал породы рядом (её же оттуда и вынули) и
     копёр над ней — вещь, которая отбрасывает тень и ловит свет сверху. */
  {
    const mx=(typeof mineSpotX==="function")?mineSpotX(p):null;
    const sx=mx!=null?mx-camx:null;
    if(sx!=null&&sx>-70&&sx<W+70){
      const sy=groundAt(tr,mx)-camy;
      const amb=ambRGB(p);
      /* железо копра — не грунт: своя, холодная светлота, иначе на тёмной
         планете вся постройка сходится в один чёрный силуэт (закон 4) */
      const iron=(k,a)=>"rgba("+(amb[0]*.4+34*k|0)+","+(amb[1]*.4+38*k|0)+","+(amb[2]*.4+44*k|0)+","+a+")";
      /* отвал: то, что вынесли наверх, лежит горкой сбоку — с тенью под ней */
      groundShadow(sx+22,sy+1,13,3);
      /* отвал и яма сделаны из ТОГО ЖЕ грунта, что под ними: цвет не задаётся,
         а гасится умножением по уже нарисованной земле. Палитра планеты для
         этого не годится — видимый грунт складывается ещё и из материала со
         светом, и любой «свой» цвет садится рядом чужим пятном. */
      ctx.save();ctx.globalCompositeOperation="multiply";
      ctx.fillStyle="rgba(124,122,126,1)";
      ctx.beginPath();ctx.moveTo(sx+8,sy+1);ctx.quadraticCurveTo(sx+22,sy-11,sx+36,sy+1);ctx.fill();
      ctx.restore();
      ctx.fillStyle="rgba(255,255,255,.16)";
      ctx.beginPath();ctx.moveTo(sx+13,sy-2.5);ctx.quadraticCurveTo(sx+22,sy-10,sx+30,sy-2.5);
      ctx.quadraticCurveTo(sx+22,sy-6.5,sx+13,sy-2.5);ctx.fill();
      /* ствол: яма, а не чёрный ящик. Прямоугольник в 22 px на склоне торчал
         из грунта коробкой — дыра идёт полуэллипсом ВНИЗ от линии земли, как
         устье пещеры идёт полуэллипсом вверх, и на любом уклоне остаётся ямой.
         Сверху ещё видно породу, ко дну она гаснет — но не в общую черноту, а
         в свою же (та же ошибка, что чинили в пещере на 0.226.0). */
      ctx.save();ctx.globalCompositeOperation="multiply";
      const gg=ctx.createLinearGradient(sx,sy-2,sx,sy+11);
      gg.addColorStop(0,"rgba(150,148,154,1)");
      gg.addColorStop(.5,"rgba(74,72,78,1)");
      gg.addColorStop(1,"rgba(38,37,42,1)");
      ctx.fillStyle=gg;
      ctx.beginPath();ctx.ellipse(sx,sy-1,12,10,0,0,Math.PI);ctx.fill();
      ctx.restore();
      /* срез породы по краю: две светлые засечки на самой линии земли — по ним
         яма и читается ямой, а не пятном (закон 3) */
      ctx.strokeStyle="rgba(255,255,255,.22)";
      ctx.lineWidth=1.6;ctx.beginPath();
      ctx.moveTo(sx-13.5,sy-1.3);ctx.lineTo(sx-5,sy-1.3);
      ctx.moveTo(sx+5,sy-1.3);ctx.lineTo(sx+13.5,sy-1.3);ctx.stroke();
      /* копёр: две ноги и балка, тень от него на грунте */
      groundShadow(sx-2,sy+1,16,2.6);
      ctx.strokeStyle=iron(1,1);ctx.lineWidth=2.2;
      ctx.beginPath();
      ctx.moveTo(sx-12,sy-3);ctx.lineTo(sx-6,sy-25);
      ctx.moveTo(sx+12,sy-3);ctx.lineTo(sx+6,sy-25);
      ctx.moveTo(sx-7.4,sy-25);ctx.lineTo(sx+7.4,sy-25);
      /* распорка: без неё две ноги читаются циркулем, а не станком */
      ctx.moveTo(sx-9.4,sy-14);ctx.lineTo(sx+9.4,sy-14);
      ctx.stroke();
      /* верхняя кромка балки и ноги, обращённой к небу, ловит свет (закон 3) */
      ctx.strokeStyle=iron(2.1,.75);ctx.lineWidth=1;
      ctx.beginPath();
      ctx.moveTo(sx-7.4,sy-26.1);ctx.lineTo(sx+7.4,sy-26.1);
      ctx.moveTo(sx-11,sy-3.6);ctx.lineTo(sx-5.2,sy-24.4);ctx.stroke();
      /* шкив и трос: трос покачивается от ветра — движение, а не мигание */
      ctx.fillStyle=iron(1.3,1);
      ctx.beginPath();ctx.arc(sx,sy-25,3,0,TAU);ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.16)";ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(sx,sy-25,3,Math.PI*1.1,Math.PI*1.9);ctx.stroke();
      /* ── трос висит, а не нарисован (M245) ──
         Была парабола с синусом — то есть верёвка, у которой нет ни веса, ни
         инерции: качается ровно, как метроном. Теперь это верёвка на Верле
         (18d): семь точек, верхняя прибита к шкиву, остальные висят и ловят
         тот же WIND, что качает траву. Состояние живёт на G.surf и не
         сохраняется — эфемерное не хранят. */
      if(!S.vMine||S.vMineX!==Math.round(mx)){
        S.vMine=vRope(7,0,0,3.4,{grav:.14,wind:.9});S.vMineX=Math.round(mx);
      }
      vStep(S.vMine,1);
      vDrawRope(S.vMine,sx,sy-22,iron(.8,.85),1.4);
      ctx.fillStyle="rgba(93,115,130,.85)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("ШАХТА",sx,sy-32);
    }
  }
  const WT=(typeof waterOf==="function")?waterOf(tr,p):null;   /* в зеркале озера ничего не растёт (M325) */
  for(const pl of S.plants){
    const x=pl.x-camx;if(x<-70||x>W+70)continue;
    if(WT&&pl.x>WT.x0&&pl.x<WT.x1)continue;
    groundShadow(x,pl.y-camy+1,Math.min(22,pl.h*.32),3.2);
    /* растение кланяется от основания: высокое сильнее низкого, у каждого своя
       фаза от координаты — иначе куртина качается одним куском */
    const sw=WIND*.055*(.6+pl.h/90)*(.75+.25*Math.sin(G.t*.028+pl.x*.05));
    const z=pl.z||0;
    ctx.save();ctx.translate(x,pl.y-camy);ctx.rotate(sw);
    /* глубина куртины (автор, 24.08.2026): дальние мельче, ближние крупнее.
       Одного размера мало — дальнее ещё и выцветает в воздух, поэтому сверху
       ложится вуаль цвета неба. Без неё заросли остаются плоской аппликацией */
    /* вуаль воздуха теперь в самом цвете растения (20-life), альфа остаётся
       лишь лёгкой добавкой: прозрачность на однотонном мире ничего не делит */
    if(z){ctx.scale(1-z*.22,1-z*.22);ctx.globalAlpha=1-z*.12;}
    drawPlant(pl,0,0,z*.62);
    ctx.restore();
  }
  for(const b of S.fauna||[]){
    const x=b.x-camx;if(x<-50||x>W+50)continue;
    groundShadow(x,b.y-camy+1,b.r*.9,2.6);
    drawBeast(b,x,b.y-camy,false,0);
    if(b.scanned){
      ctx.fillStyle="rgba(127,230,216,.75)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("ИЗУЧЕН",x,b.y-camy-b.r*2.6);
    }
  }
  /* идущие — позади астронавта и поверх кустов: они на лугу, а не за ним (20c) */
  peepGhosts(camx,camy);
  for(const d of S.deposits){
    if(d.left<=0)continue;
    const x=d.x-camx;if(x<-50||x>W+50)continue;
    const y=d.y-camy,col=RES[d.res].col;
    /* тело залежи — выход породы по виду сырья (21b, M169): три треугольника
       и пульсирующий круг были значком интерфейса, приклеенным к миру */
    const near=clamp(1-Math.abs(d.x-S.x)/120,0,1);
    drawDeposit(x,y,d.res,d.left,near,d.x,p.T.pal[3]);
    if(Math.abs(d.x-S.x)<70){
      ctx.fillStyle=col;ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      /* соседние залежи разводим по высоте: рядом стоящие подписи наезжали друг
         на друга и читались как каша из двух названий */
      ctx.fillText(RES[d.res].ru.toUpperCase()+" "+d.left,x,y-24-(Math.round(d.x/60)%2)*11);
    }
    if(S.mining===d){
      ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x-18,y-20,36,4);
      ctx.fillStyle=col;ctx.fillRect(x-18,y-20,36*clamp(d.prog,0,1),4);
    }
  }
  /* астронавт рисуется по своей координате, а не в центре экрана: с инерцией
     и взглядом вперёд центр экрана — уже не он */
  const x=S.x-camx,y=S.y-camy;
  /* следы гаснут за минуту: пыль оседает, и тропа остаётся только там, где
     ходили только что — так видно, откуда пришёл */
  /* ── след — вдавленность, а не чёрточка поверх кромки (M234) ──
     Отпечаток рисовался ВЫШЕ линии земли и перекрывал светлую кромку грунта:
     по гребню шла пунктирная дыра, и на ходу она читалась как мигание (закон 3
     — у силуэта есть кромка, и рвать её нечем). Теперь ямка лежит НИЖЕ линии,
     в самом грунте, а сверху её держит светлая губа — как у настоящего следа
     в пыли. И гаснет он ровно: полжизни держится, полжизни выцветает, поэтому
     свежий след не появляется полупрозрачным призраком. */
  if(S.tracks&&S.tracks.length){
    for(const tk of S.tracks){
      const age=G.t-tk.t;if(age>TRACK_LIFE)continue;
      const tx=tk.x-camx;if(tx<-10||tx>W+10)continue;
      const a=clamp(1-(age-TRACK_LIFE*.5)/(TRACK_LIFE*.5),0,1);
      const ty=groundAt(tr,tk.x)-camy;
      ctx.fillStyle="rgba(0,0,0,"+(.34*a).toFixed(3)+")";
      ctx.fillRect(tx-2.4,ty+.3,4.8,1.5);
      ctx.fillStyle="rgba(255,255,255,"+(.10*a).toFixed(3)+")";
      ctx.fillRect(tx-2.4,ty-.4,4.8,.7);
    }
  }
  /* клубы пыли из-под ног (M232): расходятся и тают за спиной ходока */
  if(S.dust)for(const dp of S.dust){
    const age=(G.t-dp.t)/46;if(age>=1)continue;
    const dx2=dp.x-camx;if(dx2<-20||dx2>W+20)continue;
    const dy2=groundAt(tr,dp.x)-camy;
    ctx.fillStyle="rgba(214,198,172,"+((1-age)*.22).toFixed(3)+")";
    ctx.beginPath();
    ctx.ellipse(dx2-dp.f*age*5,dy2-1-age*4,1.5+age*4.5,1+age*2.6,0,0,TAU);ctx.fill();
  }
  const swimW=(S.swim>0&&typeof waterOf==="function")?waterOf(tr,p):null;
  if(S.on&&!swimW)groundShadow(x,y+1,7,2);
  ctx.save();
  /* в воде (M327): ниже уреза тела не видно — скафандр режется по воде, а не
     висит ногами над зеркалом */
  if(swimW&&S.swim>.5){ctx.beginPath();ctx.rect(x-40,y-80,80,(swimW.y-camy)-(y-80)+1);ctx.clip();}
  ctx.translate(x,y-1);
  /* ободок берётся из положения звезды: слева она или справа и высоко ли (M172) */
  const SR=sunSpot(p);
  const rim=SR.up?clamp((SR.x-x)/(W*.4),-1,1)*clamp(.35+SR.alt,0,1):0;
  drawAstronaut({face:S.face,amp:S.walkAmp,phase:S.walkPhase,sun:rim,
    air:!S.on,jet:!!S.jetOn,mining:!!S.mining,suitLow:S.suit<25});
  ctx.restore();
  /* спасательный круг (M327): надувается, когда скафандр входит в воду, —
     поэтому и плывёт. Тело с обводом и одним светом: рыжий тор, блик сверху,
     кольца волны от него по зеркалу */
  if(S.swim>0){
    const k=S.swim,wy=swimW?swimW.y-camy:y-1;
    ctx.save();ctx.globalAlpha=k;
    ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=4.6;
    ctx.beginPath();ctx.ellipse(x,wy-1.5,8.5*k+1,3.4,0,0,TAU);ctx.stroke();
    ctx.strokeStyle="rgb(226,116,58)";ctx.lineWidth=3.4;
    ctx.beginPath();ctx.ellipse(x,wy-1.5,8.5*k+1,3.4,0,0,TAU);ctx.stroke();
    ctx.strokeStyle="rgba(255,226,190,.55)";ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(x,wy-2.6,8.5*k+1,3.2,0,Math.PI*1.12,Math.PI*1.88);ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,.22)";ctx.lineWidth=1;
    for(const ph of [0,.5]){
      const t=((G.t*.012+ph)%1+1)%1;
      ctx.globalAlpha=k*(1-t)*.8;
      ctx.beginPath();ctx.ellipse(x,wy+.5,10+t*22,2+t*4,0,0,TAU);ctx.stroke();
    }
    ctx.restore();
  }
  if(S.mining){
    ctx.strokeStyle="rgba(242,178,92,.7)";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(x+S.face*6,y+2);
    ctx.lineTo(S.mining.x-camx,S.mining.y-camy-4);ctx.stroke();
  }
  /* лучи и свёртка — последними, поверх всего мира и до приборов: приборы
     должны остаться читаемыми, их виньетка касаться не должна */
  /* погода поверх мира, но под лучами и свёрткой: осадки идут перед игроком,
     а свет и цветокоррекция ложатся уже на всё вместе */
  drawForeground(tr,camx,camy,p);
  drawWeather(p,camx,camy,"near");
  /* ── ночь (хвост G12) ──
     Кадр уходит в тень неба, и единственный свет — фонарь скафандра: спрайт
     один на игру, кладётся одним drawImage, чуть впереди по взгляду */
  {
    const nite=surfNight(p);
    if(nite>.02){
      /* ── ночь как СТРОЙ ЗНАЧЕНИЙ, а не заливка (M172) ──
         Прежде на весь кадр клали один прямоугольник: небо и земля темнели
         одинаково, силуэт хребта пропадал, и ночь читалась туманом. Небо
         ночью само по себе светлее земли — на этом и держится вся ночная
         картинка: гасим низ сильно, верх слабо, и горизонт остаётся линией. */
      const ng=ctx.createLinearGradient(0,0,0,H);
      ng.addColorStop(0,"rgba(4,7,20,"+(nite*.40).toFixed(3)+")");
      ng.addColorStop(.5,"rgba(4,7,18,"+(nite*.52).toFixed(3)+")");
      ng.addColorStop(.66,"rgba(3,5,14,"+(nite*.74).toFixed(3)+")");
      ng.addColorStop(1,"rgba(2,3,10,"+(nite*.90).toFixed(3)+")");
      ctx.fillStyle=ng;ctx.fillRect(0,0,W,H);
      /* ── контровая кромка (экспедиция-2, свод §15: day-for-night) ──
         Кино снимает ночь по правилам: контровой свет рисует РИМ на силуэтах,
         иначе они тают. Холодный волосок неба по кромке рельефа — «лунная»
         каёмка; леджер давал ночи contrast .21 — это её недостающий край. */
      if(nite>.25){
        const st=tr.step;
        const iA=clamp(Math.floor(camx/st)-1,0,tr.N-1),
              iB=clamp(Math.ceil((camx+W)/st)+1,0,tr.N-1);
        ctx.strokeStyle="rgba(168,198,232,"+(.24*nite).toFixed(3)+")";
        ctx.lineWidth=1.1;
        ctx.beginPath();
        for(let i=iA;i<=iB;i++){
          const x=i*st-camx,y=tr.h[i]-camy;
          if(i===iA)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
      /* след севшей звезды у горизонта с её стороны: полоса, по которой видно,
         куда именно она ушла, — иначе ночь одинакова во все стороны */
      const SS=sunSpot(p);
      if(!SS.up&&SS.alt>-.55){
        const k=clamp((SS.alt+.55)/.47,0,1);
        const gg=ctx.createRadialGradient(SS.x,H*.60,0,SS.x,H*.60,W*.42);
        const sc2=hex2rgb((G.sys&&G.sys.cls&&G.sys.cls.col)||"#ffe08a");
        gg.addColorStop(0,rgba(sc2,.20*k));gg.addColorStop(1,"rgba(0,0,0,0)");
        ctx.save();ctx.globalCompositeOperation="lighter";
        ctx.fillStyle=gg;ctx.fillRect(0,H*.30,W,H*.45);ctx.restore();
      }
      /* ── фонарь стал фонарём ──
         Был симметричный шар в 150 px вокруг головы: человек светился сам.
         Теперь это налобник — узкий конус вперёд по взгляду, горячее пятно
         там, куда он упёрся в землю, и слабый ореол у самого шлема. */
      /* ── СВЕТИТ ЗЕМЛЯ, А НЕ ВОЗДУХ (автор, 24.08.2026) ──
         Первый заход клал молочный клин поверх мира — и поверх неба заодно.
         Свет так не работает: видно не луч, а ОСВЕЩЁННОЕ. Поэтому теперь
         основная работа идёт по грунту: полоса вдоль профиля рельефа перед
         человеком светлеет по-настоящему (сложение поверх породы, материал
         остаётся виден), с затуханием по дальности и мягким краем. Луч в
         воздухе остался, но еле заметный и узкий — столько, сколько
         рассеивает пыль. */
      const f=S.face||1, hx=x+f*2, hy=y-8;
      const reach=170;
      ctx.save();ctx.globalCompositeOperation="lighter";
      /* 1. освещённый грунт */
      {
        /* полоса начинается чуть ПОЗАДИ ног: если её обрезать ровно по человеку,
           у света остаётся вертикальная кромка, и он читается наклейкой */
        const x0=S.x-f*30, x1=S.x+f*reach;
        const lo=Math.min(x0,x1), hi=Math.max(x0,x1), stp=Math.max(4,(hi-lo)/26);
        /* Полоса идёт ВДОЛЬ профиля и неглубоко. Прежде она шла от профиля до
           нижней кромки кадра — и фонарь высветлял весь столб геологического
           разреза до самого низа, с бритвенно-ровной вертикальной кромкой по
           обе стороны. Свет не проходит сквозь породу; в разрезе освещён
           верхний слой, и край его должен быть мягким */
        const band=(d)=>{
          const P=new Path2D();
          P.moveTo(lo-camx,groundAt(tr,lo)-camy);
          for(let wx=lo;wx<=hi;wx+=stp)P.lineTo(wx-camx,groundAt(tr,wx)-camy);
          P.lineTo(hi-camx,groundAt(tr,hi)-camy);
          for(let wx=hi;wx>=lo;wx-=stp)P.lineTo(wx-camx,groundAt(tr,wx)-camy+d);
          P.lineTo(lo-camx,groundAt(tr,lo)-camy+d);
          P.closePath();return P;
        };
        const K=clamp(nite*1.3,0,1);
        /* затухание по дальности от ног, а не от края экрана; на обоих концах
           ноль, иначе полоса обрывается ступенькой */
        const paint=(d,k)=>{
          /* тон насыщеннее (леджер кадров: грунт ночь pair 0%): почти белый
             свет прибор не считал тёплым — и глаз тоже; лампа накаливания
             против синей ночи — та самая пара температур */
          const gl=ctx.createLinearGradient(x-f*30,y,x+f*reach,y+40);
          gl.addColorStop(0,"rgba(255,222,164,0)");
          gl.addColorStop(.20,"rgba(255,222,164,"+(.36*K*k).toFixed(3)+")");
          gl.addColorStop(.42,"rgba(255,212,148,"+(.46*K*k).toFixed(3)+")");
          gl.addColorStop(.78,"rgba(255,204,138,"+(.15*K*k).toFixed(3)+")");
          gl.addColorStop(1,"rgba(255,198,130,0)");
          ctx.save();ctx.clip(band(d));
          ctx.fillStyle=gl;
          ctx.fillRect(Math.min(x-f*30,x+f*reach)-8,y-90,reach+46,H);
          ctx.restore();
        };
        /* спад вглубь набирается слоями: четыре тонких полосы вместо одной
           толстой, иначе у света в разрезе видно донную кромку. Площадь
           крошечная (170×40), на кадре это не стоит ничего */
        paint(66,.14);paint(42,.26);paint(26,.26);paint(14,.28);paint(6,.30);
      }
      /* 2. луч в воздухе: узкий, слабый и только там, где есть чем рассеивать */
      if(p.T.atm!=="отсутствует"){
        ctx.globalAlpha=clamp(nite*1.25,0,1);
        const drop=(groundAt(tr,S.x+f*reach)-camy)-hy;
        const cone=ctx.createLinearGradient(hx,hy,hx+f*reach,hy+drop*.6);
        cone.addColorStop(0,"rgba(255,238,205,.13)");
        cone.addColorStop(.5,"rgba(255,232,190,.05)");
        cone.addColorStop(1,"rgba(255,226,175,0)");
        ctx.fillStyle=cone;
        ctx.beginPath();
        ctx.moveTo(hx,hy-2);ctx.lineTo(hx,hy+2.5);
        ctx.lineTo(hx+f*reach,hy+drop*.5+20);
        ctx.lineTo(hx+f*reach,hy+drop*.5-16);
        ctx.closePath();ctx.fill();
        ctx.globalAlpha=1;
      }
      const LS=glowSprite("suitlamp",()=>{
        const g=ctx.createRadialGradient(0,0,0,0,0,1);
        g.addColorStop(0,"rgba(255,236,200,.55)");g.addColorStop(.35,"rgba(255,236,200,.22)");
        g.addColorStop(1,"rgba(255,236,200,0)");
        ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);
      });
      ctx.globalAlpha=clamp(nite*.8,0,1);
      glowBlit(LS,hx+f*6,hy,34);
      ctx.restore();
    }
  }
  lightShafts(p);
  gradePass(p);
}
