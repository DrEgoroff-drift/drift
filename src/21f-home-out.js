/* ══════════════ дом снаружи ══════════════
   M170. До сих пор дом жил на вкладке станции: картинка в панели, к которой
   нельзя подойти. Между тем это единственное место, про которое игра говорит
   «здесь вы дома», — и оно обязано СТОЯТЬ НА ЗЕМЛЕ: на своей планете, в своей
   системе, за своим забором, с окном, в котором горит свет.

   ПРАВИЛА ФАЙЛА:
   1. Место считается, а не хранится. Планета — первая твёрдая в системе дома,
      место на ней — из зерна: сохранение (v:4) не трогаем.
   2. Мерило — человек (17 px на поверхности, как везде). Дом — два с
      половиной, гараж шире дома, маяк выше всего.
   3. Дом РАСТЁТ теми же ступенями, что в панели (HOME_TIERS): угол, прихожая,
      гараж, витрина, мастерская, кабинет, жилая часть, причал с маяком. Что не
      построено — того снаружи нет.
   4. Ни одной подписи: дом узнают по крыльцу, свету в окне и дыму. */

/* планета дома: первая твёрдая в его системе — та же, на которую садятся */
function homePlanet(){
  const H=G.home;if(!H||!H.tier)return null;
  if(!starAt(H.sx,H.sy))return null;
  const sys=getSystem(H.sx,H.sy);
  if(!sys)return null;
  return sys.planets.find(p=>p.type!=="gas")||null;
}
/* мы сейчас на планете дома? */
function homeHereP(p){
  const H=G.home;
  if(!H||!H.tier||!p)return false;
  if(G.sx!==H.sx||G.sy!==H.sy)return false;
  const hp=homePlanet();
  return !!(hp&&(hp.idx|0)===(p.idx|0));
}
/* где именно он стоит: своё место на планете, поодаль от площадки */
function homeSpotX(p,tr){
  if(!homeHereP(p))return null;
  const W2=(tr&&tr.W)||4000;
  const r=rng(hashi(G.sx,G.sy,0x40E7));
  let x=420+r()*Math.max(240,W2-900);
  /* не на посадочной площадке: лендер садится сюда же и закрывал полдома
     собой (скрин автора, M242). Разъезд стал шире, и — главное — проверяется
     ПОСЛЕ зажима в границы мира: раньше зажим мог вернуть дом обратно на пад */
  const APART=760;
  if(Math.abs(x-tr.padX)<APART)x+=x<tr.padX?-APART:APART;
  /* и не вплотную к посёлку: оба места считаются своими зёрнами и однажды
     сошлись двор во двор — дом стоял прямо в чужой улице (самокритика M170) */
  if(typeof settleSpotX==="function"&&typeof settleCanLive==="function"&&settleCanLive(p)){
    const s=settleSpotX(p,tr);
    if(s!=null&&Math.abs(x-s)<620)x=s+(x<s?-620:620);
  }
  x=clamp(x,220,W2-220);
  if(Math.abs(x-tr.padX)<APART)
    x=clamp(tr.padX+(tr.padX>W2*.5?-APART:APART),220,W2-220);
  return x;
}
const HOME_MAN=17;                                    /* тот же человек, что везде */
/* палитра дома: местный камень и дерево, но теплее — это жильё, а не порода */
function homeOutPal(p){
  const pal=p.T.pal;
  const base=pal[Math.min(pal.length-1,2)];
  return {
    wall:sdMix(base,[176,150,116],.42),
    roof:sdMix(pal[1],[74,62,52],.5),
    wood:sdMix(base,[112,84,56],.6),
    stone:sdMix([128,126,120],base,.2),
    metal:[104,112,120],
    warm:[255,206,138]
  };
}
/* ── дом на поверхности ──
   Рисуется в порядке слоёв: тень, фундамент, тело, крыша, свет, пристройки,
   двор. Ступени добавляют части СЛЕВА НАПРАВО, как в панели, чтобы одно и то
   же владение читалось одинаково и снаружи, и внутри. */
function drawHomeOut(tr,camx,camy,p){
  const bx=homeSpotX(p,tr);if(bx==null)return;
  const sx=bx-camx;
  if(sx<-420||sx>W+420)return;
  const H0=G.home,tier=H0.tier|0;
  const pal=homeOutPal(p);
  const gy=groundAt(tr,bx)+2-camy;   /* дом стоит на срезанной полке (см. ниже) */
  const nite=(typeof surfNight==="function")?surfNight(p):0;
  const wind=(typeof WIND==="number")?WIND*2:0;
  const M=HOME_MAN;
  const plan=homePlan(p);                            /* план сеян (M307) */
  const w=M*plan.w, wallH=M*plan.wallH, roofH=M*plan.roofH;   /* дом: два с половиной роста */
  /* ── площадка ──
     Дом стоял прямо на склоне, и гараж повисал над обрывом (самокритика M170).
     Под жильё срезают полку — той же рукой, что в посёлке (12tb): подпорная
     стенка снизу, врез сверху, утоптанная земля между. */
  if(typeof sdTerrace==="function"){
    const span=w*3.2;
    sdTerrace({x0:bx-w*1.75,x1:bx+w*1.45,span,baseY:groundAt(tr,bx)+2,
               seed:hashi(G.sx,G.sy,0x40EC)},tr,camx,camy,
              {earth:sdMix(p.T.pal[Math.min(p.T.pal.length-1,3)],[92,74,52],.38),
               stone:pal.stone,wood:pal.wood},p);
  }
  /* двор: утоптанная площадка перед домом и тропа к ней */
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.18)";
  ctx.beginPath();ctx.ellipse(sx,gy+2,w*1.5,7,0,0,TAU);ctx.fill();
  ctx.fillStyle=sdRGB(sdMix(pal.wood,[200,186,150],.5));
  for(let i=0;i<16;i++){
    const t=i/15, px=sx-w*1.3+t*w*2.6;
    const py=groundAt(tr,bx+(px-sx))-camy;
    ctx.globalAlpha=.14+.1*Math.sin(t*6);
    ctx.beginPath();ctx.ellipse(px,py-1,7+t*3,2.4,0,0,TAU);ctx.fill();
  }
  ctx.globalAlpha=1;
  ctx.restore();
  /* ── гараж (ступень 3) — слева, шире и ниже дома ── */
  if(homeHas("garage")){
    const gw=M*3.1,gh=M*1.5,gx=sx-w*.5-gw*.55;
    const gyy=gy;                                     /* гараж стоит на той же полке */
    sdShadow(gx,gyy,gw,gh);
    sdBody(()=>ctx.rect(gx-gw/2,gyy-gh,gw,gh),sdRGB(sdMix(pal.wall,[0,0,0],.18)),null,.22);
    sdWallTex(gx-gw/2,gyy-gh,gw,gh,"plate",0x6A2,pal.wall);
    /* ворота: широкие, со створом и колеёй, ведущей к ним */
    ctx.fillStyle=sdRGB(sdMix(pal.metal,[0,0,0],.25));
    ctx.fillRect(gx-gw*.36,gyy-gh*.82,gw*.72,gh*.82);
    ctx.strokeStyle="rgba(226,236,240,.18)";ctx.lineWidth=1;
    for(let i=1;i<5;i++){
      const yy=gyy-gh*.82+gh*.82*i/5;
      ctx.beginPath();ctx.moveTo(gx-gw*.36,yy);ctx.lineTo(gx+gw*.36,yy);ctx.stroke();
    }
    ctx.fillStyle="rgba(0,0,0,.4)";ctx.fillRect(gx-.8,gyy-gh*.82,1.6,gh*.82);
    /* односкатная крыша к дому */
    ctx.fillStyle=sdRGB(pal.roof);
    ctx.beginPath();
    ctx.moveTo(gx-gw/2-3,gyy-gh);ctx.lineTo(gx+gw/2+3,gyy-gh-M*.5);
    ctx.lineTo(gx+gw/2+3,gyy-gh-M*.5+3);ctx.lineTo(gx-gw/2-3,gyy-gh+3);
    ctx.closePath();ctx.fill();
  }
  /* ── тело дома ── */
  const fh=Math.max(3,M*.22);
  ctx.fillStyle=sdRGB(sdMix(pal.stone,[0,0,0],.3));
  ctx.fillRect(sx-w/2-2,gy-fh,w+4,fh);
  const fr=rng(0x40E8);
  for(let xx=sx-w/2-1;xx<sx+w/2+1;xx+=5+fr()*3){
    ctx.fillStyle=sdRGB(sdMix(pal.stone,[0,0,0],.14+fr()*.22));
    ctx.fillRect(xx,gy-fh+fr()*1.4,4+fr()*3,fh-1);
  }
  /* дом отбрасывает тень: до M243 её не было вовсе — единственная постройка
     в игре, которая стояла на земле и ничего на неё не клала (закон 2) */
  if(typeof sdShadow==="function")sdShadow(sx,gy,w*1.15,wallH+roofH);
  sdBody(()=>ctx.rect(sx-w/2,gy-wallH,w,wallH-fh*.4),sdRGB(pal.wall),null,.24);
  const lg=ctx.createLinearGradient(sx-w/2,0,sx+w/2,0);
  lg.addColorStop(0,"rgba(0,0,0,.34)");lg.addColorStop(.55,"rgba(0,0,0,0)");
  lg.addColorStop(1,"rgba(255,240,214,.16)");
  ctx.fillStyle=lg;ctx.fillRect(sx-w/2,gy-wallH,w,wallH);
  sdWallTex(sx-w/2,gy-wallH,w,wallH,"log",0x40E9,pal.wall);
  sdRoof(sx-w/2,gy-wallH,w,roofH,plan.roofKind,{roof:pal.roof,
    roofLit:sdMix(pal.roof,[236,214,170],.34),roofDark:sdMix(pal.roof,[12,16,24],.4)},0x40EA);
  /* ── труба и дым: дом живой, пока в нём кто-то есть ──
     Труба стояла от КОНЬКА (`gy-wallH-roofH`), а сидит она на скате, и на её
     собственном x скат ниже конька — на двускатной крыше это всегда промах
     вверх, и труба висела в воздухе отдельным кубиком (скрин автора, M242).
     Считаем высоту ската в точке трубы и сажаем её туда, с посадкой в кровлю. */
  const chX=sx+w*.24, chW=M*.34, chH=M*.6;
  const roofY=gy-wallH-roofH*(1-Math.min(1,Math.abs(chX-sx)/(w*.5)));
  const chTop=roofY-chH+3;                    /* +3: труба входит В кровлю, а не стоит на ней */
  ctx.fillStyle=sdRGB(pal.stone);
  ctx.fillRect(chX,chTop,chW,chH);
  ctx.fillStyle="rgba(255,246,220,.16)";ctx.fillRect(chX,chTop,chW*.5,chH);
  /* оголовок: без него труба — просто кирпич, а с ним она труба */
  ctx.fillStyle=sdRGB(sdMix(pal.stone,[0,0,0],.25));
  ctx.fillRect(chX-1.5,chTop-2,chW+3,2.5);
  if(typeof sdSmoke==="function")
    sdSmoke(chX+chW*.5,chTop-3,wind,.7,3,9);
  /* окно: главный признак жилья — в нём свет */
  const ww=w*.26,wh=wallH*.30,wx=sx+w*plan.win,wy=gy-wallH*.70;
  sdWindow(wx,wy,ww,wh,{wall:pal.wall,wallDark:sdMix(pal.wall,[16,20,28],.42)},
    Math.max(nite,.25),7);
  if(homeHas("living")){                              /* жилая часть — второе окно */
    sdWindow(sx-w*.34,wy,ww*.8,wh*.9,{wall:pal.wall,wallDark:sdMix(pal.wall,[16,20,28],.42)},
      Math.max(nite,.2),11);
  }
  /* крыльцо и дверь: сюда и входят */
  const dw=w*.20,dh=wallH*.56,dX=sx+plan.doorSide*-.30*w;
  homeSigns(sx,gy,w,pal,tier,plan);                 /* признаки жизни по ступени (M307) */
  if(typeof sdDoor==="function")sdDoor(dX,gy,dw,dh,pal.wood,false);
  ctx.fillStyle=sdRGB(sdMix(pal.wood,[0,0,0],.2));
  ctx.fillRect(dX-3,gy-3,dw+6,3);
  ctx.fillRect(dX-4.5,gy-1.4,dw+9,1.4);
  ctx.strokeStyle=sdRGB(sdMix(pal.wood,[0,0,0],.32));ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(dX-2,gy-3);ctx.lineTo(dX-2,gy-dh-5);
  ctx.lineTo(dX+dw+2,gy-dh-5);ctx.lineTo(dX+dw+2,gy-3);ctx.stroke();
  /* фонарь над крыльцом — он и зовёт: ночью его видно раньше дома */
  const lx=dX+dw*.5,ly=gy-dh-8;
  ctx.fillStyle=sdRGB(sdMix(pal.metal,[0,0,0],.3));
  ctx.fillRect(lx-2.2,ly-3.4,4.4,3.4);
  const lampOn=nite>.12;
  ctx.fillStyle=lampOn?"rgba(255,206,138,.95)":"rgba(120,130,140,.6)";
  ctx.fillRect(lx-1.4,ly-1,2.8,2.4);
  if(lampOn){
    ctx.save();ctx.globalCompositeOperation="lighter";
    const g=ctx.createRadialGradient(lx,ly,1,lx,ly,M*2.6);
    g.addColorStop(0,"rgba(255,206,138,.30)");g.addColorStop(1,"rgba(255,180,110,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(lx,ly,M*2.6,0,TAU);ctx.fill();
    ctx.restore();
  }
  /* ── витрина (ступень 4): застеклённый шкаф у стены, видно снаружи ── */
  if(homeHas("case")){
    const cw=M*.9,ch=M*1.2,cx2=sx+w*.52;
    const cyy=gy;
    sdShadow(cx2,cyy,cw,ch);
    ctx.fillStyle=sdRGB(sdMix(pal.wood,[0,0,0],.3));
    ctx.fillRect(cx2-cw/2,cyy-ch,cw,ch);
    ctx.fillStyle="rgba(150,190,205,.35)";
    ctx.fillRect(cx2-cw/2+1.5,cyy-ch+1.5,cw-3,ch-3);
    ctx.fillStyle="rgba(226,246,255,.25)";
    ctx.beginPath();
    ctx.moveTo(cx2-cw/2+1.5,cyy-2);ctx.lineTo(cx2+cw/2-1.5,cyy-ch+1.5);
    ctx.lineTo(cx2+cw/2-1.5,cyy-ch+4);ctx.lineTo(cx2-cw/2+1.5,cyy+.5);ctx.closePath();ctx.fill();
  }
  /* ── причал с маяком (ступень 8): мачта выше всего, огонь мигает ── */
  if(homeHas("dock")){
    const mx=sx+w*1.15, myy=gy;
    ctx.strokeStyle=sdRGB(sdMix(pal.metal,[0,0,0],.2));ctx.lineWidth=2.4;
    ctx.beginPath();ctx.moveTo(mx,myy);ctx.lineTo(mx,myy-M*4.4);ctx.stroke();
    ctx.lineWidth=1.2;
    for(let i=1;i<4;i++){
      const yy=myy-M*4.4*i/4;
      ctx.beginPath();ctx.moveTo(mx-4,yy+4);ctx.lineTo(mx+4,yy-1);ctx.stroke();
      ctx.beginPath();ctx.moveTo(mx+4,yy+4);ctx.lineTo(mx-4,yy-1);ctx.stroke();
    }
    /* ── растяжки: мачта не палка (M245) ──
       Была вертикаль в два пикселя с тремя крестиками — «схема мачты». Две
       растяжки на Верле (18d) дают ей вес и ветер: они провисают и качаются
       вместе с бельём и тросом шахты, потому что WIND в игре один. */
    {
      const H0=M*4.4;
      if(!G.surf.vMast){
        G.surf.vMast=[-1,1].map(sgn=>{
          const R=vRope(6,0,0,H0*.24,{grav:.10,wind:.5,pinLast:true});
          R.p[R.p.length-1].x=sgn*M*1.5;R.p[R.p.length-1].y=H0;
          return {R,sgn};
        });
      }
      for(const g of G.surf.vMast){
        const last=g.R.p[g.R.p.length-1];
        last.x=g.sgn*M*1.5;last.y=H0;         /* нижний конец прибит к земле */
        vStep(g.R,1);
        vDrawRope(g.R,mx,myy-H0,sdRGB(sdMix(pal.metal,[0,0,0],.34)),1.1);
      }
    }
    const bl=(Math.sin(G.t*.06)+1)*.5;
    ctx.fillStyle="rgba(255,150,90,"+(.35+bl*.6).toFixed(2)+")";
    ctx.beginPath();ctx.arc(mx,myy-M*4.6,3.2,0,TAU);ctx.fill();
    ctx.save();ctx.globalCompositeOperation="lighter";
    const g2=ctx.createRadialGradient(mx,myy-M*4.6,1,mx,myy-M*4.6,M*3*(.5+bl));
    g2.addColorStop(0,"rgba(255,150,90,"+(.25*bl).toFixed(2)+")");
    g2.addColorStop(1,"rgba(255,120,60,0)");
    ctx.fillStyle=g2;ctx.beginPath();ctx.arc(mx,myy-M*4.6,M*3,0,TAU);ctx.fill();
    ctx.restore();
  }
  /* ── двор: поленница, бочка, верёвка — то же, чем живёт посёлок ── */
  if(typeof sdWoodpile==="function")
    sdWoodpile(sx+w*.62,gy,M*.7,M*.8,pal.wood,0x40EB);
  /* ── бельё на верёвке (M245) ──
     Первая настоящая ткань в игре: три полотнища на Верле (18d), подвешенные
     к верёвке, которая сама провисает. Ветер один и тот же — тот, что качает
     траву, растяжки мачты и трос шахты. Это и «одно движение» в кадре, и тот
     самый след жизни, которого дому не хватало по пяти проходам: бельё вешает
     человек, и по нему видно, что в доме живут. */
  if(homeHas("living")){
    /* место: чистый двор справа от дома, между стеной и мачтой — слева
       верёвка ложилась на крышу гаража и читалась пятном */
    const ax=sx+w*.58, ay=gy-M*2.25, dx=w*.62, dy=M*.30;
    if(!G.surf.vLine){
      G.surf.vLine=vRope(9,0,0,Math.hypot(dx,dy)/8*.97,
        {grav:.05,wind:.5,pinLast:true,dx:dx/8,dy:dy/8});
      /* мерило — человек: полотнище должно быть заметной долей роста (17 px),
         иначе три тряпки по пять пикселей читаются одним пятном. Их два, они
         крупные и висят, а не летят: ветер приглушён, тяжесть поднята */
      G.surf.vWash=[0,1].map(()=>vCloth(4,5,0,0,3.6,{grav:.20,wind:.30}));
    }
    const L=G.surf.vLine;
    L.p[0].x=0;L.p[0].y=0;L.p[8].x=dx;L.p[8].y=dy;
    vStep(L,1);
    ctx.strokeStyle=sdRGB(sdMix(pal.wood,[0,0,0],.3));ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(ax+dx,ay+dy);ctx.lineTo(ax+dx,gy);ctx.stroke();
    vDrawRope(L,ax,ay,"rgba(226,220,200,.45)",1);
    const WCOL=[[196,202,212],[186,158,124]];
    /* каждое полотнище занимает свою пятую часть верёвки и висит на ней
       точками, взятыми по длине: иначе три ткани сходились в одно пятно */
    G.surf.vWash.forEach((C,i)=>{
      const t0=.10+i*.46;
      for(let c=0;c<C.cols;c++){
        const rp=vRopeAt(L,t0+(c/(C.cols-1))*.26);
        const q=C.p[c];q.x=rp.x;q.y=rp.y;q.pin=true;
      }
      vStep(C,1);
      vDrawCloth(C,ax,ay,WCOL[i],.96);
    });
  }
  if(homeHas("shop")){                                /* мастерская — верстак во дворе */
    const tx=sx-w*.95, tyy=gy;
    ctx.fillStyle=sdRGB(sdMix(pal.wood,[0,0,0],.28));
    ctx.fillRect(tx-M*.7,tyy-M*.7,M*1.4,M*.16);
    ctx.fillRect(tx-M*.6,tyy-M*.55,M*.12,M*.55);
    ctx.fillRect(tx+M*.48,tyy-M*.55,M*.12,M*.55);
    ctx.fillStyle=sdRGB(pal.metal);
    ctx.fillRect(tx-M*.2,tyy-M*.86,M*.36,M*.18);      /* тиски */
  }
  /* тропа к двери: тёмная утоптанная полоса — по ней видно, что сюда ходят */
  ctx.fillStyle="rgba(0,0,0,.16)";
  ctx.beginPath();ctx.ellipse(dX+dw*.5,gy+1,M*1.1,3,0,0,TAU);ctx.fill();
  /* грядка (M204): ряд у стены, с той стороны, где не ходят к двери */
  if(typeof greenDraw==="function")greenDraw(sx+w*.58,gy,M*2.6,p);
}
/* дверь дома в мировых координатах: по ней считают, дошёл ли игрок */
function homeDoorX(tr,p){
  const bx=homeSpotX(p,tr);
  if(bx==null)return null;
  return bx-HOME_MAN*3.4*.30;
}

/* ── план дома сеется, а не задаётся (M307, правило происхождения) ──
   Дом был формулой: одна ширина, один скат, окно в одном месте у каждого
   игрока. Теперь план — от координат системы: ширина, высота стен, крутизна
   и материал крыши (лес — тёс, камень — черепица, лёд и песок — жесть),
   куда сдвинуто окно, с какой стороны крыльцо; и признаки жизни растут со
   ступенью — поленница, бочки, столбики ограды, антенна. Один и тот же дом
   у одного игрока стоит одинаково при каждом приходе. */
function homePlan(p){
  const h=hashi(G.sx|0,G.sy|0,0x40E0),r=rng(h);
  const t=p&&p.type;
  const roofKind=(t==="jungle")?"thatch":((t==="rocky"||t==="volcanic"||t==="desert"||t==="sand")?"tile":"plank");
  return {w:3.1+r()*.8,wallH:1.8+r()*.25,roofH:.8+r()*.4,roofKind,
    win:.04+r()*.14,doorSide:r()<.5?-1:1,pile:r()<.5?-1:1,seed:h};
}
function homeSigns(sx,gy,w,pal,tier,plan){
  const M=HOME_MAN,r=rng(plan.seed^0x51);
  /* поленница у стены — с первой ступени: в доме топят */
  if(tier>=1){
    const px=sx+plan.pile*(w*.5+M*.5), n=3+Math.min(3,tier);
    for(let row=0;row<2;row++)for(let i=0;i<n-row;i++){
      const x=px-(n-row)*2.2+i*4.4, y=gy-3-row*3.6;
      ctx.fillStyle=sdRGB(sdMix(pal.wood,[0,0,0],.15+r()*.2));
      ctx.beginPath();ctx.arc(x,y,2,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(236,214,170,.45)";ctx.beginPath();ctx.arc(x,y,.9,0,TAU);ctx.fill();
    }
  }
  /* бочки — со второй: хозяйство */
  if(tier>=2){
    const bx=sx-plan.pile*(w*.5+M*.9);
    for(let i=0;i<2;i++){
      const x=bx+i*7,h=M*.5;
      ctx.fillStyle=sdRGB(sdMix(pal.metal,[0,0,0],.25));ctx.fillRect(x-2.6,gy-h,5.2,h);
      ctx.fillStyle="rgba(226,236,240,.16)";ctx.fillRect(x-2.6,gy-h,1.4,h);
      ctx.fillStyle="rgba(0,0,0,.3)";ctx.fillRect(x-2.6,gy-h*.35,5.2,.8);ctx.fillRect(x-2.6,gy-h*.75,5.2,.8);
    }
  }
  /* столбики ограды — с третьей: двор стал двором */
  if(tier>=3){
    ctx.fillStyle=sdRGB(sdMix(pal.wood,[0,0,0],.3));
    const x0=sx-w*1.3,x1=sx+w*1.3;
    for(let x=x0;x<=x1;x+=M*.55){
      if(Math.abs(x-sx)<w*.7)continue;
      ctx.fillRect(x-.8,gy-M*.42,1.6,M*.42);
    }
    ctx.fillStyle="rgba(0,0,0,.28)";
    for(const [a,b] of [[x0,sx-w*.7],[sx+w*.7,x1]])ctx.fillRect(a,gy-M*.3,b-a,.9);
  }
}
