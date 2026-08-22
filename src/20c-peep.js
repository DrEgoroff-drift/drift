/* ══════════════ подглядка: луг, который помнит свет ══════════════
   Единственное место, где «Долгий Ход» ВИДНО, а не вычитано. Всё остальное в
   игре — показания: зарубка, спутник, трепло. Здесь свидетель не говорит, а
   повторяет: мат из плоских пластинок держит упавший на него свет и отдаёт его
   обратно, когда стемнеет. Стемнеть же на планете может только в затмение —
   и вот ради этого и заведён календарь (M107). Игрок может простоять на нужном
   лугу час и не увидеть ничего; обелиск, называющий дату, становится самой
   дорогой вещью в трюме. Это и есть выплата всей небесной механики.

   ПРАВИЛА ФАЙЛА:
   1. Ни одной подписи к тому, что показано. Фигура, сколько их, что несли,
      куда шли — игрок читает это сам или не читает вовсе. Подписан только сам
      мат («ПОДГЛЯДКА»), иначе луг неотличим от травы и его никто не найдёт.
   2. Луг растёт только там, где затмение вообще возможно: без спутника мир не
      темнеет никогда, и обещание, которое нечем оплатить, — ложь.
   3. Показ детерминирован от зерна планеты. Сцена не бросается заново при
      каждом заходе: тот же мир — те же четверо и тот же ящик.
   4. Своего художественного языка не заводим. Фигуры сложены по пропорциям
      рубки (`hqFigure`: три с половиной головы, плечи шире таза, ноги врозь),
      уменьшенным до человеческого роста поверхности, и нарисованы одним
      светом на «lighter» — это память о свете, а не второй астронавт.
   5. Плата — кусок отчёта (12q), и берётся он у луга как у всякого свидетеля:
      достоять полный проход, стоя в мате. Не «нашёл», а «досмотрел». */

const PEEP_PASS=430;                  /* кадров на проход: затмение живёт около 19 с */
const PEEP_R=150;                     /* полуширина мата */
const PEEP_LOAD=["ящик","бочка","шест","носилки",""];
const PEEP_LIT=[150,235,225];         /* холодный свет памяти */

/* ── где он растёт ──
   Редкость: примерно каждый девятый мир со спутником. Проверка про спутники —
   не украшение, а правило 2. */
function peepHere(p){
  if(!p||p.type==="gas")return false;
  if(!p.moons||!p.moons.length)return false;
  return hashi(p.seed,0x9EE9,3)%9===0;
}
/* ── что он повторяет ──
   Одна сцена на планету: сколько их шло, что несли, в какую сторону и был ли
   такт — тот, кто остановился и обернулся. Никаких слов. */
function peepScene(p){
  const r=rng(hashi(p.seed,0x5EE1,13));
  const n=1+Math.floor(r()*4);
  let load=PEEP_LOAD[Math.floor(r()*PEEP_LOAD.length)];
  if((load==="носилки"||load==="шест")&&n<2)load="ящик";
  return {n,load,dir:r()<.5?-1:1,beat:Math.floor(r()*3),lag:.07+r()*.05};
}
/* ── место ──
   Луг лежит на ровном: из шести проб берём самую пологую. На склоне мат
   читался как осыпь, а идущие по нему — как падающие. */
function peepMake(tr,p){
  if(!peepHere(p))return null;
  const r=rng(hashi(p.seed,0x9EE9,7));
  let bx=tr.W/2,bs=1e9;
  for(let i=0;i<6;i++){
    const x=clamp(260+r()*Math.max(1,tr.W-520),PEEP_R+40,tr.W-PEEP_R-40);
    const s=Math.abs(groundAt(tr,x-90)-groundAt(tr,x+90))+
            Math.abs(groundAt(tr,x-40)-groundAt(tr,x+40));
    if(s<bs){bs=s;bx=x;}
  }
  return {x:bx,r:PEEP_R,ph:0,watch:0,dk:0,paid:0,scene:peepScene(p)};
}
/* ── ход показа ──
   Темно — идёт проход, светло — мата не видно и счётчик сброшен: досмотреть
   половину в двух затмениях нельзя, свидетеля слушают целиком. */
function peepUpdate(dt){
  const S=G.surf,P=S&&S.peep;
  if(!P)return;
  const dk=typeof celDark==="function"?celDark():0;
  P.dk=dk;
  if(dk<.22){P.ph=0;P.watch=0;return;}
  P.ph+=dt;
  if(P.ph>PEEP_PASS+120)P.ph=0;                 /* пауза между проходами */
  if(Math.abs(S.x-P.x)<P.r)P.watch+=dt; else P.watch=0;
  if(P.watch>=PEEP_PASS&&!P.paid){
    P.paid=1;
    /* Свидетель отдаёт то же, что и все: кусок отчёта. Место — эта планета в
       этом секторе, поэтому второй луг на другом мире платит своим куском. */
    if(typeof loreTake==="function")
      loreTake("peep:"+G.sx+":"+G.sy+":"+(S.p&&S.p.seed));
  }
}
/* ── мат ──
   Плоские пластинки внахлёст, плотность падает к краю (прямоугольник травы
   читается как ковёр из мебельного). На свету — пепельно-зелёные, с перламутром
   по верхней кромке; в темноте те же пластинки светятся сами. */
function peepDrawMat(camx,camy){
  const S=G.surf,P=S&&S.peep;
  if(!P)return;
  const tr=S.tr,dk=P.dk||0;
  if(P.x+P.r-camx<-40||P.x-P.r-camx>W+40)return;
  const r=rng(hashi(Math.round(P.x),0x11A7,5));  /* один и тот же узор каждый кадр */
  /* мат в тон мира (хвост M118): та же трава, но замешана на породе планеты */
  const base=mixc([104,120,108],S.p.T.pal[2],.4),lip=mixc([188,204,186],S.p.T.pal[1],.25);
  ctx.save();
  /* Первый заход клал пластинки в одну строчку по линии грунта, и мат читался
     подсветкой рельефа, а не зарослью. Пластинки лежат внахлёст в три яруса:
     ковру нужна толщина, пусть и в семь пикселей. */
  for(let x=P.x-P.r;x<=P.x+P.r;x+=3){
    const t=(x-P.x)/P.r, d=1-t*t;                /* к краю луг редеет */
    if(r()>d*.95)continue;
    const gx0=x-camx, gy0=groundAt(tr,x)-camy+1;
    const tier=1+Math.floor(r()*3);
    for(let k=0;k<tier;k++){
      const gx=gx0+(r()-.5)*5, gy=gy0-k*2.2-r()*1.4;
      const w=2.6+r()*3.4, h=1.4+r()*1.8;
      ctx.fillStyle=rgba(mixc(base,PEEP_LIT,dk*.5),.5+k*.16);
      ctx.beginPath();
      ctx.moveTo(gx-w,gy);ctx.lineTo(gx-w*.55,gy-h);
      ctx.lineTo(gx+w*.55,gy-h);ctx.lineTo(gx+w,gy);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle=rgba(lip,(.22+dk*.36)*(.5+k*.25));ctx.lineWidth=.8;
      ctx.beginPath();ctx.moveTo(gx-w*.55,gy-h+.4);ctx.lineTo(gx+w*.55,gy-h+.4);ctx.stroke();
    }
    /* стебли растут пучками, а не поштучно вдоль всей полосы: одиночные торчали
       булавками с бусиной и читались как чужая антенна */
    if(r()<.07){
      const n=2+Math.floor(r()*3);
      for(let s=0;s<n;s++){
        const sx=gx0+(s-n/2)*2.4+(r()-.5)*2;
        const hh=4+r()*4, lean=WIND*.07*(.6+r());
        ctx.strokeStyle=rgba(mixc(base,lip,.4),.62);ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(sx,gy0-2);ctx.lineTo(sx+lean*hh,gy0-2-hh);ctx.stroke();
        ctx.fillStyle=rgba(mixc(base,PEEP_LIT,.2+dk*.6),.7);
        ctx.beginPath();ctx.ellipse(sx+lean*hh,gy0-2-hh,1.2,2,lean,0,TAU);ctx.fill();
      }
    }
  }
  /* в темноте мат отдаёт свет целиком, а не отдельными пластинками. Зарево
     ЛЕЖИТ: круглый ореол висел над лугом линзой тумана, поэтому он плоский,
     сдвинут вниз и обрезан по земле — светится трава, а не воздух над ней. */
  if(dk>.22){
    ctx.globalCompositeOperation="lighter";
    const gy=groundAt(tr,P.x)-camy;
    const g=ctx.createRadialGradient(P.x-camx,gy+4,4,P.x-camx,gy+4,P.r*1.05);
    g.addColorStop(0,rgba(PEEP_LIT,.05+dk*.09));
    g.addColorStop(1,rgba(PEEP_LIT,0));
    ctx.fillStyle=g;
    ctx.beginPath();ctx.ellipse(P.x-camx,gy+4,P.r*1.05,12,0,0,TAU);ctx.fill();
  }
  ctx.restore();
  /* подписан сам луг, а не то, что он показывает (правило 1) */
  if(Math.abs(S.x-P.x)<P.r){
    ctx.fillStyle=rgba(mixc([147,166,180],PEEP_LIT,dk),.8);
    ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText("ПОДГЛЯДКА",P.x-camx,groundAt(tr,P.x)-camy-26);
  }
}
/* ── фигура ──
   Пропорции рубки, ужатые до роста поверхности: голова, плечи шире таза, ноги
   врозь. Рисуется одним светом: контура нет, тона нет, есть силуэт из свечения.
   `load` — только то, что несёт ОДИН человек; шест и носилки держат двое, их
   рисует `peepGhosts` между фигурами. */
function peepFigure(x,y,face,ph,a,load){
  const sw=Math.sin(ph),sw2=Math.sin(ph+Math.PI);
  const c=rgba(PEEP_LIT,a);
  ctx.save();ctx.translate(x,y);ctx.scale(face,1);
  /* мягкое зарево вокруг тела: без него светлый силуэт на светлом мате
     выглядит вырезанным из бумаги */
  const hg=ctx.createRadialGradient(0,-12,1,0,-12,11);
  hg.addColorStop(0,rgba(PEEP_LIT,a*.14));hg.addColorStop(1,rgba(PEEP_LIT,0));
  ctx.fillStyle=hg;ctx.beginPath();ctx.ellipse(0,-12,8,11,0,0,TAU);ctx.fill();
  ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineCap="round";
  /* Рост 23 — на волос ниже астронавта рядом: это те же люди в тех же костюмах,
     а первый счёт делал их на голову выше, и память выходила крупнее живого.
     Ноги 8, торс 11, голова 6 — те же три с половиной головы, что в рубке. */
  ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(-.6,-8);ctx.lineTo(sw*1.8-.6,-4);ctx.lineTo(sw*2.8-.6,0);ctx.stroke();
  ctx.beginPath();ctx.moveTo(.6,-8);ctx.lineTo(sw2*1.8+.6,-4);ctx.lineTo(sw2*2.8+.6,0);ctx.stroke();
  /* торс: плечи 10, пояс 7. Широкая трапеция превращала фигуру в кеглю */
  ctx.beginPath();
  ctx.moveTo(-3.4,-8);ctx.lineTo(-5,-17.6);ctx.lineTo(-3,-19.2);
  ctx.lineTo(3,-19.2);ctx.lineTo(5,-17.6);ctx.lineTo(3.4,-8);
  ctx.closePath();ctx.fill();
  /* голова стоит НАД плечами, а не в них: узкая шея в один пиксель */
  ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(.4,-19.2);ctx.lineTo(.4,-20.4);ctx.stroke();
  ctx.beginPath();ctx.arc(.4,-22.4,2.9,0,TAU);ctx.fill();
  ctx.lineWidth=2.2;
  if(load==="ящик"){
    /* ношу видно раньше человека: она и есть то, что игрок читает */
    /* ящик на уровне пояса, а не у подбородка (хвост M118): руки вниз и вперёд */
    ctx.beginPath();ctx.moveTo(2.6,-17);ctx.lineTo(6.4,-10.6);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-2.6,-17);ctx.lineTo(5.4,-10.6);ctx.stroke();
    ctx.fillRect(5,-13.4,8.4,7.6);
    ctx.strokeStyle=rgba(PEEP_LIT,Math.min(1,a*1.6));ctx.lineWidth=1;
    ctx.strokeRect(5,-13.4,8.4,7.6);
    ctx.strokeStyle=c;
  }else if(load==="бочка"){
    ctx.beginPath();ctx.moveTo(-2.6,-17);ctx.lineTo(-4.6,-20.6);ctx.stroke();
    ctx.beginPath();ctx.ellipse(-6,-23.4,4,4.8,-.2,0,TAU);ctx.fill();
    ctx.beginPath();ctx.moveTo(2.6,-17);ctx.lineTo(3.8,-10.6+sw*1.6);ctx.stroke();
  }else{
    /* руки идут в противофазе ногам — иначе строй шагает как заводной */
    /* рука в покое висит СНАРУЖИ торса, а не по его кромке (хвост M118) */
    ctx.beginPath();ctx.moveTo(4.4,-17.2);ctx.lineTo(sw2*3+5.2,-9.2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-4.4,-17.2);ctx.lineTo(sw*3-5.2,-9.2);ctx.stroke();
  }
  ctx.restore();
}
/* ── проход ──
   Шли по этому лугу однажды, и мат отдаёт ровно это: столько-то тел, с тем-то
   в руках, в ту сторону. За каждым тянется остывающий след — свет, который они
   выжгли ногами и который гаснет позади. */
function peepGhosts(camx,camy){
  const S=G.surf,P=S&&S.peep;
  if(!P||(P.dk||0)<.22||P.ph<=0)return;
  const sc=P.scene,tr=S.tr,dk=P.dk;
  const u=P.ph/PEEP_PASS;
  const pos=[];
  for(let i=0;i<sc.n;i++){
    let uu=u-i*sc.lag;
    let face=sc.dir;
    /* такт: один останавливается на середине и оборачивается назад. Такт 2 —
       то же, но оборачивается идущий ПЕРВЫМ, то есть ждёт отставших. */
    const who=sc.beat===1?sc.n-1:(sc.beat===2?0:-1);
    if(i===who){
      const A=.44,B=.60;
      if(uu>=A&&uu<B){face=-sc.dir;uu=A;}
      else if(uu>=B)uu-=B-A;
    }
    if(uu<0||uu>1)continue;
    const wx=P.x-sc.dir*P.r+sc.dir*uu*P.r*2;
    const wy=groundAt(tr,wx);
    const a=dk*.62*clamp(Math.min(uu,1-uu)*7,0,1);
    pos.push({x:wx-camx,y:wy-camy,face,a,ph:uu*P.r*2*.14,i});
  }
  if(!pos.length)return;
  ctx.save();ctx.globalCompositeOperation="lighter";
  /* след: свет остывает позади идущего */
  for(const q of pos){
    /* след — полоса, а не цепочка пятен: пятна читались как брошенные предметы */
    /* след теплее и ярче мата (хвост M118): иначе тонет в его же свечении */
    const g=ctx.createLinearGradient(q.x,0,q.x-sc.dir*90,0);
    g.addColorStop(0,"rgba(255,238,196,"+(q.a*.62).toFixed(3)+")");
    g.addColorStop(1,"rgba(255,238,196,0)");
    ctx.fillStyle=g;
    ctx.beginPath();ctx.ellipse(q.x-sc.dir*44,q.y+.5,46,2.2,0,0,TAU);ctx.fill();
  }
  /* ношу на двоих рисуем между первыми двумя: шест по плечам, носилки по поясу */
  if(pos.length>1&&(sc.load==="шест"||sc.load==="носилки")){
    const A=pos[0],B=pos[1],a=Math.min(A.a,B.a);
    const hy=sc.load==="шест"?-17.6:-11;        /* по плечам или по поясу */
    /* жердь кончается в руках, а не в туловище: во весь пролёт она прошивала
       переднего насквозь и читалась как копьё */
    const ax=A.x,ay=A.y+hy,bx=B.x,by=B.y+hy;
    const d=Math.max(1,Math.hypot(bx-ax,by-ay)), k=4.5/d;
    const x1=ax+(bx-ax)*k, y1=ay+(by-ay)*k, x2=bx-(bx-ax)*k, y2=by-(by-ay)*k;
    ctx.strokeStyle=rgba(PEEP_LIT,Math.min(1,a*1.9));ctx.lineWidth=sc.load==="шест"?2.2:3;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    if(sc.load==="носилки"){
      /* на носилках лежит тело: свёрток вдоль жерди, без единого пояснения */
      const mx=(x1+x2)/2,my=(y1+y2)/2;
      ctx.fillStyle=rgba(PEEP_LIT,Math.min(1,a*1.3));
      ctx.beginPath();ctx.ellipse(mx,my-3,d*.3,3.2,Math.atan2(y2-y1,x2-x1),0,TAU);ctx.fill();
    }
  }
  const solo=(sc.load==="шест"||sc.load==="носилки")?"":sc.load;
  /* ношу в одиночку несёт только первый: ящик у каждого — это уже склад на ходу */
  for(const q of pos)peepFigure(q.x,q.y,q.face,q.ph,q.a,q.i===0?solo:"");
  ctx.restore();
}
