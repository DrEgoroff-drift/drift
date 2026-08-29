function drawHull(id,thrusting,braking,lvl,bank){
  const h=hullOf(id),blink=Math.sin(G.t*.07);
  lvl=lvl||0;
  const banked=bankTransform(bank||0);
  /* «брюхо» корпуса: смещённый тёмный силуэт проглядывает с той стороны, куда
     кренится корабль — вместе со сжатием по Y это читается как настоящий крен,
     а не плоская фигура, скользящая вбок */
  if(bank){
    ctx.save();ctx.translate(0,Math.sin(bank)*h.bw*.62);
    tracePoly(h.poly);ctx.fillStyle=rgba(h.dark,.85);ctx.fill();
    ctx.restore();
  }
  /* ── факелы ── */
  if(thrusting)for(const e of h.eng)drawFlame(e.x,e.y,e.r,1+lvl*.22,h.lux);
  else if(h.lux)for(const e of h.eng){
    /* на стоянке у люкса светится не зев, а КОЛЬЦО среза: холодная нить по
       ободу и тёмная глубина внутри — сопло видно и выключенным */
    const PAL=luxPal(h);
    ctx.fillStyle="rgba(8,12,18,.9)";
    ctx.beginPath();ctx.arc(e.x+e.r*.1,e.y,e.r*.6,0,TAU);ctx.fill();
    ctx.strokeStyle=rgba(mixc(PAL.trim,[255,244,214],.3),.9);ctx.lineWidth=.4;
    ctx.beginPath();ctx.arc(e.x+e.r*.1,e.y,e.r*.6,0,TAU);ctx.stroke();
    ctx.fillStyle="rgba(170,215,255,"+(.16+Math.random()*.1).toFixed(2)+")";
    ctx.beginPath();ctx.arc(e.x+e.r*.1,e.y,e.r*.3,0,TAU);ctx.fill();
  }
  else for(const e of h.eng){   // холостой ход — только тлеющее сопло
    ctx.fillStyle="rgba(255,140,70,"+(.2+Math.random()*.12).toFixed(2)+")";
    ctx.beginPath();ctx.arc(e.x+e.r*.1,e.y,e.r*.42,0,TAU);ctx.fill();
  }
  /* ── двигатель как ЖЕЛЕЗО ──
     Сопло было дыркой в корме с огоньком: у корабля не было двигателя, был
     источник факела. На честном виде сверху двигатель — толстая тёмная бочка,
     которая ТОРЧИТ за обвод: корпус кончился, а машина продолжается. У неё
     свои пояса жёсткости, светлая верхняя грань и чёрный зев внутри.
     Рисуется до корпуса, чтобы уйти под него, и не касается яхт: у тех своя
     школа сопел (кольцо среза с латунным пояском). */
  if(!h.yac)for(const e of h.eng){
    const bl=Math.max(3,e.r*2.4), br=e.r*1.05;
    const g=ctx.createLinearGradient(0,e.y-br,0,e.y+br);
    g.addColorStop(0,rgba(mixc(h.iron,[255,255,255],.30),1));
    g.addColorStop(.42,rgba(mixc(h.iron,[0,0,0],.42),1));
    g.addColorStop(1,rgba(mixc(h.iron,[0,0,0],.72),1));
    ctx.fillStyle=g;
    ctx.fillRect(e.x-bl*.1,e.y-br,bl,br*2);
    ctx.strokeStyle="rgba(0,0,0,.62)";ctx.lineWidth=.45;
    ctx.strokeRect(e.x-bl*.1,e.y-br,bl,br*2);
    ctx.fillStyle="rgba(0,0,0,.5)";                       // пояса жёсткости
    for(let k=1;k<3;k++)ctx.fillRect(e.x-bl*.1+bl*k/3,e.y-br,.6,br*2);
    ctx.fillStyle="rgba(255,255,255,.16)";
    ctx.fillRect(e.x-bl*.1,e.y-br,bl,.5);
    ctx.fillStyle="rgba(6,8,12,.95)";                     // зев
    ctx.beginPath();ctx.ellipse(e.x-bl*.06,e.y,br*.34,br*.74,0,0,TAU);ctx.fill();
    ctx.strokeStyle=rgba(mixc(h.iron,[255,255,255],.2),.8);ctx.lineWidth=.4;ctx.stroke();
  }
  if(braking){
    const f=4+Math.random()*6;
    ctx.fillStyle="rgba(127,230,216,.7)";
    for(const s of [-1,1]){
      const y=h.bw*.5*s;
      ctx.beginPath();ctx.moveTo(h.nose*.5,y-1.8);ctx.lineTo(h.nose*.5+f,y);
      ctx.lineTo(h.nose*.5,y+1.8);ctx.closePath();ctx.fill();
    }
  }
  /* ── радиаторы ── позади корпуса, как и крылья: пластина уходит под борт.
     Тёмная сторона смотрит в пустоту, рёбра идут поперёк — по ним панель и
     опознаётся как теплоотвод, а не как крыло */
  if(h.mark.rad)for(const R of h.mark.rad)for(const s of [1,-1]){
    const y0=profW(h.prof,R.x)*.9*s, y1=R.w*s;
    /* вынос на ДВУХ стойках: на одной панель висела расчёской в пустоте,
       и было непонятно, чем она держится */
    ctx.strokeStyle=rgba(h.steel,1);ctx.lineWidth=.5;
    ctx.beginPath();
    ctx.moveTo(R.x-R.l*.3,y0);ctx.lineTo(R.x-R.l*.3,y1);
    ctx.moveTo(R.x+R.l*.3,y0);ctx.lineTo(R.x+R.l*.3,y1);
    ctx.stroke();
    ctx.strokeStyle=rgba(h.steel,.7);ctx.lineWidth=.4;   // раскос между стойками
    ctx.beginPath();
    ctx.moveTo(R.x-R.l*.3,y0);ctx.lineTo(R.x+R.l*.3,(y0+y1)*.5);ctx.stroke();
    const g=ctx.createLinearGradient(R.x-R.l*.5,0,R.x+R.l*.5,0);
    g.addColorStop(0,rgba(h.radm,1));
    g.addColorStop(.5,rgba(mixc(h.radm,[70,76,86],.5),1));
    g.addColorStop(1,rgba(h.radm,1));
    ctx.fillStyle=g;
    ctx.fillRect(R.x-R.l*.5,Math.min(y1,y1+R.th*s)-(s>0?0:0),R.l,R.th*s);
    ctx.strokeStyle=rgba(h.steel,.8);ctx.lineWidth=.4;
    for(let k=1;k<6;k++){
      const gx=R.x-R.l*.5+R.l*k/6;
      ctx.beginPath();ctx.moveTo(gx,y1);ctx.lineTo(gx,y1+R.th*s);ctx.stroke();
    }
  }
  /* ── каркас буровика ── две балки вдоль борта и перемычки: шахта внутри,
     и это видно. Раньше «каркас вокруг шахты» из описания корабля никак не
     подтверждался силуэтом */
  if(h.mark.frame)for(const s of [1,-1]){
    const F=h.mark.frame, y=F.w*s;
    ctx.strokeStyle=rgba(h.steel,1);ctx.lineWidth=.9;
    ctx.beginPath();ctx.moveTo(F.x0,y*.55);ctx.lineTo(F.x0-Math.abs(F.x0-F.x1)*.12,y);
    ctx.lineTo(F.x1,y);ctx.lineTo(F.x1-2,y*.7);ctx.stroke();
    ctx.strokeStyle=rgba(h.steel,.75);ctx.lineWidth=.5;
    for(let k=0;k<4;k++){
      const t=(k+.5)/4, bx=lerp(F.x0,F.x1,t);
      ctx.beginPath();ctx.moveTo(bx,y);ctx.lineTo(bx+2.4,profW(h.prof,bx)*.9*s);ctx.stroke();
    }
  }
  /* ── крыло-манта люксовой яхты ── рисуется ДО корпуса: пластина уходит под
     борт, как и обычное крыло, иначе она читается наклейкой поверх */
  if(h.yac&&h.mark.lux&&h.mark.lux.wing&&h.mark.lux.form!=="spindle"){
    const W=h.mark.lux.wing,PAL=luxPal(h);
    for(const s of [1,-1]){
      const r0=profW(h.prof,W.x0)*.8*s, r1=profW(h.prof,W.x1)*.9*s;
      const tipX=W.x1-W.tipBack, tipY=W.span*s;
      ctx.beginPath();
      /* наплыв: кромка выходит из борта не прямой, а долгой пологой дугой от
         самого носа — крыло вырастает из тела, а не приставлено к нему */
      ctx.moveTo(h.nose*.72,profW(h.prof,h.nose*.72)*.7*s);
      ctx.quadraticCurveTo(W.x0+(h.nose*.72-W.x0)*.3,W.span*.06*s,W.x0,W.span*.13*s);
      ctx.bezierCurveTo(W.x0-(W.x0-tipX)*.35,W.span*.34*s,
                        tipX+W.tipBack*.9,W.span*.80*s, tipX,tipY);   // передняя кромка
      ctx.lineTo(tipX-W.tipBack*.35,W.span*.94*s);                    // законцовка
      ctx.bezierCurveTo(W.x1-W.tipBack*.2,W.span*.52*s,
                        W.x1+(W.x0-W.x1)*.18,W.span*.16*s, W.x1,r1);  // задняя кромка
      ctx.closePath();
      const g=ctx.createLinearGradient(0,r0,0,tipY);
      g.addColorStop(0,rgba(mixc(PAL.lac,[255,255,255],.16),1));
      g.addColorStop(.45,rgba(PAL.lac,1));
      g.addColorStop(1,rgba(mixc(PAL.lac,[0,0,0],.62),1));
      ctx.fillStyle=g;ctx.fill();
      ctx.strokeStyle=rgba(mixc(PAL.lac,[0,0,0],.7),1);ctx.lineWidth=.4;ctx.stroke();
      /* нить металла по передней кромке: тонкое крыло видно только кромкой */
      ctx.strokeStyle=rgba(mixc(PAL.trim,[255,244,214],.35),.85);ctx.lineWidth=.45;
      ctx.beginPath();
      ctx.moveTo(h.nose*.72,profW(h.prof,h.nose*.72)*.7*s);
      ctx.quadraticCurveTo(W.x0+(h.nose*.72-W.x0)*.3,W.span*.06*s,W.x0,W.span*.13*s);
      ctx.bezierCurveTo(W.x0-(W.x0-tipX)*.35,W.span*.34*s,
                        tipX+W.tipBack*.9,W.span*.80*s, tipX,tipY);
      ctx.stroke();
      /* один лонжерон: без него пластина плоская */
      ctx.strokeStyle="rgba(0,0,0,.3)";ctx.lineWidth=.4;
      ctx.beginPath();ctx.moveTo(W.x0-(W.x0-W.x1)*.3,r0*.9);
      ctx.lineTo(tipX+W.tipBack*.5,W.span*.82*s);ctx.stroke();
      /* тень веретена на крыло: единственное, что говорит, что гондола стоит
         НА пластине, а не нарисована на ней */
      for(const n of h.nacs){
        ctx.save();
        ctx.beginPath();                       // клип по самому крылу
        ctx.moveTo(h.nose*.72,profW(h.prof,h.nose*.72)*.7*s);
        ctx.quadraticCurveTo(W.x0+(h.nose*.72-W.x0)*.3,W.span*.06*s,W.x0,W.span*.13*s);
        ctx.bezierCurveTo(W.x0-(W.x0-tipX)*.35,W.span*.34*s,
                          tipX+W.tipBack*.9,W.span*.80*s, tipX,tipY);
        ctx.lineTo(tipX-W.tipBack*.35,W.span*.94*s);
        ctx.bezierCurveTo(W.x1-W.tipBack*.2,W.span*.52*s,
                          W.x1+(W.x0-W.x1)*.18,W.span*.16*s, W.x1,r1);
        ctx.closePath();ctx.clip();
        ctx.fillStyle="rgba(0,0,0,.34)";
        ctx.fillRect(n.x-n.l*.5+SH_DX*1.4,n.y*s-n.r+SH_DY*1.4,n.l,n.r*2);
        /* и тень самого корпуса на крыло: корпус стоит выше пластины, значит
           на пластину он ложится — без этого крыло и тело в одной плоскости */
        ctx.translate(SH_DX*2.2,SH_DY*2.2);
        ctx.fillStyle="rgba(0,0,0,.3)";
        tracePoly(h.poly);ctx.fill();
        ctx.restore();
        break;
      }
    }
  }
  /* ── крылья ── */
  for(const w of h.wings)for(const s of [1,-1]){
    tracePoly(w,s);
    const g=ctx.createLinearGradient(0,-h.bw*3*s,0,h.bw*s);
    g.addColorStop(0,rgba(h.edge,1));g.addColorStop(1,rgba(h.dark,1));
    ctx.fillStyle=g;ctx.fill();
    /* та же пара, что у корпуса: тёмная кромка снаружи, светлый кант внутри */
    ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=.5;ctx.stroke();
    ctx.save();ctx.clip();
    ctx.strokeStyle=rgba(h.lite,.42);ctx.lineWidth=1;
    tracePoly(w,s);ctx.stroke();
    /* ── плоскость тоже СОБРАНА ──
       Крыло было залито одним тоном, и рядом с обшитым панелями корпусом
       читалось картонкой. На листах плоскость несёт то же, что борт: нервюры
       поперёк, разнотон секций, лючки и краску на законцовке. */
    if(!h.yac){
      let x0=1e9,x1=-1e9,ymax=0;
      for(const p of w){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);ymax=Math.max(ymax,Math.abs(p[1]));}
      const seg=4+((h.seed>>>9)&3);
      for(let k=0;k<seg;k++){
        const a=((hashi(k,h.seed,0x1D7)&15)/15-.5)*.16;
        ctx.fillStyle=(a>0?"rgba(255,255,255,":"rgba(0,0,0,")+Math.abs(a).toFixed(3)+")";
        ctx.fillRect(x0+(x1-x0)*k/seg,-ymax*s-(s>0?0:0),(x1-x0)/seg,ymax*2*s);
        ctx.fillStyle="rgba(0,0,0,.34)";                       // нервюра
        ctx.fillRect(x0+(x1-x0)*k/seg,-ymax*s,.55,ymax*2*s);
      }
      /* законцовочная балка и краска на ней: край плоскости на листах всегда
         жирнее самой плоскости — по нему её и видно на фоне */
      ctx.fillStyle=rgba(mixc(h.iron,[0,0,0],.25),1);
      ctx.fillRect(x0,ymax*.93*s-(s>0?0:.9),x1-x0,.9*s);
      ctx.fillStyle=rgba(h.accent,.95);
      ctx.fillRect(x0+(x1-x0)*.52,ymax*.72*s-(s>0?0:1.1),(x1-x0)*.34,1.1*s);
    }
    ctx.restore();
    ctx.strokeStyle=rgba(h.dark,.8);ctx.lineWidth=.45;   // лонжерон
    ctx.beginPath();ctx.moveTo(w[0][0],w[0][1]*s*.55);ctx.lineTo(w[2][0],w[2][1]*s*.8);ctx.stroke();
  }
  /* ── гондолы ── */
  for(const n of h.nacs)for(const s of [1,-1]){
    const y=n.y*s;
    /* пилон: у яхты крыла нет вовсе, и гондола держится на тонком кронштейне.
       Просвет между корпусом и гондолой — то, по чему яхту узнают: у всех
       остальных там крыло */
    if(h.mark.pylon){
      ctx.strokeStyle=rgba(h.col,.8);ctx.lineWidth=.6;
      ctx.beginPath();
      ctx.moveTo(n.x+n.l*.1,profW(h.prof,n.x)*.8*s);
      ctx.lineTo(n.x+n.l*.05,y-n.r*.6*s);ctx.stroke();
      ctx.strokeStyle=rgba(h.lite,.35);ctx.lineWidth=.7;
      ctx.beginPath();
      ctx.moveTo(n.x-n.l*.2,profW(h.prof,n.x)*.8*s);
      ctx.lineTo(n.x-n.l*.1,y-n.r*.6*s);ctx.stroke();
    }
    /* ── гондола люксовой яхты ──
       У всех она — ящик с хомутом, и на яхте это было самое дешёвое место
       кадра: два серых контейнера по бортам. Здесь она обтекаемая капля,
       полированная: тёмное тело, узкий зеркальный блик вдоль и латунная нить
       по разъёму. Форма следует не работе, а деньгам, и это честно. */
    if(h.lux){
      const PAL=luxPal(h),x0=n.x-n.l*.5,x1=n.x+n.l*.5;
      ctx.beginPath();
      ctx.moveTo(x1,y);
      ctx.bezierCurveTo(x1-n.l*.18,y-n.r,n.x,y-n.r,x0+n.l*.18,y-n.r*.86);
      ctx.quadraticCurveTo(x0,y-n.r*.7,x0,y);
      ctx.quadraticCurveTo(x0,y+n.r*.7,x0+n.l*.18,y+n.r*.86);
      ctx.bezierCurveTo(n.x,y+n.r,x1-n.l*.18,y+n.r,x1,y);
      ctx.closePath();
      const ng=ctx.createLinearGradient(0,y-n.r,0,y+n.r);
      ng.addColorStop(0,rgba(mixc(PAL.lac,[255,255,255],.42),1));
      ng.addColorStop(.30,rgba(mixc(PAL.lac,[255,255,255],.10),1));
      ng.addColorStop(.62,rgba(mixc(PAL.lac,[0,0,0],.35),1));
      ng.addColorStop(1,rgba(mixc(PAL.lac,[0,0,0],.6),1));
      ctx.fillStyle=ng;ctx.fill();
      ctx.strokeStyle=rgba(mixc(PAL.lac,[0,0,0],.72),1);ctx.lineWidth=.45;ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,.34)";            // зеркальная нить
      ctx.fillRect(x0+n.l*.2,y-n.r*.72,n.l*.62,.4);
      ctx.strokeStyle=rgba(mixc(PAL.trim,[60,40,14],.2),.95);ctx.lineWidth=.4;
      ctx.beginPath();                                  // латунь по разъёму
      ctx.moveTo(x0+n.l*.28,y-n.r*.9);ctx.lineTo(x0+n.l*.28,y+n.r*.9);ctx.stroke();
      ctx.fillStyle="rgba(10,14,20,.9)";                // тёмный зев сопла
      ctx.beginPath();ctx.ellipse(x0+.5,y,n.r*.28,n.r*.72,0,0,TAU);ctx.fill();
      ctx.strokeStyle=rgba(PAL.trim,.7);ctx.lineWidth=.35;ctx.stroke();
      /* игла впереди веретена: тонкий штырь с утолщением у основания.
         Вещь читается быстрой, пока стоит, — за счёт неё одной */
      const SP=h.mark.lux.spike;
      if(SP){
        ctx.strokeStyle=rgba(mixc(PAL.trim,[255,244,214],.4),.9);
        ctx.lineWidth=.5;
        ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x1+SP,y);ctx.stroke();
        ctx.fillStyle=rgba(mixc(PAL.lac,[255,255,255],.3),1);
        ctx.beginPath();
        ctx.moveTo(x1,y-n.r*.34);ctx.lineTo(x1+SP*.34,y-.28);
        ctx.lineTo(x1+SP*.34,y+.28);ctx.lineTo(x1,y+n.r*.34);
        ctx.closePath();ctx.fill();
      }
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(n.x+n.l*.5,y-n.r*.45);
    ctx.lineTo(n.x+n.l*.28,y-n.r);ctx.lineTo(n.x-n.l*.5,y-n.r);
    ctx.lineTo(n.x-n.l*.5,y+n.r);ctx.lineTo(n.x+n.l*.28,y+n.r);
    ctx.lineTo(n.x+n.l*.5,y+n.r*.45);ctx.closePath();
    /* ── агрегат темнее корпуса ──
       Гондола была того же тона, что борт, и корабль читался вырезанным из
       одного листа. На всех листах, по которым это рисуется, машина ТЕМНЕЕ
       обшивки: графит против кости. Светлая только верхняя грань — там, где
       на неё падает свет. Один этот сдвиг тона и даёт слоёность. */
    const g=ctx.createLinearGradient(0,y-n.r,0,y+n.r);
    g.addColorStop(0,rgba(mixc(h.iron,[255,255,255],.5),1));
    g.addColorStop(.35,rgba(mixc(h.iron,[255,255,255],.12),1));
    g.addColorStop(1,rgba(mixc(h.iron,[0,0,0],.45),1));
    ctx.fillStyle=g;ctx.fill();
    /* обвод гондолы: тонкий и непрозрачный, тем же приёмом, что и боксы */
    ctx.strokeStyle=rgba(mixc(h.col,[6,10,17],.4),1);ctx.lineWidth=.45;ctx.stroke();
    ctx.fillStyle=rgba(h.lite,.42);
    ctx.fillRect(n.x-n.l*.5,y-n.r,n.l*.78,.45);            // блик по верхней грани
    ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=.45;
    ctx.beginPath();ctx.moveTo(n.x+n.l*.16,y-n.r);ctx.lineTo(n.x+n.l*.16,y+n.r);ctx.stroke();
    ctx.strokeStyle=rgba(h.lite,.22);ctx.lineWidth=.4;      // хомут: две нити, а не одна жирная
    ctx.beginPath();ctx.moveTo(n.x+n.l*.16+.7,y-n.r);ctx.lineTo(n.x+n.l*.16+.7,y+n.r);ctx.stroke();
    ctx.strokeStyle="rgba(255,160,90,.5)";ctx.lineWidth=.5;
    ctx.beginPath();ctx.moveTo(n.x-n.l*.5,y-n.r);ctx.lineTo(n.x-n.l*.5,y+n.r);ctx.stroke();
  }
  /* ── корпус ── */
  tracePoly(h.poly);
  const bg=ctx.createLinearGradient(0,-h.bw*1.25,0,h.bw*1.25);
  /* ── плотность ──
     На крупном плане корабль просвечивал насквозь: гондола, крыло и бокс
     держали альфу меньше единицы, и сквозь навеску читался корпус. Ни один
     из листов, по которым это рисуется, не знает полупрозрачного металла:
     деталь либо закрывает то, что под ней, либо её нет. Все заливки корпуса
     и навески теперь непрозрачны, а глубину даёт тень и тон, а не просвет. */
  bg.addColorStop(0,rgba(h.lite,1));
  bg.addColorStop(.26,rgba(h.body,1));
  bg.addColorStop(.62,rgba(h.dark,1));
  bg.addColorStop(1,rgba(h.edge,1));
  ctx.fillStyle=bg;ctx.fill();
  ctx.save();ctx.clip();
  /* окраска: продольная полоса */
  const P=h.prof,S1=h.stripe;
  const i0=Math.floor(S1.from*(P.length-1)),i1=Math.ceil(S1.to*(P.length-1));
  /* акцент лежит по БОРТУ, а не по хребту: осевая полоса на виде сверху —
     это полоса на спине, её никто так не красит. Красят борт, потому что
     борт видно с земли и с соседнего корабля */
  const sa=h.yac?S1.a:.60, sb=h.yac?S1.b:.90;
  ctx.beginPath();
  for(let i=i0;i<=i1;i++)ctx.lineTo(P[i][0],-P[i][1]*sa);
  for(let i=i1;i>=i0;i--)ctx.lineTo(P[i][0],-P[i][1]*sb);
  /* ── акцентная панель ──
     На костяном борту цвет владельца работает не заливкой, а ЗАПЛАТОЙ: одна
     панель другого тона с тёмной окантовкой, как крашеный лист на белом
     грунте. Прежняя полупрозрачная полоса в .2 просто мылила борт. */
  ctx.closePath();ctx.fillStyle=rgba(h.accent,h.yac?.2:1);ctx.fill();
  if(!h.yac){
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.4;ctx.stroke();
    /* та же панель с другого борта: борт красят с обеих сторон */
    ctx.beginPath();
    for(let i=i0;i<=i1;i++)ctx.lineTo(P[i][0],P[i][1]*sa);
    for(let i=i1;i>=i0;i--)ctx.lineTo(P[i][0],P[i][1]*sb);
    ctx.closePath();ctx.fillStyle=rgba(h.accent,1);ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=.4;ctx.stroke();
    /* и вторая, короткая, у самой кормы: так метят машинное отделение */
    const ax0=lerp(h.tail,h.nose,.06), ax1=lerp(h.tail,h.nose,.20);
    ctx.fillStyle=rgba(mixc(h.accent,[0,0,0],.2),.8);
    ctx.beginPath();
    ctx.moveTo(ax0,-profW(P,ax0)*.9);ctx.lineTo(ax1,-profW(P,ax1)*.9);
    ctx.lineTo(ax1,-profW(P,ax1)*.44);ctx.lineTo(ax0,-profW(P,ax0)*.44);
    ctx.closePath();ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ax0,profW(P,ax0)*.9);ctx.lineTo(ax1,profW(P,ax1)*.9);
    ctx.lineTo(ax1,profW(P,ax1)*.44);ctx.lineTo(ax0,profW(P,ax0)*.44);
    ctx.closePath();ctx.fill();
  }
  /* панельные рёбра */
  ctx.strokeStyle="rgba(0,0,0,.34)";ctx.lineWidth=.75;
  for(const i of h.ribs){
    ctx.beginPath();ctx.moveTo(P[i][0],-P[i][1]);ctx.lineTo(P[i][0],P[i][1]);ctx.stroke();
  }
  ctx.strokeStyle="rgba(255,255,255,.09)";
  for(const f of [.34,.72]){
    ctx.beginPath();
    for(let i=0;i<P.length;i++)ctx.lineTo(P[i][0],-P[i][1]*f);
    ctx.stroke();
    ctx.beginPath();
    for(let i=0;i<P.length;i++)ctx.lineTo(P[i][0],P[i][1]*f);
    ctx.stroke();
  }
  /* ── обшивка панелями ──
     Контур был обведён в 1.25 px почти в полную яркость: на маленьком корабле
     это половина его ширины, и силуэт читался наклейкой с жирной каймой.
     Обводка утоньшена, а корпус вместо неё детализирован — тем, чем и должен
     быть детализирован металл: разнотоном листов, швами между ними, рядами
     заклёпок по шву и парой люков. Тонкая линия плюс фактура читается
     аккуратнее толстой линии без фактуры. */
  /* ── обшивка плитами ──
     Корабль собирают из панелей, и на любом честном виде сверху это первое,
     что видно: сетка плит с тёмными стыками, разнотон партий, ряд крепежа по
     шву. Прежний вариант делал только поперечные листы и вполсилы (разнотон
     в .09), отчего борт читался крашеной жестью. Плита теперь двумерная —
     стык и поперёк, и вдоль, — а разнотон вдвое сильнее: именно он даёт
     ощущение, что корпус СОБРАН, а не отлит. */
  const np=5+((h.seed>>>6)&3);
  if(h.lux)drawLuxeSkin(h);
  else for(let k=0;k<np;k++){
    const t0=k/np, t1=(k+1)/np;
    const x0=lerp(h.nose,h.tail,t0), x1=lerp(h.nose,h.tail,t1);
    const rows=2+(hashi(k,h.seed,0x31B)&1);        // сколько плит поперёк борта
    for(let j=0;j<rows;j++){
      const hh=hashi(k*7+j,h.seed,0x5A1E);
      const y0=-h.bw*1.3+j*(h.bw*2.6/rows), yh=h.bw*2.6/rows;
      const a=((hh&15)/15-.5)*.19;
      ctx.fillStyle=(a>0?"rgba(255,255,255,":"rgba(0,0,0,")+Math.abs(a).toFixed(3)+")";
      ctx.fillRect(Math.min(x0,x1),y0,Math.abs(x1-x0),yh);
      if(j){                                        // продольный стык плит
        ctx.fillStyle="rgba(0,0,0,.26)";
        ctx.fillRect(Math.min(x0,x1),y0-.3,Math.abs(x1-x0),.6);
      }
    }
    /* шов между листами: тёмная нить со светлой кромкой снизу */
    ctx.fillStyle="rgba(0,0,0,.38)";ctx.fillRect(x1-.4,-h.bw*1.3,.8,h.bw*2.6);
    ctx.fillStyle="rgba(255,255,255,.10)";ctx.fillRect(x1+.4,-h.bw*1.3,.5,h.bw*2.6);
    /* заклёпки по шву: точки в полпикселя — на расстоянии они дают зерно,
       вблизи читаются рядом крепежа */
    ctx.fillStyle="rgba(0,0,0,.3)";
    const pw2=profW(P,x1);
    for(let y=-pw2+1.2;y<pw2-.8;y+=1.7)ctx.fillRect(x1-1.4,y,.5,.5);
  }
  /* ── экранная изоляция ──
     Кусок корпуса у кормы укрыт мятой фольгой: тёплое матовое пятно с
     изломами, которое не красится в цвет владельца. Это второй материал в
     кадре после голого металла, и именно он читается как «космический
     аппарат», а не как крашеный самолёт. */
  if(h.mark.foil){
    const F=h.mark.foil;
    const fx0=lerp(h.tail,h.nose,F.a), fx1=lerp(h.tail,h.nose,F.b);
    ctx.fillStyle=rgba(mixc(h.foil,[10,12,16],.46),1);
    ctx.fillRect(Math.min(fx0,fx1),-h.bw*1.3,Math.abs(fx1-fx0),h.bw*2.6);
    /* изломы: короткие светлые и тёмные грани поперёк — фольгу мнут руками */
    for(let i=0;i<9;i++){
      const hh=hashi(i,h.seed,0xF010);
      const x=lerp(Math.min(fx0,fx1),Math.max(fx0,fx1),((hh>>>3)&31)/31);
      const y0=(((hh>>>9)&31)/31-.5)*h.bw*2.2;
      const ln=1.5+((hh>>>15)&7)*.5, ang=((hh>>>19)&7)/7*1.2-.6;
      ctx.strokeStyle=(hh&1)?"rgba(255,240,200,.16)":"rgba(0,0,0,.28)";
      ctx.lineWidth=.5;
      ctx.beginPath();ctx.moveTo(x,y0);
      ctx.lineTo(x+Math.cos(ang)*ln,y0+Math.sin(ang)*ln);ctx.stroke();
    }
  }
  /* люки: два прямоугольника со скруглением, всегда на борту, не по оси */
  if(!h.lux)for(let k=0;k<2;k++){
    const hh=hashi(k+11,h.seed,0x40C7);
    const hx=lerp(h.nose*.62,h.tail*.7,((hh>>>3)&15)/15);
    const pw2=profW(P,hx), hs=Math.min(3.2,pw2*.5);
    if(hs<1.2)continue;
    const hy=(k?1:-1)*pw2*.45;
    ctx.fillStyle="rgba(0,0,0,.20)";
    ctx.fillRect(hx-hs,hy-hs*.6,hs*2,hs*1.2);
    ctx.strokeStyle="rgba(255,255,255,.10)";ctx.lineWidth=.5;
    ctx.strokeRect(hx-hs,hy-hs*.6,hs*2,hs*1.2);
  }
  /* ── диск: кольца, а не блин ──
     Круглый корпус, залитый ровным тоном, читается монетой. На листах диск
     собран кольцевыми панелями с радиальными швами и рядом окон по ободу —
     и только это делает его кораблём, а не пятном. */
  if(h.form==="disc"){
    const cx=(h.nose+h.tail)*.5, R=h.bw*1.5;
    ctx.strokeStyle="rgba(0,0,0,.34)";ctx.lineWidth=.5;
    for(const f of [.42,.72,.92]){
      ctx.beginPath();ctx.ellipse(cx,0,R*f*.86,R*f,0,0,TAU);ctx.stroke();
    }
    for(let k=0;k<12;k++){                       // радиальные швы
      const a=k*TAU/12;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*R*.42*.86,Math.sin(a)*R*.42);
      ctx.lineTo(cx+Math.cos(a)*R*.92*.86,Math.sin(a)*R*.92);ctx.stroke();
    }
    ctx.fillStyle="rgba(186,232,250,.55)";       // окна по ободу
    for(let k=0;k<16;k++){
      const a=k*TAU/16;
      ctx.fillRect(cx+Math.cos(a)*R*.8*.86-.35,Math.sin(a)*R*.8-.35,.7,.7);
    }
    ctx.fillStyle=rgba(h.accent,.9);             // сектор краской
    ctx.beginPath();ctx.moveTo(cx,0);
    ctx.arc(cx,0,R*.9,-.5,-.1);ctx.closePath();ctx.fill();
  }
  if(!h.yac)drawStencils(h);
  /* навеска */
  for(const g of h.greeb){
    ctx.fillStyle=g[4]?"rgba(255,255,255,.13)":"rgba(0,0,0,.4)";
    if(g[4]){ctx.beginPath();ctx.arc(g[0],g[1],g[2]*.5,0,TAU);ctx.fill();}
    else ctx.fillRect(g[0],g[1],g[2],g[3]);
  }
  /* блик по хребту — съезжает поперёк корпуса при крене, будто по круглому боку */
  const bo=(bank||0)*h.bw*.9;
  const sp=ctx.createLinearGradient(0,-h.bw*.9+bo,0,-h.bw*.1+bo);
  sp.addColorStop(0,"rgba(255,255,255,0)");sp.addColorStop(1,"rgba(255,255,255,.14)");
  ctx.fillStyle=sp;ctx.fillRect(h.tail,-h.bw,h.len,h.bw*2);
  /* налёт прожитых часов — последним слоем и внутри обрезки по корпусу, чтобы
     ни одна царапина не вылезла за силуэт (12s-wear) */
  if(typeof drawWear==="function")drawWear(h,wearOf(id));
  /* швы починок — поверх налёта и тоже в обрезке: биография не смывается (12s) */
  if(typeof drawSeams==="function")drawSeams(h,typeof seamsOf==="function"?seamsOf(id):0);
  ctx.restore();
  /* ── грань корпуса ──
     Полупрозрачная линия в цвет корпуса — не грань, а ореол: вблизи она
     мылится и читается наклейкой. Настоящая грань состоит из двух вещей:
     непрозрачной тёмной кромки снаружи (там металл кончается) и светлого
     канта изнутри (там он ловит свет). Обе тоньше прежней одной. */
  tracePoly(h.poly);
  ctx.strokeStyle=rgba(h.dark,1);ctx.lineWidth=.5;ctx.stroke();
  ctx.save();ctx.clip();
  ctx.strokeStyle=rgba(h.lite,.55);ctx.lineWidth=1;   // половина уйдёт наружу за клип
  tracePoly(h.poly);ctx.stroke();
  ctx.restore();
  drawTierTrim(h);
  drawHullMarks(h);
  if(h.pirate)drawPirateSkin(h);
  if(typeof drawCrowns==="function")drawCrowns(h,id);
  /* ── боксы по бортам ──
     Были голым прямоугольником с полупрозрачной обводкой в .9: вдали сходило,
     вблизи (а игрок приближает часто — иначе корабль мелкий) читалось мыльной
     двойной линией вокруг пустоты. Правило, по которому теперь живёт вся
     навеска: обводка вдвое тоньше и НЕПРОЗРАЧНАЯ, а объём даёт не она, а
     светлая кромка со стороны света, тёмная с теневой и одно ребро внутри. */
  for(const p of h.pods)for(const s of (p[4]?[p[4]]:[1,-1])){
    const y=p[1]*s-(s>0?0:p[3]), w=p[2], hgt=p[3];
    const g=ctx.createLinearGradient(0,y,0,y+hgt);
    g.addColorStop(0,rgba(mixc(h.iron,[255,255,255],.18),1));
    g.addColorStop(1,rgba(mixc(h.iron,[0,0,0],.5),1));
    ctx.fillStyle=g;ctx.fillRect(p[0],y,w,hgt);
    ctx.fillStyle=rgba(mixc(h.iron,[255,255,255],.55),1);
    ctx.fillRect(p[0],y,w,.45);                                        // кромка света
    ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(p[0],y+hgt-.45,w,.45); // теневая
    ctx.strokeStyle=rgba(mixc(h.col,[6,10,17],.45),1);ctx.lineWidth=.45;
    ctx.strokeRect(p[0]+.22,y+.22,w-.44,hgt-.44);
    ctx.fillStyle="rgba(0,0,0,.32)";ctx.fillRect(p[0]+w*.62,y+.6,.5,hgt-1.2);
  }
  /* ── антенны ── */
  /* антенна тоже не обязана быть парной: половина мачт стоит с одного борта —
     последний кусок зеркальности, из-за которого корпус читался гербом */
  ctx.strokeStyle=rgba(h.col,.5);ctx.lineWidth=.5;
  for(const a of h.ants)for(const s of (a[4]?[a[4]]:[1,-1])){
    ctx.beginPath();ctx.moveTo(a[0],a[1]*s);
    ctx.lineTo(a[0]-a[2]*Math.sin(a[3]),(a[1]-a[2])*s);ctx.stroke();
  }
  /* ── фонарь кабины ── у кого есть рубка, фонаря нет: колпак истребителя на
     рудовозе был самой нелепой деталью листа */
  const cp=h.canopy;
  if(!h.mark.bridge){
  ctx.fillStyle="rgba(10,26,38,.95)";
  ctx.beginPath();ctx.ellipse(cp.x,0,cp.rx,cp.ry,0,0,TAU);ctx.fill();
  ctx.strokeStyle=rgba(h.lite,.6);ctx.lineWidth=.5;ctx.stroke();
  const cg=ctx.createLinearGradient(cp.x+cp.rx,0,cp.x-cp.rx,0);
  cg.addColorStop(0,"rgba(180,240,255,.55)");cg.addColorStop(1,"rgba(120,200,230,0)");
  ctx.fillStyle=cg;
  ctx.beginPath();ctx.ellipse(cp.x,0,cp.rx*.86,cp.ry*.72,0,0,TAU);ctx.fill();
  /* ── переплёт фонаря ──
     Голубой овал читался глазом, приклеенным к носу. У кабины есть переплёт:
     две-три поперечные рамы и продольный гребень. Стекло от этого перестаёт
     быть каплей краски и становится остеклением, за которым сидят. */
  if(!h.yac){
    ctx.strokeStyle="rgba(12,20,28,.85)";ctx.lineWidth=.45;
    for(let k=1;k<3;k++){
      const x=cp.x-cp.rx+cp.rx*2*k/3;
      const yr=cp.ry*Math.sqrt(Math.max(0,1-Math.pow((x-cp.x)/cp.rx,2)));
      ctx.beginPath();ctx.moveTo(x,-yr);ctx.lineTo(x,yr);ctx.stroke();
    }
    ctx.beginPath();ctx.moveTo(cp.x-cp.rx,0);ctx.lineTo(cp.x+cp.rx,0);ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,.22)";ctx.lineWidth=.35;
    ctx.beginPath();ctx.moveTo(cp.x-cp.rx*.5,-cp.ry*.5);ctx.lineTo(cp.x+cp.rx*.6,-cp.ry*.2);
    ctx.stroke();
  }
  }
  /* ── свет сверху и не-зеркальность (хвост M55, корабли) ──
     Корпус был симметричен и плоско освещён. Поверх обвода — градиент
     (свет слева-сверху, тень к правому борту) клипом по силуэту; и одна
     деталь по одному борту — штанга датчика с головкой, от семени, чтобы
     левый борт не был копией правого */
  {
    ctx.save();tracePoly(h.poly);ctx.clip();
    const lg=ctx.createLinearGradient(0,-h.bw,0,h.bw);
    lg.addColorStop(0,"rgba(255,248,230,.10)");lg.addColorStop(.5,"rgba(255,255,255,0)");lg.addColorStop(1,"rgba(0,0,10,.16)");
    ctx.fillStyle=lg;ctx.fillRect(h.tail-4,-h.bw-4,h.nose-h.tail+8,h.bw*2+8);
    ctx.restore();
    const hs=hashi(typeof id==="string"?id.length*31+id.charCodeAt(0):(id|0),0xA5,3), side=(hs&1)?1:-1;
    const bx=h.tail+(h.nose-h.tail)*(.35+((hs>>>1)&3)*.1), by=profW(h.prof,bx)*.9*side;
    ctx.strokeStyle=rgba(h.dark,.9);ctx.lineWidth=.7;
    ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-2,by+side*3.2);ctx.stroke();
    ctx.fillStyle=rgba(h.lite,.8);ctx.beginPath();ctx.arc(bx-2,by+side*3.2,.7,0,TAU);ctx.fill();
  }
  /* ── бортовые огни ── */
  /* Огни ставились по законцовке первого крыла, а при её отсутствии — по
     ±bw*1.6, то есть заведомо ЗА бортом: у рудовоза и яхты две точки висели
     в пустоте рядом с корпусом. Огонь горит на самой дальней точке борта,
     поэтому запасной вариант считается по обводу, а не по числу. */
  const on=blink>0;
  for(const [s,c] of [[-1,"255,80,70"],[1,"110,255,150"]]){
    let wy;
    if(h.wings.length)wy=h.wings[0][2];
    else{const lx=h.nose*.18;wy=[lx,-profW(h.prof,lx)*1.02];}
    /* у яхты огонь мельче: на узком борту точка в полтора радиуса читалась
       пуговицей, пришитой к обшивке */
    ctx.fillStyle="rgba("+c+","+(on?.95:.25)+")";
    ctx.beginPath();ctx.arc(wy[0],wy[1]*s,h.yac?.7:1.25,0,TAU);ctx.fill();
  }
  if(h.fin){
    ctx.strokeStyle=rgba(h.lite,.45);ctx.lineWidth=.5;
    ctx.beginPath();ctx.moveTo(h.tail*.65,0);ctx.lineTo(h.tail-3.5,0);ctx.stroke();
  }
  if(lvl>1){
    ctx.strokeStyle="rgba(180,240,255,"+(.16+lvl*.07).toFixed(2)+")";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(h.tail*.35,-h.bw-lvl*.7);ctx.lineTo(h.tail*.35,h.bw+lvl*.7);ctx.stroke();
  }
  if(banked)ctx.restore();
}
