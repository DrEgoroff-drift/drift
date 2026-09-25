/* ══════════════ чья земля — за пять секунд: жест первого корабля и пост (M452, DESIGN-review §2.1) ══════════════
   Через пять секунд после прыжка один корабль хозяина делает с вами одну
   характерную вещь — это дешевле шести архитектур и это И ЕСТЬ характер,
   потому что характер — поведение (закон 2 границ: показать раньше, чем сказать).

     ГЛАВТРАССА — пикет встаёт борт о борт, прожектор проходит по корпусу,
                  «Записываю»; в КНИЖКЕ: «Проследовал. Замечаний нет.»
     Компания   — дрон с экраном встаёт перед носом: «Добро пожаловать,
                  партнёр!» — и счёт, где пролёт бесплатный, а оформление нет
     Орднунг    — плоскость досмотра проходит по корпусу от кормы к носу
     Коммуна    — никто не приходит. Бакен с доской «ОБЕД. ВЕРНУСЬ»
     Рассвет    — буксир: «чинить есть что?», а при целом корпусе — «ну хоть покрась»
     Хай-Фронт  — дрон-камера встаёт на неизменном отступе и идёт с вами до дока

   Пост у входа — фон, не сцена: ферма, доска со словом хозяина, одна лампа;
   печётся один раз на систему. Жест виден при каждом прибытии; сказанное (эфир,
   КНИЖКА) — не чаще раза в игровые сутки на систему, иначе дом заговорит.
   Не сделано из пункта (в плане): форма «цель визита» на пульте, покраска
   панели за 5 кр, состояния фронт / свежая оккупация / Ялта. */
const GEST_T={gt:14,co:8,or:4,km:0,ra:9,hf:90};   /* сколько секунд длится жест */
const GEST_POST={gt:"ПОСТ ТРАССЫ № ",co:"ЗОНА ПАРТНЁРА™",or:"КПП · ЭКЗ. 1 ИЗ 3",
  km:"ОБЕД. ВЕРНУСЬ",ra:"ЗАХОДИ, БРАТ",hf:"◉"};
let GEST=null;
const GEST_SAID={};                                /* "sx,sy" → игровые сутки последних слов */
function gestOwner(sx,sy){
  const o=(typeof chronOwnerKey==="function")?chronOwnerKey(sx,sy):null;
  if(o&&GEST_T[o]!==undefined)return o;
  const st=G.sys&&G.sys.station;
  return (st&&st.by&&GEST_T[st.by]!==undefined)?st.by:null;
}
/* зовёт прыжок (18-mode-map), когда корабль уже стоит у входа */
function gestArrive(){
  const by=gestOwner(G.sx,G.sy);
  if(!by){GEST=null;return;}
  const key=G.sx+","+G.sy,day=celDay();
  GEST={sx:G.sx,sy:G.sy,by,t0:G.t,said:GEST_SAID[key]===day,fired:{},
    seed:hashi(G.sx,G.sy,0x6E57)>>>0};
  GEST_SAID[key]=day;
  if(!GEST.said&&typeof sfx==="function")sfx("motif",{by});   /* позывной державы на радио (M457) */
}
function gestLive(){
  return GEST&&G.mode==="system"&&GEST.sx===G.sx&&GEST.sy===G.sy?GEST:null;
}
function gestAge(g){return (G.t-g.t0)/60;}
/* раз за прибытие: слово — только если в эти сутки его здесь ещё не было */
function gestOnce(g,id,at,fn){
  if(g.fired[id]||gestAge(g)<at)return;
  g.fired[id]=1;
  if(!g.said)fn();
}
function gestPostNo(g){return 10+g.seed%89;}
function gestTick(sh){
  const g=gestLive();if(!g)return;
  const P=(typeof POWERS!=="undefined"&&POWERS[g.by])||null,who=P?P.ru:"";
  if(g.by==="gt"){
    gestOnce(g,"say",4,()=>{
      etherLine("…пикет трассы. Идём рядом. Записываю.",who);
      const monthly=celDay()%30===0;
      if(typeof recordAdd==="function")recordAdd("пост трассы № "+gestPostNo(g),
        monthly?"Замечание: нет замечаний.":"Проследовал. Замечаний нет.");
    });
  }else if(g.by==="co"){
    gestOnce(g,"say",2,()=>{
      etherLine("Добро пожаловать, партнёр! Пролёт — 0 кр (акция). Сбор за оформление акции — 40 кр. Спасибо за выбор.",who);
    });
  }else if(g.by==="or"){
    gestOnce(g,"say",3.2,()=>{
      etherLine("Досмотр окончен. Цель визита: служебная. Экземпляр 1 из 3 — вам не выдаётся.",who);
    });
  }else if(g.by==="ra"){
    gestOnce(g,"say",3,()=>{
      const whole=G.hull>=stat().hullMax-.5;
      etherLine(whole?"…буксир. Целый? Ну хоть покрась, брат. Пять кредитов — одна панель."
        :"…буксир. Чинить есть что? Заходи, брат, посмотрим.",who);
    });
  }else if(g.by==="hf"){
    gestOnce(g,"say",3,()=>{etherLine("Ваш рейтинг доверия рассчитан. Спасибо.",who);});
  }
}
/* ── где стоит жест: всё — функция возраста и корабля ── */
function gestShipFrame(sh){
  const ca=Math.cos(sh.a),sa=Math.sin(sh.a);
  /* точка в системе корабля: f — вперёд по носу, r — вправо */
  return (f,r)=>({x:sh.x+ca*f-sa*r,y:sh.y+sa*f+ca*r});
}
function gestEase(u){u=clamp(u,0,1);return u*u*(3-2*u);}
/* кадр жеста — проход сцены (GPU, без 2D): корабли флота — fleetShipAt по своей матрице,
   прочее — фигуры набора (08c). Локальная рамка (x,y,поворот r,масштаб k) — как у 2D-кисти */
function gestAt(x,y,r,k){const c=Math.cos(r)*k,s=Math.sin(r)*k;return (u,v)=>[x+c*u-s*v,y+s*u+c*v];}
function gestRect(SH,P,x0,y0,w,h,C){gpuQuad(SH,P(x0,y0),P(x0+w,y0),P(x0+w,y0+h),P(x0,y0+h),C);}
function gestShip(f,x,y,r,s,al){const c=Math.cos(r)*s,q=Math.sin(r)*s;fleetShipAt(f,fleetArtOf(f),c,q,-q,c,x,y,al);}
function drawGesture(zx,zy,Z){
  const g=gestLive();if(!g||typeof fleetShipAt!=="function")return;
  const t=gestAge(g),T=GEST_T[g.by];
  if(g.by!=="km"&&t>T)return;
  const pass=gpuScene();if(!pass)return;
  const sh=G.ship,at=gestShipFrame(sh),s=fleetScale(Z)*.62;
  if(g.by==="gt"){
    /* пикет подходит с кормы слева, три секунды держится борт о борт и уходит */
    const inn=gestEase(t/3),out=gestEase((t-10)/4);
    const p=at(-260+260*inn+300*out,-(90+60*(1-inn)+120*out));
    const x=zx(p.x),y=zy(p.y);
    gestShip({k:"patrol",seed:g.seed,by:"gt"},x,y,sh.a-.08*out,s,1-out);
    /* прожектор — в drawGestureTop, поверх корпуса */
  }else if(g.by==="co"){
    /* дрон с экраном перед носом: бегущая строка — единственное насыщенное в кадре */
    const inn=gestEase(t/1.2),out=gestEase((t-6.5)/1.5);
    /* D8 (телефон 18.09): на ×1 экран дрона был 30×12 px — цветная крошка;
       ×1.35 — читается экраном с бегущей строкой */
    const p=at(70+80*(1-inn),60*out),x=zx(p.x),y=zy(p.y),k=clamp(Z,.6,1.5)*1.35,al=1-out;
    const P=gestAt(x,y,sh.a+Math.PI/2,k),SH=[];
    gestRect(SH,P,-15,-7,30,12,[32,38,46,al]);
    gestRect(SH,P,-13,-5.5,26,9,[11,16,22,al]);
    /* полосы строки — обрезаны рамкой экрана [-13,13] */
    const off=(G.t*.6)%40,cl=(x0,y0,w,h,C)=>{const a=Math.max(x0,-13),b=Math.min(x0+w,13);if(b>a)gestRect(SH,P,a,y0,b-a,h,C);};
    for(let i=-1;i<3;i++){
      const bx=-13+i*20-off*.5+20;
      cl(bx,-3.5,9,2,[255,90,170,.95*al]);cl(bx+11,-3.5,6,2,[90,230,255,.9*al]);cl(bx+2,.5,12,1.6,[255,230,120,.9*al]);
    }
    gestRect(SH,P,-2,5,4,2.5,[120,200,255,.6*al]);   /* подвес */
    gpuShapes(pass,SH);
  }else if(g.by==="or"){
    /* линия досмотра — в drawGestureTop, поверх корпуса */
  }else if(g.by==="ra"){
    /* буксир подходит от станции справа по носу, висит и отваливает */
    const inn=gestEase(t/2.5),out=gestEase((t-6.5)/2.5);
    const p=at(80+160*(1-inn)-60*out,70+120*(1-inn)+200*out);
    gestShip({k:"tug",seed:g.seed,by:"ra"},zx(p.x),zy(p.y),sh.a+Math.PI*.85,s,1-out);
  }else if(g.by==="hf"){
    /* дрон-камера: неизменный отступ, глаз всегда на вас; красная линия проходит один раз */
    const inn=gestEase(t/2),out=gestEase((t-T+2)/2);
    const p=at(-34-90*(1-inn),46+90*(1-inn)),x=zx(p.x),y=zy(p.y),k=clamp(Z,.6,1.5),al=1-out;
    const sx=zx(sh.x),sy=zy(sh.y),look=Math.atan2(sy-y,sx-x),P=gestAt(x,y,0,k),SH=[];
    SH.push([1,x,y,4.2*k,0,0,0,216,224,232,al]);
    for(const [u0,v0,u1,v1] of [[-7,-5,7,5],[-7,5,7,-5]]){const A=P(u0,v0),B=P(u1,v1);SH.push([2,A[0],A[1],B[0],B[1],.4*k,0,130,255,236,.5*al]);}
    const e=P(Math.cos(look)*1.8,Math.sin(look)*1.8),d=P(Math.cos(look)*2.2,Math.sin(look)*2.2);
    SH.push([1,e[0],e[1],2*k,0,0,0,16,22,28,al],[1,d[0],d[1],.8*k,0,0,0,255,70,70,.95*al]);
    if(t>1&&t<2){
      const u=t-1,R=30*shipScaleAt(Z),ex=sx+Math.cos(sh.a)*R*(1-2*u),ey=sy+Math.sin(sh.a)*R*(1-2*u);
      SH.push([2,x,y,ex,ey,.5,0,255,60,60,.7]);
    }
    gpuShapes(pass,SH);
  }
}
/* верх жеста — поверх корпуса игрока, как было у 2D-слоя: прожектор пикета и линия досмотра.
   Зовётся из 17-mode-system сразу после корпуса. 2D-слой ложился на сцену «поверх», не
   сложением, — поэтому здесь обычная смесь */
function drawGestureTop(zx,zy,Z){
  const g=gestLive();if(!g)return;
  const pass=gpuScene();if(!pass)return;
  const t=gestAge(g),sh=G.ship,at=gestShipFrame(sh);
  if(g.by==="gt"){
    /* прожектор: холодный конус низкой альфы, тёплый край на вашем корпусе */
    if(t>3&&t<7.5){
      const inn=gestEase(t/3),out=gestEase((t-10)/4);
      const p=at(-260+260*inn+300*out,-(90+60*(1-inn)+120*out)),x=zx(p.x),y=zy(p.y);
      const k=Math.sin(Math.PI*(t-3)/4.5),sw=Math.sin((t-3)*1.6)*22;
      const q=at(sw,0),hx=zx(q.x),hy=zy(q.y),R=16*shipScaleAt(Z);
      const a=Math.atan2(hy-y,hx-x),L=Math.hypot(hx-x,hy-y),hw=.16;
      /* градиент 2D вдоль оси (.30 → .09 у корпуса, дальше ровно) — полосами поперёк оси */
      const SH=[],N=14,ch=Math.cos(hw),E=(t,d)=>[x+Math.cos(a+d)*L*1.08*t,y+Math.sin(a+d)*L*1.08*t];
      for(let i=0;i<N;i++){const t0=i/N,t1=(i+1)/N,u=Math.min(1,(t0+t1)/2*1.08*ch);
        gpuQuad(SH,E(t0,-hw),E(t0,hw),E(t1,hw),E(t1,-hw),[200,225,255,(.30+(.09-.30)*u)*k],i<N-1?5:1);}
      SH.push([1,hx,hy,R,0,0,0,255,226,180,.16*k]);
      gpuShapes(pass,SH);
    }
  }else if(g.by==="or"){
    /* плоскость досмотра: одна линия во всю ширину кадра, от кормы к носу, один раз */
    if(t>1.5&&t<3.2){
      const u=(t-1.5)/1.7,L=40*shipScaleAt(Z)/Math.max(Z,.01);
      const p=at(-L*.6+L*1.2*u,0),x=zx(p.x),y=zy(p.y);
      const nx=-Math.sin(sh.a),ny=Math.cos(sh.a),D=Math.hypot(W,H),a=[x-nx*D,y-ny*D],b=[x+nx*D,y+ny*D];
      /* в 2D ореол и жила складывались внутри слоя (C=213, A=.89); подряд «поверх» жила .87 даёт тот же итог */
      gpuShapes(pass,[[2,a[0],a[1],b[0],b[1],3.5,0,235,245,255,.14],[2,a[0],a[1],b[0],b[1],.5,0,240,250,255,.87]]);
    }
  }
}
/* ── пост у входа: ферма, доска, лампа — печётся один раз на систему (GPU-холст) ── */
const GEST_POST_CV=new Map();
function gestPostSprite(by,text){
  return gpuBaked(GEST_POST_CV,by+"|"+text,360,210,c=>{
  c.scale(3,3);
  c.strokeStyle="rgba(150,164,180,.7)";c.lineWidth=1;              /* ферма */
  c.beginPath();c.moveTo(56,68);c.lineTo(56,30);c.moveTo(64,68);c.lineTo(64,30);
  for(let y=34;y<66;y+=8){c.moveTo(56,y);c.lineTo(64,y+8);c.moveTo(64,y);c.lineTo(56,y+8);}c.stroke();
  const P=(typeof POWERS!=="undefined"&&POWERS[by])||null;
  const ground=(typeof makerGround==="function")?makerGround(by):[120,120,120];
  c.fillStyle=rgba(mixc(ground,[20,24,30],.72),1);c.fillRect(8,6,104,24);          /* доска */
  c.strokeStyle=rgba(mixc(ground,[255,255,255],.2),.8);c.lineWidth=1.2;c.strokeRect(8,6,104,24);
  c.fillStyle=by==="km"?"rgba(250,236,210,.95)":rgba(mixc(ground,[255,255,255],.55),1);
  c.font=(by==="km"?"italic ":"")+"bold "+(text.length>14?9:11)+"px ui-monospace,monospace";
  c.textAlign="center";c.textBaseline="middle";c.fillText(text,60,18.5);
  if(P&&by==="gt"){c.fillStyle="rgba(210,50,40,.95)";c.font="11px sans-serif";c.fillText("★",18,18.5);}
  });
}
function drawGestPost(zx,zy,Z){
  const sys=G.sys;if(!sys)return;
  const by=gestOwner(G.sx,G.sy);if(!by)return;
  const E=sysEntry(G.sx,G.sy);
  /* поперёк входа, в стороне от точки прибытия — чтобы корабль не стоял на посту */
  const px=E.x-Math.sin(E.a)*140,py=E.y+Math.cos(E.a)*140;
  const x=zx(px),y=zy(py),k=clamp(Z,.6,1.5)*.9;
  if(x<-90||x>W+90||y<-90||y>H+90)return;
  const pass=gpuScene();if(!pass)return;
  const g=GEST&&GEST.sx===G.sx&&GEST.sy===G.sy?GEST:{seed:hashi(G.sx,G.sy,0x6E57)>>>0};
  const text=by==="gt"?GEST_POST.gt+gestPostNo(g):GEST_POST[by];
  const B=gestPostSprite(by,text);
  if(B)gpuImage(pass,B,[{x,y:y-33*k,w:120*k,h:70*k}]);
  /* одна лампа — у каждого своё движение: ровно, вращаясь, дыша */
  const col=(typeof laneLampCol==="function")?laneLampCol(by):[255,190,110];
  const ts=G.t/60;
  const lit=by==="gt"?.5+.5*Math.max(0,Math.cos(ts*3.2)):by==="km"?.55+.35*Math.sin(ts*1.1)
    :by==="or"?1:by==="co"?.7+.3*Math.sin(ts*5):by==="ra"?.6+.4*Math.abs(Math.sin(ts*.7+Math.sin(ts*2.3))):.8;
  const c=mixc(col,[255,255,255],.5);
  gpuShapes(pass,[[1,x,y-40*k,9*k,0,0,0,col[0],col[1],col[2],.22*lit],[1,x,y-40*k,1.8*k,0,0,0,c[0],c[1],c[2],.9*lit]],{blend:"add"});
}
