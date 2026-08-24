/* ══════════════ второй этаж жилой части (M178-9) ══════════════
   Исходная просьба автора к M170 была «полноценный Симс», и один пункт из неё
   остался неотданным: у жилой части должен быть ВЕРХ. Пока дом — одна анфилада
   слева направо, он читается вагоном: восемь комнат в ряд, и чем их больше,
   тем длиннее вагон. Лестница ломает эту линию — впервые в доме появляется
   направление, которого нет на поверхности.

   ПРАВИЛА ФАЙЛА:
   1. Второй этаж — не новая механика, а те же комнаты в другой полосе. Всё
      рисование (стены, пол, лампы, проёмы, жильцы) берётся из 29d без правок:
      `hinRooms()` просто отдаёт другой список, когда игрок наверху.
   2. Верх есть только у жилой части: он появляется вместе со ступенью
      «жилая часть» и накрывает её и кабинет. Причал, гараж и мастерская —
      хозяйственные, над ними чердака не строят.
   3. Лестница — вещь на своём месте, а не кнопка: к ней подходят, и она видна
      с обоих этажей — снизу маршем вверх, сверху проёмом в полу.
   4. Ничего нового не хранится: этаж эфемерен, как и позиция. */

/* верхние комнаты идут над кабинетом и жилой частью, в том же порядке */
const HIN_UP=[{key:"loft",ru:"светёлка",over:"study"},
              {key:"bed", ru:"спальня", over:"living"}];
function hinHasUp(){return typeof homeHas==="function"&&homeHas("living");}
/* полоса второго этажа: те же x и ширины, что у комнат под ним */
function hinUpRooms(){
  if(!hinHasUp())return [];
  const out=[];
  const G0=hinGroundRooms();
  for(let i=0;i<HIN_UP.length;i++){
    const u=HIN_UP[i], base=G0.find(r=>r.key===u.over);
    if(!base)continue;
    out.push({key:u.key,ru:u.ru,x:base.x,w:base.w,i:out.length});
  }
  return out;
}
/* лестница стоит в жилой части, у дальнего края: марш вверх виден целиком */
function hinStairX(){
  const base=hinGroundRooms().find(r=>r.key==="living");
  return base?base.x+base.w*.88:null;
}
/* проём в полу спальни ровно над маршем */
function hinHoleX(){
  const U=hinUpRooms();if(!U.length)return null;
  const b=U.find(r=>r.key==="bed");
  return b?b.x+b.w*.88:null;
}
function hinUpBounds(){
  const U=hinUpRooms();
  if(!U.length)return null;
  return {lo:U[0].x+14,hi:U[U.length-1].x+U[U.length-1].w-14};
}

/* ══════════════ оболочка дома (M178-9) ══════════════
   Комната занимала нижнюю треть кадра, а две трети над ней были ЧЁРНЫМИ. Пока
   дом был одноэтажным, это сходило за темноту; со вторым этажом стало видно
   главное: дом рисовался комнатой, а не разрезом. Над потолком у дома есть
   ЧТО-ТО — либо комната верха, либо чердак под скатом, — и снизу тоже: лаги,
   подпол, фундамент. Здесь это «что-то» и рисуется, глухо и без подробностей:
   его задача не быть разглядываемым, а закрыть кадр и объяснить, где мы. */
function hinDrawShell(R,camx,vw,fy,ceil,P,upNow){
  if(!R.length)return;
  const M=HIN_MAN;
  const x0=camx-40, x1=camx+vw+40, w=x1-x0;
  const hx0=R[0].x, hx1=R[R.length-1].x+R[R.length-1].w;
  /* ── над потолком ── */
  const slab=ceil-M*.16;
  ctx.fillStyle="rgb("+P.wood.map(v=>v*.30|0).join(",")+")";
  ctx.fillRect(x0,slab,w,M*.16);
  ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(x0,slab,w,2.4);
  /* Что именно НАД потолком, зависит от того, где мы стоим и что построено.
     Стоим внизу и верх есть — над нами КОМНАТА: её пол, её стена и силуэты
     её вещей, всё глухо. Верха нет или мы уже наверху — там ЧЕРДАК под
     скатом. Рисовать стропила в обоих случаях было бы враньём: над жилой
     комнатой не бывает крыши. */
  const U=(!upNow&&hinHasUp())?hinUpRooms():[];
  const roomAbove=U.length>0;
  const top=slab-M*3;                        /* заведомо выше кромки кадра */
  /* Верх накрывает не весь дом, а только кабинет и жилую часть. Над углом,
     прихожей и гаражом второго этажа НЕТ — там сразу скат. Поэтому сначала
     кладётся крыша во всю ширину, а комната сверху дорисовывается по своему
     месту: иначе над прихожей висел бы чужой пол. */
  {
    const roofAt=x=>{
      const t=clamp((x-hx0)/Math.max(1,hx1-hx0),0,1);
      const e=Math.min(t,1-t)/.20;
      return slab-M*1.25*clamp(e,0,1)-M*.10;
    };
    const RP=new Path2D();
    RP.moveTo(x0,slab);
    for(let x=x0;x<=x1;x+=12)RP.lineTo(x,roofAt(x));
    RP.lineTo(x1,slab);RP.closePath();
    const ag=ctx.createLinearGradient(0,slab-M*1.4,0,slab);
    ag.addColorStop(0,"rgba(14,12,11,1)");
    ag.addColorStop(1,"rgba(32,27,22,1)");
    ctx.fillStyle=ag;ctx.fill(RP);
    ctx.save();ctx.clip(RP);
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=3;
    ctx.beginPath();
    for(let x=Math.floor(x0/64)*64;x<x1+64;x+=64){
      ctx.moveTo(x,slab);ctx.lineTo(x+M*.5,roofAt(x)-4);
    }
    ctx.stroke();
    ctx.strokeStyle="rgba(255,236,200,.05)";ctx.lineWidth=1.2;
    ctx.beginPath();
    for(let x=Math.floor(x0/64)*64;x<x1+64;x+=64){
      ctx.moveTo(x+1.5,slab);ctx.lineTo(x+M*.5+1.5,roofAt(x)-4);
    }
    ctx.stroke();
    for(let s=Math.floor(x0/150);s<=Math.floor(x1/150);s++){
      const h=hashi(s,0x3A11,7);
      if((h&1)===0)continue;
      const bx=s*150+((h>>>2)&63), bw=M*(.5+((h>>>8)&7)/7*.6), bh=M*(.24+((h>>>12)&7)/7*.3);
      const by=slab-bh;
      if(by<roofAt(bx)+6)continue;
      ctx.fillStyle="rgba(10,9,8,.95)";ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle="rgba(255,236,200,.05)";ctx.fillRect(bx,by,bw,1.4);
    }
    ctx.restore();
  }
  if(roomAbove){
    const ux0=U[0].x, ux1=U[U.length-1].x+U[U.length-1].w;
    ctx.save();
    ctx.beginPath();ctx.rect(ux0,top,ux1-ux0,slab-top);ctx.clip();
    const ug=ctx.createLinearGradient(0,top,0,slab);
    ug.addColorStop(0,"rgba(10,9,9,1)");
    ug.addColorStop(.55,"rgb("+P.wall.map(v=>v*.22|0).join(",")+")");
    ug.addColorStop(1,"rgb("+P.wall.map(v=>v*.34|0).join(",")+")");
    ctx.fillStyle=ug;ctx.fillRect(ux0,top,ux1-ux0,slab-top);
    /* пол верхней комнаты лежит прямо на перекрытии — его половицы видны */
    ctx.strokeStyle="rgba(0,0,0,.30)";ctx.lineWidth=1;
    for(let x=Math.floor(ux0/26)*26;x<ux1+26;x+=26){
      ctx.beginPath();ctx.moveTo(x,slab-M*.02);ctx.lineTo(x-4,slab-M*.30);ctx.stroke();
    }
    /* силуэты того, что стоит наверху: ножки, край кровати, горшок */
    for(const u of U){
      ctx.fillStyle="rgba(8,7,7,.95)";
      const a=u.x+u.w*.30, b=u.x+u.w*.72;
      ctx.fillRect(a-M*.5,slab-M*.34,M*1.0,M*.34);
      ctx.fillRect(b-M*.16,slab-M*.44,M*.32,M*.44);
      ctx.fillStyle="rgba(255,236,200,.05)";
      ctx.fillRect(a-M*.5,slab-M*.34,M*1.0,1.4);
      ctx.fillRect(b-M*.16,slab-M*.44,M*.32,1.4);
    }
    /* торцевые стены верхней комнаты, чтобы она не растворялась в скате */
    ctx.fillStyle="rgba(0,0,0,.4)";
    ctx.fillRect(ux0,top,3,slab-top);ctx.fillRect(ux1-3,top,3,slab-top);
    ctx.restore();
  }
  /* если верх построен и мы внизу — сквозь перекрытие теплится его лампа */
  if(roomAbove){
    ctx.save();ctx.globalCompositeOperation="lighter";
    const U=hinUpRooms();
    for(const u of U){
      const lx=u.x+u.w*.5;
      if(lx<x0-60||lx>x1+60)continue;
      const g=ctx.createRadialGradient(lx,slab-M*.4,4,lx,slab-M*.4,M*1.6);
      g.addColorStop(0,"rgba(255,206,138,.10)");g.addColorStop(1,"rgba(255,180,110,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(lx,slab-M*.4,M*1.6,0,TAU);ctx.fill();
    }
    ctx.restore();
  }
  /* ── под полом ── */
  const under=fy+M*.9;
  ctx.fillStyle="rgb("+P.wood.map(v=>v*.22|0).join(",")+")";
  ctx.fillRect(x0,under,w,M*.14);
  ctx.fillStyle="rgba(0,0,0,.94)";
  ctx.fillRect(x0,under+M*.14,w,M*3);
  /* лаги: короткие торцы балок, чтобы полоса не была просто чёрной */
  ctx.fillStyle="rgba(0,0,0,.5)";
  for(let x=Math.floor(x0/64)*64;x<x1+64;x+=64)ctx.fillRect(x,under,10,M*.14);
  ctx.fillStyle="rgba(255,236,200,.04)";
  for(let x=Math.floor(x0/64)*64;x<x1+64;x+=64)ctx.fillRect(x,under,10,1.2);
}

/* ── лестница снизу: марш из ступеней вдоль дальней стены ── */
function hinDrawStair(fy,ceil,P){
  const x=hinStairX();if(x==null)return;
  const M=HIN_MAN, w=M*1.5, n=8, top=ceil+M*.24;
  const step=(fy-top)/n;
  /* косоур */
  ctx.fillStyle="rgb("+P.wood.map(v=>v*.44|0).join(",")+")";
  ctx.beginPath();
  ctx.moveTo(x-w*.5,fy);ctx.lineTo(x+w*.5,top);
  ctx.lineTo(x+w*.5,top+step*.8);ctx.lineTo(x-w*.5,fy+step*.8);
  ctx.closePath();ctx.fill();
  /* ступени: проступь светлее подступёнка — иначе марш читается доской */
  for(let i=0;i<n;i++){
    const t=i/n, y=fy-(fy-top)*t;
    const sx=x-w*.5+w*t;
    ctx.fillStyle="rgb("+P.wood.map(v=>v*.72|0).join(",")+")";
    ctx.fillRect(sx,y-step*.34,w*(1/n)+2,step*.34);
    ctx.fillStyle="rgba(255,238,206,.10)";
    ctx.fillRect(sx,y-step*.34,w*(1/n)+2,1.2);
    ctx.fillStyle="rgba(0,0,0,.30)";
    ctx.fillRect(sx,y-step*.02,w*(1/n)+2,step*.10);
  }
  /* перила: без них марш плоский */
  ctx.strokeStyle="rgb("+P.wood.map(v=>v*.62|0).join(",")+")";
  ctx.lineWidth=2.4;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(x-w*.5,fy-M*.62);ctx.lineTo(x+w*.5,top-M*.5);ctx.stroke();
  ctx.lineWidth=1.6;
  for(let i=0;i<=4;i++){
    const t=i/4, px=x-w*.5+w*t, py=fy-(fy-top)*t;
    ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-M*.62+(top-M*.5-(fy-M*.62))*0);
    ctx.stroke();
  }
  ctx.lineCap="butt";
  /* и свет сверху: из проёма падает тёплое — по нему лестницу и находят */
  ctx.save();ctx.globalCompositeOperation="lighter";
  const g=ctx.createLinearGradient(x+w*.5,top,x,fy);
  g.addColorStop(0,"rgba(255,214,150,.22)");
  g.addColorStop(1,"rgba(255,190,120,0)");
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.moveTo(x+w*.1,top);ctx.lineTo(x+w*.9,top);
  ctx.lineTo(x+w*.4,fy);ctx.lineTo(x-w*.9,fy);ctx.closePath();ctx.fill();
  ctx.restore();
}
/* ── проём в полу сверху: дыра, из которой торчат перила и видно низ ── */
function hinDrawHole(fy,P){
  const x=hinHoleX();if(x==null)return;
  const M=HIN_MAN, w=M*1.5;
  ctx.fillStyle="rgba(6,6,8,.92)";
  ctx.fillRect(x-w*.5,fy,w,M*.9);
  /* внизу видно тёплый пол первого этажа — иначе это чёрный люк */
  const g=ctx.createLinearGradient(0,fy,0,fy+M*.9);
  g.addColorStop(0,"rgba(255,206,138,.16)");
  g.addColorStop(1,"rgba(255,190,120,.03)");
  ctx.fillStyle=g;ctx.fillRect(x-w*.5,fy,w,M*.9);
  ctx.fillStyle="rgb("+P.wood.map(v=>v*.56|0).join(",")+")";
  ctx.fillRect(x-w*.5-3,fy-3,w+6,4);
  ctx.fillStyle="rgba(255,238,206,.12)";
  ctx.fillRect(x-w*.5-3,fy-3,w+6,1.2);
  /* столбик перил у края проёма */
  ctx.fillStyle="rgb("+P.wood.map(v=>v*.62|0).join(",")+")";
  ctx.fillRect(x-w*.5-3,fy-M*.66,3.4,M*.66);
  ctx.fillRect(x+w*.5-1,fy-M*.66,3.4,M*.66);
  ctx.fillRect(x-w*.5-3,fy-M*.66,w+6,3);
}

/* ── обстановка верхних комнат ──
   Возвращает true, если комнату отрисовала: 29d зовёт это первым и на своих
   ключах ничего не меняет. */
function hinUpStuff(r,fy,ceil,P){
  const M=HIN_MAN, at=t=>r.x+r.w*t;
  const wood="rgb("+P.wood.join(",")+")";
  const woodD="rgb("+P.wood.map(v=>v*.6|0).join(",")+")";
  if(r.key==="bed"){
    /* пол спальни: половик во всю комнату */
    ctx.fillStyle="rgba(96,66,58,.5)";
    ctx.fillRect(r.x+r.w*.10,fy+2,r.w*.62,M*.52);
    ctx.fillStyle="rgba(206,176,138,.14)";
    for(let i=0;i<4;i++)ctx.fillRect(r.x+r.w*.13+i*r.w*.15,fy+M*.16,r.w*.05,2);
    /* кровать: изголовье, матрас, одеяло валиком, подушка */
    const bx=at(.30), bw=M*1.9, bh=M*.44;
    ctx.fillStyle=woodD;
    ctx.fillRect(bx-bw*.5-4,fy-M*.92,6,M*.92);            /* изголовье */
    ctx.fillRect(bx+bw*.5-2,fy-M*.50,6,M*.50);            /* изножье */
    ctx.fillStyle="rgb("+P.wood.map(v=>v*.5|0).join(",")+")";
    ctx.fillRect(bx-bw*.5,fy-bh,bw,bh*.34);
    ctx.fillStyle="rgba(228,220,204,.92)";                /* бельё */
    ctx.fillRect(bx-bw*.5,fy-bh-M*.10,bw,M*.14);
    ctx.fillStyle="rgba(122,86,74,.95)";                  /* одеяло */
    ctx.beginPath();
    ctx.moveTo(bx-bw*.10,fy-bh-M*.10);
    ctx.lineTo(bx+bw*.5,fy-bh-M*.12);
    ctx.lineTo(bx+bw*.5,fy-bh+M*.06);
    ctx.lineTo(bx-bw*.10,fy-bh+M*.04);
    ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(0,0,0,.16)";
    ctx.fillRect(bx-bw*.10,fy-bh-M*.02,bw*.6,2);
    ctx.fillStyle="rgba(238,234,224,.95)";                /* подушка */
    ctx.beginPath();ctx.ellipse(bx-bw*.34,fy-bh-M*.16,M*.30,M*.13,-.08,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(0,0,0,.10)";
    ctx.beginPath();ctx.ellipse(bx-bw*.34,fy-bh-M*.10,M*.28,M*.06,-.08,0,TAU);ctx.fill();
    /* тумбочка с лампой: единственный тёплый огонь наверху */
    const tx=at(.52);
    ctx.fillStyle=wood;ctx.fillRect(tx-M*.20,fy-M*.42,M*.40,M*.42);
    ctx.fillStyle="rgba(0,0,0,.22)";ctx.fillRect(tx-M*.20,fy-M*.24,M*.40,2);
    ctx.fillStyle="rgb("+P.metal.map(v=>v*.7|0).join(",")+")";
    ctx.fillRect(tx-1.4,fy-M*.60,2.8,M*.18);
    ctx.fillStyle="rgba(246,226,186,.92)";
    ctx.beginPath();
    ctx.moveTo(tx-M*.13,fy-M*.60);ctx.lineTo(tx+M*.13,fy-M*.60);
    ctx.lineTo(tx+M*.09,fy-M*.74);ctx.lineTo(tx-M*.09,fy-M*.74);ctx.closePath();ctx.fill();
    ctx.save();ctx.globalCompositeOperation="lighter";
    const lg=ctx.createRadialGradient(tx,fy-M*.62,2,tx,fy-M*.62,M*1.1);
    lg.addColorStop(0,"rgba(255,214,150,.20)");lg.addColorStop(1,"rgba(255,190,120,0)");
    ctx.fillStyle=lg;ctx.beginPath();ctx.arc(tx,fy-M*.62,M*1.1,0,TAU);ctx.fill();
    ctx.restore();
    /* окно с ночным небом: наверху оно к месту, внизу окон нет вовсе */
    hinUpWindow(at(.72),fy,ceil,P);
    /* стул со сброшенной курткой — по нему видно, что тут ЖИВУТ */
    const cx=at(.86);
    ctx.fillStyle=woodD;
    ctx.fillRect(cx-M*.16,fy-M*.40,M*.32,3);
    ctx.fillRect(cx-M*.16,fy-M*.40,3,M*.40);
    ctx.fillRect(cx+M*.13,fy-M*.40,3,M*.40);
    ctx.fillRect(cx-M*.16,fy-M*.74,3,M*.34);
    ctx.fillStyle="rgba(74,96,110,.95)";
    ctx.beginPath();
    ctx.moveTo(cx-M*.20,fy-M*.44);ctx.lineTo(cx+M*.18,fy-M*.44);
    ctx.lineTo(cx+M*.10,fy-M*.06);ctx.lineTo(cx-M*.12,fy-M*.10);
    ctx.closePath();ctx.fill();
    return true;
  }
  if(r.key==="loft"){
    /* светёлка: скат крыши, широкий подоконник, растения, низкий стол */
    ctx.fillStyle="rgba(40,34,30,.5)";
    ctx.beginPath();
    ctx.moveTo(r.x,ceil+6);ctx.lineTo(r.x+r.w*.34,ceil+6);
    ctx.lineTo(r.x,ceil+M*.9);ctx.closePath();ctx.fill();
    /* подоконник во всю стену: место, где сидят */
    const sy=fy-M*.52;
    hinUpWindow(at(.42),fy,ceil,P,1.5);
    ctx.fillStyle=wood;
    ctx.fillRect(at(.18),sy,r.w*.48,M*.12);
    ctx.fillStyle="rgba(255,238,206,.10)";
    ctx.fillRect(at(.18),sy,r.w*.48,1.4);
    ctx.fillStyle="rgba(0,0,0,.26)";
    ctx.fillRect(at(.18),sy+M*.12,r.w*.48,2.2);
    /* подушка на подоконнике */
    ctx.fillStyle="rgba(122,102,86,.9)";
    ctx.beginPath();ctx.ellipse(at(.26),sy-M*.06,M*.26,M*.09,0,0,TAU);ctx.fill();
    /* горшки: три, разной высоты — иначе это полка, а не жизнь */
    for(let i=0;i<3;i++){
      const px=at(.52+i*.09), hgt=M*(.14+((i*7)%3)*.05);
      ctx.fillStyle="rgb("+P.wood.map(v=>v*.68|0).join(",")+")";
      ctx.fillRect(px-M*.07,sy-hgt*.5,M*.14,hgt*.5);
      ctx.strokeStyle="rgba(120,176,110,.95)";ctx.lineWidth=1.6;ctx.lineCap="round";
      for(let k=-1;k<=1;k++){
        ctx.beginPath();ctx.moveTo(px,sy-hgt*.5);
        ctx.quadraticCurveTo(px+k*M*.10,sy-hgt-M*.10,px+k*M*.16,sy-hgt-M*.18);
        ctx.stroke();
      }
      ctx.lineCap="butt";
    }
    /* низкий стол с кружкой и стопкой книг */
    const tx=at(.78);
    ctx.fillStyle=wood;ctx.fillRect(tx-M*.30,fy-M*.34,M*.60,M*.08);
    ctx.fillStyle=woodD;
    ctx.fillRect(tx-M*.26,fy-M*.26,3,M*.26);ctx.fillRect(tx+M*.23,fy-M*.26,3,M*.26);
    ctx.fillStyle="rgba(226,222,212,.95)";
    ctx.fillRect(tx-M*.06,fy-M*.46,M*.12,M*.12);
    ctx.fillStyle="rgba(180,120,80,.9)";
    ctx.fillRect(tx+M*.06,fy-M*.44,3,M*.05);
    for(let i=0;i<3;i++){
      ctx.fillStyle=i%2?"rgba(122,86,74,.95)":"rgba(96,110,120,.95)";
      ctx.fillRect(tx-M*.28+i*1.5,fy-M*.40-i*4,M*.20,4);
    }
    return true;
  }
  return false;
}
/* окно: рама, ночное небо в нём и отсвет на полу. Наверху окно — главный
   источник места: по нему видно, что дом стоит на планете, а не в пустоте */
function hinUpWindow(x,fy,ceil,P,wide){
  const M=HIN_MAN, w=M*(wide||1.0), h=M*.86, y=fy-M*1.42;
  ctx.fillStyle="rgb(10,14,24)";
  ctx.fillRect(x-w*.5,y,w,h);
  /* небо: полоса горизонта светлее верха, пара звёзд */
  const g=ctx.createLinearGradient(0,y,0,y+h);
  g.addColorStop(0,"rgba(24,34,58,1)");
  g.addColorStop(.72,"rgba(46,64,96,1)");
  g.addColorStop(1,"rgba(74,88,110,1)");
  ctx.fillStyle=g;ctx.fillRect(x-w*.5,y,w,h);
  ctx.fillStyle="rgba(226,236,244,.8)";
  for(let i=0;i<7;i++){
    const hj=hashi(x|0,i,0x51DE);
    ctx.fillRect(x-w*.5+((hj>>>3)%(w|0)),y+((hj>>>9)%((h*.7)|0)),1.3,1.3);
  }
  /* земля за окном — тёмная кромка внизу: без неё окно висит в космосе */
  ctx.fillStyle="rgba(18,22,26,.95)";
  ctx.fillRect(x-w*.5,y+h*.86,w,h*.14);
  /* рама и переплёт */
  ctx.strokeStyle="rgb("+P.wood.map(v=>v*.62|0).join(",")+")";
  ctx.lineWidth=3.4;ctx.strokeRect(x-w*.5,y,w,h);
  ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+h);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-w*.5,y+h*.44);ctx.lineTo(x+w*.5,y+h*.44);ctx.stroke();
  ctx.fillStyle="rgba(255,238,206,.10)";
  ctx.fillRect(x-w*.5,y,w,1.4);
  /* отсвет на полу — холодный, в отличие от лампы */
  ctx.save();ctx.globalCompositeOperation="lighter";
  const fgl=ctx.createLinearGradient(0,y+h,0,fy);
  fgl.addColorStop(0,"rgba(150,186,220,.10)");
  fgl.addColorStop(1,"rgba(150,186,220,0)");
  ctx.fillStyle=fgl;
  ctx.beginPath();
  ctx.moveTo(x-w*.5,y+h);ctx.lineTo(x+w*.5,y+h);
  ctx.lineTo(x+w*.9,fy);ctx.lineTo(x-w*.9,fy);ctx.closePath();ctx.fill();
  ctx.restore();
}
