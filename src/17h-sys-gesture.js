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
function drawGesture(zx,zy,Z){
  const g=gestLive();if(!g||typeof drawFleetShip!=="function")return;
  const t=gestAge(g),T=GEST_T[g.by];
  if(g.by!=="km"&&t>T)return;
  const sh=G.ship,at=gestShipFrame(sh),s=fleetScale(Z)*.62;
  if(g.by==="gt"){
    /* пикет подходит с кормы слева, три секунды держится борт о борт и уходит */
    const inn=gestEase(t/3),out=gestEase((t-10)/4);
    const p=at(-260+260*inn+300*out,-(90+60*(1-inn)+120*out));
    const x=zx(p.x),y=zy(p.y);
    ctx.save();ctx.globalAlpha=1-out;ctx.translate(x,y);ctx.rotate(sh.a-.08*out);ctx.scale(s,s);
    drawFleetShip({k:"patrol",seed:g.seed,by:"gt"});
    ctx.restore();
    /* прожектор: холодный конус низкой альфы, тёплый край на вашем корпусе */
    if(t>3&&t<7.5){
      const k=Math.sin(Math.PI*(t-3)/4.5),sw=Math.sin((t-3)*1.6)*22;
      const q=at(sw,0),hx=zx(q.x),hy=zy(q.y),R=16*shipScaleAt(Z);
      const a=Math.atan2(hy-y,hx-x),L=Math.hypot(hx-x,hy-y),hw=.16;
      ctx.save();ctx.globalCompositeOperation="lighter";
      const gr=ctx.createLinearGradient(x,y,hx,hy);
      gr.addColorStop(0,"rgba(200,225,255,"+(.30*k).toFixed(3)+")");gr.addColorStop(1,"rgba(200,225,255,"+(.09*k).toFixed(3)+")");   /* D8: на телефоне конус в .20 едва читался */
      ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(x,y);
      ctx.lineTo(x+Math.cos(a-hw)*L*1.08,y+Math.sin(a-hw)*L*1.08);
      ctx.lineTo(x+Math.cos(a+hw)*L*1.08,y+Math.sin(a+hw)*L*1.08);ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba(255,226,180,"+(.16*k).toFixed(3)+")";
      ctx.beginPath();ctx.arc(hx,hy,R,0,TAU);ctx.fill();
      ctx.restore();
    }
  }else if(g.by==="co"){
    /* дрон с экраном перед носом: бегущая строка — единственное насыщенное в кадре */
    const inn=gestEase(t/1.2),out=gestEase((t-6.5)/1.5);
    /* D8 (телефон 18.09): на ×1 экран дрона был 30×12 px — цветная крошка;
       ×1.35 — читается экраном с бегущей строкой */
    const p=at(70+80*(1-inn),60*out),x=zx(p.x),y=zy(p.y),k=clamp(Z,.6,1.5)*1.35;
    ctx.save();ctx.globalAlpha=1-out;ctx.translate(x,y);ctx.rotate(sh.a+Math.PI/2);ctx.scale(k,k);
    ctx.fillStyle="#20262e";ctx.fillRect(-15,-7,30,12);
    ctx.fillStyle="#0b1016";ctx.fillRect(-13,-5.5,26,9);
    const off=(G.t*.6)%40;
    ctx.save();ctx.beginPath();ctx.rect(-13,-5.5,26,9);ctx.clip();
    for(let i=-1;i<3;i++){
      const bx=-13+i*20-off*.5+20;
      ctx.fillStyle="rgba(255,90,170,.95)";ctx.fillRect(bx,-3.5,9,2);
      ctx.fillStyle="rgba(90,230,255,.9)";ctx.fillRect(bx+11,-3.5,6,2);
      ctx.fillStyle="rgba(255,230,120,.9)";ctx.fillRect(bx+2,.5,12,1.6);
    }
    ctx.restore();
    ctx.fillStyle="rgba(120,200,255,.6)";ctx.fillRect(-2,5,4,2.5);   /* подвес */
    ctx.restore();
  }else if(g.by==="or"){
    /* плоскость досмотра: одна линия во всю ширину кадра, от кормы к носу, один раз */
    if(t>1.5&&t<3.2){
      const u=(t-1.5)/1.7,L=40*shipScaleAt(Z)/Math.max(Z,.01);
      const p=at(-L*.6+L*1.2*u,0),x=zx(p.x),y=zy(p.y);
      const nx=-Math.sin(sh.a),ny=Math.cos(sh.a),D=Math.hypot(W,H);
      ctx.save();ctx.globalCompositeOperation="lighter";
      ctx.strokeStyle="rgba(235,245,255,.14)";ctx.lineWidth=7;
      ctx.beginPath();ctx.moveTo(x-nx*D,y-ny*D);ctx.lineTo(x+nx*D,y+ny*D);ctx.stroke();
      ctx.strokeStyle="rgba(240,250,255,.75)";ctx.lineWidth=1;ctx.stroke();
      ctx.restore();
    }
  }else if(g.by==="ra"){
    /* буксир подходит от станции справа по носу, висит и отваливает */
    const inn=gestEase(t/2.5),out=gestEase((t-6.5)/2.5);
    const p=at(80+160*(1-inn)-60*out,70+120*(1-inn)+200*out);
    ctx.save();ctx.globalAlpha=1-out;ctx.translate(zx(p.x),zy(p.y));ctx.rotate(sh.a+Math.PI*.85);ctx.scale(s,s);
    drawFleetShip({k:"tug",seed:g.seed,by:"ra"});
    ctx.restore();
  }else if(g.by==="hf"){
    /* дрон-камера: неизменный отступ, глаз всегда на вас; красная линия проходит один раз */
    const inn=gestEase(t/2),out=gestEase((t-T+2)/2);
    const p=at(-34-90*(1-inn),46+90*(1-inn)),x=zx(p.x),y=zy(p.y),k=clamp(Z,.6,1.5);
    const sx=zx(sh.x),sy=zy(sh.y),look=Math.atan2(sy-y,sx-x);
    ctx.save();ctx.globalAlpha=1-out;ctx.translate(x,y);ctx.scale(k,k);
    ctx.fillStyle="#d8e0e8";ctx.beginPath();ctx.arc(0,0,4.2,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(130,255,236,.5)";ctx.lineWidth=.8;
    ctx.beginPath();ctx.moveTo(-7,-5);ctx.lineTo(7,5);ctx.moveTo(-7,5);ctx.lineTo(7,-5);ctx.stroke();
    ctx.fillStyle="#10161c";ctx.beginPath();ctx.arc(Math.cos(look)*1.8,Math.sin(look)*1.8,2,0,TAU);ctx.fill();
    ctx.fillStyle="rgba(255,70,70,.95)";ctx.beginPath();ctx.arc(Math.cos(look)*2.2,Math.sin(look)*2.2,.8,0,TAU);ctx.fill();
    ctx.restore();
    if(t>1&&t<2){
      const u=t-1,R=30*shipScaleAt(Z),ex=sx+Math.cos(sh.a)*R*(1-2*u),ey=sy+Math.sin(sh.a)*R*(1-2*u);
      ctx.strokeStyle="rgba(255,60,60,.7)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();
    }
  }
}
/* ── пост у входа: ферма, доска, лампа — печётся один раз на систему ── */
const GEST_POST_CV={};
function gestPostSprite(by,text){
  const key=by+"|"+text;if(GEST_POST_CV[key])return GEST_POST_CV[key];
  const SS=3,w=120,h=70,cv=document.createElement("canvas");cv.width=w*SS;cv.height=h*SS;
  const c=cv.getContext("2d");c.scale(SS,SS);
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
  return GEST_POST_CV[key]=cv;
}
function drawGestPost(zx,zy,Z){
  const sys=G.sys;if(!sys)return;
  const by=gestOwner(G.sx,G.sy);if(!by)return;
  const E=sysEntry(G.sx,G.sy);
  /* поперёк входа, в стороне от точки прибытия — чтобы корабль не стоял на посту */
  const px=E.x-Math.sin(E.a)*140,py=E.y+Math.cos(E.a)*140;
  const x=zx(px),y=zy(py),k=clamp(Z,.6,1.5)*.9;
  if(x<-90||x>W+90||y<-90||y>H+90)return;
  const g=GEST&&GEST.sx===G.sx&&GEST.sy===G.sy?GEST:{seed:hashi(G.sx,G.sy,0x6E57)>>>0};
  const text=by==="gt"?GEST_POST.gt+gestPostNo(g):GEST_POST[by];
  const cv=gestPostSprite(by,text);
  const pass=gpuScene();
  if(pass)gpuImage(pass,gpuMipTex(cv),[{x,y:y-33*k,w:120*k,h:70*k}]);
  else ctx.drawImage(cv,x-60*k,y-68*k,120*k,70*k);
  /* одна лампа — у каждого своё движение: ровно, вращаясь, дыша */
  const col=(typeof laneLampCol==="function")?laneLampCol(by):[255,190,110];
  const ts=G.t/60;
  const lit=by==="gt"?.5+.5*Math.max(0,Math.cos(ts*3.2)):by==="km"?.55+.35*Math.sin(ts*1.1)
    :by==="or"?1:by==="co"?.7+.3*Math.sin(ts*5):by==="ra"?.6+.4*Math.abs(Math.sin(ts*.7+Math.sin(ts*2.3))):.8;
  if(pass){const c=mixc(col,[255,255,255],.5);
    gpuShapes(pass,[[1,x,y-40*k,9*k,0,0,0,col[0],col[1],col[2],.22*lit],[1,x,y-40*k,1.8*k,0,0,0,c[0],c[1],c[2],.9*lit]],{blend:"add"});
    return;}
  ctx.save();ctx.globalCompositeOperation="lighter";
  ctx.fillStyle=rgba(col,.22*lit);ctx.beginPath();ctx.arc(x,y-40*k,9*k,0,TAU);ctx.fill();
  ctx.fillStyle=rgba(mixc(col,[255,255,255],.5),.9*lit);ctx.beginPath();ctx.arc(x,y-40*k,1.8*k,0,TAU);ctx.fill();
  ctx.restore();
}
