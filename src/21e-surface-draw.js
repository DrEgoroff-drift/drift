/* ══════════════ поверхность: подсказка, HUD и кадр ══════════════
   Отрезано от 21-mode-surface на распиле 0.108.x: вход и ход остались там,
   подсказка, навигационные метки и отрисовка кадра — здесь. */
function surfaceHint(){
  const S=G.surf;if(!S)return null;
  const dShip=Math.abs(S.x-S.shipX);
  if(S.suit<35)return "СКАФАНДР НА ИСХОДЕ · К КОРАБЛЮ ИЛИ КНОПКА → КОРАБЛЬ";
  if(dShip<shipZoneR()){
    if(baseAt(G.sx,G.sy,S.p.idx))return "ЗДЕСЬ ВАША БАЗА · ДЕЙСТВИЕ — СПУСТИТЬСЯ ВНИЗ";
    if(S.p.type!=="gas")return "У КОРАБЛЯ МОЖНО ЗАЛОЖИТЬ БАЗУ · ДЕЙСТВИЕ · 2500 КР + 10 СПЛАВОВ";
  }
  if(S.cave&&Math.abs(S.cave.x-S.x)<34)return "ВХОД В ПЕЩЕРУ · ДЕЙСТВИЕ — ВНУТРЬ";
  if(!G.surfTipShown||G.t-G.surfTipShown<900){
    if(!G.surfTipShown)G.surfTipShown=G.t;
    return "ЦВЕТНЫЕ КРИСТАЛЛЫ — ЗАЛЕЖИ · СТРЕЛКИ СВЕРХУ ВЕДУТ К ПЕЩЕРЕ И КОРАБЛЮ";
  }
  return null;
}
function drawSurfaceHud(camx,camy,K){
  K=K||1;
  const S=G.surf;
  ctx.textAlign="center";
  /* строка-подсказка сверху */
  /* Полоса идёт ниже приборов: сверху слева датчики, справа сводка системы,
     справа же колонка кнопок — туда текст залезать не должен.
     Высоту приборов больше не угадываем константой: состав строк меняется по
     экрану (скафандр, ранец, критическое топливо), и 58 px, посчитанные под
     три строки, под пятью оказывались внутри полосы. `HUD_BAND` (28-loop)
     меряет её по DOM, здесь только отступ. */
  /* HUD_BAND измерен по DOM, то есть в настоящих пикселях экрана; здесь мы
     рисуем в UI-мерке, поэтому его надо в неё же и перевести (M221) */
  const U=(typeof UIK==="number"&&UIK>0)?UIK:1;
  const TOP=Math.max(58,(typeof HUD_BAND==="number"?HUD_BAND/U:58)+10), RIGHT_PAD=118;
  const hint=surfaceHint();
  if(hint){
    ctx.font="10px ui-monospace,monospace";
    /* длинная подсказка не вылезает за плашку — ужимается с многоточием (M167) */
    let ht=hint;
    const maxW=W-RIGHT_PAD-34;
    while(ht.length>4&&ctx.measureText(ht).width>maxW)ht=ht.slice(0,-4)+"…";
    const w=Math.min(W-RIGHT_PAD-20,ctx.measureText(ht).width+22);
    const cx=(W-RIGHT_PAD)/2;
    ctx.fillStyle="rgba(5,7,12,.72)";ctx.fillRect(cx-w/2,TOP,w,20);
    ctx.strokeStyle="rgba(127,230,216,.28)";ctx.lineWidth=1;
    ctx.strokeRect(cx-w/2+.5,TOP+.5,w-1,19);
    ctx.fillStyle="rgba(190,235,240,.92)";ctx.fillText(ht,cx,TOP+14);
  }
  /* навигатор: маркеры цели у верхней кромки — корабль и пещера */
  const marks=[];
  marks.push({x:S.shipX,ru:"КОРАБЛЬ",col:"rgba(242,178,92,.9)"});
  if(S.cave)marks.push({x:S.cave.x,ru:"ПЕЩЕРА",col:"rgba(150,225,255,.9)"});
  if(typeof lightsOpen==="function"&&lightsOpen(S.p))marks.push({x:lightsEntryX(S.tr,S.p),ru:"ВХОД",col:"rgba(255,236,190,.9)"});
  /* дом (M170): до него надо дойти, значит его надо и найти — свой маркер,
     тёплого цвета, чтобы не путать с кораблём */
  if(typeof homeHereP==="function"&&homeHereP(S.p)){
    const hx=homeSpotX(S.p,S.tr);
    if(hx!=null)marks.push({x:hx,ru:"ДОМ",col:"rgba(255,206,138,.95)"});
  }
  /* достопримечательность ведут отдельно от пещеры: до неё далеко, и без
     маркера игрок пройдёт мимо ровно того, ради чего стоило садиться */
  const poi=nearestPOI(S.tr,S.x);
  if(poi)marks.push({x:poi.x,ru:poi.ru,col:"rgba(212,180,255,.9)"});
  /* фишки у кромки (M167): далёкая цель — плашка у левого или правого края,
     по стороне, где она; фишки одной стороны стоят столбиком и не наезжают
     ни друг на друга, ни на солнце в небе. Ближняя цель — засечка на месте. */
  ctx.font="9px ui-monospace,monospace";
  let leftY=(hint?TOP+34:TOP+6),rightY=leftY,rowY=leftY;
  for(let mi=0;mi<marks.length;mi++){
    const m=marks[mi];
    const d=m.x-S.x, ad=Math.abs(d);
    ctx.fillStyle=m.col;
    if(ad*K>W*.45){                       // цель за краем — фишка у своей кромки
      const dir=Math.sign(d);
      const label=m.ru+" "+Math.round(ad)+" м";
      const tw=ctx.measureText(label).width,cw=tw+24,ch=15;
      const rx=dir>0?W-RIGHT_PAD-8-cw:8;
      const ry=dir>0?(rightY+=0,rightY):(leftY+=0,leftY);
      if(dir>0)rightY+=ch+4;else leftY+=ch+4;
      ctx.fillStyle="rgba(5,7,12,.72)";ctx.fillRect(rx,ry,cw,ch);
      ctx.strokeStyle=m.col;ctx.globalAlpha=.5;ctx.lineWidth=1;ctx.strokeRect(rx+.5,ry+.5,cw-1,ch-1);ctx.globalAlpha=1;
      ctx.fillStyle=m.col;
      const ax=dir>0?rx+cw-7:rx+7;
      ctx.beginPath();
      ctx.moveTo(ax+dir*4,ry+ch/2);ctx.lineTo(ax-dir*3,ry+ch/2-4);ctx.lineTo(ax-dir*3,ry+ch/2+4);
      ctx.closePath();ctx.fill();
      const old=ctx.textAlign;ctx.textAlign=dir>0?"right":"left";
      ctx.fillText(label,dir>0?rx+cw-14:rx+14,ry+11);
      ctx.textAlign=old;
    }else{
      const sx=clamp((m.x-camx)*K,64,W-RIGHT_PAD-14);
      rowY+=13;
      ctx.fillRect(sx-1,rowY-5,2,10);
      ctx.fillText(m.ru,sx,rowY+16);
    }
  }
}
function drawSurfaceWorld(){
  const S=G.surf,tr=S.tr,p=S.p;
  tr.mat=planetMat(p);tr.p=p;
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
  S.farA=tileStore(S.farA,"farA|"+p.seed+"|"+DPR+"|"+FARK.toFixed(2));
  drawTiles(S.farA,camx*.22,camy*.42+130,(g,wx0,wy0)=>drawGround({h:tr.farH[0],N:tr.N,step:tr.step*3.6*stpK},wx0,wy0,hazeFar(p,.58),null));
  S.farB=tileStore(S.farB,"farB|"+p.seed+"|"+DPR+"|"+FARK.toFixed(2));
  drawTiles(S.farB,camx*.35,camy*.5+80,(g,wx0,wy0)=>drawGround({h:tr.farH[1],N:tr.N,step:tr.step*2.4*stpK},wx0,wy0,hazeFar(p,.32),null));
  hazeBand(p,H*(SURF_HOR-.06),H*.22);
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
      const amb=ambRGB(p);
      /* нутро: сверху ещё чуть подсвечено, вглубь гаснет */
      const ig=ctx.createLinearGradient(cx,cy-16,cx,cy+2);
      ig.addColorStop(0,"rgba("+(amb[0]*.30|0)+","+(amb[1]*.32|0)+","+(amb[2]*.36|0)+",1)");
      ig.addColorStop(.55,"rgba(8,10,13,1)");
      ig.addColorStop(1,"rgba(4,5,7,1)");
      ctx.fillStyle=ig;
      ctx.beginPath();ctx.ellipse(cx,cy-2,20,14,0,0,Math.PI,true);ctx.fill();
      /* губа проёма: светлая дуга по верхнему краю */
      ctx.strokeStyle="rgba("+(amb[0]*1.1+34|0)+","+(amb[1]*1.1+36|0)+","+(amb[2]*1.15+42|0)+",.6)";
      ctx.lineWidth=1.8;
      ctx.beginPath();ctx.ellipse(cx,cy-2,20,14,0,Math.PI*1.08,Math.PI*1.92);ctx.stroke();
      /* камни у порога */
      ctx.fillStyle="rgba("+(amb[0]*.5|0)+","+(amb[1]*.5|0)+","+(amb[2]*.55|0)+",.9)";
      ctx.beginPath();ctx.ellipse(cx-16,cy-1,5,3.4,-.3,0,TAU);ctx.fill();
      ctx.beginPath();ctx.ellipse(cx+14,cy,6,3.8,.2,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,.10)";
      ctx.beginPath();ctx.ellipse(cx-17,cy-2.4,3.4,1.2,-.3,0,TAU);ctx.fill();
      ctx.beginPath();ctx.ellipse(cx+12,cy-1.6,4,1.4,.2,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(93,115,130,.85)";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillText("ПЕЩЕРА",cx,cy-24);
    }
  }
  for(const pl of S.plants){
    const x=pl.x-camx;if(x<-70||x>W+70)continue;
    groundShadow(x,pl.y-camy+1,Math.min(22,pl.h*.32),3.2);
    /* растение кланяется от основания: высокое сильнее низкого, у каждого своя
       фаза от координаты — иначе куртина качается одним куском */
    const sw=WIND*.055*(.6+pl.h/90)*(.75+.25*Math.sin(G.t*.028+pl.x*.05));
    const z=pl.z||0;
    ctx.save();ctx.translate(x,pl.y-camy);ctx.rotate(sw);
    /* глубина куртины (автор, 24.08.2026): дальние мельче, ближние крупнее.
       Одного размера мало — дальнее ещё и выцветает в воздух, поэтому сверху
       ложится вуаль цвета неба. Без неё заросли остаются плоской аппликацией */
    if(z){ctx.scale(1-z*.22,1-z*.22);ctx.globalAlpha=1-z*.30;}
    drawPlant(pl,0,0);
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
  if(S.tracks&&S.tracks.length){
    for(const tk of S.tracks){
      const age=G.t-tk.t;if(age>2400)continue;
      const tx=tk.x-camx;if(tx<-10||tx>W+10)continue;
      const ty=groundAt(tr,tk.x)-camy;
      ctx.fillStyle="rgba(0,0,0,"+(.45*(1-age/2400)).toFixed(3)+")";
      ctx.fillRect(tx-2.6,ty-1.2,5.2,1.6);
      ctx.fillStyle="rgba(255,255,255,"+(.08*(1-age/2400)).toFixed(3)+")";
      ctx.fillRect(tx-2.6,ty+.4,5.2,.8);
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
  if(S.on)groundShadow(x,y+1,7,2);
  ctx.save();ctx.translate(x,y-1);
  /* ободок берётся из положения звезды: слева она или справа и высоко ли (M172) */
  const SR=sunSpot(p);
  const rim=SR.up?clamp((SR.x-x)/(W*.4),-1,1)*clamp(.35+SR.alt,0,1):0;
  drawAstronaut({face:S.face,amp:S.walkAmp,phase:S.walkPhase,sun:rim,
    air:!S.on,jet:!!S.jetOn,mining:!!S.mining,suitLow:S.suit<25});
  ctx.restore();
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
  drawWeather(p,camx,camy);
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
          const gl=ctx.createLinearGradient(x-f*30,y,x+f*reach,y+40);
          gl.addColorStop(0,"rgba(255,238,206,0)");
          gl.addColorStop(.20,"rgba(255,238,206,"+(.34*K*k).toFixed(3)+")");
          gl.addColorStop(.42,"rgba(255,234,196,"+(.44*K*k).toFixed(3)+")");
          gl.addColorStop(.78,"rgba(255,228,182,"+(.14*K*k).toFixed(3)+")");
          gl.addColorStop(1,"rgba(255,224,170,0)");
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

/* ── масштаб мира под размер окна (M217) ──
   Жалоба внешнего плейтеста: «двадцать секунд не мог найти себя на поверхности».
   Дело было не в рисунке ходока, а в мерке: камера шла ровно по пикселю, и
   рост человека мерился монитором, а не кадром — 3.6% высоты в окне 720 и
   1.8% на 1440p. Чем лучше экран, тем мельче человек.

   Мерка — доля кадра. База 560: при ней 26 нарисованных пикселей ходока
   держатся около 4.6% высоты на любом экране. Выше 2.4 не поднимаемся — за
   этим пределом в кадр перестаёт помещаться дорога до цели, и мир становится
   комнатой. Малое окно не ужимаем (k≥1): телефону и так достаётся мало мира.

   Мир идёт через ctx-масштаб (withScale, 18c), приборы и фишки — нет: текст
   обязан остаться того же роста и той же чёткости, чем бы ни был занят мир. */
const SURF_BASE=560, SURF_WIDE=1000, SURF_KMAX=2.4;
/* ── и мерка обязана видеть ОБЕ стороны кадра (M222) ──
   Первый счёт брал одну высоту. У телефона высота как у монитора, а ширина
   втрое меньше: мир увеличивался в полтора раза, и в кадр переставала
   помещаться дорога — оставалась щель шириной в триста единиц мира. Кадр
   двумерен, значит и мерка двумерна: растём настолько, насколько позволяет
   ТЕСНАЯ сторона. 1000 к 560 — это те же 16:9, поэтому на обычном мониторе
   обе стороны говорят одно и то же, а узкий экран получает единицу. */
function surfScale(){return clamp(Math.min(H/SURF_BASE,W/SURF_WIDE),1,SURF_KMAX);}
function drawSurface(){
  const K=surfScale();
  /* единственный источник правды о масштабе на кадр: по нему же 15-input
     пересчитывает тычок в мировую координату */
  G.viewK=K;
  withScale(K,drawSurfaceWorld);
  /* ── приборы живут в мерке ИНТЕРФЕЙСА, а не мира (M221) ──
     Фишки целей и строка-подсказка рисуются на канве, а рядом с ними лежит
     DOM, который с M221 растёт вместе с окном (`--ui`). Оставить их в пикселях
     значило бы развести надвое один и тот же интерфейс: половина выросла,
     половина нет. Рисуем их в UI-мерке; мировая координата попадает туда
     делением на неё же — отсюда K/U. */
  const U=(typeof UIK==="number"&&UIK>0)?UIK:1;
  withScale(U,()=>drawSurfaceHud(G.viewX,G.viewY,K/U));
}
