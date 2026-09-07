/* ══════════════ база: рисование разреза ══════════════ */
/* Отпилено от 21a-mode-base по шву «рисование разреза» (2026-08-23): там —
   сетка, энергия, ленивое время, налёты и буря; здесь — только кадр. */
/* ── база в разрезе ──
   Прежняя версия рисовала таблицу: коричневый прямоугольник, полосатые ряды,
   и на каждой ячейке — рамка, включая пустые. Ровно та же ошибка, что была в
   шахте до M60: на экране читалась сетка, а не порода.

   Лечится тем же приёмом. Порода — материал планеты (`planetMat`) поверх пластов,
   темнеющих с глубиной. Помещения не обводятся по клеткам: все построенные
   отсеки собираются в ОДИН путь, он вырезается тьмой, и только по его кромке
   идёт грань со светом сверху и тенью снизу. Пустая клетка не рисуется вовсе —
   там просто порода, в которой ещё не прорубились. */
function baseRoomPath(B,X,Y,pad){
  const P=new Path2D();
  /* соседние отсеки — одна выработка, а не ряд коробок: идущие подряд ячейки
     собираются в один прямоугольник, иначе между ними остаётся полоска породы
     и разрез снова читается таблицей */
  for(let r=0;r<baseRows(B);r++){
    let run=-1;
    for(let c=0;c<=BASE_COLS;c++){
      const has=c<BASE_COLS&&!!baseCell(B,c,r);
      if(has&&run<0)run=c;
      if(!has&&run>=0){
        P.rect(X(BASE_OX+run*BCELL_W)+pad,Y(BASE_OY+r*BCELL_H)+pad,
               (c-run)*BCELL_W-pad*2,BCELL_H-pad*2);
        run=-1;
      }
    }
  }
  /* ствол лифта — тоже пустота, и он связывает уровни в одно сооружение.
     Копаем его лишь до самого нижнего построенного яруса: пустая шахта
     в нетронутой породе выглядит как забытая линия */
  let deep=1;
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++)if(baseCell(B,c,r))deep=Math.max(deep,r+1);
  const lx=X(cellX(Math.floor(BASE_COLS/2)));
  P.rect(lx-13,Y(BASE_OY),26,deep*BCELL_H);
  /* тоннель от ворот на равнине к верхнему ярусу: ворота — на уровне земли,
     пол верхнего яруса — тоже, между ними прорублен ход */
  P.rect(X(BASE_GATE_X),Y(BASE_GY-40),BASE_OX-BASE_GATE_X,40);
  return P;
}
function drawBase(){
  const S=G.base,B=S.B,P=basePower(B);
  /* ствол (M396) стоит слева от сетки — камера обязана его пускать, иначе
     человек уходит в колонку, которой на экране нет */
  const camx=clamp(S.x-W/2,BASE_OX-BCELL_W-60,BASE_OX+BASE_COLS*BCELL_W+90-W);
  const camy=clamp(S.y-H/2,-120,baseRows(B)*BCELL_H+260-H);
  const X=x=>x-camx, Y=y=>y-camy;
  const pl=G.sys.planets[B.idx];
  const sky=pl?pl.T.sky:[[20,24,34],[8,10,16]];
  const pal=pl?pl.T.pal:[[70,58,46],[52,42,34],[38,30,24],[26,20,16],[18,14,11]];
  const gy=Y(150);                                   // уровень грунта
  /* небо, гора и порода — отдельным слоем (21ab1, M413) */
  baseDrawGround(B,S,X,Y,camx,camy,gy,sky,pal,pl);
  /* ── помещения: один путь на всё сооружение ── */
  /* нижний порог света поднят: даже на голодном пайке в отсеке горит лампа,
     иначе половина базы читается нежилой. Разница между сытой и голодной
     базой остаётся, но теперь это «ярко или тускло», а не «видно или нет» */
  const lit=.55+P.eff*.45;
  const RP=baseRoomPath(B,X,Y,6);
  ctx.save();
  /* ── порода примыкает ──
     Отсеки лежали на грунте наклейкой: у выработки была своя рамка, но не было
     СЛЕДА в породе вокруг. Настоящая выработка портит камень: у стенки он темнее
     (свет туда не доходит и порода в трещинах от проходки), и чем дальше, тем
     слабее. Широкая мягкая тень наружу от контура и есть весь приём — она же
     сажает сооружение в грунт, отчего ряды перестают висеть в пустоте. */
  for(const [lw,al] of [[26,.30],[16,.26],[9,.30]]){
    ctx.strokeStyle="rgba(0,0,0,"+al+")";ctx.lineWidth=lw;ctx.stroke(RP);
  }
  /* грань выработки: свет сверху, тень снизу — та же фаска, что у проёма кабины */
  ctx.strokeStyle="rgba(0,0,0,.55)";ctx.lineWidth=9;ctx.stroke(RP);
  /* ── свет комнат сочится в породу (леджер кадров: база mass 7%) ──
     Тёмная тень примыкания сажала комнаты в грунт, но кадр оставался одной
     тёмной массой: свет жилых отсеков не покидал их рамок. Тёплая кайма по
     контуру выработки — свет из окон и щелей на камне — даёт разрезу вторую
     ступень и вяжет комнаты в одно светящееся тело. Два штриха на кадр. */
  ctx.save();ctx.globalCompositeOperation="lighter";
  ctx.strokeStyle="rgba(255,204,140,.055)";ctx.lineWidth=34;ctx.stroke(RP);
  ctx.strokeStyle="rgba(255,214,156,.08)";ctx.lineWidth=14;ctx.stroke(RP);
  ctx.restore();
  /* ── врез с переходом (M232) ──
     Верхний ряд комнат сидел в склоне без следа проходки: чистая кромка на
     нетронутой породе. Над потолком верхнего яруса — крошка и светлые сколы,
     то, что остаётся от вырубки. */
  for(let c=0;c<BASE_COLS;c++){
    const cc=baseCell(B,c,0);if(!cc)continue;
    const x0f=X(BASE_OX+c*BCELL_W)+6,y0f=Y(BASE_OY)+6;
    if(x0f>W+40||x0f+BCELL_W<-40)continue;
    const RH=rng(hashi(c+1,(B.idx|0)+5,0xF21));
    for(let i=0;i<14;i++){
      const px=x0f+RH()*(BCELL_W-24),py=y0f-3-RH()*9;
      ctx.fillStyle=RH()<.6?"rgba(0,0,0,.45)":"rgba(226,206,176,.16)";
      ctx.fillRect(px,py,1.5+RH()*3.5,1+RH()*1.2);
    }
  }
  /* ── свет внутри, темнота снаружи ──
     Отсеки были темнее породы, и база читалась дырками в земле. У образца,
     на который равняемся, ровно наоборот: жилые коробки СВЕТЯТСЯ на фоне
     почти чёрного грунта, и весь экран держится на этом контрасте — глаз
     сразу видит, где живут, а где просто камень. Заливка выработки теперь не
     чернее ночи, а тёплый полумрак, поверх которого лягут лампы отсеков;
     сама порода вокруг притемнена отдельно. */
  const bgi=ctx.createLinearGradient(0,Y(BASE_OY-10),0,Y(BASE_OY+baseRows(B)*BCELL_H));
  bgi.addColorStop(0,"rgb("+[26,30,38].join(",")+")");
  bgi.addColorStop(1,"rgb("+[14,17,23].join(",")+")");
  ctx.fillStyle=bgi;ctx.fill(RP);
  ctx.strokeStyle="rgba(210,226,240,"+(.10+lit*.10).toFixed(2)+")";ctx.lineWidth=1.4;ctx.stroke(RP);
  ctx.restore();
  /* ── ствол (M396, §7; переделка M413) ──
     Разбор: «шахта читается пустым серым квадратом». Так и было — тёмная
     заливка, обводка на 0.14 и стяжки на 0.10, то есть тело без единой детали,
     которую глаз мог бы назвать. Здесь она собрана по правилу «много кусков —
     одно тело»: тело с глубинным градиентом, две направляющие с бликом, трос,
     лестница из скоб по левой стенке, метки ярусов — и клеть с полом, дверью в
     сторону отсеков и одной тёплой лампой, которая светит на стенки. */
  {
    const sx0=X(BASE_OX-BCELL_W)+10,sw=BCELL_W-20;
    const inShaft=(S.cur|0)<0;
    const y0=Y(BASE_OY)+4,y1=Y(BASE_OY+baseRows(B)*BCELL_H)-6;
    if(sx0>-BCELL_W&&sx0<W+BCELL_W){
      /* тело: книзу темнее — это глубина, а не заливка */
      const gg=ctx.createLinearGradient(0,y0,0,y1);
      gg.addColorStop(0,"rgba(22,27,34,.94)");
      gg.addColorStop(1,"rgba(8,10,14,.96)");
      ctx.fillStyle=gg;ctx.fillRect(sx0,y0,sw,y1-y0);
      /* обвод: одна сторона светлее — свет из отсеков падает справа */
      ctx.strokeStyle="rgba(150,178,198,"+(.16+lit*.16).toFixed(2)+")";ctx.lineWidth=1.2;
      ctx.strokeRect(sx0+.5,y0+.5,sw-1,y1-y0-1);
      ctx.strokeStyle="rgba(210,232,246,"+(.10+lit*.20).toFixed(2)+")";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(sx0+sw-.5,y0);ctx.lineTo(sx0+sw-.5,y1);ctx.stroke();
      /* направляющие: тело и блик — две линии рядом, а не одна бледная */
      const g1=sx0+sw*.34,g2=sx0+sw*.66;
      ctx.strokeStyle="rgba(70,84,96,.9)";ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(g1,y0);ctx.lineTo(g1,y1);
      ctx.moveTo(g2,y0);ctx.lineTo(g2,y1);ctx.stroke();
      ctx.strokeStyle="rgba(196,220,236,"+(.16+lit*.22).toFixed(2)+")";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(g1-1,y0);ctx.lineTo(g1-1,y1);
      ctx.moveTo(g2-1,y0);ctx.lineTo(g2-1,y1);ctx.stroke();
      /* клеть стоит на том ярусе, где сейчас человек; трос идёт от верха к ней */
      const cy=Y(BASE_OY+(S.row|0)*BCELL_H)+8,ch=BCELL_H-20;
      ctx.strokeStyle="rgba(160,182,198,"+(.22+lit*.2).toFixed(2)+")";ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(sx0+sw*.5,y0);ctx.lineTo(sx0+sw*.5,cy);ctx.stroke();
      /* скобы по левой стенке: лестница, которой пользуются, когда клеть внизу */
      ctx.strokeStyle="rgba(150,170,186,"+(.10+lit*.14).toFixed(2)+")";ctx.lineWidth=1;
      ctx.beginPath();
      for(let yy=y0+7;yy<y1-4;yy+=9){ctx.moveTo(sx0+3,yy);ctx.lineTo(sx0+sw*.22,yy);}
      ctx.stroke();
      /* метки ярусов: короткая риска и номер у правой стенки */
      ctx.font="7px ui-monospace,monospace";ctx.textAlign="right";
      for(let r=0;r<baseRows(B);r++){
        const yy=Y(BASE_OY+r*BCELL_H)+8;
        ctx.strokeStyle="rgba(190,214,232,"+(.12+lit*.12).toFixed(2)+")";
        ctx.beginPath();ctx.moveTo(sx0+sw-9,yy);ctx.lineTo(sx0+sw-2,yy);ctx.stroke();
        ctx.fillStyle="rgba(190,214,232,"+((r===(S.row|0)?.5:.24)+lit*.16).toFixed(2)+")";
        ctx.fillText(String(r+1),sx0+sw-11,yy+3);
      }
      /* сама клеть: тело, пол, дверь в сторону отсеков, лампа */
      const kx=sx0+sw*.18,kw=sw*.64;
      ctx.fillStyle="rgba(26,32,40,.97)";ctx.fillRect(kx,cy,kw,ch);
      ctx.strokeStyle="rgba(120,144,160,"+(.3+lit*.25).toFixed(2)+")";ctx.lineWidth=1;
      ctx.strokeRect(kx+.5,cy+.5,kw-1,ch-1);
      ctx.fillStyle="rgba(28,34,42,.95)";ctx.fillRect(kx+2,cy+ch-4,kw-4,3);
      /* дверь открыта туда, куда человек выходит */
      ctx.strokeStyle="rgba(190,214,232,"+(.18+lit*.2).toFixed(2)+")";
      ctx.beginPath();ctx.moveTo(kx+kw-3.5,cy+3);ctx.lineTo(kx+kw-3.5,cy+ch-5);ctx.stroke();
      /* поручень поперёк клети: за него держатся, и он даёт ей нутро */
      ctx.strokeStyle="rgba(150,170,186,"+(.20+lit*.18).toFixed(2)+")";ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(kx+3,cy+ch*.62);ctx.lineTo(kx+kw-3,cy+ch*.62);ctx.stroke();
      /* ── одна лампа, и свет у неё НАПРАВЛЕННЫЙ ──
         Круглый ореол ровно поднимал всю клеть на полсотни единиц и красил её в
         нейтральный серый: получался тот самый «пустой серый квадрат» разбора,
         только меньше. Лампа светит ВНИЗ, конусом на пол, и чуть-чуть — на
         ближние стенки ствола. Тело клети остаётся тёмным. */
      const lx=kx+kw/2,ly=cy+4;
      ctx.fillStyle="rgba(255,214,150,"+(.5+lit*.4).toFixed(2)+")";
      ctx.fillRect(lx-4,ly,8,2);
      ctx.save();ctx.globalCompositeOperation="lighter";
      const cone=ctx.createLinearGradient(0,ly,0,cy+ch);
      cone.addColorStop(0,"rgba(255,196,120,"+(.11+lit*.07).toFixed(2)+")");
      cone.addColorStop(1,"rgba(255,196,120,0)");
      ctx.fillStyle=cone;
      ctx.beginPath();
      ctx.moveTo(lx-5,ly+2);ctx.lineTo(lx+5,ly+2);
      ctx.lineTo(kx+kw*.86,cy+ch-3);ctx.lineTo(kx+kw*.14,cy+ch-3);
      ctx.closePath();ctx.fill();
      const lg=ctx.createRadialGradient(lx,ly,1,lx,ly,sw*.5);
      lg.addColorStop(0,"rgba(255,186,110,"+(.09+lit*.06).toFixed(2)+")");
      lg.addColorStop(1,"rgba(255,186,110,0)");
      ctx.fillStyle=lg;ctx.beginPath();ctx.arc(lx,ly,sw*.5,0,TAU);ctx.fill();
      ctx.restore();
      /* человек в стволе: подпись места, а не рамка отсека */
      if(inShaft){
        ctx.fillStyle="rgba(196,246,238,.82)";
        ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
        ctx.fillText("СТВОЛ",sx0+sw/2,y0-6);
      }
      ctx.textAlign="left";
    }
  }
  /* свет изнутри ложится на породу вокруг отсеков */
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);if(!cell||cell.hp<=0)continue;
    const cx=X(cellX(c)),cy=Y(cellY(r));
    if(cx<-260||cx>W+260)continue;
    const gg=ctx.createRadialGradient(cx,cy,4,cx,cy,BCELL_W*.95);
    const warm=cell.k==="reactor"?[140,240,255]:[242,178,92];
    gg.addColorStop(0,"rgba("+warm.join(",")+","+(.20*lit).toFixed(3)+")");
    gg.addColorStop(1,"rgba("+warm.join(",")+",0)");
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(cx,cy,BCELL_W*.95,0,TAU);ctx.fill();
  }
  ctx.restore();
  /* ── свет в тоннеле (хвост M138) ──
     Ход от ворот был самой тёмной полостью кадра: прорубленный, но не
     обжитый. Три лампы под сводом, у каждой своё пятно на полу. */
  {
    const ty=Y(BASE_GY-33), step=(BASE_OX-BASE_GATE_X-130)/2;
    ctx.save();ctx.globalCompositeOperation="lighter";
    for(let i=0;i<3;i++){
      const tx=X(BASE_GATE_X+95+i*step);
      if(tx<-80||tx>W+80)continue;
      const gg=ctx.createRadialGradient(tx,ty+8,2,tx,ty+8,54);
      gg.addColorStop(0,"rgba(242,178,92,"+(.22*lit).toFixed(3)+")");
      gg.addColorStop(1,"rgba(242,178,92,0)");
      ctx.fillStyle=gg;ctx.beginPath();ctx.arc(tx,ty+8,54,0,TAU);ctx.fill();
    }
    ctx.restore();
    for(let i=0;i<3;i++){
      const tx=X(BASE_GATE_X+95+i*step);
      ctx.fillStyle="rgba(20,18,14,.95)";ctx.fillRect(tx-4,ty-2,8,3);
      ctx.fillStyle="rgba(255,206,140,"+(.4+lit*.5).toFixed(2)+")";ctx.fillRect(tx-3,ty+1,6,1.6);
    }
    /* свет комнат ложится в тоннель (M232): у стыка с верхним ярусом из
       коридора выпадает тёплое пятно — по нему видно, что за ходом живут */
    const jx=X(BASE_OX-2), jy=Y(BASE_GY-20);
    if(jx>-90&&jx<W+90){
      ctx.save();ctx.globalCompositeOperation="lighter";
      const jg=ctx.createRadialGradient(jx,jy,4,jx,jy,70);
      jg.addColorStop(0,"rgba(255,206,140,"+(.16*lit).toFixed(3)+")");
      jg.addColorStop(1,"rgba(255,206,140,0)");
      ctx.fillStyle=jg;ctx.beginPath();ctx.arc(jx,jy,70,0,TAU);ctx.fill();
      ctx.restore();
      ctx.fillStyle="rgba(255,206,140,"+(.10*lit).toFixed(3)+")";
      ctx.beginPath();ctx.ellipse(jx-16,Y(BASE_GY-2),26,3,0,0,TAU);ctx.fill();
    }
  }
  /* ── ствол лифта ──
     Ярусы связывала пара бледных ниток в .3 — сооружение рассыпалось на
     отдельные полки. На образце шахта это ОСВЕЩЁННАЯ КОЛОННА во всю высоту:
     она и держит композицию, и сразу говорит, что уровни — одно здание.
     Внутри тёплый свет и площадка на каждом ярусе, снаружи — тёмные щёки
     обделки, чтобы колонна не сливалась с отсеками. */
  /* глубина считается здесь же: ствол рисуется раньше стяжки, а глубину знали
     только там — при переносе колонна осталась бы без длины */
  let deepest=0;
  for(let rr=0;rr<baseRows(B);rr++)for(let cc=0;cc<BASE_COLS;cc++)
    if(baseCell(B,cc,rr))deepest=Math.max(deepest,rr+1);
  const lx=X(cellX(Math.floor(BASE_COLS/2)));
  const shaftB=Y(BASE_OY+Math.max(1,deepest)*BCELL_H), shaftT=Y(BASE_OY);
  const LW=13;
  const sg=ctx.createLinearGradient(lx-LW,0,lx+LW,0);
  sg.addColorStop(0,"rgba(30,26,20,.95)");
  sg.addColorStop(.5,"rgba(168,116,52,"+(.42+lit*.42).toFixed(2)+")");
  sg.addColorStop(1,"rgba(30,26,20,.95)");
  ctx.fillStyle=sg;ctx.fillRect(lx-LW,shaftT,LW*2,shaftB-shaftT);
  ctx.fillStyle="rgba(255,196,110,"+(.10+lit*.16).toFixed(2)+")";
  ctx.fillRect(lx-LW*.45,shaftT,LW*.9,shaftB-shaftT);      // светлая сердцевина
  /* ── клеть лифта (M232) ──
     Колонна светилась, но ничего в ней не ездило — сооружение без механики.
     Клеть ходит от верха до нижнего яруса непрерывным медленным циклом,
     противовес — навстречу по щеке обделки. Не мигание, а ход. */
  const trav=Math.max(1,(shaftB-shaftT)-20);
  const cu=.5-.5*Math.cos(((G.t%2600)/2600)*TAU);
  const cageY=shaftT+2+trav*cu;
  ctx.strokeStyle="rgba(10,12,16,.9)";ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(lx-3,shaftT);ctx.lineTo(lx-3,cageY);
  ctx.moveTo(lx+3,shaftT);ctx.lineTo(lx+3,cageY);ctx.stroke();     // тросы
  ctx.fillStyle="rgba(26,24,20,.97)";ctx.fillRect(lx-6.5,cageY,13,16);
  ctx.fillStyle="rgba(255,206,140,"+(.28+lit*.4).toFixed(2)+")";
  ctx.fillRect(lx-4.5,cageY+3,9,4);                                // окно клети
  ctx.fillStyle="rgba(150,164,180,.30)";ctx.fillRect(lx-6.5,cageY,13,1.2);
  const cwY=shaftT+2+trav*(1-cu)*.92;
  ctx.strokeStyle="rgba(10,12,16,.85)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(lx+LW-2.5,shaftT);ctx.lineTo(lx+LW-2.5,cwY);ctx.stroke();
  ctx.fillStyle="rgba(16,15,12,.95)";ctx.fillRect(lx+LW-4.5,cwY,4,11);  // противовес
  ctx.strokeStyle="rgba(8,10,14,.95)";ctx.lineWidth=2.4;
  ctx.beginPath();ctx.moveTo(lx-LW,shaftT);ctx.lineTo(lx-LW,shaftB);
  ctx.moveTo(lx+LW,shaftT);ctx.lineTo(lx+LW,shaftB);ctx.stroke();
  /* площадка на каждом ярусе: по ним видно, что колонна — не труба;
     кромка яруса, у которого клеть, теплеет — огонёк этажа без мигания */
  for(let r=0;r<=Math.max(1,deepest);r++){
    const y=Y(BASE_OY+r*BCELL_H);
    const near=clamp(1-Math.abs(y-(cageY+8))/30,0,1);
    ctx.fillStyle="rgba(20,18,14,.9)";ctx.fillRect(lx-LW,y-3,LW*2,4);
    ctx.fillStyle="rgba(255,206,140,"+(.16+lit*.24+near*.35).toFixed(2)+")";
    ctx.fillRect(lx-LW,y-3,LW*2,1.2);
  }

  /* ── плита перекрытия ──
     Ряды разной длины читались набором полок, потому что между ними была
     только порода: у образца этажи держит толстая плита, и даже короткий ряд
     на ней выглядит этажом, а не отдельной коробкой. Плита идёт по всей
     ширине ЗАСТРОЙКИ (от левого занятого столбца до правого во всём
     сооружении), а не по каждому ряду: перекрытие — вещь общая, его льют
     сразу на всё здание. Тёмное тело, светлая верхняя грань, тень снизу. */
  {
    let gc0=BASE_COLS,gc1=-1;
    for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++)
      if(baseCell(B,c,r)){gc0=Math.min(gc0,c);gc1=Math.max(gc1,c);}
    if(gc1>=0){
      const x0=X(BASE_OX+gc0*BCELL_W)-6, x1=X(BASE_OX+(gc1+1)*BCELL_W)+6;
      for(let r=1;r<=Math.max(1,deepest);r++){
        const y=Y(BASE_OY+r*BCELL_H);
        ctx.fillStyle="rgba(10,12,16,.92)";ctx.fillRect(x0,y-7,x1-x0,9);
        ctx.fillStyle="rgba(150,164,180,"+(.10+lit*.14).toFixed(2)+")";
        ctx.fillRect(x0,y-7,x1-x0,1.4);
        ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x0,y+1.4,x1-x0,2);
      }
    }
  }
  /* ── модули ── */
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const x=X(BASE_OX+c*BCELL_W),y=Y(BASE_OY+r*BCELL_H);
    if(x>W+40||x+BCELL_W<-40)continue;
    const cell=baseCell(B,c,r);
    if(!cell)continue;                       // пустая клетка — просто порода
    drawModule(cell.k,x,y,cell.hp>0?lit:.12,c,r,B);
    if(cell.hp<=0){
      /* разбитый отсек: перечёркнут и тёмен — видно, что налёт был не бесплатным */
      ctx.strokeStyle="rgba(255,80,60,.7)";ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x+14,y+14);ctx.lineTo(x+BCELL_W-14,y+BCELL_H-14);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+BCELL_W-14,y+14);ctx.lineTo(x+14,y+BCELL_H-14);ctx.stroke();
    }
  }
  /* ── люди проходят между комнатами (M232) ──
     Каждый был заперт в своей клетке, и база не жила как организм. Изредка
     по ярусу кто-то идёт из отсека в отсек — по полу, сквозь двери; стены
     рисуются после и перекрывают его в толще переборки. Людей не прибавляется:
     ходит смена, и только там, где смена есть. */
  {
    const staffN=(typeof baseStaff==="function"&&B)?baseStaff(B).length:0;
    if(staffN>0)for(let r=0;r<baseRows(B);r++){
      const occ=[];
      for(let c=0;c<BASE_COLS;c++)if(baseCell(B,c,r))occ.push(c);
      if(occ.length<2)continue;
      const Pw=1500+((r*97)%520), off=hashi(r+1,(B.idx|0)+3,0xCA7)%Pw;
      const tt=G.t+off, ph=(tt%Pw)/Pw, du=.30;
      if(ph>=du)continue;
      const hw=hashi(Math.floor(tt/Pw)+1,r+7,(B.idx|0)+0x11);
      const ca=occ[hw%occ.length], cb=occ[(hw>>>5)%occ.length];
      if(ca===cb)continue;
      const px=X(cellX(ca)+(cellX(cb)-cellX(ca))*(ph/du));
      if(px<-30||px>W+30)continue;
      const fy2=Y(BASE_OY+r*BCELL_H)+BCELL_H-12;
      ctx.fillStyle="rgba(0,0,0,.34)";
      ctx.beginPath();ctx.ellipse(px,fy2-1,7,2,0,0,TAU);ctx.fill();
      bWorker(px,fy2,lit,false,G.t*.30,cb>ca?1:-1);
    }
  }
  /* ── человек на своём месте (M395, §8) ──
     Раньше по базе ходил безымянный силуэт, который никого не изображал:
     «персонал 2/4» жил в списке на станции, а в разрезе стоял манекен. Теперь
     нарисованный человек — это тот, кто здесь работает, и над ним его имя. */
  if(typeof baseCellStaff==="function"&&B)
    for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
      const cell=baseCell(B,c,r);
      if(!cell||cell.hp<=0)continue;
      const who=baseCellStaff(B,cell)[0];
      if(!who)continue;
      const px=X(cellX(c))+22,fy=Y(BASE_OY+r*BCELL_H)+BCELL_H-12;
      if(px<-40||px>W+40)continue;
      ctx.fillStyle="rgba(0,0,0,.34)";
      ctx.beginPath();ctx.ellipse(px,fy-1,7,2,0,0,TAU);ctx.fill();
      bWorker(px,fy,lit,false,G.t*.06+c*1.7,-1);
      /* подпись поверх машинерии читается только с подложкой: имя — это то,
         ради чего человека вообще нарисовали, и терять его в железе нельзя */
      ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
      ctx.fillStyle="rgba(0,0,0,.55)";
      ctx.fillText(who.name,px+1,fy-25);
      ctx.fillStyle="rgba(196,246,238,.82)";
      ctx.fillText(who.name,px,fy-26);
    }
  /* ── переборки ──
     Отсеки одного яруса стояли встык и сливались в ленту: где кончается склад
     и начинается жильё, было видно только по мебели. На образце каждая
     комната отбита толстой стеной, и ряд читается ЧЕРЕДОЙ ПОМЕЩЕНИЙ, а не
     одним длинным залом. Стена ставится на границе двух занятых клеток и по
     краям застройки — там, где помещение упирается в породу. */
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<=BASE_COLS;c++){
    const a=c>0?baseCell(B,c-1,r):null, b=c<BASE_COLS?baseCell(B,c,r):null;
    if(!a&&!b)continue;
    /* ── зал (M396, §7) ──
       Три одинаковых подряд — одно помещение, а не три: внутренние стены между
       ними снимаются, и общий контур виден глазами. Ровно это и обещал §7:
       «зал — те же кисти с убранными внутренними стенами». */
    if(typeof baseHallAt==="function"&&a&&b&&c>0&&c<BASE_COLS){
      const HA=baseHallAt(B,c-1,r),HB=baseHallAt(B,c,r);
      if(HA&&HB&&HA.c0===HB.c0&&HA.r===HB.r)continue;
    }
    const x=X(BASE_OX+c*BCELL_W), y0=Y(BASE_OY+r*BCELL_H), y1=Y(BASE_OY+(r+1)*BCELL_H);
    if(x<-20||x>W+20)continue;
    const wdt=(a&&b)?5:7;                       // внешняя стена толще внутренней
    /* ── стена как материал (M232) ──
       Чёрная решётка перегородок читалась спредшитом. Бетон узнают по трём
       вещам: серое тело, светлый скол по верхней кромке (с выбитой щербиной —
       литьё не бывает ровным) и болтовые пластины на стыках с перекрытием. */
    ctx.fillStyle=(a&&b)?"rgba(46,50,58,.97)":"rgba(32,36,44,.97)";
    ctx.fillRect(x-wdt/2,y0,wdt,y1-y0);
    ctx.fillStyle="rgba(12,14,18,.8)";
    ctx.fillRect(x+wdt/2-1,y0,1,y1-y0);         // теневая грань
    ctx.fillStyle="rgba(150,164,180,"+(.08+lit*.12).toFixed(2)+")";
    ctx.fillRect(x-wdt/2,y0,1,y1-y0);           // блик по кромке, обращённой к свету
    ctx.fillStyle="rgba(170,184,200,"+(.14+lit*.14).toFixed(2)+")";
    ctx.fillRect(x-wdt/2-.6,y0,wdt+1.2,1.8);    // светлый скол сверху
    ctx.fillStyle="rgba(9,11,15,.8)";
    ctx.fillRect(x-wdt/2+(hashi(c+1,r+1,0xC4)&3),y0,1.6,1.2);   // щербина
    ctx.fillStyle="rgba(84,92,104,.95)";
    ctx.fillRect(x-wdt/2-2,y0+3,wdt+4,4);       // пластины на стыках
    ctx.fillRect(x-wdt/2-2,y1-8,wdt+4,4);
    ctx.fillStyle="rgba(12,14,18,.9)";
    ctx.fillRect(x-wdt/2-1,y0+4.4,1.2,1.2);ctx.fillRect(x+wdt/2-.2,y0+4.4,1.2,1.2);
    ctx.fillRect(x-wdt/2-1,y1-6.6,1.2,1.2);ctx.fillRect(x+wdt/2-.2,y1-6.6,1.2,1.2);
    /* ── дверь ──
     Проём был жёлтой полоской в толще стены и читался подсветкой, а не
     дверью. Дверь узнают по трём вещам: тёмный зев, светлый косяк вокруг
     него и порог понизу. Ставится от пола вверх на рост человека — по ней
     же становится видно, какого размера отсек. */
    if(a&&b){
      const dh=BCELL_H*.34, dy=y1-BCELL_H*.12-dh;
      ctx.fillStyle="rgba(6,8,12,.98)";
      ctx.fillRect(x-wdt/2-1,dy,wdt+2,dh);
      ctx.fillStyle="rgba(170,186,204,"+(.12+lit*.18).toFixed(2)+")";
      ctx.fillRect(x-wdt/2-1.6,dy-1.4,wdt+3.2,1.4);      // косяк сверху
      ctx.fillRect(x-wdt/2-1.6,dy,1.2,dh);
      ctx.fillRect(x+wdt/2+.4,dy,1.2,dh);
      ctx.fillStyle="rgba(255,206,140,"+(.20+lit*.26).toFixed(2)+")";
      ctx.fillRect(x-wdt/2-1,dy+dh-1.6,wdt+2,1.6);       // свет из-под двери
    }
  }
  /* ── кабель-каналы (M232) ──
     Прежняя «стяжка» шла ЧЕРЕЗ комнаты на одной высоте, поверх мебели и людей,
     и читалась отладочной разметкой, а не кабелем. Кабель живёт как настоящий:
     канал ПОД настилом пола со скобами крепления, по перегородке поднимается
     ввод, и в комнате от сети виден только щиток с ровным огоньком. Ничего
     не мигает. */
  for(let r=0;r<baseRows(B);r++){
    let c0=-1,c1=-1;
    for(let c=0;c<BASE_COLS;c++)if(baseCell(B,c,r)){if(c0<0)c0=c;c1=c;}
    if(c0<0)continue;
    const chY=Y(BASE_OY+(r+1)*BCELL_H)-9;
    const xa=X(BASE_OX+c0*BCELL_W+8),xb=X(BASE_OX+(c1+1)*BCELL_W-8);
    if(xb>-20&&xa<W+20){
      ctx.fillStyle="rgba(13,15,19,.92)";ctx.fillRect(xa,chY-1.5,xb-xa,3);
      ctx.fillStyle="rgba("+BM_WARM+","+(.10+lit*.10).toFixed(2)+")";
      ctx.fillRect(xa,chY-.5,xb-xa,1);
      ctx.fillStyle="rgba(64,70,80,.9)";
      for(let px=xa+10;px<xb;px+=26)ctx.fillRect(px,chY-2.2,2,4.4);   // скобы
      /* ввод в каждую комнату: по стене вверх, в щиток */
      for(let c=c0;c<=c1;c++){
        if(!baseCell(B,c,r))continue;
        const wx2=X(BASE_OX+c*BCELL_W)+3.2, byY=Y(BASE_OY+r*BCELL_H)+BCELL_H*.42;
        if(wx2<-20||wx2>W+20)continue;
        ctx.fillStyle="rgba(16,18,22,.85)";
        ctx.fillRect(wx2,byY+8,1.4,chY-byY-8);
        ctx.fillStyle="rgba(64,70,80,.9)";
        for(let py=byY+14;py<chY-4;py+=11)ctx.fillRect(wx2-.8,py,3,1.4);
        ctx.fillStyle="rgba(38,42,50,.97)";ctx.fillRect(wx2-1,byY,5.5,8);   // щиток
        ctx.fillStyle="rgba(150,164,180,.25)";ctx.fillRect(wx2-1,byY,5.5,1);
        ctx.fillStyle="rgba("+BM_WARM+","+(.35+lit*.35).toFixed(2)+")";
        ctx.fillRect(wx2+2.6,byY+5,1.4,1.4);                 // ровный огонёк
      }
    }
    /* и по полу тоннеля — тем же каналом, а не линией в воздухе */
    if(r===0){
      const ty2=Y(BASE_GY-3), txa=X(BASE_GATE_X+70),txb=X(BASE_OX);
      if(txb>-20&&txa<W+20){
        ctx.fillStyle="rgba(13,15,19,.92)";ctx.fillRect(txa,ty2-1.5,txb-txa,3);
        ctx.fillStyle="rgba("+BM_WARM+","+(.08+lit*.08).toFixed(2)+")";
        ctx.fillRect(txa,ty2-.5,txb-txa,1);
        ctx.fillStyle="rgba(64,70,80,.9)";
        for(let px=txa+12;px<txb;px+=30)ctx.fillRect(px,ty2-2.2,2,4.4);
      }
    }
  }
  /* ── дым плавильни (M232) ──
     Плавильня работала беззвучно и бесследно. Труба поднимается по линии
     перегородки (по стенам, не сквозь комнаты) до поверхности, там грибок,
     и дым сносит ветром — медленный живой цикл, единственный на склоне. */
  {
    let rx=-1,ry=-1;
    for(let r=0;r<baseRows(B)&&rx<0;r++)for(let c=0;c<BASE_COLS;c++){
      const cc=baseCell(B,c,r);
      if(cc&&cc.k==="refinery"&&cc.hp>0){rx=c;ry=r;break;}
    }
    if(rx>=0){
      const px=X(BASE_OX+rx*BCELL_W);
      if(px>-40&&px<W+40){
        const six=clamp(Math.round(px/6),0,surfYs.length-1);
        const syv=surfYs[six], pty=Y(BASE_OY+ry*BCELL_H)+10;
        if(syv<pty){
          ctx.fillStyle="rgba(30,32,38,.95)";ctx.fillRect(px-1.6,syv-2,3.2,pty-syv+2);
          ctx.fillStyle="rgba(150,164,180,.14)";ctx.fillRect(px-1.6,syv-2,1,pty-syv+2);
          ctx.fillStyle="rgba(30,32,38,.98)";
          ctx.fillRect(px-1.6,syv-8,3.2,7);
          ctx.fillRect(px-4.5,syv-10,9,2.4);                 // грибок
          ctx.fillStyle="rgba(150,164,180,.25)";ctx.fillRect(px-4.5,syv-10,9,1);
          const wnd=.55+.35*Math.sin(G.t*.004+(B.idx|0));
          for(let i=0;i<6;i++){
            const tp=((G.t*.004)+i/6)%1;
            const sx2=px+tp*tp*52*wnd+Math.sin(G.t*.02+i*2.1)*2;
            const sy2=syv-11-tp*36;
            ctx.fillStyle="rgba(206,210,218,"+((1-tp)*(.30-.14*tp)*lit).toFixed(3)+")";
            ctx.beginPath();ctx.arc(sx2,sy2,2+tp*6,0,TAU);ctx.fill();
          }
        }
      }
    }
  }
  /* астронавт — тот же силуэт, что на поверхности и в шахте */
  ctx.save();ctx.translate(X(S.x),Y(S.y)+26);ctx.scale(.9,.9);
  drawAstronaut({phase:S.walkPhase,amp:Math.abs(cellX(S.cur)-S.x)>2?1:0,walk:false,air:false});
  ctx.restore();
  /* место под застройку: не рамка на каждой клетке, а метка только на выбранной.
     На снимке заглавной курсора нет: там показывают базу, а не выбор (M233) */
  if(SHOT_CLEAN){if(S.menu)drawBuildMenu(S);return;}
  /* ── в стволе выбирать нечего, но видеть — есть что (правка M413) ──
     Здесь стоял `return`: стоило шагнуть в ствол, и вместе с курсором пропадали
     патрубки, мороз, метка аврала и приборная доска. То есть ровно в лифте,
     откуда видно всю базу разом, игрок переставал видеть её состояние. Уходит
     только курсор — всё остальное рисуется всегда. */
  const inShaftSel=(S.cur|0)<0;
  const sx=X(BASE_OX+S.cur*BCELL_W),sy=Y(BASE_OY+S.row*BCELL_H);
  const on=Math.sin(G.t*.12)>0;
  ctx.strokeStyle=on?"rgba(127,230,216,.95)":"rgba(127,230,216,.4)";
  ctx.lineWidth=2;
  const selCell=inShaftSel?null:baseCell(B,S.cur,S.row);
  if(inShaftSel){/* курсора нет: в стволе стоят и едут */}
  else if(selCell){
    /* у построенного отсека — не рамка во всю клетку, а уголки и подпись:
       имена всех отсеков разом снова превращали разрез в таблицу */
    const x1=sx+6,y1=sy+6,x2=sx+BCELL_W-6,y2=sy+BCELL_H-6,L=12;
    ctx.beginPath();
    ctx.moveTo(x1,y1+L);ctx.lineTo(x1,y1);ctx.lineTo(x1+L,y1);
    ctx.moveTo(x2-L,y1);ctx.lineTo(x2,y1);ctx.lineTo(x2,y1+L);
    ctx.moveTo(x2,y2-L);ctx.lineTo(x2,y2);ctx.lineTo(x2-L,y2);
    ctx.moveTo(x1+L,y2);ctx.lineTo(x1,y2);ctx.lineTo(x1,y2-L);
    ctx.stroke();
    ctx.fillStyle="rgba(180,240,232,.9)";
    ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
    const nm=BUILD[selCell.k].ru.toUpperCase()+(selCell.hp<=0?" · РАЗБИТ":"");
    ctx.fillText(nm,sx+BCELL_W/2,y1-5);
  }
  else{
    ctx.setLineDash([7,7]);
    ctx.strokeRect(sx+10,sy+10,BCELL_W-20,BCELL_H-20);
    ctx.setLineDash([]);
    ctx.fillStyle="rgba(127,230,216,.5)";ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("МЕСТО ПОД ЗАСТРОЙКУ",sx+BCELL_W/2,sy+BCELL_H/2+3);
  }
  /* ── патрубки соседства (M404, §7) ──
     Девять правил были числами в подсказке; здесь они становятся тем, что
     видно: между двумя клетками, которые друг другу что-то дают, идёт короткий
     патрубок, а между теми, кто друг другу мешает, — косая полоса. План базы
     перестаёт быть списком модулей и делается схемой. */
  if(typeof baseAdjPairs==="function"){
    const COL={wire:[242,178,92],green:[140,220,150],care:[150,220,255],
      feed:[130,200,255],vent:[190,210,230],store:[210,190,140],fix:[200,200,210],
      noise:[255,120,90],gun:[255,120,90]};
    for(const P2 of baseAdjPairs(B)){
      const bad=(P2.k==="noise"||P2.k==="gun");
      const x1=X(cellX(P2.ac)),y1=Y(cellY(P2.ar)),x2=X(cellX(P2.bc)),y2=Y(cellY(P2.br));
      if(Math.min(x1,x2)<-BCELL_W||Math.max(x1,x2)>W+BCELL_W)continue;
      const mx=(x1+x2)/2,my=(y1+y2)/2;
      const c3=COL[P2.k]||[200,200,200];
      ctx.save();
      ctx.globalAlpha=.78+lit*.2;
      if(bad){
        /* опасное соседство — косая штриховка, а не труба: это не связь */
        ctx.strokeStyle="rgba("+c3.join(",")+",.75)";ctx.lineWidth=2;
        ctx.setLineDash([4,4]);
        ctx.beginPath();ctx.moveTo(mx-9,my-9);ctx.lineTo(mx+9,my+9);ctx.stroke();
        ctx.setLineDash([]);
      }else{
        /* труба — это ТЕЛО и блик, а не линия (разбор M413: «патрубки бледные,
           связь не читается»). Тёмная подложка отделяет её от породы, цветной
           верх её называет, муфта посередине держит взгляд */
        const ax=x1+(x2-x1)*.26,ay=y1+(y2-y1)*.26;
        const bx2=x1+(x2-x1)*.74,by2=y1+(y2-y1)*.74;
        ctx.lineCap="round";
        ctx.strokeStyle="rgba(8,11,16,.8)";ctx.lineWidth=7;
        ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx2,by2);ctx.stroke();
        ctx.strokeStyle="rgba("+c3.join(",")+",.85)";ctx.lineWidth=4.5;
        ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx2,by2);ctx.stroke();
        ctx.strokeStyle="rgba(255,255,255,"+(.12+lit*.16).toFixed(2)+")";ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(ax,ay-1.4);ctx.lineTo(bx2,by2-1.4);ctx.stroke();
        ctx.lineCap="butt";
        /* муфта */
        ctx.fillStyle="rgba(8,11,16,.85)";
        ctx.beginPath();ctx.arc(mx,my,4.4,0,TAU);ctx.fill();
        ctx.fillStyle="rgba("+c3.join(",")+",.95)";
        ctx.beginPath();ctx.arc(mx,my,3,0,TAU);ctx.fill();
      }
      ctx.restore();
    }
  }
  /* ── мороз и марево (M404, §4) ──
     Двусторонняя шкала должна быть видна кадром, а не строкой: в мороз по
     кадру идёт синь и иней по кромкам, в жару — тёплая дымка. */
  if(typeof baseHeatBand==="function"){
    const bnd=baseHeatBand(B);
    if(bnd){
      const a2=Math.min(.3,Math.abs(bnd)*.09);
      ctx.save();
      if(bnd<0){
        ctx.fillStyle="rgba(150,205,255,"+a2.toFixed(3)+")";
        ctx.fillRect(0,0,W,H);
        /* иней по верхним кромкам отсеков */
        ctx.fillStyle="rgba(220,240,255,"+(a2*1.6).toFixed(3)+")";
        for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
          const cell=baseCell(B,c,r);
          if(!cell||cell.hp<=0)continue;
          const x=X(BASE_OX+c*BCELL_W),y=Y(BASE_OY+r*BCELL_H);
          if(x<-BCELL_W||x>W+BCELL_W)continue;
          ctx.fillRect(x+6,y+6,BCELL_W-12,2);
        }
      }else{
        ctx.globalCompositeOperation="lighter";
        const g2=ctx.createLinearGradient(0,Y(BASE_OY+baseRows(B)*BCELL_H),0,Y(BASE_OY));
        g2.addColorStop(0,"rgba(255,150,90,"+(a2*.9).toFixed(3)+")");
        g2.addColorStop(1,"rgba(255,150,90,0)");
        ctx.fillStyle=g2;ctx.fillRect(0,0,W,H);
      }
      ctx.restore();
    }
  }
  /* ── приборная доска базы (M404 §4, переделка M413) ──
     Замечания разбора: подписи шкал были трёхбуквенными обрубками — «ВЗД»,
     «ВОД», «ХРЧ», — которые надо расшифровывать, а подсказка внизу разрослась
     до ПЯТИ строк и легла на нижний ряд сетки. Оба замечания об одном: числа
     базы стояли не там. Хозяйство базы — это ПРИБОР, и место ему на доске у
     левого края; подсказка остаётся тем, чем должна быть, — что под курсором
     и что делает кнопка. Слова целиком, потому что место под них есть. */
  if(typeof baseLife==="function"&&typeof baseSharp==="function"){
    const L=baseLife(B),bx=14,by=64;
    const rows=[["ВОЗДУХ",L.air,LIFE_CAP,[150,220,255]],
                ["ВОДА",  L.water,LIFE_CAP,[120,190,255]],
                ["ХАРЧ",  L.food|0,LIFE_CAP,[190,220,140]],
                ["ДУХ",   (typeof baseSpirit==="function")?baseSpirit(B):100,100,[242,178,92]]];
    /* нижняя половина доски: то, что раньше занимало три строки подсказки */
    const P4=(typeof basePower==="function")?basePower(B):{prod:0,cons:0,eff:1,store:0};
    const warn=(typeof baseWarnLine==="function")?baseWarnLine(B):"";
    const foot=["ЭНЕРГИЯ "+P4.prod+" / "+P4.cons+" · ОТДАЧА "+Math.round(P4.eff*100)+"%",
                "СКЛАД "+((typeof basePoolHeld==="function")?basePoolHeld(B):0)+" / "+P4.store];
    if(warn)foot.push(warn.toUpperCase());
    const bw=176,bh=rows.length*12+foot.length*11+16;
    ctx.save();
    ctx.fillStyle="rgba(10,13,18,.82)";
    ctx.fillRect(bx-6,by-6,bw,bh);
    ctx.strokeStyle="rgba(150,178,198,"+(.18+lit*.18).toFixed(2)+")";
    ctx.strokeRect(bx-5.5,by-5.5,bw-1,bh-1);
    ctx.font="8px ui-monospace,monospace";ctx.textAlign="left";
    rows.forEach((q,i)=>{
      const y=by+i*12;
      ctx.fillStyle="rgba(190,210,224,.75)";
      ctx.fillText(q[0],bx,y+7);
      const w=88,k=clamp(q[1]/q[2],0,1);
      ctx.fillStyle="rgba(255,255,255,.10)";ctx.fillRect(bx+52,y+2,w,5);
      ctx.fillStyle="rgba("+q[3].join(",")+",.85)";ctx.fillRect(bx+52,y+2,w*k,5);
    });
    /* черта: выше — запас, ниже — машина. Одна доска, два разных вопроса */
    const fy=by+rows.length*12+2;
    ctx.strokeStyle="rgba(150,178,198,.16)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(bx,fy+.5);ctx.lineTo(bx+bw-14,fy+.5);ctx.stroke();
    foot.forEach((s,i)=>{
      ctx.fillStyle=i===2?"rgba(242,178,92,.72)":"rgba(178,198,214,.72)";
      ctx.fillText(s.length>30?s.slice(0,30):s,bx,fy+11+i*11);
    });
    ctx.restore();
  }
  /* ── что тут было без вас (M390 §12; кадр M413) ──
     Записи журнала встречали игрока через `say` — по центру, на четверти
     высоты, то есть ровно поверх верхнего ряда сетки. Здесь у них своё место:
     карточка в свободном небе справа, под шапкой сцены, шириной в текст и
     ничем не перекрытая. Гаснет сама, как гасло сообщение. */
  if(S.note&&S.note.t>0&&W>=BASE_NOTE_W){
    const N=S.note,a=clamp(N.t/60,0,1);
    ctx.save();
    ctx.globalAlpha=a;
    ctx.font="9px ui-monospace,monospace";ctx.textAlign="left";
    let cw=150;
    for(const s of N.lines)cw=Math.max(cw,ctx.measureText(s).width+22);
    /* карточка не наезжает на приборную доску: у той левый край и 176 в ширину */
    cw=Math.min(cw,Math.max(190,W*.34),W-214);
    const cx=W-cw-18,cy=78,chh=N.lines.length*13+26;
    ctx.fillStyle="rgba(10,13,18,.84)";ctx.fillRect(cx,cy,cw,chh);
    ctx.strokeStyle="rgba(150,178,198,.22)";ctx.lineWidth=1;
    ctx.strokeRect(cx+.5,cy+.5,cw-1,chh-1);
    ctx.fillStyle="rgba(242,178,92,.5)";ctx.fillRect(cx,cy,3,chh);
    ctx.fillStyle="rgba(150,178,198,.6)";
    ctx.font="8px ui-monospace,monospace";
    ctx.fillText("ПОКА ВАС НЕ БЫЛО",cx+12,cy+14);
    ctx.font="9px ui-monospace,monospace";
    N.lines.forEach((s,i)=>{
      ctx.fillStyle="rgba(198,216,228,.86)";
      ctx.fillText(s,cx+12,cy+29+i*13);
    });
    ctx.restore();
  }
  /* аврал (M398): отсек, в котором беда, видно раньше всякого текста */
  if(typeof avrDraw==="function")avrDraw(S,X,Y,lit);
  /* ── переходящий вымпел (M206; переделка M413) ──
     Разбор: «флаг ГЛАВТРАССЫ — самое яркое пятно кадра». Так и было: сто
     процентов красного размером в пол-отсека, висящие посреди породы, в
     сцене, где всё остальное — коричневое и бирюзовое под общим светом.
     Вымпел ничего не даёт и не должен ничего требовать: он ВЕЩЬ НА СТЕНЕ у
     ворот, вчетверо меньше, и живёт в том же свете, что и порода. */
  if(typeof pennHere==="function"&&pennHere()&&typeof pennDraw==="function"){
    ctx.save();
    ctx.globalAlpha=.42+lit*.42;
    pennDraw(X(BASE_OX+BCELL_W*.42),Y(BASE_OY-34),BCELL_W*0.24,BCELL_H*0.20);
    ctx.restore();
  }
  if(S.menu)drawBuildMenu(S);
}
